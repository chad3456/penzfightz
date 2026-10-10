/**
 * A pen-and-ink kit for the Navadurga gallery, after hand-drawn hatched
 * illustration: lines that wobble like a nib, shapes filled with parallel
 * hatching, crosshatch, stipple, waves, chevrons, diamonds, dotted rules and
 * fish-scale water; a sun whose rays are each filled with a different
 * pattern; the ballpoint fan motif; crayon scribble on paper scraps held
 * with tape; paper grain under everything.
 *
 * Shapes are point lists so their outlines can be drawn with a trembling
 * line, and are clipped as paths for their fills.
 */

export type G = CanvasRenderingContext2D;
export type Pt = [number, number];

export function rng(seed: number) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
export const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
export const out = (t: number) => 1 - Math.pow(1 - clamp(t), 3);
export const TAU = Math.PI * 2;

/* ───────── palettes, one per manner of drawing ───────── */

export interface Ink { paper: string; paper2: string; ink: string; ink2: string; red: string; accent: string; light: string; dark: string }
export const INKS: Record<string, Ink> = {
  ochre: { paper: '#ebb74a', paper2: '#e3a93c', ink: '#4a2a17', ink2: '#7a4a24', red: '#d0402a', accent: '#e8722c', light: '#f7d98a', dark: '#2e1a10' },
  ballpoint: { paper: '#f6d2b8', paper2: '#efc6aa', ink: '#2234a8', ink2: '#3f56c8', red: '#c8442a', accent: '#d8603a', light: '#fde6d4', dark: '#141c6a' },
  crayon: { paper: '#f2e6c8', paper2: '#e9dcbc', ink: '#2f4fb4', ink2: '#2f8a4a', red: '#d23a2e', accent: '#e8b13a', light: '#fbf4e0', dark: '#2a2a3a' },
  night: { paper: '#1c1f4a', paper2: '#161838', ink: '#f2e2b8', ink2: '#c9b98a', red: '#e85a3a', accent: '#f0b23a', light: '#fff4d8', dark: '#0b0c24' },
  white: { paper: '#f4efe4', paper2: '#ebe4d6', ink: '#5a5a66', ink2: '#8a8a96', red: '#c4523c', accent: '#c9a03a', light: '#ffffff', dark: '#3a3a44' },
  rust: { paper: '#a8432e', paper2: '#93382a', ink: '#f3dcc0', ink2: '#5a1a14', red: '#f7c86a', accent: '#f3a24a', light: '#fbead2', dark: '#3a120c' },
  teal: { paper: '#cfe0d4', paper2: '#c2d6c8', ink: '#1d4a4a', ink2: '#2e7a6a', red: '#c8442a', accent: '#d89a2a', light: '#eef6ee', dark: '#0e2a2a' },
};

/* ───────── paper ───────── */

/** Fill with paper: the base colour, a fine grain and a few fibres. */
export function paper(g: G, w: number, h: number, ink: Ink, seed = 1) {
  g.fillStyle = ink.paper; g.fillRect(0, 0, w, h);
  const R = rng(seed);
  g.save();
  for (let i = 0; i < (w * h) / 900; i++) { g.globalAlpha = 0.05 + R() * 0.07; g.fillStyle = R() > 0.5 ? ink.paper2 : ink.light; g.fillRect(R() * w, R() * h, 1 + R() * 2, 1 + R() * 2); }
  g.globalAlpha = 0.06; g.strokeStyle = ink.ink; g.lineWidth = 0.6;
  for (let i = 0; i < 40; i++) { const x = R() * w, y = R() * h, a = R() * TAU, l = 6 + R() * 20; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a + 1) * l * 0.5, y + Math.sin(a + 1) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
  g.restore();
}

/* ───────── the trembling line ───────── */

/** A hand-drawn polyline: each segment is broken into short steps with a small wobble. */
export function pen(g: G, pts: Pt[], color: string, w = 1.6, R: () => number = Math.random, wob = 0.9, close = false) {
  if (pts.length < 2) return;
  const P = close ? [...pts, pts[0]] : pts;
  g.strokeStyle = color; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round';
  g.beginPath(); g.moveTo(P[0][0], P[0][1]);
  for (let i = 1; i < P.length; i++) {
    const [x0, y0] = P[i - 1], [x1, y1] = P[i], d = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.round(d / 9));
    for (let k = 1; k <= n; k++) { const u = k / n; g.lineTo(lerp(x0, x1, u) + (R() - 0.5) * wob, lerp(y0, y1, u) + (R() - 0.5) * wob); }
  }
  g.stroke();
}

export function toPath(pts: Pt[]) { const p = new Path2D(); p.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) p.lineTo(pts[i][0], pts[i][1]); p.closePath(); return p; }

/** Points round an ellipse, from a0 to a1. */
export function arcPts(cx: number, cy: number, rx: number, ry: number, a0 = 0, a1 = TAU, n = 48): Pt[] { const o: Pt[] = []; for (let i = 0; i <= n; i++) { const a = lerp(a0, a1, i / n); o.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); } return o; }

/** A smooth closed blob through control points (Catmull-Rom sampled). */
export function blob(ctrl: Pt[], per = 8): Pt[] {
  const o: Pt[] = [], n = ctrl.length;
  for (let i = 0; i < n; i++) {
    const p0 = ctrl[(i - 1 + n) % n], p1 = ctrl[i], p2 = ctrl[(i + 1) % n], p3 = ctrl[(i + 2) % n];
    for (let k = 0; k < per; k++) { const t = k / per, t2 = t * t, t3 = t2 * t; o.push([0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3), 0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]); }
  }
  return o;
}

/** An open smooth curve through points. */
export function curve(ctrl: Pt[], per = 8): Pt[] {
  const o: Pt[] = [], n = ctrl.length;
  for (let i = 0; i < n - 1; i++) {
    const p0 = ctrl[Math.max(0, i - 1)], p1 = ctrl[i], p2 = ctrl[i + 1], p3 = ctrl[Math.min(n - 1, i + 2)];
    for (let k = 0; k < per; k++) { const t = k / per, t2 = t * t, t3 = t2 * t; o.push([0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3), 0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]); }
  }
  o.push(ctrl[n - 1]);
  return o;
}

/** A tapered limb or stem: a band of width w0→w1 along a curve, as a closed outline. */
export function band(spine: Pt[], w0: number, w1: number): Pt[] {
  const L: Pt[] = [], Rr: Pt[] = [], n = spine.length;
  for (let i = 0; i < n; i++) {
    const a = spine[Math.max(0, i - 1)], b = spine[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1, w = lerp(w0, w1, i / (n - 1)) / 2;
    L.push([spine[i][0] - (dy / d) * w, spine[i][1] + (dx / d) * w]); Rr.push([spine[i][0] + (dy / d) * w, spine[i][1] - (dx / d) * w]);
  }
  return [...L, ...Rr.reverse()];
}

/* ───────── fills ───────── */

export type Hatch = 'lines' | 'cross' | 'wave' | 'zig' | 'dots' | 'dashes' | 'scales' | 'chevron' | 'diamonds' | 'stitch' | 'stipple' | 'solid' | 'rule' | 'beads';
export interface HatchOpt { angle?: number; gap?: number; color?: string; w?: number; seed?: number; alpha?: number; color2?: string; amp?: number }

function bounds(pts: Pt[]) { let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity; for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); } return { x0, y0, x1, y1 }; }

/**
 * Fill a shape with a pen pattern. The pattern is laid out in a frame turned
 * by `angle` and clipped to the shape, so every line stops at the outline.
 */
export function hatch(g: G, pts: Pt[], kind: Hatch, o: HatchOpt = {}) {
  const R = rng(o.seed ?? 7), col = o.color ?? '#3a2010', gap = o.gap ?? 6, w = o.w ?? 1, ang = o.angle ?? 0.4;
  const b = bounds(pts), cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2, rad = Math.hypot(b.x1 - b.x0, b.y1 - b.y0) / 2 + gap * 2;
  g.save(); g.clip(toPath(pts));
  if (o.alpha !== undefined) g.globalAlpha *= o.alpha;
  if (kind === 'solid') { g.fillStyle = col; g.fill(toPath(pts)); g.restore(); return; }
  if (kind === 'stipple') { g.fillStyle = col; const n = ((b.x1 - b.x0) * (b.y1 - b.y0)) / (gap * gap); for (let i = 0; i < n; i++) { const x = b.x0 + R() * (b.x1 - b.x0), y = b.y0 + R() * (b.y1 - b.y0); g.beginPath(); g.arc(x, y, w * (0.5 + R() * 0.6), 0, TAU); g.fill(); } g.restore(); return; }
  g.translate(cx, cy); g.rotate(ang);
  g.strokeStyle = col; g.fillStyle = col; g.lineWidth = w; g.lineCap = 'round';
  const row = (y: number, draw: (x: number, y: number, i: number) => void, step: number) => { let i = 0; for (let x = -rad - R() * step; x < rad; x += step) draw(x, y, i++); };
  for (let y = -rad, j = 0; y < rad; y += gap, j++) {
    switch (kind) {
      case 'lines': case 'cross': case 'rule': {
        g.beginPath(); g.moveTo(-rad, y + (R() - 0.5) * gap * 0.25);
        for (let x = -rad; x < rad; x += 14) g.lineTo(x, y + (R() - 0.5) * gap * 0.22);
        g.stroke();
        if (kind === 'rule' && j % 2 === 0) { g.save(); g.lineWidth = w * 0.6; g.setLineDash([2, 5]); g.beginPath(); g.moveTo(-rad, y + gap / 2); g.lineTo(rad, y + gap / 2); g.stroke(); g.restore(); }
        break;
      }
      case 'wave': { const amp = o.amp ?? gap * 0.35; g.beginPath(); for (let x = -rad; x < rad; x += 3) g.lineTo(x, y + Math.sin(x * 0.18 + j) * amp); g.stroke(); break; }
      case 'zig': { const amp = o.amp ?? gap * 0.35; g.beginPath(); for (let x = -rad, k = 0; x < rad; x += gap * 0.6, k++) g.lineTo(x, y + (k % 2 ? amp : -amp)); g.stroke(); break; }
      case 'chevron': { const amp = gap * 0.6; g.beginPath(); for (let x = -rad, k = 0; x < rad; x += gap * 1.6, k++) g.lineTo(x, y + (k % 2 ? amp : 0)); g.stroke(); break; }
      case 'dots': row(y, (x) => { g.beginPath(); g.arc(x, y + (j % 2) * 0, w * 1.5, 0, TAU); g.fill(); }, gap * 1.4); break;
      case 'beads': row(y, (x, _y, i) => { g.beginPath(); g.arc(x + (j % 2) * gap * 0.7, y, i % 3 === 0 ? w * 2.2 : w * 1.1, 0, TAU); g.fillStyle = i % 3 === 0 && o.color2 ? o.color2 : col; g.fill(); }, gap * 1.4); break;
      case 'dashes': row(y, (x) => { g.beginPath(); g.moveTo(x, y); g.lineTo(x + gap * 0.9, y); g.stroke(); }, gap * 1.6); break;
      case 'stitch': row(y, (x) => { g.beginPath(); g.moveTo(x, y - gap * 0.25); g.lineTo(x + gap * 0.5, y + gap * 0.25); g.stroke(); }, gap * 1.1); break;
      case 'diamonds': row(y, (x) => { const s = gap * 0.35; g.beginPath(); g.moveTo(x, y - s); g.lineTo(x + s * 0.7, y); g.lineTo(x, y + s); g.lineTo(x - s * 0.7, y); g.closePath(); g.stroke(); }, gap * 1.5); break;
      case 'scales': row(y, (x) => { g.beginPath(); g.arc(x + (j % 2) * gap * 0.75, y, gap * 0.75, Math.PI * 1.05, Math.PI * 1.95); g.stroke(); }, gap * 1.5); break;
    }
  }
  if (kind === 'cross') {
    g.rotate(1.25); g.globalAlpha *= 0.85;
    for (let y = -rad; y < rad; y += gap * 1.15) { g.beginPath(); g.moveTo(-rad, y); for (let x = -rad; x < rad; x += 14) g.lineTo(x, y + (R() - 0.5) * gap * 0.22); g.stroke(); }
  }
  g.restore();
}

/** Fill flat, then hatch over it, then outline: the usual way a shape is inked. */
export function shape(g: G, pts: Pt[], o: { fill?: string; hatch?: Hatch; h?: HatchOpt; line?: string; lw?: number; seed?: number }) {
  if (o.fill) { g.fillStyle = o.fill; g.fill(toPath(pts)); }
  if (o.hatch) hatch(g, pts, o.hatch, { seed: o.seed, ...o.h });
  if (o.line) pen(g, pts, o.line, o.lw ?? 1.6, rng(o.seed ?? 3), 0.8, true);
}

/** Crayon: short jittered strokes, densely, with paper showing through. */
export function crayon(g: G, pts: Pt[], color: string, o: { seed?: number; density?: number; angle?: number; w?: number; alpha?: number } = {}) {
  const R = rng(o.seed ?? 11), b = bounds(pts), dens = o.density ?? 1, ang = o.angle ?? 0.7;
  g.save(); g.clip(toPath(pts));
  g.strokeStyle = color; g.lineCap = 'round';
  const n = (((b.x1 - b.x0) * (b.y1 - b.y0)) / 22) * dens;
  for (let i = 0; i < n; i++) {
    const x = b.x0 + R() * (b.x1 - b.x0), y = b.y0 + R() * (b.y1 - b.y0), a = ang + (R() - 0.5) * 0.5, l = 4 + R() * 9;
    g.globalAlpha = (o.alpha ?? 0.55) * (0.5 + R() * 0.5); g.lineWidth = (o.w ?? 1.6) * (0.6 + R() * 0.8);
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
  g.restore();
}

/** A paper scrap, slightly turned, with tape at two corners. */
export function scrap(g: G, x: number, y: number, w: number, h: number, rot: number, ink: Ink, seed: number, inside?: (g: G) => void) {
  const R = rng(seed);
  g.save(); g.translate(x, y); g.rotate(rot);
  g.fillStyle = 'rgba(60,40,20,0.12)'; g.fillRect(-w / 2 + 4, -h / 2 + 5, w, h);
  g.fillStyle = ink.light; g.fillRect(-w / 2, -h / 2, w, h);
  g.strokeStyle = 'rgba(80,60,40,0.35)'; g.lineWidth = 1; g.strokeRect(-w / 2, -h / 2, w, h);
  if (inside) { g.save(); g.beginPath(); g.rect(-w / 2 + 6, -h / 2 + 6, w - 12, h - 12); g.clip(); inside(g); g.restore(); }
  for (const [tx, ty] of [[-w / 2, -h / 2], [w / 2, -h / 2]] as Pt[]) { g.save(); g.translate(tx, ty); g.rotate((tx < 0 ? -0.7 : 0.7) + (R() - 0.5) * 0.3); g.fillStyle = 'rgba(220,215,200,0.75)'; g.fillRect(-18, -7, 36, 14); g.restore(); }
  g.restore();
}

/* ───────── motifs ───────── */

const RAY_KINDS: Hatch[] = ['lines', 'dots', 'chevron', 'cross', 'wave', 'diamonds', 'dashes', 'zig', 'beads', 'rule', 'stitch'];

/**
 * A sun whose rays each carry their own pattern, alternating with plain
 * paper, some rays darker than others.
 */
export function patternedRays(g: G, cx: number, cy: number, r0: number, r1: number, n: number, ink: Ink, seed = 5, a0 = Math.PI, a1 = TAU) {
  const R = rng(seed);
  for (let i = 0; i < n; i++) {
    const ua = lerp(a0, a1, i / n), ub = lerp(a0, a1, (i + 0.62) / n), wob = (R() - 0.5) * 0.04;
    const pts: Pt[] = [[cx + Math.cos(ua) * r0, cy + Math.sin(ua) * r0], [cx + Math.cos(ua + wob) * r1, cy + Math.sin(ua + wob) * r1], [cx + Math.cos(ub + wob) * r1, cy + Math.sin(ub + wob) * r1], [cx + Math.cos(ub) * r0, cy + Math.sin(ub) * r0]];
    const kind = RAY_KINDS[Math.floor(R() * RAY_KINDS.length)], dark = R() < 0.18;
    if (dark) { g.fillStyle = ink.ink2; g.globalAlpha = 0.35; g.fill(toPath(pts)); g.globalAlpha = 1; hatch(g, pts, 'cross', { color: ink.dark, gap: 3.2, w: 0.8, angle: (ua + ub) / 2, seed: i }); }
    else hatch(g, pts, kind, { color: R() < 0.12 ? ink.red : ink.ink, gap: kind === 'lines' ? 3.4 : 9, w: 0.9, angle: (ua + ub) / 2 + Math.PI / 2 * (kind === 'lines' ? 0 : 1), seed: i, color2: ink.red });
    pen(g, [pts[0], pts[1]], ink.ink, 0.8, R, 0.6); pen(g, [pts[3], pts[2]], ink.ink, 0.8, R, 0.6);
  }
}

/** A half-sun drawn in close horizontal lines, red and orange, with a rim. */
export function lineSun(g: G, cx: number, cy: number, r: number, ink: Ink, seed = 3, full = false) {
  const pts = full ? arcPts(cx, cy, r, r, 0, TAU, 64) : [...arcPts(cx, cy, r, r, Math.PI, TAU, 64)];
  g.fillStyle = ink.light; g.globalAlpha = 0.45; g.fill(toPath(pts)); g.globalAlpha = 1;
  const R = rng(seed);
  g.save(); g.clip(toPath(pts));
  for (let y = cy - r; y < (full ? cy + r : cy); y += 5.5) { g.strokeStyle = R() < 0.5 ? ink.red : ink.accent; g.lineWidth = 1.1; g.beginPath(); g.moveTo(cx - r - 4 + R() * 30, y); for (let x = cx - r; x < cx + r; x += 16) g.lineTo(x + R() * 4, y + (R() - 0.5)); g.stroke(); }
  g.restore();
  for (let k = 0; k < 4; k++) pen(g, full ? arcPts(cx, cy, r + k * 2.4, r + k * 2.4, 0, TAU, 80) : arcPts(cx, cy, r + k * 2.4, r + k * 2.4, Math.PI, TAU, 60), k % 2 ? ink.red : ink.accent, 1.3, R, 0.8);
}

/** Water in rows of small arcs, the reflection of the sun in red down the middle. */
export function scaleSea(g: G, x0: number, y0: number, x1: number, y1: number, ink: Ink, reflect?: { cx: number; w: number }, seed = 4) {
  const R = rng(seed);
  for (let y = y0 + 6, j = 0; y < y1; y += 7 + j * 0.25, j++) {
    const s = 6 + j * 0.35;
    for (let x = x0 - (j % 2) * s; x < x1; x += s * 1.6) {
      const inRef = reflect && Math.abs(x - reflect.cx) < reflect.w * (1 - (y - y0) / (y1 - y0) * 0.3) * (0.7 + R() * 0.3);
      g.strokeStyle = inRef ? (R() < 0.5 ? ink.red : ink.accent) : ink.ink; g.lineWidth = 0.9; g.globalAlpha = inRef ? 0.95 : 0.7;
      g.beginPath(); g.arc(x, y, s * 0.8, Math.PI * 1.1, Math.PI * 1.9); g.stroke();
    }
  }
  g.globalAlpha = 1;
}

/** The fan motif drawn in ballpoint: a half-disc of ribs with a scalloped edge. */
export function fan(g: G, x: number, y: number, r: number, rot: number, color: string, accent?: string, seed = 1) {
  const R = rng(seed);
  g.save(); g.translate(x, y); g.rotate(rot);
  g.fillStyle = 'rgba(255,240,226,0.55)'; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, r, Math.PI, TAU); g.closePath(); g.fill();
  g.strokeStyle = color; g.lineWidth = 0.9;
  const n = 7 + Math.floor(R() * 5);
  for (let i = 0; i <= n; i++) { const a = Math.PI + (i / n) * Math.PI; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * r, Math.sin(a) * r); g.stroke(); }
  g.beginPath(); for (let i = 0; i < n; i++) { const a0 = Math.PI + (i / n) * Math.PI, a1 = Math.PI + ((i + 1) / n) * Math.PI, am = (a0 + a1) / 2; g.moveTo(Math.cos(a0) * r, Math.sin(a0) * r); g.quadraticCurveTo(Math.cos(am) * r * 1.12, Math.sin(am) * r * 1.12, Math.cos(a1) * r, Math.sin(a1) * r); } g.stroke();
  g.beginPath(); g.arc(0, 0, r * 0.55, Math.PI, TAU); g.stroke();
  if (accent) { g.fillStyle = accent; for (let i = 0; i < 3; i++) { const a = Math.PI + (0.25 + i * 0.25) * Math.PI; g.beginPath(); g.arc(Math.cos(a) * r * 0.78, Math.sin(a) * r * 0.78, 1.6, 0, TAU); g.fill(); } }
  g.fillStyle = color; g.beginPath(); g.arc(0, 0, 2, 0, TAU); g.fill();
  g.restore();
}

/** A crescent moon in white chalk. */
export function crescent(g: G, x: number, y: number, r: number, rot: number, color = '#fbf2e2', seed = 2) {
  const R = rng(seed);
  g.save(); g.translate(x, y); g.rotate(rot);
  for (let k = 0; k < 40; k++) { const a = Math.PI * 0.15 + (k / 40) * Math.PI * 0.7, rr = r * (0.92 + R() * 0.08), th = r * 0.22 * Math.sin((k / 40) * Math.PI); g.strokeStyle = color; g.globalAlpha = 0.7 + R() * 0.3; g.lineWidth = th + 1; g.beginPath(); g.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); g.lineTo(Math.cos(a + 0.03) * rr, Math.sin(a + 0.03) * rr); g.stroke(); }
  g.restore(); g.globalAlpha = 1;
}

/** Roof tiles in hatch, a chimney, a lit window — the little house the pictures keep returning to. */
export function roof(g: G, x: number, y: number, w: number, h: number, ink: Ink, seed = 6, flip = 1) {
  const pts: Pt[] = flip > 0 ? [[x, y + h], [x, y], [x + w, y + h]] : [[x + w, y + h], [x + w, y], [x, y + h]];
  shape(g, pts, { fill: ink.ink2, hatch: 'scales', h: { color: ink.light, gap: 9, w: 0.8, angle: flip * -0.6, seed }, line: ink.dark, seed });
  const cx = flip > 0 ? x + w * 0.18 : x + w * 0.82 - 30, cw = 30;
  const ch: Pt[] = [[cx, y + h * 0.25], [cx, y - h * 0.35], [cx + cw, y - h * 0.35], [cx + cw, y + h * 0.25 + 8]];
  shape(g, ch, { fill: ink.dark, hatch: 'stitch', h: { color: ink.light, gap: 6, w: 0.6, seed }, line: ink.dark, seed });
  const wx = flip > 0 ? x + w * 0.3 : x + w * 0.62, wy = y + h * 0.62;
  g.fillStyle = ink.light; g.fillRect(wx, wy, 16, 16); g.strokeStyle = ink.dark; g.lineWidth = 1.4; g.strokeRect(wx, wy, 16, 16); g.beginPath(); g.moveTo(wx + 8, wy); g.lineTo(wx + 8, wy + 16); g.moveTo(wx, wy + 8); g.lineTo(wx + 16, wy + 8); g.stroke();
}

/** Text in a hand-set serif, for wall labels painted into a picture. */
export function label(g: G, s: string, x: number, y: number, size: number, color: string, align: CanvasTextAlign = 'center', dev = false) {
  g.font = dev ? `${size}px "Tiro Devanagari Sanskrit", "Noto Serif Devanagari", serif` : `italic ${size}px "Cormorant Garamond", Georgia, serif`;
  g.fillStyle = color; g.textAlign = align; g.textBaseline = 'middle'; g.fillText(s, x, y);
}
