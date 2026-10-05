/**
 * The Earth: an equirectangular texture painted from Natural Earth land
 * polygons (world-atlas), with a land mask the simulation uses to decide
 * when an imager has land under it.
 */
import { feature } from 'topojson-client';
import { geoEquirectangular, geoPath, geoGraticule10 } from 'd3-geo';
import type { Topology, GeometryCollection } from 'topojson-specification';
import landUrl from 'world-atlas/land-110m.json?url';

import type { EarthMaps } from './landmask';
export type { EarthMaps };

let cache: Promise<EarthMaps> | null = null;

export function loadEarth(): Promise<EarthMaps> {
  if (cache) return cache;
  cache = fetch(landUrl).then((r) => r.json()).then((topo: Topology) => {
    const land = feature(topo, topo.objects.land as GeometryCollection);
    const W = 2048, H = 1024;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const g = cv.getContext('2d')!;
    const proj = geoEquirectangular().scale(W / (2 * Math.PI)).translate([W / 2, H / 2]);
    const path = geoPath(proj, g);
    // ocean: deep blue, a little lighter in the tropics
    const oc = g.createLinearGradient(0, 0, 0, H);
    oc.addColorStop(0, '#0d2340'); oc.addColorStop(0.5, '#123c6b'); oc.addColorStop(1, '#0d2340');
    g.fillStyle = oc; g.fillRect(0, 0, W, H);
    // land
    g.fillStyle = '#4f6b3a';
    g.beginPath(); path(land); g.fill();
    // shade land by latitude: desert belts, green tropics, tundra, ice
    g.save();
    g.beginPath(); path(land); g.clip();
    const lg = g.createLinearGradient(0, 0, 0, H);
    const stops: [number, string][] = [[0, '#eef2f5'], [0.1, '#e6ebee'], [0.16, '#8a8f78'], [0.24, '#5f7a45'], [0.32, '#6f7d48'], [0.38, '#b39b6a'], [0.44, '#9a8a58'], [0.5, '#3f6e33'], [0.56, '#4d7a38'], [0.62, '#b8a070'], [0.7, '#7d8a52'], [0.8, '#6b7650'], [0.88, '#dfe6ea'], [1, '#f2f5f7']];
    for (const [o, c] of stops) lg.addColorStop(o, c);
    g.globalAlpha = 0.85; g.fillStyle = lg; g.fillRect(0, 0, W, H);
    g.globalAlpha = 1;
    // a little mottling so it does not look flat
    for (let i = 0; i < 9000; i++) {
      const x = Math.random() * W, y = Math.random() * H;
      g.fillStyle = `rgba(${Math.random() < 0.5 ? '30,40,20' : '200,190,150'},${Math.random() * 0.08})`;
      g.fillRect(x, y, 3 + Math.random() * 8, 2 + Math.random() * 5);
    }
    g.restore();
    // Antarctica and the Arctic ice
    g.fillStyle = 'rgba(240,245,250,0.9)';
    g.fillRect(0, H * 0.945, W, H * 0.06);
    g.fillStyle = 'rgba(235,242,248,0.55)';
    g.fillRect(0, 0, W, H * 0.03);
    g.strokeStyle = 'rgba(200,220,240,0.35)'; g.lineWidth = 1.2;
    g.beginPath(); path(land); g.stroke();
    // a faint graticule, for reading latitude and longitude
    g.strokeStyle = 'rgba(255,255,255,0.06)'; g.lineWidth = 1;
    g.beginPath(); path(geoGraticule10()); g.stroke();
    // land mask at 1°
    const mw = 360, mh = 180;
    const mc = document.createElement('canvas'); mc.width = mw; mc.height = mh;
    const mg = mc.getContext('2d')!;
    const mp = geoPath(geoEquirectangular().scale(mw / (2 * Math.PI)).translate([mw / 2, mh / 2]), mg);
    mg.fillStyle = '#000'; mg.fillRect(0, 0, mw, mh);
    mg.fillStyle = '#fff'; mg.beginPath(); mp(land); mg.fill();
    const px = mg.getImageData(0, 0, mw, mh).data;
    const mask = new Uint8Array(mw * mh);
    for (let i = 0; i < mask.length; i++) mask[i] = px[i * 4] > 127 ? 1 : 0;
    return { day: cv, mask, mw, mh };
  });
  return cache;
}

export { isLand } from './landmask';
