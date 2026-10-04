#!/usr/bin/env node
/*
 * Render a storyboard to video with the engine.
 *
 *   node render.mjs --storyboard SB.json --style STYLE.json --out DIR
 *        [--vo DIR] [--width 1280] [--fps 30] [--stills] [--from S --to S] [--no-music] [--key D]
 *
 * --stills   write one PNG per scene (at 60% of the scene) and stop: use it to
 *            check the look before spending minutes on a full render
 * --vo       folder written by voice.py; scenes stretch to fit their narration
 *
 * Needs: Playwright (npm i -D playwright, or set PLAYWRIGHT_MODULE to its
 * path), a Chromium (Playwright's, or CHROMIUM_PATH), ffmpeg (on PATH, or
 * pip install imageio-ffmpeg) and python3 with numpy for the score.
 */
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, all) => {
  if (a.startsWith('--')) acc.push([a.slice(2), all[i + 1] && !all[i + 1].startsWith('--') ? all[i + 1] : true]);
  return acc;
}, []));
const need = (k) => { if (!args[k]) { console.error(`missing --${k}`); process.exit(2); } return args[k]; };

const sb = JSON.parse(fs.readFileSync(need('storyboard'), 'utf8'));
const style = JSON.parse(fs.readFileSync(need('style'), 'utf8'));
const outDir = need('out');
fs.mkdirSync(outDir, { recursive: true });
const fps = +(args.fps || sb.meta?.fps || 30);
sb.meta = Object.assign({ width: 1280 }, sb.meta, args.width ? { width: +args.width } : {});
const voDir = args.vo && args.vo !== true ? args.vo : null;
const narration = voDir && fs.existsSync(path.join(voDir, 'narration.json')) ? JSON.parse(fs.readFileSync(path.join(voDir, 'narration.json'), 'utf8')) : null;

function loadPlaywright() {
  const tries = [process.env.PLAYWRIGHT_MODULE, path.join(process.cwd(), 'package.json'), path.join(here, 'package.json')].filter(Boolean);
  for (const t of tries) {
    try { return createRequire(t.endsWith('.json') ? t : path.join(t, 'x.js'))('playwright'); } catch { /* next */ }
    try { return createRequire(t)(t); } catch { /* next */ }
  }
  console.error('Playwright not found. Run `npm i -D playwright` in your project (or set PLAYWRIGHT_MODULE).');
  process.exit(2);
}
function ffmpegPath() {
  if (process.env.FFMPEG) return process.env.FFMPEG;
  const r = spawnSync('python3', ['-c', 'import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())']);
  if (r.status === 0) return r.stdout.toString().trim();
  return 'ffmpeg';
}

const { chromium } = loadPlaywright();
const exe = process.env.CHROMIUM_PATH || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const browser = await chromium.launch(exe ? { executablePath: exe } : {});
const page = await browser.newPage({ viewport: { width: sb.meta.width, height: Math.round(sb.meta.width * 9 / 16) } });
page.on('pageerror', (e) => console.error('engine error:', e.message));
await page.goto(pathToFileURL(path.join(here, '..', 'engine', 'engine.html')).href);
await page.evaluate(() => document.fonts.load("800 40px Rubik").then(() => document.fonts.load("500 40px Rubik")));
const timing = await page.evaluate(([s, st, n]) => window.VR.load(s, st, n), [sb, style, narration]);
fs.writeFileSync(path.join(outDir, 'timing.json'), JSON.stringify(timing, null, 1));
console.log(`film: ${timing.scenes.length} scenes, ${timing.total.toFixed(1)}s`);

if (args.stills) {
  for (const s of timing.scenes) {
    const t = s.start + s.dur * 0.6;
    const url = await page.evaluate((tt) => { window.VR.frame(tt); return document.getElementById('c').toDataURL('image/png'); }, t);
    fs.writeFileSync(path.join(outDir, `still_${s.id}.png`), Buffer.from(url.split(',')[1], 'base64'));
  }
  console.log(`stills written to ${outDir}`);
  await browser.close();
  process.exit(0);
}

const ff = ffmpegPath();
const silent = path.join(outDir, '_video.mp4');
const t0 = +(args.from || 0), t1 = Math.min(timing.total, +(args.to || timing.total));
const enc = spawn(ff, ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p', silent], { stdio: ['pipe', 'inherit', 'inherit'] });
const n = Math.round((t1 - t0) * fps);
const started = Date.now();
for (let f = 0; f < n; f++) {
  const url = await page.evaluate((tt) => { window.VR.frame(tt); return document.getElementById('c').toDataURL('image/jpeg', 0.93); }, t0 + f / fps);
  if (!enc.stdin.write(Buffer.from(url.slice(url.indexOf(',') + 1), 'base64'))) await new Promise((r) => enc.stdin.once('drain', r));
  if (f % (fps * 5) === 0) process.stdout.write(`\r  frame ${f}/${n}  ${((Date.now() - started) / 1000).toFixed(0)}s`);
}
enc.stdin.end();
await new Promise((r) => enc.on('close', r));
await browser.close();
console.log(`\r  ${n} frames in ${((Date.now() - started) / 1000).toFixed(0)}s`);

// sound: original score, narration on top, music ducked under the voice
const final = path.join(outDir, args.name || 'film.mp4');
const inputs = ['-i', silent];
const filters = [];
let haveMusic = false;
if (!args['no-music']) {
  const score = path.join(outDir, 'score.wav');
  const r = spawnSync('python3', [path.join(here, 'music.py'), path.join(outDir, 'timing.json'), '--out', score, '--key', String(args.key || 'D')], { stdio: 'inherit' });
  if (r.status === 0) { inputs.push('-i', score); haveMusic = true; }
}
const voices = [];
if (narration) {
  for (const s of timing.scenes) {
    const c = narration.clips[s.id];
    if (!c || !c.file) continue;
    const at = s.start + (sb.meta.voOffset ?? 0.35) - t0;
    if (at < 0 || at > t1 - t0) continue;
    inputs.push('-i', path.join(voDir, c.file));
    voices.push({ idx: inputs.filter((x) => x === '-i').length - 1, ms: Math.round(at * 1000) });
  }
}
if (voices.length) {
  voices.forEach((v, k) => filters.push(`[${v.idx}:a]adelay=${v.ms}|${v.ms},volume=1.0[v${k}]`));
  filters.push(`${voices.map((_, k) => `[v${k}]`).join('')}amix=inputs=${voices.length}:normalize=0[vo]`);
}
let mapA = null;
if (haveMusic && voices.length) {
  filters.push('[vo]asplit=2[vo1][vo2]', '[1:a]volume=0.55[m]', '[m][vo2]sidechaincompress=threshold=0.02:ratio=6:attack=30:release=500[md]', '[md][vo1]amix=inputs=2:normalize=0[a]');
  mapA = '[a]';
} else if (voices.length) mapA = '[vo]';
else if (haveMusic) mapA = '1:a';
const cmd = ['-v', 'error', '-y', ...inputs];
if (filters.length) cmd.push('-filter_complex', filters.join(';'));
cmd.push('-map', '0:v');
if (mapA) cmd.push('-map', mapA, '-c:a', 'aac', '-b:a', '192k');
cmd.push('-c:v', 'copy', '-t', String(t1 - t0), final);
const mux = spawnSync(ff, cmd, { stdio: 'inherit' });
if (mux.status !== 0) { console.error('mux failed; silent video kept at', silent); process.exit(1); }
fs.rmSync(silent, { force: true });
console.log(`done: ${final}`);
