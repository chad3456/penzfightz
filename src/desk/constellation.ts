/**
 * The constellation: every piece, and the machinery it shares with the others.
 *
 * ── Why a graph and not a grid ───────────────────────────────────────────
 *
 * A grid of thirty-six cards says these things are a list. They are not a
 * list. Half of them are ink and half are polygons and no two look alike, and
 * the thing that actually connects them is that the same dozen engines keep
 * turning up underneath. That is a graph, so this draws one.
 *
 * ── Why it settles and then stops ────────────────────────────────────────
 *
 * The layout is run to convergence once, synchronously, from a seeded start —
 * so it is the same picture every time the page opens, and it can be designed
 * against. A force graph left running is a lava lamp: it never holds still
 * long enough to be read, and every visit gives you a different drawing of the
 * same fact. After it settles, the only motion is a slow breath and whatever
 * you drag.
 */

import { MACHINES, WORKS, type Work } from './works';

export interface Node {
  id: string;
  kind: 'work' | 'machine';
  label: string;
  /** The piece, when this is one. */
  work?: Work;
  ink: string;
  r: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** How many edges it has, which is also how important it looks. */
  degree: number;
  /** Half the width its title will take, so the layout can keep titles apart. */
  half: number;
  to: number[];
}

export interface Edge {
  a: number;
  b: number;
}

export interface Graph {
  nodes: Node[];
  edges: Edge[];
  /** The bounding box the settled layout came out at. */
  box: { x0: number; y0: number; x1: number; y1: number };
}

const MACHINE_INK = '#9a8763';

/** A cheap deterministic hash, so the same start gives the same drawing. */
const rnd = (s: number) => {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export function buildGraph(): Graph {
  const nodes: Node[] = [];
  const index = new Map<string, number>();

  const add = (n: Omit<Node, 'x' | 'y' | 'vx' | 'vy' | 'degree' | 'to' | 'half'>) => {
    index.set(n.id, nodes.length);
    const i = nodes.length;
    // Seeded on a spiral rather than at random: a random start sometimes
    // wedges two clusters through each other and never gets them apart.
    const a = i * 2.399963;
    const r = 60 + Math.sqrt(i) * 52;
    nodes.push({
      ...n,
      x: Math.cos(a) * r, y: Math.sin(a) * r, vx: 0, vy: 0, degree: 0, to: [],
      // Roughly what the lettering will measure. The layout runs before there
      // is a canvas to measure on, and being ten per cent out here costs a
      // little air round a title; not doing it at all costs the title.
      half: Math.max(26, n.label.length * (n.kind === 'work' ? 3.9 : 3.1)),
    });
    return i;
  };

  for (const m of MACHINES) {
    add({ id: `m:${m.id}`, kind: 'machine', label: m.name, ink: MACHINE_INK, r: 7 });
  }
  for (const w of WORKS) {
    add({ id: `w:${w.id}`, kind: 'work', label: w.name, work: w, ink: w.ink, r: 11 });
  }

  const edges: Edge[] = [];
  for (const w of WORKS) {
    const a = index.get(`w:${w.id}`)!;
    for (const u of w.uses) {
      const b = index.get(`m:${u}`);
      if (b === undefined) continue;
      edges.push({ a, b });
      nodes[a]!.to.push(b);
      nodes[b]!.to.push(a);
      nodes[a]!.degree++;
      nodes[b]!.degree++;
    }
  }

  /*
    A piece that shares nothing is still part of the work.

    Six or seven of these import nothing anybody else imports — the water, the
    dragon, the frieze. Left unattached they drift to the edge of the canvas
    and sit there like errors. They are chained to their neighbours in time
    instead, which is a true relation: made the same week, by the same hands,
    out of the same argument.
  */
  const orphans = WORKS.filter((w) => w.uses.length === 0);
  for (let i = 1; i < orphans.length; i++) {
    const a = index.get(`w:${orphans[i - 1]!.id}`);
    const b = index.get(`w:${orphans[i]!.id}`);
    if (a === undefined || b === undefined) continue;
    edges.push({ a, b });
    nodes[a]!.to.push(b);
    nodes[b]!.to.push(a);
  }

  // Machinery is drawn at the size of how much of the work leans on it.
  for (const n of nodes) {
    n.r = n.kind === 'machine' ? 5 + Math.min(14, n.degree * 1.7) : 9 + Math.min(7, n.degree * 1.3);
  }

  /*
    A hub needs a ring big enough to hang its children's names round.

    Every spring the same length put eleven titles on a circle with room for
    four, and the middle of the picture — the press, the pad, the reading shell
    — came out as a knot. The rest length of an edge is now set by how busy the
    busier end of it is, which is the same arithmetic as asking how long a
    circumference has to be to take eleven labels.
  */
  const rest = edges.map((e) => {
    const deg = Math.max(nodes[e.a]!.degree, nodes[e.b]!.degree);
    return Math.min(250, 86 + (deg - 1) * 15);
  });

  settle(nodes, edges, rest);
  return { nodes, edges, box: bounds(nodes) };
}

/**
 * Repulsion, springs, and a weak pull to the middle.
 *
 * Fifty nodes means twelve hundred pairs, which at six hundred iterations is
 * about a million distance calculations — a few milliseconds, once, on the
 * main thread, while the page is still fading in. There is no case for a
 * quadtree at this size and every case against the extra code.
 */
function settle(nodes: Node[], edges: Edge[], rest: number[]) {
  const REPEL = 5200;
  const SPRING = 0.012;
  const CENTRE = 0.0016;
  const DAMP = 0.86;

  for (let step = 0; step < 620; step++) {
    // Cooling, so the last hundred steps tidy up rather than throw things about.
    const heat = 1 - step / 720;

    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i]!;
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j]!;
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let d2 = dx * dx + dy * dy;
        if (d2 < 1) {
          // Exactly coincident: nudge with the hash rather than with Math.random,
          // or the layout stops being the same picture twice.
          dx = rnd(i * 7 + j) - 0.5;
          dy = rnd(j * 13 + i) - 0.5;
          d2 = 1;
        }
        const d = Math.sqrt(d2);
        /*
          Clearance is an ellipse, not a circle.

          Nodes are eleven pixels across and their titles are a hundred and
          forty, so the thing two of them collide with is almost never the
          other disc — it is the other disc's name. Repelling on the radius
          alone left the middle of the picture, where the press and the pad
          and the ink all sit, as five overlapping captions.
        */
        const wantX = a.half + b.half + 8;
        const wantY = a.r + b.r + 34;
        const ex = dx / wantX;
        const ey = dy / wantY;
        const e = Math.hypot(ex, ey);
        const overlap = e < 1 ? (1 - e) * 20 : 0;
        const force = (REPEL / d2 + overlap) * heat;
        const fx = (dx / d) * force;
        const fy = (dy / d) * force;
        a.vx -= fx; a.vy -= fy;
        b.vx += fx; b.vy += fy;
      }
    }

    for (const [k, e] of edges.entries()) {
      const a = nodes[e.a]!;
      const b = nodes[e.b]!;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d = Math.hypot(dx, dy) || 1;
      const f = (d - rest[k]!) * SPRING * heat;
      const fx = (dx / d) * f;
      const fy = (dy / d) * f;
      a.vx += fx; a.vy += fy;
      b.vx -= fx; b.vy -= fy;
    }

    for (const n of nodes) {
      // Wider than tall: the page is a landscape window and a circular blob
      // wastes a third of it.
      n.vx -= n.x * CENTRE * 0.62;
      n.vy -= n.y * CENTRE * 1.5;
      n.vx *= DAMP;
      n.vy *= DAMP;
      n.x += Math.max(-24, Math.min(24, n.vx));
      n.y += Math.max(-24, Math.min(24, n.vy));
    }
  }
  for (const n of nodes) { n.vx = 0; n.vy = 0; }
}

function bounds(nodes: Node[]) {
  let x0 = Infinity; let y0 = Infinity; let x1 = -Infinity; let y1 = -Infinity;
  for (const n of nodes) {
    x0 = Math.min(x0, n.x - n.r); y0 = Math.min(y0, n.y - n.r);
    x1 = Math.max(x1, n.x + n.r); y1 = Math.max(y1, n.y + n.r);
  }
  return { x0, y0, x1, y1 };
}

/** Whoever is under the pointer, in graph coordinates. */
export function hit(nodes: Node[], x: number, y: number, slack = 16): number {
  let best = -1;
  let bestD = Infinity;
  for (const [i, n] of nodes.entries()) {
    const d = Math.hypot(n.x - x, n.y - y);
    if (d < n.r + slack && d < bestD) { bestD = d; best = i; }
  }
  return best;
}
