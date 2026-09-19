import {
  HB, hatch, mark, paper, pencil, rng, smooth, type Pencil, type Pt,
} from '../pencil/graphite';
import { drawHead } from '../pencil/face';
import { FACES } from '../pencil/expressions';
import type { Character } from '../pencil/characters';
import { GARETH, ROSA, ROSA_AT_WORK } from './cast';
import type { Shot } from './script';

/**
 * The places, drawn so they read at the size of a thumb.
 *
 * A comic panel is two inches wide and is looked at for a second and a half, so
 * a background has one job: say where this is, immediately, and then get out of
 * the way of the faces. Everything here is built from the fewest marks that
 * name a place — strip lights and partition tops for the sales floor, two
 * receding shelf runs for the aisle, a brick course and a bin for the alley.
 *
 * One-point perspective throughout, with the vanishing point on the panel's own
 * centre line. It is the cheapest way to make a flat set of rectangles read as
 * a room, and in a six-panel page nobody is measuring.
 */

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

const INK = '#23201c';

/** Pencils, graded for the job. Lighter for the far stuff, darker for figures. */
/*
   These were all about a third too light, and the symptom was misleading: the
   backgrounds looked *missing* rather than faint. A panel is two inches wide
   and printed, and pencil that reads fine at full size disappears at a
   thumbnail — so the far grade has to be a grade you can actually see, not a
   grade that is technically present.
*/
const FAR: Partial<Pencil> = { press: 0.44, size: 1.2, passes: 1, grade: 0.62 };
const MID: Partial<Pencil> = { press: 0.64, size: 1.55, passes: 2, grade: 0.76 };
const NEAR: Partial<Pencil> = { press: 0.86, size: 2.3, passes: 2, grade: 0.9 };

const line = (g: CanvasRenderingContext2D, a: Pt, b: Pt, p: Pencil, seed: number, flat = true) =>
  mark(g, [a, b], p, seed, { flat });

const rect = (b: Box): Pt[] => [
  [b.x, b.y], [b.x + b.w, b.y], [b.x + b.w, b.y + b.h], [b.x, b.y + b.h],
];

// ────────────────────────────────────────────────────────────── figures

type Pose = 'stand' | 'sit' | 'lean' | 'smoke' | 'counter' | 'basket';

/**
 * A body under a head.
 *
 * Deliberately a mannequin: shoulders, a torso that tapers, and arms that go
 * where the pose needs them. At panel size a carefully observed body is wasted
 * effort and an obviously wrong one is not — what carries a figure is the
 * silhouette and where the head is pointing.
 */
/**
 * The tallest a figure can be and still have its head inside the panel.
 *
 * Every caller was setting height as a fraction of the panel and standing the
 * figure near its bottom edge, which put the crown above the top of the box on
 * anything but the tallest panels — the checkout clerk was decapitated by her
 * own panel border in three places.
 */
function fits(b: Box, footY: number, want: number): number {
  return Math.min(want, (footY - b.y) * 0.94);
}

/**
 * A head at thumbnail size: shape, hair, and two marks for eyes.
 *
 * The character still has to be recognisable, and at this size recognition is
 * entirely silhouette — the length of the jaw and the mass of the hair. Those
 * two are read straight off the same character record the full face uses, so a
 * figure across the room is the same person as the close-up on the next panel.
 */
function smallHead(
  g: CanvasRenderingContext2D,
  who: Character, cx: number, cy: number, R: number, seed: number, p: Pencil,
) {
  const near = pencil(p, { press: 0.7, size: 1.5, passes: 2, grade: 0.82 });
  const len = R * who.faceLen;
  const halfW = R * who.cheek;
  const jawW = halfW * (0.42 + who.jaw * 0.5);

  // Skull and jaw as one closed shape: a dome that narrows to the chin.
  mark(g, smooth([
    [cx - halfW, cy],
    [cx - halfW * 0.96, cy - len * 0.62],
    [cx, cy - len * 0.86],
    [cx + halfW * 0.96, cy - len * 0.62],
    [cx + halfW, cy],
    [cx + jawW, cy + len * 0.5],
    [cx, cy + len * 0.78],
    [cx - jawW, cy + len * 0.5],
    [cx - halfW, cy],
  ], 10), near, seed);

  // The hair, as a mass rather than as strands: a cap that comes down further
  // on one side for a parting, and past the jaw when it is worn down.
  const drop = who.locks > 0.7 ? len * 0.95 : len * 0.1;
  const part = who.parting * halfW * 0.5;
  mark(g, smooth([
    [cx - halfW * 1.04, cy - len * 0.05 + drop],
    [cx - halfW * 1.05, cy - len * 0.42],
    [cx - halfW * 0.6, cy - len * 0.92 * who.puff],
    [cx + part, cy - len * 0.98 * who.puff],
    [cx + halfW * 0.72, cy - len * 0.86 * who.puff],
    [cx + halfW * 1.05, cy - len * 0.36],
    [cx + halfW * 1.04, cy - len * 0.05 + drop],
    [cx + halfW * 0.7, cy - len * 0.3],
    [cx + part * 0.6, cy - len * 0.52],
    [cx - halfW * 0.72, cy - len * 0.34],
    [cx - halfW * 1.04, cy - len * 0.05 + drop],
  ], 10), near, seed + 3);

  // Two eyes and a mouth, each one mark. Any more is mud at this size.
  const eyeY = cy - len * 0.5 + len * who.eyeY * 0.5;
  const dx = halfW * who.eyeDx;
  for (const side of [-1, 1] as const) {
    mark(g, [
      [cx + side * dx - R * 0.16, eyeY], [cx + side * dx + R * 0.16, eyeY],
    ], pencil(p, { press: 0.8, size: 1.3, passes: 2, grade: 0.9 }), seed + 10 + side);
  }
  mark(g, [
    [cx - R * 0.17 * who.mouthW, cy + len * 0.34],
    [cx + R * 0.17 * who.mouthW, cy + len * 0.34],
  ], pencil(p, { press: 0.55, size: 1.2, passes: 1, grade: 0.7 }), seed + 14);
}

function figure(
  g: CanvasRenderingContext2D,
  who: Character, expr: string,
  cx: number, footY: number, height: number,
  pose: Pose, seed: number, p: Pencil,
) {
  // Six heads, not seven and a half. Comic figures are drawn short because the
  // head carries the acting and a realistic one is four pixels across.
  const headR = height * 0.135;
  const headCy = footY - height + headR * 1.25;
  const shoulderY = headCy + headR * 2.1;
  const half = headR * (pose === 'counter' ? 1.55 : 1.45);
  const hipY = footY - height * 0.44;

  const body = pencil(p, NEAR);

  // Something to stand on. Without it a figure hangs in its panel, and the
  // problem never looks like a missing shadow — it looks like a bad drawing.
  hatch(g, [
    [cx - half * 1.5, footY - headR * 0.1],
    [cx + half * 1.5, footY - headR * 0.1],
    [cx + half * 1.9, footY + headR * 0.34],
    [cx - half * 1.9, footY + headR * 0.34],
  ], pencil(p, { press: 0.34, size: 1.1, passes: 1, grade: 0.6 }), seed + 90, -Math.PI / 3.2, 2.6, 0.7);

  // Shoulders and torso.
  mark(g, smooth([
    [cx - half, shoulderY],
    [cx - half * 0.92, hipY],
  ], 6), body, seed + 1);
  mark(g, smooth([
    [cx + half, shoulderY],
    [cx + half * 0.92, hipY],
  ], 6), body, seed + 2);
  mark(g, smooth([
    [cx - half, shoulderY], [cx - half * 0.4, shoulderY - headR * 0.3],
    [cx + half * 0.4, shoulderY - headR * 0.3], [cx + half, shoulderY],
  ], 7), body, seed + 3);

  // Collar, which is most of what says "shirt" at this size.
  mark(g, smooth([
    [cx - headR * 0.5, shoulderY - headR * 0.2],
    [cx, shoulderY + headR * 0.5],
    [cx + headR * 0.5, shoulderY - headR * 0.2],
  ], 6), pencil(p, MID), seed + 4);

  // Arms.
  const armTop = shoulderY + headR * 0.25;
  if (pose === 'smoke') {
    // One hand up at the mouth, the other in a pocket.
    mark(g, smooth([
      [cx + half * 0.95, armTop],
      [cx + half * 1.15, armTop + headR * 1.1],
      [cx + half * 0.3, headCy + headR * 0.85],
    ], 8), body, seed + 5);
    mark(g, smooth([
      [cx - half * 0.95, armTop],
      [cx - half * 1.05, armTop + headR * 1.4],
      [cx - half * 0.7, hipY],
    ], 8), body, seed + 6);
    // The cigarette, and what comes off it.
    const mx = cx + half * 0.24;
    const my = headCy + headR * 0.82;
    line(g, [mx, my], [mx + headR * 0.42, my - headR * 0.12], pencil(p, { press: 0.8, size: 1.3, passes: 1 }), seed + 7);
    smoke(g, mx + headR * 0.42, my - headR * 0.14, headR * 2.6, seed + 8, p);
  } else if (pose === 'basket') {
    mark(g, smooth([
      [cx + half * 0.95, armTop], [cx + half * 1.0, hipY - headR * 0.2], [cx + half * 0.72, hipY + headR * 0.4],
    ], 8), body, seed + 5);
    mark(g, smooth([
      [cx - half * 0.95, armTop], [cx - half * 1.0, hipY - headR * 0.2], [cx - half * 0.72, hipY + headR * 0.4],
    ], 8), body, seed + 6);
    // A shopping basket, hanging.
    const by = hipY + headR * 0.5;
    mark(g, [
      [cx - half * 0.85, by], [cx + half * 0.85, by],
      [cx + half * 0.6, by + headR * 0.85], [cx - half * 0.6, by + headR * 0.85],
      [cx - half * 0.85, by],
    ], pencil(p, MID), seed + 9, { flat: true });
  } else {
    for (const s of [-1, 1] as const) {
      mark(g, smooth([
        [cx + s * half * 0.95, armTop],
        [cx + s * half * 1.08, armTop + headR * 1.5],
        [cx + s * half * 0.82, hipY + headR * 0.5],
      ], 8), body, seed + 5 + (s > 0 ? 1 : 0));
    }
  }

  // Legs, only when the panel can see them.
  if (pose === 'stand' || pose === 'lean' || pose === 'smoke' || pose === 'basket') {
    const lean = pose === 'lean' ? headR * 0.5 : 0;
    for (const s of [-1, 1] as const) {
      mark(g, smooth([
        [cx + s * half * 0.5, hipY],
        [cx + s * half * 0.56 + lean * 0.4, (hipY + footY) / 2],
        [cx + s * half * 0.48 + lean, footY],
      ], 7), body, seed + 11 + (s > 0 ? 1 : 0));
    }
  }

  const face = FACES.find((f) => f.name === expr) ?? FACES[0]!;
  // Below about twenty-five pixels the full face machinery draws detail too
  // fine to survive: brows, lashes and a mouth all land inside three or four
  // pixels and average out to a pale smudge, which is why the figures at desks
  // were reading as headless torsos. At that size a comic draws a silhouette
  // and lets the reader do the rest, so that is what happens here.
  if (headR < 25) smallHead(g, who, cx, headCy, headR, seed + 20, p);
  else drawHead(g, face, who, cx, headCy, headR, seed + 20, { bare: true, noNeck: true });
}

/** A rising thread of it, which is the only thing in a panel that moves. */
function smoke(g: CanvasRenderingContext2D, x: number, y: number, up: number, seed: number, p: Pencil) {
  const r = rng(seed);
  const pts: Pt[] = [[x, y]];
  let px = x;
  for (let i = 1; i <= 7; i++) {
    px += (r() - 0.5) * up * 0.22;
    pts.push([px, y - (up * i) / 7]);
  }
  mark(g, smooth(pts, 8), pencil(p, { press: 0.2, size: 1.1, passes: 1, grade: 0.45 }), seed + 1);
}

// ───────────────────────────────────────────────────────────── the places

/**
 * A tone wash for an interior.
 *
 * An empty panel is not restraint, it is an unfinished panel. Two crossing
 * hatch passes at low pressure give the paper somewhere to be, and they read as
 * the grey of a strip-lit office without drawing a single thing in it.
 */
function wash(g: CanvasRenderingContext2D, area: Pt[], p: Pencil, seed: number, press = 0.15) {
  hatch(g, area, pencil(p, { press, size: 1.05, passes: 1, grade: 0.5 }), seed, -Math.PI / 3, 5.5, 0.55);
  hatch(g, area, pencil(p, { press: press * 0.7, size: 1, passes: 1, grade: 0.45 }), seed + 7, Math.PI / 3.4, 7.5, 0.5);
}

/**
 * The sales floor.
 *
 * The establishing shot of the issue, and the one panel that has to say "he is
 * one of ninety" without a word of caption doing it. So it is built as an
 * actual one-point perspective: a vanishing point on the centre line, a ceiling
 * of strip lights running back to it, and four rows of desk pods getting
 * smaller and fainter, each with a monitor and a head behind it. Repetition is
 * the whole content of the drawing — what makes the room oppressive is that
 * every pod is the same pod.
 */
function floor(g: CanvasRenderingContext2D, b: Box, seed: number, p: Pencil) {
  const vx = b.x + b.w * 0.5;
  const vy = b.y + b.h * 0.36;
  const far = pencil(p, FAR);
  const mid = pencil(p, MID);
  const near = pencil(p, NEAR);
  const faint = pencil(p, { press: 0.26, size: 1.05, passes: 1, grade: 0.5 });

  wash(g, rect(b), p, seed + 400, 0.1);

  // The back wall, with a run of windows along it. It is what stops the room
  // being infinite, and an office you can see the end of is worse than one you
  // cannot.
  const wallY = vy - b.h * 0.2;
  line(g, [b.x, wallY], [b.x + b.w, wallY], mid, seed + 1);
  line(g, [b.x, vy], [b.x + b.w, vy], mid, seed + 2);
  for (let i = 0; i < 7; i++) {
    const x = b.x + b.w * (0.04 + i * 0.135);
    mark(g, [
      [x, wallY + b.h * 0.03], [x + b.w * 0.1, wallY + b.h * 0.03],
      [x + b.w * 0.1, vy - b.h * 0.06], [x, vy - b.h * 0.06], [x, wallY + b.h * 0.03],
    ], far, seed + 5 + i, { flat: true });
  }

  // The floor, as lines converging on the vanishing point. Four is enough to
  // make a plane; the eye finishes it.
  for (let i = 0; i <= 6; i++) {
    const x = b.x + (i / 6) * b.w;
    line(g, [x, b.y + b.h], [vx + (x - vx) * 0.06, vy], faint, seed + 20 + i);
  }

  // Four ranks of desks, far to near, each one sitting ON its floor line so it
  // has somewhere to be. The repetition is the content of the drawing: what
  // makes the room oppressive is that every desk is the same desk.
  for (let row = 0; row < 4; row++) {
    const t = (row + 1) / 4;             // 0.25 near the wall, 1 at the front
    const yBase = vy + b.h * 0.66 * t * t;
    const k = 0.24 + t * t * 1.05;       // how big a desk is at that depth
    const unit = b.w * 0.2 * k;
    const grade = row === 3 ? near : row === 2 ? mid : row === 1 ? far : faint;
    const count = Math.max(2, Math.round(6 / k) | 0);

    for (let i = -count; i <= count; i++) {
      const cx = vx + i * unit * 1.5;
      if (cx < b.x - unit || cx > b.x + b.w + unit) continue;
      const hw = unit * 0.58;
      const deskH = b.h * 0.1 * k;

      // Desk top as a shallow parallelogram, then the partition behind it.
      mark(g, [
        [cx - hw, yBase], [cx + hw, yBase],
        [cx + hw * 0.88, yBase - deskH * 0.34], [cx - hw * 0.88, yBase - deskH * 0.34], [cx - hw, yBase],
      ], grade, seed + row * 90 + (i + count) * 6, { flat: true });
      mark(g, [
        [cx - hw * 0.88, yBase - deskH * 0.34], [cx + hw * 0.88, yBase - deskH * 0.34],
        [cx + hw * 0.88, yBase - deskH * 1.5], [cx - hw * 0.88, yBase - deskH * 1.5],
        [cx - hw * 0.88, yBase - deskH * 0.34],
      ], grade, seed + row * 90 + (i + count) * 6 + 1, { flat: true });

      // A monitor on it, and a head behind the monitor. Two marks, one worker,
      // and you never see a single face in the room.
      const mw = hw * 0.46;
      mark(g, [
        [cx - mw, yBase - deskH * 1.5], [cx + mw, yBase - deskH * 1.5],
        [cx + mw, yBase - deskH * 2.5], [cx - mw, yBase - deskH * 2.5], [cx - mw, yBase - deskH * 1.5],
      ], grade, seed + row * 90 + (i + count) * 6 + 2, { flat: true });
      mark(g, circle(cx + hw * (i % 2 ? 0.6 : -0.6), yBase - deskH * 2.1, deskH * 0.5, 16),
        grade, seed + row * 90 + (i + count) * 6 + 3, { flat: true });

      if (row >= 2) {
        hatch(g, [
          [cx - mw * 0.94, yBase - deskH * 2.4], [cx + mw * 0.94, yBase - deskH * 2.4],
          [cx + mw * 0.94, yBase - deskH * 1.6], [cx - mw * 0.94, yBase - deskH * 1.6],
        ], pencil(p, { press: 0.24, size: 1, passes: 1 }), seed + row * 90 + i + 500, Math.PI / 2, 2.6, 0.75);
        // A little shadow under the desk, which is most of what grounds it.
        hatch(g, [
          [cx - hw, yBase], [cx + hw, yBase],
          [cx + hw * 1.1, yBase + deskH * 0.4], [cx - hw * 1.1, yBase + deskH * 0.4],
        ], pencil(p, { press: 0.3, size: 1.05, passes: 1 }), seed + row * 90 + i + 700, -Math.PI / 3, 3, 0.7);
      }
    }
  }

  // Ceiling: strip lights running back, which is the other half of the depth.
  for (const side of [-1, 1] as const) {
    for (let i = 0; i < 4; i++) {
      const k = 1 - i * 0.22;
      const y = vy - b.h * (0.26 + 0.05 * i);
      const xa = vx + side * b.w * 0.46 * k;
      const xb = vx + side * b.w * 0.2 * k;
      line(g, [xa, y - b.h * 0.02 * k], [xb, y], i < 2 ? far : faint, seed + 800 + i * 2 + side);
    }
  }
}

/**
 * His desk, from behind and to one side.
 *
 * The clutter is the characterisation: a monitor he is not looking at, a
 * keyboard, a mug, a stack of leads on paper, and a partition wall a foot
 * behind his head. Nobody has put anything of their own on it.
 */
function desk(g: CanvasRenderingContext2D, b: Box, seed: number, p: Pencil) {
  const mid = pencil(p, MID);
  const near = pencil(p, NEAR);
  const far = pencil(p, FAR);
  const deskY = b.y + b.h * 0.74;

  wash(g, rect(b), p, seed + 500, 0.1);

  // The partition behind, with its top lip: it is what makes this a cubicle
  // rather than a table in a room.
  const wallY = b.y + b.h * 0.16;
  line(g, [b.x, wallY], [b.x + b.w, wallY * 1.02], far, seed + 60);
  line(g, [b.x, wallY + b.h * 0.04], [b.x + b.w, wallY + b.h * 0.045], far, seed + 61);
  hatch(g, [
    [b.x, wallY + b.h * 0.045], [b.x + b.w, wallY + b.h * 0.05],
    [b.x + b.w, deskY], [b.x, deskY],
  ], pencil(p, { press: 0.13, size: 1.05, passes: 1 }), seed + 62, Math.PI / 2.6, 6, 0.5);

  // The desk itself: a front edge and a near-side return.
  line(g, [b.x, deskY], [b.x + b.w, deskY - b.h * 0.012], near, seed);
  line(g, [b.x, deskY + b.h * 0.035], [b.x + b.w, deskY + b.h * 0.02], mid, seed + 1);

  // Monitor, three-quarters on, and the glow off it.
  const mx = b.x + b.w * 0.2;
  const mw = b.w * 0.28;
  const mh = b.h * 0.3;
  mark(g, [
    [mx, deskY - mh], [mx + mw, deskY - mh * 1.08],
    [mx + mw, deskY - mh * 0.12], [mx, deskY - mh * 0.06], [mx, deskY - mh],
  ], mid, seed + 2, { flat: true });
  hatch(g, [
    [mx + mw * 0.06, deskY - mh * 0.96], [mx + mw * 0.94, deskY - mh * 1.02],
    [mx + mw * 0.94, deskY - mh * 0.2], [mx + mw * 0.06, deskY - mh * 0.16],
  ], pencil(p, { press: 0.18, size: 1, passes: 1 }), seed + 3, Math.PI / 2, 2.4, 0.7);
  // Stand.
  line(g, [mx + mw * 0.5, deskY - mh * 0.1], [mx + mw * 0.5, deskY - b.h * 0.01], mid, seed + 4);

  // Keyboard, foreshortened to a shallow parallelogram.
  const kx = mx - b.w * 0.02;
  const ky = deskY - b.h * 0.02;
  mark(g, [
    [kx, ky], [kx + mw * 0.98, ky - b.h * 0.012],
    [kx + mw * 1.08, ky + b.h * 0.038], [kx + mw * 0.08, ky + b.h * 0.05], [kx, ky],
  ], mid, seed + 5, { flat: true });
  for (let i = 1; i < 4; i++) {
    const t = i / 4;
    line(g, [kx + mw * (0.04 + t * 0.98), ky - b.h * 0.012 * t + b.h * 0.012],
      [kx + mw * (0.06 + t * 1.0), ky + b.h * 0.042], far, seed + 6 + i);
  }

  // A mug, and paper under it. Nothing of his own anywhere on the desk.
  const gx = b.x + b.w * 0.56;
  mark(g, [
    [gx, deskY - b.h * 0.085], [gx + b.w * 0.055, deskY - b.h * 0.085],
    [gx + b.w * 0.048, deskY - b.h * 0.005], [gx + b.w * 0.007, deskY - b.h * 0.005],
  ], mid, seed + 12, { flat: false });
  mark(g, smooth([
    [gx + b.w * 0.055, deskY - b.h * 0.075],
    [gx + b.w * 0.085, deskY - b.h * 0.055],
    [gx + b.w * 0.052, deskY - b.h * 0.03],
  ], 7), mid, seed + 13);
  mark(g, circle(gx + b.w * 0.028, deskY - b.h * 0.085, b.w * 0.028, 16), far, seed + 14, { flat: true });

  const px = b.x + b.w * 0.05;
  for (let i = 0; i < 3; i++) {
    mark(g, [
      [px + i * b.w * 0.004, deskY + b.h * 0.004 - i * b.h * 0.004],
      [px + b.w * 0.11, deskY - i * b.h * 0.004],
      [px + b.w * 0.1, deskY + b.h * 0.03 - i * b.h * 0.004],
      [px - b.w * 0.005 + i * b.w * 0.004, deskY + b.h * 0.032 - i * b.h * 0.004],
    ], far, seed + 20 + i, { flat: true });
  }

  const dFoot = deskY + b.h * 0.06;
  figure(g, GARETH, 'Deadpan', b.x + b.w * 0.78, dFoot, fits(b, dFoot, b.h * 0.86), 'sit', seed + 30, p);
}

/**
 * The handset, just put down.
 *
 * The panel is about the eleven seconds, so the object is drawn properly and
 * large and the rest of the panel is the silence around it — but "the rest of
 * the panel" still needs a desk under it and a wall behind it, or it is not
 * silence, it is blank paper.
 */
function phone(g: CanvasRenderingContext2D, b: Box, seed: number, p: Pencil) {
  const near = pencil(p, NEAR);
  const mid = pencil(p, MID);
  const far = pencil(p, FAR);
  const cx = b.x + b.w * 0.46;
  const deskY = b.y + b.h * 0.76;
  const w = b.w * 0.3;

  wash(g, rect(b), p, seed + 600, 0.1);
  line(g, [b.x, deskY], [b.x + b.w, deskY - b.h * 0.01], mid, seed + 40);
  hatch(g, [
    [b.x, deskY], [b.x + b.w, deskY - b.h * 0.01],
    [b.x + b.w, b.y + b.h], [b.x, b.y + b.h],
  ], pencil(p, { press: 0.16, size: 1.1, passes: 1 }), seed + 41, -Math.PI / 3, 5, 0.6);

  // The base: a wedge, higher at the back.
  const baseY = deskY - b.h * 0.03;
  mark(g, [
    [cx - w, baseY], [cx + w, baseY],
    [cx + w * 0.86, baseY - b.h * 0.16], [cx - w * 0.86, baseY - b.h * 0.16], [cx - w, baseY],
  ], near, seed, { flat: true });
  // Keypad, three rows, which is what makes it a phone and not a box.
  for (let row = 0; row < 3; row++) {
    const y = baseY - b.h * 0.035 - row * b.h * 0.034;
    for (let col = 0; col < 3; col++) {
      const x = cx - w * 0.44 + col * w * 0.44;
      mark(g, [
        [x - w * 0.12, y], [x + w * 0.12, y],
        [x + w * 0.12, y - b.h * 0.02], [x - w * 0.12, y - b.h * 0.02], [x - w * 0.12, y],
      ], far, seed + 2 + row * 3 + col, { flat: true });
    }
  }
  // The handset lying in its cradle across the top.
  const hy = baseY - b.h * 0.17;
  mark(g, smooth([
    [cx - w * 1.02, hy + b.h * 0.02], [cx - w * 0.96, hy - b.h * 0.05],
    [cx - w * 0.5, hy - b.h * 0.075], [cx + w * 0.5, hy - b.h * 0.075],
    [cx + w * 0.96, hy - b.h * 0.05], [cx + w * 1.02, hy + b.h * 0.02],
    [cx + w * 0.78, hy + b.h * 0.028], [cx + w * 0.72, hy - b.h * 0.022],
    [cx - w * 0.72, hy - b.h * 0.022], [cx - w * 0.78, hy + b.h * 0.028],
    [cx - w * 1.02, hy + b.h * 0.02],
  ], 9), near, seed + 20);

  // The coiled cord, which is the only thing in the panel with any movement in
  // it, and it has stopped.
  const coil: Pt[] = [];
  for (let i = 0; i <= 40; i++) {
    const t = i / 40;
    coil.push([
      cx + w * 1.0 + Math.sin(t * Math.PI * 5) * b.w * 0.035 + t * b.w * 0.14,
      hy + b.h * 0.03 + t * b.h * 0.2 + Math.cos(t * Math.PI * 5) * b.h * 0.012,
    ]);
  }
  mark(g, coil, mid, seed + 30);
}

const circle = (cx: number, cy: number, r: number, n = 40): Pt[] =>
  Array.from({ length: n + 1 }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r] as Pt;
  });

/**
 * The wall clock, at one minute to.
 *
 * Drawn as an object on a wall rather than a diagram: a case with a rim, a
 * shadow under it, real hands for the time given, and the wall hatched around
 * it so the panel is a place and not a clipart.
 */
function clock(g: CanvasRenderingContext2D, b: Box, seed: number, p: Pencil, time: string) {
  const cx = b.x + b.w * 0.5;
  const cy = b.y + b.h * 0.48;
  const R = Math.min(b.w * 0.42, b.h * 0.36);
  const near = pencil(p, NEAR);
  const mid = pencil(p, MID);
  const far = pencil(p, FAR);

  wash(g, rect(b), p, seed + 700, 0.12);

  // The case and its rim, plus a cast shadow so it sits off the wall.
  mark(g, circle(cx, cy, R), near, seed, { flat: true });
  mark(g, circle(cx, cy, R * 0.9), far, seed + 1, { flat: true });
  hatch(g, circle(cx + R * 0.1, cy + R * 0.12, R * 1.02, 30),
    pencil(p, { press: 0.12, size: 1.1, passes: 1 }), seed + 2, Math.PI / 3, 4, 0.5);
  mark(g, circle(cx, cy, R * 0.96), mid, seed + 3, { flat: true });

  // Ticks: long on the quarters, which is what a glance reads.
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const inner = i % 3 === 0 ? 0.68 : 0.78;
    line(g,
      [cx + Math.cos(a) * R * inner, cy + Math.sin(a) * R * inner],
      [cx + Math.cos(a) * R * 0.86, cy + Math.sin(a) * R * 0.86],
      i % 3 === 0 ? near : mid, seed + 10 + i);
  }

  const [hh = '17', mm = '59'] = time.split(':');
  const minutes = Number(mm);
  // The hour hand is not on the hour — at 17:59 it is all but touching six,
  // and a clock with the hour hand parked on the numeral is a clock nobody has
  // ever looked at properly.
  const hAng = (((Number(hh) % 12) + minutes / 60) / 12) * Math.PI * 2 - Math.PI / 2;
  const mAng = (minutes / 60) * Math.PI * 2 - Math.PI / 2;
  const hand = (ang: number, len: number, wide: number, sd: number) => {
    const tipX = cx + Math.cos(ang) * R * len;
    const tipY = cy + Math.sin(ang) * R * len;
    const nx = -Math.sin(ang) * R * wide;
    const ny = Math.cos(ang) * R * wide;
    mark(g, [
      [cx + nx, cy + ny], [tipX, tipY], [cx - nx, cy - ny], [cx + nx, cy + ny],
    ], near, sd, { flat: true });
  };
  hand(hAng, 0.46, 0.05, seed + 30);
  hand(mAng, 0.76, 0.035, seed + 31);
  mark(g, circle(cx, cy, R * 0.055, 14), near, seed + 32, { flat: true });
}

function shopfront(g: CanvasRenderingContext2D, b: Box, seed: number, p: Pencil) {
  const mid = pencil(p, MID);
  const groundY = b.y + b.h * 0.82;
  const roofY = b.y + b.h * 0.3;
  line(g, [b.x, groundY], [b.x + b.w, groundY], pencil(p, NEAR), seed);
  mark(g, [
    [b.x + b.w * 0.08, groundY], [b.x + b.w * 0.08, roofY],
    [b.x + b.w * 0.92, roofY], [b.x + b.w * 0.92, groundY],
  ], mid, seed + 1, { flat: true });
  // The sign band, lit, and the glass under it.
  const signY = roofY + b.h * 0.1;
  line(g, [b.x + b.w * 0.08, signY], [b.x + b.w * 0.92, signY], mid, seed + 2);
  hatch(g, [
    [b.x + b.w * 0.1, roofY + b.h * 0.01], [b.x + b.w * 0.9, roofY + b.h * 0.01],
    [b.x + b.w * 0.9, signY - b.h * 0.01], [b.x + b.w * 0.1, signY - b.h * 0.01],
  ], pencil(p, { press: 0.18, size: 1 }), seed + 3, Math.PI / 2, 2.2, 0.8);
  for (let i = 1; i < 5; i++) {
    const x = b.x + b.w * (0.08 + (0.84 * i) / 5);
    line(g, [x, signY], [x, groundY], pencil(p, FAR), seed + 10 + i);
  }
  // Trolleys, which is the detail that names it.
  for (let i = 0; i < 3; i++) {
    const x = b.x + b.w * (0.16 + i * 0.055);
    mark(g, [[x, groundY - b.h * 0.1], [x + b.w * 0.05, groundY - b.h * 0.12],
      [x + b.w * 0.05, groundY - b.h * 0.02], [x, groundY]], pencil(p, FAR), seed + 20 + i, { flat: true });
  }
}

function aisle(g: CanvasRenderingContext2D, b: Box, seed: number, p: Pencil, withHim = true) {
  const vpX = b.x + b.w * 0.5;
  const vpY = b.y + b.h * 0.46;
  const far = pencil(p, FAR);
  const mid = pencil(p, MID);
  const r = rng(seed);

  for (const side of [-1, 1] as const) {
    const near = vpX + side * b.w * 0.56;
    const top = b.y + b.h * 0.02;
    const bot = b.y + b.h;
    line(g, [near, top], [vpX + side * b.w * 0.06, vpY - b.h * 0.1], mid, seed + side);
    line(g, [near, bot], [vpX + side * b.w * 0.06, vpY + b.h * 0.14], mid, seed + 2 + side);
    // Shelf runs: five courses, converging, with boxes as ticks.
    for (let sh = 1; sh <= 5; sh++) {
      const t = sh / 6;
      const yN = top + (bot - top) * t;
      const yF = (vpY - b.h * 0.1) + (b.h * 0.24) * t;
      line(g, [near, yN], [vpX + side * b.w * 0.06, yF], far, seed + 10 + sh * 2 + side);
      for (let k = 0; k < 7; k++) {
        const u = 0.06 + k * 0.13;
        const x = near + (vpX + side * b.w * 0.06 - near) * u;
        const y = yN + (yF - yN) * u;
        const drop = (bot - top) / 6 * (1 - u) * 0.62;
        if (r() > 0.25) line(g, [x, y], [x, y - drop], far, seed + 200 + sh * 20 + k);
      }
    }
  }
  if (withHim) {
    const aFoot = b.y + b.h * 0.99;
    figure(g, GARETH, 'Tired', vpX - b.w * 0.16, aFoot, fits(b, aFoot, b.h * 0.72), 'basket', seed + 300, p);
  }
}

function till(g: CanvasRenderingContext2D, b: Box, seed: number, p: Pencil, serving: boolean) {
  const mid = pencil(p, MID);
  const near = pencil(p, NEAR);
  const counterY = b.y + b.h * 0.74;

  // The counter, running across, and the belt on it.
  line(g, [b.x, counterY], [b.x + b.w, counterY], near, seed);
  line(g, [b.x, counterY + b.h * 0.1], [b.x + b.w, counterY + b.h * 0.1], mid, seed + 1);
  for (let i = 0; i < 9; i++) {
    const x = b.x + b.w * (0.04 + i * 0.11);
    line(g, [x, counterY + b.h * 0.015], [x - b.w * 0.012, counterY + b.h * 0.09], pencil(p, FAR), seed + 5 + i);
  }
  // A few items on the belt: bread, milk, two tins.
  const items: [number, number, number][] = [[0.1, 0.07, 0.05], [0.2, 0.05, 0.08], [0.28, 0.035, 0.035], [0.34, 0.035, 0.035]];
  for (const [ix, iw, ih] of items) {
    const x = b.x + b.w * ix;
    const y = counterY;
    mark(g, [[x, y], [x + b.w * iw, y], [x + b.w * iw, y - b.h * ih], [x, y - b.h * ih], [x, y]],
      mid, seed + 30 + ix * 100, { flat: true });
  }
  // The screen on its post.
  const sx = b.x + b.w * 0.56;
  line(g, [sx, counterY], [sx, counterY - b.h * 0.2], mid, seed + 50);
  mark(g, [[sx - b.w * 0.04, counterY - b.h * 0.2], [sx + b.w * 0.06, counterY - b.h * 0.22],
    [sx + b.w * 0.06, counterY - b.h * 0.34], [sx - b.w * 0.04, counterY - b.h * 0.32]],
    mid, seed + 51, { flat: true });

  // Her, behind it. On shift, so the hair is up.
  const tFoot = counterY + b.h * 0.02;
  figure(g, ROSA_AT_WORK, serving ? 'Beaming' : 'Pleased',
    b.x + b.w * 0.72, tFoot, fits(b, tFoot, b.h * 0.92), 'counter', seed + 60, p);
  if (serving) {
    const gFoot = b.y + b.h;
    figure(g, GARETH, 'Distracted', b.x + b.w * 0.22, gFoot, fits(b, gFoot, b.h * 0.82), 'stand', seed + 90, p);
  }
}

function badge(g: CanvasRenderingContext2D, b: Box, seed: number, p: Pencil) {
  const near = pencil(p, NEAR);
  const cx = b.x + b.w * 0.5;
  const cy = b.y + b.h * 0.52;
  const w = Math.min(b.w * 0.46, b.h * 0.86);
  const h = w * 0.56;
  mark(g, [[cx - w / 2, cy - h / 2], [cx + w / 2, cy - h / 2],
    [cx + w / 2, cy + h / 2], [cx - w / 2, cy + h / 2], [cx - w / 2, cy - h / 2]],
    near, seed, { flat: true });
  // The pin.
  line(g, [cx - w * 0.3, cy - h * 0.5], [cx - w * 0.3, cy - h * 0.66], pencil(p, MID), seed + 1);
  // Lettering is drawn by the page, which owns the type. The badge only leaves
  // room for it: a rule under the name and the store's line beneath.
  line(g, [cx - w * 0.36, cy + h * 0.12], [cx + w * 0.36, cy + h * 0.12], pencil(p, FAR), seed + 2);
  g.save();
  g.fillStyle = INK;
  g.textAlign = 'center';
  g.textBaseline = 'alphabetic';
  g.font = `600 ${Math.round(h * 0.34)}px ui-sans-serif, "Helvetica Neue", Arial, sans-serif`;
  g.globalAlpha = 0.82;
  g.fillText('ROSA', cx, cy + h * 0.04);
  g.font = `400 ${Math.round(h * 0.15)}px ui-sans-serif, "Helvetica Neue", Arial, sans-serif`;
  g.globalAlpha = 0.5;
  g.fillText('HAPPY TO HELP', cx, cy + h * 0.34);
  g.globalAlpha = 1;
  g.restore();
}

function corridor(g: CanvasRenderingContext2D, b: Box, seed: number, p: Pencil) {
  const mid = pencil(p, MID);
  const far = pencil(p, FAR);
  const vpX = b.x + b.w * 0.42;
  const vpY = b.y + b.h * 0.44;
  // Two walls, a floor line, a fire door at the end.
  for (const side of [-1, 1] as const) {
    const x = vpX + side * b.w * 0.5;
    line(g, [x, b.y], [vpX + side * b.w * 0.1, vpY - b.h * 0.16], mid, seed + side);
    line(g, [x, b.y + b.h], [vpX + side * b.w * 0.1, vpY + b.h * 0.2], mid, seed + 2 + side);
  }
  mark(g, [[vpX - b.w * 0.1, vpY - b.h * 0.16], [vpX + b.w * 0.1, vpY - b.h * 0.16],
    [vpX + b.w * 0.1, vpY + b.h * 0.2], [vpX - b.w * 0.1, vpY + b.h * 0.2]],
    mid, seed + 10, { flat: true });
  line(g, [vpX + b.w * 0.05, vpY - b.h * 0.1], [vpX + b.w * 0.05, vpY + b.h * 0.14], far, seed + 11);
  // Her, in the middle of it, taking the badge off: hair still up, coat on.
  const cFoot = b.y + b.h * 0.99;
  figure(g, ROSA_AT_WORK, 'Wistful', b.x + b.w * 0.74, cFoot, fits(b, cFoot, b.h * 0.8), 'stand', seed + 20, p);
}

/**
 * The gap between the bottle bank and the wall.
 *
 * The one place in the issue either of them is a person, so it gets drawn
 * properly: brick with real coursing, a ground that is wet, a downpipe, a fire
 * door that is always shut, and the bank itself with a hole in the side of it.
 * The corners go dark, which is what makes a gap a gap rather than a wall with
 * things in front of it.
 */
function alley(
  g: CanvasRenderingContext2D, b: Box, seed: number, p: Pencil,
  who: 'none' | 'him' | 'both', lit: boolean, rain = false,
) {
  const mid = pencil(p, MID);
  const far = pencil(p, FAR);
  const near = pencil(p, NEAR);
  const r = rng(seed);
  const groundY = b.y + b.h * 0.86;
  const wallTop = b.y + b.h * 0.04;

  // The wall: brick courses that get heavier as they come down, with the
  // perpends broken so it is brick and not graph paper.
  const courses = Math.max(5, Math.round(b.h / 15));
  const ch = (groundY - wallTop) / courses;
  for (let i = 0; i < courses; i++) {
    const y = wallTop + ch * i;
    line(g, [b.x, y + (r() - 0.5) * 1.2], [b.x + b.w, y + (r() - 0.5) * 1.2],
      pencil(p, { press: 0.4 + (i / courses) * 0.22, size: 1.15, passes: 1, grade: 0.66 }), seed + i);
    // Perpends: sparse, and lighter than the courses. Drawn at the same weight
    // and the same spacing they read as graph paper, which is what brick looks
    // like when it is drawn by somebody who has not looked at brick.
    const n = Math.max(4, Math.round(b.w / 26));
    for (let k = 0; k < n; k++) {
      const x = b.x + b.w * ((k + (i % 2 ? 0.5 : 0)) / n);
      if (r() > 0.55) {
        line(g, [x, y + ch * 0.12], [x + (r() - 0.5) * 1.5, y + ch * 0.92],
          pencil(p, { press: 0.2, size: 1, passes: 1, grade: 0.5 }),
          seed + 100 + i * 9 + k);
      }
    }
  }
  // Grime up the bottom of the wall: the single mark that says outdoors.
  hatch(g, [
    [b.x, groundY - b.h * 0.22], [b.x + b.w, groundY - b.h * 0.26],
    [b.x + b.w, groundY], [b.x, groundY],
  ], pencil(p, { press: 0.26, size: 1.1, passes: 1 }), seed + 180, Math.PI / 2.2, 4.5, 0.55);

  // Downpipe, with its brackets.
  const pipeX = b.x + b.w * 0.1;
  const pipeW = Math.max(2.5, b.w * 0.018);
  line(g, [pipeX, b.y], [pipeX, groundY], near, seed + 40);
  line(g, [pipeX + pipeW, b.y], [pipeX + pipeW, groundY], mid, seed + 41);
  for (let i = 0; i < 3; i++) {
    const y = b.y + (groundY - b.y) * (0.22 + i * 0.3);
    line(g, [pipeX - pipeW * 0.8, y], [pipeX + pipeW * 1.8, y], mid, seed + 43 + i);
  }

  // The ground, and the wet on it.
  line(g, [b.x, groundY], [b.x + b.w, groundY], near, seed + 42);
  hatch(g, [
    [b.x, groundY], [b.x + b.w, groundY],
    [b.x + b.w, b.y + b.h], [b.x, b.y + b.h],
  ], pencil(p, { press: 0.32, size: 1.2, passes: 1 }), seed + 190, -Math.PI / 3.2, 4, 0.62);

  // A fire door, shut, with a push bar and a step.
  const dx = b.x + b.w * 0.22;
  const dw = b.w * 0.15;
  const dh = b.h * 0.52;
  mark(g, [[dx, groundY], [dx, groundY - dh], [dx + dw, groundY - dh], [dx + dw, groundY]],
    near, seed + 60, { flat: true });
  line(g, [dx + dw * 0.1, groundY - dh * 0.45], [dx + dw * 0.9, groundY - dh * 0.45], mid, seed + 61);
  hatch(g, [[dx, groundY], [dx, groundY - dh], [dx + dw, groundY - dh], [dx + dw, groundY]],
    pencil(p, { press: 0.3, size: 1.1, passes: 1 }), seed + 62, Math.PI / 2, 3.6, 0.6);

  // The bottle bank. It is the landmark, so it is the darkest thing standing up.
  const bx = b.x + b.w * 0.7;
  const bw = b.w * 0.24;
  const bh = b.h * 0.42;
  const bank: Pt[] = [
    [bx, groundY], [bx, groundY - bh],
    [bx + bw * 0.5, groundY - bh * 1.12], [bx + bw, groundY - bh * 1.02], [bx + bw, groundY],
  ];
  mark(g, [...bank, [bx, groundY]], near, seed + 50, { flat: true });
  hatch(g, bank, pencil(p, { press: 0.42, size: 1.15, passes: 1 }), seed + 52, -Math.PI / 3, 3, 0.75);
  // The hole, and the lip over it.
  mark(g, circle(bx + bw * 0.3, groundY - bh * 0.76, bw * 0.13, 18), near, seed + 51, { flat: true });
  hatch(g, circle(bx + bw * 0.3, groundY - bh * 0.76, bw * 0.12, 18),
    pencil(p, { press: 0.8, size: 1.3, passes: 2 }), seed + 53, Math.PI / 4, 2, 0.9);
  line(g, [bx + bw * 0.06, groundY - bh * 0.96], [bx + bw * 0.94, groundY - bh * 0.96], mid, seed + 54);

  // Rubbish, in the corner it always ends up in.
  for (let i = 0; i < 5; i++) {
    const lx = b.x + b.w * (0.46 + r() * 0.2);
    const ly = groundY + b.h * (0.02 + r() * 0.07);
    mark(g, smooth([
      [lx, ly], [lx + b.w * 0.02, ly - b.h * 0.012], [lx + b.w * 0.04, ly],
    ], 6), far, seed + 220 + i);
  }

  // Dark in the top corners: the gap is a gap because it does not go anywhere.
  for (const side of [0, 1]) {
    hatch(g, [
      [b.x + b.w * side, b.y], [b.x + b.w * (side ? 0.78 : 0.22), b.y],
      [b.x + b.w * (side ? 0.94 : 0.06), b.y + b.h * 0.3], [b.x + b.w * side, b.y + b.h * 0.34],
    ], pencil(p, { press: 0.3, size: 1.15, passes: 1 }), seed + 240 + side, Math.PI / 3, 4, 0.6);
  }

  if (lit) {
    // One lamp above the door, and the pool it throws. Drawn as the *absence*
    // of the grime hatch would be better and is not available, so it is drawn
    // as a light wash that stops where the light stops.
    hatch(g, [
      [dx - b.w * 0.05, groundY - b.h * 0.6], [dx + b.w * 0.22, groundY - b.h * 0.6],
      [dx + b.w * 0.34, groundY + b.h * 0.1], [dx - b.w * 0.16, groundY + b.h * 0.1],
    ], pencil(p, { press: 0.16, size: 1, passes: 1 }), seed + 70, Math.PI / 2, 3.2, 0.5);
  }
  if (rain) {
    for (let i = 0; i < Math.round(b.w / 8); i++) {
      const x = b.x + r() * b.w;
      const y = b.y + r() * (groundY - b.y);
      line(g, [x, y], [x - b.w * 0.014, y + b.h * 0.08],
        pencil(p, { press: 0.3, size: 1, passes: 1 }), seed + 300 + i);
    }
  }

  if (who === 'him' || who === 'both') {
    figure(g, GARETH, 'Tired', b.x + b.w * 0.4, groundY, fits(b, groundY, b.h * 0.68), 'smoke', seed + 400, p);
  }
  if (who === 'both') {
    figure(g, ROSA, 'Small smile', b.x + b.w * 0.57, groundY, fits(b, groundY, b.h * 0.64), 'lean', seed + 500, p);
  }
}

function hands(g: CanvasRenderingContext2D, b: Box, seed: number, p: Pencil) {
  const near = pencil(p, NEAR);
  const cx = b.x + b.w * 0.5;
  const cy = b.y + b.h * 0.56;
  const s = Math.min(b.w, b.h) * 0.3;
  // Two hands round a flame, which is the only warm thing in the issue.
  for (const side of [-1, 1] as const) {
    mark(g, smooth([
      [cx + side * s * 1.5, cy + s * 0.8],
      [cx + side * s * 0.95, cy + s * 0.1],
      [cx + side * s * 0.5, cy - s * 0.5],
      [cx + side * s * 0.16, cy - s * 0.2],
    ], 9), near, seed + side);
    for (let i = 1; i <= 3; i++) {
      mark(g, smooth([
        [cx + side * s * (1.15 - i * 0.16), cy + s * (0.5 - i * 0.1)],
        [cx + side * s * (0.7 - i * 0.14), cy - s * (0.1 + i * 0.12)],
      ], 6), pencil(p, MID), seed + 10 + i * (side > 0 ? 1 : -1));
    }
  }
  mark(g, smooth([
    [cx, cy - s * 0.18], [cx - s * 0.12, cy - s * 0.55], [cx, cy - s * 0.95],
    [cx + s * 0.12, cy - s * 0.55], [cx, cy - s * 0.18],
  ], 9), pencil(p, { press: 0.6, size: 1.4, passes: 2 }), seed + 30, { flat: true });
  smoke(g, cx, cy - s * 1.0, s * 1.6, seed + 40, p);
}

function closeUp(
  g: CanvasRenderingContext2D, b: Box, seed: number, p: Pencil,
  who: 'him' | 'her', expr: string, smoking = false,
) {
  const c: Character = who === 'him' ? GARETH : ROSA;
  // A close-up is a head *and some room*. At three tenths the crown and the
  // chin both touched the border and there was nowhere for a balloon to go —
  // but on a panel the full width of the page the height is what binds, and at
  // a quarter of it the head sat small in an acre of blank paper. So the
  // height term is the one that was raised.
  const R = Math.min(b.w * 0.23, b.h * 0.32);
  const cx = b.x + b.w * 0.4;
  const cy = b.y + b.h * 0.44;
  // Shoulders, so the head is not floating in the panel.
  const shoulderY = cy + R * 2.3;
  mark(g, smooth([
    [b.x, b.y + b.h], [cx - R * 1.6, shoulderY + R * 0.4], [cx - R * 0.6, shoulderY - R * 0.2],
  ], 8), pencil(p, NEAR), seed + 1);
  mark(g, smooth([
    [cx + R * 0.6, shoulderY - R * 0.2], [cx + R * 1.6, shoulderY + R * 0.4], [b.x + b.w * 0.86, b.y + b.h],
  ], 8), pencil(p, NEAR), seed + 2);
  const face = FACES.find((f) => f.name === expr) ?? FACES[0]!;
  drawHead(g, face, c, cx, cy, R, seed + 5, { bare: true, noNeck: false });
  if (smoking) {
    const mx = cx + R * 0.62;
    const my = cy + R * 0.95;
    mark(g, [[mx, my], [mx + R * 0.7, my - R * 0.18]], pencil(p, { press: 0.8, size: 1.5, passes: 2 }), seed + 30);
    smoke(g, mx + R * 0.7, my - R * 0.2, R * 2.4, seed + 31, p);
  }
}

/** Draw one shot into one panel box. */
export function drawShot(g: CanvasRenderingContext2D, shot: Shot, b: Box, seed: number) {
  const p = pencil(HB, { wobble: 0.7 });
  g.save();
  g.beginPath();
  g.rect(b.x, b.y, b.w, b.h);
  g.clip();
  g.fillStyle = INK;

  switch (shot.kind) {
    case 'floor': floor(g, b, seed, p); break;
    case 'desk': desk(g, b, seed, p); break;
    case 'phone': phone(g, b, seed, p); break;
    case 'clock': clock(g, b, seed, p, shot.time); break;
    case 'shopfront': shopfront(g, b, seed, p); break;
    case 'aisle': aisle(g, b, seed, p); break;
    case 'till': till(g, b, seed, p, shot.serving); break;
    case 'badge': badge(g, b, seed, p); break;
    case 'corridor': corridor(g, b, seed, p); break;
    case 'alley': alley(g, b, seed, p, shot.who, shot.lit, shot.rain); break;
    case 'hands': hands(g, b, seed, p); break;
    case 'close': closeUp(g, b, seed, p, shot.who, shot.expr.name, shot.smoke); break;
    case 'black': {
      g.globalAlpha = 0.9;
      g.fillRect(b.x, b.y, b.w, b.h);
      g.globalAlpha = 1;
      break;
    }
  }
  g.restore();
}

export { paper, rect };
export type { Pencil };
