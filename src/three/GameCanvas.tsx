import { Suspense, useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { Classroom, FightDesk } from './Classroom';
import { Arena, type ShotRecord, type NetPenState } from './Arena';
import { makeDeskTopTexture } from './textures';
import { useMatch, type Side, type RallyResult } from '../game/store';
import { TABLE } from '../game/table';

/**
 * The render surface: camera, light, physics world, classroom, desk, pens.
 *
 * Camera work is deliberately restrained. You sit at your own edge of the desk
 * and the view drifts a little toward whoever is about to shoot, which is
 * enough to tell you whose turn it is without a single word of UI.
 */

// ------------------------------------------------------------------ camera

function CameraRig() {
  const mySide = useMatch((s) => s.mySide);
  const turn = useMatch((s) => s.turn);
  const phase = useMatch((s) => s.phase);
  const { camera, size } = useThree();

  const target = useMemo(() => new THREE.Vector3(0, TABLE.surfaceY, 0), []);
  const desired = useMemo(() => new THREE.Vector3(), []);
  const look = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, dt) => {
    // Sitting behind your own edge, leaning in.
    const sign = mySide === 'host' ? 1 : -1;
    const portrait = size.height > size.width;

    // Far enough back that the room reads — blackboard, rows of desks, the lot
    // — while the playing surface still fills the lower half of the frame.
    // Seated at your own edge, leaning in. Close enough that a pen reads as a
    // pen, high enough that the whole desk is in frame, and pitched so the
    // blackboard still shows across the top — cropped, the way it is when you
    // are actually slouched on a back bench.
    const baseZ = (portrait ? 1.16 : 1.18) * sign;
    const baseY = TABLE.surfaceY + (portrait ? 0.66 : 0.52);

    // Drift toward the active shooter's side of the desk.
    const lean = turn === mySide ? 0 : -0.12 * sign;
    const zoom = phase === 'aiming' ? -0.08 * sign : 0;

    desired.set(0, baseY, baseZ + lean + zoom);
    look.set(0, TABLE.surfaceY + 0.1, -0.62 * sign);

    const k = 1 - Math.exp(-dt * 3.2);
    camera.position.lerp(desired, k);
    target.lerp(look, k);
    camera.lookAt(target);

    const fov = portrait ? 74 : 56;
    const cam = camera as THREE.PerspectiveCamera;
    if (Math.abs(cam.fov - fov) > 0.1) {
      cam.fov += (fov - cam.fov) * k;
      cam.updateProjectionMatrix();
    }
  });

  return null;
}

// ------------------------------------------------------------------ lights

function Lighting() {
  return (
    <>
      {/* Late-afternoon fill through the windows, warm and low. */}
      <hemisphereLight args={['#f6e2bd', '#6a6250', 0.85]} />
      <ambientLight intensity={0.34} color="#fff2d8" />

      {/* Tube light over the desk — the only shadow caster that matters. */}
      <directionalLight
        position={[1.6, 3.1, 1.2]}
        intensity={1.35}
        color="#fff4dd"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-2}
        shadow-camera-right={2}
        shadow-camera-top={2}
        shadow-camera-bottom={-2}
        shadow-camera-near={0.5}
        shadow-camera-far={8}
        shadow-bias={-0.0006}
        shadow-normalBias={0.02}
      />

      {/* Window light from the left, cooler. */}
      <directionalLight position={[-3.4, 2.4, 1.8]} intensity={0.5} color="#cfe0f5" />

      {/* A soft kick under the desk so the legs are not black holes. */}
      <pointLight position={[0, 0.35, 0.7]} intensity={0.22} color="#e8d3ae" distance={3} />

      {/* The tube light over the blackboard. Without it the front of the room
          falls away into nothing and the score in chalk cannot be read. */}
      <pointLight position={[0, 2.7, -2.6]} intensity={1.5} color="#fff6e2" distance={7} decay={1.6} />
      <pointLight position={[0, 2.5, 0.6]} intensity={0.9} color="#fff4de" distance={6} decay={1.7} />
    </>
  );
}

// ------------------------------------------------------------------ dust

/** Chalk dust in the light shaft. Cheap, and it sells the room. */
function Dust() {
  const ref = useRef<THREE.Points>(null);
  const count = 260;

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const speed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 3.4;
      pos[i * 3 + 1] = 0.4 + Math.random() * 2.2;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 3.0;
      speed[i] = 0.004 + Math.random() * 0.016;
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aSpeed', new THREE.BufferAttribute(speed, 1));
    return g;
  }, []);

  useFrame((state) => {
    const pts = ref.current;
    if (!pts) return;
    const pos = pts.geometry.attributes.position as THREE.BufferAttribute;
    const spd = pts.geometry.attributes.aSpeed as THREE.BufferAttribute;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      let y = pos.getY(i) - spd.getX(i) * 0.1;
      if (y < 0.15) y = 2.6;
      pos.setY(i, y);
      pos.setX(i, pos.getX(i) + Math.sin(t * 0.4 + i) * 0.0004);
    }
    pos.needsUpdate = true;
  });

  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial
        size={0.006}
        color="#ffeccb"
        transparent
        opacity={0.34}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

// ------------------------------------------------------------------ scene

function Scene({
  onRally,
  onShotFired,
  netStateRef,
  onNetSync,
}: {
  onRally: (r: RallyResult, s: ShotRecord) => void;
  onShotFired?: (s: { dx: number; dz: number; power: number; strike: number }) => void;
  netStateRef?: React.RefObject<NetPenState | null>;
  onNetSync?: (s: NetPenState) => void;
}) {
  const deskTop = useMemo(() => makeDeskTopTexture(), []);
  const { scene } = useThree();

  useEffect(() => {
    scene.fog = new THREE.Fog('#3a3a2c', 9, 22);
    return () => {
      scene.fog = null;
    };
  }, [scene]);

  return (
    <>
      <CameraRig />
      <Lighting />
      <Dust />
      <Classroom />
      <FightDesk topTexture={deskTop} />
      <Physics gravity={[0, -9.81, 0]} timeStep={1 / 120} interpolate>
        <Arena
          onRally={onRally}
          onShotFired={onShotFired}
          netStateRef={netStateRef}
          onNetSync={onNetSync}
        />
      </Physics>
    </>
  );
}

export function GameCanvas(props: {
  onRally: (r: RallyResult, s: ShotRecord) => void;
  onShotFired?: (s: { dx: number; dz: number; power: number; strike: number }) => void;
  netStateRef?: React.RefObject<NetPenState | null>;
  onNetSync?: (s: NetPenState) => void;
}) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{
        antialias: true,
        powerPreference: 'high-performance',
        alpha: false,
      }}
      camera={{ position: [0, 1.28, 1.18], fov: 56, near: 0.05, far: 40 }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.06;
        gl.setClearColor('#20221a');
      }}
      style={{ touchAction: 'none' }}
    >
      <Suspense fallback={null}>
        <Scene {...props} />
      </Suspense>
    </Canvas>
  );
}

export type { Side };
