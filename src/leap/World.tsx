import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { applyPose, buildHanuman, type PoseName, type Rig } from './hanuman';
import { END, PLACES, pathAt } from './story';
import { hex3, PAL, SHARED, toon } from './toon';

/* ───────── shared game state (mutated in frames, read by the HUD) ───────── */

export type Mode = 'intro' | 'story' | 'free' | 'finale' | 'inspect';
export type CamMode = 'cine' | 'chase' | 'orbit';
export const G = {
  mode: 'intro' as Mode,
  cam: 'cine' as CamMode,
  d: 0, x: 0, y: 158, size: 3.2, speed: 0, boost: 0,
  vx: 0, vy: 0, bank: 0, pitch: 0,
  steer: { x: 0, y: 0 }, keys: new Set<string>(), grow: 0,
  introT: 0, finaleT: 0, ring: false,
  surasaOpen: 0, simhika: 0, mainaka: 0,
  shake: 0, paused: false, snap: false, inspectPose: 'stand' as PoseName, view: '' as '' | 'front' | 'side' | 'back' | 'three',
  events: new Set<string>(),
  time: 0,
};
// exposed for automated screenshots and debugging
if (typeof window !== 'undefined') (window as unknown as { __G?: typeof G }).__G = G;

export function resetGame(mode: Mode) {
  Object.assign(G, { mode, d: 0, x: 0, y: 151, size: 3.2, speed: 0, boost: 0, vx: 0, vy: 0, bank: 0, pitch: 0, introT: 0, finaleT: 0, ring: false, surasaOpen: 0, simhika: 0, mainaka: 0, shake: 0, paused: false });
  G.events.clear();
}

const rnd = (seed: number) => { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const mixv = (a: THREE.Vector3, b: THREE.Vector3, t: number) => a.clone().lerp(b, t);

/* ───────── time of day ───────── */

const SKY = {
  day: { zen: hex3('#cfe0d4'), hor: hex3(PAL.cream), light: new THREE.Vector3(-0.4, 0.82, 0.42).normalize() },
  dusk: { zen: hex3('#7d9fa6'), hor: hex3('#f1b98a'), light: new THREE.Vector3(-0.75, 0.28, -0.6).normalize() },
  night: { zen: hex3('#0c1d2b'), hor: hex3('#2b4258'), light: new THREE.Vector3(0.35, 0.75, -0.55).normalize() },
};
function timeOfDay(p: number) {
  if (p < 0.55) return { ...SKY.day, night: 0, k: 0 };
  if (p < 0.82) { const t = (p - 0.55) / 0.27; return { zen: mixv(SKY.day.zen, SKY.dusk.zen, t), hor: mixv(SKY.day.hor, SKY.dusk.hor, t), light: mixv(SKY.day.light, SKY.dusk.light, t).normalize(), night: 0, k: t }; }
  const t = Math.min(1, (p - 0.82) / 0.12);
  return { zen: mixv(SKY.dusk.zen, SKY.night.zen, t), hor: mixv(SKY.dusk.hor, SKY.night.hor, t), light: mixv(SKY.dusk.light, SKY.night.light, t).normalize(), night: t, k: 1 + t };
}

/* ───────── sky ───────── */

function Sky() {
  const mat = useMemo(() => new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    uniforms: { uZen: { value: SKY.day.zen.clone() }, uHor: { value: SKY.day.hor.clone() }, uSun: { value: SKY.day.light.clone() }, uNight: { value: 0 } },
    vertexShader: `varying vec3 vD; void main(){ vD = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position,1.); gl_Position = p.xyww; }`,
    fragmentShader: `uniform vec3 uZen, uHor, uSun; uniform float uNight; varying vec3 vD;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
      void main(){ vec3 d = normalize(vD); float h = max(d.y, 0.0);
        vec3 c = mix(uHor, uZen, smoothstep(0.0, 0.55, h));
        float s = dot(d, normalize(uSun));
        vec3 sunC = mix(vec3(1.0,0.97,0.86), vec3(0.95,0.95,1.0), uNight);
        c = mix(c, sunC, smoothstep(0.9965, 0.998, s));
        c += mix(vec3(0.25,0.16,0.05), vec3(0.06,0.08,0.12), uNight) * pow(max(s,0.0), 24.0);
        vec2 g = floor(d.xz / max(d.y, 0.05) * 140.0);
        float st = step(0.9965, hash(g)) * uNight * smoothstep(0.05, 0.3, h);
        c += st * 0.8;
        c += (hash(floor(gl_FragCoord.xy)) - 0.5) * 0.035;
        if (d.y < 0.0) c = uHor;
        gl_FragColor = vec4(c, 1.0); }`,
  }), []);
  useFrame(({ camera }) => {
    const td = timeOfDay(G.d / END);
    mat.uniforms.uZen.value.copy(td.zen); mat.uniforms.uHor.value.copy(td.hor); mat.uniforms.uSun.value.copy(td.light); mat.uniforms.uNight.value = td.night;
    SHARED.uLight.value.copy(td.light); SHARED.uFogColor.value.copy(td.hor); SHARED.uNight.value = td.night;
    meshRef.current?.position.copy(camera.position);
  });
  const meshRef = useRef<THREE.Mesh>(null);
  return <mesh ref={meshRef} material={mat} renderOrder={-10} frustumCulled={false}><sphereGeometry args={[4500, 48, 24]} /></mesh>;
}

/* ───────── ocean ───────── */

const WAVES = [[0.012, 0.0, 3.2, 1.1], [0.021, 0.9, 1.6, 1.6], [0.034, 2.1, 0.9, 2.1], [0.055, 4.0, 0.45, 2.8]];
function Ocean() {
  const mat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: { ...SHARED, uT: { value: 0 }, uLit: { value: hex3('#2c8796') }, uShade: { value: hex3('#12505e') }, uFoam: { value: hex3(PAL.cream) }, uCam: { value: new THREE.Vector3() } },
    vertexShader: `uniform float uT; varying vec3 vW; varying vec3 vN; varying float vH; varying float vDepth;
      ${WAVES.map((w, i) => `const vec4 W${i} = vec4(${w.map((v) => v.toFixed(4)).join(',')});`).join('\n')}
      void wave(vec4 W, vec2 p, inout float h, inout vec2 g){ vec2 dir = vec2(cos(W.y), sin(W.y)); float ph = dot(dir, p) * W.x + uT * W.w; h += W.z * sin(ph); g += W.z * W.x * cos(ph) * dir; }
      void main(){ vec4 w = modelMatrix * vec4(position,1.); float h = 0.; vec2 g = vec2(0.);
        wave(W0, w.xz, h, g); wave(W1, w.xz, h, g); wave(W2, w.xz, h, g); wave(W3, w.xz, h, g);
        w.y += h; vH = h; vW = w.xyz; vN = normalize(vec3(-g.x, 1.0, -g.y));
        vec4 mv = viewMatrix * w; vDepth = -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 uLit, uShade, uFoam, uLight, uFogColor; uniform float uFogNear, uFogFar, uNight, uT;
      varying vec3 vW; varying vec3 vN; varying float vH; varying float vDepth;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
      void main(){ vec3 N = normalize(vN); vec3 L = normalize(uLight);
        float g = hash(floor(gl_FragCoord.xy)) - 0.5;
        float t = smoothstep(0.86, 0.9, dot(N, L) + g * 0.03);
        vec3 c = mix(uShade, uLit, t);
        float foam = smoothstep(3.4, 4.6, vH + hash(floor(vW.xz * 0.35)) * 1.2);
        c = mix(c, uFoam, foam * 0.85);
        vec3 V = normalize(cameraPosition - vW); vec3 R = reflect(-V, N);
        float sp = pow(max(dot(R, L), 0.0), 220.0);
        c = mix(c, mix(vec3(1.0,0.93,0.72), vec3(0.85,0.9,1.0), uNight), step(0.35, sp + g * 0.2) * 0.9);
        c = mix(c, c * vec3(0.3,0.38,0.55), uNight * 0.8);
        c += g * 0.03;
        float f = smoothstep(uFogNear, uFogFar, vDepth);
        gl_FragColor = vec4(mix(c, uFogColor, f), 1.0); }`,
  }), []);
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ camera }, dt) => {
    mat.uniforms.uT.value += dt;
    if (ref.current) { ref.current.position.x = Math.round(camera.position.x / 20) * 20; ref.current.position.z = Math.round(camera.position.z / 20) * 20; }
  });
  return <mesh ref={ref} material={mat} rotation-x={-Math.PI / 2} frustumCulled={false}><planeGeometry args={[7000, 7000, 280, 280]} /></mesh>;
}

/* ───────── scenery builders ───────── */

function mountainGeo(r: number, h: number, seed: number, peaks = 1) {
  const g = new THREE.ConeGeometry(r, h, 48, 18, false);
  g.translate(0, h / 2, 0);
  const p = g.attributes.position as THREE.BufferAttribute, R = rnd(seed);
  const bumps = Array.from({ length: 9 }, () => [R() * Math.PI * 2, 0.5 + R() * 1.5, R()]);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i), a = Math.atan2(z, x), hy = y / h;
    let k = 1;
    for (const [ph, f, w] of bumps) k += Math.sin(a * f * 3 + ph + hy * 5) * 0.08 * w;
    const crag = 1 + (R() - 0.5) * 0.06 * (1 - hy);
    const sub = peaks > 1 ? Math.max(0, Math.sin(a * peaks)) * 0.18 * hy : 0;
    p.setXYZ(i, x * k * crag, y * (1 - sub), z * k * crag);
  }
  g.computeVertexNormals();
  return g;
}
function treeGeo(h: number, r: number, seed: number) {
  const R = rnd(seed), parts: THREE.BufferGeometry[] = [];
  for (let k = 0; k < 4; k++) parts.push(new THREE.SphereGeometry(r * (0.7 + R() * 0.4), 10, 8).scale(1, 0.75, 1).translate((R() - 0.5) * r, h - r * 0.5 + k * r * 0.25, (R() - 0.5) * r));
  return mergeGeometries(parts.map((g) => g.toNonIndexed()));
}

const MAT = {
  rock: toon('#d39a58', PAL.teal, { name: 'Rock' }),
  forest: toon('#6e8b52', '#174f5c', { name: 'Forest' }),
  gold: toon('#e4be68', '#6c6648', { name: 'GoldCity', rim: 1.3, nightGlow: 0.0 }),
  goldWin: toon('#e4be68', '#6c6648', { name: 'GoldLit', nightGlow: 0.55, glow: '#ffcf7a' }),
  cloud: toon('#fbf7ea', '#a9cbc4', { name: 'Cloud', edge: -0.05, grain: 0.06 }),
  sand: toon('#e4c38c', '#2f7f88', { name: 'Sand' }),
  grass: toon('#7f9a58', '#1d5560', { name: 'Grass' }),
  serpent: toon('#3d9a74', '#123c3e', { name: 'Serpent', rim: 1.2 }),
  serpentBelly: toon('#d8c48a', '#3d5a4a', { name: 'Belly' }),
  mouth: toon('#8f2a1f', '#3a0e0b', { name: 'MouthInside', side: THREE.DoubleSide }),
  throat: toon('#2a0806', '#1a0403', { name: 'Throat', side: THREE.DoubleSide, grain: 0.02 }),
  fang: toon(PAL.cream, '#9db0a6', { name: 'Fang' }),
  eyeGlow: toon('#ffd27a', '#ffb347', { name: 'EyeGlow', grain: 0 }),
  shadow: toon('#232a3f', '#0a0d18', { name: 'ShadowThing', rim: 0.2 }),
  trunk: toon('#6a4630', PAL.navy, { name: 'Trunk' }),
  leaf: toon('#4f7d4a', '#123b3f', { name: 'Leaf' }),
  bloom: toon('#ee7c32', '#8a2f16', { name: 'Bloom' }),
  lamp: toon('#ffd88a', '#ffb347', { name: 'Lamp', nightGlow: 1, glow: '#ffe2a3' }),
  sari: toon('#e2b13f', '#7c5418', { name: 'Sari' }),
  skinS: toon('#c98f61', '#5b3a35', { name: 'SkinS' }),
  hairS: toon('#1b2a36', PAL.ink, { name: 'HairS' }),
};

function Mahendra() {
  const geo = useMemo(() => mountainGeo(260, PLACES.mahendra.h, 3), []);
  const trees = useMemo(() => {
    const R = rnd(8), gs: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 70; i++) { const a = R() * Math.PI * 2, rr = 80 + R() * 170, y = PLACES.mahendra.h * (1 - rr / 260) * 0.95; gs.push(treeGeo(10 + R() * 8, 5 + R() * 3, i).translate(Math.cos(a) * rr, y - 2, Math.sin(a) * rr)); }
    return mergeGeometries(gs);
  }, []);
  return <group position={[PLACES.mahendra.x, -2, PLACES.mahendra.z]}><mesh geometry={geo} material={MAT.rock} /><mesh geometry={trees} material={MAT.forest} /></group>;
}

function Mainaka() {
  const geo = useMemo(() => mountainGeo(150, PLACES.mainaka.h, 12, 3), []);
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    const near = clamp(1 - Math.abs(G.d - 1500) / 650, 0, 1);
    G.mainaka += ((G.d > 900 ? 1 : 0) - G.mainaka) * 0.02;
    if (ref.current) ref.current.position.y = -PLACES.mainaka.h * 1.05 * (1 - G.mainaka) - 4 + near * 2;
  });
  return <group ref={ref} position={[PLACES.mainaka.x, -130, PLACES.mainaka.z]}><mesh geometry={geo} material={MAT.gold} /></group>;
}

function Surasa() {
  const { body, jawU, jawL, inner } = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 60; i++) { const t = i / 60, a = t * Math.PI * 3.2; pts.push(new THREE.Vector3(Math.cos(a) * 70 * (1 - t * 0.5), -30 + t * 110, -60 + Math.sin(a) * 70 * (1 - t * 0.5))); }
    const body = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 200, 13, 16, false);
    const jawU = new THREE.SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2).scale(42, 26, 56);
    const jawL = new THREE.SphereGeometry(1, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2).scale(38, 18, 50);
    const inner = new THREE.CylinderGeometry(24, 14, 70, 32, 1, true).rotateX(Math.PI / 2);
    return { body, jawU, jawL, inner };
  }, []);
  const up = useRef<THREE.Group>(null), low = useRef<THREE.Group>(null), head = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    const target = G.d > 2300 && G.d < 2950 ? clamp((G.d - 2300) / 380, 0, 1) : 0;
    G.surasaOpen += (target - G.surasaOpen) * Math.min(1, dt * 2);
    const o = G.surasaOpen;
    if (up.current) up.current.rotation.x = -0.15 - o * 0.55;
    if (low.current) low.current.rotation.x = 0.1 + o * 0.45;
    if (head.current) head.current.scale.setScalar(0.7 + o * 0.5 + (G.size > 3.5 && G.d > 2500 && G.d < 2780 ? 0.25 : 0));
  });
  const s = PLACES.surasa;
  return (
    <group position={[s.x, 0, s.z]}>
      <mesh geometry={body} material={MAT.serpent} />
      <group ref={head} position={[0, s.mouthY, 0]}>
        <mesh material={MAT.serpent} position={[0, 34, -104]} scale={[70, 60, 14]}><sphereGeometry args={[1, 28, 18]} /></mesh>
        <mesh material={MAT.serpentBelly} position={[0, 28, -96]} scale={[40, 44, 6]}><sphereGeometry args={[1, 24, 14]} /></mesh>
        <mesh geometry={inner} material={MAT.mouth} position={[0, 0, -40]} />
        <mesh material={MAT.throat} position={[0, 0, -76]}><circleGeometry args={[16, 32]} /></mesh>
        <group ref={up}>
          <mesh geometry={jawU} material={MAT.serpent} position={[0, 2, -30]} />
          <mesh material={MAT.eyeGlow} position={[-24, 18, -2]} scale={[6, 4, 4]}><sphereGeometry args={[1, 14, 10]} /></mesh>
          <mesh material={MAT.eyeGlow} position={[24, 18, -2]} scale={[6, 4, 4]}><sphereGeometry args={[1, 14, 10]} /></mesh>
          {[-14, 14].map((x) => <mesh key={x} material={MAT.fang} position={[x, -6, 18]} rotation-x={Math.PI}><coneGeometry args={[3, 14, 10]} /></mesh>)}
        </group>
        <group ref={low}>
          <mesh geometry={jawL} material={MAT.serpentBelly} position={[0, -2, -30]} />
        </group>
      </group>
    </group>
  );
}

function Simhika() {
  const pool = useRef<THREE.Mesh>(null), arms = useRef<THREE.Group>(null);
  const geo = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const a = (i / 7) * Math.PI * 2, pts: THREE.Vector3[] = [];
    for (let k = 0; k <= 12; k++) { const t = k / 12; pts.push(new THREE.Vector3(Math.cos(a) * 130 * (1 - t * 0.85) + Math.sin(t * 6 + i) * 8, t * 95, Math.sin(a) * 130 * (1 - t * 0.85))); }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 5, 8, false);
  }), []);
  const poolMat = useMemo(() => new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { uT: { value: 0 }, uA: { value: 1 } },
    vertexShader: `varying vec2 vU; void main(){ vU = uv * 2. - 1.; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
    fragmentShader: `uniform float uT, uA; varying vec2 vU; void main(){ float r = length(vU); float a = atan(vU.y, vU.x);
      float sw = sin(a * 5.0 + r * 14.0 - uT * 1.6) * 0.5 + 0.5; float edge = smoothstep(1.0, 0.75, r);
      vec3 c = mix(vec3(0.04,0.05,0.1), vec3(0.12,0.14,0.24), sw * (1.0 - r));
      gl_FragColor = vec4(c, edge * 0.92 * uA); }`,
  }), []);
  useFrame((_, dt) => {
    poolMat.uniforms.uT.value += dt;
    const over = Math.hypot(G.x - PLACES.simhika.x, (-G.d) - PLACES.simhika.z) < PLACES.simhika.r + 60;
    const caught = over && G.y < 115 && !G.events.has('simhikaFreed');
    G.simhika += ((caught ? 1 : 0) - G.simhika) * Math.min(1, dt * 1.5);
    if (G.d > 4060) G.events.add('simhikaFreed');
    const freed = G.events.has('simhikaFreed');
    poolMat.uniforms.uA.value += ((freed ? 0 : 1) - poolMat.uniforms.uA.value) * Math.min(1, dt * 0.8);
    if (arms.current) { arms.current.scale.y = 0.05 + G.simhika * 0.95; arms.current.visible = G.simhika > 0.02; arms.current.position.set(G.x - PLACES.simhika.x, 0, -G.d - PLACES.simhika.z); arms.current.position.multiplyScalar(0.6); }
  });
  return (
    <group position={[PLACES.simhika.x, 1.5, PLACES.simhika.z]}>
      <mesh ref={pool} material={poolMat} rotation-x={-Math.PI / 2}><planeGeometry args={[PLACES.simhika.r * 2.4, PLACES.simhika.r * 2.4]} /></mesh>
      <group ref={arms}>{geo.map((g, i) => <mesh key={i} geometry={g} material={MAT.shadow} />)}</group>
    </group>
  );
}

function Lanka() {
  const built = useMemo(() => {
    const L = PLACES.lanka, R = rnd(51);
    const island = new THREE.CylinderGeometry(L.r, L.r + 60, 30, 64).translate(0, -10, 0);
    const lawn = new THREE.CylinderGeometry(L.r - 70, L.r - 40, 30, 64).translate(0, -6, 0);
    const peaks = mergeGeometries([mountainGeo(260, 300, 71).translate(0, 0, -260), mountainGeo(200, 230, 72).translate(-260, 0, -150), mountainGeo(210, 250, 73).translate(260, 0, -180)].map((g) => g.toNonIndexed()));
    const gold: THREE.BufferGeometry[] = [], lit: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 150; i++) {
      const x = -60 + R() * 520, z = -330 + R() * 520;
      if (Math.hypot(x, z + 240) < 120) continue;
      const slope = Math.max(0, 1 - Math.hypot(x, z + 260) / 420) * 120;
      const w = 18 + R() * 22, h = 26 + R() * 60 + slope * 0.2;
      gold.push(new THREE.BoxGeometry(w, h, w).translate(x, slope + h / 2, z));
      gold.push(new THREE.SphereGeometry(w * 0.5, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2).translate(x, slope + h, z));
      if (R() < 0.5) gold.push(new THREE.ConeGeometry(w * 0.16, h * 0.7, 8).translate(x, slope + h + w * 0.45 + h * 0.35, z));
      if (R() < 0.6) lit.push(new THREE.BoxGeometry(w * 1.02, h * 0.1, w * 1.02).translate(x, slope + h * 0.55, z));
      if (R() < 0.35) lit.push(new THREE.BoxGeometry(w * 1.02, h * 0.08, w * 1.02).translate(x, slope + h * 0.3, z));
    }
    const wall = new THREE.TorusGeometry(L.r - 120, 5, 6, 96, Math.PI * 1.1).rotateX(Math.PI / 2).rotateY(Math.PI * 0.95).translate(0, 8, -40);
    // the Ashoka grove
    const V = PLACES.vatika, gx = V.x - L.x, gz = V.z - L.z;
    const trunks: THREE.BufferGeometry[] = [], leaves: THREE.BufferGeometry[] = [], blooms: THREE.BufferGeometry[] = [], lamps: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 38; i++) {
      const a = R() * Math.PI * 2, rr = 30 + R() * 115, x = gx + Math.cos(a) * rr, z = gz + Math.sin(a) * rr * 0.8, h = 11 + R() * 7;
      trunks.push(new THREE.CylinderGeometry(0.8, 1.4, h, 7).translate(x, V.ground + h / 2, z));
      for (let k = 0; k < 4; k++) leaves.push(new THREE.SphereGeometry(3.6 + R() * 1.8, 10, 8).scale(0.8, 1.35, 0.8).translate(x + (R() - 0.5) * 6, V.ground + h - 2 + (R() - 0.5) * 5, z + (R() - 0.5) * 6));
      for (let k = 0; k < 7; k++) blooms.push(new THREE.SphereGeometry(1.1 + R() * 0.6, 7, 5).translate(x + (R() - 0.5) * 9, V.ground + h - 4 + (R() - 0.5) * 9, z + (R() - 0.5) * 9));
      if (i % 3 === 0) lamps.push(new THREE.SphereGeometry(1.1, 8, 6).translate(x + 4, V.ground + 3, z + 3));
    }
    // the shimshapa tree, bigger, at the centre
    trunks.push(new THREE.CylinderGeometry(0.7, 1.5, 19, 9).translate(gx, V.ground + 9.5, gz));
    for (const [bx, bz, by] of [[3.5, 0, 15], [-3, 2, 16], [0, -3.5, 17]]) trunks.push(new THREE.CylinderGeometry(0.25, 0.5, 6, 6).rotateZ(bx * 0.15).rotateX(-bz * 0.15).translate(gx + bx * 0.6, V.ground + by, gz + bz * 0.6));
    { const br = new THREE.CylinderGeometry(0.22, 0.42, 7.2, 7); br.rotateZ(-1.15); br.translate(gx + 3.2, V.ground + 13.4, gz + 0.7); trunks.push(br); }
    for (let k = 0; k < 9; k++) { const a = (k / 9) * Math.PI * 2; leaves.push(new THREE.SphereGeometry(4.4, 12, 10).scale(1, 0.65, 1).translate(gx + Math.cos(a) * 5.4, V.ground + 19 + Math.sin(k) * 1.5, gz + Math.sin(a) * 5.4)); }
    leaves.push(new THREE.SphereGeometry(5.5, 12, 10).scale(1, 0.55, 1).translate(gx, V.ground + 22, gz));
    const ground = new THREE.CylinderGeometry(150, 155, 6, 48).translate(gx, V.ground - 3, gz);
    const m = (gs: THREE.BufferGeometry[]) => mergeGeometries(gs.map((g) => g.index ? g.toNonIndexed() : g));
    return { island, lawn, peaks, gold: m(gold), lit: m(lit), wall, trunks: m(trunks), leaves: m(leaves), blooms: m(blooms), lamps: m(lamps), ground };
  }, []);
  const L = PLACES.lanka;
  return (
    <group position={[L.x, 0, L.z]}>
      <mesh geometry={built.island} material={MAT.sand} />
      <mesh geometry={built.lawn} material={MAT.grass} />
      <mesh geometry={built.peaks} material={MAT.rock} />
      <mesh geometry={built.gold} material={MAT.gold} />
      <mesh geometry={built.lit} material={MAT.goldWin} />
      <mesh geometry={built.wall} material={MAT.gold} />
      <mesh geometry={built.ground} material={MAT.grass} />
      <mesh geometry={built.trunks} material={MAT.trunk} />
      <mesh geometry={built.leaves} material={MAT.leaf} />
      <mesh geometry={built.blooms} material={MAT.bloom} />
      <mesh geometry={built.lamps} material={MAT.lamp} />
      <Sita />
    </group>
  );
}

/** Sita under the shimshapa tree: small, still, lit by her own glow. */
function Sita() {
  const V = PLACES.vatika, L = PLACES.lanka;
  const glow = useRef<THREE.Mesh>(null);
  const glowMat = useMemo(() => new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uA: { value: 0.4 } },
    vertexShader: `varying vec2 vU; void main(){ vU = uv * 2. - 1.; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
    fragmentShader: `uniform float uA; varying vec2 vU; void main(){ float r = length(vU); gl_FragColor = vec4(vec3(1.0,0.82,0.5) * uA * pow(max(0.0, 1.0 - r), 2.0), 1.0); }`,
  }), []);
  useFrame(({ camera }) => {
    if (glow.current) { glow.current.quaternion.copy(camera.quaternion); glowMat.uniforms.uA.value += ((G.ring ? 1.1 : 0.35) * (0.9 + Math.sin(performance.now() / 600) * 0.1) - glowMat.uniforms.uA.value) * 0.05; }
  });
  return (
    <group position={[V.x - L.x + 4, V.ground, V.z - L.z + 6]} rotation-y={0.6}>
      <mesh material={MAT.sari} position={[0, 0.7, 0]}><coneGeometry args={[0.95, 1.5, 16]} /></mesh>
      <mesh material={MAT.sari} position={[0, 1.55, -0.05]} scale={[0.38, 0.45, 0.3]}><sphereGeometry args={[1, 16, 12]} /></mesh>
      <mesh material={MAT.skinS} position={[0, 2.15, 0.02]} scale={[0.22, 0.25, 0.22]}><sphereGeometry args={[1, 16, 12]} /></mesh>
      <mesh material={MAT.hairS} position={[0, 2.2, -0.12]} scale={[0.24, 0.24, 0.2]}><sphereGeometry args={[1, 14, 10]} /></mesh>
      <mesh material={MAT.sari} position={[0, 2.25, -0.04]} scale={[0.27, 0.22, 0.26]}><sphereGeometry args={[1, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
      <mesh ref={glow} material={glowMat} position={[0, 1.5, 0]}><planeGeometry args={[9, 9]} /></mesh>
    </group>
  );
}

function Clouds() {
  const geo = useMemo(() => {
    const R = rnd(33), gs: THREE.BufferGeometry[] = [];
    for (let c = 0; c < 70; c++) {
      const cx = (R() - 0.5) * 1800, cy = 170 + R() * 260, cz = 300 - R() * 7200, s = 18 + R() * 30;
      if (Math.abs(cx) < 90 && cy < 260) continue;
      for (let k = 0; k < 7; k++) gs.push(new THREE.SphereGeometry(s * (0.6 + R() * 0.6), 12, 9).scale(1.4, 0.8, 1).translate(cx + (R() - 0.5) * s * 3.2, cy + (R() - 0.3) * s * 0.7, cz + (R() - 0.5) * s * 1.6).toNonIndexed());
    }
    return mergeGeometries(gs);
  }, []);
  return <mesh geometry={geo} material={MAT.cloud} />;
}

/* ───────── Hanuman, the flight, the camera ───────── */

export const rigRef: { current: Rig | null } = { current: null };
if (typeof window !== 'undefined') (window as unknown as { __rig?: typeof rigRef }).__rig = rigRef;

function Hanuman({ onEvent }: { onEvent: (e: string) => void }) {
  const rig = useMemo(() => buildHanuman(), []);
  rigRef.current = rig;
  const holder = useRef<THREE.Group>(null), shadow = useRef<THREE.Mesh>(null);
  const prevPose = useRef<{ pose: PoseName; t: number; at: number }>({ pose: 'crouch', t: 0, at: 0 });
  const curPose = useRef<PoseName>('crouch');
  const shadowTex = useMemo(() => {
    const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d')!;
    const g = x.createRadialGradient(64, 64, 4, 64, 64, 62); g.addColorStop(0, 'rgba(5,20,30,0.55)'); g.addColorStop(1, 'rgba(5,20,30,0)');
    x.fillStyle = g; x.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c);
  }, []);
  const { camera } = useThree();
  const look = useRef(new THREE.Vector3());

  useFrame((state, dtRaw) => {
    const dt = Math.min(0.05, dtRaw);
    if (G.paused) return;
    G.time += dt;
    let pose: PoseName = 'fly';
    if (G.mode === 'intro') {
      G.introT += dt;
      pose = G.introT < 2.4 ? 'crouch' : 'leap';
      if (G.introT > 2.4) { G.d += 40 * dt * (G.introT - 2.4); G.shake = Math.max(G.shake, G.introT < 2.8 ? 1 : 0); }
      const p = pathAt(G.d); G.x = p.x; G.y = p.y + (G.introT < 2.4 ? 0 : 0); G.size = p.size;
      if (G.introT > 3.6) { G.mode = G.events.has('free') ? 'free' : 'story'; onEvent('flying'); }
    } else if (G.mode === 'story') {
      const p = pathAt(G.d);
      G.speed += (p.speed * (1 + G.boost) - G.speed) * Math.min(1, dt * 1.5);
      G.d += G.speed * dt;
      const nx = pathAt(G.d + 30);
      G.bank += ((p.x - nx.x) * 0.02 - G.bank) * Math.min(1, dt * 2);
      G.pitch += ((nx.y - p.y) * 0.012 - G.pitch) * Math.min(1, dt * 2);
      G.x = p.x; G.y = p.y; G.size = p.size;
      if (G.d >= END - 1) { G.d = END; G.mode = 'finale'; onEvent('finale'); }
    } else if (G.mode === 'free') {
      const k = G.keys;
      const sx = G.steer.x + (k.has('ArrowLeft') || k.has('a') ? -1 : 0) + (k.has('ArrowRight') || k.has('d') ? 1 : 0);
      const sy = G.steer.y + (k.has('ArrowUp') || k.has('w') ? 1 : 0) + (k.has('ArrowDown') || k.has('s') ? -1 : 0);
      const boosting = k.has(' ') || k.has('Shift') || G.boost > 0.5;
      const grow = (k.has('e') ? 1 : 0) - (k.has('q') ? 1 : 0) + G.grow;
      G.size = clamp(G.size * (1 + grow * dt * 1.2), 0.3, 7);
      const target = (boosting ? 120 : 62) * (G.simhika > 0.5 ? 0.35 : 1);
      G.speed += (target - G.speed) * Math.min(1, dt * 1.6);
      G.vx += (clamp(sx, -1, 1) * 70 - G.vx) * Math.min(1, dt * 2.5);
      G.vy += (clamp(sy, -1, 1) * 55 - G.vy - G.simhika * 30 - G.vy * 0) * Math.min(1, dt * 2.5);
      G.x = clamp(G.x + G.vx * dt, -420, 420);
      G.y = clamp(G.y + G.vy * dt, 10, 330);
      G.d += G.speed * dt;
      G.bank += (-G.vx * 0.008 - G.bank) * Math.min(1, dt * 3);
      G.pitch += (G.vy * 0.006 - G.pitch) * Math.min(1, dt * 3);
      // encounters
      if (!G.events.has('mainaka') && Math.hypot(G.x - PLACES.mainaka.x, -G.d - PLACES.mainaka.z) < 170) { G.events.add('mainaka'); onEvent('mainaka'); }
      if (!G.events.has('surasa') && Math.abs(-G.d - PLACES.surasa.z) < 25) {
        const inMouth = Math.hypot(G.x - PLACES.surasa.x, G.y - PLACES.surasa.mouthY) < 32;
        G.events.add('surasa'); onEvent(inMouth && G.size < 1 ? 'surasaWin' : inMouth ? 'surasaBig' : 'surasaMiss');
      }
      if (G.simhika > 0.6 && !G.events.has('simhikaWarn')) { G.events.add('simhikaWarn'); onEvent('simhika'); }
      if (G.simhika > 0.4 && boosting && G.size < 1.2 && !G.events.has('simhikaFreed')) { G.events.add('simhikaFreed'); G.shake = 1; onEvent('simhikaFreed'); }
      if (G.d > 5850) { G.mode = 'story'; onEvent('landing'); }
    } else if (G.mode === 'finale') {
      G.finaleT += dt;
      pose = G.ring ? 'offer' : 'crouch';
      G.x = PLACES.perch.x; G.y = PLACES.perch.y; G.d = -PLACES.perch.z; G.size = 1.15;
    } else if (G.mode === 'inspect') {
      pose = G.inspectPose;
      G.x = 0; G.d = -PLACES.mahendra.z; G.size = 3; G.bank = 0; G.pitch = 0;
      G.y = PLACES.mahendra.h - 4 + (pose === 'fly' || pose === 'leap' ? 6 : 0);
    }
    if ((G.mode === 'story' || G.mode === 'free') && G.d > END - 140) pose = 'crouch';

    // pose blending
    if (pose !== curPose.current) { prevPose.current = { pose: curPose.current, t: G.time, at: G.time }; curPose.current = pose; }
    const blend = clamp((G.time - prevPose.current.at) / 0.6, 0, 1);
    applyPose(rig, { t: G.time, pose, blend, boost: G.boost, bank: G.bank }, blend < 1 ? { pose: prevPose.current.pose, t: G.time } : undefined);

    // place him
    const h = holder.current!;
    h.position.set(G.x, G.y, -G.d);
    h.scale.setScalar(G.size);
    const flying = pose === 'fly' || pose === 'leap';
    h.rotation.set(flying ? -G.pitch : 0, Math.PI + (flying ? 0 : 0.5), flying ? G.bank : 0, 'YXZ');
    if (G.mode === 'finale') h.rotation.set(0, -2.2, 0);
    if (G.mode === 'inspect') h.rotation.set(0, 0, 0);
    if (shadow.current) {
      const alt = Math.max(1, G.y);
      shadow.current.position.set(G.x, 1.8, -G.d + 4 * G.size);
      const s = G.size * 6 * (1 + alt / 260);
      shadow.current.scale.set(s, s * 1.6, 1);
      (shadow.current.material as THREE.MeshBasicMaterial).opacity = clamp(1.4 - alt / 220, 0.15, 1) * (G.mode === 'finale' ? 0 : 1);
    }

    // camera
    G.shake *= Math.pow(0.05, dt);
    if (G.mode === 'inspect' && (!G.events.has('inspectCam') || G.view)) {
      G.events.add('inspectCam');
      const o = { front: [0, 1.2, 14], side: [14, 1.2, 0], back: [0, 2.5, -14], three: [8, 3.5, 11], '': [8, 3.5, 11] }[G.view];
      camera.position.set(G.x + o[0], G.y + 2.6 + o[1], -G.d + o[2]);
      camera.lookAt(G.x, G.y + 2.6, -G.d);
      G.view = '';
    }
    if (G.cam === 'orbit' || G.mode === 'inspect') return;
    const P = new THREE.Vector3(G.x, G.y, -G.d), S = Math.max(0.8, G.size);
    let want: THREE.Vector3, at: THREE.Vector3;
    const cine = G.cam === 'cine' && (G.mode === 'story' || G.mode === 'intro');
    const shot = cine ? shotFor(G.d) : 'chase';
    if (G.mode === 'finale') {
      const a = 0.75 + G.finaleT * 0.04;
      want = new THREE.Vector3(PLACES.tree.x + Math.cos(a) * 30, PLACES.vatika.ground + 13 + Math.sin(G.finaleT * 0.2) * 1.5, PLACES.tree.z + Math.sin(a) * 30);
      at = new THREE.Vector3(PLACES.tree.x, PLACES.vatika.ground + 10, PLACES.tree.z);
    } else if (G.mode === 'intro') {
      want = P.clone().add(new THREE.Vector3(9 * S, 2.2 * S, 9 * S)); at = P.clone().add(new THREE.Vector3(0, 0.8 * S, -3 * S));
    } else if (shot === 'side') { want = P.clone().add(new THREE.Vector3(-8 * S, 1.2 * S, -1.5 * S)); at = P.clone().add(new THREE.Vector3(0, 0.3 * S, -5 * S)); }
    else if (shot === 'front') { want = P.clone().add(new THREE.Vector3(-2.5 * S, 1.3 * S, -9 * S)); at = P.clone().add(new THREE.Vector3(0, 0.5 * S, 0)); }
    else if (shot === 'wide') { want = P.clone().add(new THREE.Vector3(55, 35, 110)); at = P.clone().add(new THREE.Vector3(0, -10, -120)); }
    else if (shot === 'low') { want = new THREE.Vector3(G.x + 4 * S, Math.max(5, G.y - 4 * S), -G.d + 8 * S); at = P.clone().add(new THREE.Vector3(0, 0, -20 * S)); }
    else if (shot === 'reveal') { want = P.clone().add(new THREE.Vector3(6 * S, 4 * S, 11 * S)); at = P.clone().lerp(new THREE.Vector3(PLACES.lanka.x, 80, PLACES.lanka.z), 0.35); }
    else { want = P.clone().add(new THREE.Vector3(0, 1.7 * S, 6.5 * S)); at = P.clone().add(new THREE.Vector3(0, 0.6 * S, -12 * S)); }
    if (G.shake > 0.01) want.add(new THREE.Vector3((Math.random() - 0.5) * G.shake * 2, (Math.random() - 0.5) * G.shake * 2, 0));
    const k = G.snap ? 1 : 1 - Math.pow(0.02, dt);
    G.snap = false;
    camera.position.lerp(want, k);
    look.current.lerp(at, k);
    camera.lookAt(look.current);
    state.camera.updateProjectionMatrix();
  });

  return (
    <>
      <group ref={holder}><primitive object={rig.root} /></group>
      <mesh ref={shadow} rotation-x={-Math.PI / 2} renderOrder={1}><planeGeometry args={[1, 1]} /><meshBasicMaterial map={shadowTex} transparent depthWrite={false} /></mesh>
    </>
  );
}

function shotFor(d: number) {
  if (d < 250) return 'chase';
  if (d < 1100) return 'chase';
  if (d < 1700) return 'side';
  if (d < 2250) return 'front';
  if (d < 2700) return 'wide';
  if (d < 2980) return 'chase';
  if (d < 3550) return 'low';
  if (d < 4200) return 'wide';
  if (d < 4700) return 'side';
  if (d < 5100) return 'front';
  if (d < 5700) return 'reveal';
  return 'chase';
}

/* ───────── the scene ───────── */

export function World({ onEvent }: { onEvent: (e: string) => void }) {
  const { gl } = useThree();
  useEffect(() => { gl.toneMapping = THREE.NoToneMapping; }, [gl]);
  return (
    <>
      <Sky />
      <Ocean />
      <Clouds />
      <Mahendra />
      <Mainaka />
      <Surasa />
      <Simhika />
      <Lanka />
      <Hanuman onEvent={onEvent} />
    </>
  );
}
