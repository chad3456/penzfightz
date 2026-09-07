import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { BISHOP, KING, KNIGHT, PAWN, QUEEN, ROOK, type PieceType } from './rules';

/**
 * Six jelly chessmen.
 *
 * A turned chess piece is a profile spun about its axis, so five of the six are
 * a `LatheGeometry` and nothing else — the shape lives entirely in a list of
 * radii. The profile has to start and finish *on* the axis or the solid is a
 * tube with an open top and bottom, which in a transmissive material is not a
 * subtle mistake: you see straight down the inside of it.
 *
 * Everything that is not a surface of revolution — the rook's crenellations,
 * the queen's coronet, the king's cross, the whole of the knight — is built
 * separately and then **merged into one geometry**. Left as separate meshes
 * each part would be refracted on its own and the joins would show as seams
 * inside the jelly.
 */

/** One board square. Every measurement here is in squares. */
export const SQUARE = 1;

/** Heights, roughly Staunton, against a king of 1. */
const HEIGHT: Record<PieceType, number> = {
  [PAWN]: 0.5,
  [ROOK]: 0.58,
  [KNIGHT]: 0.66,
  [BISHOP]: 0.76,
  [QUEEN]: 0.87,
  [KING]: 1,
};

/** The king, in squares. Everything else is a fraction of it. */
const KING_TALL = 1.62;

export const pieceHeight = (t: PieceType) => HEIGHT[t] * KING_TALL;

const SEGMENTS = 44;

/**
 * Merge, having first made every part agree about indexing.
 *
 * `mergeGeometries` refuses a set where some parts carry an index attribute and
 * some do not, and three.js is not consistent about it: lathes, spheres and
 * boxes come out indexed, extrusions do not. Flattening them all is the one
 * line that makes the whole assembly work.
 */
function weld(parts: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const flat = parts.map((g) => (g.index ? g.toNonIndexed() : g));
  const merged = mergeGeometries(flat, false);
  if (!merged) throw new Error('chess: could not merge piece geometry');
  parts.forEach((g, i) => {
    if (flat[i] !== g) flat[i].dispose();
    g.dispose();
  });
  merged.computeVertexNormals();
  return merged;
}

/** `[radius, height]` up the piece, both as fractions of the king's height. */
type Profile = [number, number][];

function lathe(profile: Profile, scale: number): THREE.BufferGeometry {
  const pts = profile.map(([r, h]) => new THREE.Vector2(Math.max(r, 0) * scale, h * scale));
  const g = new THREE.LatheGeometry(pts, SEGMENTS);
  g.computeVertexNormals();
  return g;
}

// ------------------------------------------------------------------- profiles

/** A base every piece stands on, so the set looks like one set. */
function foot(r: number): Profile {
  return [
    [0, 0],
    [r, 0],
    [r, 0.022],
    [r * 0.94, 0.042],
    [r * 0.72, 0.062],
    [r * 0.6, 0.086],
  ];
}

const PAWN_PROFILE: Profile = [
  ...foot(0.165),
  [0.075, 0.13],
  [0.066, 0.2],
  [0.098, 0.235],
  [0.104, 0.252],
  [0.07, 0.276],
  [0.088, 0.3],
  [0.1, 0.345],
  [0.084, 0.395],
  [0.048, 0.435],
  [0, 0.455],
];

const ROOK_PROFILE: Profile = [
  ...foot(0.185),
  [0.096, 0.14],
  [0.09, 0.3],
  [0.106, 0.34],
  [0.15, 0.395],
  [0.152, 0.47],
  [0.128, 0.47],
  [0.128, 0.52],
  [0, 0.52],
];

const KNIGHT_BASE: Profile = [
  ...foot(0.185),
  [0.104, 0.14],
  [0.098, 0.25],
  [0.112, 0.285],
  [0.1, 0.3],
  [0, 0.3],
];

const BISHOP_PROFILE: Profile = [
  ...foot(0.175),
  [0.082, 0.14],
  [0.07, 0.26],
  [0.118, 0.315],
  [0.124, 0.335],
  [0.082, 0.36],
  [0.116, 0.42],
  [0.122, 0.5],
  [0.096, 0.6],
  [0.05, 0.66],
  [0.03, 0.685],
  [0.052, 0.71],
  [0.048, 0.742],
  [0, 0.76],
];

const QUEEN_PROFILE: Profile = [
  ...foot(0.2),
  [0.094, 0.15],
  [0.08, 0.3],
  [0.13, 0.36],
  [0.136, 0.382],
  [0.09, 0.41],
  [0.126, 0.47],
  [0.146, 0.58],
  [0.148, 0.66],
  [0.126, 0.7],
  [0.132, 0.72],
  [0.106, 0.745],
  [0.052, 0.79],
  [0.062, 0.83],
  [0.03, 0.862],
  [0, 0.87],
];

const KING_PROFILE: Profile = [
  ...foot(0.208),
  [0.098, 0.15],
  [0.084, 0.31],
  [0.136, 0.372],
  [0.142, 0.394],
  [0.094, 0.424],
  [0.13, 0.49],
  [0.152, 0.61],
  [0.154, 0.7],
  [0.13, 0.735],
  [0.138, 0.756],
  [0.104, 0.78],
  [0.062, 0.812],
  [0.07, 0.842],
  [0.036, 0.862],
  [0, 0.868],
];

// -------------------------------------------------------------------- extras

/** The rook's merlons: six blocks round the rim with the gaps between them. */
function crenels(scale: number): THREE.BufferGeometry[] {
  const out: THREE.BufferGeometry[] = [];
  const n = 6;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const g = new THREE.BoxGeometry(0.062 * scale, 0.075 * scale, 0.052 * scale);
    const m = new THREE.Matrix4()
      .makeRotationY(-a)
      .setPosition(Math.cos(a) * 0.132 * scale, 0.545 * scale, Math.sin(a) * 0.132 * scale);
    g.applyMatrix4(m);
    out.push(g);
  }
  return out;
}

/** The queen's coronet: eight little balls on stalks. */
function coronet(scale: number): THREE.BufferGeometry[] {
  const out: THREE.BufferGeometry[] = [];
  const n = 8;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const g = new THREE.SphereGeometry(0.03 * scale, 14, 10);
    g.translate(Math.cos(a) * 0.118 * scale, 0.756 * scale, Math.sin(a) * 0.118 * scale);
    out.push(g);
  }
  return out;
}

/** The king's cross. */
function cross(scale: number): THREE.BufferGeometry[] {
  const up = new THREE.BoxGeometry(0.036 * scale, 0.115 * scale, 0.036 * scale);
  up.translate(0, 0.918 * scale, 0);
  const across = new THREE.BoxGeometry(0.098 * scale, 0.036 * scale, 0.036 * scale);
  across.translate(0, 0.935 * scale, 0);
  return [up, across];
}

/**
 * The knight, the only one that is not a shape spun on a lathe.
 *
 * An explicit outline rather than a run of beziers. Beziers are how you would
 * draw this by hand and they are also how you get a shard: one control point
 * out of place and the curve loops back through the shape, and `ExtrudeGeometry`
 * will happily build the self-intersecting result. A dense list of points can
 * be checked by reading it, and the bevel does the smoothing.
 *
 * Head units: the neck meets the base at y = 0 and the ear tips are at y = 1.
 * Anticlockwise from the bottom of the throat — up the neck, along the jaw,
 * out to the muzzle, back over the face, the two ears, and down the mane.
 */
const KNIGHT_OUTLINE: [number, number][] = [
  [0.04, 0.0],
  [0.05, 0.11],
  [0.07, 0.18],
  [0.09, 0.24],
  [0.13, 0.3],
  [0.18, 0.35],
  [0.24, 0.4],
  [0.31, 0.44],
  [0.4, 0.47],
  [0.48, 0.5],
  [0.55, 0.54],
  [0.59, 0.6],
  [0.6, 0.655],
  [0.55, 0.675],
  [0.46, 0.685],
  [0.37, 0.705],
  [0.28, 0.73],
  [0.19, 0.755],
  [0.1, 0.785],
  [0.03, 0.825],
  [0.0, 0.87],
  [-0.015, 1.0],
  [-0.075, 0.895],
  [-0.115, 0.86],
  [-0.165, 0.975],
  [-0.2, 0.855],
  [-0.235, 0.79],
  [-0.275, 0.7],
  [-0.3, 0.6],
  [-0.315, 0.48],
  [-0.33, 0.34],
  [-0.34, 0.2],
  [-0.345, 0.0],
];

function knightHead(scale: number): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(KNIGHT_OUTLINE[0][0], KNIGHT_OUTLINE[0][1]);
  for (let i = 1; i < KNIGHT_OUTLINE.length; i++) shape.lineTo(KNIGHT_OUTLINE[i][0], KNIGHT_OUTLINE[i][1]);
  shape.closePath();

  const g = new THREE.ExtrudeGeometry(shape, {
    depth: 0.36,
    bevelEnabled: true,
    bevelThickness: 0.05,
    bevelSize: 0.05,
    bevelSegments: 4,
    curveSegments: 1,
  });
  // Extruded from the drawing plane along +Z: centre it across, size it so the
  // ears reach the height the knight is supposed to be, and stand it on the
  // collar of its base.
  g.translate(0, 0, -0.18);
  const tall = 0.45;
  g.scale(tall * scale, tall * scale, tall * scale);
  g.translate(0, 0.222 * scale, 0);
  // Left facing +x, which is *across* the board rather than up it. Turned to
  // face the opponent a knight is edge-on to both players and reads as a slab;
  // in profile it is the one piece nobody has to think about. White's face one
  // way and Black's the other, which is the mirroring a real set has anyway.
  g.computeVertexNormals();
  return g;
}

// ------------------------------------------------------------------- assembly

function buildPiece(t: PieceType): THREE.BufferGeometry {
  const s = KING_TALL;
  let parts: THREE.BufferGeometry[];
  switch (t) {
    case PAWN: parts = [lathe(PAWN_PROFILE, s)]; break;
    case ROOK: parts = [lathe(ROOK_PROFILE, s), ...crenels(s)]; break;
    case BISHOP: parts = [lathe(BISHOP_PROFILE, s)]; break;
    case QUEEN: parts = [lathe(QUEEN_PROFILE, s), ...coronet(s)]; break;
    case KING: parts = [lathe(KING_PROFILE, s), ...cross(s)]; break;
    case KNIGHT: parts = [lathe(KNIGHT_BASE, s), knightHead(s)]; break;
  }
  // One group with one material, which is the whole point of merging: a single
  // solid for the refraction to travel through.
  return weld(parts);
}

let cache: Record<PieceType, THREE.BufferGeometry> | null = null;

/** Built once and shared by all thirty-two. */
export function pieceGeometries(): Record<PieceType, THREE.BufferGeometry> {
  cache ??= {
    [PAWN]: buildPiece(PAWN),
    [KNIGHT]: buildPiece(KNIGHT),
    [BISHOP]: buildPiece(BISHOP),
    [ROOK]: buildPiece(ROOK),
    [QUEEN]: buildPiece(QUEEN),
    [KING]: buildPiece(KING),
  };
  return cache;
}
