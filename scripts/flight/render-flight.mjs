#!/usr/bin/env node
/*
 * Render "Hanuman in Flight" to video, frame by frame.
 *
 *   node scripts/flight/render-flight.mjs --out film.mp4 [--fps 24] [--width 1280] [--from 0] [--to 38]
 *        [--url http://localhost:5173/] [--audio flight-audio.wav]
 *
 * Needs the dev server running (npm run dev), Playwright with Chromium
 * (CHROMIUM_PATH to override), and ffmpeg (or pip install imageio-ffmpeg).
 * Each frame is rendered deterministically with window.__flight.renderAt(t),
 * a title card is drawn on top where it belongs, and frames are piped to
 * ffmpeg as JPEGs.
 */
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, all) => { if (a.startsWith('--')) acc.push([a.slice(2), all[i + 1] && !all[i + 1].startsWith('--') ? all[i + 1] : true]); return acc; }, []));
const out = args.out || 'hanuman-in-flight.mp4';
const fps = +(args.fps || 24), W = +(args.width || 1280), H = Math.round(W * 9 / 16);
const url = (args.url || 'http://localhost:5173/') + '?fq=high';
const require = createRequire(path.join(process.cwd(), 'package.json'));
const { chromium } = require('playwright');
const ff = process.env.FFMPEG || (() => { const r = spawnSync('python3', ['-c', 'import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())']); return r.status === 0 ? r.stdout.toString().trim() : 'ffmpeg'; })();
const exe = process.env.CHROMIUM_PATH || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const browser = await chromium.launch({ ...(exe ? { executablePath: exe } : {}), args: ['--use-gl=angle', '--ignore-gpu-blocklist', ...(process.env.SWIFTSHADER ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] : [])] });
const page = await browser.newPage({ viewport: { width: W, height: H } });
page.on('pageerror', (e) => console.error('page error:', e.message));
await page.goto(url, { waitUntil: 'networkidle' });
await page.getByText('Effects', { exact: true }).click();
await page.locator('.shelf__card', { hasText: 'Hanuman in Flight' }).first().click();
await page.waitForFunction(() => window.__flight, null, { timeout: 300000 });
await page.evaluate(() => { window.__flight.stop(); document.querySelectorAll('.fl-top,.fl-bar,.fl-shot').forEach((e) => (e.style.display = 'none')); });
const duration = await page.evaluate(() => window.__flight.duration);
const t0 = +(args.from || 0), t1 = Math.min(duration, +(args.to || duration));

const silent = out.replace(/\.mp4$/, '') + '.video.mp4';
const enc = spawn(ff, ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', silent], { stdio: ['pipe', 'inherit', 'inherit'] });
const n = Math.round((t1 - t0) * fps), started = Date.now();
for (let f = 0; f < n; f++) {
  const t = t0 + f / fps;
  const data = await page.evaluate(([tt, dur]) => {
    window.__flight.renderAt(tt);
    const gl = document.querySelector('.fl-canvas');
    let c = window.__cap;
    if (!c) { c = window.__cap = document.createElement('canvas'); }
    c.width = gl.width; c.height = gl.height;
    const x = c.getContext('2d');
    x.drawImage(gl, 0, 0);
    // title cards: the name at the start, the source at the end
    const card = (main, sub, a) => {
      if (a <= 0) return;
      x.save(); x.globalAlpha = a; x.textAlign = 'center'; x.shadowColor = 'rgba(0,0,0,0.6)'; x.shadowBlur = c.height * 0.02;
      x.fillStyle = '#f6e7c8'; x.font = `600 ${Math.round(c.height * 0.075)}px Cinzel, Georgia, serif`; x.fillText(main, c.width / 2, c.height * 0.46);
      x.fillStyle = '#f2c46d'; x.font = `italic ${Math.round(c.height * 0.032)}px 'Cormorant Garamond', Georgia, serif`; x.fillText(sub, c.width / 2, c.height * 0.535);
      x.restore();
    };
    const fade = (a, b, tt2) => Math.max(0, Math.min(1, Math.min((tt2 - a) / 0.8, (b - tt2) / 0.8)));
    card('HANUMAN IN FLIGHT', 'across the ocean, on the way to Lanka', fade(0.4, 4.2, tt));
    card('SUNDARA KANDA', 'after the Ramayana of Valmiki', fade(dur - 4.2, dur + 1, tt));
    // fade in from and out to black
    const fb = Math.max(0, 1 - tt / 0.8, 1 - (dur - tt) / 1.0);
    if (fb > 0) { x.fillStyle = `rgba(0,0,0,${fb})`; x.fillRect(0, 0, c.width, c.height); }
    return c.toDataURL('image/jpeg', 0.94);
  }, [t, duration]);
  if (!enc.stdin.write(Buffer.from(data.slice(data.indexOf(',') + 1), 'base64'))) await new Promise((r) => enc.stdin.once('drain', r));
  if (f % fps === 0) console.log(`frame ${f}/${n}  ${((Date.now() - started) / 1000).toFixed(0)}s`);
}
enc.stdin.end();
await new Promise((r) => enc.on('close', r));
await browser.close();

if (args.audio && fs.existsSync(args.audio)) {
  const r = spawnSync(ff, ['-v', 'error', '-y', '-i', silent, '-i', args.audio, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', out], { stdio: 'inherit' });
  if (r.status === 0) fs.rmSync(silent);
} else fs.renameSync(silent, out);
console.log('done:', out);
