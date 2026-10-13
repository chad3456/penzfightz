/**
 * Organs of digestion and filtration. The whole digestive tract with a
 * meal travelling through it; the stomach opened to show its folds; the
 * gut wall with its villi; the liver and one of its hexagonal lobules; an
 * islet in the pancreas; a colon growing a polyp; the kidney cut open; a
 * nephron with its loop; the glomerulus filtering; the bladder; a tooth.
 */
import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Anchor, useCtl, useHi, useScene } from '../stage';
import { ellipsoid, mesh, smax, smin, sphere, tube, cached, type SDF, type Vec } from '../sdf';
import { V, rng, curve, varTube, blob, merge, fbm, noise3, TAU, PAL, smooth, fibSphere, displace } from '../kit';

export interface OrganP {
  mode: 'gut' | 'stomach' | 'villi' | 'liver' | 'lobule' | 'islet' | 'colon' | 'kidney' | 'nephron' | 'glomerulus' | 'bladder' | 'tooth' | 'gallbladder' | 'esophagus';
  ulcer?: boolean; hpylori?: boolean; celiac?: boolean; cirrhosis?: boolean; fatty?: boolean; stone?: boolean; cavity?: boolean; polyp?: boolean; reflux?: boolean; diabetic?: boolean; ibd?: boolean;
}
const clipZ = new THREE.Plane(V(0, 0, -1), 0);
function useClip() { const { gl } = useThree(); gl.localClippingEnabled = true; return clipZ; }

/* ───────── the digestive tract ───────── */
const GUT: Vec[] = [[0, 3.3, 0.3], [0, 2.6, 0.0], [0, 1.6, -0.1], [0.15, 1.05, 0.0], [0.6, 0.95, 0.2], [0.7, 0.55, 0.3], [0.35, 0.3, 0.3], [0.0, 0.45, 0.25], [-0.25, 0.2, 0.3], [0.1, 0.0, 0.35], [0.4, -0.1, 0.3], [0.0, -0.3, 0.35], [-0.4, -0.25, 0.3], [-0.2, -0.55, 0.32], [0.2, -0.6, 0.3], [-0.55, -0.75, 0.25], [-0.75, -0.4, 0.15], [-0.78, 0.4, 0.1], [-0.4, 0.62, 0.15], [0.4, 0.62, 0.15], [0.78, 0.4, 0.1], [0.8, -0.5, 0.1], [0.35, -0.95, 0.05], [0.0, -1.2, -0.05], [0.0, -1.55, -0.05]];
const SEG: [string, number, number, string][] = [['mouth', 0, 0.06, '#e88a8a'], ['esophagus', 0.06, 0.13, '#e8a4a0'], ['stomach', 0.13, 0.25, '#e8a07a'], ['small', 0.25, 0.65, '#f0b8a0'], ['large', 0.65, 0.95, '#d98a6a'], ['rectum', 0.95, 1.0, '#c97a5a']];
function Gut() {
  const S = useScene();
  const c = useMemo(() => curve(GUT, 0.4), []);
  const pieces = useMemo(() => SEG.map(([id, a, b, col]) => ({ id, col, g: varTube(new THREE.CatmullRomCurve3(Array.from({ length: 30 }, (_, i) => c.getPointAt(a + ((b - a) * i) / 29))), 120, 12, (t) => { return id === 'stomach' ? 0.08 + 0.2 * Math.sin(t * Math.PI) : id === 'large' || id === 'rectum' ? 0.13 : id === 'mouth' ? 0.12 : 0.07; }), at: c.getPointAt((a + b) / 2) })), [c]);
  const bolus = useRef<THREE.Mesh>(null);
  const liverM = useHi('liver', '#8a3a2a', { rough: 0.45, clear: 0.5 }), pancM = useHi('pancreas', '#f2c97a', { rough: 0.5 }), gbM = useHi('gallbladder', '#7fb04a', { rough: 0.4, clear: 0.5 });
  useFrame(() => { const st = S.st.current, k = Math.min(0.995, Math.max(0, st / Math.max(1, S.stages - 1))); bolus.current?.position.copy(c.getPointAt(k)); });
  return (
    <group position={[0, -0.8, 0]}>
      {pieces.map((p) => <Piece key={p.id} id={p.id} g={p.g} col={p.col} />)}
      <mesh material={liverM} position={[-0.6, 1.25, -0.15]} geometry={useMemo(() => blob(0.45, [1.5, 0.7, 0.9], 0.04, 1.5, 4, 4), [])} />
      <mesh material={gbM} position={[-0.25, 0.82, 0.35]} scale={[0.6, 1, 0.6]}><sphereGeometry args={[0.11, 16, 12]} /></mesh>
      <mesh material={pancM} geometry={useMemo(() => varTube(curve([[-0.05, 0.75, -0.1], [0.3, 0.8, -0.12], [0.6, 0.85, -0.12]]), 20, 8, (t) => 0.08 - t * 0.04), [])} />
      <mesh ref={bolus}><sphereGeometry args={[0.1, 16, 12]} /><meshStandardMaterial color="#a8763a" emissive="#ffb050" emissiveIntensity={0.35} roughness={0.6} /></mesh>
      {pieces.map((p) => <Anchor key={p.id} id={p.id} position={p.at.clone().add(V(0.2, 0, 0.2)).toArray() as Vec} />)}
      <Anchor id="liver" position={[-0.6, 1.25, 0.4]} /><Anchor id="pancreas" position={[0.45, 0.85, 0.0]} /><Anchor id="gallbladder" position={[-0.25, 0.8, 0.5]} />
    </group>
  );
}
function Piece({ id, g, col }: { id: string; g: THREE.BufferGeometry; col: string }) { const m = useHi(id, col, { rough: 0.45, clear: 0.4, sheen: 0.6 }); return <mesh geometry={g} material={m} />; }

/* ───────── stomach ───────── */
const ST_C = tube([[-0.2, 1.6, 0], [-0.1, 1.15, 0], [0.25, 0.9, 0], [0.7, 0.55, 0], [0.75, 0.0, 0], [0.4, -0.5, 0], [-0.2, -0.55, 0], [-0.6, -0.35, 0], [-0.85, -0.2, 0]], (t) => 0.13 + 0.62 * Math.sin(Math.min(1, t * 1.15) * Math.PI) ** 0.8 * (t < 0.12 ? t / 0.12 : 1), 40);
function Stomach({ p }: { p: OrganP }) {
  const plane = useClip();
  const M = useMemo(() => cached('stomach', () => mesh((x, y, z) => { const d = ST_C(x, y, z); const shell = Math.max(d, -(d + 0.09)); return shell + (d > -0.12 && d < -0.04 ? 0.03 * Math.max(0, noise3(x * 6, y * 2.5, z * 6)) : 0); }, [-1.2, -1.4, -0.95], [1.6, 1.85, 0.95], 0.03, (x, y, z) => { const d = ST_C(x, y, z); return d < -0.05 ? 'rugae' : y > 1.0 ? 'esophagus' : x < -0.4 && y < 0 ? 'pylorus' : y > 0.45 && x > 0.2 ? 'fundus' : 'body'; })), []);
  const ph = useCtl('ph', 2);
  const mats = { body: useHi(['body', 'muscle'], '#e8a07a', { rough: 0.45, sheen: 0.6, side: THREE.DoubleSide }), fundus: useHi('fundus', '#e8a07a', { rough: 0.45, sheen: 0.6, side: THREE.DoubleSide }), esophagus: useHi('esophagus', '#e8b0a0', { rough: 0.45, side: THREE.DoubleSide }), pylorus: useHi(['pylorus', 'sphincter'], '#d98a6a', { rough: 0.45, side: THREE.DoubleSide }), rugae: useHi(['rugae', 'lining'], '#f28a8a', { rough: 0.55, sheen: 0.8, side: THREE.DoubleSide }) } as Record<string, THREE.MeshPhysicalMaterial>;
  useMemo(() => { for (const m of Object.values(mats)) m.clippingPlanes = [plane]; }, [plane, mats]);
  const acid = useHi('acid', '#d8f07a', { rough: 0.1, opacity: 0.55, emissive: '#c8f05a', ei: 0.1 + (6 - ph) * 0.05 });
  const ulcM = useHi('ulcer', '#7a1a1a', { rough: 0.8 });
  const bugM = useHi('hpylori', '#9ad04f', { rough: 0.4 });
  const bugs = useMemo(() => Array.from({ length: 12 }, (_, i) => V(0.5 + Math.cos(i) * 0.25, -0.15 + Math.sin(i * 1.7) * 0.25, -0.62 + (i % 3) * 0.05)), []);
  return (
    <group>
      {[...M.groups].map(([n, g]) => <mesh key={n} geometry={g} material={mats[n]} />)}
      <mesh material={acid} position={[0.25, -0.2, -0.05]} scale={[0.9, 0.45, 0.62]}><sphereGeometry args={[0.65, 32, 20, 0, TAU, Math.PI * 0.45, Math.PI * 0.55]} /></mesh>
      {p.ulcer && <mesh material={ulcM} position={[-0.45, -0.38, -0.55]} scale={[1, 1, 0.4]}><sphereGeometry args={[0.1, 16, 12]} /></mesh>}
      {p.hpylori && bugs.map((b, i) => <mesh key={i} material={bugM} position={b} rotation={[i, i * 2, 0]}><capsuleGeometry args={[0.018, 0.08, 4, 6]} /></mesh>)}
      <Anchor id="esophagus" position={[-0.05, 1.45, 0.2]} /><Anchor id="fundus" position={[0.65, 0.75, 0.2]} /><Anchor id="body" position={[0.95, 0.1, 0.25]} /><Anchor id="pylorus" position={[-0.7, -0.3, 0.2]} />
      <Anchor id="rugae" position={[0.35, 0.3, -0.45]} inner /><Anchor id="acid" position={[0.2, -0.3, 0.0]} inner />
      {p.ulcer && <Anchor id="ulcer" position={[-0.45, -0.38, -0.45]} inner />}{p.hpylori && <Anchor id="hpylori" position={[0.5, -0.1, -0.45]} inner />}
    </group>
  );
}

/* ───────── villi ───────── */
function Villi({ p }: { p: OrganP }) {
  const flat = p.celiac ? 0.25 : 1;
  const spots = useMemo(() => { const out: THREE.Vector3[] = []; for (let i = -5; i <= 5; i++) for (let j = -3; j <= 3; j++) out.push(V(i * 0.42 + (j % 2) * 0.21, 0, j * 0.42)); return out; }, []);
  const vM = useHi(['villus', 'epithelium'], '#f0a8a0', { rough: 0.45, sheen: 0.8, opacity: 0.7 });
  const wM = useHi(['wall', 'muscle'], '#c9605a', { rough: 0.5, sheen: 0.6 });
  const smM = useHi('submucosa', '#f2d0c0', { rough: 0.6 });
  const aM = useHi('capillary', PAL.artery, { rough: 0.4 }), vnM = useHi('capillary', PAL.vein, { rough: 0.4 }), lM = useHi('lacteal', '#f8f4e0', { rough: 0.3, emissive: '#fff8d0', ei: 0.2 });
  const ref = useRef<THREE.InstancedMesh>(null);
  const villus = useMemo(() => displace(new THREE.CapsuleGeometry(0.15, 0.9, 8, 18).translate(0, 0.6, 0), (q) => 0.012 * Math.sin(q.y * 30)), []);
  useLayoutEffect(() => { const im = ref.current; if (!im) return; const M = new THREE.Matrix4(); spots.forEach((s, i) => { M.compose(s, new THREE.Quaternion(), V(1, flat, 1)); im.setMatrixAt(i, M); }); im.instanceMatrix.needsUpdate = true; im.computeBoundingSphere(); }, [spots, flat]);
  const cut = spots[38];
  const loop = useMemo(() => ({ a: varTube(curve([[-0.07, 0.1, 0], [-0.08, 0.9 * flat, 0], [0, 1.08 * flat, 0]]), 20, 6, () => 0.022), v: varTube(curve([[0, 1.08 * flat, 0], [0.08, 0.9 * flat, 0], [0.07, 0.1, 0]]), 20, 6, () => 0.022), l: varTube(curve([[0, 0.1, 0.02], [0, 0.95 * flat, 0.02]]), 20, 6, () => 0.03) }), [flat]);
  return (
    <group>
      <instancedMesh ref={ref} args={[villus, vM, spots.length]} />
      <mesh material={smM} position={[0, -0.25, 0]}><boxGeometry args={[5, 0.5, 3.2]} /></mesh>
      <mesh material={wM} position={[0, -0.75, 0]}><boxGeometry args={[5, 0.5, 3.2]} /></mesh>
      <group position={cut}><mesh geometry={loop.a} material={aM} /><mesh geometry={loop.v} material={vnM} /><mesh geometry={loop.l} material={lM} /></group>
      <Anchor id="villus" position={spots[24].clone().add(V(0, 1.2 * flat, 0.15)).toArray() as Vec} /><Anchor id="capillary" position={cut.clone().add(V(0.1, 0.6 * flat, 0.1)).toArray() as Vec} />
      <Anchor id="lacteal" position={cut.clone().add(V(0, 0.4 * flat, 0.1)).toArray() as Vec} /><Anchor id="submucosa" position={[2.3, -0.2, 1.6]} /><Anchor id="muscle" position={[2.3, -0.75, 1.6]} />
    </group>
  );
}

/* ───────── liver ───────── */
function Liver({ p }: { p: OrganP }) {
  const f: SDF = useMemo(() => { const a = ellipsoid([-0.35, 0, 0], [1.25, 0.65, 0.75]), b = ellipsoid([0.85, 0.15, 0.05], [0.7, 0.35, 0.5]); return (x, y, z) => { let d = smin(a(x, y, z), b(x, y, z), 0.3); d = smax(d, -(y + 0.3 - 0.25 * x) , 0.2); return d < 0.1 ? d + (p.cirrhosis ? 0.06 * Math.abs(noise3(x * 5, y * 5, z * 5)) : 0.01 * fbm(x * 3, y * 3, z * 3, 2)) : d; }; }, [p.cirrhosis]);
  const M = useMemo(() => cached('liver' + p.cirrhosis, () => mesh(f, [-1.7, -1.0, -0.9], [1.7, 0.9, 0.9], 0.035, (x) => (x < 0.25 ? 'right' : 'left'))), [f, p.cirrhosis]);
  const col = p.fatty ? '#c9a05a' : p.cirrhosis ? '#9a6a3a' : '#8a3a2a';
  const rM = useHi(['right', 'liver'], col, { rough: 0.4, clear: 0.6, sheen: 0.4 }), lM = useHi(['left', 'liver'], col, { rough: 0.4, clear: 0.6, sheen: 0.4 });
  const gb = useHi('gallbladder', '#7fb04a', { rough: 0.35, clear: 0.6 });
  const pv = useHi('portal', '#6f4fb5', { rough: 0.4, clear: 0.5 }), ha = useHi('artery', PAL.artery, { rough: 0.4 }), bd = useHi('duct', '#9ad04f', { rough: 0.4 }), ivc = useHi('ivc', PAL.vein, { rough: 0.4 });
  return (
    <group>
      <mesh geometry={M.groups.get('right')} material={rM} /><mesh geometry={M.groups.get('left')} material={lM} />
      <mesh material={gb} position={[-0.25, -0.62, 0.35]} rotation={[0.4, 0, 0.3]}><capsuleGeometry args={[0.16, 0.3, 8, 16]} /></mesh>
      <mesh material={pv} geometry={useMemo(() => varTube(curve([[0.2, -1.4, 0.1], [0.1, -0.9, 0.05], [0.0, -0.45, 0.0]]), 20, 10, () => 0.09), [])} />
      <mesh material={ha} geometry={useMemo(() => varTube(curve([[0.5, -1.35, 0.25], [0.3, -0.9, 0.2], [0.12, -0.45, 0.12]]), 20, 8, () => 0.04), [])} />
      <mesh material={bd} geometry={useMemo(() => varTube(curve([[-0.1, -0.45, 0.2], [-0.15, -0.9, 0.25], [-0.05, -1.4, 0.3]]), 20, 8, () => 0.035), [])} />
      <mesh material={ivc} geometry={useMemo(() => varTube(curve([[-0.1, 1.0, -0.6], [-0.1, 0.0, -0.65], [-0.1, -1.0, -0.6]]), 20, 12, () => 0.14), [])} />
      {p.fatty && fibSphere(60, 1).map((d, i) => <mesh key={i} position={[d.x * 1.0 - 0.2, d.y * 0.5, 0.78 + d.z * 0.03]}><sphereGeometry args={[0.04 + (i % 3) * 0.015, 10, 8]} /><meshStandardMaterial color="#f8e8a0" roughness={0.3} /></mesh>)}
      <Anchor id="right" position={[-0.9, 0.35, 0.6]} /><Anchor id="left" position={[1.0, 0.3, 0.45]} /><Anchor id="gallbladder" position={[-0.25, -0.75, 0.55]} />
      <Anchor id="portal" position={[0.1, -1.0, 0.2]} /><Anchor id="artery" position={[0.35, -1.0, 0.35]} /><Anchor id="duct" position={[-0.15, -1.0, 0.4]} /><Anchor id="ivc" position={[-0.1, 0.9, -0.45]} />
    </group>
  );
}
function Lobule() {
  const hepM = useHi(['hepatocyte', 'plate'], '#b8604a', { rough: 0.5, sheen: 0.5 });
  const cvM = useHi('central', PAL.vein, { rough: 0.4, clear: 0.5 });
  const pvM = useHi(['triad', 'portal'], '#6f4fb5', { rough: 0.4 }), haM = useHi(['triad', 'artery'], PAL.artery, { rough: 0.4 }), bdM = useHi(['triad', 'duct'], '#9ad04f', { rough: 0.4 });
  const sinM = useHi('sinusoid', '#d14a5a', { rough: 0.4, opacity: 0.6 });
  const plates = useMemo(() => { const gs: THREE.BufferGeometry[] = []; for (let k = 0; k < 24; k++) { const a = (k / 24) * TAU; for (let i = 1; i < 9; i++) { const r = 0.2 + i * 0.2; const b = new THREE.BoxGeometry(0.13, 0.5, 0.13); b.translate(Math.cos(a) * r, 0, Math.sin(a) * r); gs.push(b); } } return merge(gs); }, []);
  const corners = useMemo(() => Array.from({ length: 6 }, (_, i) => V(Math.cos((i / 6) * TAU) * 1.9, 0, Math.sin((i / 6) * TAU) * 1.9)), []);
  const flow = useRef<THREE.InstancedMesh>(null);
  useFrame(({ clock }) => { const im = flow.current; if (!im) return; const M = new THREE.Matrix4(); for (let i = 0; i < im.count; i++) { const a = ((i % 24) / 24) * TAU + 0.13, k = 1 - ((clock.elapsedTime * 0.2 + i * 0.37) % 1); M.makeTranslation(Math.cos(a) * (0.2 + k * 1.7), 0.3, Math.sin(a) * (0.2 + k * 1.7)); im.setMatrixAt(i, M); } im.instanceMatrix.needsUpdate = true; });
  return (
    <group rotation={[0.5, 0, 0]}>
      <mesh geometry={plates} material={hepM} />
      <mesh material={cvM}><cylinderGeometry args={[0.18, 0.18, 0.7, 20]} /></mesh>
      {corners.map((c, i) => <group key={i} position={c}><mesh material={pvM} position={[0.06, 0, 0]}><cylinderGeometry args={[0.09, 0.09, 0.7, 12]} /></mesh><mesh material={haM} position={[-0.08, 0, 0.06]}><cylinderGeometry args={[0.045, 0.045, 0.7, 10]} /></mesh><mesh material={bdM} position={[-0.06, 0, -0.08]}><cylinderGeometry args={[0.04, 0.04, 0.7, 10]} /></mesh></group>)}
      <instancedMesh ref={flow} args={[new THREE.SphereGeometry(0.035, 8, 6), sinM, 72]} frustumCulled={false} />
      <Anchor id="central" position={[0, 0.45, 0]} /><Anchor id="triad" position={corners[0].clone().add(V(0, 0.45, 0)).toArray() as Vec} /><Anchor id="hepatocyte" position={[0.9, 0.35, 0.5]} /><Anchor id="sinusoid" position={[-0.6, 0.35, 0.9]} />
    </group>
  );
}

/* ───────── islet ───────── */
function Islet({ p }: { p: OrganP }) {
  const S = useScene();
  const cells = useMemo(() => { const r = rng(4), out: { p: THREE.Vector3; k: string }[] = []; for (const d of fibSphere(70, 1)) { const rr = r() ** 0.5 * 1.0; const pp = d.clone().multiplyScalar(rr); out.push({ p: pp, k: rr < 0.65 ? 'beta' : r() < 0.6 ? 'alpha' : 'delta' }); } for (let i = 0; i < 40; i++) { const d = fibSphere(40, 1)[i]; out.push({ p: d.clone().multiplyScalar(1.6 + r() * 0.4), k: 'acinar' }); } return out; }, []);
  const col: Record<string, string> = { beta: '#5ac46a', alpha: '#e8584a', delta: '#4f8fe0', acinar: '#f2d0a0' };
  const mats = { beta: useHi('beta', col.beta, { rough: 0.45, sheen: 0.5, opacity: p.diabetic ? 0.35 : 1 }), alpha: useHi('alpha', col.alpha, { rough: 0.45, sheen: 0.5 }), delta: useHi('delta', col.delta, { rough: 0.45 }), acinar: useHi('acinar', col.acinar, { rough: 0.5, opacity: 0.5 }) } as Record<string, THREE.MeshPhysicalMaterial>;
  const ins = useRef<THREE.InstancedMesh>(null);
  useFrame(({ clock }) => { const im = ins.current; if (!im) return; const M = new THREE.Matrix4(), on = smooth(S.st.current - 0.5) * (p.diabetic ? 0.1 : 1); for (let i = 0; i < im.count; i++) { const d = fibSphere(im.count, 1)[i], k = (clock.elapsedTime * 0.3 + i * 0.1) % 1; const pos = d.clone().multiplyScalar(0.5 + k * 1.8); M.makeTranslation(pos.x, pos.y, pos.z); M.scale(V(on, on, on)); im.setMatrixAt(i, M); } im.instanceMatrix.needsUpdate = true; });
  return (
    <group>
      {cells.map((c, i) => <mesh key={i} material={mats[c.k]} position={c.p}><icosahedronGeometry args={[c.k === 'acinar' ? 0.22 : 0.15, 2]} /></mesh>)}
      <instancedMesh ref={ins} args={[new THREE.SphereGeometry(0.03, 8, 6), new THREE.MeshBasicMaterial({ color: '#c8ff9a', toneMapped: false }), 50]} frustumCulled={false} />
      <Anchor id="beta" position={[0.2, 0.3, 0.6]} /><Anchor id="alpha" position={[0.75, -0.3, 0.55]} /><Anchor id="delta" position={[-0.7, 0.4, 0.55]} /><Anchor id="acinar" position={[1.4, 1.0, 0.6]} /><Anchor id="insulin" position={[-0.9, -0.9, 0.8]} />
    </group>
  );
}

/* ───────── colon with a polyp ───────── */
function Colon({ p }: { p: OrganP }) {
  const S = useScene(); const plane = useClip();
  const wall = useHi(['wall', 'colon', 'haustra'], '#e8a090', { rough: 0.5, sheen: 0.7, side: THREE.DoubleSide });
  const g = useMemo(() => { const gg = new THREE.CylinderGeometry(1, 1, 6, 64, 120, true); gg.rotateZ(Math.PI / 2); const pos = gg.attributes.position as THREE.BufferAttribute; for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i); const k = 1 + 0.12 * Math.cos(x * 4.2) ** 2 * (p.ibd ? 0.3 : 1); pos.setXYZ(i, x, y * k, z * k); } gg.computeVertexNormals(); return gg; }, [p.ibd]);
  useMemo(() => { wall.clippingPlanes = [plane]; }, [wall, plane]);
  const pol = useRef<THREE.Group>(null);
  const polM = useHi(['polyp', 'tumor'], '#c4708e', { rough: 0.55 }), canM = useHi('tumor', '#8a2a6a', { rough: 0.6 });
  const bugs = useMemo(() => { const r = rng(3); return Array.from({ length: 160 }, () => V((r() - 0.5) * 5.5, (r() - 0.5) * 1.4, (r() - 0.5) * 1.4)).filter((v) => Math.hypot(v.y, v.z) < 0.85 && v.z < 0); }, []);
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => { const im = ref.current; if (!im) return; const M = new THREE.Matrix4(); bugs.forEach((b, i) => { M.compose(b, new THREE.Quaternion().setFromEuler(new THREE.Euler(i, i * 2, 0)), V(1, 1, 1)); im.setMatrixAt(i, M); }); im.instanceMatrix.needsUpdate = true; im.computeBoundingSphere(); }, [bugs]);
  const bugM = useHi('microbiome', '#9ad04f', { rough: 0.4 });
  const ulc = useHi('inflamed', '#c0303a', { rough: 0.7, opacity: 0.8 });
  useFrame(() => { const st = S.st.current; const g2 = pol.current; if (!g2) return; g2.visible = !!p.polyp; g2.children[0].scale.setScalar(0.3 + smooth(st) * 0.5 + smooth(st - 1) * 0.4); g2.children[1].scale.setScalar(Math.max(0.01, smooth(st - 2) * 1.2)); });
  return (
    <group>
      <mesh geometry={g} material={wall} />
      <instancedMesh ref={ref} args={[new THREE.CapsuleGeometry(0.02, 0.07, 3, 6), bugM, bugs.length]} />
      <group ref={pol} position={[0.2, -0.95, -0.2]}><mesh material={polM}><sphereGeometry args={[0.22, 20, 14]} /></mesh><mesh material={canM} position={[0, 0.1, 0]}><icosahedronGeometry args={[0.2, 2]} /></mesh></group>
      {p.ibd && [-1.6, -0.4, 0.9, 2.0].map((x, i) => <mesh key={i} material={ulc} position={[x, -0.6, -0.75]} scale={[0.35, 0.3, 0.1]}><sphereGeometry args={[1, 16, 12]} /></mesh>)}
      <Anchor id="wall" position={[-2.2, 1.0, 0.0]} /><Anchor id="haustra" position={[1.5, 1.1, -0.2]} /><Anchor id="microbiome" position={[-0.8, 0.2, -0.4]} inner />
      {p.polyp && <Anchor id="polyp" position={[0.2, -0.7, -0.1]} inner />}{p.ibd && <Anchor id="inflamed" position={[0.9, -0.6, -0.6]} inner />}
    </group>
  );
}

/* ───────── kidney ───────── */
const KID = (x: number, y: number, z: number) => { const b = ellipsoid([0, 0, 0], [0.75, 1.2, 0.5])(x, y, z); return smax(b, -sphere([-0.95, 0, 0], 0.48)(x, y, z), 0.2); };
function Kidney({ p }: { p: OrganP }) {
  const M = useMemo(() => cached('kidney', () => mesh((x, y, z) => smax(KID(x, y, z), z, 0), [-1.0, -1.4, -0.7], [1.0, 1.4, 0.2], 0.025, (x, y, z) => {
    if (z < -0.02) return 'capsule';
    const r = KID(x, y, z); const a = Math.atan2(y, x - 0.05);
    if (Math.hypot(x + 0.2, y) < 0.32 && x < 0.05) return 'pelvis';
    if (r > -0.14) return 'cortex';
    const py = Math.cos(a * 7) > 0.2; return py ? 'medulla' : 'cortex';
  })), []);
  const col: Record<string, string> = { capsule: '#a4483a', cortex: '#b85a48', medulla: '#7a2a2a', pelvis: '#f0dcc8' };
  const art = useHi(['artery', 'renal'], PAL.artery, { rough: 0.4, clear: 0.5 }), vein = useHi(['vein', 'renal'], PAL.vein, { rough: 0.4, clear: 0.5 }), ur = useHi('ureter', '#f2e0b0', { rough: 0.4 });
  const stone = useHi('stone', '#e8d070', { rough: 0.8 });
  return (
    <group>
      {[...M.groups].map(([n, g]) => <KPiece key={n} n={n} g={g} col={col[n]} />)}
      <mesh material={art} geometry={useMemo(() => varTube(curve([[-1.8, 0.25, -0.1], [-1.1, 0.18, -0.1], [-0.55, 0.12, -0.05]]), 20, 10, () => 0.09), [])} />
      <mesh material={vein} geometry={useMemo(() => varTube(curve([[-1.8, -0.05, -0.15], [-1.1, -0.02, -0.15], [-0.55, -0.02, -0.08]]), 20, 10, () => 0.11), [])} />
      <mesh material={ur} geometry={useMemo(() => varTube(curve([[-0.45, -0.25, -0.05], [-0.7, -0.8, -0.05], [-0.65, -1.8, -0.05]]), 30, 10, () => 0.07), [])} />
      {p.stone && <mesh material={stone} position={[-0.3, -0.05, 0.03]} geometry={useMemo(() => blob(0.09, [1.2, 0.9, 1], 0.3, 3, 2, 2), [])} />}
      <Anchor id="cortex" position={[0.6, 0.5, 0.1]} /><Anchor id="medulla" position={[0.3, -0.3, 0.1]} /><Anchor id="pelvis" position={[-0.2, 0.05, 0.1]} />
      <Anchor id="capsule" position={[0.5, 1.0, -0.2]} /><Anchor id="artery" position={[-1.3, 0.35, 0.0]} /><Anchor id="vein" position={[-1.3, -0.15, 0.0]} /><Anchor id="ureter" position={[-0.7, -1.2, 0.05]} />
      {p.stone && <Anchor id="stone" position={[-0.3, -0.05, 0.15]} />}
    </group>
  );
}
function KPiece({ n, g, col }: { n: string; g: THREE.BufferGeometry; col: string }) { const m = useHi([n, 'kidney'], col, { rough: 0.5, clear: 0.3, sheen: 0.5, side: THREE.DoubleSide }); return <mesh geometry={g} material={m} />; }

/* ───────── nephron ───────── */
function Nephron() {
  const parts = useMemo(() => ({
    pct: curve([[0.35, 2.0, 0], [0.8, 2.3, 0.2], [1.1, 1.9, -0.2], [0.8, 1.6, 0.2], [1.2, 1.35, 0], [1.0, 1.0, 0.1]]),
    loopD: curve([[1.0, 1.0, 0.1], [1.0, 0.0, 0.1], [1.0, -1.4, 0.1], [1.15, -1.75, 0.1]]),
    loopA: curve([[1.15, -1.75, 0.1], [1.3, -1.4, 0.1], [1.3, 0.0, 0.1], [1.35, 1.1, 0.1]]),
    dct: curve([[1.35, 1.1, 0.1], [1.7, 1.5, -0.1], [1.9, 1.9, 0.2], [2.2, 1.6, 0], [2.45, 1.8, 0]]),
    cd: curve([[2.45, 1.8, 0], [2.5, 0.0, 0], [2.55, -2.2, 0]]),
  }), []);
  const cols: Record<string, string> = { pct: '#f2c94c', loopD: '#5ac8ff', loopA: '#4f8fe0', dct: '#9ad04f', cd: '#c98bd9' };
  const ids: Record<string, string> = { pct: 'proximal', loopD: 'loop', loopA: 'loop', dct: 'distal', cd: 'collecting' };
  const cap = useHi(['bowman', 'capsule'], '#f2e0c0', { rough: 0.4, opacity: 0.55, side: THREE.DoubleSide });
  const glo = useHi(['glomerulus'], PAL.artery, { rough: 0.4, clear: 0.5 });
  const tuft = useMemo(() => { const pts: THREE.Vector3[] = []; for (let i = 0; i < 120; i++) { const a = i * 0.7, b = i * 0.23; pts.push(V(Math.cos(a) * Math.sin(b) * 0.28, Math.cos(b) * 0.28, Math.sin(a) * Math.sin(b) * 0.28)); } return varTube(new THREE.CatmullRomCurve3(pts), 500, 6, () => 0.035); }, []);
  const flow = useRef<THREE.InstancedMesh>(null);
  const all = useMemo(() => { const c = [parts.pct, parts.loopD, parts.loopA, parts.dct, parts.cd]; return c; }, [parts]);
  useFrame(({ clock }) => { const im = flow.current; if (!im) return; const M = new THREE.Matrix4(); for (let i = 0; i < im.count; i++) { const tot = ((clock.elapsedTime * 0.12 + i / im.count) % 1) * 5, k = Math.floor(tot), f = tot - k; M.makeTranslation(...all[Math.min(4, k)].getPointAt(f).toArray()); im.setMatrixAt(i, M); } im.instanceMatrix.needsUpdate = true; });
  const cortexM = useHi('cortex', '#b85a48', { rough: 0.6, opacity: 0.12 });
  return (
    <group position={[-1.2, 0, 0]}>
      <mesh material={cortexM} position={[1.3, 1.5, 0]}><boxGeometry args={[3.6, 1.6, 1.2]} /></mesh>
      <mesh material={cap} position={[0.1, 2.0, 0]}><sphereGeometry args={[0.42, 32, 24, 0, TAU, 0, Math.PI * 0.85]} /></mesh>
      <mesh geometry={tuft} material={glo} position={[0.1, 2.0, 0]} />
      {Object.entries(parts).map(([k, c]) => <NTube key={k} id={ids[k]} c={c} col={cols[k]} />)}
      <instancedMesh ref={flow} args={[new THREE.SphereGeometry(0.035, 8, 6), new THREE.MeshBasicMaterial({ color: '#fff3a0', toneMapped: false }), 40]} frustumCulled={false} />
      <Anchor id="glomerulus" position={[0.1, 2.0, 0.35]} /><Anchor id="bowman" position={[-0.25, 2.25, 0.25]} /><Anchor id="proximal" position={[1.1, 1.9, 0.0]} />
      <Anchor id="loop" position={[1.15, -1.75, 0.25]} /><Anchor id="distal" position={[1.9, 1.9, 0.35]} /><Anchor id="collecting" position={[2.5, 0.0, 0.2]} /><Anchor id="cortex" position={[-0.3, 1.0, 0.6]} />
    </group>
  );
}
function NTube({ id, c, col }: { id: string; c: THREE.Curve<THREE.Vector3>; col: string }) { const m = useHi(id, col, { rough: 0.4, clear: 0.5 }); const g = useMemo(() => varTube(c, 80, 10, () => 0.08), [c]); return <mesh geometry={g} material={m} />; }

function Glomerulus({ p }: { p: OrganP }) {
  const tuft = useMemo(() => { const gs: THREE.BufferGeometry[] = []; for (let k = 0; k < 6; k++) { const pts: THREE.Vector3[] = []; for (let i = 0; i < 40; i++) { const a = i * 0.8 + k, b = 0.3 + (i / 40) * 2.5; pts.push(V(Math.cos(a) * Math.sin(b) * 0.8, Math.cos(b) * 0.8, Math.sin(a) * Math.sin(b) * 0.8)); } gs.push(varTube(new THREE.CatmullRomCurve3(pts), 160, 8, () => 0.09)); } return merge(gs); }, []);
  const cap = useHi(['bowman', 'capsule'], '#f2e0c0', { rough: 0.4, opacity: 0.45, side: THREE.DoubleSide });
  const glo = useHi(['glomerulus', 'capillary'], PAL.artery, { rough: 0.4, clear: 0.5 });
  const aff = useHi('afferent', PAL.artery, { rough: 0.4 }), eff = useHi('efferent', '#a03a4a', { rough: 0.4 });
  const tub = useHi('tubule', '#f2c94c', { rough: 0.4 });
  const fil = useRef<THREE.InstancedMesh>(null);
  useFrame(({ clock }) => { const im = fil.current; if (!im) return; const M = new THREE.Matrix4(); for (let i = 0; i < im.count; i++) { const d = fibSphere(im.count, 1)[i], k = (clock.elapsedTime * 0.25 + i * 0.07) % 1; const pos = k < 0.6 ? d.clone().multiplyScalar(0.85 + k * 0.6) : V(0.3 + (k - 0.6) * 2.5, -1.3 - (k - 0.6) * 0.5, 0); M.makeTranslation(pos.x, pos.y, pos.z); im.setMatrixAt(i, M); } im.instanceMatrix.needsUpdate = true; });
  return (
    <group>
      <mesh material={cap}><sphereGeometry args={[1.25, 40, 30, 0, TAU, 0, Math.PI * 0.82]} /></mesh>
      <mesh geometry={tuft} material={glo} />
      <mesh material={aff} geometry={useMemo(() => varTube(curve([[-1.6, 2.2, 0], [-0.6, 1.3, 0], [-0.2, 0.7, 0]]), 20, 10, () => 0.14), [])} />
      <mesh material={eff} geometry={useMemo(() => varTube(curve([[0.2, 0.7, 0], [0.6, 1.3, 0], [1.4, 2.2, 0]]), 20, 10, () => 0.1), [])} />
      <mesh material={tub} geometry={useMemo(() => varTube(curve([[0.3, -1.2, 0], [1.0, -1.5, 0], [1.9, -1.4, 0]]), 20, 10, () => 0.16), [])} />
      <instancedMesh ref={fil} args={[new THREE.SphereGeometry(0.04, 8, 6), new THREE.MeshBasicMaterial({ color: p.diabetic ? '#ff9d6b' : '#fff3a0', toneMapped: false }), 50]} frustumCulled={false} />
      <Anchor id="glomerulus" position={[0.3, 0.4, 0.75]} /><Anchor id="bowman" position={[-1.0, -0.5, 0.6]} /><Anchor id="afferent" position={[-1.1, 1.75, 0.15]} /><Anchor id="efferent" position={[1.0, 1.75, 0.15]} /><Anchor id="tubule" position={[1.4, -1.4, 0.2]} /><Anchor id="filtrate" position={[0.5, -0.9, 0.5]} />
    </group>
  );
}

function Bladder() {
  const fill = useCtl('fill', 0.6);
  const m = useHi(['bladder', 'detrusor'], '#e8a090', { rough: 0.45, sheen: 0.7, opacity: 0.75 });
  const u = useHi('urine', '#f2e070', { rough: 0.1, opacity: 0.8 });
  const ur = useHi('ureter', '#f2e0b0', { rough: 0.4 }), ure = useHi(['urethra', 'sphincter'], '#e8b0a0', { rough: 0.4 });
  const g = useRef<THREE.Group>(null);
  useFrame(() => { const s = 0.6 + fill * 0.55; g.current?.scale.set(s, 0.5 + fill * 0.6, s); });
  return (
    <group>
      <group ref={g}><mesh material={m}><sphereGeometry args={[1, 40, 30]} /></mesh><mesh material={u} position={[0, -0.15, 0]} scale={[0.9, 0.75, 0.9]}><sphereGeometry args={[1, 30, 20]} /></mesh></group>
      {[-1, 1].map((s) => <mesh key={s} material={ur} geometry={varTube(curve([[s * 1.0, 2.4, -0.3], [s * 0.9, 1.2, -0.3], [s * 0.45, 0.2, -0.3]]), 20, 8, () => 0.06)} />)}
      <mesh material={ure} geometry={useMemo(() => varTube(curve([[0, -0.6, 0], [0, -1.2, 0.05], [0, -1.8, 0.1]]), 20, 8, () => 0.07), [])} />
      <mesh material={ure} position={[0, -0.95, 0.02]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.1, 0.04, 8, 18]} /></mesh>
      <Anchor id="bladder" position={[0.7, 0.6, 0.6]} /><Anchor id="urine" position={[0, -0.2, 0.3]} inner /><Anchor id="ureter" position={[0.95, 1.4, -0.2]} /><Anchor id="urethra" position={[0.1, -1.5, 0.15]} /><Anchor id="sphincter" position={[0.15, -0.95, 0.15]} />
    </group>
  );
}

function Tooth({ p }: { p: OrganP }) {
  const plane = useClip();
  const enamel = useHi('enamel', '#f8f6ee', { rough: 0.15, clear: 1, side: THREE.DoubleSide });
  const dentin = useHi('dentin', '#f0deb0', { rough: 0.5, side: THREE.DoubleSide });
  const pulp = useHi(['pulp', 'nerve'], '#e85a6a', { rough: 0.5 });
  const gum = useHi('gum', '#e88a9a', { rough: 0.5, sheen: 0.8, side: THREE.DoubleSide });
  const bone = useHi('bone', '#e8dcc0', { rough: 0.7, side: THREE.DoubleSide });
  const cav = useHi('cavity', '#4a3a2a', { rough: 0.9 });
  const crown = (r: number, h: number) => { const pts: THREE.Vector2[] = []; for (let i = 0; i <= 30; i++) { const t = i / 30; pts.push(new THREE.Vector2(r * (0.55 + 0.45 * Math.sin(t * Math.PI * 0.9)) * (t < 0.9 ? 1 : 1 - (t - 0.9) * 5), -h * 0.2 + t * h)); } return new THREE.LatheGeometry(pts, 48); };
  const g = useMemo(() => ({ en: crown(0.75, 1.0), de: crown(0.62, 0.92), roots: merge([-1, 1].map((s) => varTube(curve([[s * 0.28, -0.2, 0], [s * 0.32, -1.0, 0], [s * 0.2, -1.9, 0]]), 30, 14, (t) => 0.26 * (1 - t * 0.7)))), canal: merge([-1, 1].map((s) => varTube(curve([[s * 0.15, 0.3, 0], [s * 0.28, -0.6, 0], [s * 0.2, -1.8, 0]]), 30, 8, (t) => 0.08 * (1 - t * 0.6)))) }), []);
  useMemo(() => { for (const m of [enamel, dentin, gum, bone]) m.clippingPlanes = [plane]; }, [enamel, dentin, gum, bone, plane]);
  return (
    <group position={[0, 0.4, 0]}>
      <mesh geometry={g.en} material={enamel} position={[0, 0.0, 0]} /><mesh geometry={g.de} material={dentin} /><mesh geometry={g.roots} material={dentin} />
      <mesh material={pulp} position={[0, 0.35, 0]} scale={[1, 0.8, 0.6]}><sphereGeometry args={[0.28, 24, 16]} /></mesh><mesh geometry={g.canal} material={pulp} />
      <mesh material={gum} position={[0, -0.25, 0]}><cylinderGeometry args={[1.1, 1.1, 0.4, 40, 1, true]} /></mesh>
      <mesh material={bone} position={[0, -1.25, 0]}><cylinderGeometry args={[1.2, 1.2, 1.7, 40, 1, true]} /></mesh>
      {p.cavity && <mesh material={cav} position={[0.35, 0.72, -0.05]}><sphereGeometry args={[0.18, 16, 12]} /></mesh>}
      <Anchor id="enamel" position={[0.6, 0.6, 0.0]} /><Anchor id="dentin" position={[-0.45, 0.2, 0.0]} /><Anchor id="pulp" position={[0, 0.4, 0.05]} /><Anchor id="nerve" position={[0.25, -1.2, 0.05]} />
      <Anchor id="gum" position={[-0.9, -0.2, 0.0]} /><Anchor id="bone" position={[-1.0, -1.3, 0.0]} />{p.cavity && <Anchor id="cavity" position={[0.38, 0.8, 0.05]} />}
    </group>
  );
}

export default function Organs({ p }: { p: OrganP }) {
  switch (p.mode) {
    case 'gut': return <Gut />;
    case 'stomach': return <Stomach p={p} />;
    case 'villi': return <Villi p={p} />;
    case 'liver': return <Liver p={p} />;
    case 'lobule': return <Lobule />;
    case 'islet': return <Islet p={p} />;
    case 'colon': return <Colon p={p} />;
    case 'kidney': return <Kidney p={p} />;
    case 'nephron': return <Nephron />;
    case 'glomerulus': return <Glomerulus p={p} />;
    case 'bladder': return <Bladder />;
    case 'tooth': return <Tooth p={p} />;
    default: return <Gut />;
  }
}
