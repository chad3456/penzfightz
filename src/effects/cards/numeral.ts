import { Pad, type Pt } from '../flat/pad';
import { stroke, type Ink } from './ink';

/**
 * The index, drawn rather than typed.
 *
 * A card index in a typeface is the single fastest way to make a hand-cut deck
 * look like a web page. These are pen strokes in a unit box — 1 wide, 1.35 tall,
 * origin at the top left — so they take the same wobble and the same taper as
 * every other line on the card and come off the same plate.
 *
 * The forms follow a card index rather than a text numeral: flat-topped 5, open
 * 4, a 7 with no bar, a 10 whose 1 and 0 are tucked together tighter than any
 * typesetter would allow, because the corner of a card is narrow and always has
 * been.
 */

type Glyph = Pt[][];

const G: Record<string, Glyph> = {
  A: [
    [[0.5, 0], [0.06, 1.35]],
    [[0.5, 0], [0.94, 1.35]],
    [[0.2, 0.92], [0.8, 0.92]],
  ],
  '2': [
    [[0.08, 0.3], [0.22, 0.06], [0.6, 0.02], [0.86, 0.22], [0.82, 0.52], [0.5, 0.82], [0.06, 1.32]],
    [[0.06, 1.32], [0.92, 1.32]],
  ],
  '3': [
    [[0.08, 0.16], [0.42, 0.0], [0.82, 0.14], [0.8, 0.46], [0.44, 0.62]],
    [[0.44, 0.62], [0.86, 0.76], [0.88, 1.16], [0.46, 1.35], [0.08, 1.2]],
  ],
  '4': [
    [[0.7, 0.02], [0.04, 0.94], [0.96, 0.94]],
    [[0.7, 0.02], [0.7, 1.35]],
  ],
  '5': [
    [[0.88, 0.04], [0.18, 0.04]],
    [[0.18, 0.04], [0.12, 0.56]],
    [[0.12, 0.56], [0.5, 0.46], [0.88, 0.66], [0.86, 1.1], [0.44, 1.35], [0.06, 1.2]],
  ],
  '6': [
    [[0.82, 0.06], [0.4, 0.06], [0.12, 0.42], [0.1, 1.0], [0.36, 1.34], [0.72, 1.3], [0.88, 0.98], [0.7, 0.68], [0.3, 0.66], [0.11, 0.86]],
  ],
  '7': [
    [[0.06, 0.05], [0.94, 0.05]],
    [[0.94, 0.05], [0.36, 1.35]],
  ],
  '8': [
    [[0.5, 0.02], [0.82, 0.2], [0.76, 0.52], [0.5, 0.66], [0.22, 0.52], [0.18, 0.2], [0.5, 0.02]],
    [[0.5, 0.66], [0.86, 0.86], [0.88, 1.2], [0.5, 1.34], [0.12, 1.2], [0.14, 0.86], [0.5, 0.66]],
  ],
  '9': [
    [[0.14, 1.3], [0.56, 1.3], [0.86, 0.94], [0.88, 0.36], [0.62, 0.02], [0.26, 0.06], [0.1, 0.38], [0.28, 0.68], [0.68, 0.7], [0.87, 0.5]],
  ],
  '10': [
    [[0.0, 0.16], [0.16, 0.02], [0.16, 1.35]],
    [[0.02, 1.35], [0.32, 1.35]],
    [[0.66, 0.04], [0.44, 0.34], [0.44, 1.0], [0.66, 1.33], [0.9, 1.0], [0.9, 0.34], [0.66, 0.04]],
  ],
  J: [
    [[0.76, 0.02], [0.76, 1.02], [0.56, 1.33], [0.22, 1.3], [0.08, 1.02]],
    [[0.5, 0.02], [0.96, 0.02]],
  ],
  Q: [
    [[0.5, 0.02], [0.86, 0.28], [0.88, 0.98], [0.5, 1.28], [0.14, 0.98], [0.12, 0.28], [0.5, 0.02]],
    [[0.6, 0.96], [0.96, 1.35]],
  ],
  K: [
    [[0.12, 0.02], [0.12, 1.35]],
    [[0.9, 0.02], [0.14, 0.72]],
    [[0.36, 0.54], [0.92, 1.35]],
  ],
};

export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

/** How many pips a card of this rank carries. Courts carry none. */
export const PIPS: Record<Rank, number> = {
  A: 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, J: 0, Q: 0, K: 0,
};

export const RANK_NAME: Record<Rank, string> = {
  A: 'Ace', '2': 'Two', '3': 'Three', '4': 'Four', '5': 'Five', '6': 'Six', '7': 'Seven',
  '8': 'Eight', '9': 'Nine', '10': 'Ten', J: 'Jack', Q: 'Queen', K: 'King',
};

/**
 * Draw a rank at a height, centred on `at` horizontally and hung from it.
 *
 * `10` is drawn narrower than the rest, because it is the only two-character
 * index and a card corner has never had room for it.
 */
export function numeral(pad: Pad, ink: Ink, rank: Rank, at: Pt, height: number, rot = 0) {
  const g = G[rank];
  if (!g) return;
  const wide = rank === '10' ? 1.02 : 0.62;
  const w = height * wide;
  const cos = Math.cos(rot);
  const sin = Math.sin(rot);
  const map = (p: Pt): Pt => {
    const x = (p[0] - 0.5) * w;
    const y = (p[1] / 1.35 - 0.5) * height;
    return [at[0] + x * cos - y * sin, at[1] + x * sin + y * cos];
  };
  for (const run of g) {
    stroke(pad, run.map(map), ink.hex, {
      width: height * 0.13,
      taper: 0.36,
      wobble: height * 0.012,
      cap: 'round',
    });
  }
}
