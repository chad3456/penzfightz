import * as THREE from 'three';
import { RES, SEA, WORLD } from './terrain';

/**
 * The bay.
 *
 * One plane at sea level, and everything interesting comes out of knowing how
 * deep the ground is under each pixel — which it does, because the terrain
 * hands its own height field over as a texture. That one input gives four
 * things that otherwise need four separate hacks:
 *
 * - **colour by depth.** Beer–Lambert again, as in the ink: the water absorbs
 *   red first, so a metre of it is green and twenty metres is the blue you
 *   actually see in a bay.
 * - **the shore line**, exactly where the terrain crosses zero, with no
 *   z-fighting and no decal, because it is computed rather than drawn.
 * - **foam**, banded on depth and pushed about by the same swell that moves
 *   the normals, so it breaks along the contour instead of ringing the island
 *   like a bath mat.
 * - **refraction that stops at the beach**, faded out in shallow water, which
 *   is what keeps the sand from smearing into the sea.
 *
 * The height texture is sampled with an explicit bilinear rather than by the
 * hardware, because it is a float texture with nearest filtering — linear
 * filtering of 32-bit floats is an extension, not core, and a shoreline that
 * only exists on some machines is worse than four taps.
 */

const VERT = `
varying vec3 vWorld;
varying vec2 vUvW;
void main() {
  vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
  vUvW = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const FRAG = `
precision highp float;
varying vec3 vWorld;
uniform sampler2D uHeight;
uniform vec3 uSun;
uniform vec3 uSunColour;
uniform vec3 uSky;
uniform float uTime;
uniform float uRes;
uniform float uWorld;
uniform float uDay;
uniform vec3 uFog;
uniform float uFogDensity;

float sampleH(vec2 xz) {
  vec2 f = (xz + uWorld * 0.5) / uWorld * uRes;
  f = clamp(f, vec2(0.0), vec2(uRes - 1.001));
  vec2 i = floor(f);
  vec2 t = f - i;
  float texel = 1.0 / (uRes + 1.0);
  vec2 uv = (i + 0.5) * texel;
  float a = texture2D(uHeight, uv).r;
  float b = texture2D(uHeight, uv + vec2(texel, 0.0)).r;
  float c = texture2D(uHeight, uv + vec2(0.0, texel)).r;
  float d = texture2D(uHeight, uv + vec2(texel, texel)).r;
  return mix(mix(a, b, t.x), mix(c, d, t.x), t.y);
}

// Three crossed gerstner-ish ripples. Cheap, and the point is only that the
// specular breaks up; nobody counts wave crests from eight hundred metres.
vec3 ripple(vec2 p, float t) {
  vec2 n = vec2(0.0);
  vec2 d1 = normalize(vec2(0.8, 0.6));
  vec2 d2 = normalize(vec2(-0.4, 0.9));
  vec2 d3 = normalize(vec2(0.95, -0.3));
  n += d1 * cos(dot(p, d1) * 0.09 + t * 1.1) * 0.05;
  n += d2 * cos(dot(p, d2) * 0.17 - t * 1.5) * 0.032;
  n += d3 * cos(dot(p, d3) * 0.41 + t * 2.3) * 0.014;
  return normalize(vec3(-n.x, 1.0, -n.y));
}

void main() {
  float ground = sampleH(vWorld.xz);
  float depth = max(0.0, -ground);
  if (ground > 0.02) discard;

  vec3 nrm = ripple(vWorld.xz, uTime);
  vec3 view = normalize(cameraPosition - vWorld);

  // Absorption. Red goes first; twenty metres of it is the colour of a bay.
  vec3 sigma = vec3(0.115, 0.042, 0.028);
  vec3 body = vec3(0.09, 0.24, 0.30) * exp(-depth * sigma * 1.4);
  vec3 shallow = vec3(0.36, 0.55, 0.52);
  vec3 col = mix(shallow, body, clamp(depth / 9.0, 0.0, 1.0));

  // The bottom, seen through it, fading out as the water deepens.
  float seen = exp(-depth * 0.22);
  col = mix(col, vec3(0.46, 0.42, 0.32) * (0.4 + 0.6 * uDay), seen * 0.5);

  float fres = pow(1.0 - max(0.0, dot(nrm, view)), 4.0);
  col = mix(col, uSky, clamp(fres * 0.86, 0.0, 0.9));

  vec3 h = normalize(uSun + view);
  float spec = pow(max(0.0, dot(nrm, h)), 260.0);
  col += uSunColour * spec * 2.6;
  // The glitter path: a second, much broader lobe, only towards the sun.
  col += uSunColour * pow(max(0.0, dot(nrm, h)), 24.0) * 0.09;

  // Foam. Banded on depth so it follows the contour, with the band edge pushed
  // by the swell so it advances and retreats instead of sitting still.
  float surge = sin(uTime * 0.9 + vWorld.x * 0.02 + vWorld.z * 0.017) * 0.5 + 0.5;
  float band = 1.0 - smoothstep(0.0, 1.1 + surge * 1.5, depth);
  float lace = smoothstep(0.35, 0.9, fract(depth * 1.6 - uTime * 0.25 + surge * 0.4));
  col = mix(col, vec3(0.93, 0.96, 0.98), band * (0.45 + 0.55 * lace) * 0.85);

  col *= 0.35 + uDay * 0.75;

  float d = length(cameraPosition - vWorld) * uFogDensity;
  col = mix(col, uFog, 1.0 - exp(-d * d));

  gl_FragColor = vec4(col, 1.0);
}
`;

export class Water {
  readonly mesh: THREE.Mesh;
  readonly material: THREE.ShaderMaterial;

  constructor(height: THREE.DataTexture) {
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uHeight: { value: height },
        uSun: { value: new THREE.Vector3(0.4, 0.6, 0.3) },
        uSunColour: { value: new THREE.Color(1, 0.95, 0.86) },
        uSky: { value: new THREE.Color(0.45, 0.62, 0.85) },
        uFog: { value: new THREE.Color(0.6, 0.7, 0.85) },
        uFogDensity: { value: 0.00034 },
        uTime: { value: 0 },
        uRes: { value: RES },
        uWorld: { value: WORLD },
        uDay: { value: 1 },
      },
      vertexShader: VERT,
      fragmentShader: FRAG,
    });
    // Generous overhang so the sea runs past the terrain to the horizon.
    const geo = new THREE.PlaneGeometry(WORLD * 3, WORLD * 3, 1, 1);
    geo.rotateX(-Math.PI / 2);
    this.mesh = new THREE.Mesh(geo, this.material);
    this.mesh.position.y = SEA;
    this.mesh.renderOrder = 1;
    this.mesh.matrixAutoUpdate = false;
    this.mesh.updateMatrix();
  }

  update(t: number) {
    this.material.uniforms.uTime.value = t;
  }
}
