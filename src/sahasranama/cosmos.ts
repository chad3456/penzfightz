import * as THREE from 'three';
import { cropTop, paintPlates, type Plate, type PlateName } from './painting';

/**
 * The cosmos: one cloud of brush strokes that paints one picture after another.
 *
 * Every particle is a stroke — a short bristled dab with a direction and a
 * length — and knows where it came from and where it is going. Most formations
 * are paintings (painting.ts): each plate is sampled into strokes that take
 * their colour from the paint, their direction from the grain of the picture
 * (a structure tensor, so strokes run along edges and round forms), their
 * length from how busy it is there (long in the sky, short in a face) and
 * their depth from the plate's depth layer. The rest are built from geometry:
 * the cosmic body of the Dhyana shloka, a galaxy, drifting petals.
 *
 * The paint never quite dries: strokes breathe and drift, a slow wind ripples
 * through them along their own directions, and the pointer stirs a vortex.
 * Morphing between formations pours the strokes rather than jumping them.
 *
 * Every stroke also carries one of the thousand names. Click a stroke and the
 * page is told which name it is, and every other stroke carrying that name
 * lights up across the painting.
 *
 * A second, smaller cloud holds the thousand names as stars you can touch, in
 * the galaxy.
 */

export type FormationName = 'face' | 'arrows' | 'lotus' | 'body' | 'vishvarupa' | 'galaxy' | 'hero' | 'dust';
interface Formation { pos: Float32Array; col: Float32Array; sty: Float32Array }

export type Theme = 'dawn' | 'dusk' | 'night';
export const THEME_BG: Record<Theme, string> = { dawn: '#f4ecdf', dusk: '#3a1c2e', night: '#01030d' };

const PLATE_OF: Partial<Record<FormationName, PlateName>> = { face: 'faces', arrows: 'arrows', lotus: 'lotus', vishvarupa: 'vishvarupa', hero: 'portrait' };

const VERT = /* glsl */ `
attribute vec3 aFrom;
attribute vec3 aTo;
attribute vec3 cFrom;
attribute vec3 cTo;
attribute vec2 sFrom;
attribute vec2 sTo;
attribute float aSeed;
attribute float aName;
uniform float uT;
uniform float uTime;
uniform float uSize;
uniform float uBurst;
uniform vec2 uMouse;
uniform float uAspect;
uniform float uPx;
uniform float uPick;
uniform float uStir;
varying vec3 vCol;
varying float vAng;
varying float vSeed;
varying float vHi;
void main() {
  float k = clamp((uT - aSeed * 0.45) / 0.55, 0.0, 1.0);
  k = k * k * (3.0 - 2.0 * k);
  vec3 p = mix(aFrom, aTo, k);
  float mid = sin(k * 3.14159);
  // in transit, the strokes swirl
  p += vec3(sin(aSeed * 91.0 + uTime * 0.7), cos(aSeed * 57.0 + uTime * 0.6), sin(aSeed * 33.0 + uTime * 0.5)) * mid * 1.8;
  vec2 s = mix(sFrom, sTo, k);
  float ang = s.x;
  // the paint breathes, and a wind runs through it along its own grain
  float ph = uTime * 0.45 + aSeed * 6.2831;
  p.xy += 0.03 * vec2(sin(ph + p.y * 0.9), cos(ph * 0.8 + p.x * 0.7));
  float wv = sin(p.x * 0.7 - uTime * 1.3 + p.y * 0.35);
  p.xy += 0.035 * wv * vec2(cos(ang), -sin(ang));
  p.z += 0.06 * sin(ph * 1.3);
  p += normalize(p + vec3(0.0001)) * uBurst * (2.0 + aSeed * 6.0);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vec4 cp = projectionMatrix * mv;
  // the pointer stirs the paint: a vortex round it
  vec2 ndc = cp.xy / cp.w;
  vec2 d = (ndc - uMouse) * vec2(uAspect, 1.0);
  float r2 = dot(d, d);
  float swirl = exp(-r2 * 16.0) * (0.55 + uStir);
  float cs = cos(swirl), sn = sin(swirl);
  vec2 dr = vec2(cs * d.x - sn * d.y, sn * d.x + cs * d.y) * (1.0 + exp(-r2 * 40.0) * 0.25);
  cp.xy += (dr - d) / vec2(uAspect, 1.0) * cp.w;
  gl_Position = cp;
  float hi = abs(aName - uPick) < 0.5 ? 1.0 : 0.0;
  vHi = hi;
  gl_PointSize = uPx * uSize * s.y * (0.8 + aSeed * 0.4) * (1.0 + hi * 0.9) / max(0.5, -mv.z);
  vCol = mix(cFrom, cTo, k);
  vAng = ang + swirl * 0.8 + wv * 0.08;
  vSeed = aSeed;
}`;

const FRAG = /* glsl */ `
varying vec3 vCol;
varying float vAng;
varying float vSeed;
varying float vHi;
void main() {
  vec2 p = gl_PointCoord - 0.5;
  float c = cos(vAng), s = sin(vAng);
  // along the stroke, and across it
  float u = c * p.x + s * p.y;
  float v = -s * p.x + c * p.y;
  float w = 0.16 * (1.0 - 1.6 * u * u) + 0.02;
  float e = (u * u) / 0.25 + (v * v) / (w * w);
  if (e > 1.0) discard;
  // bristles: fine stripes along the stroke, and a dry, broken tail
  float bristle = 0.84 + 0.16 * sin(v * 110.0 + vSeed * 50.0);
  float gap = step(0.8, fract(sin(v * 300.0 + vSeed * 9.0) * 43758.5));
  if (gap > 0.5 && u > 0.3) discard;
  vec3 col = vCol * bristle * (0.94 + 0.12 * (1.0 - e));
  col = mix(col, vec3(1.0, 0.93, 0.62), vHi * 0.55);
  gl_FragColor = vec4(col, 1.0);
}`;

const STAR_VERT = /* glsl */ `
attribute float aSize;
attribute vec3 aCol;
uniform float uTime;
uniform float uShow;
uniform float uHover;
uniform float uPx;
varying vec3 vCol;
varying float vA;
attribute float aIdx;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  float hov = abs(aIdx - uHover) < 0.5 ? 2.4 : 1.0;
  gl_PointSize = aSize * hov * (0.85 + 0.15 * sin(uTime * 2.0 + aIdx)) * uPx * 300.0 / max(0.5, -mv.z);
  vCol = aCol;
  vA = uShow;
}`;
const STAR_FRAG = /* glsl */ `
varying vec3 vCol;
varying float vA;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float r = length(c);
  if (r > 0.5) discard;
  float core = smoothstep(0.18, 0.0, r);
  float halo = smoothstep(0.5, 0.0, r) * 0.45;
  gl_FragColor = vec4(vCol * (core * 1.6 + halo), (core + halo) * vA);
}`;

function rnd(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const BLUE = new THREE.Color('#4a7cf0');
const DEEP = new THREE.Color('#1f3fae');
const GOLD = new THREE.Color('#ffbf4a');
const WHITE = new THREE.Color('#f4f0ff');
const PINK = new THREE.Color('#ef5a8e');


/**
 * Turn a painted plate into strokes. Each stroke lands on a pixel, chosen more
 * often where the picture has edges or colour; it takes that pixel's colour,
 * runs along the local grain, is long where the picture is quiet and short
 * where it is busy, and sits at the plate's depth there. The plate's rim
 * dissolves into scattered strokes rather than ending in a hard rectangle.
 */
function samplePlate(p: Plate, n: number, seed: number): Formation {
  const { w, h, rgba, depth } = p;
  // plate pixels to world units: every picture is ten units tall, centred
  const UNIT = 10 / h;
  // the grain, at half size: a structure tensor, smoothed
  const hw = w >> 1;
  const hh = h >> 1;
  const L = new Float32Array(hw * hh);
  for (let y = 0; y < hh; y++) {
    for (let x = 0; x < hw; x++) {
      const i = (y * 2 * w + x * 2) * 4;
      L[y * hw + x] = (0.3 * rgba[i]! + 0.59 * rgba[i + 1]! + 0.11 * rgba[i + 2]!) / 255;
    }
  }
  const jxx = new Float32Array(hw * hh);
  const jyy = new Float32Array(hw * hh);
  const jxy = new Float32Array(hw * hh);
  for (let y = 1; y < hh - 1; y++) {
    for (let x = 1; x < hw - 1; x++) {
      const i = y * hw + x;
      const gx = L[i + 1]! - L[i - 1]! + 0.5 * (L[i - hw + 1]! - L[i - hw - 1]! + L[i + hw + 1]! - L[i + hw - 1]!);
      const gy = L[i + hw]! - L[i - hw]! + 0.5 * (L[i + hw - 1]! - L[i - hw - 1]! + L[i + hw + 1]! - L[i - hw + 1]!);
      jxx[i] = gx * gx;
      jyy[i] = gy * gy;
      jxy[i] = gx * gy;
    }
  }
  const blur = (a: Float32Array, r: number) => {
    const t = new Float32Array(a.length);
    const norm = 1 / ((2 * r + 1) * (2 * r + 1));
    for (let y = 0; y < hh; y++) {
      let acc = 0;
      for (let x = -r; x < hw; x++) {
        if (x + r < hw) acc += a[y * hw + x + r]!;
        if (x - r - 1 >= 0) acc -= a[y * hw + x - r - 1]!;
        if (x >= 0) t[y * hw + x] = acc;
      }
    }
    const o = new Float32Array(a.length);
    for (let x = 0; x < hw; x++) {
      let acc = 0;
      for (let y = -r; y < hh; y++) {
        if (y + r < hh) acc += t[(y + r) * hw + x]!;
        if (y - r - 1 >= 0) acc -= t[(y - r - 1) * hw + x]!;
        if (y >= 0) o[y * hw + x] = acc * norm;
      }
    }
    return o;
  };
  const bxx = blur(jxx, 4);
  const byy = blur(jyy, 4);
  const bxy = blur(jxy, 4);
  const hidx = (x: number, y: number) => Math.min(hh - 1, Math.max(0, y >> 1)) * hw + Math.min(hw - 1, Math.max(0, x >> 1));
  const edgeAt = (x: number, y: number) => {
    const i = hidx(x, y);
    return Math.min(1, Math.sqrt(bxx[i]! + byy[i]!) * 6);
  };
  // where to put strokes
  const wts = new Float32Array(w * h);
  let tot = 0;
  for (let y = 0; y < h; y++) {
    const fy = Math.min(1, Math.min(y, h - 1 - y) / 70);
    for (let x = 0; x < w; x++) {
      const fx = Math.min(1, Math.min(x, w - 1 - x) / 70);
      const i = y * w + x;
      const r = rgba[i * 4]!;
      const g = rgba[i * 4 + 1]!;
      const b = rgba[i * 4 + 2]!;
      const sat = (Math.max(r, g, b) - Math.min(r, g, b)) / 255;
      tot += (0.9 + edgeAt(x, y) * 1.3 + sat * 0.3 + (depth[i]! / 255) * 0.4) * fx * fy;
      wts[i] = tot;
    }
  }
  const R = rnd(seed);
  const pos = new Float32Array(n * 3);
  const col = new Float32Array(n * 3);
  const sty = new Float32Array(n * 2);
  for (let k = 0; k < n; k++) {
    const t = R() * tot;
    let lo = 0;
    let hi = wts.length - 1;
    while (lo < hi) {
      const m = (lo + hi) >> 1;
      if (wts[m]! < t) lo = m + 1;
      else hi = m;
    }
    const px = lo % w;
    const py = Math.floor(lo / w);
    const x = px + R() - 0.5;
    const y = py + R() - 0.5;
    const rim = Math.min(x, w - x, y, h - y);
    pos[k * 3] = (x - w / 2) * UNIT;
    pos[k * 3 + 1] = -(y - h / 2) * UNIT;
    pos[k * 3 + 2] = (depth[lo]! / 255 - 0.45) * 2.6 + (R() - 0.5) * 0.12 + (rim < 70 ? (R() - 0.5) * (70 - rim) * 0.02 : 0);
    const c = lo * 4;
    // a touch more saturation, as paint has
    let r = rgba[c]! / 255;
    let g = rgba[c + 1]! / 255;
    let b = rgba[c + 2]! / 255;
    const l = 0.3 * r + 0.59 * g + 0.11 * b;
    r = l + (r - l) * 1.12;
    g = l + (g - l) * 1.12;
    b = l + (b - l) * 1.12;
    col[k * 3] = r;
    col[k * 3 + 1] = g;
    col[k * 3 + 2] = b;
    const i2 = hidx(px, py);
    const xx = bxx[i2]!;
    const yy = byy[i2]!;
    const xy = bxy[i2]!;
    // the direction of least change: along edges and round forms
    const ang = 0.5 * Math.atan2(2 * xy, xx - yy) + Math.PI / 2 + (R() - 0.5) * 0.35;
    const coh = Math.sqrt((xx - yy) * (xx - yy) + 4 * xy * xy) / (xx + yy + 1e-9);
    const busy = edgeAt(px, py);
    sty[k * 2] = xx + yy < 1e-8 ? R() * Math.PI : ang;
    sty[k * 2 + 1] = (1.45 - busy * 0.85) * (0.8 + coh * 0.3) * (0.75 + R() * 0.5);
  }
  return { pos, col, sty };
}

function build(n: number, fill: (i: number, R: () => number, p: THREE.Vector3, c: THREE.Color, s: THREE.Vector2) => void, seed: number): Formation {
  const R = rnd(seed);
  const pos = new Float32Array(n * 3);
  const col = new Float32Array(n * 3);
  const sty = new Float32Array(n * 2);
  const p = new THREE.Vector3();
  const c = new THREE.Color();
  const s = new THREE.Vector2();
  for (let i = 0; i < n; i++) {
    s.set(R() * Math.PI, 0.9);
    fill(i, R, p, c, s);
    pos[i * 3] = p.x; pos[i * 3 + 1] = p.y; pos[i * 3 + 2] = p.z;
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    sty[i * 2] = s.x; sty[i * 2 + 1] = s.y;
  }
  return { pos, col, sty };
}

/** Where the parts of the cosmic body are, in formation space (for the labels). */
export const BODY_ANCHORS: [string, string, string, THREE.Vector3][] = [
  ['dyauḥ', 'heaven', 'His head', new THREE.Vector3(0, 4.6, 0.5)],
  ['candra-sūryau', 'the moon and the sun', 'His eyes', new THREE.Vector3(0.0, 3.7, 1.2)],
  ['āśāḥ', 'the directions', 'His ears', new THREE.Vector3(-1.6, 3.3, 0.6)],
  ['dahanaḥ', 'fire', 'His mouth', new THREE.Vector3(0, 3.1, 1.2)],
  ['anilaḥ', 'the wind', 'His breath', new THREE.Vector3(1.6, 2.6, 0.8)],
  ['viyat', 'the sky', 'His navel', new THREE.Vector3(0, -0.3, 1.1)],
  ['abdhiḥ', 'the ocean', 'His belly', new THREE.Vector3(-1.2, -1.0, 0.8)],
  ['bhūḥ', 'the earth', 'His feet', new THREE.Vector3(0, -4.2, 0.6)],
];

export class Cosmos {
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(42, 1, 0.1, 200);
  group = new THREE.Group();
  points: THREE.Points;
  stars: THREE.Points;
  mat: THREE.ShaderMaterial;
  starMat: THREE.ShaderMaterial;
  n: number;
  forms: Partial<Record<FormationName, Formation>> = {};
  current: FormationName = 'dust';
  /** Which of the thousand names each stroke carries (0-based). */
  names: Float32Array;
  private wanted: FormationName = 'dust';
  /** A softened copy of each painting, behind its strokes, so no page shows through the gaps. */
  private under = new Map<FormationName, THREE.Mesh>();
  private morphT = 1;
  private rotV = new THREE.Vector2();
  private rot = new THREE.Vector2();
  private drag: { x: number; y: number; moved: number } | null = null;
  private raf = 0;
  private last = performance.now();
  private burst = 0;
  private stir = 0;
  hover = -1;
  onHover: ((i: number, x: number, y: number) => void) | null = null;
  /** A stroke was clicked: which one, which name (0-based), and where. */
  onPick: ((i: number, name: number, x: number, y: number) => void) | null = null;
  starsVisible = 0;
  private starsTarget = 0;
  private ray = new THREE.Raycaster();
  private mouseNdc = new THREE.Vector2(9, 9);
  camZ = 13;
  private camZT = 13;
  private shift = 0;
  private shiftT = 0;
  private wide = false;
  private vw = 1;
  private vh = 1;

  constructor(canvas: HTMLCanvasElement, private base: string, low: boolean, theme: Theme = 'dawn') {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(low ? 1 : 1.75, window.devicePixelRatio || 1));
    this.setTheme(theme);
    this.n = low ? 60000 : 140000;
    this.scene.add(this.group);
    this.camera.position.set(0, 0, 13);
    const geo = new THREE.BufferGeometry();
    const n = this.n;
    const seeds = new Float32Array(n);
    this.names = new Float32Array(n);
    const R = rnd(3);
    for (let i = 0; i < n; i++) {
      seeds[i] = R();
      this.names[i] = Math.floor(R() * 1000);
    }
    const dust = this.dust();
    this.forms.dust = dust;
    geo.setAttribute('position', new THREE.BufferAttribute(dust.pos.slice(), 3));
    geo.setAttribute('aFrom', new THREE.BufferAttribute(dust.pos.slice(), 3));
    geo.setAttribute('aTo', new THREE.BufferAttribute(dust.pos.slice(), 3));
    geo.setAttribute('cFrom', new THREE.BufferAttribute(dust.col.slice(), 3));
    geo.setAttribute('cTo', new THREE.BufferAttribute(dust.col.slice(), 3));
    geo.setAttribute('sFrom', new THREE.BufferAttribute(dust.sty.slice(), 2));
    geo.setAttribute('sTo', new THREE.BufferAttribute(dust.sty.slice(), 2));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
    geo.setAttribute('aName', new THREE.BufferAttribute(this.names, 1));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 60);
    this.mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uT: { value: 1 }, uTime: { value: 0 }, uSize: { value: low ? 150 : 118 }, uBurst: { value: 0 }, uMouse: { value: new THREE.Vector2(9, 9) },
        uAspect: { value: 1 }, uPx: { value: 1 }, uPick: { value: -1 }, uStir: { value: 0 },
      },
      depthTest: true,
      depthWrite: true,
    });
    this.points = new THREE.Points(geo, this.mat);
    this.group.add(this.points);
    // the thousand names
    const sg = new THREE.BufferGeometry();
    const sp = new Float32Array(1000 * 3);
    const sc = new Float32Array(1000 * 3);
    const ss = new Float32Array(1000);
    const si = new Float32Array(1000);
    for (let i = 0; i < 1000; i++) {
      const arm = i % 4;
      const t = i / 1000;
      const r = 0.8 + t * 7.5;
      const a = arm * (Math.PI / 2) + r * 0.62;
      sp[i * 3] = Math.cos(a) * r + Math.sin(i * 7.1) * 0.18;
      sp[i * 3 + 1] = Math.sin(a) * r * 0.62 + Math.cos(i * 3.3) * 0.18;
      sp[i * 3 + 2] = Math.sin(i * 1.7) * 0.5 + 0.4;
      ss[i] = 0.06;
      si[i] = i;
      sc[i * 3] = 0.75; sc[i * 3 + 1] = 0.85; sc[i * 3 + 2] = 1.0;
    }
    sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
    sg.setAttribute('aCol', new THREE.BufferAttribute(sc, 3));
    sg.setAttribute('aSize', new THREE.BufferAttribute(ss, 1));
    sg.setAttribute('aIdx', new THREE.BufferAttribute(si, 1));
    this.starMat = new THREE.ShaderMaterial({
      vertexShader: STAR_VERT,
      fragmentShader: STAR_FRAG,
      uniforms: { uTime: { value: 0 }, uShow: { value: 0 }, uHover: { value: -1 }, uPx: { value: 1 } },
      transparent: true,
      depthWrite: false,
      depthTest: false,
    });
    this.stars = new THREE.Points(sg, this.starMat);
    this.stars.visible = false;
    this.stars.renderOrder = 2;
    this.group.add(this.stars);
    this.ray.params.Points = { threshold: 0.16 };
    window.addEventListener('pointerdown', this.down);
    window.addEventListener('pointermove', this.move);
    window.addEventListener('pointerup', this.up);
    this.raf = requestAnimationFrame(this.loop);
  }

  setTheme(t: Theme) {
    this.renderer.setClearColor(THEME_BG[t]);
  }

  /** Colour the name-stars: gold for those with a reading, brighter where the search matches. */
  paintStars(gold: Set<number>, match: Set<number> | null) {
    const c = this.stars.geometry.getAttribute('aCol') as THREE.BufferAttribute;
    const s = this.stars.geometry.getAttribute('aSize') as THREE.BufferAttribute;
    for (let i = 0; i < 1000; i++) {
      const on = !match || match.has(i);
      const g = gold.has(i + 1);
      const k = on ? 1 : 0.25;
      c.setXYZ(i, (g ? 1.0 : 0.85) * k, (g ? 0.72 : 0.9) * k, (g ? 0.25 : 1.0) * k);
      s.setX(i, (g ? 0.09 : 0.055) * (match && on ? 1.6 : 1));
    }
    c.needsUpdate = true;
    s.needsUpdate = true;
  }

  /** Light up every stroke that carries this name (0-based), or none with -1. */
  highlight(name: number) {
    this.mat.uniforms.uPick!.value = name;
  }

  async load() {
    const n = this.n;
    // the geometry first, so something is always ready
    this.forms.galaxy = this.galaxy();
    let seed = 11;
    await paintPlates(this.base, (name, plate) => {
      const f = samplePlate(plate, n, seed++);
      const under = this.underpaint(plate);
      for (const [k, v] of Object.entries(PLATE_OF)) if (v === name) { this.forms[k as FormationName] = f; this.under.set(k as FormationName, under); }
      // the cosmic body wears the crown of heads from the many-faced painting
      if (name === 'faces') this.forms.body = this.body(samplePlate(cropTop(plate, 0.55), n, 99));
      if (this.wanted !== this.current) this.go(this.wanted);
    });
  }

  /** The softened copy: blurred, feathered at its edges, set just behind the deepest strokes. */
  private underpaint(p: Plate) {
    const c = document.createElement('canvas');
    c.width = p.w;
    c.height = p.h;
    const g = c.getContext('2d')!;
    const raw = document.createElement('canvas');
    raw.width = p.w;
    raw.height = p.h;
    const im = raw.getContext('2d')!.createImageData(p.w, p.h);
    im.data.set(p.rgba);
    raw.getContext('2d')!.putImageData(im, 0, 0);
    g.filter = 'blur(5px) saturate(1.1)';
    g.drawImage(raw, 0, 0);
    g.filter = 'none';
    // feather the edges so the picture dissolves like the strokes do
    g.globalCompositeOperation = 'destination-in';
    const f = Math.min(p.w, p.h) * 0.09;
    const gx = g.createLinearGradient(0, 0, p.w, 0);
    gx.addColorStop(0, 'rgba(0,0,0,0)'); gx.addColorStop(f / p.w, 'rgba(0,0,0,1)'); gx.addColorStop(1 - f / p.w, 'rgba(0,0,0,1)'); gx.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gx;
    g.fillRect(0, 0, p.w, p.h);
    const gy = g.createLinearGradient(0, 0, 0, p.h);
    gy.addColorStop(0, 'rgba(0,0,0,0)'); gy.addColorStop(f / p.h, 'rgba(0,0,0,1)'); gy.addColorStop(1 - f / p.h, 'rgba(0,0,0,1)'); gy.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gy;
    g.fillRect(0, 0, p.w, p.h);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(new THREE.PlaneGeometry((10 * p.w) / p.h, 10), new THREE.MeshBasicMaterial({ map: t, transparent: true, opacity: 0, depthWrite: false }));
    m.position.z = -1.3;
    m.renderOrder = -1;
    m.visible = false;
    this.group.add(m);
    return m;
  }

  private dust() {
    return build(this.n, (_i, R, p, c, s) => {
      // petals and gold leaf, drifting
      const r = 5 + R() * 16;
      const a = R() * Math.PI * 2;
      const b = Math.acos(2 * R() - 1);
      p.set(Math.sin(b) * Math.cos(a) * r, Math.sin(b) * Math.sin(a) * r * 0.8, Math.cos(b) * r - 6);
      const pick = R();
      c.copy(pick < 0.35 ? PINK : pick < 0.6 ? GOLD : pick < 0.8 ? BLUE : WHITE).multiplyScalar(0.7 + R() * 0.4);
      s.set(R() * Math.PI, 0.8 + R() * 0.6);
    }, 1);
  }

  /** The Dhyana shloka's body: the crown of heads above, the worlds in the rest. */
  private body(hero: Formation) {
    const n = this.n;
    const f = build(n, (_i, R, p, c, s) => {
      const pick = R();
      if (pick < 0.45) {
        // the heads; below them the worlds take over
        const j = Math.floor(R() * n);
        p.set(hero.pos[j * 3]! * 0.5, hero.pos[j * 3 + 1]! * 0.5 + 2.4, hero.pos[j * 3 + 2]! * 0.5);
        c.setRGB(hero.col[j * 3]!, hero.col[j * 3 + 1]!, hero.col[j * 3 + 2]!);
        s.set(hero.sty[j * 2]!, hero.sty[j * 2 + 1]! * 0.7);
        return;
      }
      if (pick < 0.62) {
        // the navel: the sky, a turning spiral
        const r = R() * 1.3;
        const a = r * 5 + Math.floor(R() * 3) * 2.09;
        p.set(Math.cos(a) * r, -0.3 + Math.sin(a) * r * 0.5, 1.0 + (R() - 0.5) * 0.2);
        c.copy(WHITE).lerp(BLUE, r / 1.3);
        s.set(-(a + Math.PI / 2), 0.8);
        return;
      }
      if (pick < 0.78) {
        // the belly: the ocean, waves
        const x = (R() - 0.5) * 4.2;
        const y = -1.4 + Math.sin(x * 3 + R()) * 0.12 + (R() - 0.5) * 0.9;
        p.set(x, y, 0.4 + Math.cos(x) * 0.3);
        c.copy(DEEP).lerp(new THREE.Color('#2fb5c8'), R());
        s.set((R() - 0.5) * 0.3, 1.1);
        return;
      }
      if (pick < 0.94) {
        // the feet: the earth, a globe
        const a = R() * Math.PI * 2;
        const b = Math.acos(2 * R() - 1);
        const r = 1.5;
        p.set(Math.sin(b) * Math.cos(a) * r, -4.4 + Math.cos(b) * r * 0.6, Math.sin(b) * Math.sin(a) * r * 0.5);
        c.copy(new THREE.Color('#3a9a52')).lerp(new THREE.Color('#2a6ad8'), R() < 0.6 ? 1 : 0);
        s.set(R() * Math.PI, 0.8);
        return;
      }
      // a column of starlight joining them
      const t = R();
      p.set((R() - 0.5) * (1.8 - t * 0.6), -3.2 + t * 4.4, (R() - 0.5) * 0.6);
      c.copy(GOLD).multiplyScalar(0.8);
      s.set(Math.PI / 2 + (R() - 0.5) * 0.3, 1.0);
    }, 13);
    // the sun and the moon, as eyes
    for (let k = 0; k < 900; k++) {
      const i = Math.floor((k / 900) * n);
      const sgn = k % 2 ? 1 : -1;
      const r = Math.sqrt(Math.random()) * 0.22;
      const a = Math.random() * Math.PI * 2;
      f.pos[i * 3] = sgn * 0.36 + Math.cos(a) * r;
      f.pos[i * 3 + 1] = 3.7 + Math.sin(a) * r;
      f.pos[i * 3 + 2] = 1.3;
      const col = sgn > 0 ? GOLD : WHITE;
      f.col[i * 3] = col.r * 1.3; f.col[i * 3 + 1] = col.g * 1.3; f.col[i * 3 + 2] = col.b * 1.3;
      f.sty[i * 2 + 1] = 0.45;
    }
    return f;
  }

  private galaxy() {
    return build(this.n, (_i, R, p, c, s) => {
      const arm = Math.floor(R() * 4);
      const r = Math.pow(R(), 0.8) * 9;
      const a = arm * (Math.PI / 2) + r * 0.62 + (R() - 0.5) * (0.5 + r * 0.05);
      p.set(Math.cos(a) * r + (R() - 0.5) * 0.4, Math.sin(a) * r * 0.62 + (R() - 0.5) * 0.4, (R() - 0.5) * (1.4 - r * 0.1) - 0.3);
      c.copy(r < 1.4 ? GOLD : r < 4 ? BLUE : PINK).lerp(DEEP, r / 14).multiplyScalar(0.7 + R() * 0.4);
      // strokes run round the spiral
      s.set(-(a + Math.PI / 2), 0.9 + R() * 0.5);
    }, 17);
  }

  go(name: FormationName) {
    this.wanted = name;
    const f = this.forms[name];
    if (!f || name === this.current) return;
    const geo = this.points.geometry;
    // start from wherever the strokes are now
    const k = this.morphT;
    const blend = k >= 1 ? 1 : k <= 0 ? 0 : k;
    for (const [fa, ta, src] of [['aFrom', 'aTo', f.pos], ['cFrom', 'cTo', f.col], ['sFrom', 'sTo', f.sty]] as const) {
      const a = geo.getAttribute(fa) as THREE.BufferAttribute;
      const b = geo.getAttribute(ta) as THREE.BufferAttribute;
      const A = a.array as Float32Array;
      const B = b.array as Float32Array;
      for (let i = 0; i < A.length; i++) A[i] = A[i]! * (1 - blend) + B[i]! * blend;
      B.set(src);
      a.needsUpdate = b.needsUpdate = true;
    }
    this.morphT = 0;
    this.current = name;
    this.starsTarget = name === 'galaxy' ? 1 : 0;
    this.camZT = name === 'galaxy' ? 15 : name === 'body' ? 14.5 : name === 'dust' ? 13 : name === 'hero' ? 19 : 14.2;
    this.aim();
  }

  /** Throw everything outward for a moment. */
  unleash() { this.burst = 1; }

  private down = (e: PointerEvent) => {
    // a drag that starts on a control belongs to the control
    if ((e.target as HTMLElement | null)?.closest?.('button, input, a, [data-nodrag]')) return;
    this.drag = { x: e.clientX, y: e.clientY, moved: 0 };
  };
  private move = (e: PointerEvent) => {
    const r = this.renderer.domElement.getBoundingClientRect();
    this.mouseNdc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    this.stir = Math.min(1.2, this.stir + Math.hypot(e.movementX || 0, e.movementY || 0) * 0.004);
    if (this.drag) {
      this.rotV.x += (e.clientX - this.drag.x) * 0.0006;
      this.rotV.y += (e.clientY - this.drag.y) * 0.0004;
      this.drag.moved += Math.abs(e.clientX - this.drag.x) + Math.abs(e.clientY - this.drag.y);
      this.drag.x = e.clientX;
      this.drag.y = e.clientY;
    }
    this.pickStar();
  };
  private up = (e: PointerEvent) => {
    const d = this.drag;
    this.drag = null;
    if (!d || d.moved > 8) return;
    if ((e.target as HTMLElement | null)?.closest?.('button, input, a, [data-nodrag], .vs-verse, .vs-card, .vs-reader, .vs-tip, .vs-name')) return;
    if (this.starsVisible > 0.5 && this.hover >= 0) return;
    const i = this.strokeAt(e.clientX, e.clientY);
    if (i >= 0) {
      const name = this.names[i]!;
      this.highlight(name);
      this.onPick?.(i, name, e.clientX, e.clientY);
    }
  };

  /** The stroke under a screen point, nearest the eye, or -1. */
  strokeAt(x: number, y: number) {
    const r = this.renderer.domElement.getBoundingClientRect();
    const A = (this.points.geometry.getAttribute('aTo') as THREE.BufferAttribute).array as Float32Array;
    this.group.updateMatrixWorld();
    const m = new THREE.Matrix4().multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse).multiply(this.group.matrixWorld);
    const e = m.elements;
    const px = ((x - r.left) / r.width) * 2 - 1;
    const py = -((y - r.top) / r.height) * 2 + 1;
    const tol = (14 / r.width) * 2;
    let best = -1;
    let bestScore = Infinity;
    for (let i = 0; i < this.n; i++) {
      const ax = A[i * 3]!;
      const ay = A[i * 3 + 1]!;
      const az = A[i * 3 + 2]!;
      const w = e[3]! * ax + e[7]! * ay + e[11]! * az + e[15]!;
      const cx = (e[0]! * ax + e[4]! * ay + e[8]! * az + e[12]!) / w;
      const cy = (e[1]! * ax + e[5]! * ay + e[9]! * az + e[13]!) / w;
      const dx = cx - px;
      const dy = (cy - py) * (r.height / r.width);
      const d2 = dx * dx + dy * dy;
      if (d2 > tol * tol) continue;
      const score = d2 / (tol * tol) + w * 0.02;
      if (score < bestScore) { bestScore = score; best = i; }
    }
    return best;
  }

  private pickStar() {
    const r = this.renderer.domElement.getBoundingClientRect();
    const sx = ((this.mouseNdc.x + 1) / 2) * r.width + r.left;
    const sy = ((1 - this.mouseNdc.y) / 2) * r.height + r.top;
    if (this.starsVisible < 0.5) { if (this.hover !== -1) { this.hover = -1; this.onHover?.(-1, sx, sy); } return; }
    this.ray.setFromCamera(this.mouseNdc, this.camera);
    const hits = this.ray.intersectObject(this.stars, false);
    const i = hits.length ? hits[0]!.index! : -1;
    if (i !== this.hover) { this.hover = i; this.starMat.uniforms.uHover!.value = i; }
    this.onHover?.(i, sx, sy);
  }

  /** Project a formation-space point to the screen (for labels). */
  toScreen(v: THREE.Vector3) {
    const p = v.clone().applyMatrix4(this.group.matrixWorld).project(this.camera);
    const r = this.renderer.domElement.getBoundingClientRect();
    return { x: ((p.x + 1) / 2) * r.width, y: ((1 - p.y) / 2) * r.height, behind: p.z > 1 };
  }

  /** Where a name-star is on screen. */
  starScreen(i: number) {
    const a = this.stars.geometry.getAttribute('position') as THREE.BufferAttribute;
    return this.toScreen(new THREE.Vector3(a.getX(i), a.getY(i), a.getZ(i)));
  }

  private aim() {
    this.shiftT = this.wide && this.current !== 'dust' ? (this.current === 'hero' ? 0.3 : 0.25) : 0;
  }

  resize(w: number, h: number) {
    this.renderer.setSize(w, h, false);
    this.vw = w;
    this.vh = h;
    this.wide = w > h * 1.15 && w > 900;
    this.aim();
    this.mat.uniforms.uPx!.value = (h * this.renderer.getPixelRatio()) / 800;
    this.starMat.uniforms.uPx!.value = this.mat.uniforms.uPx!.value;
    this.camera.aspect = w / h;
    // keep the figure in frame on a tall phone
    this.camera.fov = w < h ? 60 : 42;
    this.camera.updateProjectionMatrix();
    this.mat.uniforms.uAspect!.value = w / h;
  }

  private loop = (now: number) => {
    this.raf = requestAnimationFrame(this.loop);
    const real = Math.min(0.25, (now - this.last) / 1000);
    const dt = Math.min(0.05, real);
    this.last = now;
    const t = now / 1000;
    // the morph and the burst keep wall-clock time even on a slow machine
    this.morphT = Math.min(1, this.morphT + real / 2.4);
    this.burst = Math.max(0, this.burst - real * 0.9);
    this.stir = Math.max(0, this.stir - real * 0.8);
    this.mat.uniforms.uT!.value = this.morphT;
    this.mat.uniforms.uTime!.value = t;
    this.mat.uniforms.uBurst!.value = Math.sin(this.burst * Math.PI) * 0.9;
    this.mat.uniforms.uMouse!.value.copy(this.mouseNdc);
    this.mat.uniforms.uStir!.value = this.stir;
    this.starsVisible += (this.starsTarget - this.starsVisible) * Math.min(1, dt * 2.5);
    for (const [name, m] of this.under) {
      const mat = m.material as THREE.MeshBasicMaterial;
      const target = name === this.current && this.morphT > 0.55 ? 0.92 : 0;
      mat.opacity += (target - mat.opacity) * Math.min(1, real * (target > 0 ? 1.6 : 4));
      m.visible = mat.opacity > 0.01;
    }
    this.stars.visible = this.starsVisible > 0.02;
    this.starMat.uniforms.uShow!.value = this.starsVisible;
    this.starMat.uniforms.uTime!.value = t;
    // drag with inertia, and a slow drift of its own
    this.rot.x += this.rotV.x;
    this.rot.y += this.rotV.y;
    this.rotV.multiplyScalar(0.92);
    this.rot.y *= 0.985;
    this.rot.x *= this.current === 'galaxy' ? 0.998 : 0.985;
    this.group.rotation.y = this.rot.x + Math.sin(t * 0.15) * 0.08;
    this.group.rotation.x = this.rot.y + (this.current === 'galaxy' ? -0.35 : 0);
    if (this.current === 'galaxy') this.group.rotation.z = t * 0.01;
    else this.group.rotation.z *= 0.97;
    this.camZ += (this.camZT - this.camZ) * Math.min(1, dt * 1.5);
    this.shift += (this.shiftT - this.shift) * Math.min(1, dt * 1.5);
    if (Math.abs(this.shift) > 0.001) this.camera.setViewOffset(this.vw, this.vh, -this.shift * this.vw, 0, this.vw, this.vh);
    else this.camera.clearViewOffset();
    this.camera.position.set(0, 0, this.camZ);
    this.camera.lookAt(0, 0, 0);
    this.renderer.render(this.scene, this.camera);
  };

  dispose() {
    cancelAnimationFrame(this.raf);
    window.removeEventListener('pointerdown', this.down);
    window.removeEventListener('pointermove', this.move);
    window.removeEventListener('pointerup', this.up);
    this.renderer.dispose();
  }
}
