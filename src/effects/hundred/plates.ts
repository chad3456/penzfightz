import { buildSource, SRC_H, SRC_W, type Field } from './source';
import { drawStyle, STYLES, type Style } from './styles';
import type { Plate } from '../globe/Globe';

/**
 * The hundred, baked.
 *
 * The source is built *once* and handed to every style, which is the whole
 * economy of the thing: the picture costs one draw and a `getImageData`, and
 * the hundred techniques are then a hundred reads of the same two arrays.
 */
export const ASPECT = SRC_W / SRC_H;

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

let cached: { seed: number; field: Field } | null = null;

/** The source, built once and kept, because every style wants the same one. */
export function source(seed: number): Field {
  if (!cached || cached.seed !== seed) cached = { seed, field: buildSource(seed) };
  return cached.field;
}

export async function bakeStyles(list: Style[], seed: number, opts: BakeOptions = {}): Promise<Plate[]> {
  const cell = opts.cell ?? 176;
  const grid = opts.grid ?? 6;
  const per = grid * grid;
  const tall = Math.round(cell / ASPECT);
  const f = source(seed);
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
      drawStyle(g, f, list[i], cell, tall, seed * 13 + i);
      g.restore();
      done++;
      await idle();
      if (k % 6 === 5) {
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

/** The same technique again at size, rather than an atlas cell scaled up. */
export function printStyle(style: Style, seed: number, width: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = Math.round(width / ASPECT);
  const g = canvas.getContext('2d');
  if (g) drawStyle(g, source(seed), style, canvas.width, canvas.height, seed * 13);
  return canvas;
}

export { STYLES };
