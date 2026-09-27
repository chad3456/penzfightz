/**
 * Render the Krishna and Arjuna busts for the epic cut of the Gita reel.
 *
 *   node scripts/render-busts.mjs [shots.json] [outDir]
 *
 * public/bust3d/bust.js builds each bust in three.js — Lee Perry-Smith's head
 * scan (CC BY 3.0), retoned and dressed with crown, hair, tilak and ornaments —
 * and renders one transparent WebP per shot in the list. The page imports
 * three from node_modules through an import map, so it is served from the repo
 * root by a small static server, the way render-gita-epic.mjs serves public/.
 * Software GL is slow: allow a minute or so a shot.
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const shots = JSON.parse(fs.readFileSync(process.argv[2] || path.join(root, 'public/bust3d/shots.json'), 'utf8'));
const outDir = process.argv[3] || path.join(root, 'public/gita-epic/img');
fs.mkdirSync(outDir, { recursive: true });

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.glb': 'model/gltf-binary', '.jpg': 'image/jpeg', '.png': 'image/png' };
const server = http.createServer((req, res) => {
  const p = path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(root) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const port = server.address().port;

const b = await chromium.launch({
  executablePath: process.env.CHROME || '/opt/pw-browsers/chromium',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const p = await b.newPage({ viewport: { width: 400, height: 400 } });
p.on('pageerror', (e) => console.log('page error:', e.message));
await p.goto(`http://127.0.0.1:${port}/public/bust3d/bust.html`);
await p.waitForFunction(() => window.__done, null, { timeout: 300000 });
for (const s of shots) {
  const t0 = Date.now();
  const url = await p.evaluate((s) => window.BUST.render(s), s);
  const file = path.join(outDir, `${s.name}.${(s.format || 'image/png').split('/')[1]}`);
  fs.writeFileSync(file, Buffer.from(url.split(',')[1], 'base64'));
  console.log(path.relative(root, file), `${((Date.now() - t0) / 1000).toFixed(1)} s`);
}
await b.close();
server.close();
