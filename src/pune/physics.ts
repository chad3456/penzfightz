import type { City } from './data';
import { SPECS, type Spec, type VType } from './vehicles';

/**
 * Arcade vehicle physics: a velocity vector split each step into a forward
 * part the engine and brakes act on and a sideways part the tyres bleed off.
 * Bodies follow the ground, ride up onto flyovers and bridge decks, fall off
 * them, bounce off buildings and sink if they go in the river.
 */

export interface Input { throttle: number; brake: number; steer: number; handbrake: boolean }

const push = { x: 0, z: 0, nx: 0, nz: 0 };

export class Body {
  spec: Spec;
  x = 0; z = 0; y = 0; yaw = 0;
  vx = 0; vz = 0; vy = 0;
  steer = 0; lean = 0; pitch = 0; roll = 0;
  health = 100; grounded = true; wet = 0; sunk = false;
  deck = false;
  lastHit = 0; hitSpeed = 0;
  rpm = 0;
  constructor(public type: VType) { this.spec = SPECS[type]; }
  get speed() { return this.vx * Math.sin(this.yaw) + this.vz * Math.cos(this.yaw); }
  get fwdX() { return Math.sin(this.yaw); }
  get fwdZ() { return Math.cos(this.yaw); }
  place(x: number, z: number, y: number, yaw: number) { this.x = x; this.z = z; this.y = y; this.yaw = yaw; this.vx = this.vz = this.vy = 0; }

  /** Collision circles: two for four-wheelers, one for two-wheelers. */
  circles(): [number, number, number][] {
    const s = this.spec;
    if (s.two || s.len < 3) return [[this.x, this.z, Math.max(0.45, s.wid * 0.55)]];
    const r = s.wid / 2, off = s.len / 2 - r;
    const fx = this.fwdX, fz = this.fwdZ;
    if (s.len > 8) return [[this.x + fx * off, this.z + fz * off, r], [this.x, this.z, r], [this.x - fx * off, this.z - fz * off, r]];
    return [[this.x + fx * off, this.z + fz * off, r], [this.x - fx * off, this.z - fz * off, r]];
  }

  step(dt: number, inp: Input, city: City, t: number) {
    const s = this.spec;
    const fx = Math.sin(this.yaw), fz = Math.cos(this.yaw), rx = Math.cos(this.yaw), rz = -Math.sin(this.yaw);
    let vf = this.vx * fx + this.vz * fz;
    let vr = this.vx * rx + this.vz * rz;
    if (this.grounded && !this.sunk) {
      const dmg = this.health < 25 ? 0.55 : 1;
      if (inp.throttle > 0) {
        if (vf < -0.3) vf += s.brake * inp.throttle * dt;
        else vf += s.accel * dmg * inp.throttle * dt * (1 - Math.max(0, vf) / (s.top * dmg));
      }
      if (inp.brake > 0) {
        if (vf > 0.3) vf -= s.brake * inp.brake * dt;
        else vf -= s.accel * 0.6 * inp.brake * dt * (1 - Math.max(0, -vf) / (s.top * 0.3));
      }
      // rolling resistance and air
      vf -= Math.sign(vf) * Math.min(Math.abs(vf), (0.35 + vf * vf * 0.0025) * dt);
      if (inp.throttle === 0 && inp.brake === 0) vf -= Math.sign(vf) * Math.min(Math.abs(vf), 0.6 * dt);
      // steering: less lock at speed
      const lock = s.turn / (1 + Math.abs(vf) * (s.two ? 0.045 : 0.035));
      this.steer += (inp.steer - this.steer) * Math.min(1, dt * (s.two ? 7 : 5));
      const wheelbase = Math.max(1.2, s.len * 0.6);
      const yawRate = (vf / wheelbase) * this.steer * lock * 1.6;
      this.yaw += yawRate * dt;
      // tyres bleed off sideways speed; the handbrake lets the tail go
      const grip = (inp.handbrake ? s.grip * 0.18 : s.grip) * (1 - this.wet * 0.35);
      vr -= Math.sign(vr) * Math.min(Math.abs(vr), grip * dt * 3);
      if (inp.handbrake) vf -= Math.sign(vf) * Math.min(Math.abs(vf), 3 * dt);
      // slide outward a little in hard turns
      vr -= yawRate * vf * 0.04 * dt * (inp.handbrake ? 6 : 1);
    } else if (this.sunk) {
      vf *= 1 - dt * 2; vr *= 1 - dt * 2;
    }
    const nfx = Math.sin(this.yaw), nfz = Math.cos(this.yaw), nrx = Math.cos(this.yaw), nrz = -Math.sin(this.yaw);
    this.vx = nfx * vf + nrx * vr; this.vz = nfz * vf + nrz * vr;
    this.x += this.vx * dt; this.z += this.vz * dt;
    // keep inside the map
    const T = city.terrain;
    const mx = T.hx - 6, mz = T.hz - 6;
    if (Math.abs(this.x) > mx) { this.x = Math.sign(this.x) * mx; this.vx *= -0.3; }
    if (Math.abs(this.z) > mz) { this.z = Math.sign(this.z) * mz; this.vz *= -0.3; }

    // buildings
    let hit = false;
    for (const [cx, cz, r] of this.circles()) {
      if (city.buildings.collide(cx, cz, r, this.y, push)) {
        this.x += push.x - cx; this.z += push.z - cz;
        const vn = this.vx * push.nx + this.vz * push.nz;
        if (vn < 0) {
          this.vx -= 1.25 * vn * push.nx; this.vz -= 1.25 * vn * push.nz;
          if (-vn > 2.5 && t - this.lastHit > 0.3) { this.health -= Math.min(40, (-vn - 2) * (s.two ? 3 : 2)); this.lastHit = t; this.hitSpeed = -vn; }
          hit = true;
        }
      }
    }
    if (hit) { this.vx *= 0.92; this.vz *= 0.92; }

    // ground, decks, water
    const ground = T.height(this.x, this.z);
    const surf = city.roads.surface(this.x, this.z, this.y, ground);
    this.deck = !!surf.deck;
    const target = surf.y;
    if (this.y > target + 0.15) {
      this.vy -= 9.8 * dt; this.y += this.vy * dt; this.grounded = false;
      if (this.y <= target) { if (this.vy < -7) this.health -= (-this.vy - 6) * 6; this.y = target; this.vy = 0; this.grounded = true; }
    } else {
      this.y = target; this.vy = 0; this.grounded = true;
    }
    const wl = T.water(this.x, this.z);
    if (isFinite(wl) && this.y < wl - 0.3 && !this.deck) {
      this.sunk = true; this.y = Math.max(this.y, wl - s.height * 0.8);
    }
    // pitch and roll from the ground under the wheels (cars), lean (two-wheelers)
    if (s.two) {
      const vfNow = this.vx * nfx + this.vz * nfz;
      const tgt = -this.steer * Math.min(1, Math.abs(vfNow) / 7) * 0.55;
      this.lean += (tgt - this.lean) * Math.min(1, dt * 6);
      this.pitch = 0; this.roll = this.lean;
    } else if (this.grounded) {
      const h = s.len * 0.4, w = s.wid * 0.45;
      const gy = (x: number, z: number) => city.roads.surface(x, z, this.y + 0.5, T.height(x, z)).y;
      const yf = gy(this.x + nfx * h, this.z + nfz * h), yb = gy(this.x - nfx * h, this.z - nfz * h);
      const yl = gy(this.x - nrx * w, this.z - nrz * w), yr = gy(this.x + nrx * w, this.z + nrz * w);
      const tp = Math.atan2(yf - yb, 2 * h), tr = Math.atan2(yr - yl, 2 * w); // +x is the left side when facing +z
      this.pitch += (Math.max(-0.5, Math.min(0.5, tp)) - this.pitch) * Math.min(1, dt * 8);
      this.roll += (Math.max(-0.4, Math.min(0.4, tr)) - this.roll) * Math.min(1, dt * 8);
    }
    const vfNow = this.vx * nfx + this.vz * nfz;
    this.rpm += ((Math.abs(vfNow) / s.top) * 0.85 + inp.throttle * 0.25 - this.rpm) * Math.min(1, dt * 4);
  }
}
