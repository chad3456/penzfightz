/**
 * The noise the ground is made of.
 *
 * Simplex rather than Perlin, and written out here rather than pulled in,
 * because the terrain needs the *same* function in two places that cannot share
 * a library: JavaScript, to know where the ground is when a road is dropped on
 * it, and GLSL, to shade it. A generator whose height differs between the
 * simulation and the picture is a generator that puts buildings underwater.
 *
 * So the rule for this file is that everything in it has a GLSL twin, and the
 * twin is written from the same constants.
 */

const F2 = 0.5 * (Math.sqrt(3) - 1);
const G2 = (3 - Math.sqrt(3)) / 6;

const GRAD = new Int8Array([1, 1, -1, 1, 1, -1, -1, -1, 1, 0, -1, 0, 0, 1, 0, -1]);

/** A permutation table, seeded, doubled so the index never has to wrap. */
export function permutation(seed: number): Uint8Array {
  const p = new Uint8Array(512);
  const src = new Uint8Array(256);
  for (let i = 0; i < 256; i++) src[i] = i;
  let a = (seed ^ 0x9e3779b9) >>> 0;
  const rnd = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [src[i], src[j]] = [src[j], src[i]];
  }
  for (let i = 0; i < 512; i++) p[i] = src[i & 255];
  return p;
}

export function simplex2(p: Uint8Array, xin: number, yin: number): number {
  const s = (xin + yin) * F2;
  const i = Math.floor(xin + s);
  const j = Math.floor(yin + s);
  const t = (i + j) * G2;
  const x0 = xin - (i - t);
  const y0 = yin - (j - t);
  const i1 = x0 > y0 ? 1 : 0;
  const j1 = x0 > y0 ? 0 : 1;
  const x1 = x0 - i1 + G2;
  const y1 = y0 - j1 + G2;
  const x2 = x0 - 1 + 2 * G2;
  const y2 = y0 - 1 + 2 * G2;
  const ii = i & 255;
  const jj = j & 255;

  const corner = (x: number, y: number, gi: number) => {
    let t0 = 0.5 - x * x - y * y;
    if (t0 < 0) return 0;
    t0 *= t0;
    const g = (gi % 8) * 2;
    return t0 * t0 * (GRAD[g] * x + GRAD[g + 1] * y);
  };

  return (
    70 *
    (corner(x0, y0, p[ii + p[jj]]) +
      corner(x1, y1, p[ii + i1 + p[jj + j1]]) +
      corner(x2, y2, p[ii + 1 + p[jj + 1]]))
  );
}

export interface FbmOptions {
  octaves?: number;
  lacunarity?: number;
  gain?: number;
}

export function fbm(p: Uint8Array, x: number, y: number, o: FbmOptions = {}): number {
  const oct = o.octaves ?? 5;
  const lac = o.lacunarity ?? 2.03;
  const gain = o.gain ?? 0.5;
  let sum = 0;
  let amp = 1;
  let norm = 0;
  let fx = x;
  let fy = y;
  for (let i = 0; i < oct; i++) {
    sum += simplex2(p, fx, fy) * amp;
    norm += amp;
    amp *= gain;
    fx *= lac;
    fy *= lac;
  }
  return sum / norm;
}

/**
 * Ridged noise, for the hills behind the bay.
 *
 * `1 - |n|` makes a crease where the field crosses zero, and squaring it turns
 * the crease into a ridge with soft flanks. It is the one cheap trick that
 * makes a range of hills look like erosion happened to it rather than like a
 * duvet.
 */
export function ridge(p: Uint8Array, x: number, y: number, octaves = 4): number {
  let sum = 0;
  let amp = 0.5;
  let norm = 0;
  let fx = x;
  let fy = y;
  let prev = 1;
  for (let i = 0; i < octaves; i++) {
    let n = 1 - Math.abs(simplex2(p, fx, fy));
    n *= n;
    n *= prev;
    prev = n;
    sum += n * amp;
    norm += amp;
    amp *= 0.5;
    fx *= 2.07;
    fy *= 2.07;
  }
  return sum / norm;
}

export const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
export const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a || 1e-6), 0, 1);
  return t * t * (3 - 2 * t);
};
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
