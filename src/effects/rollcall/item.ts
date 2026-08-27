import type p5 from 'p5';
import { cat, type Genome } from './genome';
import { drawFace } from './face';
import { drawBloom } from './bloom';
import { drawKit } from './kit';

/**
 * One genome, drawn as whatever it is.
 *
 * The single place `species` is turned into a renderer. Everything upstream —
 * the search, the metric, the atlas, the instanced card, the persona — is
 * indifferent to which of the three a seat happens to be, which is the whole
 * reason a flower could be added without touching any of them.
 */
export function drawItem(p: p5, gn: Genome, size: number, style: { colour?: boolean } = {}) {
  switch (cat(gn, 'species')) {
    case 1:
      return drawBloom(p, gn, size, style);
    case 2:
      return drawKit(p, gn, size, style);
    default:
      return drawFace(p, gn, size, style);
  }
}
