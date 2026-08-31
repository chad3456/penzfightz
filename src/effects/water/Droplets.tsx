import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Goop.
 *
 * Two ideas stacked on each other, and both of them are older than shaders.
 *
 * ### One: the field, not the ball
 *
 * Nothing here draws a droplet. Every droplet contributes a **scalar field**
 * that falls off as one over distance squared, the whole lot is summed, and the
 * droplet is wherever that sum crosses a threshold. That is Blinn's metaball
 * from 1982, and the reason it is right for this is not that it is cheap — it
 * is that **merging is free**. Two fields near each other add, the level set
 * bulges towards its neighbour, necks, and joins, and at no point does any code
 * know that a merge happened. Try to write that with circles and you are
 * modelling a meniscus by hand for the rest of your life.
 *
 * The gradient is analytic rather than sampled. `f = r²/q` with `q = |d|²`
 * gives `∇f = −2r²d/q²` for a couple of extra multiplies per droplet, where
 * finite differences would cost four more passes over the whole set — the
 * difference between one loop and five, per pixel.
 *
 * ### Two: the colour is a wave, not a palette
 *
 * The iridescence is not a rainbow ramp. It is **thin-film interference**,
 * which is the actual reason a soap bubble and a petrol slick are coloured:
 * light reflecting off the top of the film and light reflecting off the bottom
 * travel different distances, and for each wavelength that difference is either
 * a whole number of waves or it is not. The path difference is
 *
 * ```
 * Δ = 2 · n · d · cos θ
 * ```
 *
 * for a film of thickness `d` and index `n`, and the reflected intensity at
 * wavelength λ goes as `cos(2πΔ/λ)`. Evaluate that at 650, 540 and 470
 * nanometres and you have a colour — and it comes out with the *right* palette
 * without anybody choosing one: the magenta-gold-cyan of a soap film rather
 * than the even spectrum of a hue wheel, because the three curves fall out of
 * phase with each other at a rate set by the ratio of the wavelengths.
 *
 * Everything else follows from it. Thickness varies with the height of the
 * bulge, so a droplet is banded from rim to crown. `cos θ` comes off the
 * surface normal, so the bands crowd at a steep edge. Where two droplets have
 * merged the film is thicker and the bands are tighter, which is a thing you
 * can watch happen and is not drawn anywhere.
 */

const MAX = 40;

/**
 * Straight to clip space. The geometry is a two-by-two quad and its vertices
 * *are* the corners of the screen, so no matrix is involved — which also means
 * scaling the mesh does nothing at all, and a unit quad drawn this way covers
 * exactly the middle quarter of the canvas and looks like a bug in the layout.
 */
const VERT = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const FRAG = `
precision highp float;
varying vec2 vUv;

uniform vec3 uDrops[${MAX}];
uniform int uCount;
uniform int uFaces;
uniform float uAspect;
uniform float uTime;
uniform float uGoo;
uniform float uFilm;
uniform float uSpread;
uniform float uBands;
uniform float uGrain;

const float PI = 3.14159265;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}

/**
 * Posterise.
 *
 * The single move that separates a flat illustration from a render. A gradient
 * says "this is a lit surface"; the same gradient cut into four steps says
 * "somebody drew this", and the eye reads the steps as intent. Smoothed by a
 * fraction of a band so the edges do not crawl.
 */
float band(float x, float n) {
  float s = floor(x * n);
  float f = fract(x * n);
  return (s + smoothstep(0.35, 0.65, f)) / n;
}

/**
 * The palette.
 *
 * Six stops, and none of them is a spectral colour. The interference maths
 * underneath is unchanged — the path difference through the film is still
 * computed properly — but instead of emitting the wavelength it *indexes* this
 * ramp with it. So the physics still decides which colour a bead is and how the
 * bands crowd at its rim, and the answer is always a colour somebody chose.
 * Left as a raw spectrum it comes out convincing and slightly grubby; run
 * through here it comes out as an illustration of the same thing.
 */
vec3 ramp(float t) {
  t = fract(t);
  vec3 c0 = vec3(0.898, 0.224, 0.478);
  vec3 c1 = vec3(0.961, 0.475, 0.227);
  vec3 c2 = vec3(1.000, 0.831, 0.278);
  vec3 c3 = vec3(0.247, 0.851, 0.769);
  vec3 c4 = vec3(0.247, 0.482, 0.878);
  vec3 c5 = vec3(0.545, 0.294, 0.910);
  float x = t * 6.0;
  if (x < 1.0) return mix(c0, c1, x);
  if (x < 2.0) return mix(c1, c2, x - 1.0);
  if (x < 3.0) return mix(c2, c3, x - 2.0);
  if (x < 4.0) return mix(c3, c4, x - 3.0);
  if (x < 5.0) return mix(c4, c5, x - 4.0);
  return mix(c5, c0, x - 5.0);
}

/**
 * The set the beads sit on.
 *
 * Deep indigo, a scatter of stars, and two dashed rings. None of it is needed
 * and all of it is the style: an illustrated thing is a thing *staged*, and a
 * subject floating on black is a screenshot. The rings in particular do the
 * whole job — three dashes of a circle behind an object and the object is now
 * a diagram of something.
 */
vec3 backdrop(vec2 p) {
  float r = length(p * vec2(0.75, 1.0));
  vec3 col = mix(vec3(0.106, 0.118, 0.243), vec3(0.043, 0.047, 0.114), smoothstep(0.1, 1.5, r));

  // Stars. Sparse, two sizes, and never pure white.
  vec2 g = floor(p * 11.0);
  vec2 f = fract(p * 11.0) - 0.5;
  float pick = hash(g);
  if (pick > 0.87) {
    vec2 jit = vec2(hash(g + 3.1), hash(g + 7.7)) - 0.5;
    float d = length(f - jit * 0.6);
    float size = 0.02 + 0.035 * step(0.965, pick);
    float tw = 0.6 + 0.4 * sin(uTime * 1.4 + pick * 40.0);
    col += vec3(0.72, 0.78, 0.95) * smoothstep(size, 0.0, d) * tw * 0.85;
  }

  // Two dashed orbits.
  for (int k = 0; k < 2; k++) {
    float rad = 0.62 + float(k) * 0.42;
    float ring = abs(r - rad);
    float a = atan(p.y, p.x * 0.75);
    float dash = step(0.42, fract(a * (5.0 + float(k) * 3.0) / PI * 0.5 + uTime * 0.02));
    col += vec3(0.24, 0.30, 0.52) * smoothstep(0.012, 0.0, ring) * dash;
  }

  return col;
}

/** Thin-film interference: a real path difference, evaluated at three lines. */
vec3 film(float thickness, float cosTheta) {
  vec3 lambda = vec3(650.0, 545.0, 470.0);
  vec3 phase = 4.0 * PI * 1.35 * thickness * cosTheta / lambda;
  return 0.5 + 0.5 * cos(phase);
}

void main() {
  vec2 p = (vUv - 0.5) * 2.0;
  p.x *= uAspect;

  // One pass for the field, its gradient, and the field a little up and to the
  // left — which is the drop shadow, and getting it out of the same loop is
  // most of what keeps this affordable.
  vec2 lift = vec2(0.045, 0.055);
  float f = 0.0;
  float fs = 0.0;
  vec2 grad = vec2(0.0);
  for (int i = 0; i < ${MAX}; i++) {
    if (i >= uCount) break;
    vec2 d = p - uDrops[i].xy;
    float q = dot(d, d) + 1e-4;
    float r2 = uDrops[i].z * uDrops[i].z;
    f += r2 / q;
    grad -= 2.0 * r2 * d / (q * q);
    vec2 ds = p + lift - uDrops[i].xy;
    fs += r2 / (dot(ds, ds) + 1e-4);
  }

  vec3 col = backdrop(p);

  // Shadow first, under everything. Flat, offset, and slightly larger than the
  // thing casting it — a soft correct shadow reads as a render, and a hard one
  // offset by a fixed amount reads as a sticker on a page, which is the look.
  col = mix(col, col * vec3(0.42, 0.44, 0.62), smoothstep(uGoo * 0.8, uGoo * 1.3, fs) * 0.75);

  float edge = smoothstep(uGoo * 0.94, uGoo * 1.18, f);

  // Glow, outside the bead. Kurzgesagt light does not fall off, it *halos*.
  // The body colour is a slowly varying field, so it is very nearly constant
  // across any one bead: an illustrated blob is *one colour* with a light side
  // and a dark side. Driving the body from the interference instead — which is
  // what the first pass did — bands it into concentric rings and every bead
  // comes out a bullseye.
  float baseT = fract(noise(p * 0.62 + uTime * 0.012) * 1.7 + 0.12);
  vec3 body = ramp(band(baseT, 9.0));

  float halo = smoothstep(uGoo * 0.25, uGoo * 1.05, f) * (1.0 - edge);
  col += body * halo * 0.15;

  if (edge > 0.001) {
    // Height as sqrt(1 - threshold/f): the profile a one-over-r-squared field
    // implies, curved everywhere rather than clamping to a plateau.
    float hh = clamp(1.0 - uGoo / max(f, 1e-4), 0.0, 1.0);
    float h = sqrt(hh);
    float dhdf = uGoo / (2.0 * f * f * max(h, 0.05));
    vec3 n = normalize(vec3(-grad * dhdf * uSpread, 1.0));
    n = normalize(mix(vec3(0.0, 0.0, 1.0), n, edge));

    float cosTheta = clamp(n.z, 0.05, 1.0);

    float thick = uFilm * (0.4 + 0.6 * h)
      * (0.55 + 0.95 * noise(p * 1.7 + uTime * 0.03))
      * (1.0 + 0.3 * smoothstep(uGoo * 1.6, uGoo * 4.0, f));
    vec3 irid = film(thick, cosTheta);

    // The interference picks a place in the palette rather than being a colour
    // itself: its hue angle in RGB is what the ramp is indexed by.
    float pickT = fract(atan(irid.g - irid.b, irid.r - 0.5 * (irid.g + irid.b)) / (2.0 * PI)
      + 0.5 + thick * 0.0009);

    // Two-tone body. One light, quantised hard, and a second bounce from below
    // in a complementary colour — the trick that makes a flat blob read as
    // volume without a single soft gradient in it.
    vec3 L = normalize(vec3(-0.42, 0.62, 0.66));
    float lambert = band(clamp(dot(n, L) * 0.5 + 0.5, 0.0, 1.0), uBands);
    vec3 lit = body * mix(0.38, 1.16, lambert);
    float bounce = band(clamp(dot(n, normalize(vec3(0.5, -0.8, 0.4))) * 0.5 + 0.5, 0.0, 1.0),
      max(2.0, uBands * 0.5));
    lit = mix(lit, ramp(baseT + 0.42) * 0.9, bounce * 0.26);

    // And *this* is where the interference goes: a sheen on the turn of the
    // rim, which is also the only place you see iridescence on a real bead —
    // the middle of a droplet faces you and shows one colour, and all the
    // banding is crowded into the last few degrees at its edge.
    float sheen = smoothstep(0.66, 0.04, cosTheta);
    lit = mix(lit, ramp(band(pickT, max(3.0, uBands))), sheen * 0.55);

    // Rim light: a hard crescent, not a fresnel falloff.
    float rim = band(smoothstep(0.42, 0.0, cosTheta) * clamp(dot(n, L) + 0.35, 0.0, 1.0),
      max(2.0, uBands * 0.6));
    lit += vec3(1.0, 0.95, 0.88) * rim * 0.55;

    // The highlight is a *dot*. Every illustration of a sphere ever drawn has
    // one, it is the same size wherever it lands, and it has an edge.
    // Tight, or it is not a highlight — it is a glowing core, which is what a
    // wide smoothstep on a nearly flat normal gives you and which turns every
    // bead into a lamp.
    vec3 hv = normalize(L + vec3(0.0, 0.0, 1.0));
    float sd = dot(n, hv);
    lit += vec3(1.0) * smoothstep(0.9955, 0.9985, sd) * 0.95;
    lit += vec3(1.0) * smoothstep(0.986, 0.991, sd) * 0.14;

    // A darker contact where the film turns away hardest.
    lit *= 1.0 - 0.28 * smoothstep(0.34, 0.0, h);

    col = mix(col, lit, edge);
  }

  // Faces. Kurzgesagt puts eyes on things because a thing with eyes is a
  // character and a character is something you watch rather than look at.
  for (int i = 0; i < 8; i++) {
    if (i >= uFaces || i >= uCount) break;
    vec2 c = uDrops[i].xy;
    float r = uDrops[i].z;
    vec2 d = p - c;
    if (dot(d, d) > r * r * 4.0) continue;
    // They look where the whole cluster is drifting, roughly.
    vec2 gaze = normalize(vec2(sin(uTime * 0.4 + float(i)), cos(uTime * 0.31 + float(i) * 2.0)));
    float open = step(0.06, fract(uTime * 0.21 + float(i) * 0.37));
    for (int e = 0; e < 2; e++) {
      vec2 o = vec2((float(e) * 2.0 - 1.0) * r * 0.42, -r * 0.12);
      vec2 q = d - o;
      float white = smoothstep(r * 0.3, r * 0.26, length(q / vec2(1.0, mix(0.24, 1.0, open))));
      col = mix(col, vec3(0.98, 0.98, 1.0), white);
      float pupil = smoothstep(r * 0.15, r * 0.12,
        length((q - gaze * r * 0.09) / vec2(1.0, mix(0.24, 1.0, open))));
      col = mix(col, vec3(0.09, 0.10, 0.18), pupil * open);
    }
  }

  // Grain, over everything, and the reason this looks printed rather than
  // rendered. Two scales: a fine per-pixel one that moves, and a coarse static
  // one that breaks up the flats so a posterised band is never actually flat.
  float fine = hash(vUv * 1200.0 + fract(uTime) * 90.0) - 0.5;
  float coarse = noise(vUv * 260.0) - 0.5;
  col += (fine * 0.9 + coarse * 0.6) * uGrain;
  col *= 1.0 - 0.1 * smoothstep(0.8, 1.9, length(p * vec2(0.72, 1.0)));

  gl_FragColor = vec4(col, 1.0);
}
`;

export interface DropletSettings {
  count: number;
  goo: number;
  film: number;
  speed: number;
  /** Steps the shading is cut into. High is a render; four is an illustration. */
  bands: number;
  /** How many of them get eyes. */
  faces: number;
  grain: number;
}

interface Drop {
  p: THREE.Vector2;
  v: THREE.Vector2;
  r: number;
  wob: number;
}

export function Droplets({ settings }: { settings: DropletSettings }) {
  const { size } = useThree();
  const aspect = size.width / Math.max(1, size.height);
  const material = useRef<THREE.ShaderMaterial>(null);
  const pointer = useRef(new THREE.Vector2(0, 0));
  const held = useRef(false);

  const drops = useMemo<Drop[]>(() => {
    const out: Drop[] = [];
    for (let i = 0; i < MAX; i++) {
      const a = (i / MAX) * Math.PI * 2;
      out.push({
        p: new THREE.Vector2(Math.cos(a) * (0.3 + Math.random() * 0.7),
          Math.sin(a) * (0.3 + Math.random() * 0.7)),
        v: new THREE.Vector2((Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.2),
        r: 0.058 + Math.random() * 0.075,
        wob: Math.random() * 100,
      });
    }
    // Faces go to the first few in the array, so the array is sorted biggest
    // first — eyes on a bead too small to hold them read as a smudge.
    out.sort((x, y) => y.r - x.r);
    return out;
  }, []);

  const uniforms = useMemo(
    () => ({
      uDrops: { value: Array.from({ length: MAX }, () => new THREE.Vector3()) },
      uCount: { value: 24 },
      uAspect: { value: aspect },
      uTime: { value: 0 },
      uGoo: { value: 1.0 },
      uFilm: { value: 320 },
      uSpread: { value: 0.32 },
      uBands: { value: 4 },
      uFaces: { value: 4 },
      uGrain: { value: 0.07 },
    }),
    // Built once; the aspect is written every frame below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const gl = useThree((s) => s.gl);
  useEffect(() => {
    const el = gl.domElement;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      pointer.current.set(
        ((e.clientX - r.left) / r.width - 0.5) * 2 * (r.width / r.height),
        -((e.clientY - r.top) / r.height - 0.5) * 2,
      );
    };
    const down = () => {
      held.current = true;
    };
    const up = () => {
      held.current = false;
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerdown', down);
    window.addEventListener('pointerup', up);
    return () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerdown', down);
      window.removeEventListener('pointerup', up);
    };
  }, [gl]);

  useFrame((state, delta) => {
    const dt = Math.min(0.05, delta) * settings.speed;
    const n = Math.min(MAX, settings.count);
    const limitX = aspect * 1.05;

    for (let i = 0; i < n; i++) {
      const d = drops[i];
      // A slow wander, so nothing ever settles into an orbit.
      d.wob += dt;
      d.v.x += Math.cos(d.wob * 0.7 + i) * 0.06 * dt;
      d.v.y += Math.sin(d.wob * 0.53 + i * 2.1) * 0.06 * dt;

      // Attraction at range, repulsion on contact. Attraction alone is what
      // the first pass had, and every droplet in the field ended up in one
      // heap at the centre inside three seconds — which the shader dutifully
      // drew as a single enormous bead. Beads stay beads because they push
      // back when they touch, and the whole cluster-but-do-not-collapse look
      // lives in the gap between those two terms.
      for (let j = i + 1; j < n; j++) {
        const o = drops[j];
        const dx = o.p.x - d.p.x;
        const dy = o.p.y - d.p.y;
        const dist = Math.hypot(dx, dy) + 1e-4;
        const nx = dx / dist;
        const ny = dy / dist;
        // Cohesion is *short range*, which is both what surface tension
        // actually is and the only version that survives thirty droplets: a
        // one-over-r-squared pull summed over every pair grows with the count,
        // so a setting that gives five beads a pleasant drift crushes thirty
        // into a single blob in about three seconds. Beyond the reach they do
        // not know about each other at all.
        const reach = 0.5;
        let f = dist < reach ? 0.42 * (1 - dist / reach) : 0;
        // And they push back on contact. The gap between these two terms is
        // the whole look: all pull and it is one amoeba, all push and nothing
        // ever touches, which is worse — the merging is the reason for using a
        // field in the first place.
        const touch = (d.r + o.r) * 1.65;
        if (dist < touch) f -= 1.5 * (1 - dist / touch);
        d.v.x += nx * f * dt;
        d.v.y += ny * f * dt;
        o.v.x -= nx * f * dt;
        o.v.y -= ny * f * dt;
      }

      // A slack tether to the middle, so a drifting cluster never ends up
      // parked in a corner where there is nothing to watch.
      d.v.x -= d.p.x * 0.07 * dt;
      d.v.y -= d.p.y * 0.07 * dt;

      // The pointer pushes them about; holding gathers them instead.
      const px = pointer.current.x - d.p.x;
      const py = pointer.current.y - d.p.y;
      const pq = px * px + py * py + 0.03;
      const pull = held.current ? 1.1 : -0.13;
      d.v.x += (px * pull * dt) / pq;
      d.v.y += (py * pull * dt) / pq;

      d.v.multiplyScalar(0.985);
      d.p.x += d.v.x * dt;
      d.p.y += d.v.y * dt;

      if (d.p.x < -limitX || d.p.x > limitX) {
        d.p.x = THREE.MathUtils.clamp(d.p.x, -limitX, limitX);
        d.v.x *= -0.8;
      }
      if (d.p.y < -1.05 || d.p.y > 1.05) {
        d.p.y = THREE.MathUtils.clamp(d.p.y, -1.05, 1.05);
        d.v.y *= -0.8;
      }
    }

    const m = material.current;
    if (!m) return;
    const arr = m.uniforms.uDrops.value as THREE.Vector3[];
    for (let i = 0; i < n; i++) arr[i].set(drops[i].p.x, drops[i].p.y, drops[i].r);
    m.uniforms.uCount.value = n;
    m.uniforms.uAspect.value = aspect;
    m.uniforms.uTime.value = state.clock.elapsedTime;
    m.uniforms.uGoo.value = settings.goo;
    m.uniforms.uFilm.value = settings.film;
    m.uniforms.uBands.value = settings.bands;
    m.uniforms.uFaces.value = Math.min(8, Math.round(settings.faces));
    m.uniforms.uGrain.value = settings.grain;
  });

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={material}
        vertexShader={VERT}
        fragmentShader={FRAG}
        uniforms={uniforms}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  );
}
