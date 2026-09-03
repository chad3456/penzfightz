import * as THREE from 'three';

/**
 * Sky, sun, and the colour of the air.
 *
 * A single-scattering approximation rather than a gradient, because the whole
 * look of an aerial city shot is *distance haze* — the far hills going blue and
 * the near blocks staying warm — and that only reads if the sky, the fog and
 * the sunlight are all derived from the same sun position. Three separate
 * hand-picked colours will never agree at dawn.
 *
 * What is here is Rayleigh plus a Henyey–Greenstein Mie lobe, integrated
 * analytically against a flat-ish atmosphere. It is not physically calibrated
 * and does not pretend to be: it is the smallest model that gets the four
 * things a viewer actually checks — a blue zenith, a pale horizon, a warm sun
 * halo that grows enormous at low elevation, and a sky that goes orange at the
 * bottom before it goes dark.
 */

const VERT = `
varying vec3 vDir;
void main() {
  vDir = normalize((modelMatrix * vec4(position, 1.0)).xyz - cameraPosition);
  vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_Position = p.xyww;
}
`;

const FRAG = `
precision highp float;
varying vec3 vDir;
uniform vec3 uSun;
uniform float uTurbidity;
uniform float uExposure;

// Scattering coefficients at sea level, per metre.
const vec3 RAY = vec3(5.8e-6, 13.5e-6, 33.1e-6);
const float MIE = 21e-6;
// Scale heights: how much atmosphere there is straight up. Getting this wrong
// is the whole difference between a sky and a black dome — an early version
// used 560 km instead of 8.4, and exp(-23) is exactly as dark as it sounds.
const float H_RAY = 8400.0;
const float H_MIE = 1400.0;

float hg(float c, float g) {
  float g2 = g * g;
  return (1.0 - g2) / (4.0 * 3.14159265 * pow(max(1e-4, 1.0 + g2 - 2.0 * g * c), 1.5));
}

void main() {
  vec3 dir = normalize(vDir);
  float up = dir.y;
  float horizon = smoothstep(-0.12, 0.05, up);

  // Optical depth relative to the zenith, capped so the horizon stays finite.
  float depth = 1.0 / max(0.055, up * 0.945 + 0.055);
  float sunDepth = 1.0 / max(0.055, uSun.y * 0.945 + 0.055);

  vec3 betaR = RAY * H_RAY;
  float betaM = MIE * H_MIE * uTurbidity;
  vec3 betaE = betaR + betaM;

  float c = dot(dir, uSun);
  float rayPhase = 3.0 / (16.0 * 3.14159265) * (1.0 + c * c);
  float miePhase = hg(c, 0.76);

  // Single scattering through a uniform slab: what scatters in along the ray,
  // divided by what it costs to get there, times how much of the ray is left.
  vec3 T = exp(-betaE * depth);
  vec3 Tsun = exp(-betaE * sunDepth);
  vec3 inscatter = (betaR * rayPhase + betaM * miePhase) / betaE * (1.0 - T) * Tsun;
  vec3 col = inscatter * 24.0;

  // The disc, and the halo that swells as the sun drops and the Mie lobe
  // starts pointing at you through more and more air.
  float disc = smoothstep(0.99955, 0.99985, c);
  col += vec3(1.0, 0.9, 0.74) * disc * 55.0 * Tsun;

  vec3 below = vec3(0.11, 0.115, 0.125) * (0.35 + 0.65 * max(0.0, uSun.y));
  col = mix(below, col, horizon);

  col = vec3(1.0) - exp(-col * uExposure);
  gl_FragColor = vec4(col, 1.0);
}
`;

export class Sky {
  readonly mesh: THREE.Mesh;
  readonly sun = new THREE.DirectionalLight(0xffffff, 2.4);
  readonly ambient = new THREE.HemisphereLight(0xbcd3ea, 0x4a4436, 0.32);
  readonly material: THREE.ShaderMaterial;
  /** Unit vector towards the sun. */
  readonly dir = new THREE.Vector3(0.4, 0.6, 0.3).normalize();

  constructor() {
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uSun: { value: this.dir },
        uTurbidity: { value: 2.6 },
        uExposure: { value: 1.15 },
      },
      vertexShader: VERT,
      fragmentShader: FRAG,
      side: THREE.BackSide,
      depthWrite: false,
      depthTest: false,
      fog: false,
    });
    // Big, not unit. `gl_Position.xyww` forces the depth to the far plane
    // whatever the radius, but a radius-one sphere sitting on the camera is
    // inside the near plane and gets clipped out of existence — which is a
    // black sky that looks exactly like a broken scattering integral.
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(3000, 32, 16), this.material);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = -1000;

    this.sun.castShadow = true;
    const s = this.sun.shadow;
    s.mapSize.set(2048, 2048);
    s.camera.near = 200;
    s.camera.far = 3400;
    // A single tight cascade over the built area rather than one huge map: the
    // city lives in the middle 1,600 metres and nothing outside it needs a
    // crisp shadow.
    s.camera.left = -900;
    s.camera.right = 900;
    s.camera.top = 900;
    s.camera.bottom = -900;
    s.bias = -0.0007;
    s.normalBias = 1.4;
  }

  /**
   * Put the sun at an hour, and derive everything else from where it lands.
   *
   * Light colour, intensity, ambient and fog all come out of the same
   * elevation, because the failure everybody has seen is a scene where the sky
   * is sunset and the buildings are still lit at noon.
   */
  setHour(hour: number, scene: THREE.Scene) {
    const t = ((hour - 6) / 24) * Math.PI * 2;
    const elev = Math.sin(t);
    this.dir.set(Math.cos(t) * 0.82, elev, 0.42).normalize();
    this.material.uniforms.uSun.value = this.dir;

    const day = Math.max(0, elev);
    const low = Math.pow(1 - Math.min(1, Math.max(0, elev) / 0.32), 2);

    this.sun.position.copy(this.dir).multiplyScalar(2000);
    this.sun.target.position.set(0, 0, 0);
    this.sun.intensity = 2.5 * Math.pow(day, 0.55);
    this.sun.color.setRGB(
      1,
      1 - low * 0.34,
      1 - low * 0.66,
    );

    this.ambient.intensity = 0.12 + day * 0.28;
    this.ambient.color.setRGB(0.62 + day * 0.13, 0.72 + day * 0.1, 0.86 + day * 0.06);
    this.ambient.groundColor.setRGB(0.2 + day * 0.12, 0.19 + day * 0.11, 0.16 + day * 0.08);

    // Fog colour is the sky at the horizon, in the direction of the sun, which
    // is what makes the far hills sit *in* the picture rather than in front of
    // a backdrop.
    const f = scene.fog as THREE.FogExp2 | null;
    if (f) {
      const warm = new THREE.Color(0.86, 0.66, 0.5);
      const cool = new THREE.Color(0.62, 0.72, 0.86);
      const night = new THREE.Color(0.055, 0.07, 0.11);
      f.color.copy(cool).lerp(warm, low * 0.85).multiplyScalar(0.55 + day * 0.45);
      f.color.lerp(night, 1 - Math.min(1, day * 5));
      f.density = 0.00034 + (1 - day) * 0.00022;
    }
    this.material.uniforms.uExposure.value = 1.05 + day * 0.35;
    this.material.uniforms.uTurbidity.value = 2.2 + low * 2.4;
  }
}
