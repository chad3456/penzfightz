import * as THREE from 'three';
import { clamp, fbm, groundHeight, pondSDF, rng, vnoise } from './pond';
import { CAUSTIC_PARS, CAUSTIC_APPLY, causticUniforms } from './caustics';

/**
 * Koi: ten real varieties painted procedurally onto a sculpted body, with
 * fins, a swimming wave that runs from head to tail in the vertex shader,
 * and a small mind of their own (wander, school, avoid the walls, come to
 * food and to people, scatter at a splash).
 */

export type Variety =
  | 'kohaku' | 'sanke' | 'showa' | 'tancho' | 'yamabuki'
  | 'platinum' | 'orenji' | 'asagi' | 'shusui' | 'chagoi';

export const VARIETIES: { id: Variety; name: string; note: string; swatch: string[] }[] = [
  { id: 'kohaku', name: 'Kohaku', note: 'white with red markings, the classic koi', swatch: ['#f3efe6', '#d8381c'] },
  { id: 'sanke', name: 'Taisho Sanke', note: 'white with red, and small black spots', swatch: ['#f3efe6', '#d8381c', '#1a1716'] },
  { id: 'showa', name: 'Showa', note: 'black with red and white', swatch: ['#1a1716', '#d8381c', '#f3efe6'] },
  { id: 'tancho', name: 'Tancho', note: 'one red circle on the head, like the crane', swatch: ['#f3efe6', '#d8381c'] },
  { id: 'yamabuki', name: 'Yamabuki Ogon', note: 'solid metallic gold', swatch: ['#f0b632', '#ffd76a'] },
  { id: 'platinum', name: 'Platinum Ogon', note: 'solid metallic white', swatch: ['#ecebe5', '#ffffff'] },
  { id: 'orenji', name: 'Orenji Ogon', note: 'solid metallic orange', swatch: ['#ec7a1c', '#ffae55'] },
  { id: 'asagi', name: 'Asagi', note: 'blue net-patterned back, red cheeks and sides', swatch: ['#6f87a3', '#d9622a'] },
  { id: 'shusui', name: 'Shusui', note: 'scaleless blue back with a line of large scales', swatch: ['#5e7ea6', '#2c4466', '#d55a28'] },
  { id: 'chagoi', name: 'Chagoi', note: 'tea-brown and famously friendly', swatch: ['#8a6740', '#b28d5c'] },
];

export const NAMES = [
  'Hana', 'Sora', 'Kin', 'Yuki', 'Momo', 'Taro', 'Haru', 'Aki', 'Ume', 'Kiku', 'Tama', 'Nami', 'Ren', 'Mizu',
  'Hoshi', 'Kai', 'Sumi', 'Botan', 'Fuji', 'Koko', 'Sona', 'Moti', 'Kesar', 'Neel', 'Chandni', 'Tara', 'Gulab', 'Pari',
];

/* ---------- body shape (unit length: tail end x = -0.5, snout x = +0.5) ---------- */

const WIDTH: [number, number][] = [[0, 0.022], [0.12, 0.034], [0.3, 0.064], [0.5, 0.094], [0.64, 0.104], [0.78, 0.096], [0.9, 0.074], [0.95, 0.056], [1, 0.0]];
const HTOP: [number, number][] = [[0, 0.026], [0.12, 0.04], [0.3, 0.075], [0.5, 0.104], [0.62, 0.108], [0.78, 0.09], [0.9, 0.062], [0.95, 0.045], [1, 0.0]];
const HBOT: [number, number][] = [[0, 0.024], [0.12, 0.034], [0.3, 0.062], [0.5, 0.086], [0.62, 0.088], [0.78, 0.074], [0.9, 0.055], [0.95, 0.04], [1, 0.0]];

function curveRaw(pts: [number, number][], s: number) {
  if (s <= 0) return pts[0][1];
  let i = 0;
  while (i < pts.length - 2 && pts[i + 1][0] < s) i++;
  const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
  const t = clamp((s - p1[0]) / (p2[0] - p1[0]), 0, 1);
  const t2 = t * t, t3 = t2 * t;
  return Math.max(0, 0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3));
}
/** Profile along the body, with an elliptical cap for a blunt, rounded snout. */
function curve(pts: [number, number][], s: number) {
  if (s <= 0.9) return curveRaw(pts, s);
  return curveRaw(pts, 0.9) * Math.sqrt(Math.max(0, 1 - ((s - 0.9) / 0.1) ** 2));
}
export const bodyW = (s: number) => curve(WIDTH, s);
export const bodyTop = (s: number) => curve(HTOP, s);
export const bodyBot = (s: number) => curve(HBOT, s);

function bodyGeometry() {
  const NS = 56, NA = 28;
  const pos: number[] = [], uv: number[] = [], idx: number[] = [];
  for (let i = 0; i <= NS; i++) {
    // denser towards the snout so the head stays round
    const ss = 1 - Math.pow(1 - i / NS, 1.5);
    const x = ss - 0.5;
    const w = bodyW(ss), ht = bodyTop(ss), hb = bodyBot(ss);
    for (let j = 0; j <= NA; j++) {
      const phi = -Math.PI + (j / NA) * Math.PI * 2; // 0 = top
      const c = Math.cos(phi), sn = Math.sin(phi);
      // a slightly squarer section than an ellipse: koi are full-bodied
      const sq = (v: number) => Math.sign(v) * Math.pow(Math.abs(v), 0.86);
      const y = c > 0 ? sq(c) * ht : sq(c) * hb;
      const z = sq(sn) * w;
      pos.push(x, y, z);
      uv.push(ss, j / NA);
    }
  }
  for (let i = 0; i < NS; i++) for (let j = 0; j < NA; j++) {
    const a = i * (NA + 1) + j, b = a + NA + 1;
    idx.push(a, a + 1, b, b, a + 1, b + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** A fin as a grid between a base line and an edge curve; uv.x along the base, uv.y outwards. */
function finGeometry(base: (a: number) => THREE.Vector3, edge: (a: number) => THREE.Vector3, na = 14, nb = 6, cup?: (a: number, b: number, p: THREE.Vector3) => void) {
  const pos: number[] = [], uv: number[] = [], idx: number[] = [];
  const p = new THREE.Vector3();
  for (let i = 0; i <= na; i++) {
    const a = i / na, b0 = base(a), e = edge(a);
    for (let j = 0; j <= nb; j++) {
      const b = j / nb;
      p.copy(b0).lerp(e, b);
      cup?.(a, b, p);
      pos.push(p.x, p.y, p.z); uv.push(a, b);
    }
  }
  for (let i = 0; i < na; i++) for (let j = 0; j < nb; j++) {
    const a = i * (nb + 1) + j, b = a + nb + 1;
    idx.push(a, b, a + 1, a + 1, b, b + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

function caudalGeometry(long: boolean) {
  const L = long ? 0.5 : 0.3, H = long ? 0.21 : 0.165;
  return finGeometry(
    (a) => V(-0.49, 0.026 - a * 0.05, 0),
    (a) => {
      // two lobes with a shallow fork between them
      const y = H * Math.cos(a * Math.PI);
      const fork = 1 - 0.36 * Math.exp(-((a - 0.5) ** 2) / 0.012);
      const lobe = 0.8 + 0.2 * Math.sin(a * Math.PI);
      return V(-0.49 - L * fork * lobe, y, 0);
    },
    16, long ? 8 : 6,
    (a, b, p) => { p.z += b * b * (long ? 0.06 : 0.04) * Math.cos(a * Math.PI * 2); },
  );
}

function dorsalGeometry() {
  return finGeometry(
    (a) => { const s = 0.3 + a * 0.33; return V(s - 0.5, bodyTop(s) * 0.92, 0); },
    (a) => { const s = 0.3 + a * 0.33; const h = 0.035 + 0.05 * Math.sin(Math.min(1, a * 1.25) * Math.PI * 0.5) * (1 - 0.35 * a); return V(s - 0.5 - 0.035, bodyTop(s) * 0.92 + h, 0); },
    12, 3,
  );
}

/** A pectoral fin in its own pivot space: +x outwards, -z backwards when mounted. */
function pectoralGeometry(long: boolean) {
  const len = long ? 0.27 : 0.16;
  return finGeometry(
    (a) => V(0, -a * 0.006, -a * 0.06),
    (a) => {
      const th = THREE.MathUtils.lerp(-0.15, -1.2, a);
      const r = len * (0.75 + 0.25 * Math.sin(a * Math.PI)) * (1 - 0.2 * a);
      return V(Math.cos(th) * r, -0.02 - a * 0.01, Math.sin(th) * r - a * 0.03);
    },
    10, long ? 7 : 5,
    (_a, b, p) => { p.y -= b * b * 0.015; },
  );
}

function smallFin(x0: number, x1: number, y: number, z: number, len: number, down: boolean) {
  return finGeometry(
    (a) => V(THREE.MathUtils.lerp(x0, x1, a), y, z),
    (a) => V(THREE.MathUtils.lerp(x0, x1, a) - len * 0.6, y + (down ? -len : 0) * Math.sin((0.2 + a * 0.8) * Math.PI * 0.6), z + (down ? 0 : Math.sign(z) * len * Math.sin((0.2 + a * 0.8) * Math.PI * 0.6))),
    6, 3,
  );
}

let SHARED: { body: THREE.BufferGeometry; dorsal: THREE.BufferGeometry; caudal: [THREE.BufferGeometry, THREE.BufferGeometry]; pect: [THREE.BufferGeometry, THREE.BufferGeometry]; small: THREE.BufferGeometry; eye: THREE.BufferGeometry; barbel: THREE.BufferGeometry; scaleNormal: THREE.Texture } | null = null;

function shared() {
  if (SHARED) return SHARED;
  const small = mergeGeos([
    smallFin(-0.06, 0.0, -0.075, 0.035, 0.07, false), smallFin(-0.06, 0.0, -0.075, -0.035, 0.07, false),
    smallFin(-0.33, -0.25, -0.05, 0, 0.06, true),
  ]);
  const barbel = mergeGeos([0.03, -0.03].map((z) => {
    const c = new THREE.CylinderGeometry(0.002, 0.004, 0.035, 5);
    c.rotateZ(Math.PI / 2 + 0.5); c.rotateY(z > 0 ? -0.6 : 0.6); c.translate(0.485, -0.035, z * 0.9);
    c.deleteAttribute('uv'); return c;
  }));
  SHARED = {
    body: bodyGeometry(), dorsal: dorsalGeometry(),
    caudal: [caudalGeometry(false), caudalGeometry(true)],
    pect: [pectoralGeometry(false), pectoralGeometry(true)],
    small, eye: new THREE.SphereGeometry(0.016, 12, 8), barbel, scaleNormal: scaleNormalMap(),
  };
  return SHARED;
}

function mergeGeos(gs: THREE.BufferGeometry[]) {
  const pos: number[] = [], nor: number[] = [], uv: number[] = [], idx: number[] = [];
  let off = 0;
  for (const g of gs) {
    const p = g.getAttribute('position'), n = g.getAttribute('normal'), u = g.getAttribute('uv');
    for (let i = 0; i < p.count; i++) {
      pos.push(p.getX(i), p.getY(i), p.getZ(i)); nor.push(n.getX(i), n.getY(i), n.getZ(i));
      uv.push(u ? u.getX(i) : 0, u ? u.getY(i) : 0);
    }
    const ix = g.getIndex();
    if (ix) for (let i = 0; i < ix.count; i++) idx.push(ix.getX(i) + off);
    else for (let i = 0; i < p.count; i++) idx.push(i + off);
    off += p.count;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}

/* ---------- scales ---------- */

const SCALE_ROWS = 34, SCALE_AROUND = 30;

/** Distance-to-edge of the scale under (s, v), 0 at the centre, ~1 at the rim. */
function scaleCell(s: number, v: number) {
  const r = s * SCALE_ROWS;
  const row = Math.floor(r);
  const off = (row & 1) * 0.5;
  const c = v * SCALE_AROUND + off;
  const a = r - row, b = c - Math.floor(c) - 0.5;
  // each scale overlaps the one behind it: its exposed rim is the tail-ward arc
  return { rim: Math.hypot((a - 0.2) * 1.05, b * 1.15) / 0.62, a, b };
}

function scaleNormalMap() {
  const W = 512, H = 256;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d')!;
  const img = ctx.createImageData(W, H);
  const hgt = new Float32Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const { rim, a } = scaleCell(x / W, y / H);
    // a dome that rises towards the head end of each scale
    hgt[y * W + x] = (1 - Math.min(1, rim) ** 2) * (0.6 + 0.4 * (1 - a));
  }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const xl = (x - 1 + W) % W, xr = (x + 1) % W, yu = (y - 1 + H) % H, yd = (y + 1) % H;
    const dx = (hgt[y * W + xr] - hgt[y * W + xl]) * 2.2, dy = (hgt[yd * W + x] - hgt[yu * W + x]) * 2.2;
    const n = new THREE.Vector3(-dx, -dy, 1).normalize();
    const k = (y * W + x) * 4;
    img.data[k] = (n.x * 0.5 + 0.5) * 255; img.data[k + 1] = (n.y * 0.5 + 0.5) * 255; img.data[k + 2] = (n.z * 0.5 + 0.5) * 255; img.data[k + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(cv);
  t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.RepeatWrapping;
  return t;
}

/* ---------- painting the varieties ---------- */

type RGB = [number, number, number];
const hex = (h: string): RGB => { const v = parseInt(h.slice(1), 16); return [(v >> 16) & 255, (v >> 8) & 255, v & 255]; };
const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const mul = (a: RGB, k: number): RGB => [a[0] * k, a[1] * k, a[2] * k];

const C = {
  white: hex('#f2eee4'), belly: hex('#f4efe6'), hi: hex('#d33a1b'), hiDeep: hex('#bb2a13'), sumi: hex('#1b1816'),
  gold: hex('#efb22c'), goldHi: hex('#ffd970'), plat: hex('#e9e8e1'), orange: hex('#ea7419'),
  asagi: hex('#7a8fa8'), asagiEdge: hex('#3c516b'), asagiHi: hex('#d7612b'),
  shusui: hex('#6283ab'), shusuiScale: hex('#2a4062'), cha: hex('#8c6a43'), chaEdge: hex('#5a4128'), chaHi: hex('#b8935f'),
};

type Patch = { s: number; l: number; rs: number; rl: number };
function patches(r: () => number, n: number, s0: number, s1: number, big = 1): Patch[] {
  const out: Patch[] = [];
  const step = (s1 - s0) / n;
  for (let i = 0; i < n; i++) {
    const s = s0 + step * (i + 0.5) + (r() - 0.5) * step * 0.5;
    out.push({ s, l: (r() - 0.5) * 0.5, rs: step * (0.42 + r() * 0.3) * big, rl: (0.55 + r() * 0.55) * big });
  }
  return out;
}
function patchField(ps: Patch[], s: number, lat: number, seed: number, rough = 0.32) {
  let f = -1;
  for (const p of ps) {
    const d = Math.hypot((s - p.s) / p.rs, (lat - p.l) / p.rl);
    f = Math.max(f, 1 - d);
  }
  return f + (fbm(s * 9 + seed, lat * 3.2 - seed, 3) - 0.5) * rough;
}
const edge = (f: number, w = 0.035) => clamp((f + w) / (2 * w), 0, 1);

export function paintKoi(variety: Variety, seed: number) {
  const W = 384, H = 192;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d')!;
  const img = ctx.createImageData(W, H);
  const r = rng(seed * 7919 + 13);
  const hiPatches = patches(r, 2 + Math.floor(r() * 3), 0.2, 0.97, variety === 'showa' ? 1.1 : 1);
  const headPatch: Patch = { s: 0.86 + r() * 0.03, l: (r() - 0.5) * 0.15, rs: 0.07 + r() * 0.035, rl: 0.55 + r() * 0.3 };
  if (variety === 'kohaku' || variety === 'sanke' || variety === 'showa') hiPatches.push(headPatch);
  const sumiPatches = patches(r, 3 + Math.floor(r() * 4), 0.15, 0.82, 0.38);
  const showaWhite = patches(r, 2 + Math.floor(r() * 2), 0.18, 0.9, 1.05);
  const tanchoS = 0.865 + r() * 0.02;

  for (let y = 0; y < H; y++) {
    const v = (y + 0.5) / H;
    const phi = (v - 0.5) * Math.PI * 2; // 0 = top
    const lat = phi / (Math.PI / 2); // ±1 at the flanks, ±2 under the belly
    const top = Math.cos(phi);
    for (let x = 0; x < W; x++) {
      const s = (x + 0.5) / W;
      const { rim } = scaleCell(s, v);
      const rimK = clamp((rim - 0.78) / 0.22, 0, 1);
      let col: RGB = C.white;
      let net = 0.08; // how strongly scale rims show (fukurin)
      const belly = clamp(-top * 1.6, 0, 1);
      switch (variety) {
        case 'kohaku': case 'sanke': case 'showa': {
          const red = edge(patchField(hiPatches, s, lat, seed));
          if (variety === 'showa') {
            const white = edge(patchField(showaWhite, s, lat, seed + 3));
            col = mix(C.sumi, C.white, white * (1 - 0.4 * belly) + belly * 0.55);
            col = mix(col, C.hi, red * (1 - belly) * (1 - white * 0.6));
            net = 0.12;
          } else {
            col = mix(C.white, C.hi, red * (1 - belly));
            if (variety === 'sanke') {
              const sumi = edge(patchField(sumiPatches, s, lat * 1.2, seed + 9, 0.5), 0.05);
              col = mix(col, C.sumi, sumi * (1 - belly) * 0.95);
            }
          }
          break;
        }
        case 'tancho': {
          const d = Math.hypot((s - tanchoS) / 0.05, lat / 0.5);
          col = mix(C.white, C.hi, edge(1 - d + (vnoise(s * 40, lat * 8) - 0.5) * 0.12, 0.05));
          break;
        }
        case 'yamabuki': case 'platinum': case 'orenji': {
          const base = variety === 'yamabuki' ? C.gold : variety === 'platinum' ? C.plat : C.orange;
          const hiC = variety === 'yamabuki' ? C.goldHi : variety === 'platinum' ? [255, 255, 255] as RGB : hex('#ffad58');
          col = mix(base, hiC, (1 - rimK) * 0.35 * clamp(top + 0.4, 0, 1));
          col = mul(col, 0.92 + 0.08 * top);
          net = 0.18;
          break;
        }
        case 'asagi': {
          const back = clamp((top - 0.05) / 0.4, 0, 1) * (s < 0.88 ? 1 : 0.6);
          const blue = mix(hex('#c2cfdb'), C.asagi, clamp(top * 1.2, 0, 1));
          col = mix(C.asagiHi, blue, back);
          col = mix(col, C.belly, belly * 0.85);
          if (s > 0.86) col = mix(col, C.asagiHi, clamp((Math.abs(lat) - 0.45) * 2, 0, 1) * (1 - belly));
          col = mix(col, C.asagiEdge, rimK * 0.75 * back);
          net = 0;
          break;
        }
        case 'shusui': {
          const back = clamp((top - 0.0) / 0.45, 0, 1);
          col = mix(C.asagiHi, mix(hex('#a8bdd4'), C.shusui, clamp(top, 0, 1)), back);
          col = mix(col, C.belly, belly * 0.8);
          // the mirror row along the spine: big dark scales, two either side
          const row = Math.abs(lat);
          if (row < 0.22 && s > 0.12 && s < 0.86) {
            const k = (s * 14) % 1, b = row / 0.22;
            const sc = Math.hypot(k - 0.45, b * 0.6);
            col = mix(col, C.shusuiScale, clamp((0.48 - sc) * 12, 0, 1) * 0.9);
          }
          net = 0;
          break;
        }
        case 'chagoi': {
          col = mix(C.cha, C.chaHi, (1 - rimK) * 0.4);
          col = mix(col, C.chaEdge, rimK * 0.8);
          col = mix(col, hex('#c7ab84'), belly * 0.7);
          net = 0;
          break;
        }
      }
      // fukurin: the scale rims, plus a soft darkening along the spine
      col = mul(col, 1 - rimK * net);
      col = mul(col, 0.94 + 0.06 * (1 - Math.abs(top) * 0.3));
      const k = (y * W + x) * 4;
      img.data[k] = clamp(col[0], 0, 255); img.data[k + 1] = clamp(col[1], 0, 255); img.data[k + 2] = clamp(col[2], 0, 255); img.data[k + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** Fin colour and the fan of rays, painted as colour + alpha. */
function paintFin(variety: Variety, kind: 'pect' | 'tail' | 'other', seed: number) {
  const W = 128, H = 64;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d')!;
  const img = ctx.createImageData(W, H);
  const r = rng(seed + 77);
  const base: RGB = {
    kohaku: C.white, sanke: C.white, showa: C.white, tancho: C.white, yamabuki: C.gold, platinum: C.plat, orenji: C.orange,
    asagi: C.asagiHi, shusui: C.asagiHi, chagoi: C.cha,
  }[variety];
  const motoguro = variety === 'showa' && kind === 'pect';
  const sanke = variety === 'sanke' && r() > 0.4;
  const rays = kind === 'tail' ? 22 : 14;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const a = x / W, b = y / H; // a along the base, b outward
    const ray = Math.pow(Math.abs(Math.sin(a * rays * Math.PI)), 6);
    let col: RGB = mix(base, [255, 255, 255], 0.15 * b);
    if (motoguro) col = mix(col, C.sumi, clamp(1 - b * 2.2, 0, 1));
    if (sanke) col = mix(col, C.sumi, clamp(Math.sin(a * 9 + seed) * 2 - 1.4, 0, 1) * clamp(1 - Math.abs(b - 0.4) * 3, 0, 1));
    if ((variety === 'asagi' || variety === 'shusui') && b > 0.45) col = mix(col, hex('#f0e6da'), clamp((b - 0.45) * 3, 0, 1));
    col = mul(col, 0.88 + 0.22 * ray);
    const tip = kind === 'tail' ? 1 - Math.pow(b, 2.4) * 0.65 : 1 - Math.pow(b, 2) * 0.6;
    const alpha = clamp((0.42 + 0.4 * ray) * tip + (1 - b) * 0.25, 0, 1) * clamp((1 - b) * 14, 0, 1);
    const k = (y * W + x) * 4;
    img.data[k] = col[0]; img.data[k + 1] = col[1]; img.data[k + 2] = col[2]; img.data[k + 3] = alpha * 255;
  }
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ---------- the swimming wave ---------- */

export type SwimUniforms = { uPhase: { value: number }; uAmp: { value: number }; uTurn: { value: number } };

const BEND_PARS = /* glsl */ `
uniform float uPhase; uniform float uAmp; uniform float uTurn;
float koiBend(float x){
  float xh = 0.5 - x;
  float env = 0.04 + 0.96 * pow(clamp(xh / 1.25, 0.0, 1.4), 1.7);
  return uAmp * env * sin(uPhase - xh * 6.3) + uTurn * xh * xh;
}`;

/** Make a standard (or depth) material swim with the given per-fish uniforms. */
function swimify<M extends THREE.Material>(m: M, u: SwimUniforms, caustic: boolean): M {
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
    if (caustic) Object.assign(sh.uniforms, causticUniforms);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>\n${BEND_PARS}\n${caustic ? 'varying vec3 vKoiWorld;' : ''}`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>\ntransformed.z += koiBend(transformed.x);`);
    if (sh.vertexShader.includes('#include <beginnormal_vertex>')) {
      sh.vertexShader = sh.vertexShader.replace('#include <beginnormal_vertex>', `#include <beginnormal_vertex>
      { float e = 0.01; float sl = (koiBend(position.x + e) - koiBend(position.x - e)) / (2.0 * e);
        float c = 1.0 / sqrt(1.0 + sl * sl); float sn = sl * c;
        objectNormal = vec3(objectNormal.x * c - objectNormal.z * sn, objectNormal.y, objectNormal.z * c + objectNormal.x * sn); }`);
    }
    if (caustic) {
      sh.vertexShader = sh.vertexShader.replace('#include <worldpos_vertex>', `#include <worldpos_vertex>\nvKoiWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;`);
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>\n${CAUSTIC_PARS}\nvarying vec3 vKoiWorld;`)
        .replace('#include <lights_fragment_end>', `#include <lights_fragment_end>\n${CAUSTIC_APPLY('vKoiWorld')}`);
    }
  };
  m.customProgramCacheKey = () => `koi-swim-${caustic ? 1 : 0}-${m.type}`;
  return m;
}

/* ---------- a koi ---------- */

export type KoiSave = { variety: Variety; name: string; length: number; seed: number; butterfly: boolean };

export interface PondQuery {
  time: number;
  food: { x: number; z: number; y: number; alive: boolean; id: number }[];
  koi: Koi[];
  obstacles: { x: number; z: number; r: number }[];
  attract: { x: number; z: number; until: number } | null;
  scare: { x: number; z: number; t: number; r: number }[];
  eat(id: number, k: Koi): void;
  wake(x: number, z: number, strength: number): void;
}

export class Koi {
  readonly group = new THREE.Group();
  readonly body: THREE.Mesh;
  readonly u: SwimUniforms = { uPhase: { value: 0 }, uAmp: { value: 0.06 }, uTurn: { value: 0 } };
  readonly save: KoiSave;
  x = 0; z = 0; y = -0.5; heading = 0; speed = 0.2;
  private wanderA = 0; private targetY = -0.45; private yT = 0; private turnRate = 0; private wakeT = 0;
  private pects: THREE.Object3D[] = [];
  private r: () => number;
  private flee = 0; private fleeX = 0; private fleeZ = 0;

  materials: THREE.Material[] = [];
  textures: THREE.Texture[] = [];
  enter = 0;

  constructor(save: KoiSave) {
    this.save = save;
    const S = shared();
    this.r = rng(save.seed);
    const metal = save.variety === 'yamabuki' || save.variety === 'platinum' || save.variety === 'orenji';
    const map = paintKoi(save.variety, save.seed);
    const bodyMat = swimify(new THREE.MeshStandardMaterial({
      map, normalMap: S.scaleNormal, normalScale: new THREE.Vector2(0.45, 0.45),
      roughness: metal ? 0.3 : 0.38, metalness: metal ? 0.55 : 0.04,
    }), this.u, true);
    const finTail = paintFin(save.variety, 'tail', save.seed), finPect = paintFin(save.variety, 'pect', save.seed), finOther = paintFin(save.variety, 'other', save.seed);
    const finMat = (t: THREE.Texture) => swimify(new THREE.MeshStandardMaterial({ map: t, transparent: true, side: THREE.DoubleSide, depthWrite: false, roughness: 0.5, metalness: metal ? 0.3 : 0 }), this.u, true);
    const mTail = finMat(finTail), mOther = finMat(finOther);
    const mPect = new THREE.MeshStandardMaterial({ map: finPect, transparent: true, side: THREE.DoubleSide, depthWrite: false, roughness: 0.5, metalness: metal ? 0.3 : 0 });
    const eyeMat = swimify(new THREE.MeshStandardMaterial({ color: 0x0b0a09, roughness: 0.12, metalness: 0.1 }), this.u, false);
    const depthMat = swimify(new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking }), this.u, false);
    this.materials.push(bodyMat, mTail, mOther, mPect, eyeMat, depthMat);
    this.textures.push(map, finTail, finPect, finOther);

    const body = new THREE.Mesh(S.body, bodyMat);
    body.castShadow = true; body.customDepthMaterial = depthMat;
    body.userData.koi = this;
    this.body = body;
    const tail = new THREE.Mesh(S.caudal[save.butterfly ? 1 : 0], mTail);
    const dorsal = new THREE.Mesh(S.dorsal, mOther);
    const small = new THREE.Mesh(S.small, mOther);
    tail.castShadow = true; tail.customDepthMaterial = depthMat;
    const eyes = [0.05, -0.05].map((z) => { const e = new THREE.Mesh(S.eye, eyeMat); e.position.set(0.415, 0.012, z * (z > 0 ? 1.02 : 1.02)); return e; });
    const barbel = new THREE.Mesh(S.barbel, eyeMat);
    barbel.visible = false;
    const fish = new THREE.Group();
    fish.add(body, tail, dorsal, small, ...eyes);
    for (const side of [1, -1]) {
      const piv = new THREE.Group();
      piv.position.set(0.2, -0.062, 0.07 * side);
      const fin = new THREE.Mesh(S.pect[save.butterfly ? 1 : 0], mPect);
      fin.scale.z = 1; fin.scale.x = 1;
      if (side < 0) { fin.scale.x = -1; }
      // mount: +x of the fin outwards (to ±z of the body), -z backwards (to -x)
      fin.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
      fin.castShadow = true;
      piv.add(fin);
      piv.userData.side = side;
      fish.add(piv);
      this.pects.push(piv);
    }
    fish.scale.setScalar(save.length);
    this.group.add(fish);
    this.group.userData.koi = this;
  }

  /** Place somewhere sensible in the pond. */
  spawn(x: number, z: number) {
    this.x = x; this.z = z; this.heading = this.r() * Math.PI * 2;
    this.y = Math.max(groundHeight(x, z) + 0.2, -0.4 - this.r() * 0.3);
    this.targetY = this.y;
  }

  scare(x: number, z: number, strength: number) {
    const d = Math.hypot(this.x - x, this.z - z);
    if (d > 2.6 * strength) return;
    this.flee = Math.max(this.flee, (1.2 + this.r() * 0.6) * strength * (1 - d / (2.6 * strength) * 0.5));
    this.fleeX = x; this.fleeZ = z;
    this.targetY = Math.min(this.targetY, groundHeight(this.x, this.z) + 0.2 + this.r() * 0.15);
  }

  update(dt: number, q: PondQuery) {
    const L = this.save.length;
    const r = this.r;
    const hx = Math.cos(this.heading), hz = Math.sin(this.heading);
    let sx = 0, sz = 0; // steering vector
    let want = 0.17 + 0.08 * Math.sin(q.time * 0.13 + this.save.seed);
    // wander
    this.wanderA += (r() - 0.5) * 2.4 * dt;
    this.wanderA *= 1 - 0.3 * dt;
    sx += Math.cos(this.heading + this.wanderA) * 0.6; sz += Math.sin(this.heading + this.wanderA) * 0.6;
    // walls: look ahead and turn back towards the middle
    const look = 0.6 + this.speed * 2.2;
    const ax = this.x + hx * look, az = this.z + hz * look;
    const dAhead = pondSDF(ax, az), dHere = pondSDF(this.x, this.z);
    const margin = 0.55 + L * 0.6;
    if (dAhead > -margin || dHere > -margin * 0.7) {
      const e = 0.05;
      const gx = pondSDF(ax + e, az) - pondSDF(ax - e, az), gz = pondSDF(ax, az + e) - pondSDF(ax, az - e);
      const gl = Math.hypot(gx, gz) || 1;
      const w = clamp((dAhead + margin) / margin, 0, 1.6) * 3.2;
      sx -= (gx / gl) * w; sz -= (gz / gl) * w;
    }
    for (const o of q.obstacles) {
      const dx = this.x + hx * 0.4 - o.x, dz = this.z + hz * 0.4 - o.z, d = Math.hypot(dx, dz);
      if (d < o.r + 0.6) { const w = (o.r + 0.6 - d) * 3; sx += (dx / d) * w; sz += (dz / d) * w; }
    }
    // the others: keep a little room, drift along with neighbours
    let ax2 = 0, az2 = 0, n = 0;
    for (const k of q.koi) {
      if (k === this) continue;
      const dx = this.x - k.x, dz = this.z - k.z, d = Math.hypot(dx, dz);
      if (d < 0.001) continue;
      const room = (L + k.save.length) * 0.75;
      if (d < room && Math.abs(this.y - k.y) < 0.25) { const w = (room - d) / room * 2.2; sx += (dx / d) * w; sz += (dz / d) * w; }
      if (d < 2.2) { ax2 += Math.cos(k.heading); az2 += Math.sin(k.heading); n++; }
    }
    if (n) { sx += ax2 / n * 0.35; sz += az2 / n * 0.35; }
    // food on the surface
    let food: PondQuery['food'][number] | null = null;
    if (this.flee <= 0) {
      let best = 4.5;
      for (const f of q.food) {
        if (!f.alive) continue;
        const d = Math.hypot(f.x - this.x, f.z - this.z);
        if (d < best) { best = d; food = f; }
      }
    }
    if (food) {
      const dx = food.x - this.x, dz = food.z - this.z, d = Math.hypot(dx, dz) || 1;
      sx += (dx / d) * 3; sz += (dz / d) * 3;
      want = 0.32 + Math.min(0.2, d * 0.08);
      this.targetY = d < 1.2 ? food.y - 0.04 : Math.max(-0.3, groundHeight(this.x, this.z) + 0.2);
      const mouthX = this.x + hx * L * 0.48, mouthZ = this.z + hz * L * 0.48;
      if (Math.hypot(food.x - mouthX, food.z - mouthZ) < 0.06 + L * 0.08 && Math.abs(this.y - food.y) < 0.12 + L * 0.1) q.eat(food.id, this);
    } else if (q.attract && q.attract.until > q.time) {
      // koi learn that people mean food: drift over to a hand in the water
      const dx = q.attract.x - this.x, dz = q.attract.z - this.z, d = Math.hypot(dx, dz) || 1;
      if (d < 5 && d > 0.5) { sx += (dx / d) * 1.4; sz += (dz / d) * 1.4; want = Math.max(want, 0.24); this.targetY = Math.max(this.targetY, -0.28); }
    }
    for (const s of q.scare) if (q.time - s.t < 0.05) this.scare(s.x, s.z, s.r);
    if (this.flee > 0) {
      this.flee -= dt;
      const dx = this.x - this.fleeX, dz = this.z - this.fleeZ, d = Math.hypot(dx, dz) || 1;
      sx += (dx / d) * 4 * clamp(this.flee, 0, 1); sz += (dz / d) * 4 * clamp(this.flee, 0, 1);
      want = 0.5 + 1.1 * clamp(this.flee, 0, 1);
    }
    // slow vertical wander
    this.yT -= dt;
    if (this.yT <= 0 && !food) {
      this.yT = 3 + r() * 6;
      const floor = groundHeight(this.x, this.z);
      this.targetY = clamp(-0.12 - r() * 0.6, floor + 0.18 + L * 0.1, -0.1);
    }
    // turn towards the steering vector, at a fish's pace
    const desired = Math.atan2(sz, sx);
    let dA = desired - this.heading;
    while (dA > Math.PI) dA -= Math.PI * 2;
    while (dA < -Math.PI) dA += Math.PI * 2;
    const maxTurn = (this.flee > 0 ? 4.5 : food ? 2.4 : 1.25) * dt;
    const turn = clamp(dA * 2.2 * dt, -maxTurn, maxTurn);
    this.heading += turn;
    this.turnRate += ((turn / Math.max(dt, 1e-3)) - this.turnRate) * Math.min(1, dt * 5);
    this.speed += (want - this.speed) * Math.min(1, dt * (this.flee > 0 ? 4 : 0.9));
    // move, never through a wall
    let nx = this.x + Math.cos(this.heading) * this.speed * dt, nz = this.z + Math.sin(this.heading) * this.speed * dt;
    const dN = pondSDF(nx, nz);
    if (dN > -0.25) { const back = dN + 0.25; const e = 0.05; const gx = pondSDF(nx + e, nz) - pondSDF(nx - e, nz), gz = pondSDF(nx, nz + e) - pondSDF(nx, nz - e); const gl = Math.hypot(gx, gz) || 1; nx -= gx / gl * back; nz -= gz / gl * back; }
    this.x = nx; this.z = nz;
    const floorY = groundHeight(this.x, this.z) + 0.1 + L * 0.08;
    this.targetY = Math.max(this.targetY, floorY);
    this.y += (Math.min(this.targetY, -0.035) - this.y) * Math.min(1, dt * (food ? 2.2 : 0.6));
    this.y = Math.max(this.y, floorY);
    // body wave: faster beat when faster; a kick when turning hard
    const beat = 3.2 + this.speed * 13 / Math.max(0.35, L);
    this.u.uPhase.value += dt * beat;
    this.u.uAmp.value += ((0.04 + 0.075 * clamp(this.speed / 0.7, 0, 1) + Math.min(0.02, Math.abs(this.turnRate) * 0.01)) - this.u.uAmp.value) * Math.min(1, dt * 3);
    this.u.uTurn.value += (clamp(-this.turnRate * 0.07, -0.17, 0.17) - this.u.uTurn.value) * Math.min(1, dt * 4);
    // pectorals: sculling when slow, folded back when fast
    const fold = clamp((this.speed - 0.25) / 0.6, 0, 1);
    for (const p of this.pects) {
      const side = p.userData.side as number;
      const fl = Math.sin(q.time * 3.1 + side * 0.9 + this.save.seed) * 0.35 * (1 - fold);
      p.rotation.set(side * (0.25 + fl), side * fold * 0.75, 0);
      // follow the body's sideways bend at the fin root
      const xh = 0.5 - 0.2, env = 0.04 + 0.96 * Math.pow(xh / 1.25, 1.7);
      p.position.z = 0.07 * side + this.u.uAmp.value * env * Math.sin(this.u.uPhase.value - xh * 6.3) + this.u.uTurn.value * xh * xh;
    }
    this.enter = Math.max(0, this.enter - dt);
    this.group.position.set(this.x, this.y - this.enter * 0.2, this.z);
    this.group.rotation.set(0, -this.heading, 0);
    const climb = clamp((this.targetY - this.y) * 1.2, -0.3, 0.3);
    this.group.children[0].rotation.z = climb;
    // a wake when near the top
    if (this.y > -0.22) {
      this.wakeT -= dt;
      if (this.wakeT <= 0) {
        this.wakeT = 0.09;
        const strength = (0.0016 + this.speed * 0.004) * clamp((this.y + 0.22) / 0.18, 0, 1) * L * 1.6;
        q.wake(this.x + hx * L * 0.3, this.z + hz * L * 0.3, strength);
      }
    }
  }

  dispose() {
    this.materials.forEach((m) => m.dispose());
    this.textures.forEach((t) => t.dispose());
  }
}

export function randomVariety(r: () => number): Variety {
  // roughly how a garden pond is stocked: lots of kohaku and sanke, a few of the rest
  const w: [Variety, number][] = [['kohaku', 5], ['sanke', 3.5], ['showa', 3], ['tancho', 1], ['yamabuki', 2], ['platinum', 1.5], ['orenji', 1.5], ['asagi', 1.5], ['shusui', 1], ['chagoi', 1.2]];
  let t = r() * w.reduce((s, [, v]) => s + v, 0);
  for (const [k, v] of w) { t -= v; if (t <= 0) return k; }
  return 'kohaku';
}
