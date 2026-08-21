import { useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useMatch } from '../game/store';
import { TABLE } from '../game/table';
import {
  makeWoodTexture,
  makeTileTexture,
  makeWallTexture,
  makePosterTexture,
  makeNotebookTexture,
  makeBlackboardTexture,
  drawBlackboard,
  type BoardLines,
} from './textures';

/**
 * An Indian government-school classroom, circa 2003.
 *
 * Green distemper to shoulder height, cream above, a maroon border line where
 * they meet, mosaic floor, and a blackboard that actually keeps score.
 */

const THOUGHTS = [
  'Practice makes a man perfect',
  'Honesty is the best policy',
  'Time and tide wait for none',
  'A stitch in time saves nine',
];

// ------------------------------------------------------------------ board

function Blackboard() {
  const score = useMatch((s) => s.score);
  const names = useMatch((s) => s.names);
  const format = useMatch((s) => s.format);

  const lines = useMemo<BoardLines>(
    () => ({
      subject: 'Maths',
      thought: THOUGHTS[0],
      homework: ['Ch. 4  Q. 1 - 5', 'Map of India', 'Essay : Rain'],
      scoreTitle: 'PEN FIGHT',
      hostName: names.host.slice(0, 10),
      guestName: names.guest.slice(0, 10),
      hostScore: score.host,
      guestScore: score.guest,
      format,
      monitor: 'Rinku',
    }),
    [names.host, names.guest, score.host, score.guest, format],
  );

  const { texture, canvas } = useMemo(() => makeBlackboardTexture(lines), []);

  useEffect(() => {
    drawBlackboard(canvas, lines);
    texture.needsUpdate = true;
  }, [lines, canvas, texture]);

  const frameWood = useMemo(() => makeWoodTexture('#5b3a1c', '#3a2410'), []);

  return (
    <group position={[0, 1.62, -3.6]}>
      {/* frame */}
      <mesh position={[0, 0, -0.04]} castShadow receiveShadow>
        <boxGeometry args={[4.5, 1.95, 0.08]} />
        <meshStandardMaterial map={frameWood} roughness={0.75} />
      </mesh>
      {/* slate */}
      <mesh position={[0, 0, 0.015]}>
        <planeGeometry args={[4.28, 1.76]} />
        <meshStandardMaterial map={texture} roughness={0.94} metalness={0} />
      </mesh>
      {/* chalk ledge */}
      <mesh position={[0, -1.0, 0.06]} castShadow>
        <boxGeometry args={[4.4, 0.05, 0.12]} />
        <meshStandardMaterial map={frameWood} roughness={0.8} />
      </mesh>
      {/* chalk stubs and the duster */}
      <mesh position={[-0.4, -0.955, 0.09]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.008, 0.008, 0.07, 8]} />
        <meshStandardMaterial color="#f4f2e8" roughness={1} />
      </mesh>
      <mesh position={[0.25, -0.955, 0.09]} rotation={[0, 0.3, Math.PI / 2]}>
        <cylinderGeometry args={[0.008, 0.008, 0.05, 8]} />
        <meshStandardMaterial color="#f4f2e8" roughness={1} />
      </mesh>
      <mesh position={[1.1, -0.94, 0.09]} castShadow>
        <boxGeometry args={[0.22, 0.06, 0.09]} />
        <meshStandardMaterial color="#7d5f3a" roughness={0.9} />
      </mesh>
    </group>
  );
}

// ------------------------------------------------------------------ desks

function Desk({
  position,
  rotation = 0,
  woodTex,
  clutter = 'none',
}: {
  position: [number, number, number];
  rotation?: number;
  woodTex: THREE.Texture;
  clutter?: 'none' | 'books' | 'box' | 'paper';
}) {
  const paper = useMemo(() => makeNotebookTexture(), []);
  const legMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#26262a', roughness: 0.55, metalness: 0.35 }),
    [],
  );
  const woodMat = useMemo(
    () => new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.62 }),
    [woodTex],
  );

  const W = 1.5;
  const D = 0.5;
  const H = 0.74;

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* desk top */}
      <mesh position={[0, H, 0]} castShadow receiveShadow material={woodMat}>
        <boxGeometry args={[W, 0.035, D]} />
      </mesh>
      {/* front modesty panel */}
      <mesh position={[0, H - 0.16, -D / 2 + 0.02]} castShadow material={woodMat}>
        <boxGeometry args={[W * 0.96, 0.24, 0.028]} />
      </mesh>
      {/* legs */}
      {[
        [-W / 2 + 0.07, -D / 2 + 0.06],
        [W / 2 - 0.07, -D / 2 + 0.06],
        [-W / 2 + 0.07, D / 2 - 0.06],
        [W / 2 - 0.07, D / 2 - 0.06],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, H / 2, z]} castShadow material={legMat}>
          <boxGeometry args={[0.032, H, 0.032]} />
        </mesh>
      ))}

      {/* bench behind the desk */}
      <mesh position={[0, 0.44, D / 2 + 0.34]} castShadow receiveShadow material={woodMat}>
        <boxGeometry args={[W, 0.035, 0.3]} />
      </mesh>
      <mesh position={[0, 0.62, D / 2 + 0.48]} castShadow material={woodMat}>
        <boxGeometry args={[W, 0.24, 0.03]} />
      </mesh>
      {[
        [-W / 2 + 0.08, D / 2 + 0.34],
        [W / 2 - 0.08, D / 2 + 0.34],
      ].map(([x, z], i) => (
        <mesh key={`b${i}`} position={[x, 0.22, z]} castShadow material={legMat}>
          <boxGeometry args={[0.03, 0.44, 0.03]} />
        </mesh>
      ))}

      {clutter === 'books' && (
        <group position={[-0.18, H + 0.03, 0.02]} rotation={[0, 0.16, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.28, 0.026, 0.2]} />
            <meshStandardMaterial color="#d9cba8" roughness={0.9} />
          </mesh>
          <mesh position={[0.01, 0.026, 0.01]} castShadow>
            <boxGeometry args={[0.26, 0.02, 0.19]} />
            <meshStandardMaterial map={paper} roughness={0.95} />
          </mesh>
        </group>
      )}
      {clutter === 'box' && (
        <mesh position={[-0.36, H + 0.028, 0.0]} rotation={[0, -0.1, 0]} castShadow>
          <boxGeometry args={[0.2, 0.022, 0.09]} />
          <meshStandardMaterial color="#d98b2b" roughness={0.7} />
        </mesh>
      )}
      {clutter === 'paper' && (
        <group position={[0.3, H + 0.019, 0]} rotation={[-Math.PI / 2, 0, 0.1]}>
          <mesh castShadow>
            <planeGeometry args={[0.21, 0.29]} />
            <meshStandardMaterial map={paper} roughness={0.95} side={THREE.DoubleSide} />
          </mesh>
        </group>
      )}
    </group>
  );
}

// ------------------------------------------------------------------ bags

function Backpack({
  position,
  color,
  rotation = 0,
}: {
  position: [number, number, number];
  color: string;
  rotation?: number;
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh castShadow>
        <capsuleGeometry args={[0.14, 0.26, 6, 14]} />
        <meshStandardMaterial color={color} roughness={0.85} />
      </mesh>
      <mesh position={[0, -0.03, 0.13]} castShadow>
        <capsuleGeometry args={[0.085, 0.14, 6, 12]} />
        <meshStandardMaterial color={color} roughness={0.88} />
      </mesh>
      <mesh position={[0, 0.16, 0.09]} rotation={[0.4, 0, 0]}>
        <torusGeometry args={[0.05, 0.012, 8, 16]} />
        <meshStandardMaterial color="#2a2a2e" roughness={0.7} />
      </mesh>
      <mesh position={[0, -0.02, 0.212]}>
        <boxGeometry args={[0.13, 0.012, 0.01]} />
        <meshStandardMaterial color="#c9c9cf" roughness={0.4} metalness={0.6} />
      </mesh>
    </group>
  );
}

// ------------------------------------------------------------------ room

export function Classroom() {
  const tile = useMemo(() => makeTileTexture(), []);
  const wall = useMemo(() => makeWallTexture(), []);
  const deskWood = useMemo(() => makeWoodTexture('#a9743c', '#7a4f22'), []);
  const tables = useMemo(() => makePosterTexture('tables'), []);
  const calendar = useMemo(() => makePosterTexture('calendar'), []);
  const mapPoster = useMemo(() => makePosterTexture('map'), []);

  const wallMat = useMemo(
    () => new THREE.MeshStandardMaterial({ map: wall, roughness: 0.95 }),
    [wall],
  );
  const upperMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#ddd6c2', roughness: 0.96 }),
    [],
  );
  const borderMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#6b3226', roughness: 0.8 }),
    [],
  );

  const ROOM_W = 11;
  const ROOM_D = 12;
  const DADO = 1.35; // height of the green band

  // Rows of desks either side of the playing desk.
  const rows = useMemo(() => {
    const out: {
      pos: [number, number, number];
      clutter: 'none' | 'books' | 'box' | 'paper';
    }[] = [];
    const clutters: ('none' | 'books' | 'box' | 'paper')[] = [
      'books',
      'none',
      'paper',
      'box',
      'none',
      'books',
    ];
    let n = 0;
    for (let r = 0; r < 3; r++) {
      for (let c = -1; c <= 1; c++) {
        const z = -2.6 + r * 1.5;
        const x = c * 2.2;
        // leave the middle-front slot free: that is the fighting desk
        if (r === 2 && c === 0) continue;
        out.push({ pos: [x, 0, z], clutter: clutters[n % clutters.length] });
        n++;
      }
    }
    return out;
  }, []);

  return (
    <group>
      {/* ---------- floor ---------- */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[ROOM_W, ROOM_D]} />
        <meshStandardMaterial map={tile} roughness={0.62} metalness={0.02} />
      </mesh>

      {/* ---------- back wall (behind the board) ---------- */}
      <group position={[0, 0, -ROOM_D / 2]}>
        <mesh position={[0, DADO / 2, 0]} receiveShadow>
          <planeGeometry args={[ROOM_W, DADO]} />
          <primitive object={wallMat} attach="material" />
        </mesh>
        <mesh position={[0, DADO + 0.035, 0.002]}>
          <planeGeometry args={[ROOM_W, 0.07]} />
          <primitive object={borderMat} attach="material" />
        </mesh>
        <mesh position={[0, DADO + 1.6, 0]} receiveShadow>
          <planeGeometry args={[ROOM_W, 3.2]} />
          <primitive object={upperMat} attach="material" />
        </mesh>
      </group>

      {/* ---------- side walls ---------- */}
      {[-1, 1].map((s) => (
        <group key={s} position={[(s * ROOM_W) / 2, 0, 0]} rotation={[0, -s * (Math.PI / 2), 0]}>
          <mesh position={[0, DADO / 2, 0]} receiveShadow>
            <planeGeometry args={[ROOM_D, DADO]} />
            <primitive object={wallMat} attach="material" />
          </mesh>
          <mesh position={[0, DADO + 0.035, 0.002]}>
            <planeGeometry args={[ROOM_D, 0.07]} />
            <primitive object={borderMat} attach="material" />
          </mesh>
          <mesh position={[0, DADO + 1.6, 0]} receiveShadow>
            <planeGeometry args={[ROOM_D, 3.2]} />
            <primitive object={upperMat} attach="material" />
          </mesh>
        </group>
      ))}

      {/* ---------- ceiling ---------- */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 3.4, 0]}>
        <planeGeometry args={[ROOM_W, ROOM_D]} />
        <meshStandardMaterial color="#cfc9bb" roughness={1} />
      </mesh>

      <Blackboard />

      {/* ---------- wall paper ---------- */}
      <mesh position={[3.3, 2.35, -3.62]}>
        <planeGeometry args={[0.78, 1.05]} />
        <meshStandardMaterial map={tables} roughness={0.95} />
      </mesh>
      <mesh position={[-3.35, 2.4, -3.62]} rotation={[0, 0, 0.02]}>
        <planeGeometry args={[0.55, 0.75]} />
        <meshStandardMaterial map={calendar} roughness={0.95} />
      </mesh>
      <mesh position={[-5.45, 2.1, -1.2]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[0.9, 1.2]} />
        <meshStandardMaterial map={mapPoster} roughness={0.95} />
      </mesh>

      {/* ---------- the rest of the class ---------- */}
      {rows.map((d, i) => (
        <Desk key={i} position={d.pos} woodTex={deskWood} clutter={d.clutter} />
      ))}

      {/* the far row along the back, turned away */}
      <Desk position={[-2.2, 0, 2.6]} woodTex={deskWood} clutter="none" />
      <Desk position={[2.2, 0, 2.6]} woodTex={deskWood} clutter="books" />

      <Backpack position={[1.05, 0.24, 0.4]} color="#2b4a86" rotation={0.4} />
      <Backpack position={[1.35, 0.24, 1.35]} color="#7a2b34" rotation={-0.3} />
      <Backpack position={[-1.5, 0.24, 1.5]} color="#2f5c3a" rotation={1.1} />

      {/* ---------- ceiling fan, because of course ---------- */}
      <group position={[0, 3.15, -0.6]}>
        <mesh>
          <cylinderGeometry args={[0.02, 0.02, 0.35, 8]} />
          <meshStandardMaterial color="#4a4a50" roughness={0.5} metalness={0.6} />
        </mesh>
        <mesh position={[0, -0.19, 0]}>
          <cylinderGeometry args={[0.09, 0.11, 0.09, 16]} />
          <meshStandardMaterial color="#6b6b72" roughness={0.4} metalness={0.7} />
        </mesh>
        {[0, 1, 2].map((i) => (
          <mesh
            key={i}
            position={[Math.cos((i * Math.PI * 2) / 3) * 0.35, -0.2, Math.sin((i * Math.PI * 2) / 3) * 0.35]}
            rotation={[0, -((i * Math.PI * 2) / 3), 0.03]}
          >
            <boxGeometry args={[0.62, 0.012, 0.15]} />
            <meshStandardMaterial color="#8d8d95" roughness={0.45} metalness={0.5} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/**
 * The fighting desk. Physics colliders live in `Arena`; this is only the look
 * of it, aligned so the top face sits exactly at TABLE.surfaceY.
 */
export function FightDesk({ topTexture }: { topTexture: THREE.Texture }) {
  const legMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#26262a', roughness: 0.55, metalness: 0.35 }),
    [],
  );
  const sideWood = useMemo(() => makeWoodTexture('#9c6a34', '#6d431c'), []);
  const y = TABLE.surfaceY;
  const W = TABLE.width + 0.14;
  const D = TABLE.depth + 0.12;

  return (
    <group>
      {/* top slab — the play surface */}
      <mesh position={[0, y - TABLE.thickness / 2, 0]} receiveShadow castShadow>
        <boxGeometry args={[W, TABLE.thickness, D]} />
        <meshStandardMaterial
          map={topTexture}
          roughness={0.58}
          metalness={0.03}
        />
      </mesh>
      {/* edge banding so the slab does not look like a floating plank */}
      <mesh position={[0, y - TABLE.thickness - 0.008, 0]}>
        <boxGeometry args={[W - 0.01, 0.016, D - 0.01]} />
        <meshStandardMaterial map={sideWood} roughness={0.7} />
      </mesh>
      {/* apron */}
      <mesh position={[0, y - 0.19, -D / 2 + 0.03]} castShadow>
        <boxGeometry args={[W * 0.95, 0.26, 0.03]} />
        <meshStandardMaterial map={sideWood} roughness={0.72} />
      </mesh>
      {[
        [-W / 2 + 0.08, -D / 2 + 0.07],
        [W / 2 - 0.08, -D / 2 + 0.07],
        [-W / 2 + 0.08, D / 2 - 0.07],
        [W / 2 - 0.08, D / 2 - 0.07],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, (y - TABLE.thickness) / 2, z]} castShadow material={legMat}>
          <boxGeometry args={[0.036, y - TABLE.thickness, 0.036]} />
        </mesh>
      ))}
    </group>
  );
}
