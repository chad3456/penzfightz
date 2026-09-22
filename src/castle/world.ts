import * as THREE from 'three';
import { BRICK, Bricks, STUD } from './bricks';
import { buildCastle, TERMS } from './plan';

/**
 * Hallowdene, running.
 *
 * Raw three.js rather than a scene graph library, to match the rest of the 3-D
 * in this repository and because almost everything interesting here is a
 * per-frame decision — where the camera is being carried, which staircase has
 * swung, how much snow there is — and those are easier to hold in one object
 * than to thread through a render tree.
 *
 * ── Effects, without a post pass ─────────────────────────────────────────
 *
 * There is no bloom pass, no SSAO and no god-ray shader, because adding a
 * dependency for them was not available and, as it turns out, not necessary.
 * Every glow in this scene is an additive billboard with a radial gradient on
 * it, sitting exactly where the light is. That is what bloom *looks like* and
 * it costs one transparent quad instead of three full-screen passes — and
 * unlike a bloom pass it can be aimed: a candle can bloom while the snow does
 * not.
 */

const SUN_UP = new THREE.Vector3(0.45, 0.8, 0.35).normalize();

/** How the world looks in each of the seven terms. */
export interface Weather {
  sky: [string, string];
  fog: string;
  fogDensity: number;
  sun: string;
  sunAngle: number;
  sunPower: number;
  ambient: number;
  /** Falling things: snow in winter, embers in the dark terms, leaves otherwise. */
  motes: { colour: string; count: number; size: number; fall: number; drift: number };
  water: string;
  /** Stars come out as the terms go on. */
  stars: number;
  /** Lit windows. */
  glow: number;
}

export const TERM_WEATHER: Weather[] = [
  { // first crossing, at night
    sky: ['#0c1430', '#3a4d7e'], fog: '#22304f', fogDensity: 0.0028,
    sun: '#a9bce8', sunAngle: 0.22, sunPower: 0.7, ambient: 0.5,
    motes: { colour: '#cfe0ff', count: 520, size: 0.24, fall: 0.6, drift: 1.4 },
    water: '#16233f', stars: 1, glow: 1.5,
  },
  { // the hall, autumn evening
    sky: ['#3a2a44', '#c87a4e'], fog: '#6b4f4a', fogDensity: 0.0032,
    sun: '#ffb26b', sunAngle: 0.14, sunPower: 1.7, ambient: 0.62,
    motes: { colour: '#d8913f', count: 420, size: 0.26, fall: 0.9, drift: 2.4 },
    water: '#3d4a63', stars: 0.35, glow: 1.2,
  },
  { // second term, bright cold morning
    sky: ['#7fa8d8', '#dfeaf6'], fog: '#c3d3e4', fogDensity: 0.0026,
    sun: '#fff4dd', sunAngle: 0.55, sunPower: 2.4, ambient: 0.8,
    motes: { colour: '#ffffff', count: 320, size: 0.2, fall: 0.5, drift: 1 },
    water: '#4a7fb5', stars: 0, glow: 0.4,
  },
  { // third term, high summer
    sky: ['#4f8fd6', '#cfe6f7'], fog: '#bcd6ea', fogDensity: 0.0018,
    sun: '#fff8e6', sunAngle: 0.92, sunPower: 2.8, ambient: 0.95,
    motes: { colour: '#f0e28a', count: 240, size: 0.18, fall: 0.25, drift: 2.6 },
    water: '#3f86c4', stars: 0, glow: 0.2,
  },
  { // fourth term, deep winter
    sky: ['#8493a8', '#e8eef4'], fog: '#d6dee6', fogDensity: 0.0052,
    sun: '#eef3f8', sunAngle: 0.3, sunPower: 1.4, ambient: 0.75,
    motes: { colour: '#ffffff', count: 1700, size: 0.34, fall: 2.2, drift: 1.8 },
    water: '#9fb4c6', stars: 0, glow: 0.9,
  },
  { // fifth term, storm over the wood
    sky: ['#2b3142', '#6b7384'], fog: '#4a5361', fogDensity: 0.0046,
    sun: '#b9c6d6', sunAngle: 0.22, sunPower: 0.9, ambient: 0.6,
    motes: { colour: '#a9bdd4', count: 1300, size: 0.24, fall: 3.4, drift: 3.2 },
    water: '#2f4257', stars: 0.1, glow: 1.3,
  },
  { // last of it, from the tower
    sky: ['#1d2340', '#e0894f'], fog: '#7a5c52', fogDensity: 0.0013,
    sun: '#ffc072', sunAngle: 0.12, sunPower: 2.0, ambient: 0.7,
    motes: { colour: '#ffd08a', count: 480, size: 0.26, fall: 0.5, drift: 2.2 },
    water: '#3a3b58', stars: 0.5, glow: 1.6,
  },
];

const glowTexture = (() => {
  let tex: THREE.Texture | null = null;
  return () => {
    if (tex) return tex;
    const c = document.createElement('canvas');
    c.width = 128;
    c.height = 128;
    const g = c.getContext('2d')!;
    const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.18, 'rgba(255,240,205,0.75)');
    grad.addColorStop(0.5, 'rgba(255,215,150,0.2)');
    grad.addColorStop(1, 'rgba(255,200,120,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    tex = new THREE.CanvasTexture(c);
    return tex;
  };
})();

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

export interface WorldOptions {
  /** Drop the shadow map and some particles on a machine that needs it. */
  quality?: 'high' | 'low';
  /** Which term to open on. */
  term?: number;
}

export class World {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;

  private sun: THREE.DirectionalLight;
  private fill: THREE.DirectionalLight;
  private bounce: THREE.DirectionalLight;
  private hemi: THREE.HemisphereLight;
  private skyMat: THREE.ShaderMaterial;
  private waterMat: THREE.ShaderMaterial;
  private motes: THREE.Points;
  private moteMat: THREE.PointsMaterial;
  private stars: THREE.Points;
  private clouds: THREE.Group;
  private glows: THREE.Group;
  private stairs: THREE.Group[] = [];

  private t = 0;
  private term = 0;
  private weather = TERM_WEATHER[0]!;
  private blend = { from: TERM_WEATHER[0]!, k: 1 };

  /** The camera is carried between landmarks, and can be pushed about by hand. */
  private rig = {
    from: new THREE.Vector3(), to: new THREE.Vector3(),
    lookFrom: new THREE.Vector3(), lookTo: new THREE.Vector3(),
    k: 1, orbit: 0, pitch: 0, dolly: 0,
  };

  readonly bricks: number;

  constructor(canvas: HTMLCanvasElement, opts: WorldOptions = {}) {
    const low = opts.quality === 'low';
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: !low, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(low ? 1 : 1.6, window.devicePixelRatio || 1));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.camera = new THREE.PerspectiveCamera(46, 1, 0.8, 4200);
    this.scene.fog = new THREE.FogExp2(0x1b2544, 0.004);

    // ── sky: one big inverted sphere with a gradient on it
    this.skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        low: { value: new THREE.Color('#0c1430') },
        high: { value: new THREE.Color('#26355c') },
      },
      vertexShader: `
        varying vec3 vPos;
        void main() {
          vPos = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: `
        uniform vec3 low; uniform vec3 high; varying vec3 vPos;
        void main() {
          // high is the horizon and low is the zenith, which is the way round
          // a sky actually is: warm and pale where it meets the ground, deep
          // overhead. Mixed the other way a sunset comes out as an orange
          // ceiling over a purple floor.
          float h = clamp(normalize(vPos).y, -0.2, 1.0);
          gl_FragColor = vec4(mix(high, low, pow(max(h, 0.0), 0.55)), 1.0);
          // A raw ShaderMaterial writes whatever it is given straight to the
          // framebuffer. Every colour handed in has already been converted to
          // linear on the way into the uniform, so without these two the sky
          // is displayed as though linear values were sRGB ones: a sunset
          // comes out as dull slate and the whole scene reads a stop dark.
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });
    const sky = new THREE.Mesh(new THREE.SphereGeometry(2400, 48, 28), this.skyMat);
    sky.frustumCulled = false;
    this.scene.add(sky);

    // ── light
    this.hemi = new THREE.HemisphereLight(0xdfe9f5, 0x5c5c54, 0.6);
    this.scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight(0xfff0d8, 2);
    this.sun.castShadow = !low;
    this.sun.shadow.mapSize.set(low ? 1024 : 2048, low ? 1024 : 2048);
    const cam = this.sun.shadow.camera;
    cam.left = -150; cam.right = 150; cam.top = 150; cam.bottom = -150;
    cam.near = 1; cam.far = 520;
    this.sun.shadow.bias = -0.0012;
    this.sun.shadow.normalBias = 0.5;
    this.scene.add(this.sun, this.sun.target);
    /*
      A fill from the other side, with no shadow.

      A single key light and a hemisphere is how the first pass looked, and the
      unlit face of every tower came out as pure black — a castle at night is
      dark, not absent. The fill is a quarter of the key and comes from behind
      and low, which lifts the shadow side off the floor without flattening the
      form.
    */
    this.fill = new THREE.DirectionalLight(0x8fa6c8, 0.55);
    this.fill.position.set(-180, 90, -140);
    this.scene.add(this.fill);
    /*
      And a bounce up off the lake, from the opposite quarter again.

      Three lights sounds like a lot for one castle, but the arrangement is
      the ordinary one: key, fill, and something coming back off the ground.
      With only the first two there is still a wedge of the building — the
      north-east faces — that nothing reaches, and at night that wedge goes to
      four-four-four, which is not dark, it is a hole.
    */
    this.bounce = new THREE.DirectionalLight(0x6f8bb0, 0.4);
    this.bounce.position.set(150, 40, 190);
    this.scene.add(this.bounce);

    // ── the castle
    const kit: Bricks = buildCastle();
    this.bricks = kit.count;
    const material = new THREE.MeshLambertMaterial({ vertexColors: false });
    const group = kit.build(material);
    this.scene.add(group);

    // ── the lake
    this.waterMat = new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        t: { value: 0 },
        tint: { value: new THREE.Color('#16233f') },
        sky: { value: new THREE.Color('#26355c') },
        fogColor: { value: new THREE.Color('#1b2544') },
        fogDensity: { value: 0.004 },
      },
      vertexShader: `
        varying vec2 vUv; varying vec3 vW;
        void main() {
          vUv = uv;
          vec4 w = modelMatrix * vec4(position, 1.0);
          vW = w.xyz;
          gl_Position = projectionMatrix * viewMatrix * w;
        }`,
      fragmentShader: `
        uniform float t; uniform vec3 tint; uniform vec3 sky;
        uniform vec3 fogColor; uniform float fogDensity;
        varying vec2 vUv; varying vec3 vW;
        void main() {
          // Three crossing wave trains, which is enough to stop it reading as
          // a sheet of plastic without paying for a normal map.
          float w = sin(vW.x * 0.42 + t * 1.6) * 0.5
                  + sin(vW.z * 0.57 - t * 2.1) * 0.3
                  + sin((vW.x + vW.z) * 0.23 + t * 0.9) * 0.2;
          float glint = smoothstep(0.62, 1.0, w);
          vec3 c = mix(tint, sky, 0.22 + glint * 0.42);
          /*
            And then fade the whole plane into the fog with distance.

            The lake is three thousand studs across so that its edge is never
            in shot; without this it stays perfectly crisp all the way out and
            you can see exactly where it stops, which is worse than a small
            lake. The falloff is the same exponential the scene fog uses.
          */
          float dist = length(vW - cameraPosition);
          float f = 1.0 - exp(-pow(dist * fogDensity, 2.0));
          // Toward the sky rather than toward the fog: a lake at a grazing
          // angle is a mirror, so the far water should be the colour of the
          // horizon. Faded into the fog colour instead it came out as a
          // hundred yards of wet mud in every direction.
          c = mix(c, mix(fogColor, sky, 0.62), clamp(f, 0.0, 1.0));
          gl_FragColor = vec4(c, 0.94);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });
    const lake = new THREE.Mesh(new THREE.PlaneGeometry(3200, 3200, 1, 1), this.waterMat);
    lake.rotation.x = -Math.PI / 2;
    lake.position.set(0, -2.1 * BRICK, 0);
    lake.receiveShadow = false;
    this.scene.add(lake);

    // ── the glows: one additive billboard at every light in the building
    this.glows = new THREE.Group();
    this.scene.add(this.glows);
    this.addGlows();

    // ── falling things
    const moteGeo = new THREE.BufferGeometry();
    const N = 2400;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 320;
      pos[i * 3 + 1] = Math.random() * 140;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 320;
    }
    moteGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.moteMat = new THREE.PointsMaterial({
      color: 0xffffff, size: 0.6, transparent: true, opacity: 0.4,
      depthWrite: false, sizeAttenuation: true, map: glowTexture(), blending: THREE.AdditiveBlending,
    });
    this.motes = new THREE.Points(moteGeo, this.moteMat);
    this.motes.frustumCulled = false;
    this.scene.add(this.motes);

    /*
      ── cloud

      Eighteen soft billboards standing in a ring at the edge of the world.

      The aerial shot ends on two hundred degrees of empty gradient otherwise,
      and a gradient is not a sky. They are far enough out (six hundred to
      eleven hundred studs) that they never move against the castle, they take
      the weather's horizon colour, and they cost eighteen quads.
    */
    this.clouds = new THREE.Group();
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2 + Math.random() * 0.3;
      const r = 620 + Math.random() * 480;
      const m = new THREE.Sprite(new THREE.SpriteMaterial({
        map: glowTexture(), color: 0xffffff, transparent: true,
        depthWrite: false, opacity: 0.5, blending: THREE.NormalBlending,
      }));
      m.scale.set(220 + Math.random() * 260, 70 + Math.random() * 60, 1);
      m.position.set(Math.cos(a) * r, 46 + Math.random() * 150, Math.sin(a) * r);
      this.clouds.add(m);
    }
    this.scene.add(this.clouds);

    // ── stars
    const starGeo = new THREE.BufferGeometry();
    const S = 700;
    const sp = new Float32Array(S * 3);
    for (let i = 0; i < S; i++) {
      const v = new THREE.Vector3().randomDirection().multiplyScalar(1900);
      if (v.y < 20) v.y = Math.abs(v.y) + 20;
      sp.set([v.x, v.y, v.z], i * 3);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
    this.stars = new THREE.Points(starGeo, new THREE.PointsMaterial({
      color: 0xdfe8ff, size: 9, transparent: true, opacity: 0, depthWrite: false,
      blending: THREE.AdditiveBlending, map: glowTexture(),
    }));
    this.stars.frustumCulled = false;
    this.scene.add(this.stars);

    this.addStairs();
    this.term = Math.max(0, Math.min(TERM_WEATHER.length - 1, opts.term ?? 0));
    this.weather = TERM_WEATHER[this.term]!;
    this.blend = { from: this.weather, k: 1 };
    this.goTo(this.term, true);
  }

  /**
   * A billboard at every window, candle and lamp.
   *
   * This is the bloom. Placed by hand off the plan rather than found by
   * scanning the geometry, so a glow can be given a size and a colour that
   * suits what it is: a hall window is wide and warm, a tower window is small,
   * the clock face is gold and does not flicker.
   */
  private addGlows() {
    const add = (x: number, y: number, z: number, size: number, colour: string, flicker = 0) => {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({
        map: glowTexture(), color: new THREE.Color(colour),
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.9,
      }));
      s.scale.setScalar(size);
      s.position.set(x * STUD, y * BRICK, z * STUD);
      s.userData.flicker = flicker;
      s.userData.base = size;
      this.glows.add(s);
    };

    // The hall's long windows, both sides.
    for (let i = 7; i < 48; i += 7) {
      add(-34 + i, 13, -16, 16, '#ffcf82', 0.25);
      add(-34 + i, 13, 10, 16, '#ffcf82', 0.25);
    }
    add(-34, 16, -3, 26, '#ffd89a', 0.1);                       // the rose window
    // Floating candles above the hall floor.
    for (let i = 0; i < 26; i++) {
      const x = -30 + (i % 9) * 6;
      const z = -12 + Math.floor(i / 9) * 7;
      add(x, 17 + (i % 4) * 1.6, z, 5.5, '#ffdda0', 1);
    }
    // The lamps in the three boats, and the one on the jetty.
    for (const [x, z] of [[-11, -75], [7, -92], [-31, -64], [-66, -55]] as const) {
      add(x, 1, z, 11, '#ffc472', 0.8);
    }

    // Tower windows.
    for (const [cx, cz, r, n] of [[-34, -16, 7, 34], [-34, 10, 7, 28], [20, -16, 8, 44], [30, 76, 6, 26]] as const) {
      for (let c = 6; c < n - 4; c += 5) {
        const a = c * 0.7;
        add(cx + Math.cos(a) * (r + 0.6), c, cz + Math.sin(a) * (r + 0.6), 7, '#ffcf82', 0.4);
      }
    }
    add(20, 42, -25, 24, '#ffd76a');                            // the clock
    // Lamps down the courtyard cloister.
    for (let i = 0; i < 40; i += 10) add(-14 + i, 12, 14, 9, '#ffc98a', 0.5);
    for (let i = 0; i < 40; i += 10) add(-14 + i, 12, 30, 9, '#ffc98a', 0.5);
    // The boathouse, and a lantern on the jetty.
    add(-49, 6, -47, 12, '#ffbe72', 0.6);
    add(-36, 3, -50, 8, '#ffbe72', 0.8);
  }

  /**
   * Four flights in the shaft, at four heights, each turning at its own rate.
   *
   * They are the one impossible thing in the building and they have to *look*
   * impossible, so none of the rates divide into each other — the arrangement
   * never repeats and there is never a moment when all four line up.
   */
  private addStairs() {
    const mat = new THREE.MeshLambertMaterial({ color: 0x8b8f96 });
    const rail = new THREE.MeshLambertMaterial({ color: 0x5c4a34 });
    for (let f = 0; f < 4; f++) {
      const g = new THREE.Group();
      const steps = 16;
      for (let s = 0; s < steps; s++) {
        // Kept inside a radius of fourteen: the flights used to run out to
        // twenty and pushed straight through the wall of the shaft.
        const m = new THREE.Mesh(new THREE.BoxGeometry(4 * STUD, 0.4 * BRICK, 1.6 * STUD), mat);
        m.position.set(3.5 + s * 0.62, s * 0.62 * BRICK, 0);
        m.castShadow = true;
        m.receiveShadow = true;
        g.add(m);
      }
      const r = new THREE.Mesh(new THREE.BoxGeometry(steps * 0.62 * STUD, 0.3 * BRICK, 0.4 * STUD), rail);
      r.position.set(3.5 + (steps * 0.62) / 2, steps * 0.31 * BRICK + 2, 1.1);
      r.castShadow = true;
      g.add(r);
      g.position.set(34 * STUD, (17 + f * 9) * BRICK, 6 * STUD);
      g.rotation.y = f * 1.3;
      g.userData.rate = 0.055 + f * 0.017;
      this.stairs.push(g);
      this.scene.add(g);
    }
  }

  /** Carry the camera to a landmark. */
  goTo(i: number, instant = false) {
    const t = TERMS[Math.max(0, Math.min(TERMS.length - 1, i))]!;
    this.rig.from.copy(instant ? new THREE.Vector3(...t.from) : this.camera.position);
    this.rig.lookFrom.copy(instant ? new THREE.Vector3(...t.look) : this.rig.lookTo);
    this.rig.to.set(t.from[0] * STUD, t.from[1] * BRICK, t.from[2] * STUD);
    this.rig.lookTo.set(t.look[0] * STUD, t.look[1] * BRICK, t.look[2] * STUD);
    this.rig.k = instant ? 1 : 0;
    this.rig.orbit = 0;
    this.rig.pitch = 0;
    this.rig.dolly = 0;
    if (instant) {
      this.camera.position.copy(this.rig.to);
      this.camera.lookAt(this.rig.lookTo);
    }
  }

  /** Change the term, and cross-fade the weather into it. */
  setTerm(i: number) {
    const next = Math.max(0, Math.min(TERM_WEATHER.length - 1, i));
    if (next === this.term) return;
    this.blend = { from: this.weather, k: 0 };
    this.term = next;
    this.goTo(next);
  }

  /** Drag to swing round the point the camera is looking at. */
  drag(dx: number, dy: number) {
    this.rig.orbit -= dx * 0.004;
    this.rig.pitch = Math.max(-0.7, Math.min(0.9, this.rig.pitch - dy * 0.003));
  }

  /** Wheel to move in and out along the view. */
  zoom(d: number) {
    this.rig.dolly = Math.max(-0.55, Math.min(1.6, this.rig.dolly + d * 0.0012));
  }

  resize(w: number, h: number) {
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  }

  private mix(a: Weather, b: Weather, k: number) {
    const c = new THREE.Color();
    const col = (x: string, y: string) => c.set(x).lerp(new THREE.Color(y), k).clone();
    this.skyMat.uniforms.low!.value = col(a.sky[0], b.sky[0]);
    this.skyMat.uniforms.high!.value = col(a.sky[1], b.sky[1]);
    const fog = this.scene.fog as THREE.FogExp2;
    fog.color = col(a.fog, b.fog);
    fog.density = lerp(a.fogDensity, b.fogDensity, k);
    /*
      Everything here is multiplied up by roughly pi.

      Three divides a light's intensity by pi before it reaches a Lambert
      surface, so the numbers that read like sensible exposures in the weather
      table land on screen about a third as bright as they look on the page.
      The table keeps the readable numbers and the scaling happens once, here.
    */
    const amb = lerp(a.ambient, b.ambient, k);
    this.sun.color = col(a.sun, b.sun);
    this.sun.intensity = lerp(a.sunPower, b.sunPower, k) * 2.2;
    this.hemi.intensity = amb * 2.8;
    this.fill.intensity = amb * 1.5;
    this.fill.color = col(a.sky[1], b.sky[1]);
    this.bounce.intensity = amb * 0.9;
    this.bounce.color = col(a.water, b.water);
    const ang = lerp(a.sunAngle, b.sunAngle, k);
    this.sun.position.set(SUN_UP.x, Math.sin(ang) * 1.1 + 0.18, SUN_UP.z)
      .normalize().multiplyScalar(260);
    this.sun.target.position.set(0, 10, 0);
    this.waterMat.uniforms.tint!.value = col(a.water, b.water);
    this.waterMat.uniforms.sky!.value = col(a.sky[1], b.sky[1]);
    this.waterMat.uniforms.fogColor!.value = (this.scene.fog as THREE.FogExp2).color;
    this.waterMat.uniforms.fogDensity!.value = (this.scene.fog as THREE.FogExp2).density * 0.55;
    this.moteMat.color = col(a.motes.colour, b.motes.colour);
    this.moteMat.size = lerp(a.motes.size, b.motes.size, k);
    (this.stars.material as THREE.PointsMaterial).opacity = lerp(a.stars, b.stars, k) * 0.9;
    // Lifted toward white, or the cloud is exactly the colour of the
    // horizon it is standing on and cannot be seen at all.
    const cloud = col(a.sky[1], b.sky[1]).lerp(new THREE.Color(0xffffff), 0.42);
    for (const c of this.clouds.children as THREE.Sprite[]) {
      (c.material as THREE.SpriteMaterial).color = cloud;
    }
    const count = Math.round(lerp(a.motes.count, b.motes.count, k));
    this.motes.geometry.setDrawRange(0, count);
    return { fall: lerp(a.motes.fall, b.motes.fall, k), drift: lerp(a.motes.drift, b.motes.drift, k), glow: lerp(a.glow, b.glow, k) };
  }

  /**
   * One frame.
   *
   * `dt` drives the things that should look the same at any frame rate and be
   * clamped hard against a stall — snow, staircases, flicker. `elapsed` is the
   * real time since the last frame and drives the two transitions, so a slow
   * machine takes the same four seconds to reach a landmark as a fast one
   * rather than the same four hundred frames.
   */
  step(dt: number, elapsed = dt) {
    this.t += dt;

    if (this.blend.k < 1) this.blend.k = Math.min(1, this.blend.k + elapsed * 0.7);
    this.weather = TERM_WEATHER[this.term]!;
    const m = this.mix(this.blend.from, this.weather, ease(this.blend.k));

    // Camera: carried to the landmark, then pushed about by hand.
    if (this.rig.k < 1) this.rig.k = Math.min(1, this.rig.k + elapsed * 0.42);
    const k = ease(this.rig.k);
    const look = new THREE.Vector3().lerpVectors(this.rig.lookFrom, this.rig.lookTo, k);
    const base = new THREE.Vector3().lerpVectors(this.rig.from, this.rig.to, k);
    const off = base.clone().sub(look);
    const radius = off.length() * (1 - this.rig.dolly * 0.55);
    let az = Math.atan2(off.z, off.x) + this.rig.orbit;
    const el = Math.asin(Math.max(-0.95, Math.min(0.95, off.y / off.length()))) + this.rig.pitch;
    // A very slow drift, so a still shot is never quite still.
    az += Math.sin(this.t * 0.07) * 0.012;
    this.camera.position.set(
      look.x + Math.cos(az) * Math.cos(el) * radius,
      Math.max(2, look.y + Math.sin(el) * radius),
      look.z + Math.sin(az) * Math.cos(el) * radius,
    );
    this.camera.lookAt(look);

    // The staircases.
    for (const g of this.stairs) g.rotation.y += dt * (g.userData.rate as number);

    // Candles breathe; windows hold steady.
    for (const s of this.glows.children as THREE.Sprite[]) {
      const f = s.userData.flicker as number;
      const base2 = s.userData.base as number;
      const k2 = f ? 1 + Math.sin(this.t * (2.1 + f * 3) + s.position.x) * 0.12 * f : 1;
      s.scale.setScalar(base2 * k2 * (0.6 + m.glow * 0.5));
      (s.material as THREE.SpriteMaterial).opacity = 0.25 + m.glow * 0.45;
    }

    // Falling things, wrapped round the camera so there is always weather
    // where you are and never any anywhere else.
    const p = this.motes.geometry.getAttribute('position') as THREE.BufferAttribute;
    const arr = p.array as Float32Array;
    /*
      They are respawned into a ring around the camera, never a box.

      These are sprites with size attenuation on: one that happens to land a
      stud from the lens covers a third of the screen. Falling from a fixed
      height they also all ended up below a camera standing on a tower, so the
      aerial shot had a clear sky and a carpet of enormous orange blobs lying
      on the lake. Holding them in a ring that follows the camera — never
      closer than eighteen studs, never far enough to be culled — fixes both.
    */
    const cx = this.camera.position.x;
    const cy = this.camera.position.y;
    const cz = this.camera.position.z;
    const respawn = (o: number) => {
      const a = Math.random() * Math.PI * 2;
      const r = 18 + Math.random() * 150;
      arr[o] = cx + Math.cos(a) * r;
      arr[o + 1] = cy + 30 + Math.random() * 50;
      arr[o + 2] = cz + Math.sin(a) * r;
    };
    /*
      And faded out as the camera pulls away from what it is looking at.

      Weather belongs to whoever is standing in it. On a close shot these are
      snow and embers in the air in front of you; on the shot from two hundred
      studs up they were a shower of orange confetti laid over the entire
      model, because the ring follows the camera and the camera had left the
      ground. Tied to the rig's radius they thin out as you climb.
    */
    const near = Math.max(0.1, Math.min(1, 1 - (radius - 90) / 190));
    this.moteMat.opacity = 0.42 * near;
    for (let i = 0; i < p.count; i++) {
      const o = i * 3;
      arr[o + 1]! -= m.fall * dt * 14;
      arr[o]! += Math.sin(this.t * 0.5 + i) * m.drift * dt * 2;
      const dx = arr[o]! - cx;
      const dz = arr[o + 2]! - cz;
      if (arr[o + 1]! < cy - 70 || dx * dx + dz * dz > 200 * 200) respawn(o);
    }
    p.needsUpdate = true;

    this.waterMat.uniforms.t!.value = this.t;
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.renderer.dispose();
    this.scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
    });
  }
}
