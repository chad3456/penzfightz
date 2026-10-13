/**
 * The 3D kit for the Body Atlas: seeded randomness, 3D simplex noise,
 * organic displacement, variable-radius tubes, branching trees, and a small
 * cache of physically based materials tuned for anatomy (wet tissue,
 * membrane, bone, glassy capsids, glowing signals).
 */
import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export function rng(seed: number) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
export const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smooth = (t: number) => { t = clamp(t); return t * t * (3 - 2 * t); };
export const TAU = Math.PI * 2;
export const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

/* ───────── simplex noise (3D) ───────── */
const grad3 = [[1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0], [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1], [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1]];
const perm = new Uint8Array(512);
{ const p = Array.from({ length: 256 }, (_, i) => i); const R = rng(1337); for (let i = 255; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; } for (let i = 0; i < 512; i++) perm[i] = p[i & 255]; }
export function noise3(x: number, y: number, z: number) {
  const F3 = 1 / 3, G3 = 1 / 6;
  const s = (x + y + z) * F3, i = Math.floor(x + s), j = Math.floor(y + s), k = Math.floor(z + s);
  const t = (i + j + k) * G3, x0 = x - (i - t), y0 = y - (j - t), z0 = z - (k - t);
  let i1, j1, k1, i2, j2, k2;
  if (x0 >= y0) { if (y0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 1; k2 = 0; } else if (x0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 0; k2 = 1; } else { i1 = 0; j1 = 0; k1 = 1; i2 = 1; j2 = 0; k2 = 1; } }
  else { if (y0 < z0) { i1 = 0; j1 = 0; k1 = 1; i2 = 0; j2 = 1; k2 = 1; } else if (x0 < z0) { i1 = 0; j1 = 1; k1 = 0; i2 = 0; j2 = 1; k2 = 1; } else { i1 = 0; j1 = 1; k1 = 0; i2 = 1; j2 = 1; k2 = 0; } }
  const x1 = x0 - i1 + G3, y1 = y0 - j1 + G3, z1 = z0 - k1 + G3, x2 = x0 - i2 + 2 * G3, y2 = y0 - j2 + 2 * G3, z2 = z0 - k2 + 2 * G3, x3 = x0 - 1 + 0.5, y3 = y0 - 1 + 0.5, z3 = z0 - 1 + 0.5;
  const ii = i & 255, jj = j & 255, kk = k & 255;
  const c = (gx: number, xx: number, yy: number, zz: number) => { let tt = 0.6 - xx * xx - yy * yy - zz * zz; if (tt < 0) return 0; const g = grad3[gx % 12]; tt *= tt; return tt * tt * (g[0] * xx + g[1] * yy + g[2] * zz); };
  return 32 * (c(perm[ii + perm[jj + perm[kk]]], x0, y0, z0) + c(perm[ii + i1 + perm[jj + j1 + perm[kk + k1]]], x1, y1, z1) + c(perm[ii + i2 + perm[jj + j2 + perm[kk + k2]]], x2, y2, z2) + c(perm[ii + 1 + perm[jj + 1 + perm[kk + 1]]], x3, y3, z3));
}
export function fbm(x: number, y: number, z: number, oct = 4) { let a = 0, f = 1, w = 0.5; for (let o = 0; o < oct; o++) { a += w * noise3(x * f, y * f, z * f); f *= 2.03; w *= 0.5; } return a; }

/* ───────── geometry ───────── */

/** Push every vertex out along its normal by fn(position). */
export function displace(geo: THREE.BufferGeometry, fn: (p: THREE.Vector3) => number) {
  if (!geo.index) { geo.deleteAttribute('normal'); geo.deleteAttribute('uv'); geo = mergeVertices(geo, 1e-5); }
  geo.computeVertexNormals();
  const pos = geo.attributes.position as THREE.BufferAttribute, nor = geo.attributes.normal as THREE.BufferAttribute, p = V(), n = V();
  for (let i = 0; i < pos.count; i++) { p.fromBufferAttribute(pos, i); n.fromBufferAttribute(nor, i); const d = fn(p); pos.setXYZ(i, p.x + n.x * d, p.y + n.y * d, p.z + n.z * d); }
  pos.needsUpdate = true; geo.computeVertexNormals(); return geo;
}
/** A soft organic blob: a sphere scaled and roughened with fbm. */
export function blob(r: number, scale: [number, number, number] = [1, 1, 1], amp = 0.08, freq = 1.6, seed = 0, detail = 5) {
  const g = new THREE.IcosahedronGeometry(r, detail); g.scale(...scale);
  return displace(g, (p) => amp * r * fbm(p.x * freq / r + seed, p.y * freq / r, p.z * freq / r, 3));
}
/** A tube along a curve whose radius varies with t (0..1). */
export function varTube(curve: THREE.Curve<THREE.Vector3>, segs: number, radial: number, rad: (t: number) => number, closed = false) {
  const g = new THREE.TubeGeometry(curve, segs, 1, radial, closed);
  const pos = g.attributes.position as THREE.BufferAttribute, p = V();
  const frames = curve.computeFrenetFrames(segs, closed);
  for (let i = 0; i <= segs; i++) {
    const t = i / segs, c = curve.getPointAt(t), r = rad(t);
    for (let j = 0; j <= radial; j++) { const idx = i * (radial + 1) + j; p.fromBufferAttribute(pos, idx).sub(c).multiplyScalar(r).add(c); pos.setXYZ(idx, p.x, p.y, p.z); }
  }
  void frames; g.computeVertexNormals(); return g;
}
export const curve = (pts: THREE.Vector3[] | [number, number, number][], tension = 0.5) => new THREE.CatmullRomCurve3(pts.map((p) => (Array.isArray(p) ? V(...p) : p)), false, 'catmullrom', tension);

export interface Branch { a: THREE.Vector3; b: THREE.Vector3; ra: number; rb: number; depth: number; mid?: THREE.Vector3 }
/** A branching tree (vessels, bronchi, dendrites): returns segments. */
export function tree(o: { root: THREE.Vector3; dir: THREE.Vector3; len: number; r: number; depth: number; spread?: number; shrink?: number; kids?: number; seed?: number; gravity?: THREE.Vector3; wiggle?: number }) {
  const R = rng(o.seed ?? 1), out: Branch[] = [];
  const spread = o.spread ?? 0.6, shrink = o.shrink ?? 0.72, kids = o.kids ?? 2;
  const grow = (a: THREE.Vector3, d: THREE.Vector3, len: number, r: number, depth: number) => {
    const dd = d.clone().normalize(); if (o.gravity) dd.add(o.gravity.clone().multiplyScalar(0.15)).normalize();
    const b = a.clone().addScaledVector(dd, len);
    const mid = a.clone().lerp(b, 0.5).add(V(R() - 0.5, R() - 0.5, R() - 0.5).multiplyScalar(len * (o.wiggle ?? 0.15)));
    out.push({ a, b, ra: r, rb: r * shrink, depth: o.depth - depth, mid });
    if (depth <= 0) return;
    for (let k = 0; k < kids; k++) {
      const axis = V(R() - 0.5, R() - 0.5, R() - 0.5).cross(dd).normalize();
      const nd = dd.clone().applyAxisAngle(axis, spread * (0.6 + R() * 0.8) * (k % 2 ? 1 : -1));
      grow(b, nd, len * (0.68 + R() * 0.18), r * shrink, depth - 1);
    }
  };
  grow(o.root, o.dir, o.len, o.r, o.depth);
  return out;
}
/** Merge tree segments into one tube geometry. */
export function treeGeo(segs: Branch[], radial = 8) {
  const gs = segs.map((s) => varTube(new THREE.QuadraticBezierCurve3(s.a, s.mid ?? s.a.clone().lerp(s.b, 0.5), s.b), 6, radial, (t) => lerp(s.ra, s.rb, t)));
  for (const s of segs) { const sp = new THREE.SphereGeometry(s.rb, radial, Math.max(4, radial / 2)); sp.translate(s.b.x, s.b.y, s.b.z); gs.push(sp as unknown as THREE.TubeGeometry); }
  return mergeGeometries(gs.map((g) => g.toNonIndexed()), false)!;
}
export { mergeGeometries, mergeVertices };

/** Points on a sphere, evenly (Fibonacci). */
export function fibSphere(n: number, r = 1) { const out: THREE.Vector3[] = []; const ga = Math.PI * (3 - Math.sqrt(5)); for (let i = 0; i < n; i++) { const y = 1 - (i / (n - 1 || 1)) * 2, rr = Math.sqrt(1 - y * y), th = ga * i; out.push(V(Math.cos(th) * rr * r, y * r, Math.sin(th) * rr * r)); } return out; }

/* ───────── materials ───────── */
const cache = new Map<string, THREE.Material>();
export interface MatOpts { rough?: number; metal?: number; clear?: number; sheen?: number; trans?: number; opacity?: number; emissive?: string; ei?: number; side?: THREE.Side; flat?: boolean; ior?: number; thick?: number; wire?: boolean; vc?: boolean }
export function mat(color: string, o: MatOpts = {}) {
  const key = color + JSON.stringify(o);
  let m = cache.get(key) as THREE.MeshPhysicalMaterial | undefined;
  if (!m) {
    m = new THREE.MeshPhysicalMaterial({ color, roughness: o.rough ?? 0.45, metalness: o.metal ?? 0, clearcoat: o.clear ?? 0.3, clearcoatRoughness: 0.35, sheen: o.sheen ?? 0, sheenColor: new THREE.Color(color).offsetHSL(0, -0.1, 0.25), transmission: o.trans ?? 0, thickness: o.thick ?? 0.5, ior: o.ior ?? 1.35, transparent: (o.opacity ?? 1) < 1, opacity: o.opacity ?? 1, depthWrite: (o.opacity ?? 1) >= 1, emissive: new THREE.Color(o.emissive ?? '#000000'), emissiveIntensity: o.ei ?? 1, side: o.side ?? THREE.FrontSide, flatShading: !!o.flat, wireframe: !!o.wire, vertexColors: !!o.vc });
    cache.set(key, m);
  }
  return m;
}
/** A unique, non-cached material (for things that animate their own uniforms). */
export function umat(color: string, o: MatOpts = {}) { cache.delete(color + JSON.stringify(o)); const m = mat(color, o); cache.delete(color + JSON.stringify(o)); return m as THREE.MeshPhysicalMaterial; }

export const PAL = {
  tissue: '#d9776b', tissueDeep: '#a8413c', muscle: '#b8443f', fat: '#f1d48a', bone: '#ede3cf', cartilage: '#cfe3e8', nerve: '#f2d16b', myelin: '#f5ecd2',
  artery: '#d1363a', vein: '#3f5fb5', blood: '#b3141c', plasma: '#f2c97a', membrane: '#f0b38a', nucleus: '#6b4fa8', dna: '#4fb3d9', rna: '#f28c3a',
  virus: '#9ad04f', spike: '#e8584a', capsid: '#7fc6d9', immune: '#5ab8a0', antibody: '#f2c94c', cancer: '#c44f9e', glow: '#7fe0ff', signal: '#ffd25a',
};
