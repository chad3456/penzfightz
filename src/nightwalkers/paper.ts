/**
 * Parchment, and a nib to write on it with.
 *
 * Everything the map is drawn with lives here: the sheet, its creases and its
 * foxing, and the three marks a pen can make on it — a line, a band of poché
 * hatching, and a footprint. Nothing here knows what a castle is.
 */

export type Pt = [x: number, y: number];

export const INK = '#4a3320';
export const INK_PALE = '#6d5236';
export const INK_RED = '#8c3a2a';

/* ── the nib ──────────────────────────────────────────────────────────── */

export interface Nib {
  /** Ink colour. */
  ink: string;
  /** Nominal width, in pixels. */
  width: number;
  /** How far the line wanders off the path it meant to take, in pixels. */
  wobble: number;
  /** 0 is a ruling pen, 1 is a very tired quill. */
  tremble: number;
  /** Multiplies the width. Two passes reads as ink gone over twice. */
  passes: number;
  alpha: number;
}

export const nib = (o: Partial<Nib> = {}): Nib => ({
  ink: INK, width: 1.5, wobble: 0.7, tremble: 0.5, passes: 1, alpha: 0.92, ...o,
});

/** Deterministic noise. Same seed, same hand. */
const rnd = (s: number) => {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const wander = (s: number) => Math.sin(s * 0.9) * 0.6 + Math.sin(s * 2.3 + 1.7) * 0.3 + Math.sin(s * 5.1) * 0.1;

/** Resample a path so its points are evenly spaced, for wobbling. */
function resample(path: Pt[], step: number): Pt[] {
  if (path.length < 2) return path;
  const out: Pt[] = [path[0]!];
  let carry = 0;
  for (let i = 1; i < path.length; i++) {
    const [x0, y0] = out.length ? path[i - 1]! : path[i - 1]!;
    const [x1, y1] = path[i]!;
    const len = Math.hypot(x1 - x0, y1 - y0);
    if (len < 1e-6) continue;
    let d = step - carry;
    while (d < len) {
      out.push([x0 + ((x1 - x0) * d) / len, y0 + ((y1 - y0) * d) / len]);
      d += step;
    }
    carry = len - (d - step);
  }
  out.push(path[path.length - 1]!);
  return out;
}

/**
 * A line, drawn with a pen rather than with `stroke()`.
 *
 * The path is resampled, every sample is pushed sideways by a slow wave, and
 * the result is drawn in short segments whose width breathes. A pen does three
 * things a stroke does not: it wanders, it varies, and it pools a little where
 * it turns — and of those the wander matters most, because a perfectly
 * straight ink line on a piece of parchment reads as a printed line and takes
 * the whole sheet down with it.
 */
export function line(g: CanvasRenderingContext2D, path: Pt[], n: Nib, seed = 1) {
  if (path.length < 2) return;
  const pts = resample(path, Math.max(3, n.width * 3.5));
  if (pts.length < 2) return;

  g.save();
  g.lineCap = 'round';
  g.lineJoin = 'round';
  g.strokeStyle = n.ink;

  for (let pass = 0; pass < n.passes; pass++) {
    const off = seed * 17.3 + pass * 53.7;
    g.globalAlpha = n.alpha * (pass === 0 ? 1 : 0.5);
    let prev: Pt | null = null;
    for (let i = 0; i < pts.length; i++) {
      const [x, y] = pts[i]!;
      // Sideways, along the local normal.
      const [px, py] = pts[Math.max(0, i - 1)]!;
      const [nx, ny] = pts[Math.min(pts.length - 1, i + 1)]!;
      const dx = nx - px;
      const dy = ny - py;
      const len = Math.hypot(dx, dy) || 1;
      const w = wander(i * 0.5 + off) * n.wobble;
      const here: Pt = [x + (-dy / len) * w, y + (dx / len) * w];
      if (prev) {
        g.lineWidth = n.width * (0.78 + wander(i * 0.8 + off * 1.7) * 0.28 * n.tremble + 0.22);
        g.beginPath();
        g.moveTo(prev[0], prev[1]);
        g.lineTo(here[0], here[1]);
        g.stroke();
      }
      prev = here;
    }
  }
  g.restore();
}

/** A closed figure. */
export const ring = (g: CanvasRenderingContext2D, pts: Pt[], n: Nib, seed = 1) =>
  line(g, [...pts, pts[0]!], n, seed);

/** A circle, as a path, so the nib can wobble round it. */
export function circlePath(cx: number, cy: number, r: number, steps = 64): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  return out;
}

/**
 * Poché: the hatching that fills the thickness of a wall on a plan.
 *
 * Parallel strokes at forty-five degrees, clipped to whatever shape has
 * already been pathed. It is what tells the eye that the band between two
 * lines is solid masonry and not a corridor, and a plan without it reads as a
 * wiring diagram.
 */
export function hatch(
  g: CanvasRenderingContext2D,
  clip: () => void,
  box: [number, number, number, number],
  spacing: number,
  n: Nib,
  angle = Math.PI / 4,
  seed = 1,
) {
  const [x, y, w, h] = box;
  if (w <= 0 || h <= 0 || spacing < 0.35) return;
  g.save();
  g.beginPath();
  clip();
  /*
    Even-odd, and it has to be said out loud.

    The band is described as the outer figure followed by the inner one, both
    wound the same way, so under the default non-zero rule the hole is not a
    hole and the clip is simply the outer figure. What that looks like is a
    castle whose every room has been filled in solid with hatching — which is
    exactly what it did look like, and which reads as a drawing mistake rather
    than as a missing argument.
  */
  g.clip('evenodd');
  /*
    Ruled, not drawn.

    The wall outlines wobble because a pen wobbles; the hatching inside them
    does not, because it is drawn against a straight edge — and because there
    are about a hundred lines per wall and putting the full nib through every
    one of them costs a third of a second per plate for a difference nobody
    can see at a stud and a half of spacing.
  */
  const diag = Math.hypot(w, h);
  const cx = x + w / 2;
  const cy = y + h / 2;
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  const count = Math.ceil(diag / spacing) + 2;
  g.strokeStyle = n.ink;
  g.lineCap = 'round';
  for (let i = -count; i <= count; i++) {
    const j = rnd(seed * 3.1 + i * 7.7);
    g.globalAlpha = n.alpha * (0.5 + j * 0.5);
    g.lineWidth = n.width * (0.7 + j * 0.5);
    const ox = cx + -dy * (i * spacing + (j - 0.5) * spacing * 0.3);
    const oy = cy + dx * (i * spacing + (j - 0.5) * spacing * 0.3);
    g.beginPath();
    g.moveTo(ox - dx * diag, oy - dy * diag);
    g.lineTo(ox + dx * diag, oy + dy * diag);
    g.stroke();
  }
  g.restore();
}

/* ── the sheet ────────────────────────────────────────────────────────── */

export interface Sheet {
  /** Pixels per world unit. */
  scale: number;
  /** World coordinate at the canvas origin. */
  ox: number;
  oy: number;
}

/**
 * Lay down parchment across a rectangle of canvas.
 *
 * Four things in order, and the order is the whole recipe: a warm ground, a
 * slow blotchy wash so it is never one colour, foxing where it has been damp,
 * and the creases where it has been folded — which are drawn as a dark line
 * with a light line beside it, because a fold is a ridge and a ridge has two
 * sides.
 */
export function parchment(
  g: CanvasRenderingContext2D,
  w: number,
  h: number,
  s: Sheet,
) {
  g.save();
  g.fillStyle = '#e4d4ae';
  g.fillRect(0, 0, w, h);

  // The slow wash. Big soft blotches in world coordinates, so panning does not
  // drag the grain of the paper about with the view.
  for (let i = 0; i < 90; i++) {
    const wx = -600 + rnd(i * 7.1) * 1400;
    const wy = -600 + rnd(i * 11.3) * 1400;
    const x = (wx - s.ox) * s.scale;
    const y = (wy - s.oy) * s.scale;
    const r = (40 + rnd(i * 3.7) * 150) * s.scale * 0.4;
    if (x + r < 0 || x - r > w || y + r < 0 || y - r > h) continue;
    const grad = g.createRadialGradient(x, y, 0, x, y, r);
    const dark = rnd(i * 5.9) > 0.5;
    grad.addColorStop(0, dark ? 'rgba(154, 126, 82, 0.16)' : 'rgba(247, 234, 203, 0.2)');
    grad.addColorStop(1, 'rgba(228, 212, 174, 0)');
    g.fillStyle = grad;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  }

  // Foxing: small hard-edged rust spots, the thing that says old paper rather
  // than beige paper.
  for (let i = 0; i < 260; i++) {
    const wx = -560 + rnd(i * 2.3 + 0.5) * 1320;
    const wy = -560 + rnd(i * 4.7 + 1.5) * 1320;
    const x = (wx - s.ox) * s.scale;
    const y = (wy - s.oy) * s.scale;
    if (x < -20 || x > w + 20 || y < -20 || y > h + 20) continue;
    const r = (0.5 + rnd(i * 9.1) * 2.2) * Math.max(1, s.scale * 0.5);
    g.globalAlpha = 0.1 + rnd(i * 13.7) * 0.22;
    g.fillStyle = rnd(i * 6.1) > 0.35 ? '#9a6f3e' : '#7d5c3a';
    g.beginPath();
    g.ellipse(x, y, r, r * (0.6 + rnd(i * 3.3) * 0.8), rnd(i) * 3, 0, Math.PI * 2);
    g.fill();
  }
  g.globalAlpha = 1;

  /*
    The creases.

    This sheet folds into eight, so the folds are at fixed world coordinates
    rather than fixed screen ones — fold a map and then unfold it somewhere
    else and the creases do not move. Each is a dark line with a pale one just
    beside it: the dark side is the valley, the pale side is the light catching
    the ridge.
  */
  const folds: [Pt, Pt][] = [
    [[-6, -400], [-6, 400]],
    [[86, -400], [86, 400]],
    [[-400, 10], [400, 10]],
    [[-400, 74], [400, 74]],
  ];
  for (const [[ax, ay], [bx, by]] of folds) {
    const p0: Pt = [(ax - s.ox) * s.scale, (ay - s.oy) * s.scale];
    const p1: Pt = [(bx - s.ox) * s.scale, (by - s.oy) * s.scale];
    g.globalAlpha = 0.16;
    line(g, [p0, p1], nib({ ink: '#8d7245', width: 2.2, wobble: 1.6, passes: 1 }), ax * 3 + ay);
    g.globalAlpha = 0.13;
    const n: Pt = [p1[1] - p0[1], -(p1[0] - p0[0])];
    const l = Math.hypot(n[0], n[1]) || 1;
    const d = 2.2;
    line(g, [
      [p0[0] + (n[0] / l) * d, p0[1] + (n[1] / l) * d],
      [p1[0] + (n[0] / l) * d, p1[1] + (n[1] / l) * d],
    ], nib({ ink: '#fbf3dc', width: 2, wobble: 1.6, passes: 1 }), ax * 5 + ay);
  }
  g.globalAlpha = 1;
  g.restore();
}

/* ── footprints ───────────────────────────────────────────────────────── */

/**
 * One shoe, pointing along a heading.
 *
 * A sole and a heel, because the pair is what makes it read as a footprint
 * rather than as a smudge — a single blob at this size is a full stop.
 */
export function footprint(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  heading: number,
  size: number,
  alpha: number,
  ink = INK,
) {
  if (alpha <= 0.01) return;
  g.save();
  g.translate(x, y);
  g.rotate(heading + Math.PI / 2);
  g.globalAlpha = alpha;
  g.fillStyle = ink;
  g.beginPath();
  g.ellipse(0, -size * 0.28, size * 0.3, size * 0.5, 0, 0, Math.PI * 2);
  g.fill();
  g.beginPath();
  g.ellipse(0, size * 0.42, size * 0.24, size * 0.28, 0, 0, Math.PI * 2);
  g.fill();
  g.restore();
}
