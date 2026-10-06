/**
 * The film's clock. Every word lasts as long as its syllables weigh (a light
 * syllable one mātrā, a heavy one two), scaled so that each chaupai foot
 * fills sixteen mātrās and each doha foot its thirteen or eleven — the metre
 * Tulsidas wrote in. A chaupai takes three cycles of an eight-beat keherwa;
 * dohas are sung freer and slower.
 */
import { syllables } from '../ashtavakra/translit';
import { VERSES, type Verse } from './text';

export const MATRA = 0.25;          // seconds per mātrā in a chaupai
export const DOHA_MATRA = 0.3;      // dohas are sung slower
export interface WordT { start: number; dur: number; syl: { start: number; dur: number; heavy: boolean; v: string }[] }
export interface CharanT { start: number; dur: number; words: WordT[]; matras: number }
export interface Segment { scene: string; start: number; dur: number; verse?: Verse; charans: CharanT[]; kind: 'title' | 'doha' | 'chaupai' | 'end' }

/** Vowel of a romanised syllable, used to colour the melody a little. */
const VOWEL = /[aāiīuūeoṛ]+/;

function wordSyls(d: string) {
  const s = syllables(d.replace(/-/g, ''));
  return s.length ? s : [{ dev: d, rom: d, heavy: false, end: true, word: 0 }];
}

function charanTimes(words: { d: string }[], start: number, target: number, m: number): CharanT {
  const ws = words.map((w) => wordSyls(w.d));
  const raw = ws.reduce((a, s) => a + s.reduce((b, y) => b + (y.heavy ? 2 : 1), 0), 0) || 1;
  const k = (target * m) / raw;
  let t = start;
  const out: WordT[] = ws.map((ss) => {
    const w: WordT = { start: t, dur: 0, syl: [] };
    for (const y of ss) { const d = (y.heavy ? 2 : 1) * k; w.syl.push({ start: t, dur: d, heavy: y.heavy, v: (y.rom.match(VOWEL)?.[0] ?? 'a') }); t += d; }
    w.dur = t - w.start;
    return w;
  });
  return { start, dur: target * m, words: out, matras: raw };
}

export function buildTimeline() {
  const segs: Segment[] = [];
  let T = 0;
  segs.push({ scene: 'title', start: 0, dur: 9, charans: [], kind: 'title' }); T = 9;
  for (const v of VERSES) {
    const cs: CharanT[] = [];
    if (v.kind === 'chaupai') {
      const lead = 2.0, gap = 0;
      let t = lead;
      v.charans.forEach((w) => { cs.push(charanTimes(w, t, 16, MATRA)); t += 16 * MATRA + gap; });
      const dur = t + 2.0;
      segs.push({ scene: v.scene, start: T, dur, verse: v, charans: cs, kind: 'chaupai' }); T += dur;
    } else {
      const lead = 2.2;
      let t = lead;
      const target = [13, 11, 13, 11];
      v.charans.forEach((w, i) => { cs.push(charanTimes(w, t, target[i], DOHA_MATRA)); t += target[i] * DOHA_MATRA + (i === 1 ? 0.9 : 0.45); });
      const dur = t + 2.4;
      segs.push({ scene: v.scene, start: T, dur, verse: v, charans: cs, kind: 'doha' }); T += dur;
    }
  }
  segs.push({ scene: 'end', start: T, dur: 14, charans: [], kind: 'end' }); T += 14;
  return { segs, total: T };
}
export const TL = buildTimeline();

export function segAt(T: number) {
  const s = TL.segs;
  let lo = 0, hi = s.length - 1;
  while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (s[mid].start <= T) lo = mid; else hi = mid - 1; }
  return lo;
}
