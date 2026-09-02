import { drawBeing, type Being } from './figure';
import type { Plate } from '../globe/Globe';

/**
 * Baking two thousand of them.
 *
 * Six Colours put two and a half thousand drawings onto plates in about
 * eighteen seconds and this is the same shape of job, with a heavier drawing:
 * a figure here is two to three thousand canvas strokes, because a crown is a
 * dozen shapes, a beard is several hundred strands and a naga's hood is seven
 * of everything.
 *
 * So the plates are handed back one at a time as they finish rather than at the
 * end. The globe can put up the first hundred and sixty-nine while the rest are
 * still being drawn, which turns a blank wait into a gallery filling up.
 */

export interface BakeOptions {
  cell?: number;
  grid?: number;
  onProgress?: (done: number, total: number) => void;
  onPlate?: (plate: Plate, index: number) => void;
  /**
   * The plate as it is being filled, handed over at every yield.
   *
   * The loader's output tray blits specimens out of this, which costs nothing
   * because the pixels already exist. Without it a gallery that fits on one
   * plate — a hundred portraits, say — has an empty tray for the whole bake
   * and then a full one for a tenth of a second.
   */
  onSheet?: (sheet: { canvas: HTMLCanvasElement; grid: number; used: number; aspect: number }) => void;
  signal?: { cancelled: boolean };
}

const idle = () => new Promise<void>((r) => setTimeout(r, 0));

/** Square, like the picture book it borrows its hand from. */
export const ASPECT = 1;

export async function bakeEpic(cast: Being[], opts: BakeOptions = {}): Promise<Plate[]> {
  const cell = opts.cell ?? 132;
  const grid = opts.grid ?? 13;
  const per = grid * grid;
  const plates: Plate[] = [];
  let done = 0;

  for (let a = 0; a * per < cast.length; a++) {
    const canvas = document.createElement('canvas');
    canvas.width = grid * cell;
    canvas.height = grid * cell;
    const g = canvas.getContext('2d');
    if (!g) break;

    const start = a * per;
    const end = Math.min(cast.length, start + per);
    for (let i = start; i < end; i++) {
      if (opts.signal?.cancelled) throw new Error('cancelled');
      const k = i - start;
      g.save();
      g.translate((k % grid) * cell, Math.floor(k / grid) * cell);
      g.beginPath();
      g.rect(0, 0, cell, cell);
      g.clip();
      drawBeing(g, cast[i], cell, cell);
      g.restore();
      done++;
      if (k % 12 === 11) {
        opts.onSheet?.({ canvas, grid, used: k + 1, aspect: ASPECT });
        opts.onSheet?.({ canvas, grid, used: k + 1, aspect: ASPECT });
        opts.onProgress?.(done, cast.length);
        await idle();
      }
    }

    const plate: Plate = { canvas, grid, used: end - start, aspect: ASPECT };
    plates.push(plate);
    opts.onPlate?.(plate, a);
    opts.onProgress?.(done, cast.length);
    await idle();
  }

  return plates;
}

/** The same figure, drawn again at size rather than scaled up. */
export function printEpic(b: Being, width: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = width;
  const g = canvas.getContext('2d');
  if (g) drawBeing(g, b, width, width);
  return canvas;
}
