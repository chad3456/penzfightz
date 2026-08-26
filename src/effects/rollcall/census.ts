import { distance, features, mulberry, type Genome } from './genome';
import { SETS, mutateWithin, sampleGenome, type FaceSet } from './sets';
import { LIKENESSES } from './likeness';

/**
 * Building a census of a thousand.
 *
 * At a hundred faces you can score a candidate against every face already
 * seated. At a thousand that is a quadratic climb — a thousand faces at fifty
 * proposals each would run about twenty-five million distance calculations over
 * ninety-odd dimensions, which is seconds of blocked main thread for a result
 * nobody can see the difference in.
 *
 * So novelty is estimated from a bounded sample of the neighbours rather than
 * all of them: everyone from the same set, capped, plus a spread of the rest.
 * That is an approximation and it is worth being honest that it is one — but
 * the thing being approximated is "how close is the nearest face", and the
 * nearest face is overwhelmingly likely to be in the same set and in the
 * sample. The report at the end measures the real spread over the whole
 * census, not the sampled one, so the number quoted is not the number the
 * search optimised against.
 */

export interface Seat {
  genome: Genome;
  set: FaceSet;
  /** Index within the whole census. */
  index: number;
  /** Set only for the hand-authored caricatures. */
  likeness?: { id: string; name: string; signature: string };
}

export interface CensusReport {
  count: number;
  meanNearest: number;
  minNearest: number;
  baselineMean: number;
  baselineMin: number;
  /** The same figures restricted to pairs inside one set, where crowding lives. */
  withinMean: number;
  withinMin: number;
  baselineWithinMin: number;
  proposals: number;
  ms: number;
}

/**
 * How many of the others a candidate is scored against.
 *
 * The first version of this capped the same-set comparison at the most recent
 * ninety, which left the earliest faces in a set invisible to every later
 * candidate — and hill-climbing promptly found that blind spot and drove
 * straight into it. Measured exhaustively, the search was producing a *worse*
 * spread than no search at all: a closest pair of 0.26 against 2.11 for faces
 * drawn straight from the prior.
 *
 * So the same-set comparison is now complete. A set is only a few hundred
 * faces, the nearest neighbour is nearly always inside it, and there is no
 * point optimising against a number that is not the one being reported.
 */
const OTHER_CAP = 80;

export function buildCensus(
  perSet: number,
  seed: number,
  opts: { proposals?: number; climbs?: number } = {},
): { seats: Seat[]; report: CensusReport } {
  const proposals = opts.proposals ?? 40;
  const climbs = opts.climbs ?? 14;
  const r = mulberry(seed);
  const t0 = Date.now();

  const seats: Seat[] = [];
  const feats: number[][] = [];
  /** Feature rows grouped by set, so the sample can be drawn where it matters. */
  const bySet = new Map<string, number[]>();
  let proposalCount = 0;

  const novelty = (f: number[], setId: string) => {
    let best = Infinity;
    const mine = bySet.get(setId) ?? [];
    for (let i = 0; i < mine.length; i++) {
      const d = distance(f, feats[mine[i]]);
      if (d < best) best = d;
    }
    // A thin spread across everyone else, so two sets cannot converge unnoticed.
    const step = Math.max(1, Math.floor(feats.length / OTHER_CAP));
    for (let i = 0; i < feats.length; i += step) {
      const d = distance(f, feats[i]);
      if (d < best) best = d;
    }
    return best;
  };

  // Searched sets first, hand-authored ones last, whatever order SETS is in.
  // `feats` runs parallel to `seats` only for searched faces, and processing a
  // fixed set in the middle would silently misalign every index after it.
  const ordered = [...SETS.filter((x) => !x.fixed), ...SETS.filter((x) => x.fixed)];
  for (const set of ordered) {
    if (set.fixed) {
      // Hand-authored seats. Nothing to search for, and nothing to measure
      // against — including them in the spread figures would compare a made
      // thing to a found one.
      for (const l of LIKENESSES) {
        seats.push({ genome: l.genome, set, index: seats.length, likeness: l });
      }
      continue;
    }
    for (let n = 0; n < perSet; n++) {
      let best: Genome | null = null;
      let bestF: number[] = [];
      let bestScore = -1;
      const mine = bySet.get(set.id) ?? [];

      for (let k = 0; k < proposals; k++) {
        proposalCount++;
        const g =
          mine.length && k % 2 === 1
            ? mutateWithin(set, seats[mine[Math.floor(r() * mine.length)]].genome, r, 0.6)
            : sampleGenome(set, r);
        const f = features(g);
        const s = feats.length ? novelty(f, set.id) : 1;
        if (s > bestScore) {
          bestScore = s;
          best = g;
          bestF = f;
        }
      }

      if (feats.length) {
        let stale = 0;
        for (let k = 0; k < climbs && stale < 6; k++) {
          proposalCount++;
          const g = mutateWithin(set, best!, r, 0.35);
          const f = features(g);
          const s = novelty(f, set.id);
          if (s > bestScore) {
            bestScore = s;
            best = g;
            bestF = f;
            stale = 0;
          } else stale++;
        }
      }

      const index = seats.length;
      seats.push({ genome: best!, set, index });
      feats.push(bestF);
      if (!bySet.has(set.id)) bySet.set(set.id, []);
      bySet.get(set.id)!.push(index);
    }
  }

  return {
    seats,
    report: measure(seats, feats, seed, proposalCount, Date.now() - t0),
  };
}

/**
 * The real spread, over every pair.
 *
 * Deliberately exhaustive even though the search was not: a figure produced by
 * the same shortcut the optimiser used would be marking its own homework. A
 * thousand faces is half a million pairs, which is a second of honest work.
 */
function measure(
  seats: Seat[],
  feats: number[][],
  seed: number,
  proposals: number,
  ms: number,
): CensusReport {
  const nearest = (fs: number[][]) => {
    const out = new Array(fs.length).fill(Infinity);
    for (let i = 0; i < fs.length; i++) {
      for (let j = i + 1; j < fs.length; j++) {
        const d = distance(fs[i], fs[j]);
        if (d < out[i]) out[i] = d;
        if (d < out[j]) out[j] = d;
      }
    }
    return out;
  };

  const mine = nearest(feats);
  // The same census drawn straight from each set's prior, no search at all.
  const rr = mulberry(seed ^ 0x9e3779b9);
  const base: number[][] = [];
  const searched = SETS.filter((x) => !x.fixed);
  const perSet = Math.round(feats.length / Math.max(1, searched.length));
  for (const set of searched)
    for (let i = 0; i < perSet; i++) base.push(features(sampleGenome(set, rr)));
  const bn = nearest(base);

  // Nearest neighbour restricted to the same set.
  const withinNearest = (fs: number[][]) => {
    const out = new Array(fs.length).fill(Infinity);
    const nSets = SETS.filter((x) => !x.fixed).length;
    const per = fs.length / Math.max(1, nSets);
    for (let s = 0; s < nSets; s++) {
      const a = s * per;
      const b = a + per;
      for (let i = a; i < b; i++)
        for (let j = i + 1; j < b; j++) {
          const d = distance(fs[i], fs[j]);
          if (d < out[i]) out[i] = d;
          if (d < out[j]) out[j] = d;
        }
    }
    return out;
  };
  const win = withinNearest(feats);
  const bwin = withinNearest(base);

  const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
  return {
    count: seats.length,
    meanNearest: mean(mine),
    minNearest: Math.min(...mine),
    baselineMean: mean(bn),
    baselineMin: Math.min(...bn),
    withinMean: mean(win),
    withinMin: Math.min(...win),
    baselineWithinMin: Math.min(...bwin),
    proposals,
    ms,
  };
}
