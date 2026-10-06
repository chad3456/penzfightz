/**
 * Devanagari → IAST, and the shape of a verse's breath: its syllables, each
 * light (laghu, one mātrā) or heavy (guru, two). A syllable is heavy when its
 * vowel is long, when it carries anusvāra or visarga, or when two or more
 * consonants follow before the next vowel. The last syllable of a quarter is
 * marked as it falls; prosodists treat it as either.
 */

const V: Record<string, string> = { 'अ': 'a', 'आ': 'ā', 'इ': 'i', 'ई': 'ī', 'उ': 'u', 'ऊ': 'ū', 'ऋ': 'ṛ', 'ॠ': 'ṝ', 'ऌ': 'ḷ', 'ए': 'e', 'ऐ': 'ai', 'ओ': 'o', 'औ': 'au' };
const M: Record<string, string> = { 'ा': 'ā', 'ि': 'i', 'ी': 'ī', 'ु': 'u', 'ू': 'ū', 'ृ': 'ṛ', 'ॄ': 'ṝ', 'ॢ': 'ḷ', 'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au' };
const C: Record<string, string> = {
  'क': 'k', 'ख': 'kh', 'ग': 'g', 'घ': 'gh', 'ङ': 'ṅ', 'च': 'c', 'छ': 'ch', 'ज': 'j', 'झ': 'jh', 'ञ': 'ñ',
  'ट': 'ṭ', 'ठ': 'ṭh', 'ड': 'ḍ', 'ढ': 'ḍh', 'ण': 'ṇ', 'त': 't', 'थ': 'th', 'द': 'd', 'ध': 'dh', 'न': 'n',
  'प': 'p', 'फ': 'ph', 'ब': 'b', 'भ': 'bh', 'म': 'm', 'य': 'y', 'र': 'r', 'ल': 'l', 'व': 'v', 'श': 'ś', 'ष': 'ṣ', 'स': 's', 'ह': 'h', 'ळ': 'ḷ',
};
const LONG = new Set(['ā', 'ī', 'ū', 'ṝ', 'e', 'ai', 'o', 'au']);
const VIRAMA = '्', ANUS = 'ं', VISARGA = 'ः', CANDRA = 'ँ', AVAGRAHA = 'ऽ', NUKTA = '़';

type Tok = { t: 'C'; v: string; dev: string } | { t: 'V'; v: string; dev: string } | { t: 'M'; v: string; dev: string } | { t: 'S'; v: string; dev: string };

/** Phoneme-level tokens: consonants (no inherent vowel), vowels, marks (ṃ ḥ), separators. */
function tokens(s: string): Tok[] {
  const out: Tok[] = [];
  const chars = [...s];
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    if (C[ch]) {
      let dev = ch;
      let j = i + 1;
      if (chars[j] === NUKTA) { dev += chars[j]; j++; }
      out.push({ t: 'C', v: C[ch], dev });
      const nx = chars[j];
      if (nx === VIRAMA) { out[out.length - 1].dev += nx; i = j; continue; }
      if (nx && M[nx]) { out.push({ t: 'V', v: M[nx], dev: nx }); i = j; continue; }
      out.push({ t: 'V', v: 'a', dev: '' });
      i = j - 1;
      continue;
    }
    if (V[ch]) { out.push({ t: 'V', v: V[ch], dev: ch }); continue; }
    if (ch === ANUS || ch === CANDRA) { out.push({ t: 'M', v: 'ṃ', dev: ch }); continue; }
    if (ch === VISARGA) { out.push({ t: 'M', v: 'ḥ', dev: ch }); continue; }
    if (ch === AVAGRAHA) { out.push({ t: 'S', v: '’', dev: ch }); continue; }
    if (ch === '।') { out.push({ t: 'S', v: ' |', dev: ch }); continue; }
    if (ch === '॥') { out.push({ t: 'S', v: ' ||', dev: ch }); continue; }
    if (ch === VIRAMA) continue;
    out.push({ t: 'S', v: ch, dev: ch });
  }
  return out;
}

export function iast(s: string) {
  return tokens(s).map((t) => t.v).join('').replace(/\s+/g, ' ').trim();
}

export interface Syl { dev: string; rom: string; heavy: boolean; end: boolean; word: number }

/**
 * Syllables of one half-verse (or any line): each with its Devanagari text,
 * IAST, weight, and whether it ends a word.
 */
export function syllables(line: string): Syl[] {
  const tk = tokens(line);
  // group: onset consonants + vowel + (marks); coda consonants go to the syllable when no vowel follows in the word
  const out: Syl[] = [];
  let i = 0, word = 0;
  let pendC: Tok[] = [];
  while (i < tk.length) {
    const t = tk[i];
    if (t.t === 'S') {
      if (/\s|\||॥|।/.test(t.dev)) {
        if (pendC.length && out.length) { const s = out[out.length - 1]; s.dev += pendC.map((c) => c.dev).join(''); s.rom += pendC.map((c) => c.v).join(''); pendC = []; }
        if (out.length) out[out.length - 1].end = true;
        word++;
      } else if (t.dev === AVAGRAHA) { /* elided a: nothing to count */ }
      i++; continue;
    }
    if (t.t === 'C') { pendC.push(t); i++; continue; }
    if (t.t === 'V') {
      const s: Syl = { dev: pendC.map((c) => c.dev).join('') + t.dev, rom: pendC.map((c) => c.v).join('') + t.v, heavy: LONG.has(t.v), end: false, word };
      pendC = [];
      i++;
      while (i < tk.length && tk[i].t === 'M') { s.dev += tk[i].dev; s.rom += tk[i].v; s.heavy = true; i++; }
      out.push(s);
      continue;
    }
    i++;
  }
  if (pendC.length && out.length) { const s = out[out.length - 1]; s.dev += pendC.map((c) => c.dev).join(''); s.rom += pendC.map((c) => c.v).join(''); }
  // position: a short vowel followed by two or more consonants is heavy
  for (let k = 0; k < out.length - 1; k++) {
    if (out[k].heavy) continue;
    const next = out[k + 1];
    const onset = (next.rom.match(/^[^aāiīuūṛṝḷeo]+/)?.[0] ?? '');
    // count consonant phonemes in the onset (kh, gh … are single)
    const n = onset.replace(/(kh|gh|ch|jh|ṭh|ḍh|th|dh|ph|bh)/g, 'X').length;
    const coda = (out[k].rom.match(/[^aāiīuūṛṝḷeoṃḥ]+$/)?.[0] ?? '').replace(/(kh|gh|ch|jh|ṭh|ḍh|th|dh|ph|bh)/g, 'X').length;
    if (n + coda >= 2) out[k].heavy = true;
  }
  if (out.length) out[out.length - 1].end = true;
  return out;
}

const DIG = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
export const devNum = (n: number | string) => String(n).replace(/[0-9]/g, (d) => DIG[+d]);
