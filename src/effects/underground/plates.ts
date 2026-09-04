import { drawPanel, ASPECT } from './panel';
import type { Joke } from './joke';
import type { Plate } from '../globe/Globe';

/**
 * A thousand panels, baked in sheets.
 *
 * A panel is about two thousand marks — the paper alone is nine hundred flecks,
 * and a street has snow on it twice — so the bake yields every few panels
 * rather than every plate. A thousand of them back to back would hold the main
 * thread for the better part of a minute, and the loader exists to be watched.
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

const idle = () => new Promise<void>((r) => setTimeout(r, 0));

export async function bakePanels(jokes: Joke[], opts: BakeOptions = {}): Promise<Plate[]> {
  const cell = opts.cell ?? 164;
  const grid = opts.grid ?? 10;
  const per = grid * grid;
  const plates: Plate[] = [];
  let done = 0;

  for (let a = 0; a * per < jokes.length; a++) {
    const canvas = document.createElement('canvas');
    canvas.width = grid * cell;
    canvas.height = grid * cell;
    const g = canvas.getContext('2d');
    if (!g) break;

    const start = a * per;
    const end = Math.min(jokes.length, start + per);
    for (let i = start; i < end; i++) {
      if (opts.signal?.cancelled) throw new Error('cancelled');
      const k = i - start;
      g.save();
      g.translate((k % grid) * cell, Math.floor(k / grid) * cell);
      g.beginPath();
      g.rect(0, 0, cell, cell);
      g.clip();
      drawPanel(g, jokes[i], cell, cell);
      g.restore();
      done++;
      if (k % 5 === 4) {
        opts.onSheet?.({ canvas, grid, used: k + 1, aspect: ASPECT });
        opts.onProgress?.(done, jokes.length);
        await idle();
      }
    }

    const plate: Plate = { canvas, grid, used: end - start, aspect: ASPECT };
    plates.push(plate);
    opts.onPlate?.(plate, a);
    opts.onProgress?.(done, jokes.length);
    await idle();
  }
  return plates;
}

/** The same panel again at size, rather than an atlas cell scaled up. */
export function printPanel(joke: Joke, width: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = Math.round(width / ASPECT);
  const g = canvas.getContext('2d');
  if (g) drawPanel(g, joke, canvas.width, canvas.height);
  return canvas;
}
