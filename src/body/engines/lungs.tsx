/**
 * Lungs and breathing. Two lungs (three lobes on the right, two and a
 * notch for the heart on the left) over a domed diaphragm, the trachea
 * with its cartilage rings and the bronchial tree branching inside; they
 * breathe. Close-ups: a cluster of alveoli in their net of capillaries with
 * oxygen going in and carbon dioxide coming out, and an airway in cross
 * section that can tighten (asthma) or fill with mucus.
 */
import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Anchor, useCtl, useHi, useScene } from '../stage';
import { ellipsoid, mesh, smax, sphere, cached, type SDF, type Vec } from '../sdf';
import { V, rng, curve, varTube, tree, treeGeo, fibSphere, TAU, PAL, blob, merge, fbm, smooth } from '../kit';

export interface LungP {
  mode?: 'lungs' | 'tree' | 'alveoli' | 'airway';
  disease?: 'emphysema' | 'pneumonia' | 'asthma' | 'cancer' | 'embolism' | 'cf' | 'smoker' | 'collapse' | 'covid';
  glass?: boolean;
}

const RL = ellipsoid([-0.78, 0.05, 0], [0.62, 1.25, 0.72]), LL = ellipsoid([0.78, 0.0, 0], [0.58, 1.2, 0.7]);
const DOME = sphere([0, -2.35, 0], 1.6), NOTCH = sphere([0.35, -0.45, 0.55], 0.55);
function lungField(): SDF {
  return (x, y, z) => {
    let r = smax(RL(x, y, z), -(-x - 0.18), 0.12); r = smax(r, -DOME(x - 0.1 * Math.sign(x), y, z), 0.15);
    let l = smax(LL(x, y, z), -(x - 0.2), 0.12); l = smax(l, -DOME(x, y + 0.08, z), 0.15); l = smax(l, -NOTCH(x, y, z), 0.12);
    // fissures between lobes
    const obl = y + 0.25 - (z + 0.1) * -0.9 * 0, ob = y - (-0.55 + 0.75 * (-z + 0.3)), hz = y - 0.18;
    if (x < 0) { r = smax(r, 0.012 - Math.abs(ob * 0.75), 0.01); if (z > -0.05 + 0.2 * (y - 0.1)) r = smax(r, 0.012 - Math.abs(hz), 0.01); }
    else l = smax(l, 0.012 - Math.abs(ob * 0.75), 0.01);
    void obl;
    const d = Math.min(r, l);
    return d < 0.08 ? d + 0.01 * fbm(x * 5, y * 5, z * 5, 2) : d;
  };
}
function lobeOf(x: number, y: number, z: number) {
  const ob = y - (-0.55 + 0.75 * (-z + 0.3));
  if (x < 0) return ob < 0 ? 'rll' : y < 0.18 && z > -0.05 + 0.2 * (y - 0.1) ? 'rml' : 'rul';
  return ob < 0 ? 'lll' : 'lul';
}
const LOBE_C: Record<string, string> = { rul: '#f2a3ae', rml: '#e98d9c', rll: '#de7b8c', lul: '#f0a0ab', lll: '#e3838f' };

function Lungs({ p }: { p: LungP }) {
  const rate = useCtl('rate', 14), depth = useCtl('depth', 1);
  const M = useMemo(() => cached('lungs', () => mesh(lungField(), [-1.5, -1.3, -0.85], [1.5, 1.4, 0.85], 0.03, lobeOf)), []);
  const glass = p.glass ?? p.mode === 'tree';
  const tr = useMemo(() => {
    const trachea = varTube(curve([[0, 2.1, 0.05], [0, 1.6, 0.05], [0, 1.05, 0.0]]), 40, 16, () => 0.15);
    const segs = [...[-1, 1].flatMap((s) => tree({ root: V(s * 0.0, 1.05, 0), dir: V(s * 0.75, -0.75, 0), len: 0.55, r: 0.11, depth: 6, spread: 0.55, shrink: 0.74, seed: s > 0 ? 3 : 8, wiggle: 0.12, kids: 2 }))];
    const kept = segs.filter((sg) => { const f = lungField()(sg.b.x, sg.b.y, sg.b.z); return f < 0.05 || sg.depth < 2; });
    return { trachea, tree: treeGeo(kept, 7), rings: Array.from({ length: 9 }, (_, i) => 2.0 - i * 0.11) };
  }, []);
  const trM = useHi(['trachea', 'bronchi', 'bronchiole'], '#e9d9cf', { rough: 0.45, clear: 0.4 });
  const ringM = useHi(['trachea', 'cartilage'], '#f6f0e4', { rough: 0.4 });
  const diaM = useHi('diaphragm', '#a8423c', { rough: 0.55, sheen: 0.6, opacity: 0.8, side: THREE.DoubleSide });
  const g = useRef<THREE.Group>(null), dia = useRef<THREE.Mesh>(null), air = useRef<THREE.InstancedMesh>(null);
  const ph = useRef(0);
  useFrame(({ clock }, dt) => {
    ph.current += dt * (rate / 60) * TAU; const b = (0.5 - 0.5 * Math.cos(ph.current)) * depth;
    if (g.current) g.current.scale.set(1 + b * 0.05, 1 + b * 0.07, 1 + b * 0.06);
    if (dia.current) dia.current.position.y = -1.32 - b * 0.18;
    const im = air.current; if (im) { const M2 = new THREE.Matrix4(), inh = Math.sin(ph.current) > 0; for (let i = 0; i < im.count; i++) { const k = ((clock.elapsedTime * 0.5 + i / im.count) % 1); const y = inh ? 2.4 - k * 1.5 : 0.9 + k * 1.5; M2.makeTranslation(Math.sin(i * 7) * 0.06, y, Math.cos(i * 5) * 0.06); im.setMatrixAt(i, M2); } im.instanceMatrix.needsUpdate = true; }
  });
  const tumor = p.disease === 'cancer';
  const tumM = useHi('tumor', '#c44f9e', { rough: 0.6 });
  const clotM = useHi('clot', '#5a0a10', { rough: 0.7 });
  const paM = useHi(['artery', 'clot'], PAL.vein, { rough: 0.4, clear: 0.5 });
  const pa = useMemo(() => p.disease === 'embolism' ? merge([varTube(curve([[0, 1.0, 0.35], [-0.5, 0.75, 0.25], [-0.85, 0.4, 0.1], [-1.0, -0.1, 0.05]]), 40, 10, (t) => 0.1 * (1 - t * 0.5)), varTube(curve([[0, 1.0, 0.35], [0.5, 0.75, 0.25], [0.85, 0.3, 0.1]]), 30, 10, (t) => 0.1 * (1 - t * 0.5))]) : null, [p.disease]);
  return (
    <group>
      <group ref={g}>
        {[...M.groups].map(([n, geo]) => <Lobe key={n} id={n} geo={geo} glass={glass} disease={p.disease} />)}
      </group>
      <mesh geometry={tr.trachea} material={trM} />
      {tr.rings.map((y, i) => <mesh key={i} material={ringM} position={[0, y, 0.05]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.155, 0.03, 8, 24, Math.PI * 1.6]} /></mesh>)}
      <mesh geometry={tr.tree} material={trM} visible={glass} />
      <mesh ref={dia} material={diaM} position={[0, -1.25, 0]} scale={[1.05, 0.22, 0.62]}><sphereGeometry args={[1.6, 48, 24, 0, TAU, 0, Math.PI / 2]} /></mesh>
      <instancedMesh ref={air} args={[new THREE.SphereGeometry(0.03, 8, 6), new THREE.MeshBasicMaterial({ color: '#bfefff', toneMapped: false }), 30]} frustumCulled={false} />
      {tumor && <mesh material={tumM} position={[-0.95, 0.55, 0.45]} geometry={blob(0.24, [1, 0.9, 1], 0.25, 2, 4, 4)} />}
      {pa && <><mesh geometry={pa} material={paM} /><mesh material={clotM} position={[-0.85, 0.4, 0.1]}><sphereGeometry args={[0.1, 16, 12]} /></mesh></>}
      <Anchor id="trachea" position={[0.2, 1.75, 0.15]} /><Anchor id="cartilage" position={[-0.18, 1.9, 0.12]} /><Anchor id="bronchi" position={[0.45, 0.75, 0.1]} /><Anchor id="bronchiole" position={[1.0, -0.3, 0.3]} />
      <Anchor id="rul" position={[-0.95, 0.85, 0.55]} /><Anchor id="rml" position={[-1.05, -0.05, 0.6]} /><Anchor id="rll" position={[-1.05, -0.65, -0.3]} />
      <Anchor id="lul" position={[0.95, 0.65, 0.5]} /><Anchor id="lll" position={[1.05, -0.65, -0.2]} /><Anchor id="notch" position={[0.4, -0.45, 0.6]} />
      <Anchor id="diaphragm" position={[0.4, -1.3, 0.9]} /><Anchor id="pleura" position={[-1.4, 0.2, 0.0]} />
      {tumor && <Anchor id="tumor" position={[-0.95, 0.75, 0.62]} />}{pa && <Anchor id="clot" position={[-0.85, 0.55, 0.2]} />}
    </group>
  );
}
function Lobe({ id, geo, glass, disease }: { id: string; geo: THREE.BufferGeometry; glass: boolean; disease?: string }) {
  const col = disease === 'smoker' ? '#6a5a5a' : disease === 'collapse' && id[0] === 'l' ? '#9a6a6a' : LOBE_C[id] ?? '#e98d9c';
  const m = useHi([id, 'pleura', 'notch'], col, { rough: 0.6, sheen: 0.9, clear: 0.2, opacity: glass ? 0.28 : 1, side: glass ? THREE.FrontSide : THREE.DoubleSide });
  return <mesh geometry={geo} material={m} renderOrder={glass ? 3 : 0} scale={disease === 'collapse' && id[0] === 'l' ? [0.8, 0.85, 0.8] : 1} />;
}

/* ───────── alveoli ───────── */
function Alveoli({ p }: { p: LungP }) {
  const em = p.disease === 'emphysema', pn = p.disease === 'pneumonia' || p.disease === 'covid';
  const sacs = useMemo(() => { const r = rng(5), out: { c: THREE.Vector3; r: number }[] = []; const ends = [V(0, 0, 0), V(0.9, -0.5, 0.3), V(-0.8, -0.6, 0.2), V(0.1, -1.1, -0.4)]; for (const e of ends) { const n = em ? 3 : 9; for (let i = 0; i < n; i++) { const d = fibSphere(n, 1)[i]; if (d.y > 0.6) continue; out.push({ c: e.clone().addScaledVector(d, em ? 0.42 : 0.38), r: em ? 0.45 + r() * 0.12 : 0.24 + r() * 0.05 }); } } return out; }, [em]);
  const duct = useMemo(() => merge([varTube(curve([[0, 1.6, 0], [0, 0.8, 0], [0, 0.1, 0]]), 30, 12, () => 0.14), varTube(curve([[0, 0.4, 0], [0.5, -0.1, 0.2], [0.9, -0.5, 0.3]]), 30, 10, () => 0.1), varTube(curve([[0, 0.4, 0], [-0.5, -0.1, 0.1], [-0.8, -0.6, 0.2]]), 30, 10, () => 0.1), varTube(curve([[0, 0.2, 0], [0.05, -0.5, -0.2], [0.1, -1.1, -0.4]]), 30, 10, () => 0.1)]), []);
  const caps = useMemo(() => { const r = rng(9), gs: THREE.BufferGeometry[] = [], gv: THREE.BufferGeometry[] = []; sacs.forEach((s, i) => { for (let k = 0; k < 3; k++) { const a = V(r() - 0.5, r() - 0.5, r() - 0.5).normalize(), b = V(r() - 0.5, r() - 0.5, r() - 0.5).normalize(); const pts = Array.from({ length: 7 }, (_, j) => { const t = j / 6; return s.c.clone().addScaledVector(a.clone().lerp(b, t).normalize(), s.r * 1.04); }); (i % 2 ? gv : gs).push(varTube(new THREE.CatmullRomCurve3(pts), 20, 5, () => 0.022)); } }); return { a: merge(gs), v: merge(gv) }; }, [sacs]);
  const sacM = useHi(['alveolus', 'wall'], '#f2b3b8', { rough: 0.45, sheen: 0.9, clear: 0.3, opacity: 0.82 });
  const ductM = useHi(['bronchiole', 'duct'], '#e9c9c0', { rough: 0.45 });
  const capA = useHi(['capillary', 'artery'], '#d1363a', { rough: 0.4, clear: 0.5 });
  const capV = useHi(['capillary', 'vein'], '#7f4fb5', { rough: 0.4, clear: 0.5 });
  const fluid = useHi('fluid', '#f2e2a0', { rough: 0.2, opacity: 0.7 });
  const o2 = useRef<THREE.InstancedMesh>(null), co2 = useRef<THREE.InstancedMesh>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime, M = new THREE.Matrix4();
    for (const [ref, out] of [[o2, false], [co2, true]] as [React.RefObject<THREE.InstancedMesh>, boolean][]) {
      const im = ref.current; if (!im) continue;
      for (let i = 0; i < im.count; i++) { const s = sacs[i % sacs.length], k = ((t * 0.4 + i * 0.31) % 1), d = fibSphere(im.count, 1)[i]; const r = out ? s.r * (1.15 - k * 0.6) : s.r * (0.55 + k * 0.6); const pos = s.c.clone().addScaledVector(d, r); M.makeTranslation(pos.x, pos.y, pos.z); if (pn && !out && k > 0.5) M.scale(V(0, 0, 0)); im.setMatrixAt(i, M); }
      im.instanceMatrix.needsUpdate = true;
    }
  });
  return (
    <group position={[0, 0, 0]}>
      <mesh geometry={duct} material={ductM} />
      {sacs.map((s, i) => <mesh key={i} material={sacM} position={s.c}><sphereGeometry args={[s.r, 28, 20]} /></mesh>)}
      {pn && sacs.filter((_, i) => i % 2 === 0).map((s, i) => <mesh key={'f' + i} material={fluid} position={s.c}><sphereGeometry args={[s.r * 0.85, 20, 14]} /></mesh>)}
      <mesh geometry={caps.a} material={capA} /><mesh geometry={caps.v} material={capV} />
      <instancedMesh ref={o2} args={[new THREE.SphereGeometry(0.035, 8, 6), new THREE.MeshBasicMaterial({ color: '#6fd0ff', toneMapped: false }), 60]} frustumCulled={false} />
      <instancedMesh ref={co2} args={[new THREE.SphereGeometry(0.035, 8, 6), new THREE.MeshBasicMaterial({ color: '#c9c9c9', toneMapped: false }), 40]} frustumCulled={false} />
      <Anchor id="alveolus" position={sacs[2].c.clone().add(V(0.1, 0.1, sacs[2].r)).toArray() as Vec} /><Anchor id="bronchiole" position={[0.15, 1.3, 0.15]} />
      <Anchor id="capillary" position={sacs[5].c.clone().add(V(0, 0, sacs[5].r + 0.05)).toArray() as Vec} /><Anchor id="oxygen" position={sacs[7].c.toArray() as Vec} inner /><Anchor id="co2" position={sacs[9 % sacs.length].c.clone().add(V(0.2, 0.2, 0.3)).toArray() as Vec} />
      <Anchor id="wall" position={sacs[0].c.clone().add(V(sacs[0].r, 0, 0)).toArray() as Vec} />{pn && <Anchor id="fluid" position={sacs[4].c.toArray() as Vec} inner />}
    </group>
  );
}

/* ───────── an airway in cross-section ───────── */
function annulus(r0: number, r1: number, depth: number, wav = 0, arc = TAU) {
  const sh = new THREE.Shape(), n = 96;
  for (let i = 0; i <= n; i++) { const a = (i / n) * arc; const p = [Math.cos(a) * r1, Math.sin(a) * r1]; if (i === 0) sh.moveTo(p[0], p[1]); else sh.lineTo(p[0], p[1]); }
  if (arc < TAU) { for (let i = n; i >= 0; i--) { const a = (i / n) * arc; sh.lineTo(Math.cos(a) * r0, Math.sin(a) * r0); } }
  else { const hole = new THREE.Path(); for (let i = 0; i <= n; i++) { const a = (i / n) * TAU, r = r0 + Math.sin(a * 9) * wav; if (i === 0) hole.moveTo(Math.cos(a) * r, Math.sin(a) * r); else hole.lineTo(Math.cos(a) * r, Math.sin(a) * r); } sh.holes.push(hole); }
  const g = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: false, curveSegments: 4 }); g.translate(0, 0, -depth / 2); return g;
}
function Airway({ p }: { p: LungP }) {
  const S = useScene();
  const sq = useCtl('constrict', p.disease === 'asthma' ? 0.7 : 0);
  const wallM = useHi(['wall', 'mucosa'], '#e8a4a0', { rough: 0.5, sheen: 0.7 });
  const subM = useHi(['wall', 'submucosa'], '#f2c8b8', { rough: 0.6 });
  const musM = useHi('muscle', '#b8443f', { rough: 0.5 });
  const carM = useHi('cartilage', '#f6f0e4', { rough: 0.4, clear: 0.4 });
  const mucM = useHi('mucus', '#e8e2a0', { rough: 0.2, opacity: 0.85 });
  const muco = useMemo(() => annulus(0.5, 0.62, 1.0, 0.04), []), sub = useMemo(() => annulus(0.62, 0.72, 0.96), []), mus = useMemo(() => annulus(0.72, 0.82, 0.92), []), car = useMemo(() => annulus(0.9, 1.04, 0.85, 0, TAU * 0.82), []);
  const inner = useRef<THREE.Group>(null);
  useFrame(() => { const k = 1 - sq * 0.42 * (0.6 + 0.4 * smooth(S.st.current)); inner.current?.scale.set(k, k, 1); });
  return (
    <group>
      <group ref={inner}><mesh geometry={muco} material={wallM} /><mesh geometry={sub} material={subM} /><mesh geometry={mus} material={musM} />
        {(p.disease === 'asthma' || p.disease === 'cf') && <mesh material={mucM} position={[0.15, -0.25, 0.1]} scale={[0.3, 0.2, 0.55]}><sphereGeometry args={[1, 24, 16]} /></mesh>}
      </group>
      <mesh geometry={car} material={carM} rotation={[0, 0, -Math.PI * 0.32]} />
      <Anchor id="wall" position={[0.4, 0.4, 0.5]} /><Anchor id="muscle" position={[-0.55, 0.5, 0.48]} /><Anchor id="cartilage" position={[0.2, 0.96, 0.45]} /><Anchor id="lumen" position={[0, 0, 0.2]} inner /><Anchor id="mucus" position={[0.2, -0.25, 0.4]} />
    </group>
  );
}

export default function LungEngine({ p }: { p: LungP }) {
  useLayoutEffect(() => {}, []);
  if (p.mode === 'alveoli') return <Alveoli p={p} />;
  if (p.mode === 'airway') return <Airway p={p} />;
  return <Lungs p={p} />;
}
