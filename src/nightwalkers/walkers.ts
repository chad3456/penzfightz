/**
 * Everyone who is in the building tonight.
 *
 * A walker is a name, a position on the graph and a trail of footprints. It
 * picks somewhere to be, walks there along corridors, stands about for a while
 * and then picks somewhere else. That is the whole behaviour, and it is enough
 * — what makes the sheet feel inhabited is not clever routing, it is that two
 * names you were not watching have ended up in the same corridor while you
 * were looking somewhere else.
 */

import { buildGraph, nearest, route, WAY_BY_ID, WAYS, type Node, type Pt } from './plan';

export interface Print {
  x: number;
  z: number;
  a: number;
  /** Seconds since it was laid. */
  age: number;
  left: boolean;
}

export interface Walker {
  name: string;
  at: Pt;
  heading: number;
  speed: number;
  path: number[];
  leg: number;
  node: number;
  dwell: number;
  way: string;
  prints: Print[];
  foot: boolean;
  stride: number;
  you: boolean;
  /** Keeps a walker from sitting on top of the one it is talking to. */
  offset: number;
}

const NAMES = [
  'Hester Quill', 'Barnaby Ash', 'Winifred Loom', 'Ivo Plummer', 'Agnes Thorn',
  'Cassius Rook', 'Marguerite Dace', 'Perpetua Finch', 'Alban Swithin',
  'Nell Carrow', 'Ottoline Frost', 'Bram Tullis', 'Joss Wenlock',
  'Cecily Abbot', 'Rafferty Milne', 'Hildegard Pye', 'Dorian Crake',
  'Sabine Lark', 'Mordecai Stint', 'Prudence Hay', 'Tobias Grange',
  'Verity Ashdown', 'Gaudy, the porter', "the porter's cat",
];

const dist = (a: Pt, b: Pt) => Math.hypot(a[0] - b[0], a[1] - b[1]);

/** Fades a footprint out. Eight seconds is about how long a room stays busy. */
const PRINT_LIFE = 8.5;

export class Crowd {
  readonly nodes: Node[];
  readonly walkers: Walker[] = [];
  /** Secret passages whose mouths somebody has actually walked into. */
  readonly found = new Set<string>();
  you: Walker;

  private open: number[];
  private secret = new Set(WAYS.filter((w) => w.secret).map((w) => w.id));

  constructor(count = 21) {
    const { nodes } = buildGraph();
    this.nodes = nodes;
    // Where an ordinary walker is allowed to go: everywhere but the passages.
    this.open = nodes.filter((n) => !WAY_BY_ID.get(n.way)?.secret).map((n) => n.id);

    for (let i = 0; i < count; i++) {
      const start = this.open[Math.floor((i * 37 + 11) % this.open.length)]!;
      this.walkers.push(this.spawn(NAMES[i % NAMES.length]!, start, false));
    }
    // You start at the west door, which is where anybody arriving would be.
    this.you = this.spawn('you', nearest(nodes, [-40, -3], false), true);
    this.you.speed = 9;
    this.walkers.push(this.you);
  }

  private spawn(name: string, node: number, you: boolean): Walker {
    const n = this.nodes[node]!;
    return {
      name, at: [n.at[0], n.at[1]], heading: 0,
      speed: 2.4 + ((node * 13) % 10) / 9,
      path: [], leg: 0, node, dwell: (node % 7) * 0.6, way: n.way,
      prints: [], foot: false, stride: 0, you,
      offset: ((node * 29) % 7) / 7 - 0.5,
    };
  }

  /** Send a walker to a node. Returns false if there is no way through. */
  send(w: Walker, to: number): boolean {
    const path = route(this.nodes, w.node, to, w.you ? undefined : this.secret);
    if (path.length < 2) return false;
    w.path = path;
    w.leg = 1;
    w.dwell = 0;
    return true;
  }

  /** Send you to whatever is nearest a world point, secret ways included. */
  goTo(p: Pt): boolean {
    return this.send(this.you, nearest(this.nodes, p, true));
  }

  /**
   * Walk you toward a compass heading.
   *
   * There are no free-roaming coordinates here — everyone is on the graph — so
   * a key press picks the neighbouring node whose direction best matches and
   * walks to it. Held down it reads as continuous walking, and it can never
   * put you through a wall.
   */
  nudge(dx: number, dz: number) {
    const w = this.you;
    if (w.path.length > w.leg) return;
    const want = Math.atan2(dz, dx);
    let best = -1;
    let bestScore = -2;
    for (const m of this.nodes[w.node]!.to) {
      const t = this.nodes[m]!.at;
      const a = Math.atan2(t[1] - w.at[1], t[0] - w.at[0]);
      const score = Math.cos(a - want);
      if (score > bestScore) { bestScore = score; best = m; }
    }
    if (best >= 0 && bestScore > 0.1) {
      w.path = [w.node, best];
      w.leg = 1;
      w.dwell = 0;
    }
  }

  step(dt: number) {
    for (const w of this.walkers) {
      // Footprints fade whether or not anybody is walking.
      for (const p of w.prints) p.age += dt;
      while (w.prints.length && w.prints[0]!.age > PRINT_LIFE) w.prints.shift();

      if (w.path.length <= w.leg) {
        if (w.you) continue;
        w.dwell -= dt;
        if (w.dwell > 0) continue;
        // Somewhere new. Far enough away to be a walk rather than a shuffle.
        for (let tries = 0; tries < 6; tries++) {
          const to = this.open[Math.floor(Math.random() * this.open.length)]!;
          if (dist(this.nodes[to]!.at, w.at) < 18) continue;
          if (this.send(w, to)) break;
        }
        if (w.path.length <= w.leg) w.dwell = 1 + Math.random() * 3;
        continue;
      }

      const target = this.nodes[w.path[w.leg]!]!;
      const dx = target.at[0] - w.at[0];
      const dz = target.at[1] - w.at[1];
      const d = Math.hypot(dx, dz);
      const move = w.speed * dt;
      w.heading = Math.atan2(dz, dx);

      if (d <= move) {
        w.at = [target.at[0], target.at[1]];
        w.node = target.id;
        w.way = target.way;
        if (WAY_BY_ID.get(target.way)?.secret) this.found.add(target.way);
        w.leg++;
        if (w.leg >= w.path.length) {
          w.path = [];
          w.leg = 0;
          w.dwell = w.you ? 0 : 1.5 + Math.random() * 6;
        }
      } else {
        w.at = [w.at[0] + (dx / d) * move, w.at[1] + (dz / d) * move];
      }

      // A print every stride, alternating feet.
      w.stride += move;
      const strideLen = w.you ? 1.5 : 1.8;
      if (w.stride >= strideLen) {
        w.stride = 0;
        w.foot = !w.foot;
        const side = w.foot ? 1 : -1;
        w.prints.push({
          x: w.at[0] + Math.cos(w.heading + Math.PI / 2) * 0.55 * side,
          z: w.at[1] + Math.sin(w.heading + Math.PI / 2) * 0.55 * side,
          a: w.heading,
          age: 0,
          left: w.foot,
        });
        if (w.prints.length > 40) w.prints.shift();
      }
    }
  }

  /** What the caption should say for a walker. */
  where(w: Walker): string {
    return WAY_BY_ID.get(w.way)?.name ?? 'the grounds';
  }

  /** Whoever is close enough to you to be worth naming in the caption. */
  near(of: Walker, within = 16): Walker[] {
    return this.walkers
      .filter((w) => w !== of && dist(w.at, of.at) < within)
      .sort((a, b) => dist(a.at, of.at) - dist(b.at, of.at));
  }
}

export { PRINT_LIFE };
