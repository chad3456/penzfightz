import { HB, mark, pencil, smooth, type Pencil, type Pt } from '../effects/pencil/graphite';

/**
 * A hand, not a font.
 *
 * Every heading on this page is written rather than set. The letters are stored
 * as the *strokes a hand makes*, in the order a hand makes them — one skeletal
 * path per pen-down — and then drawn with the graphite engine, which turns each
 * path into a run of small deposits with tooth, pressure that ramps in and out,
 * two passes that nearly agree, and a little overshoot at the ends.
 *
 * That is the whole reason not to use a typeface that merely looks handwritten.
 * A handwriting font repeats: the same 'e' forty times on a page, pixel for
 * pixel, which the eye notices long before it can say why. Here the skeleton is
 * fixed and everything laid over it is seeded from the letter's position in the
 * line, so no two 'e's on this page are the same 'e', for the same reason no
 * two are the same in a notebook.
 *
 * ── The metrics ─────────────────────────────────────────────────────────
 *
 * Glyphs live in a box one em tall and `w` ems wide. Down is positive.
 *
 *   0.05  ascender
 *   0.40  x-height
 *   0.78  baseline
 *   1.00  descender
 */

export interface Glyph {
  /** Advance width, in ems. */
  w: number;
  /** One entry per pen-down. */
  s: Pt[][];
}

const TOP = 0.05;
const X = 0.40;
const BASE = 0.78;
const DESC = 0.98;

/** An o-shaped bowl, which half the alphabet is made of. */
const bowl = (cx: number, r: number, top = X, bot = BASE, from = 0.2, turns = 1): Pt[] => {
  const pts: Pt[] = [];
  const ry = (bot - top) / 2;
  const cy = (top + bot) / 2;
  const n = Math.max(10, Math.round(18 * turns));
  for (let i = 0; i <= n; i++) {
    const a = (from + (i / n) * turns) * Math.PI * 2;
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * ry]);
  }
  return pts;
};

/** A shoulder: the arch that starts n, m, h, r. */
const shoulder = (x0: number, x1: number): Pt[] => [
  [x0, X + 0.12], [x0 + (x1 - x0) * 0.2, X - 0.02], [x0 + (x1 - x0) * 0.62, X - 0.01],
  [x1, X + 0.14], [x1, BASE],
];

export const GLYPHS: Record<string, Glyph> = {
  ' ': { w: 0.30, s: [] },

  a: { w: 0.54, s: [bowl(0.26, 0.19, X, BASE, 0.05, 1), [[0.45, X], [0.46, BASE]]] },
  b: { w: 0.54, s: [[[0.08, TOP], [0.09, BASE]], bowl(0.31, 0.21, X + 0.02, BASE, 0.42, 0.9)] },
  c: { w: 0.50, s: [bowl(0.28, 0.20, X, BASE, 0.08, 0.72)] },
  d: { w: 0.54, s: [bowl(0.26, 0.19, X, BASE, 0.05, 1), [[0.46, TOP], [0.46, BASE]]] },
  e: { w: 0.50, s: [[[0.08, X + 0.2], [0.47, X + 0.17]], bowl(0.27, 0.20, X, BASE, 0.0, 0.8)] },
  f: { w: 0.36, s: [[[0.30, TOP + 0.02], [0.18, TOP + 0.06], [0.16, X + 0.1], [0.16, BASE]], [[0.02, X + 0.04], [0.34, X + 0.02]]] },
  g: { w: 0.54, s: [bowl(0.26, 0.19, X, BASE, 0.05, 1), [[0.45, X], [0.46, BASE + 0.1], [0.36, DESC], [0.16, DESC - 0.03]]] },
  h: { w: 0.54, s: [[[0.09, TOP], [0.10, BASE]], shoulder(0.10, 0.46)] },
  i: { w: 0.26, s: [[[0.12, X], [0.13, BASE]], [[0.13, X - 0.14], [0.13, X - 0.11]]] },
  j: { w: 0.26, s: [[[0.16, X], [0.17, BASE + 0.12], [0.08, DESC], [-0.04, DESC - 0.03]], [[0.17, X - 0.14], [0.17, X - 0.11]]] },
  k: { w: 0.50, s: [[[0.09, TOP], [0.10, BASE]], [[0.44, X + 0.02], [0.12, X + 0.26]], [[0.22, X + 0.2], [0.45, BASE]]] },
  l: { w: 0.24, s: [[[0.11, TOP], [0.12, BASE - 0.04], [0.20, BASE]]] },
  m: { w: 0.80, s: [[[0.08, X], [0.09, BASE]], shoulder(0.09, 0.40), shoulder(0.40, 0.71)] },
  n: { w: 0.54, s: [[[0.09, X], [0.10, BASE]], shoulder(0.10, 0.46)] },
  o: { w: 0.56, s: [bowl(0.28, 0.21, X, BASE, 0, 1)] },
  p: { w: 0.54, s: [[[0.08, X], [0.09, DESC]], bowl(0.31, 0.21, X + 0.02, BASE, 0.42, 0.9)] },
  q: { w: 0.54, s: [bowl(0.26, 0.19, X, BASE, 0.05, 1), [[0.45, X], [0.46, DESC]]] },
  r: { w: 0.38, s: [[[0.09, X], [0.10, BASE]], [[0.10, X + 0.14], [0.18, X + 0.01], [0.34, X], [0.38, X + 0.06]]] },
  s: { w: 0.44, s: [[[0.36, X + 0.05], [0.18, X - 0.01], [0.08, X + 0.1], [0.22, X + 0.22], [0.34, X + 0.3], [0.30, BASE], [0.08, BASE - 0.02]]] },
  t: { w: 0.34, s: [[[0.16, TOP + 0.14], [0.16, BASE - 0.06], [0.28, BASE]], [[0.02, X + 0.02], [0.32, X]]] },
  u: { w: 0.54, s: [[[0.09, X], [0.09, BASE - 0.1], [0.20, BASE], [0.40, BASE - 0.06], [0.45, X]], [[0.45, X + 0.24], [0.46, BASE]]] },
  v: { w: 0.50, s: [[[0.06, X], [0.25, BASE], [0.45, X]]] },
  w: { w: 0.74, s: [[[0.05, X], [0.20, BASE], [0.34, X + 0.16], [0.49, BASE], [0.66, X]]] },
  x: { w: 0.48, s: [[[0.07, X], [0.42, BASE]], [[0.42, X], [0.07, BASE]]] },
  y: { w: 0.50, s: [[[0.06, X], [0.25, BASE]], [[0.47, X], [0.28, BASE + 0.08], [0.16, DESC], [0.00, DESC - 0.04]]] },
  z: { w: 0.46, s: [[[0.07, X + 0.02], [0.40, X]], [[0.40, X], [0.08, BASE]], [[0.06, BASE], [0.42, BASE - 0.03]]] },

  A: { w: 0.62, s: [[[0.04, BASE], [0.30, TOP], [0.58, BASE]], [[0.14, BASE - 0.22], [0.48, BASE - 0.24]]] },
  B: { w: 0.58, s: [[[0.10, TOP], [0.11, BASE]], [[0.11, TOP], [0.42, TOP + 0.05], [0.44, TOP + 0.2], [0.12, BASE * 0.53]], [[0.12, BASE * 0.53], [0.50, BASE * 0.56], [0.52, BASE - 0.08], [0.12, BASE]]] },
  C: { w: 0.58, s: [[[0.52, TOP + 0.08], [0.24, TOP - 0.01], [0.06, BASE * 0.5], [0.24, BASE + 0.02], [0.52, BASE - 0.1]]] },
  D: { w: 0.60, s: [[[0.10, TOP], [0.11, BASE]], [[0.11, TOP], [0.44, TOP + 0.06], [0.54, BASE * 0.5], [0.42, BASE - 0.02], [0.11, BASE]]] },
  E: { w: 0.52, s: [[[0.46, TOP], [0.10, TOP + 0.01], [0.11, BASE], [0.48, BASE - 0.01]], [[0.11, BASE * 0.52], [0.38, BASE * 0.5]]] },
  F: { w: 0.48, s: [[[0.44, TOP], [0.10, TOP + 0.01], [0.11, BASE]], [[0.11, BASE * 0.5], [0.36, BASE * 0.48]]] },
  G: { w: 0.62, s: [[[0.54, TOP + 0.08], [0.24, TOP - 0.01], [0.06, BASE * 0.5], [0.26, BASE + 0.02], [0.54, BASE - 0.08], [0.54, BASE * 0.6], [0.34, BASE * 0.6]]] },
  H: { w: 0.62, s: [[[0.09, TOP], [0.10, BASE]], [[0.52, TOP], [0.53, BASE]], [[0.10, BASE * 0.52], [0.52, BASE * 0.5]]] },
  I: { w: 0.24, s: [[[0.12, TOP], [0.13, BASE]]] },
  J: { w: 0.40, s: [[[0.32, TOP], [0.33, BASE - 0.06], [0.20, BASE + 0.02], [0.06, BASE - 0.08]]] },
  K: { w: 0.58, s: [[[0.09, TOP], [0.10, BASE]], [[0.50, TOP], [0.11, BASE * 0.56]], [[0.22, BASE * 0.44], [0.52, BASE]]] },
  L: { w: 0.48, s: [[[0.11, TOP], [0.12, BASE], [0.46, BASE - 0.02]]] },
  M: { w: 0.78, s: [[[0.07, BASE], [0.09, TOP], [0.35, BASE * 0.74], [0.62, TOP], [0.68, BASE]]] },
  N: { w: 0.66, s: [[[0.09, BASE], [0.10, TOP], [0.56, BASE], [0.57, TOP]]] },
  O: { w: 0.68, s: [bowl(0.33, 0.27, TOP, BASE, 0, 1)] },
  P: { w: 0.54, s: [[[0.10, TOP], [0.11, BASE]], [[0.11, TOP], [0.44, TOP + 0.06], [0.46, BASE * 0.44], [0.12, BASE * 0.56]]] },
  Q: { w: 0.68, s: [bowl(0.33, 0.27, TOP, BASE, 0, 1), [[0.40, BASE - 0.16], [0.60, BASE + 0.08]]] },
  R: { w: 0.58, s: [[[0.10, TOP], [0.11, BASE]], [[0.11, TOP], [0.44, TOP + 0.06], [0.46, BASE * 0.44], [0.12, BASE * 0.56]], [[0.26, BASE * 0.56], [0.52, BASE]]] },
  S: { w: 0.52, s: [[[0.46, TOP + 0.06], [0.20, TOP], [0.10, BASE * 0.36], [0.30, BASE * 0.56], [0.46, BASE * 0.74], [0.38, BASE + 0.02], [0.08, BASE - 0.06]]] },
  T: { w: 0.52, s: [[[0.02, TOP + 0.01], [0.50, TOP]], [[0.26, TOP], [0.27, BASE]]] },
  U: { w: 0.62, s: [[[0.09, TOP], [0.10, BASE - 0.1], [0.28, BASE + 0.01], [0.50, BASE - 0.1], [0.51, TOP]]] },
  V: { w: 0.62, s: [[[0.05, TOP], [0.30, BASE], [0.57, TOP]]] },
  W: { w: 0.88, s: [[[0.04, TOP], [0.22, BASE], [0.42, TOP + 0.2], [0.62, BASE], [0.82, TOP]]] },
  X: { w: 0.58, s: [[[0.07, TOP], [0.51, BASE]], [[0.51, TOP], [0.07, BASE]]] },
  Y: { w: 0.58, s: [[[0.06, TOP], [0.29, BASE * 0.6]], [[0.52, TOP], [0.29, BASE * 0.6], [0.29, BASE]]] },
  Z: { w: 0.54, s: [[[0.06, TOP + 0.01], [0.48, TOP]], [[0.48, TOP], [0.07, BASE]], [[0.05, BASE], [0.50, BASE - 0.02]]] },

  0: { w: 0.54, s: [bowl(0.27, 0.20, TOP, BASE, 0, 1)] },
  1: { w: 0.34, s: [[[0.08, TOP + 0.12], [0.20, TOP], [0.21, BASE]]] },
  2: { w: 0.50, s: [[[0.08, TOP + 0.1], [0.26, TOP - 0.01], [0.42, TOP + 0.14], [0.08, BASE], [0.44, BASE - 0.02]]] },
  3: { w: 0.50, s: [[[0.08, TOP + 0.06], [0.36, TOP], [0.22, BASE * 0.54], [0.42, BASE * 0.62], [0.34, BASE + 0.01], [0.08, BASE - 0.06]]] },
  4: { w: 0.52, s: [[[0.36, TOP], [0.06, BASE * 0.66], [0.48, BASE * 0.64]], [[0.36, TOP + 0.1], [0.37, BASE]]] },
  5: { w: 0.50, s: [[[0.42, TOP], [0.12, TOP + 0.02], [0.10, BASE * 0.52], [0.34, BASE * 0.5], [0.44, BASE * 0.76], [0.28, BASE + 0.01], [0.08, BASE - 0.06]]] },
  6: { w: 0.52, s: [[[0.40, TOP + 0.03], [0.14, TOP + 0.24], [0.10, BASE - 0.06], [0.30, BASE + 0.01], [0.44, BASE * 0.78], [0.24, BASE * 0.64], [0.11, BASE * 0.78]]] },
  7: { w: 0.48, s: [[[0.06, TOP + 0.01], [0.44, TOP], [0.20, BASE]]] },
  8: { w: 0.52, s: [bowl(0.27, 0.16, TOP, BASE * 0.6, 0, 1), bowl(0.27, 0.20, BASE * 0.56, BASE, 0, 1)] },
  9: { w: 0.52, s: [bowl(0.28, 0.17, TOP, BASE * 0.56, 0, 1), [[0.45, BASE * 0.4], [0.42, BASE - 0.06], [0.16, BASE - 0.01]]] },

  '.': { w: 0.24, s: [[[0.11, BASE - 0.02], [0.12, BASE]]] },
  ',': { w: 0.24, s: [[[0.13, BASE - 0.02], [0.08, BASE + 0.1]]] },
  ':': { w: 0.22, s: [[[0.11, X + 0.12], [0.11, X + 0.15]], [[0.11, BASE - 0.02], [0.11, BASE]]] },
  ';': { w: 0.22, s: [[[0.11, X + 0.12], [0.11, X + 0.15]], [[0.13, BASE - 0.02], [0.08, BASE + 0.1]]] },
  "'": { w: 0.18, s: [[[0.09, TOP], [0.07, TOP + 0.14]]] },
  '’': { w: 0.18, s: [[[0.09, TOP], [0.07, TOP + 0.14]]] },
  '!': { w: 0.24, s: [[[0.12, TOP], [0.10, BASE - 0.14]], [[0.09, BASE - 0.02], [0.09, BASE]]] },
  '?': { w: 0.46, s: [[[0.07, TOP + 0.1], [0.24, TOP - 0.01], [0.38, TOP + 0.14], [0.22, BASE * 0.6], [0.21, BASE - 0.14]], [[0.20, BASE - 0.02], [0.20, BASE]]] },
  '-': { w: 0.36, s: [[[0.05, BASE * 0.66], [0.31, BASE * 0.64]]] },
  '–': { w: 0.48, s: [[[0.04, BASE * 0.66], [0.44, BASE * 0.64]]] },
  '—': { w: 0.62, s: [[[0.03, BASE * 0.66], [0.59, BASE * 0.64]]] },
  '(': { w: 0.26, s: [[[0.20, TOP], [0.08, BASE * 0.54], [0.20, BASE + 0.06]]] },
  ')': { w: 0.26, s: [[[0.06, TOP], [0.18, BASE * 0.54], [0.06, BASE + 0.06]]] },
  '&': { w: 0.66, s: [[[0.56, BASE], [0.18, TOP + 0.06], [0.34, TOP + 0.02], [0.36, TOP + 0.22], [0.08, BASE * 0.7], [0.18, BASE + 0.02], [0.44, BASE * 0.72], [0.58, BASE * 0.6]]] },
  '/': { w: 0.38, s: [[[0.04, BASE], [0.32, TOP]]] },
  '·': { w: 0.26, s: [[[0.12, BASE * 0.6], [0.13, BASE * 0.6 + 0.02]]] },
};

/** How wide a string will be, in ems. */
export function measure(text: string, tracking = 0.02): number {
  let w = 0;
  for (const ch of text) w += (GLYPHS[ch] ?? GLYPHS[ch.toLowerCase()] ?? GLYPHS[' ']!).w + tracking;
  return w;
}

export interface WriteOptions {
  /** Height of one em, in pixels. */
  size: number;
  /** Extra space between letters, in ems. */
  tracking?: number;
  /** Slope, in radians. A little is handwriting; a lot is a gimmick. */
  slant?: number;
  /** How much the baseline wanders, in ems. */
  waver?: number;
  pencil?: Partial<Pencil>;
  /** Changes every letter's jitter. Same seed, same handwriting. */
  seed?: number;
  align?: 'left' | 'center' | 'right';
}

/**
 * Write a line, and say how wide it was.
 *
 * The baseline wanders and every letter sits a shade off its own line, because
 * the thing that gives handwriting away as handwriting is not the shapes — it
 * is that the shapes do not line up.
 */
export function write(
  g: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  o: WriteOptions,
): number {
  const em = o.size;
  const tracking = o.tracking ?? 0.02;
  const slant = o.slant ?? 0.06;
  const waver = o.waver ?? 0.012;
  const seed = o.seed ?? 1;
  /*
    The nib has a floor, and the floor matters more than the fraction. A nib
    under about a pixel is mostly antialiasing, so small hand lettering came out
    as a grey suggestion of itself while the same settings at heading size
    looked right — the hand was not too light, the mark was too thin to survive.
  */
  const p = pencil(HB, { size: Math.max(1.15, em * 0.042), passes: 2, ...o.pencil });

  const total = measure(text, tracking) * em;
  let pen = o.align === 'center' ? x - total / 2 : o.align === 'right' ? x - total : x;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    const gl = GLYPHS[ch] ?? GLYPHS[ch.toLowerCase()] ?? GLYPHS[' ']!;
    const s = seed * 131 + i * 17;
    // Each letter gets its own small sins: a little high or low, a little
    // wider or tighter, a degree more or less slope.
    const dy = (Math.sin(s * 0.7) + Math.sin(s * 1.9) * 0.5) * waver * em;
    const sx = 1 + Math.sin(s * 2.3) * 0.02;
    const sl = slant + Math.sin(s * 3.1) * 0.014;
    for (const [k, stroke] of gl.s.entries()) {
      const path: Pt[] = stroke.map(([ux, uy]) => {
        const py = y + (uy - 0.78) * em + dy;
        const px = pen + ux * em * sx + (0.78 - uy) * em * sl;
        return [px, py] as Pt;
      });
      mark(g, path.length > 2 ? smooth(path, 5) : path, p, s + k * 7);
    }
    pen += (gl.w + tracking) * em * sx;
  }
  return total;
}

/** Write a paragraph into a column, and say how tall it came out. */
export function writeBlock(
  g: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  width: number,
  o: WriteOptions & { leading?: number },
): number {
  const em = o.size;
  const lead = (o.leading ?? 1.34) * em;
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (measure(next, o.tracking ?? 0.02) * em > width && line) {
      lines.push(line);
      line = w;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  for (const [i, l] of lines.entries()) {
    write(g, l, x, y + i * lead, { ...o, seed: (o.seed ?? 1) + i * 29 });
  }
  return lines.length * lead;
}
