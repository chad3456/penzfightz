import { tone, type Ink, type Press } from './riso';

/**
 * Two-to-one isometric, and the three shades that make a box a box.
 *
 * `sx = (x - z) * U`, `sy = (x + z) * U/2 - y * V`. It is the projection every
 * game from the nineties used, and the reason is that at two-to-one the
 * diagonals land on exact pixel ratios, so a long edge stays crisp instead of
 * crawling.
 *
 * Every solid gets its three visible faces at three different densities — top
 * lightest, left mid, right darkest. That single convention does more to make
 * a stack of quadrilaterals read as furniture than any amount of detail on it,
 * because it is the only cue in the picture that light has a direction.
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
    ox: sheetW / 2 + ((d - w) * unit) / 2,
    oy: sheetH * 0.5 - (across * 0.5 * unit) / 2 + wallH * rise * 0.42,
    unit,
    rise,
  };
}

export interface Vec3 { x: number; y: number; z: number }

export interface View {
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

/** Painter's order: further from the camera draws first. */
export const depth = (x: number, y: number, z: number) => x + z + y * 0.01;

function poly(g: CanvasRenderingContext2D, pts: P2[], density: number) {
  if (pts.length < 3) return;
  g.fillStyle = tone(density);
  g.beginPath();
  g.moveTo(pts[0]![0], pts[0]![1]);
  for (const [x, y] of pts.slice(1)) g.lineTo(x, y);
  g.closePath();
  g.fill();
}

export interface Shades {
  top: number;
  left: number;
  right: number;
}

const LIT: Shades = { top: 0.42, left: 0.66, right: 0.88 };

/**
 * A box, from a corner and a size.
 *
 * Only the three faces that can be seen are drawn. Drawing all six and relying
 * on painter's order is a tempting shortcut that costs twice the fill and puts
 * a seam down every silhouette where the back faces poke out by a pixel.
 */
export function box(
  press: Press, ink: Ink, v: View,
  x: number, y: number, z: number,
  w: number, h: number, d: number,
  shades: Partial<Shades> = {},
) {
  const s = { ...LIT, ...shades };
  press.on(ink, (g) => {
    const P = (px: number, py: number, pz: number) => project(v, px, py, pz);
    // Top
    poly(g, [P(x, y + h, z), P(x + w, y + h, z), P(x + w, y + h, z + d), P(x, y + h, z + d)], s.top);
    // Left face, the one pointing down-left on screen
    poly(g, [P(x, y + h, z + d), P(x + w, y + h, z + d), P(x + w, y, z + d), P(x, y, z + d)], s.left);
    // Right face
    poly(g, [P(x + w, y + h, z), P(x + w, y + h, z + d), P(x + w, y, z + d), P(x + w, y, z)], s.right);
  });
}

/** The shell: a floor slab and the two walls behind it. */
export function room(
  press: Press, v: View,
  w: number, d: number, wallH: number,
  floorInk: Ink, wallInk: Ink,
  floorTone = 0.5, wallTone = 0.62,
) {
  // The two walls have to be plainly different densities or the corner
  // disappears and the whole back of the room reads as one flat backdrop with
  // a floor stuck to the bottom of it. A quarter of a stop between them is not
  // enough once the screen has turned both into dots.
  press.on(floorInk, (g) => {
    const P = (x: number, y: number, z: number) => project(v, x, y, z);
    poly(g, [P(0, 0, 0), P(w, 0, 0), P(w, 0, d), P(0, 0, d)], floorTone);
    // The slab has a thickness, so the room sits on something.
    // A thicker slab than looks right on paper. It is the only thing that says
    // the room is an object sitting in space rather than a pattern printed on it.
    poly(g, [P(0, 0, d), P(w, 0, d), P(w, -0.42, d), P(0, -0.42, d)], floorTone * 1.5);
    poly(g, [P(w, 0, 0), P(w, 0, d), P(w, -0.42, d), P(w, -0.42, 0)], floorTone * 1.85);
  });
  press.on(wallInk, (g) => {
    const P = (x: number, y: number, z: number) => project(v, x, y, z);
    // Back-left wall (runs along +x at z = 0) and back-right (along +z at x = 0).
    poly(g, [P(0, 0, 0), P(w, 0, 0), P(w, wallH, 0), P(0, wallH, 0)], wallTone);
    poly(g, [P(0, 0, 0), P(0, 0, d), P(0, wallH, d), P(0, wallH, 0)], wallTone * 1.75);
    // A skirting line where each wall meets the floor, which is what actually
    // tells the eye the two planes are at an angle to each other.
    poly(g, [P(0, 0, 0), P(w, 0, 0), P(w, 0.09, 0), P(0, 0.09, 0)], wallTone * 2.1);
    poly(g, [P(0, 0, 0), P(0, 0, d), P(0, 0.09, d), P(0, 0.09, 0)], wallTone * 2.4);
  });
}

/** A rug, a pool of light, a patch of grass: flat on the floor. */
export function patch(
  press: Press, ink: Ink, v: View,
  x: number, z: number, w: number, d: number, density: number, y = 0.01,
) {
  press.on(ink, (g) => {
    const P = (px: number, py: number, pz: number) => project(v, px, py, pz);
    poly(g, [P(x, y, z), P(x + w, y, z), P(x + w, y, z + d), P(x, y, z + d)], density);
  });
}

/**
 * Lamplight.
 *
 * A radial coverage gradient, which the screen then turns into dots that thin
 * out with distance all by itself. That is the whole reason to separate
 * coverage from colour: a glow is one `createRadialGradient` and the press
 * makes it look printed.
 */
export function glow(
  press: Press, ink: Ink, v: View,
  x: number, y: number, z: number, radius: number, strength = 0.7,
) {
  const [sx, sy] = project(v, x, y, z);
  const r = radius * v.unit;
  press.on(ink, (g) => {
    const grad = g.createRadialGradient(sx, sy, 0, sx, sy, r);
    grad.addColorStop(0, tone(strength));
    grad.addColorStop(0.45, tone(strength * 0.42));
    grad.addColorStop(1, tone(0));
    g.fillStyle = grad;
    g.save();
    // Squashed to the ground plane, so the pool lies on the floor rather than
    // hanging in the air as a ball.
    g.translate(sx, sy);
    g.scale(1, 0.52);
    g.beginPath();
    g.arc(0, 0, r, 0, Math.PI * 2);
    g.fill();
    g.restore();
  });
}

/** An upright plane facing the camera, for anything thin: a door, a banner. */
export function panel(
  press: Press, ink: Ink, v: View,
  x: number, y: number, z: number, w: number, h: number, density: number,
  along: 'x' | 'z' = 'x',
) {
  press.on(ink, (g) => {
    const P = (px: number, py: number, pz: number) => project(v, px, py, pz);
    const pts: P2[] = along === 'x'
      ? [P(x, y, z), P(x + w, y, z), P(x + w, y + h, z), P(x, y + h, z)]
      : [P(x, y, z), P(x, y, z + w), P(x, y + h, z + w), P(x, y + h, z)];
    poly(g, pts, density);
  });
}
