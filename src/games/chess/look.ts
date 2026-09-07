import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { WHITE, type Colour } from './rules';
import { SQUARE } from './pieces';

/**
 * How the set is made of jelly, and what it stands on.
 *
 * The room the pieces are lit by is the one built for the dice — the same
 * problem and the same answer: broad, dim sources so a flat face does not
 * mirror a light panel and clip, plus two small hot ones so a refracting body
 * has something to refract.
 */
export { makeEnvironment } from '../../effects/dice/table';

export const GROUND = '#efedee';

export interface Jelly {
  name: string;
  /** Surface tint. Pale — the depth colour is `attenuation`. */
  body: string;
  attenuation: string;
  /** How far light gets before it is fully that colour. Small is dense. */
  depth: number;
  /** The swatch in the panel, and the tint of the square it is standing on. */
  swatch: string;
}

export const SIDES: Record<Colour, Jelly> = {
  0: { name: 'Lemon', body: '#fff0c2', attenuation: '#ffc21e', depth: 0.5, swatch: '#f5c542' },
  1: { name: 'Blackcurrant', body: '#dcc2ee', attenuation: '#5b1180', depth: 0.34, swatch: '#6b2a8f' },
};

/**
 * The jelly.
 *
 * `thickness` is the one thing that cannot be shared with the dice: a die is a
 * solid inch of jelly in every direction and a pawn's neck is a few
 * millimetres, so a thickness set for the die makes the thin pieces read as
 * black glass. It is passed per piece, from how wide that piece actually is.
 */
export function jellyMaterial(side: Jelly, thickness: number): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(side.body),
    transmission: 0.9,
    thickness,
    attenuationColor: new THREE.Color(side.attenuation),
    attenuationDistance: side.depth,
    roughness: 0.17,
    metalness: 0,
    ior: 1.42,
    clearcoat: 0.7,
    clearcoatRoughness: 0.18,
    envMapIntensity: 1.1,
    // Both sides, or the back wall of the jelly is missing and the inside of a
    // piece reads as hollow.
    side: THREE.DoubleSide,
  });
}

// --------------------------------------------------------------------- board

export const LIGHT_SQUARE = '#f3efe6';
export const DARK_SQUARE = '#bca7b5';
export const FRAME = '#e6e0d8';

const THICK = 0.09;
const RADIUS = 0.014;

/**
 * The sixty-four squares as two geometries rather than sixty-four meshes.
 *
 * Each square is a rounded slab with a hair of a gap round it, so the board
 * reads as tiles laid down rather than as a painted surface — but they are
 * merged by colour, so the whole board is two draws.
 */
export function boardGeometries(): { light: THREE.BufferGeometry; dark: THREE.BufferGeometry } {
  const light: THREE.BufferGeometry[] = [];
  const dark: THREE.BufferGeometry[] = [];
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const g = new RoundedBoxGeometry(SQUARE * 0.985, THICK, SQUARE * 0.985, 2, RADIUS);
      g.translate(squareX(f), -THICK / 2, squareZ(r));
      ((f + r) & 1 ? light : dark).push(g);
    }
  }
  const merge = (list: THREE.BufferGeometry[]) => {
    const flat = list.map((g) => (g.index ? g.toNonIndexed() : g));
    const g = mergeGeometries(flat, false);
    if (!g) throw new Error('chess: could not merge board geometry');
    list.forEach((x, i) => {
      if (flat[i] !== x) flat[i].dispose();
      x.dispose();
    });
    return g;
  };
  return { light: merge(light), dark: merge(dark) };
}

/** The tray the board sits in. */
export function frameGeometry(): THREE.BufferGeometry {
  const w = SQUARE * 8 + 0.62;
  return new RoundedBoxGeometry(w, 0.16, w, 3, 0.06).translate(0, -THICK - 0.045, 0);
}

/**
 * Board coordinates.
 *
 * `a1` is dark and sits at the near left from White's side, so file runs along
 * +x and rank along −z. Getting this the wrong way round produces a board that
 * plays correctly and looks, to anyone who has held a chess set, wrong.
 */
export const squareX = (f: number) => (f - 3.5) * SQUARE;
export const squareZ = (r: number) => (3.5 - r) * SQUARE;

export function squareCentre(i: number): [number, number] {
  return [squareX(i & 7), squareZ(i >> 3)];
}

/** Which way a piece faces. Knights should look at the enemy. */
export const facing = (c: Colour) => (c === WHITE ? 0 : Math.PI);
