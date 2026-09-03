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
  readonly city = new THREE.Group();

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
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.toneMapping = THREE.NoToneMapping; // the grade pass does it
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.camera = new THREE.PerspectiveCamera(42, 1, 4, 9000);

    this.scene.fog = new THREE.FogExp2(0x9fb6cf, 0.00034);
    this.scene.add(this.sky.mesh, this.sky.sun, this.sky.sun.target, this.sky.ambient);
    this.scene.add(this.city);

    this.terrain = new Terrain(seed);
    this.scene.add(this.terrain.mesh);
    this.water = new Water(this.terrain.texture);
    this.scene.add(this.water.mesh);

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
    // Keep the one shadow cascade centred on what is being looked at.
    this.sky.sun.position.copy(this.sky.dir).multiplyScalar(1800).add(this.target);
    this.sky.sun.target.position.copy(this.target);
    this.sky.sun.target.updateMatrixWorld();
  }

  render() {
    const dt = Math.min(0.05, this.clock.getDelta());
    const t = this.clock.elapsedTime;
    this.water.update(t);
    this.grade.uniforms.uTime.value = t;
    this.place();
    this.composer.render();
    return dt;
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
    this.renderer.dispose();
    this.terrain.mesh.geometry.dispose();
    this.water.mesh.geometry.dispose();
  }
}
