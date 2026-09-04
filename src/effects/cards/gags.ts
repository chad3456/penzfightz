import { Pad, type Pt } from '../flat/pad';
import { crownAt, mouthAt, pawAt, reach, type Cat } from './cat';
import { fade, rng, stroke, type Ink } from './ink';
import { acePip, pegged, pip, type Suit } from './pip';
import * as prop from './props';
import type { Rank } from './numeral';

/**
 * Fifty-two jokes.
 *
 * The reference does one thing and does it perfectly: **the pips are objects**.
 * They are not a count printed on a card, they are five diamonds that somebody
 * has washed and pegged out to dry, and a cat is helping. Every card here obeys
 * that rule, which means every card has to solve the same puzzle — find a
 * reason for exactly this many of exactly this shape to be somewhere a cat can
 * interfere with them.
 *
 * The pip count is not decoration and it is not approximate. `put` is the only
 * way a pip reaches the card and it counts as it goes, and `bakeCard` refuses
 * to finish a card whose count does not match its rank. A five with four
 * diamonds on it is not a stylistic choice, it is a misprint.
 *
 * The staging primitives below are the vocabulary — a line, a shelf, a stack, a
 * scatter — and each card is three or four lines of that vocabulary plus a cat
 * doing something specific. That is how a real illustrated deck is made: a
 * small number of set-ups, and the joke is in the casting.
 */

export const CARD_ASPECT = 0.7;
export const H = 1 / CARD_ASPECT;

export interface Scene {
  pad: Pad;
  ink: Ink;
  suit: Suit;
  rank: Rank;
  seed: number;
  /** The only way a pip gets onto a card. Counts as it goes. */
  put: (at: Pt, size: number, o?: { rot?: number; shadow?: number; hollow?: boolean; alpha?: number }) => void;
  /**
   * Count a pip that was drawn by something other than `put` — the big
   * ornamental one on an ace, or the ones a peg draws. It exists so the count
   * stays the truth rather than a convention nobody can check.
   */
  count: (n: number) => void;
  /** A cat, drawn now. Returns it so the gag can ask where its paws ended up. */
  cat: (c: Cat, weight?: number) => Cat;
}

/** The picture area, inside the indices. */
export const AREA = { x0: 0.12, x1: 0.88, y0: 0.185, y1: H - 0.185 };

const PIP = 0.115;

/**
 * How big a pip can be and still fit.
 *
 * Every staging primitive takes a *maximum* size and works out what will
 * actually go in the space it has been given. Sizing pips by hand works until
 * somebody changes the pip size once, globally, and then a ten has six pips
 * on top of each other and a two looks like it lost something. Fitting is the
 * only version of this that survives being edited.
 */
function fit(max: number, span: number, n: number, gap = 0.9) {
  if (n <= 1) return max;
  return Math.min(max, (span / (n - 1)) * gap);
}

// ------------------------------------------------------------- staging kit

/** Pegged along a slack line. */
function onLine(s: Scene, n: number, y: number, x0: number, x1: number, max = PIP): Pt[] {
  const size = Math.min(max, ((x1 - x0) / n) * 0.88);
  const at = prop.washLine(s.pad, s.ink, [x0, y], [x1, y + 0.012], 0.05);
  const out: Pt[] = [];
  const r = rng(s.seed * 31 + n);
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    const p = at(t);
    const sway = (r() - 0.5) * 0.3;
    pegged(s.pad, s.ink, s.suit, p, size, sway);
    s.count(1);
    out.push([p[0] + Math.sin(sway) * size * 0.42, p[1] + size * 0.42]);
  }
  return out;
}

/** Standing in a row on a surface. */
function onShelf(s: Scene, n: number, y: number, x0: number, x1: number, max = PIP): Pt[] {
  const size = fit(max, x1 - x0, n, 0.94);
  const out: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0.5 : i / (n - 1);
    const x = x0 + (x1 - x0) * t;
    const p: Pt = [x, y - size * 0.5];
    s.put(p, size, { shadow: 0.014 });
    out.push(p);
  }
  return out;
}

/** A stack, each one a little off the one below. */
function stackUp(s: Scene, n: number, at: Pt, size = PIP): Pt[] {
  const out: Pt[] = [];
  const r = rng(s.seed * 17 + 3);
  for (let i = 0; i < n; i++) {
    const p: Pt = [at[0] + (r() - 0.5) * size * 0.3, at[1] - size * 0.66 * i - size * 0.5];
    s.put(p, size, { rot: (r() - 0.5) * 0.24 });
    out.push(p);
  }
  return out;
}

/** Loose on the floor, no two the same way up. */
function scatter(s: Scene, n: number, box: [number, number, number, number], max = PIP): Pt[] {
  const out: Pt[] = [];
  const r = rng(s.seed * 71 + n * 13);
  const cols = Math.ceil(Math.sqrt(n * 1.6));
  const size = Math.min(max, ((box[2] - box[0]) / cols) * 0.86);
  for (let i = 0; i < n; i++) {
    // Jittered grid rather than pure random: pure random clumps, and a clump
    // of pips reads as a mistake rather than as a scatter.
    const cx = i % cols;
    const cy = Math.floor(i / cols);
    const rows = Math.ceil(n / cols);
    const x = box[0] + ((cx + 0.5) / cols) * (box[2] - box[0]) + (r() - 0.5) * size * 0.5;
    const y = box[1] + ((cy + 0.5) / Math.max(1, rows)) * (box[3] - box[1]) + (r() - 0.5) * size * 0.4;
    s.put([x, y], size, { rot: (r() - 0.5) * 1.4, shadow: 0.01 });
    out.push([x, y]);
  }
  return out;
}

/** A tidy grid, the way a card actually lays its pips out. */
function grid(s: Scene, n: number, cols: number, box: [number, number, number, number], max = PIP): Pt[] {
  const rows = Math.ceil(n / cols);
  const size = Math.min(max, ((box[2] - box[0]) / cols) * 0.88, ((box[3] - box[1]) / rows) * 0.88);
  const out: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const cx = i % cols;
    const cy = Math.floor(i / cols);
    const wide = Math.min(cols, n - cy * cols);
    const x = box[0] + ((cx + 0.5) / wide) * (box[2] - box[0]);
    const y = box[1] + ((cy + 0.5) / rows) * (box[3] - box[1]);
    s.put([x, y], size, { rot: cy >= rows / 2 ? Math.PI : 0 });
    out.push([x, y]);
  }
  return out;
}

/** Stuck in the ground at an angle, like spades in a garden. */
function planted(s: Scene, n: number, y: number, x0: number, x1: number, max = PIP): Pt[] {
  const size = fit(max, x1 - x0, n, 0.9);
  const out: Pt[] = [];
  const r = rng(s.seed * 41 + 9);
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0.5 : i / (n - 1);
    const x = x0 + (x1 - x0) * t;
    const tilt = (r() - 0.5) * 0.5;
    const p: Pt = [x, y - size * 0.36];
    s.put(p, size, { rot: tilt });
    out.push(p);
  }
  // The ground they are in.
  stroke(s.pad, [[x0 - 0.05, y], [x1 + 0.05, y + 0.006]], s.ink.hex, { width: 0.005, taper: 0.4, wobble: 0.002 });
  return out;
}

/** In and around an open box. */
function inBox(s: Scene, n: number, at: Pt, w: number, max = PIP): Pt[] {
  const out: Pt[] = [];
  const r = rng(s.seed * 53 + 5);
  const size = Math.min(max, (w * 0.62 / Math.max(1, n - 1)) * 1.5, w * 0.42);
  prop.box(s.pad, s.ink, at, w, w * 0.72, s.seed);
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0.5 : i / (n - 1);
    const x = at[0] - w * 0.3 + w * 0.6 * t + (r() - 0.5) * 0.012;
    const p: Pt = [x, at[1] - w * 0.72 - size * 0.16 + (r() - 0.5) * 0.02];
    s.put(p, size, { rot: (r() - 0.5) * 0.6 });
    out.push(p);
  }
  return out;
}

/** An arc, like a hand of cards laid out. */
function fanOut(s: Scene, n: number, at: Pt, rad: number, max = PIP): Pt[] {
  const out: Pt[] = [];
  // The arc the pips sit on is what they have to share, not the chord.
  const size = fit(max, rad * 2.0, n, 0.9);
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0.5 : i / (n - 1);
    const a = -Math.PI * (0.86 - t * 0.72);
    const p: Pt = [at[0] + Math.cos(a) * rad, at[1] + Math.sin(a) * rad * 0.5];
    // A shallow tilt away from centre, not a full radial spin: a hand of things
    // laid out in an arc leans, it does not rotate to face the middle.
    s.put(p, size, { rot: (t - 0.5) * 0.7, shadow: 0.012 });
    out.push(p);
  }
  return out;
}

/** A heap. */
function pile(s: Scene, n: number, at: Pt, w: number, max = PIP): Pt[] {
  const out: Pt[] = [];
  const r = rng(s.seed * 89 + 7);
  const size = Math.min(max, w * 0.62);
  for (let i = 0; i < n; i++) {
    const t = i / Math.max(1, n - 1);
    const x = at[0] + (r() - 0.5) * w * (1 - t * 0.5);
    const y = at[1] - t * size * 0.5 - size * 0.4;
    s.put([x, y], size, { rot: (r() - 0.5) * 1.6 });
    out.push([x, y]);
  }
  return out;
}

// ------------------------------------------------------------------- courts

/**
 * A court card.
 *
 * Traditional decks draw these double-headed — the figure from the waist up,
 * mirrored, so the card reads either way round — and that convention exists for
 * a reason a cat suits perfectly: you get the head twice, and a cat's head is
 * the whole performance.
 */
function court(s: Scene, kind: 'J' | 'Q' | 'K', attr: () => void) {
  const pad = s.pad;
  const ink = s.ink;
  const mid = H / 2;

  // The frame and the dividing rule, which every real court card has.
  const f: Pt[] = [[AREA.x0, AREA.y0], [AREA.x1, AREA.y0], [AREA.x1, AREA.y1], [AREA.x0, AREA.y1]];
  stroke(pad, [...f, f[0]], ink.hex, { width: 0.0038, taper: 0.2, wobble: 0.0016, alpha: 0.55, sharp: true });
  stroke(pad, [[AREA.x0, mid], [AREA.x1, mid + 0.003]], ink.hex, { width: 0.004, taper: 0.3, alpha: 0.7 });

  for (const half of [1, -1] as const) {
    pad.g.save();
    if (half === -1) {
      // The lower half is the upper half turned about the centre of the card,
      // which is what double-headed means and why the card reads either way up.
      pad.g.translate(pad.w * 0.5, pad.h * 0.5);
      pad.g.rotate(Math.PI);
      pad.g.translate(-pad.w * 0.5, -pad.h * 0.5);
    }
    pad.clip(
      [[AREA.x0, AREA.y0], [AREA.x1, AREA.y0], [AREA.x1, mid], [AREA.x0, mid]],
      () => {
        s.cat(
          {
            pose: kind === 'K' ? 'sit' : kind === 'Q' ? 'beg' : 'hold',
            at: [0.5, mid + 0.1],
            size: 0.52,
            mood: kind === 'K' ? 'smug' : kind === 'Q' ? 'calm' : 'pleased',
            seed: s.seed,
          },
          1.05,
        );
        attr();
      },
    );
    pad.g.restore();
  }
}

/** A crown, worn at whatever angle the wearer has settled on. */
function crown(s: Scene, at: Pt, w: number, tilt: number, points = 5) {
  const path: Pt[] = [[at[0] - w / 2, at[1]]];
  for (let i = 0; i < points; i++) {
    const t = (i + 0.5) / points;
    path.push([at[0] - w / 2 + w * (t - 0.5 / points), at[1] - w * 0.1]);
    path.push([at[0] - w / 2 + w * t, at[1] - w * 0.46]);
    path.push([at[0] - w / 2 + w * (t + 0.5 / points), at[1] - w * 0.1]);
  }
  path.push([at[0] + w / 2, at[1]]);
  const cos = Math.cos(tilt);
  const sin = Math.sin(tilt);
  const map = (p: Pt): Pt => [
    at[0] + (p[0] - at[0]) * cos - (p[1] - at[1]) * sin,
    at[1] + (p[0] - at[0]) * sin + (p[1] - at[1]) * cos,
  ];
  stroke(s.pad, path.map(map), s.ink.hex, { width: 0.0058, taper: 0.25, wobble: 0.0016 });
  stroke(s.pad, [map([at[0] - w / 2, at[1]]), map([at[0] + w / 2, at[1]])], s.ink.hex, { width: 0.0058, taper: 0.25 });
}

// --------------------------------------------------------------- the deck

export interface Gag {
  /** One line, shown under the card when it is picked up. */
  joke: string;
  draw: (s: Scene) => void;
}

const G: Record<string, Gag> = {
  // ------------------------------------------------------------------ aces
  'A-spades': {
    joke: 'A hole has appeared. The cat has no information about the hole.',
    draw: (s) => {
      acePip(s.pad, s.ink, 'spades', [0.5, H * 0.36], 0.25);
      s.count(1);
      // The hole it has evidently been used for.
      const hole: Pt[] = [];
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2;
        hole.push([0.34 + Math.cos(a) * 0.09, H * 0.7347 + Math.sin(a) * 0.035]);
      }
      stroke(s.pad, [...hole, hole[0]], s.ink.hex, { width: 0.0044, taper: 0.3, wobble: 0.002 });
      prop.trail(s.pad, s.ink, [[0.34, H * 0.7347], [0.5, H * 0.7478], [0.6, H * 0.7434]]);
      s.cat({ pose: 'sit', at: [0.7, H * 0.7695], size: 0.34, flip: -1, mood: 'guilty', seed: s.seed });
    },
  },
  'A-hearts': {
    joke: 'It has brought you a heart. It expects the same reaction as the mouse.',
    draw: (s) => {
      s.cat({ pose: 'beg', at: [0.5, H * 0.8216], size: 0.42, mood: 'pleased', seed: s.seed });
      acePip(s.pad, s.ink, 'hearts', [0.5, H * 0.32], 0.21);
      s.count(1);
    },
  },
  'A-diamonds': {
    joke: 'Sitting on it. It will hatch, or it will not; either way it is hers.',
    draw: (s) => {
      acePip(s.pad, s.ink, 'diamonds', [0.5, H * 0.7174], 0.22);
      s.count(1);
      // Sitting on it, so the cat covers the top half of the ornament.
      s.cat({ pose: 'loaf', at: [0.5, H * 0.66], size: 0.5, mood: 'smug', seed: s.seed });
    },
  },
  'A-clubs': {
    joke: 'Gravity was tested. Gravity performed as expected.',
    draw: (s) => {
      prop.plinth(s.pad, s.ink, [0.34, H * 0.8], 0.26);
      s.cat({ pose: 'paw', at: [0.3, H * 0.8], size: 0.5, mood: 'intent', seed: s.seed });
      acePip(s.pad, s.ink, 'clubs', [0.7, H * 0.42], 0.19);
      s.count(1);
      prop.whoosh(s.pad, s.ink, [0.7, H * 0.42], [-0.4, -0.9], 0.13, 3);
    },
  },

  // ------------------------------------------------------------------ twos
  '2-spades': {
    joke: 'Two spades in the ground and a cat who has decided this is enough gardening.',
    draw: (s) => {
      planted(s, 2, H * 0.7695, 0.28, 0.56, 0.16);
      s.cat({ pose: 'sit', at: [0.74, H * 0.7695], size: 0.46, flip: -1, mood: 'calm', seed: s.seed });
    },
  },
  '2-hearts': {
    joke: 'Two hearts out to dry. One cat can reach. The other is thinking about it.',
    draw: (s) => {
      onLine(s, 2, H * 0.4, 0.18, 0.82, 0.143);
      s.cat({ pose: 'rear', at: [0.32, H * 0.4 + reach('rear', 0.46) + 0.02], size: 0.46, mood: 'intent', seed: s.seed });
      s.cat({ pose: 'sit', at: [0.74, H * 0.8216], size: 0.36, flip: -1, mood: 'calm', seed: s.seed + 1 });
    },
  },
  '2-diamonds': {
    joke: 'Water is not a problem, exactly. It is a consideration.',
    draw: (s) => {
      prop.bowl(s.pad, s.ink, [0.6, H * 0.7608], 0.21);
      s.put([0.55, H * 0.7608], 0.12, { rot: 0.3 });
      s.put([0.67, H * 0.7782], 0.12, { rot: -0.5 });
      s.cat({ pose: 'peer', at: [0.3, H * 0.8303], size: 0.46, mood: 'intent', seed: s.seed });
    },
  },
  '2-clubs': {
    joke: 'One under the sofa. One about to be. This is the whole of the plan.',
    draw: (s) => {
      prop.sofa(s.pad, s.ink, [0.5, H * 0.6], 0.66, 0.3);
      s.put([0.4, H * 0.63], 0.115, { rot: 0.5, alpha: 0.5 });
      s.put([0.72, H * 0.8129], 0.13, { shadow: 0.012 });
      s.cat({ pose: 'paw', at: [0.46, H * 0.8259], size: 0.46, mood: 'intent', seed: s.seed });
      prop.whoosh(s.pad, s.ink, [0.72, H * 0.8129], [-1, 0], 0.117, 2);
    },
  },

  // ---------------------------------------------------------------- threes
  '3-spades': {
    joke: 'Three on the shelf. Two, shortly. The paw is already committed.',
    draw: (s) => {
      prop.shelf(s.pad, s.ink, H * 0.44, 0.14, 0.86);
      onShelf(s, 2, H * 0.44, 0.26, 0.44, 0.14);
      s.put([0.74, H * 0.7174], 0.14, { rot: 0.9 });
      prop.whoosh(s.pad, s.ink, [0.74, H * 0.7174], [0, -1], 0.16, 3);
      s.cat({ pose: 'paw', at: [0.58, H * 0.44], size: 0.44, mood: 'guilty', seed: s.seed });
    },
  },
  '3-hearts': {
    joke: 'The line held. That was not the question anyone was asking.',
    draw: (s) => {
      onLine(s, 3, H * 0.36, 0.14, 0.86, 0.13);
      s.cat({ pose: 'hang', at: [0.62, H * 0.36 + reach('hang', 0.5)], size: 0.5, mood: 'alarmed', seed: s.seed });
    },
  },
  '3-diamonds': {
    joke: 'Warm, flat, and hers. Three excellent reasons, in order of importance.',
    draw: (s) => {
      const top = stackUp(s, 3, [0.5, H * 0.8389], 0.155);
      s.cat({ pose: 'sleep', at: [0.5, top[2][1] - 0.05], size: 0.46, mood: 'asleep', seed: s.seed });
    },
  },
  '3-clubs': {
    joke: 'Two on the floor and one in the mouth. Delivery is in progress.',
    draw: (s) => {
      s.put([0.22, H * 0.8216], 0.13, { rot: 0.7, shadow: 0.012 });
      s.put([0.38, H * 0.8389], 0.13, { rot: -0.4, shadow: 0.012 });
      const c = s.cat({ pose: 'carry', at: [0.5, H * 0.8042], size: 0.52, mood: 'pleased', seed: s.seed });
      const m = mouthAt(c);
      s.put([m[0] + 0.035, m[1] + 0.012], 0.115, { rot: 0.4 });
    },
  },

  // ----------------------------------------------------------------- fours
  '4-spades': {
    joke: 'A fence of four. The gap is not a design fault; the gap is the point.',
    draw: (s) => {
      planted(s, 4, H * 0.7, 0.18, 0.82, 0.15);
      s.cat({ pose: 'stretch', at: [0.5, H * 0.7], size: 0.5, mood: 'intent', seed: s.seed });
    },
  },
  '4-hearts': {
    joke: 'Four hearts, balanced. One cat, breathing in.',
    draw: (s) => {
      s.put([0.32, H * 0.62], 0.15, { rot: 0.42 });
      s.put([0.46, H * 0.62], 0.15, { rot: -0.42 });
      s.put([0.6, H * 0.62], 0.15, { rot: 0.42 });
      s.put([0.46, H * 0.46], 0.15, { rot: 0 });
      stroke(s.pad, [[0.22, H * 0.7], [0.72, H * 0.7]], s.ink.hex, { width: 0.005, taper: 0.4 });
      s.cat({ pose: 'sit', at: [0.78, H * 0.8303], size: 0.4, flip: -1, mood: 'alarmed', seed: s.seed });
    },
  },
  '4-diamonds': {
    joke: 'Four diamonds have been buried with enormous care in the wrong place.',
    draw: (s) => {
      prop.tray(s.pad, s.ink, [0.5, H * 0.8216], 0.56);
      s.put([0.34, H * 0.7868], 0.115, { rot: 0.6 });
      s.put([0.45, H * 0.7999], 0.115, { rot: -0.3 });
      s.put([0.56, H * 0.7868], 0.115, { rot: 0.2 });
      s.put([0.66, H * 0.7999], 0.115, { rot: -0.7 });
      s.cat({ pose: 'pounce', at: [0.5, H * 0.7695], size: 0.5, mood: 'intent', seed: s.seed });
    },
  },
  '4-clubs': {
    joke: 'Two cats, four clubs, and no agreement about whose they are.',
    draw: (s) => {
      s.put([0.5, H * 0.42], 0.135, { rot: 0.3 });
      prop.whoosh(s.pad, s.ink, [0.5, H * 0.42], [1, 0.2], 0.14, 3);
      s.put([0.3, H * 0.8216], 0.125, { shadow: 0.012 });
      s.put([0.5, H * 0.8389], 0.125, { rot: 0.8, shadow: 0.012 });
      s.put([0.7, H * 0.8216], 0.125, { rot: -0.5, shadow: 0.012 });
      s.cat({ pose: 'rear', at: [0.24, H * 0.42 + reach('rear', 0.42) + 0.03], size: 0.42, mood: 'intent', seed: s.seed });
      s.cat({ pose: 'pounce', at: [0.8, H * 0.7695], size: 0.42, flip: -1, mood: 'intent', seed: s.seed + 3 });
    },
  },

  // ----------------------------------------------------------------- fives
  '5-spades': {
    joke: 'Five in the window box. Nothing has been planted; something has been supervised.',
    draw: (s) => {
      prop.window(s.pad, s.ink, [0.5, H * 0.4], 0.54, 0.36);
      s.cat({ pose: 'sit', at: [0.5, H * 0.4 + 0.17], size: 0.3, mood: 'calm', seed: s.seed });
      planted(s, 5, H * 0.8042, 0.16, 0.84, 0.135);
    },
  },
  '5-hearts': {
    joke: 'Five hearts on the rug, and the exact centre of them is taken.',
    draw: (s) => {
      prop.rug(s.pad, s.ink, [0.5, H * 0.7347], 0.66);
      s.put([0.26, H * 0.7087], 0.117, { rot: 0.4 });
      s.put([0.74, H * 0.7087], 0.117, { rot: -0.4 });
      s.put([0.3, H * 0.7695], 0.117, { rot: -0.2 });
      s.put([0.7, H * 0.7695], 0.117, { rot: 0.2 });
      s.put([0.5, H * 0.5], 0.13, { rot: 0 });
      s.cat({ pose: 'loaf', at: [0.5, H * 0.7521], size: 0.48, mood: 'smug', seed: s.seed });
    },
  },
  '5-diamonds': {
    joke: 'Washing day. One in the basket, one being carried, three already out.',
    draw: (s) => {
      // The reference card, followed exactly, because it is perfect.
      onLine(s, 3, H * 0.66, 0.12, 0.9, 0.135);
      inBox(s, 1, [0.24, H * 0.36], 0.18, 0.115);
      const c = s.cat({ pose: 'hold', at: [0.54, H * 0.44], size: 0.38, mood: 'pleased', seed: s.seed });
      const p = pawAt(c, 'fore', 1);
      s.put([p[0] + 0.014, p[1] + 0.022], 0.125, { rot: 0.2 });
      s.cat({ pose: 'rear', at: [0.78, H * 0.7 + reach('rear', 0.46) + 0.06], size: 0.46, flip: -1, mood: 'intent', seed: s.seed + 2 });
    },
  },
  '5-clubs': {
    joke: 'Four posted. The fifth is being held back as leverage.',
    draw: (s) => {
      prop.letterSlot(s.pad, s.ink, [0.46, H * 0.32], 0.42);
      s.put([0.46, H * 0.37], 0.115, { rot: 0.1 });
      s.put([0.22, H * 0.7955], 0.12, { rot: 0.5, shadow: 0.012 });
      s.put([0.38, H * 0.8172], 0.12, { rot: -0.3, shadow: 0.012 });
      s.put([0.54, H * 0.7999], 0.12, { rot: 0.8, shadow: 0.012 });
      const c = s.cat({ pose: 'hold', at: [0.8, H * 0.8389], size: 0.44, flip: -1, mood: 'smug', seed: s.seed });
      const p = pawAt(c, 'fore', 0);
      s.put([p[0] - 0.01, p[1] + 0.02], 0.143, { rot: -0.3 });
    },
  },

  // ------------------------------------------------------------------ sixes
  '6-spades': {
    joke: 'Six laid out in a fan, and one of them is now furniture.',
    draw: (s) => {
      fanOut(s, 6, [0.5, H * 0.8476], 0.34, 0.125);
      s.cat({ pose: 'sit', at: [0.52, H * 0.7695], size: 0.44, mood: 'calm', seed: s.seed });
    },
  },
  '6-hearts': {
    joke: 'It has been established that the line will take a cat. Once.',
    draw: (s) => {
      onLine(s, 6, H * 0.54, 0.1, 0.9, 0.11);
      s.cat({ pose: 'walk', at: [0.46, H * 0.54 + 0.03], size: 0.44, mood: 'alarmed', lean: -0.1, seed: s.seed });
    },
  },
  '6-diamonds': {
    joke: 'Six diamonds and a long floor. This will take all afternoon and it will be done properly.',
    draw: (s) => {
      s.put([0.2, H * 0.7695], 0.117, { rot: 0.3, shadow: 0.01 });
      s.put([0.34, H * 0.7868], 0.117, { rot: -0.6, shadow: 0.01 });
      s.put([0.47, H * 0.7651], 0.117, { rot: 0.9, shadow: 0.01 });
      s.put([0.6, H * 0.7912], 0.117, { rot: -0.2, shadow: 0.01 });
      s.put([0.73, H * 0.7695], 0.117, { rot: 0.5, shadow: 0.01 });
      s.put([0.82, H * 0.54], 0.117, { rot: 1.2 });
      prop.whoosh(s.pad, s.ink, [0.82, H * 0.54], [-1, 0.5], 0.14, 3);
      s.cat({ pose: 'paw', at: [0.42, H * 0.7087], size: 0.48, mood: 'intent', seed: s.seed });
    },
  },
  '6-clubs': {
    joke: 'Six high. One paw resting on it. Eye contact maintained throughout.',
    draw: (s) => {
      const st = stackUp(s, 6, [0.34, H * 0.83], 0.125);
      // Placed so the paw lands on the top of the stack, rather than reaching
      // for it across the card with a stick.
      const top = st[5];
      s.cat({ pose: 'hold', at: [top[0] + 0.28, top[1] + 0.33], size: 0.42, flip: -1, mood: 'smug', seed: s.seed });
    },
  },

  // ---------------------------------------------------------------- sevens
  '7-spades': {
    joke: 'Seven planted in spring. Six remain planted.',
    draw: (s) => {
      planted(s, 6, H * 0.8303, 0.13, 0.6, 0.125);
      const c = s.cat({ pose: 'rear', at: [0.8, H * 0.8303], size: 0.48, flip: -1, mood: 'intent', seed: s.seed });
      const p = pawAt(c, 'fore', 0);
      s.put([p[0] - 0.01, p[1] - 0.03], 0.125, { rot: 1.1 });
    },
  },
  '7-hearts': {
    joke: 'One heart remains on the shelf. The cat is not connected to the other six.',
    draw: (s) => {
      prop.shelf(s.pad, s.ink, H * 0.42, 0.12, 0.88);
      s.put([0.76, H * 0.42 - 0.06], 0.12, {});
      scatter(s, 6, [0.14, H * 0.7347, 0.86, H * 0.8476], 0.115);
      s.cat({ pose: 'sit', at: [0.36, H * 0.42], size: 0.38, mood: 'guilty', seed: s.seed });
    },
  },
  '7-diamonds': {
    joke: 'Seven diamonds in water. A paw has been introduced to the situation.',
    draw: (s) => {
      prop.bowl(s.pad, s.ink, [0.62, H * 0.7782], 0.24);
      grid(s, 6, 3, [0.46, H * 0.7261, 0.78, H * 0.8042], 0.1);
      const c = s.cat({ pose: 'rear', at: [0.24, H * 0.8389], size: 0.5, mood: 'intent', seed: s.seed });
      const p = pawAt(c, 'fore', 0);
      s.put([p[0] + 0.02, p[1] - 0.02], 0.11, { rot: 0.5 });
    },
  },
  '7-clubs': {
    joke: 'Seven clubs, arranged into a bed by a process nobody witnessed.',
    draw: (s) => {
      pile(s, 7, [0.5, H * 0.8563], 0.36, 0.125);
      s.cat({ pose: 'sleep', at: [0.5, H * 0.7434], size: 0.52, mood: 'asleep', seed: s.seed });
    },
  },

  // ----------------------------------------------------------------- eights
  '8-spades': {
    joke: 'One holds the ladder. This has been agreed. Nobody is holding the ladder.',
    draw: (s) => {
      prop.shelf(s.pad, s.ink, H * 0.34, 0.12, 0.88);
      onShelf(s, 5, H * 0.34, 0.2, 0.72, 0.105);
      prop.ladder(s.pad, s.ink, [0.3, H * 0.8389], 0.46);
      s.cat({ pose: 'rear', at: [0.32, H * 0.34 + reach('rear', 0.4) + 0.02], size: 0.4, mood: 'intent', seed: s.seed });
      scatter(s, 3, [0.62, H * 0.7782, 0.9, H * 0.8389], 0.105);
      s.cat({ pose: 'sit', at: [0.74, H * 0.8389], size: 0.32, flip: -1, mood: 'calm', seed: s.seed + 4 });
    },
  },
  '8-hearts': {
    joke: 'Two lines, four each, and a cat exactly between them, unable to choose.',
    draw: (s) => {
      onLine(s, 4, H * 0.28, 0.12, 0.88, 0.1);
      onLine(s, 4, H * 0.56, 0.12, 0.88, 0.1);
      s.cat({ pose: 'beg', at: [0.5, H * 0.8476], size: 0.44, mood: 'alarmed', seed: s.seed });
    },
  },
  '8-diamonds': {
    joke: 'Eight in a grid. One is out of true and it is going to bother somebody.',
    draw: (s) => {
      grid(s, 7, 4, [0.14, H * 0.38, 0.86, H * 0.62], 0.105);
      s.put([0.66, H * 0.7955], 0.105, { rot: 0.9, shadow: 0.012 });
      s.cat({ pose: 'walk', at: [0.36, H * 0.8303], size: 0.46, mood: 'calm', seed: s.seed });
    },
  },
  '8-clubs': {
    joke: 'The box was for the clubs. The box is now for the cat.',
    draw: (s) => {
      inBox(s, 8, [0.5, H * 0.8389], 0.46, 0.098);
      s.cat({ pose: 'peer', at: [0.5, H * 0.68], size: 0.46, mood: 'smug', seed: s.seed });
    },
  },

  // ------------------------------------------------------------------ nines
  '9-spades': {
    joke: 'Nine, and the top one is exactly one cat above the floor.',
    draw: (s) => {
      prop.chair(s.pad, s.ink, [0.3, H * 0.8389], 0.3, 0.34);
      prop.shelf(s.pad, s.ink, H * 0.32, 0.12, 0.88);
      onShelf(s, 4, H * 0.32, 0.22, 0.58, 0.105);
      scatter(s, 5, [0.62, H * 0.7608, 0.9, H * 0.8389], 0.105);
      s.cat({ pose: 'rear', at: [0.32, H * 0.32 + reach('rear', 0.38) + 0.02], size: 0.38, mood: 'intent', seed: s.seed });
    },
  },
  '9-hearts': {
    joke: 'Nine hearts, and one of them is a reflection. The cat has counted; the cat disagrees.',
    draw: (s) => {
      prop.mirror(s.pad, s.ink, [0.68, H * 0.42], 0.32, 0.42);
      s.put([0.64, H * 0.37], 0.1, { alpha: 0.5 });
      s.put([0.74, H * 0.48], 0.1, { alpha: 0.5 });
      grid(s, 7, 4, [0.12, H * 0.7434, 0.88, H * 0.8303], 0.105);
      s.cat({ pose: 'sit', at: [0.3, H * 0.64], size: 0.44, mood: 'alarmed', seed: s.seed });
    },
  },
  '9-diamonds': {
    joke: 'Three by three, and the middle row has been requisitioned.',
    draw: (s) => {
      grid(s, 3, 3, [0.16, H * 0.3, 0.84, H * 0.4], 0.11);
      grid(s, 3, 3, [0.16, H * 0.52, 0.84, H * 0.62], 0.11);
      grid(s, 3, 3, [0.16, H * 0.7174, 0.84, H * 0.7608], 0.11);
      s.cat({ pose: 'flop', at: [0.5, H * 0.8563], size: 0.6, mood: 'asleep', seed: s.seed });
    },
  },
  '9-clubs': {
    joke: 'Nine were stacked. Nine are no longer stacked. The transition was very quick.',
    draw: (s) => {
      pile(s, 5, [0.3, H * 0.8476], 0.28, 0.117);
      s.put([0.62, H * 0.5], 0.117, { rot: 0.8 });
      s.put([0.74, H * 0.62], 0.117, { rot: -1.1 });
      s.put([0.68, H * 0.7261], 0.117, { rot: 1.6 });
      s.put([0.82, H * 0.7782], 0.117, { rot: 0.2, shadow: 0.01 });
      for (const p of [[0.62, H * 0.5], [0.74, H * 0.62], [0.68, H * 0.7261]] as Pt[]) {
        prop.whoosh(s.pad, s.ink, p, [-0.8, -0.6], 0.104, 2);
      }
      s.cat({ pose: 'pounce', at: [0.38, H * 0.7782], size: 0.5, mood: 'intent', seed: s.seed });
    },
  },

  // ------------------------------------------------------------------- tens
  '10-spades': {
    joke: 'Ten planted, in a straight line, by somebody with a great deal of time.',
    draw: (s) => {
      planted(s, 5, H * 0.44, 0.14, 0.86, 0.105);
      planted(s, 5, H * 0.68, 0.14, 0.86, 0.105);
      s.cat({ pose: 'back', at: [0.5, H * 0.8563], size: 0.42, mood: 'calm', seed: s.seed });
    },
  },
  '10-hearts': {
    joke: 'Ten hearts, two cats, and a line neither of them has any business on.',
    draw: (s) => {
      onLine(s, 10, H * 0.44, 0.09, 0.91, 0.088);
      s.cat({ pose: 'rear', at: [0.26, H * 0.44 + reach('rear', 0.44) + 0.04], size: 0.44, mood: 'intent', seed: s.seed });
      s.cat({ pose: 'sit', at: [0.76, H * 0.8476], size: 0.38, flip: -1, mood: 'pleased', seed: s.seed + 5 });
    },
  },
  '10-diamonds': {
    joke: 'The diamonds are in the box. So is the cat. This is not negotiable.',
    draw: (s) => {
      inBox(s, 10, [0.5, H * 0.8563], 0.54, 0.088);
      s.cat({ pose: 'peer', at: [0.44, H * 0.7], size: 0.46, mood: 'smug', seed: s.seed });
    },
  },
  '10-clubs': {
    joke: 'The shelf held ten. The shelf was the only thing that ever held ten.',
    draw: (s) => {
      prop.shelf(s.pad, s.ink, H * 0.32, 0.12, 0.88);
      onShelf(s, 3, H * 0.32, 0.2, 0.44, 0.1);
      scatter(s, 7, [0.12, H * 0.7261, 0.9, H * 0.8476], 0.1);
      s.cat({ pose: 'paw', at: [0.68, H * 0.32], size: 0.4, mood: 'guilty', seed: s.seed });
      s.cat({ pose: 'sit', at: [0.24, H * 0.68], size: 0.28, flip: -1, mood: 'alarmed', seed: s.seed + 6 });
    },
  },
};

/** The courts, which take no pips and are drawn double-headed. */
const COURTS: Record<string, Gag> = {
  'J-spades': {
    joke: 'The Jack of Spades, who has been digging and would rather not discuss it.',
    draw: (s) => court(s, 'J', () => {
      stroke(s.pad, [[0.68, H * 0.44], [0.76, H * 0.2]], s.ink.hex, { width: 0.008, taper: 0.3 });
      pip(s.pad, s.ink, 'spades', [0.77, H * 0.17], 0.117, {});
    }),
  },
  'J-hearts': {
    joke: 'The Jack of Hearts, holding a fish he has no intention of sharing.',
    draw: (s) => court(s, 'J', () => prop.fish(s.pad, s.ink, [0.72, H * 0.3], 0.16, false)),
  },
  'J-diamonds': {
    joke: 'The Jack of Diamonds. The bell was a gift. The bell was a mistake.',
    draw: (s) => court(s, 'J', () => {
      stroke(s.pad, [[0.5, H * 0.36], [0.5, H * 0.42]], s.ink.hex, { width: 0.005, taper: 0.4 });
      s.pad.blob([0.5, H * 0.44], 0.022, 0.022, 0, s.ink.hex, { alpha: 1 });
    }),
  },
  'J-clubs': {
    joke: 'The Jack of Clubs, with a stick. Nobody threw the stick.',
    draw: (s) => court(s, 'J', () => {
      stroke(s.pad, [[0.62, H * 0.42], [0.82, H * 0.24]], s.ink.hex, { width: 0.009, taper: 0.35, wobble: 0.003 });
    }),
  },
  'Q-spades': {
    joke: 'The Queen of Spades. She has been told about the vase and considers the matter closed.',
    draw: (s) => court(s, 'Q', () => {
      crown(s, [0.5, H * 0.2], 0.16, 0, 3);
      prop.cushion(s.pad, s.ink, [0.5, H * 0.5], 0.42);
    }),
  },
  'Q-hearts': {
    joke: 'The Queen of Hearts, and a mouse who has been promoted to courtier.',
    draw: (s) => court(s, 'Q', () => {
      crown(s, [0.5, H * 0.2], 0.16, 0.05, 3);
      s.pad.blob([0.72, H * 0.44], 0.026, 0.02, 0.2, s.ink.hex, { alpha: 1 });
      stroke(s.pad, [[0.74, H * 0.44], [0.82, H * 0.47]], s.ink.hex, { width: 0.0034, taper: 0.6 });
    }),
  },
  'Q-diamonds': {
    joke: 'The Queen of Diamonds is being groomed and is not enjoying it correctly.',
    draw: (s) => court(s, 'Q', () => {
      crown(s, [0.5, H * 0.2], 0.16, -0.06, 3);
      for (let i = 0; i < 7; i++) {
        stroke(s.pad, [[0.68 + i * 0.011, H * 0.36], [0.68 + i * 0.011, H * 0.42]], s.ink.hex, { width: 0.003, taper: 0.4 });
      }
      stroke(s.pad, [[0.66, H * 0.35], [0.75, H * 0.35]], s.ink.hex, { width: 0.005, taper: 0.3 });
    }),
  },
  'Q-clubs': {
    joke: 'The Queen of Clubs has been given a flower and is deciding whether to eat it.',
    draw: (s) => court(s, 'Q', () => {
      crown(s, [0.5, H * 0.2], 0.16, 0.02, 3);
      stroke(s.pad, [[0.72, H * 0.5], [0.74, H * 0.34]], s.ink.hex, { width: 0.004, taper: 0.4 });
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        s.pad.blob([0.74 + Math.cos(a) * 0.022, H * 0.33 + Math.sin(a) * 0.022], 0.016, 0.011, a, s.ink.hex, { alpha: 0.9 });
      }
    }),
  },
  'K-spades': {
    joke: 'The King of Spades. The crown is not straight and nobody has told him.',
    draw: (s) => court(s, 'K', () => crown(s, [0.5, H * 0.19], 0.2, 0.22, 5)),
  },
  'K-hearts': {
    joke: 'The King of Hearts, asleep. He has been asleep since the reign began.',
    draw: (s) => court(s, 'K', () => {
      crown(s, [0.5, H * 0.19], 0.2, -0.1, 5);
      for (let i = 0; i < 3; i++) {
        stroke(
          s.pad,
          [[0.74 + i * 0.03, H * 0.3 - i * 0.03], [0.79 + i * 0.03, H * 0.27 - i * 0.03], [0.74 + i * 0.03, H * 0.25 - i * 0.03], [0.8 + i * 0.03, H * 0.22 - i * 0.03]],
          s.ink.hex,
          { width: 0.0034, taper: 0.5, alpha: 0.8 - i * 0.2 },
        );
      }
    }),
  },
  'K-diamonds': {
    joke: 'The King of Diamonds holds the sceptre in the manner of a cat holding anything.',
    draw: (s) => court(s, 'K', () => {
      crown(s, [0.5, H * 0.19], 0.2, 0.04, 5);
      stroke(s.pad, [[0.7, H * 0.52], [0.76, H * 0.26]], s.ink.hex, { width: 0.007, taper: 0.3 });
      pip(s.pad, s.ink, 'diamonds', [0.765, H * 0.23], 0.07, {});
    }),
  },
  'K-clubs': {
    joke: 'The King of Clubs is in the good chair. The King of Clubs is the good chair.',
    draw: (s) => court(s, 'K', () => {
      crown(s, [0.5, H * 0.19], 0.2, -0.16, 5);
      prop.chair(s.pad, s.ink, [0.5, H * 0.52], 0.44, 0.28);
    }),
  },
};

/** Two jokers, because a deck without them is a set of cards. */
const JOKERS: Record<string, Gag> = {
  'joker-red': {
    joke: 'One cat. One line. All four suits. Nobody is prepared to say how.',
    draw: (s) => {
      const at = prop.washLine(s.pad, s.ink, [0.08, H * 0.36], [0.92, H * 0.38], 0.07);
      pegged(s.pad, s.ink, 'hearts', at(0.16), 0.135, 0.2);
      pegged(s.pad, s.ink, 'diamonds', at(0.34), 0.135, -0.15);
      pegged(s.pad, s.ink, 'clubs', at(0.66), 0.135, 0.1);
      pegged(s.pad, s.ink, 'spades', at(0.84), 0.135, -0.25);
      s.cat({ pose: 'hang', at: [0.5, at(0.5)[1] + reach('hang', 0.62)], size: 0.62, mood: 'alarmed', seed: s.seed });
    },
  },
  'joker-black': {
    joke: 'The collar has bells on it. The cat has plans for the collar.',
    draw: (s) => {
      const c = s.cat({ pose: 'beg', at: [0.5, H * 0.7868], size: 0.62, mood: 'smug', seed: s.seed });
      const k = crownAt(c);
      // A jester's collar: three points, three bells, no dignity.
      for (let i = 0; i < 3; i++) {
        const a = -0.9 + i * 0.9;
        const x = 0.5 + Math.cos(a) * 0.14;
        const y = H * 0.7868 - 0.36 + Math.sin(a) * 0.05;
        stroke(s.pad, [[0.5, H * 0.7868 - 0.4], [x, y + 0.06]], s.ink.hex, { width: 0.005, taper: 0.3 });
        s.pad.blob([x, y + 0.075], 0.016, 0.016, 0, s.ink.hex, { alpha: 1 });
      }
      stroke(s.pad, [[k[0] - 0.06, k[1] + 0.02], [k[0], k[1] - 0.03], [k[0] + 0.06, k[1] + 0.02]], s.ink.hex, {
        width: 0.006,
        taper: 0.3,
      });
      pip(s.pad, s.ink, 'spades', [0.5, H * 0.28], 0.143, {});
      pip(s.pad, s.ink, 'clubs', [0.5, H * 0.28], 0.143, { alpha: 0 });
    },
  },
};

export const GAGS: Record<string, Gag> = { ...G, ...COURTS, ...JOKERS };

export function gagFor(rank: Rank | 'joker', suit: Suit | 'red' | 'black'): Gag {
  return GAGS[`${rank}-${suit}`] ?? { joke: '', draw: () => {} };
}

export { fade };
