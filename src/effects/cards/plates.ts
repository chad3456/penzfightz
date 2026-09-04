import { CARD_ASPECT, DECK, drawCard, type Card } from './card';
import type { Plate } from '../globe/Globe';

/**
 * Baking fifty-four cards into an atlas.
 *
 * A card is roughly four thousand strokes — the stock alone is fifteen hundred
 * flecks, and the press draws the whole plate three times — so the bake yields
 * after every card rather than after every row. Fifty-four of them back to back
 * would hold the main thread for several seconds, and the loader is there to be
 * watched, not to be a frozen picture of a loader.
 */

export interface BakeOptions {
  cell?: number;
  grid?: number;
  onProgress?: (done: number, total: number) => void;
  onPlate?: (plate: Plate, index: number) => void;
  onSheet?: (sheet: { canvas: HTMLCanvasElement; grid: number; used: number; aspect: number }) => void;
  signal?: { cancelled: boolean };
}

const idle = () => new Promise<void>((r) => setTimeout(r, 0));

export const ASPECT = CARD_ASPECT;

export async function bakeDeck(cards: Card[] = DECK, opts: BakeOptions = {}): Promise<Plate[]> {
  const cellW = opts.cell ?? 232;
  const cellH = Math.round(cellW / CARD_ASPECT);
  const grid = opts.grid ?? 8;
  const per = grid * grid;
  const plates: Plate[] = [];
  let done = 0;

  for (let a = 0; a * per < cards.length; a++) {
    const canvas = document.createElement('canvas');
    canvas.width = grid * cellW;
    canvas.height = grid * cellH;
    const g = canvas.getContext('2d');
    if (!g) break;

    const start = a * per;
    const end = Math.min(cards.length, start + per);
    for (let i = start; i < end; i++) {
      if (opts.signal?.cancelled) throw new Error('cancelled');
      const k = i - start;
      g.save();
      g.translate((k % grid) * cellW, Math.floor(k / grid) * cellH);
      g.beginPath();
      g.rect(0, 0, cellW, cellH);
      g.clip();
      drawCard(g, cards[i], cellW, cellH);
      g.restore();
      done++;
      opts.onSheet?.({ canvas, grid, used: k + 1, aspect: ASPECT });
      opts.onProgress?.(done, cards.length);
      await idle();
    }

    const plate: Plate = { canvas, grid, used: end - start, aspect: ASPECT };
    plates.push(plate);
    opts.onPlate?.(plate, a);
    opts.onProgress?.(done, cards.length);
    await idle();
  }
  return plates;
}

/** The same card again at size, rather than a scaled-up atlas cell. */
export function printCard(card: Card, width: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = Math.round(width / CARD_ASPECT);
  const g = canvas.getContext('2d');
  if (g) drawCard(g, card, canvas.width, canvas.height);
  return canvas;
}
