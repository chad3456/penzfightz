import type { Palette, Tone } from './palette';
import { at, blob, disc, grain, Light, limb, poly, type Frame } from './ink';
import { P, W, type Pt, type Skeleton } from './rig';

/**
 * The body, drawn in the order a screen printer would lay it down.
 *
 * Back to front, and the order is the whole illusion: an arm behind the torso
 * is behind it because it was printed first, not because anything computed an
 * occlusion. Get the order wrong and the figure comes apart — the first pass
 * had the near arm under the sash and the sash under the hip, and the man
 * appeared to be wearing his own leg.
 */

export type Hair = 'bun' | 'flow' | 'crown' | 'matted' | 'braid' | 'high';
export type Face = 'human' | 'monkey' | 'elephant' | 'lion';

export interface Look {
  hair: Hair;
  face: Face;
  /** Screen direction the face points. */
  facing: 1 | -1;
  /** A third eye, for Shiva and Durga and Kali. */
  thirdEye: boolean;
  /** Sacred thread over one shoulder. */
  thread: boolean;
  /** How much jewellery. 0 is an ascetic, 1 is a temple bronze. */
  ornament: number;
  /** Crescent moon in the hair. */
  crescent: boolean;
  /** Peacock feather. */
  feather: boolean;
  /** A garland to the knees. */
  garland: boolean;
  /** Halo behind the head. */
  halo: number;
}

const dirOf = (a: Pt, b: Pt): Pt => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const n = Math.hypot(dx, dy) || 1;
  return [dx / n, dy / n];
};
const perp = (d: Pt): Pt => [-d[1], d[0]];
const add = (p: Pt, d: Pt, k: number): Pt => [p[0] + d[0] * k, p[1] + d[1] * k];
const lerp = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
/** Head-local points into figure space. Typed so inline literals are read as points. */
const shape = (H: (p: Pt) => Pt, pts: Pt[]): Pt[] => pts.map((p) => H(p));

// ------------------------------------------------------------------ pieces

function arm(f: Frame, L: Light, s: Skeleton, i: 0 | 1, tone: Tone, scale = 1) {
  // A disc at each joint before the segments. Two tapered capsules meeting at
  // a point leave a notch on the outside of every bent elbow, and a figure
  // made of them reads as plumbing; the joint is what makes it a body.
  L.shadeDisc(f, s.shoulder[i], W.armTop * 0.94 * scale, W.armTop * 1.0 * scale, 0, tone);
  L.shadeBlob(f, limb(s.shoulder[i], s.elbow[i], W.armTop * scale, W.armMid * scale), tone);
  L.shadeDisc(f, s.elbow[i], W.armMid * 1.04 * scale, W.armMid * 1.04 * scale, 0, tone);
  L.shadeBlob(f, limb(s.elbow[i], s.wrist[i], W.armMid * scale, W.wrist * scale), tone);
  hand(f, L, s.wrist[i], s.hand[i], tone, scale);
}

function hand(f: Frame, L: Light, wrist: Pt, tip: Pt, tone: Tone, scale = 1) {
  const d = dirOf(wrist, tip);
  const n = perp(d);
  const w = W.wrist * 1.22 * scale;
  const palm: Pt[] = [
    add(add(wrist, n, w * 0.8), d, 0),
    add(add(wrist, n, w), d, P.hand * 0.55 * scale),
    add(add(tip, n, w * 0.5), d, -P.hand * 0.1 * scale),
    add(add(tip, n, -w * 0.5), d, -P.hand * 0.1 * scale),
    add(add(wrist, n, -w), d, P.hand * 0.55 * scale),
    add(add(wrist, n, -w * 0.8), d, 0),
  ];
  L.shadeBlob(f, palm, tone);
}

function legPiece(f: Frame, L: Light, s: Skeleton, i: 0 | 1, tone: Tone) {
  L.shadeBlob(f, limb(s.hip[i], s.knee[i], W.thighTop, W.knee), tone);
  L.shadeDisc(f, s.knee[i], W.knee * 1.05, W.knee * 1.05, 0, tone);
  L.shadeBlob(f, limb(s.knee[i], s.ankle[i], W.knee * 0.94, W.ankle), tone);
  const d = dirOf(s.ankle[i], s.toe[i]);
  const n = perp(d);
  // A wedge: deep at the heel, thin at the toe, with the sole flat on the
  // ground. Drawn as a rounded blob it comes out a pebble.
  const foot: Pt[] = [
    add(add(s.ankle[i], n, W.ankle * 1.1), d, -W.ankle * 1.5),
    add(add(s.toe[i], n, W.ankle * 0.5), d, 0),
    add(add(s.toe[i], n, -W.ankle * 0.34), d, 0),
    add(add(s.ankle[i], n, -W.ankle * 1.05), d, -W.ankle * 1.2),
  ];
  poly(f, foot, tone.light);
  L.clipTo(f, foot, () => poly(f, L.shadow, tone.dark));
}

/**
 * The torso.
 *
 * Built across the spine rather than as a fixed silhouette, so a leaning
 * figure gets a leaning chest and a twisted one gets shoulders that have gone
 * somewhere the hips have not. The pec line is a single extra pair of points
 * and it is the difference between a chest and a bag.
 */
function torso(f: Frame, L: Light, s: Skeleton, tone: Tone, female = false): Pt[] {
  const u = dirOf(s.pelvis, s.chest);
  const v = perp(u);
  const spine = Math.hypot(s.chest[0] - s.pelvis[0], s.chest[1] - s.pelvis[1]);
  const waist = add(s.pelvis, u, spine * 0.44);
  const rib = add(s.pelvis, u, spine * 0.82);
  const neckL = add(s.neck, v, -W.neck * 1.85);
  const neckR = add(s.neck, v, W.neck * 1.85);
  const chestW = P.chestHalf * (female ? 0.88 : 1);
  const waistW = P.waistHalf * (female ? 0.86 : 1);
  const path: Pt[] = [
    s.shoulder[0],
    add(rib, v, -chestW),
    add(waist, v, -waistW),
    add(s.hip[0], v, -0.004),
    add(s.pelvis, u, -0.052),
    add(s.hip[1], v, 0.004),
    add(waist, v, waistW),
    add(rib, v, chestW),
    s.shoulder[1],
    neckR,
    neckL,
  ];
  L.shadeBlob(f, path, tone);
  // The pectoral shape, one tone deeper. The reference draws the chest as its
  // own geometric plate rather than shading a curve into it, and it is what
  // turns a torso from a shape into a build.
  const pecY = add(s.pelvis, u, spine * 0.78);
  for (const sd of [-1, 1] as const) {
    const inner = add(pecY, v, sd * 0.008);
    const outer = add(pecY, v, sd * chestW * 0.94);
    if (female) {
      // A breast is a form on the chest, not a line cut into it, so it takes
      // the light like everything else rather than being drawn as a shadow.
      L.shadeBlob(f, [
        add(add(inner, u, 0.052), v, sd * 0.006),
        add(add(outer, u, 0.03), v, sd * 0.012),
        add(add(outer, u, -0.026), v, sd * 0.006),
        add(add(inner, u, -0.036), v, sd * 0.004),
      ], tone);
    } else {
      L.shadeBlob(f, [
        add(inner, u, 0.055),
        add(outer, u, 0.048),
        add(add(outer, u, -0.012), v, sd * 0.004),
        add(inner, u, -0.028),
      ], { light: tone.dark, dark: tone.dark }, 0.16);
    }
  }
  // The line of the abdomen, a single soft mark down the middle.
  L.shadeBlob(f, [
    add(add(pecY, u, -0.03), v, -0.008),
    add(add(pecY, u, -0.03), v, 0.008),
    add(add(waist, u, -0.02), v, 0.006),
    add(add(waist, u, -0.02), v, -0.006),
  ], { light: tone.dark, dark: tone.dark }, 0.14);
  return path;
}

function neckPiece(f: Frame, L: Light, s: Skeleton, tone: Tone) {
  const shape = limb(s.chin, add(s.neck, dirOf(s.chin, s.neck), 0.02), W.neck * 0.92, W.neck * 1.15, 1);
  L.shadeBlob(f, shape, tone);
}

// -------------------------------------------------------------------- head

/**
 * The head.
 *
 * A silhouette in the head's own frame, so the tilt is one rotation and the
 * features never need their own trigonometry. The face is a three-quarter — a
 * nose that breaks the outline, a near eye, and a far eye that appears only
 * once the head has turned far enough for it to be there.
 *
 * The outline is where all the character is. A wedge for the nose that
 * actually leaves the skull, a brow with a corner in it, and a jaw that
 * changes direction twice: those three edges are the difference between one of
 * these and a thumbnail with a fringe.
 */
const HUMAN: Pt[] = [
  [0.08, 0.0], [0.32, -0.11], [0.33, -0.24], [0.37, -0.33], [0.35, -0.4],
  [0.61, -0.5], [0.37, -0.58], [0.42, -0.68], [0.33, -0.82], [0.19, -0.94],
  [-0.02, -1.0], [-0.24, -0.95], [-0.37, -0.78], [-0.39, -0.52], [-0.3, -0.3],
  [-0.12, -0.12],
];
const MONKEY: Pt[] = [
  [0.1, -0.02], [0.4, -0.06], [0.6, -0.16], [0.66, -0.3], [0.54, -0.4],
  [0.63, -0.49], [0.44, -0.58], [0.46, -0.74], [0.3, -0.9], [0.06, -0.98],
  [-0.18, -0.94], [-0.34, -0.78], [-0.4, -0.52], [-0.32, -0.28], [-0.14, -0.1],
];
const LION: Pt[] = [
  [0.08, -0.02], [0.38, -0.04], [0.62, -0.14], [0.7, -0.3], [0.56, -0.4],
  [0.66, -0.48], [0.5, -0.57], [0.52, -0.78], [0.32, -0.95], [0.04, -1.02],
  [-0.24, -0.98], [-0.42, -0.82], [-0.48, -0.54], [-0.38, -0.26], [-0.16, -0.08],
];

/**
 * Where the features sit on a face.
 *
 * The eye line is *half way down the head*, not up under the hairline where
 * everybody first puts it. That single number is the difference between a face
 * and a cartoon, and it is the one the first pass of this got wrong: brows at
 * seventy per cent of the way up gave every god the same startled expression.
 */
const F = { eye: -0.55, brow: -0.66, mouth: -0.23, ear: -0.5, earX: -0.08 } as const;

export function head(f: Frame, L: Light, s: Skeleton, look: Look, pal: Palette, seed: number) {
  const hy = P.head;
  const hx = P.head * (look.face === 'human' ? 0.9 : 0.98);
  const tilt = Math.atan2(s.crown[0] - s.chin[0], -(s.crown[1] - s.chin[1]));
  const fx = look.facing;
  const turn = Math.abs(s.pose.headTurn);
  const cos = Math.cos(tilt);
  const sin = Math.sin(tilt);
  /** Head-local to figure space. */
  const H = (p: Pt): Pt => {
    const x = p[0] * hx * fx * (0.82 + turn * 0.24);
    const y = p[1] * hy;
    return [s.chin[0] + x * cos - y * sin, s.chin[1] + x * sin + y * cos];
  };

  if (look.halo > 0) {
    const c = H([0.02, -0.52]);
    disc(f, c, hy * 0.98 * look.halo, hy * 0.98 * look.halo, 0, pal.gold, 0.16);
    disc(f, c, hy * 0.86 * look.halo, hy * 0.86 * look.halo, 0, pal.paper, 0.5);
  }

  hairBack(f, L, H, look, pal, hy, seed);

  const outline = look.face === 'monkey' ? MONKEY : look.face === 'lion' ? LION : HUMAN;
  if (look.face === 'elephant') {
    elephant(f, L, H, look, pal, hy);
  } else {
    // Hard corners. Rounded through its midpoints the profile loses the nose
    // entirely — it is the one feature that leaves the skull, and smoothing
    // takes exactly the half of it that was doing the work.
    const pts = shape(H, outline);
    poly(f, pts, pal.skin.light);
    L.clipTo(f, pts, () => poly(f, L.shadow, pal.skin.dark));
  }

  // The near eye, and the far one only when the head has turned enough to
  // show it. Two eyes on a profile is the single fastest way to make a
  // stylised face look wrong.
  if (look.face === 'monkey') {
    // The muzzle, as its own shape over the jaw. Hanuman without one is a man
    // with a heavy chin, and the whole point of him is that he is not.
    const mz = shape(H, [[0.24, -0.06], [0.6, -0.12], [0.7, -0.3], [0.56, -0.46], [0.26, -0.42]]);
    // A shade lighter than the face. Painted the same colour the muzzle
    // vanishes into the skull and the whole head is one orange mass.
    blob(f, mz, pal.skin.light);
    L.clipTo(f, mz, () => poly(f, L.shadow, pal.skin.dark));
    blob(f, mz, '#f0e6cc', 0.16);
    disc(f, H([0.62, -0.32]), hy * 0.035, hy * 0.026, tilt, pal.ink, 0.6);
    disc(f, H([0.48, -0.14]), hy * 0.08, hy * 0.02, tilt + 0.1, pal.ink, 0.4);
    // The ear, high and round and out to the side, which is the other half.
    const er = shape(H, [[-0.2, -0.78], [-0.44, -0.86], [-0.54, -0.62], [-0.42, -0.44], [-0.22, -0.5]]);
    blob(f, er, pal.skin.light);
    L.clipTo(f, er, () => poly(f, L.shadow, pal.skin.dark));
  }
  const long = look.face === 'human' ? 0 : 0.1;
  const nearEye = H([0.21 + long, F.eye]);
  poly(f, browShape(H, 0.19 + long, F.brow, 0.22), pal.ink, 0.9);
  disc(f, nearEye, hy * 0.062, hy * 0.036, tilt, pal.ink, 0.95);
  // A lid over the top of the eye, which is what gives these faces their
  // half-closed, entirely unbothered expression.
  poly(f, shape(H, [
    [0.09 + long, F.eye - 0.045], [0.33 + long, F.eye - 0.03],
    [0.33 + long, F.eye - 0.008], [0.09 + long, F.eye - 0.02],
  ]), pal.skin.dark, 0.5);
  if (turn > 0.3) {
    disc(f, H([-0.09, F.eye - 0.005]), hy * 0.046 * turn, hy * 0.028, tilt, pal.ink, 0.85);
    poly(f, browShape(H, -0.1, F.brow, 0.17), pal.ink, 0.75);
  }
  // The mouth: one small dark mark, and never a smile.
  disc(f, H([0.27 + long, F.mouth]), hy * 0.045, hy * 0.014, tilt + 0.16 * fx, pal.ink, 0.5);

  if (look.thirdEye) {
    const t = H([0.08, -0.8]);
    poly(f, [
      [t[0] - hy * 0.055 * cos, t[1] - hy * 0.055 * sin],
      [t[0] + hy * 0.02 * sin, t[1] - hy * 0.02 * cos],
      [t[0] + hy * 0.055 * cos, t[1] + hy * 0.055 * sin],
      [t[0] - hy * 0.02 * sin, t[1] + hy * 0.02 * cos],
    ], pal.accent, 0.9);
  }

  // The ear, and the ring through it, which is on every one of these figures
  // in every temple in the country.
  if (look.face !== 'elephant') {
    // Set back behind the jaw and only a shade off the skin. Drawn in the lit
    // tone it comes out as a pale hole in the middle of the cheek.
    const ear = H([F.earX, F.ear]);
    disc(f, ear, hy * 0.06, hy * 0.09, tilt, pal.skin.dark, 0.35);
    if (look.ornament > 0.3) {
      const lobe = H([F.earX - 0.02, F.ear + 0.17]);
      disc(f, lobe, hy * 0.042, hy * 0.042, 0, pal.gold);
      disc(f, lobe, hy * 0.02, hy * 0.02, 0, pal.skin.dark);
    }
  }

  hairFront(f, L, H, look, pal, hy, seed);
}

/** A brow: a thin wedge, heavier at the outer end. Anything thicker is a scowl. */
function browShape(H: (p: Pt) => Pt, x: number, y: number, w: number): Pt[] {
  return [
    H([x - w * 0.5, y + 0.012]), H([x + w * 0.5, y - 0.026]),
    H([x + w * 0.5, y + 0.002]), H([x - w * 0.5, y + 0.05]),
  ];
}

function elephant(f: Frame, L: Light, H: (p: Pt) => Pt, look: Look, pal: Palette, hy: number) {
  const soft = (pts: Pt[], tone = pal.skin) => {
    const q = shape(H, pts);
    blob(f, q, tone.light);
    L.clipTo(f, q, () => poly(f, L.shadow, tone.dark));
  };
  // One ear, and it is behind the head. Both ears is the mistake a profile
  // invites and it produced a face with a slab across it — in a three-quarter
  // view of an elephant the far ear is entirely hidden by the skull.
  soft([[-0.02, -0.96], [-0.5, -1.0], [-0.92, -0.74], [-1.0, -0.36], [-0.72, -0.06], [-0.24, -0.14]]);
  soft([
    [0.16, -0.2], [0.4, -0.36], [0.46, -0.62], [0.36, -0.86], [0.12, -1.0],
    [-0.16, -1.0], [-0.4, -0.84], [-0.46, -0.56], [-0.36, -0.28], [-0.12, -0.16],
  ]);
  // The trunk: down from the middle of the face and curling back in.
  const front: Pt[] = [];
  const back: Pt[] = [];
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    const x = 0.22 + Math.sin(t * 1.7) * 0.22 - t * t * 0.3;
    const y = -0.28 + t * 0.84;
    const w = 0.14 * (1 - t * 0.52);
    front.push([x + w, y]);
    back.unshift([x - w, y]);
  }
  soft([...front, ...back]);
  const tuskA: Pt[] = [[0.3, -0.3], [0.62, -0.04], [0.5, 0.06], [0.24, -0.2]];
  const tuskB: Pt[] = [[-0.06, -0.24], [0.1, -0.12], [0.04, -0.04], [-0.12, -0.16]];
  poly(f, shape(H, tuskA), pal.steel);
  poly(f, shape(H, tuskB), pal.steel, 0.85);
  disc(f, H([0.26, -0.66]), hy * 0.05, hy * 0.034, 0, pal.ink, 0.95);
  poly(f, shape(H, [[0.0, -0.88], [0.09, -0.88], [0.09, -0.62], [0.0, -0.62]]), pal.accent, 0.7);
  void look;
}

function hairBack(f: Frame, L: Light, H: (p: Pt) => Pt, look: Look, pal: Palette, hy: number, seed: number) {
  const dark: Tone = { light: pal.ink, dark: '#0f1f28' };
  if (look.hair === 'flow' || look.hair === 'braid' || look.hair === 'matted') {
    const long = look.hair === 'braid' ? 3.2 : look.hair === 'matted' ? 2.2 : 2.8;
    const wide = look.hair === 'matted' ? 0.86 : 0.6;
    const mass: Pt[] = [
      [0.1, -1.06], [-0.3, -1.0], [-0.62, -0.72], [-0.7, -0.2],
      [-0.62 * wide, long * 0.5], [-0.3, long], [0.02, long * 0.92], [-0.1, 0.1], [-0.18, -0.5],
    ];
    L.shadeBlob(f, shape(H, mass), dark);
    if (look.hair === 'matted') {
      for (let i = 0; i < 5; i++) {
        const t = i / 4;
        const lock: Pt[] = [
          [-0.5 - t * 0.2, -0.6 + t * 0.3],
          [-0.9 - t * 0.35, 0.1 + t * 0.6],
          [-0.72 - t * 0.3, 0.5 + t * 0.9],
          [-0.5 - t * 0.16, 0.1 + t * 0.5],
        ];
        L.shadeBlob(f, shape(H, lock), dark);
      }
    }
  } else {
    const mass: Pt[] = [[0.1, -1.07], [-0.26, -1.06], [-0.5, -0.82], [-0.52, -0.4], [-0.32, -0.12], [-0.14, -0.34]];
    L.shadeBlob(f, shape(H, mass), dark);
  }
  void hy;
  void seed;
}

function hairFront(f: Frame, L: Light, H: (p: Pt) => Pt, look: Look, pal: Palette, hy: number, seed: number) {
  const dark: Tone = { light: pal.ink, dark: '#132530' };
  if (look.face !== 'elephant') {
    const cap: Pt[] = [
      [0.36, -0.9], [0.2, -1.05], [-0.12, -1.07], [-0.38, -0.95], [-0.44, -0.76],
      [-0.34, -0.86], [-0.08, -0.95], [0.22, -0.87],
    ];
    L.shadeBlob(f, shape(H, cap), dark);
  }
  if (look.hair === 'bun' || look.hair === 'high') {
    const up = look.hair === 'high' ? 0.42 : 0.2;
    L.shadeBlob(f, shape(H, [
      [0.1, -1.02 - up], [0.34, -1.18 - up], [0.2, -1.4 - up], [-0.14, -1.42 - up],
      [-0.34, -1.24 - up], [-0.24, -1.04 - up],
    ]), dark);
    poly(f, shape(H, [[-0.3, -1.0], [0.26, -1.0], [0.22, -1.08], [-0.28, -1.08]]), pal.gold, 0.9);
  }
  if (look.hair === 'crown') {
    // A mukuta: a tapering cap with a finial, banded in gold.
    const c: Pt[] = [[0.3, -0.94], [0.22, -1.34], [0.04, -1.56], [-0.16, -1.36], [-0.26, -0.96]];
    L.shadeBlob(f, shape(H, c), { light: pal.gold, dark: '#8a641b' });
    poly(f, shape(H, [[0.32, -0.92], [-0.3, -0.94], [-0.28, -1.06], [0.3, -1.04]]), pal.accent, 0.85);
    disc(f, H([0.03, -1.62]), hy * 0.06, hy * 0.06, 0, pal.gold);
  }
  if (look.crescent) {
    const c = H([-0.2, -1.16]);
    disc(f, c, hy * 0.15, hy * 0.15, 0, pal.paper, 0.95);
    disc(f, [c[0] + hy * 0.07, c[1] - hy * 0.02], hy * 0.13, hy * 0.13, 0, pal.ink, 0);
    L.shadeDisc(f, c, hy * 0.14, hy * 0.14, 0, { light: '#e8e2cd', dark: '#9a9384' });
    disc(f, [c[0] + hy * 0.08, c[1] - hy * 0.03], hy * 0.12, hy * 0.12, 0, pal.paper);
  }
  if (look.feather) {
    // A peacock feather, which is Krishna and nobody else.
    const base = H([-0.1, -0.98]);
    const tipY = -1.5;
    const tip = H([0.1, tipY]);
    poly(f, [base, [tip[0] - hy * 0.02, tip[1]], [tip[0] + hy * 0.02, tip[1]], [base[0] + hy * 0.03, base[1]]], '#2f6b57');
    const eye = H([0.18, tipY - 0.06]);
    disc(f, eye, hy * 0.15, hy * 0.2, 0.3, '#2f6b57');
    disc(f, eye, hy * 0.1, hy * 0.13, 0.3, '#2f6f8e');
    disc(f, eye, hy * 0.055, hy * 0.07, 0.3, pal.gold);
    disc(f, eye, hy * 0.025, hy * 0.032, 0.3, '#243f57');
  }
  void seed;
}

// ---------------------------------------------------------------- garments

/**
 * The lower garment.
 *
 * A dhoti or a sari is a rectangle of cloth wound round the hips, and the way
 * to draw one is not to model the winding but to give it the two things the
 * eye actually reads: a hem that swings away from the standing leg, and one
 * loose end falling in front. Both of those come off the skeleton, so a
 * dancing figure's cloth swings and a still one's hangs.
 */
export function garment(f: Frame, L: Light, s: Skeleton, pal: Palette, kind: 'dhoti' | 'sari' | 'short' | 'skin', seed: number) {
  if (s.pose.seated === 'lotus') return lap(f, L, s, pal, kind, seed);
  const u = dirOf(s.pelvis, s.chest);
  const v = perp(u);
  const drop = kind === 'short' ? 0.12 : kind === 'sari' ? 0.34 : 0.24;
  // The hem swings away from whichever leg is carrying the weight, which is the
  // one thing that makes drawn cloth look like it is being worn rather than
  // hung on a peg.
  const swing = (s.knee[1][0] - s.knee[0][0]) * 0.34;
  const waistL = add(add(s.pelvis, u, 0.055), v, -P.waistHalf * 1.04);
  const waistR = add(add(s.pelvis, u, 0.055), v, P.waistHalf * 1.04);
  const hipL = add(s.hip[0], v, -0.022);
  const hipR = add(s.hip[1], v, 0.022);
  // The hem, as a run of points with corners in them. Smoothed through seven
  // points it comes out an egg, and the first version of this looked like the
  // god was standing inside a gourd.
  const hem: Pt[] = [];
  const steps = 8;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = hipL[0] + (hipR[0] - hipL[0]) * t + swing * t;
    const sag = Math.sin(t * Math.PI) * 0.03 + (i % 2 ? 0.012 : -0.006);
    hem.push([x, Math.max(hipL[1], hipR[1]) + drop + sag]);
  }
  const cloth: Pt[] = [waistL, hipL, ...hem, hipR, waistR];
  const tone: Tone = kind === 'skin' ? { light: '#c99a4e', dark: '#7a5520' } : pal.cloth;
  poly(f, cloth, tone.light);
  L.clipTo(f, cloth, () => {
    poly(f, L.shadow, tone.dark);
    // Pleats: a fan of folds from the waist, which is how a dhoti is actually
    // tucked and the only interior detail the shape needs.
    for (let i = 1; i < 7; i++) {
      const t = i / 7;
      const a = lerp(waistL, waistR, t);
      const b: Pt = [hem[Math.round(t * steps)][0], hem[Math.round(t * steps)][1] + 0.02];
      poly(f, [a, [a[0] + 0.006, a[1]], [b[0] + 0.012, b[1]], [b[0] - 0.006, b[1]]], tone.dark, 0.2);
    }
    if (kind === 'skin') {
      for (let i = 0; i < 7; i++) {
        const t = (i + 0.5) / 7;
        const a = lerp(waistL, hem[steps], t);
        poly(f, [
          [a[0] - 0.014, a[1] - 0.035], [a[0] + 0.032, a[1] - 0.012],
          [a[0] + 0.028, a[1] + 0.024], [a[0] - 0.018, a[1] + 0.006],
        ], '#3a2a14', 0.7);
      }
    }
    grain(f, [waistL[0] - 0.05, waistL[1], waistR[0] + swing + 0.06, hem[4][1] + 0.04], pal.ink, 200, seed);
  });
  // The loose end, falling in front. Angular, because cloth folds rather than
  // drapes when it is drawn this flat.
  const fx = s.pelvis[0] + 0.052 + swing * 0.3;
  const fall: Pt[] = [
    [fx - 0.03, s.pelvis[1] - 0.02], [fx + 0.028, s.pelvis[1] - 0.02],
    [fx + 0.034, s.pelvis[1] + drop * 1.5], [fx + 0.008, s.pelvis[1] + drop * 1.72],
    [fx - 0.012, s.pelvis[1] + drop * 1.44], [fx - 0.036, s.pelvis[1] + drop * 0.8],
  ];
  poly(f, fall, pal.wrap.light);
  L.clipTo(f, fall, () => poly(f, L.shadow, pal.wrap.dark));
  // The waistband, the one place the gold gets a straight line.
  poly(f, [waistL, waistR, add(waistR, u, 0.03), add(waistL, u, 0.03)], pal.gold, 0.95);
}

/**
 * The lap.
 *
 * A cross-legged figure in this tradition is drawn as a broad low triangle of
 * cloth with two feet showing at the top of it, and that is not a shortcut —
 * it is what you can actually see. Modelling the folded shins and then
 * covering them anyway costs the same and looks worse, because any error in
 * the folding shows at the silhouette.
 */
function lap(f: Frame, L: Light, s: Skeleton, pal: Palette, kind: 'dhoti' | 'sari' | 'short' | 'skin', seed: number) {
  const u = dirOf(s.pelvis, s.chest);
  const v = perp(u);
  const wide = 0.3;
  const low = s.pelvis[1] + 0.135;
  const waistL = add(add(s.pelvis, u, 0.055), v, -P.waistHalf * 1.04);
  const waistR = add(add(s.pelvis, u, 0.055), v, P.waistHalf * 1.04);
  const cloth: Pt[] = [
    waistL,
    [s.pelvis[0] - wide, low - 0.05],
    [s.pelvis[0] - wide * 0.96, low],
    [s.pelvis[0], low + 0.012],
    [s.pelvis[0] + wide * 0.96, low],
    [s.pelvis[0] + wide, low - 0.05],
    waistR,
  ];
  const tone: Tone = kind === 'skin' ? { light: '#c99a4e', dark: '#7a5520' } : pal.cloth;
  poly(f, cloth, tone.light);
  L.clipTo(f, cloth, () => {
    poly(f, L.shadow, tone.dark);
    for (let i = 1; i < 9; i++) {
      const t = i / 9;
      const a = lerp(waistL, waistR, t);
      poly(f, [a, [a[0] + 0.007, a[1]], [s.pelvis[0] + (t - 0.5) * wide * 1.9 + 0.014, low], [s.pelvis[0] + (t - 0.5) * wide * 1.9 - 0.007, low]], tone.dark, 0.18);
    }
    grain(f, [s.pelvis[0] - wide, waistL[1], s.pelvis[0] + wide, low + 0.02], pal.ink, 200, seed);
  });
  // The soles, turned up on the thighs, which is what says lotus rather than
  // simply sitting down.
  for (const sd of [-1, 1] as const) {
    L.shadeBlob(f, [
      [s.pelvis[0] + sd * 0.1, low - 0.09],
      [s.pelvis[0] + sd * 0.185, low - 0.105],
      [s.pelvis[0] + sd * 0.2, low - 0.055],
      [s.pelvis[0] + sd * 0.1, low - 0.045],
    ], pal.skin);
  }
  poly(f, [waistL, waistR, add(waistR, u, 0.03), add(waistL, u, 0.03)], pal.gold, 0.95);
}

/** Bangles, armlets, anklets and the sacred thread. */
export function ornaments(f: Frame, L: Light, s: Skeleton, look: Look, pal: Palette) {
  const n = look.ornament;
  if (n <= 0) return;
  const band = (a: Pt, b: Pt, t: number, w: number, thick: number) => {
    const d = dirOf(a, b);
    const p = add(a, d, Math.hypot(b[0] - a[0], b[1] - a[1]) * t);
    const q = perp(d);
    poly(f, [add(add(p, q, w), d, -thick), add(add(p, q, -w), d, -thick), add(add(p, q, -w), d, thick), add(add(p, q, w), d, thick)], pal.gold, 0.95);
  };
  for (const i of [0, 1] as const) {
    band(s.shoulder[i], s.elbow[i], 0.72, W.armMid * 1.15, 0.014);
    if (n > 0.5) {
      band(s.elbow[i], s.wrist[i], 0.94, W.wrist * 1.3, 0.012);
      band(s.elbow[i], s.wrist[i], 0.84, W.wrist * 1.34, 0.01);
    }
    if (n > 0.7) band(s.knee[i], s.ankle[i], 0.93, W.ankle * 1.45, 0.012);
  }
  if (look.thread) {
    const u = dirOf(s.pelvis, s.chest);
    const v = perp(u);
    const a = add(s.shoulder[1], v, -0.012);
    const b = add(add(s.pelvis, v, -0.05), u, 0.05);
    L.shadeBlob(f, limb(a, b, 0.007, 0.006, 1), { light: '#e8dcc0', dark: '#a2977e' });
  }
  if (look.garland) {
    // A vaijayanti: two strands from the shoulders meeting low on the chest.
    // Scattering beads along a computed curve is what the first version did
    // and it came out as confetti down the front of the dhoti.
    const u = dirOf(s.pelvis, s.chest);
    const v = perp(u);
    const low = add(s.pelvis, u, 0.14);
    for (const sd of [-1, 1] as const) {
      const top = add(add(s.neck, u, 0.03), v, sd * P.chestHalf * 0.72);
      for (let i = 0; i <= 9; i++) {
        const t = i / 9;
        const bow = Math.sin(t * Math.PI) * 0.028 * sd;
        const q: Pt = [
          top[0] + (low[0] - top[0]) * t + bow,
          top[1] + (low[1] - top[1]) * t,
        ];
        disc(f, q, 0.0125, 0.0125, 0, i % 3 === 2 ? '#e8dcc0' : pal.accent, 0.95);
      }
    }
    disc(f, low, 0.019, 0.019, 0, pal.gold);
  }

  // A collar, which the reference has and which does more for the neck than
  // any amount of shading.
  if (n > 0.4) {
    const u = dirOf(s.pelvis, s.chest);
    const v = perp(u);
    const c = add(s.neck, u, -0.03);
    L.shadeBlob(f, [
      add(c, v, -P.chestHalf * 0.62), add(add(c, u, -0.032), v, -P.chestHalf * 0.4),
      add(c, u, -0.046), add(add(c, u, -0.032), v, P.chestHalf * 0.4),
      add(c, v, P.chestHalf * 0.62), add(add(c, u, 0.014), v, P.chestHalf * 0.34),
      add(c, u, 0.022), add(add(c, u, 0.014), v, -P.chestHalf * 0.34),
    ], { light: pal.gold, dark: '#8a641b' });
  }
}

// -------------------------------------------------------------------- body

export interface Bodywork {
  skin: Tone;
  look: Look;
  garment: 'dhoti' | 'sari' | 'short' | 'skin';
  /** Extra arms are painted behind, and paler, so the eye finds the true pair. */
  extraTone?: Tone;
  /** A woman's figure: narrower at the shoulder, wider at the hip. */
  female?: boolean;
}

export function figure(f: Frame, L: Light, s: Skeleton, pal: Palette, b: Bodywork, seed: number) {
  const back: 0 | 1 = s.pose.headTurn >= 0 ? 0 : 1;
  const front: 0 | 1 = back === 0 ? 1 : 0;
  const farLeg: 0 | 1 = s.knee[0][0] < s.knee[1][0] ? 0 : 1;
  const nearLeg: 0 | 1 = farLeg === 0 ? 1 : 0;

  for (const e of s.extra) {
    const tone = b.extraTone ?? { light: b.skin.dark, dark: b.skin.dark };
    L.shadeBlob(f, limb(e.shoulder, e.elbow, W.armTop * 0.82, W.armMid * 0.82), tone);
    L.shadeBlob(f, limb(e.elbow, e.wrist, W.armMid * 0.82, W.wrist * 0.82), tone);
    hand(f, L, e.wrist, e.hand, tone, 0.85);
  }

  arm(f, L, s, back, b.skin);
  if (s.pose.seated !== 'lotus') {
    legPiece(f, L, s, farLeg, b.skin);
    legPiece(f, L, s, nearLeg, b.skin);
  }
  torso(f, L, s, b.skin, b.female);
  neckPiece(f, L, s, b.skin);
  garment(f, L, s, pal, b.garment, seed);
  head(f, L, s, b.look, pal, seed);
  arm(f, L, s, front, b.skin);
  ornaments(f, L, s, b.look, pal);
  // A little grain over the torso, where the reference has it.
  const u = dirOf(s.pelvis, s.chest);
  L.clipTo(f, [
    s.shoulder[0], s.shoulder[1], add(s.hip[1], u, 0.02), add(s.hip[0], u, 0.02),
  ], () => grain(f, [s.shoulder[0][0], s.neck[1], s.shoulder[1][0], s.pelvis[1]], pal.ink, 240, seed + 3));
  void blob;
  void at;
}
