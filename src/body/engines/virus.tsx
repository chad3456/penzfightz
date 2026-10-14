/**
 * Viruses, built from parameters: an enveloped sphere studded with spikes
 * (coronavirus, influenza, HIV, measles), a bare icosahedral capsid tiled
 * with capsomers (adenovirus, polio, HPV), rods and filaments (Ebola,
 * tobacco mosaic), a bullet (rabies), a brick (pox) and a phage on legs.
 * A cutaway plane opens it to show the matrix, the core and the genome.
 */
import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Anchor, useCtl, useHi } from '../stage';
import { V, rng, fbm, displace, fibSphere, mergeGeometries, varTube, curve, TAU, PAL } from '../kit';

type SpikeKind = 'crown' | 'club' | 'knob' | 'fiber' | 'mushroom' | 'pin' | 'none';
export interface VirusP {
  shape?: 'sphere' | 'icosa' | 'rod' | 'filament' | 'bullet' | 'brick' | 'phage';
  r?: number; envelope?: boolean; color?: string; envColor?: string;
  spikes?: { n: number; kind: SpikeKind; color?: string; len?: number };
  spikes2?: { n: number; kind: SpikeKind; color?: string; len?: number };
  genome?: 'rna' | 'dna' | 'segmented' | 'circular'; genomeColor?: string;
  core?: 'cone' | 'sphere' | 'icosa' | 'none'; matrix?: boolean;
  antibodies?: number; bumpy?: number; seed?: number;
}

function spikeGeo(kind: SpikeKind, len: number) {
  const gs: THREE.BufferGeometry[] = [];
  const stalk = (h: number, r: number) => { const g = new THREE.CylinderGeometry(r, r * 1.15, h, 8); g.translate(0, h / 2, 0); return g; };
  if (kind === 'crown') { gs.push(stalk(len * 0.55, 0.025)); for (let k = 0; k < 3; k++) { const a = (k / 3) * TAU; const s = new THREE.SphereGeometry(0.055, 10, 8); s.scale(1, 1.6, 1); s.translate(Math.cos(a) * 0.04, len * 0.72, Math.sin(a) * 0.04); gs.push(s); } }
  else if (kind === 'club') { gs.push(stalk(len * 0.6, 0.022)); const c = new THREE.ConeGeometry(0.06, len * 0.5, 10); c.rotateX(Math.PI); c.translate(0, len * 0.8, 0); gs.push(c); }
  else if (kind === 'knob') { gs.push(stalk(len * 0.6, 0.02)); const s = new THREE.SphereGeometry(0.05, 10, 8); s.translate(0, len * 0.7, 0); gs.push(s); }
  else if (kind === 'fiber') { gs.push(stalk(len, 0.012)); const s = new THREE.SphereGeometry(0.045, 10, 8); s.translate(0, len + 0.03, 0); gs.push(s); }
  else if (kind === 'mushroom') { gs.push(stalk(len * 0.55, 0.025)); const s = new THREE.SphereGeometry(0.07, 12, 8, 0, TAU, 0, Math.PI / 2); s.translate(0, len * 0.55, 0); gs.push(s); }
  else if (kind === 'pin') { gs.push(stalk(len * 0.85, 0.018)); const b = new THREE.BoxGeometry(0.07, 0.03, 0.07); b.translate(0, len * 0.88, 0); gs.push(b); }
  if (!gs.length) return new THREE.BufferGeometry();
  return mergeGeometries(gs.map((g) => g.toNonIndexed()))!;
}

function Spikes({ pts, kind, color, len, id, scale = 1 }: { pts: { p: THREE.Vector3; n: THREE.Vector3 }[]; kind: SpikeKind; color: string; len: number; id: string; scale?: number }) {
  const geo = useMemo(() => spikeGeo(kind, len), [kind, len]);
  const m = useHi(id, color, { rough: 0.5, clear: 0.4, sheen: 0.4 });
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const im = ref.current; if (!im) return;
    const q = new THREE.Quaternion(), up = V(0, 1, 0), M = new THREE.Matrix4(), S = V(scale, scale, scale);
    pts.forEach((pt, i) => { q.setFromUnitVectors(up, pt.n); M.compose(pt.p, q, S); im.setMatrixAt(i, M); });
    im.instanceMatrix.needsUpdate = true; im.computeBoundingSphere();
  }, [pts, scale, geo]);
  if (kind === 'none' || !pts.length) return null;
  return <instancedMesh ref={ref} args={[geo, m, pts.length]} />;
}

function Genome({ kind, r, color, seed }: { kind: string; r: number; color: string; seed: number }) {
  const m = useHi('genome', color, { rough: 0.35, emissive: color, ei: 0.25 });
  const geo = useMemo(() => {
    const R = rng(seed);
    if (kind === 'segmented') {
      const gs: THREE.BufferGeometry[] = [];
      const pos = [V(0, 0, 0), ...Array.from({ length: 7 }, (_, i) => V(Math.cos((i / 7) * TAU) * r * 0.38, (R() - 0.5) * 0.1, Math.sin((i / 7) * TAU) * r * 0.38))];
      pos.forEach((p, i) => { const L = r * (0.55 + (i % 3) * 0.12); const c = curve(Array.from({ length: 14 }, (_, k) => V(p.x + Math.cos(k * 1.3) * 0.05, p.y - L / 2 + (k / 13) * L, p.z + Math.sin(k * 1.3) * 0.05))); gs.push(varTube(c, 60, 8, () => 0.035).toNonIndexed()); });
      return mergeGeometries(gs)!;
    }
    const pts: THREE.Vector3[] = []; let p = V();
    for (let i = 0; i < 90; i++) { p = p.clone().add(V(R() - 0.5, R() - 0.5, R() - 0.5).multiplyScalar(r * 0.32)); if (p.length() > r * 0.62) p.multiplyScalar((r * 0.62) / p.length()); pts.push(p); }
    const thick = kind === 'dna' ? 0.03 : 0.022;
    return varTube(curve(pts), 600, 6, () => thick);
  }, [kind, r, seed]);
  return <mesh geometry={geo} material={m} />;
}

/** surface points with normals for a given shape */
function surface(shape: string, r: number, n: number, seed: number) {
  const out: { p: THREE.Vector3; n: THREE.Vector3 }[] = []; const R = rng(seed);
  if (shape === 'sphere' || shape === 'icosa') { for (const p of fibSphere(n, r)) { const j = p.clone().add(V(R() - 0.5, R() - 0.5, R() - 0.5).multiplyScalar(0.06)).normalize(); out.push({ p: j.clone().multiplyScalar(r), n: j }); } }
  else if (shape === 'filament' || shape === 'rod' || shape === 'bullet') {
    const L = shape === 'filament' ? r * 5 : shape === 'bullet' ? r * 2.2 : r * 4, rr = shape === 'filament' ? r * 0.28 : r * 0.42;
    for (let i = 0; i < n; i++) { const t = R(), a = R() * TAU, y = -L / 2 + t * L; const nn = V(Math.cos(a), 0, Math.sin(a)); let rad = rr; if (shape === 'bullet' && y > L / 2 - rr) { const k = (y - (L / 2 - rr)) / rr; rad = rr * Math.sqrt(Math.max(0, 1 - k * k)); nn.y = k; nn.normalize(); } out.push({ p: V(nn.x * rad, y, nn.z * rad).add(shape === 'filament' ? V(Math.sin(y * 0.6) * 0.3, 0, 0) : V()), n: nn }); }
  }
  return out;
}

export default function Virus({ p }: { p: VirusP }) {
  const shape = p.shape ?? 'sphere', r = p.r ?? 1, seed = p.seed ?? 3;
  const cut = useCtl('cut', 0);
  const { gl } = useThree(); gl.localClippingEnabled = true;
  const plane = useMemo(() => new THREE.Plane(V(0, 0, -1), 10), []);
  useFrame(() => { plane.constant = cut > 0.01 ? (1 - cut) * r * 1.4 : 10; });

  const envM = useHi('envelope', p.envColor ?? PAL.membrane, { rough: 0.55, sheen: 0.8, clear: 0.5, side: THREE.DoubleSide });
  const capM = useHi(['capsid', 'head'], p.color ?? PAL.capsid, { rough: 0.35, clear: 0.6, flat: shape === 'icosa', side: THREE.DoubleSide });
  const matM = useHi('matrix', '#c99a6a', { rough: 0.6, side: THREE.DoubleSide });
  const coreM = useHi('core', '#e8c84a', { rough: 0.4, clear: 0.5, side: THREE.DoubleSide });
  for (const m of [envM, capM, matM]) m.clippingPlanes = [plane];

  const envGeo = useMemo(() => {
    if (shape === 'sphere') { const g = new THREE.IcosahedronGeometry(r, 6); return displace(g, (q) => (p.bumpy ?? 0.025) * r * fbm(q.x * 3 + seed, q.y * 3, q.z * 3, 3)); }
    if (shape === 'icosa') { const g = new THREE.IcosahedronGeometry(r, 0); return g; }
    if (shape === 'rod' || shape === 'filament') { const L = shape === 'filament' ? r * 5 : r * 4, rr = shape === 'filament' ? r * 0.28 : r * 0.42; const pts = Array.from({ length: 12 }, (_, i) => V(shape === 'filament' ? Math.sin((-L / 2 + (i / 11) * L) * 0.6) * 0.3 : 0, -L / 2 + (i / 11) * L, 0)); return varTube(curve(pts), 80, 24, (t) => rr * Math.min(1, Math.sqrt(Math.min(t, 1 - t) * 40))); }
    if (shape === 'bullet') { const L = r * 2.2, rr = r * 0.42; const pts: THREE.Vector2[] = []; for (let i = 0; i <= 24; i++) { const y = -L / 2 + (i / 24) * (L - rr); pts.push(new THREE.Vector2(rr, y)); } for (let i = 1; i <= 12; i++) { const a = (i / 12) * Math.PI / 2; pts.push(new THREE.Vector2(rr * Math.cos(a), L / 2 - rr + rr * Math.sin(a))); } pts.unshift(new THREE.Vector2(0, -L / 2)); return new THREE.LatheGeometry(pts, 32); }
    if (shape === 'brick') { const g = new THREE.SphereGeometry(r, 64, 48); g.scale(1.25, 0.95, 0.75); return displace(g, (q) => 0.05 * r * Math.pow(Math.abs(Math.sin(q.x * 7 + Math.sin(q.y * 5) * 0.8) * Math.sin(q.z * 7 + q.y * 4)), 0.6)); }
    return new THREE.IcosahedronGeometry(r, 1);
  }, [shape, r, seed, p.bumpy]);

  // capsomers tiled on each triangular face of the icosahedron (hexons), pentons at the twelve corners
  const capsomers = useMemo(() => {
    if (shape !== 'icosa') return null;
    const ico = new THREE.IcosahedronGeometry(r, 0), pos = ico.attributes.position as THREE.BufferAttribute;
    const n = 5, seen = new Set<string>(), hex: { p: THREE.Vector3; n: THREE.Vector3 }[] = [], pen: { p: THREE.Vector3; n: THREE.Vector3 }[] = [];
    for (let f = 0; f < pos.count; f += 3) {
      const a = V().fromBufferAttribute(pos, f), b = V().fromBufferAttribute(pos, f + 1), c = V().fromBufferAttribute(pos, f + 2);
      const nn = b.clone().sub(a).cross(c.clone().sub(a)).normalize();
      for (let i = 0; i <= n; i++) for (let j = 0; j <= n - i; j++) {
        const k = n - i - j; const pt = a.clone().multiplyScalar(i / n).addScaledVector(b, j / n).addScaledVector(c, k / n);
        const key = pt.toArray().map((x) => x.toFixed(3)).join(); if (seen.has(key)) continue; seen.add(key);
        const corner = i === n || j === n || k === n;
        (corner ? pen : hex).push({ p: pt, n: corner ? pt.clone().normalize() : nn });
      }
    }
    const g = new THREE.CylinderGeometry(r * 0.068, r * 0.08, r * 0.05, 6); g.rotateX(Math.PI / 2);
    const g5 = new THREE.CylinderGeometry(r * 0.075, r * 0.085, r * 0.07, 5); g5.rotateX(Math.PI / 2);
    return { g, g5, hex, pen };
  }, [shape, r]);
  const capsRef = useRef<THREE.InstancedMesh>(null), penRef = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    if (!capsomers) return;
    const M = new THREE.Matrix4(), q = new THREE.Quaternion(), z = V(0, 0, 1);
    const put = (im: THREE.InstancedMesh | null, list: { p: THREE.Vector3; n: THREE.Vector3 }[]) => { if (!im) return; list.forEach((pt, i) => { q.setFromUnitVectors(z, pt.n); M.compose(pt.p, q, V(1, 1, 1)); im.setMatrixAt(i, M); }); im.instanceMatrix.needsUpdate = true; im.computeBoundingSphere(); };
    put(capsRef.current, capsomers.hex); put(penRef.current, capsomers.pen);
  }, [capsomers]);
  const penM = useHi('spike', '#e9d8a6', { rough: 0.4, clear: 0.5 });

  const sp = useMemo(() => p.spikes ? (shape === 'icosa' && capsomers && p.spikes.n <= 12 ? capsomers.pen.map((x) => ({ p: x.p.clone().multiplyScalar(1.02), n: x.n })) : surface(shape, (shape === 'icosa' ? r * 0.9 : r) * (shape === 'sphere' ? 0.99 : 1), p.spikes.n, seed)) : [], [shape, r, p.spikes, seed, capsomers]);
  const sp2 = useMemo(() => p.spikes2 ? surface(shape, r * 0.99, p.spikes2.n, seed + 7) : [], [shape, r, p.spikes2, seed]);
  const abs = useMemo(() => p.antibodies ? fibSphere(p.antibodies, r * 1.42) : [], [p.antibodies, r]);
  const abM = useHi('antibody', PAL.antibody, { rough: 0.4, clear: 0.5 });
  const abGeo = useMemo(() => { const gs: THREE.BufferGeometry[] = []; const arm = (a: number) => { const c = new THREE.CapsuleGeometry(0.03, 0.14, 4, 8); c.rotateZ(a); c.translate(Math.sin(-a) * 0.08, 0.16, 0); return c; }; const st = new THREE.CapsuleGeometry(0.03, 0.14, 4, 8); st.translate(0, 0, 0); gs.push(st, arm(0.6), arm(-0.6)); return mergeGeometries(gs.map((x) => x.toNonIndexed()))!; }, []);

  if (shape === 'phage') return <Phage />;

  const big = Math.max(r, shape === 'filament' ? r * 2.5 : shape === 'rod' ? r * 2 : r);
  return (
    <group rotation={shape === 'filament' || shape === 'rod' ? [0, 0, 0.5] : [0, 0, 0]}>
      <mesh geometry={envGeo} material={p.envelope === false || shape === 'icosa' ? capM : envM} />
      {capsomers && <instancedMesh ref={capsRef} args={[capsomers.g, capM, capsomers.hex.length]} />}
      {capsomers && <instancedMesh ref={penRef} args={[capsomers.g5, penM, capsomers.pen.length]} />}
      {p.matrix && shape !== 'icosa' && <mesh material={matM}><sphereGeometry args={[r * 0.9, 48, 32]} /></mesh>}
      {p.core === 'cone' && <mesh material={coreM} rotation={[0, 0, 0.4]}><coneGeometry args={[r * 0.38, r * 1.1, 24, 1, true]} /></mesh>}
      {p.core === 'sphere' && <mesh material={coreM}><sphereGeometry args={[r * 0.6, 32, 24]} /></mesh>}
      {p.core === 'icosa' && <mesh material={coreM}><icosahedronGeometry args={[r * 0.6, 0]} /></mesh>}
      {p.genome && <Genome kind={p.genome} r={shape === 'filament' || shape === 'rod' ? r * 0.5 : r} color={p.genomeColor ?? (p.genome === 'dna' ? PAL.dna : PAL.rna)} seed={seed} />}
      {p.spikes && <Spikes pts={sp} kind={p.spikes.kind} color={p.spikes.color ?? PAL.spike} len={p.spikes.len ?? 0.28 * r} id="spike" />}
      {p.spikes2 && <Spikes pts={sp2} kind={p.spikes2.kind} color={p.spikes2.color ?? '#f2a23a'} len={p.spikes2.len ?? 0.24 * r} id="spike2" />}
      {abs.map((a, i) => <mesh key={i} geometry={abGeo} material={abM} position={a} quaternion={new THREE.Quaternion().setFromUnitVectors(V(0, -1, 0), a.clone().normalize().negate())} />)}
      <Anchor id="spike" position={sp[Math.floor(sp.length * 0.3)] ? sp[Math.floor(sp.length * 0.3)].p.clone().multiplyScalar(1.25).toArray() as [number, number, number] : [0, big * 1.2, 0]} />
      <Anchor id="spike2" position={sp2[5] ? sp2[5].p.clone().multiplyScalar(1.22).toArray() as [number, number, number] : [0, 0, 0]} />
      <Anchor id="envelope" position={[r * 0.75, r * 0.55, r * 0.35]} />
      <Anchor id="capsid" position={[r * 0.6, -r * 0.6, r * 0.5]} />
      <Anchor id="matrix" position={[-r * 0.55, -r * 0.5, r * 0.35]} />
      <Anchor id="core" position={[0, r * 0.2, r * 0.25]} inner />
      <Anchor id="genome" position={[-r * 0.2, -r * 0.1, r * 0.3]} inner />
      <Anchor id="antibody" position={abs[0] ? abs[0].toArray() as [number, number, number] : [0, 0, 0]} />
    </group>
  );
}

/** A tailed bacteriophage (T4-like): head, collar, tail sheath, baseplate, six legs. */
function Phage() {
  const head = useHi('head', '#7fc6d9', { rough: 0.3, clear: 0.7, flat: true });
  const tail = useHi('tail', '#c9c4b4', { rough: 0.45, metal: 0.2 });
  const fib = useHi('fiber', '#e8b84a', { rough: 0.5 });
  const dna = useHi('genome', PAL.dna, { emissive: PAL.dna, ei: 0.3 });
  const legs = useMemo(() => Array.from({ length: 6 }, (_, i) => { const a = (i / 6) * TAU; return varTube(curve([V(0, -1.55, 0), V(Math.cos(a) * 0.55, -1.45, Math.sin(a) * 0.55), V(Math.cos(a) * 0.95, -2.3, Math.sin(a) * 0.95)], 0.3), 30, 6, () => 0.025); }), []);
  const headGeo = useMemo(() => { const gg = new THREE.IcosahedronGeometry(0.55, 0); gg.scale(1, 1.5, 1); return gg; }, []);
  return (
    <group position={[0, 0.6, 0]}>
      <mesh geometry={headGeo} material={head} position={[0, 0.9, 0]} />
      <mesh material={dna} position={[0, 0.9, 0]} scale={[0.7, 1, 0.7]}><torusKnotGeometry args={[0.25, 0.04, 200, 8, 5, 7]} /></mesh>
      <mesh material={tail} position={[0, 0.02, 0]}><cylinderGeometry args={[0.18, 0.18, 0.12, 16]} /></mesh>
      <mesh material={tail} position={[0, -0.75, 0]}><cylinderGeometry args={[0.13, 0.13, 1.45, 20, 18]} /></mesh>
      {Array.from({ length: 14 }, (_, i) => <mesh key={i} material={tail} position={[0, -0.1 - i * 0.1, 0]}><torusGeometry args={[0.135, 0.025, 6, 20]} /></mesh>)}
      <mesh material={tail} position={[0, -1.5, 0]}><cylinderGeometry args={[0.32, 0.26, 0.1, 6]} /></mesh>
      {legs.map((lg, i) => <mesh key={i} geometry={lg} material={fib} />)}
      <Anchor id="head" position={[0.5, 1.2, 0.3]} />
      <Anchor id="genome" position={[0, 0.9, 0.3]} />
      <Anchor id="tail" position={[0.18, -0.7, 0.1]} />
      <Anchor id="fiber" position={[0.9, -2.2, 0.3]} />
      <Anchor id="baseplate" position={[0.3, -1.55, 0.1]} />
    </group>
  );
}
