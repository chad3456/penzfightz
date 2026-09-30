import { useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer, Sky, Stars } from '@react-three/drei';
import { CuboidCollider, InstancedRigidBodies, Physics, RigidBody, type InstancedRigidBodyProps, type RapierRigidBody } from '@react-three/rapier';
import { Bloom, EffectComposer, N8AO, ToneMapping, TiltShift2, Vignette } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import { BLOCK, COLS, D, DISTRICTS, ROAD, ROWS, SIDEWALK, W, blockCenter, isOpen, isPark, isPlaza, node, solidBlocks, type District } from './city';
import { carPos, hallOpen, hash, step, type Input, type Sim } from './sim';

/**
 * UPROAR, drawn with the whole three.js family: react-three-fiber for the
 * scene, drei for the sky, stars and environment light, Rapier for the beach
 * balls and traffic cones the crowd knocks about, and postprocessing for
 * ambient occlusion, bloom on the neon and the fireworks, and a tilt-shift
 * lens that turns the city into a model railway.
 */

export interface Bridge {
  sim: Sim;
  input: Input;
  zoom: number;
  started: boolean;
  paused: boolean;
  low: boolean;
  onFrame?: (camera: THREE.Camera, w: number, h: number) => void;
  walkTo?: (x: number, z: number) => void;
}
type B = MutableRefObject<Bridge>;

const PINK = new THREE.Color('#ff2e88');
const SKIN = ['#f1c7a5', '#d9a27c', '#a86f4c', '#7a4a31', '#f6d8c0', '#c68b62'].map((c) => new THREE.Color(c));
const POLICE = new THREE.Color('#1d3a78');
const SOAK = new THREE.Color('#6fa0c8');
const tmpC2 = new THREE.Color();
const tmpE = new THREE.Euler();
const XA = new THREE.Vector3(1, 0, 0);
const tmpM = new THREE.Matrix4(), tmpQ = new THREE.Quaternion(), tmpS = new THREE.Vector3(), tmpP = new THREE.Vector3(), tmpC = new THREE.Color(), UP = new THREE.Vector3(0, 1, 0);
const night = (h: number) => { const x = ((h % 24) + 24) % 24; return x < 6 ? 1 : x < 7.5 ? 1 - (x - 6) / 1.5 : x < 18 ? 0 : x < 20 ? (x - 18) / 2 : 1; };

function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, repeat?: [number, number]) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d')!);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  return t;
}

/* ───────────── the driver: steps the game, flies the camera ───────────── */

function Driver({ bridge }: { bridge: B }) {
  const { camera, size } = useThree();
  const look = useRef(new THREE.Vector3());
  useFrame((state, dt) => {
    const b = bridge.current;
    const s = b.sim;
    const d = Math.min(0.05, dt);
    if (!b.paused) step(s, d, b.started ? b.input : { mx: 0, mz: 0 });
    const L = s.leader;
    const t = state.clock.elapsedTime;
    let want: THREE.Vector3, at: THREE.Vector3;
    if (!b.started) {
      // the title: a slow flight round the city
      const a = t * 0.06;
      want = new THREE.Vector3(Math.sin(a) * 120, 95, Math.cos(a) * 120);
      at = new THREE.Vector3(0, 0, 0);
    } else if (s.over === 'won') {
      const a = t * 0.2;
      const [hx, hz] = blockCenter(3, 2);
      want = new THREE.Vector3(hx + Math.sin(a) * 50, 38, hz + Math.cos(a) * 50);
      at = new THREE.Vector3(hx, 6, hz);
    } else {
      const z = b.zoom;
      want = new THREE.Vector3(L.x, z * 1.12, L.z + z * 0.52);
      at = new THREE.Vector3(L.x, 0, L.z - 1);
    }
    camera.position.lerp(want, Math.min(1, d * (b.started ? 3 : 1)));
    look.current.lerp(at, Math.min(1, d * 4));
    camera.lookAt(look.current);
    b.onFrame?.(camera, size.width, size.height);
  }, -1);
  return null;
}

/* ───────────── sky, light, time of day ───────────── */

function SkyRig({ bridge }: { bridge: B }) {
  const sun = useRef<THREE.DirectionalLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const sky = useRef<THREE.Mesh>(null);
  const { scene } = useThree();
  const fog = useMemo(() => new THREE.Fog('#cfe3f0', 160, 420), []);
  useEffect(() => { scene.fog = fog; return () => { scene.fog = null; }; }, [scene, fog]);
  const sunPos = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    const s = bridge.current.sim;
    const h = s.hour;
    const n = night(h);
    // the sun's arc through the day
    const a = ((h - 6) / 12) * Math.PI;
    sunPos.set(Math.cos(a) * 100, Math.sin(a) * 100, 40);
    const L = s.leader;
    if (sun.current) {
      sun.current.position.set(L.x + sunPos.x * 0.6, Math.max(8, sunPos.y * 0.9), L.z + 50);
      sun.current.target.position.set(L.x, 0, L.z);
      sun.current.target.updateMatrixWorld();
      sun.current.intensity = 2.6 * (1 - n) + 0.15;
      sun.current.color.setHSL(0.09, 0.6, 0.6 + (1 - n) * 0.3);
    }
    if (hemi.current) { hemi.current.intensity = 0.7 * (1 - n) + 0.3; hemi.current.color.set(n > 0.5 ? '#5a6cc0' : '#dfefff'); }
    fog.color.setRGB(0.81 * (1 - n) + 0.05 * n, 0.89 * (1 - n) + 0.06 * n, 0.94 * (1 - n) + 0.14 * n);
    scene.environmentIntensity = 0.1 + (1 - n) * 0.45;
    const u = (sky.current?.material as THREE.ShaderMaterial | undefined)?.uniforms;
    if (u?.sunPosition) u.sunPosition.value.copy(sunPos);
  });
  return (
    <>
      <Sky ref={sky as never} distance={4500} sunPosition={[100, 60, 40]} turbidity={6} rayleigh={1.2} mieCoefficient={0.006} mieDirectionalG={0.85} />
      <Stars radius={260} depth={60} count={1800} factor={4} fade speed={0.4} />
      <hemisphereLight ref={hemi} args={['#dfefff', '#8a7f6a', 0.9]} />
      <directionalLight
        ref={sun}
        castShadow
        shadow-mapSize={[bridge.current.low ? 1024 : 2048, bridge.current.low ? 1024 : 2048]}
        shadow-camera-left={-70} shadow-camera-right={70} shadow-camera-top={70} shadow-camera-bottom={-70}
        shadow-camera-near={1} shadow-camera-far={300} shadow-bias={-0.0004}
      />
      <Environment resolution={64} frames={1}>
        <Lightformer intensity={2} position={[0, 10, 0]} scale={[40, 40, 1]} rotation-x={Math.PI / 2} color="#ffffff" />
        <Lightformer intensity={1.2} position={[30, 5, 0]} scale={[20, 10, 1]} rotation-y={-Math.PI / 2} color="#ffd6e8" />
        <Lightformer intensity={1.2} position={[-30, 5, 0]} scale={[20, 10, 1]} rotation-y={Math.PI / 2} color="#cfe8ff" />
      </Environment>
    </>
  );
}

/* ───────────── the city ───────────── */

/** Windows, computed on the wall itself: dark glass by day, lit by night. */
interface CityU { uNight: { value: number }; uCam: { value: THREE.Vector3 }; uLeader: { value: THREE.Vector3 } }

/**
 * Every building material shares one trick: anything standing between the
 * camera and you is screen-doored away, so the crowd never disappears behind
 * a tower. Walls also get windows, computed on the wall itself: dark glass
 * by day, lit by night.
 */
function cityMaterial(u: CityU, opts: { color?: string; roughness: number; metalness?: number; windows?: 'plain' | 'glass'; flat?: boolean }) {
  const m = new THREE.MeshStandardMaterial({ color: opts.color ?? '#ffffff', roughness: opts.roughness, metalness: opts.metalness ?? 0.02, flatShading: !!opts.flat });
  const glass = opts.windows === 'glass';
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWP; varying vec3 vWN;')
      .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvec4 wpX = modelMatrix * instanceMatrix * vec4(transformed, 1.0); vWP = wpX.xyz; vWN = normalize(mat3(modelMatrix * instanceMatrix) * objectNormal);');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uNight; uniform vec3 uCam; uniform vec3 uLeader; varying vec3 vWP; varying vec3 vWN;\nfloat hh(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5); }')
      .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
        {
          vec3 ab = uLeader - uCam;
          float tt = clamp(dot(vWP - uCam, ab) / dot(ab, ab), 0.0, 1.0);
          float dd = length(vWP - (uCam + ab * tt));
          if (dd < 6.5 && tt < 0.96 && vWP.y > 2.2) {
            vec2 q = mod(floor(gl_FragCoord.xy), 2.0);
            if (q.x + q.y > 0.5) discard;
          }
        }`);
    if (!opts.windows) return;
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        if (abs(vWN.y) < 0.5) {
          vec2 t = vec2(-vWN.z, vWN.x);
          float u = dot(vWP.xz, t);
          float gx = ${glass ? '1.6' : '2.3'}, gy = ${glass ? '2.6' : '3.1'};
          vec2 cell = vec2(floor(u / gx), floor(vWP.y / gy));
          vec2 f = vec2(fract(u / gx), fract(vWP.y / gy));
          float win = step(${glass ? '0.06' : '0.22'}, f.x) * step(f.x, ${glass ? '0.94' : '0.78'}) * step(${glass ? '0.1' : '0.28'}, f.y) * step(f.y, ${glass ? '0.9' : '0.8'}) * step(1.8, vWP.y);
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.16, 0.2, 0.27), win * ${glass ? '0.55' : '0.8'});
          float lit = step(0.42, hh(cell + floor(vWP.xz / 7.0)));
          totalEmissiveRadiance += win * lit * uNight * vec3(1.0, 0.72, 0.4) * 1.1;
        }`);
  };
  return m;
}

function City({ bridge }: { bridge: B }) {
  const s = bridge.current.sim;
  const u = useMemo<CityU>(() => ({ uNight: { value: 0 }, uCam: { value: new THREE.Vector3() }, uLeader: { value: new THREE.Vector3() } }), []);
  const plain = useRef<THREE.InstancedMesh>(null);
  const glass = useRef<THREE.InstancedMesh>(null);
  const roofs = useRef<THREE.InstancedMesh>(null);
  const kit = useRef<THREE.InstancedMesh>(null);
  const mats = useMemo(() => ({
    plain: cityMaterial(u, { roughness: 0.85, windows: 'plain' }),
    glass: cityMaterial(u, { roughness: 0.18, metalness: 0.55, windows: 'glass' }),
    roof: cityMaterial(u, { roughness: 0.8, flat: true }),
    kit: cityMaterial(u, { color: '#9ba3a8', roughness: 0.6 }),
  }), [u]);
  const box = useMemo(() => { const g = new THREE.BoxGeometry(1, 1, 1); g.translate(0, 0.5, 0); return g; }, []);
  const prism = useMemo(() => {
    // a gable: a three-sided cylinder laid along x, ridge up, base on y = 0, one unit each way
    const g = new THREE.CylinderGeometry(1, 1, 1, 3, 1);
    g.rotateZ(Math.PI / 2); g.rotateX(-Math.PI / 2);
    g.scale(1, 1 / 1.5, 1 / Math.sqrt(3)); g.translate(0, 0.5 / 1.5, 0);
    return g;
  }, []);
  const bs = s.buildings;
  const [plainB, glassB] = useMemo(() => [bs.filter((b) => !b.glass), bs.filter((b) => b.glass)], [bs]);
  useEffect(() => {
    const put = (im: THREE.InstancedMesh | null, list: typeof bs) => {
      if (!im) return;
      list.forEach((b, i) => {
        tmpM.compose(tmpP.set(b.x, 0, b.z), tmpQ.identity(), tmpS.set(b.w, b.h, b.d));
        im.setMatrixAt(i, tmpM);
        im.setColorAt(i, tmpC.set(b.color));
      });
      im.instanceMatrix.needsUpdate = true;
      if (im.instanceColor) im.instanceColor.needsUpdate = true;
    };
    put(plain.current, plainB); put(glass.current, glassB);
    const gables = bs.filter((b) => b.roof === 'gable');
    gables.forEach((b, i) => {
      tmpM.compose(tmpP.set(b.x, b.h, b.z), tmpQ.setFromAxisAngle(UP, b.w > b.d ? 0 : Math.PI / 2), tmpS.set(Math.max(b.w, b.d) + 0.3, 2.4, Math.min(b.w, b.d) + 0.3));
      roofs.current!.setMatrixAt(i, tmpM);
      roofs.current!.setColorAt(i, tmpC.set(b.district === 'campus' ? '#5a4a44' : '#b8563d'));
    });
    roofs.current!.count = gables.length;
    roofs.current!.instanceMatrix.needsUpdate = true;
    if (roofs.current!.instanceColor) roofs.current!.instanceColor.needsUpdate = true;
    // rooftop kit: plant, water tanks, antennas
    let k = 0;
    for (const b of bs) {
      if (b.roof === 'gable') continue;
      const n = 1 + (b.id % 3);
      for (let j = 0; j < n; j++) {
        const sx = 0.8 + ((b.id * 7 + j * 3) % 5) * 0.3, sy = 0.6 + ((b.id + j) % 4) * 0.5;
        tmpM.compose(tmpP.set(b.x + (((b.id + j * 5) % 7) / 7 - 0.5) * b.w * 0.6, b.h, b.z + (((b.id * 3 + j) % 5) / 5 - 0.5) * b.d * 0.6), tmpQ.identity(), tmpS.set(sx, sy, sx));
        kit.current!.setMatrixAt(k++, tmpM);
      }
    }
    kit.current!.count = k;
    kit.current!.instanceMatrix.needsUpdate = true;
  }, [bs, plainB, glassB]);
  useFrame(({ camera }) => {
    const b = bridge.current, L = b.sim.leader;
    u.uNight.value = night(b.sim.hour);
    u.uCam.value.copy(camera.position);
    // on the title flight there is nobody to keep in view
    if (b.started) u.uLeader.value.set(L.x, 1, L.z); else u.uLeader.value.copy(camera.position).add(new THREE.Vector3(0, 1, 0));
  });
  return (
    <group>
      <instancedMesh ref={plain} args={[box, mats.plain, plainB.length]} castShadow receiveShadow />
      <instancedMesh ref={glass} args={[box, mats.glass, glassB.length]} castShadow receiveShadow />
      <instancedMesh ref={roofs} args={[prism, mats.roof, bs.length]} castShadow receiveShadow />
      <instancedMesh ref={kit} args={[box, mats.kit, bs.length * 3]} castShadow />
    </group>
  );
}

/** Streets, pavements, plazas and parks, all painted on one ground texture, with raised kerbs. */
function Ground({ bridge }: { bridge: B }) {
  const tex = useMemo(() => canvasTex(2048, Math.round(2048 * (D / W)), (g) => {
    const Wp = 2048, Dp = Math.round(2048 * (D / W)), k = Wp / W;
    g.fillStyle = '#4a4d55'; g.fillRect(0, 0, Wp, Dp);
    for (let i = 0; i < 60000; i++) { g.fillStyle = `rgba(255,255,255,${Math.random() * 0.04})`; g.fillRect(Math.random() * Wp, Math.random() * Dp, 2, 2); }
    // lane markings and zebra crossings
    g.strokeStyle = 'rgba(255,240,200,0.7)'; g.lineWidth = 0.25 * k; g.setLineDash([2 * k, 2 * k]);
    for (let i = 0; i <= COLS; i++) { const [x] = node(i, 0); g.beginPath(); g.moveTo((x + W / 2) * k, 0); g.lineTo((x + W / 2) * k, Dp); g.stroke(); }
    for (let j = 0; j <= ROWS; j++) { const [, z] = node(0, j); g.beginPath(); g.moveTo(0, (z + D / 2) * k); g.lineTo(Wp, (z + D / 2) * k); g.stroke(); }
    g.setLineDash([]);
    g.fillStyle = 'rgba(245,245,240,0.85)';
    for (let i = 0; i <= COLS; i++) for (let j = 0; j <= ROWS; j++) {
      const [x, z] = node(i, j); const px = (x + W / 2) * k, pz = (z + D / 2) * k;
      for (let s = -3; s <= 3; s++) { g.fillRect(px + s * 1.1 * k - 0.35 * k, pz - ROAD / 2 * k - 1.6 * k, 0.7 * k, 1.4 * k); g.fillRect(px - ROAD / 2 * k - 1.6 * k, pz + s * 1.1 * k - 0.35 * k, 1.4 * k, 0.7 * k); }
    }
    // blocks: pavements, plazas, parks
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const [cx, cz] = blockCenter(c, r); const px = (cx - BLOCK / 2 + W / 2) * k, pz = (cz - BLOCK / 2 + D / 2) * k, sz = BLOCK * k;
      g.fillStyle = '#b9b3a8'; g.fillRect(px, pz, sz, sz);
      if (isPark(c, r)) { g.fillStyle = '#6fae5a'; g.fillRect(px + SIDEWALK * k, pz + SIDEWALK * k, sz - SIDEWALK * 2 * k, sz - SIDEWALK * 2 * k); for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(40,90,30,${Math.random() * 0.3})`; g.fillRect(px + Math.random() * sz, pz + Math.random() * sz, 3, 3); } g.strokeStyle = '#d8cdb3'; g.lineWidth = 1.2 * k; g.beginPath(); g.moveTo(px, pz + sz / 2); g.lineTo(px + sz, pz + sz / 2); g.moveTo(px + sz / 2, pz); g.lineTo(px + sz / 2, pz + sz); g.stroke(); }
      else if (isPlaza(c, r)) {
        g.fillStyle = '#cbbd9f'; g.fillRect(px + 0.6 * k, pz + 0.6 * k, sz - 1.2 * k, sz - 1.2 * k);
        g.strokeStyle = 'rgba(120,100,80,0.25)'; g.lineWidth = 2;
        for (let x = 0; x < sz; x += 1.5 * k) { g.beginPath(); g.moveTo(px + x, pz); g.lineTo(px + x, pz + sz); g.stroke(); g.beginPath(); g.moveTo(px, pz + x); g.lineTo(px + sz, pz + x); g.stroke(); }
        g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 0.4 * k; g.beginPath(); g.arc(px + sz / 2, pz + sz / 2, sz * 0.32, 0, Math.PI * 2); g.stroke();
      }
    }
  }), []);
  const kerbs = useRef<THREE.InstancedMesh>(null);
  useEffect(() => {
    let i = 0;
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      if (isOpen(c, r)) continue;
      const [cx, cz] = blockCenter(c, r);
      tmpM.compose(tmpP.set(cx, 0, cz), tmpQ.identity(), tmpS.set(BLOCK, 0.18, BLOCK));
      kerbs.current!.setMatrixAt(i++, tmpM);
    }
    kerbs.current!.count = i; kerbs.current!.instanceMatrix.needsUpdate = true;
  }, []);
  const kerbG = useMemo(() => { const g = new THREE.BoxGeometry(1, 1, 1); g.translate(0, 0.5, 0); return g; }, []);
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} receiveShadow onPointerDown={(e) => { if (e.button === 0) bridge.current.walkTo?.(e.point.x, e.point.z); }}>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial map={tex} roughness={0.92} />
      </mesh>
      <instancedMesh ref={kerbs} args={[kerbG, new THREE.MeshStandardMaterial({ color: '#c4bfb3', roughness: 0.9 }), COLS * ROWS]} receiveShadow />
      {/* the land beyond the grid, and the harbour to the east */}
      <mesh rotation-x={-Math.PI / 2} position={[-W / 2 - 60, -0.02, 0]} receiveShadow><planeGeometry args={[120, D + 240]} /><meshStandardMaterial color="#7da35f" roughness={1} /></mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.02, -D / 2 - 60]} receiveShadow><planeGeometry args={[W, 120]} /><meshStandardMaterial color="#86a864" roughness={1} /></mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.02, D / 2 + 60]} receiveShadow><planeGeometry args={[W, 120]} /><meshStandardMaterial color="#7f9f60" roughness={1} /></mesh>
      <Harbour />
    </group>
  );
}

function Harbour() {
  const mat = useMemo(() => new THREE.ShaderMaterial({
    transparent: false,
    uniforms: { uT: { value: 0 } },
    vertexShader: 'varying vec3 vP; uniform float uT; void main(){ vec3 p = position; p.z += sin(p.x*0.15+uT)*0.3 + cos(p.y*0.2+uT*1.3)*0.3; vP = (modelMatrix*vec4(p,1.0)).xyz; gl_Position = projectionMatrix*viewMatrix*vec4(vP,1.0); }',
    fragmentShader: 'varying vec3 vP; uniform float uT; void main(){ float w = sin(vP.x*0.6+uT*2.0)*sin(vP.z*0.5-uT*1.6); vec3 c = mix(vec3(0.05,0.35,0.5), vec3(0.2,0.65,0.78), 0.5+0.5*w); c += pow(max(0.0,w),6.0)*0.6; gl_FragColor = vec4(c,1.0); }',
  }), []);
  useFrame((st) => { mat.uniforms.uT!.value = st.clock.elapsedTime; });
  return <mesh rotation-x={-Math.PI / 2} position={[W / 2 + 70, -0.3, 0]} material={mat}><planeGeometry args={[140, D + 260, 60, 60]} /></mesh>;
}

/** Trees in the parks and along the kerbs, and streetlamps that come on at dusk. */
function Greenery({ bridge }: { bridge: B }) {
  const trunks = useRef<THREE.InstancedMesh>(null), crowns = useRef<THREE.InstancedMesh>(null), poles = useRef<THREE.InstancedMesh>(null), bulbs = useRef<THREE.InstancedMesh>(null), pools = useRef<THREE.InstancedMesh>(null);
  const lampMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#fff3c4', emissive: '#ffcf70', emissiveIntensity: 0 }), []);
  const poolMat = useMemo(() => new THREE.MeshBasicMaterial({ map: canvasTex(64, 64, (g) => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,210,130,0.9)'); gr.addColorStop(1, 'rgba(255,210,130,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); }), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }), []);
  useEffect(() => {
    let t = 0;
    const tree = (x: number, z: number, s: number) => {
      tmpM.compose(tmpP.set(x, 0, z), tmpQ.identity(), tmpS.set(s, s, s)); trunks.current!.setMatrixAt(t, tmpM);
      tmpM.compose(tmpP.set(x, 2.4 * s, z), tmpQ.setFromAxisAngle(UP, x * 3), tmpS.set(s * (1 + (Math.abs(x * 7) % 0.4)), s, s)); crowns.current!.setMatrixAt(t, tmpM);
      crowns.current!.setColorAt(t, tmpC.setHSL(0.26 + (Math.abs(z * 13) % 0.08), 0.5, 0.36 + (Math.abs(x * 11) % 0.12)));
      t++;
    };
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const [cx, cz] = blockCenter(c, r);
      if (isPark(c, r)) for (let i = 0; i < 16; i++) { const a = i * 2.39, d = 2 + (i % 5) * 1.5; tree(cx + Math.cos(a) * d, cz + Math.sin(a) * d, 0.9 + (i % 3) * 0.25); }
      else if (!isPlaza(c, r)) for (const [dx, dz] of [[-1, -1], [1, 1]]) tree(cx + dx! * (BLOCK / 2 - 0.7), cz + dz! * (BLOCK / 2 - 0.7), 0.7);
    }
    trunks.current!.count = t; crowns.current!.count = t;
    for (const im of [trunks.current!, crowns.current!]) { im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; }
    let l = 0;
    for (let i = 0; i <= COLS; i++) for (let j = 0; j <= ROWS; j++) {
      const [x, z] = node(i, j);
      const px = x + ROAD / 2 + 0.6, pz = z + ROAD / 2 + 0.6;
      tmpM.compose(tmpP.set(px, 0, pz), tmpQ.identity(), tmpS.set(1, 1, 1)); poles.current!.setMatrixAt(l, tmpM);
      tmpM.compose(tmpP.set(px, 4.6, pz), tmpQ.identity(), tmpS.set(1, 1, 1)); bulbs.current!.setMatrixAt(l, tmpM);
      tmpM.compose(tmpP.set(px, 0.05, pz), tmpQ.setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2), tmpS.set(9, 9, 1)); pools.current!.setMatrixAt(l, tmpM);
      l++;
    }
    for (const im of [poles.current!, bulbs.current!, pools.current!]) { im.count = l; im.instanceMatrix.needsUpdate = true; }
  }, []);
  useFrame(() => { const n = night(bridge.current.sim.hour); lampMat.emissiveIntensity = n * 3; poolMat.opacity = n * 0.8; });
  const trunkG = useMemo(() => { const g = new THREE.CylinderGeometry(0.12, 0.18, 2.2, 6); g.translate(0, 1.1, 0); return g; }, []);
  const crownG = useMemo(() => new THREE.IcosahedronGeometry(1.4, 1), []);
  const poleG = useMemo(() => { const g = new THREE.CylinderGeometry(0.07, 0.09, 4.6, 6); g.translate(0, 2.3, 0); return g; }, []);
  return (
    <group>
      <instancedMesh ref={trunks} args={[trunkG, new THREE.MeshStandardMaterial({ color: '#6b4a33' }), 400]} castShadow />
      <instancedMesh ref={crowns} args={[crownG, new THREE.MeshStandardMaterial({ roughness: 0.9, flatShading: true }), 400]} castShadow receiveShadow />
      <instancedMesh ref={poles} args={[poleG, new THREE.MeshStandardMaterial({ color: '#2d3136', metalness: 0.5, roughness: 0.5 }), 60]} castShadow />
      <instancedMesh ref={bulbs} args={[new THREE.SphereGeometry(0.28, 10, 8), lampMat, 60]} />
      <instancedMesh ref={pools} args={[new THREE.PlaneGeometry(1, 1), poolMat, 60]} />
    </group>
  );
}

/* ───────────── plazas: landmarks, flags, occupation rings ───────────── */

function Landmark({ d }: { d: District }) {
  const [x, z] = blockCenter(d.plaza[0], d.plaza[1]);
  const stone = <meshStandardMaterial color="#e8e0cf" roughness={0.7} />;
  switch (d.landmark) {
    case 'clock': return (
      <group position={[x, 0, z]}>
        <mesh position={[0, 5, 0]} castShadow><boxGeometry args={[2.6, 10, 2.6]} /><meshStandardMaterial color="#c98a5c" /></mesh>
        <mesh position={[0, 11.2, 0]} castShadow><coneGeometry args={[2.3, 3, 4]} /><meshStandardMaterial color="#3d5a6e" /></mesh>
        {[0, 1, 2, 3].map((k) => <mesh key={k} position={[Math.sin(k * Math.PI / 2) * 1.32, 8.2, Math.cos(k * Math.PI / 2) * 1.32]} rotation-y={k * Math.PI / 2}><circleGeometry args={[0.9, 24]} /><meshStandardMaterial color="#fff8e0" emissive="#ffe8a0" emissiveIntensity={0.4} /></mesh>)}
      </group>
    );
    case 'fountain': return (
      <group position={[x, 0, z]}>
        <mesh position={[0, 0.4, 0]} castShadow receiveShadow><cylinderGeometry args={[4, 4.3, 0.8, 32]} />{stone}</mesh>
        <mesh position={[0, 0.82, 0]}><cylinderGeometry args={[3.6, 3.6, 0.1, 32]} /><meshStandardMaterial color="#3aa6c9" roughness={0.1} metalness={0.2} /></mesh>
        <mesh position={[0, 2, 0]} castShadow><cylinderGeometry args={[0.4, 0.7, 2.6, 12]} />{stone}</mesh>
        <mesh position={[0, 3.4, 0]}><sphereGeometry args={[0.9, 16, 12]} /><meshStandardMaterial color="#bfe9ff" transparent opacity={0.6} /></mesh>
      </group>
    );
    case 'cube': return (
      <group position={[x, 0, z]}>
        <mesh position={[0, 3.6, 0]} rotation={[0.6, 0.7, 0.2]} castShadow><boxGeometry args={[4, 4, 4]} /><meshStandardMaterial color="#e3b53a" metalness={0.9} roughness={0.2} /></mesh>
        <mesh position={[0, 0.3, 0]} receiveShadow><boxGeometry args={[6, 0.6, 6]} />{stone}</mesh>
      </group>
    );
    case 'library': return (
      <group position={[x, 0, z - 5]}>
        {[0, 1, 2].map((k) => <mesh key={k} position={[0, 0.25 + k * 0.5, 2 - k * 0.8]} receiveShadow castShadow><boxGeometry args={[12, 0.5, 2]} />{stone}</mesh>)}
        {[-4, -2, 0, 2, 4].map((k) => <mesh key={k} position={[k, 3.5, -0.5]} castShadow><cylinderGeometry args={[0.35, 0.35, 5, 12]} />{stone}</mesh>)}
        <mesh position={[0, 6.4, -0.5]} castShadow><boxGeometry args={[11, 1, 2.4]} />{stone}</mesh>
      </group>
    );
    case 'sculpture': return (
      <group position={[x, 0, z]}>
        <mesh position={[0, 4, 0]} castShadow><torusKnotGeometry args={[2, 0.55, 120, 16]} /><meshStandardMaterial color="#ff5fa8" metalness={0.3} roughness={0.25} /></mesh>
        <mesh position={[0, 0.4, 0]}><cylinderGeometry args={[2, 2.2, 0.8, 24]} />{stone}</mesh>
      </group>
    );
    case 'crane': return (
      <group position={[x + 4, 0, z]}>
        <mesh position={[0, 7, 0]} castShadow><boxGeometry args={[1, 14, 1]} /><meshStandardMaterial color="#f2b705" /></mesh>
        <mesh position={[3, 13.5, 0]} castShadow><boxGeometry args={[10, 0.8, 0.8]} /><meshStandardMaterial color="#f2b705" /></mesh>
        <mesh position={[6.5, 9, 0]}><boxGeometry args={[0.08, 8, 0.08]} /><meshStandardMaterial color="#333" /></mesh>
        <mesh position={[6.5, 4.6, 0]} castShadow><boxGeometry args={[2.4, 1.4, 1.4]} /><meshStandardMaterial color="#d8492c" /></mesh>
      </group>
    );
    case 'dome': return (
      <group position={[x, 0, z - 5.5]}>
        <mesh position={[0, 3.5, 0]} castShadow receiveShadow><boxGeometry args={[12, 7, 6]} /><meshStandardMaterial color="#f1ece2" /></mesh>
        <mesh position={[0, 8.2, 0]} castShadow><sphereGeometry args={[3.2, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#8fb7a6" metalness={0.6} roughness={0.3} /></mesh>
        {[-4.5, -2.25, 0, 2.25, 4.5].map((k) => <mesh key={k} position={[k, 3.5, 3.2]} castShadow><cylinderGeometry args={[0.3, 0.3, 7, 12]} /><meshStandardMaterial color="#fffaf0" /></mesh>)}
        <mesh position={[0, 12.5, 0]}><cylinderGeometry args={[0.05, 0.05, 3, 6]} /><meshStandardMaterial color="#333" /></mesh>
      </group>
    );
  }
}

function Plazas({ bridge }: { bridge: B }) {
  const rings = useRef<(THREE.Mesh | null)[]>([]);
  const flags = useRef<(THREE.Group | null)[]>([]);
  const flagTex = useMemo(() => canvasTex(256, 160, (g) => { g.fillStyle = '#ff2e88'; g.fillRect(0, 0, 256, 160); g.fillStyle = '#e6ff3a'; g.font = '900 64px Bungee, sans-serif'; g.textAlign = 'center'; g.fillText('OURS', 128, 104); }), []);
  useFrame((st) => {
    const s = bridge.current.sim;
    DISTRICTS.forEach((d, i) => {
      const r = rings.current[i], f = flags.current[i];
      const ds = s.districts[d.id];
      if (r) {
        const locked = d.id === 'hall' && !hallOpen(s);
        const p = ds.captured ? 1 : ds.occupy;
        r.visible = !locked;
        const arc = Math.round((p > 0 ? p : 1) * 64) / 64;
        if (r.userData.arc !== arc) {
          r.userData.arc = arc;
          r.geometry.dispose();
          r.geometry = new THREE.RingGeometry(BLOCK * 0.42, BLOCK * 0.46, 64, 1, Math.PI / 2, Math.max(0.001, arc * Math.PI * 2));
        }
        const m = r.material as THREE.MeshBasicMaterial;
        m.color.set(ds.captured ? '#ff2e88' : p > 0 ? d.hue : '#ffffff');
        m.opacity = ds.captured ? 0.9 : p > 0 ? 0.9 : 0.25 + 0.15 * Math.sin(st.clock.elapsedTime * 3);
      }
      if (f) { f.visible = ds.captured; f.rotation.y = Math.sin(st.clock.elapsedTime * 1.5 + i) * 0.2; }
    });
  });
  return (
    <group>
      {DISTRICTS.map((d, i) => {
        const [x, z] = blockCenter(d.plaza[0], d.plaza[1]);
        return (
          <group key={d.id}>
            <Landmark d={d} />
            <mesh ref={(m) => { rings.current[i] = m; }} rotation-x={-Math.PI / 2} position={[x, 0.06, z]}><ringGeometry args={[1, 2, 8]} /><meshBasicMaterial transparent depthWrite={false} toneMapped={false} /></mesh>
            <group ref={(g) => { flags.current[i] = g; }} position={[x - BLOCK * 0.35, 0, z - BLOCK * 0.35]}>
              <mesh position={[0, 5, 0]} castShadow><cylinderGeometry args={[0.1, 0.1, 10, 8]} /><meshStandardMaterial color="#ddd" metalness={0.7} /></mesh>
              <mesh position={[1.6, 8.8, 0]}><planeGeometry args={[3.2, 2]} /><meshStandardMaterial map={flagTex} side={THREE.DoubleSide} emissive="#ff2e88" emissiveIntensity={0.25} /></mesh>
            </group>
          </group>
        );
      })}
    </group>
  );
}

/* ───────────── people ───────────── */

function Crowd({ bridge }: { bridge: B }) {
  const MAX = 900;
  const body = useRef<THREE.InstancedMesh>(null), head = useRef<THREE.InstancedMesh>(null), sign = useRef<THREE.InstancedMesh>(null), stick = useRef<THREE.InstancedMesh>(null), helm = useRef<THREE.InstancedMesh>(null), umb = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => {
    const b = new THREE.CapsuleGeometry(0.28, 0.5, 3, 7); b.translate(0, 0.62, 0);
    const h = new THREE.SphereGeometry(0.24, 10, 7); h.translate(0, 1.35, 0);
    const sg = new THREE.BoxGeometry(0.8, 0.5, 0.04); sg.translate(0, 2.25, 0);
    const st = new THREE.CylinderGeometry(0.025, 0.025, 1.1, 5); st.translate(0, 1.7, 0);
    const hm = new THREE.SphereGeometry(0.28, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55); hm.translate(0, 1.4, 0);
    const u = new THREE.ConeGeometry(0.75, 0.35, 8, 1, true); u.translate(0, 2.35, 0);
    return { b, h, sg, st, hm, u };
  }, []);
  const signTex = useMemo(() => canvasTex(256, 160, (g) => {
    // one sheet of four placards, picked per person by uv offset would need a custom shader; keep one bold design
    g.fillStyle = '#e6ff3a'; g.fillRect(0, 0, 256, 160); g.fillStyle = '#ff2e88'; g.font = '900 58px Bungee, sans-serif'; g.textAlign = 'center'; g.fillText('LOUDER', 128, 100);
  }), []);
  useFrame((st) => {
    const s = bridge.current.sim;
    const t = st.clock.elapsedTime;
    let i = 0, si = 0, hi = 0, ui = 0;
    const umbr = s.umbrellas > 0;
    for (const a of s.agents) {
      if (a.gone || i >= MAX) continue;
      const moving = Math.hypot(a.tx - a.x, a.tz - a.z) > 0.35;
      let y = moving ? Math.abs(Math.sin(a.walk)) * 0.1 : 0;
      let rot = a.face;
      if (a.dance > 0 || (a.role === 'follower' && s.parties.some((p) => Math.hypot(p.x - a.x, p.z - a.z) < 12))) { y = Math.abs(Math.sin(t * 8 + a.id)) * 0.35; rot += Math.sin(t * 4 + a.id) * 0.6; }
      if (a.role === 'police' && a.eat > 0) rot += Math.sin(t * 2 + a.id) * 0.2;
      const sc = a.role === 'police' ? 1.08 : 1;
      tmpQ.setFromAxisAngle(UP, rot);
      tmpM.compose(tmpP.set(a.x, y, a.z), tmpQ, tmpS.set(sc, sc, sc));
      body.current!.setMatrixAt(i, tmpM);
      head.current!.setMatrixAt(i, tmpM);
      // colours
      if (a.role === 'police') tmpC.copy(POLICE);
      else if (a.role === 'detained') tmpC.set('#8c8c8c');
      else if (a.role === 'follower') tmpC.copy(PINK).offsetHSL((a.hue - 0.5) * 0.08, 0, (a.hue - 0.5) * 0.15);
      else tmpC.setHSL(a.hue, 0.35, 0.68);
      if (a.holi > 0.05 && a.role !== 'police') tmpC.lerp(tmpC2.setHSL((a.id * 0.137) % 1, 0.95, 0.55), Math.min(1, a.holi * 1.5));
      if (a.soaked > 0) tmpC.lerp(SOAK, 0.4);
      body.current!.setColorAt(i, tmpC);
      head.current!.setColorAt(i, SKIN[a.id % SKIN.length]!);
      if (a.role === 'follower') {
        const lift = Math.sin(t * 6 + a.id) * 0.12;
        tmpM.compose(tmpP.set(a.x, y + lift, a.z), tmpQ, tmpS.set(1, 1, 1));
        if (a.id % 3 === 0) { sign.current!.setMatrixAt(si, tmpM); stick.current!.setMatrixAt(si, tmpM); si++; }
        if (umbr) { tmpM.compose(tmpP.set(a.x, y, a.z), tmpQ.setFromAxisAngle(UP, t * 3 + a.id), tmpS.set(1, 1, 1)); umb.current!.setMatrixAt(ui, tmpM); umb.current!.setColorAt(ui, tmpC.setHSL((a.id * 0.21) % 1, 0.85, 0.55)); ui++; }
      }
      if (a.role === 'police') { tmpM.compose(tmpP.set(a.x, y, a.z), tmpQ, tmpS.set(sc, sc, sc)); helm.current!.setMatrixAt(hi++, tmpM); }
      i++;
    }
    body.current!.count = i; head.current!.count = i; sign.current!.count = si; stick.current!.count = si; helm.current!.count = hi; umb.current!.count = ui;
    for (const im of [body.current!, head.current!, sign.current!, stick.current!, helm.current!, umb.current!]) { im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; }
  });
  return (
    <group>
      <instancedMesh ref={body} args={[geo.b, new THREE.MeshStandardMaterial({ roughness: 0.6 }), MAX]} castShadow frustumCulled={false} />
      <instancedMesh ref={head} args={[geo.h, new THREE.MeshStandardMaterial({ roughness: 0.55 }), MAX]} castShadow frustumCulled={false} />
      <instancedMesh ref={sign} args={[geo.sg, new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.7 }), MAX]} castShadow frustumCulled={false} />
      <instancedMesh ref={stick} args={[geo.st, new THREE.MeshStandardMaterial({ color: '#c8a070' }), MAX]} frustumCulled={false} />
      <instancedMesh ref={helm} args={[geo.hm, new THREE.MeshStandardMaterial({ color: '#f4f6ff', metalness: 0.3, roughness: 0.25 }), 120]} frustumCulled={false} />
      <instancedMesh ref={umb} args={[geo.u, new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: 0.5 }), MAX]} castShadow frustumCulled={false} />
    </group>
  );
}

function Leader({ bridge }: { bridge: B }) {
  const g = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);
  const light = useRef<THREE.PointLight>(null);
  useFrame((st) => {
    const s = bridge.current.sim, L = s.leader;
    if (!g.current) return;
    g.current.position.set(L.x, Math.abs(Math.sin(L.walk)) * 0.12, L.z);
    g.current.rotation.y = L.face;
    g.current.visible = bridge.current.started;
    const k = 1 + 0.08 * Math.sin(st.clock.elapsedTime * 5);
    ring.current?.scale.set(k, k, k);
    if (light.current) light.current.intensity = 6 + night(s.hour) * 18;
    (ring.current!.material as THREE.MeshBasicMaterial).color.set(L.caught > 0 ? '#ff3030' : '#e6ff3a');
  });
  return (
    <group ref={g}>
      <mesh position={[0, 0.8, 0]} castShadow><capsuleGeometry args={[0.36, 0.7, 4, 10]} /><meshStandardMaterial color="#e6ff3a" roughness={0.4} /></mesh>
      <mesh position={[0, 1.75, 0]} castShadow><sphereGeometry args={[0.3, 16, 12]} /><meshStandardMaterial color="#c68b62" /></mesh>
      <mesh position={[0, 2.02, -0.02]}><sphereGeometry args={[0.31, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.5]} /><meshStandardMaterial color="#ff2e88" /></mesh>
      <mesh position={[0.25, 1.7, 0.45]} rotation-x={Math.PI / 2}><coneGeometry args={[0.28, 0.7, 16, 1, true]} /><meshStandardMaterial color="#f7f7f7" side={THREE.DoubleSide} metalness={0.4} roughness={0.3} /></mesh>
      <mesh position={[-0.45, 2.6, -0.1]}><cylinderGeometry args={[0.03, 0.03, 3, 6]} /><meshStandardMaterial color="#ccc" /></mesh>
      <mesh position={[-0.45 + 0.7, 3.7, -0.1]}><planeGeometry args={[1.4, 0.9]} /><meshStandardMaterial color="#ff2e88" emissive="#ff2e88" emissiveIntensity={0.6} side={THREE.DoubleSide} /></mesh>
      <mesh ref={ring} rotation-x={-Math.PI / 2} position={[0, 0.07, 0]}><ringGeometry args={[0.9, 1.15, 40]} /><meshBasicMaterial color="#e6ff3a" toneMapped={false} /></mesh>
      <pointLight ref={light} position={[0, 3, 0]} color="#ff7ab8" distance={14} intensity={6} />
    </group>
  );
}

function Cars({ bridge }: { bridge: B }) {
  const body = useRef<THREE.InstancedMesh>(null), cab = useRef<THREE.InstancedMesh>(null), lamps = useRef<THREE.InstancedMesh>(null);
  const COLS_ = ['#e84a3c', '#3c8de8', '#f2c14e', '#f4f4f4', '#2d2d2d', '#44b37a'].map((c) => new THREE.Color(c));
  const lampMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#fff', emissive: '#fff4d0', emissiveIntensity: 1 }), []);
  useFrame(() => {
    const s = bridge.current.sim;
    s.cars.forEach((c, i) => {
      const [x, z] = carPos(c);
      const yaw = c.axis === 'x' ? (c.dir > 0 ? Math.PI / 2 : -Math.PI / 2) : c.dir > 0 ? 0 : Math.PI;
      const shake = c.honk > 0 ? Math.sin(c.honk * 60) * 0.05 : 0;
      tmpM.compose(tmpP.set(x, 0.35 + shake, z), tmpQ.setFromAxisAngle(UP, yaw), tmpS.set(1, 1, 1));
      body.current!.setMatrixAt(i, tmpM); cab.current!.setMatrixAt(i, tmpM); lamps.current!.setMatrixAt(i, tmpM);
      body.current!.setColorAt(i, COLS_[c.color]!);
    });
    for (const im of [body.current!, cab.current!, lamps.current!]) { im.count = s.cars.length; im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; }
    lampMat.emissiveIntensity = 0.5 + night(s.hour) * 4;
  });
  const g = useMemo(() => {
    const b = new THREE.BoxGeometry(1.8, 0.7, 3.8); b.translate(0, 0.35, 0);
    const c = new THREE.BoxGeometry(1.6, 0.6, 1.9); c.translate(0, 1.0, -0.2);
    const l = new THREE.BoxGeometry(1.5, 0.18, 0.1); l.translate(0, 0.5, 1.92);
    return { b, c, l };
  }, []);
  return (
    <group>
      <instancedMesh ref={body} args={[g.b, new THREE.MeshStandardMaterial({ metalness: 0.5, roughness: 0.3 }), 60]} castShadow />
      <instancedMesh ref={cab} args={[g.c, new THREE.MeshStandardMaterial({ color: '#223', metalness: 0.8, roughness: 0.1 }), 60]} castShadow />
      <instancedMesh ref={lamps} args={[g.l, lampMat, 60]} />
    </group>
  );
}

/* ───────────── physics: beach balls and traffic cones ───────────── */

function Physical({ bridge }: { bridge: B }) {
  const bodies = useRef(new Map<number, RapierRigidBody>());
  const [balls, setBalls] = useState<{ key: number; pos: [number, number, number]; born: number }[]>([]);
  const cones = useRef<RapierRigidBody[]>(null);
  const coneInstances = useMemo<InstancedRigidBodyProps[]>(() => {
    const out: InstancedRigidBodyProps[] = [];
    let k = 0;
    for (let i = 0; i <= COLS; i++) for (let j = 0; j <= ROWS; j++) {
      if ((i + j) % 2) continue;
      const [x, z] = node(i, j);
      for (const [dx, dz] of [[-2.6, -2.6], [2.6, 2.6]]) out.push({ key: `c${k++}`, position: [x + dx!, 0.5, z + dz!], rotation: [0, 0, 0] });
    }
    return out;
  }, []);
  const coneMesh = useMemo(() => ({ g: new THREE.ConeGeometry(0.32, 0.9, 12), m: new THREE.MeshStandardMaterial({ color: '#ff6a1a', roughness: 0.5 }) }), []);
  const ballTex = useMemo(() => canvasTex(256, 128, (g) => { const cs = ['#ff2e88', '#ffffff', '#35b6ff', '#e6ff3a', '#ffffff', '#ff7a2e']; cs.forEach((c, i) => { g.fillStyle = c; g.fillRect((i * 256) / cs.length, 0, 256 / cs.length + 1, 128); }); }), []);
  const solids = useMemo(() => solidBlocks(), []);
  useFrame((st) => {
    const s = bridge.current.sim, L = s.leader;
    const t = st.clock.elapsedTime;
    // new balls, as the game asks for them; old ones deflate after 45 seconds
    if (s.ballRequests > 0 || balls.some((b) => t - b.born > 45)) {
      const add: typeof balls = [];
      while (s.ballRequests > 0) { s.ballRequests--; const key = s.nextId++; add.push({ key, pos: [L.x + (Math.random() - 0.5) * 6, 6 + (key % 3), L.z + (Math.random() - 0.5) * 6], born: t }); }
      setBalls((cur) => [...cur.filter((b) => t - b.born <= 45), ...add].slice(-12));
    }
    s.balls = [];
    // (a body can be gone from the world before React lets go of it: skip those)
    for (const rb of bodies.current.values()) {
      if (!rb.isValid()) continue;
      const p = rb.translation();
      s.balls.push({ x: p.x, y: p.y, z: p.z });
      // the crowd keeps them in the air
      let under = 0;
      hash.near(p.x, p.z, 2.4, (a) => { if (a.role === 'follower') under++; });
      if (under > 0 && p.y < 2.6) { rb.applyImpulse({ x: (Math.random() - 0.5) * 1.2, y: 2.2 + Math.min(4, under) * 0.5, z: (Math.random() - 0.5) * 1.2 }, true); s.chaos += 0.3; }
      // drift back towards the leader so they stay in play
      rb.applyImpulse({ x: (L.x - p.x) * 0.004, y: 0, z: (L.z - p.z) * 0.004 }, true);
    }
    // the crowd knocks cones over
    cones.current?.forEach((rb) => {
      if (!rb?.isValid()) return;
      const p = rb.translation();
      let hit: { x: number; z: number } | null = null;
      hash.near(p.x, p.z, 0.8, (a) => { if (!hit && a.role === 'follower') hit = a; });
      if (hit) { const h = hit as { x: number; z: number }; const dx = p.x - h.x, dz = p.z - h.z, d = Math.hypot(dx, dz) || 1; rb.applyImpulse({ x: (dx / d) * 0.15, y: 0.05, z: (dz / d) * 0.15 }, true); }
    });
  });
  return (
    <group>
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[W, 0.5, D]} position={[0, -0.5, 0]} />
        {solids.map((r, i) => <CuboidCollider key={i} args={[(r.x1 - r.x0) / 2, 20, (r.z1 - r.z0) / 2]} position={[(r.x0 + r.x1) / 2, 20, (r.z0 + r.z1) / 2]} />)}
      </RigidBody>
      {balls.map((b) => (
        <RigidBody key={b.key} ref={(r) => { if (r) bodies.current.set(b.key, r); else bodies.current.delete(b.key); }} colliders="ball" position={b.pos} restitution={0.85} friction={0.2} linearDamping={0.3} angularDamping={0.2} mass={0.3}>
          <mesh castShadow><sphereGeometry args={[1.3, 24, 18]} /><meshStandardMaterial map={ballTex} roughness={0.35} /></mesh>
        </RigidBody>
      ))}
      <InstancedRigidBodies ref={cones} instances={coneInstances} colliders="hull" mass={0.4} restitution={0.2} friction={0.7}>
        <instancedMesh args={[coneMesh.g, coneMesh.m, coneInstances.length]} castShadow />
      </InstancedRigidBodies>
    </group>
  );
}

/* ───────────── effects: waves, parties, colour, pizza, murals, fireworks, water, chopper ───────────── */

function FX({ bridge }: { bridge: B }) {
  const waves = useRef<THREE.InstancedMesh>(null);
  const clouds = useRef<THREE.InstancedMesh>(null);
  const confetti = useRef<THREE.InstancedMesh>(null);
  const spray = useRef<THREE.InstancedMesh>(null);
  const speakers = useRef<THREE.Group>(null);
  const pizzas = useRef<THREE.InstancedMesh>(null);
  const truck = useRef<THREE.Group>(null);
  const puff = useMemo(() => canvasTex(128, 128, (g) => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.6, 'rgba(255,255,255,0.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); }), []);
  const conf = useRef(Array.from({ length: 700 }, () => ({ x: 0, y: -10, z: 0, vx: 0, vy: 0, vz: 0, r: 0, c: 0 })));
  const confI = useRef(0);
  const lastFw = useRef(0);
  const fwPts = useRef<THREE.Points>(null);
  const fw = useRef({ pos: new Float32Array(3000 * 3), vel: new Float32Array(3000 * 3), col: new Float32Array(3000 * 3), life: new Float32Array(3000), i: 0 });
  const lastWave = useRef(0), lastParty = useRef(0);
  const burst = (x: number, y: number, z: number, n: number, up = 8) => {
    for (let k = 0; k < n; k++) {
      const p = conf.current[confI.current++ % conf.current.length]!;
      Object.assign(p, { x, y, z, vx: (Math.random() - 0.5) * 8, vy: up * (0.5 + Math.random()), vz: (Math.random() - 0.5) * 8, r: Math.random() * 6, c: Math.floor(Math.random() * 6) });
    }
  };
  const CONF = ['#ff2e88', '#e6ff3a', '#35b6ff', '#ffffff', '#ff7a2e', '#b46cff'].map((c) => new THREE.Color(c));
  useFrame((st, dt0) => {
    const dt = Math.min(0.05, dt0);
    const s = bridge.current.sim;
    const t = st.clock.elapsedTime;
    // chant waves
    let i = 0;
    for (const w of s.waves) {
      const k = w.t / 1.2;
      tmpM.compose(tmpP.set(w.x, 0.1, w.z), tmpQ.setFromAxisAngle(XA, -Math.PI / 2), tmpS.setScalar(w.r * (0.2 + 0.8 * k)));
      waves.current!.setMatrixAt(i, tmpM); waves.current!.setColorAt(i, tmpC.set('#e6ff3a').multiplyScalar(1 - k)); i++;
      if (w.id > lastWave.current) { lastWave.current = w.id; burst(w.x, 2, w.z, 12, 5); }
    }
    waves.current!.count = i; waves.current!.instanceMatrix.needsUpdate = true; if (waves.current!.instanceColor) waves.current!.instanceColor.needsUpdate = true;
    // colour clouds
    let c = 0;
    for (const h of s.holis) for (let k = 0; k < 26 && c < 300; k++) {
      const a = k * 2.4, r = (2 + (k % 6) * 1.5) * Math.min(1, h.t * 2), life = 1 - h.t / h.life;
      tmpM.compose(tmpP.set(h.x + Math.cos(a + h.t * 0.3) * r, 1.5 + (k % 4) + h.t * 0.3, h.z + Math.sin(a + h.t * 0.3) * r), tmpQ.copy(st.camera.quaternion), tmpS.setScalar((3 + (k % 3) * 1.6) * life + 1));
      clouds.current!.setMatrixAt(c, tmpM); clouds.current!.setColorAt(c, tmpC.setHSL((k * 0.17 + h.id * 0.1) % 1, 0.95, 0.6).multiplyScalar(life)); c++;
    }
    clouds.current!.count = c; clouds.current!.instanceMatrix.needsUpdate = true; if (clouds.current!.instanceColor) clouds.current!.instanceColor.needsUpdate = true;
    // parties: speaker stacks, light beams, confetti
    const sp = speakers.current!;
    sp.children.forEach((ch, k) => {
      const p = s.parties[k];
      ch.visible = !!p;
      if (!p) return;
      ch.position.set(p.x, 0, p.z);
      const beat = Math.pow(Math.max(0, Math.sin(t * 8.5)), 8);
      ch.children[0]!.scale.setScalar(1 + beat * 0.08);
      ch.children[1]!.rotation.y = t * 1.6;
      (ch.children[2] as THREE.Mesh).scale.setScalar(1 + beat * 0.5);
      if (p.id > lastParty.current) { lastParty.current = p.id; burst(p.x, 3, p.z, 80, 12); }
      if (Math.random() < dt * 6) burst(p.x, 4, p.z, 3, 8);
    });
    // confetti
    const cf = confetti.current!;
    conf.current.forEach((p, k) => {
      if (p.y > -1) { p.vy -= 9 * dt; p.vx *= 0.99; p.vz *= 0.99; p.vy = Math.max(p.vy, -2.2); p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.r += dt * 6; if (p.y < 0.05) { p.y = 0.05; p.vy = 0; p.vx = 0; p.vz = 0; } }
      tmpM.compose(tmpP.set(p.x, p.y, p.z), tmpQ.setFromEuler(tmpE.set(p.r, p.r * 0.7, 0)), tmpS.setScalar(p.y > -1 ? 1 : 0));
      cf.setMatrixAt(k, tmpM); cf.setColorAt(k, CONF[p.c]!);
    });
    cf.instanceMatrix.needsUpdate = true; if (cf.instanceColor) cf.instanceColor.needsUpdate = true;
    // pizza boxes
    let pz = 0;
    for (const p of s.pizzas) for (let k = 0; k < 3; k++) { tmpM.compose(tmpP.set(p.x + (k - 1) * 0.9, 0.12 + k * 0.001, p.z + (k % 2) * 0.6), tmpQ.setFromAxisAngle(UP, k), tmpS.setScalar(1)); pizzas.current!.setMatrixAt(pz++, tmpM); }
    pizzas.current!.count = pz; pizzas.current!.instanceMatrix.needsUpdate = true;
    // the water cannon
    const cn = s.cannon, tr = truck.current!;
    tr.visible = cn.alive;
    if (cn.alive) { tr.position.set(cn.x, 0, cn.z); tr.rotation.y = cn.face; }
    let sp2 = 0;
    if (cn.alive && cn.spray > 0) for (let k = 0; k < 160; k++) {
      const u = ((t * 1.6 + k / 160) % 1), spread = (((k * 37) % 17) / 17 - 0.5) * 0.35;
      const dir = cn.face + spread, dist = u * 15;
      tmpM.compose(tmpP.set(cn.x + Math.sin(dir) * dist, 2.8 + Math.sin(u * Math.PI) * 2.5 - u * 2, cn.z + Math.cos(dir) * dist), tmpQ.identity(), tmpS.setScalar(0.5 + u * 0.8));
      spray.current!.setMatrixAt(sp2++, tmpM);
    }
    spray.current!.count = sp2; spray.current!.instanceMatrix.needsUpdate = true;
    // fireworks
    const F = fw.current;
    for (const f of s.fireworks) {
      const id = Math.round((f.x + f.z * 7) * 10) + Math.round(f.t < 0 ? f.t * 10 : 0);
      if (f.t > 0 && f.t < 0.1 && lastFw.current !== id) {
        lastFw.current = id;
        const hue = Math.random();
        for (let k = 0; k < 260; k++) {
          const j = F.i++ % 3000, th = Math.random() * Math.PI * 2, ph = Math.acos(Math.random() * 2 - 1), v = 9 + Math.random() * 5;
          F.pos.set([f.x, 26 + Math.random() * 4, f.z], j * 3); F.vel.set([Math.sin(ph) * Math.cos(th) * v, Math.cos(ph) * v, Math.sin(ph) * Math.sin(th) * v], j * 3);
          const col = new THREE.Color().setHSL((hue + Math.random() * 0.15) % 1, 1, 0.6); F.col.set([col.r * 3, col.g * 3, col.b * 3], j * 3); F.life[j] = 2.6;
        }
        burst(f.x, 6, f.z, 60, 10);
      }
    }
    for (let j = 0; j < 3000; j++) {
      if (F.life[j]! <= 0) { F.pos[j * 3 + 1] = -99; continue; }
      F.life[j]! -= dt;
      F.vel[j * 3 + 1]! -= 6 * dt;
      for (let q = 0; q < 3; q++) { F.vel[j * 3 + q]! *= 0.985; F.pos[j * 3 + q]! += F.vel[j * 3 + q]! * dt; }
    }
    const geo = fwPts.current!.geometry;
    (geo.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (geo.attributes.color as THREE.BufferAttribute).needsUpdate = true;
  });
  const fwGeo = useMemo(() => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(fw.current.pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(fw.current.col, 3)); return g; }, []);
  return (
    <group>
      <instancedMesh ref={waves} args={[new THREE.RingGeometry(0.9, 1, 64), new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }), 20]} frustumCulled={false} />
      <instancedMesh ref={clouds} args={[new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: puff, transparent: true, depthWrite: false, opacity: 0.42 }), 300]} frustumCulled={false} />
      <instancedMesh ref={confetti} args={[new THREE.PlaneGeometry(0.22, 0.12), new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, emissive: '#222', roughness: 0.5 }), 700]} frustumCulled={false} />
      <instancedMesh ref={pizzas} args={[new THREE.BoxGeometry(0.8, 0.1, 0.8), new THREE.MeshStandardMaterial({ color: '#f4e1b8' }), 60]} castShadow />
      <instancedMesh ref={spray} args={[new THREE.SphereGeometry(0.3, 8, 6), new THREE.MeshStandardMaterial({ color: '#cfefff', transparent: true, opacity: 0.55, roughness: 0.05 }), 200]} frustumCulled={false} />
      <points ref={fwPts} geometry={fwGeo} frustumCulled={false}><pointsMaterial size={0.5} vertexColors transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} /></points>
      <group ref={speakers}>
        {[0, 1, 2, 3].map((k) => (
          <group key={k} visible={false}>
            <group>
              <mesh position={[0, 1.4, 0]} castShadow><boxGeometry args={[1.8, 2.8, 1.4]} /><meshStandardMaterial color="#1b1b1f" roughness={0.4} /></mesh>
              <mesh position={[0, 1.9, 0.72]}><circleGeometry args={[0.55, 24]} /><meshStandardMaterial color="#333" emissive="#ff2e88" emissiveIntensity={0.8} /></mesh>
              <mesh position={[0, 0.8, 0.72]}><circleGeometry args={[0.4, 24]} /><meshStandardMaterial color="#333" emissive="#35b6ff" emissiveIntensity={0.8} /></mesh>
            </group>
            <group position={[0, 3, 0]}>
              {[0, 1, 2, 3].map((b) => (
                <mesh key={b} rotation={[0.5, (b * Math.PI) / 2, 0]} position={[Math.sin((b * Math.PI) / 2) * 3, 5, Math.cos((b * Math.PI) / 2) * 3]}>
                  <coneGeometry args={[1.4, 12, 16, 1, true]} />
                  <meshBasicMaterial color={['#ff2e88', '#35b6ff', '#e6ff3a', '#b46cff'][b]} transparent opacity={0.16} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} toneMapped={false} />
                </mesh>
              ))}
            </group>
            <mesh rotation-x={-Math.PI / 2} position={[0, 0.06, 0]}><ringGeometry args={[4, 5, 48]} /><meshBasicMaterial color="#ff2e88" transparent opacity={0.6} toneMapped={false} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>
          </group>
        ))}
      </group>
      <group ref={truck} visible={false}>
        <mesh position={[0, 1.4, 0]} castShadow><boxGeometry args={[2.4, 2.2, 6]} /><meshStandardMaterial color="#e8eef6" /></mesh>
        <mesh position={[0, 1.6, 0]}><boxGeometry args={[2.45, 0.4, 6.05]} /><meshStandardMaterial color="#1d3a78" /></mesh>
        <mesh position={[0, 2.8, 1.2]} rotation-x={Math.PI / 2}><cylinderGeometry args={[0.2, 0.25, 2.4, 10]} /><meshStandardMaterial color="#444" metalness={0.6} /></mesh>
        <mesh position={[0.6, 2.7, -2]}><boxGeometry args={[0.4, 0.2, 0.4]} /><meshStandardMaterial color="#35b6ff" emissive="#35b6ff" emissiveIntensity={2} /></mesh>
        <mesh position={[-0.6, 2.7, -2]}><boxGeometry args={[0.4, 0.2, 0.4]} /><meshStandardMaterial color="#ff3030" emissive="#ff3030" emissiveIntensity={2} /></mesh>
      </group>
      <Murals bridge={bridge} />
      <Chopper bridge={bridge} />
    </group>
  );
}

/** Murals: bold paintings that spread across a wall in a second and a half. */
const MURAL_STYLES = 8;
function drawMural(g: CanvasRenderingContext2D, style: number) {
  const W2 = 512, H2 = 384;
  const pal = [['#ff2e88', '#e6ff3a', '#35b6ff'], ['#b46cff', '#ffb03a', '#ffffff'], ['#34d6a8', '#ff5d3a', '#1b1b1f'], ['#35b6ff', '#ff2e88', '#ffe13a']][style % 4]!;
  g.fillStyle = pal[0]!; g.fillRect(0, 0, W2, H2);
  g.lineWidth = 18; g.lineCap = 'round';
  switch (style % MURAL_STYLES) {
    case 0: g.fillStyle = pal[1]!; g.beginPath(); g.moveTo(256, 330); g.bezierCurveTo(40, 190, 120, 40, 256, 130); g.bezierCurveTo(392, 40, 472, 190, 256, 330); g.fill(); break;
    case 1: g.fillStyle = pal[1]!; g.beginPath(); g.arc(256, 200, 90, 0, Math.PI * 2); g.fill(); g.strokeStyle = pal[1]!; for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2; g.beginPath(); g.moveTo(256 + Math.cos(a) * 115, 200 + Math.sin(a) * 115); g.lineTo(256 + Math.cos(a) * 170, 200 + Math.sin(a) * 170); g.stroke(); } break;
    case 2: g.fillStyle = pal[1]!; g.font = '120px Bungee, sans-serif'; g.textAlign = 'center'; g.fillText('LOUDER', 256, 230); break;
    case 3: for (let k = 0; k < 6; k++) { g.strokeStyle = ['#ff2e88', '#ffb03a', '#e6ff3a', '#34d6a8', '#35b6ff', '#b46cff'][k]!; g.lineWidth = 26; g.beginPath(); g.arc(256, 380, 300 - k * 30, Math.PI, 0); g.stroke(); } break;
    case 4: g.fillStyle = pal[1]!; g.beginPath(); g.arc(256, 190, 130, 0, Math.PI * 2); g.fill(); g.fillStyle = pal[2]!; g.beginPath(); g.arc(210, 160, 16, 0, 7); g.arc(302, 160, 16, 0, 7); g.fill(); g.strokeStyle = pal[2]!; g.beginPath(); g.arc(256, 200, 70, 0.2, Math.PI - 0.2); g.stroke(); break;
    case 5: g.fillStyle = pal[1]!; g.font = '96px Bungee, sans-serif'; g.textAlign = 'center'; g.fillText('OUR', 256, 170); g.fillText('STREETS', 256, 280); break;
    case 6: for (let k = 0; k < 7; k++) { g.fillStyle = [pal[1]!, pal[2]!][k % 2]!; g.beginPath(); g.arc(80 + k * 60, 190 + Math.sin(k) * 60, 50, 0, 7); g.fill(); } break;
    default: g.strokeStyle = pal[1]!; g.lineWidth = 30; g.beginPath(); g.arc(256, 190, 120, 0, Math.PI * 2); g.moveTo(256, 70); g.lineTo(256, 310); g.moveTo(256, 190); g.lineTo(170, 275); g.moveTo(256, 190); g.lineTo(342, 275); g.stroke();
  }
  g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 6; g.strokeRect(3, 3, W2 - 6, H2 - 6);
}
function Murals({ bridge }: { bridge: B }) {
  const texs = useMemo(() => Array.from({ length: MURAL_STYLES }, (_, k) => canvasTex(512, 384, (g) => drawMural(g, k))), []);
  const group = useRef<THREE.Group>(null);
  const made = useRef(new Set<number>());
  useFrame(() => {
    const s = bridge.current.sim;
    for (const m of s.murals) {
      if (made.current.has(m.id)) continue;
      made.current.add(m.id);
      const b = s.buildings.find((x) => x.id === m.b)!;
      const wide = m.nx !== 0 ? b.d : b.w;
      const w = Math.min(wide * 0.8, 9), h = Math.min(b.h * 0.6, w * 0.75);
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: texs[m.style % MURAL_STYLES], roughness: 0.8, emissive: '#ffffff', emissiveMap: texs[m.style % MURAL_STYLES], emissiveIntensity: 0.12 }));
      mesh.position.set(m.x, Math.max(h / 2 + 1, Math.min(b.h - h / 2 - 0.5, 4)), m.z);
      mesh.lookAt(m.x + m.nx, mesh.position.y, m.z + m.nz);
      mesh.userData.id = m.id; mesh.scale.set(0.01, 1, 1);
      group.current!.add(mesh);
    }
    group.current!.children.forEach((c) => { const m = s.murals.find((x) => x.id === c.userData.id); if (m) c.scale.x = Math.min(1, m.t / 1.5); });
  });
  return <group ref={group} />;
}

function Chopper({ bridge }: { bridge: B }) {
  const g = useRef<THREE.Group>(null), rotor = useRef<THREE.Mesh>(null), cone = useRef<THREE.Mesh>(null), spot = useRef<THREE.SpotLight>(null);
  useFrame((st) => {
    const s = bridge.current.sim, L = s.leader, t = st.clock.elapsedTime;
    const on = s.chopper > 0.05 && bridge.current.started;
    g.current!.visible = on;
    if (!on) return;
    const a = t * 0.25;
    g.current!.position.set(L.x + Math.sin(a) * 22, 32 + Math.sin(t) * 0.6, L.z + Math.cos(a) * 22);
    g.current!.lookAt(L.x, 32, L.z);
    rotor.current!.rotation.y = t * 30;
    const n = night(s.hour);
    spot.current!.intensity = 300 * n * s.chopper;
    spot.current!.target.position.set(L.x, 0, L.z); spot.current!.target.updateMatrixWorld();
    // the searchlight cone, pointed at the crowd
    const c = cone.current!;
    const from = g.current!.position, to = new THREE.Vector3(L.x, 0, L.z);
    c.position.copy(from).lerp(to, 0.5);
    c.lookAt(to); c.rotateX(Math.PI / 2);
    c.scale.set(1, from.distanceTo(to), 1);
    (c.material as THREE.MeshBasicMaterial).opacity = 0.05 + 0.18 * n;
  });
  return (
    <>
      <group ref={g}>
        <mesh castShadow><capsuleGeometry args={[1.1, 2.4, 4, 12]} /><meshStandardMaterial color="#f4f4f4" metalness={0.3} roughness={0.3} /></mesh>
        <mesh position={[0, 0, -3]} rotation-x={Math.PI / 2}><cylinderGeometry args={[0.2, 0.35, 3.4, 8]} /><meshStandardMaterial color="#ff2e88" /></mesh>
        <mesh ref={rotor} position={[0, 1.4, 0]}><boxGeometry args={[9, 0.08, 0.35]} /><meshStandardMaterial color="#222" /></mesh>
        <spotLight ref={spot} position={[0, -1, 0]} angle={0.25} penumbra={0.6} distance={80} color="#fff5dc" />
      </group>
      <mesh ref={cone} visible>
        <cylinderGeometry args={[0.4, 4, 1, 24, 1, true]} />
        <meshBasicMaterial color="#fff5dc" transparent opacity={0.1} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
    </>
  );
}

/* ───────────── the lens ───────────── */

function Post({ bridge }: { bridge: B }) {
  const bloom = useRef<{ intensity: number } | null>(null);
  useFrame(() => { if (bloom.current) bloom.current.intensity = 0.45 + night(bridge.current.sim.hour) * 0.55; });
  const low = bridge.current.low;
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      {low ? <></> : <N8AO aoRadius={3} intensity={2.2} distanceFalloff={0.6} halfRes quality="performance" />}
      <Bloom ref={bloom as never} mipmapBlur luminanceThreshold={0.9} luminanceSmoothing={0.15} intensity={0.45} />
      {low ? <></> : <TiltShift2 blur={0.09} taper={0.6} />}
      <Vignette offset={0.25} darkness={0.55} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
}

/* ───────────── all of it ───────────── */

export function Scene({ bridge }: { bridge: B }) {
  return (
    <>
      <Driver bridge={bridge} />
      <SkyRig bridge={bridge} />
      <Ground bridge={bridge} />
      <City bridge={bridge} />
      <Greenery bridge={bridge} />
      <Plazas bridge={bridge} />
      <Cars bridge={bridge} />
      <Crowd bridge={bridge} />
      <Leader bridge={bridge} />
      <Physics gravity={[0, -12, 0]} timeStep={1 / 60}>
        <Physical bridge={bridge} />
      </Physics>
      <FX bridge={bridge} />
      <Post bridge={bridge} />
    </>
  );
}
