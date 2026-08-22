/**
 * The desk. Everything in the game is measured against it.
 *
 * A real two-seater school bench top is roughly 110cm x 55cm. The playing
 * surface here is a little squarer than that so a flick has room to curve,
 * which is what makes the game readable from a fixed camera.
 */

export const TABLE = {
  /** X extent, metres (left-right from the camera). */
  width: 1.16,
  /** Z extent, metres (near-far). */
  depth: 0.8,
  /** Thickness of the top slab. */
  thickness: 0.035,
  /** World Y of the playing surface. */
  surfaceY: 0.76,
  /** Friction of varnished plywood against a plastic barrel. */
  friction: 0.34,
  restitution: 0.14,
} as const;

export const HALF_W = TABLE.width / 2;
export const HALF_D = TABLE.depth / 2;

/**
 * Where each side racks up at the start of a rally.
 *
 * Wide enough apart that the opening flick is a real shot rather than a nudge,
 * but inside the lip so nobody starts the rally already half off the desk.
 */
export const START_Z = {
  host: HALF_D * 0.55,
  guest: -HALF_D * 0.55,
} as const;

/** A pen is out once its centre clears the lip by this much. */
export const OUT_MARGIN = 0.012;

/** Below this the pen has committed to the floor and is not coming back. */
export const FLOOR_Y = TABLE.surfaceY - 0.18;

/**
 * Impulse applied at full power draw, in newton-seconds per kg of pen — which
 * is just the launch speed in m/s.
 *
 * Calibrated by measurement, not arithmetic. A pen rests on two colliders and
 * picks up friction from both contact patches, so the desk sheds speed far
 * faster than a single-contact estimate predicts.
 *
 * Measured on the real surface, slide distance is cleanly quadratic in draw
 * (travel / power^2 came out 1.59-1.63 across the whole range), which lets the
 * feel be set by one number: FULL_POWER_TRAVEL below.
 */
export const MAX_IMPULSE_PER_KG = 4.0;

/**
 * How far a full-power flick slides on an empty desk, in metres.
 *
 * This is the number that sets the whole skill curve, so it is chosen against
 * the 0.44m gap between racked pens: below about 60% draw you cannot even
 * reach them, a knockout wants roughly 75-85%, and at the top of the range you
 * have enough left over to follow their pen straight off the far edge. Slide
 * distance for any draw is FULL_POWER_TRAVEL * power^2.
 */
export const FULL_POWER_TRAVEL = 1.25;

/**
 * Longest drag that still counts, as a fraction of the smaller viewport edge.
 *
 * Deliberately measured in pixels rather than metres of desk. The desk recedes
 * under a pitched camera, so a drag "up" the screen covers several times more
 * table than the same drag sideways — measuring power in world space made an
 * upward flick read full strength almost immediately. Pixels are what the hand
 * actually controls, so the meter now says the same thing in every direction.
 * Aim direction is still solved in table space, so pointing is unaffected.
 */
export const DRAW_SCREEN_FRACTION = 0.22;

/** Rally is dead once both pens are under these for SETTLE_FRAMES in a row. */
export const SETTLE_LINEAR = 0.045;
export const SETTLE_ANGULAR = 0.55;
export const SETTLE_FRAMES = 14;

/** Hard stop so a pen wedged against a bag can never hang the turn. */
export const SHOT_TIMEOUT_MS = 7000;

export function isOffTable(x: number, y: number, z: number): boolean {
  if (y < TABLE.surfaceY - 0.05) return true;
  return Math.abs(x) > HALF_W + OUT_MARGIN || Math.abs(z) > HALF_D + OUT_MARGIN;
}

/** Clamp a spawn point so pens never start hanging over the edge. */
export function clampToTable(x: number, z: number, margin = 0.06) {
  return {
    x: Math.max(-HALF_W + margin, Math.min(HALF_W - margin, x)),
    z: Math.max(-HALF_D + margin, Math.min(HALF_D - margin, z)),
  };
}
