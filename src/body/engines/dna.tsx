/**
 * DNA and genes. A double helix built base pair by base pair (A–T, G–C in
 * four colours) on instanced parts, so it can unzip, copy itself, be read
 * into RNA, be cut by CRISPR, or wrap round histones. Also the ribosome
 * reading codons into a protein chain, chromosomes, a karyotype and a
 * folded protein.
 */
import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Anchor, useHi, useScene } from '../stage';
import { V, rng, blob, curve, varTube, TAU, smooth, clamp, merge, lerp } from '../kit';

type Vec = [number, number, number];
export interface DnaP {
  mode?: 'helix' | 'replication' | 'transcription' | 'translation' | 'crispr' | 'mutation' | 'chromatin' | 'chromosome' | 'karyotype' | 'protein' | 'splicing' | 'pcr' | 'telomere' | 'methyl' | 'circle';
  seq?: string; n?: number; mut?: 'sub' | 'del' | 'ins'; trisomy?: number; sex?: 'XX' | 'XY';
}
const BASE: Record<string, string> = { A: '#5ac46a', T: '#e8584a', G: '#f2c94c', C: '#4f8fe0', U: '#ff9d3a' };
const PAIR: Record<string, string> = { A: 'T', T: 'A', G: 'C', C: 'G' };
const R = 0.5, RISE = 0.17, TW = TAU / 10.5, PHI = 2.35;

type BP = { a: THREE.Vector3; b: THREE.Vector3; pa: boolean; ca: string; cb: string; showA?: boolean; showB?: boolean; glow?: boolean; newA?: boolean; newB?: boolean };
/** draws a set of base pairs (positions updated every frame by `layout`) */
function Strands({ n, layout, id = 'dna', bone = '#dfe6ee', newBone = '#ff9d6b' }: { n: number; layout: (i: number, st: number, t: number, out: BP) => void; id?: string; bone?: string; newBone?: string }) {
  const S = useScene();
  const phos = useRef<THREE.InstancedMesh>(null), seg = useRef<THREE.InstancedMesh>(null), base = useRef<THREE.InstancedMesh>(null);
  const bm = useHi(['backbone', id], '#ffffff', { rough: 0.35, clear: 0.6 });
  const basem = useHi(['base', 'pair', id], '#ffffff', { rough: 0.4, clear: 0.4 });
  const bps = useMemo(() => Array.from({ length: n }, () => ({ a: V(), b: V(), pa: true, ca: 'A', cb: 'T' } as BP)), [n]);
  const tmp = useMemo(() => ({ M: new THREE.Matrix4(), q: new THREE.Quaternion(), c: new THREE.Color(), up: V(0, 1, 0), d: V(), m: V() }), []);
  useLayoutEffect(() => { for (const r of [phos, seg, base]) { const im = r.current; if (!im) continue; im.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(im.count * 3).fill(1), 3); } }, [n]);
  useFrame(({ clock }) => {
    const st = S.st.current, t = clock.elapsedTime, { M, q, c, up, d, m } = tmp;
    for (let i = 0; i < n; i++) { const o = bps[i]; o.showA = o.showB = true; o.glow = false; o.newA = o.newB = false; layout(i, st, t, o); }
    const P = phos.current, G = seg.current, B = base.current; if (!P || !G || !B) return;
    let k = 0, g = 0, b = 0;
    const hide = (im: THREE.InstancedMesh, j: number) => { M.makeScale(0, 0, 0); im.setMatrixAt(j, M); };
    const rod = (im: THREE.InstancedMesh, j: number, from: THREE.Vector3, to: THREE.Vector3, col: string, w = 1) => { d.subVectors(to, from); const L = d.length(); if (L < 1e-4) return hide(im, j); q.setFromUnitVectors(up, d.normalize()); m.addVectors(from, to).multiplyScalar(0.5); M.compose(m, q, V(w, L, w)); im.setMatrixAt(j, M); im.setColorAt(j, c.set(col)); };
    for (let i = 0; i < n; i++) {
      const o = bps[i];
      for (const [p, show, isNew] of [[o.a, o.showA, o.newA], [o.b, o.showB, o.newB]] as [THREE.Vector3, boolean, boolean][]) { if (show) { M.makeTranslation(p.x, p.y, p.z); P.setMatrixAt(k, M); P.setColorAt(k, c.set(isNew ? newBone : bone)); } else hide(P, k); k++; }
      if (i < n - 1) { const nx = bps[i + 1]; if (o.showA && nx.showA) rod(G, g, o.a, nx.a, o.newA ? newBone : bone); else hide(G, g); g++; if (o.showB && nx.showB) rod(G, g, o.b, nx.b, o.newB ? newBone : bone); else hide(G, g); g++; }
      const mid = o.pa ? o.a.clone().lerp(o.b, 0.5) : null;
      const ca = o.glow ? '#ffffff' : BASE[o.ca] ?? '#ccc', cb = o.glow ? '#ffffff' : BASE[o.cb] ?? '#ccc';
      if (o.showA) rod(B, b, o.a, mid ?? o.a.clone().add(V(-o.a.x, 0, -o.a.z).normalize().multiplyScalar(0.22)), ca, 1); else hide(B, b); b++;
      if (o.showB && o.cb) rod(B, b, o.b, mid ?? o.b.clone().add(V(-o.b.x, 0, -o.b.z).normalize().multiplyScalar(0.22)), cb, 1); else hide(B, b); b++;
    }
    for (const im of [P, G, B]) { im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; }
  });
  return (
    <group>
      <instancedMesh ref={phos} args={[new THREE.SphereGeometry(0.075, 12, 10), bm, n * 2]} frustumCulled={false} />
      <instancedMesh ref={seg} args={[new THREE.CylinderGeometry(0.045, 0.045, 1, 8), bm, n * 2]} frustumCulled={false} />
      <instancedMesh ref={base} args={[new THREE.CylinderGeometry(0.05, 0.05, 1, 8), basem, n * 2]} frustumCulled={false} />
    </group>
  );
}

const seqOf = (s: string | undefined, n: number, seed = 3) => { const r = rng(seed); return Array.from({ length: n }, (_, i) => (s ? s[i % s.length] : 'ATGC'[Math.floor(r() * 4)])); };
const helixAt = (i: number, axis: (i: number) => THREE.Vector3, frame: (i: number) => [THREE.Vector3, THREE.Vector3], o: BP, sep = 0, phase = 0) => {
  const th = i * TW + phase, [u, w] = frame(i), c = axis(i);
  o.a.copy(c).addScaledVector(u, Math.cos(th) * (R + sep)).addScaledVector(w, Math.sin(th) * (R + sep));
  o.b.copy(c).addScaledVector(u, Math.cos(th + PHI) * (R + sep)).addScaledVector(w, Math.sin(th + PHI) * (R + sep));
};
const Y = (i: number, n: number) => V(0, (i - n / 2) * RISE, 0);
const FRAME_Y: () => [THREE.Vector3, THREE.Vector3] = () => [V(1, 0, 0), V(0, 0, 1)];

/* ───────── modes ───────── */
function Helix({ p }: { p: DnaP }) {
  const n = p.n ?? 42, seq = useMemo(() => seqOf(p.seq, n), [p.seq, n]);
  const mutAt = Math.floor(n / 2);
  const layout = (i: number, st: number, _t: number, o: BP) => {
    helixAt(i, (k) => Y(k, n), FRAME_Y, o); o.pa = true; o.ca = seq[i]; o.cb = PAIR[seq[i]];
    if (p.mode === 'mutation' && Math.abs(i - mutAt) <= (p.mut === 'ins' ? 1 : 0)) {
      const k = smooth(st - 0.5);
      if (p.mut === 'del') { o.showA = o.showB = k < 0.5; } else if (k > 0.5) { o.ca = p.mut === 'ins' ? 'G' : seq[i] === 'A' ? 'G' : 'A'; o.cb = PAIR[o.ca]; }
      o.glow = st < 0.5 ? false : Math.sin(_t * 5) > 0.6;
    }
    if (p.mode === 'methyl') o.glow = false;
  };
  const meth = useMemo(() => p.mode === 'methyl' ? seq.map((b, i) => (b === 'C' && i % 2 === 0 ? i : -1)).filter((i) => i >= 0) : [], [p.mode, seq]);
  const mM = useHi('methyl', '#ff5ac8', { emissive: '#ff5ac8', ei: 0.4 });
  return (
    <group rotation={[0, 0, 0.12]}>
      <Strands n={n} layout={layout} />
      {meth.map((i) => { const o = { a: V(), b: V() } as BP; helixAt(i, (k) => Y(k, n), FRAME_Y, o); const pos = o.b.clone().lerp(o.a, 0.25).add(V(0, 0.06, 0)).multiplyScalar(1); pos.x *= 1.25; pos.z *= 1.25; return <mesh key={i} material={mM} position={pos}><sphereGeometry args={[0.09, 12, 10]} /></mesh>; })}
      <Anchor id="backbone" position={[R + 0.15, 0.6, 0.1]} /><Anchor id="base" position={[0.1, -0.4, 0.15]} />
      <Anchor id="pair" position={[0, 0.25, 0.2]} /><Anchor id="major" position={[-0.45, -1.2, 0.45]} /><Anchor id="minor" position={[0.4, 1.4, -0.4]} />
      <Anchor id="mutation" position={Y(mutAt, n).add(V(0.6, 0, 0.3)).toArray() as Vec} /><Anchor id="methyl" position={[0.7, -1.5, 0.3]} />
    </group>
  );
}

function Replication() {
  const n = 46, seq = useMemo(() => seqOf(undefined, n, 5), []);
  const S = useScene();
  const fork = (st: number, t: number) => clamp(0.15 + st * 0.18 + 0.02 * Math.sin(t)) * 0.8;
  const forkRef = useRef(0.2);
  useFrame(({ clock }) => { forkRef.current = fork(S.st.current, clock.elapsedTime); });
  // parent duplex above the fork (unreplicated); two daughters below
  const parent = (i: number, st: number, t: number, o: BP) => {
    const f = Math.floor(fork(st, t) * n), j = i;
    if (j < f) { o.showA = o.showB = false; o.a.set(0, 0, 0); o.b.set(0, 0, 0); return; }
    helixAt(j, (k) => V(0, (k - f) * RISE + 0.3, 0), FRAME_Y, o); o.pa = true; o.ca = seq[j]; o.cb = PAIR[seq[j]];
  };
  const daughter = (side: number) => (i: number, st: number, t: number, o: BP) => {
    const f = Math.floor(fork(st, t) * n);
    if (i >= f) { o.showA = o.showB = false; return; }
    const k = f - 1 - i, dir = V(side * 0.55, -1, 0).normalize(), w = V(0, 0, 1), u = w.clone().cross(dir).normalize();
    helixAt(k, (kk) => dir.clone().multiplyScalar(kk * RISE + 0.1).add(V(side * 0.35, 0.3, 0)), () => [u, w], o, 0, i * TW);
    o.ca = side < 0 ? seq[i] : PAIR[seq[i]]; o.cb = PAIR[o.ca]; o.pa = true;
    o.newB = true;
    const lag = side > 0, gap = lag && (k % 9 > 6 || k < 3);
    if (side < 0 && k < 1) { o.showB = false; o.pa = false; }
    if (gap) { o.showB = false; o.pa = false; }
  };
  const hel = useHi('helicase', '#c98bd9', { rough: 0.4, clear: 0.5 });
  const pol = useHi('polymerase', '#5ab8a0', { rough: 0.45, clear: 0.4 });
  const pri = useHi('primer', '#ff5ac8', { rough: 0.4 });
  const g = useRef<THREE.Group>(null);
  useFrame(() => { if (g.current) g.current.position.y = 0; });
  return (
    <group ref={g} position={[0, -0.2, 0]}>
      <Strands n={n} layout={parent} id="parent" />
      <Strands n={n} layout={daughter(-1)} id="leading" />
      <Strands n={n} layout={daughter(1)} id="lagging" />
      <mesh material={hel} position={[0, 0.32, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.62, 0.17, 14, 32]} /></mesh>
      <mesh material={pol} position={[-0.6, -0.25, 0.3]}><sphereGeometry args={[0.32, 24, 16]} /></mesh>
      <mesh material={pol} position={[0.75, -0.3, 0.3]}><sphereGeometry args={[0.3, 24, 16]} /></mesh>
      <mesh material={pri} position={[1.05, -0.9, 0.2]}><capsuleGeometry args={[0.06, 0.25, 4, 8]} /></mesh>
      <Anchor id="helicase" position={[0.65, 0.4, 0.2]} /><Anchor id="polymerase" position={[-0.6, -0.25, 0.65]} />
      <Anchor id="leading" position={[-1.4, -1.6, 0.4]} /><Anchor id="lagging" position={[1.5, -1.7, 0.4]} />
      <Anchor id="parent" position={[0.6, 2.4, 0.3]} /><Anchor id="primer" position={[1.15, -0.9, 0.35]} />
      <Anchor id="okazaki" position={[1.25, -1.2, -0.2]} />
    </group>
  );
}

function Transcription() {
  const n = 54, seq = useMemo(() => seqOf(undefined, n, 9), []);
  const S = useScene();
  const pos = (st: number) => 10 + st * 9;
  const layout = (i: number, st: number, _t: number, o: BP) => {
    const at = pos(st), d = i - at, open = Math.abs(d) < 5 ? smooth(1 - Math.abs(d) / 5) : 0;
    const axis = (k: number) => V((k - n / 2) * RISE, 0, 0), fr = (): [THREE.Vector3, THREE.Vector3] => [V(0, 1, 0), V(0, 0, 1)];
    helixAt(i, axis, fr, o); o.ca = seq[i]; o.cb = PAIR[seq[i]];
    if (open > 0) { o.a.y += open * 0.5; o.b.y -= open * 0.55; o.pa = open < 0.3; }
  };
  const rnaRef = useRef<THREE.Mesh>(null);
  const polM = useHi('polymerase', '#5ab8a0', { rough: 0.45, clear: 0.4, opacity: 0.7 });
  const rnaM = useHi('mrna', '#ff9d3a', { rough: 0.4, emissive: '#ff9d3a', ei: 0.2 });
  const promM = useHi('promoter', '#c98bd9', { rough: 0.4, emissive: '#c98bd9', ei: 0.3, opacity: 0.7 });
  const pg = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const at = pos(S.st.current), x = (at - n / 2) * RISE;
    if (pg.current) pg.current.position.x = x;
    const L = Math.max(0.05, (at - 10) * RISE * 1.1);
    if (rnaRef.current) { rnaRef.current.geometry.dispose(); rnaRef.current.geometry = varTube(curve(Array.from({ length: 12 }, (_, k) => V(x - (k / 11) * L * 0.6, -0.65 - (k / 11) * L * 0.5 + Math.sin(k + clock.elapsedTime) * 0.04, 0.4 + Math.sin(k * 1.3) * 0.15))), 60, 6, () => 0.05); }
  });
  return (
    <group>
      <Strands n={n} layout={layout} id="dna" />
      <mesh material={promM} position={[(8 - n / 2) * RISE, 0, 0]}><cylinderGeometry args={[0.62, 0.62, 0.8, 24, 1, true]} /></mesh>
      <group ref={pg}><mesh material={polM}><sphereGeometry args={[0.85, 32, 24]} /></mesh><Anchor id="polymerase" position={[0.3, 0.7, 0.5]} /></group>
      <mesh ref={rnaRef} material={rnaM}><bufferGeometry /></mesh>
      <Anchor id="mrna" position={[-1.6, -1.2, 0.5]} /><Anchor id="promoter" position={[(8 - n / 2) * RISE, 0.7, 0.3]} /><Anchor id="template" position={[1.6, -0.5, 0.3]} /><Anchor id="dna" position={[3.5, 0.6, 0.2]} />
    </group>
  );
}

function Translation() {
  const S = useScene();
  const codons = 16, seq = useMemo(() => seqOf('AUGGCUAAAGGCUUUCCAGAAUGGUAA'.replace(/U/g, 'U'), codons * 3, 2), []);
  const bases = useMemo(() => seq.map((b, i) => ({ b, p: V((i - codons * 1.5) * 0.2, 0, 0) })), [seq]);
  const ribo = useRef<THREE.Group>(null), chain = useRef<THREE.InstancedMesh>(null), trna = useRef<THREE.Group>(null);
  const smallM = useHi(['ribosome', 'small'], '#9a88d9', { rough: 0.5, clear: 0.3, opacity: 0.9 });
  const largeM = useHi(['ribosome', 'large'], '#7a68c9', { rough: 0.5, clear: 0.3, opacity: 0.85 });
  const mM = useHi(['mrna', 'codon'], '#ff9d3a', { rough: 0.4 });
  const tM = useHi(['trna', 'anticodon'], '#5ac8ff', { rough: 0.4, clear: 0.4 });
  const aaM = useHi(['aminoacid', 'chain'], '#ffffff', { rough: 0.35, clear: 0.6 });
  const small = useMemo(() => blob(0.7, [1.3, 0.55, 0.9], 0.08, 2, 3, 4), []);
  const large = useMemo(() => blob(0.95, [1.3, 0.8, 1.0], 0.08, 2, 5, 4), []);
  const tGeo = useMemo(() => merge([new THREE.CapsuleGeometry(0.08, 0.5, 4, 10), new THREE.CapsuleGeometry(0.08, 0.35, 4, 10).rotateZ(Math.PI / 2).translate(0.18, 0.28, 0)]), []);
  const AA = ['#e8584a', '#f2c94c', '#5ac46a', '#4f8fe0', '#c98bd9', '#ff9d3a', '#5ab8a0', '#e85aa0'];
  useLayoutEffect(() => { const im = chain.current; if (!im) return; im.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(im.count * 3).fill(1), 3); for (let i = 0; i < im.count; i++) im.setColorAt(i, new THREE.Color(AA[i % AA.length])); }, []);
  useFrame(({ clock }) => {
    const st = S.st.current, prog = clamp(st / 4) * (codons - 3) + 0.0, x = (prog * 3 - codons * 1.5 + 1) * 0.2;
    if (ribo.current) ribo.current.position.x = x;
    if (trna.current) { const k = (clock.elapsedTime * 0.6) % 1; trna.current.position.set(x + 0.35 - k * 0.3, 0.75 + (1 - smooth(k * 2)) * 1.2, 0.2); }
    const im = chain.current; if (!im) return; const M = new THREE.Matrix4(), nAA = Math.floor(prog) + 1;
    for (let i = 0; i < im.count; i++) { if (i < nAA) { const j = nAA - 1 - i; M.makeTranslation(x - 0.1 + Math.sin(j * 0.9) * 0.25 * Math.min(1, j / 3), 1.15 + j * 0.2, Math.cos(j * 0.9) * 0.25 * Math.min(1, j / 3)); } else M.makeScale(0, 0, 0); im.setMatrixAt(i, M); }
    im.instanceMatrix.needsUpdate = true;
  });
  return (
    <group position={[0, -0.6, 0]}>
      {bases.map((b, i) => <mesh key={i} position={b.p} material={mM}><boxGeometry args={[0.16, 0.12, 0.16]} /></mesh>)}
      {bases.map((b, i) => <mesh key={'c' + i} position={[b.p.x, 0.16, b.p.z]}><cylinderGeometry args={[0.035, 0.035, 0.22, 6]} /><meshStandardMaterial color={BASE[b.b] ?? '#ccc'} roughness={0.5} /></mesh>)}
      <group ref={ribo}>
        <mesh geometry={small} material={smallM} position={[0, -0.25, 0]} />
        <mesh geometry={large} material={largeM} position={[0, 0.85, 0]} />
        <Anchor id="small" position={[0.8, -0.35, 0.5]} /><Anchor id="large" position={[0.9, 1.3, 0.6]} />
      </group>
      <group ref={trna}><mesh geometry={tGeo} material={tM} /><Anchor id="trna" position={[0.2, 0.3, 0.2]} /></group>
      <instancedMesh ref={chain} args={[new THREE.SphereGeometry(0.11, 14, 10), aaM, 20]} frustumCulled={false} />
      <Anchor id="mrna" position={[-2.5, 0.1, 0.2]} /><Anchor id="codon" position={[1.6, 0.25, 0.1]} /><Anchor id="chain" position={[0.0, 2.6, 0.2]} />
    </group>
  );
}

function Crispr() {
  const n = 44, seq = useMemo(() => seqOf(undefined, n, 13), []);
  const S = useScene();
  const site = 22;
  const layout = (i: number, st: number, _t: number, o: BP) => {
    const cut = smooth(st - 2), heal = smooth(st - 3);
    const shift = i < site ? -cut * (1 - heal) * 0.35 : cut * (1 - heal) * 0.35;
    helixAt(i, (k) => V((k - n / 2) * RISE + shift, 0, 0), () => [V(0, 1, 0), V(0, 0, 1)], o); o.ca = seq[i]; o.cb = PAIR[seq[i]];
    const d = i - site, bind = smooth(st - 1);
    if (d >= 0 && d < 8) { o.b.y -= bind * 0.25 * (1 - cut); o.pa = bind < 0.5 || cut > 0.9; }
    if (heal > 0.5 && (i === site || i === site + 1)) o.glow = true;
  };
  const cas = useHi('cas9', '#5ab8a0', { rough: 0.45, clear: 0.4, opacity: 0.75 });
  const gM = useHi('guide', '#ff9d3a', { rough: 0.4, emissive: '#ff9d3a', ei: 0.25 });
  const cg = useRef<THREE.Group>(null);
  useFrame(() => { const st = S.st.current; if (cg.current) { const k = smooth(st); cg.current.position.set(lerp(-3, (site + 3 - n / 2) * RISE, k), lerp(1.5, 0.35, k), 0); cg.current.visible = st < 3.3; } });
  const guide = useMemo(() => varTube(curve([[-0.6, -0.25, 0.25], [-0.2, -0.32, 0.3], [0.3, -0.3, 0.25], [0.6, 0.1, 0.3], [0.4, 0.6, 0.3]]), 40, 6, () => 0.05), []);
  return (
    <group>
      <Strands n={n} layout={layout} id="dna" />
      <group ref={cg}><mesh material={cas}><sphereGeometry args={[0.9, 32, 24]} /></mesh><mesh geometry={guide} material={gM} /><Anchor id="cas9" position={[0.5, 0.7, 0.5]} /><Anchor id="guide" position={[0.5, 0.6, 0.35]} /></group>
      <Anchor id="cut" position={[(site - n / 2) * RISE, -0.7, 0.3]} /><Anchor id="dna" position={[-3, 0.6, 0.2]} /><Anchor id="pam" position={[(site + 9 - n / 2) * RISE, 0.6, 0.3]} />
    </group>
  );
}

function Chromatin() {
  const nuc = useMemo(() => Array.from({ length: 12 }, (_, i) => { const a = i * 1.2; return V(Math.cos(a) * 1.1, (i - 6) * 0.42, Math.sin(a) * 1.1); }), []);
  const dnaPath = useMemo(() => { const pts: THREE.Vector3[] = []; nuc.forEach((c, i) => { const ax = V(Math.cos(i * 1.2), 0, Math.sin(i * 1.2)).normalize(); const u = V(0, 1, 0), w = ax.clone().cross(u).normalize(); for (let k = 0; k <= 20; k++) { const th = (k / 20) * TAU * 1.65; pts.push(c.clone().addScaledVector(u, Math.cos(th) * 0.36).addScaledVector(w, Math.sin(th) * 0.36).addScaledVector(ax, (k / 20 - 0.5) * 0.3)); } }); return varTube(new THREE.CatmullRomCurve3(pts), 900, 6, () => 0.045); }, [nuc]);
  const hM = useHi('histone', '#c98bd9', { rough: 0.45, clear: 0.4 });
  const dM = useHi(['dna', 'linker'], '#4fb3d9', { rough: 0.4, clear: 0.5 });
  const tailM = useHi('tail', '#ffb0d0', { rough: 0.5 });
  const oct = useMemo(() => merge([0, 1, 2, 3, 4, 5, 6, 7].map((i) => { const s = new THREE.SphereGeometry(0.17, 14, 10); s.translate(Math.cos((i % 4) * TAU / 4) * 0.12, i < 4 ? 0.09 : -0.09, Math.sin((i % 4) * TAU / 4) * 0.12); return s; })), []);
  return (
    <group>
      {nuc.map((c, i) => <mesh key={i} geometry={oct} material={hM} position={c} lookAt={undefined} rotation={[0, -i * 1.2, Math.PI / 2]} />)}
      {nuc.map((c, i) => <mesh key={'t' + i} material={tailM} position={c.clone().add(V(0.15, 0.25, 0.1))}><capsuleGeometry args={[0.025, 0.25, 4, 6]} /></mesh>)}
      <mesh geometry={dnaPath} material={dM} />
      <Anchor id="histone" position={nuc[6].toArray() as Vec} /><Anchor id="dna" position={nuc[3].clone().add(V(0.3, 0.3, 0.3)).toArray() as Vec} /><Anchor id="linker" position={nuc[8].clone().lerp(nuc[9], 0.5).toArray() as Vec} /><Anchor id="tail" position={nuc[2].clone().add(V(0.2, 0.4, 0.1)).toArray() as Vec} /><Anchor id="nucleosome" position={nuc[10].toArray() as Vec} />
    </group>
  );
}

function chromatidGeo(len: number, seed: number) {
  const r = rng(seed), pts: THREE.Vector3[] = [];
  for (let i = 0; i <= 160; i++) { const t = i / 160, y = (t - 0.5) * len, a = t * TAU * 22; const pinch = 1 - 0.55 * Math.exp(-(((t - 0.42) * 10) ** 2)); pts.push(V(Math.cos(a) * 0.17 * pinch + (r() - 0.5) * 0.02, y, Math.sin(a) * 0.17 * pinch)); }
  return varTube(new THREE.CatmullRomCurve3(pts), 700, 6, () => 0.085);
}
function Chromosome({ p }: { p: DnaP }) {
  const S = useScene();
  const a = useMemo(() => chromatidGeo(3.2, 1), []), b = useMemo(() => chromatidGeo(3.2, 2), []);
  const cM = useHi(['chromatid', 'chromosome'], '#6fa8dc', { rough: 0.45, clear: 0.4 });
  const ceM = useHi('centromere', '#ff9d6b', { rough: 0.4 });
  const telM = useHi('telomere', '#ffd25a', { rough: 0.3, emissive: '#ffd25a', ei: 0.4 });
  const tel = useRef<THREE.Group>(null);
  useFrame(() => { if (tel.current && p.mode === 'telomere') { const k = 1 - smooth(S.st.current / 3) * 0.85; tel.current.children.forEach((c) => c.scale.set(1, k, 1)); } });
  const ends: Vec[] = [[-0.22, 1.72, 0], [0.22, 1.72, 0], [-0.22, -1.72, 0], [0.22, -1.72, 0]];
  return (
    <group rotation={[0, 0, 0]}>
      <mesh geometry={a} material={cM} position={[-0.22, 0, 0]} rotation={[0, 0, 0.06]} />
      <mesh geometry={b} material={cM} position={[0.22, 0, 0]} rotation={[0, 0, -0.06]} />
      <mesh material={ceM} position={[0, -0.25, 0]}><sphereGeometry args={[0.2, 20, 14]} /></mesh>
      <group ref={tel}>{ends.map((e, i) => <mesh key={i} material={telM} position={e} scale={[1, 0.7, 1]}><sphereGeometry args={[0.16, 18, 12]} /></mesh>)}</group>
      <Anchor id="chromatid" position={[0.45, 0.9, 0.2]} /><Anchor id="centromere" position={[0, -0.25, 0.3]} /><Anchor id="telomere" position={[0.25, 1.85, 0.2]} /><Anchor id="chromosome" position={[-0.5, -1.0, 0.2]} />
    </group>
  );
}
function Karyotype({ p }: { p: DnaP }) {
  const L = [2.5, 2.4, 2.0, 1.9, 1.8, 1.7, 1.6, 1.45, 1.4, 1.35, 1.35, 1.32, 1.1, 1.05, 1.0, 0.9, 0.82, 0.78, 0.6, 0.62, 0.45, 0.5];
  const cM = useHi(['autosome', 'chromosome'], '#8fb8ff', { rough: 0.5 });
  const xM = useHi('sex', '#ff9db8', { rough: 0.5 });
  const tM = useHi('extra', '#ffd25a', { rough: 0.4, emissive: '#ffd25a', ei: 0.3 });
  const band = useHi('band', '#3a4a6a', { rough: 0.6 });
  const items = useMemo(() => { const out: { x: number; y: number; len: number; sex?: boolean; extra?: boolean }[] = []; const pairs = [...L.map((l, i) => ({ l, i })), { l: 1.55, i: 22 }]; pairs.forEach(({ l, i }, k) => { const col = k % 8, row = Math.floor(k / 8), x = (col - 3.5) * 1.05, y = 2.6 - row * 3.0; const sex = i === 22, copies = i + 1 === p.trisomy ? 3 : 2; for (let c = 0; c < copies; c++) { const len = sex && c === 1 && p.sex !== 'XX' ? 0.55 : l; out.push({ x: x + (c - (copies - 1) / 2) * 0.32, y: y - (2.5 - len) / 2, len, sex, extra: c === 2 }); } }); return out; }, [p.trisomy, p.sex]);
  return (
    <group>
      {items.map((c, i) => <group key={i} position={[c.x, c.y, 0]}><mesh material={c.extra ? tM : c.sex ? xM : cM}><capsuleGeometry args={[0.12, c.len, 6, 12]} /></mesh>{[0.2, 0.45, 0.7].map((f, k) => <mesh key={k} material={band} position={[0, (f - 0.5) * c.len, 0]}><cylinderGeometry args={[0.125, 0.125, 0.05, 12]} /></mesh>)}</group>)}
      <Anchor id="autosome" position={[items[0].x, items[0].y + 1.4, 0.2]} /><Anchor id="sex" position={[items[items.length - 1].x, items[items.length - 1].y + 1, 0.2]} />
      {items.some((c) => c.extra) && <Anchor id="extra" position={[items.find((c) => c.extra)!.x, items.find((c) => c.extra)!.y + 0.8, 0.2]} />}
    </group>
  );
}
function Protein() {
  const S = useScene();
  const chain = useMemo(() => { const r = rng(5), pts: THREE.Vector3[] = []; let p = V(0, 0, 0); let dir = V(1, 0, 0); for (let i = 0; i < 26; i++) { dir = dir.add(V(r() - 0.5, r() - 0.5, r() - 0.5).multiplyScalar(1.4)).normalize(); p = p.clone().addScaledVector(dir, 0.45); if (p.length() > 1.4) p.multiplyScalar(1.4 / p.length()); pts.push(p); } return pts; }, []);
  const ext = useMemo(() => chain.map((_, i) => V((i - 13) * 0.32, Math.sin(i * 0.8) * 0.15, 0)), [chain]);
  const ref = useRef<THREE.Mesh>(null);
  const m = useHi(['protein', 'helix', 'sheet', 'site'], '#ffffff', { rough: 0.35, clear: 0.6, vc: true });
  useFrame(() => {
    const k = smooth(S.stages ? S.st.current / Math.max(1, S.stages - 1) : 1), me = ref.current; if (!me) return;
    const pts = chain.map((c, i) => ext[i].clone().lerp(c, k));
    const dense = new THREE.CatmullRomCurve3(pts).getSpacedPoints(400).map((q, i) => { const seg = Math.floor((i / 400) * 6); if (seg % 3 === 0) { const a = i * 0.9; return q.clone().add(V(Math.cos(a) * 0.12 * k, Math.sin(a) * 0.12 * k, Math.sin(a + 1) * 0.12 * k)); } return q; });
    const g = varTube(new THREE.CatmullRomCurve3(dense), 600, 8, (t) => (Math.floor(t * 6) % 3 === 1 ? 0.1 : 0.06));
    const col = new Float32Array(g.attributes.position.count * 3), c = new THREE.Color();
    for (let i = 0; i < g.attributes.position.count; i++) { const t = Math.floor(i / 9) / 600; c.setHSL(0.66 - t * 0.66, 0.7, 0.55); col.set([c.r, c.g, c.b], i * 3); }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); me.geometry.dispose(); me.geometry = g;
  });
  return <group><mesh ref={ref} material={m}><bufferGeometry /></mesh><Anchor id="protein" position={[1.2, 1.0, 0.4]} /><Anchor id="helix" position={[0.4, 0.4, 1.0]} /><Anchor id="sheet" position={[-0.9, -0.5, 0.6]} /><Anchor id="site" position={[0.2, -0.9, 0.9]} /></group>;
}
function Splicing() {
  const S = useScene();
  const segs = [{ k: 'exon', l: 1.0, c: '#ff9d3a' }, { k: 'intron', l: 1.3, c: '#8a8fa0' }, { k: 'exon', l: 0.9, c: '#ffb85a' }, { k: 'intron', l: 1.1, c: '#8a8fa0' }, { k: 'exon', l: 1.1, c: '#ff8a3a' }];
  const g = useRef<THREE.Group>(null);
  const eM = useHi('exon', '#ff9d3a', { rough: 0.4 }), iM = useHi('intron', '#8a8fa0', { rough: 0.5 }), spM = useHi('spliceosome', '#c98bd9', { rough: 0.45, opacity: 0.6 });
  useFrame(() => {
    const k = smooth(S.st.current - 0.5), gg = g.current; if (!gg) return;
    let x = -2.7; gg.children.forEach((ch, i) => { const s = segs[i]; if (!s) return; if (s.k === 'intron') { ch.position.set(x + (s.l / 2) * (1 - k), k * 1.2, 0); ch.scale.set(1 - k * 0.6, 1, 1); ch.visible = k < 0.98; x += s.l * (1 - k); } else { ch.position.set(x + s.l / 2, 0, 0); x += s.l; } });
  });
  return (
    <group>
      <group ref={g}>{segs.map((s, i) => <mesh key={i} material={s.k === 'exon' ? eM : iM} rotation={[0, 0, Math.PI / 2]}><capsuleGeometry args={[0.12, s.l - 0.12, 4, 10]} /></mesh>)}</group>
      <mesh material={spM} position={[-0.9, 0.7, 0]}><sphereGeometry args={[0.5, 24, 16]} /></mesh>
      <Anchor id="exon" position={[-2.2, 0.3, 0.2]} /><Anchor id="intron" position={[-1.0, 0.45, 0.2]} /><Anchor id="spliceosome" position={[-0.9, 1.2, 0.2]} />
    </group>
  );
}
function PCR() {
  const S = useScene();
  const ref = useRef<THREE.InstancedMesh>(null);
  const g = useMemo(() => { const pts: THREE.Vector3[] = [], pts2: THREE.Vector3[] = []; for (let i = 0; i <= 40; i++) { const y = (i / 40 - 0.5) * 0.9, a = i * 0.6; pts.push(V(Math.cos(a) * 0.07, y, Math.sin(a) * 0.07)); pts2.push(V(Math.cos(a + 2.4) * 0.07, y, Math.sin(a + 2.4) * 0.07)); } return merge([varTube(new THREE.CatmullRomCurve3(pts), 60, 5, () => 0.02), varTube(new THREE.CatmullRomCurve3(pts2), 60, 5, () => 0.02)]); }, []);
  const m = useHi(['copies', 'dna'], '#4fb3d9', { rough: 0.4, emissive: '#4fb3d9', ei: 0.2 });
  const spots = useMemo(() => { const r = rng(2); return Array.from({ length: 256 }, () => V((r() - 0.5) * 4, (r() - 0.5) * 3, (r() - 0.5) * 2.5)); }, []);
  useFrame(({ clock }) => { const im = ref.current; if (!im) return; const n = Math.pow(2, Math.min(8, Math.floor(S.st.current * 2 + 0.5))), M = new THREE.Matrix4(), q = new THREE.Quaternion(); for (let i = 0; i < 256; i++) { if (i < n) { q.setFromEuler(new THREE.Euler(i, clock.elapsedTime * 0.3 + i, 0)); M.compose(i === 0 ? V() : spots[i], q, V(1, 1, 1)); } else M.makeScale(0, 0, 0); im.setMatrixAt(i, M); } im.instanceMatrix.needsUpdate = true; });
  return <><instancedMesh ref={ref} args={[g, m, 256]} frustumCulled={false} /><Anchor id="copies" position={[0.3, 0.6, 0.2]} /><mesh visible={false} position={[2.2, 1.6, 1.3]}><boxGeometry /></mesh><mesh visible={false} position={[-2.2, -1.6, -1.3]}><boxGeometry /></mesh></>;
}
function Circle() {
  const m = useHi(['plasmid', 'dna'], '#4fb3d9', { rough: 0.4, clear: 0.5 });
  const gM = useHi('gene', '#ff9d3a', { rough: 0.4 });
  const g = useMemo(() => varTube(new THREE.CatmullRomCurve3(Array.from({ length: 200 }, (_, i) => { const a = (i / 200) * TAU; return V(Math.cos(a) * 1.5 + Math.cos(a * 30) * 0.05, Math.sin(a * 30) * 0.05, Math.sin(a) * 1.5 + Math.sin(a * 30) * 0.05); }), true), 800, 6, () => 0.05, true), []);
  return <group rotation={[0.9, 0, 0]}><mesh geometry={g} material={m} />{[0, 1.6, 3.6, 5.1].map((a, i) => <mesh key={i} material={gM} position={[Math.cos(a) * 1.5, 0, Math.sin(a) * 1.5]} rotation={[0, -a, 0]}><torusGeometry args={[0.12, 0.06, 8, 12]} /></mesh>)}<Anchor id="plasmid" position={[1.5, 0.2, 0]} /><Anchor id="gene" position={[0, 0.2, 1.5]} /></group>;
}

export default function Dna({ p }: { p: DnaP }) {
  switch (p.mode ?? 'helix') {
    case 'replication': return <Replication />;
    case 'transcription': return <Transcription />;
    case 'translation': return <Translation />;
    case 'crispr': return <Crispr />;
    case 'chromatin': return <Chromatin />;
    case 'chromosome': case 'telomere': return <Chromosome p={p} />;
    case 'karyotype': return <Karyotype p={p} />;
    case 'protein': return <Protein />;
    case 'splicing': return <Splicing />;
    case 'pcr': return <PCR />;
    case 'circle': return <Circle />;
    default: return <Helix p={p} />;
  }
}
