/**
 * Render one of the standalone page films in public/ to a video file.
 *
 * Both films are plain pages that expose `{ DURATION, frame, synth, wavBytes }`
 * on a global, and in both every frame is a pure function of its timestamp.
 * So frame n is simply asked for at n / fps — nothing runs in real time and
 * nothing can drop — and the sound is the very buffer the page itself plays,
 * written straight to a WAV, so the file and the browser hear the same thing.
 *
 * Frames go into ffmpeg down a pipe as JPEGs rather than onto disk, because a
 * couple of minutes of 1080p PNGs is several gigabytes.
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const FF = process.env.FFMPEG
  || '/usr/local/lib/python3.11/dist-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2';

export async function renderPageFilm({ dir, global, out, height = 1080, fps = 30 }) {
  const width = Math.round((height * 16) / 9);
  const here = path.dirname(fileURLToPath(import.meta.url));
  const page = pathToFileURL(path.join(here, '..', 'public', dir, 'index.html')).href + '?render';

  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 400, height: 300 } });
  p.on('pageerror', (e) => { throw e; });
  await p.goto(page, { waitUntil: 'load' });

  const duration = await p.evaluate(({ W, H, G }) => {
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    window.__c = c;
    window.__g = c.getContext('2d');
    window.__film = window[G];
    return window.__film.DURATION;
  }, { W: width, H: height, G: global });

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), `${dir}-`));
  const wav = path.join(tmp, 'score.wav');
  const b64 = await p.evaluate(async () => {
    const s = await window.__film.synth(48000);
    const bytes = window.__film.wavBytes(s.L, s.R, s.sr);
    let bin = '';
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(bin);
  });
  fs.writeFileSync(wav, Buffer.from(b64, 'base64'));
  console.log('score →', wav);

  const ff = spawn(FF, [
    '-hide_banner', '-loglevel', 'error', '-y',
    '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', 'pipe:0',
    '-i', wav,
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart', '-c:a', 'aac', '-b:a', '192k', '-shortest',
    out,
  ], { stdio: ['pipe', 'inherit', 'inherit'] });

  const total = Math.round(duration * fps);
  const t0 = Date.now();
  for (let i = 0; i < total; i++) {
    const url = await p.evaluate(({ t, W }) => {
      const g = window.__g;
      g.setTransform(W / 1920, 0, 0, W / 1920, 0, 0);
      window.__film.frame(g, t);
      return window.__c.toDataURL('image/jpeg', 0.94);
    }, { t: i / fps, W: width });
    const buf = Buffer.from(url.split(',')[1], 'base64');
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if (i % fps === 0) {
      const left = ((Date.now() - t0) / 1000 / Math.max(1, i)) * (total - i);
      process.stdout.write(`\r  ${i}/${total} frames  ${Math.round((i / total) * 100)}%  ${left.toFixed(0)}s left   `);
    }
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  process.stdout.write(`\r  ${total}/${total} frames in ${((Date.now() - t0) / 1000).toFixed(0)}s          \n`);
  await b.close();
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log('wrote', out, `(${(fs.statSync(out).size / 1e6).toFixed(1)} MB)`);
}
