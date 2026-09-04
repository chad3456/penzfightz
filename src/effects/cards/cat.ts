import { Pad, type Pt } from '../flat/pad';
import { outline, stroke, wander, type Ink } from './ink';

/**
 * The cat.
 *
 * The reference is pure outline — one weight of pen, no fill, almost no
 * interior line — and all of its charm is in the **pose** and the **face**.
 * That decides the whole rig. There is no skeleton solver here, because a
 * solver gives you plausible joints and what this needs is a *silhouette*: the
 * exact pear of a sitting cat, the exact stretch of one standing on its back
 * legs to reach something it should not.
 *
 * So each pose is an authored closed outline for the body plus authored joint
 * chains for the legs and tail, in the cat's own space — feet on the ground at
 * y = 0, y upward, one unit from floor to about the top of a sitting head. One
 * renderer draws all of them, so every pose is the same hand.
 *
 * The face is four marks: two eyes, a nose, a mouth. Everything the cat is
 * thinking is in where the eyes point and how far the ears are back, which is
 * also true of cats.
 */

/** Cat-local: x forward, y up, origin between the front paws on the floor. */
type P = [number, number];

export type Pose =
  | 'sit'
  | 'hold'
  | 'rear'
  | 'stand'
  | 'paw'
  | 'walk'
  | 'pounce'
  | 'loaf'
  | 'sleep'
  | 'hang'
  | 'back'
  | 'stretch'
  | 'beg'
  | 'carry'
  | 'flop'
  | 'peer';

export type Mood = 'calm' | 'pleased' | 'intent' | 'guilty' | 'asleep' | 'alarmed' | 'smug';

export interface Skel {
  /** Closed silhouette of head-less body, in cat space. */
  body: P[];
  head: { c: P; r: number; tilt: number };
  /** Ears: how far back, 0 forward and 1 flat. */
  ears: number;
  /** Front legs, each elbow → wrist → paw. Drawn after the body. */
  fore: P[][];
  /** Back legs, each knee → hock → paw. Drawn before the body. */
  hind: P[][];
  tail: P[];
  /** Extra strokes: a haunch line, a chest fluff, a shoulder. */
  detail?: P[][];
  /** Where the eyes point, in cat space, relative to the head. */
  gaze: P;
  /** Draw the far pair of legs faintly, for a three-quarter view. */
  far?: P[][];
  /** The back of the head: ears and skull, and nothing else. */
  faceless?: boolean;
}

export interface Cat {
  pose: Pose;
  /** Where the feet go, in card space. */
  at: Pt;
  /**
   * The animal's longest side, in card units.
   *
   * Measured, not declared. In the pose's own space a curled cat reaches y=0.5
   * and a rearing one reaches 1.15, so a `size` that meant "one unit of pose
   * space" produced animals that differed by a factor of two. Normalising on
   * height alone then made the lying poses enormous, because a cat asleep is
   * wider than it is tall. The longest side is the number a person means when
   * they say how big a cat is.
   */
  size: number;
  /** -1 faces left. */
  flip?: 1 | -1;
  mood?: Mood;
  /** Tilt the whole animal, radians. */
  lean?: number;
  seed?: number;
}

// --------------------------------------------------------------------- poses

const POSES: Record<Pose, Skel> = {
  /** Sitting, side on, tail curled round the front paws. */
  sit: {
    body: [
      [0.17, 0.74], [0.21, 0.52], [0.21, 0.26], [0.15, 0.07], [-0.06, 0.03],
      [-0.26, 0.06], [-0.35, 0.3], [-0.33, 0.58], [-0.2, 0.75], [-0.02, 0.8],
    ],
    head: { c: [0.08, 0.96], r: 0.215, tilt: 0.05 },
    ears: 0.1,
    fore: [[[0.16, 0.44], [0.17, 0.22], [0.19, 0.05]]],
    hind: [[[-0.2, 0.3], [-0.05, 0.12], [0.06, 0.05]]],
    tail: [[-0.3, 0.09], [-0.36, 0.02], [-0.1, -0.01], [0.2, 0.02], [0.33, 0.13]],
    detail: [[[-0.16, 0.42], [-0.02, 0.22], [0.06, 0.08]]],
    gaze: [0.05, -0.04],
  },

  /** Sitting up, both front paws holding something at the chest. */
  hold: {
    body: [
      [0.16, 0.76], [0.2, 0.54], [0.2, 0.28], [0.14, 0.08], [-0.08, 0.04],
      [-0.28, 0.08], [-0.36, 0.32], [-0.33, 0.6], [-0.2, 0.77], [-0.02, 0.82],
    ],
    head: { c: [0.07, 0.98], r: 0.215, tilt: 0.14 },
    ears: 0.16,
    fore: [
      [[0.17, 0.62], [0.3, 0.56], [0.34, 0.48]],
      [[0.14, 0.6], [0.27, 0.5], [0.31, 0.42]],
    ],
    hind: [[[-0.2, 0.3], [-0.04, 0.12], [0.07, 0.05]]],
    tail: [[-0.32, 0.1], [-0.4, 0.04], [-0.16, 0.0], [0.14, 0.02], [0.3, 0.1]],
    gaze: [0.16, -0.3],
  },

  /** Up on the back legs, both front paws reaching high. */
  /**
   * Up on the back legs, both front paws reaching.
   *
   * Scaled so the top of the head lands where every other pose puts it and the
   * raised paws go above that — `size` has to mean the same thing in every
   * pose or the caller cannot place a cat without looking at it first.
   */
  rear: {
    body: [
      [0.13, 0.76], [0.18, 0.58], [0.19, 0.36], [0.15, 0.18], [0.04, 0.06],
      [-0.13, 0.05], [-0.23, 0.2], [-0.25, 0.44], [-0.2, 0.66], [-0.05, 0.8],
    ],
    head: { c: [-0.02, 0.9], r: 0.175, tilt: -0.12 },
    ears: 0.05,
    fore: [
      [[0.17, 0.74], [0.3, 0.94], [0.38, 1.12]],
      [[0.13, 0.72], [0.22, 0.92], [0.28, 1.1]],
    ],
    hind: [[[-0.2, 0.3], [-0.15, 0.13], [0.02, 0.04]], [[-0.1, 0.29], [-0.05, 0.12], [0.13, 0.03]]],
    tail: [[-0.23, 0.36], [-0.38, 0.26], [-0.45, 0.1], [-0.36, 0.02]],
    detail: [[[-0.15, 0.56], [-0.05, 0.34], [0.02, 0.16]]],
    gaze: [0.1, -0.5],
  },

  /** On all fours, side on. */
  stand: {
    body: [
      [0.3, 0.52], [0.34, 0.4], [0.3, 0.26], [0.06, 0.24], [-0.24, 0.25],
      [-0.42, 0.3], [-0.46, 0.46], [-0.32, 0.56], [-0.04, 0.58], [0.2, 0.57],
    ],
    head: { c: [0.44, 0.62], r: 0.185, tilt: 0.06 },
    ears: 0.08,
    fore: [[[0.28, 0.2], [0.3, 0.1], [0.32, 0.02]], [[0.22, 0.2], [0.23, 0.1], [0.25, 0.02]]],
    hind: [[[-0.38, 0.2], [-0.3, 0.1], [-0.34, 0.02]], [[-0.32, 0.2], [-0.24, 0.1], [-0.28, 0.02]]],
    tail: [[-0.44, 0.42], [-0.6, 0.46], [-0.7, 0.6], [-0.66, 0.74]],
    gaze: [0.14, 0.0],
  },

  /** Standing, one front paw out. The crime pose. */
  paw: {
    body: [
      [0.28, 0.54], [0.33, 0.42], [0.29, 0.27], [0.05, 0.25], [-0.24, 0.26],
      [-0.42, 0.31], [-0.46, 0.47], [-0.32, 0.57], [-0.04, 0.59], [0.19, 0.58],
    ],
    head: { c: [0.42, 0.64], r: 0.185, tilt: 0.02 },
    ears: 0.34,
    fore: [
      [[0.3, 0.34], [0.46, 0.4], [0.6, 0.44]],
      [[0.22, 0.2], [0.23, 0.1], [0.25, 0.02]],
    ],
    hind: [[[-0.38, 0.2], [-0.3, 0.1], [-0.34, 0.02]], [[-0.32, 0.2], [-0.24, 0.1], [-0.28, 0.02]]],
    tail: [[-0.44, 0.44], [-0.62, 0.5], [-0.74, 0.66], [-0.7, 0.82]],
    gaze: [0.02, -0.1],
  },

  /** Mid-stride. */
  walk: {
    body: [
      [0.3, 0.52], [0.34, 0.4], [0.3, 0.26], [0.06, 0.24], [-0.24, 0.25],
      [-0.42, 0.3], [-0.46, 0.46], [-0.32, 0.56], [-0.04, 0.58], [0.2, 0.57],
    ],
    head: { c: [0.45, 0.6], r: 0.185, tilt: 0.1 },
    ears: 0.06,
    fore: [[[0.3, 0.2], [0.4, 0.12], [0.46, 0.03]], [[0.2, 0.2], [0.14, 0.11], [0.1, 0.02]]],
    hind: [[[-0.38, 0.2], [-0.44, 0.1], [-0.5, 0.02]], [[-0.3, 0.2], [-0.18, 0.1], [-0.14, 0.02]]],
    tail: [[-0.44, 0.42], [-0.62, 0.5], [-0.72, 0.68], [-0.62, 0.8]],
    gaze: [0.16, 0.02],
  },

  /** Crouched, hindquarters up, about to go. */
  pounce: {
    body: [
      [0.32, 0.3], [0.36, 0.2], [0.3, 0.1], [0.04, 0.12], [-0.22, 0.2],
      [-0.4, 0.34], [-0.46, 0.5], [-0.3, 0.5], [-0.04, 0.4], [0.2, 0.34],
    ],
    head: { c: [0.46, 0.24], r: 0.175, tilt: 0.16 },
    ears: 0.5,
    fore: [[[0.3, 0.08], [0.36, 0.04], [0.42, 0.02]], [[0.24, 0.08], [0.29, 0.04], [0.35, 0.02]]],
    hind: [[[-0.36, 0.3], [-0.28, 0.12], [-0.32, 0.02]], [[-0.3, 0.3], [-0.22, 0.12], [-0.26, 0.02]]],
    tail: [[-0.44, 0.46], [-0.6, 0.56], [-0.62, 0.76], [-0.5, 0.86]],
    gaze: [0.2, 0.06],
  },

  /** A loaf. Paws tucked, nothing showing. */
  loaf: {
    body: [
      [0.26, 0.34], [0.3, 0.2], [0.24, 0.06], [0.0, 0.03], [-0.26, 0.04],
      [-0.42, 0.12], [-0.46, 0.3], [-0.3, 0.4], [-0.02, 0.42], [0.16, 0.4],
    ],
    head: { c: [0.34, 0.46], r: 0.185, tilt: 0.0 },
    ears: 0.12,
    fore: [[[0.2, 0.08], [0.26, 0.05], [0.3, 0.04]]],
    hind: [],
    tail: [[-0.44, 0.14], [-0.5, 0.06], [-0.26, 0.02], [0.02, 0.03]],
    detail: [[[-0.34, 0.3], [-0.2, 0.16], [-0.08, 0.08]]],
    gaze: [0.1, 0.0],
  },

  /** Curled. A circle with ears. */
  sleep: {
    body: [
      [0.3, 0.2], [0.34, 0.34], [0.24, 0.46], [0.02, 0.5], [-0.22, 0.44],
      [-0.36, 0.3], [-0.36, 0.14], [-0.22, 0.04], [0.02, 0.02], [0.24, 0.08],
    ],
    head: { c: [0.16, 0.18], r: 0.16, tilt: 0.5 },
    ears: 0.2,
    fore: [[[0.06, 0.1], [0.16, 0.06], [0.26, 0.06]]],
    hind: [],
    tail: [[-0.3, 0.1], [-0.12, 0.02], [0.14, 0.02], [0.3, 0.1], [0.34, 0.24]],
    gaze: [0, 0],
  },

  /** Hanging from something overhead by the front paws. */
  hang: {
    body: [
      [0.12, 0.66], [0.16, 0.46], [0.14, 0.24], [0.06, 0.06], [-0.1, 0.05],
      [-0.2, 0.22], [-0.22, 0.46], [-0.18, 0.66], [-0.08, 0.76], [0.03, 0.76],
    ],
    head: { c: [0.04, 0.86], r: 0.18, tilt: -0.06 },
    ears: 0.34,
    fore: [
      [[0.18, 0.8], [0.24, 1.02], [0.26, 1.18]],
      [[-0.1, 0.82], [-0.14, 1.04], [-0.15, 1.19]],
    ],
    hind: [[[-0.14, 0.16], [-0.1, -0.04], [-0.16, -0.16]], [[-0.02, 0.14], [0.02, -0.06], [-0.02, -0.2]]],
    tail: [[-0.18, 0.14], [-0.3, -0.02], [-0.34, -0.24], [-0.24, -0.38]],
    gaze: [0.06, -0.36],
  },

  /** From behind, sitting, tail straight up. No face: this is the back. */
  back: {
    body: [
      [0.26, 0.62], [0.3, 0.36], [0.26, 0.1], [0.0, 0.03], [-0.26, 0.1],
      [-0.3, 0.36], [-0.26, 0.62], [-0.14, 0.74], [0.0, 0.76], [0.14, 0.74],
    ],
    head: { c: [0.0, 0.92], r: 0.2, tilt: 0 },
    ears: 0.1,
    fore: [],
    hind: [[[-0.22, 0.14], [-0.24, 0.06], [-0.2, 0.03]], [[0.22, 0.14], [0.24, 0.06], [0.2, 0.03]]],
    tail: [[0.0, 0.16], [0.04, 0.5], [0.02, 0.86], [0.06, 1.1]],
    detail: [[[-0.1, 0.06], [0.0, 0.03], [0.1, 0.06]]],
    gaze: [0, 0],
    faceless: true,
  },

  /** Front paws forward and low, hindquarters up. */
  stretch: {
    body: [
      [0.34, 0.18], [0.38, 0.1], [0.3, 0.04], [0.02, 0.08], [-0.24, 0.24],
      [-0.42, 0.4], [-0.48, 0.56], [-0.32, 0.54], [-0.06, 0.36], [0.18, 0.24],
    ],
    head: { c: [0.46, 0.26], r: 0.165, tilt: 0.18 },
    ears: 0.22,
    fore: [[[0.34, 0.06], [0.52, 0.03], [0.68, 0.03]], [[0.28, 0.05], [0.46, 0.02], [0.62, 0.02]]],
    hind: [[[-0.38, 0.36], [-0.3, 0.14], [-0.34, 0.02]], [[-0.3, 0.34], [-0.22, 0.12], [-0.26, 0.02]]],
    tail: [[-0.46, 0.52], [-0.6, 0.66], [-0.6, 0.86], [-0.46, 0.94]],
    gaze: [0.14, 0.06],
  },

  /** Sitting up, both paws up in front, chest out. */
  beg: {
    body: [
      [0.14, 0.8], [0.19, 0.56], [0.19, 0.3], [0.13, 0.1], [-0.09, 0.05],
      [-0.29, 0.09], [-0.37, 0.34], [-0.34, 0.62], [-0.21, 0.79], [-0.03, 0.85],
    ],
    head: { c: [0.05, 1.02], r: 0.21, tilt: -0.08 },
    ears: 0.04,
    fore: [
      [[0.17, 0.66], [0.32, 0.68], [0.4, 0.62]],
      [[0.12, 0.64], [0.27, 0.64], [0.35, 0.58]],
    ],
    hind: [[[-0.21, 0.32], [-0.05, 0.13], [0.06, 0.05]]],
    tail: [[-0.33, 0.11], [-0.41, 0.04], [-0.17, 0.0], [0.13, 0.02], [0.29, 0.1]],
    gaze: [0.12, -0.14],
  },

  /** Standing, something in the mouth, head turned to show it. */
  carry: {
    body: [
      [0.28, 0.5], [0.32, 0.38], [0.28, 0.24], [0.04, 0.23], [-0.26, 0.24],
      [-0.44, 0.29], [-0.48, 0.45], [-0.34, 0.55], [-0.06, 0.57], [0.18, 0.55],
    ],
    head: { c: [0.4, 0.6], r: 0.19, tilt: 0.22 },
    ears: 0.14,
    fore: [[[0.26, 0.2], [0.28, 0.1], [0.3, 0.02]], [[0.2, 0.2], [0.21, 0.1], [0.23, 0.02]]],
    hind: [[[-0.4, 0.2], [-0.32, 0.1], [-0.36, 0.02]], [[-0.34, 0.2], [-0.26, 0.1], [-0.3, 0.02]]],
    tail: [[-0.46, 0.4], [-0.62, 0.48], [-0.72, 0.66], [-0.66, 0.82]],
    gaze: [0.12, 0.1],
  },

  /** On its side, all four out. */
  flop: {
    body: [
      [0.36, 0.16], [0.38, 0.08], [0.28, 0.03], [0.0, 0.02], [-0.28, 0.04],
      [-0.44, 0.1], [-0.44, 0.22], [-0.28, 0.28], [0.0, 0.3], [0.24, 0.26],
    ],
    head: { c: [0.52, 0.2], r: 0.185, tilt: -0.35 },
    ears: 0.24,
    fore: [[[0.34, 0.22], [0.5, 0.3], [0.62, 0.26]], [[0.3, 0.04], [0.44, 0.02], [0.56, 0.04]]],
    hind: [[[-0.4, 0.22], [-0.56, 0.28], [-0.66, 0.22]], [[-0.38, 0.06], [-0.54, 0.03], [-0.64, 0.06]]],
    tail: [[-0.44, 0.14], [-0.62, 0.12], [-0.78, 0.2], [-0.82, 0.34]],
    gaze: [0.02, 0.1],
  },

  /** Sitting, leaning over an edge, looking straight down. */
  peer: {
    body: [
      [0.2, 0.6], [0.24, 0.4], [0.22, 0.18], [0.12, 0.05], [-0.1, 0.03],
      [-0.3, 0.08], [-0.36, 0.3], [-0.32, 0.56], [-0.18, 0.7], [0.02, 0.72],
    ],
    head: { c: [0.3, 0.72], r: 0.2, tilt: 0.62 },
    ears: 0.18,
    fore: [[[0.2, 0.42], [0.3, 0.26], [0.36, 0.14]]],
    hind: [[[-0.22, 0.3], [-0.06, 0.12], [0.05, 0.05]]],
    tail: [[-0.34, 0.12], [-0.44, 0.2], [-0.46, 0.42], [-0.36, 0.56]],
    gaze: [0.1, 0.34],
  },
};

/**
 * The longest side of each pose, in its own space.
 *
 * Measured at load rather than declared, so editing a pose cannot silently
 * change how big it comes out on a card.
 */
const UNIT: Record<string, number> = (() => {
  const out: Record<string, number> = {};
  for (const [name, s] of Object.entries(POSES)) {
    let top = 0;
    let lo = Infinity;
    let hi = -Infinity;
    const eat = (ps: P[]) => {
      for (const p of ps) {
        top = Math.max(top, p[1]);
        lo = Math.min(lo, p[0]);
        hi = Math.max(hi, p[0]);
      }
    };
    eat(s.body);
    for (const l of s.fore) eat(l);
    for (const l of s.hind) eat(l);
    eat(s.tail);
    top = Math.max(top, s.head.c[1] + s.head.r * 1.55);
    lo = Math.min(lo, s.head.c[0] - s.head.r * 1.2);
    hi = Math.max(hi, s.head.c[0] + s.head.r * 1.2);
    out[name] = Math.max(top, hi - lo);
  }
  return out;
})();

// -------------------------------------------------------------------- render

/**
 * One cat.
 *
 * Draw order is the order a cat is built out of: far legs, tail, hind legs,
 * body, near legs, head, face. Get it wrong and the tail comes out in front of
 * the animal, which reads instantly as wrong without being easy to name.
 */
export function drawCat(pad: Pad, ink: Ink, cat: Cat, weight = 1) {
  const s = POSES[cat.pose];
  const flip = cat.flip ?? 1;
  const k = cat.size / (UNIT[cat.pose] || 1);
  const lean = cat.lean ?? 0;
  const cos = Math.cos(lean);
  const sin = Math.sin(lean);
  const seed = cat.seed ?? 1;

  // Cat space to card space. Lean rotates about the feet, which is where a
  // leaning animal actually pivots.
  const P = (p: P): Pt => {
    const x = p[0] * flip * k;
    const y = -p[1] * k;
    return [cat.at[0] + x * cos - y * sin, cat.at[1] + x * sin + y * cos];
  };
  const path = (ps: P[]) => ps.map(P);

  const W = 0.0082 * weight;
  const line = (ps: P[], w = W, alpha = 1) =>
    stroke(pad, path(ps), ink.hex, { width: w, taper: 0.42, wobble: 0.0016 + wander(seed) * 0.0006, alpha });

  /** A limb: two lines a leg's thickness apart, closed at the paw. */
  const limb = (ps: P[], thick: number, alpha = 1) => {
    const pts = path(ps);
    const shift = (sign: number): Pt[] =>
      pts.map((p, i) => {
        const q = pts[Math.min(pts.length - 1, i + 1)];
        const b = pts[Math.max(0, i - 1)];
        const dx = q[0] - b[0];
        const dy = q[1] - b[1];
        const d = Math.hypot(dx, dy) || 1;
        return [p[0] - (dy / d) * thick * sign, p[1] + (dx / d) * thick * sign];
      });
    stroke(pad, shift(1), ink.hex, { width: W * 0.9, taper: 0.4, wobble: 0.0014, alpha });
    stroke(pad, shift(-1), ink.hex, { width: W * 0.9, taper: 0.4, wobble: 0.0014, alpha });
    // The paw: a rounded cap across the end, with two toe notches in it.
    const a = shift(1)[pts.length - 1];
    const b2 = shift(-1)[pts.length - 1];
    const e = pts[pts.length - 1];
    const prev = pts[pts.length - 2] ?? e;
    const ux = (e[0] - prev[0]) / (Math.hypot(e[0] - prev[0], e[1] - prev[1]) || 1);
    const uy = (e[1] - prev[1]) / (Math.hypot(e[0] - prev[0], e[1] - prev[1]) || 1);
    stroke(
      pad,
      [a, [e[0] + ux * thick * 1.15, e[1] + uy * thick * 1.15], b2],
      ink.hex,
      { width: W * 0.9, taper: 0.35, alpha },
    );
    stroke(
      pad,
      [
        [e[0] + ux * thick * 0.7 - (a[1] - e[1]) * 0.0, e[1] + uy * thick * 0.7],
        [e[0] + ux * thick * 1.05, e[1] + uy * thick * 1.05],
      ],
      ink.hex,
      { width: W * 0.55, taper: 0.5, alpha: alpha * 0.7 },
    );
  };

  // Far legs, thinner, so a three-quarter view has depth without a second ink.
  for (const leg of s.far ?? []) limb(leg, k * 0.032, 0.5);

  // The tail goes behind the body but in front of the far legs. Drawn as two
  // lines a tail's thickness apart rather than one heavy one, because a tail is
  // a tube and the reference draws every tube that way — two lines that meet at
  // the tip.
  const tail = path(s.tail);
  const th = k * 0.045;
  const off = (sign: number): Pt[] =>
    tail.map((p, i) => {
      const q = tail[Math.min(tail.length - 1, i + 1)];
      const b = tail[Math.max(0, i - 1)];
      const dx = q[0] - b[0];
      const dy = q[1] - b[1];
      const d = Math.hypot(dx, dy) || 1;
      const taperK = 1 - i / (tail.length - 1);
      return [p[0] - (dy / d) * th * sign * taperK, p[1] + (dx / d) * th * sign * taperK];
    });
  stroke(pad, off(1), ink.hex, { width: W * 0.85, taper: 0.5, wobble: 0.0016 });
  stroke(pad, off(-1), ink.hex, { width: W * 0.85, taper: 0.5, wobble: 0.0016 });
  stroke(pad, [off(1)[tail.length - 1], tail[tail.length - 1], off(-1)[tail.length - 1]], ink.hex, {
    width: W * 0.8,
    taper: 0.4,
  });

  for (const leg of s.hind) limb(leg, k * 0.042);

  // The body, as one closed outline. Everything else hangs off it.
  outline(pad, path(s.body), ink.hex, { width: W * 1.12, taper: 0.3, wobble: 0.0018 });

  for (const leg of s.fore) limb(leg, k * 0.038);
  for (const d of s.detail ?? []) line(d, W * 0.6, 0.5);

  head(pad, ink, s, P, W, cat.mood ?? 'calm', flip, lean);
}

/**
 * The head, front on, whatever the body is doing.
 *
 * This is the whole reason the reference works and the first version of this
 * file did not. A cat drawn in true profile has one eye, no ear on the far
 * side, and a snout — and it reads as a fox, or a dog, or a snowman with a
 * nose. The convention every cartoon cat since the twenties has used is to
 * keep the **body in profile and turn the head to the front**: two ears, two
 * eyes side by side, a muzzle in the middle. It is anatomically impossible and
 * it is instantly a cat.
 *
 * So the head knows nothing about which way the body faces. It has a position,
 * a radius and a tilt, and everything on it is placed in its own frame.
 */
function head(
  pad: Pad,
  ink: Ink,
  s: Skel,
  P: (p: P) => Pt,
  W: number,
  mood: Mood,
  flip: 1 | -1,
  lean: number,
) {
  const { c, r, tilt } = s.head;
  const rot = tilt * flip - lean;
  const cos = Math.cos(rot);
  const sin = Math.sin(rot);
  /** Head-local: x across (right positive), y down. One unit is one radius. */
  const F = (x: number, y: number): P => [c[0] + (x * cos + y * sin) * r, c[1] - (-x * sin + y * cos) * r];
  const line = (ps: P[], w: number, alpha = 1, sharp = false) =>
    stroke(pad, ps.map(P), ink.hex, { width: w, taper: 0.42, wobble: 0.0014, alpha, sharp });

  // Ears first, so the skull line crosses them and they sit *in* the head.
  // Big, because a small ear on a round head is a bear and a big one is a cat.
  const back = s.ears;
  for (const side of [-1, 1] as const) {
    const bx = 0.52 * side;
    const tipx = (1.02 + back * 0.5) * side;
    const tipy = -1.42 + back * 0.72;
    line([F(bx - 0.34 * side, -0.72), F(tipx, tipy), F(bx + 0.42 * side, -0.6)], W * 1.02);
    // The inner fold. Two thirds of the way up, and offset, never centred.
    line([F(bx - 0.02 * side, -0.74), F(tipx * 0.7, tipy * 0.72)], W * 0.5, 0.55);
  }

  // The skull: a circle a little wider than tall, with cheeks. The cheeks are
  // what stop it being a ball — a cat's face is widest at the whisker pads.
  const skull: P[] = [];
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2;
    const cheek = 1 + 0.1 * Math.max(0, Math.sin(a)) * Math.abs(Math.cos(a));
    skull.push(F(Math.cos(a) * 1.04 * cheek, Math.sin(a) * 0.98));
  }
  outline(pad, skull.map(P), ink.hex, { width: W * 1.1, taper: 0.26, wobble: 0.0014 });

  if (s.faceless) {
    // The back of a head. Two ear backs and the line where the skull turns
    // away, and that is genuinely all there is to see.
    line([F(-0.5, -0.2), F(0, -0.42), F(0.5, -0.2)], W * 0.5, 0.4);
    return;
  }

  // Eyes, side by side, and the gaze slides them without moving the head.
  const gx = s.gaze[0] * 0.42;
  const gy = s.gaze[1] * 0.42;
  const eye = (side: -1 | 1) => F(0.44 * side + gx, -0.1 + gy);
  if (mood === 'asleep') {
    for (const side of [-1, 1] as const) {
      const e = eye(side);
      line(
        [
          [e[0] - r * 0.22, e[1]],
          [e[0], e[1] + r * 0.14],
          [e[0] + r * 0.22, e[1]],
        ],
        W * 0.95,
      );
    }
  } else {
    const open = mood === 'alarmed' ? 1.35 : mood === 'guilty' || mood === 'smug' ? 0.62 : 1;
    for (const side of [-1, 1] as const) {
      const e = eye(side);
      pad.blob(P(e), r * 0.13, r * 0.13 * open, 0, ink.hex, { alpha: 1 });
      if (mood === 'smug' || mood === 'guilty') {
        // A lid over the top, which is exactly how a cat looks at you when it
        // has already decided.
        line([[e[0] - r * 0.22, e[1] - r * 0.04], [e[0], e[1] - r * 0.2], [e[0] + r * 0.22, e[1] - r * 0.04]], W * 0.8);
      }
      if (mood === 'alarmed') {
        pad.blob(P([e[0], e[1]]), r * 0.05, r * 0.05, 0, ink.paper, { alpha: 0.9 });
      }
    }
  }

  // The muzzle: a nose wedge and two curves. Three marks, and they do more work
  // than the rest of the head put together.
  const nose = F(0, 0.3);
  pad.shape([F(-0.16, 0.24), F(0.16, 0.24), F(0, 0.42)].map(P), ink.hex, { alpha: 1, sharp: true });
  line([nose, F(0, 0.56)], W * 0.7);
  for (const side of [-1, 1] as const) {
    line([F(0, 0.56), F(0.2 * side, 0.66), F(0.34 * side, 0.5)], W * 0.8);
  }

  // Whiskers: three a side, from the pads, sweeping forward and drooping.
  for (const side of [-1, 1] as const) {
    for (let i = 0; i < 3; i++) {
      const t = i - 1;
      line([F(0.3 * side, 0.34), F(1.55 * side, 0.16 + t * 0.34)], W * 0.42, 0.8);
    }
  }
}

/**
 * Where a cat's paws actually are, in card space.
 *
 * The gags need this: a cat holding a pip has to hold it *at its paws*, and a
 * cat reaching for one on a line has to reach the line. Asking the pose where
 * its hands ended up is the only way that stays true when a pose is edited.
 */
export function pawAt(cat: Cat, which: 'fore' | 'hind', index = 0): Pt {
  const s = POSES[cat.pose];
  const legs = which === 'fore' ? s.fore : s.hind;
  const leg = legs[Math.min(index, legs.length - 1)];
  const flip = cat.flip ?? 1;
  const k = cat.size / (UNIT[cat.pose] || 1);
  const lean = cat.lean ?? 0;
  if (!leg) return cat.at;
  const p = leg[leg.length - 1];
  const x = p[0] * flip * k;
  const y = -p[1] * k;
  return [cat.at[0] + x * Math.cos(lean) - y * Math.sin(lean), cat.at[1] + x * Math.sin(lean) + y * Math.cos(lean)];
}

/** Where its mouth is, for the cards where it is carrying something. */
export function mouthAt(cat: Cat): Pt {
  const s = POSES[cat.pose];
  const flip = cat.flip ?? 1;
  const k = cat.size / (UNIT[cat.pose] || 1);
  const { c, r, tilt } = s.head;
  const rot = tilt * flip;
  const p: P = [c[0] + Math.cos(rot) * r * 1.05, c[1] + Math.sin(rot) * r * 1.05];
  const lean = cat.lean ?? 0;
  const x = p[0] * flip * k;
  const y = -p[1] * k;
  return [cat.at[0] + x * Math.cos(lean) - y * Math.sin(lean), cat.at[1] + x * Math.sin(lean) + y * Math.cos(lean)];
}

/** The top of its head, for the cards where something is balanced there. */
export function crownAt(cat: Cat): Pt {
  const s = POSES[cat.pose];
  const flip = cat.flip ?? 1;
  const k = cat.size / (UNIT[cat.pose] || 1);
  const lean = cat.lean ?? 0;
  const p: P = [s.head.c[0], s.head.c[1] + s.head.r * 1.42];
  const x = p[0] * flip * k;
  const y = -p[1] * k;
  return [cat.at[0] + x * Math.cos(lean) - y * Math.sin(lean), cat.at[1] + x * Math.sin(lean) + y * Math.cos(lean)];
}

export const POSE_NAMES = Object.keys(POSES) as Pose[];

/** How tall a pose is per unit of `size`, for callers that need to reach it. */
export const poseUnit = (p: Pose) => UNIT[p] || 1;

/**
 * How far above its feet the highest front paw gets, at a given size.
 *
 * The cards need this constantly: a cat reaching for a pip on a line has to
 * actually reach it, and a cat standing on a shelf has to stand on it.
 * Computing the offset beats nudging a y value until it looks right, because
 * the nudge stops being right the moment the pose is edited.
 */
export function reach(pose: Pose, size: number): number {
  const s = POSES[pose];
  let top = 0;
  for (const leg of s.fore) for (const p of leg) top = Math.max(top, p[1]);
  return (top / (UNIT[pose] || 1)) * size;
}
