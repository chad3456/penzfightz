/**
 * The senses and the skin. The eye cut in half (cornea, iris, lens,
 * vitreous, retina, optic nerve) with light focusing on the retina, near-
 * or far-sighted; the layers of the retina with rods and cones; the ear
 * from the outer canal to the snail of the cochlea; the cochlea's hair
 * cells; a block of skin with its layers, hair, glands and receptors; the
 * olfactory patch in the nose; a taste bud.
 */
import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Anchor, useCtl, useHi, useScene } from '../stage';
import { V, rng, curve, varTube, merge, TAU, PAL, displace, fbm } from '../kit';

export interface SenseP { mode: 'eye' | 'retina' | 'ear' | 'cochlea' | 'skin' | 'nose' | 'taste'; focus?: 'myopia' | 'hyperopia'; cataract?: boolean; glaucoma?: boolean; burn?: number; wound?: boolean; melanoma?: boolean }
const cut = new THREE.Plane(V(0, 0, -1), 0);
function useClip() { const { gl } = useThree(); gl.localClippingEnabled = true; return cut; }

function Eye({ p }: { p: SenseP }) {
  const plane = useClip();
  const sclera = useHi(['sclera'], '#f6f2ec', { rough: 0.4, clear: 0.6, side: THREE.DoubleSide });
  const choroid = useHi('choroid', '#6a2a2a', { rough: 0.6, side: THREE.DoubleSide });
  const retina = useHi(['retina', 'macula'], '#e87a5a', { rough: 0.5, side: THREE.DoubleSide });
  const cornea = useHi('cornea', '#cfe8ff', { rough: 0.05, clear: 1, opacity: 0.35, side: THREE.DoubleSide });
  const iris = useHi(['iris', 'pupil'], '#4a7ab8', { rough: 0.5, side: THREE.DoubleSide });
  const lens = useHi('lens', p.cataract ? '#e8dcb0' : '#e8f4ff', { rough: 0.1, clear: 1, opacity: p.cataract ? 0.9 : 0.55 });
  const vit = useHi('vitreous', '#bfe3ff', { rough: 0.1, opacity: 0.08, side: THREE.BackSide });
  const nerve = useHi('nerve', PAL.nerve, { rough: 0.45 });
  const mac = useHi('macula', '#c84a2a', { rough: 0.5 });
  const cil = useHi('ciliary', '#9a4a4a', { rough: 0.6, side: THREE.DoubleSide });
  useMemo(() => { for (const m of [sclera, choroid, retina, cornea, iris, cil]) m.clippingPlanes = [plane]; }, [sclera, choroid, retina, cornea, iris, cil, plane]);
  const lensRef = useRef<THREE.Mesh>(null), rays = useRef<THREE.Group>(null);
  const near = useCtl('distance', 6);
  const focusZ = p.focus === 'myopia' ? -0.5 : p.focus === 'hyperopia' ? -1.35 : -0.97;
  useFrame(() => {
    const acc = Math.max(0, 1 - near / 6); lensRef.current?.scale.set(1, 1, 0.45 + acc * 0.18);
    const g = rays.current; if (!g) return; const fz = focusZ + acc * (p.focus === 'hyperopia' ? 0.25 : 0);
    g.children.forEach((c, i) => { const y0 = (i - 2) * 0.12; const pts = [V(0, y0, 2.4), V(0, y0, 0.95), V(0, y0 * 0.9, 0.62), V(0, 0, fz), V(0, -(y0) * 0.6, fz - 0.4 * Math.sign(-1))]; const m = c as THREE.Mesh; m.geometry.dispose(); m.geometry = varTube(new THREE.CatmullRomCurve3(pts.slice(0, 4).concat([V(0, -y0 * Math.max(0, (-1.0 - fz)) * 1.5, -1.0)]), false, 'centripetal'), 40, 4, () => 0.008); });
  });
  return (
    <group rotation={[0, -Math.PI / 2 + 0.35, 0]}>
      <mesh material={sclera}><sphereGeometry args={[1.2, 64, 48, 0, TAU, 0.42, Math.PI - 0.42]} /></mesh>
      <mesh material={choroid}><sphereGeometry args={[1.15, 64, 48, 0, TAU, 0.5, Math.PI - 0.5]} /></mesh>
      <mesh material={retina} rotation={[Math.PI / 2, 0, 0]}><sphereGeometry args={[1.11, 64, 48, 0, TAU, Math.PI * 0.35, Math.PI * 0.65]} /></mesh>
      <mesh material={cornea} position={[0, 0, 0.62]}><sphereGeometry args={[0.62, 48, 32, 0, TAU, 0, 0.95]} /></mesh>
      <mesh material={iris} position={[0, 0, 0.78]}><ringGeometry args={[p.glaucoma ? 0.14 : 0.2, 0.52, 48]} /></mesh>
      <mesh material={cil} position={[0, 0, 0.68]} rotation={[0, 0, 0]}><torusGeometry args={[0.55, 0.06, 10, 40]} /></mesh>
      <mesh ref={lensRef} material={lens} position={[0, 0, 0.62]}><sphereGeometry args={[0.36, 40, 30]} /></mesh>
      <mesh material={vit}><sphereGeometry args={[1.1, 40, 30]} /></mesh>
      <mesh material={mac} position={[0, 0, -1.09]} scale={[1, 1, 0.3]}><sphereGeometry args={[0.1, 16, 12]} /></mesh>
      <mesh material={nerve} geometry={useMemo(() => varTube(curve([[0.1, 0.05, -1.1], [0.15, 0.05, -1.6], [0.3, 0.1, -2.3]]), 20, 14, () => 0.18), [])} />
      <group ref={rays}>{[0, 1, 2, 3, 4].map((i) => <mesh key={i}><bufferGeometry /><meshBasicMaterial color="#fff6a0" toneMapped={false} transparent opacity={0.85} /></mesh>)}</group>
      <Anchor id="cornea" position={[0, 0.2, 1.22]} /><Anchor id="iris" position={[0, 0.42, 0.8]} /><Anchor id="pupil" position={[0, 0, 0.82]} /><Anchor id="lens" position={[0, -0.25, 0.65]} />
      <Anchor id="retina" position={[0, 0.75, -0.78]} /><Anchor id="macula" position={[0, 0.0, -1.0]} /><Anchor id="nerve" position={[0.2, 0.25, -1.9]} /><Anchor id="sclera" position={[0, -1.15, 0.0]} />
      <Anchor id="vitreous" position={[0, -0.4, -0.3]} inner /><Anchor id="ciliary" position={[0, 0.58, 0.7]} /><Anchor id="choroid" position={[0, -1.05, -0.5]} />
    </group>
  );
}

function Retina() {
  const S = useScene();
  const rodM = useHi('rods', '#9fb8ff', { rough: 0.4 }), coneM = useHi('cones', '#ffb85a', { rough: 0.4 });
  const bip = useHi('bipolar', '#c98bd9', { rough: 0.45 }), gan = useHi(['ganglion', 'nerve'], PAL.nerve, { rough: 0.45 });
  const rpe = useHi('pigment', '#3a2a2a', { rough: 0.7 });
  const cells = useMemo(() => { const r = rng(6); return Array.from({ length: 70 }, (_, i) => ({ x: (i % 14 - 6.5) * 0.28 + (r() - 0.5) * 0.05, z: (Math.floor(i / 14) - 2) * 0.3, cone: r() < 0.25 })); }, []);
  const light = useRef<THREE.InstancedMesh>(null);
  useFrame(({ clock }) => { const im = light.current; if (!im) return; const M = new THREE.Matrix4(); for (let i = 0; i < im.count; i++) { const k = (clock.elapsedTime * 0.5 + i * 0.13) % 1; M.makeTranslation((i % 7 - 3) * 0.5, 2.6 - k * 3.2, (i % 3 - 1) * 0.4); im.setMatrixAt(i, M); } im.instanceMatrix.needsUpdate = true; void S; });
  return (
    <group>
      <mesh material={rpe} position={[0, -1.15, 0]}><boxGeometry args={[4.2, 0.2, 1.6]} /></mesh>
      {cells.map((c, i) => c.cone ? <mesh key={i} material={coneM} position={[c.x, -0.7, c.z]}><coneGeometry args={[0.09, 0.6, 12]} /></mesh> : <mesh key={i} material={rodM} position={[c.x, -0.7, c.z]}><cylinderGeometry args={[0.05, 0.05, 0.75, 10]} /></mesh>)}
      {cells.filter((_, i) => i % 3 === 0).map((c, i) => <mesh key={'b' + i} material={bip} position={[c.x, 0.1, c.z]}><capsuleGeometry args={[0.06, 0.35, 4, 8]} /></mesh>)}
      {cells.filter((_, i) => i % 6 === 0).map((c, i) => <group key={'g' + i}><mesh material={gan} position={[c.x, 0.75, c.z]}><sphereGeometry args={[0.12, 14, 10]} /></mesh><mesh material={gan} geometry={varTube(curve([[c.x, 0.85, c.z], [c.x + 0.3, 1.1, c.z], [2.4, 1.15, 0]]), 20, 5, () => 0.02)} /></group>)}
      <instancedMesh ref={light} args={[new THREE.SphereGeometry(0.04, 8, 6), new THREE.MeshBasicMaterial({ color: '#fff6a0', toneMapped: false }), 21]} frustumCulled={false} />
      <Anchor id="rods" position={[-1.2, -0.3, 0.8]} /><Anchor id="cones" position={[0.6, -0.4, 0.8]} /><Anchor id="bipolar" position={[0.3, 0.35, 0.8]} /><Anchor id="ganglion" position={[-0.6, 0.95, 0.6]} /><Anchor id="pigment" position={[-1.8, -1.05, 0.8]} /><Anchor id="nerve" position={[2.2, 1.3, 0.1]} /><Anchor id="light" position={[1.4, 2.2, 0.3]} />
    </group>
  );
}

function Ear() {
  const S = useScene();
  const outer = useHi(['pinna', 'outer'], '#e8b8a0', { rough: 0.5, sheen: 0.6 });
  const canal = useHi('canal', '#e8b0a0', { rough: 0.5, side: THREE.DoubleSide, opacity: 0.8 });
  const drum = useHi('eardrum', '#f2e0c8', { rough: 0.3, clear: 0.6, opacity: 0.85, side: THREE.DoubleSide });
  const oss = useHi(['ossicles', 'malleus', 'incus', 'stapes'], PAL.bone, { rough: 0.4, clear: 0.4 });
  const coch = useHi('cochlea', '#f2c94c', { rough: 0.4, clear: 0.5 });
  const semi = useHi(['canals', 'balance'], '#5ac8ff', { rough: 0.4, clear: 0.5 });
  const nerve = useHi('nerve', PAL.nerve, { rough: 0.4 });
  const tube = useHi('eustachian', '#e8a4a0', { rough: 0.5 });
  const pinna = useMemo(() => displace(new THREE.TorusGeometry(0.75, 0.22, 16, 48, Math.PI * 1.6).scale(0.6, 1.1, 0.4).rotateZ(Math.PI * 0.6).rotateY(Math.PI / 2), (q) => 0.05 * fbm(q.x * 3, q.y * 3, q.z * 3, 2)), []);
  const cochG = useMemo(() => { const pts: THREE.Vector3[] = []; for (let i = 0; i <= 160; i++) { const t = i / 160, a = t * TAU * 2.6, r = 0.32 * (1 - t * 0.75); pts.push(V(Math.cos(a) * r, Math.sin(a) * r, t * 0.3)); } return varTube(new THREE.CatmullRomCurve3(pts), 300, 10, (t) => 0.1 * (1 - t * 0.6)); }, []);
  const semiG = useMemo(() => merge([[0, 0, 0], [Math.PI / 2, 0, 0], [0, Math.PI / 2, 0]].map((r, i) => new THREE.TorusGeometry(0.22, 0.03, 8, 30, Math.PI * 1.6).rotateX(r[0]).rotateY(r[1]).translate(i * 0.05, 0.3, -0.1 * i))), []);
  const drumRef = useRef<THREE.Mesh>(null), ossRef = useRef<THREE.Group>(null);
  const wave = useRef<THREE.InstancedMesh>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime, v = Math.sin(t * 18) * 0.02;
    if (drumRef.current) drumRef.current.position.x = -0.05 + v; if (ossRef.current) ossRef.current.position.x = v * 0.6;
    const im = wave.current; if (im) { const M = new THREE.Matrix4(); for (let i = 0; i < im.count; i++) { const k = (t * 0.6 + i / im.count) % 1; M.makeTranslation(-2.6 + k * 2.4, 0.25 + Math.sin(i) * 0.1, Math.cos(i) * 0.1); M.scale(V(0.3 + Math.sin(k * Math.PI) * 0.7, 1, 1)); im.setMatrixAt(i, M); } im.instanceMatrix.needsUpdate = true; }
    void S;
  });
  return (
    <group position={[0.4, 0, 0]}>
      <mesh geometry={pinna} material={outer} position={[-2.6, 0.3, 0]} />
      <mesh material={canal} geometry={useMemo(() => varTube(curve([[-2.5, 0.25, 0], [-1.6, 0.2, 0], [-0.8, 0.1, 0]]), 30, 16, () => 0.18), [])} />
      <mesh ref={drumRef} material={drum} position={[-0.75, 0.1, 0]} rotation={[0, Math.PI / 2, 0]}><circleGeometry args={[0.22, 32]} /></mesh>
      <group ref={ossRef}>
        <mesh material={oss} position={[-0.6, 0.18, 0]} rotation={[0, 0, 0.3]}><capsuleGeometry args={[0.04, 0.3, 4, 10]} /></mesh>
        <mesh material={oss} position={[-0.42, 0.3, 0]}><sphereGeometry args={[0.08, 14, 10]} /></mesh>
        <mesh material={oss} position={[-0.25, 0.16, 0]} rotation={[0, 0, Math.PI / 2]}><torusGeometry args={[0.07, 0.02, 6, 14, Math.PI]} /></mesh>
      </group>
      <mesh geometry={cochG} material={coch} position={[0.15, -0.05, 0]} rotation={[0, Math.PI / 2, 0]} />
      <mesh geometry={semiG} material={semi} position={[0.0, 0.35, 0]} />
      <mesh material={nerve} geometry={useMemo(() => varTube(curve([[0.35, 0.1, 0], [0.8, 0.2, 0], [1.4, 0.35, 0]]), 20, 10, () => 0.07), [])} />
      <mesh material={tube} geometry={useMemo(() => varTube(curve([[-0.55, -0.05, 0], [-0.3, -0.6, 0.2], [0.1, -1.2, 0.4]]), 20, 10, () => 0.06), [])} />
      <instancedMesh ref={wave} args={[new THREE.TorusGeometry(0.15, 0.012, 6, 20).rotateY(Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#9fe8ff', toneMapped: false, transparent: true, opacity: 0.6 }), 8]} frustumCulled={false} />
      <Anchor id="pinna" position={[-2.6, 1.0, 0.2]} /><Anchor id="canal" position={[-1.6, 0.45, 0.1]} /><Anchor id="eardrum" position={[-0.75, -0.15, 0.15]} />
      <Anchor id="ossicles" position={[-0.45, 0.45, 0.1]} /><Anchor id="cochlea" position={[0.15, -0.35, 0.3]} /><Anchor id="canals" position={[0.05, 0.7, 0.1]} />
      <Anchor id="nerve" position={[1.0, 0.4, 0.1]} /><Anchor id="eustachian" position={[-0.2, -0.75, 0.35]} />
    </group>
  );
}

function Cochlea() {
  const S = useScene();
  const freq = useCtl('freq', 1000);
  const bm = useHi(['membrane', 'basilar'], '#f2c94c', { rough: 0.4, side: THREE.DoubleSide });
  const hair = useHi(['hair', 'cells'], '#ff9db8', { rough: 0.4 });
  const tect = useHi('tectorial', '#bfe3ff', { rough: 0.3, opacity: 0.5, side: THREE.DoubleSide });
  const nerve = useHi('nerve', PAL.nerve, { rough: 0.4 });
  const N = 40;
  const ref = useRef<THREE.InstancedMesh>(null);
  useFrame(({ clock }) => { const im = ref.current; if (!im) return; const M = new THREE.Matrix4(), t = clock.elapsedTime; const place = Math.log10(Math.max(20, Math.min(20000, freq)) / 20) / 3; for (let i = 0; i < N * 3; i++) { const j = i % N, row = Math.floor(i / N), x = -2 + (j / (N - 1)) * 4, pos = 1 - j / (N - 1); const amp = Math.exp(-((pos - place) ** 2) / 0.006) * 0.12; M.makeTranslation(x, 0.12 + Math.sin(t * 20) * amp, (row - 1) * 0.15); im.setMatrixAt(i, M); } im.instanceMatrix.needsUpdate = true; void S; });
  return (
    <group>
      <mesh material={bm} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[4.2, 0.6 + 0.0, 40, 1]} /></mesh>
      <instancedMesh ref={ref} args={[new THREE.CylinderGeometry(0.035, 0.04, 0.2, 8), hair, N * 3]} frustumCulled={false} />
      <mesh material={tect} position={[0, 0.35, -0.05]} rotation={[-Math.PI / 2 + 0.1, 0, 0]}><planeGeometry args={[4.2, 0.6]} /></mesh>
      <mesh material={nerve} geometry={useMemo(() => merge(Array.from({ length: 10 }, (_, i) => varTube(curve([[-1.9 + i * 0.42, 0.0, 0], [-1.9 + i * 0.42, -0.3, 0.3], [-1.9 + i * 0.3, -0.8, 0.9]]), 12, 5, () => 0.02))), [])} />
      <Anchor id="basilar" position={[1.6, 0.05, 0.4]} /><Anchor id="hair" position={[-0.5, 0.3, 0.25]} /><Anchor id="tectorial" position={[0.6, 0.45, -0.2]} /><Anchor id="nerve" position={[-1.0, -0.6, 0.8]} /><Anchor id="base" position={[-2.0, 0.3, 0]} /><Anchor id="apex" position={[2.0, 0.3, 0]} />
    </group>
  );
}

function Skin({ p }: { p: SenseP }) {
  const S = useScene();
  const W = 3, D = 2;
  const epi = useHi(['epidermis', 'skin'], '#f0c4a8', { rough: 0.55, sheen: 0.6 });
  const derm = useHi('dermis', '#e8a090', { rough: 0.6, opacity: 0.45 });
  const fat = useHi(['fat', 'hypodermis'], '#f1d48a', { rough: 0.5, clear: 0.4, opacity: 0.6 });
  const hairM = useHi(['hair', 'follicle'], '#3a2a20', { rough: 0.5 });
  const fol = useHi('follicle', '#e8b8a0', { rough: 0.5 });
  const sweat = useHi('sweat', '#9fd0ff', { rough: 0.3, clear: 0.6 });
  const oil = useHi('oil', '#f2e070', { rough: 0.3 });
  const art = useHi('vessels', PAL.artery, { rough: 0.4 });
  const nerveM = useHi(['nerve', 'receptor'], PAL.nerve, { rough: 0.4 });
  const mel = useHi('melanin', '#4a2a1a', { rough: 0.6 });
  const burnM = useHi('burn', '#7a1a1a', { rough: 0.8, opacity: 0.7 });
  const top = useMemo(() => displace(new THREE.BoxGeometry(W, 0.3, D, 60, 2, 40), (q) => (q.y > 0.1 ? 0.03 * Math.sin(q.x * 14) * Math.sin(q.z * 9) : 0)), []);
  const fats = useMemo(() => { const r = rng(2), out: THREE.Vector3[] = []; for (let i = 0; i < 30; i++) out.push(V((r() - 0.5) * W * 0.95, -1.3 + (r() - 0.5) * 0.4, (r() - 0.5) * D * 0.9)); return out; }, []);
  const fr = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => { const im = fr.current; if (!im) return; const M = new THREE.Matrix4(); fats.forEach((f, i) => { M.makeTranslation(f.x, f.y, f.z); im.setMatrixAt(i, M); }); im.instanceMatrix.needsUpdate = true; im.computeBoundingSphere(); }, [fats]);
  const capillary = useMemo(() => merge([0, 1, 2].map((i) => varTube(curve([[-1.4, -0.2 - i * 0.25, -0.5 + i * 0.4], [0, -0.1 - i * 0.2, -0.3 + i * 0.4], [1.4, -0.25 - i * 0.25, -0.5 + i * 0.4]]), 30, 6, () => 0.035))), []);
  const burn = p.burn ?? 0;
  void S;
  return (
    <group>
      <mesh geometry={top} material={epi} position={[0, 0.15, 0]} />
      <mesh material={derm} position={[0, -0.5, 0]}><boxGeometry args={[W, 1.0, D]} /></mesh>
      <mesh material={fat} position={[0, -1.3, 0]} scale={[1, 1, 1]}><boxGeometry args={[W, 0.6, D]} /></mesh>
      <instancedMesh ref={fr} args={[new THREE.SphereGeometry(0.22, 14, 10), fat, fats.length]} />
      {[-0.8, 0.6].map((x, i) => <group key={i} position={[x, 0, 0.3 - i * 0.5]}><mesh material={fol} position={[0, -0.55, 0]}><cylinderGeometry args={[0.1, 0.13, 0.9, 14]} /></mesh><mesh material={hairM} position={[0, 0.1, 0]} rotation={[0, 0, 0.3]}><cylinderGeometry args={[0.025, 0.035, 1.6, 8]} /></mesh><mesh material={oil} position={[0.18, -0.35, 0]}><sphereGeometry args={[0.1, 12, 8]} /></mesh></group>)}
      <mesh material={sweat} geometry={useMemo(() => { const pts: THREE.Vector3[] = []; for (let i = 0; i < 30; i++) pts.push(V(1.1 + Math.cos(i) * 0.08, -0.9 + Math.sin(i * 0.5) * 0.05 + (i > 20 ? (i - 20) * 0.1 : 0), 0.4 + Math.sin(i) * 0.08)); return varTube(new THREE.CatmullRomCurve3(pts), 80, 6, () => 0.035); }, [])} />
      <mesh geometry={capillary} material={art} />
      <mesh material={nerveM} geometry={useMemo(() => merge([varTube(curve([[-1.4, -0.9, 0.8], [-0.3, -0.7, 0.7], [0.2, -0.15, 0.7]]), 20, 5, () => 0.025), new THREE.SphereGeometry(0.09, 12, 8).scale(1, 1.4, 1).translate(0.2, -0.1, 0.7), new THREE.SphereGeometry(0.14, 14, 10).scale(1, 1.4, 1).translate(-0.9, -0.85, 0.8)]), [])} />
      {Array.from({ length: 12 }, (_, i) => <mesh key={i} material={mel} position={[-1.3 + i * 0.24, 0.02, 0.85]}><sphereGeometry args={[0.03, 6, 4]} /></mesh>)}
      {burn > 0 && <mesh material={burnM} position={[0.6, 0.3 - burn * 0.5, 0]} scale={[0.8, burn, 0.8]}><boxGeometry args={[1.2, 1.0, 1.2]} /></mesh>}
      {p.melanoma && <mesh material={mel} position={[-0.2, 0.32, 0.2]} scale={[1.3, 0.2, 1]}><sphereGeometry args={[0.3, 20, 14]} /></mesh>}
      <Anchor id="epidermis" position={[-1.3, 0.35, 0.95]} /><Anchor id="dermis" position={[-1.3, -0.45, 1.0]} /><Anchor id="fat" position={[-1.3, -1.3, 1.0]} /><Anchor id="hair" position={[-0.5, 0.75, 0.3]} />
      <Anchor id="follicle" position={[-0.8, -0.6, 0.45]} /><Anchor id="sweat" position={[1.1, -0.9, 0.55]} /><Anchor id="oil" position={[-0.6, -0.35, 0.4]} /><Anchor id="vessels" position={[0.4, -0.15, -0.1]} />
      <Anchor id="receptor" position={[-0.9, -0.85, 0.95]} /><Anchor id="nerve" position={[0.2, -0.1, 0.85]} /><Anchor id="melanin" position={[0.9, 0.05, 0.95]} />{burn > 0 && <Anchor id="burn" position={[0.6, 0.4, 0.6]} />}
    </group>
  );
}

function Nose() {
  const epi = useHi(['epithelium', 'receptor'], '#f0b8a8', { rough: 0.5 });
  const bulb = useHi('bulb', PAL.nerve, { rough: 0.45 });
  const bone = useHi('bone', PAL.bone, { rough: 0.6 });
  const mol = useRef<THREE.InstancedMesh>(null);
  const rec = useMemo(() => Array.from({ length: 14 }, (_, i) => (i - 6.5) * 0.28), []);
  useFrame(({ clock }) => { const im = mol.current; if (!im) return; const M = new THREE.Matrix4(); for (let i = 0; i < im.count; i++) { const k = (clock.elapsedTime * 0.3 + i * 0.11) % 1; M.makeTranslation((i % 7 - 3) * 0.5 + Math.sin(i + k * 5) * 0.1, -1.6 + k * 1.1, (i % 3 - 1) * 0.3); im.setMatrixAt(i, M); } im.instanceMatrix.needsUpdate = true; });
  return (
    <group>
      <mesh material={bulb} position={[0, 1.1, 0]} scale={[2.2, 0.35, 0.6]}><sphereGeometry args={[1, 30, 20]} /></mesh>
      <mesh material={bone} position={[0, 0.45, 0]}><boxGeometry args={[4.2, 0.25, 1.2]} /></mesh>
      <mesh material={epi} position={[0, -0.25, 0]}><boxGeometry args={[4.2, 0.35, 1.2]} /></mesh>
      {rec.map((x, i) => <group key={i}><mesh material={epi} geometry={varTube(curve([[x, -0.45, 0.2], [x, -0.1, 0.2], [x * 0.7, 0.45, 0.1], [x * 0.5, 0.95, 0]]), 20, 4, () => 0.02)} /><mesh material={epi} position={[x, -0.55, 0.2]}><sphereGeometry args={[0.05, 8, 6]} /></mesh></group>)}
      <instancedMesh ref={mol} args={[new THREE.IcosahedronGeometry(0.05, 0), new THREE.MeshBasicMaterial({ color: '#c8ff9a', toneMapped: false }), 30]} frustumCulled={false} />
      <Anchor id="bulb" position={[0.6, 1.4, 0.4]} /><Anchor id="bone" position={[-1.8, 0.55, 0.65]} /><Anchor id="epithelium" position={[1.6, -0.25, 0.65]} /><Anchor id="receptor" position={[0.3, -0.55, 0.35]} /><Anchor id="odor" position={[-1.0, -1.3, 0.3]} />
    </group>
  );
}

function Taste() {
  const bud = useHi(['bud', 'cells'], '#f2a8b8', { rough: 0.45, sheen: 0.6, opacity: 0.85 });
  const tongue = useHi(['tongue', 'papilla'], '#e87a8a', { rough: 0.6, sheen: 0.8, opacity: 0.4 });
  const nerve = useHi('nerve', PAL.nerve, { rough: 0.4 });
  const cells = useMemo(() => Array.from({ length: 16 }, (_, i) => { const a = (i / 16) * TAU; return { x: Math.cos(a) * 0.32, z: Math.sin(a) * 0.32, c: ['#ff9d6b', '#f2c94c', '#5ac8ff', '#9ad04f', '#c98bd9'][i % 5] }; }), []);
  return (
    <group>
      <mesh material={tongue} position={[0, -0.6, 0]}><boxGeometry args={[3.4, 1.2, 2]} /></mesh>
      {[-1.1, 1.1].map((x) => <mesh key={x} material={tongue} position={[x, 0.2, 0]}><coneGeometry args={[0.3, 0.6, 16]} /></mesh>)}
      <mesh material={bud} position={[0, -0.3, 0]} scale={[1, 1.4, 1]}><sphereGeometry args={[0.45, 30, 20]} /></mesh>
      {cells.map((c, i) => <mesh key={i} position={[c.x, -0.3, c.z]} rotation={[c.z * 0.9, 0, -c.x * 0.9]}><capsuleGeometry args={[0.07, 0.6, 4, 8]} /><meshStandardMaterial color={c.c} roughness={0.5} /></mesh>)}
      <mesh material={nerve} geometry={useMemo(() => varTube(curve([[0, -0.9, 0], [0.3, -1.1, 0.3], [1.4, -1.25, 0.6]]), 20, 6, () => 0.05), [])} />
      <Anchor id="bud" position={[0.5, -0.1, 0.4]} /><Anchor id="cells" position={[0.25, -0.35, 0.38]} /><Anchor id="papilla" position={[1.1, 0.5, 0.2]} /><Anchor id="pore" position={[0, 0.35, 0]} /><Anchor id="nerve" position={[1.2, -1.15, 0.6]} />
    </group>
  );
}

export default function Senses({ p }: { p: SenseP }) {
  switch (p.mode) {
    case 'retina': return <Retina />;
    case 'ear': return <Ear />;
    case 'cochlea': return <Cochlea />;
    case 'skin': return <Skin p={p} />;
    case 'nose': return <Nose />;
    case 'taste': return <Taste />;
    default: return <Eye p={p} />;
  }
}
