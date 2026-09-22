/**
 * The corpus.
 *
 * Every piece on this site, when it was made, what it is made of, and — the
 * part that matters — which bits of machinery it shares with the others.
 *
 * Names, taglines and colours are not repeated here: they are read off the two
 * registries that already hold them, because a second copy of a name is a
 * second copy that will go stale. What is added here is the part no registry
 * knows: the date the folder first appeared in the history, a line about the
 * medium, and the list of shared modules the thing actually imports.
 *
 * The `uses` lists were taken off the imports rather than off memory. They are
 * checkable, and one of them was wrong when I did it from memory.
 */

import { GAMES } from '../arcade/games';
import { EFFECTS } from '../effects/effects';

export type Kind = 'game' | 'picture';

export interface Work {
  id: string;
  kind: Kind;
  name: string;
  line: string;
  ink: string;
  /** When the folder first appeared, from `git log --diff-filter=A`. */
  made: string;
  /** What it is made of, in one breath. */
  medium: string;
  /** Machinery it shares with the rest. */
  uses: string[];
}

/**
 * The shared machinery.
 *
 * These are the hubs of the picture: the things more than one piece is built
 * out of. A style is not what connects this work — half of it is ink and half
 * of it is polygons and no two look alike. What connects it is that the same
 * eleven or twelve engines keep turning up.
 */
export interface Machine {
  id: string;
  name: string;
  note: string;
}

export const MACHINES: Machine[] = [
  { id: 'room', name: 'the room layer', note: 'Channels, invite links, and the business of two people being in the same game at once.' },
  { id: 'arena', name: 'the arena', note: 'Rigid bodies on a desk. Written for one game and never needed twice.' },
  { id: 'press', name: 'the press', note: 'Risograph separation: coverage per ink, a rotated halftone lattice per plate, multiply overprint. Dot area tracks coverage, not dot radius.' },
  { id: 'shell', name: 'the reading shell', note: 'The globe and the layout toggle that a dozen of the picture pieces sit inside.' },
  { id: 'pad', name: 'the pad', note: 'Flat colour laid down in fields, with the edges that flat colour needs.' },
  { id: 'ink', name: 'the ink', note: 'A wet line that pools where it turns and dries paler where it runs out.' },
  { id: 'graphite', name: 'the graphite engine', note: 'Nothing is stroked. Every mark is a run of deposits with tooth, pressure that ramps, and two passes that nearly agree.' },
  { id: 'hand', name: 'the hand', note: 'Letterforms stored as the strokes a hand makes, in the order a hand makes them, seeded so no two es match.' },
  { id: 'riso', name: 'the riso plates', note: 'Six plates, five inks and a key line, with knockouts — because a press multiplies, so a box on a wall reads as box times wall unless you take the wall out first.' },
  { id: 'plan', name: 'the plan of Hallowdene', note: 'One castle in one coordinate system, used twice: once in bricks and once in ink.' },
  { id: 'dice', name: 'the dice', note: 'Something tumbling that has to come to rest on a face and be believed.' },
  { id: 'rosette', name: 'the rosette', note: 'A printer’s ornament, built out of nothing but a circle and a repeat.' },
  { id: 'portrait', name: 'the portraits', note: 'Faces drawn out of parts, so a new one is a new set of numbers rather than a new drawing.' },
  { id: 'build', name: 'the ground-plan builder', note: 'Rooms from a plan: walls, openings, and the arithmetic that keeps them meeting.' },
];

/** Everything else about each piece, keyed by the id the registries already use. */
const EXTRA: Record<string, { made: string; medium: string; uses: string[] }> = {
  // ── the games
  penfight: { made: '2026-08-22', medium: 'rigid bodies, three.js, two pens', uses: ['arena', 'room'] },
  rajarani: { made: '2026-08-22', medium: 'four folded chits, four strangers', uses: ['room'] },
  rang: { made: '2026-08-22', medium: 'a deck, a trump, and thirteen tricks', uses: ['room'] },
  mafia: { made: '2026-08-22', medium: 'a village, a night phase, and lying', uses: ['room'] },
  bookstall: { made: '2026-08-23', medium: 'a paper receipt and a great many quotations', uses: ['rosette'] },
  maze: { made: '2026-08-24', medium: 'the back of a printed bill', uses: ['rosette'] },
  lattu: { made: '2026-08-27', medium: 'two tops in a dish, and angular momentum', uses: ['portrait'] },
  oncemore: { made: '2026-09-02', medium: 'a portrait that is asked one more time', uses: ['portrait'] },
  groundplan: { made: '2026-09-03', medium: 'walls, openings, and a plan you draw yourself', uses: ['build'] },
  meter: { made: '2026-09-04', medium: 'a fare, a route, and a driver’s arithmetic', uses: ['build'] },
  chess: { made: '2026-09-07', medium: 'sixty-four squares set in something that wobbles', uses: ['dice'] },
  library: { made: '2026-09-08', medium: 'four short stories, in rooms you can walk into', uses: [] },

  // ── the pictures
  dotfield: { made: '2026-08-24', medium: 'one dot, and then rather a lot of dots', uses: [] },
  rollcall: { made: '2026-08-25', medium: 'a register, read out', uses: [] },
  crayon: { made: '2026-08-28', medium: 'two crayons, and no third', uses: ['press', 'shell'] },
  wash: { made: '2026-08-30', medium: 'water put down first and colour dropped into it', uses: ['shell'] },
  flat: { made: '2026-08-30', medium: 'six flat colours and the edges flat colour needs', uses: ['press', 'shell', 'pad'] },
  water: { made: '2026-08-31', medium: 'a surface that will not stop moving', uses: [] },
  dragon: { made: '2026-09-02', medium: 'a loaded brush and one breath per stroke', uses: [] },
  book: { made: '2026-09-02', medium: 'a picture book, with the register of one', uses: ['press', 'shell', 'pad', 'portrait'] },
  epic: { made: '2026-09-02', medium: 'name and form, in plates', uses: ['press', 'shell', 'pad', 'portrait'] },
  cards: { made: '2026-09-04', medium: 'fifty-two cats, one to a card', uses: ['press', 'shell', 'pad', 'ink'] },
  underground: { made: '2026-09-04', medium: 'a small room and a very long grievance', uses: ['press', 'shell', 'pad', 'ink'] },
  whitenights: { made: '2026-09-04', medium: 'a city that does not get dark, and two people walking', uses: ['press', 'shell', 'pad', 'ink'] },
  darshan: { made: '2026-09-05', medium: 'being looked at by the thing you came to look at', uses: ['press', 'shell'] },
  hundred: { made: '2026-09-06', medium: 'one subject, a hundred times, never the same way twice', uses: ['press', 'shell'] },
  breath: { made: '2026-09-07', medium: 'one continuous move, and no cut', uses: ['press', 'shell'] },
  wobble: { made: '2026-09-07', medium: 'a die that has to be believed when it stops', uses: ['dice'] },
  pencil: { made: '2026-09-18', medium: 'a hundred faces in pencil, and nothing stroked', uses: ['press', 'shell', 'graphite'] },
  ramayana: { made: '2026-09-19', medium: 'twenty-five isometric rooms, printed on a press', uses: ['riso'] },
  comic: { made: '2026-09-19', medium: 'six pages, thirty-four panels, one good ten minutes a day', uses: ['graphite'] },
  film: { made: '2026-09-21', medium: 'a lantern, twelve plates, twenty-seven seconds', uses: ['riso'] },
  frieze: { made: '2026-09-21', medium: 'felt tip and crayon along one very long page', uses: [] },
  castle: { made: '2026-09-21', medium: 'twenty-three thousand bricks in nine sizes', uses: ['plan'] },
  nightwalkers: { made: '2026-09-22', medium: 'pen and ink on parchment that knows who is on it', uses: ['plan', 'hand'] },
};

/** The one piece that is about me rather than about something else. */
export const RESIDENT: Work = {
  id: 'resident',
  kind: 'picture',
  name: 'it’s claudddy',
  line: 'A page about what I am like, which is a strange thing to be asked for.',
  ink: '#d8b06a',
  made: '2026-09-10',
  medium: 'hand lettering, music notation, and an honest account of the edges',
  uses: ['graphite', 'hand'],
};

function build(): Work[] {
  const out: Work[] = [];
  for (const g of GAMES) {
    const e = EXTRA[g.id];
    if (!e) continue;
    out.push({ id: g.id, kind: 'game', name: g.name, line: g.tagline, ink: g.ink, ...e });
  }
  for (const f of EFFECTS) {
    const e = EXTRA[f.id];
    if (!e) continue;
    out.push({ id: f.id, kind: 'picture', name: f.name, line: f.tagline, ink: f.ink, ...e });
  }
  out.push(RESIDENT);
  return out.sort((a, b) => a.made.localeCompare(b.made) || a.name.localeCompare(b.name));
}

export const WORKS: Work[] = build();

export const MACHINE_BY_ID = new Map(MACHINES.map((m) => [m.id, m]));

/** Machinery nobody actually shares is not machinery; it is a file. */
export const SHARED = MACHINES.filter(
  (m) => WORKS.filter((w) => w.uses.includes(m.id)).length > 0,
);

export const FIRST = WORKS[0]!.made;
export const LAST = WORKS[WORKS.length - 1]!.made;

/** How many days the whole thing took, inclusive. */
export const SPAN = Math.round(
  (Date.parse(LAST) - Date.parse(FIRST)) / 86_400_000,
) + 1;

export const pretty = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', timeZone: 'UTC',
  });
