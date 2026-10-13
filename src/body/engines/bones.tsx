/**
 * Bones, joints and muscle. A long bone opened lengthwise (compact shell,
 * spongy ends, marrow, growth plate, cartilage); an osteon; the knee with
 * its cartilage, menisci and four ligaments, bending; a run of vertebrae
 * with discs, the cord and nerve roots; the sarcomere sliding; a muscle
 * unpacked from whole to filament; a fracture healing; the hip; the skull.
 */
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Anchor, useCtl, useHi, useScene } from '../stage';
import { capsule, ellipsoid, mesh, smax, smin, sphere, cached, type SDF, type Vec } from '../sdf';
import { V, curve, varTube, TAU, PAL, smooth, noise3 } from '../kit';

export interface BoneP { mode: 'bone' | 'osteon' | 'knee' | 'spine' | 'sarcomere' | 'muscle' | 'fracture' | 'hip' | 'skull'; osteoporosis?: boolean; arthritis?: boolean; acl?: boolean; hernia?: boolean; baby?: boolean }

/* ───────── a long bone, opened ───────── */
const BONE: SDF = (x, y, z) => { const shaft = capsule([0, -1.6, 0], [0, 1.6, 0], 0.32)(x, y, z); const top = ellipsoid([0, 2.0, 0], [0.62, 0.48, 0.55])(x, y, z), bot = ellipsoid([0, -2.0, 0], [0.7, 0.45, 0.55])(x, y, z); return smin(smin(shaft, top, 0.45), bot, 0.45); };
function LongBone({ p }: { p: BoneP }) {
  const thin = p.osteoporosis ? 0.06 : 0.12;
  const M = useMemo(() => cached('bone' + p.osteoporosis, () => mesh((x, y, z) => {
    const d = BONE(x, y, z); if (z > 0.0) return Math.max(d, z - 0.0) ;
    return d;
  }, [-0.8, -2.55, -0.65], [0.8, 2.55, 0.05], 0.022, (x, y, z) => {
    if (z < -0.01) return 'periosteum';
    const d = BONE(x, y, z); if (d > -thin) return 'compact';
    if (Math.abs(y) > 1.45) { const tr = Math.abs(noise3(x * 9, y * 9, z * 9)) < (p.osteoporosis ? 0.12 : 0.28); if (Math.abs(Math.abs(y) - 1.65) < 0.03) return 'plate'; return tr ? 'spongy' : 'red'; }
    return 'marrow';
  })), [p.osteoporosis, thin]);
  const col: Record<string, string> = { periosteum: '#e8d8c0', compact: '#f2ead8', spongy: '#e8dcc0', red: '#b8443f', marrow: '#f2d07a', plate: '#9fd6e8' };
  const ids: Record<string, string[]> = { periosteum: ['periosteum'], compact: ['compact'], spongy: ['spongy'], red: ['red'], marrow: ['marrow'], plate: ['plate'] };
  const cart = useHi('cartilage', '#cfe8f0', { rough: 0.2, clear: 0.8, opacity: 0.9 });
  const vM = useHi('vessel', PAL.artery, { rough: 0.4 });
  return (
    <group>
      {[...M.groups].map(([n, g]) => <BPiece key={n} ids={ids[n] ?? [n]} g={g} col={col[n] ?? '#eee'} />)}
      <mesh material={cart} position={[0, 2.25, 0]} scale={[1, 0.45, 0.9]}><sphereGeometry args={[0.6, 32, 16, 0, TAU, 0, Math.PI / 2]} /></mesh>
      <mesh material={vM} geometry={useMemo(() => varTube(curve([[0.9, 0.4, -0.2], [0.3, 0.3, -0.25], [0.05, 0.1, -0.2], [0, -0.5, -0.15]]), 30, 6, () => 0.03), [])} />
      <Anchor id="compact" position={[0.3, 0.6, 0.02]} /><Anchor id="spongy" position={[-0.25, 1.95, 0.02]} /><Anchor id="marrow" position={[0, -0.3, 0.02]} /><Anchor id="red" position={[0.3, -2.0, 0.02]} />
      <Anchor id="plate" position={[-0.4, 1.65, 0.02]} /><Anchor id="periosteum" position={[-0.4, -0.9, -0.2]} /><Anchor id="cartilage" position={[0.2, 2.45, 0.1]} /><Anchor id="vessel" position={[0.7, 0.4, -0.15]} />
    </group>
  );
}
function BPiece({ ids, g, col }: { ids: string[]; g: THREE.BufferGeometry; col: string }) { const m = useHi(ids, col, { rough: 0.55, clear: 0.3, side: THREE.DoubleSide }); return <mesh geometry={g} material={m} />; }

function Osteon() {
  const lam = useHi('lamellae', '#f2ead8', { rough: 0.5, side: THREE.DoubleSide });
  const can = useHi(['canal', 'vessel'], PAL.artery, { rough: 0.4 });
  const nv = useHi('nerve', PAL.nerve, { rough: 0.4 });
  const cyte = useHi('osteocyte', '#c98a6a', { rough: 0.5 });
  const rings = useMemo(() => Array.from({ length: 6 }, (_, i) => 0.25 + i * 0.16), []);
  const cells = useMemo(() => { const out: THREE.Vector3[] = []; rings.forEach((r, i) => { for (let k = 0; k < 6 + i * 2; k++) { const a = (k / (6 + i * 2)) * TAU + i; out.push(V(Math.cos(a) * (r + 0.08), 1.0, Math.sin(a) * (r + 0.08))); } }); return out; }, [rings]);
  return (
    <group rotation={[0.4, 0, 0]}>
      {rings.map((r, i) => <mesh key={i} material={lam} position={[0, -0.05 * i, 0]}><cylinderGeometry args={[r + 0.12, r + 0.12, 2 - i * 0.12, 48, 1, true, 0, TAU * 0.8]} /></mesh>)}
      {rings.map((r, i) => <mesh key={'t' + i} material={lam} position={[0, 1 - 0.05 * i - i * 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[r, r + 0.12, 48]} /></mesh>)}
      <mesh material={can}><cylinderGeometry args={[0.08, 0.08, 2.4, 14]} /></mesh>
      <mesh material={nv} position={[0.1, 0, 0.05]}><cylinderGeometry args={[0.03, 0.03, 2.4, 8]} /></mesh>
      {cells.map((c, i) => <mesh key={i} material={cyte} position={c} scale={[1, 0.5, 1]}><sphereGeometry args={[0.04, 8, 6]} /></mesh>)}
      <mesh material={can} position={[0.6, -0.2, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.04, 0.04, 1.4, 8]} /></mesh>
      <Anchor id="lamellae" position={[1.0, 0.6, 0.4]} /><Anchor id="canal" position={[0, 1.25, 0]} /><Anchor id="osteocyte" position={cells[8].clone().add(V(0, 0.1, 0)).toArray() as Vec} /><Anchor id="nerve" position={[0.12, 1.3, 0.1]} /><Anchor id="volkmann" position={[1.2, -0.2, 0.1]} />
    </group>
  );
}

/* ───────── the knee ───────── */
function Knee({ p }: { p: BoneP }) {
  const bend = useCtl('bend', 25);
  const fem = useMemo(() => cached('femur', () => mesh((x, y, z) => smin(capsule([0, 0.6, -0.05], [0, 3, -0.05], 0.36)(x, y, z), smin(ellipsoid([-0.38, 0.25, 0], [0.32, 0.38, 0.5])(x, y, z), ellipsoid([0.38, 0.25, 0], [0.32, 0.38, 0.5])(x, y, z), 0.15), 0.4), [-0.8, -0.2, -0.65], [0.8, 3.05, 0.65], 0.03)).geo, []);
  const tib = useMemo(() => cached('tibia', () => mesh((x, y, z) => smin(capsule([0, -0.5, 0], [0, -3, 0], 0.3)(x, y, z), ellipsoid([0, -0.28, 0], [0.75, 0.24, 0.55])(x, y, z), 0.35), [-0.85, -3.05, -0.65], [0.85, 0.0, 0.65], 0.03)).geo, []);
  const bone = useHi(['femur', 'tibia', 'patella', 'bone'], PAL.bone, { rough: 0.45, clear: 0.4 });
  const cart = useHi('cartilage', p.arthritis ? '#c8c0a0' : '#cfe8f0', { rough: p.arthritis ? 0.9 : 0.15, clear: 0.8, opacity: 0.92 });
  const men = useHi('meniscus', '#e8e0d0', { rough: 0.35, clear: 0.5 });
  const lig = (id: string) => useHi(id, id === 'acl' && p.acl ? '#c0303a' : '#f0e0b0', { rough: 0.45, sheen: 0.6 });
  const acl = lig('acl'), pcl = lig('pcl'), mcl = lig('mcl'), lcl = lig('lcl');
  const spur = useHi('spur', '#e8dcc0', { rough: 0.7 });
  const top = useRef<THREE.Group>(null);
  useFrame(() => { if (top.current) top.current.rotation.x = -(bend * Math.PI) / 180 * 0.0; });
  const lower = useRef<THREE.Group>(null);
  useFrame(() => { if (lower.current) { const a = (bend * Math.PI) / 180; lower.current.rotation.x = a; lower.current.position.set(0, 0, -Math.sin(a) * 0.15); } });
  return (
    <group position={[0, 0, 0]}>
      <group ref={top}>
        <mesh geometry={fem} material={bone} />
        <mesh material={cart} position={[0, 0.12, 0.0]} scale={[1, 0.6, 1]}><sphereGeometry args={[0.66, 32, 16, 0, TAU, Math.PI / 2, Math.PI / 2]} /></mesh>
        <mesh material={bone} position={[0, 0.65, 0.55]} scale={[1, 1.2, 0.5]}><sphereGeometry args={[0.24, 20, 14]} /></mesh>
        {p.arthritis && [[-0.6, 0.2, 0.3], [0.62, 0.15, 0.25]].map((q, i) => <mesh key={i} material={spur} position={q as Vec}><coneGeometry args={[0.06, 0.18, 8]} /></mesh>)}
      </group>
      <group ref={lower} position={[0, 0, 0]}>
        <mesh geometry={tib} material={bone} />
        <mesh material={cart} position={[0, -0.08, 0]} scale={[1, 0.12, 0.85]}><cylinderGeometry args={[0.72, 0.72, 0.5, 32]} /></mesh>
        {[-1, 1].map((s) => <mesh key={s} material={men} position={[s * 0.38, 0.0, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 0.6]}><torusGeometry args={[0.24, 0.07, 10, 24, Math.PI * 1.6]} /></mesh>)}
        <mesh material={acl} geometry={useMemo(() => varTube(curve(p.acl ? [[0.05, 0.0, 0.15], [0.1, 0.12, 0.05]] : [[0.05, 0.0, 0.18], [0.12, 0.22, 0.0], [0.2, 0.42, -0.2]]), 20, 8, () => 0.06), [p.acl])} />
        <mesh material={pcl} geometry={useMemo(() => varTube(curve([[-0.05, 0.0, -0.3], [-0.1, 0.22, -0.1], [-0.2, 0.42, 0.12]]), 20, 8, () => 0.06), [])} />
        <mesh material={mcl} geometry={useMemo(() => varTube(curve([[-0.72, -0.6, 0], [-0.74, 0.0, 0], [-0.68, 0.6, 0]]), 20, 8, () => 0.05), [])} />
        <mesh material={lcl} geometry={useMemo(() => varTube(curve([[0.7, -0.7, -0.1], [0.74, 0.0, -0.05], [0.66, 0.55, 0]]), 20, 8, () => 0.04), [])} />
        <Anchor id="tibia" position={[0.35, -1.5, 0.3]} /><Anchor id="meniscus" position={[0.55, 0.05, 0.3]} /><Anchor id="acl" position={[0.12, 0.25, 0.15]} /><Anchor id="pcl" position={[-0.15, 0.25, -0.15]} /><Anchor id="mcl" position={[-0.8, 0.0, 0.1]} /><Anchor id="lcl" position={[0.82, -0.1, 0.0]} />
      </group>
      <Anchor id="femur" position={[0.35, 1.8, 0.3]} /><Anchor id="patella" position={[0, 0.7, 0.7]} /><Anchor id="cartilage" position={[-0.4, 0.05, 0.55]} />{p.arthritis && <Anchor id="spur" position={[-0.6, 0.35, 0.35]} />}
    </group>
  );
}

/* ───────── the spine ───────── */
function Spine({ p }: { p: BoneP }) {
  const vert = useMemo(() => cached('vertebra', () => mesh((x, y, z) => {
    const body = capsule([0, -0.18, 0.25], [0, 0.18, 0.25], 0.42)(x, y, z);
    const arch = Math.max(Math.abs(Math.hypot(x, z + 0.32) - 0.3) - 0.07, Math.abs(y) - 0.12, z - 0.0);
    const sp = capsule([0, 0, -0.6], [0, -0.25, -1.15], 0.08)(x, y, z);
    const tr = Math.min(capsule([-0.25, 0, -0.35], [-0.75, 0.05, -0.45], 0.07)(x, y, z), capsule([0.25, 0, -0.35], [0.75, 0.05, -0.45], 0.07)(x, y, z));
    return smin(smin(smax(body, Math.abs(y) - 0.2, 0.05), arch, 0.08), smin(sp, tr, 0.08), 0.06);
  }, [-0.85, -0.42, -1.25], [0.85, 0.35, 0.72], 0.025)).geo, []);
  const bone = useHi(['vertebra', 'bone'], PAL.bone, { rough: 0.45, clear: 0.4 });
  const disc = useHi('disc', '#9fd6e8', { rough: 0.3, clear: 0.6 });
  const nuc = useHi('nucleus', '#e8f4ff', { rough: 0.2, opacity: 0.9 });
  const cord = useHi('cord', PAL.nerve, { rough: 0.4 });
  const root = useHi('root', '#f2c94c', { rough: 0.4 });
  const N = 6;
  return (
    <group rotation={[0, Math.PI * 0.75, 0]}>
      {Array.from({ length: N }, (_, i) => <mesh key={i} geometry={vert} material={bone} position={[0, (i - N / 2) * 0.62, 0]} />)}
      {Array.from({ length: N - 1 }, (_, i) => <group key={i} position={[0, (i - N / 2) * 0.62 + 0.31, 0.25]}><mesh material={disc} scale={[1, 0.3, 1]}><sphereGeometry args={[0.44, 28, 14]} /></mesh>{p.hernia && i === 2 && <mesh material={nuc} position={[0.18, 0, -0.42]} scale={[0.5, 0.3, 0.5]}><sphereGeometry args={[0.3, 16, 12]} /></mesh>}<mesh material={nuc} scale={[0.5, 0.25, 0.5]}><sphereGeometry args={[0.36, 16, 10]} /></mesh></group>)}
      <mesh material={cord}><cylinderGeometry args={[0.16, 0.16, N * 0.62 + 0.6, 20]} /></mesh>
      {Array.from({ length: N - 1 }, (_, i) => [-1, 1].map((s) => <mesh key={i + '' + s} material={root} geometry={varTube(curve([[0, (i - N / 2) * 0.62 + 0.31, -0.32], [s * 0.4, (i - N / 2) * 0.62 + 0.27, -0.12], [s * 1.0, (i - N / 2) * 0.62 + 0.1, -0.05]]), 16, 6, () => 0.045)} />))}
      <Anchor id="vertebra" position={[0.5, 0.95, 0.4]} /><Anchor id="disc" position={[0.45, 0.31 - 0.62, 0.45]} /><Anchor id="nucleus" position={[0, 0.31 - 0.62, 0.3]} inner /><Anchor id="cord" position={[0, 0.0, -0.32]} />
      <Anchor id="root" position={[0.9, -0.55, -0.05]} /><Anchor id="spinous" position={[0, -0.2, -1.2]} />{p.hernia && <Anchor id="hernia" position={[0.2, (2 - N / 2) * 0.62 + 0.31, -0.25]} />}
    </group>
  );
}

/* ───────── the sarcomere ───────── */
function Sarcomere() {
  const S = useScene();
  const c = useCtl('contract', 0);
  const actM = useHi(['actin', 'thin'], '#5ac8ff', { rough: 0.4 });
  const myoM = useHi(['myosin', 'thick'], '#e8584a', { rough: 0.4 });
  const headM = useHi(['myosin', 'heads'], '#f28a6a', { rough: 0.4 });
  const zM = useHi(['zdisc'], '#f2f2f2', { rough: 0.4, clear: 0.6 });
  const titM = useHi('titin', '#c98bd9', { rough: 0.4 });
  const L = useRef<THREE.Group>(null), R = useRef<THREE.Group>(null), heads = useRef<THREE.InstancedMesh>(null);
  const rows = useMemo(() => { const out: [number, number][] = []; for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) out.push([i * 0.3, j * 0.3]); return out; }, []);
  useFrame(({ clock }) => {
    const k = Math.max(c, smooth(S.st.current - 0.5) * 0.9 * (S.stages ? 1 : 0));
    const off = 1.2 - k * 0.65;
    if (L.current) L.current.position.x = -off; if (R.current) R.current.position.x = off;
    const im = heads.current; if (im) { const M = new THREE.Matrix4(), t = clock.elapsedTime; let n = 0; for (const [y, z] of rows) for (let i = 0; i < 16; i++) { const x = (i < 8 ? -1 : 1) * (0.2 + (i % 8) * 0.12), tilt = Math.sin(t * 8 + i) * 0.4 * (k > 0.05 ? 1 : 0.1); M.makeRotationZ(0.8 * Math.sign(x) + tilt); M.setPosition(x, y + 0.07, z); im.setMatrixAt(n++, M); } im.instanceMatrix.needsUpdate = true; }
  });
  return (
    <group>
      {rows.map(([y, z], i) => <mesh key={i} material={myoM} position={[0, y, z]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.045, 0.045, 2.2, 10]} /></mesh>)}
      <instancedMesh ref={heads} args={[new THREE.CapsuleGeometry(0.025, 0.09, 4, 6), headM, rows.length * 16]} frustumCulled={false} />
      {[L, R].map((ref, s) => <group key={s} ref={ref}>
        <mesh material={zM} position={[s ? 1.0 : -1.0, 0, 0]} rotation={[0, 0, Math.PI / 2]}><boxGeometry args={[1.1, 0.06, 1.1]} /></mesh>
        {rows.map(([y, z], i) => [0.15, -0.15].map((dy, k) => <mesh key={i + '' + k} material={actM} position={[(s ? 1 : -1) * 0.25, y + dy, z + dy * 0.5]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.022, 0.022, 1.5, 6]} /></mesh>))}
        <mesh material={titM} position={[(s ? 1 : -1) * 0.5, 0.42, 0.42]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.012, 0.012, 1.0, 6]} /></mesh>
        <Anchor id="zdisc" position={[s ? 1.0 : -1.0, 0.6, 0.5]} />
      </group>)}
      <Anchor id="actin" position={[-0.6, 0.45, 0.35]} /><Anchor id="myosin" position={[0.0, 0.42, 0.35]} /><Anchor id="heads" position={[0.45, 0.4, 0.32]} /><Anchor id="titin" position={[0.6, 0.55, 0.45]} />
    </group>
  );
}

/* ───────── muscle, unpacked ───────── */
function Muscle() {
  const mus = useHi(['muscle', 'epimysium'], '#b8443f', { rough: 0.5, sheen: 0.7 });
  const fas = useHi(['fascicle', 'perimysium'], '#c9504a', { rough: 0.5, sheen: 0.6 });
  const fib = useHi(['fiber', 'cell'], '#d8605a', { rough: 0.45 });
  const myo = useHi('myofibril', '#e8857a', { rough: 0.4 });
  const ten = useHi('tendon', '#f2ead8', { rough: 0.4, clear: 0.5 });
  const fasc = useMemo(() => Array.from({ length: 9 }, (_, i) => { const a = (i / 9) * TAU; return [Math.cos(a) * 0.38, Math.sin(a) * 0.38] as [number, number]; }), []);
  return (
    <group rotation={[0, 0, 0]}>
      <mesh material={ten} position={[-3.2, 0, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.2, 0.45, 1.2, 24]} /></mesh>
      <mesh material={mus} position={[-1.6, 0, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.8, 0.8, 2.0, 40]} /></mesh>
      {fasc.map(([y, z], i) => <mesh key={i} material={fas} position={[0.3, y, z]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.24, 0.24, 1.8, 20]} /></mesh>)}
      {Array.from({ length: 7 }, (_, i) => { const a = (i / 7) * TAU; return <mesh key={i} material={fib} position={[1.9, Math.cos(a) * 0.12 + 0.38, Math.sin(a) * 0.12]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.055, 0.055, 1.4, 12]} /></mesh>; })}
      {Array.from({ length: 6 }, (_, i) => { const a = (i / 6) * TAU; return <mesh key={i} material={myo} position={[3.1, 0.38 + Math.cos(a) * 0.04, Math.sin(a) * 0.04]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.016, 0.016, 1.0, 8]} /></mesh>; })}
      <Anchor id="tendon" position={[-3.2, 0.45, 0.2]} /><Anchor id="muscle" position={[-1.6, 0.85, 0.2]} /><Anchor id="fascicle" position={[0.3, 0.7, 0.2]} /><Anchor id="fiber" position={[1.9, 0.6, 0.1]} /><Anchor id="myofibril" position={[3.1, 0.5, 0.05]} />
    </group>
  );
}

function Fracture() {
  const S = useScene();
  const bone = useHi(['bone', 'break'], PAL.bone, { rough: 0.45, clear: 0.4 });
  const hem = useHi('hematoma', '#7a0d16', { rough: 0.7, opacity: 0.85 });
  const soft = useHi('callus', '#cfe8c0', { rough: 0.6, opacity: 0.8 });
  const hard = useHi('callus', '#f0e6c8', { rough: 0.55 });
  const top = useMemo(() => { const g = new THREE.CylinderGeometry(0.3, 0.3, 1.8, 32, 12); const pos = g.attributes.position as THREE.BufferAttribute; for (let i = 0; i < pos.count; i++) if (pos.getY(i) < -0.85) pos.setY(i, -0.9 + 0.12 * Math.sin(pos.getX(i) * 12) * Math.cos(pos.getZ(i) * 10)); g.computeVertexNormals(); g.translate(0, 0.95, 0); return g; }, []);
  const bot = useMemo(() => top.clone().rotateZ(Math.PI), [top]);
  const refs = { h: useRef<THREE.Mesh>(null), s: useRef<THREE.Mesh>(null), d: useRef<THREE.Mesh>(null), t: useRef<THREE.Group>(null) };
  useFrame(() => { const st = S.st.current; refs.h.current?.scale.setScalar(Math.max(0.01, smooth(st) * (1 - smooth(st - 1.2)) * 1.0 + 0.001)); refs.s.current?.scale.set(1, Math.max(0.01, smooth(st - 1) * (1 - smooth(st - 2.2))), 1); refs.d.current?.scale.set(1 - smooth(st - 3) * 0.6, Math.max(0.01, smooth(st - 2) * (1 - smooth(st - 3.4) * 0.7)), 1 - smooth(st - 3) * 0.6); if (refs.t.current) refs.t.current.position.x = 0.08 * (1 - smooth(st - 1.5)); });
  return (
    <group>
      <group ref={refs.t}><mesh geometry={top} material={bone} /></group>
      <mesh geometry={bot} material={bone} />
      <mesh ref={refs.h} material={hem} scale={0.01}><sphereGeometry args={[0.55, 24, 16]} /></mesh>
      <mesh ref={refs.s} material={soft}><cylinderGeometry args={[0.5, 0.5, 0.7, 28]} /></mesh>
      <mesh ref={refs.d} material={hard}><cylinderGeometry args={[0.44, 0.44, 0.6, 28]} /></mesh>
      <Anchor id="break" position={[0.35, 0.0, 0.2]} /><Anchor id="hematoma" position={[0.55, 0.2, 0.3]} /><Anchor id="callus" position={[0.5, -0.25, 0.3]} /><Anchor id="bone" position={[0.3, 1.4, 0.2]} />
    </group>
  );
}

function Hip() {
  const pel = useMemo(() => cached('hipbone', () => mesh((x, y, z) => smax(smin(ellipsoid([-0.6, 0.6, 0], [0.9, 0.9, 0.18])(x, y, z), ellipsoid([0, 0, 0], [0.6, 0.55, 0.5])(x, y, z), 0.3), -sphere([0.2, -0.05, 0.05], 0.48)(x, y, z), 0.05), [-1.6, -0.7, -0.6], [0.7, 1.6, 0.6], 0.03)).geo, []);
  const fem = useMemo(() => cached('femhead', () => mesh((x, y, z) => smin(sphere([0.2, -0.05, 0.05], 0.42)(x, y, z), smin(capsule([0.3, -0.2, 0.05], [0.8, -0.75, 0.05], 0.2)(x, y, z), capsule([0.8, -0.75, 0.05], [0.95, -2.6, 0.05], 0.24)(x, y, z), 0.2), 0.15), [-0.3, -2.7, -0.5], [1.3, 0.45, 0.6], 0.03)).geo, []);
  const bone = useHi(['pelvis', 'bone'], PAL.bone, { rough: 0.45, clear: 0.4 }), fb = useHi(['femur', 'head', 'neck'], '#efe6d2', { rough: 0.45, clear: 0.4 });
  const cart = useHi('cartilage', '#cfe8f0', { rough: 0.2, clear: 0.8, opacity: 0.7 });
  return (
    <group>
      <mesh geometry={pel} material={bone} /><mesh geometry={fem} material={fb} />
      <mesh material={cart} position={[0.2, -0.05, 0.05]}><sphereGeometry args={[0.45, 32, 24]} /></mesh>
      <Anchor id="pelvis" position={[-0.9, 1.0, 0.25]} /><Anchor id="head" position={[0.2, 0.2, 0.5]} /><Anchor id="neck" position={[0.6, -0.5, 0.3]} /><Anchor id="femur" position={[1.0, -1.8, 0.3]} /><Anchor id="cartilage" position={[-0.05, -0.3, 0.45]} /><Anchor id="socket" position={[-0.1, 0.25, 0.4]} />
    </group>
  );
}

function Skull({ p }: { p: BoneP }) {
  const f: SDF = useMemo(() => { const cr = ellipsoid([0, 0.35, -0.1], [0.78, 0.82, 0.98]), face = ellipsoid([0, -0.35, 0.45], [0.55, 0.6, 0.45]); return (x, y, z) => { let d = smin(cr(x, y, z), face(x, y, z), 0.25); d = smax(d, -Math.min(sphere([-0.25, -0.1, 0.85], 0.2)(x, y, z), sphere([0.25, -0.1, 0.85], 0.2)(x, y, z)), 0.05); d = smax(d, -ellipsoid([0, -0.48, 0.9], [0.1, 0.13, 0.2])(x, y, z), 0.04); return d; }; }, []);
  const label = (x: number, y: number, z: number) => { if (y < -0.25 && z > 0.1) return 'face'; if (z > 0.35 && y > -0.2) return 'frontal'; if (z < -0.6) return 'occipital'; if (Math.abs(x) > 0.55 && y < 0.35) return 'temporal'; return 'parietal'; };
  const M = useMemo(() => cached('skull2', () => mesh(f, [-0.95, -1.05, -1.15], [0.95, 1.25, 1.0], 0.025, label)), [f]);
  const col: Record<string, string> = { frontal: '#f2e2c4', parietal: '#ede0c8', occipital: '#e6d6bc', temporal: '#efdcbe', face: '#f0e4cc' };
  const jaw = useHi('mandible', '#ede0c8', { rough: 0.45 });
  const font = useHi('fontanelle', '#f2b8a8', { rough: 0.5, opacity: 0.85 });
  return (
    <group>
      {[...M.groups].map(([n, g]) => <BPiece key={n} ids={[n, 'skull']} g={g} col={col[n]} />)}
      <mesh material={jaw} geometry={useMemo(() => varTube(curve([[-0.5, -0.4, -0.05], [-0.48, -0.9, 0.3], [0, -1.05, 0.62], [0.48, -0.9, 0.3], [0.5, -0.4, -0.05]]), 60, 10, () => 0.08), [])} />
      {p.baby && <mesh material={font} position={[0, 1.13, 0.15]} scale={[1, 0.15, 1.2]}><sphereGeometry args={[0.22, 20, 12]} /></mesh>}
      <Anchor id="frontal" position={[0.2, 0.6, 0.85]} /><Anchor id="parietal" position={[0.45, 0.95, -0.2]} /><Anchor id="occipital" position={[0.2, 0.2, -1.1]} /><Anchor id="temporal" position={[0.82, 0.0, 0.0]} /><Anchor id="mandible" position={[0.35, -0.95, 0.4]} /><Anchor id="suture" position={[0, 1.15, 0.0]} />{p.baby && <Anchor id="fontanelle" position={[0, 1.2, 0.2]} />}
    </group>
  );
}

export default function Bones({ p }: { p: BoneP }) {
  switch (p.mode) {
    case 'osteon': return <Osteon />;
    case 'knee': return <Knee p={p} />;
    case 'spine': return <Spine p={p} />;
    case 'sarcomere': return <Sarcomere />;
    case 'muscle': return <Muscle />;
    case 'fracture': return <Fracture />;
    case 'hip': return <Hip />;
    case 'skull': return <Skull p={p} />;
    default: return <LongBone p={p} />;
  }
}
