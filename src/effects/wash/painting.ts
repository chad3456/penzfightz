import { PALETTES, PAPERS, PIGMENT_BY_ID, type Palette } from './pigment';
import { POSES, type Pose, type Tag } from './pose';
import { extent, figureStages, perchMark, skeleton, type Look, type Stage } from './figure';
import type { Load } from './brush';
import type { WashSettings } from './solver';

/**
 * One painting: which body, which two tubes, how much water, how the board was
 * propped, and where the accidents were allowed to happen.
 *
 * ### Every painting is a different pose
 *
 * Seventy poses are authored by hand, and then every painting jitters them.
 * That is not padding. A pose written down is a *position*, and a position
 * repeated a hundred times reads as a hundred copies of one drawing however
 * much the colour changes — the eye locks onto the silhouette and nothing else
 * registers. Six degrees on each bone, a little on the spine, and two paintings
 * from the same entry are two people doing the same thing rather than the same
 * person twice. The jitter is small on purpose: enough to break the repeat,
 * never enough to break the gesture the pose was written for.
 *
 * ### The accidents are part of the recipe
 *
 * Wetness, the tilt of the board and where the backruns land are chosen per
 * painting and then handed to the solver, which is free to do what it likes
 * with them. So two paintings with identical recipes bar the seed diverge in
 * the way two attempts at the same watercolour diverge: same intention, and the
 * water went elsewhere.
 */

export interface Painting {
  seed: number;
  pose: Pose;
  palette: Palette;
  paper: number;
  build: number;
  flip: boolean;
  /** How loaded the brush was. High is a wash that runs off the figure. */
  wetness: number;
  /** Which way the board was propped. */
  tilt: [number, number];
  grain: number;
  drops: [number, number, number][];
  dropAt: number;
  billow: number;
  /** Figure height as a fraction of the sheet. */
  fill: number;
  /** Where the figure's middle sits on the sheet. */
  cx: number;
  cy: number;
  weight: number;
  name: string;
  note: string;
  key: string;
}

const rnd = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const pick = <T,>(list: T[], r: () => number) => list[Math.floor(r() * list.length) % list.length];

/** Six degrees a bone. Enough to break the repeat, not enough to break the pose. */
function jitter(p: Pose, r: () => number): Pose {
  const d = (v: number, by: number) => v + (r() - 0.5) * by;
  const pair = ([a, b]: [number, number], by: number): [number, number] => [d(a, by), d(b, by)];
  return {
    ...p,
    bend: d(p.bend, 0.1),
    lean: d(p.lean, 7),
    armL: pair(p.armL, 13),
    armR: pair(p.armR, 13),
    legL: pair(p.legL, 9),
    legR: pair(p.legR, 9),
    head: d(p.head, 10),
    stand: Math.max(0.06, d(p.stand, 0.05)),
    flow: Math.max(0, Math.min(1, d(p.flow, 0.14))),
    flowAt: d(p.flowAt, 16),
  };
}

const WEATHER = [
  'wet in wet, and left alone',
  'a backrun let in while it set',
  'the board propped, so it ran',
  'laid on a soaked sheet',
  'brush half dry by the end',
  'flooded, then hardly touched',
  'two washes, the second through the first',
  'lifted back with clean water',
];

export function makePainting(seed: number, only?: Tag): Painting {
  const r = rnd(seed);
  const pool = only ? POSES.filter((p) => p.tag === only) : POSES;
  const base = pick(pool, r);
  const pose = jitter(base, r);
  const palette = pick(PALETTES, r);
  const wetness = 0.55 + r() * 0.75;
  const flip = r() < 0.5;
  const drops: [number, number, number][] = [];
  const nDrops = r() < 0.55 ? 1 + Math.floor(r() * 2) : 0;
  for (let i = 0; i < nDrops; i++) {
    drops.push([0.28 + r() * 0.44, 0.34 + r() * 0.52, 0.1 + r() * 0.2]);
  }
  const weather = WEATHER[Math.floor(r() * WEATHER.length) % WEATHER.length];

  return {
    seed,
    pose,
    palette,
    paper: Math.floor(r() * PAPERS.length) % PAPERS.length,
    build: r(),
    flip,
    wetness,
    tilt: [(r() - 0.5) * 0.5, 0.1 + r() * 0.7],
    grain: 0.3 + r() * 0.6,
    drops,
    dropAt: 0.3 + r() * 0.3,
    billow: r(),
    fill: 0.64 + r() * 0.14,
    cx: 0.4 + r() * 0.2,
    cy: 0.42 + r() * 0.08,
    weight: 0.95 + r() * 0.35,
    name: base.name,
    note: `${palette.name} — ${weather}.`,
    // Distinctness is judged on what you would notice from across a room: who
    // she is, what she is painted in, which way she faces, how wet it went on.
    key: `${base.id}|${palette.id}|${flip ? 'l' : 'r'}|${Math.round(wetness * 2)}`,
  };
}

/** Distinct paintings, by rejection on the recipe rather than on the pixels. */
export function paintings(count: number, seed: number, only?: Tag): Painting[] {
  const out: Painting[] = [];
  const seen = new Set<string>();
  let s = seed >>> 0;
  let tries = 0;
  while (out.length < count && tries < count * 60) {
    tries++;
    s = (s + 0x9e3779b9) >>> 0;
    const p = makePainting(s, only);
    if (seen.has(p.key)) continue;
    seen.add(p.key);
    out.push(p);
  }
  // Once the space is exhausted the remainder is filled anyway: a gallery that
  // silently returns four hundred cards when it was asked for a thousand is a
  // worse answer than one with some cousins in it.
  while (out.length < count) {
    s = (s + 0x9e3779b9) >>> 0;
    out.push(makePainting(s, only));
  }
  return out;
}

export function washSettings(rec: Painting, steps: number): WashSettings {
  return {
    cool: PIGMENT_BY_ID[rec.palette.cool],
    warm: PIGMENT_BY_ID[rec.palette.warm],
    white: PAPERS[rec.paper],
    wetness: rec.wetness,
    tilt: rec.tilt,
    grain: rec.grain,
    steps,
    drops: rec.drops,
    dropAt: rec.dropAt,
  };
}

/**
 * Fit the figure to the sheet.
 *
 * Measured on the *bones*, not on the finished painting, and then given a good
 * deal less of the page than it could have. The cloth, the loose field around
 * the body and every accident the water has are all outside this box, and they
 * need somewhere to go — a figure fitted to its margins comes out with the
 * whole picture jammed against the edges, which is the one composition none of
 * the references has.
 */
/** Props that reach well past the hand, and so past the figure's own box. */
const REACHY = new Set(['umbrella', 'guitar', 'scarf', 'flowers', 'basket']);

export function lookFor(rec: Painting, aspect: number): Look {
  const k = skeleton(rec.pose, rec.build);
  const ext = extent(k);
  // Fitted on *both* axes, and the width is the one that catches you out. A
  // woman lying flat is four times as wide as she is tall, so fitting on height
  // alone scaled her up until the head filled the sheet and the legs were off
  // the side of it — which is what the first pass did, and it looks less like a
  // bug than like a very confident close-up.
  // The bones are not the drawing.
  //
  // A skeleton fitted exactly to the frame still overflows it, because every
  // bone is painted as a limb with a *width* — half a thigh either side of the
  // outermost joint, plus a head that is a disc round its own point. Fitting
  // the joints alone let the wide poses run off both edges while the maths
  // insisted they fitted, which is the most confusing kind of wrong. So the box
  // is grown by the fattest half-limb before anything is divided by it.
  // A held thing sticks out further than she does. An umbrella is a foot above
  // the hand that holds it and got its canopy sliced off by the top of the
  // frame every time — which is a shame, because the umbrella is the entire
  // reason that picture reads as *out in the rain*.
  const pad = 0.085 + (rec.pose.prop && REACHY.has(rec.pose.prop) ? 0.1 : 0);
  const byHeight = rec.fill / Math.max(0.2, (ext.h + pad * 2) * aspect);
  const byWidth = (rec.fill * 1.02) / Math.max(0.2, ext.w + pad * 2);
  const scale = Math.min(byHeight, byWidth);
  const bias = rec.palette.bias;
  return {
    cool: rec.weight * (1 - bias) * 0.78,
    warm: rec.weight * bias * 0.78,
    seed: rec.seed,
    scale,
    aspect,
    at: [
      rec.cx - ((ext.l + ext.r) / 2) * scale * (rec.flip ? -1 : 1),
      rec.cy - ((ext.t + ext.b) / 2) * scale * aspect,
    ],
    flip: rec.flip,
    billow: rec.billow,
  };
}

export function stagesFor(rec: Painting, aspect: number): Stage[] {
  const look = lookFor(rec, aspect);
  const k = skeleton(rec.pose, rec.build);
  const ext = extent(k);
  const footY = look.at[1] + ext.b * look.scale * aspect;
  const stages = figureStages(rec.pose, look);
  const first = stages[0];
  return [
    {
      ...first,
      draw: (load: Load) => {
        perchMark(load, rec.pose, look, footY);
        first.draw(load);
      },
    },
    ...stages.slice(1),
  ];
}
