import { useCallback, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { CuboidCollider, RigidBody, RoundCuboidCollider, type RapierRigidBody } from '@react-three/rapier';
import {
  FACES,
  FLAT_ENOUGH,
  SIZE,
  dieGeometries,
  faceUp,
  fruitMaterial,
  jellyMaterial,
  pipMaterial,
  pipTransforms,
  squashMatrix,
  stalkMaterial,
  stepSquash,
  type Squash,
} from './die';
import type { Flavour } from './flavours';
import { FLOOR_SPAN, GROUND, GROUND_SPAN, TRAY_R, WALL_H, makeEnvironment, makeFloorTexture, wallPieces } from './table';

/**
 * The table: five jellies, a wall you cannot see, and the arithmetic that
 * decides when a roll is over.
 */

const CORNER = SIZE * 0.19;
const REST_Y = SIZE * 0.5;

/** Still enough to call it settled. */
const STILL_V = 0.14;
const STILL_W = 0.3;
/** Nothing is read for this long after the throw, however still it looks. */
const MIN_ROLL = 0.45;
/** Give up nudging a cocked die after this many tries. */
const MAX_NUDGE = 5;
const WORLD_UP = new THREE.Vector3(0, 1, 0);
/**
 * However badly it is going, a roll resolves within this many seconds.
 *
 * Dice wedged against each other can jitter below the stillness threshold for
 * a long time, and a reading that never arrives is the worst possible failure
 * here: the table looks finished and the panel says the roll is still going.
 */
const GIVE_UP = 6;

export interface Handle {
  roll: () => void;
}

/**
 * Frame the tray, whatever shape the window is.
 *
 * A fixed camera position is fine until somebody opens it on a phone, where a
 * distance chosen for a landscape window puts half the table off the sides.
 * The tray is a circle of known radius, so the distance that fits it can just
 * be worked out from the field of view — and it has to be worked out for both
 * axes, since which one is tighter depends on the window.
 */
function Rig() {
  const { camera, size } = useThree();
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const halfV = THREE.MathUtils.degToRad(cam.fov) / 2;
    const halfH = Math.atan(Math.tan(halfV) * (size.width / size.height));
    // Seen from above the circle is foreshortened, so the vertical needs less
    // room than the horizontal for the same radius. A tall window is looked at
    // from higher up so that the table does not become a coaster in the middle
    // of a lot of empty floor.
    const tall = size.height > size.width;
    const want = TRAY_R * (tall ? 1.12 : 1.1);
    const pitch = THREE.MathUtils.degToRad(tall ? 50 : 41);
    // Fitting the *centre* of the tray is not enough. The near edge is closer
    // to the camera than the centre by the tray's radius foreshortened, and
    // being closer it is magnified — so a distance that fits the middle crops
    // the dice that landed at the front.
    const near = TRAY_R * Math.cos(pitch);
    const dist =
      near +
      Math.max(want / Math.tan(halfH), (want * Math.sin(pitch) + (tall ? 0.5 : 1.0)) / Math.tan(halfV));
    cam.position.set(0, Math.sin(pitch) * dist, Math.cos(pitch) * dist);
    cam.lookAt(0, 0, 0);
    cam.updateProjectionMatrix();
  }, [camera, size]);
  return null;
}

// --------------------------------------------------------------------- one die

interface DieProps {
  index: number;
  flavour: Flavour;
  register: (i: number, body: RapierRigidBody | null) => void;
  onImpact: (i: number, speed: number, dir: THREE.Vector3) => void;
  onGrab: (i: number, e: ThreeEvent<PointerEvent>) => void;
  squash: Squash;
}

function Die({ index, flavour, register, onImpact, onGrab, squash }: DieProps) {
  const body = useRef<RapierRigidBody>(null);
  const jelly = useRef<THREE.Group>(null);
  const geo = useMemo(dieGeometries, []);
  const pips = useMemo(pipTransforms, []);

  const mats = useMemo(
    () => ({ body: jellyMaterial(flavour), pip: pipMaterial(flavour), fruit: fruitMaterial(flavour), stalk: stalkMaterial() }),
    [flavour],
  );
  useEffect(() => () => Object.values(mats).forEach((m) => m.dispose()), [mats]);

  /**
   * Place the pips whenever the instanced mesh is (re)created.
   *
   * This has to be a callback ref rather than an effect. Changing flavour
   * changes the pip material, the material is part of the mesh's `args`, and a
   * change of `args` makes R3F build a whole new `InstancedMesh` — with a
   * fresh, identity instance matrix. An effect keyed on the transforms does
   * not re-run, because the transforms never changed, so every pip stays at
   * the origin at its geometry's own radius of one and the die is swallowed by
   * a single white sphere.
   */
  const attachPips = useCallback(
    (m: THREE.InstancedMesh | null) => {
      if (!m) return;
      pips.forEach((t, i) => m.setMatrixAt(i, t));
      m.instanceMatrix.needsUpdate = true;
    },
    [pips],
  );

  useEffect(() => {
    register(index, body.current);
    return () => register(index, null);
  }, [index, register]);

  // Speed carried into the collision. `onCollisionEnter` fires after the solver
  // has already taken the energy out, so the impact has to be remembered from
  // the frame before or every landing reads as a gentle one.
  const lastV = useRef(new THREE.Vector3());
  const scratch = useMemo(() => ({ m: new THREE.Matrix4(), q: new THREE.Quaternion(), axis: new THREE.Vector3() }), []);

  useFrame((_, dt) => {
    const b = body.current;
    const g = jelly.current;
    if (!b || !g) return;

    const v = b.linvel();
    lastV.current.set(v.x, v.y, v.z);

    stepSquash(squash, Math.min(dt, 1 / 30));

    // The flattening is world-aligned — towards the table, not along whichever
    // way the die happens to have rolled — so the axis has to be brought back
    // into the body's own frame before it can be a local matrix on a child.
    const r = b.rotation();
    scratch.q.set(r.x, r.y, r.z, r.w).invert();
    scratch.axis.copy(squash.axis).applyQuaternion(scratch.q).normalize();
    squashMatrix(scratch.m, scratch.axis, squash.amp);
    g.matrix.copy(scratch.m);
    g.matrixWorldNeedsUpdate = true;
  });

  return (
    <RigidBody
      ref={body}
      colliders={false}
      position={[(index - 2) * 1.3, REST_Y + index * 0.02, 0]}
      linearDamping={0.62}
      angularDamping={0.92}
      canSleep
      ccd
      onCollisionEnter={() => {
        const s = lastV.current.length();
        if (s > 0.6) onImpact(index, s, lastV.current);
      }}
    >
      <RoundCuboidCollider
        args={[SIZE / 2 - CORNER, SIZE / 2 - CORNER, SIZE / 2 - CORNER, CORNER]}
        mass={0.42}
        friction={0.55}
        restitution={0.36}
      />
      <group ref={jelly} matrixAutoUpdate={false}>
        <mesh
          geometry={geo.bodyGeo}
          material={mats.body}
          castShadow
          onPointerDown={(e) => onGrab(index, e)}
        />
        <instancedMesh ref={attachPips} args={[geo.pipGeo, mats.pip, pips.length]} />
        <mesh geometry={geo.fruitGeo} material={mats.fruit} />
        {flavour.stalk && (
          <mesh geometry={geo.stalkGeo} material={mats.stalk} position={[0, SIZE * 0.13, 0]} rotation={[0, 0, Math.PI * 0.5]} />
        )}
      </group>
    </RigidBody>
  );
}

// ----------------------------------------------------------------- the table

export function Table({
  count,
  flavour,
  handle,
  onRolling,
  onSettled,
  onClack,
}: {
  count: number;
  flavour: Flavour;
  handle: { current: Handle };
  onRolling: () => void;
  onSettled: (values: number[]) => void;
  onClack: (force: number) => void;
}) {
  const { gl, scene, camera, raycaster } = useThree();

  // The environment is what a transmissive material refracts. Without one the
  // jelly renders as flat grey and reads as a bug in the geometry.
  useEffect(() => {
    const env = makeEnvironment(gl as THREE.WebGLRenderer);
    scene.environment = env;
    // Turned down on purpose. An image-based light this bright lights the
    // table from every direction at once, and a directional shadow laid over
    // it is a two per cent dip that reads as no shadow at all.
    scene.environmentIntensity = 0.85;
    scene.background = new THREE.Color(GROUND);
    return () => {
      scene.environment = null;
      env.dispose();
    };
  }, [gl, scene]);

  const floorTex = useMemo(() => makeFloorTexture(flavour.rim), [flavour.rim]);
  useEffect(() => () => floorTex.dispose(), [floorTex]);

  // The plane has to run past the edge of the frame or its own edge shows as a
  // hard line across the room. The texture stays at the size it was drawn for
  // and is clamped outwards — every pixel round the outside of it is already
  // the ground colour, so the tray keeps its scale and the join is invisible.
  useEffect(() => {
    const k = GROUND_SPAN / FLOOR_SPAN;
    floorTex.wrapS = THREE.ClampToEdgeWrapping;
    floorTex.wrapT = THREE.ClampToEdgeWrapping;
    floorTex.repeat.set(k, k);
    floorTex.offset.set((1 - k) / 2, (1 - k) / 2);
    floorTex.needsUpdate = true;
  }, [floorTex]);

  const walls = useMemo(wallPieces, []);
  const bodies = useRef<(RapierRigidBody | null)[]>([]);
  const register = useCallback((i: number, b: RapierRigidBody | null) => {
    bodies.current[i] = b;
  }, []);

  const squashes = useMemo(
    () => Array.from({ length: 6 }, () => ({ axis: new THREE.Vector3(0, 1, 0), amp: 0, vel: 0 }) as Squash),
    [],
  );

  const watching = useRef(false);
  const since = useRef(0);
  const nudges = useRef(0);

  const onImpact = useCallback(
    (i: number, speed: number, dir: THREE.Vector3) => {
      const s = squashes[i];
      // Flattened along the direction of travel, which for a die coming down
      // on the table is straight into it.
      s.axis.copy(dir).normalize();
      if (s.axis.lengthSq() < 0.5) s.axis.set(0, 1, 0);
      s.amp = Math.min(0.42, s.amp + speed * 0.05);
      s.vel = 0;
      onClack(speed);
    },
    [squashes, onClack],
  );

  // ----------------------------------------------------------------- throwing

  const roll = useCallback(() => {
    const list = bodies.current.slice(0, count).filter(Boolean) as RapierRigidBody[];
    if (!list.length) return;
    list.forEach((b, i) => {
      const a = (i / list.length) * Math.PI * 2 + Math.random() * 0.7;
      const r = TRAY_R * 0.46;
      b.setTranslation({ x: Math.cos(a) * r, y: 3.2 + Math.random() * 1.3, z: Math.sin(a) * r }, true);
      const q = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(Math.random() * 6.28, Math.random() * 6.28, Math.random() * 6.28),
      );
      b.setRotation({ x: q.x, y: q.y, z: q.z, w: q.w }, true);
      // Thrown towards the middle rather than straight down, so they scatter
      // and tumble instead of landing where they were dropped.
      // Fast enough to scatter, slow enough not to cross the tray and pile up
      // against the far wall. Most of the speed is downwards.
      b.setLinvel({ x: -Math.cos(a) * 1.9, y: -3.2, z: -Math.sin(a) * 1.9 }, true);
      b.setAngvel({ x: (Math.random() - 0.5) * 22, y: (Math.random() - 0.5) * 22, z: (Math.random() - 0.5) * 22 }, true);
      b.wakeUp();
    });
    watching.current = true;
    since.current = 0;
    nudges.current = 0;
    onRolling();
  }, [count, onRolling]);

  useEffect(() => {
    handle.current = { roll };
  }, [handle, roll]);

  // ------------------------------------------------------------ poke and drag

  const drag = useRef<{ i: number; plane: THREE.Plane; target: THREE.Vector3; moved: boolean } | null>(null);
  const hit = useMemo(() => new THREE.Vector3(), []);

  const onGrab = useCallback(
    (i: number, e: ThreeEvent<PointerEvent>) => {
      const b = bodies.current[i];
      if (!b || i >= count) return;
      e.stopPropagation();
      (e.target as Element | null)?.setPointerCapture?.(e.pointerId);
      const t = b.translation();
      drag.current = {
        i,
        plane: new THREE.Plane(new THREE.Vector3(0, 1, 0), -t.y),
        target: new THREE.Vector3(t.x, t.y, t.z),
        moved: false,
      };
      b.wakeUp();
    },
    [count],
  );

  useEffect(() => {
    const el = gl.domElement;

    const move = (e: PointerEvent) => {
      const d = drag.current;
      if (!d) return;
      const rect = el.getBoundingClientRect();
      const ndc = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(ndc, camera);
      if (raycaster.ray.intersectPlane(d.plane, hit)) {
        // Held inside the wall. Flying a body to the pointer by setting its
        // velocity will push it straight through a thin static collider if the
        // pointer goes far enough outside, and a die that gets out never comes
        // back.
        const reach = TRAY_R - SIZE * 0.8;
        const far = Math.hypot(hit.x, hit.z);
        if (far > reach) {
          hit.x *= reach / far;
          hit.z *= reach / far;
        }
        if (d.target.distanceTo(hit) > 0.05) d.moved = true;
        d.target.copy(hit);
      }
    };

    const up = () => {
      const d = drag.current;
      drag.current = null;
      if (!d) return;
      const b = bodies.current[d.i];
      if (!b) return;
      if (!d.moved) {
        // A poke: straight up, with a bit of spin, and a squash to match.
        b.applyImpulse({ x: (Math.random() - 0.5) * 0.5, y: 2.1, z: (Math.random() - 0.5) * 0.5 }, true);
        b.applyTorqueImpulse(
          { x: (Math.random() - 0.5) * 0.09, y: (Math.random() - 0.5) * 0.09, z: (Math.random() - 0.5) * 0.09 },
          true,
        );
        const s = squashes[d.i];
        s.axis.set(0, 1, 0);
        s.amp = Math.min(0.4, s.amp + 0.3);
        s.vel = 0;
      }
      // Whatever the die was doing when it was let go, it keeps doing.
      watching.current = true;
      since.current = 0;
      nudges.current = 0;
      onRolling();
    };

    el.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      el.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
  }, [gl, camera, raycaster, hit, squashes, onRolling]);

  // ---------------------------------------------------------------- each frame

  const q = useMemo(() => new THREE.Quaternion(), []);
  const fix = useMemo(() => new THREE.Quaternion(), []);
  const up = useMemo(() => new THREE.Vector3(), []);
  const pull = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, dt) => {
    // A dragged die is flown to the pointer by setting its velocity rather
    // than by forces: it stays a dynamic body, so it still shoves the others
    // out of the way, but it cannot be outrun.
    const d = drag.current;
    if (d && d.moved) {
      const b = bodies.current[d.i];
      if (b) {
        const t = b.translation();
        pull.set(d.target.x - t.x, Math.max(REST_Y, d.target.y) - t.y, d.target.z - t.z);
        const lag = pull.length();
        // Soft on purpose, and capped. Flown to the pointer stiffly the die
        // arrives before the next frame, and a jelly that is never behind its
        // hand never stretches — the lag *is* the effect.
        // Also clamped by the frame length. The velocity is set once per
        // rendered frame and the solver then integrates it over the whole
        // delta, so on a slow frame a stiff follow overshoots the pointer and
        // the die arrives ahead of the hand that is pulling it.
        const k = Math.min(4.5, 0.9 / Math.max(dt, 1 / 120));
        b.setLinvel({ x: pull.x * k, y: pull.y * k, z: pull.z * k }, true);
        const s = squashes[d.i];
        if (lag > 0.01) {
          s.axis.copy(pull).normalize();
          // Negative is a stretch rather than a squash.
          s.amp = -Math.min(0.34, lag * 1.15);
          s.vel = 0;
        }
      }
    }

    if (!watching.current) return;
    since.current += dt;
    if (since.current < MIN_ROLL) return;

    const list = bodies.current.slice(0, count).filter(Boolean) as RapierRigidBody[];
    if (list.length !== count) return;

    // Anything that has left the table comes back. This should not happen, and
    // when it does the alternative is a roll that can never resolve.
    for (const b of list) {
      const t = b.translation();
      if (t.y > -3 && Math.hypot(t.x, t.z) < TRAY_R + 2) continue;
      b.setTranslation({ x: (Math.random() - 0.5) * 2, y: 2.4, z: (Math.random() - 0.5) * 2 }, true);
      b.setLinvel({ x: 0, y: -1, z: 0 }, true);
      b.setAngvel({ x: 0, y: 0, z: 0 }, true);
      b.wakeUp();
      since.current = 0;
      return;
    }

    const out = since.current > GIVE_UP;

    if (!out) {
      for (const b of list) {
        const v = b.linvel();
        const w = b.angvel();
        if (Math.hypot(v.x, v.y, v.z) > STILL_V) return;
        if (Math.hypot(w.x, w.y, w.z) > STILL_W) return;
      }
    }

    // Everything has stopped. A die propped on an edge or leaning on another
    // one has no face pointing up, and reading it would invent a number, so
    // it gets flicked and the wait starts again.
    const reads = list.map((b) => {
      const r = b.rotation();
      return faceUp(q.set(r.x, r.y, r.z, r.w));
    });
    const cocked = reads.findIndex((r) => r.flatness < FLAT_ENOUGH);
    if (cocked >= 0 && !out && nudges.current < MAX_NUDGE) {
      nudges.current++;
      const b = list[cocked];
      b.wakeUp();
      b.applyImpulse({ x: (Math.random() - 0.5) * 1.2, y: 1.9, z: (Math.random() - 0.5) * 1.2 }, true);
      b.applyTorqueImpulse(
        { x: (Math.random() - 0.5) * 0.13, y: (Math.random() - 0.5) * 0.13, z: (Math.random() - 0.5) * 0.13 },
        true,
      );
      since.current = 0;
      return;
    }

    // Out of time with something still cocked: lay it flat rather than read a
    // number off a die that is not showing one. The face it is nearest to is
    // the face it gets, which is what a hand would do with it.
    if (cocked >= 0) {
      list.forEach((b, i) => {
        if (reads[i].flatness >= FLAT_ENOUGH) return;
        const r = b.rotation();
        q.set(r.x, r.y, r.z, r.w);
        const face = FACES.find((f) => f.value === reads[i].value) ?? FACES[0];
        up.copy(face.n).applyQuaternion(q);
        fix.setFromUnitVectors(up, WORLD_UP).multiply(q);
        b.setRotation({ x: fix.x, y: fix.y, z: fix.z, w: fix.w }, true);
        const t = b.translation();
        b.setTranslation({ x: t.x, y: REST_Y, z: t.z }, true);
        b.setLinvel({ x: 0, y: 0, z: 0 }, true);
        b.setAngvel({ x: 0, y: 0, z: 0 }, true);
      });
    }

    watching.current = false;
    onSettled(reads.map((r) => r.value));
  });

  // ------------------------------------------------------------------- render

  return (
    <>
      <Rig />
      <ambientLight intensity={0.14} />
      <directionalLight
        // Up and behind the far right, so the shadows fall down and to the
        // left of each die the way they do on a table by a window.
        position={[3.4, 10.5, -2.4]}
        intensity={2.7}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-radius={7}
        shadow-bias={-0.0009}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
        shadow-camera-near={0.5}
        shadow-camera-far={24}
      />

      {/* The floor does not receive the shadow; a catcher just above it does.
          Lighting this table is mostly image-based, and an image-based light
          is not shadowed by anything — so a directional strong enough to print
          a real shadow on the floor would also blow the jelly out. Painting
          the shadow separately lets it be as dark as it should look without
          touching the balance that the material depends on. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[GROUND_SPAN, GROUND_SPAN]} />
        <meshStandardMaterial map={floorTex} roughness={0.94} metalness={0} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]} receiveShadow>
        <planeGeometry args={[GROUND_SPAN, GROUND_SPAN]} />
        <shadowMaterial transparent opacity={0.17} depthWrite={false} />
      </mesh>

      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[FLOOR_SPAN, 0.5, FLOOR_SPAN]} position={[0, -0.5, 0]} friction={0.7} restitution={0.3} />
        {walls.map((w, i) => (
          <CuboidCollider key={i} args={w.half} position={w.pos} rotation={w.rot} friction={0.4} restitution={0.42} />
        ))}
      </RigidBody>

      {/* Every die that could ever be on the table is mounted; the ones over
          the count are parked out of sight rather than unmounted, because
          adding and removing rigid bodies mid-roll is how you lose one. */}
      {squashes.map((s, i) => (
        <Die
          key={i}
          index={i}
          flavour={flavour}
          register={register}
          onImpact={onImpact}
          onGrab={onGrab}
          squash={s}
        />
      ))}

      <Parked bodies={bodies} count={count} />
    </>
  );
}

/**
 * Dice above the chosen count are put to sleep under the table.
 *
 * Unmounting them instead would be tidier to read and much worse to use: a
 * body that vanishes mid-flight takes its result with it, and React's
 * remounting does not keep the physics world in step with the count.
 */
function Parked({ bodies, count }: { bodies: { current: (RapierRigidBody | null)[] }; count: number }) {
  useEffect(() => {
    bodies.current.forEach((b, i) => {
      if (!b) return;
      if (i >= count) {
        b.setTranslation({ x: (i - 2) * 1.3, y: -40, z: 0 }, true);
        b.setLinvel({ x: 0, y: 0, z: 0 }, true);
        b.setAngvel({ x: 0, y: 0, z: 0 }, true);
        b.sleep();
      } else if (b.translation().y < -20) {
        b.setTranslation({ x: (i - 2) * 1.1, y: REST_Y, z: 0 }, true);
        b.wakeUp();
      }
    });
  }, [bodies, count]);
  return null;
}

export { TRAY_R, WALL_H };
