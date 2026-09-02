import { drawScene, type SceneRecipe } from './scene';
import type { Plate } from '../globe/Globe';

/**
 * Baking scenes into texture plates.
 *
 * A globe shows everything at once, so unlike the walls there is no laziness to
 * hide behind: every card has to exist before the first frame. A thousand
 * separate canvas textures is a thousand GPU uploads, so the scenes go into a
 * handful of large canvases and the globe reads cells out of them, which turns
 * the whole gallery into a draw call per plate.
 *
 * Baking is chunked and yields to the browser between blocks. A thousand
 * hand-grained drawings takes long enough that doing it in one go locks the
 * tab, and a progress bar that never paints is worse than a slow one.
 */

export interface BakeOptions {
  /** Cell width in pixels. Height follows the aspect. */
  cell?: number;
  /** Cells per side of one plate. */
  grid?: number;
  aspect?: number;
  onProgress?: (done: number, total: number) => void;
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

export async function bakeScenes(recs: SceneRecipe[], opts: BakeOptions = {}): Promise<Plate[]> {
  const cell = opts.cell ?? 144;
  const grid = opts.grid ?? 14;
  const aspect = opts.aspect ?? 1.3;
  const cellH = Math.round(cell / aspect);
  const per = grid * grid;
  const plates: Plate[] = [];
  let done = 0;

  for (let a = 0; a * per < recs.length; a++) {
    const canvas = document.createElement('canvas');
    canvas.width = grid * cell;
    canvas.height = grid * cellH;
    const g = canvas.getContext('2d');
    if (!g) break;
    const start = a * per;
    const end = Math.min(recs.length, start + per);

    for (let i = start; i < end; i++) {
      if (opts.signal?.cancelled) throw new Error('cancelled');
      const k = i - start;
      const sheet = drawScene(recs[i], cell, cellH);
      g.putImageData(
        new ImageData(sheet.px, cell, cellH),
        (k % grid) * cell,
        Math.floor(k / grid) * cellH,
      );
      done++;
      // Often enough that the progress bar actually moves.
      if (k % 16 === 15) {
        opts.onSheet?.({ canvas, grid, used: k + 1, aspect: aspect });
        opts.onProgress?.(done, recs.length);
        await idle();
      }
    }

    plates.push({ canvas, grid, used: end - start, aspect });
    opts.onProgress?.(done, recs.length);
    await idle();
  }

  return plates;
}
