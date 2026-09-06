import { lum, regionAt, rgbAt, slope, Region, type Field } from './source';

/**
 * What a style renderer gets to work with.
 *
 * The hundred techniques share almost all their machinery — scatter points by
 * darkness, walk a grid, draw a stroke that follows the form — so it lives
 * here once and each style is left to be only the part of itself that is
 * actually different. A style that needs thirty lines to say what it is has
 * usually not been thought about hard enough.
 */

export interface Ctx {
  g: CanvasRenderingContext2D;
  f: Field;
  w: number;
  h: number;
  r: () => number;
  /** Ink density, 0 to 1, at a normalised point: the inverse of luminance. */
  t: (x: number, y: number) => number;
  /** The source colour, as a css string. */
  col: (x: number, y: number) => string;
  region: (x: number, y: number) => Region;
  /** Direction and steepness of the tonal change. */
  slope: (x: number, y: number) => { angle: number; mag: number };
  /** Normalised to pixels. */
  X: (x: number) => number;
  Y: (y: number) => number;
}

export function ctx(g: CanvasRenderingContext2D, f: Field, w: number, h: number, r: () => number): Ctx {
  return {
    g,
    f,
    w,
    h,
    r,
    t: (x, y) => 1 - lum(f, x, y),
    col: (x, y) => {
      const [a, b, c] = rgbAt(f, x, y);
      return `rgb(${a},${b},${c})`;
    },
    region: (x, y) => regionAt(f, x, y),
    slope: (x, y) => slope(f, x, y),
    X: (x) => x * w,
    Y: (y) => y * h,
  };
}

export function paper(c: Ctx, colour: string) {
  c.g.fillStyle = colour;
  c.g.fillRect(0, 0, c.w, c.h);
}

/** A grid walk, which is the skeleton of about a third of these. */
export function grid(c: Ctx, cols: number, fn: (x: number, y: number, t: number, i: number, j: number) => void) {
  const rows = Math.round(cols * (c.h / c.w));
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const x = (i + 0.5) / cols;
      const y = (j + 0.5) / rows;
      fn(x, y, c.t(x, y), i, j);
    }
  }
}

/**
 * Points scattered where the picture is dark.
 *
 * Rejection sampling against the tone, which is the cheapest way to get a
 * distribution that describes an image: propose a point anywhere, keep it with
 * probability equal to how dark it is there. Everything that stipples, packs
 * or grows starts here.
 */
export function scatter(c: Ctx, n: number, bias = 1, floor = 0): [number, number][] {
  const out: [number, number][] = [];
  let guard = 0;
  while (out.length < n && guard++ < n * 40) {
    const x = c.r();
    const y = c.r();
    const t = Math.pow(c.t(x, y), bias);
    if (t > floor && c.r() < t) out.push([x, y]);
  }
  return out;
}

/**
 * A stroke with a bit of hand in it.
 *
 * The width is floored at two thirds of a pixel. These cards are drawn at
 * anything from a ninety-pixel thumbnail to a full plate, and a line specified
 * as a fraction of the width goes sub-pixel long before the thumbnail does —
 * where it stops being a thin line and becomes a faint one. A technique that
 * survives on a thumbnail is a technique.
 */
export function stroke(c: Ctx, pts: [number, number][], width: number, colour: string, alpha = 1) {
  if (pts.length < 2) return;
  const g = c.g;
  g.save();
  g.globalAlpha = alpha;
  g.strokeStyle = colour;
  g.lineWidth = Math.max(0.66, width);
  g.lineCap = 'round';
  g.lineJoin = 'round';
  g.beginPath();
  g.moveTo(c.X(pts[0][0]), c.Y(pts[0][1]));
  for (let i = 1; i < pts.length; i++) g.lineTo(c.X(pts[i][0]), c.Y(pts[i][1]));
  g.stroke();
  g.restore();
}

export function dab(c: Ctx, x: number, y: number, rx: number, ry: number, colour: string, alpha = 1, rot = 0) {
  const g = c.g;
  g.save();
  g.globalAlpha = alpha;
  g.fillStyle = colour;
  g.beginPath();
  g.ellipse(c.X(x), c.Y(y), Math.max(0.42, rx * c.w), Math.max(0.42, ry * c.w), rot, 0, Math.PI * 2);
  g.fill();
  g.restore();
}

export function box(c: Ctx, x: number, y: number, bw: number, bh: number, colour: string, alpha = 1) {
  const g = c.g;
  g.save();
  g.globalAlpha = alpha;
  g.fillStyle = colour;
  g.fillRect(c.X(x), c.Y(y), bw * c.w, bh * c.h);
  g.restore();
}

/**
 * One long line that follows the form.
 *
 * Starts somewhere and repeatedly steps *along* the tonal contour — ninety
 * degrees off the gradient — so it wraps a cheek instead of crossing it. The
 * flow field, the contour map and the single-line portrait are all this
 * function with different stopping rules.
 */
export function ride(c: Ctx, from: [number, number], steps: number, step: number, jitter = 0): [number, number][] {
  const pts: [number, number][] = [from];
  let [x, y] = from;
  for (let i = 0; i < steps; i++) {
    const s = c.slope(x, y);
    const a = s.angle + Math.PI / 2 + (c.r() - 0.5) * jitter;
    x += Math.cos(a) * step;
    y += Math.sin(a) * step * (c.w / c.h);
    if (x < -0.05 || x > 1.05 || y < -0.05 || y > 1.05) break;
    pts.push([x, y]);
  }
  return pts;
}

/**
 * The same, but where the picture is light.
 *
 * Anything that marks pale on a dark ground — chalk, spray paint on a wall,
 * a phosphor trace — has to be told to go where the *light* is. Scattering
 * such a technique by darkness paints the ground its own colour and prints
 * nothing at all, which is a mistake that looks like a rendering bug.
 */
export function scatterLight(c: Ctx, n: number, bias = 1): [number, number][] {
  const out: [number, number][] = [];
  let guard = 0;
  while (out.length < n && guard++ < n * 40) {
    const x = c.r();
    const y = c.r();
    if (c.r() < Math.pow(1 - c.t(x, y), bias)) out.push([x, y]);
  }
  return out;
}

/** Quantise a tone to n levels, which is what every print process does. */
export const steps = (t: number, n: number) => Math.round(t * (n - 1)) / (n - 1);

/** Mix two css colours. Cheap, and only ever used on flat hex. */
export function mix(a: string, b: string, k: number): string {
  const pa = hex(a);
  const pb = hex(b);
  return `rgb(${Math.round(pa[0] + (pb[0] - pa[0]) * k)},${Math.round(pa[1] + (pb[1] - pa[1]) * k)},${Math.round(pa[2] + (pb[2] - pa[2]) * k)})`;
}

function hex(s: string): [number, number, number] {
  if (s.startsWith('rgb')) {
    const m = s.match(/\d+/g) ?? ['0', '0', '0'];
    return [Number(m[0]), Number(m[1]), Number(m[2])];
  }
  const v = parseInt(s.slice(1), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

export { Region };
