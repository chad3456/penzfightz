/**
 * Signed distance fields and a surface-nets mesher. Organs are described as
 * smooth unions of simple shapes (ellipsoids, capsules, tubes along curves),
 * carved and roughened with noise, then meshed once into smooth geometry.
 * Every triangle is labelled with the part nearest to it, so each part can
 * become its own mesh with its own material and highlight.
 */
import * as THREE from 'three';

export type Vec = [number, number, number];
export type SDF = (x: number, y: number, z: number) => number;

/* ───────── primitives (exact or close enough) ───────── */
export const sphere = (c: Vec, r: number): SDF => (x, y, z) => Math.hypot(x - c[0], y - c[1], z - c[2]) - r;
/** ellipsoid (Inigo Quilez's bound), optionally rotated by a matrix */
export function ellipsoid(c: Vec, r: Vec, rot?: THREE.Euler): SDF {
  const m = rot ? new THREE.Matrix4().makeRotationFromEuler(rot).invert() : null; const e = m?.elements;
  return (x, y, z) => {
    let px = x - c[0], py = y - c[1], pz = z - c[2];
    if (e) { const a = e[0] * px + e[4] * py + e[8] * pz, b = e[1] * px + e[5] * py + e[9] * pz, d = e[2] * px + e[6] * py + e[10] * pz; px = a; py = b; pz = d; }
    const k0 = Math.hypot(px / r[0], py / r[1], pz / r[2]), k1 = Math.hypot(px / (r[0] * r[0]), py / (r[1] * r[1]), pz / (r[2] * r[2]));
    return k1 === 0 ? -Math.min(...r) : (k0 * (k0 - 1)) / k1;
  };
}
export function capsule(a: Vec, b: Vec, ra: number, rb = ra): SDF {
  const bax = b[0] - a[0], bay = b[1] - a[1], baz = b[2] - a[2], bb = bax * bax + bay * bay + baz * baz;
  return (x, y, z) => {
    const pax = x - a[0], pay = y - a[1], paz = z - a[2];
    const h = Math.max(0, Math.min(1, (pax * bax + pay * bay + paz * baz) / bb));
    return Math.hypot(pax - bax * h, pay - bay * h, paz - baz * h) - (ra + (rb - ra) * h);
  };
}
/** a tube through points (Catmull-Rom sampled), radius varying along it */
export function tube(pts: Vec[], r: number | ((t: number) => number), samples = 24): SDF {
  const c = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)));
  const P = c.getSpacedPoints(samples).map((v) => [v.x, v.y, v.z] as Vec);
  const R = (t: number) => (typeof r === 'number' ? r : r(t));
  const segs = P.slice(1).map((p, i) => capsule(P[i], p, R(i / samples), R((i + 1) / samples)));
  // bounding box for a quick reject
  const lo = [0, 1, 2].map((k) => Math.min(...P.map((p) => p[k]))), hi = [0, 1, 2].map((k) => Math.max(...P.map((p) => p[k])));
  const pad = Math.max(R(0), R(0.5), R(1)) * 1.5 + 0.05;
  return (x, y, z) => {
    const dx = Math.max(lo[0] - pad - x, 0, x - hi[0] - pad), dy = Math.max(lo[1] - pad - y, 0, y - hi[1] - pad), dz = Math.max(lo[2] - pad - z, 0, z - hi[2] - pad);
    if (dx + dy + dz > 0) return Math.hypot(dx, dy, dz) + pad * 0.5;
    let d = Infinity; for (const s of segs) { const v = s(x, y, z); if (v < d) d = v; } return d;
  };
}
export const box = (c: Vec, h: Vec, round = 0): SDF => (x, y, z) => {
  const qx = Math.abs(x - c[0]) - h[0] + round, qy = Math.abs(y - c[1]) - h[1] + round, qz = Math.abs(z - c[2]) - h[2] + round;
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qy, qz), 0) - round;
};
export const torus = (c: Vec, R: number, r: number): SDF => (x, y, z) => Math.hypot(Math.hypot(x - c[0], z - c[2]) - R, y - c[1]) - r;
/** half-space: inside where n·p > d (so it removes everything on the n side beyond d when intersected via smax with -) */
export const plane = (n: Vec, d: number): SDF => { const l = Math.hypot(...n); return (x, y, z) => (n[0] * x + n[1] * y + n[2] * z) / l - d; };

/* ───────── combinators ───────── */
export const smin = (a: number, b: number, k: number) => { if (k <= 0) return Math.min(a, b); const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25; };
export const smax = (a: number, b: number, k: number) => -smin(-a, -b, k);
export const U = (k: number, ...fs: SDF[]): SDF => (x, y, z) => { let d = fs[0](x, y, z); for (let i = 1; i < fs.length; i++) d = smin(d, fs[i](x, y, z), k); return d; };
export const sub = (a: SDF, b: SDF, k = 0): SDF => (x, y, z) => smax(a(x, y, z), -b(x, y, z), k);
export const inter = (a: SDF, b: SDF, k = 0): SDF => (x, y, z) => smax(a(x, y, z), b(x, y, z), k);
export const shell = (a: SDF, t: number): SDF => (x, y, z) => Math.abs(a(x, y, z)) - t;

/* ───────── meshing ───────── */
export interface Labelled { geo: THREE.BufferGeometry; groups: Map<string, THREE.BufferGeometry> }
/**
 * Naive surface nets over a box. `label(x,y,z)` names the part a triangle
 * belongs to (evaluated at its centre); `color` optionally paints vertices.
 */
export function mesh(f: SDF, min: Vec, max: Vec, cell: number, label?: (x: number, y: number, z: number) => string, color?: (x: number, y: number, z: number, out: THREE.Color) => void): Labelled {
  const nx = Math.ceil((max[0] - min[0]) / cell), ny = Math.ceil((max[1] - min[1]) / cell), nz = Math.ceil((max[2] - min[2]) / cell);
  const sx = nx + 1, sy = ny + 1, sz = nz + 1;
  const v = new Float32Array(sx * sy * sz);
  for (let k = 0; k < sz; k++) for (let j = 0; j < sy; j++) for (let i = 0; i < sx; i++) v[i + sx * (j + sy * k)] = f(min[0] + i * cell, min[1] + j * cell, min[2] + k * cell);
  const G = (i: number, j: number, k: number) => v[i + sx * (j + sy * k)];
  const vid = new Int32Array(nx * ny * nz).fill(-1);
  const P: number[] = [];
  const corners = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1]];
  const edges = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
  const cv = new Float64Array(8);
  for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    let mask = 0;
    for (let c = 0; c < 8; c++) { const d = G(i + corners[c][0], j + corners[c][1], k + corners[c][2]); cv[c] = d; if (d < 0) mask |= 1 << c; }
    if (mask === 0 || mask === 255) continue;
    let ax = 0, ay = 0, az = 0, n = 0;
    for (const [a, b] of edges) {
      const da = cv[a], db = cv[b]; if ((da < 0) === (db < 0)) continue;
      const t = da / (da - db);
      ax += corners[a][0] + (corners[b][0] - corners[a][0]) * t; ay += corners[a][1] + (corners[b][1] - corners[a][1]) * t; az += corners[a][2] + (corners[b][2] - corners[a][2]) * t; n++;
    }
    vid[i + nx * (j + ny * k)] = P.length / 3;
    P.push(min[0] + (i + ax / n) * cell, min[1] + (j + ay / n) * cell, min[2] + (k + az / n) * cell);
  }
  const C = (i: number, j: number, k: number) => vid[i + nx * (j + ny * k)];
  const idx: number[] = [];
  const quad = (a: number, b: number, c: number, d: number, flip: boolean) => { if (a < 0 || b < 0 || c < 0 || d < 0) return; if (flip) idx.push(a, d, c, a, c, b); else idx.push(a, b, c, a, c, d); };
  for (let k = 0; k < sz; k++) for (let j = 0; j < sy; j++) for (let i = 0; i < sx; i++) {
    const g0 = G(i, j, k), in0 = g0 < 0;
    if (i < nx && j > 0 && k > 0 && j < ny && k < nz && in0 !== (G(i + 1, j, k) < 0)) quad(C(i, j - 1, k - 1), C(i, j, k - 1), C(i, j, k), C(i, j - 1, k), !in0);
    if (j < ny && i > 0 && k > 0 && i < nx && k < nz && in0 !== (G(i, j + 1, k) < 0)) quad(C(i - 1, j, k - 1), C(i - 1, j, k), C(i, j, k), C(i, j, k - 1), !in0);
    if (k < nz && i > 0 && j > 0 && i < nx && j < ny && in0 !== (G(i, j, k + 1) < 0)) quad(C(i - 1, j - 1, k), C(i, j - 1, k), C(i, j, k), C(i - 1, j, k), !in0);
  }
  // normals from the field gradient: smoother than face normals
  const N = new Float32Array(P.length), e = cell * 0.5;
  for (let p = 0; p < P.length; p += 3) {
    const x = P[p], y = P[p + 1], z = P[p + 2];
    let gx = f(x + e, y, z) - f(x - e, y, z), gy = f(x, y + e, z) - f(x, y - e, z), gz = f(x, y, z + e) - f(x, y, z - e);
    const l = Math.hypot(gx, gy, gz) || 1; gx /= l; gy /= l; gz /= l; N[p] = gx; N[p + 1] = gy; N[p + 2] = gz;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(N, 3));
  if (color) { const col = new Float32Array(P.length), c = new THREE.Color(); for (let p = 0; p < P.length; p += 3) { color(P[p], P[p + 1], P[p + 2], c); col[p] = c.r; col[p + 1] = c.g; col[p + 2] = c.b; } geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); }
  geo.setIndex(idx);
  const groups = new Map<string, THREE.BufferGeometry>();
  if (label) {
    const by = new Map<string, number[]>();
    for (let t = 0; t < idx.length; t += 3) {
      const a = idx[t] * 3, b = idx[t + 1] * 3, c = idx[t + 2] * 3;
      const L = label((P[a] + P[b] + P[c]) / 3, (P[a + 1] + P[b + 1] + P[c + 1]) / 3, (P[a + 2] + P[b + 2] + P[c + 2]) / 3);
      let arr = by.get(L); if (!arr) by.set(L, (arr = [])); arr.push(idx[t], idx[t + 1], idx[t + 2]);
    }
    for (const [L, ix] of by) { const g = new THREE.BufferGeometry(); g.setAttribute('position', geo.attributes.position); g.setAttribute('normal', geo.attributes.normal); if (geo.attributes.color) g.setAttribute('color', geo.attributes.color); g.setIndex(ix); groups.set(L, g); }
  }
  return { geo, groups };
}

/** name of the nearest of several labelled fields */
export function nearest(parts: [string, SDF][]) {
  return (x: number, y: number, z: number) => { let best = parts[0][0], d = Infinity; for (const [n, f] of parts) { const v = f(x, y, z); if (v < d) { d = v; best = n; } } return best; };
}

const memo = new Map<string, Labelled>();
/** mesh once per key for the life of the page */
export function cached(key: string, make: () => Labelled) { let m = memo.get(key); if (!m) { m = make(); memo.set(key, m); } return m; }
