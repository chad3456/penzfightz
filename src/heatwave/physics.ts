import type { VehicleTuning } from './config';

/**
 * Arcade physics, flat on the ground.
 *
 * A vehicle is a point with a heading, a velocity and a spin, and a circle
 * for colliding. Each step it accelerates along its nose, turns towards what
 * it was told, and bleeds off its sideways velocity at a rate that falls with
 * speed and with how hard it is turning — which is the whole drift model:
 * grippy when slow, loose when fast and cranked over.
 *
 * Obstacles are circles and rotated boxes. Impacts push things apart, bounce
 * the velocity off the contact normal, turn the glancing part of the hit into
 * spin, and knock the steering out of the driver's hands for a moment. Every
 * impact reports its closing speed, because that is what the game turns into
 * damage, sparks, sound and shake.
 */

export const wrap = (a: number) => {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
};
const clamp = (x: number, a: number, b: number) => (x < a ? a : x > b ? b : x);

export class Vehicle {
  x = 0;
  z = 0;
  vx = 0;
  vz = 0;
  /** Heading: the nose points along (sin h, cos h). */
  h = 0;
  spin = 0;
  control = 1;
  radius = 1.25;
  /** Height off the ground and vertical speed, for ramps. */
  y = 0;
  vy = 0;
  lateral = 0;
  steer = 0;
  throttle = 1;
  speedMul = 1;
  alive = true;

  constructor(public t: VehicleTuning) {}

  get speed() {
    return Math.hypot(this.vx, this.vz);
  }
  get fx() { return Math.sin(this.h); }
  get fz() { return Math.cos(this.h); }
  get airborne() { return this.y > 0.05; }

  /** Steer towards a heading. Returns the signed steering amount used. */
  aim(target: number, sharpness = 2.2) {
    this.steer = clamp(wrap(target - this.h) * sharpness, -1, 1);
    return this.steer;
  }

  step(dt: number) {
    const t = this.t;
    const max = t.maxSpeed * this.speedMul;
    const fx = this.fx;
    const fz = this.fz;
    const rx = fz;
    const rz = -fx;
    let vF = this.vx * fx + this.vz * fz;
    let vL = this.vx * rx + this.vz * rz;
    const speed = Math.hypot(vF, vL);
    this.control = Math.min(1, this.control + t.recoverySpeed * dt);
    // turning: more authority as speed builds, none in the air
    const turnK = Math.pow(clamp(Math.abs(vF) / 12, 0.15, 1), t.turnCurve);
    if (!this.airborne) this.h = wrap(this.h + this.steer * t.turnSpeed * turnK * this.control * dt * Math.sign(vF || 1));
    this.h = wrap(this.h + this.spin * dt);
    this.spin *= Math.exp(-t.angularDrag * dt);
    if (!this.airborne) {
      vF += t.acceleration * this.throttle * dt * (1 - clamp(vF / max, 0, 1) ** 2);
      vF -= vF * t.drag * dt;
      if (vF > max) vF += (max - vF) * Math.min(1, dt * 3);
      // the drift: sideways grip falls away with speed and with lock
      const loose = clamp(speed / max, 0, 1) ** 1.4 * (0.35 + 0.65 * Math.abs(this.steer));
      const grip = t.lateralGrip * (1 - loose * (1 - t.driftFactor));
      vL *= Math.exp(-grip * dt);
    }
    // velocity back from the car's own frame, using the new heading
    const nfx = Math.sin(this.h);
    const nfz = Math.cos(this.h);
    this.vx = nfx * vF + nfz * vL;
    this.vz = nfz * vF - nfx * vL;
    this.lateral = vL;
    this.x += this.vx * dt;
    this.z += this.vz * dt;
    if (this.y > 0 || this.vy > 0) {
      this.vy -= 30 * dt;
      this.y += this.vy * dt;
      if (this.y <= 0) { this.y = 0; this.vy = 0; }
    }
  }

  /** A shove: velocity change along a normal, and some spin from the glancing part. */
  hit(nx: number, nz: number, closing: number, bounce: number, twist: number) {
    this.vx += nx * closing * (1 + bounce);
    this.vz += nz * closing * (1 + bounce);
    this.spin += twist;
    this.control = Math.max(0, this.control - closing / 30);
  }
}

export interface Circle { kind: 'circle'; x: number; z: number; r: number }
export interface Box { kind: 'box'; x: number; z: number; hw: number; hd: number; a: number }
export type Shape = Circle | Box;

/**
 * Contact between a vehicle's circle and a static shape: the push-out
 * normal and depth, or null.
 */
export function contact(v: Vehicle, s: Shape): { nx: number; nz: number; depth: number } | null {
  if (s.kind === 'circle') {
    const dx = v.x - s.x;
    const dz = v.z - s.z;
    const d = Math.hypot(dx, dz);
    const min = v.radius + s.r;
    if (d >= min || d === 0) return null;
    return { nx: dx / d, nz: dz / d, depth: min - d };
  }
  // into the box's frame
  const c = Math.cos(s.a);
  const sn = Math.sin(s.a);
  const dx = v.x - s.x;
  const dz = v.z - s.z;
  const lx = dx * c - dz * sn;
  const lz = dx * sn + dz * c;
  const px = clamp(lx, -s.hw, s.hw);
  const pz = clamp(lz, -s.hd, s.hd);
  let ox = lx - px;
  let oz = lz - pz;
  let d = Math.hypot(ox, oz);
  let depth: number;
  if (d === 0) {
    // centre inside the box: push out through the nearest face
    const ex = s.hw - Math.abs(lx);
    const ez = s.hd - Math.abs(lz);
    if (ex < ez) { ox = Math.sign(lx) || 1; oz = 0; depth = ex + v.radius; } else { ox = 0; oz = Math.sign(lz) || 1; depth = ez + v.radius; }
    d = 1;
  } else {
    if (d >= v.radius) return null;
    depth = v.radius - d;
  }
  const nlx = ox / d;
  const nlz = oz / d;
  // back to the world
  return { nx: nlx * c + nlz * sn, nz: -nlx * sn + nlz * c, depth };
}

/** Resolve a vehicle against a static shape. Returns the closing speed, or 0. */
export function resolveStatic(v: Vehicle, s: Shape) {
  const c = contact(v, s);
  if (!c) return 0;
  v.x += c.nx * c.depth;
  v.z += c.nz * c.depth;
  const vn = v.vx * c.nx + v.vz * c.nz;
  if (vn >= 0) return 0;
  const closing = -vn;
  // the glancing part of the hit spins the car
  const tx = -c.nz;
  const tz = c.nx;
  const vt = v.vx * tx + v.vz * tz;
  const side = Math.sign((v.fx * c.nz - v.fz * c.nx) || 1);
  v.hit(c.nx, c.nz, closing, v.t.collisionForce, side * Math.min(6, closing * 0.12 + Math.abs(vt) * 0.02));
  return closing;
}

/** Resolve two vehicles against each other. Returns the closing speed, or 0. */
export function resolvePair(a: Vehicle, b: Vehicle) {
  if (Math.abs(a.y - b.y) > 1.2) return 0;
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  const d = Math.hypot(dx, dz);
  const min = a.radius + b.radius;
  if (d >= min || d === 0) return 0;
  const nx = dx / d;
  const nz = dz / d;
  const ma = a.t.mass;
  const mb = b.t.mass;
  const push = (min - d) / (ma + mb);
  a.x += nx * push * mb;
  a.z += nz * push * mb;
  b.x -= nx * push * ma;
  b.z -= nz * push * ma;
  const rv = (a.vx - b.vx) * nx + (a.vz - b.vz) * nz;
  if (rv >= 0) return 0;
  const e = (a.t.collisionForce + b.t.collisionForce) / 2;
  const j = (-(1 + e) * rv) / (1 / ma + 1 / mb);
  a.vx += (j / ma) * nx;
  a.vz += (j / ma) * nz;
  b.vx -= (j / mb) * nx;
  b.vz -= (j / mb) * nz;
  const closing = -rv;
  // spin both, opposite ways, by how far off-centre the hit was
  const offA = a.fx * nz - a.fz * nx;
  const offB = b.fx * nz - b.fz * nx;
  a.spin += offA * closing * 0.15;
  b.spin -= offB * closing * 0.15;
  a.control = Math.max(0, a.control - closing / 35);
  b.control = Math.max(0, b.control - closing / 35);
  return closing;
}

/** A ray against a shape, for the police feelers: distance along the ray, or Infinity. */
export function rayHit(ox: number, oz: number, dx: number, dz: number, len: number, s: Shape, pad = 1.2) {
  if (s.kind === 'circle') {
    const fx = ox - s.x;
    const fz = oz - s.z;
    const r = s.r + pad;
    const b = fx * dx + fz * dz;
    const c = fx * fx + fz * fz - r * r;
    const disc = b * b - c;
    if (disc < 0) return Infinity;
    const t = -b - Math.sqrt(disc);
    return t >= 0 && t <= len ? t : Infinity;
  }
  const c = Math.cos(s.a);
  const sn = Math.sin(s.a);
  const lx = (ox - s.x) * c - (oz - s.z) * sn;
  const lz = (ox - s.x) * sn + (oz - s.z) * c;
  const ldx = dx * c - dz * sn;
  const ldz = dx * sn + dz * c;
  const hw = s.hw + pad;
  const hd = s.hd + pad;
  let t0 = 0;
  let t1 = len;
  for (const [o, d, h] of [[lx, ldx, hw], [lz, ldz, hd]] as const) {
    if (Math.abs(d) < 1e-6) { if (Math.abs(o) > h) return Infinity; continue; }
    let a = (-h - o) / d;
    let b = (h - o) / d;
    if (a > b) [a, b] = [b, a];
    t0 = Math.max(t0, a);
    t1 = Math.min(t1, b);
    if (t0 > t1) return Infinity;
  }
  return t0;
}
