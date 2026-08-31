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
uniform float uAspect;
uniform float uTime;
uniform float uGoo;
uniform float uFilm;
uniform float uSpread;

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

/** The backdrop, seen through the goo. Dark, with just enough in it to bend. */
vec3 backdrop(vec2 p) {
  float g = smoothstep(1.3, -0.2, length(p * vec2(0.7, 1.0)));
  vec3 base = mix(vec3(0.035, 0.04, 0.055), vec3(0.10, 0.12, 0.16), g);
  vec2 q = p * 9.0;
  float grid = min(abs(fract(q.x) - 0.5), abs(fract(q.y) - 0.5));
  base += vec3(0.05, 0.06, 0.08) * smoothstep(0.06, 0.0, grid) * g;
  return base;
}

/** Thin-film interference: a real path difference, evaluated at three lines. */
vec3 film(float thickness, float cosTheta) {
  // Nanometres. Index of the film is about that of soapy water.
  vec3 lambda = vec3(650.0, 545.0, 470.0);
  vec3 phase = 4.0 * PI * 1.35 * thickness * cosTheta / lambda;
  return 0.5 + 0.5 * cos(phase);
}

void main() {
  vec2 p = (vUv - 0.5) * 2.0;
  p.x *= uAspect;

  // One pass for the field and its gradient. See the note at the top of the
  // file for why this is not four passes of finite differences.
  float f = 0.0;
  vec2 grad = vec2(0.0);
  for (int i = 0; i < ${MAX}; i++) {
    if (i >= uCount) break;
    vec2 d = p - uDrops[i].xy;
    float q = dot(d, d) + 1e-4;
    float r2 = uDrops[i].z * uDrops[i].z;
    f += r2 / q;
    grad -= 2.0 * r2 * d / (q * q);
  }

  vec3 col = backdrop(p);

  float edge = smoothstep(uGoo * 0.92, uGoo * 1.35, f);
  if (edge > 0.001) {
    // The surface.
    //
    // Height as sqrt(1 - threshold/f), which is the profile a one-over-r squared
    // field actually implies: zero at the level set, and approaching one only
    // as the field runs away at a droplet's centre. The obvious version — a
    // linear ramp between the threshold and some ceiling — clamps, and a
    // clamped height is a *plateau*: the crown of every bead comes out dead
    // flat, takes the whole specular lobe at once, and reads as a white sticker
    // with a rainbow ring round it. This profile is curved everywhere, so the
    // highlight is a point and the interference bands stay in step.
    float hh = clamp(1.0 - uGoo / max(f, 1e-4), 0.0, 1.0);
    float h = sqrt(hh);
    float dhdf = uGoo / (2.0 * f * f * max(h, 0.05));
    vec3 n = normalize(vec3(-grad * dhdf * uSpread, 1.0));
    n = normalize(mix(vec3(0.0, 0.0, 1.0), n, edge));

    vec3 view = vec3(0.0, 0.0, 1.0);
    float cosTheta = clamp(n.z, 0.05, 1.0);
    float fres = pow(1.0 - cosTheta, 4.0);

    // Thickness: thicker at the crown, thicker again where droplets have run
    // together, and never perfectly even — a film with a constant thickness
    // makes flat bands and reads as printed foil.
    // Thickness varies over the *field*, not over the droplet, which is what
    // gives each bead its own colour — a soap film is not the same thickness
    // everywhere on the glass. Swing it too little and thirty droplets come out
    // as thirty copies of one bead.
    float thick = uFilm * (0.4 + 0.6 * h)
      * (0.55 + 0.95 * noise(p * 1.7 + uTime * 0.03))
      * (1.0 + 0.3 * smoothstep(uGoo * 1.6, uGoo * 4.0, f));
    vec3 irid = film(thick, cosTheta);

    // What is behind, bent by the surface. Real refraction through a bulge,
    // which is why a droplet magnifies the grid under it.
    vec3 through = backdrop(p + n.xy * 0.42 * h);

    vec3 lit = mix(through * (0.55 + 0.45 * irid), irid, 0.34 + 0.5 * fres);

    // One hard light. Two specular lobes: a tight one for the wet highlight
    // and a broad one so the whole crown lifts off the background.
    vec3 L = normalize(vec3(-0.45, 0.6, 0.66));
    vec3 hv = normalize(L + view);
    float spec = pow(max(dot(n, hv), 0.0), 120.0);
    float sheen = pow(max(dot(n, hv), 0.0), 6.0);
    lit += vec3(1.0) * spec * 0.6 + irid * sheen * 0.2;

    // The contact line: every droplet is darkest exactly at its rim, where the
    // film turns away hardest. Without it they read as stickers.
    lit *= 1.0 - 0.24 * smoothstep(0.35, 0.0, h);

    col = mix(col, lit, edge);
  }

  // A little grain, because a gradient this smooth bands on any real display.
  col += (hash(vUv * 900.0 + uTime) - 0.5) * 0.012;
  gl_FragColor = vec4(col, 1.0);
}
`;

export interface DropletSettings {
  count: number;
  goo: number;
  film: number;
  speed: number;
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
        r: 0.042 + Math.random() * 0.055,
        wob: Math.random() * 100,
      });
    }
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
      uSpread: { value: 0.12 },
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
        const touch = (d.r + o.r) * 2.1;
        if (dist < touch) f -= 2.0 * (1 - dist / touch);
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
