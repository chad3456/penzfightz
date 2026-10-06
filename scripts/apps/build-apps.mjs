// Wraps the standalone apps in apps/<name>/<name>.html (written as claude.ai
// artifacts: page content only, three.js from a CDN) into full pages under
// public/apps/<name>/ for the main site, with three.js served from
// public/vendor/three so they work offline. Run: node scripts/apps/build-apps.mjs
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const V = '0.185.1';
const vendor = path.join(root, 'public/vendor/three');
const copy = (from, to) => { fs.mkdirSync(path.dirname(to), { recursive: true }); fs.copyFileSync(from, to); };
const nm = (p) => path.join(root, 'node_modules/three', p);
copy(nm('build/three.module.js'), path.join(vendor, 'build/three.module.js'));
copy(nm('build/three.core.js'), path.join(vendor, 'build/three.core.js'));
copy(nm('examples/jsm/controls/OrbitControls.js'), path.join(vendor, 'examples/jsm/controls/OrbitControls.js'));
copy(nm('examples/jsm/environments/RoomEnvironment.js'), path.join(vendor, 'examples/jsm/environments/RoomEnvironment.js'));
copy(nm('LICENSE'), path.join(vendor, 'LICENSE'));
const head = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font:14px system-ui,-apple-system,"Segoe UI",sans-serif;background:#f6f5f2}img{max-width:100%}[hidden]{display:none!important}</style></head><body>';
for (const name of ['ghar-624', 'almari-studio']) {
  let src = fs.readFileSync(path.join(root, 'apps', name, `${name}.html`), 'utf8');
  src = src.split(`https://cdn.jsdelivr.net/npm/three@${V}/build/`).join('/vendor/three/build/').split(`https://cdn.jsdelivr.net/npm/three@${V}/examples/jsm/`).join('/vendor/three/examples/jsm/');
  if (src.includes('cdn.jsdelivr.net/npm/three')) throw new Error(`${name}: three version is not ${V}`);
  const out = path.join(root, 'public/apps', name, 'index.html');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, head + src + '</body></html>\n');
  console.log('wrote', path.relative(root, out));
}
