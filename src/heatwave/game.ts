import * as THREE from 'three';
import { DAMAGE, INTERCEPTOR, PLAYER, POLICE, SCORE, WANTED } from './config';
import { Vehicle, resolvePair, resolveStatic, contact, type Shape } from './physics';
import { Arena, D, W, type Prop } from './arena';
import { flashSirens, interceptorCar, playerCar, policeCar, type CarRig, type Driver } from './cars';
import { drive, type Cop } from './ai';
import { FX, Popups } from './fx';
import { Audio } from './audio';

/**
 * HEATWAVE — the game.
 *
 * One loop: read the thumb, steer the car, let the police aim at where it is
 * going to be, move everything in small steps, sort out who hit what and how
 * hard, turn that into damage and score and noise and smoke, raise the heat,
 * send more cops. The police are the player's only weapon: a cop dies by
 * hitting a wall, a rock, a barrel, or another cop.
 */

export interface Hud {
  score: number;
  wanted: number;
  hull: number;
  best: number;
  time: number;
  chain: number;
}
export interface Result { score: number; best: number; time: number; smashed: number; newBest: boolean }

type State = 'ready' | 'play' | 'dying' | 'over';

const CHAIN_NAMES = ['COP SMASHED', 'DOUBLE SMASH', 'TRIPLE SMASH', 'PILEUP!'];
const BEST_KEY = 'heatwave.best';
const loadBest = () => { try { return Number(localStorage.getItem(BEST_KEY) || 0); } catch { return 0; } };

export class Game {
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(48, 1, 1, 600);
  arena = new Arena();
  fx: FX;
  audio = new Audio();
  popups: Popups;
  state: State = 'ready';

  player = new Vehicle(PLAYER);
  playerRig: CarRig;
  private driverKind: Driver;
  hull = DAMAGE.playerHull;
  score = 0;
  private scoreFrac = 0;
  time = 0;
  wanted = 1;
  best = loadBest();
  smashed = 0;
  private chain = 0;
  private chainT = 0;
  private driftT = 0;
  private cops: Cop[] = [];
  private spawnT = 0;
  private hitStop = 0;
  private slowmo = 1;
  private dyingT = 0;
  private lastHud = 0;
  private stick: { x: number; y: number } | null = null;
  private keys = new Set<string>();
  private goal = Math.PI;
  private camLook = new THREE.Vector3();
  private camPos = new THREE.Vector3();
  private propOf = new Map<Shape, Prop>();
  private obstacles: Shape[] = [];
  private arrows: HTMLDivElement[] = [];
  private prevWheels = new Map<Vehicle, [number, number, number, number]>();
  private wasAir = new Set<Vehicle>();
  private raf = 0;
  private last = performance.now();
  private width = 1;
  private height = 1;

  constructor(canvas: HTMLCanvasElement, host: HTMLElement, private onHud: (h: Hud) => void, private onOver: (r: Result) => void, driverKind: Driver = 'boss') {
    const dpr = window.devicePixelRatio || 1;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: dpr < 2, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(dpr, 1.75));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.NeutralToneMapping;
    this.scene.background = new THREE.Color('#f3c992');
    this.scene.fog = new THREE.Fog('#f3c992', 90, 220);
    const hemi = new THREE.HemisphereLight('#fff4e0', '#c8844a', 1.6);
    const sun = new THREE.DirectionalLight('#fff0d8', 2.2);
    sun.position.set(-40, 80, 30);
    this.scene.add(hemi, sun, this.arena.group);
    this.fx = new FX(this.scene);
    this.popups = new Popups(host);
    this.driverKind = driverKind;
    this.playerRig = playerCar(driverKind);
    this.scene.add(this.playerRig.root);
    for (const p of this.arena.props) this.propOf.set(p.shape, p);
    // only the obvious things are worth a cop's attention
    this.obstacles = this.arena.shapes.filter((s) => !this.propOf.has(s));
    for (let i = 0; i < 12; i++) this.cops.push(this.makeCop('cop'));
    for (let i = 0; i < 5; i++) this.cops.push(this.makeCop('interceptor'));
    for (let i = 0; i < 17; i++) {
      const a = document.createElement('div');
      a.className = 'hw-arrow';
      host.appendChild(a);
      this.arrows.push(a);
    }
    window.addEventListener('keydown', this.onKey);
    window.addEventListener('keyup', this.onKey);
    this.reset();
    this.raf = requestAnimationFrame(this.loop);
  }

  private makeCop(kind: Cop['kind']): Cop {
    const rig = kind === 'cop' ? policeCar() : interceptorCar();
    rig.root.visible = false;
    rig.root.traverse((o) => {
      const m = (o as THREE.Mesh).material as THREE.MeshLambertMaterial | undefined;
      if (m && 'color' in m && !(o as THREE.Sprite).isSprite) o.userData.base = m.color.clone();
    });
    this.scene.add(rig.root);
    const v = new Vehicle(kind === 'cop' ? POLICE : INTERCEPTOR);
    v.radius = kind === 'cop' ? 1.3 : 1.2;
    v.alive = false;
    const hull = kind === 'cop' ? DAMAGE.policeHull : DAMAGE.interceptorHull;
    return { v, rig, kind, hull, maxHull: hull, active: false, dead: false, deadT: 0, think: 0, goal: 0, blind: false, stuckT: 0, reverseT: 0, lastContact: -9, near: false, nearCool: 0, phase: Math.random() * 2, smokeT: 0, px: [] };
  }

  setDriver(d: Driver) {
    if (d === this.driverKind) return;
    this.driverKind = d;
    this.scene.remove(this.playerRig.root);
    this.playerRig = playerCar(d);
    this.scene.add(this.playerRig.root);
  }

  /** The thumb: a direction on screen, or null to hold the last one. */
  setStick(v: { x: number; y: number } | null) { this.stick = v; }

  private onKey = (e: KeyboardEvent) => {
    const k = e.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(k)) {
      if (e.type === 'keydown') this.keys.add(k); else this.keys.delete(k);
      e.preventDefault();
    }
  };

  reset() {
    this.state = 'ready';
    this.hull = DAMAGE.playerHull;
    this.score = 0;
    this.scoreFrac = 0;
    this.time = 0;
    this.wanted = 1;
    this.smashed = 0;
    this.chain = 0;
    this.chainT = 0;
    this.driftT = 0;
    this.slowmo = 1;
    this.hitStop = 0;
    const p = this.player;
    Object.assign(p, { x: 0, z: 58, vx: 0, vz: -6, h: Math.PI, spin: 0, control: 1, y: 0, vy: 0, alive: true, throttle: 1 });
    this.goal = Math.PI;
    this.charred(this.playerRig, false);
    for (const c of this.cops) this.retire(c);
    this.arena.resetProps();
    this.arena.clearMarks();
    this.fx.clear();
    this.prevWheels.clear();
    this.camLook.set(p.x, 0, p.z);
    this.camPos.set(p.x, 30, p.z + 18);
    this.spawnT = 0;
  }

  start() {
    this.audio.start();
    if (this.state !== 'ready') this.reset();
    this.state = 'play';
    // the first two are already on their way
    this.spawn();
    this.spawn();
  }

  resize(w: number, h: number) {
    this.width = w;
    this.height = h;
    this.camera.aspect = w / Math.max(1, h);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
    const px = h * this.renderer.getPixelRatio() / (2 * Math.tan((this.camera.fov * Math.PI) / 360));
    this.fx.setScale(px);
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    window.removeEventListener('keydown', this.onKey);
    window.removeEventListener('keyup', this.onKey);
    this.audio.ctx?.close();
    this.renderer.dispose();
  }

  /* ── police ───────────────────────────────────────────────────────── */

  private retire(c: Cop) {
    c.active = false;
    c.dead = false;
    c.v.alive = false;
    c.rig.root.visible = false;
  }

  private spawn() {
    const lvl = this.wanted - 1;
    const wantInterceptor = Math.random() < WANTED.interceptorChance[lvl]!;
    const c = this.cops.find((q) => !q.active && q.kind === (wantInterceptor ? 'interceptor' : 'cop')) || this.cops.find((q) => !q.active);
    if (!c) return;
    // somewhere near the edge, well away from the player and off screen
    const p = this.player;
    let best: [number, number] | null = null;
    for (let tries = 0; tries < 24; tries++) {
      const side = Math.floor(Math.random() * 4);
      const u = Math.random() - 0.5;
      const x = side < 2 ? u * (W - 12) : (side === 2 ? -1 : 1) * (W / 2 - 5);
      const z = side < 2 ? (side === 0 ? -1 : 1) * (D / 2 - 5) : u * (D - 12);
      if (Math.hypot(x - p.x, z - p.z) < 48) continue;
      const probe = new Vehicle(POLICE);
      probe.x = x;
      probe.z = z;
      probe.radius = 3;
      if (this.arena.shapes.some((s) => contact(probe, s))) continue;
      best = [x, z];
      break;
    }
    if (!best) return;
    const v = c.v;
    const h = Math.atan2(p.x - best[0], p.z - best[1]);
    Object.assign(v, { x: best[0], z: best[1], h, vx: Math.sin(h) * 8, vz: Math.cos(h) * 8, spin: 0, control: 1, y: 0, vy: 0, alive: true, throttle: 1 });
    v.speedMul = WANTED.speed[lvl]!;
    c.hull = c.maxHull;
    c.active = true;
    c.dead = false;
    c.goal = h;
    c.think = 0;
    c.reverseT = 0;
    c.stuckT = 0;
    c.near = false;
    c.rig.root.visible = true;
    this.charred(c.rig, false);
  }

  /** A wreck goes black; a fresh car gets its paint back. */
  private charred(rig: CarRig, on: boolean) {
    rig.root.traverse((o) => {
      const m = (o as THREE.Mesh).material as THREE.MeshLambertMaterial | undefined;
      if (!m || (o as THREE.Sprite).isSprite || !('color' in m)) return;
      if (!o.userData.base) o.userData.base = m.color.clone();
      m.color.copy(o.userData.base as THREE.Color);
      if (on) m.color.multiplyScalar(0.22);
    });
    for (const s of rig.sirens) s.glow.visible = !on;
  }

  private damageCop(c: Cop, amount: number, x: number, z: number) {
    if (!c.active || c.dead || amount <= 0) return;
    c.hull -= amount;
    if (c.hull <= 0) this.kill(c, x, z);
  }

  private kill(c: Cop, x: number, z: number) {
    c.dead = true;
    c.deadT = 2.6;
    c.v.alive = false;
    c.v.throttle = 0;
    c.v.spin += (Math.random() - 0.5) * 8;
    c.v.vy = 7;
    c.v.y = Math.max(c.v.y, 0.1);
    this.charred(c.rig, true);
    this.smashed++;
    this.fx.explosion(c.v.x, c.v.z, 1);
    this.fx.debris.burst(c.v.x, 1.2, c.v.z, 14, 11, c.kind === 'cop' ? ['#f4f4f0', '#1e2230', '#ff2a2a', '#2a6aff', '#23201e'] : ['#1c2a5a', '#2ae0ff', '#3a4a6a', '#23201e']);
    this.arena.scorch(c.v.x, c.v.z, 5);
    this.audio.explosion();
    this.audio.crunch();
    this.fx.shake(0.55);
    this.hitStop = Math.max(this.hitStop, 0.075);
    // the chain: kills close together are worth far more than kills apart
    this.chain = this.chainT > 0 ? this.chain + 1 : 1;
    this.chainT = SCORE.chainWindow;
    const k = Math.min(this.chain, 4) - 1;
    const pts = SCORE.smash[k]!;
    this.addScore(pts);
    const [sx, sy] = this.toScreen(x, z);
    this.popups.show(CHAIN_NAMES[k]!, pts, k > 0 ? 'combo' : 'smash', sx, sy - 40);
    this.audio.score(this.chain);
    if (this.chain >= 3) { this.fx.zoomKick = 1; this.fx.shake(0.4); }
    // the blast shoves everything near it, and hurts other cops: that is how pileups start
    for (const o of this.cops) {
      if (o === c || !o.active) continue;
      const dx = o.v.x - c.v.x;
      const dz = o.v.z - c.v.z;
      const d = Math.hypot(dx, dz);
      if (d < 7 && d > 0) {
        const f = (1 - d / 7) * 14;
        o.v.vx += (dx / d) * f;
        o.v.vz += (dz / d) * f;
        o.v.spin += (Math.random() - 0.5) * 6;
        this.damageCop(o, (1 - d / 7) * 40, o.v.x, o.v.z);
      }
    }
  }

  /* ── the player ───────────────────────────────────────────────────── */

  private hurt(amount: number, x: number, z: number) {
    if (this.state !== 'play' || amount <= 0) return;
    this.hull -= amount;
    this.fx.sparks(x, 1, z, Math.min(30, 6 + amount), 8 + amount * 0.4);
    if (amount > 12) {
      const [sx, sy] = this.toScreen(this.player.x, this.player.z);
      this.popups.show(amount > 25 ? 'HEAVY HIT' : 'OUCH', null, 'bad', sx, sy - 60);
    }
    if (this.hull <= 0) this.die();
  }

  private die() {
    this.hull = 0;
    this.state = 'dying';
    this.dyingT = 1.6;
    this.slowmo = 0.3;
    this.player.alive = false;
    this.player.throttle = 0;
    this.player.spin += 6;
    this.player.vy = 6;
    this.player.y = 0.1;
    this.fx.explosion(this.player.x, this.player.z, 1.4);
    this.fx.debris.burst(this.player.x, 1.2, this.player.z, 18, 12, ['#ff7a1a', '#ffe14a', '#e8e4dc', '#23201e']);
    this.charred(this.playerRig, true);
    this.audio.explosion(1.4);
    this.audio.busted();
    this.fx.shake(1);
  }

  private addScore(n: number) { this.score += n; }

  /* ── the loop ─────────────────────────────────────────────────────── */

  private loop = (now: number) => {
    this.raf = requestAnimationFrame(this.loop);
    const real = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.tick(real);
    this.renderer.render(this.scene, this.camera);
  };

  /** Run the game forward without drawing — for tests on slow machines. */
  simulate(seconds: number, fps = 60) {
    for (let i = 0; i < seconds * fps; i++) this.tick(1 / fps);
  }

  private tick(real: number) {
    let dt = real;
    if (this.hitStop > 0) { this.hitStop -= real; dt = 0; }
    dt *= this.slowmo;
    if (this.state === 'dying') {
      this.dyingT -= real;
      if (this.dyingT <= 0) this.gameOver();
    }
    if (this.state === 'play' || this.state === 'dying') {
      const n = Math.max(1, Math.ceil(dt / 0.012));
      for (let i = 0; i < n; i++) this.step(dt / n);
      this.gameplay(dt);
    } else if (this.state === 'ready') {
      // on the start screen the car idles and the camera breathes
      this.player.vx *= 0.9;
      this.player.vz *= 0.9;
    }
    this.visuals(real, dt);
  }

  private gameOver() {
    this.state = 'over';
    this.slowmo = 1;
    const newBest = this.score > this.best;
    if (newBest) {
      this.best = Math.floor(this.score);
      try { localStorage.setItem(BEST_KEY, String(this.best)); } catch { /* private mode */ }
    }
    this.onOver({ score: Math.floor(this.score), best: this.best, time: this.time, smashed: this.smashed, newBest });
  }

  /** Where the thumb and keys say to go. */
  private readInput() {
    let x = 0;
    let y = 0;
    if (this.keys.has('arrowleft') || this.keys.has('a')) x -= 1;
    if (this.keys.has('arrowright') || this.keys.has('d')) x += 1;
    if (this.keys.has('arrowup') || this.keys.has('w')) y -= 1;
    if (this.keys.has('arrowdown') || this.keys.has('s')) y += 1;
    if (x || y) return Math.atan2(x, y);
    if (this.stick) return Math.atan2(this.stick.x, this.stick.y);
    return null;
  }

  private step(dt: number) {
    const p = this.player;
    if (this.state === 'play') {
      const g = this.readInput();
      if (g != null) this.goal = g;
      p.aim(this.goal, 2.4);
    }
    const lvl = this.wanted;
    const active = this.cops.filter((c) => c.active);
    for (const c of active) {
      if (!c.dead) drive(c, p, lvl, this.obstacles, dt);
      else { c.v.throttle = 0; c.v.steer = 0; c.v.vx *= Math.exp(-2.5 * dt); c.v.vz *= Math.exp(-2.5 * dt); }
    }
    const all = [p, ...active.map((c) => c.v)];
    for (const v of all) {
      v.step(dt);
      this.ramps(v);
    }
    // against the arena
    for (const v of all) {
      const cop = v === p ? null : active.find((c) => c.v === v)!;
      for (let i = this.arena.shapes.length - 1; i >= 0; i--) {
        const s = this.arena.shapes[i]!;
        const prop = this.propOf.get(s);
        if (v.airborne && v.y > 1 && (prop || (s.kind === 'circle' && s.r < 3))) continue;
        if (prop) {
          const ct = contact(v, s);
          if (!ct) continue;
          const closing = -(v.vx * ct.nx + v.vz * ct.nz);
          if (prop.kind === 'barrel') { this.boom(prop); continue; }
          if (closing > 5 || v.speed > 9) {
            this.smashProp(prop, v);
            continue;
          }
        }
        const hit = resolveStatic(v, s);
        if (hit > DAMAGE.threshold) this.impactStatic(v, cop, hit);
      }
    }
    // cars against cars
    for (let i = 0; i < active.length; i++) {
      const a = active[i]!;
      const hp = resolvePair(p, a.v);
      if (hp > DAMAGE.threshold) {
        a.lastContact = this.time;
        if (!a.dead) this.hurt((hp - DAMAGE.threshold) * DAMAGE.playerFromCop * (hp > DAMAGE.instantKill ? 5 : 1), (p.x + a.v.x) / 2, (p.z + a.v.z) / 2);
        this.damageCop(a, hp * DAMAGE.copFromPlayer, a.v.x, a.v.z);
        this.feel(hp, (p.x + a.v.x) / 2, (p.z + a.v.z) / 2, true);
      }
      for (let j = i + 1; j < active.length; j++) {
        const b = active[j]!;
        const hc = resolvePair(a.v, b.v);
        if (hc > DAMAGE.threshold) {
          const x = (a.v.x + b.v.x) / 2;
          const z = (a.v.z + b.v.z) / 2;
          this.damageCop(a, (hc - DAMAGE.threshold) * DAMAGE.copFromCop, x, z);
          this.damageCop(b, (hc - DAMAGE.threshold) * DAMAGE.copFromCop, x, z);
          this.feel(hc, x, z, false);
        }
      }
    }
  }

  private feel(closing: number, x: number, z: number, mine: boolean) {
    const k = Math.min(1, closing / 30);
    this.fx.sparks(x, 1, z, Math.floor(4 + k * 20), 6 + k * 10);
    const d = Math.hypot(x - this.player.x, z - this.player.z);
    const near = Math.max(0.15, 1 - d / 60);
    this.fx.shake((mine ? 0.12 + k * 0.4 : k * 0.25) * near);
    this.audio.impact(closing * near);
  }

  private impactStatic(v: Vehicle, cop: Cop | null, closing: number) {
    const x = v.x;
    const z = v.z;
    if (!cop) this.hurt((closing - DAMAGE.threshold) * DAMAGE.playerFromWall * (closing > DAMAGE.instantKill ? 5 : 1), x, z);
    else this.damageCop(cop, (closing - DAMAGE.threshold) * DAMAGE.copFromWall, x, z);
    this.feel(closing, x, z, !cop);
  }

  private smashProp(prop: Prop, v: Vehicle) {
    this.arena.breakProp(prop);
    const s = prop.shape;
    const colors = s.kind === 'circle' ? ['#4f9a45', '#3c7a36', '#6ab85a'] : ['#9a6a3e', '#6e4526', '#b08050'];
    this.fx.debris.burst(s.x, 1, s.z, 8, 7, colors, 0.35);
    for (let i = 0; i < 6; i++) this.fx.dust(s.x, s.z, v.vx, v.vz, 1.3);
    v.vx *= 0.88;
    v.vz *= 0.88;
    this.audio.impact(8);
    if (v === this.player) this.fx.shake(0.08);
  }

  /** A red barrel: everything near it gets thrown and burnt. */
  private boom(prop: Prop) {
    this.arena.breakProp(prop);
    const { x, z } = prop.shape;
    this.fx.explosion(x, z, 1.6);
    this.arena.scorch(x, z, 8);
    this.audio.explosion(1.3);
    this.fx.shake(0.7);
    this.hitStop = Math.max(this.hitStop, 0.06);
    const R = DAMAGE.barrelRadius;
    for (const c of this.cops) {
      if (!c.active) continue;
      const dx = c.v.x - x;
      const dz = c.v.z - z;
      const d = Math.hypot(dx, dz) || 0.01;
      if (d > R) continue;
      const k = 1 - d / R;
      c.v.vx += (dx / d) * 22 * k;
      c.v.vz += (dz / d) * 22 * k;
      c.v.vy = 6 * k;
      c.v.y = Math.max(c.v.y, 0.1);
      c.v.spin += (Math.random() - 0.5) * 10 * k;
      this.damageCop(c, DAMAGE.barrelDamage * k, c.v.x, c.v.z);
    }
    const p = this.player;
    const d = Math.hypot(p.x - x, p.z - z);
    if (d < R) {
      const k = 1 - d / R;
      p.vx += ((p.x - x) / (d || 1)) * 16 * k;
      p.vz += ((p.z - z) / (d || 1)) * 16 * k;
      p.spin += 4 * k;
      this.hurt(DAMAGE.barrelDamage * 0.3 * k, p.x, p.z);
    }
  }

  /** Ramps: drive up one fast enough and you fly. */
  private ramps(v: Vehicle) {
    if (v.airborne) return;
    for (const r of this.arena.ramps) {
      const dx = v.x - r.x;
      const dz = v.z - r.z;
      const fx = Math.sin(r.a);
      const fz = Math.cos(r.a);
      const along = dx * fx + dz * fz;
      const across = dx * fz - dz * fx;
      if (Math.abs(across) > r.w / 2 || along < -r.l / 2 || along > r.l / 2) continue;
      const fwd = v.vx * fx + v.vz * fz;
      if (fwd < 9) continue;
      if (along > r.l / 2 - 1) {
        v.y = 1.6;
        v.vy = fwd * 0.34;
        if (v === this.player) { this.popups.show('AIR!', null, 'drift', ...this.toScreen(v.x, v.z)); this.addScore(150); }
      }
    }
  }

  /* ── the rules ────────────────────────────────────────────────────── */

  private gameplay(dt: number) {
    const p = this.player;
    if (this.state === 'play') {
      this.time += dt;
      this.scoreFrac += SCORE.perSecond * dt;
      if (this.scoreFrac >= 1) { this.score += Math.floor(this.scoreFrac); this.scoreFrac -= Math.floor(this.scoreFrac); }
      // the heat
      const heat = this.time * 40 + this.score;
      let lvl = 1;
      WANTED.heat.forEach((h, i) => { if (heat >= h) lvl = i + 1; });
      if (lvl > this.wanted) {
        this.wanted = lvl;
        this.popups.show('WANTED ' + '★'.repeat(lvl), null, 'wanted', this.width / 2, this.height * 0.3);
        this.audio.wanted();
        for (const c of this.cops) if (c.active && !c.dead) c.v.speedMul = WANTED.speed[lvl - 1]!;
      }
      // more cops, up to the level's number
      this.spawnT -= dt;
      const alive = this.cops.filter((c) => c.active && !c.dead).length;
      if (this.spawnT <= 0 && alive < WANTED.police[this.wanted - 1]!) {
        this.spawn();
        this.spawnT = 0.9;
      }
      // drift: long slides are worth something when they end
      const sliding = Math.abs(p.lateral) > 5 && p.speed > 13 && !p.airborne;
      if (sliding) this.driftT += dt;
      else if (this.driftT > 0) {
        if (this.driftT > 0.8) {
          const pts = Math.round(this.driftT * SCORE.driftPerSecond / 10) * 10;
          this.addScore(pts);
          this.popups.show(this.driftT > 2.2 ? 'LONG DRIFT' : 'DRIFT', pts, 'drift', ...this.toScreen(p.x, p.z));
        }
        this.driftT = 0;
      }
      // close calls: a cop through the space right next to you, fast, without touching
      for (const c of this.cops) {
        if (!c.active || c.dead) continue;
        c.nearCool -= dt;
        const d = Math.hypot(c.v.x - p.x, c.v.z - p.z);
        const rel = Math.hypot(c.v.vx - p.vx, c.v.vz - p.vz);
        if (d < 4.4 && rel > 12 && this.time - c.lastContact > 0.6) c.near = true;
        if (c.near && d > 8) {
          c.near = false;
          if (c.nearCool <= 0 && this.time - c.lastContact > 0.6) {
            c.nearCool = 2.5;
            this.addScore(SCORE.nearMiss);
            this.popups.show('CLOSE CALL!', SCORE.nearMiss, 'near', ...this.toScreen(p.x, p.z));
            this.audio.whoosh();
          }
        }
      }
    }
    this.chainT = Math.max(0, this.chainT - dt);
    // wrecks burn out and are cleared away
    for (const c of this.cops) {
      if (!c.active || !c.dead) continue;
      c.deadT -= dt;
      if (c.deadT <= 0) this.retire(c);
    }
    this.arena.respawn(dt, (x, z) => Math.hypot(x - p.x, z - p.z) > 20 && this.cops.every((c) => !c.active || Math.hypot(c.v.x - x, c.v.z - z) > 6));
  }

  /* ── what it looks and sounds like ────────────────────────────────── */

  private toScreen(x: number, z: number, y = 1): [number, number] {
    const v = new THREE.Vector3(x, y, z).project(this.camera);
    return [(v.x * 0.5 + 0.5) * this.width, (-v.y * 0.5 + 0.5) * this.height];
  }

  private placeRig(r: CarRig, v: Vehicle, dt: number, t: number) {
    r.root.position.set(v.x, v.y, v.z);
    r.root.rotation.y = v.h;
    // lean out of the corners, nose up in the air
    r.body.rotation.z = Math.max(-0.2, Math.min(0.2, v.lateral * 0.018));
    r.body.rotation.x = v.airborne ? -Math.min(0.35, v.vy * 0.04) : 0;
    const spinRate = (v.vx * v.fx + v.vz * v.fz) * dt / 0.5;
    r.wheels.forEach((w, i) => {
      w.rotation.x += spinRate;
      if (i < 2) w.rotation.y = v.steer * 0.4;
    });
    r.shadow.position.y = 0.04 - v.y;
    (r.shadow.material as THREE.MeshBasicMaterial).opacity = 0.4 / (1 + v.y * 0.4);
    void t;
  }

  /** Tyre marks and smoke where a car is sliding, dust where it is fast. */
  private trails(v: Vehicle, isPlayer: boolean) {
    const f = [v.fx, v.fz];
    const r = [f[1]!, -f[0]!];
    const back = 1.4;
    const wl = [v.x - f[0]! * back + r[0]! * 1.0, v.z - f[1]! * back + r[1]! * 1.0];
    const wr = [v.x - f[0]! * back - r[0]! * 1.0, v.z - f[1]! * back - r[1]! * 1.0];
    const prev = this.prevWheels.get(v);
    const slide = Math.abs(v.lateral);
    if (prev && !v.airborne && slide > 3.5 && v.speed > 8) {
      const a = Math.min(0.5, (slide - 3) * 0.06);
      const col = `rgba(40,26,18,${a.toFixed(3)})`;
      this.arena.mark(prev[0], prev[1], wl[0]!, wl[1]!, 0.45, col);
      this.arena.mark(prev[2], prev[3], wr[0]!, wr[1]!, 0.45, col);
      if (Math.random() < (isPlayer ? 0.7 : 0.35)) this.fx.drift(Math.random() < 0.5 ? wl[0]! : wr[0]!, Math.random() < 0.5 ? wl[1]! : wr[1]!);
    }
    if (!v.airborne && v.speed > 9 && Math.random() < v.speed / (isPlayer ? 45 : 90)) this.fx.dust(wl[0]!, wl[1]!, v.vx, v.vz, isPlayer ? 1 : 0.7);
    this.prevWheels.set(v, [wl[0]!, wl[1]!, wr[0]!, wr[1]!]);
    // landing
    if (v.airborne) this.wasAir.add(v);
    else if (this.wasAir.has(v)) {
      this.wasAir.delete(v);
      for (let i = 0; i < 10; i++) this.fx.dust(v.x, v.z, v.vx * 0.2, v.vz * 0.2, 1.4);
      if (isPlayer) { this.audio.thump(); this.fx.shake(0.2); }
    }
  }

  private visuals(real: number, dt: number) {
    const t = performance.now() / 1000;
    const p = this.player;
    this.placeRig(this.playerRig, p, dt, t);
    if (this.state !== 'ready') this.trails(p, true);
    if (this.state === 'dying' || this.hull < 35) {
      if (Math.random() < (this.state === 'dying' ? 0.8 : 0.3)) this.fx.damageSmoke(p.x, 1.4 + p.y, p.z, true);
    }
    const copsSound: { pan: number; near: number; d: number }[] = [];
    for (const c of this.cops) {
      if (!c.active) continue;
      this.placeRig(c.rig, c.v, dt, t);
      flashSirens(c.rig, t, c.phase, !c.dead);
      this.trails(c.v, false);
      c.smokeT -= dt;
      if ((c.dead || c.hull < c.maxHull * 0.5) && c.smokeT <= 0) {
        c.smokeT = c.dead ? 0.05 : 0.15;
        this.fx.damageSmoke(c.v.x, 1.6 + c.v.y, c.v.z, c.dead);
      }
      if (!c.dead) {
        const dx = c.v.x - p.x;
        const dz = c.v.z - p.z;
        const d = Math.hypot(dx, dz);
        copsSound.push({ pan: dx / 30, near: Math.max(0, 1 - d / 90), d });
      }
    }
    copsSound.sort((a, b) => a.d - b.d);
    this.fx.update(dt);
    this.arena.tick(dt);
    this.audio.update(this.state === 'play' ? p.speed : 0, this.state === 'play' ? Math.abs(p.lateral) : 0, copsSound.slice(0, 5), (this.wanted - 1) / 4, this.state === 'play');

    // the camera: behind and above, leading the car, pulling back with speed
    const k = Math.min(1, p.speed / PLAYER.maxSpeed);
    const lead = new THREE.Vector3(p.x + p.vx * 0.38, 0, p.z + p.vz * 0.38);
    this.camLook.lerp(lead, 1 - Math.exp(-real * 4));
    // in portrait, back off until the road is wide enough to read
    const aspect = this.width / Math.max(1, this.height);
    const base = Math.max(30, Math.min(64, 12.5 / (Math.tan((this.camera.fov * Math.PI) / 360) * aspect)));
    const dist = base * (1 + k * 0.33 - this.fx.zoomKick * 0.23);
    const tilt = (62 * Math.PI) / 180;
    const want = new THREE.Vector3(this.camLook.x, Math.sin(tilt) * dist, this.camLook.z + Math.cos(tilt) * dist);
    this.camPos.lerp(want, 1 - Math.exp(-real * 5));
    const tr = this.fx.trauma * this.fx.trauma;
    const sh = new THREE.Vector3(Math.sin(t * 61) * tr * 1.3, Math.sin(t * 47 + 1) * tr * 0.8, Math.sin(t * 53 + 2) * tr * 1.3);
    this.camera.position.copy(this.camPos).add(sh);
    this.camera.lookAt(this.camLook.x + sh.x * 0.5, 0, this.camLook.z + sh.z * 0.5);

    // off-screen cops: an arrow at the edge pointing at each one
    let ai = 0;
    for (const c of this.cops) {
      if (!c.active || c.dead) continue;
      const [sx, sy] = this.toScreen(c.v.x, c.v.z);
      const m = 26;
      const off = sx < 0 || sy < 0 || sx > this.width || sy > this.height;
      const a = this.arrows[ai++]!;
      if (!off || this.state !== 'play') { a.style.display = 'none'; continue; }
      const cx = this.width / 2;
      const cy = this.height / 2;
      const ang = Math.atan2(sy - cy, sx - cx);
      const ex = Math.max(m, Math.min(this.width - m, sx));
      const ey = Math.max(m + 60, Math.min(this.height - m - 40, sy));
      a.style.display = 'block';
      a.style.transform = `translate(${ex}px, ${ey}px) rotate(${ang}rad)`;
      a.className = c.kind === 'interceptor' ? 'hw-arrow hw-arrow--elite' : 'hw-arrow';
      const d = Math.hypot(c.v.x - p.x, c.v.z - p.z);
      a.style.opacity = String(Math.max(0.35, 1 - d / 120));
    }
    for (; ai < this.arrows.length; ai++) this.arrows[ai]!.style.display = 'none';

    // the HUD, ten times a second
    if (t - this.lastHud > 0.1) {
      this.lastHud = t;
      this.onHud({ score: Math.floor(this.score), wanted: this.wanted, hull: Math.max(0, this.hull), best: this.best, time: this.time, chain: this.chainT > 0 ? this.chain : 0 });
    }
  }
}
