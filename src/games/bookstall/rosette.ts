/**
 * The stall's stamp.
 *
 * Every bill gets a rosette printed at the foot of it — a ring of leaves, each
 * one curling into a spiral at its outer end, in the manner of the woodblock
 * flowers that Indian job presses used as filler for most of the last century.
 * They came on a stick of type, they were stamped by hand, and they were never
 * quite clean: the ink breaks up along a stroke, blots at the corners, and
 * leaves specks in the white.
 *
 * Nothing here is a picture file. The shape is built from the quote's own id,
 * so a given line always prints the same flower and no two lines print the
 * same one, and the broken-ink look comes from stamping the outline as several
 * thousand small dots rather than drawing it as a line.
 */

/** Cheap, seedable, good enough for ornament. */
function rng(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Smooth 1D value noise — the slow wobble that makes ink look starved. */
function noise1(seed: number) {
  const at = (i: number) => {
    let t = Math.imul(i ^ seed, 2246822519);
    t = Math.imul(t ^ (t >>> 13), 3266489917);
    return ((t ^ (t >>> 16)) >>> 0) / 4294967296;
  };
  return (x: number) => {
    const i = Math.floor(x);
    const f = x - i;
    const s = f * f * (3 - 2 * f);
    return at(i) * (1 - s) + at(i + 1) * s;
  };
}

type Pt = [number, number];

export interface RosetteSpec {
  /** Leaves in the ring. */
  petals: number;
  /** How far each leaf leans off true radial, in radians. */
  sweep: number;
  /**
   * Half-width of a leaf at its widest, and the diameter of its spiral, both
   * as fractions of the gap between one leaf and the next at the rim. Sizing
   * them against the gap rather than against the flower is what lets the petal
   * count vary without the spirals colliding or rattling around.
   */
  belly: number;
  /** Turns in the tip spiral. */
  coil: number;
  /** Spiral diameter as a fraction of that same gap. */
  coilFit: number;
  /** How far out the leaf itself reaches before the spiral takes over. */
  reach: number;
  /** Whole-flower rotation. */
  rotate: number;
  /** How starved the ink is: 0 prints solid, 1 barely prints. */
  starve: number;
  /** Stroke weight in units of the flower radius. */
  weight: number;
}

/** Pick a flower for a seed. Same seed, same flower, every time. */
export function specFor(seed: string): RosetteSpec {
  const r = rng(seed);
  const pick = <T,>(xs: T[]) => xs[Math.floor(r() * xs.length)];
  return {
    petals: pick([9, 10, 10, 11, 11, 12, 12, 13]),
    sweep: 0.18 + r() * 0.22,
    belly: 0.29 + r() * 0.09,
    coil: 1.2 + r() * 0.32,
    coilFit: 0.62 + r() * 0.16,
    reach: 0.66 + r() * 0.07,
    rotate: r() * Math.PI * 2,
    starve: 0.26 + r() * 0.26,
    weight: 0.0036 + r() * 0.0020,
  };
}

// ------------------------------------------------------------------ geometry

/** The centre line of one leaf, from the eye of the flower to its tip. */
function spine(a: number, s: RosetteSpec, n: number): { p: Pt; t: Pt }[] {
  const r0 = 0.1;
  const out: { p: Pt; t: Pt }[] = [];
  const at = (u: number) => r0 + (s.reach - r0) * (1 - Math.pow(1 - u, 1.7));
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    // Fast out of the eye, easing as it reaches the rim.
    const rad = at(u);
    const ang = a + s.sweep * u;
    const p: Pt = [Math.cos(ang) * rad, Math.sin(ang) * rad];
    // Tangent by difference, so the offsets sit square to the line.
    const du = 0.004;
    const u2 = Math.min(1, u + du);
    const rad2 = at(u2);
    const ang2 = a + s.sweep * u2;
    const q: Pt = [Math.cos(ang2) * rad2, Math.sin(ang2) * rad2];
    const dx = q[0] - p[0];
    const dy = q[1] - p[1];
    const m = Math.hypot(dx, dy) || 1;
    out.push({ p, t: [dx / m, dy / m] });
  }
  return out;
}

/** Centre-to-centre spacing between neighbouring leaves out at the rim. */
const gapAt = (s: RosetteSpec) => (2 * Math.PI * s.reach) / s.petals;

/** Half-width along the leaf: nothing at the eye, nothing at the tip. */
const belly = (u: number, s: RosetteSpec) =>
  gapAt(s) * s.belly * Math.sin(Math.PI * Math.pow(u, 0.55));

/** The spiral that finishes a leaf, tightening as it turns in. */
function volute(from: Pt, tangent: Pt, side: number, s: RosetteSpec, n: number): Pt[] {
  const r0 = (gapAt(s) * s.coilFit) / 2;
  // The eye of the spiral sits square to the leaf, on the curling side.
  const nx = -tangent[1] * side;
  const ny = tangent[0] * side;
  const cx = from[0] + nx * r0;
  const cy = from[1] + ny * r0;
  const a0 = Math.atan2(from[1] - cy, from[0] - cx);
  const turns = s.coil * Math.PI * 2;
  const out: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const ang = a0 + turns * u * side;
    const rad = r0 * Math.exp(-1.15 * u);
    out.push([cx + Math.cos(ang) * rad, cy + Math.sin(ang) * rad]);
  }
  return out;
}

/** Every stroke in the flower, in a unit circle centred on the origin. */
function strokes(s: RosetteSpec): Pt[][] {
  const out: Pt[][] = [];
  const N = 66;
  for (let i = 0; i < s.petals; i++) {
    const a = s.rotate + (i / s.petals) * Math.PI * 2;
    const sp = spine(a, s, N);

    const left: Pt[] = [];
    const right: Pt[] = [];
    sp.forEach(({ p, t }, k) => {
      const u = k / N;
      const w = belly(u, s);
      left.push([p[0] - t[1] * w, p[1] + t[0] * w]);
      // The inner edge stops a little short, leaving the leaf open at the top.
      if (u < 0.93) right.push([p[0] + t[1] * w, p[1] - t[0] * w]);
    });

    // The outer edge runs on past the tip and coils; the inner one stops there.
    const tip = sp[N];
    out.push([...left, ...volute(tip.p, tip.t, 1, s, 64)]);
    out.push(right);
  }

  // The eye: short strokes packed round the middle, where the leaves meet.
  const eye = rng(`eye${s.petals}${s.rotate.toFixed(3)}`);
  for (let i = 0; i < s.petals * 2; i++) {
    const a = eye() * Math.PI * 2;
    const r1 = 0.01 + eye() * 0.014;
    const r2 = r1 + 0.018 + eye() * 0.03;
    // Short overlapping strokes rather than a clean star, so the middle reads
    // as the knot where the block was cut deepest and holds the most ink.
    out.push([
      [Math.cos(a) * r1, Math.sin(a) * r1],
      [Math.cos(a + 0.34) * r2, Math.sin(a + 0.34) * r2],
    ]);
  }
  return out;
}

// ------------------------------------------------------------------ printing

/**
 * Stamp the flower onto a canvas.
 *
 * `size` is the drawn box in CSS px; the caller has already scaled the context
 * for device pixels. The flower fills about 88% of it.
 */
export function drawRosette(
  ctx: CanvasRenderingContext2D,
  size: number,
  seed: string,
  ink = '#141414',
) {
  const s = specFor(seed);
  const r = rng(`ink:${seed}`);
  const grain = noise1(Math.floor(r() * 1e9));

  const all = strokes(s);
  // Scale to what this particular flower actually spans rather than to the
  // unit circle, so a wide-spiralled one and a tight one print the same size.
  let extent = 0;
  for (const stroke of all) {
    for (const p of stroke) extent = Math.max(extent, Math.hypot(p[0], p[1]));
  }
  const R = ((size / 2) * 0.94) / (extent || 1);
  const cx = size / 2;
  const cy = size / 2;
  const px = (p: Pt): Pt => [cx + p[0] * R, cy + p[1] * R];

  ctx.save();
  ctx.fillStyle = ink;

  for (const stroke of all) {
    // Walk the stroke in even steps so ink density does not follow curvature.
    let carried = 0;
    let travelled = 0;
    for (let i = 1; i < stroke.length; i++) {
      const a = px(stroke[i - 1]);
      const b = px(stroke[i]);
      const dx = b[0] - a[0];
      const dy = b[1] - a[1];
      const len = Math.hypot(dx, dy);
      if (len === 0) continue;
      const ux = dx / len;
      const uy = dy / len;

      const step = 0.42;
      for (let d = carried; d < len; d += step) {
        travelled += step;
        // Three scales of wobble decide where the block inks and where it is
        // dry: a patch a few millimetres across, a flicker along the stroke,
        // and grain between one dot and the next. Keeping the longest of them
        // well under the length of a stroke is what stops a whole leaf
        // dropping out in a single trough.
        const wet =
          grain(travelled * 0.09) * 0.34 +
          grain(travelled * 0.5) * 0.41 +
          grain(travelled * 1.8) * 0.25;
        if (wet < s.starve * 0.62) continue;

        const w = size * s.weight;
        // Perpendicular jitter, biased small, so edges fray rather than blur.
        const j = (r() - 0.5) * w * 1.6;
        const rad = w * (0.34 + r() * 0.46) * (0.62 + wet * 0.5);
        ctx.beginPath();
        ctx.arc(a[0] + ux * d - uy * j, a[1] + uy * d + ux * j, rad, 0, Math.PI * 2);
        ctx.fill();

        // The odd speck thrown off the block.
        if (r() < 0.010) {
          const k = (r() - 0.5) * w * 8;
          ctx.beginPath();
          ctx.arc(
            a[0] + ux * d - uy * k,
            a[1] + uy * d + ux * k,
            w * (0.12 + r() * 0.2),
            0,
            Math.PI * 2,
          );
          ctx.fill();
        }
      }
      carried = (carried - len) % step;
      if (carried < 0) carried += step;
    }
  }
  ctx.restore();
}
