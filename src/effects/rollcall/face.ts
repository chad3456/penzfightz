import type p5 from 'p5';
import { cat, dial, mulberry, type Genome } from './genome';
import {
  LINE, PAPER, WASH, arc, box, pick, ring, stroke, wander, type Ink,
} from './ink';

/**
 * Drawing a face.
 *
 * What makes the reference doodles read as drawn rather than generated is not
 * the features — anyone can put two dots and a line on a circle — it is four
 * things, and this file is mostly about those four.
 *
 * **The head is not a circle.** It is a superellipse: one exponent takes it
 * from a diamond through an ellipse to a rounded square, an aspect ratio makes
 * it tall or wide, a pear term widens the jaw or the crown, and a few slow
 * lumps stop any of it being exact. Seven families sample that space at
 * different settings, which is where the eggs, the diamonds and the tall
 * rectangles come from.
 *
 * **The line wobbles slowly.** Per-point white noise reads as a bad printer.
 * A hand wanders, so the tremor here is smooth noise along the path, and every
 * stroke is drawn twice with a slight offset, which is what gives the doubled,
 * searching quality of a pen going round a shape a second time.
 *
 * **The colour is off the line.** The flat wash is its own blob, its own shape,
 * and it is deliberately printed a few millimetres from where the ink is. That
 * misregistration is doing most of the work; align them and the whole thing
 * turns into clip art.
 *
 * **Nothing is symmetrical.** The two eyes are drawn from separate parameters
 * rather than mirrored, ears may be one or none, and features sit off centre.
 */

type Rnd = () => number;

/** A closed superellipse, sampled to points. This is every head on the page. */
function silhouette(
  n: number,
  aspect: number,
  pear: number,
  lump: number,
  tilt: number,
  seed: number,
  steps = 64,
): [number, number][] {
  const nz = wander(seed);
  const e = 2 / n;
  const pts: [number, number][] = [];
  for (let i = 0; i < steps; i++) {
    const th = (i / steps) * Math.PI * 2;
    const c = Math.cos(th);
    const s = Math.sin(th);
    let x = Math.sign(c) * Math.pow(Math.abs(c), e);
    let y = Math.sign(s) * Math.pow(Math.abs(s), e) * aspect;
    // Pear: widen towards the chin (or the crown, when pear is negative).
    x *= 1 + pear * (y / Math.max(0.001, aspect)) * 0.5;
    const k = 1 + nz(i * 0.19) * lump;
    x *= k;
    y *= k;
    const ct = Math.cos(tilt);
    const st = Math.sin(tilt);
    pts.push([x * ct - y * st, x * st + y * ct]);
  }
  return pts;
}

// ------------------------------------------------------------------ palettes

/**
 * Skin, in two registers.
 *
 * TONES is a real range, from very fair to very deep, spaced roughly evenly
 * rather than crowded at the light end — which is the failure mode of most
 * generators and the reason the first version of this only reached medium
 * brown. WASH is the illustrative option: the greens and pinks and greys that
 * make a page read as printed rather than as a set of portraits.
 *
 * A face draws from one or the other, never a blend, because mixing them gives
 * you neither.
 */
export const TONES = [
  '#f6ddcf', '#f0cfc2', '#ecc4a8', '#e0b48f', '#d3a179',
  '#c08b62', '#ab754e', '#96613f', '#7d4e32', '#653d27',
  '#4f2f1e', '#3b2317',
];

/**
 * Hair, dark to fair and then grey to white.
 *
 * The first version ran black through brown straight to grey with no fair hair
 * anywhere in it, which made every blonde head come out the colour of a filing
 * cabinet. Order matters: the dial reads as a position along this ramp.
 */
export const HAIR_INK = [
  '#0f0f0f', '#1a1410', '#241a12', '#3a2a1c', '#4a3527', '#5a4632',
  '#7d6a52', '#a8834a', '#c9a45f', '#ddc68a', '#9a9a9a', '#cfcabc',
];
/** Dyed. Reached only when a set turns the `hairLoud` dial up. */
const HAIR_LOUD = ['#c2392b', '#1f6fb2', '#2f8f5b', '#b8358f', '#d98a1f', '#7a3fc2', '#d8d2c4'];
const CLOTH = ['#3a4657', '#5a4335', '#2f5148', '#6b2f38', '#43406b', '#7a6a4a', '#2b2b2b'];
/**
 * Fins, crests and gill plates. Deliberately cold and slightly desaturated
 * against the hair ramp, which runs warm all the way from black to blonde — a
 * dorsal fin in any of those browns reads as a hairstyle rather than a fish.
 */
const SCALE = ['#3f7f74', '#2f6f8a', '#5a8f6a', '#6f7f4a', '#4a5f8a', '#7a6a8a', '#8a7a4a'];

/** Natural, unless the set has turned the dye up. */
/** The cold-blooded counterpart to `hairColour`. */
const scaleColour = (gn: Genome): string => pick(SCALE, dial(gn, 'washSeed'));

const hairColour = (gn: Genome): string =>
  dial(gn, 'hairLoud') > 0.6
    ? pick(HAIR_LOUD, dial(gn, 'hairInk'))
    : pick(HAIR_INK, dial(gn, 'hairInk'));

// --------------------------------------------------------------------- parts

interface Ctx {
  p: p5;
  r: Rnd;
  ink: Ink;
  /** Half-width and half-height of the head in local units. */
  hw: number;
  hh: number;
  /** Horizontal shift of the whole face, for a three-quarter view. */
  turn: number;
  /** The silhouette, so hair and beards can follow the actual outline. */
  jaw: [number, number][];
}

function eyes(c: Ctx, gn: Genome) {
  const { p, ink } = c;
  const style = cat(gn, 'eye');
  const size = 0.07 + dial(gn, 'eyeSize') * 0.11;
  const skew = (dial(gn, 'eyeSkew') - 0.5) * 0.9;
  const gap = 0.26 + dial(gn, 'eyeGap') * 0.26;
  const y = -0.1 + (dial(gn, 'eyeHeight') - 0.5) * 0.3;
  const pupil = dial(gn, 'pupil');

  const one = (x: number, s: number) => {
    p.stroke(LINE);
    switch (style) {
      case 0: // a plain dot
        p.fill(LINE);
        p.circle(x, y, s * 0.85);
        break;
      case 1: // ring with a pupil
        p.noFill();
        stroke(c.p, ring(x, y, s), ink, { close: true });
        p.fill(LINE);
        p.noStroke();
        p.circle(x + (pupil - 0.5) * s * 0.4, y, s * 0.42);
        p.stroke(LINE);
        break;
      case 2: // tall oval
        stroke(c.p, ring(x, y, s, 0.6), ink, { close: true });
        p.fill(LINE);
        p.noStroke();
        p.circle(x, y + (pupil - 0.5) * s * 0.3, s * 0.34);
        p.stroke(LINE);
        break;
      case 3: // a box, as in the second sheet
        stroke(c.p, box(x, y, s * 1.05, s * 0.9), ink, { close: true });
        p.fill(LINE);
        p.noStroke();
        p.circle(x, y, s * 0.3);
        p.stroke(LINE);
        break;
      case 4: // closed, a contented arc
        stroke(c.p, arc(x, y, s * 0.75, Math.PI, Math.PI * 2), ink);
        break;
      case 5: // heavy lid over a dot
        stroke(c.p, arc(x, y + s * 0.1, s * 0.8, Math.PI * 1.05, Math.PI * 1.95), ink);
        p.fill(LINE);
        p.noStroke();
        p.circle(x, y + s * 0.05, s * 0.3);
        p.stroke(LINE);
        break;
      default: // wide-awake ring, no pupil
        stroke(c.p, ring(x, y, s * 1.1), ink, { close: true });
        break;
    }
  };

  p.noFill();
  one(-gap + c.turn, size * (1 + skew * 0.45));
  one(gap + c.turn, size * (1 - skew * 0.45));
  return { gap, y, size };
}

function brows(c: Ctx, gn: Genome, e: { gap: number; y: number; size: number }) {
  const kind = cat(gn, 'brow');
  if (kind === 0) return;
  const lift = 0.1 + dial(gn, 'browLift') * 0.12;
  const w = e.size * 1.5;
  const one = (x: number, dir: number) => {
    const y0 = e.y - lift;
    let pts: [number, number][];
    if (kind === 1) pts = [[x - w, y0], [x + w, y0]];
    else if (kind === 2) pts = [[x - w, y0 + w * 0.5 * dir], [x + w, y0 - w * 0.5 * dir]];
    else if (kind === 3) pts = arc(x, y0 + w * 0.5, w * 2, Math.PI, Math.PI * 2);
    else pts = [[x - w, y0], [x, y0 - w * 0.45], [x + w, y0]];
    stroke(c.p, pts, c.ink, { weightScale: 1.15 });
  };
  c.p.noFill();
  one(-e.gap + c.turn, 1);
  one(e.gap + c.turn, -1);
}

function nose(c: Ctx, gn: Genome, eyeY: number) {
  const kind = cat(gn, 'nose');
  if (kind === 0) return;
  const s = 0.08 + dial(gn, 'noseSize') * 0.16;
  const x = c.turn * 1.4;
  const top = eyeY + 0.04;
  const p = c.p;
  p.noFill();
  switch (kind) {
    case 1: // the L
      stroke(p, [[x, top], [x, top + s], [x + s * 0.6, top + s]], c.ink);
      break;
    case 2: // a hook
      stroke(p, [[x + s * 0.2, top], [x - s * 0.2, top + s * 0.9], [x + s * 0.5, top + s]], c.ink);
      break;
    case 3: // two nostrils
      p.fill(LINE);
      p.noStroke();
      p.circle(x - s * 0.3, top + s, s * 0.22);
      p.circle(x + s * 0.3, top + s, s * 0.22);
      p.stroke(LINE);
      break;
    case 4: // a wedge
      stroke(p, [[x, top], [x - s * 0.5, top + s], [x + s * 0.5, top + s]], c.ink, { close: true });
      break;
    default: // a long profile line, for a head that has turned
      stroke(p, [[x, top - s * 0.2], [x + s * 0.9, top + s * 0.7], [x + s * 0.2, top + s]], c.ink);
  }
}

function mouth(c: Ctx, gn: Genome) {
  const kind = cat(gn, 'mouth');
  const w = (0.12 + dial(gn, 'mouthWidth') * 0.24) * c.hw;
  const curve = (dial(gn, 'mouthCurve') - 0.5) * 2;
  const y = 0.3 * c.hh;
  const x = c.turn * 1.2;
  const p = c.p;
  p.noFill();
  switch (kind) {
    case 0:
      stroke(p, [[x - w, y], [x + w, y]], c.ink);
      break;
    case 1:
      stroke(p, arc(x, y - w * curve * 0.5, w * 2, curve > 0 ? Math.PI : 0, curve > 0 ? Math.PI * 2 : Math.PI), c.ink);
      break;
    case 2: // small open oval
      stroke(p, ring(x, y, w * 0.8, 1.3), c.ink, { close: true });
      break;
    case 3: // a grin with a line across
      stroke(p, arc(x, y - w * 0.4, w * 2, 0, Math.PI), c.ink);
      stroke(p, [[x - w, y], [x + w, y]], c.ink, { passes: 1 });
      break;
    case 4: // pursed, a tiny bar
      stroke(p, [[x - w * 0.35, y], [x + w * 0.35, y]], c.ink, { weightScale: 1.4 });
      break;
    case 5: { // zigzag
      const pts: [number, number][] = [];
      for (let i = 0; i <= 6; i++) pts.push([x - w + (2 * w * i) / 6, y + (i % 2 ? w * 0.22 : -w * 0.22)]);
      stroke(p, pts, c.ink);
      break;
    }
    case 6: // filled, a dark little mouth
      p.fill(LINE);
      p.noStroke();
      p.ellipse(x, y, w * 1.1, w * 0.7);
      p.stroke(LINE);
      break;
    default: // off to one side
      stroke(p, [[x - w * 0.2, y], [x + w, y - w * 0.25]], c.ink);
  }
}

function ears(c: Ctx, gn: Genome) {
  const raw = cat(gn, 'ears');
  // `kingdom` is the single switch for whether a face is a creature. Reading
  // the ear family on its own put cat ears on the committee, the staffroom and
  // everyone else, because widening that family to eight left the human sets
  // sampling the animal half.
  if (cat(gn, 'kingdom') === 1 && raw >= 4) return animalEars(c, gn, raw - 4);
  const which = raw % 4;
  if (which === 3) return;
  const s = (0.08 + dial(gn, 'earSize') * 0.1) * c.hh;
  const y = 0;
  const draw = (side: number) => {
    const x = side * c.hw * 0.97;
    stroke(
      c.p,
      arc(x, y, s * 2, -Math.PI / 2 + (side < 0 ? Math.PI : 0), Math.PI / 2 + (side < 0 ? Math.PI : 0)),
      c.ink,
    );
  };
  c.p.noFill();
  // A head that has turned only shows the ear on the far side.
  if (c.turn !== 0) draw(c.turn > 0 ? -1 : 1);
  else if (which === 0) {
    draw(-1);
    draw(1);
  } else draw(which === 1 ? -1 : 1);
}

/**
 * Hair.
 *
 * Seven families, because hair is the thing the eye reads first and a
 * generator that only knows "some" and "none" produces a page of siblings.
 */
function hair(c: Ctx, gn: Genome, crown: [number, number][]) {
  const kind = cat(gn, 'hair');
  const amount = dial(gn, 'hairAmount');
  const p = c.p;
  const ink = pick(HAIR_INK, dial(gn, 'hairInk'));
  // The crown, as a *contiguous run* of the outline rather than a filtered set.
  //
  // Filtering by height and then sorting by x looks equivalent and is not: on a
  // tall or square head the band above the eyeline includes points from both
  // sides, and sorting interleaves left and right into a zigzag. Filling that
  // gives a black polygon over the whole face, which is exactly what the first
  // render did to about four faces in a hundred. Taking the longest run in
  // outline order keeps the winding intact.
  const top = longestRun(crown, ([, y]) => y < -c.hh * 0.25);
  if (top.length < 3) return;

  if (kind === 0) {
    // Bald, but rarely truly bare: a scatter of stubble on the crown.
    if (amount > 0.45) {
      p.noStroke();
      p.fill(ink);
      const r = c.r;
      for (let i = 0; i < 26 * amount; i++) {
        const t = top[Math.floor(r() * top.length)];
        p.circle(t[0] * 0.9 + (r() - 0.5) * 0.1, t[1] * 0.9 + (r() - 0.5) * 0.1, 0.012);
      }
      p.stroke(LINE);
    }
    return;
  }

  if (kind === 1) {
    // Tufts: single lines standing straight up off the crown.
    p.stroke(ink);
    p.noFill();
    const n = Math.round(4 + amount * 9);
    for (let i = 0; i < n; i++) {
      const t = top[Math.floor(((i + 0.5) / n) * top.length)];
      const len = (0.1 + c.r() * 0.22) * (0.6 + amount);
      const lean = (c.r() - 0.5) * 0.5;
      stroke(p, [[t[0], t[1]], [t[0] + lean * len, t[1] - len]], c.ink, { passes: 1 });
    }
    p.stroke(LINE);
    return;
  }

  if (kind === 2) {
    // A solid cap with a ragged lower edge.
    p.fill(ink);
    p.noStroke();
    p.beginShape();
    for (const [x, y] of top) p.vertex(x * 1.03, y * 1.03);
    // Clamped: past about half the skull a cap stops being hair and the face
    // disappears under it.
    const depth = 0.08 + amount * 0.26;
    for (let i = top.length - 1; i >= 0; i--) {
      const [x, y] = top[i];
      p.vertex(x * 0.98, y * 0.98 + depth * c.hh * (0.6 + 0.4 * Math.sin(i * 1.7)));
    }
    p.endShape('close');
    p.stroke(LINE);
    return;
  }

  if (kind === 3) {
    // Hatching: the flat cap of parallel strokes from the second sheet.
    p.stroke(ink);
    p.noFill();
    const y0 = -c.hh * (0.62 + amount * 0.3);
    const y1 = y0 + c.hh * (0.16 + amount * 0.3);
    const xr = c.hw * 0.92;
    stroke(p, [[-xr, y0], [xr, y0], [xr, y1], [-xr, y1]], c.ink, { close: true, passes: 1 });
    const n = Math.round(10 + amount * 18);
    for (let i = 1; i < n; i++) {
      const x = -xr + ((2 * xr) * i) / n;
      stroke(p, [[x, y0 + 0.006], [x + 0.02, y1 - 0.006]], c.ink, { passes: 1, weightScale: 0.5 });
    }
    p.stroke(LINE);
    return;
  }

  if (kind === 4) {
    // Curls: little loops along the crown.
    p.stroke(ink);
    p.noFill();
    const n = Math.round(5 + amount * 8);
    for (let i = 0; i < n; i++) {
      const t = top[Math.floor(((i + 0.5) / n) * top.length)];
      const s = 0.05 + c.r() * 0.05;
      stroke(p, ring(t[0], t[1] - s * 0.4, s * 2), c.ink, { close: true, passes: 1 });
    }
    p.stroke(LINE);
    return;
  }

  if (kind === 5) {
    // A fringe: a bar across the brow with a straight bottom edge.
    p.fill(ink);
    p.noStroke();
    p.beginShape();
    for (const [x, y] of top) p.vertex(x * 1.02, y * 1.02);
    // Never below the brow: a fringe that reaches the eyes reads as a face
    // sunk in ink rather than a haircut.
    const cut = -c.hh * (0.5 - amount * 0.26);
    for (let i = top.length - 1; i >= 0; i--) p.vertex(top[i][0] * 0.99, cut);
    p.endShape('close');
    p.stroke(LINE);
    return;
  }
  if (kind === 7) {
    // Tight coils: the crown packed with small overlapping rings, dense enough
    // that the shape reads before any single ring does.
    p.fill(ink);
    p.noStroke();
    const n = Math.round(26 + amount * 40);
    for (let i = 0; i < n; i++) {
      const t = top[Math.floor((i / n) * top.length)];
      const out = 1 + c.r() * (0.06 + amount * 0.16);
      p.circle(t[0] * out, t[1] * out - c.hh * 0.02, 0.055 + c.r() * 0.045);
    }
    p.stroke(LINE);
    return;
  }

  if (kind === 8) {
    // Locs: strands leaving the crown and hanging past the jaw.
    p.stroke(ink);
    p.noFill();
    const n = Math.round(7 + amount * 9);
    for (let i = 0; i < n; i++) {
      const t = top[Math.floor(((i + 0.5) / n) * top.length)];
      const drop = c.hh * (0.5 + c.r() * 1.0);
      const sway = (c.r() - 0.5) * 0.16;
      stroke(
        p,
        [
          [t[0], t[1]],
          [t[0] * 1.08 + sway, t[1] + drop * 0.5],
          [t[0] * 1.12 + sway * 2, t[1] + drop],
        ],
        c.ink,
        { passes: 1, weightScale: 2.4 },
      );
    }
    p.stroke(LINE);
    return;
  }

  if (kind === 9) {
    // Gathered up, with a knot above the crown.
    p.fill(ink);
    p.noStroke();
    p.beginShape();
    for (const [x, y] of top) p.vertex(x * 1.02, y * 1.02);
    for (let i = top.length - 1; i >= 0; i--) p.vertex(top[i][0] * 0.96, top[i][1] * 0.96 + c.hh * 0.16);
    p.endShape('close');
    const knot = 0.11 + amount * 0.1;
    p.circle(c.turn * 0.5, -c.hh * (1.02 + knot * 0.5), knot * 2);
    p.stroke(LINE);
    p.noFill();
    stroke(p, ring(c.turn * 0.5, -c.hh * (1.02 + knot * 0.5), knot * 2), c.ink, {
      close: true,
      passes: 1,
    });
    return;
  }

  if (kind === 10) {
    // Long: down both sides and past the jaw, closing across the *hairline*
    // rather than across the middle of the face. Closing it low is what made
    // the first version a curtain hanging to the eyebrows.
    p.fill(ink);
    p.noStroke();
    const fall = c.hh * (0.4 + amount * 0.55);
    const hairline = -c.hh * (0.34 + amount * 0.16);
    const outer = c.hw * 1.04;
    const innerX = c.hw * 0.68;
    const bottom = c.hh * 0.25 + fall;
    p.beginShape();
    for (const [x, y] of top) p.vertex(x * 1.05, y * 1.05);
    p.vertex(outer, c.hh * 0.1);
    p.vertex(outer * 0.95, bottom);
    p.vertex(innerX * 0.92, bottom);
    p.vertex(innerX, hairline);
    p.vertex(-innerX, hairline);
    p.vertex(-innerX * 0.92, bottom);
    p.vertex(-outer * 0.95, bottom);
    p.vertex(-outer, c.hh * 0.1);
    p.endShape('close');
    p.stroke(LINE);
    p.noFill();
    return;
  }

  // Scribble: a fast scrawl over the crown, the way you draw hair in a hurry.
  p.stroke(ink);
  p.noFill();
  const pts: [number, number][] = [];
  const n = Math.round(18 + amount * 26);
  for (let i = 0; i < n; i++) {
    const t = top[Math.floor((i / n) * top.length)];
    const up = (i % 2 ? 1 : 0.45) * (0.1 + amount * 0.22);
    pts.push([t[0] * (0.95 + c.r() * 0.15), t[1] - up]);
  }
  stroke(p, pts, c.ink, { passes: 1 });
  p.stroke(LINE);
}

/** The longest cyclic run of points satisfying a test, in outline order. */
function longestRun(
  pts: [number, number][],
  ok: (p: [number, number]) => boolean,
): [number, number][] {
  const n = pts.length;
  let best: [number, number][] = [];
  let cur: [number, number][] = [];
  // Go round twice so a run that straddles the wrap point is not cut in half.
  for (let i = 0; i < n * 2; i++) {
    const p = pts[i % n];
    if (ok(p)) {
      cur.push(p);
      if (cur.length > best.length && cur.length <= n) best = cur.slice();
    } else cur = [];
  }
  return best;
}

function beard(c: Ctx, gn: Genome, chin: number) {
  const kind = cat(gn, 'beard');
  if (kind === 0) return;
  const amount = dial(gn, 'beardAmount');
  const p = c.p;
  const ink = hairColour(gn);
  const y = 0.3 * c.hh;
  const w = c.hw * 0.5;

  if (kind === 1) {
    // Moustache: a solid bar under the nose.
    p.fill(ink);
    p.noStroke();
    p.ellipse(c.turn * 1.2, y - c.hh * 0.14, w * (0.8 + amount * 0.6), 0.045 + amount * 0.03);
    p.stroke(LINE);
    return;
  }
  if (kind === 2) {
    // Curled moustache, drawn as two hooks.
    p.stroke(ink);
    p.noFill();
    const x = c.turn * 1.2;
    const yy = y - c.hh * 0.14;
    stroke(p, [[x, yy], [x - w * 0.7, yy], [x - w * 0.85, yy - 0.05]], c.ink, { passes: 1 });
    stroke(p, [[x, yy], [x + w * 0.7, yy], [x + w * 0.85, yy - 0.05]], c.ink, { passes: 1 });
    p.stroke(LINE);
    return;
  }
  if (kind === 3) {
    // Goatee: a narrow strip under the lip down to the chin, with a moustache
    // over it. A wedge from the mouth to the jaw is not a goatee, it is a bib.
    p.fill(ink);
    p.noStroke();
    const top0 = y + c.hh * 0.06;
    const bot = chin * (0.6 + amount * 0.22);
    p.beginShape();
    p.vertex(-w * 0.26, top0);
    p.vertex(w * 0.26, top0);
    p.vertex(w * 0.3, bot * 0.78);
    p.vertex(0, bot);
    p.vertex(-w * 0.3, bot * 0.78);
    p.endShape('close');
    p.ellipse(c.turn * 1.2, y - c.hh * 0.13, w * 0.95, 0.04 + amount * 0.02);
    p.stroke(LINE);
    return;
  }

  if (kind === 4) {
    // A full beard: the lower face, filled, closed along a line that rises at
    // the sides the way a beard actually meets the ears. Closing it straight
    // across gives a face dipped in ink to the chin.
    const run = longestRun(c.jaw, ([, v]) => v > y - 0.05);
    if (run.length < 3) return;
    p.fill(ink);
    p.noStroke();
    p.beginShape();
    for (const [x, yy] of run) p.vertex(x, yy);
    const a = run[run.length - 1];
    const b = run[0];
    const rise = c.hh * (0.16 + amount * 0.2);
    const steps = 10;
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const x = a[0] + (b[0] - a[0]) * t;
      const yy = a[1] + (b[1] - a[1]) * t;
      // Dip in the middle, lift at the corners: a jawline, not a waterline.
      p.vertex(x, yy - rise * Math.sin(Math.PI * t) * -1 - rise * (1 - Math.sin(Math.PI * t)));
    }
    p.endShape('close');
    p.stroke(LINE);
    return;
  }
  // Stubble.
  p.noStroke();
  p.fill(ink);
  for (let i = 0; i < 60 * (0.4 + amount); i++) {
    const t = c.jaw[Math.floor(c.r() * c.jaw.length)];
    if (t[1] < y - 0.02) continue;
    p.circle(t[0] * 0.88, t[1] * 0.88, 0.01);
  }
  p.stroke(LINE);
}

function extras(c: Ctx, gn: Genome) {
  const kind = cat(gn, 'extra');
  const p = c.p;
  p.noFill();
  const y = 0.3 * c.hh;
  switch (kind) {
    case 1: { // a cigarette at the corner of the mouth
      const x = c.hw * 0.32;
      p.stroke(LINE);
      stroke(p, [[x, y], [x + 0.22, y + 0.07]], c.ink, { weightScale: 1.2 });
      p.fill('#c9c2b0');
      p.noStroke();
      p.circle(x + 0.23, y + 0.075, 0.035);
      p.stroke(LINE);
      break;
    }
    case 2: { // a plaster over one brow
      p.fill('#efe4cf');
      p.stroke(LINE);
      p.push();
      p.translate(c.hw * 0.42, -c.hh * 0.42);
      p.rotate(0.4);
      p.rect(-0.09, -0.045, 0.18, 0.09);
      p.pop();
      break;
    }
    case 3: { // an earring
      p.noFill();
      p.stroke(LINE);
      p.circle(-c.hw * 1.02, c.hh * 0.14, 0.05);
      break;
    }
    case 4: { // a single sweat bead
      p.fill('#cdd5df');
      p.noStroke();
      p.circle(c.hw * 0.62, -c.hh * 0.3, 0.05);
      p.stroke(LINE);
      break;
    }
    case 5: { // a nose stud
      p.fill(LINE);
      p.noStroke();
      p.circle(c.turn * 1.4 - 0.055, y - c.hh * 0.16, 0.026);
      p.stroke(LINE);
      break;
    }
    case 6: { // a mole
      p.fill(LINE);
      p.noStroke();
      p.circle(c.hw * 0.42, y - c.hh * 0.06, 0.028);
      p.stroke(LINE);
      break;
    }
    case 7: { // a bindi
      p.fill('#8a2b2b');
      p.noStroke();
      p.circle(c.turn * 1.2, -c.hh * 0.5, 0.055);
      p.stroke(LINE);
      break;
    }
    case 8: { // an old scar through one brow
      p.stroke(LINE);
      stroke(p, [[c.hw * 0.34, -c.hh * 0.52], [c.hw * 0.46, -c.hh * 0.28]], c.ink, { passes: 1 });
      break;
    }
    default:
      break;
  }
}

function spectacles(c: Ctx, gn: Genome, e: { gap: number; y: number; size: number }) {
  const kind = cat(gn, 'specs');
  if (kind === 0) return;
  const s = e.size * (1.9 + dial(gn, 'specSize') * 1.2);
  const p = c.p;
  p.noFill();
  p.stroke(LINE);
  const lens = (x: number) => {
    if (kind === 1) stroke(p, ring(x, e.y, s), c.ink, { close: true });
    else if (kind === 2) stroke(p, box(x, e.y, s, s * 0.85), c.ink, { close: true });
    else if (kind === 3) stroke(p, arc(x, e.y, s, 0, Math.PI), c.ink); // half-moon
    else if (kind === 4) stroke(p, ring(x, e.y, s, 0.72), c.ink, { close: true });
  };
  if (kind === 5) {
    // A monocle: one lens and a cord.
    const x = e.gap + c.turn;
    stroke(p, ring(x, e.y, s), c.ink, { close: true });
    stroke(p, [[x + s * 0.4, e.y + s * 0.4], [x + s * 0.6, e.y + s * 1.5]], c.ink, { passes: 1 });
    return;
  }
  lens(-e.gap + c.turn);
  lens(e.gap + c.turn);
  stroke(p, [[-e.gap + c.turn + s / 2, e.y], [e.gap + c.turn - s / 2, e.y]], c.ink, { passes: 1 });
  // A stub of a temple arm. Running it all the way to the ear draws a bar
  // straight across the face, which is what the first render did.
  const stub = s * 0.5;
  stroke(p, [[-e.gap + c.turn - s / 2, e.y], [-e.gap + c.turn - s / 2 - stub, e.y - 0.012]], c.ink, {
    passes: 1,
  });
  stroke(p, [[e.gap + c.turn + s / 2, e.y], [e.gap + c.turn + s / 2 + stub, e.y - 0.012]], c.ink, {
    passes: 1,
  });
}

// ------------------------------------------------------------------ assembly

/** The seven silhouette families, as settings of the superellipse. */
const HEADS: { n: number; aspect: number; pear: number }[] = [
  { n: 2.0, aspect: 1.18, pear: 0.0 },   // egg
  { n: 2.0, aspect: 1.05, pear: 0.34 },  // pear, heavy jaw
  { n: 2.0, aspect: 1.12, pear: -0.32 }, // inverted, heavy crown
  { n: 1.35, aspect: 1.1, pear: 0.05 },  // diamond
  { n: 3.6, aspect: 1.0, pear: 0.0 },    // rounded square
  { n: 3.0, aspect: 1.45, pear: 0.1 },   // tall brick
  { n: 2.2, aspect: 0.82, pear: 0.12 },  // wide
];

export interface FaceStyle {
  /** Draw the flat colour wash under the ink. */
  colour?: boolean;
}

/**
 * Draw one face, centred on the origin, about `size` across.
 *
 * The order matters: wash first so the ink sits on top of it, then the
 * silhouette, then hair over the skull, then the features, then the beard over
 * the jaw. Drawing hair before the outline gives you a wig sitting on a head;
 * drawing it after gives you hair.
 */
export function drawFace(p: p5, gn: Genome, size: number, style: FaceStyle = {}) {
  const r = mulberry(Math.floor(gn.g[0] * 1e9) ^ Math.floor(gn.g[5] * 1e6) ^ 0x5f3a);
  const seed = Math.floor(gn.g[3] * 1e9) >>> 0;

  const fam = HEADS[cat(gn, 'head')];
  const aspect = fam.aspect * (0.86 + dial(gn, 'headHeight') * 0.3);
  const width = 0.86 + dial(gn, 'headWidth') * 0.3;
  const lump = 0.015 + dial(gn, 'headLump') * 0.075;
  const tilt = (dial(gn, 'headTilt') - 0.5) * 0.34;

  const view = cat(gn, 'view'); // 0 front, 1 turned left, 2 turned right
  const turn = view === 0 ? 0 : (view === 1 ? -1 : 1) * (0.06 + dial(gn, 'headTilt') * 0.08);

  const outline = silhouette(fam.n, aspect, fam.pear, lump, tilt, seed).map(
    ([x, y]) => [x * width, y] as [number, number],
  );

  const hw = Math.max(...outline.map(([x]) => Math.abs(x)));
  const hh = Math.max(...outline.map(([, y]) => Math.abs(y)));
  const ink: Ink = {
    tremor: 0.004 + dial(gn, 'tremor') * 0.014,
    weight: (0.9 + dial(gn, 'weight') * 1.9) / 100,
    seed,
  };

  p.push();
  p.scale(size / 2.35);

  // --- the wash: its own shape, printed a little off the ink
  // A third of the class gets no wash at all. The second reference sheet is
  // almost entirely bare line, and a page where every face is tinted loses
  // that contrast.
  const washed = cat(gn, 'paper') !== 0;
  if (style.colour !== false && washed) {
    // paper 1..2 is a real skin tone, 3 is an illustrative wash.
    const skin =
      cat(gn, 'paper') === 3 ? pick(WASH, dial(gn, 'skin')) : pick(TONES, dial(gn, 'skin'));
    const wash = silhouette(
      fam.n * (0.8 + dial(gn, 'washScale') * 0.5),
      aspect * (0.92 + dial(gn, 'washSeed') * 0.2),
      fam.pear * 0.7,
      lump * 1.6,
      tilt * 0.5,
      seed ^ 0x2c1b,
      40,
    );
    p.noStroke();
    p.fill(skin);
    p.beginShape();
    const ox = (dial(gn, 'washOffX') - 0.5) * 0.22;
    const oy = (dial(gn, 'washOffY') - 0.5) * 0.22;
    for (const [x, y] of wash) p.vertex(x * width * 0.97 + ox, y * 0.97 + oy);
    p.endShape('close');
  }

  const c: Ctx = { p, r, ink, hw, hh, turn, jaw: outline };
  const beast = cat(gn, 'kingdom') === 1;

  // --- fins and crests, under the outline so their bases are hidden by it
  if (beast) fins(c, gn, outline);

  // --- the head itself
  p.stroke(LINE);
  p.noFill();
  stroke(p, outline, ink, { close: true });

  hair(c, gn, outline);
  headwear(c, gn, outline);
  const e = eyes(c, gn);
  brows(c, gn, e);
  // A creature gets a snout instead of a nose, and the mouth lands on it.
  const snout = beast ? muzzle(c, gn) : null;
  if (!snout) nose(c, gn, e.y);
  // A crocodile's tooth line, a fish's pursed ring and a shark's gape are all
  // already mouths. Drawing the generic one over them put a human smile inside
  // the jaw, which is the sort of thing you only see once.
  if (!snout?.ownMouth) mouth(c, gn);
  if (beast) whiskers(c, gn, snout);
  if (!beast) beard(c, gn, hh);
  spectacles(c, gn, e);
  ears(c, gn);
  extras(c, gn);

  // --- freckles
  const fr = dial(gn, 'freckles');
  if (fr > 0.72) {
    p.noStroke();
    p.fill(LINE);
    for (let i = 0; i < 40 * (fr - 0.72) * 3.5; i++) {
      const a = r() * Math.PI * 2;
      const rad = Math.sqrt(r()) * 0.8;
      p.circle(Math.cos(a) * rad * hw, Math.sin(a) * rad * hh * 0.75, 0.009);
    }
    p.stroke(LINE);
  }

  neckwear(c, gn);

  // --- neck: two short lines that do not quite meet the chin
  if (dial(gn, 'neckLen') > 0.42) {
    p.noFill();
    p.stroke(LINE);
    const y0 = hh * 0.94;
    const w = hw * (0.13 + dial(gn, 'neckLen') * 0.12);
    stroke(p, [[-w, y0], [-w * 0.95, y0 + hh * 0.22]], ink, { passes: 1 });
    stroke(p, [[w, y0], [w * 0.95, y0 + hh * 0.22]], ink, { passes: 1 });
  }

  p.pop();
}

export { PAPER, type Ink };

/**
 * Worn on the head.
 *
 * Drawn after the hair and before the features, because a cap sits over a
 * fringe and under a pair of spectacles, and getting that order wrong is the
 * difference between a hat and a sticker.
 */
function headwear(c: Ctx, gn: Genome, crown: [number, number][]) {
  const kind = cat(gn, 'wear');
  if (kind === 0) return;
  const p = c.p;
  const cloth = pick(CLOTH, dial(gn, 'washSeed'));
  const top = longestRun(crown, ([, y]) => y < -c.hh * 0.3);
  if (top.length < 3) return;
  const brimY = -c.hh * 0.34;

  const dome = (lift: number, colour: string) => {
    p.fill(colour);
    p.noStroke();
    p.beginShape();
    for (const [x, y] of top) p.vertex(x * 1.04, y * 1.04 - lift);
    for (let i = top.length - 1; i >= 0; i--) p.vertex(top[i][0] * 1.0, brimY);
    p.endShape('close');
    p.stroke(LINE);
    p.noFill();
    stroke(p, [...top.map(([x, y]) => [x * 1.04, y * 1.04 - lift] as [number, number])], c.ink, {
      passes: 1,
    });
  };

  switch (kind) {
    case 1: // cap, peak forward
    case 7: { // visor: the peak without the dome
      if (kind === 1) dome(0.02, cloth);
      p.fill(cloth);
      p.noStroke();
      // A visor has no dome, so without a strap the peak reads as a plank
      // driven through the forehead.
      if (kind === 7) p.rect(-c.hw * 0.98, brimY - c.hh * 0.01, c.hw * 1.96, c.hh * 0.075, 0.02);
      const dir = c.turn >= 0 ? 1 : -1;
      // A curved peak reaching a little past the brow. The first version ran a
      // straight spar out to 1.45x the head width, which read as a plank.
      p.beginShape();
      for (let i = 0; i <= 10; i++) {
        const t = i / 10;
        const x = (-0.5 + 1.62 * t) * c.hw * dir;
        p.vertex(x, brimY - c.hh * 0.02 + Math.sin(Math.PI * t) * c.hh * 0.05);
      }
      for (let i = 10; i >= 0; i--) {
        const t = i / 10;
        const x = (-0.5 + 1.62 * t) * c.hw * dir;
        p.vertex(x, brimY + c.hh * 0.11 - t * c.hh * 0.035);
      }
      p.endShape('close');
      p.stroke(LINE);
      break;
    }
    case 2: { // cap, peak back
      dome(0.02, cloth);
      p.fill(cloth);
      p.noStroke();
      p.beginShape();
      p.vertex(c.hw * 0.6, brimY);
      p.vertex(-c.hw * 1.32, brimY + c.hh * 0.02);
      p.vertex(-c.hw * 1.24, brimY + c.hh * 0.12);
      p.vertex(c.hw * 0.6, brimY + c.hh * 0.08);
      p.endShape('close');
      p.stroke(LINE);
      break;
    }
    case 3: { // headphones: a band over, a cup at each ear
      p.noFill();
      p.stroke(LINE);
      const band = top.map(([x, y]) => [x * 1.13, y * 1.13] as [number, number]);
      stroke(p, band, c.ink, { weightScale: 1.5, passes: 1 });
      p.fill(cloth);
      p.noStroke();
      for (const side of [-1, 1]) {
        p.push();
        p.translate(side * c.hw * 1.06, c.hh * 0.02);
        p.rect(-0.075, -0.115, 0.15, 0.23, 0.05);
        p.pop();
      }
      p.stroke(LINE);
      p.noFill();
      for (const side of [-1, 1]) {
        p.push();
        p.translate(side * c.hw * 1.06, c.hh * 0.02);
        p.rect(-0.075, -0.115, 0.15, 0.23, 0.05);
        p.pop();
      }
      break;
    }
    case 4: { // hood: close over the crown, open below the jaw
      // A shell only slightly larger than the head, cut off at the cheekbone
      // and closed back along the head itself so the gap reads as the opening.
      // Ringing the entire outline turns a hood into a picture frame.
      const shell = c.jaw.map(([x, y]) => [x * 1.15, y * 1.13 - c.hh * 0.05] as [number, number]);
      const upper = longestRun(shell, ([, y]) => y < c.hh * 0.4);
      const inner = longestRun(c.jaw, ([, y]) => y < c.hh * 0.4);
      if (upper.length < 3 || inner.length < 3) break;
      p.fill(cloth);
      p.noStroke();
      p.beginShape();
      for (const [x, y] of upper) p.vertex(x, y);
      for (let i = inner.length - 1; i >= 0; i--) p.vertex(inner[i][0] * 1.01, inner[i][1] * 1.01);
      p.endShape('close');
      p.stroke(LINE);
      p.noFill();
      stroke(p, upper, c.ink, { passes: 1 });
      break;
    }
    case 5: { // a band across the brow
      p.fill(cloth);
      p.noStroke();
      p.beginShape();
      for (const [x, y] of top) p.vertex(x * 1.03, y * 1.03);
      for (let i = top.length - 1; i >= 0; i--) p.vertex(top[i][0], brimY + c.hh * 0.08);
      p.endShape('close');
      p.stroke(LINE);
      break;
    }
    default: { // beanie, with a turn-up
      dome(0.06, cloth);
      p.fill(cloth);
      p.noStroke();
      p.rect(-c.hw * 0.98, brimY - 0.01, c.hw * 1.96, c.hh * 0.13, 0.02);
      p.stroke(LINE);
      p.noFill();
      p.rect(-c.hw * 0.98, brimY - 0.01, c.hw * 1.96, c.hh * 0.13, 0.02);
      break;
    }
  }
}

/** Worn at the neck. Only drawn when there is a neck to hang it on. */
function neckwear(c: Ctx, gn: Genome) {
  const kind = cat(gn, 'neck');
  if (kind === 0) return;
  const p = c.p;
  const y0 = c.hh * 0.95;
  const y1 = y0 + c.hh * 0.3;
  const cloth = pick(CLOTH, dial(gn, 'washOffX'));
  const w = c.hw * (0.13 + dial(gn, 'neckLen') * 0.12);

  p.noFill();
  p.stroke(LINE);
  switch (kind) {
    case 1: { // collar and tie
      stroke(p, [[-w * 2.2, y1], [-w * 0.45, y0 + c.hh * 0.05], [0, y1 * 0.96]], c.ink, { passes: 1 });
      stroke(p, [[w * 2.2, y1], [w * 0.45, y0 + c.hh * 0.05], [0, y1 * 0.96]], c.ink, { passes: 1 });
      p.fill(cloth);
      p.noStroke();
      // A knot, then a blade that narrows as it falls. One wide rectangle under
      // the chin reads as a bow tie resting on a table.
      p.beginShape();
      p.vertex(-w * 0.3, y0 + c.hh * 0.08);
      p.vertex(w * 0.3, y0 + c.hh * 0.08);
      p.vertex(w * 0.24, y0 + c.hh * 0.2);
      p.vertex(-w * 0.24, y0 + c.hh * 0.2);
      p.endShape('close');
      p.beginShape();
      p.vertex(-w * 0.22, y0 + c.hh * 0.2);
      p.vertex(w * 0.22, y0 + c.hh * 0.2);
      p.vertex(w * 0.28, y1 + c.hh * 0.26);
      p.vertex(0, y1 + c.hh * 0.36);
      p.vertex(-w * 0.28, y1 + c.hh * 0.26);
      p.endShape('close');
      p.stroke(LINE);
      break;
    }
    case 2: { // a lanyard, hanging a card
      stroke(p, [[-w * 1.1, y0], [-w * 0.35, y1 + c.hh * 0.1]], c.ink, { passes: 1 });
      stroke(p, [[w * 1.1, y0], [w * 0.35, y1 + c.hh * 0.1]], c.ink, { passes: 1 });
      p.fill('#f0ece0');
      p.stroke(LINE);
      p.rect(-w * 0.42, y1 + c.hh * 0.1, w * 0.84, c.hh * 0.19, 0.012);
      p.noFill();
      break;
    }
    case 3: { // a scarf, wound
      p.fill(cloth);
      p.noStroke();
      p.rect(-c.hw * 0.62, y0 + c.hh * 0.02, c.hw * 1.24, c.hh * 0.17, 0.04);
      p.rect(-c.hw * 0.22, y0 + c.hh * 0.14, c.hw * 0.3, c.hh * 0.3, 0.02);
      p.stroke(LINE);
      break;
    }
    case 4: { // hoodie strings
      stroke(p, [[-w * 0.7, y0 + c.hh * 0.04], [-w * 0.8, y1 + c.hh * 0.12]], c.ink, { passes: 1 });
      stroke(p, [[w * 0.55, y0 + c.hh * 0.04], [w * 0.72, y1 + c.hh * 0.16]], c.ink, { passes: 1 });
      p.fill(LINE);
      p.noStroke();
      p.circle(-w * 0.8, y1 + c.hh * 0.13, 0.03);
      p.circle(w * 0.72, y1 + c.hh * 0.17, 0.03);
      p.stroke(LINE);
      p.noFill();
      break;
    }
    case 5: { // a chain
      p.noFill();
      p.stroke(LINE);
      stroke(p, arc(0, y0 - c.hh * 0.02, c.hw * 1.5, 0.15, Math.PI - 0.15), c.ink, { passes: 1 });
      break;
    }
    case 7: { // a rolled neck, which is a whole personality on its own
      p.fill(cloth);
      p.noStroke();
      p.rect(-c.hw * 0.44, y0 + c.hh * 0.01, c.hw * 0.88, c.hh * 0.2, 0.03);
      p.stroke(LINE);
      p.noFill();
      p.rect(-c.hw * 0.44, y0 + c.hh * 0.01, c.hw * 0.88, c.hh * 0.2, 0.03);
      stroke(p, [[-c.hw * 0.44, y0 + c.hh * 0.11], [c.hw * 0.44, y0 + c.hh * 0.11]], c.ink, {
        passes: 1,
      });
      break;
    }
    default: { // an open collar
      stroke(p, [[-w * 2.2, y1], [-w * 0.4, y0 + c.hh * 0.07]], c.ink, { passes: 1 });
      stroke(p, [[w * 2.2, y1], [w * 0.4, y0 + c.hh * 0.07]], c.ink, { passes: 1 });
      break;
    }
  }
}

/**
 * Ears that are not human.
 *
 * Four shapes — pointed, floppy, round, tufted — placed on the skull rather
 * than at the temples, because an animal's ears sit on top of the head and
 * that placement is most of what makes the silhouette read as a creature.
 */
function animalEars(c: Ctx, gn: Genome, kind: number) {
  const p = c.p;
  const s = (0.3 + dial(gn, 'earSize') * 0.4) * c.hh;
  const ink = hairColour(gn);
  const inner = '#e0b4a8';

  const one = (side: number) => {
    const bx = side * c.hw * 0.62;
    const by = -c.hh * 0.78;
    p.push();
    p.translate(bx, by);
    p.rotate(side * 0.28);

    let shape: [number, number][];
    if (kind === 0) shape = [[-s * 0.42, s * 0.18], [0, -s], [s * 0.42, s * 0.18]];
    else if (kind === 1)
      shape = [
        [-s * 0.34, -s * 0.1], [-s * 0.5, s * 0.5], [-s * 0.2, s * 0.95],
        [s * 0.18, s * 0.8], [s * 0.34, -s * 0.05],
      ];
    else if (kind === 2) shape = ring(0, -s * 0.35, s * 1.05);
    else
      shape = [
        [-s * 0.4, s * 0.2], [-s * 0.24, -s * 0.55], [-s * 0.34, -s * 1.05],
        [0, -s * 0.72], [s * 0.3, -s * 1.1], [s * 0.22, -s * 0.5], [s * 0.4, s * 0.2],
      ];

    p.fill(ink);
    p.noStroke();
    p.beginShape();
    for (const [x, y] of shape) p.vertex(x, y);
    p.endShape('close');
    // A lighter inner ear, inset.
    p.fill(inner);
    p.beginShape();
    for (const [x, y] of shape) p.vertex(x * 0.5, y * 0.5 - s * 0.06);
    p.endShape('close');
    p.stroke(LINE);
    p.noFill();
    stroke(p, shape, c.ink, { close: true, passes: 1 });
    p.pop();
  };

  one(-1);
  one(1);
}

/**
 * A snout.
 *
 * Drawn over the lower face and *before* the mouth, so the mouth lands on the
 * muzzle rather than behind it. The nose is a wedge or a heart depending on the
 * family, and a beak replaces both.
 *
 * A snout reports back where it ended and how wide it was, so the whiskers know
 * where to start. The cold-blooded jaws also report `ownMouth`, because a
 * crocodile's tooth line and a fish's pursed ring *are* the mouth, and letting
 * the generic mouth draw on top of them puts a human smile inside a shark.
 */
function muzzle(c: Ctx, gn: Genome): Snout | null {
  const kind = cat(gn, 'muzzle');
  if (kind === 0) return null;
  if (kind >= 5) return coldJaw(c, gn, kind);
  const p = c.p;
  const y = c.hh * 0.24;
  const long = kind === 2 ? 1.5 : kind === 4 ? 0.85 : 1;
  const w = c.hw * (kind === 4 ? 0.86 : 0.6) * (0.85 + dial(gn, 'noseSize') * 0.4);
  const h = c.hh * 0.42 * long;

  if (kind === 3) {
    // A beak: two triangles meeting at a line.
    const bx = c.turn * 1.2;
    p.fill('#d8a03c');
    p.noStroke();
    p.beginShape();
    p.vertex(bx - w * 0.5, y - h * 0.1);
    p.vertex(bx + w * 0.95, y + h * 0.18);
    p.vertex(bx - w * 0.5, y + h * 0.42);
    p.endShape('close');
    p.stroke(LINE);
    p.noFill();
    stroke(p, [[bx - w * 0.5, y - h * 0.1], [bx + w * 0.95, y + h * 0.18], [bx - w * 0.5, y + h * 0.42]], c.ink, {
      close: true,
      passes: 1,
    });
    stroke(p, [[bx - w * 0.5, y + h * 0.16], [bx + w * 0.9, y + h * 0.19]], c.ink, { passes: 1 });
    return { y: y + h * 0.5, w };
  }

  // A pale snout patch, then a nose on the end of it.
  p.fill('#efe0d2');
  p.noStroke();
  p.beginShape();
  for (const [x, yy] of ring(c.turn, y + h * 0.36, w * 2, (h * 1.5) / (w * 2) * 1.4)) p.vertex(x, yy);
  p.endShape('close');
  p.stroke(LINE);
  p.noFill();
  stroke(p, ring(c.turn, y + h * 0.36, w * 2, (h * 1.5) / (w * 2) * 1.4), c.ink, {
    close: true,
    passes: 1,
  });

  // Nose: a rounded triangle sitting at the top of the snout.
  const nx = c.turn;
  const ny = y + h * 0.02;
  const nw = w * 0.5;
  p.fill(LINE);
  p.noStroke();
  p.beginShape();
  p.vertex(nx - nw, ny - nw * 0.42);
  p.vertex(nx + nw, ny - nw * 0.42);
  p.vertex(nx, ny + nw * 0.6);
  p.endShape('close');
  p.stroke(LINE);
  p.noFill();
  // The philtrum, down from the nose.
  stroke(p, [[nx, ny + nw * 0.6], [nx, ny + h * 0.55]], c.ink, { passes: 1 });
  return { y: ny + h * 0.55, w };
}

/** What a snout reports back to the rest of the face. */
interface Snout {
  /** Where the snout ended, so whiskers and beards know to start below it. */
  y: number;
  w: number;
  /** The jaw already drew its own mouth; do not draw another one over it. */
  ownMouth?: boolean;
}

/**
 * The cold-blooded jaws: a crocodile, a fish and a gape.
 *
 * These are the same idea as the mammal snout — a shape over the lower face
 * that the whiskers hang off — but they carry their own mouth. A crocodile is
 * mostly a *proportion*: the snout is longer than the skull it is attached to,
 * and once that ratio is right the teeth are only confirming it. A fish is the
 * opposite, all mouth and no jaw at all.
 */
function coldJaw(c: Ctx, gn: Genome, kind: number): Snout {
  const p = c.p;
  const hide = scaleColour(gn);

  // ---------------------------------------------------------- the crocodile
  if (kind === 5) {
    // Below the eye line, not through it. The first pass put the snout at the
    // brow and it covered the eyes on every long-headed croc in the tank.
    const y0 = c.hh * 0.1;
    const len = c.hh * (0.6 + dial(gn, 'earSize') * 0.26);
    const w = c.hw * (0.4 + dial(gn, 'noseSize') * 0.16);
    const tip = w * 0.68;
    const nose = y0 + len;
    const outline: [number, number][] = [
      [-w, y0],
      [-w * 0.86, y0 + len * 0.5],
      [-tip, nose - len * 0.06],
      [-tip * 0.55, nose + len * 0.04],
      [tip * 0.55, nose + len * 0.04],
      [tip, nose - len * 0.06],
      [w * 0.86, y0 + len * 0.5],
      [w, y0],
    ];
    p.noStroke();
    p.fill(hide);
    p.beginShape();
    for (const [x, y] of outline) p.vertex(x + c.turn, y);
    p.endShape('close');
    p.stroke(LINE);
    p.noFill();
    stroke(p, outline.map(([x, y]) => [x + c.turn, y] as [number, number]), c.ink, { passes: 1 });

    /*
     * The teeth run down the *sides*, not across.
     *
     * The first version drew one zigzag straight across the snout, which is
     * where the jaw line goes on a face seen from the side — head on it read as
     * the bottom seam of a paper bag. On a crocodile looked at from the front
     * you are seeing the top plate of the snout with both jaw lines running
     * away from you down its edges, so that is where the teeth belong.
     */
    p.noStroke();
    const nT = 6;
    for (const side of [-1, 1]) {
      const ax = side * w + c.turn;
      const ay = y0;
      const bx = side * tip + c.turn;
      const by = nose - len * 0.06;
      const dx = bx - ax;
      const dy = by - ay;
      const d = Math.hypot(dx, dy) || 1;
      // Outward normal of the edge, so a tooth points away from the snout.
      const nx = (dy / d) * side * -1;
      const ny = (-dx / d) * side * -1;
      const th = w * 0.24;
      for (let i = 0; i < nT; i++) {
        const t0 = 0.1 + (i / nT) * 0.86;
        const t1 = t0 + 0.42 / nT;
        const x0 = ax + dx * t0;
        const y0t = ay + dy * t0;
        const x1 = ax + dx * t1;
        const y1t = ay + dy * t1;
        p.fill('#f4f0e6');
        p.triangle(x0, y0t, x1, y1t, (x0 + x1) / 2 + nx * th, (y0t + y1t) / 2 + ny * th);
        p.stroke(LINE);
        p.noFill();
        stroke(
          p,
          [
            [x0, y0t],
            [(x0 + x1) / 2 + nx * th, (y0t + y1t) / 2 + ny * th],
            [x1, y1t],
          ],
          c.ink,
          { passes: 1, weightScale: 0.45 },
        );
        p.noStroke();
      }
    }
    p.stroke(LINE);
    p.noFill();

    // The ridge down the middle, and two plates across it.
    stroke(p, [[c.turn, y0 + len * 0.08], [c.turn, nose - len * 0.14]], c.ink, {
      passes: 1,
      weightScale: 0.5,
    });
    for (let i = 0; i < 2; i++) {
      const ry = y0 + len * (0.24 + i * 0.24);
      const rw = w * (0.6 - i * 0.12);
      stroke(
        p,
        [
          [c.turn - rw, ry + rw * 0.3],
          [c.turn, ry],
          [c.turn + rw, ry + rw * 0.3],
        ],
        c.ink,
        { passes: 1, weightScale: 0.5 },
      );
    }

    // Nostrils on the very end.
    p.noStroke();
    p.fill(LINE);
    p.circle(c.turn - tip * 0.42, nose - len * 0.02, w * 0.15);
    p.circle(c.turn + tip * 0.42, nose - len * 0.02, w * 0.15);
    p.stroke(LINE);
    return { y: nose, w, ownMouth: true };
  }

  // ---------------------------------------------------------------- the fish
  if (kind === 6) {
    const y = c.hh * (0.34 + dial(gn, 'mouthCurve') * 0.14);
    const rr = c.hw * (0.19 + dial(gn, 'mouthWidth') * 0.13);
    const squash = 1.15;
    p.noStroke();
    p.fill(hide);
    p.beginShape();
    for (const [x, yy] of ring(c.turn, y, rr * 2.4, squash)) p.vertex(x, yy);
    p.endShape('close');
    p.fill('#3a2422');
    p.beginShape();
    for (const [x, yy] of ring(c.turn, y, rr * 1.3, squash)) p.vertex(x, yy);
    p.endShape('close');
    p.stroke(LINE);
    p.noFill();
    stroke(p, ring(c.turn, y, rr * 2.4, squash), c.ink, { close: true, passes: 1 });
    stroke(p, ring(c.turn, y, rr * 1.3, squash), c.ink, { close: true, passes: 1 });
    return { y: y + rr * 1.2, w: rr * 1.2, ownMouth: true };
  }

  // --------------------------------------------------------------- the gape
  const y = c.hh * 0.34;
  const w = c.hw * (0.5 + dial(gn, 'mouthWidth') * 0.22);
  const h = c.hh * (0.16 + dial(gn, 'mouthCurve') * 0.13);
  const lens: [number, number][] = [];
  for (let i = 0; i <= 18; i++) {
    const t = -1 + (i / 18) * 2;
    lens.push([c.turn + t * w, y - Math.cos((t * Math.PI) / 2) * h]);
  }
  for (let i = 18; i >= 0; i--) {
    const t = -1 + (i / 18) * 2;
    lens.push([c.turn + t * w, y + Math.cos((t * Math.PI) / 2) * h * 1.15]);
  }
  p.noStroke();
  p.fill('#2b1a1a');
  p.beginShape();
  for (const [x, yy] of lens) p.vertex(x, yy);
  p.endShape('close');

  // Teeth, hanging from the upper jaw and standing on the lower.
  p.fill('#f4f0e6');
  const nT = 7;
  for (let i = 0; i < nT; i++) {
    const t = -0.86 + (i / (nT - 1)) * 1.72;
    const upY = y - Math.cos((t * Math.PI) / 2) * h;
    const dnY = y + Math.cos((t * Math.PI) / 2) * h * 1.15;
    const tw = w * 0.075;
    p.triangle(c.turn + t * w - tw, upY, c.turn + t * w + tw, upY, c.turn + t * w, upY + h * 0.5);
    if (i % 2 === 0) {
      p.triangle(c.turn + t * w - tw, dnY, c.turn + t * w + tw, dnY, c.turn + t * w, dnY - h * 0.42);
    }
  }
  p.stroke(LINE);
  p.noFill();
  stroke(p, lens, c.ink, { close: true, passes: 1 });
  return { y: y + h * 1.15, w, ownMouth: true };
}

/**
 * Fins, gills and crests.
 *
 * Drawn before the silhouette is inked, so the head line lands on top of every
 * base and a fin reads as attached rather than stuck on. Like the animal ears
 * this is gated on `kingdom` at the call site — the one rule this file has is
 * that no creature part is ever reachable from a human set.
 */
function fins(c: Ctx, gn: Genome, outline: [number, number][]) {
  const kind = cat(gn, 'fin');
  if (kind === 0) return;
  const p = c.p;
  const hide = scaleColour(gn);
  const amp = 0.16 + dial(gn, 'earSize') * 0.3;

  // A sawtooth raised radially off a run of the outline.
  const crest = (run: [number, number][], height: number, stride: number) => {
    if (run.length < 4) return;
    const saw: [number, number][] = [];
    for (let i = 0; i < run.length; i += stride) {
      const [x, y] = run[i];
      saw.push([x, y]);
      const j = Math.min(run.length - 1, i + Math.floor(stride / 2));
      const [mx, my] = run[j];
      const len = Math.hypot(mx, my) || 1;
      saw.push([mx * (1 + height / len), my * (1 + height / len)]);
    }
    saw.push(run[run.length - 1]);
    p.noStroke();
    p.fill(hide);
    p.beginShape();
    for (const [x, y] of saw) p.vertex(x, y);
    p.endShape('close');
    p.stroke(LINE);
    p.noFill();
    stroke(p, saw, c.ink, { passes: 1, weightScale: 0.8 });
  };

  if (kind === 1) {
    // A dorsal crest over the crown.
    crest(longestRun(outline, ([, y]) => y < -c.hh * 0.34), c.hh * amp * 1.6, 4);
    return;
  }

  if (kind === 2) {
    // Gill slits: three curved lines on each cheek, the far side shortened when
    // the head has turned.
    p.noFill();
    p.stroke(LINE);
    for (const side of [-1, 1]) {
      const shrink = c.turn !== 0 && Math.sign(c.turn) !== side ? 0.55 : 1;
      for (let i = 0; i < 3; i++) {
        const x = side * c.hw * (0.72 - i * 0.11);
        const h = c.hh * 0.24 * shrink;
        stroke(
          p,
          [
            [x, -h],
            [x + side * c.hw * 0.05, 0],
            [x, h],
          ],
          c.ink,
          { passes: 1, weightScale: 0.8 },
        );
      }
    }
    return;
  }

  if (kind === 3) {
    // Pectoral fins, where the ears would have been.
    const s = c.hh * (0.34 + dial(gn, 'earSize') * 0.34);
    for (const side of [-1, 1]) {
      const bx = side * c.hw * 0.9;
      const shape: [number, number][] = [
        [bx, -s * 0.34],
        [bx + side * s * 1.15, -s * 0.1],
        [bx + side * s * 1.3, s * 0.42],
        [bx + side * s * 0.8, s * 0.68],
        [bx, s * 0.5],
      ];
      p.noStroke();
      p.fill(hide);
      p.beginShape();
      for (const [x, y] of shape) p.vertex(x, y);
      p.endShape('close');
      p.stroke(LINE);
      p.noFill();
      stroke(p, shape, c.ink, { close: true, passes: 1 });
      // Ribs, which is what makes it a fin and not a leaf.
      for (let i = 1; i <= 3; i++) {
        const t = i / 4;
        stroke(
          p,
          [
            [bx, -s * 0.34 + t * s * 0.84],
            [bx + side * s * (1.05 - t * 0.22), -s * 0.1 + t * s * 0.7],
          ],
          c.ink,
          { passes: 1, weightScale: 0.55 },
        );
      }
    }
    return;
  }

  // A frill: spines the whole way round, thinning at the jaw.
  p.noStroke();
  const step = 5;
  for (let i = 0; i < outline.length; i += step) {
    const [x, y] = outline[i];
    const len = Math.hypot(x, y) || 1;
    const shorten = y > c.hh * 0.4 ? 0.35 : 1;
    const out = 1 + (c.hh * amp * shorten) / len;
    const [px, py] = outline[(i + step) % outline.length];
    p.fill(hide);
    p.triangle(x, y, px, py, ((x + px) / 2) * out, ((y + py) / 2) * out);
    p.stroke(LINE);
    p.noFill();
    stroke(p, [[x, y], [((x + px) / 2) * out, ((y + py) / 2) * out], [px, py]], c.ink, {
      passes: 1,
      weightScale: 0.5,
    });
    p.noStroke();
  }
  p.stroke(LINE);
}

/** Whiskers, either side of the snout. */
function whiskers(c: Ctx, gn: Genome, at: { y: number; w: number } | null) {
  const kind = cat(gn, 'whisker');
  if (kind === 0 || !at) return;
  const p = c.p;
  const n = kind === 1 ? 2 : 3;
  p.noFill();
  p.stroke(LINE);
  for (const side of [-1, 1]) {
    for (let i = 0; i < n; i++) {
      const t = (i - (n - 1) / 2) / Math.max(1, n);
      const y0 = at.y - c.hh * 0.12 + t * c.hh * 0.1;
      stroke(
        p,
        [
          [side * at.w * 0.5, y0],
          [side * (c.hw * 1.25 + at.w * 0.2), y0 + t * c.hh * 0.3 - c.hh * 0.05],
        ],
        c.ink,
        { passes: 1, weightScale: 0.7 },
      );
    }
  }
}
