import { tone, type Bounds, type Ink, type Press } from './riso';

/**
 * Two-to-one isometric, and the two things that make a box read as a box.
 *
 * `sx = (x - z) * U`, `sy = (x + z) * U/2 - y * V`. It is the projection every
 * game from the nineties used, and the reason is that at two-to-one the
 * diagonals land on exact pixel ratios, so a long edge stays crisp instead of
 * crawling.
 *
 * The two things are **shading** and **line**. Every solid gets its three
 * visible faces at three different densities — top lightest, left mid, right
 * darkest — because that is the only cue in the picture that light has a
 * direction. And every solid gets a keyline drawn round it afterwards, on the
 * line plate, because these prints are drawings that have been coloured in
 * rather than coloured shapes that have been arranged. Flat fills alone read
 * as a chart no matter how good the palette is.
 */

/**
 * A view that fits the room to the sheet.
 *
 * Hand-picked units are how twenty-five rooms end up at twenty-five different
 * scales with a different margin round each. The room's own footprint is known,
 * so the scale should be derived from it: the diamond is `(w + d)` units across
 * and `(w + d)/2 + wallH` tall, and everything else follows.
 */
export function fitView(sheetW: number, sheetH: number, w: number, d: number, wallH: number): View {
  const across = w + d;
  const unitByW = (sheetW * 0.96) / across;
  const tall = across * 0.5 + wallH * 1.18;
  const unitByH = (sheetH * 0.94) / tall;
  const unit = Math.min(unitByW, unitByH);
  const rise = unit * 1.18;
  return {
    t: 0,
    ox: sheetW / 2 + ((d - w) * unit) / 2,
    oy: sheetH * 0.5 - (across * 0.5 * unit) / 2 + wallH * rise * 0.42,
    unit,
    rise,
  };
}

export interface View {
  /** Seconds since the room started moving. Everything animated reads this. */
  t: number;
  /**
   * Whether this is the pass that gets kept.
   *
   * Lights are half static and half not: the pool a lamp throws on the floor
   * never changes and is expensive, the flame on top of it changes constantly
   * and is tiny. So the moving layer is run twice — once at the start with this
   * set, to lay down the static halves into the kept sheet, and then on every
   * frame without it. It keeps the split inside the light rather than smeared
   * across two lists of calls in every room.
   */
  still?: boolean;
  /** Where world origin lands on the sheet. */
  ox: number;
  oy: number;
  /** Pixels per world unit along the ground axes. */
  unit: number;
  /** Pixels per world unit of height. */
  rise: number;
}

export type P2 = [number, number];

export const project = (v: View, x: number, y: number, z: number): P2 => [
  v.ox + (x - z) * v.unit,
  v.oy + (x + z) * v.unit * 0.5 - y * v.rise,
];

/**
 * Line weight, from the scale of the view.
 *
 * A fixed pixel width makes the line plate look heavy on a thumbnail and
 * spidery on a detail view — the same drawing, wrong twice. Tied to the unit it
 * is the same *drawing* at both sizes.
 */
export const lw = (v: View, k = 1) => Math.max(0.55, v.unit * 0.034 * k);

/** The screen rectangle a set of points can mark, with room for the line. */
export function bbox(pts: P2[], pad = 2): Bounds {
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

function path(g: CanvasRenderingContext2D, pts: P2[]) {
  g.beginPath();
  g.moveTo(pts[0]![0], pts[0]![1]);
  for (const [x, y] of pts.slice(1)) g.lineTo(x, y);
  g.closePath();
}

function poly(g: CanvasRenderingContext2D, pts: P2[], density: number) {
  if (pts.length < 3) return;
  g.fillStyle = tone(density);
  path(g, pts);
  g.fill();
}

export interface Shades {
  top: number;
  left: number;
  right: number;
}

/*
   Top light, left mid, right dark. The top used to be 0.4 and printed almost
   as bare paper once the screen had it, which flattened every solid in the
   picture — at halftone a light tone loses much more than the number suggests.
*/
const LIT: Shades = { top: 0.52, left: 0.7, right: 0.9 };

export interface BoxOptions extends Partial<Shades> {
  /** Draw the keyline. Off for the odd shape that is only ever a shadow. */
  line?: boolean;
  /** Line weight multiplier, for something very small or very structural. */
  weight?: number;
}

/**
 * A box, from a corner and a size.
 *
 * Only the three faces that can be seen are drawn. Drawing all six and relying
 * on painter's order is a tempting shortcut that costs twice the fill and puts
 * a seam down every silhouette where the back faces poke out by a pixel.
 *
 * The keyline is the silhouette — a hexagon — plus the three edges that meet at
 * the near top corner. Those three are what makes it a solid rather than a
 * hexagon, and leaving them out is the single commonest way isometric art ends
 * up looking like cut paper.
 */
export function box(
  press: Press, ink: Ink, v: View,
  x: number, y: number, z: number,
  w: number, h: number, d: number,
  opts: BoxOptions = {},
) {
  const s = { ...LIT, ...opts };
  const P = (px: number, py: number, pz: number) => project(v, px, py, pz);
  const top = y + h;

  const hull: P2[] = [
    P(x, top, z), P(x + w, top, z), P(x + w, y, z),
    P(x + w, y, z + d), P(x, y, z + d), P(x, top, z + d),
  ];
  press.solid(ink, (g) => {
    poly(g, [P(x, top, z), P(x + w, top, z), P(x + w, top, z + d), P(x, top, z + d)], s.top);
    poly(g, [P(x, top, z + d), P(x + w, top, z + d), P(x + w, y, z + d), P(x, y, z + d)], s.left);
    poly(g, [P(x + w, top, z), P(x + w, top, z + d), P(x + w, y, z + d), P(x + w, y, z)], s.right);
  }, bbox(hull));

  if (opts.line === false) return;
  press.key((g) => {
    g.lineWidth = lw(v, opts.weight ?? 1);
    /*
      The silhouette is a hexagon, and it is easy to get wrong in a way that is
      not obvious from the code and very obvious on the page: put the *near top*
      corner on it and leave off the far right bottom, and every solid in the
      picture reads as an open crate. The near top corner is an interior vertex
      — it is where the three visible faces meet, which is the next path down,
      not part of the outline.
    */
    path(g, [
      P(x, top, z), P(x + w, top, z), P(x + w, y, z),
      P(x + w, y, z + d), P(x, y, z + d), P(x, top, z + d),
    ]);
    g.stroke();
    // The near corner, where the three faces meet.
    g.beginPath();
    const [cx, cy] = P(x + w, top, z + d);
    g.moveTo(...P(x, top, z + d));
    g.lineTo(cx, cy);
    g.lineTo(...P(x + w, top, z));
    g.moveTo(cx, cy);
    g.lineTo(...P(x + w, y, z + d));
    g.stroke();
  });
}

/** A flat quad in the ground plane, drawn and outlined. */
export function slab(
  press: Press, ink: Ink, v: View,
  x: number, z: number, w: number, d: number, density: number,
  y = 0.012, line = true, weight = 0.85,
) {
  const P = (px: number, py: number, pz: number) => project(v, px, py, pz);
  const pts: P2[] = [P(x, y, z), P(x + w, y, z), P(x + w, y, z + d), P(x, y, z + d)];
  // A slab with a line round it is an object and hides what is under it; one
  // without is a shadow or a pool of light and has to multiply.
  if (line) press.solid(ink, (g) => poly(g, pts, density), bbox(pts));
  else press.on(ink, (g) => poly(g, pts, density));
  if (!line) return;
  press.key((g) => {
    g.lineWidth = lw(v, weight);
    path(g, pts);
    g.stroke();
  });
}

/** Kept for shadows and light pools: a quad with no line round it. */
export function patch(
  press: Press, ink: Ink, v: View,
  x: number, z: number, w: number, d: number, density: number, y = 0.01,
) {
  slab(press, ink, v, x, z, w, d, density, y, false);
}

export type FloorPattern = 'weave' | 'check' | 'plank' | 'tile' | 'none';

/**
 * What the floor is made of.
 *
 * In the reference every floor has a texture on it and no floor is a flat
 * colour — a woven mat reads as dots, boards read as long lines, a hall reads
 * as squares. It is the cheapest detail in the whole picture and it is doing an
 * enormous amount of work, because a flat floor makes everything standing on it
 * look pasted on.
 */
export function floorPattern(
  press: Press, ink: Ink, v: View,
  w: number, d: number, kind: FloorPattern, density = 0.5, pitch = 0.5,
) {
  if (kind === 'none') return;
  const P = (px: number, py: number, pz: number) => project(v, px, py, pz);
  press.on(ink, (g) => {
    g.fillStyle = tone(density);
    g.strokeStyle = tone(density);
    if (kind === 'weave') {
      const r = Math.max(0.5, v.unit * 0.035);
      for (let a = pitch * 0.5; a < w; a += pitch) {
        for (let b = pitch * 0.5; b < d; b += pitch) {
          const [sx, sy] = P(a, 0.014, b);
          g.beginPath();
          g.ellipse(sx, sy, r, r * 0.55, 0, 0, Math.PI * 2);
          g.fill();
        }
      }
      return;
    }
    g.lineWidth = Math.max(0.5, v.unit * 0.028);
    if (kind === 'plank') {
      for (let b = pitch; b < d; b += pitch) {
        g.beginPath();
        g.moveTo(...P(0, 0.014, b));
        g.lineTo(...P(w, 0.014, b));
        g.stroke();
      }
      return;
    }
    // check and tile: both grids, tile twice as coarse.
    const step = kind === 'tile' ? pitch * 2 : pitch;
    for (let a = step; a < w; a += step) {
      g.beginPath();
      g.moveTo(...P(a, 0.014, 0));
      g.lineTo(...P(a, 0.014, d));
      g.stroke();
    }
    for (let b = step; b < d; b += step) {
      g.beginPath();
      g.moveTo(...P(0, 0.014, b));
      g.lineTo(...P(w, 0.014, b));
      g.stroke();
    }
  });
}

/**
 * The shell: a floor slab with a thickness, and the two walls behind it.
 *
 * The walls have to be plainly different densities or the corner disappears and
 * the whole back of the room reads as one flat backdrop with a floor stuck to
 * the bottom. A quarter of a stop between them is not enough once the screen
 * has turned both into dots.
 */
export function room(
  press: Press, v: View,
  w: number, d: number, wallH: number,
  floorInk: Ink, wallInk: Ink,
  floorTone = 0.5, wallTone = 0.62,
) {
  const P = (x: number, y: number, z: number) => project(v, x, y, z);

  press.on(floorInk, (g) => {
    poly(g, [P(0, 0, 0), P(w, 0, 0), P(w, 0, d), P(0, 0, d)], floorTone);
    poly(g, [P(0, 0, d), P(w, 0, d), P(w, -0.4, d), P(0, -0.4, d)], floorTone * 1.5);
    poly(g, [P(w, 0, 0), P(w, 0, d), P(w, -0.4, d), P(w, -0.4, 0)], floorTone * 1.85);
  });
  press.on(wallInk, (g) => {
    poly(g, [P(0, 0, 0), P(w, 0, 0), P(w, wallH, 0), P(0, wallH, 0)], wallTone);
    poly(g, [P(0, 0, 0), P(0, 0, d), P(0, wallH, d), P(0, wallH, 0)], wallTone * 1.7);
    poly(g, [P(0, 0, 0), P(w, 0, 0), P(w, 0.08, 0), P(0, 0.08, 0)], wallTone * 2.1);
    poly(g, [P(0, 0, 0), P(0, 0, d), P(0, 0.08, d), P(0, 0.08, 0)], wallTone * 2.4);
  });

  // The line plate: the whole cutaway silhouette, the inside corner, the two
  // wall tops and the skirting. This is what turns two quadrilaterals into a
  // room you are looking into.
  press.key((g) => {
    g.lineWidth = lw(v, 1.15);
    path(g, [
      P(0, wallH, 0), P(w, wallH, 0), P(w, 0, 0), P(w, -0.4, 0),
      P(w, -0.4, d), P(0, -0.4, d), P(0, 0, d), P(0, wallH, d),
    ]);
    g.stroke();
    g.beginPath();
    // Inside corner, floor to wall top.
    g.moveTo(...P(0, 0, 0));
    g.lineTo(...P(0, wallH, 0));
    // Wall tops meeting.
    g.moveTo(...P(0, wallH, 0));
    g.lineTo(...P(w, wallH, 0));
    g.moveTo(...P(0, wallH, 0));
    g.lineTo(...P(0, wallH, d));
    // Floor edges against the walls.
    g.moveTo(...P(0, 0, 0));
    g.lineTo(...P(w, 0, 0));
    g.moveTo(...P(0, 0, 0));
    g.lineTo(...P(0, 0, d));
    // The near floor edges, where the slab's top meets its side.
    g.moveTo(...P(0, 0, d));
    g.lineTo(...P(w, 0, d));
    g.lineTo(...P(w, 0, 0));
    g.stroke();
  });
}

/**
 * Lamplight on the floor.
 *
 * A radial coverage gradient, which the screen then turns into dots that thin
 * out with distance all by itself. That is the whole reason to separate
 * coverage from colour: a glow is one `createRadialGradient` and the press
 * makes it look printed. Never outlined — light has no edge.
 */
export function glow(
  press: Press, ink: Ink, v: View,
  x: number, y: number, z: number, radius: number, strength = 0.7,
) {
  const [sx, sy] = project(v, x, y, z);
  const r = radius * v.unit;
  press.touch([sx - r - 1, sy - r * 0.52 - 1, r * 2 + 2, r * 1.04 + 2]);
  press.over(ink, (g) => {
    const grad = g.createRadialGradient(sx, sy, 0, sx, sy, r);
    grad.addColorStop(0, tone(strength));
    grad.addColorStop(0.45, tone(strength * 0.42));
    grad.addColorStop(1, tone(0));
    g.fillStyle = grad;
    g.save();
    g.translate(sx, sy);
    g.scale(1, 0.52);
    g.beginPath();
    g.arc(0, 0, r, 0, Math.PI * 2);
    g.fill();
    g.restore();
  });
}

/**
 * A cone of light coming off something, on the picture plane.
 *
 * The reference does this constantly — a lamp, a candle, a screen, a doorway —
 * and it is drawn flat as a wedge rather than modelled, because what it is
 * really doing is pointing at whatever the panel is about.
 */
export function cone(
  press: Press, ink: Ink, v: View,
  x: number, y: number, z: number,
  reach: number, spread = 0.55, aim = Math.PI / 2, strength = 0.5,
) {
  const [sx, sy] = project(v, x, y, z);
  const r = reach * v.unit;
  press.touch([sx - r - 1, sy - r - 1, r * 2 + 2, r * 2 + 2]);
  press.over(ink, (g) => {
    const grad = g.createRadialGradient(sx, sy, 0, sx, sy, r);
    grad.addColorStop(0, tone(strength));
    grad.addColorStop(0.55, tone(strength * 0.45));
    grad.addColorStop(1, tone(0));
    g.fillStyle = grad;
    g.beginPath();
    g.moveTo(sx, sy);
    g.arc(sx, sy, r, aim - spread, aim + spread);
    g.closePath();
    g.fill();
  });
}

/** A little burst, for a flame, a spark, a screen catching the light. */
export function spark(
  press: Press, ink: Ink, v: View,
  x: number, y: number, z: number, size: number, points = 8,
) {
  const [sx, sy] = project(v, x, y, z);
  const r = size * v.rise;
  press.solid(ink, (g) => {
    g.fillStyle = tone(0.9);
    g.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
      const rad = i % 2 ? r * 0.36 : r;
      const px = sx + Math.cos(a) * rad;
      const py = sy + Math.sin(a) * rad * 0.9;
      if (i === 0) g.moveTo(px, py); else g.lineTo(px, py);
    }
    g.closePath();
    g.fill();
  }, [sx - r - 2, sy - r - 2, r * 2 + 4, r * 2 + 4]);
}

/** An upright plane facing one way, for anything thin: a door, a picture. */
export function panel(
  press: Press, ink: Ink, v: View,
  x: number, y: number, z: number, w: number, h: number, density: number,
  along: 'x' | 'z' = 'x', line = true,
) {
  const P = (px: number, py: number, pz: number) => project(v, px, py, pz);
  const pts: P2[] = along === 'x'
    ? [P(x, y, z), P(x + w, y, z), P(x + w, y + h, z), P(x, y + h, z)]
    : [P(x, y, z), P(x, y, z + w), P(x, y + h, z + w), P(x, y + h, z)];
  if (line) press.solid(ink, (g) => poly(g, pts, density), bbox(pts));
  else press.on(ink, (g) => poly(g, pts, density));
  if (!line) return;
  press.key((g) => {
    g.lineWidth = lw(v, 0.85);
    path(g, pts);
    g.stroke();
  });
}

/** A free line on the key plate between two world points. */
export function rule(
  press: Press, v: View,
  a: [number, number, number], b: [number, number, number], weight = 0.8,
) {
  press.key((g) => {
    g.lineWidth = lw(v, weight);
    g.beginPath();
    g.moveTo(...project(v, a[0], a[1], a[2]));
    g.lineTo(...project(v, b[0], b[1], b[2]));
    g.stroke();
  });
}

/** A filled blob on the picture plane with a line round it, for organic shapes. */
export function blob(
  press: Press, ink: Ink, v: View,
  x: number, y: number, z: number,
  rx: number, ry: number, density = 0.7, line = true,
) {
  const [sx, sy] = project(v, x, y, z);
  const a = rx * v.unit;
  const b = ry * v.rise;
  const draw = (g: CanvasRenderingContext2D) => {
    g.fillStyle = tone(density);
    g.beginPath();
    g.ellipse(sx, sy, a, b, 0, 0, Math.PI * 2);
    g.fill();
  };
  if (line) press.solid(ink, draw, [sx - a - 2, sy - b - 2, a * 2 + 4, b * 2 + 4]);
  else press.on(ink, draw);
  if (!line) return;
  press.key((g) => {
    g.lineWidth = lw(v, 0.8);
    g.beginPath();
    g.ellipse(sx, sy, a, b, 0, 0, Math.PI * 2);
    g.stroke();
  });
}
