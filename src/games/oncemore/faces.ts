import { drawPortrait, type Person } from '../../effects/book/portrait';

/**
 * The two at the table.
 *
 * Drawn by Picture Book's own hand — the same head, the same torn ground, the
 * same crayon scuff and grain — because the alternative was two photographs,
 * and a photograph of a real man beside a paraphrase of his argument implies
 * the paraphrase is a quotation. A drawing does not make that claim.
 *
 * Neither is a likeness and neither pretends to be. Each is built from three or
 * four marks that the reader will recognise if they know the face and will not
 * be misled by if they do not: for the Russian, the high pale forehead and the
 * long straggling beard; for the German, the moustache that is doing most of
 * the work of the silhouette, and the heavy brow above it.
 */

const BASE: Omit<Person, 'name' | 'note' | 'seed'> = {
  ground: ['#d8dbdd', '#e9e2d2'],
  skin: { base: '#f2dcc6', shade: '#dcb99c', blush: '#e0a08c' },
  hair: '#5b4a3c',
  cloth: '#3a3a40',
  under: '#efe8dc',
  hatColour: '#3a3a40',
  hat: 'none',
  glasses: 'none',
  beard: 'full',
  cut: 'crop',
  mouth: 'flat',
  ear: 'none',
  wide: 1,
  long: 1,
  gaze: 0,
  brow: 0.6,
};

export const RUSSIAN: Person = {
  ...BASE,
  seed: 18211881,
  name: 'Fyodor Dostoevsky',
  note: '1821–1881',
  ground: ['#cdd6da', '#e6dcc6'],
  skin: { base: '#eddac4', shade: '#d3b096', blush: '#d69684' },
  hair: '#6b5a48',
  cloth: '#33343a',
  beard: 'full',
  cut: 'tuft',
  mouth: 'flat',
  wide: 0.94,
  long: 1.04,
  gaze: -0.35,
  brow: 0.5,
};

export const GERMAN: Person = {
  ...BASE,
  seed: 18441900,
  name: 'Friedrich Nietzsche',
  note: '1844–1900',
  ground: ['#dcd6e0', '#eadfcc'],
  skin: { base: '#f2dcc2', shade: '#d9b193', blush: '#dd9c86' },
  hair: '#42352c',
  cloth: '#2f3138',
  beard: 'walrus',
  cut: 'mop',
  mouth: 'flat',
  wide: 1.03,
  long: 0.99,
  gaze: 0.3,
  brow: 1,
};

export function drawFace(g: CanvasRenderingContext2D, who: Person, size: number) {
  drawPortrait(g, who, size, size);
}
