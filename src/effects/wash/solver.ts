import * as THREE from 'three';
import { paperTexture } from './paper';
import type { Pigment } from './pigment';

/**
 * A watercolour wash, solved on the GPU.
 *
 * The crayon study next door deposits marks: for every pixel of every stroke it
 * asks whether the pressure beats the tooth, and the answer is final. Water
 * cannot be done that way, because in watercolour **the mark is not where the
 * paint ends up**. You put pigment down and then the sheet decides — it runs
 * downhill, it piles against the edge of the wet patch, it drops into the pits
 * of the paper, and it does all of that for several seconds after your hand has
 * left. So this is a simulation, not a renderer, and it runs as a pair of
 * fragment shaders ping-ponged across a couple of float targets.
 *
 * Two textures carry the whole state:
 *
 * - **flow** — `r` water depth, `g` the wet mask, `ba` velocity.
 * - **pigment** — `rg` the two pigments still suspended in the water, `ba` the
 *   two already dropped onto the fibre.
 *
 * and one step is two passes over them.
 *
 * ### Where the look actually comes from
 *
 * **Edge darkening — the one that makes it read as watercolour.** Velocity is
 * driven by the gradient of the water surface, so inside a puddle the flow
 * points *outwards*, from deep water at the middle to the thin film at the rim.
 * Pigment rides that flow to the boundary and cannot cross it, and as the film
 * thins it drops out of suspension. So every wash paints its own dark rim
 * without anything in the code drawing an outline. This is the single detail
 * that separates a watercolour from an airbrush, and it is emergent.
 *
 * **Granulation.** Heavy pigments settle faster where the paper is low, so
 * deposition is scaled by the tooth. Ultramarine turns the sheet's texture into
 * the subject; a staining pigment on the same paper does nothing of the kind.
 *
 * **Backruns.** Drop clean water into a wash that has begun to set and it
 * shoves the pigment outwards into a hard-edged cauliflower. That is one extra
 * pass, run at a chosen moment, and it is the accident every watercolourist
 * knows by name.
 *
 * **Lifting.** Pigment already on the fibre can be picked back up, and how much
 * depends on the pigment's staining. It is why a second stroke through a first
 * *moves* the first one rather than covering it.
 *
 * ### Why the incompressibility is missing on purpose
 *
 * A proper shallow-water solver projects the velocity field to be divergence
 * free. This one does not, and the omission is the point: a film of water on
 * paper is not a closed system — it soaks in, it evaporates, and it genuinely
 * does spread outward from where it is deep. Adding the projection made the
 * washes calmer and less like paint, and cost three more passes a step.
 */

const QUAD = new THREE.PlaneGeometry(2, 2);
const CAM = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

const VERT = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

/** Water: depth, the wet mask, and velocity. */
const FLOW = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uFlow;
uniform sampler2D uPaper;
uniform vec2 uPx;
uniform vec2 uTilt;
uniform float uPaperScale;
uniform float uDry;
uniform float uGrain;
uniform float uSpread;
uniform float uPush;

float tooth(vec2 uv) { return texture2D(uPaper, uv * uPaperScale).r; }

void main() {
  vec4 c = texture2D(uFlow, vUv);
  float h = c.r;
  float wet = c.g;
  vec2 v = c.ba;

  vec4 l = texture2D(uFlow, vUv - vec2(uPx.x, 0.0));
  vec4 r = texture2D(uFlow, vUv + vec2(uPx.x, 0.0));
  vec4 d = texture2D(uFlow, vUv - vec2(0.0, uPx.y));
  vec4 u = texture2D(uFlow, vUv + vec2(0.0, uPx.y));

  // Water finds its level, and finds it faster along the valleys of the sheet.
  // Scaling diffusion by the tooth is what makes the front of a wash ragged at
  // the scale of the paper rather than smoothly circular.
  float th = tooth(vUv);
  float ease = 1.0 - uGrain * (th - 0.5);
  float lap = (l.r + r.r + d.r + u.r - 4.0 * h);
  h += lap * uSpread * ease;

  // Capillary creep: a cell next to standing water wets itself, more readily
  // downhill. This is the only way the wash gets outside where the brush went.
  float near = max(max(l.r, r.r), max(d.r, u.r));
  wet = max(wet, step(0.055, near) * step(h + 0.02, near));

  // Drying. The green channel of the sheet is how thin the sizing is, so a
  // wash dries in blotches the way a real one does rather than uniformly.
  float absorb = texture2D(uPaper, vUv * uPaperScale).g;
  h -= uDry * (0.55 + absorb * 0.9);
  h = max(h, 0.0);
  if (h < 0.012) { wet = 0.0; h = 0.0; }

  // Momentum: downhill on the water surface, plus whatever the board is
  // propped at. No projection pass — see the note at the top of the file.
  vec2 grad = vec2(r.r - l.r, u.r - d.r) * 0.5;
  vec2 slope = vec2(tooth(vUv + vec2(uPx.x, 0.0)) - tooth(vUv - vec2(uPx.x, 0.0)),
                    tooth(vUv + vec2(0.0, uPx.y)) - tooth(vUv - vec2(0.0, uPx.y))) * 0.5;
  v += (-grad * 2.6 - slope * 0.09 * uGrain + uTilt * h * 0.06) * wet * uPush;
  v *= 0.84;
  float sp = length(v);
  if (sp > 0.3) v *= 0.3 / sp;
  v *= wet;

  gl_FragColor = vec4(h, wet, v);
}
`;

/** Pigment: advect, then trade between suspension and the fibre. */
const PIGMENT = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uPig;
uniform sampler2D uFlow;
uniform sampler2D uPaper;
uniform vec2 uPx;
uniform float uPaperScale;
uniform vec2 uSettle;
uniform vec2 uGranulate;
uniform vec2 uStain;
uniform float uMix;

void main() {
  vec4 f = texture2D(uFlow, vUv);
  float h = f.r;
  float wet = f.g;
  vec2 vel = f.ba;

  // Semi-Lagrangian: look back up the flow for where this pigment came from.
  // Dry paper upstream contributes nothing, or the wash would suck colour in
  // from outside itself.
  vec2 back = vUv - vel * uPx;
  vec4 src = texture2D(uPig, back);
  float srcWet = texture2D(uFlow, back).g;
  vec4 here = texture2D(uPig, vUv);
  vec4 p = mix(here, src, srcWet * wet);

  // A little lateral mixing, so two colours that meet while wet actually meet.
  vec2 sum = texture2D(uPig, vUv - vec2(uPx.x, 0.0)).rg
           + texture2D(uPig, vUv + vec2(uPx.x, 0.0)).rg
           + texture2D(uPig, vUv - vec2(0.0, uPx.y)).rg
           + texture2D(uPig, vUv + vec2(0.0, uPx.y)).rg;
  p.rg += (sum * 0.25 - p.rg) * uMix * wet;

  float th = texture2D(uPaper, vUv * uPaperScale).r;

  // The film thins, the pigment can no longer be carried, and it drops. This
  // one line is most of edge darkening: the rim of a wash is where the water
  // runs out first.
  float thin = 1.0 - smoothstep(0.0, 0.30, h);
  vec2 gran = 1.0 + uGranulate * (th - 0.5) * 2.4;
  vec2 down = p.rg * uSettle * (0.05 + 0.55 * thin) * gran;

  // And what is already down can be picked up again, unless it stained.
  float scrubbing = smoothstep(0.03, 0.3, h) * min(1.0, length(vel) * 5.0);
  vec2 up = p.ba * (1.0 - uStain) * 0.14 * scrubbing * wet;

  p.rg += up - down;
  p.ba += down - up;

  // When the sheet dries under it, whatever is still floating has nowhere left
  // to go and lands where it stands.
  if (wet < 0.5) { p.ba += p.rg; p.rg = vec2(0.0); }

  gl_FragColor = max(p, vec4(0.0));
}
`;

/** Seed the sheet from a loaded brush: pigment where it was laid, water with it. */
const LOAD = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uSrc;
uniform sampler2D uFlow;
uniform sampler2D uPig;
uniform float uWater;
uniform int uField;

void main() {
  vec4 s = texture2D(uSrc, vUv);
  if (uField == 0) {
    vec4 c = texture2D(uFlow, vUv);
    float h = c.r + s.b * uWater;
    float wet = max(c.g, step(0.004, s.b));
    gl_FragColor = vec4(h, wet, c.ba);
  } else {
    vec4 p = texture2D(uPig, vUv);
    gl_FragColor = vec4(p.rg + s.rg, p.ba);
  }
}
`;

/**
 * A backrun. Clean water dropped into a wash that has started to set, which
 * shoves the pigment it lands in outward into a hard-edged cauliflower.
 */
const BLOOM = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uFlow;
uniform vec3 uDrops[4];
uniform int uCount;
uniform float uAspect;

void main() {
  vec4 c = texture2D(uFlow, vUv);
  float add = 0.0;
  for (int i = 0; i < 4; i++) {
    if (i >= uCount) break;
    vec2 d = (vUv - uDrops[i].xy) * vec2(uAspect, 1.0);
    add += uDrops[i].z * exp(-dot(d, d) / 0.0022);
  }
  gl_FragColor = vec4(c.r + add * c.g, c.g, c.ba);
}
`;

/** The sheet, seen. Pigment thickness read as absorption, not as colour. */
const SHOW = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uPig;
uniform sampler2D uPaper;
uniform vec2 uPaperScale;
uniform vec3 uKCool;
uniform vec3 uKWarm;
uniform vec2 uGranulate;
uniform vec3 uWhite;
uniform float uWarp;

void main() {
  vec3 pap = texture2D(uPaper, vUv * uPaperScale).rgb;

  // The fluid is solved coarse because fluid is low frequency; the paper is
  // sampled fine. Nudging the lookup along the tooth's own gradient stamps the
  // sheet's high-frequency detail onto every wash edge, so the wash is ragged
  // at paper scale even though nothing at paper scale was ever simulated.
  vec2 e = vec2(1.0 / 512.0, 0.0);
  vec2 g = vec2(
    texture2D(uPaper, vUv * uPaperScale + e.xy).r - texture2D(uPaper, vUv * uPaperScale - e.xy).r,
    texture2D(uPaper, vUv * uPaperScale + e.yx).r - texture2D(uPaper, vUv * uPaperScale - e.yx).r);
  vec4 p = texture2D(uPig, vUv + g * uWarp);

  vec2 amount = p.ba + p.rg;

  // Granulation belongs here rather than in the solver: it is a property of
  // where the particles are sitting on the sheet, and the sheet has ten times
  // the resolution the water does.
  vec2 tooth = 1.0 + uGranulate * (pap.r - 0.5) * 1.5;
  amount *= tooth;
  amount *= 1.0 + (pap.b - 0.5) * 0.10;

  vec3 t = uKCool * amount.x + uKWarm * amount.y;
  vec3 col = uWhite * exp(-t);

  // Bare paper is not flat white: the tooth shades itself very slightly.
  float bare = exp(-2.0 * (amount.x + amount.y));
  col *= 1.0 - (0.5 - pap.r) * 0.055 * bare;
  col *= 1.0 - (0.5 - pap.g) * 0.02;

  // The faintest cool in the deepest darks; a two-pigment painting never has a
  // true black in it and should not look like it does.
  col = max(col, vec3(0.035, 0.036, 0.045));
  gl_FragColor = vec4(col, 1.0);
}
`;

function pass(fragment: string, uniforms: Record<string, THREE.IUniform>) {
  const m = new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: fragment,
    uniforms,
    depthTest: false,
    depthWrite: false,
  });
  return new THREE.Mesh(QUAD, m);
}

function target(w: number, h: number) {
  return new THREE.WebGLRenderTarget(w, h, {
    type: THREE.HalfFloatType,
    format: THREE.RGBAFormat,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    depthBuffer: false,
    stencilBuffer: false,
  });
}

export interface WashSettings {
  cool: Pigment;
  warm: Pigment;
  white: [number, number, number];
  /** How much water the brush carried. More water, looser painting. */
  wetness: number;
  /** Which way the board is propped, in sheet units. */
  tilt: [number, number];
  /** How strongly the paper's tooth pushes the water about. */
  grain: number;
  /** Steps to run before the sheet is called dry. */
  steps: number;
  /** Backruns: [x, y, strength] in 0..1 sheet coordinates. */
  drops: [number, number, number][];
  /** Which step to drop them on, as a fraction of the run. */
  dropAt: number;
}

export class Wash {
  private readonly renderer: THREE.WebGLRenderer;
  readonly w: number;
  readonly h: number;
  private flow: [THREE.WebGLRenderTarget, THREE.WebGLRenderTarget];
  private pig: [THREE.WebGLRenderTarget, THREE.WebGLRenderTarget];
  private a = 0;
  private readonly scene = new THREE.Scene();
  private readonly flowPass: THREE.Mesh;
  private readonly pigPass: THREE.Mesh;
  private readonly loadPass: THREE.Mesh;
  private readonly bloomPass: THREE.Mesh;
  private readonly showPass: THREE.Mesh;
  /** Sheet size relative to the card the constants were tuned on. */
  private readonly k: number;

  constructor(renderer: THREE.WebGLRenderer, w: number, h: number) {
    this.renderer = renderer;
    this.w = w;
    this.h = h;
    this.k = w / 120;
    this.flow = [target(w, h), target(w, h)];
    this.pig = [target(w, h), target(w, h)];

    const paper = paperTexture();
    const px = new THREE.Vector2(1 / w, 1 / h);

    this.flowPass = pass(FLOW, {
      uFlow: { value: null },
      uPaper: { value: paper },
      uPx: { value: px },
      uTilt: { value: new THREE.Vector2() },
      uPaperScale: { value: 1 },
      uDry: { value: 0.004 },
      uGrain: { value: 0.5 },
      uSpread: { value: 0.16 },
      uPush: { value: 1 },
    });
    this.pigPass = pass(PIGMENT, {
      uPig: { value: null },
      uFlow: { value: null },
      uPaper: { value: paper },
      uPx: { value: px },
      uPaperScale: { value: 1 },
      uSettle: { value: new THREE.Vector2(1, 1) },
      uGranulate: { value: new THREE.Vector2() },
      uStain: { value: new THREE.Vector2() },
      uMix: { value: 0.06 },
    });
    this.loadPass = pass(LOAD, {
      uSrc: { value: null },
      uFlow: { value: null },
      uPig: { value: null },
      uWater: { value: 1 },
      uField: { value: 0 },
    });
    this.bloomPass = pass(BLOOM, {
      uFlow: { value: null },
      uDrops: { value: [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(),
        new THREE.Vector3()] },
      uCount: { value: 0 },
      uAspect: { value: w / h },
    });
    this.showPass = pass(SHOW, {
      uPig: { value: null },
      uPaper: { value: paper },
      uPaperScale: { value: new THREE.Vector2(1, 1) },
      uKCool: { value: new THREE.Vector3() },
      uKWarm: { value: new THREE.Vector3() },
      uGranulate: { value: new THREE.Vector2() },
      uWhite: { value: new THREE.Vector3(1, 1, 1) },
      uWarp: { value: 0.02 },
    });
  }

  private draw(mesh: THREE.Mesh, to: THREE.WebGLRenderTarget | null) {
    this.scene.clear();
    this.scene.add(mesh);
    this.renderer.setRenderTarget(to);
    this.renderer.render(this.scene, CAM);
    this.scene.remove(mesh);
  }

  private u(mesh: THREE.Mesh) {
    return (mesh.material as THREE.ShaderMaterial).uniforms;
  }

  /** Wipe the sheet. Cheaper than allocating four more targets per painting. */
  clear() {
    const c = this.renderer.getClearColor(new THREE.Color());
    const alpha = this.renderer.getClearAlpha();
    this.renderer.setClearColor(0x000000, 0);
    for (const t of [...this.flow, ...this.pig]) {
      this.renderer.setRenderTarget(t);
      this.renderer.clear(true, false, false);
    }
    this.renderer.setRenderTarget(null);
    this.renderer.setClearColor(c, alpha);
    this.a = 0;
  }

  /** Lay a loaded brush onto the sheet. `src` is rg pigment, b water. */
  load(src: THREE.Texture, water: number) {
    const u = this.u(this.loadPass);
    u.uSrc.value = src;
    u.uWater.value = water;

    u.uField.value = 0;
    u.uFlow.value = this.flow[this.a].texture;
    this.draw(this.loadPass, this.flow[1 - this.a]);

    u.uField.value = 1;
    u.uPig.value = this.pig[this.a].texture;
    this.draw(this.loadPass, this.pig[1 - this.a]);

    this.a = 1 - this.a;
  }

  /** Let the sheet do what it does. */
  run(s: WashSettings) {
    const f = this.u(this.flowPass);
    const p = this.u(this.pigPass);
    f.uTilt.value.set(s.tilt[0], s.tilt[1]);
    f.uGrain.value = s.grain;
    // A print is the same painting on a bigger sheet, not a different one. Wet
    // in wet has to bleed the same *fraction* of the picture at any resolution,
    // and the only way to hold that is to scale the physics with the grid:
    // diffusion and push up with the cell count, drying down, and the caller
    // runs proportionally more steps. Every one of those is off by a power if
    // you guess, which is why they are worked out from one number.
    const k = this.k;
    f.uDry.value = (0.055 / Math.max(0.4, s.wetness)) / k;
    f.uSpread.value = (0.05 + s.wetness * 0.05) * k;
    f.uPush.value = k;
    p.uSettle.value.set(s.cool.settle * 0.16, s.warm.settle * 0.16);
    p.uGranulate.value.set(s.cool.granulate, s.warm.granulate);
    p.uStain.value.set(s.cool.stain, s.warm.stain);
    p.uMix.value = (0.02 + s.wetness * 0.035) * k;

    const dropOn = Math.round(s.steps * s.dropAt);
    for (let i = 0; i < s.steps; i++) {
      if (i === dropOn && s.drops.length) {
        const b = this.u(this.bloomPass);
        const arr = b.uDrops.value as THREE.Vector3[];
        for (let k = 0; k < 4; k++) {
          const d = s.drops[k];
          arr[k].set(d ? d[0] : 0, d ? d[1] : 0, d ? d[2] : 0);
        }
        b.uCount.value = Math.min(4, s.drops.length);
        b.uFlow.value = this.flow[this.a].texture;
        this.draw(this.bloomPass, this.flow[1 - this.a]);
        this.a = 1 - this.a;
      }

      f.uFlow.value = this.flow[this.a].texture;
      this.draw(this.flowPass, this.flow[1 - this.a]);
      p.uPig.value = this.pig[this.a].texture;
      p.uFlow.value = this.flow[1 - this.a].texture;
      this.draw(this.pigPass, this.pig[1 - this.a]);
      this.a = 1 - this.a;
    }
  }

  /**
   * Show the sheet. `viewport` puts one painting into a cell of a plate, so a
   * whole atlas is composed on the GPU and copied off in one go.
   */
  show(s: WashSettings, viewport?: [number, number, number, number], out?: [number, number]) {
    const u = this.u(this.showPass);
    u.uPig.value = this.pig[this.a].texture;
    u.uKCool.value.set(...s.cool.k);
    u.uKWarm.value.set(...s.warm.k);
    u.uGranulate.value.set(s.cool.granulate, s.warm.granulate);
    u.uWhite.value.set(...s.white);
    // How much sheet is in view. A print is the same painting seen larger, so
    // the grain grows with it — but not in step, or a thumbnail's paper would
    // be finer than its own pixels and turn to static.
    const [ow, oh] = out ?? [this.w, this.h];
    const k = 0.3 * Math.sqrt(Math.max(0.25, ow / 240));
    (u.uPaperScale.value as THREE.Vector2).set(k, (k * oh) / ow);
    if (viewport) {
      this.renderer.setViewport(...viewport);
      this.renderer.setScissor(...viewport);
      this.renderer.setScissorTest(true);
    }
    this.draw(this.showPass, null);
    if (viewport) this.renderer.setScissorTest(false);
  }

  dispose() {
    for (const t of [...this.flow, ...this.pig]) t.dispose();
    for (const m of [this.flowPass, this.pigPass, this.loadPass, this.bloomPass, this.showPass]) {
      (m.material as THREE.ShaderMaterial).dispose();
    }
  }
}
