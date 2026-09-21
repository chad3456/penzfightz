import { tone, type Bounds, type Ink, type Press } from '../rooms/riso';

/**
 * Flat drawing, for plates rather than rooms.
 *
 * The rooms are isometric and everything in them is a solid. A lantern plate is
 * none of those things: it is an engraving — line first, then a flat wash of
 * colour inside the line, with hatching where it needs to be dark and stipple
 * where it needs to be soft. So this is a second, much smaller vocabulary that
 * talks to the same press in plain canvas coordinates.
 *
 * Everything here works in a unit square: a plate is drawn in 0..1 and scaled
 * to whatever the field is, so the same plate can be a thumbnail on a page and
 * a frame of film without a single number changing.
 */

export interface Field {
  /** Where the unit square lands, in pixels. */
  x: number;
  y: number;
  size: number;
}

export const px = (f: Field, u: number) => f.x + u * f.size;
export const py = (f: Field, v: number) => f.y + v * f.size;
export const pu = (f: Field, u: number) => u * f.size;

export type UPt = [number, number];

export function toScreen(f: Field, pts: UPt[]): UPt[] {
  return pts.map(([u, v]) => [px(f, u), py(f, v)]);
}

function trace(g: CanvasRenderingContext2D, pts: UPt[], close: boolean, smooth: boolean) {
  g.beginPath();
  if (!pts.length) return;
  g.moveTo(pts[0]![0], pts[0]![1]);
  if (!smooth || pts.length < 3) {
    for (const [x, y] of pts.slice(1)) g.lineTo(x, y);
  } else {
    for (let i = 1; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i]!;
      const [x1, y1] = pts[i + 1]!;
      g.quadraticCurveTo(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
    }
    g.lineTo(...pts[pts.length - 1]!);
  }
  if (close) g.closePath();
}

function bounds(pts: UPt[], pad: number): Bounds {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const [x, y] of pts) {
    if (x < x0) x0 = x;
    if (y < y0) y0 = y;
    if (x > x1) x1 = x;
    if (y > y1) y1 = y;
  }
  return [x0 - pad, y0 - pad, x1 - x0 + pad * 2, y1 - y0 + pad * 2];
}

/** A flat wash of one ink inside a shape, opaque against whatever is under it. */
export function wash(
  press: Press, ink: Ink, f: Field, pts: UPt[], density = 0.6, smooth = true,
) {
  const s = toScreen(f, pts);
  press.solid(ink, (g) => {
    g.fillStyle = tone(density);
    trace(g, s, true, smooth);
    g.fill();
  }, bounds(s, 2));
}

/** A line on the key plate. The engraving itself. */
export function line(
  press: Press, f: Field, pts: UPt[],
  weight = 1, close = false, smooth = true,
) {
  const s = toScreen(f, pts);
  press.key((g) => {
    g.lineWidth = Math.max(0.7, pu(f, 0.0026) * weight);
    trace(g, s, close, smooth);
    g.stroke();
  });
}

/** A closed shape, washed and then outlined: the commonest thing on a plate. */
export function shape(
  press: Press, ink: Ink, f: Field, pts: UPt[],
  density = 0.6, weight = 1, smooth = true,
) {
  wash(press, ink, f, pts, density, smooth);
  line(press, f, pts, weight, true, smooth);
}

const rand = (seed: number) => {
  let s = (seed * 2654435761) >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
};

/**
 * Hatching, clipped to a shape.
 *
 * Parallel rules at an angle, which is how an engraver makes a tone. Drawn on
 * the key plate rather than as ink, because on a plate the shading *is* the
 * drawing — a grey wash would make it a painting instead.
 */
export function hatch(
  press: Press, f: Field, pts: UPt[],
  angle = -Math.PI / 4, spacing = 0.012, weight = 0.7, seed = 1,
) {
  const s = toScreen(f, pts);
  const r = rand(seed);
  press.key((g) => {
    g.save();
    trace(g, s, true, true);
    g.clip();
    g.lineWidth = Math.max(0.4, pu(f, 0.0011) * weight);
    const step = pu(f, spacing);
    const reach = f.size * 1.5;
    const cx = px(f, 0.5);
    const cy = py(f, 0.5);
    const ca = Math.cos(angle);
    const sa = Math.sin(angle);
    for (let d = -reach; d <= reach; d += step) {
      const jitter = (r() - 0.5) * step * 0.28;
      g.beginPath();
      g.moveTo(cx + ca * -reach - sa * (d + jitter), cy + sa * -reach + ca * (d + jitter));
      g.lineTo(cx + ca * reach - sa * (d + jitter), cy + sa * reach + ca * (d + jitter));
      g.stroke();
    }
    g.restore();
  });
}

/** Stipple, for anything soft: a shadow, a cloud, the ground under a thing. */
export function stipple(
  press: Press, f: Field, pts: UPt[], n = 400, seed = 2, weight = 1,
) {
  const s = toScreen(f, pts);
  const b = bounds(s, 0);
  const r = rand(seed);
  press.key((g) => {
    g.save();
    trace(g, s, true, true);
    g.clip();
    const dot = Math.max(0.35, pu(f, 0.0016) * weight);
    for (let i = 0; i < n; i++) {
      g.beginPath();
      g.arc(b[0] + r() * b[2], b[1] + r() * b[3], dot * (0.6 + r() * 0.8), 0, Math.PI * 2);
      g.fill();
    }
    g.restore();
  });
}

/** A circle, which a plate needs constantly. */
export function disc(
  press: Press, ink: Ink | null, f: Field,
  cu: number, cv: number, ru: number, density = 0.6, weight = 1,
) {
  const cx = px(f, cu);
  const cy = py(f, cv);
  const r = pu(f, ru);
  if (ink) {
    press.solid(ink, (g) => {
      g.fillStyle = tone(density);
      g.beginPath();
      g.arc(cx, cy, r, 0, Math.PI * 2);
      g.fill();
    }, [cx - r - 2, cy - r - 2, r * 2 + 4, r * 2 + 4]);
  }
  if (weight > 0) {
    press.key((g) => {
      g.lineWidth = Math.max(0.7, pu(f, 0.0026) * weight);
      g.beginPath();
      g.arc(cx, cy, r, 0, Math.PI * 2);
      g.stroke();
    });
  }
}

/**
 * A plate's writing: the italic hand every natural-history engraving is
 * captioned in, and the upright small capitals its rules and figures use.
 */
export function label(
  press: Press, f: Field, text: string, u: number, v: number,
  size = 0.026, style: 'italic' | 'roman' | 'caps' = 'italic',
  align: CanvasTextAlign = 'left',
) {
  press.key((g) => {
    const s = pu(f, size);
    g.font = style === 'italic'
      ? `italic ${s}px Georgia, "Times New Roman", serif`
      : style === 'caps'
        ? `${s}px ui-monospace, SFMono-Regular, Menlo, monospace`
        : `${s}px Georgia, "Times New Roman", serif`;
    g.textAlign = align;
    g.textBaseline = 'alphabetic';
    if (style === 'caps') {
      g.letterSpacing = `${s * 0.16}px`;
      g.fillText(text.toUpperCase(), px(f, u), py(f, v));
      g.letterSpacing = '0px';
    } else {
      g.fillText(text, px(f, u), py(f, v));
    }
  });
}

/** A leader line from a label to the thing it names. */
export function leader(press: Press, f: Field, from: UPt, to: UPt) {
  line(press, f, [from, to], 0.6, false, false);
  const [tx, ty] = toScreen(f, [to])[0]!;
  press.key((g) => {
    g.beginPath();
    g.arc(tx, ty, Math.max(0.8, pu(f, 0.0032)), 0, Math.PI * 2);
    g.fill();
  });
}

/** A measured dimension, with its arrows and its figure. */
export function dimension(press: Press, f: Field, a: UPt, b: UPt, text: string) {
  line(press, f, [a, b], 0.55, false, false);
  const [ax, ay] = toScreen(f, [a])[0]!;
  const [bx, by] = toScreen(f, [b])[0]!;
  const ang = Math.atan2(by - ay, bx - ax);
  const tick = pu(f, 0.012);
  press.key((g) => {
    g.lineWidth = Math.max(0.4, pu(f, 0.0012));
    for (const [x, y, dir] of [[ax, ay, 1], [bx, by, -1]] as const) {
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + Math.cos(ang + 0.35) * tick * dir, y + Math.sin(ang + 0.35) * tick * dir);
      g.moveTo(x, y);
      g.lineTo(x + Math.cos(ang - 0.35) * tick * dir, y + Math.sin(ang - 0.35) * tick * dir);
      g.stroke();
    }
  });
  label(press, f, text, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - 0.018, 0.021, 'caps', 'center');
}
