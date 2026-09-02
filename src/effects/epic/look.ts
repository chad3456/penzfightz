import type { Skin } from '../book/tone';

/**
 * The colours of the epics.
 *
 * Picture Book's palette is a printing convention — gouache on uncoated paper,
 * nothing saturated, nothing black. This keeps all of that and adds the
 * complexions the stories themselves specify, because in this material skin
 * colour is not a variable, it is *information*: Rama and Krishna are described
 * as dark as a rain cloud and are painted blue for it, Shiva is ash from the
 * cremation ground, and a rakshasa in a manuscript page is green or smoke.
 *
 * So these are picked by tag rather than by seed. A figure who is described a
 * particular way gets that complexion; everybody else gets a human one.
 */

export const DIVINE: Record<string, Skin> = {
  // The rain-cloud blue of Vishnu and his avatars. Cooled and greyed, because
  // a saturated blue face is a cartoon and a manuscript page never is.
  blue: { base: '#8fa9d8', shade: '#6d87ba', blush: '#7d8fc6' },
  deepblue: { base: '#6d86bd', shade: '#4f6699', blush: '#5f77ac' },
  // Ash from the ground, for the ascetic forms.
  ash: { base: '#d6d3ca', shade: '#b0aca1', blush: '#c0b6ad' },
  // The gold of the devas, which is light rather than metal.
  gold: { base: '#f2d29a', shade: '#d5ab6a', blush: '#e0b077' },
  // Rakshasas and daityas, in the two colours the painters give them.
  green: { base: '#9db682', shade: '#7a9061', blush: '#8a9b6a' },
  smoke: { base: '#8d8b8e', shade: '#6a686d', blush: '#7a7076' },
  // Rudra, and the fiercer goddesses.
  red: { base: '#d99074', shade: '#b46b50', blush: '#c4705a' },
  night: { base: '#5a5570', shade: '#403c55', blush: '#4d4560' },
};

/** Skies for the grounds, warmer and deeper than the picture-book pastels. */
export const SKIES: [string, string][] = [
  ['#cfdcea', '#f3dfb4'], ['#e4d9e6', '#f6dcc0'], ['#d5e2d6', '#f4e2bd'],
  ['#ecd9d0', '#f7e6c8'], ['#d2dde9', '#eedcc4'], ['#e8dfc9', '#f6e2bb'],
  ['#d8d3e4', '#f1dbc6'], ['#cee0e2', '#f5e4bd'], ['#efdcc9', '#f8e8cf'],
  ['#dae0ce', '#f3ddb6'],
];

/** Darker grounds for the night-rangers and the daityas. */
export const NIGHT_SKIES: [string, string][] = [
  ['#8f93ab', '#d9b894'], ['#9a8fa2', '#d6ae95'], ['#7f8a9c', '#c9ab8c'],
  ['#a08f8c', '#dcb79a'], ['#88919c', '#cfae8e'],
];

/** Gold, and the several metals a crown is actually painted in. */
export const REGALIA = ['#e0b552', '#d6a441', '#c9942f', '#eac368', '#c8a15a', '#dcb96a'];

/**
 * Armour.
 *
 * Deliberately *not* the crown gold. Plate in the crown metal turns every
 * warrior into a yellow poncho with a face on top — which is exactly what the
 * first cast looked like — because the eye reads a large flat area of the same
 * hue as the crown as one garment.
 */
export const STEEL = ['#b3ada0', '#9ba49f', '#a8926b', '#8e9aa4', '#b09272', '#9d9788'];

/** Silks. Deep, saturated, and never the same as the crown. */
export const SILKS = [
  '#b5442f', '#c8762a', '#d2a52c', '#4c7a4a', '#2f6b78', '#3c5290',
  '#6a3f86', '#a63160', '#8c4a24', '#2f6357', '#8e2f3c', '#5b6f28',
];

/** Borders and hems: the second colour on any piece of cloth. */
export const HEMS = ['#e6c766', '#f0dca0', '#d9b04a', '#efe0b6', '#c9a24e'];

/** Ash, saffron and bark, for anyone living in a forest on purpose. */
export const ASCETIC = ['#d98f3c', '#c4762c', '#b8895a', '#cfa06a', '#d9c8a8'];

/** The mark on the forehead is drawn in one of three earths. */
export const PIGMENT = { white: '#f0ece0', red: '#b8332c', yellow: '#d9a63c' };
