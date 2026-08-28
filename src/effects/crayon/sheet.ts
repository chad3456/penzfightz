/**
 * A sheet of paper, and the tooth of it.
 *
 * Everything in this folder is drawn by depositing pigment one pixel at a time
 * into a buffer rather than by asking the canvas for a line. That sounds
 * perverse until you look at what the medium actually is: a wax crayon or an
 * oil stick dragged across rough paper does not lay down a stroke, it lays down
 * pigment **only where the raised tooth of the paper catches it**. The white
 * flecks inside every mark are not noise added afterwards to look distressed —
 * they are the paper showing through, and they are the whole reason the mark
 * reads as a physical object instead of a shape.
 *
 * The consequence that matters: the tooth is a property of the **page**, not of
 * the stroke. Two marks crossing each other skip in the same places, because
 * they are skipping over the same bump. Give every stroke its own private noise
 * and you get a page of independently distressed shapes, which reads as a
 * filter. Sample one field in page coordinates and you get a page.
 */

/** Warm off-white, the colour of cheap cartridge paper. */
export const PAPER = [234, 231, 225] as const;

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export const hexToRgb = (hex: string): Rgb => {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
};

/** Deterministic PRNG, so a sheet can be rebuilt exactly from its seed. */
export function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const hash2 = (x: number, y: number, seed: number) => {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(seed, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

/** Smooth value noise, sampled in page pixels. */
function valueNoise(x: number, y: number, cell: number, seed: number): number {
  const fx = x / cell;
  const fy = y / cell;
  const ix = Math.floor(fx);
  const iy = Math.floor(fy);
  const tx = fx - ix;
  const ty = fy - iy;
  const sx = tx * tx * (3 - 2 * tx);
  const sy = ty * ty * (3 - 2 * ty);
  const a = hash2(ix, iy, seed);
  const b = hash2(ix + 1, iy, seed);
  const c = hash2(ix, iy + 1, seed);
  const d = hash2(ix + 1, iy + 1, seed);
  return (a + (b - a) * sx) * (1 - sy) + (c + (d - c) * sx) * sy;
}

/**
 * Built tooth fields, keyed by size and paper.
 *
 * Two octaves of value noise over every pixel is the single most expensive
 * thing here — at two hundred faces it was more than half the total time, spent
 * regenerating a texture that is supposed to be *the same sheet of paper*. Four
 * papers are built and shared; which one a face gets is part of the face.
 */
const toothCache = new Map<string, Uint8Array>();

/** How many different sheets of paper exist. */
export const PAPERS = 4;

function buildTooth(w: number, h: number, paper: number): Uint8Array {
  const key = `${w}x${h}:${paper}`;
  const hit = toothCache.get(key);
  if (hit) return hit;
  const tooth = new Uint8Array(w * h);
  const seed = 0x51ed + paper * 7919;
  // Grain scale follows the sheet, so a thumbnail and a full-size print have
  // the same *visual* tooth rather than the same pixel tooth.
  const k = Math.max(1, w / 420);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      // Two octaves: a coarse weave and a fine one. The coarse octave is what
      // makes a mark break up in long ragged patches rather than in even
      // stipple, which is the difference between crayon and spray.
      const coarse = valueNoise(x, y, 7.5 * k, seed);
      const fine = valueNoise(x, y, 2.1 * k, seed ^ 0x9e37);
      const speck = hash2(x, y, seed ^ 0x77b1);
      tooth[y * w + x] = Math.round((coarse * 0.5 + fine * 0.34 + speck * 0.16) * 255);
    }
  }
  // Only a handful of sizes are ever asked for; if that stops being true this
  // becomes a leak rather than a cache.
  if (toothCache.size > 24) toothCache.clear();
  toothCache.set(key, tooth);
  return tooth;
}

export class Sheet {
  readonly w: number;
  readonly h: number;
  readonly px: Uint8ClampedArray<ArrayBuffer>;
  private readonly seed: number;
  /** The tooth, one byte a pixel. Shared between every face on the same paper. */
  private readonly tooth: Uint8Array;

  constructor(w: number, h: number, seed: number, paper = 0) {
    this.w = w;
    this.h = h;
    this.seed = seed;
    this.px = new Uint8ClampedArray(new ArrayBuffer(w * h * 4));
    this.tooth = buildTooth(w, h, ((paper % PAPERS) + PAPERS) % PAPERS);

    // Lay the paper down, faintly uneven, because nothing is one flat colour.
    const p = this.px;
    for (let i = 0, n = w * h; i < n; i++) {
      const shade = (this.tooth[i] / 255 - 0.5) * 5;
      p[i * 4] = PAPER[0] + shade;
      p[i * 4 + 1] = PAPER[1] + shade;
      p[i * 4 + 2] = PAPER[2] + shade;
      p[i * 4 + 3] = 255;
    }
  }

  /** The tooth at a page pixel, 0..1. Above the pigment's bite, nothing sticks. */
  at(x: number, y: number): number {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return 1;
    return this.tooth[(y | 0) * this.w + (x | 0)] / 255;
  }

  /** Blend one pixel of pigment in. */
  put(x: number, y: number, c: Rgb, a: number) {
    if (a <= 0 || x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = ((y | 0) * this.w + (x | 0)) * 4;
    const p = this.px;
    p[i] += (c.r - p[i]) * a;
    p[i + 1] += (c.g - p[i + 1]) * a;
    p[i + 2] += (c.b - p[i + 2]) * a;
  }

  toCanvas(target?: HTMLCanvasElement): HTMLCanvasElement {
    const c = target ?? document.createElement('canvas');
    c.width = this.w;
    c.height = this.h;
    const g = c.getContext('2d');
    if (g) g.putImageData(new ImageData(this.px, this.w, this.h), 0, 0);
    return c;
  }

  /** A stable random stream for one sheet, so a face redraws identically. */
  rand(salt = 0) {
    return mulberry(this.seed ^ Math.imul(salt + 1, 0x9e3779b9));
  }
}
