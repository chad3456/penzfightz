import * as THREE from 'three';

/**
 * A height field with a wave equation on it.
 *
 * This is the piece the pool is actually built on, and it is worth being clear
 * about what it is *not*: it is not a sum of sine waves, and it is not a
 * scrolling normal map. Both of those look like water until something touches
 * them, and then they carry on looking exactly the same, which is the moment
 * the illusion dies. Here a finger in the water puts energy into a grid and the
 * grid does the rest — the ring expands, thins, reflects off the tiled wall,
 * comes back, and meets the next ring with interference you did not author.
 *
 * The whole thing is the discretised wave equation, which is three lines:
 *
 * ```
 * lap  = (left + right + up + down) − 4·h
 * next = 2·h − h_previous + c²·lap
 * next = next · damping
 * ```
 *
 * Two states have to be kept, not one — `h` now and `h` a step ago — because
 * the equation is second order in time. That is the entire difference between
 * water and jelly: with one state you get diffusion, and the surface sags back
 * to flat without ever overshooting. Waves exist because the surface carries
 * *momentum* through the flat position and out the other side.
 *
 * ### The two numbers that will bite you
 *
 * `c²` is not a look control, it is a **stability limit**. Explicit integration
 * of this stencil blows up above 0.5, and 'blows up' means the whole pool goes
 * to NaN in about four frames and the screen turns black. It sits at 0.28.
 *
 * Damping is applied to the *whole* term rather than to the velocity, which
 * loses a little physical honesty and buys the thing that matters: energy
 * always decreases, so a pool left alone always returns to glass rather than
 * ringing forever at the grid frequency.
 *
 * ### The edges are free
 *
 * A clamped texture returns the edge texel for any lookup past the edge, so at
 * the boundary the Laplacian sees itself as its own neighbour and the wave
 * reflects. That is a hard wall, which is exactly what the side of a swimming
 * pool is, and it costs nothing.
 */

const VERT = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const STEP = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uPrev;
uniform vec2 uPx;
uniform float uSpeed;
uniform float uDamp;

void main() {
  vec4 c = texture2D(uPrev, vUv);
  float h = c.r;
  float old = c.g;
  float l = texture2D(uPrev, vUv - vec2(uPx.x, 0.0)).r;
  float r = texture2D(uPrev, vUv + vec2(uPx.x, 0.0)).r;
  float d = texture2D(uPrev, vUv - vec2(0.0, uPx.y)).r;
  float u = texture2D(uPrev, vUv + vec2(0.0, uPx.y)).r;

  float lap = (l + r + d + u) - 4.0 * h;
  float next = (2.0 * h - old + lap * uSpeed) * uDamp;

  // The slope goes out in ba for nothing: every consumer of this texture wants
  // the surface normal, and computing it here saves them four taps each.
  gl_FragColor = vec4(next, h, (r - l), (u - d));
}
`;

const DROP = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uPrev;
uniform vec3 uDrop;
uniform float uRadius;
uniform float uAspect;

void main() {
  vec4 c = texture2D(uPrev, vUv);
  vec2 d = (vUv - uDrop.xy) * vec2(uAspect, 1.0);
  // A cosine bump rather than a gaussian: it reaches exactly zero at the rim,
  // so a drop does not quietly raise the level of the entire pool.
  float k = clamp(1.0 - length(d) / uRadius, 0.0, 1.0);
  gl_FragColor = vec4(c.r + uDrop.z * (1.0 - cos(k * 3.14159)) * 0.5, c.gba);
}
`;

const QUAD = new THREE.PlaneGeometry(2, 2);
const CAM = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

function target(w: number, h: number) {
  return new THREE.WebGLRenderTarget(w, h, {
    type: THREE.HalfFloatType,
    format: THREE.RGBAFormat,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    wrapS: THREE.ClampToEdgeWrapping,
    wrapT: THREE.ClampToEdgeWrapping,
    depthBuffer: false,
    stencilBuffer: false,
  });
}

export class Ripples {
  private readonly renderer: THREE.WebGLRenderer;
  private rt: [THREE.WebGLRenderTarget, THREE.WebGLRenderTarget];
  private a = 0;
  private readonly scene = new THREE.Scene();
  private readonly step: THREE.Mesh;
  private readonly drop: THREE.Mesh;
  readonly w: number;
  readonly h: number;

  /**
   * The grid may be rectangular, but its *texels* must be square in world
   * terms — the five-point Laplacian assumes an even spacing on both axes, and
   * feeding it a stretched grid gives a pool where ripples travel faster along
   * the lanes than across them. Which is a nice effect, and is not water.
   */
  constructor(renderer: THREE.WebGLRenderer, w = 256, h = 256) {
    this.renderer = renderer;
    this.w = w;
    this.h = h;
    this.rt = [target(w, h), target(w, h)];

    const mk = (fragmentShader: string, uniforms: Record<string, THREE.IUniform>) =>
      new THREE.Mesh(
        QUAD,
        new THREE.ShaderMaterial({
          vertexShader: VERT,
          fragmentShader,
          uniforms,
          depthTest: false,
          depthWrite: false,
        }),
      );

    this.step = mk(STEP, {
      uPrev: { value: null },
      uPx: { value: new THREE.Vector2(1 / w, 1 / h) },
      // Above 0.5 the explicit stencil is unstable; this is not a look knob.
      uSpeed: { value: 0.28 },
      uDamp: { value: 0.996 },
    });
    this.drop = mk(DROP, {
      uPrev: { value: null },
      uDrop: { value: new THREE.Vector3() },
      uRadius: { value: 0.03 },
      uAspect: { value: w / h },
    });
    this.clear();
  }

  private draw(mesh: THREE.Mesh, to: THREE.WebGLRenderTarget) {
    const auto = this.renderer.autoClear;
    this.renderer.autoClear = false;
    this.scene.clear();
    this.scene.add(mesh);
    this.renderer.setRenderTarget(to);
    this.renderer.render(this.scene, CAM);
    this.renderer.setRenderTarget(null);
    this.scene.remove(mesh);
    this.renderer.autoClear = auto;
  }

  clear() {
    const colour = this.renderer.getClearColor(new THREE.Color());
    const alpha = this.renderer.getClearAlpha();
    this.renderer.setClearColor(0x000000, 1);
    for (const t of this.rt) {
      this.renderer.setRenderTarget(t);
      this.renderer.clear(true, false, false);
    }
    this.renderer.setRenderTarget(null);
    this.renderer.setClearColor(colour, alpha);
  }

  /** `x`, `y` in 0..1 across the field. */
  splash(x: number, y: number, strength: number, radius = 0.035) {
    const u = (this.drop.material as THREE.ShaderMaterial).uniforms;
    u.uDrop.value.set(x, y, strength);
    u.uRadius.value = radius;
    u.uPrev.value = this.rt[this.a].texture;
    this.draw(this.drop, this.rt[1 - this.a]);
    this.a = 1 - this.a;
  }

  advance(steps = 1) {
    const u = (this.step.material as THREE.ShaderMaterial).uniforms;
    for (let i = 0; i < steps; i++) {
      u.uPrev.value = this.rt[this.a].texture;
      this.draw(this.step, this.rt[1 - this.a]);
      this.a = 1 - this.a;
    }
  }

  set damping(v: number) {
    (this.step.material as THREE.ShaderMaterial).uniforms.uDamp.value = v;
  }

  get texture() {
    return this.rt[this.a].texture;
  }

  dispose() {
    for (const t of this.rt) t.dispose();
    for (const m of [this.step, this.drop]) (m.material as THREE.ShaderMaterial).dispose();
  }
}
