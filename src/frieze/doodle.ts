import { INK } from './paper';

/**
 * How everything in this film is drawn.
 *
 * Three properties, taken off the reference and all three necessary:
 *
 * 1. **A thick wobbly outline.** Felt-tip, not a vector stroke — the line
 *    wanders off the path it meant to take by a pen-width or two, and it is
 *    gone over twice in places, so the weight is not constant.
 * 2. **Crayon fill that does not respect the line.** The colour is laid down
 *    first, overshooting the outline on one side and falling short on the
 *    other, with the grain of the wax showing through. Fill that exactly
 *    matches its outline is the fastest way to look like clip art.
 * 3. **A shadow on the paper.** Everything is a cut-out lying on the page.
 *    Without it the drawings are printed *in* the book; with it they are
 *    sitting on it, which is the whole conceit of the reference.
 *
 * Everything is seeded from where it is, never from when it is — so a doodle
 * looks hand-drawn but does not crawl about while the camera pans over it.
 */

export type Pt = [number, number];

export function rng(seed: number) {
  let s = (Math.abs(seed) * 2654435761 + 12345) >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

/** Smooth, low-frequency wander: what a hand does, as opposed to noise. */
function wander(seed: number) {
  const r = rng(seed);
  const a = r() * 6.28;
  const b = r() * 6.28;
  const c = r() * 6.28;
  return (t: number) =>
    Math.sin(t * 1.7 + a) * 0.55 + Math.sin(t * 4.3 + b) * 0.3 + Math.sin(t * 9.1 + c) * 0.15;
}

function resample(pts: Pt[], step: number): Pt[] {
  if (pts.length < 2) return pts.slice();
  const out: Pt[] = [pts[0]!];
  let carry = 0;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1]!;
    const [x1, y1] = pts[i]!;
    const dx = x1 - x0;
    const dy = y1 - y0;
    const len = Math.hypot(dx, dy);
    if (len < 1e-6) continue;
    let t = carry;
    while (t < len) {
      out.push([x0 + (dx * t) / len, y0 + (dy * t) / len]);
      t += step;
    }
    carry = t - len;
  }
  out.push(pts[pts.length - 1]!);
  return out;
}

/** A catmull-rom through anchors, so a handful of points gives a live curve. */
export function curve(pts: Pt[], per = 8): Pt[] {
  if (pts.length < 3) return pts.slice();
  const out: Pt[] = [];
  const at = (i: number) => pts[Math.max(0, Math.min(pts.length - 1, i))]!;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    for (let k = 0; k < per; k++) {
      const t = k / per;
      const t2 = t * t;
      const t3 = t2 * t;
      out.push([
        0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
        0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
      ]);
    }
  }
  out.push(pts[pts.length - 1]!);
  return out;
}

/** A closed loop through anchors: a blob, a head, a hill. */
export function loop(pts: Pt[], per = 8): Pt[] {
  return curve([pts[pts.length - 1]!, ...pts, pts[0]!, pts[1]!], per);
}

export interface PenOptions {
  /** Nib width. */
  w?: number;
  /** How far the hand strays, in nib widths. */
  stray?: number;
  colour?: string;
  /** Passes. Two is a felt-tip gone over; one is a quick line. */
  passes?: number;
  /** Run past the ends, the way a fast hand does. */
  overshoot?: number;
  close?: boolean;
}

/** One hand-drawn line. */
export function pen(g: CanvasRenderingContext2D, path: Pt[], seed: number, o: PenOptions = {}) {
  if (path.length < 2) return;
  const w = o.w ?? 3.4;
  const stray = (o.stray ?? 1) * w * 0.5;
  const passes = o.passes ?? 2;
  const over = o.overshoot ?? w * 1.2;

  const pts = resample(path, Math.max(3, w * 1.1));
  g.save();
  g.lineCap = 'round';
  g.lineJoin = 'round';
  g.strokeStyle = o.colour ?? INK;
  for (let pass = 0; pass < passes; pass++) {
    const wx = wander(seed * 7 + pass * 101);
    const wy = wander(seed * 13 + pass * 211);
    // The second pass is lighter and slightly off: a line gone over, not a
    // line drawn twice in the same place.
    g.globalAlpha = pass === 0 ? 1 : 0.5;
    g.lineWidth = w * (pass === 0 ? 1 : 0.82);
    g.beginPath();
    for (let i = 0; i < pts.length; i++) {
      const t = i / Math.max(1, pts.length - 1);
      const [x, y] = pts[i]!;
      const px = x + wx(t * 6) * stray;
      const py = y + wy(t * 6) * stray;
      if (i === 0) g.moveTo(px, py);
      else g.lineTo(px, py);
    }
    if (o.close) g.closePath();
    else if (over > 0 && pts.length > 2) {
      // Carry on a little past the end, in the direction it was going.
      const [ax, ay] = pts[pts.length - 2]!;
      const [bx, by] = pts[pts.length - 1]!;
      const d = Math.hypot(bx - ax, by - ay) || 1;
      g.lineTo(bx + ((bx - ax) / d) * over, by + ((by - ay) / d) * over);
    }
    g.stroke();
  }
  g.restore();
}

let waxTile: HTMLCanvasElement | null = null;
function wax(): HTMLCanvasElement {
  if (waxTile) return waxTile;
  const c = document.createElement('canvas');
  c.width = 140;
  c.height = 140;
  const g = c.getContext('2d');
  if (!g) return c;
  g.fillStyle = '#fff';
  g.fillRect(0, 0, 140, 140);
  // Crayon is streaks in one direction, not a uniform speckle.
  const r = rng(99);
  g.globalAlpha = 0.5;
  for (let i = 0; i < 900; i++) {
    const x = r() * 140;
    const y = r() * 140;
    const len = 3 + r() * 16;
    g.strokeStyle = `rgba(0,0,0,${0.05 + r() * 0.09})`;
    g.lineWidth = 0.6 + r() * 1.5;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + len * 0.92, y + len * 0.22);
    g.stroke();
  }
  waxTile = c;
  return c;
}

export interface FillOptions {
  colour: string;
  /** How far the colour strays from the outline, in pixels. */
  slop?: number;
  alpha?: number;
  /**
   * Crayon grain inside this one shape.
   *
   * Off by default, and that is a performance decision with a visual answer:
   * grain per shape is a clip and a tiled blit *per doodle*, and a frame of
   * this film has a couple of hundred doodles in it. One wax pass over the
   * whole frame at the end costs the same as one doodle and reads the same,
   * because the grain is a property of the page, not of each crayon stroke.
   */
  grain?: boolean;
}

/**
 * Colour inside — approximately inside — a shape.
 *
 * The path is nudged outward on one side and inward on the other by a smooth
 * wander, which is what a child does with a crayon and what makes the fill read
 * as a separate act from the outline rather than the same act twice.
 */
export function crayon(g: CanvasRenderingContext2D, path: Pt[], seed: number, o: FillOptions) {
  if (path.length < 3) return;
  const slop = o.slop ?? 4.5;
  const wx = wander(seed * 3 + 5);
  const wy = wander(seed * 17 + 9);
  const n = path.length;
  let cx = 0;
  let cy = 0;
  for (const [x, y] of path) { cx += x; cy += y; }
  cx /= n;
  cy /= n;

  g.save();
  g.globalAlpha = o.alpha ?? 0.92;
  g.fillStyle = o.colour;
  g.beginPath();
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const [x, y] = path[i]!;
    const dx = x - cx;
    const dy = y - cy;
    const d = Math.hypot(dx, dy) || 1;
    const push = (wx(t * 5) + wy(t * 3.1)) * 0.5 * slop;
    const px = x + (dx / d) * push;
    const py = y + (dy / d) * push;
    if (i === 0) g.moveTo(px, py);
    else g.lineTo(px, py);
  }
  g.closePath();
  g.fill();
  if (o.grain === true) {
    g.globalCompositeOperation = 'multiply';
    g.globalAlpha = 0.5;
    g.clip();
    const tile = wax();
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const [x, y] of path) {
      minX = Math.min(minX, x); minY = Math.min(minY, y);
      maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
    }
    const ox = Math.floor(minX / tile.width) * tile.width;
    const oy = Math.floor(minY / tile.height) * tile.height;
    for (let y = oy; y < maxY + tile.height; y += tile.height) {
      for (let x = ox; x < maxX + tile.width; x += tile.width) g.drawImage(tile, x, y);
    }
  }
  g.restore();
}

/**
 * A whole doodle: shadow, colour, line — in that order, which is the order a
 * cut-out ends up on a page.
 */
export function doodle(
  g: CanvasRenderingContext2D,
  path: Pt[],
  seed: number,
  fill: string | null,
  o: PenOptions & { slop?: number; alpha?: number; grain?: boolean; shadow?: boolean } = {},
) {
  if (o.shadow !== false) shadowOf(g, path);
  if (fill) crayon(g, path, seed, { colour: fill, slop: o.slop, alpha: o.alpha, grain: o.grain });
  pen(g, path, seed, { ...o, close: true, overshoot: 0 });
}

/** The soft shadow a paper cut-out throws. Drawn once, under everything. */
export function shadowOf(g: CanvasRenderingContext2D, path: Pt[], dx = 7, dy = 9, blur = 11) {
  g.save();
  g.filter = `blur(${blur}px)`;
  g.fillStyle = 'rgba(58, 50, 38, 0.22)';
  g.beginPath();
  g.moveTo(path[0]![0] + dx, path[0]![1] + dy);
  for (const [x, y] of path.slice(1)) g.lineTo(x + dx, y + dy);
  g.closePath();
  g.fill();
  g.restore();
}

/** A circle, as anchors, ready for `loop`. */
export function ring(cx: number, cy: number, r: number, n = 12, squash = 1, seed = 1): Pt[] {
  const rn = rng(seed);
  const out: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k = 1 + (rn() - 0.5) * 0.09;
    out.push([cx + Math.cos(a) * r * k, cy + Math.sin(a) * r * squash * k]);
  }
  return out;
}

/** A rectangle with hand-drawn corners. */
export function box(x: number, y: number, w: number, h: number): Pt[] {
  return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
}

/** Handwriting, small, for the cards pinned into the scene. */
export function scrawl(
  g: CanvasRenderingContext2D,
  text: string, x: number, y: number, size: number, seed: number,
  colour = INK, align: CanvasTextAlign = 'left',
) {
  g.save();
  g.fillStyle = colour;
  g.textAlign = align;
  g.textBaseline = 'alphabetic';
  g.font = `${size}px "Bradley Hand", "Segoe Print", "Comic Sans MS", Georgia, serif`;
  // Set letter by letter so the baseline is never quite a line.
  const r = rng(seed);
  if (align === 'left') {
    let pen = x;
    for (const ch of text) {
      const w = g.measureText(ch).width;
      g.save();
      g.translate(pen + w / 2, y + (r() - 0.5) * size * 0.09);
      g.rotate((r() - 0.5) * 0.05);
      g.textAlign = 'center';
      g.fillText(ch, 0, 0);
      g.restore();
      pen += w * (0.99 + r() * 0.03);
    }
  } else {
    g.fillText(text, x, y);
  }
  g.restore();
}
