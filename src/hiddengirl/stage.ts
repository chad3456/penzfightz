import * as THREE from 'three';
import { canvas, rng, type Ctx, type Rng } from './paint';

/**
 * The stage: every scene is a diorama of painted cards standing one behind
 * another, and the camera flies into it as you scroll, the way the reference
 * film zooms from a whole valley down to one figure on a boardwalk. The
 * cards are painted once, on 2D canvases, and become textures; particles
 * (steam, flutter-bys, jellies, embers, stars) move between them; one last
 * pass lays the paper grain over everything and fades between scenes.
 */

export type V3 = [number, number, number];

export interface Key { u: number; pos: V3; look: V3 }

export interface LayerDef {
  name: string;
  /** Centre of the card in the world. */
  at: V3;
  /** Height in world units, and width : height. */
  h: number;
  aspect: number;
  /** Canvas height in pixels (width follows the aspect, capped). */
  px: number;
  draw: (g: Ctx, W: number, H: number, R: Rng) => void;
  /** Seen only between these scene positions (fading at the edges). */
  show?: [number, number];
  /** Move the card each frame. */
  anim?: (o: THREE.Object3D, t: number, u: number) => void;
  /** Lay the card down (a floor of water, a field): rotation about x. */
  rx?: number;
  /** Additive, for glows. */
  add?: boolean;
}

export type ParticleKind = 'steam' | 'flutter' | 'stars' | 'embers' | 'jelly' | 'lantern' | 'motes' | 'petals';

export interface ParticleDef {
  kind: ParticleKind;
  n: number;
  /** Where they start: [x0, y0, z0, x1, y1, z1]. */
  box: [number, number, number, number, number, number];
  colors: string[];
  size: number;
  show?: [number, number];
}

export interface SceneDef {
  id: string;
  paper: string;
  cam: Key[];
  layers: LayerDef[];
  particles?: ParticleDef[];
  /** Brightness flooding the frame, by scene position (the swelling sun). */
  white?: (u: number) => number;
}

const PVERT = /* glsl */ `
attribute vec3 aColor;
attribute vec4 aSeed;
uniform float uTime;
uniform float uPx;
uniform float uSize;
uniform int uKind;
uniform float uAlpha;
varying vec3 vColor;
varying float vA;
varying float vKind;
void main() {
  vec3 p = position;
  float t = uTime;
  float a = 1.0;
  float s = uSize * (0.6 + aSeed.y * 0.8);
  if (uKind == 0) { // steam: rises, swells, thins
    float k = fract(t * (0.08 + aSeed.x * 0.06) + aSeed.z);
    p.y += k * 6.0; p.x += sin(k * 6.0 + aSeed.w * 6.0) * 0.6 * k;
    s *= 0.6 + k * 2.2; a = smoothstep(0.0, 0.15, k) * (1.0 - k) * 0.55;
  } else if (uKind == 1) { // flutter-bys: loops in the air
    p.x += sin(t * (0.5 + aSeed.x) + aSeed.z * 6.3) * 1.8;
    p.y += sin(t * (0.9 + aSeed.y) + aSeed.w * 6.3) * 0.7;
    p.z += cos(t * (0.4 + aSeed.x) + aSeed.z * 6.3) * 1.2;
  } else if (uKind == 2) { // stars: twinkle
    a = 0.45 + 0.55 * abs(sin(t * (0.6 + aSeed.x * 2.0) + aSeed.z * 6.3));
  } else if (uKind == 3) { // embers: up from the fires
    float k = fract(t * (0.12 + aSeed.x * 0.1) + aSeed.z);
    p.y += k * 7.0; p.x += sin(k * 9.0 + aSeed.w * 6.0) * 0.5;
    a = (1.0 - k) * smoothstep(0.0, 0.1, k); s *= 1.0 - k * 0.6;
  } else if (uKind == 4) { // jellies: pulse and drift
    p.y += sin(t * 0.3 + aSeed.z * 6.3) * 0.5; p.x += sin(t * 0.2 + aSeed.w * 6.3) * 0.4;
    a = 0.35 + 0.65 * (0.5 + 0.5 * sin(t * (1.0 + aSeed.x) + aSeed.z * 6.3));
    s *= 0.8 + 0.3 * sin(t * 1.5 + aSeed.w * 6.3);
  } else if (uKind == 5) { // lanterns: sway
    p.x += sin(t * 0.8 + aSeed.z * 6.3) * 0.08;
    a = 0.8 + 0.2 * sin(t * 3.0 + aSeed.w * 6.3);
  } else if (uKind == 6) { // motes: slow drift
    p += vec3(sin(t * 0.1 + aSeed.z * 6.3), sin(t * 0.13 + aSeed.w * 6.3), 0.0) * 0.8;
    a = 0.5;
  } else { // petals: fall and turn
    float k = fract(t * (0.04 + aSeed.x * 0.03) + aSeed.z);
    p.y -= k * 10.0; p.x += sin(k * 12.0 + aSeed.w * 6.0) * 1.0;
    a = smoothstep(0.0, 0.1, k) * (1.0 - smoothstep(0.85, 1.0, k));
  }
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = clamp(s * uPx / -mv.z, 1.0, 256.0);
  vColor = aColor;
  vA = a * uAlpha;
  vKind = float(uKind);
}`;

const PFRAG = /* glsl */ `
varying vec3 vColor;
varying float vA;
varying float vKind;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  float m;
  if (vKind > 0.5 && vKind < 1.5) {
    // a six-winged flutter-by: three pairs of petals
    float ang = atan(c.y, c.x);
    float r = 0.5 * abs(cos(ang * 3.0));
    m = 1.0 - smoothstep(r - 0.08, r, d);
  } else if (vKind < 0.5 || vKind > 3.5 && vKind < 4.5) {
    m = pow(max(0.0, 1.0 - d * 2.0), 1.6); // soft puff / glow
  } else if (vKind > 6.5) {
    m = 1.0 - smoothstep(0.2, 0.3, length(c * vec2(1.0, 2.2)));
  } else {
    m = 1.0 - smoothstep(0.3, 0.5, d);
    m += pow(max(0.0, 1.0 - d * 2.0), 3.0) * 0.6;
  }
  if (m * vA < 0.01) discard;
  gl_FragColor = vec4(vColor, clamp(m * vA, 0.0, 1.0));
}`;

const KIND_ID: Record<ParticleKind, number> = { steam: 0, flutter: 1, stars: 2, embers: 3, jelly: 4, lantern: 5, motes: 6, petals: 7 };

const POST_FRAG = /* glsl */ `
uniform sampler2D tScene;
uniform vec2 uRes;
uniform float uTime;
uniform float uFade;
uniform vec3 uFadeCol;
uniform float uWhite;
uniform vec3 uPaper;
varying vec2 vUv;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main() {
  vec3 c = texture2D(tScene, vUv).rgb;
  // paper grain and a hint of print misregistration
  float g = hash(floor(vUv * uRes / 1.5));
  c *= 0.965 + 0.05 * g;
  // a faint warm vignette, like a board under a lamp
  vec2 q = vUv - 0.5;
  c = mix(c, c * vec3(0.96, 0.95, 0.9), smoothstep(0.35, 0.85, length(q * vec2(1.0, 1.2))));
  // the sun
  c = mix(c, vec3(1.0, 0.99, 0.94), clamp(uWhite, 0.0, 1.0));
  c = mix(c, uFadeCol, clamp(uFade, 0.0, 1.0));
  gl_FragColor = vec4(c, 1.0);
}`;

interface BuiltLayer { def: LayerDef; mesh: THREE.Mesh; tex: THREE.CanvasTexture }
interface BuiltParticles { def: ParticleDef; pts: THREE.Points; mat: THREE.ShaderMaterial }
interface Built { def: SceneDef; scene: THREE.Scene; layers: BuiltLayer[]; parts: BuiltParticles[] }

const smooth = (x: number) => x * x * (3 - 2 * x);

/** Camera along a path of keys, eased between each pair. */
export function camAt(keys: Key[], u: number): { pos: THREE.Vector3; look: THREE.Vector3 } {
  let i = 0;
  while (i < keys.length - 2 && u > keys[i + 1]!.u) i++;
  const a = keys[i]!, b = keys[Math.min(i + 1, keys.length - 1)]!;
  const k = b.u === a.u ? 0 : smooth(Math.max(0, Math.min(1, (u - a.u) / (b.u - a.u))));
  const lerp = (p: V3, q: V3) => new THREE.Vector3(p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k, p[2] + (q[2] - p[2]) * k);
  return { pos: lerp(a.pos, b.pos), look: lerp(a.look, b.look) };
}

export class Stage {
  renderer: THREE.WebGLRenderer;
  camera = new THREE.PerspectiveCamera(40, 1, 0.05, 400);
  private target: THREE.WebGLRenderTarget;
  private post: THREE.ShaderMaterial;
  private postScene = new THREE.Scene();
  private postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private built = new Map<string, Built>();
  private maxPx: number;
  private h = 1;
  private pr = 1;

  constructor(public canvasEl: HTMLCanvasElement, public low: boolean) {
    this.renderer = new THREE.WebGLRenderer({ canvas: canvasEl, antialias: true, powerPreference: 'high-performance' });
    this.pr = Math.min(window.devicePixelRatio || 1, low ? 1.5 : 2);
    this.renderer.setPixelRatio(this.pr);
    this.maxPx = low ? 2048 : Math.min(4096, this.renderer.capabilities.maxTextureSize);
    // ?tex=1024 caps the cards' resolution (for slow machines, and for tests)
    const cap = Number(new URLSearchParams(location.search).get('tex'));
    if (cap > 256) this.maxPx = Math.min(this.maxPx, cap);
    this.target = new THREE.WebGLRenderTarget(4, 4, { samples: low ? 0 : 4 });
    this.post = new THREE.ShaderMaterial({
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: POST_FRAG,
      uniforms: {
        tScene: { value: this.target.texture },
        uRes: { value: new THREE.Vector2(4, 4) },
        uTime: { value: 0 },
        uFade: { value: 0 },
        uFadeCol: { value: new THREE.Color('#f3f2ea') },
        uWhite: { value: 0 },
        uPaper: { value: new THREE.Color('#f3f2ea') },
      },
      depthTest: false,
      depthWrite: false,
    });
    this.postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.post));
  }

  resize(w: number, h: number) {
    this.h = h;
    this.renderer.setSize(w, h, false);
    this.target.setSize(Math.floor(w * this.pr), Math.floor(h * this.pr));
    (this.post.uniforms.uRes!.value as THREE.Vector2).set(w * this.pr, h * this.pr);
    this.camera.aspect = w / h;
    // on a tall phone, widen the lens so the sides of a picture survive
    this.camera.fov = w < h ? 52 : 40;
    this.camera.updateProjectionMatrix();
  }

  /** Paint a scene's cards (once) and keep it ready. */
  build(def: SceneDef) {
    const had = this.built.get(def.id);
    if (had) return had;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(def.paper);
    const layers: BuiltLayer[] = def.layers.map((L, i) => {
      let H = Math.min(L.px, this.maxPx);
      let W = H * L.aspect;
      if (W > this.maxPx) { W = this.maxPx; H = W / L.aspect; }
      const c = canvas(W, H);
      const g = c.getContext('2d')!;
      const t0 = performance.now();
      L.draw(g, c.width, c.height, rng(i * 7919 + def.id.length * 131 + 7));
      if (import.meta.env.DEV) console.debug(`[stage] ${def.id}/${L.name} ${c.width}x${c.height} ${(performance.now() - t0).toFixed(0)}ms`);
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      if (L.rx) tex.anisotropy = 4;
      const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false, blending: L.add ? THREE.AdditiveBlending : THREE.NormalBlending });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(L.h * L.aspect, L.h), mat);
      mesh.position.set(...L.at);
      if (L.rx) mesh.rotation.x = L.rx;
      mesh.renderOrder = Math.round(L.at[2] * 100) + 100000;
      mesh.userData.base = mesh.position.clone();
      scene.add(mesh);
      return { def: L, mesh, tex };
    });
    const parts: BuiltParticles[] = (def.particles ?? []).map((P, i) => {
      const R = rng(1000 + i * 17);
      const pos = new Float32Array(P.n * 3), col = new Float32Array(P.n * 3), seed = new Float32Array(P.n * 4);
      const [x0, y0, z0, x1, y1, z1] = P.box;
      const cc = P.colors.map((c) => new THREE.Color(c));
      for (let k = 0; k < P.n; k++) {
        pos.set([x0 + (x1 - x0) * R(), y0 + (y1 - y0) * R(), z0 + (z1 - z0) * R()], k * 3);
        const c = cc[Math.floor(R() * cc.length)]!;
        col.set([c.r, c.g, c.b], k * 3);
        seed.set([R(), R(), R(), R()], k * 4);
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
      geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));
      const mat = new THREE.ShaderMaterial({
        vertexShader: PVERT,
        fragmentShader: PFRAG,
        uniforms: { uTime: { value: 0 }, uPx: { value: 800 }, uSize: { value: P.size }, uKind: { value: KIND_ID[P.kind] }, uAlpha: { value: 1 } },
        transparent: true,
        depthWrite: false,
        blending: P.kind === 'steam' || P.kind === 'petals' || P.kind === 'flutter' ? THREE.NormalBlending : THREE.AdditiveBlending,
      });
      const pts = new THREE.Points(geo, mat);
      pts.frustumCulled = false;
      pts.renderOrder = 100000 + Math.round(((z0 + z1) / 2) * 100) + 1;
      scene.add(pts);
      return { def: P, pts, mat };
    });
    const b = { def, scene, layers, parts };
    this.built.set(def.id, b);
    return b;
  }

  /** Let go of every scene but these. */
  keep(ids: string[]) {
    for (const [id, b] of this.built) {
      if (ids.includes(id)) continue;
      for (const l of b.layers) { l.tex.dispose(); l.mesh.geometry.dispose(); (l.mesh.material as THREE.Material).dispose(); }
      for (const p of b.parts) { p.pts.geometry.dispose(); p.mat.dispose(); }
      this.built.delete(id);
    }
  }

  isBuilt(id: string) { return this.built.has(id); }

  /** Draw scene `def` at position u (0…1), with `fade` towards `fadeCol`. */
  render(def: SceneDef, u: number, t: number, fade: number, fadeCol = def.paper) {
    const b = this.build(def);
    const { pos, look } = camAt(def.cam, u);
    // a breath of drift so nothing is ever quite still
    pos.x += Math.sin(t * 0.21) * 0.06;
    pos.y += Math.sin(t * 0.17) * 0.04;
    this.camera.position.copy(pos);
    this.camera.lookAt(look);
    const vis = (s: [number, number] | undefined) => {
      if (!s) return 1;
      const e = 0.04;
      return Math.max(0, Math.min(1, (u - s[0] + e) / e, (s[1] + e - u) / e));
    };
    for (const l of b.layers) {
      const m = l.mesh.material as THREE.MeshBasicMaterial;
      if (l.def.anim) { l.mesh.position.copy(l.mesh.userData.base); l.def.anim(l.mesh, t, u); }
      // a standing card the camera is about to pass through melts away first
      const near = l.def.rx ? 1 : Math.max(0, Math.min(1, (pos.z - l.mesh.position.z - 0.5) / 2.5));
      const v = vis(l.def.show) * near;
      l.mesh.visible = v > 0.001;
      m.opacity = v;
    }
    for (const p of b.parts) {
      p.mat.uniforms.uTime!.value = t;
      p.mat.uniforms.uPx!.value = (this.h * this.pr) / (2 * Math.tan((this.camera.fov * Math.PI) / 360));
      const v = vis(p.def.show);
      p.mat.uniforms.uAlpha!.value = v;
      p.pts.visible = v > 0.001;
    }
    const U = this.post.uniforms;
    U.uTime!.value = t;
    U.uFade!.value = fade;
    (U.uFadeCol!.value as THREE.Color).set(fadeCol);
    U.uWhite!.value = def.white ? def.white(u) : 0;
    this.renderer.setRenderTarget(this.target);
    this.renderer.render(b.scene, this.camera);
    this.renderer.setRenderTarget(null);
    this.renderer.render(this.postScene, this.postCam);
  }

  dispose() {
    this.keep([]);
    this.target.dispose();
    this.post.dispose();
    this.renderer.dispose();
  }
}

/** Width of the view, in world units, at distance `d` (for sizing cards). */
export function viewH(d: number, fov = 52) { return 2 * d * Math.tan((fov * Math.PI) / 360); }
