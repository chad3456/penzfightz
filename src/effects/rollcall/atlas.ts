import p5 from 'p5';
import { drawItem } from './item';
import type { Seat } from './census';

/**
 * Baking a thousand faces into texture atlases.
 *
 * A thousand separate canvas textures is a thousand GPU uploads and a thousand
 * draw calls, and about sixty megabytes of texture memory for something that is
 * mostly cream paper. So the faces are drawn in blocks into a handful of large
 * canvases and the wall reads cells out of those, which turns the whole census
 * into one draw call per atlas.
 *
 * The baking is chunked and yields to the browser between blocks. Drawing a
 * thousand hand-wobbled faces takes long enough that doing it in one go locks
 * the tab, and a progress bar that never paints is worse than a slow one.
 */

export interface Atlas {
  canvas: HTMLCanvasElement;
  /** Cells across and down. */
  grid: number;
  /** How many of this atlas's cells are actually filled. */
  used: number;
}

export interface BakeOptions {
  /** Pixels per face. 128 is plenty at wall distance. */
  cell?: number;
  /** Cells per side of one atlas. */
  grid?: number;
  onProgress?: (done: number, total: number) => void;
  signal?: { cancelled: boolean };
}

const idle = () => new Promise<void>((r) => setTimeout(r, 0));

export async function bakeAtlases(seats: Seat[], opts: BakeOptions = {}): Promise<Atlas[]> {
  const cell = opts.cell ?? 100;
  const grid = opts.grid ?? 20;
  const perAtlas = grid * grid;
  const atlasCount = Math.ceil(seats.length / perAtlas);
  const out: Atlas[] = [];

  // One hidden p5 instance owns all the graphics buffers; spinning one up per
  // atlas is pure overhead.
  const holder = document.createElement('div');
  holder.style.display = 'none';
  document.body.appendChild(holder);

  const q: p5 = await new Promise((resolve) => {
    const sketch = new p5((s: p5) => {
      s.setup = () => {
        s.createCanvas(1, 1);
        s.noLoop();
        resolve(sketch);
      };
    }, holder);
  });

  try {
    let done = 0;
    for (let a = 0; a < atlasCount; a++) {
      const g = q.createGraphics(grid * cell, grid * cell);
      g.pixelDensity(1);
      // Left transparent on purpose. Filling the cell with paper turns the wall
      // into a grid of tiles; with alpha the faces stand on the room's own
      // background and the gaps disappear.
      g.clear();
      const start = a * perAtlas;
      const end = Math.min(seats.length, start + perAtlas);

      for (let i = start; i < end; i++) {
        if (opts.signal?.cancelled) throw new Error('cancelled');
        const k = i - start;
        const cx = (k % grid) * cell + cell / 2;
        const cy = Math.floor(k / grid) * cell + cell / 2;
        g.push();
        g.translate(cx, cy);
        drawItem(g as unknown as p5, seats[i].genome, cell * 0.86, { colour: true });
        g.pop();
        done++;
        // Yield often enough that the progress bar actually moves.
        if (k % 32 === 31) {
          opts.onProgress?.(done, seats.length);
          await idle();
        }
      }

      // p5.Graphics keeps its backing canvas on `elt`; the typings do not
      // surface it, so this is the one place the shape is asserted.
      const backing = (g as unknown as { elt: HTMLCanvasElement }).elt;
      out.push({ canvas: backing, grid, used: end - start });
      opts.onProgress?.(done, seats.length);
      await idle();
    }
  } finally {
    // The graphics canvases outlive the sketch; only the host goes.
    holder.remove();
  }

  return out;
}
