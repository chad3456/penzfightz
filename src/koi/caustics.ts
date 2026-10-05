import * as THREE from 'three';
import { SIM } from './pond';

/**
 * Light focused by the moving surface onto everything underwater: a drifting
 * cell network for the always-there shimmer, plus the ripple simulation's own
 * curvature, so every ring you make sweeps a bright ring across the floor.
 * Shared by the pond floor, the stones and the koi.
 */
export const causticUniforms = {
  uRipple: { value: null as THREE.Texture | null },
  uSimRect: { value: new THREE.Vector4(SIM.x0, SIM.z0, SIM.nx * SIM.dx, SIM.nz * SIM.dx) },
  uSimTexel: { value: new THREE.Vector2(1 / SIM.nx, 1 / SIM.nz) },
  uTime: { value: 0 },
  uCaus: { value: 1 },
  uSunDirC: { value: new THREE.Vector3(0.4, 0.85, 0.3) },
};

export const CAUSTIC_PARS = /* glsl */ `
uniform sampler2D uRipple; uniform vec4 uSimRect; uniform vec2 uSimTexel;
uniform float uTime; uniform float uCaus; uniform vec3 uSunDirC;
vec2 cHash(vec2 p){ p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3))); return fract(sin(p) * 43758.5453); }
// distance to the nearest cell border of a slowly churning Voronoi pattern
float cBorder(vec2 p, float t){
  vec2 i = floor(p), f = fract(p);
  float d1 = 8.0, d2 = 8.0;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec2 g = vec2(float(x), float(y));
    vec2 o = cHash(i + g);
    o = 0.5 + 0.42 * sin(t + 6.2831 * o);
    float d = length(g + o - f);
    if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) { d2 = d; }
  }
  return d2 - d1;
}
float causticAt(vec3 wp){
  float depth = max(0.0, -wp.y);
  // follow the sunlight down through the water (refracted, roughly)
  vec2 p = wp.xz - uSunDirC.xz / max(0.3, uSunDirC.y) * depth * 0.75;
  // warp the cells so the network wobbles like light, not like cracked mud
  vec2 q = p + 0.06 * vec2(sin(p.y * 7.0 + uTime * 1.3), cos(p.x * 6.0 - uTime * 1.1));
  float a = cBorder(q * 4.2 + vec2(uTime * 0.07, 0.0), uTime * 1.1);
  float b = cBorder(q * 5.7 - vec2(0.0, uTime * 0.06) + 7.3, uTime * 1.3 + 2.0);
  float net = pow(1.0 - smoothstep(0.0, 0.2, a), 3.0) * 0.75 + pow(1.0 - smoothstep(0.0, 0.17, b), 3.0) * 0.55;
  net += pow(1.0 - smoothstep(0.0, 0.2, max(a, b)), 3.0) * 0.6; // where the two cross, light pools
  net *= smoothstep(0.02, 0.25, depth);
  vec2 uv = (p - uSimRect.xy) / uSimRect.zw;
  float h = texture2D(uRipple, uv).r;
  float lap = texture2D(uRipple, uv + vec2(uSimTexel.x, 0.0)).r + texture2D(uRipple, uv - vec2(uSimTexel.x, 0.0)).r
            + texture2D(uRipple, uv + vec2(0.0, uSimTexel.y)).r + texture2D(uRipple, uv - vec2(0.0, uSimTexel.y)).r - 4.0 * h;
  float focus = clamp(-lap * 90.0 * min(1.0, depth * 2.0), -0.7, 2.5);
  return uCaus * (net * (1.0 - 0.5 * exp(-depth * 2.0)) * exp(-depth * 0.35) + focus);
}`;

/** Brighten only the sunlight that already reached the surface (so shadows stay shadows). */
export const CAUSTIC_APPLY = (wp: string) => /* glsl */ `
if (${wp}.y < 0.02) {
  float cz = causticAt(${wp});
  float att = exp(${wp}.y * 0.9);
  reflectedLight.directDiffuse *= max(0.0, (0.55 + cz) * att);
  reflectedLight.directSpecular *= max(0.0, (0.6 + cz * 0.6) * att);
}`;
