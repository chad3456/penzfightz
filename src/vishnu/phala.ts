/**
 * Tableaux for the phalaśruti, the verses that tell what the names give,
 * and the closing verses: the four kinds of seeker, the devotee at dawn,
 * the sick healed and the bound set free, the worlds held in the Lord, Arjuna
 * asking and Krishna answering, Parvati asking and Shiva answering on
 * Kailasa, the thousand-formed one, Krishna and Arjuna on the chariot, the
 * avatars age after age, and everything offered to Narayana.
 */
import { C, PW, PH, type G, circle, clamp, lerp, io, out, bump, devText, sunDisc, glory, cloud, ocean, lotus, star4, petals, cam, rng, line, diya, mountain } from '../chalisa/kit';
import { draw, onGround, P, SHIVA, PARVATI, BRAHMA, RAMA, type Fig } from '../chalisa/figures';
import { deity, aureole } from '../pichwai/frontal';
import { VISHNU, KRISHNA, LAKSHMI, VISHVARUPA, VYASA, ARJUNA, fig, om, avatar, AVATAR_DEV } from '../pichwai/cast';
import { emblem, type EmblemKey } from '../pichwai/emblems';
import { border, canopy, night, dawn, noon, cartouche, rays, risingWords, devotee, countryside, kailasa, chariotPair, field, pond } from '../pichwai/paint';
import type { Beat, Scene } from '../pichwai/stage';

const sum = (b: Beat) => b.c.reduce((a, x) => a + x, 0) / Math.max(1, b.c.length);
const A = (b: Beat) => Number(b.arg ?? 0);

/** Four panels, each with a figure and an emblem, lighting one by one. */
function panels(g: G, b: Beat, items: { look?: Fig; em: EmblemKey; label: string; deity?: boolean }[], t: number) {
  const p = sum(b);
  items.forEach((it, i) => {
    const x = 230 + i * 380, L = out(clamp(p * 4.4 - i * 0.9));
    g.save();
    g.beginPath(); g.moveTo(x - 160, 820); g.lineTo(x - 160, 300); g.quadraticCurveTo(x, 140, x + 160, 300); g.lineTo(x + 160, 820); g.closePath();
    g.fillStyle = `rgba(124,29,46,${0.4 + 0.5 * L})`; g.fill(); g.strokeStyle = C.gold; g.lineWidth = 5; g.stroke(); g.clip();
    glory(g, x, 300, 30, 120 + 40 * L, t, 18, L > 0.3 ? [C.gold, C.cream] : ['#5a3a5a', '#4a2a4a']);
    g.globalAlpha = 0.45 + 0.55 * L;
    emblem(g, it.em, x, 300, 0.9, t);
    if (it.look) { const f = { ...it.look, x, y: 0, t: t + i } as Fig; onGround(f, 780); draw(g, f); }
    g.restore();
    devText(g, it.label, x, 860 - 4, 28, L > 0.3 ? C.gold : C.lav);
  });
}

/* ───────── the scenes ───────── */

/** The thousand names told in full; whoever hears them meets no harm. */
const pClose: Scene = (g, b) => {
  const t = b.T, p = sum(b);
  night(g, t, 4, 80);
  canopy(g, t, C.maroon);
  aureole(g, 800, 380, 1.0, t);
  deity(g, 800, 820, 1.05, t, { ...VISHNU, hands: ['varada', 'abhaya', 'chakra', 'conch'] });
  // the palm-leaf book of the names, closing
  const k = io(clamp(p * 1.3));
  g.save(); g.translate(330, 640); g.scale(1.6, 1.6);
  for (let i = 0; i < 8; i++) { g.save(); g.rotate(lerp(-0.6 + i * 0.15, -0.02 + i * 0.004, k)); g.beginPath(); g.rect(-130, -14, 260, 28); g.fillStyle = i % 2 ? '#e8cf96' : '#f1dca8'; g.fill(); g.strokeStyle = C.brown; g.lineWidth = 1.4; g.stroke(); g.restore(); }
  g.restore();
  devotee(g, 1260, 860, 1.0, t, { act: 'pray', face: -1 });
  border(g, C.vermilion);
};

/** The four kinds of person (0) and the four aims (1). */
const pFour: Scene = (g, b) => {
  const t = b.T;
  night(g, t, 9, 40);
  const L = (o: object) => ({ head: 'man', skin: '#c98856', hair: '#15101e', hairStyle: 'short', crown: 'none', dhoti: C.white, dhotiFg: C.saffron, border: C.saffron, s: 1.0, ...o }) as Fig;
  if (A(b) === 0) panels(g, b, [
    { look: L({ head: 'sage', beard: '#e9e2d4', hair: '#e9e2d4', hairStyle: 'bun', janeu: true, pose: { legs: 'lotus', fa: [1.0, 1.6] }, f: { k: 'book' } }), em: 'book', label: 'वेदान्तगः' },
    { look: L({ crown: 'helmet', dhoti: C.maroon, scarf: C.gold, pose: P.mace, f: { k: 'sword' }, b: { k: 'shield' } }), em: 'crown', label: 'विजयी' },
    { look: L({ crown: 'turban', turban: C.saffron, dhoti: C.green, belly: 1.3, pose: P.bless, f: { k: 'pot' } }), em: 'pot', label: 'धनसमृद्धः' },
    { look: L({ dhoti: '#d9b47a', pose: P.stride, f: { k: 'plough', a: 0.3 } }), em: 'heart', label: 'सुखमवाप्नुयात्' },
  ], t);
  else panels(g, b, [
    { em: 'book', label: 'धर्मः' }, { em: 'gem', label: 'अर्थः' }, { em: 'heart', label: 'कामः' }, { em: 'lotus', label: 'प्रजाः' },
  ], t);
  border(g, C.maroon);
};

/** The devotee who rises at dawn and recites (0); fame, kin and lasting fortune (1). */
const pDawn: Scene = (g, b) => {
  const t = b.T, p = sum(b);
  dawn(g);
  sunDisc(g, 1200, 360 - 120 * io(p), 90, t, true);
  countryside(g, 560, t);
  pond(g, 760, t, 5);
  devotee(g, 700, 760, 1.25, t, { act: 'recite' });
  if (A(b) === 1) { for (let i = 0; i < 5; i++) devotee(g, 900 + i * 110, 760, 0.8, t + i, { act: 'pray', face: -1 }); glory(g, 700, 520, 30, 120, t, 18, [C.gold, C.cream]); }
  risingWords(g, ['विष्णु', 'नाम', 'हरि', 'वासुदेव'], 700, 520, t, 0.8, 80, 220, 8);
  border(g, C.peacock);
};

/** Fearless and strong (0); the sick healed, the bound freed (1); crossing every hardship (2). */
const pBoons: Scene = (g, b) => {
  const t = b.T, p = sum(b), a = A(b);
  night(g, t, 13, 50);
  aureole(g, 800, 300, 0.75, t);
  deity(g, 800, 640, 0.75, t, { ...VISHNU, hands: ['abhaya', 'varada', 'chakra', 'conch'] });
  if (a === 2) {
    // a river of troubles, and a boat crossing it under the Lord's gaze
    ocean(g, 680, 900, t * 0.7, ['#2a2f5a', '#1c2a63', '#3a3f6a']);
    const x = lerp(160, 1400, io(p));
    g.save(); g.translate(x, 760 + Math.sin(t * 2) * 6);
    g.beginPath(); g.moveTo(-90, -10); g.quadraticCurveTo(0, 40, 90, -10); g.closePath(); g.fillStyle = C.brown; g.fill(); g.strokeStyle = C.ink; g.lineWidth = 2; g.stroke();
    g.restore();
    devotee(g, x, 754 + Math.sin(t * 2) * 6, 0.7, t, { act: 'pray' });
  } else {
    const n = 5;
    for (let i = 0; i < n; i++) {
      const x = 160 + i * 320 + (i >= 2 ? 160 : 0); if (i === 2) continue;
      const healed = io(clamp(p * 2.2 - i * 0.25));
      g.save(); g.filter = `grayscale(${Math.round((1 - healed) * 100)}%)`;
      devotee(g, x, 860, 0.95, t + i, { act: healed > 0.6 ? 'stand' : 'bow', face: x < 800 ? 1 : -1, glow: healed > 0.8 ? 0.6 : undefined });
      g.restore();
      if (a === 1) for (let k = 0; k < 5; k++) { const cy = 720 + k * 20 + healed * (80 + k * 40); g.save(); g.globalAlpha = 1 - healed; g.beginPath(); g.ellipse(x + (k % 2 ? 30 : -30), cy, 12, 8, 0, 0, Math.PI * 2); g.strokeStyle = '#8a8f9a'; g.lineWidth = 5; g.stroke(); g.restore(); }
    }
  }
  border(g, C.indigo);
};

/** Refuge in Vasudeva: the devotee held in his hands; no fear, no anger. */
const pRefuge: Scene = (g, b) => {
  const t = b.T, p = sum(b), a = A(b);
  night(g, t, 21, 80);
  rays(g, 800, 380, 900, t, 0.6);
  aureole(g, 800, 360, 1.0, t);
  deity(g, 800, 820, 1.05, t, { ...VISHNU, hands: ['abhaya', 'varada', 'chakra', 'conch'] });
  // what falls away: the wheel of birth and death (1), the shadows of anger and greed (3)
  const fears: [string, number, number][] = a === 3 ? [['क्रोधः', 300, 300], ['मात्सर्यम्', 1300, 300], ['लोभः', 300, 620], ['अशुभा मतिः', 1300, 620]] : a === 1 ? [['जन्म', 300, 300], ['मृत्युः', 1300, 300], ['जरा', 300, 620], ['व्याधिः', 1300, 620]] : [];
  fears.forEach(([w, x, y], i) => { const d = io(clamp(p * 2 - i * 0.2)); g.save(); g.globalAlpha = 1 - d; circle(g, x, y, 80 * (1 - d * 0.5), 'rgba(20,10,30,0.8)'); devText(g, w, x, y, 34, C.lav); g.restore(); });
  if (a === 0 || a === 2) {
    const gifts: EmblemKey[] = a === 2 ? ['heart', 'mountain', 'gem', 'book'] : ['hands', 'lotus', 'om', 'lamp'];
    gifts.forEach((k, i) => { const L = out(clamp(p * 4 - i)); g.save(); g.globalAlpha = L; emblem(g, k, [300, 1300, 300, 1300][i], [300, 300, 620, 620][i], 0.9 + 0.2 * L, t); g.restore(); });
  }
  devotee(g, 560, 860, 0.9, t, { act: 'pray' });
  devotee(g, 1040, 860, 0.9, t + 1, { act: 'pray', face: -1 });
  border(g, C.vermilion);
};

/** All held in Vasudeva: heaven, sun, moon, stars, ocean (0); all beings (1); senses and mind (2); conduct and dharma (3). */
const pHeld: Scene = (g, b) => {
  const t = b.T, p = sum(b), a = A(b);
  night(g, t, 33, 160);
  deity(g, 800, 880, 1.2, t, { ...VISHVARUPA(8), cosmos: 1, glow: 0.6 });
  const sets: [EmblemKey, string][][] = [
    [['sun', 'सूर्यः'], ['moon', 'चन्द्रः'], ['star', 'नक्षत्राणि'], ['ocean', 'महोदधिः'], ['earth', 'मही'], ['cosmos', 'खम्']],
    [['crown', 'देवाः'], ['sword', 'असुराः'], ['flute', 'गन्धर्वाः'], ['serpent', 'उरगाः'], ['pot', 'यक्षाः'], ['fire', 'राक्षसाः']],
    [['eye', 'इन्द्रियाणि'], ['heart', 'मनः'], ['lamp', 'बुद्धिः'], ['fire', 'तेजः'], ['mountain', 'धृतिः'], ['earth', 'क्षेत्रम्']],
    [['book', 'आगमाः'], ['lotus', 'आचारः'], ['thread', 'धर्मः'], ['hands', 'अच्युतः'], ['om', 'सत्'], ['mala', 'तपः']],
  ];
  sets[a].forEach(([k, label], i) => {
    const ang = -Math.PI / 2 + (i - 2.5) * 0.62 + Math.sin(t * 0.2) * 0.04, r = 520;
    const x = 800 + Math.cos(ang) * r * 1.15, y = 520 + Math.sin(ang) * r * 0.75;
    const L = out(clamp(p * 6.5 - i)); if (L <= 0) return;
    g.save(); g.globalAlpha = L; line(g, [[800, 470], [x, y]], 'rgba(255,220,130,0.35)', 2); emblem(g, k, x, y, 0.8, t); devText(g, label, x, y + 62, 24, C.gold); g.restore();
  });
  border(g, C.indigo);
};

/** All comes from Narayana (0); the arts and sciences (1); one appearing as many — one moon in many pots (2). */
const pFrom: Scene = (g, b) => {
  const t = b.T, p = sum(b), a = A(b);
  night(g, t, 25, 90);
  if (a === 2) {
    // one moon, reflected in a row of water pots
    const mx = 800, my = 200;
    circle(g, mx, my, 70, '#fbf5e2', 'rgba(200,190,160,0.8)', 2); glory(g, mx, my, 72, 130, t, 24, [C.white, C.lav]);
    for (let i = 0; i < 9; i++) {
      const x = 160 + i * 160, L = out(clamp(p * 5 - i * 0.4));
      g.beginPath(); g.moveTo(x - 50, 700); g.quadraticCurveTo(x - 80, 790, x, 820); g.quadraticCurveTo(x + 80, 790, x + 50, 700); g.closePath(); g.fillStyle = C.earth; g.fill(); g.strokeStyle = C.ink; g.lineWidth = 2; g.stroke();
      g.beginPath(); g.ellipse(x, 700, 50, 14, 0, 0, Math.PI * 2); g.fillStyle = C.navy; g.fill(); g.stroke();
      g.globalAlpha = L; circle(g, x + Math.sin(t + i) * 4, 700, 10, '#fbf5e2'); g.globalAlpha = 1;
      line(g, [[mx, my + 70], [x, 690]], `rgba(255,250,220,${0.15 * L})`, 2);
    }
    deity(g, 800, 620, 0.6, t, { ...VISHNU, base: 'none' });
  } else {
    glory(g, 800, 440, 100, 320, t, 36, [C.gold, C.cream]);
    deity(g, 800, 760, 0.95, t, { ...VISHNU, skin: '#3f6fd0' });
    const ks: [EmblemKey, string][] = a === 1 ? [['mala', 'योगः'], ['book', 'ज्ञानम्'], ['om', 'साङ्ख्यम्'], ['flute', 'शिल्पम्'], ['wheel', 'विद्याः'], ['lamp', 'वेदाः']] : [['mala', 'ऋषयः'], ['lotus', 'पितरः'], ['crown', 'देवाः'], ['earth', 'महाभूतानि'], ['gem', 'धातवः'], ['tree', 'जगत्']];
    ks.forEach(([k, label], i) => {
      const ang = (i / ks.length) * Math.PI * 2 - Math.PI / 2, d = out(clamp(p * 3.6 - i * 0.3));
      const x = 800 + Math.cos(ang) * 560 * d, y = 470 + Math.sin(ang) * 330 * d;
      if (d <= 0) return;
      g.save(); g.globalAlpha = d; emblem(g, k, x, y, 0.75, t); devText(g, label, x, y + 58, 22, C.gold); g.restore();
    });
  }
  border(g, C.indigo);
};

/** Vyasa sings the hymn (0); its worshippers never meet defeat (1). */
const pVyasa: Scene = (g, b) => {
  const t = b.T;
  night(g, t, 41, 60);
  canopy(g, t, C.maroon);
  mountain(g, 800, 900, 1600, 300, '#5a6aa8', '#3a4a88', 3);
  const f = fig(VYASA, { x: 520, s: 1.6, t, pose: { legs: 'lotus', fa: [1.0, 1.6], ba: [0.6, 1.2] }, f: { k: 'book' }, mouth: 'sing' }); onGround(f, 820); draw(g, f);
  risingWords(g, ['श्रीविष्णोः', 'स्तवम्', 'पुण्डरीकाक्षम्', 'अजम्'], 560, 500, t, 1, 120, 300, 12);
  aureole(g, 1100, 380, 0.85, t);
  deity(g, 1100, 760, 0.85, t, VISHNU);
  if (A(b) === 1) for (let i = 0; i < 4; i++) devotee(g, 900 + i * 140, 870, 0.65, t + i, { act: 'stand', face: -1, glow: 0.4 });
  border(g, C.vermilion);
};

/** Arjuna asks (0); Krishna answers: by one verse I am praised (1). */
const pArjuna: Scene = (g, b) => {
  const t = b.T, a = A(b);
  noon(g);
  field(g, 640, t);
  if (a === 1) glory(g, 700, 420, 60, 280, t, 30, [C.gold, C.cream]);
  const k = fig(KRISHNA, { x: 700, s: 1.6, t, face: 1, pose: a === 1 ? P.bless : P.stand, f: { k: 'flute', a: 0.2 }, mouth: 'smile', glow: a === 1 ? 1 : undefined }); onGround(k, 840); draw(g, k);
  const ar = fig(ARJUNA, { x: 1000, s: 1.55, t, face: -1, pose: a === 1 ? P.kneel : P.namaste }); onGround(ar, 840); draw(g, ar);
  if (a === 0) cartouche(g, 'पद्मपत्रविशालाक्ष', 1000, 230, 34, { alpha: clamp(b.t), w: 420 });
  else cartouche(g, 'श्लोकेनैकेन वा स्तुतः', 700, 200, 34, { alpha: clamp(b.t), w: 420 });
  border(g, C.peacock);
};

/** Vasudeva the dwelling of all beings. */
const pVasudeva: Scene = (g, b) => {
  const t = b.T, p = sum(b);
  night(g, t, 51, 140);
  rays(g, 800, 450, 1000, t, 0.6);
  // three worlds as three bands inside a great egg of light
  const k = out(clamp(p * 2));
  g.save(); g.globalAlpha = k;
  ['#1c2a63', '#2f8a4a', '#7c1d2e'].forEach((c, i) => { g.beginPath(); g.ellipse(800, 300 + i * 160, 380 - Math.abs(i - 1) * 60, 70, 0, 0, Math.PI * 2); g.fillStyle = c; g.fill(); g.strokeStyle = C.gold; g.lineWidth = 3; g.stroke(); devText(g, ['स्वः', 'भुवः', 'भूः'][i], 800 + 300 - Math.abs(i - 1) * 60, 300 + i * 160, 30, C.gold); });
  g.restore();
  deity(g, 800, 840, 1.05, t, { ...VISHNU, alpha: 0.9 });
  border(g, C.indigo);
};

/** Kailasa: Parvati asks (0); Shiva answers — Rama, Rama, Rama (1). */
const pKailasa: Scene = (g, b) => {
  const t = b.T, p = sum(b), a = A(b);
  kailasa(g, t);
  const sh = { ...(SHIVA as Fig), x: 640, y: 0, s: 1.6, t, pose: { ...P.sit, fa: a === 1 ? [1.2, 1.5] : [0.4, 1.2], ba: [-0.2, 1.0] }, f: { k: 'trident' }, eye: a === 1 ? 'closed' : 'open', mouth: a === 1 ? 'sing' : 'calm' } as Fig;
  onGround(sh, 760); draw(g, sh);
  const pv = { ...(PARVATI as Fig), x: 960, y: 0, s: 1.45, t, face: -1, pose: P.sitNamaste } as Fig;
  onGround(pv, 760); draw(g, pv);
  if (a === 1) {
    ['श्रीराम', 'राम', 'राम'].forEach((w, i) => { const L = out(clamp(p * 4 - i * 0.6)); g.save(); g.globalAlpha = L; cartouche(g, w, 520 + i * 280, 200 - L * 20, 44, { w: 220 }); g.restore(); });
    if (p > 0.6) { g.save(); g.globalAlpha = clamp((p - 0.6) * 3); const r = { ...(RAMA as Fig), x: 1340, y: 0, s: 1.2, t, face: -1, pose: P.bless, b: { k: 'bow' }, glow: 1 } as Fig; onGround(r, 820); draw(g, r); g.restore(); }
  } else cartouche(g, 'केनोपायेन लघुना', 960, 220, 36, { alpha: clamp(b.t), w: 400 });
  border(g, C.indigo);
};

/** Brahma praises the one of a thousand forms, feet, eyes, heads and arms. */
const pBrahma: Scene = (g, b) => {
  const t = b.T, p = sum(b);
  night(g, t, 61, 200);
  // a thousand eyes opening across the sky
  const R = rng(9);
  for (let i = 0; i < 80; i++) { const x = R() * PW, y = R() * 620, o = clamp(p * 3 - R() * 2); if (o <= 0) continue; g.save(); g.globalAlpha = o * 0.8; emblem(g, 'eye', x, y, 0.22, t, false); g.restore(); }
  deity(g, 800, 880, 1.25, t, VISHVARUPA(16));
  lotus(g, 210, 840, 2.4, 1);
  const br = { ...(BRAHMA as Fig), x: 210, y: 0, s: 1.1, t, pose: P.sitNamaste, eye: 'up', mouth: 'sing' } as Fig; onGround(br, 820); draw(g, br);
  border(g, C.vermilion);
};

/** The colophon: the Mahabharata's palm-leaf book, Om Tat Sat. */
const pColophon: Scene = (g, b) => {
  const t = b.T, p = sum(b);
  night(g, t, 71, 60);
  canopy(g, t, C.maroon);
  const k = io(clamp(p * 2));
  // a stack of palm leaves, its cover opening
  g.save(); g.translate(800, 560);
  for (let i = 0; i < 14; i++) { g.beginPath(); g.rect(-420, -i * 6, 840, 44); g.fillStyle = i % 2 ? '#e8cf96' : '#f1dca8'; g.fill(); g.strokeStyle = C.brown; g.lineWidth = 1.2; g.stroke(); }
  g.beginPath(); g.rect(-430, -96, 860, 20); g.fillStyle = C.maroon; g.fill();
  line(g, [[-240, -100], [-240, 50]], C.vermilion, 3); line(g, [[240, -100], [240, 50]], C.vermilion, 3);
  g.restore();
  devText(g, 'महाभारते अनुशासनपर्वणि', 800, 420, 40, C.gold);
  g.save(); g.globalAlpha = k; om(g, 800, 240, 120, t); devText(g, 'ॐ तत्सत्', 800, 340, 44, C.cream); g.restore();
  diya(g, 300, 800, 1.2, t); diya(g, 1300, 800, 1.2, t);
  border(g, C.vermilion);
};

/** Where Krishna is, lord of yoga, and Arjuna the archer, there are fortune and victory. */
const pYatra: Scene = (g, b) => {
  const t = b.T, p = sum(b);
  dawn(g);
  sunDisc(g, 1180, 300, 110, t, true);
  field(g, 660, t);
  g.save(); cam(g, [{ p: 0, x: 700, y: 500, z: 1.15 }, { p: 1, x: 800, y: 450, z: 1.0 }], b.run.p);
  chariotPair(g, 640, 820, 1.3, t, { gallop: 0.6, arjuna: 'lift', krishna: 'drive', glow: 0.7 });
  g.restore();
  (['lotus', 'crown', 'pot', 'mountain'] as EmblemKey[]).forEach((k, i) => { const L = out(clamp(p * 4.2 - i)); g.save(); g.globalAlpha = L; emblem(g, k, 980 + i * 150, 160, 0.7, t); devText(g, ['श्रीः', 'विजयः', 'भूतिः', 'ध्रुवा नीतिः'][i], 980 + i * 150, 222, 22, C.maroon); g.restore(); });
  border(g, C.vermilion);
};

/** Yoga and kshema: those who worship me with undivided minds, I carry what they need. */
const pYoga: Scene = (g, b) => {
  const t = b.T, p = sum(b);
  night(g, t, 81, 60);
  devotee(g, 520, 820, 1.4, t, { act: 'pray' });
  glory(g, 520, 560, 30, 140, t, 20, [C.gold, C.cream]);
  const x = lerp(1400, 760, io(clamp(p * 1.5)));
  const k = fig(KRISHNA, { x, s: 1.5, t, face: -1, pose: { fa: [1.4, 1.2], ba: [1.3, 1.3], fl: [0.06, 0.04], bl: [-0.07, 0.04] }, f: { k: 'pot' }, mouth: 'smile', glow: 0.7 }); onGround(k, 820); draw(g, k);
  border(g, C.peacock);
};

/** Age after age: the ten avatars in a ring. */
const pYuge: Scene = (g, b) => {
  const t = b.T, p = sum(b);
  night(g, t, 91, 80);
  glory(g, 800, 450, 80, 260, t, 30, [C.gold, C.cream]);
  deity(g, 800, 640, 0.6, t, VISHNU);
  for (let i = 0; i < 10; i++) {
    const ang = -Math.PI / 2 + (i / 10) * Math.PI * 2 + t * 0.03, x = 800 + Math.cos(ang) * 600, y = 400 + Math.sin(ang) * 300;
    const L = out(clamp(p * 11 - i));
    g.save(); g.globalAlpha = 0.25 + 0.75 * L; avatar(g, i, x, y + 90, 0.56, t); devText(g, AVATAR_DEV[i], x, y + 118, 24, C.gold); g.restore();
  }
  border(g, C.vermilion);
};

/** The afflicted, chanting "Narayana", are freed from sorrow. */
const pNarayana: Scene = (g, b) => {
  const t = b.T, p = sum(b);
  const k = io(clamp(p * 1.4));
  night(g, t, 101, 60);
  g.save(); g.globalAlpha = k; dawn(g); g.restore();
  for (let i = 0; i < 6; i++) {
    const x = 180 + i * 250, healed = clamp(k * 1.3 - i * 0.05);
    g.save(); g.filter = `grayscale(${Math.round((1 - healed) * 100)}%)`;
    devotee(g, x, 860, 0.95, t + i, { act: healed > 0.5 ? 'stand' : 'bow', face: i < 3 ? 1 : -1 });
    g.restore();
  }
  risingWords(g, ['नारायण', 'नारायण', 'नारायण'], 800, 620, t, 1, 600, 420, 18);
  border(g, C.peacock);
};

/** Whatever I do, I offer it all to Narayana. */
const pOffer: Scene = (g, b) => {
  const t = b.T, p = sum(b);
  night(g, t, 111, 60);
  canopy(g, t, C.maroon);
  aureole(g, 1060, 360, 0.95, t);
  deity(g, 1060, 800, 1.0, t, VISHNU);
  devotee(g, 480, 860, 1.3, t, { act: 'offer' });
  // the offerings float from the devotee's hands to the Lord's feet
  const ks: EmblemKey[] = ['hands', 'heart', 'book', 'eye', 'lamp'];
  ks.forEach((k, i) => { const ph = clamp(p * 1.6 - i * 0.18); if (ph <= 0 || ph >= 1) return; const x = lerp(560, 1020, ph), y = lerp(680, 760, ph) - bump(ph) * 260; g.save(); g.globalAlpha = bump(ph); emblem(g, k, x, y, 0.55, t); g.restore(); });
  petals(g, t, 7, 20);
  border(g, C.vermilion);
};

/** The end: Vishnu and Lakshmi, Om Tat Sat. */
const pEnd: Scene = (g, b) => {
  const t = b.T;
  night(g, t, 121, 120);
  rays(g, 800, 380, 900, t, 0.8);
  aureole(g, 800, 380, 1.1, t);
  deity(g, 690, 820, 1.0, t, VISHNU);
  deity(g, 930, 820, 0.86, t, LAKSHMI);
  petals(g, t, 3, 50);
  cartouche(g, 'ॐ तत्सत्', 800, 110, 44, { w: 300, alpha: clamp(b.t) });
  border(g, C.maroon);
};

export const PHALA_SCENES: Record<string, Scene> = {
  'p-close': pClose, 'p-four': pFour, 'p-dawn': pDawn, 'p-boons': pBoons, 'p-refuge': pRefuge, 'p-held': pHeld, 'p-from': pFrom,
  'p-vyasa': pVyasa, 'p-arjuna': pArjuna, 'p-vasudeva': pVasudeva, 'p-kailasa': pKailasa, 'p-brahma': pBrahma, 'p-colophon': pColophon,
  'p-yatra': pYatra, 'p-yoga': pYoga, 'p-yuge': pYuge, 'p-narayana': pNarayana, 'p-offer': pOffer, 'p-end': pEnd,
};
export { cloud, star4, PH };
