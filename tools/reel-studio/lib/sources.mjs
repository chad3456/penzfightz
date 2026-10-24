// Content in: web pages, Wikipedia, EPUB books, pasted notes.
import path from 'node:path';
import { readZip } from './zip.mjs';

const UA = 'ReelStudio/1.0 (local tool; collage explainer reels)';
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', mdash: '—', ndash: '–', hellip: '…', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“' };

export function decode(s) {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
    .replace(/&([a-z]+);/gi, (m, n) => ENT[n.toLowerCase()] ?? m);
}

// HTML or XHTML to readable paragraphs: drop scripts, navigation, footers and
// the like; keep headings and paragraphs as separate lines
export function htmlToText(html) {
  let h = html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style|noscript|svg|nav|footer|header|aside|form|figure|table|sup)\b[\s\S]*?<\/\1>/gi, ' ');
  const main = h.match(/<(article|main)\b[\s\S]*?<\/\1>/i);
  if (main && main[0].length > 2000) h = main[0];
  h = h.replace(/<\/(p|div|h[1-6]|li|blockquote|section|br|tr)>/gi, '\n').replace(/<br\s*\/?>/gi, '\n');
  const text = decode(h.replace(/<[^>]+>/g, ' ')).replace(/[\u2060\u00ad\u200b]/g, '');
  return text.split('\n').map((l) => l.replace(/\s+/g, ' ').trim()).filter((l) => l.length > 1).join('\n');
}

function titleOf(html) { const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i); return m ? decode(m[1].replace(/\s+/g, ' ').trim()) : ''; }

async function get(url, type = 'text') {
  const u = new URL(url);
  if (!/^https?:$/.test(u.protocol)) throw new Error('only http and https links');
  const r = await fetch(u, { headers: { 'user-agent': UA, accept: type === 'json' ? 'application/json' : 'text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.5' }, signal: AbortSignal.timeout(30000), redirect: 'follow' })
    .catch((e) => { throw new Error(`couldn't reach ${u.host} (${e.cause?.code || e.name})`); });
  if (!r.ok) throw new Error(`${u.host} answered ${r.status}`);
  const len = +(r.headers.get('content-length') || 0);
  if (len > 8e6) throw new Error('page too large');
  return type === 'json' ? r.json() : type === 'buffer' ? Buffer.from(await r.arrayBuffer()) : r.text();
}

export async function fromUrl(url) {
  if (/\.epub(\?|$)/i.test(url)) return fromEpub(await get(url, 'buffer'), path.basename(new URL(url).pathname));
  const body = await get(url);
  const isHtml = /<html|<body|<p[\s>]/i.test(body.slice(0, 5000));
  const text = isHtml ? htmlToText(body) : body;
  return { kind: 'web', title: (isHtml && titleOf(body)) || url, url, text, words: wc(text) };
}

export async function fromWikipedia(topic, lang = 'en') {
  const api = `https://${lang}.wikipedia.org/w/api.php?action=query&format=json&prop=extracts|info&inprop=url&explaintext=1&redirects=1&titles=${encodeURIComponent(topic)}&origin=*`;
  let j = await get(api, 'json');
  let page = Object.values(j.query?.pages || {})[0];
  if (!page || page.missing !== undefined) {
    const s = await get(`https://${lang}.wikipedia.org/w/api.php?action=query&format=json&list=search&srlimit=1&srsearch=${encodeURIComponent(topic)}&origin=*`, 'json');
    const t = s.query?.search?.[0]?.title;
    if (!t) throw new Error(`no Wikipedia article for “${topic}”`);
    j = await get(api.replace(encodeURIComponent(topic), encodeURIComponent(t)), 'json');
    page = Object.values(j.query?.pages || {})[0];
  }
  const text = (page.extract || '').replace(/\n==+ (See also|References|External links|Further reading|Notes)[\s\S]*$/, '').replace(/==+ ([^=]+) ==+/g, '\n$1\n');
  return { kind: 'wikipedia', title: `Wikipedia: ${page.title}`, url: page.fullurl, text, words: wc(text), license: 'CC BY-SA 4.0 (paraphrase, attribute Wikipedia)' };
}

export function fromText(title, text) { return { kind: 'notes', title: title || 'Notes', text, words: wc(text) }; }

export function wc(t) { return (t.match(/\S+/g) || []).length; }

// EPUB: read the package file, walk the spine, return one entry per chapter,
// plus the book's images (often public-domain illustrations worth using)
export function fromEpub(buf, filename = 'book.epub') {
  const z = readZip(buf);
  const container = z.read('META-INF/container.xml');
  if (!container) throw new Error('not an EPUB (no META-INF/container.xml)');
  const opfPath = (container.toString('utf8').match(/full-path="([^"]+)"/) || [])[1];
  const opf = z.read(opfPath)?.toString('utf8');
  if (!opf) throw new Error('EPUB package file missing');
  const base = path.posix.dirname(opfPath);
  const resolve = (href) => path.posix.normalize(base === '.' ? href : `${base}/${href}`).replace(/#.*$/, '');
  const meta = (tag) => { const m = opf.match(new RegExp(`<dc:${tag}[^>]*>([\\s\\S]*?)</dc:${tag}>`, 'i')); return m ? decode(m[1].replace(/<[^>]+>/g, '').trim()) : ''; };
  const items = new Map();
  for (const m of opf.matchAll(/<item\b[^>]*>/gi)) {
    const a = (k) => (m[0].match(new RegExp(`\\b${k}="([^"]*)"`, 'i')) || [])[1];
    items.set(a('id'), { href: decode(a('href') || ''), type: a('media-type') || '', props: a('properties') || '' });
  }
  // chapter titles from the table of contents when there is one
  const tocTitles = new Map();
  const nav = [...items.values()].find((i) => /\bnav\b/.test(i.props));
  const ncx = [...items.values()].find((i) => i.type === 'application/x-dtbncx+xml');
  if (nav) {
    const x = z.read(resolve(nav.href))?.toString('utf8') || '';
    const navBase = path.posix.dirname(resolve(nav.href));
    for (const m of x.matchAll(/<a\b[^>]*href="([^"#]+)[^"]*"[^>]*>([\s\S]*?)<\/a>/gi)) tocTitles.set(path.posix.normalize(`${navBase}/${decode(m[1])}`), decode(m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()));
  } else if (ncx) {
    const x = z.read(resolve(ncx.href))?.toString('utf8') || '';
    const ncxBase = path.posix.dirname(resolve(ncx.href));
    for (const m of x.matchAll(/<navPoint[\s\S]*?<text>([\s\S]*?)<\/text>[\s\S]*?<content src="([^"#]+)/gi)) tocTitles.set(path.posix.normalize(`${ncxBase}/${decode(m[2])}`), decode(m[1].trim()));
  }
  const skip = /(cover|titlepage|halftitle|imprint|colophon|copyright|uncopyright|toc|nav|loi|endnotes|acknowledg)/i;
  const chapters = [];
  for (const m of opf.matchAll(/<itemref\b[^>]*idref="([^"]+)"/gi)) {
    const it = items.get(m[1]);
    if (!it || !/x?html/.test(it.type)) continue;
    const file = resolve(it.href);
    const html = z.read(file)?.toString('utf8');
    if (!html) continue;
    const text = htmlToText(html.replace(/<(h[1-6])[^>]*>/gi, '<$1>'));
    const words = wc(text);
    if (words < 40) continue;
    const head = (html.match(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/i) || [])[1];
    const title = tocTitles.get(file) || (head && decode(head.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())) || path.posix.basename(file).replace(/\.x?html?$/, '');
    chapters.push({ id: `c${chapters.length}`, title, text, words, skip: skip.test(path.posix.basename(file)) });
  }
  const images = [...items.values()].filter((i) => /^image\/(jpeg|png|gif|webp)$/.test(i.type)).map((i) => ({ path: resolve(i.href), type: i.type }))
    .map((i) => ({ ...i, size: z.read(i.path)?.length || 0 })).filter((i) => i.size > 15000);
  return {
    kind: 'epub', title: meta('title') || filename, author: meta('creator'), date: meta('date'), rights: meta('rights'),
    chapters, images, words: chapters.reduce((a, c) => a + c.words, 0),
    readImage: (p) => z.read(p),
  };
}
