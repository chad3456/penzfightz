import { useCallback, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { squashMatrix, stepSquash, type Squash } from '../../effects/dice/die';
import { pieceGeometries, pieceHeight, SQUARE } from './pieces';
import {
  DARK_SQUARE, FRAME, GROUND, LIGHT_SQUARE, SIDES,
  boardGeometries, facing, frameGeometry, jellyMaterial, makeEnvironment, squareX, squareZ,
} from './look';
import { WHITE, type Colour, type PieceType } from './rules';

/**
 * The board, the men on it, and the one plane that turns a click into a square.
 */

/** A piece with an identity that survives a move, so it can be animated. */
export interface Man {
  id: number;
  type: PieceType;
  colour: Colour;
  at: number;
  taken: boolean;
}

const LIFT = 0.62;
/** Seconds for a piece to travel, whatever the distance. */
const GLIDE = 0.34;

// ------------------------------------------------------------------- camera

function Rig({ flipped }: { flipped: boolean }) {
  const { camera, size } = useThree();
  const want = useRef(new THREE.Vector3());
  const look = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, dt) => {
    const cam = camera as THREE.PerspectiveCamera;
    const halfV = THREE.MathUtils.degToRad(cam.fov) / 2;
    const halfH = Math.atan(Math.tan(halfV) * (size.width / size.height));
    const tall = size.height > size.width;

    /**
     * The panels sit on top of the canvas, so the board has to be fitted to
     * what is left rather than to the window. Roughly a hundred pixels of
     * status at the top and of controls at the bottom, and on a wide window
     * the title and the move list either side.
     */
    const bandV = Math.max(0.5, (size.height - 186) / size.height);
    const bandH = size.width > 860 ? Math.max(0.5, (size.width - 360) / size.width) : 1;
    // Half the board plus a border, and a little more on a phone where the
    // panels eat into the frame.
    const reach = SQUARE * 4 + (tall ? 0.9 : 0.5);
    // How far a piece hides the square behind it is its height over the tangent
    // of this angle, and a king is one and a half squares tall: at fifty
    // degrees White's own back rank covers the whole of the pawn rank in front
    // of it and you cannot click your own e-pawn. Steeper than a photograph
    // would be, on purpose.
    const pitch = THREE.MathUtils.degToRad(tall ? 64 : 58);
    // The near edge of the board is closer to the camera than the middle, and
    // being closer it is magnified, so fitting the middle crops the front rank.
    const near = reach * Math.cos(pitch);
    const dist =
      near +
      Math.max(reach / (Math.tan(halfH) * bandH), (reach * Math.sin(pitch)) / (Math.tan(halfV) * bandV));
    const side = flipped ? -1 : 1;
    // On a phone the panels are all along the bottom, so the free space is not
    // centred on the window. Both the camera *and* what it is aimed at drop by
    // the same amount, which slides the board up the frame without tilting it
    // — tilting instead would foreshorten the far rank to fix a layout problem.
    const drop = tall ? 1.35 : 0;
    want.current.set(0, Math.sin(pitch) * dist - drop, Math.cos(pitch) * dist * side);
    look.set(0, -drop, 0);

    const k = 1 - Math.exp(-dt * 6);
    cam.position.lerp(want.current, k);
    cam.lookAt(look);
    cam.updateProjectionMatrix();
  });
  return null;
}

// -------------------------------------------------------------------- a man

function Piece({
  man,
  squash,
  onPick,
  lifted,
}: {
  man: Man;
  squash: Squash;
  onPick: (sq: number) => void;
  lifted: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const jelly = useRef<THREE.Group>(null);
  const geo = useMemo(pieceGeometries, []);

  // Thickness is how much jelly the light has to cross, and that is different
  // for a pawn and a queen. One value for the set makes the small pieces read
  // as glass and the big ones as boiled sweets.
  const mat = useMemo(
    () => jellyMaterial(SIDES[man.colour], pieceHeight(man.type) * 0.34),
    [man.colour, man.type],
  );
  useEffect(() => () => mat.dispose(), [mat]);

  /** Where it is now, and where it is going. */
  const from = useRef(new THREE.Vector2(squareX(man.at & 7), squareZ(man.at >> 3)));
  const t = useRef(1);
  const target = useRef(man.at);

  if (target.current !== man.at) {
    const g = group.current;
    if (g) from.current.set(g.position.x, g.position.z);
    target.current = man.at;
    t.current = 0;
  }

  const scratch = useMemo(() => new THREE.Matrix4(), []);

  useFrame((_, dt) => {
    const g = group.current;
    const j = jelly.current;
    if (!g || !j) return;

    const tx = squareX(man.at & 7);
    const tz = squareZ(man.at >> 3);
    if (t.current < 1) {
      const was = t.current;
      t.current = Math.min(1, t.current + dt / GLIDE);
      const u = t.current;
      // Ease in and out, and go over rather than through: the arc is what says
      // a hand picked it up rather than that it slid.
      const e = u < 0.5 ? 2 * u * u : 1 - (1 - u) * (1 - u) * 2;
      g.position.x = from.current.x + (tx - from.current.x) * e;
      g.position.z = from.current.y + (tz - from.current.y) * e;
      g.position.y = Math.sin(Math.PI * u) * LIFT;
      if (was < 1 && t.current >= 1) {
        // Landed. It is jelly, so it flattens.
        squash.axis.set(0, 1, 0);
        squash.amp = 0.3;
        squash.vel = 0;
      }
    } else {
      g.position.set(tx, lifted ? 0.16 : 0, tz);
    }

    stepSquash(squash, Math.min(dt, 1 / 30));
    // World-aligned, so it flattens towards the board however the piece is
    // turned. The piece only ever turns about y here, but the axis still has
    // to be brought into its frame for the child matrix to mean the same thing.
    scratch.makeRotationY(-g.rotation.y);
    const axis = squash.axis.clone().applyMatrix4(scratch).normalize();
    squashMatrix(scratch, axis, squash.amp);
    j.matrix.copy(scratch);
    j.matrixWorldNeedsUpdate = true;
  });

  return (
    <group ref={group} rotation={[0, facing(man.colour), 0]}>
      <group ref={jelly} matrixAutoUpdate={false}>
        <mesh
          geometry={geo[man.type]}
          material={mat}
          castShadow
          onPointerDown={(e: ThreeEvent<PointerEvent>) => {
            e.stopPropagation();
            onPick(man.at);
          }}
        />
      </group>
    </group>
  );
}

// -------------------------------------------------------------------- scene

export interface BoardProps {
  men: Man[];
  flipped: boolean;
  selected: number | null;
  targets: number[];
  /** The king that is in check, so it can be marked. */
  alarm: number | null;
  last: { from: number; to: number } | null;
  onPick: (sq: number) => void;
}

export function Board({ men, flipped, selected, targets, alarm, last, onPick }: BoardProps) {
  const { gl, scene } = useThree();

  useEffect(() => {
    const env = makeEnvironment(gl as THREE.WebGLRenderer);
    scene.environment = env;
    scene.environmentIntensity = 0.85;
    scene.background = new THREE.Color(GROUND);
    return () => {
      scene.environment = null;
      env.dispose();
    };
  }, [gl, scene]);

  const board = useMemo(boardGeometries, []);
  const frame = useMemo(frameGeometry, []);
  const disc = useMemo(() => new THREE.CylinderGeometry(0.17, 0.17, 0.012, 24), []);
  const ring = useMemo(() => new THREE.TorusGeometry(0.42, 0.026, 8, 40), []);

  // One squash spring per man, kept out of the component so a remount does not
  // reset a wobble half way through.
  const springs = useRef(new Map<number, Squash>());
  const springFor = useCallback((id: number) => {
    let s = springs.current.get(id);
    if (!s) {
      s = { axis: new THREE.Vector3(0, 1, 0), amp: 0, vel: 0 };
      springs.current.set(id, s);
    }
    return s;
  }, []);

  /**
   * One invisible plane over the whole board rather than sixty-four pads.
   *
   * The hit point is in board coordinates already, so the square is two
   * divisions — and a click that lands on a piece is handled by the piece,
   * which stops it before it reaches here.
   */
  const onPlane = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      const f = Math.floor(e.point.x / SQUARE + 4);
      const r = Math.floor(3.5 - e.point.z / SQUARE + 0.5);
      if (f < 0 || f > 7 || r < 0 || r > 7) return;
      onPick(r * 8 + f);
    },
    [onPick],
  );

  return (
    <>
      <Rig flipped={flipped} />
      <ambientLight intensity={0.16} />
      <directionalLight
        position={[4.5, 13, -3.5]}
        intensity={2.6}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-radius={6}
        shadow-bias={-0.0008}
        shadow-camera-left={-7}
        shadow-camera-right={7}
        shadow-camera-top={7}
        shadow-camera-bottom={-7}
        shadow-camera-near={0.5}
        shadow-camera-far={30}
      />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.26, 0]}>
        <planeGeometry args={[220, 220]} />
        <meshStandardMaterial color={GROUND} roughness={0.95} />
      </mesh>

      <mesh geometry={frame}>
        <meshStandardMaterial color={FRAME} roughness={0.7} />
      </mesh>
      <mesh geometry={board.light} receiveShadow>
        <meshStandardMaterial color={LIGHT_SQUARE} roughness={0.5} />
      </mesh>
      <mesh geometry={board.dark} receiveShadow>
        <meshStandardMaterial color={DARK_SQUARE} roughness={0.5} />
      </mesh>

      {/* The square the last move came from and the square it went to. */}
      {last &&
        [last.from, last.to].map((sq, i) => (
          <mesh key={i} geometry={disc} position={[squareX(sq & 7), 0.007, squareZ(sq >> 3)]} scale={[2.6, 1, 2.6]}>
            <meshBasicMaterial color="#e8c76a" transparent opacity={0.32} />
          </mesh>
        ))}

      {selected !== null && (
        <mesh geometry={ring} rotation={[-Math.PI / 2, 0, 0]} position={[squareX(selected & 7), 0.012, squareZ(selected >> 3)]}>
          <meshBasicMaterial color="#4b8f6b" />
        </mesh>
      )}

      {targets.map((sq) => (
        <mesh key={sq} geometry={disc} position={[squareX(sq & 7), 0.012, squareZ(sq >> 3)]}>
          <meshBasicMaterial color="#4b8f6b" transparent opacity={0.62} />
        </mesh>
      ))}

      {alarm !== null && (
        <mesh geometry={disc} position={[squareX(alarm & 7), 0.01, squareZ(alarm >> 3)]} scale={[2.7, 1, 2.7]}>
          <meshBasicMaterial color="#d8483f" transparent opacity={0.36} />
        </mesh>
      )}

      {men
        .filter((m) => !m.taken)
        .map((m) => (
          <Piece key={m.id} man={m} squash={springFor(m.id)} onPick={onPick} lifted={selected === m.at} />
        ))}

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]} onPointerDown={onPlane}>
        <planeGeometry args={[SQUARE * 8, SQUARE * 8]} />
        <meshBasicMaterial visible={false} />
      </mesh>
    </>
  );
}

export { WHITE };
