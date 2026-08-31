import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { Ripples } from './ripple';

/**
 * A swimming pool.
 *
 * Every part of this is three.js: a box of tiled geometry, a surface mesh over
 * it, a height field on a pair of render targets, and two draw passes a frame.
 * Nothing is a video, a normal map or a noise loop.
 *
 * ### The order of the two passes is the whole trick
 *
 * You cannot refract what you have not drawn yet. So each frame the water is
 * hidden, the pool interior is rendered into an offscreen target, the water is
 * shown again, and the scene is drawn to the screen — where the water shader
 * reads that target back, displaced by its own surface normal. That is real
 * refraction of the real floor: the tiles bend because the surface above them
 * bends, the lane lines break exactly where the ripple is steepest, and none of
 * it is authored.
 *
 * It also means this component takes over the render loop. r3f hands that over
 * as soon as any `useFrame` asks for a priority, and from then on nothing is
 * drawn unless you draw it.
 *
 * ### Caustics are a Jacobian
 *
 * The bright net on the floor of a pool is not a texture and not a light. It is
 * what happens when a curved surface focuses parallel sunlight: rays that
 * entered the water evenly leave it *unevenly*, and the brightness at any point
 * on the floor is the reciprocal of how much the beam spread out on the way
 * down. To first order that spread is the Laplacian of the surface height —
 * so a floor fragment samples the height field above itself, takes ∇²h, and
 * brightens where the surface is locally convex.
 *
 * Which is why the caustics here are *correct without being drawn*: they move
 * with the ripples, they pool where two rings interfere, and they go flat and
 * even when the water settles, all for four texture taps.
 *
 * ### Depth is the cheap half of looking wet
 *
 * Two things sell water more than the surface does. Colour that deepens with
 * the distance the light travelled through it, so the far end of the pool goes
 * green before the near end does; and a Fresnel term, so the surface is glass
 * at your feet and a mirror at the far wall. Both are one line each and both
 * are missed instantly when they are not there.
 */

const POOL_W = 10;
const POOL_D = 6;
const DEPTH = 2.3;
/** Square texels in world terms — see the note in `Ripples`. */
const SIM_W = 320;
const SIM_H = Math.round((SIM_W * POOL_D) / POOL_W);

/** Tiles, grout, lane lines and the caustic net. Used for the floor and walls. */
const TILE_VERT = `
varying vec3 vWorld;
varying vec3 vNormal;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  vWorld = w.xyz;
  vNormal = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * w;
}
`;

const TILE_FRAG = `
precision highp float;
varying vec3 vWorld;
varying vec3 vNormal;

uniform sampler2D uHeight;
uniform vec2 uSim;
uniform vec2 uPool;
uniform float uCaustic;
uniform float uTime;

float hash(vec2 p) { return fract(sin(dot(p, vec2(37.1, 61.7))) * 43758.5); }

void main() {
  // Tiles run on whichever two axes the face actually faces.
  vec2 uv = abs(vNormal.y) > 0.5 ? vWorld.xz
    : (abs(vNormal.x) > 0.5 ? vWorld.zy : vWorld.xy);

  float tiles = 2.6;
  vec2 cell = floor(uv * tiles);
  vec2 f = fract(uv * tiles);
  float grout = min(min(f.x, 1.0 - f.x), min(f.y, 1.0 - f.y));
  float line = smoothstep(0.0, 0.055, grout);

  vec3 tileA = vec3(0.30, 0.62, 0.74);
  vec3 tileB = vec3(0.36, 0.70, 0.80);
  vec3 col = mix(tileA, tileB, hash(cell));
  col = mix(vec3(0.86, 0.90, 0.90), col, line);

  // Lane lines, on the floor only, and dark enough to show the water bending
  // them. A straight line under moving water is the best refraction meter
  // there is, which is why real pools are full of them.
  float onFloor = step(0.5, abs(vNormal.y));
  if (onFloor > 0.5) {
    // Dark, but not black. At full strength the lane lines came through the
    // water as bars of pure shadow and read as cracks in the floor.
    float lane = abs(fract(vWorld.z / 1.5 + 0.5) - 0.5) * 1.5;
    col = mix(vec3(0.13, 0.29, 0.44), col, smoothstep(0.035, 0.085, lane));
  }

  // The caustic net: the Laplacian of the surface directly above.
  vec2 huv = vec2(vWorld.x / uPool.x + 0.5, vWorld.z / uPool.y + 0.5);
  vec2 px = 1.0 / uSim;
  float h = texture2D(uHeight, huv).r;
  float lap = texture2D(uHeight, huv + vec2(px.x, 0.0)).r
            + texture2D(uHeight, huv - vec2(px.x, 0.0)).r
            + texture2D(uHeight, huv + vec2(0.0, px.y)).r
            + texture2D(uHeight, huv - vec2(0.0, px.y)).r - 4.0 * h;
  // On a wall the sample lands on the clamped edge of the field, which is
  // very nearly the truth — the surface directly above a wall *is* the
  // boundary — but it smears along the wall, so it is turned down there.
  float focus = clamp(1.0 - lap * uCaustic, 0.0, 4.0);
  float caustic = pow(focus, 3.0) * mix(0.4, 1.0, onFloor);
  col *= 0.62 + 0.6 * caustic;
  col += vec3(0.55, 0.68, 0.6) * smoothstep(1.1, 2.6, caustic) * 0.6;

  // Water absorbs red first, and it does it over distance. The deep end is a
  // different colour from the shallow end for a reason.
  float below = clamp((-vWorld.y) / ${DEPTH.toFixed(1)}, 0.0, 1.0);
  col = mix(col, col * vec3(0.32, 0.70, 0.82), below * 0.85);

  gl_FragColor = vec4(col, 1.0);
}
`;

const WATER_VERT = `
varying vec3 vWorld;
varying vec2 vHuv;
varying vec4 vScreen;
uniform sampler2D uHeight;
uniform vec2 uPool;
uniform float uAmp;

void main() {
  // The height field is addressed in *pool* coordinates, not in the mesh's own
  // uv. A plane laid flat has its v running along −z, so using the mesh uv puts
  // the water's ripples on the opposite side of the pool from the floor's
  // caustics — which looks almost right, and is the kind of wrong that takes
  // an hour to see.
  vec4 w = modelMatrix * vec4(position, 1.0);
  vHuv = vec2(w.x / uPool.x + 0.5, w.z / uPool.y + 0.5);
  w.y += texture2D(uHeight, vHuv).r * uAmp;
  vWorld = w.xyz;
  vScreen = projectionMatrix * viewMatrix * w;
  gl_Position = vScreen;
}
`;

const WATER_FRAG = `
precision highp float;
varying vec3 vWorld;
varying vec2 vHuv;
varying vec4 vScreen;

uniform sampler2D uHeight;
uniform sampler2D uScene;
uniform vec3 uEye;
uniform float uSlope;
uniform float uRefract;
uniform vec3 uSun;

vec3 sky(vec3 dir) {
  float up = clamp(dir.y * 0.5 + 0.5, 0.0, 1.0);
  vec3 c = mix(vec3(0.62, 0.76, 0.86), vec3(0.16, 0.36, 0.66), up);
  float sun = pow(max(dot(dir, uSun), 0.0), 220.0);
  return c + vec3(1.0, 0.96, 0.86) * sun * 2.4;
}

void main() {
  // The slope came out of the simulator for free; it is the last two channels.
  vec4 hs = texture2D(uHeight, vHuv);
  vec3 n = normalize(vec3(-hs.b * uSlope, 1.0, -hs.a * uSlope));

  vec3 view = normalize(vWorld - uEye);
  vec3 refl = reflect(view, n);

  // Screen-space refraction of the pass drawn a moment ago. Offset scaled by
  // the slope, so still water shows the floor exactly where it is.
  vec2 screen = (vScreen.xy / vScreen.w) * 0.5 + 0.5;
  // The bend has to die at the rim. Screen-space refraction samples whatever
  // is behind the offset pixel, and a few pixels outside the pool that is the
  // deck — so an unmasked surface hems itself with a bright white fringe of
  // paving, which is the giveaway artifact of the whole technique.
  float border = min(min(vHuv.x, 1.0 - vHuv.x), min(vHuv.y, 1.0 - vHuv.y));
  vec2 bend = n.xz * uRefract * smoothstep(0.0, 0.07, border);
  vec3 under = texture2D(uScene, clamp(screen + bend, 0.002, 0.998)).rgb;
  // Everything seen through water is seen through a filter. Without this the
  // pool reads as a sheet of glass over some blue tiles.
  under = mix(under, vec3(0.09, 0.40, 0.48), 0.26);

  // Schlick. Glass underfoot, mirror at the far end — and that transition is
  // most of what makes a flat plane read as a body of water.
  float f = 0.02 + 0.98 * pow(1.0 - max(dot(-view, n), 0.0), 5.0);
  vec3 col = mix(under, sky(refl), clamp(f, 0.0, 0.92));

  // Sun glitter, on the slope rather than on the height: a wave sparkles on
  // its flanks, not on its crest.
  vec3 hv = normalize(uSun - view);
  col += vec3(1.0, 0.97, 0.9) * pow(max(dot(n, hv), 0.0), 260.0) * 1.6;

  gl_FragColor = vec4(col, 1.0);
}
`;

export interface PoolSettings {
  amp: number;
  caustic: number;
  refract: number;
  rain: boolean;
  damping: number;
}

export function Pool({ settings }: { settings: PoolSettings }) {
  const { gl, scene, camera, size } = useThree();
  const water = useRef<THREE.Mesh>(null);
  const ripples = useRef<Ripples | null>(null);
  const nextDrip = useRef(0);

  const fbo = useMemo(
    () =>
      new THREE.WebGLRenderTarget(1, 1, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
      }),
    [],
  );
  useEffect(() => () => fbo.dispose(), [fbo]);
  useEffect(() => {
    const dpr = Math.min(1.6, gl.getPixelRatio());
    fbo.setSize(Math.max(1, Math.round(size.width * dpr)),
      Math.max(1, Math.round(size.height * dpr)));
  }, [fbo, gl, size]);

  // A pool is wider than it is deep, so a portrait viewport has to stand
  // further back or it frames the middle third and nothing else.
  useEffect(() => {
    const aspect = size.width / Math.max(1, size.height);
    const dist = THREE.MathUtils.clamp((8.3 * 1.5) / THREE.MathUtils.clamp(aspect, 0.45, 1.5),
      8.3, 19);
    camera.position.set(0, dist * 0.4, dist * 0.92);
    camera.lookAt(0, -0.8, 0);
  }, [camera, size]);

  if (!ripples.current) ripples.current = new Ripples(gl, SIM_W, SIM_H);
  useEffect(() => {
    const r = ripples.current;
    return () => {
      r?.dispose();
      ripples.current = null;
    };
  }, []);

  /**
   * The materials are built here rather than declared as JSX props, and it is
   * not a style choice.
   *
   * A `uniforms` object handed to `<shaderMaterial uniforms={…}>` does not stay
   * yours: three clones it, so every write from the frame loop lands in an
   * object nothing is rendering. The symptom is the worst kind — it compiles,
   * it runs, it draws, and every sampler is simply null, which here meant a
   * pool with a sheet of black glass over it. Owning the material means the
   * uniforms you write are the uniforms the GPU reads.
   */
  const tile = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: TILE_VERT,
        fragmentShader: TILE_FRAG,
        side: THREE.DoubleSide,
        uniforms: {
          uHeight: { value: null },
          uSim: { value: new THREE.Vector2(SIM_W, SIM_H) },
          uPool: { value: new THREE.Vector2(POOL_W, POOL_D) },
          uCaustic: { value: 40 },
          uTime: { value: 0 },
        },
      }),
    [],
  );

  const surface = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: WATER_VERT,
        fragmentShader: WATER_FRAG,
        uniforms: {
          uHeight: { value: null },
          uScene: { value: null },
          uEye: { value: new THREE.Vector3() },
          uSlope: { value: 26 },
          uRefract: { value: 0.055 },
          uAmp: { value: 0.14 },
          uPool: { value: new THREE.Vector2(POOL_W, POOL_D) },
          uSun: { value: new THREE.Vector3(-0.4, 0.72, 0.56).normalize() },
        },
      }),
    [],
  );

  const deck = useMemo(() => new THREE.MeshBasicMaterial({ color: '#d8d2c6' }), []);

  useEffect(
    () => () => {
      tile.dispose();
      surface.dispose();
      deck.dispose();
    },
    [tile, surface, deck],
  );

  // Pointer to pool coordinates: the ray meets the still surface, and that is
  // where the finger went in.
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);
  const ray = useMemo(() => new THREE.Raycaster(), []);
  const ndc = useMemo(() => new THREE.Vector2(), []);
  const hit = useMemo(() => new THREE.Vector3(), []);
  const last = useRef({ u: 0, v: 0, t: 0 });

  useEffect(() => {
    const el = gl.domElement;
    const at = (ev: PointerEvent) => {
      const r = el.getBoundingClientRect();
      ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1,
        -((ev.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      if (!ray.ray.intersectPlane(plane, hit)) return null;
      const u = hit.x / POOL_W + 0.5;
      const v = hit.z / POOL_D + 0.5;
      return u < 0 || u > 1 || v < 0 || v > 1 ? null : { u, v };
    };
    const move = (ev: PointerEvent) => {
      // A drag belongs to the camera. Without this the same gesture orbits the
      // pool *and* drags a finger through it, which is two things at once and
      // reads as neither — the same rule the galleries settled on.
      if (ev.buttons !== 0) return;
      const p = at(ev);
      const now = performance.now();
      if (!p || now - last.current.t < 26) return;
      last.current = { u: p.u, v: p.v, t: now };
      ripples.current?.splash(p.u, p.v, 0.06, 0.024);
    };
    const down = (ev: PointerEvent) => {
      const p = at(ev);
      if (p) ripples.current?.splash(p.u, p.v, 0.7, 0.06);
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerdown', down);
    return () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerdown', down);
    };
  }, [camera, gl, hit, ndc, plane, ray]);

  // Manual render: the refraction pass has to happen before the frame that
  // uses it. Asking for a priority is what hands the loop over.
  useFrame((state) => {
    const r = ripples.current;
    const w = water.current;
    if (!r || !w) return;

    r.damping = settings.damping;
    r.advance(2);

    // Rain is punctuation, not weather. At the first setting the pool never
    // got a chance to settle and the whole surface was permanent chop, which
    // hides the two things worth looking at — the caustics on the floor and a
    // single ring reflecting cleanly off a wall.
    if (settings.rain && state.clock.elapsedTime > nextDrip.current) {
      nextDrip.current = state.clock.elapsedTime + 0.9 + Math.random() * 1.8;
      r.splash(Math.random(), Math.random(), 0.1 + Math.random() * 0.22, 0.022);
    }

    tile.uniforms.uHeight.value = r.texture;
    tile.uniforms.uCaustic.value = settings.caustic;
    tile.uniforms.uTime.value = state.clock.elapsedTime;
    surface.uniforms.uHeight.value = r.texture;
    surface.uniforms.uAmp.value = settings.amp;
    // The slope the shader shades with has to follow the height it displaces
    // by, or turning the waves down leaves the reflections storm-tossed.
    surface.uniforms.uSlope.value = 26 * (settings.amp / 0.14);
    surface.uniforms.uRefract.value = settings.refract;
    surface.uniforms.uEye.value.copy(state.camera.position);

    w.visible = false;
    state.gl.setRenderTarget(fbo);
    state.gl.clear();
    state.gl.render(scene, state.camera);
    state.gl.setRenderTarget(null);
    w.visible = true;

    surface.uniforms.uScene.value = fbo.texture;
    state.gl.clear();
    state.gl.render(scene, state.camera);
  }, 1);

  const wall = (
    pos: [number, number, number],
    rot: [number, number, number],
    w: number,
    h: number,
    key: string,
  ) => (
    <mesh key={key} position={pos} rotation={rot}>
      <planeGeometry args={[w, h]} />
      <primitive object={tile} attach="material" />
    </mesh>
  );

  return (
    <>
      <color attach="background" args={['#8fb4cf']} />

      {/* Floor. */}
      <mesh position={[0, -DEPTH, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[POOL_W, POOL_D]} />
        <primitive object={tile} attach="material" />
      </mesh>

      {/* Four walls, stopping exactly at the waterline. Any lip above it is
          seen from the outside by a camera that is above the water, and comes
          out as a hard bright band along the near edge that reads as a fault
          in the render rather than as the side of a pool. Brim full instead. */}
      {[
        wall([0, -DEPTH / 2, -POOL_D / 2], [0, 0, 0], POOL_W, DEPTH, 'n'),
        wall([0, -DEPTH / 2, POOL_D / 2], [0, Math.PI, 0], POOL_W, DEPTH, 's'),
        wall([-POOL_W / 2, -DEPTH / 2, 0], [0, Math.PI / 2, 0], POOL_D, DEPTH, 'w'),
        wall([POOL_W / 2, -DEPTH / 2, 0], [0, -Math.PI / 2, 0], POOL_D, DEPTH, 'e'),
      ]}

      {/* The deck: four slabs round the pool rather than one big one with the
          pool drawn on top of it. A single plane at deck height covers the
          hole, and a pool with a lid is not a pool. */}
      {[
        { p: [0, 0.004, -POOL_D / 2 - 9] as const, s: [POOL_W + 36, 18] as const, k: 'dn' },
        { p: [0, 0.004, POOL_D / 2 + 9] as const, s: [POOL_W + 36, 18] as const, k: 'ds' },
        { p: [-POOL_W / 2 - 9, 0.004, 0] as const, s: [18, POOL_D] as const, k: 'dw' },
        { p: [POOL_W / 2 + 9, 0.004, 0] as const, s: [18, POOL_D] as const, k: 'de' },
      ].map((d) => (
        <mesh key={d.k} position={d.p} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={d.s} />
          <primitive object={deck} attach="material" />
        </mesh>
      ))}

      {/* The surface. Dense enough that the displacement is not faceted; the
          fine normal comes from the texture, not from the mesh. */}
      <mesh ref={water} position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={2}>
        <planeGeometry args={[POOL_W, POOL_D, 200, 120]} />
        <primitive object={surface} attach="material" />
      </mesh>

      <OrbitControls
        makeDefault
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        target={[0, -0.6, 0]}
        minDistance={5}
        maxDistance={18}
        minPolarAngle={0.12}
        maxPolarAngle={1.36}
      />
    </>
  );
}
