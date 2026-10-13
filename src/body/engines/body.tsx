/**
 * The whole body: a glass figure with the organ systems inside it, each
 * of which can be shown alone: the skeleton, the organs, arteries and
 * veins, the brain and nerves, the lymphatic system, the muscles, the
 * glands, the digestive and urinary tracts and the airway.
 */
import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Anchor, useHi } from '../stage';
import { capsule, ellipsoid, mesh, smin, cached, type SDF, type Vec } from '../sdf';
import { V, curve, varTube, blob, merge, PAL } from '../kit';

type Sys = 'skeleton' | 'organs' | 'circulation' | 'nerves' | 'lymph' | 'muscles' | 'glands' | 'digestive' | 'urinary' | 'respiratory' | 'skin' | 'all';
export interface BodyP { show?: Sys[]; pulse?: boolean; size?: boolean }

/* ───────── the figure ───────── */
const FIG: SDF[] = [
  ellipsoid([0, 3.15, 0.02], [0.36, 0.46, 0.4]), capsule([0, 2.75, -0.02], [0, 2.45, -0.02], 0.15),
  ellipsoid([0, 1.75, 0], [0.72, 0.85, 0.36]), ellipsoid([0, 0.75, 0.02], [0.6, 0.65, 0.33]), ellipsoid([0, 0.25, 0], [0.62, 0.38, 0.34]),
  ...[-1, 1].flatMap((s) => [capsule([s * 0.72, 2.38, 0], [s * 0.95, 1.2, -0.02], 0.15, 0.12), capsule([s * 0.95, 1.2, -0.02], [s * 1.15, 0.15, 0.06], 0.11, 0.085), ellipsoid([s * 1.2, -0.12, 0.08], [0.08, 0.2, 0.05]), capsule([s * 0.33, 0.15, 0], [s * 0.36, -1.6, 0.02], 0.24, 0.15), capsule([s * 0.36, -1.6, 0.02], [s * 0.38, -3.35, -0.04], 0.14, 0.08), ellipsoid([s * 0.4, -3.52, 0.08], [0.09, 0.07, 0.2])]),
];
const figure: SDF = (x, y, z) => { let d = Infinity; for (const f of FIG) d = smin(d, f(x, y, z), 0.12); return d; };

/* ───────── systems ───────── */
function Skeleton() {
  const m = useHi(['skeleton', 'skull', 'spine', 'ribs', 'pelvis', 'femur', 'humerus'], PAL.bone, { rough: 0.5, clear: 0.3 });
  const parts = useMemo(() => {
    const gs: THREE.BufferGeometry[] = [];
    const skull = cached('skull', () => mesh((x, y, z) => smin(ellipsoid([0, 3.22, -0.02], [0.3, 0.33, 0.35])(x, y, z), ellipsoid([0, 2.98, 0.1], [0.22, 0.2, 0.22])(x, y, z), 0.1), [-0.4, 2.6, -0.45], [0.4, 3.62, 0.45], 0.03)).geo;
    gs.push(skull);
    for (let i = 0; i < 24; i++) { const y = 2.65 - i * 0.1, z = -0.2 - 0.06 * Math.sin((i / 24) * Math.PI * 2); const v = new THREE.CylinderGeometry(0.055 + i * 0.002, 0.055 + i * 0.002, 0.07, 12); v.translate(0, y, z); gs.push(v); }
    for (let i = 0; i < 12; i++) for (const s of [-1, 1]) { const y = 2.25 - i * 0.12, w = 0.36 + Math.sin((i / 11) * Math.PI) * 0.22 - i * 0.008, d = 0.28 + Math.sin((i / 11) * Math.PI) * 0.06; const pts = Array.from({ length: 14 }, (_, k) => { const a = (k / 13) * (i < 10 ? Math.PI * 0.95 : Math.PI * 0.6); return V(s * Math.sin(a) * w, y - (k / 13) * 0.18, -Math.cos(a) * d * 0.8 - 0.02); }); gs.push(varTube(new THREE.CatmullRomCurve3(pts), 20, 5, () => 0.022)); }
    gs.push(new THREE.BoxGeometry(0.08, 0.6, 0.04).translate(0, 1.85, 0.26));
    const pelvis = cached('pelvis', () => mesh((x, y, z) => { const bowl = Math.abs(ellipsoid([0, 0.28, -0.02], [0.5, 0.3, 0.3])(x, y, z)) - 0.035; return Math.max(bowl, y - 0.45, -(y - 0.02)); }, [-0.6, -0.05, -0.4], [0.6, 0.5, 0.4], 0.03)).geo; gs.push(pelvis);
    for (const s of [-1, 1]) {
      gs.push(varTube(curve([[s * 0.08, 2.42, 0.18], [s * 0.4, 2.48, 0.1], [s * 0.7, 2.45, -0.02]]), 12, 6, () => 0.03));
      gs.push(new THREE.BoxGeometry(0.3, 0.38, 0.03).rotateY(s * 0.4).translate(s * 0.45, 2.15, -0.28));
      gs.push(varTube(curve([[s * 0.74, 2.35, 0], [s * 0.86, 1.8, -0.02], [s * 0.95, 1.22, -0.02]]), 16, 8, () => 0.04));
      gs.push(varTube(curve([[s * 0.96, 1.18, -0.01], [s * 1.06, 0.68, 0.02], [s * 1.14, 0.17, 0.05]]), 16, 6, () => 0.025));
      gs.push(varTube(curve([[s * 0.93, 1.18, -0.03], [s * 1.02, 0.68, -0.01], [s * 1.1, 0.17, 0.02]]), 16, 6, () => 0.022));
      gs.push(new THREE.BoxGeometry(0.12, 0.28, 0.04).translate(s * 1.18, -0.08, 0.07));
      gs.push(varTube(curve([[s * 0.36, 0.08, 0.0], [s * 0.36, -0.75, 0.04], [s * 0.36, -1.55, 0.02]]), 20, 8, () => 0.055));
      gs.push(new THREE.SphereGeometry(0.06, 12, 8).translate(s * 0.36, -1.62, 0.1));
      gs.push(varTube(curve([[s * 0.36, -1.7, 0.02], [s * 0.37, -2.5, 0.0], [s * 0.38, -3.3, -0.04]]), 20, 8, () => 0.04));
      gs.push(varTube(curve([[s * 0.43, -1.72, -0.03], [s * 0.44, -2.5, -0.05], [s * 0.44, -3.3, -0.06]]), 20, 5, () => 0.02));
      gs.push(new THREE.BoxGeometry(0.14, 0.06, 0.34).translate(s * 0.4, -3.5, 0.06));
    }
    return merge(gs);
  }, []);
  return <><mesh geometry={parts} material={m} /><Anchor id="skull" position={[0.2, 3.35, 0.2]} /><Anchor id="spine" position={[0, 1.2, -0.22]} /><Anchor id="ribs" position={[0.55, 1.75, 0.15]} /><Anchor id="pelvis" position={[0.4, 0.3, 0.15]} /><Anchor id="femur" position={[0.36, -0.75, 0.1]} /><Anchor id="humerus" position={[0.88, 1.75, 0.05]} /></>;
}

const ORG: { id: string; color: string; geo: () => THREE.BufferGeometry; at: Vec; sys: Sys[] }[] = [
  { id: 'brain', color: '#e2b3a4', geo: () => blob(0.3, [1, 0.82, 1.2], 0.12, 3, 2, 4).translate(0, 3.23, 0), at: [0.25, 3.35, 0.25], sys: ['organs', 'nerves'] },
  { id: 'thyroid', color: '#f2a23a', geo: () => merge([new THREE.SphereGeometry(0.05, 12, 8).scale(1, 1.6, 0.8).translate(-0.05, 2.42, 0.12), new THREE.SphereGeometry(0.05, 12, 8).scale(1, 1.6, 0.8).translate(0.05, 2.42, 0.12)]), at: [0.1, 2.45, 0.18], sys: ['glands'] },
  { id: 'lungs', color: '#f2a3ae', geo: () => merge([blob(0.3, [0.9, 1.8, 0.95], 0.05, 1.5, 1, 4).translate(-0.33, 1.75, 0), blob(0.3, [0.85, 1.75, 0.95], 0.05, 1.5, 2, 4).translate(0.36, 1.72, 0)]), at: [-0.5, 1.95, 0.2], sys: ['organs', 'respiratory'] },
  { id: 'heart', color: '#b8443f', geo: () => blob(0.17, [1, 1.2, 0.9], 0.06, 2, 3, 4).rotateZ(0.5).translate(0.08, 1.52, 0.24), at: [0.15, 1.52, 0.42], sys: ['organs', 'circulation'] },
  { id: 'liver', color: '#8a3a2a', geo: () => blob(0.3, [1.5, 0.75, 0.9], 0.05, 1.5, 4, 4).translate(-0.18, 1.08, 0.05), at: [-0.35, 1.12, 0.3], sys: ['organs', 'digestive'] },
  { id: 'stomach', color: '#e8a07a', geo: () => varTube(curve([[0.12, 1.32, 0.0], [0.32, 1.15, 0.08], [0.33, 0.9, 0.12], [0.12, 0.82, 0.12], [-0.05, 0.9, 0.08]]), 40, 14, (t) => 0.06 + 0.1 * Math.sin(t * Math.PI)), at: [0.35, 1.0, 0.25], sys: ['organs', 'digestive'] },
  { id: 'spleen', color: '#7a3a6a', geo: () => blob(0.1, [0.8, 1.3, 0.6], 0.05, 2, 5, 3).translate(0.5, 1.02, -0.15), at: [0.58, 1.05, -0.05], sys: ['organs', 'lymph'] },
  { id: 'pancreas', color: '#f2c97a', geo: () => varTube(curve([[-0.1, 0.82, -0.05], [0.15, 0.86, -0.08], [0.38, 0.92, -0.1]]), 20, 8, (t) => 0.06 - t * 0.03), at: [0.05, 0.85, 0.05], sys: ['organs', 'digestive', 'glands'] },
  { id: 'kidneys', color: '#9a3a2a', geo: () => merge([-1, 1].map((s) => blob(0.1, [0.8, 1.4, 0.6], 0.05, 2, 6, 3).translate(s * 0.27, 0.78 - (s < 0 ? 0.04 : 0), -0.2))), at: [0.32, 0.8, -0.05], sys: ['organs', 'urinary'] },
  { id: 'adrenals', color: '#f2c94c', geo: () => merge([-1, 1].map((s) => new THREE.ConeGeometry(0.05, 0.08, 10).translate(s * 0.26, 0.97, -0.2))), at: [-0.26, 1.0, -0.1], sys: ['glands'] },
  { id: 'intestine', color: '#e8a4a0', geo: () => { const pts: THREE.Vector3[] = []; for (let i = 0; i < 160; i++) { const a = i * 0.55, r = 0.08 + 0.18 * ((i % 40) / 40); pts.push(V(Math.cos(a) * r * 1.4, 0.55 - i * 0.0028 + Math.sin(a * 0.5) * 0.04, 0.12 + Math.sin(a) * r * 0.5)); } return varTube(new THREE.CatmullRomCurve3(pts), 600, 6, () => 0.035); }, at: [0.1, 0.42, 0.3], sys: ['organs', 'digestive'] },
  { id: 'colon', color: '#d98a6a', geo: () => varTube(curve([[-0.38, 0.12, 0.08], [-0.42, 0.65, 0.05], [-0.1, 0.72, 0.12], [0.3, 0.72, 0.12], [0.42, 0.6, 0.05], [0.4, 0.15, 0.06], [0.15, 0.0, 0.05], [0.0, -0.05, -0.05]]), 120, 10, () => 0.065), at: [-0.45, 0.4, 0.2], sys: ['organs', 'digestive'] },
  { id: 'bladder', color: '#f2d48a', geo: () => blob(0.11, [1.1, 0.9, 1], 0.04, 2, 7, 3).translate(0, -0.02, 0.12), at: [0.1, 0.0, 0.25], sys: ['organs', 'urinary'] },
  { id: 'esophagus', color: '#e8a4a0', geo: () => varTube(curve([[0, 2.6, 0.02], [0.0, 2.0, -0.08], [0.06, 1.4, -0.05], [0.12, 1.3, 0.0]]), 40, 8, () => 0.035), at: [0.06, 2.1, 0.0], sys: ['digestive'] },
  { id: 'trachea', color: '#e9d9cf', geo: () => varTube(curve([[0, 2.75, 0.08], [0, 2.3, 0.08], [0, 2.05, 0.04]]), 20, 10, () => 0.045), at: [0.05, 2.5, 0.15], sys: ['respiratory'] },
  { id: 'ureters', color: '#f2d48a', geo: () => merge([-1, 1].map((s) => varTube(curve([[s * 0.24, 0.7, -0.18], [s * 0.2, 0.35, -0.1], [s * 0.08, 0.02, 0.08]]), 20, 6, () => 0.015))), at: [0.22, 0.4, -0.05], sys: ['urinary'] },
  { id: 'pituitary', color: '#f2a23a', geo: () => new THREE.SphereGeometry(0.035, 10, 8).translate(0, 3.05, 0.08), at: [0.05, 3.05, 0.15], sys: ['glands'] },
  { id: 'thymus', color: '#9fd6a0', geo: () => blob(0.08, [1, 1.3, 0.6], 0.05, 2, 8, 3).translate(0, 2.05, 0.18), at: [0.0, 2.1, 0.28], sys: ['lymph', 'glands'] },
  { id: 'gonads', color: '#f2a23a', geo: () => merge([-1, 1].map((s) => new THREE.SphereGeometry(0.045, 12, 8).scale(1, 1.4, 1).translate(s * 0.18, 0.05, 0.02))), at: [0.2, 0.05, 0.1], sys: ['glands'] },
];
function Organ({ o }: { o: (typeof ORG)[number] }) {
  const g = useMemo(() => o.geo(), [o]);
  const m = useHi([o.id, 'organs'], o.color, { rough: 0.45, clear: 0.5, sheen: 0.6 });
  return <><mesh geometry={g} material={m} /><Anchor id={o.id} position={o.at} /></>;
}

function Circulation({ pulse }: { pulse?: boolean }) {
  const A: Vec[][] = [[[0.1, 1.6, 0.1], [0.05, 1.9, 0.05], [0.12, 2.05, -0.05], [0.05, 1.85, -0.18], [0.03, 1.2, -0.15], [0.0, 0.35, -0.12], [0.0, 0.25, -0.1]], [[0.05, 1.98, -0.02], [-0.05, 2.4, 0.05], [-0.08, 2.9, 0.1]], [[0.1, 2.0, -0.05], [0.08, 2.4, 0.05], [0.09, 2.9, 0.1]]];
  for (const s of [-1, 1]) { A.push([[s * 0.1, 2.0, -0.05], [s * 0.5, 2.3, 0.0], [s * 0.78, 2.25, 0.0], [s * 0.93, 1.3, 0.04], [s * 1.08, 0.6, 0.08], [s * 1.18, 0.0, 0.1]]); A.push([[0, 0.25, -0.1], [s * 0.2, 0.05, 0.0], [s * 0.33, -0.4, 0.08], [s * 0.35, -1.6, 0.08], [s * 0.38, -2.6, 0.02], [s * 0.4, -3.4, 0.05]]); }
  const Vn = A.map((pts) => pts.map(([x, y, z]) => [x * 1.08 - 0.03, y, z + 0.05] as Vec));
  const ag = useMemo(() => merge(A.map((pts, i) => varTube(curve(pts), 60, 8, (t) => (i === 0 ? 0.06 : 0.035) * (1 - t * 0.5)))), []);
  const vg = useMemo(() => merge(Vn.map((pts, i) => varTube(curve(pts), 60, 8, (t) => (i === 0 ? 0.065 : 0.035) * (1 - t * 0.45)))), []);
  const am = useHi(['arteries', 'aorta', 'circulation'], PAL.artery, { rough: 0.35, clear: 0.6, emissive: PAL.artery, ei: 0 });
  const vm = useHi(['veins', 'circulation'], PAL.vein, { rough: 0.35, clear: 0.6 });
  useFrame(({ clock }) => { if (pulse) am.emissiveIntensity = 0.4 * Math.max(0, Math.sin(clock.elapsedTime * 7.5)) ** 4; });
  return <><mesh geometry={ag} material={am} /><mesh geometry={vg} material={vm} /><Anchor id="aorta" position={[0.12, 2.12, 0.0]} /><Anchor id="arteries" position={[0.35, -1.0, 0.14]} /><Anchor id="veins" position={[-0.38, -1.4, 0.2]} /></>;
}
function Nerves() {
  const m = useHi(['nerves', 'cord', 'sciatic'], PAL.nerve, { rough: 0.4, emissive: PAL.nerve, ei: 0.15 });
  const g = useMemo(() => { const gs: THREE.BufferGeometry[] = [varTube(curve([[0, 2.95, -0.1], [0, 2.3, -0.22], [0, 1.2, -0.25], [0, 0.55, -0.22]]), 60, 8, () => 0.03)]; for (const s of [-1, 1]) { gs.push(varTube(curve([[0, 2.35, -0.2], [s * 0.5, 2.25, -0.05], [s * 0.85, 1.6, 0.0], [s * 1.05, 0.7, 0.05], [s * 1.18, 0.0, 0.08]]), 50, 6, () => 0.018)); gs.push(varTube(curve([[0, 0.55, -0.2], [s * 0.2, 0.1, -0.15], [s * 0.36, -0.6, -0.08], [s * 0.37, -1.6, -0.06], [s * 0.4, -3.3, -0.05]]), 60, 6, () => 0.025)); for (let i = 0; i < 10; i++) { const y = 2.2 - i * 0.16; gs.push(varTube(curve([[0, y, -0.24], [s * 0.25, y - 0.05, -0.1], [s * (0.4 + Math.sin(i) * 0.05), y - 0.12, 0.15]]), 10, 4, () => 0.008)); } } return merge(gs); }, []);
  return <><mesh geometry={g} material={m} /><Anchor id="cord" position={[0, 1.5, -0.3]} /><Anchor id="sciatic" position={[0.37, -1.0, -0.05]} /><Anchor id="nerves" position={[0.95, 1.2, 0.05]} /></>;
}
function Lymph() {
  const m = useHi(['nodes', 'lymph'], '#7fd08a', { rough: 0.45, emissive: '#7fd08a', ei: 0.15 });
  const vm = useHi(['lymph', 'duct'], '#cfe8c0', { rough: 0.45, opacity: 0.8 });
  const nodes = useMemo(() => { const out: Vec[] = []; for (const s of [-1, 1]) { for (let i = 0; i < 4; i++) out.push([s * (0.12 + i * 0.03), 2.75 - i * 0.08, 0.06]); for (let i = 0; i < 4; i++) out.push([s * (0.68 + (i % 2) * 0.05), 2.05 - i * 0.06, 0.02]); for (let i = 0; i < 4; i++) out.push([s * (0.25 + (i % 2) * 0.06), 0.15 - i * 0.05, 0.15]); } for (let i = 0; i < 6; i++) out.push([Math.cos(i) * 0.15, 0.6 + Math.sin(i * 2) * 0.1, 0.02]); return out; }, []);
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => { const im = ref.current; if (!im) return; const M = new THREE.Matrix4(); nodes.forEach((p, i) => { M.makeTranslation(...p); im.setMatrixAt(i, M); }); im.instanceMatrix.needsUpdate = true; im.computeBoundingSphere(); }, [nodes]);
  const duct = useMemo(() => merge([varTube(curve([[0.0, 0.6, -0.1], [0.02, 1.3, -0.16], [0.05, 2.0, -0.1], [0.12, 2.25, 0.0]]), 40, 6, () => 0.015), ...[-1, 1].map((s) => varTube(curve([[s * 0.36, -2.8, 0.06], [s * 0.34, -1.2, 0.08], [s * 0.25, 0.1, 0.12], [0, 0.6, -0.1]]), 40, 5, () => 0.012))]), []);
  return <><instancedMesh ref={ref} args={[new THREE.SphereGeometry(0.04, 10, 8), m, nodes.length]} /><mesh geometry={duct} material={vm} /><Anchor id="nodes" position={[0.72, 2.0, 0.1]} /><Anchor id="duct" position={[0.03, 1.4, -0.1]} /></>;
}
function Muscles() {
  const m = useHi('muscles', '#b8443f', { rough: 0.5, sheen: 0.8, opacity: 0.55 });
  const g = useMemo(() => merge([...[-1, 1].flatMap((s) => [blob(0.3, [1.1, 0.7, 0.4], 0.05, 2, 1, 3).translate(s * 0.3, 2.0, 0.22), blob(0.22, [0.8, 1.2, 0.8], 0.05, 2, 2, 3).translate(s * 0.82, 2.2, 0.02), blob(0.13, [0.9, 2.6, 0.9], 0.05, 2, 3, 3).translate(s * 0.88, 1.75, 0.06), blob(0.2, [1, 3.5, 1], 0.05, 2, 4, 3).translate(s * 0.36, -0.7, 0.08), blob(0.13, [1, 3.2, 1], 0.05, 2, 5, 3).translate(s * 0.38, -2.3, -0.08)]), blob(0.25, [1.2, 2.4, 0.3], 0.05, 2, 6, 3).translate(0, 0.75, 0.25)]), []);
  return <><mesh geometry={g} material={m} /><Anchor id="muscles" position={[0.4, -0.6, 0.3]} /><Anchor id="pectoral" position={[0.3, 2.05, 0.4]} /><Anchor id="quadriceps" position={[-0.38, -0.7, 0.3]} /></>;
}

export default function Body({ p }: { p: BodyP }) {
  const show = new Set<Sys>(p.show ?? ['all']); const all = show.has('all');
  const fig = useMemo(() => cached('figure', () => mesh(figure, [-1.5, -3.75, -0.6], [1.5, 3.7, 0.6], 0.045)).geo, []);
  const skin = useHi(['skin', 'body'], '#9fc4e8', { rough: 0.3, clear: 0.6, opacity: show.has('skin') ? 0.75 : 0.13, side: THREE.FrontSide });
  const organs = ORG.filter((o) => all || o.sys.some((s) => show.has(s)));
  return (
    <group>
      <mesh geometry={fig} material={skin} renderOrder={5} />
      {(all || show.has('skeleton')) && <Skeleton />}
      {organs.map((o) => <Organ key={o.id} o={o} />)}
      {(all || show.has('circulation')) && <Circulation pulse={p.pulse} />}
      {(all || show.has('nerves')) && <Nerves />}
      {(all || show.has('lymph')) && <Lymph />}
      {show.has('muscles') && <Muscles />}
      <Anchor id="skin" position={[-0.55, 2.4, 0.3]} />
    </group>
  );
}
