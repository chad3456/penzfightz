import * as THREE from 'three';

/**
 * Tilt-shift, which is the whole look.
 *
 * Every aerial city image anyone has ever found beautiful — the Google Earth
 * obliques, the Cities: Skylines press shots, the model-village photographs
 * that started it — has one thing in common, and it is not the geometry. It is
 * that a band across the middle is sharp and everything above and below it is
 * not. The eye reads shallow depth of field as *closeness*, so a city blurred
 * top and bottom is read as a model on a table, and a model on a table is
 * something you feel you could pick up.
 *
 * Done properly as two separable passes rather than one cross-shaped kernel,
 * because at these radii a cross leaves visible spokes on every window
 * highlight, and windows are what this scene is mostly made of.
 *
 * The blur is scaled by the *vertical* screen position only, and biased so the
 * top of the frame — which is horizon and sky — blurs harder than the bottom.
 * That is not symmetric and should not be: the far distance is where haze
 * already lives, and letting the blur agree with the fog is what stops the two
 * effects fighting.
 */
export const TiltShift = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uDirection: { value: new THREE.Vector2(1, 0) },
    uResolution: { value: new THREE.Vector2(1, 1) },
    /** Where the sharp band sits, 0 at the top of the frame. */
    uFocus: { value: 0.66 },
    /** How tall the sharp band is. */
    uBand: { value: 0.38 },
    /** Maximum blur radius, in pixels. */
    uRadius: { value: 3.6 },
    /** How much harder the top blurs than the bottom. */
    uSkew: { value: 1.7 },
    /** Scaled by the camera: a diorama at the zoom where a diorama reads,
     *  and a sharp aerial photograph when you pull all the way out. */
    uAmount: { value: 0.4 },
  },
  vertexShader: `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`,
  fragmentShader: `
precision highp float;
varying vec2 vUv;
uniform sampler2D tDiffuse;
uniform vec2 uDirection;
uniform vec2 uResolution;
uniform float uFocus;
uniform float uBand;
uniform float uRadius;
uniform float uSkew;
uniform float uAmount;

void main() {
  float d = vUv.y - uFocus;
  float away = max(0.0, abs(d) - uBand) / max(1e-4, 1.0 - uBand);
  // Above the band (further away in an oblique view) gets the harder falloff.
  float weight = away * (d < 0.0 ? uSkew : 1.0);
  float r = clamp(weight, 0.0, 1.0);
  r = r * r * uRadius * uAmount;

  if (r < 0.35) { gl_FragColor = texture2D(tDiffuse, vUv); return; }

  vec2 step = uDirection / uResolution * r;
  // Nine taps on a gaussian. Enough at this radius, and the weights are the
  // binomial row so nothing has to be normalised at runtime.
  float w[5];
  w[0] = 0.2270270270; w[1] = 0.1945945946; w[2] = 0.1216216216;
  w[3] = 0.0540540541; w[4] = 0.0162162162;
  vec4 sum = texture2D(tDiffuse, vUv) * w[0];
  for (int i = 1; i < 5; i++) {
    vec2 o = step * float(i) * 1.35;
    sum += texture2D(tDiffuse, vUv + o) * w[i];
    sum += texture2D(tDiffuse, vUv - o) * w[i];
  }
  gl_FragColor = sum;
}`,
};

/**
 * The grade.
 *
 * ACES for the tone curve, then a very small amount of everything else: a lift
 * in the shadows towards blue, a pull in the highlights towards straw, a
 * saturation nudge, a vignette and one frame of grain. None of it is
 * individually visible and together it is the difference between a render and
 * a photograph of a model.
 */
export const Grade = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uTime: { value: 0 },
    /** Stops applied before the curve. Three's lights are photometric now:
     *  a 2.4 sun and a 0.3 sky already land above 1.0 on open ground, and
     *  ACES on top of that returns a very confident white. */
    uExposure: { value: 0.78 },
    uContrast: { value: 1.06 },
    uVignette: { value: 0.3 },
    uSaturation: { value: 1.14 },
    uLift: { value: new THREE.Color(0.022, 0.030, 0.048) },
    uGain: { value: new THREE.Color(1.02, 1.0, 0.965) },
    uGrain: { value: 0.018 },
  },
  vertexShader: `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`,
  fragmentShader: `
precision highp float;
varying vec2 vUv;
uniform sampler2D tDiffuse;
uniform float uTime;
uniform float uExposure;
uniform float uContrast;
uniform float uVignette;
uniform float uSaturation;
uniform vec3 uLift;
uniform vec3 uGain;
uniform float uGrain;

vec3 aces(vec3 x) {
  const float a = 2.51, b = 0.03, c = 2.43, d = 0.59, e = 0.14;
  return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
}

float hash(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }

void main() {
  vec3 c = texture2D(tDiffuse, vUv).rgb * uExposure;
  c = aces(c);
  // A gentle S about mid grey. Filmic curves are shoulder-heavy and leave a
  // landscape looking like weather rather than like a place.
  c = clamp((c - 0.5) * uContrast + 0.5, 0.0, 1.0);
  c = c * uGain + uLift * (1.0 - c);
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  c = mix(vec3(l), c, uSaturation);

  vec2 q = (vUv - 0.5) * vec2(1.0, 0.92);
  c *= 1.0 - uVignette * dot(q, q) * 1.6;

  c += (hash(vUv * 1024.0 + fract(uTime)) - 0.5) * uGrain;

  // Linear to sRGB, by hand and at the end.
  //
  // The composer's targets are linear and a ShaderPass writing to the canvas
  // does no conversion, so without this the picture goes to an sRGB screen
  // still in linear light: milky, flat, desaturated, and extremely convincing
  // as "the fog is too strong" or "the sky is wrong" for as long as you are
  // willing to keep adjusting the fog and the sky.
  c = mix(c * 12.92, 1.055 * pow(max(c, vec3(1e-5)), vec3(1.0 / 2.4)) - 0.055,
          step(vec3(0.0031308), c));
  gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
}`,
};
