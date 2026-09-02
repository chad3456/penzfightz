/**
 * The colours a picture book is allowed.
 *
 * Every palette in this repository so far has been derived — six inks chosen by
 * a spacing test, two pigments and water, a paper and a stick. This one is
 * picked by hand, and it should be, because the style being copied here is not
 * a physical process at all. It is a *printing* convention: gouache and pencil,
 * reproduced on uncoated paper, in the narrow gamut that survives it. Nothing
 * is saturated, nothing is pure black, the ground is always warm, and the
 * shadows are colour rather than grey.
 *
 * The grounds come in pairs because every one of the references does the same
 * thing — a cool wash at the top of the card and a warm one at the bottom, so
 * the head is lit from below by the paper it is standing on.
 */

export interface Skin {
  base: string;
  shade: string;
  blush: string;
}

/** Sky at the top, sand at the bottom. */
export const GROUNDS: [string, string][] = [
  ['#cfe3e8', '#f6e6ba'], ['#dbe7d9', '#f7e3c8'], ['#e2dced', '#fae0cd'],
  ['#cfe0ee', '#f8ead0'], ['#e9dfd4', '#fbeccd'], ['#d6e6e0', '#f4e0c6'],
  ['#f0dcd9', '#f9ecd2'], ['#d3dfe9', '#efe2cf'], ['#e4e8d5', '#fbe8c6'],
  ['#dde3ee', '#f6dfd3'], ['#cde5e1', '#f9e8c4'], ['#efe2e6', '#f7e9d6'],
];

/**
 * Skins, as base, shadow and blush.
 *
 * The shadow is never the base darkened — it is the base turned towards red,
 * because skin is translucent and what you see in a shadow on a face is the
 * blood under it. Grey shadows are the single commonest way to make a warm
 * illustration look ill.
 */
export const SKINS: Skin[] = [
  { base: '#fbd9bd', shade: '#eeb694', blush: '#f0a68f' },
  { base: '#f7cba6', shade: '#e2a179', blush: '#e89179' },
  { base: '#eab98e', shade: '#cf8f63', blush: '#dd8266' },
  { base: '#d69a6d', shade: '#b6764b', blush: '#c26a4e' },
  { base: '#b87b4f', shade: '#94582f', blush: '#a45438' },
  { base: '#8f5a34', shade: '#6d3f20', blush: '#7f3f27' },
  { base: '#6b4028', shade: '#4d2b18', blush: '#5e2c1c' },
  { base: '#fce3ce', shade: '#f0c1a4', blush: '#f3ad97' },
];

/** Hair, and therefore beards: they are the same fibre. */
export const HAIRS: string[] = [
  '#e3a92f', '#d98b2b', '#c2621f', '#a24a22', '#7a4726', '#5a3620',
  '#3a2a22', '#241d1c', '#8e8579', '#c9c2b4', '#e6e2d8', '#b8763f',
  '#946b3a', '#6f5236', '#4a3d34', '#d6b06a',
];

/** Shirts, jerseys, aprons and coats. */
export const CLOTHS: string[] = [
  '#7d97a6', '#6d8b7c', '#a8704f', '#c39a44', '#8a7ba4', '#b8624f',
  '#5f7d92', '#87996a', '#a45f6b', '#4f6a78', '#c58f5e', '#7b6f8c',
];

/** What is under the collar. Always paler than the shirt, always warm. */
export const UNDERS: string[] = ['#f6efdd', '#f2e6d2', '#efe8dc', '#faf1e2', '#ece3d0'];

/** Straw, felt, wool: hat cloth is its own list because it must not match. */
export const HATS: string[] = [
  '#dcb35a', '#c9a04b', '#b8863c', '#8f9a7e', '#a7625a', '#6f7f8c',
  '#c2795a', '#5f6a5c', '#d3c39a', '#7c6d8a', '#9c5f4a', '#4f5b66',
];

/** The line. Never black — a warm charcoal, which is what a soft pencil is. */
export const LINE = '#2e2622';
export const PAPER = '#fdfbf6';
