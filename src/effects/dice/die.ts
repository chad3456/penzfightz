import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import type { Flavour } from './flavours';

/**
 * One jelly die: the geometry, the pips, the thing set in the middle, and the
 * arithmetic for reading which number is facing up.
 */

/** Edge length. Everything else on the table is measured against this. */
export const SIZE = 1;
const HALF = SIZE / 2;
const RADIUS = SIZE * 0.19;

/**
 * The six faces by their outward normal in the die's own frame.
 *
 * Western convention: one up, two towards you, three to the right, and every
 * pair of opposite faces adding to seven. Getting the handedness wrong makes a
 * die that is perfectly plausible until somebody who plays backgammon sees it.
 */
export const FACES: { n: THREE.Vector3; value: number }[] = [
  { n: new THREE.Vector3(0, 1, 0), value: 1 },
  { n: new THREE.Vector3(0, 0, 1), value: 2 },
  { n: new THREE.Vector3(1, 0, 0), value: 3 },
  { n: new THREE.Vector3(-1, 0, 0), value: 4 },
  { n: new THREE.Vector3(0, 0, -1), value: 5 },
  { n: new THREE.Vector3(0, -1, 0), value: 6 },
];

/** Pip positions in face-local units, x and y across the face, −1 to 1. */
const SPOTS: Record<number, [number, number][]> = {
  1: [[0, 0]],
  2: [[-1, 1], [1, -1]],
  3: [[-1, 1], [0, 0], [1, -1]],
  4: [[-1, -1], [-1, 1], [1, -1], [1, 1]],
  5: [[-1, -1], [-1, 1], [0, 0], [1, -1], [1, 1]],
  6: [[-1, -1], [-1, 0], [-1, 1], [1, -1], [1, 0], [1, 1]],
};

const SPREAD = SIZE * 0.26;
const PIP_R = SIZE * 0.088;
/** How flat the lentil is, and how far it is sunk under the surface. */
const PIP_FLAT = 0.4;
const PIP_SINK = SIZE * 0.028;

/**
 * Every pip on the die, as a transform.
 *
 * A pip is a squashed sphere lying just under the face rather than a decal on
 * it, which is why it is still visible — refracted and pale — when you are
 * looking at the far side of the jelly through the near side.
 */
export function pipTransforms(): THREE.Matrix4[] {
  const out: THREE.Matrix4[] = [];
  const up = new THREE.Vector3(0, 1, 0);
  const q = new THREE.Quaternion();
  const pos = new THREE.Vector3();
  const flat = new THREE.Vector3(PIP_R, PIP_R * PIP_FLAT, PIP_R);

  for (const face of FACES) {
    // Turn the face normal to +Y, so the flattened axis of the lentil is the
    // one pointing out of the face.
    q.setFromUnitVectors(up, face.n);
    const a = new THREE.Vector3();
    const b = new THREE.Vector3();
    // Two axes across the face, whatever they happen to be — the pip patterns
    // are symmetric under a quarter turn, so any pair that spans it will do.
    a.set(1, 0, 0).applyQuaternion(q);
    b.set(0, 0, 1).applyQuaternion(q);

    for (const [u, v] of SPOTS[face.value]) {
      pos
        .copy(face.n)
        .multiplyScalar(HALF - PIP_SINK)
        .addScaledVector(a, u * SPREAD)
        .addScaledVector(b, v * SPREAD);
      out.push(new THREE.Matrix4().compose(pos, q, flat));
    }
  }
  return out;
}

/**
 * Which number is up.
 *
 * The face whose normal, once turned by the die's rotation, points most nearly
 * at the ceiling. The dot product is also how *flat* the die is lying: a die
 * balanced on an edge or leaning on another one has no face much above 0.8,
 * and that is the only reliable way to catch a cocked die.
 */
export function faceUp(q: THREE.Quaternion): { value: number; flatness: number } {
  const v = new THREE.Vector3();
  let best = FACES[0].value;
  let top = -2;
  for (const face of FACES) {
    const y = v.copy(face.n).applyQuaternion(q).y;
    if (y > top) {
      top = y;
      best = face.value;
    }
  }
  return { value: best, flatness: top };
}

/** Below this, the die is on an edge or propped on a neighbour. */
export const FLAT_ENOUGH = 0.86;

// ------------------------------------------------------------------ geometry

let bodyGeo: RoundedBoxGeometry | null = null;
let pipGeo: THREE.SphereGeometry | null = null;
let fruitGeo: THREE.SphereGeometry | null = null;
let stalkGeo: THREE.TorusGeometry | null = null;

export function dieGeometries() {
  // Built once and shared. Five dice on the table is five draws of the same
  // buffers, and the transmission pass already costs enough.
  bodyGeo ??= new RoundedBoxGeometry(SIZE, SIZE, SIZE, 5, RADIUS);
  pipGeo ??= new THREE.SphereGeometry(1, 20, 14);
  fruitGeo ??= new THREE.SphereGeometry(SIZE * 0.19, 24, 18);
  stalkGeo ??= new THREE.TorusGeometry(SIZE * 0.13, SIZE * 0.012, 8, 28, Math.PI * 0.62);
  return { bodyGeo, pipGeo, fruitGeo, stalkGeo };
}

// ------------------------------------------------------------------ material

/**
 * The jelly.
 *
 * `transmission` is what makes it a jelly rather than a boiled sweet: the
 * material actually refracts what is behind it, so the far pips bend and the
 * tray shows through. It needs an environment to refract *from* — with no
 * `scene.environment` set, a transmissive material renders as flat grey and
 * looks like a bug in the geometry.
 */
export function jellyMaterial(f: Flavour): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(f.body),
    transmission: 0.9,
    thickness: SIZE * 0.95,
    attenuationColor: new THREE.Color(f.attenuation),
    attenuationDistance: f.depth,
    // Glassier than this and it is a boiled sweet: a hard mirror highlight and
    // a face-on view that blows out to white with the pips lost in it. Jelly
    // scatters, so the highlight is broad and the surface never quite mirrors.
    roughness: 0.17,
    metalness: 0,
    ior: 1.41,
    clearcoat: 0.7,
    clearcoatRoughness: 0.18,
    envMapIntensity: 1.1,
    // Transmissive surfaces need both sides or the back wall of the jelly is
    // missing and the inside reads as hollow.
    side: THREE.DoubleSide,
  });
}

export function pipMaterial(f: Flavour): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(f.pip),
    roughness: 0.32,
    metalness: 0,
    clearcoat: 0.6,
    clearcoatRoughness: 0.3,
  });
}

export function fruitMaterial(f: Flavour): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(f.fruit),
    roughness: 0.18,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
  });
}

export function stalkMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color: '#7a5a2a', roughness: 0.7 });
}

// -------------------------------------------------------------------- squash

/**
 * A world-aligned squash, as a matrix.
 *
 * This cannot be an object's `scale`. Scale on an `Object3D` is applied in the
 * object's *own* frame, so a die that has rolled onto its corner would squash
 * along its own corner axis instead of towards the table. The flattening has to
 * happen in world space, after the rotation, which means composing the matrix
 * by hand: `M = S · R`, with `S` a non-uniform scale about an arbitrary axis.
 *
 * `S = s·I + (k − s)·(a ⊗ a)` — the outer product picks out the component
 * along `a` and scales it by `k`, leaving everything perpendicular at `s`.
 * Perpendicular grows as `1/√k` so the jelly keeps its volume.
 */
export function squashMatrix(out: THREE.Matrix4, axis: THREE.Vector3, amp: number): THREE.Matrix4 {
  const k = Math.max(0.35, 1 - amp);
  const s = 1 / Math.sqrt(k);
  const { x, y, z } = axis;
  const d = k - s;
  out.set(
    s + d * x * x, d * x * y, d * x * z, 0,
    d * x * y, s + d * y * y, d * y * z, 0,
    d * x * z, d * y * z, s + d * z * z, 0,
    0, 0, 0, 1,
  );
  return out;
}

/**
 * How a jelly recovers: a damped spring, and a soft one.
 *
 * Stiff and it is a rubber ball; too loose and it never stops moving. These
 * numbers give roughly three visible wobbles over about a second, which is
 * what a gummy sweet dropped on a table actually does.
 */
export const WOBBLE_K = 165;
export const WOBBLE_C = 8.5;

export interface Squash {
  axis: THREE.Vector3;
  amp: number;
  vel: number;
}

export function stepSquash(s: Squash, dt: number) {
  // Sub-stepped: at 165 the spring is stiff enough that a single 60 Hz step
  // can overshoot into a growing oscillation.
  const steps = 4;
  const h = dt / steps;
  for (let i = 0; i < steps; i++) {
    s.vel += (-WOBBLE_K * s.amp - WOBBLE_C * s.vel) * h;
    s.amp += s.vel * h;
  }
  if (Math.abs(s.amp) < 0.0006 && Math.abs(s.vel) < 0.004) {
    s.amp = 0;
    s.vel = 0;
  }
}
