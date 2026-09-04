import type { Pt } from '../flat/pad';
import { BLACK, CardPad, RED, edge, press, stock, type Ink } from './ink';
import { numeral, PIPS, RANK_NAME, RANKS, type Rank } from './numeral';
import { glyph, pip, SUIT_NAME, SUITS, type Suit } from './pip';
import { CARD_ASPECT, gagFor, H, type Scene } from './gags';
import type { Cat } from './cat';
import { drawCat } from './cat';

/**
 * One card, start to finish.
 *
 * Order matters and it is the order a card was actually made in: the stock
 * first, then everything the plate carries — indices and picture together,
 * because they came off the same plate — then the cut.
 *
 * The picture and the indices go through `press`, which draws them three
 * times: a soft spread underneath, the impression proper, and a faint ghost a
 * hair out of register. Which means the gag's draw function runs three times,
 * which means it must be a pure function of its seed — and it means the pip
 * count has to be taken on the first pass only, or every card would come out
 * claiming to have three times as many pips as it does.
 */

export interface Card {
  id: string;
  rank: Rank | 'joker';
  suit: Suit | 'red' | 'black';
  name: string;
  joke: string;
  /** How many pips the card is supposed to carry. */
  pips: number;
  red: boolean;
  seed: number;
}

export const DECK: Card[] = (() => {
  const out: Card[] = [];
  let seed = 1301;
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      const gag = gagFor(rank, suit);
      out.push({
        id: `${rank}-${suit}`,
        rank,
        suit,
        name: `${RANK_NAME[rank]} of ${SUIT_NAME[suit]}`,
        joke: gag.joke,
        pips: PIPS[rank],
        red: suit === 'hearts' || suit === 'diamonds',
        seed: (seed += 97),
      });
    }
  }
  out.push({
    id: 'joker-red',
    rank: 'joker',
    suit: 'red',
    name: 'Joker',
    joke: gagFor('joker', 'red').joke,
    pips: 0,
    red: true,
    seed: (seed += 97),
  });
  out.push({
    id: 'joker-black',
    rank: 'joker',
    suit: 'black',
    name: 'Joker',
    joke: gagFor('joker', 'black').joke,
    pips: 0,
    red: false,
    seed: (seed += 97),
  });
  return out;
})();

export { CARD_ASPECT };

/** The corner index, and the same again upside down. */
function indices(pad: CardPad, ink: Ink, card: Card) {
  const suit = (card.rank === 'joker' ? (card.red ? 'hearts' : 'spades') : card.suit) as Suit;
  const put = (x: number, y: number, rot: number) => {
    if (card.rank === 'joker') {
      // A joker's index is the word, set small and vertically, as it always is.
      const letters = ['J', 'K', 'R'];
      letters.forEach((l, i) => {
        numeral(pad, ink, l as Rank, [x, y + (i - 1) * 0.062 * (rot ? -1 : 1)], 0.052, rot);
      });
      return;
    }
    numeral(pad, ink, card.rank as Rank, [x, y], 0.105, rot);
    glyph(pad, ink, suit, [x, y + (rot ? -0.098 : 0.098)], 0.062);
  };
  put(0.086, 0.115, 0);
  put(1 - 0.086, H - 0.115, Math.PI);
}

/**
 * Draw a card into a context, at a size.
 *
 * Returns how many pips actually reached the card, so the caller can check it
 * against the rank. A five with four diamonds on it is not a stylistic choice,
 * it is a misprint, and the only way to be sure is to count what was drawn
 * rather than to trust what was intended.
 */
export function drawCard(g: CanvasRenderingContext2D, card: Card, w: number, h: number): number {
  const pad = new CardPad(g, w, h, card.seed);
  const ink: Ink = card.red ? RED : BLACK;

  g.save();
  g.clearRect(0, 0, w, h);
  stock(pad, ink, card.seed);

  let pass = 0;
  let count = 0;
  const gag = gagFor(card.rank, card.suit);

  const scene: Scene = {
    pad,
    ink,
    suit: (card.rank === 'joker' ? (card.red ? 'hearts' : 'spades') : card.suit) as Suit,
    rank: (card.rank === 'joker' ? 'A' : card.rank) as Rank,
    seed: card.seed,
    put: (at: Pt, size: number, o = {}) => {
      pip(pad, ink, scene.suit, at, size, o);
      if (pass === 0) count++;
    },
    count: (n: number) => {
      if (pass === 0) count += n;
    },
    cat: (c: Cat, weight = 1) => {
      drawCat(pad, ink, c, weight);
      return c;
    },
  };

  press(
    pad,
    () => {
      indices(pad, ink, card);
      gag.draw(scene);
      pass++;
    },
    card.seed,
  );

  edge(pad, ink, card.seed);
  g.restore();
  return count;
}

/**
 * Count every card and report the ones that do not add up.
 *
 * Run for real, into a real context, because the whole point is to check what
 * was *drawn* — a count taken from the gag's intentions would agree with itself
 * no matter how wrong it was.
 */
export function auditDeck(size = 180): { id: string; want: number; got: number }[] {
  const bad: { id: string; want: number; got: number }[] = [];
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = Math.round(size / CARD_ASPECT);
  const g = canvas.getContext('2d');
  if (!g) return bad;
  for (const card of DECK) {
    const got = drawCard(g, card, canvas.width, canvas.height);
    if (got !== card.pips) bad.push({ id: card.id, want: card.pips, got });
  }
  return bad;
}
