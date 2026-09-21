/**
 * Write the long one out to a file.
 *
 *   node scripts/render-frieze.mjs [out.mp4] [width] [fps]
 *
 * Every frame is a pure function of its timestamp, so this asks for frame n at
 * n/fps and never runs the film in real time. Two and three quarter minutes is
 * about four thousand frames; it takes as long as it takes.
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { score, writeWav } from './frieze-score.mjs';

const OUT = process.argv[2] || 'the-ramayana-one-page.mp4';
const W = Number(process.argv[3] || 1280);
const H = Math.round((W * 9) / 16);
const FPS = Number(process.argv[4] || 24);
const ORIGIN = process.env.FILM_ORIGIN || 'http://127.0.0.1:5181';
const FF = process.env.FFMPEG
  || '/usr/local/lib/python3.11/dist-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2';

const tmp = fs.mkdtempSync(path.join(process.env.TMPDIR || '/tmp', 'frieze-'));
console.log('frames →', tmp, `${W}x${H} @${FPS}`);

const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 400, height: 300 } });
p.on('pageerror', (e) => { throw e; });
await p.goto(ORIGIN, { waitUntil: 'networkidle' });

const duration = await p.evaluate(async ([W, H]) => {
  const { Reel, DURATION } = await import('/src/frieze/camera.ts');
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  window.__g = c.getContext('2d');
  window.__c = c;
  window.__reel = new Reel(W, H);
  return DURATION;
}, [W, H]);

const total = Math.round(duration * FPS);
const t0 = Date.now();
for (let i = 0; i < total; i++) {
  const url = await p.evaluate((t) => {
    window.__reel.frame(window.__g, t);
    return window.__c.toDataURL('image/png');
  }, i / FPS);
  fs.writeFileSync(path.join(tmp, `f${String(i).padStart(5, '0')}.png`),
    Buffer.from(url.split(',')[1], 'base64'));
  if (i % 48 === 0) {
    const left = ((Date.now() - t0) / 1000 / Math.max(1, i)) * (total - i);
    process.stdout.write(`\r  ${i}/${total}  ${((i / total) * 100).toFixed(0)}%  ` +
      `${Math.round(left / 60)}m ${Math.round(left % 60)}s left    `);
  }
}
process.stdout.write(`\r  ${total}/${total} frames in ${((Date.now() - t0) / 1000 / 60).toFixed(1)} min        \n`);
await b.close();

const wav = path.join(tmp, 'score.wav');
writeWav(wav, score(duration));

execFileSync(FF, [
  '-hide_banner', '-loglevel', 'error', '-y',
  '-framerate', String(FPS), '-i', path.join(tmp, 'f%05d.png'),
  '-i', wav,
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '20',
  '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
  '-c:a', 'aac', '-b:a', '160k', '-shortest',
  OUT,
], { stdio: 'inherit' });

fs.rmSync(tmp, { recursive: true, force: true });
console.log('wrote', OUT, `(${(fs.statSync(OUT).size / 1e6).toFixed(1)} MB)`);
