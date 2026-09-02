import type p5 from 'p5';
import { Fluid, type Splat } from './fluid';
import { Dragon, Phoenix } from './creatures';

/**
 * The scene.
 *
 * A dragon and a few phoenixes swimming through an incompressible fluid, drawn
 * sharp and leaving a wake that is not. The whole piece is four things in a
 * loop: the creatures steer, they shove the water, they print themselves into
 * the ink, and the solver takes it all away downstream.
 *
 * ### Why they are drawn into the dye rather than over it
 *
 * The obvious build renders the creatures on top of the fluid as a separate
 * layer. It looks like a cartoon on a lava lamp, because nothing the animal
 * does affects the water and nothing the water does affects the animal. Here
 * the dragon is *made of* ink: the same texture the solver advects, so the
 * instant a fold of water crosses its tail the tail comes apart into it. That
 * one decision is the difference between an animation and a painting.
 */

/** A quad over the whole canvas. p5 hands positions in 0..1; clip space wants -1..1. */
const FULLSCREEN = `
precision highp float;
attribute vec3 aPosition;
attribute vec2 aTexCoord;
varying vec2 vUv;
void main() {
  vUv = aTexCoord;
  vec4 p = vec4(aPosition, 1.0);
  p.xy = p.xy * 2.0 - 1.0;
  gl_Position = p;
}
`;

const COMPOSITE = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uDye;
uniform sampler2D uSharp;
uniform sampler2D uVel;
uniform vec2 uTexel;
uniform float uTime;
uniform float uGlow;
uniform float uFlip;
uniform float uAspect;
uniform float uCrisp;
uniform vec3 uTouch;   // xy in uv, z is how hard
uniform float uSheen;

float hash(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}

float luma(vec3 c) { return dot(c, vec3(0.31, 0.53, 0.16)); }

/**
 * The ink at a point: what the water is still holding, plus what is being
 * drawn right now. Everything downstream — dispersion, bloom, absorption, the
 * gold edge — reads through here, so the creature gets the same treatment as
 * its own wake and does not sit on the picture like a decal.
 */
vec3 inkAt(vec2 p) { return texture2D(uDye, p).rgb + texture2D(uSharp, p).rgb * uCrisp; }

/** Wet silk: a dark ground that is never one colour and never quite still. */
vec3 ground(vec2 p) {
  float r = length((p - 0.5) * vec2(uAspect, 1.0));
  vec3 base = mix(vec3(0.055, 0.075, 0.094), vec3(0.014, 0.021, 0.032), smoothstep(0.1, 1.1, r));
  float weave = noise(p * vec2(420.0, 6.0)) * noise(p * vec2(6.0, 420.0));
  base += vec3(0.018, 0.022, 0.026) * weave;
  base += vec3(0.02, 0.03, 0.05) * noise(p * 3.0 + uTime * 0.02);
  return base;
}

void main() {
  vec2 uv = vec2(vUv.x, mix(vUv.y, 1.0 - vUv.y, uFlip));

  // Chromatic dispersion, along the slope of the ink. Water bends the short
  // wavelengths hardest, so the fringe on a fold is always blue on one side
  // and warm on the other — one of those details nobody names and everybody
  // notices when it is missing.
  float c = luma(inkAt(uv));
  float dx = luma(inkAt(uv + vec2(uTexel.x, 0.0))) - c;
  float dy = luma(inkAt(uv + vec2(0.0, uTexel.y))) - c;
  vec2 slope = vec2(dx, dy);
  float edge = length(slope);

  // The ground, seen *through* the ink rather than behind it.
  //
  // This is the one change that stopped the piece reading as smoke on a dark
  // card. A film of ink lying on water is a lens: it is thicker in some places
  // than others, so the weave underneath it shifts where the film is steep.
  // Refracting the ground by the slope of the ink costs one extra sample and
  // is the difference between a picture of ink and a picture of a liquid.
  vec3 col = ground(vUv - slope * 0.09 * vec2(1.0, mix(1.0, -1.0, uFlip)));
  // Clamped, and not out of caution. Unclamped, the slope at the hard edge of
  // a drawn shape is enormous and the three channels sample five texels apart,
  // which is not dispersion, it is a registration error — it looked like badly
  // printed comics along every leg.
  vec2 disp = clamp(slope * 2.4, -0.6, 0.6);

  vec3 ink = vec3(
    inkAt(uv + disp * uTexel * 1.6).r,
    inkAt(uv).g,
    inkAt(uv - disp * uTexel * 1.6).b);

  // Bloom, on a spiral of taps rather than a box: a ring of samples at
  // increasing radius costs twelve reads and has no visible grid to it.
  vec3 halo = vec3(0.0);
  for (int i = 0; i < 12; i++) {
    float a = float(i) * 2.399;
    float rr = (1.0 + float(i)) * 1.6;
    halo += inkAt(uv + vec2(cos(a), sin(a)) * rr * uTexel);
  }
  halo /= 12.0;

  // Ink over water, done as absorption rather than as a colour.
  //
  // Two terms, and the whole look is in the second one. Beer–Lambert takes the
  // ground away — a blue ink eats red hardest, so what is left under a heavy
  // stroke is a near-black indigo. Then the ink throws its own light back, and
  // that term *peaks at a thin film and dies as the film thickens*: a wash of
  // it glows and a fold of it does not. Which is why the dragon reads at all.
  // It is the one dark shape in a frame of luminous water, and the wake it is
  // dissolving into is bright for exactly the reason the animal is not.
  float t = luma(ink);
  float thick = clamp(t * 1.5, 0.0, 1.0);
  vec3 tint = ink / max(0.0001, t + 0.0001);
  vec3 sigma = clamp(vec3(1.0) - tint * 0.6, 0.0, 1.0);
  // Ink does not lie down evenly on silk, it pools, so the absorption gets a
  // slow mottle over it. Without this a thick stroke is a flat plastic shape.
  float mott = 0.72 + 0.56 * noise(vUv * vec2(uAspect, 1.0) * 34.0);
  col *= exp(-t * 3.0 * sigma * mott);
  col += ink * 3.2 * exp(-t * 2.4);
  col += halo * uGlow * exp(-t * 1.2);

  // A surface, with a light on it.
  //
  // The thickness field is a height field, so it has a normal, and a normal is
  // all a specular term needs. The highlight sits on the *shoulders* of a
  // stroke — where the film is steep — and is absent from the flats, which is
  // exactly where the light lives on real spilled liquid. The smoothstep
  // keeps it off the bare water, where there is no surface to catch it.
  vec3 nrm = normalize(vec3(-slope * uSheen * 26.0, 0.5));
  vec3 lig = normalize(vec3(-0.42, 0.68, 0.62));
  float spec = pow(max(0.0, dot(reflect(-lig, nrm), vec3(0.0, 0.0, 1.0))), 26.0);
  col += vec3(1.0, 0.95, 0.86) * spec * uSheen * smoothstep(0.015, 0.16, t);

  // Gold along the wet edge, which is where a real ink line pools as it dries.
  col += vec3(1.0, 0.78, 0.36) * smoothstep(0.05, 0.34, edge) * smoothstep(0.62, 0.14, thick) * 0.75;

  // The water itself, very faintly, so the empty parts of the frame are moving.
  vec2 v = texture2D(uVel, uv).xy;
  col += vec3(0.16, 0.26, 0.34) * clamp(length(v) * 0.05, 0.0, 0.4);

  // The pointer carries a light. It is not decoration: without it there is no
  // evidence on screen that the water knows where your finger is until the ink
  // arrives, which is half a second later, and half a second is long enough to
  // conclude that nothing happened.
  float td = length((vUv - uTouch.xy) * vec2(uAspect, 1.0));
  col += vec3(0.42, 0.68, 0.95) * uTouch.z * exp(-td * td * 300.0);
  col += vec3(0.9, 0.82, 0.6) * uTouch.z * 0.35 * exp(-td * td * 2600.0);

  col *= 1.0 - 0.42 * smoothstep(0.45, 1.15, length((vUv - 0.5) * vec2(uAspect, 1.0)));

  // Everything above this line adds. Nothing above it subtracts, so without a
  // shoulder the ink piles past white and the painting becomes a lamp. This is
  // the exposure curve: linear where the frame is dark, asymptotic where it is
  // bright, so a fold can be twice as thick as another and still be a fold.
  col = vec3(1.0) - exp(-col * 1.15);

  col += (hash(vUv * 900.0 + fract(uTime)) - 0.5) * 0.02;
  gl_FragColor = vec4(col, 1.0);
}
`;

export interface SceneSettings {
  vorticity: number;
  fade: number;
  glow: number;
  phoenixes: number;
  /** Creature ink weight. */
  weight: number;
  /** How much of a surface the ink film is: specular, and nothing else. */
  sheen: number;
}

/** A tap, a double-tap, or a press of the space bar. */
export interface Burst {
  x: number;
  y: number;
  /** 1 for a tap, higher for a storm. */
  force: number;
  /** Whether it also releases a cloud of ink. */
  ink: boolean;
}

export interface SceneHandle {
  settings: SceneSettings;
  pointer: { x: number; y: number; on: boolean; px: number; py: number; held: number };
  /** Filled by React, emptied by the sketch. Never read back. */
  bursts: Burst[];
  reset: boolean;
}

/**
 * The ink, and how fast it loads.
 *
 * These are dye *rates*, not colours on a screen. The creatures print into the
 * dye additively every frame, so a pixel the dragon crosses collects a little
 * over each of the ten-odd frames the body takes to pass, and the composite
 * then reads the total as thickness. At full strength each of these would be
 * opaque in two frames and the whole frame would be a white smear inside a
 * second — which is exactly what happened the first time.
 */
const RATE = 0.028;
const INK: [number, number, number] = [70, 108, 208];
const GOLD: [number, number, number] = [214, 168, 74];
const FIRE: [number, number, number] = [230, 92, 40];

export function makeSketch(w: number, h: number, handle: SceneHandle) {
  return (q: p5) => {
    let fluid: Fluid;
    let dragon: Dragon;
    let composite: p5.Shader;
    const birds: Phoenix[] = [];
    let stir = 0;

    const bounds = { w: 0, h: 0 };

    q.setup = () => {
      q.createCanvas(w, h, q.WEBGL);
      q.pixelDensity(Math.min(1.5, window.devicePixelRatio || 1));

      // The dye carries every filament you can see; the velocity field is
      // smooth and gets a quarter of the resolution and twenty times the work.
      const dyeW = Math.max(256, Math.min(900, Math.round(w * 0.7)));
      const dyeH = Math.round((dyeW * h) / w);
      const simW = Math.round(dyeW / 2);
      const simH = Math.round(dyeH / 2);
      fluid = new Fluid(q, simW, simH, dyeW, dyeH);
      bounds.w = dyeW;
      bounds.h = dyeH;

      // Size is set off the *long* edge, because that is what the dragon lies
      // along: at 36 nodes it is 396 scale-units end to end, and half the long
      // edge is the length that leaves room for it to curve. Set off the short
      // edge instead — which is the obvious thing — and on a phone the animal
      // is longer than the picture it is in.
      const scale = Math.max(dyeW, dyeH) / 800;
      dragon = new Dragon(bounds, scale, 0.35);
      for (let i = 0; i < 3; i++) birds.push(new Phoenix(bounds, scale * 0.55, i * 1.9 + 0.4));

      composite = q.createShader(FULLSCREEN, COMPOSITE);
      q.noStroke();
    };

    q.draw = () => {
      if (!fluid) return;
      const s = handle.settings;
      const dt = Math.min(1 / 24, Math.max(1 / 240, q.deltaTime / 1000));

      if (handle.reset) {
        handle.reset = false;
        fluid.clear();
      }

      // Where the pointer is, in dye pixels.
      const p = {
        x: handle.pointer.x * bounds.w,
        y: handle.pointer.y * bounds.h,
        on: handle.pointer.on,
      };

      dragon.update(dt, bounds, p);
      const want = Math.max(0, Math.min(3, Math.round(s.phoenixes)));
      for (let i = 0; i < want; i++) birds[i].update(dt, bounds, p);

      // Everything pushing the water this frame.
      const splats: Splat[] = dragon.pushes(bounds);
      for (let i = 0; i < want; i++) splats.push(...birds[i].pushes(bounds));

      // A slow ambient stir, so the water is alive before anything swims in it.
      stir += dt;
      for (let i = 0; i < 2; i++) {
        const a = stir * (0.31 + i * 0.17) + i * 2.1;
        splats.push({
          x: 0.5 + Math.cos(a) * 0.36,
          y: 0.5 + Math.sin(a * 1.3) * 0.32,
          v: [Math.cos(a * 2.2) * 30, Math.sin(a * 1.7) * 30, 0],
          r: 0.004,
        });
      }

      // A finger through the water.
      const drawn: Burst[] = [];
      if (handle.pointer.on) {
        const dx = handle.pointer.x - handle.pointer.px;
        const dy = handle.pointer.y - handle.pointer.py;
        const moved = Math.abs(dx) + Math.abs(dy);
        if (moved > 0.0005) {
          splats.push({
            x: handle.pointer.x,
            y: handle.pointer.y,
            v: [dx * 16000, dy * 16000, 0],
            r: 0.0009,
          });
          // A finger drawn through ink leaves ink. The stroke is put down at a
          // rate rather than a fixed amount, so a slow careful line and a fast
          // flick lay the same weight per centimetre of water.
          drawn.push({ x: handle.pointer.x, y: handle.pointer.y, force: 0, ink: true });
        }
        handle.pointer.px = handle.pointer.x;
        handle.pointer.py = handle.pointer.y;
      }

      // Taps and storms. A burst is a ring of outward shoves rather than one
      // vector, because a single splat at a point is a *jet* — it picks a
      // direction and throws the water that way. Twelve of them around a small
      // circle, all pointing out, is what a drop landing actually does, and
      // the pressure solve turns the ring into a vortex a moment later.
      const bursts = handle.bursts.splice(0, handle.bursts.length);
      for (const b of bursts) {
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * Math.PI * 2;
          const rr = 0.02;
          splats.push({
            x: b.x + Math.cos(a) * rr,
            y: b.y + Math.sin(a) * rr,
            v: [Math.cos(a) * 900 * b.force, Math.sin(a) * 900 * b.force, 0],
            r: 0.0007,
          });
        }
      }

      fluid.pushVelocity(splats, dt * 60);

      // `bird` is separate from `k` because the two passes want different
      // balances: in the water the phoenixes only need to be lighter than the
      // dragon, but in the sharp pass they need to stay *thin*, or absorption
      // turns four feathered plumes into four black tubes.
      const cast = (k: number, bird: number) => () => {
        const b = k * bird;
        for (let i = 0; i < want; i++) {
          birds[i].draw(q, [FIRE[0] * b, FIRE[1] * b, FIRE[2] * b],
            [GOLD[0] * b, GOLD[1] * b, GOLD[2] * b]);
        }
        dragon.draw(q, [INK[0] * k, INK[1] * k, INK[2] * k],
          [GOLD[0] * k, GOLD[1] * k, GOLD[2] * k]);
      };

      fluid.paint(() => {
        cast(s.weight * RATE * dt * 60, 0.62)();
        // Whatever the hand put down this frame, in the third ink. It is
        // neither the dragon's blue nor the phoenix's orange, so a stroke you
        // drew stays yours as it comes apart.
        q.fill(58 * s.weight, 132 * s.weight, 118 * s.weight);
        for (const b of drawn) {
          q.ellipse(b.x * bounds.w, b.y * bounds.h, 26 * dt * 60, 26 * dt * 60);
        }
        for (const b of bursts) {
          if (!b.ink) continue;
          q.fill(90 * s.weight, 150 * s.weight, 130 * s.weight);
          q.ellipse(b.x * bounds.w, b.y * bounds.h, 34 * b.force, 34 * b.force);
        }
      });
      // Far heavier than what goes into the water. The absorption in the
      // composite separates the creature from its wake *by thickness*, and it
      // can only do that if the two are actually at different thicknesses.
      fluid.paintSharp(cast(s.weight * 1.15, 0.42));

      fluid.step(dt, s.vorticity, 0.998, s.fade, 18);

      q.clear();
      q.shader(composite);
      composite.setUniform('uDye', fluid.dyeTexture);
      composite.setUniform('uSharp', fluid.sharpTexture);
      composite.setUniform('uVel', fluid.velTexture);
      composite.setUniform('uTexel', [1 / fluid.dyeW, 1 / fluid.dyeH]);
      composite.setUniform('uTime', q.millis() / 1000);
      composite.setUniform('uGlow', s.glow);
      composite.setUniform('uAspect', w / h);
      composite.setUniform('uCrisp', 1.6);
      composite.setUniform('uSheen', s.sheen);
      composite.setUniform('uTouch', [
        handle.pointer.x,
        handle.pointer.y,
        handle.pointer.on ? 0.1 + 0.5 * Math.min(1, handle.pointer.held) : 0,
      ]);
      // p5 hands back framebuffer textures the other way up from the space the
      // shapes were drawn in. One uniform, set once, rather than a flip
      // scattered through every pass.
      composite.setUniform('uFlip', 1);
      q.rect(0, 0, q.width, q.height);
    };
  };
}
