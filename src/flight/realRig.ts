import * as THREE from 'three';
import { buildHanuman, type Rig } from '../leap/hanuman';

/**
 * The realistic Hanuman: the same original rig as The Leap to Lanka, but the
 * body is sculpted as one continuous surface instead of separate shapes.
 *
 * 1. In an A-pose (arms and legs apart so they don't fuse), the body is
 *    described as a signed distance field: round cones and ellipsoids for
 *    muscles, joined with a smooth minimum.
 * 2. Surface nets turn the field into a mesh, which is smoothed.
 * 3. Every vertex is weighted to the bones whose shapes it is closest to, and
 *    the mesh is bound as a SkinnedMesh, so elbows, shoulders and hips bend
 *    smoothly.
 * 4. Tail, hair, sash and dhoti become skinned tubes and ribbons; ornaments
 *    stay rigid; everything gets physically based materials.
 */

type V3 = [number, number, number];
type Prim =
  | { bone: string; kind: 'ell'; at: V3; r: V3; k?: number; sub?: boolean }
  | { bone: string; kind: 'cone'; a: V3; b: V3; r1: number; r2: number; k?: number; sub?: boolean };

/** Anatomy, as shapes on bones (joint-local coordinates; he faces +Z). */
function bodyPrims(): Prim[] {
  const P: Prim[] = [];
  const ell = (bone: string, at: V3, r: V3, k?: number, sub?: boolean) => P.push({ bone, kind: 'ell', at, r, k, sub });
  const cone = (bone: string, a: V3, b: V3, r1: number, r2: number, k?: number, sub?: boolean) => P.push({ bone, kind: 'cone', a, b, r1, r2, k, sub });
  // pelvis and waist
  ell('hips', [0, -0.03, -0.005], [0.165, 0.12, 0.12]);
  for (const sx of [-1, 1]) { ell('hips', [sx * 0.075, -0.06, -0.075], [0.09, 0.1, 0.075]); ell('hips', [sx * 0.14, 0.03, 0], [0.04, 0.04, 0.06], 0.03); }
  ell('hips', [0, 0, 0.06], [0.12, 0.09, 0.06]);
  ell('spine', [0, 0.08, -0.005], [0.145, 0.15, 0.11]);
  for (const sx of [-1, 1]) {
    ell('spine', [sx * 0.112, 0.07, 0.01], [0.055, 0.11, 0.08]);
    ell('spine', [sx * 0.045, 0.1, -0.088], [0.04, 0.12, 0.04], 0.03);
    for (let r = 0; r < 3; r++) ell('spine', [sx * 0.04, 0.02 + r * 0.06, 0.087], [0.04, 0.03, 0.025], 0.018);
  }
  // rib cage, chest, back
  ell('chest', [0, 0.12, -0.015], [0.215, 0.2, 0.15]);
  ell('chest', [0, 0.25, -0.05], [0.17, 0.07, 0.1]);
  for (const sx of [-1, 1]) {
    ell('chest', [sx * 0.15, 0.06, -0.05], [0.09, 0.15, 0.08]);
    ell('chest', [sx * 0.085, 0.15, 0.085], [0.12, 0.08, 0.06], 0.035);
    ell('chest', [sx * 0.17, 0.07, 0.05], [0.04, 0.06, 0.04], 0.025);
    cone('chest', [sx * 0.05, 0.3, -0.03], [sx * 0.22, 0.24, -0.02], 0.055, 0.04);
    cone('chest', [sx * 0.03, 0.27, 0.07], [sx * 0.2, 0.27, 0.03], 0.022, 0.02, 0.02);
  }
  cone('chest', [0, 0.06, 0.13], [0, 0.22, 0.145], 0.012, 0.012, 0.02, true);
  // neck and head
  cone('neck', [0, -0.02, 0], [0, 0.1, 0.01], 0.07, 0.062);
  for (const sx of [-1, 1]) cone('neck', [sx * 0.04, -0.01, 0.045], [sx * 0.012, 0.09, 0.055], 0.02, 0.016, 0.02);
  ell('head', [0, 0.13, -0.02], [0.115, 0.125, 0.125]);
  cone('head', [-0.075, 0.165, 0.085], [0.075, 0.165, 0.085], 0.028, 0.028);
  for (const sx of [-1, 1]) {
    ell('head', [sx * 0.07, 0.11, 0.07], [0.04, 0.03, 0.04], 0.025);
    ell('head', [sx * 0.075, 0.03, 0], [0.04, 0.05, 0.05], 0.03);
    ell('head', [sx * 0.118, 0.115, -0.01], [0.022, 0.045, 0.03], 0.015);
  }
  ell('head', [0, 0.075, 0.105], [0.075, 0.06, 0.07]);
  ell('head', [0, 0.06, 0.15], [0.055, 0.035, 0.04], 0.025);
  ell('head', [0, 0.015, 0.085], [0.085, 0.05, 0.07]);
  cone('head', [0, 0.15, 0.11], [0, 0.098, 0.146], 0.016, 0.017, 0.02);
  for (const sx of [-1, 1]) {
    ell('head', [sx * 0.046, 0.14, 0.108], [0.03, 0.024, 0.03], 0.015, true);
    ell('head', [sx * 0.014, 0.085, 0.17], [0.008, 0.006, 0.012], 0.008, true);
  }
  cone('head', [-0.038, 0.044, 0.15], [0.038, 0.044, 0.15], 0.0035, 0.0035, 0.008, true);
  // arms
  for (const [side, sx] of [['L', 1], ['R', -1]] as const) {
    ell(`shoulder${side}`, [sx * 0.01, -0.03, 0], [0.085, 0.1, 0.085]);
    cone(`upperArm${side}`, [0, 0, 0], [0, -0.29, 0], 0.06, 0.048);
    ell(`upperArm${side}`, [0, -0.15, 0.03], [0.048, 0.09, 0.05], 0.03);
    ell(`upperArm${side}`, [0, -0.11, -0.035], [0.05, 0.1, 0.048], 0.03);
    cone(`forearm${side}`, [0, 0, 0], [0, -0.26, 0], 0.05, 0.033);
    ell(`forearm${side}`, [sx * 0.01, -0.07, 0.01], [0.05, 0.08, 0.045], 0.03);
    ell(`hand${side}`, [0, -0.045, 0], [0.045, 0.05, 0.028]);
    for (let i = 0; i < 4; i++) { const x = sx * (-0.03 + i * 0.02); cone(`hand${side}`, [x, -0.09, 0.005], [x, -0.07, 0.045], 0.013, 0.012, 0.012); }
    cone(`hand${side}`, [sx * 0.035, -0.03, 0.02], [sx * 0.025, -0.065, 0.05], 0.013, 0.012, 0.012);
    // legs
    cone(`thigh${side}`, [0, 0, 0], [0, -0.43, 0], 0.085, 0.06);
    ell(`thigh${side}`, [0, -0.2, 0.04], [0.07, 0.17, 0.06], 0.035);
    ell(`thigh${side}`, [-sx * 0.035, -0.34, 0.035], [0.04, 0.06, 0.04], 0.03);
    ell(`thigh${side}`, [0, -0.2, -0.04], [0.065, 0.16, 0.055], 0.035);
    ell(`shin${side}`, [0, 0, 0.02], [0.05, 0.05, 0.05], 0.03);
    cone(`shin${side}`, [0, 0, 0], [0, -0.4, 0], 0.05, 0.032);
    ell(`shin${side}`, [0, -0.11, -0.04], [0.048, 0.11, 0.05], 0.03);
    ell(`foot${side}`, [0, 0, 0], [0.035, 0.035, 0.035], 0.02);
    ell(`foot${side}`, [0, -0.04, -0.015], [0.035, 0.03, 0.04], 0.02);
    ell(`foot${side}`, [0, -0.045, 0.06], [0.045, 0.025, 0.085], 0.025);
    cone(`foot${side}`, [0, -0.05, 0.12], [0, -0.05, 0.16], 0.02, 0.018, 0.015);
  }
  return P;
}

/* ───────── distance functions ───────── */

function sdEllipsoid(px: number, py: number, pz: number, rx: number, ry: number, rz: number) {
  const k0 = Math.hypot(px / rx, py / ry, pz / rz);
  const k1 = Math.hypot(px / (rx * rx), py / (ry * ry), pz / (rz * rz));
  return k1 === 0 ? -Math.min(rx, ry, rz) : (k0 * (k0 - 1)) / k1;
}
/** iq's round cone between a (radius r1) and b (radius r2) */
function sdRoundCone(p: THREE.Vector3, a: THREE.Vector3, b: THREE.Vector3, r1: number, r2: number) {
  const ba = b.clone().sub(a), l2 = ba.dot(ba), rr = r1 - r2, a2 = l2 - rr * rr, il2 = 1 / l2;
  const pa = p.clone().sub(a), y = pa.dot(ba), z = y - l2;
  const xv = pa.clone().multiplyScalar(l2).sub(ba.clone().multiplyScalar(y));
  const x2 = xv.dot(xv), y2 = y * y * l2, z2 = z * z * l2;
  const k = Math.sign(rr) * rr * rr * x2;
  if (Math.sign(z) * a2 * z2 > k) return Math.sqrt(x2 + z2) * il2 - r2;
  if (Math.sign(y) * a2 * y2 < k) return Math.sqrt(x2 + y2) * il2 - r1;
  return (Math.sqrt(x2 * a2 * il2) + y * rr) * il2 - r1;
}
const smin = (a: number, b: number, k: number) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25; };

type WorldPrim = { bone: string; f: (p: THREE.Vector3) => number; box: THREE.Box3; k: number; sub: boolean };

function toWorld(prims: Prim[], j: Record<string, THREE.Object3D>): WorldPrim[] {
  return prims.map((pr) => {
    const m = j[pr.bone].matrixWorld, inv = m.clone().invert();
    if (pr.kind === 'ell') {
      const c = new THREE.Vector3(...pr.at).applyMatrix4(m), R = Math.max(...pr.r);
      const q = new THREE.Vector3();
      return {
        bone: pr.bone, k: pr.k ?? 0.04, sub: !!pr.sub,
        box: new THREE.Box3(c.clone().subScalar(R + 0.06), c.clone().addScalar(R + 0.06)),
        f: (p) => { q.copy(p).applyMatrix4(inv); return sdEllipsoid(q.x - pr.at[0], q.y - pr.at[1], q.z - pr.at[2], pr.r[0], pr.r[1], pr.r[2]); },
      };
    }
    const a = new THREE.Vector3(...pr.a).applyMatrix4(m), b = new THREE.Vector3(...pr.b).applyMatrix4(m), R = Math.max(pr.r1, pr.r2);
    const box = new THREE.Box3().setFromPoints([a, b]).expandByScalar(R + 0.06);
    return { bone: pr.bone, k: pr.k ?? 0.04, sub: !!pr.sub, box, f: (p) => sdRoundCone(p, a, b, pr.r1, pr.r2) };
  });
}

/* ───────── surface nets ───────── */

function surfaceNets(prims: WorldPrim[], h: number) {
  const box = new THREE.Box3();
  prims.filter((p) => !p.sub).forEach((p) => box.union(p.box));
  const nx = Math.ceil((box.max.x - box.min.x) / h) + 1, ny = Math.ceil((box.max.y - box.min.y) / h) + 1, nz = Math.ceil((box.max.z - box.min.z) / h) + 1;
  const F = new Float32Array(nx * ny * nz).fill(1);
  const idx = (x: number, y: number, z: number) => x + nx * (y + ny * z);
  const p = new THREE.Vector3();
  // accumulate a smooth union, primitive by primitive, inside each one's box
  // unions first, then carve the subtractions
  for (const pr of [...prims.filter((q) => !q.sub), ...prims.filter((q) => q.sub)]) {
    const x0 = Math.max(0, Math.floor((pr.box.min.x - box.min.x) / h)), x1 = Math.min(nx - 1, Math.ceil((pr.box.max.x - box.min.x) / h));
    const y0 = Math.max(0, Math.floor((pr.box.min.y - box.min.y) / h)), y1 = Math.min(ny - 1, Math.ceil((pr.box.max.y - box.min.y) / h));
    const z0 = Math.max(0, Math.floor((pr.box.min.z - box.min.z) / h)), z1 = Math.min(nz - 1, Math.ceil((pr.box.max.z - box.min.z) / h));
    for (let z = z0; z <= z1; z++) for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      p.set(box.min.x + x * h, box.min.y + y * h, box.min.z + z * h);
      const i = idx(x, y, z);
      F[i] = pr.sub ? -smin(-F[i], pr.f(p), pr.k) : smin(F[i], pr.f(p), pr.k);
    }
  }
  // one vertex per sign-changing cell, at the mean of its edge crossings
  const vIndex = new Int32Array((nx - 1) * (ny - 1) * (nz - 1)).fill(-1);
  const cidx = (x: number, y: number, z: number) => x + (nx - 1) * (y + (ny - 1) * z);
  const verts: number[] = [];
  const corner = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1]];
  const edges = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
  const v = new Float32Array(8);
  for (let z = 0; z < nz - 1; z++) for (let y = 0; y < ny - 1; y++) for (let x = 0; x < nx - 1; x++) {
    let mask = 0;
    for (let c = 0; c < 8; c++) { v[c] = F[idx(x + corner[c][0], y + corner[c][1], z + corner[c][2])]; if (v[c] < 0) mask |= 1 << c; }
    if (mask === 0 || mask === 255) continue;
    let sx = 0, sy = 0, sz = 0, n = 0;
    for (const [a, b] of edges) {
      if ((v[a] < 0) === (v[b] < 0)) continue;
      const t = v[a] / (v[a] - v[b]);
      sx += corner[a][0] + (corner[b][0] - corner[a][0]) * t;
      sy += corner[a][1] + (corner[b][1] - corner[a][1]) * t;
      sz += corner[a][2] + (corner[b][2] - corner[a][2]) * t;
      n++;
    }
    vIndex[cidx(x, y, z)] = verts.length / 3;
    verts.push(box.min.x + (x + sx / n) * h, box.min.y + (y + sy / n) * h, box.min.z + (z + sz / n) * h);
  }
  // a quad across every sign-changing grid edge
  const tris: number[] = [];
  const quad = (a: number, b: number, c: number, d: number, flip: boolean) => {
    if (a < 0 || b < 0 || c < 0 || d < 0) return;
    if (flip) tris.push(a, c, b, a, d, c); else tris.push(a, b, c, a, c, d);
  };
  for (let z = 1; z < nz - 1; z++) for (let y = 1; y < ny - 1; y++) for (let x = 1; x < nx - 1; x++) {
    const s0 = F[idx(x, y, z)] < 0;
    if (x < nx - 1 && s0 !== (F[idx(x + 1, y, z)] < 0)) quad(vIndex[cidx(x, y - 1, z - 1)], vIndex[cidx(x, y, z - 1)], vIndex[cidx(x, y, z)], vIndex[cidx(x, y - 1, z)], s0);
    if (y < ny - 1 && s0 !== (F[idx(x, y + 1, z)] < 0)) quad(vIndex[cidx(x - 1, y, z - 1)], vIndex[cidx(x - 1, y, z)], vIndex[cidx(x, y, z)], vIndex[cidx(x, y, z - 1)], s0);
    if (z < nz - 1 && s0 !== (F[idx(x, y, z + 1)] < 0)) quad(vIndex[cidx(x - 1, y - 1, z)], vIndex[cidx(x, y - 1, z)], vIndex[cidx(x, y, z)], vIndex[cidx(x - 1, y, z)], s0);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  g.setIndex(tris);
  return g;
}

/** Taubin smoothing: smooths without shrinking. */
function smooth(g: THREE.BufferGeometry, iters = 3) {
  const pos = g.attributes.position as THREE.BufferAttribute, n = pos.count, ix = g.index!.array;
  const nb: Set<number>[] = Array.from({ length: n }, () => new Set());
  for (let i = 0; i < ix.length; i += 3) { const a = ix[i], b = ix[i + 1], c = ix[i + 2]; nb[a].add(b).add(c); nb[b].add(a).add(c); nb[c].add(a).add(b); }
  const P = pos.array as Float32Array, tmp = new Float32Array(P.length);
  const pass = (lam: number) => {
    for (let i = 0; i < n; i++) {
      let x = 0, y = 0, z = 0, c = 0;
      nb[i].forEach((j) => { x += P[j * 3]; y += P[j * 3 + 1]; z += P[j * 3 + 2]; c++; });
      if (!c) { tmp[i * 3] = P[i * 3]; tmp[i * 3 + 1] = P[i * 3 + 1]; tmp[i * 3 + 2] = P[i * 3 + 2]; continue; }
      tmp[i * 3] = P[i * 3] + lam * (x / c - P[i * 3]);
      tmp[i * 3 + 1] = P[i * 3 + 1] + lam * (y / c - P[i * 3 + 1]);
      tmp[i * 3 + 2] = P[i * 3 + 2] + lam * (z / c - P[i * 3 + 2]);
    }
    P.set(tmp);
  };
  for (let k = 0; k < iters; k++) { pass(0.5); pass(-0.53); }
  pos.needsUpdate = true;
}

/* ───────── skinning helpers ───────── */

function setSkin(g: THREE.BufferGeometry, weights: Map<number, number>[]) {
  const n = weights.length, si = new Uint16Array(n * 4), sw = new Float32Array(n * 4);
  weights.forEach((m, i) => {
    const top = [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
    const tot = top.reduce((s, [, w]) => s + w, 0) || 1;
    top.forEach(([b, w], k) => { si[i * 4 + k] = b; sw[i * 4 + k] = w / tot; });
  });
  g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4));
  g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4));
}

/** A tapered tube along a chain of bones, skinned to them. */
function chainTube(chain: THREE.Object3D[], boneIndex: (o: THREE.Object3D) => number, r0: number, r1: number, extra = 0.08, radial = 10, offset = new THREE.Vector3()) {
  const pts = chain.map((b) => new THREE.Vector3().setFromMatrixPosition(b.matrixWorld).add(offset));
  const last = pts[pts.length - 1], prev = pts[pts.length - 2];
  pts.push(last.clone().add(last.clone().sub(prev).normalize().multiplyScalar(extra)));
  const curve = new THREE.CatmullRomCurve3(pts);
  const segs = chain.length * 6;
  const g = new THREE.TubeGeometry(curve, segs, 1, radial, false);
  const pos = g.attributes.position as THREE.BufferAttribute, weights: Map<number, number>[] = [];
  for (let i = 0; i < pos.count; i++) {
    const ring = Math.floor(i / (radial + 1)), t = ring / segs;
    const c = curve.getPointAt(Math.min(1, t));
    const r = r0 + (r1 - r0) * t;
    const v = new THREE.Vector3().fromBufferAttribute(pos, i).sub(c).normalize().multiplyScalar(r).add(c);
    pos.setXYZ(i, v.x, v.y, v.z);
    const f = t * chain.length, a = Math.min(chain.length - 1, Math.floor(f)), b = Math.min(chain.length - 1, a + 1), w = f - a;
    const m = new Map<number, number>();
    m.set(boneIndex(chain[a]), 1 - w);
    m.set(boneIndex(chain[b]), (m.get(boneIndex(chain[b])) ?? 0) + w);
    weights.push(m);
  }
  g.computeVertexNormals();
  setSkin(g, weights);
  return g;
}

/** A ribbon of cloth along a chain, skinned to it. */
function chainRibbon(chain: THREE.Object3D[], boneIndex: (o: THREE.Object3D) => number, w0: number, w1: number, len: number) {
  const across = new THREE.Vector3(1, 0, 0);
  const pts = chain.map((b) => new THREE.Vector3().setFromMatrixPosition(b.matrixWorld));
  const tip = pts[pts.length - 1].clone().add(new THREE.Vector3(0, -len, 0));
  pts.push(tip);
  const curve = new THREE.CatmullRomCurve3(pts);
  const segs = chain.length * 4, cols = 4;
  const pos: number[] = [], idx: number[] = [], weights: Map<number, number>[] = [];
  for (let i = 0; i <= segs; i++) {
    const t = i / segs, c = curve.getPointAt(t), w = w0 + (w1 - w0) * t;
    const f = t * chain.length, a = Math.min(chain.length - 1, Math.floor(f)), b = Math.min(chain.length - 1, a + 1), k = f - a;
    for (let j = 0; j <= cols; j++) {
      const u = j / cols - 0.5;
      const ripple = Math.sin(t * 9 + u * 3) * 0.006;
      pos.push(c.x + across.x * u * w, c.y, c.z + ripple);
      const m = new Map<number, number>(); m.set(boneIndex(chain[a]), 1 - k); m.set(boneIndex(chain[b]), (m.get(boneIndex(chain[b])) ?? 0) + k);
      weights.push(m);
    }
  }
  for (let i = 0; i < segs; i++) for (let j = 0; j < cols; j++) { const a = i * (cols + 1) + j; idx.push(a, a + cols + 1, a + 1, a + 1, a + cols + 1, a + cols + 2); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  setSkin(g, weights);
  return g;
}

/* ───────── materials ───────── */

const NOISE_GLSL = `
float h3(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
float vnoise3(vec3 p) { vec3 i = floor(p), f = fract(p); vec3 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h3(i), h3(i + vec3(1,0,0)), u.x), mix(h3(i + vec3(0,1,0)), h3(i + vec3(1,1,0)), u.x), u.y),
             mix(mix(h3(i + vec3(0,0,1)), h3(i + vec3(1,0,1)), u.x), mix(h3(i + vec3(0,1,1)), h3(i + vec3(1,1,1)), u.x), u.y), u.z); }
`;

/**
 * Short fur, as shells: copies of the skinned body pushed out along the
 * normal, each one keeping only the strands tall enough to reach it. The
 * face, palms and soles stay bare.
 */
export function furShells(body: THREE.SkinnedMesh, count: number, length: number, headY: number) {
  const shells: THREE.SkinnedMesh[] = [];
  for (let i = 1; i <= count; i++) {
    const level = i / count;
    const m = new THREE.MeshStandardMaterial({ color: new THREE.Color('#3a190b').lerp(new THREE.Color('#a95e28'), Math.pow(level, 0.8)), roughness: 0.8, transparent: false, alphaTest: 0.5 });
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uLen = { value: length * level };
      sh.uniforms.uLevel = { value: level };
      sh.vertexShader = 'uniform float uLen;\nvarying vec3 vRest;\n' + sh.vertexShader.replace('#include <skinning_vertex>', '#include <skinning_vertex>\n transformed += normalize(objectNormal) * uLen;\n vRest = position;');
      sh.fragmentShader = 'uniform float uLevel;\nvarying vec3 vRest;\n' + NOISE_GLSL + sh.fragmentShader.replace('#include <alphatest_fragment>', `
        float strand = h3(floor(vRest * 300.0));
        float clump = vnoise3(vRest * 38.0);
        float tall = strand * 0.75 + clump * 0.45;
        bool face = vRest.y > ${headY.toFixed(3)} && vRest.z > 0.0;
        if (tall < uLevel * 1.05 || face) discard;
        diffuseColor.a = 1.0;
        #include <alphatest_fragment>`);
    };
    const sh = new THREE.SkinnedMesh(body.geometry, m);
    sh.name = `Fur${i}`;
    sh.frustumCulled = false;
    sh.castShadow = false; sh.receiveShadow = true;
    shells.push(sh);
  }
  return shells;
}

export function realMaterials() {
  const skin = new THREE.MeshPhysicalMaterial({ name: 'Skin', color: '#86401f', roughness: 0.66, sheen: 0.35, sheenColor: new THREE.Color('#c98a66'), sheenRoughness: 0.5 });
  skin.onBeforeCompile = (sh) => {
    sh.vertexShader = 'varying vec3 vRest;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vRest = position;');
    sh.fragmentShader = 'varying vec3 vRest;\n' + NOISE_GLSL + sh.fragmentShader
      // pores and mottling: perturb the normal with fine noise fixed to the body
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        vec3 nz = vec3(vnoise3(vRest * 90.0), vnoise3(vRest * 90.0 + 17.0), vnoise3(vRest * 90.0 + 41.0)) - 0.5;
        normal = normalize(normal + nz * 0.16);`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        diffuseColor.rgb *= 0.88 + 0.24 * vnoise3(vRest * 14.0);`)
      // a soft, warm wrap of light at the silhouette, like light under skin
      .replace('#include <opaque_fragment>', `
        float wrapL = pow(1.0 - max(dot(normal, normalize(vViewPosition)), 0.0), 2.0);
        outgoingLight += vec3(0.30, 0.08, 0.03) * wrapL * 0.25;
        #include <opaque_fragment>`);
  };
  return {
    Skin: skin,
    SkinLight: skin,
    Gold: new THREE.MeshPhysicalMaterial({ name: 'Gold', color: '#cf9b45', metalness: 1, roughness: 0.33, clearcoat: 0.25, clearcoatRoughness: 0.3 }),
    GoldDark: new THREE.MeshPhysicalMaterial({ name: 'GoldDark', color: '#9c7a3a', metalness: 1, roughness: 0.42 }),
    Cloth: new THREE.MeshPhysicalMaterial({ name: 'Cloth', color: '#c2511a', roughness: 0.5, sheen: 1, sheenColor: new THREE.Color('#ffb067'), sheenRoughness: 0.35, side: THREE.DoubleSide }),
    ClothDark: new THREE.MeshPhysicalMaterial({ name: 'ClothDark', color: '#7c1f12', roughness: 0.5, sheen: 1, sheenColor: new THREE.Color('#e0785a'), sheenRoughness: 0.4, side: THREE.DoubleSide }),
    Hair: new THREE.MeshPhysicalMaterial({ name: 'Hair', color: '#1b130e', roughness: 0.38, sheen: 0.7, sheenColor: new THREE.Color('#7a5a3a'), sheenRoughness: 0.3 }),
    Eye: new THREE.MeshPhysicalMaterial({ name: 'Eye', color: '#7d6650', roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.05 }),
    Pupil: new THREE.MeshPhysicalMaterial({ name: 'Pupil', color: '#4a2709', roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.03 }),
    Black: new THREE.MeshPhysicalMaterial({ name: 'Black', color: '#080504', roughness: 0.1, clearcoat: 1 }),
    Mouth: new THREE.MeshPhysicalMaterial({ name: 'Mouth', color: '#5c1d14', roughness: 0.6 }),
  } as Record<string, THREE.MeshPhysicalMaterial>;
}

const SCULPTED = /^(pelvis|abdomen|abs|chestM|lats|pec|traps|neckm|skull|jaw|muzzle|brow|ear|nose|mouth|deltoid|upperArmM|bicep|forearmM|fist|thumb|thighM|quad|shinM|calf|footM|tail_m|tailTip|hair[A-Z0-9]*_m|sash_m|flap[FB]_m|dhoti)/;

export type RealRig = Rig & { body3d: THREE.SkinnedMesh; extras: THREE.SkinnedMesh[]; fur: THREE.SkinnedMesh[] };

/** Build the realistic rig. Takes about a second: the sculpting runs once. */
export function buildRealHanuman(opts: { fur?: number } = {}): RealRig {
  const rig = buildHanuman();
  const mats = realMaterials();
  const j = rig.j;
  // A-pose for binding: limbs apart so the field doesn't fuse them
  j.shoulderL.rotation.z = 0.5; j.shoulderR.rotation.z = -0.5;
  j.thighL.rotation.z = 0.2; j.thighR.rotation.z = -0.2;
  rig.root.updateMatrixWorld(true);

  // remove the toon body parts and swap materials on the rest
  const remove: THREE.Object3D[] = [];
  rig.root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    if (SCULPTED.test(m.name)) { remove.push(m); return; }
    const name = (m.material as THREE.Material).name;
    m.material = mats[name] ?? mats.Gold;
    m.castShadow = true; m.receiveShadow = true;
  });
  remove.forEach((m) => m.parent?.remove(m));

  // the bones the skins use
  const bones: THREE.Bone[] = [];
  rig.root.traverse((o) => { if ((o as THREE.Bone).isBone) bones.push(o as THREE.Bone); });
  const boneIdx = new Map(bones.map((b, i) => [b, i]));
  const bi = (o: THREE.Object3D) => boneIdx.get(o as THREE.Bone) ?? 0;
  const skeleton = new THREE.Skeleton(bones);

  // the sculpted body
  const prims = toWorld(bodyPrims(), j);
  const g = surfaceNets(prims, 0.007);
  smooth(g, 3);
  g.computeVertexNormals();
  const solid = prims.filter((q) => !q.sub);
  const pos = g.attributes.position as THREE.BufferAttribute, p = new THREE.Vector3();
  const weights: Map<number, number>[] = [];
  for (let i = 0; i < pos.count; i++) {
    p.fromBufferAttribute(pos, i);
    const ds = solid.map((pr) => pr.f(p)), dmin = Math.min(...ds);
    const m = new Map<number, number>();
    ds.forEach((d, k) => { const w = Math.exp(-(d - dmin) / 0.022); if (w > 0.01) { const b = bi(j[solid[k].bone]); m.set(b, (m.get(b) ?? 0) + w); } });
    weights.push(m);
  }
  setSkin(g, weights);
  const body3d = new THREE.SkinnedMesh(g, mats.Skin);
  body3d.name = 'BodySkin';
  body3d.castShadow = true; body3d.receiveShadow = true;
  body3d.frustumCulled = false;

  // tail, hair, sash and dhoti flaps as skinned tubes and ribbons
  const extras: THREE.SkinnedMesh[] = [];
  const add = (geo: THREE.BufferGeometry, mat: THREE.Material, name: string) => { const sm = new THREE.SkinnedMesh(geo, mat); sm.name = name; sm.castShadow = true; sm.receiveShadow = true; sm.frustumCulled = false; extras.push(sm); };
  add(chainTube(rig.chains.tail, bi, 0.045, 0.014, 0.1, 12), mats.Skin, 'TailSkin');
  for (const nm of ['hairC', 'hairL', 'hairR', 'hairL2', 'hairR2']) for (const [ox, oz] of [[0, 0], [0.018, 0.01], [-0.018, 0.012]]) add(chainTube(rig.chains[nm], bi, 0.024, 0.006, 0.08, 7, new THREE.Vector3(ox, 0, oz)), mats.Hair, `${nm}Strand`);
  add(chainRibbon(rig.chains.sash, bi, 0.13, 0.08, 0.1), mats.Cloth, 'SashCloth');
  add(chainRibbon(rig.chains.flapF, bi, 0.085, 0.06, 0.06), mats.Cloth, 'FlapFront');
  // the dhoti: a wrap at the hips, and pleated cloth round each thigh to the knee
  {
    const wrap = new THREE.LatheGeometry([[0.19, 0.09], [0.2, 0.06], [0.205, 0.0], [0.2, -0.06], [0.19, -0.1]].map(([r, y]) => new THREE.Vector2(r, y)), 48);
    wrap.applyMatrix4(j.hips.matrixWorld);
    setSkin(wrap, Array.from({ length: wrap.attributes.position.count }, () => new Map([[bi(j.hips), 1]])));
    add(wrap, mats.Cloth, 'DhotiWrap');
    for (const side of ['L', 'R']) {
      const th = j[`thigh${side}`];
      const rows = 18, cols = 40, pos: number[] = [], idx: number[] = [], ws: Map<number, number>[] = [];
      for (let i = 0; i <= rows; i++) {
        const t = i / rows, y = 0.04 - t * 0.44, r = 0.098 - t * 0.022 + t * t * 0.03;
        for (let c = 0; c <= cols; c++) {
          const a = (c / cols) * Math.PI * 2, fold = 1 + 0.07 * Math.sin(a * 7 + t * 5) * (0.4 + t) + 0.03 * Math.sin(a * 13 - t * 9);
          const v = new THREE.Vector3(Math.cos(a) * r * fold, y, Math.sin(a) * r * fold).applyMatrix4(th.matrixWorld);
          pos.push(v.x, v.y, v.z);
          const top = Math.max(0, 1 - t * 4);
          ws.push(new Map([[bi(j.hips), top * 0.6], [bi(th), 1 - top * 0.6]]));
        }
      }
      for (let i = 0; i < rows; i++) for (let c = 0; c < cols; c++) { const q = i * (cols + 1) + c; idx.push(q, q + 1, q + cols + 1, q + 1, q + cols + 2, q + cols + 1); }
      const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); gg.setIndex(idx); gg.computeVertexNormals();
      setSkin(gg, ws);
      add(gg, mats.Cloth, `DhotiLeg${side}`);
    }
  }

  // ornaments refitted to the sculpted body
  for (const side of ['L', 'R']) {
    const band = rig.root.getObjectByName(`bajuband${side}`); band?.scale.setScalar(0.8);
    const jewel = rig.root.getObjectByName(`bajubandJewel${side}`); if (jewel) jewel.position.x *= 0.8;
    const g = rig.root.getObjectByName(`gauntlet${side}`); g?.scale.set(0.74, 1, 0.74);
    const a = rig.root.getObjectByName(`anklet${side}`); a?.scale.setScalar(0.78);
  }
  rig.root.getObjectByName('gadaHead')?.scale.setScalar(0.85);
  rig.root.getObjectByName('belt')?.scale.set(0.74, 1, 0.76);
  const buckle = rig.root.getObjectByName('buckle'); if (buckle) buckle.position.z = 0.17;
  {
    const old = rig.root.getObjectByName('necklace'), pend = rig.root.getObjectByName('pendant');
    old?.parent?.remove(old); pend?.parent?.remove(pend);
    const field = (q: THREE.Vector3) => { let d = 1; for (const pr of solid) d = smin(d, pr.f(q), pr.k); return d; };
    const toChest = j.chest.matrixWorld.clone().invert();
    const bead = new THREE.SphereGeometry(0.0085, 10, 8);
    const cBase = new THREE.Vector3().setFromMatrixPosition(j.chest.matrixWorld);
    for (let i = 0; i <= 26; i++) {
      const th = -1.25 + (i / 26) * 2.5;
      const q = new THREE.Vector3(cBase.x + Math.sin(th) * 0.14, cBase.y + 0.31 - Math.cos(th) * 0.13, cBase.z + 0.3);
      for (let it = 0; it < 80 && field(q) > 0.004; it++) q.z -= Math.max(0.001, field(q) * 0.8);
      const m = new THREE.Mesh(bead, mats.Gold); m.position.copy(q.applyMatrix4(toChest)); m.castShadow = true;
      j.chest.add(m);
      if (i === 13) {
        const pd = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), mats.Gold); pd.scale.set(0.026, 0.034, 0.012); pd.position.copy(m.position).add(new THREE.Vector3(0, -0.035, 0.012)); j.chest.add(pd);
        const gem = new THREE.Mesh(new THREE.SphereGeometry(0.011, 12, 10), new THREE.MeshPhysicalMaterial({ color: '#9b0f1a', roughness: 0.05, clearcoat: 1 })); gem.position.copy(pd.position).add(new THREE.Vector3(0, 0, 0.012)); j.chest.add(gem);
      }
    }
  }

  // an ornate mukut: tiers, a jewelled band and a front plate
  {
    const crown = rig.root.getObjectByName('crown') as THREE.Mesh;
    if (crown) {
      const prof = [[0.128, 0], [0.136, 0.02], [0.126, 0.04], [0.118, 0.05], [0.125, 0.07], [0.11, 0.09], [0.098, 0.12], [0.105, 0.135], [0.086, 0.16], [0.07, 0.19], [0.076, 0.205], [0.055, 0.23], [0.04, 0.26], [0.046, 0.27], [0.025, 0.3], [0.031, 0.315], [0.008, 0.345], [0.001, 0.36]];
      const g2 = new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 48);
      const gp = g2.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < gp.count; i++) { const x = gp.getX(i), z = gp.getZ(i), y = gp.getY(i), a = Math.atan2(z, x), k = 1 + 0.04 * Math.cos(a * 12) * Math.min(1, y * 8); gp.setXYZ(i, x * k, y, z * k); }
      g2.computeVertexNormals();
      crown.geometry = g2;
      crown.scale.y = 0.86;
      const ruby = new THREE.MeshPhysicalMaterial({ color: '#9b0f1a', roughness: 0.05, transmission: 0.2, clearcoat: 1 });
      const emerald = new THREE.MeshPhysicalMaterial({ color: '#0c5a35', roughness: 0.05, clearcoat: 1 });
      for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; const gem = new THREE.Mesh(new THREE.SphereGeometry(0.011, 10, 8), i % 2 ? emerald : ruby); gem.position.set(Math.cos(a) * 0.134, crown.position.y + 0.03, crown.position.z + Math.sin(a) * 0.134); crown.parent!.add(gem); }
      const plate = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), mats.Gold); plate.scale.set(0.05, 0.075, 0.012); plate.position.set(0, crown.position.y + 0.1, crown.position.z + 0.105); crown.parent!.add(plate);
      const jewel = new THREE.Mesh(new THREE.SphereGeometry(0.016, 12, 10), ruby); jewel.position.set(0, crown.position.y + 0.1, crown.position.z + 0.118); crown.parent!.add(jewel);
    }
    const gh = rig.root.getObjectByName('gadaHead') as THREE.Mesh;
    if (gh) {
      const gp = gh.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < gp.count; i++) { const x = gp.getX(i), z = gp.getZ(i), a = Math.atan2(z, x), k = 1 + 0.08 * Math.max(0, Math.cos(a * 8)); gp.setXYZ(i, x * k, gp.getY(i), z * k); }
      gh.geometry.computeVertexNormals();
    }
  }

  // eyes: smaller, set back under the brow, amber irises with dark pupils
  for (const sx of [-1, 1]) {
    const eye = rig.root.getObjectByName(`eye${sx}`) as THREE.Mesh, iris = rig.root.getObjectByName(`pupil${sx}`) as THREE.Mesh;
    if (eye) { eye.scale.set(0.7, 0.72, 0.8); eye.position.set(sx * 0.047, 0.14, 0.1); }
    if (iris) {
      iris.scale.set(1.3, 1.05, 0.7); iris.position.set(sx * 0.046, 0.139, 0.111);
      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.0062, 12, 8), mats.Black); pupil.position.set(sx * 0.046, 0.139, 0.1188); iris.parent!.add(pupil);
    }
  }
  const headY = new THREE.Vector3().setFromMatrixPosition(j.neck.matrixWorld).y + 0.04;
  const fur = opts.fur ? furShells(body3d, opts.fur, 0.014, headY) : [];
  [body3d, ...extras, ...fur].forEach((m) => { rig.root.add(m); m.bind(skeleton, m.matrixWorld); });
  // back to a neutral pose; applyPose drives everything from here
  j.shoulderL.rotation.z = 0; j.shoulderR.rotation.z = 0; j.thighL.rotation.z = 0; j.thighR.rotation.z = 0;
  return Object.assign(rig, { body3d, extras, fur });
}
