/**
 * Shiva Loka's coastline: Natural Earth 1:50m land (public domain) from the
 * world-atlas package, clipped to 60–100°E, 4–38°N, simplified, written as
 * [lon, lat] rings. Needs world-atlas@2.0.2 and topojson-client@3.1.0 unpacked
 * beside it (npm pack); copy the output to src/shivaloka/land.json.
 */
import fs from 'node:fs';
import { feature } from './topojson-client-3.1.0/package/dist/topojson-client.js';
const topo = JSON.parse(fs.readFileSync('./world-atlas-2.0.2/package/land-50m.json', 'utf8'));
const land = feature(topo, topo.objects.land);
const [x0, y0, x1, y1] = [60, 4, 100, 38];
const clip = (ring) => {
  // Sutherland–Hodgman against the box
  const edges = [[(p) => p[0] >= x0, (a, b) => [x0, a[1] + (b[1] - a[1]) * (x0 - a[0]) / (b[0] - a[0])]], [(p) => p[0] <= x1, (a, b) => [x1, a[1] + (b[1] - a[1]) * (x1 - a[0]) / (b[0] - a[0])]], [(p) => p[1] >= y0, (a, b) => [a[0] + (b[0] - a[0]) * (y0 - a[1]) / (b[1] - a[1]), y0]], [(p) => p[1] <= y1, (a, b) => [a[0] + (b[0] - a[0]) * (y1 - a[1]) / (b[1] - a[1]), y1]]];
  let out = ring;
  for (const [inside, cut] of edges) { const inp = out; out = []; for (let i = 0; i < inp.length; i++) { const a = inp[(i + inp.length - 1) % inp.length], b = inp[i]; if (inside(b)) { if (!inside(a)) out.push(cut(a, b)); out.push(b); } else if (inside(a)) out.push(cut(a, b)); } if (!out.length) break; }
  return out;
};
const simplify = (pts, tol) => { // radial distance then Douglas-Peucker-lite
  const out = [pts[0]]; for (const p of pts) { const q = out[out.length - 1]; if (Math.hypot(p[0] - q[0], p[1] - q[1]) > tol) out.push(p); } return out;
};
const rings = [];
const geoms = land.features ? land.features.map((f) => f.geometry) : [land.geometry];
for (const g of geoms) for (const poly of (g.type === "Polygon" ? [g.coordinates] : g.coordinates)) {
  const r = clip(poly[0]);
  if (r.length < 4) continue;
  const s = simplify(r, 0.05).map(([x, y]) => [Math.round(x * 100) / 100, Math.round(y * 100) / 100]);
  let area = 0; for (let i = 0; i < s.length; i++) { const a = s[i], b = s[(i + 1) % s.length]; area += a[0] * b[1] - b[0] * a[1]; }
  if (Math.abs(area) / 2 < 0.02) continue;
  rings.push(s);
}
rings.sort((a, b) => b.length - a.length);
fs.writeFileSync('land.json', JSON.stringify(rings));
console.log(rings.length, rings.map((r) => r.length).slice(0, 10), fs.statSync('land.json').size);
