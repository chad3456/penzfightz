/**
 * Harvest quotable sentences from the source ebooks.
 *
 * Every book is laid out differently and three of them carry matter that is
 * not Dostoevsky at all — a Penguin introduction, a Magarshack introduction, a
 * translator's notes, a reading group guide. Guessing at that generically gets
 * you an anthology of other people's prose attributed to him, so each book is
 * described explicitly below: where its body starts, where it ends, how it
 * marks its parts and chapters, and who translated it.
 *
 * Output is a scored shortlist, not a quote file. Scoring narrows half a
 * million words to something a person can actually read; the reading is still
 * done by a person.
 *
 * Usage:  node scripts/harvest.mjs <txt-dir> <out.tsv>
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const BOOKS = [
  {
    match: /McDuff/,
    work: 'Crime and Punishment',
    year: 1866,
    translator: 'McDuff',
    // The table of contents repeats the part headings, so start at the second.
    from: (t) => t.indexOf('PART ONE', t.indexOf('PART ONE') + 1),
    to: (t) => {
      const i = t.indexOf('\nIntroduction');
      return i > 0 ? i : t.length;
    },
    part: /^PART (ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN)$/,
    chapter: /^CHAPTER ([IVX]+)$/,
  },
  {
    match: /Pevear/,
    work: 'Notes from Underground',
    year: 1864,
    translator: 'Pevear & Volokhonsky',
    from: (t) => t.indexOf('NOTES FROM UNDERGROUND [1]'),
    to: (t) => {
      const i = t.lastIndexOf('Table of Contents');
      return i > 0 ? i : t.length;
    },
    part: /^PART (ONE|TWO): [A-Z' ]+$/,
    chapter: /^([IVX]+)$/,
  },
  {
    match: /White_Nights/,
    work: 'White Nights',
    year: 1848,
    translator: 'Garnett',
    from: () => 0,
    to: (t) => t.length,
    part: /^(first|second|third|fourth) night$/i,
    chapter: /^$/,
  },
  {
    match: /Double/,
    work: 'The Double',
    year: 1846,
    translator: 'unnamed',
    // Chapter One appears in the contents before it appears as a heading.
    from: (t) => t.indexOf('Chapter One', t.indexOf('Chapter One') + 1),
    to: (t) => t.length,
    part: /^$/,
    chapter: /^Chapter ([A-Z][a-z]+)$/,
  },
  {
    match: /Best_Short_Stories/,
    // An anthology: the "work" is whichever story we are inside.
    work: null,
    year: null,
    translator: 'Magarshack',
    from: (t) => t.indexOf('W HITE N IGHTS', t.indexOf('W HITE N IGHTS') + 1),
    to: (t) => {
      const i = t.indexOf('Commentary', t.length - 60000);
      return i > 0 ? i : t.length;
    },
    stories: {
      'WHITE NIGHTS': ['White Nights', 1848],
      'THE HONEST THIEF': ['The Honest Thief', 1848],
      'THE CHRISTMAS TREE AND A WEDDING': ['The Christmas Tree and a Wedding', 1848],
      'THE PEASANT MAREY': ['The Peasant Marey', 1876],
      'NOTES FROM THE UNDERGROUND': ['Notes from Underground', 1864],
      'A GENTLE CREATURE': ['A Gentle Creature', 1876],
      'THE DREAM OF A RIDICULOUS MAN': ['The Dream of a Ridiculous Man', 1877],
    },
    part: /^(FIRST|SECOND|THIRD|FOURTH) NIGHT$/,
    chapter: /^([IVX]+)$/,
  },
];

/**
 * Small caps arrive letter by letter: "W HITE N IGHTS", and "A G ENTLE C
 * REATURE" — where the first "A" is the article and the second is not. No
 * regex tells those apart reliably, so headings are matched on a key with
 * every space removed, which is exact either way. Prose is left alone: gluing
 * capitals inside a sentence would turn "I AM" into "IAM".
 */
const squeeze = (s) => s.toUpperCase().replace(/[^A-Z]/g, '');
const tidy = (s) => s.replace(/\s+/g, ' ').trim();

/**
 * Headings after which the prose stops being Dostoevsky's.
 *
 * These anthologies close with a critic's essay, a publisher's reading guide
 * and a biographical note, and open with a translator's introduction. Matched
 * on the squeezed key because they are small-capped like everything else — an
 * offset-based boundary missed the Zweig essay entirely and put three of his
 * sentences into the shortlist as Dostoevsky's.
 */
const STOP = new Set([
  'COMMENTARY',
  'READINGGROUPGUIDE',
  'BIOGRAPHICALNOTE',
  'INTRODUCTION',
  'FURTHERREADING',
  'ANOTEONTHETEXT',
  'TRANSLATORSNOTE',
  'NOTES',
  'ACKNOWLEDGEMENTS',
  'ACKNOWLEDGMENTS',
  'SUGGESTIONSFORFURTHERREADING',
]);

// ------------------------------------------------------------------- scoring

const PRESENT = /\b(is|are|isn't|aren't|can|cannot|can't|must|will|shall|should|ought|does|do|don't|doesn't|becomes|makes|gives|takes|knows|loves|lives|needs|means|matters|seems|remains|begins)\b/i;
const NARRATION = /\b(went|came|looked|turned|stood|sat|walked|entered|glanced|muttered|shouted|answered|replied|whispered|repeated|exclaimed|noticed|reached|opened|closed|pulled|pushed|knocked|shrugged|nodded)\b/i;
const ABSTRACT = /\b(man|men|mankind|people|human|humanity|life|love|death|soul|heart|mind|truth|lie|God|world|suffering|freedom|conscience|reason|nature|power|money|crime|guilt|fear|hope|virtue|vice|sin|shame|honour|honor|courage|despair|happiness|sorrow|pain|joy|thought|idea|will|character|habit|custom|society|justice|law|art|beauty|faith|doubt|memory|time|dream|solitude|friend|enemy|hatred|pride|vanity|boredom)\b/i;
const CONCRETE = /\b(table|door|room|hat|coat|street|stairs|staircase|window|bed|chair|lamp|candle|tea|vodka|bread|pocket|shoulder|corner|yard|gate|bridge|lodging|landlady|porter|clerk|servant|carriage|cart|horse|police|office|flat|garret|sofa|kitchen|samovar|galoshes|overcoat|trousers)\b/i;
const BACKREF = /^(he|she|they|him|her|them|this|that|these|those|then|but|and|so|yet|nor|besides|however|well|why|no|yes|oh|ah|now|here|such|both|neither|either|still|meanwhile|afterwards|indeed|of course|in fact|on the contrary|at last|for that|to be sure)\b/i;
const GNOMIC = /^(man |men |a man|the man who|one |no one|nobody|everyone|every |people |life |love |death |truth |money |power |nothing |everything |anything |suffering |habit |reason |nature |god |to |what is|there is|there are|it is|it's|who |whoever|if you|if a man|when a man|we |i believe|i think|human|i am|i have|perhaps|the best|the more|the whole|any man|a human)/i;
const COMPARATIVE = /\b(better than|worse than|more than|rather than|the more|the less|nothing (is|but)|only by|it is better|is not|are not)\b/i;

function score(t) {
  if (!/[.!?]$/.test(t) || !/^[A-Z"']/.test(t)) return -99;
  if (t.length < 45 || t.length > 210) return -99;
  if (t.includes('...') || t.includes('. . .')) return -99;
  if ((t.match(/"/g) || []).length % 2 === 1) return -99;
  if (/\d/.test(t)) return -99;
  if (/\b(sir|madam|Mr|Mrs|Miss|Your Excellency)\b/.test(t)) return -99;
  if (BACKREF.test(t)) return -99;

  let n = 0;
  if (GNOMIC.test(t)) n += 3;
  if (ABSTRACT.test(t)) n += 2;
  if ((t.match(new RegExp(ABSTRACT.source, 'gi')) || []).length > 1) n += 1;
  if (COMPARATIVE.test(t)) n += 2;
  if (PRESENT.test(t)) n += 2;
  if (/\b(always|never|all|every|none|nothing|everything|only|must|cannot)\b/i.test(t)) n += 1;
  if (NARRATION.test(t)) n -= 4;
  if (CONCRETE.test(t)) n -= 3;
  if (t.endsWith('?')) n -= 1;
  if (t.endsWith('!')) n -= 1;
  if (t.length >= 65 && t.length <= 155) n += 1;
  return n;
}

// ------------------------------------------------------------------- harvest

const [, , dir, out] = process.argv;
const rows = [];

for (const file of readdirSync(dir).filter((f) => f.endsWith('.txt'))) {
  const book = BOOKS.find((b) => b.match.test(file));
  if (!book) {
    console.error('no config for', file);
    continue;
  }
  if (book.stories && !book.storyKeys) {
    book.storyKeys = new Map(
      Object.entries(book.stories).map(([k, v]) => [squeeze(k), v]),
    );
  }
  const whole = readFileSync(join(dir, file), 'utf8');
  const a = Math.max(0, book.from(whole));
  const b = book.to(whole);
  const body = whole.slice(a, b);

  let part = '';
  let chapter = '';
  let work = book.work;
  let year = book.year;
  let kept = 0;

  for (const block of body.split(/\n\s*\n/)) {
    const line = tidy(block.replace(/\s*\n\s*/g, ' '));
    if (!line) continue;

    if (line.length < 60 && STOP.has(squeeze(line))) {
      work = null;
      continue;
    }
    if (book.stories && line.length < 60) {
      const hit = book.storyKeys.get(squeeze(line));
      if (hit) {
        [work, year] = hit;
        part = '';
        chapter = '';
        continue;
      }
    }
    let m;
    const flat = line.length < 60 ? tidy(line.replace(/\b([A-Z]) (?=[A-Z])/g, '$1')) : line;
    if (book.part.source !== '^$' && (m = flat.match(book.part))) {
      part = m[0].replace(/^PART /, 'Part ').toLowerCase().replace(/^./, (c) => c.toUpperCase());
      chapter = '';
      continue;
    }
    if (book.chapter.source !== '^$' && (m = flat.match(book.chapter))) {
      chapter = m[1];
      continue;
    }
    if (!work) continue;
    // Headings, running heads and stray title lines are not prose.
    if (line.length < 45 || /^(Cover|Title Page|Copyright|Contents|Notes|Commentary)\b/i.test(line))
      continue;

    for (const raw of line
      .replace(/["“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .split(/(?<=[.!?])"?\s+(?=["A-Z])/)) {
      const t = raw.trim().replace(/^"+/, '').replace(/"+$/, '').replace(/_/g, '').trim();
      const n = score(t);
      if (n < 4) continue;
      rows.push({ n, t, work, year, translator: book.translator, part, chapter });
      kept++;
    }
  }
  console.error(`${file.slice(0, 34).padEnd(36)} ${kept} candidates`);
}

const seen = new Set();
const uniq = [];
for (const r of rows.sort((x, y) => y.n - x.n)) {
  const k = r.t.toLowerCase().replace(/[^a-z ]/g, '');
  if (seen.has(k)) continue;
  seen.add(k);
  uniq.push(r);
}
writeFileSync(
  out,
  uniq.map((r) => [r.n, r.work, r.year, r.translator, r.part, r.chapter, r.t].join('\t')).join('\n'),
);
console.error(`\n${uniq.length} unique candidates written to ${out}`);
