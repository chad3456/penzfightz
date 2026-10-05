import type { City } from './data';
import { RC } from './data';
import { route, progress, type Route } from './routing';
import type { Car, Traffic } from './traffic';
import { randomLook } from './people';

/**
 * A driver that steers a physics body along a route — the police, a fleeing
 * chain-snatcher, a rival on a race — and the wanted level that sends the
 * police after you.
 */

export class Driver {
  route: Route | null = null;
  idx = 0;
  replanT = 0;
  stuckT = 0; reverseT = 0;
  constructor(public car: Car, public city: City) {}

  plan(tx: number, tz: number) {
    const b = this.car.body;
    this.route = route(this.city, b.x, b.z, tx, tz, true, 20000);
    this.idx = 0;
  }

  /** Steer toward (tx, tz) along the road when far, straight at it when close. */
  drive(dt: number, tx: number, tz: number, opts: { direct?: number; top?: number; replan?: number; ram?: boolean } = {}) {
    const c = this.car, b = c.body;
    const d = Math.hypot(tx - b.x, tz - b.z);
    this.replanT -= dt;
    let gx = tx, gz = tz;
    if (d > (opts.direct ?? 45)) {
      if (!this.route || this.replanT <= 0) { this.plan(tx, tz); this.replanT = opts.replan ?? 3; }
      if (this.route) {
        const pr = progress(this.route, b.x, b.z, this.idx);
        this.idx = pr.i;
        // aim a little down the route
        const pts = this.route.pts, n = pts.length / 2;
        let k = this.idx, acc = 0;
        const look = 10 + Math.abs(b.speed) * 0.9;
        while (k < n - 1 && acc < look) { acc += Math.hypot(pts[k * 2 + 2] - pts[k * 2], pts[k * 2 + 3] - pts[k * 2 + 1]); k++; }
        gx = pts[k * 2]; gz = pts[k * 2 + 1];
      }
    }
    const want = Math.atan2(gx - b.x, gz - b.z);
    let diff = want - b.yaw; diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    const top = opts.top ?? c.spec.top * 0.85;
    const inp = c.input;
    if (this.reverseT > 0) {
      this.reverseT -= dt;
      inp.throttle = 0; inp.brake = 1; inp.steer = -Math.sign(diff); inp.handbrake = false;
      return d;
    }
    inp.steer = Math.max(-1, Math.min(1, diff * 2.4));
    const sharp = Math.abs(diff) > 0.9;
    const sp = b.speed;
    const tgt = sharp ? Math.min(top, 7) : top;
    inp.throttle = sp < tgt ? 1 : 0;
    inp.brake = sp > tgt + 2 ? 0.6 : 0;
    inp.handbrake = sharp && sp > 9;
    if (opts.ram === false && d < 8) { inp.throttle = 0; inp.brake = 1; }
    if (inp.throttle > 0 && Math.abs(sp) < 0.8) this.stuckT += dt; else this.stuckT = Math.max(0, this.stuckT - dt);
    if (this.stuckT > 1.4) { this.reverseT = 1.1; this.stuckT = 0; this.replanT = 0; }
    c.braking = inp.brake > 0;
    return d;
  }
}

export interface Unit { car: Car; drv: Driver; seenT: number; officerOut: boolean }

export class Police {
  stars = 0;
  heat = 0;
  unseenT = 0;
  units: Unit[] = [];
  bustT = 0;
  lastSeenX = 0; lastSeenZ = 0;
  constructor(public city: City, public traffic: Traffic) {}

  crime(amount: number) {
    this.heat = Math.min(5.99, Math.max(this.heat, this.stars) + amount);
    this.stars = Math.max(this.stars, Math.floor(this.heat));
    this.unseenT = 0;
  }
  clear() {
    this.stars = 0; this.heat = 0; this.unseenT = 0;
    for (const u of this.units) { u.car.siren = false; u.car.mission = ''; u.car.police = true; if (u.car.ai) continue; }
    // the units go back to patrol by simply being left behind
    for (const u of this.units) this.traffic.remove(u.car);
    this.units = [];
  }
  setStars(n: number) { this.stars = n; this.heat = n; this.unseenT = 0; }

  /** Returns 'busted' when they have you. */
  update(dt: number, px: number, pz: number, onFoot: boolean, pSpeed: number): 'busted' | null {
    if (this.stars <= 0) {
      if (this.units.length) this.clear();
      return null;
    }
    const want = [0, 1, 2, 3, 5, 7][this.stars];
    // spawn
    if (this.units.length < want) {
      const a = Math.random() * Math.PI * 2, r = 170 + Math.random() * 90;
      const h = this.city.roads.nearest(px + Math.cos(a) * r, pz + Math.sin(a) * r, 60, (p) => p.cls <= RC.residential && !p.elevated);
      if (h) {
        const c = this.traffic.makeCar('police', 0);
        c.police = true; c.siren = true; c.mission = 'police';
        c.driver = randomLook(Math.random, 'man');
        const dir = h.k + 1 < h.p.n ? Math.atan2(h.p.x[h.k + 1] - h.p.x[h.k], h.p.z[h.k + 1] - h.p.z[h.k]) : 0;
        const toP = Math.atan2(px - h.x, pz - h.z);
        let yaw = dir; if (Math.cos(toP - dir) < 0) yaw += Math.PI;
        c.body.place(h.x, h.z, h.y, yaw);
        this.units.push({ car: c, drv: new Driver(c, this.city), seenT: 0, officerOut: false });
      }
    }
    // drive
    let seen = false, close = false;
    for (const u of this.units) {
      const b = u.car.body;
      const d = Math.hypot(px - b.x, pz - b.z);
      if (d < 85 + this.stars * 10) { seen = true; u.seenT = 0; } else u.seenT += dt;
      const tx = seen ? px : this.lastSeenX, tz = seen ? pz : this.lastSeenZ;
      u.drv.drive(dt, tx, tz, { direct: 40, top: u.car.spec.top * (0.75 + this.stars * 0.05), ram: !onFoot });
      if (d < (onFoot ? 5 : 7) && pSpeed < (onFoot ? 2.2 : 1.5) && Math.abs(b.speed) < 4) close = true;
    }
    // retire units that fell far behind
    for (const u of [...this.units]) {
      const d = Math.hypot(px - u.car.body.x, pz - u.car.body.z);
      if (d > 420 || u.car.body.sunk) { this.traffic.remove(u.car); this.units.splice(this.units.indexOf(u), 1); }
    }
    if (seen) { this.lastSeenX = px; this.lastSeenZ = pz; this.unseenT = 0; }
    else this.unseenT += dt;
    // lose them: out of sight long enough and the stars come down, one at a time
    const need = 7 + this.stars * 3;
    if (this.unseenT > need) { this.stars--; this.heat = this.stars; this.unseenT = 0; }
    if (close) this.bustT += dt; else this.bustT = Math.max(0, this.bustT - dt * 2);
    if (this.bustT > 1.8) { this.bustT = 0; return 'busted'; }
    return null;
  }
  get searching() { return this.stars > 0 && this.unseenT > 1.5; }
}
