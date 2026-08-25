/**
 * A face, as thirty-nine numbers.
 *
 * Every face on the register is a point in a 39-dimensional cube. Nothing about
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
  hair: 7,
  beard: 6,
  ears: 4,
  extra: 6,
  paper: 3,
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
  'beardAmount',
  'earSize',
  'freckles',
  'tremor',
  'weight',
  'neck',
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

export function features(gn: Genome): number[] {
  const f: number[] = [];
  for (const k of CATS) {
    const n = FAMILIES[k];
    const v = cat(gn, k);
    for (let i = 0; i < n; i++) f.push(i === v ? WEIGHT[k] : 0);
  }
  for (const d of DIALS) f.push(dial(gn, d) * DIAL_WEIGHT);
  return f;
}

export function distance(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    s += d * d;
  }
  return Math.sqrt(s);
}

// ------------------------------------------------------------- novelty search

export interface SearchReport {
  /** Mean distance from each face to its nearest neighbour. Higher is better. */
  meanNearest: number;
  minNearest: number;
  /** The same figure for faces drawn at random, for comparison. */
  baselineMean: number;
  baselineMin: number;
  proposals: number;
}

/**
 * Fill a register by novelty search rather than by sampling.
 *
 * Sampling a hundred faces at random gives you a hundred faces, several of
 * which are near enough to each other that a person reading the page would
 * call them the same face twice. So each new face is not drawn, it is *found*:
 * a batch of candidates is proposed, each is scored by how far it sits from the
 * faces already on the register, the most distant one is kept, and that one is
 * then hill-climbed — mutated repeatedly, keeping any mutation that pushes it
 * further from its neighbours — until it stops improving.
 *
 * This is a plain novelty search. There is no reward model and nothing is
 * learned between runs; calling it anything grander would be dressing it up.
 * What it does do is measurable, and `report` measures it.
 */
export function buildRegister(
  count: number,
  seed: number,
  opts: { proposals?: number; climbs?: number } = {},
): { faces: Genome[]; report: SearchReport } {
  const proposals = opts.proposals ?? 48;
  const climbs = opts.climbs ?? 24;
  const r = mulberry(seed);

  const faces: Genome[] = [];
  const feats: number[][] = [];
  let proposalCount = 0;

  const novelty = (f: number[]) => {
    let best = Infinity;
    for (const other of feats) {
      const d = distance(f, other);
      if (d < best) best = d;
    }
    return best;
  };

  for (let i = 0; i < count; i++) {
    let best: Genome | null = null;
    let bestF: number[] = [];
    let bestScore = -1;

    for (let k = 0; k < proposals; k++) {
      proposalCount++;
      // Half the proposals are fresh, half are mutations of something already
      // on the register — fresh ones explore, mutations refine an outlier.
      const g =
        faces.length && k % 2 === 1
          ? mutate(faces[Math.floor(r() * faces.length)], r, 0.5)
          : randomGenome(r);
      const f = features(g);
      const s = faces.length ? novelty(f) : 1;
      if (s > bestScore) {
        bestScore = s;
        best = g;
        bestF = f;
      }
    }

    // Hill-climb the winner: keep any nudge that moves it further from its
    // nearest neighbour, and stop early once nothing helps.
    if (faces.length) {
      let stale = 0;
      for (let k = 0; k < climbs && stale < 8; k++) {
        proposalCount++;
        const g = mutate(best!, r, 0.3);
        const f = features(g);
        const s = novelty(f);
        if (s > bestScore) {
          bestScore = s;
          best = g;
          bestF = f;
          stale = 0;
        } else stale++;
      }
    }

    faces.push(best!);
    feats.push(bestF);
  }

  return { faces, report: measure(faces, count, seed, proposalCount) };
}

/** Nearest-neighbour spread, against a same-sized random register. */
function measure(faces: Genome[], count: number, seed: number, proposals: number): SearchReport {
  const nn = (fs: number[][]) => {
    const out: number[] = [];
    for (let i = 0; i < fs.length; i++) {
      let best = Infinity;
      for (let j = 0; j < fs.length; j++) {
        if (i === j) continue;
        const d = distance(fs[i], fs[j]);
        if (d < best) best = d;
      }
      out.push(best);
    }
    return out;
  };

  const mine = nn(faces.map(features));
  const rr = mulberry(seed ^ 0x9e3779b9);
  const base = nn(Array.from({ length: count }, () => features(randomGenome(rr))));
  const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

  return {
    meanNearest: mean(mine),
    minNearest: Math.min(...mine),
    baselineMean: mean(base),
    baselineMin: Math.min(...base),
    proposals,
  };
}
