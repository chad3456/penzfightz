import * as THREE from 'three';
import { build, R, type World } from './world';
import { drive, makeCar, spec, taxiModel, WHEELBASE, type Car, type Controls, type Hit, type Upgrades } from './taxi';
import { Debris } from './debris';
import { firstNode, nextFare, payout, spend, stars, type Fare } from './fares';
import type { Place } from './places';

/**
 * The shift.
 *
 * Everything that happens between getting in and the clock running out: the
 * scene, the car, the fare in progress, the wreckage, and the numbers the HUD
 * reads off. React owns none of it — it is handed a callback and told what
 * changed, once a frame, which is the only way a driving game and a component
 * tree can live in the same file tree without one of them ruining the other.
 */

export interface Readout {
  speed: number;
  money: number;
  clock: number;
  fareClock: number;
  comfort: number;
  stars: number;
  streak: number;
  fares: number;
  carrying: boolean;
  who: string;
  want: string;
  /** Metres to whatever the arrow is pointing at. */
  to: number;
  /** Screen-space bearing to the target, radians, 0 straight ahead. */
  bearing: number;
  slip: number;
  damage: number;
  smashed: number;
  flash: string | null;
  over: boolean;
}

export interface Result {
  money: number;
  fares: number;
  stars: number;
  smashed: number;
}

const SHIFT = 240;

export class Shift {
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private world: World;
  private car: Car;
  private debris = new Debris();
  private taxi = new THREE.Group();
  private wheels: THREE.Mesh[] = [];
  private marker: THREE.Mesh;
  private beam: THREE.Mesh;
  private fare: Fare;
  private carrying = false;
  private rand: () => number;
  private clock = SHIFT;
  private fareLeft = 0;
  private money = 0;
  private fares = 0;
  private starTotal = 0;
  private streak = 0;
  private smashed = 0;
  private flash: { text: string; until: number } | null = null;
  private hits = { wall: 0, prop: 0 };
  private camPos = new THREE.Vector3();
  private camAim = new THREE.Vector3();
  private disposed = false;
  private raf = 0;
  private last = 0;
  private upgrades: Upgrades;
  private place: Place;
  private onFrame: (r: Readout) => void;
  private onEnd: (r: Result) => void;
  private tone = new THREE.Color();

  constructor(opts: {
    canvas: HTMLCanvasElement;
    place: Place;
    upgrades: Upgrades;
    seed: number;
    onFrame: (r: Readout) => void;
    onEnd: (r: Result) => void;
  }) {
    this.place = opts.place;
    this.upgrades = opts.upgrades;
    this.onFrame = opts.onFrame;
    this.onEnd = opts.onEnd;
    let a = (opts.seed ^ 0x9e3779b9) >>> 0;
    this.rand = () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };

    this.renderer = new THREE.WebGLRenderer({ canvas: opts.canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = opts.place.night ? 1.25 : 1.05;

    this.camera = new THREE.PerspectiveCamera(62, 1, 0.4, 1400);
    this.world = build(opts.place, opts.seed);
    this.sky();
    for (const m of this.world.meshes) this.scene.add(m);
    this.scene.add(this.debris.mesh);

    const start = firstNode(this.world, this.rand);
    // Facing down a street, not at a wall. A random heading puts the player
    // nose-first into a building about half the time, and the first thing they
    // do is hold the throttle, so the first thing the game does is nothing.
    const facing = Math.round(this.rand() * 4) * (Math.PI / 2);
    this.car = makeCar(start, facing, this.world.ground(start.x, start.y));
    // Clear the junction you are standing in. Starting boxed in by three
    // crates is not a challenge, it is a bug with a story attached.
    for (const p of this.world.props) {
      if (Math.abs(p.x - start.x) < 7 && Math.abs(p.z - start.y) < 7) p.dead = true;
    }
    this.buildTaxi();
    this.fare = nextFare(this.world, start, 0.5, this.rand);
    this.fareLeft = this.fare.clock;

    const ring = new THREE.CylinderGeometry(2.6, 2.6, 0.1, 28, 1, true);
    this.marker = new THREE.Mesh(
      ring,
      new THREE.MeshBasicMaterial({ color: 0xffc247, transparent: true, opacity: 0.9, side: THREE.DoubleSide }),
    );
    this.scene.add(this.marker);
    // A column of light over the target, because at street level in a city of
    // six-storey blocks a ring on the ground is invisible until you are in it.
    this.beam = new THREE.Mesh(
      new THREE.CylinderGeometry(2.1, 2.6, 40, 18, 1, true),
      new THREE.MeshBasicMaterial({
        color: 0xffc247,
        transparent: true,
        opacity: 0.13,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    this.scene.add(this.beam);

    this.camPos.copy(this.car.pos);
    this.last = performance.now();
    this.loop();
  }

  private sky() {
    const p = this.place;
    const top = new THREE.Color(p.sky[0]);
    const bot = new THREE.Color(p.sky[1]);
    this.scene.background = bot.clone().lerp(top, 0.4);
    this.scene.fog = new THREE.Fog(bot.getHex(), this.world.half * 0.8, this.world.half * 3.1);
    // A night city in a game is never as dark as a night city. Enough sky to
    // read a kerb by, and the warmth comes from the lamps.
    //
    // The bounce colour is the *ground's*, not a guessed brown: the whole
    // reason a wall facing away from the sun is not black in life is that the
    // road in front of it is throwing light back up at it, and using anything
    // else here left every backlit facade in Goa and Shimla as a silhouette.
    const hemi = new THREE.HemisphereLight(top.getHex(), new THREE.Color(p.ground).getHex(), p.night ? 1.2 : 1.55);
    this.scene.add(hemi);
    this.scene.add(new THREE.AmbientLight(bot.getHex(), p.night ? 0.28 : 0.34));
    const sun = new THREE.DirectionalLight(p.night ? 0xa8bce4 : 0xfff0d8, p.night ? 0.9 : 1.5);
    sun.position.set(
      Math.cos(p.sun[1]) * Math.cos(p.sun[0]),
      Math.max(0.12, Math.sin(p.sun[0])),
      Math.sin(p.sun[1]) * Math.cos(p.sun[0]),
    ).multiplyScalar(200);
    this.scene.add(sun);
    if (p.night) {
      // A second light from the other side, low and warm, standing in for the
      // whole street's worth of sodium without paying for a light per lamp.
      const fill = new THREE.DirectionalLight(0xffbe6a, 0.55);
      fill.position.set(-120, 40, -90);
      this.scene.add(fill);
    }
    if (p.sea) {
      const sea = new THREE.Mesh(
        new THREE.PlaneGeometry(this.world.half * 8, this.world.half * 8),
        new THREE.MeshStandardMaterial({ color: p.night ? 0x101822 : 0x2f5b70, roughness: 0.25, metalness: 0.4 }),
      );
      sea.rotation.x = -Math.PI / 2;
      sea.position.set(0, -0.6, this.world.half + this.world.half * 3.6);
      this.scene.add(sea);
    }
  }

  private buildTaxi() {
    const { geometry, wheels } = taxiModel();
    // The livery. Black over yellow is the whole reason anybody recognises
    // this car, and the roles are resolved here rather than in the geometry so
    // a damaged panel can be dulled later without rebuilding it.
    const colour = new Float32Array(geometry.getAttribute('position').count * 3);
    const role = geometry.getAttribute('aRole');
    const pos = geometry.getAttribute('position');
    const c = new THREE.Color();
    for (let i = 0; i < role.count; i++) {
      const k = role.getX(i);
      // Yellow below the waist, black above it, which is the actual livery and
      // not a stripe painted on afterwards.
      if (k === R.paint) c.set(pos.getY(i) > 0.88 ? '#171410' : '#f0b419');
      else if (k === R.glass) c.set('#9fb6bd');
      else if (k === R.metal) c.set('#c9cbcc');
      else if (k === R.glow) c.set('#fff3cf');
      else if (k === R.cone) c.set('#b2311f');
      else if (k === R.sign) c.set('#e8e2d0');
      else if (k === R.tyre) c.set('#1b1a18');
      else c.set('#8a8a8a');
      colour[i * 3] = c.r;
      colour[i * 3 + 1] = c.g;
      colour[i * 3 + 2] = c.b;
    }
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colour, 3));
    geometry.deleteAttribute('aRole');
    const body = new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.42, metalness: 0.22 }),
    );
    // The model is built with its origin at the rear axle; the car's origin is
    // its middle, so it is shifted once here instead of everywhere else.
    // The model's origin is the rear axle; the car's is between the axles.
    body.position.set(0, 0, -WHEELBASE / 2);
    this.taxi.add(body);
    const tyreMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1c, roughness: 0.94 });
    for (const [x, z] of [
      [-0.78, 1.21],
      [0.78, 1.21],
      [-0.78, -1.21],
      [0.78, -1.21],
    ]) {
      const w = new THREE.Mesh(wheels, tyreMat);
      w.position.set(x, 0.34, z);
      w.rotation.z = Math.PI / 2;
      this.taxi.add(w);
      this.wheels.push(w);
    }
    this.scene.add(this.taxi);
  }

  resize(w: number, h: number) {
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / Math.max(1, h);
    this.camera.updateProjectionMatrix();
  }

  controls: Controls = { throttle: 0, brake: 0, steer: 0, hand: false, horn: false };

  private loop = () => {
    if (this.disposed) return;
    this.raf = requestAnimationFrame(this.loop);
    const now = performance.now();
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.step(dt);
    this.renderer.render(this.scene, this.camera);
  };

  private step(dt: number) {
    if (this.clock <= 0) return;
    this.clock -= dt;
    this.fareLeft -= dt;

    const hits = drive(this.car, this.controls, this.upgrades, this.world, dt);
    this.hits.wall = 0;
    this.hits.prop = 0;
    for (const h of hits) this.take(h);

    // The horn, which in this city is a tool. Anything ahead and close enough
    // gets out of the way, which means it is removed without anybody's comfort
    // being spent on it.
    if (this.controls.horn) this.honk();

    const s = spec(this.upgrades);
    const lateral = Math.abs(this.car.slip) * 4;
    if (this.carrying) {
      spend(this.fare, this.fare.who, { springs: s.comfort, armour: s.armour }, {
        wall: this.hits.wall,
        prop: this.hits.prop,
        lateral,
        air: this.car.air ? 1 : 0,
        dt,
      });
    }

    const target = this.carrying ? this.fare.to : this.fare.from;
    const dx = target.x - this.car.pos.x;
    const dz = target.y - this.car.pos.z;
    const dist = Math.hypot(dx, dz);
    if (dist < 5.2 && this.car.vel.length() < 9) this.arrive();

    this.paintMarker(target, dist);
    this.follow(dt);
    this.debris.update(dt);
    this.taxi.position.copy(this.car.pos);
    this.taxi.rotation.set(this.car.dive, this.car.heading, this.car.lean, 'YZX');
    const spin = this.car.vel.length() * dt * 2.9;
    for (const w of this.wheels) w.rotation.x += spin;

    if (this.fareLeft <= 0 && this.carrying) this.giveUp();
    if (this.clock <= 0) this.finish();
    this.report(dist, Math.atan2(dx, dz) - this.car.heading);
  }

  private take(h: Hit) {
    if (h.kind === 'prop' && h.prop !== undefined) {
      const p = this.world.props[h.prop];
      const pool = this.world.pools.get(p.kind);
      if (pool && p.slot >= 0) {
        // Pull it out of the instanced pool by scaling it to nothing, which is
        // one matrix write against rebuilding the buffer.
        pool.setMatrixAt(p.slot, new THREE.Matrix4().makeScale(0, 0, 0));
        pool.instanceMatrix.needsUpdate = true;
      }
      this.tone.set(p.kind === 'melon' ? '#4e7a3c' : p.kind === 'pot' ? '#a45c3a' : '#9a7444');
      this.debris.burst(p.kind, h.at, this.car.vel.clone().normalize(), h.force, this.tone);
      this.smashed++;
      this.hits.prop += h.force;
    } else {
      this.hits.wall += h.force;
    }
  }

  private honk() {
    const s = spec(this.upgrades);
    const fx = Math.sin(this.car.heading);
    const fz = Math.cos(this.car.heading);
    for (let i = 0; i < this.world.props.length; i++) {
      const p = this.world.props[i];
      if (p.dead || p.fixed) continue;
      const dx = p.x - this.car.pos.x;
      const dz = p.z - this.car.pos.z;
      const ahead = dx * fx + dz * fz;
      if (ahead < 0 || ahead > s.hornRange) continue;
      if (Math.abs(dx * fz - dz * fx) > 3.4) continue;
      p.dead = true;
      const pool = this.world.pools.get(p.kind);
      if (pool && p.slot >= 0) {
        pool.setMatrixAt(p.slot, new THREE.Matrix4().makeScale(0, 0, 0));
        pool.instanceMatrix.needsUpdate = true;
      }
      this.tone.set('#8f8f8f');
      this.debris.burst(p.kind, new THREE.Vector3(p.x, p.y, p.z), new THREE.Vector2(fx, fz), 0.3, this.tone);
    }
  }

  private paintMarker(at: THREE.Vector2, dist: number) {
    const y = this.world.ground(at.x, at.y);
    this.marker.position.set(at.x, y + 0.12, at.y);
    this.marker.rotation.y += 0.02;
    const pulse = 1 + Math.sin(performance.now() * 0.004) * 0.09;
    this.marker.scale.setScalar(pulse);
    this.beam.position.set(at.x, y + 20, at.y);
    const near = Math.min(1, dist / 60);
    (this.beam.material as THREE.MeshBasicMaterial).opacity = 0.05 + near * 0.12;
  }

  /**
   * The camera.
   *
   * Behind and above, but aimed at where the car is *going* rather than where
   * it is — the aim point leads by the velocity, so in a slide the camera looks
   * down the road instead of down the bonnet, which is the only reason a drift
   * is readable from behind. It also lifts and pulls back with speed.
   */
  private follow(dt: number) {
    const v = this.car.vel.length();
    // Behind and *above*. The first version sat at three metres and the road
    // filled the bottom half of the screen with nothing visible beyond the
    // bonnet, which is exactly the view you do not want in a game about
    // choosing a line through a junction.
    const back = 9.2 + v * 0.2;
    const high = 5.2 + v * 0.07;
    const sin = Math.sin(this.car.heading);
    const cos = Math.cos(this.car.heading);
    const want = new THREE.Vector3(
      this.car.pos.x - sin * back,
      this.car.pos.y + high,
      this.car.pos.z - cos * back,
    );
    // Never let the camera end up inside a building. Reversing into a wall or
    // stopping nose-first in an alley otherwise puts the viewer inside masonry,
    // and the fix is the one every chase camera uses: go over the top of it.
    want.y = Math.max(want.y, this.world.ground(want.x, want.z) + 2.6);
    for (const b of this.world.solids) {
      if (Math.abs(want.x - b.x) > b.hx + 1 || Math.abs(want.z - b.z) > b.hz + 1) continue;
      // Over the top, but never so far over that the car becomes a dot: a
      // twelve-storey block behind you would otherwise put the camera in orbit.
      want.y = Math.max(want.y, Math.min(b.y + b.h + 2.2, this.car.pos.y + 16));
    }
    this.camPos.lerp(want, Math.min(1, dt * 4.4));
    const lead = 7 + v * 0.34;
    this.camAim.lerp(
      new THREE.Vector3(
        this.car.pos.x + sin * lead + this.car.vel.x * 0.16,
        this.car.pos.y + 0.9,
        this.car.pos.z + cos * lead + this.car.vel.y * 0.16,
      ),
      Math.min(1, dt * 6),
    );
    this.camera.position.copy(this.camPos);
    this.camera.lookAt(this.camAim);
  }

  private arrive() {
    if (!this.carrying) {
      this.carrying = true;
      this.fare.comfort = 1;
      this.fareLeft = this.fare.clock;
      this.say(this.fare.who.want);
      return;
    }
    const late = Math.max(0, -this.fareLeft);
    const star = stars(this.fare.comfort, late, this.fare.who);
    const pay = payout(this.fare, Math.max(0, this.fareLeft), star, this.streak);
    this.money += pay.total;
    this.fares++;
    this.starTotal += star;
    this.streak = star >= 4 ? this.streak + 1 : 0;
    // Time is the reward. A clean fare buys back most of what it cost, so a
    // good driver stays out; a bad one goes home early.
    this.clock += 18 + star * 5;
    this.say(`${star >= 4 ? this.fare.who.glad : this.fare.who.cross}   ₹${pay.total}`);
    this.carrying = false;
    const reach = Math.min(1.1, 0.42 + this.fares * 0.07);
    this.fare = nextFare(this.world, this.fare.to, reach, this.rand);
    this.fareLeft = this.fare.clock + 24;
  }

  private giveUp() {
    this.say(`${this.fare.who.cross}   no fare`);
    this.streak = 0;
    this.fares++;
    this.carrying = false;
    this.fare = nextFare(this.world, new THREE.Vector2(this.car.pos.x, this.car.pos.z), 0.5, this.rand);
    this.fareLeft = this.fare.clock + 24;
  }

  private say(text: string) {
    this.flash = { text, until: performance.now() + 4200 };
  }

  private finish() {
    this.onEnd({
      money: this.money,
      fares: this.fares,
      stars: this.fares ? this.starTotal / this.fares : 0,
      smashed: this.smashed,
    });
  }

  private report(dist: number, bearing: number) {
    const f = this.flash && performance.now() < this.flash.until ? this.flash.text : null;
    this.onFrame({
      speed: this.car.vel.length() * 3.6,
      money: this.money,
      clock: Math.max(0, this.clock),
      fareClock: this.fareLeft,
      comfort: this.carrying ? this.fare.comfort : 1,
      stars: this.fares ? this.starTotal / this.fares : 0,
      streak: this.streak,
      fares: this.fares,
      carrying: this.carrying,
      who: this.fare.who.name,
      want: this.carrying ? this.fare.who.want : 'waiting for a cab',
      to: dist,
      bearing: Math.atan2(Math.sin(bearing), Math.cos(bearing)),
      slip: Math.abs(this.car.slip),
      damage: this.car.damage,
      smashed: this.smashed,
      flash: f,
      over: this.clock <= 0,
    });
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.world.dispose();
    this.debris.dispose();
    this.taxi.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
    });
    this.marker.geometry.dispose();
    this.beam.geometry.dispose();
    this.renderer.dispose();
  }
}

export { SHIFT };
