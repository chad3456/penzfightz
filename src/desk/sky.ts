/**
 * Drawing the constellation.
 *
 * Ink on a dark ground: the same nib the map is drawn with, given a pale
 * colour instead of a brown one. Nothing here is stroked with `stroke()` — the
 * edges wander the way a pen wanders, which is the only reason fifty discs and
 * sixty lines read as a drawing rather than as a diagram.
 *
 * The whole picture is cached. It is redrawn when the window resizes or when
 * the thing under the pointer changes, and not otherwise; the only per-frame
 * work is one blit and a soft light that follows the pointer.
 */

import { line, nib, type Pt } from '../nightwalkers/paper';
import { measure, scribe } from '../nightwalkers/scribe';
import type { Graph, Node } from './constellation';

const PAPER = '#17140f';
const PALE = '#e9dcbd';
const DIM = 0.1;

export interface Fit {
  scale: number;
  ox: number;
  oy: number;
}

export function fit(graph: Graph, w: number, h: number): Fit {
  const pad = Math.min(96, Math.max(48, w * 0.05));
  const gw = graph.box.x1 - graph.box.x0;
  const gh = graph.box.y1 - graph.box.y0;
  const scale = Math.min((w - pad * 2) / gw, (h - pad * 2) / gh);
  return {
    scale,
    ox: w / 2 - ((graph.box.x0 + graph.box.x1) / 2) * scale,
    oy: h / 2 - ((graph.box.y0 + graph.box.y1) / 2) * scale,
  };
}

export const sx = (f: Fit, n: { x: number }) => n.x * f.scale + f.ox;
export const sy = (f: Fit, n: { y: number }) => n.y * f.scale + f.oy;

/**
 * One full drawing of the graph.
 *
 * `focus` is the node under the pointer, or −1. Focusing dims everything that
 * is not the node or one of its neighbours — which is the only way a picture
 * with sixty edges in it can answer the question "what does *this* one touch".
 */
export function render(
  g: CanvasRenderingContext2D,
  w: number,
  h: number,
  graph: Graph,
  focus: number,
) {
  const f = fit(graph, w, h);
  const { nodes, edges } = graph;

  g.save();
  g.fillStyle = PAPER;
  g.fillRect(0, 0, w, h);

  const lit = new Set<number>();
  if (focus >= 0) {
    lit.add(focus);
    for (const m of nodes[focus]!.to) lit.add(m);
  }
  const alpha = (i: number) => (focus < 0 ? 1 : lit.has(i) ? 1 : DIM);

  /* ── edges ─────────────────────────────────────────────────────────── */
  for (const [k, e] of edges.entries()) {
    const a = nodes[e.a]!;
    const b = nodes[e.b]!;
    const on = focus < 0 ? 0.32 : lit.has(e.a) && lit.has(e.b) ? 0.85 : DIM * 0.5;
    const ax = sx(f, a);
    const ay = sy(f, a);
    const bx = sx(f, b);
    const by = sy(f, b);
    // A shallow bow, so two edges between the same neighbourhood do not lie on
    // top of one another and read as one thicker line.
    const mx = (ax + bx) / 2;
    const my = (ay + by) / 2;
    const nx = -(by - ay);
    const ny = bx - ax;
    const len = Math.hypot(nx, ny) || 1;
    const bow = ((k % 5) - 2) * 5;
    const path: Pt[] = [
      [ax, ay],
      [mx + (nx / len) * bow, my + (ny / len) * bow],
      [bx, by],
    ];
    line(g, path, nib({
      ink: focus >= 0 && lit.has(e.a) && lit.has(e.b) ? '#f0dfb4' : PALE,
      width: 1.05,
      wobble: 1.5,
      alpha: on,
      passes: 1,
    }), k * 3.7 + 1);
  }

  /* ── nodes ─────────────────────────────────────────────────────────── */
  const taken: [number, number, number, number][] = [];
  // Works first, so a busy machine's label gives way to a title rather than
  // the other way round.
  const order = [...nodes.keys()].sort((i, j) => {
    const a = nodes[i]!;
    const b = nodes[j]!;
    if (a.kind !== b.kind) return a.kind === 'work' ? -1 : 1;
    return b.degree - a.degree;
  });

  for (const i of order) {
    const n = nodes[i]!;
    const x = sx(f, n);
    const y = sy(f, n);
    const a = alpha(i);
    const r = n.r * Math.min(1.1, Math.max(0.72, f.scale));

    g.save();
    g.globalAlpha = a;
    if (n.kind === 'work') {
      // A disc in the piece's own colour, with a halo so it sits off the dark.
      const grad = g.createRadialGradient(x, y, 0, x, y, r * 3.4);
      grad.addColorStop(0, `${n.ink}55`);
      grad.addColorStop(1, `${n.ink}00`);
      g.fillStyle = grad;
      g.fillRect(x - r * 3.4, y - r * 3.4, r * 6.8, r * 6.8);
      g.fillStyle = n.ink;
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fill();
      g.restore();
      circle(g, x, y, r, nib({ ink: PALE, width: 1.2, wobble: 0.7, alpha: a * 0.8 }), i);
    } else {
      g.restore();
      // Machinery is hollow: it is not a thing you can open, it is a thing
      // several of the things you can open are made out of.
      circle(g, x, y, r, nib({ ink: n.ink, width: 1.4, wobble: 0.8, alpha: a * 0.95 }), i);
      circle(g, x, y, r * 0.42, nib({ ink: n.ink, width: 1, wobble: 0.5, alpha: a * 0.6 }), i + 91);
    }

    /*
      Machinery is only named when it is worth the room.

      Fourteen engine labels on top of thirty-six titles is more lettering
      than the box holds, and the seven that only carry two pieces each were
      the ones sitting on top of somebody's name. The busy ones stay labelled
      because they are the argument the picture is making; the quiet ones give
      their name up when you point at them.
    */
    const named = n.kind === 'work' || n.degree >= 3 || (focus >= 0 && lit.has(i));
    if (named) label(g, n, x, y, r, a, taken, focus >= 0 && i === focus);
  }

  g.restore();
}

function circle(
  g: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  n: ReturnType<typeof nib>,
  seed: number,
) {
  const pts: Pt[] = [];
  const steps = Math.max(16, Math.round(r));
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  line(g, pts, n, seed);
}

function label(
  g: CanvasRenderingContext2D,
  n: Node,
  x: number,
  y: number,
  r: number,
  a: number,
  taken: [number, number, number, number][],
  isFocus: boolean,
) {
  const em = n.kind === 'work' ? 14 : 12;
  const text = n.label;
  const width = measure(text, 0.05) * em;

  /*
    Below the node, and lifted a line if that box is spoken for.

    Same rule as the names on the map, for the same reason: a picture with
    thirty-six titles in it turns into a word search the moment two of them
    overlap, and the one thing a label has to do is be readable.
  */
  let below = r + em * 0.95;
  let box: [number, number, number, number] | null = null;
  for (let tries = 0; tries < 4; tries++) {
    const b: [number, number, number, number] = [x - width / 2 - 3, y + below - em, width + 6, em * 1.12];
    const hits = taken.some((t) =>
      b[0] < t[0] + t[2] && b[0] + b[2] > t[0] && b[1] < t[1] + t[3] && b[1] + b[3] > t[1]);
    if (!hits) { box = b; break; }
    below += em * 1.2;
  }
  if (!box && !isFocus) return;
  if (box) taken.push(box);

  scribe(g, text, x, y + below, {
    size: em,
    nib: nib({
      ink: n.kind === 'work' ? PALE : n.ink,
      width: n.kind === 'work' ? 1.15 : 1,
      wobble: 0.35,
      tremble: 0.8,
      alpha: a * (n.kind === 'work' ? 0.95 : 0.8),
      passes: 1,
    }),
    align: 'center',
    tracking: 0.05,
    seed: text.length * 11 + text.charCodeAt(0),
  });
}
