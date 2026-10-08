/**
 * What a tableau is told each frame. The same idea as the Chalisa's beat —
 * time into the verse, progress through each chanted line — plus where we are
 * in a run of verses that share the painting, and, in the Sahasranama, which
 * of the verse's names is being chanted.
 */
import { clamp } from '../chalisa/kit';
import type { Seg, Timeline } from './time';
import type { WVerse } from './work';

export interface Beat {
  /** Seconds since this verse (or card) began, its length, and 0 → 1 across it. */
  t: number; d: number; p: number;
  /** Progress through each of the verse's own lines (the speaker's line excluded). */
  c: number[];
  /** The verse line being chanted, −1 between lines, −2 while the speaker is named. */
  li: number;
  /** Syllable being chanted, counted across the verse's lines; −1 between. */
  sk: number;
  /** Name of the thousand being chanted (index into verse.names), and how far through it. */
  ni: number; nf: number;
  /** Progress through each name: 0 before it starts, 1 once it is done. */
  nc: number[];
  v?: WVerse;
  seg: Seg;
  /** The run of verses sharing this tableau: seconds since it began, this verse's place in it, its length. */
  run: { t: number; i: number; n: number; d: number; p: number };
  arg?: string | number;
  /** A clock that never resets, for things that should drift continuously. */
  T: number;
}
export type Scene = (g: CanvasRenderingContext2D, b: Beat) => void;

export function beatFor(tl: Timeline, si: number, t: number): Beat {
  const seg = tl.segs[si];
  const own = seg.lines.filter((l) => !l.speaker);
  const c = own.map((l) => clamp((t - l.start) / l.dur));
  let li = -1, sk = -1, off = 0;
  const spk = seg.lines.find((l) => l.speaker);
  if (spk && t >= spk.start && t < spk.start + spk.dur) li = -2;
  own.forEach((l, i) => {
    if (t >= l.start && t < l.start + l.dur) {
      li = i;
      const k = l.syl.findIndex((s) => t >= s.start && t < s.start + s.dur);
      if (k >= 0) sk = off + k;
    }
    off += l.syl.length;
  });
  // names: map the syllable clock onto each name's span
  const names = seg.verse?.names ?? [];
  let ni = -1, nf = 0;
  const flat = own.flatMap((l) => l.syl);
  const nc = names.map((nm, i) => {
    const a = flat[nm.from], z = flat[Math.min(flat.length - 1, nm.to - 1)];
    if (!a || !z) return 0;
    const s0 = a.start, s1 = z.start + z.dur;
    const f = clamp((t - s0) / Math.max(0.01, s1 - s0));
    if (t >= s0 && t < s1) { ni = i; nf = f; }
    return f;
  });
  const runT = seg.start + t - seg.run.start;
  return {
    t, d: seg.dur, p: clamp(t / seg.dur), c, li, sk, ni, nf, nc, v: seg.verse, seg,
    run: { t: runT, i: seg.run.i, n: seg.run.n, d: seg.run.dur, p: clamp(runT / seg.run.dur) },
    arg: seg.verse?.arg, T: seg.start + t,
  };
}

/** Progress through line i with an optional lead-in, for staging. */
export const at = (b: Beat, i: number, lead = 0) => clamp((b.c[i] ?? 0) + lead);
