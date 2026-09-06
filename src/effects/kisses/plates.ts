import { drawKiss, ASPECT, type Kiss } from './kiss';
import type { Plate } from '../globe/Globe';

/** The hundred kisses, baked into one atlas. */
export { ASPECT };

export interface BakeOptions {
  cell?: number;
  grid?: number;
  onProgress?: (done: number, total: number) => void;
  onPlate?: (plate: Plate, index: number) => void;
  onSheet?: (sheet: { canvas: HTMLCanvasElement; grid: number; used: number; aspect: number }) => void;
  signal?: { cancelled: boolean };
}

const idle: () => Promise<void> =
  typeof MessageChannel === 'undefined'
    ? () => new Promise<void>((r) => setTimeout(r, 0))
    : (() => {
        const ch = new MessageChannel();
        const waiting: (() => void)[] = [];
        ch.port1.onmessage = () => waiting.shift()?.();
        return () => new Promise<void>((r) => { waiting.push(r); ch.port2.postMessage(0); });
      })();

export async function bakeKisses(list: Kiss[], opts: BakeOptions = {}): Promise<Plate[]> {
  const cell = opts.cell ?? 190;
  const grid = opts.grid ?? 10;
  const per = grid * grid;
  const plates: Plate[] = [];
  let done = 0;
  for (let a = 0; a * per < list.length; a++) {
    const canvas = document.createElement('canvas');
    canvas.width = grid * cell;
    canvas.height = grid * cell;
    const g = canvas.getContext('2d');
    if (!g) break;
    const start = a * per;
    const end = Math.min(list.length, start + per);
    for (let i = start; i < end; i++) {
      if (opts.signal?.cancelled) throw new Error('cancelled');
      const k = i - start;
      g.save();
      g.translate((k % grid) * cell, Math.floor(k / grid) * cell);
      g.beginPath();
      g.rect(0, 0, cell, cell);
      g.clip();
      drawKiss(g, list[i], cell, cell);
      g.restore();
      done++;
      if (k % 8 === 7) await idle();
      if (k % 24 === 23) {
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

export function printKiss(k: Kiss, width: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = width;
  const g = canvas.getContext('2d');
  if (g) drawKiss(g, k, width, width);
  return canvas;
}
