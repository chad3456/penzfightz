/**
 * The shape of a chanted work, shared by the Vishnu Sahasranama and the
 * Bhagavad Gita films: sections (chapters, or the parts of the stotram), each
 * a list of verses, each verse a few chanted lines broken into syllables.
 *
 * A verse names the tableau that paints it. Neighbouring verses often share a
 * tableau, and the timeline groups them into a "run" so the painting can keep
 * moving through them instead of starting again at every verse.
 */
import { syllables, devNum } from '../ashtavakra/translit';

export interface Speaker { dev: string; en: string; who: 'krishna' | 'arjuna' | 'sanjaya' | 'dhritarashtra' | 'bhishma' | 'yudhishthira' | 'vaishampayana' | 'shiva' | 'parvati' | 'vyasa' | 'brahma' | 'other' }

/** A name of the thousand, placed inside the verse that chants it. */
export interface NameSpan { n: number; from: number; to: number; name: string; meaning: string }

export interface WVerse {
  /** Stable id: '2.47', 'S12', 'D3'. */
  id: string;
  /** Short label for the badge: 'Gita 2.47'. */
  label: string;
  /** The number as Devanagari, if it has one. */
  num?: string;
  speaker?: Speaker;
  /** Chanted lines in Devanagari, dandas removed. */
  lines: string[];
  en: string;
  scene: string;
  /** Anything the tableau wants to know about this particular verse. */
  arg?: string | number;
  kind?: 'verse' | 'colophon' | 'invocation' | 'line';
  names?: NameSpan[];
  /** The speaker is named inside the verse (as one of its lines), not chanted before it. */
  inline?: boolean;
}

export interface Section {
  key: string;
  /** Devanagari title, chanted on the section card. */
  dev: string;
  title: string;
  sub: string;
  /** What the card chants, if anything (e.g. अथ प्रथमोऽध्यायः). */
  announce?: string;
  verses: WVerse[];
}

export interface Work {
  id: 'gita' | 'vishnu';
  dev: string;
  title: string;
  sub: string;
  about: string;
  credit: string;
  sections: Section[];
  /** Seconds per mātrā. */
  matra: number;
  /** Tableau for each section card and for the close. */
  card: string;
  close: string;
}

/* ───────── syllables for display and timing ───────── */

export interface Syl { dev: string; rom: string; heavy: boolean; v: string; word: number; end: boolean }

const VOWEL = /[aāiīuūṛṝḷeo]+/;
const OM = 'ओँ';

/**
 * Syllables of one chanted line. Wraps the shared splitter, but keeps the two
 * things it drops for display: ॐ (chanted as one long syllable) and the
 * avagraha ऽ (silent, but part of the written word).
 */
export function chantSyllables(line: string): Syl[] {
  const clean = line.replace(/[‌‍]/g, '').replace(/ॐ/g, OM).replace(/\s+/g, ' ').trim();
  const raw = syllables(clean.replace(/ऽ/g, ''));
  const out: Syl[] = raw.map((s) => ({
    dev: s.dev === OM ? 'ॐ' : s.dev, rom: s.dev === OM ? 'oṃ' : s.rom,
    heavy: s.heavy, v: (s.rom.match(VOWEL)?.[0] ?? 'a'), word: s.word, end: s.end,
  }));
  // Put each avagraha back after the syllable it follows. The syllables of a
  // word spell the word with its avagrahas removed, so count the other
  // characters up to each ऽ and find the syllable that holds the last of them.
  clean.split(' ').forEach((w, wi) => {
    if (!w.includes('ऽ')) return;
    const ws = out.filter((s) => s.word === wi);
    const ends: number[] = [];
    let acc = 0;
    for (const s of ws) { acc += (s.dev === 'ॐ' ? OM : s.dev).length; ends.push(acc); }
    let n = 0;
    for (const ch of w) {
      if (ch !== 'ऽ') { n++; continue; }
      const k = Math.max(0, ends.findIndex((e) => e >= n));
      if (ws[k]) { ws[k].dev += 'ऽ'; ws[k].rom += '’'; }
    }
  });
  return out;
}

/** Take a verse as printed and return its chanted lines (speaker line removed, numbers and dandas gone). */
export function splitVerse(text: string): { speaker?: string; lines: string[] } {
  let t = text.replace(/[‌‍]/g, '').replace(/\r/g, '');
  let speaker: string | undefined;
  const first = t.split('\n')[0].trim();
  if (/उवाच$/.test(first) && t.includes('\n')) { speaker = first; t = t.split('\n').slice(1).join('\n'); }
  t = t.replace(/[।॥|]+\s*[\d०-९.]+\s*[।॥|]+/g, '॥').replace(/[\d०-९]+/g, '');
  const parts = t.split(/[\n।॥|]+/).map((x) => x.replace(/\s+/g, ' ').trim()).filter((x) => x && x !== '.');
  return { speaker, lines: parts };
}

export const dn = devNum;

/** An id-safe hash of a string, to seed a tableau's variations. */
export function seedOf(s: string) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

/* ───────── roman (IAST) to Devanagari ───────── */

const V_IND: Record<string, string> = { a: 'अ', ā: 'आ', i: 'इ', ī: 'ई', u: 'उ', ū: 'ऊ', ṛ: 'ऋ', ṝ: 'ॠ', ḷ: 'ऌ', e: 'ए', ai: 'ऐ', o: 'ओ', au: 'औ' };
const V_SIGN: Record<string, string> = { a: '', ā: 'ा', i: 'ि', ī: 'ी', u: 'ु', ū: 'ू', ṛ: 'ृ', ṝ: 'ॄ', ḷ: 'ॢ', e: 'े', ai: 'ै', o: 'ो', au: 'ौ' };
const CONS: Record<string, string> = {
  kh: 'ख', gh: 'घ', ch: 'छ', jh: 'झ', ṭh: 'ठ', ḍh: 'ढ', th: 'थ', dh: 'ध', ph: 'फ', bh: 'भ',
  k: 'क', g: 'ग', ṅ: 'ङ', c: 'च', j: 'ज', ñ: 'ञ', ṭ: 'ट', ḍ: 'ड', ṇ: 'ण', t: 'त', d: 'द', n: 'न', p: 'प', b: 'ब', m: 'म',
  y: 'य', r: 'र', l: 'ल', v: 'व', ś: 'श', ṣ: 'ष', s: 'स', h: 'ह',
};

/** Write a romanised (IAST) Sanskrit word in Devanagari: Viśvam → विश्वम्. */
export function iastToDev(s: string): string {
  const w = s.normalize('NFC').toLowerCase().replace(/-/g, '');
  let out = '', i = 0, pending = false; // pending: a consonant waiting for its vowel
  const take = (tbl: Record<string, string>) => { for (const n of [2, 1]) { const k = w.slice(i, i + n); if (tbl[k] !== undefined) { i += n; return tbl[k]; } } return undefined; };
  while (i < w.length) {
    const ch = w[i];
    if (ch === ' ') { if (pending) out += '्'; pending = false; out += ' '; i++; continue; }
    if (ch === 'ṃ') { if (pending) out += '्'; pending = false; out += 'ं'; i++; continue; }
    if (ch === 'ḥ') { if (pending) out += '्'; pending = false; out += 'ः'; i++; continue; }
    const v = take(V_SIGN);
    if (v !== undefined) { const key = w.slice(i - (v === 'ै' || v === 'ौ' ? 2 : 1), i); out += pending ? v : V_IND[key] ?? ''; pending = false; continue; }
    const c = take(CONS);
    if (c !== undefined) { if (pending) out += '्'; out += c; pending = true; continue; }
    i++; // anything else is dropped
  }
  if (pending) out += '्';
  return out;
}
