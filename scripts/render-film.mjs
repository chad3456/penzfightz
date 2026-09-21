/**
 * Write the film out to a file.
 *
 * The page renders it live; this renders it deterministically. Every frame is a
 * pure function of its timestamp, so the renderer simply asks for frame n at
 * n/fps and never has to run the film in real time or worry about dropping
 * anything. That property is the only reason this script is four lines of work
 * rather than a capture pipeline.
 *
 *   node scripts/render-film.mjs [out.mp4] [size] [fps]
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { score, writeWav } from './film-score.mjs';

const OUT = process.argv[2] || 'a-small-light-carried.mp4';
const SIZE = Number(process.argv[3] || 1080);
const FPS = Number(process.argv[4] || 24);
const ORIGIN = process.env.FILM_ORIGIN || 'http://127.0.0.1:5181';

const FF = process.env.FFMPEG
  || '/usr/local/lib/python3.11/dist-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2';

const tmp = fs.mkdtempSync(path.join(process.env.TMPDIR || '/tmp', 'film-'));
console.log('frames →', tmp);

const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 400, height: 400 } });
p.on('pageerror', (e) => { throw e; });
await p.goto(ORIGIN, { waitUntil: 'networkidle' });

const duration = await p.evaluate(async (SIZE) => {
  const { Projector, DURATION } = await import('/src/film/film.ts');
  const c = document.createElement('canvas');
  c.width = SIZE;
  c.height = SIZE;
  window.__g = c.getContext('2d');
  window.__c = c;
  window.__proj = new Projector(SIZE);
  return DURATION;
}, SIZE);

const total = Math.round(duration * FPS);
const t0 = Date.now();
for (let i = 0; i < total; i++) {
  const url = await p.evaluate((t) => {
    window.__proj.frame(window.__g, t);
    return window.__c.toDataURL('image/png');
  }, i / FPS);
  fs.writeFileSync(path.join(tmp, `f${String(i).padStart(5, '0')}.png`),
    Buffer.from(url.split(',')[1], 'base64'));
  if (i % 24 === 0) {
    const done = i / total;
    process.stdout.write(`\r  ${i}/${total} frames  ${(done * 100).toFixed(0)}%  ` +
      `${((Date.now() - t0) / 1000 / Math.max(1, i) * (total - i)).toFixed(0)}s left   `);
  }
}
process.stdout.write(`\r  ${total}/${total} frames in ${((Date.now() - t0) / 1000).toFixed(0)}s          \n`);
await b.close();

const wav = path.join(tmp, 'score.wav');
writeWav(wav, score(duration));
console.log('score →', wav);

execFileSync(FF, [
  '-hide_banner', '-loglevel', 'error', '-y',
  '-framerate', String(FPS), '-i', path.join(tmp, 'f%05d.png'),
  '-i', wav,
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '18',
  '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
  '-c:a', 'aac', '-b:a', '160k', '-shortest',
  OUT,
], { stdio: 'inherit' });

fs.rmSync(tmp, { recursive: true, force: true });
console.log('wrote', OUT, `(${(fs.statSync(OUT).size / 1e6).toFixed(1)} MB)`);
