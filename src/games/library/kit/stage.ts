import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import type { Palette } from './paint';

/**
 * What turns a set of models into a picture.
 *
 * Four things, in order of how much they matter:
 *
 * 1. **Haze.** Exponential fog to the sky colour. It is what separates the
 *    near rock from the far one and it costs nothing.
 * 2. **A warm key and a cool sky.** One directional light with a soft shadow,
 *    one hemisphere light for the bounce, and nothing else. More lights make a
 *    scene muddier, not richer.
 * 3. **Depth of field.** The thing that says *diorama* rather than *landscape*:
 *    a real camera focused at arm's length, so the front and the back go soft
 *    and the eye is told exactly where to look.
 * 4. **A grade.** Lift the shadows towards the palette's cool, roll the
 *    highlights towards its warm, and close it with a vignette.
 */

// ------------------------------------------------------------------- lighting

export interface Rig {
  key: THREE.DirectionalLight;
  sky: THREE.HemisphereLight;
  fill: THREE.DirectionalLight;
  ambient: THREE.AmbientLight;
  group: THREE.Group;
}

export function makeRig(p: Palette): Rig {
  const group = new THREE.Group();

  const key = new THREE.DirectionalLight(new THREE.Color(p.sun), p.sunStrength);
  // Low and well round to the side, rather than overhead.
  //
  // A high sun models ground beautifully and vertical surfaces not at all:
  // every wall in a room catches the same grazing amount and the interior
  // comes out as flat panels of one colour. Dropping the light until it rakes
  // across the walls is what gives a room corners.
  key.position.set(7.5, 5.5, 6.5);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.radius = 4;
  key.shadow.bias = -0.0012;
  key.shadow.normalBias = 0.03;
  const c = key.shadow.camera;
  c.left = -14;
  c.right = 14;
  c.top = 14;
  c.bottom = -14;
  c.near = 0.5;
  c.far = 42;
  c.updateProjectionMatrix();
  group.add(key, key.target);

  // Sky above, ground bounce below. This is the light that does the modelling
  // in the shadows, and getting its two colours right is most of the palette.
    // Half the key, not more. A hemisphere light bright enough to fill the
  // shadows is also bright enough to erase them, and a diorama with no shadow
  // under the rocks is a diagram of a diorama.
  const sky = new THREE.HemisphereLight(new THREE.Color(p.skyBounce), new THREE.Color(p.groundBounce), 0.5);
  group.add(sky);

  // A dim, shadowless light from behind the camera so nothing facing the
  // viewer falls out of the picture entirely.
  const fill = new THREE.DirectionalLight(new THREE.Color(p.skyBounce), 0.22);
  fill.position.set(-5, 3, 8);
  group.add(fill);

  // Flat light, for the night sets only. It flattens, which is why the day
  // palettes ask for almost none of it — but a candle-lit room rendered
  // without it is black, and a black picture is not a moodier picture, it is
  // an absent one.
  const ambient = new THREE.AmbientLight(new THREE.Color(p.skyBounce), p.ambient);
  group.add(ambient);

  return { key, sky, fill, ambient, group };
}

export function applyFog(scene: THREE.Scene, p: Palette) {
  scene.fog = new THREE.FogExp2(new THREE.Color(p.haze), p.hazeDensity);
  scene.background = new THREE.Color(p.sky);
}

// ---------------------------------------------------------------------- grade

/**
 * The grade: a split tone and a vignette.
 *
 * Deliberately gentle. The painted material has already tinted every surface,
 * so this is a last quarter-turn over the whole frame rather than the place
 * the look is made.
 */
const GradeShader = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uLift: { value: new THREE.Color('#2a3352') },
    uGain: { value: new THREE.Color('#fff3dc') },
    uAmount: { value: 0.4 },
    uVignette: { value: 0.42 },
    // The painted material has already tinted every surface warm-to-cool, so
    // a saturation push here compounds it: on the brown palettes it turned the
    // whole frame to rust. Barely above neutral is enough.
    uSaturation: { value: 1.06 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform vec3 uLift;
    uniform vec3 uGain;
    uniform float uAmount;
    uniform float uVignette;
    uniform float uSaturation;
    varying vec2 vUv;

    void main() {
      vec4 texel = texture2D( tDiffuse, vUv );
      vec3 c = texel.rgb;
      float l = dot( c, vec3( 0.2126, 0.7152, 0.0722 ) );

      // Split tone: shadows towards the lift, highlights towards the gain.
      vec3 split = mix( uLift * 2.0, uGain, smoothstep( 0.0, 0.9, l ) );
      c = mix( c, c * split, uAmount );

      c = mix( vec3( l ), c, uSaturation );

      float d = distance( vUv, vec2( 0.5 ) );
      c *= 1.0 - smoothstep( 0.42, 0.95, d ) * uVignette;

      gl_FragColor = vec4( max( c, vec3( 0.0 ) ), texel.a );
    }
  `,
};

// ------------------------------------------------------------------ composing

export interface Film {
  composer: EffectComposer;
  bokeh: BokehPass;
  grade: ShaderPass;
  setSize: (w: number, h: number) => void;
  /** Where the lens is focused, in world units from the camera. */
  focus: (distance: number, aperture?: number) => void;
  dispose: () => void;
}

/**
 * Build the post chain.
 *
 * `BokehPass` renders its own depth pass, so it roughly doubles the scene cost;
 * on anything that cannot afford it the caller passes `depthOfField: false` and
 * gets the same picture without the softness rather than a slideshow.
 */
export function makeFilm(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  p: Palette,
  depthOfField = true,
): Film {
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  // `maxblur` is a fraction of the frame, and it is easy to set far too high:
  // at 0.008 a 1280-wide frame smears anything off the focal plane by ten
  // pixels, which on an interior set means everything except one prop. Half
  // that still says *diorama* and leaves the set legible.
  const bokeh = new BokehPass(scene, camera, { focus: 12, aperture: 0.0016, maxblur: 0.004 });
  bokeh.enabled = depthOfField;
  composer.addPass(bokeh);

  const grade = new ShaderPass(GradeShader);
  grade.uniforms.uLift.value = new THREE.Color(p.cool).multiplyScalar(0.55);
  grade.uniforms.uGain.value = new THREE.Color(p.warm);
  composer.addPass(grade);

  composer.addPass(new OutputPass());

  return {
    composer,
    bokeh,
    grade,
    setSize: (w, h) => composer.setSize(w, h),
    focus: (distance, aperture = 0.0016) => {
      const u = (bokeh as unknown as { uniforms: Record<string, { value: number }> }).uniforms;
      if (!u) return;
      u.focus.value = distance;
      u.aperture.value = aperture;
    },
    dispose: () => composer.dispose(),
  };
}

// ------------------------------------------------------------------- clouds

/**
 * A backdrop of soft cloud banks.
 *
 * Billboarded blobs a long way out, inside the fog, so the horizon is not an
 * empty gradient. Cheap, and it is most of why the reference reads as somewhere
 * rather than as a model on a table.
 */
export function cloudBank(p: Palette, seed = 1): THREE.Group {
  const g = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(p.haze).lerp(new THREE.Color('#ffffff'), 0.45),
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
    fog: false,
  });
  let a = seed * 9973;
  const r = () => {
    a = (a * 1103515245 + 12345) & 0x7fffffff;
    return a / 0x7fffffff;
  };
  for (let i = 0; i < 22; i++) {
    const s = 6 + r() * 14;
    const m = new THREE.Mesh(new THREE.SphereGeometry(s, 12, 8), mat);
    const angle = r() * Math.PI * 2;
    const dist = 42 + r() * 26;
    m.position.set(Math.cos(angle) * dist, -2 + r() * 12, Math.sin(angle) * dist);
    m.scale.set(1.6, 0.42 + r() * 0.3, 1.2);
    g.add(m);
  }
  g.renderOrder = -1;
  return g;
}
