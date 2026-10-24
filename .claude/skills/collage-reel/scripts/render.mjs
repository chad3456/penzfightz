#!/usr/bin/env node
/*
 * Render a collage reel to a vertical 1080 x 1920 video.
 *
 *   node render.mjs REEL.json --vo DIR --out DIR [--stills] [--workers 4] [--from S --to S]
 *        [--media DIR] [--no-music] [--fps 30] [--scale 1]
 *
 * --vo      folder written by voice.py (narration clips + word timings)
 * --stills  one PNG per shot plus contact.jpg, then stop (check the look first)
 * --media   folder for your own images (win.img, k:"img", meta.host.image)
 * --scale   0.5 renders 540 x 960 drafts quickly
 *
 * Needs Playwright (npm i --no-save playwright) with a Chromium (Playwright's,
 * /opt/pw-browsers/chromium, or CHROMIUM_PATH), ffmpeg, and python3 + numpy.
 */
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const reelPath = argv.find((a) => !a.startsWith('--') && a.endsWith('.json'));
const args = {};
argv.forEach((a, i) => { if (a.startsWith('--')) args[a.slice(2)] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : true; });
if (!reelPath || !args.out) { console.error('usage: node render.mjs REEL.json --vo DIR --out DIR [--stills]'); process.exit(2); }
const reel = JSON.parse(fs.readFileSync(reelPath, 'utf8'));
const out = path.resolve(args.out); fs.mkdirSync(out, { recursive: true });
const cache = process.env.REEL_CACHE || path.resolve(here, '..', '..', '..', '..', 'video-work', 'reel-cache');
const voDir = args.vo && args.vo !== true ? path.resolve(args.vo) : null;
const voice = voDir && fs.existsSync(path.join(voDir, 'voice.json')) ? JSON.parse(fs.readFileSync(path.join(voDir, 'voice.json'), 'utf8')) : null;
const media = args.media ? path.resolve(args.media) : path.dirname(path.resolve(reelPath));
const scale = +(args.scale || 1);
if (!voice) console.warn('no voice.json: timing is estimated and the film will be silent apart from music');

function loadPlaywright() {
  for (const base of [process.env.PLAYWRIGHT_MODULE, process.cwd(), here].filter(Boolean)) {
    try { return createRequire(path.join(base, 'x.js'))('playwright'); } catch { /* next */ }
  }
  console.error('Playwright not found: npm i --no-save playwright (or set PLAYWRIGHT_MODULE)'); process.exit(2);
}
function ffmpegPath() {
  if (process.env.FFMPEG) return process.env.FFMPEG;
  if (spawnSync('ffmpeg', ['-version']).status === 0) return 'ffmpeg';
  const r = spawnSync('python3', ['-c', 'import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())']);
  return r.status === 0 ? r.stdout.toString().trim() : 'ffmpeg';
}

// a small static server: the engine bakes sticker edges on a canvas, which file:// would taint
const mounts = { '/engine/': path.join(here, '..', 'engine'), '/stickers/': path.join(cache, 'stickers'), '/media/': media };
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.gif': 'image/gif' };
const server = http.createServer((req, res) => {
  const u = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const m = Object.keys(mounts).find((k) => u.startsWith(k));
  const f = m && path.resolve(mounts[m], '.' + u.slice(m.length - 1));
  if (!f || !f.startsWith(path.resolve(mounts[m])) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': types[path.extname(f).toLowerCase()] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;

const { chromium } = loadPlaywright();
const exe = process.env.CHROMIUM_PATH || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const browser = await chromium.launch(exe ? { executablePath: exe } : {});
async function openPage() {
  const page = await browser.newPage({ viewport: { width: Math.round(1080 * scale), height: Math.round(1920 * scale) } });
  page.on('pageerror', (e) => console.error('engine error:', e.message));
  page.on('console', (m) => { if (m.type() === 'error') console.error('engine:', m.text()); });
  await page.goto(`${base}/engine/reel.html`);
  const info = await page.evaluate(async ([r, v, s]) => {
    const st = document.getElementById('stage'); st.style.transform = `scale(${s})`;
    return window.REEL.load(r, v, { stickers: '/stickers/', media: '/media/' });
  }, [reel, voice, scale]);
  return { page, info };
}

const first = await openPage();
const info = first.info;
const fps = +(args.fps || info.fps || 30);
fs.writeFileSync(path.join(out, 'timing.json'), JSON.stringify({ ...info, fps, meta: reel.meta }, null, 1));
console.log(`reel: ${info.shots.length} shots, ${info.total.toFixed(1)}s, ${(info.shots.length / info.total * 60).toFixed(0)} cuts/min`);
const ff = ffmpegPath();

if (args.stills) {
  const files = [];
  for (const s of info.shots) {
    const t = s.t0 + (s.t1 - s.t0) * 0.75;
    await first.page.evaluate((tt) => window.REEL.seek(tt), t);
    const f = path.join(out, `still_${String(s.i).padStart(2, '0')}.png`);
    await first.page.screenshot({ path: f });
    files.push(f);
  }
  const cols = 6, rows = Math.ceil(files.length / cols);
  const inputs = files.flatMap((f) => ['-i', f]);
  const pad = Array.from({ length: cols * rows - files.length }, () => `color=c=black:s=${Math.round(1080 * scale)}x${Math.round(1920 * scale)}:d=1`);
  const filt = files.map((_, i) => `[${i}]scale=270:-1[s${i}]`).concat(pad.map((p, i) => `${p},scale=270:-1[s${files.length + i}]`));
  const all = Array.from({ length: cols * rows }, (_, i) => `[s${i}]`).join('');
  spawnSync(ff, ['-v', 'error', '-y', ...inputs, '-filter_complex', `${filt.join(';')};${all}xstack=inputs=${cols * rows}:layout=${Array.from({ length: cols * rows }, (_, i) => `${(i % cols) * 270}_${Math.floor(i / cols) * 480}`).join('|')}`, '-frames:v', '1', path.join(out, 'contact.jpg')], { stdio: 'inherit' });
  console.log(`stills + contact.jpg in ${out}`);
  await browser.close(); server.close(); process.exit(0);
}

// ---------- frames, in parallel ----------
const t0 = +(args.from || 0), t1 = Math.min(info.total, +(args.to || info.total));
const n = Math.round((t1 - t0) * fps);
const workers = Math.max(1, +(args.workers || 4));
const per = Math.ceil(n / workers);
const started = Date.now();
let done = 0;
async function work(k) {
  const { page } = k === 0 ? first : await openPage();
  const a = k * per, b = Math.min(n, a + per);
  if (a >= b) return null;
  const seg = path.join(out, `_seg${k}.mp4`);
  const enc = spawn(ff, ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-', '-vf', 'scale=1080:1920:flags=lanczos', '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', String(fps), seg], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let f = a; f < b; f++) {
    await page.evaluate((tt) => window.REEL.seek(tt), t0 + f / fps);
    const buf = await page.screenshot({ type: 'jpeg', quality: 92 });
    if (!enc.stdin.write(buf)) await new Promise((r) => enc.stdin.once('drain', r));
    if (++done % 60 === 0) process.stdout.write(`\r  ${done}/${n} frames  ${((Date.now() - started) / 1000).toFixed(0)}s`);
  }
  enc.stdin.end();
  await new Promise((r) => enc.on('close', r));
  return seg;
}
const segs = (await Promise.all(Array.from({ length: workers }, (_, k) => work(k)))).filter(Boolean);
await browser.close(); server.close();
console.log(`\r  ${n} frames in ${((Date.now() - started) / 1000).toFixed(0)}s            `);
const list = path.join(out, '_segs.txt');
fs.writeFileSync(list, segs.map((s) => `file '${s}'`).join('\n'));
const silent = path.join(out, '_video.mp4');
spawnSync(ff, ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', silent], { stdio: 'inherit' });
segs.forEach((s) => fs.rmSync(s, { force: true })); fs.rmSync(list, { force: true });

// ---------- sound: narration, original score ducked under it, sound effects ----------
const final = path.join(out, args.name || 'reel.mp4');
const inputs = ['-i', silent];
const filters = [];
let music = false;
if (!args['no-music']) {
  const r = spawnSync('python3', [path.join(here, 'audio.py'), path.join(out, 'timing.json'), '--out', out], { stdio: 'inherit' });
  if (r.status === 0) { inputs.push('-i', path.join(out, 'score.wav'), '-i', path.join(out, 'sfx.wav')); music = true; }
}
const vo = [];
if (voice) info.lines.forEach((l, i) => {
  const at = l.t0 - t0;
  if (at < -0.01 || at > t1 - t0) return;
  inputs.push('-i', path.join(voDir, voice.lines[i].file));
  vo.push({ idx: inputs.filter((x) => x === '-i').length - 1, ms: Math.max(0, Math.round(at * 1000)) });
});
if (vo.length) {
  vo.forEach((v, k) => filters.push(`[${v.idx}:a]aresample=48000,adelay=${v.ms}|${v.ms}[v${k}]`));
  filters.push(`${vo.map((_, k) => `[v${k}]`).join('')}amix=inputs=${vo.length}:normalize=0,highpass=f=70,acompressor=threshold=0.12:ratio=3:attack=5:release=120,volume=1.35[vo]`);
}
let mapA = null;
if (music && vo.length) {
  filters.push('[vo]asplit=2[vo1][vo2]', '[1:a]aresample=48000,volume=0.42[m]', '[m][vo2]sidechaincompress=threshold=0.03:ratio=5:attack=20:release=350[md]', '[2:a]aresample=48000,volume=0.5[fx]', '[md][vo1][fx]amix=inputs=3:normalize=0,alimiter=limit=0.95[a]');
  mapA = '[a]';
} else if (vo.length) mapA = '[vo]';
else if (music) { filters.push('[1:a][2:a]amix=inputs=2:normalize=0[a]'); mapA = '[a]'; }
const cmd = ['-v', 'error', '-y', ...inputs];
if (filters.length) cmd.push('-filter_complex', filters.join(';'));
cmd.push('-map', '0:v');
if (mapA) cmd.push('-map', mapA, '-c:a', 'aac', '-b:a', '192k', '-ar', '48000');
cmd.push('-c:v', 'copy', '-t', String(t1 - t0), '-movflags', '+faststart', final);
const mux = spawnSync(ff, cmd, { stdio: 'inherit' });
if (mux.status !== 0) { console.error('mux failed; silent video kept at', silent); process.exit(1); }
fs.rmSync(silent, { force: true });
console.log(`done: ${final}`);
