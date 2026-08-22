import { useRef, useEffect, useMemo, useCallback, useState } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { RigidBody, CuboidCollider, type RapierRigidBody } from '@react-three/rapier';
import { PenModel } from './PenModel';
import { getPen, type PenSpec } from '../game/pens';
import { useMatch, other, type Side, type RallyResult } from '../game/store';
import {
  TABLE,
  HALF_W,
  HALF_D,
  START_Z,
  MAX_IMPULSE_PER_KG,
  DRAW_SCREEN_FRACTION,
  SETTLE_LINEAR,
  SETTLE_ANGULAR,
  SETTLE_FRAMES,
  SHOT_TIMEOUT_MS,
  isOffTable,
} from '../game/table';
import { sfx } from '../lib/audio';
import { snapshot, bodies as debugBodies } from '../game/snapshot';

/**
 * The desk, the two pens, and every rule that decides who lost their pen.
 *
 * Shot model
 * ----------
 * A pen is a compound body: a barrel box plus a heavier cap box at the tail.
 * That is not decoration — it is what makes a Hero 616 plough straight through
 * a Montex while a Montex sent at the same speed spins out. The flick is an
 * impulse applied *at a point* on the barrel, so where you put your finger
 * decides how much of the shot turns into spin instead of travel. Strike the
 * middle for a clean push; strike the nib and the pen pivots.
 */

export interface ShotRecord {
  side: Side;
  power: number;
  angle: number;
  outcome: 'none' | 'hit' | 'knockout' | 'self_out';
}

interface ArenaProps {
  onRally: (result: RallyResult, shot: ShotRecord) => void;
  onShotFired?: (shot: { dx: number; dz: number; power: number; strike: number }) => void;
  /** Transforms pushed by the network when this client is not the authority. */
  netStateRef?: React.RefObject<NetPenState | null>;
  onNetSync?: (state: NetPenState) => void;
}

export interface NetPenState {
  t: number;
  host: [number, number, number, number, number, number, number];
  guest: [number, number, number, number, number, number, number];
  phase: 'live' | 'rest';
}

const UP = new THREE.Vector3(0, 1, 0);

/** Half-extents and mass split for a pen's compound collider. */
function penBodyPlan(pen: PenSpec) {
  const L = pen.length;
  const r = pen.radius;
  // 0.15 (nose heavy) .. 0.45 (tail heavy); 0.30 is neutral for these offsets.
  const tailFraction = 0.15 + 0.3 * pen.balance;
  return {
    barrel: {
      half: [L * 0.35, r, r] as [number, number, number],
      x: L * 0.15,
      mass: pen.mass * (1 - tailFraction),
    },
    cap: {
      half: [L * 0.15, r * 1.08, r * 1.08] as [number, number, number],
      x: -L * 0.35,
      mass: pen.mass * tailFraction,
    },
    restY: TABLE.surfaceY + r,
  };
}

// ---------------------------------------------------------------- pen body

function Pen({
  side,
  pen,
  bodyRef,
  kinematic,
  onHit,
}: {
  side: Side;
  pen: PenSpec;
  bodyRef: React.RefObject<RapierRigidBody | null>;
  kinematic: boolean;
  onHit: (force: number) => void;
}) {
  const plan = useMemo(() => penBodyPlan(pen), [pen]);

  return (
    <RigidBody
      ref={bodyRef}
      type={kinematic ? 'kinematicPosition' : 'dynamic'}
      colliders={false}
      position={[0, plan.restY, START_Z[side]]}
      rotation={[0, side === 'host' ? 0 : Math.PI, 0]}
      linearDamping={0.12}
      angularDamping={pen.angularDamping}
      ccd
      canSleep={false}
      onCollisionEnter={({ other: hit }) => {
        // Only the pen-on-pen clack is worth a sound; desk scrape is not.
        if (!hit.rigidBodyObject) return;
        const b = bodyRef.current;
        if (!b) return;
        const v = b.linvel();
        onHit(Math.hypot(v.x, v.y, v.z));
      }}
      userData={{ side }}
    >
      <CuboidCollider
        args={plan.barrel.half}
        position={[plan.barrel.x, 0, 0]}
        mass={plan.barrel.mass}
        friction={pen.friction}
        restitution={pen.restitution}
      />
      <CuboidCollider
        args={plan.cap.half}
        position={[plan.cap.x, 0, 0]}
        mass={plan.cap.mass}
        friction={pen.friction * 1.1}
        restitution={pen.restitution * 0.8}
      />
      <PenModel pen={pen} />
    </RigidBody>
  );
}

// ---------------------------------------------------------------- aim guide

function AimGuide({
  origin,
  dir,
  power,
  strike,
}: {
  origin: THREE.Vector3;
  dir: THREE.Vector3;
  power: number;
  strike: number;
}) {
  const len = 0.14 + power * 0.62;
  const mid = origin.clone().addScaledVector(dir, len / 2);
  const angle = Math.atan2(dir.x, dir.z);
  const hot = new THREE.Color().setHSL(0.33 - power * 0.33, 0.9, 0.58);

  return (
    <group>
      {/* aim shaft, hugging the desk */}
      <mesh position={[mid.x, TABLE.surfaceY + 0.0016, mid.z]} rotation={[-Math.PI / 2, 0, -angle]}>
        <planeGeometry args={[0.019, len]} />
        <meshBasicMaterial color={hot} transparent opacity={0.92} depthWrite={false} />
      </mesh>
      {/* arrow head — the extra quarter turn puts the triangle's apex, which
          points down its local +X, onto the shaft's local +Y length axis */}
      <mesh
        position={[
          origin.x + dir.x * (len + 0.016),
          TABLE.surfaceY + 0.0018,
          origin.z + dir.z * (len + 0.016),
        ]}
        rotation={[-Math.PI / 2, 0, -angle + Math.PI / 2]}
      >
        <circleGeometry args={[0.032, 3]} />
        <meshBasicMaterial color={hot} transparent opacity={0.98} depthWrite={false} />
      </mesh>
      {/* strike point marker */}
      <mesh position={[origin.x, TABLE.surfaceY + 0.0014, origin.z]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.016, 0.024, 24]} />
        <meshBasicMaterial
          color={Math.abs(strike) > 0.45 ? '#ffb340' : '#eaf2ff'}
          transparent
          opacity={0.9}
          depthWrite={false}
        />
      </mesh>
      {/* power arc behind the pen */}
      <mesh position={[origin.x, TABLE.surfaceY + 0.0012, origin.z]} rotation={[-Math.PI / 2, 0, -angle]}>
        <ringGeometry args={[0.062, 0.078, 40, 1, Math.PI * 0.75, Math.PI * 1.5 * power]} />
        <meshBasicMaterial color={hot} transparent opacity={0.7} depthWrite={false} />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------- arena

export function Arena({ onRally, onShotFired, netStateRef, onNetSync }: ArenaProps) {
  const hostRef = useRef<RapierRigidBody>(null);
  const guestRef = useRef<RapierRigidBody>(null);
  const refs = useMemo(
    () => ({ host: hostRef, guest: guestRef }),
    [],
  );

  const phase = useMatch((s) => s.phase);
  const turn = useMatch((s) => s.turn);
  const mySide = useMatch((s) => s.mySide);
  const isAuthority = useMatch((s) => s.isAuthority);
  const pens = useMatch((s) => s.pens);
  const rally = useMatch((s) => s.rally);
  const pendingShot = useMatch((s) => s.pendingShot);

  const hostPen = getPen(pens.host);
  const guestPen = getPen(pens.guest);
  const penOf = (s: Side) => (s === 'host' ? hostPen : guestPen);

  const { camera, gl } = useThree();

  // ---- aiming state (refs so pointer handlers never restale) ----
  const aiming = useRef<{
    side: Side;
    strike: number;
    /** Pen position when the finger landed. */
    from: THREE.Vector3;
    /** Pointer position when the finger landed, in client pixels. */
    startX: number;
    startY: number;
    /**
     * Inverse of the screen-space table basis at `from`: multiply a pixel
     * delta by this to get a delta in desk metres. Captured once per drag,
     * which is also what keeps the aim from swimming as the camera drifts.
     */
    inv: [number, number, number, number];
  } | null>(null);
  const [guide, setGuide] = useState<{
    origin: THREE.Vector3;
    dir: THREE.Vector3;
    power: number;
    strike: number;
  } | null>(null);

  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const plane = useMemo(
    () => new THREE.Plane(UP.clone(), -(TABLE.surfaceY + 0.005)),
    [],
  );

  /**
   * How the desk's X and Z axes appear on screen at a given point, inverted.
   *
   * Projecting the point and two unit steps away from it gives a 2x2 matrix
   * from desk metres to pixels; the inverse turns a drag in pixels back into a
   * direction on the desk. It is an affine approximation of a perspective
   * projection, which is exact enough over the length of one flick and has
   * none of the horizon blow-up a ray cast has.
   */
  const tableBasisInverse = useCallback(
    (origin: THREE.Vector3): [number, number, number, number] | null => {
      const rect = gl.domElement.getBoundingClientRect();
      const toPx = (v: THREE.Vector3) => {
        const p = v.clone().project(camera);
        return { x: ((p.x + 1) / 2) * rect.width, y: ((1 - p.y) / 2) * rect.height };
      };
      const step = 0.05; // 5cm: small enough to stay linear, big enough to be exact
      const o = toPx(origin);
      const ax = toPx(new THREE.Vector3(origin.x + step, origin.y, origin.z));
      const az = toPx(new THREE.Vector3(origin.x, origin.y, origin.z + step));

      // columns of the metres -> pixels matrix
      const a = (ax.x - o.x) / step;
      const c = (ax.y - o.y) / step;
      const b = (az.x - o.x) / step;
      const d = (az.y - o.y) / step;

      const det = a * d - b * c;
      // Degenerate only if the desk is edge-on, which the camera never allows.
      if (!Number.isFinite(det) || Math.abs(det) < 1e-6) return null;
      return [d / det, -b / det, -c / det, a / det];
    },
    [camera, gl],
  );

  const pointerToTable = useCallback(
    (ev: PointerEvent): THREE.Vector3 | null => {
      const rect = gl.domElement.getBoundingClientRect();
      const ndc = new THREE.Vector2(
        ((ev.clientX - rect.left) / rect.width) * 2 - 1,
        -((ev.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(ndc, camera);
      const hit = new THREE.Vector3();
      return raycaster.ray.intersectPlane(plane, hit) ? hit : null;
    },
    [camera, gl, plane, raycaster],
  );

  /** Where along my pen's barrel did the finger land? -1 nib .. +1 tail. */
  const strikeOffsetAt = useCallback(
    (side: Side, point: THREE.Vector3): number | null => {
      const body = refs[side].current;
      if (!body) return null;
      const t = body.translation();
      const q = body.rotation();
      const quat = new THREE.Quaternion(q.x, q.y, q.z, q.w);
      const axis = new THREE.Vector3(1, 0, 0).applyQuaternion(quat).setY(0).normalize();
      const rel = new THREE.Vector3(point.x - t.x, 0, point.z - t.z);
      const along = rel.dot(axis);
      const across = rel.clone().addScaledVector(axis, -along).length();
      const spec = penOf(side);
      // A generous grab radius: this is a finger, not a scalpel.
      if (across > spec.radius + 0.055) return null;
      if (Math.abs(along) > spec.length * 0.62) return null;
      return THREE.MathUtils.clamp((-along / (spec.length / 2)) * 1, -0.85, 0.85);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [refs, hostPen, guestPen],
  );

  const canAim = (phase === 'ready' || phase === 'aiming') && turn === mySide;
  const canAimRef = useRef(canAim);
  canAimRef.current = canAim;

  // ---- pointer handlers ----
  useEffect(() => {
    const el = gl.domElement;

    const down = (ev: PointerEvent) => {
      if (!canAimRef.current || ev.button !== 0) return;
      const p = pointerToTable(ev);
      if (!p) return;
      const strike = strikeOffsetAt(mySide, p);
      if (strike === null) return;
      const body = refs[mySide].current;
      if (!body) return;
      const t = body.translation();
      const from = new THREE.Vector3(t.x, TABLE.surfaceY, t.z);
      const inv = tableBasisInverse(from);
      if (!inv) return;

      aiming.current = {
        side: mySide,
        strike,
        from,
        startX: ev.clientX,
        startY: ev.clientY,
        inv,
      };
      el.setPointerCapture(ev.pointerId);
      useMatch.getState().setPhase('aiming');
      sfx.pickup();
    };

    /** Longest useful drag, in pixels of whichever screen this is. */
    const maxDrawPx = () => {
      const rect = el.getBoundingClientRect();
      return Math.max(60, Math.min(rect.width, rect.height) * DRAW_SCREEN_FRACTION);
    };

    /** Resolve a pointer position into an aimed shot. */
    const solve = (a: NonNullable<typeof aiming.current>, clientX: number, clientY: number) => {
      const dx = clientX - a.startX;
      const dy = clientY - a.startY;

      // Power is pure screen distance, so it means the same thing whichever
      // way you drag.
      const px = Math.hypot(dx, dy);
      const power = Math.min(1, px / maxDrawPx());

      // Direction comes back through the desk basis, so the arrow still points
      // where the desk says it should. Pull back, shoot forward.
      const [i0, i1, i2, i3] = a.inv;
      const wx = i0 * dx + i1 * dy;
      const wz = i2 * dx + i3 * dy;
      const len = Math.hypot(wx, wz);
      if (len < 1e-6) return null;

      return { power, dir: new THREE.Vector3(-wx / len, 0, -wz / len) };
    };

    const move = (ev: PointerEvent) => {
      const a = aiming.current;
      if (!a) return;
      const shot = solve(a, ev.clientX, ev.clientY);
      if (!shot) return;
      setGuide({ origin: a.from.clone(), dir: shot.dir, power: shot.power, strike: a.strike });
      useMatch.getState().setAim({
        power: shot.power,
        angleDeg: (Math.atan2(shot.dir.x, -shot.dir.z) * 180) / Math.PI,
        strike: a.strike,
      });
    };

    const up = (ev: PointerEvent) => {
      const a = aiming.current;
      aiming.current = null;
      setGuide(null);
      if (!a) return;
      const shot = solve(a, ev.clientX, ev.clientY);
      if (!shot || shot.power < 0.06) {
        useMatch.getState().setPhase('ready');
        useMatch.getState().setAim(null);
        return;
      }
      onShotFired?.({ dx: shot.dir.x, dz: shot.dir.z, power: shot.power, strike: a.strike });
      useMatch.getState().fire({
        side: a.side,
        dx: shot.dir.x,
        dz: shot.dir.z,
        power: shot.power,
        strike: a.strike,
      });
    };

    const cancel = () => {
      if (!aiming.current) return;
      aiming.current = null;
      setGuide(null);
      useMatch.getState().setPhase('ready');
      useMatch.getState().setAim(null);
    };

    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', cancel);
    return () => {
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', cancel);
    };
  }, [gl, mySide, pointerToTable, strikeOffsetAt, tableBasisInverse, refs, onShotFired]);

  // ---- rack the pens at the start of every rally ----
  useEffect(() => {
    if (rally === 0) return;
    for (const side of ['host', 'guest'] as Side[]) {
      const body = refs[side].current;
      if (!body) continue;
      const spec = penOf(side);
      body.setTranslation(
        { x: 0, y: TABLE.surfaceY + spec.radius + 0.002, z: START_Z[side] },
        true,
      );
      const q = new THREE.Quaternion().setFromAxisAngle(UP, side === 'host' ? 0 : Math.PI);
      body.setRotation({ x: q.x, y: q.y, z: q.z, w: q.w }, true);
      body.setLinvel({ x: 0, y: 0, z: 0 }, true);
      body.setAngvel({ x: 0, y: 0, z: 0 }, true);
    }
    fallen.current = [];
    settleFrames.current = 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rally]);

  // ---- apply a queued shot ----
  useEffect(() => {
    if (!pendingShot) return;
    const body = refs[pendingShot.side].current;
    useMatch.getState().consumeShot();
    if (!body || !isAuthority) return;

    const spec = penOf(pendingShot.side);
    const mag = pendingShot.power * MAX_IMPULSE_PER_KG * spec.mass;

    // The strike point: slide along the barrel by `strike`, then step out to
    // the near face so the impulse has a real lever arm.
    const q = body.rotation();
    const quat = new THREE.Quaternion(q.x, q.y, q.z, q.w);
    const axis = new THREE.Vector3(1, 0, 0).applyQuaternion(quat).setY(0).normalize();
    const t = body.translation();
    const along = -pendingShot.strike * (spec.length / 2) * 0.8;
    const point = new THREE.Vector3(t.x, t.y, t.z).addScaledVector(axis, along);

    body.applyImpulseAtPoint(
      { x: pendingShot.dx * mag, y: 0, z: pendingShot.dz * mag },
      { x: point.x, y: point.y, z: point.z },
      true,
    );
    shotStart.current = performance.now();
    settleFrames.current = 0;
    fallen.current = [];
    activeShot.current = {
      side: pendingShot.side,
      power: pendingShot.power,
      angle: Math.atan2(pendingShot.dx, -pendingShot.dz),
      outcome: 'none',
    };
    sfx.flick(pendingShot.power);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingShot, isAuthority]);

  // ---- rally bookkeeping ----
  const fallen = useRef<Side[]>([]);
  const settleFrames = useRef(0);
  const shotStart = useRef(0);
  const activeShot = useRef<ShotRecord | null>(null);
  const netClock = useRef(0);

  const readSide = (side: Side) => {
    const b = refs[side].current;
    if (!b) return null;
    const t = b.translation();
    const lv = b.linvel();
    const av = b.angvel();
    const r = b.rotation();
    const axis = new THREE.Vector3(1, 0, 0).applyQuaternion(
      new THREE.Quaternion(r.x, r.y, r.z, r.w),
    );
    const speed = Math.hypot(lv.x, lv.y, lv.z);

    debugBodies[side] = b;
    const snap = snapshot[side];
    snap.x = t.x;
    snap.y = t.y;
    snap.z = t.z;
    snap.yaw = Math.atan2(axis.x, axis.z);
    snap.speed = speed;

    return { x: t.x, y: t.y, z: t.z, speed, spin: Math.hypot(av.x, av.y, av.z) };
  };

  useFrame((_, dt) => {
    // Always refresh the shared snapshot: the AI and the HUD read it whether
    // or not this client is the one running the simulation.
    const h = readSide('host');
    const g = readSide('guest');

    // Guest clients just play back whatever the host says happened.
    if (!isAuthority) {
      const net = netStateRef?.current;
      if (net) {
        for (const side of ['host', 'guest'] as Side[]) {
          const body = refs[side].current;
          const v = net[side];
          if (!body || !v) continue;
          body.setNextKinematicTranslation({ x: v[0], y: v[1], z: v[2] });
          body.setNextKinematicRotation({ x: v[3], y: v[4], z: v[5], w: v[6] });
        }
      }
      return;
    }

    if (onNetSync) {
      netClock.current += dt;
      if (netClock.current > 0.05) {
        netClock.current = 0;
        const pack = (side: Side) => {
          const b = refs[side].current!;
          const t = b.translation();
          const r = b.rotation();
          return [t.x, t.y, t.z, r.x, r.y, r.z, r.w] as NetPenState['host'];
        };
        if (hostRef.current && guestRef.current) {
          onNetSync({
            t: Date.now(),
            host: pack('host'),
            guest: pack('guest'),
            phase: phase === 'live' ? 'live' : 'rest',
          });
        }
      }
    }

    if (phase !== 'live') return;
    if (!h || !g) return;

    for (const [side, s] of [
      ['host', h],
      ['guest', g],
    ] as const) {
      if (!fallen.current.includes(side) && isOffTable(s.x, s.y, s.z)) {
        fallen.current.push(side);
        sfx.clatter();
      }
    }

    const moving =
      h.speed > SETTLE_LINEAR ||
      g.speed > SETTLE_LINEAR ||
      h.spin > SETTLE_ANGULAR ||
      g.spin > SETTLE_ANGULAR;

    // A pen on its way to the floor is still "moving", but the rally is over
    // the moment both pens are decided.
    if (moving) settleFrames.current = 0;
    else settleFrames.current += 1;

    const timedOut = performance.now() - shotStart.current > SHOT_TIMEOUT_MS;
    const bothDown = fallen.current.length === 2;

    if (settleFrames.current < SETTLE_FRAMES && !timedOut && !bothDown) return;

    // ---- score the rally ----
    const shooter = activeShot.current?.side ?? turn;
    const shot: ShotRecord = activeShot.current ?? {
      side: shooter,
      power: 0,
      angle: 0,
      outcome: 'none',
    };

    if (fallen.current.length === 0) {
      // Nothing fell: hand the desk over.
      activeShot.current = null;
      useMatch.setState({ turn: other(turn), phase: 'ready' });
      return;
    }

    let result: RallyResult;
    if (fallen.current.length === 2) {
      // Took your own pen down with theirs — the shooter eats it.
      result = { scoringSide: other(shooter), reason: 'double_out', fellSide: shooter };
      shot.outcome = 'self_out';
    } else if (fallen.current[0] === shooter) {
      result = { scoringSide: other(shooter), reason: 'self_out', fellSide: shooter };
      shot.outcome = 'self_out';
    } else {
      result = { scoringSide: shooter, reason: 'knockout', fellSide: other(shooter) };
      shot.outcome = 'knockout';
    }

    activeShot.current = null;
    fallen.current = [];
    settleFrames.current = 0;
    sfx.point(result.scoringSide === mySide);
    onRally(result, shot);
  });

  const collisionSfx = useCallback((force: number) => {
    sfx.clack(force);
  }, []);

  return (
    <group>
      {/* desk collider — the play surface, exactly at TABLE.surfaceY */}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider
          args={[HALF_W, TABLE.thickness / 2, HALF_D]}
          position={[0, TABLE.surfaceY - TABLE.thickness / 2, 0]}
          friction={TABLE.friction}
          restitution={TABLE.restitution}
        />
      </RigidBody>

      {/* the floor, so a lost pen lands with a noise instead of vanishing */}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[6, 0.05, 6]} position={[0, -0.05, 0]} friction={0.8} />
      </RigidBody>

      <Pen
        side="host"
        pen={hostPen}
        bodyRef={hostRef}
        kinematic={!isAuthority}
        onHit={collisionSfx}
      />
      <Pen
        side="guest"
        pen={guestPen}
        bodyRef={guestRef}
        kinematic={!isAuthority}
        onHit={collisionSfx}
      />

      {guide && (
        <AimGuide
          origin={guide.origin}
          dir={guide.dir}
          power={guide.power}
          strike={guide.strike}
        />
      )}
    </group>
  );
}
