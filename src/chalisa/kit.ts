/**
 * The paint box. Flat gouache colour on a navy night, marigold and magenta,
 * swirl-filled grounds, white curling clouds, lotus ponds, cusped arches —
 * the vocabulary of Nathdwara pichwai hangings and of Indian picture books,
 * drawn here from scratch with canvas paths. Every scene is composed on a
 * 1600 × 900 page.
 */

export type G = CanvasRenderingContext2D;
export const PW = 1600, PH = 900;

export const C = {
  night: '#101845', navy: '#1c2a63', navy2: '#24357a', indigo: '#2b2f73', ink: '#1d1230',
  gold: '#f4b51c', marigold: '#f79a1e', saffron: '#ec7322', vermilion: '#d63a28', red: '#b9282a', maroon: '#7c1d2e',
  magenta: '#a7306f', rani: '#d13f86', pink: '#ee6f9c', blush: '#f7b9b3', coral: '#f06a4c', peach: '#f9c79a',
  cream: '#f8ecd0', paper: '#fcf4e2', white: '#fffaf0', lilac: '#a99ad6', lav: '#cdbdf0',
  teal: '#1f8580', peacock: '#16737a', green: '#2f8a4a', leaf: '#43a052', lime: '#a6cf4b', olive: '#6d7d2c',
  sky: '#78c2ee', blue: '#3f7fd0', rama: '#5ea9e8', ramaD: '#3b7fc2', earth: '#a35a2a', brown: '#6e3f22', stone: '#c9a37a',
  hanu: '#eda23a', hanuD: '#c97a1f', hanuFace: '#f8d790', fire: '#ff7a1a', fire2: '#ffd23f',
};

/* ───────── numbers ───────── */
export const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const seg = (p: number, a: number, b: number) => clamp((p - a) / (b - a));
export const io = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
export const out = (t: number) => 1 - Math.pow(1 - t, 3);
export const inn = (t: number) => t * t * t;
export const back = (t: number) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
export const bump = (t: number) => Math.sin(clamp(t) * Math.PI);
export function rng(seed: number) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

/* ───────── paths ───────── */
export function poly(g: G, pts: number[][], close = true) {
  g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
  if (close) g.closePath();
}
/** A closed smooth curve through points (Catmull-Rom → Bézier). */
export function smooth(g: G, pts: number[][], close = true, k = 1) {
  const n = pts.length; if (n < 2) return;
  g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
  const P = (i: number) => pts[close ? (i + n) % n : clamp(i, 0, n - 1)];
  const last = close ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    g.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6 * k, p1[1] + (p2[1] - p0[1]) / 6 * k, p2[0] - (p3[0] - p1[0]) / 6 * k, p2[1] - (p3[1] - p1[1]) / 6 * k, p2[0], p2[1]);
  }
  if (close) g.closePath();
}
export function fs(g: G, fill?: string | CanvasPattern | CanvasGradient | null, stroke?: string | null, lw = 2.2) {
  if (fill) { g.fillStyle = fill; g.fill(); }
  if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke(); }
}
export function circle(g: G, x: number, y: number, r: number, fill?: string | CanvasPattern | null, stroke?: string | null, lw = 2) { g.beginPath(); g.arc(x, y, Math.max(0.1, r), 0, Math.PI * 2); fs(g, fill, stroke, lw); }
export function ellipse(g: G, x: number, y: number, rx: number, ry: number, rot: number, fill?: string | CanvasPattern | null, stroke?: string | null, lw = 2) { g.beginPath(); g.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, Math.PI * 2); fs(g, fill, stroke, lw); }
export function line(g: G, pts: number[][], color: string, lw = 2, smoothIt = false) {
  if (smoothIt) smooth(g, pts, false); else poly(g, pts, false);
  g.strokeStyle = color; g.lineWidth = lw; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke();
}
/** A limb or ribbon: a polyline drawn as an outlined stroke. */
export function stroke2(g: G, pts: number[][], w: number, fill: string | CanvasPattern, outline: string = C.ink, ol = 2.4, smoothIt = true) {
  if (smoothIt && pts.length > 2) smooth(g, pts, false); else poly(g, pts, false);
  g.lineCap = 'round'; g.lineJoin = 'round';
  if (outline) { g.strokeStyle = outline; g.lineWidth = w + ol * 2; g.stroke(); }
  g.strokeStyle = fill; g.lineWidth = w; g.stroke();
}
/** A spiral curl, as in the clouds and the swirl grounds. */
export function curl(g: G, x: number, y: number, r: number, turns = 1.4, dir = 1, start = 0) {
  g.beginPath();
  const N = 40;
  for (let i = 0; i <= N; i++) {
    const t = i / N, a = start + dir * t * turns * Math.PI * 2, rr = r * (1 - t * 0.85);
    const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr;
    if (i) g.lineTo(px, py); else g.moveTo(px, py);
  }
}

/* ───────── patterns ───────── */
const pcache = new Map<string, CanvasPattern>();
function tile(w: number, h: number, draw: (g: G) => void) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d')!); return c; }
export function pattern(g: G, key: string, w: number, h: number, draw: (g: G) => void): CanvasPattern {
  let p = pcache.get(key);
  if (!p) { p = g.createPattern(tile(w, h, draw), 'repeat')!; pcache.set(key, p); }
  return p;
}
/** Night ground full of S-curls and spirals, like an embroidered hanging. */
export function swirlP(g: G, bg = C.navy, fg = 'rgba(205,189,240,0.42)') {
  return pattern(g, 'sw' + bg + fg, 180, 180, (t) => {
    t.fillStyle = bg; t.fillRect(0, 0, 180, 180);
    t.strokeStyle = fg; t.lineWidth = 2.2; t.lineCap = 'round';
    const R = rng(7);
    const spots = [[30, 30], [120, 20], [80, 90], [160, 110], [20, 140], [110, 160]];
    for (const [x, y] of spots) for (const [dx, dy] of [[0, 0], [180, 0], [-180, 0], [0, 180], [0, -180]]) {
      const r = 14 + R() * 8;
      curl(t, x + dx, y + dy, r, 1.3, R() > 0.5 ? 1 : -1, R() * 6); t.stroke();
      t.beginPath(); t.moveTo(x + dx + r, y + dy); t.bezierCurveTo(x + dx + r + 18, y + dy + 4, x + dx + r + 20, y + dy + 26, x + dx + r + 6, y + dy + 34); t.stroke();
    }
  });
}
/** Small four-petal flowers and dots, for saris and dhotis. */
export function floretP(g: G, bg: string, fg: string, size = 26) {
  return pattern(g, 'fl' + bg + fg + size, size * 2, size * 2, (t) => {
    t.fillStyle = bg; t.fillRect(0, 0, size * 2, size * 2);
    t.fillStyle = fg; t.strokeStyle = fg; t.lineWidth = 1.2;
    const fl = (x: number, y: number) => { for (let i = 0; i < 4; i++) { const a = (i * Math.PI) / 2 + Math.PI / 4; t.beginPath(); t.ellipse(x + Math.cos(a) * size * 0.14, y + Math.sin(a) * size * 0.14, size * 0.13, size * 0.06, a, 0, Math.PI * 2); t.fill(); } };
    fl(size * 0.5, size * 0.5); fl(size * 1.5, size * 1.5);
    t.beginPath(); t.arc(size * 1.5, size * 0.5, size * 0.05, 0, 7); t.fill(); t.beginPath(); t.arc(size * 0.5, size * 1.5, size * 0.05, 0, 7); t.fill();
  });
}
export function dotsP(g: G, bg: string, fg: string, size = 16, r = 2.4) {
  return pattern(g, 'dt' + bg + fg + size + r, size, size, (t) => { t.fillStyle = bg; t.fillRect(0, 0, size, size); t.fillStyle = fg; t.beginPath(); t.arc(size / 4, size / 4, r, 0, 7); t.arc(size * 0.75, size * 0.75, r, 0, 7); t.fill(); });
}
export function stripeP(g: G, bg: string, fg: string, size = 14, wv = 4) {
  return pattern(g, 'st' + bg + fg + size + wv, size, size, (t) => { t.fillStyle = bg; t.fillRect(0, 0, size, size); t.fillStyle = fg; t.fillRect(0, 0, wv, size); });
}
export function zigP(g: G, bg: string, fg: string, size = 22) {
  return pattern(g, 'zg' + bg + fg + size, size, size, (t) => { t.fillStyle = bg; t.fillRect(0, 0, size, size); t.strokeStyle = fg; t.lineWidth = 2; t.beginPath(); t.moveTo(0, size * 0.7); t.lineTo(size / 2, size * 0.3); t.lineTo(size, size * 0.7); t.stroke(); });
}
export function scaleP(g: G, bg: string, fg: string, size = 24) {
  return pattern(g, 'sc' + bg + fg + size, size, size, (t) => {
    t.fillStyle = bg; t.fillRect(0, 0, size, size); t.strokeStyle = fg; t.lineWidth = 1.6;
    for (const [x, y] of [[0, 0], [size, 0], [size / 2, size / 2], [0, size], [size, size]]) { t.beginPath(); t.arc(x, y, size / 2, 0, Math.PI); t.stroke(); }
  });
}

/* ───────── texture ───────── */
let grainTile: HTMLCanvasElement | null = null;
export function grain(g: G, w = PW, h = PH, a = 0.16) {
  if (!grainTile) grainTile = tile(384, 384, (t) => {
    const id = t.createImageData(384, 384), d = id.data, R = rng(11);
    for (let i = 0; i < d.length; i += 4) { const v = 128 + (R() - 0.5) * 70; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
    t.putImageData(id, 0, 0);
    t.globalAlpha = 0.18;
    for (let i = 0; i < 260; i++) { t.strokeStyle = R() > 0.5 ? '#fff' : '#000'; t.lineWidth = 0.6 + R(); t.beginPath(); const x = R() * 384, y = R() * 384; t.moveTo(x, y); t.lineTo(x + (R() - 0.5) * 30, y + (R() - 0.5) * 8); t.stroke(); }
    for (let i = 0; i < 60; i++) { t.fillStyle = R() > 0.5 ? '#fff' : '#000'; t.beginPath(); t.arc(R() * 384, R() * 384, 6 + R() * 22, 0, 7); t.fill(); }
  });
  const p = pattern(g, 'grain', 1, 1, () => {});
  void p;
  g.save(); g.globalCompositeOperation = 'overlay'; g.globalAlpha = a;
  g.fillStyle = g.createPattern(grainTile, 'repeat')!; g.fillRect(0, 0, w, h);
  g.restore();
}
export function vignette(g: G, a = 0.35) {
  const r = g.createRadialGradient(PW / 2, PH / 2, PH * 0.35, PW / 2, PH / 2, PW * 0.65);
  r.addColorStop(0, 'rgba(10,8,30,0)'); r.addColorStop(1, `rgba(10,8,30,${a})`);
  g.fillStyle = r; g.fillRect(0, 0, PW, PH);
}

/* ───────── camera ───────── */
export interface Key { p: number; x: number; y: number; z: number; r?: number }
export function cam(g: G, keys: Key[], p: number) {
  let a = keys[0], b = keys[keys.length - 1];
  for (let i = 0; i < keys.length - 1; i++) if (p >= keys[i].p && p <= keys[i + 1].p) { a = keys[i]; b = keys[i + 1]; break; }
  const t = a === b ? 0 : io(clamp((p - a.p) / (b.p - a.p)));
  const x = lerp(a.x, b.x, t), y = lerp(a.y, b.y, t), z = lerp(a.z, b.z, t), r = lerp(a.r ?? 0, b.r ?? 0, t);
  g.translate(PW / 2, PH / 2); g.scale(z, z); g.rotate(r); g.translate(-x, -y);
}
export function shake(g: G, amt: number, t: number) { if (amt > 0) g.translate(Math.sin(t * 71) * amt, Math.cos(t * 53) * amt); }

/* ───────── grounds & skies ───────── */
export function nightSky(g: G, t: number, seed = 1, stars = 90) {
  g.fillStyle = swirlP(g); g.fillRect(-400, -400, PW + 800, PH + 800);
  const R = rng(seed);
  for (let i = 0; i < stars; i++) {
    const x = R() * PW * 1.4 - PW * 0.2, y = R() * PH * 0.8 - 100, s = 1.5 + R() * 3, tw = 0.5 + 0.5 * Math.sin(t * (1 + R() * 2) + i);
    g.fillStyle = `rgba(255,236,170,${0.35 + tw * 0.6})`;
    if (R() > 0.7) star4(g, x, y, s * 2.2); else { g.beginPath(); g.arc(x, y, s * 0.6, 0, 7); g.fill(); }
  }
}
export function star4(g: G, x: number, y: number, s: number) { g.beginPath(); g.moveTo(x, y - s); g.quadraticCurveTo(x, y, x + s, y); g.quadraticCurveTo(x, y, x, y + s); g.quadraticCurveTo(x, y, x - s, y); g.quadraticCurveTo(x, y, x, y - s); g.fill(); }
export function daySky(g: G, top = C.gold, bot = C.peach) {
  const gr = g.createLinearGradient(0, 0, 0, PH); gr.addColorStop(0, top); gr.addColorStop(1, bot);
  g.fillStyle = gr; g.fillRect(-400, -400, PW + 800, PH + 800);
}
/** White curling cloud: three or four spirals and a tail. */
export function cloud(g: G, x: number, y: number, s: number, t = 0, color = C.white, flip = 1) {
  g.save(); g.translate(x + Math.sin(t * 0.4 + x) * 6, y); g.scale(s * flip, s);
  g.strokeStyle = color; g.lineCap = 'round'; g.lineWidth = 9;
  curl(g, 0, 0, 22, 1.25, 1, Math.PI); g.stroke();
  curl(g, 44, -16, 18, 1.2, -1, 0); g.stroke();
  g.lineWidth = 7; g.beginPath(); g.moveTo(-22, 0); g.bezierCurveTo(-60, 4, -80, 20, -110, 14); g.stroke();
  g.beginPath(); g.moveTo(62, -16); g.bezierCurveTo(90, -14, 100, 4, 130, 2); g.stroke();
  g.lineWidth = 5; g.beginPath(); g.moveTo(-60, 18); g.bezierCurveTo(-40, 34, -10, 34, 10, 24); g.stroke();
  g.restore();
}
/** Rows of scalloped waves with white crests; drifting. */
export function ocean(g: G, y0: number, y1: number, t: number, cols = [C.navy2, C.navy, C.indigo], speed = 1) {
  const rows = Math.max(3, Math.round((y1 - y0) / 34));
  for (let r = 0; r < rows; r++) {
    const y = y0 + (r / rows) * (y1 - y0), w = 70 + r * 8, off = ((t * 20 * speed * (r % 2 ? 1 : -1)) % w + w) % w;
    g.fillStyle = cols[r % cols.length];
    g.beginPath(); g.moveTo(-400, y1 + 400);
    for (let x = -400 - w + off; x < PW + 400 + w; x += w) { g.lineTo(x, y + 18); g.quadraticCurveTo(x + w / 2, y - 22, x + w, y + 18); }
    g.lineTo(PW + 400, y1 + 400); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(255,250,240,0.85)'; g.lineWidth = 2.6; g.lineCap = 'round';
    for (let x = -400 - w + off; x < PW + 400 + w; x += w) {
      g.beginPath(); g.moveTo(x + w * 0.2, y + 8); g.quadraticCurveTo(x + w / 2, y - 16, x + w * 0.78, y + 4); g.stroke();
      curl(g, x + w * 0.78, y + 10, 6, 0.9, 1, -Math.PI / 2); g.stroke();
    }
  }
}
export function water(g: G, y0: number, y1: number, t: number, col = C.teal) {
  g.fillStyle = col; g.fillRect(-400, y0, PW + 800, y1 - y0 + 400);
  g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 2;
  for (let r = 0; r < 10; r++) { const y = y0 + 14 + r * ((y1 - y0) / 10); for (let x = -200 + ((t * 12 + r * 40) % 120); x < PW + 200; x += 120) { g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 15, y - 6, x + 30, y); g.stroke(); } }
}
export function lotus(g: G, x: number, y: number, s: number, open = 1, col = C.pink, col2 = C.rani) {
  g.save(); g.translate(x, y); g.scale(s, s);
  const petal = (a: number, len: number, w: number, c: string) => {
    g.save(); g.rotate(a); g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(w, -len * 0.35, w * 0.7, -len * 0.85, 0, -len); g.bezierCurveTo(-w * 0.7, -len * 0.85, -w, -len * 0.35, 0, 0); fs(g, c, C.ink, 1.6 / s);
    g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 1.2 / s; g.beginPath(); g.moveTo(0, -len * 0.15); g.lineTo(0, -len * 0.75); g.stroke(); g.restore();
  };
  const spread = 0.35 + open * 0.75;
  for (const a of [-1.1, 1.1]) petal(a * spread, 30, 13, col2);
  for (const a of [-0.65, 0.65]) petal(a * spread, 36, 14, col);
  petal(0, 40, 15, col);
  ellipse(g, 0, 2, 16, 6, 0, C.gold, C.ink, 1.4 / s);
  g.restore();
}
export function lotusLeaf(g: G, x: number, y: number, s: number, col = C.green) {
  g.save(); g.translate(x, y); g.scale(s, s * 0.42);
  g.beginPath(); g.arc(0, 0, 40, 0.25, Math.PI * 2 - 0.25); g.lineTo(0, 0); g.closePath(); fs(g, col, C.ink, 2.4);
  g.strokeStyle = 'rgba(255,255,255,0.4)'; g.lineWidth = 2; for (let i = 0; i < 7; i++) { const a = 0.6 + i * 0.75; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * 34, Math.sin(a) * 34); g.stroke(); }
  g.restore();
}
export function lotusPond(g: G, y0: number, t: number, seed = 3, col = C.teal) {
  water(g, y0, PH, t, col);
  const R = rng(seed);
  for (let i = 0; i < 14; i++) { const x = R() * PW, y = y0 + 30 + R() * (PH - y0 - 30); lotusLeaf(g, x, y, 0.8 + R() * 0.7, R() > 0.5 ? C.green : C.leaf); }
  for (let i = 0; i < 9; i++) { const x = R() * PW, y = y0 + 40 + R() * (PH - y0 - 50), sw = Math.sin(t * 0.8 + i) * 0.05; g.save(); g.translate(x, y); g.rotate(sw); lotus(g, 0, 0, 0.7 + R() * 0.6, 0.6 + 0.4 * Math.sin(t * 0.5 + i) ** 2, R() > 0.4 ? C.pink : C.white, C.rani); g.restore(); }
}
export function petals(g: G, t: number, seed = 5, n = 40, cols = [C.marigold, C.pink, C.gold, C.white], area = [0, 0, PW, PH]) {
  const R = rng(seed);
  for (let i = 0; i < n; i++) {
    const sx = area[0] + R() * area[2], sp = 40 + R() * 60, ph = R() * 1000;
    const y = area[1] + ((t * sp + ph) % (area[3] + 80)) - 40, x = sx + Math.sin(t * 1.3 + i) * 30;
    g.save(); g.translate(x, y); g.rotate(t * (R() - 0.5) * 4 + i);
    g.fillStyle = cols[i % cols.length]; g.beginPath(); g.ellipse(0, 0, 7, 3.5, 0, 0, 7); g.fill(); g.restore();
  }
}
export function sparks(g: G, x: number, y: number, t: number, n = 24, r = 160, col = C.fire2) {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + i * 0.37, ph = (t * 0.9 + i * 0.13) % 1, rr = r * ph;
    g.fillStyle = col; g.globalAlpha = (1 - ph) * 0.9; star4(g, x + Math.cos(a) * rr, y + Math.sin(a) * rr, 4 + 6 * (1 - ph)); g.globalAlpha = 1;
  }
}
/** Rays of glory behind a deity: alternating gold and cream petals. */
export function glory(g: G, x: number, y: number, r0: number, r1: number, t: number, n = 28, cols = [C.gold, C.cream]) {
  g.save(); g.translate(x, y); g.rotate(t * 0.08);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, b = ((i + 0.5) / n) * Math.PI * 2, r = i % 2 ? r1 : r1 * 0.86;
    g.beginPath(); g.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); g.quadraticCurveTo(Math.cos((a + b) / 2) * r * 1.02, Math.sin((a + b) / 2) * r * 1.02, Math.cos(b) * r0, Math.sin(b) * r0); g.closePath();
    g.fillStyle = cols[i % cols.length]; g.fill();
  }
  g.restore();
}
export function halo(g: G, x: number, y: number, r: number, col = C.gold, edge = C.vermilion) {
  circle(g, x, y, r * 1.08, edge); circle(g, x, y, r, col);
  g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 2; g.beginPath(); g.arc(x, y, r * 0.82, 0, 7); g.stroke();
  for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; circle(g, x + Math.cos(a) * r * 1.04, y + Math.sin(a) * r * 1.04, r * 0.035, C.cream); }
}
export function sunDisc(g: G, x: number, y: number, r: number, t: number, face = true) {
  glory(g, x, y, r * 0.95, r * 1.45, t, 32, [C.marigold, C.gold]);
  circle(g, x, y, r, C.vermilion, C.ink, 3); circle(g, x, y, r * 0.86, C.saffron);
  if (face) {
    g.save(); g.translate(x, y); const k = r / 100;
    g.strokeStyle = C.ink; g.lineWidth = 4 * k; g.lineCap = 'round';
    for (const s of [-1, 1]) { g.beginPath(); g.ellipse(s * 32 * k, -10 * k, 17 * k, 8 * k, 0, 0, 7); g.fillStyle = C.white; g.fill(); g.stroke(); circle(g, s * 32 * k + 4 * k, -10 * k, 5 * k, C.ink); g.beginPath(); g.moveTo(s * 14 * k, -28 * k); g.quadraticCurveTo(s * 34 * k, -40 * k, s * 54 * k, -26 * k); g.stroke(); }
    g.beginPath(); g.moveTo(0, -8 * k); g.lineTo(-6 * k, 18 * k); g.lineTo(4 * k, 20 * k); g.stroke();
    g.beginPath(); g.moveTo(-24 * k, 36 * k); g.quadraticCurveTo(0, 52 * k, 24 * k, 36 * k); g.stroke();
    g.restore();
  }
}
export function moon(g: G, x: number, y: number, r: number) {
  circle(g, x, y, r, C.cream); g.save(); g.globalCompositeOperation = 'destination-out'; circle(g, x + r * 0.45, y - r * 0.2, r * 0.85, '#000'); g.restore();
}
/** A teardrop flame with inner tongues. */
export function flame(g: G, x: number, y: number, s: number, t: number, seed = 0) {
  const f = 1 + Math.sin(t * 9 + seed) * 0.08, lean = Math.sin(t * 5 + seed * 2) * 0.12;
  const drop = (h: number, w: number, c: string) => { g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(w, -h * 0.25, w * 0.6, -h * 0.7, lean * h, -h); g.bezierCurveTo(-w * 0.6, -h * 0.7, -w, -h * 0.25, 0, 0); g.fillStyle = c; g.fill(); };
  g.save(); g.translate(x, y); g.scale(s, s * f);
  drop(110, 46, C.vermilion); drop(80, 34, C.fire); drop(50, 20, C.fire2);
  g.restore();
}
export function diya(g: G, x: number, y: number, s: number, t: number) {
  g.save(); g.translate(x, y); g.scale(s, s);
  g.beginPath(); g.moveTo(-26, 0); g.quadraticCurveTo(0, 26, 26, 0); g.quadraticCurveTo(12, -6, 30, -10); g.lineTo(-26, 0); fs(g, C.earth, C.ink, 2);
  line(g, [[-20, 3], [20, 3]], C.gold, 2);
  flame(g, 22, -10, 0.22, t, x);
  g.restore();
}
export function mountain(g: G, x: number, y: number, w: number, h: number, col = C.stone, col2 = C.earth, seed = 1) {
  const R = rng(seed);
  // a pichwai mountain: stacked rounded rocks, each with an outline and a few dots
  const rows = 5;
  for (let r = 0; r < rows; r++) {
    const rw = w * (1 - r / rows * 0.75), ry = y - (h / rows) * r, n = Math.max(1, rows - r + 1);
    for (let i = 0; i < n; i++) {
      const cx = x - rw / 2 + (rw / n) * (i + 0.5) + (R() - 0.5) * 10, ww = rw / n * 0.62, hh = h / rows * 0.75;
      g.beginPath(); g.ellipse(cx, ry - hh * 0.5, ww, hh, 0, Math.PI, 0); g.lineTo(cx + ww, ry); g.lineTo(cx - ww, ry); g.closePath();
      fs(g, (r + i) % 2 ? col : col2, C.ink, 2.4);
      g.fillStyle = 'rgba(255,255,255,0.45)'; for (let k = 0; k < 3; k++) { g.beginPath(); g.arc(cx + (R() - 0.5) * ww, ry - hh * (0.3 + R() * 0.5), 2.4, 0, 7); g.fill(); }
    }
  }
}
export function hills(g: G, y: number, cols: string[], t = 0, seed = 2) {
  const R = rng(seed);
  cols.forEach((c, k) => {
    const yy = y + k * 40; g.beginPath(); g.moveTo(-400, PH + 400); g.lineTo(-400, yy);
    for (let x = -400; x <= PW + 400; x += 160) g.quadraticCurveTo(x + 80, yy - 40 - R() * 50, x + 160, yy);
    g.lineTo(PW + 400, PH + 400); g.closePath(); fs(g, c, C.ink, 2.4);
  });
  void t;
}
/** Trees: kadamba (round, dotted), mango, ashoka (tall, red flowers), banana, palm. */
export function tree(g: G, x: number, y: number, s: number, kind: 'kadamba' | 'mango' | 'ashoka' | 'banana' | 'palm' | 'peepal', t = 0, seed = 1) {
  const R = rng(seed);
  g.save(); g.translate(x, y); g.scale(s, s);
  const sway = Math.sin(t * 0.8 + seed) * 0.02;
  g.rotate(sway);
  if (kind === 'banana') {
    stroke2(g, [[0, 0], [2, -90], [0, -170]], 22, C.olive);
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI / 2 + (i - 2.5) * 0.45 + Math.sin(t + i) * 0.05, L = 120 + R() * 40;
      g.save(); g.translate(0, -160); g.rotate(a + Math.PI / 2);
      g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(L * 0.5, -32, L, 8); g.quadraticCurveTo(L * 0.5, 30, 0, 0); fs(g, i % 2 ? C.leaf : C.green, C.ink, 2.2);
      g.strokeStyle = 'rgba(255,255,255,0.4)'; g.lineWidth = 1.5; for (let k = 1; k < 8; k++) { g.beginPath(); g.moveTo(L * k / 8, 0); g.lineTo(L * k / 8 + 8, -14 + k * 1.2); g.stroke(); }
      g.restore();
    }
  } else if (kind === 'palm') {
    stroke2(g, [[0, 0], [10, -100], [4, -200]], 16, C.brown);
    for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2 + sway * 5; g.save(); g.translate(4, -200); g.rotate(a); g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(50, -30, 100, 20); g.quadraticCurveTo(50, -10, 0, 0); fs(g, C.green, C.ink, 2); g.restore(); }
  } else {
    const trunkH = kind === 'ashoka' ? 60 : 90;
    stroke2(g, [[0, 0], [-4, -trunkH * 0.6], [2, -trunkH]], 22, C.brown);
    stroke2(g, [[0, -trunkH * 0.7], [-34, -trunkH - 20]], 9, C.brown); stroke2(g, [[0, -trunkH * 0.75], [30, -trunkH - 26]], 9, C.brown);
    const crown: number[][] = [];
    const cw = kind === 'ashoka' ? 70 : 120, ch = kind === 'ashoka' ? 210 : 120, cy = -trunkH - ch * 0.55;
    for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2, r = 1 + (R() - 0.5) * 0.15 + (i % 2) * 0.08; crown.push([Math.cos(a) * cw * r, cy + Math.sin(a) * ch * 0.5 * r]); }
    smooth(g, crown); fs(g, kind === 'mango' ? C.green : kind === 'ashoka' ? C.peacock : kind === 'peepal' ? C.leaf : C.green, C.ink, 2.6);
    // leaves as rows of little almond shapes
    g.save(); smooth(g, crown); g.clip();
    for (let i = 0; i < 70; i++) {
      const lx = (R() - 0.5) * cw * 2, ly = cy + (R() - 0.5) * ch;
      g.save(); g.translate(lx, ly); g.rotate(R() * 6.28); g.fillStyle = R() > 0.5 ? 'rgba(160,210,90,0.55)' : 'rgba(10,60,40,0.4)'; g.beginPath(); g.ellipse(0, 0, 9, 3.5, 0, 0, 7); g.fill(); g.restore();
    }
    g.restore();
    if (kind === 'kadamba') for (let i = 0; i < 22; i++) { const lx = (R() - 0.5) * cw * 1.6, ly = cy + (R() - 0.5) * ch * 0.8; circle(g, lx, ly, 6, C.gold, C.ink, 1.2); g.fillStyle = C.white; for (let k = 0; k < 6; k++) { const a = k; g.beginPath(); g.arc(lx + Math.cos(a) * 6, ly + Math.sin(a) * 6, 1.4, 0, 7); g.fill(); } }
    if (kind === 'mango') for (let i = 0; i < 12; i++) { const lx = (R() - 0.5) * cw * 1.5, ly = cy + (R() - 0.3) * ch * 0.7; ellipse(g, lx, ly, 6, 9, 0.3, C.gold, C.ink, 1.2); }
    if (kind === 'ashoka') for (let i = 0; i < 18; i++) { const lx = (R() - 0.5) * cw * 1.4, ly = cy + (R() - 0.5) * ch * 0.85; for (let k = 0; k < 5; k++) circle(g, lx + (k - 2) * 3, ly + Math.abs(k - 2) * 3, 2.6, k % 2 ? C.vermilion : C.saffron); }
  }
  g.restore();
}
/** A cusped (multifoil) arch, the frame of a shrine. Path only. */
export function archPath(g: G, x: number, y: number, w: number, h: number, lobes = 5) {
  const spring = y - h * 0.58, top = y - h;
  g.beginPath(); g.moveTo(x - w / 2, y); g.lineTo(x - w / 2, spring);
  const pts: number[][] = [];
  for (let i = 0; i <= 40; i++) {
    const t = i / 40, a = Math.PI * (1 - t);
    const px = x + Math.cos(a) * w / 2, py = spring - Math.sin(a) * (spring - top) * (1 - 0.18 * Math.abs(Math.cos(a)));
    pts.push([px, py]);
  }
  // scallops: bulge inward between lobe points
  for (let k = 0; k < lobes * 2; k++) {
    const i0 = Math.round((k / (lobes * 2)) * 40), i1 = Math.round(((k + 1) / (lobes * 2)) * 40);
    const [ax, ay] = pts[i0], [bx, by] = pts[i1];
    const mx = (ax + bx) / 2, my = (ay + by) / 2, dx = x - mx, dy = (spring + top) / 2 - my, L = Math.hypot(dx, dy) || 1;
    const bulge = Math.hypot(bx - ax, by - ay) * 0.32;
    g.quadraticCurveTo(mx + (dx / L) * bulge, my + (dy / L) * bulge, bx, by);
  }
  g.lineTo(x + w / 2, y); g.closePath();
}
/** A page frame: patterned border around the whole picture. */
export function frame(g: G, col = C.magenta, col2 = C.gold, w = 26) {
  g.save();
  g.beginPath(); g.rect(-50, -50, PW + 100, PH + 100); g.rect(w, w, PW - 2 * w, PH - 2 * w); g.fillStyle = col; g.fill('evenodd');
  g.strokeStyle = col2; g.lineWidth = 3; g.strokeRect(w - 3, w - 3, PW - 2 * w + 6, PH - 2 * w + 6);
  g.fillStyle = col2;
  for (let x = w + 10; x < PW - w; x += 34) { star4(g, x, w / 2, 5); star4(g, x + 17, PH - w / 2, 5); }
  for (let y = w + 10; y < PH - w; y += 34) { star4(g, w / 2, y, 5); star4(g, PW - w / 2, y + 17, 5); }
  g.restore();
}
/** Marigold string sagging between two points. */
export function garland(g: G, x0: number, y0: number, x1: number, y1: number, sag: number, t = 0, cols = [C.marigold, C.saffron, C.gold]) {
  const n = Math.max(6, Math.round(Math.hypot(x1 - x0, y1 - y0) / 12));
  const sw = Math.sin(t * 1.2 + x0) * 4;
  for (let i = 0; i <= n; i++) {
    const u = i / n, x = lerp(x0, x1, u), y = lerp(y0, y1, u) + Math.sin(u * Math.PI) * (sag + sw);
    circle(g, x, y, 7, cols[i % cols.length], C.ink, 1.2);
    if (i % 4 === 2) { g.fillStyle = C.green; g.beginPath(); g.ellipse(x, y + 10, 4, 9, 0.3, 0, 7); g.fill(); }
  }
}
export function toran(g: G, x0: number, x1: number, y: number, t = 0) {
  line(g, [[x0, y], [x1, y]], C.brown, 3);
  for (let x = x0 + 14; x < x1; x += 28) { g.save(); g.translate(x, y); g.rotate(Math.sin(t * 1.5 + x * 0.1) * 0.08); g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(10, 22, 0, 44); g.quadraticCurveTo(-10, 22, 0, 0); fs(g, C.leaf, C.ink, 1.4); g.restore(); }
}
/** Stage curtains, drawn open by `o` (0 closed → 1 open). */
export function curtains(g: G, o: number, t: number, col = C.magenta) {
  for (const side of [-1, 1]) {
    const w = PW / 2 * (1 - o * 0.82);
    g.save(); if (side > 0) { g.translate(PW, 0); g.scale(-1, 1); }
    g.beginPath(); g.moveTo(-10, -10); g.lineTo(w, -10);
    const folds = 6;
    for (let i = folds; i >= 0; i--) { const y = (PH + 20) * (1 - i / folds); g.lineTo(w - Math.sin(i * 1.3 + t * 0.6) * 12 - (1 - i / folds) * w * 0.25 * o, y); }
    g.lineTo(-10, PH + 10); g.closePath(); fs(g, col, C.ink, 3);
    g.strokeStyle = 'rgba(255,190,220,0.45)'; g.lineWidth = 2;
    for (let i = 1; i < 6; i++) { const x = (w * i) / 6; g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + 10, PH * 0.3, x - 10, PH * 0.6, x - (1 - i / 6) * w * 0.25 * o, PH); g.stroke(); }
    // gold border with dots
    g.fillStyle = C.gold; g.fillRect(w - 18, -10, 14, PH + 20);
    for (let y = 10; y < PH; y += 26) circle(g, w - 11, y, 4, C.maroon);
    g.restore();
  }
  // valance
  g.beginPath(); g.moveTo(-10, -10); g.lineTo(PW + 10, -10); g.lineTo(PW + 10, 50);
  for (let x = PW; x >= 0; x -= 80) g.quadraticCurveTo(x - 40, 100, x - 80, 50);
  g.closePath(); fs(g, C.gold, C.ink, 3);
  for (let x = 40; x < PW; x += 80) circle(g, x, 62, 7, C.vermilion, C.ink, 1.5);
}
/** Confetti streamers, like ribbons thrown at a festival. */
export function streamers(g: G, t: number, seed = 9, n = 18, col = 'rgba(255,248,230,0.9)') {
  const R = rng(seed);
  g.strokeStyle = col; g.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const x = R() * PW, sp = 30 + R() * 40, y = ((t * sp + R() * 900) % 1000) - 60, L = 40 + R() * 40;
    g.lineWidth = 3 + R() * 2; g.beginPath(); g.moveTo(x, y);
    for (let k = 1; k <= 8; k++) g.lineTo(x + Math.sin(k * 0.9 + t * 3 + i) * 8, y + (k / 8) * L);
    g.stroke();
  }
}
/** Palace silhouettes: Ayodhya (cream and gold domes) or Lanka (gold spires). */
export function palace(g: G, x: number, y: number, s: number, kind: 'ayodhya' | 'lanka' = 'ayodhya', t = 0) {
  g.save(); g.translate(x, y); g.scale(s, s);
  const wall = kind === 'lanka' ? C.gold : C.cream, roof = kind === 'lanka' ? C.marigold : C.gold, trim = kind === 'lanka' ? C.maroon : C.vermilion;
  const block = (bx: number, bw: number, bh: number, dome: 'onion' | 'spire' | 'chhatri') => {
    g.beginPath(); g.rect(bx - bw / 2, -bh, bw, bh); fs(g, wall, C.ink, 2.4);
    for (let i = 0; i < Math.floor(bw / 40); i++) { const ax = bx - bw / 2 + 20 + i * 40; archPath(g, ax, -bh * 0.18, 24, Math.min(70, bh * 0.4), 3); fs(g, kind === 'lanka' ? C.maroon : C.navy, C.ink, 1.6); }
    g.fillStyle = trim; g.fillRect(bx - bw / 2, -bh, bw, 8);
    if (dome === 'onion') { g.beginPath(); g.moveTo(bx - bw * 0.36, -bh); g.bezierCurveTo(bx - bw * 0.5, -bh - bw * 0.5, bx - 4, -bh - bw * 0.55, bx, -bh - bw * 0.8); g.bezierCurveTo(bx + 4, -bh - bw * 0.55, bx + bw * 0.5, -bh - bw * 0.5, bx + bw * 0.36, -bh); fs(g, roof, C.ink, 2.4); line(g, [[bx, -bh - bw * 0.8], [bx, -bh - bw * 0.95]], C.ink, 2); }
    else if (dome === 'spire') { g.beginPath(); g.moveTo(bx - bw * 0.42, -bh); g.lineTo(bx - bw * 0.18, -bh - bw * 0.9); g.lineTo(bx, -bh - bw * 1.4); g.lineTo(bx + bw * 0.18, -bh - bw * 0.9); g.lineTo(bx + bw * 0.42, -bh); fs(g, roof, C.ink, 2.4); for (let k = 1; k < 4; k++) line(g, [[bx - bw * 0.42 + k * bw * 0.06, -bh - k * bw * 0.25], [bx + bw * 0.42 - k * bw * 0.06, -bh - k * bw * 0.25]], trim, 3); }
    else { g.beginPath(); g.moveTo(bx - bw * 0.4, -bh - 20); g.quadraticCurveTo(bx, -bh - bw * 0.7, bx + bw * 0.4, -bh - 20); fs(g, roof, C.ink, 2.4); g.beginPath(); g.rect(bx - bw * 0.42, -bh - 22, bw * 0.84, 22); fs(g, wall, C.ink, 2); }
    // flag
    const fx = bx, fy = dome === 'spire' ? -bh - bw * 1.4 : -bh - bw * 0.95;
    line(g, [[fx, fy], [fx, fy - 30]], C.ink, 2);
    g.beginPath(); g.moveTo(fx, fy - 30); g.quadraticCurveTo(fx + 14, fy - 30 + Math.sin(t * 4 + bx) * 4, fx + 28, fy - 24); g.lineTo(fx, fy - 18); fs(g, kind === 'lanka' ? C.maroon : C.saffron, C.ink, 1.4);
  };
  if (kind === 'lanka') { block(-220, 90, 240, 'spire'); block(-110, 110, 330, 'spire'); block(10, 140, 420, 'spire'); block(140, 110, 300, 'spire'); block(240, 90, 220, 'spire'); }
  else { block(-230, 110, 160, 'chhatri'); block(-110, 130, 230, 'onion'); block(20, 160, 290, 'onion'); block(150, 130, 220, 'onion'); block(260, 110, 160, 'chhatri'); }
  g.restore();
}
/** Devanagari on the canvas. */
export function devText(g: G, s: string, x: number, y: number, size: number, col: string, align: CanvasTextAlign = 'center', font = '"Tiro Devanagari Sanskrit", "Noto Serif Devanagari", serif') {
  g.font = `${size}px ${font}`; g.textAlign = align; g.textBaseline = 'middle'; g.fillStyle = col; g.fillText(s, x, y);
}
