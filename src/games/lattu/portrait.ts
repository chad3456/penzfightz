import { drawFace, makeRecipe } from '../../effects/crayon/face';
import type { Blader } from './beasts';

/**
 * A blader's face.
 *
 * The same two-crayon engine the gallery uses, seeded off the blader's id and
 * with the accent pinned to their own colour, so a card and its portrait always
 * agree. Nothing is stored: the portrait is the id, and it comes out the same
 * every time because the seed does.
 *
 * A text card told you a blader's name and nothing about them. This is the
 * cheapest possible way to have eight people in the room instead of eight rows
 * of a table.
 */
const hash = (s: string) => {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
};

export function bladerPortrait(b: Blader, w: number, h: number): HTMLCanvasElement {
  const rec = makeRecipe(hash(b.id));
  return drawFace({ ...rec, accent: b.ink }, w, h).toCanvas();
}
