import type { Rgb, Sheet } from './sheet';

/**
 * The crayon.
 *
 * One function does nearly all of the work here: walk a path, and at every step
 * across the width of the nib decide whether pigment sticks. It sticks when the
 * pressure at that point beats the tooth of the paper underneath it.
 *
 *     stick  ⇔  pressure · falloff · bite  >  tooth(x, y)
 *
 * That single comparison produces, for free, most of what you recognise in the
 * medium: the mark breaks up where the pressure is light, it goes solid where
 * the hand leans in, the edges are ragged because the falloff is weakest there,
 * and two crossing strokes skip over the same bumps because they are reading
 * the same page-space field.
 *
 * The other half is the **pressure envelope**. A hand does not apply constant
 * force: the mark starts thin, swells through the middle and skids off at the
 * end, with a slow wobble along the way. Draw a stroke at constant pressure and
 * it reads as a machine, however good the grain is.
 */

export type Pt = [number, number];

export interface Nib {
  colour: Rgb;
  /** Half-width of the mark, in pixels, at full pressure. */
  width: number;
  /** How hard the pigment bites. Above ~1.1 the mark goes solid. */
  bite: number;
  /** 0 = even pressure, 1 = a hard swell in the middle and skid at the end. */
  hand: number;
  /** Extra ragged-edge wander, in pixels. */
  fray: number;
  /**
   * Width multiplier at the start and at the end of the stroke.
   *
   * A crayon held at an angle makes a **wedge**, and a limb is a wedge: thick
   * at the shoulder, thin at the wrist. Without this every limb comes out the
   * same width along its whole length, which is a wire armature rather than an
   * arm — and no amount of grain or pressure variation rescues it, because the
   * problem is the silhouette and not the surface.
   */
  taper?: [number, number];
}

/** Resample a polyline to even spacing, smoothing corners as a hand would. */
export function walk(path: Pt[], step: number): Pt[] {
  if (path.length < 2) return path;
  // Chaikin twice: a hand rounds every corner it turns.
  let pts = path;
  for (let pass = 0; pass < 2; pass++) {
    const out: Pt[] = [pts[0]];
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, ay] = pts[i];
      const [bx, by] = pts[i + 1];
      out.push([ax + (bx - ax) * 0.25, ay + (by - ay) * 0.25]);
      out.push([ax + (bx - ax) * 0.75, ay + (by - ay) * 0.75]);
    }
    out.push(pts[pts.length - 1]);
    pts = out;
  }

  const out: Pt[] = [];
  let carry = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i];
    const [bx, by] = pts[i + 1];
    const seg = Math.hypot(bx - ax, by - ay);
    if (seg < 1e-6) continue;
    let d = carry;
    while (d < seg) {
      const t = d / seg;
      out.push([ax + (bx - ax) * t, ay + (by - ay) * t]);
      d += step;
    }
    carry = d - seg;
  }
  out.push(pts[pts.length - 1]);
  return out;
}

/**
 * The pressure along a stroke, 0..1.
 *
 * Light on, heavy through, skidding off — plus a slow wobble so no two marks
 * have the same weight in the same place.
 */
function pressure(t: number, hand: number, wob: (x: number) => number): number {
  // Attack is quick, release is long: a crayon is put down decisively and
  // lifted gradually, which is why marks taper at the end and not the start.
  const onset = Math.min(1, t / 0.07);
  const release = Math.min(1, (1 - t) / 0.3) ** 0.7;
  const swell = 0.72 + 0.42 * Math.sin(Math.PI * t ** 0.85);
  const wobble = 1 + wob(t * 5.5) * 0.5;
  const flat = 1 - hand;
  return Math.max(0, (flat + hand * onset * release * swell) * wobble);
}

/** Smooth 1-D noise, for the wobble and the fray. */
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

/** Drag the nib along a path. */
export function drag(sheet: Sheet, path: Pt[], nib: Nib, seed: number) {
  const pts = walk(path, 0.6);
  if (pts.length < 2) return;
  const wob = wander(seed);
  const frayA = wander(seed ^ 0x1f3d);
  const frayB = wander(seed ^ 0x77a1);

  for (let i = 0; i < pts.length; i++) {
    const t = i / (pts.length - 1);
    const [x, y] = pts[i];
    const [px, py] = pts[Math.min(pts.length - 1, i + 1)];
    const [qx, qy] = pts[Math.max(0, i - 1)];
    const dx = px - qx;
    const dy = py - qy;
    const len = Math.hypot(dx, dy) || 1;
    // Across the stroke.
    const nx = -dy / len;
    const ny = dx / len;

    const p = pressure(t, nib.hand, wob);
    // The wedge. Interpolated along the stroke, so one call draws a limb that
    // narrows from the shoulder to the wrist.
    const wedge = nib.taper ? nib.taper[0] + (nib.taper[1] - nib.taper[0]) * t : 1;
    // The two edges wander independently, so the mark is never a ribbon of
    // constant width — one side skids while the other holds.
    const w0 = nib.width * wedge * (1 + frayA(t * 7) * nib.fray);
    const w1 = nib.width * wedge * (1 + frayB(t * 7) * nib.fray);

    // Step across the widest the nib ever gets, not its current width, or a
    // tapering stroke goes gappy at the fat end.
    const span = Math.max(2, nib.width * Math.max(1, nib.taper?.[0] ?? 1, nib.taper?.[1] ?? 1) * 1.8);
    for (let s = -1; s <= 1; s += 1 / span) {
      const half = s < 0 ? w0 : w1;
      const u = s;
      // Pigment thins toward the edge of the nib.
      const falloff = (1 - u * u) ** 0.55;
      const gx = x + nx * u * half;
      const gy = y + ny * u * half;
      const force = p * falloff * nib.bite;
      if (force <= sheet.at(gx, gy)) continue;
      // How far past the tooth it got decides how opaque the deposit is.
      const a = Math.min(1, (force - sheet.at(gx, gy)) * 2.6);
      sheet.put(gx, gy, nib.colour, a);
    }
  }
}

/**
 * Scrub a shape solid.
 *
 * The black pan and the orange blush in the reference are not filled polygons;
 * they are the same crayon gone over the same patch a dozen times. So this
 * scribbles rather than fills — overlapping passes at different angles, with the
 * weight varying across the patch, which leaves the streaks and the weather a
 * real scrubbed mass has.
 *
 * Two things had to be got right. The scan spacing must be **tighter than the
 * nib**, or the passes read as engraving hatch rather than as a mass — the first
 * version spaced them at 0.85 of the nib width and produced something that
 * looked printed. And the weight must vary on a *two-dimensional* field: vary it
 * only along the scan direction and the patch comes out striped, which is the
 * same failure wearing a different hat.
 */
export function scrub(
  sheet: Sheet,
  /** Depth into the shape: 0 outside, 1 well inside. */
  depth: (x: number, y: number) => number,
  box: { x0: number; y0: number; x1: number; y1: number },
  nib: Nib,
  seed: number,
  opts: { passes?: number; angle?: number } = {},
) {
  const passes = opts.passes ?? 3;
  const angle = opts.angle ?? 0.35;
  const blotch = wander(seed);
  const streak = wander(seed ^ 0x2c71);
  const cx = (box.x0 + box.x1) / 2;
  const cy = (box.y0 + box.y1) / 2;
  const span = Math.hypot(box.x1 - box.x0, box.y1 - box.y0);

  for (let pass = 0; pass < passes; pass++) {
    const a = angle + pass * 0.7;
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    for (let off = -span / 2; off <= span / 2; off += 0.55) {
      for (let d = -span / 2; d <= span / 2; d += 0.55) {
        const x = cx + ca * d - sa * off;
        const y = cy + sa * d + ca * off;
        const into = depth(x, y);
        if (into <= 0) continue;
        // Weight on a two-dimensional field, so the mass gets blotches rather
        // than stripes, plus a streak along the drag so the direction shows.
        const p =
          0.74 +
          blotch(x * 0.055 + pass * 31) * 0.5 +
          blotch(y * 0.061 - pass * 17) * 0.5 +
          streak(d * 0.05 + pass * 9) * 0.3;
        const force = p * nib.bite * into;
        const tooth = sheet.at(x, y);
        if (force <= tooth) continue;
        sheet.put(x, y, nib.colour, Math.min(1, (force - tooth) * 2.4));
      }
    }
  }
}

/**
 * Depth into an ellipse, for `scrub`.
 *
 * A depth rather than a yes-or-no, so the mass fades out over the last few
 * pixels instead of stopping at a mathematically perfect boundary — and the
 * boundary itself is pushed about by noise, because nothing scribbled by hand
 * has a clean edge. Both together are what stop a scrubbed patch reading as a
 * filled shape.
 */
export const inEllipse = (
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  rot = 0,
  seed = 1,
) => {
  const edge = wander(seed ^ 0x5a3d);
  const soft = Math.max(2.5, Math.min(rx, ry) * 0.22);
  return (x: number, y: number) => {
    const c = Math.cos(-rot);
    const s = Math.sin(-rot);
    const dx = x - cx;
    const dy = y - cy;
    const u = (dx * c - dy * s) / rx;
    const v = (dx * s + dy * c) / ry;
    const r = Math.sqrt(u * u + v * v);
    // Ragged: the rim wanders in and out by a few per cent as you go round it.
    const wob = edge(Math.atan2(v, u) * 2.4 + seed) * 0.22;
    return Math.max(0, Math.min(1, ((1 + wob - r) * Math.min(rx, ry)) / soft));
  };
};

/** The same for a closed polygon: 1 inside, 0 outside. */
export const inPoly = (poly: Pt[]) => (x: number, y: number) => {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit ? 1 : 0;
};
