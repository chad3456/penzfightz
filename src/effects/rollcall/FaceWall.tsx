import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { Atlas } from './atlas';
import type { Seat } from './census';

/**
 * The globe.
 *
 * Two thousand cards on the surface of a sphere, one instanced mesh per atlas,
 * so the whole census is a handful of draw calls. Each instance gets a cell of
 * its atlas through an instanced attribute and a small patch to the standard
 * material — three lines of injected GLSL rather than a bespoke shader, so the
 * material keeps its own lighting and fog.
 *
 * Seats are laid out by the **Fibonacci sphere**: walk down the y axis in equal
 * steps and turn by the golden angle each time. Equal steps in y are equal
 * steps in *area* on a sphere — Archimedes' theorem — so every card gets the
 * same patch of surface, and the golden angle is the one rotation that never
 * lets those patches settle into visible spokes. Latitude-longitude, the
 * obvious alternative, crowds the poles until the cards stack on each other
 * there and stranded at the equator. Because seat indices run through the sets
 * in order and y falls monotonically with the index, each set comes out as a
 * latitude band.
 *
 * ## Why this used to be slow
 *
 * The first version rewrote every instance matrix, and called
 * `computeBoundingSphere()`, on every one of sixty frames a second. That is two
 * thousand `lookAt`s, two thousand quaternion compositions, two thousand matrix
 * composes and a full re-upload of half a megabyte of instance data, sixty
 * times a second, to draw a thing that had not moved. It ran, and it was
 * costing the entire frame budget for nothing.
 *
 * Nothing here moves unless something asked it to, so the layout is written
 * only when it is **dirty**: on a focus change, on a drag, on the first frame.
 * A focus change eases over about half a second and then stops dead. A hover
 * touches two matrices — the one being left and the one being entered — and
 * nothing else. Idle, the loop does one comparison and returns.
 *
 * The bounding sphere is not measured any more either. Every card lives on a
 * shell of known radius centred on the origin, so the sphere is arithmetic
 * rather than a pass over two thousand instances; only a card that has been
 * dragged off the shell can grow it, and that is tracked as it happens.
 */

const CARD_W = 1;
const CARD_H = 1;
/** Centre-to-centre spacing aimed for on the surface. */
const SPACING = 1.28;
/** The golden angle, in radians. */
const GOLDEN = Math.PI * (3 - Math.sqrt(5));
/** Scale factor applied to a seat's resting place when its set is not in focus. */
const CORE = 0.24;
/** Hold this to pull a card off the globe. Bare drags belong to the camera. */
const GRAB_KEY = 'shiftKey' as const;

/**
 * The radius that gives `count` cards that spacing.
 *
 * Nearest-neighbour distance on a Fibonacci sphere is about `sqrt(4π/N)·R`, so
 * solving for R keeps the gap between cards constant however many there are —
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
 * The focused cards keep the *full* radius and spread over the whole globe, so
 * the camera never has to move: a set of eleven that was one card in two
 * thousand becomes eleven cards alone on a sphere. Everybody else contracts to
 * a small dense core at the centre, which reads as the rest of the census still
 * being there rather than having been deleted.
 */
function focusPlace(n: number, total: number, count: number, out: THREE.Vector3): THREE.Vector3 {
  return fibonacci(n, total, sphereRadius(count), out);
}

/** Live pointer state, shared with the frame loop without going through React. */
interface View {
  hovered: number;
  picked: number;
  /** Bumped whenever a card is dragged, to mark the layout dirty. */
  tick: number;
  dragging: boolean;
  /** How far the furthest dragged card sits from the origin. */
  reach: number;
}

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

/** Resolve where one seat belongs. Shared by the drawing and the picker. */
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
  focusSet,
  moved,
  focusOrder,
  view,
  register,
}: {
  atlas: Atlas;
  offset: number;
  seats: Seat[];
  count: number;
  focusSet: string | null;
  moved: Map<number, THREE.Vector3>;
  /** Seat index to its place within the focused set, when one is focused. */
  focusOrder: Map<number, number>;
  view: React.MutableRefObject<View>;
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

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const target = useMemo(() => new THREE.Vector3(), []);
  const look = useMemo(() => new THREE.Vector3(), []);
  /** Where each instance is right now, so a focus change can be eased. */
  const live = useRef<Float32Array>(new Float32Array(0));
  const st = useRef({ key: '', primed: false, settled: false, hovered: -1, picked: -1, tick: -1 });

  const layoutKey = `${focusSet ?? '*'}|${count}|${focusOrder.size}`;

  /** Compose and store one instance's matrix from its current position. */
  const write = useCallback(
    (m: THREE.InstancedMesh, k: number, i: number) => {
      const cur = live.current;
      const v = view.current;
      const seat = seats[i];
      const inFocus = !focusSet || seat.set.id === focusSet;
      const x = cur[k * 3];
      const y = cur[k * 3 + 1];
      const z = cur[k * 3 + 2];
      const len = Math.hypot(x, y, z) || 1;
      // Cards stand on the shell facing outwards, so a lift is a step further
      // out along the radius rather than a step towards a camera that has since
      // orbited somewhere else.
      const lift = v.picked === i ? 1.6 : v.hovered === i ? 0.5 : 0;
      const grow = (len + lift) / len;
      dummy.position.set(x * grow, y * grow, z * grow);
      look.copy(dummy.position).multiplyScalar(2);
      if (look.lengthSq() < 1e-6) look.set(0, 0, 1);
      dummy.lookAt(look);
      const s = !inFocus
        ? 0.34
        : v.picked === i
          ? 2.4
          : v.hovered === i
            ? 1.9
            : focusOrder.size
              ? 2.2
              : 1;
      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      m.setMatrixAt(k, dummy.matrix);
    },
    [dummy, focusOrder.size, focusSet, look, seats, view],
  );

  useFrame((_, delta) => {
    const m = mesh.current;
    if (!m) return;
    const s = st.current;
    const v = view.current;

    if (live.current.length !== atlas.used * 3) {
      live.current = new Float32Array(atlas.used * 3);
      s.primed = false;
    }
    if (s.key !== layoutKey) {
      s.key = layoutKey;
      s.settled = false;
    }
    // A drag bumps the tick; anything else that moves cards clears `settled`.
    if (!s.settled || s.tick !== v.tick) {
      s.tick = v.tick;
      // A drag must track the pointer exactly; a focus change is worth easing.
      const k = !s.primed || v.dragging ? 1 : 1 - Math.exp(-delta * 8);
      const cur = live.current;
      let furthest = 0;
      let moving = 0;
      for (let j = 0; j < atlas.used; j++) {
        const i = offset + j;
        placeOf(i, count, moved, focusOrder, target);
        const o = j * 3;
        const dx = target.x - cur[o];
        const dy = target.y - cur[o + 1];
        const dz = target.z - cur[o + 2];
        const d = dx * dx + dy * dy + dz * dz;
        if (d > moving) moving = d;
        cur[o] += dx * k;
        cur[o + 1] += dy * k;
        cur[o + 2] += dz * k;
        const r = Math.hypot(cur[o], cur[o + 1], cur[o + 2]);
        if (r > furthest) furthest = r;
        write(m, j, i);
      }
      s.primed = true;
      s.settled = moving < 4e-6;
      s.hovered = v.hovered;
      s.picked = v.picked;
      m.instanceMatrix.needsUpdate = true;
      // Arithmetic, not a pass over every instance: the shell radius plus the
      // most a card can stick out of it. Only a dragged card can beat that, and
      // `furthest` is already to hand from the loop above.
      m.boundingSphere = new THREE.Sphere(new THREE.Vector3(), furthest + 4);
      return;
    }

    // Settled. The only thing that can change now is which card is lit, and
    // that is two matrices out of two thousand.
    if (s.hovered === v.hovered && s.picked === v.picked) return;
    for (const i of [s.hovered, s.picked, v.hovered, v.picked]) {
      const j = i - offset;
      if (j >= 0 && j < atlas.used) write(m, j, i);
    }
    s.hovered = v.hovered;
    s.picked = v.picked;
    m.instanceMatrix.needsUpdate = true;
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
 * directly against the pointer. It is a few dozen lines, it is debuggable, and
 * it is the same maths the library would have run.
 *
 * **A bare drag belongs to the camera.** The first version started a card drag
 * from any press that landed on a card and switched the orbit controls off for
 * the duration — and since the globe is made entirely of cards, that meant the
 * globe could not be turned at all. Pressing and dragging now always orbits;
 * holding shift is what picks a card up.
 *
 * Hover raycasts are throttled to one per animation frame. A pointer move can
 * fire well over a hundred times a second, and each raycast walks every
 * instance of every block.
 */
function Picker({
  blocks,
  moved,
  count,
  focusOrder,
  view,
  onPick,
  onHover,
}: {
  blocks: React.MutableRefObject<Map<number, THREE.InstancedMesh>>;
  moved: Map<number, THREE.Vector3>;
  count: number;
  focusOrder: Map<number, number>;
  view: React.MutableRefObject<View>;
  onPick: (i: number) => void;
  onHover: (i: number | null, x: number, y: number) => void;
}) {
  const { camera, gl, controls } = useThree();
  const ray = useMemo(() => new THREE.Raycaster(), []);
  const ndc = useMemo(() => new THREE.Vector2(), []);
  const scratch = useMemo(() => new THREE.Vector3(), []);
  const over = useRef<number | null>(null);
  const press = useRef<{ index: number; x: number; y: number } | null>(null);
  const drag = useRef<{
    index: number;
    plane: THREE.Plane;
    grab: THREE.Vector3;
    moved: boolean;
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    const el = gl.domElement;
    let queued = 0;

    const hit = (cx: number, cy: number) => {
      const r = el.getBoundingClientRect();
      ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
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

    const clearHover = () => {
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
      // A bare press is the camera's. Only shift pulls a card off the globe.
      if (!h || !ev[GRAB_KEY]) return;
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
      clearHover();
    };

    const move = (ev: PointerEvent) => {
      const d = drag.current;
      if (d) {
        const r = el.getBoundingClientRect();
        ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
        ray.setFromCamera(ndc, camera);
        const p = new THREE.Vector3();
        if (!ray.ray.intersectPlane(d.plane, p)) return;
        const next = p.sub(d.grab);
        // Slop measured on screen, not in the world. A world-space threshold
        // depends on how far the camera is and on floating-point noise in the
        // plane intersection, and it turned every click into a one-pixel drag.
        if (!d.moved && Math.hypot(ev.clientX - d.x, ev.clientY - d.y) < 5) return;
        d.moved = true;
        const c = controls as unknown as { enabled?: boolean } | null;
        if (c) c.enabled = false;
        moved.set(d.index, next);
        view.current.dragging = true;
        view.current.tick++;
        return;
      }
      // Any button down is an orbit in progress; nothing to hover.
      if (ev.buttons !== 0) {
        clearHover();
        return;
      }
      // One raycast per frame at most, however fast the pointer is moving.
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
      const d = drag.current;
      const pr = press.current;
      drag.current = null;
      press.current = null;
      if (d) {
        el.releasePointerCapture?.(ev.pointerId);
        const c = controls as unknown as { enabled?: boolean } | null;
        if (c) c.enabled = true;
        view.current.dragging = false;
        view.current.tick++;
        return;
      }
      // A press that never turned into a drag is a click, and a click opens the
      // card. Everything else that happened between down and up was the camera.
      if (pr && Math.hypot(ev.clientX - pr.x, ev.clientY - pr.y) < 5) onPick(pr.index);
    };

    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointerleave', clearHover);
    return () => {
      if (queued) cancelAnimationFrame(queued);
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointerleave', clearHover);
    };
  }, [blocks, camera, controls, count, focusOrder, gl, moved, ndc, onHover, onPick, ray, scratch, view]);

  return null;
}

export function FaceWall(props: WallProps) {
  const { seats, atlases } = props;
  // Cards the viewer has moved. Kept outside React state so a drag does not
  // re-render two thousand instances sixty times a second.
  const [moved] = useState(() => new Map<number, THREE.Vector3>());
  const view = useRef<View>({ hovered: -1, picked: -1, tick: 0, dragging: false, reach: 0 });
  view.current.picked = props.picked ?? -1;

  // Focusing a set spreads it over the whole globe and contracts everyone else
  // into the core. Dimming in place made the tabs decorative — a set of eleven
  // was simply impossible to find among two thousand.
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
  // holds two hundred cards or two thousand.
  const radius = useMemo(() => sphereRadius(seats.length), [seats.length]);

  return (
    <Canvas
      camera={{ position: [0, 0, radius * 2.6], fov: 45, near: 0.1, far: radius * 20 }}
      // Two thousand alpha-tested cards is a lot of overdraw; past about 1.75
      // the extra pixels buy nothing you can see on a card this size.
      dpr={[1, 1.75]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
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
          focusSet={props.focusSet}
          moved={moved}
          focusOrder={focusOrder}
          view={view}
          register={register}
        />
      ))}
      <Picker
        blocks={blocks}
        moved={moved}
        count={seats.length}
        focusOrder={focusOrder}
        view={view}
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
        // back out at two thousand cards is the best thing this view does.
        minDistance={0.4}
        maxDistance={radius * 6}
      />
    </Canvas>
  );
}
