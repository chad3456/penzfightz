import { Pad } from '../flat/pad';
import { grain, ground, rng, shift } from '../book/crayon';
import {
  EAR_Y, HW, beard, ears, face, features, hair, neck, oval,
  type Beard, type Cut, type Head, type Mouth,
} from '../book/portrait';
import { LINE, type Skin } from '../book/tone';
import {
  behind, creature, crownOn, drapery, forehead, neckwear, ornament, sight,
  type Crown, type Drape, type Kind, type Mark, type Neckwear, type Ornament, type Regalia,
} from './regalia';
import type { PIGMENT } from './look';

/**
 * One figure from the epics.
 *
 * The face is Picture Book's, unchanged and imported rather than copied — the
 * same head, the same enormous ears and crowded features, the same torn ground,
 * the same crayon scuff and grain. That is the point of doing it this way: the
 * claim the picture-book gallery makes is that a generator can hold one
 * illustrator's hand steady across a cast, and the honest test of that claim is
 * to hand the same hand a completely different subject and see whether it still
 * looks like one book. Everything new here is *iconography*, not style.
 *
 * ### What a card is, and what it is not
 *
 * There is no likeness in any of this and there could not be. What the roster
 * records is what the texts say — that this one is dark as a rain cloud, that
 * one wears matted locks, that one has fangs — and the generator draws a face
 * under it. A card here is a name and a set of attributes, which is all any of
 * these figures has ever been on a painted page.
 */

export type Book = 'mahabharata' | 'ramayana' | 'asura' | 'deva' | 'rishi';

export interface Being extends Head, Regalia {
  name: string;
  note: string;
  book: Book;
  /** The house, the army, or the ashram. */
  side: string;
  /** True for a figure the texts name; false for one of the host. */
  named: boolean;
  sky: [string, string];
}

/** The two lists have to line up; this is the one place that is checked. */
export type { Beard, Crown, Cut, Drape, Kind, Mark, Mouth, Neckwear, Ornament, Skin };
export type MarkInk = keyof typeof PIGMENT;

/** Ganesha's ears: two fans, and they are most of the silhouette. */
function elephantEars(pad: Pad, b: Being) {
  const hw = HW * b.wide;
  for (const side of [-1, 1]) {
    const x = 0.5 + side * hw * 1.05;
    const fan = [
      [x - side * 0.02, EAR_Y - 0.13],
      [x + side * 0.13, EAR_Y - 0.115],
      [x + side * 0.175, EAR_Y + 0.015],
      [x + side * 0.115, EAR_Y + 0.13],
      [x - side * 0.01, EAR_Y + 0.115],
    ] as [number, number][];
    pad.shape(fan, b.hair);
    pad.shape(
      fan.map(([fx, fy]) => [0.5 + (fx - 0.5) * 0.78, EAR_Y + (fy - EAR_Y) * 0.72] as [number, number]),
      shift(b.skin.blush, 0.1),
    );
    pad.line([...fan, fan[0]], LINE, { width: 0.008, alpha: 0.85 });
  }
}

/** A vanara's ears are round, high and furred, and they are not human ears. */
function vanaraEars(pad: Pad, b: Being) {
  const hw = HW * b.wide;
  for (const side of [-1, 1]) {
    const x = 0.5 + side * hw * 1.05;
    pad.blob([x, EAR_Y - 0.02], 0.056, 0.06, side * 0.12, shift(b.hair, 0.3));
    pad.blob([x, EAR_Y - 0.02], 0.03, 0.034, side * 0.12, shift(b.skin.blush, 0.15));
    pad.line([...oval(x, EAR_Y - 0.02, 0.056, 0.06, 12)], LINE, { width: 0.0075, alpha: 0.85 });
  }
}

export function drawBeing(g: CanvasRenderingContext2D, b: Being, w: number, h: number) {
  const pad = new Pad(g, w, h, b.seed);
  const r = rng(b.seed ^ 0x51ab);

  g.save();
  g.fillStyle = '#fdfbf6';
  g.fillRect(0, 0, w, h);
  ground(pad, b.sky[0], b.sky[1], b.seed ^ 0x2211);

  // Light, serpents and second heads all go on before the figure does.
  behind(pad, b, b.skin.base);

  hair(pad, b, r, false);
  neck(pad, b);
  drapery(pad, b, b.skin.base);
  if (b.kind === 'vanara') vanaraEars(pad, b);
  else if (b.kind === 'elephant') elephantEars(pad, b);
  else if (b.kind !== 'bird') ears(pad, b);
  face(pad, b);
  features(pad, b);
  beard(pad, b, r);
  // The muzzle, the fangs and the horns go over the face they change.
  creature(pad, b, b.hair);
  sight(pad, b, b.skin.base);
  forehead(pad, b);
  ornament(pad, b);
  neckwear(pad, b);
  hair(pad, b, r, true);
  crownOn(pad, b, b.hair);
  grain(pad, b.seed ^ 0x66c1);
  g.restore();
}
