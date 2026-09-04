import { Pad, type Pt } from '../flat/pad';

/**
 * The ink.
 *
 * The reference is one colour on cream card, and everything that makes it look
 * printed rather than drawn in a browser happens here rather than in the
 * drawing. Six techniques, each doing one job, and the reason there are six is
 * that a real engraved card uses all of them on the same card and switching
 * between them is what makes a picture read as *printed*.
 *
 * - **Tapered line** for anything drawn by hand. A pen laid down and lifted is
 *   thin, fat, thin; a constant-width stroke is a vector and the eye knows it.
 * - **Hatching** for tone on made things — a box, a shelf, a shadow. Parallel
 *   lines at one angle, because a hand does not change its wrist per stroke.
 * - **Cross-hatching** where the tone has to go darker than one pass allows.
 *   A second angle, never at ninety degrees to the first, because ninety
 *   degrees reads as graph paper.
 * - **Stipple** for soft tone and for anything round. Dots graded by density,
 *   not by size, which is how an engraver does it and why it looks like one.
 * - **Contour hatching** for form: lines that follow the surface instead of
 *   crossing it, which is the only kind of shading that describes a shape
 *   rather than merely darkening it.
 * - **Spot** — solid ink — used almost never, and therefore loudly.
 *
 * On top of that, two press effects. **Spread**, because ink squeezes out
 * sideways under pressure and a printed line is fractionally fatter and softer
 * than the plate that made it. And **misregistration**, a faint ghost of the
 * whole drawing a fraction of a millimetre off, which is what you get when the
 * sheet moves between impressions and is the single most convincing tell that
 * a thing came off a press.
 */

/**
 * One wandering signal, shared by every stroke on every card.
 *
 * A per-stroke random walk makes each line shaky but makes the *set* of lines
 * statistically identical, which reads as noise. One signal sampled at
 * different offsets gives strokes that drift together over a distance, which is
 * what a hand does and what a warped plate does.
 */
const WANDER = (() => {
  let a = 0x2f6e2b1 >>> 0;
  const g = new Float32Array(512);
  for (let i = 0; i < g.length; i++) {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    g[i] = ((t ^ (t >>> 14)) >>> 0) / 4294967296 - 0.5;
  }
  return g;
})();

export function wander(t: number) {
  const f = Math.abs(t) * 97;
  const i = Math.floor(f) % 512;
  const j = (i + 1) % 512;
  const k = f - Math.floor(f);
  return WANDER[i] * (1 - k) + WANDER[j] * k;
}

export const rng = (seed: number) => {
  let a = (seed ^ 0x9e3779b9) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export interface Ink {
  /** The one printing colour of this card. */
  hex: string;
  /** The paper. */
  paper: string;
  /** Fibre and foxing, a shade darker than the paper. */
  fleck: string;
}

export const RED: Ink = { hex: '#c8352c', paper: '#f6efe0', fleck: '#d8cbb0' };
export const BLACK: Ink = { hex: '#2b2723', paper: '#f6efe0', fleck: '#d8cbb0' };

/** `#rrggbb` at an alpha. */
export function fade(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

/**
 * The card's own drawing surface.
 *
 * `Pad` normalises x and y independently, which is right for a square card and
 * wrong for this one: on a 0.7 aspect it puts the bottom of the picture at
 * y = 1 and stretches every circle by a factor of 1.43. Card space instead runs
 * x from 0 to 1 and y from 0 to 1/aspect, isotropically, so a radius means the
 * same thing in both directions and a cat is not taller than it was drawn.
 *
 * It is a two-line override because everything in `Pad` goes through `px`.
 */
export class CardPad extends Pad {
  px(p: Pt): Pt {
    return [p[0] * this.w, p[1] * this.w];
  }
}

export interface StrokeOptions {
  /** Width at the fattest point, in short-side units. */
  width?: number;
  alpha?: number;
  /** How much thinner the ends are than the middle. 0 keeps it constant. */
  taper?: number;
  /** Wander off the path, in short-side units. */
  wobble?: number;
  /** Leave gaps, as in a plate that did not take ink evenly. 0..1. */
  broken?: number;
  cap?: CanvasLineCap;
  /**
   * Keep the corners.
   *
   * Everything here is smoothed through its midpoints by default, which is what
   * a hand does and is right for a cat. It is catastrophic for anything that was
   * manufactured — the first window on these cards came out as a perfect oval,
   * and so did the boxes and the shelves. Smooth what grew; keep the corners on
   * what was made.
   */
  sharp?: boolean;
}

/**
 * A hand-drawn line, drawn as a run of short segments so the width can change
 * along it.
 *
 * Everything else in this file is built on this. The taper is not decoration:
 * it is the difference between a drawing and a diagram.
 */
export function stroke(pad: Pad, path: Pt[], colour: string, o: StrokeOptions = {}) {
  if (path.length < 2) return;
  const w = o.width ?? 0.009;
  const taper = o.taper ?? 0.55;
  const wob = o.wobble ?? 0.0022;
  const broken = o.broken ?? 0;
  const r = rng(Math.round(path[0][0] * 7717 + path[0][1] * 3313 + path.length * 91 + w * 1e5));

  // Resample the path so segments are short enough to change width between.
  const dense = o.sharp ? resampleSharp(path, 26) : resample(path, 26);
  const n = dense.length;
  for (let i = 0; i < n - 1; i++) {
    const t = i / (n - 2 || 1);
    if (broken > 0 && r() < broken * 0.5) continue;
    // Thin, fat, thin: sin gives exactly that with no special-casing of ends.
    const k = 1 - taper * (1 - Math.sin(Math.PI * Math.min(1, Math.max(0, t))) ** 0.55);
    const a = dense[i];
    const b = dense[i + 1];
    const nx = -(b[1] - a[1]);
    const ny = b[0] - a[0];
    const d = Math.hypot(nx, ny) || 1;
    const j1 = wander(t * 3.1 + w * 90) * wob;
    const j2 = wander(t * 3.1 + 0.03 + w * 90) * wob;
    pad.line(
      [
        [a[0] + (nx / d) * j1, a[1] + (ny / d) * j1],
        [b[0] + (nx / d) * j2, b[1] + (ny / d) * j2],
      ],
      colour,
      { width: w * k, alpha: o.alpha ?? 1, cap: o.cap ?? 'round' },
    );
  }
}

/** Same, closed. */
export function outline(pad: Pad, path: Pt[], colour: string, o: StrokeOptions = {}) {
  stroke(pad, [...path, path[0], path[1]], colour, o);
}

/** Points along a polyline, corners kept, at roughly even spacing. */
export function resampleSharp(path: Pt[], per: number): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i];
    const b = path[i + 1];
    const n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) * per));
    for (let k = 0; k < n; k++) out.push([a[0] + (b[0] - a[0]) * (k / n), a[1] + (b[1] - a[1]) * (k / n)]);
  }
  out.push(path[path.length - 1]);
  return out;
}

/** Points along a smoothed path, at roughly even spacing. */
export function resample(path: Pt[], per: number): Pt[] {
  if (path.length < 3) {
    const out: Pt[] = [];
    const [a, b] = path;
    const n = Math.max(2, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) * per));
    for (let i = 0; i <= n; i++) out.push([a[0] + (b[0] - a[0]) * (i / n), a[1] + (b[1] - a[1]) * (i / n)]);
    return out;
  }
  // Quadratic through midpoints — the same smoothing Pad uses, so a stroke and
  // a shape drawn from the same points land on top of each other.
  const out: Pt[] = [];
  for (let i = 0; i < path.length - 1; i++) {
    const p = path[i];
    const q = path[i + 1];
    const m0: Pt = i === 0 ? p : [(path[i - 1][0] + p[0]) / 2, (path[i - 1][1] + p[1]) / 2];
    const m1: Pt = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
    const seg = Math.max(2, Math.round(Math.hypot(q[0] - p[0], q[1] - p[1]) * per));
    for (let k = 0; k < seg; k++) {
      const t = k / seg;
      const u = 1 - t;
      out.push([u * u * m0[0] + 2 * u * t * p[0] + t * t * m1[0], u * u * m0[1] + 2 * u * t * p[1] + t * t * m1[1]]);
    }
  }
  out.push(path[path.length - 1]);
  return out;
}

export interface ToneOptions {
  angle?: number;
  /** Lines per short-side unit. */
  pitch?: number;
  width?: number;
  alpha?: number;
  /** Skip a fraction of the lines, so the tone is not mechanical. */
  skip?: number;
  wobble?: number;
}

/**
 * Parallel lines across a clipped region.
 *
 * The caller clips; this fills the whole box with lines at one angle and lets
 * the clip decide what survives. That is how a real hatch is done — you do not
 * draw a hatch to a shape, you hatch across it and stop at the edge.
 */
export function hatch(pad: Pad, box: [number, number, number, number], colour: string, o: ToneOptions = {}) {
  const ang = o.angle ?? -0.62;
  const pitch = o.pitch ?? 44;
  const [x0, y0, x1, y1] = box;
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const span = Math.hypot(x1 - x0, y1 - y0);
  const n = Math.max(2, Math.round(span * pitch));
  const r = rng(Math.round(x0 * 7919 + y0 * 104729 + ang * 1000));
  const dx = Math.cos(ang);
  const dy = Math.sin(ang);
  for (let i = 0; i <= n; i++) {
    if (o.skip && r() < o.skip) continue;
    const off = (i / n - 0.5) * span;
    const ox = cx - dy * off;
    const oy = cy + dx * off;
    stroke(
      pad,
      [
        [ox - dx * span * 0.55, oy - dy * span * 0.55],
        [ox + dx * span * 0.55, oy + dy * span * 0.55],
      ],
      colour,
      { width: o.width ?? 0.0032, alpha: o.alpha ?? 0.72, taper: 0.7, wobble: o.wobble ?? 0.0014 },
    );
  }
}

/** Two passes, at angles that are deliberately not perpendicular. */
export function crosshatch(pad: Pad, box: [number, number, number, number], colour: string, o: ToneOptions = {}) {
  hatch(pad, box, colour, o);
  hatch(pad, box, colour, { ...o, angle: (o.angle ?? -0.62) + 1.16, pitch: (o.pitch ?? 44) * 0.86 });
}

export interface StippleOptions {
  /** Dots across the whole box at full density. */
  n?: number;
  /** 0..1 at a point; the dot is kept with this probability. */
  density?: (x: number, y: number) => number;
  size?: number;
  alpha?: number;
}

/**
 * Dots, graded by *density* and not by size.
 *
 * An engraver has one burin. Tone comes from how many marks there are per unit
 * area, never from making the marks bigger — and a stipple that varies its dot
 * size reads as an airbrush, which is a hundred years too late for this card.
 */
export function stipple(pad: Pad, box: [number, number, number, number], colour: string, o: StippleOptions = {}) {
  const [x0, y0, x1, y1] = box;
  const n = o.n ?? 700;
  const size = o.size ?? 0.0032;
  const r = rng(Math.round(x0 * 3517 + y1 * 8971 + n));
  for (let i = 0; i < n; i++) {
    const x = x0 + r() * (x1 - x0);
    const y = y0 + r() * (y1 - y0);
    if (o.density && r() > o.density(x, y)) continue;
    pad.blob([x, y], size * (0.8 + r() * 0.4), size * (0.8 + r() * 0.4), 0, colour, { alpha: o.alpha ?? 0.85 });
  }
}

/**
 * Lines that follow the form.
 *
 * `spine` runs along the shape and `across` says how wide it is at each point;
 * the lines are drawn across, so they curve the way the surface curves. It is
 * the difference between shading a cylinder and merely making it darker.
 */
export function contourHatch(
  pad: Pad,
  spine: Pt[],
  across: (t: number) => number,
  colour: string,
  o: ToneOptions & { arc?: number } = {},
) {
  const dense = resample(spine, 20);
  const step = Math.max(1, Math.round(dense.length / ((o.pitch ?? 30) * 0.9)));
  const arc = o.arc ?? 0.3;
  for (let i = 0; i < dense.length; i += step) {
    const t = i / (dense.length - 1);
    const a = dense[Math.max(0, i - 1)];
    const b = dense[Math.min(dense.length - 1, i + 1)];
    const nx = -(b[1] - a[1]);
    const ny = b[0] - a[0];
    const d = Math.hypot(nx, ny) || 1;
    const w = across(t);
    const p = dense[i];
    const mid: Pt = [p[0] + ((b[0] - a[0]) / d) * w * arc, p[1] + ((b[1] - a[1]) / d) * w * arc];
    stroke(
      pad,
      [
        [p[0] - (nx / d) * w, p[1] - (ny / d) * w],
        mid,
        [p[0] + (nx / d) * w, p[1] + (ny / d) * w],
      ],
      colour,
      { width: o.width ?? 0.0032, alpha: o.alpha ?? 0.6, taper: 0.8, wobble: 0.001 },
    );
  }
}

/** Solid ink. Used almost never, and therefore loudly. */
export function spot(pad: Pad, path: Pt[], colour: string, alpha = 1) {
  pad.shape(path, colour, { alpha });
}

// ------------------------------------------------------------------- press

/**
 * The card stock.
 *
 * Cream, warm at the middle and cooler at the edges the way a card that has
 * been in a hand for eighty years goes; fibre as short pale and dark flecks;
 * two or three spots of foxing; and the corners worn through to a lighter
 * shade, because that is where a card is held.
 */
export function stock(pad: Pad, ink: Ink, seed: number) {
  const g = pad.g;
  const r = rng(seed);
  g.fillStyle = ink.paper;
  g.fillRect(0, 0, pad.w, pad.h);

  // A slow warm-to-cool wash, off-centre, so no two cards light the same way.
  const grad = g.createRadialGradient(
    pad.w * (0.34 + r() * 0.32),
    pad.h * (0.3 + r() * 0.4),
    pad.w * 0.1,
    pad.w * 0.5,
    pad.h * 0.5,
    pad.w * 1.05,
  );
  grad.addColorStop(0, 'rgba(255, 252, 240, 0.55)');
  grad.addColorStop(0.62, 'rgba(246, 239, 224, 0)');
  grad.addColorStop(1, 'rgba(198, 184, 158, 0.30)');
  g.fillStyle = grad;
  g.fillRect(0, 0, pad.w, pad.h);

  const H = pad.h / pad.w;
  for (let i = 0; i < 1500; i++) {
    const x = r();
    const y = r() * H;
    const a = r() * Math.PI;
    const l = 0.002 + r() * 0.012;
    pad.line(
      [
        [x, y],
        [x + Math.cos(a) * l, y + Math.sin(a) * l],
      ],
      r() < 0.5 ? ink.fleck : '#fffdf4',
      { width: 0.0028, alpha: 0.045 + r() * 0.09 },
    );
  }

  // Foxing: three or four rusty blooms, soft, low, and never in the middle.
  for (let i = 0; i < 3 + Math.floor(r() * 3); i++) {
    const x = r();
    const y = r() * H;
    if (x > 0.3 && x < 0.7 && y > 0.25 * H && y < 0.75 * H) continue;
    const rad = 0.02 + r() * 0.05;
    for (let k = 0; k < 34; k++) {
      pad.blob(
        [x + (r() - 0.5) * rad * 1.6, y + (r() - 0.5) * rad * 1.6],
        rad * (0.1 + r() * 0.3),
        rad * (0.1 + r() * 0.3),
        0,
        '#b79c72',
        { alpha: 0.022 + r() * 0.03 },
      );
    }
  }
}

/**
 * The cut edge.
 *
 * Rounded corners, a hairline rule inside them, and the corners lightened where
 * the card has been thumbed. Drawn last but *under* nothing — it is the frame
 * the picture sits in, so it goes on before the drawing.
 */
export function edge(pad: Pad, ink: Ink, seed: number) {
  const g = pad.g;
  const r = rng(seed ^ 0x51ed);
  const rad = 0.055;
  const w = pad.w;
  const h = pad.h;
  const R = rad * pad.s;

  // Everything outside the rounded rectangle is cleared, so the card has a
  // shape rather than being a square with a border drawn on it.
  g.save();
  g.globalCompositeOperation = 'destination-in';
  g.fillStyle = '#000';
  g.beginPath();
  g.moveTo(R, 0);
  g.lineTo(w - R, 0);
  g.quadraticCurveTo(w, 0, w, R);
  g.lineTo(w, h - R);
  g.quadraticCurveTo(w, h, w - R, h);
  g.lineTo(R, h);
  g.quadraticCurveTo(0, h, 0, h - R);
  g.lineTo(0, R);
  g.quadraticCurveTo(0, 0, R, 0);
  g.closePath();
  g.fill();
  g.restore();

  // The thumbed corners, pale.
  const HH = pad.h / pad.w;
  for (const [cx, cy] of [
    [0, 0],
    [1, 0],
    [0, HH],
    [1, HH],
  ]) {
    for (let i = 0; i < 26; i++) {
      pad.blob(
        [cx + (cx ? -1 : 1) * r() * 0.1, cy + (cy > 0.5 ? -1 : 1) * r() * 0.1],
        0.012 + r() * 0.02,
        0.012 + r() * 0.02,
        0,
        '#fffdf6',
        { alpha: 0.05 + r() * 0.05 },
      );
    }
  }

  // A hairline rule, a little inside the cut, wobbling as a plate does.
  const m = 0.036;
  const path: Pt[] = [];
  const steps = 12;
  for (let i = 0; i <= steps; i++) path.push([m + ((1 - 2 * m) * i) / steps, m]);
  for (let i = 1; i <= steps; i++) path.push([1 - m, m + ((pad.h / pad.w - 2 * m) * i) / steps]);
  for (let i = 1; i <= steps; i++) path.push([1 - m - ((1 - 2 * m) * i) / steps, pad.h / pad.w - m]);
  for (let i = 1; i < steps; i++) path.push([m, pad.h / pad.w - m - ((pad.h / pad.w - 2 * m) * i) / steps]);
  outline(pad, path, fade(ink.hex, 0.34), { width: 0.0034, taper: 0.2, wobble: 0.0022, broken: 0.1, sharp: true });
}

/**
 * The press.
 *
 * Two impressions of what has just been drawn: a soft one, spread and offset,
 * which is the ink squeezing out under the plate; and a hard sharp one back on
 * top so the drawing does not go mushy. Then the misregistered ghost.
 *
 * `draw` is called more than once, so it must be a pure function of the seed.
 */
export function press(pad: Pad, draw: () => void, seed: number) {
  const g = pad.g;
  const r = rng(seed ^ 0x9a71);
  const dx = (r() - 0.5) * 0.006 * pad.s;
  const dy = (r() - 0.5) * 0.006 * pad.s;

  // The spread: blurred, low, and offset by less than a hair.
  g.save();
  g.globalAlpha = 0.34;
  g.filter = 'blur(1.4px)';
  g.translate(dx * 1.6, dy * 1.6);
  draw();
  g.restore();

  // The impression proper.
  g.save();
  draw();
  g.restore();

  // The misregistered ghost: the same plate, a fraction off, very faint. It is
  // the single most convincing tell that a thing came off a press.
  g.save();
  g.globalAlpha = 0.14;
  g.globalCompositeOperation = 'multiply';
  g.translate(-dx * 2.4, -dy * 2.4);
  draw();
  g.restore();
}
