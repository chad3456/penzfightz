import { drawBreath, ASPECT, type Look } from './figure';
import type { Plate } from '../globe/Globe';

/** The hundred, baked into atlases of portrait-format cells. */
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

export async function bakeBreath(list: Look[], opts: BakeOptions = {}): Promise<Plate[]> {
  const cell = opts.cell ?? 168;
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
      drawBreath(g, list[i], cell, tall);
      g.restore();
      done++;
      if (k % 6 === 5) await idle();
      if (k % 20 === 19) {
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
export function printBreath(v: Look, width: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = Math.round(width / ASPECT);
  const g = canvas.getContext('2d');
  if (g) drawBreath(g, v, canvas.width, canvas.height);
  return canvas;
}
