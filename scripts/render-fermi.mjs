/**
 * Write "Where is everybody?" out to a video file.
 *
 * The page plays the film live; this renders the same thing deterministically.
 * Every frame is a pure function of its timestamp, so frame n is simply asked
 * for at n / fps — nothing runs in real time and nothing can drop. The sound is
 * the very buffer the page plays: `FERMI.synth()` is called inside the page and
 * its samples are written straight to a WAV, so the file and the browser hear
 * exactly the same thing.
 *
 * Frames are piped into ffmpeg as JPEGs rather than written to disk, because a
 * minute of 1080p PNGs is the better part of a gigabyte.
 *
 *   node scripts/render-fermi.mjs [out.mp4] [height] [fps]
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const OUT = process.argv[2] || 'where-is-everybody.mp4';
const HEIGHT = Number(process.argv[3] || 1080);
const FPS = Number(process.argv[4] || 30);
const WIDTH = Math.round((HEIGHT * 16) / 9);

const FF = process.env.FFMPEG
  || '/usr/local/lib/python3.11/dist-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2';

const here = path.dirname(fileURLToPath(import.meta.url));
const page = pathToFileURL(path.join(here, '..', 'public', 'fermi', 'index.html')).href + '?render';

const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 400, height: 300 } });
p.on('pageerror', (e) => { throw e; });
await p.goto(page, { waitUntil: 'load' });

const DURATION = await p.evaluate(({ W, H }) => {
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  window.__c = c;
  window.__g = c.getContext('2d');
  return window.FERMI.DURATION;
}, { W: WIDTH, H: HEIGHT });

// ── the sound, from the page
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fermi-'));
const wav = path.join(tmp, 'score.wav');
const b64 = await p.evaluate(() => {
  const s = window.FERMI.synth(48000);
  const bytes = window.FERMI.wavBytes(s.L, s.R, s.sr);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(bin);
});
fs.writeFileSync(wav, Buffer.from(b64, 'base64'));
console.log('score →', wav);

// ── the pictures, straight into ffmpeg
const ff = spawn(FF, [
  '-hide_banner', '-loglevel', 'error', '-y',
  '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', 'pipe:0',
  '-i', wav,
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p',
  '-movflags', '+faststart', '-c:a', 'aac', '-b:a', '192k', '-shortest',
  OUT,
], { stdio: ['pipe', 'inherit', 'inherit'] });

const total = Math.round(DURATION * FPS);
const t0 = Date.now();
for (let i = 0; i < total; i++) {
  const url = await p.evaluate(({ t, W }) => {
    const g = window.__g;
    g.setTransform(W / 1920, 0, 0, W / 1920, 0, 0);
    window.FERMI.frame(g, t);
    return window.__c.toDataURL('image/jpeg', 0.94);
  }, { t: i / FPS, W: WIDTH });
  const buf = Buffer.from(url.split(',')[1], 'base64');
  if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
  if (i % FPS === 0) {
    const left = ((Date.now() - t0) / 1000 / Math.max(1, i)) * (total - i);
    process.stdout.write(`\r  ${i}/${total} frames  ${Math.round((i / total) * 100)}%  ${left.toFixed(0)}s left   `);
  }
}
ff.stdin.end();
await new Promise((r) => ff.on('close', r));
process.stdout.write(`\r  ${total}/${total} frames in ${((Date.now() - t0) / 1000).toFixed(0)}s          \n`);
await b.close();
fs.rmSync(tmp, { recursive: true, force: true });
console.log('wrote', OUT, `(${(fs.statSync(OUT).size / 1e6).toFixed(1)} MB)`);
