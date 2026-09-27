import * as THREE from 'three';

/**
 * The cosmos: one cloud of particles that moves between formations.
 *
 * Every particle has somewhere it came from and somewhere it is going; a
 * shader mixes the two, staggered by a per-particle seed so the cloud pours
 * rather than jumps, and swirls them in transit. Formations are sampled from
 * the 3D renders of Krishna (each lit pixel becomes a point, its brightness
 * its depth) or built from geometry: a lotus, a field of arrows, the cosmic
 * body of the Dhyana shloka, the thousand-armed form of Gita 11, a galaxy.
 *
 * A second, smaller cloud holds the thousand names as stars you can touch.
 */

export type FormationName = 'face' | 'arrows' | 'lotus' | 'body' | 'vishvarupa' | 'galaxy' | 'hero' | 'dust';
interface Formation { pos: Float32Array; col: Float32Array }

const VERT = /* glsl */ `
attribute vec3 aFrom;
attribute vec3 aTo;
attribute vec3 cFrom;
attribute vec3 cTo;
attribute float aSeed;
uniform float uT;
uniform float uTime;
uniform float uSize;
uniform float uBurst;
uniform vec2 uMouse;
uniform float uAspect;
uniform float uPx;
varying vec3 vCol;
varying float vA;
void main() {
  float k = clamp((uT - aSeed * 0.45) / 0.55, 0.0, 1.0);
  k = k * k * (3.0 - 2.0 * k);
  vec3 p = mix(aFrom, aTo, k);
  float mid = sin(k * 3.14159);
  p += vec3(sin(aSeed * 91.0 + uTime * 0.7), cos(aSeed * 57.0 + uTime * 0.6), sin(aSeed * 33.0 + uTime * 0.5)) * mid * 1.6;
  p += 0.025 * vec3(sin(uTime * 0.8 + aSeed * 60.0), cos(uTime * 0.7 + aSeed * 45.0), sin(uTime * 0.5 + aSeed * 20.0));
  p += normalize(p + vec3(0.0001)) * uBurst * (2.0 + aSeed * 6.0);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vec4 cp = projectionMatrix * mv;
  vec2 ndc = cp.xy / cp.w;
  vec2 d = (ndc - uMouse) * vec2(uAspect, 1.0);
  float dist = length(d);
  float push = exp(-dist * dist * 30.0) * 0.12;
  cp.xy += normalize(d + vec2(0.0001)) * push * cp.w / vec2(uAspect, 1.0);
  gl_Position = cp;
  gl_PointSize = uPx * uSize * (0.55 + aSeed * 0.9) / max(0.5, -mv.z);
  vCol = mix(cFrom, cTo, k);
  vA = 0.55 + 0.45 * sin(uTime * (0.6 + aSeed) + aSeed * 30.0);
}`;
const FRAG = /* glsl */ `
varying vec3 vCol;
varying float vA;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float r = length(c);
  if (r > 0.5) discard;
  float a = smoothstep(0.5, 0.0, r);
  gl_FragColor = vec4(vCol * (0.7 + 1.1 * a), a * vA);
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

const BLUE = new THREE.Color('#5d8cff');
const DEEP = new THREE.Color('#1f3fae');
const GOLD = new THREE.Color('#ffc766');
const WHITE = new THREE.Color('#e8f0ff');

/** Sample an image into points: lit pixels become particles, brightness becomes depth. */
async function sampleImage(url: string, n: number, o: { scale: number; ox?: number; oy?: number; depth?: number; crop?: [number, number, number, number]; tint?: number }): Promise<Formation> {
  const im = await new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
  const [cx, cy, cw, ch] = o.crop || [0, 0, im.width, im.height];
  const w = 360;
  const h = Math.round((w * ch) / cw);
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d')!;
  g.drawImage(im, cx, cy, cw, ch, 0, 0, w, h);
  const d = g.getImageData(0, 0, w, h).data;
  const lum = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) lum[i] = ((0.3 * d[i * 4]! + 0.59 * d[i * 4 + 1]! + 0.11 * d[i * 4 + 2]!) / 255) * (d[i * 4 + 3]! / 255);
  // weight by brightness and by edges, so the eyes, brows, lips and the crown's
  // contours get more stars than the flat of a cheek
  const cand: number[] = [];
  const wts: number[] = [];
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      if (d[i * 4 + 3]! < 100) continue;
      const L = lum[i]!;
      const gx = lum[i + 1]! - lum[i - 1]! + 0.5 * (lum[i - w + 1]! - lum[i - w - 1]! + lum[i + w + 1]! - lum[i + w - 1]!);
      const gy = lum[i + w]! - lum[i - w]! + 0.5 * (lum[i + w - 1]! - lum[i - w - 1]! + lum[i + w + 1]! - lum[i - w + 1]!);
      const e = Math.min(1, Math.hypot(gx, gy) * 3);
      cand.push(i);
      wts.push(0.12 + L * L * 1.6 + e * 2.4);
    }
  }
  const cum: number[] = [];
  let tot = 0;
  for (const x of wts) { tot += x; cum.push(tot); }
  const R = rnd(7);
  const pos = new Float32Array(n * 3);
  const col = new Float32Array(n * 3);
  const tint = o.tint ?? 0.35;
  const tmp = new THREE.Color();
  for (let k = 0; k < n; k++) {
    const r = R() * tot;
    let lo = 0;
    let hi = cum.length - 1;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (cum[mid]! < r) lo = mid + 1; else hi = mid; }
    const i = cand[lo]!;
    const x = (i % w) + R() - 0.5;
    const y = Math.floor(i / w) + R() - 0.5;
    const L = (0.3 * d[i * 4]! + 0.59 * d[i * 4 + 1]! + 0.11 * d[i * 4 + 2]!) / 255;
    pos[k * 3] = ((x - w / 2) / w) * o.scale + (o.ox || 0);
    pos[k * 3 + 1] = (-(y - h / 2) / w) * o.scale + (o.oy || 0);
    pos[k * 3 + 2] = (L - 0.4) * (o.depth ?? 1.4) + (R() - 0.5) * 0.08;
    tmp.setRGB(d[i * 4]! / 255, d[i * 4 + 1]! / 255, d[i * 4 + 2]! / 255);
    tmp.lerp(L > 0.55 ? GOLD : BLUE, tint);
    // lift the darks: deep-blue skin should glow, not vanish
    const m = Math.max(tmp.r, tmp.g, tmp.b, 0.001);
    const lift = Math.max(1.3, 0.55 / m);
    col[k * 3] = tmp.r * lift;
    col[k * 3 + 1] = tmp.g * lift;
    col[k * 3 + 2] = tmp.b * lift;
  }
  return { pos, col };
}

function build(n: number, fill: (i: number, R: () => number, p: THREE.Vector3, c: THREE.Color) => void, seed: number): Formation {
  const R = rnd(seed);
  const pos = new Float32Array(n * 3);
  const col = new Float32Array(n * 3);
  const p = new THREE.Vector3();
  const c = new THREE.Color();
  for (let i = 0; i < n; i++) {
    fill(i, R, p, c);
    pos[i * 3] = p.x; pos[i * 3 + 1] = p.y; pos[i * 3 + 2] = p.z;
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  return { pos, col };
}

/** Where the parts of the cosmic body are, in formation space (for the labels). */
export const BODY_ANCHORS: [string, string, string, THREE.Vector3][] = [
  ['dyauḥ', 'heaven', 'His head', new THREE.Vector3(0, 4.3, 0.5)],
  ['candra-sūryau', 'the moon and the sun', 'His eyes', new THREE.Vector3(0.0, 3.2, 1.2)],
  ['āśāḥ', 'the directions', 'His ears', new THREE.Vector3(-1.1, 2.9, 0.6)],
  ['dahanaḥ', 'fire', 'His mouth', new THREE.Vector3(0, 2.55, 1.2)],
  ['anilaḥ', 'the wind', 'His breath', new THREE.Vector3(1.3, 2.2, 0.8)],
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
  private morphT = 1;
  private rotV = new THREE.Vector2();
  private rot = new THREE.Vector2();
  private drag: { x: number; y: number } | null = null;
  private raf = 0;
  private last = performance.now();
  private burst = 0;
  hover = -1;
  onHover: ((i: number, x: number, y: number) => void) | null = null;
  starsVisible = 0;
  private starsTarget = 0;
  private ray = new THREE.Raycaster();
  private mouseNdc = new THREE.Vector2(9, 9);
  camZ = 13;
  /** How far right of centre the figure sits, as a fraction of the width (a text column is on the left). */
  private shift = 0;
  private shiftT = 0;
  private wide = false;
  private vw = 1;
  private vh = 1;
  private camZT = 13;
  private camY = 0;
  private camYT = 0;

  constructor(canvas: HTMLCanvasElement, private base: string, low: boolean) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(low ? 1 : 1.75, window.devicePixelRatio || 1));
    this.renderer.setClearColor('#01030d');
    this.n = low ? 40000 : 110000;
    this.scene.add(this.group);
    this.camera.position.set(0, 0, 13);
    const geo = new THREE.BufferGeometry();
    const n = this.n;
    const seeds = new Float32Array(n);
    const R = rnd(3);
    for (let i = 0; i < n; i++) seeds[i] = R();
    const dust = this.dust();
    this.forms.dust = dust;
    geo.setAttribute('position', new THREE.BufferAttribute(dust.pos.slice(), 3));
    geo.setAttribute('aFrom', new THREE.BufferAttribute(dust.pos.slice(), 3));
    geo.setAttribute('aTo', new THREE.BufferAttribute(dust.pos.slice(), 3));
    geo.setAttribute('cFrom', new THREE.BufferAttribute(dust.col.slice(), 3));
    geo.setAttribute('cTo', new THREE.BufferAttribute(dust.col.slice(), 3));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 60);
    this.mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: { uT: { value: 1 }, uTime: { value: 0 }, uSize: { value: low ? 30 : 22 }, uBurst: { value: 0 }, uMouse: { value: new THREE.Vector2(9, 9) }, uAspect: { value: 1 }, uPx: { value: 1 } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
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
      sp[i * 3 + 2] = Math.sin(i * 1.7) * 0.5;
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
      blending: THREE.AdditiveBlending,
    });
    this.stars = new THREE.Points(sg, this.starMat);
    this.stars.visible = false;
    this.group.add(this.stars);
    this.ray.params.Points = { threshold: 0.16 };
    window.addEventListener('pointerdown', this.down);
    window.addEventListener('pointermove', this.move);
    window.addEventListener('pointerup', this.up);
    this.raf = requestAnimationFrame(this.loop);
  }

  /** Colour the name-stars: gold for those with a reading, brighter where the search matches. */
  paintStars(gold: Set<number>, match: Set<number> | null) {
    const c = this.stars.geometry.getAttribute('aCol') as THREE.BufferAttribute;
    const s = this.stars.geometry.getAttribute('aSize') as THREE.BufferAttribute;
    for (let i = 0; i < 1000; i++) {
      const on = !match || match.has(i);
      const g = gold.has(i + 1);
      const k = on ? 1 : 0.18;
      c.setXYZ(i, (g ? 1.0 : 0.72) * k, (g ? 0.78 : 0.84) * k, (g ? 0.4 : 1.0) * k);
      s.setX(i, (g ? 0.09 : 0.055) * (match && on ? 1.6 : 1));
    }
    c.needsUpdate = true;
    s.needsUpdate = true;
  }

  async load() {
    const n = this.n;
    const [face, hero] = await Promise.all([
      sampleImage(this.base + 'gita-epic/img/k_face.webp', n, { scale: 5.4, oy: 0.1, depth: 1.3 }),
      sampleImage(this.base + 'gita-epic/img/k_hero.webp', n, { scale: 5.8, oy: 0.2, depth: 1.0 }),
    ]);
    this.forms.face = face;
    this.forms.hero = hero;
    this.forms.arrows = this.arrows();
    this.forms.lotus = this.lotus();
    this.forms.body = this.body(hero);
    this.forms.vishvarupa = this.vishvarupa(hero, face);
    this.forms.galaxy = this.galaxy();
  }

  private dust() {
    return build(this.n, (_i, R, p, c) => {
      const r = 6 + R() * 22;
      const a = R() * Math.PI * 2;
      const b = Math.acos(2 * R() - 1);
      p.set(Math.sin(b) * Math.cos(a) * r, Math.sin(b) * Math.sin(a) * r * 0.8, Math.cos(b) * r - 6);
      c.copy(R() < 0.15 ? GOLD : BLUE).multiplyScalar(0.35 + R() * 0.5);
    }, 1);
  }

  private arrows() {
    // a field of arrow-shafts, all pointing up, with gold tips: a bed of arrows
    const shafts = 260;
    return build(this.n, (i, R, p, c) => {
      const s = i % shafts;
      const sx = ((s * 0.618) % 1) * 12 - 6 + Math.sin(s) * 0.2;
      const sz = ((s * 0.382) % 1) * 6 - 3;
      const lean = Math.sin(s * 3.1) * 0.25;
      const t = R();
      const len = 3.2 + Math.sin(s * 1.3) * 0.8;
      const tip = t > 0.93;
      p.set(sx + lean * t * len, -4 + t * len + (tip ? 0.1 : 0), sz);
      if (t < 0.08) { p.x += (R() - 0.5) * 0.35; }
      c.copy(tip ? GOLD : t < 0.1 ? WHITE : DEEP).multiplyScalar(tip ? 1.4 : 0.8);
      if (R() < 0.25) { p.set((R() - 0.5) * 14, -4 + R() * 0.3, (R() - 0.5) * 6); c.copy(BLUE).multiplyScalar(0.4); }
    }, 5);
  }

  private lotus() {
    return build(this.n, (_i, R, p, c) => {
      const ring = R() < 0.2 ? 0 : R() < 0.55 ? 1 : 2;
      const petals = [8, 12, 16][ring]!;
      const pi = Math.floor(R() * petals);
      const base = (pi / petals) * Math.PI * 2 + ring * 0.2;
      const u = R();
      const v = R() * 2 - 1;
      const len = [2.2, 3.4, 4.6][ring]!;
      const lift = [1.6, 1.0, 0.4][ring]!;
      const width = Math.sin(u * Math.PI) * 0.42 * (1 - u * 0.3);
      const ang = base + v * width;
      const r = u * len;
      p.set(Math.cos(ang) * r, Math.sin(u * Math.PI * 0.9) * lift + u * lift * 0.6 - 1.5, Math.sin(ang) * r);
      c.copy(u > 0.8 ? WHITE : ring === 0 ? GOLD : BLUE).lerp(DEEP, 1 - u).multiplyScalar(0.9);
      if (R() < 0.08) { p.set((R() - 0.5) * 1.2, -1 + R() * 0.8, (R() - 0.5) * 1.2); c.copy(GOLD).multiplyScalar(1.3); }
    }, 9);
  }

  /** The Dhyana shloka's body: the bust above, the worlds in the rest. */
  private body(hero: Formation) {
    const n = this.n;
    const f = build(n, (i, R, p, c) => {
      const pick = R();
      if (pick < 0.45) {
        // the head and shoulders only; below them the worlds take over
        let j = Math.floor(R() * n);
        for (let tries = 0; tries < 6 && hero.pos[j * 3 + 1]! < -2.2; tries++) j = Math.floor(R() * n);
        p.set(hero.pos[j * 3]! * 0.62, hero.pos[j * 3 + 1]! * 0.62 + 2.2, hero.pos[j * 3 + 2]! * 0.62);
        c.setRGB(hero.col[j * 3]!, hero.col[j * 3 + 1]!, hero.col[j * 3 + 2]!);
        return;
      }
      if (pick < 0.62) {
        // the navel: the sky, a turning spiral
        const r = R() * 1.3;
        const a = r * 5 + Math.floor(R() * 3) * 2.09;
        p.set(Math.cos(a) * r, -0.3 + Math.sin(a) * r * 0.5, 1.0 + (R() - 0.5) * 0.2);
        c.copy(WHITE).lerp(BLUE, r / 1.3);
        return;
      }
      if (pick < 0.78) {
        // the belly: the ocean, waves
        const x = (R() - 0.5) * 4.2;
        const y = -1.4 + Math.sin(x * 3 + R()) * 0.12 + (R() - 0.5) * 0.9;
        p.set(x, y, 0.4 + Math.cos(x) * 0.3);
        c.copy(DEEP).lerp(new THREE.Color('#2fb5c8'), R());
        return;
      }
      if (pick < 0.94) {
        // the feet: the earth, a globe
        const a = R() * Math.PI * 2;
        const b = Math.acos(2 * R() - 1);
        const r = 1.5;
        p.set(Math.sin(b) * Math.cos(a) * r, -4.4 + Math.cos(b) * r * 0.6, Math.sin(b) * Math.sin(a) * r * 0.5);
        c.copy(new THREE.Color('#3a8a52')).lerp(new THREE.Color('#2a5ad8'), R() < 0.6 ? 1 : 0);
        return;
      }
      // a column of starlight joining them
      const t = R();
      p.set((R() - 0.5) * (1.8 - t * 0.6), -3.2 + t * 4.4, (R() - 0.5) * 0.6);
      c.copy(BLUE).multiplyScalar(0.5);
      void i;
    }, 13);
    // the sun and the moon, as eyes
    for (let k = 0; k < 900; k++) {
      const i = Math.floor((k / 900) * n);
      const s = k % 2 ? 1 : -1;
      const r = Math.sqrt(Math.random()) * 0.22;
      const a = Math.random() * Math.PI * 2;
      f.pos[i * 3] = s * 0.36 + Math.cos(a) * r;
      f.pos[i * 3 + 1] = 3.2 + Math.sin(a) * r;
      f.pos[i * 3 + 2] = 1.3;
      const col = s > 0 ? GOLD : WHITE;
      f.col[i * 3] = col.r * 1.6; f.col[i * 3 + 1] = col.g * 1.6; f.col[i * 3 + 2] = col.b * 1.6;
    }
    return f;
  }

  /** Gita 11: many faces, many arms, weapons raised, the light of a thousand suns. */
  private vishvarupa(hero: Formation, face: Formation) {
    const n = this.n;
    return build(n, (_i, R, p, c) => {
      const pick = R();
      if (pick < 0.36) {
        const j = Math.floor(R() * n);
        p.set(hero.pos[j * 3]! * 0.72, hero.pos[j * 3 + 1]! * 0.72 + 0.2, hero.pos[j * 3 + 2]! * 0.72 + 0.5);
        c.setRGB(hero.col[j * 3]! * 1.2, hero.col[j * 3 + 1]! * 1.2, hero.col[j * 3 + 2]! * 1.2);
        return;
      }
      if (pick < 0.54) {
        // a ring of faces behind: “many mouths and eyes” (11.10)
        const j = Math.floor(R() * n);
        const k = Math.floor(R() * 10);
        const a = (k / 10) * Math.PI * 2 + Math.PI / 2;
        const s = 0.19;
        p.set(face.pos[j * 3]! * s + Math.cos(a) * 4.4, face.pos[j * 3 + 1]! * s + Math.sin(a) * 3.3 + 1.0, face.pos[j * 3 + 2]! * s - 1.5);
        c.setRGB(face.col[j * 3]!, face.col[j * 3 + 1]!, face.col[j * 3 + 2]!).lerp(GOLD, 0.35).multiplyScalar(1.1);
        return;
      }
      if (pick < 0.82) {
        // the arms, a fan of them, each with a bright hand
        const k = Math.floor(R() * 36);
        const a = (k / 36) * Math.PI * 2;
        const t = Math.pow(R(), 0.8);
        const r = 1.2 + t * 5.0;
        const bend = Math.sin(t * Math.PI) * 0.25 * (k % 2 ? 1 : -1);
        const w = (1 - t * 0.6) * 0.16;
        p.set(Math.cos(a + bend) * r + (R() - 0.5) * w, Math.sin(a + bend) * r * 0.8 + 0.6 + (R() - 0.5) * w, -0.8 - t * 0.6);
        c.copy(t > 0.92 ? GOLD : BLUE).lerp(WHITE, t * 0.4).multiplyScalar(t > 0.92 ? 1.6 : 0.8);
        return;
      }
      if (pick < 0.92) {
        // discus rings
        const a = R() * Math.PI * 2;
        const rr = [5.8, 6.6][Math.floor(R() * 2)]!;
        p.set(Math.cos(a) * rr, Math.sin(a) * rr * 0.8 + 0.6, -2.2);
        c.copy(GOLD).multiplyScalar(0.9);
        return;
      }
      // a thousand suns
      const a = R() * Math.PI * 2;
      const rr = Math.pow(R(), 2) * 1.2;
      p.set(Math.cos(a) * rr, Math.sin(a) * rr + 3.4, 0.2);
      c.copy(WHITE).multiplyScalar(1.8);
    }, 21);
  }

  private galaxy() {
    return build(this.n, (_i, R, p, c) => {
      const arm = Math.floor(R() * 4);
      const r = Math.pow(R(), 0.8) * 9;
      const a = arm * (Math.PI / 2) + r * 0.62 + (R() - 0.5) * (0.5 + r * 0.05);
      p.set(Math.cos(a) * r + (R() - 0.5) * 0.4, Math.sin(a) * r * 0.62 + (R() - 0.5) * 0.4, (R() - 0.5) * (1.4 - r * 0.1));
      c.copy(r < 1.4 ? GOLD : BLUE).lerp(DEEP, r / 12).multiplyScalar(0.55 + R() * 0.4);
    }, 17);
  }

  go(name: FormationName) {
    const f = this.forms[name];
    if (!f || name === this.current) return;
    const geo = this.points.geometry;
    // start from wherever the particles are now
    const k = this.morphT;
    const af = geo.getAttribute('aFrom') as THREE.BufferAttribute;
    const at = geo.getAttribute('aTo') as THREE.BufferAttribute;
    const cf = geo.getAttribute('cFrom') as THREE.BufferAttribute;
    const ct = geo.getAttribute('cTo') as THREE.BufferAttribute;
    const blend = k >= 1 ? 1 : k <= 0 ? 0 : k;
    for (let i = 0; i < af.array.length; i++) {
      (af.array as Float32Array)[i] = (af.array as Float32Array)[i]! * (1 - blend) + (at.array as Float32Array)[i]! * blend;
      (cf.array as Float32Array)[i] = (cf.array as Float32Array)[i]! * (1 - blend) + (ct.array as Float32Array)[i]! * blend;
    }
    (at.array as Float32Array).set(f.pos);
    (ct.array as Float32Array).set(f.col);
    af.needsUpdate = at.needsUpdate = cf.needsUpdate = ct.needsUpdate = true;
    this.morphT = 0;
    this.current = name;
    this.starsTarget = name === 'galaxy' ? 1 : 0;
    this.camZT = name === 'galaxy' ? 15 : name === 'body' ? 14.5 : name === 'vishvarupa' ? 18.5 : name === 'arrows' ? 12 : 13;
    this.aim();
    this.camYT = name === 'body' ? 0 : 0;
  }

  /** Throw everything outward for a moment. */
  unleash() { this.burst = 1; }

  private down = (e: PointerEvent) => {
    // a drag that starts on a control belongs to the control
    if ((e.target as HTMLElement | null)?.closest?.('button, input, a, [data-nodrag]')) return;
    this.drag = { x: e.clientX, y: e.clientY };
  };
  private move = (e: PointerEvent) => {
    const r = this.renderer.domElement.getBoundingClientRect();
    this.mouseNdc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    if (this.drag) {
      this.rotV.x += (e.clientX - this.drag.x) * 0.0006;
      this.rotV.y += (e.clientY - this.drag.y) * 0.0004;
      this.drag = { x: e.clientX, y: e.clientY };
    }
    this.pick(e.clientX, e.clientY);
  };
  private up = () => { this.drag = null; };

  private pick(x: number, y: number) {
    if (this.starsVisible < 0.5) { if (this.hover !== -1) { this.hover = -1; this.onHover?.(-1, x, y); } return; }
    this.ray.setFromCamera(this.mouseNdc, this.camera);
    const hits = this.ray.intersectObject(this.stars, false);
    const i = hits.length ? hits[0]!.index! : -1;
    if (i !== this.hover) { this.hover = i; this.starMat.uniforms.uHover!.value = i; }
    this.onHover?.(i, x, y);
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
    this.shiftT = this.wide && this.current !== 'hero' && this.current !== 'dust' ? 0.2 : 0;
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
    this.camera.fov = w < h ? 58 : 42;
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
    this.mat.uniforms.uT!.value = this.morphT;
    this.mat.uniforms.uTime!.value = t;
    this.mat.uniforms.uBurst!.value = Math.sin(this.burst * Math.PI) * 0.9;
    this.mat.uniforms.uMouse!.value.copy(this.mouseNdc);
    this.starsVisible += (this.starsTarget - this.starsVisible) * Math.min(1, dt * 2.5);
    this.stars.visible = this.starsVisible > 0.02;
    this.starMat.uniforms.uShow!.value = this.starsVisible;
    this.starMat.uniforms.uTime!.value = t;
    // drag with inertia, and a slow drift of its own
    this.rot.x += this.rotV.x;
    this.rot.y += this.rotV.y;
    this.rotV.multiplyScalar(0.92);
    this.rot.y *= 0.985;
    this.rot.x *= this.current === 'galaxy' ? 0.998 : 0.985;
    this.group.rotation.y = this.rot.x + Math.sin(t * 0.15) * 0.12;
    this.group.rotation.x = this.rot.y + (this.current === 'galaxy' ? -0.35 : 0);
    if (this.current === 'galaxy') this.group.rotation.z = t * 0.01;
    else this.group.rotation.z *= 0.97;
    this.camZ += (this.camZT - this.camZ) * Math.min(1, dt * 1.5);
    this.camY += (this.camYT - this.camY) * Math.min(1, dt * 1.5);
    this.shift += (this.shiftT - this.shift) * Math.min(1, dt * 1.5);
    if (Math.abs(this.shift) > 0.001) this.camera.setViewOffset(this.vw, this.vh, -this.shift * this.vw, 0, this.vw, this.vh);
    else this.camera.clearViewOffset();
    this.camera.position.set(0, this.camY, this.camZ);
    this.camera.lookAt(0, this.camY, 0);
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
