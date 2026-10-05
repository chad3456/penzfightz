/**
 * Pune 411 — the city data. Everything here was baked from real map data
 * (OpenStreetMap via Overture Maps, and Terrarium elevation) by
 * scripts/pune/bake.py; this module only reads it back and answers spatial
 * questions: how high is the ground here, which road am I on, what is in the
 * way. World frame: metres, x east, z south, y up relative to `meta.base`.
 */

export interface Landmark { key: string; name: string; x: number; z: number; y: number; w?: number; d?: number; rot?: number; foot?: number[] | null }
export interface Hood { name: string; x: number; z: number; k: string }
export interface Meta {
  bbox: [number, number, number, number]; origin: [number, number]; kx: number; kz: number; half: [number, number]; base: number;
  classes: string[]; types: string[]; names: string[]; hoods: Hood[]; landmarks: Landmark[]; places: { name: string; k: string; x: number; z: number }[];
  attribution: string;
}

export const enum RC { trunk, primary, secondary, tertiary, residential, service, living, unclassified, unknown, track, footway, path, steps, pedestrian, cycleway, motorway, rail, metro }
export const DRIVABLE = (c: number) => c <= RC.track || c === RC.motorway;
export const FOOT = (c: number) => c >= RC.footway && c <= RC.cycleway;
/** How busy a class is: used by traffic to pick roads and by the map to draw them. */
export const RANK = (c: number) => c === RC.motorway || c === RC.trunk ? 5 : c === RC.primary ? 4 : c === RC.secondary ? 3 : c === RC.tertiary ? 2 : c <= RC.unknown ? 1 : 0;

export interface Piece {
  i: number; cls: number; flags: number; w: number; name: number; a: number; b: number;
  n: number; x: Float32Array; z: Float32Array; y: Float32Array; pf: Uint8Array; s: Float32Array; len: number;
  elevated: boolean;
}

export interface Building { i: number; ring: Float32Array; t: number; h: number; front: number; cx: number; cz: number; r: number; base: number }

export const BT = { house: 0, apartment: 1, wada: 2, colonial: 3, temple: 4, shed: 5, campus: 6, tower: 7, vasti: 8, commercial: 9, bungalow: 10 } as const;

export class Terrain {
  constructor(public nx: number, public nz: number, public grid: number, public hx: number, public hz: number, public h: Float32Array, public wl: Float32Array) {}
  height(x: number, z: number) {
    let cx = (x + this.hx) / this.grid, cz = (z + this.hz) / this.grid;
    cx = Math.min(Math.max(cx, 0), this.nx - 1.001); cz = Math.min(Math.max(cz, 0), this.nz - 1.001);
    const i = cx | 0, j = cz | 0, fx = cx - i, fz = cz - j, nx = this.nx, h = this.h;
    const a = h[j * nx + i], b = h[j * nx + i + 1], c = h[(j + 1) * nx + i], d = h[(j + 1) * nx + i + 1];
    return a * (1 - fx) * (1 - fz) + b * fx * (1 - fz) + c * (1 - fx) * fz + d * fx * fz;
  }
  /** Water surface height near a river, or -Infinity. */
  water(x: number, z: number) {
    const i = Math.round((x + this.hx) / this.grid), j = Math.round((z + this.hz) / this.grid);
    if (i < 0 || j < 0 || i >= this.nx || j >= this.nz) return -Infinity;
    const v = this.wl[j * this.nx + i];
    return v < -500 ? -Infinity : v;
  }
  inside(x: number, z: number, m = 0) { return Math.abs(x) < this.hx - m && Math.abs(z) < this.hz - m; }
}

/** A coarse bucket grid over the world for "what is near here" queries. */
export class Grid<T> {
  cells = new Map<number, T[]>();
  constructor(public size: number) {}
  key(ix: number, iz: number) { return (ix + 4096) * 8192 + (iz + 4096); }
  add(x0: number, z0: number, x1: number, z1: number, v: T) {
    const s = this.size;
    for (let ix = Math.floor(x0 / s); ix <= Math.floor(x1 / s); ix++)
      for (let iz = Math.floor(z0 / s); iz <= Math.floor(z1 / s); iz++) {
        const k = this.key(ix, iz); let c = this.cells.get(k); if (!c) this.cells.set(k, (c = [])); c.push(v);
      }
  }
  query(x: number, z: number, r: number, out: T[] = [], seen?: Set<T>) {
    const s = this.size;
    for (let ix = Math.floor((x - r) / s); ix <= Math.floor((x + r) / s); ix++)
      for (let iz = Math.floor((z - r) / s); iz <= Math.floor((z + r) / s); iz++) {
        const c = this.cells.get(this.key(ix, iz)); if (!c) continue;
        for (const v of c) { if (seen) { if (seen.has(v)) continue; seen.add(v); } out.push(v); }
      }
    return out;
  }
}

export interface Hit { p: Piece; k: number; t: number; d: number; x: number; z: number; y: number; side: number }

export interface Link { p: Piece; fwd: boolean; to: number }

export class Roads {
  grid = new Grid<Piece>(48);
  adj: Link[][];
  adjAll: Link[][];
  constructor(public pieces: Piece[], public nodeX: Float32Array, public nodeZ: Float32Array) {
    this.adj = Array.from({ length: nodeX.length }, () => []);
    this.adjAll = Array.from({ length: nodeX.length }, () => []);
    for (const p of pieces) {
      let x0 = Infinity, z0 = Infinity, x1 = -Infinity, z1 = -Infinity;
      for (let k = 0; k < p.n; k++) { x0 = Math.min(x0, p.x[k]); x1 = Math.max(x1, p.x[k]); z0 = Math.min(z0, p.z[k]); z1 = Math.max(z1, p.z[k]); }
      const m = p.w / 2 + 2;
      this.grid.add(x0 - m, z0 - m, x1 + m, z1 + m, p);
      if (DRIVABLE(p.cls)) {
        const one = p.flags & 3;
        if (one !== 1) this.adj[p.a].push({ p, fwd: true, to: p.b });
        if (one !== 2) this.adj[p.b].push({ p, fwd: false, to: p.a });
        this.adjAll[p.a].push({ p, fwd: true, to: p.b });
        this.adjAll[p.b].push({ p, fwd: false, to: p.a });
      }
    }
  }
  /** Closest point on any piece passing `filter`, within r. */
  nearest(x: number, z: number, r: number, filter?: (p: Piece) => boolean, yRef?: number): Hit | null {
    const cand = this.grid.query(x, z, r, [], new Set());
    let best: Hit | null = null;
    for (const p of cand) {
      if (filter && !filter(p)) continue;
      for (let k = 0; k < p.n - 1; k++) {
        const ax = p.x[k], az = p.z[k], bx = p.x[k + 1], bz = p.z[k + 1];
        const dx = bx - ax, dz = bz - az, L2 = dx * dx + dz * dz || 1;
        let t = ((x - ax) * dx + (z - az) * dz) / L2; t = t < 0 ? 0 : t > 1 ? 1 : t;
        const px = ax + dx * t, pz = az + dz * t;
        const y = p.y[k] + (p.y[k + 1] - p.y[k]) * t;
        let d = Math.hypot(x - px, z - pz);
        if (yRef !== undefined) d += Math.max(0, Math.abs(y - yRef) - 1.5) * 4;
        if (d < r && (!best || d < best.d)) {
          const side = Math.sign(dx * (z - az) - dz * (x - ax));
          best = { p, k, t, d, x: px, z: pz, y, side };
        }
      }
    }
    return best;
  }
  /**
   * The height of the driving surface under (x, z) for something now at yNow:
   * a flyover or bridge deck if one is under us and within a step of our
   * height, the ground otherwise.
   */
  surface(x: number, z: number, yNow: number, ground: number): { y: number; deck: Piece | null } {
    let y = ground, deck: Piece | null = null;
    const cand = this.grid.query(x, z, 2, [], new Set());
    for (const p of cand) {
      if (!p.elevated) continue;
      for (let k = 0; k < p.n - 1; k++) {
        if (!(p.pf[k] & 1) && !(p.pf[k + 1] & 1) && p.y[k] - ground < 1.2 && p.y[k + 1] - ground < 1.2) continue;
        const ax = p.x[k], az = p.z[k], dx = p.x[k + 1] - ax, dz = p.z[k + 1] - az, L2 = dx * dx + dz * dz || 1;
        let t = ((x - ax) * dx + (z - az) * dz) / L2; if (t < -0.05 || t > 1.05) continue; t = Math.min(1, Math.max(0, t));
        const d = Math.hypot(x - ax - dx * t, z - az - dz * t);
        if (d > p.w / 2 + 0.6) continue;
        const yy = p.y[k] + (p.y[k + 1] - p.y[k]) * t + 0.05;
        if (yy > y && yy < yNow + 1.4) { y = yy; deck = p; }
      }
    }
    return { y, deck };
  }
  pointAt(p: Piece, s: number, out: { x: number; z: number; y: number; dx: number; dz: number }) {
    s = Math.min(Math.max(s, 0), p.len);
    let k = 0, lo = 0, hi = p.n - 1;
    while (lo < hi) { const m = (lo + hi + 1) >> 1; if (p.s[m] <= s) lo = m; else hi = m - 1; }
    k = Math.min(lo, p.n - 2);
    const L = p.s[k + 1] - p.s[k] || 1e-6, t = (s - p.s[k]) / L;
    out.x = p.x[k] + (p.x[k + 1] - p.x[k]) * t; out.z = p.z[k] + (p.z[k + 1] - p.z[k]) * t; out.y = p.y[k] + (p.y[k + 1] - p.y[k]) * t;
    out.dx = (p.x[k + 1] - p.x[k]) / L; out.dz = (p.z[k + 1] - p.z[k]) / L;
    return out;
  }
}

export class Buildings {
  grid = new Grid<Building>(40);
  constructor(public list: Building[]) {
    for (const b of list) this.grid.add(b.cx - b.r, b.cz - b.r, b.cx + b.r, b.cz + b.r, b);
  }
  /** Push a circle out of any building it overlaps. Returns the push normal or null. */
  collide(x: number, z: number, r: number, y: number, out: { x: number; z: number; nx: number; nz: number }): boolean {
    const cand = this.grid.query(x, z, r + 1, [], new Set());
    let hit = false;
    for (const b of cand) {
      if (y > b.base + b.h + 0.5) continue;
      const dx0 = x - b.cx, dz0 = z - b.cz;
      if (dx0 * dx0 + dz0 * dz0 > (b.r + r) * (b.r + r)) continue;
      const ring = b.ring, n = ring.length / 2;
      let inside = false, best = Infinity, bnx = 0, bnz = 0;
      for (let i = 0, j = n - 1; i < n; j = i++) {
        const xi = ring[i * 2], zi = ring[i * 2 + 1], xj = ring[j * 2], zj = ring[j * 2 + 1];
        if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
        const ex = xi - xj, ez = zi - zj, L2 = ex * ex + ez * ez || 1;
        let t = ((x - xj) * ex + (z - zj) * ez) / L2; t = t < 0 ? 0 : t > 1 ? 1 : t;
        const px = xj + ex * t, pz = zj + ez * t, d = Math.hypot(x - px, z - pz);
        if (d < best) { best = d; bnx = (x - px) / (d || 1); bnz = (z - pz) / (d || 1); if (d < 1e-4) { bnx = ez / Math.sqrt(L2); bnz = -ex / Math.sqrt(L2); } }
      }
      if (inside) {
        // push out through the nearest wall
        x -= bnx * (best + r); z -= bnz * (best + r);
        out.nx = -bnx; out.nz = -bnz; hit = true;
      } else if (best < r) {
        x += bnx * (r - best); z += bnz * (r - best);
        out.nx = bnx; out.nz = bnz; hit = true;
      }
    }
    out.x = x; out.z = z;
    return hit;
  }
  /** Is a point inside any building footprint? */
  inside(x: number, z: number): Building | null {
    const cand = this.grid.query(x, z, 0.5);
    for (const b of cand) {
      const ring = b.ring, n = ring.length / 2;
      let inside = false;
      for (let i = 0, j = n - 1; i < n; j = i++) {
        const xi = ring[i * 2], zi = ring[i * 2 + 1], xj = ring[j * 2], zj = ring[j * 2 + 1];
        if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
      }
      if (inside) return b;
    }
    return null;
  }
}

export interface Water { rivers: [number[], number[][]][]; ponds: { name: string; rings: [number[], number[][]][] }[] }

export interface City {
  meta: Meta; terrain: Terrain; roads: Roads; buildings: Buildings; water: Water;
  trees: { x: Float32Array; z: Float32Array; kind: Uint8Array; scale: Uint8Array };
  ground: HTMLImageElement;
}

const ROOT = '/pune/';

async function bin(name: string, onBytes: (n: number) => void) {
  const r = await fetch(ROOT + name);
  if (!r.ok) throw new Error(`could not load ${name} (${r.status})`);
  const buf = await r.arrayBuffer();
  onBytes(buf.byteLength);
  return new DataView(buf);
}

export async function loadCity(onProgress: (f: number, label: string) => void): Promise<City> {
  const TOTAL = 7.4e6;
  let got = 0;
  const tick = (label: string) => (n: number) => { got += n; onProgress(Math.min(0.95, got / TOTAL), label); };
  const metaP = fetch(ROOT + 'meta.json').then((r) => r.json() as Promise<Meta>);
  const waterP = fetch(ROOT + 'water.json').then((r) => r.json() as Promise<Water>);
  const groundP = new Promise<HTMLImageElement>((res, rej) => { const im = new Image(); im.onload = () => { tick('ground')(6.4e5); res(im); }; im.onerror = () => rej(new Error('ground texture')); im.src = ROOT + 'ground.jpg'; });
  const [meta, water, tv, rv, bv, trv, ground] = await Promise.all([
    metaP, waterP, bin('terrain.bin', tick('terrain')), bin('roads.bin', tick('roads')), bin('buildings.bin', tick('buildings')), bin('trees.bin', tick('trees')), groundP,
  ]);
  onProgress(0.96, 'reading the map');
  const [HX, HZ] = meta.half;

  // terrain
  const nx = tv.getUint32(0, true), nz = tv.getUint32(4, true), grid = tv.getFloat32(8, true);
  const h = new Float32Array(nx * nz), wl = new Float32Array(nx * nz);
  let o = 16;
  for (let i = 0; i < nx * nz; i++, o += 2) h[i] = tv.getInt16(o, true) / 10;
  for (let i = 0; i < nx * nz; i++, o += 2) wl[i] = tv.getInt16(o, true) / 10;
  const terrain = new Terrain(nx, nz, grid, HX, HZ, h, wl);

  // roads
  const nn = rv.getUint32(0, true), np = rv.getUint32(4, true);
  const nodeX = new Float32Array(nn), nodeZ = new Float32Array(nn);
  o = 8;
  for (let i = 0; i < nn; i++, o += 4) { nodeX[i] = rv.getInt16(o, true) / 2; nodeZ[i] = rv.getInt16(o + 2, true) / 2; }
  const pieces: Piece[] = [];
  for (let i = 0; i < np; i++) {
    const cls = rv.getUint8(o), flags = rv.getUint8(o + 1), w = rv.getUint8(o + 2) / 4, name = rv.getUint16(o + 4, true);
    const a = rv.getUint32(o + 6, true), b = rv.getUint32(o + 10, true), n = rv.getUint16(o + 14, true);
    o += 16;
    const x = new Float32Array(n), z = new Float32Array(n), y = new Float32Array(n), pf = new Uint8Array(n), s = new Float32Array(n);
    let elevated = false;
    for (let k = 0; k < n; k++, o += 8) {
      x[k] = rv.getInt16(o, true) / 2; z[k] = rv.getInt16(o + 2, true) / 2; y[k] = rv.getInt16(o + 4, true) / 10; pf[k] = rv.getUint8(o + 6);
      if (k) s[k] = s[k - 1] + Math.hypot(x[k] - x[k - 1], z[k] - z[k - 1]);
    }
    for (let k = 0; k < n; k++) if (y[k] - terrain.height(x[k], z[k]) > 1.0) { elevated = true; break; }
    pieces.push({ i, cls, flags, w, name, a, b, n, x, z, y, pf, s, len: s[n - 1], elevated });
  }
  const roads = new Roads(pieces, nodeX, nodeZ);

  // buildings
  const nb = bv.getUint32(0, true);
  const list: Building[] = [];
  o = 4;
  for (let i = 0; i < nb; i++) {
    const n = bv.getUint8(o), t = bv.getUint8(o + 1), hh = bv.getUint8(o + 2) / 2, front = bv.getUint8(o + 3);
    o += 4;
    const ring = new Float32Array(n * 2);
    let cx = 0, cz = 0;
    for (let k = 0; k < n; k++, o += 4) { ring[k * 2] = bv.getInt16(o, true) / 2; ring[k * 2 + 1] = bv.getInt16(o + 2, true) / 2; cx += ring[k * 2]; cz += ring[k * 2 + 1]; }
    cx /= n; cz /= n;
    let r = 0, base = Infinity;
    for (let k = 0; k < n; k++) { r = Math.max(r, Math.hypot(ring[k * 2] - cx, ring[k * 2 + 1] - cz)); base = Math.min(base, terrain.height(ring[k * 2], ring[k * 2 + 1])); }
    list.push({ i, ring, t, h: hh, front, cx, cz, r, base });
  }
  const buildings = new Buildings(list);

  // trees
  const nt = trv.getUint32(0, true);
  const trees = { x: new Float32Array(nt), z: new Float32Array(nt), kind: new Uint8Array(nt), scale: new Uint8Array(nt) };
  o = 4;
  for (let i = 0; i < nt; i++, o += 6) { trees.x[i] = trv.getInt16(o, true) / 2; trees.z[i] = trv.getInt16(o + 2, true) / 2; trees.kind[i] = trv.getUint8(o + 4); trees.scale[i] = trv.getUint8(o + 5); }

  onProgress(1, 'ready');
  return { meta, terrain, roads, buildings, water, trees, ground };
}

/** Real-world coordinates for a world point, for the map's readout. */
export function toLatLon(meta: Meta, x: number, z: number) {
  return { lat: meta.origin[1] - z / meta.kz, lon: meta.origin[0] + x / meta.kx };
}
export function fromLatLon(meta: Meta, lat: number, lon: number) {
  return { x: (lon - meta.origin[0]) * meta.kx, z: -(lat - meta.origin[1]) * meta.kz };
}

export function hoodAt(meta: Meta, x: number, z: number) {
  let best = meta.hoods[0], bd = Infinity;
  for (const h of meta.hoods) { const d = (h.x - x) ** 2 + (h.z - z) ** 2; if (d < bd) { bd = d; best = h; } }
  return best?.name ?? 'Pune';
}
