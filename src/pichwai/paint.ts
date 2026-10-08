/**
 * Shared grounds and furniture for the pichwai films: the painted border of
 * lotus buds, skies at night, dawn and dusk, the ocean of milk, the field of
 * Kurukshetra, rows of cows, the kadamba and parijata trees, Kailasa, and
 * a devotee who can sit, bow and offer.
 */
import { C, PW, PH, type G, circle, ellipse, fs, line, rng, lotus, lotusLeaf, water, swirlP, nightSky, cloud, hills, tree, petals, glory, star4, dotsP, floretP, devText, lerp, clamp, sunDisc, mountain } from '../chalisa/kit';
import { draw, onGround, P, type Fig, type Look, type Pose } from '../chalisa/figures';
import { cow, chariot, fig, KRISHNA, ARJUNA } from './cast';

const ink = C.ink;

/** The painted border: a band of lotus buds on vermilion between gold rules. */
export function border(g: G, col = C.vermilion, w = 22) {
  g.save();
  g.beginPath(); g.rect(-60, -60, PW + 120, PH + 120); g.rect(w, w, PW - 2 * w, PH - 2 * w); g.fillStyle = col; g.fill('evenodd');
  g.strokeStyle = C.gold; g.lineWidth = 4; g.strokeRect(w, w, PW - 2 * w, PH - 2 * w);
  g.strokeStyle = ink; g.lineWidth = 1.4; g.strokeRect(w + 3, w + 3, PW - 2 * w - 6, PH - 2 * w - 6);
  const bud = (x: number, y: number, a: number) => { g.save(); g.translate(x, y); g.rotate(a); g.beginPath(); g.moveTo(0, 6); g.bezierCurveTo(-6, 0, -4, -6, 0, -8); g.bezierCurveTo(4, -6, 6, 0, 0, 6); fs(g, C.pink, null); g.fillStyle = C.green; g.fillRect(-1, 5, 2, 4); g.restore(); };
  for (let x = w + 16; x < PW - w; x += 30) { bud(x, w / 2, 0); bud(x + 15, PH - w / 2, Math.PI); }
  for (let y = w + 16; y < PH - w; y += 30) { bud(w / 2, y, -Math.PI / 2); bud(PW - w / 2, y + 15, Math.PI / 2); }
  g.restore();
}

/** A scalloped canopy (chandarvo) across the top of the painting. */
export function canopy(g: G, t: number, col = C.maroon, y = 0) {
  g.beginPath(); g.moveTo(-20, y - 20); g.lineTo(PW + 20, y - 20); g.lineTo(PW + 20, y + 54);
  for (let x = PW + 20; x > -20; x -= 80) g.quadraticCurveTo(x - 40, y + 104, x - 80, y + 54);
  g.closePath(); fs(g, floretP(g, col, 'rgba(255,200,120,0.35)', 22), ink, 3);
  for (let x = 20; x < PW; x += 80) { const sw = Math.sin(t * 1.6 + x) * 2; line(g, [[x + 20, y + 78], [x + 20 + sw, y + 106]], C.gold, 2); circle(g, x + 20 + sw, y + 110, 6, C.gold, ink, 1.2); }
}

export function night(g: G, t: number, seed = 3, stars = 80) {
  g.fillStyle = swirlP(g); g.fillRect(-600, -600, PW + 1200, PH + 1200);
  nightSky(g, t, seed, stars);
}
export function sky(g: G, top: string, mid: string, bot: string, y0 = 0, y1 = PH) {
  const gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, top); gr.addColorStop(0.55, mid); gr.addColorStop(1, bot);
  g.fillStyle = gr; g.fillRect(-600, -600, PW + 1200, PH + 1200);
}
export const dawn = (g: G) => sky(g, '#f6c47a', '#f7a26a', '#f3d6a8');
export const dusk = (g: G) => sky(g, '#3a2a6a', '#c8506a', '#f39a4a');
export const noon = (g: G) => sky(g, '#7ec3ee', '#b8dcf2', '#f6e3bc');

/** The ocean of milk: cream waves with pearls. */
export function milkOcean(g: G, y0: number, t: number) {
  const rows = 9;
  for (let r = 0; r < rows; r++) {
    const y = y0 + r * ((PH - y0) / rows) + 6;
    g.beginPath(); g.moveTo(-60, PH + 60);
    for (let x = -60; x <= PW + 60; x += 40) { const k = (x / 40 + r) % 2; g.lineTo(x, y + (k ? -10 : 0) + Math.sin(t * 1.2 + x * 0.02 + r) * 3); }
    g.lineTo(PW + 60, PH + 60); g.closePath();
    fs(g, r % 2 ? '#f8f1de' : '#efe4c6', 'rgba(170,150,110,0.6)', 1.6);
    for (let x = -40 + (r % 2) * 20; x < PW + 40; x += 80) { g.beginPath(); g.arc(x, y + 6, 9, Math.PI, 0); g.strokeStyle = 'rgba(120,150,190,0.6)'; g.lineWidth = 1.6; g.stroke(); }
  }
  const R = rng(19);
  for (let i = 0; i < 30; i++) { const x = R() * PW, y = y0 + 20 + R() * (PH - y0); circle(g, x, y, 3, C.white, 'rgba(150,130,100,0.6)', 1); }
}

/** The field of Kurukshetra at dusk. */
export function field(g: G, y: number, t: number, col = '#d6ae72') {
  const gr = g.createLinearGradient(0, y, 0, PH); gr.addColorStop(0, col); gr.addColorStop(1, '#9a6a3a');
  g.fillStyle = gr; g.fillRect(-600, y, PW + 1200, PH + 600);
  const R = rng(14);
  g.strokeStyle = 'rgba(110,64,30,0.35)'; g.lineWidth = 2;
  for (let i = 0; i < 50; i++) { const x = R() * PW, yy = y + 10 + R() * (PH - y); g.beginPath(); g.moveTo(x, yy); g.quadraticCurveTo(x + 16, yy - 4, x + 32, yy); g.stroke(); }
  void t;
}

/** A row of Vraja cows, some grazing, some looking up. */
export function cows(g: G, x0: number, x1: number, y: number, s: number, t: number, n = 5, seed = 4) {
  const R = rng(seed);
  for (let i = 0; i < n; i++) {
    const x = lerp(x0, x1, n === 1 ? 0.5 : i / (n - 1)) + (R() - 0.5) * 30;
    cow(g, x, y + (R() - 0.5) * 10, s * (0.9 + R() * 0.2), t + i, { face: R() > 0.5 ? 1 : -1, graze: R() > 0.5 ? 1 : 0, col: R() > 0.7 ? '#e9d2b0' : C.white, spot: R() > 0.5 ? '#c9874a' : '#8a5a3a' });
  }
}

/** The pārijāta: a heavenly tree heavy with white-and-orange flowers. */
export function parijata(g: G, x: number, y: number, s: number, t: number) {
  g.save(); g.translate(x, y); g.scale(s, s);
  line(g, [[0, 0], [-10, -160], [20, -300]], C.brown, 26, true);
  line(g, [[-6, -180], [-120, -280]], C.brown, 12, true); line(g, [[8, -220], [140, -300]], C.brown, 12, true);
  const R = rng(41);
  for (let i = 0; i < 60; i++) { const a = R() * Math.PI * 2, r = Math.sqrt(R()) * 200; ellipse(g, Math.cos(a) * r * 1.2, -320 + Math.sin(a) * r * 0.6, 30, 16, a + 0.6, i % 3 ? C.green : C.leaf, ink, 1.2); }
  for (let i = 0; i < 70; i++) { const a = R() * Math.PI * 2, r = R() * 200; const fx = Math.cos(a) * r * 1.2, fy = -320 + Math.sin(a) * r * 0.6; for (let k = 0; k < 5; k++) { const b = (k / 5) * Math.PI * 2; circle(g, fx + Math.cos(b) * 4, fy + Math.sin(b) * 4, 3.4, C.white); } circle(g, fx, fy, 2.4, C.saffron); }
  g.restore();
  petals(g, t, 8, 18, [C.white, C.saffron, C.white], [x - 250 * s, y - 500 * s, 500 * s, 500 * s]);
}

/** Mount Kailasa, white under the moon. */
export function kailasa(g: G, t: number) {
  night(g, t, 9, 60);
  mountain(g, 800, 860, 1200, 640, '#eef2f8', '#b8c6da', 4);
  mountain(g, 260, 900, 700, 360, '#d8e2ee', '#9fb2c8', 7);
  mountain(g, 1340, 900, 700, 380, '#d8e2ee', '#9fb2c8', 8);
}

/** A row of hills and trees for a village dawn. */
export function countryside(g: G, y: number, t: number) {
  hills(g, y, ['#9cc46a', '#7aa84e', '#5d8c3c'], t, 5);
  tree(g, 160, y + 120, 1.1, 'kadamba', t, 2);
  tree(g, 1440, y + 130, 1.0, 'mango', t, 3);
}

/** A devotee: seated in prayer, bowing, offering or reciting. */
export function devotee(g: G, x: number, y: number, s: number, t: number, o: { look?: Look; act?: 'pray' | 'bow' | 'offer' | 'recite' | 'stand'; face?: 1 | -1; glow?: number } = {}) {
  const look = o.look ?? { head: 'man', skin: '#c98856', hair: '#15101e', hairStyle: 'short', crown: 'none', dhoti: C.white, dhotiFg: C.saffron, border: C.saffron, scarf: C.saffron, janeu: true, tilak: 'ram' } as Look;
  const act = o.act ?? 'pray';
  const pose: Pose = act === 'bow' ? { ...P.kneel, lean: 0.9, head: 0.3 } : act === 'offer' ? { legs: 'lotus', fa: [1.5, 0.3], ba: [1.3, 0.4] } : act === 'recite' ? { legs: 'lotus', fa: [0.9, 1.4], ba: [-0.2, 1.0] } : act === 'stand' ? P.namaste : P.sitNamaste;
  const f: Fig = { ...(look as Fig), x, y: 0, s, t, face: o.face ?? 1, pose, eye: act === 'pray' ? 'closed' : 'open', mouth: act === 'recite' ? 'sing' : 'calm', glow: o.glow, b: act === 'recite' ? { k: 'mala' } : undefined, f: act === 'offer' ? { k: 'lotus' } : undefined };
  onGround(f, y); draw(g, f);
}

/** A cartouche with a line of Devanagari, for titles painted into the picture. */
export function cartouche(g: G, text: string, x: number, y: number, size: number, o: { col?: string; bg?: string; w?: number; alpha?: number } = {}) {
  g.save(); g.globalAlpha *= o.alpha ?? 1;
  g.font = `${size}px "Tiro Devanagari Sanskrit", "Noto Serif Devanagari", serif`;
  const w = o.w ?? g.measureText(text).width + size * 1.4, h = size * 1.5;
  g.beginPath(); g.moveTo(x - w / 2, y); g.quadraticCurveTo(x - w / 2 - h * 0.4, y - h / 2, x - w / 2, y - h / 2 - 2);
  g.lineTo(x + w / 2, y - h / 2 - 2); g.quadraticCurveTo(x + w / 2 + h * 0.4, y - h / 2, x + w / 2, y);
  g.quadraticCurveTo(x + w / 2 + h * 0.4, y + h / 2, x + w / 2, y + h / 2 + 2); g.lineTo(x - w / 2, y + h / 2 + 2); g.quadraticCurveTo(x - w / 2 - h * 0.4, y + h / 2, x - w / 2, y); g.closePath();
  fs(g, o.bg ?? dotsP(g, C.cream, 'rgba(214,58,40,0.15)', 10, 1.4), C.gold, 4);
  devText(g, text, x, y + size * 0.06, size, o.col ?? C.maroon);
  g.restore();
}

/** Golden rays from a point, for light breaking. */
export function rays(g: G, x: number, y: number, r: number, t: number, a = 1, n = 24, col = 'rgba(255,226,140,') {
  g.save(); g.translate(x, y); g.rotate(t * 0.05);
  for (let i = 0; i < n; i++) { const th = (i / n) * Math.PI * 2; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(th - 0.04) * r, Math.sin(th - 0.04) * r); g.lineTo(Math.cos(th + 0.04) * r, Math.sin(th + 0.04) * r); g.closePath(); g.fillStyle = `${col}${(0.25 * a).toFixed(3)})`; g.fill(); }
  g.restore();
}

/** Rising gold syllables, for a hymn being sung. */
export function risingWords(g: G, words: string[], x: number, y: number, t: number, a = 1, spread = 160, rise = 260, n = 14) {
  for (let i = 0; i < n; i++) {
    const ph = (t * 0.35 + i / n) % 1, xx = x + Math.sin(i * 2.3) * spread + Math.sin(ph * 6 + i) * 10;
    g.globalAlpha = Math.sin(ph * Math.PI) * a;
    devText(g, words[i % words.length], xx, y - ph * rise, 20 + (i % 3) * 4, C.gold);
  }
  g.globalAlpha = 1;
}

export function pond(g: G, y0: number, t: number, seed = 3) {
  water(g, y0, PH, t, C.teal);
  const R = rng(seed);
  for (let i = 0; i < 10; i++) { const x = R() * PW, y = y0 + 24 + R() * (PH - y0 - 24); lotusLeaf(g, x, y, 0.7 + R() * 0.5, R() > 0.5 ? C.green : C.leaf); if (R() > 0.5) lotus(g, x + 20, y - 4, 0.6, 1); }
}

/**
 * Krishna driving and Arjuna standing behind him, on the chariot.
 * `arjuna` sets what Arjuna does: 'stand' with his bow, 'sit' slumped in
 * despair, 'namaste', or 'draw' his bow.
 */
export function chariotPair(g: G, x: number, y: number, s: number, t: number, o: { gallop?: number; arjuna?: 'stand' | 'sit' | 'namaste' | 'draw' | 'lift'; krishna?: 'drive' | 'teach' | 'turn'; glow?: number; banner?: number } = {}) {
  const r = chariot(g, x, y, s, t, { gallop: o.gallop ?? 0, banner: o.banner });
  const kp: Pose = o.krishna === 'teach' ? { legs: 'lotus', fa: [1.6, 1.2], ba: [0.9, 0.9] } : o.krishna === 'turn' ? { legs: 'lotus', fa: [1.1, 1.4], ba: [0.5, 0.8] } : { legs: 'lotus', fa: [1.3, 0.6], ba: [1.0, 0.8] };
  const k = fig(KRISHNA, { x: r.driver.x, s: 0.94 * s, t, face: o.krishna === 'teach' || o.krishna === 'turn' ? -1 : 1, pose: kp, f: o.krishna === 'teach' ? undefined : { k: 'whip', a: 0.3 }, mouth: 'smile', glow: o.glow });
  const a = o.arjuna ?? 'stand';
  const ap: Pose = a === 'sit' ? { legs: 'lotus', lean: 0.35, head: 0.4, fa: [0.6, 1.8], ba: [0.3, 1.6] } : a === 'namaste' ? P.namaste : a === 'draw' ? { fa: [1.6, 0.0], ba: [1.5, 1.9], fl: [0.25, 0.05], bl: [-0.2, 0.05] } : a === 'lift' ? { fa: [2.2, 0.4], ba: [-0.1, 0.2], fl: [0.06, 0.04], bl: [-0.07, 0.04] } : P.stand;
  const ar = fig(ARJUNA, { x: r.archer.x, s: s, t, pose: ap, b: a === 'sit' ? undefined : { k: 'bow', a: a === 'draw' ? 1.5 : 0 }, f: a === 'lift' ? { k: 'bow', a: 2 } : undefined, eye: a === 'sit' ? 'down' : 'open' });
  if (a === 'sit') { onGround(ar, r.archer.y); draw(g, ar); onGround(k, r.driver.y); draw(g, k); }
  else { onGround(k, r.driver.y); draw(g, k); onGround(ar, r.archer.y); draw(g, ar); }
  return r;
}

export { C, PW, PH, glory, star4, cloud, clamp, lerp, sunDisc, petals };
