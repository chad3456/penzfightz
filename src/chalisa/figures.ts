/**
 * The cast, as posable folk figures: profile heads with large almond eyes,
 * flat gouache bodies with ink outlines, patterned cloth that moves in the
 * wind. Every figure is built from one skeleton (hip, shoulders, two-part
 * limbs) so any scene can pose it; the look (head, colours, garments,
 * ornaments) is a preset.
 */
import { C, type G, circle, ellipse, fs, line, smooth, stroke2, poly, lerp, rng, floretP, dotsP, stripeP, star4, flame, mountain, curl, lotus } from './kit';

export type Limb = [number, number];
export type ItemKind = 'mace' | 'bow' | 'flag' | 'veena' | 'mala' | 'ring' | 'lamp' | 'book' | 'lotus' | 'trident' | 'kalash' | 'cymbal' | 'quill' | 'herb' | 'mountain' | 'noose' | 'pot' | 'arrow' | 'sword' | 'conch' | 'chakra' | 'paduka' | 'scroll' | 'flute' | 'whip' | 'axe' | 'plough' | 'umbrella' | 'spear' | 'shield' | 'reins';
export interface Item { k: ItemKind; a?: number; s?: number; glow?: number }
export interface Pose { lean?: number; head?: number; root?: number; fa?: Limb; ba?: Limb; fl?: Limb; bl?: Limb; legs?: 'legs' | 'lotus' | 'none'; namaste?: boolean }
export interface Look {
  head: 'man' | 'woman' | 'monkey' | 'monkeyW' | 'sage' | 'demon' | 'child' | 'ghost';
  skin: string; faceCol?: string;
  hair?: string; hairStyle?: 'long' | 'bun' | 'jata' | 'braid' | 'short' | 'wild' | 'none' | 'curly';
  crown?: 'mukut' | 'small' | 'turban' | 'none' | 'veil' | 'jata' | 'spiky' | 'tiara' | 'peacock' | 'helmet';
  crownCol?: string; turban?: string;
  dhoti?: string; dhotiFg?: string; border?: string;
  scarf?: string; scarfFg?: string;
  top?: string; skirt?: string; skirtFg?: string; veil?: string;
  janeu?: boolean; garland?: boolean; beard?: string; fangs?: boolean; tail?: boolean; tilak?: 'ram' | 'red' | 'shiva' | 'dot' | 'none';
  build?: number; // chest width factor
  belly?: number;
}
export interface Fig extends Look {
  x: number; y: number; s: number; face?: 1 | -1; pose?: Pose; t?: number;
  f?: Item; b?: Item;
  eye?: 'open' | 'closed' | 'up' | 'down' | 'wide'; mouth?: 'calm' | 'smile' | 'open' | 'roar' | 'sing';
  wind?: number; blink?: boolean; alpha?: number; hl?: number; glow?: number;
}

/* ───────── colour helpers ───────── */
export function shade(hex: string, k: number) {
  if (!hex.startsWith('#')) return hex;
  const n = parseInt(hex.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(k < 1 ? v * k : v + (255 - v) * (k - 1))));
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}
const dir = (a: number) => [Math.sin(a), Math.cos(a)];

/* ───────── presets ───────── */
export const HANUMAN: Look = { head: 'monkey', skin: C.hanu, faceCol: C.hanuFace, crown: 'mukut', hairStyle: 'curly', dhoti: C.vermilion, dhotiFg: C.gold, border: C.gold, scarf: C.gold, scarfFg: C.vermilion, janeu: true, garland: true, tail: true, tilak: 'red', build: 1.25 };
export const RAMA: Look = { head: 'man', skin: C.rama, hair: '#1a1530', hairStyle: 'long', crown: 'mukut', dhoti: C.gold, dhotiFg: C.marigold, border: C.vermilion, scarf: C.marigold, scarfFg: C.vermilion, janeu: true, garland: true, tilak: 'ram' };
export const RAMA_ASCETIC: Look = { ...RAMA, crown: 'jata', hairStyle: 'bun', dhoti: '#c98a3a', dhotiFg: '#8a5524', scarf: '#d29a4a', garland: false };
export const LAKSHMANA: Look = { head: 'man', skin: '#f0c08e', hair: '#1a1530', hairStyle: 'long', crown: 'small', dhoti: C.teal, dhotiFg: C.gold, border: C.gold, scarf: C.rani, scarfFg: C.gold, janeu: true, tilak: 'ram' };
export const BHARATA: Look = { ...LAKSHMANA, skin: '#8fb6d8', dhoti: '#c98a3a', scarf: C.cream, crown: 'jata', hairStyle: 'bun' };
export const SITA: Look = { head: 'woman', skin: '#f6c8a0', hair: '#1a1530', hairStyle: 'braid', crown: 'tiara', top: C.vermilion, skirt: C.vermilion, skirtFg: C.gold, veil: C.gold, tilak: 'dot' };
export const SITA_GROVE: Look = { ...SITA, skirt: C.gold, skirtFg: C.cream, top: C.marigold, veil: C.gold, crown: 'veil' };
export const ANJANI: Look = { head: 'woman', skin: '#e3a565', hair: '#1a1530', hairStyle: 'braid', crown: 'veil', top: C.teal, skirt: C.rani, skirtFg: C.gold, veil: C.teal, tilak: 'dot' };
export const KESARI: Look = { head: 'monkey', skin: '#c8823c', faceCol: '#f1c98e', crown: 'small', dhoti: C.green, dhotiFg: C.gold, border: C.gold, scarf: C.marigold, tail: true, build: 1.2 };
export const SUGRIVA: Look = { head: 'monkey', skin: '#b4783e', faceCol: '#ecc58c', crown: 'mukut', crownCol: C.gold, dhoti: C.magenta, dhotiFg: C.gold, border: C.gold, scarf: C.teal, tail: true, build: 1.15 };
export const VANARA: Look = { head: 'monkey', skin: '#a8743e', faceCol: '#e8c28e', crown: 'none', dhoti: C.green, dhotiFg: C.lime, border: C.lime, tail: true };
export const VIBHISHANA: Look = { head: 'man', skin: '#7f9e8c', hair: '#1a1530', hairStyle: 'long', crown: 'mukut', dhoti: C.white, dhotiFg: C.sky, border: C.blue, scarf: C.sky, tilak: 'ram', janeu: true };
export const RAKSHASA: Look = { head: 'demon', skin: '#5b3a7a', hair: '#1a1020', hairStyle: 'wild', crown: 'spiky', dhoti: C.maroon, dhotiFg: C.gold, border: C.gold, fangs: true, build: 1.3, belly: 1.25 };
export const RAKSHASA2: Look = { ...RAKSHASA, skin: '#2f6a5a', dhoti: C.indigo, crown: 'none' };
export const SHIVA: Look = { head: 'man', skin: '#a9c3d6', hair: '#2a2236', hairStyle: 'jata', crown: 'jata', dhoti: '#c9a46a', dhotiFg: '#6a4a24', border: C.ink, scarf: C.white, tilak: 'shiva' };
export const PARVATI: Look = { head: 'woman', skin: '#f2c08f', hair: '#1a1530', hairStyle: 'braid', crown: 'tiara', top: C.green, skirt: C.rani, skirtFg: C.gold, veil: C.green, tilak: 'dot' };
export const BRAHMA: Look = { head: 'sage', skin: '#e79a5a', beard: C.white, hair: C.white, hairStyle: 'bun', crown: 'mukut', dhoti: C.vermilion, dhotiFg: C.gold, border: C.gold, scarf: C.gold, janeu: true, tilak: 'ram' };
export const NARADA: Look = { head: 'sage', skin: '#f0c08e', beard: '#efe7d8', hair: '#1a1530', hairStyle: 'bun', crown: 'none', dhoti: C.white, dhotiFg: C.saffron, border: C.saffron, scarf: C.saffron, janeu: true, tilak: 'ram' };
export const SARASWATI: Look = { head: 'woman', skin: '#f7d6b4', hair: '#1a1530', hairStyle: 'braid', crown: 'tiara', top: C.white, skirt: C.white, skirtFg: C.gold, veil: C.cream, tilak: 'dot' };
export const SAGE: Look = { head: 'sage', skin: '#e2a878', beard: '#e9e2d4', hair: '#e9e2d4', hairStyle: 'bun', crown: 'none', dhoti: C.saffron, dhotiFg: C.gold, border: C.vermilion, scarf: C.saffron, janeu: true, tilak: 'ram' };
export const CHILD_SAGE: Look = { head: 'child', skin: '#f2c49a', hair: '#1a1530', hairStyle: 'bun', crown: 'none', dhoti: C.white, dhotiFg: C.lilac, border: C.saffron, tilak: 'ram' };
export const YAMA: Look = { head: 'man', skin: '#3d6b55', hair: '#121212', hairStyle: 'long', crown: 'mukut', crownCol: C.gold, dhoti: C.vermilion, dhotiFg: C.ink, border: C.gold, scarf: C.maroon, tilak: 'red', beard: undefined };
export const KUBERA: Look = { head: 'man', skin: '#f0b46a', hair: '#1a1530', hairStyle: 'long', crown: 'mukut', dhoti: C.green, dhotiFg: C.gold, border: C.gold, scarf: C.gold, garland: true, belly: 1.45, build: 1.2, tilak: 'dot' };
export const TULSI: Look = { head: 'sage', skin: '#d99a6c', beard: '#f1ece2', hair: '#f1ece2', hairStyle: 'short', crown: 'none', dhoti: C.white, dhotiFg: C.cream, border: C.saffron, scarf: C.cream, janeu: true, tilak: 'ram' };
export const VILLAGER = (i: number): Look => {
  const tur = [C.saffron, C.vermilion, C.rani, C.gold, C.teal, C.white][i % 6], dh = [C.white, C.cream, C.blush, C.lav, C.peach][i % 5];
  return { head: 'man', skin: ['#c98856', '#a8683d', '#e0a676', '#8a5432'][i % 4], hair: '#1a1530', hairStyle: 'short', crown: 'turban', turban: tur, dhoti: dh, dhotiFg: tur, border: tur, scarf: tur, beard: i % 3 === 0 ? '#2a1d1a' : undefined };
};
export const WOMAN = (i: number): Look => {
  const c = [C.rani, C.saffron, C.teal, C.vermilion, C.gold, C.magenta][i % 6], c2 = [C.gold, C.vermilion, C.gold, C.gold, C.vermilion, C.gold][i % 6];
  return { head: 'woman', skin: ['#d8955f', '#b8754a', '#f0bc8c', '#9a5c36'][i % 4], hair: '#1a1530', hairStyle: 'braid', crown: 'veil', top: c2, skirt: c, skirtFg: c2, veil: [C.pink, C.marigold, C.lime, C.gold, C.rani, C.coral][i % 6], tilak: 'dot' };
};
export const CHILD = (i: number): Look => ({ head: 'child', skin: ['#d8955f', '#e0a676', '#b8754a'][i % 3], hair: '#1a1530', hairStyle: 'short', crown: 'none', dhoti: [C.gold, C.pink, C.sky][i % 3], dhotiFg: C.white, border: C.vermilion });
export const BABY_HANUMAN: Look = { ...HANUMAN, crown: 'none', hairStyle: 'curly', garland: false, janeu: false, scarf: undefined, dhoti: C.vermilion, build: 1.1, head: 'monkey' };

/* ───────── poses ───────── */
export const P = {
  stand: { fa: [0.15, 0.2], ba: [-0.1, 0.15], fl: [0.06, 0.04], bl: [-0.07, 0.04] } as Pose,
  namaste: { namaste: true, fl: [0.06, 0.04], bl: [-0.07, 0.04] } as Pose,
  bless: { fa: [1.1, 1.3], ba: [-0.1, 0.2], fl: [0.06, 0.04], bl: [-0.07, 0.04] } as Pose,
  raise: { fa: [2.7, 0.2], ba: [-0.3, 0.2], fl: [0.06, 0.04], bl: [-0.07, 0.04] } as Pose,
  mace: { fa: [0.9, 1.6], ba: [-0.25, 0.3], fl: [0.12, 0.05], bl: [-0.12, 0.04] } as Pose,
  kneel: { namaste: true, lean: 0.12, fl: [1.35, 1.45], bl: [0.05, 1.55] } as Pose,
  kneelOpen: { fa: [1.0, 0.6], ba: [0.6, 0.8], lean: 0.1, fl: [1.35, 1.45], bl: [0.05, 1.55] } as Pose,
  sit: { legs: 'lotus', fa: [0.3, 1.2], ba: [-0.2, 1.0] } as Pose,
  sitNamaste: { legs: 'lotus', namaste: true } as Pose,
  fly: { root: -1.2, head: 0.9, fa: [3.0, 0.1], ba: [0.2, 0.3], fl: [-0.25, 0.5], bl: [-0.05, 0.15], lean: 0 } as Pose,
  leap: { root: -0.5, head: 0.4, fa: [2.6, 0.3], ba: [-0.8, 0.4], fl: [0.9, 1.6], bl: [-0.4, 1.2] } as Pose,
  stride: { fa: [0.5, 0.4], ba: [-0.5, 0.3], fl: [0.45, 0.2], bl: [-0.4, 0.3] } as Pose,
};
export function walk(ph: number, extra: Pose = {}): Pose {
  const s = Math.sin(ph), c = Math.cos(ph);
  return { fa: [-0.45 * s, 0.35], ba: [0.45 * s, 0.35], fl: [0.42 * s, 0.25 + 0.35 * Math.max(0, c)], bl: [-0.42 * s, 0.25 + 0.35 * Math.max(0, -c)], ...extra };
}
export function mix(a: Pose, b: Pose, t: number): Pose {
  const L = (x?: Limb, y?: Limb): Limb | undefined => (x && y ? [lerp(x[0], y[0], t), lerp(x[1], y[1], t)] : t < 0.5 ? x : y);
  const n = (x?: number, y?: number) => lerp(x ?? 0, y ?? 0, t);
  return { lean: n(a.lean, b.lean), head: n(a.head, b.head), root: n(a.root, b.root), fa: L(a.fa, b.fa), ba: L(a.ba, b.ba), fl: L(a.fl, b.fl), bl: L(a.bl, b.bl), legs: t < 0.5 ? a.legs : b.legs, namaste: t < 0.5 ? a.namaste : b.namaste };
}

/* ───────── skeleton constants ───────── */
const UA = 46, FA = 42, TH = 54, SH = 52;
const NECK: [number, number] = [4, -92];
/** How far below the hip the lowest point of a pose reaches (unscaled). */
export function footDrop(p: Pose = {}): number {
  if (p.legs === 'lotus') return 26;
  if (p.legs === 'none') return 0;
  const leg = (h: Limb, hx: number) => { const [ax, ay] = dir(h[0]); const k = [hx + ax * TH, ay * TH]; const [bx, by] = dir(h[0] - h[1]); return Math.max(k[1], k[1] + by * SH) + 6; void bx; };
  return Math.max(leg(p.fl ?? [0.06, 0.04], 6), leg(p.bl ?? [-0.07, 0.04], -4));
}
/** Place a figure's lowest point on the ground. */
export function onGround(f: Fig, groundY: number): Fig { f.y = groundY - footDrop(f.pose) * f.s; return f; }

/* ───────── drawing ───────── */
export function draw(g: G, f: Fig) {
  const p = f.pose ?? P.stand, t = f.t ?? 0, wind = f.wind ?? 1, face = f.face ?? 1;
  const skin = f.skin, skinB = shade(skin, 0.82);
  const R = rng(Math.floor(f.x * 7 + f.y * 3));
  void R;
  g.save();
  if (f.alpha !== undefined) g.globalAlpha = f.alpha;
  if (f.glow) { const r = g.createRadialGradient(f.x, f.y - 60 * f.s, 10, f.x, f.y - 60 * f.s, 220 * f.s); r.addColorStop(0, `rgba(255,214,90,${0.55 * f.glow})`); r.addColorStop(1, 'rgba(255,214,90,0)'); g.fillStyle = r; g.fillRect(f.x - 240 * f.s, f.y - 300 * f.s, 480 * f.s, 480 * f.s); }
  g.translate(f.x, f.y); g.scale(f.s * face, f.s); g.rotate(p.root ?? 0);
  const breathe = 1 + Math.sin(t * 1.6) * 0.012;
  const lean = p.lean ?? 0;
  const female = f.head === 'woman' || f.head === 'monkeyW';
  const bw = f.build ?? 1;

  // shoulder positions in the upper-body frame
  const SF: [number, number] = [12 * bw, -84], SB: [number, number] = [-6 * bw, -86];
  const arm = (sh: [number, number], L: Limb | undefined) => { const a = L ?? [0.1, 0.2]; const [d1x, d1y] = dir(a[0]); const e: [number, number] = [sh[0] + d1x * UA, sh[1] + d1y * UA]; const [d2x, d2y] = dir(a[0] + a[1]); const w: [number, number] = [e[0] + d2x * FA, e[1] + d2y * FA]; return { e, w, a2: a[0] + a[1] }; };
  const leg = (hx: number, L: Limb | undefined) => { const a = L ?? [0.05, 0.05]; const [d1x, d1y] = dir(a[0]); const k: [number, number] = [hx + d1x * TH, d1y * TH]; const [d2x, d2y] = dir(a[0] - a[1]); const an: [number, number] = [k[0] + d2x * SH, k[1] + d2y * SH]; return { k, an, a2: a[0] - a[1] }; };

  // ── tail (behind everything)
  if (f.tail) {
    const sw = Math.sin(t * 1.3) * 18, sw2 = Math.cos(t * 1.1) * 14;
    stroke2(g, [[-16, -8], [-46, 6], [-74, -10 + sw2 * 0.3], [-86, -50 + sw * 0.4], [-72, -92 + sw], [-48, -104 + sw2], [-40, -88 + sw2]], 9, skin, C.ink, 2.2);
    curl(g, -44, -96 + sw2, 8, 0.9, -1, Math.PI); g.strokeStyle = C.ink; g.lineWidth = 2; g.stroke();
  }
  // ── back arm and leg (behind the body)
  g.save(); g.rotate(lean);
  const AB = p.namaste ? null : arm(SB, p.ba);
  if (AB) drawArm(g, SB, AB, skinB, f, f.b, t, false);
  g.restore();
  if (p.legs !== 'lotus' && p.legs !== 'none') {
    const LB = leg(-4, p.bl);
    if (female) drawFoot(g, LB.an, LB.a2, skinB, true);
    else drawLeg(g, [-4, -2], LB, skinB, f, true);
  }
  // ── scarf, back part
  if (f.scarf) {
    g.save(); g.rotate(lean);
    const w1 = Math.sin(t * 2.1) * 10 * wind, w2 = Math.cos(t * 1.7) * 14 * wind;
    stroke2(g, [[-4, -86], [-20, -76], [-30, -52 + w1 * 0.4], [-38 + w2 * 0.6, -26], [-46 + w2, 2 + w1 * 0.5], [-58 + w2 * 1.3, 24]], 10, floretP(g, f.scarf, f.scarfFg ?? C.white, 18), C.ink, 2);
    g.restore();
  }
  // ── lower body garment
  if (female) drawSkirt(g, f, p, t);
  else if (p.legs === 'lotus') drawLotusLegs(g, f, skin);
  // ── torso (upper-body frame)
  g.save(); g.rotate(lean); g.scale(1, breathe);
  drawTorso(g, f, bw, female);
  g.restore();
  // ── front leg
  if (!female && p.legs !== 'lotus' && p.legs !== 'none') { const LF = leg(6, p.fl); drawLeg(g, [6, -2], LF, skin, f, false); }
  else if (female && p.legs !== 'lotus' && p.legs !== 'none') { const LF = leg(6, p.fl); drawFoot(g, LF.an, LF.a2, skin, false); }
  if (!female) drawWaist(g, f, t, p.legs === 'lotus');
  // ── head and front arm (upper-body frame)
  g.save(); g.rotate(lean);
  g.save(); g.translate(NECK[0], NECK[1]); g.rotate(p.head ?? 0); g.translate(7, -27); g.scale(1.24, 1.24);
  drawHead(g, f, t);
  g.restore();
  if (p.namaste) drawNamaste(g, f, skin);
  else { const AF = arm(SF, p.fa); drawArm(g, SF, AF, skin, f, f.f, t, true); }
  // scarf front loop over the arm
  if (f.scarf) {
    const w1 = Math.sin(t * 2.3 + 1) * 8 * wind;
    stroke2(g, [[-2, -88], [16 * bw, -78], [26 * bw, -52], [30 * bw + w1 * 0.5, -22], [36 * bw + w1, 8]], 9, floretP(g, f.scarf, f.scarfFg ?? C.white, 18), C.ink, 2);
  }
  g.restore();
  g.restore();
}

function drawTorso(g: G, f: Fig, bw: number, female: boolean) {
  const skin = f.skin, belly = f.belly ?? 1;
  const pts = female
    ? [[-15, 0], [-16, -30], [-14, -62], [-10, -84], [2, -92], [12, -89], [19, -78], [24, -64], [19, -52], [15, -36], [17, -14], [18, 0]]
    : [[-18 * bw, 0], [-19 * bw, -34], [-17 * bw, -64], [-12 * bw, -84], [-2, -92], [12 * bw, -90], [22 * bw, -80], [27 * bw, -62], [22 * bw * belly, -40], [21 * belly, -20], [20, 0]];
  smooth(g, pts); fs(g, skin, C.ink, 2.4);
  if (female) {
    // blouse
    g.save(); smooth(g, pts); g.clip();
    g.fillStyle = f.top ?? C.vermilion; g.fillRect(-30, -96, 70, 44);
    line(g, [[-20, -52], [30, -50]], C.gold, 3);
    g.restore();
    smooth(g, pts); fs(g, null, C.ink, 2.4);
    // sari pallu across the chest
    g.beginPath(); g.moveTo(-12, -86); g.bezierCurveTo(10, -70, 22, -40, 20, -4); g.lineTo(6, -4); g.bezierCurveTo(8, -40, -2, -64, -16, -80); g.closePath();
    fs(g, floretP(g, f.veil ?? f.skirt ?? C.gold, f.skirtFg ?? C.white, 18), C.ink, 2);
  } else {
    // a little modelling: chest line and navel
    line(g, [[8 * bw, -70], [18 * bw, -64], [24 * bw, -66]], shade(skin, 0.75), 2);
    circle(g, 18 * belly, -26, 1.6, shade(skin, 0.6));
  }
  // necklaces
  line(g, [[-2, -88], [6, -74], [18 * bw, -72], [24 * bw, -80]], C.gold, 3.2, true);
  for (let i = 0; i < 5; i++) circle(g, 4 + i * 4.6 * bw, -75 + Math.abs(i - 2) * 0.8, 1.8, C.white);
  if (f.janeu) {
    if (f.hl) { g.save(); g.globalAlpha = f.hl; line(g, [[-8 * bw, -88], [6, -50], [20, -6]], C.fire2, 9, true); g.restore(); }
    line(g, [[-8 * bw, -88], [6, -50], [20, -6]], f.hl ? '#e8d48a' : C.cream, f.hl ? 3.6 : 2.2, true);
    if (f.hl) for (let i = 0; i < 9; i++) { const u = i / 9; line(g, [[lerp(-8 * bw, 20, u) - 2, lerp(-88, -6, u) - 1], [lerp(-8 * bw, 20, u) + 3, lerp(-88, -6, u) + 2]], '#a8913f', 1.2); }
  }
  if (f.garland) {
    const pts2 = [[-4, -88], [0, -56], [10, -26], [22 * bw, -40], [26 * bw, -70], [22 * bw, -84]];
    for (let i = 0; i < 26; i++) { const u = i / 25, k = Math.min(pts2.length - 2, Math.floor(u * (pts2.length - 1))), tt = u * (pts2.length - 1) - k; const x = lerp(pts2[k][0], pts2[k + 1][0], tt), y = lerp(pts2[k][1], pts2[k + 1][1], tt); circle(g, x, y, 3, i % 3 ? C.marigold : C.white, C.ink, 0.8); }
  }
}
function drawArm(g: G, sh: [number, number], A: { e: [number, number]; w: [number, number]; a2: number }, col: string, f: Fig, item: Item | undefined, t: number, front: boolean) {
  const w0 = 15 * (f.build ?? 1), w1 = 12 * (f.build ?? 1);
  g.lineCap = 'round'; g.lineJoin = 'round';
  g.strokeStyle = C.ink; g.lineWidth = w0 + 4.8; g.beginPath(); g.moveTo(sh[0], sh[1]); g.lineTo(A.e[0], A.e[1]); g.stroke();
  g.lineWidth = w1 + 4.8; g.beginPath(); g.moveTo(A.e[0], A.e[1]); g.lineTo(A.w[0], A.w[1]); g.stroke();
  g.strokeStyle = col; g.lineWidth = w0; g.beginPath(); g.moveTo(sh[0], sh[1]); g.lineTo(A.e[0], A.e[1]); g.stroke();
  g.lineWidth = w1; g.beginPath(); g.moveTo(A.e[0], A.e[1]); g.lineTo(A.w[0], A.w[1]); g.stroke();
  // armlet and bangles
  const mx = lerp(sh[0], A.e[0], 0.5), my = lerp(sh[1], A.e[1], 0.5);
  const [ux, uy] = [A.e[0] - sh[0], A.e[1] - sh[1]], L = Math.hypot(ux, uy) || 1, nx = -uy / L, ny = ux / L;
  line(g, [[mx + nx * w0 * 0.55, my + ny * w0 * 0.55], [mx - nx * w0 * 0.55, my - ny * w0 * 0.55]], C.gold, 4);
  const [fx, fy] = dir(A.a2), bx = A.w[0] - fx * 6, by = A.w[1] - fy * 6;
  line(g, [[bx - fy * w1 * 0.55, by + fx * w1 * 0.55], [bx + fy * w1 * 0.55, by - fx * w1 * 0.55]], f.head === 'woman' ? C.vermilion : C.gold, 3.4);
  // hand
  const hx = A.w[0] + fx * 5, hy = A.w[1] + fy * 5;
  if (item) drawItem(g, item, hx, hy, t, f);
  ellipse(g, hx, hy, 8 * (f.build ?? 1), 6.5, -A.a2, col, C.ink, 2);
  if (item && item.k === 'mace') ellipse(g, hx, hy, 8, 6.5, -A.a2, col, C.ink, 2);
  void front;
}
function drawNamaste(g: G, f: Fig, skin: string) {
  const bw = f.build ?? 1;
  // forearms meet in front of the chest, palms joined and pointing up
  for (const [sx, col] of [[-6 * bw, shade(skin, 0.82)], [12 * bw, skin]] as [number, string][]) {
    stroke2(g, [[sx, -84], [sx + 10, -50], [30 * bw, -60]], 13 * bw, col, C.ink, 2.4, false);
  }
  g.beginPath(); g.moveTo(26 * bw, -58); g.quadraticCurveTo(40 * bw, -66, 36 * bw, -88); g.quadraticCurveTo(28 * bw, -74, 26 * bw, -58); fs(g, skin, C.ink, 2.2);
  line(g, [[29 * bw, -62], [34 * bw, -82]], shade(skin, 0.7), 1.4);
  line(g, [[24 * bw, -56], [28 * bw, -62]], C.gold, 3);
}
function drawLeg(g: G, hip: [number, number], L: { k: [number, number]; an: [number, number]; a2: number }, col: string, f: Fig, back: boolean) {
  const cloth = f.dhoti ? floretP(g, back ? shade(f.dhoti, 0.85) : f.dhoti, f.dhotiFg ?? C.white, 20) : col;
  const mid: [number, number] = [lerp(L.k[0], L.an[0], 0.55), lerp(L.k[1], L.an[1], 0.55)];
  g.lineCap = 'round';
  // skin shin first, then the dhoti over thigh and upper shin
  stroke2(g, [L.k, L.an], 12 * (f.build ?? 1), col, C.ink, 2.4, false);
  stroke2(g, [hip, L.k, mid], 31 * (f.build ?? 1), cloth, C.ink, 2.4, false);
  if (f.border) { const [dx, dy] = dir(L.a2); line(g, [[mid[0] - dy * 13, mid[1] + dx * 13], [mid[0] + dy * 13, mid[1] - dx * 13]], f.border, 4); }
  // anklet
  const [dx, dy] = dir(L.a2); line(g, [[L.an[0] - dx * 5 - dy * 6, L.an[1] - dy * 5 + dx * 6], [L.an[0] - dx * 5 + dy * 6, L.an[1] - dy * 5 - dx * 6]], C.gold, 2.6);
  drawFoot(g, L.an, L.a2, col, back);
}
function drawFoot(g: G, an: [number, number], a2: number, col: string, back: boolean) {
  const ang = -a2 + Math.PI / 2;
  g.save(); g.translate(an[0], an[1]); g.rotate(ang - Math.PI / 2);
  g.beginPath(); g.moveTo(-6, -2); g.quadraticCurveTo(-4, 8, 8, 8); g.quadraticCurveTo(20, 9, 22, 5); g.quadraticCurveTo(14, -1, 4, -5); g.closePath();
  fs(g, col, C.ink, 2); g.fillStyle = C.vermilion; g.globalAlpha *= 0.5; g.fillRect(-6, 6, 26, 2); g.globalAlpha /= 0.5;
  g.restore(); void back;
}
function drawWaist(g: G, f: Fig, t: number, seated = false) {
  if (!f.dhoti) return;
  const bw = f.build ?? 1, belly = f.belly ?? 1;
  g.beginPath(); g.moveTo(-19 * bw, -12); g.quadraticCurveTo(0, -18, 21 * belly, -14); g.lineTo(22 * belly, 8); g.quadraticCurveTo(0, 12, -20 * bw, 6); g.closePath();
  fs(g, floretP(g, f.dhoti, f.dhotiFg ?? C.white, 20), C.ink, 2.2);
  line(g, [[-19 * bw, -10], [21 * belly, -12]], f.border ?? C.gold, 4);
  if (seated) return;
  // the front fall of pleats, swinging
  const sw = Math.sin(t * 2) * 4;
  g.beginPath(); g.moveTo(10, -6); g.lineTo(22, -6); g.quadraticCurveTo(26 + sw, 30, 22 + sw * 1.4, 58); g.lineTo(12 + sw * 1.4, 60); g.quadraticCurveTo(14 + sw, 30, 10, -6); g.closePath();
  fs(g, stripeP(g, f.dhoti, f.dhotiFg ?? C.white, 8, 2), C.ink, 2);
  line(g, [[12 + sw * 1.4, 58], [22 + sw * 1.4, 58]], f.border ?? C.gold, 4);
}
function drawSkirt(g: G, f: Fig, p: Pose, t: number) {
  const col = f.skirt ?? C.vermilion, fg = f.skirtFg ?? C.gold;
  const sw = Math.sin(t * 1.6) * 4;
  if (p.legs === 'lotus') {
    g.beginPath(); g.moveTo(-26, -8); g.bezierCurveTo(-60, 0, -66, 30, -40, 32); g.lineTo(60, 32); g.bezierCurveTo(78, 26, 66, 0, 24, -8); g.closePath();
    fs(g, floretP(g, col, fg, 20), C.ink, 2.4); line(g, [[-50, 28], [66, 28]], fg, 5); return;
  }
  const kneel = (p.fl?.[0] ?? 0) > 1;
  if (kneel) {
    g.beginPath(); g.moveTo(-18, -8); g.lineTo(24, -8); g.bezierCurveTo(60, -6, 76, 20, 70, 50); g.lineTo(-40, 56); g.bezierCurveTo(-44, 30, -30, 6, -18, -8); g.closePath();
  } else {
    g.beginPath(); g.moveTo(-17, -8); g.lineTo(21, -8); g.bezierCurveTo(28, 40, 36 + sw, 80, 40 + sw, 108); g.quadraticCurveTo(4, 114, -32 + sw, 108); g.bezierCurveTo(-28, 70, -22, 30, -17, -8); g.closePath();
  }
  fs(g, floretP(g, col, fg, 20), C.ink, 2.4);
  // pleats and border
  if (!kneel) { for (let i = 0; i < 4; i++) line(g, [[4 + i * 5, 0], [10 + i * 7 + sw, 104]], shade(col, 0.75), 1.6); line(g, [[-32 + sw, 104], [40 + sw, 104]], fg, 6); }
  else line(g, [[-40, 52], [70, 46]], fg, 6);
  line(g, [[-17, -6], [21, -6]], fg, 4);
}
function drawLotusLegs(g: G, f: Fig, skin: string) {
  const cloth = f.dhoti ? floretP(g, f.dhoti, f.dhotiFg ?? C.white, 20) : skin;
  g.beginPath(); g.moveTo(-22, -6); g.bezierCurveTo(-58, 0, -64, 28, -40, 30); g.lineTo(58, 30); g.bezierCurveTo(78, 24, 66, -2, 22, -6); g.closePath();
  fs(g, cloth, C.ink, 2.4);
  if (f.border) line(g, [[-48, 26], [64, 26]], f.border, 4);
  // two soles turned up
  ellipse(g, 30, 10, 13, 7, -0.3, skin, C.ink, 2); ellipse(g, -16, 12, 13, 7, 0.3, skin, C.ink, 2);
  circle(g, 30, 10, 3, C.vermilion); circle(g, -16, 12, 3, C.vermilion);
}

/* ───────── heads ───────── */
function drawHead(g: G, f: Fig, t: number) {
  const k = f.head, skin = f.skin;
  const blink = f.blink !== false && (Math.sin(t * 0.9 + f.x) > 0.985);
  const eye = blink ? 'closed' : f.eye ?? 'open';
  // hair behind the head
  if (f.hairStyle === 'long' || f.hairStyle === 'braid' || f.hairStyle === 'wild') {
    const sw = Math.sin(t * 1.4) * 3;
    const hp = f.hairStyle === 'wild'
      ? [[-6, -22], [-30, -14], [-40, 6], [-34, 34 + sw], [-20, 30], [-10, 14]]
      : [[-6, -22], [-24, -10], [-30, 14], [-28, 44 + sw], [-22, 62 + sw], [-12, 52], [-8, 24], [-4, 6]];
    smooth(g, hp); fs(g, f.hair ?? C.ink, C.ink, 2);
    if (f.hairStyle === 'braid') { for (let i = 0; i < 6; i++) ellipse(g, -22 + i * 0.5, 30 + i * 11 + sw * (i / 6), 6, 5, 0.3, f.hair ?? C.ink, 'rgba(255,255,255,0.25)', 1); circle(g, -19, 96 + sw, 5, C.vermilion); }
  }
  if (f.crown === 'veil' && f.veil) {
    const sw = Math.sin(t * 1.3) * 4;
    g.beginPath(); g.moveTo(18, -18); g.bezierCurveTo(4, -34, -30, -28, -34, 4); g.bezierCurveTo(-38, 40 + sw, -30, 80 + sw, -20, 110 + sw); g.lineTo(-4, 100); g.bezierCurveTo(-14, 60, -14, 20, -2, 0); g.closePath();
    fs(g, floretP(g, f.veil, C.white, 16), C.ink, 2.2);
  }
  if (k === 'monkey' || k === 'monkeyW') monkeyHead(g, f, skin, eye, t);
  else if (k === 'ghost') ghostHead(g, f, t);
  else humanHead(g, f, skin, eye, t);
  // crowns and headgear
  const cc = f.crownCol ?? C.gold;
  if (f.crown === 'peacock') {
    // Krishna: a small crown with a peacock feather tucked in, swaying
    g.save(); g.translate(-2, -28); g.rotate(-0.45 + Math.sin(t * 1.2) * 0.06);
    line(g, [[0, 0], [0, -62]], '#4f6b2a', 1.8);
    for (let i = 0; i < 12; i++) { const yy = -8 - i * 4.4; line(g, [[0, yy], [-10, yy - 7]], '#3f8a4a', 1.1); line(g, [[0, yy], [10, yy - 7]], '#3f8a4a', 1.1); }
    ellipse(g, 0, -60, 10, 14, 0, '#2c7a5a', C.ink, 1.2); ellipse(g, 0, -59, 6.5, 9.5, 0, C.gold, null); ellipse(g, 0, -58, 4, 6, 0, '#1d4fa0', null); circle(g, 0, -57.5, 2, C.ink);
    g.restore();
  }
  if (f.crown === 'helmet') {
    g.beginPath(); g.moveTo(-17, -10); g.bezierCurveTo(-22, -40, 22, -44, 20, -12); g.closePath(); fs(g, '#9aa4ad', C.ink, 2);
    line(g, [[-17, -14], [20, -15]], C.gold, 3.4); g.beginPath(); g.moveTo(2, -40); g.quadraticCurveTo(-18, -60, -30, -40); fs(g, null, C.vermilion, 4);
  }
  if (f.crown === 'mukut' || f.crown === 'small' || f.crown === 'peacock') {
    const H = f.crown === 'mukut' ? 54 : f.crown === 'peacock' ? 26 : 34;
    g.beginPath(); g.moveTo(-15, -14); g.lineTo(-12, -24); g.lineTo(-6, -24 - H * 0.7); g.quadraticCurveTo(2, -24 - H * 1.05, 8, -24 - H * 0.7); g.lineTo(16, -22); g.lineTo(19, -15); g.closePath();
    fs(g, cc, C.ink, 2.2);
    line(g, [[-14, -18], [19, -19]], C.vermilion, 4);
    for (let i = 0; i < 5; i++) circle(g, -10 + i * 7, -18.5, 1.6, C.white);
    circle(g, 2, -24 - H * 0.4, 4.5, C.vermilion, C.ink, 1.2); circle(g, 2, -24 - H * 0.4, 1.6, C.white);
    for (let i = 0; i < 3; i++) line(g, [[-8 + i, -30 - i * H * 0.18], [12 - i * 2, -30 - i * H * 0.18]], shade(cc, 0.7), 1.6);
    // finial and side flare
    ellipse(g, 2, -24 - H * 1.08, 4, 7, 0, C.vermilion, C.ink, 1.4);
    g.beginPath(); g.moveTo(-14, -20); g.quadraticCurveTo(-28, -30, -26, -44); g.quadraticCurveTo(-18, -32, -10, -30); fs(g, cc, C.ink, 1.8);
  } else if (f.crown === 'tiara') {
    g.beginPath(); g.moveTo(-14, -16); g.quadraticCurveTo(2, -30, 18, -18); g.lineTo(16, -14); g.quadraticCurveTo(2, -24, -12, -12); g.closePath(); fs(g, C.gold, C.ink, 1.6);
    for (let i = 0; i < 4; i++) circle(g, -8 + i * 7, -20 - Math.sin(i) * 2, 1.8, C.vermilion);
    if (f.veil && f.crown === 'tiara') { const sw = Math.sin(t * 1.3) * 4; g.beginPath(); g.moveTo(-10, -20); g.bezierCurveTo(-34, -16, -40, 40 + sw, -24, 100 + sw); g.lineTo(-12, 90); g.bezierCurveTo(-22, 40, -20, 0, -6, -14); g.closePath(); fs(g, floretP(g, f.veil, C.white, 16), C.ink, 2); }
  } else if (f.crown === 'turban') {
    const c = f.turban ?? C.saffron;
    g.beginPath(); g.moveTo(-20, -6); g.bezierCurveTo(-30, -30, -10, -46, 8, -40); g.bezierCurveTo(24, -36, 26, -20, 18, -12); g.quadraticCurveTo(0, -18, -20, -6); g.closePath();
    fs(g, stripeP(g, c, shade(c, 0.8), 10, 4), C.ink, 2.2);
    line(g, [[-18, -14], [20, -22]], shade(c, 0.7), 2); line(g, [[-16, -24], [18, -32]], shade(c, 0.7), 2);
    g.beginPath(); g.moveTo(-20, -6); g.quadraticCurveTo(-30, 6, -26, 20); fs(g, null, C.ink, 2);
  } else if (f.crown === 'jata' || f.hairStyle === 'jata') {
    const hc = f.hair ?? C.ink;
    g.beginPath(); g.moveTo(-16, -14); g.bezierCurveTo(-22, -40, -12, -60, 2, -62); g.bezierCurveTo(16, -60, 22, -40, 16, -16); g.closePath(); fs(g, hc, C.ink, 2.2);
    for (let i = 0; i < 4; i++) line(g, [[-12 + i * 2, -20 - i * 10], [12 - i * 2, -20 - i * 10]], 'rgba(255,255,255,0.3)', 2);
    line(g, [[-14, -18], [16, -18]], C.gold, 3);
    if (f.tilak === 'shiva') { g.save(); g.translate(10, -50); g.rotate(-0.6); g.beginPath(); g.arc(0, 0, 10, 0.3, Math.PI - 0.3); g.arc(0, 4, 8, Math.PI - 0.5, 0.5, true); g.closePath(); fs(g, C.cream, C.ink, 1.2); g.restore(); const sw = Math.sin(t * 3) * 3; line(g, [[-4, -60], [-12 + sw, -78], [-6 - sw, -94], [-14 + sw, -110]], C.sky, 4, true); }
  } else if (f.crown === 'spiky') {
    g.beginPath(); g.moveTo(-16, -14);
    for (let i = 0; i <= 6; i++) { const x = -16 + i * 6, y = i % 2 ? -46 - (i === 3 ? 12 : 0) : -24; g.lineTo(x, y); }
    g.lineTo(20, -14); g.closePath(); fs(g, C.gold, C.ink, 2); circle(g, 2, -24, 4, C.vermilion, C.ink, 1.2);
  }
  if (f.hairStyle === 'bun' && f.crown !== 'jata' && f.crown !== 'mukut') { circle(g, -4, -26, 10, f.hair ?? C.ink, C.ink, 2); line(g, [[-12, -24], [4, -24]], C.vermilion, 2); }
}
function eyeDraw(g: G, x: number, y: number, w: number, h: number, eye: string, iris = C.ink) {
  if (eye === 'closed') { g.beginPath(); g.moveTo(x - w, y); g.quadraticCurveTo(x, y + h * 0.9, x + w, y); fs(g, null, C.ink, 2.2); line(g, [[x - w, y], [x - w - 6, y - 2]], C.ink, 2); return; }
  g.beginPath(); g.moveTo(x - w, y); g.quadraticCurveTo(x, y - h * 1.6, x + w, y); g.quadraticCurveTo(x, y + h * 1.1, x - w, y); fs(g, C.white, C.ink, 2);
  const ix = eye === 'up' ? x + w * 0.35 : eye === 'down' ? x + w * 0.2 : x + w * 0.38, iy = eye === 'up' ? y - h * 0.5 : eye === 'down' ? y + h * 0.25 : y - h * 0.1;
  circle(g, ix, iy, eye === 'wide' ? h * 0.9 : h * 1.0, iris); circle(g, ix + 0.8, iy - 0.8, h * 0.3, C.white);
  line(g, [[x - w, y], [x - w - 7, y - 2.5]], C.ink, 2.2);
}
function humanHead(g: G, f: Fig, skin: string, eye: string, t: number) {
  const k = f.head;
  const child = k === 'child', demon = k === 'demon', woman = k === 'woman';
  const pts = demon
    ? [[-14, 18], [-24, -2], [-14, -22], [4, -25], [18, -18], [24, -8], [26, -4], [32, 4], [26, 9], [28, 14], [24, 18], [26, 24], [12, 28], [4, 26]]
    : child
      ? [[-12, 16], [-22, 0], [-14, -20], [4, -24], [17, -15], [21, -5], [25, 3], [21, 7], [22, 11], [19, 15], [16, 19], [6, 20], [2, 20]]
      : [[-14, 18], [-23, -2], [-13, -21], [4, -24], [17, -16], [21, -7], [21, -4], [28, 4], [23, 8], [24, 11], [21, 13], [23, 15], [21, 21], [10, 23], [5, 26]];
  // neck
  g.beginPath(); g.rect(-6, 12, 14, 18); fs(g, skin, null);
  smooth(g, pts); fs(g, skin, C.ink, 2.2);
  // ear and earring
  g.beginPath(); g.arc(-3, 2, 5, -1.2, 1.9); fs(g, shade(skin, 0.85), C.ink, 1.6);
  if (k !== 'sage' || true) { circle(g, -4, 13, woman ? 4.5 : 5, C.gold, C.ink, 1.2); circle(g, -4, 19, 2.4, C.vermilion); }
  // hair line
  if (f.hairStyle && f.hairStyle !== 'none' && f.crown !== 'turban') { g.beginPath(); g.moveTo(-14, -16); g.quadraticCurveTo(2, -27, 17, -16); g.quadraticCurveTo(4, -19, -6, -12); g.quadraticCurveTo(-12, -6, -16, 0); g.closePath(); fs(g, f.hair ?? C.ink, null); }
  // eye, brow, mouth
  const ey = child ? -2 : -3, ex = child ? 12 : 13;
  eyeDraw(g, ex, ey, child ? 6 : woman ? 7.5 : 7, child ? 3.4 : 3.2, eye, demon ? C.vermilion : C.ink);
  g.beginPath(); g.moveTo(ex - 7, ey - 7); g.quadraticCurveTo(ex + 1, ey - (demon ? 13 : 10.5), ex + 8, ey - (demon ? 3 : 7)); fs(g, null, C.ink, demon ? 3.4 : 2.2);
  const m = f.mouth ?? 'calm';
  if (m === 'open' || m === 'sing') { ellipse(g, 21, 12, 2.6, m === 'sing' ? 2.6 : 3.4, 0, C.maroon, C.ink, 1.2); }
  else if (m === 'smile') line(g, [[17, 11.5], [20.5, 13], [23, 11.5]], C.maroon, 1.8, true);
  else line(g, [[18, 12], [22.5, 12]], C.maroon, 1.8);
  if (woman) { circle(g, 24, 6.5, 3.4, null, C.gold, 1.4); circle(g, 22, 9, 1, C.white); line(g, [[18, 13.5], [21, 14]], C.vermilion, 2.4); }
  if (demon) {
    if (f.fangs) { g.beginPath(); g.moveTo(22, 15); g.lineTo(24, 4); g.lineTo(26, 15); fs(g, C.white, C.ink, 1.2); g.beginPath(); g.moveTo(14, 18); g.lineTo(15, 9); g.lineTo(18, 18); fs(g, C.white, C.ink, 1.2); }
    g.beginPath(); g.moveTo(26, 9); g.bezierCurveTo(30, 12, 20, 16, 12, 12); g.bezierCurveTo(6, 10, 4, 16, 0, 12); fs(g, null, C.ink, 3);
  }
  if (f.beard) {
    g.beginPath(); g.moveTo(4, 18); g.quadraticCurveTo(14, 20, 22, 18); g.quadraticCurveTo(26, 34, 18, 50); g.quadraticCurveTo(10, 62, 2, 54); g.quadraticCurveTo(-6, 36, 4, 18); g.closePath();
    fs(g, f.beard, C.ink, 2); line(g, [[12, 10], [22, 13]], f.beard, 3);
    for (let i = 0; i < 4; i++) line(g, [[8 + i * 3, 26], [6 + i * 3, 46]], 'rgba(0,0,0,0.15)', 1.4);
  }
  // tilak
  if (f.tilak === 'ram') { line(g, [[17.5, -11], [16, -18]], C.white, 1.8); line(g, [[20, -11], [19, -18]], C.white, 1.8); line(g, [[18.8, -10], [17.8, -17]], C.vermilion, 1.8); }
  else if (f.tilak === 'red') line(g, [[18.6, -9], [17.4, -18]], C.vermilion, 2.6);
  else if (f.tilak === 'shiva') for (let i = 0; i < 3; i++) line(g, [[11, -12 - i * 3], [20, -11 - i * 3]], C.white, 1.4);
  else if (f.tilak === 'dot') circle(g, 18.5, -9.5, 1.8, C.vermilion);
  void t;
}
function monkeyHead(g: G, f: Fig, skin: string, eye: string, t: number) {
  // neck
  g.beginPath(); g.rect(-6, 12, 16, 18); fs(g, skin, null);
  const pts = [[-15, 16], [-23, -2], [-13, -21], [4, -24], [17, -16], [23, -8], [26, -2], [32, 4], [35, 10], [31, 16], [28, 19], [21, 25], [8, 25], [4, 26]];
  smooth(g, pts); fs(g, skin, C.ink, 2.2);
  // face mask
  smooth(g, [[5, -7], [14, -12], [23, -9], [27, -2], [33, 4], [36, 10], [31, 17], [22, 23], [11, 22], [5, 14], [3, 4]]);
  fs(g, f.faceCol ?? C.hanuFace, C.ink, 1.6);
  // cheek fur tufts
  g.strokeStyle = shade(skin, 0.7); g.lineWidth = 1.8;
  for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(4 - i * 2, 6 + i * 4); g.quadraticCurveTo(-2 - i * 2, 9 + i * 4, -1 - i * 2, 13 + i * 4); g.stroke(); }
  // ear
  if (f.hairStyle === 'curly') { for (let i = 0; i < 6; i++) { const a = 2.2 + i * 0.32, rx = -2 + Math.cos(a) * 24, ry = Math.sin(a) * 24 - 4; circle(g, rx, ry, 5.5, shade(skin, 0.7), C.ink, 1.4); curl(g, rx, ry, 4, 0.9, 1, a); g.strokeStyle = shade(skin, 0.5); g.lineWidth = 1.2; g.stroke(); } }
  g.beginPath(); g.arc(-4, 1, 6.5, -1.4, 2.0); fs(g, shade(skin, 0.85), C.ink, 1.6);
  { const sw = Math.sin(t * 3.1 + f.x) * 2.2; circle(g, -5 + sw * 0.3, 14, 5, C.gold, C.ink, 1.2); circle(g, -5 + sw, 20.5, 2.6, C.vermilion); }
  // eye under a heavy brow
  eyeDraw(g, 14.5, -2, 7.2, 3.6, eye);
  g.beginPath(); g.moveTo(5, -8); g.quadraticCurveTo(14, -15, 25, -8); g.quadraticCurveTo(14, -11, 5, -8); fs(g, shade(f.faceCol ?? C.hanuFace, 0.85), C.ink, 1.8);
  // nose and mouth
  circle(g, 31, 4.5, 1.4, C.ink);
  const m = f.mouth ?? 'smile';
  if (m === 'roar' || m === 'open') {
    const o = m === 'roar' ? 1 : 0.5;
    g.beginPath(); g.moveTo(35, 10); g.quadraticCurveTo(30, 14 + 10 * o, 20, 16 + 4 * o); g.quadraticCurveTo(28, 12, 35, 10); fs(g, C.maroon, C.ink, 1.6);
    if (m === 'roar') { g.beginPath(); g.moveTo(32, 11); g.lineTo(31, 14); g.lineTo(29, 11.5); fs(g, C.white, null); }
  } else if (m === 'sing') ellipse(g, 30, 13, 3, 2.4, 0, C.maroon, C.ink, 1.2);
  else { g.beginPath(); g.moveTo(35, 11); g.quadraticCurveTo(30, 15, 22, 14); fs(g, null, C.ink, 1.8); }
  if (f.tilak === 'red') { line(g, [[17, -14], [15.5, -21]], C.vermilion, 3); }
  void t;
}
function ghostHead(g: G, f: Fig, t: number) {
  const w = Math.sin(t * 3) * 2;
  smooth(g, [[-18, 10], [-22, -10], [-8, -26], [10, -26], [22, -10], [20, 10]]); fs(g, f.skin, C.ink, 2);
  ellipse(g, 0, -6, 6, 8 + w * 0.3, 0, C.white, C.ink, 1.6); ellipse(g, 12, -6, 6, 8 - w * 0.3, 0, C.white, C.ink, 1.6);
  circle(g, 2, -4, 2.6, C.ink); circle(g, 14, -4, 2.6, C.ink);
  ellipse(g, 7, 8, 4, 5 + w, 0, C.ink);
}

/* ───────── held things ───────── */
function drawItem(g: G, it: Item, x: number, y: number, t: number, f: Fig) {
  g.save(); g.translate(x, y); g.rotate(it.a ?? 0); const s = it.s ?? 1; g.scale(s, s);
  switch (it.k) {
    case 'mace': {
      stroke2(g, [[0, 26], [0, -64]], 7, C.gold, C.ink, 2, false);
      for (let i = 0; i < 3; i++) line(g, [[-5, 10 - i * 16], [5, 10 - i * 16]], C.vermilion, 3);
      g.beginPath(); g.ellipse(0, -88, 24, 30, 0, 0, Math.PI * 2); fs(g, C.gold, C.ink, 2.4);
      for (const dx of [-12, 0, 12]) { g.beginPath(); g.ellipse(dx, -88, 4, 27, 0, 0, Math.PI * 2); fs(g, null, shade(C.gold, 0.7), 1.6); }
      line(g, [[-23, -88], [23, -88]], C.vermilion, 4);
      for (let i = 0; i < 6; i++) circle(g, -15 + i * 6, -88, 1.8, C.white);
      g.beginPath(); g.moveTo(-6, -116); g.quadraticCurveTo(0, -134, 6, -116); fs(g, C.gold, C.ink, 1.8);
      circle(g, 0, 30, 5, C.gold, C.ink, 1.6);
      break;
    }
    case 'bow': {
      g.beginPath(); g.moveTo(0, -120); g.bezierCurveTo(30, -70, 30, 70, 0, 120); fs(g, null, C.ink, 9); g.beginPath(); g.moveTo(0, -120); g.bezierCurveTo(30, -70, 30, 70, 0, 120); fs(g, null, C.gold, 5);
      line(g, [[0, -120], [-4, 0], [0, 120]], C.cream, 1.4);
      line(g, [[0, -120], [-6, -128]], C.gold, 3); line(g, [[0, 120], [-6, 128]], C.gold, 3);
      break;
    }
    case 'arrow': { line(g, [[0, 60], [0, -80]], C.brown, 3); g.beginPath(); g.moveTo(0, -94); g.lineTo(5, -78); g.lineTo(-5, -78); fs(g, C.gold, C.ink, 1.2); for (const s2 of [-1, 1]) line(g, [[0, 50], [s2 * 7, 64]], C.vermilion, 2.4); break; }
    case 'flag': {
      line(g, [[0, 40], [0, -200]], C.ink, 6); line(g, [[0, 40], [0, -200]], C.gold, 3);
      const w1 = Math.sin(t * 4) * 8, w2 = Math.cos(t * 3.4) * 10;
      g.beginPath(); g.moveTo(0, -196); g.quadraticCurveTo(40, -196 + w1, 90, -170 + w2); g.quadraticCurveTo(46, -160 + w1, 0, -130); g.closePath();
      fs(g, C.saffron, C.ink, 2.2);
      g.save(); g.translate(34, -168 + w1 * 0.5); g.fillStyle = C.white; star4(g, 0, 0, 9); g.restore();
      circle(g, 0, -204, 6, C.gold, C.ink, 1.4);
      break;
    }
    case 'veena': {
      g.save(); g.rotate(-0.25);
      stroke2(g, [[-10, 90], [-10, -110]], 9, C.brown, C.ink, 2, false);
      circle(g, -10, 84, 17, C.marigold, C.ink, 2.2); circle(g, -10, -96, 13, C.marigold, C.ink, 2.2); circle(g, -10, 84, 7, C.brown);
      for (let i = -1; i <= 1; i++) line(g, [[-10 + i * 2, 76], [-10 + i * 2, -84]], C.cream, 1);
      g.restore();
      break;
    }
    case 'mala': { for (let i = 0; i < 18; i++) { const a = (i / 18) * Math.PI * 2; circle(g, Math.sin(a) * 10, 18 + Math.cos(a) * 18 - 18 + 18, 2.6, i ? C.brown : C.gold, C.ink, 0.6); } break; }
    case 'ring': { g.save(); g.translate(0, -6); circle(g, 0, 0, 7, null, C.gold, 3.4); circle(g, 0, -8, 3.6, C.vermilion, C.ink, 1); if (it.glow) { g.globalAlpha = it.glow; g.fillStyle = C.fire2; star4(g, 0, -8, 12); g.globalAlpha = 1; } g.restore(); break; }
    case 'lamp': { g.beginPath(); g.ellipse(0, -4, 26, 6, 0, 0, 7); fs(g, C.gold, C.ink, 1.6); g.save(); g.translate(0, -8); g.scale(0.55, 0.55); g.beginPath(); g.moveTo(-26, 0); g.quadraticCurveTo(0, 26, 26, 0); g.lineTo(-26, 0); fs(g, C.earth, C.ink, 2); flame(g, 0, -4, 0.3, t, 1); g.restore(); break; }
    case 'book': { g.beginPath(); g.rect(-34, -12, 68, 16); fs(g, '#e7c98c', C.ink, 1.8); line(g, [[-34, -4], [34, -4]], C.brown, 1); line(g, [[-14, -12], [-14, 4]], C.vermilion, 2); line(g, [[14, -12], [14, 4]], C.vermilion, 2); break; }
    case 'scroll': { g.beginPath(); g.rect(-8, -50, 16, 60); fs(g, C.cream, C.ink, 1.6); for (let i = 0; i < 6; i++) line(g, [[-5, -44 + i * 9], [5, -44 + i * 9]], 'rgba(0,0,0,0.3)', 1); break; }
    case 'lotus': { line(g, [[0, 30], [0, -30]], C.green, 3); lotus(g, 0, -30, 0.6, 1); break; }
    case 'trident': {
      line(g, [[0, 60], [0, -170]], C.ink, 6); line(g, [[0, 60], [0, -170]], '#c9cfd4', 3);
      g.beginPath(); g.moveTo(-22, -150); g.quadraticCurveTo(-20, -180, -24, -196); g.moveTo(22, -150); g.quadraticCurveTo(20, -180, 24, -196); g.moveTo(-22, -150); g.quadraticCurveTo(0, -136, 22, -150); g.moveTo(0, -150); g.lineTo(0, -206);
      fs(g, null, '#c9cfd4', 5);
      g.save(); g.translate(0, -120); const sh = Math.sin(t * 8) * 0.2; g.rotate(sh); g.beginPath(); g.moveTo(-12, -10); g.lineTo(12, 10); g.lineTo(12, -10); g.lineTo(-12, 10); g.closePath(); fs(g, C.brown, C.ink, 1.6); g.restore();
      break;
    }
    case 'kalash': { g.beginPath(); g.moveTo(-14, -30); g.bezierCurveTo(-30, -20, -30, 10, -12, 14); g.lineTo(12, 14); g.bezierCurveTo(30, 10, 30, -20, 14, -30); g.closePath(); fs(g, C.gold, C.ink, 2); line(g, [[-22, -10], [22, -10]], C.vermilion, 3); for (let i = 0; i < 5; i++) { g.save(); g.translate(-12 + i * 6, -32); g.rotate(-0.8 + i * 0.4); g.beginPath(); g.ellipse(0, -10, 4, 11, 0, 0, 7); fs(g, C.green, C.ink, 1); g.restore(); } circle(g, 0, -42, 10, C.brown, C.ink, 1.4); if (it.glow) { g.globalAlpha = it.glow; sparkle(g, 0, -60, t); g.globalAlpha = 1; } break; }
    case 'cymbal': { const o = Math.abs(Math.sin(t * 6)) * 6; ellipse(g, -o, 0, 5, 16, 0, C.gold, C.ink, 1.6); ellipse(g, o, 0, 5, 16, 0, C.gold, C.ink, 1.6); break; }
    case 'quill': { g.beginPath(); g.moveTo(0, 6); g.bezierCurveTo(16, -20, 18, -56, 6, -78); g.bezierCurveTo(-10, -56, -10, -20, 0, 6); fs(g, C.white, C.ink, 1.4); line(g, [[0, 8], [5, -70]], C.ink, 1.2); for (let i = 0; i < 6; i++) { line(g, [[2 + i * 0.5, -14 - i * 10], [12 - i, -20 - i * 10]], 'rgba(0,0,0,0.35)', 1); line(g, [[2 + i * 0.5, -14 - i * 10], [-6 + i * 0.6, -22 - i * 10]], 'rgba(0,0,0,0.35)', 1); } circle(g, 0, 8, 2, C.ink); break; }
    case 'herb': { for (let i = 0; i < 5; i++) { line(g, [[0, 0], [(i - 2) * 8, -26 - (i % 2) * 8]], C.green, 2); circle(g, (i - 2) * 8, -28 - (i % 2) * 8, 4, C.lime, C.ink, 1); } if (it.glow) { g.globalAlpha = it.glow; sparkle(g, 0, -30, t); g.globalAlpha = 1; } break; }
    case 'mountain': {
      g.save(); g.translate(0, -30);
      mountain(g, 0, 70, 260, 200, '#7d8a5a', '#5f6e42', 9);
      const R = rng(3);
      for (let i = 0; i < 16; i++) { const x = (R() - 0.5) * 220, y = -10 - R() * 110; const gl = 0.5 + 0.5 * Math.sin(t * 4 + i); g.globalAlpha = 0.5 + gl * 0.5; circle(g, x, y, 4 + gl * 3, C.lime); g.fillStyle = C.fire2; star4(g, x, y, 7 * gl); g.globalAlpha = 1; }
      g.restore();
      break;
    }
    case 'noose': { g.beginPath(); g.ellipse(0, 20, 14, 22, 0, 0, 7); fs(g, null, C.brown, 3); line(g, [[0, -2], [0, -30]], C.brown, 3); break; }
    case 'pot': { g.beginPath(); g.moveTo(-18, -16); g.bezierCurveTo(-34, 0, -26, 26, 0, 26); g.bezierCurveTo(26, 26, 34, 0, 18, -16); g.closePath(); fs(g, C.gold, C.ink, 2); for (let i = 0; i < 6; i++) circle(g, -12 + i * 5, -18 - (i % 2) * 4, 4, C.gold, C.ink, 1); break; }
    case 'sword': { line(g, [[0, 12], [0, -90]], '#d9dde0', 6); line(g, [[-12, 6], [12, 6]], C.gold, 5); break; }
    case 'conch': { g.beginPath(); g.moveTo(-10, 10); g.quadraticCurveTo(-18, -20, 0, -30); g.quadraticCurveTo(16, -20, 10, 10); g.closePath(); fs(g, C.white, C.ink, 1.6); curl(g, 0, -10, 8, 1.2, 1, 0); g.strokeStyle = C.ink; g.lineWidth = 1.2; g.stroke(); break; }
    case 'chakra': { g.save(); g.translate(0, -30); g.rotate(t * 3); circle(g, 0, 0, 18, C.gold, C.ink, 2); for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; line(g, [[0, 0], [Math.cos(a) * 16, Math.sin(a) * 16]], C.vermilion, 2); } g.restore(); break; }
    case 'paduka': { for (const dx of [-12, 12]) { ellipse(g, dx, 0, 8, 22, 0, C.gold, C.ink, 1.6); circle(g, dx, -10, 3, C.vermilion); } break; }
    case 'flute': { g.beginPath(); g.rect(-4, -110, 8, 130); fs(g, '#8a5a2a', C.ink, 1.4); for (let i = 0; i < 6; i++) circle(g, 0, -92 + i * 11, 1.8, C.ink); for (const p of [-104, 14]) line(g, [[-4, p], [4, p]], C.gold, 3); g.fillStyle = C.vermilion; g.beginPath(); g.moveTo(3, 16); g.quadraticCurveTo(14, 34, 8, 50); g.quadraticCurveTo(2, 34, 0, 16); g.fill(); break; }
    case 'whip': { line(g, [[0, 20], [0, -50]], C.brown, 3); g.beginPath(); g.moveTo(0, -50); g.quadraticCurveTo(30 + Math.sin(t * 3) * 6, -70, 54, -40 + Math.sin(t * 4) * 8); fs(g, null, C.ink, 1.6); break; }
    case 'reins': { line(g, [[0, 0], [70, -10 + Math.sin(t * 2) * 3], [150, 6]], C.brown, 2.4, true); break; }
    case 'axe': { line(g, [[0, 40], [0, -80]], C.brown, 4); g.beginPath(); g.moveTo(0, -80); g.quadraticCurveTo(30, -88, 34, -58); g.quadraticCurveTo(20, -56, 0, -52); g.closePath(); fs(g, '#dfe4e8', C.ink, 1.8); break; }
    case 'plough': { line(g, [[0, 50], [0, -70]], C.brown, 4); g.beginPath(); g.moveTo(0, -70); g.lineTo(-22, -52); g.lineTo(-28, -70); g.closePath(); fs(g, '#c9cfd4', C.ink, 1.8); break; }
    case 'umbrella': { line(g, [[0, 30], [0, -110]], C.brown, 3); g.beginPath(); g.moveTo(-50, -100); g.quadraticCurveTo(0, -150, 50, -100); g.quadraticCurveTo(0, -112, -50, -100); fs(g, '#e7c98c', C.ink, 1.8); for (let i = -2; i <= 2; i++) line(g, [[0, -126], [i * 24, -104]], C.brown, 1.2); break; }
    case 'spear': { line(g, [[0, 50], [0, -150]], C.brown, 3); g.beginPath(); g.moveTo(0, -172); g.lineTo(7, -148); g.lineTo(-7, -148); g.closePath(); fs(g, '#dfe4e8', C.ink, 1.2); circle(g, 0, -146, 4, C.vermilion); break; }
    case 'shield': { circle(g, 0, 0, 22, C.maroon, C.ink, 2); circle(g, 0, 0, 15, null, C.gold, 2); for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + 0.78; circle(g, Math.cos(a) * 10, Math.sin(a) * 10, 2.6, C.gold); } break; }
  }
  g.restore(); void f;
}
export function sparkle(g: G, x: number, y: number, t: number) {
  g.fillStyle = C.fire2;
  for (let i = 0; i < 6; i++) { const a = t * 2 + i, r = 16 + Math.sin(t * 5 + i) * 6; star4(g, x + Math.cos(a) * r, y + Math.sin(a) * r, 4 + (i % 2) * 3); }
}

/* ───────── special characters ───────── */
/** Ravana: ten heads fanned above one body. */
export function ravana(g: G, x: number, y: number, s: number, t: number, face: 1 | -1 = -1, mood: 'calm' | 'rage' = 'rage') {
  g.save(); g.translate(x, y); g.scale(s * face, s);
  const body: Fig = { ...RAKSHASA, skin: '#4a2f6e', crown: 'mukut', x: 0, y: 0, s: 1.25, t, pose: { fa: [1.4, 0.8], ba: [0.6, 0.6], fl: [0.2, 0.05], bl: [-0.2, 0.05] }, f: { k: 'sword', a: -0.3 }, garland: true, mouth: mood === 'rage' ? 'open' : 'calm' };
  // heads behind
  for (let i = 0; i < 9; i++) {
    const a = -1.25 + (i / 8) * 2.5, r = 60;
    const hx = Math.sin(a) * r * 1.25, hy = -150 - Math.cos(a) * r * 0.65;
    g.save(); g.translate(hx + 8, hy); g.scale(0.82, 0.82); g.rotate(a * 0.25);
    const fh: Fig = { ...body, head: 'demon', skin: i % 2 ? '#5d3a86' : '#3f2a64', crown: 'small', x: 0, y: 0, s: 1, t: t + i, hairStyle: 'wild', mouth: mood === 'rage' && i % 3 === 0 ? 'open' : 'calm' };
    drawHeadPublic(g, fh, t + i * 0.7);
    g.restore();
  }
  g.restore();
  draw(g, { ...body, x, y, s: s * 1.25, face });
}
export function drawHeadPublic(g: G, f: Fig, t: number) { drawHead(g, f, t); }

/** The thousand-hooded serpent: a fan of cobra heads over coiled body. */
export function shesha(g: G, x: number, y: number, s: number, t: number, heads = 9) {
  g.save(); g.translate(x, y); g.scale(s, s);
  // coils
  for (let i = 0; i < 4; i++) { g.beginPath(); g.ellipse(0, 40 + i * 26, 150 - i * 18, 26, 0, 0, Math.PI * 2); fs(g, dotsP(g, C.teal, 'rgba(255,255,255,0.35)', 18, 3), C.ink, 3); }
  // neck rising
  stroke2(g, [[0, 30], [10, -40], [0, -110]], 54, dotsP(g, C.teal, 'rgba(255,255,255,0.35)', 18, 3), C.ink, 3);
  for (let i = 0; i < heads; i++) {
    const a = -1.3 + (i / (heads - 1)) * 2.6, sway = Math.sin(t * 1.4 + i * 0.7) * 0.06;
    const hx = Math.sin(a + sway) * 110, hy = -150 - Math.cos(a + sway) * 70;
    g.save(); g.translate(hx, hy); g.rotate((a + sway) * 0.7);
    g.beginPath(); g.moveTo(0, 60); g.bezierCurveTo(-34, 20, -30, -20, 0, -34); g.bezierCurveTo(30, -20, 34, 20, 0, 60); fs(g, C.peacock, C.ink, 2.4);
    g.beginPath(); g.moveTo(0, 40); g.bezierCurveTo(-18, 14, -16, -10, 0, -18); g.bezierCurveTo(16, -10, 18, 14, 0, 40); fs(g, C.lime, null);
    circle(g, -7, -14, 4, C.white, C.ink, 1.2); circle(g, 7, -14, 4, C.white, C.ink, 1.2); circle(g, -6, -14, 1.8, C.ink); circle(g, 8, -14, 1.8, C.ink);
    circle(g, 0, -2, 5, C.vermilion, C.ink, 1);
    const tf = Math.sin(t * 9 + i) > 0.3 ? 1 : 0; if (tf) line(g, [[0, -34], [0, -46], [-4, -52]], C.vermilion, 1.6);
    g.restore();
  }
  g.restore();
}
/** Brahma's extra faces, seen around the front one. */
export function brahma(g: G, x: number, y: number, s: number, t: number, pose: Pose = P.sit) {
  const f: Fig = { ...BRAHMA, x, y, s, t, pose, f: { k: 'book', a: 0 }, b: { k: 'kalash', a: 0 } };
  // side faces behind
  for (const side of [-1, 1]) {
    g.save(); g.translate(x + side * 22 * s, y + (-116 - 24) * s); g.scale(s * side * 0.9, s * 0.9);
    drawHead(g, { ...f, x: 0, y: 0, crown: 'none' }, t);
    g.restore();
  }
  draw(g, f);
}
/** A bhoot or pishach: a wisp of smoke with big eyes, a curling tail and, for some, little horns. */
export function ghost(g: G, x: number, y: number, s: number, t: number, col = '#c9d8ee', mood = 0, horns = false) {
  g.save(); g.translate(x, y + Math.sin(t * 2 + x) * 8); g.scale(s, s);
  const w = Math.sin(t * 3 + x) * 10;
  // body: a head that thins into a smoke tail curling away
  g.beginPath(); g.moveTo(-26, -40);
  g.bezierCurveTo(-30, -80, 30, -80, 26, -40);
  g.bezierCurveTo(24, -10, 10, 10, 18 + w, 40);
  g.bezierCurveTo(26 + w, 64, 0 + w, 74, -6 + w * 0.5, 58);
  g.bezierCurveTo(4 + w * 0.5, 56, 6, 40, -4, 20);
  g.bezierCurveTo(-16, 0, -24, -14, -26, -40); g.closePath();
  fs(g, col, C.ink, 2.4);
  curl(g, -2 + w * 0.5, 54, 8, 1.1, -1, 0); g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 2; g.stroke();
  // wild hair or horns
  if (horns) { for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(sd * 12, -66); g.quadraticCurveTo(sd * 26, -86, sd * 18, -96); g.quadraticCurveTo(sd * 18, -80, sd * 6, -70); fs(g, C.cream, C.ink, 1.6); } }
  else { g.strokeStyle = C.ink; g.lineWidth = 2; for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(-14 + i * 7, -68); g.quadraticCurveTo(-20 + i * 9 + w * 0.3, -82, -12 + i * 8, -90); g.stroke(); } }
  // little arms
  stroke2(g, [[-22, -30], [-40, -20 - mood * 20], [-46, -32 - mood * 26]], 6, col, C.ink, 1.8);
  stroke2(g, [[22, -30], [40, -20 - mood * 20], [46, -32 - mood * 26]], 6, col, C.ink, 1.8);
  // face
  ellipse(g, -10, -48, 8, 10 + mood * 3, 0, C.white, C.ink, 1.6); ellipse(g, 10, -48, 8, 10 + mood * 3, 0, C.white, C.ink, 1.6);
  circle(g, -9, -46 + mood * 3, 3.2, C.ink); circle(g, 11, -46 + mood * 3, 3.2, C.ink);
  if (mood > 0) ellipse(g, 0, -26, 5, 8, 0, C.maroon, C.ink, 1.4);
  else { g.beginPath(); g.moveTo(-8, -28); g.quadraticCurveTo(0, -22, 8, -28); fs(g, null, C.ink, 2); line(g, [[-5, -27], [-4, -22]], C.white, 2); line(g, [[5, -27], [4, -22]], C.white, 2); }
  g.restore();
}
/** Wind made visible: swirls with a gentle face — Vayu. */
export function vayu(g: G, x: number, y: number, s: number, t: number) {
  g.save(); g.translate(x, y); g.scale(s, s);
  for (let i = 0; i < 6; i++) { g.strokeStyle = i % 2 ? 'rgba(255,255,255,0.85)' : 'rgba(205,189,240,0.8)'; g.lineWidth = 8 - i; g.lineCap = 'round'; curl(g, -40 + i * 20, Math.sin(t + i) * 10, 50 - i * 6, 1.4, i % 2 ? 1 : -1, t * 0.8 + i); g.stroke(); }
  g.restore();
}
/** A seated or standing group helper: draws an array of figures sorted by y. */
export function crowd(g: G, figs: Fig[]) { [...figs].sort((a, b) => a.y - b.y).forEach((f) => draw(g, f)); }
export { poly, dotsP };
