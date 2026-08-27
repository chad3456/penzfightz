/**
 * A face, as forty-six numbers.
 *
 * Every face on the register is a point in a 46-dimensional cube. Nothing about
 * a face is stored as a picture, a sprite or a chosen preset — the genome is
 * the whole of it, and the drawing code is a pure function from these numbers
 * to ink on paper.
 *
 * The genes are deliberately of two kinds. Categorical genes pick a family —
 * which silhouette, which sort of eye, whether there are spectacles — and
 * behave like switches. Continuous genes size and place things and behave like
 * dials. They are treated differently when measuring how far apart two faces
 * are, because two faces with different sorts of eye are further apart than two
 * faces with the same eye at slightly different sizes, however close their raw
 * numbers happen to sit.
 */

// ------------------------------------------------------------------- the genes

/** Categorical genes: gene index -> how many families it selects between. */
export const FAMILIES = {
  head: 7,
  view: 3,
  eye: 7,
  brow: 5,
  specs: 6,
  nose: 6,
  mouth: 8,
  hair: 11,
  beard: 6,
  /** 0-3 are human ears; 4-7 are pointed, floppy, round and tufted. */
  ears: 8,
  extra: 10,
  paper: 4,
  /** Worn on the head: caps, headphones, hoods. */
  wear: 8,
  /** Worn at the neck: a tie, a lanyard, a chain, hoodie strings. */
  neck: 8,
  /**
   * Human or creature. Every human set pins this to 0; only the menagerie
   * opens it, so a committee member cannot sprout a beak by accident.
   */
  kingdom: 2,
  /**
   * A snout, when there is one. 0-4 are the mammal and bird jaws: none, short,
   * long, beak, broad. 5-7 are the cold-blooded ones — a crocodile's flat
   * tooth-lined snout, a fish's pursed ring of a mouth, and a shark's gape.
   */
  muzzle: 8,
  /** Whiskers, and how many. Doubles as a catfish's barbels. */
  whisker: 3,
  /**
   * Fins, gills and crests. Gated on `kingdom` exactly as the animal ears are:
   * widening a family without a switch in front of it is how the committee
   * ended up in cat ears the first time.
   */
  fin: 5,

  // ------------------------------------------------- what is being drawn

  /**
   * What this genome *is*: 0 somebody, 1 a bloom, 2 a piece of kit.
   *
   * The same argument as `kingdom`, one level up. A flower is not a second
   * generator — it is the same forty-numbers-to-ink pipeline, the same novelty
   * search, the same atlas and the same instanced card, reading a different
   * handful of the genes. Every set pins this, and `sampleGenome` pins every
   * family the chosen species does not draw, so the search never spends its
   * budget optimising a petal count on a bank manager.
   */
  species: 3,

  // --------------------------------------------------------- blooms only

  /** Petal outline: round, lance, heart, spoon, ragged, spike, trumpet, quill. */
  petal: 8,
  /** What sits in the middle: disc, spiral, button, stamens, seed grid, open. */
  centre: 6,
  /** Stem: straight, curved, crooked, cut short. */
  stem: 4,
  /** Leaves: none, a pair, one, a whorl, a sheath. */
  leaf: 5,

  // ------------------------------------------------------------ kit only

  /**
   * Which piece of equipment. Twelve, and every one of them drawn rather than
   * looked up: pencil, ballpoint, fountain pen, ruler, eraser, sharpener,
   * compass, protractor, scissors, glue stick, chalk, brush.
   */
  tool: 12,
  /** How it is finished: plain, banded, striped, dotted, two-tone, chewed. */
  livery: 6,
} as const;

export type Categorical = keyof typeof FAMILIES;

/** Continuous genes: dials, all 0..1. */
export const DIALS = [
  'headWidth',
  'headHeight',
  'headLump',
  'headTilt',
  'skin',
  'washOffX',
  'washOffY',
  'washScale',
  'washSeed',
  'eyeSize',
  'eyeSkew', // how much the two eyes disagree
  'eyeGap',
  'eyeHeight',
  'pupil',
  'browLift',
  'specSize',
  'noseSize',
  'mouthWidth',
  'mouthCurve',
  'hairAmount',
  'hairInk',
  'hairLoud',
  'beardAmount',
  'earSize',
  'freckles',
  'tremor',
  'weight',
  'neckLen',

  // Blooms.
  'petals',
  'petalLen',
  'petalInk',
  'centreSize',
  'bloomTilt',
  'stemLen',
  'stemBend',
  'leafSize',

  // Kit.
  'toolLen',
  'toolInk',
  'toolWear',
] as const;

export type Dial = (typeof DIALS)[number];

const CATS = Object.keys(FAMILIES) as Categorical[];
export const GENE_COUNT = CATS.length + DIALS.length;

export interface Genome {
  /** All genes, 0..1. Categoricals occupy the first CATS.length slots. */
  g: number[];
}

export const cat = (gn: Genome, k: Categorical): number => {
  const i = CATS.indexOf(k);
  return Math.min(FAMILIES[k] - 1, Math.floor(gn.g[i] * FAMILIES[k]));
};

export const dial = (gn: Genome, k: Dial): number => gn.g[CATS.length + DIALS.indexOf(k)];

// -------------------------------------------------------------- what draws what

/**
 * Which genes each species actually reads.
 *
 * Everything not listed here is pinned to a constant when a genome is sampled.
 * That matters for more than tidiness: novelty search rewards *difference*, and
 * an unpinned gene is free difference. Two identical bank managers whose
 * unrendered petal counts happen to disagree would score as far apart, and the
 * optimiser would happily bank that instead of doing its job. Pinning them all
 * to one value makes invisible genes contribute exactly nothing to the metric,
 * so the whole search budget goes on things you can see.
 */
export const SPECIES_CATS: Categorical[][] = [
  [
    'species', 'head', 'view', 'eye', 'brow', 'specs', 'nose', 'mouth', 'hair',
    'beard', 'ears', 'extra', 'paper', 'wear', 'neck', 'kingdom', 'muzzle',
    'whisker', 'fin',
  ],
  ['species', 'petal', 'centre', 'stem', 'leaf', 'paper'],
  ['species', 'tool', 'livery', 'paper'],
];

export const SPECIES_DIALS: Dial[][] = [
  [
    'headWidth', 'headHeight', 'headLump', 'headTilt', 'skin', 'washOffX',
    'washOffY', 'washScale', 'washSeed', 'eyeSize', 'eyeSkew', 'eyeGap',
    'eyeHeight', 'pupil', 'browLift', 'specSize', 'noseSize', 'mouthWidth',
    'mouthCurve', 'hairAmount', 'hairInk', 'hairLoud', 'beardAmount', 'earSize',
    'freckles', 'tremor', 'weight', 'neckLen',
  ],
  [
    'petals', 'petalLen', 'petalInk', 'centreSize', 'bloomTilt', 'stemLen',
    'stemBend', 'leafSize', 'headWidth', 'headHeight', 'skin', 'washOffX',
    'washOffY', 'washScale', 'washSeed', 'tremor', 'weight',
  ],
  [
    'toolLen', 'toolInk', 'toolWear', 'headWidth', 'headTilt', 'skin',
    'washOffX', 'washOffY', 'washScale', 'washSeed', 'tremor', 'weight',
  ],
];

/** The value every unread gene is held at. Any constant would do; this one is mid-range. */
export const PINNED = 0.5;

/** Gene indices this species reads. Built once, not per sample. */
export const SPECIES_MASK: boolean[][] = SPECIES_CATS.map((cats, i) => {
  const mask = new Array<boolean>(GENE_COUNT).fill(false);
  for (const k of cats) mask[CATS.indexOf(k)] = true;
  for (const d of SPECIES_DIALS[i]) mask[CATS.length + DIALS.indexOf(d)] = true;
  return mask;
});

// ------------------------------------------------------------------ randomness

/** Deterministic PRNG, so a register can be rebuilt exactly from its seed. */
export function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const randomGenome = (r: () => number): Genome => ({
  g: Array.from({ length: GENE_COUNT }, () => r()),
});

/**
 * Nudge a genome.
 *
 * Dials drift; families jump. A small mutation rate on the categoricals keeps
 * a mutated face recognisably related to its parent while still letting the
 * search reach a different sort of face when it needs one.
 */
export function mutate(gn: Genome, r: () => number, amount = 0.18): Genome {
  const g = gn.g.slice();
  for (let i = 0; i < g.length; i++) {
    const categorical = i < CATS.length;
    if (categorical) {
      if (r() < amount * 0.55) g[i] = r();
    } else if (r() < 0.5) {
      g[i] = Math.min(1, Math.max(0, g[i] + (r() - 0.5) * amount * 2));
    }
  }
  return { g };
}

// -------------------------------------------------------------- face distance

/**
 * How different do two faces look?
 *
 * Categoricals become one-hot blocks, so changing the sort of eye moves you a
 * fixed distance rather than a distance that happens to depend on which two
 * sorts they were. Dials go in scaled down, because a slightly wider mouth is
 * a much smaller change than a beard appearing.
 *
 * The weights are not uniform: what you notice first about one of these faces
 * is its outline and whether it has hair, spectacles or a beard, so those count
 * for more than the exact gap between the eyes.
 */
const WEIGHT: Record<Categorical, number> = {
  // Nothing separates two genomes like being different sorts of thing.
  species: 3.0,
  petal: 1.7,
  centre: 1.3,
  stem: 0.7,
  leaf: 0.9,
  tool: 2.2,
  livery: 1.0,
  fin: 1.4,
  wear: 1.4,
  neck: 1.0,
  kingdom: 2.2,
  muzzle: 1.5,
  whisker: 0.7,
  head: 1.5,
  view: 1.2,
  eye: 1.1,
  brow: 0.7,
  specs: 1.3,
  nose: 0.8,
  mouth: 0.9,
  hair: 1.6,
  beard: 1.3,
  ears: 0.5,
  extra: 1.0,
  paper: 0.4,
};

const DIAL_WEIGHT = 0.45;

/**
 * A genome, in the form the distance metric actually wants.
 *
 * The first version of this expanded every categorical into a one-hot block and
 * measured Euclidean distance over the lot — a hundred and sixty numbers, of
 * which about twenty-five were ever non-zero. That is a lot of multiplying by
 * zero, and the census measures every pair exhaustively, so it was being paid
 * two and a half million times.
 *
 * It is also unnecessary. A one-hot block contributes nothing when the two
 * faces share a family and exactly `2·w²` when they do not — there is no third
 * case — so the whole block collapses to one comparison and one add. Sixty-four
 * numbers replace a hundred and sixty, the arithmetic is identical to the last
 * bit, and the categorical half of the metric stops touching floating point at
 * all.
 */
export interface Traits {
  /** One family index per categorical gene. */
  c: Uint8Array;
  /** Dials, pre-multiplied by their weight so the metric is a plain difference. */
  d: Float32Array;
}

/** `2·w²` per categorical: what a family disagreement costs, squared. */
const CAT_COST = new Float32Array(CATS.map((k) => 2 * WEIGHT[k] * WEIGHT[k]));

export function traits(gn: Genome): Traits {
  const c = new Uint8Array(CATS.length);
  for (let i = 0; i < CATS.length; i++) c[i] = cat(gn, CATS[i]);
  const d = new Float32Array(DIALS.length);
  for (let i = 0; i < DIALS.length; i++) d[i] = gn.g[CATS.length + i] * DIAL_WEIGHT;
  return { c, d };
}

/**
 * Squared distance, with a cutoff.
 *
 * Squared, because every caller is looking for a *minimum* and the square root
 * is monotonic — it can be taken once at the end rather than a million times in
 * the middle. The cutoff is the current best: once the running total passes it
 * this pair cannot win, and the remaining terms are not worth adding. On a
 * nearest-neighbour sweep most pairs are eliminated inside the categorical
 * loop, several genes in.
 */
export function dist2(a: Traits, b: Traits, cutoff = Infinity): number {
  const ac = a.c;
  const bc = b.c;
  let s = 0;
  for (let i = 0; i < ac.length; i++) {
    if (ac[i] !== bc[i]) {
      s += CAT_COST[i];
      if (s >= cutoff) return s;
    }
  }
  const ad = a.d;
  const bd = b.d;
  const n = ad.length;
  for (let i = 0; i < n; i++) {
    const t = ad[i] - bd[i];
    s += t * t;
  }
  return s;
}

/** The same thing, unsquared, for anything that is going to be read by a person. */
export const distance = (a: Traits, b: Traits): number => Math.sqrt(dist2(a, b));
