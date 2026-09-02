import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

/**
 * A globe of pictures.
 *
 * Shared by Two Crayons and Wet on Wet: both have a thousand-odd landscape or
 * portrait cards and no better shape to hang them on. It takes texture atlases
 * and an index, and knows nothing about what is painted on them.
 *
 * The same Fibonacci-sphere layout Roll Call uses, and for the same reasons —
 * equal steps down the y axis are equal steps in *area* on a sphere, and the
 * golden angle is the one rotation that never lets the patches settle into
 * visible spokes. This is a separate, much smaller implementation rather than a
 * generalisation of that one: Roll Call's globe carries focus-by-set and
 * pick-up-and-drag, neither of which a picture gallery wants, and the shared
 * abstraction would have been mostly conditionals.
 *
 * Cards face outward, hover lifts one and reports it, a press that goes nowhere
 * is a click, and a drag always belongs to the camera.
 */

/**
 * Centre-to-centre spacing on the shell.
 *
 * Sized for the *diagonal* of a landscape card, not for a square one. At 1.34 —
 * which is right for the square faces in Roll Call — thirteen-hundred wide
 * cards packed edge to edge and the globe read as one dense texture rather than
 * as a lot of small pictures.
 */
const SPACING = 1.85;
/** Cards sit a little inside their patch, so there is paper between them. */
const FIT = 0.9;
const GOLDEN = Math.PI * (3 - Math.sqrt(5));

/**
 * Which shape the cards are hung on.
 *
 * The sphere came first and is the better *object* — it has a far side, it
 * turns, and a thousand cards on it read as one thing. It is the worse
 * *catalogue*: half the set is always behind the other half, and there is no
 * way to run your eye down a column. So the grid is the default and the sphere
 * is a switch, which is the right way round for a gallery whose first question
 * is "what is in it".
 */
export type Layout = 'grid' | 'sphere';

/**
 * Columns for `count` cards of a given shape, on a landscape screen.
 *
 * Solved rather than guessed. If the sheet is `cols` wide and `count/cols`
 * tall, and a card is `aspect` wide for a unit of height, the sheet's own
 * proportion is `cols²·aspect/count`; setting that to 1.7 and rearranging gives
 * the line below. Portrait cards therefore get more columns, which is what
 * anybody laying out contact prints would do without thinking about it.
 */
export const gridCols = (count: number, aspect = 1) =>
  Math.max(1, Math.ceil(Math.sqrt((Math.max(1, count) * 1.7) / Math.max(0.2, aspect))));

export interface Plate {
  canvas: HTMLCanvasElement;
  grid: number;
  used: number;
  /** Aspect of one cell, width over height. */
  aspect: number;
}

/**
 * Radius that gives `count` cards a constant gap, whatever the count.
 *
 * Spacing has to suit the card: portrait cards have a shorter diagonal than
 * landscape ones and pack closer before they touch, so the caller sets it.
 */
export const globeRadius = (count: number, spacing = SPACING) =>
  spacing * Math.sqrt(Math.max(1, count) / (4 * Math.PI));

function place(
  i: number,
  count: number,
  radius: number,
  layout: Layout,
  spacing: number,
  aspect: number,
  out: THREE.Vector3,
) {
  if (layout === 'grid') {
    const cols = gridCols(count, aspect);
    const rows = Math.ceil(count / cols);
    const row = Math.floor(i / cols);
    // The last row is usually short. Centred on the full width it hangs off
    // one side and the whole sheet reads as lopsided, so it is centred on
    // itself instead — which is what anybody laying out contact prints does.
    const wide = row === rows - 1 ? count - row * cols : cols;
    const cx = (wide - 1) / 2;
    const cy = (rows - 1) / 2;
    // Pitch follows the card in each axis, or a wall of portrait cards has
    // three times the gutter across that it has down.
    return out.set(((i % cols) - cx) * spacing * aspect, -(row - cy) * spacing, 0);
  }
  const n = Math.max(2, count);
  const y = 1 - (i / (n - 1)) * 2;
  const ring = Math.sqrt(Math.max(0, 1 - y * y));
  const theta = GOLDEN * i;
  return out.set(Math.cos(theta) * ring * radius, y * radius, Math.sin(theta) * ring * radius);
}

interface View {
  hovered: number;
  picked: number;
}

function Block({
  plate,
  offset,
  count,
  radius,
  layout,
  spacing,
  view,
  register,
}: {
  plate: Plate;
  offset: number;
  count: number;
  radius: number;
  layout: Layout;
  spacing: number;
  view: React.MutableRefObject<View>;
  register: (offset: number, mesh: THREE.InstancedMesh | null) => void;
}) {
  const mesh = useRef<THREE.InstancedMesh>(null);

  const texture = useMemo(() => {
    const t = new THREE.CanvasTexture(plate.canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    t.generateMipmaps = true;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    t.anisotropy = 4;
    return t;
  }, [plate]);
  useEffect(() => () => texture.dispose(), [texture]);

  useEffect(() => {
    register(offset, mesh.current);
    return () => register(offset, null);
  }, [register, offset]);

  const material = useMemo(() => {
    const m = new THREE.MeshBasicMaterial({
      map: texture,
      toneMapped: false,
      side: THREE.DoubleSide,
    });
    m.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader
        .replace(
          '#include <common>',
          '#include <common>\nattribute vec2 aCell;\nvarying vec2 vCell;',
        )
        .replace('#include <uv_vertex>', '#include <uv_vertex>\nvCell = aCell;');
      shader.fragmentShader = shader.fragmentShader
        .replace(
          '#include <common>',
          '#include <common>\nvarying vec2 vCell;\nuniform float uGrid;',
        )
        .replace(
          '#include <map_fragment>',
          `
          vec2 cellUv = (vMapUv + vCell) / uGrid;
          vec4 sampledDiffuseColor = texture2D(map, cellUv);
          diffuseColor *= sampledDiffuseColor;
        `,
        );
      shader.uniforms.uGrid = { value: plate.grid };
    };
    return m;
  }, [texture, plate.grid]);
  useEffect(() => () => material.dispose(), [material]);

  useEffect(() => {
    const m = mesh.current;
    if (!m) return;
    const cells = new Float32Array(plate.used * 2);
    for (let k = 0; k < plate.used; k++) {
      cells[k * 2] = k % plate.grid;
      // Atlas rows run downwards; UV runs upwards.
      cells[k * 2 + 1] = plate.grid - 1 - Math.floor(k / plate.grid);
    }
    m.geometry.setAttribute('aCell', new THREE.InstancedBufferAttribute(cells, 2));
  }, [plate]);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const at = useMemo(() => new THREE.Vector3(), []);
  const look = useMemo(() => new THREE.Vector3(), []);
  const st = useRef({ done: false, hovered: -1, picked: -1 });
  // Changing the layout invalidates every matrix, so the once-only write has
  // to run again. Without this the cards keep the shape they were first given.
  useEffect(() => {
    st.current.done = false;
  }, [layout, spacing]);

  const cols = gridCols(count, plate.aspect);
  const reach =
    layout === 'grid' ? Math.hypot(cols, Math.ceil(count / cols)) * spacing * 0.6 : radius;

  const write = useCallback(
    (m: THREE.InstancedMesh, k: number, i: number) => {
      const v = view.current;
      place(i, count, radius, layout, spacing, plate.aspect, at);
      const lift = v.picked === i ? 1.6 : v.hovered === i ? 0.55 : 0;
      if (layout === 'grid') {
        // On a plane, "out" is towards the camera and the card is already
        // facing it. Lifting along the normal is the same gesture as on the
        // sphere; it just happens to be a fixed direction here.
        dummy.position.set(at.x, at.y, at.z + lift * spacing * 0.7);
        dummy.rotation.set(0, 0, 0);
      } else {
        const len = at.length() || 1;
        dummy.position.copy(at).multiplyScalar((len + lift) / len);
        look.copy(dummy.position).multiplyScalar(2);
        if (look.lengthSq() < 1e-6) look.set(0, 0, 1);
        dummy.lookAt(look);
      }
      const s = (v.picked === i ? 2.2 : v.hovered === i ? 1.8 : 1) * FIT * (layout === 'grid' ? spacing : 1);
      dummy.scale.set(s * plate.aspect, s, s);
      dummy.updateMatrix();
      m.setMatrixAt(k, dummy.matrix);
    },
    [at, count, dummy, layout, look, plate.aspect, radius, spacing, view],
  );

  // Written once, then only the two cards whose state changed. Rewriting every
  // matrix every frame to draw something that has not moved is the single most
  // expensive mistake available here.
  useFrame(() => {
    const m = mesh.current;
    if (!m) return;
    const s = st.current;
    const v = view.current;
    if (!s.done) {
      for (let k = 0; k < plate.used; k++) write(m, k, offset + k);
      s.done = true;
      s.hovered = v.hovered;
      s.picked = v.picked;
      m.instanceMatrix.needsUpdate = true;
      m.boundingSphere = new THREE.Sphere(new THREE.Vector3(), reach + 4);
      return;
    }
    if (s.hovered === v.hovered && s.picked === v.picked) return;
    for (const i of [s.hovered, s.picked, v.hovered, v.picked]) {
      const k = i - offset;
      if (k >= 0 && k < plate.used) write(m, k, i);
    }
    s.hovered = v.hovered;
    s.picked = v.picked;
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={mesh}
      args={[undefined, undefined, plate.used]}
      material={material}
      frustumCulled={false}
    >
      <planeGeometry args={[1, 1]} />
    </instancedMesh>
  );
}

function Picker({
  blocks,
  view,
  onPick,
  onHover,
}: {
  blocks: React.MutableRefObject<Map<number, THREE.InstancedMesh>>;
  view: React.MutableRefObject<View>;
  onPick: (i: number) => void;
  onHover: (i: number | null, x: number, y: number) => void;
}) {
  const { camera, gl } = useThree();
  const ray = useMemo(() => new THREE.Raycaster(), []);
  const ndc = useMemo(() => new THREE.Vector2(), []);
  const over = useRef<number | null>(null);
  const press = useRef<{ index: number; x: number; y: number } | null>(null);

  useEffect(() => {
    const el = gl.domElement;
    let queued = 0;

    const hit = (cx: number, cy: number) => {
      const r = el.getBoundingClientRect();
      ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      let best: { index: number; d: number } | null = null;
      for (const [offset, mesh] of blocks.current) {
        for (const h of ray.intersectObject(mesh, false)) {
          if (h.instanceId === undefined) continue;
          if (!best || h.distance < best.d) best = { index: offset + h.instanceId, d: h.distance };
        }
      }
      return best;
    };

    const clear = () => {
      if (over.current === null) return;
      over.current = null;
      view.current.hovered = -1;
      el.style.cursor = '';
      onHover(null, 0, 0);
    };

    const down = (ev: PointerEvent) => {
      if (ev.button !== 0) return;
      const h = hit(ev.clientX, ev.clientY);
      press.current = h ? { index: h.index, x: ev.clientX, y: ev.clientY } : null;
    };

    const move = (ev: PointerEvent) => {
      // Any button down is an orbit in progress; nothing to hover, and the
      // raycast would be wasted.
      if (ev.buttons !== 0) return clear();
      if (queued) return;
      const cx = ev.clientX;
      const cy = ev.clientY;
      queued = requestAnimationFrame(() => {
        queued = 0;
        const h = hit(cx, cy);
        const next = h ? h.index : null;
        if (next === over.current) return;
        over.current = next;
        view.current.hovered = next ?? -1;
        el.style.cursor = next === null ? '' : 'pointer';
        onHover(next, cx, cy);
      });
    };

    const up = (ev: PointerEvent) => {
      const p = press.current;
      press.current = null;
      if (p && Math.hypot(ev.clientX - p.x, ev.clientY - p.y) < 5) onPick(p.index);
    };

    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointerleave', clear);
    return () => {
      if (queued) cancelAnimationFrame(queued);
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointerleave', clear);
    };
  }, [blocks, camera, gl, ndc, onHover, onPick, ray, view]);

  return null;
}

export function Globe({
  plates,
  count,
  picked,
  onPick,
  onHover,
  hovered,
  spacing,
  layout = 'grid',
  background = '#2a2926',
}: {
  plates: Plate[];
  count: number;
  picked: number | null;
  hovered: number | null;
  onPick: (i: number) => void;
  onHover: (i: number | null, x: number, y: number) => void;
  /** Centre-to-centre spacing on the shell; see `globeRadius`. */
  spacing?: number;
  /** Grid by default; the sphere is a switch. */
  layout?: Layout;
  background?: string;
}) {
  const view = useRef<View>({ hovered: -1, picked: -1 });
  view.current.hovered = hovered ?? -1;
  view.current.picked = picked ?? -1;

  const blocks = useRef<Map<number, THREE.InstancedMesh>>(new Map());
  const register = useCallback((offset: number, mesh: THREE.InstancedMesh | null) => {
    if (mesh) blocks.current.set(offset, mesh);
    else blocks.current.delete(offset);
  }, []);

  const radius = useMemo(() => globeRadius(count, spacing), [count, spacing]);
  const pitch = spacing ?? SPACING;

  /**
   * Where the camera starts.
   *
   * On the sphere it is 2.7 radii out, which puts a 45° frustum just around
   * the silhouette. On the grid it is whatever distance fits the *whole sheet*
   * — both the width and the height — because the reason to be in grid at all
   * is to see what is in the set. Two and a half thousand cards come up as a
   * wall of thumbnails, which is exactly what a contact sheet of two and a half
   * thousand things is, and the wheel gets you in.
   */
  const card = plates[0]?.aspect ?? 1;
  const camZ = useMemo(() => {
    if (layout === 'sphere') return radius * 2.7;
    const cols = gridCols(count, card);
    const rows = Math.ceil(count / cols);
    // 2·tan(fov/2) at 45° is 0.828: the visible height per unit of distance.
    const screen = Math.max(0.5, window.innerWidth / Math.max(1, window.innerHeight));
    const forRows = ((rows + 0.6) * pitch) / 0.828;
    const forCols = ((cols + 0.6) * pitch * card) / (0.828 * screen);
    return Math.max(forRows, forCols);
  }, [card, count, layout, pitch, radius]);

  return (
    <Canvas
      // Keyed on the radius, which is keyed on the count.
      //
      // React Three Fiber reads `camera` when it builds the camera and not
      // again, so a gallery that changes size under a filter keeps the camera
      // it was given for the size it used to be. Switching a two-thousand card
      // globe to a two-hundred-and-sixty-eight card one left the camera forty
      // units out from a sphere six across, and the gallery came up as a marble
      // in the middle of the screen. Remounting on a change of size is the
      // honest fix: a different gallery is a different view.
      key={`${layout}:${Math.round(radius * 100)}:${Math.round(card * 100)}`}
      camera={{
        position: [0, 0, camZ],
        fov: 45,
        near: 0.1,
        far: camZ * 8 + radius * 20,
      }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
    >
      <color attach="background" args={[background]} />
      {plates.map((p, n) => (
        <Block
          key={n}
          plate={p}
          offset={n * p.grid * p.grid}
          count={count}
          radius={radius}
          layout={layout}
          spacing={pitch}
          view={view}
          register={register}
        />
      ))}
      <Picker blocks={blocks} view={view} onPick={onPick} onHover={onHover} />
      {/* A sphere is turned and a sheet is dragged; nothing else changes. */}
      <OrbitControls
        makeDefault
        enableRotate={layout === 'sphere'}
        enablePan={layout === 'grid'}
        screenSpacePanning
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.5}
        panSpeed={1.2}
        minDistance={layout === 'grid' ? pitch * 1.2 : 0.5}
        maxDistance={layout === 'grid' ? camZ * 1.6 : radius * 6}
        mouseButtons={
          layout === 'grid'
            ? {
                LEFT: THREE.MOUSE.PAN,
                MIDDLE: THREE.MOUSE.DOLLY,
                RIGHT: THREE.MOUSE.PAN,
              }
            : undefined
        }
        touches={
          layout === 'grid'
            ? { ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_PAN }
            : undefined
        }
      />
    </Canvas>
  );
}
