import * as THREE from 'three';
import { BloomEffect, EffectComposer, EffectPass, RenderPass, SMAAEffect, VignetteEffect } from 'postprocessing';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RippleSim, SIM, clamp, groundHeight, pondSDF, rng } from './pond';
import { causticUniforms } from './caustics';
import { Koi, NAMES, randomVariety, type KoiSave, type PondQuery, type Variety } from './koi';
import { Floaters, type FloatKind } from './floaters';
import { makeLantern, makePlants, makeRocks, makeSpout, makeTerrain, makeTrees, pondify, wind, type Obstacle, type Tree } from './garden';
import { makeSky, makeWater } from './water';
import { dotTexture } from './textures';
import { PondAudio } from './audio';

export type Tool = 'hand' | 'stone' | 'food' | 'leaf' | 'lily' | 'boat' | 'lantern' | 'koi';
export type TimeOfDay = 'day' | 'dusk' | 'night';

type Look = {
  sunDir: THREE.Vector3; sunCol: THREE.Color; sunI: number; hemiSky: THREE.Color; hemiGround: THREE.Color; hemiI: number;
  zen: THREE.Color; hor: THREE.Color; night: number; exposure: number; caustic: number;
};
const LOOKS: Record<TimeOfDay, Look> = {
  day: {
    sunDir: new THREE.Vector3(-0.5, 0.78, -0.42).normalize(), sunCol: new THREE.Color(1, 0.94, 0.84), sunI: 3.1,
    hemiSky: new THREE.Color(0.62, 0.74, 0.92), hemiGround: new THREE.Color(0.32, 0.36, 0.22), hemiI: 0.75,
    zen: new THREE.Color(0.18, 0.36, 0.72), hor: new THREE.Color(0.7, 0.8, 0.9), night: 0, exposure: 0.95, caustic: 1,
  },
  dusk: {
    sunDir: new THREE.Vector3(-0.86, 0.26, -0.3).normalize(), sunCol: new THREE.Color(1, 0.62, 0.34), sunI: 2.3,
    hemiSky: new THREE.Color(0.5, 0.48, 0.68), hemiGround: new THREE.Color(0.28, 0.22, 0.16), hemiI: 0.75,
    zen: new THREE.Color(0.16, 0.18, 0.4), hor: new THREE.Color(0.98, 0.56, 0.36), night: 0.25, exposure: 1.0, caustic: 0.55,
  },
  night: {
    sunDir: new THREE.Vector3(0.35, 0.72, -0.55).normalize(), sunCol: new THREE.Color(0.55, 0.68, 1), sunI: 0.42,
    hemiSky: new THREE.Color(0.16, 0.22, 0.42), hemiGround: new THREE.Color(0.05, 0.06, 0.06), hemiI: 0.3,
    zen: new THREE.Color(0.01, 0.018, 0.05), hor: new THREE.Color(0.04, 0.06, 0.12), night: 1, exposure: 1.15, caustic: 0.18,
  },
};

type Stone = { x: number; y: number; z: number; vx: number; vy: number; vz: number; s: number; rot: THREE.Euler; spin: THREE.Vector3; phase: 'air' | 'sink' | 'rest' };
type Drop = { x: number; y: number; z: number; vx: number; vy: number; vz: number; life: number };

export type FishInfo = { id: number; name: string; variety: Variety; length: number; butterfly: boolean };

const SAVE_KEY = 'koi-pond-v1';

export class PondWorld {
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  composer: EffectComposer;
  sim = new RippleSim();
  floaters = new Floaters();
  koi: Koi[] = [];
  audio = new PondAudio();
  time = 0;
  tool: Tool = 'hand';
  koiPick: { variety: Variety | 'random'; butterfly: boolean } = { variety: 'random', butterfly: false };
  rain = false;
  breeze = false;
  tod: TimeOfDay = 'day';
  onFish: (f: FishInfo | null) => void = () => {};
  onCount: () => void = () => {};
  readonly low: boolean;

  private rippleData: Uint16Array;
  private rippleTex: THREE.DataTexture;
  private refrRT: THREE.WebGLRenderTarget;
  private reflRT: THREE.WebGLRenderTarget | null = null;
  private reflCam = new THREE.PerspectiveCamera();
  private water: ReturnType<typeof makeWater>;
  private sky: ReturnType<typeof makeSky>;
  private sun: THREE.DirectionalLight;
  private hemi: THREE.HemisphereLight;
  private lanterns: ReturnType<typeof makeLantern>[] = [];
  private spout: ReturnType<typeof makeSpout>;
  private spoutHit = new THREE.Vector3();
  private trees: Tree[];
  private obstacles: Obstacle[];
  private stones: Stone[] = [];
  private stoneMesh: THREE.InstancedMesh;
  private drops: Drop[] = [];
  private dropPts: THREE.Points;
  private bubbles: Drop[] = [];
  private bubblePts: THREE.Points;
  private rainLines: THREE.LineSegments;
  private rainDrops: Float32Array;
  private fireflies: THREE.Points;
  private ffState: Float32Array;
  private ring: THREE.Mesh;
  private selected: Koi | null = null;
  private selectT = 0;
  private aboveOnly: THREE.Object3D[] = [];
  private cur: Look;
  private target: Look;
  private canopyTex: THREE.CanvasTexture;
  private canopyCv: HTMLCanvasElement;
  private attract: PondQuery['attract'] = null;
  private scares: PondQuery['scare'] = [];
  private r = rng(2024);
  private windV = new THREE.Vector2();
  private windAmt = 0.2;
  private rainAmt = 0;
  private stirring = false;
  private last: { x: number; z: number; t: number } | null = null;
  private clipBelow = [new THREE.Plane(new THREE.Vector3(0, -1, 0), 0.03)];
  private clipAbove = [new THREE.Plane(new THREE.Vector3(0, 1, 0), 0.0)];
  private clipMain = [new THREE.Plane(new THREE.Vector3(0, 1, 0), 0.3)];
  private raycaster = new THREE.Raycaster();
  private size = new THREE.Vector2(1, 1);
  private petalT = 0;
  private wakeBudget = 0;
  private koiId = new WeakMap<Koi, number>();
  private nextKoiId = 1;

  constructor(canvas: HTMLCanvasElement, quality: 'high' | 'low') {
    this.low = quality === 'low';
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', stencil: false, depth: true });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.shadowMap.autoUpdate = false;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer = renderer;

    this.camera = new THREE.PerspectiveCamera(36, 1, 0.1, 200);
    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enablePan = false;
    this.controls.enableDamping = true;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 27;
    this.controls.minPolarAngle = 0.0;
    this.controls.maxPolarAngle = 1.18;
    this.controls.mouseButtons = { LEFT: -1 as unknown as THREE.MOUSE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE };
    this.controls.touches = { ONE: -1 as unknown as THREE.TOUCH, TWO: THREE.TOUCH.DOLLY_ROTATE };
    this.resetCamera(true);

    this.cur = cloneLook(LOOKS.day);
    this.target = LOOKS.day;

    // light
    this.hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
    this.scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight(0xffffff, 3);
    this.sun.castShadow = true;
    const sm = this.low ? 1024 : 2048;
    this.sun.shadow.mapSize.set(sm, sm);
    const sc = this.sun.shadow.camera;
    sc.left = -15; sc.right = 15; sc.top = 12; sc.bottom = -12; sc.near = 1; sc.far = 70;
    this.sun.shadow.bias = -0.0004;
    this.sun.shadow.normalBias = 0.03;
    this.sun.shadow.radius = 4;
    this.scene.add(this.sun, this.sun.target);

    // sky + ripple texture
    this.sky = makeSky();
    this.scene.add(this.sky.mesh);
    this.aboveOnly.push(this.sky.mesh);
    this.rippleData = new Uint16Array(SIM.nx * SIM.nz);
    this.rippleTex = new THREE.DataTexture(this.rippleData, SIM.nx, SIM.nz, THREE.RedFormat, THREE.HalfFloatType);
    this.rippleTex.magFilter = THREE.LinearFilter; this.rippleTex.minFilter = THREE.LinearFilter;
    this.rippleTex.needsUpdate = true;
    causticUniforms.uRipple.value = this.rippleTex;
    causticUniforms.uSimRect.value.set(SIM.x0 - SIM.dx / 2, SIM.z0 - SIM.dx / 2, SIM.nx * SIM.dx, SIM.nz * SIM.dx);

    // the garden
    this.scene.add(makeTerrain(this.low));
    const rocks = makeRocks(this.low);
    this.obstacles = rocks.obstacles;
    this.scene.add(rocks.group);
    this.scene.add(makePlants(this.low, rocks.rocks));
    this.trees = makeTrees(this.low);
    this.trees.forEach((t) => this.scene.add(t.group));
    const edgePoint = (ang: number, out: number) => {
      let x = Math.cos(ang) * 6, z = Math.sin(ang) * 4;
      for (let k = 0; k < 30; k++) { const d = pondSDF(x, z) - out; x -= Math.cos(ang) * d * 0.7; z -= Math.sin(ang) * d * 0.7; }
      return [x, z] as const;
    };
    for (const [ang, rot] of [[2.3, 0.4], [-0.78, 1.2]] as const) {
      const [x, z] = edgePoint(ang, 0.85);
      const l = makeLantern(x, z, rot);
      this.lanterns.push(l);
      this.scene.add(l.group);
    }
    this.spout = makeSpout();
    {
      const ang = -0.12;
      const [x, z] = edgePoint(ang, -0.08);
      this.spout.group.position.set(x, 0.42, z);
      // point the pipe at the middle of the pond
      this.spout.group.rotation.y = -Math.atan2(-z, -x);
      this.scene.add(this.spout.group);
      this.spout.group.updateMatrixWorld(true);
      this.spoutHit.copy(this.spout.mouth).applyMatrix4(this.spout.group.matrixWorld);
      this.aboveOnly.push(this.spout.group.children[this.spout.group.children.length - 1]);
    }

    // water
    this.water = makeWater(this.low);
    this.water.uniforms.uRipple.value = this.rippleTex;
    this.water.uniforms.uSimRect.value.copy(causticUniforms.uSimRect.value);
    this.scene.add(this.water.mesh);
    const dpr = 1;
    this.refrRT = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, depthTexture: new THREE.DepthTexture(4, 4) });
    this.water.uniforms.tRefr.value = this.refrRT.texture;
    this.water.uniforms.tDepth.value = this.refrRT.depthTexture;
    if (!this.low) {
      this.reflRT = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType });
      this.water.uniforms.tRefl.value = this.reflRT.texture;
      this.water.uniforms.uHasRefl.value = 1;
    }
    void dpr;
    // canopy light mask for the glints
    this.canopyCv = document.createElement('canvas');
    this.canopyCv.width = 256; this.canopyCv.height = 196;
    this.canopyTex = new THREE.CanvasTexture(this.canopyCv);
    this.water.uniforms.tCanopy.value = this.canopyTex;

    // floating things
    this.scene.add(this.floaters.group);

    // stones that sink
    const sg = new THREE.IcosahedronGeometry(1, 2);
    const sp = sg.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < sp.count; i++) { const k = 0.85 + 0.15 * Math.sin(sp.getX(i) * 5 + sp.getZ(i) * 3) * Math.cos(sp.getY(i) * 4); sp.setXYZ(i, sp.getX(i) * k, sp.getY(i) * k * 0.7, sp.getZ(i) * k); }
    sg.computeVertexNormals();
    this.stoneMesh = new THREE.InstancedMesh(sg, pondify(new THREE.MeshStandardMaterial({ color: 0x8c8780, roughness: 0.6 }), { caustic: true, key: 'pebble' }), 80);
    this.stoneMesh.count = 0; this.stoneMesh.castShadow = true; this.stoneMesh.receiveShadow = true; this.stoneMesh.frustumCulled = false;
    this.stoneMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(80 * 3), 3);
    this.scene.add(this.stoneMesh);

    // spray and bubbles
    const dot = dotTexture();
    const mkPts = (n: number, color: number, size: number, opacity: number) => {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
      g.setDrawRange(0, 0);
      const pts = new THREE.Points(g, new THREE.PointsMaterial({ map: dot, color, size, transparent: true, opacity, depthWrite: false, sizeAttenuation: true }));
      pts.frustumCulled = false;
      this.scene.add(pts);
      return pts;
    };
    this.dropPts = mkPts(900, 0xeaf4f6, 0.045, 0.9);
    this.bubblePts = mkPts(300, 0xdff2f0, 0.035, 0.7);
    this.aboveOnly.push(this.dropPts);

    // rain
    const RN = this.low ? 260 : 600;
    this.rainDrops = new Float32Array(RN * 4);
    for (let i = 0; i < RN; i++) this.respawnRain(i, true);
    const rg = new THREE.BufferGeometry();
    rg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(RN * 6), 3));
    this.rainLines = new THREE.LineSegments(rg, new THREE.LineBasicMaterial({ color: 0xc8d6de, transparent: true, opacity: 0.35, depthWrite: false }));
    this.rainLines.frustumCulled = false; this.rainLines.visible = false;
    this.scene.add(this.rainLines);
    this.aboveOnly.push(this.rainLines);

    // fireflies
    const FN = 70;
    this.ffState = new Float32Array(FN * 4);
    const fg = new THREE.BufferGeometry();
    fg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(FN * 3), 3));
    fg.setAttribute('a', new THREE.BufferAttribute(new Float32Array(FN), 1));
    for (let i = 0; i < FN; i++) {
      let x = 0, z = 0;
      do { x = (this.r() - 0.5) * 22; z = (this.r() - 0.5) * 15; } while (pondSDF(x, z) < -1.5);
      this.ffState.set([x, 0.3 + this.r() * 1.2, z, this.r() * 10], i * 4);
    }
    this.fireflies = new THREE.Points(fg, new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uMap: { value: dot }, uOn: { value: 0 } },
      vertexShader: 'attribute float a; varying float vA; uniform float uOn; void main(){ vA = a * uOn; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = 90.0 / -mv.z; gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'uniform sampler2D uMap; varying float vA; void main(){ float m = texture2D(uMap, gl_PointCoord).r; gl_FragColor = vec4(vec3(0.85, 1.0, 0.45) * m * vA * 3.0, 1.0); }',
    }));
    this.fireflies.frustumCulled = false;
    this.scene.add(this.fireflies);
    this.aboveOnly.push(this.fireflies);

    // selection ring on the water
    this.ring = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.47, 48), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false }));
    this.ring.rotation.x = -Math.PI / 2;
    this.scene.add(this.ring);
    this.aboveOnly.push(this.ring);

    // post
    this.composer = new EffectComposer(renderer, { frameBufferType: THREE.HalfFloatType, multisampling: this.low ? 0 : 4 });
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    const bloom = new BloomEffect({ intensity: 0.55, luminanceThreshold: 0.9, luminanceSmoothing: 0.15, mipmapBlur: true, radius: 0.55 });
    const vig = new VignetteEffect({ offset: 0.3, darkness: 0.5 });
    this.composer.addPass(new EffectPass(this.camera, bloom, vig));
    if (!this.low) this.composer.addPass(new EffectPass(this.camera, new SMAAEffect()));

    this.scene.fog = new THREE.Fog(0xb8c8d8, 32, 120);
    this.load();
    this.applyLook(true);
    this.drawCanopy();
  }

  /* ---------- stocking ---------- */

  private load() {
    let saved: { koi?: KoiSave[]; tod?: TimeOfDay } | null = null;
    try { saved = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); } catch { saved = null; }
    const list = saved?.koi?.length ? saved.koi.slice(0, 36) : this.defaultStock();
    for (const s of list) this.addKoi(s, null, false);
    if (saved?.tod && LOOKS[saved.tod]) { this.tod = saved.tod; this.target = LOOKS[saved.tod]; this.cur = cloneLook(LOOKS[saved.tod]); }
    // lily pads in two drifts, an iris corner and a few fallen leaves
    const r = this.r;
    for (const [cx, cz, n] of [[-3.9, -1.9, 8], [4.1, 1.7, 6], [-0.6, -3.1, 3]] as const) {
      for (let i = 0; i < n; i++) {
        const x = cx + (r() - 0.5) * 1.8, z = cz + (r() - 0.5) * 1.3;
        if (pondSDF(x, z) > -0.5) continue;
        this.floaters.add('lily', x, z);
      }
    }
    for (let i = 0; i < 10; i++) {
      const x = (r() - 0.5) * 9, z = (r() - 0.5) * 6;
      if (pondSDF(x, z) < -0.4) this.floaters.add(r() < 0.5 ? 'petal' : 'leaf', x, z);
    }
    for (let i = 0; i < 26; i++) {
      const x = -4 + (r() - 0.5) * 4, z = -2 + (r() - 0.5) * 3;
      if (pondSDF(x, z) < -0.3) this.floaters.add('petal', x, z);
    }
    // let the lilies settle into place before the first frame
    for (let i = 0; i < 90; i++) this.floaters.update(1 / 30, this.sim, this.windV, this.obstacles, 1, () => {});
    for (const f of this.floaters.list) if (f.kind === 'lily') { f.ax = f.x; f.az = f.z; }
  }

  private defaultStock(): KoiSave[] {
    const r = rng(7);
    const fixed: Variety[] = ['kohaku', 'kohaku', 'sanke', 'showa', 'tancho', 'yamabuki', 'platinum', 'asagi', 'chagoi', 'orenji', 'shusui', 'sanke', 'kohaku'];
    return fixed.map((variety, i) => ({ variety, name: NAMES[(i * 5 + 3) % NAMES.length], length: 0.58 + r() * 0.32, seed: 100 + i * 37, butterfly: i === 5 || i === 11 }));
  }

  save() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify({ koi: this.koi.map((k) => k.save), tod: this.tod })); } catch { /* storage may be unavailable */ }
  }

  addKoi(save: KoiSave, at: { x: number; z: number } | null, splash: boolean) {
    const k = new Koi(save);
    let x = at?.x ?? 0, z = at?.z ?? 0;
    if (!at) { do { x = (this.r() - 0.5) * 10; z = (this.r() - 0.5) * 6.5; } while (pondSDF(x, z) > -1); }
    k.spawn(x, z);
    if (splash) {
      k.y = -0.08; k.enter = 0.6;
      this.splashAt(x, z, 0.12, 0.6);
    }
    this.koi.push(k);
    this.koiId.set(k, this.nextKoiId++);
    this.scene.add(k.group);
    this.onCount();
    return k;
  }

  releaseKoi(id: number) {
    const k = this.koi.find((q) => this.koiId.get(q) === id);
    if (!k) return;
    this.splashAt(k.x, k.z, 0.08, 0.4);
    this.scene.remove(k.group);
    k.dispose();
    this.koi.splice(this.koi.indexOf(k), 1);
    if (this.selected === k) { this.selected = null; this.onFish(null); }
    this.save();
    this.onCount();
  }

  /* ---------- environment ---------- */

  setTime(t: TimeOfDay) { this.tod = t; this.target = LOOKS[t]; this.drawCanopy(); this.save(); }
  setRain(on: boolean) { this.rain = on; }
  setBreeze(on: boolean) { this.breeze = on; }

  private applyLook(snap = false) {
    const c = this.cur, t = this.target;
    const k = snap ? 1 : 0.03;
    c.sunDir.lerp(t.sunDir, k).normalize();
    c.sunCol.lerp(t.sunCol, k); c.hemiSky.lerp(t.hemiSky, k); c.hemiGround.lerp(t.hemiGround, k);
    c.zen.lerp(t.zen, k); c.hor.lerp(t.hor, k);
    c.sunI += (t.sunI - c.sunI) * k; c.hemiI += (t.hemiI - c.hemiI) * k; c.night += (t.night - c.night) * k;
    c.exposure += (t.exposure - c.exposure) * k; c.caustic += (t.caustic - c.caustic) * k;
    const overcast = this.rainAmt;
    this.sun.color.copy(c.sunCol);
    this.sun.intensity = c.sunI * (1 - overcast * 0.7);
    this.sun.position.copy(c.sunDir).multiplyScalar(35);
    this.hemi.color.copy(c.hemiSky); this.hemi.groundColor.copy(c.hemiGround);
    this.hemi.intensity = c.hemiI * (1 + overcast * 0.15);
    const grey = new THREE.Color(0.42, 0.46, 0.5).multiplyScalar(1 - c.night * 0.9);
    const zen = c.zen.clone().lerp(grey, overcast * 0.6), hor = c.hor.clone().lerp(grey, overcast * 0.6);
    this.sky.uniforms.uZen.value.copy(zen); this.sky.uniforms.uHor.value.copy(hor);
    this.sky.uniforms.uSunDir.value.copy(c.sunDir);
    this.sky.uniforms.uSunCol.value.copy(c.sunCol).multiplyScalar((1 - overcast) * (c.night > 0.5 ? 0.15 : 1));
    this.sky.uniforms.uStars.value = Math.max(0, c.night - 0.4) / 0.6 * (1 - overcast);
    const wu = this.water.uniforms;
    wu.uSkyZen.value.copy(zen); wu.uSkyHor.value.copy(hor);
    wu.uSunDir.value.copy(c.sunDir); wu.uSunCol.value.copy(c.sunCol).multiplyScalar((c.sunI / 3) ** 2);
    wu.uGlint.value = Math.max(0, 1 - overcast * 1.1) * (1 - c.night * 0.92);
    wu.uScatter.value.setRGB(0.025, 0.06, 0.05).multiplyScalar(1 - c.night * 0.85);
    (this.scene.fog as THREE.Fog).color.copy(hor);
    causticUniforms.uCaus.value = c.caustic * (1 - overcast * 0.75);
    causticUniforms.uSunDirC.value.copy(c.sunDir);
    this.renderer.toneMappingExposure = c.exposure;
    for (const l of this.lanterns) { l.light.intensity = c.night * 7; l.glow.emissiveIntensity = c.night * 4; (l.halo.material as THREE.SpriteMaterial).opacity = c.night * 0.85; }
    this.floaters.setNight(c.night);
    (this.fireflies.material as THREE.ShaderMaterial).uniforms.uOn.value = clamp((c.night - 0.5) * 2, 0, 1) * (1 - overcast);
    this.audio.night = c.night;
  }

  /** Where the canopies shade the water, projected along the light. */
  private drawCanopy() {
    const cv = this.canopyCv, ctx = cv.getContext('2d')!;
    const rect = this.water.uniforms.uCanopyRect.value;
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height);
    const sd = this.target.sunDir;
    ctx.fillStyle = 'rgba(0,0,0,0.13)';
    for (const t of this.trees) for (let i = 0; i < t.canopy.length; i += 2) {
      const p = t.canopy[i];
      const x = p.x - (sd.x / sd.y) * p.y, z = p.z - (sd.z / sd.y) * p.y;
      const u = ((x - rect.x) / rect.z) * cv.width, v = ((z - rect.y) / rect.w) * cv.height;
      ctx.beginPath(); ctx.arc(u, v, 3.2, 0, Math.PI * 2); ctx.fill();
    }
    this.canopyTex.needsUpdate = true;
  }

  /* ---------- input ---------- */

  /** Screen point (NDC) to a spot on the water plane. */
  pick(nx: number, ny: number) {
    this.raycaster.setFromCamera(new THREE.Vector2(nx, ny), this.camera);
    const ray = this.raycaster.ray;
    if (Math.abs(ray.direction.y) < 1e-4) return null;
    const t = -ray.origin.y / ray.direction.y;
    if (t < 0) return null;
    const p = ray.at(t, new THREE.Vector3());
    return { x: p.x, z: p.z, inPond: pondSDF(p.x, p.z) < -0.06 };
  }

  private fishNear(x: number, z: number) {
    let best: Koi | null = null, bd = 0.45;
    for (const k of this.koi) {
      const d = Math.hypot(k.x - x, k.z - z) - k.save.length * 0.25;
      if (d < bd) { bd = d; best = k; }
    }
    return best;
  }

  pointerDown(nx: number, ny: number) {
    const p = this.pick(nx, ny);
    if (!p) return;
    this.audio.ctx?.resume();
    const pan = clamp(p.x / 7, -1, 1);
    if (!p.inPond) {
      if (this.tool === 'hand') this.last = null;
      return;
    }
    const r = this.r;
    switch (this.tool) {
      case 'hand': {
        const fish = this.fishNear(p.x, p.z);
        if (fish) this.select(fish);
        this.sim.disturb(p.x, p.z, 0.14, 0.035);
        this.audio.plip(0.25, pan);
        this.stirring = true;
        this.last = { x: p.x, z: p.z, t: this.time };
        this.attract = { x: p.x, z: p.z, until: this.time + 5 };
        break;
      }
      case 'stone': this.throwStone(p.x, p.z); break;
      case 'food': {
        const n = 9 + Math.floor(r() * 5);
        for (let i = 0; i < n; i++) {
          const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 0.32;
          this.floaters.add('pellet', p.x + Math.cos(a) * d, p.z + Math.sin(a) * d, { air: 0.25 + r() * 0.35, vx: Math.cos(a) * 0.2, vz: Math.sin(a) * 0.2 });
        }
        break;
      }
      case 'leaf': {
        const n = 3 + Math.floor(r() * 3);
        for (let i = 0; i < n; i++) {
          const kind: FloatKind = r() < 0.35 ? 'petal' : 'leaf';
          const reps = kind === 'petal' ? 6 : 1;
          for (let k = 0; k < reps; k++) this.floaters.add(kind, p.x + (r() - 0.5) * 0.6, p.z + (r() - 0.5) * 0.6, { air: 1.2 + r() * 1.4, va: (r() - 0.5) * 2 });
        }
        break;
      }
      case 'lily': {
        this.floaters.add('lily', p.x, p.z, { flower: r() < 0.6 ? Math.floor(r() * 3) : -1 });
        this.sim.disturb(p.x, p.z, 0.4, 0.03);
        this.audio.plip(0.5, pan);
        break;
      }
      case 'boat': {
        this.floaters.add('boat', p.x, p.z, { a: r() * 6.28 });
        this.sim.disturb(p.x, p.z, 0.2, 0.025);
        this.audio.plip(0.35, pan);
        break;
      }
      case 'lantern': {
        this.floaters.add('lantern', p.x, p.z);
        this.sim.disturb(p.x, p.z, 0.18, 0.02);
        this.audio.plip(0.35, pan);
        break;
      }
      case 'koi': {
        if (this.koi.length >= 36) return;
        const variety = this.koiPick.variety === 'random' ? randomVariety(r) : this.koiPick.variety;
        const used = new Set(this.koi.map((k) => k.save.name));
        const free = NAMES.filter((nm) => !used.has(nm));
        const name = (free.length ? free : NAMES)[Math.floor(r() * (free.length || NAMES.length))];
        const k = this.addKoi({ variety, name, length: 0.5 + r() * 0.4, seed: Math.floor(r() * 1e6), butterfly: this.koiPick.butterfly }, { x: p.x, z: p.z }, true);
        this.select(k);
        this.save();
        break;
      }
    }
  }

  pointerMove(nx: number, ny: number) {
    if (!this.stirring || this.tool !== 'hand') return;
    const p = this.pick(nx, ny);
    if (!p || !p.inPond) { this.last = null; return; }
    if (this.last) {
      const dx = p.x - this.last.x, dz = p.z - this.last.z, d = Math.hypot(dx, dz);
      const dt = Math.max(1 / 120, this.time - this.last.t);
      const steps = Math.min(12, Math.ceil(d / 0.06));
      const speed = d / dt;
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        this.sim.disturb(this.last.x + dx * t, this.last.z + dz * t, 0.12, Math.min(0.02, 0.004 + speed * 0.0025) / Math.max(1, steps * 0.5));
      }
      this.floaters.drag(p.x, p.z, dx / dt * 0.5, dz / dt * 0.5, 0.22);
      if (speed > 1.5 && this.r() < 0.3) this.audio.plip(0.15, clamp(p.x / 7, -1, 1));
    }
    this.last = { x: p.x, z: p.z, t: this.time };
    this.attract = { x: p.x, z: p.z, until: this.time + 4 };
  }

  pointerUp() { this.stirring = false; this.last = null; }

  select(k: Koi | null) {
    this.selected = k;
    this.selectT = k ? 7 : 0;
    this.onFish(k ? { id: this.koiId.get(k)!, name: k.save.name, variety: k.save.variety, length: k.save.length, butterfly: k.save.butterfly } : null);
  }

  throwStone(x: number, z: number) {
    // lobbed from just in front of you, along the line of sight
    const cam = this.camera.position;
    const start = new THREE.Vector3(x, 0, z).lerp(cam, 0.32);
    start.y = Math.min(start.y, 3.2);
    const T = 0.7;
    const s = 0.045 + this.r() * 0.035;
    this.stones.push({
      x: start.x, y: start.y, z: start.z,
      vx: (x - start.x) / T, vz: (z - start.z) / T, vy: (0 - start.y) / T + 0.5 * 9.8 * T,
      s, rot: new THREE.Euler(this.r() * 6, this.r() * 6, 0), spin: new THREE.Vector3(this.r() * 8, this.r() * 8, this.r() * 8), phase: 'air',
    });
    if (this.stones.length > 70) this.stones.shift();
  }

  splashAt(x: number, z: number, radius: number, size: number) {
    this.sim.disturb(x, z, radius, 0.14 * size);
    const n = Math.round(30 + 60 * size);
    for (let i = 0; i < n; i++) {
      const a = this.r() * Math.PI * 2, sp = (0.4 + this.r() * 1.0) * (0.6 + size * 0.6);
      this.drops.push({ x: x + Math.cos(a) * radius * 0.4, y: 0.02, z: z + Math.sin(a) * radius * 0.4, vx: Math.cos(a) * sp * 0.45, vz: Math.sin(a) * sp * 0.45, vy: 1.1 + this.r() * 1.9 * size, life: 2 });
    }
    // the column that jumps back up after the stone
    for (let i = 0; i < 10 * size; i++) this.drops.push({ x, y: 0.02, z, vx: (this.r() - 0.5) * 0.2, vz: (this.r() - 0.5) * 0.2, vy: 2.2 + this.r() * 1.4, life: 2 });
    this.floaters.impulse(x, z, 1.2 * size + 0.4, 0.6 * size);
    this.scares.push({ x, z, t: this.time, r: 0.7 + size * 0.6 });
    if (this.drops.length > 900) this.drops.splice(0, this.drops.length - 900);
    this.audio.splash(size, clamp(x / 7, -1, 1));
  }

  resetCamera(snap = false) {
    const portrait = (this.size.x || 1) / (this.size.y || 1) < 0.9;
    this.camera.fov = portrait ? 52 : 36;
    this.camera.updateProjectionMatrix();
    const R = portrait ? 16.5 : 13.6, pol = 0.46, az = portrait ? Math.PI / 2 : 0;
    const tgt = new THREE.Vector3(0, 0, portrait ? 0 : 0.35);
    this.controls.target.copy(tgt);
    this.camera.position.set(tgt.x + Math.sin(pol) * Math.sin(az) * R, Math.cos(pol) * R, tgt.z + Math.sin(pol) * Math.cos(az) * R);
    this.camera.lookAt(tgt);
    if (snap) this.controls.update();
  }

  setSize(w: number, h: number, dpr: number) {
    const was = this.size.x / Math.max(1, this.size.y) < 0.9;
    this.size.set(w, h);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h, false);
    this.composer.setSize(w, h, false);
    this.camera.aspect = w / h;
    const portrait = w / h < 0.9;
    if (portrait !== was || this.time === 0) this.resetCamera(true);
    this.camera.updateProjectionMatrix();
    const bw = Math.floor(w * dpr), bh = Math.floor(h * dpr);
    this.refrRT.setSize(bw, bh);
    this.reflRT?.setSize(Math.floor(bw / 2), Math.floor(bh / 2));
    this.water.uniforms.uRes.value.set(bw, bh);
  }

  /* ---------- simulation ---------- */

  private respawnRain(i: number, anywhere: boolean) {
    const r = this.r;
    this.rainDrops[i * 4] = (r() - 0.5) * 26;
    this.rainDrops[i * 4 + 1] = anywhere ? r() * 9 : 7 + r() * 3;
    this.rainDrops[i * 4 + 2] = (r() - 0.5) * 20;
    this.rainDrops[i * 4 + 3] = 7.5 + r() * 2;
  }

  update(dt: number) {
    dt = Math.min(dt, 1 / 20);
    this.time += dt;
    const r = this.r;
    const T = this.time;
    // weather
    this.windAmt += ((this.breeze ? 1 : 0.18) - this.windAmt) * Math.min(1, dt * 0.6);
    this.rainAmt += ((this.rain ? 1 : 0) - this.rainAmt) * Math.min(1, dt * 0.5);
    const gust = 0.65 + 0.35 * Math.sin(T * 0.37) * Math.sin(T * 0.11 + 1);
    this.windV.set(0.85, 0.35).multiplyScalar(this.windAmt * gust * 0.55);
    wind.uWind.value.copy(this.windV).multiplyScalar(0.35);
    wind.uWTime.value = T;
    this.applyLook();

    // the spout pours in, steadily
    this.sim.disturb(this.spoutHit.x + (r() - 0.5) * 0.05, this.spoutHit.z + (r() - 0.5) * 0.05, 0.1, 0.0045);
    if (r() < dt * 14) this.bubbles.push({ x: this.spoutHit.x + (r() - 0.5) * 0.1, y: -0.05 - r() * 0.15, z: this.spoutHit.z + (r() - 0.5) * 0.1, vx: 0, vy: 0.15 + r() * 0.1, vz: 0, life: 2 });
    // breeze: cat's-paws skating across the surface
    if (this.windAmt > 0.3 && r() < dt * 30 * this.windAmt) {
      const x = (r() - 0.5) * 12, z = (r() - 0.5) * 8;
      if (pondSDF(x, z) < -0.2) this.sim.disturb(x, z, 0.3, 0.002 * this.windAmt);
    }
    // rain
    const rainOn = this.rainAmt > 0.02;
    this.rainLines.visible = rainOn;
    if (rainOn) {
      const n = this.rainDrops.length / 4;
      const active = Math.floor(n * this.rainAmt);
      const pos = this.rainLines.geometry.getAttribute('position') as THREE.BufferAttribute;
      for (let i = 0; i < n; i++) {
        const k = i * 4;
        if (i >= active) { pos.setXYZ(i * 2, 0, -50, 0); pos.setXYZ(i * 2 + 1, 0, -50, 0); continue; }
        this.rainDrops[k] += this.windV.x * dt * 2; this.rainDrops[k + 2] += this.windV.y * dt * 2;
        this.rainDrops[k + 1] -= this.rainDrops[k + 3] * dt;
        const x = this.rainDrops[k], y = this.rainDrops[k + 1], z = this.rainDrops[k + 2];
        const inPond = pondSDF(x, z) < -0.05;
        const floor = inPond ? 0 : groundHeight(x, z);
        if (y <= floor) {
          if (inPond) {
            this.sim.disturb(x, z, 0.07, 0.006);
            if (r() < 0.3) this.drops.push({ x, y: 0.01, z, vx: (r() - 0.5) * 0.3, vz: (r() - 0.5) * 0.3, vy: 0.5 + r() * 0.5, life: 0.6 });
            if (r() < 0.02) this.audio.plip(0.1, clamp(x / 7, -1, 1));
          }
          this.respawnRain(i, false);
          continue;
        }
        pos.setXYZ(i * 2, x, y, z);
        pos.setXYZ(i * 2 + 1, x - this.windV.x * 0.05, y + 0.28, z - this.windV.y * 0.05);
      }
      pos.needsUpdate = true;
    }
    // petals and leaves fall from the trees
    this.petalT -= dt;
    if (this.petalT <= 0) {
      this.petalT = 1 / (0.6 + this.windAmt * 8);
      const t = this.trees[r() < 0.75 ? 0 : 1];
      const p = t.canopy[Math.floor(r() * t.canopy.length)];
      this.floaters.add(t.kind === 'cherry' ? 'petal' : 'leaf', p.x, p.z, { air: p.y, cell: t.kind === 'maple' ? Math.floor(r() * 2) : 3, va: (r() - 0.5) * 2 });
    }

    // the sim and what floats on it
    this.sim.step(dt);
    const h = this.sim.h, d = this.rippleData;
    for (let i = 0; i < h.length; i++) d[i] = THREE.DataUtils.toHalfFloat(h[i]);
    this.rippleTex.needsUpdate = true;
    this.floaters.update(dt, this.sim, this.windV, this.obstacles, 1, (f) => {
      this.sim.disturb(f.x, f.z, f.kind === 'pellet' ? 0.05 : 0.08, f.kind === 'pellet' ? 0.006 : 0.004);
      if (f.kind === 'pellet' && r() < 0.5) this.audio.plip(0.05, clamp(f.x / 7, -1, 1));
    });
    this.floaters.sync(this.sim);

    // koi
    const food = this.floaters.food.map((f) => ({ x: f.x, z: f.z, y: f.y, alive: f.alive, id: f.id }));
    this.wakeBudget = 40;
    this.scares = this.scares.filter((s) => T - s.t < 0.1);
    const q: PondQuery = {
      time: T, food, koi: this.koi, obstacles: this.obstacles, attract: this.attract, scare: this.scares,
      eat: (id, k) => {
        const f = this.floaters.list.find((ff) => ff.id === id);
        if (!f || !f.alive) return;
        f.alive = false;
        const fd = food.find((ff) => ff.id === id); if (fd) fd.alive = false;
        this.sim.disturb(f.x, f.z, 0.09 + k.save.length * 0.08, 0.03);
        for (let i = 0; i < 4; i++) this.drops.push({ x: f.x, y: 0.01, z: f.z, vx: (r() - 0.5) * 0.4, vz: (r() - 0.5) * 0.4, vy: 0.4 + r() * 0.6, life: 1 });
        this.audio.gulp(clamp(f.x / 7, -1, 1));
      },
      wake: (x, z, s) => { if (this.wakeBudget-- > 0) this.sim.disturb(x, z, 0.12, s); },
    };
    for (const k of this.koi) k.update(dt, q);

    // stones
    for (const s of this.stones) {
      if (s.phase === 'air') {
        s.vy -= 9.8 * dt;
        s.x += s.vx * dt; s.y += s.vy * dt; s.z += s.vz * dt;
        s.rot.x += s.spin.x * dt; s.rot.y += s.spin.y * dt;
        if (s.y <= 0) {
          s.y = 0;
          if (pondSDF(s.x, s.z) < -0.05) {
            this.splashAt(s.x, s.z, 0.2, 0.5 + s.s * 8);
            s.phase = 'sink'; s.vy = -0.9; s.vx *= 0.1; s.vz *= 0.1;
            for (let i = 0; i < 8; i++) this.bubbles.push({ x: s.x + (r() - 0.5) * 0.1, y: -0.1 - r() * 0.2, z: s.z + (r() - 0.5) * 0.1, vx: 0, vy: 0.25 + r() * 0.2, vz: 0, life: 3 });
          } else { s.phase = 'rest'; s.y = groundHeight(s.x, s.z) + s.s * 0.5; }
        }
      } else if (s.phase === 'sink') {
        s.vy += (-0.42 - s.vy) * Math.min(1, dt * 3);
        s.x += s.vx * dt + Math.sin(T * 7 + s.s * 100) * 0.03 * dt; s.z += s.vz * dt;
        s.y += s.vy * dt;
        s.rot.x += s.spin.x * dt * 0.2;
        const floor = groundHeight(s.x, s.z) + s.s * 0.45;
        if (s.y <= floor) {
          s.y = floor; s.phase = 'rest';
          for (let i = 0; i < 3; i++) this.bubbles.push({ x: s.x, y: s.y, z: s.z, vx: 0, vy: 0.2 + r() * 0.15, vz: 0, life: 4 });
        }
      }
    }
    {
      const m4 = new THREE.Matrix4(), qq = new THREE.Quaternion(), sc = new THREE.Vector3(), pp = new THREE.Vector3(), col = new THREE.Color();
      this.stones.forEach((s, i) => {
        m4.compose(pp.set(s.x, s.y, s.z), qq.setFromEuler(s.rot), sc.setScalar(s.s));
        this.stoneMesh.setMatrixAt(i, m4);
        col.setHSL(0.08, 0.06 + (i % 3) * 0.03, 0.35 + ((i * 37) % 10) / 40);
        this.stoneMesh.setColorAt(i, col);
      });
      this.stoneMesh.count = this.stones.length;
      this.stoneMesh.instanceMatrix.needsUpdate = true;
      if (this.stoneMesh.instanceColor) this.stoneMesh.instanceColor.needsUpdate = true;
    }

    // spray
    {
      const pos = this.dropPts.geometry.getAttribute('position') as THREE.BufferAttribute;
      let n = 0;
      this.drops = this.drops.filter((p) => {
        p.vy -= 9.8 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.life -= dt;
        if (p.y < 0 && p.vy < 0) {
          if (pondSDF(p.x, p.z) < -0.05 && r() < 0.5) this.sim.disturb(p.x, p.z, 0.05, 0.004);
          return false;
        }
        return p.life > 0;
      });
      for (const p of this.drops) { if (n >= 900) break; pos.setXYZ(n++, p.x, p.y, p.z); }
      pos.needsUpdate = true;
      this.dropPts.geometry.setDrawRange(0, n);
    }
    {
      const pos = this.bubblePts.geometry.getAttribute('position') as THREE.BufferAttribute;
      let n = 0;
      this.bubbles = this.bubbles.filter((b) => {
        b.y += b.vy * dt; b.x += Math.sin(T * 9 + b.vy * 50) * 0.03 * dt; b.life -= dt;
        if (b.y >= -0.01) { this.sim.disturb(b.x, b.z, 0.04, 0.0025); return false; }
        return b.life > 0;
      });
      for (const b of this.bubbles) { if (n >= 300) break; pos.setXYZ(n++, b.x, b.y, b.z); }
      pos.needsUpdate = true;
      this.bubblePts.geometry.setDrawRange(0, n);
    }
    // fireflies drift and blink
    {
      const pos = this.fireflies.geometry.getAttribute('position') as THREE.BufferAttribute;
      const a = this.fireflies.geometry.getAttribute('a') as THREE.BufferAttribute;
      for (let i = 0; i < pos.count; i++) {
        const s = this.ffState, k = i * 4, ph = s[k + 3];
        const x = s[k] + Math.sin(T * 0.3 + ph) * 0.8, y = s[k + 1] + Math.sin(T * 0.7 + ph * 2) * 0.25, z = s[k + 2] + Math.cos(T * 0.25 + ph) * 0.8;
        pos.setXYZ(i, x, y, z);
        a.setX(i, Math.pow(Math.max(0, Math.sin(T * 1.3 + ph * 3)), 6));
      }
      pos.needsUpdate = true; a.needsUpdate = true;
    }
    // selection ring
    {
      const m = this.ring.material as THREE.MeshBasicMaterial;
      this.selectT = Math.max(0, this.selectT - dt);
      if (this.selected && this.koi.includes(this.selected)) {
        this.ring.position.set(this.selected.x, 0.03, this.selected.z);
        this.ring.scale.setScalar(this.selected.save.length * 1.6 * (1 + 0.05 * Math.sin(T * 4)));
        m.opacity = Math.min(0.55, this.selectT * 0.4);
      } else m.opacity = 0;
      if (this.selectT <= 0 && this.selected) { this.selected = null; }
    }
    this.spout.streamMat.uniforms.uTime.value = T;
    causticUniforms.uTime.value = T;
    this.water.uniforms.uTime.value = T;
    this.water.uniforms.uBreeze.value = this.windAmt + this.rainAmt * 0.5;
    this.audio.update(dt, { rain: this.rainAmt, wind: this.windAmt, night: this.cur.night });
    this.controls.update();
  }

  /* ---------- drawing ---------- */

  render() {
    const R = this.renderer;
    const cam = this.camera;
    cam.updateMatrixWorld();
    const hide = (on: boolean) => { for (const o of this.aboveOnly) o.visible = on; };
    this.water.mesh.visible = false;
    R.shadowMap.needsUpdate = true;
    // 1. the garden mirrored in the surface
    if (this.reflRT) {
      const rc = this.reflCam;
      rc.copy(cam);
      rc.position.set(cam.position.x, -cam.position.y, cam.position.z);
      // mirror the view direction and the camera's up, so the frame covers the same water
      const dir = new THREE.Vector3(); cam.getWorldDirection(dir);
      dir.y = -dir.y;
      const up = new THREE.Vector3(0, 1, 0).applyQuaternion(cam.quaternion);
      up.y = -up.y;
      rc.up.copy(up);
      rc.lookAt(rc.position.clone().add(dir));
      rc.updateMatrixWorld();
      rc.projectionMatrix.copy(cam.projectionMatrix);
      this.water.uniforms.uReflMat.value.multiplyMatrices(rc.projectionMatrix, rc.matrixWorldInverse);
      R.clippingPlanes = this.clipAbove;
      R.setRenderTarget(this.reflRT);
      R.setClearColor(0x000000, 1);
      R.clear();
      this.ring.visible = false; this.rainLines.visible = false;
      R.render(this.scene, rc);
      this.ring.visible = true; this.rainLines.visible = this.rainAmt > 0.02;
    }
    // 2. everything below the waterline, for refraction
    hide(false);
    R.clippingPlanes = this.clipBelow;
    R.setRenderTarget(this.refrRT);
    const deep = new THREE.Color(0.02, 0.035, 0.03);
    R.setClearColor(deep, 1);
    R.clear();
    R.render(this.scene, cam);
    hide(true);
    R.setRenderTarget(null);
    // 3. the frame: garden above, water on top of the floor
    this.water.mesh.visible = true;
    R.clippingPlanes = this.clipMain;
    this.water.uniforms.uNear.value = cam.near;
    this.water.uniforms.uFar.value = cam.far;
    this.composer.render();
    R.clippingPlanes = [];
  }

  /** A PNG of the current frame. */
  snapshot() {
    this.render();
    return this.renderer.domElement.toDataURL('image/png');
  }

  clearPond() {
    this.floaters.clear(true);
    this.stones = [];
    this.sim.clear();
  }

  dispose() {
    this.audio.dispose();
    this.controls.dispose();
    this.koi.forEach((k) => k.dispose());
    this.composer.dispose();
    this.refrRT.dispose(); this.reflRT?.dispose();
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
    });
    this.renderer.dispose();
  }
}

function cloneLook(l: Look): Look {
  return { ...l, sunDir: l.sunDir.clone(), sunCol: l.sunCol.clone(), hemiSky: l.hemiSky.clone(), hemiGround: l.hemiGround.clone(), zen: l.zen.clone(), hor: l.hor.clone() };
}
