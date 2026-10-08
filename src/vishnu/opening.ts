/**
 * Tableaux for the section cards, the opening (pūrva-bhāga) — Bhishma on
 * his bed of arrows at Kurukshetra, Yudhishthira's questions — and the eight
 * meditation verses (dhyāna).
 */
import { C, PW, PH, type G, circle, clamp, lerp, io, out, seg, bump, devText, sunDisc, glory, cloud, ocean, lotus, star4, curtains, petals, cam, rng, line, flame, diya, garland } from '../chalisa/kit';
import { draw, onGround, P, SARASWATI, type Fig } from '../chalisa/figures';
import { deity, aureole } from '../pichwai/frontal';
import { VISHNU, KRISHNA, KRISHNA_ICON, LAKSHMI, VISHVARUPA, BHISHMA, YUDHISHTHIRA, BHIMA, ARJUNA, NAKULA, SAHADEVA, VYASA, arrowBed, fig, om, avatar } from '../pichwai/cast';
import { emblem, reclining, type EmblemKey } from '../pichwai/emblems';
import { border, canopy, night, dusk, field, milkOcean, cartouche, rays, risingWords, devotee, parijata, cows } from '../pichwai/paint';
import { dn } from '../pichwai/work';
import type { Beat, Scene } from '../pichwai/stage';
import { VISHNU_WORK } from './text';

/** A full moon, painted (the kit's crescent cuts through the canvas). */
function fullMoon(g: G, x: number, y: number, r: number) {
  const gr = g.createRadialGradient(x, y, r * 0.2, x, y, r * 1.5); gr.addColorStop(0, 'rgba(255,250,230,0.5)'); gr.addColorStop(1, 'rgba(255,250,230,0)');
  g.fillStyle = gr; g.fillRect(x - r * 1.5, y - r * 1.5, r * 3, r * 3);
  circle(g, x, y, r, '#fbf5e2', 'rgba(200,190,160,0.8)', 2);
  for (const [dx, dy, rr] of [[-0.3, -0.2, 0.18], [0.25, 0.1, 0.12], [0.05, 0.35, 0.1]]) circle(g, x + dx * r, y + dy * r, rr * r, 'rgba(220,210,190,0.5)');
}

const at = (b: Beat, i: number) => clamp(b.c[i] ?? 0);
const sum = (b: Beat) => b.c.reduce((a, x) => a + x, 0) / Math.max(1, b.c.length);

/* ───────── cards and close ───────── */

export const card: Scene = (g, b) => {
  const t = b.T, si = b.seg.sec, sec = VISHNU_WORK.sections[si];
  night(g, t, 11 + si, 90);
  const o = io(seg(b.t, 0.6, 3.2));
  // behind the curtain: the image this part of the hymn is about
  g.save();
  if (si === 0) { dusk(g); sunDisc(g, 800, 640, 110, t, false); field(g, 660, t); arrowBed(g, 800, 760, 1.0, t); }
  else if (si === 1) { ocean(g, 560, 900, t * 0.5, [C.indigo, C.navy2, C.peacock]); reclining(g, 800, 600, 1.15, t, { brahma: 1 }); }
  else if (si === 2) { glory(g, 800, 430, 160, 420, t, 40, [C.gold, C.cream]); deity(g, 800, 860, 1.2, t, VISHVARUPA(12)); }
  else { aureole(g, 800, 380, 1.1, t); deity(g, 680, 840, 1.05, t, VISHNU); deity(g, 940, 840, 0.9, t, LAKSHMI); }
  g.restore();
  curtains(g, o, t, si % 2 ? C.magenta : C.maroon);
  // the title in a cartouche, and the number of the part
  const a = clamp(b.t / 0.8) * (1 - seg(b.t, b.d - 0.8, b.d));
  cartouche(g, sec.dev, PW / 2, 190, 64, { alpha: a, w: 640 });
  g.save(); g.globalAlpha = a;
  g.font = 'italic 34px "Cormorant Garamond", Georgia, serif'; g.textAlign = 'center'; g.fillStyle = C.cream; g.fillText(sec.title, PW / 2, 290);
  devText(g, `॥ ${dn(si + 1)} ॥`, PW / 2, 128 - 10, 26, C.gold);
  g.restore();
  border(g, C.vermilion);
};

export const close: Scene = (g, b) => {
  const t = b.T;
  night(g, t, 2, 120);
  rays(g, 800, 380, 900, t, 0.8);
  aureole(g, 800, 380, 1.1, t);
  deity(g, 700, 830, 1.05, t, VISHNU);
  deity(g, 940, 830, 0.9, t, LAKSHMI);
  // ārati: a lamp circling before the Lord
  const a = t * 1.4, lx = 800 + Math.cos(a) * 170, ly = 560 + Math.sin(a) * 120;
  diya(g, lx, ly, 1.2, t);
  for (let i = 1; i < 14; i++) { const aa = a - i * 0.08; g.globalAlpha = (1 - i / 14) * 0.5; circle(g, 800 + Math.cos(aa) * 170, 560 + Math.sin(aa) * 120 - 18, 6, C.fire2); }
  g.globalAlpha = 1;
  petals(g, t, 3, 60);
  garland(g, 60, 70, 1540, 70, 40, t);
  cartouche(g, '॥ इति श्रीविष्णुसहस्रनामस्तोत्रम् ॥', 800, 860 - 8, 30, { alpha: clamp(b.t / 2), w: 640 });
  border(g, C.maroon);
};

/* ───────── the opening ───────── */

/** Invocation: Narayana, Nara, Sarasvati and Vyasa in four niches; then Hari Om. */
export const invoke: Scene = (g, b) => {
  const t = b.T;
  night(g, t, 4, 60);
  canopy(g, t, C.maroon);
  if (b.arg === 1) {
    rays(g, 800, 450, 900, t, out(clamp(b.t / 2)));
    om(g, 800, 440, 300 * (0.8 + 0.2 * out(clamp(b.t / 2))), t);
    lotus(g, 800, 720, 3, out(clamp(b.t / 3)));
    cartouche(g, 'हरिः ॐ', 800, 820, 40, { w: 300, alpha: at(b, 1) > 0 ? 1 : clamp(b.t - 1) });
    border(g); return;
  }
  const xs = [260, 620, 980, 1340];
  const lit = (i: number) => clamp(sum(b) * 4.4 - i * 0.9);
  xs.forEach((x, i) => {
    const L = lit(i);
    g.save();
    g.beginPath(); g.moveTo(x - 150, 840); g.lineTo(x - 150, 330); g.quadraticCurveTo(x, 150, x + 150, 330); g.lineTo(x + 150, 840); g.closePath();
    g.fillStyle = `rgba(${lerp(30, 120, L)},${lerp(30, 40, L)},${lerp(80, 60, L)},0.9)`; g.fill(); g.strokeStyle = C.gold; g.lineWidth = 5; g.stroke();
    g.clip();
    glory(g, x, 420, 50, 150 + 30 * L, t, 20, L > 0.2 ? [C.gold, C.cream] : ['#4a4a7a', '#3a3a6a']);
    g.globalAlpha = 0.45 + 0.55 * L;
    if (i === 0) deity(g, x, 800, 0.82, t, VISHNU);
    else if (i === 1) { const f = fig({ ...BHISHMA, skin: '#c98a5a', beard: '#2a1d1a', hair: '#2a1d1a', crown: 'jata', hairStyle: 'jata', dhoti: C.saffron, scarf: C.saffron }, { x, s: 1.25, t, pose: P.sitNamaste, eye: 'closed' }); onGround(f, 800); draw(g, f); }
    else if (i === 2) { const f: Fig = { ...(SARASWATI as Fig), x, y: 0, s: 1.25, t, face: -1, pose: { ...P.sit, fa: [1.2, 1.4], ba: [0.8, 1.3] }, f: { k: 'veena', a: 0.6 } }; onGround(f, 800); draw(g, f); }
    else { const f = fig(VYASA, { x, s: 1.25, t, face: -1, pose: { legs: 'lotus', fa: [1.0, 1.6], ba: [0.6, 1.2] }, f: { k: 'book' } }); onGround(f, 800); draw(g, f); }
    g.restore();
    devText(g, ['नारायण', 'नर', 'सरस्वती', 'व्यास'][i], x, 870 - 6, 26, L > 0.3 ? C.gold : C.lav);
  });
  border(g);
};

/** Śuklāmbaradharam: the Lord in white, moon-bright, obstacles dissolving. */
export const shukla: Scene = (g, b) => {
  const t = b.T, p = sum(b);
  night(g, t, 7, 60);
  fullMoon(g, 800, 360, 230 * (0.9 + 0.1 * p));
  glory(g, 800, 380, 120, 330, t, 30, [C.white, C.lav]);
  // dark clouds of obstacles part
  for (let i = 0; i < 6; i++) { const sd = i % 2 ? 1 : -1, d = io(clamp(p * 1.4 - i * 0.08)); g.save(); g.globalAlpha = 1 - d * 0.9; cloud(g, 800 + sd * (120 + i * 50 + d * 700), 200 + i * 110, 1.4, t, '#3a3f6a', sd as 1 | -1); g.restore(); }
  deity(g, 800, 840, 1.15, t, { ...VISHNU, cloth: C.white, clothFg: C.lav, border: C.gold, glow: 0.7 });
  border(g, C.indigo);
};

/** Vishvaksena, the commander of the Lord's host, and his attendants. */
export const vishvaksena: Scene = (g, b) => {
  const t = b.T, p = sum(b);
  night(g, t, 8, 60);
  aureole(g, 800, 380, 1.0, t, [C.marigold, C.cream]);
  deity(g, 800, 840, 1.05, t, { ...VISHNU, skin: '#5b7fd0', hands: ['abhaya', 'mace', 'chakra', 'conch'], cloth: C.vermilion, clothFg: C.gold });
  // a hundred attendants, the elephant-faced at their head, scattering shadows
  const R = rng(5);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + t * 0.2, x = 800 + Math.cos(a) * 520, y = 470 + Math.sin(a) * 300;
    const f = fig(i === 0 ? { head: 'man', skin: '#e9b46a', hair: '#15101e', hairStyle: 'none', crown: 'small', dhoti: C.gold, dhotiFg: C.vermilion, border: C.vermilion, garland: true } : { head: 'man', skin: ['#7f9ed8', '#c98856', '#8ac0a0'][i % 3], hair: '#15101e', hairStyle: 'short', crown: 'helmet', dhoti: [C.vermilion, C.green, C.saffron][i % 3], dhotiFg: C.gold, border: C.gold }, { x, s: 0.55, t: t + i, face: Math.cos(a) > 0 ? -1 : 1, pose: P.mace, f: { k: i % 2 ? 'mace' : 'spear' } });
    onGround(f, y + 60); draw(g, f);
    if (i === 0) { g.save(); g.translate(x + (Math.cos(a) > 0 ? -8 : 8), y - 10); circle(g, 0, 0, 0.1); g.restore(); }
    const d = clamp(p * 2 - R());
    g.globalAlpha = (1 - d) * 0.6; circle(g, x + 60 * Math.sign(Math.cos(a)), y - 20, 26 * (1 - d) + 2, '#1a1530'); g.globalAlpha = 1;
  }
  border(g, C.indigo);
};

/** Vyasa: his lineage (arg 0), Vyasa and Vishnu as one (1), the Lord who frees (2). */
export const vyasa: Scene = (g, b) => {
  const t = b.T, p = sum(b);
  night(g, t, 6, 50);
  if (b.arg === 0 || b.arg === undefined) {
    // Vasishtha → Shakti → Parashara → Vyasa → Shuka
    const names = ['वसिष्ठ', 'शक्ति', 'पराशर', 'व्यास', 'शुक'];
    names.forEach((nm, i) => {
      const x = 220 + i * 290, L = clamp(p * 6 - i * 1.0 + (i === 3 ? 1 : 0));
      if (i > 0) { line(g, [[x - 240, 560], [x - 50, 560]], `rgba(244,181,28,${0.3 + 0.7 * clamp(p * 6 - i)})`, 4); }
      g.save(); g.globalAlpha = 0.4 + 0.6 * L;
      if (i === 3) glory(g, x, 440, 60, 190, t, 24, [C.gold, C.cream]);
      const look = i === 3 ? VYASA : i === 4 ? { ...VYASA, skin: '#e2a878', beard: undefined, hair: '#2a1d1a', head: 'man' as const } : { ...VYASA, skin: ['#e2b088', '#d8a070', '#c98a5a'][i], beard: '#e9e2d4', hair: '#e9e2d4' };
      const f = fig(look, { x, s: i === 3 ? 1.25 : 1.0, t: t + i, pose: i === 3 ? { legs: 'lotus', fa: [1.0, 1.6], ba: [0.6, 1.2] } : P.sitNamaste, f: i === 3 ? { k: 'book' } : undefined, eye: i === 3 ? 'open' : 'closed' });
      onGround(f, 700); draw(g, f);
      devText(g, nm, x, 760, 28, L > 0.5 ? C.gold : C.lav);
      g.restore();
    });
  } else if (b.arg === 1) {
    // Vyasa as Vishnu, Vishnu as Vyasa: two images, one light
    const k = bump(p);
    glory(g, 800, 430, 100, 380, t, 36, [C.gold, C.cream]);
    deity(g, lerp(560, 700, k), 820, 1.0, t, { ...VISHNU, alpha: 1 - 0.3 * k });
    const f = fig(VYASA, { x: lerp(1040, 900, k), s: 1.5, t, face: -1, pose: { legs: 'lotus', fa: [1.0, 1.6], ba: [0.6, 1.2] }, f: { k: 'book' } }); onGround(f, 820); draw(g, f);
  } else {
    // the unchanging Lord, by whose remembrance the bonds of birth fall away
    rays(g, 800, 380, 900, t, 1);
    aureole(g, 800, 380, 1.1, t);
    deity(g, 800, 830, 1.1, t, VISHNU);
    for (let i = 0; i < 4; i++) {
      const x = [200, 420, 1180, 1400][i], fall = io(clamp(p * 1.8 - 0.2 - i * 0.1));
      devotee(g, x, 840, 0.85, t + i, { act: 'pray', face: x < 800 ? 1 : -1 });
      // a chain round each, breaking and falling
      for (let k = 0; k < 7; k++) { const cy = 640 + k * 22 + fall * (60 + k * 30); g.save(); g.globalAlpha = 1 - fall; g.beginPath(); g.ellipse(x + (k % 2 ? 40 : -40), cy, 14, 9, 0, 0, Math.PI * 2); g.strokeStyle = '#8a8f9a'; g.lineWidth = 5; g.stroke(); g.restore(); }
    }
  }
  border(g, C.indigo);
};

/** Kurukshetra at dusk: Bhishma on his bed of arrows; Yudhishthira asks, Bhishma answers. */
export const arrows: Scene = (g, b) => {
  const t = b.T, arg = Number(b.arg ?? 0), p = sum(b);
  dusk(g);
  sunDisc(g, 1200, 560, 90, t, false);
  field(g, 600, t);
  g.save();
  const keys = [
    [{ p: 0, x: 800, y: 450, z: 1 }, { p: 1, x: 760, y: 480, z: 1.08 }],
    [{ p: 0, x: 780, y: 480, z: 1.1 }, { p: 1, x: 860, y: 480, z: 1.15 }],
    [{ p: 0, x: 760, y: 500, z: 1.12 }, { p: 1, x: 800, y: 490, z: 1.16 }],
    [{ p: 0, x: 900, y: 470, z: 1.05 }, { p: 1, x: 1000, y: 460, z: 1.15 }],
    [{ p: 0, x: 700, y: 480, z: 1.1 }, { p: 1, x: 760, y: 420, z: 1.0 }],
  ][arg];
  cam(g, keys, b.run.p);
  // the bed of arrows, a few watchers far off
  arrowBed(g, 500, 780, 1.7, t);
  // the brothers and Krishna, standing to hear
  const walk = arg === 0 ? io(clamp(b.run.t / 6)) : 1;
  const row = [
    [KRISHNA, 960, 1.15], [YUDHISHTHIRA, 1060, 1.1], [BHIMA, 1160, 1.15], [ARJUNA, 1250, 1.1], [NAKULA, 1335, 1.0], [SAHADEVA, 1415, 1.0],
  ] as const;
  row.forEach(([look, x, s], i) => {
    const xx = lerp(x + 420, x, walk);
    const isY = i === 1, isK = i === 0;
    const pose = isY ? (arg === 1 ? P.namaste : arg === 0 ? P.stand : P.namaste) : isK ? (arg === 3 ? P.bless : P.stand) : P.namaste;
    const f = fig(look, { x: xx, s, t: t + i, face: -1, pose, glow: isK && arg === 3 ? 1 : undefined, eye: isK ? 'open' : 'down' });
    onGround(f, 820); draw(g, f);
  });
  if (arg === 3) glory(g, 960, 520, 60, 200, t, 24, [C.gold, C.cream]);
  // Bhishma's words rising, once he speaks
  if (arg >= 2) risingWords(g, arg === 4 ? ['विश्वं', 'विष्णुः', 'वषट्कारो', 'भूतभव्य', 'प्रभुः'] : ['धर्म', 'विष्णु', 'परमं', 'तेजः', 'शरणम्'], 500, 600, t, 0.9, 200, 300);
  if (arg === 1) { cartouche(g, at(b, 1) > 0 ? 'किं जपन्मुच्यते' : 'किमेकं दैवतं लोके', 760, 360, 34, { alpha: clamp(p * 4) }); }
  g.restore();
  border(g, C.maroon);
};

/** The supreme light, the supreme refuge (arg 0); father of all beings (1). */
export const light: Scene = (g, b) => {
  const t = b.T, p = sum(b);
  night(g, t, 2, 120);
  rays(g, 800, 440, 1100, t, 0.5 + 0.5 * p, 36);
  const ks: EmblemKey[] = b.arg === 1 ? ['star', 'lotus', 'heart', 'om'] : ['sun', 'fire', 'om', 'hands'];
  const spots = [[330, 290], [1270, 290], [330, 640], [1270, 640]];
  ks.forEach((k, i) => { const L = out(clamp(p * 4.5 - i)); g.save(); g.globalAlpha = L; emblem(g, k, spots[i][0], spots[i][1], 1.1 * (0.6 + 0.4 * L), t); g.restore(); });
  glory(g, 800, 420, 140, 360, t, 40, [C.white, C.gold]);
  deity(g, 800, 840, 1.1, t, { ...VISHNU, glow: 1 });
  if (b.arg === 1) for (let i = 0; i < 18; i++) { const ph = (t * 0.15 + i / 18) % 1, a = (i / 18) * Math.PI * 2; g.globalAlpha = Math.sin(ph * Math.PI); circle(g, 800 + Math.cos(a) * (120 + ph * 600), 470 + Math.sin(a) * (80 + ph * 360), 5 + ph * 6, [C.pink, C.sky, C.lime, C.gold][i % 4]); g.globalAlpha = 1; }
  border(g, C.indigo);
};

/** Creation and dissolution: beings stream out of the Lord and back. */
export const dissolve: Scene = (g, b) => {
  const t = b.T, p = sum(b);
  night(g, t, 12, 100);
  const out0 = p < 0.55 ? io(p / 0.55) : io(1 - (p - 0.55) / 0.45);
  const R = rng(3);
  for (let i = 0; i < 90; i++) {
    const a = R() * Math.PI * 2, d = (0.3 + R() * 0.7) * out0, x = 800 + Math.cos(a) * d * 720, y = 450 + Math.sin(a) * d * 420;
    g.globalAlpha = 0.3 + 0.7 * out0; g.fillStyle = [C.gold, C.pink, C.sky, C.lime, C.white][i % 5]; star4(g, x, y, 4 + R() * 7);
  }
  g.globalAlpha = 1;
  glory(g, 800, 450, 60 + 80 * (1 - out0), 260, t, 30, [C.gold, C.cream]);
  deity(g, 800, 760, 0.8 + 0.2 * (1 - out0), t, { ...VISHNU, cosmos: 1 - out0 * 0.5 });
  border(g, C.indigo);
};

/** The rite: seer, metre, deity (0); seed, power, heart (1); the victorious Lord (2). */
export const nyasa: Scene = (g, b) => {
  const t = b.T, p = sum(b), arg = Number(b.arg ?? 0);
  night(g, t, 14, 50);
  canopy(g, t, C.maroon);
  devotee(g, 800, 860, 1.1, t, { act: 'recite' });
  diya(g, 640, 860, 1, t); diya(g, 960, 860, 1, t);
  if (arg === 2) {
    aureole(g, 800, 300, 0.8, t);
    deity(g, 800, 640, 0.8, t, VISHNU);
  } else {
    const items: [EmblemKey | 'vyasa' | 'grid' | 'krishna', string][] = arg === 0 ? [['vyasa', 'ऋषिः'], ['grid', 'छन्दः'], ['krishna', 'देवता']] : [['moon', 'बीजम्'], ['heart', 'शक्तिः'], ['book', 'हृदयम्']];
    items.forEach(([k, label], i) => {
      const x = 400 + i * 400, y = 360, L = out(clamp(p * 3.6 - i));
      g.save(); g.globalAlpha = L;
      circle(g, x, y, 130, 'rgba(255,240,200,0.08)', C.gold, 3);
      if (k === 'vyasa') { const f = fig(VYASA, { x, s: 0.85, t, pose: { legs: 'lotus', fa: [1.0, 1.6], ba: [0.6, 1.2] }, f: { k: 'book' } }); onGround(f, y + 100); draw(g, f); }
      else if (k === 'grid') { for (let r = 0; r < 4; r++) for (let c = 0; c < 8; c++) { const n = r * 8 + c, on = (t * 6) % 32 > n; circle(g, x - 84 + c * 24, y - 40 + r * 26, 8, on ? C.gold : 'rgba(255,255,255,0.2)', null); } }
      else if (k === 'krishna') deity(g, x, y + 120, 0.48, t, KRISHNA_ICON);
      else emblem(g, k, x, y, 1.5, t);
      devText(g, label, x, y + 165, 32, C.gold);
      g.restore();
    });
  }
  border(g, C.indigo);
};

/* ───────── the meditations ───────── */

/** On the shore of the ocean of milk, on a throne of pearls, clouds raining nectar. */
export const milk: Scene = (g, b) => {
  const t = b.T, p = sum(b);
  sky(g);
  milkOcean(g, 600, t);
  for (let i = 0; i < 5; i++) cloud(g, 200 + i * 300, 110 + (i % 2) * 30, 1.2, t, C.white);
  // nectar falling
  for (let i = 0; i < 40; i++) { const ph = (t * 0.4 + i / 40) % 1, x = 160 + ((i * 97) % 1300); g.globalAlpha = Math.sin(ph * Math.PI) * clamp(p * 3); circle(g, x, 160 + ph * 500, 3, '#fff6d8', 'rgba(200,170,120,0.6)', 1); }
  g.globalAlpha = 1;
  // the pearl throne
  g.beginPath(); g.ellipse(800, 690, 260, 40, 0, 0, Math.PI * 2); g.fillStyle = C.gold; g.fill(); g.strokeStyle = C.ink; g.lineWidth = 3; g.stroke();
  for (let i = 0; i < 40; i++) { const a = (i / 40) * Math.PI * 2; circle(g, 800 + Math.cos(a) * 250, 690 + Math.sin(a) * 36, 6, C.white, 'rgba(120,100,80,0.8)', 1); }
  aureole(g, 800, 320, 0.9, t, [C.white, C.cream]);
  deity(g, 800, 700, 0.95, t, { ...VISHNU, stance: 'sit', base: 'none', hands: ['lotus', 'mace', 'chakra', 'conch'] });
  border(g, C.peacock);
  function sky(gg: G) { const gr = gg.createLinearGradient(0, 0, 0, 600); gr.addColorStop(0, '#9fd2ef'); gr.addColorStop(1, '#f6ead0'); gg.fillStyle = gr; gg.fillRect(-100, -100, 1800, 1100); }
};

/** The cosmic body: earth his feet, sky his navel, sun and moon his eyes. */
export const cosmic: Scene = (g, b) => {
  const t = b.T, p = sum(b);
  night(g, t, 31, 160);
  deity(g, 800, 880, 1.25, t, { ...VISHVARUPA(8), cosmos: 1, glow: 0.7 });
  const parts: [EmblemKey, string, number, number][] = [['earth', 'पादौ', 800, 820], ['cosmos', 'नाभिः', 800, 560], ['wind', 'प्राणः', 520, 500], ['sun', 'नेत्रे', 560, 220], ['moon', 'नेत्रे', 1040, 220], ['star', 'शिरः', 800, 110], ['fire', 'मुखम्', 1080, 500], ['ocean', 'कुक्षिः', 1240, 700]];
  parts.forEach(([k, label, x, y], i) => {
    const L = out(clamp(p * 9 - i)); if (L <= 0) return;
    g.save(); g.globalAlpha = L;
    const ex = x < 800 ? x - 260 : x > 800 ? x + 260 : (i === 0 ? 1120 : i === 1 ? 480 : 1120), ey = y;
    line(g, [[x, y], [ex, ey]], 'rgba(255,220,130,0.6)', 2);
    emblem(g, k, ex, ey, 0.8, t); devText(g, label, ex, ey + 64, 24, C.gold);
    g.restore();
  });
  border(g, C.indigo);
};

/** Om, salutation to Vasudeva. */
export const omScene: Scene = (g, b) => {
  const t = b.T;
  night(g, t, 1, 80);
  rays(g, 800, 420, 1000, t, out(clamp(b.t / 2)));
  om(g, 800, 400, 340, t);
  cartouche(g, 'ॐ नमो भगवते वासुदेवाय', 800, 760, 42, { alpha: clamp(b.t / 1.5), w: 720 });
  border(g, C.vermilion);
};

/** Śāntākāram bhujagaśayanam: lying on the serpent, the lotus at his navel. */
export const sheshaScene: Scene = (g, b) => {
  const t = b.T, p = sum(b);
  night(g, t, 23, 100);
  ocean(g, 600, 900, t * 0.5, [C.indigo, C.navy2, C.peacock]);
  g.save(); cam(g, [{ p: 0, x: 700, y: 520, z: 1.2 }, { p: 0.5, x: 800, y: 470, z: 1.0 }, { p: 1, x: 800, y: 440, z: 0.95 }], p);
  reclining(g, 800, 640, 1.3, t, { brahma: io(clamp(p * 1.6)) });
  g.restore();
  // yogis meditating at the margins
  devotee(g, 150, 880, 0.75, t, { act: 'pray' }); devotee(g, 1450, 880, 0.75, t, { act: 'pray', face: -1 });
  border(g, C.peacock);
};

/** Dark as a rain cloud, in yellow silk, the Kaustubha on his chest (0); the bearer of the earth (1). */
export const cloudScene: Scene = (g, b) => {
  const t = b.T;
  const gr = g.createLinearGradient(0, 0, 0, PH); gr.addColorStop(0, '#2a3466'); gr.addColorStop(1, '#5a6aa8'); g.fillStyle = gr; g.fillRect(-100, -100, 1800, 1100);
  for (let i = 0; i < 7; i++) cloud(g, 120 + i * 230, 160 + (i % 2) * 60, 1.5, t, '#4a5590');
  for (let i = 0; i < 60; i++) { const ph = (t * 0.9 + i / 60) % 1, x = (i * 53) % 1600; line(g, [[x, 200 + ph * 700], [x - 6, 220 + ph * 700]], 'rgba(170,200,240,0.5)', 2); }
  if (b.arg === 1) {
    glory(g, 800, 380, 120, 330, t, 30, [C.gold, C.cream]);
    deity(g, 800, 840, 1.1, t, { ...VISHNU, skin: '#2f4a9a' });
    glory(g, 800, 230, 40, 120, t, 20, [C.gold, C.cream]); emblem(g, 'earth', 800, 230, 0.9 + 0.05 * Math.sin(t), t);
  } else {
    glory(g, 800, 380, 120, 330, t, 30, [C.gold, C.cream]);
    deity(g, 800, 840, 1.15, t, { ...VISHNU, skin: '#2f4a9a', cloth: C.gold, clothFg: C.marigold });
    emblem(g, 'gem', 800, 540, 0.45, t, false);
  }
  // peacocks dancing at the rain
  border(g, C.peacock);
};

/** Four-armed, crowned, in yellow robes, the Kaustubha bright: I bow my head. */
export const chaturbhuja: Scene = (g, b) => {
  const t = b.T, p = sum(b);
  night(g, t, 17, 60);
  canopy(g, t, C.maroon);
  aureole(g, 800, 360, 1.05, t);
  deity(g, 800, 820, 1.1, t, VISHNU);
  devotee(g, 340, 860, 1.0, t, { act: p > 0.5 ? 'bow' : 'pray' });
  devotee(g, 1260, 860, 1.0, t + 1, { act: p > 0.6 ? 'bow' : 'pray', face: -1 });
  border(g, C.vermilion);
};

/** Under the parijata, on a lion-throne, Krishna with Rukmini and Satyabhama. */
export const parijataScene: Scene = (g, b) => {
  const t = b.T;
  const gr = g.createLinearGradient(0, 0, 0, PH); gr.addColorStop(0, '#16737a'); gr.addColorStop(1, '#0d3a4a'); g.fillStyle = gr; g.fillRect(-100, -100, 1800, 1100);
  parijata(g, 800, 900, 1.5, t);
  // golden lion throne
  g.beginPath(); g.rect(560, 640, 480, 70); g.fillStyle = C.gold; g.fill(); g.strokeStyle = C.ink; g.lineWidth = 3; g.stroke();
  emblem(g, 'lion', 600, 760, 0.7, t, false); emblem(g, 'lion', 1000, 760, 0.7, t, false);
  deity(g, 800, 690, 0.9, t, { ...VISHNU, stance: 'sit', base: 'none', skin: '#2f4fb0', crown: 'peacock' });
  deity(g, 500, 820, 0.62, t, { ...LAKSHMI, hands: ['lotus', 'varada'], cloth: C.rani });
  deity(g, 1100, 820, 0.62, t, { ...LAKSHMI, hands: ['lotus', 'varada'], cloth: C.green, skin: '#f0c08e' });
  cows(g, 160, 360, 860, 0.5, t, 2, 7); cows(g, 1240, 1440, 860, 0.5, t, 2, 3);
  border(g, C.vermilion);
};

export { avatar, KRISHNA, flame, star4 };
