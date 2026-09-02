import { drawSubject, type Subject } from './subject';
import type { Plate } from '../globe/Globe';

/**
 * Baking the gallery into atlases.
 *
 * The same arrangement the scenes and the watercolours use, and by far the
 * cheapest of the three: a drawing here is a couple of hundred canvas paths and
 * costs a millisecond or two, against five for a crayon scene and a hundred and
 * eighty for a solved wash. That is the medium being honest about itself —
 * there is nothing to simulate, so there is nothing to pay for.
 *
 * Each drawing is composed straight into its cell with a clip and a translate,
 * so a plate of a hundred and sixty-nine is one canvas and one texture upload
 * rather than a hundred and sixty-nine of each.
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

/** Portrait, like every one of the references. */
export const ASPECT = 0.75;

export async function bakeFlat(subs: Subject[], opts: BakeOptions = {}): Promise<Plate[]> {
  const cell = opts.cell ?? 132;
  const grid = opts.grid ?? 13;
  const cellH = Math.round(cell / ASPECT);
  const per = grid * grid;
  const plates: Plate[] = [];
  let done = 0;

  for (let a = 0; a * per < subs.length; a++) {
    const canvas = document.createElement('canvas');
    canvas.width = grid * cell;
    canvas.height = grid * cellH;
    const g = canvas.getContext('2d');
    if (!g) break;
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, canvas.width, canvas.height);

    const start = a * per;
    const end = Math.min(subs.length, start + per);
    for (let i = start; i < end; i++) {
      if (opts.signal?.cancelled) throw new Error('cancelled');
      const k = i - start;
      g.save();
      g.translate((k % grid) * cell, Math.floor(k / grid) * cellH);
      g.beginPath();
      g.rect(0, 0, cell, cellH);
      g.clip();
      drawSubject(g, subs[i], cell, cellH);
      g.restore();
      done++;
      if (k % 24 === 23) {
        opts.onSheet?.({ canvas, grid, used: k + 1, aspect: ASPECT });
        opts.onSheet?.({ canvas, grid, used: k + 1, aspect: ASPECT });
        opts.onProgress?.(done, subs.length);
        await idle();
      }
    }

    const plate: Plate = { canvas, grid, used: end - start, aspect: ASPECT };
    plates.push(plate);
    opts.onPlate?.(plate, a);
    opts.onProgress?.(done, subs.length);
    await idle();
  }

  return plates;
}

/** One drawing on its own sheet, for the print view. */
export function printFlat(sub: Subject, width: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = Math.round(width / ASPECT);
  const g = canvas.getContext('2d');
  if (g) drawSubject(g, sub, canvas.width, canvas.height);
  return canvas;
}
