import { FACES, FAMILIES, type Face } from './expressions';
import { SASAKI, TAYAMA, type Character } from './characters';

/**
 * The hundred cards: fifty expressions, each drawn for both of them.
 *
 * The other arrangement — a hundred expressions split fifty-fifty, so every
 * expression appears once — packs more variety in and is the wrong choice. The
 * point of two characters is the comparison, and you cannot compare two faces
 * that are never pulling the same face. Pairing them means every card has a
 * twin one place along, and the constant part of a design is only visible when
 * the variable part is held still.
 *
 * Five from each of the ten families, so the fifty are spread across the whole
 * emotional range rather than piling up in whichever family happens to be
 * longest.
 */
export interface Variant {
  face: Face;
  who: Character;
}

const PER_FAMILY = 5;

function chosen(): Face[] {
  const out: Face[] = [];
  for (const fam of FAMILIES) {
    out.push(...FACES.filter((f) => f.family === fam.id).slice(0, PER_FAMILY));
  }
  return out;
}

export const EXPRESSIONS = chosen();

export const VARIANTS: Variant[] = EXPRESSIONS.flatMap((face) => [
  { face, who: SASAKI },
  { face, who: TAYAMA },
]);

if (VARIANTS.length !== 100) {
  // Ten families at five each, doubled. If a family is ever shorter than five
  // this silently produces ninety-something, and a grid that quietly holds the
  // wrong number is the kind of thing nobody notices for a month.
  throw new Error(
    `variants: expected 100, built ${VARIANTS.length} ` +
    `(${EXPRESSIONS.length} expressions × 2 — a family is short of ${PER_FAMILY})`,
  );
}
