/**
 * Flatten an epub to plain text, so the citing script can read it.
 *
 * Usage:  node scripts/epub-text.mjs <book.epub> > book.txt
 *
 * Spine order is taken from the OPF where there is one, because several of
 * these files store their chapters out of order and a book read in filename
 * order cites the wrong chapter.
 */
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const file = process.argv[2];
if (!file) {
  console.error('usage: node scripts/epub-text.mjs <book.epub>');
  process.exit(2);
}

const list = execFileSync('unzip', ['-Z1', file]).toString().split('\n').filter(Boolean);
const opfName = list.find((n) => n.endsWith('.opf'));
const read = (n) => execFileSync('unzip', ['-p', file, n], { maxBuffer: 1 << 28 }).toString();

let order = list.filter((n) => /\.(x?html?)$/i.test(n));
if (opfName) {
  const opf = read(opfName);
  const ids = new Map(
    [...opf.matchAll(/<item\s[^>]*id="([^"]+)"[^>]*href="([^"]+)"/g)].map((m) => [m[1], m[2]]),
  );
  const spine = [...opf.matchAll(/<itemref\s[^>]*idref="([^"]+)"/g)].map((m) => ids.get(m[1]));
  const base = opfName.includes('/') ? opfName.slice(0, opfName.lastIndexOf('/') + 1) : '';
  const resolved = spine
    .filter(Boolean)
    .map((h) => decodeURIComponent(base + h))
    .filter((h) => list.includes(h));
  if (resolved.length) order = resolved;
}

const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', mdash: '—', ndash: '–', hellip: '…', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”' };

const out = [];
for (const name of order) {
  let s = read(name);
  s = s.replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ');
  // Block ends become paragraph breaks; everything else becomes a space.
  s = s.replace(/<\/(p|div|h[1-6]|li|blockquote|section)\s*>/gi, '\n\n');
  s = s.replace(/<br\s*\/?>/gi, '\n');
  s = s.replace(/<[^>]+>/g, ' ');
  s = s.replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d));
  s = s.replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)));
  s = s.replace(/&([a-z]+);/gi, (m, e) => ENT[e.toLowerCase()] ?? m);
  s = s.replace(/[ \t ]+/g, ' ').replace(/\n{3,}/g, '\n\n');
  // Drop caps arrive as their own element, so a chapter can open "I t was a
  // wonderful night". Put the stray letter back on the word it belongs to.
  s = s.replace(/(^|\n)\s*([A-Z]) ([a-z]{1,14}\b)/g, '$1$2$3');
  out.push(s.trim());
}

// The citing script looks for these fences; give it ones it recognises.
process.stdout.write(
  '*** START OF THIS PROJECT GUTENBERG EBOOK ***\n\n' +
    out.join('\n\n') +
    '\n\n*** END OF THIS PROJECT GUTENBERG EBOOK ***\n',
);
