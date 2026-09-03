import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
import { Sky } from './sky';
import { Terrain, WORLD } from './terrain';
import { Water } from './water';
import { Grade, TiltShift } from './post';
import { City } from './city';
import { Sim } from './sim';
import { Cursor } from './cursor';
import type { Zone } from './buildings';

/**
 * The world, and the camera you look at it with.
 *
 * Written against three directly rather than through the React renderer,
 * because everything expensive here — a hundred thousand terrain vertices,
 * several thousand instanced buildings, a few hundred cars on a graph — wants a
 * hand-written update order and a composer it owns. React's job is the panel of
 * buttons and nothing else.
 *
 * ### The camera
 *
 * Not an orbit control. A city builder's camera is a *point on the ground* with
 * a distance and two angles, and the difference matters: dragging must move the
 * ground under the cursor by exactly the amount the cursor moved, or the whole
 * thing feels like a diorama on a lazy Susan. So panning is done by
 * intersecting the ray with the ground plane at the target's height and
 * translating by the difference, which is the only way it stays glued.
 */

export interface Quality {
  /** Device pixel ratio cap. */
  dpr: number;
  bloom: boolean;
  tiltShift: boolean;
  shadows: boolean;
}

/** What the left mouse button does. */
export type Tool = 'none' | 'street' | 'avenue' | 'bulldoze' | Zone;

export interface Label {
  id: string;
  x: number;
  y: number;
  depth: number;
  title: string;
  note: string;
  kind: 'city' | 'tower';
}

export const QUALITY: Record<'low' | 'high', Quality> = {
  high: { dpr: 1.6, bloom: true, tiltShift: true, shadows: true },
  low: { dpr: 1, bloom: false, tiltShift: false, shadows: false },
};

const GROUND = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

export class World {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  readonly terrain: Terrain;
  readonly sky = new Sky();
  readonly water: Water;
  readonly composer: EffectComposer;
  readonly city: City;
  readonly sim: Sim;
  readonly cursor: Cursor;

  tool: Tool = 'none';
  brush = 46;
  /** Set when a road drag is refused, for the panel to show and clear. */
  notice = '';

  /** Where the camera is looking, on the ground. */
  target = new THREE.Vector3(60, 15, -20);
  distance = 1180;
  azimuth = -0.62;
  polar = 0.9;
  hour = 9.5;

  private blurH: ShaderPass;
  private blurV: ShaderPass;
  private grade: ShaderPass;
  private bloom: UnrealBloomPass;
  private fxaa: ShaderPass;
  private clock = new THREE.Clock();
  private size = new THREE.Vector2(1, 1);
  private quality: Quality;
  private raycaster = new THREE.Raycaster();

  constructor(canvas: HTMLCanvasElement, seed: number, quality: Quality) {
    this.quality = quality;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      powerPreference: 'high-performance',
      stencil: false,
    });
    this.renderer.setPixelRatio(Math.min(quality.dpr, window.devicePixelRatio || 1));
    this.renderer.shadowMap.enabled = quality.shadows;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.NoToneMapping; // the grade pass does it
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.camera = new THREE.PerspectiveCamera(42, 1, 4, 9000);

    this.scene.fog = new THREE.FogExp2(0x9fb6cf, 0.0002);
    this.scene.add(this.sky.mesh, this.sky.sun, this.sky.sun.target, this.sky.ambient);

    this.terrain = new Terrain(seed);
    this.scene.add(this.terrain.mesh);
    this.water = new Water(this.terrain.texture);
    this.scene.add(this.water.mesh);

    this.city = new City(this.terrain, seed);
    this.city.seed(60, -20);
    this.city.flush();
    this.scene.add(this.city.group);
    this.sim = new Sim(this.city);
    this.cursor = new Cursor(this.terrain);
    this.scene.add(this.cursor.group);

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));

    this.bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.34, 0.7, 1.05);
    this.bloom.enabled = quality.bloom;
    this.composer.addPass(this.bloom);

    this.blurH = new ShaderPass(TiltShift);
    this.blurV = new ShaderPass(TiltShift);
    this.blurV.uniforms.uDirection.value = new THREE.Vector2(0, 1);
    this.blurH.enabled = quality.tiltShift;
    this.blurV.enabled = quality.tiltShift;
    this.composer.addPass(this.blurH);
    this.composer.addPass(this.blurV);

    this.grade = new ShaderPass(Grade);
    this.composer.addPass(this.grade);

    this.fxaa = new ShaderPass(FXAAShader);
    this.composer.addPass(this.fxaa);

    this.sky.setHour(this.hour, this.scene);
    this.applySun();
  }

  // ------------------------------------------------------------------ frame

  resize(w: number, h: number) {
    this.size.set(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
    this.composer.setSize(w, h);
    const px = this.renderer.getPixelRatio();
    this.bloom.setSize(w, h);
    for (const p of [this.blurH, this.blurV]) p.uniforms.uResolution.value.set(w * px, h * px);
    this.fxaa.material.uniforms.resolution.value.set(1 / (w * px), 1 / (h * px));
  }

  private applySun() {
    const u = this.water.material.uniforms;
    u.uSun.value.copy(this.sky.dir);
    u.uSunColour.value.copy(this.sky.sun.color).multiplyScalar(Math.max(0.15, this.sky.sun.intensity / 2.5));
    const f = this.scene.fog as THREE.FogExp2;
    u.uFog.value.copy(f.color);
    u.uFogDensity.value = f.density;
    u.uDay.value = Math.max(0, this.sky.dir.y);
    u.uSky.value.copy(f.color).lerp(new THREE.Color(0.32, 0.5, 0.8), 0.55);
  }

  setHour(h: number) {
    this.hour = h;
    this.sky.setHour(h, this.scene);
    this.applySun();
  }

  private place() {
    const p = this.polar;
    const d = this.distance;
    const x = this.target.x + Math.sin(this.azimuth) * Math.sin(p) * d;
    const z = this.target.z + Math.cos(this.azimuth) * Math.sin(p) * d;
    const y = this.target.y + Math.cos(p) * d;
    this.camera.position.set(x, y, z);
    this.camera.lookAt(this.target);
    this.sky.mesh.position.copy(this.camera.position);
    // Keep the one shadow cascade centred on what is being looked at, and
    // shrink it as you zoom in. A fixed 1,800 m map is 0.9 m per texel, which
    // is fine from the air and unusable at street level; sized to the view it
    // is a tenth of that when you are close and identical when you are not.
    this.sky.sun.position.copy(this.sky.dir).multiplyScalar(1800).add(this.target);
    this.sky.sun.target.position.copy(this.target);
    this.sky.sun.target.updateMatrixWorld();
    const extent = THREE.MathUtils.clamp(this.distance * 0.8, 150, 900);
    const cam = this.sky.sun.shadow.camera;
    if (Math.abs(cam.right - extent) > 1) {
      cam.left = -extent;
      cam.right = extent;
      cam.top = extent;
      cam.bottom = -extent;
      cam.updateProjectionMatrix();
    }
  }

  render() {
    const dt = Math.min(0.05, this.clock.getDelta());
    const t = this.clock.elapsedTime;
    this.water.update(t);
    this.grade.uniforms.uTime.value = t;

    // Night is not a clock reading, it is where the sun is. Lamps come on as
    // it goes below the horizon and the city keeps its own light after that.
    const night = THREE.MathUtils.clamp((0.10 - this.sky.dir.y) / 0.22, 0, 1);
    // Tilt-shift belongs at the zoom where a city looks like a model of one.
    // Pulled all the way out it is an aerial photograph and wants to be sharp;
    // down among the streets there is no miniature to suggest.
    const tilt = smoothstep(1500, 700, this.distance) * smoothstep(120, 300, this.distance);
    this.blurH.uniforms.uAmount.value = tilt;
    this.blurV.uniforms.uAmount.value = tilt;
    this.city.setNight(night, t);
    this.city.syncGraph();
    this.sim.update(dt);
    this.city.flush();
    this.city.traffic.update(dt);
    this.cursor.update(t);

    this.place();
    this.composer.render();
    return dt;
  }

  // ------------------------------------------------------------------ tools

  setTool(t: Tool) {
    this.tool = t;
    this.city.showZones(t !== 'none' && t !== 'street' && t !== 'avenue');
    this.cursor.setColour(TOOL_COLOUR[t] ?? 0xffc247);
    if (t === 'none') this.cursor.hide();
  }

  /** Move the pointer without pressing. */
  hover(nx: number, ny: number) {
    if (this.tool === 'none') {
      this.cursor.hide();
      return;
    }
    const p = this.pick(nx, ny);
    if (!p) {
      this.cursor.hide();
      return;
    }
    this.cursor.show(p, this.radius(), this.distance);
  }

  private radius() {
    if (this.tool === 'street') return 9;
    if (this.tool === 'avenue') return 13;
    if (this.tool === 'bulldoze') return 22;
    return this.brush;
  }

  private from: THREE.Vector3 | null = null;

  /** Left button down. Returns true when the tool took the drag. */
  begin(nx: number, ny: number): boolean {
    if (this.tool === 'none') return false;
    const p = this.pick(nx, ny);
    if (!p) return false;
    if (this.tool === 'street' || this.tool === 'avenue') {
      this.from = p;
      return true;
    }
    this.apply(p);
    return true;
  }

  dragTool(nx: number, ny: number) {
    const p = this.pick(nx, ny);
    if (!p) return;
    this.cursor.show(p, this.radius(), this.distance);
    if (this.tool === 'street' || this.tool === 'avenue') {
      const half = this.tool === 'avenue' ? 11 : 7;
      this.cursor.drag(this.from, p, half, this.from ? p.distanceTo(this.from) > 22 : false);
      return;
    }
    this.apply(p);
  }

  /** Left button up. Commits a road drag. */
  finish(nx: number, ny: number) {
    this.cursor.drag(null, null, 0, false);
    const a = this.from;
    this.from = null;
    if (!a || (this.tool !== 'street' && this.tool !== 'avenue')) return;
    const b = this.pick(nx, ny);
    if (!b) return;
    const len = Math.hypot(b.x - a.x, b.z - a.z);
    if (len < 22) {
      this.notice = 'too short — roads start at 22 m';
      return;
    }
    const cost = Math.round(len * Sim.price(this.tool));
    if (!this.sim.spend(cost)) {
      this.notice = 'not enough in the account';
      return;
    }
    if (!this.city.roads.lay(a.x, a.z, b.x, b.z, this.tool)) {
      this.sim.spend(-cost);
      this.notice = 'nothing to connect there';
    }
  }

  private apply(p: THREE.Vector3) {
    if (this.tool === 'bulldoze') {
      const hit = this.city.roads.splitAt(p.x, p.z, this.radius());
      if (hit) this.city.roads.remove(hit.seg.id);
      else this.city.paint(p.x, p.z, this.brush * 0.6, null);
      return;
    }
    this.city.paint(p.x, p.z, this.brush, this.tool as Zone);
  }

  // ----------------------------------------------------------------- labels

  /**
   * Anchors for the floating badges, in screen space.
   *
   * Projected here rather than in React because the projection needs the
   * camera matrix as it was for the frame just drawn, and because the depth
   * decides which badges are behind the viewer and must not be drawn at all.
   */
  labels(): Label[] {
    const out: Label[] = [];
    const b = [...this.city.built.values()];
    if (!b.length) return out;

    let tall = b[0];
    let sx = 0;
    let sz = 0;
    let w = 0;
    for (const x of b) {
      if (x.m.height > tall.m.height) tall = x;
      const k = x.m.height + 4;
      sx += x.lot.x * k;
      sz += x.lot.z * k;
      w += k;
    }
    const s = this.sim.stats;
    const put = (id: string, x: number, y: number, z: number, title: string, note: string, kind: Label['kind']) => {
      const v = new THREE.Vector3(x, y, z).project(this.camera);
      if (v.z > 1) return;
      out.push({ id, x: (v.x * 0.5 + 0.5) * this.size.x, y: (-v.y * 0.5 + 0.5) * this.size.y, depth: v.z, title, note, kind });
    };
    put('city', sx / w, this.terrain.height(sx / w, sz / w) + 40, sz / w,
      'Downtown', s.population.toLocaleString() + ' residents', 'city');
    put('tall', tall.lot.x, this.terrain.height(tall.lot.x, tall.lot.z) + tall.m.height + 14, tall.lot.z,
      Math.round(tall.m.height) + ' m', tall.m.floors + ' floors · ' + ZONE_NAME[tall.zone], 'tower');
    return out;
  }

  // ----------------------------------------------------------------- camera

  /** Where a screen point lands on the terrain, or null past the horizon. */
  pick(nx: number, ny: number): THREE.Vector3 | null {
    this.raycaster.setFromCamera(new THREE.Vector2(nx, ny), this.camera);
    const hit = this.raycaster.intersectObject(this.terrain.mesh, false)[0];
    if (hit) return hit.point.clone();
    // Fall back to the sea plane so the cursor still means something offshore.
    const p = new THREE.Vector3();
    return this.raycaster.ray.intersectPlane(GROUND, p) ? p : null;
  }

  /**
   * Drag the ground.
   *
   * The two rays are intersected against a plane at the *target's* height
   * rather than at zero, so grabbing a hilltop does not slide the world out
   * from under the cursor.
   */
  panBy(fromNx: number, fromNy: number, toNx: number, toNy: number) {
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -this.target.y);
    const a = new THREE.Vector3();
    const b = new THREE.Vector3();
    this.raycaster.setFromCamera(new THREE.Vector2(fromNx, fromNy), this.camera);
    if (!this.raycaster.ray.intersectPlane(plane, a)) return;
    this.raycaster.setFromCamera(new THREE.Vector2(toNx, toNy), this.camera);
    if (!this.raycaster.ray.intersectPlane(plane, b)) return;
    this.target.x -= b.x - a.x;
    this.target.z -= b.z - a.z;
    this.clampTarget();
  }

  orbitBy(dx: number, dy: number) {
    this.azimuth -= dx * 2.4;
    this.polar = THREE.MathUtils.clamp(this.polar + dy * 1.6, 0.08, 1.32);
  }

  zoomBy(k: number) {
    this.distance = THREE.MathUtils.clamp(this.distance * Math.pow(1.0016, k), 80, 2600);
    // Low and close, high and far: the tilt follows the distance, which is what
    // every builder does and what stops a top-down view at street level.
    const t = THREE.MathUtils.clamp((this.distance - 120) / 1400, 0, 1);
    this.polar = THREE.MathUtils.clamp(this.polar, 0.08, 0.5 + t * 0.82);
  }

  private clampTarget() {
    const lim = WORLD * 0.52;
    this.target.x = THREE.MathUtils.clamp(this.target.x, -lim, lim);
    this.target.z = THREE.MathUtils.clamp(this.target.z, -lim, lim);
    this.target.y = Math.max(0, this.terrain.height(this.target.x, this.target.z));
  }

  setQuality(q: Quality) {
    this.quality = q;
    this.renderer.setPixelRatio(Math.min(q.dpr, window.devicePixelRatio || 1));
    this.renderer.shadowMap.enabled = q.shadows;
    this.bloom.enabled = q.bloom;
    this.blurH.enabled = q.tiltShift;
    this.blurV.enabled = q.tiltShift;
    this.resize(this.size.x, this.size.y);
  }

  get currentQuality() {
    return this.quality;
  }

  dispose() {
    this.composer.dispose();
    this.city.buildings.clear();
    this.city.roadMesh.clear();
    this.renderer.dispose();
    this.terrain.mesh.geometry.dispose();
    this.water.mesh.geometry.dispose();
  }
}

const TOOL_COLOUR: Partial<Record<Tool, number>> = {
  street: 0xffc247,
  avenue: 0xffa030,
  bulldoze: 0xff5a4a,
  res: 0x5fc76c,
  com: 0x4a9ef5,
  ind: 0xf2c245,
  off: 0xb872ee,
  park: 0x2fdc9e,
};

const ZONE_NAME: Record<Zone, string> = {
  res: 'homes',
  com: 'shops',
  ind: 'works',
  off: 'offices',
  park: 'park',
};

function smoothstep(a: number, b: number, v: number) {
  const t = THREE.MathUtils.clamp((v - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
}
