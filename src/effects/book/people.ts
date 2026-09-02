import { rng } from './crayon';
import type { Beard, Cut, Glasses, Hat, Mouth, Person } from './portrait';
import { CLOTHS, GROUNDS, HAIRS, HATS, SKINS, UNDERS } from './tone';

/**
 * A hundred of them.
 *
 * Two rules, and the second one is the interesting one.
 *
 * **Nobody is anybody.** These are not portraits of real people and the names
 * are not real people's names — a first name from a wide pool and a job, which
 * is how a picture book introduces someone on the first page and is as much as
 * any of these faces could honestly claim to be.
 *
 * **The name is read off the face, not chosen beside it.** The trade comes from
 * the same seed that picked the hat, so a straw hat gets an outdoor trade and a
 * headscarf does not get "the lighthouse keeper" by accident. It is the same
 * rule Roll Call uses for its personas and it is worth restating: a caption
 * that was generated independently of the picture is a caption the reader
 * catches out immediately.
 */

const NAMES = [
  'Bram', 'Oona', 'Teodor', 'Ines', 'Kwame', 'Marta', 'Yusuf', 'Freya', 'Ravi', 'Solveig',
  'Otto', 'Nadia', 'Callum', 'Amara', 'Piet', 'Rosa', 'Hamid', 'Greta', 'Emeka', 'Lucia',
  'Anders', 'Nour', 'Tomas', 'Bibi', 'Rune', 'Ayla', 'Gus', 'Mira', 'Hector', 'Sanna',
  'Idris', 'Elke', 'Milo', 'Zofia', 'Bakari', 'Nell', 'Jonas', 'Perla', 'Ewan', 'Anouk',
  'Sami', 'Hilde', 'Ciaran', 'Vida', 'Osman', 'Thea', 'Lars', 'Juno', 'Farid', 'Bess',
  'Aurel', 'Kaya', 'Nils', 'Rafa', 'Imre', 'Sena', 'Duro', 'Pia', 'Malik', 'Wren',
  'Casper', 'Leila', 'Arto', 'Suri', 'Bo', 'Ines', 'Tam', 'Noor', 'Vasco', 'Elin',
];

/** Trades that go with a hat, so the caption never argues with the picture. */
const TRADES: Record<Hat, string[]> = {
  straw: [
    'keeps bees at the end of the lane',
    'grows the tomatoes nobody can beat',
    'walks the orchard before anyone is up',
    'sells melons from the back of a van',
    'has opinions about compost',
  ],
  flatcap: [
    'mends the things people bring him',
    'knows every gate on the hill',
    'runs the ferry, weather permitting',
    'has driven that bus for thirty years',
    'keeps the allotment key',
  ],
  beanie: [
    'paints the boats each spring',
    'is out at four for the tide',
    'cuts firewood and sings while doing it',
    'skates the canal the day it freezes',
    'sorts the post in the cold room',
  ],
  cap: [
    'fixes bicycles on a Saturday',
    'coaches the under-elevens, badly',
    'delivers bread on a very old moped',
    'takes the tickets at the pool',
    'stacks the market crates',
  ],
  scarf: [
    'bakes for the whole street on Fridays',
    'keeps the seed library',
    'knows which mushrooms and which not',
    'runs the stall by the fountain',
    'is teaching the twins to whistle',
  ],
  none: [
    'reads at the window until it is dark',
    'ties flies for people who never fish',
    'tunes the piano in the hall',
    'writes the notices for the noticeboard',
    'counts the swifts every May',
    'is the reason the clock still works',
  ],
};

/** A second clause, sometimes, because a person is not one fact. */
const HABITS = [
  'Answers questions with questions.',
  'Owns nine hats and wears one.',
  'Will talk to any dog.',
  'Never once been early.',
  'Keeps string in every pocket.',
  'Says the bridge is the best bit.',
  'Has a bad knee and a good story.',
  'Whistles slightly flat.',
  'Feeds a cat that is not theirs.',
  'Will not be rushed.',
  'Sleeps through thunder.',
  'Believes in the long way round.',
];

const HATS_ORDER: Hat[] = ['straw', 'flatcap', 'beanie', 'cap', 'scarf', 'none'];
const GLASSES: Glasses[] = ['round', 'round', 'round', 'square', 'half', 'none', 'none'];
/**
 * Beards, weighted.
 *
 * The first cast was two full beards in every eight and read as a hundred
 * variations on one man. Half of these are now clean-shaven, and because the
 * cut is chosen *after* the beard, a face with no beard is the one that gets
 * the long hair and the bun.
 */
const BEARDS: Beard[] = [
  'full', 'full', 'chin', 'goatee', 'moustache', 'stubble',
  'none', 'none', 'none', 'none', 'none', 'none',
];
const SHAVEN_CUTS: Cut[] = ['long', 'long', 'bun', 'bun', 'curls', 'mop', 'crop'];
const CUTS: Cut[] = ['crop', 'mop', 'bald', 'curls', 'tuft', 'crop'];
const MOUTHS: Mouth[] = ['smile', 'smile', 'flat', 'open', 'purse', 'whistle'];
const EARS: ('hoop' | 'stud' | 'none')[] = ['none', 'none', 'none', 'none', 'stud', 'hoop'];

const pick = <T,>(list: T[], r: () => number) => list[Math.floor(r() * list.length) % list.length];

export function cast(count: number, seed: number): Person[] {
  const out: Person[] = [];
  for (let i = 0; i < count; i++) {
    const s = (seed * 2654435761 + i * 40503) >>> 0;
    const r = rng(s);
    const hat = pick(HATS_ORDER, r);
    const beard = pick(BEARDS, r);
    const cut = pick(beard === 'none' ? SHAVEN_CUTS : CUTS, r);
    // A bun under a beanie is a lump. Long hair under a hat is fine — it hangs
    // out of the bottom, which is what long hair does.
    const realCut: Cut = hat !== 'none' && cut === 'bun' ? 'long' : cut;
    const name = NAMES[Math.floor(r() * NAMES.length) % NAMES.length];
    const trade = pick(TRADES[hat], r);
    const note = r() < 0.55 ? `${trade}. ${pick(HABITS, r)}` : `${trade}.`;

    out.push({
      seed: s,
      name,
      note: note.charAt(0).toUpperCase() + note.slice(1),
      ground: pick(GROUNDS, r),
      skin: pick(SKINS, r),
      hair: pick(HAIRS, r),
      cloth: pick(CLOTHS, r),
      under: pick(UNDERS, r),
      hatColour: pick(HATS, r),
      hat,
      glasses: pick(GLASSES, r),
      beard,
      cut: realCut,
      mouth: pick(MOUTHS, r),
      ear: pick(EARS, r),
      wide: 0.92 + r() * 0.18,
      long: 0.96 + r() * 0.09,
      gaze: r() * 2 - 1,
      brow: r(),
    });
  }
  return out;
}
