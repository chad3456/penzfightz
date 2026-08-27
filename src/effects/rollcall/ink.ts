import type p5 from 'p5';

/**
 * The pen.
 *
 * What makes any of these drawings read as *drawn* rather than as generated is
 * not the subject — it is the line, and the line is entirely this file. A
 * flower, a pair of scissors and a bank manager are all made of the same four
 * things: a path that wobbles slowly along its length, gone over twice with a
 * slight offset, sitting on a flat wash that is deliberately printed a few
 * millimetres out of register, indexed out of a palette by a gene.
 *
 * It lives on its own so that adding a new sort of object is a new set of
 * shapes and nothing else. Every renderer in this folder imports the pen; none
 * of them owns one.
 */

/** Smooth 1-D noise: a hand wanders, it does not jitter. */
export function wander(seed: number) {
  const at = (i: number) => {
    let t = Math.imul(i ^ seed, 2246822519);
    t = Math.imul(t ^ (t >>> 13), 3266489917);
    return ((t ^ (t >>> 16)) >>> 0) / 4294967296 - 0.5;
  };
  return (x: number) => {
    const i = Math.floor(x);
    const f = x - i;
    const s = f * f * (3 - 2 * f);
    return at(i) * (1 - s) + at(i + 1) * s;
  };
}

export interface Ink {
  tremor: number;
  weight: number;
  seed: number;
}

/**
 * Draw a path as a pen would: wobbling along its length, gone over twice, and
 * overshooting a little at the ends the way a hand does not stop exactly where
 * it meant to.
 */
export function stroke(
  p: p5,
  pts: [number, number][],
  ink: Ink,
  o: { close?: boolean; passes?: number; overshoot?: number; weightScale?: number } = {},
) {
  if (pts.length < 2) return;
  const passes = o.passes ?? 2;
  const n1 = wander(ink.seed);
  const n2 = wander(ink.seed ^ 0x51ed);

  for (let pass = 0; pass < passes; pass++) {
    const phase = pass * 13.7;
    const drift = pass === 0 ? 0 : ink.tremor * 0.55;
    p.strokeWeight(ink.weight * (o.weightScale ?? 1) * (pass === 0 ? 1 : 0.72));
    p.noFill();
    p.beginShape();
    const m = pts.length;
    for (let i = 0; i <= (o.close ? m : m - 1); i++) {
      const [x, y] = pts[i % m];
      const t = i * 0.55 + phase;
      p.splineVertex(x + n1(t) * (ink.tremor + drift), y + n2(t) * (ink.tremor + drift));
      // A spline needs its ends doubled to actually reach them.
      if (!o.close && (i === 0 || i === m - 1)) {
        p.splineVertex(x + n1(t) * ink.tremor, y + n2(t) * ink.tremor);
      }
    }
    if (o.close) p.endShape('close');
    else p.endShape();
  }
}

/** Fill a closed path flat, no stroke. The wash under the ink. */
export function flat(p: p5, pts: [number, number][], colour: string) {
  p.noStroke();
  p.fill(colour);
  p.beginShape();
  for (const [x, y] of pts) p.vertex(x, y);
  p.endShape('close');
}

// ------------------------------------------------------------------- shapes

export const ring = (x: number, y: number, s: number, squash = 1): [number, number][] =>
  Array.from({ length: 18 }, (_, i) => {
    const t = (i / 18) * Math.PI * 2;
    return [x + (Math.cos(t) * s) / 2, y + ((Math.sin(t) * s) / 2) * squash] as [number, number];
  });

export const box = (x: number, y: number, w: number, h: number): [number, number][] => [
  [x - w / 2, y - h / 2],
  [x + w / 2, y - h / 2],
  [x + w / 2, y + h / 2],
  [x - w / 2, y + h / 2],
];

export const arc = (x: number, y: number, s: number, a0: number, a1: number): [number, number][] =>
  Array.from({ length: 12 }, (_, i) => {
    const t = a0 + ((a1 - a0) * i) / 11;
    return [x + (Math.cos(t) * s) / 2, y + (Math.sin(t) * s) / 2] as [number, number];
  });

/** A rectangle with its corners taken off, which is most of the kit. */
export function slab(
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): [number, number][] {
  const k = Math.min(r, w / 2, h / 2);
  return [
    [x - w / 2 + k, y - h / 2],
    [x + w / 2 - k, y - h / 2],
    [x + w / 2, y - h / 2 + k],
    [x + w / 2, y + h / 2 - k],
    [x + w / 2 - k, y + h / 2],
    [x - w / 2 + k, y + h / 2],
    [x - w / 2, y + h / 2 - k],
    [x - w / 2, y - h / 2 + k],
  ];
}

// ----------------------------------------------------------------- palettes

export const PAPER = ['#f3efe3', '#f2eee6', '#efe9db'];

/**
 * The illustrative wash: the greens and pinks and greys that make a page read
 * as printed rather than as a set of portraits.
 */
export const WASH = [
  '#cfd6d2', '#d8dcc9', '#e9c9c9', '#cdd5df', '#e3d9c4', '#dcd0e0', '#c9dad6',
];

export const LINE = '#141414';

/**
 * Index a palette by a gene.
 *
 * `mutate` clamps with `Math.min(1, ...)`, so a gene can be exactly 1.0, and
 * `arr[Math.floor(1.0 * arr.length)]` is one past the end. p5 fills undefined
 * as black, which is why four faces in the first hundred came out as solid
 * black blobs with the features drawn invisibly on top.
 */
export const pick = <T,>(arr: T[], t: number): T =>
  arr[Math.min(arr.length - 1, Math.floor(t * arr.length))];
