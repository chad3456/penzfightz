/**
 * The Vishnu Sahasranama as a chanted work: the opening (pūrva-bhāga), the
 * meditation verses (dhyāna), the stotram of a thousand names, and the
 * closing (phalaśruti). The Sanskrit comes from the repo's existing text
 * (MIT-licensed hindu-devotional-texts, Shankara's recension); the meanings
 * of the names are the ones already written for the Sahasranama page. The
 * English of the other verses is a new translation made for this film.
 *
 * Each name is placed inside the shloka that chants it by walking the
 * shloka's syllables and finding the stem of each name in turn, so the film
 * can light the name, show its meaning and draw its emblem at the moment it
 * is sung.
 */
import { STOTRAM } from '../sahasranama/data';
import { MEANINGS } from '../sahasranama/meanings';
import { chantSyllables, splitVerse, dn, type Speaker, type WVerse, type Work, type NameSpan } from '../pichwai/work';

/* ───────── translations of the verses that are not names ───────── */

const PURVA_EN: Record<number, string> = {
  0: 'Om, salutation to the Supreme Self. Bowing to Narayana, to Nara, best of men, to the goddess Sarasvati and to Vyasa, let one then recite the song of victory.',
  1: 'Om. Here begins the hymn of the thousand names of Sri Vishnu, the giver of every good fortune. Hari Om.',
  2: 'Clad in white, all-pervading, bright as the moon, four-armed, his face serene: let one meditate on him, so that every obstacle is stilled.',
  3: 'His attendants, a hundred and more, led by the elephant-faced one, forever strike down every obstacle: I take refuge in him, Vishvaksena.',
  4: 'I bow to Vyasa, great-grandson of Vasishtha, grandson of Shakti, son of Parashara, father of Shuka, the stainless one, a treasury of austerity.',
  5: 'Salutation to Vyasa, who is Vishnu in form, and to Vishnu, who is Vyasa in form; salutation again and again to Vasishtha’s descendant, treasury of the Veda.',
  6: 'To the unchanging, the pure, the eternal, the supreme Self, ever one in form, to Vishnu, victorious over all —',
  7: '— by merely remembering whom one is freed from the bondage of birth and the round of the world: salutation to Vishnu, the all-mighty.',
  8: 'Om, salutation to Vishnu, the all-mighty.',
  10: 'Having heard every law of dharma and all the purifying teachings, Yudhishthira again addressed the son of Shantanu.',
  12: 'Who is the one god in the world? What is the one highest refuge? Praising whom, worshipping whom, may human beings reach the good?',
  13: 'What, in your judgement, is the highest of all dharmas? By chanting what is a living being freed from the bondage of birth and the round of the world?',
  15: 'The lord of the world, the god of gods, the infinite, the supreme person: one who praises him with the thousand names, ever awake to him,',
  16: 'and worships that imperishable person every day with devotion, meditating on him, praising him, bowing to him, offering to him alone,',
  17: 'praising daily Vishnu, without beginning or end, great lord of all the worlds, overseer of the world — that one passes beyond all sorrow.',
  18: 'He is dear to the knowers of Brahman, the knower of all dharma, who makes the glory of the worlds grow, lord of the worlds, the great being, the source from which all beings arise.',
  19: 'This, to my mind, is the greatest dharma of all: that a person should worship the lotus-eyed one always, with devotion and with hymns.',
  20: 'He who is the supreme, great light; the supreme, great austerity; the supreme, great Brahman; the supreme refuge;',
  21: 'the purity of all that purifies, the blessing of all that blesses, the god of the gods, the imperishable father of all beings;',
  22: 'from whom all beings come forth at the dawn of the first age, and into whom they return in dissolution at the end of the age —',
  23: 'of him, foremost of the worlds, lord of the universe, hear from me, O king, the thousand names of Vishnu, which drive away sin and fear.',
  24: 'The names of the great-souled one that tell of his qualities, renowned, sung by the sages — those I shall now tell, for the good of all.',
  25: 'The seer of the thousand names is Veda Vyasa, the great sage; the metre is anushtubh; the deity is the blessed son of Devaki.',
  26: 'The seed is he who was born of the race of the moon; the power, the joy of Devaki; the heart, the Trisaman. It is chanted for peace.',
  27: 'Vishnu, the victorious, great Vishnu, the all-mighty, the great lord, who ended demons of many forms: I bow to the supreme person.',
};
const DHYANA_EN: Record<number, string> = {
  0: 'On the shore of the ocean of milk, on sands bright with pure gems, seated on a throne of garlanded pearls, his body adorned with pearls clear as crystal, beneath white clouds that hang above him raining nectar — may that joyful Mukunda, holding discus, lotus, mace and conch, make us pure.',
  1: 'The earth his feet, the sky his navel, the wind his breath, the moon and the sun his eyes, the four quarters his ears, heaven his head, fire his mouth, the ocean his abode; within him the whole universe — gods, men, birds, cattle, serpents, gandharvas and daityas — plays in wonder. I bow to Vishnu, the Lord whose body is the three worlds.',
  2: 'Om, salutation to the blessed Vasudeva.',
  3: 'Peace in his form, lying on the serpent, the lotus at his navel, lord of the gods, support of the universe, vast as the sky, the colour of a cloud, beautiful in every limb, beloved of Lakshmi, lotus-eyed, reached by yogis in meditation: I bow to Vishnu, who takes away the fear of the world, the one lord of all the worlds.',
  4: 'Dark as a rain cloud, clothed in yellow silk, marked with the Srivatsa, his body lit by the Kaustubha jewel, full of grace, his eyes long as lotus petals: I bow to Vishnu, the one lord of all the worlds.',
  5: 'Salutation to him who is the first of all beings, the bearer of the earth, whose form is every form: to Vishnu, the all-mighty.',
  6: 'With conch and discus, with crown and earrings, in yellow robes, lotus-eyed, the Kaustubha bright on his garlanded chest, four-armed: to Vishnu I bow my head.',
  7: 'In the shade of the parijata tree, on a golden lion-throne, seated, dark as a rain cloud, long-eyed, adorned, moon-faced, four-armed, the Srivatsa on his chest, with Rukmini and Satyabhama beside him: in Krishna I take refuge.',
};
const PHALA_EN: Record<number, string> = {
  1: 'Thus have the thousand divine names of great-souled Keshava, who is worthy of all praise, been told in full.',
  2: 'Whoever hears this every day, and whoever sings it, meets with nothing inauspicious, here or hereafter.',
  3: 'The brahmin reaches the end of the Veda; the warrior becomes victorious; the merchant grows rich; the labourer finds happiness.',
  4: 'One who seeks dharma gains dharma; one who seeks wealth gains wealth; one who desires gains his desires; one who longs for children gains children.',
  5: 'The devotee who rises early, pure, his mind set on him, and recites these thousand names of Vasudeva —',
  6: 'gains wide fame and the first place among his kin; he gains a fortune that does not waver, and the highest good.',
  7: 'He knows fear nowhere; he gains strength and radiance; he is free of disease, luminous, endowed with strength, beauty and virtue.',
  8: 'The sick are freed from sickness, the bound from their bonds; the frightened are freed from fear, and one in danger from danger.',
  9: 'The person who praises the supreme person with the thousand names, always full of devotion, swiftly crosses every hardship.',
  10: 'The mortal whose shelter is Vasudeva, whose goal is Vasudeva, his self cleansed of all sin, goes to the eternal Brahman.',
  11: 'For the devotees of Vasudeva nothing inauspicious exists anywhere; the fear of birth, death, old age and disease does not arise.',
  12: 'One who studies this hymn with faith and devotion is joined with the joy of the Self, with patience, fortune, steadiness, memory and good name.',
  13: 'No anger, no envy, no greed, no evil thought comes to those of good deeds who are devoted to the supreme person.',
  14: 'Heaven with its moon, sun and stars, the sky, the quarters, the earth and the great ocean are held in place by the power of great-souled Vasudeva.',
  15: 'This whole world, moving and unmoving, with its gods, demons and gandharvas, its yakshas, serpents and rakshasas, stands within the power of Krishna.',
  16: 'The senses, the mind, the intellect, goodness, energy, strength and steadiness, the field and the knower of the field — all of these, they say, have Vasudeva for their self.',
  17: 'Of all the scriptures, good conduct is set down first; dharma is born of good conduct, and the lord of dharma is Achyuta.',
  18: 'The sages, the ancestors, the gods, the great elements, the substances — this whole world, moving and unmoving, has come from Narayana.',
  19: 'Yoga, knowledge and Sankhya, the sciences, the arts and crafts, the Vedas, the scriptures and all understanding: all of it is from Janardana.',
  20: 'Vishnu is one, the great being, appearing as many separate beings; pervading the three worlds, the Self of all beings, the imperishable enjoys the universe.',
  21: 'This hymn to the blessed Vishnu, sung by Vyasa, should be recited by anyone who wishes to reach the highest good and happiness.',
  22: 'Those who worship the lotus-eyed god, lord of the universe, unborn, the imperishable master of the world, never meet defeat.',
  23: 'They never meet defeat. Om, salutation.',
  25: 'O you whose eyes are wide as lotus petals, lotus-navelled, best of the gods, Janardana: be the protector of your devoted, loving followers.',
  26: 'Whoever wishes to praise me with the thousand names, O son of Pandu — by a single verse I am praised by him; there is no doubt of it.',
  27: 'I am praised indeed, there is no doubt. Om, salutation.',
  29: 'Because Vasudeva dwells in them, the three worlds are his dwelling; you are the dwelling of all beings, Vasudeva — salutation to you.',
  30: 'Sri Vasudeva, salutation to you. Om, salutation.',
  31: 'By what easy means do the learned recite the thousand names of Vishnu every day? I wish to hear it, my lord.',
  33: '“Sri Rama, Rama, Rama” — so I delight in Rama, the delight of the heart. The name of Rama, O lovely one, is equal to the thousand names.',
  34: 'The name of Rama, O lovely one. Om, salutation.',
  35: 'Salutation to the infinite one of a thousand forms, a thousand feet, eyes, heads, thighs and arms; to the eternal person of a thousand names, who bears the ages by thousands of millions — salutation.',
  36: 'Who bears the ages by thousands of millions — salutation. Om, salutation.',
  37: 'Om Tat Sat. Thus, in the glorious Mahabharata of a hundred thousand verses, the collection of Vyasa, in the Book of Instruction, in the dialogue of Bhishma and Yudhishthira: the hymn of the thousand divine names of Sri Vishnu.',
  39: 'Wherever there is Krishna, lord of yoga, wherever there is Arjuna, the archer, there are fortune, victory, prosperity and steadfast justice: that is my conviction.',
  40: 'Those who worship me, thinking of nothing else, ever joined to me — I bring them what they lack and keep what they have.',
  41: 'To protect the good, to destroy the wicked, to set dharma firm again, I come into being, age after age.',
  42: 'The afflicted, the despairing, the weak and the frightened, those caught in terrible illness — singing only the word “Narayana”, they are freed from sorrow and become happy.',
  43: 'Whatever I do — with body, speech or mind, with the senses, the intellect or the self, or by the bent of my nature — all of it I offer to the supreme, to Narayana.',
  44: 'Thus ends the hymn of the thousand divine names of Sri Vishnu. Om Tat Sat.',
};

const SPEAKERS: Record<string, Speaker> = {
  'श्रीवैशम्पायन उवाच': { dev: 'श्रीवैशम्पायन उवाच', en: 'Vaishampayana said', who: 'vaishampayana' },
  'युधिष्ठिर उवाच': { dev: 'युधिष्ठिर उवाच', en: 'Yudhishthira said', who: 'yudhishthira' },
  'भीष्म उवाच': { dev: 'भीष्म उवाच', en: 'Bhishma said', who: 'bhishma' },
  'अर्जुन उवाच': { dev: 'अर्जुन उवाच', en: 'Arjuna said', who: 'arjuna' },
  'व्यास उवाच': { dev: 'व्यास उवाच', en: 'Vyasa said', who: 'vyasa' },
  'ईश्वर उवाच': { dev: 'ईश्वर उवाच', en: 'Shiva said', who: 'shiva' },
  'सञ्जय उवाच': { dev: 'सञ्जय उवाच', en: 'Sanjaya said', who: 'sanjaya' },
  'श्रीभगवानुवाच': { dev: 'श्रीभगवानुवाच', en: 'Krishna said', who: 'krishna' },
  'पार्वत्युवाच': { dev: 'पार्वत्युवाच', en: 'Parvati said', who: 'parvati' },
  'ब्रह्मोवाच': { dev: 'ब्रह्मोवाच', en: 'Brahma said', who: 'brahma' },
};

/* ───────── which painting goes with which verse ───────── */

const PURVA_SCENE: Record<number, [string, number?]> = {
  0: ['v-invoke'], 1: ['v-invoke', 1], 2: ['v-shukla'], 3: ['v-vishvaksena'], 4: ['v-vyasa'], 5: ['v-vyasa', 1], 6: ['v-vyasa', 2], 7: ['v-vyasa', 2], 8: ['v-vyasa', 2],
  10: ['v-arrows', 0], 12: ['v-arrows', 1], 13: ['v-arrows', 1], 15: ['v-arrows', 2], 16: ['v-arrows', 2], 17: ['v-arrows', 2], 18: ['v-arrows', 3], 19: ['v-arrows', 3],
  20: ['v-light'], 21: ['v-light', 1], 22: ['v-dissolve'], 23: ['v-arrows', 4], 24: ['v-arrows', 4], 25: ['v-nyasa', 0], 26: ['v-nyasa', 1], 27: ['v-nyasa', 2],
};
const DHYANA_SCENE: [string, number?][] = [['d-milk'], ['d-cosmic'], ['d-om'], ['d-shesha'], ['d-cloud'], ['d-cloud', 1], ['d-chaturbhuja'], ['d-parijata']];
const PHALA_SCENE: Record<number, [string, number?]> = {
  1: ['p-close', 0], 2: ['p-close', 0], 3: ['p-four', 0], 4: ['p-four', 1], 5: ['p-dawn'], 6: ['p-dawn', 1], 7: ['p-boons', 0], 8: ['p-boons', 1], 9: ['p-boons', 2],
  10: ['p-refuge'], 11: ['p-refuge', 1], 12: ['p-refuge', 2], 13: ['p-refuge', 3], 14: ['p-held'], 15: ['p-held', 1], 16: ['p-held', 2], 17: ['p-held', 3], 18: ['p-from'], 19: ['p-from', 1], 20: ['p-from', 2],
  21: ['p-vyasa'], 22: ['p-vyasa', 1], 23: ['p-vyasa', 1], 25: ['p-arjuna'], 26: ['p-arjuna', 1], 27: ['p-arjuna', 1], 29: ['p-vasudeva'], 30: ['p-vasudeva'],
  31: ['p-kailasa', 0], 33: ['p-kailasa', 1], 34: ['p-kailasa', 1], 35: ['p-brahma'], 36: ['p-brahma'], 37: ['p-colophon'], 39: ['p-yatra'], 40: ['p-yoga'], 41: ['p-yuge'], 42: ['p-narayana'], 43: ['p-offer'], 44: ['p-end'],
};

/* ───────── placing the names ───────── */

/** Fold a romanised string down to letters only, for matching. */
const fold = (s: string) => s.toLowerCase().replace(/[^a-zāīūṛṝḷṅñṭḍṇśṣṃḥ]/g, '');

/**
 * Sandhi changes the edges of words (sat + asat → sadasat, viśvam → viśvaṃ),
 * so match on a skeleton where voiced and unvoiced stops, and the nasals,
 * count as the same letter. One letter in, one letter out, so positions in
 * the skeleton are positions in the syllable stream.
 */
const SKEL: Record<string, string> = { d: 't', g: 'k', b: 'p', j: 'c', ḍ: 'ṭ', ṃ: 'm', ṅ: 'n', ñ: 'n', ṇ: 'n', ś: 's', ṣ: 's' };
/**
 * The skeleton of a romanised string, with a map back to positions in the
 * original. Visarga is dropped, since sandhi turns it into s, r or o.
 */
function skelMap(s: string): { k: string; at: number[] } {
  let k = ''; const at: number[] = [];
  [...s].forEach((c, i) => {
    if (c === 'ḥ') return;
    const m = SKEL[c] ?? c;
    k += m; at.push(i);
  });
  return { k, at };
}
const skel = (s: string) => skelMap(s).k;

/** The stem we look for: the name without its case ending or its last letter, which sandhi may change. */
function stem(name: string) {
  const f = skel(fold(name).replace(/(aḥ|āḥ|iḥ|īḥ|uḥ|ūḥ|ḥ|ṃ|m)$/, ''));
  return f.length > 3 ? f.slice(0, -1) : f;
}

/** How many names had to be placed by their neighbours (for checking). */
export let namesSkipped = 0;

/**
 * Walk the stotram verses in order, find each of the thousand names in turn
 * and record which syllables it covers. A name that cannot be found (a
 * reading that differs) is given a share of the next name's place rather than
 * stalling the rest.
 */
export function placeNames(verses: { lines: string[] }[]): NameSpan[][] {
  const out: NameSpan[][] = verses.map(() => []);
  const W = 26;
  let n = 0;
  verses.forEach((v, vi) => {
    const syl = v.lines.flatMap((l) => chantSyllables(l));
    const starts: number[] = []; let raw = '';
    syl.forEach((s) => { starts.push(raw.length); raw += fold(s.rom); });
    const { k: acc, at } = skelMap(raw);
    const sylAt = (pos: number) => { const r = at[Math.min(pos, at.length - 1)] ?? 0; let k = 0; while (k + 1 < starts.length && starts[k + 1] <= r) k++; return k; };
    const find = (m: number, cur: number) => {
      if (m >= MEANINGS.length) return -1;
      const st = stem(MEANINGS[m][0]);
      const p = acc.indexOf(st, cur);
      if (p >= 0 && p - cur <= W) return p;
      // an initial vowel merged with the word before
      const q = st.length > 2 ? acc.indexOf(st.slice(1), cur) : -1;
      if (q >= 0 && q - cur <= W) return Math.max(cur, q - 1);
      return -1;
    };
    let cur = 0;
    const found: { n: number; k: number }[] = [];
    while (n < MEANINGS.length && cur < acc.length - 1) {
      let p = find(n, cur);
      if (p >= 0) {
        found.push({ n, k: sylAt(p) });
        cur = p + Math.max(1, stem(MEANINGS[n][0]).length - 1);
        n++; continue;
      }
      // skip one or two names that will not match, if the one after does
      let skipped = false;
      for (const d of [1, 2]) {
        p = find(n + d, cur);
        if (p >= 0) {
          const k = sylAt(p);
          namesSkipped += d;
          for (let e = 0; e < d; e++) found.push({ n: n + e, k: Math.max(found.length ? found[found.length - 1].k : 0, k - (d - e)) });
          n += d; skipped = true; break;
        }
      }
      if (!skipped) break;
    }
    found.forEach((f, i) => {
      const to = i + 1 < found.length ? found[i + 1].k : syl.length;
      out[vi].push({ n: f.n + 1, from: f.k, to: Math.max(f.k + 1, to), name: MEANINGS[f.n][0], meaning: MEANINGS[f.n][1] });
    });
  });
  return out;
}

/* ───────── choosing a form for each shloka of names ───────── */

const FORM_KEYS: [string, RegExp][] = [
  ['narasimha', /nārasiṃh|nṛsiṃh|siṃh/],
  ['vamana', /vāman|trivikram|upendr/],
  ['varaha', /varāh/],
  ['rama', /\brām|rāmaḥ/],
  ['krishna', /govind|gopat|kṛṣṇ|dāmodar|devakī|vāsudev|keśav/],
  ['garuda', /garuḍ|suparṇ|khaga/],
  ['shayana', /padmanābh|śeṣ|ananta|jalaśāy|kṣīr|bhujag/],
  ['lakshmi', /śrīd|śrīś|śrīnivās|śrīnidh|śrīvibh|śrīdhar|śrīkar|śrīmat|lakṣm/],
  ['surya', /sūry|ravi|bhānu|savit|arka|divaspat|ādity/],
  ['weapons', /cakr|śaṅkh|gad|śārṅg|nandak|praharaṇ/],
  ['vishvarupa', /viśvarūp|sahasrākṣ|sahasramūrdh|sahasrapāt|anantarūp|viśvamūrt/],
  ['yogi', /yogī|yogavid|muni|yogīś/],
];
export function formFor(names: NameSpan[], i: number): string {
  const text = names.map((x) => x.name.toLowerCase()).join(' ');
  for (const [k, re] of FORM_KEYS) if (re.test(text)) return k;
  return ['chaturbhuja', 'lakshmi', 'shayana', 'vishvarupa', 'krishna', 'yogi'][i % 6];
}

/* ───────── the work ───────── */

function speakerOf(text: string): { speaker?: Speaker; rest: string } {
  const t = text.trim();
  for (const key of Object.keys(SPEAKERS)) if (t.startsWith(key)) return { speaker: SPEAKERS[key], rest: t.slice(key.length).trim() };
  return { rest: t };
}

function buildSection(key: string, raw: [string, string][], en: Record<number, string> | ((i: number) => string), scene: (i: number) => [string, (string | number)?], prefix: string, kind: WVerse['kind'] = 'verse'): WVerse[] {
  const out: WVerse[] = [];
  let pending: Speaker | undefined;
  raw.forEach(([dev], i) => {
    const { speaker, rest } = speakerOf(dev);
    if (speaker && !rest.replace(/[।॥\s]/g, '')) { pending = speaker; return; }
    const sp = speaker ?? pending; pending = undefined;
    const num = rest.match(/॥\s*([०-९]+)\s*॥/)?.[1];
    const { lines } = splitVerse(rest);
    const [sc, arg] = scene(i);
    out.push({
      id: `${prefix}${i}`, label: num ? `${key} ${num.replace(/[०-९]/g, (d) => String('०१२३४५६७८९'.indexOf(d)))}` : key,
      num: num ? `${num}` : undefined, speaker: sp, lines, en: typeof en === 'function' ? en(i) : en[i] ?? '', scene: sc, arg, kind,
    });
  });
  return out;
}

const raw = Object.fromEntries(STOTRAM.map((s) => [s.key, s.verses])) as Record<string, [string, string][]>;

const purva = buildSection('Invocation', raw.purva, PURVA_EN, (i) => PURVA_SCENE[i] ?? ['v-arrows', 2], 'P', 'invocation');
const dhyana = buildSection('Meditation', raw.dhyana, DHYANA_EN, (i) => DHYANA_SCENE[i] ?? ['d-chaturbhuja'], 'D');
const phala = buildSection('Fruits', raw.phalashruti, PHALA_EN, (i) => PHALA_SCENE[i] ?? ['p-close'], 'F');

const stotramV = buildSection('Shloka', raw.stotram, () => '', () => ['mandala'], 'S');
const spans = placeNames(stotramV);
stotramV.forEach((v, i) => {
  v.names = spans[i];
  if (v.names.length) {
    const a = v.names[0].n, z = v.names[v.names.length - 1].n;
    v.en = `Names ${a}–${z}: ` + v.names.map((x) => x.name).join(' · ');
    v.arg = formFor(v.names, i);
  } else {
    v.en = v.lines.join(' ').includes('इति') ? 'Om, salutation.' : '';
    v.arg = 'weapons';
  }
  if (!v.num) v.label = 'Om';
});

export const VISHNU_WORK: Work = {
  id: 'vishnu',
  dev: 'श्रीविष्णुसहस्रनामस्तोत्रम्',
  title: 'Vishnu Sahasranama',
  sub: 'The thousand names of Vishnu · painted as they are chanted',
  about: 'Bhishma, dying on a bed of arrows, answers Yudhishthira’s question — who is the one god, and what is the highest dharma? — with the thousand names of Vishnu. Every name lights up as it is chanted, with its meaning, and gathers into a garland round the Lord.',
  credit: 'Text: the Vishnu Sahasranama of the Mahabharata, Anushasana Parva, in Shankara’s recension (the MIT-licensed hindu-devotional-texts). Meanings of the names and the English of the other verses written for this page. Pictures, chant and music made in code.',
  matra: 0.16,
  card: 'v-card',
  close: 'v-close',
  sections: [
    { key: 'purva', dev: 'पूर्वपीठिका', title: 'The Invocation', sub: 'Yudhishthira asks Bhishma: who is the one god?', announce: 'हरिः ॐ', verses: purva },
    { key: 'dhyana', dev: 'ध्यानम्', title: 'Meditation', sub: 'Eight images of the Lord to hold in the mind', verses: dhyana },
    { key: 'stotram', dev: 'स्तोत्रम्', title: 'The Thousand Names', sub: 'From Viśvam, “the universe”, to the bearer of every weapon', announce: 'ॐ विश्वं विष्णुः', verses: stotramV },
    { key: 'phala', dev: 'फलश्रुतिः', title: 'The Fruits of Chanting', sub: 'What the names give, and the closing verses', verses: phala },
  ],
};

export function namesPlaced() { return spans.reduce((a, s) => a + s.length, 0); }
export { dn };
