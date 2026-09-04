import * as THREE from 'three';
import { add, box, finish, parts, profile, wheel } from '../groundplan/build';
import { R } from './world';
import type { World } from './world';

/**
 * The cab, and how it drives.
 *
 * A Bombay black-and-yellow: a small saloon with a high roof, a rounded tail
 * and a meter on the wing. It is built from a side profile extruded across the
 * width, the same way the vehicles next door are, because a car drawn as a side
 * view is a car you can argue about and a car assembled from boxes is not.
 *
 * The physics is arcade and says so. There are no tyre slip curves here: there
 * is a forward speed, a sideways speed, and a grip budget that the sideways
 * speed is bled off against. When you ask for more turn than the budget covers
 * the tail comes round, which is the whole feel of the genre, and the handbrake
 * simply spends the budget faster.
 */

export interface Upgrades {
  engine: number;
  tyres: number;
  brakes: number;
  springs: number;
  bar: number;
  horn: number;
}

export const ZERO_UPGRADES: Upgrades = { engine: 0, tyres: 0, brakes: 0, springs: 0, bar: 0, horn: 0 };

export interface Controls {
  throttle: number;
  brake: number;
  steer: number;
  hand: boolean;
  horn: boolean;
}

export interface Car {
  pos: THREE.Vector3;
  /** Ground-plane velocity. */
  vel: THREE.Vector2;
  heading: number;
  yaw: number;
  /** Vertical speed, for kerbs and ramps. */
  vy: number;
  air: boolean;
  /** How long the wheels have been off the ground, in seconds. */
  airtime: number;
  /** Sideways speed in the car's own frame, kept for the smoke and the sound. */
  slip: number;
  /** Body roll and pitch, eased, purely cosmetic and entirely necessary. */
  lean: number;
  dive: number;
  /** Set for one frame when something is hit. */
  bump: number;
  damage: number;
}

export function makeCar(at: THREE.Vector2, heading: number, y: number): Car {
  return {
    pos: new THREE.Vector3(at.x, y, at.y),
    vel: new THREE.Vector2(),
    heading,
    yaw: 0,
    vy: 0,
    air: false,
    airtime: 0,
    slip: 0,
    lean: 0,
    dive: 0,
    bump: 0,
    damage: 0,
  };
}

/** What the upgrades actually buy. */
export function spec(u: Upgrades) {
  return {
    /** m/s², at rest. */
    accel: 9.2 + u.engine * 2.4,
    /** m/s. */
    top: 31 + u.engine * 4.2,
    /** m/s², and the difference between a good driver and a passenger. */
    brake: 15 + u.brakes * 4.4,
    /** Lateral acceleration the tyres will hold. Dry tarmac is about 8. */
    grip: 8.4 + u.tyres * 1.5,
    /** How much of a bump reaches the passenger. */
    comfort: 1 - u.springs * 0.13,
    /** How much less a smashed prop upsets everyone. */
    armour: u.bar * 0.16,
    hornRange: 9 + u.horn * 6,
  };
}

const WHEELBASE = 2.42;

/**
 * One step.
 *
 * Fixed order, and the order matters: engine, then steering, then the grip
 * budget, then the world. Resolving collisions before the grip pass lets a car
 * that has just been pushed out of a wall keep the sideways speed the wall gave
 * it, and it spins.
 */
export function drive(car: Car, c: Controls, u: Upgrades, world: World, dt: number): Hit[] {
  const s = spec(u);
  const sin = Math.sin(car.heading);
  const cos = Math.cos(car.heading);
  // Forward is +z rotated by the heading; right is that turned a quarter.
  let vf = car.vel.x * sin + car.vel.y * cos;
  let vr = car.vel.x * cos - car.vel.y * sin;

  if (!car.air) {
    // Drive minus drag, with the drag written so that the two balance exactly
    // at the spec'd top speed. The first version tapered the *power* and then
    // added a separate linear drag on top, and the two met at forty-five
    // km/h — a taxi that could not reach half the number on its own tin.
    const power = s.accel * c.throttle;
    const ratio = vf / s.top;
    const drag = s.accel * ratio * Math.abs(ratio);
    vf += (power - drag) * dt;
    // Braking is not negative throttle: it acts against the direction of
    // travel and cannot push the car backwards through zero in one step.
    if (c.brake > 0) {
      const stop = Math.min(Math.abs(vf), s.brake * c.brake * dt);
      vf -= Math.sign(vf) * stop;
      if (c.throttle < 0.1 && Math.abs(vf) < 0.4) vf -= c.brake * 3.6 * dt;
    }
    // Rolling resistance: constant, so the car actually comes to rest instead
    // of creeping forever on an exponential.
    vf -= Math.sign(vf) * Math.min(Math.abs(vf), 0.85 * dt);

    // Steering falls off with speed, or the car is undriveable above thirty.
    const lock = 0.62 * (1 - Math.min(0.68, Math.abs(vf) / 44));
    const angle = c.steer * lock;
    const want = (vf / WHEELBASE) * Math.tan(angle);
    car.yaw += (want - car.yaw) * Math.min(1, dt * 12);
    car.heading += car.yaw * dt;

    // The grip budget. Turning throws sideways speed into the tyres and this
    // is where it is taken back out; when the demand is more than the budget,
    // the surplus stays as slide.
    const budget = s.grip * (c.hand ? 0.34 : 1) * (Math.abs(c.throttle) > 0.7 && Math.abs(vf) < 12 ? 0.75 : 1);
    vr += car.yaw * vf * dt;
    const bleed = Math.min(Math.abs(vr), budget * dt);
    vr -= Math.sign(vr) * bleed;
    car.slip = vr;
    // A sliding car scrubs speed, which is what stops the handbrake being free.
    vf -= Math.min(Math.abs(vf), Math.abs(vr) * 0.42 * dt) * Math.sign(vf);
  } else {
    car.airtime += dt;
    car.heading += car.yaw * dt;
  }

  car.vel.set(vf * sin + vr * cos, vf * cos - vr * sin);
  car.pos.x += car.vel.x * dt;
  car.pos.z += car.vel.y * dt;

  // Height. The ground is a function, so a hillside is free; the wheels are
  // eased onto it so kerbs and crests throw the car rather than teleporting it.
  const floor = world.ground(car.pos.x, car.pos.z);
  car.vy -= 26 * dt;
  car.pos.y += car.vy * dt;
  if (car.pos.y <= floor) {
    if (car.air && car.vy < -6) car.bump = Math.min(1, -car.vy / 22);
    car.pos.y = floor;
    car.vy = 0;
    car.air = false;
    car.airtime = 0;
  } else if (car.pos.y > floor + 0.06) {
    car.air = true;
  }

  const hits = collide(car, world, s);

  // Cosmetics. A car that does not lean is a brick, and the amount of lean is
  // most of what tells you how close to the limit you are.
  const lean = THREE.MathUtils.clamp(-car.slip * 0.06 - car.yaw * Math.abs(vf) * 0.012, -0.34, 0.34);
  car.lean += (lean - car.lean) * Math.min(1, dt * 9);
  const dive = THREE.MathUtils.clamp((c.brake * 0.9 - c.throttle * 0.4) * 0.09, -0.06, 0.11);
  car.dive += (dive - car.dive) * Math.min(1, dt * 8);
  car.bump *= Math.max(0, 1 - dt * 6);
  return hits;
}

export interface Hit {
  kind: 'wall' | 'prop' | 'edge';
  /** 0..1, how hard. */
  force: number;
  at: THREE.Vector3;
  prop?: number;
}

/**
 * The world pushing back.
 *
 * Buildings are axis-aligned boxes and the car is a circle, which is wrong and
 * completely adequate: at these speeds the player reads a collision as "I hit
 * the corner of that", and a circle against a box gets the corner right. What
 * matters is that the *response* is right — the speed into the wall is lost and
 * the speed along it is kept, so scraping down a street is fast and hitting the
 * end of it is not.
 */
function collide(car: Car, world: World, s: ReturnType<typeof spec>): Hit[] {
  const hits: Hit[] = [];
  const rad = 1.5;
  for (const b of world.solids) {
    const dx = car.pos.x - b.x;
    const dz = car.pos.z - b.z;
    if (Math.abs(dx) > b.hx + rad || Math.abs(dz) > b.hz + rad) continue;
    if (car.pos.y > b.y + b.h) continue;
    const cx = THREE.MathUtils.clamp(dx, -b.hx, b.hx);
    const cz = THREE.MathUtils.clamp(dz, -b.hz, b.hz);
    let nx = dx - cx;
    let nz = dz - cz;
    let d = Math.hypot(nx, nz);
    if (d > rad) continue;
    if (d < 1e-4) {
      // Dead centre of a face: push out the short way.
      nx = Math.abs(dx) / b.hx > Math.abs(dz) / b.hz ? Math.sign(dx) : 0;
      nz = nx === 0 ? Math.sign(dz) : 0;
      d = 1;
    } else {
      nx /= d;
      nz /= d;
    }
    const into = car.vel.x * nx + car.vel.y * nz;
    car.pos.x += nx * (rad - d);
    car.pos.z += nz * (rad - d);
    if (into < 0) {
      // Keep the component along the wall, lose most of the one into it.
      car.vel.x -= nx * into * 1.35;
      car.vel.y -= nz * into * 1.35;
      const force = Math.min(1, -into / 18);
      if (force > 0.04) {
        car.bump = Math.max(car.bump, force);
        car.damage = Math.min(1, car.damage + force * 0.09);
        hits.push({ kind: 'wall', force, at: car.pos.clone() });
      }
    }
  }

  // Street furniture. A thing either goes over or it does not; how fast you
  // were going decides how far the pieces travel, not whether it moves.
  const speed = car.vel.length();
  for (let i = 0; i < world.props.length; i++) {
    const p = world.props[i];
    if (p.dead) continue;
    const dx = car.pos.x - p.x;
    const dz = car.pos.z - p.z;
    const reach = p.r + rad;
    if (dx * dx + dz * dz > reach * reach) continue;
    if (!p.fixed) {
      p.dead = true;
      const force = Math.min(1, speed / 26);
      car.vel.multiplyScalar(1 - Math.min(0.3, (p.r * 0.1) / Math.max(1, speed * 0.06)));
      car.bump = Math.max(car.bump, force * (1 - s.armour) * 0.7);
      hits.push({ kind: 'prop', force, at: new THREE.Vector3(p.x, p.y, p.z), prop: i });
    } else {
      // Immovable. Same response as a wall, and it hurts.
      const d = Math.max(0.01, Math.hypot(dx, dz));
      const nx = dx / d;
      const nz = dz / d;
      const into = car.vel.x * nx + car.vel.y * nz;
      car.pos.x += nx * (reach - d);
      car.pos.z += nz * (reach - d);
      if (into < 0) {
        car.vel.x -= nx * into * 1.5;
        car.vel.y -= nz * into * 1.5;
        const force = Math.min(1, -into / 16);
        car.bump = Math.max(car.bump, force);
        car.damage = Math.min(1, car.damage + force * 0.11);
        hits.push({ kind: 'wall', force, at: new THREE.Vector3(p.x, p.y, p.z) });
      }
    }
  }

  // The edge of the map, which is the sea or a drop.
  const lim = world.half + world.place.pitch * 0.5;
  for (const axis of ['x', 'z'] as const) {
    const v = car.pos[axis];
    if (Math.abs(v) > lim) {
      car.pos[axis] = Math.sign(v) * lim;
      const key = axis === 'x' ? 'x' : 'y';
      const into = car.vel[key];
      car.vel[key] = -into * 0.2;
      if (Math.abs(into) > 4) hits.push({ kind: 'edge', force: Math.min(1, Math.abs(into) / 20), at: car.pos.clone() });
    }
  }
  return hits;
}

/**
 * The model.
 *
 * A side profile extruded, with the greenhouse a second, narrower profile on
 * top of it. `[0, 0]` is the middle of the back axle at ground level, so the
 * numbers below are the shape you would see from the kerb.
 */
export function taxiModel(): { geometry: THREE.BufferGeometry; wheels: THREE.BufferGeometry } {
  const out = parts();
  // The rear axle is x = 0 and the front axle is x = WHEELBASE, so the boot is
  // the negative overhang and the bonnet the positive one. A saloon has more
  // boot behind the back axle than my first attempt gave it, which made the car
  // look like it was permanently about to tip over backwards.
  const body = profile(
    [
      [-1.05, 0.34],
      [-0.97, 0.74],
      [-0.4, 0.88],
      [0.9, 0.92],
      [2.0, 0.9],
      [2.9, 0.8],
      [3.28, 0.62],
      [3.3, 0.34],
      [2.9, 0.24],
      [-0.6, 0.24],
    ],
    1.62,
    0.1,
  );
  add(out, body, R.paint);
  // The greenhouse: a separate, narrower profile, which is the one thing that
  // stops an extruded car reading as a bar of soap.
  const roof = profile(
    [
      [-0.28, 0.88],
      [0.2, 1.44],
      [1.3, 1.48],
      [1.95, 0.9],
    ],
    1.42,
    0.06,
  );
  add(out, roof, R.paint);
  const glassF = profile(
    [
      [1.4, 0.94],
      [1.92, 0.92],
      [1.42, 1.44],
    ],
    1.36,
    0.02,
  );
  add(out, glassF, R.glass);
  const glassB = profile(
    [
      [-0.2, 0.94],
      [0.22, 1.44],
      [0.18, 0.92],
    ],
    1.36,
    0.02,
  );
  add(out, glassB, R.glass);
  for (const z of [-1, 1]) {
    const side = box(1.1, 0.42, 0.04);
    side.translate(0.82, 1.18, z * 0.7);
    add(out, side, R.glass);
  }
  for (const x of [-1.13, 3.38]) {
    const bump = box(0.22, 0.28, 1.62, 0.08);
    bump.translate(x, 0.46, 0);
    add(out, bump, R.metal);
  }
  for (const z of [-0.55, 0.55]) {
    const lamp = box(0.14, 0.24, 0.34, 0.08);
    lamp.translate(3.26, 0.66, z);
    add(out, lamp, R.glow);
    const tail = box(0.12, 0.2, 0.26, 0.06);
    tail.translate(-1.08, 0.64, z);
    add(out, tail, R.cone);
  }
  const sign = box(0.42, 0.26, 0.92, 0.08);
  sign.translate(0.8, 1.6, 0);
  add(out, sign, R.sign);
  const meter = box(0.24, 0.3, 0.12, 0.04);
  meter.translate(2.3, 1.0, 0.78);
  add(out, meter, R.metal);
  for (const x of [0, WHEELBASE]) {
    for (const z of [-1, 1]) {
      const arch = box(1.2, 0.5, 0.12, 0.2);
      arch.translate(x, 0.66, z * 0.8);
      add(out, arch, R.tyre);
    }
  }

  const geometry = finish(out);
  // The parts kit builds a vehicle looking along +x, because that is the axis
  // you draw a side view on. The physics has forward as +z, because that is
  // where `heading = 0` points. One of them has to give, and it is cheaper to
  // turn the geometry once at build time than to carry a quarter turn through
  // every frame — and far cheaper than the bug it caused, which was a taxi that
  // drove sideways down every street in the game.
  geometry.rotateY(-Math.PI / 2);

  const tyres = parts();
  wheel(0.34, 0.24, tyres, 0, 0.34, 0);
  return { geometry, wheels: finish(tyres) };
}

export { WHEELBASE };
