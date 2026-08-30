import { contour, type Pad, type Pt } from './pad';

/**
 * Hand lettering, as strokes.
 *
 * The reference has ORIGINAL scrawled across a label in wobbling white capitals,
 * and it does a great deal of work: it is the one place a viewer is certain the
 * drawing was made by a hand, because handwriting is the thing we are all
 * experts at reading. A typeface set on the label would sink the whole picture
 * instantly — you would see a *render* with lettering composited on.
 *
 * So the alphabet is written as bare polylines in a unit box and drawn with the
 * same wobbling brush as everything else. It is a single weight, it has no
 * curves that are not polygons, and at label size that is indistinguishable
 * from someone writing quickly with a stylus, which is what it is imitating.
 */

type Glyph = number[][];

const G: Record<string, Glyph> = {
  A: [[0, 1, 0.5, 0, 1, 1], [0.18, 0.62, 0.82, 0.62]],
  B: [[0, 0, 0, 1], [0, 0, 0.7, 0.08, 0.7, 0.42, 0, 0.5], [0, 0.5, 0.8, 0.58, 0.8, 0.92, 0, 1]],
  C: [[0.95, 0.15, 0.5, 0, 0.05, 0.35, 0.05, 0.7, 0.5, 1, 0.95, 0.85]],
  D: [[0, 0, 0, 1], [0, 0, 0.7, 0.15, 0.8, 0.5, 0.7, 0.85, 0, 1]],
  E: [[0.9, 0, 0, 0, 0, 1, 0.9, 1], [0, 0.5, 0.65, 0.5]],
  F: [[0.9, 0, 0, 0, 0, 1], [0, 0.5, 0.6, 0.5]],
  G: [[0.95, 0.15, 0.5, 0, 0.05, 0.35, 0.05, 0.7, 0.5, 1, 0.95, 0.8, 0.95, 0.55, 0.55, 0.55]],
  H: [[0, 0, 0, 1], [1, 0, 1, 1], [0, 0.52, 1, 0.52]],
  I: [[0.5, 0, 0.5, 1]],
  J: [[0.8, 0, 0.8, 0.78, 0.4, 1, 0.05, 0.8]],
  K: [[0, 0, 0, 1], [0.95, 0, 0.05, 0.55], [0.3, 0.4, 1, 1]],
  L: [[0, 0, 0, 1, 0.85, 1]],
  M: [[0, 1, 0.1, 0, 0.5, 0.62, 0.9, 0, 1, 1]],
  N: [[0, 1, 0, 0, 1, 1, 1, 0]],
  O: [[0.5, 0, 0.95, 0.32, 0.95, 0.7, 0.5, 1, 0.05, 0.7, 0.05, 0.32, 0.5, 0]],
  P: [[0, 1, 0, 0, 0.75, 0.12, 0.75, 0.45, 0, 0.55]],
  Q: [[0.5, 0, 0.95, 0.32, 0.95, 0.7, 0.5, 1, 0.05, 0.7, 0.05, 0.32, 0.5, 0],
    [0.6, 0.72, 1, 1.05]],
  R: [[0, 1, 0, 0, 0.75, 0.12, 0.75, 0.45, 0, 0.55], [0.35, 0.55, 1, 1]],
  S: [[0.92, 0.14, 0.45, 0, 0.06, 0.22, 0.5, 0.5, 0.94, 0.7, 0.55, 1, 0.08, 0.85]],
  T: [[0, 0, 1, 0], [0.5, 0, 0.5, 1]],
  U: [[0, 0, 0, 0.72, 0.5, 1, 1, 0.72, 1, 0]],
  V: [[0, 0, 0.5, 1, 1, 0]],
  W: [[0, 0, 0.22, 1, 0.5, 0.35, 0.78, 1, 1, 0]],
  X: [[0, 0, 1, 1], [1, 0, 0, 1]],
  Y: [[0, 0, 0.5, 0.52, 1, 0], [0.5, 0.52, 0.5, 1]],
  Z: [[0, 0, 1, 0, 0, 1, 1, 1]],
  '0': [[0.5, 0, 0.92, 0.3, 0.92, 0.72, 0.5, 1, 0.08, 0.72, 0.08, 0.3, 0.5, 0]],
  '1': [[0.3, 0.18, 0.55, 0, 0.55, 1]],
  '2': [[0.05, 0.2, 0.5, 0, 0.95, 0.25, 0.05, 1, 1, 1]],
  '3': [[0.05, 0.1, 0.55, 0, 0.9, 0.3, 0.45, 0.5], [0.45, 0.5, 0.95, 0.7, 0.5, 1, 0.05, 0.9]],
  '4': [[0.7, 1, 0.7, 0, 0.02, 0.7, 1, 0.7]],
  '5': [[0.95, 0, 0.15, 0, 0.1, 0.45, 0.55, 0.4, 0.95, 0.65, 0.5, 1, 0.05, 0.88]],
  '6': [[0.9, 0.05, 0.4, 0, 0.06, 0.5, 0.1, 0.9, 0.55, 1, 0.9, 0.75, 0.55, 0.5, 0.1, 0.6]],
  '7': [[0, 0, 1, 0, 0.4, 1]],
  '8': [[0.5, 0, 0.9, 0.2, 0.5, 0.48, 0.1, 0.2, 0.5, 0],
    [0.5, 0.48, 0.95, 0.72, 0.5, 1, 0.06, 0.72, 0.5, 0.48]],
  '9': [[0.9, 0.5, 0.45, 0.6, 0.1, 0.35, 0.5, 0, 0.9, 0.3, 0.85, 0.75, 0.4, 1]],
  '-': [[0.1, 0.5, 0.9, 0.5]],
  '.': [[0.45, 0.95, 0.56, 0.95]],
  '!': [[0.5, 0, 0.5, 0.68], [0.5, 0.93, 0.5, 1]],
  '&': [[0.92, 0.14, 0.45, 0, 0.06, 0.22, 0.5, 0.5, 0.94, 0.7, 0.55, 1, 0.08, 0.85]],
};

/** Write it. Returns the width used, so a caller can centre or box it. */
export function word(
  pad: Pad,
  text: string,
  at: Pt,
  size: number,
  colour: string,
  o: { width?: number; alpha?: number; tilt?: number } = {},
) {
  const up = text.toUpperCase();
  // `size` is the cap height in y units. The advance is the same height turned
  // into x units, which is where the card's shape comes in — get this the
  // wrong way round and the lettering is squashed on one axis only, which
  // looks like a rendering fault rather than like handwriting.
  const h = size;
  const wGlyph = size * 0.62 * (pad.h / pad.w);
  const space = wGlyph * 1.42;
  const r = pad.r;
  let x = at[0];
  for (const ch of up) {
    const glyph = G[ch];
    if (glyph) {
      // Every letter sits and leans a little differently. Uniform lettering is
      // a font, and a font is exactly what this must not look like.
      const lean = (r() - 0.5) * 0.16 + (o.tilt ?? 0);
      const dy = (r() - 0.5) * h * 0.1;
      const hh = h * (0.92 + r() * 0.16);
      for (const s of glyph) {
        const pts: Pt[] = [];
        for (let i = 0; i < s.length; i += 2) {
          const gx = s[i] - 0.5;
          const gy = s[i + 1];
          pts.push([x + (gx + lean * (1 - gy)) * wGlyph + wGlyph / 2, at[1] + dy + gy * hh]);
        }
        pad.line(pts, colour, { width: o.width ?? 0.011, alpha: o.alpha, wobble: 0.0035 });
      }
    }
    x += space;
  }
  return x - at[0];
}

/**
 * A signature, or something shaped like one.
 *
 * Nobody reads a script logo, they recognise its *rhythm* — a big initial, a
 * run of humps, a tail that goes back under the word. So this draws the rhythm
 * and does not attempt the letters, which is also what the reference does: look
 * closely at the scrawl on that bottle and there is no second C in it at all.
 */
export function scrawl(pad: Pad, at: Pt, len: number, height: number, colour: string,
  humps: number, o: { width?: number } = {}) {
  const r = pad.r;
  const pts: Pt[] = [];
  const cap = height;
  // The big initial: a loop that starts high and drops into the run.
  pts.push([at[0] + len * 0.06, at[1] - cap * 0.5]);
  pts.push([at[0] - len * 0.01, at[1] - cap * 1.1]);
  pts.push([at[0] + len * 0.08, at[1] - cap * 1.35]);
  pts.push([at[0] + len * 0.14, at[1] - cap * 0.6]);
  pts.push([at[0] + len * 0.1, at[1] + cap * 0.1]);
  for (let i = 0; i < humps; i++) {
    const t = i / humps;
    const x = at[0] + len * (0.16 + t * 0.72);
    const step = len * (0.72 / humps);
    pts.push([x, at[1] + cap * (0.05 + r() * 0.1)]);
    pts.push([x + step * 0.5, at[1] - cap * (0.5 + r() * 0.35)]);
  }
  pts.push([at[0] + len * 0.94, at[1] + cap * 0.05]);
  pad.line(pts, colour, { width: o.width ?? 0.014, wobble: 0.004 });
  // The tail back under the word.
  pad.line(
    [[at[0] + len * 0.94, at[1] + cap * 0.05], [at[0] + len * 1.05, at[1] + cap * 0.55],
      [at[0] + len * 0.4, at[1] + cap * 0.75]],
    colour,
    { width: (o.width ?? 0.014) * 0.8, wobble: 0.004 },
  );
}

/**
 * The palette strip.
 *
 * Six pills in the corner, and the drawing has to be able to survive the claim:
 * every line in it is one of these. It is signage for the constraint, and it
 * only appears on about two thirds of them, because a rule announced on every
 * single picture stops being a rule and becomes a frame.
 */
export function swatches(pad: Pad, inks: string[], at: Pt, size: number) {
  const r = pad.r;
  for (let i = 0; i < inks.length; i++) {
    const y = at[1] + i * size * 1.55;
    const len = size * (2.6 + r() * 1.5);
    pad.pill([at[0] + (r() - 0.5) * size * 0.5, y], len, size * 0.72, inks[i]);
  }
}

export { contour };
