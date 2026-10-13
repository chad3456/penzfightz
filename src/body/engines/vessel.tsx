/**
 * Blood vessels, opened lengthwise so the layers of the wall show:
 * endothelium, smooth muscle and the outer coat, with blood cells flowing
 * through and speeding up where the vessel narrows. Plaque grows and
 * ruptures, an aneurysm swells, a clot forms and breaks loose, vein valves
 * hold or fail, a balloon and stent open a blockage, and a capillary bed
 * runs from arteriole to venule.
 */
import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Anchor, useCtl, useHi, useScene } from '../stage';
import { V, rng, curve, varTube, tree, treeGeo, TAU, PAL, blob, smooth, clamp, lerp, merge } from '../kit';

type Vec = [number, number, number];
export interface VesselP {
  mode?: 'artery' | 'vein' | 'capillary' | 'plaque' | 'aneurysm' | 'clot' | 'varicose' | 'stent' | 'bed' | 'pressure' | 'lymph' | 'bbb' | 'inflame';
}

const L = 6;
/** an opened tube along x whose radius follows r(x, st) */
function Wall({ r, thick, color, id, open = 0.32, seg = 120, rf }: { r: number; thick: number; color: string; id: string | string[]; open?: number; seg?: number; rf: (x: number) => number }) {
  const m = useHi(id, color, { rough: 0.5, sheen: 0.7, clear: 0.25, side: THREE.DoubleSide });
  const g = useMemo(() => { const g = new THREE.CylinderGeometry(1, 1, L, 72, seg, true, Math.PI * open, TAU * (1 - open)); g.rotateZ(Math.PI / 2); return g; }, [open, seg]);
  const base = useMemo(() => (g.attributes.position.array as Float32Array).slice(), [g]);
  useFrame(() => {
    const pos = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) { const x = base[i * 3], y = base[i * 3 + 1], z = base[i * 3 + 2]; const k = (rf(x) * r + thick) ; pos.setXYZ(i, x, y * k, z * k); }
    pos.needsUpdate = true; g.computeVertexNormals();
  });
  return <mesh geometry={g} material={m} />;
}

function Flow({ rf, n = 70, rmax, speed = 1, kind = 'rbc', back }: { rf: (x: number) => number; n?: number; rmax: number; speed?: number; kind?: 'rbc' | 'lymph'; back?: (x: number) => number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => { if (kind === 'lymph') return new THREE.SphereGeometry(0.07, 10, 8); const pts: THREE.Vector2[] = []; for (let i = 0; i <= 12; i++) { const r = (i / 12) * 0.16; pts.push(new THREE.Vector2(r, 0.02 + 0.04 * (r / 0.16) ** 1.5)); } for (let i = 12; i >= 0; i--) pts.push(new THREE.Vector2(pts[i].x, -pts[i].y)); return new THREE.LatheGeometry(pts, 20); }, [kind]);
  const mat = useMemo(() => new THREE.MeshPhysicalMaterial({ color: kind === 'lymph' ? '#f2e8c0' : '#c5161d', roughness: 0.35, clearcoat: 0.5 }), [kind]);
  const st = useMemo(() => { const R = rng(3); return Array.from({ length: n }, () => ({ x: (R() - 0.5) * L, a: R() * TAU, r: R(), rot: new THREE.Euler(R() * 3, R() * 3, R() * 3) })); }, [n]);
  const M = useMemo(() => new THREE.Matrix4(), []), q = useMemo(() => new THREE.Quaternion(), []);
  useFrame((_, dt) => {
    const im = ref.current; if (!im) return;
    st.forEach((s, i) => {
      const rr = Math.max(0.05, rf(s.x) * rmax - 0.12), v = speed / Math.max(0.15, (rf(s.x) * rmax) ** 2) * 0.35 * (back ? back(s.x) : 1);
      s.x += v * dt; if (s.x > L / 2) s.x -= L; if (s.x < -L / 2) s.x += L;
      s.rot.x += dt * 2;
      q.setFromEuler(s.rot); M.compose(V(s.x, Math.cos(s.a) * rr * Math.sqrt(s.r), Math.sin(s.a) * rr * Math.sqrt(s.r)), q, V(1, 1, 1)); im.setMatrixAt(i, M);
    });
    im.instanceMatrix.needsUpdate = true;
  });
  return <instancedMesh ref={ref} args={[geo, mat, n]} frustumCulled={false} />;
}

function Segment({ p }: { p: VesselP }) {
  const S = useScene();
  const mode = p.mode ?? 'artery';
  const vein = mode === 'vein' || mode === 'varicose' || mode === 'clot';
  const bp = useCtl('bp', 120), tone = useCtl('tone', 0);
  const t0 = useRef(0);
  useFrame((_, dt) => { t0.current += dt; });
  // radius profile per mode and step
  const rf = (x: number) => {
    const st = S.st.current, t = t0.current;
    let r = 1;
    if (mode === 'pressure') r *= 1 + 0.06 * Math.max(0, Math.sin(t * TAU * 1.1)) * (bp / 120);
    if (mode === 'artery') r *= 1 - tone * 0.35;
    if (mode === 'plaque' || mode === 'stent') { const grow = mode === 'stent' ? 0.62 * (1 - smooth(st - 1.5)) : 0.18 * smooth(st) + 0.3 * smooth(st - 1) + 0.15 * smooth(st - 2); r *= 1 - grow * Math.exp(-(x * x) / 0.5); }
    if (mode === 'aneurysm') { const g = 0.25 + 0.55 * smooth(st / 2); r *= 1 + g * Math.exp(-(x * x) / 0.6); }
    if (mode === 'varicose') r *= 1 + 0.35 * smooth(st - 1) * (0.6 + 0.4 * Math.sin(x * 2.2) ** 2);
    return r;
  };
  const R0 = vein ? 0.85 : 0.75;
  const plaqueM = useHi(['plaque', 'core'], '#f2cf6a', { rough: 0.55, sheen: 0.5 });
  const capM = useHi('cap', '#f4ece0', { rough: 0.5, opacity: 0.85 });
  const clotM = useHi(['clot', 'thrombus', 'embolus'], '#7a0d16', { rough: 0.75 });
  const valveM = useHi('valve', '#f3dfc0', { rough: 0.5, sheen: 0.5, side: THREE.DoubleSide });
  const stentM = useHi(['stent', 'balloon'], '#d8dde4', { rough: 0.25, metal: 0.9 }); stentM.wireframe = true;
  const balM = useHi('balloon', '#9fd0ff', { rough: 0.2, opacity: 0.5 });
  const plq = useRef<THREE.Mesh>(null), clot = useRef<THREE.Mesh>(null), emb = useRef<THREE.Mesh>(null), stent = useRef<THREE.Mesh>(null), bal = useRef<THREE.Mesh>(null), valves = useRef<THREE.Group>(null);
  useFrame(() => {
    const st = S.st.current;
    if (plq.current) { const k = mode === 'stent' ? 1 - smooth(st - 1.5) * 0.7 : 0.25 + 0.75 * smooth(st); plq.current.scale.set(1, k, k); }
    if (clot.current) { const k = mode === 'plaque' ? smooth(st - 2.6) : smooth(st - 0.6); clot.current.scale.setScalar(Math.max(0.001, k)); clot.current.visible = k > 0.02 && !(mode === 'clot' && st > 2.6); }
    if (emb.current) { const k = smooth(st - 2.2); emb.current.visible = mode === 'clot' && k > 0.05; emb.current.position.x = lerp(0, 2.6, smooth(st - 2.4)); }
    if (stent.current) { const k = smooth(st - 0.6); stent.current.visible = k > 0.05; const e = 0.25 + smooth(st - 1.4) * 0.45; stent.current.scale.set(1, e, e); }
    if (bal.current) { bal.current.visible = st > 0.8 && st < 2.6; const e = 0.2 + smooth(st - 1.2) * 0.5; bal.current.scale.set(1, e, e); }
    if (valves.current) { const fail = mode === 'varicose' ? smooth(st - 1) : 0; valves.current.children.forEach((c, i) => { const open = 0.5 + 0.5 * Math.sin(t0.current * 3); const sd = i % 2 ? 1 : -1; c.rotation.z = sd * -(0.15 + open * 1.0 * (1 - fail) + fail * 0.1); }); }
  });
  const plGeo = useMemo(() => { const g = blob(0.7, [1.6, 0.5, 0.75], 0.08, 2, 7, 4); g.translate(0, -R0 * 0.78, 0.0); return g; }, [R0]);
  return (
    <group>
      {mode === 'capillary' ? <Wall r={0.4} thick={0.03} color="#e8a4a0" id={['endothelium', 'wall']} rf={() => 1} /> : (<>
        <Wall r={R0} thick={0.0} color="#f2c4c0" id={['endothelium', 'intima']} rf={rf} />
        <Wall r={R0} thick={vein ? 0.07 : 0.16} color={vein ? '#9a5a8a' : '#c74a44'} id="media" rf={rf} />
        <Wall r={R0} thick={vein ? 0.14 : 0.27} color="#f0dcc0" id="adventitia" rf={rf} />
      </>)}
      <Flow rf={mode === 'capillary' ? () => 0.55 : rf} rmax={mode === 'capillary' ? 0.4 : R0} n={mode === 'capillary' ? 14 : 70} speed={mode === 'varicose' ? 0.6 : 1} back={mode === 'varicose' ? (x) => (Math.sin(t0.current * 2 + x) > 0.3 ? -0.5 : 1) : undefined} />
      {(mode === 'plaque' || mode === 'stent') && <mesh ref={plq} geometry={plGeo} material={plaqueM} />}
      {mode === 'plaque' && <mesh material={capM} position={[0, -R0 * 0.48, 0]} scale={[1.1, 0.12, 0.5]}><sphereGeometry args={[0.7, 24, 12]} /></mesh>}
      {(mode === 'plaque' || mode === 'clot') && <mesh ref={clot} material={clotM} position={[0, mode === 'clot' ? -R0 * 0.45 : -R0 * 0.25, 0]} geometry={useMemo(() => blob(0.45, [1.5, 0.8, 0.9], 0.2, 2.5, 3, 4), [])} />}
      {mode === 'clot' && <mesh ref={emb} material={clotM} position={[0, -R0 * 0.2, 0]} geometry={useMemo(() => blob(0.25, [1.4, 0.8, 0.8], 0.2, 2.5, 5, 3), [])} />}
      {mode === 'stent' && <mesh ref={stent} material={stentM} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[R0 * 0.95, R0 * 0.95, 1.8, 18, 10, true]} /></mesh>}
      {mode === 'stent' && <mesh ref={bal} material={balM} rotation={[0, 0, Math.PI / 2]}><capsuleGeometry args={[R0 * 0.9, 1.6, 8, 24]} /></mesh>}
      {mode === 'stent' && <mesh material={stentM} position={[-2.2, 0, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.08, 0.08, 2.6, 8]} /></mesh>}
      {vein && <group ref={valves}>{[-1.6, 1.4].flatMap((x, k) => [1, -1].map((sd) => <group key={k + '' + sd} position={[x, sd * R0 * 0.92, 0]}><mesh material={valveM} position={[0, -sd * R0 * 0.92, 0]} rotation={[0, Math.PI / 2, sd > 0 ? 0 : Math.PI]}><circleGeometry args={[R0 * 0.9, 24, 0, Math.PI]} /></mesh></group>))}</group>}
      <Anchor id="endothelium" position={[-2.2, 0.0, -R0 * 0.75]} /><Anchor id="media" position={[1.9, R0 * 0.95, -0.35]} /><Anchor id="adventitia" position={[2.6, R0 + 0.2, 0.1]} />
      <Anchor id="lumen" position={[-1.0, 0.3, 0.2]} inner /><Anchor id="rbc" position={[0.6, 0.2, 0.3]} inner />
      <Anchor id="plaque" position={[0.0, -R0 * 0.55, 0.45]} /><Anchor id="cap" position={[0.3, -R0 * 0.4, 0.35]} /><Anchor id="clot" position={[0.2, -R0 * 0.3, 0.45]} />
      <Anchor id="embolus" position={[1.8, 0, 0.4]} /><Anchor id="valve" position={[-1.6, R0 * 0.6, 0.3]} /><Anchor id="stent" position={[0.4, R0 * 0.75, 0.3]} /><Anchor id="balloon" position={[-0.4, 0.3, 0.45]} />
      <Anchor id="bulge" position={[0, R0 * 1.6, 0.2]} /><Anchor id="wall" position={[0, 0.45, -0.2]} />
    </group>
  );
}

function Bed() {
  const net = useMemo(() => {
    const art = varTube(curve([[-3, 0.2, 0], [-2, 0.15, 0.05], [-1.2, 0.1, 0]]), 30, 12, (t) => 0.22 - t * 0.06);
    const ven = varTube(curve([[1.2, 0.1, 0], [2, 0.15, 0.05], [3, 0.2, 0]]), 30, 12, (t) => 0.18 + t * 0.08);
    const R = rng(4), caps: { c: THREE.CatmullRomCurve3; t: number }[] = [];
    for (let i = 0; i < 14; i++) { const y = (i / 13 - 0.5) * 2.2, z = (R() - 0.5) * 1.2; caps.push({ c: new THREE.CatmullRomCurve3([V(-1.2, 0.1, 0), V(-0.6, y * 0.8, z * 0.6), V(0, y + (R() - 0.5) * 0.3, z), V(0.6, y * 0.8, z * 0.7), V(1.2, 0.1, 0)]), t: i / 13 }); }
    const shunt = varTube(curve([[-1.2, 0.1, 0], [0, 0.0, -0.9], [1.2, 0.1, 0]]), 30, 8, () => 0.06);
    return { art, ven, caps, shunt };
  }, []);
  const aM = useHi('arteriole', PAL.artery, { rough: 0.4, clear: 0.5 });
  const vM = useHi('venule', PAL.vein, { rough: 0.4, clear: 0.5 });
  const sM = useHi('sphincter', '#f2c94c', { rough: 0.4 });
  const cells = useHi('tissue', '#e7a28c', { rough: 0.6, sheen: 0.6, opacity: 0.55 });
  const capMats = useMemo(() => net.caps.map((c) => new THREE.MeshPhysicalMaterial({ color: new THREE.Color(PAL.artery).lerp(new THREE.Color('#7f4fb5'), c.t * 0 + 0.5), roughness: 0.4, clearcoat: 0.4 })), [net]);
  const capGeos = useMemo(() => net.caps.map((c) => { const g = varTube(c.c, 40, 6, () => 0.04); const col = new Float32Array(g.attributes.position.count * 3), ca = new THREE.Color(PAL.artery), cv = new THREE.Color('#6f4fb5'), cc = new THREE.Color(); for (let i = 0; i < g.attributes.position.count; i++) { const tt = Math.floor(i / 7) / 40; cc.copy(ca).lerp(cv, tt); col.set([cc.r, cc.g, cc.b], i * 3); } g.setAttribute('color', new THREE.BufferAttribute(col, 3)); return g; }), [net]);
  useLayoutEffect(() => { capMats.forEach((m) => { m.vertexColors = true; m.color.set('#ffffff'); }); }, [capMats]);
  const flow = useRef<THREE.InstancedMesh>(null);
  useFrame(({ clock }) => { const im = flow.current; if (!im) return; const M = new THREE.Matrix4(), t = clock.elapsedTime; for (let i = 0; i < im.count; i++) { const c = net.caps[i % net.caps.length].c, k = ((t * 0.15 + i * 0.137) % 1); M.makeTranslation(...c.getPointAt(k).toArray()); im.setMatrixAt(i, M); } im.instanceMatrix.needsUpdate = true; });
  return (
    <group>
      <mesh geometry={net.art} material={aM} /><mesh geometry={net.ven} material={vM} />
      {capGeos.map((g, i) => <mesh key={i} geometry={g} material={capMats[i]} />)}
      <mesh geometry={net.shunt} material={aM} />
      <mesh material={sM} position={[-1.05, 0.1, 0]} rotation={[0, Math.PI / 2, 0]}><torusGeometry args={[0.14, 0.04, 8, 18]} /></mesh>
      {Array.from({ length: 10 }, (_, i) => <mesh key={i} material={cells} position={[(i % 5 - 2) * 0.55, i < 5 ? -1.6 : 1.6, (i % 3 - 1) * 0.4]}><sphereGeometry args={[0.3, 16, 12]} /></mesh>)}
      <instancedMesh ref={flow} args={[new THREE.SphereGeometry(0.04, 8, 6), new THREE.MeshBasicMaterial({ color: '#ff8a8a', toneMapped: false }), 80]} frustumCulled={false} />
      <Anchor id="arteriole" position={[-2.3, 0.45, 0.1]} /><Anchor id="venule" position={[2.3, 0.45, 0.1]} /><Anchor id="capillary" position={net.caps[3].c.getPointAt(0.5).toArray() as Vec} /><Anchor id="sphincter" position={[-1.05, 0.35, 0.1]} /><Anchor id="tissue" position={[0.5, -1.4, 0.4]} /><Anchor id="shunt" position={[0, 0.0, -0.95]} />
    </group>
  );
}

function Lymph() {
  const S = useScene();
  const v = useMemo(() => varTube(curve([[-3, 0, 0], [-1.8, 0.1, 0], [-1, 0, 0]]), 40, 14, (t) => 0.22 + 0.06 * Math.sin(t * 18)), []);
  const v2 = useMemo(() => varTube(curve([[1, 0, 0], [2, -0.1, 0], [3, 0, 0]]), 40, 14, (t) => 0.22 + 0.06 * Math.sin(t * 18)), []);
  const node = useMemo(() => blob(1.0, [1.3, 0.85, 0.9], 0.05, 1.5, 3, 5), []);
  const vM = useHi('vessel', '#f2e8c0', { rough: 0.35, clear: 0.5, opacity: 0.6 });
  const nM = useHi(['node', 'capsule'], '#9fd6a0', { rough: 0.5, sheen: 0.6, opacity: 0.55 });
  const fM = useHi('follicle', '#5ab8a0', { rough: 0.5 });
  const fol = useMemo(() => Array.from({ length: 7 }, (_, i) => { const a = (i / 7) * TAU; return V(Math.cos(a) * 0.85, Math.sin(a) * 0.5, Math.sin(a * 2) * 0.2); }), []);
  void S;
  return (
    <group>
      <mesh geometry={v} material={vM} /><mesh geometry={v2} material={vM} /><mesh geometry={node} material={nM} />
      {fol.map((p, i) => <mesh key={i} material={fM} position={p}><sphereGeometry args={[0.2, 18, 12]} /></mesh>)}
      <Flow rf={(x) => (Math.abs(x) < 1 ? 2.5 : 1)} rmax={0.18} n={40} kind="lymph" speed={0.4} />
      <Anchor id="vessel" position={[-2.2, 0.35, 0.1]} /><Anchor id="node" position={[0.2, 0.9, 0.3]} /><Anchor id="follicle" position={fol[1].clone().add(V(0, 0.2, 0.2)).toArray() as Vec} /><Anchor id="capsule" position={[-0.9, -0.5, 0.6]} />
    </group>
  );
}

export default function Vessel({ p }: { p: VesselP }) {
  const m = p.mode ?? 'artery';
  if (m === 'bed') return <Bed />;
  if (m === 'lymph') return <Lymph />;
  return <Segment p={p} />;
}
export { clamp, tree, treeGeo, merge };
