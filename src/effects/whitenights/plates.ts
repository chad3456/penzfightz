import { drawCard, ASPECT } from './card';
import type { Line } from './lines';
import type { Plate } from '../globe/Globe';

/**
 * A thousand cards, baked in sheets.
 *
 * A card is a portrait and a page of handwriting, and the handwriting alone is
 * several hundred filled polygons, so the bake yields inside the sheet rather
 * than between sheets. The loader exists to be watched.
 */

export { ASPECT };

export interface BakeOptions {
  cell?: number;
  grid?: number;
  onProgress?: (done: number, total: number) => void;
  onPlate?: (plate: Plate, index: number) => void;
  onSheet?: (sheet: { canvas: HTMLCanvasElement; grid: number; used: number; aspect: number }) => void;
  signal?: { cancelled: boolean };
}

/**
 * Hand the main thread back, without paying for it.
 *
 * `setTimeout(r, 0)` is the obvious way and it is a trap: the HTML spec clamps
 * nested timeouts to four milliseconds, and a page the browser has decided is
 * not visible gets clamped to a *second* or more. A bake that yields every few
 * cards then spends all its time waiting rather than drawing — measured here at
 * one and a half cards a second against a hundred and forty when the same
 * drawing is run straight through.
 *
 * A message posted to yourself is a macrotask like any other, so paint and
 * input still get their turn, but nothing clamps it.
 */
const idle: () => Promise<void> =
  typeof MessageChannel === 'undefined'
    ? () => new Promise<void>((r) => setTimeout(r, 0))
    : (() => {
        const ch = new MessageChannel();
        const waiting: (() => void)[] = [];
        ch.port1.onmessage = () => waiting.shift()?.();
        return () =>
          new Promise<void>((r) => {
            waiting.push(r);
            ch.port2.postMessage(0);
          });
      })();

export async function bakeCards(list: Line[], opts: BakeOptions = {}): Promise<Plate[]> {
  const cell = opts.cell ?? 150;
  const grid = opts.grid ?? 10;
  const per = grid * grid;
  const tall = Math.round(cell / ASPECT);
  const plates: Plate[] = [];
  let done = 0;

  for (let a = 0; a * per < list.length; a++) {
    const canvas = document.createElement('canvas');
    canvas.width = grid * cell;
    canvas.height = grid * tall;
    const g = canvas.getContext('2d');
    if (!g) break;

    const start = a * per;
    const end = Math.min(list.length, start + per);
    for (let i = start; i < end; i++) {
      if (opts.signal?.cancelled) throw new Error('cancelled');
      const k = i - start;
      g.save();
      g.translate((k % grid) * cell, Math.floor(k / grid) * tall);
      g.beginPath();
      g.rect(0, 0, cell, tall);
      g.clip();
      drawCard(g, list[i], cell, tall);
      g.restore();
      done++;
      // Yielding and *showing* are two different frequencies. A yield is a
      // setTimeout; showing means a React render and a full-atlas blit into the
      // loader's preview, and doing that every few cards costs more than the
      // drawing does — it was the whole reason the bake ran at one a second
      // rather than ninety.
      if (k % 5 === 4) await idle();
      if (k % 25 === 24) {
        opts.onSheet?.({ canvas, grid, used: k + 1, aspect: ASPECT });
        opts.onProgress?.(done, list.length);
      }
    }

    const plate: Plate = { canvas, grid, used: end - start, aspect: ASPECT };
    plates.push(plate);
    opts.onPlate?.(plate, a);
    opts.onProgress?.(done, list.length);
    await idle();
  }
  return plates;
}

/** The same card again at size, rather than an atlas cell scaled up. */
export function printCard(line: Line, width: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = Math.round(width / ASPECT);
  const g = canvas.getContext('2d');
  if (g) drawCard(g, line, canvas.width, canvas.height);
  return canvas;
}
