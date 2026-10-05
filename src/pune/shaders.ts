import * as THREE from 'three';

/**
 * Shared lighting for every custom material in the city: a sky/ground
 * hemisphere, the sun, distance haze, and a night factor that turns windows,
 * shop signs and street lamps on. One set of uniforms, shared by reference.
 */
export const U = {
  uSunDir: { value: new THREE.Vector3(0.4, 0.6, 0.3).normalize() },
  uSunCol: { value: new THREE.Color(1, 0.92, 0.8) },
  uSky: { value: new THREE.Color(0.55, 0.65, 0.8) },
  uGround: { value: new THREE.Color(0.35, 0.3, 0.25) },
  uFog: { value: new THREE.Color(0.75, 0.72, 0.68) },
  uFogNear: { value: 200 },
  uFogFar: { value: 1200 },
  uNight: { value: 0 },
  uTime: { value: 0 },
  uRain: { value: 0 },
  uSiesta: { value: 0 },
  uCam: { value: new THREE.Vector3() },
};

export const LIGHT_GLSL = /* glsl */ `
uniform vec3 uSunDir; uniform vec3 uSunCol; uniform vec3 uSky; uniform vec3 uGround;
uniform vec3 uFog; uniform float uFogNear; uniform float uFogFar; uniform float uNight; uniform float uTime; uniform float uRain; uniform vec3 uCam; uniform float uSiesta;
float hash12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float vnoise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(hash12(i),hash12(i+vec2(1,0)),f.x), mix(hash12(i+vec2(0,1)),hash12(i+vec2(1,1)),f.x), f.y); }
// colours are authored in display (sRGB-ish) terms; light in linear
vec3 L(vec3 c){ return c * c; }
vec3 shade(vec3 albedo, vec3 n, float ao){
  float hemi = n.y*0.5+0.5;
  vec3 amb = mix(L(uGround), L(uSky), hemi) * (0.55 + 0.25*ao);
  // at night the city is never dark: sodium lamps, shop lights, the glow off the haze
  amb += vec3(0.05, 0.042, 0.032) * uNight * (0.6 + 0.4 * hemi);
  float d = max(dot(n, uSunDir), 0.0);
  return L(albedo) * (amb + L(uSunCol) * d * ao * 1.6);
}
vec3 fogged(vec3 c, vec3 wp){
  float dist = length(wp - uCam);
  float f = smoothstep(uFogNear, uFogFar, dist);
  // a little height haze too: the plains are hazy, the hills poke out
  f = clamp(f + (1.0 - f) * 0.0, 0.0, 1.0);
  return mix(c, L(uFog), f);
}
`;

export const BUILDING_VS = /* glsl */ `
attribute vec3 color; attribute vec4 aInfo; // type, seed, front, kind
varying vec3 vCol; varying vec3 vN; varying vec3 vW; varying vec2 vUv; varying vec4 vInfo;
void main(){
  vCol = color; vN = normalize(normal); vUv = uv; vInfo = aInfo;
  vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

export const BUILDING_FS = /* glsl */ `
${LIGHT_GLSL}
varying vec3 vCol; varying vec3 vN; varying vec3 vW; varying vec2 vUv; varying vec4 vInfo;
void main(){
  float type = vInfo.x, seed = vInfo.y, front = vInfo.z, kind = vInfo.w;
  vec3 n = normalize(vN);
  vec3 col = vCol;
  vec3 emit = vec3(0.0);
  float ao = 1.0;
  if (kind < 0.5) {
    // ---- walls
    float u = vUv.x, v = vUv.y;
    float fl = type > 1.5 && type < 2.5 ? 2.9 : (type > 4.5 && type < 5.5 ? 99.0 : (type > 2.5 && type < 3.5 ? 3.8 : 3.1));
    float cw = type > 1.5 && type < 2.5 ? 2.2 : (type > 6.5 && type < 7.5 ? 2.6 : 3.3);
    if (type > 7.5 && type < 8.5) { fl = 99.0; }
    float fi = floor(v / fl), ci = floor(u / cw);
    vec2 c = vec2(fract(u / cw), fract(v / fl));
    // monsoon grime: dark streaks running down from every sill, worse low down
    float streak = vnoise(vec2(u * 1.7, seed * 40.0)) * vnoise(vec2(u * 0.35 + seed * 9.0, v * 0.05));
    col *= 1.0 - 0.28 * streak - 0.12 * (1.0 - smoothstep(0.0, 2.5, v));
    col *= 0.92 + 0.08 * vnoise(vec2(u * 0.2 + seed * 11.0, v * 0.2));
    ao = 0.55 + 0.45 * smoothstep(0.0, 2.2, v);
    bool shopFloor = front > 0.5 && v < 3.6;
    if (shopFloor) {
      // ground-floor shops: a rolling shutter or an open, lit counter
      float bay = floor(u / 3.4);
      float h = hash12(vec2(bay, seed * 97.0));
      // shutters down from one to four: the Puneri afternoon rest
      float open = step(0.3, h) * (1.0 - step(0.98, uNight * h)) * (1.0 - uSiesta * step(0.12, fract(h * 31.0)));
      vec3 shut = mix(vec3(0.45,0.47,0.5), vec3(0.32,0.42,0.55), step(0.6, h));
      shut *= 0.85 + 0.15 * step(0.5, fract(v * 6.0));
      vec3 inside = mix(vec3(0.95,0.85,0.6), vec3(0.85,0.95,1.0), step(0.5, fract(h * 7.0))) * (0.35 + 0.65 * fract(h * 13.0));
      float edge = step(0.06, fract(u / 3.4)) * step(fract(u / 3.4), 0.94) * step(v, 3.0);
      if (edge > 0.5) {
        col = open > 0.5 ? inside * 0.55 : shut;
        if (open > 0.5) emit += inside * (0.25 + 0.9 * uNight) * 0.9;
      }
    } else if (fl < 50.0 && v > 0.6) {
      float wx = smoothstep(0.18, 0.2, c.x) * (1.0 - smoothstep(0.78, 0.8, c.x));
      float wy = smoothstep(0.32, 0.34, c.y) * (1.0 - smoothstep(0.84, 0.86, c.y));
      float win = wx * wy;
      if (win > 0.01) {
        float h = hash12(vec2(ci * 1.3 + seed * 71.0, fi * 2.1 + seed * 13.0));
        vec3 glass = mix(vec3(0.16, 0.19, 0.22), uSky * 0.6, 0.35 + 0.3 * n.y);
        // some flats have a grille and a drying sari; most have curtains
        glass = mix(glass, vec3(0.5, 0.25, 0.2) * (0.6 + h), step(0.82, h) * 0.6);
        float lit = step(0.5, h) * uNight;
        vec3 lamp = mix(vec3(1.0, 0.78, 0.45), vec3(0.85, 0.95, 1.0), step(0.72, fract(h * 5.3)));
        col = mix(col, glass, win);
        emit += lamp * lit * win * 0.9;
      }
      // a sill and a chajja over each window row
      float sill = smoothstep(0.86, 0.87, c.y) * (1.0 - smoothstep(0.92, 0.93, c.y));
      col *= 1.0 - 0.25 * sill;
    }
    // wada wood: the old houses' timber bands
    if (type > 1.5 && type < 2.5) { float band = step(0.9, fract(v / fl)); col = mix(col, vec3(0.32, 0.2, 0.12), band * 0.85); }
  } else if (kind < 1.5) {
    // ---- flat roof: concrete, stained
    float s = vnoise(vW.xz * 0.15) * vnoise(vW.xz * 0.6 + seed * 10.0);
    col *= 0.85 - 0.3 * s;
  } else {
    // ---- pitched roof: Mangalore tiles
    float rows = step(0.5, fract(vUv.y * 3.0));
    col = mix(vec3(0.55, 0.24, 0.16), vec3(0.45, 0.2, 0.14), rows) * (0.8 + 0.3 * vnoise(vW.xz * 0.5));
  }
  vec3 lit = shade(col, n, ao);
  lit += L(emit);
  lit = mix(lit, lit * vec3(0.8, 0.85, 0.9), uRain * 0.5);
  gl_FragColor = vec4(fogged(lit, vW), 1.0);
  #include <colorspace_fragment>
}`;

export const ROAD_VS = /* glsl */ `
attribute vec2 aRoad; // class, width
varying vec2 vUv; varying vec3 vW; varying vec2 vRoad; varying vec3 vN;
void main(){
  vUv = uv; vRoad = aRoad; vN = normal;
  vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

export const ROAD_FS = /* glsl */ `
${LIGHT_GLSL}
varying vec2 vUv; varying vec3 vW; varying vec2 vRoad; varying vec3 vN;
void main(){
  float cls = vRoad.x, w = vRoad.y;
  float across = vUv.x;          // 0..1 left to right
  float along = vUv.y;           // metres
  float xm = (across - 0.5) * w; // metres from centre
  vec3 asphalt = vec3(0.24, 0.24, 0.25);
  if (cls >= 4.0) asphalt = vec3(0.3, 0.29, 0.28);
  float n = vnoise(vW.xz * 0.9) * 0.5 + vnoise(vW.xz * 0.13) * 0.5;
  vec3 col = asphalt * (0.85 + 0.3 * n);
  // tyre-polished wheel tracks and oil down the middle of each lane
  col *= 1.0 - 0.06 * smoothstep(0.4, 0.0, abs(fract(abs(xm) / 3.4) - 0.5));
  // potholes and patches: it is Pune after the monsoon
  float ph = vnoise(vW.xz * 0.35);
  col = mix(col, vec3(0.18, 0.17, 0.16), smoothstep(0.86, 0.9, ph) * 0.8);
  col = mix(col, asphalt * 1.25, smoothstep(0.7, 0.72, vnoise(vW.xz * 0.08 + 7.0)) * 0.35);
  // dusty margins
  float edge = smoothstep(w * 0.5 - 1.2, w * 0.5, abs(xm));
  col = mix(col, vec3(0.5, 0.44, 0.36), edge * 0.55 * step(cls, 9.5));
  if (cls <= 3.0 && w >= 8.0) {
    // centre: a dashed white line; on the big roads a solid one with a median kerb
    float dash = step(0.5, fract(along / 6.0));
    float centre = 1.0 - smoothstep(0.08, 0.13, abs(xm));
    if (cls <= 1.0 && w >= 13.0) {
      float med = 1.0 - smoothstep(0.35, 0.45, abs(xm));
      float stripe = step(0.5, fract(along / 1.2));
      col = mix(col, mix(vec3(0.85), vec3(0.12), stripe), med);
    } else {
      col = mix(col, vec3(0.85, 0.85, 0.8), centre * dash * 0.85);
    }
    float sideLine = (1.0 - smoothstep(0.06, 0.1, abs(abs(xm) - (w * 0.5 - 0.9))));
    col = mix(col, vec3(0.85, 0.8, 0.5), sideLine * 0.6 * step(cls, 2.0));
  }
  if (cls >= 9.5 && cls < 15.0) {
    // footpaths and lanes: paver blocks
    vec2 g = fract(vW.xz * vec2(2.0, 4.0));
    col = vec3(0.55, 0.5, 0.45) * (0.85 + 0.15 * step(0.1, g.x) * step(0.1, g.y)) * (0.85 + 0.3 * n);
  }
  if (cls > 15.5 && cls < 16.5) {
    // railway: ballast, sleepers, two rails
    col = vec3(0.42, 0.38, 0.35) * (0.7 + 0.5 * vnoise(vW.xz * 4.0));
    float sleeper = step(0.6, fract(along / 0.65)) * (1.0 - smoothstep(1.3, 1.4, abs(xm)));
    col = mix(col, vec3(0.3, 0.27, 0.24), sleeper);
    float rail = 1.0 - smoothstep(0.03, 0.06, abs(abs(xm) - 0.84));
    col = mix(col, vec3(0.65, 0.63, 0.6), rail);
  }
  // wet roads shine
  vec3 nn = normalize(vN);
  vec3 lit = shade(col, nn, 1.0);
  // pools of sodium light along the lit roads
  if (cls <= 3.0) {
    float pool = pow(max(0.0, 1.0 - abs(fract(along / 34.0) - 0.5) * 2.6), 2.0);
    lit += L(vec3(1.0, 0.72, 0.4)) * uNight * (0.12 + 0.35 * pool);
  }
  vec3 V = normalize(uCam - vW);
  vec3 H = normalize(V + uSunDir);
  lit += uRain * 0.35 * pow(max(dot(nn, H), 0.0), 40.0) * L(uSunCol);
  lit += uRain * 0.06 * L(uSky) * (1.0 - uNight * 0.7);
  gl_FragColor = vec4(fogged(lit, vW), 1.0);
  #include <colorspace_fragment>
}`;

export const SIMPLE_VS = /* glsl */ `
varying vec3 vCol; varying vec3 vN; varying vec3 vW;
void main(){
  vCol = color;
  vec4 p = vec4(position, 1.0);
  vec3 nn = normal;
  #ifdef USE_INSTANCING
    p = instanceMatrix * p;
    nn = mat3(instanceMatrix) * nn;
  #endif
  #ifdef USE_INSTANCING_COLOR
    vCol *= instanceColor;
  #endif
  vec4 w = modelMatrix * p; vW = w.xyz; vN = normalize(mat3(modelMatrix) * nn);
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

export const SIMPLE_FS = /* glsl */ `
${LIGHT_GLSL}
uniform float uEmit;
varying vec3 vCol; varying vec3 vN; varying vec3 vW;
void main(){
  vec3 lit = shade(vCol, normalize(vN), 1.0);
  lit += L(vCol) * uEmit;
  gl_FragColor = vec4(fogged(lit, vW), 1.0);
  #include <colorspace_fragment>
}`;

export function simpleMaterial(opts: { emit?: number; side?: THREE.Side; transparent?: boolean } = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { ...U, uEmit: { value: opts.emit ?? 0 } },
    vertexShader: SIMPLE_VS, fragmentShader: SIMPLE_FS, vertexColors: true, side: opts.side ?? THREE.FrontSide,
  });
}
