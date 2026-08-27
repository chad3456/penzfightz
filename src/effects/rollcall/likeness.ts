import {
  DIALS,
  FAMILIES,
  GENE_COUNT,
  PINNED,
  SPECIES_MASK,
  mulberry,
  type Categorical,
  type Dial,
  type Genome,
} from './genome';

/**
 * Caricatures.
 *
 * Eleven public figures, hand-authored rather than searched for. Everything
 * else in this project is found by an optimiser; these are set by hand, because
 * a caricature is an argument about which two or three things about a face
 * everybody already carries in their head, and no distance metric knows that.
 *
 * What is actually encoded here is a **visual signature**, not a likeness. The
 * medium cannot do likeness — forty-four doodle genes resolve to a shape, a
 * tone and a couple of props, and that is all. What they can do is what a
 * newspaper cartoonist does with four strokes: rimless circles and a black
 * roll-neck, or a side parting and large square frames. If it reads, it reads
 * because of the props and the proportions, and if it does not, no amount of
 * fiddling with the eye gap will rescue it.
 *
 * On the legal shape of this, since it is a fair question. A fictional
 * character is copyright; a real person's face is not, but real people are
 * protected by personality rights, which is a different body of law and one
 * that is actively enforced — in India especially. Those rights are aimed at
 * unauthorised commercial use and false endorsement, not at caricature, which
 * is why editorial cartoonists draw heads of government every morning. These
 * are non-commercial, plainly stylised, labelled as caricature, and carry no
 * suggestion that anybody endorses anything. The notes below stay on visual
 * signature and away from commentary.
 */

const CATS = Object.keys(FAMILIES) as Categorical[];

type Gene = Partial<Record<Categorical, number>> & Partial<Record<Dial, number>>;

const isCat = (k: string): k is Categorical => (CATS as string[]).includes(k);

/** Build a genome: named genes as given, everything else from the seed. */
function make(seed: number, genes: Gene): Genome {
  const r = mulberry(seed);
  // Everything a person does not draw is pinned, exactly as `sampleGenome`
  // pins it — otherwise a caricature would carry a random petal count into the
  // distance metric and read as further from everyone than it is.
  const mask = SPECIES_MASK[0];
  const g: number[] = Array.from({ length: GENE_COUNT }, (_, i) => (mask[i] ? r() : PINNED));
  g[CATS.indexOf('species')] = 0.5 / FAMILIES.species;
  for (const [k, v] of Object.entries(genes)) {
    if (v === undefined) continue;
    if (isCat(k)) g[CATS.indexOf(k)] = (v + 0.5) / FAMILIES[k];
    else g[CATS.length + DIALS.indexOf(k as Dial)] = Math.max(0, Math.min(1, v));
  }
  return { g };
}

// Family indices, named for readability.
const HEAD = { egg: 0, pear: 1, top: 2, diamond: 3, square: 4, tall: 5, wide: 6 };
const HAIR = { bald: 0, tufts: 1, cap: 2, hatch: 3, curls: 4, fringe: 5, scribble: 6, coils: 7, locs: 8, bun: 9, long: 10 };
const BEARD = { none: 0, tash: 1, curled: 2, goatee: 3, full: 4, stubble: 5 };
const SPECS = { none: 0, round: 1, square: 2, half: 3, oval: 4, monocle: 5 };
const EYE = { dot: 0, ring: 1, oval: 2, box: 3, closed: 4, lidded: 5, wide: 6 };
const MOUTH = { line: 0, arc: 1, oval: 2, grin: 3, bar: 4, zig: 5, filled: 6, wry: 7 };
const NECK = { none: 0, tie: 1, lanyard: 2, scarf: 3, strings: 4, chain: 5, collar: 6, roll: 7 };
const BROW = { none: 0, level: 1, angled: 2, raised: 3, knit: 4 };

export interface Likeness {
  id: string;
  name: string;
  /** The two or three things the caricature is actually built out of. */
  signature: string;
  genome: Genome;
}

/**
 * Tone is the position on the twelve-step ramp, 0 fair to 1 deep. Hair ink runs
 * 0 blackest to 1 palest, so grey and white sit near the top of that range.
 */
export const LIKENESSES: Likeness[] = [
  {
    id: 'jobs',
    name: 'Steve Jobs',
    signature: 'Rimless circles, a shaved-close crown, a black roll-neck.',
    genome: make(101, {
      kingdom: 0, paper: 1, view: 0, head: HEAD.egg,
      skin: 0.1, headWidth: 0.4, headHeight: 0.62,
      hair: HAIR.bald, hairAmount: 0.5, hairInk: 0.92, hairLoud: 0,
      beard: BEARD.stubble, beardAmount: 0.3,
      specs: SPECS.round, specSize: 0.2,
      eye: EYE.ring, eyeSize: 0.4, eyeGap: 0.45, brow: BROW.level,
      mouth: MOUTH.line, mouthWidth: 0.4,
      neck: NECK.roll, neckLen: 0.7, wear: 0, extra: 0, ears: 0,
    }),
  },
  {
    id: 'gates',
    name: 'Bill Gates',
    signature: 'A side parting, large square frames, and nothing else at all.',
    genome: make(102, {
      kingdom: 0, paper: 1, view: 0, head: HEAD.egg,
      skin: 0.08, headWidth: 0.45, headHeight: 0.55,
      hair: HAIR.fringe, hairAmount: 0.42, hairInk: 0.66, hairLoud: 0,
      beard: BEARD.none,
      specs: SPECS.square, specSize: 0.75,
      eye: EYE.dot, eyeSize: 0.3, eyeGap: 0.5, brow: BROW.raised, browLift: 0.6,
      mouth: MOUTH.arc, mouthWidth: 0.45, mouthCurve: 0.75,
      neck: NECK.collar, wear: 0, extra: 0, ears: 0,
    }),
  },
  {
    id: 'rdj',
    name: 'Robert Downey Jr.',
    signature: 'The goatee, swept dark hair, and a brow that is always mid-remark.',
    genome: make(103, {
      kingdom: 0, paper: 1, view: 0, head: HEAD.square,
      skin: 0.22, headWidth: 0.5, headHeight: 0.5,
      hair: HAIR.scribble, hairAmount: 0.55, hairInk: 0.15, hairLoud: 0,
      beard: BEARD.goatee, beardAmount: 0.6,
      specs: SPECS.none,
      eye: EYE.lidded, eyeSize: 0.42, eyeGap: 0.48, brow: BROW.angled, browLift: 0.35,
      mouth: MOUTH.line, mouthWidth: 0.42,
      neck: NECK.collar, wear: 0, extra: 0, ears: 0,
    }),
  },
  {
    id: 'dicaprio',
    name: 'Leonardo DiCaprio',
    signature: 'The beard era: full jaw, swept fair hair, a level stare.',
    genome: make(104, {
      kingdom: 0, paper: 1, view: 0, head: HEAD.square,
      skin: 0.1, headWidth: 0.55, headHeight: 0.45,
      hair: HAIR.cap, hairAmount: 0.45, hairInk: 0.68, hairLoud: 0,
      beard: BEARD.full, beardAmount: 0.6,
      specs: SPECS.none,
      eye: EYE.lidded, eyeSize: 0.36, eyeGap: 0.5, brow: BROW.level,
      mouth: MOUTH.line, mouthWidth: 0.42,
      neck: NECK.collar, wear: 0, extra: 0, ears: 0,
    }),
  },
  {
    id: 'johansson',
    name: 'Scarlett Johansson',
    signature: 'A blunt fair bob, wide-set eyes, a full mouth.',
    genome: make(105, {
      kingdom: 0, paper: 1, view: 0, head: HEAD.egg,
      skin: 0.06, headWidth: 0.48, headHeight: 0.52,
      hair: HAIR.long, hairAmount: 0.36, hairInk: 0.78, hairLoud: 0,
      beard: BEARD.none,
      specs: SPECS.none,
      eye: EYE.oval, eyeSize: 0.6, eyeGap: 0.62, brow: BROW.level,
      mouth: MOUTH.filled, mouthWidth: 0.4,
      neck: NECK.none, wear: 0, extra: 0, ears: 3,
    }),
  },
  {
    id: 'kruger',
    name: 'Diane Kruger',
    signature: 'Long fair hair, a narrow face, a small precise mouth.',
    genome: make(106, {
      kingdom: 0, paper: 1, view: 0, head: HEAD.tall,
      skin: 0.05, headWidth: 0.35, headHeight: 0.68,
      hair: HAIR.long, hairAmount: 0.5, hairInk: 0.82, hairLoud: 0,
      beard: BEARD.none,
      specs: SPECS.none,
      eye: EYE.oval, eyeSize: 0.45, eyeGap: 0.5, brow: BROW.level,
      mouth: MOUTH.bar, mouthWidth: 0.3,
      neck: NECK.none, wear: 0, extra: 0, ears: 3,
    }),
  },
  {
    id: 'salman',
    name: 'Salman Khan',
    signature: 'Cropped black hair, a heavy jaw, the chain.',
    genome: make(107, {
      kingdom: 0, paper: 1, view: 0, head: HEAD.square,
      skin: 0.34, headWidth: 0.62, headHeight: 0.42,
      hair: HAIR.cap, hairAmount: 0.3, hairInk: 0.05, hairLoud: 0,
      beard: BEARD.stubble, beardAmount: 0.42,
      specs: SPECS.none,
      eye: EYE.lidded, eyeSize: 0.38, eyeGap: 0.46, brow: BROW.angled, browLift: 0.3,
      mouth: MOUTH.line, mouthWidth: 0.46,
      neck: NECK.chain, wear: 0, extra: 0, ears: 0,
    }),
  },
  {
    id: 'aishwarya',
    name: 'Aishwarya Rai',
    signature: 'Long dark hair and the eyes, which are the whole caricature.',
    genome: make(108, {
      kingdom: 0, paper: 1, view: 0, head: HEAD.egg,
      skin: 0.16, headWidth: 0.42, headHeight: 0.6,
      hair: HAIR.long, hairAmount: 0.55, hairInk: 0.06, hairLoud: 0,
      beard: BEARD.none,
      specs: SPECS.none,
      eye: EYE.ring, eyeSize: 0.8, eyeGap: 0.55, pupil: 0.5, brow: BROW.raised, browLift: 0.55,
      mouth: MOUTH.arc, mouthWidth: 0.36, mouthCurve: 0.7,
      neck: NECK.none, wear: 0, extra: 0, ears: 3,
    }),
  },
  {
    id: 'srk',
    name: 'Shah Rukh Khan',
    signature: 'The hair, a close beard, and both arms permanently open.',
    genome: make(109, {
      kingdom: 0, paper: 1, view: 0, head: HEAD.egg,
      skin: 0.3, headWidth: 0.46, headHeight: 0.56,
      hair: HAIR.scribble, hairAmount: 0.68, hairInk: 0.1, hairLoud: 0,
      beard: BEARD.stubble, beardAmount: 0.48,
      specs: SPECS.none,
      eye: EYE.lidded, eyeSize: 0.44, eyeGap: 0.47, brow: BROW.angled, browLift: 0.4,
      mouth: MOUTH.grin, mouthWidth: 0.55, mouthCurve: 0.85,
      neck: NECK.collar, wear: 0, extra: 0, ears: 0,
    }),
  },
  {
    id: 'katrina',
    name: 'Katrina Kaif',
    signature: 'Long brown hair, a fair tone, a level unbothered mouth.',
    genome: make(110, {
      kingdom: 0, paper: 1, view: 0, head: HEAD.egg,
      skin: 0.12, headWidth: 0.44, headHeight: 0.58,
      hair: HAIR.long, hairAmount: 0.52, hairInk: 0.3, hairLoud: 0,
      beard: BEARD.none,
      specs: SPECS.none,
      eye: EYE.oval, eyeSize: 0.58, eyeGap: 0.53, brow: BROW.level,
      mouth: MOUTH.line, mouthWidth: 0.38,
      neck: NECK.none, wear: 0, extra: 0, ears: 3,
    }),
  },
  {
    id: 'modi',
    name: 'Narendra Modi',
    signature: 'A full white beard, white hair at the sides, square frames.',
    genome: make(111, {
      kingdom: 0, paper: 1, view: 0, head: HEAD.egg,
      skin: 0.3, headWidth: 0.5, headHeight: 0.55,
      hair: HAIR.fringe, hairAmount: 0.3, hairInk: 1.0, hairLoud: 0,
      beard: BEARD.full, beardAmount: 0.85,
      specs: SPECS.square, specSize: 0.5,
      eye: EYE.lidded, eyeSize: 0.36, eyeGap: 0.48, brow: BROW.level,
      mouth: MOUTH.line, mouthWidth: 0.4,
      neck: NECK.collar, wear: 0, extra: 0, ears: 0,
    }),
  },
];
