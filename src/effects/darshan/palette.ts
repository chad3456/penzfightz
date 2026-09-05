/**
 * The colours, read off the reference.
 *
 * The style is mid-century flat vector: no outline anywhere, every edge is a
 * change of fill, and the whole thing sits on unbleached cream. What makes it
 * cohere is not the hues but the *count* — eight or nine colours for a whole
 * figure, reused between the skin, the cloth and the metal, so a bracelet is
 * the same gold as a hem and the shadow on an arm is the same navy as the hair.
 *
 * The one non-negotiable: there is a single light, and one terminator line
 * crosses the entire body. Every part is painted twice — light, then the
 * shadow side clipped to that part — and because the line is shared, thirty
 * separate polygons read as one solid person standing in one room.
 */

export interface Tone {
  /** The lit side. */
  light: string;
  /** The side turned away. */
  dark: string;
}

export interface Palette {
  paper: string;
  /** The darkest thing on the card: hair, spear shafts, the deep shadow. */
  ink: string;
  skin: Tone;
  /** Lower garment — dhoti, sari, antariya. */
  cloth: Tone;
  /** Upper garment, sash, or armour. */
  wrap: Tone;
  gold: string;
  /** A second metal, for weapon blades and armour plate. */
  steel: string;
  /** The one hot accent, used sparingly. */
  accent: string;
}

const PAPER = '#f3ecd8';
const INK = '#1c333e';

/**
 * Skin is iconography, not pigment.
 *
 * Krishna and Rama are painted blue because the texts call them the colour of
 * a rain cloud; Hanuman is vermilion because of the sindoor; Shiva is ash.
 * These are the traditional colours and they are the reason you can name the
 * figure from across a room, so they are fixed per deity rather than drawn
 * from the seed.
 */
export const SKIN = {
  rainCloud: { light: '#a7c8da', dark: '#2a5568' },
  darkBlue: { light: '#7fa8c4', dark: '#243f57' },
  vermilion: { light: '#e79a63', dark: '#a2452a' },
  ash: { light: '#d8d2c4', dark: '#6c6a63' },
  gold: { light: '#e9c479', dark: '#9b6f2c' },
  amber: { light: '#e3ab6d', dark: '#8f5327' },
  night: { light: '#5d7b93', dark: '#16232f' },
  saffron: { light: '#e5a24e', dark: '#96501d' },
  pale: { light: '#e8dcc4', dark: '#8b8069' },
  green: { light: '#8fb094', dark: '#33513f' },
} as const;

/** Cloth, which is where the variety lives, because dye is not doctrine. */
export const CLOTHS: Tone[] = [
  { light: '#d8952f', dark: '#8e4d17' },
  { light: '#c96a34', dark: '#7e3418' },
  { light: '#b8342c', dark: '#6d1c1c' },
  { light: '#e6d9ba', dark: '#9a8a66' },
  { light: '#3f7f7a', dark: '#1f4547' },
  { light: '#c9a227', dark: '#7c5c11' },
  { light: '#a8452f', dark: '#61211a' },
  { light: '#dcc07a', dark: '#907a3a' },
  { light: '#7a5f9c', dark: '#3d2c56' },
  { light: '#2f6b8e', dark: '#173a51' },
];

export const WRAPS: Tone[] = [
  { light: '#e6d9ba', dark: '#a4906b' },
  { light: '#b0885a', dark: '#6b4d2c' },
  { light: '#8e3226', dark: '#521711' },
  { light: '#c9c2ac', dark: '#7f7867' },
  { light: '#356e6a', dark: '#1a3c3c' },
  { light: '#d4a843', dark: '#87661d' },
];

const GOLDS = ['#d9a83f', '#e0b653', '#c99a2f'];
const STEELS = ['#cfd4d2', '#b9c2c4', '#dad3bd'];
const ACCENTS = ['#c95a2e', '#b8342c', '#3f7f7a', '#d8952f'];

const pick = <T,>(list: readonly T[], r: () => number) => list[Math.floor(r() * list.length) % list.length];

export function palette(skin: Tone, r: () => number, cloth?: Tone, wrap?: Tone): Palette {
  return {
    paper: PAPER,
    ink: INK,
    skin,
    cloth: cloth ?? pick(CLOTHS, r),
    wrap: wrap ?? pick(WRAPS, r),
    gold: pick(GOLDS, r),
    steel: pick(STEELS, r),
    accent: pick(ACCENTS, r),
  };
}

export { PAPER, INK };
