import * as THREE from 'three';
import { Load } from './brush';
import { Wash } from './solver';
import { stagesFor, washSettings, type Painting } from './painting';
import type { Plate } from '../globe/Globe';

/**
 * Where the painting actually happens.
 *
 * One WebGL context, one solver, one buffer, reused for every picture in the
 * gallery. Everything expensive here is per-*sheet* rather than per-painting —
 * the render targets, the float buffer the brush writes into, the paper — so
 * the cost of the thousandth painting is the same as the cost of the first.
 *
 * ### Nothing comes back to the CPU
 *
 * A thousand paintings is a thousand textures to hand the globe, which is a
 * thousand uploads and a thousand draw calls. Instead each painting is composed
 * straight into its own cell of a large canvas by setting the viewport, so a
 * whole plate of a hundred and sixty-nine is built on the GPU and copied off in
 * a single `drawImage`. The pixels cross back once per plate rather than once
 * per painting, and the globe gets six textures for a thousand pictures.
 *
 * ### The three stages are three visits
 *
 * The brush buffer is filled, uploaded and cleared once per stage, with the
 * solver run in between. That is the whole reason the pictures look painted
 * rather than composited: the first stage has forty steps of water to travel
 * through and ends up nowhere near where it was put, and the last has four and
 * stays exactly where it lands.
 */

export interface BakeOptions {
  cell?: number;
  grid?: number;
  /** Simulator steps for a whole painting, shared out between the stages. */
  steps?: number;
  onProgress?: (done: number, total: number) => void;
  /**
   * Called as each atlas finishes.
   *
   * A watercolour takes real work to solve, and a thousand of them is long
   * enough that a progress bar is the wrong answer: the globe can hang the
   * hundred and sixty-nine that are finished while the next plate is still
   * being painted, so the sphere assembles itself in front of you instead of
   * appearing all at once after a wait. It is also the honest picture of what
   * is happening.
   */
  onPlate?: (plate: Plate, index: number) => void;
  signal?: { cancelled: boolean };
}

const idle = () => new Promise<void>((r) => setTimeout(r, 0));

/** Portrait, like every one of the references. Width over height. */
export const ASPECT = 0.75;

export class Studio {
  private renderer: THREE.WebGLRenderer | null = null;
  private wash: Wash | null = null;
  private load: Load | null = null;
  private size: [number, number] = [0, 0];
  readonly ok: boolean;

  constructor() {
    try {
      const canvas = document.createElement('canvas');
      this.renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: false,
        alpha: false,
        // The plate is composed cell by cell across several tasks, so the
        // drawing buffer has to survive between them.
        preserveDrawingBuffer: true,
        powerPreference: 'high-performance',
      });
      // Every pass writes every pixel it owns, and a clear would wipe the cells
      // of the plate already painted.
      this.renderer.autoClear = false;
      this.renderer.setClearColor(0x000000, 0);
      this.ok = true;
    } catch {
      this.renderer = null;
      this.ok = false;
    }
  }

  /** Set up for a sheet of this size, reusing what is already the right shape. */
  private sheet(w: number, h: number) {
    if (!this.renderer) return null;
    if (!this.wash || this.size[0] !== w || this.size[1] !== h) {
      this.wash?.dispose();
      this.load?.dispose();
      this.wash = new Wash(this.renderer, w, h);
      this.load = new Load(w, h, 1);
      this.size = [w, h];
    }
    return this.wash;
  }

  /**
   * Paint one, into whatever viewport is set.
   *
   * `sim` is the resolution the water is solved at and `out` the resolution it
   * is shown at. They are the same for a card and different for a print,
   * because fluid is low frequency and paper is not: solving a print at print
   * resolution costs sixteen times as much and looks softer, not sharper.
   */
  private one(rec: Painting, sim: [number, number], out: [number, number],
    viewport?: [number, number, number, number], steps = 46) {
    const wash = this.sheet(sim[0], sim[1]);
    const load = this.load;
    if (!wash || !load) return;

    load.reseed(rec.seed);
    wash.clear();

    const set = washSettings(rec, steps);
    const stages = stagesFor(rec, ASPECT);
    for (const stage of stages) {
      load.clear();
      stage.draw(load);
      wash.load(load.toTexture(), stage.water * (0.55 + rec.wetness * 0.5));
      wash.run({ ...set, steps: Math.max(2, Math.round(steps * stage.after)) });
    }
    wash.show(set, viewport, out);
  }

  /** A whole gallery, into a handful of atlases. */
  async bake(recs: Painting[], opts: BakeOptions = {}): Promise<Plate[]> {
    const renderer = this.renderer;
    if (!renderer) return [];
    const cell = opts.cell ?? 120;
    const grid = opts.grid ?? 13;
    const steps = opts.steps ?? 46;
    const cellH = Math.round(cell / ASPECT);
    const per = grid * grid;
    const plates: Plate[] = [];
    let done = 0;

    renderer.setSize(grid * cell, grid * cellH, false);

    for (let a = 0; a * per < recs.length; a++) {
      const start = a * per;
      const end = Math.min(recs.length, start + per);
      renderer.setRenderTarget(null);
      renderer.setScissorTest(false);
      renderer.setViewport(0, 0, grid * cell, grid * cellH);
      renderer.setClearColor(0xffffff, 1);
      renderer.clear(true, false, false);

      for (let i = start; i < end; i++) {
        if (opts.signal?.cancelled) throw new Error('cancelled');
        const k = i - start;
        const col = k % grid;
        const row = Math.floor(k / grid);
        // GL counts rows from the bottom; the atlas is read from the top.
        const y = (grid - 1 - row) * cellH;
        this.one(recs[i], [cell, cellH], [cell, cellH], [col * cell, y, cell, cellH], steps);
        done++;
        if (k % 8 === 7) {
          opts.onProgress?.(done, recs.length);
          await idle();
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = grid * cell;
      canvas.height = grid * cellH;
      const g = canvas.getContext('2d');
      if (!g) break;
      g.drawImage(renderer.domElement, 0, 0);
      const plate: Plate = { canvas, grid, used: end - start, aspect: ASPECT };
      plates.push(plate);
      opts.onPlate?.(plate, a);
      opts.onProgress?.(done, recs.length);
      await idle();
    }

    renderer.setRenderTarget(null);
    return plates;
  }

  /** One painting, big, on its own sheet. */
  print(rec: Painting, width: number, steps?: number): HTMLCanvasElement | null {
    const renderer = this.renderer;
    if (!renderer) return null;
    const height = Math.round(width / ASPECT);
    // A third of the resolution for the water, all of it for the paper. Fluid
    // is low frequency and grain is not, and solving the water at print size
    // costs nine times as much for a result that is softer rather than
    // sharper. Steps go up with the grid so the bleeding covers the same
    // fraction of the picture — see `Wash.run`.
    const simW = Math.max(120, Math.min(300, Math.round(width / 3)));
    const simH = Math.round(simW / ASPECT);
    const n = steps ?? Math.round(46 * (simW / 120));
    renderer.setSize(width, height, false);
    renderer.setRenderTarget(null);
    renderer.setScissorTest(false);
    renderer.setViewport(0, 0, width, height);
    renderer.setClearColor(0xffffff, 1);
    renderer.clear(true, false, false);
    this.one(rec, [simW, simH], [width, height], [0, 0, width, height], n);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d')?.drawImage(renderer.domElement, 0, 0);
    return canvas;
  }

  dispose() {
    this.wash?.dispose();
    this.load?.dispose();
    this.renderer?.dispose();
    this.renderer = null;
    this.wash = null;
  }
}
