/**
 * A ligne-claire kit for “Walks of Life”: one even ink line round every
 * shape, flat colour inside it, shadows laid as flat darker shapes or fine
 * parallel hatching, and a print grain over the finished plate.
 *
 * Shapes are drawn in groups: every outline in a group is stroked first, as
 * a fat ink line, and every fill goes on top, so where two parts of the same
 * colour meet (an arm and a hand, a thigh and a shin) the seam disappears
 * and only the silhouette keeps its line.
 */

export type G = CanvasRenderingContext2D;
export type Pt = [number, number];

export function rng(seed: number) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
export const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const TAU = Math.PI * 2;
export const D = Math.PI / 180;
export const pick = <T,>(R: () => number, xs: readonly T[]): T => xs[Math.floor(R() * xs.length) % xs.length];

export const INK = '#1f1a17';

/** The house palette: flat, a little dusty, nothing at full saturation. */
export const C = {
  ink: INK,
  paper: '#fbf6e6', cream: '#f4ecd6', bone: '#e9dfc6', sand: '#e6c58f', butter: '#f3dc8a', mustard: '#e3b23c', ochre: '#d39a2c',
  orange: '#ee7f3b', tang: '#f26a1b', coral: '#ef7d6a', red: '#d9493f', brick: '#a9483a', wine: '#7d2a3a', rose: '#f4a6a0', pink: '#f0a3c4', magenta: '#c8336e',
  lav: '#a99bd8', violet: '#7b62c4', plum: '#5d3a6a', navy: '#2c3f6b', denim: '#4a6fa5', blue: '#3b7dd8', sky: '#8cc8e8', ice: '#cfe8ef', teal: '#3f8f8a', sea: '#6cc0b0', mint: '#bfe3c8',
  green: '#4f9a5a', grass: '#8cbf5a', olive: '#8a9a4a', moss: '#5f6f3a', forest: '#2f5a3e',
  brown: '#9a5b34', wood: '#b9824e', tan: '#d2a679', khaki: '#c7b07a', chocolate: '#5a3826',
  grey: '#9aa0a6', ash: '#c9c9c4', slate: '#5c6670', char: '#3a3a40', black: '#26262b', white: '#fbfaf5',
};

export const SKIN = ['#f6d4bb', '#efc19f', '#e2a882', '#c98c62', '#a8704a', '#85553a', '#5f3c2a'] as const;
export const HAIR = { black: '#231d1b', dark: '#3b2a22', brown: '#6b4128', auburn: '#9b4a2a', ginger: '#c8662e', blond: '#e2bd6a', ash: '#b9a88a', grey: '#b8b4ae', white: '#ecebe6', pink: '#f08fb0', blue: '#4a78c8' } as const;

/** Darken or lighten a hex colour by k (−1…1). */
export function shade(hex: string, k: number) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  if (k < 0) { r *= 1 + k; g *= 1 + k; b *= 1 + k; } else { r += (255 - r) * k; g += (255 - g) * k; b += (255 - b) * k; }
  return `rgb(${r | 0},${g | 0},${b | 0})`;
}
/** Mix two hex colours. */
export function mix(a: string, b: string, t: number) {
  const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16);
  const ch = (s: number) => Math.round(lerp((A >> s) & 255, (B >> s) & 255, t));
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
}

/* ───────── paths ───────── */

export function poly(g: G, pts: Pt[], close = true) {
  g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
  if (close) g.closePath();
}
/** A closed shape through the points with its corners rounded by r. */
export function rounded(g: G, pts: Pt[], r: number) {
  const n = pts.length;
  g.beginPath();
  for (let i = 0; i < n; i++) {
    const p = pts[i], a = pts[(i + n - 1) % n], b = pts[(i + 1) % n];
    const da = Math.hypot(a[0] - p[0], a[1] - p[1]) || 1, db = Math.hypot(b[0] - p[0], b[1] - p[1]) || 1;
    const ra = Math.min(r, da / 2), rb = Math.min(r, db / 2);
    const p1: Pt = [p[0] + ((a[0] - p[0]) / da) * ra, p[1] + ((a[1] - p[1]) / da) * ra];
    const p2: Pt = [p[0] + ((b[0] - p[0]) / db) * rb, p[1] + ((b[1] - p[1]) / db) * rb];
    if (i === 0) g.moveTo(p1[0], p1[1]); else g.lineTo(p1[0], p1[1]);
    g.quadraticCurveTo(p[0], p[1], p2[0], p2[1]);
  }
  g.closePath();
}
/** A smooth closed curve through the points (Catmull-Rom). */
export function blob(g: G, pts: Pt[], close = true) {
  const n = pts.length;
  g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
  const m = close ? n : n - 1;
  for (let i = 0; i < m; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const q0 = !close && i === 0 ? p1 : p0, q3 = !close && i + 2 >= n ? p2 : p3;
    g.bezierCurveTo(p1[0] + (p2[0] - q0[0]) / 6, p1[1] + (p2[1] - q0[1]) / 6, p2[0] - (q3[0] - p1[0]) / 6, p2[1] - (q3[1] - p1[1]) / 6, p2[0], p2[1]);
  }
  if (close) g.closePath();
}

/* ───────── inked shapes ───────── */

export interface Pen { lw: number; ink?: string }
/** Fill the current path flat and draw its outline. */
export function inkFill(g: G, fill: string | CanvasPattern | CanvasGradient | null, lw: number, ink = INK) {
  if (fill) { g.fillStyle = fill; g.fill(); }
  if (lw > 0) { g.lineWidth = lw; g.strokeStyle = ink; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke(); }
}
export function line(g: G, pts: Pt[], lw: number, ink = INK) {
  poly(g, pts, false); g.lineWidth = lw; g.strokeStyle = ink; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke();
}
export function ln(g: G, x1: number, y1: number, x2: number, y2: number, lw: number, ink = INK) {
  g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.lineWidth = lw; g.strokeStyle = ink; g.lineCap = 'round'; g.stroke();
}
export function circle(g: G, x: number, y: number, r: number, fill: string | null, lw: number, ink = INK) { g.beginPath(); g.arc(x, y, r, 0, TAU); inkFill(g, fill, lw, ink); }
export function ellipse(g: G, x: number, y: number, rx: number, ry: number, rot: number, fill: string | null, lw: number, ink = INK) { g.beginPath(); g.ellipse(x, y, Math.abs(rx), Math.abs(ry), rot, 0, TAU); inkFill(g, fill, lw, ink); }
export function rect(g: G, x: number, y: number, w: number, h: number, fill: string | null, lw: number, ink = INK) { g.beginPath(); g.rect(x, y, w, h); inkFill(g, fill, lw, ink); }
export function shape(g: G, pts: Pt[], fill: string | null, lw: number, ink = INK) { poly(g, pts); inkFill(g, fill, lw, ink); }

/**
 * A group of parts drawn as one silhouette. Each part is a fat stroked
 * polyline (a limb) or a closed polygon; outlines go down first, fills on top.
 */
export type Part = { k: 'limb'; pts: Pt[]; w: number } | { k: 'poly'; pts: Pt[]; r?: number } | { k: 'blob'; pts: Pt[] } | { k: 'ell'; x: number; y: number; rx: number; ry: number; rot?: number } | { k: 'path'; d: (g: G) => void };
export function group(g: G, parts: Part[], fill: string, lw: number, ink = INK) {
  const trace = (p: Part) => {
    if (p.k === 'poly') { if (p.r) rounded(g, p.pts, p.r); else poly(g, p.pts); }
    else if (p.k === 'blob') blob(g, p.pts);
    else if (p.k === 'ell') { g.beginPath(); g.ellipse(p.x, p.y, Math.abs(p.rx), Math.abs(p.ry), p.rot ?? 0, 0, TAU); }
    else if (p.k === 'path') { g.beginPath(); p.d(g); }
  };
  g.lineJoin = 'round'; g.lineCap = 'round';
  // outlines
  g.strokeStyle = ink; g.fillStyle = ink;
  for (const p of parts) {
    if (p.k === 'limb') { poly(g, p.pts, false); g.lineWidth = p.w + lw * 2; g.stroke(); }
    else { trace(p); g.lineWidth = lw * 2; g.stroke(); }
  }
  // fills
  g.strokeStyle = fill; g.fillStyle = fill;
  for (const p of parts) {
    if (p.k === 'limb') { poly(g, p.pts, false); g.lineWidth = p.w; g.stroke(); }
    else { trace(p); g.fill(); }
  }
}

/* ───────── hatching, stipple, shadow ───────── */

/** Parallel lines across the current clip, at an angle, gap apart. */
export function hatchRect(g: G, x: number, y: number, w: number, h: number, angle: number, gap: number, lw: number, col = INK, alpha = 1) {
  g.save(); g.globalAlpha *= alpha; g.strokeStyle = col; g.lineWidth = lw; g.lineCap = 'butt';
  const cx = x + w / 2, cy = y + h / 2, R = Math.hypot(w, h) / 2 + 2, ca = Math.cos(angle), sa = Math.sin(angle);
  g.beginPath();
  for (let d = -R; d <= R; d += gap) { g.moveTo(cx + ca * -R - sa * d, cy + sa * -R + ca * d); g.lineTo(cx + ca * R - sa * d, cy + sa * R + ca * d); }
  g.stroke(); g.restore();
}
export function hatchIn(g: G, trace: () => void, bbox: [number, number, number, number], angle: number, gap: number, lw: number, col = INK, alpha = 1) {
  g.save(); trace(); g.clip(); hatchRect(g, bbox[0], bbox[1], bbox[2], bbox[3], angle, gap, lw, col, alpha); g.restore();
}
export function stippleIn(g: G, trace: () => void, bbox: [number, number, number, number], density: number, r: number, col = INK, seed = 1) {
  g.save(); trace(); g.clip(); g.fillStyle = col; const R = rng(seed);
  const n = Math.floor(bbox[2] * bbox[3] * density);
  for (let i = 0; i < n; i++) { g.beginPath(); g.arc(bbox[0] + R() * bbox[2], bbox[1] + R() * bbox[3], r * (0.6 + R() * 0.6), 0, TAU); g.fill(); }
  g.restore();
}
export function bboxOf(pts: Pt[]): [number, number, number, number] {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  return [x0, y0, x1 - x0, y1 - y0];
}

/* ───────── grain ───────── */

let grainTile: HTMLCanvasElement | null = null;
function grainCanvas() {
  if (grainTile) return grainTile;
  const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d')!;
  const im = g.createImageData(512, 512), R = rng(77);
  for (let i = 0; i < im.data.length; i += 4) { const v = 128 + (R() - 0.5) * 120 + (R() - 0.5) * 60; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; }
  g.putImageData(im, 0, 0);
  return (grainTile = c);
}
/** A soft print grain and a few fibres over the whole plate. */
export function grain(g: G, w: number, h: number, amount = 0.1, seed = 3) {
  g.save();
  const pat = g.createPattern(grainCanvas(), 'repeat')!;
  g.globalCompositeOperation = 'overlay'; g.globalAlpha = amount; g.fillStyle = pat; g.fillRect(0, 0, w, h);
  g.globalCompositeOperation = 'source-over';
  const R = rng(seed); g.globalAlpha = 0.05; g.fillStyle = '#fff';
  for (let i = 0; i < (w * h) / 900; i++) g.fillRect(R() * w, R() * h, 1 + R() * 1.5, 1 + R() * 1.5);
  g.fillStyle = '#000'; g.globalAlpha = 0.04;
  for (let i = 0; i < (w * h) / 1400; i++) g.fillRect(R() * w, R() * h, 1, 1);
  g.restore();
}

/* ───────── isometric ───────── */

/**
 * A 2:1 isometric camera. World x runs down-right, y runs down-left, z up;
 * units are centimetres; `s` is pixels per centimetre along x.
 */
export class Iso {
  constructor(public ox: number, public oy: number, public s: number) {}
  p(x: number, y: number, z = 0): Pt { return [this.ox + (x - y) * this.s, this.oy + (x + y) * this.s * 0.5 - z * this.s * 1.118]; }
  /** Depth for sorting: larger is nearer the viewer. */
  depth(x: number, y: number, z = 0) { return x + y + z * 0.001; }
  /** Pixels per centimetre of height (for upright things like people). */
  get zs() { return this.s * 1.118; }
}

export interface BoxStyle { top: string; left: string; right: string; lw: number; ink?: string; noTop?: boolean }
/**
 * A box from (x, y, z) of size w × d × h. The two faces toward the viewer are
 * the +x face (right) and the +y face (left).
 */
export function box(g: G, I: Iso, x: number, y: number, z: number, w: number, d: number, h: number, st: BoxStyle) {
  const P = (a: number, b: number, c: number) => I.p(a, b, c);
  const ink = st.ink ?? INK;
  // +y face (left-front)
  shape(g, [P(x, y + d, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x, y + d, z + h)], st.left, st.lw, ink);
  // +x face (right-front)
  shape(g, [P(x + w, y, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x + w, y, z + h)], st.right, st.lw, ink);
  if (!st.noTop) shape(g, [P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h)], st.top, st.lw, ink);
}
/** A quad on the plane z, from (x, y) of size w × d. */
export function isoFloor(g: G, I: Iso, x: number, y: number, w: number, d: number, z: number, fill: string, lw: number) {
  shape(g, [I.p(x, y, z), I.p(x + w, y, z), I.p(x + w, y + d, z), I.p(x, y + d, z)], fill, lw);
}
/** A flat shadow on the floor, the shape squashed iso-wise. */
export function isoShadow(g: G, I: Iso, x: number, y: number, rx: number, ry: number, col = 'rgba(31,26,23,0.16)') {
  const [sx, sy] = I.p(x, y, 0); g.save(); g.fillStyle = col; g.beginPath(); g.ellipse(sx, sy, rx * I.s, ry * I.s * 0.5, 0, 0, TAU); g.fill(); g.restore();
}

/** A display list sorted by depth, for isometric scenes. */
export class Scene {
  constructor(public g?: G) {}
  items: { d: number; f: () => void }[] = [];
  add(d: number, f: () => void) { this.items.push({ d, f }); }
  draw() { this.items.sort((a, b) => a.d - b.d).forEach((i) => i.f()); this.items = []; }
}

/* ───────── one-point rooms (cutaways) ───────── */

/**
 * A cutaway room seen straight on: the opening is the rectangle (x, y, w, h);
 * the back wall is inset by `inset` toward a vanishing point above floor
 * level. f(u, v) maps a floor spot (u across 0…1, v from back 0 to front 1)
 * to the screen, with the scale of a figure standing there.
 */
export class Room {
  bx: number; by: number; bw: number; bh: number;
  constructor(public x: number, public y: number, public w: number, public h: number, public inset: number, public vy = 0.42) {
    const k = inset / Math.min(w, h);
    this.bw = w * (1 - 2 * k); this.bh = h * (1 - 2 * k);
    const vx = x + w / 2, vyy = y + h * vy;
    this.bx = vx + (x - vx) * (1 - 2 * k); this.by = vyy + (y - vyy) * (1 - 2 * k);
  }
  /** Scale at depth v (0 back, 1 front). */
  k(v: number) { return lerp(this.bw / this.w, 1, v); }
  floor(u: number, v: number): Pt {
    const xb = this.bx + this.bw * u, yb = this.by + this.bh, xf = this.x + this.w * u, yf = this.y + this.h;
    return [lerp(xb, xf, v), lerp(yb, yf, v)];
  }
  wall(u: number, t: number): Pt { return [this.bx + this.bw * u, this.by + this.bh * t]; }
  /** Paint the walls, floor and ceiling. */
  paint(g: G, c: { back: string; side: string; floor: string; ceil?: string }, lw: number) {
    const { x, y, w, h, bx, by, bw, bh } = this;
    shape(g, [[x, y + h], [x + w, y + h], [bx + bw, by + bh], [bx, by + bh]], c.floor, lw);
    shape(g, [[x, y], [bx, by], [bx, by + bh], [x, y + h]], c.side, lw);
    shape(g, [[x + w, y], [x + w, y + h], [bx + bw, by + bh], [bx + bw, by]], shade(c.side.startsWith('#') ? c.side : '#888888', -0.06), lw);
    shape(g, [[x, y], [x + w, y], [bx + bw, by], [bx, by]], c.ceil ?? shade(c.back, -0.1), lw);
    rect(g, bx, by, bw, bh, c.back, lw);
  }
}

/* ───────── type ───────── */

export const SERIF = '"Cormorant Garamond", Georgia, "Times New Roman", serif';
export const SANS = '"Liberation Sans", Arial, Helvetica, sans-serif';
export const HAND = '"Liberation Sans Narrow", "Arial Narrow", Arial, sans-serif';

/* ───────── drawing flat on an isometric plane ───────── */

export type Plane = 'x' | 'y' | 'z';
/**
 * Build a path in the 2D coordinates of a plane (u, v in centimetres) and
 * leave it as the current path in screen space, so it can be filled and
 * stroked with an even line. On the wall x = c, u runs along y and v up; on
 * the wall y = c, u runs along x and v up; on the floor z = c, u is x, v is y.
 */
export function onPlane(g: G, I: Iso, pl: Plane, c: number, build: (g: G) => void) {
  const s = I.s, k = 1.118;
  g.save();
  if (pl === 'x') { const o = I.p(c, 0, 0); g.transform(-s, s / 2, 0, -s * k, o[0], o[1]); }
  else if (pl === 'y') { const o = I.p(0, c, 0); g.transform(s, s / 2, 0, -s * k, o[0], o[1]); }
  else { const o = I.p(0, 0, c); g.transform(s, s / 2, -s, s / 2, o[0], o[1]); }
  g.beginPath(); build(g);
  g.restore();
}
/** onPlane, then fill and outline. */
export function plane(g: G, I: Iso, pl: Plane, c: number, build: (g: G) => void, fill: string | null, lw: number, ink = INK) {
  onPlane(g, I, pl, c, build); inkFill(g, fill, lw, ink);
}
/** Run fn with the context mapped onto a plane (for text, images, patterns). */
export function withPlane(g: G, I: Iso, pl: Plane, c: number, fn: (g: G) => void) {
  const s = I.s, k = 1.118;
  g.save();
  if (pl === 'x') { const o = I.p(c, 0, 0); g.transform(-s, s / 2, 0, -s * k, o[0], o[1]); }
  else if (pl === 'y') { const o = I.p(0, c, 0); g.transform(s, s / 2, 0, -s * k, o[0], o[1]); }
  else { const o = I.p(0, 0, c); g.transform(s, s / 2, -s, s / 2, o[0], o[1]); }
  fn(g); g.restore();
}
/** Rounded rect path helper (for use inside onPlane builders). */
export function rr(g: G, x: number, y: number, w: number, h: number, r: number) { g.roundRect(x, y, w, h, r); }
