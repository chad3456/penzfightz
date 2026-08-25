import type p5 from 'p5';
import { cat, dial, mulberry, type Genome } from './genome';

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

// ------------------------------------------------------------- line machinery

/** Smooth 1-D noise: a hand wanders, it does not jitter. */
function wander(seed: number) {
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

export interface Ink {
  tremor: number;
  weight: number;
  seed: number;
}

/**
 * Draw a path as a pen would: wobbling along its length, gone over twice, and
 * overshooting a little at the ends the way a hand does not stop exactly where
 * it meant to.
 */
function stroke(
  p: p5,
  pts: [number, number][],
  ink: Ink,
  o: { close?: boolean; passes?: number; overshoot?: number; weightScale?: number } = {},
) {
  if (pts.length < 2) return;
  const passes = o.passes ?? 2;
  const n1 = wander(ink.seed);
  const n2 = wander(ink.seed ^ 0x51ed);

  for (let pass = 0; pass < passes; pass++) {
    const phase = pass * 13.7;
    const drift = pass === 0 ? 0 : ink.tremor * 0.55;
    p.strokeWeight(ink.weight * (o.weightScale ?? 1) * (pass === 0 ? 1 : 0.72));
    p.noFill();
    p.beginShape();
    const m = pts.length;
    for (let i = 0; i <= (o.close ? m : m - 1); i++) {
      const [x, y] = pts[i % m];
      const t = i * 0.55 + phase;
      p.splineVertex(x + n1(t) * (ink.tremor + drift), y + n2(t) * (ink.tremor + drift));
      // A spline needs its ends doubled to actually reach them.
      if (!o.close && (i === 0 || i === m - 1)) {
        p.splineVertex(x + n1(t) * ink.tremor, y + n2(t) * ink.tremor);
      }
    }
    if (o.close) p.endShape('close');
    else p.endShape();
  }
}

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

const PAPER = ['#f3efe3', '#f2eee6', '#efe9db'];
const SKIN = [
  '#f0cfc2', '#e8c7a8', '#dbb894', '#c99b74', '#a97a55',
  '#cfd6d2', '#d8dcc9', '#e9c9c9', '#cdd5df', '#e3d9c4',
];
const HAIR_INK = ['#161616', '#2b2118', '#5a4632', '#7d6a52', '#9a9a9a'];
const LINE = '#141414';

/**
 * Index a palette by a gene.
 *
 * `mutate` clamps with `Math.min(1, ...)`, so a gene can be exactly 1.0, and
 * `arr[Math.floor(1.0 * arr.length)]` is one past the end. p5 fills undefined
 * as black, which is why four faces in the first hundred came out as solid
 * black blobs with the features drawn invisibly on top.
 */
const pick = <T,>(arr: T[], t: number): T => arr[Math.min(arr.length - 1, Math.floor(t * arr.length))];

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

const ring = (x: number, y: number, s: number, squash = 1): [number, number][] =>
  Array.from({ length: 18 }, (_, i) => {
    const t = (i / 18) * Math.PI * 2;
    return [x + (Math.cos(t) * s) / 2, y + ((Math.sin(t) * s) / 2) * squash] as [number, number];
  });

const box = (x: number, y: number, w: number, h: number): [number, number][] => [
  [x - w / 2, y - h / 2],
  [x + w / 2, y - h / 2],
  [x + w / 2, y + h / 2],
  [x - w / 2, y + h / 2],
];

const arc = (x: number, y: number, s: number, a0: number, a1: number): [number, number][] =>
  Array.from({ length: 12 }, (_, i) => {
    const t = a0 + ((a1 - a0) * i) / 11;
    return [x + (Math.cos(t) * s) / 2, y + (Math.sin(t) * s) / 2] as [number, number];
  });

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
  const which = cat(gn, 'ears');
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
  const ink = pick(HAIR_INK, dial(gn, 'hairInk'));
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
    // Goatee: a dark wedge on the chin.
    p.fill(ink);
    p.noStroke();
    p.beginShape();
    p.vertex(-w * 0.4, y + 0.03);
    p.vertex(w * 0.4, y + 0.03);
    p.vertex(w * 0.18, chin * (0.72 + amount * 0.2));
    p.vertex(-w * 0.18, chin * (0.72 + amount * 0.2));
    p.endShape('close');
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
    const skin = pick(SKIN, dial(gn, 'skin'));
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

  // --- the head itself
  p.stroke(LINE);
  p.noFill();
  stroke(p, outline, ink, { close: true });

  hair(c, gn, outline);
  const e = eyes(c, gn);
  brows(c, gn, e);
  nose(c, gn, e.y);
  mouth(c, gn);
  beard(c, gn, hh);
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

  // --- neck: two short lines that do not quite meet the chin
  if (dial(gn, 'neck') > 0.42) {
    p.noFill();
    p.stroke(LINE);
    const y0 = hh * 0.94;
    const w = hw * (0.13 + dial(gn, 'neck') * 0.12);
    stroke(p, [[-w, y0], [-w * 0.95, y0 + hh * 0.22]], ink, { passes: 1 });
    stroke(p, [[w, y0], [w * 0.95, y0 + hh * 0.22]], ink, { passes: 1 });
  }

  p.pop();
}

export { PAPER };
