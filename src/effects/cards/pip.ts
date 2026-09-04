import { Pad, type Pt } from '../flat/pad';
import { crosshatch, fade, hatch, outline, rng, stroke, type Ink } from './ink';

/**
 * The pips.
 *
 * The joke of the reference card depends entirely on the pips being **objects**
 * — things with weight that can be pegged to a line, dropped in a box, batted
 * under a sofa. So a pip here is not a glyph stamped at a coordinate. It is a
 * shape that can be given a rotation, a shadow, a peg, a piece of string, and
 * a hand-drawn outline over its fill so it reads as printed rather than placed.
 *
 * The four shapes are drawn to the proportions a real card uses, which are not
 * the proportions of the Unicode glyphs: a playing-card heart is wider than it
 * is tall at the lobes and comes to a long point; a spade's stem is a separate
 * piece; a club is three circles whose centres form an equilateral triangle.
 * Get those wrong and the card looks like a website about cards.
 */

export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';

export const SUITS: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];
export const SUIT_NAME: Record<Suit, string> = {
  spades: 'Spades',
  hearts: 'Hearts',
  diamonds: 'Diamonds',
  clubs: 'Clubs',
};

/** Unit shapes, centred on the origin, one unit tall, y downward. */
const DIAMOND: Pt[] = [[0, -0.5], [0.325, 0], [0, 0.5], [-0.325, 0]];

const HEART: Pt[] = [
  [0, 0.5], [0.24, 0.16], [0.38, -0.08], [0.36, -0.32],
  [0.2, -0.44], [0.06, -0.34], [0, -0.26],
  [-0.06, -0.34], [-0.2, -0.44], [-0.36, -0.32],
  [-0.38, -0.08], [-0.24, 0.16],
];

const SPADE: Pt[] = [
  [0, -0.5], [0.24, -0.16], [0.38, 0.08], [0.36, 0.26],
  [0.2, 0.34], [0.07, 0.28], [0, 0.22],
  [-0.07, 0.28], [-0.2, 0.34], [-0.36, 0.26],
  [-0.38, 0.08], [-0.24, -0.16],
];

/** The stem, shared by the spade and the club: a flared foot. */
const STEM: Pt[] = [[-0.075, 0.18], [0.075, 0.18], [0.235, 0.5], [-0.235, 0.5]];

const CLUB_LOBES: [number, number, number][] = [
  [0, -0.26, 0.215],
  [-0.245, 0.07, 0.215],
  [0.245, 0.07, 0.215],
];

export interface PipOptions {
  /** Radians. */
  rot?: number;
  /** A hatched shadow on the ground under it. */
  shadow?: number;
  /** Draw it hollow, for the ones a cat is looking through. */
  hollow?: boolean;
  alpha?: number;
  seed?: number;
}

/**
 * One pip, at a size, with a hand-drawn outline over the fill.
 *
 * The outline is the whole trick. A filled path is a vector; a filled path with
 * a wobbling pen line round it that does not quite agree with the fill is a
 * thing that was printed from a plate somebody cut.
 */
export function pip(pad: Pad, ink: Ink, suit: Suit, at: Pt, size: number, o: PipOptions = {}) {
  const rot = o.rot ?? 0;
  const cos = Math.cos(rot);
  const sin = Math.sin(rot);
  const seed = o.seed ?? Math.round(at[0] * 9173 + at[1] * 6131);
  const r = rng(seed);
  const map = (p: Pt): Pt => [
    at[0] + (p[0] * cos - p[1] * sin) * size,
    at[1] + (p[0] * sin + p[1] * cos) * size,
  ];

  const shadow = o.shadow ?? 0;
  if (shadow > 0) {
    // A little pool of hatch under it, so it is sitting on something.
    const w = size * 0.42;
    pad.clip(
      [
        [at[0] - w, at[1] + size * 0.5],
        [at[0] + w, at[1] + size * 0.5],
        [at[0] + w * 0.7, at[1] + size * 0.5 + shadow],
        [at[0] - w * 0.7, at[1] + size * 0.5 + shadow],
      ],
      () =>
        hatch(
          pad,
          [at[0] - w * 1.2, at[1] + size * 0.4, at[0] + w * 1.2, at[1] + size * 0.6 + shadow],
          fade(ink.hex, 0.5),
          { angle: -0.5, pitch: 90, width: 0.0028 },
        ),
    );
  }

  const alpha = o.alpha ?? 1;
  const body = suit === 'diamonds' ? DIAMOND : suit === 'hearts' ? HEART : suit === 'spades' ? SPADE : null;

  if (body) {
    const path = body.map(map);
    if (!o.hollow) pad.shape(path, ink.hex, { alpha, sharp: suit === 'diamonds' });
    outline(pad, path, ink.hex, {
      width: size * 0.055,
      taper: 0.3,
      wobble: size * 0.02,
      alpha: o.hollow ? alpha : alpha * 0.9,
    });
    if (suit === 'spades') {
      const st = STEM.map(map);
      if (!o.hollow) pad.shape(st, ink.hex, { alpha, sharp: true });
      outline(pad, st, ink.hex, { width: size * 0.05, taper: 0.3, wobble: size * 0.016, alpha });
    }
  } else {
    for (const [lx, ly, lr] of CLUB_LOBES) {
      const c = map([lx, ly]);
      if (!o.hollow) pad.blob(c, lr * size, lr * size, 0, ink.hex, { alpha });
      // A wobbling ring rather than a circle, so the lobes are not three
      // identical discs.
      const ring: Pt[] = [];
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        const k = lr * size * (1 + (r() - 0.5) * 0.05);
        ring.push([c[0] + Math.cos(a) * k, c[1] + Math.sin(a) * k]);
      }
      outline(pad, ring, ink.hex, { width: size * 0.05, taper: 0.25, alpha });
    }
    const st = STEM.map(map);
    if (!o.hollow) pad.shape(st, ink.hex, { alpha, sharp: true });
    outline(pad, st, ink.hex, { width: size * 0.05, taper: 0.3, wobble: size * 0.016, alpha });
  }
}

/**
 * A pip hanging from a line, with a peg.
 *
 * The peg is two lines and a dot and it is the reason the reference reads as
 * washing rather than as bunting.
 */
export function pegged(pad: Pad, ink: Ink, suit: Suit, from: Pt, size: number, sway = 0) {
  const drop = size * 0.42;
  const at: Pt = [from[0] + Math.sin(sway) * drop, from[1] + Math.cos(sway) * drop];
  pip(pad, ink, suit, at, size, { rot: sway });
  const w = size * 0.13;
  for (const side of [-1, 1] as const) {
    stroke(
      pad,
      [
        [from[0] + side * w * 0.5 - Math.sin(sway) * size * 0.06, from[1] - w * 0.9],
        [from[0] + side * w * 0.36 + Math.sin(sway) * size * 0.18, from[1] + w * 1.5],
      ],
      ink.hex,
      { width: size * 0.05, taper: 0.25 },
    );
  }
  pad.blob([from[0], from[1] - w * 0.55], w * 0.2, w * 0.2, 0, ink.hex, { alpha: 0.9 });
}

/**
 * The big ornamental pip an ace gets.
 *
 * Every real deck makes the aces bigger and puts a frame round them, and the
 * ace of spades gets the most ornament of all because it was the one the tax
 * stamp went on. Following that is free and it is the sort of thing that makes
 * a deck feel like a deck.
 */
export function acePip(pad: Pad, ink: Ink, suit: Suit, at: Pt, size: number) {
  // A wreath of small strokes round it, and a hatched shield behind.
  const r = rng(Math.round(size * 1e4) ^ suit.length);
  pad.clip(
    [
      [at[0] - size * 0.5, at[1] - size * 0.62],
      [at[0] + size * 0.5, at[1] - size * 0.62],
      [at[0] + size * 0.56, at[1] + size * 0.2],
      [at[0], at[1] + size * 0.68],
      [at[0] - size * 0.56, at[1] + size * 0.2],
    ],
    () =>
      crosshatch(pad, [at[0] - size * 0.7, at[1] - size * 0.7, at[0] + size * 0.7, at[1] + size * 0.7], fade(ink.hex, 0.3), {
        pitch: 26,
        width: 0.003,
        alpha: 0.5,
      }),
  );
  const shield: Pt[] = [
    [at[0] - size * 0.5, at[1] - size * 0.62],
    [at[0] + size * 0.5, at[1] - size * 0.62],
    [at[0] + size * 0.56, at[1] + size * 0.2],
    [at[0], at[1] + size * 0.68],
    [at[0] - size * 0.56, at[1] + size * 0.2],
  ];
  outline(pad, shield, ink.hex, { width: size * 0.028, taper: 0.2, wobble: size * 0.008 });
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2;
    const k = size * (0.72 + r() * 0.06);
    stroke(
      pad,
      [
        [at[0] + Math.cos(a) * k, at[1] + Math.sin(a) * k * 0.9],
        [at[0] + Math.cos(a) * (k + size * 0.09), at[1] + Math.sin(a) * (k + size * 0.09) * 0.9],
      ],
      ink.hex,
      { width: size * 0.022, taper: 0.6, alpha: 0.75 },
    );
  }
  pip(pad, ink, suit, at, size, {});
}

/** The little glyph next to the rank in the corner. */
export function glyph(pad: Pad, ink: Ink, suit: Suit, at: Pt, size: number) {
  pip(pad, ink, suit, at, size, { seed: 7 });
}
