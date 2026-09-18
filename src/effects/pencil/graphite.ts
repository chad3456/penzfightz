/**
 * A pencil, and the six things that make one look like a pencil.
 *
 * A stroked path is the wrong primitive for graphite and no amount of styling
 * fixes it, because `ctx.stroke()` lays down a band of uniform darkness with
 * clean edges and a pencil does the exact opposite of both. So nothing here is
 * stroked. A mark is a run of small deposits along a path, and what varies
 * between one mark and another is how those deposits are placed.
 *
 * 1. **Tooth.** Paper is not flat. Graphite catches the raised grain and skips
 *    the pits, so the darkness along a line flickers at a much finer scale than
 *    the line itself. This is the single biggest tell; without it the line
 *    reads as ink however soft its edges are.
 * 2. **Pressure sets darkness and width together.** A pencil pressed harder
 *    both spreads and blackens, and a mark that changes one without the other
 *    looks like a brush instead.
 * 3. **The hand arrives and leaves.** Pressure ramps in and out, so a stroke is
 *    palest at both ends. A line of constant weight along its whole length is
 *    the signature of a machine.
 * 4. **Nothing is drawn once.** A sketched contour is two, three or four passes
 *    that nearly coincide and disagree by a fraction of a millimetre. The
 *    disagreement is the drawing.
 * 5. **Lines overshoot.** A hand travelling fast does not stop dead at a corner.
 * 6. **The construction stays.** The circle the head was built on is still
 *    faintly there under the face. Erasing it would be tidier and would stop
 *    the picture reading as a sketch at all.
 */

export type Pt = [number, number];

/** Deterministic, so a given face is the same face every time it is drawn. */
export function rng(seed: number): () => number {
  let s = (seed * 2654435761) >>> 0 || 1;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}

/** Cheap 1-D value noise, for the tooth and for the wander of a hand. */
export function noise(seed: number) {
  const r = rng(seed);
  const table = Array.from({ length: 256 }, () => r());
  return (x: number): number => {
    const i = Math.floor(x);
    const f = x - i;
    const a = table[((i % 256) + 256) % 256]!;
    const b = table[(((i + 1) % 256) + 256) % 256]!;
    const t = f * f * (3 - 2 * f);
    return a + (b - a) * t;
  };
}

export interface Pencil {
  /** 0 hard and pale (2H) … 1 soft and black (6B). */
  grade: number;
  /** How hard the hand is pressing overall, 0..1. */
  press: number;
  /** Nib width in pixels at full pressure. */
  size: number;
  /** How ragged the deposit is. Low on smooth paper, high on rough. */
  tooth: number;
  /** How far the hand strays from the path it meant to draw. */
  wobble: number;
  /** Passes over the same path. One is a ruled line; three is a sketch. */
  passes: number;
  /** How far a stroke runs past its end, in pixels. */
  overshoot: number;
}

export const HB: Pencil = {
  grade: 0.55, press: 0.6, size: 1.5, tooth: 0.55, wobble: 0.9, passes: 2, overshoot: 2.5,
};

export function pencil(base: Pencil, over: Partial<Pencil>): Pencil {
  return { ...base, ...over };
}

/** Sample a polyline at a fixed step, so deposits are evenly spaced. */
function resample(path: Pt[], step: number): Pt[] {
  if (path.length < 2) return path.slice();
  const out: Pt[] = [path[0]!];
  let carry = 0;
  for (let i = 1; i < path.length; i++) {
    const [x0, y0] = path[i - 1]!;
    const [x1, y1] = path[i]!;
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
  out.push(path[path.length - 1]!);
  return out;
}

/** A catmull-rom through the given points, so a few anchors give a live curve. */
export function smooth(points: Pt[], per = 8): Pt[] {
  if (points.length < 3) return points.slice();
  const out: Pt[] = [];
  const at = (i: number) => points[Math.max(0, Math.min(points.length - 1, i))]!;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = at(i - 1); const p1 = at(i); const p2 = at(i + 1); const p3 = at(i + 2);
    for (let j = 0; j < per; j++) {
      const t = j / per;
      const t2 = t * t;
      const t3 = t2 * t;
      out.push([
        0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
        0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
      ]);
    }
  }
  out.push(points[points.length - 1]!);
  return out;
}

export interface StrokeOptions {
  /** Pressure along the stroke, 0..1 in, 0..1 out. Defaults to a hand arriving and leaving. */
  profile?: (t: number) => number;
  /** Multiplies the pencil's own pressure. */
  weight?: number;
  /** Skip the taper — for a mark that starts already committed. */
  flat?: boolean;
}

/**
 * Lay one mark along a path.
 *
 * Everything is deposited as small round stamps at low alpha. Overlap is what
 * produces darkness, which is also how graphite actually works: the second pass
 * over a line is darker because there is more of it on the paper, not because
 * anything asked for a darker colour.
 */
export function mark(
  g: CanvasRenderingContext2D,
  path: Pt[],
  p: Pencil,
  seed: number,
  opts: StrokeOptions = {},
) {
  if (path.length < 2) return;
  const r = rng(seed);
  const tooth = noise(seed * 7 + 11);
  const drift = noise(seed * 13 + 3);
  const profile = opts.profile ?? ((t: number) => (opts.flat ? 1 : Math.sin(Math.PI * Math.min(1, t * 1.15)) ** 0.45));
  const weight = opts.weight ?? 1;

  for (let pass = 0; pass < p.passes; pass++) {
    // Each pass is its own hand: a slightly different idea of where the line is.
    const offX = (r() - 0.5) * p.wobble * 1.6;
    const offY = (r() - 0.5) * p.wobble * 1.6;
    const passWeight = pass === 0 ? 1 : 0.55 + r() * 0.4;

    const extended = extend(path, p.overshoot * (0.4 + r()));
    const pts = resample(extended, 1.15);
    const n = pts.length;

    for (let i = 0; i < n; i++) {
      const [x, y] = pts[i]!;
      const t = i / Math.max(1, n - 1);

      // The tooth: a fast flicker that decides how much graphite stuck here.
      const grain = tooth(i * 0.55 + pass * 40);
      const catching = grain > p.tooth * 0.42 ? 1 : grain / (p.tooth * 0.42 + 1e-6);

      const pressure = profile(t) * p.press * weight * passWeight * (0.82 + drift(i * 0.06) * 0.36);
      if (pressure <= 0.01) continue;

      const width = p.size * (0.45 + pressure * 0.9);
      const alpha = Math.min(0.9, (0.1 + p.grade * 0.42) * pressure * catching);
      if (alpha < 0.004) continue;

      // Deposits stray across the line as well as along it, which is what gives
      // a pencil line its fuzzy shoulders without blurring its core.
      const spread = width * 0.5 * p.tooth;
      const jx = (drift(i * 0.31 + pass * 17) - 0.5) * spread + offX;
      const jy = (drift(i * 0.31 + pass * 29 + 100) - 0.5) * spread + offY;

      g.globalAlpha = alpha;
      g.beginPath();
      g.arc(x + jx, y + jy, width * 0.5, 0, Math.PI * 2);
      g.fill();
    }
  }
  g.globalAlpha = 1;
}

/** Run a path a little past both ends, along its own direction. */
function extend(path: Pt[], by: number): Pt[] {
  if (by <= 0 || path.length < 2) return path;
  const out = path.slice();
  const lead = (a: Pt, b: Pt): Pt => {
    const d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    return [a[0] - ((b[0] - a[0]) / d) * by, a[1] - ((b[1] - a[1]) / d) * by];
  };
  out.unshift(lead(out[0]!, out[1]!));
  out.push(lead(out[out.length - 1]!, out[out.length - 2]!));
  return out;
}

/**
 * Hatching: shade by laying parallel lines, never by filling.
 *
 * A filled grey is the other half of the ink problem — real pencil shading is
 * directional, and the direction is a decision the hand made. Tone comes from
 * how close together the lines are and how hard they were pressed.
 */
export function hatch(
  g: CanvasRenderingContext2D,
  poly: Pt[],
  p: Pencil,
  seed: number,
  angle: number,
  gap: number,
  weight = 1,
) {
  if (poly.length < 3) return;
  let minX = Infinity; let minY = Infinity; let maxX = -Infinity; let maxY = -Infinity;
  for (const [x, y] of poly) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  g.save();
  g.beginPath();
  g.moveTo(poly[0]![0], poly[0]![1]);
  for (const [x, y] of poly.slice(1)) g.lineTo(x, y);
  g.closePath();
  g.clip();

  const r = rng(seed);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const reach = Math.hypot(maxX - minX, maxY - minY) * 0.75;
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  const count = Math.ceil((reach * 2) / gap);
  for (let i = 0; i <= count; i++) {
    const off = -reach + i * gap + (r() - 0.5) * gap * 0.3;
    const mx = cx - dy * off;
    const my = cy + dx * off;
    mark(
      g,
      [[mx - dx * reach, my - dy * reach], [mx + dx * reach, my + dy * reach]],
      pencil(p, { passes: 1, overshoot: 0 }),
      seed * 31 + i,
      { weight: weight * (0.75 + r() * 0.5) },
    );
  }
  g.restore();
}

/**
 * The paper.
 *
 * Not white. A sheet of cartridge paper is a warm grey a long way off white,
 * and putting graphite on true white makes the darks look like holes. The
 * flecks are the tooth again, at rest.
 */
export function paper(g: CanvasRenderingContext2D, w: number, h: number, seed: number) {
  g.fillStyle = '#f2f0ea';
  g.fillRect(0, 0, w, h);
  const r = rng(seed);
  g.fillStyle = '#000';
  for (let i = 0; i < (w * h) / 22; i++) {
    const x = r() * w;
    const y = r() * h;
    g.globalAlpha = 0.012 + r() * 0.03;
    g.fillRect(x, y, 1, 1);
  }
  // A few longer fibres, which is what stops the grain reading as TV static.
  for (let i = 0; i < w / 6; i++) {
    const x = r() * w;
    const y = r() * h;
    const a = r() * Math.PI;
    g.globalAlpha = 0.02 + r() * 0.03;
    g.fillRect(x, y, Math.cos(a) * (2 + r() * 5), Math.sin(a) * 1);
  }
  g.globalAlpha = 1;
}
