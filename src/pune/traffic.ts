import * as THREE from 'three';
import { DRIVABLE, FOOT, RANK, RC, type City, type Link, type Piece } from './data';
import type { Materials } from './city';
import { Body, type Input } from './physics';
import { Crowd, Pose, randomLook, type Look } from './people';
import { SPECS, VehicleMesh, randomType, type VType } from './vehicles';

/**
 * Everybody else: traffic that keeps left and follows the real road graph
 * (one-way streets included), parked scooters and cars, and people walking
 * along the edges of the roads. Spawned in a ring around the player and
 * retired when they fall far behind.
 */

export type Mats = Materials & { brakeOn: THREE.ShaderMaterial; brakeOff: THREE.ShaderMaterial };

export interface AI {
  piece: Piece; fwd: boolean; s: number; lane: number; laneT: number; v: number; vt: number;
  honkT: number; blockedT: number; mood: number; wait: number;
}

let NEXT_ID = 1;
export class Car {
  id = NEXT_ID++;
  body: Body;
  mesh: VehicleMesh;
  driver: Look | null = null;
  pillion: Look | null = null;
  ai: AI | null = null;
  parked = false;
  police = false;
  siren = false;
  mission = '';
  input: Input = { throttle: 0, brake: 0, steer: 0, handbrake: false };
  helmet = 0;
  braking = false;
  rr = Math.random();
  constructor(public type: VType, variant: number, mats: Mats) {
    this.body = new Body(type);
    this.mesh = new VehicleMesh(type, variant, mats);
  }
  get spec() { return SPECS[this.type]; }
  sync(mats: Mats) {
    const b = this.body, g = this.mesh.group;
    g.position.set(b.x, b.y, b.z);
    g.rotation.set(-b.pitch, b.yaw, b.roll, 'YXZ');
    const want = this.braking ? mats.brakeOn : mats.brakeOff;
    if (this.mesh.brake.material !== want) this.mesh.brake.material = want;
  }
}

export interface Ped {
  look: Look; x: number; z: number; y: number; yaw: number;
  piece: Piece; fwd: boolean; s: number; side: number; v: number;
  state: 'walk' | 'fallen' | 'flee' | 'idle' | 'cross';
  t: number; phase: number; shout: number; id: number;
}

const tmp = { x: 0, z: 0, y: 0, dx: 0, dz: 0 };
const rnd = Math.random;

export function speedFor(cls: number) {
  return cls === RC.trunk || cls === RC.motorway ? 13 : cls === RC.primary ? 11.5 : cls === RC.secondary ? 10 : cls === RC.tertiary ? 8.5 : cls === RC.residential ? 6.5 : cls === RC.track ? 4 : 5;
}

export class Traffic {
  cars: Car[] = [];
  peds: Ped[] = [];
  maxCars: number; maxParked: number; maxPeds: number;
  onHonk: (x: number, z: number, kind: number) => void = () => {};
  onShout: (p: Ped, why: 'hit' | 'jacked') => void = () => {};
  constructor(public city: City, public scene: THREE.Scene, public mats: Mats, public crowd: Crowd, quality: 'high' | 'low') {
    this.maxCars = quality === 'high' ? 70 : 36;
    this.maxParked = quality === 'high' ? 40 : 20;
    this.maxPeds = quality === 'high' ? 90 : 45;
  }

  // ------------------------------------------------------------- spawning
  makeCar(type: VType, variant = Math.floor(rnd() * 12)) {
    const c = new Car(type, variant, this.mats);
    this.scene.add(c.mesh.group);
    this.cars.push(c);
    return c;
  }
  remove(c: Car) {
    this.scene.remove(c.mesh.group);
    const i = this.cars.indexOf(c);
    if (i >= 0) this.cars.splice(i, 1);
  }

  private findPiece(px: number, pz: number, rMin: number, rMax: number, filter: (p: Piece) => boolean) {
    for (let k = 0; k < 6; k++) {
      const a = rnd() * Math.PI * 2, r = rMin + rnd() * (rMax - rMin);
      const x = px + Math.cos(a) * r, z = pz + Math.sin(a) * r;
      if (!this.city.terrain.inside(x, z, 20)) continue;
      const h = this.city.roads.nearest(x, z, 40, filter);
      if (h && Math.hypot(h.x - px, h.z - pz) > rMin * 0.8) return h;
    }
    return null;
  }

  spawnTraffic(px: number, pz: number, rMin = 140, rMax = 300) {
    const h = this.findPiece(px, pz, rMin, rMax, (p) => DRIVABLE(p.cls) && p.cls !== RC.track && p.len > 8);
    if (!h) return null;
    const p = h.p;
    const one = p.flags & 3;
    const fwd = one === 1 ? false : one === 2 ? true : rnd() < 0.5;
    const type = randomType(rnd(), p.cls);
    const c = this.makeCar(type);
    const along = p.s[h.k] + (p.s[h.k + 1] - p.s[h.k]) * h.t;
    c.ai = { piece: p, fwd, s: fwd ? along : p.len - along, lane: 0, laneT: 0, v: speedFor(p.cls) * 0.8, vt: speedFor(p.cls), honkT: 0, blockedT: 0, mood: rnd(), wait: 0 };
    c.ai.laneT = c.ai.lane = this.laneFor(c, p);
    c.driver = randomLook(rnd, type === 'auto' || type === 'bus' || type === 'tempo' ? 'man' : undefined);
    if (SPECS[type].two && rnd() < 0.35) c.pillion = randomLook(rnd);
    c.helmet = SPECS[type].two ? (rnd() < 0.6 ? 1 : 0) : 0;
    this.placeAI(c, 0);
    return c;
  }

  spawnParked(px: number, pz: number, rMin = 60, rMax = 220) {
    const h = this.findPiece(px, pz, rMin, rMax, (p) => p.cls >= RC.tertiary && p.cls <= RC.unknown && !p.elevated && p.w >= 5);
    if (!h) return null;
    const p = h.p;
    const r = rnd();
    const type: VType = r < 0.55 ? 'scooter' : r < 0.72 ? 'bike' : r < 0.8 ? 'auto' : r < 0.92 ? 'hatch' : 'sedan';
    const c = this.makeCar(type);
    const along = p.s[h.k] + (p.s[h.k + 1] - p.s[h.k]) * h.t;
    this.city.roads.pointAt(p, along, tmp);
    const side = rnd() < 0.5 ? 1 : -1;
    const off = p.w / 2 - (SPECS[type].two ? 0.5 : 1.0);
    const x = tmp.x + tmp.dz * off * side, z = tmp.z - tmp.dx * off * side;
    // two-wheelers park at an angle to the kerb, the way they do on every Pune street
    const yaw = Math.atan2(tmp.dx, tmp.dz) + (SPECS[type].two ? side * (Math.PI / 2 - 0.5) : rnd() < 0.5 ? 0 : Math.PI);
    if (this.city.buildings.inside(x, z)) { this.remove(c); return null; }
    c.body.place(x, z, this.city.terrain.height(x, z), yaw);
    c.parked = true;
    c.sync(this.mats);
    return c;
  }

  spawnPed(px: number, pz: number, rMin = 25, rMax = 140) {
    const h = this.findPiece(px, pz, rMin, rMax, (p) => (FOOT(p.cls) || (p.cls >= RC.secondary && p.cls <= RC.unknown)) && !p.elevated && p.len > 6);
    if (!h) return;
    const p = h.p;
    const along = p.s[h.k] + (p.s[h.k + 1] - p.s[h.k]) * h.t;
    const fwd = rnd() < 0.5;
    const side = FOOT(p.cls) ? (rnd() - 0.5) * p.w * 0.6 : (rnd() < 0.5 ? 1 : -1) * (p.w / 2 + 0.9 + rnd() * 0.8);
    const ped: Ped = { look: randomLook(rnd), x: h.x, z: h.z, y: h.y, yaw: 0, piece: p, fwd, s: fwd ? along : p.len - along, side, v: 1.0 + rnd() * 0.6, state: rnd() < 0.12 ? 'idle' : 'walk', t: rnd() * 10, phase: rnd() * 6, shout: 0, id: NEXT_ID++ };
    this.placePed(ped);
    this.peds.push(ped);
  }

  laneFor(c: Car, p: Piece) {
    const half = p.w / 2;
    const two = SPECS[c.type].two;
    const one = (p.flags & 3) !== 0;
    if (c.type === 'bus') return Math.max(0, half - 1.7);
    if (one) return (half - 1) * (two ? 0.2 + c.rr * 0.7 : c.rr * 0.8 - 0.4);
    if (half < 3) return two ? half * 0.35 : 0.2;
    if (two) return Math.max(0.6, half - 0.7 - c.rr * Math.min(2.4, half * 0.5));
    return Math.max(1.0, Math.min(half - 1.2, half * 0.5 + (c.rr - 0.5) * 1.2));
  }

  // ------------------------------------------------------------- AI driving
  private placeAI(c: Car, dt: number) {
    const ai = c.ai!;
    const p = ai.piece;
    this.city.roads.pointAt(p, ai.fwd ? ai.s : p.len - ai.s, tmp);
    let dx = tmp.dx, dz = tmp.dz;
    if (!ai.fwd) { dx = -dx; dz = -dz; }
    ai.lane += (ai.laneT - ai.lane) * Math.min(1, dt * 1.5);
    // keep left: +x is the left of a body facing +z, and (dz, -dx) is left of (dx, dz)
    const lx = dz, lz = -dx;
    const x = tmp.x + lx * ai.lane, z = tmp.z + lz * ai.lane;
    const b = c.body;
    const yaw = Math.atan2(dx, dz);
    let dy = yaw - b.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy));
    if (dt === 0) b.yaw = yaw; else b.yaw += dy * Math.min(1, dt * 6);
    if (dt > 0) { b.vx = (x - b.x) / dt; b.vz = (z - b.z) / dt; }
    b.x = x; b.z = z;
    b.y = p.elevated ? tmp.y : this.city.terrain.height(x, z);
    if (!p.elevated && (p.flags & 4)) b.y = Math.max(b.y, tmp.y);
    b.steer = Math.max(-1, Math.min(1, dy * 3));
    if (SPECS[c.type].two) b.roll = -b.steer * 0.25; else b.roll = 0;
    b.pitch = 0;
  }

  private nextLink(c: Car): Link | null {
    const ai = c.ai!;
    const node = ai.fwd ? ai.piece.b : ai.piece.a;
    const links = this.city.roads.adj[node];
    if (!links || !links.length) return null;
    const cands = links.filter((l) => l.p !== ai.piece && l.p.cls !== RC.track);
    if (!cands.length) return links.find((l) => l.p === ai.piece) ?? null;
    // direction we arrive with
    const p = ai.piece;
    const k = ai.fwd ? p.n - 2 : 1;
    const ax = ai.fwd ? p.x[p.n - 1] - p.x[k] : p.x[0] - p.x[k], az = ai.fwd ? p.z[p.n - 1] - p.z[k] : p.z[0] - p.z[k];
    const al = Math.hypot(ax, az) || 1;
    let total = 0;
    const w = cands.map((l) => {
      const q = l.p, j = l.fwd ? 1 : q.n - 2, o = l.fwd ? 0 : q.n - 1;
      const bx = q.x[j] - q.x[o], bz = q.z[j] - q.z[o], bl = Math.hypot(bx, bz) || 1;
      const straight = (ax * bx + az * bz) / (al * bl);
      const v = (0.4 + RANK(q.cls) * 0.8 + RANK(q.cls) * Math.max(0, RANK(q.cls) - RANK(p.cls)) * 0.3) * (0.6 + Math.max(0, straight) * 1.4) * (q.cls === RC.service ? 0.3 : 1);
      total += v;
      return v;
    });
    let r = rnd() * total;
    for (let i = 0; i < cands.length; i++) { r -= w[i]; if (r <= 0) return cands[i]; }
    return cands[cands.length - 1];
  }

  /** Distance to whatever is ahead in our lane: cars, the player, people. */
  private gapAhead(c: Car, others: { x: number; z: number; len: number; wid: number }[]) {
    const b = c.body, fx = Math.sin(b.yaw), fz = Math.cos(b.yaw);
    const half = c.spec.len / 2, hw = c.spec.wid / 2;
    let gap = 60;
    for (const o of others) {
      const rx = o.x - b.x, rz = o.z - b.z;
      const along = rx * fx + rz * fz;
      if (along <= 0 || along > 40) continue;
      const lat = Math.abs(rx * fz - rz * fx);
      if (lat > hw + o.wid / 2 + 0.35) continue;
      const g = along - half - o.len / 2;
      if (g < gap) gap = g;
    }
    return gap;
  }

  updateAI(dt: number, obstacles: { x: number; z: number; len: number; wid: number; id: number }[]) {
    for (const c of this.cars) {
      const ai = c.ai;
      if (!ai || c.parked) continue;
      const others = obstacles.filter((o) => o.id !== c.id);
      const gap = this.gapAhead(c, others);
      // slow for junctions and bends
      const p = ai.piece;
      const toEnd = p.len - ai.s;
      const node = ai.fwd ? p.b : p.a;
      const deg = this.city.roads.adj[node]?.length ?? 0;
      let vt = ai.vt * (0.85 + ai.mood * 0.3);
      if (deg >= 3 && toEnd < 18) vt *= 0.55 + 0.45 * (toEnd / 18);
      const safe = Math.max(0, (gap - 1.5) * (c.spec.two ? 1.6 : 1.1));
      const want = Math.min(vt, safe);
      const acc = c.spec.accel * 0.8, dec = c.spec.brake;
      if (want > ai.v) ai.v = Math.min(want, ai.v + acc * dt); else ai.v = Math.max(want, ai.v - dec * 1.3 * dt);
      c.braking = want < ai.v - 0.5 || (gap < 4 && ai.v < 1);
      if (gap < 6 && ai.v < 1.5) ai.blockedT += dt; else ai.blockedT = Math.max(0, ai.blockedT - dt * 2);
      ai.honkT -= dt;
      if (ai.honkT <= 0 && (ai.blockedT > 0.8 || rnd() < dt * 0.03)) {
        this.onHonk(c.body.x, c.body.z, c.type === 'bus' || c.type === 'tempo' ? 2 : c.spec.two ? 0 : 1);
        ai.honkT = 1.2 + rnd() * 4;
      }
      // two-wheelers weave: when blocked they look for a gap to the side
      if (c.spec.two && ai.blockedT > 0.6) ai.laneT = Math.max(-p.w / 2 + 0.6, Math.min(p.w / 2 - 0.5, ai.laneT + (c.rr < 0.5 ? -1 : 1) * dt * 1.5));
      ai.s += ai.v * dt;
      while (ai.s > ai.piece.len) {
        const rest = ai.s - ai.piece.len;
        const nl = this.nextLink(c);
        if (!nl) { ai.s = ai.piece.len; ai.v = 0; break; }
        ai.piece = nl.p; ai.fwd = nl.fwd; ai.s = rest;
        ai.vt = speedFor(nl.p.cls);
        ai.laneT = this.laneFor(c, nl.p);
      }
      this.placeAI(c, dt);
      c.sync(this.mats);
    }
  }

  // ------------------------------------------------------------- pedestrians
  private placePed(ped: Ped) {
    const p = ped.piece;
    this.city.roads.pointAt(p, ped.fwd ? ped.s : p.len - ped.s, tmp);
    let dx = tmp.dx, dz = tmp.dz;
    if (!ped.fwd) { dx = -dx; dz = -dz; }
    ped.x = tmp.x + dz * ped.side; ped.z = tmp.z - dx * ped.side;
    ped.y = this.city.terrain.height(ped.x, ped.z) + 0.02;
    ped.yaw = Math.atan2(dx, dz);
  }

  updatePeds(dt: number, threats: { x: number; z: number; vx: number; vz: number; r: number; player: boolean; id: number }[]) {
    for (const ped of this.peds) {
      ped.t += dt;
      ped.shout = Math.max(0, ped.shout - dt);
      if (ped.state === 'fallen') {
        if (ped.t > 3.2) { ped.state = 'flee'; ped.t = 0; ped.v = 4.2; }
        continue;
      }
      // anything coming at us fast knocks us over
      for (const th of threats) {
        const dx = ped.x - th.x, dz = ped.z - th.z, d = Math.hypot(dx, dz);
        const sp = Math.hypot(th.vx, th.vz);
        if (d < th.r + 0.35 && sp > 2.2) {
          ped.state = 'fallen'; ped.t = 0; ped.shout = 2.5;
          ped.x += (dx / (d || 1)) * 0.8; ped.z += (dz / (d || 1)) * 0.8;
          this.onShout(ped, 'hit');
          if (th.player) (this as Traffic).lastPedHit = { ped, speed: sp };
          break;
        }
        // step aside from slow vehicles
        if (d < th.r + 1.4 && sp > 0.5) { ped.side += Math.sign(ped.side || 1) * dt * 1.5; }
      }
      if (ped.state === 'fallen') continue;
      if (ped.state === 'idle') { if (ped.t > 6 + (ped.id % 7)) { ped.state = 'walk'; ped.t = 0; } continue; }
      const sp = ped.state === 'flee' ? ped.v : ped.v;
      ped.s += sp * dt;
      ped.phase += sp * dt * 3.6;
      if (ped.state === 'flee' && ped.t > 6) { ped.state = 'walk'; ped.v = 1.0 + rnd() * 0.6; }
      while (ped.s > ped.piece.len) {
        const node = ped.fwd ? ped.piece.b : ped.piece.a;
        const links = this.city.roads.adj[node]?.filter((l) => l.p !== ped.piece && !l.p.elevated) ?? [];
        // footways are not in the drive graph: walkers turn around at their ends
        if (!links.length) { ped.fwd = !ped.fwd; ped.s = 0; break; }
        const l = links[Math.floor(rnd() * links.length)];
        ped.s -= ped.piece.len; ped.piece = l.p; ped.fwd = l.fwd;
        ped.side = Math.sign(ped.side || 1) * (l.p.w / 2 + 0.9 + rnd() * 0.6);
      }
      this.placePed(ped);
    }
  }
  lastPedHit: { ped: Ped; speed: number } | null = null;

  // ------------------------------------------------------------- upkeep
  upkeep(px: number, pz: number, keep: Set<Car>) {
    const far = 360;
    for (let i = this.cars.length - 1; i >= 0; i--) {
      const c = this.cars[i];
      if (keep.has(c) || c.mission) continue;
      const d = Math.hypot(c.body.x - px, c.body.z - pz);
      if (d > far || (c.parked && d > 260) || (c.body.sunk && d > 60)) this.remove(c);
    }
    this.peds = this.peds.filter((p) => Math.hypot(p.x - px, p.z - pz) < 170);
    const moving = this.cars.filter((c) => c.ai && !c.parked).length;
    const parked = this.cars.filter((c) => c.parked).length;
    for (let k = 0; k < 3 && moving + k < this.maxCars; k++) this.spawnTraffic(px, pz);
    for (let k = 0; k < 2 && parked + k < this.maxParked; k++) this.spawnParked(px, pz);
    for (let k = 0; k < 4 && this.peds.length < this.maxPeds; k++) this.spawnPed(px, pz);
  }

  /** Riders, drivers and pedestrians into the crowd for this frame. */
  drawPeople(t: number) {
    for (const c of this.cars) {
      if (!c.driver) continue;
      const b = c.body, s = c.spec;
      const fx = Math.sin(b.yaw), fz = Math.cos(b.yaw);
      if (s.two) {
        const lean = b.roll;
        const sx = -Math.cos(b.yaw) * Math.sin(lean) * 0.6, sz = Math.sin(b.yaw) * Math.sin(lean) * 0.6;
        this.crowd.draw(c.driver, b.x - fx * 0.15 - sx, b.y + s.seat - 0.15, b.z - fz * 0.15 - sz, b.yaw, Pose.ride, 0, 0, c.helmet, 0);
        if (c.pillion) this.crowd.draw(c.pillion, b.x - fx * 0.55 - sx, b.y + s.seat - 0.12, b.z - fz * 0.55 - sz, b.yaw, Pose.ride, 0, 0, 0, 0);
      } else if (c.type === 'auto') {
        this.crowd.draw(c.driver, b.x + fx * 0.45, b.y + 0.25, b.z + fz * 0.45, b.yaw, Pose.ride, 0, 0, 0);
        if (c.pillion) this.crowd.draw(c.pillion, b.x - fx * 0.6, b.y + 0.25, b.z - fz * 0.6, b.yaw, Pose.ride, 0, 0, 0);
      }
    }
    for (const p of this.peds) {
      const pose = p.state === 'fallen' ? Pose.fallen : p.state === 'idle' ? Pose.stand : p.state === 'flee' ? Pose.run : Pose.walk;
      this.crowd.draw(p.look, p.x, p.y, p.z, p.yaw, pose, p.phase, pose === Pose.run ? 0.9 : 0.55);
    }
    void t;
  }
}
