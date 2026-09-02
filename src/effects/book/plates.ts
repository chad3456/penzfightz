import { drawPortrait, type Person } from './portrait';
import type { Plate } from '../globe/Globe';

/**
 * Baking the hundred into one atlas.
 *
 * A hundred is small enough that the whole cast fits on a single 10×10 sheet
 * and there is no progressive loading worth writing. It still yields between
 * rows: a portrait is about fifteen hundred canvas strokes — the fibre is not
 * free — and a hundred of them back to back would hold the main thread for
 * long enough to be felt.
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

/** Square, like every one of the references. */
export const ASPECT = 1;

export async function bakeBook(people: Person[], opts: BakeOptions = {}): Promise<Plate[]> {
  const cell = opts.cell ?? 168;
  const grid = opts.grid ?? 10;
  const per = grid * grid;
  const plates: Plate[] = [];
  let done = 0;

  for (let a = 0; a * per < people.length; a++) {
    const canvas = document.createElement('canvas');
    canvas.width = grid * cell;
    canvas.height = grid * cell;
    const g = canvas.getContext('2d');
    if (!g) break;

    const start = a * per;
    const end = Math.min(people.length, start + per);
    for (let i = start; i < end; i++) {
      if (opts.signal?.cancelled) throw new Error('cancelled');
      const k = i - start;
      g.save();
      g.translate((k % grid) * cell, Math.floor(k / grid) * cell);
      g.beginPath();
      g.rect(0, 0, cell, cell);
      g.clip();
      drawPortrait(g, people[i], cell, cell);
      g.restore();
      done++;
      if (k % 8 === 7) {
        opts.onSheet?.({ canvas, grid, used: k + 1, aspect: ASPECT });
        opts.onSheet?.({ canvas, grid, used: k + 1, aspect: ASPECT });
        opts.onProgress?.(done, people.length);
        await idle();
      }
    }

    const plate: Plate = { canvas, grid, used: end - start, aspect: ASPECT };
    plates.push(plate);
    opts.onPlate?.(plate, a);
    opts.onProgress?.(done, people.length);
    await idle();
  }

  return plates;
}

/** The same portrait, drawn again at size rather than scaled up. */
export function printBook(person: Person, width: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = width;
  const g = canvas.getContext('2d');
  if (g) drawPortrait(g, person, width, width);
  return canvas;
}
