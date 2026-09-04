import type { Pad, Pt } from '../flat/pad';

/**
 * A hand, not a font.
 *
 * The ask was handwritten dialogue, and the honest reading of that is that the
 * letters have to be *written* — drawn as the movement of a nib across paper —
 * rather than set in a face somebody chose that happens to look casual. So this
 * is a cursive alphabet stored as skeletons, joined up word by word, and inked
 * with a pointed nib whose width comes from the direction it is travelling.
 *
 * Three things make the difference between this and a script font:
 *
 * 1. **Downstrokes are heavy and upstrokes are hairlines.** A pointed nib
 *    splays under pressure, and pressure happens on the pull. Everything else
 *    here is detail; this is the thing your eye reads as *pen*.
 * 2. **Letters join.** The exit of one glyph and the entry of the next are
 *    bridged by a stroke, so a word is one gesture with lifts in it rather than
 *    a row of stamps.
 * 3. **Nothing repeats exactly.** Every glyph is jittered from the seed, the
 *    baseline drifts, the slant wanders, and the ink runs thin near the end of
 *    a dip.
 */

// ------------------------------------------------------------ the alphabet

/**
 * Glyph skeletons, in hundredths of an x-height.
 *
 * The baseline is y = 0 and the x-height is y = 100; ascenders reach about 180
 * and descenders about −60. A vertical bar separates pen lifts. The first point
 * of the first stroke is where the pen arrives from the previous letter and the
 * last point of the last stroke is where it leaves for the next, which is why
 * most of them begin and end at around a third of the x-height: that is where a
 * join lives.
 */
const LOWER: Record<string, string> = {
  a: '0,35 44,92 22,96 8,58 16,18 38,6 50,24 50,90 50,10 68,38',
  b: '0,35 16,176 30,182 26,116 20,16 40,2 58,20 56,52 34,64 22,56 62,72',
  c: '0,35 40,90 20,96 8,58 14,18 36,4 52,18 46,30 | 46,30 66,40',
  d: '0,35 44,92 22,96 8,58 16,18 38,6 50,24 54,96 60,176 56,100 54,10 72,38',
  e: '0,30 12,44 40,56 44,80 30,94 12,80 10,40 24,8 46,6 68,34',
  f: '0,35 14,120 22,180 34,182 30,120 20,10 12,-46 -2,-56 -6,-34 10,-14 34,10 58,34 | 0,72 44,80',
  g: '0,35 44,92 22,96 8,58 16,18 38,6 50,24 50,90 50,4 44,-42 26,-56 10,-46 18,-30 46,-16 70,20',
  h: '0,35 14,176 28,182 24,116 18,10 | 22,60 34,90 48,96 54,60 52,10 70,38',
  i: '0,35 20,88 26,10 46,38 | 8,126 16,134',
  j: '0,35 22,88 26,10 20,-40 4,-54 -6,-40 6,-26 34,-8 56,22 | 10,126 18,134',
  k: '0,35 14,176 28,182 24,116 18,10 | 20,50 52,86 | 26,44 34,42 30,26 52,4 70,34',
  l: '0,35 16,176 30,182 26,116 22,10 44,38',
  m: '0,35 14,88 20,10 | 18,58 30,90 44,94 46,10 | 44,58 56,90 70,94 74,10 92,38',
  n: '0,35 14,88 20,10 | 18,58 32,90 46,94 50,10 68,38',
  o: '0,35 34,92 14,86 6,50 14,16 36,4 52,20 50,60 36,86 26,92 44,88 62,96',
  p: '0,35 16,88 20,10 14,-44 | 20,40 30,84 48,90 58,60 52,26 34,14 20,26 | 42,16 66,36',
  q: '0,35 44,92 22,96 8,58 16,18 38,6 50,24 50,90 50,10 42,-40 62,-24 76,4',
  // r reads as n the moment its arm comes back down, and the join is what
  // brings it down: leaving from a third of the x-height puts the descent
  // outside the letter, where it belongs. So r exits high, and the sweep down
  // to whatever follows is part of the join.
  // r is the one letter that has to be built backwards from the confusion it
  // causes. Stem first and it is an n: up, down, over. Shoulder first — the
  // little flag at the top, *then* the stem down — and it can only be an r.
  // It is also entered high, so the join arrives at the shoulder instead of
  // adding a second upstroke in front of the letter's own.
  r: '0,72 18,96 34,88 40,104 62,98 56,52 58,10 78,36',
  s: '0,35 34,92 14,88 8,64 30,44 40,24 32,4 12,10 | 22,8 54,34',
  t: '0,35 17,142 21,150 25,142 24,14 44,6 58,28 | 2,92 48,98',
  u: '0,35 16,90 20,12 34,4 44,60 46,90 | 46,90 48,10 66,38',
  v: '0,35 16,90 22,14 38,60 48,92 40,66 62,86',
  w: '0,35 14,90 20,14 34,58 42,90 46,58 56,14 70,58 78,92 70,66 92,86',
  x: '0,35 14,84 46,10 62,34 | 8,14 20,6 52,84 62,74',
  y: '0,35 16,90 20,12 34,4 44,60 48,92 | 48,92 46,10 38,-42 20,-56 6,-44 16,-28 44,-14 68,18',
  z: '0,35 12,84 40,88 14,10 44,4 | 32,10 30,-40 12,-52 2,-38 18,-24 46,-8 68,22',
};

/**
 * Capitals.
 *
 * Written in a rounder, more open hand than the lowercase, because that is how
 * anybody writes them — the capital is where the writer shows off. They do not
 * join to what follows, so their exit is set clear of the letter.
 */
const UPPER: Record<string, string> = {
  A: '0,4 44,168 88,4 | 18,58 72,58',
  B: '10,4 18,168 60,164 74,128 52,92 18,88 | 18,88 66,80 82,40 56,6 12,6',
  C: '84,140 60,168 26,150 10,90 20,26 52,4 84,22',
  D: '10,4 18,168 56,162 84,110 78,44 44,6 12,6',
  E: '84,146 46,168 16,132 22,88 58,86 | 22,88 14,34 44,6 82,20',
  F: '86,150 40,166 26,96 24,4 | 12,96 62,100',
  G: '86,140 58,168 24,146 10,86 22,24 56,4 82,28 76,72 44,72',
  H: '4,4 16,168 | 84,4 74,168 | 12,86 78,80',
  I: '30,4 52,168 | 22,168 76,164 | 12,6 66,2',
  J: '34,168 84,166 62,150 46,30 26,-30 4,-36 -2,-8 26,4',
  K: '4,4 16,168 | 84,166 20,80 | 34,92 82,4',
  L: '86,150 60,168 34,120 20,4 | 20,4 88,16',
  M: '0,4 20,168 46,40 74,166 92,4',
  N: '0,4 20,168 76,20 92,164',
  O: '78,130 50,168 18,142 8,80 20,24 52,2 80,30 84,92 60,140',
  P: '10,4 20,168 64,160 82,116 56,82 20,84',
  Q: '78,130 50,168 18,142 8,80 20,24 52,2 80,30 84,92 60,140 | 54,44 92,-24',
  R: '10,4 20,168 64,160 82,120 52,86 20,88 | 46,86 90,4',
  S: '86,140 54,168 26,148 34,110 68,78 78,38 50,6 16,22',
  T: '10,158 90,164 | 48,162 40,4',
  U: '6,168 14,44 40,4 68,22 76,164 | 76,164 84,6',
  V: '4,168 46,4 90,168',
  W: '0,168 20,4 46,120 70,4 92,166',
  X: '6,166 84,4 | 8,6 86,164',
  Y: '4,168 46,84 88,166 | 46,84 42,4',
  Z: '10,158 82,162 12,8 88,14',
};

/** Punctuation, and the em dash, which this book cannot do without. */
const MARKS: Record<string, string> = {
  '.': '0,10 6,2 12,10 4,16',
  ',': '4,14 8,2 2,-26',
  ';': '4,60 10,52 14,60 6,66 | 6,14 10,2 4,-24',
  ':': '4,60 10,52 14,60 6,66 | 4,12 10,4 14,12 6,18',
  '!': '10,168 4,26 | 4,12 10,4 14,12 6,18',
  '?': '2,140 20,168 40,152 34,116 14,86 12,44 | 8,12 14,4 18,12 10,18',
  "'": '10,168 4,120',
  '’': '10,168 4,120',
  '“': '6,168 0,124 | 24,168 18,124',
  '”': '0,124 6,168 | 18,124 24,168',
  '"': '4,168 0,124 | 20,168 16,124',
  '-': '0,54 34,58',
  '—': '0,56 76,60',
  '(': '26,170 6,90 26,0',
  ')': '2,170 22,90 2,0',
};

export interface Glyph {
  strokes: Pt[][];
  /** Where the pen leaves for the next letter, in glyph units. */
  out: Pt;
  /** Where it arrives from the previous one. */
  in: Pt;
  adv: number;
  /** Capitals and marks are not joined into. */
  joins: boolean;
}

function parse(src: string, joins: boolean, pad = 0.14): Glyph {
  const strokes = src.split('|').map((s) =>
    s
      .trim()
      .split(/\s+/)
      .map((p) => {
        const [x, y] = p.split(',').map(Number);
        return [x / 100, y / 100] as Pt;
      }),
  );
  let max = 0;
  for (const s of strokes) for (const p of s) max = Math.max(max, p[0]);
  const first = strokes[0][0];
  const last = strokes[strokes.length - 1][strokes[strokes.length - 1].length - 1];
  return { strokes, in: first, out: last, adv: max + pad, joins };
}

const GLYPHS: Record<string, Glyph> = {};
for (const [c, s] of Object.entries(LOWER)) GLYPHS[c] = parse(s, true);
for (const [c, s] of Object.entries(UPPER)) GLYPHS[c] = parse(s, false, 0.2);
for (const [c, s] of Object.entries(MARKS)) GLYPHS[c] = parse(s, false, 0.12);

// ------------------------------------------------------------- the writer

/**
 * A particular person's hand.
 *
 * Two writers appear in this deck and they have to be told apart at a glance:
 * a small, fast, forward-leaning hand and a rounder, slower, more upright one.
 * Everything below is what actually differs between two people's writing.
 */
export interface Hand {
  /** Radians. Positive leans forward, which most hands do. */
  slant: number;
  /** Nib width, as a fraction of the x-height. */
  weight: number;
  /** How wide the letters sit. */
  width: number;
  /** How much thinner an upstroke is than a downstroke. 0.5 is a soft nib. */
  contrast: number;
  /** Baseline drift, in x-heights. */
  drift: number;
  /** Extra space between letters. */
  tracking: number;
  /** How much every point wobbles. */
  shake: number;
  ink: string;
}

export const NASTENKA: Hand = {
  slant: 0.19,
  weight: 0.092,
  width: 0.95,
  contrast: 0.24,
  drift: 0.055,
  tracking: 0.012,
  shake: 0.016,
  ink: '#3b3226',
};

export const DREAMER: Hand = {
  slant: 0.3,
  weight: 0.078,
  width: 0.86,
  contrast: 0.18,
  drift: 0.085,
  tracking: -0.004,
  shake: 0.024,
  ink: '#2f3340',
};

/**
 * The nib.
 *
 * Rather than stroking a path with a round cap of constant width, the outline
 * of the mark is built by offsetting the skeleton left and right by half its
 * width at that point, and the resulting polygon is filled. That is the only
 * way to get a stroke that swells: a pointed nib splays under pressure and
 * pressure comes on the pull, so width is a function of *direction* — heavy
 * going down, a hairline going up.
 *
 * Both ends taper to nothing, because a pen arrives and leaves the paper rather
 * than starting at full width.
 */
function nib(g: CanvasRenderingContext2D, path: Pt[], base: number, contrast: number, colour: string, alpha = 1) {
  if (path.length < 2) return;
  const left: Pt[] = [];
  const right: Pt[] = [];
  const n = path.length;
  for (let i = 0; i < n; i++) {
    const a = path[Math.max(0, i - 1)];
    const b = path[Math.min(n - 1, i + 1)];
    let dx = b[0] - a[0];
    let dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    dx /= len;
    dy /= len;
    // Screen y runs downward, so a positive dy is a downstroke, and a
    // downstroke is where the pressure is.
    const pull = Math.max(0, dy);
    const t = i / (n - 1);
    // The taper. Sharpened at both ends over the first and last eighth.
    const end = Math.min(1, Math.min(t, 1 - t) * 8 + 0.14);
    const w = (base * (contrast + (1 - contrast) * Math.pow(pull, 0.55)) * end) / 2;
    left.push([path[i][0] - dy * w, path[i][1] + dx * w]);
    right.push([path[i][0] + dy * w, path[i][1] - dx * w]);
  }
  g.beginPath();
  g.moveTo(left[0][0], left[0][1]);
  for (let i = 1; i < left.length; i++) g.lineTo(left[i][0], left[i][1]);
  for (let i = right.length - 1; i >= 0; i--) g.lineTo(right[i][0], right[i][1]);
  g.closePath();
  g.globalAlpha = alpha;
  g.fillStyle = colour;
  g.fill();
  g.globalAlpha = 1;
}

/** Smooth a skeleton into something a pen could have travelled along. */
function smooth(path: Pt[], per = 5): Pt[] {
  if (path.length < 3) {
    const out: Pt[] = [];
    for (let i = 0; i + 1 < path.length; i++) {
      for (let k = 0; k < per; k++) {
        const t = k / per;
        out.push([path[i][0] + (path[i + 1][0] - path[i][0]) * t, path[i][1] + (path[i + 1][1] - path[i][1]) * t]);
      }
    }
    out.push(path[path.length - 1]);
    return out;
  }
  const out: Pt[] = [path[0]];
  for (let i = 0; i + 1 < path.length; i++) {
    const p = path[i];
    const q = path[i + 1];
    const mid: Pt = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
    const prev = out[out.length - 1];
    for (let k = 1; k <= per; k++) {
      const t = k / per;
      const u = 1 - t;
      out.push([
        u * u * prev[0] + 2 * u * t * p[0] + t * t * mid[0],
        u * u * prev[1] + 2 * u * t * p[1] + t * t * mid[1],
      ]);
    }
  }
  out.push(path[path.length - 1]);
  return out;
}

export interface WriteOptions {
  /** Line height as a fraction of the pad's width. */
  size?: number;
  /** Wrap at this many pad units. */
  width?: number;
  align?: 'left' | 'centre';
  seed?: number;
  alpha?: number;
  /** Stop after this many lines and return what fitted. */
  maxLines?: number;
  /**
   * Work out where the writing would end without inking any of it.
   *
   * The caller fits a caption by trying sizes until one fits, and a trial that
   * *draws* the whole line at zero opacity costs exactly as much as a real one
   * — which made every card seven times more expensive than it needed to be.
   */
  dry?: boolean;
}

interface Word {
  text: string;
  w: number;
}

/** How wide a word is, in x-heights. */
function measure(text: string, hand: Hand): number {
  let x = 0;
  for (const c of text) {
    const gl = GLYPHS[c] ?? GLYPHS[c.toLowerCase()];
    if (!gl) {
      x += 0.4;
      continue;
    }
    x += gl.adv * hand.width + hand.tracking;
  }
  return x;
}

/**
 * Write a line of text on the pad and give back how far down the page it got.
 *
 * The layout is ordinary — greedy wrapping, optional centring — and everything
 * interesting happens a level down, in the joining and the nib.
 */
export function write(pad: Pad, text: string, at: Pt, hand: Hand, o: WriteOptions = {}) {
  const g = pad.g;
  const em = (o.size ?? 0.055) * pad.w;
  const maxW = (o.width ?? 0.8) * pad.w;
  const seed = o.seed ?? 1;
  let a = (seed * 2654435761) >>> 0;
  const rand = () => {
    a = (a * 1664525 + 1013904223) >>> 0;
    return a / 4294967296;
  };

  const words: Word[] = text
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => ({ text: w, w: measure(w, hand) * em }));
  const space = 0.5 * em;

  const lines: Word[][] = [];
  let line: Word[] = [];
  let used = 0;
  for (const w of words) {
    const add = line.length ? space + w.w : w.w;
    if (used + add > maxW && line.length) {
      lines.push(line);
      line = [w];
      used = w.w;
    } else {
      line.push(w);
      used += add;
    }
  }
  if (line.length) lines.push(line);
  const shown = o.maxLines ? lines.slice(0, o.maxLines) : lines;

  const lead = em * 2.52;
  let y = at[1] * pad.h;
  if (o.dry) return (y + lead * (shown.length - 1)) / pad.h;

  for (const ln of shown) {
    const wide = ln.reduce((s, w, i) => s + w.w + (i ? space : 0), 0);
    let x = at[0] * pad.w + (o.align === 'centre' ? -wide / 2 : 0);
    // A written line does not sit on a ruled baseline. It sags in the middle
    // and picks up again, and the amount is personal.
    const sag = (rand() - 0.5) * hand.drift * em * 2;
    for (const w of ln) {
      x = word(g, w.text, x, y, sag, em, hand, rand, o.alpha ?? 1, wide, at[0] * pad.w);
      x += space * (0.85 + rand() * 0.4);
    }
    y += lead;
  }
  return y / pad.h;
}

/** One word: the letters, and the joins between them. */
function word(
  g: CanvasRenderingContext2D,
  text: string,
  x0: number,
  y0: number,
  sag: number,
  em: number,
  hand: Hand,
  rand: () => number,
  alpha: number,
  wide: number,
  left: number,
): number {
  let x = x0;
  let prevExit: Pt | null = null;
  let prevJoins = false;
  const base = em * hand.weight;
  const salt = rand() * 100;

  for (const c of text) {
    const gl = GLYPHS[c] ?? GLYPHS[c.toLowerCase()];
    if (!gl) {
      x += 0.4 * em;
      prevExit = null;
      prevJoins = false;
      continue;
    }
    // Where this letter sits: the running baseline plus the sag, which peaks in
    // the middle of the line the way a hand tires across it.
    const t = wide > 0 ? (x - left) / wide : 0;
    const dip = Math.sin(t * Math.PI) * sag;
    const lean = hand.slant + (rand() - 0.5) * 0.06;
    const jx = (rand() - 0.5) * hand.shake * em;
    const jy = (rand() - 0.5) * hand.shake * em * 0.7;
    const bx = x;
    // Deterministic per point, not per call: the same skeleton point has to
    // land in the same place whether it is asked for by a stroke or by a join.
    const wob = (p: Pt, k: number) => {
      const h = Math.sin(p[0] * 127.1 + p[1] * 311.7 + salt + k * 74.7) * 43758.5453;
      return (h - Math.floor(h) - 0.5) * hand.shake * em * 0.8;
    };
    const put = (p: Pt): Pt => {
      const px = p[0] * hand.width * em;
      const py = p[1] * em;
      // The slant is a shear about the baseline, which is what a slant is.
      return [bx + px + py * Math.sin(lean) + jx + wob(p, 0), y0 + dip - py + jy + wob(p, 1)];
    };

    const entry = put(gl.in);
    if (prevExit && prevJoins && gl.joins) {
      // The join sags towards the baseline between the two letters, because the
      // pen is being carried rather than driven.
      const mid: Pt = [(prevExit[0] + entry[0]) / 2, Math.max(prevExit[1], entry[1]) + em * 0.08];
      nib(g, smooth([prevExit, mid, entry], 7), base * 0.8, hand.contrast, hand.ink, alpha);
    }
    for (const s of gl.strokes) nib(g, smooth(s.map(put), 5), base, hand.contrast, hand.ink, alpha);

    prevExit = put(gl.out);
    prevJoins = gl.joins;
    x += gl.adv * hand.width * em + hand.tracking * em;
  }
  return x;
}
