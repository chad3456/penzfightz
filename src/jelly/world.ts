/**
 * Jellynoor, running.
 *
 * Puts the hillside together, walks a jelly person round it, keeps the
 * villagers at their chores, turns the sun, brings the mist up out of the
 * valley in the morning and the rain on in the afternoon, and makes sure that
 * when anything is touched, everything near it shakes.
 */
import * as THREE from 'three';
import { JELLY, U, blobShadowMaterial, jellyMaterial, setBounds, skyDome } from './jelly';
import { basket, basketLeaf, blob, sapling } from './make';
import { heightAt, slopeAt, VILLAGE, WORLD, clamp, POND, mulberry } from './land';
import { Estate, type Action, type Factory, type Stats, type Tool } from './chores';
import { buildGarden, buildNature, buildRidges, buildTerrain, buildVillage, buildWater, type Garden, type Quality, type Village } from './scene';
import { Cow, Dog, Hens, LOOK_COUNT, Person, Villager, makeVillagers, toolMesh, type Station } from './folk';
import { Sound } from './audio';

export interface Hud {
  day: number; clock: string; part: string;
  prompt: { label: string; hint: string; blocked?: string } | null;
  progress: number;
  leaf: number; leafMax: number; coins: number; saplings: number; can: number; milk: number; wood: number;
  factory: Factory;
  tool: Tool; tools: Tool[];
  toasts: string[];
  todo: string[];
  raining: boolean; fps: number;
  stats: Stats;
  atShop: boolean;
  sleeping: boolean;
}

const KEY_MOVE: Record<string, [number, number]> = {
  KeyW: [0, 1], ArrowUp: [0, 1], KeyS: [0, -1], ArrowDown: [0, -1],
  KeyA: [-1, 0], ArrowLeft: [-1, 0], KeyD: [1, 0], ArrowRight: [1, 0],
};

/* ───────── little flying things ───────── */

/** One pool of jelly crumbs for leaf, water, dust and sparks. */
class Bits {
  mesh: THREE.InstancedMesh;
  private p = new Float32Array(200 * 3);
  private v = new Float32Array(200 * 3);
  private life = new Float32Array(200);
  private size = new Float32Array(200);
  private col: THREE.InstancedBufferAttribute;
  private next = 0;
  private d = new THREE.Object3D();
  private c = new THREE.Color();

  constructor(parent: THREE.Object3D, public n = 200) {
    const g = blob(0.085, 0.07, 0.085, 1, 0.3);
    const mat = jellyMaterial({ colour: '#ffffff', gloss: 1, thick: 1.2, rim: 0.6, wrap: 0.9 });
    (mat as THREE.ShaderMaterial).defines!.USE_INSTANCING_COLOR = '';
    setBounds(mat, g);
    this.mesh = new THREE.InstancedMesh(g, mat, n);
    this.col = new THREE.InstancedBufferAttribute(new Float32Array(n * 3).fill(1), 3);
    this.mesh.instanceColor = this.col;
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled = false;
    for (let i = 0; i < n; i++) { this.d.scale.setScalar(0.0001); this.d.updateMatrix(); this.mesh.setMatrixAt(i, this.d.matrix); }
    parent.add(this.mesh);
  }

  burst(x: number, y: number, z: number, count: number, colour: string, spread = 2.2, size = 1) {
    this.c.set(colour);
    for (let k = 0; k < count; k++) {
      const i = this.next = (this.next + 1) % this.n;
      const o = i * 3;
      this.p[o] = x; this.p[o + 1] = y; this.p[o + 2] = z;
      this.v[o] = (Math.random() - 0.5) * spread;
      this.v[o + 1] = 1.4 + Math.random() * spread;
      this.v[o + 2] = (Math.random() - 0.5) * spread;
      this.life[i] = 0.7 + Math.random() * 0.6;
      this.size[i] = size * (0.6 + Math.random() * 0.8);
      this.col.setXYZ(i, this.c.r, this.c.g, this.c.b);
    }
    this.col.needsUpdate = true;
  }

  step(dt: number) {
    let any = false;
    for (let i = 0; i < this.n; i++) {
      if (this.life[i] <= 0) continue;
      any = true;
      const o = i * 3;
      this.life[i] -= dt;
      this.v[o + 1] -= 11 * dt;
      this.p[o] += this.v[o] * dt; this.p[o + 1] += this.v[o + 1] * dt; this.p[o + 2] += this.v[o + 2] * dt;
      const g = heightAt(this.p[o], this.p[o + 2]) + 0.05;
      if (this.p[o + 1] < g) { this.p[o + 1] = g; this.v[o + 1] *= -0.35; this.v[o] *= 0.6; this.v[o + 2] *= 0.6; }
      const s = Math.max(0, Math.min(1, this.life[i] * 2)) * this.size[i];
      this.d.position.set(this.p[o], this.p[o + 1], this.p[o + 2]);
      this.d.scale.setScalar(s <= 0 ? 0.0001 : s);
      this.d.rotation.set(this.p[o] * 3, this.p[o + 1] * 3, 0);
      this.d.updateMatrix();
      this.mesh.setMatrixAt(i, this.d.matrix);
      if (this.life[i] <= 0) { this.d.scale.setScalar(0.0001); this.d.updateMatrix(); this.mesh.setMatrixAt(i, this.d.matrix); }
    }
    if (any) this.mesh.instanceMatrix.needsUpdate = true;
  }
}

/* ───────── the world ───────── */

export class JellyWorld {
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  camera: THREE.PerspectiveCamera;
  estate = new Estate();
  sound = new Sound();

  private sky: THREE.Mesh;
  private terrain: THREE.Mesh;
  private garden!: Garden;
  private village!: Village;
  private bits!: Bits;
  private rain!: THREE.InstancedMesh;
  private mist: THREE.Mesh[] = [];
  private shadows!: THREE.InstancedMesh;

  player: Person;
  private basketLeafMesh!: THREE.Mesh;
  private handObj: THREE.Object3D | null = null;
  private handTool: Tool = 'hand';
  private saplingObj!: THREE.Object3D;

  villagers: Villager[] = [];
  private cow = new Cow();
  private hens!: Hens;
  private dog = new Dog();

  // player motion
  px = 1; pz = 50; py = 0; vy = 0; grounded = true;
  private move = new THREE.Vector2();
  private keys = new Set<string>();
  private yaw = 0; private pitch = 0.2; private dist = 9;
  private camPos = new THREE.Vector3();
  private acting = false;
  private progress = 0;
  private action: Action | null = null;
  private wantJump = false;

  private clock = new THREE.Clock();
  private raf = 0;
  private t = 0;
  private fps = 60; private fpsT = 0; private fpsN = 0;
  private night = 0;
  disposed = false;
  onHud?: (h: Hud) => void;
  private hudT = 0;
  private sleeping = 0;

  constructor(private canvas: HTMLCanvasElement, public quality: Quality) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: quality === 'high', powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, quality === 'high' ? 2 : 1.4));
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setClearColor('#cfe4f0');

    this.camera = new THREE.PerspectiveCamera(58, canvas.clientWidth / canvas.clientHeight, 0.3, 2400);

    this.sky = skyDome(1600);
    this.scene.add(this.sky);
    buildRidges(this.scene);

    this.terrain = buildTerrain(quality);
    this.scene.add(this.terrain);
    buildWater(this.scene);
    this.garden = buildGarden(this.scene, this.estate, quality);
    this.village = buildVillage(this.scene, this.estate);
    buildNature(this.scene, quality);
    this.buildMist();
    this.buildRain();
    this.bits = new Bits(this.scene, quality === 'high' ? 200 : 110);

    // the player, with a basket on the back
    this.player = new Person({ skin: '#e8a877', cloth: JELLY.berry, cloth2: JELLY.marigold, hair: '#30232c' }, 1.0);
    const b = new THREE.Mesh(basket(), this.player.mat);
    this.basketLeafMesh = new THREE.Mesh(basketLeaf(), this.player.mat);
    this.basketLeafMesh.frustumCulled = false;
    b.frustumCulled = false;
    b.add(this.basketLeafMesh);
    this.player.addBack(b);
    this.saplingObj = new THREE.Mesh(sapling(), this.player.mat);
    this.saplingObj.visible = false;
    this.player.addHand(this.saplingObj);
    this.player.onStep = (x, z, hard) => this.thump(x, z, 1.6 + hard * 1.4, 0.3 + hard * 0.5);
    this.player.place(this.px, this.pz, 0);
    this.scene.add(this.player.group);

    this.buildFolk();
    this.buildShadows();

    window.addEventListener('keydown', this.onKey);
    window.addEventListener('keyup', this.onKey);
    canvas.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
    canvas.addEventListener('wheel', this.onWheel, { passive: false });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    this.estate.say('Welcome to Jellynoor. Walk up the path and see what wants doing.');
    this.resize();
    this.raf = requestAnimationFrame(this.frame);
  }

  /* ── building the inhabitants ── */

  private buildFolk() {
    this.villagers = makeVillagers(9);
    for (const v of this.villagers) {
      v.person.onStep = (x, z, hard) => this.thump(x, z, 1.2, 0.18 + hard * 0.2);
      this.scene.add(v.group);
    }
    this.assignRounds();
    this.cow.place(19, 23.4, 0.6);
    this.scene.add(this.cow.group);
    this.hens = new Hens(6, 16, 48.5, 5);
    this.scene.add(this.hens.group);
    this.dog.place(2, 44);
    this.scene.add(this.dog.group);
  }

  /** Give each villager a round of chores suited to the hour. */
  private assignRounds(night = false) {
    const E = this.estate;
    const at = (id: string): Station | null => {
      const s = E.spots.find((q) => q.id === id);
      return s ? { x: s.x, z: s.z, job: 'work', mins: 6 + Math.random() * 6 } : null;
    };
    const rows = (n: number, from: number): Station[] => {
      const planted = E.bushes.filter((b) => b.planted);
      const out: Station[] = [];
      for (let i = 0; i < n; i++) {
        const b = planted[(from + i * 37) % Math.max(1, planted.length)];
        if (b) out.push({ x: b.x + 0.9, z: b.z + 0.6, job: 'work', mins: 5 + Math.random() * 7 });
      }
      return out;
    };
    const homes: Station[] = [
      { x: -15, z: 46.6, job: 'rest', mins: 90 }, { x: -21, z: 33, job: 'rest', mins: 90 }, { x: 15, z: 48.4, job: 'rest', mins: 90 },
    ];
    const pick = (...a: (Station | null)[]) => a.filter(Boolean) as Station[];

    const rounds: Station[][] = night
      ? this.villagers.map((_, i) => [homes[i % homes.length], { x: 6 + (i % 3), z: 36, job: 'rest', mins: 30 }])
      : [
        [...rows(4, 3), ...pick(at('weigh'))],                            // plucking the upper rows
        [...rows(4, 51), ...pick(at('weigh'))],                           // and the lower
        pick(at('wither'), at('roll'), at('dry'), at('pack')),            // the factory round
        pick(at('sweep1'), at('sweep2'), at('line'), at('sweep3')),       // the yard
        pick(at('chai'), at('serve'), at('shop')),                        // the stall
        pick(at('chop'), at('woodpile'), at('chop')),                     // firewood
        pick(at('cow'), at('tap'), at('coop')),                           // the animals
        [...pick(at('nursery')), ...rows(3, 91)],                         // planting out
        [{ x: 10, z: 46, job: 'rest', mins: 4 }, { x: 16, z: 50, job: 'work', mins: 5 }, { x: 24, z: 62, job: 'rest', mins: 6 }, { x: 0, z: 40, job: 'rest', mins: 4 }],
      ];
    this.villagers.forEach((v, i) => {
      const r = rounds[i % rounds.length];
      v.setRound(r.length ? r : [{ x: VILLAGE.x, z: VILLAGE.z, job: 'rest', mins: 10 }], i);
      if (!v.person.y) v.person.place(r[0]?.x ?? 0, r[0]?.z ?? 36);
    });
  }

  private buildShadows() {
    const g = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
    this.shadows = new THREE.InstancedMesh(g, blobShadowMaterial(), 40);
    this.shadows.frustumCulled = false;
    this.shadows.renderOrder = 2;
    this.scene.add(this.shadows);
  }

  private buildMist() {
    const tex = (() => {
      const c = document.createElement('canvas'); c.width = c.height = 128;
      const g = c.getContext('2d')!;
      const grad = g.createRadialGradient(64, 64, 4, 64, 64, 62);
      grad.addColorStop(0, 'rgba(255,255,255,0.55)');
      grad.addColorStop(0.6, 'rgba(255,255,255,0.22)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = grad; g.fillRect(0, 0, 128, 128);
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace;
      return t;
    })();
    const rng = mulberry(808);
    for (let i = 0; i < 7; i++) {
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(150, 150).rotateX(-Math.PI / 2),
        new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0.5, fog: false }),
      );
      m.position.set((rng() - 0.5) * 220, 2 + rng() * 12, 40 + rng() * 160);
      m.renderOrder = 5;
      this.mist.push(m);
      this.scene.add(m);
    }
  }

  private buildRain() {
    const g = blob(0.02, 0.19, 0.02, 1);
    const mat = new THREE.MeshBasicMaterial({ color: '#cfeaf7', transparent: true, opacity: 0.55, depthWrite: false });
    this.rain = new THREE.InstancedMesh(g, mat, this.quality === 'high' ? 420 : 200);
    this.rain.frustumCulled = false;
    this.rain.visible = false;
    this.scene.add(this.rain);
  }

  /* ── input ── */

  private onKey = (e: KeyboardEvent) => {
    const down = e.type === 'keydown';
    if (down) this.keys.add(e.code); else this.keys.delete(e.code);
    if (e.code === 'Space') { e.preventDefault(); if (down) this.wantJump = true; }
    if (e.code === 'KeyE' || e.code === 'Enter') { this.acting = down; if (down) this.sound.resume(); }
    if (down && e.code === 'KeyQ') this.dist = this.dist > 11 ? 5.5 : this.dist + 3;
  };

  private dragging = false; private lastX = 0; private lastY = 0; private pid = -1;
  private onPointerDown = (e: PointerEvent) => {
    this.sound.resume();
    if (e.button === 2 || e.pointerType !== 'mouse' || e.button === 0) {
      this.dragging = true; this.pid = e.pointerId; this.lastX = e.clientX; this.lastY = e.clientY;
    }
  };
  private onPointerMove = (e: PointerEvent) => {
    if (!this.dragging || e.pointerId !== this.pid) return;
    this.look(e.clientX - this.lastX, e.clientY - this.lastY);
    this.lastX = e.clientX; this.lastY = e.clientY;
  };
  private onPointerUp = (e: PointerEvent) => { if (e.pointerId === this.pid) { this.dragging = false; this.pid = -1; } };
  private onWheel = (e: WheelEvent) => { e.preventDefault(); this.dist = clamp(this.dist + Math.sign(e.deltaY) * 0.9, 3.2, 18); };

  look(dx: number, dy: number) {
    this.yaw -= dx * 0.005;
    this.pitch = clamp(this.pitch + dy * 0.004, -0.35, 1.15);
  }
  /** For the thumbstick on a phone. */
  setMove(x: number, y: number) { this.move.set(clamp(x, -1, 1), clamp(y, -1, 1)); }
  setAction(on: boolean) { this.acting = on; if (on) this.sound.resume(); }
  jump() { this.wantJump = true; this.sound.resume(); }
  buy(id: string) { const err = this.estate.buy(id); if (err) this.estate.say(err); else this.sound.play('pack'); }

  /* ── making things wobble ── */

  /** Shake everything within reach: bushes, props and anyone standing near. */
  thump(x: number, z: number, radius: number, force: number) {
    const r2 = radius * radius;
    const bs = this.estate.bushes;
    for (let i = 0; i < bs.length; i++) {
      const b = bs[i];
      if (!b.planted) continue;
      const d2 = (b.x - x) ** 2 + (b.z - z) ** 2;
      if (d2 > r2) continue;
      const f = (1 - Math.sqrt(d2) / radius) * force;
      const a = Math.atan2(b.x - x, b.z - z);
      this.garden.jig.kick(i, Math.sin(a) * f * 0.45, Math.cos(a) * f * 0.45, -f * 0.5, (Math.random() - 0.5) * f * 0.3);
    }
    for (const p of this.village.props) {
      const d = Math.hypot(p.x - x, p.z - z);
      if (d > radius + p.r * 0.4) continue;
      const f = Math.max(0, 1 - d / (radius + p.r * 0.4)) * force * 0.5;
      p.wob.kick((Math.random() - 0.5) * f, (Math.random() - 0.5) * f, -f * 0.5);
    }
    if (Math.hypot(this.cow.x - x, this.cow.z - z) < radius + 1.5) this.cow.nudge();
  }

  /* ── the loop ── */

  private frame = () => {
    if (this.disposed) return;
    this.raf = requestAnimationFrame(this.frame);
    const raw = this.clock.getDelta();
    const dt = Math.min(0.05, raw);
    this.t += dt;
    U.uTime.value = this.t;

    this.fpsT += raw; this.fpsN++;
    if (this.fpsT > 0.5) { this.fps = this.fpsN / this.fpsT; this.fpsT = 0; this.fpsN = 0; }

    this.estate.step(dt);
    this.stepDayLight();
    this.stepPlayer(dt);
    this.stepAction(dt);
    this.stepFolk(dt);
    this.stepWeather(dt);
    this.garden.jig.step(dt);
    for (const p of this.village.props) p.wob.step(dt);
    this.bits.step(dt);
    this.stepShadows();
    this.stepCamera(dt);

    this.renderer.render(this.scene, this.camera);

    this.hudT += dt;
    if (this.hudT > 0.1) { this.hudT = 0; this.pushHud(); }
  };

  /* ── sun, sky and lamps ── */

  private stepDayLight() {
    const c = this.estate.clock;
    // the sun climbs from six to six
    const a = ((c - 6) / 12) * Math.PI;
    const up = Math.sin(a);
    U.uSunDir.value.set(Math.cos(a) * 0.75, Math.max(-0.35, up), 0.42).normalize();
    this.night = clamp((0.14 - up) / 0.42, 0, 1);

    const warm = clamp(1 - Math.abs(up - 0.22) * 2.1, 0, 1);  // dawn and dusk
    const sun = new THREE.Color('#fff3d9').lerp(new THREE.Color('#ff9a52'), warm * 0.75).lerp(new THREE.Color('#2e3f6b'), this.night * 0.8);
    U.uSunCol.value.copy(sun);
    const sky = new THREE.Color('#bfe2ff').lerp(new THREE.Color('#ffc69a'), warm * 0.55).lerp(new THREE.Color('#141d3a'), this.night * 0.85);
    U.uSkyCol.value.copy(sky);
    U.uGndCol.value.copy(new THREE.Color('#7e9a63').lerp(new THREE.Color('#1b2436'), this.night * 0.8));

    const fog = new THREE.Color('#dfeaf2').lerp(new THREE.Color('#ffb98a'), warm * 0.5).lerp(new THREE.Color('#10172e'), this.night * 0.82);
    if (this.estate.raining) fog.lerp(new THREE.Color('#aebcc6'), 0.5);
    U.uFogCol.value.copy(fog);
    this.renderer.setClearColor(fog);

    // the morning mist sits in the valley until the sun burns it off
    const dawnMist = clamp(1 - (c - 5.5) / 3.4, 0, 1) + clamp((c - 18) / 3, 0, 1) * 0.6;
    const target = 0.18 + dawnMist * 0.8 + (this.estate.raining ? 0.45 : 0);
    U.uMist.value += (target - U.uMist.value) * 0.02;
    U.uFogNear.value = 34;
    U.uFogFar.value = 205 - dawnMist * 70;

    const sm = this.sky.material as THREE.ShaderMaterial;
    (sm.uniforms.uTop.value as THREE.Color).copy(new THREE.Color('#5fb4ea').lerp(new THREE.Color('#0b1430'), this.night * 0.92));
    (sm.uniforms.uMid.value as THREE.Color).copy(new THREE.Color('#cfe9f7').lerp(new THREE.Color('#ffb07a'), warm * 0.6).lerp(new THREE.Color('#16224a'), this.night * 0.9));
    (sm.uniforms.uBot.value as THREE.Color).copy(fog);

    U.uNight.value = this.night;
    for (const l of this.village.lamps) l.mat.uniforms.uEmitMul.value = l.spot.lit ? 1.5 : 0.1;
    U.uWind.value = 0.2 + (this.estate.raining ? 0.35 : 0) + Math.sin(this.t * 0.17) * 0.1;
  }

  /* ── walking ── */

  private stepPlayer(dt: number) {
    let mx = this.move.x, my = this.move.y;
    for (const k of this.keys) { const m = KEY_MOVE[k]; if (m) { mx += m[0]; my += m[1]; } }
    const len = Math.hypot(mx, my);
    if (len > 1) { mx /= len; my /= len; }
    const run = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight');
    const sp = (run ? 7.4 : 4.3) * Math.min(1, Math.hypot(mx, my));

    // move relative to where the camera is looking
    const sin = Math.sin(this.yaw), cos = Math.cos(this.yaw);
    const dx = (mx * cos - my * sin), dz = (mx * sin + my * cos) * -1;
    const nx = this.px + dx * sp * dt, nz = this.pz + dz * sp * dt;

    if (Math.hypot(mx, my) > 0.05) {
      const bound = WORLD - 4;
      const okX = Math.abs(nx) < bound && slopeAt(nx, this.pz) < 0.78;
      const okZ = Math.abs(nz) < bound && slopeAt(this.px, nz) < 0.78;
      if (okX) this.px = nx;
      if (okZ) this.pz = nz;
      this.player.facing = Math.atan2(dx, dz);
    }
    this.player.speed = Math.hypot(mx, my) > 0.05 ? sp : 0;
    this.player.x = this.px; this.player.z = this.pz;

    // the hop
    const ground = heightAt(this.px, this.pz);
    if (this.wantJump && this.grounded) {
      this.wantJump = false; this.grounded = false; this.vy = 7.2;
      this.player.wob.kick(0, 0, 0.9);
      this.sound.play('hop');
    }
    this.wantJump = false;
    if (!this.grounded) {
      this.vy -= 22 * dt;
      this.py += this.vy * dt;
      if (this.py <= ground) {
        this.py = ground; this.grounded = true;
        const hard = Math.min(1, -this.vy / 9);
        this.vy = 0;
        this.player.wob.kick(0, 0, -1.5 - hard);
        this.thump(this.px, this.pz, 4.5 + hard * 3, 1.1 + hard);
        this.bits.burst(this.px, ground + 0.1, this.pz, 6, '#d8c49a', 2.4, 0.7);
        this.sound.play('land');
      }
    } else {
      this.py = ground;
    }
    this.player.y = this.py;
    this.player.anim = this.action && this.progress > 0 ? 'work' : (this.estate.inv.leaf > this.estate.inv.basketMax * 0.65 ? 'carry' : (this.player.speed > 0.1 ? 'walk' : 'idle'));
    this.player.update(dt, this.t);
    this.player.group.position.y = this.py;

    // brushing past a bush sets it going
    if (this.player.speed > 0.1) this.thump(this.px, this.pz, 1.5, 0.3 * dt * 60 * 0.08);

    // what is in the basket, and what is in the hand
    const fill = this.estate.inv.leaf / this.estate.inv.basketMax;
    this.basketLeafMesh.visible = fill > 0.02;
    this.basketLeafMesh.scale.setScalar(0.55 + fill * 0.65);
    this.saplingObj.visible = this.handTool === 'sapling' && this.estate.inv.saplings > 0;
  }

  private setHand(tool: Tool) {
    if (tool === this.handTool) return;
    this.handTool = tool;
    this.estate.inv.hand = tool;
    if (this.handObj) { this.handObj.removeFromParent(); this.handObj = null; }
    if (tool !== 'hand' && tool !== 'basket' && tool !== 'sapling') {
      const o = toolMesh(tool, this.player.mat);
      if (o) { this.player.addHand(o); this.handObj = o; }
    }
  }

  /* ── doing the job in front of you ── */

  private stepAction(dt: number) {
    const a = this.estate.actionAt(this.px, this.pz);
    const changed = a?.kind !== this.action?.kind || a?.bush !== this.action?.bush || a?.spot !== this.action?.spot;
    this.action = a;
    if (changed) this.progress = 0;

    // pick up whatever the job wants, if it is already yours
    const want: Tool = a && this.estate.inv.owned.has(a.tool) ? a.tool : (a?.tool === 'sapling' && this.estate.inv.saplings > 0 ? 'sapling' : 'hand');
    this.setHand(want === 'basket' ? 'hand' : want);

    if (!a || a.blocked || !this.acting) { if (!this.acting) this.progress = Math.max(0, this.progress - dt * 2); return; }

    this.progress += dt / Math.max(0.2, a.secs);
    // a little shake while the work is going on
    if (a.bush) {
      const i = this.estate.bushes.indexOf(a.bush);
      if (i >= 0 && Math.random() < dt * 12) this.garden.jig.kick(i, (Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5, -0.3);
    }
    if (a.spot) {
      const p = this.village.props.find((q) => Math.hypot(q.x - a.spot!.x, q.z - a.spot!.z) < 3);
      if (p && Math.random() < dt * 8) p.wob.kick((Math.random() - 0.5) * 0.3, 0, -0.25);
    }

    if (this.progress >= 1) {
      this.progress = 0;
      this.finish(a);
    }
  }

  private finish(a: Action) {
    const before = this.estate.stats.chestsTotal;
    const r = this.estate.complete(a);
    if (r.text) this.estate.say(r.text);
    if (r.sound) this.sound.play(r.sound);

    const bx = a.bush?.x ?? a.spot?.x ?? this.px;
    const bz = a.bush?.z ?? a.spot?.z ?? this.pz;
    const by = heightAt(bx, bz);
    this.thump(bx, bz, 3.5, (r.kick ?? 0.4) * 1.6);

    switch (a.kind) {
      case 'pluck': this.bits.burst(bx, by + 0.7, bz, 9, JELLY.leafNew, 2.4, 0.9); break;
      case 'plant': this.bits.burst(bx, by + 0.2, bz, 8, JELLY.earth, 2.0, 0.9); break;
      case 'weed': this.bits.burst(bx, by + 0.3, bz, 7, JELLY.grassDry, 2.2); break;
      case 'prune': this.bits.burst(bx, by + 0.6, bz, 10, JELLY.leaf, 2.6); break;
      case 'water': case 'fill-can': this.bits.burst(bx, by + 0.8, bz, 10, JELLY.water, 1.8, 0.7); break;
      case 'chop': this.bits.burst(bx, by + 0.8, bz, 12, JELLY.wood, 3.2, 1.1); break;
      case 'milk': this.bits.burst(bx, by + 0.6, bz, 7, JELLY.milk, 1.4, 0.6); break;
      case 'sweep': this.bits.burst(bx, by + 0.2, bz, 9, '#d8c49a', 2.4, 0.7); break;
      case 'bell': this.thump(bx, bz, 14, 1.4); this.bits.burst(bx, by + 2, bz, 14, JELLY.mango, 3.4, 0.9); break;
      case 'feed-hens': this.hens.flurry(); this.bits.burst(bx, by + 0.6, bz, 10, JELLY.mango, 2.2, 0.5); break;
      case 'pack': this.bits.burst(bx, by + 0.8, bz, 12, JELLY.lemon, 2.6); break;
      case 'serve': this.bits.burst(bx, by + 1.3, bz, 6, JELLY.chai, 1.4, 0.6); break;
    }

    if (a.bush) {
      const i = this.estate.bushes.indexOf(a.bush);
      if (i >= 0) {
        this.garden.refresh(i);
        this.garden.repack();
        this.garden.bushes.instanceMatrix.needsUpdate = true;
        if (this.garden.bushes.instanceColor) this.garden.bushes.instanceColor.needsUpdate = true;
        if (a.kind === 'plant') this.garden.jig.setGrow(i, 0);
      }
    }
    if (a.kind === 'spread') this.village.heaps.forEach((h) => (h.visible = true));
    if (a.kind === 'hang') this.village.washing.forEach((w) => (w.visible = true));
    if (this.estate.stats.chestsTotal > before) {
      const n = Math.min(this.village.chests.length, this.estate.stats.chestsTotal);
      for (let i = 0; i < n; i++) this.village.chests[i].visible = true;
    }
    if (a.kind === 'sleep') { this.sleeping = 1.4; this.village.heaps.forEach((h) => (h.visible = false)); }
    this.dog.target.set(this.px, this.pz);
  }

  /* ── everyone else ── */

  private stepFolk(dt: number) {
    const night = this.estate.clock > 19 || this.estate.clock < 6.2;
    if (night !== this.wasNight) { this.wasNight = night; this.assignRounds(night); }
    for (const v of this.villagers) { v.update(dt); v.person.update(dt, this.t); }
    this.cow.update(dt);
    this.hens.update(dt, this.t);
    this.dog.update(dt, this.t);
    if (Math.random() < dt * 0.12) this.dog.target.set(this.px + (Math.random() - 0.5) * 6, this.pz + (Math.random() - 0.5) * 6);

    // bushes creep towards their drawn state: growth, drying out, weeds
    this.refreshT -= dt;
    if (this.refreshT <= 0) {
      this.refreshT = 0.6;
      const n = this.estate.bushes.length;
      const step = Math.ceil(n / 8);
      for (let k = 0; k < step; k++) {
        const i = (this.refreshI + k) % n;
        this.garden.refresh(i);
        if (this.garden.jig.grow.array[i] < 1) this.garden.jig.setGrow(i, Math.min(1, (this.garden.jig.grow.array as Float32Array)[i] + 0.25));
      }
      this.refreshI = (this.refreshI + step) % n;
      this.garden.repack();
      this.garden.bushes.instanceMatrix.needsUpdate = true;
      if (this.garden.bushes.instanceColor) this.garden.bushes.instanceColor.needsUpdate = true;
    }
  }
  private wasNight = false;
  private refreshT = 0; private refreshI = 0;

  /* ── mist and rain ── */

  private stepWeather(dt: number) {
    for (let i = 0; i < this.mist.length; i++) {
      const m = this.mist[i];
      m.position.x += dt * (1.4 + i * 0.25);
      if (m.position.x > 220) m.position.x = -220;
      const mat = m.material as THREE.MeshBasicMaterial;
      mat.opacity = clamp(U.uMist.value * 0.3, 0, 0.6);
      mat.color.copy(U.uFogCol.value).lerp(new THREE.Color('#ffffff'), 0.5);
    }

    const r = this.estate.raining;
    this.rain.visible = r;
    this.sound.rain(r);
    if (r) {
      const n = this.rain.count;
      const d = new THREE.Object3D();
      for (let i = 0; i < n; i++) {
        const seed = i * 97.13;
        const x = this.px + ((seed * 0.37 % 40) - 20);
        const z = this.pz + ((seed * 0.73 % 40) - 20);
        const y = heightAt(x, z) + 22 - ((this.t * 26 + seed) % 24);
        d.position.set(x, y, z);
        d.scale.set(1, 1.6, 1);
        d.updateMatrix();
        this.rain.setMatrixAt(i, d.matrix);
      }
      this.rain.instanceMatrix.needsUpdate = true;
      if (Math.random() < dt * 9) this.thump(this.px + (Math.random() - 0.5) * 16, this.pz + (Math.random() - 0.5) * 16, 2.4, 0.12);
    }
  }

  /* ── shadows under the movers ── */

  private stepShadows() {
    const d = new THREE.Object3D();
    let i = 0;
    const put = (x: number, z: number, s: number) => {
      if (i >= 40) return;
      d.position.set(x, heightAt(x, z) + 0.06, z);
      d.scale.set(s, 1, s);
      d.updateMatrix();
      this.shadows.setMatrixAt(i++, d.matrix);
    };
    put(this.px, this.pz, 1.5 + (this.py - heightAt(this.px, this.pz)) * 0.25);
    for (const v of this.villagers) put(v.person.x, v.person.z, 1.4);
    put(this.cow.x, this.cow.z, 2.4);
    put(this.dog.x, this.dog.z, 1.0);
    while (i < 40) { d.position.set(0, -500, 0); d.scale.setScalar(0.001); d.updateMatrix(); this.shadows.setMatrixAt(i++, d.matrix); }
    this.shadows.instanceMatrix.needsUpdate = true;
  }

  /* ── camera ── */

  private stepCamera(dt: number) {
    const head = new THREE.Vector3(this.px, this.py + 1.5, this.pz);
    const want = new THREE.Vector3(
      head.x + Math.sin(this.yaw) * Math.cos(this.pitch) * this.dist,
      head.y + Math.sin(this.pitch) * this.dist + 1.2,
      head.z + Math.cos(this.yaw) * Math.cos(this.pitch) * this.dist,
    );
    const floor = heightAt(want.x, want.z) + 1.4;
    if (want.y < floor) want.y = floor;
    const k = Math.min(1, dt * (this.camPos.lengthSq() === 0 ? 1 : 8));
    this.camPos.lerp(want, k);
    if (this.camPos.lengthSq() === 0) this.camPos.copy(want);
    this.camera.position.copy(this.camPos);
    this.camera.lookAt(head);
    this.sky.position.copy(this.camPos);
    this.sound.listen(this.camPos, this.estate, this.night);
    if (this.sleeping > 0) this.sleeping -= dt;
  }

  /* ── talking to React ── */

  private pushHud() {
    const e = this.estate, inv = e.inv;
    this.onHud?.({
      day: e.day, clock: e.clockText, part: e.partOfDay,
      prompt: this.action ? { label: this.action.label, hint: this.action.hint, blocked: this.action.blocked } : null,
      progress: this.progress,
      leaf: inv.leaf, leafMax: inv.basketMax, coins: inv.coins, saplings: inv.saplings,
      can: inv.can, milk: inv.milk, wood: inv.firewood,
      factory: e.factory, tool: this.handTool, tools: [...inv.owned],
      toasts: e.toasts.map((t) => t.text),
      todo: e.todo(), raining: e.raining, fps: this.fps, stats: e.stats,
      atShop: this.action?.kind === 'shop',
      sleeping: this.sleeping > 0,
    });
  }

  resize() {
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    window.removeEventListener('keydown', this.onKey);
    window.removeEventListener('keyup', this.onKey);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    this.canvas.removeEventListener('wheel', this.onWheel);
    this.sound.stop();
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
      const mat = m.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach((x) => x.dispose()); else mat?.dispose();
    });
    this.renderer.dispose();
  }
}

export { VILLAGE, POND, LOOK_COUNT };
