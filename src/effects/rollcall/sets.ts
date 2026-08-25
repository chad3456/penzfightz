import {
  DIALS,
  FAMILIES,
  GENE_COUNT,
  type Categorical,
  type Dial,
  type Genome,
} from './genome';

/**
 * The sets.
 *
 * A set is not a different generator — every face in the building comes from
 * the same thirty-nine-odd genes and the same drawing code. A set is a *prior*:
 * it narrows which families are allowed and which range each dial may take, so
 * a corporate floor gets neat hair and lanyards and the group chat gets caps
 * and dyed fringes, without either of them being special-cased anywhere in the
 * drawing.
 *
 * That distinction is the whole point. Hard-coding eight sets of faces would be
 * eight generators to maintain and eight chances for one to look bolted on.
 * Narrowing the same distribution eight ways keeps one drawing pipeline, and
 * anything added to it shows up everywhere at once.
 */

export interface FaceSet {
  id: string;
  name: string;
  /** One line for the tab. */
  tagline: string;
  /** Which families may appear, when the set restricts them. */
  allow?: Partial<Record<Categorical, number[]>>;
  /** Ranges a dial is held to, as [min, max] in 0..1. */
  dials?: Partial<Record<Dial, [number, number]>>;
  /** Notes the persona layer draws on, keyed to the trait it noticed. */
  notes: Record<string, string[]>;
  /** Accent used by the tab and the card. */
  ink: string;
}

// Family indices, named so the sets read as intent rather than as numbers.
const HAIR = { bald: 0, tufts: 1, cap: 2, hatch: 3, curls: 4, fringe: 5, scribble: 6 };
const BEARD = { none: 0, tash: 1, curled: 2, goatee: 3, full: 4, stubble: 5 };
const SPECS = { none: 0, round: 1, square: 2, half: 3, oval: 4, monocle: 5 };
const WEAR = { none: 0, cap: 1, capBack: 2, cans: 3, hood: 4, band: 5, beanie: 6, visor: 7 };
const NECK = { none: 0, tie: 1, lanyard: 2, scarf: 3, strings: 4, chain: 5, collar: 6 };
const EXTRA = {
  none: 0, cigarette: 1, plaster: 2, earring: 3, sweat: 4,
  stud: 5, mole: 6, bindi: 7, scar: 8, freck: 9,
};

export const SETS: FaceSet[] = [
  {
    id: 'backbench',
    name: 'The Back Bench',
    tagline: 'Section B, and whoever is sitting at the back of it.',
    ink: '#1b3a8f',
    allow: { wear: [WEAR.none, WEAR.none, WEAR.band, WEAR.cap], neck: [NECK.none, NECK.none, NECK.collar] },
    dials: { hairLoud: [0, 0.2] },
    notes: {
      shaved: ['Lost a bet in the second week and never grew it back.'],
      spikes: ['A whole tin of gel and a great deal of optimism.'],
      unbrushed: ['Arrives looking as though the bus was open at the top.'],
      'eyes shut': ['Present in the register, absent in every other sense.'],
      grins: ['Cheerful in a way the staff find faintly suspicious.'],
      default: [
        'Sits in the middle row and gets away with everything.',
        'Has borrowed a pen from everyone in this room at least twice.',
        'Owns the compass. Will not lend the compass.',
      ],
    },
  },
  {
    id: 'staffroom',
    name: 'The Staffroom',
    tagline: 'Chalk on the sleeve, opinions on everything.',
    ink: '#6b4a2b',
    allow: {
      hair: [HAIR.bald, HAIR.bald, HAIR.hatch, HAIR.fringe, HAIR.curls],
      beard: [BEARD.tash, BEARD.tash, BEARD.curled, BEARD.goatee, BEARD.full, BEARD.stubble],
      specs: [SPECS.round, SPECS.square, SPECS.half, SPECS.half, SPECS.oval, SPECS.monocle],
      wear: [WEAR.none],
      neck: [NECK.tie, NECK.collar, NECK.none, NECK.scarf],
      view: [0, 0, 1],
    },
    dials: { hairInk: [0.55, 1], hairLoud: [0, 0.1], browLift: [0, 0.4] },
    notes: {
      'half-moons': ['Reads over the top of them, which is the entire point.'],
      'curled moustache': ['Twirls it during tests. Believes this helps.'],
      'full beard': ['Grew it one summer and has been asked for identification since.'],
      monocle: ['Owns one lens and the confidence of a man who owns two.'],
      default: [
        'Has a story about 1987 and will find a way in.',
        'Marks in green because red is "aggressive".',
        'Keeps a kettle in the cupboard and denies it.',
      ],
    },
  },
  {
    id: 'thirdfloor',
    name: 'The Third Floor',
    tagline: 'Lanyards, standups, and a meeting that could have been a note.',
    ink: '#2f6f6f',
    allow: {
      hair: [HAIR.cap, HAIR.hatch, HAIR.fringe, HAIR.bald, HAIR.curls],
      beard: [BEARD.none, BEARD.none, BEARD.stubble, BEARD.goatee],
      wear: [WEAR.none, WEAR.none, WEAR.none, WEAR.cans],
      neck: [NECK.lanyard, NECK.lanyard, NECK.tie, NECK.collar],
      extra: [EXTRA.none, EXTRA.none, EXTRA.sweat, EXTRA.mole],
      view: [0, 0, 1],
    },
    dials: { hairLoud: [0, 0.12], tremor: [0, 0.45], mouthCurve: [0.35, 0.75] },
    notes: {
      default: [
        'Says "circle back" and means it as a threat.',
        'Has a second monitor and a first-name basis with the facilities team.',
        'Books the room for thirty minutes and uses eleven.',
        'Replies all. Every time.',
        'Owns four identical shirts and considers this efficiency.',
      ],
    },
  },
  {
    id: 'groupchat',
    name: 'The Group Chat',
    tagline: 'Caps indoors, cans on, replying in three words or fewer.',
    ink: '#8a2f7a',
    allow: {
      hair: [HAIR.fringe, HAIR.scribble, HAIR.tufts, HAIR.curls, HAIR.cap],
      beard: [BEARD.none, BEARD.none, BEARD.none, BEARD.stubble],
      wear: [WEAR.cap, WEAR.capBack, WEAR.cans, WEAR.hood, WEAR.beanie, WEAR.none],
      neck: [NECK.chain, NECK.strings, NECK.none, NECK.none],
      extra: [EXTRA.stud, EXTRA.earring, EXTRA.none, EXTRA.none, EXTRA.mole],
      specs: [SPECS.none, SPECS.none, SPECS.square, SPECS.round],
    },
    dials: { hairLoud: [0.55, 1], eyeSize: [0.45, 1], mouthWidth: [0.1, 0.6] },
    notes: {
      default: [
        'Left you on read and then liked the message six hours later.',
        'Has opinions about a film they have watched forty seconds of.',
        'Types, stops typing, types, sends "lol".',
        'Owns headphones that have not played anything since Tuesday.',
        'Changes their display name weekly and expects you to keep up.',
      ],
    },
  },
  {
    id: 'cameo',
    name: 'Cameo',
    tagline: 'Recognisable as a type. Not as anybody.',
    ink: '#8a2b2b',
    allow: {
      hair: [HAIR.scribble, HAIR.curls, HAIR.cap, HAIR.tufts, HAIR.bald, HAIR.fringe],
      beard: [BEARD.none, BEARD.full, BEARD.tash, BEARD.goatee, BEARD.stubble],
      wear: [WEAR.none, WEAR.none, WEAR.band, WEAR.cap, WEAR.visor],
      neck: [NECK.scarf, NECK.chain, NECK.tie, NECK.none, NECK.collar],
      specs: [SPECS.none, SPECS.oval, SPECS.round, SPECS.square],
      view: [0, 1, 2],
    },
    dials: { hairLoud: [0.3, 0.9], eyeSize: [0.35, 0.95], headTilt: [0.3, 0.8] },
    notes: {
      default: [
        'Plays the same four chords and has never once had to apologise for it.',
        'Reads the nine o’clock news and has never blinked on air.',
        'Founded a company that does one thing and will explain it to you.',
        'Was in one film everybody has seen and forty nobody has.',
        'Ran for something once. Came third. Still mentions it.',
        'Presents the weather with more feeling than the weather deserves.',
      ],
    },
  },
  {
    id: 'nightbus',
    name: 'The Night Bus',
    tagline: 'Last one out, forty minutes of nobody speaking.',
    ink: '#3d4a6b',
    allow: {
      hair: [HAIR.scribble, HAIR.bald, HAIR.fringe, HAIR.tufts],
      wear: [WEAR.hood, WEAR.hood, WEAR.beanie, WEAR.cans, WEAR.none],
      neck: [NECK.strings, NECK.scarf, NECK.none],
      eye: [4, 5, 5, 0, 2],
      beard: [BEARD.stubble, BEARD.stubble, BEARD.none, BEARD.goatee],
      paper: [0, 0, 1],
    },
    dials: { browLift: [0, 0.3], mouthCurve: [0, 0.35], skin: [0.4, 0.95], tremor: [0.4, 1] },
    notes: {
      default: [
        'Has been awake for nineteen hours and it is beginning to show.',
        'Missed the earlier one on purpose.',
        'Knows exactly which stop without ever looking up.',
        'Fell asleep at the window and woke at the terminus. Again.',
      ],
    },
  },
  {
    id: 'committee',
    name: 'The Committee',
    tagline: 'Nine people, one microphone, no decision.',
    ink: '#5a4a1f',
    allow: {
      hair: [HAIR.bald, HAIR.bald, HAIR.hatch, HAIR.fringe],
      beard: [BEARD.tash, BEARD.curled, BEARD.full, BEARD.none],
      specs: [SPECS.square, SPECS.half, SPECS.round, SPECS.none],
      wear: [WEAR.none],
      neck: [NECK.tie, NECK.tie, NECK.collar],
      brow: [2, 2, 4, 1],
      mouth: [0, 4, 6, 7],
      view: [0, 0, 1],
    },
    dials: { hairInk: [0.6, 1], hairLoud: [0, 0.08], mouthCurve: [0, 0.3] },
    notes: {
      default: [
        'Would like it minuted that he objected.',
        'Has read the appendix and wants everybody to know.',
        'Proposes a subcommittee to look into the subcommittee.',
        'Arrived with an agenda in both senses.',
      ],
    },
  },
  {
    id: 'fieldtrip',
    name: 'The Field Trip',
    tagline: 'Two coaches, one head count, somebody already lost a cap.',
    ink: '#2f7a3f',
    allow: {
      head: [0, 3, 4, 6, 6],
      hair: [HAIR.tufts, HAIR.curls, HAIR.fringe, HAIR.scribble, HAIR.cap],
      beard: [BEARD.none],
      wear: [WEAR.cap, WEAR.capBack, WEAR.none, WEAR.band, WEAR.visor],
      neck: [NECK.none, NECK.strings, NECK.collar],
      mouth: [1, 3, 3, 2, 5],
      eye: [0, 1, 1, 6, 2],
    },
    dials: { eyeSize: [0.5, 1], eyeGap: [0.3, 0.9], hairLoud: [0.1, 0.7], browLift: [0.4, 1] },
    notes: {
      default: [
        'Asked "are we nearly there" before the coach had moved.',
        'Has eaten the packed lunch. It is nine fifteen.',
        'Lost the cap at the first stop and found somebody else’s.',
        'Holds the worksheet the entire day and fills in nothing.',
      ],
    },
  },
];

export const SET_BY_ID = Object.fromEntries(SETS.map((s) => [s.id, s])) as Record<string, FaceSet>;

const CATS = Object.keys(FAMILIES) as Categorical[];

/**
 * Draw a genome from a set's prior.
 *
 * A restricted family is chosen from its allow-list — with repeats in the list
 * acting as weights, which is why `hair: [bald, bald, hatch]` gives twice as
 * many bald heads as hatched ones — and then converted back into the 0..1 gene
 * the rest of the system expects, so nothing downstream needs to know a set was
 * involved.
 */
export function sampleGenome(set: FaceSet, r: () => number): Genome {
  const g: number[] = new Array(GENE_COUNT);
  CATS.forEach((k, i) => {
    const allow = set.allow?.[k];
    if (allow && allow.length) {
      const choice = allow[Math.floor(r() * allow.length)];
      // Land in the middle of that family's slice so rounding cannot drift.
      g[i] = (choice + 0.5) / FAMILIES[k];
    } else {
      g[i] = r();
    }
  });
  DIALS.forEach((d, i) => {
    const range = set.dials?.[d];
    g[CATS.length + i] = range ? range[0] + r() * (range[1] - range[0]) : r();
  });
  return { g };
}

/** Mutate without escaping the set's prior. */
export function mutateWithin(set: FaceSet, gn: Genome, r: () => number, amount = 0.25): Genome {
  const fresh = sampleGenome(set, r);
  const g = gn.g.slice();
  for (let i = 0; i < g.length; i++) {
    const categorical = i < CATS.length;
    if (categorical) {
      if (r() < amount * 0.6) g[i] = fresh.g[i];
    } else if (r() < 0.5) {
      // Drift towards a fresh in-range value rather than off in a straight
      // line, so a dial the set has pinned cannot wander out of its band.
      g[i] = g[i] + (fresh.g[i] - g[i]) * amount * (0.5 + r());
    }
  }
  return { g };
}
