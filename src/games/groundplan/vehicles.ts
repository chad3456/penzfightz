import * as THREE from 'three';
import { ROLE, add, box, finish, lathe, pair, parts, shell, smoothProfile, tube, wheel } from './build';

/**
 * The fleet.
 *
 * Every one of these is a silhouette first. You know an auto rickshaw from two
 * hundred metres because of the nose that drops to a single front wheel and the
 * long fall of the hood to a flat back; you know a double-decker because it is
 * a tall slab with two rows of windows. Get the profile right and the detail is
 * decoration. Get the profile wrong and no amount of detail rescues it.
 *
 * So the bodies are side profiles extruded across the vehicle with a bevel, and
 * the round things — fuselages, water tanks, lamps — are solids of revolution.
 * Everything merges into one indexed geometry with a role per vertex, so a
 * hundred of anything is one draw call.
 *
 * Dimensions are real, in metres, because they have to sit correctly on a road
 * whose lane width is also real.
 */

export type VehicleKind = 'auto' | 'taxi' | 'bus' | 'truck' | 'scooter' | 'jeep' | 'car';

export interface Spec {
  geometry: THREE.BufferGeometry;
  /** Distance between axles, for the steering model. */
  wheelbase: number;
  length: number;
  width: number;
  height: number;
  /** Flat-out, in metres per second. Real numbers: an auto does about 47. */
  topSpeed: number;
  /** How much of the fleet is this, roughly, in a Mumbai street. */
  share: number;
}

// --------------------------------------------------------------- rickshaw

/**
 * The auto rickshaw.
 *
 * 2.6 m long, 1.3 m wide, 1.7 m tall, and the whole thing hangs off a single
 * front wheel — which is why it leans so far in a corner and why the driving
 * model further on gives it a roll term the four-wheelers do not get.
 */
function auto(): THREE.BufferGeometry {
  const o = parts();

  // The tub. It stops short of the front wheel, which is the whole trick: an
  // auto's body does not reach the nose, the nose is a separate blade hung off
  // the steering, and the gap between the two is where you can see the wheel.
  add(o, smoothProfile([
    [-1.22, 0.32], [-1.26, 0.68], [-1.10, 0.88], [0.34, 0.88],
    [0.66, 0.84], [0.90, 0.68], [0.96, 0.46], [0.86, 0.32],
  ], 1.14, 0.08, 0.035), ROLE.body);

  // The nose blade: narrow, tall, and pointed, standing between the driver's
  // knees and carrying the lamp.
  add(o, smoothProfile([
    [0.60, 0.34], [1.02, 0.36], [1.30, 0.66], [1.28, 1.04], [1.02, 1.18], [0.74, 1.06], [0.58, 0.78],
  ], 0.44, 0.06, 0.03), ROLE.body);

  // The hood: a curve given ten centimetres of thickness. Drawn as a closed
  // outline it comes out a solid dome, which is what an auto emphatically is
  // not — the sides are open and you can see straight through it.
  add(o, shell([
    [1.06, 1.18], [1.12, 1.38], [0.96, 1.54], [0.58, 1.65],
    [-0.30, 1.70], [-0.92, 1.66], [-1.20, 1.50], [-1.26, 1.28],
  ], 0.09, 1.20, 0.03), ROLE.canopy);

  // Windscreen, filling the gap between the nose and the front of the hood.
  const glass = smoothProfile([[0.90, 1.02], [1.06, 1.16], [1.12, 1.40], [0.86, 1.44], [0.78, 1.10]], 1.06, 0.05, 0.02);
  add(o, glass, ROLE.glass);
  pair(o, tube([[1.02, 1.12, 0], [1.08, 1.30, 0], [0.92, 1.46, 0]], 0.022, 8), ROLE.trim, 0.52);

  // The back: a panel with a small window, in the hood's colour.
  const backPanel = smoothProfile([[-1.26, 0.86], [-1.30, 1.34], [-1.16, 1.46], [-1.12, 0.86]], 1.14, 0.06, 0.03);
  add(o, backPanel, ROLE.canopy);
  const backGlass = box(0.05, 0.28, 0.66, 0.02);
  backGlass.translate(-1.12, 1.22, 0);
  add(o, backGlass, ROLE.glass);

  // Passenger bench and the driver's saddle.
  const bench = box(0.58, 0.16, 0.92, 0.05);
  bench.translate(-0.62, 0.92, 0);
  add(o, bench, ROLE.seat);
  const backRest = box(0.12, 0.40, 0.92, 0.05);
  backRest.translate(-1.04, 1.12, 0);
  add(o, backRest, ROLE.seat);
  const saddle = box(0.40, 0.14, 0.42, 0.06);
  saddle.translate(0.30, 0.94, 0);
  add(o, saddle, ROLE.seat);

  // Handlebars across, and the column down to the fork.
  add(o, tube([[0.80, 1.02, -0.30], [0.86, 1.04, 0], [0.80, 1.02, 0.30]], 0.022, 10), ROLE.chrome);
  add(o, tube([[0.86, 1.04, 0], [0.96, 0.84, 0], [1.06, 0.60, 0]], 0.030, 8), ROLE.chrome);

  // Fork, mudguard, wheel. The mudguard is a slice of a torus, which is the
  // only way to get the shape without it reading as a bent plate.
  pair(o, tube([[1.00, 0.96, 0], [1.06, 0.62, 0], [1.10, 0.30, 0]], 0.024, 8), ROLE.chrome, 0.11);
  const guard = new THREE.TorusGeometry(0.35, 0.04, 6, 14, Math.PI * 0.85);
  guard.rotateY(Math.PI / 2);
  guard.rotateX(Math.PI * 0.08);
  guard.translate(1.10, 0.30, 0);
  add(o, guard, ROLE.body);
  wheel(0.28, 0.13, o, 1.10, 0.28, 0);
  wheel(0.30, 0.16, o, -0.92, 0.30, 0.60);
  wheel(0.30, 0.16, o, -0.92, 0.30, -0.60);

  // Lamp set into the blade, indicators on the hood corners, plate at the back.
  const lampBowl = lathe([[0, 0], [0.055, 0.004], [0.065, 0.04], [0.045, 0.065], [0, 0.07]], 12);
  lampBowl.rotateZ(-Math.PI / 2);
  lampBowl.translate(1.27, 0.82, 0);
  add(o, lampBowl, ROLE.lampFront);
  pair(o, box(0.05, 0.07, 0.06, 0.015).translate(1.08, 1.24, 0), ROLE.amber, 0.50);
  pair(o, box(0.05, 0.07, 0.06, 0.015).translate(-1.28, 0.74, 0), ROLE.lampRear, 0.38);
  const plate = box(0.03, 0.13, 0.30, 0.01);
  plate.translate(-1.29, 0.58, 0);
  add(o, plate, ROLE.chrome);

  return finish(o);
}

// ------------------------------------------------------------------- taxi

/** The black-and-yellow saloon: a small sixties body, still on the road. */
function taxi(): THREE.BufferGeometry {
  const o = parts();
  add(o, smoothProfile([
    [-2.02, 0.34], [-2.06, 0.64], [-1.68, 0.80], [-1.30, 0.82],
    [1.28, 0.82], [1.72, 0.78], [2.04, 0.64], [2.06, 0.36], [1.86, 0.26], [-1.84, 0.26],
  ], 1.44, 0.10, 0.045), ROLE.body);

  // Greenhouse, inboard of the body so a shoulder line shows, and shorter than
  // the cabin so there are visible pillars at each end.
  add(o, smoothProfile([
    [-1.34, 0.78], [-1.44, 1.08], [-1.00, 1.34], [0.50, 1.36], [1.00, 1.06], [1.06, 0.78],
  ], 1.30, 0.12, 0.04), ROLE.canopy);
  const side = box(2.16, 0.40, 1.34, 0.04);
  side.translate(-0.22, 1.04, 0);
  add(o, side, ROLE.glass);
  const screen = smoothProfile([[0.92, 0.86], [1.02, 1.06], [0.82, 1.30], [0.74, 0.90]], 1.24, 0.05, 0.02);
  add(o, screen, ROLE.glass);

  // Bumpers as bars, not tubes: a bent tube reads as a scribble at this size.
  const bumper = box(0.16, 0.15, 1.44, 0.06);
  add(o, bumper.clone().translate(2.06, 0.48, 0), ROLE.chrome);
  add(o, bumper.clone().translate(-2.06, 0.48, 0), ROLE.chrome);
  bumper.dispose();

  const lamp = lathe([[0, 0], [0.10, 0.005], [0.115, 0.06], [0, 0.075]], 12);
  lamp.rotateZ(-Math.PI / 2);
  lamp.translate(2.04, 0.68, 0);
  pair(o, lamp, ROLE.lampFront, 0.50);
  const tail = box(0.05, 0.11, 0.22, 0.02);
  pair(o, tail.clone().translate(-2.06, 0.66, 0), ROLE.lampRear, 0.52);
  tail.dispose();

  // The roof sign, which is most of why it is a taxi and not a car.
  const sign = box(0.22, 0.12, 0.42, 0.04);
  sign.translate(-0.16, 1.42, 0);
  add(o, sign, ROLE.lampFront);

  for (const [x, z] of [[1.32, 0.74], [1.32, -0.74], [-1.32, 0.74], [-1.32, -0.74]]) wheel(0.33, 0.21, o, x, 0.33, z);
  return finish(o);
}

// -------------------------------------------------------------------- bus

/** The red double-decker: 10.5 m, two rows of windows, and a rounded roof. */
function bus(): THREE.BufferGeometry {
  const o = parts();
  add(o, smoothProfile([
    [-5.2, 0.62], [-5.26, 3.86], [-4.7, 4.28], [4.5, 4.28],
    [5.24, 3.80], [5.30, 1.30], [5.14, 0.86], [5.18, 0.62],
  ], 2.48, 0.26, 0.10), ROLE.body);

  // Two decks of glass, run as one long band each; the pillars are the body
  // showing through where the band stops short of the ends.
  const lower = box(9.1, 0.92, 2.52, 0.06);
  lower.translate(-0.2, 1.72, 0);
  add(o, lower, ROLE.glass);
  const upper = box(9.3, 0.92, 2.52, 0.06);
  upper.translate(-0.2, 3.32, 0);
  add(o, upper, ROLE.glass);
  const front = box(0.1, 1.5, 2.3, 0.05);
  front.translate(5.22, 2.5, 0);
  add(o, front, ROLE.glass);

  // Destination board over the cab, and the waistline the livery is painted on.
  const board = box(0.12, 0.36, 2.0, 0.03);
  board.translate(5.26, 3.42, 0);
  add(o, board, ROLE.lampFront);
  const band = box(10.3, 0.22, 2.54, 0.04);
  band.translate(0, 2.44, 0);
  add(o, band, ROLE.canopy);

  for (const [x, z] of [[3.5, 1.24], [3.5, -1.24], [-3.1, 1.24], [-3.1, -1.24], [-4.1, 1.24], [-4.1, -1.24]]) {
    wheel(0.52, 0.30, o, x, 0.52, z);
  }
  const lamp = box(0.12, 0.22, 0.3, 0.04);
  pair(o, lamp.clone().translate(5.3, 1.0, 0), ROLE.lampFront, 0.9);
  pair(o, lamp.clone().translate(-5.28, 1.0, 0), ROLE.lampRear, 0.9);
  lamp.dispose();
  return finish(o);
}

// ------------------------------------------------------------------ truck

/** A bonneted lorry with a slatted body and a painted tailboard. */
function truck(): THREE.BufferGeometry {
  const o = parts();
  add(o, smoothProfile([
    [-4.4, 0.62], [-4.4, 1.06], [1.2, 1.06], [1.2, 0.98],
    [3.0, 0.94], [3.3, 0.72], [3.3, 0.5], [-4.3, 0.5],
  ], 2.3, 0.10, 0.06), ROLE.trim);

  // Cab and bonnet, as one profile so the scuttle line is continuous.
  add(o, smoothProfile([
    [0.2, 1.02], [0.2, 2.5], [1.0, 2.62], [1.9, 2.5], [1.95, 1.7],
    [3.05, 1.55], [3.35, 1.25], [3.3, 0.98],
  ], 2.2, 0.16, 0.06), ROLE.body);
  const cabGlass = box(0.1, 0.72, 2.0, 0.04);
  cabGlass.rotateZ(-0.16);
  cabGlass.translate(1.92, 2.16, 0);
  add(o, cabGlass, ROLE.glass);

  // The body: a floor, two slatted sides and a tailboard.
  const floor = box(5.4, 0.14, 2.3, 0.03);
  floor.translate(-1.9, 1.14, 0);
  add(o, floor, ROLE.canopy);
  for (let i = 0; i < 7; i++) {
    const slat = box(0.12, 1.0, 2.32, 0.02);
    slat.translate(-4.3 + i * 0.86, 1.66, 0);
    add(o, slat, ROLE.canopy);
  }
  const tailboard = box(0.14, 1.0, 2.32, 0.04);
  tailboard.translate(-4.42, 1.66, 0);
  add(o, tailboard, ROLE.canopy);

  for (const [x, z] of [[2.2, 1.14], [2.2, -1.14], [-2.6, 1.14], [-2.6, -1.14], [-3.5, 1.14], [-3.5, -1.14]]) {
    wheel(0.5, 0.26, o, x, 0.5, z);
  }
  const lamp = box(0.1, 0.2, 0.26, 0.03);
  pair(o, lamp.clone().translate(3.3, 1.0, 0), ROLE.lampFront, 0.8);
  pair(o, lamp.clone().translate(-4.44, 0.9, 0), ROLE.lampRear, 0.9);
  lamp.dispose();
  return finish(o);
}

// ---------------------------------------------------------------- scooter

/** A scooter with somebody on it, because an empty one looks parked. */
function scooter(): THREE.BufferGeometry {
  const o = parts();
  add(o, smoothProfile([
    [-0.62, 0.42], [-0.66, 0.62], [-0.1, 0.66], [0.36, 0.60],
    [0.52, 0.72], [0.60, 0.60], [0.5, 0.40], [-0.5, 0.36],
  ], 0.36, 0.09, 0.03), ROLE.body);
  add(o, tube([[0.52, 0.70, 0], [0.58, 0.94, 0], [0.56, 1.08, 0]], 0.028, 8), ROLE.chrome);
  add(o, tube([[0.56, 1.08, -0.24], [0.58, 1.10, 0], [0.56, 1.08, 0.24]], 0.022, 8), ROLE.chrome);
  const seat = box(0.5, 0.10, 0.30, 0.05);
  seat.translate(-0.2, 0.72, 0);
  add(o, seat, ROLE.seat);
  wheel(0.22, 0.10, o, 0.54, 0.22, 0);
  wheel(0.22, 0.10, o, -0.56, 0.22, 0);
  const lamp = lathe([[0, 0], [0.07, 0.01], [0.08, 0.05], [0, 0.06]], 10);
  lamp.rotateZ(-Math.PI / 2);
  lamp.translate(0.62, 0.98, 0);
  add(o, lamp, ROLE.lampFront);

  // Rider: legs, torso, head, helmet. Four capsules and a sphere is plenty at
  // the size a scooter occupies on screen.
  const legs = new THREE.CapsuleGeometry(0.11, 0.36, 4, 8);
  legs.rotateZ(0.4);
  legs.translate(0.06, 0.66, 0);
  add(o, legs, ROLE.seat);
  const torso = new THREE.CapsuleGeometry(0.15, 0.34, 4, 8);
  torso.rotateZ(-0.22);
  torso.translate(-0.14, 1.06, 0);
  add(o, torso, ROLE.canopy);
  const head = new THREE.SphereGeometry(0.115, 10, 8);
  head.translate(-0.06, 1.36, 0);
  add(o, head, ROLE.trim);
  return finish(o);
}

// ------------------------------------------------------------------- jeep

/** An open utility. Roll bar, flat screen, spare on the back. */
function jeep(): THREE.BufferGeometry {
  const o = parts();
  add(o, smoothProfile([
    [-2.1, 0.42], [-2.14, 1.06], [-0.5, 1.10], [0.5, 1.06],
    [1.5, 1.02], [2.1, 0.96], [2.16, 0.5], [1.9, 0.36], [-1.9, 0.36],
  ], 1.72, 0.12, 0.06), ROLE.body);
  const screen = box(0.08, 0.5, 1.6, 0.03);
  screen.rotateZ(-0.18);
  screen.translate(0.62, 1.32, 0);
  add(o, screen, ROLE.glass);
  add(o, tube([
    [0.55, 1.10, -0.78], [0.55, 1.62, -0.78], [-1.1, 1.72, -0.78],
    [-1.1, 1.72, 0.78], [0.55, 1.62, 0.78], [0.55, 1.10, 0.78],
  ], 0.045, 26), ROLE.chrome);
  const bench = box(0.7, 0.14, 1.5, 0.05);
  bench.translate(-0.3, 1.02, 0);
  add(o, bench, ROLE.seat);
  const bonnet = box(1.2, 0.1, 1.6, 0.05);
  bonnet.translate(1.5, 1.06, 0);
  add(o, bonnet, ROLE.canopy);
  const spare = new THREE.CylinderGeometry(0.34, 0.34, 0.2, 14);
  spare.rotateX(Math.PI / 2);
  spare.translate(-2.2, 0.95, 0);
  add(o, spare, ROLE.tyre);
  for (const [x, z] of [[1.35, 0.88], [1.35, -0.88], [-1.35, 0.88], [-1.35, -0.88]]) wheel(0.38, 0.24, o, x, 0.38, z);
  const lamp = lathe([[0, 0], [0.13, 0.01], [0.15, 0.08], [0, 0.10]], 12);
  lamp.rotateZ(-Math.PI / 2);
  pair(o, lamp, ROLE.lampFront, 0.55);
  return finish(o);
}

/** A plain saloon, so the traffic is not all rickshaws and buses. */
function car(): THREE.BufferGeometry {
  const o = parts();
  add(o, smoothProfile([
    [-1.98, 0.32], [-2.04, 0.68], [-1.5, 0.84], [1.5, 0.84],
    [2.02, 0.68], [2.04, 0.36], [1.84, 0.26], [-1.84, 0.26],
  ], 1.54, 0.14, 0.045), ROLE.body);
  add(o, smoothProfile([
    [-1.30, 0.80], [-1.16, 1.22], [-0.2, 1.34], [0.70, 1.24], [1.14, 0.80],
  ], 1.40, 0.16, 0.04), ROLE.body);
  const side = box(2.0, 0.34, 1.44, 0.04);
  side.translate(-0.22, 1.06, 0);
  add(o, side, ROLE.glass);
  const lamp = box(0.09, 0.13, 0.32, 0.03);
  pair(o, lamp.clone().translate(2.0, 0.64, 0), ROLE.lampFront, 0.52);
  pair(o, lamp.clone().translate(-2.02, 0.66, 0), ROLE.lampRear, 0.52);
  lamp.dispose();
  for (const [x, z] of [[1.3, 0.78], [1.3, -0.78], [-1.3, 0.78], [-1.3, -0.78]]) wheel(0.33, 0.22, o, x, 0.33, z);
  return finish(o);
}

// ------------------------------------------------------------- helicopter

export interface Heli {
  body: THREE.BufferGeometry;
  /** The main rotor, separate so it can be spun. */
  rotor: THREE.BufferGeometry;
  tail: THREE.BufferGeometry;
  /** Where the rotors sit, in the body's own space. */
  hub: THREE.Vector3;
  tailHub: THREE.Vector3;
}

/**
 * A light utility helicopter.
 *
 * The fuselage is a solid of revolution about the long axis — lathed around Y
 * and then laid on its side — because a helicopter body is a body of
 * revolution and anything extruded from a profile comes out looking like a bus.
 */
export function helicopter(): Heli {
  const o = parts();

  const hull = lathe([
    [0.00, 3.30], [0.34, 3.18], [0.66, 2.86], [0.92, 2.30], [1.06, 1.50],
    [1.10, 0.60], [1.04, -0.40], [0.86, -1.20], [0.56, -1.90], [0.30, -2.40],
    [0.20, -3.00], [0.17, -4.60], [0.15, -6.10], [0.00, -6.20],
  ], 20);
  hull.rotateZ(-Math.PI / 2);
  add(o, hull, ROLE.body);

  // The bubble canopy: the same revolution, in glass, capping the nose.
  const bubble = lathe([
    [0.00, 3.34], [0.36, 3.20], [0.70, 2.88], [0.96, 2.32], [1.10, 1.52], [1.13, 0.90], [0.0, 0.90],
  ], 20);
  bubble.rotateZ(-Math.PI / 2);
  add(o, bubble, ROLE.glass);

  // Engine housing over the cabin, and the mast coming out of it.
  const deck = smoothProfile([[-0.9, 1.05], [-0.9, 1.55], [0.9, 1.62], [1.2, 1.15]], 1.1, 0.18, 0.06);
  add(o, deck, ROLE.trim);
  add(o, tube([[0, 1.55, 0], [0, 2.05, 0]], 0.10, 6), ROLE.chrome);

  // Tail fin and the horizontal stabiliser.
  add(o, smoothProfile([[-6.1, 0.15], [-6.4, 1.35], [-5.5, 1.30], [-5.0, 0.2]], 0.16, 0.14, 0.04), ROLE.body);
  const stab = box(1.0, 0.08, 2.1, 0.04);
  stab.translate(-5.1, 0.35, 0);
  add(o, stab, ROLE.body);

  // Skids: two runners on four struts, which is the shape you actually see
  // from below and the thing that says "helicopter" when it is above you.
  for (const z of [-1.0, 1.0]) {
    add(o, tube([[2.0, -0.95, z], [0.6, -1.05, z], [-1.4, -1.02, z], [-2.2, -0.86, z]], 0.055, 12), ROLE.chrome);
    add(o, tube([[1.1, 0.05, z * 0.55], [1.05, -0.55, z * 0.9], [1.0, -1.02, z]], 0.048, 8), ROLE.chrome);
    add(o, tube([[-0.9, 0.05, z * 0.55], [-0.95, -0.55, z * 0.9], [-1.0, -1.02, z]], 0.048, 8), ROLE.chrome);
  }

  const beacon = new THREE.SphereGeometry(0.09, 8, 6);
  beacon.translate(0, 1.66, 0);
  add(o, beacon, ROLE.lampRear);
  const landing = lathe([[0, 0], [0.14, 0.01], [0.16, 0.08], [0, 0.10]], 12);
  landing.rotateZ(Math.PI / 2);
  landing.translate(2.9, -0.5, 0);
  add(o, landing, ROLE.lampFront);

  // Main rotor: hub, mast head and four blades with a little coning.
  const r = parts();
  const hubCap = new THREE.CylinderGeometry(0.22, 0.30, 0.26, 12);
  add(r, hubCap, ROLE.chrome);
  for (let i = 0; i < 4; i++) {
    const blade = box(5.6, 0.05, 0.34, 0.02);
    blade.translate(2.9, 0.02, 0);
    blade.rotateZ(0.045);
    blade.rotateY((i / 4) * Math.PI * 2);
    add(r, blade, ROLE.trim);
  }

  // Tail rotor: two blades on a small hub, in its own plane.
  const t = parts();
  const th = new THREE.CylinderGeometry(0.09, 0.09, 0.14, 8);
  th.rotateX(Math.PI / 2);
  add(t, th, ROLE.chrome);
  for (let i = 0; i < 2; i++) {
    const blade = box(1.4, 0.04, 0.16, 0.02);
    blade.translate(0.7, 0, 0);
    blade.rotateZ((i / 2) * Math.PI * 2);
    add(t, blade, ROLE.trim);
  }

  return {
    body: finish(o),
    rotor: finish(r),
    tail: finish(t),
    hub: new THREE.Vector3(0, 2.08, 0),
    tailHub: new THREE.Vector3(-6.25, 0.95, 0.14),
  };
}

// ---------------------------------------------------------------- material

/**
 * One material for the whole fleet.
 *
 * The body colour comes from the instance, the canopy colour from a second
 * instanced attribute, and everything else from the role — so a rickshaw is a
 * black body with a yellow hood and a taxi is a black body with a yellow roof
 * without either of them needing a material of its own.
 */
export interface SoloTone {
  uBody: { value: THREE.Color };
  uCanopy: { value: THREE.Color };
}

export function soloTone(): SoloTone {
  return { uBody: { value: new THREE.Color(0.05, 0.05, 0.06) }, uCanopy: { value: new THREE.Color(0.95, 0.72, 0.06) } };
}

export function fleetMaterial(uNight: { value: number }, instanced: boolean, tone?: SoloTone): THREE.MeshStandardMaterial {
  const m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.46, metalness: 0.22 });
  m.onBeforeCompile = (s) => {
    s.uniforms.uNight = uNight;
    if (!instanced && tone) {
      // The single vehicle you are driving carries its two colours as uniforms
      // the caller owns, so repainting it is an assignment rather than a
      // recompile.
      s.uniforms.uBody = tone.uBody;
      s.uniforms.uCanopy = tone.uCanopy;
    }
    s.vertexShader = s.vertexShader
      .replace('#include <common>', `#include <common>
attribute float aRole;
${instanced ? 'attribute vec3 aTint;' : ''}
varying float vRole;
varying vec3 vTint;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
vRole = aRole;
vTint = ${instanced ? 'aTint' : 'vec3(0.0)'};`);

    s.fragmentShader = s.fragmentShader
      .replace('#include <common>', `#include <common>
uniform float uNight;
${instanced ? '' : 'uniform vec3 uBody;\nuniform vec3 uCanopy;'}
varying float vRole;
varying vec3 vTint;

bool is(float r, float k) { return abs(r - k) < 0.5; }`)
      .replace('#include <color_fragment>', `#include <color_fragment>
{
  vec3 body = ${instanced ? 'vColor.rgb' : 'uBody'};
  vec3 canopy = ${instanced ? 'vTint' : 'uCanopy'};
  vec3 c = body;
  if (is(vRole, 1.0)) c = canopy;
  else if (is(vRole, 2.0)) c = vec3(0.075, 0.078, 0.085);
  else if (is(vRole, 3.0)) c = vec3(0.055, 0.070, 0.082);
  else if (is(vRole, 4.0)) c = vec3(0.036, 0.036, 0.038);
  else if (is(vRole, 5.0)) c = vec3(0.66, 0.67, 0.70);
  else if (is(vRole, 6.0)) c = vec3(0.80, 0.79, 0.72);
  else if (is(vRole, 7.0)) c = vec3(0.55, 0.06, 0.04);
  else if (is(vRole, 8.0)) c = vec3(0.28, 0.20, 0.16);
  else if (is(vRole, 9.0)) c = vec3(0.85, 0.45, 0.05);
  diffuseColor.rgb = c;
}`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
if (is(vRole, 3.0)) { roughnessFactor = 0.12; }
else if (is(vRole, 4.0)) { roughnessFactor = 0.94; }
else if (is(vRole, 5.0)) { roughnessFactor = 0.22; }`)
      .replace('#include <metalnessmap_fragment>', `#include <metalnessmap_fragment>
if (is(vRole, 5.0)) { metalnessFactor = 0.85; }
else if (is(vRole, 4.0) || is(vRole, 8.0)) { metalnessFactor = 0.0; }`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
if (is(vRole, 6.0)) totalEmissiveRadiance += vec3(1.0, 0.94, 0.80) * (0.03 + uNight * 3.2);
else if (is(vRole, 7.0)) totalEmissiveRadiance += vec3(1.0, 0.10, 0.05) * (0.35 + uNight * 2.2);
else if (is(vRole, 9.0)) totalEmissiveRadiance += vec3(1.0, 0.45, 0.03) * uNight * 0.9;`);
  };
  return m;
}

// ------------------------------------------------------------------ specs

let cache: Record<VehicleKind, Spec> | null = null;

export function fleet(): Record<VehicleKind, Spec> {
  if (cache) return cache;
  cache = {
    auto: { geometry: auto(), wheelbase: 2.0, length: 2.6, width: 1.35, height: 1.72, topSpeed: 13, share: 0.30 },
    taxi: { geometry: taxi(), wheelbase: 2.6, length: 4.1, width: 1.55, height: 1.5, topSpeed: 24, share: 0.16 },
    car: { geometry: car(), wheelbase: 2.6, length: 4.1, width: 1.65, height: 1.42, topSpeed: 27, share: 0.24 },
    bus: { geometry: bus(), wheelbase: 6.6, length: 10.5, width: 2.5, height: 4.3, topSpeed: 16, share: 0.07 },
    truck: { geometry: truck(), wheelbase: 4.8, length: 7.7, width: 2.3, height: 2.7, topSpeed: 15, share: 0.09 },
    scooter: { geometry: scooter(), wheelbase: 1.1, length: 1.3, width: 0.5, height: 1.5, topSpeed: 18, share: 0.12 },
    jeep: { geometry: jeep(), wheelbase: 2.7, length: 4.3, width: 1.8, height: 1.9, topSpeed: 25, share: 0.02 },
  };
  return cache;
}

/** Body and canopy colours a vehicle of this kind actually comes in. */
export function livery(kind: VehicleKind, r: () => number): [THREE.Color, THREE.Color] {
  const c = new THREE.Color();
  const t = new THREE.Color();
  switch (kind) {
    case 'auto':
      c.setRGB(0.045, 0.048, 0.052);
      t.setHSL(0.13, 0.92, 0.5);
      break;
    case 'taxi':
      c.setRGB(0.05, 0.052, 0.058);
      t.setHSL(0.125, 0.9, 0.52);
      break;
    case 'bus':
      c.setHSL(0.015, 0.72, 0.34 + r() * 0.06);
      t.setHSL(0.12, 0.8, 0.6);
      break;
    case 'truck':
      c.setHSL(r(), 0.55, 0.42);
      t.setHSL(r(), 0.6, 0.5);
      break;
    case 'scooter':
      c.setHSL(r(), 0.45, 0.4);
      t.setHSL(r(), 0.3, 0.35);
      break;
    case 'jeep':
      c.setHSL(0.22, 0.24, 0.24);
      t.setHSL(0.22, 0.2, 0.3);
      break;
    default: {
      // Private cars are mostly white, silver and grey, everywhere.
      const k = r();
      if (k < 0.62) c.setHSL(0.08, 0.03, 0.32 + r() * 0.6);
      else c.setHSL(r(), 0.42, 0.36);
      t.copy(c);
    }
  }
  return [c, t];
}
