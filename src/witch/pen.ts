/**
 * The pen: one felt-tip line, a little shaky, that "boils" — every few frames
 * the wobble is redrawn from a different seed, the way a hand-drawn cartoon's
 * lines shimmer when it is animated. Plus a single-stroke capital alphabet so
 * that every word on the site is drawn by the same pen.
 */

export type P = [number, number];

// --------------------------------------------------------------- noise
function hash(n: number) { n = Math.imul(n ^ 0x27d4eb2d, 0x165667b1); n ^= n >>> 15; return ((n >>> 0) % 100000) / 100000; }
export function noise1(x: number, seed: number) {
  const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  const a = hash(i * 7919 + seed * 104729) * 2 - 1, b = hash((i + 1) * 7919 + seed * 104729) * 2 - 1;
  return a + (b - a) * u;
}

export interface Pen {
  ctx: CanvasRenderingContext2D;
  boil: number;      // which wobble we are on
  wobble: number;    // how shaky, in px
  width: number;     // line width, px
  ink: string;
}

export function makePen(ctx: CanvasRenderingContext2D): Pen { return { ctx, boil: 0, wobble: 1.4, width: 2.2, ink: '#141414' }; }

let strokeId = 0;
/**
 * Draw one line through pts with the pen's wobble. `id` keeps the wobble of a
 * given line stable between boils (pass the same id for the same line).
 */
export function line(pen: Pen, pts: P[], id?: number, opts: { w?: number; wob?: number; close?: boolean; fill?: string } = {}) {
  if (pts.length < 2) return;
  const sid = (id ?? strokeId++) * 31 + pen.boil * 977;
  const wob = opts.wob ?? pen.wobble;
  const ctx = pen.ctx;
  // resample so the wobble has somewhere to live
  const out: P[] = [];
  let s = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[i + 1];
    const L = Math.hypot(bx - ax, by - ay);
    const n = Math.max(1, Math.ceil(L / 6));
    for (let k = 0; k < n; k++) {
      const t = k / n;
      const x = ax + (bx - ax) * t, y = ay + (by - ay) * t;
      const ss = s + L * t;
      out.push([x + noise1(ss * 0.035, sid) * wob + noise1(ss * 0.2, sid + 7) * wob * 0.25, y + noise1(ss * 0.035, sid + 3) * wob + noise1(ss * 0.2, sid + 11) * wob * 0.25]);
    }
    s += L;
  }
  const last = pts[pts.length - 1];
  out.push([last[0] + noise1(s * 0.035, sid) * wob, last[1] + noise1(s * 0.035, sid + 3) * wob]);
  ctx.beginPath();
  ctx.moveTo(out[0][0], out[0][1]);
  for (let i = 1; i < out.length; i++) ctx.lineTo(out[i][0], out[i][1]);
  if (opts.close) ctx.closePath();
  if (opts.fill) { ctx.fillStyle = opts.fill; ctx.fill(); }
  ctx.lineWidth = (opts.w ?? pen.width) * (0.92 + 0.16 * hash(sid));
  ctx.strokeStyle = pen.ink;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.stroke();
}

// --------------------------------------------------------------- curve helpers
export function bez(p0: P, p1: P, p2: P, p3: P, n = 16): P[] {
  const out: P[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = 1 - t;
    out.push([u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0], u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]]);
  }
  return out;
}
export function quad(p0: P, p1: P, p2: P, n = 12): P[] {
  const out: P[] = [];
  for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; out.push([u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]]); }
  return out;
}
export function arc(cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, n = 24): P[] {
  const out: P[] = [];
  for (let i = 0; i <= n; i++) { const a = a0 + ((a1 - a0) * i) / n; out.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); }
  return out;
}
/** A smooth line through points (Catmull-Rom). */
export function smooth(pts: P[], per = 8): P[] {
  if (pts.length < 3) return pts;
  const out: P[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < per; k++) {
      const t = k / per, t2 = t * t, t3 = t2 * t;
      out.push([
        0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
        0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
      ]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

// --------------------------------------------------------------- the alphabet
// Single-stroke capitals on a box 1 unit tall; x runs to the glyph's width.
const G: Record<string, [number, string]> = {
  A: [0.7, '0,1 .35,0 .7,1|.13,.62 .57,.62'],
  B: [0.65, '0,1 0,0 .42,0 .58,.12 .58,.34 .42,.47 0,.47|.42,.47 .64,.6 .64,.86 .48,1 0,1'],
  C: [0.66, '.66,.14 .5,0 .22,0 .03,.22 0,.55 .08,.85 .3,1 .52,1 .66,.87'],
  D: [0.66, '0,0 0,1 .36,1 .62,.78 .66,.45 .56,.15 .34,0 0,0'],
  E: [0.6, '.6,0 0,0 0,1 .6,1|0,.5 .44,.5'],
  F: [0.58, '.58,0 0,0 0,1|0,.5 .42,.5'],
  G: [0.7, '.66,.14 .5,0 .22,0 .03,.22 0,.55 .08,.85 .3,1 .52,1 .68,.84 .68,.56 .38,.56'],
  H: [0.66, '0,0 0,1|.66,0 .66,1|0,.5 .66,.5'],
  I: [0.18, '.09,0 .09,1'],
  J: [0.55, '.55,0 .55,.78 .42,.98 .18,1 0,.84'],
  K: [0.62, '0,0 0,1|.6,0 0,.62|.2,.45 .62,1'],
  L: [0.55, '0,0 0,1 .55,1'],
  M: [0.84, '0,1 .04,0 .42,.62 .8,0 .84,1'],
  N: [0.68, '0,1 0,0 .68,1 .68,0'],
  O: [0.72, '.36,0 .1,.12 0,.5 .1,.88 .36,1 .62,.88 .72,.5 .62,.12 .36,0'],
  P: [0.6, '0,1 0,0 .44,0 .6,.14 .6,.36 .44,.5 0,.5'],
  Q: [0.74, '.36,0 .1,.12 0,.5 .1,.88 .36,1 .62,.88 .72,.5 .62,.12 .36,0|.42,.72 .76,1.06'],
  R: [0.64, '0,1 0,0 .44,0 .6,.14 .6,.36 .44,.5 0,.5|.28,.5 .64,1'],
  S: [0.62, '.62,.12 .45,0 .18,0 .02,.15 .05,.36 .32,.5 .58,.62 .64,.85 .46,1 .2,1 0,.88'],
  T: [0.7, '0,0 .7,0|.35,0 .35,1'],
  U: [0.66, '0,0 0,.74 .14,.98 .5,1 .66,.76 .66,0'],
  V: [0.7, '0,0 .35,1 .7,0'],
  W: [0.94, '0,0 .2,1 .47,.35 .72,1 .94,0'],
  X: [0.66, '0,0 .66,1|.66,0 0,1'],
  Y: [0.68, '0,0 .34,.5 .68,0|.34,.5 .34,1'],
  Z: [0.64, '0,0 .64,0 0,1 .64,1'],
  '0': [0.6, '.3,0 .07,.15 0,.5 .07,.85 .3,1 .53,.85 .6,.5 .53,.15 .3,0'],
  '1': [0.36, '.05,.2 .28,0 .28,1'],
  '2': [0.6, '0,.2 .18,0 .45,0 .6,.18 .56,.4 0,1 .62,1'],
  '3': [0.6, '0,.1 .2,0 .48,0 .6,.15 .55,.38 .26,.48 .58,.6 .62,.85 .44,1 .14,1 0,.9'],
  '4': [0.64, '.5,1 .5,0 0,.7 .66,.7'],
  '5': [0.6, '.58,0 .1,0 .05,.45 .38,.4 .6,.58 .6,.85 .4,1 .1,1 0,.9'],
  '6': [0.6, '.52,0 .18,.25 0,.65 .1,.95 .34,1 .58,.85 .58,.6 .34,.48 .04,.6'],
  '7': [0.6, '0,0 .62,0 .22,1'],
  '8': [0.62, '.31,.48 .1,.35 .1,.12 .31,0 .53,.12 .53,.35 .31,.48 .05,.62 .05,.88 .31,1 .58,.88 .58,.62 .31,.48'],
  '9': [0.6, '.58,.38 .34,.5 .07,.38 .07,.12 .3,0 .55,.1 .58,.38 .48,1'],
  '!': [0.2, '.1,0 .1,.68|.1,.9 .1,.96'],
  '?': [0.56, '0,.2 .15,0 .42,0 .56,.18 .52,.38 .28,.55 .28,.72|.28,.92 .28,.98'],
  '.': [0.16, '.06,.92 .07,.99'],
  ',': [0.18, '.1,.88 .04,1.1'],
  "'": [0.16, '.1,0 .05,.24'],
  '’': [0.16, '.1,0 .05,.24'],
  '"': [0.3, '.05,0 .05,.24|.25,0 .25,.24'],
  '“': [0.3, '.05,0 .05,.24|.25,0 .25,.24'],
  '”': [0.3, '.05,0 .05,.24|.25,0 .25,.24'],
  '-': [0.42, '0,.52 .42,.5'],
  '–': [0.5, '0,.52 .5,.5'],
  '—': [0.7, '0,.52 .7,.5'],
  ':': [0.16, '.07,.3 .07,.36|.07,.86 .07,.92'],
  ';': [0.18, '.08,.3 .08,.36|.1,.86 .04,1.08'],
  '&': [0.72, '.68,1 .12,.36 .16,.1 .34,0 .5,.12 .46,.3 0,.66 .06,.92 .3,1 .52,.9 .72,.6'],
  '/': [0.5, '0,1 .5,0'],
  '(': [0.26, '.26,0 0,.5 .26,1'],
  ')': [0.26, '0,0 .26,.5 0,1'],
  '+': [0.5, '0,.5 .5,.5|.25,.25 .25,.75'],
  '*': [0.46, '.23,.15 .23,.65|0,.27 .46,.53|.46,.27 0,.53'],
  '#': [0.6, '.18,0 .12,1|.48,0 .42,1|0,.33 .6,.33|0,.67 .6,.67'],
  '%': [0.66, '.6,0 .06,1|.12,.06 .2,.16 .12,.26 .04,.16 .12,.06|.54,.74 .62,.84 .54,.94 .46,.84 .54,.74'],
  '@': [0.8, '.56,.62 .52,.36 .34,.32 .26,.52 .36,.66 .54,.6 .62,.66 .74,.5 .66,.16 .4,0 .12,.12 0,.45 .12,.82 .4,1 .64,.92'],
  '=': [0.5, '0,.38 .5,.38|0,.64 .5,.64'],
  '₹': [0.56, '0,0 .56,0|0,.22 .56,.22|.06,0 .34,0 .48,.14 .34,.4 .06,.4 .5,1'],
  '♥': [0.7, '.35,1 .04,.55 0,.3 .12,.08 .3,.06 .35,.25 .4,.06 .58,.08 .7,.3 .66,.55 .35,1'],
  '→': [0.62, '0,.52 .6,.5|.38,.3 .6,.5 .38,.72'],
  '←': [0.62, '.62,.52 .02,.5|.24,.3 .02,.5 .24,.72'],
  '×': [0.44, '0,.3 .42,.74|.42,.3 0,.74'],
  '·': [0.18, '.08,.5 .09,.54'],
  '☆': [0.7, '.35,0 .45,.36 .7,.38 .5,.6 .58,1 .35,.76 .12,1 .2,.6 0,.38 .25,.36 .35,0'],
};
const PARSED: Record<string, [number, P[][]]> = {};
for (const [k, [w, d]] of Object.entries(G)) PARSED[k] = [w, d.split('|').map((s) => s.trim().split(' ').map((q) => q.split(',').map(Number) as P))];

export interface TextOpts { size: number; seed?: number; spacing?: number; jitter?: number; w?: number; align?: 'left' | 'center' | 'right'; maxWidth?: number; lineGap?: number; slant?: number }

/** Width a word or line will take, before jitter. */
export function measure(text: string, size: number, spacing = 0.22) {
  let x = 0;
  for (const ch of text.toUpperCase()) { if (ch === ' ') { x += size * 0.5; continue; } const g = PARSED[ch]; x += ((g ? g[0] : 0.5) + spacing) * size * 0.72; }
  return x;
}

/** Break into lines that fit maxWidth. */
export function wrap(text: string, size: number, maxWidth: number, spacing = 0.22) {
  const out: string[] = [];
  for (const para of text.toUpperCase().split('\n')) {
    let line = '';
    for (const w of para.split(' ')) {
      const t = line ? line + ' ' + w : w;
      if (measure(t, size, spacing) > maxWidth && line) { out.push(line); line = w; } else line = t;
    }
    out.push(line);
  }
  return out;
}

/**
 * Hand-letter text at (x, y): the top of the first line. Letters wander a
 * little in size and baseline, the way a person writes in capitals.
 * Returns the height used.
 */
export function letter(pen: Pen, text: string, x: number, y: number, o: TextOpts) {
  const size = o.size, sp = o.spacing ?? 0.22, jit = o.jitter ?? 0.1, seed = o.seed ?? 1;
  const lines = o.maxWidth ? wrap(text, size, o.maxWidth, sp) : text.toUpperCase().split('\n');
  const gap = size * (o.lineGap ?? 1.45);
  let n = 0;
  lines.forEach((ln, li) => {
    const lw = measure(ln, size, sp);
    let cx = o.align === 'center' ? x - lw / 2 : o.align === 'right' ? x - lw : x;
    const by = y + li * gap;
    // each line drifts uphill or downhill a touch
    const drift = (hash(seed * 13 + li) - 0.5) * size * 0.25;
    for (const ch of ln) {
      n++;
      if (ch === ' ') { cx += size * 0.5; continue; }
      const g = PARSED[ch];
      if (!g) { cx += size * 0.4; continue; }
      const [gw, strokes] = g;
      const k = seed * 101 + n * 7;
      const s = size * (1 + (hash(k) - 0.5) * jit * 2) * 0.86;
      const dy = (hash(k + 1) - 0.5) * size * jit * 0.9 + drift * ((cx - x) / Math.max(1, lw));
      const rot = (hash(k + 2) - 0.5) * jit * 0.5 + (o.slant ?? 0);
      const cs = Math.cos(rot), sn = Math.sin(rot);
      const ox = cx, oy = by + dy + (size - s);
      strokes.forEach((st, si) => {
        const pts = st.map(([px, py]) => { const lx = px * s * 0.86, ly = py * s; return [ox + lx * cs - ly * sn, oy + lx * sn + ly * cs] as P; });
        line(pen, pts, k * 5 + si, { w: o.w, wob: Math.min(pen.wobble, size * 0.06) });
      });
      cx += (gw + sp) * size * 0.72;
    }
  });
  return lines.length * gap;
}
