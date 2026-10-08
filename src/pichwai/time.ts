/**
 * The film's clock for a whole chanted work. A light syllable takes one
 * mātrā and a heavy one two, so an anuṣṭubh line falls into the long-short
 * swing it is chanted in. Each section opens on a card that announces it;
 * each verse has a breath before it, its speaker's line if the speaker
 * changes, its half-verses with a short pause between, and a breath after.
 */
import { chantSyllables, type Section, type Work, type WVerse } from './work';

export interface SylT { dev: string; rom: string; heavy: boolean; v: string; word: number; end: boolean; start: number; dur: number; k: number }
export interface LineT { start: number; dur: number; syl: SylT[]; speaker?: boolean; dev: string }
export interface Run { start: number; dur: number; i: number; n: number }

export interface Seg {
  kind: 'card' | 'verse' | 'close';
  start: number; dur: number;
  sec: number;        // section index
  vi: number;         // verse index within the section (−1 for a card)
  gi: number;         // verse index across the whole work (−1 for a card)
  verse?: WVerse;
  lines: LineT[];
  scene: string;
  run: Run;
}

export interface Timeline {
  segs: Seg[];
  total: number;
  sections: { start: number; dur: number; first: number; last: number }[];
  /** Segment index of every verse, by global verse index. */
  verseSeg: number[];
}

function lineTimes(dev: string, at: number, m: number, speaker = false): LineT {
  const ss = chantSyllables(dev);
  let t = at;
  const syl: SylT[] = ss.map((s, k) => {
    // a speaker's line is spoken a little quicker than the verse
    const d = (s.heavy ? 2 : 1) * m * (speaker ? 0.85 : 1);
    const o: SylT = { ...s, start: t, dur: d, k };
    t += d;
    return o;
  });
  return { start: at, dur: t - at, syl, speaker, dev };
}

export function buildTimeline(work: Work): Timeline {
  const m = work.matra;
  const segs: Seg[] = [];
  const sections: Timeline['sections'] = [];
  const verseSeg: number[] = [];
  let T = 0, gi = 0;

  const card = (sec: number, s: Section) => {
    const lines: LineT[] = [];
    let t = 2.4;
    if (s.announce) for (const a of s.announce.split('\n')) { const L = lineTimes(a, t, m * 1.05); lines.push(L); t += L.dur + 0.5; }
    const dur = Math.max(8, t + 2.2);
    segs.push({ kind: 'card', start: T, dur, sec, vi: -1, gi: -1, lines, scene: work.card, run: { start: T, dur, i: 0, n: 1 } });
    T += dur;
  };

  work.sections.forEach((s, si) => {
    const first = segs.length, start = T;
    card(si, s);
    let lastWho = '';
    s.verses.forEach((v, vi) => {
      const lines: LineT[] = [];
      let t = 1.0;
      // the speaker's line is chanted whenever the voice changes
      if (v.speaker && v.speaker.dev !== lastWho && !v.inline) {
        const L = lineTimes(v.speaker.dev, t, m, true);
        lines.push(L); t += L.dur + 0.45;
      }
      if (v.speaker) lastWho = v.speaker.dev;
      v.lines.forEach((ln, li) => {
        // a speaker named inside the verse ("अर्जुन उवाच") is styled as one
        const L = lineTimes(ln, t, m, /उवाच$/.test(ln.trim()));
        lines.push(L);
        const mid = v.lines.length >= 4 && li === Math.floor(v.lines.length / 2) - 1;
        t += L.dur + (li === v.lines.length - 1 ? 0 : mid ? 0.55 : 0.3);
      });
      const dur = t + (v.kind === 'colophon' ? 2.4 : 1.5);
      verseSeg[gi] = segs.length;
      segs.push({ kind: 'verse', start: T, dur, sec: si, vi, gi, verse: v, lines, scene: v.scene, run: { start: T, dur, i: 0, n: 1 } });
      T += dur; gi++;
    });
    sections.push({ start, dur: T - start, first, last: segs.length - 1 });
  });
  const closeDur = 16;
  segs.push({ kind: 'close', start: T, dur: closeDur, sec: work.sections.length - 1, vi: -1, gi: -1, lines: [], scene: work.close, run: { start: T, dur: closeDur, i: 0, n: 1 } });
  T += closeDur;

  // runs: neighbours inside a section that share a tableau
  let i = 0;
  while (i < segs.length) {
    let j = i;
    while (j + 1 < segs.length && segs[j + 1].kind === 'verse' && segs[i].kind === 'verse' && segs[j + 1].scene === segs[i].scene && segs[j + 1].sec === segs[i].sec) j++;
    const start = segs[i].start, dur = segs[j].start + segs[j].dur - start;
    for (let k = i; k <= j; k++) segs[k].run = { start, dur, i: k - i, n: j - i + 1 };
    i = j + 1;
  }
  return { segs, total: T, sections, verseSeg };
}

export function segAt(tl: Timeline, T: number) {
  const s = tl.segs;
  let lo = 0, hi = s.length - 1;
  while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (s[mid].start <= T) lo = mid; else hi = mid - 1; }
  return lo;
}
