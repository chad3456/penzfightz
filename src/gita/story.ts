/**
 * The Gita's story tableaux: the blind king and Sanjaya in the palace, the
 * armies drawn up, the conches, the chariot driven between the armies,
 * Arjuna's despair, the cosmic form and the mouths of Time, Arjuna's
 * surrender and his rising, and the chapter cards, colophons and close.
 */
import { C, PW, PH, type G, circle, clamp, lerp, io, out, seg, bump, devText, sunDisc, glory, cloud, star4, petals, cam, rng, line, diya, curtains, shake, ellipse } from '../chalisa/kit';
import { draw, onGround, P, type Fig, type Look } from '../chalisa/figures';
import { deity, aureole } from '../pichwai/frontal';
import { VISHNU, KRISHNA, KRISHNA_ICON, VISHVARUPA, ARJUNA, BHISHMA, DRONA, DURYODHANA, KARNA, DHRITARASHTRA, SANJAYA, YUDHISHTHIRA, BHIMA, NAKULA, SAHADEVA, WARRIOR, fig, army, hall, throne, soundRings, bigConch, om } from '../pichwai/cast';
import { emblem, type EmblemKey } from '../pichwai/emblems';
import { border, night, dusk, dawn, field, cartouche, rays, chariotPair, sky } from '../pichwai/paint';
import { dn } from '../pichwai/work';
import type { Beat, Scene } from '../pichwai/stage';
import { GITA_WORK, CHAPTERS } from './text';
import { vignette, CHAPTER_VIGNETTE } from './vignettes';

export const sum = (b: Beat) => b.c.reduce((a, x) => a + x, 0) / Math.max(1, b.c.length);
const A = (b: Beat) => Number(b.arg ?? 0);
const vnum = (b: Beat) => Number(b.v?.id.split('.')[1] ?? 0);

/** Chapter colours, for borders and cards. */
export const CH_COL = [C.maroon, C.peacock, C.vermilion, C.indigo, C.green, C.magenta, C.saffron, C.navy2, C.rani, C.gold, C.ink, C.pink, C.teal, C.red, C.olive, C.brown, C.lilac, C.vermilion];

/** The two armies facing each other across the field at the given hour. */
export function battlefield(g: G, t: number, hour: 'dawn' | 'day' | 'dusk' = 'day', stir = 0.5) {
  if (hour === 'dawn') dawn(g); else if (hour === 'dusk') dusk(g); else sky(g, '#7ec3ee', '#c8e2f2', '#f6e3bc');
  if (hour !== 'day') sunDisc(g, hour === 'dawn' ? 1180 : 1240, 470, 80, t, false);
  field(g, 560, t);
  army(g, -40, 520, 640, 1, t, { rows: 4, col: C.teal, banner: C.saffron, seed: 2, stir, elephants: true });
  army(g, 1080, 1660, 640, -1, t, { rows: 4, col: C.maroon, banner: C.vermilion, seed: 5, stir, elephants: true });
}

/* ───────── cards, colophons, close ───────── */

export const card: Scene = (g, b) => {
  const t = b.T, si = b.seg.sec, sec = GITA_WORK.sections[si];
  night(g, t, 31 + si, 90);
  const o = io(seg(b.t, 0.6, 3.4));
  // behind the curtain, the chapter's image in a roundel
  g.save();
  glory(g, 800, 520, 120, 330, t, 32, [C.gold, C.cream]);
  circle(g, 800, 520, 230, '#fbf3df', C.gold, 8);
  g.beginPath(); g.arc(800, 520, 222, 0, Math.PI * 2); g.clip();
  vignette(g, CHAPTER_VIGNETTE[si], 800, 520, 222, t, clamp(b.t / 4));
  g.restore();
  circle(g, 800, 520, 230, null, C.ink, 2);
  curtains(g, o, t, CH_COL[si]);
  const a = clamp(b.t / 0.8) * (1 - seg(b.t, b.d - 0.8, b.d));
  cartouche(g, sec.dev, PW / 2, 150, 54, { alpha: a, w: Math.max(460, sec.dev.length * 30) });
  g.save(); g.globalAlpha = a;
  devText(g, `अध्यायः ${dn(si + 1)}`, PW / 2, 78, 28, C.gold);
  g.font = 'italic 32px "Cormorant Garamond", Georgia, serif'; g.textAlign = 'center'; g.fillStyle = C.cream; g.fillText(CHAPTERS[si].en, PW / 2, 236);
  g.restore();
  border(g, CH_COL[si]);
};

export const colophon: Scene = (g, b) => {
  const t = b.T, ci = Number(b.arg ?? 0), p = sum(b);
  dusk(g);
  sunDisc(g, 800, 640, 120, t, false);
  field(g, 690, t);
  chariotPair(g, 1180, 860, 0.62, t, { arjuna: 'namaste', krishna: 'teach' });
  // the palm-leaf book closing on the chapter
  g.save(); g.translate(560, 760);
  for (let i = 0; i < 10; i++) { g.save(); g.rotate(lerp(-0.5 + i * 0.1, 0, io(clamp(p * 1.4)))); g.beginPath(); g.rect(-220, -18 - i * 3, 440, 36); g.fillStyle = i % 2 ? '#e8cf96' : '#f1dca8'; g.fill(); g.strokeStyle = C.brown; g.lineWidth = 1.4; g.stroke(); g.restore(); }
  g.restore();
  devText(g, `॥ ${dn(ci + 1)} ॥`, 560, 690, 36, C.maroon);
  g.save(); g.globalAlpha = clamp(p * 2); om(g, 800, 230, 120, t); devText(g, 'ॐ तत्सत्', 800, 340, 40, C.cream); g.restore();
  diya(g, 220, 840, 1.1, t); diya(g, 1380, 840, 1.1, t);
  border(g, CH_COL[ci]);
};

export const close: Scene = (g, b) => {
  const t = b.T;
  night(g, t, 3, 120);
  rays(g, 800, 380, 900, t, 0.8);
  aureole(g, 800, 360, 1.1, t);
  deity(g, 800, 820, 1.1, t, { ...KRISHNA_ICON, garland: true });
  const ar = fig(ARJUNA, { x: 400, s: 1.2, t, pose: P.kneel, eye: 'up' }); onGround(ar, 840); draw(g, ar);
  petals(g, t, 3, 60);
  cartouche(g, '॥ इति श्रीमद्भगवद्गीता ॥', 800, 80, 34, { w: 520, alpha: clamp(b.t / 2) });
  border(g, C.vermilion);
};

/* ───────── the palace in Hastinapura ───────── */

export const palace: Scene = (g, b) => {
  const t = b.T, a = A(b), p = sum(b), n = vnum(b);
  hall(g, t, C.maroon);
  throne(g, 470, 820, 1.3);
  const dh = fig(DHRITARASHTRA, { x: 470, s: 1.25, t, pose: { ...P.sit, fa: [0.9, 1.3], ba: [0.3, 1.0] }, eye: 'closed', face: 1 }); onGround(dh, 760); draw(g, dh);
  const sj = fig(SANJAYA, { x: 1130, s: 1.25, t, face: -1, pose: a === 1 ? P.namaste : { ...P.stand, fa: [1.3, 1.2] }, eye: a === 1 && n >= 76 ? 'up' : 'open', mouth: 'sing' }); onGround(sj, 840); draw(g, sj);
  // Sanjaya's divine sight: a vision of the field, or at the end the cosmic form remembered
  const r = 210, cx = 800, cy = 330, k = out(clamp(b.run.t / 2));
  g.save(); g.globalAlpha = k;
  circle(g, cx, cy, r + 10, C.gold, C.ink, 3);
  g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.clip();
  g.save(); g.translate(cx, cy); g.scale(r / 420, r / 420); g.translate(-800, -470);
  if (a === 1 && n >= 77) { night(g, t, 9, 120); deity(g, 800, 900, 1.3, t, VISHVARUPA(12)); }
  else { battlefield(g, t, a === 1 ? 'dawn' : 'day', 0.4); chariotPair(g, 820, 820, 0.8, t, { arjuna: a === 1 ? 'lift' : 'stand', krishna: a === 1 ? 'teach' : 'drive' }); }
  g.restore(); g.restore();
  g.save(); g.globalAlpha = k * 0.7; for (let i = 0; i < 3; i++) line(g, [[1100 - i * 6, 560 - i * 12], [cx + r * 0.7, cy + r * 0.7]], 'rgba(255,230,150,0.5)', 2); g.restore();
  if (a === 0) cartouche(g, 'किमकुर्वत सञ्जय', 470, 470, 32, { alpha: clamp(p * 3), w: 320 });
  border(g, C.maroon);
};

/* ───────── the armies drawn up ───────── */

const HEROES: Record<number, string[]> = {
  4: ['युयुधानः', 'विराटः', 'द्रुपदः'], 5: ['धृष्टकेतुः', 'चेकितानः', 'काशिराजः', 'पुरुजित्', 'कुन्तिभोजः', 'शैब्यः'], 6: ['युधामन्युः', 'उत्तमौजाः', 'सौभद्रः', 'द्रौपदेयाः'],
  8: ['द्रोणः', 'भीष्मः', 'कर्णः', 'कृपः', 'अश्वत्थामा', 'विकर्णः', 'सौमदत्तिः'],
};

export const review: Scene = (g, b) => {
  const t = b.T, a = A(b), p = sum(b), n = vnum(b);
  battlefield(g, t, 'day', 0.6);
  if (a === 0) {
    // Duryodhana before his teacher Drona, pointing at the Pandava host
    const d = fig(DRONA, { x: 1150, s: 1.35, t, face: -1, pose: { ...P.stand, b: undefined } as Fig['pose'], b: { k: 'bow' } }); onGround(d, 860); draw(g, d);
    const du = fig(DURYODHANA, { x: 880, s: 1.35, t, face: 1, pose: { ...P.stand, fa: [1.6, 0.2] }, b: { k: 'mace' } }); onGround(du, 860); draw(g, du);
    g.save(); g.globalAlpha = clamp(p * 3); cartouche(g, 'पश्यैतां पाण्डुपुत्राणाम्', 360, 300, 32, { w: 400 }); g.restore();
  } else {
    // the heroes named, one after another, as banners over their host
    const list = HEROES[n] ?? (a === 1 ? HEROES[4] : HEROES[8]);
    const side = a === 1 ? 1 : -1;
    list.forEach((nm, i) => {
      const L = out(clamp(p * (list.length + 1) - i));
      const x = side > 0 ? 140 + i * (900 / list.length) : 1460 - i * (900 / list.length);
      g.save(); g.globalAlpha = 0.3 + 0.7 * L;
      const w = fig(i === 0 && a === 2 ? DRONA : i === 1 && a === 2 ? BHISHMA : i === 2 && a === 2 ? KARNA : WARRIOR(i, a === 1 ? 'p' : 'k'), { x, s: 0.95, t: t + i, face: side as 1 | -1, pose: P.mace, f: { k: i % 2 ? 'mace' : 'bow' } });
      onGround(w, 860); draw(g, w);
      cartouche(g, nm, x, 560 - (i % 2) * 50, 24, { w: 150 });
      g.restore();
    });
  }
  border(g, C.maroon);
};

/* ───────── the conches ───────── */

const CONCHES = [['पाञ्चजन्यम्', 'हृषीकेशः'], ['देवदत्तम्', 'धनञ्जयः'], ['पौण्ड्रम्', 'वृकोदरः'], ['अनन्तविजयम्', 'युधिष्ठिरः'], ['सुघोषम्', 'नकुलः'], ['मणिपुष्पकम्', 'सहदेवः']];

export const conch: Scene = (g, b) => {
  const t = b.T, a = A(b), p = sum(b);
  if (a === 3) shake(g, 4 * bump(p), t);
  battlefield(g, t, 'day', a === 3 ? 1.5 : 0.6);
  if (a === 0) {
    const bh = fig(BHISHMA, { x: 1200, s: 1.5, t, face: -1, pose: { ...P.stand, fa: [2.0, 1.6] }, f: { k: 'conch' }, mouth: 'roar' }); onGround(bh, 860); draw(g, bh);
    soundRings(g, 1120, 520, t, 'rgba(255,240,200,0.9)', 6, 420);
    g.save(); g.globalAlpha = clamp(p * 3); emblem(g, 'lion', 900, 260, 1.1, t); g.restore();
  } else if (a === 1) {
    chariotPair(g, 760, 860, 1.25, t, { arjuna: 'lift', krishna: 'drive' });
    soundRings(g, 900, 560, t, 'rgba(255,255,255,0.9)', 6, 520);
    bigConch(g, 380, 260, 1.1, -0.3); bigConch(g, 1250, 260, 1.1, 0.3, '#f6efe0');
    devText(g, 'पाञ्चजन्यम्', 380, 360, 28, C.maroon); devText(g, 'देवदत्तम्', 1250, 360, 28, C.maroon);
  } else if (a === 2) {
    CONCHES.slice(2).forEach(([c, who], i) => { const L = out(clamp(p * 4.5 - i)); const x = 260 + i * 360; g.save(); g.globalAlpha = L; bigConch(g, x, 300, 0.9 + 0.1 * L, (i - 1.5) * 0.15); soundRings(g, x + 40, 300, t + i, 'rgba(255,255,255,0.7)', 4, 180); devText(g, c, x, 400, 26, C.maroon); devText(g, who, x, 440, 22, C.ink); g.restore(); });
  } else {
    // the uproar tears the hearts of Dhritarashtra's sons
    for (let i = 0; i < 6; i++) soundRings(g, 800, 500, t + i * 0.3, 'rgba(255,240,200,0.8)', 3, 900);
    g.save(); g.globalAlpha = 0.25 * bump(p); g.fillStyle = '#fff'; g.fillRect(0, 0, PW, PH); g.restore();
  }
  border(g, C.maroon);
};

/* ───────── the chariot between the armies ───────── */

export const chariotScene: Scene = (g, b) => {
  const t = b.T, a = A(b), p = sum(b);
  battlefield(g, t, 'day', 0.5);
  if (a === 0) {
    g.save(); cam(g, [{ p: 0, x: 800, y: 500, z: 1.0 }, { p: 1, x: 760, y: 540, z: 1.2 }], b.run.p);
    chariotPair(g, 760, 870, 1.3, t, { arjuna: 'lift', krishna: 'drive', banner: 1 });
    g.restore();
  } else if (a === 1) {
    const x = lerp(-200, 820, io(clamp(b.run.t / Math.max(8, b.run.d * 0.6))));
    chariotPair(g, x, 860, 1.05, t, { arjuna: 'stand', krishna: 'drive', gallop: x < 800 ? 0.7 : 0 });
  } else {
    g.save(); cam(g, [{ p: 0, x: 900, y: 520, z: 1.05 }, { p: 1, x: 1100, y: 520, z: 1.35 }], b.run.p);
    chariotPair(g, 640, 870, 1.1, t, { arjuna: 'stand', krishna: 'turn' });
    // in the enemy ranks, the faces of his own: grandfather, teacher, cousins
    const kin: [Look, number][] = [[BHISHMA, 1150], [DRONA, 1290], [KARNA, 1420]];
    kin.forEach(([look, x], i) => { const L = out(clamp(p * 3 - i * 0.6)); g.save(); g.globalAlpha = 0.5 + 0.5 * L; glory(g, x, 560, 20, 70 * L, t, 16, [C.gold, C.cream]); const f = fig(look, { x, s: 1.0, t: t + i, face: -1, pose: P.stand }); onGround(f, 760); draw(g, f); g.restore(); });
    g.restore();
  }
  border(g, C.maroon);
};

/* ───────── Arjuna's despair ───────── */

export const despair: Scene = (g, b) => {
  const t = b.T, a = A(b), p = sum(b);
  const dim = a <= 2 ? 0.35 : 0.2;
  battlefield(g, t, a >= 3 ? 'dusk' : 'day', 0.3);
  g.save(); g.fillStyle = `rgba(20,16,40,${dim})`; g.fillRect(0, 0, PW, PH); g.restore();
  if (a === 0) {
    // limbs failing, Gandiva slipping
    g.save(); shake(g, 1.6, t * 0.6); chariotPair(g, 760, 870, 1.35, t, { arjuna: p > 0.6 ? 'namaste' : 'stand', krishna: 'turn' }); g.restore();
    if (p > 0.5) { g.save(); g.translate(560, 640 + io(clamp((p - 0.5) * 3)) * 160); g.rotate(0.3 + io(clamp((p - 0.5) * 3)) * 1.1); line(g, [[0, -130], [24, 0], [0, 130]], C.ink, 6, true); g.restore(); }
  } else if (a === 1) {
    chariotPair(g, 560, 870, 1.1, t, { arjuna: 'namaste', krishna: 'turn' });
    // what he would be killing: the faces of his family, fading in and out
    const fam: Look[] = [BHISHMA, DRONA, YUDHISHTHIRA, BHIMA, NAKULA, SAHADEVA];
    fam.forEach((look, i) => { const x = 1000 + (i % 3) * 190, y = 470 + Math.floor(i / 3) * 300; g.save(); g.globalAlpha = 0.25 + 0.4 * Math.sin(t * 0.7 + i) ** 2; const f = fig(look, { x, s: 0.8, t: t + i, face: -1, pose: P.namaste, eye: 'down' }); onGround(f, y); draw(g, f); g.restore(); });
  } else if (a === 2) {
    chariotPair(g, 760, 870, 1.35, t, { arjuna: 'sit', krishna: 'turn' });
    g.save(); g.translate(500, 860); g.rotate(-0.15); line(g, [[0, 0], [260, -20]], C.ink, 7, true); g.restore();
  } else if (a === 3 || a === 6) {
    chariotPair(g, 760, 870, 1.35, t, { arjuna: 'sit', krishna: 'teach', glow: a === 6 ? 0.8 : 0.3 });
    // tears
    if (a === 3) for (let i = 0; i < 6; i++) { const ph = (t * 0.8 + i / 6) % 1; circle(g, 560 + (i % 2) * 8, 470 + ph * 80, 3, C.sky); }
    if (a === 6) cartouche(g, 'न योत्स्ये', 560, 300, 40, { w: 260, alpha: clamp(1 - p * 1.5) });
  } else if (a === 4) {
    // Bhishma and Drona, worthy of worship, across the field
    const bh = fig(BHISHMA, { x: 1060, s: 1.3, t, face: -1, pose: P.bless }); onGround(bh, 840); draw(g, bh);
    const dr = fig(DRONA, { x: 1300, s: 1.3, t, face: -1, pose: P.bless }); onGround(dr, 840); draw(g, dr);
    glory(g, 1180, 470, 40, 200, t, 24, [C.gold, C.cream]);
    chariotPair(g, 420, 870, 1.0, t, { arjuna: 'namaste', krishna: 'turn' });
  } else {
    // the disciple: Arjuna kneels before Krishna
    const k = fig(KRISHNA, { x: 900, s: 1.6, t, face: -1, pose: P.bless, mouth: 'smile', glow: 0.8 }); onGround(k, 840); draw(g, k);
    const ar = fig(ARJUNA, { x: 620, s: 1.5, t, face: 1, pose: P.kneel, eye: 'up' }); onGround(ar, 840); draw(g, ar);
    cartouche(g, 'शिष्यस्तेऽहं शाधि मां त्वां प्रपन्नम्', 800, 230, 32, { w: 560, alpha: clamp(p * 2) });
  }
  border(g, C.maroon);
};

/* ───────── the field of action: your right is to the work alone ───────── */

export const karma: Scene = (g, b) => {
  const t = b.T, p = sum(b);
  battlefield(g, t, 'dawn', 0.3);
  // the archer draws and lets go; the fruit falls into the Lord's hands
  const draw0 = (t * 0.5) % 1;
  const ar = fig(ARJUNA, { x: 620, s: 1.5, t, face: -1, pose: draw0 < 0.6 ? { fa: [1.6, 0.0], ba: [1.5, 1.9], fl: [0.25, 0.05], bl: [-0.2, 0.05] } : P.stand, b: { k: 'bow', a: 1.5 } }); onGround(ar, 860); draw(g, ar);
  if (draw0 >= 0.6) { const u = (draw0 - 0.6) / 0.4; line(g, [[540 - u * 600, 520 - u * 60], [480 - u * 600, 518 - u * 60]], C.brown, 3); }
  const k = fig(KRISHNA, { x: 1180, s: 1.5, t, face: -1, pose: { fa: [1.4, 1.2], ba: [1.3, 1.3], fl: [0.06, 0.04], bl: [-0.07, 0.04] }, mouth: 'smile', glow: 0.6 }); onGround(k, 860); draw(g, k);
  for (let i = 0; i < 3; i++) { const ph = (t * 0.25 + i / 3) % 1; const x = lerp(620, 1120, ph), y = 480 - bump(ph) * 200; g.save(); g.globalAlpha = bump(ph); circle(g, x, y, 14, C.saffron, C.ink, 1.6); g.fillStyle = C.green; g.beginPath(); g.ellipse(x + 6, y - 14, 5, 9, 0.6, 0, 7); g.fill(); g.restore(); }
  cartouche(g, 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन', 800, 150, 34, { w: 640, alpha: clamp(p * 4) });
  border(g, C.peacock);
};

/* ───────── the cosmic form ───────── */

export const vishvarupa: Scene = (g, b) => {
  const t = b.T, a = A(b), p = sum(b);
  night(g, t, 41 + a, 220);
  if (a === 0) {
    // forms by hundreds and thousands
    const R = rng(4);
    for (let i = 0; i < 40; i++) { const L = out(clamp(p * 3 - R() * 1.5)); if (L <= 0) continue; const x = 80 + R() * 1440, y = 120 + R() * 520; g.save(); g.globalAlpha = L; deity(g, x, y + 80, 0.16, t + i, { ...VISHNU, skin: [C.blue, C.gold, C.rani, C.teal, C.fire][i % 5], base: 'none', garland: false }); g.restore(); }
    chariotPair(g, 800, 880, 0.75, t, { arjuna: 'namaste', krishna: 'teach', glow: 1 });
  } else if (a === 1) {
    // as if a thousand suns rose at once
    const k = io(clamp(b.run.t / 6));
    rays(g, 800, 360, 1300, t, 1.5 * k, 48);
    for (let i = 0; i < 12; i++) { const ang = (i / 12) * Math.PI * 2 + t * 0.05; sunDisc(g, 800 + Math.cos(ang) * 600 * k, 360 + Math.sin(ang) * 300 * k, 40, t + i, false); }
    deity(g, 800, 900, 1.5 * (0.6 + 0.4 * k), t, { ...VISHVARUPA(16), glow: 1 });
    chariotPair(g, 220, 900, 0.45, t, { arjuna: 'namaste', krishna: 'teach' });
    g.save(); g.globalAlpha = 0.35 * bump(clamp(b.run.t / 4)); g.fillStyle = '#fffbe8'; g.fillRect(0, 0, PW, PH); g.restore();
  } else if (a === 2) {
    // the gods and all beings within his body
    deity(g, 800, 920, 1.65, t, { ...VISHVARUPA(16), cosmos: 1, glow: 0.8 });
    const ks: EmblemKey[] = ['lotus', 'sun', 'moon', 'serpent', 'crown', 'fire', 'ocean', 'mountain', 'star', 'feather'];
    ks.forEach((k, i) => { const L = out(clamp(p * 6 - i * 0.5)); const ang = -Math.PI / 2 + (i / ks.length) * Math.PI * 2; g.save(); g.globalAlpha = L * 0.9; emblem(g, k, 800 + Math.cos(ang) * 620, 450 + Math.sin(ang) * 330, 0.62, t); g.restore(); });
    const ar = fig(ARJUNA, { x: 160, s: 0.9, t, pose: P.namaste, eye: 'up' }); onGround(ar, 880); draw(g, ar);
  } else {
    // the mouths of Time, and the warriors rushing into them like rivers into the sea
    const gr = g.createRadialGradient(800, 380, 40, 800, 380, 520); gr.addColorStop(0, '#ffde7a'); gr.addColorStop(0.4, '#ff7a1a'); gr.addColorStop(1, 'rgba(120,20,20,0)');
    g.fillStyle = gr; g.fillRect(0, 0, PW, PH);
    // the jaws
    g.save(); g.translate(800, 380);
    g.beginPath(); g.ellipse(0, 0, 260, 150 + Math.sin(t * 2) * 10, 0, 0, Math.PI * 2); g.fillStyle = '#2a0a12'; g.fill(); g.strokeStyle = C.ink; g.lineWidth = 4; g.stroke();
    for (let i = 0; i < 12; i++) { const x = -230 + i * 42; g.beginPath(); g.moveTo(x, -130); g.lineTo(x + 20, -60); g.lineTo(x + 40, -128); g.fillStyle = C.white; g.fill(); g.beginPath(); g.moveTo(x, 130); g.lineTo(x + 20, 64); g.lineTo(x + 40, 128); g.fill(); }
    g.restore();
    // eyes of fire above
    for (const sx of [-1, 1]) { circle(g, 800 + sx * 170, 170, 46, C.fire2, C.ink, 3); circle(g, 800 + sx * 170, 170, 18, C.vermilion); }
    // streams of tiny warriors
    for (let i = 0; i < 70; i++) {
      const sd = i % 2 ? 1 : -1, ph = (t * 0.18 + i / 70) % 1;
      const x = lerp(800 + sd * 820, 800 + sd * 120, io(ph)), y = lerp(820 - (i % 5) * 30, 400, io(ph));
      g.save(); g.globalAlpha = 1 - ph * 0.6; g.translate(x, y); g.scale(0.35 * (1 - ph * 0.5), 0.35 * (1 - ph * 0.5));
      const w = fig(WARRIOR(i, sd > 0 ? 'k' : 'p'), { x: 0, s: 1, t: t + i, face: (-sd) as 1 | -1, pose: P.stride }); w.y = 0; draw(g, w);
      g.restore();
    }
  }
  border(g, C.ink);
};

export const kala: Scene = (g, b) => {
  const t = b.T, p = sum(b), n = vnum(b);
  night(g, t, 51, 40);
  g.save(); g.fillStyle = 'rgba(80,0,10,0.45)'; g.fillRect(0, 0, PW, PH); g.restore();
  glory(g, 800, 380, 150, 460, t, 40, [C.fire, '#5a0a10']);
  deity(g, 800, 900, 1.55, t, { ...VISHVARUPA(16), skin: '#1d1a2e', cosmos: 1, glow: 0.4 });
  cartouche(g, n === 32 ? 'कालोऽस्मि लोकक्षयकृत्प्रवृद्धो' : n === 33 ? 'निमित्तमात्रं भव सव्यसाचिन्' : 'मया हतांस्त्वं जहि मा व्यथिष्ठाः', 800, 90, 34, { w: 620, alpha: clamp(p * 3) });
  // the warriors already gone: grey ghosts in the ranks
  for (let i = 0; i < 9; i++) { const x = 120 + i * 170; g.save(); g.globalAlpha = 0.35; g.filter = 'grayscale(100%)'; const w = fig(WARRIOR(i, i % 2 ? 'k' : 'p'), { x, s: 0.7, t: t + i, face: 1, pose: P.stand }); onGround(w, 880); draw(g, w); g.restore(); }
  border(g, C.ink);
};

export const praise: Scene = (g, b) => {
  const t = b.T, n = vnum(b);
  night(g, t, 61, 160);
  rays(g, 800, 380, 1100, t, 0.7);
  deity(g, 900, 900, 1.45, t, { ...VISHVARUPA(14), cosmos: 1, glow: 0.8 });
  const ar = fig(ARJUNA, { x: 300, s: 1.3, t, face: 1, pose: n >= 44 ? { ...P.kneel, lean: 0.9, head: 0.3 } : P.namaste, eye: 'up', mouth: 'sing' }); onGround(ar, 880); draw(g, ar);
  const words = n === 39 || n === 40 ? ['नमो नमस्ते', 'सहस्रकृत्वः', 'नमः', 'पुनश्च'] : ['त्वमक्षरं', 'परमं', 'वेदितव्यम्', 'अनन्त', 'देवेश'];
  for (let i = 0; i < 12; i++) { const ph = (t * 0.3 + i / 12) % 1; g.globalAlpha = Math.sin(ph * Math.PI); devText(g, words[i % words.length], 300 + Math.sin(i * 2.1) * 100 + ph * 300, 560 - ph * 380, 24, C.gold); }
  g.globalAlpha = 1;
  border(g, C.ink);
};

export const gentle: Scene = (g, b) => {
  const t = b.T, a = A(b), p = sum(b);
  if (a === 0) {
    night(g, t, 71, 120);
    const k = io(clamp(p * 1.2));
    g.save(); g.globalAlpha = 1 - k; deity(g, 800, 900, 1.45, t, VISHVARUPA(14)); g.restore();
    g.save(); g.globalAlpha = k; aureole(g, 800, 380, 1.0, t); deity(g, 800, 840, 1.15, t, VISHNU); g.restore();
    const ar = fig(ARJUNA, { x: 300, s: 1.2, t, pose: P.namaste, eye: 'up' }); onGround(ar, 860); draw(g, ar);
  } else {
    battlefield(g, t, 'day', 0.3);
    const k = io(clamp(b.run.t / 5));
    g.save(); g.globalAlpha = 1 - k; deity(g, 800, 860, 1.0, t, VISHNU); g.restore();
    g.save(); g.globalAlpha = k;
    const kr = fig(KRISHNA, { x: 860, s: 1.6, t, face: -1, pose: { fa: [1.2, 0.6], ba: [0.3, 0.4], fl: [0.06, 0.04], bl: [-0.07, 0.04] }, mouth: 'smile', glow: 0.5 }); onGround(kr, 860); draw(g, kr);
    g.restore();
    const ar = fig(ARJUNA, { x: 640, s: 1.55, t, face: 1, pose: P.namaste, mouth: 'smile' }); onGround(ar, 860); draw(g, ar);
  }
  border(g, C.peacock);
};

/* ───────── the end ───────── */

export const surrender: Scene = (g, b) => {
  const t = b.T, p = sum(b), n = vnum(b);
  night(g, t, 81, 80);
  rays(g, 800, 360, 1000, t, 0.4 + 0.6 * p);
  aureole(g, 980, 360, 1.05, t);
  deity(g, 980, 820, 1.1, t, { ...KRISHNA_ICON, hands: ['abhaya', 'varada'], garland: true });
  const ar = fig(ARJUNA, { x: 520, s: 1.4, t, face: 1, pose: n >= 65 ? { ...P.kneel, lean: 0.9, head: 0.3 } : P.namaste, eye: 'up' }); onGround(ar, 860); draw(g, ar);
  if (n === 65) cartouche(g, 'मन्मना भव मद्भक्तो', 800, 110, 36, { w: 460 });
  if (n === 66) cartouche(g, 'मामेकं शरणं व्रज', 800, 110, 40, { w: 440 });
  border(g, C.vermilion);
};

export const rise: Scene = (g, b) => {
  const t = b.T, p = sum(b), n = vnum(b);
  battlefield(g, t, 'dawn', 0.8);
  g.save(); cam(g, [{ p: 0, x: 800, y: 520, z: 1.2 }, { p: 1, x: 800, y: 470, z: 1.0 }], b.run.p);
  chariotPair(g, 800, 870, 1.35, t, { arjuna: n === 73 && p > 0.4 ? 'lift' : 'stand', krishna: n === 73 ? 'drive' : 'teach', glow: 0.8, banner: 1 });
  g.restore();
  if (n === 73) { rays(g, 620, 440, 900, t, clamp((p - 0.4) * 2)); cartouche(g, 'करिष्ये वचनं तव', 800, 110, 40, { w: 420, alpha: clamp((p - 0.5) * 3) }); }
  else cartouche(g, 'नष्टो मोहः', 800, 110, 40, { w: 300, alpha: clamp(p * 3) });
  border(g, C.vermilion);
};

export const yatra: Scene = (g, b) => {
  const t = b.T, p = sum(b);
  battlefield(g, t, 'dawn', 0.5);
  g.save(); cam(g, [{ p: 0, x: 700, y: 520, z: 1.15 }, { p: 1, x: 800, y: 460, z: 1.0 }], b.run.p);
  chariotPair(g, 700, 860, 1.3, t, { gallop: 0.7, arjuna: 'lift', krishna: 'drive', glow: 0.8, banner: 1 });
  g.restore();
  (['lotus', 'crown', 'pot', 'mountain'] as EmblemKey[]).forEach((k, i) => { const L = out(clamp(p * 4.2 - i)); g.save(); g.globalAlpha = L; emblem(g, k, 980 + i * 150, 150, 0.7, t); devText(g, ['श्रीः', 'विजयः', 'भूतिः', 'ध्रुवा नीतिः'][i], 980 + i * 150, 212, 22, C.maroon); g.restore(); });
  border(g, C.vermilion);
};

export { cloud, star4, ellipse, VISHNU };
