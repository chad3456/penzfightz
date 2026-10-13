/**
 * Neurons and nerves: a whole neuron with dendrites, a myelinated axon and
 * its terminals, carrying an action potential that leaps from node to node;
 * a synapse close up, step by step from calcium entry to reuptake; a firing
 * network; the knee-jerk reflex arc through the spinal cord; and glia.
 */
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Anchor, useCtl, useHi, useScene } from '../stage';
import { V, rng, blob, curve, varTube, tree, treeGeo, fibSphere, TAU, PAL, smooth, mergeGeometries, merge, displace, fbm } from '../kit';

type Vec = [number, number, number];
export interface NeuronP {
  mode?: 'neuron' | 'synapse' | 'network' | 'reflex' | 'glia';
  myelin?: boolean; ms?: boolean; nt?: string; ntName?: string; ssri?: boolean; post?: 'spine' | 'muscle';
  inhib?: boolean; pain?: boolean; ltp?: boolean; als?: boolean;
}

const glowMat = (c: string) => new THREE.MeshBasicMaterial({ color: c, toneMapped: false });

/* ───────── one neuron ───────── */
function Neuron({ p }: { p: NeuronP }) {
  const S = useScene(); const speed = useCtl('speed', 1);
  const myelin = p.myelin ?? true;
  const axon = useMemo(() => curve([[0.35, -0.25, 0], [1.2, -0.45, 0.1], [2.4, -0.3, -0.1], [3.6, -0.55, 0.05], [4.8, -0.35, 0], [5.8, -0.5, 0.05]]), []);
  const soma = useMemo(() => { const g = blob(0.42, [1, 1.25, 0.9], 0.08, 1.6, 2, 5); return g; }, []);
  const dend = useMemo(() => { const gs: THREE.BufferGeometry[] = []; const dirs: Vec[] = [[-1, 0.6, 0.2], [-0.6, 1, -0.3], [0, 1, 0.4], [-1, -0.3, -0.4], [-0.4, -0.9, 0.3], [0.4, 0.9, -0.2]]; dirs.forEach((d, i) => { const dir = V(...d).normalize(); gs.push(treeGeo(tree({ root: dir.clone().multiplyScalar(0.35), dir, len: 0.6, r: 0.07, depth: 3, spread: 0.55, shrink: 0.68, seed: 3 + i, wiggle: 0.3 }), 6)); }); return mergeGeometries(gs)!; }, []);
  const axGeo = useMemo(() => varTube(axon, 200, 10, (t) => 0.06 * (1 - t * 0.2) + 0.05 * Math.exp(-t * 40)), [axon]);
  const term = useMemo(() => { const end = axon.getPointAt(1), dir = axon.getTangentAt(1); const segs = tree({ root: end, dir, len: 0.35, r: 0.04, depth: 2, spread: 0.7, shrink: 0.7, seed: 21 }); const bout = segs.filter((s) => s.depth === 2).map((s) => s.b); return { g: treeGeo(segs, 6), bout }; }, [axon]);
  const nodes = useMemo(() => { const ts: number[] = []; for (let t = 0.1; t < 0.93; t += 0.105) ts.push(t); return ts; }, []);
  const sheaths = useMemo(() => nodes.slice(0, -1).map((t, i) => {
    const a = t + 0.008, b = nodes[i + 1] - 0.008, dmg = !!p.ms && (i === 2 || i === 4);
    const c = new THREE.CatmullRomCurve3(Array.from({ length: 8 }, (_, k) => axon.getPointAt(a + ((b - a) * k) / 7)));
    return { g: varTube(c, 40, 14, (u) => (dmg ? 0.09 : 0.13) * Math.min(1, Math.sin(u * Math.PI) * 4)), dmg };
  }), [axon, nodes, p.ms]);
  const somaM = useHi(['soma', 'nucleus'], '#e8b04a', { rough: 0.45, sheen: 0.6, clear: 0.4 });
  const dendM = useHi('dendrite', '#e8b04a', { rough: 0.45, sheen: 0.5 });
  const axM = useHi(['axon', 'hillock', 'node'], '#f2c96b', { rough: 0.4, sheen: 0.5 });
  const myM = useHi('myelin', '#f5ecd2', { rough: 0.35, clear: 0.7, sheen: 0.3 });
  const dmgM = useHi('damage', '#c9a0a0', { rough: 0.8, opacity: 0.6 });
  const tM = useHi(['terminal', 'bouton'], '#f2a23a', { rough: 0.4, clear: 0.5 });
  const nucM = useHi('nucleus', '#6b4fa8', { rough: 0.4, opacity: 0.85 });
  const spark = useRef<THREE.Group>(null), trail = useRef<THREE.Mesh>(null);
  const tt = useRef(0);
  useFrame((_, dt) => {
    tt.current = (tt.current + dt * 0.22 * speed * (myelin ? 1 : 0.35)) % 1.25;
    const u = tt.current; let t: number;
    if (u > 1) { if (spark.current) spark.current.visible = false; return; }
    if (myelin) { const k = u * (nodes.length - 1), i = Math.floor(k), f = k - i; const fast = f < 0.25 ? smooth(f / 0.25) : 1; t = nodes[i] + (nodes[Math.min(nodes.length - 1, i + 1)] - nodes[i]) * fast; if (p.ms && i >= 2 && i <= 4) t = nodes[i] + (nodes[i + 1] - nodes[i]) * f; if (p.ms && i === 4 && f > 0.6) { if (spark.current) spark.current.visible = false; return; } }
    else t = u;
    if (spark.current) { spark.current.visible = true; spark.current.position.copy(axon.getPointAt(Math.min(1, t))); spark.current.scale.setScalar(1 + 0.2 * Math.sin(u * 60)); }
    if (trail.current) trail.current.visible = S.labels || true;
  });
  return (
    <group position={[-2.6, 0.2, 0]}>
      <mesh geometry={soma} material={somaM} />
      <mesh material={nucM}><sphereGeometry args={[0.18, 24, 16]} /></mesh>
      <mesh geometry={dend} material={dendM} />
      <mesh geometry={axGeo} material={axM} />
      {myelin && sheaths.map((s, i) => <mesh key={i} geometry={s.g} material={s.dmg ? dmgM : myM} />)}
      <mesh geometry={term.g} material={tM} />
      {term.bout.map((b, i) => <mesh key={i} position={b} material={tM}><sphereGeometry args={[0.07, 14, 10]} /></mesh>)}
      <group ref={spark}><mesh material={glowMat('#9fe8ff')}><sphereGeometry args={[0.12, 16, 12]} /></mesh><pointLight color="#7fd8ff" intensity={2} distance={1.5} /></group>
      <mesh ref={trail} visible={false} />
      <Anchor id="soma" position={[0.1, 0.45, 0.3]} /><Anchor id="nucleus" position={[0, 0, 0.2]} inner />
      <Anchor id="dendrite" position={[-1.0, 0.9, 0.2]} /><Anchor id="hillock" position={axon.getPointAt(0.02).toArray() as Vec} />
      <Anchor id="axon" position={axon.getPointAt(0.5).toArray() as Vec} />
      <Anchor id="myelin" position={axon.getPointAt(0.37).clone().add(V(0, 0.15, 0)).toArray() as Vec} />
      <Anchor id="node" position={axon.getPointAt(nodes[3]).clone().add(V(0, -0.12, 0)).toArray() as Vec} />
      <Anchor id="terminal" position={axon.getPointAt(1).clone().add(V(0.3, 0.3, 0)).toArray() as Vec} />
      <Anchor id="damage" position={axon.getPointAt((nodes[2] + nodes[3]) / 2).clone().add(V(0, 0.12, 0)).toArray() as Vec} />
      <Anchor id="signal" position={axon.getPointAt(0.15).clone().add(V(0, 0.25, 0)).toArray() as Vec} />
    </group>
  );
}

/* ───────── a synapse, step by step ───────── */
function Synapse({ p }: { p: NeuronP }) {
  const S = useScene();
  const nt = p.nt ?? '#7fe0ff', muscle = p.post === 'muscle';
  const pre = useMemo(() => { const g = new THREE.SphereGeometry(1.15, 64, 48, 0, TAU, 0, Math.PI * 0.62); g.translate(0, 0.35 - 1.15 * Math.cos(Math.PI * 0.62), 0); return displace(g, (q) => 0.03 * fbm(q.x * 2, q.y * 2, q.z * 2, 2)); }, []);
  const preFloor = useMemo(() => { const g = new THREE.CircleGeometry(1.15 * Math.sin(Math.PI * 0.62), 48); g.rotateX(Math.PI / 2); g.translate(0, 0.35, 0); return g; }, []);
  const postCap = useMemo(() => { const g = new THREE.CircleGeometry(1.25 * Math.sin(Math.PI * 0.42), 48); g.rotateX(-Math.PI / 2); g.translate(0, -0.25, 0); return g; }, []);
  const post = useMemo(() => { if (muscle) { const g = new THREE.BoxGeometry(5, 1.2, 3, 50, 4, 30); return displace(g, (q) => 0.04 * Math.sin(q.x * 3) * (q.y > 0.5 ? 1 : 0)); } const g = new THREE.SphereGeometry(1.25, 64, 40, 0, TAU, Math.PI * 0.42, Math.PI * 0.58); g.translate(0, -0.25 - 1.25 * Math.cos(Math.PI * 0.42), 0); return g; }, [muscle]);
  const vesicles = useMemo(() => { const R = rng(4); return Array.from({ length: 26 }, (_, i) => i < 6 ? V(-0.55 + i * 0.22, 0.52, (R() - 0.5) * 0.4) : V((R() - 0.5) * 1.4, 0.8 + R() * 0.7, (R() - 0.5) * 1.2)); }, []);
  const recs = useMemo(() => Array.from({ length: 14 }, (_, i) => V(-0.75 + (i % 7) * 0.25, -0.2, i < 7 ? 0.2 : -0.2)), []);
  const transp = useMemo(() => [V(-1.0, 0.36, 0.3), V(1.0, 0.36, -0.2)], []);
  const mols = useMemo(() => { const R = rng(7); return Array.from({ length: 60 }, () => ({ start: V((R() - 0.5) * 1.1, 0.33, (R() - 0.5) * 0.5), end: V((R() - 0.5) * 1.6, -0.15, (R() - 0.5) * 0.5), back: V((R() > 0.5 ? 1 : -1) * 1.0, 0.36, (R() - 0.5) * 0.4), ph: R() })); }, []);
  const preM = useHi('presynaptic', '#f2c96b', { rough: 0.45, sheen: 0.6, opacity: 0.55, side: THREE.DoubleSide });
  const postM = useHi('postsynaptic', muscle ? '#c0504a' : '#e8b04a', { rough: 0.5, sheen: 0.6, side: THREE.DoubleSide });
  const vesM = useHi('vesicle', '#bfe3ff', { rough: 0.2, clear: 0.8, opacity: 0.8 });
  const recM = useHi('receptor', '#8fb8ff', { rough: 0.4, clear: 0.5 });
  const chM = useHi('channel', '#5ab8a0', { rough: 0.4 });
  const trM = useHi('transporter', '#e85aa0', { rough: 0.4 });
  const mitoM = useHi('mitochondrion', '#e86a4a', { rough: 0.45, clear: 0.4 });
  const drugM = useHi('drug', '#ffffff', { rough: 0.3, emissive: '#ffffff', ei: 0.4 });
  const molRef = useRef<THREE.InstancedMesh>(null), caRef = useRef<THREE.InstancedMesh>(null), vref = useRef<THREE.InstancedMesh>(null);
  const molMat = useMemo(() => new THREE.MeshStandardMaterial({ color: nt, emissive: nt, emissiveIntensity: 0.8, toneMapped: false }), [nt]);
  const caMat = useMemo(() => glowMat('#ffe36b'), []);
  const glowRec = useRef(0);
  useFrame(({ clock }) => {
    const st = S.st.current, t = clock.elapsedTime, M = new THREE.Matrix4();
    const ca = smooth(st - 0.5) * (1 - smooth(st - 2)), rel = smooth(st - 1.4), bind = smooth(st - 2.4), up = smooth(st - 3.4);
    const ci = caRef.current; if (ci) { for (let i = 0; i < 24; i++) { const k = ((i / 24) + t * 0.5) % 1; const x = i % 2 ? -0.9 : 0.9; M.makeTranslation(x + (i % 3) * 0.05, 0.1 + k * 0.5, ((i * 0.37) % 1 - 0.5) * 0.5); M.scale(V(ca, ca, ca)); ci.setMatrixAt(i, M); } ci.instanceMatrix.needsUpdate = true; }
    const vi = vref.current; if (vi) { vesicles.forEach((v, i) => { const docked = i < 6; const s = docked ? 1 - rel * 0.9 : 1; M.makeTranslation(v.x, v.y - (docked ? rel * 0.12 : 0) + Math.sin(t + i) * 0.01, v.z); M.scale(V(s, s, s)); vi.setMatrixAt(i, M); }); vi.instanceMatrix.needsUpdate = true; }
    const mi = molRef.current; if (mi) {
      mols.forEach((m, i) => {
        const w = (t * 0.4 + m.ph) % 1; let pos: THREE.Vector3;
        if (st < 1.4) pos = m.start.clone();
        else if (up < 0.5 || p.ssri) pos = m.start.clone().lerp(m.end, Math.min(1, rel * (0.4 + 0.6 * ((m.ph + w * 0.3) % 1)))).add(V(Math.sin(t * 3 + i) * 0.04, Math.sin(t * 2 + i) * 0.03, Math.cos(t * 3 + i) * 0.04));
        else pos = m.end.clone().lerp(m.back, Math.min(1, (up - 0.5) * 2 * (0.5 + m.ph))).add(V(Math.sin(t * 3 + i) * 0.03, 0, 0));
        M.makeTranslation(pos.x, pos.y, pos.z); if (st < 1.4) M.scale(V(0.001, 0.001, 0.001)); mi.setMatrixAt(i, M);
      });
      mi.instanceMatrix.needsUpdate = true;
    }
    glowRec.current = bind * (p.ssri ? 1 : 1 - up * 0.8);
    recM.emissive.set(nt); recM.emissiveIntensity = S.sel === 'receptor' ? recM.emissiveIntensity : glowRec.current * 0.9;
    postM.emissive.set('#7fd8ff'); if (S.sel !== 'postsynaptic') postM.emissiveIntensity = glowRec.current * 0.25;
  });
  const recGeo = useMemo(() => { const g = new THREE.CylinderGeometry(0.06, 0.07, 0.16, 8); return g; }, []);
  return (
    <group>
      <mesh geometry={pre} material={preM} />
      <mesh geometry={preFloor} material={preM} position={[0, 0, 0]} />
      <mesh material={mitoM} position={[0.3, 1.45, -0.2]} rotation={[0.3, 0.4, 1.1]}><capsuleGeometry args={[0.16, 0.5, 8, 16]} /></mesh>
      <instancedMesh ref={vref} args={[new THREE.SphereGeometry(0.1, 18, 12), vesM, vesicles.length]} frustumCulled={false} />
      <mesh geometry={post} material={postM} position={muscle ? [0, -0.85, 0] : [0, 0, 0]} />
      {!muscle && <mesh geometry={postCap} material={postM} />}
      {recs.map((r, i) => <mesh key={i} geometry={recGeo} material={recM} position={r} />)}
      {[-0.9, 0.9].map((x, i) => <mesh key={i} material={chM} position={[x, 0.36, 0]}><cylinderGeometry args={[0.07, 0.07, 0.2, 10]} /></mesh>)}
      {transp.map((v, i) => <mesh key={i} material={trM} position={v}><torusGeometry args={[0.07, 0.035, 8, 14]} /></mesh>)}
      {p.ssri && transp.map((v, i) => <mesh key={i} material={drugM} position={[v.x, v.y - 0.04, v.z]}><icosahedronGeometry args={[0.06, 0]} /></mesh>)}
      <instancedMesh ref={caRef} args={[new THREE.SphereGeometry(0.035, 8, 6), caMat, 24]} frustumCulled={false} />
      <instancedMesh ref={molRef} args={[new THREE.SphereGeometry(0.05, 10, 8), molMat, mols.length]} frustumCulled={false} />
      <Anchor id="presynaptic" position={[0.7, 1.6, 0.6]} /><Anchor id="vesicle" position={[-0.33, 0.6, 0.25]} />
      <Anchor id="cleft" position={[0.0, 0.08, 0.6]} /><Anchor id="receptor" position={[0.5, -0.15, 0.3]} />
      <Anchor id="postsynaptic" position={[0.8, -0.6, 0.5]} /><Anchor id="channel" position={[-0.9, 0.38, 0.2]} />
      <Anchor id="transporter" position={[1.0, 0.4, -0.1]} /><Anchor id="mitochondrion" position={[0.3, 1.45, 0.1]} />
      <Anchor id="drug" position={[-1.0, 0.3, 0.35]} /><Anchor id="transmitter" position={[0.2, 0.1, 0.25]} />
    </group>
  );
}

/* ───────── a network that fires ───────── */
function Network() {
  const net = useMemo(() => {
    const R = rng(12), cells = Array.from({ length: 26 }, () => V((R() - 0.5) * 6, (R() - 0.5) * 3.6, (R() - 0.5) * 3));
    const links: { c: THREE.CatmullRomCurve3; ph: number }[] = [];
    cells.forEach((a, i) => { const near = cells.map((b, j) => ({ j, d: a.distanceTo(b) })).filter((x) => x.j !== i).sort((x, y) => x.d - y.d).slice(0, 3); for (const n of near) { const b = cells[n.j]; const m = a.clone().lerp(b, 0.5).add(V(R() - 0.5, R() - 0.5, R() - 0.5).multiplyScalar(0.7)); links.push({ c: new THREE.CatmullRomCurve3([a, m, b]), ph: R() }); } });
    return { cells, links, geo: mergeGeometries(links.map((l) => varTube(l.c, 24, 5, () => 0.022).toNonIndexed()))! };
  }, []);
  const cm = useHi('neuron', '#e8b04a', { rough: 0.45, sheen: 0.5 });
  const lm = useHi('connection', '#f2c96b', { rough: 0.5, opacity: 0.7 });
  const sp = useRef<THREE.InstancedMesh>(null), M = useMemo(() => new THREE.Matrix4(), []);
  const somaG = useMemo(() => blob(0.16, [1, 1.3, 1], 0.12, 2, 1, 3), []);
  useFrame(({ clock }) => { const im = sp.current; if (!im) return; const t = clock.elapsedTime; net.links.forEach((l, i) => { const k = (t * 0.45 + l.ph * 3) % 3; if (k < 1) { const p = l.c.getPointAt(k); M.makeTranslation(p.x, p.y, p.z); } else M.makeScale(0, 0, 0); im.setMatrixAt(i, M); }); im.instanceMatrix.needsUpdate = true; });
  return (
    <group>
      {net.cells.map((c, i) => <mesh key={i} geometry={somaG} material={cm} position={c} />)}
      <mesh geometry={net.geo} material={lm} />
      <instancedMesh ref={sp} args={[new THREE.SphereGeometry(0.06, 10, 8), glowMat('#9fe8ff'), net.links.length]} frustumCulled={false} />
      <Anchor id="neuron" position={net.cells[0].toArray() as Vec} /><Anchor id="connection" position={net.links[4].c.getPointAt(0.5).toArray() as Vec} />
    </group>
  );
}

/* ───────── the knee-jerk reflex ───────── */
function Reflex({ p }: { p: NeuronP }) {
  const S = useScene();
  const cord = useMemo(() => new THREE.CylinderGeometry(0.9, 0.9, 1.4, 64, 1, false).rotateX(Math.PI / 2), []);
  const butterfly = useMemo(() => { const sh = new THREE.Shape(); const pts: THREE.Vector2[] = []; for (let i = 0; i <= 64; i++) { const a = (i / 64) * TAU; const r = 0.28 + 0.32 * Math.abs(Math.sin(a)) ** 0.8 * (Math.sin(a) > 0 ? 1.1 : 0.95) * (0.55 + 0.45 * Math.abs(Math.cos(a))); pts.push(new THREE.Vector2(Math.cos(a) * r * 1.2, Math.sin(a) * r * 0.85)); } sh.setFromPoints(pts); const g = new THREE.ExtrudeGeometry(sh, { depth: 1.42, bevelEnabled: false }); g.translate(0, 0, -0.71); return g; }, []);
  const sens = useMemo(() => curve([[4.5, -2.6, 0.4], [3.6, -1.4, 0.4], [2.4, -0.2, 0.5], [1.55, 0.1, 0.55], [0.9, 0.2, 0.45], [0.3, 0.4, 0.3], [0.1, 0.2, 0.0]]), []);
  const mot = useMemo(() => curve([[0.1, 0.2, 0.0], [0.1, 0.0, -0.3], [0.5, -0.3, -0.5], [1.3, -0.4, -0.55], [2.6, -1.1, -0.4], [3.6, -2.3, -0.2]]), []);
  const inter = useMemo(() => curve([[0.3, 0.4, 0.3], [-0.1, 0.0, 0.0], [0.2, -0.25, -0.35], [1.2, -0.5, -0.8], [2.5, -1.6, -1.1], [3.0, -2.8, -1.2]]), []);
  const cordM = useHi('cord', '#f1e6d6', { rough: 0.55, sheen: 0.4 });
  const greyM = useHi('grey', '#c99a8a', { rough: 0.6 });
  const sM = useHi(['sensory', 'ganglion', 'receptor'], '#5ac8ff', { rough: 0.4, clear: 0.4 });
  const mM = useHi('motor', '#ff8a5c', { rough: 0.4, clear: 0.4 });
  const iM = useHi('interneuron', '#c98bd9', { rough: 0.4 });
  const musM = useHi('quadriceps', '#b8443f', { rough: 0.5, sheen: 0.6 });
  const hamM = useHi('hamstring', '#a33a36', { rough: 0.5, sheen: 0.6 });
  const quad = useRef<THREE.Mesh>(null), spark = useRef<THREE.Mesh>(null), spark2 = useRef<THREE.Mesh>(null);
  const mus = useMemo(() => blob(0.5, [0.75, 1.7, 0.75], 0.05, 1.5, 3, 4), []);
  useFrame(() => {
    const st = S.st.current; // 0 tap, 1 sensory, 2 synapse, 3 motor, 4 contract
    const s = spark.current, s2 = spark2.current;
    if (s) { if (st > 0.5 && st < 1.6) { s.visible = true; s.position.copy(sens.getPointAt(Math.min(1, (st - 0.5) / 1.1))); } else if (st >= 1.6 && st < 3.2) { s.visible = true; s.position.copy(mot.getPointAt(Math.min(1, Math.max(0, (st - 2.0) / 1.2)))); } else s.visible = false; }
    if (s2) { s2.visible = st >= 2 && st < 3.4 && !!p.inhib; s2.position.copy(inter.getPointAt(Math.min(1, Math.max(0, (st - 2.0) / 1.4)))); }
    const k = smooth(st - 3); if (quad.current) { quad.current.scale.set(1 + k * 0.18, 1 - k * 0.14, 1 + k * 0.18); }
    musM.emissive.set('#ff6b4a'); if (S.sel !== 'quadriceps') musM.emissiveIntensity = k * 0.35;
  });
  return (
    <group position={[-1.2, 0.6, 0]}>
      <mesh geometry={cord} material={cordM} rotation={[0, 0, 0]} />
      <mesh geometry={butterfly} material={greyM} scale={[1, 1.002, 1]} />
      <mesh geometry={varTube(sens, 160, 8, () => 0.045)} material={sM} />
      <mesh material={sM} position={[1.55, 0.1, 0.55]}><sphereGeometry args={[0.16, 20, 14]} /></mesh>
      <mesh geometry={varTube(mot, 160, 8, () => 0.05)} material={mM} />
      <mesh material={mM} position={[0.12, 0.05, -0.3]}><sphereGeometry args={[0.1, 16, 12]} /></mesh>
      {p.inhib && <mesh geometry={varTube(inter, 160, 8, () => 0.035)} material={iM} />}
      <mesh ref={quad} geometry={mus} material={musM} position={[3.7, -3.0, 0]} />
      {p.inhib && <mesh geometry={mus} material={hamM} position={[3.0, -3.3, -1.3]} scale={0.8} />}
      <mesh material={sM} position={[4.5, -2.6, 0.4]}><torusGeometry args={[0.12, 0.04, 8, 18]} /></mesh>
      <mesh ref={spark} visible={false}><sphereGeometry args={[0.11, 14, 10]} /><meshBasicMaterial color="#fff6c8" toneMapped={false} /></mesh>
      <mesh ref={spark2} visible={false}><sphereGeometry args={[0.09, 14, 10]} /><meshBasicMaterial color="#e6b8ff" toneMapped={false} /></mesh>
      <Anchor id="cord" position={[-0.75, 0.45, 0.72]} /><Anchor id="grey" position={[-0.35, 0.25, 0.72]} />
      <Anchor id="sensory" position={sens.getPointAt(0.3).toArray() as Vec} /><Anchor id="ganglion" position={[1.55, 0.3, 0.55]} />
      <Anchor id="motor" position={mot.getPointAt(0.6).toArray() as Vec} /><Anchor id="quadriceps" position={[4.2, -2.6, 0.4]} />
      <Anchor id="receptor" position={[4.6, -2.4, 0.5]} /><Anchor id="interneuron" position={inter.getPointAt(0.5).toArray() as Vec} />
      <Anchor id="hamstring" position={[3.0, -2.8, -1.3]} />
    </group>
  );
}

/* ───────── glia ───────── */
function Glia() {
  const astro = useMemo(() => { const gs: THREE.BufferGeometry[] = [blob(0.3, [1, 1, 1], 0.1, 2, 4, 4)]; fibSphere(14, 1).forEach((d, i) => { gs.push(treeGeo(tree({ root: d.clone().multiplyScalar(0.25), dir: d, len: 0.5, r: 0.045, depth: 2, spread: 0.6, shrink: 0.7, seed: 30 + i, wiggle: 0.3 }), 5)); }); return merge(gs); }, []);
  const vessel = useMemo(() => varTube(curve([[-3, 1.6, -0.5], [-1, 1.4, -0.3], [1, 1.5, -0.6], [3, 1.3, -0.4]]), 80, 16, () => 0.28), []);
  const axons = useMemo(() => [-0.6, 0, 0.6].map((z) => curve([[-2.5, -1.2, z], [0, -1.25, z + 0.1], [2.5, -1.15, z]])), []);
  const aM = useHi('astrocyte', '#7fd0a0', { rough: 0.45, sheen: 0.5 });
  const vM = useHi(['vessel', 'barrier'], PAL.artery, { rough: 0.4, clear: 0.6, opacity: 0.85 });
  const axM = useHi('axon', '#f2c96b', { rough: 0.4 });
  const oM = useHi('oligodendrocyte', '#9fb8ff', { rough: 0.4, sheen: 0.5 });
  const mgM = useHi('microglia', '#e88aa0', { rough: 0.45 });
  const nM = useHi('neuron', '#e8b04a', { rough: 0.45, sheen: 0.5 });
  const mg = useMemo(() => displace(new THREE.IcosahedronGeometry(0.2, 4), (q) => { const n = q.clone().normalize(); let d = 0; for (const a of fibSphere(7, 1)) d += 0.5 * Math.pow(Math.max(0, n.dot(a)), 30); return d; }), []);
  return (
    <group>
      <mesh geometry={astro} material={aM} position={[0, 0.5, 0]} />
      <mesh geometry={vessel} material={vM} />
      {axons.map((c, i) => <mesh key={i} geometry={varTube(c, 60, 8, () => 0.05)} material={axM} />)}
      {axons.map((c, i) => <mesh key={'m' + i} geometry={varTube(new THREE.CatmullRomCurve3(Array.from({ length: 6 }, (_, k) => c.getPointAt(0.35 + k * 0.05))), 30, 14, (u) => 0.12 * Math.min(1, Math.sin(u * Math.PI) * 4))} material={oM} />)}
      <mesh material={oM} position={[0.6, -0.45, 0]}><sphereGeometry args={[0.22, 20, 14]} /></mesh>
      {axons.map((c, i) => <mesh key={'p' + i} geometry={varTube(curve([[0.6, -0.45, 0], [0.55, -0.8, c.getPointAt(0.45).z * 0.6], c.getPointAt(0.45).toArray() as Vec]), 20, 6, () => 0.03)} material={oM} />)}
      <mesh geometry={mg} material={mgM} position={[-1.6, -0.3, 0.6]} />
      <mesh material={nM} position={[1.8, 0.2, 0.4]}><sphereGeometry args={[0.32, 24, 16]} /></mesh>
      <Anchor id="astrocyte" position={[0.2, 0.8, 0.3]} /><Anchor id="vessel" position={[-2, 1.8, -0.3]} /><Anchor id="barrier" position={[1.2, 1.55, -0.2]} />
      <Anchor id="oligodendrocyte" position={[0.6, -0.2, 0.15]} /><Anchor id="microglia" position={[-1.6, 0, 0.7]} />
      <Anchor id="neuron" position={[1.8, 0.55, 0.5]} /><Anchor id="axon" position={[-2.2, -1.2, 0.6]} />
    </group>
  );
}

export default function NeuronEngine({ p }: { p: NeuronP }) {
  const mode = p.mode ?? 'neuron';
  if (mode === 'synapse') return <Synapse p={p} />;
  if (mode === 'network') return <Network />;
  if (mode === 'reflex') return <Reflex p={p} />;
  if (mode === 'glia') return <Glia />;
  return <Neuron p={p} />;
}
