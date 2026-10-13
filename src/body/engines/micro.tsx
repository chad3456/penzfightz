/**
 * The microscopic world as a small scene language. A topic lists actors
 * (red cells, T cells, antibodies, bacteria, cancer cells, molecules...),
 * each with a place, size, glow and opacity per step, so a process such as
 * a T cell killing a tumour cell plays out as the step slider moves.
 * Swarms scatter copies around a point and drift; backdrops set the scene
 * inside a vessel, on a tissue floor or at a cell membrane.
 */
import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Anchor, useHi, useScene } from '../stage';
import { V, rng, blob, fbm, displace, mergeGeometries, varTube, curve, fibSphere, TAU, PAL, smooth } from '../kit';

type Vec = [number, number, number];
type K = 'rbc' | 'platelet' | 'neutrophil' | 'lymph' | 'macrophage' | 'dendritic' | 'mast' | 'eosinophil' | 'basophil' | 'monocyte' | 'antibody' | 'virus' | 'rod' | 'coccus' | 'spiral' | 'cell' | 'cancer' | 'fibrin' | 'ldl' | 'plaque' | 'mol' | 'receptor' | 'vesicle' | 'arrow' | 'helix' | 'channel' | 'mrna' | 'ribosome' | 'pore' | 'sickle' | 'spore' | 'plasma' | 'stem' | 'fat' | 'yeast' | 'parasite' | 'pill' | 'needle' | 'complement' | 'crystal' | 'nanobody' | 'fragment';

export interface Actor {
  k: K; id?: string; color?: string;
  /** position, or one per step */
  at?: Vec | Vec[]; s?: number | number[]; o?: number | number[]; glow?: number | number[]; rot?: Vec;
  /** a swarm: n copies scattered within `spread` */
  n?: number; spread?: number | Vec; drift?: number; seed?: number;
  /** spin speed, and for arrows the path */
  spin?: number; path?: Vec[];
}
export interface MicroP { bg?: 'void' | 'vessel' | 'tissue' | 'membrane' | 'lumen'; bgColor?: string; actors: Actor[]; flow?: number }

/* ───────── shapes ───────── */
const G = new Map<string, THREE.BufferGeometry>();
function geo(k: K, seed = 1): THREE.BufferGeometry {
  const key = k + seed; const hit = G.get(key); if (hit) return hit;
  let g: THREE.BufferGeometry;
  const R = rng(seed);
  switch (k) {
    case 'rbc': case 'sickle': {
      const pts: THREE.Vector2[] = []; for (let i = 0; i <= 24; i++) { const t = i / 24, r = t * 0.5; const th = 0.08 + 0.32 * Math.sqrt(Math.max(0, 1 - (r / 0.5) ** 2)) * (0.35 + 0.65 * (r / 0.5) ** 1.6); pts.push(new THREE.Vector2(r, th / 2)); }
      for (let i = 24; i >= 0; i--) { const p = pts[i]; pts.push(new THREE.Vector2(p.x, -p.y)); }
      g = new THREE.LatheGeometry(pts.map((p) => new THREE.Vector2(Math.max(0.001, p.x), p.y)), 40); g.rotateX(Math.PI / 2);
      if (k === 'sickle') { const pos = g.attributes.position as THREE.BufferAttribute; for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), y = pos.getY(i); const a = x * 2.2; pos.setXYZ(i, Math.sin(a) * (0.9 + y * 0.8) * 0.55, Math.cos(a) * (0.9 + y * 0.8) * 0.45 - 0.35, pos.getZ(i) * 0.7); } g.computeVertexNormals(); }
      break;
    }
    case 'platelet': g = blob(0.16, [1, 0.45, 0.8], 0.25, 2.2, seed, 3); break;
    case 'neutrophil': case 'eosinophil': case 'basophil': case 'monocyte': case 'stem': g = displace(new THREE.IcosahedronGeometry(0.6, 5), (p) => 0.035 * Math.max(0, fbm(p.x * 9 + seed, p.y * 9, p.z * 9, 2)) + 0.02 * fbm(p.x * 3, p.y * 3, p.z * 3 + seed, 2)); break;
    case 'lymph': g = displace(new THREE.IcosahedronGeometry(0.5, 5), (p) => 0.05 * Math.max(0, Math.sin(p.x * 30) * Math.sin(p.y * 30) * Math.sin(p.z * 30)) + 0.015 * fbm(p.x * 4, p.y * 4, p.z * 4, 2)); break;
    case 'macrophage': g = displace(new THREE.IcosahedronGeometry(0.8, 5), (p) => { const n = p.clone().normalize(); let d = 0.06 * fbm(p.x * 2 + seed, p.y * 2, p.z * 2, 3); for (const a of [V(1, 0.3, 0), V(-0.6, -0.5, 0.6), V(0.1, 0.4, -1), V(-0.4, 0.9, 0.3)]) d += 0.7 * Math.pow(Math.max(0, n.dot(a.normalize())), 18); return d; }); break;
    case 'dendritic': g = displace(new THREE.IcosahedronGeometry(0.45, 5), (p) => { const n = p.clone().normalize(); let d = 0; for (const a of fibSphere(9, 1)) d += 1.1 * Math.pow(Math.max(0, n.dot(a)), 40); return d + 0.03 * fbm(p.x * 4, p.y * 4, p.z * 4, 2); }); break;
    case 'mast': g = displace(new THREE.IcosahedronGeometry(0.6, 5), (p) => 0.04 * Math.abs(fbm(p.x * 6, p.y * 6, p.z * 6, 2))); break;
    case 'cell': g = blob(0.7, [1.2, 0.8, 1], 0.06, 1.4, seed, 5); break;
    case 'fat': g = blob(0.7, [1, 1, 1], 0.03, 1.4, seed, 5); break;
    case 'cancer': g = displace(new THREE.IcosahedronGeometry(0.7, 5), (p) => 0.14 * fbm(p.x * 1.6 + seed, p.y * 1.6, p.z * 1.6, 3) + 0.035 * Math.max(0, fbm(p.x * 8, p.y * 8, p.z * 8, 2))); break;
    case 'antibody': case 'nanobody': {
      const parts: THREE.BufferGeometry[] = []; const seg = (a: Vec, b: Vec, r: number) => { const q = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), V(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize()); const cc = new THREE.CapsuleGeometry(r, V(...a).distanceTo(V(...b)), 4, 10); cc.applyQuaternion(q); cc.translate((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2); return cc; };
      if (k === 'nanobody') parts.push(seg([0, 0, 0], [0, 0.18, 0], 0.07));
      else { parts.push(seg([0, -0.3, 0], [0, 0.0, 0], 0.07), seg([0.02, 0, 0], [0.24, 0.26, 0], 0.065), seg([-0.02, 0, 0], [-0.24, 0.26, 0], 0.065), seg([0.24, 0.26, 0], [0.36, 0.42, 0], 0.06), seg([-0.24, 0.26, 0], [-0.36, 0.42, 0], 0.06)); }
      g = mergeGeometries(parts.map((x) => x.toNonIndexed()))!; break;
    }
    case 'virus': { const core = new THREE.IcosahedronGeometry(0.22, 3); const sp = fibSphere(28, 0.24).map((p) => { const c = new THREE.ConeGeometry(0.04, 0.12, 6); c.translate(0, 0.06, 0); c.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), p.clone().normalize())); c.translate(p.x, p.y, p.z); return c.toNonIndexed(); }); g = mergeGeometries([core.toNonIndexed(), ...sp])!; break; }
    case 'rod': { const body = new THREE.CapsuleGeometry(0.22, 0.7, 8, 20); body.rotateZ(Math.PI / 2); const fl = [0, 1, 2, 3].map((i) => { const a = (i / 4) * TAU; const c = curve(Array.from({ length: 10 }, (_, j) => V(-0.55 - j * 0.12, Math.sin(j * 1.2 + i) * 0.08 + Math.cos(a) * 0.1, Math.cos(j * 1.2 + i) * 0.08 + Math.sin(a) * 0.1))); return varTube(c, 40, 4, () => 0.012).toNonIndexed(); }); g = mergeGeometries([body.toNonIndexed(), ...fl])!; break; }
    case 'coccus': { const ps = [V(0, 0, 0), V(0.42, 0.05, 0), V(0.2, 0.38, 0.05), V(-0.2, 0.36, -0.1), V(-0.4, 0, 0.1)]; g = mergeGeometries(ps.map((p) => { const s = new THREE.SphereGeometry(0.21, 20, 14); s.translate(p.x, p.y, p.z); return s.toNonIndexed(); }))!; break; }
    case 'spiral': g = varTube(new THREE.CatmullRomCurve3(Array.from({ length: 60 }, (_, i) => V(-0.8 + i * 0.027, Math.sin(i * 0.5) * 0.12, Math.cos(i * 0.5) * 0.12))), 200, 8, (t) => 0.05 * Math.min(1, Math.min(t, 1 - t) * 12)); break;
    case 'yeast': { const a = new THREE.SphereGeometry(0.4, 28, 20); a.scale(1, 1.2, 1); const b = new THREE.SphereGeometry(0.2, 20, 14); b.translate(0.2, 0.52, 0); g = mergeGeometries([a.toNonIndexed(), b.toNonIndexed()])!; break; }
    case 'parasite': g = displace(new THREE.CapsuleGeometry(0.15, 0.9, 8, 18), (p) => 0.02 * Math.sin(p.y * 20)); g.rotateZ(Math.PI / 2); break;
    case 'spore': g = blob(0.22, [1.5, 1, 1], 0.05, 3, seed, 3); break;
    case 'fibrin': { const gs: THREE.BufferGeometry[] = []; for (let i = 0; i < 14; i++) { const a = V(R() - 0.5, R() - 0.5, R() - 0.5).multiplyScalar(3), b = V(R() - 0.5, R() - 0.5, R() - 0.5).multiplyScalar(3); gs.push(varTube(curve([a, a.clone().lerp(b, 0.5).add(V(R() - 0.5, R() - 0.5, R() - 0.5).multiplyScalar(0.6)), b]), 30, 5, () => 0.025).toNonIndexed()); } g = mergeGeometries(gs)!; break; }
    case 'ldl': { const s = new THREE.SphereGeometry(0.16, 20, 14); const band = new THREE.TorusGeometry(0.16, 0.03, 8, 30); g = mergeGeometries([s.toNonIndexed(), band.toNonIndexed()])!; break; }
    case 'plaque': g = blob(0.8, [1.4, 0.6, 1], 0.12, 1.5, seed, 4); break;
    case 'crystal': g = new THREE.OctahedronGeometry(0.2, 0); g.scale(0.5, 1.6, 0.5); break;
    case 'mol': { const ps = [V(0, 0, 0), V(0.12, 0.05, 0), V(-0.06, 0.11, 0.04), V(-0.08, -0.09, -0.05)].slice(0, 2 + (seed % 3)); g = mergeGeometries(ps.map((p, i) => { const s = new THREE.SphereGeometry(i ? 0.075 : 0.09, 14, 10); s.translate(p.x, p.y, p.z); return s.toNonIndexed(); }))!; break; }
    case 'complement': g = new THREE.TorusGeometry(0.12, 0.04, 8, 16); break;
    case 'receptor': { const stalk = new THREE.CylinderGeometry(0.05, 0.05, 0.6, 10); stalk.translate(0, 0.3, 0); const cup = new THREE.TorusGeometry(0.11, 0.04, 8, 18, Math.PI); cup.translate(0, 0.62, 0); const tail = new THREE.CylinderGeometry(0.06, 0.06, 0.3, 10); tail.translate(0, -0.12, 0); g = mergeGeometries([stalk.toNonIndexed(), cup.toNonIndexed(), tail.toNonIndexed()])!; break; }
    case 'channel': { const gs = Array.from({ length: 5 }, (_, i) => { const a = (i / 5) * TAU; const c = new THREE.CylinderGeometry(0.07, 0.07, 0.62, 10); c.translate(Math.cos(a) * 0.13, 0, Math.sin(a) * 0.13); return c.toNonIndexed(); }); g = mergeGeometries(gs)!; break; }
    case 'pore': g = new THREE.TorusGeometry(0.18, 0.06, 10, 22); g.rotateX(Math.PI / 2); break;
    case 'vesicle': g = new THREE.SphereGeometry(0.22, 24, 16); break;
    case 'plasma': g = new THREE.SphereGeometry(0.06, 10, 8); break;
    case 'helix': { const a: THREE.Vector3[] = [], b: THREE.Vector3[] = []; for (let i = 0; i <= 60; i++) { const t = i / 60, y = -0.8 + t * 1.6, th = t * TAU * 2.2; a.push(V(Math.cos(th) * 0.16, y, Math.sin(th) * 0.16)); b.push(V(Math.cos(th + 2.4) * 0.16, y, Math.sin(th + 2.4) * 0.16)); } const rungs = Array.from({ length: 18 }, (_, i) => { const j = Math.round((i / 17) * 60); const r = new THREE.CylinderGeometry(0.018, 0.018, a[j].distanceTo(b[j]), 6); r.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), b[j].clone().sub(a[j]).normalize())); const m = a[j].clone().lerp(b[j], 0.5); r.translate(m.x, m.y, m.z); return r.toNonIndexed(); }); g = mergeGeometries([varTube(curve(a), 120, 6, () => 0.03).toNonIndexed(), varTube(curve(b), 120, 6, () => 0.03).toNonIndexed(), ...rungs])!; break; }
    case 'mrna': g = varTube(curve(Array.from({ length: 14 }, (_, i) => V(-0.9 + i * 0.14, Math.sin(i * 1.3) * 0.08, Math.cos(i * 0.9) * 0.06))), 120, 6, () => 0.025); break;
    case 'ribosome': { const a = blob(0.22, [1.2, 0.8, 1], 0.12, 2.5, seed, 3); const b = blob(0.15, [1.1, 0.7, 1], 0.12, 2.5, seed + 2, 3); b.translate(0, 0.22, 0); g = mergeGeometries([a.toNonIndexed(), b.toNonIndexed()])!; break; }
    case 'arrow': g = new THREE.ConeGeometry(0.09, 0.22, 14); break;
    case 'pill': g = new THREE.CapsuleGeometry(0.12, 0.25, 6, 14); break;
    case 'needle': { const a = new THREE.CylinderGeometry(0.012, 0.03, 1.2, 10); const b = new THREE.CylinderGeometry(0.12, 0.12, 0.6, 18); b.translate(0, 0.9, 0); g = mergeGeometries([a.toNonIndexed(), b.toNonIndexed()])!; break; }
    case 'fragment': g = blob(0.12, [1, 0.8, 0.9], 0.3, 3, seed, 2); break;
    default: g = new THREE.SphereGeometry(0.3, 20, 14);
  }
  G.set(key, g); return g;
}
const DEF: Partial<Record<K, string>> = { rbc: '#c5161d', sickle: '#b3141c', platelet: '#e8b6c6', neutrophil: '#e9e3ef', eosinophil: '#f0c7b0', basophil: '#b9a4d9', monocyte: '#dfd6e8', lymph: '#9fd6c4', macrophage: '#d9c7b4', dendritic: '#c9b3e0', mast: '#c78fb5', antibody: PAL.antibody, nanobody: PAL.antibody, virus: PAL.virus, rod: '#7fc98a', coccus: '#e0b84f', spiral: '#c0a8e6', cell: '#e7a28c', cancer: PAL.cancer, fibrin: '#efe2b0', ldl: '#f2c94c', plaque: '#f0d27a', mol: '#7fe0ff', receptor: '#8fb8ff', channel: '#5ab8a0', pore: '#ff8a5c', vesicle: '#bfe3ff', helix: PAL.dna, mrna: PAL.rna, ribosome: '#9a88d9', arrow: '#fff3b0', plasma: '#f2c97a', stem: '#cfe6f5', fat: '#f1d48a', yeast: '#e8d9a8', parasite: '#d8b4a0', spore: '#c8b07a', pill: '#f2f2f2', needle: '#dfe6ee', complement: '#ff9d6b', crystal: '#e9f3ff', fragment: '#b06a96' };
const NUCLEUS: Partial<Record<K, [string, number]>> = { neutrophil: ['#6a4fa3', 0], eosinophil: ['#7a3f8f', 0], basophil: ['#4b3a8a', 0.3], monocyte: ['#6b4fa8', 0], lymph: ['#5a3f9a', 0.34], macrophage: ['#7a5aa8', 0], cell: ['#6b4fa8', 0.28], cancer: ['#4a2a6a', 0.4], stem: ['#5b6fb8', 0.34], dendritic: ['#6b4fa8', 0.24], mast: ['#5a2a7a', 0.28] };
const TRANSLUCENT: Partial<Record<K, number>> = { neutrophil: 0.55, eosinophil: 0.55, basophil: 0.55, monocyte: 0.6, lymph: 0.62, macrophage: 0.62, cell: 0.6, stem: 0.55, vesicle: 0.45, dendritic: 0.7, mast: 0.6 };

const at = (a: number | number[] | undefined, st: number, def: number) => { if (a === undefined) return def; if (typeof a === 'number') return a; const i = Math.floor(st), f = smooth(st - i); const A = a[Math.min(a.length - 1, Math.max(0, i))], B = a[Math.min(a.length - 1, Math.max(0, i + 1))]; return A + (B - A) * f; };
const atV = (a: Vec | Vec[] | undefined, st: number, out: THREE.Vector3) => { if (!a) return out.set(0, 0, 0); if (typeof a[0] === 'number') return out.set(...(a as Vec)); const L = a as Vec[]; const i = Math.floor(st), f = smooth(st - i); const A = L[Math.min(L.length - 1, Math.max(0, i))], B = L[Math.min(L.length - 1, Math.max(0, i + 1))]; return out.set(A[0] + (B[0] - A[0]) * f, A[1] + (B[1] - A[1]) * f, A[2] + (B[2] - A[2]) * f); };

function One({ a, idx }: { a: Actor; idx: number }) {
  const S = useScene();
  const n = a.n ?? 1, k = a.k, color = a.color ?? DEF[k] ?? '#ccc';
  const g = useMemo(() => geo(k, (a.seed ?? idx) % 5 + 1), [k, a.seed, idx]);
  const tr = TRANSLUCENT[k];
  const m = useHi(a.id ?? `__${idx}`, color, { rough: k === 'rbc' || k === 'sickle' ? 0.35 : 0.5, clear: 0.5, sheen: 0.6, opacity: tr ?? 0.999, trans: 0, emissive: k === 'arrow' || k === 'mol' ? color : undefined, ei: k === 'arrow' ? 0.8 : k === 'mol' ? 0.35 : 0, side: tr ? THREE.DoubleSide : THREE.FrontSide });
  const nuc = NUCLEUS[k];
  const nm = useHi(a.id ?? `__${idx}`, nuc?.[0] ?? '#000', { rough: 0.5, clear: 0.3 });
  const nucGeo = useMemo(() => {
    if (!nuc) return null;
    if (k === 'neutrophil') { const ps = [V(-0.22, 0.05, 0), V(0, 0.18, 0.05), V(0.22, 0.02, -0.02), V(0.05, -0.18, 0.05)]; return mergeGeometries(ps.map((p) => { const s = new THREE.SphereGeometry(0.15, 16, 12); s.translate(p.x, p.y, p.z); return s.toNonIndexed(); }))!; }
    if (k === 'eosinophil') { const ps = [V(-0.18, 0, 0), V(0.18, 0, 0)]; return mergeGeometries(ps.map((p) => { const s = new THREE.SphereGeometry(0.2, 16, 12); s.translate(p.x, p.y, p.z); return s.toNonIndexed(); }))!; }
    if (k === 'monocyte' || k === 'macrophage') { const s = new THREE.TorusGeometry(0.22, 0.13, 12, 24, Math.PI * 1.3); return s; }
    return blob(nuc[1], [1, 0.9, 1], 0.08, 2, 3, 3);
  }, [k, nuc]);
  const spots = useMemo(() => {
    const R = rng((a.seed ?? idx) + 11), sp = a.spread ?? 1.2, sv = typeof sp === 'number' ? V(sp, sp, sp) : V(...sp);
    return Array.from({ length: n }, (_, i) => ({ off: n === 1 ? V() : V((R() - 0.5) * 2 * sv.x, (R() - 0.5) * 2 * sv.y, (R() - 0.5) * 2 * sv.z), rot: new THREE.Euler(R() * TAU, R() * TAU, R() * TAU), ph: R() * 10, i }));
  }, [n, a.spread, a.seed, idx]);
  const ref = useRef<THREE.InstancedMesh>(null), nref = useRef<THREE.InstancedMesh>(null);
  const tmp = useMemo(() => ({ p: V(), q: new THREE.Quaternion(), e: new THREE.Euler(), M: new THREE.Matrix4(), sv: V() }), []);
  const anchor = useRef<THREE.Group>(null);
  const pc = useMemo(() => (a.path && a.path.length > 1 ? curve(a.path) : null), [a.path]);
  const baseOp = tr ?? 1;
  useLayoutEffect(() => { ref.current?.computeBoundingSphere(); }, []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime, st = S.st.current;
    const base = atV(a.at, st, tmp.p).clone(), sc = at(a.s, st, 1), op = at(a.o, st, 1), gl = at(a.glow, st, 0);
    const drift = a.drift ?? (n > 1 ? 0.15 : 0.04), flow = S.ctl.flow ?? 1;
    m.opacity = baseOp * op * (S.sel && a.id && S.sel !== a.id ? 0.55 : 1); m.transparent = m.opacity < 0.999; m.depthWrite = m.opacity > 0.9;
    if (gl > 0 && !(S.sel && S.sel === a.id)) m.emissiveIntensity = gl;
    nm.opacity = op; nm.transparent = op < 0.999;
    const im = ref.current, nim = nref.current;
    for (const s of spots) {
      const w = s.ph + t * 0.6;
      const p = base.clone().add(s.off).add(V(Math.sin(w) * drift, Math.cos(w * 1.3) * drift, Math.sin(w * 0.7) * drift));
      if (pc) { p.copy(pc.getPointAt(((s.i / n) + t * 0.05 * flow * (a.spin ?? 1)) % 1)).add(V(Math.sin(w) * drift, Math.cos(w) * drift, 0)); }
      tmp.e.set(s.rot.x + (a.rot?.[0] ?? 0) + t * (a.spin ?? 0.15) * (n > 1 ? 1 : 0.3), s.rot.y + (a.rot?.[1] ?? 0) + t * 0.1, s.rot.z + (a.rot?.[2] ?? 0));
      if (n === 1 && !a.spin) tmp.e.set(a.rot?.[0] ?? 0, (a.rot?.[1] ?? 0) + Math.sin(t * 0.3) * 0.15, a.rot?.[2] ?? 0);
      tmp.q.setFromEuler(tmp.e); tmp.M.compose(p, tmp.q, tmp.sv.set(sc, sc, sc));
      im?.setMatrixAt(s.i, tmp.M); nim?.setMatrixAt(s.i, tmp.M);
      if (s.i === 0 && anchor.current) anchor.current.position.copy(p).add(V(0, 0.55 * sc * (k === 'rbc' ? 0.6 : 1), 0));
    }
    if (im) { im.instanceMatrix.needsUpdate = true; im.visible = op > 0.02 && sc > 0.01; }
    if (nim) { nim.instanceMatrix.needsUpdate = true; nim.visible = op > 0.02 && sc > 0.01; }
  });
  return (
    <>
      <instancedMesh ref={ref} args={[g, m, n]} frustumCulled={false} />
      {nucGeo && <instancedMesh ref={nref} args={[nucGeo, nm, n]} frustumCulled={false} />}
      {a.id && <group ref={anchor}><Anchor id={a.id} /></group>}
    </>
  );
}

function Arrow({ a, idx }: { a: Actor; idx: number }) {
  const S = useScene();
  const c = useMemo(() => curve(a.path ?? [[-1, 0, 0], [1, 0, 0]]), [a.path]);
  const color = a.color ?? DEF.arrow!;
  const m = useHi(a.id ?? `__a${idx}`, color, { emissive: color, ei: 0.6, opacity: 0.85 });
  const tg = useMemo(() => varTube(c, 60, 6, (t) => 0.025 * (1 - t * 0.3)), [c]);
  const head = useMemo(() => { const p = c.getPointAt(1), d = c.getTangentAt(1); return { p, q: new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), d) }; }, [c]);
  const g = useRef<THREE.Group>(null);
  useFrame(() => { const op = at(a.o, S.st.current, 1); m.opacity = 0.85 * op; if (g.current) g.current.visible = op > 0.03; });
  return (
    <group ref={g}>
      <mesh geometry={tg} material={m} />
      <mesh geometry={geo('arrow')} material={m} position={head.p} quaternion={head.q} />
      {a.id && <Anchor id={a.id} position={c.getPointAt(0.5).toArray() as Vec} />}
    </group>
  );
}

/* ───────── backdrops ───────── */
function Backdrop({ kind, color }: { kind: MicroP['bg']; color?: string }) {
  const wall = useHi('wall', color ?? (kind === 'vessel' ? '#b8443f' : kind === 'lumen' ? '#e09a7e' : '#d98a7a'), { rough: 0.6, sheen: 0.8, side: THREE.BackSide, opacity: kind === 'vessel' ? 0.55 : 1 });
  const floor = useHi('tissue', color ?? '#d98a7a', { rough: 0.65, sheen: 0.7 });
  const head = useHi('membrane', color ?? '#f0b38a', { rough: 0.5, clear: 0.4 });
  const vesselGeo = useMemo(() => kind === 'vessel' || kind === 'lumen' ? displace(new THREE.CylinderGeometry(2.6, 2.6, 14, 64, 60, true).rotateZ(Math.PI / 2), (p) => 0.06 * fbm(p.x * 0.8, p.y * 1.5, p.z * 1.5, 3) + (kind === 'lumen' ? 0.25 * Math.max(0, Math.sin(p.x * 3 + Math.atan2(p.z, p.y) * 6)) : 0)) : null, [kind]);
  const tissue = useMemo(() => { if (kind !== 'tissue') return null; const gs: THREE.BufferGeometry[] = []; const R = rng(4); for (let i = -4; i <= 4; i++) for (let j = -3; j <= 3; j++) { const b = blob(0.55, [1, 0.6, 1], 0.1, 1.5, i * 7 + j, 3); b.translate(i * 1.0 + (j % 2) * 0.5 + (R() - 0.5) * 0.1, -1.45, j * 0.95); gs.push(b.toNonIndexed()); } return mergeGeometries(gs)!; }, [kind]);
  const heads = useMemo(() => { if (kind !== 'membrane') return null; const pts: THREE.Vector3[] = []; for (let i = -22; i <= 22; i++) for (let j = -14; j <= 14; j++) { pts.push(V(i * 0.16, -1.2, j * 0.16)); pts.push(V(i * 0.16, -1.75, j * 0.16)); } return pts; }, [kind]);
  const hr = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => { const im = hr.current; if (!im || !heads) return; const M = new THREE.Matrix4(); heads.forEach((p, i) => { M.makeTranslation(p.x, p.y, p.z); im.setMatrixAt(i, M); }); im.instanceMatrix.needsUpdate = true; im.computeBoundingSphere(); }, [heads]);
  const tailM = useMemo(() => new THREE.MeshStandardMaterial({ color: '#f2d9a0', roughness: 0.8 }), []);
  return (
    <group>
      {vesselGeo && <mesh geometry={vesselGeo} material={wall} />}
      {tissue && <mesh geometry={tissue} material={floor} />}
      {heads && (<><instancedMesh ref={hr} args={[new THREE.SphereGeometry(0.075, 10, 8), head, heads.length]} /><mesh material={tailM} position={[0, -1.475, 0]}><boxGeometry args={[7.1, 0.42, 4.6]} /></mesh></>)}
      {kind === 'vessel' && <Anchor id="wall" position={[0, 2.3, 0.8]} />}
      {kind === 'tissue' && <Anchor id="tissue" position={[1.5, -1.1, 1]} />}
      {kind === 'membrane' && <Anchor id="membrane" position={[2.4, -1.15, 1.2]} />}
    </group>
  );
}

export default function Micro({ p }: { p: MicroP }) {
  return (
    <group>
      {p.bg && p.bg !== 'void' && <Backdrop kind={p.bg} color={p.bgColor} />}
      {p.actors.map((a, i) => a.k === 'arrow' ? <Arrow key={i} a={a} idx={i} /> : <One key={i} a={a} idx={i} />)}
    </group>
  );
}
