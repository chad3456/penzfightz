import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

/**
 * A globe of drawings.
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

export interface Plate {
  canvas: HTMLCanvasElement;
  grid: number;
  used: number;
  /** Aspect of one cell, width over height. */
  aspect: number;
}

/** Radius that gives `count` cards a constant gap, whatever the count. */
export const globeRadius = (count: number) =>
  SPACING * Math.sqrt(Math.max(1, count) / (4 * Math.PI));

function place(i: number, count: number, radius: number, out: THREE.Vector3) {
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
  view,
  register,
}: {
  plate: Plate;
  offset: number;
  count: number;
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

  const write = useCallback(
    (m: THREE.InstancedMesh, k: number, i: number) => {
      const v = view.current;
      place(i, count, globeRadius(count), at);
      const lift = v.picked === i ? 1.6 : v.hovered === i ? 0.55 : 0;
      const len = at.length() || 1;
      dummy.position.copy(at).multiplyScalar((len + lift) / len);
      look.copy(dummy.position).multiplyScalar(2);
      if (look.lengthSq() < 1e-6) look.set(0, 0, 1);
      dummy.lookAt(look);
      const s = (v.picked === i ? 2.2 : v.hovered === i ? 1.8 : 1) * FIT;
      dummy.scale.set(s * plate.aspect, s, s);
      dummy.updateMatrix();
      m.setMatrixAt(k, dummy.matrix);
    },
    [at, count, dummy, look, plate.aspect, view],
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
      m.boundingSphere = new THREE.Sphere(new THREE.Vector3(), globeRadius(count) + 4);
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
}: {
  plates: Plate[];
  count: number;
  picked: number | null;
  hovered: number | null;
  onPick: (i: number) => void;
  onHover: (i: number | null, x: number, y: number) => void;
}) {
  const view = useRef<View>({ hovered: -1, picked: -1 });
  view.current.hovered = hovered ?? -1;
  view.current.picked = picked ?? -1;

  const blocks = useRef<Map<number, THREE.InstancedMesh>>(new Map());
  const register = useCallback((offset: number, mesh: THREE.InstancedMesh | null) => {
    if (mesh) blocks.current.set(offset, mesh);
    else blocks.current.delete(offset);
  }, []);

  const radius = useMemo(() => globeRadius(count), [count]);

  return (
    <Canvas
      camera={{
        position: [0, 0, radius * 2.7],
        fov: 45,
        near: 0.1,
        far: radius * 20,
      }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
    >
      <color attach="background" args={['#2a2926']} />
      {plates.map((p, n) => (
        <Block
          key={n}
          plate={p}
          offset={n * p.grid * p.grid}
          count={count}
          view={view}
          register={register}
        />
      ))}
      <Picker blocks={blocks} view={view} onPick={onPick} onHover={onHover} />
      <OrbitControls
        makeDefault
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.5}
        minDistance={0.5}
        maxDistance={radius * 6}
      />
    </Canvas>
  );
}
