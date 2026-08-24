/**
 * Locate quotes in a Project Gutenberg text and emit them with a citation.
 *
 * Usage:  node scripts/cite-quotes.mjs <gutenberg.txt> <selection.json>
 *
 * The selection is a list of strings that must appear in the text verbatim.
 * Anything that does not is reported and the run fails, so a quote can never
 * reach the stall with a citation nobody checked. Point it at any other
 * Gutenberg text and it works the same way — the format is the constraint,
 * not the book.
 */
import { readFileSync } from 'node:fs';

const [, , textPath, selPath] = process.argv;
if (!textPath || !selPath) {
  console.error('usage: node scripts/cite-quotes.mjs <text.txt> <selection.json>');
  process.exit(2);
}

const raw = readFileSync(textPath, 'utf8').replace(/["“”]/g, '"').replace(/[‘’]/g, "'");
const start = raw.indexOf('*** START OF THIS PROJECT GUTENBERG');
const end = raw.indexOf('*** END OF THIS PROJECT GUTENBERG');
const body = raw.slice(raw.indexOf('\n', start) + 1, end);

/** Walk the book once, remembering which part and chapter each offset is in. */
const marks = [];
let part = '';
let chapter = '';
let offset = 0;
for (const block of body.split(/\n\s*\n/)) {
  const line = block.trim().replace(/\s*\n\s*/g, ' ');
  let m;
  if ((m = line.match(/^(PART [IVX]+)$/))) {
    part = m[1].replace('PART ', 'Part ');
    chapter = '';
  } else if (/^EPILOGUE$/.test(line)) {
    part = 'Epilogue';
    chapter = '';
  } else if ((m = line.match(/^CHAPTER ([IVX]+)$/))) {
    chapter = m[1];
  } else if ((m = line.match(/^(first|second|third|fourth|fifth|sixth|seventh) night$/i))) {
    // White Nights is told over nights rather than chapters.
    part = m[1].replace(/^./, (c) => c.toUpperCase()) + ' night';
    chapter = '';
  } else if (/^morning$/i.test(line)) {
    part = 'Morning';
    chapter = '';
  }
  marks.push({ at: offset, part, chapter, text: line });
  offset += block.length + 2;
}

const flat = marks.map((m) => m.text).join('\n');
const squash = (s) => s.replace(/\s+/g, ' ').trim();

/**
 * Compare on words, not on typography.
 *
 * Gutenberg marks italics with underscores, and a line of dialogue ends in a
 * comma when a speech tag follows it, so a quote lifted from speech will not
 * match character for character however faithfully it was copied. Matching on
 * letters keeps the claim honest — these words, in this book, in this chapter —
 * without pretending the punctuation around them was untouched.
 */
const key = (s) =>
  s
    .replace(/_/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const flatKey = key(flat);

const wanted = JSON.parse(readFileSync(selPath, 'utf8'));
const missing = [];
const found = [];

for (const q of wanted) {
  const needle = squash(q);
  if (!flatKey.includes(key(needle))) {
    missing.push(q);
    continue;
  }
  // Which block holds it? Walk the blocks and test each one.
  let hit = null;
  for (const m of marks) {
    if (key(m.text).includes(key(needle))) {
      hit = m;
      break;
    }
  }
  if (!hit) {
    missing.push(q);
    continue;
  }
  found.push({
    text: needle,
    part: hit.part,
    chapter: hit.chapter,
    /** True when the punctuation matches the source too, not just the words. */
    literal: flat.includes(needle),
  });
}

if (missing.length) {
  console.error(`\n${missing.length} selection(s) not found verbatim:\n`);
  for (const m of missing) console.error('  ' + m.slice(0, 110));
  process.exit(1);
}

console.log(JSON.stringify(found, null, 2));
console.error(`located ${found.length} quotes, all verbatim`);
