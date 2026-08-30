import * as THREE from 'three';

/**
 * The sheet.
 *
 * Cold-press rag paper is not a flat surface with a noise texture printed on
 * it — it is a *height field*, and every interesting thing water does on it is
 * a consequence of that. Pigment rolls downhill into the pits and granulates
 * there. Water runs along the valleys and stalls on the ridges, so the edge of
 * a wash is ragged at exactly the scale of the tooth. And where the sizing is
 * thin the sheet drinks faster, which is why a real wash dries in blotches
 * rather than evenly.
 *
 * So one texture carries all three:
 *
 * - **red** — height. The tooth. Drives granulation and the ragged edge.
 * - **green** — absorbency. Low frequency, because sizing varies over
 *   centimetres, not millimetres. Drives how fast the sheet dries.
 * - **blue** — fibre. Faint long streaks from the mould. Almost invisible on
 *   its own and immediately missed when it is not there.
 *
 * One sheet is generated per session and tiled. Every painting is on paper from
 * the same block, which is what a real study would be, and it saves generating
 * a couple of hundred million pixels of noise for a thousand pictures.
 */

const SIZE = 512;

function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Value noise on a wrapping lattice, so the sheet tiles without a seam. */
function lattice(cells: number, seed: number): (x: number, y: number) => number {
  const rnd = mulberry(seed);
  const g = new Float32Array(cells * cells);
  for (let i = 0; i < g.length; i++) g[i] = rnd();
  const fade = (t: number) => t * t * (3 - 2 * t);
  return (x, y) => {
    const fx = x * cells;
    const fy = y * cells;
    const x0 = Math.floor(fx);
    const y0 = Math.floor(fy);
    const tx = fade(fx - x0);
    const ty = fade(fy - y0);
    const i0 = ((x0 % cells) + cells) % cells;
    const j0 = ((y0 % cells) + cells) % cells;
    const i1 = (i0 + 1) % cells;
    const j1 = (j0 + 1) % cells;
    const a = g[j0 * cells + i0] * (1 - tx) + g[j0 * cells + i1] * tx;
    const b = g[j1 * cells + i0] * (1 - tx) + g[j1 * cells + i1] * tx;
    return a * (1 - ty) + b * ty;
  };
}

let cached: THREE.DataTexture | null = null;

export function paperTexture(): THREE.DataTexture {
  if (cached) return cached;

  // The tooth. Four octaves, the finest at roughly one lattice cell per pixel:
  // cold press is irregular at the scale of a fibre clump, not of a pixel.
  const oct = [
    { n: lattice(256, 0x51f3), w: 0.44 },
    { n: lattice(128, 0x9a17), w: 0.28 },
    { n: lattice(64, 0x2b8d), w: 0.18 },
    { n: lattice(24, 0x77c5), w: 0.1 },
  ];
  const size = lattice(7, 0x4d31);
  const fibreA = lattice(160, 0x18ae);
  const fibreB = lattice(9, 0x6f02);

  const px = new Uint8Array(SIZE * SIZE * 4);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const u = x / SIZE;
      const v = y / SIZE;
      let h = 0;
      for (const o of oct) h += o.n(u, v) * o.w;
      // Cold press is not a symmetric bell: there are many shallow pits and a
      // few deep ones. Pushing the distribution off centre is what stops the
      // grain reading as television static.
      h = Math.pow(Math.min(1, Math.max(0, h)), 1.35);

      // Fibres run with the mould, so they are long in one direction only.
      const fib = fibreA(u * 0.12 + fibreB(u, v) * 0.02, v);

      px[(y * SIZE + x) * 4] = Math.round(h * 255);
      px[(y * SIZE + x) * 4 + 1] = Math.round((0.62 + size(u, v) * 0.38) * 255);
      px[(y * SIZE + x) * 4 + 2] = Math.round(fib * 255);
      px[(y * SIZE + x) * 4 + 3] = 255;
    }
  }

  const t = new THREE.DataTexture(px, SIZE, SIZE, THREE.RGBAFormat);
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.minFilter = THREE.LinearFilter;
  t.magFilter = THREE.LinearFilter;
  t.needsUpdate = true;
  cached = t;
  return t;
}
