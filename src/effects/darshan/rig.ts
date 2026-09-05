export type Pt = [number, number];

/**
 * The figure, as a skeleton.
 *
 * Thirty-two portraits of the same god are only thirty-two portraits if the
 * body actually moves, so nothing here is a silhouette with the colours
 * swapped: there is a jointed rig, and a pose is a set of angles at its
 * joints. The limbs are then built as tapered shapes between the joints, which
 * is why a raised arm foreshortens into a shorter, fatter shape by itself
 * instead of needing a second drawing.
 *
 * Everything is a fraction of the figure's height, so one number scales the
 * whole person, and the origin is the crown of the head with y running down
 * the page — the same direction the canvas runs, so no coordinate is ever
 * flipped anywhere else in this folder.
 */

/** Heroic proportion: eight heads, broad at the shoulder, long in the leg. */
export const P = {
  head: 0.156,
  neck: 0.038,
  chestRise: 0.045,
  spine: 0.235,
  shoulderHalf: 0.119,
  chestHalf: 0.112,
  waistHalf: 0.074,
  hipHalf: 0.098,
  upperArm: 0.155,
  forearm: 0.138,
  hand: 0.062,
  thigh: 0.245,
  shin: 0.232,
  foot: 0.082,
  /** Where the pelvis sits below the crown when standing straight. */
  pelvisY: 0.468,
} as const;

export const W = {
  neck: 0.032,
  armTop: 0.05,
  armMid: 0.037,
  wrist: 0.024,
  thighTop: 0.064,
  knee: 0.045,
  ankle: 0.026,
} as const;

/**
 * Limb angles are absolute, not deltas.
 *
 * Both are measured from hanging straight down and are *side-relative*, so a
 * positive angle always swings away from the body and the same number means
 * the same thing on the left and the right; π is straight up, and a negative
 * angle reaches across the chest. Authoring these as a shoulder angle plus an
 * elbow *bend* is the obvious design and it is miserable — half the poses in
 * this file want a forearm pointing somewhere specific, and working out the
 * bend that gets it there by hand is arithmetic, not drawing.
 */
export interface ArmPose {
  upper: number;
  fore: number;
}

export interface LegPose {
  thigh: number;
  shin: number;
  /** Where the foot points. About 1.5 is flat on the floor, turned out. */
  foot: number;
}

export interface Pose {
  id: string;
  name: string;
  /** Spine angle from vertical, positive leans to screen right. */
  lean: number;
  hipTilt: number;
  chestTilt: number;
  headTilt: number;
  /** -1 turned away, 0 three-quarter, 1 towards the viewer. */
  headTurn: number;
  /** Lateral shift of the pelvis, which is what a weighted hip actually is. */
  sway: number;
  arms: [ArmPose, ArmPose];
  legs: [LegPose, LegPose];
  /** Extra pairs of arms, fanned behind the shoulders. */
  extra?: number;
  /** How far off the ground, for a figure in the air. */
  hover?: number;
  /** Which hand carries the principal attribute, and which the second. */
  hold: [0 | 1, 0 | 1];
  /** Sitting changes where the legs go entirely. */
  seated?: 'lotus' | 'kneel';
}

/**
 * Where a joint lands.
 *
 * `side` is −1 for the figure's right, which is screen *left*, and it flips
 * the sense of every angle — so a pose can say "shoulder out by a third of a
 * radian" once and mean the same thing on both sides.
 */
export function step(from: Pt, angle: number, len: number, side: 1 | -1 = 1): Pt {
  const a = angle * side;
  return [from[0] + Math.sin(a) * len, from[1] + Math.cos(a) * len];
}

export interface Skeleton {
  pelvis: Pt;
  chest: Pt;
  neck: Pt;
  chin: Pt;
  crown: Pt;
  shoulder: [Pt, Pt];
  elbow: [Pt, Pt];
  wrist: [Pt, Pt];
  hand: [Pt, Pt];
  hip: [Pt, Pt];
  knee: [Pt, Pt];
  ankle: [Pt, Pt];
  toe: [Pt, Pt];
  /** Extra pairs, outermost first. */
  extra: { shoulder: Pt; elbow: Pt; wrist: Pt; hand: Pt; side: 1 | -1 }[];
  pose: Pose;
  /** Ground line, which a leap lifts the whole figure off. */
  ground: number;
}

const across = (from: Pt, angle: number, len: number, side: 1 | -1): Pt => [
  from[0] + Math.cos(angle) * len * side,
  from[1] + Math.sin(angle) * len * side,
];

/**
 * Build the skeleton for a pose.
 *
 * Worked outwards from the pelvis, which is the root because it is the joint a
 * standing person balances *over* — hang the figure from its head instead and
 * every weighted-hip pose comes out sliding off its own feet.
 */
export function skeleton(pose: Pose): Skeleton {
  const sides: [1 | -1, 1 | -1] = [-1, 1];
  // A seated figure is not a standing one with folded legs: the whole body
  // drops. Leaving the pelvis at standing height and bending the knees put
  // every cross-legged god a foot in the air with his shins out sideways.
  const sit = pose.seated === 'lotus' ? 0.235 : pose.seated === 'kneel' ? 0.135 : 0;
  const pelvis: Pt = [pose.sway, P.pelvisY + sit - (pose.hover ?? 0)];
  // Negative lengths go *up* the page, which is where a spine goes. The first
  // version of this built the chest below the pelvis and every figure folded
  // into a squat blob with its head somewhere near its own hips.
  const chest = step(pelvis, pose.lean, -P.spine);
  const neck = step(chest, pose.lean * 0.7 + pose.chestTilt * 0.3, -P.chestRise);
  const chin = step(neck, pose.lean * 0.3 + pose.headTilt, -P.neck);
  const crown = step(chin, pose.lean * 0.3 + pose.headTilt, -P.head);

  // The shoulder line sits *below* the base of the neck, by about a third of
  // the neck's own length. Hanging the arms off the neck point buries the head
  // between the deltoids and the figure comes out with no neck at all.
  const yoke = step(neck, pose.chestTilt, 0.022);
  const shoulder: [Pt, Pt] = [
    across(yoke, pose.chestTilt, P.shoulderHalf, -1),
    across(yoke, pose.chestTilt, P.shoulderHalf, 1),
  ];
  const hip: [Pt, Pt] = [
    across(pelvis, pose.hipTilt, P.hipHalf, -1),
    across(pelvis, pose.hipTilt, P.hipHalf, 1),
  ];

  const elbow: [Pt, Pt] = [[0, 0], [0, 0]];
  const wrist: [Pt, Pt] = [[0, 0], [0, 0]];
  const hand: [Pt, Pt] = [[0, 0], [0, 0]];
  for (let i = 0; i < 2; i++) {
    const s = sides[i];
    const a = pose.arms[i];
    elbow[i] = step(shoulder[i], a.upper, P.upperArm, s);
    wrist[i] = step(elbow[i], a.fore, P.forearm, s);
    hand[i] = step(wrist[i], a.fore, P.hand, s);
  }

  const knee: [Pt, Pt] = [[0, 0], [0, 0]];
  const ankle: [Pt, Pt] = [[0, 0], [0, 0]];
  const toe: [Pt, Pt] = [[0, 0], [0, 0]];
  for (let i = 0; i < 2; i++) {
    const s = sides[i];
    const l = pose.legs[i];
    knee[i] = step(hip[i], l.thigh, P.thigh, s);
    ankle[i] = step(knee[i], l.shin, P.shin, s);
    toe[i] = step(ankle[i], l.foot, P.foot, s);
  }

  // Extra arms fan out from just behind the shoulders, each pair a little
  // higher and wider than the last, which is how a many-armed figure is
  // carved: a halo of limbs, not a crowd of them.
  const extra: Skeleton['extra'] = [];
  const pairs = pose.extra ?? 0;
  for (let k = 0; k < pairs; k++) {
    const t = (k + 1) / (pairs + 1);
    // The fan goes *up*, not out. Horizontal extra arms read as a coat rack;
    // the halo of arms on a temple bronze rises from the shoulders.
    const spread = 1.34 + t * 1.06;
    const bend = 0.28;
    for (const s of sides) {
      const i = s < 0 ? 0 : 1;
      const root: Pt = [shoulder[i][0] - s * 0.012, shoulder[i][1] + 0.016 - t * 0.01];
      const e = step(root, spread, P.upperArm * 0.94, s);
      const w = step(e, spread + bend, P.forearm * 0.94, s);
      const h = step(w, spread + bend, P.hand * 0.9, s);
      extra.push({ shoulder: root, elbow: e, wrist: w, hand: h, side: s });
    }
  }

  // A seated figure rests on what it is sitting on, which is nowhere near its
  // feet — taking the ground from the toes of a cross-legged god floats him a
  // hand's breadth above his own shadow.
  const ground = pose.seated
    ? pelvis[1] + (pose.seated === 'lotus' ? 0.13 : 0.2)
    : Math.max(toe[0][1], toe[1][1], ankle[0][1] + 0.03, ankle[1][1] + 0.03) + (pose.hover ?? 0);
  return { pelvis, chest, neck, chin, crown, shoulder, elbow, wrist, hand, hip, knee, ankle, toe, extra, pose, ground };
}

// ---------------------------------------------------------------- the poses

const leg = (thigh: number, shin: number, foot = 1.5): LegPose => ({ thigh, shin, foot });
const arm = (upper: number, fore: number): ArmPose => ({ upper, fore });

/**
 * The pose library.
 *
 * Half of these are named from the tradition rather than invented, because the
 * tradition already has names for them and they are more precise than anything
 * I would make up: *samabhanga* is the straight symmetric stance, *abhanga* is
 * the single bend, *tribhanga* is the triple bend at neck, waist and knee that
 * every Krishna in stone stands in, and *alidha* is the archer's lunge.
 */
export const POSES: Pose[] = [
  {
    id: 'samabhanga', name: 'Samabhanga, the straight stance',
    lean: 0, hipTilt: 0, chestTilt: 0, headTilt: 0, headTurn: 0.2, sway: 0,
    arms: [arm(0.16, 0.26), arm(0.16, 0.26)], legs: [leg(0.05, 0.05, 1.42), leg(-0.05, -0.02, 1.56)],
    hold: [0, 1],
  },
  {
    id: 'tribhanga', name: 'Tribhanga, the triple bend',
    lean: -0.11, hipTilt: 0.13, chestTilt: -0.09, headTilt: 0.13, headTurn: 0.5, sway: 0.035,
    arms: [arm(0.3, 0.52), arm(0.14, 0.62)], legs: [leg(0.0, 0.06, 1.4), leg(-0.2, 0.26, 1.68)],
    hold: [0, 1],
  },
  {
    id: 'abhanga', name: 'Abhanga, weight on one hip',
    lean: -0.06, hipTilt: 0.09, chestTilt: -0.05, headTilt: 0.06, headTurn: 0.35, sway: 0.024,
    arms: [arm(0.26, 0.4), arm(0.16, 0.4)], legs: [leg(0.02, 0.05, 1.4), leg(-0.13, 0.12, 1.62)],
    hold: [0, 1],
  },
  {
    id: 'abhaya', name: 'Abhaya mudra, the gesture of no fear',
    lean: -0.03, hipTilt: 0.06, chestTilt: -0.03, headTilt: 0.04, headTurn: 0.6, sway: 0.016,
    arms: [arm(0.52, 2.72), arm(0.18, 0.42)], legs: [leg(0.04, 0.05, 1.4), leg(-0.1, 0.06, 1.6)],
    hold: [1, 1],
  },
  {
    id: 'venu', name: 'At the flute',
    lean: -0.08, hipTilt: 0.11, chestTilt: -0.07, headTilt: 0.16, headTurn: 0.55, sway: 0.03,
    arms: [arm(0.74, -2.62), arm(0.5, -2.34)], legs: [leg(0.1, 0.1, 1.36), leg(-0.34, 0.42, 2.0)],
    hold: [0, 1],
  },
  {
    id: 'alidha', name: 'Alidha, the archer’s lunge',
    lean: 0.1, hipTilt: -0.06, chestTilt: 0.12, headTilt: -0.05, headTurn: 0.15, sway: -0.05,
    arms: [arm(1.42, 1.62), arm(1.26, -1.72)], legs: [leg(0.5, 0.14, 1.3), leg(-0.44, -0.1, 1.72)],
    hold: [0, 1],
  },
  {
    id: 'dhanurdhara', name: 'The bow at rest',
    lean: -0.04, hipTilt: 0.07, chestTilt: -0.04, headTilt: 0.03, headTurn: 0.4, sway: 0.018,
    arms: [arm(0.14, 0.2), arm(0.44, 0.12)], legs: [leg(0.03, 0.05, 1.4), leg(-0.1, 0.06, 1.6)],
    hold: [1, 0],
  },
  {
    id: 'gada', name: 'The mace at the shoulder',
    lean: 0.03, hipTilt: -0.05, chestTilt: 0.06, headTilt: -0.03, headTurn: 0.3, sway: -0.014,
    arms: [arm(0.2, 0.34), arm(0.72, 2.56)], legs: [leg(0.09, 0.06, 1.36), leg(-0.12, 0.02, 1.6)],
    hold: [1, 0],
  },
  {
    id: 'gadaUp', name: 'The mace overhead',
    lean: -0.05, hipTilt: 0.04, chestTilt: -0.08, headTilt: -0.14, headTurn: 0.25, sway: 0.01,
    arms: [arm(0.28, 0.5), arm(2.66, 3.02)], legs: [leg(0.2, 0.1, 1.34), leg(-0.24, 0.06, 1.66)],
    hold: [1, 0],
  },
  {
    id: 'stride', name: 'Striding',
    lean: 0.06, hipTilt: -0.08, chestTilt: 0.1, headTilt: -0.02, headTurn: 0.25, sway: -0.02,
    arms: [arm(-0.3, 0.22), arm(0.4, 0.72)], legs: [leg(0.46, 0.5, 1.16), leg(-0.34, 0.12, 1.86)],
    hold: [0, 1],
  },
  {
    id: 'strideBack', name: 'Turning as she walks',
    lean: 0.04, hipTilt: -0.06, chestTilt: 0.14, headTilt: 0.05, headTurn: -0.6, sway: -0.016,
    arms: [arm(0.46, 0.76), arm(-0.26, 0.18)], legs: [leg(-0.36, 0.02, 1.9), leg(0.42, 0.46, 1.14)],
    hold: [1, 0],
  },
  {
    id: 'leap', name: 'In the air',
    lean: 0.12, hipTilt: -0.14, chestTilt: 0.16, headTilt: -0.1, headTurn: 0.2, sway: -0.03, hover: 0.11,
    arms: [arm(2.5, 2.86), arm(-0.46, 0.16)], legs: [leg(0.7, 1.72, 2.3), leg(-0.5, -0.24, 1.2)],
    hold: [0, 1],
  },
  {
    id: 'flight', name: 'Flying',
    lean: 0.36, hipTilt: -0.2, chestTilt: 0.3, headTilt: -0.3, headTurn: 0.3, sway: -0.05, hover: 0.17,
    arms: [arm(2.82, 2.96), arm(-0.7, -0.3)], legs: [leg(-0.66, -1.2, 0.4), leg(-0.32, 0.62, 1.9)],
    hold: [0, 1],
  },
  {
    id: 'janu', name: 'Down on one knee',
    lean: 0.06, hipTilt: -0.04, chestTilt: 0.05, headTilt: 0.18, headTurn: 0.4, sway: 0,
    arms: [arm(0.28, 0.9), arm(0.24, 1.0)], legs: [leg(0.5, 2.5, 3.4), leg(0.86, -0.1, 1.5)],
    hold: [0, 1], seated: 'kneel',
  },
  {
    id: 'anjali', name: 'Anjali mudra, palms together',
    lean: 0, hipTilt: 0.03, chestTilt: -0.02, headTilt: 0.14, headTurn: 0.65, sway: 0.008,
    arms: [arm(0.34, -2.32), arm(0.34, -2.32)], legs: [leg(0.05, 0.05, 1.4), leg(-0.07, 0.02, 1.6)],
    hold: [0, 1],
  },
  {
    id: 'nrtya', name: 'Dancing',
    lean: -0.16, hipTilt: 0.2, chestTilt: -0.14, headTilt: 0.2, headTurn: 0.5, sway: 0.05,
    arms: [arm(1.36, 2.5), arm(0.9, 1.72)], legs: [leg(0.08, 0.12, 1.34), leg(-0.72, 0.66, 2.4)],
    hold: [1, 0],
  },
  {
    id: 'tandava', name: 'Tandava, the dance of dissolution',
    lean: 0.14, hipTilt: -0.18, chestTilt: 0.2, headTilt: -0.06, headTurn: 0.35, sway: -0.04,
    arms: [arm(1.54, 1.06), arm(1.2, 2.2)], legs: [leg(0.14, 0.2, 1.3), leg(1.0, 2.24, 3.3)],
    hold: [0, 1], extra: 1,
  },
  {
    id: 'sula', name: 'The spear planted',
    lean: -0.02, hipTilt: 0.05, chestTilt: -0.02, headTilt: 0.02, headTurn: 0.45, sway: 0.012,
    arms: [arm(0.12, 0.2), arm(0.2, 0.4)], legs: [leg(0.05, 0.05, 1.4), leg(-0.1, 0.04, 1.6)],
    hold: [0, 1],
  },
  {
    id: 'thrust', name: 'The thrust',
    lean: 0.16, hipTilt: -0.1, chestTilt: 0.2, headTilt: -0.06, headTurn: 0.2, sway: -0.06,
    arms: [arm(1.14, 1.5), arm(-0.38, 0.3)], legs: [leg(0.6, 0.52, 1.12), leg(-0.42, -0.06, 1.78)],
    hold: [0, 1],
  },
  {
    id: 'cakra', name: 'The discus lifted',
    lean: -0.04, hipTilt: 0.06, chestTilt: -0.05, headTilt: -0.1, headTurn: 0.4, sway: 0.014,
    arms: [arm(0.22, 0.4), arm(2.4, 2.94)], legs: [leg(0.05, 0.05, 1.4), leg(-0.1, 0.04, 1.6)],
    hold: [1, 0],
  },
  {
    id: 'padmasana', name: 'Seated, in the lotus',
    lean: -0.02, hipTilt: 0, chestTilt: 0, headTilt: 0.05, headTurn: 0.55, sway: 0,
    arms: [arm(0.62, 1.34), arm(0.62, 1.34)], legs: [leg(1.15, -1.63, -2.4), leg(1.24, -1.7, -2.5)],
    hold: [0, 1], seated: 'lotus',
  },
  {
    id: 'katya', name: 'A hand on the hip',
    lean: -0.07, hipTilt: 0.1, chestTilt: -0.06, headTilt: 0.05, headTurn: 0.45, sway: 0.026,
    arms: [arm(0.72, -1.94), arm(0.18, 0.36)], legs: [leg(0.02, 0.05, 1.4), leg(-0.15, 0.16, 1.66)],
    hold: [1, 1],
  },
  {
    id: 'varada', name: 'Varada mudra, the boon',
    lean: -0.05, hipTilt: 0.07, chestTilt: -0.04, headTilt: 0.09, headTurn: 0.55, sway: 0.018,
    arms: [arm(0.4, 0.66), arm(0.42, 2.6)], legs: [leg(0.03, 0.05, 1.4), leg(-0.1, 0.06, 1.6)],
    hold: [0, 0],
  },
  {
    id: 'vyakhyana', name: 'Both arms open',
    lean: 0, hipTilt: 0.02, chestTilt: -0.02, headTilt: -0.04, headTurn: 0.5, sway: 0.006,
    arms: [arm(1.0, 1.6), arm(1.0, 1.6)], legs: [leg(0.08, 0.05, 1.4), leg(-0.08, 0.05, 1.6)],
    hold: [0, 1],
  },
  {
    id: 'hrdaya', name: 'Opening the heart',
    lean: -0.02, hipTilt: 0.04, chestTilt: 0, headTilt: 0.1, headTurn: 0.6, sway: 0,
    arms: [arm(0.64, -2.06), arm(0.64, -2.06)], legs: [leg(0.12, 0.08, 1.34), leg(-0.16, 0.1, 1.64)],
    hold: [0, 1],
  },
  {
    id: 'khadga', name: 'The sword drawn',
    lean: 0.05, hipTilt: -0.06, chestTilt: 0.08, headTilt: -0.04, headTurn: 0.3, sway: -0.02,
    arms: [arm(0.28, 0.5), arm(2.0, 2.72)], legs: [leg(0.22, 0.1, 1.32), leg(-0.22, 0.08, 1.64)],
    hold: [1, 0],
  },
  {
    id: 'jaya', name: 'Both arms raised',
    lean: 0, hipTilt: 0, chestTilt: 0, headTilt: -0.16, headTurn: 0.45, sway: 0,
    arms: [arm(2.66, 2.92), arm(2.66, 2.92)], legs: [leg(0.12, 0.06, 1.36), leg(-0.12, 0.06, 1.6)],
    hold: [0, 1],
  },
  {
    id: 'nirikshana', name: 'Looking back over the shoulder',
    lean: -0.05, hipTilt: 0.08, chestTilt: 0.16, headTilt: 0.06, headTurn: -0.7, sway: 0.02,
    arms: [arm(0.1, 0.22), arm(0.6, 0.36)], legs: [leg(0.03, 0.05, 1.4), leg(-0.16, 0.16, 1.68)],
    hold: [0, 1],
  },
];

export const POSE_BY_ID = Object.fromEntries(POSES.map((p) => [p.id, p])) as Record<string, Pose>;

/** The same pose, seen from the other side. */
export function mirror(pose: Pose): Pose {
  return {
    ...pose,
    id: pose.id + '-m',
    lean: -pose.lean,
    hipTilt: -pose.hipTilt,
    chestTilt: -pose.chestTilt,
    headTilt: -pose.headTilt,
    headTurn: pose.headTurn,
    sway: -pose.sway,
    arms: [pose.arms[1], pose.arms[0]],
    legs: [pose.legs[1], pose.legs[0]],
    hold: [pose.hold[1] ? 0 : 1, pose.hold[0] ? 0 : 1],
  };
}
