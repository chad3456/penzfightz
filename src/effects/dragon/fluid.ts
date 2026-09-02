import type p5 from 'p5';

/**
 * Ink in water.
 *
 * A proper incompressible fluid, solved on the GPU in p5's own framebuffers.
 * The pressure projection is the part that matters and the part that is
 * tempting to skip: without it, dye pushed into the field simply *spreads*, and
 * spreading is what smoke does. Ink in water does something else — it is shoved
 * sideways by water that has nowhere to go, so it sheets, folds back on itself
 * and draws out into filaments. Every one of those is the divergence-free
 * constraint being enforced, and none of them can be faked with a blur.
 *
 * The loop is Stam's, in the order everybody runs it:
 *
 * 1. **advect** the velocity by itself — semi-Lagrangian, so it is stable at
 *    any timestep, which is the whole reason this method won;
 * 2. **splat** whatever is pushing this frame;
 * 3. **curl** and **vorticity confinement**, because steps 1 and 4 both bleed
 *    away small eddies and a fluid with no small eddies looks like syrup;
 * 4. **divergence**, then a run of Jacobi iterations for **pressure**;
 * 5. **subtract the pressure gradient**, which is what makes it incompressible;
 * 6. **advect the dye** by the field that came out.
 *
 * ### Two resolutions
 *
 * Velocity and pressure run at a quarter of the dye's resolution. That is not a
 * compromise, it is how these are built: the velocity field is smooth and low
 * frequency, and the twenty-odd passes a frame all happen on it, while the dye
 * is a single advection and is where every visible filament lives. Running both
 * at dye resolution costs about four times as much for a picture nobody can
 * tell apart.
 */

const VERT = `
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

/** A splat covers only its own neighbourhood, so it costs what it looks like. */
const SPLAT_VERT = `
precision highp float;
attribute vec3 aPosition;
varying vec2 vUv;
uniform vec4 uRect;
void main() {
  vUv = uRect.xy + aPosition.xy * uRect.zw;
  gl_Position = vec4(vUv * 2.0 - 1.0, 0.0, 1.0);
}
`;

const ADVECT = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uSrc;
uniform sampler2D uVel;
uniform vec2 uTexel;
uniform float uDt;
uniform float uDiss;
void main() {
  vec2 v = texture2D(uVel, vUv).xy;
  vec2 c = vUv - v * uDt * uTexel;
  gl_FragColor = texture2D(uSrc, c) * uDiss;
}
`;

const DIVERGENCE = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uVel;
uniform vec2 uTexel;
void main() {
  float l = texture2D(uVel, vUv - vec2(uTexel.x, 0.0)).x;
  float r = texture2D(uVel, vUv + vec2(uTexel.x, 0.0)).x;
  float b = texture2D(uVel, vUv - vec2(0.0, uTexel.y)).y;
  float t = texture2D(uVel, vUv + vec2(0.0, uTexel.y)).y;
  gl_FragColor = vec4(0.5 * (r - l + t - b), 0.0, 0.0, 1.0);
}
`;

const JACOBI = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uPrs;
uniform sampler2D uDiv;
uniform vec2 uTexel;
void main() {
  float l = texture2D(uPrs, vUv - vec2(uTexel.x, 0.0)).x;
  float r = texture2D(uPrs, vUv + vec2(uTexel.x, 0.0)).x;
  float b = texture2D(uPrs, vUv - vec2(0.0, uTexel.y)).x;
  float t = texture2D(uPrs, vUv + vec2(0.0, uTexel.y)).x;
  float d = texture2D(uDiv, vUv).x;
  gl_FragColor = vec4((l + r + b + t - d) * 0.25, 0.0, 0.0, 1.0);
}
`;

const GRADIENT = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uPrs;
uniform sampler2D uVel;
uniform vec2 uTexel;
void main() {
  float l = texture2D(uPrs, vUv - vec2(uTexel.x, 0.0)).x;
  float r = texture2D(uPrs, vUv + vec2(uTexel.x, 0.0)).x;
  float b = texture2D(uPrs, vUv - vec2(0.0, uTexel.y)).x;
  float t = texture2D(uPrs, vUv + vec2(0.0, uTexel.y)).x;
  vec2 v = texture2D(uVel, vUv).xy - vec2(r - l, t - b) * 0.5;
  gl_FragColor = vec4(v, 0.0, 1.0);
}
`;

const CURL = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uVel;
uniform vec2 uTexel;
void main() {
  float l = texture2D(uVel, vUv - vec2(uTexel.x, 0.0)).y;
  float r = texture2D(uVel, vUv + vec2(uTexel.x, 0.0)).y;
  float b = texture2D(uVel, vUv - vec2(0.0, uTexel.y)).x;
  float t = texture2D(uVel, vUv + vec2(0.0, uTexel.y)).x;
  gl_FragColor = vec4(0.5 * ((r - l) - (t - b)), 0.0, 0.0, 1.0);
}
`;

/**
 * Vorticity confinement.
 *
 * Semi-Lagrangian advection is unconditionally stable and it pays for that with
 * numerical viscosity: every step quietly smooths the field, and the first
 * thing to go is the smallest eddy. Left alone the water turns to syrup in
 * about ten seconds. This finds where the curl is strongest and pushes energy
 * back *towards* it, which is a lie with a long history — it puts back roughly
 * what the solver took, and the swirls hold.
 */
const VORTICITY = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uVel;
uniform sampler2D uCurl;
uniform vec2 uTexel;
uniform float uAmount;
uniform float uDt;
void main() {
  float l = texture2D(uCurl, vUv - vec2(uTexel.x, 0.0)).x;
  float r = texture2D(uCurl, vUv + vec2(uTexel.x, 0.0)).x;
  float b = texture2D(uCurl, vUv - vec2(0.0, uTexel.y)).x;
  float t = texture2D(uCurl, vUv + vec2(0.0, uTexel.y)).x;
  float c = texture2D(uCurl, vUv).x;

  vec2 grad = vec2(abs(r) - abs(l), abs(t) - abs(b)) * 0.5;
  grad /= length(grad) + 1e-4;
  vec2 force = vec2(grad.y, -grad.x) * c * uAmount;
  gl_FragColor = vec4(texture2D(uVel, vUv).xy + force * uDt, 0.0, 1.0);
}
`;

/** One gaussian of force, or of colour, added where it lands. */
const SPLAT = `
precision highp float;
varying vec2 vUv;
uniform vec2 uAt;
uniform vec3 uValue;
uniform float uRadius;
uniform float uAspect;
void main() {
  vec2 d = (vUv - uAt) * vec2(uAspect, 1.0);
  float k = exp(-dot(d, d) / uRadius);
  gl_FragColor = vec4(uValue * k, 1.0);
}
`;

export interface Splat {
  x: number;
  y: number;
  /** Force for velocity, colour for dye. */
  v: [number, number, number];
  r: number;
}

export class Fluid {
  private readonly q: p5;
  private vel: [p5.Framebuffer, p5.Framebuffer];
  private dye: [p5.Framebuffer, p5.Framebuffer];
  private div: p5.Framebuffer;
  private prs: [p5.Framebuffer, p5.Framebuffer];
  private curl: p5.Framebuffer;
  /** This frame's creatures, sharp. Cleared and redrawn every frame. */
  private sharp: p5.Framebuffer;
  private a = 0;
  private b = 0;
  private pa = 0;
  private readonly sh: Record<string, p5.Shader>;
  readonly simW: number;
  readonly simH: number;
  readonly dyeW: number;
  readonly dyeH: number;

  constructor(q: p5, simW: number, simH: number, dyeW: number, dyeH: number) {
    this.q = q;
    this.simW = simW;
    this.simH = simH;
    this.dyeW = dyeW;
    this.dyeH = dyeH;

    const fbo = (w: number, h: number) =>
      q.createFramebuffer({
        width: w,
        height: h,
        // Half float: velocity and pressure are signed and small, and blending
        // signed values into a full float target is an extension away.
        format: (q as unknown as { HALF_FLOAT: never }).HALF_FLOAT,
        channels: (q as unknown as { RGBA: never }).RGBA,
        depth: false,
        antialias: false,
        density: 1,
        textureFiltering: (q as unknown as { LINEAR: never }).LINEAR,
      });

    this.vel = [fbo(simW, simH), fbo(simW, simH)];
    this.dye = [fbo(dyeW, dyeH), fbo(dyeW, dyeH)];
    this.div = fbo(simW, simH);
    this.prs = [fbo(simW, simH), fbo(simW, simH)];
    this.curl = fbo(simW, simH);
    this.sharp = fbo(dyeW, dyeH);

    this.sh = {
      advect: q.createShader(VERT, ADVECT),
      divergence: q.createShader(VERT, DIVERGENCE),
      jacobi: q.createShader(VERT, JACOBI),
      gradient: q.createShader(VERT, GRADIENT),
      curl: q.createShader(VERT, CURL),
      vorticity: q.createShader(VERT, VORTICITY),
      splat: q.createShader(SPLAT_VERT, SPLAT),
    };
  }

  get dyeTexture() {
    return this.dye[this.b].color;
  }

  get velTexture() {
    return this.vel[this.a].color;
  }

  get sharpTexture() {
    return this.sharp.color;
  }

  /** Full-screen pass into `to`. */
  private pass(to: p5.Framebuffer, shader: p5.Shader, set: (s: p5.Shader) => void) {
    const q = this.q;
    to.begin();
    q.clear();
    q.shader(shader);
    set(shader);
    q.noStroke();
    q.rect(0, 0, to.width, to.height);
    to.end();
  }

  /**
   * Everything the creatures are pushing this frame, added to the velocity.
   *
   * `gain` is how much of a frame this is: forces are given per sixtieth of a
   * second, so a slow machine pushes proportionally harder and the water moves
   * at the same speed on both.
   */
  pushVelocity(splats: Splat[], gain = 1) {
    if (!splats.length) return;
    const q = this.q;
    const target = this.vel[this.a];
    const aspect = this.simW / this.simH;
    target.begin();
    q.blendMode(q.ADD);
    q.shader(this.sh.splat);
    q.noStroke();
    for (const s of splats) {
      const rad = Math.sqrt(s.r) * 2.2;
      this.sh.splat.setUniform('uAt', [s.x, s.y]);
      this.sh.splat.setUniform('uValue', [s.v[0] * gain, s.v[1] * gain, s.v[2] * gain]);
      this.sh.splat.setUniform('uRadius', s.r);
      this.sh.splat.setUniform('uAspect', aspect);
      this.sh.splat.setUniform('uRect', [
        s.x - rad / aspect, s.y - rad, (rad * 2) / aspect, rad * 2,
      ]);
      q.rect(0, 0, 1, 1);
    }
    q.blendMode(q.BLEND);
    target.end();
  }

  /**
   * Draw into the dye directly.
   *
   * The creatures are shapes, not splats. A splat can push water about but it
   * cannot be a dragon — and the whole point is that you can see what is
   * swimming. So they are drawn as geometry, additively, and then the solver
   * takes the wake away from them.
   */
  paint(fn: () => void) {
    this.into(this.dye[this.b], false, fn);
  }

  /**
   * Draw the creatures again, into a buffer of their own that is thrown away
   * every frame.
   *
   * The first build had only the dye, and it was wrong in a way that took a
   * screenshot to see: the creatures print into a buffer that *accumulates*,
   * so within two seconds their own wake was thicker than they were and the
   * dragon was somewhere inside a cloud. What you actually want is the
   * composition every ink painting of this subject uses — a sharp animal in
   * front of a dissolving one. So the same shapes go down twice: lightly into
   * the water, where they smear and are gone in a second; and at full strength
   * into this, which holds nothing.
   */
  paintSharp(fn: () => void) {
    this.into(this.sharp, true, fn);
  }

  private into(target: p5.Framebuffer, wipe: boolean, fn: () => void) {
    const q = this.q;
    target.begin();
    if (wipe) q.clear();
    q.push();
    q.resetShader();
    q.blendMode(q.ADD);
    q.translate(-target.width / 2, -target.height / 2);
    q.noStroke();
    fn();
    q.blendMode(q.BLEND);
    q.pop();
    target.end();
  }

  step(dt: number, vorticity: number, velDiss: number, dyeDiss: number, iterations: number) {
    const simTexel: [number, number] = [1 / this.simW, 1 / this.simH];
    const dyeTexel: [number, number] = [1 / this.dyeW, 1 / this.dyeH];

    // Dissipation is quoted per sixtieth of a second and raised to however
    // much of one this frame actually was. Applied once per frame instead, a
    // machine running at ten frames a second keeps 0.975^10 of its ink each
    // second where a fast one keeps 0.975^60 — and the slow machine silts up
    // solid white in about eight seconds. Which is exactly what it did.
    const f = dt * 60;
    const velD = Math.pow(velDiss, f);
    const dyeD = Math.pow(dyeDiss, f);

    // 1 · the field carries itself.
    this.pass(this.vel[1 - this.a], this.sh.advect, (s) => {
      s.setUniform('uSrc', this.vel[this.a].color);
      s.setUniform('uVel', this.vel[this.a].color);
      s.setUniform('uTexel', simTexel);
      s.setUniform('uDt', dt);
      s.setUniform('uDiss', velD);
    });
    this.a = 1 - this.a;

    // 2 · put back the eddies the advection just ate.
    this.pass(this.curl, this.sh.curl, (s) => {
      s.setUniform('uVel', this.vel[this.a].color);
      s.setUniform('uTexel', simTexel);
    });
    this.pass(this.vel[1 - this.a], this.sh.vorticity, (s) => {
      s.setUniform('uVel', this.vel[this.a].color);
      s.setUniform('uCurl', this.curl.color);
      s.setUniform('uTexel', simTexel);
      s.setUniform('uAmount', vorticity);
      s.setUniform('uDt', dt);
    });
    this.a = 1 - this.a;

    // 3 · make it incompressible. Everything that reads as *ink* rather than
    // as smoke happens in these four lines.
    this.pass(this.div, this.sh.divergence, (s) => {
      s.setUniform('uVel', this.vel[this.a].color);
      s.setUniform('uTexel', simTexel);
    });
    this.prs[0].begin();
    this.q.clear();
    this.prs[0].end();
    this.pa = 0;
    for (let i = 0; i < iterations; i++) {
      this.pass(this.prs[1 - this.pa], this.sh.jacobi, (s) => {
        s.setUniform('uPrs', this.prs[this.pa].color);
        s.setUniform('uDiv', this.div.color);
        s.setUniform('uTexel', simTexel);
      });
      this.pa = 1 - this.pa;
    }
    this.pass(this.vel[1 - this.a], this.sh.gradient, (s) => {
      s.setUniform('uPrs', this.prs[this.pa].color);
      s.setUniform('uVel', this.vel[this.a].color);
      s.setUniform('uTexel', simTexel);
    });
    this.a = 1 - this.a;

    // 4 · and the ink goes where the water went.
    this.pass(this.dye[1 - this.b], this.sh.advect, (s) => {
      s.setUniform('uSrc', this.dye[this.b].color);
      s.setUniform('uVel', this.vel[this.a].color);
      s.setUniform('uTexel', dyeTexel);
      s.setUniform('uDt', dt);
      s.setUniform('uDiss', dyeD);
    });
    this.b = 1 - this.b;
  }

  clear() {
    const q = this.q;
    for (const f of [...this.vel, ...this.dye, ...this.prs, this.div, this.curl, this.sharp]) {
      f.begin();
      q.clear();
      f.end();
    }
  }
}
