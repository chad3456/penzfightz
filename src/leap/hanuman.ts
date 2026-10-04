import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { PAL, toon } from './toon';

/**
 * An original, stylised Hanuman built from shaped parts on a joint
 * hierarchy: heroic proportions, crown, kundala, flowing hair, a dhoti and
 * sash, a long tail and his gada. Every moving part is a named joint, so the
 * same rig is animated live in the browser and baked to glTF animation
 * clips for Unity or Blender.
 *
 * Rest pose: standing, facing +Z, feet at y = 0, about 2.1 units tall.
 */

export type Rig = {
  root: THREE.Group;
  body: THREE.Object3D;
  j: Record<string, THREE.Object3D>;
  chains: Record<string, THREE.Object3D[]>;
  mats: Record<string, THREE.ShaderMaterial>;
};

/* ───────── geometry helpers ───────── */

/** A tapered capsule hanging down from its joint (top at y = 0). */
function capsule(r1: number, r2: number, len: number, seg = 28) {
  const pts: THREE.Vector2[] = [];
  for (let k = 0; k <= 8; k++) { const a = -Math.PI / 2 + (k / 8) * (Math.PI / 2); pts.push(new THREE.Vector2(Math.max(0.0001, r2 * Math.cos(a)), -len + r2 * Math.sin(a))); }
  for (let k = 0; k <= 8; k++) { const a = (k / 8) * (Math.PI / 2); pts.push(new THREE.Vector2(Math.max(0.0001, r1 * Math.cos(a)), r1 * Math.sin(a))); }
  return new THREE.LatheGeometry(pts, seg);
}
function ellipsoid(rx: number, ry: number, rz: number, seg = 28) {
  return new THREE.SphereGeometry(1, seg, Math.round(seg * 0.75)).scale(rx, ry, rz);
}
function lathe(profile: [number, number][], seg = 32) {
  return new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(Math.max(0.0001, r), y)), seg);
}
function ring(r: number, tube: number, arc = Math.PI * 2) {
  return new THREE.TorusGeometry(r, tube, 10, 40, arc);
}
function mesh(geo: THREE.BufferGeometry, mat: THREE.Material, name: string, at?: [number, number, number], rot?: [number, number, number]) {
  const m = new THREE.Mesh(geo, mat);
  m.name = name;
  if (at) m.position.set(...at);
  if (rot) m.rotation.set(...rot);
  return m;
}
function joint(name: string, parent: THREE.Object3D, at: [number, number, number]) {
  // bones (not groups) so a skinned body can bind to the same hierarchy
  const g = new THREE.Bone();
  g.name = name;
  g.position.set(...at);
  parent.add(g);
  return g;
}

/* ───────── the build ───────── */

export function buildHanuman(): Rig {
  const mats = {
    skin: toon(PAL.skin, PAL.teal, { name: 'Skin' }),
    skinLight: toon(PAL.skinLight, PAL.teal, { name: 'SkinLight' }),
    gold: toon(PAL.gold, PAL.goldDark, { name: 'Gold', rim: 1.2 }),
    goldDark: toon('#a88f55', '#3b3826', { name: 'GoldDark' }),
    cloth: toon(PAL.rust, PAL.navy, { name: 'Cloth', side: THREE.DoubleSide }),
    clothDark: toon('#1d3a4c', PAL.ink, { name: 'ClothDark', side: THREE.DoubleSide }),
    hair: toon('#173246', PAL.ink, { name: 'Hair', edge: 0.3 }),
    eye: toon(PAL.white, '#c9cdb8', { name: 'Eye', grain: 0.02 }),
    pupil: toon(PAL.ink, PAL.ink, { name: 'Pupil', grain: 0 }),
    mouth: toon('#9c3b23', '#4a1d16', { name: 'Mouth' }),
  };
  const j: Record<string, THREE.Object3D> = {};
  const chains: Record<string, THREE.Object3D[]> = {};

  const root = new THREE.Group(); root.name = 'Hanuman';
  const body = joint('body', root, [0, 1.02, 0]);
  const hips = joint('hips', body, [0, 0, 0]);
  j.body = body; j.hips = hips;

  // pelvis, belt, dhoti
  hips.add(mesh(ellipsoid(0.19, 0.13, 0.135), mats.skin, 'pelvis', [0, -0.02, 0]));
  hips.add(mesh(lathe([[0.205, 0.07], [0.215, 0.0], [0.232, -0.1], [0.245, -0.2], [0.25, -0.28], [0.245, -0.3]]), mats.cloth, 'dhoti', [0, 0, 0]));
  hips.add(mesh(lathe([[0.2, 0.1], [0.215, 0.07], [0.215, 0.02], [0.2, 0.0]]), mats.gold, 'belt'));
  hips.add(mesh(ellipsoid(0.05, 0.04, 0.02), mats.gold, 'buckle', [0, 0.05, 0.215]));

  // front and back cloth flaps, as chains so they can stream
  const flap = (name: string, z: number, n: number, w: number, mat: THREE.Material) => {
    const segs: THREE.Object3D[] = [];
    let p: THREE.Object3D = joint(`${name}0`, hips, [0, 0.0, z]);
    segs.push(p);
    for (let i = 0; i < n; i++) {
      const L = 0.1;
      const ww = w * (1 - i * 0.06);
      p.add(mesh(new THREE.BoxGeometry(ww, L * 1.08, 0.012).translate(0, -L / 2, 0), mat, `${name}_m${i}`));
      if (i < n - 1) { p = joint(`${name}${i + 1}`, p, [0, -L, 0]); segs.push(p); }
    }
    chains[name] = segs;
  };
  flap('flapF', 0.215, 6, 0.17, mats.cloth);
  flap('flapB', -0.215, 5, 0.2, mats.clothDark);

  // torso
  const spine = joint('spine', hips, [0, 0.1, 0]); j.spine = spine;
  spine.add(mesh(ellipsoid(0.165, 0.17, 0.125), mats.skin, 'abdomen', [0, 0.1, 0]));
  for (let r = 0; r < 3; r++) for (const sx of [-1, 1]) spine.add(mesh(ellipsoid(0.045, 0.035, 0.03), mats.skin, `abs${r}${sx}`, [sx * 0.045, 0.04 + r * 0.065, 0.105]));
  const chest = joint('chest', spine, [0, 0.24, 0]); j.chest = chest;
  chest.add(mesh(ellipsoid(0.31, 0.21, 0.165), mats.skin, 'chestM', [0, 0.12, -0.01]));
  chest.add(mesh(ellipsoid(0.27, 0.14, 0.15), mats.skin, 'lats', [0, 0.0, -0.02]));
  for (const sx of [-1, 1]) chest.add(mesh(ellipsoid(0.135, 0.095, 0.075), mats.skin, `pec${sx}`, [sx * 0.1, 0.13, 0.1]));
  chest.add(mesh(ellipsoid(0.2, 0.075, 0.12), mats.skin, 'traps', [0, 0.27, -0.03]));
  // necklace: a crescent of gold with a pendant
  chest.add(mesh(ring(0.15, 0.022, Math.PI), mats.gold, 'necklace', [0, 0.29, 0.06], [Math.PI / 2 + 0.55, Math.PI, 0]));
  chest.add(mesh(ellipsoid(0.04, 0.05, 0.02), mats.gold, 'pendant', [0, 0.16, 0.19]));
  // sash over the left shoulder, streaming from the back
  {
    const segs: THREE.Object3D[] = [];
    let p: THREE.Object3D = joint('sash0', chest, [0.08, 0.26, -0.15]);
    segs.push(p);
    for (let i = 0; i < 9; i++) {
      const L = 0.11;
      p.add(mesh(new THREE.BoxGeometry(0.13 - i * 0.006, L * 1.1, 0.012).translate(0, -L / 2, 0), mats.cloth, `sash_m${i}`));
      if (i < 8) { p = joint(`sash${i + 1}`, p, [0, -L, 0]); segs.push(p); }
    }
    chains.sash = segs;
  }

  // neck and head
  const neck = joint('neck', chest, [0, 0.3, 0.0]); j.neck = neck;
  neck.add(mesh(capsule(0.078, 0.085, 0.12).rotateX(Math.PI), mats.skin, 'neckm', [0, -0.02, 0]));
  const head = joint('head', neck, [0, 0.12, 0.01]); j.head = head;
  head.add(mesh(ellipsoid(0.13, 0.14, 0.13), mats.skin, 'skull', [0, 0.12, -0.01]));
  head.add(mesh(ellipsoid(0.115, 0.075, 0.1), mats.skin, 'jaw', [0, 0.03, 0.06]));
  head.add(mesh(ellipsoid(0.09, 0.07, 0.075), mats.skinLight, 'muzzle', [0, 0.065, 0.115]));
  head.add(mesh(ellipsoid(0.03, 0.02, 0.022), mats.pupil, 'nose', [0, 0.1, 0.185]));
  head.add(mesh(ellipsoid(0.045, 0.008, 0.02), mats.mouth, 'mouth', [0, 0.035, 0.175], [0.25, 0, 0]));
  head.add(mesh(capsule(0.03, 0.03, 0.16).rotateZ(Math.PI / 2).translate(0.08, 0, 0), mats.skin, 'brow', [0, 0.175, 0.105]));
  for (const sx of [-1, 1]) {
    head.add(mesh(ellipsoid(0.034, 0.024, 0.02), mats.eye, `eye${sx}`, [sx * 0.05, 0.145, 0.11]));
    head.add(mesh(ellipsoid(0.014, 0.017, 0.012), mats.pupil, `pupil${sx}`, [sx * 0.046, 0.143, 0.127]));
    head.add(mesh(ellipsoid(0.035, 0.05, 0.022), mats.skin, `ear${sx}`, [sx * 0.135, 0.11, -0.01], [0, sx * 0.4, 0]));
    head.add(mesh(ring(0.028, 0.007), mats.gold, `kundala${sx}`, [sx * 0.145, 0.045, -0.005], [0, Math.PI / 2, 0]));
  }
  // crown (mukut): a tiered gold cone with a band and a finial
  head.add(mesh(lathe([[0.125, 0.0], [0.13, 0.03], [0.115, 0.05], [0.105, 0.09], [0.11, 0.1], [0.09, 0.15], [0.07, 0.2], [0.05, 0.24], [0.02, 0.29], [0.004, 0.32]]), mats.gold, 'crown', [0, 0.2, -0.02]));
  head.add(mesh(ring(0.128, 0.012), mats.gold, 'crownBand', [0, 0.215, -0.02], [Math.PI / 2, 0, 0]));
  head.add(mesh(ellipsoid(0.03, 0.04, 0.012), mats.cloth, 'crownJewel', [0, 0.25, 0.1]));
  // hair: five locks streaming from under the crown
  const locks: [string, number, number][] = [['hairC', 0, 0], ['hairL', -0.06, 0.3], ['hairR', 0.06, -0.3], ['hairL2', -0.085, 0.6], ['hairR2', 0.085, -0.6]];
  for (const [name, x, tw] of locks) {
    void tw;
    const segs: THREE.Object3D[] = [];
    let p: THREE.Object3D = joint(`${name}0`, head, [x, 0.19, -0.12 - Math.abs(x) * 0.3]);
    segs.push(p);
    for (let i = 0; i < 7; i++) {
      const L = 0.075, r = 0.05 * (1 - i / 8) + 0.012;
      p.add(mesh(capsule(r, r * 0.85, L), mats.hair, `${name}_m${i}`));
      if (i < 6) { p = joint(`${name}${i + 1}`, p, [0, -L, 0]); segs.push(p); }
    }
    chains[name] = segs;
  }

  // arms
  for (const [side, sx] of [['L', 1], ['R', -1]] as const) {
    const sh = joint(`shoulder${side}`, chest, [sx * 0.29, 0.2, -0.01]); j[`shoulder${side}`] = sh;
    sh.add(mesh(ellipsoid(0.105, 0.095, 0.1), mats.skin, `deltoid${side}`, [sx * 0.015, 0, 0]));
    const ua = joint(`upperArm${side}`, sh, [sx * 0.03, -0.03, 0]); j[`upperArm${side}`] = ua;
    ua.add(mesh(capsule(0.078, 0.066, 0.3), mats.skin, `upperArmM${side}`));
    ua.add(mesh(ellipsoid(0.06, 0.1, 0.065), mats.skin, `bicep${side}`, [0, -0.13, 0.03]));
    ua.add(mesh(ring(0.08, 0.016), mats.gold, `bajuband${side}`, [0, -0.085, 0], [Math.PI / 2, 0, 0]));
    ua.add(mesh(ellipsoid(0.03, 0.03, 0.012), mats.gold, `bajubandJewel${side}`, [sx * 0.07, -0.085, 0.03]));
    const fa = joint(`forearm${side}`, ua, [0, -0.3, 0]); j[`forearm${side}`] = fa;
    fa.add(mesh(capsule(0.066, 0.05, 0.27), mats.skin, `forearmM${side}`));
    fa.add(mesh(lathe([[0.068, -0.08], [0.074, -0.1], [0.07, -0.15], [0.063, -0.22], [0.066, -0.24], [0.06, -0.255]]), mats.gold, `gauntlet${side}`));
    const hand = joint(`hand${side}`, fa, [0, -0.27, 0]); j[`hand${side}`] = hand;
    hand.add(mesh(ellipsoid(0.058, 0.068, 0.055), mats.skin, `fist${side}`, [0, -0.05, 0.005]));
    hand.add(mesh(ellipsoid(0.022, 0.035, 0.02), mats.skin, `thumb${side}`, [sx * 0.04, -0.04, 0.04]));
  }
  // the gada in the right hand
  {
    const gada = joint('gada', j.handR, [0, -0.05, 0.02]); j.gada = gada;
    gada.rotation.set(Math.PI / 2, 0, 0);
    gada.add(mesh(new THREE.CylinderGeometry(0.018, 0.022, 0.62, 12).translate(0, 0.1, 0), mats.goldDark, 'gadaShaft'));
    const headProfile: [number, number][] = [];
    for (let k = 0; k <= 16; k++) { const a = -Math.PI / 2 + (k / 16) * Math.PI; headProfile.push([0.13 * Math.cos(a) * (1 + 0.04 * Math.cos(k * 1.7)), 0.15 * Math.sin(a)]); }
    gada.add(mesh(lathe(headProfile, 16), mats.gold, 'gadaHead', [0, 0.52, 0]));
    gada.add(mesh(ring(0.13, 0.012), mats.gold, 'gadaBand', [0, 0.52, 0], [Math.PI / 2, 0, 0]));
    gada.add(mesh(new THREE.ConeGeometry(0.03, 0.12, 12), mats.gold, 'gadaTip', [0, 0.72, 0]));
    gada.add(mesh(new THREE.SphereGeometry(0.03, 12, 8), mats.gold, 'gadaPommel', [0, -0.22, 0]));
  }

  // legs
  for (const [side, sx] of [['L', 1], ['R', -1]] as const) {
    const th = joint(`thigh${side}`, hips, [sx * 0.1, -0.06, 0]); j[`thigh${side}`] = th;
    th.add(mesh(capsule(0.1, 0.072, 0.44), mats.skin, `thighM${side}`));
    th.add(mesh(ellipsoid(0.07, 0.15, 0.06), mats.skin, `quad${side}`, [0, -0.17, 0.045]));
    const sn = joint(`shin${side}`, th, [0, -0.44, 0]); j[`shin${side}`] = sn;
    sn.add(mesh(capsule(0.07, 0.045, 0.42), mats.skin, `shinM${side}`));
    sn.add(mesh(ellipsoid(0.055, 0.12, 0.055), mats.skin, `calf${side}`, [0, -0.13, -0.035]));
    const ft = joint(`foot${side}`, sn, [0, -0.42, 0]); j[`foot${side}`] = ft;
    ft.add(mesh(ellipsoid(0.055, 0.035, 0.12), mats.skin, `footM${side}`, [0, -0.04, 0.055]));
    ft.add(mesh(ring(0.05, 0.01), mats.gold, `anklet${side}`, [0, 0.0, 0], [Math.PI / 2, 0, 0]));
  }

  // tail: a long chain that sweeps and curls
  {
    const segs: THREE.Object3D[] = [];
    let p: THREE.Object3D = joint('tail0', hips, [0, -0.02, -0.12]);
    segs.push(p);
    const n = 18;
    for (let i = 0; i < n; i++) {
      const L = 0.085, r = 0.042 * (1 - i / (n + 4)) + 0.008;
      p.add(mesh(capsule(r, r * 0.92, L * 1.05), i > n - 4 ? mats.skin : mats.skin, `tail_m${i}`));
      if (i < n - 1) { p = joint(`tail${i + 1}`, p, [0, -L, 0]); segs.push(p); }
    }
    p.add(mesh(ellipsoid(0.03, 0.06, 0.03), mats.hair, 'tailTip', [0, -0.11, 0]));
    chains.tail = segs;
  }

  root.traverse((o) => { if ((o as THREE.Mesh).isMesh) o.frustumCulled = false; });
  return { root, body, j, chains, mats };
}

/* ───────── poses ───────── */

export type PoseName = 'fly' | 'stand' | 'crouch' | 'leap' | 'offer';
export type PoseState = { t: number; pose: PoseName; blend?: number; boost?: number; bank?: number };

type Rot = [number, number, number];
type Pose = Record<string, Rot>;

/** Rotations (x, y, z) per joint for a pose at time t. */
function poseAt(p: PoseName, t: number, boost = 0): Pose {
  const s = Math.sin, P: Pose = {};
  if (p === 'fly') {
    const flut = 1 + boost * 0.8;
    P.body = [Math.PI / 2 - 0.12 + s(t * 1.4) * 0.03, 0, 0];
    P.spine = [-0.08, 0, 0];
    P.chest = [-0.12 + s(t * 1.4 + 0.5) * 0.02, 0, 0];
    P.neck = [-0.45, 0, 0];
    P.head = [-0.75, 0, 0];
    // left fist leads; the right hand carries the gada back along the body
    P.shoulderL = [-Math.PI + 0.25, 0, -0.12];
    P.forearmL = [-0.05, 0, 0];
    P.handL = [0.2, 0, 0];
    P.shoulderR = [-0.35, 0, -0.5];
    P.forearmR = [-1.2, 0, 0];
    P.handR = [0, 0, 0];
    P.thighL = [0.18 + s(t * 2.2) * 0.08 * flut, 0, 0.06];
    P.thighR = [0.05 - s(t * 2.2) * 0.08 * flut, 0, -0.08];
    P.shinL = [0.75 + s(t * 2.2 + 1) * 0.12 * flut, 0, 0];
    P.shinR = [0.25 - s(t * 2.2 + 1) * 0.1 * flut, 0, 0];
    P.footL = [0.6, 0, 0];
    P.footR = [0.5, 0, 0];
  } else if (p === 'stand' || p === 'offer') {
    const br = s(t * 1.6) * 0.02;
    P.body = [0, 0, 0];
    P.spine = [br, 0, 0];
    P.chest = [-0.04 - br, 0, 0];
    P.neck = [0.05, 0, 0];
    P.head = [0.05, s(t * 0.5) * 0.15, 0];
    P.shoulderL = [0.05, 0, 0.18];
    P.forearmL = [-0.25, 0, 0];
    P.shoulderR = [0.05, 0, -0.18];
    P.forearmR = [-0.35, 0, 0];
    P.handR = [-0.2, 0, 0];
    P.thighL = [0, 0, 0.04];
    P.thighR = [0, 0, -0.04];
    if (p === 'offer') { P.shoulderL = [-1.35, 0, 0.1]; P.forearmL = [-0.25, 0, 0]; P.handL = [-0.4, 0, 0]; }
  } else if (p === 'crouch') {
    P.body = [0.35, 0, 0];
    P.spine = [0.2, 0, 0];
    P.chest = [0.15, 0, 0];
    P.neck = [-0.3, 0, 0];
    P.head = [-0.35, 0, 0];
    P.shoulderL = [0.5, 0, 0.3];
    P.forearmL = [-0.8, 0, 0];
    P.shoulderR = [0.2, 0, -0.35];
    P.forearmR = [-1.0, 0, 0];
    P.thighL = [-1.25, 0, 0.12];
    P.thighR = [-1.0, 0, -0.12];
    P.shinL = [2.2, 0, 0];
    P.shinR = [1.95, 0, 0];
    P.footL = [-0.9, 0, 0];
    P.footR = [-0.8, 0, 0];
  } else if (p === 'leap') {
    P.body = [0.9, 0, 0];
    P.spine = [-0.15, 0, 0];
    P.chest = [-0.2, 0, 0];
    P.neck = [-0.3, 0, 0];
    P.head = [-0.5, 0, 0];
    P.shoulderR = [-2.6, 0, 0.1];
    P.shoulderL = [-2.4, 0, -0.1];
    P.forearmL = [-0.2, 0, 0];
    P.thighL = [0.35, 0, 0.05];
    P.thighR = [0.6, 0, -0.05];
    P.shinL = [0.3, 0, 0];
    P.shinR = [1.1, 0, 0];
    P.footL = [0.7, 0, 0];
    P.footR = [0.7, 0, 0];
  }
  return P;
}

const ZERO: Rot = [0, 0, 0];
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Set every joint for the current state, blending between two poses. */
export function applyPose(rig: Rig, a: PoseState, from?: PoseState) {
  const A = poseAt(a.pose, a.t, a.boost);
  const B = from ? poseAt(from.pose, from.t, from.boost) : null;
  const k = from ? (a.blend ?? 1) : 1;
  for (const name of Object.keys(rig.j)) {
    if (name === 'gada' || name === 'hips') continue;
    const ra = A[name] ?? ZERO, rb = B ? B[name] ?? ZERO : ra;
    rig.j[name].rotation.set(lerp(rb[0], ra[0], k), lerp(rb[1], ra[1], k), lerp(rb[2], ra[2], k));
  }
  const t = a.t, flying = a.pose === 'fly' || a.pose === 'leap';
  const wind = flying ? 1 + (a.boost ?? 0) : 0.25;
  const bank = a.bank ?? 0;
  // the tail: curls up behind him standing; streams and sweeps in flight
  rig.chains.tail.forEach((s, i) => {
    if (flying) s.rotation.set(0.05 + Math.sin(t * 3.1 - i * 0.45) * 0.13 * wind, 0, Math.sin(t * 2 - i * 0.35) * 0.1 + bank * 0.03);
    else s.rotation.set(i < 3 ? 0.55 : -0.32 + Math.sin(t * 1.4 - i * 0.4) * 0.05, 0, Math.sin(t * 0.9 - i * 0.3) * 0.06 + (i > 9 ? 0.18 : 0));
  });
  // hair, sash and cloth: travelling waves, stronger in the wind
  const wave = (chain: THREE.Object3D[], base: number, amp: number, freq: number, side = 0) => chain.forEach((s, i) => {
    s.rotation.x = (i === 0 ? base : 0) + Math.sin(t * freq - i * 0.8) * amp * wind * (0.4 + i * 0.12);
    s.rotation.z = side + Math.sin(t * freq * 0.7 - i * 0.6) * amp * 0.5 * wind;
  });
  ([['hairC', 0], ['hairL', 0.06], ['hairR', -0.06], ['hairL2', 0.12], ['hairR2', -0.12]] as const).forEach(([nm, sd]) => wave(rig.chains[nm], flying ? 1.25 : 0.4, 0.12, 6, sd));
  wave(rig.chains.sash, flying ? 0.25 : 0.15, 0.16, 7.5);
  wave(rig.chains.flapF, flying ? 0.1 : -0.04, 0.14, 8);
  wave(rig.chains.flapB, flying ? 0.3 : 0.06, 0.12, 7);
}

/* ───────── baking for export ───────── */

/** Sample a pose over time into a glTF-exportable AnimationClip. */
export function bakeClip(rig: Rig, name: string, pose: PoseName, seconds: number, fps = 30, boost = 0) {
  const nodes: THREE.Object3D[] = [];
  rig.root.traverse((o) => { if (!(o as THREE.Mesh).isMesh && o !== rig.root) nodes.push(o); });
  const times: number[] = [];
  const values = new Map<THREE.Object3D, number[]>();
  nodes.forEach((n) => values.set(n, []));
  const frames = Math.round(seconds * fps);
  // loop cleanly: sample one full period so first and last frames match
  for (let f = 0; f <= frames; f++) {
    const t = (f / frames) * seconds;
    times.push(t);
    applyPose(rig, { t: (t / seconds) * Math.PI * 2 * Math.round(seconds), pose, boost });
    nodes.forEach((n) => { const q = n.quaternion; values.get(n)!.push(q.x, q.y, q.z, q.w); });
  }
  const tracks = nodes.map((n) => new THREE.QuaternionKeyframeTrack(`${n.name}.quaternion`, times, values.get(n)!));
  return new THREE.AnimationClip(name, seconds, tracks);
}

/** A copy of the model with plain PBR materials (named for the Unity toon setup script). */
export function exportableCopy(rig: Rig) {
  const copy = rig.root.clone(true);
  const cache = new Map<string, THREE.MeshStandardMaterial>();
  copy.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    const src = m.material as THREE.ShaderMaterial;
    const key = src.name;
    if (!cache.has(key)) {
      const pbr = new THREE.MeshStandardMaterial({ color: new THREE.Color(src.userData.lit), roughness: key === 'Gold' ? 0.35 : 0.85, metalness: key === 'Gold' ? 0.6 : 0, side: src.side });
      pbr.name = key;
      pbr.userData = { shade: src.userData.shade, lit: src.userData.lit };
      cache.set(key, pbr);
    }
    m.material = cache.get(key)!;
  });
  return copy;
}

/** Merge static parts per material for faster drawing of background copies. */
export function mergedStatic(group: THREE.Object3D) {
  const byMat = new Map<THREE.Material, THREE.BufferGeometry[]>();
  group.updateMatrixWorld(true);
  group.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    const g = m.geometry.clone().applyMatrix4(m.matrixWorld);
    const mat = m.material as THREE.Material;
    if (!byMat.has(mat)) byMat.set(mat, []);
    byMat.get(mat)!.push(g);
  });
  const out = new THREE.Group();
  byMat.forEach((gs, mat) => out.add(new THREE.Mesh(mergeGeometries(gs.map((g) => g.index ? g.toNonIndexed() : g)), mat)));
  return out;
}
