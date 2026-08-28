import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { Beast } from './beasts';
import { sigilCanvas } from './sigil';
import { advance, DISH, spinLeft, type Bout, type Top } from './physics';
import { makeWoodTexture } from '../../three/textures';

/**
 * The dish, in three dimensions.
 *
 * The simulation is flat and knows nothing about this file; all this does is
 * read two positions and a spin and put something in the world at them. The
 * height of a top is not simulated either — it is looked up off the bowl
 * profile, because a top on a curved floor is at the height of the floor, and
 * working that out in the renderer is free while simulating it is not.
 *
 * The dish is a lathe of one profile function, which means the visible bowl and
 * the height a top sits at can never disagree: they are the same curve.
 */

/** How deep the bowl is at the wall, in dish units. */
const DEPTH = 0.24;
/** Height of the floor of the dish under a top, at radius r. */
const floorAt = (r: number) => DEPTH * Math.min(1.15, r / DISH.radius) ** 2;

const TOP_H = 0.09;

/**
 * Half the horizontal field the camera must cover, in radians.
 *
 * The dish flange runs to 1.4 units and the camera sits about 3.7 away, so this
 * is the angle that puts the far rim just inside the frame. Everything else
 * about the framing is derived from it and the window's aspect.
 */
const HALF_WIDE = Math.atan(1.52 / 3.55);

function bowlProfile(): THREE.Vector2[] {
  const pts: THREE.Vector2[] = [];
  const n = 26;
  for (let i = 0; i <= n; i++) {
    const r = (i / n) * DISH.radius;
    pts.push(new THREE.Vector2(r, floorAt(r)));
  }
  // The lip: up over the rim and out onto a flange, which is what actually
  // reads as a stadium rather than as a saucer.
  pts.push(new THREE.Vector2(DISH.radius * 1.02, DEPTH * 1.5));
  pts.push(new THREE.Vector2(DISH.radius * 1.1, DEPTH * 1.62));
  pts.push(new THREE.Vector2(DISH.radius * 1.34, DEPTH * 1.3));
  pts.push(new THREE.Vector2(DISH.radius * 1.4, DEPTH * 1.34));
  return pts;
}

function Dish() {
  const geo = useMemo(() => new THREE.LatheGeometry(bowlProfile(), 96), []);
  useEffect(() => () => geo.dispose(), [geo]);
  const ring = useMemo(() => new THREE.TorusGeometry(DISH.radius * 1.02, 0.016, 8, 96), []);
  useEffect(() => () => ring.dispose(), [ring]);
  return (
    <group>
      <mesh geometry={geo} receiveShadow>
        <meshStandardMaterial color="#8d949c" metalness={0.5} roughness={0.42} side={THREE.DoubleSide} />
      </mesh>
      {/* The painted line round the lip, so the edge you can be thrown over is
          visible from every camera angle. */}
      <mesh geometry={ring} position={[0, DEPTH * 1.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color="#b8342c" roughness={0.6} />
      </mesh>
      {/* Painted rings on the floor of the dish. Not decoration: they are the
          only way to read how far in a top has spiralled, which is the whole
          state of a stamina round. */}
      {[0.32, 0.62, 0.88].map((r) => (
        <mesh key={r} rotation={[-Math.PI / 2, 0, 0]} position={[0, floorAt(r) + 0.003, 0]}>
          <ringGeometry args={[r - 0.007, r + 0.007, 72]} />
          <meshBasicMaterial color="#e6e9ec" transparent opacity={0.42} />
        </mesh>
      ))}
      {/* A dark well in the middle, so the bowl has a bottom you can see. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
        <circleGeometry args={[0.2, 48]} />
        <meshBasicMaterial color="#5f666e" transparent opacity={0.55} />
      </mesh>
    </group>
  );
}

function Desk() {
  const tex = useMemo(() => {
    const t = makeWoodTexture('#8a5a2b', '#5d3a17', 2);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(3, 3);
    return t;
  }, []);
  useEffect(() => () => tex.dispose(), [tex]);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
      <planeGeometry args={[9, 9]} />
      <meshStandardMaterial map={tex} roughness={0.85} />
    </mesh>
  );
}

/** One top: a tip, a weight ring, and the beast's mark on the face. */
function Blade({
  beast,
  state,
}: {
  beast: Beast;
  state: React.MutableRefObject<Top | null>;
}) {
  const group = useRef<THREE.Group>(null);
  const face = useRef<THREE.Mesh>(null);

  const tex = useMemo(() => {
    const t = new THREE.CanvasTexture(sigilCanvas(beast, 256, '#22201d'));
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }, [beast]);
  useEffect(() => () => tex.dispose(), [tex]);

  useFrame(() => {
    const g = group.current;
    const s = state.current;
    if (!g) return;
    // No bout yet: there is no top on the table, so do not draw one at the
    // origin looking as though there is.
    g.visible = !!s;
    if (!s) return;
    if (s.out) {
      // Thrown clear: it keeps going, off the flange and onto the floor.
      g.visible = true;
      g.position.set(s.x * 1.02, Math.max(0, g.position.y - 0.035), s.y * 1.02);
      g.rotation.z += 0.4;
      return;
    }
    const r = Math.hypot(s.x, s.y);
    g.position.set(s.x, floorAt(r) + TOP_H * 0.5, s.y);
    // A dying top leans further and further over, then lies down.
    const lean = s.dead ? Math.PI / 2 : s.wobble * 0.5;
    const phase = s.angle * 0.13;
    g.rotation.set(Math.cos(phase) * lean, s.angle, Math.sin(phase) * lean);
    if (face.current) face.current.rotation.z = -s.angle * 0.15;
  });

  return (
    <group ref={group}>
      {/* the weight ring: the wide, heavy part that does the hitting */}
      <mesh castShadow>
        <cylinderGeometry args={[DISH.top, DISH.top * 0.9, 0.055, 30]} />
        <meshStandardMaterial color={beast.ink} metalness={0.55} roughness={0.35} />
      </mesh>
      {/* the bevel above it */}
      <mesh position={[0, 0.04, 0]}>
        <cylinderGeometry args={[DISH.top * 0.78, DISH.top * 0.97, 0.03, 30]} />
        <meshStandardMaterial color={beast.wash} metalness={0.3} roughness={0.5} />
      </mesh>
      {/* the tip */}
      <mesh position={[0, -0.055, 0]}>
        <coneGeometry args={[DISH.top * 0.32, 0.06, 16]} />
        <meshStandardMaterial color="#8d8d92" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* the face, with the mark on it */}
      <mesh ref={face} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.056, 0]}>
        <circleGeometry args={[DISH.top * 0.76, 32]} />
        <meshStandardMaterial map={tex} transparent roughness={0.5} />
      </mesh>
    </group>
  );
}

/** The beast itself, when it is called: the mark, standing up out of the dish. */
function Manifest({
  beast,
  state,
}: {
  beast: Beast;
  state: React.MutableRefObject<Top | null>;
}) {
  const group = useRef<THREE.Group>(null);
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  const ringMat = useRef<THREE.MeshBasicMaterial>(null);
  const { camera } = useThree();
  const tex = useMemo(() => {
    const t = new THREE.CanvasTexture(sigilCanvas(beast, 256));
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [beast]);
  useEffect(() => () => tex.dispose(), [tex]);

  useFrame((_, dt) => {
    const g = group.current;
    const s = state.current;
    if (!g || !s) return;
    const on = s.calling > 0;
    g.visible = on;
    if (!on) return;
    // Rises out of the top and turns to face whoever is watching.
    const grow = 1 - Math.exp(-(2.2 - s.calling) * 2.6);
    // Big enough to be an event, small enough to leave the dish visible. The
    // first pass scaled to nearly two dish-radii and simply covered the fight.
    g.position.set(s.x, floorAt(Math.hypot(s.x, s.y)) + 0.14 + grow * 0.3, s.y);
    g.scale.setScalar(0.3 + grow * 0.52);
    g.lookAt(camera.position);
    if (mat.current) mat.current.opacity = 0.28 + Math.min(1, s.calling) * 0.5;
    if (ringMat.current) ringMat.current.opacity = 0.5 * Math.min(1, s.calling);
    g.rotateZ(dt * 1.6);
  });

  return (
    <group ref={group} visible={false}>
      <mesh>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          ref={mat}
          map={tex}
          transparent
          opacity={0.6}
          depthWrite={false}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
      <mesh>
        <ringGeometry args={[0.56, 0.62, 48]} />
        <meshBasicMaterial
          ref={ringMat}
          color={beast.ink}
          transparent
          opacity={0.5}
          depthWrite={false}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

/** Contact sparks, as one instanced puff. */
function Sparks({ bout }: { bout: React.MutableRefObject<Bout | null> }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Parked before anything else runs. An InstancedMesh starts with every
  // instance on the identity matrix, which for a unit sphere is sixty-four
  // full-size spheres stacked at the origin — a yellow blob the size of the
  // dish, sitting there through the entire launch screen.
  useEffect(() => {
    const m = mesh.current;
    if (!m) return;
    dummy.scale.setScalar(0);
    dummy.updateMatrix();
    for (let i = 0; i < 64; i++) m.setMatrixAt(i, dummy.matrix);
    m.instanceMatrix.needsUpdate = true;
  }, [dummy]);

  useFrame(() => {
    const m = mesh.current;
    const b = bout.current;
    if (!m) return;
    if (!b) return;
    let n = 0;
    for (const s of b.sparks) {
      for (let k = 0; k < 4 && n < 64; k++) {
        const a = (k / 4) * Math.PI * 2 + s.life * 9;
        const spread = (1 - s.life) * 0.16 * s.power;
        dummy.position.set(
          s.x + Math.cos(a) * spread,
          floorAt(Math.hypot(s.x, s.y)) + 0.05 + (1 - s.life) * 0.1,
          s.y + Math.sin(a) * spread,
        );
        dummy.scale.setScalar(Math.max(0, s.life) * s.power * 0.12);
        dummy.updateMatrix();
        m.setMatrixAt(n++, dummy.matrix);
      }
    }
    // Everything unused is parked at zero scale rather than removed.
    dummy.scale.setScalar(0);
    dummy.updateMatrix();
    for (; n < 64; n++) m.setMatrixAt(n, dummy.matrix);
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, 64]} frustumCulled={false}>
      <sphereGeometry args={[1, 6, 5]} />
      <meshBasicMaterial color="#ffd88a" toneMapped={false} transparent opacity={0.9} />
    </instancedMesh>
  );
}

/**
 * The clock.
 *
 * The simulation is advanced here, once per rendered frame, because this is the
 * only place with a reliable frame delta — and it is advanced in fixed steps
 * inside `advance`, so the result does not depend on the frame rate it was
 * watched at.
 */
function Runner({
  bout,
  running,
  onTick,
  onFinish,
}: {
  bout: React.MutableRefObject<Bout | null>;
  running: boolean;
  onTick: (b: Bout) => void;
  onFinish: (b: Bout) => void;
  }) {
  const { camera, size } = useThree();
  const done = useRef(false);
  /**
   * Which bout the "already reported" flag belongs to.
   *
   * The first version reset that flag from an effect keyed on `running`, which
   * is set to false *by* the report — so the effect re-ran, cleared the flag,
   * and the very next frame reported the same finish a second time. Every round
   * scored twice, and a two-point ring-out ended a first-to-four match 4-0 in
   * one round. A new round is a new `Bout` object, so that is what the flag
   * should be keyed on, and it is checked in the same place it is used.
   */
  const seen = useRef<Bout | null>(null);
  const base = useMemo(() => new THREE.Vector3(0, 2.35, 2.85), []);
  const eye = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, dt) => {
    const b = bout.current;
    if (!b) return;
    if (seen.current !== b) {
      seen.current = b;
      done.current = false;
    }
    if (running && !b.outcome) advance(b, dt);
    onTick(b);
    if (b.outcome && !done.current) {
      done.current = true;
      onFinish(b);
    }
    // Frame the dish for the shape of the window, not for a fixed field of view.
    //
    // A phone held upright is about 0.45 aspect; at a fixed vertical field that
    // leaves a horizontal field a third the width and the dish is cropped at
    // both sides. Solving the horizontal half-angle for the dish's own radius
    // and converting back gives a view that fits on anything from a phone to an
    // ultrawide.
    const cam = camera as THREE.PerspectiveCamera;
    const aspect = size.width / Math.max(1, size.height);
    const want = Math.max(
      34,
      Math.min(80, (2 * Math.atan(Math.tan(HALF_WIDE) / aspect) * 180) / Math.PI),
    );
    if (Math.abs(cam.fov - want) > 0.25) {
      cam.fov = want;
      cam.updateProjectionMatrix();
    }

    // Where the camera stands also follows the shape of the window. A phone held
    // upright gets a view from much closer to overhead: the dish projects almost
    // round from up there, which fills a tall frame, where the low
    // three-quarter view that suits a laptop leaves a shallow band with nothing
    // above or below it.
    const tall = Math.max(0, Math.min(1, (1.15 - aspect) / 0.6));
    eye.set(0, base.y + tall * 1.15, base.z - tall * 1.25);

    // Shake, and a slow drift so the dish is never quite static.
    const k = b.shake * 0.05;
    camera.position.set(
      eye.x + (Math.random() - 0.5) * k,
      eye.y + (Math.random() - 0.5) * k,
      eye.z + (Math.random() - 0.5) * k,
    );
    camera.lookAt(0, 0, 0);
  });
  return null;
}

export interface ArenaProps {
  bout: React.MutableRefObject<Bout | null>;
  beasts: [Beast, Beast];
  running: boolean;
  onTick: (b: Bout) => void;
  onFinish: (b: Bout) => void;
}

export function Arena(props: ArenaProps) {
  const a = useRef<Top | null>(null);
  const b = useRef<Top | null>(null);
  useFrameless(props.bout, a, b);

  return (
    <Canvas
      shadows
      camera={{ position: [0, 2.35, 2.85], fov: 42, near: 0.1, far: 40 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true }}
    >
      <color attach="background" args={['#1b1a18']} />
      <fog attach="fog" args={['#1b1a18', 4.2, 9.5]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[2.4, 4.2, 2]} intensity={1.5} castShadow shadow-mapSize={[1024, 1024]} />
      <pointLight position={[-1.8, 1.4, -1.6]} intensity={12} distance={7} color="#ffd2a0" />
      <Desk />
      <Dish />
      <Blade beast={props.beasts[0]} state={a} />
      <Blade beast={props.beasts[1]} state={b} />
      <Manifest beast={props.beasts[0]} state={a} />
      <Manifest beast={props.beasts[1]} state={b} />
      <Sparks bout={props.bout} />
      <Runner bout={props.bout} running={props.running} onTick={props.onTick} onFinish={props.onFinish} />
    </Canvas>
  );
}

/**
 * Point the two per-top refs at whatever bout is current.
 *
 * The tops are handed to the meshes as refs rather than as props so that a new
 * round — a whole new `Bout` object — does not remount two models, two textures
 * and two canvases sixty times a match.
 */
function useFrameless(
  bout: React.MutableRefObject<Bout | null>,
  a: React.MutableRefObject<Top | null>,
  b: React.MutableRefObject<Top | null>,
) {
  useEffect(() => {
    let alive = true;
    const pump = () => {
      if (!alive) return;
      a.current = bout.current?.tops[0] ?? null;
      b.current = bout.current?.tops[1] ?? null;
      requestAnimationFrame(pump);
    };
    pump();
    return () => {
      alive = false;
    };
  }, [bout, a, b]);
}

export { spinLeft };
