/**
 * HEATWAVE — every number worth tuning, in one place.
 *
 * The PRD asks for these to be exposed in the Unity Inspector. Here they are
 * exposed in the in-game tuning panel (press T, or add ?tune to the address),
 * and they are plain data so a port can copy them straight into
 * ScriptableObjects.
 */

export interface VehicleTuning {
  /** m/s² of automatic throttle. */
  acceleration: number;
  /** m/s. */
  maxSpeed: number;
  /** Radians per second at full lock, at the reference speed. */
  turnSpeed: number;
  /** How turn rate grows with speed: 0 = flat, 1 = linear up to turnRefSpeed. */
  turnCurve: number;
  /** Per-second decay of sideways velocity at low speed. Higher = grippier. */
  lateralGrip: number;
  /** Grip multiplier at full speed and full lock. Lower = more drift. */
  driftFactor: number;
  mass: number;
  /** Bounciness of impacts, 0–1.5. */
  collisionForce: number;
  /** Per-second fraction of forward speed lost. */
  drag: number;
  /** Per-second decay of spin after a hit. */
  angularDrag: number;
  /** How fast steering authority comes back after a big hit, per second. */
  recoverySpeed: number;
}

export const PLAYER: VehicleTuning = {
  acceleration: 26,
  maxSpeed: 30,
  turnSpeed: 3.1,
  turnCurve: 0.55,
  lateralGrip: 7.5,
  driftFactor: 0.2,
  mass: 1.4,
  collisionForce: 0.55,
  drag: 0.12,
  angularDrag: 4,
  recoverySpeed: 2.2,
};

export const POLICE: VehicleTuning = {
  acceleration: 20,
  maxSpeed: 27,
  turnSpeed: 2.3,
  turnCurve: 0.5,
  lateralGrip: 5,
  driftFactor: 0.4,
  mass: 1.2,
  collisionForce: 0.6,
  drag: 0.12,
  angularDrag: 3,
  recoverySpeed: 1.2,
};

export const INTERCEPTOR: VehicleTuning = {
  acceleration: 30,
  maxSpeed: 36,
  turnSpeed: 3.2,
  turnCurve: 0.45,
  lateralGrip: 6,
  driftFactor: 0.35,
  mass: 0.8,
  collisionForce: 0.7,
  drag: 0.12,
  angularDrag: 3,
  recoverySpeed: 1.5,
};

export const AI = {
  /** Seconds of the player's velocity to lead by, per wanted level. */
  prediction: [0.35, 0.55, 0.8, 0.95, 1.1],
  interceptorPrediction: 1.3,
  /** How far ahead the feelers look, as seconds of travel. */
  feelerTime: 0.45,
  /** How hard a feeler hit pushes the steering. */
  avoidance: 0.9,
  /** Chance per decision that a cop ignores an obstacle entirely. */
  blindness: 0.25,
  /** Seconds between steering decisions — reaction time. */
  reaction: 0.12,
};

export const WANTED = {
  /** Heat needed for each level; heat = seconds survived × 40 + score. */
  heat: [0, 1800, 5500, 12500, 24000],
  police: [2, 4, 6, 9, 12],
  speed: [0.8, 0.9, 1.0, 1.07, 1.14],
  interceptorChance: [0, 0, 0.08, 0.3, 0.5],
};

export const DAMAGE = {
  playerHull: 100,
  policeHull: 100,
  interceptorHull: 55,
  /** Damage per m/s of closing speed. */
  playerFromCop: 1.35,
  playerFromWall: 1.1,
  copFromWall: 6.5,
  copFromCop: 6,
  copFromPlayer: 0.8,
  /** Below this closing speed a knock does nothing at all. */
  threshold: 4,
  /** Above this, a single impact takes the player's whole hull. */
  instantKill: 44,
  barrelRadius: 9,
  barrelDamage: 140,
};

export const SCORE = {
  perSecond: 10,
  smash: [250, 350, 400, 1000],
  nearMiss: 100,
  driftPerSecond: 120,
  chainWindow: 1.6,
};
