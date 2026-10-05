import { DRIVABLE, RC, type City, type Link, type Piece } from './data';

/**
 * Shortest routes over the real road graph (A*, one-way streets respected
 * when driving). Used by the GPS line, the police and mission drivers.
 */

export interface Step { p: Piece; fwd: boolean }
export interface Route { steps: Step[]; pts: number[]; len: number }

class Heap {
  a: number[] = []; f: Float64Array;
  constructor(n: number) { this.f = new Float64Array(n); }
  push(i: number, f: number) {
    this.f[i] = f; const a = this.a; a.push(i);
    let k = a.length - 1;
    while (k > 0) { const p = (k - 1) >> 1; if (this.f[a[p]] <= this.f[a[k]]) break; [a[p], a[k]] = [a[k], a[p]]; k = p; }
  }
  pop() {
    const a = this.a, top = a[0], last = a.pop()!;
    if (a.length) {
      a[0] = last; let k = 0;
      for (;;) { const l = k * 2 + 1, r = l + 1; let m = k; if (l < a.length && this.f[a[l]] < this.f[a[m]]) m = l; if (r < a.length && this.f[a[r]] < this.f[a[m]]) m = r; if (m === k) break; [a[m], a[k]] = [a[k], a[m]]; k = m; }
    }
    return top;
  }
  get size() { return this.a.length; }
}

let G: Float64Array | null = null, PREV: Int32Array | null = null, PREVP: Int32Array | null = null, STAMP: Int32Array | null = null;
let stampN = 0;

/** Nearest graph node to a point, on a road we may use. */
export function nearestNode(city: City, x: number, z: number, walk = false) {
  const h = city.roads.nearest(x, z, 120, (p) => DRIVABLE(p.cls) && (walk || p.cls !== RC.track));
  if (!h) return null;
  const p = h.p;
  const along = p.s[h.k] + (p.s[h.k + 1] - p.s[h.k]) * h.t;
  return { node: along < p.len / 2 ? p.a : p.b, hit: h, along };
}

export function route(city: City, x0: number, z0: number, x1: number, z1: number, oneway = true, maxNodes = 60000): Route | null {
  const R = city.roads, N = R.nodeX.length;
  if (!G || G.length !== N) { G = new Float64Array(N); PREV = new Int32Array(N); PREVP = new Int32Array(N); STAMP = new Int32Array(N); }
  const a = nearestNode(city, x0, z0), b = nearestNode(city, x1, z1);
  if (!a || !b) return null;
  stampN++;
  const heap = new Heap(N);
  const g = G!, prev = PREV!, prevp = PREVP!, stamp = STAMP!;
  const tx = R.nodeX[b.node], tz = R.nodeZ[b.node];
  const h = (i: number) => Math.hypot(R.nodeX[i] - tx, R.nodeZ[i] - tz);
  // allow starting from either end of the piece we are on
  for (const n0 of [a.hit.p.a, a.hit.p.b]) {
    stamp[n0] = stampN; g[n0] = n0 === a.hit.p.a ? a.along : a.hit.p.len - a.along; prev[n0] = -1; prevp[n0] = -1;
    heap.push(n0, g[n0] + h(n0));
  }
  const closed = new Set<number>();
  let found = -1, it = 0;
  const pieces = R.pieces;
  while (heap.size && it++ < maxNodes) {
    const u = heap.pop();
    if (closed.has(u)) continue;
    closed.add(u);
    if (u === b.node || u === b.hit.p.a || u === b.hit.p.b) { found = u; break; }
    // on foot, one-way streets go both ways
    const links: Link[] = oneway ? R.adj[u] : R.adjAll[u];
    for (const l of links) {
      if (l.p.cls === RC.track) continue;
      const v = l.to;
      // big roads are a little cheaper: that's how people actually drive
      const cost = l.p.len * (l.p.cls <= RC.secondary ? 0.85 : l.p.cls >= RC.service ? 1.35 : 1);
      const ng = g[u] + cost;
      if (stamp[v] !== stampN || ng < g[v]) { stamp[v] = stampN; g[v] = ng; prev[v] = u; prevp[v] = l.p.i * 2 + (l.fwd ? 1 : 0); heap.push(v, ng + h(v)); }
    }
  }
  if (found < 0) return null;
  const steps: Step[] = [];
  let v = found;
  while (prev[v] >= 0 && stamp[v] === stampN) {
    const code = prevp[v];
    steps.push({ p: pieces[code >> 1], fwd: (code & 1) === 1 });
    v = prev[v];
  }
  steps.reverse();
  const pts: number[] = [x0, z0];
  for (const s of steps) {
    const p = s.p;
    if (s.fwd) for (let k = 0; k < p.n; k++) pts.push(p.x[k], p.z[k]);
    else for (let k = p.n - 1; k >= 0; k--) pts.push(p.x[k], p.z[k]);
  }
  pts.push(x1, z1);
  let len = 0;
  for (let i = 2; i < pts.length; i += 2) len += Math.hypot(pts[i] - pts[i - 2], pts[i + 1] - pts[i - 1]);
  return { steps, pts, len };
}

/** Index of the route point nearest to (x, z), searching forward from `from`. */
export function progress(r: Route, x: number, z: number, from = 0) {
  let best = from, bd = Infinity;
  const n = r.pts.length / 2;
  for (let i = from; i < Math.min(n, from + 120); i++) {
    const d = (r.pts[i * 2] - x) ** 2 + (r.pts[i * 2 + 1] - z) ** 2;
    if (d < bd) { bd = d; best = i; }
  }
  return { i: best, d: Math.sqrt(bd) };
}
