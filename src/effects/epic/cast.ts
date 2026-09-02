import { rng } from '../book/crayon';
import { HAIRS, SKINS } from '../book/tone';
import type { Beard, Cut, Mouth } from '../book/portrait';
import { ASCETIC, DIVINE, HEMS, NIGHT_SKIES, REGALIA, SILKS, SKIES, STEEL } from './look';
import type { Being } from './figure';
import type { Crown, Drape, Kind, Mark, Neckwear, Ornament } from './regalia';
import { GROUPS, HOSTS, hostName } from './roster';

/**
 * Turning a line of the roster into a face.
 *
 * The rule is that the roster only ever states what the *texts* state, and
 * everything else is the seed's business. So a tag sets a field and locks it;
 * an untagged field is drawn from a list. That division is the whole reason the
 * gallery can be trusted: Rama is blue and crowned and marked with the urdhva
 * pundra because those are given, and his eyebrows are whatever the seed says
 * because nothing is given about his eyebrows.
 */

const pick = <T,>(list: T[], r: () => number) => list[Math.floor(r() * list.length) % list.length];

const CROWNS: Crown[] = ['kirita', 'karanda', 'turban', 'helm', 'bare', 'turban', 'karanda'];
const MARKS: Mark[] = ['urdhva', 'tripundra', 'tilak', 'bindu', 'none', 'none'];
const MOUTHS: Mouth[] = ['smile', 'flat', 'flat', 'purse', 'open'];
const ORNAMENTS: Ornament[] = ['kundala', 'makara', 'stud', 'kundala', 'none'];
const NECKS: Neckwear[] = ['haar', 'haar', 'torque', 'rudraksha', 'none'];
const DRAPES: Drape[] = ['uttariya', 'armour', 'bare', 'uttariya'];
const BEARDS: Beard[] = ['moustache', 'full', 'chin', 'goatee', 'stubble', 'none', 'moustache'];
const CUTS: Cut[] = ['crop', 'mop', 'long', 'curls', 'bun'];

/** One roster line, or one member of a host, expanded into everything drawn. */
function build(
  seed: number,
  name: string,
  note: string,
  tags: string,
  book: Being['book'],
  side: string,
  named: boolean,
): Being {
  const r = rng(seed);
  const t = new Set(tags.split(/\s+/).filter(Boolean));
  const has = (k: string) => t.has(k);

  const kind: Kind = has('rakshasa') ? 'rakshasa'
    : has('vanara') ? 'vanara'
      : has('naga') ? 'naga'
        : has('bird') ? 'bird'
          : has('elephant') ? 'elephant' : 'human';
  const woman = has('woman');
  const old = has('old') || has('white') || has('sage');

  // Complexion. Stated ones are stated; the rest are human.
  const divine = (['blue', 'deepblue', 'ash', 'gold', 'green', 'smoke', 'red', 'night'] as const).find(has);
  const skin = divine
    ? DIVINE[divine]
    : has('fair')
      ? SKINS[0]
      : has('dark')
        ? SKINS[5]
        : kind === 'rakshasa'
          ? pick([DIVINE.green, DIVINE.smoke, SKINS[5], SKINS[6]], r)
          : kind === 'vanara'
            ? pick([SKINS[2], SKINS[3], SKINS[4]], r)
            : pick(SKINS, r);

  const hair =
    has('white') || has('sage') || (old && r() < 0.7)
      ? pick(['#c9c2b4', '#e6e2d8', '#8e8579'], r)
      : kind === 'vanara'
        ? pick(['#8e6a3c', '#a4763f', '#6f5236', '#c9b08a'], r)
        : pick(HAIRS.slice(0, 8), r);

  const crown: Crown =
    (['kirita', 'karanda', 'jata', 'turban', 'helm', 'flowers', 'bare'] as const).find(has) ??
    (has('sage') ? 'jata' : woman ? pick(['flowers', 'karanda', 'bare'] as Crown[], r) : pick(CROWNS, r));

  const drape: Drape = has('armour')
    ? 'armour'
    : has('sari')
      ? 'sari'
      : has('bark')
        ? 'bark'
        : has('bareskin')
          ? 'bare'
          : has('uttariya')
            ? 'uttariya'
            : woman
              ? 'sari'
              : has('warrior')
                ? 'armour'
                : pick(DRAPES, r);

  const mark: Mark = (['urdhva', 'tripundra', 'tilak', 'bindu'] as const).find(has) ??
    (woman ? 'bindu' : kind === 'rakshasa' ? 'none' : pick(MARKS, r));

  const heads = has('tenheads') ? 9 : has('heads6') ? 5 : has('heads4') ? 3 : has('heads2') ? 2 : 0;

  // A woman with a full beard, or an ascetic in plate armour, is the generator
  // showing through. Two rules, and they are the only overrides here.
  const beard: Beard = woman || kind === 'vanara' || kind === 'bird' || kind === 'elephant' ? 'none'
    : has('sage') || has('white') ? 'full'
      : has('young') ? pick(['none', 'none', 'stubble'] as Beard[], r)
        : pick(BEARDS, r);

  const cut: Cut = has('sage') || crown === 'jata' ? 'crop'
    : woman ? pick(['long', 'long', 'bun'] as Cut[], r)
      : pick(CUTS, r);

  const dark = kind === 'rakshasa' || book === 'asura';

  return {
    seed,
    name,
    note,
    book,
    side,
    named,
    sky: pick(dark ? NIGHT_SKIES : SKIES, r),
    skin,
    hair,
    beard,
    cut,
    mouth: kind === 'rakshasa' ? pick(['flat', 'open', 'purse'] as Mouth[], r) : pick(MOUTHS, r),
    ear: 'none',
    wide: 0.94 + r() * 0.16 + (kind === 'rakshasa' ? 0.06 : 0),
    long: 0.96 + r() * 0.09,
    gaze: r() * 2 - 1,
    brow: has('rakshasa') ? 0.8 + r() * 0.2 : r(),
    // regalia
    sight: has('blind') ? (woman ? 'bound' : 'closed') : has('sage') && r() < 0.35 ? 'closed' : 'open',
    crown,
    metal: pick(REGALIA, r),
    steel: pick(STEEL, r),
    silk: has('bark') || has('sage') ? pick(ASCETIC, r) : pick(SILKS, r),
    hem: pick(HEMS, r),
    mark,
    markInk: mark === 'tripundra' ? 'white' : mark === 'tilak' ? 'yellow' : 'white',
    thirdEye: has('thirdeye'),
    ornament: (['kundala', 'makara', 'stud'] as const).find(has) ??
      (crown === 'jata' || has('sage') ? 'stud' : pick(ORNAMENTS, r)),
    neckwear: has('serpent') ? 'serpent'
      : has('sage') ? 'rudraksha'
        : crown === 'bare' && kind === 'rakshasa' ? pick(['torque', 'none'] as Neckwear[], r)
          : pick(NECKS, r),
    drape,
    kind,
    fangs: has('fangs'),
    horns: has('horns'),
    heads,
    halo: has('halo'),
    hairColour: hair,
  };
}

/**
 * The whole cast, named first.
 *
 * The named always come out at the front of the list and always in the same
 * order, so the roster is a roster rather than a lucky dip — reseeding changes
 * what everybody looks like and never changes who is in it.
 */
export function beings(count: number, seed: number, only?: Being['book'] | 'named'): Being[] {
  const out: Being[] = [];
  let i = 0;
  for (const g of GROUPS) {
    for (const [name, tags, note] of g.rows) {
      const keep = !only || only === 'named' || only === g.book;
      if (keep) out.push(build((seed * 2654435761 + i * 40503) >>> 0, name, note, tags, g.book, g.side, true));
      i++;
    }
  }
  if (only === 'named') return out;

  const hosts = HOSTS.filter((h) => !only || h.book === only);
  const total = hosts.reduce((a, h) => a + h.weight, 0) || 1;
  const want = Math.max(0, count - out.length);
  for (const h of hosts) {
    const n = Math.round((want * h.weight) / total);
    for (let k = 0; k < n && out.length < count; k++) {
      const s = (seed * 2246822519 + i * 40503 + 7919) >>> 0;
      out.push(build(s, hostName(s >>> 3), h.note, h.tags, h.book, h.side, false));
      i++;
    }
  }
  return out;
}

/** How many of the cast are figures the texts actually name. */
export const NAMED = GROUPS.reduce((a, g) => a + g.rows.length, 0);
