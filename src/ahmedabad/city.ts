import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { Reflector } from 'three/examples/jsm/objects/Reflector.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * AHMEDABAD, ON A NAVRATRI NIGHT — the world.
 *
 * Metres, with x east and −z north. The Sabarmati runs north–south through the
 * middle. West of it: the newer city, towers with their windows lit, and on
 * the riverfront a garba ground the size of a stadium, a thousand and more
 * dancers in rings round a shrine to Amba under radial strings of lights. East
 * of it: the walled city, laid out roughly as it is — Bhadra fort with the
 * Bhadrakali temple inside it, the Maidan-e-Shahi running east to Teen
 * Darwaza, the Jama Masjid just beyond, Sidi Saiyyed's mosque at the corner
 * with its tree-of-life window lit from inside, and then the pols, packed
 * lanes of carved houses with lights strung across them and a small garba of
 * their own in a chowk.
 *
 * Almost nothing here is a light. A night city with a few thousand bulbs would
 * be a few thousand lights; instead every bulb is an instance of one tiny
 * mesh whose colour is brighter than white, and the bloom pass does the rest.
 * The windows are not geometry either: the building shader works them out
 * from world position, so a tower is one box and still has four hundred
 * windows, some of them on.
 */

export interface Place {
  id: string;
  name: string;
  note: string;
  pos: [number, number, number];
  look: [number, number, number];
}

export const PLACES: Place[] = [
  { id: 'river', name: 'Over the Sabarmati', note: 'Both banks lit, the Atal Bridge across the water, and the garba ground glowing to the west.', pos: [-40, 150, 430], look: [0, 0, -60] },
  { id: 'ground', name: 'The garba ground', note: 'Rings inside rings, all turning round the lamp at the middle — each ring the opposite way to the one inside it.', pos: [-230, 70, 190], look: [-230, 0, 60] },
  { id: 'dance', name: 'Among the dancers', note: 'Three steps, a clap, a turn. The dhol sets it; the circle keeps it.', pos: [-196, 4.5, 104], look: [-232, 3, 58] },
  { id: 'pol', name: 'A pol in the old city', note: 'A gated lane of carved wooden houses, lights zigzagged between balconies, and a garba of the neighbours in the chowk.', pos: [352, 5.5, 114], look: [424, 4, 118] },
  { id: 'gate', name: 'Teen Darwaza', note: 'The triple gateway of 1415, with the market running through it and the Jama Masjid behind.', pos: [214, 7, -40], look: [290, 9, -40] },
  { id: 'fort', name: 'Bhadra and Bhadrakali', note: 'The fort the city was founded with, and inside it the temple of the city’s guardian goddess — busiest on these nine nights.', pos: [110, 40, 40], look: [160, 6, -40] },
  { id: 'jali', name: 'Sidi Saiyyed’s window', note: 'A tree in carved stone, its branches twisting into a lattice, lit from inside the mosque.', pos: [140, 7, -96], look: [140, 8, -121] },
];

const RIVER_W = 60;
const BANK = 80;
const GROUND = new THREE.Vector3(-230, 0, 60);
const GROUND_R = 72;
const CHOWK = new THREE.Vector3(424, 0, 124);

/* ────────────────────────────────────────────────────────────────────────
   deterministic numbers
   ──────────────────────────────────────────────────────────────────────── */

function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const hash = (n: number) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** The colours of a garba night, for skirts, turbans and lights. */
const FESTIVE = ['#e8243c', '#ff7a00', '#ffc400', '#14a44d', '#1d6fe0', '#c21e8c', '#7a2bd6', '#00a5a8', '#ff3d8b', '#f2e14c'];
const BULBS = ['#ff4a3d', '#ffb13b', '#ffe45c', '#5cff8a', '#4ab8ff', '#ff5ce1', '#ffffff', '#ff8a1f'];

/* ────────────────────────────────────────────────────────────────────────
   materials that know where their windows are
   ──────────────────────────────────────────────────────────────────────── */

interface WindowOpts {
  cell: number;
  floor: number;
  lit: number;
  warm: THREE.Color;
  cool: THREE.Color;
  strength: number;
}

/**
 * A standard material whose emissive is a grid of windows computed from world
 * position: each face gets a cell every `cell` metres along it and a storey
 * every `floor` metres up, and a hashed fraction of them are on.
 */
function windowMaterial(color: THREE.ColorRepresentation, o: WindowOpts, rough = 0.9) {
  const m = new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0 });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uCell = { value: o.cell };
    sh.uniforms.uFloor = { value: o.floor };
    sh.uniforms.uLit = { value: o.lit };
    sh.uniforms.uWarm = { value: o.warm };
    sh.uniforms.uCool = { value: o.cool };
    sh.uniforms.uStrength = { value: o.strength };
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWPos;\nvarying vec3 vWNorm;')
      .replace('#include <project_vertex>', `#include <project_vertex>
        vec4 wpA = vec4(transformed, 1.0);
        vec3 wnA = objectNormal;
        #ifdef USE_INSTANCING
          wpA = instanceMatrix * wpA;
          wnA = mat3(instanceMatrix) * wnA;
        #endif
        vWPos = (modelMatrix * wpA).xyz;
        vWNorm = normalize(mat3(modelMatrix) * wnA);`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        varying vec3 vWPos;
        varying vec3 vWNorm;
        uniform float uCell; uniform float uFloor; uniform float uLit; uniform float uStrength;
        uniform vec3 uWarm; uniform vec3 uCool;
        float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        if (abs(vWNorm.y) < 0.5 && vWPos.y > 1.2) {
          float u = abs(vWNorm.x) > 0.5 ? vWPos.z : vWPos.x;
          vec2 cell = vec2(floor(u / uCell), floor(vWPos.y / uFloor));
          vec2 f = vec2(fract(u / uCell), fract(vWPos.y / uFloor));
          float inWin = step(0.3, f.x) * step(f.x, 0.7) * step(0.32, f.y) * step(f.y, 0.78);
          float side = abs(vWNorm.x) > 0.5 ? sign(vWNorm.x) * 3.1 : sign(vWNorm.z) * 7.3;
          float r = h21(cell + side + floor(vWPos.xz * 0.02) * 1.7);
          float on = step(1.0 - uLit, r);
          vec3 wc = mix(uWarm, uCool, step(0.82, h21(cell * 1.31 + side)));
          totalEmissiveRadiance += wc * inWin * on * uStrength * (0.6 + 0.8 * h21(cell + 9.1));
        }`);
  };
  return m;
}

/* ────────────────────────────────────────────────────────────────────────
   geometry helpers
   ──────────────────────────────────────────────────────────────────────── */

/** A unit box standing on the ground: scale it and it grows upwards. */
function standingBox() {
  const g = new THREE.BoxGeometry(1, 1, 1);
  g.translate(0, 0.5, 0);
  return g;
}

/** A catenary between two points, `sag` metres deep at the middle, as n points. */
function catenary(a: THREE.Vector3, b: THREE.Vector3, sag: number, n: number) {
  const out: THREE.Vector3[] = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const p = a.clone().lerp(b, u);
    p.y -= sag * 4 * u * (1 - u);
    out.push(p);
  }
  return out;
}

function canvasTexture(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d')!);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/**
 * The tree of life at Sidi Saiyyed: a trunk that splits into branches which
 * curl and interlace until they fill the arch, drawn as a lattice of light.
 */
function jaliTexture() {
  return canvasTexture(512, 640, (g) => {
    g.fillStyle = '#000';
    g.fillRect(0, 0, 512, 640);
    g.save();
    // the arch it fills
    g.beginPath();
    g.moveTo(30, 640);
    g.lineTo(30, 250);
    g.quadraticCurveTo(30, 30, 256, 20);
    g.quadraticCurveTo(482, 30, 482, 250);
    g.lineTo(482, 640);
    g.closePath();
    g.clip();
    const glow = g.createRadialGradient(256, 330, 20, 256, 330, 360);
    glow.addColorStop(0, '#ffd89a');
    glow.addColorStop(1, '#ff9a3a');
    g.strokeStyle = glow;
    g.lineCap = 'round';
    const r = mulberry(1573);
    const branch = (x: number, y: number, a: number, len: number, w: number, depth: number) => {
      if (depth === 0 || len < 8) {
        // a leaf-curl at the tip
        g.lineWidth = Math.max(2, w);
        g.beginPath();
        g.arc(x + Math.cos(a) * 10, y + Math.sin(a) * 10, 10, a, a + Math.PI * 1.6);
        g.stroke();
        return;
      }
      const ex = x + Math.cos(a) * len;
      const ey = y + Math.sin(a) * len;
      const bend = (r() - 0.5) * len * 0.8;
      g.lineWidth = w;
      g.beginPath();
      g.moveTo(x, y);
      g.quadraticCurveTo((x + ex) / 2 + Math.cos(a + Math.PI / 2) * bend, (y + ey) / 2 + Math.sin(a + Math.PI / 2) * bend, ex, ey);
      g.stroke();
      const n = depth > 4 ? 2 : 3;
      for (let i = 0; i < n; i++) {
        const spread = (i - (n - 1) / 2) * (0.55 + r() * 0.35);
        branch(ex, ey, a + spread, len * (0.68 + r() * 0.12), w * 0.72, depth - 1);
      }
    };
    branch(256, 640, -Math.PI / 2, 150, 26, 7);
    // a palm-frond fan either side, and the lattice ground behind it all
    g.globalAlpha = 0.35;
    g.lineWidth = 2;
    for (let y = 20; y < 640; y += 22) {
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(512, y + 18);
      g.stroke();
    }
    g.restore();
  });
}

/** A crescent moon: Navratri starts two days after the new moon. */
function moonTexture() {
  return canvasTexture(256, 256, (g) => {
    const grd = g.createRadialGradient(128, 128, 30, 128, 128, 128);
    grd.addColorStop(0, 'rgba(255,240,210,0.35)');
    grd.addColorStop(1, 'rgba(255,240,210,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, 256, 256);
    g.fillStyle = '#fff3d6';
    g.beginPath();
    g.arc(128, 128, 42, 0, Math.PI * 2);
    g.fill();
    g.globalCompositeOperation = 'destination-out';
    g.beginPath();
    g.arc(148, 118, 42, 0, Math.PI * 2);
    g.fill();
  });
}

/* ────────────────────────────────────────────────────────────────────────
   the world
   ──────────────────────────────────────────────────────────────────────── */

interface Dancer {
  ring: number;
  r: number;
  a0: number;
  speed: number;
  phase: number;
  scale: number;
  center: THREE.Vector3;
}
interface Mover {
  path: THREE.Vector3[];
  len: number;
  s0: number;
  speed: number;
}

export class World {
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(50, 1, 0.5, 5000);
  composer: EffectComposer;
  bloom: UnrealBloomPass;
  low: boolean;

  // the camera's state: where it is looking from, as an orbit round `target`
  target = new THREE.Vector3();
  az = 0;
  el = 0.3;
  dist = 100;
  private flight: { from: { t: THREE.Vector3; az: number; el: number; dist: number }; to: { t: THREE.Vector3; az: number; el: number; dist: number }; t0: number; dur: number } | null = null;

  private dancers: Dancer[] = [];
  private cloth!: THREE.InstancedMesh;
  private skin!: THREE.InstancedMesh;
  private bulbs!: THREE.InstancedMesh;
  private bulbBase: THREE.Color[] = [];
  private bulbChase: number[] = [];
  private movers: Mover[] = [];
  private rickshaws!: THREE.InstancedMesh;
  private fireworks!: THREE.Points;
  private fwPos!: Float32Array;
  private fwCol!: Float32Array;
  private flames: THREE.Mesh[] = [];
  private shrineLight!: THREE.PointLight;
  private clock = performance.now() / 1000;
  /** The beat, in seconds per step of the garba; the page may drive it from the music. */
  beat = 0.18;
  beatTime: (() => number) | null = null;
  count = { dancers: 0, bulbs: 0, buildings: 0 };

  constructor(canvas: HTMLCanvasElement, opts: { quality: 'high' | 'low' }) {
    this.low = opts.quality === 'low';
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: !this.low, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(this.low ? 1 : 1.5, window.devicePixelRatio || 1));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.scene.background = new THREE.Color('#080a1c');
    this.scene.fog = new THREE.FogExp2('#1a1430', 0.0011);

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(512, 512), 0.7, 0.5, 0.78);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());

    this.build();
    this.goTo(PLACES[0]!, 0);
  }

  /* ── building it ───────────────────────────────────────────────────── */

  private build() {
    const S = this.scene;
    S.add(new THREE.HemisphereLight('#3a3a78', '#2a1a10', 0.55));
    const moon = new THREE.DirectionalLight('#9fb2ff', 0.35);
    moon.position.set(-300, 400, -200);
    S.add(moon);

    this.sky();
    this.land();
    this.river();
    this.westCity();
    this.garbaGround();
    this.oldCity();
    this.bridges();
    this.traffic();
    this.buildBulbs();
    this.buildDancers();
    this.buildFireworks();
  }

  private sky() {
    const geo = new THREE.SphereGeometry(3000, 32, 16);
    const mat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: {},
      vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: `varying vec3 vP;
        void main(){
          float h = normalize(vP).y;
          vec3 top = vec3(0.012, 0.016, 0.06);
          vec3 mid = vec3(0.05, 0.035, 0.12);
          vec3 glow = vec3(0.38, 0.14, 0.12);
          vec3 c = mix(glow, mid, smoothstep(-0.02, 0.18, h));
          c = mix(c, top, smoothstep(0.15, 0.7, h));
          gl_FragColor = vec4(c, 1.0);
        }`,
    });
    this.scene.add(new THREE.Mesh(geo, mat));
    // stars, fewer near the glow of the city
    const r = mulberry(5);
    const pts: number[] = [];
    for (let i = 0; i < 1400; i++) {
      const a = r() * Math.PI * 2;
      const y = 0.12 + Math.pow(r(), 0.7) * 0.88;
      const rr = Math.sqrt(1 - y * y);
      pts.push(Math.cos(a) * rr * 2800, y * 2800, Math.sin(a) * rr * 2800);
    }
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    this.scene.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: '#cfd8ff', size: 2.2, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.8 })));
    const moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: moonTexture(), fog: false, depthWrite: false, transparent: true }));
    moon.position.set(-1400, 900, -1800);
    moon.scale.set(420, 420, 1);
    this.scene.add(moon);
  }

  private land() {
    const mat = new THREE.MeshStandardMaterial({ color: '#2a2521', roughness: 1 });
    for (const side of [-1, 1]) {
      const g = new THREE.Mesh(new THREE.PlaneGeometry(1600, 2400), mat);
      g.rotation.x = -Math.PI / 2;
      g.position.set(side * (BANK + 800), 0, 0);
      this.scene.add(g);
      // the riverfront promenade, a step down, and the wall above it
      const prom = new THREE.Mesh(new THREE.BoxGeometry(BANK - RIVER_W, 1, 2400), new THREE.MeshStandardMaterial({ color: '#57504a', roughness: 0.9 }));
      prom.position.set(side * (RIVER_W + (BANK - RIVER_W) / 2), -3.5, 0);
      this.scene.add(prom);
      const wall = new THREE.Mesh(new THREE.BoxGeometry(2, 4, 2400), new THREE.MeshStandardMaterial({ color: '#7a6f64', roughness: 0.9 }));
      wall.position.set(side * BANK, -1.5, 0);
      this.scene.add(wall);
    }
    // roads: the riverfront roads and the big east–west streets
    const road = new THREE.MeshStandardMaterial({ color: '#1a1817', roughness: 0.8 });
    const addRoad = (x: number, z: number, w: number, l: number, rot = 0) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, l), road);
      m.rotation.x = -Math.PI / 2;
      m.rotation.z = rot;
      m.position.set(x, 0.03, z);
      this.scene.add(m);
    };
    addRoad(-BANK - 10, 0, 14, 2400);
    addRoad(BANK + 10, 0, 14, 2400);
    addRoad(-500, -60, 14, 900, Math.PI / 2);
    addRoad(-500, -220, 14, 900, Math.PI / 2);
    addRoad(420, -60, 12, 700, Math.PI / 2);
  }

  private river() {
    const w = RIVER_W * 2;
    if (!this.low) {
      const water = new Reflector(new THREE.PlaneGeometry(w, 2400), {
        textureWidth: 1024,
        textureHeight: 1024,
        color: new THREE.Color('#5a6a88'),
      });
      water.rotation.x = -Math.PI / 2;
      water.position.y = -4;
      this.scene.add(water);
      // a dark, slightly rippled skin over the mirror, so it reads as water
      const skin = new THREE.Mesh(new THREE.PlaneGeometry(w, 2400), new THREE.MeshStandardMaterial({ color: '#0a1022', transparent: true, opacity: 0.45, roughness: 0.3 }));
      skin.rotation.x = -Math.PI / 2;
      skin.position.y = -3.95;
      this.scene.add(skin);
    } else {
      const water = new THREE.Mesh(new THREE.PlaneGeometry(w, 2400), new THREE.MeshStandardMaterial({ color: '#0c1428', roughness: 0.2, metalness: 0.6 }));
      water.rotation.x = -Math.PI / 2;
      water.position.y = -4;
      this.scene.add(water);
    }
    // lamp posts along both promenades
    const posts: THREE.Matrix4[] = [];
    for (const side of [-1, 1]) for (let z = -1100; z <= 1100; z += 22) posts.push(new THREE.Matrix4().makeTranslation(side * (RIVER_W + 4), -3, z));
    for (const side of [-1, 1]) for (let z = -1100; z <= 1100; z += 30) posts.push(new THREE.Matrix4().makeTranslation(side * (BANK + 18), 0, z));
    const pole = new THREE.CylinderGeometry(0.12, 0.16, 6, 6);
    pole.translate(0, 3, 0);
    const poles = new THREE.InstancedMesh(pole, new THREE.MeshStandardMaterial({ color: '#333' }), posts.length);
    const heads = new THREE.InstancedMesh(new THREE.SphereGeometry(0.45, 8, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(4.2, 3.0, 1.6) }), posts.length);
    posts.forEach((m, i) => {
      poles.setMatrixAt(i, m);
      heads.setMatrixAt(i, m.clone().multiply(new THREE.Matrix4().makeTranslation(0, 6.2, 0)));
    });
    this.scene.add(poles, heads);
  }

  private westCity() {
    const r = mulberry(21);
    const mats: THREE.Matrix4[] = [];
    const cols: THREE.Color[] = [];
    const palette = ['#6d6a72', '#7c7068', '#5f6670', '#8a8176', '#57606b'];
    for (let bx = -900; bx < -BANK - 30; bx += 46) {
      for (let bz = -1000; bz < 1000; bz += 46) {
        // keep the garba ground and its surroundings open
        if (Math.hypot(bx + 23 - GROUND.x, bz + 23 - GROUND.z) < GROUND_R + 60) continue;
        if (Math.abs(bz + 23 + 60) < 12 || Math.abs(bz + 23 + 220) < 12) continue;
        const n = 1 + Math.floor(r() * 3);
        for (let k = 0; k < n; k++) {
          const w = 12 + r() * 16;
          const d = 12 + r() * 16;
          const far = Math.min(1, Math.abs(bx) / 700);
          const h = 8 + Math.pow(r(), 1.6) * (30 + far * 60) + (r() < 0.05 ? 60 : 0);
          const x = bx + 6 + r() * (36 - w) + w / 2;
          const z = bz + 6 + r() * (36 - d) + d / 2;
          mats.push(new THREE.Matrix4().compose(new THREE.Vector3(x, 0, z), new THREE.Quaternion(), new THREE.Vector3(w, h, d)));
          cols.push(new THREE.Color(palette[Math.floor(r() * palette.length)]));
          if (mats.length > (this.low ? 700 : 1600)) break;
        }
      }
    }
    const mat = windowMaterial('#ffffff', { cell: 3.2, floor: 3.4, lit: 0.26, warm: new THREE.Color(1.0, 0.7, 0.36), cool: new THREE.Color(0.45, 0.6, 0.9), strength: 0.55 });
    const im = new THREE.InstancedMesh(standingBox(), mat, mats.length);
    mats.forEach((m, i) => { im.setMatrixAt(i, m); im.setColorAt(i, cols[i]!); });
    this.scene.add(im);
    this.count.buildings += mats.length;
  }

  private garbaGround() {
    const c = GROUND;
    // the ground itself: pale sand, swept, with a darker ring worn by the dancers
    const earth = new THREE.Mesh(new THREE.CircleGeometry(GROUND_R + 14, 64), new THREE.MeshStandardMaterial({ color: '#8a6a4a', roughness: 1 }));
    earth.rotation.x = -Math.PI / 2;
    earth.position.set(c.x, 0.05, c.z);
    this.scene.add(earth);
    const carpet = new THREE.Mesh(new THREE.RingGeometry(8, 11, 48), new THREE.MeshStandardMaterial({ color: '#b3202a', roughness: 0.8 }));
    carpet.rotation.x = -Math.PI / 2;
    carpet.position.set(c.x, 0.08, c.z);
    this.scene.add(carpet);

    // the shrine at the middle: four pillars, a red-and-gold canopy, the garbo
    const gold = new THREE.MeshStandardMaterial({ color: '#d9a53a', metalness: 0.6, roughness: 0.35, emissive: '#3a2206' });
    const red = new THREE.MeshStandardMaterial({ color: '#b01824', roughness: 0.6, emissive: '#2a0306' });
    for (const [dx, dz] of [[-3, -3], [3, -3], [-3, 3], [3, 3]]) {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 6, 10), gold);
      p.position.set(c.x + dx, 3, c.z + dz);
      this.scene.add(p);
    }
    const roof = new THREE.Mesh(new THREE.ConeGeometry(5.2, 4, 4, 1), red);
    roof.rotation.y = Math.PI / 4;
    roof.position.set(c.x, 8, c.z);
    this.scene.add(roof);
    const finial = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 8), gold);
    finial.position.set(c.x, 10.4, c.z);
    this.scene.add(finial);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.8, 1.2, 8), gold);
    base.position.set(c.x, 0.6, c.z);
    this.scene.add(base);
    // the garbo: a pot pierced with holes and a lamp inside it
    const garbo = new THREE.Mesh(new THREE.SphereGeometry(0.9, 16, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color(5, 3, 1.2) }));
    garbo.position.set(c.x, 2.1, c.z);
    this.scene.add(garbo);
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      const f = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.45, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(6, 3, 0.8) }));
      f.position.set(c.x + Math.cos(a) * 2.2, 1.45, c.z + Math.sin(a) * 2.2);
      this.scene.add(f);
      this.flames.push(f);
    }
    this.shrineLight = new THREE.PointLight('#ffb35a', 180, 60, 1.6);
    this.shrineLight.position.set(c.x, 5, c.z);
    this.scene.add(this.shrineLight);
    // coloured floods on the dancers from four masts at the edge
    const flood = ['#ff4fa0', '#ffb040', '#4fb8ff', '#a060ff'];
    flood.forEach((col, i) => {
      const a = (i / 4) * Math.PI * 2 + 0.4;
      const l = new THREE.PointLight(col, 900, 150, 1.4);
      l.position.set(c.x + Math.cos(a) * (GROUND_R + 6), 22, c.z + Math.sin(a) * (GROUND_R + 6));
      this.scene.add(l);
      const mast = new THREE.Mesh(new THREE.BoxGeometry(0.8, 22, 0.8), new THREE.MeshStandardMaterial({ color: '#333' }));
      mast.position.set(l.position.x, 11, l.position.z);
      this.scene.add(mast);
    });
    // the central mast the strings of lights run down from
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 24, 8), new THREE.MeshStandardMaterial({ color: '#443' }));
    mast.position.set(c.x, 12, c.z);
    this.scene.add(mast);
    // perimeter poles and a low fence
    const pole = new THREE.CylinderGeometry(0.18, 0.2, 9, 6);
    pole.translate(0, 4.5, 0);
    const n = 36;
    const poles = new THREE.InstancedMesh(pole, new THREE.MeshStandardMaterial({ color: '#555' }), n);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      poles.setMatrixAt(i, new THREE.Matrix4().makeTranslation(c.x + Math.cos(a) * (GROUND_R + 4), 0, c.z + Math.sin(a) * (GROUND_R + 4)));
    }
    this.scene.add(poles);
    // the stage for the singers and the dhol, on the river side, with its screen
    const stage = new THREE.Mesh(new THREE.BoxGeometry(26, 2, 12), new THREE.MeshStandardMaterial({ color: '#2a1c14' }));
    stage.position.set(c.x + GROUND_R + 16, 1, c.z);
    this.scene.add(stage);
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(24, 9), new THREE.MeshBasicMaterial({ map: this.stageTexture(), color: new THREE.Color(1.6, 1.6, 1.6) }));
    screen.position.set(c.x + GROUND_R + 20, 8.5, c.z);
    screen.rotation.y = -Math.PI / 2;
    this.scene.add(screen);
    // the entrance arch, towards the city
    const arch = new THREE.Mesh(new THREE.TorusGeometry(9, 0.9, 8, 24, Math.PI), red);
    arch.position.set(c.x - GROUND_R - 8, 0, c.z);
    arch.rotation.y = Math.PI / 2;
    this.scene.add(arch);
  }

  private stageTexture() {
    return canvasTexture(512, 192, (g) => {
      const grd = g.createLinearGradient(0, 0, 512, 192);
      grd.addColorStop(0, '#6a0f4a');
      grd.addColorStop(1, '#ff7a1a');
      g.fillStyle = grd;
      g.fillRect(0, 0, 512, 192);
      g.fillStyle = '#ffe9a8';
      g.textAlign = 'center';
      g.font = '700 54px "Noto Sans Gujarati", "Shruti", FreeSans, sans-serif';
      g.fillText('નવરાત્રિ', 256, 86);
      g.font = '600 30px Avenir Next, Helvetica, Arial, sans-serif';
      g.fillText('NAVRATRI · RAAS GARBA', 256, 146);
    });
  }

  private oldCity() {
    const stone = new THREE.MeshStandardMaterial({ color: '#c49d70', roughness: 0.85, emissive: '#3a2410', emissiveIntensity: 0.55 });
    const add = (m: THREE.Mesh) => { this.scene.add(m); return m; };
    const box = (w: number, h: number, d: number, x: number, y: number, z: number, mat: THREE.Material = stone) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      m.position.set(x, y + h / 2, z);
      return add(m);
    };

    // ── Bhadra fort: walls, corner bastions, the gate on the east
    const fx = 165;
    const fz = -40;
    box(80, 12, 3, fx, 0, fz - 32);
    box(80, 12, 3, fx, 0, fz + 32);
    box(3, 12, 64, fx - 40, 0, fz);
    box(3, 12, 26, fx + 40, 0, fz - 19);
    box(3, 12, 26, fx + 40, 0, fz + 19);
    box(6, 16, 14, fx + 40, 0, fz);
    for (const [dx, dz] of [[-40, -32], [40, -32], [-40, 32], [40, 32]]) {
      const t = new THREE.Mesh(new THREE.CylinderGeometry(5, 5.6, 14, 12), stone);
      t.position.set(fx + dx, 7, fz + dz);
      add(t);
    }
    // crenellations along the top
    const cren = new THREE.InstancedMesh(new THREE.BoxGeometry(1.4, 1.4, 1.4), stone, 200);
    let ci = 0;
    for (let x = -39; x <= 39 && ci < 200; x += 3) for (const s of [-1, 1]) cren.setMatrixAt(ci++, new THREE.Matrix4().makeTranslation(fx + x, 12.7, fz + s * 32));
    for (let z = -30; z <= 30 && ci < 200; z += 3) for (const s of [-1, 1]) cren.setMatrixAt(ci++, new THREE.Matrix4().makeTranslation(fx + s * 40, 12.7, fz + z));
    cren.count = ci;
    add(cren);
    // Bhadrakali's temple inside, lit and hung with lights
    const temple = new THREE.MeshStandardMaterial({ color: '#f2e2c8', roughness: 0.7, emissive: '#6a3a12', emissiveIntensity: 0.6 });
    box(14, 6, 14, fx - 8, 0, fz, temple);
    const shikhara = new THREE.Mesh(new THREE.ConeGeometry(5.5, 13, 8), temple);
    shikhara.position.set(fx - 8, 12.5, fz);
    add(shikhara);
    const flagMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 0.3, 0.2), side: THREE.DoubleSide });
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(3, 1.8), flagMat);
    flag.position.set(fx - 6.4, 20.5, fz);
    add(flag);
    const tl = new THREE.PointLight('#ffa04a', 140, 50, 1.6);
    tl.position.set(fx - 8, 8, fz + 10);
    this.scene.add(tl);

    // ── the Maidan-e-Shahi, east from the fort to Teen Darwaza, lined with stalls
    const stall = new THREE.MeshStandardMaterial({ color: '#8a2a1a', roughness: 0.8 });
    const canopy = new THREE.InstancedMesh(standingBox(), stall, 60);
    const r = mulberry(88);
    let si = 0;
    for (let x = fx + 50; x < 255; x += 8) {
      for (const s of [-1, 1]) {
        const m = new THREE.Matrix4().compose(new THREE.Vector3(x, 0, fz + s * 11), new THREE.Quaternion(), new THREE.Vector3(6, 3 + r(), 4));
        canopy.setMatrixAt(si, m);
        canopy.setColorAt(si, new THREE.Color(FESTIVE[Math.floor(r() * FESTIVE.length)]));
        si++;
      }
    }
    canopy.count = si;
    add(canopy);

    // ── Teen Darwaza: three arches in one gateway
    const gx = 272;
    const shape = new THREE.Shape();
    shape.moveTo(-17, 0);
    shape.lineTo(17, 0);
    shape.lineTo(17, 15);
    shape.lineTo(-17, 15);
    shape.lineTo(-17, 0);
    for (const [cx, hw, hh] of [[-10, 3.2, 8.5], [0, 3.8, 10], [10, 3.2, 8.5]] as const) {
      const hole = new THREE.Path();
      hole.moveTo(cx - hw, 0);
      hole.lineTo(cx - hw, hh - hw);
      hole.absarc(cx, hh - hw, hw, Math.PI, 0, true);
      hole.lineTo(cx + hw, 0);
      shape.holes.push(hole);
    }
    const gate = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 7, bevelEnabled: false }), stone);
    gate.rotation.y = Math.PI / 2;
    gate.position.set(gx - 3.5, 0, fz);
    add(gate);
    const gl = new THREE.PointLight('#ffb870', 260, 70, 1.5);
    gl.position.set(gx - 14, 10, fz + 4);
    this.scene.add(gl);

    // ── the Jama Masjid, just beyond: a long prayer hall, domes, two short minarets
    const jx = 345;
    box(60, 12, 26, jx, 0, fz);
    for (let i = -2; i <= 2; i++) {
      const d = new THREE.Mesh(new THREE.SphereGeometry(i === 0 ? 7 : 5, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), stone);
      d.position.set(jx + i * 11, 12, fz);
      add(d);
    }
    for (const s of [-1, 1]) {
      const mn = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2, 12, 10), stone);
      mn.position.set(jx - 12, 18, fz + s * 6);
      add(mn);
    }
    // the courtyard in front of it
    const court = new THREE.Mesh(new THREE.PlaneGeometry(40, 60), new THREE.MeshStandardMaterial({ color: '#8c7a62', roughness: 1 }));
    court.rotation.x = -Math.PI / 2;
    court.position.set(jx - 50, 0.04, fz);
    add(court);

    // ── Sidi Saiyyed's mosque, and the window
    const sx = 140;
    const sz = -128;
    box(26, 10, 14, sx, 0, sz);
    const jali = new THREE.Mesh(new THREE.PlaneGeometry(5, 6.25), new THREE.MeshBasicMaterial({ map: jaliTexture(), color: new THREE.Color(2.2, 2.2, 2.2), transparent: true }));
    jali.position.set(sx, 5.5, sz + 7.05);
    add(jali);
    for (const dx of [-8, 8]) {
      const blank = new THREE.Mesh(new THREE.PlaneGeometry(4, 5.5), new THREE.MeshStandardMaterial({ color: '#6a5238' }));
      blank.position.set(sx + dx, 5.2, sz + 7.04);
      add(blank);
    }

    this.pols();
  }

  /**
   * The pols: gated neighbourhoods of narrow lanes and tall, narrow houses
   * with carved wooden fronts. Laid out on a jittered grid of lanes, the
   * houses shoulder to shoulder, each a colour, with a balcony jutting out on
   * the upper floor.
   */
  private pols() {
    const r = mulberry(1411);
    const houses: THREE.Matrix4[] = [];
    const hcol: THREE.Color[] = [];
    const balcs: THREE.Matrix4[] = [];
    const walls = ['#d98b6a', '#6fa8c9', '#e6c25a', '#9ac47a', '#c98ab8', '#e0a15a', '#7fb7b0', '#d9d2c0', '#b56a4a'];
    const lanes: { x0: number; x1: number; z: number }[] = [];
    for (let z = -380; z <= 420; z += 26) {
      if (Math.abs(z + 40) < 40) continue; // the Maidan and the monuments
      lanes.push({ x0: 205, x1: 700, z });
    }
    for (const lane of lanes) {
      for (const side of [-1, 1]) {
        let x = lane.x0 + r() * 6;
        while (x < lane.x1) {
          const w = 5 + r() * 4;
          const cx = x + w / 2;
          const z = lane.z + side * (3 + 4.5);
          if (Math.hypot(cx - CHOWK.x, lane.z - CHOWK.z) < 26) { x += w; continue; }
          const h = 8 + r() * 6;
          const d = 9;
          houses.push(new THREE.Matrix4().compose(new THREE.Vector3(cx, 0, z), new THREE.Quaternion(), new THREE.Vector3(w - 0.3, h, d)));
          hcol.push(new THREE.Color(walls[Math.floor(r() * walls.length)]));
          // the jharokha: a carved balcony on the upper floor, over the lane
          if (r() < 0.75) balcs.push(new THREE.Matrix4().compose(new THREE.Vector3(cx, h * 0.55, z - side * (d / 2 + 0.6)), new THREE.Quaternion(), new THREE.Vector3(w * 0.7, 2.4, 1.3)));
          x += w;
        }
        void side;
      }
    }
    const mat = windowMaterial('#ffffff', { cell: 2.6, floor: 3.2, lit: 0.4, warm: new THREE.Color(1.4, 0.75, 0.3), cool: new THREE.Color(1.2, 0.55, 0.25), strength: 0.8 }, 0.95);
    const im = new THREE.InstancedMesh(standingBox(), mat, houses.length);
    houses.forEach((m, i) => { im.setMatrixAt(i, m); im.setColorAt(i, hcol[i]!); });
    this.scene.add(im);
    const wood = new THREE.MeshStandardMaterial({ color: '#5a3418', roughness: 0.8, emissive: '#2a1206', emissiveIntensity: 0.6 });
    const bm = new THREE.InstancedMesh(standingBox(), wood, balcs.length);
    balcs.forEach((m, i) => bm.setMatrixAt(i, m));
    this.scene.add(bm);
    this.count.buildings += houses.length;
    this.polLanes = lanes;
    // the chowk: paving, a small shrine, and a warm light over the neighbours' garba
    const pave = new THREE.Mesh(new THREE.CircleGeometry(20, 32), new THREE.MeshStandardMaterial({ color: '#6a5a4a', roughness: 1 }));
    pave.rotation.x = -Math.PI / 2;
    pave.position.set(CHOWK.x, 0.05, CHOWK.z);
    this.scene.add(pave);
    const garbo = new THREE.Mesh(new THREE.SphereGeometry(0.6, 12, 10), new THREE.MeshBasicMaterial({ color: new THREE.Color(5, 3, 1.2) }));
    garbo.position.set(CHOWK.x, 1.4, CHOWK.z);
    this.scene.add(garbo);
    const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1, 0.8, 8), new THREE.MeshStandardMaterial({ color: '#b01824' }));
    stand.position.set(CHOWK.x, 0.4, CHOWK.z);
    this.scene.add(stand);
    const cl = new THREE.PointLight('#ffb060', 220, 45, 1.5);
    cl.position.set(CHOWK.x, 7, CHOWK.z);
    this.scene.add(cl);
    // the pol's gate, at the end of the lane
    const pg = new THREE.Mesh(new THREE.TorusGeometry(3.4, 0.9, 6, 16, Math.PI), new THREE.MeshStandardMaterial({ color: '#7a4a2a', emissive: '#2a1206' }));
    pg.position.set(CHOWK.x - 30, 0, CHOWK.z + 13);
    pg.rotation.y = Math.PI / 2;
    this.scene.add(pg);
  }
  private polLanes: { x0: number; x1: number; z: number }[] = [];

  private bridges() {
    // the Atal Bridge: a footbridge with a canopy of coloured panels
    const z = -220;
    const deck = new THREE.Mesh(new THREE.BoxGeometry(BANK * 2, 1, 10), new THREE.MeshStandardMaterial({ color: '#3a3a44', roughness: 0.6 }));
    deck.position.set(0, 3, z);
    this.scene.add(deck);
    const n = 44;
    const panel = new THREE.PlaneGeometry(3.6, 7);
    const pm = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, color: '#ffffff' });
    const panels = new THREE.InstancedMesh(panel, pm, n * 2);
    for (let i = 0; i < n; i++) {
      const x = -BANK + (i + 0.5) * ((BANK * 2) / n);
      const lift = 8 + Math.sin((i / n) * Math.PI) * 5;
      for (const s of [-1, 1]) {
        const m = new THREE.Matrix4().compose(new THREE.Vector3(x, 3 + lift - 2, z + s * 4.2), new THREE.Quaternion().setFromEuler(new THREE.Euler(s * 0.55, 0, 0)), new THREE.Vector3(1, 1, 1));
        const k = i * 2 + (s > 0 ? 1 : 0);
        panels.setMatrixAt(k, m);
        const c = new THREE.Color(BULBS[(i + (s > 0 ? 3 : 0)) % 6]!).multiplyScalar(0.9);
        panels.setColorAt(k, c);
      }
    }
    this.scene.add(panels);
    // the steel tubes underneath, arching
    const curve = new THREE.CatmullRomCurve3(Array.from({ length: 9 }, (_, i) => new THREE.Vector3(-BANK + (i / 8) * BANK * 2, 2.5 - Math.sin((i / 8) * Math.PI) * 3.5, z)));
    for (const s of [-1, 1]) {
      const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 40, 0.5, 8), new THREE.MeshStandardMaterial({ color: '#c0c4cc', metalness: 0.7, roughness: 0.3, emissive: '#1a2a44' }));
      tube.position.z = s * 4;
      this.scene.add(tube);
    }
    // a road bridge nearer the fort, with its lights
    const rb = new THREE.Mesh(new THREE.BoxGeometry(BANK * 2, 1.6, 16), new THREE.MeshStandardMaterial({ color: '#4a4540', roughness: 0.8 }));
    rb.position.set(0, 1, -60);
    this.scene.add(rb);
    for (let i = 0; i < 6; i++) {
      const p = new THREE.Mesh(new THREE.BoxGeometry(4, 6, 12), new THREE.MeshStandardMaterial({ color: '#4a4540' }));
      p.position.set(-60 + i * 24, -2, -60);
      this.scene.add(p);
    }
  }

  /** Rickshaws, yellow and green, running the roads with their lamps on. */
  private traffic() {
    const paths: THREE.Vector3[][] = [
      [new THREE.Vector3(-BANK - 7, 0, -1100), new THREE.Vector3(-BANK - 7, 0, 1100)],
      [new THREE.Vector3(-BANK - 13, 0, 1100), new THREE.Vector3(-BANK - 13, 0, -1100)],
      [new THREE.Vector3(BANK + 7, 0, -1100), new THREE.Vector3(BANK + 7, 0, 1100)],
      [new THREE.Vector3(BANK + 13, 0, 1100), new THREE.Vector3(BANK + 13, 0, -1100)],
      [new THREE.Vector3(-950, 0, -57), new THREE.Vector3(-BANK, 0, -57), new THREE.Vector3(BANK, 2, -57), new THREE.Vector3(fxEnd(), 0, -57)],
      [new THREE.Vector3(fxEnd(), 0, -63), new THREE.Vector3(BANK, 2, -63), new THREE.Vector3(-BANK, 0, -63), new THREE.Vector3(-950, 0, -63)],
      [new THREE.Vector3(-950, 0, -217), new THREE.Vector3(-BANK - 20, 0, -217)],
    ];
    const r = mulberry(5150);
    for (let i = 0; i < (this.low ? 60 : 140); i++) {
      const path = paths[i % paths.length]!;
      let len = 0;
      for (let k = 1; k < path.length; k++) len += path[k]!.distanceTo(path[k - 1]!);
      this.movers.push({ path, len, s0: r() * len, speed: 7 + r() * 6 });
    }
    // body, with the black canopy, as one mesh; and the headlamp as another
    const body = new THREE.BoxGeometry(1.4, 1.1, 2.6);
    body.translate(0, 0.9, 0);
    const top = new THREE.BoxGeometry(1.5, 0.3, 2.2);
    top.translate(0, 1.9, -0.1);
    const geo = mergeGeometries([body, top])!;
    this.rickshaws = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.6 }), this.movers.length * 1);
    this.movers.forEach((_, i) => this.rickshaws.setColorAt(i, new THREE.Color(i % 3 === 0 ? '#e8c21a' : i % 3 === 1 ? '#1f8a3a' : '#e8c21a')));
    this.rickshaws.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.scene.add(this.rickshaws);
    this.headlamps = new THREE.InstancedMesh(new THREE.SphereGeometry(0.25, 6, 4), new THREE.MeshBasicMaterial({ color: new THREE.Color(6, 5, 3) }), this.movers.length);
    this.headlamps.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.scene.add(this.headlamps);
    function fxEnd() { return 205; }
  }
  private headlamps!: THREE.InstancedMesh;

  /**
   * Every bulb in the city, as one instanced mesh: the radial strings over the
   * garba ground, the ring round its edge, the zigzags across the pol lanes,
   * strings along the fort and the gate, and a line along the riverfront wall.
   */
  private buildBulbs() {
    const pts: { p: THREE.Vector3; c: THREE.Color; chase: number }[] = [];
    const put = (p: THREE.Vector3, col: string, chase: number) => pts.push({ p, c: new THREE.Color(col), chase });
    const c = GROUND;
    const top = new THREE.Vector3(c.x, 24, c.z);
    const spokes = this.low ? 24 : 40;
    for (let i = 0; i < spokes; i++) {
      const a = (i / spokes) * Math.PI * 2;
      const end = new THREE.Vector3(c.x + Math.cos(a) * (GROUND_R + 4), 9, c.z + Math.sin(a) * (GROUND_R + 4));
      const line = catenary(top, end, 4, this.low ? 30 : 60);
      line.forEach((p, k) => put(p, BULBS[(i + Math.floor(k / 6)) % BULBS.length]!, k * 0.3 + i));
    }
    for (let i = 0; i < 360; i++) {
      const a = (i / 360) * Math.PI * 2;
      put(new THREE.Vector3(c.x + Math.cos(a) * (GROUND_R + 4), 9 - Math.abs(Math.sin(i * 0.5)) * 0.8, c.z + Math.sin(a) * (GROUND_R + 4)), BULBS[i % 3]!, i * 0.2);
    }
    // the pols: a zigzag between the balconies on either side of each lane
    this.polLanes.forEach((lane, li) => {
      if (this.low && li % 2 && Math.abs(lane.z - CHOWK.z) > 30) return;
      for (let x = lane.x0 + 4; x < lane.x1 - 10; x += 14) {
        const a = new THREE.Vector3(x, 8.5, lane.z - 3);
        const b = new THREE.Vector3(x + 7, 8.5, lane.z + 3);
        const d = new THREE.Vector3(x + 14, 8.5, lane.z - 3);
        const col = BULBS[Math.floor(hash(x + lane.z) * BULBS.length)]!;
        for (const p of catenary(a, b, 1.2, 8)) put(p, col, x * 0.1);
        for (const p of catenary(b, d, 1.2, 8)) put(p, col, x * 0.1 + 1);
      }
    });
    // the chowk: a canopy of strings from the middle to the houses round it
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const line = catenary(new THREE.Vector3(CHOWK.x, 12, CHOWK.z), new THREE.Vector3(CHOWK.x + Math.cos(a) * 20, 9, CHOWK.z + Math.sin(a) * 20), 2, 24);
      line.forEach((p, k) => put(p, BULBS[(i + k) % BULBS.length]!, k * 0.4));
    }
    // outlines on the fort, the gate and the temple
    const outline = (x0: number, z0: number, x1: number, z1: number, y: number, n: number, col: string) => {
      for (let i = 0; i <= n; i++) put(new THREE.Vector3(x0 + ((x1 - x0) * i) / n, y, z0 + ((z1 - z0) * i) / n), col, i * 0.5);
    };
    outline(125, -72.5, 205, -72.5, 14, 80, '#ffb13b');
    outline(125, -7.5, 205, -7.5, 14, 80, '#ffb13b');
    outline(268.5, -57, 268.5, -23, 15.3, 36, '#ffe45c');
    outline(315, -53.5, 375, -53.5, 12.4, 60, '#ffffff');
    outline(315, -26.5, 375, -26.5, 12.4, 60, '#ffffff');
    // the riverfront walls, both banks
    for (const s of [-1, 1]) outline(s * BANK, -1100, s * BANK, 1100, 0.9, this.low ? 300 : 700, s < 0 ? '#ffd27a' : '#ff8ad0');
    this.bulbs = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.16, 1), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.6, 2.6, 2.6) }), pts.length);
    pts.forEach(({ p, c: col, chase }, i) => {
      this.bulbs.setMatrixAt(i, new THREE.Matrix4().makeTranslation(p.x, p.y, p.z));
      this.bulbs.setColorAt(i, col);
      this.bulbBase.push(col);
      this.bulbChase.push(chase);
    });
    this.scene.add(this.bulbs);
    this.count.bulbs = pts.length;
  }

  /**
   * The dancers. One figure — a flared skirt, a bodice, a dupatta, arms up
   * for the clap — as two instanced meshes: the cloth, coloured per dancer,
   * and the skin. Each ring turns the opposite way to the one inside it.
   */
  private buildDancers() {
    const r = mulberry(909);
    const ring = (center: THREE.Vector3, radius: number, idx: number, spacing: number) => {
      const n = Math.floor((Math.PI * 2 * radius) / spacing);
      for (let i = 0; i < n; i++) {
        this.dancers.push({
          ring: idx,
          r: radius + (r() - 0.5) * 0.8,
          a0: (i / n) * Math.PI * 2 + r() * 0.05,
          speed: (idx % 2 ? -1 : 1) * (0.9 + r() * 0.1) / radius,
          phase: r(),
          scale: 0.9 + r() * 0.2,
          center,
        });
      }
    };
    const radii = this.low ? [15, 22, 30, 38, 46] : [14, 19.5, 25, 30.5, 36, 41.5, 47, 52.5, 58, 63.5];
    radii.forEach((rad, i) => ring(GROUND, rad, i, 1.35));
    [5.5, 9, 12.5].forEach((rad, i) => ring(CHOWK, rad, i, 1.3));

    const skirt = new THREE.CylinderGeometry(0.16, 0.62, 0.95, 14, 1, true);
    skirt.translate(0, 0.48, 0);
    const bodice = new THREE.CylinderGeometry(0.18, 0.2, 0.55, 8);
    bodice.translate(0, 1.2, 0);
    // the dupatta, hanging down the back from the shoulders
    const dupatta = new THREE.BoxGeometry(0.42, 0.75, 0.03);
    dupatta.rotateX(0.18);
    dupatta.translate(0, 1.05, -0.24);
    const cloth = mergeGeometries([skirt, bodice, dupatta])!;
    const head = new THREE.SphereGeometry(0.14, 10, 8);
    head.translate(0, 1.62, 0);
    const armL = new THREE.CylinderGeometry(0.04, 0.045, 0.6, 6);
    armL.rotateZ(0.5);
    armL.translate(-0.28, 1.55, 0);
    const armR = armL.clone();
    armR.rotateY(Math.PI);
    const skin = mergeGeometries([head, armL, armR])!;
    const clothMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.55, metalness: 0.15, side: THREE.DoubleSide, emissive: '#1a0a14' });
    this.cloth = new THREE.InstancedMesh(cloth, clothMat, this.dancers.length);
    this.skin = new THREE.InstancedMesh(skin, new THREE.MeshStandardMaterial({ color: '#b07a52', roughness: 0.7 }), this.dancers.length);
    this.cloth.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.skin.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.dancers.forEach((_, i) => this.cloth.setColorAt(i, new THREE.Color(FESTIVE[Math.floor(r() * FESTIVE.length)])));
    this.scene.add(this.cloth, this.skin);
    this.count.dancers = this.dancers.length;
  }

  /** Fireworks over the ground: shells, each a sphere of sparks, on a loop. */
  private buildFireworks() {
    const SHELLS = 6;
    const SPARKS = 160;
    this.fwPos = new Float32Array(SHELLS * SPARKS * 3);
    this.fwCol = new Float32Array(SHELLS * SPARKS * 3);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.fwPos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(this.fwCol, 3));
    this.fireworks = new THREE.Points(g, new THREE.PointsMaterial({ size: 2.2, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    this.fireworks.frustumCulled = false;
    this.scene.add(this.fireworks);
  }

  /* ── the camera ────────────────────────────────────────────────────── */

  private orbitOf(p: Place) {
    const pos = new THREE.Vector3(...p.pos);
    const t = new THREE.Vector3(...p.look);
    const d = pos.clone().sub(t);
    const dist = d.length();
    return { t, az: Math.atan2(d.x, d.z), el: Math.asin(clamp(d.y / dist, -1, 1)), dist };
  }

  goTo(p: Place, dur = 3.2) {
    const to = this.orbitOf(p);
    if (dur <= 0) {
      this.target.copy(to.t);
      this.az = to.az;
      this.el = to.el;
      this.dist = to.dist;
      this.flight = null;
      return;
    }
    // come the short way round
    let az = to.az;
    while (az - this.az > Math.PI) az -= Math.PI * 2;
    while (az - this.az < -Math.PI) az += Math.PI * 2;
    this.flight = { from: { t: this.target.clone(), az: this.az, el: this.el, dist: this.dist }, to: { ...to, az }, t0: performance.now() / 1000, dur };
  }

  orbit(dAz: number, dEl: number) {
    this.flight = null;
    this.az -= dAz;
    this.el = clamp(this.el + dEl, 0.02, 1.45);
  }
  zoom(k: number) {
    this.flight = null;
    this.dist = clamp(this.dist * k, 4, 900);
  }

  resize(w: number, h: number) {
    this.camera.aspect = w / Math.max(1, h);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
    this.composer.setSize(w, h);
    this.bloom.resolution.set(this.low ? w / 2 : w, this.low ? h / 2 : h);
  }

  /** Where the camera is, for the page to set the music's loudness by. */
  distanceToGarba() {
    const d1 = this.camera.position.distanceTo(GROUND);
    const d2 = this.camera.position.distanceTo(CHOWK) * 1.6;
    return Math.min(d1, d2);
  }

  /* ── every frame ───────────────────────────────────────────────────── */

  frame() {
    const now = performance.now() / 1000;
    const t = now - this.clock;
    // the camera, flying or orbiting
    if (this.flight) {
      const f = this.flight;
      const k = ease(clamp((now - f.t0) / f.dur));
      this.target.lerpVectors(f.from.t, f.to.t, k);
      this.az = f.from.az + (f.to.az - f.from.az) * k;
      this.el = f.from.el + (f.to.el - f.from.el) * k;
      // go up and over on the long flights rather than through the buildings
      const hop = Math.sin(k * Math.PI) * Math.min(1, f.from.t.distanceTo(f.to.t) / 400) * 0.5;
      this.el = Math.min(1.4, this.el + hop);
      this.dist = f.from.dist * Math.pow(f.to.dist / f.from.dist, k) * (1 + hop * 1.5);
      if (k >= 1) this.flight = null;
    }
    const cp = new THREE.Vector3(
      this.target.x + Math.sin(this.az) * Math.cos(this.el) * this.dist,
      this.target.y + Math.sin(this.el) * this.dist,
      this.target.z + Math.cos(this.az) * Math.cos(this.el) * this.dist,
    );
    cp.y = Math.max(cp.y, 1.5);
    this.camera.position.copy(cp);
    this.camera.lookAt(this.target);

    const bt = this.beatTime ? this.beatTime() : t;
    this.stepDancers(bt);
    this.stepBulbs(t);
    this.stepTraffic(t);
    this.stepFireworks(t);
    for (let i = 0; i < this.flames.length; i++) {
      const f = this.flames[i]!;
      f.scale.y = 0.8 + 0.3 * Math.sin(t * 13 + i * 2) + 0.15 * Math.sin(t * 29 + i);
    }
    this.shrineLight.intensity = 170 + 25 * Math.sin(t * 9) + 15 * Math.sin(t * 23);
    this.composer.render();
  }

  private m = new THREE.Matrix4();
  private q = new THREE.Quaternion();
  private v = new THREE.Vector3();
  private s = new THREE.Vector3();
  private up = new THREE.Vector3(0, 1, 0);

  /**
   * Garba, as geometry: every dancer goes round, and every six steps of the
   * dhol they take three steps forward, clap, and turn once on the spot.
   */
  private stepDancers(bt: number) {
    const step = this.beat;
    for (let i = 0; i < this.dancers.length; i++) {
      const d = this.dancers[i]!;
      const phrase = bt / (step * 6) + d.phase * 0.08;
      const inPhrase = phrase - Math.floor(phrase);
      // forward on the first half of the phrase, turning on the second
      const travel = Math.floor(phrase) * 0.5 + Math.min(inPhrase, 0.5);
      const a = d.a0 + travel * d.speed * 6 * 1.6;
      const x = d.center.x + Math.cos(a) * d.r;
      const z = d.center.z + Math.sin(a) * d.r;
      const facing = Math.atan2(-Math.sin(a) * Math.sign(d.speed), Math.cos(a) * Math.sign(d.speed));
      const turn = inPhrase > 0.5 ? ease((inPhrase - 0.5) * 2) * Math.PI * 2 : 0;
      const bob = Math.abs(Math.sin((bt / step) * Math.PI)) * 0.08;
      const flare = 1 + (inPhrase > 0.5 ? Math.sin((inPhrase - 0.5) * 2 * Math.PI) * 0.35 : 0);
      this.q.setFromAxisAngle(this.up, facing + turn);
      this.v.set(x, bob, z);
      this.s.set(d.scale * flare, d.scale, d.scale * flare);
      this.m.compose(this.v, this.q, this.s);
      this.cloth.setMatrixAt(i, this.m);
      this.s.set(d.scale, d.scale, d.scale);
      this.m.compose(this.v, this.q, this.s);
      this.skin.setMatrixAt(i, this.m);
    }
    this.cloth.instanceMatrix.needsUpdate = true;
    this.skin.instanceMatrix.needsUpdate = true;
  }

  private tmpC = new THREE.Color();
  /** The strings chase: a wave of brightness running along each one. */
  private stepBulbs(t: number) {
    const n = this.bulbBase.length;
    for (let i = 0; i < n; i++) {
      const k = 0.55 + 0.45 * Math.max(0, Math.sin(t * 3 - this.bulbChase[i]!));
      this.tmpC.copy(this.bulbBase[i]!).multiplyScalar(k);
      this.bulbs.setColorAt(i, this.tmpC);
    }
    this.bulbs.instanceColor!.needsUpdate = true;
  }

  private stepTraffic(t: number) {
    for (let i = 0; i < this.movers.length; i++) {
      const mv = this.movers[i]!;
      let s = (mv.s0 + t * mv.speed) % mv.len;
      let k = 1;
      while (k < mv.path.length) {
        const seg = mv.path[k]!.distanceTo(mv.path[k - 1]!);
        if (s <= seg) break;
        s -= seg;
        k++;
      }
      const a = mv.path[k - 1]!;
      const b = mv.path[Math.min(k, mv.path.length - 1)]!;
      const seg = Math.max(0.001, a.distanceTo(b));
      this.v.copy(a).lerp(b, s / seg);
      const yaw = Math.atan2(b.x - a.x, b.z - a.z);
      this.q.setFromAxisAngle(this.up, yaw);
      this.s.set(1, 1, 1);
      this.m.compose(this.v, this.q, this.s);
      this.rickshaws.setMatrixAt(i, this.m);
      this.v.x += Math.sin(yaw) * 1.4;
      this.v.z += Math.cos(yaw) * 1.4;
      this.v.y += 0.9;
      this.m.makeTranslation(this.v.x, this.v.y, this.v.z);
      this.headlamps.setMatrixAt(i, this.m);
    }
    this.rickshaws.instanceMatrix.needsUpdate = true;
    this.headlamps.instanceMatrix.needsUpdate = true;
  }

  private stepFireworks(t: number) {
    const SHELLS = 6;
    const SPARKS = 160;
    const LIFE = 3.2;
    const g = 9;
    for (let s = 0; s < SHELLS; s++) {
      const cycle = 7 + hash(s) * 4;
      const age = (t + s * 1.7) % cycle;
      const n = Math.floor((t + s * 1.7) / cycle);
      const cx = GROUND.x + (hash(s * 7 + n) - 0.5) * 140;
      const cz = GROUND.z + (hash(s * 11 + n) - 0.5) * 140;
      const cy = 90 + hash(s * 13 + n) * 50;
      const col = new THREE.Color(BULBS[Math.floor(hash(s * 17 + n) * 6)]!);
      for (let i = 0; i < SPARKS; i++) {
        const j = (s * SPARKS + i) * 3;
        if (age > LIFE) {
          this.fwPos[j + 1] = -1000;
          continue;
        }
        const u = hash(i * 1.7 + s);
        const v = hash(i * 2.9 + s * 3);
        const th = u * Math.PI * 2;
        const ph = Math.acos(2 * v - 1);
        const sp = 26 + hash(i * 5.3) * 6;
        const dx = Math.sin(ph) * Math.cos(th);
        const dy = Math.cos(ph);
        const dz = Math.sin(ph) * Math.sin(th);
        const drag = (1 - Math.exp(-age * 1.4)) / 1.4;
        this.fwPos[j] = cx + dx * sp * drag;
        this.fwPos[j + 1] = cy + dy * sp * drag - 0.5 * g * age * age * 0.35;
        this.fwPos[j + 2] = cz + dz * sp * drag;
        const fade = Math.max(0, 1 - age / LIFE) * (0.7 + 0.3 * Math.sin(age * 30 + i));
        this.fwCol[j] = col.r * fade * 3;
        this.fwCol[j + 1] = col.g * fade * 3;
        this.fwCol[j + 2] = col.b * fade * 3;
      }
    }
    this.fireworks.geometry.attributes.position!.needsUpdate = true;
    this.fireworks.geometry.attributes.color!.needsUpdate = true;
  }

  dispose() {
    this.renderer.dispose();
    this.composer.dispose();
  }
}
