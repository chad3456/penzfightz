import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { CROSSING_AT, DISTRICT, districtAt, ORDER, Road, type DistrictId } from './path';
import { buildChunk, CHUNK, disposeChunk, hash, mulberry, signAtlas, type ChunkMats } from './build';
import { Girl, toonGradient } from './girl';

/**
 * 風と自転車 — the world.
 *
 * A girl rides an endless road through a Japanese town, from the sea to the
 * city to the rice fields and round again, through a whole day and night.
 *
 * The look is a painted one: toon shading in four flat steps, painted
 * cumulus in the sky, a ring of painted hills on the horizon, and at the end
 * a Kuwahara filter — which smooths within regions and keeps the edges
 * between them, so that everything comes out looking laid down with a brush
 * — and a grade towards the saturated summer colours of a certain kind of
 * Japanese animated film. At night the windows, lanterns, signs and vending
 * machines come on, and the bloom pass lets them glow.
 */

export type CamMode = 'chase' | 'side' | 'front' | 'crane' | 'auto';

interface Key {
  t: number;
  top: string;
  hor: string;
  sun: string;
  sunI: number;
  hemiS: string;
  hemiG: string;
  hemiI: number;
  fog: string;
  cloud: string;
  night: number;
}
/** The day, as a set of keys round the clock (0 is midnight, 0.5 noon). */
const KEYS: Key[] = [
  { t: 0.0, top: '#040920', hor: '#18224c', sun: '#8090c8', sunI: 0.35, hemiS: '#34467a', hemiG: '#161a26', hemiI: 0.7, fog: '#141c3c', cloud: '#3a4470', night: 1 },
  { t: 0.2, top: '#081030', hor: '#26285a', sun: '#8a8ac0', sunI: 0.3, hemiS: '#3a4480', hemiG: '#1a1a28', hemiI: 0.7, fog: '#1e2248', cloud: '#4a4a7a', night: 1 },
  { t: 0.245, top: '#34448a', hor: '#f29a86', sun: '#ffa870', sunI: 1.1, hemiS: '#8a90c8', hemiG: '#5a4a48', hemiI: 0.8, fog: '#c898a0', cloud: '#ffc2b0', night: 0.55 },
  { t: 0.3, top: '#4a88e2', hor: '#ffd9b8', sun: '#fff0d8', sunI: 2.3, hemiS: '#a8c8f2', hemiG: '#6a7a52', hemiI: 1.0, fog: '#d8e2ee', cloud: '#ffffff', night: 0 },
  { t: 0.5, top: '#2674e6', hor: '#b8dcff', sun: '#fffaf0', sunI: 2.9, hemiS: '#bcdcff', hemiG: '#7a8a5a', hemiI: 1.1, fog: '#c6dcf2', cloud: '#ffffff', night: 0 },
  { t: 0.68, top: '#3470d2', hor: '#ffe2bc', sun: '#fff0d2', sunI: 2.5, hemiS: '#b8ccf0', hemiG: '#7a7a52', hemiI: 1.0, fog: '#e4dcd4', cloud: '#fff8ee', night: 0 },
  { t: 0.745, top: '#4658a8', hor: '#ffae6a', sun: '#ffac5c', sunI: 1.9, hemiS: '#c4a2c4', hemiG: '#6a5040', hemiI: 0.9, fog: '#f0b88e', cloud: '#ffd0a0', night: 0.1 },
  { t: 0.775, top: '#383a82', hor: '#ff785a', sun: '#ff7648', sunI: 1.0, hemiS: '#a282b4', hemiG: '#503044', hemiI: 0.78, fog: '#d8887e', cloud: '#ff9a8c', night: 0.5 },
  { t: 0.81, top: '#1a2062', hor: '#7a5a9c', sun: '#8a70b0', sunI: 0.45, hemiS: '#5a5aa0', hemiG: '#2a2034', hemiI: 0.7, fog: '#4a4274', cloud: '#8a7aac', night: 0.88 },
  { t: 0.86, top: '#0a1238', hor: '#26306c', sun: '#8090c8', sunI: 0.35, hemiS: '#3a4a82', hemiG: '#1a1c28', hemiI: 0.7, fog: '#1a2248', cloud: '#40497a', night: 1 },
];
const CA = new THREE.Color();
const CB = new THREE.Color();
function sampleKeys(t: number) {
  t = ((t % 1) + 1) % 1;
  let i = KEYS.length - 1;
  for (let k = 0; k < KEYS.length; k++) if (KEYS[k]!.t <= t) i = k;
  const a = KEYS[i]!;
  const b = KEYS[(i + 1) % KEYS.length]!;
  const span = ((b.t - a.t + 1) % 1) || 1;
  const u = (((t - a.t + 1) % 1) / span);
  const k = u * u * (3 - 2 * u);
  const col = (x: string, y: string) => new THREE.Color().copy(CA.set(x)).lerp(CB.set(y), k);
  return {
    top: col(a.top, b.top), hor: col(a.hor, b.hor), sun: col(a.sun, b.sun), sunI: a.sunI + (b.sunI - a.sunI) * k,
    hemiS: col(a.hemiS, b.hemiS), hemiG: col(a.hemiG, b.hemiG), hemiI: a.hemiI + (b.hemiI - a.hemiI) * k,
    fog: col(a.fog, b.fog), cloud: col(a.cloud, b.cloud), night: a.night + (b.night - a.night) * k,
  };
}

/* ── painted textures ─────────────────────────────────────────────────── */

function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d')!);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** A summer cumulus, painted: white heads, lilac bellies, a hard lit edge. */
function cloudTex(seed: number) {
  return canvasTex(512, 320, (g) => {
    const r = mulberry(seed);
    const puffs: [number, number, number][] = [];
    const n = 14 + Math.floor(r() * 8);
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1);
      const dome = Math.sin(u * Math.PI);
      const rad = 40 + dome * 70 * (0.6 + r() * 0.6);
      puffs.push([60 + u * 392 + (r() - 0.5) * 30, 270 - rad * 0.7 - dome * 90 * r(), rad]);
    }
    for (let i = 0; i < 8; i++) puffs.push([150 + r() * 210, 120 + r() * 80, 45 + r() * 45]);
    // the belly first, then the lit heads over it
    for (const [x, y, rad] of puffs) {
      const gr = g.createRadialGradient(x, y + rad * 0.3, rad * 0.2, x, y, rad);
      gr.addColorStop(0, 'rgba(196,190,222,1)');
      gr.addColorStop(1, 'rgba(176,170,210,1)');
      g.fillStyle = gr;
      g.beginPath();
      g.arc(x, y, rad, 0, Math.PI * 2);
      g.fill();
    }
    for (const [x, y, rad] of puffs) {
      const gr = g.createRadialGradient(x - rad * 0.2, y - rad * 0.35, 0, x, y - rad * 0.2, rad * 0.95);
      gr.addColorStop(0, 'rgba(255,255,255,1)');
      gr.addColorStop(0.6, 'rgba(250,250,255,0.85)');
      gr.addColorStop(1, 'rgba(240,240,252,0)');
      g.fillStyle = gr;
      g.beginPath();
      g.arc(x, y - rad * 0.15, rad * 0.9, 0, Math.PI * 2);
      g.fill();
    }
    g.globalCompositeOperation = 'destination-in';
    const fade = g.createLinearGradient(0, 250, 0, 320);
    fade.addColorStop(0, 'rgba(0,0,0,1)');
    fade.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = fade;
    g.fillRect(0, 0, 512, 320);
  });
}

/** Hills and mountains all the way round the horizon, in three painted ranges. */
function hillsTex() {
  return canvasTex(4096, 512, (g) => {
    const ranges: [string, number, number, number][] = [['#8aa0c8', 150, 160, 1], ['#6a8ab0', 250, 110, 2], ['#4a6a7a', 330, 70, 3]];
    for (const [col, base, amp, seed] of ranges) {
      g.fillStyle = col;
      g.beginPath();
      g.moveTo(0, 512);
      for (let x = 0; x <= 4096; x += 8) {
        const u = (x / 4096) * Math.PI * 2;
        const y = base - amp * (0.5 + 0.3 * Math.sin(u * 3 + seed) + 0.15 * Math.sin(u * 7 + seed * 2) + 0.08 * Math.sin(u * 17 + seed));
        g.lineTo(x, y);
      }
      g.lineTo(4096, 512);
      g.fill();
    }
    // a mountain with snow on it, off to one side, because there always is one
    const mx = 1300;
    g.fillStyle = '#7c90b8';
    g.beginPath();
    g.moveTo(mx - 700, 330);
    g.quadraticCurveTo(mx - 120, 40, mx, 30);
    g.quadraticCurveTo(mx + 120, 40, mx + 700, 330);
    g.fill();
    g.fillStyle = '#f2f4fa';
    g.beginPath();
    g.moveTo(mx - 150, 95);
    g.quadraticCurveTo(mx - 50, 36, mx, 30);
    g.quadraticCurveTo(mx + 50, 36, mx + 150, 95);
    for (let k = 0; k < 6; k++) g.lineTo(mx + 150 - k * 60, 95 + (k % 2 ? 25 : 5));
    g.fill();
  });
}

function dotTex(soft: boolean) {
  return canvasTex(64, 64, (g) => {
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 30);
    gr.addColorStop(0, 'rgba(255,255,255,1)');
    gr.addColorStop(soft ? 0.25 : 0.7, 'rgba(255,255,255,0.9)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr;
    if (soft) g.fillRect(0, 0, 64, 64);
    else {
      g.beginPath();
      g.ellipse(32, 32, 28, 16, 0.5, 0, Math.PI * 2);
      g.fill();
    }
  });
}

/* ── the painted look: Kuwahara, then a grade ────────────────────────── */

const PaintShader = {
  uniforms: {
    tDiffuse: { value: null },
    uRes: { value: new THREE.Vector2(1, 1) },
    uPaint: { value: 1 },
    uSat: { value: 1.18 },
    uNight: { value: 0 },
  },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform vec2 uRes; uniform float uPaint; uniform float uSat; uniform float uNight;
    varying vec2 vUv;
    #define R 3
    void main(){
      vec2 px = 1.0 / uRes;
      vec3 col = texture2D(tDiffuse, vUv).rgb;
      if (uPaint > 0.5) {
        vec3 m0 = vec3(0.0), m1 = vec3(0.0), m2 = vec3(0.0), m3 = vec3(0.0);
        vec3 s0 = vec3(0.0), s1 = vec3(0.0), s2 = vec3(0.0), s3 = vec3(0.0);
        for (int j = 0; j <= R; j++) {
          for (int i = 0; i <= R; i++) {
            vec3 a = texture2D(tDiffuse, vUv + vec2(-i, -j) * px).rgb; m0 += a; s0 += a * a;
            vec3 b = texture2D(tDiffuse, vUv + vec2( i, -j) * px).rgb; m1 += b; s1 += b * b;
            vec3 c = texture2D(tDiffuse, vUv + vec2(-i,  j) * px).rgb; m2 += c; s2 += c * c;
            vec3 d = texture2D(tDiffuse, vUv + vec2( i,  j) * px).rgb; m3 += d; s3 += d * d;
          }
        }
        float n = float((R + 1) * (R + 1));
        m0 /= n; m1 /= n; m2 /= n; m3 /= n;
        float v0 = dot(abs(s0 / n - m0 * m0), vec3(1.0));
        float v1 = dot(abs(s1 / n - m1 * m1), vec3(1.0));
        float v2 = dot(abs(s2 / n - m2 * m2), vec3(1.0));
        float v3 = dot(abs(s3 / n - m3 * m3), vec3(1.0));
        float best = v0; col = m0;
        if (v1 < best) { best = v1; col = m1; }
        if (v2 < best) { best = v2; col = m2; }
        if (v3 < best) { best = v3; col = m3; }
      }
      float l = dot(col, vec3(0.299, 0.587, 0.114));
      col = mix(vec3(l), col, uSat);
      // lift the shadows towards violet, as painted skies do to everything under them
      col += vec3(0.025, 0.012, 0.04) * (1.0 - l) * (1.0 - uNight * 0.5);
      vec2 q = vUv - 0.5;
      col *= 1.0 - dot(q, q) * (0.55 + uNight * 0.4);
      float g = fract(sin(dot(vUv * uRes, vec2(12.9898, 78.233))) * 43758.5453);
      col *= 0.985 + 0.03 * g;
      gl_FragColor = vec4(col, 1.0);
    }`,
};

/* ── the world ───────────────────────────────────────────────────────── */

export class World {
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(55, 1, 0.2, 5000);
  composer: EffectComposer;
  bloom: UnrealBloomPass;
  paint: ShaderPass;
  low: boolean;
  road = new Road();
  girl = new Girl();
  private carrier = new THREE.Group();

  // state
  s = 20;
  speed = 0;
  cruise = 7;
  paused = false;
  tod = 0.3;
  dayLength = 300;
  autoTime = true;
  mode: CamMode = 'auto';
  camYaw = 0;
  camPitch = 0;
  dragging = false;
  night = 0;
  district: DistrictId = 'sea';
  crossing = { active: false, bell: 0, dist: 999 };

  private sun = new THREE.DirectionalLight('#ffffff', 2);
  private hemi = new THREE.HemisphereLight('#bcdcff', '#7a8a5a', 1);
  private sky!: THREE.Mesh;
  private skyU!: Record<string, THREE.IUniform>;
  private clouds = new THREE.Group();
  private hills!: THREE.Mesh;
  private sea!: THREE.Mesh;
  private land!: THREE.Mesh;
  private chunks = new Map<number, THREE.Group>();
  private mats: ChunkMats;
  private glowMat: THREE.MeshBasicMaterial;
  private paperMat: THREE.MeshBasicMaterial;
  private signMat: THREE.MeshBasicMaterial;
  private towerU = { uNight: { value: 0 } };
  private petals!: THREE.Points;
  private flies!: THREE.Points;
  private train = new THREE.Group();
  private gates: { arm: THREE.Group; lights: THREE.Mesh[] }[] = [];
  private gateGroup = new THREE.Group();
  private trainT0 = -1;
  private trainFor = -1;
  private camPos = new THREE.Vector3();
  private camLook = new THREE.Vector3();
  private autoClock = 0;
  private last = performance.now() / 1000;
  private t = 0;

  constructor(canvas: HTMLCanvasElement, opts: { quality: 'high' | 'low' }) {
    this.low = opts.quality === 'low';
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(this.low ? 1 : 1.25, window.devicePixelRatio || 1));
    // neutral, not filmic: filmic tone mapping greys out exactly the saturated colours this is about
    this.renderer.toneMapping = THREE.NeutralToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = !this.low;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;

    this.scene.fog = new THREE.Fog('#c6dcf2', 160, 1100);
    this.scene.add(this.sun, this.sun.target, this.hemi);
    this.sun.castShadow = !this.low;
    this.sun.shadow.mapSize.set(1024, 1024);
    const sc = this.sun.shadow.camera;
    sc.left = -14; sc.right = 14; sc.top = 14; sc.bottom = -14; sc.near = 1; sc.far = 120;
    this.sun.shadow.bias = -0.0015;

    const grad = toonGradient();
    this.glowMat = new THREE.MeshBasicMaterial({ vertexColors: true });
    this.paperMat = new THREE.MeshBasicMaterial({ vertexColors: true });
    this.signMat = new THREE.MeshBasicMaterial({ map: signAtlas(), vertexColors: true, side: THREE.DoubleSide });
    const towers = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: grad });
    this.windowShader(towers);
    this.mats = {
      toon: new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: grad, side: THREE.DoubleSide }),
      glow: this.glowMat,
      paper: this.paperMat,
      signs: this.signMat,
      wires: new THREE.LineBasicMaterial({ color: '#2a2a30' }),
      towers,
      water: new THREE.MeshPhongMaterial({ color: '#3a6aa0' }),
    };

    this.buildSky();
    this.buildGround();
    this.buildParticles();
    this.buildTrain();
    this.carrier.add(this.girl.root);
    this.scene.add(this.carrier);
    this.girl.root.traverse((o) => { if ((o as THREE.Mesh).isMesh) (o as THREE.Mesh).castShadow = !this.low; });

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.3, 0.35, 0.95);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());
    this.paint = new ShaderPass(PaintShader);
    this.paint.uniforms.uPaint!.value = this.low ? 0 : 1;
    this.composer.addPass(this.paint);

    // start the camera where it will be, rather than flying in from the origin
    const f = this.road.at(this.s);
    this.camPos.copy(f.pos).addScaledVector(f.fwd, -7).add(new THREE.Vector3(0, 3, 0));
    this.camLook.copy(f.pos).addScaledVector(f.fwd, 6);
    for (let i = 0; i < 6; i++) this.streamChunks(true);
  }

  /** Windows worked out from world position, lit by night, darker glass by day. */
  private windowShader(m: THREE.Material) {
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uNight = this.towerU.uNight;
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vWPos;\nvarying vec3 vWN;')
        .replace('#include <project_vertex>', `#include <project_vertex>
          vec4 wpA = vec4(transformed, 1.0);
          vWPos = (modelMatrix * wpA).xyz;
          vWN = normalize(mat3(modelMatrix) * objectNormal);`);
      const fn = `
        varying vec3 vWPos; varying vec3 vWN; uniform float uNight;
        float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float winMask(out float lit) {
          lit = 0.0;
          if (abs(vWN.y) > 0.5 || vWPos.y < 3.2) return 0.0;
          float u = abs(vWN.x) > abs(vWN.z) ? vWPos.z : vWPos.x;
          vec2 cell = vec2(floor(u / 2.6), floor(vWPos.y / 3.3));
          vec2 f = vec2(fract(u / 2.6), fract(vWPos.y / 3.3));
          float m = step(0.18, f.x) * step(f.x, 0.82) * step(0.3, f.y) * step(f.y, 0.82);
          lit = step(0.55, h21(cell + floor(vWPos.xz / 40.0)));
          return m;
        }`;
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\n' + fn)
        .replace('#include <color_fragment>', `#include <color_fragment>
          float litA; float wm = winMask(litA);
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.32, 0.42, 0.55), wm * 0.8);`)
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
          float litB; float wm2 = winMask(litB);
          totalEmissiveRadiance += vec3(1.3, 0.95, 0.55) * wm2 * litB * uNight * 0.9;`);
    };
  }

  private buildSky() {
    this.skyU = {
      uTop: { value: new THREE.Color() },
      uHor: { value: new THREE.Color() },
      uSun: { value: new THREE.Vector3(0, 1, 0) },
      uSunCol: { value: new THREE.Color() },
      uNight: { value: 0 },
      uTime: { value: 0 },
    };
    const mat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: this.skyU,
      vertexShader: 'varying vec3 vP; void main(){ vP = position; vec4 p = projectionMatrix * modelViewMatrix * vec4(position,1.0); gl_Position = p.xyww; }',
      fragmentShader: `
        uniform vec3 uTop; uniform vec3 uHor; uniform vec3 uSun; uniform vec3 uSunCol; uniform float uNight; uniform float uTime;
        varying vec3 vP;
        float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        void main(){
          vec3 d = normalize(vP);
          float h = d.y;
          vec3 c = mix(uHor, uTop, pow(clamp(h, 0.0, 1.0), 0.5));
          c = mix(c, uHor * 0.8, clamp(-h * 4.0, 0.0, 1.0));
          // the sun, its glow, and the warm side of the sky round it
          float sd = dot(d, normalize(uSun));
          c += uSunCol * pow(max(sd, 0.0), 12.0) * 0.35 * (1.0 - uNight);
          c += uSunCol * smoothstep(0.9993, 0.9996, sd) * 3.0 * step(-0.05, uSun.y);
          // the moon, opposite
          float md = dot(d, normalize(-uSun + vec3(0.25, 0.1, 0.0)));
          c += vec3(1.0, 0.97, 0.88) * smoothstep(0.9990, 0.9993, md) * 1.6 * uNight;
          c += vec3(0.5, 0.6, 0.9) * pow(max(md, 0.0), 60.0) * 0.25 * uNight;
          // stars
          vec2 g = vec2(atan(d.z, d.x) * 160.0, asin(clamp(h, -1.0, 1.0)) * 160.0);
          vec2 cell = floor(g);
          float r = h21(cell);
          float star = step(0.992, r) * smoothstep(0.6, 0.0, length(fract(g) - 0.5));
          star *= 0.6 + 0.4 * sin(uTime * (1.0 + r * 4.0) + r * 60.0);
          c += vec3(star) * uNight * smoothstep(0.02, 0.25, h) * 1.4;
          gl_FragColor = vec4(c, 1.0);
        }`,
    });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(3000, 32, 16), mat);
    this.sky.frustumCulled = false;
    this.sky.renderOrder = -10;
    this.scene.add(this.sky);
    // clouds all round, far off, drifting
    const texs = [1, 2, 3, 4].map((s) => cloudTex(s * 97));
    const r = mulberry(12);
    for (let i = 0; i < 18; i++) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: texs[i % 4], fog: false, depthWrite: false, transparent: true }));
      const a = (i / 18) * Math.PI * 2 + r() * 0.2;
      const dist = 1200 + r() * 700;
      const w = 500 + r() * 700;
      sp.position.set(Math.cos(a) * dist, 180 + r() * 380, Math.sin(a) * dist);
      sp.scale.set(w, w * 0.62, 1);
      sp.userData.a = a;
      sp.userData.d = dist;
      this.clouds.add(sp);
    }
    this.clouds.renderOrder = -5;
    this.scene.add(this.clouds);
    // the painted hills
    const ht = hillsTex();
    ht.wrapS = THREE.RepeatWrapping;
    this.hills = new THREE.Mesh(new THREE.CylinderGeometry(1900, 1900, 420, 64, 1, true), new THREE.MeshBasicMaterial({ map: ht, transparent: true, side: THREE.BackSide, fog: false, depthWrite: false }));
    this.hills.renderOrder = -4;
    this.scene.add(this.hills);
  }

  private buildGround() {
    this.sea = new THREE.Mesh(new THREE.PlaneGeometry(8000, 8000), new THREE.MeshPhongMaterial({ color: '#2f6aa8', shininess: 90, specular: '#ffffff' }));
    this.sea.rotation.x = -Math.PI / 2;
    this.scene.add(this.sea);
    this.land = new THREE.Mesh(new THREE.PlaneGeometry(8000, 8000), new THREE.MeshToonMaterial({ color: '#6f9a44', gradientMap: toonGradient() }));
    this.land.rotation.x = -Math.PI / 2;
    this.scene.add(this.land);
  }

  private buildParticles() {
    const mk = (n: number, soft: boolean, color: string, size: number, additive: boolean) => {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
      const p = new THREE.Points(g, new THREE.PointsMaterial({
        map: dotTex(soft), color, size, transparent: true, depthWrite: false, sizeAttenuation: true,
        blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
      }));
      p.frustumCulled = false;
      this.scene.add(p);
      return p;
    };
    this.petals = mk(this.low ? 160 : 420, false, '#ffc2d4', 0.22, false);
    this.flies = mk(this.low ? 80 : 200, true, '#d8ff8a', 0.35, true);
  }

  private buildTrain() {
    const m = (c: string) => new THREE.MeshToonMaterial({ color: c, gradientMap: toonGradient() });
    const glow = new THREE.MeshBasicMaterial({ color: '#fff0c8' });
    this.train.userData.glow = glow;
    for (let k = 0; k < 4; k++) {
      const car = new THREE.Group();
      car.position.x = -k * 18.5;
      const body = new THREE.Mesh(new THREE.BoxGeometry(18, 3.2, 2.9), m('#f2ecda'));
      body.position.y = 2.1;
      car.add(body);
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(18.05, 0.35, 2.95), m('#2a8a5a'));
      stripe.position.y = 1.2;
      car.add(stripe);
      const roof = new THREE.Mesh(new THREE.BoxGeometry(17.6, 0.3, 2.6), m('#9aa0a8'));
      roof.position.y = 3.85;
      car.add(roof);
      for (const z of [-1.47, 1.47]) {
        const win = new THREE.Mesh(new THREE.PlaneGeometry(15, 1.1), glow);
        win.position.set(0, 2.6, z);
        if (z < 0) win.rotation.y = Math.PI;
        car.add(win);
      }
      this.train.add(car);
    }
    this.train.visible = false;
    this.scene.add(this.train);
    // the crossing gates and their lights, placed when a crossing is near
    for (const side of [-1, 1]) {
      const arm = new THREE.Group();
      const bar = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.12, 0.12), m('#f2c21a'));
      bar.position.x = -side * 2.1;
      arm.add(bar);
      for (let k = 0; k < 4; k++) {
        const band = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.13, 0.13), m('#1a1a1a'));
        band.position.x = -side * (0.6 + k * 1.0);
        arm.add(band);
      }
      const lights: THREE.Mesh[] = [];
      for (const dx of [-0.35, 0.35]) {
        const l = new THREE.Mesh(new THREE.CircleGeometry(0.17, 16), new THREE.MeshBasicMaterial({ color: '#3a0a0a', side: THREE.DoubleSide }));
        l.position.set(dx, 2.55, 0.2);
        lights.push(l);
      }
      const holder = new THREE.Group();
      holder.add(arm, ...lights);
      arm.position.set(0, 1.1, 0);
      holder.userData.side = side;
      this.gateGroup.add(holder);
      this.gates.push({ arm, lights });
    }
    this.scene.add(this.gateGroup);
  }

  /** Build what is about to come into view, drop what is well behind. */
  private streamChunks(force = false) {
    const i0 = Math.floor(this.s / CHUNK);
    const want: number[] = [];
    for (let i = i0 - 2; i <= i0 + (this.low ? 9 : 13); i++) if (i >= 0) want.push(i);
    for (const [i, g] of this.chunks) {
      if (i < i0 - 2 || i > i0 + 14) {
        this.scene.remove(g);
        disposeChunk(g);
        this.chunks.delete(i);
      }
    }
    // one a frame, nearest first, so no frame does a lot of work
    for (const i of want) {
      if (this.chunks.has(i)) continue;
      const g = buildChunk(this.road, i, this.mats);
      g.traverse((o) => { if ((o as THREE.Mesh).isMesh) { (o as THREE.Mesh).receiveShadow = !this.low; (o as THREE.Mesh).castShadow = !this.low && Math.abs(i - i0) < 2; } });
      this.scene.add(g);
      this.chunks.set(i, g);
      if (!force) break;
    }
  }

  /** The next railway crossing along, or the one just passed. */
  private crossingS() {
    const k0 = Math.floor((this.s - 40) / DISTRICT);
    for (let k = k0; k < k0 + 5; k++) {
      if (ORDER[((k % 4) + 4) % 4] !== 'city') continue;
      const cs = k * DISTRICT + CROSSING_AT * DISTRICT;
      if (cs > this.s - 60) return cs;
    }
    return -1e9;
  }

  resize(w: number, h: number) {
    this.camera.aspect = w / Math.max(1, h);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
    this.composer.setSize(w, h);
    const pr = this.renderer.getPixelRatio();
    this.paint.uniforms.uRes!.value.set(w * pr, h * pr);
    this.bloom.resolution.set(w / 2, h / 2);
  }

  /** Put her somewhere else on the road at once, with the world built round her and the camera behind. */
  jump(s: number) {
    this.s = Math.max(0, s);
    const f = this.road.at(this.s);
    this.camPos.copy(f.pos).addScaledVector(f.fwd, -7).add(new THREE.Vector3(0, 3, 0));
    this.camLook.copy(f.pos).addScaledVector(f.fwd, 6);
    for (const [i, g] of this.chunks) { this.scene.remove(g); disposeChunk(g); this.chunks.delete(i); }
    this.streamChunks(true);
  }

  ring() { this.bellAt = this.t; }
  bellAt = -9;

  frame() {
    const now = performance.now() / 1000;
    const dt = Math.min(0.1, now - this.last);
    this.last = now;
    this.t += dt;
    const t = this.t;

    /* ── time of day ───────────────────────────────────────────────── */
    if (this.autoTime) this.tod = (this.tod + dt / this.dayLength) % 1;
    const K = sampleKeys(this.tod);
    this.night = K.night;
    const sa = (this.tod - 0.25) * Math.PI * 2;
    const sunDir = new THREE.Vector3(Math.cos(sa) * 0.75, Math.sin(sa), -0.45 + 0.2 * Math.cos(sa)).normalize();
    this.skyU.uTop!.value.copy(K.top);
    this.skyU.uHor!.value.copy(K.hor);
    this.skyU.uSun!.value.copy(sunDir);
    this.skyU.uSunCol!.value.copy(K.sun);
    this.skyU.uNight!.value = K.night;
    this.skyU.uTime!.value = t;
    (this.scene.fog as THREE.Fog).color.copy(K.fog);
    this.hemi.color.copy(K.hemiS);
    this.hemi.groundColor.copy(K.hemiG);
    this.hemi.intensity = K.hemiI;
    // the light is the sun by day and the moon by night
    const lightDir = sunDir.y > -0.05 ? sunDir : sunDir.clone().negate().add(new THREE.Vector3(0.25, 0.1, 0)).normalize();
    this.sun.color.copy(K.sun);
    this.sun.intensity = K.sunI;
    // glass is dark by day and lit by night; paper is its own colour by day and glows by night
    this.glowMat.color.setRGB(0.13 + K.night * 1.25, 0.17 + K.night * 1.2, 0.24 + K.night * 1.1);
    this.paperMat.color.setScalar(0.85 + K.night * 0.55);
    this.signMat.color.setScalar(0.92 + K.night * 0.25);
    this.towerU.uNight.value = K.night;
    this.bloom.strength = 0.15 + K.night * 0.45;
    this.bloom.threshold = 0.95;
    this.paint.uniforms.uNight!.value = K.night;
    this.girl.setNight(K.night);
    (this.hills.material as THREE.MeshBasicMaterial).color.copy(K.fog).lerp(new THREE.Color('#ffffff'), 0.35 * (1 - K.night)).multiplyScalar(1 - K.night * 0.45);
    for (const c of this.clouds.children as THREE.Sprite[]) {
      c.material.color.copy(K.cloud);
      c.material.opacity = 0.95 - K.night * 0.45;
    }

    /* ── the ride ──────────────────────────────────────────────────── */
    const cs = this.crossingS();
    const toCross = cs - this.s;
    // start a train as she comes up to the crossing, so she always meets one
    if (toCross > 0 && toCross < 95 && this.trainFor !== cs) {
      this.trainFor = cs;
      this.trainT0 = t;
    }
    const tt = this.trainFor === cs ? t - this.trainT0 : 999;
    const gatesDown = tt > 3 && tt < 17;
    this.crossing.active = gatesDown;
    this.crossing.dist = Math.abs(toCross);
    let target = this.paused ? 0 : this.cruise;
    // wait at the crossing while the gates are down
    if (gatesDown && toCross > 3 && toCross < 30) target = Math.min(target, Math.max(0, (toCross - 6) * 0.9));
    this.speed += (target - this.speed) * Math.min(1, dt * (target < this.speed ? 2.2 : 0.8));
    this.s += this.speed * dt;
    this.district = districtAt(this.s).id;

    const f = this.road.at(this.s);
    const lane = -1.5;
    const gp = f.pos.clone().addScaledVector(f.right, lane);
    const slope = this.road.slope(this.s);
    this.carrier.position.copy(gp);
    this.carrier.rotation.order = 'YXZ';
    this.carrier.rotation.set(Math.atan(slope), -f.h, 0);
    const hAhead = this.road.at(this.s + 2).h;
    const turn = ((hAhead - f.h) / 2) * this.speed;
    this.girl.update(dt, t, this.speed, turn, slope);

    this.streamChunks();

    /* ── the crossing and the train ────────────────────────────────── */
    if (cs > -1e8 && Math.abs(toCross) < 400) {
      const cf = this.road.at(cs);
      this.gateGroup.visible = true;
      this.gateGroup.children.forEach((holder, gi) => {
        const side = holder.userData.side as number;
        const pf = this.road.at(cs - side * 3);
        holder.position.copy(pf.pos).addScaledVector(pf.right, side * 4.6);
        holder.rotation.y = -pf.h;
        const g = this.gates[gi]!;
        const down = gatesDown ? Math.min(1, (tt - 3) / 2) : tt > 17 && tt < 20 ? 1 - (tt - 17) / 2.5 : 0;
        // up is straight up; down is across the road
        g.arm.rotation.z = -side * (Math.PI / 2 - 0.05) * (1 - Math.max(0, down));
        g.lights.forEach((l, li) => {
          const on = gatesDown && Math.floor(t * 2.4) % 2 === li;
          (l.material as THREE.MeshBasicMaterial).color.set(on ? '#ff3a2a' : '#3a0a0a').multiplyScalar(on ? 2.5 : 1);
        });
      });
      if (tt < 25) {
        this.train.visible = true;
        const head = -280 + tt * 24;
        this.train.position.copy(cf.pos).addScaledVector(cf.right, head);
        this.train.rotation.y = -cf.h;
        (this.train.userData.glow as THREE.MeshBasicMaterial).color.setScalar(0.35 + K.night * 1.8);
      } else this.train.visible = false;
    } else {
      this.gateGroup.visible = false;
      this.train.visible = false;
    }

    /* ── the camera ────────────────────────────────────────────────── */
    let mode = this.mode;
    if (mode === 'auto') {
      this.autoClock += dt;
      const seq: CamMode[] = ['chase', 'side', 'chase', 'front', 'chase', 'crane'];
      const len = [22, 9, 16, 8, 18, 10];
      let acc = 0;
      const total = len.reduce((a, b) => a + b, 0);
      const u = this.autoClock % total;
      mode = 'chase';
      for (let i = 0; i < seq.length; i++) { if (u >= acc && u < acc + len[i]!) mode = seq[i]!; acc += len[i]!; }
      // at the crossing, watch the train go by from beside her
      if (gatesDown && toCross < 25 && toCross > 0) mode = 'side';
    }
    const up = new THREE.Vector3(0, 1, 0);
    const base = gp.clone();
    let off: THREE.Vector3;
    let look: THREE.Vector3;
    if (mode === 'side') { off = f.right.clone().multiplyScalar(5.2).addScaledVector(up, 1.4).addScaledVector(f.fwd, -1.2); look = base.clone().addScaledVector(up, 1.1).addScaledVector(f.fwd, 1.5); }
    else if (mode === 'front') { off = f.fwd.clone().multiplyScalar(4.6).addScaledVector(up, 1.2).addScaledVector(f.right, -0.7); look = base.clone().addScaledVector(up, 1.15); }
    else if (mode === 'crane') { off = f.fwd.clone().multiplyScalar(-13).addScaledVector(up, 12).addScaledVector(f.right, 7); look = base.clone().addScaledVector(f.fwd, 14); }
    else { off = f.fwd.clone().multiplyScalar(-6.4).addScaledVector(up, 2.5).addScaledVector(f.right, 0.9); look = base.clone().addScaledVector(f.fwd, 7).addScaledVector(up, 1.3); }
    // the viewer can pull the camera round her; it drifts back when let go
    if (!this.dragging) { this.camYaw *= Math.exp(-dt * 0.6); this.camPitch *= Math.exp(-dt * 0.6); }
    off.applyAxisAngle(up, this.camYaw);
    off.y += this.camPitch * 6;
    const desired = base.clone().add(off);
    // keep the camera above the ground it is over
    const gy = this.road.y(this.s) + 0.8;
    desired.y = Math.max(desired.y, gy);
    const k = 1 - Math.exp(-dt * (mode === 'crane' ? 1.5 : 3.2));
    this.camPos.lerp(desired, k);
    this.camLook.lerp(look, 1 - Math.exp(-dt * 5));
    this.camera.position.copy(this.camPos);
    this.camera.lookAt(this.camLook);

    /* ── things that follow the camera ─────────────────────────────── */
    this.sky.position.copy(this.camera.position);
    this.clouds.position.copy(this.camera.position);
    this.clouds.position.y = 0;
    for (const c of this.clouds.children as THREE.Sprite[]) {
      const a = (c.userData.a as number) + t * 0.004;
      c.position.x = Math.cos(a) * (c.userData.d as number);
      c.position.z = Math.sin(a) * (c.userData.d as number);
    }
    this.hills.position.set(this.camera.position.x, this.road.y(this.s) + 120, this.camera.position.z);
    const seaSide = this.district === 'sea';
    this.sea.visible = seaSide || districtAt(this.s + 250).id === 'sea';
    this.land.visible = !this.sea.visible;
    this.sea.position.set(this.camera.position.x, -58, this.camera.position.z);
    this.land.position.set(this.camera.position.x, this.road.y(this.s) - 3, this.camera.position.z);
    (this.sea.material as THREE.MeshPhongMaterial).color.copy(K.hor).lerp(new THREE.Color('#1a4a8a'), 0.65).multiplyScalar(1 - K.night * 0.6);
    this.sun.position.copy(gp).addScaledVector(lightDir, 60);
    this.sun.target.position.copy(gp);

    this.stepParticles(t, gp);
    this.composer.render();
  }

  private stepParticles(t: number, at: THREE.Vector3) {
    const petals = this.petals.geometry.attributes.position as THREE.BufferAttribute;
    const n = petals.count;
    const box = 50;
    const showPetals = this.district === 'fields' || this.district === 'street' ? 1 : 0.35;
    for (let i = 0; i < n; i++) {
      const x = ((hash(i * 1.3) * box + t * 1.3 + Math.sin(t * 0.8 + i) * 1.2) % box) - box / 2;
      const y = box * 0.4 - ((hash(i * 2.7) * box * 0.4 + t * (0.8 + hash(i) * 0.6)) % (box * 0.4));
      const z = ((hash(i * 4.1) * box + t * 0.6) % box) - box / 2;
      petals.setXYZ(i, at.x + x, at.y + y, at.z + z);
    }
    petals.needsUpdate = true;
    (this.petals.material as THREE.PointsMaterial).opacity = showPetals * (1 - this.night * 0.6);
    const flies = this.flies.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < flies.count; i++) {
      const x = ((hash(i * 3.3) * 60) % 60) - 30 + Math.sin(t * 0.5 + i) * 2;
      const z = ((hash(i * 5.9) * 60) % 60) - 30 + Math.cos(t * 0.4 + i * 1.3) * 2;
      const y = 0.5 + hash(i * 7.7) * 2.5 + Math.sin(t * 1.3 + i) * 0.4;
      flies.setXYZ(i, at.x + x, at.y + y, at.z + z);
    }
    flies.needsUpdate = true;
    const fl = this.district === 'fields' || this.district === 'sea' ? 1 : 0.15;
    (this.flies.material as THREE.PointsMaterial).opacity = this.night * fl * (0.6 + 0.4 * Math.sin(t * 3));
  }

  dispose() {
    for (const g of this.chunks.values()) disposeChunk(g);
    this.renderer.dispose();
    this.composer.dispose();
  }
}
