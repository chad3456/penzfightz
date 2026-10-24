// GLSL for the aura renderer (WebGL2). Passes:
//   compose  video -> 9:16 frame (subject-following crop, or the whole frame in a band over a blurred fill)
//   down/blur  quarter- and eighth-size blurred copies, for bloom, glow, rays
//   look     one of the looks (see looks.ts for the order), plus the freeze-frame cut-out
//   final    beat punch, shake, RGB split, chromatic aberration, flash, letterbox

export const VERT = `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() { vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }`;

const MAP = `
uniform vec2 uSrcSize;
uniform vec2 uOutSize;
uniform int uMode;      // 0 crop, 1 fit
uniform float uCropX;   // subject centre, 0..1 across the source
vec2 coverUV(vec2 uv) {
  float sa = uSrcSize.x / uSrcSize.y, oa = uOutSize.x / uOutSize.y;
  if (sa > oa) { float cw = oa / sa; float x0 = clamp(uCropX - cw * 0.5, 0.0, 1.0 - cw); return vec2(x0 + uv.x * cw, uv.y); }
  float ch = sa / oa; return vec2(uv.x, 0.5 - ch * 0.5 + uv.y * ch);
}
vec2 toSrc(vec2 uv, out float inBand) {
  inBand = 1.0;
  if (uMode == 1) {
    float sa = uSrcSize.x / uSrcSize.y, oa = uOutSize.x / uOutSize.y;
    float bh = oa / sa;
    if (bh < 1.0) {
      float y0 = 0.5 - bh * 0.5;
      inBand = step(y0, uv.y) * step(uv.y, y0 + bh);
      return vec2(uv.x, (uv.y - y0) / bh);
    }
  }
  return coverUV(uv);
}`;

export const COMPOSE = `#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
uniform sampler2D uVideo;
${MAP}
void main() {
  float inb; vec2 s = toSrc(vUv, inb);
  vec3 c = texture(uVideo, s).rgb;
  if (uMode == 1 && inb < 0.5) c = textureLod(uVideo, coverUV(vUv), 5.5).rgb * 0.45;
  o = vec4(c, 1.0);
}`;

export const COPY = `#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
uniform sampler2D uTex;
uniform vec2 uTexel;
void main() { // 4-tap box: halves cleanly when downsampling
  vec3 c = texture(uTex, vUv + uTexel * vec2(-0.5, -0.5)).rgb + texture(uTex, vUv + uTexel * vec2(0.5, -0.5)).rgb
         + texture(uTex, vUv + uTexel * vec2(-0.5, 0.5)).rgb + texture(uTex, vUv + uTexel * vec2(0.5, 0.5)).rgb;
  o = vec4(c * 0.25, 1.0);
}`;

export const BLUR = `#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
uniform sampler2D uTex;
uniform vec2 uDir; // texel step along one axis
void main() {
  float w[5] = float[](0.227027, 0.1945946, 0.1216216, 0.054054, 0.016216);
  vec4 c = texture(uTex, vUv) * w[0];
  for (int i = 1; i < 5; i++) {
    float f = float(i) * 1.5;
    c += texture(uTex, vUv + uDir * f) * w[i];
    c += texture(uTex, vUv - uDir * f) * w[i];
  }
  o = c;
}`;

export const LOOK = `#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
uniform sampler2D uFrame, uBlur, uBlur2, uMask, uMaskN, uMaskW;
uniform int uLook;
uniform float uTime, uP, uPulse, uSeed, uFreeze, uHasMask, uFlashAdd;
uniform vec2 uRes;
${MAP}

float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float hash1(float x) { return fract(sin(x * 127.1) * 43758.5453); }
float lum(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }
vec3 curve(vec3 c, float k, float pv) { return clamp((c - pv) * k + pv, 0.0, 1.0); }
float curve1(float c, float k, float pv) { return clamp((c - pv) * k + pv, 0.0, 1.0); }
vec3 sat(vec3 c, float s) { float l = lum(c); return vec3(l) + (c - l) * s; }
vec3 split(vec3 c, vec3 sh, vec3 hi, float a) { float l = lum(c); return c * (1.0 - a) + c * mix(sh, hi, l) * 2.0 * a; }
vec3 duo(vec3 c, vec3 d, vec3 l, float g) { return mix(d, l, pow(clamp(lum(c), 0.0, 1.0), g)); }
vec3 screen(vec3 a, vec3 b) { return 1.0 - (1.0 - a) * (1.0 - b); }
vec3 bloom(vec2 uv, float thr) { vec3 b = texture(uBlur, uv).rgb, b2 = texture(uBlur2, uv).rgb; return max(b - thr, 0.0) * 1.8 + max(b2 - thr, 0.0) * 1.2; }
float grain(vec2 fc, float s) { return (hash(floor(fc / s) + uSeed * 1.37) - 0.5); }
float vig(vec2 uv, float s) { vec2 d = uv - 0.5; return 1.0 - s * pow(clamp(length(d * vec2(0.9, 1.0)) / 0.72, 0.0, 1.0), 2.2); }
vec3 hsv2rgb(vec3 c) { vec3 p = abs(fract(c.xxx + vec3(1.0, 2.0 / 3.0, 1.0 / 3.0)) * 6.0 - 3.0); return c.z * mix(vec3(1.0), clamp(p - 1.0, 0.0, 1.0), c.y); }
vec3 rgb2hsv(vec3 c) { vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0); vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g)); vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r)); float d = q.x - min(q.w, q.y); return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + 1e-10)), d / (q.x + 1e-10), q.x); }
vec3 inferno(float t) {
  const vec3 c0 = vec3(0.0002189403691192265, 0.001651004631001012, -0.01948089843709184);
  const vec3 c1 = vec3(0.1065134194856116, 0.5639564367884091, 3.932712388889277);
  const vec3 c2 = vec3(11.60249308247187, -3.972853965665698, -15.9423941062914);
  const vec3 c3 = vec3(-41.70399613139459, 17.43639888205313, 44.35414519872813);
  const vec3 c4 = vec3(77.162935699427, -33.40235894210092, -81.80730925738993);
  const vec3 c5 = vec3(-71.31942824499214, 32.62606426397723, 73.20951985803202);
  const vec3 c6 = vec3(25.13112622477341, -12.24266895238567, -23.07032500287172);
  return clamp(c0 + t * (c1 + t * (c2 + t * (c3 + t * (c4 + t * (c5 + t * c6))))), 0.0, 1.0);
}

// person mask, sampled through the same framing as the picture
float maskAt(sampler2D s, vec2 uv) {
  if (uHasMask < 0.5) { vec2 d = (uv - vec2(0.5, 0.48)) * vec2(1.6, 0.9); return clamp(1.2 - length(d) * 1.9, 0.0, 1.0); }
  float inb; vec2 sv = toSrc(uv, inb);
  return texture(s, sv).r * inb;
}
float rimNarrow(vec2 uv) { return clamp((maskAt(uMaskN, uv) - maskAt(uMask, uv)) * 3.5, 0.0, 1.0); }
float rimWide(vec2 uv) { return clamp((maskAt(uMaskW, uv) * 1.5 - maskAt(uMask, uv)) * 1.6, 0.0, 1.0); }

vec3 tealOrange(vec3 c, vec2 uv) {
  c = curve(c, 1.25, 0.42);
  c = split(c, vec3(0.30, 0.52, 0.62), vec3(0.78, 0.55, 0.30), 0.55);
  c = sat(c, 1.25) + bloom(uv, 0.5) * vec3(1.0, 0.8, 0.6) * 0.7;
  return c * vig(uv, 0.5);
}

// digital rain: glyph columns falling at their own speeds
float rain(vec2 uv) {
  float cols = 26.0, rows = 46.0;
  vec2 g = vec2(uv.x * cols, (1.0 - uv.y) * rows);
  float col = floor(g.x), h = hash1(col + 3.1);
  float head = fract(uTime * mix(0.18, 0.5, h) + h * 7.0) * 1.5 - 0.25;
  float d = head * rows - g.y;
  if (d < 0.0 || d > 14.0) return 0.0;
  float row = floor(g.y);
  vec2 cell = fract(g);
  vec2 px = floor((cell - vec2(0.15, 0.1)) / vec2(0.7, 0.8) * vec2(5.0, 7.0));
  if (px.x < 0.0 || px.y < 0.0 || px.x > 4.0 || px.y > 6.0) return 0.0;
  float on = step(0.5, hash(vec2(col * 7.0 + px.x, row * 3.0 + px.y + floor(uTime * 8.0 + h * 9.0) * 13.0)));
  return on * pow(1.0 - d / 14.0, 1.6) * (d < 1.0 ? 1.6 : 1.0);
}

vec3 rays(vec2 uv, vec2 lp) {
  vec3 acc = vec3(0.0); float w = 1.0;
  for (int i = 0; i < 14; i++) {
    vec2 s = mix(uv, lp, float(i) * 0.045);
    acc += max(texture(uBlur, s).rgb - 0.35, 0.0) * w;
    w *= 0.9;
  }
  return acc / 6.0;
}

vec3 kuwahara(vec2 uv) {
  vec2 t = 1.0 / uRes * 1.6;
  vec3 m[4]; vec3 s[4];
  for (int k = 0; k < 4; k++) { m[k] = vec3(0.0); s[k] = vec3(0.0); }
  for (int j = 0; j <= 4; j++) for (int i = 0; i <= 4; i++) {
    vec2 o = vec2(float(i), float(j)) * t;
    vec3 a = pow(clamp(texture(uFrame, uv + vec2(-o.x, -o.y)).rgb * 1.9, 0.0, 1.0), vec3(0.8));
    vec3 b = pow(clamp(texture(uFrame, uv + vec2(o.x, -o.y)).rgb * 1.9, 0.0, 1.0), vec3(0.8));
    vec3 c = pow(clamp(texture(uFrame, uv + vec2(-o.x, o.y)).rgb * 1.9, 0.0, 1.0), vec3(0.8));
    vec3 d = pow(clamp(texture(uFrame, uv + o).rgb * 1.9, 0.0, 1.0), vec3(0.8));
    m[0] += a; s[0] += a * a; m[1] += b; s[1] += b * b; m[2] += c; s[2] += c * c; m[3] += d; s[3] += d * d;
  }
  float best = 1e9; vec3 res = vec3(0.0);
  for (int k = 0; k < 4; k++) {
    vec3 mu = m[k] / 25.0; vec3 v = abs(s[k] / 25.0 - mu * mu);
    float sv = v.r + v.g + v.b;
    if (sv < best) { best = sv; res = mu; }
  }
  return res;
}

vec3 freezeShot(vec2 uv) {
  float asp = uRes.x / uRes.y;
  float ang = atan(uv.y - 0.55, (uv.x - 0.5) * asp) + uTime * 0.8;
  vec3 bg = mix(vec3(0.25, 0.0, 0.12), vec3(0.75, 0.05, 0.55), step(0.0, sin(ang * 14.0)));
  vec3 c = texture(uFrame, uv).rgb;
  bg += vec3(curve1(lum(texture(uBlur, uv).rgb), 1.7, 0.38)) * 0.4;
  vec3 subj = tealOrange(c, uv);
  if (uHasMask < 0.5) return bg * 0.4 + subj * 0.8;
  float m = step(0.45, maskAt(uMask, uv));
  float edge = step(0.12, maskAt(uMaskN, uv));
  vec3 outc = mix(bg, vec3(1.0), edge);
  return mix(outc, subj, m);
}

void main() {
  vec2 uv = vUv;
  vec2 fc = gl_FragCoord.xy;
  if (uFreeze > 0.5) { o = vec4(freezeShot(uv), 1.0); return; }
  int L = uLook;
  if (L == 19) uv.x = uv.x < 0.5 ? uv.x : 1.0 - uv.x;                    // kaleido mirrors first
  if (L == 20) uv += (vec2(hash1(uSeed), hash1(uSeed + 9.0)) - 0.5) * vec2(0.003, 0.004); // film gate weave
  if (L == 8) { float band = 1.1 - fract(uTime * 0.25) * 1.3; if (abs(uv.y - band) < 0.012) uv.x += (hash1(floor(uSeed)) - 0.5) * 0.06; }
  if (L == 9) {                                                           // glitch: displaced slices
    float r = floor(uv.y * 38.0 + floor(uSeed * 0.5) * 7.0);
    if (hash1(r) > 0.72 - uPulse * 0.25) uv.x += (hash1(r + 3.3) - 0.5) * (0.06 + 0.16 * uPulse);
  }
  vec3 c = texture(uFrame, uv).rgb;
  vec3 r;
  float m = maskAt(uMask, uv);
  if (L == 0) r = tealOrange(c, uv);
  else if (L == 1) {
    float red = clamp((c.r - max(c.g, c.b) * 1.25) * 6.0, 0.0, 1.0);
    vec3 g = vec3(curve1(lum(c), 1.55, 0.4));
    r = mix(g, sat(c, 1.6) * vec3(1.35, 0.6, 0.6), red) + bloom(uv, 0.55) * vec3(1.0, 0.5, 0.5) * 0.6;
    r = (r + grain(fc, 1.0) * 0.05) * vig(uv, 0.6);
  } else if (L == 2) {
    vec3 d = duo(c, vec3(0.10, 0.02, 0.28), vec3(0.35, 0.95, 0.95), 0.9);
    r = d * 0.55 + sat(c, 1.6) * vec3(1.15, 0.75, 1.3) * 0.45 + lum(c) * 0.1 + bloom(uv, 0.45) * vec3(1.0, 0.4, 1.0) * 1.1;
    if (mod(fc.y, 3.0) < 1.0) r *= 0.92;
    r *= vig(uv, 0.45);
  } else if (L == 3) {
    r = split(curve(c, 1.2, 0.4), vec3(0.40, 0.42, 0.45), vec3(1.0, 0.62, 0.25), 0.5) * (0.55 + 0.45 * m);
    float n = sin(uv.x * 40.0 + uTime * 3.0) * cos(uv.y * 30.0 - uTime * 4.2) + 0.5 * sin(uv.x * 85.0 - uTime * 5.0);
    float flame = rimWide(uv - vec2(n * 0.008, 0.025 + 0.018 * n));
    float glow = max(rimWide(uv) * 0.8 + rimNarrow(uv), flame * 0.85);
    r += glow * vec3(1.0, 0.75, 0.25) * (0.9 + 0.5 * uPulse) + bloom(uv, 0.5) * vec3(1.0, 0.75, 0.4) * 0.9;
    r *= vig(uv, 0.55);
  } else if (L == 4) {
    r = sat(curve(c, 1.3, 0.4), 0.35) * (0.35 + 0.65 * m);
    float hue = fract(uTime * 0.33);
    r += rimNarrow(uv) * hsv2rgb(vec3(hue, 1.0, 1.0)) * 1.4 + rimWide(uv) * hsv2rgb(vec3(fract(hue + 0.33), 1.0, 1.0)) * (0.7 + 0.6 * uPulse);
    r += bloom(uv, 0.6) * 0.6;
    r *= vig(uv, 0.5);
  } else if (L == 5) {
    float l = pow(clamp(lum(c) * 1.8, 0.0, 1.0), 0.8);
    if (uHasMask > 0.5) l = clamp(l * 0.7 + m * 0.22 + maskAt(uMaskW, uv) * 0.12, 0.0, 1.0);
    r = inferno(curve1(l, 1.15, 0.4)) + grain(fc, 1.0) * 0.025;
  } else if (L == 6) {
    vec3 lift = pow(clamp(c * 2.2, 0.0, 1.0), vec3(0.75));
    vec3 q = floor(curve(lift, 1.25, 0.45) * 4.0 + 0.5) / 4.0;
    vec2 t = 1.0 / uRes;
    float gx = 0.0, gy = 0.0;
    for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
      float v = lum(clamp(texture(uFrame, uv + vec2(i, j) * t * 1.5).rgb * 2.2, 0.0, 1.0));
      gx += v * float(i) * (j == 0 ? 2.0 : 1.0); gy += v * float(j) * (i == 0 ? 2.0 : 1.0);
    }
    float ink = smoothstep(0.25, 0.55, length(vec2(gx, gy)));
    r = sat(q, 1.5) * (1.0 - ink);
    float cell = 9.0; vec2 cc = mod(fc, cell) - cell * 0.5;
    if (length(cc) < (1.0 - lum(q)) * cell * 0.62 && lum(q) < 0.55) r *= 0.55;
    r *= vec3(1.03, 0.97, 0.88);
  } else if (L == 7) {
    float g = lum(clamp(c * 1.6, 0.0, 1.0)), bg = lum(clamp(texture(uBlur, uv).rgb * 1.6, 0.0, 1.0));
    float s = pow(clamp(g / (bg + 0.03), 0.0, 1.0), 2.5);
    vec3 sk = vec3(s) * vec3(0.96, 0.93, 0.88);
    r = mix(sk, tealOrange(c, uv), clamp((uP - 0.45) * 3.0, 0.0, 1.0));
  } else if (L == 8) {
    vec2 t = vec2(1.0 / uRes.x, 0.0);
    vec3 sm = (texture(uFrame, uv - t * 2.0).rgb + texture(uFrame, uv - t).rgb + c + texture(uFrame, uv + t).rgb + texture(uFrame, uv + t * 2.0).rgb) / 5.0;
    r = sat(curve(sm, 1.1, 0.5) * 0.95 + 0.05, 1.3) + grain(fc, 1.0) * 0.05;
    if (mod(fc.y, 2.0) < 1.0) r *= 0.85;
  } else if (L == 9) {
    r = c;
    vec2 blk = floor(uv * vec2(8.0, 14.0));
    if (hash(blk + floor(uSeed * 0.25)) > 0.93 - uPulse * 0.06) r = floor(r * 3.0 + 0.5) / 3.0 * vec3(hash1(blk.x) + 0.5, 1.0, hash1(blk.y) + 0.5);
    r = sat(curve(r, 1.2, 0.45), 1.2);
  } else if (L == 10) {
    vec3 base = curve(c, 1.1, 0.4) * 0.96 + 0.04;
    vec3 soft = clamp(texture(uBlur2, uv).rgb * 1.6, 0.0, 1.0);
    r = split(screen(base * 0.85, soft * 0.75), vec3(0.55, 0.45, 0.75), vec3(0.95, 0.7, 0.55), 0.4) + bloom(uv, 0.45) * vec3(1.0, 0.8, 1.0) * 0.6;
    r *= vig(uv, 0.4);
  } else if (L == 11) {
    r = duo(curve(c, 1.3, 0.4), vec3(0.10, 0.02, 0.18), vec3(1.0, 0.85, 0.55), 0.85) * 0.8 + sat(c, 0.5) * 0.2 + bloom(uv, 0.4) * vec3(1.0, 0.6, 0.9) * 1.2;
    r *= vig(uv, 0.55);
  } else if (L == 12) {
    vec3 h = rgb2hsv(clamp(c, 0.0, 1.0)); h.x = fract(h.x + 150.0 / 360.0); h.y = clamp(h.y * 1.6, 0.0, 1.0);
    r = curve(hsv2rgb(h), 1.2, 0.45) + bloom(uv, 0.5) * vec3(1.0, 0.6, 1.0) * 0.8;
    r *= vig(uv, 0.45);
  } else if (L == 13 || L == 14) {
    float l = curve1(lum(c), 1.4, 0.35);
    vec3 mt = vec3(l * 0.35, clamp(l * 1.15, 0.0, 1.0), l * 0.25) + bloom(uv, 0.4) * vec3(0.5, 1.0, 0.4);
    mt += rain(uv) * vec3(0.55, 1.0, 0.5);
    r = mt;
    if (L == 14) r = mt * 0.55 + tealOrange(c, uv) * 0.45 + rays(uv, vec2(0.45, 0.8)) * vec3(0.7, 1.0, 0.6) * 1.6;
  } else if (L == 15) {
    r = duo(curve(c, 1.35, 0.4), vec3(0.0, 0.04, 0.12), vec3(0.8, 0.92, 1.0), 0.95) * 0.75 + sat(c, 0.6) * vec3(0.8, 1.0, 1.25) * 0.25;
    r += bloom(uv, 0.5) * vec3(0.6, 0.8, 1.0) * 0.9 + uFlashAdd;
    r *= vig(uv, 0.55);
  } else if (L == 16) {
    r = sat(split(curve(c, 1.25, 0.4), vec3(0.55, 0.40, 0.35), vec3(1.0, 0.55, 0.2), 0.6), 1.3) + bloom(uv, 0.45) * vec3(1.0, 0.6, 0.3);
    r *= vig(uv, 0.55);
  } else if (L == 17) {
    float g = pow(curve1(lum(c), 1.7, 0.38), 1.1);
    r = (vec3(g) + bloom(uv, 0.5) * 0.8 + grain(fc, 2.0) * 0.07) * vig(uv, 0.65);
  } else if (L == 18) {
    r = sat(curve(kuwahara(uv), 1.2, 0.42), 1.3) + bloom(uv, 0.55) * 0.5;
    r *= vig(uv, 0.5);
  } else if (L == 19) {
    vec3 d = duo(c, vec3(0.10, 0.02, 0.28), vec3(0.35, 0.95, 0.95), 0.9);
    r = (d * 0.55 + sat(c, 1.6) * vec3(1.15, 0.75, 1.3) * 0.45 + lum(c) * 0.1 + bloom(uv, 0.45) * vec3(1.0, 0.4, 1.0)) * vig(vUv, 0.45);
  } else if (L == 20) {
    r = split(curve(c, 1.15, 0.45) * 0.95 + 0.05, vec3(0.45, 0.48, 0.42), vec3(0.85, 0.55, 0.35), 0.45) + grain(fc, 2.0) * 0.07;
    for (int i = 0; i < 5; i++) {
      vec2 p = vec2(hash1(uSeed * 3.1 + float(i)), hash1(uSeed * 7.7 + float(i)));
      if (length((uv - p) * uRes) < 1.0 + 2.5 * hash1(float(i) + uSeed)) r = vec3(0.92);
    }
    float sx = hash1(floor(uSeed) * 1.3);
    if (hash1(floor(uSeed) + 0.7) > 0.4 && abs(uv.x - sx) * uRes.x < 0.7) r = mix(r, vec3(0.85), 0.8);
    vec2 lp = vec2(0.5 + 0.6 * sin(uTime * 0.35), 0.6 + 0.3 * cos(uTime * 0.27));
    vec3 leak = vec3(1.0, 0.45, 0.25) * smoothstep(0.55, 0.0, length((uv - lp) * vec2(1.0, 0.6))) * (0.35 + 0.25 * sin(uTime * 1.3));
    r = screen(clamp(r, 0.0, 1.0), leak) * vig(uv, 0.6);
  } else if (L == 21) {
    r = 1.0 - curve(c, 1.2, 0.5);
  } else {
    r = sat(curve(c, 1.08, 0.45), 1.08);
  }
  o = vec4(r, 1.0);
}`;

export const FINAL = `#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
uniform sampler2D uTex;
uniform vec2 uRes, uCenter, uShift;
uniform float uZoom, uRGB, uChroma, uFlash, uLetterbox;
void main() {
  vec2 uv = (vUv - uCenter) / uZoom + uCenter - uShift / uRes;
  uv = clamp(uv, vec2(0.001), vec2(0.999));
  vec2 d = uv - vec2(0.5);
  vec2 ru = vec2(0.5) + d * (1.0 + uChroma) + vec2(uRGB / uRes.x, 0.0);
  vec2 bu = vec2(0.5) + d * (1.0 - uChroma) - vec2(uRGB / uRes.x, 0.0);
  vec3 c = vec3(texture(uTex, ru).r, texture(uTex, uv).g, texture(uTex, bu).b);
  c += uFlash;
  if (uLetterbox > 0.5 && (vUv.y < 0.1 || vUv.y > 0.9)) c = vec3(0.0);
  o = vec4(c, 1.0);
}`;
