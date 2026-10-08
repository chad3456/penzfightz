/**
 * The narrative cast, in the profile manner of the Chalisa's figures: the
 * people of the Mahabharata, Krishna and Arjuna on their chariot, and the
 * animals pichwai painters love — the cows of Vraja, peacocks, elephants
 * and white horses with henna-red legs.
 */
import { C, type G, circle, ellipse, fs, line, smooth, stroke2, rng, floretP, dotsP, stripeP, star4, curl, lerp, clamp, glory, flame, devText } from '../chalisa/kit';
import { draw, shade, HANUMAN, SAGE, RAMA, P, type Fig, type Look, type Pose } from '../chalisa/figures';
import { deity, type Deity } from './frontal';

const ink = C.ink;

/* ───────── people ───────── */
export const KRISHNA: Look = { head: 'man', skin: '#3d5fc4', hair: '#15101e', hairStyle: 'long', crown: 'peacock', dhoti: C.gold, dhotiFg: C.marigold, border: C.vermilion, scarf: C.vermilion, scarfFg: C.gold, janeu: true, garland: true, tilak: 'ram' };
export const ARJUNA: Look = { head: 'man', skin: '#c98a5a', hair: '#15101e', hairStyle: 'long', crown: 'mukut', crownCol: C.gold, dhoti: C.maroon, dhotiFg: C.gold, border: C.gold, scarf: C.teal, scarfFg: C.gold, janeu: true, tilak: 'ram', build: 1.12 };
export const BHISHMA: Look = { head: 'sage', skin: '#e2b088', beard: C.white, hair: C.white, hairStyle: 'long', crown: 'small', dhoti: C.white, dhotiFg: C.sky, border: C.blue, scarf: C.cream, janeu: true, tilak: 'ram', build: 1.1 };
export const YUDHISHTHIRA: Look = { head: 'man', skin: '#d79a64', hair: '#15101e', hairStyle: 'long', crown: 'mukut', dhoti: C.white, dhotiFg: C.gold, border: C.vermilion, scarf: C.gold, scarfFg: C.vermilion, janeu: true, tilak: 'ram' };
export const BHIMA: Look = { head: 'man', skin: '#a8683d', hair: '#15101e', hairStyle: 'long', crown: 'small', dhoti: C.green, dhotiFg: C.gold, border: C.gold, scarf: C.saffron, janeu: true, tilak: 'red', build: 1.35, belly: 1.15 };
export const NAKULA: Look = { head: 'man', skin: '#e2a878', hair: '#15101e', hairStyle: 'long', crown: 'small', dhoti: C.sky, dhotiFg: C.white, border: C.blue, scarf: C.rani, tilak: 'ram' };
export const SAHADEVA: Look = { ...NAKULA, dhoti: C.lav, scarf: C.teal };
export const DURYODHANA: Look = { head: 'man', skin: '#b9784a', hair: '#15101e', hairStyle: 'long', crown: 'mukut', crownCol: C.gold, dhoti: C.indigo, dhotiFg: C.gold, border: C.gold, scarf: C.maroon, scarfFg: C.gold, tilak: 'red', build: 1.2 };
export const DRONA: Look = { head: 'sage', skin: '#d89a6a', beard: '#efe7d8', hair: '#efe7d8', hairStyle: 'bun', crown: 'none', dhoti: C.white, dhotiFg: C.saffron, border: C.saffron, scarf: C.saffron, janeu: true, tilak: 'ram' };
export const KARNA: Look = { head: 'man', skin: '#e9a75a', hair: '#15101e', hairStyle: 'long', crown: 'mukut', dhoti: C.gold, dhotiFg: C.vermilion, border: C.vermilion, scarf: C.fire2, tilak: 'red', build: 1.15 };
export const DHRITARASHTRA: Look = { head: 'sage', skin: '#e0ae80', beard: '#d8d0c4', hair: '#d8d0c4', hairStyle: 'long', crown: 'mukut', dhoti: C.maroon, dhotiFg: C.gold, border: C.gold, scarf: C.gold, scarfFg: C.vermilion, janeu: true, garland: true, tilak: 'red', belly: 1.15 };
export const SANJAYA: Look = { head: 'man', skin: '#d4996a', hair: '#15101e', hairStyle: 'short', crown: 'turban', turban: C.white, dhoti: C.white, dhotiFg: C.sky, border: C.blue, scarf: C.sky, janeu: true, tilak: 'ram' };
export const VYASA: Look = { head: 'sage', skin: '#6b4a3a', beard: '#2a1d1a', hair: '#2a1d1a', hairStyle: 'bun', crown: 'jata', dhoti: C.saffron, dhotiFg: C.gold, border: C.vermilion, scarf: C.saffron, janeu: true, tilak: 'ram' };
export const VAISHAMPAYANA: Look = { ...SAGE, skin: '#d8a070', beard: '#e9e2d4', dhoti: C.white, scarf: C.saffron };
export const BALARAMA: Look = { head: 'man', skin: '#f2e2d0', hair: '#15101e', hairStyle: 'long', crown: 'mukut', dhoti: C.blue, dhotiFg: C.sky, border: C.gold, scarf: C.indigo, janeu: true, garland: true, tilak: 'ram', build: 1.2 };
export const PARASHURAMA: Look = { head: 'sage', skin: '#c98a5a', beard: '#2a1d1a', hair: '#2a1d1a', hairStyle: 'jata', crown: 'jata', dhoti: C.saffron, dhotiFg: C.vermilion, border: C.vermilion, scarf: C.saffron, janeu: true, tilak: 'ram', build: 1.15 };
export const VAMANA: Look = { head: 'child', skin: '#4f74c8', hair: '#15101e', hairStyle: 'bun', crown: 'none', dhoti: C.saffron, dhotiFg: C.gold, border: C.vermilion, janeu: true, tilak: 'ram' };
export const BALI: Look = { head: 'demon', skin: '#7a5a9a', hair: '#15101e', hairStyle: 'long', crown: 'mukut', dhoti: C.gold, dhotiFg: C.vermilion, border: C.vermilion, scarf: C.rani, garland: true, tilak: 'red', build: 1.15 };
export const GOPI = (i: number): Look => ({ head: 'woman', skin: ['#f0bc8c', '#d8955f', '#e8ae7a'][i % 3], hair: '#15101e', hairStyle: 'braid', crown: 'veil', top: [C.gold, C.vermilion, C.lime, C.pink][i % 4], skirt: [C.rani, C.green, C.vermilion, C.magenta, C.teal][i % 5], skirtFg: C.gold, veil: [C.marigold, C.pink, C.gold, C.lime, C.coral][i % 5], tilak: 'dot' });
export const GOPA = (i: number): Look => ({ head: 'man', skin: ['#c98856', '#a8683d', '#e0a676'][i % 3], hair: '#15101e', hairStyle: 'short', crown: 'turban', turban: [C.saffron, C.vermilion, C.rani, C.gold][i % 4], dhoti: [C.white, C.cream, C.blush][i % 3], dhotiFg: C.saffron, border: C.saffron });
export const WARRIOR = (i: number, side: 'p' | 'k'): Look => ({ head: 'man', skin: ['#c98856', '#a8683d', '#e0a676', '#8a5432'][i % 4], hair: '#15101e', hairStyle: 'short', crown: 'helmet', dhoti: side === 'p' ? [C.teal, C.green, C.blue][i % 3] : [C.maroon, C.indigo, C.magenta][i % 3], dhotiFg: C.gold, border: C.gold, scarf: side === 'p' ? C.saffron : C.vermilion, build: 1.1 });

export function fig(look: Look, o: Partial<Fig>): Fig { return { ...(look as Fig), x: 0, y: 0, s: 1, ...o }; }

/* ───────── four-armed Vishnu and the other deity forms ───────── */
export const VISHNU: Deity = { skin: '#3f6fd0', crown: 'kirita', hands: ['lotus', 'mace', 'chakra', 'conch'], cloth: C.gold, clothFg: C.marigold, border: C.vermilion };
export const KRISHNA_ICON: Deity = { skin: '#2f4fb0', crown: 'peacock', hands: ['flute', 'none'], stance: 'tribhanga', cloth: C.gold, clothFg: C.vermilion };
export const SHRINATHJI: Deity = { skin: '#1d1a2e', crown: 'peacock', hands: ['fist', 'raised'], cloth: C.vermilion, clothFg: C.gold, border: C.gold };
export const LAKSHMI: Deity = { skin: '#f2b48a', crown: 'lakshmi', hands: ['coins', 'abhaya', 'lotus', 'lotus'], sari: true, cloth: C.rani, clothFg: C.gold, border: C.gold, garland: false };
export const NARASIMHA: Deity = { skin: '#f0a040', crown: 'small', face: 'lion', hands: ['abhaya', 'varada', 'chakra', 'conch'], cloth: C.vermilion, clothFg: C.gold, border: C.gold };
export const VISHVARUPA = (n = 16): Deity => ({
  skin: '#3a5ccc', crown: 'kirita', heads: 4, cosmos: 1, glow: 1,
  hands: ['abhaya', 'varada', ...(['chakra', 'conch', 'mace', 'lotus', 'bow', 'arrow', 'sword', 'shield', 'trident', 'axe', 'flame', 'vajra', 'noose', 'goad'] as const).slice(0, n - 2)],
  cloth: C.gold, clothFg: C.vermilion, border: C.vermilion,
});
export { deity };

/* ───────── animals ───────── */

/** A pichwai horse: white, with henna-red legs, mane and tail, a plume and bells. Faces right; hooves at y. */
export function horse(g: G, x: number, y: number, s: number, t: number, o: { gallop?: number; col?: string; face?: 1 | -1; plume?: string } = {}) {
  const gal = o.gallop ?? 0, col = o.col ?? C.white, henna = '#e0682e';
  g.save(); g.translate(x, y); g.scale(s * (o.face ?? 1), s);
  const ph = t * (5 + gal * 7);
  const bob = gal ? Math.abs(Math.sin(ph)) * 7 * gal : Math.sin(t * 1.2) * 0.8;
  g.translate(0, -bob);
  // legs: two segments, the hind ones bending back at the hock
  const leg = (hx: number, a: number, hind: boolean, near: boolean) => {
    const k = [hx + Math.sin(a) * 46, -100 + Math.cos(a) * 46];
    const b2 = a + (hind ? 0.45 : -0.15) - (gal ? Math.max(0, Math.sin(ph + hx)) * 0.9 * gal : 0) * (hind ? -1 : 1);
    const f = [k[0] + Math.sin(b2) * 52, k[1] + Math.cos(b2) * 52];
    const c = near ? henna : shade(henna, 0.78);
    g.lineCap = 'round'; g.strokeStyle = ink; g.lineWidth = 21; g.beginPath(); g.moveTo(hx, -104); g.lineTo(k[0], k[1]); g.stroke(); g.lineWidth = 15; g.beginPath(); g.moveTo(k[0], k[1]); g.lineTo(f[0], f[1]); g.stroke();
    g.strokeStyle = c; g.lineWidth = 16; g.beginPath(); g.moveTo(hx, -104); g.lineTo(k[0], k[1]); g.stroke(); g.lineWidth = 10; g.beginPath(); g.moveTo(k[0], k[1]); g.lineTo(f[0], f[1]); g.stroke();
    line(g, [[f[0] - 7, f[1] - 8], [f[0] + 7, f[1] - 8]], C.gold, 3);
    ellipse(g, f[0] + 3, f[1] + 1, 9, 5, 0, ink);
  };
  const sw = (k: number) => (gal ? Math.sin(ph + k) * 0.75 * gal : Math.sin(t * 0.7 + k) * 0.03);
  leg(-48, sw(0) - 0.05, true, false); leg(40, sw(2), false, false);
  // tail
  stroke2(g, [[-80, -134], [-104, -116 + Math.sin(t * 2) * 6], [-112, -70 + Math.sin(t * 2.4) * 8], [-104, -40]], 13, henna, ink, 2);
  // body
  smooth(g, [[-84, -136], [-60, -156], [0, -150], [44, -160], [76, -142], [84, -112], [66, -92], [10, -90], [-50, -94], [-82, -110]]);
  fs(g, col, ink, 2.6);
  // neck
  smooth(g, [[34, -152], [58, -188], [86, -216], [106, -212], [114, -190], [98, -170], [84, -146], [78, -124]], true);
  fs(g, col, ink, 2.6);
  // head: a long face sloping down to the muzzle
  smooth(g, [[90, -216], [110, -224], [130, -202], [150, -180], [144, -166], [124, -170], [104, -182], [94, -198]]);
  fs(g, col, ink, 2.4);
  ellipse(g, 142, -172, 7, 5, 0.6, '#f0c0c8', ink, 1.2);
  circle(g, 114, -200, 3.6, ink); circle(g, 115, -201, 1.1, C.white);
  for (const ex of [98, 106]) { g.beginPath(); g.moveTo(ex - 4, -218); g.lineTo(ex, -238); g.lineTo(ex + 5, -218); fs(g, col, ink, 1.6); }
  // mane along the crest of the neck
  for (let i = 0; i < 8; i++) { const u = i / 7, mx = lerp(40, 98, u), my = lerp(-156, -220, u); g.beginPath(); g.ellipse(mx - 9, my + 4, 11, 6, -0.8 + Math.sin(t * 2 + i) * 0.12, 0, 7); fs(g, henna, ink, 1.4); }
  // plume, bridle and a string of bells
  g.save(); g.translate(100, -226); g.rotate(-0.3 + Math.sin(t * 2) * 0.08); g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(-16, -20, -8, -50, 6, -58); g.bezierCurveTo(12, -38, 12, -16, 0, 0); fs(g, o.plume ?? C.rani, ink, 1.6); g.restore();
  line(g, [[96, -216], [146, -176]], C.gold, 3.4); line(g, [[104, -186], [134, -196]], C.gold, 3);
  for (let i = 0; i < 7; i++) circle(g, 66 + i * 6, -132 - i * 10, 3.6, C.gold, ink, 0.8);
  // saddle cloth
  g.beginPath(); g.moveTo(-38, -154); g.lineTo(24, -154); g.lineTo(30, -100); g.lineTo(-44, -100); g.closePath(); fs(g, floretP(g, C.vermilion, C.gold, 16), ink, 2);
  line(g, [[-46, -100], [32, -100]], C.gold, 5);
  for (let i = 0; i < 6; i++) circle(g, -40 + i * 14, -92, 3.4, C.gold, ink, 0.8);
  // near legs
  leg(-40, sw(Math.PI) - 0.05, true, true); leg(48, sw(Math.PI + 2), false, true);
  g.restore();
}

/**
 * The chariot of Arjuna: a gilded car on two great wheels, four white horses
 * in front, and the banner with Hanuman on it. Faces right; returns where the
 * driver sits and where the archer stands.
 */
export function chariot(g: G, x: number, y: number, s: number, t: number, o: { gallop?: number; horses?: number; banner?: number; dust?: boolean } = {}) {
  const gal = o.gallop ?? 0;
  g.save(); g.translate(x, y); g.scale(s, s);
  if (gal > 0.05) { const R = rng(5); for (let i = 0; i < 18; i++) { const ph = (t * 1.6 + R()) % 1; g.globalAlpha = (1 - ph) * 0.5 * gal; circle(g, -200 - ph * 260 + R() * 40, -20 - ph * 60 - R() * 30, 14 + ph * 30, '#e2c99a'); } g.globalAlpha = 1; }
  const nH = o.horses ?? 4;
  // the far pair of horses, then the yoke pole
  for (let i = nH - 1; i >= 0; i--) if (i % 2 === 1) horse(g, 250 + (i - 1.5) * 30, -4 - (i - 1.5) * 4, 0.9, t + i * 0.3, { gallop: gal, plume: [C.rani, C.gold, C.teal, C.marigold][i] });
  line(g, [[80, -112], [260, -170]], ink, 10); line(g, [[80, -112], [260, -170]], C.gold, 6);
  // banner pole at the back, flying Hanuman's flag
  const bx = -172, bt = -480;
  line(g, [[bx, -120], [bx, bt]], ink, 9); line(g, [[bx, -120], [bx, bt]], C.gold, 5);
  const w1 = Math.sin(t * 3) * 10, w2 = Math.cos(t * 2.6) * 12;
  const flagPath = () => { g.beginPath(); g.moveTo(bx, bt); g.quadraticCurveTo(bx - 80, bt + w1, bx - 170, bt + 34 + w2); g.quadraticCurveTo(bx - 90, bt + 76 + w1, bx, bt + 118); g.closePath(); };
  flagPath(); fs(g, C.saffron, ink, 2.4);
  if ((o.banner ?? 1) > 0) { g.save(); flagPath(); g.clip(); draw(g, { ...HANUMAN, x: bx - 62, y: bt + 82, s: 0.32, t, face: -1, pose: P.mace, f: { k: 'mace', a: 0.4 }, mouth: 'roar', glow: o.banner ?? 1 }); g.restore(); }
  circle(g, bx, bt - 8, 10, C.gold, ink, 1.6);
  // the car: a gilded box with a railing, a raised seat for the driver in front
  g.beginPath(); g.moveTo(-190, -96); g.lineTo(-190, -176); g.quadraticCurveTo(-186, -186, -176, -186); g.lineTo(60, -186); g.quadraticCurveTo(80, -186, 84, -170); g.lineTo(104, -150); g.quadraticCurveTo(112, -120, 96, -96); g.closePath();
  fs(g, floretP(g, C.gold, C.vermilion, 18), ink, 2.8);
  g.beginPath(); g.rect(-180, -176, 250, 30); fs(g, C.maroon, ink, 2);
  for (let i = 0; i < 10; i++) { g.beginPath(); g.rect(-172 + i * 25, -172, 10, 22); fs(g, C.gold, ink, 1.2); }
  line(g, [[-190, -120], [96, -120]], C.vermilion, 7);
  for (let i = 0; i < 9; i++) circle(g, -176 + i * 32, -108, 6, i % 2 ? C.vermilion : C.teal, ink, 1);
  // a carved makara at the prow
  g.beginPath(); g.moveTo(98, -150); g.quadraticCurveTo(136, -168, 130, -200); g.quadraticCurveTo(116, -186, 96, -176); g.closePath(); fs(g, C.gold, ink, 2); circle(g, 120, -180, 3, ink);
  // the wheel
  const wr = 80, wx = -70, wy = -80;
  circle(g, wx, wy, wr + 8, C.maroon, ink, 3); circle(g, wx, wy, wr - 6, C.gold, ink, 2);
  g.save(); g.translate(wx, wy); g.rotate(t * (0.3 + gal * 4));
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; line(g, [[Math.cos(a) * 16, Math.sin(a) * 16], [Math.cos(a) * (wr - 8), Math.sin(a) * (wr - 8)]], C.maroon, 4.4); }
  g.restore();
  circle(g, wx, wy, 18, C.vermilion, ink, 2); circle(g, wx, wy, 7, C.gold);
  // the near pair of horses
  for (let i = nH - 1; i >= 0; i--) if (i % 2 === 0) horse(g, 262 + (i - 1.5) * 30, 6 - (i - 1.5) * 4, 0.94, t + i * 0.3, { gallop: gal, plume: [C.rani, C.gold, C.teal, C.marigold][i] });
  g.restore();
  return { driver: { x: x + 52 * s, y: y - 186 * s }, archer: { x: x - 110 * s, y: y - 186 * s } };
}

/** A Vraja cow: humped, painted horns, a decorated blanket and bells. Faces right; hooves at y. */
export function cow(g: G, x: number, y: number, s: number, t: number, o: { col?: string; spot?: string; face?: 1 | -1; walk?: number; graze?: number; look?: number } = {}) {
  const col = o.col ?? C.white, spot = o.spot ?? '#c98a52', w = o.walk ?? 0;
  g.save(); g.translate(x, y); g.scale(s * (o.face ?? 1), s);
  const ph = t * 4;
  const leg = (hx: number, a: number, near: boolean) => {
    const k = [hx + Math.sin(a) * 34, -70 + Math.cos(a) * 34], f = [k[0] + Math.sin(a * 0.6) * 36, k[1] + 36];
    const c = near ? col : shade(col, 0.84);
    g.lineCap = 'round'; g.strokeStyle = ink; g.lineWidth = 20; g.beginPath(); g.moveTo(hx, -74); g.lineTo(k[0], k[1]); g.stroke(); g.lineWidth = 14; g.beginPath(); g.moveTo(k[0], k[1]); g.lineTo(f[0], f[1]); g.stroke();
    g.strokeStyle = c; g.lineWidth = 15; g.beginPath(); g.moveTo(hx, -74); g.lineTo(k[0], k[1]); g.stroke(); g.lineWidth = 9.5; g.beginPath(); g.moveTo(k[0], k[1]); g.lineTo(f[0], f[1]); g.stroke();
    line(g, [[f[0] - 6, f[1] - 9], [f[0] + 6, f[1] - 9]], C.gold, 3);
    ellipse(g, f[0] + 2, f[1] + 1, 8, 4.5, 0, ink);
  };
  leg(-52, w ? Math.sin(ph) * 0.45 : 0.02, false); leg(42, w ? Math.sin(ph + 2) * 0.45 : -0.02, false);
  stroke2(g, [[-78, -118], [-94, -90 + Math.sin(t * 1.6) * 6], [-92, -46]], 6, col, ink, 1.6);
  ellipse(g, -92, -40, 7, 12, 0, ink);
  const body = [[-80, -122], [-50, -136], [10, -136], [28, -154], [52, -148], [68, -124], [70, -86], [42, -64], [-40, -62], [-80, -78]];
  smooth(g, body); fs(g, col, ink, 2.4);
  if (o.spot !== '') { g.save(); smooth(g, body); g.clip(); ellipse(g, -46, -106, 22, 16, 0.3, spot); ellipse(g, 4, -86, 16, 11, -0.2, spot); g.restore(); }
  g.beginPath(); g.moveTo(-40, -134); g.lineTo(26, -138); g.lineTo(32, -84); g.lineTo(-46, -82); g.closePath(); fs(g, floretP(g, C.rani, C.gold, 14), ink, 1.8);
  line(g, [[-48, -84], [34, -86]], C.gold, 4);
  for (let i = 0; i < 6; i++) circle(g, -42 + i * 14, -76, 3, C.gold, ink, 0.8);
  const gz = o.graze ?? 0, lk = o.look ?? 0;
  g.save(); g.translate(60, -128); g.rotate(gz * 0.9 - lk * 0.4);
  g.beginPath(); g.moveTo(-6, -4); g.quadraticCurveTo(30, -10, 40, 4); g.quadraticCurveTo(26, 44, -2, 38); fs(g, col, ink, 2.2);
  g.beginPath(); g.moveTo(24, -14); g.bezierCurveTo(50, -20, 70, -4, 72, 18); g.quadraticCurveTo(64, 30, 46, 26); g.quadraticCurveTo(28, 20, 20, 6); g.closePath(); fs(g, col, ink, 2.2);
  ellipse(g, 68, 20, 9, 7, 0.3, '#f2b8c0', ink, 1.4);
  circle(g, 46, 0, 3.6, ink); circle(g, 47, -1, 1, C.white);
  line(g, [[40, -5], [51, -7]], ink, 1.6);
  for (const [hx, cl] of [[28, C.vermilion], [38, C.teal]] as [number, string][]) { g.beginPath(); g.moveTo(hx, -14); g.quadraticCurveTo(hx - 8, -38, hx + 6, -46); g.quadraticCurveTo(hx + 2, -32, hx + 7, -14); fs(g, cl, ink, 1.6); circle(g, hx + 5, -46, 3, C.gold); }
  ellipse(g, 18, -6, 13, 5.5, -0.4, col, ink, 1.6);
  line(g, [[16, 16], [40, 24]], C.vermilion, 3.4); circle(g, 30, 30, 6, C.gold, ink, 1.2);
  g.restore();
  leg(-44, w ? Math.sin(ph + Math.PI) * 0.45 : -0.02, true); leg(50, w ? Math.sin(ph + Math.PI + 2) * 0.45 : 0.02, true);
  g.restore();
}

export function peacock(g: G, x: number, y: number, s: number, t: number, o: { fan?: number; face?: 1 | -1 } = {}) {
  const fan = o.fan ?? 0;
  g.save(); g.translate(x, y); g.scale(s * (o.face ?? 1), s);
  if (fan > 0.01) {
    // the tail raised into a fan of eyes
    for (let i = 0; i < 26; i++) {
      const a = -Math.PI * 0.95 + (i / 25) * Math.PI * 0.9 + Math.sin(t * 1.3 + i * 0.4) * 0.012, r = 140 * fan;
      const ex = -30 + Math.cos(a) * r, ey = -60 + Math.sin(a) * r * 1.1;
      line(g, [[-30, -60], [ex, ey]], '#2d6a3a', 1.4);
      ellipse(g, ex, ey, 11, 15, a + Math.PI / 2, '#2c7a5a', ink, 1); ellipse(g, ex, ey, 7, 10, a + Math.PI / 2, C.gold); ellipse(g, ex, ey, 4, 6, a + Math.PI / 2, '#1d4fa0'); circle(g, ex, ey, 2, ink);
    }
  } else {
    // the train trailing behind
    g.beginPath(); g.moveTo(-10, -50); g.bezierCurveTo(-60, -40, -120, -20, -170, -6); g.lineTo(-160, 8); g.bezierCurveTo(-110, 0, -50, -10, -6, -30); g.closePath(); fs(g, '#2c7a5a', ink, 1.6);
    for (let i = 0; i < 6; i++) { const u = i / 5; ellipse(g, lerp(-40, -150, u), lerp(-34, 0, u), 6, 9, 1.3, C.gold, ink, 0.8); circle(g, lerp(-40, -150, u), lerp(-34, 0, u), 2.6, '#1d4fa0'); }
  }
  // body and neck
  g.beginPath(); g.moveTo(-26, -40); g.bezierCurveTo(-30, -70, 0, -80, 12, -64); g.bezierCurveTo(18, -90, 22, -116, 30, -122); g.bezierCurveTo(40, -124, 44, -116, 40, -110); g.bezierCurveTo(30, -96, 30, -70, 26, -50); g.quadraticCurveTo(0, -28, -26, -40); g.closePath();
  fs(g, '#1d4fa0', ink, 2);
  g.beginPath(); g.moveTo(40, -116); g.lineTo(54, -112); g.lineTo(40, -108); fs(g, C.gold, ink, 1);
  circle(g, 34, -116, 2.6, C.white); circle(g, 35, -116, 1.4, ink);
  for (let i = 0; i < 3; i++) { line(g, [[30, -122], [26 + i * 4, -140]], ink, 1); circle(g, 26 + i * 4, -142, 2.6, '#1d4fa0'); }
  // legs
  line(g, [[-6, -40], [-8, -10], [-2, 0]], C.brown, 2.4); line(g, [[6, -40], [8, -10], [14, 0]], C.brown, 2.4);
  g.restore();
}

/** An elephant: slate grey, painted forehead and trunk, a caparison. Faces right; feet at y. */
export function elephant(g: G, x: number, y: number, s: number, t: number, o: { col?: string; face?: 1 | -1; walk?: number; howdah?: boolean; tusks?: number } = {}) {
  const col = o.col ?? '#8d94a8', w = o.walk ?? 0;
  g.save(); g.translate(x, y); g.scale(s * (o.face ?? 1), s);
  const ph = t * 3;
  const leg = (hx: number, a: number, near: boolean) => { const dx = Math.sin(a) * 8; g.beginPath(); g.moveTo(hx - 22, -96); g.lineTo(hx - 20 + dx, 0); g.lineTo(hx + 20 + dx, 0); g.lineTo(hx + 22, -96); g.closePath(); fs(g, near ? col : shade(col, 0.84), ink, 2.2); for (let i = 0; i < 3; i++) circle(g, hx - 10 + i * 10 + dx, -5, 4.5, C.cream, ink, 0.8); line(g, [[hx - 20 + dx, -26], [hx + 20 + dx, -26]], C.gold, 4); };
  leg(-62, w ? Math.sin(ph) : 0, false); leg(54, w ? Math.sin(ph + 2) : 0, false);
  stroke2(g, [[-118, -150], [-132, -110], [-128, -80]], 6, col, ink, 1.6);
  smooth(g, [[-120, -120], [-96, -204], [10, -222], [100, -196], [124, -136], [100, -78], [-100, -74]]);
  fs(g, col, ink, 2.6);
  g.beginPath(); g.moveTo(-70, -214); g.lineTo(46, -218); g.lineTo(56, -112); g.lineTo(-80, -104); g.closePath(); fs(g, floretP(g, C.vermilion, C.gold, 18), ink, 2);
  line(g, [[-82, -106], [58, -114]], C.gold, 7);
  for (let i = 0; i < 9; i++) circle(g, -74 + i * 16, -98, 5.5, C.gold, ink, 1);
  if (o.howdah) { g.beginPath(); g.rect(-60, -280, 96, 64); fs(g, floretP(g, C.gold, C.vermilion, 14), ink, 2); g.beginPath(); g.moveTo(-70, -280); g.quadraticCurveTo(-12, -334, 46, -280); fs(g, C.marigold, ink, 2); line(g, [[-12, -320], [-12, -350]], ink, 2); }
  smooth(g, [[86, -206], [138, -214], [168, -176], [162, -126], [140, -98], [110, -112], [92, -152]]);
  fs(g, col, ink, 2.4);
  smooth(g, [[94, -190], [72, -156], [78, -106], [108, -112], [114, -160]]); fs(g, shade(col, 0.88), ink, 2);
  for (let i = 0; i < 4; i++) circle(g, 90 + i * 2, -166 + i * 14, 3, C.rani);
  const sw = Math.sin(t * 1.4) * 0.25;
  g.save(); g.translate(154, -122); g.rotate(sw);
  stroke2(g, [[0, 0], [12, 44], [6, 86], [-10, 104], [-22, 96]], 24, col, ink, 2.2);
  for (let i = 0; i < 4; i++) line(g, [[-4 + i, 20 + i * 18], [16 - i, 22 + i * 18]], shade(col, 0.75), 1.6);
  g.restore();
  for (let i = 0; i < 6; i++) circle(g, 126 + (i % 3) * 9, -190 + Math.floor(i / 3) * 11, 3.4, [C.gold, C.vermilion, C.white][i % 3]);
  circle(g, 128, -160, 4, ink); circle(g, 129, -161, 1.3, C.white);
  if ((o.tusks ?? 2) > 0) { g.beginPath(); g.moveTo(140, -112); g.quadraticCurveTo(184, -108, 192, -138); g.quadraticCurveTo(170, -120, 144, -124); fs(g, C.cream, ink, 1.6); }
  leg(-50, w ? Math.sin(ph + Math.PI) : 0, true); leg(66, w ? Math.sin(ph + Math.PI + 2) : 0, true);
  g.restore();
}

/** Garuda, wings spread, palms joined; Vishnu's mount. Frontal; feet at y. */
export function garuda(g: G, x: number, y: number, s: number, t: number, o: { flap?: number } = {}) {
  const flap = Math.sin(t * (o.flap ?? 1.4)) * 0.08;
  g.save(); g.translate(x, y); g.scale(s, s);
  for (const sd of [-1, 1]) {
    g.save(); g.scale(sd, 1); g.translate(30, -240); g.rotate(-0.25 + flap);
    for (let row = 0; row < 3; row++) {
      const L = 260 - row * 60, col = [C.green, C.gold, C.vermilion][row];
      for (let i = 0; i < 9; i++) { const u = i / 8; g.beginPath(); const x0 = u * L, y0 = row * 26; g.moveTo(x0, y0); g.quadraticCurveTo(x0 + 18, y0 + 30 + u * 40, x0 + 6, y0 + 70 + u * 70 - row * 10); g.quadraticCurveTo(x0 - 8, y0 + 30, x0, y0); fs(g, col, ink, 1.6); }
    }
    g.beginPath(); g.moveTo(0, -10); g.quadraticCurveTo(140, -60, 270, -10); g.lineTo(260, 10); g.quadraticCurveTo(140, -30, 0, 14); g.closePath(); fs(g, C.gold, ink, 2);
    g.restore();
  }
  const look: Fig = { head: 'man', skin: '#3f9a5a', hair: '#15101e', hairStyle: 'long', crown: 'mukut', dhoti: C.vermilion, dhotiFg: C.gold, border: C.gold, scarf: C.gold, scarfFg: C.vermilion, garland: true, x: 0, y: 0, s: 1.3, t, pose: { namaste: true, fl: [1.1, 1.6], bl: [0.1, 1.5] } };
  draw(g, { ...look, y: -112, s: 1.3 });
  // the beak, over the profile face
  g.beginPath(); g.moveTo(38, -224); g.quadraticCurveTo(62, -222, 58, -204); g.quadraticCurveTo(48, -212, 34, -210); fs(g, C.gold, ink, 1.6);
  g.restore();
}

/** Bhishma lying on his bed of arrows at sundown. */
export function arrowBed(g: G, x: number, y: number, s: number, t: number) {
  g.save(); g.translate(x, y); g.scale(s, s);
  const R = rng(31);
  for (let i = 0; i < 46; i++) {
    const ax = -240 + R() * 480, ang = (R() - 0.5) * 0.7, L = 70 + R() * 60;
    g.save(); g.translate(ax, 0); g.rotate(ang);
    line(g, [[0, 0], [0, -L]], C.brown, 2.4);
    for (const sd of [-1, 1]) line(g, [[0, -L + 4], [sd * 6, -L + 18]], C.vermilion, 2);
    g.restore();
  }
  g.save(); g.translate(0, -84); g.rotate(-Math.PI / 2);
  draw(g, { ...BHISHMA, x: 0, y: 0, s: 1.1, t, pose: { fa: [0.4, 1.2], ba: [-0.1, 0.4], fl: [0.02, 0.0], bl: [-0.02, 0.0] }, eye: 'down' } as Fig);
  g.restore();
  g.restore();
}

/* ───────── armies ───────── */

/**
 * A massed army in rows going back into the dust: helmets, spears, shields,
 * banners and, here and there, an elephant or a chariot. `side` −1 faces
 * left, 1 faces right.
 */
export function army(g: G, x0: number, x1: number, y: number, side: 1 | -1, t: number, o: { rows?: number; col?: string; banner?: string; seed?: number; elephants?: boolean; stir?: number } = {}) {
  const rows = o.rows ?? 4, R = rng(o.seed ?? 3), col = o.col ?? C.maroon, ban = o.banner ?? C.vermilion;
  for (let r = rows - 1; r >= 0; r--) {
    const yy = y - r * 26, sc = 1 - r * 0.12, gap = 30 * sc;
    for (let xx = x0 + (r % 2) * gap * 0.5; xx < x1; xx += gap) {
      const bob = Math.sin(t * 2 + xx * 0.1) * (o.stir ?? 0.5) * 2;
      g.save(); g.translate(xx, yy + bob); g.scale(sc * side, sc);
      // a soldier: body, helmet, spear and shield
      g.beginPath(); g.moveTo(-9, 0); g.lineTo(-10, -34); g.quadraticCurveTo(0, -44, 10, -34); g.lineTo(9, 0); g.closePath(); fs(g, r % 2 ? col : shade(col, 0.85), ink, 1.4);
      circle(g, 0, -48, 9, ['#c98856', '#a8683d', '#e0a676'][Math.floor(R() * 3)], ink, 1.2);
      g.beginPath(); g.arc(0, -50, 10, Math.PI, 0); fs(g, '#9aa4ad', ink, 1.2);
      line(g, [[12, 6], [12, -84]], C.brown, 2); g.beginPath(); g.moveTo(12, -96); g.lineTo(15, -84); g.lineTo(9, -84); fs(g, '#dfe4e8', ink, 0.8);
      circle(g, -8, -22, 9, C.gold, ink, 1.2);
      g.restore();
      if (R() < 0.08) { const bh = 90 * sc; line(g, [[xx, yy], [xx, yy - bh - 40]], C.brown, 2.4); g.beginPath(); g.moveTo(xx, yy - bh - 40); g.quadraticCurveTo(xx + side * 30, yy - bh - 40 + Math.sin(t * 3 + xx) * 6, xx + side * 54, yy - bh - 26); g.lineTo(xx, yy - bh - 12); g.closePath(); fs(g, ban, ink, 1.4); }
    }
    if (o.elephants && r === rows - 1) for (let k = 0; k < 3; k++) elephant(g, lerp(x0 + 60, x1 - 60, (k + 0.5) / 3), yy - 6, 0.42 * sc, t + k, { face: side, howdah: true });
  }
}

/** Rows of dust and pennants for a battlefield at a distance. */
export function battleGround(g: G, y: number, t: number) {
  const gr = g.createLinearGradient(0, y - 40, 0, 900); gr.addColorStop(0, '#d9b47a'); gr.addColorStop(1, '#b07a44');
  g.fillStyle = gr; g.fillRect(-600, y - 40, 2800, 1400);
  g.strokeStyle = 'rgba(120,70,30,0.35)'; g.lineWidth = 2;
  const R = rng(12);
  for (let i = 0; i < 60; i++) { const xx = R() * 1800 - 100, yy = y + R() * 400; g.beginPath(); g.moveTo(xx, yy); g.quadraticCurveTo(xx + 20, yy - 4, xx + 40, yy); g.stroke(); }
  void t;
}

/* ───────── avatars ───────── */

/** The ten avatars, each as a small standing image; `i` 0…9 from Matsya to Kalki. */
export function avatar(g: G, i: number, x: number, y: number, s: number, t: number) {
  switch (i) {
    case 0: { // Matsya: four-armed above, a great fish below
      g.save(); g.translate(x, y); g.scale(s, s);
      g.beginPath(); g.moveTo(-50, -190); g.bezierCurveTo(-90, -120, -60, -40, 10, -20); g.bezierCurveTo(50, -10, 60, 10, 90, 0); g.lineTo(100, -40); g.bezierCurveTo(80, -30, 60, -40, 40, -50); g.bezierCurveTo(40, -110, 50, -170, 50, -190); g.closePath();
      fs(g, dotsP(g, C.marigold, 'rgba(255,255,255,0.4)', 14, 3), ink, 2.4);
      for (let k = 0; k < 6; k++) line(g, [[-40 + k * 14, -150 + k * 18], [20 + k * 10, -150 + k * 18]], 'rgba(120,60,10,0.4)', 1.4);
      g.restore();
      deity(g, x, y + 10 * s, s * 0.62, t, { ...VISHNU, base: 'none', garland: false, upperOnly: true });
      break;
    }
    case 1: { // Kurma: on the tortoise
      g.save(); g.translate(x, y); g.scale(s, s);
      g.beginPath(); g.ellipse(0, -46, 110, 52, 0, Math.PI, 0); g.closePath(); fs(g, scaleShell(g), ink, 2.4);
      ellipse(g, 120, -30, 26, 18, 0.2, '#7a9a52', ink, 2); circle(g, 130, -36, 3, ink);
      for (const fx of [-80, 80]) ellipse(g, fx, -8, 22, 10, 0, '#7a9a52', ink, 2);
      g.restore();
      deity(g, x, y + 40 * s, s * 0.55, t, { ...VISHNU, base: 'none', upperOnly: true, garland: false });
      break;
    }
    case 2: { // Varaha: the boar lifting the earth on his tusk
      const S2 = s * 1.05;
      const f = fig(RAMA, { x, s: S2, t, pose: { fa: [2.6, 0.4], ba: [1.0, 1.2], fl: [0.2, 0.05], bl: [-0.2, 0.05] }, b: { k: 'mace', a: 0.2 }, skin: '#4a5a8a', crown: 'none', hairStyle: 'none' });
      f.y = y - 110 * S2; draw(g, f);
      boarHead(g, x - 8 * S2, f.y - 126 * S2, S2 * 1.3);
      // Bhudevi, the earth, a blue-green globe held high
      circle(g, x + 80 * s, y - 330 * s, 44 * s, '#4f9a7a', ink, 2.4);
      g.save(); g.beginPath(); g.arc(x + 80 * s, y - 330 * s, 44 * s, 0, 7); g.clip(); for (let k = 0; k < 4; k++) ellipse(g, x + (60 + k * 16) * s, y - (340 - k * 14) * s, 16 * s, 8 * s, k, '#8fc06a'); g.restore();
      break;
    }
    case 3: deity(g, x, y, s * 0.62, t, NARASIMHA); break;
    case 4: { // Vamana: the boy with the parasol and the water-pot
      const f = fig(VAMANA, { x, s: s * 0.95, t, pose: P.stand, f: { k: 'umbrella', a: 0 }, b: { k: 'kalash', a: 0 }, mouth: 'smile' });
      f.y = y - 70 * s; draw(g, f); break;
    }
    case 5: { const f = fig(PARASHURAMA, { x, s, t, pose: P.mace, f: { k: 'axe', a: 0.2 } }); f.y = y - 110 * s; draw(g, f); break; }
    case 6: { const f = fig(RAMA, { x, s, t, pose: P.stand, b: { k: 'bow', a: 0 }, f: { k: 'arrow', a: 0 }, mouth: 'smile' }); f.y = y - 110 * s; draw(g, f); break; }
    case 7: { const f = fig(BALARAMA, { x, s, t, pose: P.mace, f: { k: 'plough', a: 0.2 } }); f.y = y - 110 * s; draw(g, f); break; }
    case 8: { const f = fig(KRISHNA, { x, s, t, pose: { fa: [1.2, 2.4], ba: [1.4, 0.4], fl: [0.08, 0.04], bl: [-0.06, 0.04] }, f: { k: 'flute', a: -1.75 }, mouth: 'smile' }); f.y = y - 110 * s; draw(g, f); break; }
    case 9: { // Kalki on the white horse, sword raised
      horse(g, x, y, s * 0.9, t, { gallop: 0.4 });
      const f = fig(KRISHNA, { x: x + 10 * s, s: s * 0.85, t, crown: 'mukut', skin: '#4f74c8', pose: { fa: [2.8, 0.2], ba: [0.6, 0.6], legs: 'lotus' }, f: { k: 'sword', a: 0.1 } });
      f.y = y - 170 * s; draw(g, f); break;
    }
  }
}
export const AVATAR_NAMES = ['Matsya', 'Kurma', 'Varaha', 'Narasimha', 'Vamana', 'Parashurama', 'Rama', 'Balarama', 'Krishna', 'Kalki'];
export const AVATAR_DEV = ['मत्स्य', 'कूर्म', 'वराह', 'नृसिंह', 'वामन', 'परशुराम', 'राम', 'बलराम', 'कृष्ण', 'कल्कि'];

function scaleShell(g: G) { return floretP(g, '#6d8a3a', 'rgba(255,240,180,0.45)', 22); }

/** A boar's head in profile, for Varaha. */
export function boarHead(g: G, x: number, y: number, s: number) {
  g.save(); g.translate(x, y); g.scale(s, s);
  g.beginPath(); g.moveTo(-20, 20); g.bezierCurveTo(-28, -20, 0, -36, 24, -26); g.bezierCurveTo(46, -18, 62, -4, 70, 8); g.quadraticCurveTo(66, 20, 56, 20); g.bezierCurveTo(30, 26, 0, 36, -20, 20); g.closePath();
  fs(g, '#4a5a8a', ink, 2.2);
  ellipse(g, 66, 12, 8, 9, 0, '#6a7aa8', ink, 1.6); circle(g, 66, 10, 1.8, ink); circle(g, 69, 14, 1.8, ink);
  g.beginPath(); g.moveTo(48, 20); g.quadraticCurveTo(62, 30, 72, 10); g.quadraticCurveTo(62, 22, 50, 14); fs(g, C.cream, ink, 1.4);
  g.beginPath(); g.moveTo(4, -28); g.lineTo(-2, -48); g.lineTo(16, -32); fs(g, '#4a5a8a', ink, 1.6);
  circle(g, 28, -8, 4, C.white, ink, 1); circle(g, 29, -8, 2, ink);
  line(g, [[24, -16], [36, -14]], ink, 1.6);
  g.beginPath(); g.moveTo(-14, -24); g.lineTo(-10, -40); g.quadraticCurveTo(0, -48, 10, -40); g.lineTo(14, -28); fs(g, C.gold, ink, 1.6);
  g.restore();
}

/* ───────── places and things ───────── */

/** A palace hall: pillars, a canopy, a throne. */
export function hall(g: G, t: number, col = C.maroon) {
  g.fillStyle = floretP(g, col, 'rgba(255,200,120,0.25)', 30); g.fillRect(-400, -400, 2400, 1700);
  for (const px of [140, 470, 1130, 1460]) {
    g.beginPath(); g.rect(px - 26, 120, 52, 640); fs(g, floretP(g, C.gold, C.vermilion, 18), ink, 2.4);
    g.beginPath(); g.rect(px - 40, 100, 80, 24); fs(g, C.vermilion, ink, 2);
  }
  g.beginPath(); g.moveTo(-100, 0); g.lineTo(1700, 0); g.lineTo(1700, 110); for (let x = 1700; x > -100; x -= 100) g.quadraticCurveTo(x - 50, 170, x - 100, 110); g.closePath(); fs(g, C.gold, ink, 3);
  for (let x = 50; x < 1600; x += 100) circle(g, x, 126, 8, C.vermilion, ink, 1.5);
  void t;
}

export function throne(g: G, x: number, y: number, s: number) {
  g.save(); g.translate(x, y); g.scale(s, s);
  g.beginPath(); g.moveTo(-90, 0); g.lineTo(-90, -180); g.quadraticCurveTo(0, -260, 90, -180); g.lineTo(90, 0); g.closePath(); fs(g, floretP(g, C.gold, C.vermilion, 20), ink, 2.6);
  g.beginPath(); g.rect(-110, -70, 220, 70); fs(g, C.vermilion, ink, 2.4);
  for (let i = 0; i < 6; i++) circle(g, -90 + i * 36, -36, 7, C.gold, ink, 1.2);
  g.restore();
}

/** Ripples of sound from a blown conch. */
export function soundRings(g: G, x: number, y: number, t: number, col = 'rgba(255,240,200,0.8)', n = 5, R = 240) {
  for (let i = 0; i < n; i++) { const ph = (t * 0.8 + i / n) % 1; g.globalAlpha = (1 - ph) * 0.9; g.beginPath(); g.arc(x, y, 20 + ph * R, -1.2, 1.2); g.strokeStyle = col; g.lineWidth = 6 - ph * 4; g.stroke(); }
  g.globalAlpha = 1;
}

/** The conch alone, large, for the roll call of the conches. */
export function bigConch(g: G, x: number, y: number, s: number, rot = 0, col = C.white) {
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
  g.beginPath(); g.moveTo(-60, 20); g.bezierCurveTo(-90, -30, -40, -90, 20, -80); g.bezierCurveTo(70, -70, 90, -20, 60, 30); g.quadraticCurveTo(0, 50, -60, 20); g.closePath(); fs(g, col, ink, 3);
  curl(g, 20, -40, 30, 1.4, 1, 0); g.strokeStyle = ink; g.lineWidth = 2.4; g.stroke();
  for (let i = 0; i < 4; i++) line(g, [[-50 + i * 6, 0 + i * 8], [50 - i * 6, 0 + i * 8]], 'rgba(150,130,110,0.6)', 2);
  line(g, [[-40, 26], [40, 32]], C.gold, 5);
  g.restore();
}

/** Om, written large and glowing. */
export function om(g: G, x: number, y: number, size: number, t: number, col = C.gold) {
  g.save(); g.shadowColor = 'rgba(255,200,80,0.9)'; g.shadowBlur = 30 + Math.sin(t * 2) * 10;
  devText(g, 'ॐ', x, y, size, col);
  g.restore();
}

export { glory, flame, star4, stripeP, clamp };
export type { Pose };
