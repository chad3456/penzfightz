import { Delaunay } from 'd3-delaunay';
import { BORDER, DETAIL, EYE, GOLD, H, PALETTE, REGIONS, SILVER, W, paint, regionFromCode } from './scene';

/**
 * Cuts the cartoon into exactly TOTAL tesserae, in laying order.
 *
 * 1. The eye is cut by hand: a 9-tile pupil (eight black glass, one white
 *    marble catchlight), a ring of gold, three rings of iris and a gold rim.
 * 2. The frame is three courses of rectangular tiles.
 * 3. Everything else is a weighted centroidal Voronoi tessellation (Lloyd's
 *    algorithm on a raster), denser where the cartoon has detail. Each cell
 *    is clipped to a square turned to follow the drawing's edges (andamento),
 *    then shrunk for the grout joint and roughened like a hand-cut stone.
 */

export const TOTAL = 7446;
const GROUT = 0.9;
const S = 0.5; // raster px per unit
const RW = Math.round(W * S), RH = Math.round(H * S);

export type MosaicData = {
  n: number;
  verts: Float32Array;
  start: Uint32Array;
  cx: Float32Array;
  cy: Float32Array;
  /** palette index, or 255 for metal */
  col: Uint8Array;
  metal: Uint8Array;
  tilt: Float32Array;
  shade: Float32Array;
  region: Uint8Array;
  key: Float32Array;
  sinopia: Uint8ClampedArray;
  sw: number;
  sh: number;
  eyeCount: number;
  borderCount: number;
  ms: number;
};

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Pt = [number, number];
type Tile = { poly: Pt[]; col: number; metal: number; region: number; key: number };

function makeCanvas(w: number, h: number) {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h);
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

function raster(mode: 'color' | 'metal' | 'region') {
  const cv = makeCanvas(RW, RH);
  const c = cv.getContext('2d', { willReadFrequently: true }) as OffscreenCanvasRenderingContext2D;
  paint(c, mode, S);
  return c.getImageData(0, 0, RW, RH).data;
}

const PAL_RGB = PALETTE.map((p) => [parseInt(p.hex.slice(1, 3), 16), parseInt(p.hex.slice(3, 5), 16), parseInt(p.hex.slice(5, 7), 16)]);
function dist2(a: number[], r: number, g: number, b: number) {
  const rm = (a[0] + r) / 2, dr = a[0] - r, dg = a[1] - g, db = a[2] - b;
  return (2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db;
}
function nearest(r: number, g: number, b: number, rand: () => number) {
  let b1 = 0, d1 = Infinity, b2 = 0, d2 = Infinity;
  for (let i = 0; i < PAL_RGB.length; i++) {
    const d = dist2(PAL_RGB[i], r, g, b);
    if (d < d1) { b2 = b1; d2 = d1; b1 = i; d1 = d; } else if (d < d2) { b2 = i; d2 = d; }
  }
  // a mosaicist mixes the two nearest colours where a tone falls between them
  const ratio = Math.sqrt(d1 / Math.max(1, d2));
  return ratio > 0.72 && rand() < (ratio - 0.72) * 1.6 ? b2 : b1;
}

function area(p: Pt[]) { let a = 0; for (let i = 0; i < p.length; i++) { const [x1, y1] = p[i], [x2, y2] = p[(i + 1) % p.length]; a += x1 * y2 - x2 * y1; } return a / 2; }
function centroid(p: Pt[]): Pt {
  let a = 0, x = 0, y = 0;
  for (let i = 0; i < p.length; i++) { const [x1, y1] = p[i], [x2, y2] = p[(i + 1) % p.length], f = x1 * y2 - x2 * y1; a += f; x += (x1 + x2) * f; y += (y1 + y2) * f; }
  if (Math.abs(a) < 1e-9) return p[0];
  return [x / (3 * a), y / (3 * a)];
}
/** Sutherland–Hodgman against the half-plane n·p <= d */
function clipHalf(p: Pt[], nx: number, ny: number, d: number): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i < p.length; i++) {
    const a = p[i], b = p[(i + 1) % p.length];
    const da = nx * a[0] + ny * a[1] - d, db = nx * b[0] + ny * b[1] - d;
    if (da <= 0) out.push(a);
    if ((da < 0 && db > 0) || (da > 0 && db < 0)) { const t = da / (da - db); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); }
  }
  return out;
}
/** Inset a convex CCW-or-CW polygon by g. */
function inset(p: Pt[], g: number): Pt[] {
  const s = Math.sign(area(p)) || 1, n = p.length;
  const lines: { px: number; py: number; dx: number; dy: number }[] = [];
  for (let i = 0; i < n; i++) {
    const a = p[i], b = p[(i + 1) % n], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy);
    if (L < 1e-6) continue;
    const nx = (-dy / L) * s, ny = (dx / L) * s; // inward normal
    lines.push({ px: a[0] + nx * g, py: a[1] + ny * g, dx, dy });
  }
  const out: Pt[] = [];
  for (let i = 0; i < lines.length; i++) {
    const l1 = lines[(i - 1 + lines.length) % lines.length], l2 = lines[i];
    const den = l1.dx * l2.dy - l1.dy * l2.dx;
    if (Math.abs(den) < 1e-9) { out.push([l2.px, l2.py]); continue; }
    const t = ((l2.px - l1.px) * l2.dy - (l2.py - l1.py) * l2.dx) / den;
    out.push([l1.px + l1.dx * t, l1.py + l1.dy * t]);
  }
  return Math.sign(area(out)) === s && Math.abs(area(out)) > 0.5 ? out : [];
}

function sector(cx: number, cy: number, r0: number, r1: number, a0: number, a1: number, g: number): Pt[] {
  const ri = r0 + g / 2, ro = r1 - g / 2, gi = g / 2 / Math.max(ri, 1), go = g / 2 / ro;
  const seg = Math.max(2, Math.ceil(((a1 - a0) * ro) / 4));
  const pts: Pt[] = [];
  for (let k = 0; k <= seg; k++) { const a = a0 + go + ((a1 - a0 - 2 * go) * k) / seg; pts.push([cx + Math.cos(a) * ro, cy + Math.sin(a) * ro]); }
  for (let k = seg; k >= 0; k--) { const a = a0 + gi + ((a1 - a0 - 2 * gi) * k) / seg; pts.push([cx + Math.cos(a) * ri, cy + Math.sin(a) * ri]); }
  return pts;
}

const IDX = Object.fromEntries(PALETTE.map((p, i) => [p.id, i])) as Record<string, number>;

export function buildMosaic(): MosaicData {
  const t0 = performance.now();
  const rand = rng(7446);
  const color = raster('color'), metal = raster('metal'), regionPx = raster('region');
  const regionRaw = (x: number, y: number) => regionPx[(Math.min(RH - 1, Math.max(0, Math.floor(y * S))) * RW + Math.min(RW - 1, Math.max(0, Math.floor(x * S)))) * 4];
  /** region by majority over a small cross, ignoring anti-aliased in-between codes */
  const regionAt = (x: number, y: number) => {
    const votes = new Array(REGIONS.length).fill(0);
    for (const [dx, dy] of [[0, 0], [-2.5, 0], [2.5, 0], [0, -2.5], [0, 2.5]]) { const v = regionRaw(x + dx, y + dy); if (v % 20 === 0 && v > 0) votes[regionFromCode(v)]++; }
    let best = -1, bi = regionFromCode(regionRaw(x, y));
    votes.forEach((n, i) => { if (n > best && n > 0) { best = n; bi = i; } });
    return bi;
  };

  /* luminance, edges, density */
  const lum = new Float32Array(RW * RH);
  for (let i = 0; i < RW * RH; i++) lum[i] = 0.3 * color[i * 4] + 0.59 * color[i * 4 + 1] + 0.11 * color[i * 4 + 2] + (metal[i * 4] > 128 ? 60 : 0);
  const gx = new Float32Array(RW * RH), gy = new Float32Array(RW * RH), edge = new Float32Array(RW * RH);
  for (let y = 1; y < RH - 1; y++) for (let x = 1; x < RW - 1; x++) {
    const i = y * RW + x;
    const a = lum[i - RW - 1], b = lum[i - RW], c = lum[i - RW + 1], d = lum[i - 1], f = lum[i + 1], g = lum[i + RW - 1], h = lum[i + RW], k = lum[i + RW + 1];
    gx[i] = c + 2 * f + k - a - 2 * d - g;
    gy[i] = g + 2 * h + k - a - 2 * b - c;
    edge[i] = Math.min(1, Math.hypot(gx[i], gy[i]) / 160);
  }
  const blur = (src: Float32Array, w: number, h: number, r: number, passes: number): Float32Array => {
    let a: Float32Array = src, b: Float32Array = new Float32Array(src.length);
    for (let p = 0; p < passes; p++) {
      for (let y = 0; y < h; y++) { let s = 0; for (let x = -r; x <= r; x++) s += a[y * w + Math.min(w - 1, Math.max(0, x))]; for (let x = 0; x < w; x++) { b[y * w + x] = s / (2 * r + 1); s += a[y * w + Math.min(w - 1, x + r + 1)] - a[y * w + Math.max(0, x - r)]; } }
      [a, b] = [b, a];
      for (let x = 0; x < w; x++) { let s = 0; for (let y = -r; y <= r; y++) s += a[Math.min(h - 1, Math.max(0, y)) * w + x]; for (let y = 0; y < h; y++) { b[y * w + x] = s / (2 * r + 1); s += a[Math.min(h - 1, y + r + 1) * w + x] - a[Math.max(0, y - r) * w + x]; } }
      [a, b] = [b, a];
    }
    return a;
  };
  const edgeB = blur(edge, RW, RH, 3, 2);

  const regionMul = [1, 1.25, 0.5, 2.6, 0.8, 1.9, 1.55, 0.95, 2.2, 1];
  const rho = new Float32Array(RW * RH);
  for (let y = 0; y < RH; y++) for (let x = 0; x < RW; x++) {
    const i = y * RW + x, ux = (x + 0.5) / S, uy = (y + 0.5) / S;
    if (ux < BORDER || ux > W - BORDER || uy < BORDER || uy > H - BORDER) continue;
    const d = Math.hypot(ux - EYE.x, uy - EYE.y);
    if (d < EYE.r + 2) continue;
    const reg = regionFromCode(regionPx[i * 4]);
    const eye = 1 + 2.4 * Math.exp(-(d - EYE.r) / 55);
    let det = 1;
    for (const z of DETAIL) if (ux > z.x && ux < z.x + z.w && uy > z.y && uy < z.y + z.h) det = Math.max(det, z.k);
    rho[i] = regionMul[reg] * (1 + 2.4 * edgeB[i]) * eye * det;
  }

  /* hand-cut eye */
  const tiles: Tile[] = [];
  const ex = EYE.x, ey = EYE.y;
  {
    const oct: Pt[] = [];
    for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2 + Math.PI / 8; oct.push([ex + Math.cos(a) * (5.2 - GROUT / 2), ey + Math.sin(a) * (5.2 - GROUT / 2)]); }
    tiles.push({ poly: oct, col: IDX.black, metal: 0, region: 0, key: 0 });
    const rings: { r0: number; r1: number; n: number; pick: (k: number) => [number, number] }[] = [
      { r0: 5.2, r1: 14, n: 8, pick: () => [IDX.black, 0] },
      { r0: 14, r1: 22, n: 13, pick: () => [255, GOLD] },
      { r0: 22, r1: 33, n: 19, pick: (k) => [k % 5 === 2 ? IDX.sand : IDX.saffron, 0] },
      { r0: 33, r1: 44, n: 25, pick: (k) => [k % 2 ? IDX.vermilion : IDX.saffron, 0] },
      { r0: 44, r1: 55, n: 31, pick: (k) => [k % 2 ? IDX.saffron : IDX.vermilion, 0] },
      { r0: 55, r1: 64, n: 37, pick: () => [255, GOLD] },
    ];
    rings.forEach((ring, ri) => {
      const rot = rand() * Math.PI * 2;
      let catchK = -1;
      if (ri === 0) { let best = Infinity; for (let k = 0; k < ring.n; k++) { const a = rot + ((k + 0.5) / ring.n) * Math.PI * 2, d = Math.abs(Math.atan2(Math.sin(a + 2.3), Math.cos(a + 2.3))); if (d < best) { best = d; catchK = k; } } }
      for (let k = 0; k < ring.n; k++) {
        const a0 = rot + (k / ring.n) * Math.PI * 2, a1 = rot + ((k + 1) / ring.n) * Math.PI * 2;
        const [col, m] = k === catchK ? [IDX.marble, 0] : ring.pick(k);
        tiles.push({ poly: sector(ex, ey, ring.r0, ring.r1, a0, a1, GROUT), col, metal: m, region: 0, key: ri + 1 + k / ring.n });
      }
    });
  }
  const eyeCount = tiles.length;

  /* the frame */
  const border: Tile[] = [];
  const courses: [number, number, number, (k: number) => [number, number]][] = [
    [0, 9, 16, () => [IDX.slate, 0]],
    [9, 21, 18, (k) => [k % 2 ? IDX.terracotta : IDX.cream, 0]],
    [21, 28.5, 14, () => [255, GOLD]],
  ];
  const regB = REGIONS.indexOf('border');
  for (const [d0, d1, len, pick] of courses) {
    const strips: [number, number, number, number, boolean][] = [
      [d0, d0, W - 2 * d0, d1 - d0, true], [d0, H - d1, W - 2 * d0, d1 - d0, true],
      [d0, d1, d1 - d0, H - 2 * d1, false], [W - d1, d1, d1 - d0, H - 2 * d1, false],
    ];
    let k = 0;
    for (const [x, y, w, h, horiz] of strips) {
      const L = horiz ? w : h, m = Math.max(1, Math.round(L / len));
      const cuts = [0];
      for (let j = 1; j < m; j++) cuts.push((L * j) / m + (rand() - 0.5) * 2.4);
      cuts.push(L);
      for (let j = 0; j < m; j++) {
        const a = cuts[j] + GROUT / 2, b = cuts[j + 1] - GROUT / 2, q = GROUT / 2;
        const j4 = () => (rand() - 0.5) * 0.7;
        const poly: Pt[] = horiz
          ? [[x + a + j4(), y + q + j4()], [x + b + j4(), y + q + j4()], [x + b + j4(), y + h - q + j4()], [x + a + j4(), y + h - q + j4()]]
          : [[x + q + j4(), y + a + j4()], [x + w - q + j4(), y + a + j4()], [x + w - q + j4(), y + b + j4()], [x + q + j4(), y + b + j4()]];
        const [col, m2] = pick(k++);
        const c = centroid(poly);
        border.push({ poly, col, metal: m2, region: regB, key: Math.hypot(c[0] - ex, c[1] - ey) + 40 });
      }
    }
  }

  /* the field: weighted centroidal Voronoi */
  const N = TOTAL - eyeCount - border.length;
  const cdf = new Float64Array(RW * RH);
  let acc = 0;
  for (let i = 0; i < rho.length; i++) { acc += rho[i]; cdf[i] = acc; }
  const pts = new Float64Array(N * 2);
  for (let i = 0; i < N; i++) {
    const r = rand() * acc;
    let lo = 0, hi = cdf.length - 1;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (cdf[mid] < r) lo = mid + 1; else hi = mid; }
    pts[i * 2] = ((lo % RW) + rand()) / S;
    pts[i * 2 + 1] = (Math.floor(lo / RW) + rand()) / S;
  }
  const sx = new Float64Array(N), sy = new Float64Array(N), sw = new Float64Array(N);
  for (let it = 0; it < 18; it++) {
    const del = new Delaunay(pts);
    sx.fill(0); sy.fill(0); sw.fill(0);
    let hint = 0;
    for (let y = 0; y < RH; y++) for (let x = 0; x < RW; x++) {
      const i = y * RW + x, w = rho[i];
      if (w === 0) continue;
      const ux = (x + 0.5) / S, uy = (y + 0.5) / S;
      hint = del.find(ux, uy, hint);
      const ww = w * w;
      sx[hint] += ux * ww; sy[hint] += uy * ww; sw[hint] += ww;
    }
    for (let i = 0; i < N; i++) if (sw[i] > 0) { pts[i * 2] = sx[i] / sw[i]; pts[i * 2 + 1] = sy[i] / sw[i]; }
  }

  /* orientation field from the structure tensor */
  const DS = 4, OW = Math.ceil(RW / DS), OH = Math.ceil(RH / DS);
  const jxx = new Float32Array(OW * OH), jyy = new Float32Array(OW * OH), jxy = new Float32Array(OW * OH);
  for (let y = 0; y < RH; y++) for (let x = 0; x < RW; x++) {
    const i = y * RW + x, o = Math.floor(y / DS) * OW + Math.floor(x / DS);
    jxx[o] += gx[i] * gx[i]; jyy[o] += gy[i] * gy[i]; jxy[o] += gx[i] * gy[i];
  }
  const bxx = blur(jxx, OW, OH, 2, 3), byy = blur(jyy, OW, OH, 2, 3), bxy = blur(jxy, OW, OH, 2, 3);
  let smax = 0;
  const strength = new Float32Array(OW * OH);
  for (let i = 0; i < OW * OH; i++) { strength[i] = Math.sqrt((bxx[i] - byy[i]) ** 2 + 4 * bxy[i] ** 2); smax = Math.max(smax, strength[i]); }
  const regSky = REGIONS.indexOf('sky'), regSun = REGIONS.indexOf('sun'), regEye = REGIONS.indexOf('eye');
  const angleAt = (ux: number, uy: number, reg: number) => {
    const o = Math.min(OH - 1, Math.floor((uy * S) / DS)) * OW + Math.min(OW - 1, Math.floor((ux * S) / DS));
    const phi = 0.5 * Math.atan2(2 * bxy[o], bxx[o] - byy[o]);
    const w = Math.min(1, strength[o] / (0.08 * smax));
    const dEye = Math.hypot(ux - ex, uy - ey);
    const radial = reg === regSky || reg === regSun || reg === regEye || dEye < 260;
    const psi = radial ? Math.atan2(uy - ey, ux - ex) : 0;
    const wd = radial ? Math.max(1 - w, Math.exp(-(dEye - EYE.r) / 90)) : 1 - w;
    const vx = w * Math.cos(4 * phi) + wd * Math.cos(4 * psi), vy = w * Math.sin(4 * phi) + wd * Math.sin(4 * psi);
    return Math.atan2(vy, vx) / 4;
  };

  const vor = new Delaunay(pts).voronoi([BORDER, BORDER, W - BORDER, H - BORDER]);
  const field: Tile[] = [];
  const rEye = EYE.r + GROUT * 0.6;
  for (let i = 0; i < N; i++) {
    const cell = vor.cellPolygon(i);
    if (!cell) continue;
    let poly: Pt[] = (cell as Pt[]).slice(0, -1).map((p) => [p[0], p[1]] as Pt);
    const px = pts[i * 2], py = pts[i * 2 + 1];
    const reg = regionAt(px, py);
    const A = Math.abs(area(poly));
    const th = angleAt(px, py, reg), half = Math.sqrt(A) * 0.49;
    for (let q = 0; q < 4; q++) { const a = th + (q * Math.PI) / 2, nx = Math.cos(a), ny = Math.sin(a); poly = clipHalf(poly, nx, ny, nx * px + ny * py + half); if (poly.length < 3) break; }
    if (poly.length < 3) continue;
    poly = inset(poly, GROUT / 2);
    if (poly.length < 3) continue;
    poly = poly.map(([x, y]) => {
      const dx = x - ex, dy = y - ey, d = Math.hypot(dx, dy);
      if (d < rEye) return [ex + (dx / d) * rEye, ey + (dy / d) * rEye] as Pt;
      return [x + (rand() - 0.5) * 0.8, y + (rand() - 0.5) * 0.8] as Pt;
    });
    if (Math.abs(area(poly)) < 1) continue;
    const c = centroid(poly);
    // sample the cartoon at the centre and four points towards the corners
    let r = 0, g = 0, b = 0, gold = 0, silver = 0, ns = 0;
    const samples: Pt[] = [c, ...[0, 0.25, 0.5, 0.75].map((f) => { const v = poly[Math.floor(f * poly.length)]; return [(c[0] + v[0]) / 2, (c[1] + v[1]) / 2] as Pt; })];
    for (const [sxu, syu] of samples) {
      const j = (Math.min(RH - 1, Math.max(0, Math.floor(syu * S))) * RW + Math.min(RW - 1, Math.max(0, Math.floor(sxu * S)))) * 4;
      r += color[j]; g += color[j + 1]; b += color[j + 2]; ns++;
      if (metal[j] > 128) gold++; else if (metal[j + 1] > 128) silver++;
    }
    const m = gold * 2 > ns ? GOLD : silver * 2 > ns ? SILVER : 0;
    field.push({ poly, col: m ? 255 : nearest(r / ns, g / ns, b / ns, rand), metal: m, region: regionAt(c[0], c[1]), key: Math.hypot(c[0] - ex, c[1] - ey) + (rand() - 0.5) * 14 });
  }

  // a cell lost to clipping is replaced by splitting the largest field tiles' sites; in practice
  // none are lost, but keep the count exact either way
  while (field.length + eyeCount + border.length > TOTAL) field.pop();
  while (field.length + eyeCount + border.length < TOTAL) {
    let bi = 0, ba = 0;
    for (let i = 0; i < field.length; i++) { const a = Math.abs(area(field[i].poly)); if (a > ba) { ba = a; bi = i; } }
    const t = field[bi], c = centroid(t.poly), a = rand() * Math.PI;
    const nx = Math.cos(a), ny = Math.sin(a), d = nx * c[0] + ny * c[1];
    const p1 = inset(clipHalf(t.poly, nx, ny, d), GROUT / 2), p2 = inset(clipHalf(t.poly, -nx, -ny, -d), GROUT / 2);
    if (p1.length < 3 || p2.length < 3) break;
    field[bi] = { ...t, poly: p1 };
    field.push({ ...t, poly: p2, key: t.key + 0.01 });
  }

  const rest = [...field, ...border].sort((a, b) => a.key - b.key);
  const all = [...tiles, ...rest];
  const n = all.length;

  let nv = 0;
  for (const t of all) nv += t.poly.length;
  const verts = new Float32Array(nv * 2), start = new Uint32Array(n + 1);
  const cx = new Float32Array(n), cy = new Float32Array(n), col = new Uint8Array(n), met = new Uint8Array(n);
  const tilt = new Float32Array(n * 2), shade = new Float32Array(n), region = new Uint8Array(n), key = new Float32Array(n);
  let v = 0;
  all.forEach((t, i) => {
    start[i] = v;
    for (const [x, y] of t.poly) { verts[v * 2] = x; verts[v * 2 + 1] = y; v++; }
    const c = centroid(t.poly);
    cx[i] = c[0]; cy[i] = c[1]; col[i] = t.col; met[i] = t.metal; region[i] = t.region;
    key[i] = i < eyeCount ? Math.hypot(c[0] - ex, c[1] - ey) : t.key;
    const tl = t.metal ? 0.16 : t.col !== 255 && PALETTE[t.col].mat === 'smalti' ? 0.07 : 0.03;
    tilt[i * 2] = (rand() - 0.5) * 2 * tl; tilt[i * 2 + 1] = (rand() - 0.5) * 2 * tl;
    shade[i] = (rand() - 0.5) * (t.metal ? 0.1 : 0.13);
  });
  start[n] = v;

  /* the sinopia: the red-ochre underdrawing on the bed */
  const sinopia = new Uint8ClampedArray(RW * RH);
  for (let y = 1; y < RH - 1; y++) for (let x = 1; x < RW - 1; x++) {
    const i = y * RW + x;
    const rc = regionPx[i * 4] !== regionPx[(i + 1) * 4] || regionPx[i * 4] !== regionPx[(i + RW) * 4];
    const e = Math.hypot(gx[i], gy[i]);
    if (rc || e > 70) sinopia[i] = Math.min(255, rc ? 190 : e * 1.4);
  }

  return { n, verts, start, cx, cy, col, metal: met, tilt, shade, region, key, sinopia, sw: RW, sh: RH, eyeCount, borderCount: border.length, ms: performance.now() - t0 };
}
