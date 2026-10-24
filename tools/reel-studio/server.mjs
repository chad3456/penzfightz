#!/usr/bin/env node
// Reel Studio: a local app for making collage explainer reels on any topic.
//
//   npm run reel-studio            then open http://localhost:4417
//
// Content from the web, Wikipedia, EPUB books and notes; archival photos from
// open collections; Claude writes the script when ANTHROPIC_API_KEY is set
// (or `ant auth login`), an offline draft otherwise; the collage-reel engine
// voices and renders it. Everything stays on this machine under video-work/studio.
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fromEpub, fromText, fromUrl, fromWikipedia } from './lib/sources.mjs';
import { download, search as photoSearch, PROVIDERS } from './lib/photos.mjs';
import { claudeReady, planFromText, research, writeOffline, writeWithClaude } from './lib/writer.mjs';
import { CACHE, ROOT, SKILL, VOICE_MODEL, render as renderJob, voice as voiceJob, writeReel } from './lib/pipeline.mjs';

const PORT = +(process.env.PORT || 4417);
const HOST = process.env.HOST || '127.0.0.1';
const HERE = path.dirname(new URL(import.meta.url).pathname);
const DATA = process.env.REEL_STUDIO_DIR || path.join(ROOT, 'video-work', 'studio');
fs.mkdirSync(DATA, { recursive: true });

// ---------- projects on disk ----------
const pdir = (id) => { if (!/^[a-z0-9-]{3,60}$/.test(id)) throw httpError(400, 'bad project id'); return path.join(DATA, id); };
function load(id) { const f = path.join(pdir(id), 'project.json'); if (!fs.existsSync(f)) throw httpError(404, 'no such project'); return JSON.parse(fs.readFileSync(f, 'utf8')); }
function save(p) { p.updated = new Date().toISOString(); fs.mkdirSync(path.join(pdir(p.id), 'media'), { recursive: true }); fs.writeFileSync(path.join(pdir(p.id), 'project.json'), JSON.stringify(p, null, 1)); return p; }
function sourceText(p, s) {
  if (s.kind !== 'epub') return s.text || '';
  const book = JSON.parse(fs.readFileSync(path.join(pdir(p.id), 'sources', `${s.id}.json`), 'utf8'));
  const pick = new Set(s.selected || []);
  return book.chapters.filter((c) => pick.has(c.id)).map((c) => `## ${c.title}\n${c.text}`).join('\n\n');
}
function publicProject(p) { return { ...p, sources: p.sources.map(({ text, ...s }) => ({ ...s, preview: (text || '').slice(0, 400) })) }; }
const slug = (s) => (s || 'reel').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'reel';

// ---------- jobs with live progress ----------
const jobs = new Map();
function job(kind, projectId, fn) {
  const id = `${kind}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const j = { id, kind, projectId, status: 'running', log: [], progress: 0, result: null, error: null, listeners: new Set() };
  const emit = () => { const data = `data: ${JSON.stringify(view(j))}\n\n`; j.listeners.forEach((res) => res.write(data)); };
  j.logf = (m) => { j.log.push(m); if (j.log.length > 200) j.log.shift(); emit(); };
  j.prog = (x) => { const v = Math.round(x * 100) / 100; if (v !== j.progress) { j.progress = v; emit(); } };
  jobs.set(id, j);
  Promise.resolve().then(() => fn(j.logf, j.prog)).then((r) => { j.status = 'done'; j.result = r; j.progress = 1; }, (e) => { j.status = 'error'; j.error = e.message; console.error(kind, e); }).finally(() => { emit(); j.listeners.forEach((res) => res.end()); });
  return view(j);
}
const view = (j) => ({ id: j.id, kind: j.kind, projectId: j.projectId, status: j.status, log: j.log.slice(-12), progress: j.progress, result: j.result, error: j.error });

// ---------- photos for a plan: search and download the first open result ----------
async function fillPhotos(p, log) {
  const want = [];
  for (const ln of p.plan.lines) for (const s of ln.shots) for (const k of ['photo', 'photo2']) if (s[k] && !s[k].file && s[k].query) want.push([s, k]);
  if (!want.length) return;
  log(`finding ${want.length} archival photos`);
  const seen = new Set(p.photos.map((x) => x.id));
  let ok = 0, failed = 0;
  for (const [s, k] of want) {
    try {
      const { results, errors } = await photoSearch(s[k].query, { per: 6 });
      const pick = results.find((r) => r.open && !seen.has(r.id)) || results.find((r) => r.open);
      if (!pick) { failed++; if (errors.length && failed === 1) log(`photo search: ${errors[0]}`); continue; }
      let have = p.photos.find((x) => x.id === pick.id);
      if (!have) { const d = await download(pick, path.join(pdir(p.id), 'media')); have = { ...pick, ...d.credit, file: d.file }; p.photos.push(have); }
      seen.add(pick.id); s[k].file = have.file; ok++;
    } catch (e) { failed++; if (failed === 1) log(`photo search failed: ${e.message}`); }
  }
  log(`photos: ${ok} found${failed ? `, ${failed} not found (those shots use drawn scenes; pick photos by hand)` : ''}`);
}

// stickers the preview asks for are fetched on first use (Fluent 3D emoji, MIT)
const stickerTries = new Map();
async function ensureSticker(file) {
  const m = file.match(/^([a-z0-9_]+)\.png$/);
  const out = path.join(CACHE, 'stickers', file);
  if (!m || fs.existsSync(out)) return;
  if (!stickerTries.has(file)) stickerTries.set(file, (async () => {
    const name = m[1].replace(/_/g, ' '), folder = name[0].toUpperCase() + name.slice(1);
    const base = 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/';
    for (const f of [folder, folder.replace(/\b\w/g, (c) => c.toUpperCase())]) for (const tail of [`3D/${m[1]}_3d.png`, `Default/3D/${m[1]}_3d_default.png`]) {
      try {
        const r = await fetch(base + encodeURIComponent(f) + '/' + tail, { signal: AbortSignal.timeout(15000) });
        if (r.ok) { fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, Buffer.from(await r.arrayBuffer())); return; }
      } catch { /* offline: no sticker */ }
    }
  })());
  await stickerTries.get(file);
}

// ---------- http plumbing ----------
function httpError(code, msg) { const e = new Error(msg); e.code = code; return e; }
function send(res, code, body, type = 'application/json') { res.writeHead(code, { 'content-type': type, 'cache-control': 'no-store' }); res.end(type === 'application/json' ? JSON.stringify(body) : body); }
async function body(req, max = 300e6) {
  const chunks = []; let n = 0;
  for await (const c of req) { n += c.length; if (n > max) throw httpError(413, 'upload too large'); chunks.push(c); }
  return Buffer.concat(chunks);
}
const jsonBody = async (req) => { const b = await body(req, 20e6); return b.length ? JSON.parse(b.toString('utf8')) : {}; };
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.json': 'application/json', '.wav': 'audio/wav', '.mp4': 'video/mp4', '.txt': 'text/plain; charset=utf-8' };
function serveFile(req, res, root, rel) {
  const f = path.resolve(root, '.' + path.posix.normalize('/' + rel));
  if (!f.startsWith(path.resolve(root)) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) return send(res, 404, { error: 'not found' });
  const st = fs.statSync(f), type = TYPES[path.extname(f).toLowerCase()] || 'application/octet-stream';
  const range = req.headers.range && /bytes=(\d*)-(\d*)/.exec(req.headers.range);
  if (range) { // video and audio seeking
    const a = range[1] ? +range[1] : 0, b = range[2] ? +range[2] : st.size - 1;
    res.writeHead(206, { 'content-type': type, 'content-range': `bytes ${a}-${b}/${st.size}`, 'accept-ranges': 'bytes', 'content-length': b - a + 1 });
    return fs.createReadStream(f, { start: a, end: b }).pipe(res);
  }
  res.writeHead(200, { 'content-type': type, 'content-length': st.size, 'accept-ranges': 'bytes', 'cache-control': 'no-cache' });
  fs.createReadStream(f).pipe(res);
}

const routes = [];
const on = (method, pattern, fn) => routes.push({ method, re: new RegExp('^' + pattern.replace(/:(\w+)/g, '(?<$1>[^/]+)') + '$'), fn });

on('GET', '/api/status', async () => ({
  claude: claudeReady(), model: process.env.REEL_MODEL || 'claude-opus-5-5',
  voice: fs.existsSync(VOICE_MODEL), engine: fs.existsSync(path.join(SKILL, 'engine', 'reel.js')), providers: Object.keys(PROVIDERS), data: DATA, cpus: os.cpus().length,
}));
on('GET', '/api/projects', async () => fs.readdirSync(DATA).filter((d) => fs.existsSync(path.join(DATA, d, 'project.json'))).map((d) => { const p = load(d); return { id: p.id, title: p.title, topic: p.topic, updated: p.updated, lines: p.plan?.lines?.length || 0 }; }).sort((a, b) => (b.updated || '').localeCompare(a.updated || '')));
on('POST', '/api/projects', async (req) => {
  const b = await jsonBody(req);
  let id = slug(b.title || b.topic), k = 1;
  while (fs.existsSync(path.join(DATA, id))) id = `${slug(b.title || b.topic)}-${++k}`;
  return publicProject(save({ id, title: b.title || b.topic || 'New reel', topic: b.topic || '', angle: '', seconds: 60, look: 'archival', voice: { speaker: 60, speed: 1.0 }, sources: [], photos: [], plan: null, created: new Date().toISOString() }));
});
on('GET', '/api/projects/:id', async (req, m) => publicProject(load(m.id)));
on('PUT', '/api/projects/:id', async (req, m) => {
  const p = load(m.id), b = await jsonBody(req);
  for (const k of ['title', 'topic', 'angle', 'seconds', 'look', 'voice', 'plan', 'draft', 'hostImage']) if (k in b) p[k] = b[k];
  return publicProject(save(p));
});
on('DELETE', '/api/projects/:id', async (req, m) => { load(m.id); fs.rmSync(pdir(m.id), { recursive: true, force: true }); return { ok: true }; });

// sources
const addSource = (p, s) => { s.id = `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`; p.sources.push(s); save(p); return publicProject(p); };
on('POST', '/api/projects/:id/sources/url', async (req, m) => { const p = load(m.id), b = await jsonBody(req); return addSource(p, await fromUrl(b.url)); });
on('POST', '/api/projects/:id/sources/wikipedia', async (req, m) => { const p = load(m.id), b = await jsonBody(req); return addSource(p, await fromWikipedia(b.topic || p.topic, b.lang || 'en')); });
on('POST', '/api/projects/:id/sources/text', async (req, m) => { const p = load(m.id), b = await jsonBody(req); return addSource(p, fromText(b.title, b.text || '')); });
on('POST', '/api/projects/:id/sources/epub', async (req, m) => {
  const p = load(m.id), name = decodeURIComponent(req.headers['x-filename'] || 'book.epub');
  const book = fromEpub(await body(req), name);
  const s = { kind: 'epub', title: book.title, author: book.author, date: book.date, rights: book.rights, file: name, words: book.words, chapters: book.chapters.map(({ text, ...c }) => c) };
  // chapters stay in their own file; pick the main ones by default (up to ~25k words)
  let budget = 25000; s.selected = book.chapters.filter((c) => !c.skip && (budget -= c.words) > 0).map((c) => c.id);
  const res = addSource(p, s);
  const sid = p.sources.at(-1).id;
  fs.mkdirSync(path.join(pdir(p.id), 'sources'), { recursive: true });
  fs.writeFileSync(path.join(pdir(p.id), 'sources', `${sid}.json`), JSON.stringify({ chapters: book.chapters }));
  // the book's own pictures become photos you can use (credited to the book)
  for (const [k, im] of book.images.slice(0, 40).entries()) {
    const file = `${sid}-${k}${path.extname(im.path) || '.jpg'}`;
    fs.writeFileSync(path.join(pdir(p.id), 'media', file), book.readImage(im.path));
    p.photos.push({ id: `${sid}:${k}`, file, title: `${book.title}: ${path.basename(im.path)}`, creator: book.author, provider: `EPUB: ${name}`, license: book.rights ? (book.rights.match(/^[^.;]+/)?.[0] || book.rights).slice(0, 160) : 'from your book (check rights)', source: '' });
  }
  save(p);
  return { ...res, photos: p.photos };
});
on('PATCH', '/api/projects/:id/sources/:sid', async (req, m) => { const p = load(m.id), b = await jsonBody(req); const s = p.sources.find((x) => x.id === m.sid); if (!s) throw httpError(404, 'no such source'); if (b.selected) s.selected = b.selected; save(p); return publicProject(p); });
on('DELETE', '/api/projects/:id/sources/:sid', async (req, m) => { const p = load(m.id); p.sources = p.sources.filter((x) => x.id !== m.sid); save(p); return publicProject(p); });
on('GET', '/api/projects/:id/sources/:sid/text', async (req, m) => { const p = load(m.id); const s = p.sources.find((x) => x.id === m.sid); return { text: sourceText(p, s).slice(0, 200000) }; });

// writing
on('POST', '/api/projects/:id/research', async (req, m) => {
  const p = load(m.id);
  return job('research', p.id, async (log) => { const r = await research(p.topic, p.angle, log); const q = load(p.id); addSource(q, { ...r, url: '' }); return { words: r.words, links: r.links.length }; });
});
on('POST', '/api/projects/:id/write', async (req, m) => {
  const p = load(m.id), b = await jsonBody(req);
  const mode = b.mode === 'offline' || !claudeReady() ? 'offline' : 'claude';
  return job('write', p.id, async (log) => {
    const sources = p.sources.map((s) => ({ title: s.kind === 'epub' ? `${s.title}${s.author ? ` by ${s.author}` : ''}` : s.title, url: s.url, text: sourceText(p, s) })).filter((s) => s.text.trim());
    const words = sources.reduce((a, s) => a + s.text.split(/\s+/).length, 0);
    if (mode === 'claude' && words > 400000) throw new Error(`the selected sources are ${words.toLocaleString()} words; untick some EPUB chapters (Claude can read about 400,000 words at once)`);
    log(mode === 'claude' ? `Claude is reading ${words.toLocaleString()} words of sources` : `offline draft from ${words.toLocaleString()} words of sources`);
    const photos = p.photos.map((x) => x.file);
    const r = mode === 'claude' ? await writeWithClaude({ topic: p.topic, angle: p.angle, seconds: p.seconds, sources }, log) : writeOffline({ topic: p.topic, seconds: p.seconds, sources, photos });
    const q = load(p.id);
    q.plan = r.plan; q.title = q.title || r.plan.title;
    await fillPhotos(q, log);
    save(q);
    return { mode, lines: r.plan.lines.length, shots: r.plan.lines.reduce((a, l) => a + l.shots.length, 0), corrections: r.plan.corrections || [] };
  });
});

on('POST', '/api/projects/:id/plan-from-text', async (req, m) => {
  const p = load(m.id), b = await jsonBody(req);
  if (!(b.text || '').trim()) throw httpError(400, 'paste your narration first');
  return job('write', p.id, async (log) => {
    log('planning shots for your narration');
    const r = planFromText({ topic: p.topic, text: b.text, photos: p.photos.map((x) => x.file) });
    const q = load(p.id); q.plan = r.plan; await fillPhotos(q, log); save(q);
    return { mode: 'yours', lines: r.plan.lines.length, shots: r.plan.lines.reduce((a, l) => a + l.shots.length, 0), corrections: [] };
  });
});

// photos
on('GET', '/api/photos/search', async (req, m, url) => photoSearch(url.searchParams.get('q') || '', { providers: (url.searchParams.get('providers') || Object.keys(PROVIDERS).join(',')).split(',').filter((x) => PROVIDERS[x]), per: 12 }));
on('POST', '/api/projects/:id/photos', async (req, m) => {
  const p = load(m.id), b = await jsonBody(req);
  const have = p.photos.find((x) => x.id === b.id);
  if (have) return { photo: have, photos: p.photos };
  const d = await download(b, path.join(pdir(p.id), 'media'));
  const photo = { ...b, ...d.credit, file: d.file };
  p.photos.push(photo); save(p);
  return { photo, photos: p.photos };
});
on('POST', '/api/projects/:id/photos/upload', async (req, m) => {
  const p = load(m.id), name = decodeURIComponent(req.headers['x-filename'] || 'photo.jpg').replace(/[^\w.-]+/g, '_');
  if (!/\.(jpe?g|png|webp)$/i.test(name)) throw httpError(400, 'use a JPEG, PNG or WebP image');
  const file = `up-${Date.now().toString(36)}-${name}`;
  fs.writeFileSync(path.join(pdir(p.id), 'media', file), await body(req, 30e6));
  const photo = { id: `up:${file}`, file, title: name, provider: 'your upload', license: 'yours', creator: '' };
  p.photos.push(photo); save(p);
  return { photo, photos: p.photos };
});

// voice and render
on('POST', '/api/projects/:id/voice', async (req, m) => { const p = load(m.id); if (!p.plan) throw httpError(400, 'write a script first'); return job('voice', p.id, async (log) => { await voiceJob(p, pdir(p.id), log); return { voice: `/p/${p.id}/vo/voice.json`, audio: `/p/${p.id}/vo/preview.wav?${Date.now()}` }; }); });
on('POST', '/api/projects/:id/render', async (req, m) => {
  const p = load(m.id), b = await jsonBody(req); if (!p.plan) throw httpError(400, 'write a script first');
  p.draft = !!b.draft; p.workers = Math.max(1, Math.min(8, os.cpus().length));
  return job('render', p.id, async (log, prog) => { const r = await renderJob(p, pdir(p.id), log, prog); return { video: `/p/${p.id}/out/${r.file}?${Date.now()}`, credits: `/p/${p.id}/out/${r.credits}`, file: r.file }; });
});
on('GET', '/api/projects/:id/reel', async (req, m) => { const p = load(m.id); if (!p.plan) throw httpError(400, 'no script yet'); return writeReel(p, pdir(p.id)); });
on('GET', '/api/jobs/:jid', async (req, m) => { const j = jobs.get(m.jid); if (!j) throw httpError(404, 'no such job'); return view(j); });

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const p = decodeURIComponent(url.pathname);
  try {
    if (p.startsWith('/api/jobs/') && p.endsWith('/events')) { // server-sent progress
      const j = jobs.get(p.split('/')[3]);
      if (!j) return send(res, 404, { error: 'no such job' });
      res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-store', connection: 'keep-alive' });
      res.write(`data: ${JSON.stringify(view(j))}\n\n`);
      if (j.status !== 'running') return res.end();
      j.listeners.add(res); req.on('close', () => j.listeners.delete(res));
      return;
    }
    for (const r of routes) {
      const m = r.method === req.method && r.re.exec(p);
      if (m) return send(res, 200, await r.fn(req, m.groups || {}, url));
    }
    if (p.startsWith('/api/')) return send(res, 404, { error: 'no such endpoint' });
    if (p.startsWith('/engine/')) return serveFile(req, res, path.join(SKILL, 'engine'), p.slice(8));
    if (p.startsWith('/stickers/')) { await ensureSticker(p.slice(10)); return serveFile(req, res, path.join(CACHE, 'stickers'), p.slice(10)); }
    const pm = p.match(/^\/p\/([a-z0-9-]+)\/(media|vo|out)\/(.+)$/);
    if (pm) return serveFile(req, res, path.join(pdir(pm[1]), pm[2]), pm[3]);
    return serveFile(req, res, path.join(HERE, 'public'), p === '/' ? 'index.html' : p.slice(1));
  } catch (e) {
    if (!e.code || typeof e.code !== 'number') console.error(e);
    send(res, typeof e.code === 'number' ? e.code : 500, { error: e.message });
  }
});
server.listen(PORT, HOST, () => console.log(`Reel Studio: http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}\n  projects in ${DATA}\n  Claude: ${claudeReady() ? 'ready' : 'not configured (offline drafts) - set ANTHROPIC_API_KEY to enable'}`));
