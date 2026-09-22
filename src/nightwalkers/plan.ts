/**
 * HALLOWDENE, in plan.
 *
 * ── What this is ─────────────────────────────────────────────────────────
 *
 * A survey of the same castle the `castle/` effect builds in bricks, in the
 * same coordinates: x runs east, z runs north, one unit is one stud. The hall
 * is at x −34…20 here because it is at x −34…20 there. Stand on the bridge in
 * the model and the map agrees with you, which is the entire point of having
 * a map of a place you can also walk around in.
 *
 * It is **not** a reproduction of anybody's school or anybody's map. The
 * castle is generic, the rooms are named for what they are, the incantations
 * are ours, and the four students whose map this is are invented.
 *
 * ── The two layers ───────────────────────────────────────────────────────
 *
 * `SHAPES` is what gets drawn: walls, towers, water, the wood, the rock.
 * `WAYS` is what gets walked: centrelines through corridors and across rooms,
 * from which a graph is generated. The two are kept separate because a
 * corridor drawn as a pair of walls and a corridor walked as a line down the
 * middle want completely different data, and every attempt to make one serve
 * both ends in a building nobody can get out of.
 */

export type Pt = [x: number, z: number];

/* ── drawn ────────────────────────────────────────────────────────────── */

export type Shape =
  | { t: 'rect'; x: number; z: number; w: number; d: number }
  | { t: 'disc'; x: number; z: number; r: number }
  | { t: 'poly'; pts: Pt[] };

export interface Piece {
  id: string;
  shape: Shape;
  /** How it is drawn. */
  kind: 'walled' | 'open' | 'rock' | 'wood' | 'deck' | 'water';
  /** Wall thickness, in studs. */
  wall?: number;
  label?: { text: string; at: Pt; size: number; angle?: number };
}

const R = (x: number, z: number, w: number, d: number): Shape => ({ t: 'rect', x, z, w, d });
const D = (x: number, z: number, r: number): Shape => ({ t: 'disc', x, z, r });

export const PIECES: Piece[] = [
  // ── the ground it all stands on
  { id: 'crag', shape: R(-50, -30, 110, 70), kind: 'rock' },
  { id: 'far-rock', shape: R(5, 47, 100, 72), kind: 'rock' },
  { id: 'shelf', shape: R(-90, -62, 34, 20), kind: 'rock' },

  // ── the great hall and its ends
  { id: 'hall-block', shape: R(-34, -16, 54, 26), kind: 'walled', wall: 2 },
  {
    id: 'hall', shape: R(-27, -14, 38, 22), kind: 'open',
    label: { text: 'The Great Hall', at: [-8, -3], size: 4.6 },
  },
  {
    id: 'screens', shape: R(-32, -14, 5, 22), kind: 'walled', wall: 1,
    label: { text: 'Screens', at: [-29.5, -3], size: 2.2, angle: -Math.PI / 2 },
  },
  {
    id: 'dais', shape: R(11, -14, 7, 22), kind: 'walled', wall: 1,
    label: { text: 'High Table', at: [14.5, -3], size: 2.2, angle: -Math.PI / 2 },
  },

  // ── towers
  {
    id: 'west-tower', shape: D(-34, -16, 7), kind: 'walled', wall: 2,
    label: { text: 'West Tower', at: [-34, -22.5], size: 2.6 },
  },
  {
    id: 'bell-tower', shape: D(-34, 10, 7), kind: 'walled', wall: 2,
    label: { text: 'Bell Tower', at: [-38, 16.5], size: 2.6 },
  },
  {
    id: 'clock-tower', shape: D(20, -16, 8), kind: 'walled', wall: 2,
    label: { text: 'The Clock', at: [22, -25.5], size: 2.8 },
  },
  {
    id: 'far-tower', shape: D(30, 76, 6), kind: 'walled', wall: 2,
    label: { text: 'Far Tower', at: [30, 84.5], size: 2.6 },
  },

  // ── the shaft
  {
    id: 'shaft', shape: D(34, 6, 14), kind: 'walled', wall: 2,
    label: { text: 'The Shaft', at: [34, 4], size: 4 },
  },

  // ── the quadrangle and its cloister
  { id: 'quad-block', shape: R(-40, 14, 40, 18), kind: 'walled', wall: 1.5 },
  {
    id: 'quad', shape: R(-38, 19, 36, 8), kind: 'open',
    label: { text: 'The Quadrangle', at: [-20, 30.5], size: 3.2 },
  },
  { id: 'cloister-s', shape: R(-38, 15, 36, 4), kind: 'open' },
  { id: 'cloister-n', shape: R(-38, 27, 36, 4), kind: 'open' },
  { id: 'well', shape: D(-20, 23, 3), kind: 'water' },

  // ── the links
  { id: 'low', shape: R(-24, 8, 6, 8), kind: 'walled', wall: 1 },
  {
    id: 'gallery', shape: R(-2, 20, 22, 6), kind: 'walled', wall: 1,
    label: { text: 'The Long Gallery', at: [9, 18], size: 2.6 },
  },
  { id: 'bridgehead', shape: R(13, 18, 11, 10), kind: 'walled', wall: 1.5 },
  {
    id: 'bridge', shape: R(15, 26, 7, 34), kind: 'deck',
    label: { text: 'The Long Bridge', at: [24.5, 43], size: 2.8, angle: -Math.PI / 2 },
  },

  // ── down at the water
  { id: 'boathouse', shape: R(-84, -58, 15, 11), kind: 'walled', wall: 1 },
  { id: 'jetty', shape: R(-68, -55, 22, 3), kind: 'deck' },
];

/** Labels that belong to the land rather than to a room. */
export const PLACES: { text: string; at: Pt; size: number; angle?: number }[] = [
  { text: 'The Wood', at: [58, 90], size: 5.4 },
  { text: 'The Lake', at: [-40, -74], size: 5.8, angle: 0.08 },
  { text: 'The Boathouse', at: [-76.5, -64], size: 2.6 },
  { text: 'The Cliff Stair', at: [-52, -32], size: 2.2, angle: -0.6 },
  { text: 'out of bounds', at: [70, 104], size: 2.4, angle: 0.05 },
];

/* ── walked ───────────────────────────────────────────────────────────── */

export interface Way {
  id: string;
  /** What the caption says when you are standing on it. */
  name: string;
  pts: Pt[];
  /** Hidden until someone walks it. */
  secret?: boolean;
  /** Outside, so the weather can be seen on it. */
  outside?: boolean;
}

export const WAYS: Way[] = [
  { id: 'hall', name: 'the Great Hall', pts: [[-26, -3], [13, -3]] },
  { id: 'hall-n', name: 'the Great Hall', pts: [[-20, -10], [-20, 4]] },
  { id: 'screens', name: 'the Screens Passage', pts: [[-29.5, -12], [-29.5, 6]] },
  { id: 'dais', name: 'the High Table', pts: [[13, -3], [16, -3]] },

  { id: 'west-tower', name: 'the West Tower stair', pts: [[-29.5, -12], [-34, -16]] },
  { id: 'bell-tower', name: 'the Bell Tower stair', pts: [[-29.5, 6], [-34, 10]] },
  { id: 'clock-tower', name: 'the Clock Tower stair', pts: [[16, -3], [19, -9], [20, -16]] },

  { id: 'low', name: 'the Low Corridor', pts: [[-21, -3], [-21, 17]] },
  { id: 'cloister-s', name: 'the South Walk', pts: [[-36, 17], [-4, 17]] },
  { id: 'cloister-n', name: 'the North Walk', pts: [[-36, 29], [-4, 29]] },
  { id: 'cloister-w', name: 'the West Walk', pts: [[-36, 17], [-36, 29]] },
  { id: 'cloister-e', name: 'the East Walk', pts: [[-4, 17], [-4, 29]] },
  { id: 'quad', name: 'the Quadrangle', pts: [[-30, 23], [-10, 23]], outside: true },

  { id: 'gallery', name: 'the Long Gallery', pts: [[-4, 23], [18, 23]] },
  { id: 'shaft-in', name: 'the foot of the Shaft', pts: [[18, 23], [24, 17], [28, 11]] },
  { id: 'shaft', name: 'the Shaft', pts: [[28, 11], [34, 14], [41, 9], [42, 2], [36, -3], [29, 1], [28, 8]] },

  { id: 'bridgehead', name: 'the Bridge Head', pts: [[18, 23], [18, 27]] },
  { id: 'bridge', name: 'the Long Bridge', pts: [[18, 27], [18, 58]], outside: true },

  { id: 'wood-path', name: 'the wood', pts: [[18, 58], [24, 66], [33, 73], [46, 82], [62, 92]], outside: true },
  { id: 'wood-branch', name: 'the deep wood', pts: [[33, 73], [40, 88], [52, 100], [70, 106]], outside: true },
  { id: 'far-tower', name: 'the Far Tower', pts: [[33, 73], [30, 76]], outside: true },

  { id: 'west-door', name: 'the west door', pts: [[-26, -3], [-44, -3]], outside: true },
  { id: 'terrace', name: 'the terrace', pts: [[-44, -3], [-47, -16], [-50, -26]], outside: true },
  { id: 'cliff', name: 'the Cliff Stair', pts: [[-50, -26], [-56, -37], [-64, -46]], outside: true },
  { id: 'shore', name: 'the shore path', pts: [[-64, -46], [-76, -50]], outside: true },
  { id: 'boathouse', name: 'the Boathouse', pts: [[-76, -50], [-76.5, -55]], outside: true },
  { id: 'jetty', name: 'the jetty', pts: [[-68, -53], [-48, -53]], outside: true },
  { id: 'jetty-link', name: 'the jetty', pts: [[-76, -50], [-68, -53]], outside: true },

  /*
    Three passages that are not on any other plan of the building.

    A map of a castle is a map. A map that knows about the ways round the back
    is contraband, and contraband is the only reason anybody would have gone to
    the trouble of drawing this one.
  */
  {
    id: 'sp-wall', name: 'the passage under the wall', secret: true,
    pts: [[-29.5, -11], [-38, -14], [-46, -22], [-52, -31], [-56, -37]],
  },
  {
    id: 'sp-arch', name: 'the passage behind the third arch', secret: true,
    pts: [[-26, 29], [-14, 33], [0, 32], [12, 27], [18, 25]],
  },
  {
    id: 'sp-drain', name: 'the drain', secret: true,
    pts: [[28, 11], [24, 2], [18, -8], [10, -18], [2, -28], [-2, -36]],
  },
];

/* ── the graph ────────────────────────────────────────────────────────── */

export interface Node {
  id: number;
  at: Pt;
  /** Which way it belongs to, for the caption and for the secret flag. */
  way: string;
  to: number[];
}

const dist = (a: Pt, b: Pt) => Math.hypot(a[0] - b[0], a[1] - b[1]);

/**
 * Sample every way, then stitch the samples together.
 *
 * Corridors are given as centrelines and nothing says where two of them meet;
 * that is worked out here, by joining any two samples from different ways that
 * end up within a stud and a half of each other. Hand-listing the junctions was
 * the first version, and every time a corridor moved by two studs the building
 * quietly acquired a room nobody could reach.
 */
export function buildGraph(step = 3.2, join = 3.4): { nodes: Node[]; byWay: Map<string, number[]> } {
  const nodes: Node[] = [];
  const byWay = new Map<string, number[]>();

  for (const way of WAYS) {
    const ids: number[] = [];
    let carry = 0;
    const pushNode = (at: Pt) => {
      const id = nodes.length;
      nodes.push({ id, at, way: way.id, to: [] });
      ids.push(id);
      return id;
    };
    pushNode(way.pts[0]!);
    for (let i = 1; i < way.pts.length; i++) {
      const a = way.pts[i - 1]!;
      const b = way.pts[i]!;
      const len = dist(a, b);
      let d = step - carry;
      while (d < len) {
        pushNode([a[0] + ((b[0] - a[0]) * d) / len, a[1] + ((b[1] - a[1]) * d) / len]);
        d += step;
      }
      carry = len - (d - step);
    }
    pushNode(way.pts[way.pts.length - 1]!);
    for (let i = 1; i < ids.length; i++) {
      const a = ids[i - 1]!;
      const b = ids[i]!;
      nodes[a]!.to.push(b);
      nodes[b]!.to.push(a);
    }
    byWay.set(way.id, ids);
  }

  // Stitch. A grid bucket keeps this from being quadratic in the node count.
  const cell = join;
  const grid = new Map<string, number[]>();
  const key = (p: Pt) => `${Math.floor(p[0] / cell)},${Math.floor(p[1] / cell)}`;
  for (const n of nodes) {
    const k = key(n.at);
    const b = grid.get(k);
    if (b) b.push(n.id);
    else grid.set(k, [n.id]);
  }
  for (const n of nodes) {
    const [gx, gz] = [Math.floor(n.at[0] / cell), Math.floor(n.at[1] / cell)];
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        for (const m of grid.get(`${gx + dx},${gz + dz}`) ?? []) {
          if (m === n.id) continue;
          const other = nodes[m]!;
          if (other.way === n.way) continue;
          if (dist(n.at, other.at) > join) continue;
          if (!n.to.includes(m)) n.to.push(m);
        }
      }
    }
  }
  return { nodes, byWay };
}

/**
 * Dijkstra, because the graph is a few hundred nodes and clarity is worth more
 * than a heap.
 *
 * `blocked` is what keeps the rest of the castle out of the three passages.
 * Without it every walker took the shortest route, the shortest route is very
 * often the passage, and by the time the ink had finished spreading all three
 * had been found by somebody else — which is not a secret, it is a corridor.
 */
export function route(nodes: Node[], from: number, to: number, blocked?: Set<string>): number[] {
  const best = new Float64Array(nodes.length).fill(Infinity);
  const prev = new Int32Array(nodes.length).fill(-1);
  const seen = new Uint8Array(nodes.length);
  best[from] = 0;
  for (;;) {
    let at = -1;
    let bestSoFar = Infinity;
    for (let i = 0; i < nodes.length; i++) {
      if (!seen[i] && best[i]! < bestSoFar) { bestSoFar = best[i]!; at = i; }
    }
    if (at < 0 || at === to) break;
    seen[at] = 1;
    for (const m of nodes[at]!.to) {
      if (blocked?.has(nodes[m]!.way)) continue;
      const d = best[at]! + dist(nodes[at]!.at, nodes[m]!.at);
      if (d < best[m]!) { best[m] = d; prev[m] = at; }
    }
  }
  if (best[to] === Infinity) return [];
  const path: number[] = [];
  for (let at = to; at >= 0; at = prev[at]!) path.push(at);
  return path.reverse();
}

/** The node nearest a point, ignoring passages nobody has found yet. */
export function nearest(nodes: Node[], p: Pt, allowSecret = true): number {
  const secret = new Set(WAYS.filter((w) => w.secret).map((w) => w.id));
  let best = -1;
  let bestD = Infinity;
  for (const n of nodes) {
    if (!allowSecret && secret.has(n.way)) continue;
    const d = dist(n.at, p);
    if (d < bestD) { bestD = d; best = n.id; }
  }
  return best;
}

export const WAY_BY_ID = new Map(WAYS.map((w) => [w.id, w]));

/** The whole estate, for framing the sheet. */
export const EXTENT = { x0: -134, z0: -88, x1: 116, z1: 122 };
