/**
 * The Gita's set pieces between the story and the teaching: the wheel of
 * sacrifice, desire as smoke over fire, the Lord's births age after age,
 * the yogi with the lamp in a windless place, all strung on him like pearls
 * on a thread, the days and nights of Brahma, the bright and dark paths, a
 * leaf, a flower, a fruit and water, the glories of chapter ten, the three
 * qualities, the tree with its roots above, the divine and the demonic, the
 * threefold faith, Om Tat Sat, and the Lord turning all beings from within.
 */
import { C, PW, PH, type G, circle, clamp, lerp, io, out, bump, devText, sunDisc, glory, cloud, star4, line, rng, flame, lotus, lotusLeaf, ocean, tree, ellipse, diya, mountain, petals, cam, fs } from '../chalisa/kit';
import { draw, onGround, P, BRAHMA, type Fig, type Look } from '../chalisa/figures';
import { deity, aureole, holdItem } from '../pichwai/frontal';
import { VISHNU, KRISHNA, KRISHNA_ICON, SHRINATHJI, ARJUNA, VYASA, VISHVARUPA, fig, avatar, AVATAR_DEV, horse, elephant, cow, peacock, om } from '../pichwai/cast';
import { emblem, type EmblemKey } from '../pichwai/emblems';
import { border, canopy, night, dawn, dusk, sky, field, cartouche, rays, devotee, chariotPair, pond, countryside, parijata, cows } from '../pichwai/paint';
import type { Beat, Scene } from '../pichwai/stage';

const ink = C.ink;
const sum = (b: Beat) => b.c.reduce((a, x) => a + x, 0) / Math.max(1, b.c.length);
const A = (b: Beat) => Number(b.arg ?? 0);
const vnum = (b: Beat) => Number(b.v?.id.split('.')[1] ?? 0);
const SEEKER: Look = { head: 'man', skin: '#c98856', hair: '#15101e', hairStyle: 'short', crown: 'none', dhoti: C.white, dhotiFg: C.saffron, border: C.saffron, scarf: C.saffron, janeu: true, tilak: 'ram' };
const SAGE_L: Look = { ...SEEKER, head: 'sage', beard: '#e9e2d4', hair: '#e9e2d4', hairStyle: 'bun' };
const WOMAN: Look = { head: 'woman', skin: '#e3a565', hair: '#15101e', hairStyle: 'braid', crown: 'veil', top: C.vermilion, skirt: C.rani, skirtFg: C.gold, veil: C.gold, tilak: 'dot' };
const put = (g: G, look: Look, x: number, y: number, s: number, t: number, o: Partial<Fig> = {}) => { const f = fig(look, { x, s, t, pose: P.stand, ...o }); onGround(f, y); draw(g, f); };
const inner = (g: G, x: number, y: number, r: number, t: number, a = 1) => { const gr = g.createRadialGradient(x, y, 1, x, y, r); gr.addColorStop(0, `rgba(255,250,220,${a})`); gr.addColorStop(1, 'rgba(255,214,110,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r); g.fillStyle = `rgba(255,255,255,${a})`; star4(g, x, y, r * 0.22 * (1 + 0.1 * Math.sin(t * 3))); };
const medal = (g: G, k: EmblemKey, label: string, x: number, y: number, s: number, t: number, a = 1) => { g.save(); g.globalAlpha *= a; emblem(g, k, x, y, s, t); devText(g, label, x, y + 66 * s + 12, 22, C.maroon); g.restore(); };

/* ───────── sacrifice ───────── */

function altar(g: G, x: number, y: number, s: number, t: number) {
  g.save(); g.translate(x, y); g.scale(s, s);
  for (let i = 0; i < 3; i++) { g.beginPath(); g.rect(-110 + i * 20, -i * 26, 220 - i * 40, 26); fs(g, i % 2 ? '#c96a3a' : '#b0552a', ink, 2); }
  flame(g, 0, -78, 1.2, t, 1); flame(g, -30, -76, 0.7, t, 2); flame(g, 30, -76, 0.7, t, 3);
  g.restore();
}

export const yajna: Scene = (g, b) => {
  const t = b.T, a = A(b), p = sum(b);
  dawn(g); countryside(g, 560, t);
  altar(g, 800, 820, 1.4, t);
  put(g, SAGE_L, 560, 860, 1.25, t, { pose: { legs: 'lotus', fa: [1.4, 0.6], ba: [0.6, 1.2] }, f: { k: 'kalash' } });
  put(g, { ...SAGE_L, skin: '#d8a070' }, 1040, 860, 1.25, t, { face: -1, pose: { legs: 'lotus', fa: [1.4, 0.6], ba: [0.6, 1.2] }, f: { k: 'lotus' } });
  if (a === 0) {
    // food → beings → rain → sacrifice → action → Brahman, turning
    const ring: [EmblemKey, string][] = [['pot', 'अन्नम्'], ['heart', 'भूतानि'], ['rain', 'पर्जन्यः'], ['fire', 'यज्ञः'], ['hands', 'कर्म'], ['om', 'ब्रह्म']];
    ring.forEach(([k, l], i) => { const ang = -Math.PI / 2 + (i / ring.length) * Math.PI * 2 + t * 0.12; medal(g, k, l, 800 + Math.cos(ang) * 300, 330 + Math.sin(ang) * 210, 0.55, t, 0.4 + 0.6 * out(clamp(p * 7 - i))); });
  } else {
    rays(g, 800, 650, 1100, t, 0.5 + 0.5 * p);
    cartouche(g, 'ब्रह्मार्पणं ब्रह्म हविः', 800, 200, 40, { w: 520 });
  }
  border(g, C.vermilion);
};

/** Desire covering knowledge: fire by smoke, a mirror by dust, a child by the womb. */
export const desire: Scene = (g, b) => {
  const t = b.T, p = sum(b);
  dusk(g); field(g, 640, t);
  const xs = [330, 800, 1270];
  xs.forEach((x, i) => {
    g.save(); circle(g, x, 400, 180, '#fbf3df', C.gold, 6); g.beginPath(); g.arc(x, 400, 176, 0, Math.PI * 2); g.clip();
    if (i === 0) { flame(g, x, 500, 1.3, t, 1); for (let k = 0; k < 14; k++) { const ph = (t * 0.25 + k / 14) % 1; g.globalAlpha = 0.7 * (1 - ph); circle(g, x + Math.sin(k * 2 + t) * 50, 420 - ph * 200, 40 + ph * 40, '#6a6a7a'); } g.globalAlpha = 1; }
    else if (i === 1) { ellipse(g, x, 400, 90, 120, 0, '#d8e4ec', ink, 4); g.globalAlpha = 0.85; for (let k = 0; k < 60; k++) circle(g, x + Math.sin(k * 7.1) * 80, 400 + Math.cos(k * 3.3) * 110, 6, '#9a8a6a'); g.globalAlpha = 1; }
    else { ellipse(g, x, 410, 110, 130, 0, '#d98a8a', ink, 3); g.save(); g.globalAlpha = 0.9; circle(g, x, 400, 50, '#f2c0a0', ink, 2); g.restore(); }
    g.restore();
    devText(g, ['धूमेनाव्रियते वह्निः', 'आदर्शो मलेन', 'उल्बेनावृतो गर्भः'][i], x, 620, 26, C.cream);
  });
  // the enemy: desire as a dark, many-mouthed shadow behind
  g.save(); g.globalAlpha = 0.4 + 0.2 * Math.sin(t); g.fillStyle = '#1a0a1a'; g.beginPath(); g.ellipse(800, 110, 600 * (0.6 + 0.4 * p), 60, 0, 0, Math.PI * 2); g.fill(); g.restore();
  border(g, C.maroon);
};

/** The ancient teaching passed from the sun to Manu to Ikshvaku. */
export const lineage: Scene = (g, b) => {
  const t = b.T, p = sum(b);
  dawn(g);
  sunDisc(g, 260, 280, 130, t, true); rays(g, 260, 280, 700, t, 0.6);
  const chain: [Look, string][] = [[{ ...SAGE_L, crown: 'mukut', dhoti: C.gold } as Look, 'मनुः'], [{ ...ARJUNA, crown: 'mukut' } as Look, 'इक्ष्वाकुः'], [{ ...ARJUNA, dhoti: C.teal } as Look, 'राजर्षयः']];
  chain.forEach(([l, nm], i) => { const L = out(clamp(p * 4 - i)); const x = 620 + i * 300; g.save(); g.globalAlpha = 0.3 + 0.7 * L; line(g, [[x - 240, 520], [x - 60, 520]], C.gold, 4); put(g, l, x, 820, 1.15, t + i, { pose: P.namaste }); devText(g, nm, x, 860, 26, C.maroon); g.restore(); });
  devText(g, 'विवस्वान्', 260, 450, 30, C.maroon);
  border(g, C.saffron);
};

/** Age after age: the avatars round the Lord. */
export const avatarScene: Scene = (g, b) => {
  const t = b.T, p = sum(b), n = vnum(b);
  night(g, t, 91, 90);
  glory(g, 800, 420, 90, 300, t, 32, [C.gold, C.cream]);
  deity(g, 800, 700, 0.75, t, VISHNU);
  for (let i = 0; i < 10; i++) {
    const ang = -Math.PI / 2 + (i / 10) * Math.PI * 2 + t * 0.03, x = 800 + Math.cos(ang) * 600, y = 400 + Math.sin(ang) * 300;
    const L = n >= 7 ? 1 : out(clamp(p * 11 - i));
    g.save(); g.globalAlpha = 0.25 + 0.75 * L; avatar(g, i, x, y + 90, 0.55, t); devText(g, AVATAR_DEV[i], x, y + 116, 22, C.gold); g.restore();
  }
  if (n === 7) cartouche(g, 'यदा यदा हि धर्मस्य', 800, 830, 34, { w: 440 });
  if (n === 8) cartouche(g, 'सम्भवामि युगे युगे', 800, 830, 34, { w: 420 });
  border(g, C.vermilion);
};

/** Learn it by bowing down, asking and serving. */
export const guru: Scene = (g, b) => {
  const t = b.T;
  dawn(g); countryside(g, 560, t);
  tree(g, 980, 840, 1.6, 'peepal', t, 4);
  put(g, SAGE_L, 980, 820, 1.3, t, { face: -1, pose: { legs: 'lotus', fa: [1.1, 1.4], ba: [0.3, 1.0] }, b: { k: 'book' }, mouth: 'sing' });
  put(g, ARJUNA, 660, 840, 1.25, t, { face: 1, pose: P.kneel, eye: 'up' });
  glory(g, 980, 560, 30, 120, t, 18, [C.gold, C.cream]);
  border(g, C.saffron);
};

/** Like a lotus leaf that water does not wet. */
export const lotusleaf: Scene = (g, b) => {
  const t = b.T;
  dawn(g); pond(g, 380, t, 8);
  g.save(); g.translate(800, 620); g.scale(5, 2.6); lotusLeaf(g, 0, 0, 1, C.green); g.restore();
  for (let i = 0; i < 8; i++) { const ph = (t * 0.35 + i / 8) % 1; const x = 640 + i * 46, y = ph < 0.5 ? lerp(100, 560, ph * 2) : 560 + (ph - 0.5) * 2 * 40; const xr = ph < 0.5 ? x : x + (ph - 0.5) * 2 * 220 * (i % 2 ? 1 : -1); circle(g, xr, y, 9, 'rgba(210,235,255,0.9)', '#5a7aa8', 1.4); }
  lotus(g, 960, 560, 2.2, 1);
  put(g, SEEKER, 520, 560, 1.1, t, { pose: P.sitNamaste, eye: 'closed' });
  border(g, C.green);
};

/** The wise see the same in a brahmin, a cow, an elephant, a dog and an outcaste. */
export const sameness: Scene = (g, b) => {
  const t = b.T, p = sum(b);
  sky(g, '#9fd2ef', '#f6ead0', '#f3d6a8'); field(g, 620, t);
  const xs = [220, 520, 830, 1120, 1380];
  put(g, SAGE_L, xs[0], 840, 1.15, t, { pose: P.namaste, b: { k: 'book' } });
  cow(g, xs[1], 840, 1.1, t, {});
  elephant(g, xs[2], 840, 0.7, t, { howdah: false });
  g.save(); g.translate(xs[3], 840); g.scale(1.6, 1.6); g.beginPath(); g.ellipse(0, -30, 34, 14, 0, 0, Math.PI * 2); fs(g, '#b0884a', ink, 1.6); circle(g, 32, -44, 11, '#b0884a', ink, 1.4); line(g, [[38, -54], [44, -64]], ink, 3); for (const lx of [-24, -12, 14, 24]) line(g, [[lx, -20], [lx, 0]], ink, 3); line(g, [[-32, -34], [-46, -50]], ink, 3); g.restore();
  put(g, { ...SEEKER, dhoti: '#8a7a6a', scarf: '#6a5a4a', janeu: false }, xs[4], 840, 1.1, t, { face: -1, pose: P.stand });
  xs.forEach((x, i) => { const L = out(clamp(p * 6 - i * 0.8)); g.save(); g.globalAlpha = L; inner(g, x, 650, 50, t); g.restore(); });
  border(g, C.green);
};

/* ───────── the yogi ───────── */

export const yogi: Scene = (g, b) => {
  const t = b.T, a = A(b), p = sum(b);
  if (a === 1) night(g, t, 12, 60); else dawn(g);
  if (a === 1) mountain(g, 1250, 700, 700, 260, '#3a4a7a', '#2a3460', 5); else countryside(g, 600, t);
  if (a !== 1) tree(g, 1250, 760, 1.4, 'peepal', t, 3);
  // the seat: kusha grass, deerskin, cloth
  ellipse(g, 760, 830, 200, 30, 0, '#c9a24a', ink, 2); ellipse(g, 760, 818, 170, 24, 0, '#a8744a', ink, 2); ellipse(g, 760, 808, 140, 18, 0, C.white, ink, 2);
  const look = a === 3 ? { ...SEEKER, dhoti: C.gold, scarf: C.vermilion } : SAGE_L;
  put(g, look, 760, 810, 1.4, t, { pose: { legs: 'lotus', fa: [0.5, 1.0], ba: [0.3, 1.0] }, eye: 'closed', glow: a === 3 ? 0.8 : undefined });
  if (a === 1) {
    // the lamp in a windless place: the flame does not waver
    diya(g, 1060, 820, 2.4, 0); cartouche(g, 'यथा दीपो निवातस्थो', 800, 160, 36, { w: 440 });
  } else if (a === 2) {
    // thoughts wander off like butterflies and are drawn back
    for (let i = 0; i < 6; i++) { const ph = (t * 0.25 + i / 6) % 1, out0 = bump(ph); const x = 760 + Math.cos(i * 1.7 + t * 0.3) * 420 * out0, y = 560 + Math.sin(i * 2.3) * 240 * out0; g.fillStyle = [C.rani, C.gold, C.sky][i % 3]; g.beginPath(); g.ellipse(x - 6, y, 8, 12, 0.6, 0, 7); g.ellipse(x + 6, y, 8, 12, -0.6, 0, 7); g.fill(); }
  } else if (a === 3) {
    glory(g, 760, 600, 40, 180, t, 20, [C.gold, C.cream]);
    aureole(g, 1220, 300, 0.45, t); deity(g, 1220, 480, 0.45, t, KRISHNA_ICON);
  } else {
    inner(g, 760, 600, 60 + 40 * p, t, 0.8);
  }
  border(g, C.peacock);
};

/* ───────── nature and the Lord ───────── */

/** Earth, water, fire, air, space, mind, understanding, the sense of “I”: the eightfold nature. */
export const elements: Scene = (g, b) => {
  const t = b.T, p = sum(b);
  night(g, t, 22, 100);
  aureole(g, 800, 380, 0.9, t); deity(g, 800, 760, 0.95, t, { ...KRISHNA_ICON, garland: true });
  const ring: [EmblemKey, string][] = [['earth', 'भूमिः'], ['ocean', 'आपः'], ['fire', 'अनलः'], ['wind', 'वायुः'], ['cosmos', 'खम्'], ['heart', 'मनः'], ['lamp', 'बुद्धिः'], ['crown', 'अहङ्कारः']];
  ring.forEach(([k, l], i) => { const ang = -Math.PI / 2 + (i / 8) * Math.PI * 2 + t * 0.05; medal(g, k, l, 800 + Math.cos(ang) * 560, 440 + Math.sin(ang) * 300, 0.55, t, 0.3 + 0.7 * out(clamp(p * 9 - i))); });
  border(g, C.indigo);
};

/** All strung on me like pearls on a thread (0); the light in sun, moon and fire, the strength in the earth (1). */
export const pearls: Scene = (g, b) => {
  const t = b.T, a = A(b), p = sum(b);
  night(g, t, 33, 90);
  deity(g, 800, 860, 1.0, t, { ...KRISHNA_ICON, garland: true });
  const items: [EmblemKey, string][] = a === 0
    ? [['ocean', 'रसः'], ['moon', 'प्रभा'], ['sun', 'प्रभा'], ['om', 'प्रणवः'], ['cosmos', 'शब्दः'], ['earth', 'गन्धः'], ['fire', 'तेजः'], ['heart', 'जीवनम्'], ['mala', 'तपः'], ['lotus', 'बीजम्']]
    : [['sun', 'सूर्यः'], ['moon', 'चन्द्रमाः'], ['fire', 'अग्निः'], ['earth', 'गाम्'], ['tree', 'ओषधीः'], ['fire', 'वैश्वानरः'], ['heart', 'हृदि']];
  // the thread, sagging across the sky
  const pt = (u: number) => [lerp(120, 1480, u), 260 + Math.sin(u * Math.PI) * 140];
  g.strokeStyle = C.gold; g.lineWidth = 3; g.beginPath(); for (let u = 0; u <= 1.001; u += 0.02) { const [x, y] = pt(u); g.lineTo(x, y); } g.stroke();
  items.forEach(([k, l], i) => { const [x, y] = pt((i + 0.5) / items.length); const L = out(clamp(p * (items.length + 1) - i)); g.save(); g.globalAlpha = 0.25 + 0.75 * L; circle(g, x, y, 46, '#fbf5e2', 'rgba(150,130,100,0.8)', 2); emblem(g, k, x, y, 0.55, t, false); devText(g, l, x, y + 70, 22, C.gold); g.restore(); });
  border(g, C.indigo);
};

/** The veil of the three qualities (0); the Lord veiled by his own power (1). */
export const maya: Scene = (g, b) => {
  const t = b.T, a = A(b), p = sum(b);
  night(g, t, 44, 60);
  aureole(g, 800, 380, 1.0, t); deity(g, 800, 830, 1.1, t, KRISHNA_ICON);
  const cols = ['rgba(248,244,230,0.22)', 'rgba(214,58,40,0.2)', 'rgba(30,24,50,0.35)'];
  cols.forEach((c, i) => { const sw = Math.sin(t * 0.8 + i) * 20; g.fillStyle = c; g.beginPath(); g.moveTo(420 + i * 30 + sw, 120); g.bezierCurveTo(500 + sw, 400, 380 - sw, 600, 440 + i * 20, 880); g.lineTo(1160 - i * 20, 880); g.bezierCurveTo(1220 + sw, 600, 1100 - sw, 400, 1180 - i * 30 - sw, 120); g.closePath(); g.fill(); });
  if (a === 0) { const x = lerp(140, 760, io(clamp(p * 1.3))); devotee(g, x, 870, 0.9, t, { act: 'stand', glow: p > 0.7 ? 0.8 : undefined }); for (let i = 0; i < 3; i++) devotee(g, 1300 + i * 100, 870, 0.8, t + i, { act: 'stand', face: -1 }); }
  border(g, C.indigo);
};

/** Four who worship me (0); the four kinds of work (1). */
export const four: Scene = (g, b) => {
  const t = b.T, a = A(b), p = sum(b);
  if (a === 0) { night(g, t, 55, 60); aureole(g, 800, 330, 0.85, t); deity(g, 800, 700, 0.85, t, KRISHNA_ICON); }
  else { dawn(g); countryside(g, 560, t); }
  const who: [Look, string, Partial<Fig>][] = a === 0
    ? [[{ ...SEEKER, dhoti: '#9a9aa8' }, 'आर्तः', { pose: { ...P.kneel, lean: 0.4 } }], [SAGE_L, 'जिज्ञासुः', { pose: P.namaste, b: { k: 'book' } }], [{ ...SEEKER, crown: 'turban', turban: C.saffron, dhoti: C.green, belly: 1.3 }, 'अर्थार्थी', { pose: P.namaste, f: { k: 'pot' } }], [{ ...SAGE_L, hair: '#2a1d1a' }, 'ज्ञानी', { pose: P.sitNamaste, glow: 0.8, eye: 'closed' }]]
    : [[SAGE_L, 'ब्राह्मणः', { pose: { legs: 'lotus', fa: [1.0, 1.6] }, b: { k: 'book' } }], [ARJUNA, 'क्षत्रियः', { pose: P.mace, f: { k: 'sword' }, b: { k: 'shield' } }], [{ ...SEEKER, crown: 'turban', turban: C.saffron, dhoti: C.green }, 'वैश्यः', { pose: P.stride, f: { k: 'plough', a: 0.3 } }], [{ ...SEEKER, dhoti: '#d9b47a' }, 'शूद्रः', { pose: P.bless, f: { k: 'pot' } }]];
  const xs = a === 0 ? [180, 470, 1130, 1420] : [230, 600, 980, 1360];
  who.forEach(([l, nm, o], i) => { const L = out(clamp(p * 5 - i)); g.save(); g.globalAlpha = 0.4 + 0.6 * L; put(g, l, xs[i], 860, 1.05, t + i, { face: (xs[i] < 800 ? 1 : -1) as 1 | -1, ...o }); devText(g, nm, xs[i], 500, 28, a === 0 ? C.gold : C.maroon); g.restore(); });
  if (a === 1) cows(g, 820, 1140, 860, 0.5, t, 2, 3);
  border(g, a === 0 ? C.indigo : C.saffron);
};

/** Remembering me at the end (0); Om, the breath in the head, going forth (1). */
export const death: Scene = (g, b) => {
  const t = b.T, a = A(b), p = sum(b);
  dusk(g);
  if (a === 0) {
    g.beginPath(); g.rect(480, 700, 640, 50); fs(g, C.brown, ink, 2); g.beginPath(); g.rect(470, 680, 660, 26); fs(g, C.white, ink, 2);
    g.save(); g.translate(800, 690); g.rotate(-Math.PI / 2); put(g, SAGE_L, 0, 0, 1.1, t, { pose: { fa: [0.4, 1.4], ba: [0.3, 1.4], fl: [0.02, 0], bl: [-0.02, 0] }, eye: 'closed' }); g.restore();
    diya(g, 420, 760, 1.2, t);
    g.save(); g.globalAlpha = p; aureole(g, 800, 260, 0.6, t); deity(g, 800, 420, 0.5, t, KRISHNA_ICON); g.restore();
    const ph = (t * 0.2) % 1; g.save(); g.globalAlpha = bump(ph) * p; inner(g, 640, 640 - ph * 300, 30, t); g.restore();
  } else {
    put(g, SAGE_L, 800, 860, 1.6, t, { pose: { legs: 'lotus', fa: [0.5, 1.0], ba: [0.3, 1.0] }, eye: 'closed' });
    const k = io(clamp(p * 1.3)); g.save(); g.globalAlpha = k; inner(g, 800, lerp(500, 120, k), 70, t); om(g, 800, lerp(500, 120, k), 80, t); g.restore();
    sunDisc(g, 800, 90, 60, t, false);
  }
  border(g, C.maroon);
};

/** A day of Brahma and a night: worlds appear and dissolve (0); I send them forth again and again (1). */
export const brahmaday: Scene = (g, b) => {
  const t = b.T, a = A(b);
  const ph = (b.run.t / 14) % 1, day = ph < 0.5;
  night(g, t, 66, 140);
  const k = day ? bump(ph * 2) : 0;
  g.save(); g.globalAlpha = k; dawn(g); sunDisc(g, 1300, 200, 70, t, true); g.restore();
  if (!day) { circle(g, 1300, 200, 60, '#fbf5e2'); }
  // worlds: a lotus that opens and closes
  lotus(g, 800, 760, 4.2, 0.2 + 0.8 * k, C.pink, C.rani);
  const br: Fig = { ...(BRAHMA as Fig), x: 800, y: 0, s: 1.2, t, pose: P.sitNamaste, eye: day ? 'open' : 'closed' }; onGround(br, 720);
  if (a === 0) draw(g, br); else { aureole(g, 800, 360, 0.8, t); deity(g, 800, 700, 0.8, t, VISHNU); }
  const R = rng(5); for (let i = 0; i < 40; i++) { const ang = R() * 6.28, d = (0.2 + R() * 0.8) * k * 600; g.globalAlpha = k; g.fillStyle = [C.gold, C.pink, C.sky, C.lime][i % 4]; star4(g, 800 + Math.cos(ang) * d, 500 + Math.sin(ang) * d * 0.5, 5); }
  g.globalAlpha = 1;
  devText(g, day ? 'अहः' : 'रात्रिः', 200, 120, 40, C.gold);
  border(g, C.indigo);
};

/** The bright path and the dark path. */
export const paths: Scene = (g, b) => {
  const t = b.T, p = sum(b);
  g.save(); g.beginPath(); g.rect(0, 0, 800, PH); g.clip(); dawn(g); sunDisc(g, 380, 160, 90, t, true); g.restore();
  g.save(); g.beginPath(); g.rect(800, 0, 800, PH); g.clip(); night(g, t, 77, 80); circle(g, 1220, 160, 70, '#fbf5e2'); g.restore();
  line(g, [[800, 0], [800, PH]], C.gold, 6);
  field(g, 760, t);
  // two travellers: one rises into the sun, one rises to the moon and comes back down
  const u = (b.run.t * 0.08) % 1;
  g.save(); g.globalAlpha = 1 - u * 0.5; inner(g, lerp(500, 380, u), lerp(700, 180, u), 40, t); g.restore();
  const v = u < 0.6 ? u / 0.6 : 1 - (u - 0.6) / 0.4;
  inner(g, lerp(1100, 1220, v), lerp(700, 200, v), 34, t, 0.7);
  ['अग्निः', 'ज्योतिः', 'अहः', 'शुक्लः', 'उत्तरायणम्'].forEach((w, i) => devText(g, w, 140, 300 + i * 70, 26, C.maroon));
  ['धूमः', 'रात्रिः', 'कृष्णः', 'दक्षिणायनम्'].forEach((w, i) => devText(g, w, 1470, 300 + i * 70, 26, C.lav));
  void p; border(g, C.ink);
};

/** As the great wind moves always within space, so all beings rest in me. */
export const pervade: Scene = (g, b) => {
  const t = b.T;
  night(g, t, 88, 200);
  g.save(); g.globalAlpha = 0.5; deity(g, 800, 900, 1.5, t, { ...VISHVARUPA(8), cosmos: 1 }); g.restore();
  for (let i = 0; i < 7; i++) { g.strokeStyle = ['rgba(150,200,240,0.6)', 'rgba(255,255,255,0.5)'][i % 2]; g.lineWidth = 5; g.beginPath(); for (let x = 100; x <= 1500; x += 12) g.lineTo(x, 200 + i * 90 + Math.sin(x * 0.01 + t * 1.5 + i) * 30); g.stroke(); }
  border(g, C.indigo);
};

/** Devotees singing (0); everyone, of whatever birth, reaching him (1); speaking of him, lit by the lamp of knowledge (2). */
export const kirtan: Scene = (g, b) => {
  const t = b.T, a = A(b);
  night(g, t, 99, 60); canopy(g, t, C.maroon);
  aureole(g, 800, 330, 0.85, t); deity(g, 800, 700, 0.85, t, SHRINATHJI);
  const ppl: Look[] = a === 1 ? [WOMAN, { ...SEEKER, crown: 'turban', turban: C.saffron, dhoti: C.green }, { ...SEEKER, dhoti: '#d9b47a' }, { ...WOMAN, top: C.teal, skirt: C.gold }, SAGE_L, { ...SEEKER, dhoti: '#8a7a6a' }] : [SAGE_L, SEEKER, WOMAN, { ...SEEKER, dhoti: C.gold }, { ...WOMAN, top: C.green }, SAGE_L];
  ppl.forEach((l, i) => { const x = i < 3 ? 160 + i * 150 : 1140 + (i - 3) * 150; put(g, l, x, 870, 0.95, t + i, { face: (x < 800 ? 1 : -1) as 1 | -1, pose: i % 2 ? { fa: [1.5, 1.4 + Math.sin(t * 4 + i) * 0.2], ba: [1.3, 1.4], fl: [0.06, 0.04], bl: [-0.07, 0.04] } : P.namaste, f: i % 2 ? { k: 'cymbal' } : undefined, mouth: 'sing', eye: 'up' }); });
  if (a === 2) diya(g, 800, 820, 2.0, t);
  for (let i = 0; i < 12; i++) { const ph = (t * 0.4 + i / 12) % 1; g.globalAlpha = Math.sin(ph * Math.PI); g.fillStyle = C.gold; star4(g, (i < 6 ? 300 : 1300) + Math.sin(i * 2 + ph * 6) * 80, 640 - ph * 400, 6); }
  g.globalAlpha = 1;
  border(g, C.maroon);
};

/** I am the rite, the sacrifice, the father, the mother, the goal, the friend. */
const IAM: Record<number, [EmblemKey, string][]> = {
  16: [['thread', 'क्रतुः'], ['fire', 'यज्ञः'], ['tree', 'औषधम्'], ['om', 'मन्त्रः'], ['pot', 'आज्यम्'], ['fire', 'हुतम्']],
  17: [['crown', 'पिता'], ['lotus', 'माता'], ['earth', 'धाता'], ['mala', 'पितामहः'], ['om', 'ओंकारः'], ['book', 'ऋक्साम यजुः']],
  18: [['star', 'गतिः'], ['hands', 'भर्ता'], ['crown', 'प्रभुः'], ['eye', 'साक्षी'], ['heart', 'सुहृत्'], ['lotus', 'बीजम्']],
  19: [['sun', 'तपामि'], ['rain', 'वर्षम्'], ['pot', 'अमृतम्'], ['wheel', 'मृत्युः'], ['om', 'सत्'], ['cosmos', 'असत्']],
};
export const iam: Scene = (g, b) => {
  const t = b.T, p = sum(b), n = vnum(b);
  night(g, t, 101, 80);
  aureole(g, 800, 380, 1.0, t); deity(g, 800, 830, 1.05, t, { ...KRISHNA_ICON, garland: true });
  (IAM[n] ?? IAM[16]).forEach(([k, l], i) => { const ang = -Math.PI / 2 + ((i + 0.5) / 6 - 0.5) * Math.PI * 1.6 - Math.PI / 2 + Math.PI / 2; const x = 800 + Math.cos(ang - Math.PI / 2) * 0 + (i < 3 ? -1 : 1) * (330 + (i % 3) * 120), y = 250 + (i % 3) * 210; void ang; medal(g, k, l, x, y, 0.6, t, 0.3 + 0.7 * out(clamp(p * 7 - i))); });
  border(g, C.indigo);
};

/** A leaf, a flower, a fruit, a little water (0); fix your mind on me (1). */
export const offer: Scene = (g, b) => {
  const t = b.T, a = A(b), p = sum(b);
  night(g, t, 111, 60); canopy(g, t, C.maroon);
  aureole(g, 1000, 330, 0.85, t); deity(g, 1000, 720, 0.9, t, SHRINATHJI);
  put(g, WOMAN, 520, 860, 1.35, t, { pose: a === 1 ? { ...P.kneel, lean: 0.8, head: 0.3 } : { legs: 'lotus', fa: [1.5, 0.3], ba: [1.3, 0.4] }, eye: 'up' });
  if (a === 0) {
    const gifts = [
      (x: number, y: number) => { g.save(); g.translate(x, y); g.beginPath(); g.ellipse(0, 0, 26, 12, 0.4, 0, Math.PI * 2); fs(g, C.green, ink, 1.6); line(g, [[-22, 8], [22, -8]], '#2a5a2a', 1.4); g.restore(); },
      (x: number, y: number) => lotus(g, x, y + 10, 0.7, 1),
      (x: number, y: number) => { circle(g, x, y, 16, C.saffron, ink, 1.6); g.fillStyle = C.green; g.beginPath(); g.ellipse(x + 6, y - 16, 5, 9, 0.6, 0, 7); g.fill(); },
      (x: number, y: number) => { g.beginPath(); g.ellipse(x, y, 22, 12, 0, 0, Math.PI); fs(g, C.gold, ink, 1.6); g.beginPath(); g.ellipse(x, y, 22, 6, 0, 0, Math.PI * 2); fs(g, C.sky, ink, 1.2); },
    ];
    const labels = ['पत्रम्', 'पुष्पम्', 'फलम्', 'तोयम्'];
    gifts.forEach((dr, i) => { const ph = clamp(p * 1.8 - i * 0.25); const x = lerp(640, 920, io(ph)), y = lerp(640, 690, ph) - bump(ph) * 120; dr(x, y); g.save(); g.globalAlpha = clamp(p * 5 - i); devText(g, labels[i], 360 + i * 140, 200, 30, C.gold); g.restore(); });
  } else cartouche(g, 'मन्मना भव मद्भक्तो मद्याजी मां नमस्कुरु', 800, 160, 32, { w: 640 });
  border(g, C.vermilion);
};

/** Narada, Asita, Devala and Vyasa have said it; Arjuna asks to hear more. */
export const sages: Scene = (g, b) => {
  const t = b.T;
  night(g, t, 121, 80);
  aureole(g, 800, 340, 0.85, t); deity(g, 800, 720, 0.9, t, VISHNU);
  const s: [Look, string, number][] = [[{ ...SAGE_L, hair: '#2a1d1a', dhoti: C.white } as Look, 'नारदः', 220], [SAGE_L, 'असितः', 420], [{ ...SAGE_L, skin: '#d8a070' }, 'देवलः', 1180], [VYASA, 'व्यासः', 1380]];
  s.forEach(([l, nm, x], i) => { put(g, l, x, 860, 1.05, t + i, { face: (x < 800 ? 1 : -1) as 1 | -1, pose: P.namaste, mouth: 'sing', eye: 'up', f: i === 0 ? { k: 'veena', a: 0.5 } : undefined }); devText(g, nm, x, 520, 28, C.gold); });
  put(g, ARJUNA, 800, 880, 0.9, t, { pose: P.namaste });
  border(g, C.indigo);
};

/* ───────── the glories ───────── */

type Vib = EmblemKey | 'horse' | 'elephant' | 'vajra' | 'dice' | 'trident' | 'letter' | 'peacock';
const VIB: Record<number, [Vib, string][]> = {
  19: [['star', 'विभूतयः'], ['cosmos', 'अन्तो नास्ति']], 20: [['om', 'आत्मा'], ['heart', 'हृदि'], ['wheel', 'आदिर्मध्यमन्तः']],
  21: [['chakra', 'विष्णुः'], ['sun', 'रविः'], ['wind', 'मरीचिः'], ['moon', 'शशी']], 22: [['book', 'सामवेदः'], ['crown', 'वासवः'], ['heart', 'मनः'], ['lamp', 'चेतना']],
  23: [['trident', 'शङ्करः'], ['pot', 'वित्तेशः'], ['fire', 'पावकः'], ['mountain', 'मेरुः']], 24: [['book', 'बृहस्पतिः'], ['peacock', 'स्कन्दः'], ['ocean', 'सागरः']],
  25: [['mala', 'भृगुः'], ['om', 'एकमक्षरम्'], ['mala', 'जपयज्ञः'], ['mountain', 'हिमालयः']], 26: [['tree', 'अश्वत्थः'], ['star', 'नारदः'], ['flute', 'चित्ररथः'], ['mala', 'कपिलः']],
  27: [['horse', 'उच्चैःश्रवाः'], ['elephant', 'ऐरावतः'], ['crown', 'नराधिपः']], 28: [['vajra', 'वज्रम्'], ['cow', 'कामधुक्'], ['heart', 'कन्दर्पः'], ['serpent', 'वासुकिः']],
  29: [['serpent', 'अनन्तः'], ['ocean', 'वरुणः'], ['sun', 'अर्यमा'], ['wheel', 'यमः']], 30: [['heart', 'प्रह्लादः'], ['wheel', 'कालः'], ['lion', 'मृगेन्द्रः'], ['feather', 'वैनतेयः']],
  31: [['wind', 'पवनः'], ['bow', 'रामः'], ['fish', 'मकरः'], ['ocean', 'जाह्नवी']], 32: [['cosmos', 'सर्गाणाम्'], ['book', 'अध्यात्मविद्या'], ['eye', 'वादः']],
  33: [['letter', 'अकारः'], ['wheel', 'अक्षयः कालः'], ['cosmos', 'विश्वतोमुखः']], 34: [['wheel', 'मृत्युः'], ['lotus', 'श्रीः'], ['book', 'वाक्'], ['gem', 'कीर्तिः'], ['mountain', 'धृतिः']],
  35: [['book', 'बृहत्साम'], ['om', 'गायत्री'], ['moon', 'मार्गशीर्षः'], ['lotus', 'कुसुमाकरः']], 36: [['dice', 'द्यूतम्'], ['sun', 'तेजः'], ['crown', 'जयः'], ['lamp', 'सत्त्वम्']],
  37: [['flute', 'वासुदेवः'], ['bow', 'धनञ्जयः'], ['book', 'व्यासः'], ['star', 'उशना']], 38: [['mace', 'दण्डः'], ['crown', 'नीतिः'], ['mala', 'मौनम्'], ['lamp', 'ज्ञानम्']],
  39: [['lotus', 'बीजम्'], ['cosmos', 'सर्वभूतानि']], 40: [['star', 'अनन्ताः'], ['cosmos', 'विस्तरः']], 41: [['sun', 'तेजोंऽशसम्भवम्'], ['gem', 'श्रीमत्'], ['fire', 'ऊर्जितम्']], 42: [['cosmos', 'एकांशेन']],
};
function vibItem(g: G, k: Vib, x: number, y: number, s: number, t: number) {
  if (k === 'horse' || k === 'elephant' || k === 'vajra' || k === 'dice' || k === 'trident' || k === 'letter' || k === 'peacock') {
    g.save(); g.translate(x, y); g.scale(s, s);
    circle(g, 0, 0, 56, '#fbf3df', C.gold, 6); circle(g, 0, 0, 59, null, ink, 1.6);
    g.beginPath(); g.arc(0, 0, 52, 0, Math.PI * 2); g.clip();
    if (k === 'horse') horse(g, -10, 34, 0.28, t, { plume: C.gold });
    else if (k === 'elephant') elephant(g, 0, 36, 0.2, t, { col: C.white, howdah: false });
    else if (k === 'peacock') peacock(g, 0, 40, 0.32, t, { fan: 1 });
    else if (k === 'vajra') holdItem(g, 'vajra', 0, 26, 0.9, t);
    else if (k === 'trident') holdItem(g, 'trident', 0, 40, 0.5, t);
    else if (k === 'letter') devText(g, 'अ', 0, 4, 70, C.vermilion);
    else { for (const [dx, dy] of [[-18, -8], [16, 10]]) { g.beginPath(); g.rect(dx - 14, dy - 14, 28, 28); fs(g, C.white, ink, 2); circle(g, dx, dy, 3, ink); } }
    g.restore();
  } else emblem(g, k, x, y, s, t);
}
export const vibhuti: Scene = (g, b) => {
  const t = b.T, p = sum(b), n = vnum(b);
  g.fillStyle = '#8a1f2a'; g.fillRect(0, 0, PW, PH);
  night(g, t, 131, 0); g.save(); g.globalAlpha = 0.6; g.fillStyle = '#7c1d2e'; g.fillRect(0, 0, PW, PH); g.restore();
  canopy(g, t, C.gold);
  aureole(g, 300, 420, 0.75, t); deity(g, 300, 800, 0.8, t, { ...KRISHNA_ICON, garland: true });
  put(g, ARJUNA, 120, 880, 0.75, t, { pose: P.namaste, eye: 'up' });
  if (n === 42) { deity(g, 1000, 880, 1.2, t, VISHVARUPA(12)); }
  else {
    const list = VIB[n] ?? VIB[19];
    list.forEach(([k, l], i) => { const L = out(clamp(p * (list.length + 0.6) - i)); const cols = list.length > 3 ? 3 : list.length; const x = 720 + (i % cols) * (720 / cols) + (list.length > 3 && i >= 3 ? 120 : 0), y = list.length > 3 ? 330 + Math.floor(i / 3) * 280 : 450; g.save(); g.globalAlpha = 0.2 + 0.8 * L; vibItem(g, k, x, y, 1.15 * (0.7 + 0.3 * L), t); devText(g, l, x, y + 104, 28, C.gold); g.restore(); });
  }
  devText(g, `विभूतिः · १०.${n}`.replace(/\d/g, (d) => '०१२३४५६७८९'[+d]), 1460, 860, 22, C.cream);
  border(g, C.gold);
};

/* ───────── devotion ───────── */

/** Fix the mind on me; if not, practise; if not, work for me; if not, give up the fruit. */
export const steps: Scene = (g, b) => {
  const t = b.T, p = sum(b), n = vnum(b);
  dawn(g);
  const st = ['मय्येव मन आधत्स्व', 'अभ्यासयोगेन', 'मत्कर्मपरमो भव', 'सर्वकर्मफलत्यागम्'];
  st.forEach((w, i) => { const x = 1120 - i * 230, y = 330 + i * 120, on = 12 - i === n || (n === 12 && i === 3) || n - 9 === 3 - i; g.beginPath(); g.rect(x - 150, y, 300, 60); fs(g, on ? C.gold : '#e8cf96', ink, 2); devText(g, w, x, y + 30, 22, C.maroon); });
  aureole(g, 1300, 200, 0.5, t); deity(g, 1300, 400, 0.5, t, KRISHNA_ICON);
  const lvl = clamp(12 - n, 0, 3); put(g, SEEKER, 1120 - lvl * 230, 330 + lvl * 120, 0.8, t, { pose: P.namaste });
  void p; border(g, C.saffron);
};

/** The devotee who is dear to me. */
export const devoteeScene: Scene = (g, b) => {
  const t = b.T;
  sky(g, '#16737a', '#2a8a7a', '#0d3a4a');
  parijata(g, 1300, 900, 1.0, t);
  cows(g, 120, 420, 860, 0.6, t, 3, 8);
  put(g, KRISHNA, 820, 860, 1.6, t, { face: -1, pose: { fa: [1.2, 0.6], ba: [0.6, 0.6], fl: [0.06, 0.04], bl: [-0.07, 0.04] }, mouth: 'smile', glow: 0.6 });
  put(g, SEEKER, 640, 860, 1.45, t, { face: 1, pose: P.namaste, eye: 'closed', mouth: 'smile' });
  petals(g, t, 5, 30);
  border(g, C.vermilion);
};

/* ───────── field and knower ───────── */

export const fieldScene: Scene = (g, b) => {
  const t = b.T, a = A(b), p = sum(b);
  if (a === 1) { night(g, t, 141, 120); }
  else { dawn(g); field(g, 520, t); for (let i = 0; i < 9; i++) line(g, [[0, 560 + i * 40], [PW, 540 + i * 44]], 'rgba(110,64,30,0.25)', 2); }
  if (a === 0) {
    put(g, SEEKER, 800, 840, 1.6, t, { pose: P.stand });
    inner(g, 804, 560, 80, t); sunDisc(g, 1300, 160, 60, t, false);
    const parts: [EmblemKey, string][] = [['earth', 'महाभूतानि'], ['crown', 'अहङ्कारः'], ['lamp', 'बुद्धिः'], ['eye', 'इन्द्रियाणि'], ['heart', 'इच्छा द्वेषः'], ['mountain', 'धृतिः']];
    parts.forEach(([k, l], i) => medal(g, k, l, i < 3 ? 260 : 1340, 220 + (i % 3) * 210, 0.5, t, out(clamp(p * 7 - i))));
  } else if (a === 1) {
    // hands and feet everywhere, eyes and faces everywhere
    inner(g, 800, 450, 220, t);
    const R = rng(11); for (let i = 0; i < 46; i++) { const ang = R() * 6.28, d = 220 + R() * 380; const L = out(clamp(p * 3 - R())); g.save(); g.globalAlpha = L * 0.85; emblem(g, i % 3 ? 'eye' : 'hands', 800 + Math.cos(ang) * d, 450 + Math.sin(ang) * d * 0.6, 0.55, t, false); g.restore(); }
  } else if (a === 2) {
    const xs = [200, 420, 640, 960, 1180, 1400];
    xs.forEach((x, i) => { if (i === 2) cow(g, x, 820, 0.9, t, {}); else if (i === 4) elephant(g, x, 820, 0.5, t, {}); else put(g, i % 2 ? WOMAN : SEEKER, x, 820, 1.0, t + i, { pose: P.namaste }); inner(g, x, 560, 34, t, out(clamp(p * 6 - i))); });
    aureole(g, 800, 220, 0.4, t);
  } else {
    sunDisc(g, 800, 200, 110, t, true); rays(g, 800, 200, 1400, t, 1);
    put(g, SEEKER, 400, 840, 1.2, t, { pose: P.namaste, eye: 'up' }); cow(g, 1100, 840, 1.0, t, {});
  }
  border(g, C.green);
};

/* ───────── the three qualities ───────── */

const GUNA_COL = ['#f8f4e6', '#d63a28', '#2a2440'];
const GUNA_DEV = ['सत्त्वम्', 'रजः', 'तमः'];
const G18: Record<number, [string, EmblemKey]> = {
  19: ['ज्ञानम्', 'lamp'], 20: ['ज्ञानम्', 'lamp'], 21: ['ज्ञानम्', 'lamp'], 22: ['ज्ञानम्', 'lamp'], 23: ['कर्म', 'hands'], 24: ['कर्म', 'hands'], 25: ['कर्म', 'hands'], 26: ['कर्ता', 'crown'], 27: ['कर्ता', 'crown'], 28: ['कर्ता', 'crown'],
  29: ['बुद्धिः', 'eye'], 30: ['बुद्धिः', 'eye'], 31: ['बुद्धिः', 'eye'], 32: ['बुद्धिः', 'eye'], 33: ['धृतिः', 'mountain'], 34: ['धृतिः', 'mountain'], 35: ['धृतिः', 'mountain'], 36: ['सुखम्', 'heart'], 37: ['सुखम्', 'heart'], 38: ['सुखम्', 'heart'], 39: ['सुखम्', 'heart'], 40: ['गुणाः', 'cosmos'],
};
const which18 = (n: number) => ({ 20: 0, 21: 1, 22: 2, 23: 0, 24: 1, 25: 2, 26: 0, 27: 1, 28: 2, 30: 0, 31: 1, 32: 2, 33: 0, 34: 1, 35: 2, 36: 0, 37: 0, 38: 1, 39: 2 } as Record<number, number>)[n] ?? -1;
const which14 = (n: number) => ({ 6: 0, 7: 1, 8: 2, 11: 0, 12: 1, 13: 2, 14: 0, 15: 1, 16: 0, 17: 0, 18: 0 } as Record<number, number>)[n] ?? -1;

export const gunas: Scene = (g, b) => {
  const t = b.T, a = A(b), p = sum(b), n = vnum(b);
  night(g, t, 151, 60);
  if (a === 2) {
    // beyond the qualities: one sits still while the three wheel round
    GUNA_COL.forEach((c, i) => { const ang = t * 0.4 + (i / 3) * Math.PI * 2; circle(g, 800 + Math.cos(ang) * 330, 470 + Math.sin(ang) * 200, 70, c, C.gold, 3); devText(g, GUNA_DEV[i], 800 + Math.cos(ang) * 330, 470 + Math.sin(ang) * 200, 26, i === 0 ? C.maroon : C.cream); });
    put(g, SAGE_L, 800, 640, 1.3, t, { pose: P.sitNamaste, eye: 'closed', glow: 0.8 }); inner(g, 800, 470, 50, t);
    border(g, C.ink); return;
  }
  const hi = a === 3 ? which18(n) : which14(n);
  const xs = [330, 800, 1270];
  xs.forEach((x, i) => {
    const on = hi < 0 || hi === i;
    g.save(); g.globalAlpha = on ? 1 : 0.35;
    g.beginPath(); g.moveTo(x - 190, 860); g.lineTo(x - 190, 300); g.quadraticCurveTo(x, 140, x + 190, 300); g.lineTo(x + 190, 860); g.closePath(); fs(g, GUNA_COL[i], C.gold, 6);
    devText(g, GUNA_DEV[i], x, 250, 32, i === 2 ? C.cream : C.maroon);
    if (a === 1) {
      // where each leads: upward, staying in the middle, downward
      const y = [380, 560, 760][i]; inner(g, x, y + Math.sin(t * 2 + i) * 20, 40, t, i === 2 ? 0.4 : 1);
      line(g, [[x, 820], [x, [330, 540, 820][i]]], i === 2 ? C.lav : C.gold, 3);
    } else if (a === 3) {
      const [w, k] = G18[n] ?? ['ज्ञानम्', 'lamp']; emblem(g, k, x, 470, 0.9, t); devText(g, w, x, 600, 28, i === 2 ? C.cream : C.maroon);
    } else {
      if (i === 0) put(g, SAGE_L, x, 840, 1.1, t, { pose: { legs: 'lotus', fa: [1.0, 1.6] }, b: { k: 'book' } });
      if (i === 1) put(g, { ...SEEKER, crown: 'turban', turban: C.saffron, dhoti: C.green }, x, 840, 1.1, t, { pose: walkPose(t), f: { k: 'pot' } });
      if (i === 2) put(g, { ...SEEKER, dhoti: '#5a5a6a' }, x, 840, 1.1, t, { pose: { legs: 'lotus', lean: 0.5, head: 0.6, fa: [0.2, 0.4], ba: [0.1, 0.3] }, eye: 'closed' });
    }
    g.restore();
  });
  void p; border(g, C.ink);
};
const walkPose = (t: number) => ({ fa: [-0.45 * Math.sin(t * 4), 0.35], ba: [0.45 * Math.sin(t * 4), 0.35], fl: [0.42 * Math.sin(t * 4), 0.3], bl: [-0.42 * Math.sin(t * 4), 0.3] }) as Fig['pose'];

/* ───────── the tree with its roots above ───────── */

export const ashvattha: Scene = (g, b) => {
  const t = b.T, a = A(b), p = sum(b);
  night(g, t, 161, 120);
  // roots in the sky, branches hanging down into the world
  g.save(); g.translate(800, 120);
  inner(g, 0, -40, 140, t);
  const R = rng(15);
  const branch = (x: number, y: number, ang: number, len: number, d: number) => {
    if (d > 5) return;
    const x2 = x + Math.sin(ang) * len, y2 = y + Math.cos(ang) * len;
    line(g, [[x, y], [x2, y2]], C.brown, Math.max(2, 18 - d * 3.4));
    if (d >= 3) for (let k = 0; k < 3; k++) { g.save(); g.translate(x2 + (R() - 0.5) * 30, y2 + (R() - 0.5) * 20); g.rotate(R() * 6); g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(10, 12, 0, 28); g.quadraticCurveTo(-10, 12, 0, 0); fs(g, d % 2 ? C.green : C.leaf, ink, 0.8); g.restore(); }
    branch(x2, y2, ang - 0.35 - R() * 0.2, len * 0.74, d + 1); branch(x2, y2, ang + 0.35 + R() * 0.2, len * 0.74, d + 1);
  };
  branch(0, 0, 0, 170, 0);
  g.restore();
  devText(g, 'ऊर्ध्वमूलमधःशाखम्', 800, 60, 30, C.gold);
  if (a === 1) {
    // the axe of non-attachment
    const k = io(clamp(p * 1.4)); g.save(); g.translate(lerp(1300, 860, k), lerp(700, 300, k)); g.rotate(-0.6 + Math.sin(t * 6) * 0.2 * (1 - k)); holdItem(g, 'axe', 0, 0, 1.6, t); g.restore();
    cartouche(g, 'असङ्गशस्त्रेण दृढेन छित्त्वा', 800, 840, 30, { w: 520 });
  } else put(g, ARJUNA, 1360, 880, 0.9, t, { face: -1, pose: P.namaste, eye: 'up' });
  border(g, C.olive);
};

/* ───────── divine and demonic ───────── */

export const divine: Scene = (g, b) => {
  const t = b.T, a = A(b), p = sum(b);
  if (a === 0) {
    dawn(g); countryside(g, 560, t); pond(g, 760, t, 3);
    [[SAGE_L, 360], [WOMAN, 620], [SEEKER, 980], [{ ...SAGE_L, hair: '#2a1d1a' }, 1240]].forEach(([l, x], i) => { put(g, l as Look, x as number, 770, 1.1, t + i, { pose: i % 2 ? P.namaste : P.bless, mouth: 'smile', f: i === 2 ? { k: 'lotus' } : undefined }); inner(g, x as number, 560, 30, t, out(clamp(p * 5 - i))); });
  } else {
    dusk(g); g.save(); g.fillStyle = 'rgba(40,10,20,0.45)'; g.fillRect(0, 0, PW, PH); g.restore();
    const DEMON: Look = { head: 'demon', skin: '#5b3a7a', hair: '#1a1020', hairStyle: 'wild', crown: 'spiky', dhoti: C.maroon, dhotiFg: C.gold, border: C.gold, fangs: true, build: 1.3, belly: 1.25 };
    if (a === 2) {
      // “this I have gained today; this desire I shall fulfil”
      for (let i = 0; i < 30; i++) circle(g, 900 + (i % 10) * 26, 820 - Math.floor(i / 10) * 20, 12, C.gold, ink, 1);
      put(g, { ...DEMON, crown: 'mukut', head: 'man', skin: '#b9784a', fangs: false } as Look, 700, 860, 1.5, t, { pose: { ...P.stand, fa: [2.4, 0.4] }, mouth: 'open' });
      cartouche(g, 'इदमद्य मया लब्धम्', 800, 160, 36, { w: 420 });
    } else {
      [300, 600, 1000, 1300].forEach((x, i) => put(g, DEMON, x, 860, 1.0 + (i % 2) * 0.15, t + i, { face: (x < 800 ? 1 : -1) as 1 | -1, pose: i % 2 ? P.mace : { ...P.stand, fa: [1.6, 0.2] }, f: i % 2 ? { k: 'mace' } : undefined, mouth: 'roar' }));
      for (let i = 0; i < 6; i++) { const ph = (t * 0.3 + i / 6) % 1; g.save(); g.globalAlpha = 0.5 * (1 - ph); circle(g, 800 + Math.sin(i * 3) * 300, 700 - ph * 500, 40 + ph * 60, '#3a2a3a'); g.restore(); }
    }
  }
  border(g, a === 0 ? C.green : C.maroon);
};

/* ───────── faith ───────── */

export const faith: Scene = (g, b) => {
  const t = b.T, a = A(b), p = sum(b), n = vnum(b);
  night(g, t, 171, 60);
  const xs = [330, 800, 1270];
  // which of the three this verse speaks of
  const hi: number = ({ 8: 0, 9: 1, 10: 2, 11: 0, 12: 1, 13: 2, 17: 0, 18: 1, 19: 2, 20: 0, 21: 1, 22: 2 } as Record<number, number>)[n] ?? -1;
  xs.forEach((x, i) => {
    g.save(); g.globalAlpha = hi < 0 || hi === i ? 1 : 0.35;
    g.beginPath(); g.moveTo(x - 190, 860); g.lineTo(x - 190, 300); g.quadraticCurveTo(x, 140, x + 190, 300); g.lineTo(x + 190, 860); g.closePath(); fs(g, GUNA_COL[i], C.gold, 6);
    devText(g, ['सात्त्विकः', 'राजसः', 'तामसः'][i], x, 250, 30, i === 2 ? C.cream : C.maroon);
    if (a === 1) {
      // three foods
      g.beginPath(); g.ellipse(x, 620, 120, 30, 0, 0, Math.PI * 2); fs(g, C.gold, ink, 2);
      if (i === 0) { circle(g, x - 40, 600, 22, C.saffron, ink, 1.4); circle(g, x + 10, 596, 18, C.lime, ink, 1.4); g.beginPath(); g.ellipse(x + 60, 604, 26, 12, 0, 0, Math.PI * 2); fs(g, C.white, ink, 1.4); }
      if (i === 1) { for (let k = 0; k < 5; k++) { g.save(); g.translate(x - 60 + k * 30, 600); g.rotate(0.4); g.beginPath(); g.ellipse(0, 0, 6, 22, 0, 0, Math.PI * 2); fs(g, C.vermilion, ink, 1); g.restore(); } flame(g, x, 560, 0.25, t, 2); }
      if (i === 2) { for (let k = 0; k < 4; k++) circle(g, x - 50 + k * 34, 604, 16, '#7a7a5a', ink, 1.2); for (let k = 0; k < 3; k++) { const ph = (t * 0.5 + k / 3) % 1; g.save(); g.globalAlpha = 1 - ph; circle(g, x - 20 + k * 20, 570 - ph * 60, 4, '#5a6a3a'); g.restore(); } }
    } else if (a === 2) {
      altar(g, x, 760, 0.8, t);
      put(g, i === 2 ? { ...SEEKER, dhoti: '#5a5a6a' } : i === 1 ? { ...SEEKER, crown: 'turban', turban: C.saffron, dhoti: C.gold, belly: 1.3 } : SAGE_L, x - 110, 780, 0.9, t, { pose: i === 0 ? P.namaste : i === 1 ? P.bless : { legs: 'lotus', lean: 0.4, head: 0.5, fa: [0.2, 0.4], ba: [0.1, 0.3] }, eye: i === 2 ? 'closed' : 'open' });
    } else if (a === 3) {
      const k: [EmblemKey, string][] = [['hands', 'शारीरम्'], ['book', 'वाङ्मयम्'], ['heart', 'मानसम्']];
      emblem(g, k[i][0], x, 470, 0.9, t); devText(g, k[i][1], x, 600, 26, i === 2 ? C.cream : C.maroon);
    } else if (a === 4) {
      put(g, i === 2 ? { ...SEEKER, crown: 'turban', turban: C.ink, dhoti: C.maroon } : SEEKER, x - 60, 820, 0.9, t, { pose: { fa: [1.5, 0.3], ba: [1.3, 0.4], fl: [0.06, 0.04], bl: [-0.07, 0.04] }, f: { k: 'pot' } });
      put(g, SAGE_L, x + 70, 820, 0.85, t, { face: -1, pose: i === 2 ? { ...P.stand, fa: [1.6, 0.2] } : P.namaste });
    } else {
      emblem(g, (['crown', 'pot', 'fire'] as EmblemKey[])[i], x, 470, 0.9, t);
      devText(g, ['देवान्', 'यक्षरक्षांसि', 'प्रेतान् भूतगणान्'][i], x, 600, 24, i === 2 ? C.cream : C.maroon);
    }
    g.restore();
  });
  void p; border(g, C.lilac);
};

export const omtatsat: Scene = (g, b) => {
  const t = b.T, p = sum(b);
  night(g, t, 181, 120); rays(g, 800, 420, 1100, t, 0.6);
  ['ॐ', 'तत्', 'सत्'].forEach((w, i) => { const L = out(clamp(p * 4 - i)); g.save(); g.globalAlpha = L; g.shadowColor = 'rgba(255,200,80,0.9)'; g.shadowBlur = 30; devText(g, w, 400 + i * 400, 440, 160 + 20 * L, C.gold); g.restore(); });
  border(g, C.lilac);
};

/** The Lord in the heart of all beings, turning them as if mounted on a machine. */
export const machine: Scene = (g, b) => {
  const t = b.T;
  night(g, t, 191, 80);
  g.save(); g.translate(800, 460); g.rotate(t * 0.15);
  circle(g, 0, 0, 340, null, C.gold, 6); circle(g, 0, 0, 80, C.maroon, C.gold, 4);
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; line(g, [[Math.cos(a) * 80, Math.sin(a) * 80], [Math.cos(a) * 340, Math.sin(a) * 340]], C.gold, 4); g.save(); g.translate(Math.cos(a) * 340, Math.sin(a) * 340); g.rotate(-t * 0.15); const f = fig(i % 2 ? WOMAN : SEEKER, { x: 0, s: 0.5, t: t + i, pose: P.namaste }); onGround(f, 40); draw(g, f); inner(g, 0, -20, 14, t); g.restore(); }
  g.restore();
  aureole(g, 800, 420, 0.32, t); deity(g, 800, 520, 0.32, t, KRISHNA_ICON);
  border(g, C.vermilion);
};

export { cam, cloud, ocean, tree, mountain, chariotPair, KRISHNA };
