/**
 * The heart, built as a smooth union of chambers and great vessels and
 * meshed with surface nets. It beats (a vertex-shader squeeze that follows
 * the cardiac cycle), can be cut open in a four-chamber section with valves
 * that open and close and blood moving through, or turned translucent to
 * show the conduction system firing. Flags add disease and repairs: a
 * blocked artery and the dead muscle beyond it, a thickened wall, a hole in
 * the septum, a stent, a bypass graft, a pacemaker lead.
 */
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Anchor, useCtl, useHi, useScene } from '../stage';
import { capsule, ellipsoid, mesh, sphere, nearest, smax, smin, tube, cached, type SDF, type Vec } from '../sdf';
import { V, fbm, curve, varTube, tree, treeGeo, PAL, rng } from '../kit';

export interface HeartP {
  mode?: 'outside' | 'section' | 'conduction'; cut?: 'four' | 'base';
  coronary?: boolean; veins?: boolean; flow?: boolean;
  block?: 'lad' | 'rca' | 'lcx'; infarct?: boolean; plaque?: boolean;
  wall?: number; vsd?: boolean; asd?: boolean;
  stent?: boolean; graft?: boolean; pacer?: boolean; afib?: boolean; block2?: boolean;
  /** a stage-locked cardiac cycle: phase for each step */
  phases?: number[];
  valveFocus?: boolean; stenosis?: 'aortic' | 'mitral'; regurg?: 'mitral';
}

/* ───────── anatomy as distance fields ───────── */
const LV_OUT = capsule([0.15, 0.32, -0.15], [0.72, -1.02, 0.28], 0.7, 0.16);
const RV_OUT = capsule([-0.36, 0.3, 0.3], [0.32, -0.86, 0.48], 0.6, 0.2);
const RA_OUT = ellipsoid([-0.8, 0.45, 0.0], [0.48, 0.56, 0.5]);
const RAA = ellipsoid([-0.55, 0.78, 0.42], [0.26, 0.17, 0.16], new THREE.Euler(0, 0, -0.4));
const LA_OUT = ellipsoid([0.25, 0.68, -0.52], [0.62, 0.38, 0.42]);
const LAA = ellipsoid([0.78, 0.62, 0.12], [0.22, 0.13, 0.2], new THREE.Euler(0, 0.5, 0.5));
const AORTA_PTS: Vec[] = [[0.0, 0.3, 0.0], [-0.06, 1.0, 0.1], [0.0, 1.7, 0.05], [0.32, 2.02, -0.25], [0.62, 1.86, -0.6], [0.7, 1.2, -0.8], [0.7, 0.0, -0.85], [0.68, -1.1, -0.85]];
const AORTA = tube(AORTA_PTS, (t) => 0.27 - t * 0.06, 40);
const BRANCHES = [tube([[0.08, 1.9, -0.02], [-0.12, 2.3, 0.0], [-0.25, 2.8, 0.02]], 0.1), tube([[0.32, 2.0, -0.25], [0.34, 2.4, -0.22], [0.36, 2.85, -0.2]], 0.075), tube([[0.52, 1.95, -0.45], [0.7, 2.3, -0.5], [0.95, 2.65, -0.52]], 0.08)];
const PA = tube([[-0.12, 0.35, 0.5], [-0.02, 0.95, 0.55], [0.22, 1.32, 0.22]], 0.24, 16);
const LPA = tube([[0.22, 1.32, 0.22], [0.75, 1.45, -0.2], [1.25, 1.38, -0.42]], 0.15, 16);
const RPA = tube([[0.22, 1.32, 0.22], [-0.3, 1.38, -0.32], [-1.2, 1.32, -0.42]], 0.15, 16);
const SVC = tube([[-0.8, 2.4, 0.08], [-0.8, 1.6, 0.06], [-0.8, 0.8, 0.0]], 0.2, 10);
const IVC = tube([[-0.74, -0.75, -0.18], [-0.78, -0.4, -0.12], [-0.8, 0.05, -0.08]], 0.22, 10);
const PVS = [tube([[-0.95, 0.88, -0.78], [-0.4, 0.8, -0.7], [-0.05, 0.75, -0.6]], 0.1, 8), tube([[-0.95, 0.42, -0.75], [-0.4, 0.5, -0.72], [-0.05, 0.58, -0.62]], 0.1, 8), tube([[1.3, 0.92, -0.72], [0.9, 0.8, -0.66], [0.6, 0.74, -0.6]], 0.1, 8), tube([[1.3, 0.45, -0.7], [0.9, 0.52, -0.68], [0.6, 0.58, -0.6]], 0.1, 8)];

const LV_IN = (w: number) => capsule([0.12, 0.3, -0.15], [0.62, -0.8, 0.2], 0.5 - w, 0.06);
const RV_IN = capsule([-0.4, 0.28, 0.33], [0.2, -0.66, 0.47], 0.45, 0.1);
const RA_IN = ellipsoid([-0.8, 0.45, 0.0], [0.38, 0.46, 0.4]);
const LA_IN = ellipsoid([0.25, 0.68, -0.52], [0.52, 0.29, 0.33]);
const lumen = (f: SDF, t: number): SDF => (x, y, z) => f(x, y, z) + t;

const fold = (fs: SDF[], k: number): SDF => (x, y, z) => { let d = Infinity; for (const f of fs) d = smin(d, f(x, y, z), k); return d; };
const HEART = fold([LV_OUT, RV_OUT, RA_OUT, RAA, LA_OUT, LAA], 0.22);
const VESSELS = fold([AORTA, ...BRANCHES, PA, LPA, RPA, SVC, IVC, ...PVS], 0.06);

function outerField(wall: number): SDF {
  return (x, y, z) => {
    let h = HEART(x, y, z);
    if (wall > 0) h = smin(h, LV_OUT(x, y, z) - wall * 0.6, 0.2);
    if (h < 0.1) h += 0.012 * fbm(x * 4, y * 4, z * 4, 2);
    return smin(h, VESSELS(x, y, z), 0.12);
  };
}
/** the four-chamber cut: hollow chambers and vessels, sliced on a plane */
let CUT_N = new THREE.Vector3(-0.05, 0.25, 1).normalize(), CUT_D = 0.12;
const cutPlane: SDF = (x, y, z) => CUT_N.x * x + CUT_N.y * y + CUT_N.z * z - CUT_D;
function setCut(kind: 'four' | 'base') { if (kind === 'base') { CUT_N = new THREE.Vector3(0, 1, 0); CUT_D = 0.42; } else { CUT_N = new THREE.Vector3(-0.05, 0.25, 1).normalize(); CUT_D = 0.12; } }
function sectionField(wall: number, vsd: boolean, asd: boolean): SDF {
  const outer = outerField(wall), lv = LV_IN(wall);
  const lum = [lumen(AORTA, 0.075), lumen(PA, 0.065), lumen(SVC, 0.065), lumen(IVC, 0.065), lumen(LPA, 0.06), lumen(RPA, 0.06), ...PVS.map((p) => lumen(p, 0.05))];
  const holeV = sphere([-0.1, -0.15, 0.25], 0.13), holeA = sphere([-0.3, 0.6, -0.2], 0.13);
  return (x, y, z) => {
    let cav = Math.min(lv(x, y, z), RV_IN(x, y, z), RA_IN(x, y, z), LA_IN(x, y, z));
    for (const l of lum) cav = Math.min(cav, l(x, y, z));
    // chambers meet their vessels and valve openings
    cav = smin(cav, Math.min(capsule([-0.6, 0.35, 0.12], [-0.25, 0.05, 0.3], 0.22)(x, y, z), capsule([0.22, 0.6, -0.42], [0.25, 0.2, -0.2], 0.24)(x, y, z), capsule([0.08, 0.15, -0.05], [-0.02, 0.6, 0.02], 0.2)(x, y, z), capsule([-0.25, 0.1, 0.42], [-0.12, 0.55, 0.5], 0.19)(x, y, z)), 0.08);
    if (vsd) cav = Math.min(cav, holeV(x, y, z)); if (asd) cav = Math.min(cav, holeA(x, y, z));
    return smax(smax(outer(x, y, z), -cav, 0.03), cutPlane(x, y, z), 0.0);
  };
}

const LABEL = nearest([['lv', LV_OUT], ['rv', RV_OUT], ['ra', (x, y, z) => Math.min(RA_OUT(x, y, z), RAA(x, y, z))], ['la', (x, y, z) => Math.min(LA_OUT(x, y, z), LAA(x, y, z))], ['aorta', (x, y, z) => Math.min(AORTA(x, y, z), ...BRANCHES.map((b) => b(x, y, z)))], ['pa', (x, y, z) => Math.min(PA(x, y, z), LPA(x, y, z), RPA(x, y, z))], ['svc', SVC], ['ivc', IVC], ['pv', (x, y, z) => Math.min(...PVS.map((p) => p(x, y, z)))]]);

/** project points onto the outer surface, lifted a little */
function onSurface(f: SDF, pts: Vec[], lift: number) {
  return pts.map(([x, y, z]) => {
    const p = V(x, y, z), e = 0.01;
    for (let i = 0; i < 8; i++) { const d = f(p.x, p.y, p.z); const g = V(f(p.x + e, p.y, p.z) - f(p.x - e, p.y, p.z), f(p.x, p.y + e, p.z) - f(p.x, p.y - e, p.z), f(p.x, p.y, p.z + e) - f(p.x, p.y, p.z - e)).normalize(); p.addScaledVector(g, -(d - lift)); }
    return p;
  });
}
const CORONARY: Record<string, Vec[]> = {
  lad: [[0.05, 0.62, 0.35], [-0.02, 0.35, 0.62], [0.06, -0.1, 0.75], [0.25, -0.55, 0.7], [0.5, -0.92, 0.55], [0.72, -1.15, 0.35]],
  lcx: [[0.12, 0.6, 0.3], [0.5, 0.48, 0.25], [0.8, 0.35, -0.05], [0.85, 0.25, -0.4], [0.55, 0.15, -0.75]],
  rca: [[-0.12, 0.55, 0.38], [-0.45, 0.32, 0.55], [-0.85, 0.05, 0.45], [-0.95, -0.15, 0.0], [-0.6, -0.3, -0.45], [-0.05, -0.35, -0.6]],
  diag: [[0.0, 0.1, 0.72], [0.35, -0.05, 0.65], [0.7, -0.25, 0.4]],
  marg: [[-0.85, 0.05, 0.45], [-0.6, -0.4, 0.6], [-0.25, -0.75, 0.62]],
  gcv: [[0.15, 0.55, 0.32], [0.12, 0.2, 0.68], [0.2, -0.3, 0.74], [0.42, -0.8, 0.6]],
};

/* ───────── the beat ───────── */
type BeatU = { uV: { value: number }; uA: { value: number } };
function beatify(m: THREE.MeshPhysicalMaterial, U: BeatU) {
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uV = U.uV; sh.uniforms.uA = U.uA;
    sh.vertexShader = 'uniform float uV; uniform float uA;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      float wv = 1.0 - smoothstep(-0.1, 0.7, position.y);
      float wa = smoothstep(0.2, 0.55, position.y) * (1.0 - smoothstep(1.0, 1.35, position.y));
      transformed.xz -= (position.xz - vec2(0.15, 0.15)) * uV * 0.11 * wv;
      transformed.y += uV * 0.1 * wv * (0.7 - position.y) * 0.35;
      transformed.xz -= (position.xz - vec2(-0.25, -0.2)) * uA * 0.08 * wa;`);
  };
  m.customProgramCacheKey = () => 'beat';
  return m;
}
/** ventricular and atrial squeeze (0..1) for a phase of the cycle */
function squeeze(ph: number) {
  const a = ph < 0.13 ? Math.sin((ph / 0.13) * Math.PI) : 0;
  const v = ph >= 0.13 && ph < 0.5 ? Math.sin(((ph - 0.13) / 0.37) * Math.PI) ** 0.7 : 0;
  return { a, v, avOpen: ph < 0.14 || ph > 0.55 ? 1 : 0, slOpen: ph > 0.2 && ph < 0.48 ? 1 : 0 };
}

/* ───────── valves ───────── */
function Valve({ id, at, dir, R, n, open, color = '#f3dfc0' }: { id: string; at: Vec; dir: Vec; R: number; n: number; open: React.MutableRefObject<number>; color?: string }) {
  const m = useHi(id, color, { rough: 0.5, sheen: 0.6, side: THREE.DoubleSide, opacity: 0.95 });
  const ring = useHi(id, '#e8c9a0', { rough: 0.6 });
  const q = useMemo(() => new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), V(...dir).normalize()), [dir]);
  const leaves = useMemo(() => Array.from({ length: n }, (_, k) => {
    const a = (k / n) * Math.PI * 2, w = (Math.PI * 2) / n;
    const g = new THREE.CircleGeometry(R * 0.98, 14, a - w / 2, w); g.rotateX(-Math.PI / 2);
    const h = V(Math.cos(a) * R, 0, -Math.sin(a) * R); g.translate(-h.x, -h.y, -h.z);
    return { g, h, t: V(Math.sin(a), 0, Math.cos(a)).normalize() };
  }), [n, R]);
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  useFrame(() => { leaves.forEach((l, i) => { const me = refs.current[i]; if (me) me.quaternion.setFromAxisAngle(l.t, open.current * 1.25); }); });
  return (
    <group position={at} quaternion={q}>
      <mesh material={ring} rotation-x={Math.PI / 2}><torusGeometry args={[R, R * 0.09, 8, 32]} /></mesh>
      {leaves.map((l, i) => <mesh key={i} ref={(e) => { refs.current[i] = e; }} geometry={l.g} material={m} position={l.h} />)}
      <Anchor id={id} position={[R * 0.4, R * 0.3, R * 0.6]} />
    </group>
  );
}

/* ───────── blood moving through ───────── */
function Flow({ speed, sec, inside }: { speed: number; sec: boolean; inside: SDF }) {
  const paths = useMemo(() => [
    { c: curve([[-0.8, 2.2, 0.15], [-0.8, 1.2, 0.15], [-0.75, 0.5, 0.15], [-0.5, 0.15, 0.25], [-0.15, -0.35, 0.35], [0.05, -0.6, 0.38], [-0.15, -0.2, 0.42], [-0.18, 0.4, 0.5], [-0.05, 0.95, 0.5], [0.22, 1.3, 0.3], [0.9, 1.42, -0.1]]), col: '#4d73d6' },
    { c: curve([[-0.75, -0.9, 0.0], [-0.78, 0.2, 0.12], [-0.45, 0.15, 0.25], [-0.1, -0.4, 0.37], [-0.17, 0.3, 0.48], [0.0, 1.0, 0.5], [0.15, 1.3, 0.3], [-0.6, 1.36, -0.1]]), col: '#4d73d6' },
    { c: curve([[1.25, 0.9, -0.3], [0.7, 0.75, -0.25], [0.3, 0.65, -0.2], [0.25, 0.3, -0.05], [0.4, -0.3, 0.1], [0.5, -0.65, 0.18], [0.25, -0.2, 0.08], [0.02, 0.4, 0.05], [-0.04, 1.1, 0.13], [0.1, 1.8, 0.1], [0.45, 2.0, -0.1]]), col: '#e0342f' },
    { c: curve([[-0.9, 0.85, -0.25], [-0.3, 0.75, -0.2], [0.2, 0.6, -0.15], [0.3, 0.1, 0.0], [0.45, -0.5, 0.15], [0.2, -0.1, 0.08], [0.0, 0.5, 0.06], [-0.05, 1.3, 0.12], [0.05, 1.75, 0.1]]), col: '#e0342f' },
  ], []);
  const N = 26, refs = useRef<THREE.InstancedMesh[]>([]);
  const geo = useMemo(() => { const g = new THREE.SphereGeometry(0.045, 10, 8); g.scale(1, 0.45, 1); return g; }, []);
  const mats = useMemo(() => paths.map((p) => new THREE.MeshStandardMaterial({ color: p.col, emissive: p.col, emissiveIntensity: 0.35, roughness: 0.4 })), [paths]);
  const M = useMemo(() => new THREE.Matrix4(), []), q = useMemo(() => new THREE.Quaternion(), []);
  useFrame(({ clock }) => {
    paths.forEach((p, k) => {
      const im = refs.current[k]; if (!im) return;
      for (let i = 0; i < N; i++) {
        const t = ((i / N) + clock.elapsedTime * 0.06 * speed) % 1, pos = p.c.getPointAt(t), tan = p.c.getTangentAt(t);
        if (sec && pos.dot(CUT_N) > CUT_D + 0.02) pos.addScaledVector(CUT_N, -(pos.dot(CUT_N) - CUT_D) - 0.04);
        const sc = inside(pos.x, pos.y, pos.z) < -0.02 ? 1 : 0;
        q.setFromUnitVectors(V(0, 1, 0), tan); M.compose(pos, q, V(sc, sc, sc)); im.setMatrixAt(i, M);
      }
      im.instanceMatrix.needsUpdate = true;
    });
  });
  return <>{paths.map((_, k) => <instancedMesh key={k} ref={(e) => { if (e) refs.current[k] = e; }} args={[geo, mats[k], N]} frustumCulled={false} />)}</>;
}

/* ───────── conduction system ───────── */
const SA: Vec = [-0.72, 0.95, 0.22], AVN: Vec = [-0.28, 0.32, 0.14], HIS: Vec = [-0.12, 0.08, 0.2];
function Conduction({ phase, afib, block2 }: { phase: React.MutableRefObject<number>; afib?: boolean; block2?: boolean }) {
  const paths = useMemo(() => ({
    atria: [curve([SA, [-0.6, 0.62, 0.28], [-0.42, 0.42, 0.2], AVN]), curve([SA, [-0.35, 0.95, 0.0], [0.1, 0.92, -0.25], [0.5, 0.82, -0.35]]), curve([SA, [-0.85, 0.6, -0.2], [-0.55, 0.38, -0.05], AVN])],
    his: [curve([AVN, [-0.2, 0.2, 0.17], HIS])],
    branches: [curve([HIS, [0.05, -0.2, 0.17], [0.3, -0.62, 0.22], [0.55, -0.9, 0.28]]), curve([HIS, [-0.12, -0.25, 0.32], [0.08, -0.62, 0.42], [0.35, -0.88, 0.42]])],
  }), []);
  const purk = useMemo(() => { const gs: THREE.BufferGeometry[] = []; for (const [i, root] of ([[0.55, -0.9, 0.28], [0.35, -0.88, 0.42]] as Vec[]).entries()) { const t = tree({ root: V(...root), dir: V(i ? -0.5 : 0.2, 1, i ? 0.5 : -0.4), len: 0.32, r: 0.014, depth: 4, spread: 0.7, shrink: 0.8, seed: 5 + i, wiggle: 0.25 }); gs.push(treeGeo(t, 5)); } return gs; }, []);
  const mk = (c: string) => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.4, roughness: 0.4, toneMapped: false });
  const mats = useMemo(() => ({ sa: mk('#ffe36b'), atria: mk('#ffd25a'), av: mk('#ffb84a'), his: mk('#ffa14a'), br: mk('#ff8a4a'), pk: mk('#ff7a5a') }), []);
  const sparks = useRef<THREE.Group>(null);
  const R = useMemo(() => rng(9), []);
  useFrame(({ clock }) => {
    const ph = phase.current, win = (a: number, b: number) => (ph >= a && ph < b ? 1 : 0), pulse = (a: number, b: number) => (ph >= a && ph < b ? Math.sin(((ph - a) / (b - a)) * Math.PI) : 0);
    const af = afib ? 0.6 + 0.6 * Math.abs(Math.sin(clock.elapsedTime * 23) * Math.sin(clock.elapsedTime * 7.3)) : 0;
    mats.sa.emissiveIntensity = afib ? 0.6 : 0.6 + 3 * pulse(0, 0.06);
    mats.atria.emissiveIntensity = afib ? af * 2 : 0.4 + 2.5 * pulse(0, 0.11);
    mats.av.emissiveIntensity = 0.5 + 2.5 * pulse(0.08, 0.17);
    mats.his.emissiveIntensity = 0.4 + 2.5 * pulse(0.14, 0.2) * (block2 ? 0 : 1);
    mats.br.emissiveIntensity = 0.4 + 2.5 * pulse(0.17, 0.25) * (block2 ? 0 : 1);
    mats.pk.emissiveIntensity = 0.3 + 2.2 * pulse(0.2, 0.3) * (block2 ? 0 : 1);
    const g = sparks.current; if (!g) return;
    const all: [THREE.Curve<THREE.Vector3>, number, number][] = [...paths.atria.map((c) => [c, 0, 0.11] as [THREE.Curve<THREE.Vector3>, number, number]), [paths.his[0], 0.13, 0.19], ...paths.branches.map((c) => [c, 0.17, 0.26] as [THREE.Curve<THREE.Vector3>, number, number])];
    g.children.forEach((s, i) => {
      const [c, a, b] = all[i % all.length]; const on = afib && i < 3 ? 1 : win(a, b) * (block2 && a >= 0.13 ? 0 : 1);
      s.visible = !!on; if (!on) return;
      const t = afib && i < 3 ? R() : (ph - a) / (b - a); s.position.copy(c.getPointAt(Math.min(1, Math.max(0, t))));
    });
  });
  const tubeOf = (c: THREE.Curve<THREE.Vector3>, r: number) => varTube(c, 40, 6, () => r);
  return (
    <group>
      <mesh material={mats.sa} position={SA}><sphereGeometry args={[0.075, 20, 14]} /></mesh>
      <mesh material={mats.av} position={AVN}><sphereGeometry args={[0.06, 20, 14]} /></mesh>
      {paths.atria.map((c, i) => <mesh key={i} geometry={tubeOf(c, 0.018)} material={mats.atria} />)}
      <mesh geometry={tubeOf(paths.his[0], 0.03)} material={mats.his} />
      {paths.branches.map((c, i) => <mesh key={i} geometry={tubeOf(c, 0.024)} material={mats.br} />)}
      {purk.map((g, i) => <mesh key={i} geometry={g} material={mats.pk} />)}
      <group ref={sparks}>{Array.from({ length: 7 }, (_, i) => <mesh key={i}><sphereGeometry args={[0.05, 12, 10]} /><meshBasicMaterial color="#fff6c8" toneMapped={false} /></mesh>)}</group>
      <Anchor id="sa" position={SA} /><Anchor id="av" position={AVN} /><Anchor id="his" position={HIS} />
      <Anchor id="lbb" position={[0.3, -0.62, 0.22]} /><Anchor id="rbb" position={[0.08, -0.62, 0.42]} /><Anchor id="purkinje" position={[0.7, -0.5, 0.3]} />
      <Anchor id="bachmann" position={[0.1, 0.92, -0.25]} />
    </group>
  );
}

const COL: Record<string, string> = { lv: '#9c352e', rv: '#a53c33', la: '#8e322d', ra: '#93352f', aorta: '#d0503f', pa: '#4c66bd', svc: '#3e56ad', ivc: '#3e56ad', pv: '#c9473b' };
const PARTS = ['lv', 'rv', 'la', 'ra', 'aorta', 'pa', 'svc', 'ivc', 'pv'];

function Piece({ name, geo, beat, op, cut }: { name: string; geo: THREE.BufferGeometry; beat: BeatU; op: number; cut?: boolean }) {
  const m = useHi(name === 'cut' ? 'cut' : name, cut ? '#cf6a5c' : COL[name] ?? '#a63a31', { rough: cut ? 0.75 : 0.42, clear: cut ? 0.1 : 0.55, sheen: 0.5, opacity: op, side: THREE.DoubleSide });
  useMemo(() => beatify(m, beat), [m, beat]);
  return <mesh geometry={geo} material={m} renderOrder={op < 1 ? 2 : 0} />;
}

export default function Heart({ p }: { p: HeartP }) {
  const S = useScene();
  const mode = p.mode ?? 'outside', bpm = useCtl('bpm', 64), wallCtl = useCtl('wall', p.wall ?? 0);
  const wall = Math.round(wallCtl * 10) / 10;
  const M = useMemo(() => {
    const key = `${mode}|${p.cut}|${wall}|${p.vsd}|${p.asd}`; setCut(p.cut ?? 'four');
    return cached('heart' + key, () => mode === 'section'
      ? mesh(sectionField(wall, !!p.vsd, !!p.asd), [-1.45, -1.35, -1.25], [1.5, 2.95, 1.0], 0.032, (x, y, z) => (Math.abs(cutPlane(x, y, z)) < 0.02 ? 'cut' : LABEL(x, y, z)))
      : mesh(outerField(wall), [-1.45, -1.35, -1.25], [1.5, 2.95, 1.0], 0.034, LABEL));
  }, [mode, wall, p.vsd, p.asd, p.cut]);
  const outer = useMemo(() => outerField(0), []);
  const cor = useMemo(() => {
    if (!(p.coronary ?? mode === 'outside')) return [];
    const list: [string, Vec[], number, string][] = [['lad', CORONARY.lad, 0.04, PAL.artery], ['lcx', CORONARY.lcx, 0.035, PAL.artery], ['rca', CORONARY.rca, 0.04, PAL.artery], ['diag', CORONARY.diag, 0.026, PAL.artery], ['marg', CORONARY.marg, 0.026, PAL.artery]];
    if (p.veins) list.push(['gcv', CORONARY.gcv, 0.035, PAL.vein]);
    return list.map(([id, pts, r, c]) => { const dense = curve(pts).getSpacedPoints(28).map((v) => v.toArray() as Vec); return { id, c, r, curve: curve(onSurface(outer, dense, r * 0.7)) }; });
  }, [p.coronary, p.veins, mode, outer]);
  const beat = useMemo<BeatU>(() => ({ uV: { value: 0 }, uA: { value: 0 } }), []);
  const ph = useRef(0), av = useRef(1), sl = useRef(0);
  useFrame(({ clock }, dt) => {
    let phase: number;
    if (p.phases && S.stages) { const i = Math.round(S.st.current); phase = p.phases[Math.min(p.phases.length - 1, Math.max(0, i))]; }
    else { const b = p.afib ? bpm * (1 + 0.35 * Math.sin(clock.elapsedTime * 1.7) * Math.sin(clock.elapsedTime * 0.9)) : bpm; ph.current = (ph.current + Math.min(dt, 0.05) * (b / 60)) % 1; phase = ph.current; }
    ph.current = phase;
    const s = squeeze(phase);
    beat.uV.value = s.v * (p.block2 ? 0.4 : 1); beat.uA.value = p.afib ? 0.15 * Math.abs(Math.sin(clock.elapsedTime * 19)) : s.a;
    const k = p.phases ? 0.08 : 0.35;
    av.current += ((p.stenosis === 'mitral' ? 0.45 : 1) * s.avOpen - av.current) * k;
    sl.current += ((p.stenosis === 'aortic' ? 0.4 : 1) * s.slOpen - sl.current) * k;
  });
  const op = mode === 'conduction' ? 0.26 : 1;
  const show = mode === 'section' ? [...PARTS, 'cut'] : PARTS;
  const corMat = useHi(['lad', 'lcx', 'rca', 'diag', 'marg', 'coronary'], PAL.artery, { rough: 0.35, clear: 0.6 });
  const veinMat = useHi('gcv', PAL.vein, { rough: 0.35, clear: 0.6 });
  useMemo(() => { beatify(corMat, beat); beatify(veinMat, beat); }, [corMat, veinMat, beat]);
  const blockAt = useMemo(() => { const c = cor.find((x) => x.id === (p.block ?? 'lad')); return c ? c.curve.getPointAt(0.28) : V(); }, [cor, p.block]);
  const infarctM = useHi('infarct', '#5b3550', { rough: 0.8, opacity: 0.92 });
  const plaqueM = useHi(['plaque', 'block'], '#f0d27a', { rough: 0.6 });
  const stentM = useHi('stent', '#d8dde4', { rough: 0.25, metal: 0.9 }); stentM.wireframe = true;
  const graftM = useHi('graft', '#c74a44', { rough: 0.4, clear: 0.6 });
  const pacerM = useHi(['pacer', 'lead'], '#b9c0c8', { rough: 0.3, metal: 0.8 });
  const graft = useMemo(() => p.graft ? curve(onSurface(outer, [[0.05, 1.55, 0.35], [0.3, 1.3, 0.6], [0.45, 0.6, 0.75], [0.35, -0.2, 0.78]], 0.05)) : null, [p.graft, outer]);
  const lead = useMemo(() => curve([[1.4, 2.5, 0.7], [0.3, 2.75, 0.4], [-0.8, 2.4, 0.08], [-0.8, 1.2, 0.05], [-0.72, 0.5, 0.1], [-0.35, 0.15, 0.3], [0.05, -0.45, 0.4], [0.3, -0.75, 0.45]]), []);
  const infarct = useMemo(() => { if (!p.infarct) return null; const c = V(0.45, -0.62, 0.55); const g = new THREE.SphereGeometry(0.42, 36, 24); g.scale(1.1, 1, 0.5); g.lookAt(V(0.45, -0.3, 1)); const pts = onSurface(outer, [[c.x, c.y, c.z]], 0.0)[0]; return { g, at: pts }; }, [p.infarct, outer]);
  return (
    <group position={[0, -0.6, 0]}>
      {show.map((n) => M.groups.get(n) && <Piece key={n + M.geo.uuid} name={n} geo={M.groups.get(n)!} beat={beat} op={n === 'cut' ? 1 : op} cut={n === 'cut'} />)}
      {cor.map((c) => <mesh key={c.id} geometry={varTube(c.curve, 80, 8, (t) => c.r * (1 - t * 0.5))} material={c.id === 'gcv' ? veinMat : corMat} />)}
      {mode === 'section' && p.cut !== 'base' && (<>
        <Valve id="tricuspid" at={[-0.46, 0.18, -0.02]} dir={[0.55, -0.75, 0.3]} R={0.2} n={3} open={av} />
        <Valve id="mitral" at={[0.22, 0.38, -0.2]} dir={[0.1, -0.95, 0.4]} R={0.2} n={2} open={av} />
        <Valve id="aortic" at={[0.0, 0.55, -0.08]} dir={[-0.06, 1, 0.08]} R={0.19} n={3} open={sl} />
      </>)}
      {mode === 'section' && p.cut === 'base' && (<>
        <Valve id="tricuspid" at={[-0.42, 0.4, 0.22]} dir={[0, -1, 0]} R={0.23} n={3} open={av} />
        <Valve id="mitral" at={[0.22, 0.4, -0.22]} dir={[0, -1, 0]} R={0.23} n={2} open={av} />
        <Valve id="aortic" at={[-0.02, 0.4, 0.02]} dir={[0, 1, 0]} R={0.19} n={3} open={sl} />
        <Valve id="pulmonary" at={[-0.1, 0.4, 0.5]} dir={[0, 1, 0]} R={0.18} n={3} open={sl} />
      </>)}
      {p.flow && <Flow speed={bpm / 60} sec={mode === 'section'} inside={outer} />}
      {mode === 'conduction' && <Conduction phase={ph} afib={p.afib} block2={p.block2} />}
      {p.plaque && <mesh material={plaqueM} position={blockAt}><sphereGeometry args={[0.06, 16, 12]} /></mesh>}
      {p.stent && <mesh material={stentM} position={blockAt}><cylinderGeometry args={[0.052, 0.052, 0.22, 12, 6, true]} /></mesh>}
      {infarct && <mesh geometry={infarct.g} material={infarctM} position={infarct.at} />}
      {graft && <mesh geometry={varTube(graft, 60, 8, () => 0.045)} material={graftM} />}
      {p.pacer && (<><mesh geometry={varTube(lead, 160, 6, () => 0.018)} material={pacerM} /><mesh material={pacerM} position={[1.45, 2.5, 0.72]} rotation={[0.2, -0.3, 0.1]}><boxGeometry args={[0.42, 0.34, 0.1]} /></mesh></>)}
      <Anchor id="lv" position={mode === 'section' ? [0.38, -0.25, 0.12] : [0.95, -0.4, 0.15]} />
      <Anchor id="rv" position={mode === 'section' ? [-0.1, -0.2, 0.36] : [-0.2, -0.3, 0.85]} />
      <Anchor id="ra" position={mode === 'section' ? [-0.8, 0.45, 0.1] : [-1.25, 0.45, 0.15]} />
      <Anchor id="la" position={mode === 'section' ? [0.3, 0.65, -0.35] : [0.85, 0.7, -0.6]} />
      <Anchor id="aorta" position={[0.15, 2.0, 0.1]} />
      <Anchor id="pa" position={[0.05, 1.05, 0.75]} />
      <Anchor id="svc" position={[-1.0, 1.9, 0.1]} />
      <Anchor id="ivc" position={[-0.95, -0.8, 0.0]} />
      <Anchor id="pv" position={[1.3, 0.7, -0.7]} />
      <Anchor id="septum" position={[-0.1, -0.15, 0.25]} />
      <Anchor id="apex" position={[0.75, -1.15, 0.35]} />
      {cor.map((c) => <Anchor key={c.id} id={c.id} position={c.curve.getPointAt(0.45).toArray() as Vec} />)}
      <Anchor id="block" position={blockAt.toArray() as Vec} /><Anchor id="plaque" position={blockAt.toArray() as Vec} /><Anchor id="stent" position={blockAt.toArray() as Vec} />
      {infarct && <Anchor id="infarct" position={infarct.at.toArray() as Vec} />}
      {graft && <Anchor id="graft" position={graft.getPointAt(0.4).toArray() as Vec} />}
      {p.pacer && (<><Anchor id="pacer" position={[1.45, 2.5, 0.8]} /><Anchor id="lead" position={lead.getPointAt(0.85).toArray() as Vec} /></>)}
      <Anchor id="vsd" position={[-0.1, -0.15, 0.25]} /><Anchor id="asd" position={[-0.3, 0.6, -0.15]} />
    </group>
  );
}
