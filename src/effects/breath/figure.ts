import { inkStroke, layPaper, type Hand, type Pt, type Stroke } from './brush';

/**
 * A hundred women, each drawn in one breath.
 *
 * The economy is the whole subject. A drawing like this is four or five marks
 * and a great deal of untouched paper, and the reason it works is that the
 * **silhouette is almost never the face**. A head turned towards you shows its
 * hair and its shoulder in outline; the face itself is interior, and it is
 * three small marks — a nostril, a mouth, a closed lid. Put the profile on the
 * silhouette as well and you have drawn two people.
 *
 * So each attitude decides two things: what the one long contour encloses, and
 * where inside it the face sits. Everything else is which of the small marks
 * the hand bothered with before it lifted.
 */

export const ASPECT = 0.8;

export type Attitude = 'recline' | 'profile' | 'turned' | 'thrown' | 'arms' | 'bust';

export interface Marks {
  eye: boolean;
  brow: boolean;
  ear: boolean;
  /** Loose strands laid over the hair mass. */
  locks: number;
  /** The surface she is lying on, or the edge of the frame she leans past. */
  ground: boolean;
}

export interface Look {
  id: number;
  seed: number;
  attitude: Attitude;
  hand: Hand;
  flip: boolean;
  marks: Marks;
  /** Head size and placement, as multipliers on the attitude's default. */
  scale: number;
  drift: Pt;
  title: string;
}

// --------------------------------------------------------------------- palette

/**
 * All warm, and all close together. The reference is one colour of ink and the
 * set should read as one sitting with one jar, not as a paint chart.
 */
const INKS: [string, string][] = [
  ['#e2551f', '#f6a47c'],
  ['#d9481c', '#f0996f'],
  ['#e86c2a', '#f7b184'],
  ['#c93f22', '#ea9070'],
  ['#ef7a35', '#f9bb92'],
  ['#b83a2b', '#dd8a74'],
];

const PAPERS = ['#f4f0e2', '#f2ede0', '#f6f2e8', '#f0ebdc'];

const TITLES = [
  'Still asleep', 'Turning over', 'Half a face', 'The long neck', 'Looking away',
  'Chin up', 'On her arm', 'The bare shoulder', 'Almost awake', 'Not listening',
  'The far side', 'One eye closed', 'Lying down', 'A shoulder rising', 'Hair down',
  'Thinking of nothing', 'The near cheek', 'Head back', 'Folded', 'Waiting',
  'Late morning', 'A quiet mouth', 'Facing the wall', 'Between two thoughts', 'The nape',
];

// ------------------------------------------------------------------ the marks

/**
 * A little frame for the face, so the interior marks can be authored once in
 * face units and then dropped wherever an attitude wants the face to be.
 *
 * The `y` conversion is the fiddly part: card space is normalised to 0–1 on
 * both axes and the card is taller than it is wide, so a unit of `y` is longer
 * on the page than a unit of `x`. Anything meant to be round has to be scaled
 * by the aspect on the way in or every face on the card is stretched.
 */
function frame(at: Pt, size: number, tilt: number) {
  const c = Math.cos(tilt);
  const s = Math.sin(tilt);
  return (dx: number, dy: number): Pt => [
    at[0] + (dx * c - dy * s) * size,
    at[1] + (dx * s + dy * c) * size * ASPECT,
  ];
}

type F = (dx: number, dy: number) => Pt;

/** The near nostril and the far one: two curls, and the second much smaller. */
function nose(f: F, w: number): Stroke[] {
  return [
    { pts: [f(-0.10, -0.34), f(0.02, -0.08), f(-0.02, 0.06), f(-0.16, 0.08)], weight: w * 0.5, swell: [[0.62, 0.5]], taper: [0.24, 0.3] },
    { pts: [f(0.20, -0.18), f(0.27, 0.0), f(0.19, 0.09)], weight: w * 0.38, swell: [[0.5, 0.3]], taper: [0.3, 0.34] },
  ];
}

/**
 * A mouth is one wandering line with a knot at one corner.
 *
 * Two symmetrical lips read as a diagram. What a brush actually leaves is a
 * single travelling mark that hesitates at one end, and the hesitation is the
 * corner of the mouth.
 */
function mouth(f: F, w: number): Stroke[] {
  return [
    {
      pts: [f(-0.72, 0.33), f(-0.42, 0.27), f(-0.14, 0.36), f(0.10, 0.28), f(0.32, 0.37), f(0.43, 0.48), f(0.31, 0.54)],
      weight: w * 0.52,
      swell: [[0.2, 0.3], [0.72, 0.75]],
      taper: [0.2, 0.24],
    },
  ];
}

const eye = (f: F, w: number): Stroke => ({
  pts: [f(-0.50, -0.34), f(-0.28, -0.44), f(-0.06, -0.36)],
  weight: w * 0.4,
  swell: [[0.5, 0.45]],
  taper: [0.3, 0.34],
});

const brow = (f: F, w: number): Stroke => ({
  pts: [f(-0.62, -0.66), f(-0.30, -0.78), f(0.02, -0.68)],
  weight: w * 0.34,
  swell: [[0.42, 0.35]],
  taper: [0.28, 0.4],
});

const ear = (f: F, w: number): Stroke => ({
  pts: [f(-0.92, -0.16), f(-1.04, 0.02), f(-0.96, 0.2), f(-0.84, 0.16)],
  weight: w * 0.36,
  taper: [0.3, 0.34],
});

// -------------------------------------------------------------- the attitudes

/** Jitter, so no two of the hundred sit on exactly the same gesture. */
type R = () => number;
const j = (r: R, k: number) => (r() - 0.5) * k;

/**
 * Lying down, face turned up towards the viewer.
 *
 * One contour carries the whole figure: it comes in off the left edge, over the
 * hair, dips at the neck, climbs to the point of the shoulder and falls away
 * down the arm. The face is nowhere near it.
 */
function recline(v: Look, r: R): Stroke[] {
  const crown = 0.325 + j(r, 0.05);
  const neck = 0.66 + j(r, 0.06);
  const peak = 0.238 + j(r, 0.05);
  const sh = 0.80 + j(r, 0.06);
  const ground = 0.635 + j(r, 0.05);
  const out: Stroke[] = [
    {
      pts: [
        [-0.06, 0.60 + j(r, 0.06)], [0.06, 0.50], [0.13, 0.38], [0.23, crown], [0.37, crown - 0.01],
        [0.45, crown + 0.02], [0.51, crown + 0.005], [0.61, crown + 0.03],
        [neck, crown - 0.005], [sh - 0.075, peak + 0.03], [sh - 0.02, peak], [sh + 0.05, peak + 0.018], [sh + 0.11, peak + 0.075],
        [0.95, 0.44], [1.06, 0.63],
      ],
      weight: 0.046,
      swell: [[0.26, 0.55], [0.6, 0.4], [0.72, 0.72]],
      taper: [0.1, 0.18],
    },
  ];
  if (v.marks.ground) {
    out.push({
      pts: [[-0.05, 0.545 + j(r, 0.03)], [0.10, 0.60], [0.34, ground], [0.60, ground + 0.01], [0.82, ground], [1.06, ground - 0.015]],
      weight: 0.03,
      swell: [[0.42, 0.4]],
      taper: [0.07, 0.09],
    });
  }
  const f = frame([0.42 + j(r, 0.04), 0.47 + j(r, 0.03)], 0.27 * v.scale, -0.18 + j(r, 0.3));
  out.push(...nose(f, 0.05), ...mouth(f, 0.05));
  // The reference gets a whole face out of a nostril and a mouth. A closed lid
  // is worth having now and then; a brow as well and the paper starts to fill.
  if (v.marks.eye) out.push(eye(f, 0.05));
  else if (v.marks.brow) out.push(brow(f, 0.05));
  for (let i = 0; i < v.marks.locks; i++) {
    const x = 0.12 + r() * 0.34;
    out.push({
      pts: [[x, crown + 0.03], [x + 0.03, crown + 0.10], [x - 0.01, crown + 0.17]],
      weight: 0.02,
      taper: [0.3, 0.36],
    });
  }
  return out;
}

/**
 * True profile, upright.
 *
 * The one attitude where the contour *is* the face, so the whole drawing lives
 * or dies on the chain of landmarks between the brow and the chin — brow, the
 * dip at the bridge, the tip, the notch under the nose, the two lips, the
 * crease, the chin. Round any one of those off and it becomes a mannequin.
 */
/**
 * Nape, up the back of the skull, over the crown, down the face, under the
 * chin, away down the throat. One head unit is the crown-to-chin height; in
 * profile a head is very nearly as deep as it is tall, so the same unit does
 * for both axes.
 *
 * The lips are the part that goes wrong. Their relief is a fraction of the
 * nose's, and given swings of the same size as the nose's the chain prints as
 * a zigzag rather than a face.
 */
const HEAD: [number, number][] = [
  [-0.62, 1.44], [-0.42, 1.14], [-0.28, 0.94], [-0.42, 0.68], [-0.45, 0.4],
  [-0.3, 0.12], [-0.06, 0.0], [0.2, 0.06], [0.34, 0.19], [0.38, 0.31],
  [0.35, 0.39], [0.52, 0.52], [0.36, 0.565], [0.415, 0.6], [0.385, 0.635],
  [0.405, 0.665], [0.355, 0.705], [0.4, 0.77], [0.3, 0.83], [0.14, 0.9],
  [-0.02, 1.02], [-0.08, 1.3], [-0.04, 1.62], [0.0, 1.9],
];

/**
 * Turn the head about a point, in head units, before it is placed on the card.
 *
 * Returns the transform rather than the transformed chain, because anything
 * else that belongs to the head — where the eye goes, where the hair leaves
 * the skull — has to make the same journey. Rotate the outline alone and the
 * features stay behind, floating in the corner of the card.
 */
function spin(angle: number, ax: number, ay: number) {
  const c = Math.cos(angle);
  const sn = Math.sin(angle);
  return (x: number, y: number): [number, number] => {
    const dx = x - ax;
    const dy = y - ay;
    return [ax + dx * c - dy * sn, ay + dx * sn + dy * c];
  };
}

function profile(v: Look, r: R): Stroke[] {
  const s = 0.42 * v.scale;
  const cx = 0.42 + j(r, 0.04);
  const cy = 0.15 + j(r, 0.03);
  const p = (dx: number, dy: number): Pt => [cx + dx * s, cy + dy * s * ASPECT];
  const out: Stroke[] = [
    {
      pts: HEAD.map(([x, y]) => p(x, y)),
      weight: 0.042,
      swell: [[0.12, 0.5], [0.34, 0.35], [0.63, 0.45], [0.88, 0.4]],
      taper: [0.09, 0.16],
    },
  ];
  if (v.marks.ground) {
    out.push({
      pts: [p(-0.7, 1.5), p(-0.2, 1.66), p(0.5, 1.8), p(1.3, 1.96), p(2.0, 2.14)],
      weight: 0.036,
      swell: [[0.4, 0.45]],
      taper: [0.1, 0.12],
    });
  }
  const f = frame([cx + 0.12 * s, cy + 0.34 * s * ASPECT], 0.3 * s, 1.35);
  if (v.marks.eye) out.push(eye(f, 0.045));
  if (v.marks.brow) out.push(brow(f, 0.045));
  if (v.marks.ear) out.push(ear(f, 0.045));
  for (let i = 0; i < v.marks.locks; i++) {
    out.push({
      // Well behind the hairline. Started at the crown, a strand crosses the
      // forehead and reads as a scar.
      pts: [p(-0.34 - r() * 0.2, 0.1 + r() * 0.16), p(-0.58, 0.5 + r() * 0.3), p(-0.46, 1.06 + r() * 0.24)],
      weight: 0.018,
      taper: [0.3, 0.34],
    });
  }
  return out;
}

/**
 * Seen from behind, over the shoulder. No face at all — the mass of the hair,
 * the shoulders it falls onto, and the hairline at the nape, which in this
 * idiom is plenty.
 *
 * The nape is the whole drawing. Without it the outline is a bell.
 */
function turned(v: Look, r: R): Stroke[] {
  const s = 0.4 * v.scale;
  const cx = 0.48 + j(r, 0.05);
  const cy = 0.2 + j(r, 0.04);
  const p = (dx: number, dy: number): Pt => [cx + dx * s, cy + dy * s * ASPECT];
  const nape = 1.14 + j(r, 0.12);
  const out: Stroke[] = [
    {
      pts: [
        p(-1.85, 2.0), p(-1.42, 1.62), p(-1.02, 1.44), p(-0.74, 1.3), p(-0.67, 0.9),
        p(-0.57, 0.42), p(-0.36, 0.09), p(0.0, -0.04), p(0.36, 0.09), p(0.57, 0.42),
        p(0.67, 0.9), p(0.74, 1.3), p(1.02, 1.44), p(1.42, 1.62), p(1.85, 2.0),
      ],
      weight: 0.05,
      swell: [[0.2, 0.4], [0.5, 0.55], [0.8, 0.4]],
      taper: [0.1, 0.12],
    },
    {
      // The hairline. Wide, shallow, and low down the mass — put it high and
      // small and it reads as a face peering out of the back of her head.
      pts: [p(-0.6, nape - 0.1), p(-0.22, nape + 0.06), p(0.18, nape + 0.05), p(0.56, nape - 0.12)],
      weight: 0.028,
      swell: [[0.5, 0.45]],
      taper: [0.24, 0.28],
    },
  ];
  for (let i = 0; i < Math.max(2, v.marks.locks + 1); i++) {
    const a2 = -0.42 + (i / 3) * 0.9 + j(r, 0.18);
    out.push({
      pts: [p(a2, 0.16 + r() * 0.2), p(a2 * 1.5, 0.6), p(a2 * 1.3, 1.0 + r() * 0.24)],
      weight: 0.018,
      swell: [[0.5, 0.3]],
      taper: [0.3, 0.36],
    });
  }
  if (v.marks.ground) {
    out.push({ pts: [p(-1.2, 1.66), p(-0.4, 1.8), p(0.5, 1.82), p(1.3, 1.72)], weight: 0.022, taper: [0.24, 0.28] });
  }
  return out;
}

/**
 * Head thrown back.
 *
 * Authored from scratch this came out as a mountain range: a throat and a mass
 * of hair at much the same height, and nothing saying which was which. It is
 * the profile chain tipped back about the throat instead — the landmarks are
 * already right, and rotating them keeps the chin the highest thing on the
 * card, which is the only reading that says the head has gone back.
 */
function thrown(v: Look, r: R): Stroke[] {
  const s = 0.36 * v.scale;
  const back = -0.72 + j(r, 0.16);
  const T = spin(back, 0.0, 1.5);
  const chain = HEAD.map(([x, y]) => T(x, y));
  // Rotating about the throat swings the head a long way sideways, so where
  // the figure lands depends on how far back it went. Centre on what the
  // rotation actually produced rather than on where it started.
  const xs = chain.map((c) => c[0]);
  const ys = chain.map((c) => c[1]);
  const midx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const midy = (Math.min(...ys) + Math.max(...ys)) / 2;
  const cx = 0.44 + j(r, 0.05);
  const cy = 0.42 + j(r, 0.04);
  const p = (dx: number, dy: number): Pt => [cx + (dx - midx) * s, cy + (dy - midy) * s * ASPECT];
  const out: Stroke[] = [
    {
      pts: chain.map(([x, y]) => p(x, y)),
      weight: 0.044,
      swell: [[0.12, 0.5], [0.36, 0.35], [0.64, 0.5], [0.88, 0.42]],
      taper: [0.09, 0.14],
    },
    {
      // The chest, carrying on from where the throat ran out.
      pts: [p(chain[23][0], chain[23][1]), p(chain[23][0] + 0.5, chain[23][1] + 0.5), p(chain[23][0] + 1.3, chain[23][1] + 1.0)],
      weight: 0.036,
      swell: [[0.4, 0.4]],
      taper: [0.1, 0.14],
    },
  ];
  // Hair, falling away from the back of the skull now that it is uppermost.
  // Three strands of the same length in the same direction is a rake; they
  // have to leave from different places and curl by different amounts.
  for (let i = 0; i < 2 + v.marks.locks; i++) {
    const from = T(-0.44 + i * 0.16 + j(r, 0.1), 0.5 + i * 0.28);
    const drop = 0.7 + r() * 0.7;
    const sway = 0.3 + r() * 0.45;
    out.push({
      pts: [
        p(from[0], from[1]),
        p(from[0] - sway * 0.5, from[1] + drop * 0.34),
        p(from[0] - sway * 1.25, from[1] + drop * 0.74),
        p(from[0] - sway * 1.1, from[1] + drop * 1.2),
      ],
      weight: 0.022,
      swell: [[0.35, 0.4]],
      taper: [0.2, 0.32],
    });
  }
  const anchor = T(0.28, 0.34);
  const f = frame([p(anchor[0], anchor[1])[0], p(anchor[0], anchor[1])[1]], 0.3 * s, 1.35 + back);
  if (v.marks.eye) out.push(eye(f, 0.045));
  if (v.marks.brow) out.push(brow(f, 0.045));
  return out;
}

/**
 * Head down on folded arms.
 *
 * The one attitude where two marks have to touch, and the one that fails most
 * easily: a mound sitting on a line is a hill. What makes it a head is the far
 * side coming down past the cheek and tucking *in* at the jaw before it meets
 * the arm, and a face low enough to be resting on something.
 */
function arms(v: Look, r: R): Stroke[] {
  const s = 0.44 * v.scale;
  const cx = 0.46 + j(r, 0.05);
  const cy = 0.26 + j(r, 0.04);
  const p = (dx: number, dy: number): Pt => [cx + dx * s, cy + dy * s * ASPECT];
  const arm = 1.06 + j(r, 0.06);
  const out: Stroke[] = [
    {
      pts: [
        p(-1.45, arm + 0.02), p(-1.05, 0.66), p(-0.74, 0.27), p(-0.32, 0.03), p(0.16, 0.0),
        p(0.5, 0.2), p(0.63, 0.55), p(0.52, 0.83), p(0.3, 0.99), p(0.06, arm),
      ],
      weight: 0.048,
      swell: [[0.24, 0.55], [0.56, 0.45], [0.84, 0.3]],
      taper: [0.12, 0.24],
    },
    {
      pts: [p(-1.95, arm + 0.08), p(-0.9, arm), p(0.3, arm + 0.03), p(1.4, arm + 0.13), p(2.15, arm + 0.26)],
      weight: 0.044,
      swell: [[0.3, 0.45], [0.74, 0.5]],
      taper: [0.07, 0.1],
    },
  ];
  if (v.marks.ground) {
    out.push({
      pts: [p(-1.95, arm + 0.5), p(-0.7, arm + 0.44), p(0.7, arm + 0.54), p(2.05, arm + 0.7)],
      weight: 0.03,
      swell: [[0.5, 0.35]],
      taper: [0.07, 0.1],
    });
  }
  // Face turned down towards the arm, so the marks turn with it.
  const f = frame([p(0.26, 0.64)[0], p(0.26, 0.64)[1]], 0.4 * s, 1.05);
  out.push(...nose(f, 0.045));
  if (v.marks.eye) out.push(eye(f, 0.045));
  if (r() < 0.5) out.push(...mouth(f, 0.045));
  for (let i = 0; i < v.marks.locks; i++) {
    out.push({
      pts: [p(-0.5 - r() * 0.3, 0.16 + r() * 0.2), p(-1.05, 0.6 + r() * 0.24), p(-1.15, arm - 0.06)],
      weight: 0.02,
      swell: [[0.4, 0.3]],
      taper: [0.3, 0.34],
    });
  }
  return out;
}

/**
 * Head and both shoulders, facing out.
 *
 * Needs a jaw and a neck or the silhouette swells straight from crown to
 * shoulder and prints a bell. Two narrowings and one widening, in that order.
 */
function bust(v: Look, r: R): Stroke[] {
  const s = 0.4 * v.scale;
  const cx = 0.48 + j(r, 0.04);
  const cy = 0.17 + j(r, 0.03);
  const p = (dx: number, dy: number): Pt => [cx + dx * s, cy + dy * s * ASPECT];
  const out: Stroke[] = [
    {
      pts: [
        p(-1.7, 2.02), p(-1.34, 1.6), p(-0.94, 1.34), p(-0.4, 1.24), p(-0.28, 1.02),
        p(-0.44, 0.82), p(-0.52, 0.48), p(-0.42, 0.18), p(-0.16, 0.0), p(0.16, 0.0),
        p(0.42, 0.18), p(0.52, 0.48), p(0.44, 0.82), p(0.28, 1.02), p(0.4, 1.24),
        p(0.94, 1.34), p(1.34, 1.6), p(1.7, 2.02),
      ],
      weight: 0.046,
      swell: [[0.2, 0.4], [0.5, 0.45], [0.8, 0.4]],
      taper: [0.1, 0.12],
    },
  ];
  const f = frame([cx - 0.04 * s, cy + 0.56 * s * ASPECT], 0.45 * s, j(r, 0.24));
  out.push(...nose(f, 0.045), ...mouth(f, 0.045));
  if (v.marks.eye) {
    out.push(eye(f, 0.045));
    out.push({ pts: [f(0.34, -0.4), f(0.54, -0.48), f(0.72, -0.4)], weight: 0.045 * 0.36, swell: [[0.5, 0.4]], taper: [0.3, 0.34] });
  }
  if (v.marks.brow) out.push(brow(f, 0.045));
  for (let i = 0; i < v.marks.locks; i++) {
    const a2 = i % 2 ? 0.5 : -0.5;
    out.push({ pts: [p(a2, 0.14), p(a2 * 1.5, 0.66), p(a2 * 1.3, 1.16 + r() * 0.2)], weight: 0.018, taper: [0.3, 0.34] });
  }
  return out;
}

const BUILD: Record<Attitude, (v: Look, r: R) => Stroke[]> = {
  recline,
  profile,
  turned,
  thrown,
  arms,
  bust,
};

export const ATTITUDES: Attitude[] = ['recline', 'profile', 'turned', 'thrown', 'arms', 'bust'];

// ------------------------------------------------------------------- the set

function rng(seed: number) {
  let a = (seed ^ 0x9e3779b9) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = <T,>(list: readonly T[], r: R) => list[Math.floor(r() * list.length)];

export function looks(count: number, seed = 3): Look[] {
  // Six attitudes taken strictly in turn come out as diagonal stripes on any
  // grid whose width is not a multiple of six. Shuffled within each block of
  // six they stay balanced — about seventeen of each — without the pattern.
  const order: Attitude[] = [];
  for (let b = 0; b * ATTITUDES.length < count; b++) {
    const block = ATTITUDES.slice();
    const rb = rng(seed * 104729 + b * 7919);
    for (let k = block.length - 1; k > 0; k--) {
      const m = Math.floor(rb() * (k + 1));
      [block[k], block[m]] = [block[m], block[k]];
    }
    order.push(...block);
  }

  const out: Look[] = [];
  for (let i = 0; i < count; i++) {
    const r = rng(seed * 7919 + i * 104729);
    const [ink, wash] = pick(INKS, r);
    const attitude = order[i];
    out.push({
      id: i,
      seed: seed * 31 + i * 7717,
      attitude,
      flip: r() < 0.45,
      scale: 0.82 + r() * 0.42,
      drift: [(r() - 0.5) * 0.05, (r() - 0.5) * 0.05],
      marks: {
        eye: r() < 0.62,
        brow: r() < 0.34,
        ear: r() < 0.3,
        locks: r() < 0.42 ? 1 + Math.floor(r() * 2) : 0,
        ground: r() < 0.55,
      },
      hand: {
        ink,
        wash,
        paper: pick(PAPERS, r),
        weight: 0.82 + r() * 0.5,
        wobble: 0.06 + r() * 0.1,
        wet: 0.6 + r() * 0.6,
        dry: 0.2 + r() * 0.4,
      },
      title: TITLES[(i * 7) % TITLES.length],
    });
  }
  return out;
}

export function drawBreath(g: CanvasRenderingContext2D, v: Look, w: number, h: number): void {
  const r = rng(v.seed);
  layPaper(g, v.hand, w, h, r);
  g.save();
  if (v.flip) {
    g.translate(w, 0);
    g.scale(-1, 1);
  }
  g.translate(v.drift[0] * w, v.drift[1] * h);
  for (const k of BUILD[v.attitude](v, r)) inkStroke(g, k, v.hand, w, h, r);
  g.restore();

  // The plate number, where a signature would go. Not a signature.
  g.save();
  g.globalAlpha = 0.5;
  g.fillStyle = v.hand.ink;
  g.font = `${Math.max(6, w * 0.022)}px ui-monospace, monospace`;
  g.textAlign = 'right';
  g.fillText(String(v.id + 1).padStart(3, '0'), w * 0.94, h * 0.955);
  g.restore();
}
