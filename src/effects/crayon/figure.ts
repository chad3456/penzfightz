import { Sheet, hexToRgb, mulberry, PAPERS, type Rgb } from './sheet';
import { drag, inEllipse, inPoly, scrub, type Nib, type Pt } from './nib';
import { drawHead, makeRecipe, type Recipe } from './face';
import { POSES, TAGS, type Pose, type Prop, type Tag } from './pose';

/**
 * A whole person, in two crayons.
 *
 * The heads are a grammar of parts; a figure is not, and treating it as one is
 * the mistake that produces a mannequin. What makes a drawn figure read as
 * *doing something* is the **line of action** — the single arc that runs from
 * the head, through the body, to whichever foot is carrying the weight. Every
 * pose here is built around that curve first and hung with limbs afterwards,
 * which is why a figure with its arms in exactly the right places can still look
 * like a shop dummy if the spine is straight.
 *
 * Three other things the drawing depends on, none of them obvious until they
 * are missing:
 *
 * **Nothing is composed down a chain.** Bone directions are absolute, so the
 * skeleton is one pass of `cos/sin` per bone and a pose can be read off the
 * page. See `pose.ts` for why that matters for authoring.
 *
 * **The figure is dropped onto the ground, not placed.** Every joint is worked
 * out first, then the whole thing is translated so its lowest point lands on the
 * ground line. A crouch, a dive and a stand therefore all sit correctly without
 * a word of inverse kinematics, and adjusting a knee never puts a foot through
 * the floor.
 *
 * **A ground mark is not decoration.** Without a dash of shadow under the feet a
 * figure floats, however good the pose is. It is the cheapest mark on the page
 * and it does more than any of the others.
 */

const BLACK = '#141414';

// ------------------------------------------------------------------ skeleton

/** Proportions, in figure units. A standing figure is about 2 units tall. */
const BONE = {
  spine: 0.46,
  neck: 0.08,
  /**
   * A seventh of the figure's height, not a fifth.
   *
   * The first pass had a head half again this size and every pose came out as a
   * bobblehead on a wire. Head size is the proportion that decides whether a
   * drawing reads as an adult, a child or a cartoon, and it does it before any
   * of the marks are looked at — but go much under this and the face grammar
   * has six marks to put inside twenty pixels and they turn to mush.
   */
  headR: 0.124,
  shoulder: 0.215,
  upperArm: 0.28,
  foreArm: 0.26,
  hand: 0.05,
  /**
   * Wide enough that two legs read as two legs.
   *
   * At 0.135 a standing pose put them near enough vertical and near enough
   * together that the taper closed the gap, and the figure came out wearing a
   * tube.
   */
  hip: 0.16,
  thigh: 0.37,
  shin: 0.35,
  foot: 0.14,
};

const rad = (deg: number) => (deg * Math.PI) / 180;
const step = (p: Pt, deg: number, len: number): Pt => [
  p[0] + Math.cos(rad(deg)) * len,
  p[1] + Math.sin(rad(deg)) * len,
];

export interface Skeleton {
  pelvis: Pt;
  /** Three points: pelvis, the bow of the spine, the chest. The line of action. */
  spine: [Pt, Pt, Pt];
  neck: Pt;
  head: Pt;
  shoulder: [Pt, Pt];
  elbow: [Pt, Pt];
  hand: [Pt, Pt];
  hip: [Pt, Pt];
  knee: [Pt, Pt];
  foot: [Pt, Pt];
  toe: [Pt, Pt];
}

/** Build the skeleton for a pose, in figure units with the pelvis at the origin. */
export function skeleton(p: Pose, build: number): Skeleton {
  // Build stretches the whole frame: a child is short-limbed and big-headed.
  const s = 0.88 + build * 0.24;
  const headR = BONE.headR * (1.14 - build * 0.22);
  const pelvis: Pt = [0, 0];

  const lean = rad(p.lean);
  const spineLen = BONE.spine * s * p.stand;
  const chest: Pt = [Math.sin(lean) * spineLen, -Math.cos(lean) * spineLen];
  // The bow of the spine, perpendicular to it. This is the line of action.
  const mid: Pt = [
    chest[0] / 2 + Math.cos(lean) * p.bend * spineLen,
    chest[1] / 2 + Math.sin(lean) * p.bend * spineLen,
  ];
  const neck: Pt = [
    chest[0] + Math.sin(lean) * BONE.neck * s,
    chest[1] - Math.cos(lean) * BONE.neck * s,
  ];
  const head: Pt = [
    neck[0] + Math.sin(lean + rad(p.head) * 0.5) * headR,
    neck[1] - Math.cos(lean + rad(p.head) * 0.5) * headR,
  ];

  const across = lean + Math.PI / 2;
  const shoulder: [Pt, Pt] = [
    [
      chest[0] - Math.cos(across) * BONE.shoulder * s,
      chest[1] - Math.sin(across) * BONE.shoulder * s,
    ],
    [
      chest[0] + Math.cos(across) * BONE.shoulder * s,
      chest[1] + Math.sin(across) * BONE.shoulder * s,
    ],
  ];
  const elbow: [Pt, Pt] = [
    step(shoulder[0], p.armL[0], BONE.upperArm * s),
    step(shoulder[1], p.armR[0], BONE.upperArm * s),
  ];
  const hand: [Pt, Pt] = [
    step(elbow[0], p.armL[1], BONE.foreArm * s),
    step(elbow[1], p.armR[1], BONE.foreArm * s),
  ];

  const hip: [Pt, Pt] = [
    [-BONE.hip * s, 0],
    [BONE.hip * s, 0],
  ];
  const knee: [Pt, Pt] = [
    step(hip[0], p.legL[0], BONE.thigh * s),
    step(hip[1], p.legR[0], BONE.thigh * s),
  ];
  const foot: [Pt, Pt] = [
    step(knee[0], p.legL[1], BONE.shin * s),
    step(knee[1], p.legR[1], BONE.shin * s),
  ];
  // Feet point the way the shin leans, roughly flat.
  const toe: [Pt, Pt] = [
    step(foot[0], p.legL[1] - 78, BONE.foot * s),
    step(foot[1], p.legR[1] - 78, BONE.foot * s),
  ];

  return {
    pelvis,
    spine: [pelvis, mid, chest],
    neck,
    head,
    shoulder,
    elbow,
    hand,
    hip,
    knee,
    foot,
    toe,
  };
}

// ------------------------------------------------------------------- recipes

export const DRESS = 6;
export const GROUND = 4;
export const BUILDS = 4;

export interface FigureRecipe {
  seed: number;
  pose: Pose;
  /** The face, drawn by the same grammar the heads gallery uses. */
  face: Recipe;
  accent: string;
  paper: number;
  build: number;
  dress: number;
  ground: number;
  /** Handedness: mirrors the whole figure. */
  flip: boolean;
  key: string;
}

export function makeFigure(seed: number, only?: Tag): FigureRecipe {
  const r = mulberry(seed);
  const pool = only ? POSES.filter((p) => p.tag === only) : POSES;
  const pose = pool[Math.floor(r() * pool.length)];
  const face = makeRecipe(seed ^ 0x5bd1);
  const build = Math.floor(r() * BUILDS);
  const dress = Math.floor(r() * DRESS);
  // Weighted: a plain dash reads best, and the coloured shadow is worth
  // more than a one-in-four share of the wall.
  const ground = [1, 1, 2, 3, 3, 0][Math.floor(r() * 6)];
  const flip = r() < 0.45;
  return {
    seed,
    pose,
    face,
    accent: face.accent,
    paper: Math.floor(r() * PAPERS),
    build,
    dress,
    ground,
    flip,
    key: `${pose.id}-${build}-${dress}-${ground}-${flip ? 1 : 0}-${face.pick.crown}-${face.accent}`,
  };
}

/**
 * A gallery of distinct figures.
 *
 * The same rejection sampler the heads use, on a signature that includes the
 * pose. Fifty-six poses times four builds times six kinds of dress times four
 * grounds times a mirror times eight crowns times seventeen accents is a space
 * of a few million, which is roomy enough that a couple of thousand distinct
 * draws come out of it quickly — but not so roomy that duplicates are
 * impossible, which is exactly the case where people assume they are.
 */
export function figures(count: number, seed = 1, only?: Tag): FigureRecipe[] {
  const out: FigureRecipe[] = [];
  const seen = new Set<string>();
  let s = seed >>> 0;
  let tries = 0;
  while (out.length < count && tries < count * 300) {
    tries++;
    s = (Math.imul(s, 1103515245) + 12345) >>> 0;
    const f = makeFigure(s, only);
    if (seen.has(f.key)) continue;
    seen.add(f.key);
    out.push(f);
  }
  return out;
}

// ---------------------------------------------------------------- the drawing

interface Body {
  sheet: Sheet;
  r: () => number;
  /** Figure units to pixels. */
  u: number;
  ox: number;
  oy: number;
  mirror: number;
  spin: number;
  ink: Rgb;
  col: Rgb;
  rec: FigureRecipe;
  n: number;
}

/** Figure units to page pixels, with the mirror and any whole-figure spin. */
function toPage(b: Body, [x, y]: Pt): Pt {
  const mx = x * b.mirror;
  const c = Math.cos(b.spin);
  const s = Math.sin(b.spin);
  return [b.ox + (mx * c - y * s) * b.u, b.oy + (mx * s + y * c) * b.u];
}

const path = (b: Body, pts: Pt[]): Pt[] => pts.map((p) => toPage(b, p));

function nib(b: Body, colour: Rgb, width: number, o: Partial<Nib> = {}): Nib {
  return {
    colour,
    width: width * b.u,
    bite: o.bite ?? 0.94,
    hand: o.hand ?? 1,
    fray: o.fray ?? 0.26,
  };
}

const line = (b: Body, pts: Pt[], n: Nib) => drag(b.sheet, path(b, pts), n, b.n++);

/**
 * A limb: one stroke through the chain, wedge-shaped along its length.
 *
 * `from` is the width at the shoulder or hip, `to` at the wrist or ankle. This
 * is the difference between a limb and a piece of wire, and it is entirely a
 * silhouette problem — a constant-width stroke reads as an armature no matter
 * how good the grain on it is.
 *
 * The pressure envelope is turned right down here, because the *width* is doing
 * the tapering now. Leave both on and a limb fades out before it reaches the
 * hand.
 */
function limb(b: Body, chain: Pt[], from: number, to: number) {
  line(b, chain, {
    ...nib(b, b.ink, from, { fray: 0.2 }),
    hand: 0.35,
    taper: [1, to / from],
  });
}

function blob(b: Body, at: Pt, r: number, colour = b.ink, bite = 1.1) {
  const [x, y] = toPage(b, at);
  const rr = r * b.u;
  scrub(
    b.sheet,
    inEllipse(x, y, rr, rr * (0.85 + b.r() * 0.3), b.r() * 3, b.n),
    { x0: x - rr * 2, y0: y - rr * 2, x1: x + rr * 2, y1: y + rr * 2 },
    nib(b, colour, 0.012, { bite }),
    b.n++,
    { passes: 2 },
  );
}

// -------------------------------------------------------------------- clothes

/**
 * The torso, in one of six ways.
 *
 * Built from a body outline rather than from two straight lines between the
 * shoulder and the hip. A person is widest at the chest and narrowest at the
 * waist, and a shirt drawn as a shoulder-to-hip trapezium comes out as a sliver
 * with nothing in it — which is what the first pass did.
 */
function torso(b: Body, k: Skeleton) {
  const kind = b.rec.dress;
  const [, , chest] = k.spine;

  /** The outline of a trunk: shoulders, a pinch at the waist, then the hips. */
  const trunk = (spread: number, drop: number): Pt[] => {
    const waistL: Pt = [
      (k.shoulder[0][0] + k.hip[0][0]) / 2 - 0.02 * spread,
      (k.shoulder[0][1] + k.hip[0][1]) / 2,
    ];
    const waistR: Pt = [
      (k.shoulder[1][0] + k.hip[1][0]) / 2 + 0.02 * spread,
      (k.shoulder[1][1] + k.hip[1][1]) / 2,
    ];
    return [
      [k.shoulder[0][0] * spread, k.shoulder[0][1] - 0.02],
      [k.shoulder[1][0] * spread, k.shoulder[1][1] - 0.02],
      waistR,
      [k.hip[1][0] * 1.25 * spread, drop],
      [k.hip[0][0] * 1.25 * spread, drop],
      waistL,
    ];
  };

  const mass = (poly: Pt[], colour: Rgb, bite: number, passes = 3) => {
    const page = path(b, poly);
    const xs = page.map((q) => q[0]);
    const ys = page.map((q) => q[1]);
    scrub(
      b.sheet,
      inPoly(page),
      { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) },
      nib(b, colour, 0.014, { bite }),
      b.n++,
      { passes },
    );
  };

  if (kind === 0) {
    // Bare: the trunk drawn as an open contour, both sides, no top or bottom.
    const t = trunk(1.05, 0.06);
    line(b, [t[0], t[5], t[4]], nib(b, b.ink, 0.038, { fray: 0.3 }));
    line(b, [t[1], t[2], t[3]], nib(b, b.ink, 0.038, { fray: 0.3 }));
  } else if (kind === 1) {
    // A shirt, scrubbed in the accent. The one solid mass on the page.
    const t = trunk(1.16, 0.1);
    mass(t, b.col, 1.0);
    line(b, [...t, t[0]], nib(b, b.ink, 0.03));
  } else if (kind === 2) {
    // A jacket: sides, a lapel, and buttons down the front.
    const t = trunk(1.2, 0.12);
    line(b, [t[0], t[5], t[4]], nib(b, b.ink, 0.042, { fray: 0.26 }));
    line(b, [t[1], t[2], t[3]], nib(b, b.ink, 0.042, { fray: 0.26 }));
    line(b, [k.neck, [chest[0] * 0.55, chest[1] * 0.3]], nib(b, b.ink, 0.028));
    for (let i = 0; i < 3; i++) {
      const t2 = 0.32 + i * 0.2;
      blob(b, [chest[0] * (1 - t2) * 0.7, chest[1] * (1 - t2)], 0.022);
    }
  } else if (kind === 3) {
    // A kurta: the same sides, carried down past the hip.
    const t = trunk(1.14, 0.34);
    line(b, [t[0], t[5], t[4]], nib(b, b.ink, 0.038));
    line(b, [t[1], t[2], t[3]], nib(b, b.ink, 0.038));
    line(b, [t[4], t[3]], nib(b, b.ink, 0.03));
    line(b, [k.neck, [chest[0] * 0.65, chest[1] * 0.36]], nib(b, b.ink, 0.026));
  } else if (kind === 4) {
    // A vest: a narrow mass with the shoulders left bare either side of it.
    const t = trunk(0.72, 0.05);
    mass(t, b.col, 0.98, 2);
    line(b, [t[0], t[5], t[4]], nib(b, b.ink, 0.03));
    line(b, [t[1], t[2], t[3]], nib(b, b.ink, 0.03));
  } else {
    // A numbered shirt: the trunk, a hem, and one big figure across it.
    const t = trunk(1.18, 0.14);
    line(b, [t[0], t[5], t[4]], nib(b, b.ink, 0.042));
    line(b, [t[1], t[2], t[3]], nib(b, b.ink, 0.042));
    line(b, [t[4], t[3]], nib(b, b.ink, 0.032));
    const cy = chest[1] * 0.52;
    const cx = chest[0] * 0.5;
    line(
      b,
      [
        [cx - 0.07, cy - 0.11],
        [cx - 0.07, cy + 0.11],
      ],
      nib(b, b.col, 0.036, { bite: 1.05 }),
    );
    line(
      b,
      [
        [cx + 0.07, cy - 0.11],
        [cx + 0.02, cy + 0.11],
      ],
      nib(b, b.col, 0.036, { bite: 1.05 }),
    );
  }
}

// ---------------------------------------------------------------------- props

function prop(b: Body, kind: Prop, at: Pt, angleDeg: number) {
  if (kind === 'none') return;
  const a = angleDeg;
  const N = nib(b, b.ink, 0.038);
  const along = (len: number, off = 0) => step(at, a, len + off);

  switch (kind) {
    case 'bat': {
      // The blade is scrubbed, not outlined. Every path here goes through
      // Chaikin smoothing on its way to the paper, so a four-point quad came
      // out as a rounded loop floating next to the batsman.
      const grip = along(0.12);
      const tip = along(0.6);
      line(b, [at, grip], nib(b, b.ink, 0.03));
      const mid: Pt = [(grip[0] + tip[0]) / 2, (grip[1] + tip[1]) / 2];
      const [mx, my] = toPage(b, mid);
      const len = 0.25 * b.u;
      const wide = 0.075 * b.u;
      scrub(
        b.sheet,
        inEllipse(mx, my, len, wide, rad(a) * b.mirror + b.spin, b.n),
        { x0: mx - len * 2, y0: my - len * 2, x1: mx + len * 2, y1: my + len * 2 },
        nib(b, b.ink, 0.014, { bite: 1.18 }),
        b.n++,
        { passes: 3, angle: rad(a) },
      );
      break;
    }
    case 'ball':
      blob(b, along(0.05), 0.06, b.col, 1.1);
      break;
    case 'football': {
      // Not in the hand: on the ground, or in the air by the foot.
      break;
    }
    case 'racket': {
      const neck = along(0.18);
      line(b, [at, neck], nib(b, b.ink, 0.026));
      const head = along(0.36);
      const [hx, hy] = head;
      const rr = 0.14;
      const ring: Pt[] = [];
      for (let i = 0; i <= 18; i++) {
        const t = (i / 18) * Math.PI * 2;
        ring.push([hx + Math.cos(t) * rr * 0.78, hy + Math.sin(t) * rr]);
      }
      line(b, ring, nib(b, b.ink, 0.026));
      for (let i = -1; i <= 1; i++) {
        line(
          b,
          [
            [hx + i * 0.05, hy - rr * 0.85],
            [hx + i * 0.05, hy + rr * 0.85],
          ],
          nib(b, b.ink, 0.012, { hand: 0.5 }),
        );
      }
      break;
    }
    case 'shuttle': {
      prop(b, 'racket', at, a);
      blob(b, along(0.62), 0.045, b.col, 1.0);
      break;
    }
    case 'umbrella': {
      const top = along(0.4);
      line(b, [at, top], nib(b, b.ink, 0.024));
      const span = 0.36;
      const dome: Pt[] = [];
      for (let i = 0; i <= 12; i++) {
        const t = Math.PI + (i / 12) * Math.PI;
        dome.push([top[0] + Math.cos(t) * span, top[1] + Math.sin(t) * span * 0.5]);
      }
      line(b, dome, nib(b, b.col, 0.05, { bite: 1.0 }));
      break;
    }
    case 'bag': {
      const d = along(0.16);
      line(b, [at, d], nib(b, b.ink, 0.022));
      const w = 0.13;
      const hgt = 0.17;
      line(
        b,
        [
          [d[0] - w, d[1]],
          [d[0] + w, d[1]],
          [d[0] + w * 0.85, d[1] + hgt],
          [d[0] - w * 0.85, d[1] + hgt],
          [d[0] - w, d[1]],
        ],
        nib(b, b.ink, 0.032),
      );
      break;
    }
    case 'book': {
      const w = 0.17;
      const hgt = 0.13;
      line(
        b,
        [
          [at[0] - w, at[1] - hgt],
          [at[0] + w, at[1] - hgt * 0.8],
          [at[0] + w, at[1] + hgt],
          [at[0] - w, at[1] + hgt * 0.9],
          [at[0] - w, at[1] - hgt],
        ],
        N,
      );
      line(
        b,
        [
          [at[0], at[1] - hgt * 0.9],
          [at[0], at[1] + hgt * 0.95],
        ],
        nib(b, b.ink, 0.022),
      );
      break;
    }
    case 'phone':
      line(
        b,
        [
          [at[0] - 0.03, at[1] - 0.06],
          [at[0] + 0.03, at[1] + 0.06],
        ],
        nib(b, b.ink, 0.042),
      );
      break;
    case 'guitar': {
      const body: Pt = [at[0] + Math.cos(rad(a)) * 0.2, at[1] + Math.sin(rad(a)) * 0.2 + 0.06];
      const nk = along(-0.36);
      line(b, [at, nk], nib(b, b.ink, 0.03));
      const rr = 0.19;
      const shape: Pt[] = [];
      for (let i = 0; i <= 20; i++) {
        const t = (i / 20) * Math.PI * 2;
        const pinch = 1 - 0.34 * Math.abs(Math.cos(t));
        shape.push([body[0] + Math.cos(t) * rr * 0.72 * pinch, body[1] + Math.sin(t) * rr]);
      }
      line(b, shape, nib(b, b.col, 0.036, { bite: 1.0 }));
      break;
    }
    case 'pan': {
      const head = along(0.34);
      line(b, [at, head], nib(b, b.ink, 0.032));
      const rr = 0.15;
      scrub(
        b.sheet,
        inEllipse(...toPage(b, head), rr * b.u, rr * 0.42 * b.u, rad(a), b.n),
        { x0: toPage(b, head)[0] - rr * 2 * b.u, y0: toPage(b, head)[1] - rr * 2 * b.u,
          x1: toPage(b, head)[0] + rr * 2 * b.u, y1: toPage(b, head)[1] + rr * 2 * b.u },
        nib(b, b.ink, 0.014, { bite: 1.2 }),
        b.n++,
        { passes: 3 },
      );
      // The flame, which is the whole reason anybody draws a pan.
      const fl: Pt[] = [];
      for (let i = 0; i <= 18; i++) {
        const t = i / 18;
        fl.push([head[0] - 0.18 + Math.cos(t * 8) * 0.14, head[1] - 0.16 - t * 0.3]);
      }
      line(b, fl, nib(b, b.col, 0.036, { bite: 0.95, fray: 0.35 }));
      break;
    }
    case 'broom': {
      const tip = along(0.62);
      line(b, [at, tip], nib(b, b.ink, 0.03));
      for (let i = -2; i <= 2; i++) {
        line(b, [tip, step(tip, a + i * 13, 0.16)], nib(b, b.ink, 0.016, { fray: 0.5 }));
      }
      break;
    }
    case 'camera':
      line(
        b,
        [
          [at[0] - 0.1, at[1] - 0.07],
          [at[0] + 0.1, at[1] - 0.07],
          [at[0] + 0.1, at[1] + 0.07],
          [at[0] - 0.1, at[1] + 0.07],
          [at[0] - 0.1, at[1] - 0.07],
        ],
        N,
      );
      blob(b, at, 0.055, b.ink, 1.0);
      break;
    case 'flag': {
      const top = along(0.52);
      line(b, [at, top], nib(b, b.ink, 0.022));
      line(
        b,
        [top, step(top, a + 96, 0.2), step(top, a + 70, 0.28)],
        nib(b, b.col, 0.044, { bite: 1.0 }),
      );
      break;
    }
    case 'rope': {
      const swing: Pt[] = [];
      for (let i = 0; i <= 20; i++) {
        const t = i / 20;
        swing.push([at[0] + (t - 0.5) * 0.9, at[1] + Math.sin(t * Math.PI) * 0.5]);
      }
      line(b, swing, nib(b, b.ink, 0.018, { fray: 0.4 }));
      break;
    }
    case 'stick':
      line(b, [at, along(0.26)], nib(b, b.ink, 0.024));
      blob(b, along(0.3), 0.04, b.col, 1.0);
      break;
    case 'cup':
      line(
        b,
        [
          [at[0] - 0.055, at[1] - 0.05],
          [at[0] + 0.055, at[1] - 0.05],
          [at[0] + 0.04, at[1] + 0.05],
          [at[0] - 0.04, at[1] + 0.05],
          [at[0] - 0.055, at[1] - 0.05],
        ],
        nib(b, b.ink, 0.026),
      );
      break;
  }
}

/** What is on the ground, in the air, or on the head — anything not in a hand. */
function loose(b: Body, k: Skeleton, p: Pose) {
  if (p.id === 'carry') {
    // A bundle on the head. Without it the pose is somebody holding their arms
    // up for no reason at all.
    const on: Pt = [k.head[0], k.head[1] - 0.2];
    const [x, y] = toPage(b, on);
    scrub(
      b.sheet,
      inEllipse(x, y, 0.22 * b.u, 0.13 * b.u, 0, b.n),
      { x0: x - 0.5 * b.u, y0: y - 0.4 * b.u, x1: x + 0.5 * b.u, y1: y + 0.4 * b.u },
      nib(b, b.col, 0.016, { bite: 1.05 }),
      b.n++,
      { passes: 3 },
    );
    line(
      b,
      [
        [on[0] - 0.22, on[1] + 0.1],
        [on[0] + 0.22, on[1] + 0.09],
      ],
      nib(b, b.ink, 0.026),
    );
    return;
  }
  if (p.prop !== 'football') return;
  // A football sits by the striking foot, or hangs above a header.
  const at: Pt =
    p.id === 'header'
      ? [k.head[0] + 0.26, k.head[1] - 0.3]
      : [k.toe[0][0] + 0.24, k.toe[0][1] - 0.08];
  blob(b, at, 0.13, b.col, 1.05);
  const [x, y] = toPage(b, at);
  drag(
    b.sheet,
    [
      [x - 0.09 * b.u, y],
      [x + 0.09 * b.u, y],
    ],
    nib(b, b.ink, 0.008, { hand: 0.5 }),
    b.n++,
  );
}

/**
 * A flash of the accent, for the figures whose clothes are not already coloured.
 *
 * Four of the six kinds of dress are drawn in black, which left two thirds of
 * the wall as black figures with a small coloured smudge under them. The
 * reference is not shy with its one colour — it puts a whole blush on a cheek
 * and a whole flame over a pan — so every figure gets one bold accent mark
 * somewhere, and like the heads it is deliberately out of register.
 */
function flash(b: Body, k: Skeleton) {
  if (b.rec.dress === 1 || b.rec.dress === 4) return;
  const kind = b.rec.seed % 5;
  const [, , chest] = k.spine;
  const off = 0.03;

  if (kind === 0) {
    // A sash across the chest.
    line(
      b,
      [
        [k.shoulder[0][0] * 1.1 + off, k.shoulder[0][1]],
        [k.hip[1][0] * 1.2 + off, 0.04],
      ],
      nib(b, b.col, 0.05, { bite: 1.0, fray: 0.3 }),
    );
  } else if (kind === 1) {
    // A band round the head.
    line(
      b,
      [
        [k.head[0] - 0.2 + off, k.head[1] - 0.06],
        [k.head[0] + 0.2 + off, k.head[1] - 0.09],
      ],
      nib(b, b.col, 0.042, { bite: 1.05 }),
    );
  } else if (kind === 2) {
    // Cuffs, on both wrists.
    for (const hand of k.hand) blob(b, [hand[0] + off, hand[1]], 0.055, b.col, 1.0);
  } else if (kind === 3) {
    // A belt.
    line(
      b,
      [
        [k.hip[0][0] * 1.3 + off, 0.03],
        [k.hip[1][0] * 1.3 + off, 0.01],
      ],
      nib(b, b.col, 0.05, { bite: 1.05 }),
    );
  } else {
    // Boots.
    for (const toe of k.toe) blob(b, [toe[0] + off, toe[1] - 0.02], 0.07, b.col, 1.0);
    void chest;
  }
}

/** The mark the figure stands on. Without it, a figure floats. */
function ground(b: Body, k: Skeleton, at: number) {
  const kind = b.rec.ground;
  if (kind === 0) return;
  const lowest = Math.max(k.toe[0][1], k.toe[1][1], k.foot[0][1], k.foot[1][1]);
  const mid = (k.toe[0][0] + k.toe[1][0]) / 2;
  const y = lowest + 0.05;
  void at;
  if (kind === 1) {
    line(
      b,
      [
        [mid - 0.4, y],
        [mid + 0.45, y - 0.01],
      ],
      nib(b, b.ink, 0.03, { fray: 0.4 }),
    );
  } else if (kind === 2) {
    line(
      b,
      [
        [mid - 0.62, y + 0.01],
        [mid + 0.66, y - 0.02],
      ],
      nib(b, b.ink, 0.042, { fray: 0.45 }),
    );
    line(
      b,
      [
        [mid - 0.3, y + 0.07],
        [mid + 0.24, y + 0.06],
      ],
      nib(b, b.ink, 0.022, { fray: 0.5 }),
    );
  } else {
    // A cast shadow, in the accent, out of register with the feet.
    const [x, yy] = toPage(b, [mid + 0.08, y + 0.02]);
    scrub(
      b.sheet,
      inEllipse(x, yy, 0.4 * b.u, 0.07 * b.u, 0, b.n),
      { x0: x - 0.9 * b.u, y0: yy - 0.3 * b.u, x1: x + 0.9 * b.u, y1: yy + 0.3 * b.u },
      nib(b, b.col, 0.016, { bite: 0.92 }),
      b.n++,
      { passes: 2 },
    );
  }
}

// ----------------------------------------------------------------- assembly

/**
 * Draw one figure onto a fresh sheet.
 *
 * Order is the order a person works in: the ground and any colour mass first
 * because everything sits on top of them, then the far limbs, the torso, the
 * head, and last the near arm and whatever it is holding — so the hand that
 * holds the bat is in front of the body rather than behind it.
 */
/** Where a figure stands on a sheet somebody else owns. */
export interface Placement {
  /** Centre of the figure, in page pixels. */
  cx: number;
  /** Where the feet land, in page pixels. */
  baseY: number;
  /** Figure units to pixels. */
  u: number;
  flip?: boolean;
  /** Draw the ground dash. Off when a scene supplies its own floor. */
  ground?: boolean;
}

/**
 * Paint a figure onto an existing sheet, at a given place and size.
 *
 * Split out of `drawFigure` so a scene can stage two or three of them against a
 * bench with air between, which is the whole difference between a figure and a
 * picture. Everything about how a body is drawn stays here; only the fitting
 * moved out.
 */
export function paintFigure(sheet: Sheet, rec: FigureRecipe, at: Placement) {
  const r = mulberry(rec.seed ^ 0x3c7f);
  const p = rec.pose;
  const k = skeleton(p, rec.build / (BUILDS - 1));

  const body: Body = {
    sheet,
    r,
    u: at.u,
    ox: at.cx,
    oy: at.baseY,
    mirror: (at.flip ?? rec.flip) ? -1 : 1,
    spin: rad(p.spin ?? 0),
    ink: hexToRgb(BLACK),
    col: hexToRgb(rec.accent),
    rec,
    n: rec.seed & 0xffff,
  };

  if (at.ground !== false) ground(body, k, 0);
  loose(body, k, p);

  // Far side first, so the near arm and leg overlap it. Widths are the whole
  // point: thick where the limb joins the body, thin where it leaves it.
  limb(body, [k.hip[0], k.knee[0], k.foot[0]], 0.062, 0.03);
  limb(body, [k.foot[0], k.toe[0]], 0.032, 0.022);
  limb(body, [k.shoulder[0], k.elbow[0], k.hand[0]], 0.05, 0.024);

  torso(body, k);
  flash(body, k);

  // The head, drawn by the same grammar the heads gallery uses. No collar: the
  // body has shoulders of its own, and no air marks at this size.
  const [hx, hy] = toPage(body, k.head);
  drawHead(sheet, rec.face, hx, hy, BONE.headR * at.u * 2.0, {
    collar: false,
    air: false,
    colour: rec.dress !== 1,
  });

  limb(body, [k.hip[1], k.knee[1], k.foot[1]], 0.068, 0.032);
  limb(body, [k.foot[1], k.toe[1]], 0.034, 0.024);
  limb(body, [k.shoulder[1], k.elbow[1], k.hand[1]], 0.054, 0.026);

  // Hands only where one is holding something. A tapering limb already ends
  // itself; a blob on the end of every one of them is four extra marks on a
  // page whose whole discipline is not making them.
  if (p.grip === 0 || p.grip === 2) {
    blob(body, k.hand[0], BONE.hand * 0.9);
    prop(body, p.prop, k.hand[0], p.propAt ?? 90);
  }
  if (p.grip === 1) {
    blob(body, k.hand[1], BONE.hand * 0.9);
    prop(body, p.prop, k.hand[1], p.propAt ?? 90);
  }
}

/** How tall and wide a pose comes out, in figure units. Used to fit it to a page. */
export function extent(p: Pose, build: number) {
  const k = skeleton(p, build);
  const all: Pt[] = [
    k.head,
    k.neck,
    ...k.spine,
    ...k.shoulder,
    ...k.elbow,
    ...k.hand,
    ...k.hip,
    ...k.knee,
    ...k.foot,
    ...k.toe,
  ];
  const top = Math.min(...all.map((q) => q[1])) - BONE.headR * 2.1;
  const bottom = Math.max(...all.map((q) => q[1])) + BONE.headR * 0.5;
  const left = Math.min(...all.map((q) => q[0])) - 0.34;
  const right = Math.max(...all.map((q) => q[0])) + 0.34;
  return {
    top,
    bottom,
    left,
    right,
    w: right - left,
    h: bottom - top,
    midX: (left + right) / 2,
  };
}

export function drawFigure(rec: FigureRecipe, w: number, h: number): Sheet {
  const sheet = new Sheet(w, h, rec.seed, rec.paper);
  const r = mulberry(rec.seed ^ 0x91f3);
  const p = rec.pose;
  const e = extent(p, rec.build / (BUILDS - 1));

  // A dive is three times as wide as it is tall; at the same margins as a
  // standing figure it comes out half the size and reads as an insect. Wide
  // poses get more of the page.
  const room = e.w / e.h > 1.3 ? 0.94 : 0.86;
  const u = Math.min((h * 0.84) / e.h, (w * room) / e.w);

  // Nothing sits dead centre. The reference has the figure low and to one side
  // with the interesting thing flying off the other way, and a page of
  // perfectly centred drawings reads as a catalogue however good each one is.
  const drift = (r() - 0.5) * 0.1;

  paintFigure(sheet, rec, {
    cx: w * (0.5 + drift) - e.midX * u * (rec.flip ? -1 : 1),
    baseY: h * (0.92 - (p.air ?? 0) * 0.16) - e.bottom * u,
    u,
  });
  return sheet;
}

export { POSES, TAGS };
export type { Pose, Tag };
