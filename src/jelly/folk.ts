/**
 * Everybody who moves.
 *
 * A jelly person is five pieces: a body welded from the hips up, two arms and
 * two legs. The body carries the wobble, so the head swings while the feet
 * stay planted, and every footfall kicks the spring, which means the whole
 * village is quietly shaking itself all day.
 *
 * The villagers are not scenery. Each one has a round of chores, picked by
 * the hour: plucking the rows in the morning, carrying the baskets down at
 * noon, rolling and sweeping and chopping in the afternoon, and lamps and
 * chai at dusk.
 */
import * as THREE from 'three';
import { jellyMaterial, setBounds, Wobbler, type JellyMaterial } from './jelly';
import { basket as basketGeo, basketLeaf, broom, chicken, cow, dog, figure, LOOKS, pot, shears, wateringCan, type Look } from './make';
import { heightAt } from './land';

const UP = new THREE.Vector3(0, 1, 0);

function mesh(geo: THREE.BufferGeometry, mat: THREE.Material) {
  const m = new THREE.Mesh(geo, mat);
  m.frustumCulled = false;
  return m;
}

export type Anim = 'idle' | 'walk' | 'work' | 'carry' | 'sit';

/* ───────── a person ───────── */

export class Person {
  group = new THREE.Group();
  mat: JellyMaterial;
  wob: Wobbler;
  private body: THREE.Mesh;
  private armL: THREE.Mesh; private armR: THREE.Mesh;
  private legL: THREE.Mesh; private legR: THREE.Mesh;
  private hip = new THREE.Group();

  x = 0; z = 0; y = 0;
  facing = 0;
  speed = 0;
  anim: Anim = 'idle';
  /** Rises while working, which bends the figure to the job. */
  workT = 0;
  private phase = 0;
  private lastStep = 0;
  /** Set by whoever owns this person: a chance to thump the ground. */
  onStep?: (x: number, z: number, hard: number) => void;

  constructor(look: Look, public scale = 1, shawl = true) {
    const p = figure(look, shawl);
    this.mat = jellyMaterial({ vcol: true, colour: '#ffffff', gloss: 0.7, thick: 0.8, rim: 0.4, wrap: 0.75 });
    this.wob = new Wobbler(this.mat, 190, 8.5);

    this.body = mesh(p.torso, this.mat);
    setBounds(this.mat, p.torso);
    this.head = mesh(p.head, this.mat);
    this.head.position.set(0, 0.92, 0);
    this.body.add(this.head);

    this.armL = mesh(p.arm, this.mat); this.armL.position.set(0.3, 0.62, 0);
    this.armR = mesh(p.arm, this.mat); this.armR.position.set(-0.3, 0.62, 0);
    this.body.add(this.armL, this.armR);

    this.legL = mesh(p.leg, this.mat); this.legL.position.set(0.13, 0, 0);
    this.legR = mesh(p.leg, this.mat); this.legR.position.set(-0.13, 0, 0);
    this.hip.position.y = 0.38;
    this.hip.add(this.legL, this.legR);

    this.body.position.y = 0.38;
    this.group.add(this.body, this.hip);
    this.group.scale.setScalar(scale);
  }

  head: THREE.Mesh;

  /** Hang something off the back, like a plucking basket. */
  addBack(obj: THREE.Object3D) { obj.position.set(0, 0.42, -0.3); obj.scale.setScalar(0.8); this.body.add(obj); }
  /** Put something in the right hand. */
  addHand(obj: THREE.Object3D) { obj.position.set(0, -0.42, 0.04); this.armR.add(obj); }

  place(x: number, z: number, facing = this.facing) {
    this.x = x; this.z = z; this.facing = facing;
    this.y = heightAt(x, z);
    this.group.position.set(x, this.y, z);
    this.group.rotation.y = facing;
  }

  update(dt: number, t: number) {
    this.y += (heightAt(this.x, this.z) - this.y) * Math.min(1, dt * 14);
    this.group.position.set(this.x, this.y, this.z);

    // turn towards where we are going, the long way round never
    let d = this.facing - this.group.rotation.y;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    this.group.rotation.y += d * Math.min(1, dt * 9);

    const moving = this.speed > 0.1;
    this.phase += dt * (moving ? 2.2 + this.speed * 1.5 : 1.1);

    const want = this.anim === 'work' ? 1 : 0;
    this.workT += (want - this.workT) * Math.min(1, dt * 7);

    const sw = Math.sin(this.phase * 2);
    const bob = moving ? Math.abs(Math.sin(this.phase)) : Math.sin(this.phase * 0.7) * 0.18;

    // the bounce, and a thump each time a foot lands
    this.body.position.y = 0.38 + bob * (moving ? 0.1 : 0.012) - this.workT * 0.12;
    this.hip.position.y = 0.38 - this.workT * 0.1;
    if (moving) {
      const step = Math.floor(this.phase / Math.PI);
      if (step !== this.lastStep) {
        this.lastStep = step;
        this.wob.kick((Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * 0.3, -0.5 - this.speed * 0.06);
        this.onStep?.(this.x, this.z, Math.min(1, this.speed / 5));
      }
    }

    // lean into the walk, and fold over the work
    this.body.rotation.x = this.workT * 0.75 + (moving ? Math.min(0.28, this.speed * 0.045) : 0);
    this.body.rotation.z = moving ? sw * 0.05 : 0;
    this.head.rotation.x = -this.workT * 0.45 + Math.sin(t * 0.7 + this.phase * 0.2) * 0.04;

    if (this.anim === 'work') {
      // both hands down at the bush, with a small busy rhythm
      const busy = Math.sin(t * 7) * 0.22;
      this.armL.rotation.x = -1.25 + busy; this.armR.rotation.x = -1.25 - busy;
      this.armL.rotation.z = 0.35; this.armR.rotation.z = -0.35;
      this.legL.rotation.x = 0.1; this.legR.rotation.x = -0.1;
    } else {
      const sway = moving ? Math.sin(this.phase) : Math.sin(t * 1.2 + this.phase) * 0.12;
      this.armL.rotation.x = -sway * 0.55; this.armR.rotation.x = sway * 0.55;
      this.armL.rotation.z = 0.16 + (this.anim === 'carry' ? -0.9 : 0);
      this.armR.rotation.z = -0.16 + (this.anim === 'carry' ? 0.9 : 0);
      this.legL.rotation.x = sway * 0.6; this.legR.rotation.x = -sway * 0.6;
    }

    this.wob.step(dt);
  }

  dispose() {
    this.mat.dispose();
    for (const m of [this.body, this.head, this.armL, this.armR, this.legL, this.legR]) m.geometry.dispose();
  }
}

/* ───────── villagers and their rounds ───────── */

export interface Station { x: number; z: number; job: string; mins?: number }

/**
 * A villager who walks a round of chores. They are not simulating the estate
 * ledger, only performing it, which is what makes the hillside look busy.
 */
export class Villager {
  person: Person;
  private target: Station | null = null;
  private waited = 0;
  private idx = 0;
  /** Where they go and what they do, in order. */
  round: Station[] = [];
  name: string;

  constructor(look: Look, name: string, scale = 1) {
    this.person = new Person(look, scale);
    this.name = name;
  }

  get group() { return this.person.group; }

  setRound(round: Station[], startAt = 0) {
    this.round = round;
    this.idx = startAt % Math.max(1, round.length);
    this.target = this.round[this.idx] ?? null;
    this.waited = 0;
  }

  update(dt: number) {
    const p = this.person;
    if (!this.target) { p.speed = 0; p.anim = 'idle'; return; }
    const dx = this.target.x - p.x, dz = this.target.z - p.z;
    const d = Math.hypot(dx, dz);

    if (d > 1.1) {
      const sp = 2.5;
      p.facing = Math.atan2(dx, dz);
      p.x += (dx / d) * sp * dt;
      p.z += (dz / d) * sp * dt;
      p.speed = sp;
      p.anim = this.target.job === 'carry' ? 'carry' : 'walk';
    } else {
      p.speed = 0;
      p.anim = this.target.job === 'rest' ? 'idle' : 'work';
      this.waited += dt;
      if (this.waited > (this.target.mins ?? 6)) {
        this.waited = 0;
        this.idx = (this.idx + 1) % this.round.length;
        this.target = this.round[this.idx];
      }
    }
  }
}

export const LOOK_COUNT = LOOKS.length;

export const VILLAGER_NAMES = ['Thangam', 'Mariappan', 'Lakshmi', 'Selvi', 'Raju', 'Ponnamma', 'Kannan', 'Devi', 'Murugan', 'Sarasu'];

export function makeVillagers(n: number): Villager[] {
  const out: Villager[] = [];
  for (let i = 0; i < n; i++) {
    const look = LOOKS[i % LOOKS.length];
    const child = i >= n - 2;
    const v = new Villager(look, VILLAGER_NAMES[i % VILLAGER_NAMES.length], child ? 0.72 : 0.95 + (i % 3) * 0.04);
    if (!child && i % 2 === 0) {
      const b = new THREE.Mesh(basketGeo(), v.person.mat);
      const l = new THREE.Mesh(basketLeaf(), v.person.mat);
      b.add(l); b.frustumCulled = false; l.frustumCulled = false;
      v.person.addBack(b);
    } else if (!child && i % 3 === 0) {
      v.person.addHand(new THREE.Mesh(broom(), v.person.mat));
    }
    out.push(v);
  }
  return out;
}

/* ───────── the animals ───────── */

/** The house cow, who chews and sways and is mostly wobble. */
export class Cow {
  group = new THREE.Group();
  mat: JellyMaterial;
  wob: Wobbler;
  private head: THREE.Mesh;
  private legs: THREE.Mesh[] = [];
  private t = Math.random() * 10;
  x = 0; z = 0;

  constructor() {
    const parts = cow();
    this.mat = jellyMaterial({ vcol: true, colour: '#ffffff', gloss: 0.6, thick: 0.9, rim: 0.36, wrap: 0.8 });
    this.wob = new Wobbler(this.mat, 120, 6);
    const body = mesh(parts.body, this.mat);
    body.position.y = 0.95;
    setBounds(this.mat, parts.body);
    this.head = mesh(parts.head, this.mat);
    this.head.position.set(0, 0.2, 0.9);
    body.add(this.head);
    for (let i = 0; i < 4; i++) {
      const l = mesh(parts.leg, this.mat);
      l.position.set(i < 2 ? 0.3 : -0.3, 0.52, i % 2 ? 0.5 : -0.45);
      this.legs.push(l);
      this.group.add(l);
    }
    this.group.add(body);
  }

  place(x: number, z: number, facing = 0) {
    this.x = x; this.z = z;
    this.group.position.set(x, heightAt(x, z), z);
    this.group.rotation.y = facing;
  }
  nudge() { this.wob.kick(0.25, 0.1, -0.5, 0.2); }

  update(dt: number) {
    this.t += dt;
    // chewing, a swaying head, and a tail-flick wobble now and then
    this.head.rotation.x = Math.sin(this.t * 1.4) * 0.09 - 0.05;
    this.head.rotation.z = Math.sin(this.t * 0.6) * 0.07;
    this.group.position.y = heightAt(this.x, this.z) + Math.sin(this.t * 1.1) * 0.015;
    for (let i = 0; i < 4; i++) this.legs[i].rotation.x = Math.sin(this.t * 0.8 + i) * 0.03;
    if (Math.random() < dt * 0.25) this.wob.kick((Math.random() - 0.5) * 0.2, 0, -0.18);
    this.wob.step(dt);
  }
}

/** Hens that peck, pause and scurry a few steps. */
export class Hens {
  group = new THREE.Group();
  mat: JellyMaterial;
  private birds: { m: THREE.Mesh; hx: number; hz: number; tx: number; tz: number; t: number; peck: number }[] = [];

  constructor(n: number, cx: number, cz: number, private spread = 4) {
    this.mat = jellyMaterial({ vcol: true, colour: '#ffffff', gloss: 0.8, thick: 0.7, rim: 0.4 });
    const g = chicken();
    setBounds(this.mat, g);
    for (let i = 0; i < n; i++) {
      const m = mesh(g, this.mat);
      const hx = cx + (Math.random() - 0.5) * spread, hz = cz + (Math.random() - 0.5) * spread;
      m.position.set(hx, heightAt(hx, hz), hz);
      this.birds.push({ m, hx: cx, hz: cz, tx: hx, tz: hz, t: Math.random() * 4, peck: 0 });
      this.group.add(m);
    }
  }

  /** Scatter them, as when somebody throws grain. */
  flurry() { for (const b of this.birds) { b.tx = b.hx + (Math.random() - 0.5) * this.spread; b.tz = b.hz + (Math.random() - 0.5) * this.spread; b.t = 0; } }

  update(dt: number, t: number) {
    for (const b of this.birds) {
      b.t -= dt;
      if (b.t <= 0) { b.t = 1.5 + Math.random() * 4; b.tx = b.hx + (Math.random() - 0.5) * this.spread; b.tz = b.hz + (Math.random() - 0.5) * this.spread; }
      const dx = b.tx - b.m.position.x, dz = b.tz - b.m.position.z;
      const d = Math.hypot(dx, dz);
      if (d > 0.1) {
        const sp = Math.min(1.8, d * 3);
        b.m.position.x += (dx / d) * sp * dt;
        b.m.position.z += (dz / d) * sp * dt;
        b.m.rotation.y = Math.atan2(dx, dz);
        b.m.position.y = heightAt(b.m.position.x, b.m.position.z) + Math.abs(Math.sin(t * 14 + b.hx)) * 0.04;
        b.peck = 0;
      } else {
        b.peck += dt;
        b.m.position.y = heightAt(b.m.position.x, b.m.position.z);
        b.m.rotation.x = Math.max(0, Math.sin(b.peck * 5)) * 0.55;
      }
    }
  }
}

/** The estate dog, who follows whoever is nearest and wags constantly. */
export class Dog {
  group = new THREE.Group();
  mat: JellyMaterial;
  wob: Wobbler;
  private m: THREE.Mesh;
  private t = 0;
  x = 0; z = 0;
  target = new THREE.Vector2();

  constructor() {
    this.mat = jellyMaterial({ vcol: true, colour: '#ffffff', gloss: 0.85, thick: 0.8, rim: 0.42 });
    const g = dog();
    setBounds(this.mat, g);
    this.m = mesh(g, this.mat);
    this.wob = new Wobbler(this.mat, 220, 8);
    this.group.add(this.m);
  }
  place(x: number, z: number) { this.x = x; this.z = z; this.target.set(x, z); this.group.position.set(x, heightAt(x, z), z); }

  update(dt: number, t: number) {
    this.t += dt;
    const dx = this.target.x - this.x, dz = this.target.y - this.z;
    const d = Math.hypot(dx, dz);
    if (d > 2.4) {
      const sp = Math.min(5.5, d);
      this.x += (dx / d) * sp * dt; this.z += (dz / d) * sp * dt;
      this.group.rotation.y += (Math.atan2(dx, dz) - this.group.rotation.y) * Math.min(1, dt * 8);
      const hop = Math.abs(Math.sin(this.t * 9));
      this.group.position.set(this.x, heightAt(this.x, this.z) + hop * 0.12, this.z);
      if (hop < 0.05) this.wob.kick(0, 0, -0.4);
    } else {
      this.group.position.set(this.x, heightAt(this.x, this.z) + Math.abs(Math.sin(this.t * 2)) * 0.02, this.z);
    }
    this.m.rotation.z = Math.sin(t * 12) * 0.06;
    this.wob.step(dt);
  }
}

/* ───────── the things the player holds ───────── */

export function toolMesh(tool: string, mat: THREE.Material): THREE.Object3D | null {
  switch (tool) {
    case 'can': return mesh(wateringCan(), mat);
    case 'shears': return mesh(shears(), mat);
    case 'broom': return mesh(broom(), mat);
    case 'pot': return mesh(pot(), mat);
    default: return null;
  }
}

export { UP };
