import * as THREE from 'three';

/**
 * Two-tone "print" shading: every surface is either its lit colour or its
 * shadow colour, split by a slightly ragged terminator, with paper grain on
 * top. Light, fog and night glow are shared uniforms, so changing the time
 * of day updates every material at once.
 */

export const SHARED = {
  uLight: { value: new THREE.Vector3(-0.45, 0.8, 0.4).normalize() },
  uFogColor: { value: new THREE.Vector3(0.95, 0.94, 0.86) },
  uFogNear: { value: 600 },
  uFogFar: { value: 3200 },
  uNight: { value: 0 },
};

/** sRGB hex straight into a shader vec3 (the shaders write display colours directly). */
export function hex3(hex: string) {
  return new THREE.Vector3(parseInt(hex.slice(1, 3), 16) / 255, parseInt(hex.slice(3, 5), 16) / 255, parseInt(hex.slice(5, 7), 16) / 255);
}

export const PAL = {
  cream: '#f2f0db',
  skin: '#e0914f',
  skinLight: '#ecab72',
  teal: '#247684',
  tealDeep: '#174f5c',
  rust: '#c35b24',
  navy: '#0f2030',
  ink: '#001621',
  gold: '#d4b073',
  goldDark: '#6c6648',
  white: '#f6f2e2',
};

const vert = /* glsl */ `
varying vec3 vN;
varying vec3 vV;
varying float vDepth;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vN = normalize(normalMatrix * normal);
  vV = -mv.xyz;
  vDepth = -mv.z;
  gl_Position = projectionMatrix * mv;
}`;

const frag = /* glsl */ `
uniform vec3 uLit;
uniform vec3 uShade;
uniform vec3 uLight;
uniform vec3 uFogColor;
uniform float uFogNear;
uniform float uFogFar;
uniform float uEdge;
uniform float uGrain;
uniform float uRim;
uniform float uGlow;
uniform vec3 uGlowColor;
uniform float uNight;
uniform float uNightGlow;
varying vec3 vN;
varying vec3 vV;
varying float vDepth;
float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main() {
  vec3 N = normalize(vN);
  if (!gl_FrontFacing) N = -N;
  float ndl = dot(N, normalize((viewMatrix * vec4(uLight, 0.0)).xyz));
  float g = hash(floor(gl_FragCoord.xy)) - 0.5;
  float t = smoothstep(uEdge - 0.02, uEdge + 0.02, ndl + g * uGrain * 0.5);
  vec3 c = mix(uShade, uLit, t);
  vec3 V = normalize(vV);
  c += pow(1.0 - max(dot(N, V), 0.0), 3.0) * uRim * t * 0.25;
  c += g * uGrain * 0.1;
  c = mix(c, c * vec3(0.32, 0.38, 0.55), uNight * 0.75);
  c = mix(c, uGlowColor, max(uGlow, uNightGlow * uNight));
  float f = smoothstep(uFogNear, uFogFar, vDepth);
  gl_FragColor = vec4(mix(c, uFogColor, f), 1.0);
}`;

export type ToonOpts = { edge?: number; grain?: number; rim?: number; side?: THREE.Side; glow?: string; nightGlow?: number; name?: string };

export function toon(lit: string, shade: string, o: ToonOpts = {}) {
  const m = new THREE.ShaderMaterial({
    vertexShader: vert,
    fragmentShader: frag,
    side: o.side ?? THREE.FrontSide,
    uniforms: {
      ...SHARED,
      uLit: { value: hex3(lit) },
      uShade: { value: hex3(shade) },
      uEdge: { value: o.edge ?? 0.05 },
      uGrain: { value: o.grain ?? 0.09 },
      uRim: { value: o.rim ?? 0.6 },
      uGlow: { value: 0 },
      uGlowColor: { value: hex3(o.glow ?? '#ffd27a') },
      uNightGlow: { value: o.nightGlow ?? 0 },
    },
  });
  m.name = o.name ?? lit;
  // remembered so the model can be exported with plain PBR materials
  m.userData.lit = lit;
  m.userData.shade = shade;
  return m;
}
