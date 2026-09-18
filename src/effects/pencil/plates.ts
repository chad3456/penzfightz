import { ASPECT, drawFace } from './face';
import type { Variant } from './variants';
import type { Plate } from '../globe/Globe';

export { ASPECT };

export interface BakeOptions {
  cell?: number;
  grid?: number;
  seed?: number;
  onProgress?: (done: number, total: number) => void;
  onPlate?: (plate: Plate, index: number) => void;
  onSheet?: (sheet: { canvas: HTMLCanvasElement; grid: number; used: number; aspect: number }) => void;
  signal?: { cancelled: boolean };
}

/**
 * Yield to the browser between faces.
 *
 * A hundred of these is a few seconds of drawing, and done in one synchronous
 * pass it is a few seconds of frozen page. `MessageChannel` gives back a turn
 * of the event loop with none of `setTimeout`'s four-millisecond floor, which
 * over a few hundred yields is most of the wall clock.
 */
const idle: () => Promise<void> =
  typeof MessageChannel === 'undefined'
    ? () => new Promise<void>((r) => setTimeout(r, 0))
    : (() => {
        const ch = new MessageChannel();
        const waiting: (() => void)[] = [];
        ch.port1.onmessage = () => waiting.shift()?.();
        return () => new Promise<void>((r) => { waiting.push(r); ch.port2.postMessage(0); });
      })();

export async function bakeFaces(list: Variant[], opts: BakeOptions = {}): Promise<Plate[]> {
  const cell = opts.cell ?? 176;
  const grid = opts.grid ?? 10;
  const seed = opts.seed ?? 1;
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
      // The seed is the hand, not the face: the same expression drawn again is
      // the same expression, drawn slightly differently.
      const v = list[i]!;
      drawFace(g, v.face, v.who, cell, tall, seed * 131 + i + 1);
      g.restore();
      done++;
      if (k % 4 === 3) await idle();
      if (k % 16 === 15) {
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

/** Drawn again at size, rather than an atlas cell scaled up. */
export function printFace(v: Variant, width: number, seed: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = Math.round(width / ASPECT);
  const g = canvas.getContext('2d');
  if (g) drawFace(g, v.face, v.who, canvas.width, canvas.height, seed);
  return canvas;
}
