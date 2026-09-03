import * as THREE from 'three';
import type { Terrain } from './terrain';
import { fleet, fleetMaterial, helicopter, livery, soloTone, type VehicleKind } from './vehicles';

/**
 * The things you drive and fly.
 *
 * Two models, and they are different on purpose.
 *
 * A **road vehicle** is a bicycle model: one steering angle, one speed, and a
 * heading that changes at `speed / wheelbase * tan(steer)`. That single formula
 * is why a rickshaw turns tightly at walking pace and barely at all when it is
 * moving, which is the thing that makes driving feel like driving. Arcade
 * everywhere else — no tyre model, no weight transfer beyond a cosmetic lean —
 * because none of that is visible from a chase camera and all of it is
 * expensive to tune.
 *
 * A **helicopter** is the opposite: a body with an orientation, a lift force
 * along its own up vector, gravity, and drag. There is no "move forward"
 * control at all. You tilt, and the tilt takes you somewhere. It is harder, and
 * it is the only way flying a helicopter feels like anything but driving a
 * flying car.
 */

export interface Controls {
  /** -1 reverse, +1 forward. Also the helicopter's cyclic pitch. */
  throttle: number;
  brake: number;
  /** -1 left, +1 right. Steering, or the helicopter's roll. */
  steer: number;
  /** Helicopter collective: -1 down, +1 up. */
  lift: number;
  /** Helicopter pedals. */
  yaw: number;
  boost: boolean;
}

export function controls(): Controls {
  return { throttle: 0, brake: 0, steer: 0, lift: 0, yaw: 0, boost: false };
}

/** Anything the vehicle cannot drive through. */
export interface Blocked {
  blocked(x: number, z: number): boolean;
}

// ------------------------------------------------------------------- road

export class Ride {
  readonly mesh: THREE.Mesh;
  readonly material: THREE.MeshStandardMaterial;
  kind: VehicleKind;

  pos = new THREE.Vector3();
  heading = 0;
  speed = 0;
  steer = 0;
  /** Metres travelled, for the odometer. */
  odo = 0;

  private roll = 0;
  private pitch = 0;
  private bob = 0;
  private uNight = { value: 0 };
  private tone = soloTone();
  private wheelbase: number;
  private top: number;
  private half: number;

  constructor(private terrain: Terrain, kind: VehicleKind = 'auto') {
    this.kind = kind;
    const spec = fleet()[kind];
    this.material = fleetMaterial(this.uNight, false, this.tone);
    this.mesh = new THREE.Mesh(spec.geometry, this.material);
    this.mesh.castShadow = true;
    this.mesh.frustumCulled = false;
    this.wheelbase = spec.wheelbase;
    this.top = spec.topSpeed;
    this.half = spec.width * 0.5 + 0.3;
    this.setLivery(kind);
  }

  setNight(n: number) {
    this.uNight.value = n;
  }

  /** Swap what you are driving without losing where you are. */
  become(kind: VehicleKind) {
    const spec = fleet()[kind];
    this.kind = kind;
    this.mesh.geometry = spec.geometry;
    this.wheelbase = spec.wheelbase;
    this.top = spec.topSpeed;
    this.half = spec.width * 0.5 + 0.3;
    this.speed = Math.min(this.speed, this.top);
    this.setLivery(kind);
  }

  private setLivery(kind: VehicleKind) {
    const [body, canopy] = livery(kind, Math.random);
    this.tone.uBody.value.copy(body);
    this.tone.uCanopy.value.copy(canopy);
  }

  place(x: number, z: number, heading = 0) {
    this.pos.set(x, this.terrain.height(x, z), z);
    this.heading = heading;
    this.speed = 0;
  }

  get kmh() {
    return Math.abs(this.speed) * 3.6;
  }

  update(dt: number, c: Controls, world: Blocked | null) {
    // Grip and top speed both fall off the road. The test is cheap — a road is
    // wherever the ground has been graded flat — and it is enough to make
    // cutting a corner across a yard feel like a decision.
    const slope = this.terrain.slope(this.pos.x, this.pos.z);
    const wet = this.terrain.height(this.pos.x, this.pos.z) < 0.35;
    const grip = wet ? 0.35 : THREE.MathUtils.clamp(1 - slope * 1.4, 0.42, 1);

    // Drag is tuned off the top speed rather than guessed, so full throttle
    // settles at exactly the number in the spec and a rickshaw does not end up
    // doing sixty-five kilometres an hour.
    const accel = 6.5 + this.top * 0.18;
    const push = c.throttle * (c.boost ? 1.35 : 1) * accel * grip;
    const drag = (accel / this.top) * this.speed;
    const brake = c.brake * Math.sign(this.speed) * 13 * grip;
    this.speed += (push - drag - brake) * dt;
    if (Math.abs(this.speed) < 0.05 && !c.throttle) this.speed = 0;
    const top = this.top * (wet ? 0.4 : 1) * (c.boost ? 1.2 : 1);
    this.speed = THREE.MathUtils.clamp(this.speed, -top * 0.32, top);

    // Steering has a lock, and the lock closes as you speed up — otherwise a
    // full-lock turn at forty is possible and the whole thing feels weightless.
    const lock = 0.62 / (1 + Math.abs(this.speed) * 0.11);
    const wantSteer = c.steer * lock;
    this.steer += (wantSteer - this.steer) * Math.min(1, dt * 7);

    // The bicycle model on its own will happily turn a nine-metre circle at
    // sixty, because nothing in it knows about tyres. Capping the lateral
    // acceleration at what tarmac can actually give is the missing term, and
    // it is also what makes going in too fast feel like going in too fast.
    let turn = (this.speed / this.wheelbase) * Math.tan(this.steer);
    const holds = 8.2 * grip;
    const maxTurn = holds / Math.max(2, Math.abs(this.speed));
    turn = THREE.MathUtils.clamp(turn, -maxTurn, maxTurn) * grip;
    this.heading += turn * dt;

    const nx = this.pos.x + Math.sin(this.heading) * this.speed * dt;
    const nz = this.pos.z + Math.cos(this.heading) * this.speed * dt;
    if (world && world.blocked(nx + Math.sin(this.heading) * this.half, nz + Math.cos(this.heading) * this.half)) {
      // Into a wall. Stop, and give back a little, so you are not stuck in it.
      this.speed *= -0.16;
    } else {
      this.odo += Math.abs(this.speed) * dt;
      this.pos.x = nx;
      this.pos.z = nz;
    }
    this.pos.y = this.terrain.height(this.pos.x, this.pos.z);

    // Attitude. Pitch follows the ground under the wheelbase plus a squat
    // under acceleration; roll is the lean, and a three-wheeler leans hard.
    const ahead = this.terrain.height(this.pos.x + Math.sin(this.heading) * 1.2, this.pos.z + Math.cos(this.heading) * 1.2);
    const behind = this.terrain.height(this.pos.x - Math.sin(this.heading) * 1.2, this.pos.z - Math.cos(this.heading) * 1.2);
    const groundPitch = Math.atan2(ahead - behind, 2.4);
    const squat = THREE.MathUtils.clamp((push - brake) * 0.008, -0.06, 0.06);
    this.pitch += (-groundPitch - squat - this.pitch) * Math.min(1, dt * 8);

    const leanScale = this.kind === 'auto' ? 0.055 : this.kind === 'scooter' ? 0.09 : 0.02;
    const want = THREE.MathUtils.clamp(-turn * Math.abs(this.speed) * leanScale, -0.4, 0.4);
    this.roll += (want - this.roll) * Math.min(1, dt * 6);

    // A little shake, scaled by speed and by how rough the ground is.
    this.bob += dt * (6 + Math.abs(this.speed) * 1.6);
    const rough = (wet ? 0.4 : slope > 0.06 ? 1 : 0.25) * Math.min(1, Math.abs(this.speed) / 8);

    this.mesh.position.set(this.pos.x, this.pos.y + Math.sin(this.bob * 2.3) * 0.012 * rough, this.pos.z);
    this.mesh.rotation.set(
      this.pitch + Math.sin(this.bob * 1.7) * 0.012 * rough,
      this.heading,
      this.roll + Math.sin(this.bob) * 0.018 * rough,
    );
  }

  /** Where the chase camera wants to be, and what it wants to look at. */
  camera(out: { eye: THREE.Vector3; look: THREE.Vector3 }, back: number, high: number) {
    const s = Math.sin(this.heading);
    const c = Math.cos(this.heading);
    out.eye.set(this.pos.x - s * back, this.pos.y + high, this.pos.z - c * back);
    out.look.set(this.pos.x + s * 5, this.pos.y + 1.1, this.pos.z + c * 5);
  }
}

// -------------------------------------------------------------- helicopter

export class Chopper {
  readonly group = new THREE.Group();
  readonly light: THREE.SpotLight;
  pos = new THREE.Vector3(0, 60, 0);
  vel = new THREE.Vector3();
  heading = 0;
  pitch = 0;
  roll = 0;
  spin = 0;
  rpm = 0;
  /** True when the skids are on something. */
  landed = true;

  private rotor: THREE.Mesh;
  private tail: THREE.Mesh;
  private uNight = { value: 0 };
  private tone = soloTone();
  private up = new THREE.Vector3();
  private q = new THREE.Quaternion();

  constructor(private terrain: Terrain) {
    const h = helicopter();
    this.tone.uBody.value.setRGB(0.11, 0.16, 0.13);
    this.tone.uCanopy.value.setRGB(0.72, 0.66, 0.10);
    const mat = fleetMaterial(this.uNight, false, this.tone);
    const body = new THREE.Mesh(h.body, mat);
    body.castShadow = true;
    this.rotor = new THREE.Mesh(h.rotor, mat);
    this.rotor.position.copy(h.hub);
    this.tail = new THREE.Mesh(h.tail, mat);
    this.tail.position.copy(h.tailHub);
    this.tail.rotation.x = Math.PI / 2;
    this.group.add(body, this.rotor, this.tail);
    this.group.frustumCulled = false;

    // A searchlight under the nose. Real, not a sprite, because the thing that
    // makes a night flight read is the cone landing on the roofs below.
    this.light = new THREE.SpotLight(0xfff0d2, 0, 400, 0.19, 0.45, 1.2);
    this.light.position.set(2.6, -0.7, 0);
    this.light.target.position.set(9, -14, 0);
    this.group.add(this.light, this.light.target);
  }

  setNight(n: number) {
    this.uNight.value = n;
  }

  place(x: number, z: number, y = 0) {
    this.pos.set(x, Math.max(this.terrain.height(x, z) + 1.05, y), z);
    this.vel.set(0, 0, 0);
    this.heading = 0;
    this.pitch = 0;
    this.roll = 0;
  }

  get altitude() {
    return this.pos.y - this.terrain.height(this.pos.x, this.pos.z);
  }

  get kmh() {
    return Math.hypot(this.vel.x, this.vel.z) * 3.6;
  }

  update(dt: number, c: Controls) {
    // Collective first: the rotor has to be turning before there is any lift,
    // which is why you cannot flick it off the ground from cold.
    // Neutral has to hold altitude, or letting go of the stick is a crash.
    // 0.87 squared times the thrust constant is very close to one gravity,
    // which is the whole reason that number is what it is.
    const want = c.lift > 0 ? 1 : c.lift < 0 ? 0.30 : this.landed ? 0.0 : 0.87;
    this.rpm += (want - this.rpm) * Math.min(1, dt * 1.7);
    this.spin += dt * this.rpm * 34;

    // Attitude is commanded directly and eased — a real helicopter's cyclic
    // commands a rate, but a rate command on a keyboard is unflyable.
    const tp = -c.throttle * 0.46;
    const tr = c.steer * 0.42;
    this.pitch += (tp - this.pitch) * Math.min(1, dt * 2.6);
    this.roll += (tr - this.roll) * Math.min(1, dt * 2.8);
    this.heading -= c.yaw * dt * 1.25;
    // A banked helicopter turns, even with your feet off the pedals.
    this.heading -= this.roll * dt * 0.55;

    // Lift acts along the rotor disc's own up vector, so tilting the aircraft
    // is the only way to go anywhere. Nothing pushes it forward directly.
    this.q.setFromEuler(new THREE.Euler(this.pitch, this.heading, this.roll, 'YXZ'));
    this.up.set(0, 1, 0).applyQuaternion(this.q);

    // Two terms: what the disc makes at this rpm, and what pulling more pitch
    // into it adds. Split that way so spooling up gets you light on the skids
    // and the collective is what actually takes you off, which is the order it
    // happens in and the only part of a helicopter a keyboard can convey.
    const thrust = this.rpm * this.rpm * 13.2 + this.rpm * Math.max(0, c.lift) * 9.4;
    this.vel.addScaledVector(this.up, thrust * dt);
    this.vel.y -= 9.81 * dt;
    // Drag, harder sideways than forwards, so it settles into the wind.
    this.vel.multiplyScalar(Math.max(0, 1 - dt * 0.26));

    this.pos.addScaledVector(this.vel, dt);

    const floor = this.terrain.height(this.pos.x, this.pos.z) + 1.05;
    if (this.pos.y <= floor) {
      this.pos.y = floor;
      if (this.vel.y < 0) this.vel.y = 0;
      this.vel.x *= 0.86;
      this.vel.z *= 0.86;
      this.landed = true;
      // On the ground it sits level, whatever the stick says.
      this.pitch *= 0.86;
      this.roll *= 0.86;
    } else {
      this.landed = false;
    }
    this.pos.y = Math.min(this.pos.y, 900);

    this.group.position.copy(this.pos);
    this.group.rotation.set(this.pitch, this.heading, this.roll, 'YXZ');
    this.rotor.rotation.y = this.spin;
    this.tail.rotation.y = this.spin * 2.6;
    this.light.intensity = this.lightOn ? 900 : 0;
  }

  lightOn = false;

  camera(out: { eye: THREE.Vector3; look: THREE.Vector3 }, back: number, high: number) {
    const s = Math.sin(this.heading);
    const c = Math.cos(this.heading);
    out.eye.set(this.pos.x - s * back, this.pos.y + high, this.pos.z - c * back);
    out.look.set(this.pos.x + s * 14, this.pos.y - 2, this.pos.z + c * 14);
  }
}
