/**
 * Write the epic cut of the Gita reel to a vertical video file.
 *
 *   node scripts/render-gita-epic.mjs [out.mp4] [audio.wav] [fps]
 *
 * The page needs to fetch its images and timeline, so it is served over a
 * little local HTTP server rather than opened from disk. Without an audio
 * argument the page's own voice track is used; the published reel was muxed
 * with a full mix that also carries music the user supplied, which is not in
 * this repository.
 */
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const FF = process.env.FFMPEG || '/usr/local/lib/python3.11/dist-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2';
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');
const out = process.argv[2] || 'gita-epic.mp4';
const fps = Number(process.argv[4] || 30);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.webp': 'image/webp', '.css': 'text/css', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg' };
const server = http.createServer((req, res) => {
  const p = path.join(root, decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(root) || !fs.existsSync(p)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': types[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const port = server.address().port;

const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 400, height: 300 } });
p.on('pageerror', (e) => { throw e; });
await p.goto(`http://127.0.0.1:${port}/gita-epic/index.html?render`);
const { duration, W, H } = await p.evaluate(async () => { await window.EPIC.ready; const c = document.createElement('canvas'); c.width = window.EPIC.W; c.height = window.EPIC.H; window.__c = c; window.__g = c.getContext('2d'); return { duration: window.EPIC.DURATION, W: c.width, H: c.height }; });

let audio = process.argv[3];
if (!audio) {
  audio = path.join(root, 'gita-epic', 'audio', 'voice.mp3');
}
const ff = spawn(FF, ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', 'pipe:0', '-i', audio,
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '19', '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
  '-af', 'loudnorm=I=-14:TP=-1.0', '-c:a', 'aac', '-b:a', '192k', '-shortest', out], { stdio: ['pipe', 'inherit', 'inherit'] });
const total = Math.round(duration * fps);
const t0 = Date.now();
for (let i = 0; i < total; i++) {
  const url = await p.evaluate((t) => { window.__g.setTransform(1, 0, 0, 1, 0, 0); window.EPIC.frame(window.__g, t); return window.__c.toDataURL('image/jpeg', 0.93); }, i / fps);
  if (!ff.stdin.write(Buffer.from(url.split(',')[1], 'base64'))) await new Promise((r) => ff.stdin.once('drain', r));
  if (i % fps === 0) process.stdout.write(`\r  ${i}/${total} frames  ${((Date.now() - t0) / 1000).toFixed(0)}s   `);
}
ff.stdin.end();
await new Promise((r) => ff.on('close', r));
console.log(`\nwrote ${out} (${W}×${H}, ${(fs.statSync(out).size / 1e6).toFixed(1)} MB)`);
await b.close();
server.close();
