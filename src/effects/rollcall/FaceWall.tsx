import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { Atlas } from './atlas';
import type { Seat } from './census';

/**
 * The globe.
 *
 * Fifteen hundred cards on the surface of a sphere, one instanced mesh per
 * atlas, so the whole census is four draw calls rather than fifteen hundred.
 * Each instance gets a cell of its atlas through an instanced attribute and a
 * small patch to the standard material — three lines of injected GLSL rather
 * than a bespoke shader, so the material keeps its own lighting and fog.
 *
 * The seats are laid out by the **Fibonacci sphere**: walk down the y axis in
 * equal steps and turn by the golden angle each time. Equal steps in y give
 * equal steps in *area* on a sphere — that is Archimedes' theorem — so every
 * card gets the same patch of surface, and the golden angle is the one
 * rotation that never lets those patches settle into visible spokes. The
 * alternative, latitude-longitude, crowds the poles until the cards are on top
 * of each other there and stranded at the equator.
 *
 * It also does something the flat wall could not. Seat indices run through the
 * sets in order and y falls monotonically with the index, so **each set comes
 * out as a latitude band**: the back bench is the north cap, the waxworks are
 * the south pole, and the whole census reads as a globe with visible strata
 * before you have clicked anything.
 *
 * Cards can be picked up and left where you drop them. Dragging happens on a
 * plane through the card that faces the camera, which is what makes a drag feel
 * like moving the thing rather than steering a value.
 */

const CARD_W = 1;
const CARD_H = 1;
/** Centre-to-centre spacing aimed for on the surface. */
const SPACING = 1.28;
/** The golden angle, in radians. */
const GOLDEN = Math.PI * (3 - Math.sqrt(5));

/**
 * The radius that gives `count` cards that spacing.
 *
 * Nearest-neighbour distance on a Fibonacci sphere is about `sqrt(4π/N)·R`, so
 * solving for R keeps the gap between faces constant however many there are —
 * a census of two hundred and a census of two thousand look equally dense.
 */
export function sphereRadius(count: number): number {
  return SPACING * Math.sqrt(Math.max(1, count) / (4 * Math.PI));
}

/** The i-th of `count` points spread evenly over a sphere of radius `radius`. */
function fibonacci(i: number, count: number, radius: number, out: THREE.Vector3): THREE.Vector3 {
  const n = Math.max(2, count);
  const y = 1 - (i / (n - 1)) * 2;
  const ring = Math.sqrt(Math.max(0, 1 - y * y));
  const theta = GOLDEN * i;
  return out.set(Math.cos(theta) * ring * radius, y * radius, Math.sin(theta) * ring * radius);
}

/** Where a seat stands when nothing has been moved and nothing is focused. */
export function restingPlace(i: number, count: number, out = new THREE.Vector3()): THREE.Vector3 {
  return fibonacci(i, count, sphereRadius(count), out);
}

/**
 * Where a focused set stands.
 *
 * The focused faces keep the *full* radius and spread over the whole globe, so
 * the camera never has to move: a set of eleven that was one card in fifteen
 * hundred becomes eleven cards alone on a sphere. Everybody else contracts to a
 * small dense core at the centre, which reads as the rest of the census still
 * being there rather than having been deleted.
 */
function focusPlace(n: number, total: number, count: number, out: THREE.Vector3): THREE.Vector3 {
  return fibonacci(n, total, sphereRadius(count), out);
}

/** Scale factor applied to a seat's resting place when it is not in focus. */
const CORE = 0.24;

export interface WallProps {
  seats: Seat[];
  atlases: Atlas[];
  /** Which set to bring forward, or null for all of them. */
  focusSet: string | null;
  onPick: (index: number) => void;
  onHover: (index: number | null, x: number, y: number) => void;
  picked: number | null;
  hovered: number | null;
}

/** Resolve where one seat currently belongs. Shared by the drawing and the picker. */
function placeOf(
  i: number,
  count: number,
  moved: Map<number, THREE.Vector3>,
  focusOrder: Map<number, number>,
  out: THREE.Vector3,
): THREE.Vector3 {
  const already = moved.get(i);
  if (already) return out.copy(already);
  const spot = focusOrder.get(i);
  if (spot !== undefined) return focusPlace(spot, focusOrder.size, count, out);
  restingPlace(i, count, out);
  // Not in the focused set: fall back to the core.
  if (focusOrder.size) out.multiplyScalar(CORE);
  return out;
}

function Block({
  atlas,
  offset,
  seats,
  count,
  picked,
  hovered,
  focusSet,
  moved,
  focusOrder,
  register,
}: {
  atlas: Atlas;
  offset: number;
  seats: Seat[];
  count: number;
  picked: number | null;
  hovered: number | null;
  focusSet: string | null;
  moved: Map<number, THREE.Vector3>;
  /** Seat index to its place within the focused set, when one is focused. */
  focusOrder: Map<number, number>;
  register: (offset: number, mesh: THREE.InstancedMesh | null) => void;
}) {
  const mesh = useRef<THREE.InstancedMesh>(null);

  const texture = useMemo(() => {
    const t = new THREE.CanvasTexture(atlas.canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    t.generateMipmaps = true;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    t.anisotropy = 4;
    return t;
  }, [atlas]);

  useEffect(() => () => texture.dispose(), [texture]);

  useEffect(() => {
    register(offset, mesh.current);
    return () => register(offset, null);
  }, [register, offset]);

  const material = useMemo(() => {
    // alphaTest rather than blending: the cards overlap when they are moved,
    // and cut-out alpha needs no depth sorting to look right.
    const m = new THREE.MeshBasicMaterial({
      map: texture,
      toneMapped: false,
      transparent: true,
      alphaTest: 0.04,
      side: THREE.DoubleSide,
    });
    m.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nattribute vec2 aCell;\nvarying vec2 vCell;')
        .replace('#include <uv_vertex>', '#include <uv_vertex>\nvCell = aCell;');
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying vec2 vCell;\nuniform float uGrid;')
        .replace('#include <map_fragment>', `
          vec2 cellUv = (vMapUv + vCell) / uGrid;
          vec4 sampledDiffuseColor = texture2D(map, cellUv);
          diffuseColor *= sampledDiffuseColor;
        `);
      shader.uniforms.uGrid = { value: atlas.grid };
    };
    return m;
  }, [texture, atlas.grid]);

  useEffect(() => () => material.dispose(), [material]);

  // Cell attribute: which square of the atlas each instance draws.
  useEffect(() => {
    const m = mesh.current;
    if (!m) return;
    const cells = new Float32Array(atlas.used * 2);
    for (let k = 0; k < atlas.used; k++) {
      cells[k * 2] = k % atlas.grid;
      // Atlas rows run downwards; UV runs upwards.
      cells[k * 2 + 1] = atlas.grid - 1 - Math.floor(k / atlas.grid);
    }
    m.geometry.setAttribute('aCell', new THREE.InstancedBufferAttribute(cells, 2));
  }, [atlas]);

  // Place every instance.
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const home = useMemo(() => new THREE.Vector3(), []);
  const look = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    const m = mesh.current;
    if (!m) return;
    for (let k = 0; k < atlas.used; k++) {
      const i = offset + k;
      const seat = seats[i];
      const inFocus = !focusSet || seat.set.id === focusSet;
      placeOf(i, count, moved, focusOrder, home);
      const lift = picked === i ? 1.6 : hovered === i ? 0.5 : 0;
      // Cards stand on the shell facing outwards, so a lift is a step further
      // out along the radius rather than a step towards a fixed camera.
      const len = home.length() || 1;
      const grow = (len + lift) / len;
      dummy.position.copy(home).multiplyScalar(grow);
      // Face away from the centre. A card at the origin has no outward to face,
      // so fall back to facing the viewer's default direction.
      look.copy(dummy.position).multiplyScalar(2);
      if (look.lengthSq() < 1e-6) look.set(0, 0, 1);
      dummy.lookAt(look);
      const s = !inFocus ? 0.34 : picked === i ? 2.4 : hovered === i ? 1.9 : focusOrder.size ? 2.2 : 1;
      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      m.setMatrixAt(k, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
    // Recomputed every frame, not once. InstancedMesh raycasting culls against
    // this sphere, and the first one gets built while every instance is still
    // at the origin — which silently made the entire wall unclickable. Cards
    // also move when they are dragged, so a one-off sphere would go stale.
    m.computeBoundingSphere();
  });

  return (
    <instancedMesh
      ref={mesh}
      args={[undefined, undefined, atlas.used]}
      material={material}
      frustumCulled={false}
    >
      <planeGeometry args={[CARD_W, CARD_H]} />
    </instancedMesh>
  );
}

/**
 * Picking, hovering and dragging, done by hand.
 *
 * The declarative pointer handlers on an instanced mesh did not resolve an
 * instance here, and rather than keep guessing at why, this raycasts the blocks
 * directly against the pointer. It is a dozen lines, it is debuggable, and it
 * is the same maths the library would have run.
 */
function Picker({
  blocks,
  moved,
  count,
  focusOrder,
  onPick,
  onHover,
}: {
  blocks: React.MutableRefObject<Map<number, THREE.InstancedMesh>>;
  moved: Map<number, THREE.Vector3>;
  count: number;
  focusOrder: Map<number, number>;
  onPick: (i: number) => void;
  onHover: (i: number | null, x: number, y: number) => void;
}) {
  const { camera, gl, controls } = useThree();
  const ray = useMemo(() => new THREE.Raycaster(), []);
  const ndc = useMemo(() => new THREE.Vector2(), []);
  const scratch = useMemo(() => new THREE.Vector3(), []);
  /** The seat the pointer is currently over, so hover only fires on a change. */
  const over = useRef<number | null>(null);
  const drag = useRef<{
    index: number;
    plane: THREE.Plane;
    grab: THREE.Vector3;
    moved: boolean;
    /** Screen position of the press, for telling a click from a drag. */
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    const el = gl.domElement;

    const hit = (ev: PointerEvent) => {
      const r = el.getBoundingClientRect();
      ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      let best: { index: number; point: THREE.Vector3; d: number } | null = null;
      for (const [offset, mesh] of blocks.current) {
        for (const h of ray.intersectObject(mesh, false)) {
          if (h.instanceId === undefined) continue;
          if (!best || h.distance < best.d) {
            best = { index: offset + h.instanceId, point: h.point.clone(), d: h.distance };
          }
        }
      }
      return best;
    };

    const down = (ev: PointerEvent) => {
      const h = hit(ev);
      if (!h) return;
      const home = placeOf(h.index, count, moved, focusOrder, scratch).clone();
      const normal = camera.getWorldDirection(new THREE.Vector3()).negate();
      drag.current = {
        index: h.index,
        plane: new THREE.Plane().setFromNormalAndCoplanarPoint(normal, home),
        grab: h.point.clone().sub(home),
        moved: false,
        x: ev.clientX,
        y: ev.clientY,
      };
      el.setPointerCapture(ev.pointerId);
    };

    const move = (ev: PointerEvent) => {
      const d = drag.current;
      if (!d) {
        // Not dragging: this is a hover. Only report a *change*, or every
        // pointer move would re-render the detail panel.
        const h = hit(ev);
        const next = h ? h.index : null;
        if (next !== over.current) {
          over.current = next;
          el.style.cursor = next === null ? '' : 'pointer';
          onHover(next, ev.clientX, ev.clientY);
        }
        return;
      }
      const r = el.getBoundingClientRect();
      ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      const p = new THREE.Vector3();
      if (!ray.ray.intersectPlane(d.plane, p)) return;
      const next = p.sub(d.grab);
      // Slop measured on screen, not in the world. A world-space threshold
      // depends on how far the camera is and on floating-point noise in the
      // plane intersection, and it turned every click into a one-pixel drag.
      const slid = Math.hypot(ev.clientX - d.x, ev.clientY - d.y);
      if (!d.moved && slid < 5) return;
      d.moved = true;
      // Stop the orbit control fighting the drag.
      const c = controls as unknown as { enabled?: boolean } | null;
      if (c) c.enabled = false;
      moved.set(d.index, next);
    };

    const up = (ev: PointerEvent) => {
      const d = drag.current;
      drag.current = null;
      el.releasePointerCapture?.(ev.pointerId);
      const c = controls as unknown as { enabled?: boolean } | null;
      if (c) c.enabled = true;
      // A press that never turned into a drag is a click.
      if (d && !d.moved) onPick(d.index);
    };

    const leave = () => {
      if (over.current === null) return;
      over.current = null;
      el.style.cursor = '';
      onHover(null, 0, 0);
    };

    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointerleave', leave);
    return () => {
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointerleave', leave);
    };
  }, [blocks, camera, controls, count, focusOrder, gl, moved, ndc, onHover, onPick, ray, scratch]);

  return null;
}

export function FaceWall(props: WallProps) {
  const { seats, atlases } = props;
  // Cards the viewer has moved. Kept outside React state so a drag does not
  // re-render a thousand instances sixty times a second.
  const [moved] = useState(() => new Map<number, THREE.Vector3>());
  // Focusing a set spreads it over the whole globe and contracts everyone else
  // into the core. Dimming in place made the tabs decorative — a set of eleven
  // was simply impossible to find among fifteen hundred.
  const focusOrder = useMemo(() => {
    const m = new Map<number, number>();
    if (!props.focusSet) return m;
    let n = 0;
    seats.forEach((s, i) => {
      if (s.set.id === props.focusSet) m.set(i, n++);
    });
    return m;
  }, [seats, props.focusSet]);
  // Keyed by offset, not a list. Pushing on mount and emptying on unmount let
  // one block's StrictMode teardown wipe the registry for all four, which left
  // the picker raycasting against nothing.
  const blocks = useRef<Map<number, THREE.InstancedMesh>>(new Map());
  const register = useCallback((offset: number, mesh: THREE.InstancedMesh | null) => {
    if (mesh) blocks.current.set(offset, mesh);
    else blocks.current.delete(offset);
  }, []);

  // Framed once, from the census size, so the globe fills the view whether it
  // holds two hundred faces or two thousand.
  const radius = useMemo(() => sphereRadius(seats.length), [seats.length]);

  return (
    <Canvas
      camera={{ position: [0, 0, radius * 2.6], fov: 45, near: 0.1, far: radius * 20 }}
      dpr={[1, 2]}
      gl={{ antialias: true }}
      style={{ background: '#e9e4d6' }}
    >
      <color attach="background" args={['#e9e4d6']} />
      {atlases.map((a, n) => (
        <Block
          key={n}
          atlas={a}
          offset={n * a.grid * a.grid}
          seats={seats}
          count={seats.length}
          picked={props.picked}
          hovered={props.hovered}
          focusSet={props.focusSet}
          moved={moved}
          focusOrder={focusOrder}
          register={register}
        />
      ))}
      <Picker
        blocks={blocks}
        moved={moved}
        count={seats.length}
        focusOrder={focusOrder}
        onPick={props.onPick}
        onHover={props.onHover}
      />
      <OrbitControls
        makeDefault
        enablePan
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.55}
        // No minimum worth speaking of: flying inside the shell and looking
        // back out at fifteen hundred faces is the best thing this view does.
        minDistance={0.4}
        maxDistance={radius * 6}
      />
    </Canvas>
  );
}
