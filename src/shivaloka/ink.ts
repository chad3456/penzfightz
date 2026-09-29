import * as THREE from 'three';

/**
 * Ink and wash.
 *
 * The scene is drawn normally into a (linear) texture with its depth, then one
 * full-screen pass turns it into a brush painting on paper:
 *
 * - ink lines where depth or colour changes sharply (a Sobel filter on both),
 *   broken by noise so they read as a dry brush rather than a pen;
 * - the colour flattened a little and pulled towards the paper with distance,
 *   like washes that thin as they recede;
 * - paper grain and pigment granulation;
 * - the frame torn out of a sheet, the edge ragged with noise;
 * - a slight wobble in the lookups, so nothing is ruled.
 *
 * Objects are drawn with toon materials, so the light falls in two or three
 * flat bands before any of this happens.
 */
const VERT = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

const FRAG = /* glsl */ `
uniform sampler2D tColor;
uniform sampler2D tDepth;
uniform vec2 uRes;
uniform float uNear;
uniform float uFar;
uniform float uTime;
uniform vec3 uPaper;
uniform vec3 uInk;
uniform float uFogNear;
uniform float uFogFar;
uniform float uLine;
uniform float uFrame;
varying vec2 vUv;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
float fbm(vec2 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; } return v; }
float lin(float d) { float z = d * 2.0 - 1.0; return (2.0 * uNear * uFar) / (uFar + uNear - z * (uFar - uNear)); }
float lum(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }

void main() {
  vec2 uv = vUv;
  vec2 wob = (vec2(noise(uv * 9.0 + uTime * 0.03), noise(uv * 9.0 + 17.0 - uTime * 0.03)) - 0.5) * 0.003;
  vec2 px = 1.3 / uRes;
  vec2 u = uv + wob;
  // depth and colour, 3 x 3
  float d[9]; float l[9];
  int k = 0;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 o = u + vec2(float(i), float(j)) * px;
    d[k] = lin(texture2D(tDepth, o).r);
    l[k] = lum(texture2D(tColor, o).rgb);
    k++;
  }
  // depth: second differences, so a floor seen at a grazing angle stays clean
  // while silhouettes and creases ink up
  float lap = abs(d[3] + d[5] - 2.0 * d[4]) + abs(d[1] + d[7] - 2.0 * d[4])
            + 0.5 * (abs(d[0] + d[8] - 2.0 * d[4]) + abs(d[2] + d[6] - 2.0 * d[4]));
  float gxl = (l[2] + 2.0 * l[5] + l[8]) - (l[0] + 2.0 * l[3] + l[6]);
  float gyl = (l[6] + 2.0 * l[7] + l[8]) - (l[0] + 2.0 * l[1] + l[2]);
  float dc = d[4];
  float ed = lap / max(dc, 0.5);
  float el = length(vec2(gxl, gyl));
  float edge = smoothstep(0.012, 0.05, ed) + smoothstep(0.22, 0.55, el) * 0.55;
  edge *= 1.0 - 0.7 * smoothstep(uFogNear, uFogFar, dc);
  // a dry brush: the line breaks up
  edge *= 0.45 + 0.75 * noise(u * uRes / 7.0);
  edge = clamp(edge * uLine, 0.0, 1.0);

  vec3 col = texture2D(tColor, u).rgb;
  // wash: flatten a little, thin with distance
  float L = lum(col);
  col = mix(vec3(L), col, 0.88);
  col = floor(col * 7.0 + 0.5) / 7.0 * 0.35 + col * 0.65;
  float far = smoothstep(uFogNear, uFogFar, dc);
  col = mix(col, uPaper, far * 0.75);
  // where nothing was drawn, the paper
  float sky = step(0.9999, texture2D(tDepth, u).r);
  col = mix(col, uPaper * (0.96 + 0.04 * fbm(uv * 3.0)), sky);
  // pigment pooling and paper grain
  float gran = fbm(uv * uRes / 90.0);
  col *= 0.9 + 0.12 * gran;
  col *= 0.965 + 0.035 * noise(uv * uRes / 2.0);
  // ink
  col = mix(col, uInk, edge * 0.9);
  // the sheet, torn out
  float aspect = uRes.x / uRes.y;
  vec2 q = min(uv, 1.0 - uv) * vec2(aspect, 1.0);
  float border = min(q.x, q.y);
  float rag = (fbm(uv * vec2(38.0, 38.0) + 3.0) - 0.5) * 0.035;
  float inside = smoothstep(0.0, 0.006, border - uFrame - rag);
  vec3 outside = uPaper * (0.88 + 0.08 * fbm(uv * 6.0));
  col = mix(outside, col, inside);
  // a soft darker rim where the wash dried at the tear
  col *= 1.0 - 0.18 * (1.0 - smoothstep(0.0, 0.02, border - uFrame - rag)) * inside;
  // the target holds linear colour; write sRGB to the screen
  vec3 srgb = mix(col * 12.92, 1.055 * pow(max(col, vec3(0.0)), vec3(1.0 / 2.4)) - 0.055, step(vec3(0.0031308), col));
  gl_FragColor = vec4(srgb, 1.0);
}`;

export interface InkLook {
  paper: THREE.ColorRepresentation;
  ink: THREE.ColorRepresentation;
  fogNear: number;
  fogFar: number;
  line?: number;
  frame?: number;
}

export class Ink {
  target: THREE.WebGLRenderTarget;
  private quad: THREE.Mesh;
  private qscene = new THREE.Scene();
  private qcam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  mat: THREE.ShaderMaterial;

  constructor(public renderer: THREE.WebGLRenderer) {
    this.target = new THREE.WebGLRenderTarget(4, 4, { depthTexture: new THREE.DepthTexture(4, 4), samples: 0 });
    this.mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        tColor: { value: this.target.texture },
        tDepth: { value: this.target.depthTexture },
        uRes: { value: new THREE.Vector2(4, 4) },
        uNear: { value: 0.1 },
        uFar: { value: 200 },
        uTime: { value: 0 },
        uPaper: { value: new THREE.Color('#f1e9d8') },
        uInk: { value: new THREE.Color('#23201f') },
        uFogNear: { value: 20 },
        uFogFar: { value: 80 },
        uLine: { value: 1 },
        uFrame: { value: 0.03 },
      },
      depthTest: false,
      depthWrite: false,
    });
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.mat);
    this.qscene.add(this.quad);
  }

  look(l: InkLook) {
    const u = this.mat.uniforms;
    (u.uPaper!.value as THREE.Color).set(l.paper);
    (u.uInk!.value as THREE.Color).set(l.ink);
    u.uFogNear!.value = l.fogNear;
    u.uFogFar!.value = l.fogFar;
    u.uLine!.value = l.line ?? 1;
    u.uFrame!.value = l.frame ?? 0.03;
  }

  setSize(w: number, h: number, pr: number) {
    const W = Math.max(1, Math.floor(w * pr));
    const H = Math.max(1, Math.floor(h * pr));
    this.target.setSize(W, H);
    (this.mat.uniforms.uRes!.value as THREE.Vector2).set(W, H);
  }

  render(scene: THREE.Scene, camera: THREE.PerspectiveCamera, t: number) {
    const u = this.mat.uniforms;
    u.uNear!.value = camera.near;
    u.uFar!.value = camera.far;
    u.uTime!.value = t;
    this.renderer.setRenderTarget(this.target);
    this.renderer.render(scene, camera);
    this.renderer.setRenderTarget(null);
    this.renderer.render(this.qscene, this.qcam);
  }

  dispose() {
    this.target.dispose();
    this.mat.dispose();
  }
}

/** Toon materials fall in flat bands; one shared gradient for all of them. */
let ramp: THREE.DataTexture | null = null;
export function toonRamp() {
  if (ramp) return ramp;
  const data = new Uint8Array([90, 90, 90, 255, 170, 170, 170, 255, 235, 235, 235, 255, 255, 255, 255, 255]);
  ramp = new THREE.DataTexture(data, 4, 1, THREE.RGBAFormat);
  ramp.minFilter = ramp.magFilter = THREE.NearestFilter;
  ramp.needsUpdate = true;
  return ramp;
}
const toons = new Map<string, THREE.MeshToonMaterial>();
export function toon(color: THREE.ColorRepresentation, emissive?: THREE.ColorRepresentation, k = 1): THREE.MeshToonMaterial {
  const key = `${new THREE.Color(color).getHexString()}|${emissive ? new THREE.Color(emissive).getHexString() : ''}|${k}`;
  let m = toons.get(key);
  if (!m) {
    m = new THREE.MeshToonMaterial({ color, gradientMap: toonRamp() });
    if (emissive) { m.emissive = new THREE.Color(emissive); m.emissiveIntensity = k; }
    toons.set(key, m);
  }
  return m;
}
