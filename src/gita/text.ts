/**
 * The Bhagavad Gita as a chanted work: eighteen chapters, each opened by a
 * card that announces it (अथ प्रथमोऽध्यायः) and closed by its colophon,
 * every verse with its speaker, its English, and the tableau that paints it.
 *
 * The Sanskrit is the 701-verse text (with Arjuna's question opening
 * chapter 13) from the MIT-licensed hindu-devotional-texts package, whose
 * Devanagari comes from the public-domain gita/gita dataset. The English is
 * a new translation made for this film (en1–en6).
 */
import SRC from './verses.json';
import { splitVerse, type Section, type Speaker, type WVerse, type Work } from '../pichwai/work';
import { EN1 } from './en1';
import { EN2 } from './en2';
import { EN3 } from './en3';
import { EN4 } from './en4';
import { EN5 } from './en5';
import { EN6 } from './en6';

const EN: string[][] = [...EN1, ...EN2, ...EN3, ...EN4, ...EN5, ...EN6];

const SPK: Record<string, Speaker> = {
  krishna: { dev: 'श्रीभगवानुवाच', en: 'Krishna said', who: 'krishna' },
  arjuna: { dev: 'अर्जुन उवाच', en: 'Arjuna said', who: 'arjuna' },
  sanjaya: { dev: 'सञ्जय उवाच', en: 'Sanjaya said', who: 'sanjaya' },
  dhritarashtra: { dev: 'धृतराष्ट्र उवाच', en: 'Dhritarashtra said', who: 'dhritarashtra' },
};
function speakerKey(line: string): keyof typeof SPK | undefined {
  const l = line.replace(/\s+/g, '');
  if (/भगवान/.test(l)) return 'krishna';
  if (/^अर्जुन/.test(l)) return 'arjuna';
  if (/^स(ञ्|ं)जय/.test(l)) return 'sanjaya';
  if (/^धृतराष्ट्र/.test(l)) return 'dhritarashtra';
  return undefined;
}

export const CHAPTERS: { en: string; sub: string }[] = [
  { en: 'Arjuna’s Despair', sub: 'The armies at Kurukshetra; Arjuna sees his kin and lays down his bow' },
  { en: 'The Yoga of Understanding', sub: 'The undying self, the warrior’s dharma, action without craving, the sage of steady wisdom' },
  { en: 'The Yoga of Action', sub: 'Why act at all; the wheel of sacrifice; desire, the enemy' },
  { en: 'The Yoga of Knowledge', sub: 'The ancient teaching, the Lord’s births age after age, knowledge as the fire that burns all action' },
  { en: 'The Yoga of Renunciation', sub: 'Renouncing and acting are one; the lotus leaf; the sage who sees the same in all' },
  { en: 'The Yoga of Meditation', sub: 'The seat, the lamp in a windless place, the restless mind, the yogi who fell short' },
  { en: 'The Yoga of Knowledge and Wisdom', sub: 'The Lord’s two natures; all strung on him like pearls on a thread' },
  { en: 'The Yoga of the Imperishable', sub: 'What one remembers at death; the days and nights of Brahma; the two paths' },
  { en: 'The Royal Knowledge, the Royal Secret', sub: 'All in him and he in none; a leaf, a flower, a fruit, a little water' },
  { en: 'The Divine Glories', sub: 'Of lights the sun, of rivers the Ganga, of letters A: the Lord in all that shines' },
  { en: 'The Vision of the Universal Form', sub: 'The thousand suns, the mouths of Time, and the gentle form again' },
  { en: 'The Yoga of Devotion', sub: 'The ways to the Lord, and the devotee who is dear to him' },
  { en: 'The Field and Its Knower', sub: 'The body as a field, the knower in all fields, the one sun that lights them' },
  { en: 'The Three Qualities', sub: 'Goodness, passion and darkness, and the one who goes beyond them' },
  { en: 'The Supreme Person', sub: 'The tree with its roots above, and the person beyond the perishable and the imperishable' },
  { en: 'The Divine and the Demonic', sub: 'Two natures, and the threefold gate of hell' },
  { en: 'The Three Kinds of Faith', sub: 'Faith, food, sacrifice, austerity and giving, each of three kinds; Om Tat Sat' },
  { en: 'Freedom through Renunciation', sub: 'Giving up the fruit, the Lord in every heart, the last word — and Arjuna rises' },
];
const ORD = ['प्रथमो', 'द्वितीयो', 'तृतीयो', 'चतुर्थो', 'पञ्चमो', 'षष्ठो', 'सप्तमो', 'अष्टमो', 'नवमो', 'दशमो', 'एकादशो', 'द्वादशो', 'त्रयोदशो', 'चतुर्दशो', 'पञ्चदशो', 'षोडशो', 'सप्तदशो', 'अष्टादशो'];
const ORD_EN = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth', 'eleventh', 'twelfth', 'thirteenth', 'fourteenth', 'fifteenth', 'sixteenth', 'seventeenth', 'eighteenth'];

/* ───────── which painting goes with which verse ───────── */

/** For each chapter: [first verse, tableau, arg]; a step holds until the next one. */
type Step = [number, string, (string | number)?];
export const PLAN: Step[][] = [
  [[1, 'g-palace', 0], [2, 'g-review', 0], [4, 'g-review', 1], [7, 'g-review', 2], [12, 'g-conch', 0], [14, 'g-conch', 1], [16, 'g-conch', 2], [19, 'g-conch', 3], [20, 'g-chariot', 0], [22, 'g-chariot', 1], [26, 'g-chariot', 2], [28, 'g-despair', 0], [32, 'g-despair', 1], [47, 'g-despair', 2]],
  [[1, 'g-despair', 3], [4, 'g-despair', 4], [7, 'g-despair', 5], [9, 'g-despair', 6], [11, 'g-teach', 'atman'], [13, 'g-teach', 'ages'], [14, 'g-teach', 'seasons'], [16, 'g-teach', 'atman'], [22, 'g-teach', 'clothes'], [23, 'g-teach', 'elements'], [26, 'g-teach', 'cycle'], [29, 'g-teach', 'wonder'], [31, 'g-teach', 'warrior'], [39, 'g-teach', 'karma'], [42, 'g-teach', 'flowers'], [46, 'g-teach', 'well'], [47, 'g-karma'], [52, 'g-teach', 'lamp'], [54, 'g-teach', 'sage'], [58, 'g-teach', 'tortoise'], [62, 'g-teach', 'fall'], [64, 'g-teach', 'clear'], [67, 'g-teach', 'boat'], [69, 'g-teach', 'night'], [70, 'g-teach', 'ocean']],
  [[1, 'g-teach', 'question'], [3, 'g-teach', 'twopaths'], [9, 'g-yajna', 0], [17, 'g-teach', 'atman'], [20, 'g-teach', 'king'], [22, 'g-teach', 'sun'], [27, 'g-teach', 'gunas'], [30, 'g-teach', 'surrender'], [33, 'g-teach', 'nature'], [36, 'g-teach', 'question'], [37, 'g-desire'], [42, 'g-teach', 'ascent']],
  [[1, 'g-lineage'], [4, 'g-teach', 'question'], [5, 'g-avatar'], [9, 'g-teach', 'atman'], [11, 'g-teach', 'paths'], [13, 'g-teach', 'four'], [16, 'g-teach', 'inaction'], [24, 'g-yajna', 1], [34, 'g-guru'], [36, 'g-teach', 'boat'], [37, 'g-teach', 'fireash'], [40, 'g-teach', 'doubt'], [41, 'g-teach', 'sword']],
  [[1, 'g-teach', 'question'], [2, 'g-teach', 'twopaths'], [7, 'g-teach', 'atman'], [10, 'g-lotusleaf'], [13, 'g-teach', 'city'], [18, 'g-sameness'], [20, 'g-teach', 'sage'], [27, 'g-yogi', 0]],
  [[1, 'g-teach', 'karma'], [5, 'g-teach', 'ascent'], [10, 'g-yogi', 0], [18, 'g-yogi', 1], [24, 'g-yogi', 2], [29, 'g-teach', 'cosmos'], [33, 'g-teach', 'wind'], [37, 'g-teach', 'cloud'], [40, 'g-teach', 'rebirth'], [46, 'g-yogi', 3]],
  [[1, 'g-teach', 'question'], [4, 'g-elements'], [7, 'g-pearls', 0], [13, 'g-maya', 0], [16, 'g-four', 0], [20, 'g-teach', 'gods'], [24, 'g-maya', 1], [28, 'g-teach', 'surrender']],
  [[1, 'g-teach', 'question'], [3, 'g-teach', 'om'], [5, 'g-death', 0], [9, 'g-teach', 'sun'], [11, 'g-death', 1], [17, 'g-brahmaday', 0], [23, 'g-paths']],
  [[1, 'g-teach', 'secret'], [4, 'g-pervade'], [7, 'g-brahmaday', 1], [11, 'g-teach', 'fools'], [13, 'g-kirtan', 0], [16, 'g-iam'], [20, 'g-teach', 'heaven'], [22, 'g-teach', 'carry'], [23, 'g-teach', 'gods'], [26, 'g-offer', 0], [29, 'g-teach', 'heart'], [32, 'g-kirtan', 1], [34, 'g-offer', 1]],
  [[1, 'g-teach', 'origin'], [4, 'g-teach', 'states'], [8, 'g-kirtan', 2], [12, 'g-sages'], [19, 'g-vibhuti']],
  [[1, 'g-teach', 'question'], [5, 'g-vishvarupa', 0], [9, 'g-vishvarupa', 1], [15, 'g-vishvarupa', 2], [26, 'g-vishvarupa', 3], [32, 'g-kala'], [35, 'g-praise'], [47, 'g-gentle', 0], [50, 'g-gentle', 1]],
  [[1, 'g-teach', 'question'], [2, 'g-teach', 'twopaths'], [6, 'g-teach', 'boat'], [9, 'g-steps'], [13, 'g-devotee']],
  [[1, 'g-teach', 'question'], [2, 'g-field', 0], [8, 'g-teach', 'virtues'], [13, 'g-field', 1], [20, 'g-teach', 'gunas'], [25, 'g-teach', 'paths'], [27, 'g-field', 2], [34, 'g-field', 3]],
  [[1, 'g-teach', 'secret'], [3, 'g-teach', 'seed'], [5, 'g-gunas', 0], [14, 'g-gunas', 1], [19, 'g-gunas', 2]],
  [[1, 'g-ashvattha', 0], [3, 'g-ashvattha', 1], [6, 'g-teach', 'abode'], [7, 'g-teach', 'wind'], [12, 'g-pearls', 1], [16, 'g-teach', 'purusha']],
  [[1, 'g-divine', 0], [4, 'g-divine', 1], [13, 'g-divine', 2], [16, 'g-divine', 1], [21, 'g-teach', 'gates'], [23, 'g-teach', 'scripture']],
  [[1, 'g-teach', 'question'], [2, 'g-faith', 0], [7, 'g-faith', 1], [11, 'g-faith', 2], [14, 'g-faith', 3], [20, 'g-faith', 4], [23, 'g-omtatsat']],
  [[1, 'g-teach', 'question'], [2, 'g-teach', 'relinquish'], [13, 'g-teach', 'five'], [18, 'g-gunas', 3], [41, 'g-four', 1], [45, 'g-teach', 'worship'], [49, 'g-yogi', 3], [57, 'g-teach', 'surrender'], [61, 'g-machine'], [63, 'g-surrender'], [67, 'g-teach', 'secret'], [72, 'g-rise'], [74, 'g-palace', 1], [78, 'g-yatra']],
];
const sceneFor = (ch: number, v: number): [string, (string | number)?] => {
  const plan = PLAN[ch - 1];
  let s: Step = plan[0];
  for (const st of plan) if (st[0] <= v) s = st;
  return [s[1], s[2]];
};

/* ───────── building the verses ───────── */

/** A verse as chanted lines: the speaker's line taken off, split at line ends and dandas. */
const chantLines = (dev: string) => splitVerse(dev.replace(/[\u200c\u200d]/g, ''));

function buildChapter(ci: number): Section {
  const ch = (SRC as { n: number; sa: string; verses: string[] }[])[ci];
  const verses: WVerse[] = [];
  let cur: Speaker | undefined;
  ch.verses.forEach((dev, vi) => {
    const isCol = vi === ch.verses.length - 1;
    if (isCol) {
      // the colophon, chanted in short phrases of a few words each
      const words = dev.replace(/[।|]+\s*$/, '').split(/\s+/), lines: string[] = [];
      for (let i = 0; i < words.length; i += 3) lines.push(words.slice(i, i + 3).join(' '));
      verses.push({
        id: `${ci + 1}.c`, label: `Chapter ${ci + 1} · colophon`, lines, kind: 'colophon', scene: 'g-colophon', arg: ci,
        en: `Om Tat Sat. Thus, in the Upanishads of the glorious Bhagavad Gita, the knowledge of Brahman, the scripture of yoga, the dialogue between Sri Krishna and Arjuna, ends the ${ORD_EN[ci]} chapter, called “${CHAPTERS[ci].en}”.`,
      });
      return;
    }
    const n = vi + 1;
    let { speaker, lines } = chantLines(dev);
    let inline = false;
    // two verses where the source puts “Arjuna said” first though he begins
    // speaking only in the second half: put the words where he starts
    if ((ci === 0 && (n === 21 || n === 28)) && speaker) { lines = [lines[0], speaker, ...lines.slice(1)]; inline = true; }
    const k = speaker ? speakerKey(speaker) : undefined;
    if (k) cur = SPK[k];
    const [scene, arg] = sceneFor(ci + 1, n);
    verses.push({ id: `${ci + 1}.${n}`, label: `Gita ${ci + 1}.${n}`, num: `${ci + 1}.${n}`.replace(/\d/g, (d) => '०१२३४५६७८९'[+d]), speaker: cur, inline, lines, en: EN[ci][vi], scene, arg });
  });
  const title = ch.sa.replace(/योग$/, 'योगः');
  return {
    key: `ch${ci + 1}`, dev: title, title: `${ci + 1}. ${CHAPTERS[ci].en}`, sub: CHAPTERS[ci].sub,
    announce: (ci === 0 ? 'ॐ श्रीपरमात्मने नमः\nअथ श्रीमद्भगवद्गीता\n' : '') + `अथ ${ORD[ci]}ऽध्यायः`,
    verses,
  };
}

export const GITA_WORK: Work = {
  id: 'gita',
  dev: 'श्रीमद्भगवद्गीता',
  title: 'Bhagavad Gita',
  sub: 'The song of the Lord · all eighteen chapters, chanted and painted',
  about: 'On the field of Kurukshetra, between two armies, Arjuna lays down his bow, and Krishna, his charioteer, answers him. All 701 verses of the Bhagavad Gita, chanted syllable by syllable in Sanskrit with an English translation, painted as a moving pichwai — about two and a half hours, with your place kept.',
  credit: 'Text: the Bhagavad Gita, Bhishma Parva of the Mahabharata, in the 701-verse text (Devanagari from the public-domain gita/gita dataset, via the MIT-licensed hindu-devotional-texts). English translation written for this page. Pictures, chant and music made in code.',
  matra: 0.15,
  card: 'g-card',
  close: 'g-close',
  sections: Array.from({ length: 18 }, (_, i) => buildChapter(i)),
};
