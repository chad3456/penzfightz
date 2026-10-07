/**
 * The jelly itself: one shader that makes everything in Jellynoor look set
 * rather than solid, and the springs that make it wobble.
 *
 * The look is faked rather than traced. Light wraps round the surface the way
 * it does through something translucent, a little of the sun bleeds through
 * the back of thin parts, the rim glows where the eye grazes the edge, and a
 * tight highlight sits on top like the shine on a set pudding. All of it is
 * opaque, which keeps the sorting honest and the frame rate high: jelly that
 * only looks see-through.
 *
 * The wobble is a vertex displacement. Each thing carries a little spring; a
 * footstep, a pluck or a slammed door kicks it, the spring rings and decays,
 * and the shader leans the top of the mesh about while the bottom stays put,
 * squashing and stretching as it goes.
 */
import * as THREE from 'three';

/* ───────── shared uniforms: one clock, one sun, one bank of mist ───────── */

export const U = {
  uTime: { value: 0 },
  uSunDir: { value: new THREE.Vector3(0.4, 0.8, 0.45).normalize() },
  uSunCol: { value: new THREE.Color('#fff2d8') },
  uSkyCol: { value: new THREE.Color('#bfe2ff') },
  uGndCol: { value: new THREE.Color('#7e9a63') },
  uFogCol: { value: new THREE.Color('#dfeaf2') },
  /** How fast the valley haze closes in. */
  uFogNear: { value: 26 },
  uFogFar: { value: 210 },
  /** Extra mist that pools low in the morning: amount, and how fast it thins with height. */
  uMist: { value: 1 },
  uMistFall: { value: 0.055 },
  /** How hard the hill wind is leaning on everything that grows. */
  uWind: { value: 0.26 },
  /** 0 in full day, 1 at midnight: what makes lit windows worth looking at. */
  uNight: { value: 0 },
};

/* ───────── the jelly colours of the hills ───────── */

export const JELLY = {
  leaf: '#2fae55',
  leafDeep: '#16823f',
  leafNew: '#8fdc55',
  sapling: '#a7e86b',
  grass: '#63c25f',
  grassDry: '#b6cf5c',
  earth: '#c98a5a',
  earthDeep: '#a26540',
  rock: '#9fb0c4',
  water: '#4fc3e8',
  milk: '#fff4e2',
  chai: '#c98040',
  rose: '#ff7fa8',
  berry: '#d8456f',
  plum: '#8b5fd6',
  orange: '#ff9a3c',
  mango: '#ffc63c',
  lemon: '#fbe55c',
  mint: '#67e8c3',
  sky: '#86cdf5',
  cream: '#ffe9c9',
  white: '#fdf7ef',
  tin: '#9cc0d4',
  tinRust: '#d2795c',
  wood: '#d9a066',
  woodDark: '#a9713f',
  brick: '#e07a5f',
  coal: '#4a3f52',
  marigold: '#ffb020',
} as const;

export type JellyColour = keyof typeof JELLY;

/* ───────── the shader ───────── */

const VERT = /* glsl */ `
  uniform float uTime;
  uniform vec2 uBounds;      // the mesh's own ymin, ymax, for leaning the top only
  uniform vec4 uJig;         // xz: lean, y: spin, w: squash
  uniform float uPhase;
  uniform float uGrow;
  uniform float uWind;
  uniform float uWindAmt;

  varying vec3 vN;
  varying vec3 vW;
  varying float vH;

  #ifdef JELLY_VCOL
    attribute vec3 aCol;
    attribute float aEmit;
    varying vec3 vCol;
    varying float vEmit;
  #endif

  #ifdef INSTANCED_JIG
    attribute vec4 aJig;     // per-instance lean and squash
    attribute float aPhase;
    attribute float aGrow;   // 0..1, how far an instance has grown in
  #endif
  #ifdef USE_INSTANCING_COLOR
    varying vec3 vIColour;
  #endif

  void main() {
    vec3 p = position;

    vec4 jig = uJig;
    float phase = uPhase;
    float grow = uGrow;
    #ifdef INSTANCED_JIG
      jig = aJig;
      phase = aPhase;
      grow = aGrow;
    #endif

    // how far up this vertex sits: the foot stays planted, the top swings
    float h = clamp((p.y - uBounds.x) / max(0.0001, uBounds.y - uBounds.x), 0.0, 1.0);
    float s = sin(uTime * 13.0 + phase);

    // grow in from a squashed blob, used when something is planted or spawned
    float g = clamp(grow, 0.0, 1.0);
    float pop = 1.0 + (1.0 - g) * 0.0;
    p.y = mix(uBounds.x, p.y, smoothstep(0.0, 1.0, g)) * pop;
    p.xz *= mix(0.35, 1.0, smoothstep(0.0, 1.0, g * 1.15));

    // the wobble proper: lean, twist and squash, all strongest at the top
    float lean = h * h;
    p.xz += jig.xz * s * lean;
    float tw = jig.y * s * lean;
    p.xz = mat2(cos(tw), -sin(tw), sin(tw), cos(tw)) * p.xz;
    float sq = jig.w * s;
    p.y += (p.y - uBounds.x) * sq;
    p.xz *= 1.0 - sq * 0.42;

    // the wind off the ridge, phased by where in the world the thing stands
    if (uWindAmt > 0.0001) {
      #ifdef USE_INSTANCING
        vec2 wpos = vec2(instanceMatrix[3].x, instanceMatrix[3].z);
      #else
        vec2 wpos = vec2(modelMatrix[3].x, modelMatrix[3].z);
      #endif
      float g = sin(uTime * 1.3 + wpos.x * 0.11 + wpos.y * 0.07)
              + 0.4 * sin(uTime * 2.7 + wpos.x * 0.23 - wpos.y * 0.19);
      p.xz += vec2(0.82, 0.57) * g * uWind * uWindAmt * lean;
    }

    vH = h;
    #ifdef JELLY_VCOL
      vCol = aCol;
      vEmit = aEmit;
    #endif

    vec4 wp;
    vec3 n;
    #ifdef USE_INSTANCING
      wp = modelMatrix * instanceMatrix * vec4(p, 1.0);
      n = mat3(instanceMatrix) * normal;
    #else
      wp = modelMatrix * vec4(p, 1.0);
      n = normal;
    #endif
    #ifdef USE_INSTANCING_COLOR
      vIColour = instanceColor;
    #endif

    vW = wp.xyz;
    vN = normalize(mat3(modelMatrix) * n);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const FRAG = /* glsl */ `

  uniform vec3 uSunDir;
  uniform vec3 uSunCol;
  uniform vec3 uSkyCol;
  uniform vec3 uGndCol;
  uniform vec3 uFogCol;
  uniform float uFogNear;
  uniform float uFogFar;
  uniform float uMist;
  uniform float uMistFall;

  uniform vec3 uColour;      // the colour at the foot
  uniform vec3 uColourTop;   // and at the crown, mixed up the height
  uniform float uGloss;
  uniform float uThick;      // how much sun bleeds through from behind
  uniform float uRim;
  uniform float uWrap;       // how far light wraps past the terminator
  uniform float uOpacity;
  uniform float uEmit;       // a glow over the whole object
  uniform float uEmitMul;    // how much of the painted-in glow is actually alight
  uniform float uNight;

  varying vec3 vN;
  varying vec3 vW;
  varying float vH;
  #ifdef USE_INSTANCING_COLOR
    varying vec3 vIColour;
  #endif
  #ifdef JELLY_VCOL
    varying vec3 vCol;
    varying float vEmit;
  #endif

  void main() {
    vec3 N = normalize(vN);
    if (!gl_FrontFacing) N = -N;
    vec3 V = normalize(cameraPosition - vW);
    vec3 L = normalize(uSunDir);

    #ifdef JELLY_VCOL
      // painted per vertex, with a little lift towards the crown
      vec3 base = vCol * uColour * mix(0.90, 1.08, vH);
      float emit = vEmit;
    #else
      vec3 base = mix(uColour, uColourTop, smoothstep(0.0, 1.0, vH));
      float emit = 0.0;
    #endif
    #ifdef USE_INSTANCING_COLOR
      base *= vIColour;
    #endif

    // light that wraps round the body rather than stopping at the terminator
    float nl = dot(N, L);
    float wrap = clamp((nl + uWrap) / (1.0 + uWrap), 0.0, 1.0);
    vec3 lit = base * wrap * wrap * uSunCol * 1.15;

    // sky above, bounce off the grass below
    float hemi = N.y * 0.5 + 0.5;
    lit += base * mix(uGndCol, uSkyCol, hemi) * 0.5;

    // sun coming through the back of the jelly
    float back = pow(max(dot(V, -L), 0.0), 2.5) * (0.35 + 0.65 * (1.0 - abs(nl)));
    lit += base * back * uThick * uSunCol * 1.5;

    // the glowing edge that says "this is set, not painted"
    float fres = pow(1.0 - max(dot(N, V), 0.0), 2.3);
    lit += mix(base, vec3(1.0), 0.5) * fres * uRim;

    // the shine on top
    vec3 H = normalize(L + V);
    float spec = pow(max(dot(N, H), 0.0), 70.0);
    lit += uSunCol * spec * uGloss;
    lit += base * (uEmit + emit * uEmitMul * (0.22 + uNight * 1.5));

    // valley haze, thicker in the hollows than on the ridges
    float d = length(vW - cameraPosition);
    float low = exp(-max(vW.y - 1.0, 0.0) * uMistFall);
    float f = smoothstep(uFogNear, uFogFar, d * (1.0 + uMist * low * 1.6));
    vec3 col = mix(lit, uFogCol, clamp(f, 0.0, 1.0));

    gl_FragColor = vec4(col, uOpacity);
    #include <colorspace_fragment>
  }
`;

export interface JellyOpts {
  colour?: string | THREE.Color;
  /** Colour at the top of the mesh; defaults to a touch lighter than the foot. */
  top?: string | THREE.Color;
  gloss?: number;
  thick?: number;
  rim?: number;
  wrap?: number;
  opacity?: number;
  emit?: number;
  /** Scales the glow painted into the geometry: 0 puts a lamp out. */
  emitMul?: number;
  /** How much the wind moves it: 0 for walls, 1 for a tea bush. */
  wind?: number;
  /** The mesh's own vertical extent, so the wobble knows what to lean. */
  bounds?: [number, number];
  instanced?: boolean;
  /** Read colour from the geometry's own aCol/aEmit attributes. */
  vcol?: boolean;
  /** Per-instance tint through InstancedMesh.setColorAt. */
  instanceColour?: boolean;
  side?: THREE.Side;
  depthWrite?: boolean;
}

export type JellyMaterial = THREE.ShaderMaterial & { jigKick: (x: number, z: number, squash: number, spin?: number) => void };

/** Build a jelly material. The shared uniforms stay shared, so one clock drives everything. */
export function jellyMaterial(o: JellyOpts = {}): JellyMaterial {
  const colour = new THREE.Color(o.colour ?? JELLY.rose);
  const top = o.top ? new THREE.Color(o.top) : colour.clone().lerp(new THREE.Color('#ffffff'), 0.16);
  const defines: Record<string, string> = {};
  if (o.instanced) defines.INSTANCED_JIG = '';
  if (o.vcol) defines.JELLY_VCOL = '';

  const m = new THREE.ShaderMaterial({
    defines,
    uniforms: {
      // shared, by reference
      uTime: U.uTime, uSunDir: U.uSunDir, uSunCol: U.uSunCol, uSkyCol: U.uSkyCol, uGndCol: U.uGndCol,
      uFogCol: U.uFogCol, uFogNear: U.uFogNear, uFogFar: U.uFogFar, uMist: U.uMist, uMistFall: U.uMistFall,
      // per material
      uColour: { value: colour },
      uColourTop: { value: top },
      uGloss: { value: o.gloss ?? 0.85 },
      uThick: { value: o.thick ?? 0.75 },
      uRim: { value: o.rim ?? 0.34 },
      uWrap: { value: o.wrap ?? 0.6 },
      uOpacity: { value: o.opacity ?? 1 },
      uEmit: { value: o.emit ?? 0 },
      uEmitMul: { value: o.emitMul ?? 1 },
      uNight: U.uNight,
      uWind: U.uWind,
      uWindAmt: { value: o.wind ?? 0 },
      uBounds: { value: new THREE.Vector2(o.bounds?.[0] ?? 0, o.bounds?.[1] ?? 1) },
      uJig: { value: new THREE.Vector4(0, 0, 0, 0) },
      uPhase: { value: Math.random() * 6.283 },
      uGrow: { value: 1 },
    },
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: (o.opacity ?? 1) < 1,
    depthWrite: o.depthWrite ?? true,
    side: o.side ?? THREE.FrontSide,
  }) as JellyMaterial;

  m.jigKick = (x, z, squash, spin = 0) => {
    const j = m.uniforms.uJig.value as THREE.Vector4;
    j.x += x; j.z += z; j.y += spin; j.w += squash;
  };
  return m;
}

/** Set the vertical extent a material leans about, after the geometry is known. */
export function setBounds(m: THREE.ShaderMaterial, geo: THREE.BufferGeometry) {
  geo.computeBoundingBox();
  const b = geo.boundingBox!;
  (m.uniforms.uBounds.value as THREE.Vector2).set(b.min.y, Math.max(b.min.y + 0.01, b.max.y));
}

/* ───────── springs ───────── */

/**
 * One wobble. Kick it and it rings: amplitude swings about zero and dies away,
 * which is what the shader reads as lean and squash.
 */
export class Spring {
  v = new THREE.Vector4(0, 0, 0, 0);   // current lean.x, spin, lean.z, squash
  private vel = new THREE.Vector4(0, 0, 0, 0);
  constructor(private stiff = 150, private damp = 7.5) {}

  kick(x: number, z: number, squash: number, spin = 0) {
    this.vel.x += x; this.vel.z += z; this.vel.w += squash; this.vel.y += spin;
  }
  step(dt: number) {
    const d = Math.min(dt, 0.05);
    const k = this.stiff, c = this.damp;
    const a = this.v, v = this.vel;
    v.x += (-k * a.x - c * v.x) * d; a.x += v.x * d;
    v.y += (-k * a.y - c * v.y) * d; a.y += v.y * d;
    v.z += (-k * a.z - c * v.z) * d; a.z += v.z * d;
    v.w += (-k * a.w - c * v.w) * d; a.w += v.w * d;
  }
  get resting() { return Math.abs(this.v.x) + Math.abs(this.v.z) + Math.abs(this.v.w) + Math.abs(this.v.y) < 0.0008; }
}

/** A material with its own spring, stepped together. */
export class Wobbler {
  spring = new Spring();
  constructor(public mat: JellyMaterial, stiff?: number, damp?: number) {
    if (stiff !== undefined) this.spring = new Spring(stiff, damp);
  }
  kick(x: number, z: number, squash: number, spin = 0) { this.spring.kick(x, z, squash, spin); }
  step(dt: number) {
    if (this.spring.resting) return;
    this.spring.step(dt);
    (this.mat.uniforms.uJig.value as THREE.Vector4).copy(this.spring.v);
  }
}

/**
 * A bank of springs for an InstancedMesh: one wobble per instance, written
 * into the aJig attribute. Only the ringing ones cost anything.
 */
export class JigBank {
  readonly jig: THREE.InstancedBufferAttribute;
  readonly phase: THREE.InstancedBufferAttribute;
  readonly grow: THREE.InstancedBufferAttribute;
  private amp: Float32Array;
  private vel: Float32Array;
  private live = new Set<number>();

  constructor(geo: THREE.BufferGeometry, public count: number, private stiff = 140, private damp = 7) {
    this.amp = new Float32Array(count * 4);
    this.vel = new Float32Array(count * 4);
    const jig = new Float32Array(count * 4);
    const phase = new Float32Array(count);
    const grow = new Float32Array(count);
    for (let i = 0; i < count; i++) { phase[i] = Math.random() * 6.283; grow[i] = 1; }
    this.jig = new THREE.InstancedBufferAttribute(jig, 4);
    this.phase = new THREE.InstancedBufferAttribute(phase, 1);
    this.grow = new THREE.InstancedBufferAttribute(grow, 1);
    this.jig.setUsage(THREE.DynamicDrawUsage);
    this.grow.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('aJig', this.jig);
    geo.setAttribute('aPhase', this.phase);
    geo.setAttribute('aGrow', this.grow);
  }

  kick(i: number, x: number, z: number, squash: number, spin = 0) {
    if (i < 0 || i >= this.count) return;
    const o = i * 4;
    this.vel[o] += x; this.vel[o + 1] += spin; this.vel[o + 2] += z; this.vel[o + 3] += squash;
    this.live.add(i);
  }
  setGrow(i: number, g: number) {
    if (i < 0 || i >= this.count) return;
    (this.grow.array as Float32Array)[i] = g;
    this.grow.needsUpdate = true;
  }
  step(dt: number) {
    if (!this.live.size) return;
    const d = Math.min(dt, 0.05), k = this.stiff, c = this.damp;
    const arr = this.jig.array as Float32Array;
    for (const i of this.live) {
      const o = i * 4;
      let rest = true;
      for (let j = 0; j < 4; j++) {
        const q = o + j;
        this.vel[q] += (-k * this.amp[q] - c * this.vel[q]) * d;
        this.amp[q] += this.vel[q] * d;
        arr[q] = this.amp[q];
        if (Math.abs(this.amp[q]) > 0.0008 || Math.abs(this.vel[q]) > 0.004) rest = false;
      }
      if (rest) { for (let j = 0; j < 4; j++) { arr[o + j] = 0; this.amp[o + j] = 0; this.vel[o + j] = 0; } this.live.delete(i); }
    }
    this.jig.needsUpdate = true;
  }
}

/* ───────── the shadow each thing drops ───────── */

/**
 * Blob shadows rather than a shadow map: a soft dark disc that lies on the
 * ground under every object. In a world of gummy toys it reads better than a
 * hard sun shadow, and it costs almost nothing.
 */
export function blobShadowMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: { uOpacity: { value: 0.3 } },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        #ifdef USE_INSTANCING
          gl_Position = projectionMatrix * viewMatrix * modelMatrix * instanceMatrix * vec4(position, 1.0);
        #else
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        #endif
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uOpacity;
      varying vec2 vUv;
      void main() {
        float d = length(vUv - 0.5) * 2.0;
        float a = (1.0 - smoothstep(0.35, 1.0, d)) * uOpacity;
        if (a < 0.005) discard;
        gl_FragColor = vec4(0.06, 0.10, 0.09, a);
      }
    `,
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
  });
}

/* ───────── the sky ───────── */

/** A big inverted sphere with a gradient and a sun disc painted on it. */
export function skyDome(radius: number): THREE.Mesh {
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTop: { value: new THREE.Color('#7cc5f2') },
      uMid: { value: new THREE.Color('#cfe9f7') },
      uBot: { value: new THREE.Color('#ffe7c8') },
      uSunDir: U.uSunDir, uSunCol: U.uSunCol,
    },
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uTop, uMid, uBot, uSunCol, uSunDir;
      varying vec3 vDir;
      void main() {
        vec3 d = normalize(vDir);
        float t = d.y * 0.5 + 0.5;
        vec3 c = mix(uBot, uMid, smoothstep(0.35, 0.56, t));
        c = mix(c, uTop, smoothstep(0.54, 0.92, t));
        float s = max(dot(d, normalize(uSunDir)), 0.0);
        c += uSunCol * pow(s, 220.0) * 1.4;           // the disc
        c += uSunCol * pow(s, 6.0) * 0.16;            // the glow round it
        gl_FragColor = vec4(c, 1.0);
        #include <colorspace_fragment>
      }
    `,
    side: THREE.BackSide,
    depthWrite: false,
  });
  const m = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 20), mat);
  m.renderOrder = -1000;
  m.frustumCulled = false;
  return m;
}

export type SkyMesh = THREE.Mesh & { material: THREE.ShaderMaterial };
