import * as THREE from 'three';
import { SIM } from './pond';

/**
 * The surface: displaced by the ripple field, it refracts the pond floor
 * (rendered just before into its own buffer, with depth), absorbs light by
 * how much water each ray passes through, reflects the garden and sky by
 * Fresnel, and catches the sun in glints wherever the canopy lets it through.
 */
export function makeWater(low: boolean) {
  const W = SIM.nx * SIM.dx, D = SIM.nz * SIM.dx;
  const g = new THREE.PlaneGeometry(W, D, low ? SIM.nx / 2 : SIM.nx - 1, low ? SIM.nz / 2 : SIM.nz - 1);
  g.rotateX(-Math.PI / 2);
  g.translate(SIM.x0 + W / 2, 0, SIM.z0 + D / 2);
  const uniforms = {
    uRipple: { value: null as THREE.Texture | null },
    uSimRect: { value: new THREE.Vector4(SIM.x0, SIM.z0, W, D) },
    uTexel: { value: new THREE.Vector2(1 / SIM.nx, 1 / SIM.nz) },
    uDx: { value: SIM.dx },
    tRefr: { value: null as THREE.Texture | null },
    tDepth: { value: null as THREE.Texture | null },
    tRefl: { value: null as THREE.Texture | null },
    uHasRefl: { value: 0 },
    uReflMat: { value: new THREE.Matrix4() },
    uRes: { value: new THREE.Vector2(1, 1) },
    uNear: { value: 0.1 }, uFar: { value: 200 },
    uSunDir: { value: new THREE.Vector3(0.4, 0.8, 0.3).normalize() },
    uSunCol: { value: new THREE.Color(1, 0.95, 0.85) },
    uSkyZen: { value: new THREE.Color(0.3, 0.5, 0.8) },
    uSkyHor: { value: new THREE.Color(0.75, 0.82, 0.9) },
    uAbsorb: { value: new THREE.Vector3(0.62, 0.26, 0.36) },
    uScatter: { value: new THREE.Color(0.025, 0.06, 0.05) },
    uTime: { value: 0 },
    uBreeze: { value: 0.2 },
    uRain: { value: 0 },
    tCanopy: { value: null as THREE.Texture | null },
    uCanopyRect: { value: new THREE.Vector4(-17, -13, 34, 26) },
    uGlint: { value: 1 },
  };
  const m = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: /* glsl */ `
      uniform sampler2D uRipple; uniform vec4 uSimRect;
      varying vec3 vW;
      void main(){
        vec4 w = modelMatrix * vec4(position, 1.0);
        w.y += texture2D(uRipple, (w.xz - uSimRect.xy) / uSimRect.zw).r;
        vW = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D uRipple; uniform vec4 uSimRect; uniform vec2 uTexel; uniform float uDx;
      uniform sampler2D tRefr; uniform sampler2D tDepth; uniform sampler2D tRefl; uniform float uHasRefl; uniform mat4 uReflMat;
      uniform vec2 uRes; uniform float uNear; uniform float uFar;
      uniform vec3 uSunDir; uniform vec3 uSunCol; uniform vec3 uSkyZen; uniform vec3 uSkyHor;
      uniform vec3 uAbsorb; uniform vec3 uScatter;
      uniform float uTime; uniform float uBreeze; uniform float uRain; uniform float uGlint;
      uniform sampler2D tCanopy; uniform vec4 uCanopyRect;
      varying vec3 vW;

      float linDepth(float z){ float n = z * 2.0 - 1.0; return 2.0 * uNear * uFar / (uFar + uNear - n * (uFar - uNear)); }
      // small wind-driven wavelets layered over the simulated ripples
      // small wind-driven wavelets layered over the simulated ripples: many directions and
      // lengths, with a slow patchy envelope so they never line up into a grid
      float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
        float a = fract(sin(dot(i, vec2(127.1, 311.7))) * 43758.5), b = fract(sin(dot(i + vec2(1, 0), vec2(127.1, 311.7))) * 43758.5);
        float c = fract(sin(dot(i + vec2(0, 1), vec2(127.1, 311.7))) * 43758.5), d = fract(sin(dot(i + vec2(1, 1), vec2(127.1, 311.7))) * 43758.5);
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y); }
      vec2 wavelets(vec2 p){
        vec2 g = vec2(0.0);
        float t = uTime;
        for (int i = 0; i < 11; i++) {
          float fi = float(i);
          float a = fi * 2.399 + 0.3 + sin(fi * 7.1) * 0.4;
          vec2 d = vec2(cos(a), sin(a));
          float k = 5.0 + fi * 3.1 + fract(fi * 0.618) * 6.0;
          float w = sqrt(9.8 * k + 0.074 * k * k * k / 1.0) * 0.3;
          float env = vn(p * 0.45 + d * t * 0.08 + fi * 3.7);
          float amp = (0.0012 + uBreeze * 0.0055) / (1.0 + fi * 0.45) * (0.25 + 1.5 * env * env);
          g += d * k * amp * cos(dot(d, p) * k - t * w + fi * 1.7);
        }
        return g;
      }
      void main(){
        vec2 uv = (vW.xz - uSimRect.xy) / uSimRect.zw;
        float hl = texture2D(uRipple, uv - vec2(uTexel.x, 0.0)).r, hr = texture2D(uRipple, uv + vec2(uTexel.x, 0.0)).r;
        float hd = texture2D(uRipple, uv - vec2(0.0, uTexel.y)).r, hu = texture2D(uRipple, uv + vec2(0.0, uTexel.y)).r;
        vec2 g = vec2(hr - hl, hu - hd) / (2.0 * uDx) * 1.6;
        g += wavelets(vW.xz);
        vec3 N = normalize(vec3(-g.x, 1.0, -g.y));
        vec3 V = normalize(cameraPosition - vW);

        vec2 suv = gl_FragCoord.xy / uRes;
        float surf = linDepth(gl_FragCoord.z);
        float z0 = texture2D(tDepth, suv).r;
        float thick = z0 > 0.99999 ? 3.0 : max(0.0, linDepth(z0) - surf);
        // refraction: bend the view by the surface slope, more through deeper water
        vec2 ruv = suv + N.xz * vec2(1.0, -1.0) * 0.045 * clamp(thick * 1.4, 0.0, 1.0);
        float z1 = texture2D(tDepth, ruv).r;
        float rthick = linDepth(z1) - surf;
        if (z1 > 0.99999 || rthick < 0.0) { ruv = suv; rthick = thick; }
        vec3 refr = texture2D(tRefr, ruv).rgb;
        float path = clamp(rthick, 0.0, 6.0);
        vec3 col = refr * exp(-path * uAbsorb) + uScatter * (1.0 - exp(-path * 1.3));

        float lit = texture2D(tCanopy, (vW.xz - uCanopyRect.xy) / uCanopyRect.zw).r;
        // reflection: the garden and sky above, by Fresnel
        float cosT = clamp(dot(N, V), 0.0, 1.0);
        float F = 0.02 + 0.98 * pow(1.0 - cosT, 5.0);
        vec3 R = reflect(-V, N);
        vec3 refl = mix(uSkyHor, uSkyZen, pow(clamp(R.y, 0.0, 1.0), 0.6));
        if (uHasRefl > 0.5) {
          vec4 rc = uReflMat * vec4(vW.x + N.x * 0.35, 0.0, vW.z + N.z * 0.35, 1.0);
          refl = texture2D(tRefl, rc.xy / rc.w * 0.5 + 0.5).rgb;
        }
        col = mix(col, refl, F);
        // sun glints, hidden where the trees shade the water
        // glitter: a finer, faster layer of facets for the sun to break into sparkles
        vec2 fp = vW.xz * 34.0;
        vec2 fn = vec2(vn(fp + vec2(uTime * 2.1, 0.0)) - vn(fp * 1.31 - vec2(0.0, uTime * 1.7)), vn(fp.yx * 1.17 + uTime * 1.3) - vn(fp * 0.83 + 4.1)) * (0.12 + 0.08 * uBreeze);
        vec3 Ns = normalize(N + vec3(fn.x, 0.0, fn.y));
        vec3 H = normalize(uSunDir + V);
        float nh = max(dot(Ns, H), 0.0);
        float spec = pow(nh, 2600.0) * 80.0 + pow(max(dot(N, H), 0.0), 300.0) * 0.08;
        col += uSunCol * spec * (0.2 + 0.8 * min(1.0, F * 6.0)) * lit * uGlint * 0.25;
        // a bright thin meniscus where the water meets stone and pebble
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  const mesh = new THREE.Mesh(g, m);
  mesh.frustumCulled = false;
  return { mesh, uniforms };
}

/** Sky dome for reflections and low camera angles. */
export function makeSky() {
  const uniforms = {
    uZen: { value: new THREE.Color(0.3, 0.5, 0.8) },
    uHor: { value: new THREE.Color(0.75, 0.82, 0.9) },
    uSunDir: { value: new THREE.Vector3(0.4, 0.8, 0.3).normalize() },
    uSunCol: { value: new THREE.Color(1, 0.9, 0.7) },
    uStars: { value: 0 },
  };
  const m = new THREE.ShaderMaterial({
    uniforms, side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }',
    fragmentShader: /* glsl */ `
      uniform vec3 uZen; uniform vec3 uHor; uniform vec3 uSunDir; uniform vec3 uSunCol; uniform float uStars;
      varying vec3 vD;
      float h(vec3 p){ return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
      void main(){
        vec3 d = normalize(vD);
        float up = clamp(d.y, 0.0, 1.0);
        vec3 c = mix(uHor, uZen, pow(up, 0.55));
        float s = max(dot(d, uSunDir), 0.0);
        c += uSunCol * pow(s, 12.0) * 0.25;
        // a few soft clouds
        vec2 q = d.xz / max(0.15, d.y) * 0.8;
        float cl = smoothstep(0.55, 0.85, sin(q.x * 1.3 + 0.4) * sin(q.y * 1.7) * 0.5 + 0.5 + sin(q.x * 3.1 + q.y * 2.3) * 0.15);
        c = mix(c, mix(uHor, vec3(1.0), 0.6) * (0.6 + 0.4 * (1.0 - uStars)), cl * 0.35 * up);
        if (uStars > 0.0) {
          vec3 g = floor(d * 220.0);
          float st = step(0.9975, h(g)) * up * uStars;
          c += vec3(st) * 1.5;
        }
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(80, 32, 16), m);
  mesh.frustumCulled = false;
  return { mesh, uniforms };
}
