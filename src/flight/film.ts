import { BloomEffect, ChromaticAberrationEffect, EffectComposer, EffectPass, NoiseEffect, RenderPass, SMAAEffect, VignetteEffect, BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { applyPose } from '../leap/hanuman';
import { buildRealHanuman, type RealRig } from './realRig';

/**
 * HANUMAN IN FLIGHT: a realistic, deterministic cinematic.
 *
 * Everything is a function of t (seconds), so the same frame comes out every
 * time: renderAt(t) poses Hanuman, moves the world, places the camera for the
 * shot, and renders through bloom, vignette and grain. The page plays it in
 * real time; a script renders it frame by frame to video.
 */

export const DURATION = 38;
export const SPEED = 46; // metres per second over the sea
export const SIZE = 2.2; // he has grown: a little over 4.5 m tall

export type Shot = { from: number; to: number; name: string; note: string };
export const SHOTS: Shot[] = [
  { from: 0, to: 6.5, name: 'Dawn', note: 'Low over the swell at sunrise; he comes in from the horizon and passes overhead.' },
  { from: 6.5, to: 13, name: 'Chase', note: 'Behind and below him, the sea racing underneath.' },
  { from: 13, to: 19.5, name: 'Into the sun', note: 'A tracking shot from the side, the sun behind him, clouds sliding past.' },
  { from: 19.5, to: 25.5, name: 'Face to face', note: 'Close, from in front: hair and sash whipping in the wind.' },
  { from: 25.5, to: 32, name: 'The ocean', note: 'The camera rises and circles to show how much water is left.' },
  { from: 32, to: DURATION, name: 'Lanka', note: 'A coastline on the horizon, and a glint of gold.' },
];

const smooth = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
function noise1(t: number, seed: number) { return Math.sin(t * 1.3 + seed) * 0.5 + Math.sin(t * 2.7 + seed * 1.7) * 0.3 + Math.sin(t * 5.1 + seed * 2.3) * 0.2; }

/* ───────── ocean ───────── */

const WAVES: [number, number, number, number][] = [
  // wavelength (m), direction (rad), steepness, amplitude (m)
  [96, -1.4, 0.22, 1.5], [61, -1.15, 0.24, 0.95], [37, -1.7, 0.28, 0.55], [23, -1.25, 0.3, 0.3],
  [14, -1.9, 0.3, 0.16], [9, -0.95, 0.32, 0.09], [6, -1.5, 0.3, 0.05], [4.1, -2.2, 0.28, 0.03],
];

function oceanMaterial(envMap: THREE.Texture) {
  const glsl = WAVES.map(([L, dir, Q, A], i) => `const vec4 W${i} = vec4(${(2 * Math.PI / L).toFixed(5)}, ${dir.toFixed(4)}, ${Q.toFixed(3)}, ${A.toFixed(3)});`).join('\n');
  return new THREE.ShaderMaterial({
    uniforms: {
      uT: { value: 0 }, uEnv: { value: envMap }, uSun: { value: new THREE.Vector3() }, uSunColor: { value: new THREE.Color('#ffe2b8') },
      uDeep: { value: new THREE.Color('#06394a') }, uScatter: { value: new THREE.Color('#12907f') }, uFog: { value: new THREE.Color('#d9c7b0') }, uFogDensity: { value: 0.00042 },
    },
    vertexShader: /* glsl */ `
      uniform float uT; varying vec3 vW; varying vec3 vN; varying float vCrest;
      ${glsl}
      void gerstner(vec4 W, vec2 p, inout vec3 off, inout vec3 tan, inout vec3 bin) {
        float k = W.x, c = sqrt(9.81 / k); vec2 d = vec2(cos(W.y), sin(W.y));
        float f = k * (dot(d, p) - c * uT), a = W.w, q = W.z;
        off += vec3(d.x * q * a * cos(f), a * sin(f), d.y * q * a * cos(f));
        tan += vec3(-d.x * d.x * q * a * k * sin(f), d.x * a * k * cos(f), -d.x * d.y * q * a * k * sin(f));
        bin += vec3(-d.x * d.y * q * a * k * sin(f), d.y * a * k * cos(f), -d.y * d.y * q * a * k * sin(f));
      }
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        vec3 off = vec3(0.0), tan = vec3(1.0, 0.0, 0.0), bin = vec3(0.0, 0.0, 1.0);
        gerstner(W0, w.xz, off, tan, bin); gerstner(W1, w.xz, off, tan, bin); gerstner(W2, w.xz, off, tan, bin); gerstner(W3, w.xz, off, tan, bin);
        gerstner(W4, w.xz, off, tan, bin); gerstner(W5, w.xz, off, tan, bin); gerstner(W6, w.xz, off, tan, bin); gerstner(W7, w.xz, off, tan, bin);
        w.xyz += off;
        vN = normalize(cross(bin, tan));
        vCrest = off.y;
        vW = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uT, uFogDensity; uniform samplerCube uEnv; uniform vec3 uSun, uSunColor, uDeep, uScatter, uFog;
      varying vec3 vW; varying vec3 vN; varying float vCrest;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float vnoise(vec2 p) { vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y); }
      vec2 grad(vec2 p) { float e = 0.06; return vec2(vnoise(p + vec2(e, 0)) - vnoise(p - vec2(e, 0)), vnoise(p + vec2(0, e)) - vnoise(p - vec2(0, e))) / (2.0 * e); }
      void main() {
        vec3 V = normalize(cameraPosition - vW);
        float dist = length(cameraPosition - vW);
        // small ripples on top of the swell, fading with distance
        float detail = exp(-dist * 0.004);
        vec2 g = grad(vW.xz * 0.12 + vec2(uT * 0.25, uT * 0.08)) * 0.6 + grad(vW.xz * 0.45 - vec2(uT * 0.5, -uT * 0.2)) * 0.25;
        vec3 N = normalize(vN + vec3(-g.x, 0.0, -g.y) * 0.09 * detail);
        vec3 L = normalize(uSun);
        float fres = 0.02 + 0.98 * pow(1.0 - max(dot(N, V), 0.0), 5.0);
        vec3 R = reflect(-V, N); R.y = abs(R.y);
        vec3 sky = textureCube(uEnv, R).rgb;
        // light scattered through thin crests toward the viewer
        float sss = pow(max(dot(V, -L), 0.0), 3.0) * max(vCrest, 0.0) * 0.6 + max(vCrest, 0.0) * 0.08;
        vec3 water = uDeep * (0.35 + 0.65 * max(dot(N, L), 0.0)) + uScatter * sss;
        vec3 c = mix(water, sky, fres);
        // sun glitter: a sharp specular lobe on the facets
        vec3 H = normalize(L + V);
        float spec = pow(max(dot(N, H), 0.0), 1400.0) * 14.0 + pow(max(dot(N, H), 0.0), 160.0) * 0.25;
        c += uSunColor * spec;
        // foam where crests break, broken up by noise
        float foam = smoothstep(2.3, 3.1, vCrest + vnoise(vW.xz * 0.25) * 0.8) * (0.55 + 0.45 * vnoise(vW.xz * 1.7 + uT));
        c = mix(c, vec3(0.92, 0.93, 0.9) * (0.6 + 0.4 * max(dot(N, L), 0.0)), foam * 0.8);
        // aerial perspective toward the horizon
        float fogF = 1.0 - exp(-dist * uFogDensity);
        vec3 hz = textureCube(uEnv, normalize(vec3(-V.x, 0.035, -V.z))).rgb;
        c = mix(c, hz, fogF);
        gl_FragColor = vec4(c, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
}

/** A plane whose vertices crowd toward the middle, so detail sits near the camera. */
function oceanGeometry(size: number, n: number) {
  const g = new THREE.PlaneGeometry(2, 2, n, n);
  g.rotateX(-Math.PI / 2);
  const p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i);
    const f = (v: number) => Math.sign(v) * Math.pow(Math.abs(v), 2.2) * size;
    p.setXYZ(i, f(x), 0, f(z));
  }
  return g;
}

/* ───────── clouds ───────── */

function cloudTexture(seed: number) {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const x = c.getContext('2d')!;
  let s = seed;
  const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  for (let i = 0; i < 70; i++) {
    const cx = 128 + (r() - 0.5) * 150, cy = 140 + (r() - 0.5) * 60 - Math.abs(r() - 0.5) * 40, rad = 22 + r() * 46;
    const g = x.createRadialGradient(cx, cy, 0, cx, cy, rad);
    const shade = 255;
    g.addColorStop(0, `rgba(${shade},${shade},${shade},0.32)`); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, 256, 256);
  }
  // a flatter, darker base
  const b = x.createLinearGradient(0, 120, 0, 220); b.addColorStop(0, 'rgba(0,0,0,0)'); b.addColorStop(1, 'rgba(60,70,90,0.35)');
  x.globalCompositeOperation = 'source-atop'; x.fillStyle = b; x.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ───────── the film ───────── */

export class FlightFilm {
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(42, 16 / 9, 0.1, 20000);
  composer: EffectComposer;
  rig: RealRig;
  holder = new THREE.Group();
  sunDir = new THREE.Vector3();
  sunLight: THREE.DirectionalLight;
  ocean: THREE.Mesh;
  oceanMat: THREE.ShaderMaterial;
  clouds: THREE.Sprite[] = [];
  spray: THREE.Points;
  lanka: THREE.Group;
  freeCam = false;
  quality: 'high' | 'low';

  constructor(canvas: HTMLCanvasElement, quality: 'high' | 'low' = 'high') {
    this.quality = quality;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.58;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = quality === 'high';
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // sky: physical (Preetham) scattering with a low golden sun ahead and to the left
    const sky = new Sky();
    sky.scale.setScalar(15000);
    const su = sky.material.uniforms;
    su.turbidity.value = 7; su.rayleigh.value = 1.6; su.mieCoefficient.value = 0.006; su.mieDirectionalG.value = 0.86;
    // low sun from his left and a little behind: it models the body instead of burning out the frame
    this.sunDir.set(-0.86, 0.15, 0.3).normalize();
    su.sunPosition.value.copy(this.sunDir);
    this.scene.add(sky);

    // environment light from the sky, and a cube of it for the sea to reflect
    const pm = new THREE.PMREMGenerator(this.renderer);
    const skyScene = new THREE.Scene(); skyScene.add(sky.clone());
    this.scene.environment = pm.fromScene(skyScene as unknown as THREE.Scene, 0, 0.1, 30000).texture;
    const cubeRT = new THREE.WebGLCubeRenderTarget(256, { type: THREE.HalfFloatType });
    const cubeCam = new THREE.CubeCamera(1, 30000, cubeRT);
    cubeCam.update(this.renderer, skyScene);

    this.scene.fog = new THREE.FogExp2('#bfcad2', 0.00042);

    this.sunLight = new THREE.DirectionalLight('#ffd9a8', 4.2);
    this.sunLight.position.copy(this.sunDir).multiplyScalar(100);
    this.sunLight.castShadow = quality === 'high';
    this.sunLight.shadow.mapSize.set(2048, 2048);
    const sc = this.sunLight.shadow.camera; sc.left = -6; sc.right = 6; sc.top = 6; sc.bottom = -6; sc.near = 1; sc.far = 300;
    this.sunLight.shadow.bias = -0.0004; this.sunLight.shadow.normalBias = 0.02;
    this.scene.add(this.sunLight, this.sunLight.target);
    this.scene.add(new THREE.HemisphereLight('#bcd4f0', '#0d5560', 0.55));

    // the sea
    this.oceanMat = oceanMaterial(cubeRT.texture);
    this.oceanMat.uniforms.uSun.value.copy(this.sunDir);
    this.ocean = new THREE.Mesh(oceanGeometry(9000, quality === 'high' ? 420 : 220), this.oceanMat);
    this.ocean.frustumCulled = false;
    this.scene.add(this.ocean);

    // Hanuman
    this.rig = buildRealHanuman({ fur: quality === 'high' ? 8 : 0 });
    this.holder.add(this.rig.root);
    this.holder.scale.setScalar(SIZE);
    this.scene.add(this.holder);

    // clouds: cumulus built from many soft puffs, lit warm on the sun side and
    // cool underneath, a few near enough to fly past
    const texes = [cloudTexture(3), cloudTexture(17), cloudTexture(41), cloudTexture(77)];
    let s = 99; const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    const sunFlat = new THREE.Vector3(this.sunDir.x, 0, this.sunDir.z).normalize();
    const lit = new THREE.Color('#ffe2bf'), shade = new THREE.Color('#8f9bb0'), base = new THREE.Color('#6f7486');
    for (let c = 0; c < 46; c++) {
      const near = c < 10;
      const cz = 300 - r() * (SPEED * DURATION + 2400), cx = near ? (r() < 0.5 ? -1 : 1) * (45 + r() * 90) : (r() - 0.5) * 4200;
      const cy = near ? 40 + r() * 50 : 220 + r() * 480, size = near ? 26 + r() * 22 : 120 + r() * 260;
      const puffs = near ? 14 : 22;
      for (let i = 0; i < puffs; i++) {
        const ox = (r() - 0.5) * size * 2.6, oz = (r() - 0.5) * size * 1.4, up = r() * r();
        const oy = up * size * 1.1 - size * 0.15;
        const toSun = (ox * sunFlat.x + oz * sunFlat.z) / (size * 1.3);
        const col = shade.clone().lerp(lit, Math.min(1, Math.max(0, 0.45 + toSun * 0.5 + up * 0.6))).lerp(base, Math.max(0, -oy / size) * 0.8);
        const mat = new THREE.SpriteMaterial({ map: texes[(c + i) % 4], transparent: true, depthWrite: false, fog: true, color: col, opacity: near ? 0.55 : 0.8 });
        const sp = new THREE.Sprite(mat);
        const w = size * (0.8 + r() * 0.9);
        sp.position.set(cx + ox, cy + oy, cz + oz); sp.scale.set(w, w * 0.7, 1);
        sp.material.rotation = (r() - 0.5) * 0.6;
        this.clouds.push(sp); this.scene.add(sp);
      }
    }

    // wind-borne spray and haze specks around the camera, to feel the speed
    {
      const n = 1400, pos = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { pos[i * 3] = (r() - 0.5) * 60; pos[i * 3 + 1] = (r() - 0.5) * 30; pos[i * 3 + 2] = (r() - 0.5) * 120; }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const c = document.createElement('canvas'); c.width = c.height = 32; const x = c.getContext('2d')!; const gr = x.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,250,240,1)'); gr.addColorStop(1, 'rgba(255,250,240,0)'); x.fillStyle = gr; x.fillRect(0, 0, 32, 32);
      this.spray = new THREE.Points(g, new THREE.PointsMaterial({ size: 0.18, map: new THREE.CanvasTexture(c), transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending }));
      this.spray.frustumCulled = false;
      this.scene.add(this.spray);
    }

    // Lanka: a long, hazy coastline of ridges far ahead, with a glint of gold, seen only at the end
    this.lanka = new THREE.Group();
    {
      const land = new THREE.MeshStandardMaterial({ color: '#3d5048', roughness: 1 });
      const gold = new THREE.MeshStandardMaterial({ color: '#f0c060', emissive: '#ffcf6a', emissiveIntensity: 3, metalness: 1, roughness: 0.2 });
      let q = 7; const rr = () => { q = (q * 16807) % 2147483647; return q / 2147483647; };
      for (let i = 0; i < 9; i++) {
        const w = 500 + rr() * 900, h = 90 + rr() * 220;
        const g = new THREE.SphereGeometry(1, 48, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const p = g.attributes.position as THREE.BufferAttribute;
        for (let k = 0; k < p.count; k++) { const x = p.getX(k), z = p.getZ(k); p.setY(k, p.getY(k) * (1 + 0.25 * Math.sin(x * 9 + i) * Math.cos(z * 7))); }
        g.computeVertexNormals();
        const m = new THREE.Mesh(g, land); m.scale.set(w, h, w * 0.35); m.position.set((i - 4) * 520 + rr() * 200, -4, rr() * 300); this.lanka.add(m);
      }
      for (let i = 0; i < 46; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(5 + (i % 4) * 2.5, 10, 8), gold); m.position.set(-420 + (i * 137) % 840, 25 + (i * 53) % 110, 330 + (i % 7) * 10); this.lanka.add(m); }
      this.lanka.position.set(-200, 0, -(SPEED * DURATION) - 2600);
      this.scene.add(this.lanka);
    }

    // post: bloom on the glitter and gold, a little lens character, vignette and grain
    this.composer = new EffectComposer(this.renderer, { frameBufferType: THREE.HalfFloatType, multisampling: quality === 'high' ? 4 : 0 });
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    const bloom = new BloomEffect({ intensity: 0.38, luminanceThreshold: 0.95, luminanceSmoothing: 0.08, mipmapBlur: true, radius: 0.6 });
    const vig = new VignetteEffect({ offset: 0.32, darkness: 0.55 });
    const grain = new NoiseEffect({ blendFunction: BlendFunction.OVERLAY, premultiply: false });
    grain.blendMode.opacity.value = 0.05;
    const ca = new ChromaticAberrationEffect({ offset: new THREE.Vector2(0.0006, 0.0004), radialModulation: true, modulationOffset: 0.4 });
    this.composer.addPass(new EffectPass(this.camera, bloom, vig, grain));
    void ca;
    if (quality === 'high') this.composer.addPass(new EffectPass(this.camera, new SMAAEffect()));
  }

  setSize(w: number, h: number, dpr = 1) {
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h, false);
    this.composer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  /** Hanuman's position at time t: straight down -Z, with a gentle weave. */
  path(t: number) {
    const z = -SPEED * t;
    const x = noise1(t * 0.22, 1) * 9 + Math.sin(t * 0.17) * 6;
    // he comes in low over the water in the dawn shot, then climbs
    const y = lerp(11, 34, smooth(clamp01((t - 3) / 9))) + noise1(t * 0.3, 4) * 2.2 + (t > 25 ? (t - 25) * 0.8 : 0);
    return new THREE.Vector3(x, y, z);
  }

  shotAt(t: number) { return SHOTS.find((s) => t >= s.from && t < s.to) ?? SHOTS[SHOTS.length - 1]; }

  renderAt(t: number) {
    t = Math.max(0, Math.min(DURATION - 1e-3, t));
    const P = this.path(t), Pn = this.path(t + 0.25);
    const vel = Pn.clone().sub(P).multiplyScalar(4);
    const bank = THREE.MathUtils.clamp(-(vel.x) * 0.045, -0.5, 0.5) + noise1(t * 0.5, 7) * 0.04;
    const pitch = THREE.MathUtils.clamp(vel.y * 0.02, -0.2, 0.25);

    // pose: the flying pose, with a little turbulence and more effort when climbing
    applyPose(this.rig, { t: t * 1.15, pose: 'fly', boost: 0.55 + Math.max(0, pitch) * 2, bank });
    this.rig.j.chest.rotation.z += noise1(t * 0.8, 11) * 0.03;
    this.rig.j.head.rotation.y += noise1(t * 0.35, 12) * 0.12;
    this.holder.position.copy(P);
    this.holder.rotation.set(-pitch, Math.PI, bank, 'YXZ');

    // sun shadow follows him
    this.sunLight.position.copy(P).addScaledVector(this.sunDir, 120);
    this.sunLight.target.position.copy(P);

    this.lanka.visible = t > 30.5 || this.freeCam;
    // camera
    if (!this.freeCam) this.placeCamera(t, P);

    // the sea follows the camera; waves are in world space so they don't slide
    const cp = this.camera.position;
    this.ocean.position.set(Math.round(cp.x / 50) * 50, 0, Math.round(cp.z / 50) * 50);
    this.oceanMat.uniforms.uT.value = t;

    // spray specks wrap around the camera and stream past
    const sp = this.spray.geometry.attributes.position as THREE.BufferAttribute;
    const local = this.spray.position.set(cp.x, cp.y, cp.z);
    for (let i = 0; i < sp.count; i++) {
      const base = (i * 9301 + 49297) % 233280 / 233280;
      let z = ((base * 120 + t * SPEED * 0.9) % 120) - 60;
      if (z < -60) z += 120;
      sp.setZ(i, z);
    }
    sp.needsUpdate = true;
    void local;
    (this.spray.material as THREE.PointsMaterial).opacity = THREE.MathUtils.clamp(0.45 - (cp.y - 10) * 0.004, 0.08, 0.45);

    this.composer.render();
  }

  placeCamera(t: number, P: THREE.Vector3) {
    const shot = this.shotAt(t), k = (t - shot.from) / (shot.to - shot.from), S = SIZE;
    const cam = this.camera, look = new THREE.Vector3();
    switch (shot.name) {
      case 'Dawn': {
        // fixed low camera; he approaches from far ahead and passes overhead
        const at = this.path(6.2);
        cam.position.set(at.x + 7, 2.6 + Math.sin(t * 0.9) * 0.25, at.z - 10);
        look.copy(P).add(new THREE.Vector3(0, 0.6 * S, 0));
        cam.fov = 38;
        break;
      }
      case 'Chase': {
        const off = new THREE.Vector3(lerp(3, -2, smooth(k)), lerp(-1.0, 1.5, smooth(k)) * S, 5.6 * S);
        cam.position.copy(P).add(off);
        look.copy(P).add(new THREE.Vector3(0, 0.8 * S, -6 * S));
        cam.fov = 44;
        break;
      }
      case 'Into the sun': {
        const off = new THREE.Vector3(-8.5 * S, 0.6 * S + Math.sin(k * 3) * 0.6, lerp(-2.5, 3.5, k) * S);
        cam.position.copy(P).add(off);
        look.copy(P).add(new THREE.Vector3(0, 0.3 * S, -1.5 * S));
        cam.fov = 34;
        break;
      }
      case 'Face to face': {
        const off = new THREE.Vector3(lerp(-1.2, 1.4, smooth(k)) * S, 1.25 * S, -lerp(3.6, 2.6, smooth(k)) * S);
        cam.position.copy(P).add(off);
        look.copy(P).add(new THREE.Vector3(0, 1.0 * S, 0.6 * S));
        cam.fov = 30;
        break;
      }
      case 'The ocean': {
        const a = lerp(-0.6, 2.0, smooth(k)), rad = lerp(6, 11, smooth(k)) * S, h = lerp(1, 5, smooth(k)) * S;
        cam.position.copy(P).add(new THREE.Vector3(Math.sin(a) * rad, h, Math.cos(a) * rad));
        look.copy(P).add(new THREE.Vector3(0, 0.5 * S, 0));
        cam.fov = 40;
        break;
      }
      default: {
        // behind, high: the coast ahead
        const off = new THREE.Vector3(2.5 * S, lerp(2.6, 2.0, k) * S, lerp(7, 9.5, k) * S);
        cam.position.copy(P).add(off);
        look.copy(P).lerp(new THREE.Vector3(this.lanka.position.x, 60, this.lanka.position.z), 0.04 + 0.03 * k);
        cam.fov = 38;
      }
    }
    // a hand-held breath
    cam.position.x += noise1(t * 0.9, 21) * 0.06 * S;
    cam.position.y = Math.max(1.5, cam.position.y + noise1(t * 1.1, 22) * 0.05 * S);
    cam.lookAt(look);
    cam.updateProjectionMatrix();
  }

  dispose() { this.renderer.dispose(); this.composer.dispose(); }
}
