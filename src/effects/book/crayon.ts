import type { Pad, Pt } from '../flat/pad';

/**
 * The crayon layer.
 *
 * Six Colours argued that a brush in a drawing app is a stamped round nib and
 * that adding grain to it is a lie. That argument was about *that* medium. The
 * one here is a different one and it wants the opposite: gouache and coloured
 * pencil on uncoated paper, where nothing is a flat area of colour and every
 * shape has been gone over by a hand that pressed harder in some places than
 * others.
 *
 * So this sits on top of `Pad` — the same paths, the same smoothing, the same
 * unit coordinates — and adds the four things the style actually needs.
 *
 * **Nothing is flat.** Every fill is scuffed: a few hundred short strokes of
 * the same colour lighter and darker, at one angle, inside the shape. It is the
 * cheapest possible stand-in for pencil over paint and it is the single change
 * that stops these looking like vector art.
 *
 * **Fibre is drawn as fibre.** Straw, hair and beards are hundreds of thin
 * tapering strokes along a spine, not a filled shape with a texture over it. A
 * beard drawn as a shape has a silhouette; a beard drawn as fibre has an edge
 * that the eye reads as thousands of ends, which is what a beard is.
 *
 * **The edge of the card is torn.** The ground is a rounded rectangle whose
 * outline wanders by a couple of percent, so the picture sits on the page
 * rather than being cropped out of it.
 *
 * **There is grain over the lot.** Last, over everything, at low alpha.
 */

export const rng = (seed: number) => {
  let a = (seed ^ 0x9e3779b9) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/** `#rrggbb` towards white (k > 0) or black (k < 0). */
export function shift(hex: string, k: number) {
  const n = parseInt(hex.slice(1), 16);
  const to = k > 0 ? 255 : 0;
  const m = Math.abs(k);
  const mix = (c: number) => Math.round(c + (to - c) * m);
  return `rgb(${mix((n >> 16) & 255)}, ${mix((n >> 8) & 255)}, ${mix(n & 255)})`;
}

/** `#rrggbb` at an alpha. */
export function fade(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

export interface ScuffOptions {
  /** Strokes. Scales with the area being covered, not with the card. */
  n?: number;
  /** Radians. One angle per shape: a hand does not change its wrist per stroke. */
  angle?: number;
  /** How long each stroke is, in short-side units. */
  len?: number;
  width?: number;
  alpha?: number;
  /** How far light and dark stray from the fill colour. */
  spread?: number;
}

/**
 * Pencil over paint, inside whatever is currently clipped.
 *
 * The strokes go both lighter and darker than the fill, because a pencil laid
 * over gouache does both — it darkens where it deposits and the paint shows
 * through pale where the tooth of the paper missed.
 */
export function scuff(pad: Pad, box: [number, number, number, number], colour: string, o: ScuffOptions = {}) {
  const r = rng(Math.round(box[0] * 9871 + box[1] * 3719 + colour.length * 131));
  const n = o.n ?? 90;
  const ang = o.angle ?? -0.5;
  const len = o.len ?? 0.09;
  const spread = o.spread ?? 0.16;
  const [x0, y0, x1, y1] = box;
  for (let i = 0; i < n; i++) {
    const x = x0 + r() * (x1 - x0);
    const y = y0 + r() * (y1 - y0);
    const l = len * (0.35 + r());
    const a = ang + (r() - 0.5) * 0.34;
    const k = (r() - 0.45) * 2 * spread;
    pad.line(
      [
        [x - (Math.cos(a) * l) / 2, y - (Math.sin(a) * l) / 2],
        [x + (Math.cos(a) * l) / 2, y + (Math.sin(a) * l) / 2],
      ],
      shift(colour, k),
      { width: o.width ?? 0.008, alpha: o.alpha ?? 0.3 },
    );
  }
}

export interface BristleOptions {
  /** Strands. */
  n?: number;
  /** Length, in short-side units, at the root of the spine. */
  len?: number;
  /** How much shorter the strands get by the far end of the spine. */
  taper?: number;
  /** Radians of scatter about the growth direction. */
  fan?: number;
  width?: number;
  alpha?: number;
  /** Curl, as a fraction of the strand's own length. */
  curl?: number;
}

/**
 * Fibre along a spine.
 *
 * `spine` is where it grows from and `dir` is which way it grows, given per
 * point so a beard can fall from the jaw and a fringe can fall from the hat.
 * Each strand is three points rather than two, because a hair that is straight
 * is a bristle and a hair that bends once is hair.
 */
export function bristle(
  pad: Pad,
  spine: Pt[],
  dir: (t: number) => [number, number],
  colour: string,
  seed: number,
  o: BristleOptions = {},
) {
  const r = rng(seed);
  const n = o.n ?? 140;
  const len = o.len ?? 0.11;
  const taper = o.taper ?? 0.45;
  const fan = o.fan ?? 0.5;
  const curl = o.curl ?? 0.3;
  for (let i = 0; i < n; i++) {
    const t = i / Math.max(1, n - 1);
    const f = t * (spine.length - 1);
    const j = Math.min(spine.length - 2, Math.floor(f));
    const k = f - j;
    const x = spine[j][0] + (spine[j + 1][0] - spine[j][0]) * k;
    const y = spine[j][1] + (spine[j + 1][1] - spine[j][1]) * k;
    const [dx, dy] = dir(t);
    const a = Math.atan2(dy, dx) + (r() - 0.5) * fan;
    const l = len * (1 - taper * (0.3 + 0.7 * r())) * (0.55 + 0.9 * r());
    const bend = (r() - 0.5) * curl * l;
    const mx = x + Math.cos(a) * l * 0.55 - Math.sin(a) * bend;
    const my = y + Math.sin(a) * l * 0.55 + Math.cos(a) * bend;
    pad.line(
      [
        [x, y],
        [mx, my],
        [x + Math.cos(a) * l - Math.sin(a) * bend * 2.1, y + Math.sin(a) * l + Math.cos(a) * bend * 2.1],
      ],
      shift(colour, (r() - 0.5) * 0.34),
      { width: (o.width ?? 0.006) * (0.6 + r() * 0.9), alpha: o.alpha ?? 0.85, cap: 'round' },
    );
  }
}

/**
 * The card's ground: a torn-edged patch with a cool top and a warm bottom.
 *
 * Every reference does this and it is not decoration — the warm band at the
 * bottom is what the figure is standing in front of, and it is the only reason
 * the head reads as being *in* somewhere rather than floating on a swatch.
 */
export function ground(pad: Pad, sky: string, sand: string, seed: number) {
  const r = rng(seed);
  const g = pad.g;
  const m = 0.052;
  const path: Pt[] = [];
  const push = (x: number, y: number) => path.push([x + (r() - 0.5) * 0.022, y + (r() - 0.5) * 0.022]);
  const steps = 9;
  for (let i = 0; i <= steps; i++) push(m + ((1 - 2 * m) * i) / steps, m);
  for (let i = 1; i <= steps; i++) push(1 - m, m + ((1 - 2 * m) * i) / steps);
  for (let i = 1; i <= steps; i++) push(1 - m - ((1 - 2 * m) * i) / steps, 1 - m);
  for (let i = 1; i < steps; i++) push(m, 1 - m - ((1 - 2 * m) * i) / steps);

  pad.clip(path, () => {
    const grad = g.createLinearGradient(0, 0, 0, pad.h);
    grad.addColorStop(0, sky);
    grad.addColorStop(0.58, sand);
    grad.addColorStop(1, sand);
    g.fillStyle = grad;
    g.fillRect(0, 0, pad.w, pad.h);
    scuff(pad, [0, 0, 1, 0.62], sky, { n: 120, angle: -0.2, len: 0.3, alpha: 0.16, spread: 0.13 });
    scuff(pad, [0, 0.4, 1, 1], sand, { n: 120, angle: 0.16, len: 0.3, alpha: 0.16, spread: 0.13 });
  });

  // The edge again, in the ground's own colour, so the tear has a lip.
  pad.line([...path, path[0]], fade(sand, 0.5), { width: 0.012, alpha: 0.5 });
}

/** Grain, over the finished card. Last thing, always. */
export function grain(pad: Pad, seed: number, amount = 0.055) {
  const r = rng(seed);
  for (let i = 0; i < 460; i++) {
    const x = r();
    const y = r();
    const a = r() * Math.PI;
    const l = 0.004 + r() * 0.016;
    pad.line(
      [
        [x, y],
        [x + Math.cos(a) * l, y + Math.sin(a) * l],
      ],
      r() < 0.55 ? '#4a3f36' : '#fffaf0',
      { width: 0.0045, alpha: amount * (0.4 + r()) },
    );
  }
}
