/**
 * The brain: two hemispheres whose folds (gyri and sulci) are grown from a
 * noise field, with the central and lateral fissures cut in, a finely
 * ridged cerebellum and the brainstem. Lobes can be coloured; the cortex
 * can turn to glass to show the deep structures (hippocampus, amygdala,
 * thalamus, basal ganglia, ventricles, corpus callosum); it can be sliced to
 * show grey and white matter; and overlays mark a stroke, a tumour, plaques,
 * lesions, firing activity or the arteries.
 */
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Anchor, useCtl, useHi } from '../stage';
import { capsule, ellipsoid, mesh, smax, smin, cached, type SDF, type Vec } from '../sdf';
import { V, noise3, fbm, curve, varTube, rng, fibSphere, PAL } from '../kit';

export interface BrainP {
  mode?: 'whole' | 'glass' | 'half' | 'slice';
  lobes?: boolean; deep?: string[]; regions?: string[];
  atrophy?: number; stroke?: boolean; tumor?: boolean; plaques?: boolean; lesions?: boolean; nigra?: 'fade';
  activity?: boolean; arteries?: boolean; visual?: boolean; motor?: boolean; waves?: boolean; glymph?: boolean; csf?: boolean;
}

/* ───────── the folded cortex ───────── */
const HEMI = (side: number): SDF => {
  const main = ellipsoid([side * 0.5, 0.2, -0.02], [0.6, 0.74, 1.16]);
  const front = ellipsoid([side * 0.42, 0.08, 0.62], [0.5, 0.55, 0.52]);
  const temporal = ellipsoid([side * 0.62, -0.32, 0.18], [0.34, 0.3, 0.62], new THREE.Euler(0.2, 0, 0));
  const occ = ellipsoid([side * 0.4, 0.05, -0.85], [0.45, 0.5, 0.42]);
  return (x, y, z) => {
    let d = smin(smin(main(x, y, z), front(x, y, z), 0.25), occ(x, y, z), 0.25);
    d = smin(d, temporal(x, y, z), 0.08);
    d = smax(d, -(side * x) + 0.022, 0.03); // the longitudinal fissure
    d = smax(d, -(y + 0.55 + Math.max(0, -z - 0.4) * 0.35), 0.1); // flat underside over the cerebellum
    return d;
  };
}
const LH = HEMI(-1), RH = HEMI(1);
/** depth of the sulci at a point (0 on a gyrus crown) */
function folds(x: number, y: number, z: number, atrophy: number) {
  const wx = x + 0.12 * noise3(x * 1.7 + 3, y * 1.7, z * 1.7), wz = z + 0.12 * noise3(x * 1.7, y * 1.7 + 5, z * 1.7);
  const n = noise3(wx * 2.9, y * 2.9, wz * 2.9) + 0.18 * noise3(x * 6.3 + 7, y * 6.3, z * 6.3);
  const t = Math.min(1, Math.abs(n) / 0.42);
  let g = Math.pow(1 - t, 2.6 - atrophy) * (0.11 + atrophy * 0.05);
  // central sulcus: a groove running over the top, tilted back
  const cs = z + 0.05 + (y - 0.2) * 0.42 + 0.06 * Math.sin(y * 7);
  g = Math.max(g, 0.075 * Math.exp(-(cs * cs) / 0.0016) * (y > -0.05 ? 1 : 0));
  // lateral (Sylvian) fissure
  const lf = y + 0.1 - (z - 0.2) * 0.32 + 0.03 * Math.sin(z * 9);
  g = Math.max(g, 0.09 * Math.exp(-(lf * lf) / 0.0018) * (Math.abs(x) > 0.42 && z > -0.55 ? 1 : 0));
  return g;
}
const CEREB = ellipsoid([0, -0.58, -0.72], [0.72, 0.33, 0.45]);
const VERMIS = ellipsoid([0, -0.55, -0.82], [0.16, 0.3, 0.38]);
const STEM = capsule([0, -0.3, -0.22], [0, -1.3, -0.4], 0.19, 0.14);
const PONS = ellipsoid([0, -0.68, -0.14], [0.24, 0.2, 0.2]);

function brainField(atrophy: number, half: boolean): SDF {
  return (x, y, z) => {
    let c = Math.min(LH(x, y, z), RH(x, y, z));
    if (c < 0.15) c += folds(x, y, z, atrophy) - 0.02;
    let cb = smin(CEREB(x, y, z), VERMIS(x, y, z), 0.1);
    if (cb < 0.08) cb += 0.018 * (0.5 + 0.5 * Math.sin(Math.hypot(y + 0.45, z + 0.55) * 95)) + 0.01 * noise3(x * 5, y * 5, z * 5);
    const st = smin(STEM(x, y, z), PONS(x, y, z), 0.12);
    let d = Math.min(c, smin(cb, st, 0.08));
    if (half) d = smax(d, -x, 0);
    return d;
  };
}
function lobeOf(x: number, y: number, z: number) {
  if (STEM(x, y, z) < 0.06 || PONS(x, y, z) < 0.05) return 'brainstem';
  if (y < -0.3 && z < -0.35 && Math.min(LH(x, y, z), RH(x, y, z)) > CEREB(x, y, z) - 0.02) return 'cerebellum';
  const cs = z + 0.05 + (y - 0.2) * 0.42, lf = y + 0.1 - (z - 0.2) * 0.32;
  if (lf < 0 && z > -0.62 && Math.abs(x) > 0.25) return 'temporal';
  if (z < -0.68 + y * 0.1) return 'occipital';
  return cs > 0 ? 'frontal' : 'parietal';
}
const LOBE_COL: Record<string, string> = { frontal: '#e3836f', parietal: '#e8bd62', temporal: '#76b98a', occipital: '#6f9fdc', cerebellum: '#b884d6', brainstem: '#cfa47c' };
const CORTEX = '#e2b3a4';

/* ───────── deep structures ───────── */
type Deep = { id: string; color: string; parts: THREE.BufferGeometry[]; at: Vec };
const sideBoth = (f: (s: number) => THREE.BufferGeometry) => [f(-1), f(1)];
const blobAt = (c: Vec, r: Vec) => { const g = new THREE.SphereGeometry(1, 28, 20); g.scale(...r); g.translate(...c); return g; };
const tubeAt = (pts: Vec[], r: (t: number) => number) => varTube(curve(pts), 60, 10, r);
function deepParts(): Record<string, Deep> {
  const D: Deep[] = [
    { id: 'hippocampus', color: '#f2c94c', at: [0.46, -0.38, 0.0], parts: sideBoth((s) => tubeAt([[s * 0.44, -0.42, 0.22], [s * 0.44, -0.36, -0.1], [s * 0.34, -0.18, -0.38], [s * 0.18, 0.02, -0.45]], (t) => 0.075 * (1 - t * 0.6))) },
    { id: 'fornix', color: '#f5e6a8', at: [0.05, 0.05, 0.1], parts: sideBoth((s) => tubeAt([[s * 0.18, 0.02, -0.45], [s * 0.06, 0.14, -0.25], [s * 0.04, 0.12, 0.05], [s * 0.04, -0.08, 0.22]], () => 0.025)) },
    { id: 'amygdala', color: '#e85a5a', at: [0.43, -0.42, 0.32], parts: sideBoth((s) => blobAt([s * 0.42, -0.42, 0.32], [0.08, 0.08, 0.1])) },
    { id: 'thalamus', color: '#7fc6d9', at: [0.14, -0.04, -0.14], parts: sideBoth((s) => blobAt([s * 0.13, -0.04, -0.14], [0.12, 0.12, 0.21])) },
    { id: 'hypothalamus', color: '#f28c3a', at: [0, -0.22, 0.06], parts: [blobAt([0, -0.22, 0.06], [0.1, 0.07, 0.1])] },
    { id: 'pituitary', color: '#f2a23a', at: [0, -0.46, 0.14], parts: [blobAt([0, -0.46, 0.14], [0.07, 0.055, 0.06]), tubeAt([[0, -0.28, 0.08], [0, -0.38, 0.11], [0, -0.43, 0.13]], () => 0.02)] },
    { id: 'pineal', color: '#c9a0e0', at: [0, -0.02, -0.48], parts: [blobAt([0, -0.02, -0.48], [0.035, 0.035, 0.05])] },
    { id: 'caudate', color: '#9ad04f', at: [0.2, 0.24, 0.1], parts: sideBoth((s) => tubeAt([[s * 0.17, 0.12, 0.42], [s * 0.2, 0.26, 0.05], [s * 0.22, 0.17, -0.32], [s * 0.34, -0.12, -0.36], [s * 0.4, -0.28, -0.08]], (t) => 0.11 * (1 - t * 0.75))) },
    { id: 'putamen', color: '#5ab8a0', at: [0.34, -0.02, 0.12], parts: sideBoth((s) => blobAt([s * 0.33, -0.02, 0.1], [0.09, 0.18, 0.28])) },
    { id: 'pallidus', color: '#3f8f7a', at: [0.24, -0.04, 0.06], parts: sideBoth((s) => blobAt([s * 0.24, -0.04, 0.06], [0.05, 0.12, 0.16])) },
    { id: 'accumbens', color: '#ff7aa8', at: [0.12, -0.14, 0.36], parts: sideBoth((s) => blobAt([s * 0.12, -0.14, 0.36], [0.06, 0.05, 0.07])) },
    { id: 'nigra', color: '#3a2a3a', at: [0.09, -0.4, -0.18], parts: sideBoth((s) => blobAt([s * 0.09, -0.4, -0.18], [0.08, 0.03, 0.06])) },
    { id: 'vta', color: '#ff9d6b', at: [0, -0.38, -0.1], parts: [blobAt([0, -0.38, -0.1], [0.05, 0.03, 0.04])] },
    { id: 'callosum', color: '#f4efe6', at: [0, 0.3, 0.0], parts: [(() => { const g = tubeAt([[0, 0.0, 0.5], [0, 0.22, 0.32], [0, 0.3, 0.0], [0, 0.26, -0.35], [0, 0.06, -0.58]], (t) => 0.06 + 0.03 * Math.exp(-((t - 1) ** 2) / 0.01) + 0.02 * Math.exp(-(t * t) / 0.01)); g.scale(4, 1, 1); return g; })()] },
    { id: 'ventricles', color: '#4fb3d9', at: [0.13, 0.17, -0.1], parts: [...sideBoth((s) => tubeAt([[s * 0.1, 0.1, 0.42], [s * 0.12, 0.2, 0.05], [s * 0.15, 0.13, -0.38], [s * 0.2, 0.02, -0.64]], (t) => 0.07 * (1 - t * 0.5))), ...sideBoth((s) => tubeAt([[s * 0.15, 0.13, -0.38], [s * 0.3, -0.1, -0.35], [s * 0.38, -0.28, -0.05]], () => 0.04)), blobAt([0, -0.1, -0.1], [0.02, 0.12, 0.18]), tubeAt([[0, -0.2, -0.25], [0, -0.35, -0.35], [0, -0.52, -0.42]], () => 0.018), blobAt([0, -0.6, -0.46], [0.12, 0.08, 0.06])] },
    { id: 'optic', color: '#f2d16b', at: [0, -0.4, 0.42], parts: [...sideBoth((s) => tubeAt([[s * 0.2, -0.36, 0.95], [s * 0.1, -0.4, 0.55], [0, -0.4, 0.32]], () => 0.035)), ...sideBoth((s) => tubeAt([[0, -0.4, 0.32], [s * 0.15, -0.35, 0.12], [s * 0.24, -0.15, -0.15]], () => 0.03))] },
    { id: 'radiation', color: '#ffe36b', at: [0.3, 0.0, -0.55], parts: sideBoth((s) => tubeAt([[s * 0.24, -0.15, -0.15], [s * 0.38, -0.05, -0.45], [s * 0.3, 0.05, -0.75], [s * 0.15, 0.08, -1.05]], () => 0.035)) },
  ];
  return Object.fromEntries(D.map((d) => [d.id, d]));
}

/* ───────── regions painted on the cortex (by position) ───────── */
const REGIONS: Record<string, { c: Vec; r: number; color: string; label?: string }> = {
  broca: { c: [-0.82, -0.02, 0.55], r: 0.24, color: '#ff7a5a' },
  wernicke: { c: [-0.9, -0.18, -0.32], r: 0.26, color: '#5ac8ff' },
  visual: { c: [0, 0.0, -1.12], r: 0.42, color: '#ffd25a' },
  prefrontal: { c: [0, 0.2, 1.05], r: 0.55, color: '#ff9d6b' },
  auditory: { c: [-0.95, -0.15, 0.0], r: 0.22, color: '#c98bd9' },
  smell: { c: [0, -0.42, 0.75], r: 0.25, color: '#9ad04f' },
};
const SL_VENT = [-1, 1].map((s) => ellipsoid([s * 0.11, 0.2, 0], [0.05, 0.09, 0.3])).concat([ellipsoid([0, -0.1, 0], [0.018, 0.12, 0.3])]);
const SL_DEEP = [-1, 1].flatMap((s) => [ellipsoid([s * 0.2, 0.25, 0.05], [0.07, 0.09, 0.3]), ellipsoid([s * 0.33, -0.02, 0.1], [0.09, 0.18, 0.28]), ellipsoid([s * 0.13, -0.08, -0.14], [0.11, 0.12, 0.21]), ellipsoid([s * 0.24, -0.04, 0.06], [0.05, 0.12, 0.16])]);
function strip(_x: number, y: number, z: number) { const cs = z + 0.05 + (y - 0.2) * 0.42; return y > -0.1 ? (cs > 0 && cs < 0.16 ? 'motor' : cs < 0 && cs > -0.16 ? 'sensory' : '') : ''; }

export default function Brain({ p }: { p: BrainP }) {
  const mode = p.mode ?? 'whole', atrophy = useCtl('atrophy', p.atrophy ?? 0), atr = Math.round(atrophy * 4) / 4;
  const regs = p.regions ?? [];
  const M = useMemo(() => cached(`brain|${mode}|${atr}|${p.lobes}|${regs.join()}|${p.motor}`, () => {
    let f = brainField(atr, mode === 'half');
    if (mode === 'slice') { const base = f; f = (x, y, z) => smax(base(x, y, z), z - 0.0, 0); }
    const label = (x: number, y: number, z: number) => {
      if (mode === 'slice' && z > -0.02) {
        if (SL_VENT.some((f) => f(x, y, z) < 0)) return 'ventricles';
        if (SL_DEEP.some((f) => f(x, y, z) < 0)) return 'deepgrey';
        const d = Math.min(LH(x, y, z), RH(x, y, z)); return d + folds(x, y, z, atr) > -0.08 ? 'grey' : 'white';
      }
      if (mode === 'half' && x < 0.012) { const L = lobeOf(x, y, z); return L === 'cerebellum' || L === 'brainstem' ? L : 'medial'; }
      if (p.motor) { const s = strip(x, y, z); if (s && Math.abs(x) > 0.05) return s; }
      for (const r of regs) { const R = REGIONS[r]; if (R && Math.hypot(x - R.c[0], y - R.c[1], z - R.c[2]) < R.r) return r; }
      const L = lobeOf(x, y, z); return p.lobes || L === 'cerebellum' || L === 'brainstem' ? L : 'cortex';
    };
    return mesh(f, [-1.22, -1.42, -1.32], [1.22, 1.02, 1.3], 0.021, label);
  }), [mode, atr, p.lobes, regs.join(), p.motor]);
  const op = mode === 'glass' ? 0.2 : 1;
  const deep = useMemo(() => (p.deep?.length ? deepParts() : {}), [p.deep]);
  return (
    <group rotation={[0, 0, 0]}>
      {[...M.groups].map(([name, g]) => <Piece key={name + M.geo.uuid} name={name} geo={g} op={['grey', 'white', 'deepgrey', 'ventricles'].includes(name) ? 1 : op} />)}
      {(p.deep ?? []).map((id) => deep[id] && <DeepPart key={id} d={deep[id]} fade={p.nigra === 'fade' && id === 'nigra'} />)}
      {p.stroke && <Stroke />}
      {p.tumor && <Tumor />}
      {p.plaques && <Specks n={260} color="#f2c94c" id="plaques" r={0.03} />}
      {p.lesions && <Specks n={26} color="#f6f1e8" id="lesions" r={0.07} inside />}
      {p.activity && <Activity />}
      {p.arteries && <Arteries />}
      {p.glymph && <Glymph />}
      <Anchor id="frontal" position={[-0.55, 0.55, 0.8]} /><Anchor id="parietal" position={[-0.5, 0.82, -0.45]} />
      <Anchor id="temporal" position={[-0.95, -0.35, 0.15]} /><Anchor id="occipital" position={[-0.4, 0.2, -1.2]} />
      <Anchor id="cerebellum" position={[-0.55, -0.65, -0.95]} /><Anchor id="brainstem" position={[0.12, -1.05, -0.35]} />
      <Anchor id="cortex" position={[-0.6, 0.75, 0.3]} /><Anchor id="medial" position={[0.02, 0.55, -0.2]} />
      <Anchor id="grey" position={[-0.75, 0.55, 0.0]} /><Anchor id="white" position={[-0.4, 0.2, 0.0]} />
      <Anchor id="motor" position={[-0.55, 0.85, 0.12]} /><Anchor id="sensory" position={[-0.55, 0.82, -0.12]} />
      <Anchor id="fissure" position={[0, 0.95, 0.2]} /><Anchor id="sulcus" position={[-0.7, 0.62, 0.0]} />
      {regs.map((r) => REGIONS[r] && <Anchor key={r} id={r} position={REGIONS[r].c.map((v, i) => v * (i === 0 ? 1.08 : 1.05)) as Vec} />)}
    </group>
  );
}

function Piece({ name, geo, op }: { name: string; geo: THREE.BufferGeometry; op: number }) {
  const c = LOBE_COL[name] ?? REGIONS[name]?.color ?? (name === 'motor' ? '#ff6b5a' : name === 'sensory' ? '#5aa8ff' : name === 'grey' || name === 'deepgrey' ? '#b98a80' : name === 'ventricles' ? '#2c5f8a' : name === 'white' ? '#f1e6d6' : name === 'medial' ? '#d8a596' : CORTEX);
  const ids = name === 'cortex' || name === 'medial' ? [name, 'sulcus', 'fissure'] : [name];
  const m = useHi(ids, c, { rough: 0.55, clear: 0.35, sheen: 0.7, opacity: op, side: op < 1 ? THREE.FrontSide : THREE.DoubleSide });
  return <mesh geometry={geo} material={m} renderOrder={op < 1 ? 5 : 0} />;
}
function DeepPart({ d, fade }: { d: Deep; fade?: boolean }) {
  const m = useHi(d.id, d.color, { rough: 0.35, clear: 0.6, sheen: 0.4, opacity: fade ? 0.35 : 1 });
  return <group>{d.parts.map((g, i) => <mesh key={i} geometry={g} material={m} />)}<Anchor id={d.id} position={d.at} /></group>;
}
function Stroke() {
  const v = useHi(['clot', 'mca'], PAL.artery, { rough: 0.35, clear: 0.6 });
  const dead = useHi('infarct', '#4a3346', { rough: 0.8, opacity: 0.88 });
  const pen = useHi('penumbra', '#c98a5a', { rough: 0.8, opacity: 0.5 });
  const mca = useMemo(() => tubeAt([[-0.15, -0.42, 0.25], [-0.45, -0.3, 0.2], [-0.78, -0.12, 0.1], [-0.92, 0.12, -0.05], [-0.9, 0.42, -0.2]], () => 0.03), []);
  return (
    <group>
      <mesh geometry={mca} material={v} />
      <mesh material={v} position={[-0.45, -0.3, 0.2]}><sphereGeometry args={[0.055, 16, 12]} /></mesh>
      <mesh material={pen} position={[-0.88, 0.18, 0.0]} scale={[0.25, 0.42, 0.5]}><sphereGeometry args={[1, 30, 20]} /></mesh>
      <mesh material={dead} position={[-0.9, 0.18, 0.0]} scale={[0.18, 0.3, 0.34]}><sphereGeometry args={[1, 30, 20]} /></mesh>
      <Anchor id="clot" position={[-0.45, -0.3, 0.2]} /><Anchor id="infarct" position={[-1.05, 0.18, 0.0]} /><Anchor id="penumbra" position={[-0.98, 0.5, -0.2]} /><Anchor id="mca" position={[-0.8, -0.1, 0.1]} />
    </group>
  );
}
function Tumor() {
  const m = useHi('tumor', '#c44f9e', { rough: 0.6, clear: 0.3 });
  const core = useHi('necrosis', '#3a2232', { rough: 0.9 });
  const ed = useHi('edema', '#f2e9a0', { rough: 0.9, opacity: 0.35 });
  const g = useMemo(() => { const gg = new THREE.IcosahedronGeometry(0.3, 4); const pos = gg.attributes.position as THREE.BufferAttribute; for (let i = 0; i < pos.count; i++) { const v = V().fromBufferAttribute(pos, i); v.multiplyScalar(1 + 0.25 * fbm(v.x * 5, v.y * 5, v.z * 5, 3)); pos.setXYZ(i, v.x, v.y, v.z); } gg.computeVertexNormals(); return gg; }, []);
  return <group position={[-0.55, 0.35, 0.45]}><mesh geometry={g} material={m} /><mesh material={core}><sphereGeometry args={[0.14, 20, 14]} /></mesh><mesh material={ed} scale={1.6}><sphereGeometry args={[0.3, 30, 20]} /></mesh><Anchor id="tumor" position={[-0.2, 0.2, 0.15]} /><Anchor id="necrosis" position={[0, 0, 0.1]} inner /><Anchor id="edema" position={[0.2, 0.35, 0.3]} /></group>;
}
const brainSurf = (n: number, seed: number, inside = false) => { const f = brainField(0, false), R = rng(seed); const out: THREE.Vector3[] = []; let k = 0; while (out.length < n && k++ < n * 40) { const d = V(R() - 0.5, (R() - 0.5) * 0.9 + 0.12, R() - 0.5).normalize(); const p = V(d.x * 1.1, d.y * 0.9 + 0.15, d.z * 1.3); for (let i = 0; i < 6; i++) { const v = f(p.x, p.y, p.z); p.addScaledVector(p.clone().sub(V(0, 0.15, 0)).normalize(), -v); } if (Math.abs(f(p.x, p.y, p.z)) < 0.03 && p.y > -0.45) out.push(inside ? p.multiplyScalar(0.85) : p); } return out; };
function Specks({ n, color, id, r, inside }: { n: number; color: string; id: string; r: number; inside?: boolean }) {
  const pts = useMemo(() => brainSurf(n, 3, inside), [n, inside]);
  const m = useHi(id, color, { rough: 0.5, emissive: color, ei: 0.15 });
  const ref = useRef<THREE.InstancedMesh>(null);
  useMemo(() => queueMicrotask(() => { const im = ref.current; if (!im) return; const M = new THREE.Matrix4(); pts.forEach((p, i) => { M.makeScale(1, 1, 1).setPosition(p); im.setMatrixAt(i, M); }); im.instanceMatrix.needsUpdate = true; im.computeBoundingSphere(); }), [pts]);
  return <><instancedMesh ref={ref} args={[new THREE.IcosahedronGeometry(r, 1), m, pts.length]} />{pts[0] && <Anchor id={id} position={pts[0].toArray() as Vec} />}</>;
}
function Activity() {
  const pts = useMemo(() => brainSurf(140, 8), []);
  const ref = useRef<THREE.InstancedMesh>(null);
  const ph = useMemo(() => pts.map((_, i) => (i * 0.618) % 1), [pts]);
  const M = useMemo(() => new THREE.Matrix4(), []);
  useFrame(({ clock }) => { const im = ref.current; if (!im) return; const t = clock.elapsedTime; pts.forEach((p, i) => { const k = Math.max(0, Math.sin((t * 1.3 + ph[i] * 7) * 2)) ** 6; M.makeScale(k + 0.01, k + 0.01, k + 0.01).setPosition(p); im.setMatrixAt(i, M); }); im.instanceMatrix.needsUpdate = true; });
  return <><instancedMesh ref={ref} args={[new THREE.SphereGeometry(0.05, 10, 8), new THREE.MeshBasicMaterial({ color: '#9fe8ff', toneMapped: false }), pts.length]} frustumCulled={false} /><Anchor id="activity" position={pts[3].toArray() as Vec} /></>;
}
function Arteries() {
  const m = useHi(['arteries', 'willis'], PAL.artery, { rough: 0.35, clear: 0.6 });
  const gs = useMemo(() => {
    const w: Vec[][] = [[[0, -1.2, -0.3], [0, -0.75, -0.18], [0, -0.5, -0.1]], [[0, -0.5, -0.1], [-0.15, -0.46, 0.0], [-0.12, -0.44, 0.2], [0, -0.43, 0.28], [0.12, -0.44, 0.2], [0.15, -0.46, 0.0], [0, -0.5, -0.1]]];
    const br: Vec[][] = []; for (const s of [-1, 1]) { br.push([[s * 0.12, -0.44, 0.2], [s * 0.45, -0.3, 0.2], [s * 0.85, -0.1, 0.05], [s * 0.95, 0.25, -0.1], [s * 0.85, 0.6, -0.25]]); br.push([[s * 0.04, -0.43, 0.28], [s * 0.04, -0.2, 0.75], [s * 0.04, 0.4, 0.75], [s * 0.04, 0.8, 0.0]]); br.push([[s * 0.15, -0.46, 0.0], [s * 0.35, -0.38, -0.4], [s * 0.35, -0.1, -0.95]]); br.push([[s * 0.15, -0.46, 0.0], [s * 0.2, -0.75, -0.05], [s * 0.18, -1.2, -0.15]]); }
    return [...w, ...br].map((pts) => tubeAt(pts, () => 0.026));
  }, []);
  return <group>{gs.map((g, i) => <mesh key={i} geometry={g} material={m} />)}<Anchor id="willis" position={[0, -0.47, 0.1]} /><Anchor id="arteries" position={[-0.9, 0.2, -0.05]} /></group>;
}
function Glymph() {
  const pts = useMemo(() => fibSphere(90, 1).map((d) => V(d.x * 0.95, d.y * 0.7 + 0.2, d.z * 1.15)), []);
  const ref = useRef<THREE.InstancedMesh>(null), M = useMemo(() => new THREE.Matrix4(), []);
  useFrame(({ clock }) => { const im = ref.current; if (!im) return; const t = clock.elapsedTime; pts.forEach((p, i) => { const k = ((t * 0.25 + i * 0.137) % 1); M.makeTranslation(p.x * (1 - k * 0.5), p.y * (1 - k * 0.5), p.z * (1 - k * 0.5)); im.setMatrixAt(i, M); }); im.instanceMatrix.needsUpdate = true; });
  return <><instancedMesh ref={ref} args={[new THREE.SphereGeometry(0.03, 8, 6), new THREE.MeshBasicMaterial({ color: '#7fe0ff', toneMapped: false }), pts.length]} frustumCulled={false} /><Anchor id="csf" position={[0.6, 0.8, 0.3]} /></>;
}
