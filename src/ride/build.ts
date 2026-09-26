import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { CROSSING_AT, DISTRICT, districtAt, type DistrictId, Road } from './path';

/**
 * Building the world a block at a time.
 *
 * Every chunk of road — CHUNK metres of it — is built when it comes into
 * view and thrown away when it is behind. Everything in it is made from a
 * handful of unit shapes, each scaled, placed and coloured, then merged into
 * one mesh per material: toon-shaded solids, things that glow at night, the
 * signs, and the wires. A chunk is four draw calls however much is in it.
 *
 * Nothing is random. Every choice is a hash of where it is, so the same bend
 * of road always has the same house on it.
 */

export const CHUNK = 40;

export function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const hash = (n: number) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

/* ── unit shapes ─────────────────────────────────────────────────────── */

const U = {
  box: new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0),
  cyl: new THREE.CylinderGeometry(0.5, 0.5, 1, 10).translate(0, 0.5, 0),
  cyl6: new THREE.CylinderGeometry(0.5, 0.5, 1, 6).translate(0, 0.5, 0),
  blob: new THREE.IcosahedronGeometry(1, 1),
  ball: new THREE.SphereGeometry(1, 10, 8),
  hip: new THREE.ConeGeometry(Math.SQRT1_2, 1, 4, 1).rotateY(Math.PI / 4).translate(0, 0.5, 0),
  gable: (() => {
    const s = new THREE.Shape();
    s.moveTo(-0.5, 0);
    s.lineTo(0.5, 0);
    s.lineTo(0, 1);
    s.closePath();
    return new THREE.ExtrudeGeometry(s, { depth: 1, bevelEnabled: false }).translate(0, 0, -0.5).rotateY(Math.PI / 2);
  })(),
  plane: new THREE.PlaneGeometry(1, 1),
};

const Q = new THREE.Quaternion();
const V = new THREE.Vector3();
const SC = new THREE.Vector3();
const E = new THREE.Euler();
/** A local transform: position, size, and a turn about y (and optionally x, z). */
export function local(x: number, y: number, z: number, sx: number, sy: number, sz: number, ry = 0, rx = 0, rz = 0) {
  E.set(rx, ry, rz);
  Q.setFromEuler(E);
  V.set(x, y, z);
  SC.set(sx, sy, sz);
  return new THREE.Matrix4().compose(V, Q, SC);
}

/** Geometry collected for one material, merged at the end. */
export class Bucket {
  parts: THREE.BufferGeometry[] = [];
  constructor(private keepUv = false) {}
  add(geo: THREE.BufferGeometry, color: THREE.ColorRepresentation, m: THREE.Matrix4, jitter = 0.06) {
    const g = geo.index ? geo.toNonIndexed() : geo.clone();
    if (!this.keepUv && g.getAttribute('uv')) g.deleteAttribute('uv');
    g.applyMatrix4(m);
    const n = g.attributes.position!.count;
    const c = new THREE.Color(color);
    const e = m.elements;
    const k = 1 + (hash(e[12]! * 0.37 + e[14]! * 0.71) - 0.5) * jitter;
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { arr[i * 3] = c.r * k; arr[i * 3 + 1] = c.g * k; arr[i * 3 + 2] = c.b * k; }
    g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
    this.parts.push(g);
  }
  mesh(mat: THREE.Material) {
    if (!this.parts.length) return null;
    const g = mergeGeometries(this.parts);
    for (const p of this.parts) p.dispose();
    this.parts = [];
    if (!g) return null;
    g.computeBoundingSphere();
    return new THREE.Mesh(g, mat);
  }
}

/* ── the signs ───────────────────────────────────────────────────────── */

const SIGNS: [string, string, string, boolean][] = [
  ['ラーメン', '#c8231c', '#fff4e0', true], ['喫茶', '#2c4a3a', '#f6e7c8', true], ['本屋', '#f2e6c8', '#23303e', true], ['居酒屋', '#1c1c24', '#ff9a3a', true],
  ['花屋', '#e8f0d8', '#b8326a', true], ['銭湯', '#1e5a8a', '#ffffff', true], ['薬', '#ffffff', '#1a6fc0', false], ['パン', '#f5c24a', '#5a2a10', false],
  ['カラオケ', '#e0288a', '#fff2fa', true], ['寿司', '#f4ecdc', '#1a1a1a', false], ['古本', '#6a3a1e', '#ffe3a8', true], ['八百屋', '#2f8a3a', '#fffbe0', true],
  ['ホテル', '#3a2a7a', '#ffd9f0', true], ['映画', '#101010', '#ffcf3a', false], ['たばこ', '#d8352a', '#ffffff', true], ['食堂', '#fff8e8', '#c8231c', false],
];
export const SIGN_COUNT = SIGNS.length;

export function signAtlas() {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 1024;
  const g = c.getContext('2d')!;
  const font = "'Hiragino Sans', 'Yu Gothic', 'Meiryo', 'Noto Sans JP', 'Noto Sans CJK JP', 'IPAGothic', sans-serif";
  SIGNS.forEach(([text, bg, fg, vertical], i) => {
    const x = (i % 4) * 256;
    const y = Math.floor(i / 4) * 256;
    g.fillStyle = bg;
    g.fillRect(x, y, 256, 256);
    g.strokeStyle = fg;
    g.lineWidth = 8;
    g.strokeRect(x + 10, y + 10, 236, 236);
    g.fillStyle = fg;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    const chars = [...text];
    if (vertical) {
      const size = Math.min(88, 220 / chars.length);
      g.font = `700 ${size}px ${font}`;
      chars.forEach((ch, k) => g.fillText(ch, x + 128, y + 128 + (k - (chars.length - 1) / 2) * size * 1.02));
    } else {
      const size = Math.min(120, 440 / chars.length);
      g.font = `700 ${size}px ${font}`;
      g.fillText(text, x + 128, y + 128);
    }
  });
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** A sign quad whose uvs pick one cell of the atlas. */
function signGeo(cell: number) {
  const g = U.plane.clone().toNonIndexed();
  const uv = g.attributes.uv!;
  const cx = cell % 4;
  const cy = Math.floor(cell / 4);
  for (let i = 0; i < uv.count; i++) {
    uv.setXY(i, (cx + uv.getX(i)) / 4, 1 - (cy + 1 - uv.getY(i)) / 4);
  }
  return g;
}

/* ── palettes ────────────────────────────────────────────────────────── */

const WALLS = ['#f2e8d4', '#e9dcc0', '#f6f1e6', '#d8c4a0', '#b48a5e', '#8a6444', '#e6d2b0', '#cfd6d8'];
const ROOFS = ['#4b5a70', '#3c4452', '#58687e', '#9c4a34', '#476a58', '#6a4a3a'];
const LEAVES = ['#3f7d3a', '#4f9444', '#2f6a3a', '#5aa04a', '#36733f'];
const SAKURA = ['#f7b8ca', '#f4a3bb', '#fbd0dc', '#f19ab4'];
const HYDRANGEA = ['#6a80dc', '#8a6ad6', '#5a9ad8', '#b07ad8', '#7aa0f0'];
const WARM = '#d8a060';

/* ── the chunk ───────────────────────────────────────────────────────── */

export interface ChunkMats {
  toon: THREE.Material;
  glow: THREE.Material;
  paper: THREE.Material;
  signs: THREE.Material;
  wires: THREE.LineBasicMaterial;
  towers: THREE.Material;
  water: THREE.Material;
}

interface Ctx {
  road: Road;
  solid: Bucket;
  glow: Bucket;
  paper: Bucket;
  sign: Bucket;
  tower: Bucket;
  water: Bucket;
  wires: number[];
  r: () => number;
}

/** The frame at distance s along the road and d to the right of it, turned to face the road. */
function place(c: Ctx, s: number, d: number, dy = 0) {
  const f = c.road.at(s);
  const pos = f.pos.clone().addScaledVector(f.right, d);
  pos.y += dy;
  const z = f.right.clone().multiplyScalar(d < 0 ? 1 : -1);
  const x = new THREE.Vector3(0, 1, 0).cross(z).normalize();
  return new THREE.Matrix4().makeBasis(x, new THREE.Vector3(0, 1, 0), z).setPosition(pos);
}
const at = (W: THREE.Matrix4, L: THREE.Matrix4) => W.clone().multiply(L);

/**
 * The ground: the road down the middle with its white edge lines, and on each
 * side whatever the district stands on, out to the edge of the chunk's world.
 * On the slope above the sea the right-hand side stops at a cliff.
 */
function ground(c: Ctx, s0: number, s1: number, id: DistrictId) {
  const pos: number[] = [];
  const col: number[] = [];
  const side = id === 'city' || id === 'street' ? '#9a948a' : id === 'fields' ? '#8aa84a' : '#86a050';
  const far = id === 'city' || id === 'street' ? '#77716a' : id === 'fields' ? '#6f9a3c' : '#6a8a44';
  const bands: [number, number, string][] = [
    [-90, -7, far], [-7, -3.35, side], [-3.35, -3.05, '#f0efe8'], [-3.05, 3.05, '#5a5a5e'], [3.05, 3.35, '#f0efe8'], [3.35, 7, side],
  ];
  if (id === 'sea') bands.push([7, 10, '#7a9a4a']);
  else bands.push([7, 90, far]);
  const step = 2;
  const cc = new THREE.Color();
  const push = (s: number, d: number, dy: number, color: string) => {
    const f = c.road.at(s);
    pos.push(f.pos.x + f.right.x * d, f.pos.y + dy + (Math.abs(d) > 20 ? -0.4 : 0), f.pos.z + f.right.z * d);
    cc.set(color);
    const k = 1 + (hash(Math.round(s) * 0.13 + d * 0.7) - 0.5) * 0.08;
    col.push(cc.r * k, cc.g * k, cc.b * k);
  };
  for (let s = s0; s < s1; s += step) {
    const sn = Math.min(s + step, s1);
    for (const [a, b, color] of bands) {
      push(s, a, 0, color); push(sn, a, 0, color); push(s, b, 0, color);
      push(sn, a, 0, color); push(sn, b, 0, color); push(s, b, 0, color);
    }
    if (id === 'sea') {
      // the cliff face down to the water
      push(s, 10, 0, '#8a7a66'); push(sn, 10, 0, '#8a7a66'); push(s, 16, -60, '#5a5046');
      push(sn, 10, 0, '#8a7a66'); push(sn, 16, -60, '#5a5046'); push(s, 16, -60, '#5a5046');
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.computeVertexNormals();
  c.solid.parts.push(g);
}

/* ── things ──────────────────────────────────────────────────────────── */

function tree(c: Ctx, W: THREE.Matrix4, s: number, pink = false, scale = 1) {
  const r = c.r;
  const h = (3 + r() * 3) * scale;
  c.solid.add(U.cyl, '#6a4a32', at(W, local(0, 0, 0, 0.35 * scale, h, 0.35 * scale)));
  const n = 5 + Math.floor(r() * 4);
  const pal = pink ? SAKURA : LEAVES;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + s;
    const rad = (1.2 + r() * 0.9) * scale;
    const d = (i === 0 ? 0 : 1.3 + r() * 0.6) * scale;
    c.solid.add(U.blob, pal[Math.floor(r() * pal.length)]!, at(W, local(Math.cos(a) * d, h + (r() - 0.2) * 1.2 * scale + (i === 0 ? 0.8 * scale : 0), Math.sin(a) * d, rad, rad * 0.85, rad)));
  }
}

function bush(c: Ctx, W: THREE.Matrix4, pal: string[]) {
  const r = c.r;
  for (let i = 0; i < 4; i++) {
    const rad = 0.45 + r() * 0.35;
    c.solid.add(U.blob, pal[Math.floor(r() * pal.length)]!, at(W, local((r() - 0.5) * 1.6, rad * 0.7, (r() - 0.5) * 1.2, rad, rad * 0.8, rad)));
  }
}

function lamp(c: Ctx, W: THREE.Matrix4, h = 5) {
  c.solid.add(U.cyl6, '#3a3f46', at(W, local(0, 0, 0, 0.14, h, 0.14)));
  c.solid.add(U.box, '#3a3f46', at(W, local(0, h - 0.1, 0.6, 0.1, 0.1, 1.2)));
  c.glow.add(U.box, '#fff0c8', at(W, local(0, h - 0.35, 1.1, 0.35, 0.22, 0.5)));
}

function vending(c: Ctx, W: THREE.Matrix4) {
  const col = ['#f4f4f4', '#d9362c', '#2a6ad0', '#1a8a5a'][Math.floor(c.r() * 4)]!;
  c.solid.add(U.box, col, at(W, local(0, 0, 0, 1, 1.85, 0.8)));
  c.glow.add(U.plane, '#a8c8d8', at(W, local(0, 1.15, 0.41, 0.82, 0.8, 1)));
  c.glow.add(U.plane, '#c8d8e0', at(W, local(0, 0.55, 0.41, 0.82, 0.18, 1)));
}

function pole(c: Ctx, W: THREE.Matrix4) {
  c.solid.add(U.cyl6, '#8a8680', at(W, local(0, 0, 0, 0.28, 9, 0.28)));
  c.solid.add(U.box, '#6a6660', at(W, local(0, 8.3, 0, 1.8, 0.12, 0.12)));
  c.solid.add(U.cyl, '#6f7a80', at(W, local(0.35, 6.2, 0, 0.6, 0.9, 0.6)));
}

function house(c: Ctx, W: THREE.Matrix4, big = false) {
  const r = c.r;
  const w = (6 + r() * 3) * (big ? 1.3 : 1);
  const d = 7 + r() * 2;
  const floors = r() < 0.6 ? 2 : 1;
  const h = floors * 3.1;
  const wall = WALLS[Math.floor(r() * WALLS.length)]!;
  const roof = ROOFS[Math.floor(r() * ROOFS.length)]!;
  c.solid.add(U.box, '#6a6a66', at(W, local(0, 0, 0, w + 0.2, 0.4, d + 0.2)));
  c.solid.add(U.box, wall, at(W, local(0, 0.4, 0, w, h, d)));
  if (r() < 0.5) c.solid.add(U.gable, roof, at(W, local(0, h + 0.4, 0, w + 1.2, 1.6 + r(), d + 1.4)));
  else c.solid.add(U.hip, roof, at(W, local(0, h + 0.4, 0, w + 1.3, 1.8 + r() * 0.8, d + 1.3)));
  // the eave between the storeys, the way Japanese houses have it
  if (floors === 2) c.solid.add(U.box, roof, at(W, local(0, 3.3, d / 2 + 0.35, w + 0.4, 0.14, 0.8, 0, -0.25)));
  c.solid.add(U.box, '#4a3626', at(W, local(-w * 0.25, 0.4, d / 2 + 0.02, 1.1, 2.1, 0.08)));
  for (let f = 0; f < floors; f++) {
    const n = 1 + Math.floor(r() * 2);
    for (let k = 0; k < n; k++) {
      const x = f === 0 ? w * 0.18 + k * 1.5 : -w * 0.25 + k * (w * 0.45);
      c.glow.add(U.plane, r() < 0.8 ? WARM : '#cfe6ff', at(W, local(x, 0.4 + f * 3.1 + 1.1, d / 2 + 0.03, 1.2, 1.0, 1)));
      c.solid.add(U.box, '#5a4432', at(W, local(x, 0.4 + f * 3.1 + 0.55, d / 2 + 0.04, 1.35, 0.08, 0.1)));
    }
  }
  // the air conditioner on the side, and the plants by the door
  if (r() < 0.6) c.solid.add(U.box, '#e6e6e0', at(W, local(w / 2 + 0.35, 0.4, d * 0.2, 0.7, 0.6, 0.35)));
  if (r() < 0.7) bush(c, at(W, local(w * 0.1, 0.4, d / 2 + 0.6, 0.5, 0.5, 0.5)), LEAVES);
  // a pole of washing on the balcony
  if (floors === 2 && r() < 0.35) {
    c.solid.add(U.box, '#bbb', at(W, local(0, 4.8, d / 2 + 0.5, w * 0.7, 0.05, 0.05)));
    for (let k = 0; k < 4; k++) c.solid.add(U.plane, ['#ffffff', '#f2c6d0', '#9fc4e8', '#f6e6a0'][k]!, at(W, local(-w * 0.25 + k * w * 0.16, 4.4, d / 2 + 0.52, 0.8, 0.8, 1)));
  }
}

function shop(c: Ctx, W: THREE.Matrix4) {
  const r = c.r;
  const w = 5 + r() * 2.5;
  const d = 8;
  const wall = WALLS[Math.floor(r() * WALLS.length)]!;
  c.solid.add(U.box, wall, at(W, local(0, 0, -0.6, w, 6.6, d)));
  c.solid.add(U.gable, ROOFS[Math.floor(r() * ROOFS.length)]!, at(W, local(0, 6.6, -0.6, w + 0.6, 1.3, d + 0.8)));
  // the shop front, lit from inside
  c.glow.add(U.plane, r() < 0.5 ? '#a8763e' : '#9a6a3a', at(W, local(0, 1.35, d / 2 - 0.58, w * 0.85, 2.3, 1)));
  // an awning in stripes
  const aw = ['#c8231c', '#1e5a8a', '#2f8a3a', '#e6a21a', '#6a3a7a'][Math.floor(r() * 5)]!;
  c.solid.add(U.box, aw, at(W, local(0, 2.9, d / 2 + 0.2, w, 0.12, 1.8, 0, 0.25)));
  // noren at the door
  const nc = ['#1c2c5a', '#7a1a1a', '#2a4a2a'][Math.floor(r() * 3)]!;
  for (let k = 0; k < 3; k++) c.solid.add(U.plane, nc, at(W, local(-0.6 + k * 0.6, 1.9, d / 2 + 0.02, 0.55, 0.8, 1)));
  // the sign: over the awning, or hanging out over the street
  const cell = Math.floor(r() * SIGN_COUNT);
  if (r() < 0.5) c.sign.add(signGeo(cell), '#ffffff', at(W, local(0, 4.2, d / 2 - 0.55, w * 0.7, w * 0.35, 1)));
  else c.sign.add(signGeo(cell), '#ffffff', at(W, local(w / 2 - 0.3, 4.6, d / 2 + 0.3, 0.9, 2.2, 1, Math.PI / 2)));
  c.paper.add(U.plane, '#ffe7b8', at(W, local(0, 5.2, d / 2 - 0.57, w * 0.6, 1.0, 1)));
}

function tower(c: Ctx, W: THREE.Matrix4, s: number) {
  const r = c.r;
  const w = 10 + r() * 12;
  const d = 10 + r() * 10;
  const h = 14 + Math.pow(r(), 1.5) * 55;
  const col = ['#b8b4ae', '#a0a8b0', '#c8c0b4', '#8f969e', '#d6d0c6', '#9a8a7a'][Math.floor(r() * 6)]!;
  c.tower.add(U.box, col, at(W, local(0, 0, -d / 2 + 1, w, h, d)));
  c.solid.add(U.box, '#6a6e74', at(W, local(0, h, -d / 2 + 1, w * 0.4, 2.5, d * 0.4)));
  // neon, hung vertically on the corner
  if (r() < 0.7) c.sign.add(signGeo(Math.floor(r() * SIGN_COUNT)), '#ffffff', at(W, local(w / 2 - 0.2, 5 + r() * 6, 1.4, 1.4, 5 + r() * 3, 1, Math.PI / 2)));
  if (r() < 0.35) c.sign.add(signGeo(Math.floor(r() * SIGN_COUNT)), '#ffffff', at(W, local(0, h * 0.6, 1.05, w * 0.5, w * 0.3, 1)));
  // the ground floor, lit
  c.glow.add(U.plane, r() < 0.3 ? '#7a98a8' : '#a07a4a', at(W, local(0, 1.5, 1.05, w * 0.8, 2.6, 1)));
  void s;
}

function torii(c: Ctx, W: THREE.Matrix4, span: number, h: number, col = '#d9442a') {
  for (const x of [-span / 2, span / 2]) {
    c.solid.add(U.cyl, col, at(W, local(x, 0, 0, 0.45, h, 0.45)));
    c.solid.add(U.cyl, '#2a2a2a', at(W, local(x, 0, 0, 0.55, 0.5, 0.55)));
  }
  c.solid.add(U.box, col, at(W, local(0, h * 0.78, 0, span + 1.2, 0.35, 0.35)));
  c.solid.add(U.box, col, at(W, local(0, h - 0.1, 0, span + 2.2, 0.45, 0.5)));
  c.solid.add(U.box, '#202020', at(W, local(0, h + 0.3, 0, span + 2.6, 0.25, 0.6)));
}

function lantern(c: Ctx, W: THREE.Matrix4) {
  c.solid.add(U.cyl6, '#9a948a', at(W, local(0, 0, 0, 0.9, 0.3, 0.9)));
  c.solid.add(U.cyl6, '#a8a296', at(W, local(0, 0.3, 0, 0.35, 1.0, 0.35)));
  c.paper.add(U.box, '#f6e6c0', at(W, local(0, 1.3, 0, 0.55, 0.5, 0.55)));
  c.solid.add(U.hip, '#8a847a', at(W, local(0, 1.8, 0, 1.1, 0.5, 1.1)));
}

/* ── districts ───────────────────────────────────────────────────────── */

function seaChunk(c: Ctx, s0: number, s1: number) {
  const r = c.r;
  // houses up the slope on the left, behind a stone wall
  for (let s = s0 + r() * 4; s < s1; s += 9 + r() * 4) {
    const W = place(c, s, -(12 + r() * 5), 0.8 + r() * 2);
    house(c, W);
    if (r() < 0.4) {
      const W2 = place(c, s + 4, -(24 + r() * 6), 4 + r() * 3);
      house(c, W2, r() < 0.3);
    }
  }
  for (let s = s0; s < s1; s += 4) {
    c.solid.add(U.box, '#a8a090', at(place(c, s, -7.4), local(0, 0, 0, 4.1, 1.4 + hash(s) * 0.6, 0.8)));
    if (hash(s * 1.7) < 0.55) bush(c, place(c, s + 2, -5.2), HYDRANGEA);
  }
  // the guard rail on the sea side, and a bench now and then
  for (let s = s0; s < s1; s += 2.5) c.solid.add(U.box, '#f2f0ea', at(place(c, s, 4.6), local(0, 0, 0, 0.12, 0.9, 0.12)));
  for (let s = s0; s < s1; s += 10) c.solid.add(U.box, '#e8e6e0', at(place(c, s + 5, 4.6), local(0, 0.75, 0, 10, 0.18, 0.1)));
  for (let s = s0 + 6; s < s1; s += 18) if (r() < 0.4) tree(c, place(c, s, 8), s, false, 0.8);
  if (r() < 0.35) vending(c, place(c, s0 + 20, -4.2));
}

function streetChunk(c: Ctx, s0: number, s1: number) {
  const r = c.r;
  for (const side of [-1, 1]) {
    for (let s = s0 + r() * 2; s < s1; s += 6.5 + r() * 1.5) shop(c, place(c, s, side * 9.5));
  }
  // paper lanterns strung across the street
  for (let s = s0 + 3; s < s1; s += 7) {
    const f = c.road.at(s);
    const n = 6;
    for (let k = 0; k <= n; k++) {
      const u = k / n;
      const d = -5.5 + u * 11;
      const y = 5.2 - Math.sin(u * Math.PI) * 0.9;
      const p = f.pos.clone().addScaledVector(f.right, d);
      const Wl = new THREE.Matrix4().makeTranslation(p.x, p.y + y, p.z);
      if (k > 0 && k < n) {
        c.paper.add(U.cyl6, k % 2 ? '#ff5a3a' : '#ffd24a', at(Wl, local(0, -0.35, 0, 0.42, 0.62, 0.42)));
        c.solid.add(U.cyl6, '#1a1a1a', at(Wl, local(0, 0.27, 0, 0.3, 0.1, 0.3)));
      }
    }
    for (let k = 0; k < n; k++) {
      const a = f.pos.clone().addScaledVector(f.right, -5.5 + (k / n) * 11);
      const b = f.pos.clone().addScaledVector(f.right, -5.5 + ((k + 1) / n) * 11);
      c.wires.push(a.x, a.y + 5.2 - Math.sin((k / n) * Math.PI) * 0.9, a.z, b.x, b.y + 5.2 - Math.sin(((k + 1) / n) * Math.PI) * 0.9, b.z);
    }
  }
  for (let s = s0 + 10; s < s1; s += 20) if (r() < 0.5) vending(c, place(c, s, r() < 0.5 ? -5 : 5));
  // bicycles parked outside
  for (let s = s0 + 4; s < s1; s += 9) if (r() < 0.4) c.solid.add(U.box, '#c8d0d8', at(place(c, s, 5.4 * (r() < 0.5 ? -1 : 1)), local(0, 0.3, 0, 1.6, 0.6, 0.1)));
}

function cityChunk(c: Ctx, s0: number, s1: number, dist: ReturnType<typeof districtAt>) {
  const r = c.r;
  // keep the railway's corridor clear of buildings
  const cs = dist.start + CROSSING_AT * DISTRICT;
  const clear = (s: number, half = 16) => Math.abs(s - cs) > half;
  for (const side of [-1, 1]) {
    for (let s = s0 + r() * 3; s < s1; s += 14 + r() * 8) if (clear(s, 20)) tower(c, place(c, s, side * (11 + r() * 3)), s);
  }
  for (let s = s0 + 5; s < s1; s += 16) lamp(c, place(c, s, 4.8));
  for (let s = s0 + 13; s < s1; s += 16) lamp(c, place(c, s, -4.8));
  if (r() < 0.5) vending(c, place(c, s0 + 8, -5.6));
  // a konbini, lit up all night
  if (r() < 0.4 && clear(s0 + 25, 18)) {
    const W = place(c, s0 + 25, 9);
    c.solid.add(U.box, '#f4f4f0', at(W, local(0, 0, -2, 12, 4, 8)));
    c.glow.add(U.plane, '#9ab8c4', at(W, local(0, 1.6, 2.03, 11, 2.6, 1)));
    c.paper.add(U.box, '#2a9a5a', at(W, local(0, 3.4, 2.05, 12, 0.35, 0.1)));
    c.paper.add(U.box, '#2a6ad0', at(W, local(0, 3.05, 2.05, 12, 0.3, 0.1)));
  }
  // the railway crossing
  if (cs >= s0 && cs < s1) {
    for (const off of [-0.72, 0.72]) {
      const f = c.road.at(cs + off);
      for (let d = -70; d < 70; d += 4) {
        const p = f.pos.clone().addScaledVector(f.right, d);
        const W = new THREE.Matrix4().makeBasis(f.right, new THREE.Vector3(0, 1, 0), f.fwd.clone().negate()).setPosition(p);
        c.solid.add(U.box, '#8a8a90', at(W, local(0, 0.02, 0, 4, 0.12, 0.1)));
      }
    }
    for (let d = -70; d < 70; d += 1.2) c.solid.add(U.box, '#5a4a3a', at(place(c, cs, d), local(0, -0.02, 0, 2.4, 0.1, 0.3)));
    for (const side of [-1, 1]) {
      const W = place(c, cs - side * 3, side * 4.6);
      c.solid.add(U.cyl6, '#f2f2f2', at(W, local(0, 0, 0, 0.18, 3.6, 0.18)));
      // the black-and-yellow striped crossbuck post
      for (let k = 0; k < 4; k++) c.solid.add(U.box, k % 2 ? '#1a1a1a' : '#f2c21a', at(W, local(0, k * 0.4, 0, 0.3, 0.4, 0.3)));
      c.solid.add(U.box, '#f2c21a', at(W, local(0, 3.3, 0, 1.4, 0.2, 0.08, 0, 0, 0.6)));
      c.solid.add(U.box, '#f2c21a', at(W, local(0, 3.3, 0, 1.4, 0.2, 0.08, 0, 0, -0.6)));
    }
  }
  // a zebra crossing, now and then
  if (r() < 0.4) {
    const cz = s0 + 20;
    for (let d = -2.6; d <= 2.6; d += 0.9) c.solid.add(U.box, '#f2f2ee', at(place(c, cz, d), local(0, 0.01, 0, 0.5, 0.02, 3)));
  }
}

function fieldsChunk(c: Ctx, s0: number, s1: number, dist: ReturnType<typeof districtAt>) {
  const r = c.r;
  // paddies: flat water-green squares with low earth ridges between them
  for (const side of [-1, 1]) {
    for (let s = s0; s < s1; s += 10) {
      for (let k = 0; k < 4; k++) {
        const d = side * (10 + k * 12);
        const W = place(c, s + 5, d, -0.1);
        const green = ['#7fb448', '#8ec052', '#6ea842', '#9cc85a'][Math.floor(hash(s * 0.3 + d) * 4)]!;
        c.solid.add(U.box, green, at(W, local(0, 0, 0, 9.4, 0.3, 11.4)));
        for (let q = 0; q < 6; q++) c.solid.add(U.box, '#5f8e36', at(W, local(-4 + q * 1.6, 0.3, 0, 0.12, 0.25, 11)));
      }
    }
  }
  // the torii tunnel
  const tu = dist.u;
  const t0 = dist.start + 0.34 * DISTRICT;
  const t1 = dist.start + 0.46 * DISTRICT;
  for (let s = Math.max(s0, t0 - ((t0 - s0) % 3.6) + 3.6); s < Math.min(s1, t1); s += 3.6) torii(c, at(place(c, s, 0.001), local(0, 0, 0, 1, 1, 1, Math.PI / 2)), 7.6, 5.4);
  void tu;
  // a shrine by the road at the end of the tunnel, with its lanterns
  const sh = dist.start + 0.48 * DISTRICT;
  if (sh >= s0 && sh < s1) {
    const W = place(c, sh, -16);
    c.solid.add(U.box, '#8a7a66', at(W, local(0, 0, 0, 8, 0.6, 8)));
    c.solid.add(U.box, '#e6dcc4', at(W, local(0, 0.6, 0, 6, 3.2, 5)));
    c.solid.add(U.gable, '#3a3a40', at(W, local(0, 3.8, 0, 7.4, 2.4, 6.6)));
    lantern(c, at(W, local(-4, 0, 5, 1, 1, 1)));
    lantern(c, at(W, local(4, 0, 5, 1, 1, 1)));
    torii(c, at(W, local(0, 0, 9, 1, 1, 1)), 4, 4.2);
  }
  // cherry trees along the road, and farmhouses and woods behind
  for (let s = s0 + r() * 6; s < s1; s += 11 + r() * 6) {
    const inTunnel = s > t0 - 4 && s < t1 + 4;
    if (!inTunnel) tree(c, place(c, s, (r() < 0.5 ? -1 : 1) * (6 + r())), s, r() < 0.6, 1);
  }
  if (r() < 0.45) {
    const W = place(c, s0 + 20, (r() < 0.5 ? -1 : 1) * 50);
    c.solid.add(U.box, '#d8c8a8', at(W, local(0, 0, 0, 10, 3.2, 8)));
    c.solid.add(U.hip, '#8a6a3a', at(W, local(0, 3.2, 0, 13, 5, 11)));
    c.glow.add(U.plane, WARM, at(W, local(2, 1.2, 4.03, 1.6, 1.2, 1)));
  }
  for (let s = s0; s < s1; s += 12) for (const side of [-1, 1]) if (hash(s + side) < 0.5) tree(c, place(c, s, side * (70 + hash(s * 3) * 15)), s, false, 1.8);
  // a bus stop, with its bench and its sign
  if (r() < 0.25) {
    const W = place(c, s0 + 12, 4.8);
    c.solid.add(U.cyl6, '#cfcfcf', at(W, local(0, 0, 0, 0.1, 2.4, 0.1)));
    c.solid.add(U.cyl, '#d9362c', at(W, local(0, 2.2, 0, 0.8, 0.12, 0.8, 0, Math.PI / 2)));
    c.solid.add(U.box, '#8a6a4a', at(W, local(2, 0, 0.6, 2, 0.45, 0.5)));
  }
}

/* ── the chunk ───────────────────────────────────────────────────────── */

export function buildChunk(road: Road, i: number, mats: ChunkMats) {
  const s0 = i * CHUNK;
  const s1 = s0 + CHUNK;
  const dist = districtAt(s0 + 1);
  const c: Ctx = {
    road,
    solid: new Bucket(),
    glow: new Bucket(),
    paper: new Bucket(),
    sign: new Bucket(true),
    tower: new Bucket(),
    water: new Bucket(),
    wires: [],
    r: mulberry(i * 7919 + 13),
  };
  ground(c, s0, s1 + 0.01, dist.id);
  if (dist.id === 'sea') seaChunk(c, s0, s1);
  if (dist.id === 'street') streetChunk(c, s0, s1);
  if (dist.id === 'city') cityChunk(c, s0, s1, dist);
  if (dist.id === 'fields') fieldsChunk(c, s0, s1, dist);
  // utility poles all the way, and their wires to the next pole along
  const P = 32;
  for (let s = Math.ceil(s0 / P) * P; s < s1; s += P) {
    if (dist.id === 'fields' && dist.u > 0.32 && dist.u < 0.48) continue;
    const side = dist.id === 'sea' ? -1 : 1;
    pole(c, place(c, s, side * 5.6));
    if (dist.id !== 'city') lamp(c, place(c, s + 16, side * 5.2));
    const a = road.at(s);
    const b = road.at(s + P);
    for (const [dy, dx] of [[8.3, -0.8], [8.3, 0.8], [7.6, 0]]) {
      const pa = a.pos.clone().addScaledVector(a.right, side * 5.6 + dx);
      const pb = b.pos.clone().addScaledVector(b.right, side * 5.6 + dx);
      for (let k = 0; k < 8; k++) {
        const u0 = k / 8;
        const u1 = (k + 1) / 8;
        const p0 = pa.clone().lerp(pb, u0);
        const p1 = pa.clone().lerp(pb, u1);
        c.wires.push(p0.x, p0.y + dy - Math.sin(u0 * Math.PI) * 0.7, p0.z, p1.x, p1.y + dy - Math.sin(u1 * Math.PI) * 0.7, p1.z);
      }
    }
  }
  const group = new THREE.Group();
  for (const [b, m] of [[c.solid, mats.toon], [c.glow, mats.glow], [c.paper, mats.paper], [c.sign, mats.signs], [c.tower, mats.towers], [c.water, mats.water]] as const) {
    const mesh = b.mesh(m);
    if (mesh) group.add(mesh);
  }
  if (c.wires.length) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(c.wires, 3));
    group.add(new THREE.LineSegments(g, mats.wires));
  }
  group.userData.district = dist.id;
  return group;
}

export function disposeChunk(g: THREE.Group) {
  g.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.geometry) m.geometry.dispose();
  });
}
