import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { Atlas } from './atlas';
import type { Seat } from './census';

/**
 * The wall.
 *
 * A thousand cards standing in a shallow arc, one instanced mesh per atlas, so
 * the whole census is four draw calls rather than a thousand. Each instance
 * gets a cell of its atlas through an instanced attribute and a small patch to
 * the standard material — three lines of injected GLSL rather than a bespoke
 * shader, so the material keeps its own lighting and fog.
 *
 * Cards can be picked up and left where you drop them. Dragging happens on a
 * plane through the card that faces the camera, which is what makes a drag feel
 * like moving the thing rather than steering a value.
 */

const CARD_W = 1;
const CARD_H = 1;
const GAP = 0.06;

/** Where a focused set stands: a tidy grid, in front of everyone else. */
function focusPlace(n: number, total: number): THREE.Vector3 {
  const cols = Math.max(1, Math.ceil(Math.sqrt(total * 1.6)));
  const rows = Math.ceil(total / cols);
  const col = n % cols;
  const row = Math.floor(n / cols);
  return new THREE.Vector3(
    (col - (cols - 1) / 2) * 1.35,
    ((rows - 1) / 2 - row) * 1.45,
    7.5,
  );
}

export interface WallProps {
  seats: Seat[];
  atlases: Atlas[];
  columns: number;
  /** Which set to bring forward, or null for all of them. */
  focusSet: string | null;
  onPick: (index: number) => void;
  picked: number | null;
}

/** Where a seat stands when nothing has been moved. */
function restingPlace(i: number, columns: number, count: number): THREE.Vector3 {
  const rows = Math.ceil(count / columns);
  const col = i % columns;
  const row = Math.floor(i / columns);
  const x = (col - (columns - 1) / 2) * (CARD_W + GAP);
  const y = ((rows - 1) / 2 - row) * (CARD_H + GAP);
  // A shallow barrel, so the far ends turn towards the viewer.
  const bend = 0.0055;
  const z = -(x * x) * bend * 12;
  return new THREE.Vector3(x, y, z);
}

function Block({
  atlas,
  offset,
  seats,
  columns,
  count,
  picked,
  focusSet,
  moved,
  focusOrder,
  register,
}: {
  atlas: Atlas;
  offset: number;
  seats: Seat[];
  columns: number;
  count: number;
  picked: number | null;
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
  useFrame(() => {
    const m = mesh.current;
    if (!m) return;
    for (let k = 0; k < atlas.used; k++) {
      const i = offset + k;
      const seat = seats[i];
      const inFocus = !focusSet || seat.set.id === focusSet;
      const spot = focusOrder.get(i);
      const home =
        moved.get(i) ??
        (spot !== undefined
          ? focusPlace(spot, focusOrder.size)
          : restingPlace(i, columns, count));
      const lift = picked === i ? 1.2 : 0;
      dummy.position.set(home.x, home.y, home.z + lift);
      dummy.rotation.set(0, -home.x * 0.06, 0);
      const s = !inFocus ? 0.5 : picked === i ? 1.5 : spot !== undefined ? 1.25 : 1;
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
 * Picking and dragging, done by hand.
 *
 * The declarative pointer handlers on an instanced mesh did not resolve an
 * instance here, and rather than keep guessing at why, this raycasts the blocks
 * directly against the pointer. It is a dozen lines, it is debuggable, and it
 * is the same maths the library would have run.
 */
function Picker({
  blocks,
  moved,
  columns,
  count,
  focusOrder,
  onPick,
}: {
  blocks: React.MutableRefObject<Map<number, THREE.InstancedMesh>>;
  moved: Map<number, THREE.Vector3>;
  columns: number;
  count: number;
  focusOrder: Map<number, number>;
  onPick: (i: number) => void;
}) {
  const { camera, gl, controls } = useThree();
  const ray = useMemo(() => new THREE.Raycaster(), []);
  const ndc = useMemo(() => new THREE.Vector2(), []);
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
      const spot = focusOrder.get(h.index);
      const home =
        moved.get(h.index) ??
        (spot !== undefined ? focusPlace(spot, focusOrder.size) : restingPlace(h.index, columns, count));
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
      if (!d) return;
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

    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    return () => {
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
    };
  }, [blocks, camera, columns, controls, count, focusOrder, gl, moved, ndc, onPick, ray]);

  return null;
}

export function FaceWall(props: WallProps) {
  const { seats, atlases, columns } = props;
  // Cards the viewer has moved. Kept outside React state so a drag does not
  // re-render a thousand instances sixty times a second.
  const [moved] = useState(() => new Map<number, THREE.Vector3>());
  // Focusing a set brings it to the front in a tidy grid. Dimming the rest and
  // leaving the focused faces scattered through a wall of fifteen hundred made
  // the tabs decorative — a set of eleven was simply impossible to find.
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

  return (
    <Canvas
      camera={{ position: [0, 0, 15], fov: 45, near: 0.1, far: 400 }}
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
          columns={columns}
          count={seats.length}
          picked={props.picked}
          focusSet={props.focusSet}
          moved={moved}
          focusOrder={focusOrder}
          register={register}
        />
      ))}
      <Picker
        blocks={blocks}
        moved={moved}
        columns={columns}
        count={seats.length}
        focusOrder={focusOrder}
        onPick={props.onPick}
      />
      <OrbitControls
        makeDefault
        enablePan
        enableDamping
        dampingFactor={0.08}
        minDistance={3}
        maxDistance={70}
        maxPolarAngle={Math.PI * 0.86}
        minPolarAngle={Math.PI * 0.14}
      />
    </Canvas>
  );
}

export { restingPlace };
