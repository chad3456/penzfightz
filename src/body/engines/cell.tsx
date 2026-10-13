/**
 * The cell. A cutaway animal cell with its organelles in place; close-ups
 * of the mitochondrion, the nucleus and the membrane; mitosis played step
 * by step; a cell dying tidily (apoptosis); a membrane swallowing cargo
 * (endocytosis); pumps and channels moving ions; ATP synthase turning; a
 * kinesin motor walking a microtubule; and a line-up of cell types.
 */
import { useLayoutEffect, useMemo, useRef, type ReactElement } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Anchor, useHi, useScene } from '../stage';
import { V, rng, blob, curve, varTube, TAU, smooth, merge, fibSphere, displace, fbm, lerp, mergeVertices } from '../kit';

type Vec = [number, number, number];
export interface CellP { mode?: 'cell' | 'mito' | 'nucleus' | 'membrane' | 'mitosis' | 'meiosis' | 'apoptosis' | 'endocytosis' | 'transport' | 'atp' | 'kinesin' | 'types' | 'cilia' | 'junctions' | 'golgi'; cut?: boolean }

const cutPlane = new THREE.Plane(V(0, 0, -1), 0.0);
function useClip() { const { gl } = useThree(); gl.localClippingEnabled = true; return cutPlane; }

function Mito({ len = 1.1, r = 0.32, cut = true, id = 'mitochondrion' }: { len?: number; r?: number; cut?: boolean; id?: string }) {
  const plane = useClip();
  const outer = useHi(id, '#e86a4a', { rough: 0.45, clear: 0.5, side: THREE.DoubleSide });
  const inner = useHi(['cristae', id], '#f2a06a', { rough: 0.5, side: THREE.DoubleSide });
  const matrix = useHi(['matrix', id], '#7a2e2a', { rough: 0.8, side: THREE.DoubleSide });
  useMemo(() => { if (cut) for (const m of [outer, matrix]) m.clippingPlanes = [plane]; }, [cut, outer, matrix, plane]);
  const cristae = useMemo(() => { const gs: THREE.BufferGeometry[] = []; const n = Math.round(len / 0.13); for (let i = 0; i < n; i++) { const x = -len / 2 + (i + 0.5) * (len / n), side = i % 2 ? 1 : -1; const g = new THREE.SphereGeometry(1, 20, 14); g.scale(0.028, r * 0.62, r * 0.78); g.translate(x, side * r * 0.3, 0); gs.push(g); } return merge(gs); }, [len, r]);
  return (
    <group>
      <mesh material={outer} rotation={[0, 0, Math.PI / 2]}><capsuleGeometry args={[r, len, 12, 28]} /></mesh>
      <mesh material={matrix} rotation={[0, 0, Math.PI / 2]}><capsuleGeometry args={[r * 0.9, len * 0.97, 12, 28]} /></mesh>
      <mesh geometry={cristae} material={inner} />
    </group>
  );
}

function Cutaway() {
  const plane = useClip();
  const mem = useHi(['membrane', 'cytoplasm'], '#f0b38a', { rough: 0.5, sheen: 0.8, clear: 0.4, side: THREE.DoubleSide });
  const cyto = useHi('cytoplasm', '#f6d9c4', { rough: 0.9, opacity: 0.18, side: THREE.BackSide });
  const nuc = useHi(['nucleus', 'envelope', 'pore'], '#6b4fa8', { rough: 0.45, clear: 0.5, side: THREE.DoubleSide });
  const nucIn = useHi(['nucleus', 'chromatin'], '#8f6fc8', { rough: 0.7, side: THREE.DoubleSide });
  const nl = useHi('nucleolus', '#3a2a6a', { rough: 0.5 });
  const rer = useHi(['rough-er', 'ribosome'], '#5ab8a0', { rough: 0.45, side: THREE.DoubleSide });
  const ser = useHi('smooth-er', '#8fd0b8', { rough: 0.45 });
  const gol = useHi('golgi', '#f2c94c', { rough: 0.4, clear: 0.5, side: THREE.DoubleSide });
  const lys = useHi('lysosome', '#c44f9e', { rough: 0.35, clear: 0.6 });
  const per = useHi('peroxisome', '#9ad04f', { rough: 0.35, clear: 0.6 });
  const ves = useHi('vesicle', '#bfe3ff', { rough: 0.2, clear: 0.8, opacity: 0.85 });
  const cen = useHi('centrosome', '#e8e0c8', { rough: 0.4 });
  const mt = useHi(['cytoskeleton', 'microtubule'], '#9fc4ff', { rough: 0.4, opacity: 0.65 });
  const ribo = useHi('ribosome', '#3f3a8a', { rough: 0.5 });
  useMemo(() => { for (const m of [mem, nuc]) m.clippingPlanes = [plane]; }, [mem, nuc, plane]);
  const cellG = useMemo(() => blob(2.2, [1.15, 0.9, 1], 0.05, 1.2, 2, 6), []);
  const er = useMemo(() => { const gs: THREE.BufferGeometry[] = []; for (let i = 0; i < 4; i++) { const r0 = 1.0 + i * 0.16; const g = new THREE.SphereGeometry(r0, 48, 24, 0.3, 2.6, 0.5, 2.0); gs.push(displace(g, (q) => 0.06 * Math.sin(Math.atan2(q.z, q.x) * 14 + i) + 0.03 * fbm(q.x * 3, q.y * 3, q.z * 3, 2))); } return merge(gs); }, []);
  const erRibo = useMemo(() => { const r = rng(3), pts: THREE.Vector3[] = []; while (pts.length < 220) { const th = 0.3 + r() * 2.6, ph = 0.5 + r() * 2.0, rr = 1.02 + Math.floor(r() * 4) * 0.16; pts.push(V(Math.cos(th) * Math.sin(ph) * rr, Math.cos(ph) * rr, Math.sin(th) * Math.sin(ph) * rr)); } return pts; }, []);
  const golgi = useMemo(() => merge(Array.from({ length: 5 }, (_, i) => { const g = new THREE.SphereGeometry(0.9 - i * 0.06, 32, 8, -0.6, 1.2, 1.25, 0.5); g.translate(0, 0, -i * 0.09); return g; })), []);
  const smooth_er = useMemo(() => merge(Array.from({ length: 6 }, (_, i) => varTube(curve(Array.from({ length: 6 }, (_, k) => V(-1.6 + k * 0.25 + Math.sin(i + k) * 0.15, -0.6 - i * 0.12 + Math.cos(k * 1.7 + i) * 0.15, 0.6 + Math.sin(k + i * 2) * 0.3))), 40, 6, () => 0.05))), []);
  const mts = useMemo(() => merge(fibSphere(16, 1).map((d) => varTube(curve([V(0.9, 0.9, -0.3), V(0.9, 0.9, -0.3).addScaledVector(d, 1.0), V(0.9, 0.9, -0.3).addScaledVector(d.clone().add(V(0.2, 0, 0)).normalize(), 2.1)]), 20, 4, () => 0.015))), []);
  const rref = useRef<THREE.InstancedMesh>(null), fref = useRef<THREE.InstancedMesh>(null);
  const free = useMemo(() => { const r = rng(8); return Array.from({ length: 160 }, () => V((r() - 0.5) * 4.4, (r() - 0.5) * 3.4, (r() - 0.5) * 4)).filter((p) => p.length() > 1.7 && p.length() < 2.3); }, []);
  useLayoutEffect(() => { const M = new THREE.Matrix4(); const put = (im: THREE.InstancedMesh | null, pts: THREE.Vector3[]) => { if (!im) return; pts.forEach((p, i) => { M.makeTranslation(p.x, p.y, p.z); im.setMatrixAt(i, M); }); im.instanceMatrix.needsUpdate = true; im.computeBoundingSphere(); }; put(rref.current, erRibo); put(fref.current, free); }, [erRibo, free]);
  const mitos: { at: Vec; rot: Vec; len: number }[] = [{ at: [-1.2, 0.8, 0.2], rot: [0, 0.4, 0.6], len: 0.9 }, { at: [1.3, -0.6, 0.4], rot: [0.3, 0, -0.4], len: 1.0 }, { at: [-0.4, -1.3, 0.3], rot: [0, 0, 1.4], len: 0.8 }, { at: [1.5, 0.5, -0.8], rot: [0.5, 0.2, 0.3], len: 0.8 }];
  const pores = useMemo(() => fibSphere(40, 0.82), []);
  return (
    <group>
      <mesh geometry={cellG} material={mem} />
      <mesh geometry={cellG} material={cyto} scale={0.99} />
      <mesh material={nuc}><sphereGeometry args={[0.82, 48, 32]} /></mesh>
      <mesh material={nucIn}><sphereGeometry args={[0.76, 40, 28]} /></mesh>
      {pores.filter((p) => p.z < 0.05).map((p, i) => <mesh key={i} material={nuc} position={p} quaternion={new THREE.Quaternion().setFromUnitVectors(V(0, 0, 1), p.clone().normalize())}><torusGeometry args={[0.05, 0.02, 6, 12]} /></mesh>)}
      <mesh material={nl} position={[0.2, 0.15, -0.2]}><sphereGeometry args={[0.28, 24, 16]} /></mesh>
      <mesh geometry={er} material={rer} rotation={[0, Math.PI, 0]} />
      <instancedMesh ref={rref} args={[new THREE.SphereGeometry(0.035, 6, 4), ribo, erRibo.length]} rotation={[0, Math.PI, 0]} />
      <instancedMesh ref={fref} args={[new THREE.SphereGeometry(0.035, 6, 4), ribo, free.length]} />
      <mesh geometry={smooth_er} material={ser} />
      <mesh geometry={golgi} material={gol} position={[1.0, 0.3, 0.4]} rotation={[0.2, -0.6, 0.3]} />
      {mitos.map((m, i) => <group key={i} position={m.at} rotation={m.rot}><Mito len={m.len} r={0.26} cut={false} /></group>)}
      {([[0.4, -1.2, -0.6], [-1.4, -0.3, -0.8], [0.2, 1.4, -0.3]] as Vec[]).map((p, i) => <mesh key={i} material={lys} position={p}><sphereGeometry args={[0.2, 20, 14]} /></mesh>)}
      {([[-1.5, 0.1, 0.7], [0.9, -1.2, 0.9]] as Vec[]).map((p, i) => <mesh key={i} material={per} position={p}><sphereGeometry args={[0.14, 18, 12]} /></mesh>)}
      {([[1.6, 0.9, 0.5], [1.75, 0.6, 0.2], [1.45, 1.2, 0.0]] as Vec[]).map((p, i) => <mesh key={i} material={ves} position={p}><sphereGeometry args={[0.11, 16, 12]} /></mesh>)}
      <group position={[0.9, 0.9, -0.3]}><mesh material={cen}><cylinderGeometry args={[0.06, 0.06, 0.25, 12]} /></mesh><mesh material={cen} rotation={[Math.PI / 2, 0, 0]} position={[0.1, 0, 0]}><cylinderGeometry args={[0.06, 0.06, 0.25, 12]} /></mesh></group>
      <mesh geometry={mts} material={mt} />
      <Anchor id="membrane" position={[1.9, 1.3, 0.0]} /><Anchor id="nucleus" position={[-0.3, 0.45, 0.1]} inner /><Anchor id="nucleolus" position={[0.2, 0.15, 0.05]} inner />
      <Anchor id="rough-er" position={[-1.0, 0.1, -0.3]} inner /><Anchor id="smooth-er" position={[-1.2, -0.8, 0.7]} inner /><Anchor id="golgi" position={[1.0, 0.3, 0.45]} inner />
      <Anchor id="mitochondrion" position={[-1.2, 0.8, 0.45]} inner /><Anchor id="lysosome" position={[0.2, 1.4, 0.0]} inner /><Anchor id="peroxisome" position={[-1.5, 0.1, 0.8]} inner />
      <Anchor id="vesicle" position={[1.6, 0.9, 0.6]} inner /><Anchor id="centrosome" position={[0.9, 0.95, 0.0]} inner /><Anchor id="cytoskeleton" position={[1.5, 1.6, 0.2]} inner />
      <Anchor id="ribosome" position={[-1.8, -0.6, 0.5]} inner /><Anchor id="cytoplasm" position={[-0.6, -1.6, 0.6]} inner /><Anchor id="pore" position={[0.5, 0.55, -0.05]} inner />
    </group>
  );
}

function MitoClose() {
  const S = useScene();
  const atp = useHi('synthase', '#ffd25a', { rough: 0.4, emissive: '#ffd25a', ei: 0.2 });
  const pts = useMemo(() => { const r = rng(5); return Array.from({ length: 70 }, () => { const x = (r() - 0.5) * 2.6, a = r() * TAU; return V(x, Math.cos(a) * 0.6, Math.sin(a) * 0.6).multiplyScalar(1); }).filter((p) => p.z < 0.05); }, []);
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => { const im = ref.current; if (!im) return; const M = new THREE.Matrix4(); pts.forEach((p, i) => { M.makeTranslation(p.x, p.y, p.z); im.setMatrixAt(i, M); }); im.instanceMatrix.needsUpdate = true; im.computeBoundingSphere(); }, [pts]);
  void S;
  return (
    <group rotation={[0, 0, 0]}>
      <group scale={2.4}><Mito len={1.2} r={0.38} /></group>
      <instancedMesh ref={ref} args={[new THREE.SphereGeometry(0.05, 8, 6), atp, pts.length]} />
      <Anchor id="mitochondrion" position={[1.6, 0.9, 0.2]} /><Anchor id="cristae" position={[0.3, 0.3, -0.05]} inner /><Anchor id="matrix" position={[-0.6, -0.1, -0.1]} inner />
      <Anchor id="synthase" position={[0.8, 0.6, -0.05]} inner /><Anchor id="outer" position={[-1.5, 0.95, 0.0]} />
    </group>
  );
}

function Membrane({ endo, transport }: { endo?: boolean; transport?: boolean }) {
  const S = useScene();
  const N = 26, sp = 0.2;
  const headM = useHi(['phospholipid', 'head'], '#f0b38a', { rough: 0.4, clear: 0.4 });
  const tailM = useHi(['phospholipid', 'tail'], '#f2e2a8', { rough: 0.6 });
  const protM = useHi('protein', '#5ab8a0', { rough: 0.45, clear: 0.4 });
  const glyM = useHi('glycoprotein', '#c98bd9', { rough: 0.45 });
  const cholM = useHi('cholesterol', '#ffd25a', { rough: 0.4 });
  const pumpM = useHi('pump', '#e85aa0', { rough: 0.45 });
  const cargoM = useHi('cargo', '#9ad04f', { rough: 0.4 });
  const heads = useRef<THREE.InstancedMesh>(null), tails = useRef<THREE.InstancedMesh>(null);
  const grid = useMemo(() => { const out: { x: number; z: number }[] = []; for (let i = 0; i < N; i++) for (let j = 0; j < 14; j++) out.push({ x: (i - N / 2) * sp, z: (j - 7) * sp }); return out; }, []);
  const tailG = useMemo(() => merge([new THREE.CylinderGeometry(0.025, 0.02, 0.36, 5).translate(-0.03, -0.18, 0), new THREE.CylinderGeometry(0.025, 0.02, 0.36, 5).translate(0.03, -0.18, 0)]), []);
  const ions = useRef<THREE.InstancedMesh>(null);
  useFrame(({ clock }) => {
    const st = S.st.current, t = clock.elapsedTime, M = new THREE.Matrix4(), q = new THREE.Quaternion();
    const pit = endo ? smooth(st / 3) : 0;
    const dip = (x: number, z: number) => { const d = Math.hypot(x, z); return pit > 0 ? -Math.exp(-(d * d) / 0.35) * pit * 1.4 : 0; };
    const H = heads.current, T = tails.current; if (!H || !T) return;
    let k = 0;
    for (const g of grid) for (const side of [1, -1]) {
      const y0 = dip(g.x, g.z), y = y0 + side * 0.4, wob = 0.01 * Math.sin(t * 2 + g.x * 5 + g.z * 3);
      const hide = endo && pit > 0.85 && Math.hypot(g.x, g.z) < 0.5;
      M.makeTranslation(g.x, y + wob, g.z); if (hide) M.makeScale(0, 0, 0); H.setMatrixAt(k, M);
      q.setFromAxisAngle(V(1, 0, 0), side > 0 ? 0 : Math.PI); M.compose(V(g.x, y + wob, g.z), q, hide ? V(0, 0, 0) : V(1, 1, 1)); T.setMatrixAt(k, M); k++;
    }
    H.instanceMatrix.needsUpdate = true; T.instanceMatrix.needsUpdate = true;
    const I = ions.current; if (I) { for (let i = 0; i < I.count; i++) { const ph = ((t * 0.35 + i * 0.137) % 1), x = i % 2 ? -1.2 : 1.6; M.makeTranslation(x + Math.sin(i) * 0.05, 1.3 - ph * 2.6 * (i % 2 ? 1 : -1) * 0.5 - (i % 2 ? 0 : 0) , (i % 3 - 1) * 0.05); I.setMatrixAt(i, M); } I.instanceMatrix.needsUpdate = true; }
  });
  const ves = useRef<THREE.Group>(null);
  useFrame(() => { if (ves.current) { const st = S.st.current; ves.current.position.y = lerp(1.2, -1.6, smooth(st / 3)); ves.current.scale.setScalar(st > 2.7 ? 1 : 0.9); } });
  return (
    <group>
      <instancedMesh ref={heads} args={[new THREE.SphereGeometry(0.085, 10, 8), headM, grid.length * 2]} frustumCulled={false} />
      <instancedMesh ref={tails} args={[tailG, tailM, grid.length * 2]} frustumCulled={false} />
      {!endo && (<>
        <mesh material={protM} position={[-1.2, 0, 0.2]}><cylinderGeometry args={[0.28, 0.28, 1.15, 16]} /></mesh>
        <mesh material={protM} position={[-1.2, 0, 0.2]}><cylinderGeometry args={[0.1, 0.1, 1.2, 12]} /><meshStandardMaterial color="#0d2a2a" /></mesh>
        <mesh material={glyM} position={[0.4, 0.55, -0.4]}><capsuleGeometry args={[0.12, 0.5, 6, 10]} /></mesh>
        {[0, 1, 2, 3].map((i) => <mesh key={i} material={glyM} position={[0.4 + Math.cos(i * 1.6) * 0.18, 1.0 + i * 0.1, -0.4 + Math.sin(i * 1.6) * 0.18]}><sphereGeometry args={[0.07, 10, 8]} /></mesh>)}
        {([[1.0, 0.25, 0.6], [-0.4, -0.3, -0.8], [2.0, 0.25, -0.2]] as Vec[]).map((p, i) => <mesh key={i} material={cholM} position={p}><capsuleGeometry args={[0.045, 0.22, 4, 8]} /></mesh>)}
        {transport && <mesh material={pumpM} position={[1.6, 0, 0.1]}><boxGeometry args={[0.55, 1.15, 0.5]} /></mesh>}
        {transport && <instancedMesh ref={ions} args={[new THREE.SphereGeometry(0.06, 10, 8), new THREE.MeshBasicMaterial({ color: '#ffe36b', toneMapped: false }), 14]} frustumCulled={false} />}
        <Anchor id="protein" position={[-1.2, 0.7, 0.45]} /><Anchor id="glycoprotein" position={[0.4, 1.35, -0.3]} /><Anchor id="cholesterol" position={[1.0, 0.45, 0.7]} />
        {transport && <Anchor id="pump" position={[1.6, 0.7, 0.4]} />}
      </>)}
      {endo && <group ref={ves}><mesh material={cargoM}><sphereGeometry args={[0.28, 20, 14]} /></mesh>{[0, 1, 2, 3, 4].map((i) => <mesh key={i} material={protM} position={[Math.cos(i * 1.25) * 0.42, 0.25, Math.sin(i * 1.25) * 0.42]}><boxGeometry args={[0.08, 0.2, 0.08]} /></mesh>)}<Anchor id="cargo" position={[0.3, 0.3, 0.3]} /></group>}
      <Anchor id="phospholipid" position={[-2.2, 0.55, 0.9]} /><Anchor id="head" position={[2.4, 0.5, 1.1]} /><Anchor id="tail" position={[-2.4, 0.15, 1.3]} />
      {endo && <Anchor id="pit" position={[0.5, -0.4, 0.5]} />}
    </group>
  );
}

function Division({ meiosis }: { meiosis?: boolean }) {
  const S = useScene();
  const mem = useHi(['membrane', 'cell'], '#f0b38a', { rough: 0.5, sheen: 0.8, opacity: 0.35, side: THREE.DoubleSide });
  const chr = useHi('chromosome', '#4f8fe0', { rough: 0.4, clear: 0.5 });
  const chr2 = useHi('chromosome', '#e8584a', { rough: 0.4, clear: 0.5 });
  const spM = useHi('spindle', '#bfe3ff', { rough: 0.4, opacity: 0.5 });
  const cenM = useHi('centrosome', '#ffd25a', { rough: 0.4, emissive: '#ffd25a', ei: 0.3 });
  const nucM = useHi('nucleus', '#8f6fc8', { rough: 0.5, opacity: 0.4 });
  const L = useRef<THREE.Mesh>(null), Rr = useRef<THREE.Mesh>(null), chrs = useRef<THREE.Group>(null), sp = useRef<THREE.Group>(null), nucR = useRef<THREE.Mesh>(null);
  const C = 4;
  useFrame(() => {
    const st = S.st.current; // 0 inter, 1 pro, 2 meta, 3 ana, 4 telo
    const pinch = smooth(st - 3.2), split = smooth(st - 2.4);
    if (L.current && Rr.current) { L.current.position.x = -pinch * 1.05; Rr.current.position.x = pinch * 1.05; const s = 1 - pinch * 0.2; L.current.scale.set(s + (1 - pinch) * 0.15, s, s); Rr.current.scale.set(s + (1 - pinch) * 0.15, s, s); }
    if (nucR.current) { nucR.current.scale.setScalar(1 - smooth(st - 0.3) * 0.98); }
    if (sp.current) sp.current.visible = st > 1.3 && st < 3.8;
    const g = chrs.current; if (!g) return;
    g.children.forEach((ch, i) => {
      const pair = Math.floor(i / 2), sister = i % 2 ? 1 : -1;
      const cond = smooth(st - 0.5);
      const scat = V(Math.cos(pair * 1.7) * 0.5, Math.sin(pair * 2.3) * 0.5, Math.cos(pair * 1.1) * 0.3);
      const plate = V(0, (pair - (C - 1) / 2) * 0.42, 0);
      let pos = scat.clone().lerp(plate, smooth(st - 1.5)).add(V(sister * 0.07 * (1 - split), 0, 0));
      pos = pos.add(V(sister * split * (1.1 + pinch * 0.2), 0, 0));
      ch.position.copy(pos); ch.scale.set(cond * 0.9 + 0.1, 0.6 + cond * 0.4, cond * 0.9 + 0.1);
      ch.rotation.z = split * sister * 0.3;
    });
  });
  void meiosis;
  return (
    <group>
      <mesh ref={L} material={mem}><sphereGeometry args={[1.25, 48, 32, 0, TAU, 0, Math.PI]} /></mesh>
      <mesh ref={Rr} material={mem}><sphereGeometry args={[1.25, 48, 32]} /></mesh>
      <mesh ref={nucR} material={nucM}><sphereGeometry args={[0.75, 32, 24]} /></mesh>
      <group ref={chrs}>{Array.from({ length: C * 2 }, (_, i) => <mesh key={i} material={Math.floor(i / 2) % 2 ? chr2 : chr}><capsuleGeometry args={[0.06, 0.32, 6, 10]} /></mesh>)}</group>
      <group ref={sp}>
        {[-1, 1].map((s) => <mesh key={s} material={cenM} position={[s * 1.15, 0, 0]}><sphereGeometry args={[0.09, 14, 10]} /></mesh>)}
        {Array.from({ length: 14 }, (_, i) => { const y = (i % 7 - 3) * 0.14, s = i < 7 ? -1 : 1; return <mesh key={i} material={spM} geometry={varTube(curve([[s * 1.15, 0, 0], [s * 0.6, y * 1.2, 0.05], [0, y * 1.1, 0]]), 16, 4, () => 0.008)} />; })}
      </group>
      <Anchor id="chromosome" position={[0.25, 0.65, 0.3]} /><Anchor id="spindle" position={[0.6, -0.3, 0.2]} /><Anchor id="centrosome" position={[1.15, 0.15, 0.1]} /><Anchor id="membrane" position={[0.8, 1.0, 0.5]} /><Anchor id="nucleus" position={[-0.4, 0.4, 0.4]} />
    </group>
  );
}

function Apoptosis() {
  const S = useScene();
  const m = useHi(['cell', 'bleb'], '#e7a28c', { rough: 0.5, sheen: 0.7 });
  const nucM = useHi('nucleus', '#6b4fa8', { rough: 0.5 });
  const bodyM = useHi('body', '#d98a7a', { rough: 0.5 });
  const base = useMemo(() => { const g = new THREE.IcosahedronGeometry(1.2, 5); g.deleteAttribute('normal'); g.deleteAttribute('uv'); const mg = mergeVertices(g); mg.computeVertexNormals(); return { g: mg, p0: (mg.attributes.position.array as Float32Array).slice() }; }, []);
  const ref = useRef<THREE.Mesh>(null), bodies = useRef<THREE.Group>(null), nuc = useRef<THREE.Group>(null);
  const bl = useMemo(() => fibSphere(14, 1), []);
  useFrame(() => {
    const st = S.st.current, shrink = smooth(st - 0.5), bleb = smooth(st - 1.4), frag = smooth(st - 2.5);
    const me = ref.current; if (me) {
      const pos = base.g.attributes.position as THREE.BufferAttribute, n = V();
      for (let i = 0; i < pos.count; i++) { n.set(base.p0[i * 3], base.p0[i * 3 + 1], base.p0[i * 3 + 2]); const r = n.length(); n.normalize(); let d = 0; for (const b of bl) d += 0.55 * bleb * Math.pow(Math.max(0, n.dot(b)), 30); const rr = r * (1 - shrink * 0.25) + d * 0.6; pos.setXYZ(i, n.x * rr, n.y * rr, n.z * rr); }
      pos.needsUpdate = true; base.g.computeVertexNormals(); me.visible = frag < 0.9; me.scale.setScalar(1 - frag * 0.5);
    }
    if (bodies.current) bodies.current.children.forEach((c, i) => { c.visible = frag > 0.05; const d = bl[i]; c.position.copy(d.clone().multiplyScalar(0.6 + frag * 1.4)); c.scale.setScalar(frag * 0.9 + 0.05); });
    if (nuc.current) nuc.current.children.forEach((c, i) => { const k = smooth(st - 1); c.position.set(Math.cos(i * 2.1) * 0.25 * k, Math.sin(i * 2.1) * 0.25 * k, 0); c.scale.setScalar(1 - k * 0.45); });
  });
  return (
    <group>
      <mesh ref={ref} geometry={base.g} material={m} />
      <group ref={nuc}>{[0, 1, 2].map((i) => <mesh key={i} material={nucM}><sphereGeometry args={[0.33, 20, 14]} /></mesh>)}</group>
      <group ref={bodies}>{bl.map((_, i) => <mesh key={i} material={bodyM}><sphereGeometry args={[0.25, 18, 12]} /></mesh>)}</group>
      <Anchor id="cell" position={[0.8, 0.8, 0.5]} /><Anchor id="nucleus" position={[0, 0, 0.6]} inner /><Anchor id="bleb" position={[1.1, -0.6, 0.6]} /><Anchor id="body" position={[-1.6, 1.0, 0.5]} />
    </group>
  );
}

function ATP() {
  const rot = useRef<THREE.Group>(null);
  const mem = useHi('membrane', '#f0b38a', { rough: 0.5, opacity: 0.6 });
  const fo = useHi('fo', '#5ab8a0', { rough: 0.4, clear: 0.4 });
  const f1 = useHi('f1', '#ffd25a', { rough: 0.4, clear: 0.4 });
  const st = useHi('stalk', '#e85aa0', { rough: 0.4 });
  const prot = useRef<THREE.InstancedMesh>(null);
  useFrame(({ clock }, dt) => { if (rot.current) rot.current.rotation.y += dt * 2.2; const im = prot.current; if (!im) return; const M = new THREE.Matrix4(), t = clock.elapsedTime; for (let i = 0; i < im.count; i++) { const k = (t * 0.4 + i / im.count) % 1, a = i * 2.4; M.makeTranslation(Math.cos(a) * (0.75 - k * 0.2), -1.6 + k * 1.3, Math.sin(a) * (0.75 - k * 0.2)); im.setMatrixAt(i, M); } im.instanceMatrix.needsUpdate = true; });
  return (
    <group>
      <mesh material={mem} position={[0, -0.45, 0]}><boxGeometry args={[4, 0.6, 3]} /></mesh>
      <group ref={rot}><mesh material={fo} position={[0, -0.45, 0]}><cylinderGeometry args={[0.6, 0.6, 0.65, 24]} /></mesh><mesh material={st} position={[0, 0.3, 0]}><cylinderGeometry args={[0.1, 0.1, 1.1, 12]} /></mesh></group>
      {Array.from({ length: 6 }, (_, i) => <mesh key={i} material={f1} position={[Math.cos(i * TAU / 6) * 0.38, 1.05, Math.sin(i * TAU / 6) * 0.38]}><sphereGeometry args={[0.3, 20, 14]} /></mesh>)}
      <mesh material={st} position={[0.85, 0.35, 0]}><cylinderGeometry args={[0.06, 0.06, 1.4, 8]} /></mesh>
      <instancedMesh ref={prot} args={[new THREE.SphereGeometry(0.05, 8, 6), new THREE.MeshBasicMaterial({ color: '#ff9d6b', toneMapped: false }), 20]} frustumCulled={false} />
      <Anchor id="fo" position={[0.7, -0.4, 0.4]} /><Anchor id="f1" position={[0.5, 1.4, 0.4]} /><Anchor id="stalk" position={[0.15, 0.4, 0.2]} /><Anchor id="proton" position={[-0.6, -1.3, 0.4]} /><Anchor id="membrane" position={[-1.6, -0.2, 1.4]} />
    </group>
  );
}

function Kinesin() {
  const k = useRef<THREE.Group>(null);
  const mtM = useHi('microtubule', '#9fc4ff', { rough: 0.4 });
  const kM = useHi('kinesin', '#5ab8a0', { rough: 0.4, clear: 0.4 });
  const vM = useHi('cargo', '#bfe3ff', { rough: 0.2, clear: 0.8, opacity: 0.85 });
  const legL = useRef<THREE.Mesh>(null), legR = useRef<THREE.Mesh>(null);
  const tub = useMemo(() => { const gs: THREE.BufferGeometry[] = []; for (let i = 0; i < 13; i++) { const a = (i / 13) * TAU; for (let j = 0; j < 40; j++) { const s = new THREE.SphereGeometry(0.07, 8, 6); s.translate(-3 + j * 0.15 + (i % 2) * 0.075, Math.cos(a) * 0.22, Math.sin(a) * 0.22); gs.push(s); } } return merge(gs); }, []);
  useFrame(({ clock }) => { const t = clock.elapsedTime, x = -2 + ((t * 0.35) % 4); if (k.current) k.current.position.x = x; const ph = (t * 2.2) % 2; if (legL.current && legR.current) { legL.current.position.set(ph < 1 ? -0.1 + smooth(ph) * 0.2 : 0.1, 0.32 + (ph < 1 ? Math.sin(ph * Math.PI) * 0.12 : 0), 0); legR.current.position.set(ph >= 1 ? -0.1 + smooth(ph - 1) * 0.2 : 0.1, 0.32 + (ph >= 1 ? Math.sin((ph - 1) * Math.PI) * 0.12 : 0), 0.05); } });
  return (
    <group>
      <mesh geometry={tub} material={mtM} />
      <group ref={k}>
        <mesh ref={legL} material={kM}><sphereGeometry args={[0.1, 14, 10]} /></mesh><mesh ref={legR} material={kM}><sphereGeometry args={[0.1, 14, 10]} /></mesh>
        <mesh material={kM} position={[0, 0.85, 0]}><cylinderGeometry args={[0.03, 0.03, 0.9, 8]} /></mesh>
        <mesh material={vM} position={[0, 1.65, 0]}><sphereGeometry args={[0.5, 28, 20]} /></mesh>
        <Anchor id="kinesin" position={[0.2, 0.5, 0.2]} /><Anchor id="cargo" position={[0.4, 1.9, 0.3]} />
      </group>
      <Anchor id="microtubule" position={[2.2, 0.3, 0.2]} />
    </group>
  );
}

function Types() {
  const items: { id: string; x: number; node: ReactElement }[] = [];
  const M = (id: string, c: string, o: Parameters<typeof useHi>[2] = {}) => useHi(id, c, { rough: 0.45, sheen: 0.6, clear: 0.4, ...o });
  const neuronM = M('neuron', '#e8b04a'), rbcM = M('rbc', '#c5161d'), musM = M('muscle', '#b8443f'), epiM = M('epithelial', '#e7a28c'), fatM = M('fat', '#f1d48a'), spermM = M('sperm', '#dfe6ee'), eggM = M('egg', '#f2d9c4', { opacity: 0.85 }), boneM = M('osteocyte', '#ede3cf'), rodM = M('photoreceptor', '#9fb8ff');
  const neuron = useMemo(() => merge([blob(0.25, [1, 1.2, 1], 0.1, 2, 1, 3), ...[0, 1, 2, 3, 4].map((i) => varTube(curve([[0, 0, 0], [Math.cos(i * 1.3) * 0.4, Math.sin(i * 1.3) * 0.4 + 0.2, 0.1], [Math.cos(i * 1.3) * 0.7, Math.sin(i * 1.3) * 0.6 + 0.3, 0]]), 12, 5, (t) => 0.06 * (1 - t))), varTube(curve([[0, -0.2, 0], [0.05, -0.8, 0], [0, -1.4, 0]]), 20, 6, () => 0.035)]), []);
  const rbc = useMemo(() => { const pts: THREE.Vector2[] = []; for (let i = 0; i <= 20; i++) { const r = (i / 20) * 0.45; pts.push(new THREE.Vector2(r, 0.06 + 0.12 * (r / 0.45) ** 1.5)); } for (let i = 20; i >= 0; i--) pts.push(new THREE.Vector2(pts[i].x, -pts[i].y)); return new THREE.LatheGeometry(pts, 36).rotateX(Math.PI / 2); }, []);
  const mus = useMemo(() => displace(new THREE.CylinderGeometry(0.25, 0.25, 2.2, 32, 60), (q) => 0.02 * Math.sin(q.y * 40)), []);
  const sperm = useMemo(() => merge([new THREE.SphereGeometry(0.12, 16, 12).scale(1, 1.5, 0.6), varTube(curve(Array.from({ length: 10 }, (_, i) => V(Math.sin(i * 0.9) * 0.06, -0.18 - i * 0.14, 0))), 40, 5, (t) => 0.025 * (1 - t * 0.8))]), []);
  const rod = useMemo(() => merge([new THREE.CylinderGeometry(0.12, 0.12, 0.7, 16).translate(0, 0.35, 0), new THREE.SphereGeometry(0.16, 16, 12).translate(0, -0.15, 0), new THREE.CylinderGeometry(0.04, 0.04, 0.5, 8).translate(0, -0.5, 0)]), []);
  const add = (id: string, node: ReactElement) => items.push({ id, x: (items.length - 4) * 1.15, node });
  add('neuron', <mesh geometry={neuron} material={neuronM} position={[0, 0.3, 0]} />);
  add('rbc', <mesh geometry={rbc} material={rbcM} rotation={[0.5, 0.4, 0]} />);
  add('muscle', <mesh geometry={mus} material={musM} rotation={[0, 0, 0.1]} />);
  add('epithelial', <mesh material={epiM}><boxGeometry args={[0.6, 0.8, 0.6]} /></mesh>);
  add('fat', <mesh material={fatM}><sphereGeometry args={[0.48, 32, 24]} /></mesh>);
  add('sperm', <mesh geometry={sperm} material={spermM} position={[0, 0.6, 0]} />);
  add('egg', <mesh material={eggM}><sphereGeometry args={[0.55, 32, 24]} /></mesh>);
  add('osteocyte', <mesh geometry={useMemo(() => displace(new THREE.IcosahedronGeometry(0.25, 4), (q) => { const n = q.clone().normalize(); let d = 0; for (const a of fibSphere(12, 1)) d += 0.6 * Math.pow(Math.max(0, n.dot(a)), 50); return d; }), [])} material={boneM} />);
  add('photoreceptor', <mesh geometry={rod} material={rodM} />);
  return <group>{items.map((it) => <group key={it.id} position={[it.x, 0, 0]}>{it.node}<Anchor id={it.id} position={[0, 0.95, 0.1]} /></group>)}</group>;
}

function Cilia() {
  const S = useScene();
  const ref = useRef<THREE.InstancedMesh>(null);
  const m = useHi('cilia', '#9fe0c8', { rough: 0.4 });
  const cells = useHi('epithelium', '#e7a28c', { rough: 0.5, sheen: 0.6 });
  const mucus = useHi('mucus', '#e8e2a0', { rough: 0.3, opacity: 0.5 });
  const g = useMemo(() => new THREE.CapsuleGeometry(0.025, 0.55, 4, 6).translate(0, 0.3, 0), []);
  const spots = useMemo(() => { const out: THREE.Vector3[] = []; for (let i = -9; i <= 9; i++) for (let j = -4; j <= 4; j++) out.push(V(i * 0.2, 0, j * 0.2)); return out; }, []);
  const part = useRef<THREE.Group>(null);
  useFrame(({ clock }) => { const im = ref.current, t = clock.elapsedTime; if (!im) return; const M = new THREE.Matrix4(), q = new THREE.Quaternion(); spots.forEach((p, i) => { const a = Math.sin(t * 6 - p.x * 2.5) * 0.6; q.setFromAxisAngle(V(0, 0, 1), -a); M.compose(p, q, V(1, 1, 1)); im.setMatrixAt(i, M); }); im.instanceMatrix.needsUpdate = true; if (part.current) part.current.position.x = ((t * 0.3) % 3) - 1.5; void S; });
  return (
    <group>
      {Array.from({ length: 8 }, (_, i) => <mesh key={i} material={cells} position={[-1.6 + i * 0.46, -0.45, 0]}><boxGeometry args={[0.44, 0.9, 1.6]} /></mesh>)}
      <instancedMesh ref={ref} args={[g, m, spots.length]} frustumCulled={false} />
      <mesh material={mucus} position={[0, 0.85, 0]}><boxGeometry args={[3.8, 0.25, 1.7]} /></mesh>
      <group ref={part}><mesh position={[0, 0.85, 0.3]}><icosahedronGeometry args={[0.08, 1]} /><meshStandardMaterial color="#6b5a4a" /></mesh></group>
      <Anchor id="cilia" position={[0.8, 0.45, 0.8]} /><Anchor id="epithelium" position={[-1.2, -0.3, 0.85]} /><Anchor id="mucus" position={[-0.9, 0.95, 0.8]} />
    </group>
  );
}

export default function Cell({ p }: { p: CellP }) {
  switch (p.mode ?? 'cell') {
    case 'mito': return <MitoClose />;
    case 'membrane': return <Membrane />;
    case 'transport': return <Membrane transport />;
    case 'endocytosis': return <Membrane endo />;
    case 'mitosis': case 'meiosis': return <Division meiosis={p.mode === 'meiosis'} />;
    case 'apoptosis': return <Apoptosis />;
    case 'atp': return <ATP />;
    case 'kinesin': return <Kinesin />;
    case 'types': return <Types />;
    case 'cilia': return <Cilia />;
    default: return <Cutaway />;
  }
}
