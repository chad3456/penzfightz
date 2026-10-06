/**
 * Scenes for chaupais 26–40, the closing doha and the end card: what his
 * grace does for those who remember him, and Tulsidas's own prayer.
 */
import { C, type G, PW, PH, cam, circle, ellipse, line, fs, clamp, seg, io, lerp, bump, rng, glory, cloud, ocean, lotus, lotusPond, petals, mountain, hills, tree, flame, diya, sunDisc, moon, palace, star4, curl, devText, archPath, floretP, sparks, nightSky, daySky, stroke2, water, garland, streamers, halo, shake } from './kit';
import { draw, onGround, P, walk, RAMA, RAMA_ASCETIC, LAKSHMANA, SITA, SITA_GROVE, SAGE, VILLAGER, WOMAN, CHILD, RAKSHASA, RAKSHASA2, SHIVA, PARVATI, TULSI, shade, type Fig } from './figures';
import { type Scene, H, F, shrine, floor, night, heartLotus, speed, pillar } from './stage';

const sky = (g: G, t: number, seed = 1) => nightSky(g, t, seed, 80);
const devNum = (n: number) => String(n).replace(/[0-9]/g, (d) => '०१२३४५६७८९'[+d]);

/* ═════════ 26: freed from trouble — mind, deed, word ═════════ */
export const rescue: Scene = (g, b) => {
  const t = b.t, [c0, c1] = b.c;
  const lift = io(seg(c1, 0.35, 0.9));
  night(g);
  g.save(); cam(g, [{ p: 0, x: 800, y: 560, z: 1.1 }, { p: 0.5, x: 800, y: 520, z: 1.05 }, { p: 1, x: 800, y: 440, z: 1 }], b.p);
  sky(g, t, 53);
  // a whirlpool of troubles, thorny vines all round it
  g.save(); g.translate(800, 690);
  for (let i = 0; i < 7; i++) { g.save(); g.rotate(t * (0.6 + i * 0.1) * (1 - lift)); g.scale(1, 0.32); curl(g, 0, 0, 380 - i * 48, 1.6, 1, i); g.strokeStyle = i % 2 ? C.teal : C.indigo; g.lineWidth = 22 - i * 2; g.stroke(); g.restore(); }
  g.restore();
  for (let i = 0; i < 8; i++) { const x = 400 + i * 110, k = 1 - lift; g.save(); g.globalAlpha = k; stroke2(g, [[x, 820], [x + 30, 700], [x - 20, 600], [x + 20, 520]], 6, C.olive, C.ink, 2); for (let j = 0; j < 4; j++) line(g, [[x + (j % 2 ? 10 : -10), 780 - j * 70], [x + (j % 2 ? 26 : -26), 770 - j * 70]], C.ink, 2.4); g.restore(); }
  // the person caught in it
  const py = lerp(660, 470, lift), px = 800;
  const pr = F(VILLAGER(4), { x: px, s: 1, t, pose: lift > 0 ? { ...P.raise, fa: [2.8, 0.2], ba: [2.6, 0.3] } : { ...P.namaste, head: -0.1 }, eye: c0 > 0.3 ? 'closed' : 'wide', mouth: lift > 0.6 ? 'smile' : 'calm' });
  pr.y = py; draw(g, pr);
  // mind, deed, word: three lamps lit by his meditation
  const icons = ['heart', 'hands', 'lips'];
  icons.forEach((k, i) => {
    const lit = io(seg(c1, 0.0 + i * 0.1, 0.25 + i * 0.1)) * 0 + io(seg(c0 + c1, 0.2 + i * 0.25, 0.4 + i * 0.25));
    const x = 380 + i * 420, y = 200;
    g.save(); g.globalAlpha = 0.35 + lit * 0.65;
    circle(g, x, y, 54, lit > 0.5 ? C.gold : C.navy2, C.ink, 3);
    g.translate(x, y);
    if (k === 'heart') { g.beginPath(); g.moveTo(0, 18); g.bezierCurveTo(-34, -6, -18, -34, 0, -16); g.bezierCurveTo(18, -34, 34, -6, 0, 18); fs(g, C.vermilion, C.ink, 2); }
    if (k === 'hands') { g.beginPath(); g.moveTo(-4, 24); g.quadraticCurveTo(-20, -10, -6, -30); g.lineTo(-2, 24); g.moveTo(4, 24); g.quadraticCurveTo(20, -10, 6, -30); g.lineTo(2, 24); fs(g, C.peach, C.ink, 2); }
    if (k === 'lips') { g.beginPath(); g.moveTo(-26, 0); g.quadraticCurveTo(-10, -16, 0, -6); g.quadraticCurveTo(10, -16, 26, 0); g.quadraticCurveTo(0, 22, -26, 0); fs(g, C.rani, C.ink, 2); }
    g.restore();
    if (lit > 0.5) flame(g, x, y - 60, 0.3, t, i);
  });
  devText(g, 'मन', 380, 280, 30, C.cream); devText(g, 'क्रम', 800, 280, 30, C.cream); devText(g, 'बचन', 1220, 280, 30, C.cream);
  // his great hand reaches down and lifts
  if (c1 > 0.2) {
    const reach = io(seg(c1, 0.2, 0.45));
    g.save(); g.globalAlpha = reach;
    const hf = H({ x: 1180, s: 2.4, face: -1, t, pose: { ...P.stand, fa: [lerp(1.2, 2.2, lift), 0.7] }, mouth: 'smile', glow: 1 });
    hf.y = lerp(1300, 880, reach); draw(g, hf);
    g.restore();
  }
  g.restore();
};

/* ═════════ 27: Rama the ascetic king above all; every task accomplished ═════════ */
export const king: Scene = (g, b) => {
  const t = b.t, [c0, c1] = b.c;
  daySky(g, '#f7c35e', '#fbe2b8');
  g.save(); cam(g, [{ p: 0, x: 800, y: 380, z: 1.15 }, { p: 0.5, x: 800, y: 420, z: 1.02 }, { p: 1, x: 800, y: 450, z: 0.95 }], b.p);
  for (let i = 0; i < 6; i++) cloud(g, 80 + i * 300, 640 + (i % 2) * 40, 1.2, t, C.white);
  // a hill-top under a great banyan, above the clouds
  tree(g, 800, 470, 2.2, 'peepal', t, 11);
  g.beginPath(); g.ellipse(800, 520, 300, 60, 0, Math.PI, 0); g.lineTo(1100, 560); g.lineTo(500, 560); g.closePath(); fs(g, C.stone, C.ink, 3);
  g.beginPath(); g.ellipse(800, 470, 120, 22, 0, 0, 7); fs(g, '#b98a5a', C.ink, 2);
  glory(g, 800, 330, 50, 200, t, 28, [C.gold, C.cream]);
  const rm = F(RAMA_ASCETIC, { x: 800, s: 1.2, t, pose: { ...P.sit, fa: [1.15, 1.25] }, b: { k: 'bow' }, mouth: 'smile', glow: 0.8 }); onGround(rm, 470); draw(g, rm);
  // his tasks, done, in roundels around: the ring, the bridge stone, the mountain, the door
  const tasks = ['ring', 'stone', 'mountain', 'door'];
  tasks.forEach((k, i) => {
    const a = io(seg(c1, i * 0.18, i * 0.18 + 0.3));
    if (a <= 0) return;
    const x = [240, 520, 1080, 1360][i], y = [760, 820, 820, 760][i];
    g.save(); g.globalAlpha = a; g.translate(x, y); g.scale(lerp(0.6, 1, a), lerp(0.6, 1, a));
    circle(g, 0, 0, 108, C.gold, C.ink, 3); circle(g, 0, 0, 96, k === 'door' ? C.maroon : C.sky, C.ink, 2);
    g.save(); g.beginPath(); g.arc(0, 0, 96, 0, 7); g.clip();
    if (k === 'ring') { const hf = H({ x: -10, s: 0.55, t, pose: { ...P.kneelOpen, fa: [1.8, 0.2] }, f: { k: 'ring', glow: 1 } }); onGround(hf, 70); draw(g, hf); }
    if (k === 'stone') { ocean(g, 30, 120, t, [C.blue, C.teal]); g.beginPath(); g.ellipse(0, 10, 50, 30, 0, 0, 7); fs(g, C.stone, C.ink, 2); devText(g, 'राम', 0, 10, 28, C.vermilion); }
    if (k === 'mountain') { const hf = H({ x: 0, y: 40, s: 0.5, t, pose: { ...P.fly, fa: [3, 0.1] }, f: { k: 'mountain', s: 0.6 } }); draw(g, hf); }
    if (k === 'door') { archPath(g, 0, 90, 90, 150, 5); fs(g, C.gold, C.ink, 2); const hf = H({ x: 50, s: 0.5, face: -1, t, pose: P.mace, f: { k: 'mace', a: 0.2 } }); onGround(hf, 90); draw(g, hf); }
    g.restore(); g.restore();
  });
  g.restore();
  void c0;
};

/* ═════════ 28: whatever wish is brought ═════════ */
export const wishes: Scene = (g, b) => {
  const t = b.t, [c0, c1] = b.c;
  daySky(g, C.saffron, C.rani);
  g.save(); cam(g, [{ p: 0, x: 600, y: 520, z: 1.1 }, { p: 0.5, x: 800, y: 480, z: 1 }, { p: 1, x: 900, y: 440, z: 1 }], b.p);
  sunDisc(g, 1300, 300, 70, t, false);
  // ghats and a river
  water(g, 560, 900, t, C.teal);
  for (let i = 0; i < 6; i++) { g.beginPath(); g.rect(-100 + i * 60, 520 + i * 10, 520 - i * 60, 14); fs(g, C.stone, C.ink, 1.6); }
  // the temple across the water
  shrine(g, 1250, 560, 160, 240, floretP(g, C.blush, 'rgba(214,58,40,0.2)', 20), t);
  const hf = H({ x: 1250, s: 0.7, t, pose: P.bless, mouth: 'smile', glow: 0.8 + c1 }); onGround(hf, 560); draw(g, hf);
  // devotees set leaf-boats with lamps afloat; each drifts toward the temple
  for (let i = 0; i < 3; i++) { const f = F(i % 2 ? VILLAGER(i + 1) : WOMAN(i + 1), { x: 180 + i * 120, s: 0.9, t: t + i, pose: { ...P.kneelOpen, fa: [1.3, 0.3] }, mouth: 'smile' }); onGround(f, 560); draw(g, f); }
  for (let i = 0; i < 9; i++) {
    const start = i * 0.07, u = clamp((c0 * 0.8 + c1 * 0.6 - start) / 0.9);
    if (u <= 0) continue;
    const x = lerp(360 + (i % 3) * 40, 1160 + (i % 3) * 30, u), y = lerp(600 + (i % 3) * 30, 600 + (i % 4) * 20, u) + Math.sin(t * 2 + i) * 4;
    g.save(); g.translate(x, y); g.beginPath(); g.moveTo(-24, 0); g.quadraticCurveTo(0, 16, 24, 0); g.quadraticCurveTo(0, 4, -24, 0); fs(g, C.green, C.ink, 1.6); g.restore();
    const bloom = io(seg(c1, 0.3 + i * 0.05, 0.7 + i * 0.03));
    if (bloom > 0) { g.save(); g.globalAlpha = bloom; tree(g, x, y - 4, 0.35 * bloom, 'mango', t, i); g.restore(); }
    else flame(g, x, y - 2, 0.16, t, i);
  }
  g.restore();
  if (c1 > 0.6) petals(g, t, 61, 24, [C.gold, C.marigold]);
};

/* ═════════ 29: through all four ages ═════════ */
export const ages: Scene = (g, b) => {
  const t = b.t, [c0, c1] = b.c;
  night(g);
  g.save(); cam(g, [{ p: 0, x: 800, y: 450, z: 1.25 }, { p: 0.5, x: 800, y: 450, z: 1.05 }, { p: 1, x: 800, y: 450, z: 0.9 }], b.p);
  sky(g, t, 59);
  const turn = io(seg(c0, 0, 1)) * Math.PI * 1.5 + c1 * Math.PI * 0.5;
  const R = 330;
  g.save(); g.translate(800, 450); g.rotate(turn);
  const yugas = [['सत्य', C.cream, C.gold], ['त्रेता', C.sky, C.blue], ['द्वापर', C.lime, C.green], ['कलि', C.blush, C.rani]];
  yugas.forEach(([name, a, b2], i) => {
    g.save(); g.rotate((i * Math.PI) / 2);
    g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, R, -Math.PI / 4, Math.PI / 4); g.closePath(); fs(g, a, C.ink, 3);
    g.save(); g.clip();
    g.translate(R * 0.62, 0); g.rotate(Math.PI / 2);
    // a sign of each age
    if (i === 0) { const s = F(SAGE, { x: 0, s: 0.55, t, pose: P.sit, eye: 'closed' }); onGround(s, 40); draw(g, s); }
    if (i === 1) { const r = F(RAMA, { x: -20, s: 0.5, t, pose: P.stand, b: { k: 'bow' } }); onGround(r, 50); draw(g, r); const h = H({ x: 30, s: 0.45, t, face: -1, pose: P.namaste }); onGround(h, 50); draw(g, h); }
    if (i === 2) { line(g, [[0, 50], [0, -70]], C.ink, 3); g.beginPath(); g.moveTo(0, -70); g.lineTo(46, -56); g.lineTo(0, -40); fs(g, C.saffron, C.ink, 2); const h = H({ x: 22, y: -50, s: 0.16, t, pose: P.namaste }); draw(g, h); g.beginPath(); g.ellipse(0, 50, 60, 18, 0, 0, 7); fs(g, C.gold, C.ink, 2); circle(g, -40, 60, 16, null, C.ink, 3); circle(g, 40, 60, 16, null, C.ink, 3); }
    if (i === 3) { for (let k = 0; k < 3; k++) { g.beginPath(); g.rect(-60 + k * 40, -10 - k * 10, 34, 50 + k * 10); fs(g, C.cream, C.ink, 1.6); } const p = F(VILLAGER(2), { x: 30, s: 0.4, t, pose: P.namaste }); onGround(p, 50); draw(g, p); }
    g.restore();
    g.restore();
    g.save(); g.rotate((i * Math.PI) / 2); g.translate(R + 34, 0); g.rotate(Math.PI / 2); devText(g, name as string, 0, 0, 30, b2 as string); g.restore();
  });
  circle(g, 0, 0, R, null, C.gold, 6);
  for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; circle(g, Math.cos(a) * (R + 12), Math.sin(a) * (R + 12), 5, C.gold); }
  g.restore();
  // Hanuman at the hub, light reaching through every age
  const lit = 0.5 + io(seg(c1, 0, 0.6)) * 0.5;
  glory(g, 800, 450, 40, 140 + lit * 120, t, 32, [C.gold, C.cream]);
  circle(g, 800, 450, 92, C.navy, C.gold, 4);
  const hf = H({ x: 800, s: 0.62, t, pose: P.bless, mouth: 'smile', glow: lit }); onGround(hf, 520); draw(g, hf);
  if (c1 > 0.5) sparks(g, 800, 450, t, 30, 520);
  g.restore();
};

/* ═════════ 30: guardian of saints, destroyer of demons, Rama's beloved ═════════ */
export const saints: Scene = (g, b) => {
  const t = b.t, [c0, c1] = b.c;
  daySky(g, '#9fd0b0', '#f2e2b0');
  g.save(); cam(g, [{ p: 0, x: 760, y: 470, z: 1.05 }, { p: 0.5, x: 800, y: 460, z: 1 }, { p: 0.65, x: 700, y: 470, z: 1.1 }, { p: 1, x: 700, y: 460, z: 1.15 }], b.p);
  hills(g, 680, [C.leaf, C.green]);
  tree(g, 300, 780, 1.2, 'kadamba', t, 2); tree(g, 1350, 780, 1.1, 'banana', t, 5);
  floor(g, 780, C.green, 'rgba(255,255,255,0.22)');
  // sages meditating
  for (let i = 0; i < 3; i++) { const f = F(SAGE, { x: 360 + i * 150, s: 0.95, t: t + i * 3, pose: i === 1 ? P.sitNamaste : P.sit, eye: 'closed', glow: 0.3 }); onGround(f, 780); draw(g, f); }
  // demons creep in from the right; the mace sends them flying
  const sweep = io(seg(c0 + c1 * 0.2, 0.45, 0.85));
  for (let i = 0; i < 3; i++) { const creep = io(seg(c0, i * 0.08, 0.4 + i * 0.08)); const x = lerp(1700, 1060 + i * 120, creep) + sweep * 900, y = 780 - sweep * (300 + i * 100); const f = F(i % 2 ? RAKSHASA : RAKSHASA2, { x, s: 1.0, face: -1, t: t + i, pose: sweep > 0 ? { ...P.raise, root: sweep * 4 } : walk(t * 4 + i, { lean: 0.3 }), mouth: sweep > 0 ? 'open' : 'calm', eye: sweep > 0 ? 'wide' : 'open' }); onGround(f, y); if (sweep < 1) draw(g, f); }
  const swing = Math.sin(seg(c0, 0.45, 0.7) * Math.PI) * 1.4;
  const hf = H({ x: 960, s: 1.3, t, face: c1 > 0.3 ? -1 : 1, pose: c1 > 0.3 ? P.namaste : { ...P.stride, fa: [1.2 + swing, 0.4] }, f: c1 > 0.3 ? undefined : { k: 'mace', a: 0.6 + swing }, mouth: 'smile' });
  onGround(hf, 780); draw(g, hf);
  // Rama, fond, a hand on his head
  if (c1 > 0.3) {
    const a = io(seg(c1, 0.3, 0.6));
    g.save(); g.globalAlpha = a;
    const rm = F(RAMA, { x: lerp(1300, 760, a), s: 1.3, t, pose: { ...P.stand, fa: [2.0, 0.9] }, b: { k: 'bow' }, mouth: 'smile', glow: 0.8 }); onGround(rm, 780);
    rm.face = 1; rm.x = 740; draw(g, rm);
    g.restore();
    petals(g, t, 71, 20 * a, [C.pink, C.white]);
  }
  g.restore();
};

/* ═════════ 31: the eight powers, the nine treasures, Janaki's boon ═════════ */
export const boon: Scene = (g, b) => {
  const t = b.t, [c0, c1] = b.c;
  night(g);
  g.save(); cam(g, [{ p: 0, x: 800, y: 460, z: 1 }, { p: 0.5, x: 800, y: 450, z: 1 }, { p: 1, x: 800, y: 470, z: 1.05 }], b.p);
  sky(g, t, 67);
  tree(g, 560, 780, 1.6, 'ashoka', t, 7);
  floor(g, 780, C.green, 'rgba(255,255,255,0.2)');
  const si = F(SITA_GROVE, { x: 640, s: 1.2, t, pose: { ...P.sit, fa: [1.9, 0.6], ba: [0.7, 1.3] }, mouth: 'smile', glow: 0.6 + c1 * 0.4 }); onGround(si, 780); draw(g, si);
  const hf = H({ x: 920, s: 1.15, face: -1, t, pose: P.kneel, eye: 'down', mouth: 'smile', glow: c1 }); onGround(hf, 780); draw(g, hf);
  // eight powers: tiny, vast, heavy, light, reach, will, mastery, command — as eight symbols orbiting
  const sym = (k: number, x: number, y: number) => {
    g.save(); g.translate(x, y);
    circle(g, 0, 0, 30, C.navy, C.gold, 3);
    if (k === 0) circle(g, 0, 0, 3, C.fire2);
    if (k === 1) circle(g, 0, 0, 20, C.fire2);
    if (k === 2) { g.beginPath(); g.moveTo(-14, 12); g.lineTo(14, 12); g.lineTo(8, -10); g.lineTo(-8, -10); g.closePath(); fs(g, C.stone, C.ink, 1.4); }
    if (k === 3) { g.beginPath(); g.moveTo(-14, 10); g.quadraticCurveTo(0, -24, 14, -14); g.quadraticCurveTo(0, -2, -14, 10); fs(g, C.white, C.ink, 1.2); }
    if (k === 4) { stroke2(g, [[-14, 12], [6, -12]], 6, C.peach, C.ink, 1.4); circle(g, 9, -14, 4, C.gold); }
    if (k === 5) { g.fillStyle = C.fire2; star4(g, 0, 0, 16); }
    if (k === 6) { g.beginPath(); g.moveTo(-14, 8); g.lineTo(-14, -6); g.lineTo(-7, 0); g.lineTo(0, -12); g.lineTo(7, 0); g.lineTo(14, -6); g.lineTo(14, 8); g.closePath(); fs(g, C.gold, C.ink, 1.4); }
    if (k === 7) { g.beginPath(); g.ellipse(0, 4, 14, 9, 0, 0, 7); fs(g, null, C.gold, 3); line(g, [[0, -5], [0, -16]], C.gold, 3); }
    g.restore();
  };
  if (c0 > 0.2) for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2 + t * 0.4, appear = io(seg(c0, 0.2 + k * 0.05, 0.45 + k * 0.05)); g.globalAlpha = appear; sym(k, 800 + Math.cos(a) * 330 * appear, 360 + Math.sin(a) * 140 * appear); }
  g.globalAlpha = 1;
  // nine treasures: nine gold pots in a row
  for (let i = 0; i < 9; i++) { const a = io(seg(c0, 0.55 + i * 0.04, 0.8 + i * 0.03)); if (a <= 0) continue; g.save(); g.globalAlpha = a; g.translate(320 + i * 120, 860 - a * 40); g.beginPath(); g.moveTo(-18, -16); g.bezierCurveTo(-34, 0, -26, 26, 0, 26); g.bezierCurveTo(26, 26, 34, 0, 18, -16); g.closePath(); fs(g, [C.gold, C.marigold][i % 2], C.ink, 2); for (let k = 0; k < 4; k++) circle(g, -10 + k * 7, -18 - (k % 2) * 4, 4, [C.vermilion, C.white, C.lime, C.sky][k], C.ink, 1); g.restore(); }
  // the blessing: light from her hand to his crown
  if (c1 > 0) { const a = io(seg(c1, 0, 0.4)); g.save(); g.globalAlpha = a * 0.7; g.strokeStyle = C.fire2; g.lineWidth = 10; g.beginPath(); g.moveTo(700, 580); g.quadraticCurveTo(800, 440, 900, 560); g.stroke(); g.restore(); sparks(g, 900, 560, t, 16, 120 * a); }
  g.restore();
};

/* ═════════ 32: the elixir of Rama; forever his servant ═════════ */
export const elixir: Scene = (g, b) => {
  const t = b.t, [c0, c1] = b.c;
  g.fillStyle = floretP(g, C.maroon, 'rgba(244,181,28,0.3)', 30); g.fillRect(0, 0, PW, PH);
  g.save(); cam(g, [{ p: 0, x: 800, y: 420, z: 1.3 }, { p: 0.45, x: 800, y: 440, z: 1.15 }, { p: 0.6, x: 760, y: 470, z: 1 }, { p: 1, x: 760, y: 480, z: 1.05 }], b.p);
  const serve = io(seg(c1, 0, 0.35));
  if (serve < 1) {
    g.save(); g.globalAlpha = 1 - serve;
    glory(g, 800, 420, 60, 300, t, 32, [C.gold, C.cream]);
    const hf = H({ x: 800, s: 1.5, t, pose: { ...P.stand, fa: [1.25, 1.25], ba: [0.9, 1.4] }, f: { k: 'kalash', a: 0, glow: 1, s: 1.3 }, mouth: 'smile', glow: 1 });
    onGround(hf, 780); draw(g, hf);
    devText(g, 'राम', 856, 470, 30, C.vermilion);
    for (let i = 0; i < 8; i++) { const ph = (t * 0.6 + i / 8) % 1; g.globalAlpha = (1 - serve) * (1 - ph); ellipse(g, 860 + Math.sin(i) * 20, 470 + ph * 200, 4, 6, 0, C.fire2); }
    g.restore();
  }
  if (serve > 0) {
    g.save(); g.globalAlpha = serve;
    shrine(g, 620, 800, 380, 520, floretP(g, C.blush, 'rgba(214,58,40,0.22)', 24), t);
    floor(g, 800);
    g.beginPath(); g.rect(520, 660, 200, 140); fs(g, floretP(g, C.gold, C.vermilion, 20), C.ink, 3);
    const rm = F(RAMA, { x: 620, s: 1.25, t, pose: { ...P.sit, fa: [1.2, 1.3] }, mouth: 'smile', eye: 'down' }); onGround(rm, 670); draw(g, rm);
    // Hanuman at his feet, pressing them gently
    const press = Math.sin(t * 2.4) * 0.1;
    const hf = H({ x: 830, s: 1.15, face: -1, t, pose: { ...P.kneelOpen, fa: [1.1 + press, 0.5], ba: [0.9 - press, 0.6], lean: 0.25 }, eye: 'down', mouth: 'smile' }); onGround(hf, 800); draw(g, hf);
    g.restore();
  }
  g.restore();
  void c0;
};

/* ═════════ 33: singing of him, one reaches Rama; old sorrows forgotten ═════════ */
export const bhajan: Scene = (g, b) => {
  const t = b.t, [c0, c1] = b.c;
  night(g);
  g.save(); cam(g, [{ p: 0, x: 800, y: 560, z: 1.12 }, { p: 0.5, x: 800, y: 500, z: 1 }, { p: 1, x: 800, y: 430, z: 0.95 }], b.p);
  sky(g, t, 73);
  // Rama appears above the singers
  const ap = io(seg(c0, 0.5, 1));
  if (ap > 0) { g.save(); g.globalAlpha = ap; glory(g, 800, 230, 60, 230, t, 32, [C.gold, C.cream]); for (let i = 0; i < 4; i++) cloud(g, 560 + i * 160, 380, 0.8, t, C.white); const r = F(RAMA, { x: 800, s: 1.0, t, pose: P.bless, b: { k: 'bow' }, mouth: 'smile', glow: 1 }); onGround(r, 380); draw(g, r); g.restore(); }
  // chains of past births — rings — shattering into petals
  for (let i = 0; i < 7; i++) {
    const brk = io(seg(c1, 0.1 + i * 0.07, 0.4 + i * 0.07)), x = 230 + i * 190, y = 520;
    if (brk < 1) { g.save(); g.globalAlpha = 1 - brk; ellipse(g, x, y, 46, 30, 0.3 * (i % 2 ? 1 : -1), null, '#6a6278', 10); g.restore(); }
    if (brk > 0) { for (let k = 0; k < 6; k++) { const a = k + i; g.save(); g.globalAlpha = 1 - brk; g.fillStyle = [C.pink, C.marigold][k % 2]; g.beginPath(); g.ellipse(x + Math.cos(a) * brk * 120, y + Math.sin(a) * brk * 80 - brk * 60, 9, 4, a, 0, 7); g.fill(); g.restore(); } }
  }
  // the bhajan: drum, cymbals, singers, swaying
  floor(g, 840, C.maroon);
  const players: [number, object, string?][] = [[240, VILLAGER(0), 'drum'], [420, WOMAN(0)], [600, VILLAGER(3), 'cymbal'], [1000, WOMAN(2)], [1180, VILLAGER(5), 'cymbal'], [1360, WOMAN(4)]];
  players.forEach(([x, L, k], i) => {
    const sw = Math.sin(t * 3 + i) * 0.08;
    const f = F(L, { x, s: 1, t: t + i, face: x < 800 ? 1 : -1, pose: { ...(k === 'drum' ? P.sit : k === 'cymbal' ? { ...P.sit, fa: [1.5, 0.9] } : { ...P.sit, fa: [2.6, 0.4], ba: [-2.3, 0.4] }), lean: sw, head: sw - 0.1 }, f: k === 'cymbal' ? { k: 'cymbal', a: 0 } : undefined, eye: 'closed', mouth: Math.sin(t * 6 + i) > 0 ? 'sing' : 'smile' });
    onGround(f, 840); draw(g, f);
    if (k === 'drum') { g.save(); g.translate(x + 50, 820); g.beginPath(); g.ellipse(0, 0, 50, 24, 0, 0, 7); fs(g, C.brown, C.ink, 2); ellipse(g, -46, 0, 6, 24, 0, C.cream, C.ink, 1.6); ellipse(g, 46, 0, 6, 24, 0, C.cream, C.ink, 1.6); for (let q = -3; q <= 3; q++) line(g, [[q * 13, -22], [q * 13 + 8, 22]], C.gold, 1.6); g.restore(); }
  });
  diya(g, 800, 840, 1.6, t);
  g.restore();
  streamers(g, t, 77, 10);
};

/* ═════════ 34: at the end, Rama's city; born again, a devotee ═════════ */
export const saket: Scene = (g, b) => {
  const t = b.t, [c0, c1] = b.c;
  night(g);
  g.save(); cam(g, [{ p: 0, x: 600, y: 600, z: 1.1 }, { p: 0.45, x: 800, y: 300, z: 1 }, { p: 0.6, x: 800, y: 1300, z: 1.05 }, { p: 1, x: 800, y: 1320, z: 1.05 }], b.p);
  // heaven above: the golden city among clouds
  g.save(); g.fillStyle = 'rgba(255,214,90,0.15)'; g.fillRect(-400, -400, 2400, 900); g.restore();
  sky(g, t, 79);
  glory(g, 800, 200, 80, 360, t, 40, [C.gold, C.cream]);
  palace(g, 800, 300, 0.9, 'ayodhya', t);
  for (let i = 0; i < 8; i++) cloud(g, 120 + i * 200, 320 + (i % 2) * 30, 1.1, t, C.white);
  // a small house below; an old devotee; the soul rising as a flame
  g.fillStyle = C.indigo; g.fillRect(-400, 640, 2400, 1400);
  g.beginPath(); g.rect(420, 540, 200, 120); fs(g, C.cream, C.ink, 2.4); g.beginPath(); g.moveTo(400, 540); g.lineTo(520, 470); g.lineTo(640, 540); g.closePath(); fs(g, C.vermilion, C.ink, 2.4);
  const rise = io(seg(c0, 0.2, 1));
  const old = F(SAGE, { x: 700, s: 0.95, t, pose: P.sitNamaste, eye: 'closed', alpha: 1 - rise * 0.6 }); onGround(old, 660); draw(g, old);
  if (rise > 0) { const y = lerp(520, 330, rise); g.save(); g.globalAlpha = 1 - seg(rise, 0.9, 1); flame(g, 720, y, 0.45, t, 3); glory(g, 720, y - 30, 10, 50, t, 16, [C.gold, C.cream]); g.restore(); }
  // the lower world, far below: a home, a cradle, a newborn with a tilak; people bowing
  g.save(); g.translate(0, 900);
  daySkyRect(g, 0, 300, 1700, C.peach, C.gold);
  floor(g, 780, C.maroon);
  g.beginPath(); g.rect(560, 520, 480, 260); fs(g, C.cream, C.ink, 3); archPath(g, 800, 780, 160, 220, 5); fs(g, C.navy, C.ink, 2);
  toranRow(g, 560, 1040, 520, t);
  // the cradle swings
  const sw = Math.sin(t * 1.6) * 0.12;
  g.save(); g.translate(800, 560); g.rotate(sw); line(g, [[-60, 0], [-60, 120]], C.brown, 3); line(g, [[60, 0], [60, 120]], C.brown, 3); g.beginPath(); g.moveTo(-80, 120); g.quadraticCurveTo(0, 190, 80, 120); g.closePath(); fs(g, floretP(g, C.gold, C.vermilion, 16), C.ink, 2.4); circle(g, 0, 128, 18, '#e0a676', C.ink, 2); line(g, [[0, 116], [0, 126]], C.vermilion, 3); g.restore();
  const bowA = io(seg(c1, 0.3, 0.8));
  for (const [x, L] of [[420, WOMAN(5)], [1180, VILLAGER(1)], [320, CHILD(1)], [1280, WOMAN(3)]] as [number, object][]) { const f = F(L, { x, s: x === 320 ? 0.7 : 0.95, face: x < 800 ? 1 : -1, t, pose: { ...P.namaste, lean: bowA * 0.5 }, mouth: 'smile' }); onGround(f, 780); draw(g, f); }
  if (c1 > 0.5) devText(g, 'हरि-भक्त', 800, 440, 44, C.vermilion);
  g.restore();
  g.restore();
};
function daySkyRect(g: G, x: number, y: number, w: number, top: string, bot: string) { const gr = g.createLinearGradient(0, y - 400, 0, y + 600); gr.addColorStop(0, top); gr.addColorStop(1, bot); g.fillStyle = gr; g.fillRect(x - 400, y - 400, w + 800, 1400); }
function toranRow(g: G, x0: number, x1: number, y: number, t: number) { garland(g, x0, y, x1, y, 30, t); }

/* ═════════ 35: one devotion brings every joy ═════════ */
export const devotion: Scene = (g, b) => {
  const t = b.t, [c0, c1] = b.c;
  const bloom = io(seg(c1, 0.1, 0.9));
  daySky(g, lerpCol(C.stone, C.gold, bloom), lerpCol('#cbbfae', C.blush, bloom));
  g.save(); cam(g, [{ p: 0, x: 800, y: 470, z: 1.05 }, { p: 1, x: 800, y: 450, z: 1 }], b.p);
  // a garden grows up around the shrine
  hills(g, 700, [lerpCol('#8a8070', C.leaf, bloom), lerpCol('#6a6458', C.green, bloom)]);
  for (let i = 0; i < 8; i++) { const x = 100 + i * 200, g0 = io(seg(bloom, i * 0.06, 0.5 + i * 0.06)); if (g0 > 0) tree(g, x, 760, 0.7 * g0, i % 2 ? 'mango' : i % 3 ? 'kadamba' : 'banana', t, i); }
  shrine(g, 800, 760, 240, 340, floretP(g, C.blush, 'rgba(214,58,40,0.2)', 22), t);
  const hf = H({ x: 800, s: 0.95, t, pose: P.bless, mouth: 'smile', glow: 0.6 + bloom * 0.6, skin: '#e8792e' }); onGround(hf, 760); draw(g, hf);
  floor(g, 760);
  // the devotee: single-minded, offering flowers and sindoor
  const offer = seg(c0, 0.3, 0.9);
  const dv = F(WOMAN(0), { x: 520, s: 1.05, t, pose: offer > 0 ? { ...P.kneelOpen, fa: [1.4 + Math.sin(offer * Math.PI) * 0.3, 0.3] } : P.namaste, f: offer > 0 ? { k: 'lotus', a: 0.8 } : undefined, eye: 'open', mouth: 'smile' }); onGround(dv, 760); draw(g, dv);
  for (let i = 0; i < 12; i++) { const a = io(seg(bloom, i * 0.05, 0.4 + i * 0.05)); if (a > 0) lotus(g, 200 + i * 110, 800 + (i % 2) * 40, 0.6 * a, a, [C.pink, C.white, C.marigold][i % 3], C.rani); }
  g.restore();
  if (bloom > 0.5) petals(g, t, 83, 26);
};
function lerpCol(a: string, b: string, t: number) { const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16); const c = (s: number) => Math.round(lerp((pa >> s) & 255, (pb >> s) & 255, t)); return `rgb(${c(16)},${c(8)},${c(0)})`; }

/* ═════════ 36: troubles cut away ═════════ */
export const storm: Scene = (g, b) => {
  const t = b.t, [c0, c1] = b.c;
  const cut = io(seg(c0, 0.55, 0.8)), clear = io(seg(c0, 0.75, 1) + c1 * 0.5);
  g.fillStyle = lerpCol('#2a2440', '#f2b850', clear); g.fillRect(0, 0, PW, PH);
  g.save(); shake(g, (1 - clear) * 3, t); cam(g, [{ p: 0, x: 800, y: 480, z: 1.08 }, { p: 1, x: 800, y: 450, z: 1 }], b.p);
  if (clear > 0) { g.save(); g.globalAlpha = clear; sunDisc(g, 1250, 220, 90, t, true); g.restore(); }
  // the storm: dark clouds and rain
  if (clear < 1) { g.save(); g.globalAlpha = 1 - clear; for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#3a3550' : '#2a2640'; g.beginPath(); g.ellipse(100 + i * 200, 120 + Math.sin(t + i) * 10, 170, 80, 0, 0, 7); g.fill(); } g.strokeStyle = 'rgba(200,210,240,0.5)'; g.lineWidth = 2; for (let i = 0; i < 80; i++) { const x = (i * 97 + t * 400) % 1800 - 100, y = (i * 53 + t * 900) % 900; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 10, y + 30); g.stroke(); } g.restore(); }
  ocean(g, 620, 900, t * (2 - clear), [lerpCol('#1a2050', C.blue, clear), lerpCol('#22285a', C.teal, clear), C.navy2]);
  // a small boat, tossed, then steady
  const toss = Math.sin(t * 3) * 0.25 * (1 - clear);
  g.save(); g.translate(560, 640 + Math.sin(t * 3) * 12 * (1 - clear)); g.rotate(toss);
  g.beginPath(); g.moveTo(-120, 0); g.quadraticCurveTo(0, 60, 120, 0); g.lineTo(140, -20); g.lineTo(-140, -20); g.closePath(); fs(g, C.brown, C.ink, 3);
  line(g, [[0, -20], [0, -200]], C.brown, 6);
  g.beginPath(); g.moveTo(4, -190); g.quadraticCurveTo(80 + toss * 60, -130, 4, -50); fs(g, C.cream, C.ink, 2);
  const sailor = F(VILLAGER(1), { x: -60, s: 0.75, t, pose: clear > 0.5 ? P.namaste : { ...P.raise, fa: [2.6, 0.4], ba: [2.4, 0.4] }, mouth: clear > 0.5 ? 'smile' : 'open', eye: clear > 0.5 ? 'open' : 'wide' }); onGround(sailor, -18); draw(g, sailor);
  g.restore();
  // the dark knot of troubles over the boat, cut by the mace
  if (cut < 1) { g.save(); g.globalAlpha = 1 - cut; g.translate(560, 360); for (let i = 0; i < 5; i++) { curl(g, (i - 2) * 30, Math.sin(i) * 20, 60, 1.6, i % 2 ? 1 : -1, t + i); g.strokeStyle = '#1a1626'; g.lineWidth = 9; g.stroke(); } g.restore(); }
  if (cut > 0 && cut < 1) { g.save(); g.globalAlpha = 1 - cut; for (let i = 0; i < 2; i++) { g.save(); g.translate(560 + (i ? 1 : -1) * cut * 300, 360 + cut * 200); g.rotate((i ? 1 : -1) * cut * 2); curl(g, 0, 0, 50, 1.4, 1, 0); g.strokeStyle = '#1a1626'; g.lineWidth = 8; g.stroke(); g.restore(); } g.restore(); }
  const swing = seg(c0, 0.4, 0.62);
  const hf = H({ x: 980, y: 380, s: 1.3, face: -1, t, pose: { ...P.fly, root: 0.4, head: -0.4, fa: [lerp(3.0, 1.2, io(swing)), 0.2] }, f: { k: 'mace', a: lerp(0.2, -1.6, io(swing)) }, mouth: 'roar', glow: 0.8, wind: 2.5 });
  if (c0 > 0.3) { g.save(); g.globalAlpha = io(seg(c0, 0.3, 0.45)); draw(g, hf); g.restore(); }
  if (cut > 0 && cut < 0.6) sparks(g, 600, 360, t, 18, 260);
  g.restore();
  void c1;
};

/* ═════════ 37: glory, glory, glory; be gracious as a guru ═════════ */
export const guru: Scene = (g, b) => {
  const t = b.t, [c0, c1] = b.c;
  night(g);
  g.save(); cam(g, [{ p: 0, x: 800, y: 380, z: 1.05 }, { p: 0.5, x: 800, y: 420, z: 1 }, { p: 0.65, x: 760, y: 500, z: 1.15 }, { p: 1, x: 760, y: 500, z: 1.2 }], b.p);
  sky(g, t, 89);
  // three bursts, one for each "jai"
  for (let k = 0; k < 3; k++) {
    const u = seg(c0, k * 0.13, k * 0.13 + 0.35);
    if (u <= 0 || u >= 1) continue;
    const x = [400, 1200, 800][k], y = [240, 240, 160][k];
    for (let i = 0; i < 26; i++) { const a = (i / 26) * Math.PI * 2, r = out3(u) * 220; g.globalAlpha = 1 - u; g.fillStyle = [C.gold, C.pink, C.white, C.marigold][i % 4]; star4(g, x + Math.cos(a) * r, y + Math.sin(a) * r + u * u * 80, 8); }
    g.globalAlpha = 1 - u; devText(g, 'जय', x, y, 60 + u * 30, C.gold); g.globalAlpha = 1;
  }
  hills(g, 700, [C.indigo, C.navy2]);
  floor(g, 790, '#2c2450', 'rgba(205,189,240,0.25)');
  // Hanuman as teacher; a child disciple before him
  glory(g, 780, 420, 60, 240, t, 28, [C.gold, C.cream]);
  const hf = H({ x: 780, s: 1.4, t, pose: c1 > 0.2 ? { ...P.sit, fa: [1.55, 0.6] } : { ...P.sit, fa: [2.6, 0.3] }, mouth: 'smile', glow: 0.9 }); onGround(hf, 790); draw(g, hf);
  if (c1 > 0) { const a = io(seg(c1, 0, 0.3)); g.save(); g.globalAlpha = a; const ch = F(CHILD(0), { x: 1010, s: 0.85, face: -1, t, pose: { ...P.sitNamaste, head: 0.25 }, eye: 'closed', mouth: 'smile', glow: seg(c1, 0.4, 1) }); onGround(ch, 790); draw(g, ch); diya(g, 900, 790, 1.2, t); g.restore(); if (c1 > 0.5) sparks(g, 1000, 600, t, 12, 100); }
  g.restore();
};
const out3 = (t: number) => 1 - Math.pow(1 - t, 3);

/* ═════════ 38: recited a hundred times, bondage falls away ═════════ */
export const freedom: Scene = (g, b) => {
  const t = b.t, [c0, c1] = b.c;
  const free = io(seg(c1, 0.15, 0.7));
  g.fillStyle = '#2a2236'; g.fillRect(0, 0, PW, PH);
  g.save(); cam(g, [{ p: 0, x: 700, y: 520, z: 1.15 }, { p: 0.5, x: 760, y: 480, z: 1.05 }, { p: 1, x: 900, y: 420, z: 1 }], b.p);
  // stone walls
  g.fillStyle = '#3a3048'; g.fillRect(-400, -400, 2400, 1700);
  for (let y = 0; y < 900; y += 60) for (let x = (y / 60) % 2 ? -60 : 0; x < 1700; x += 120) { g.strokeStyle = '#2a2236'; g.lineWidth = 3; g.strokeRect(x, y, 120, 60); }
  // the barred window becomes an open sky
  g.save(); archPath(g, 1180, 520, 300, 380, 5); fs(g, free > 0 ? lerpCol('#1a2050', '#8fc7ef', free) : '#1a2050', C.ink, 4); g.clip();
  if (free > 0) { g.globalAlpha = free; for (let i = 0; i < 3; i++) cloud(g, 1100 + i * 80, 300 + i * 40, 0.5, t); g.globalAlpha = 1; }
  for (let i = 0; i < 5; i++) { const x = 1060 + i * 60; g.save(); g.translate(0, -free * 500); line(g, [[x, 140], [x, 520]], '#5a5a66', 10); g.restore(); }
  g.restore();
  floor(g, 790, '#3a2a2a', 'rgba(255,255,255,0.1)');
  // the prisoner, counting a hundred on his beads
  const count = Math.min(100, Math.floor(seg(c0, 0, 1) * 100 + c1 * 100));
  const pr = F(VILLAGER(3), { x: 640, s: 1.15, t, crown: 'none', hairStyle: 'short', pose: free > 0.6 ? { ...P.raise, fa: [2.7, 0.2], ba: [-2.5, 0.2], legs: 'legs' } : { ...P.sit, fa: [1.3, 1.5] }, f: free > 0.6 ? undefined : { k: 'mala' }, eye: free > 0.3 ? 'up' : 'closed', mouth: free > 0.3 ? 'smile' : 'sing' });
  onGround(pr, 790); draw(g, pr);
  if (free < 1) { g.save(); g.globalAlpha = 1 - free; for (const dx of [-40, 40]) { for (let i = 0; i < 6; i++) ellipse(g, 640 + dx + i * (dx > 0 ? 14 : -14), 780 - i * 2, 9, 6, 0, null, '#8a8a96', 4); } g.restore(); }
  // broken links flying
  if (free > 0 && free < 1) for (let i = 0; i < 8; i++) { const a = i * 0.8; ellipse(g, 640 + Math.cos(a) * free * 300, 760 - Math.sin(a) * free * 200, 9, 6, a, null, '#8a8a96', 4); }
  devText(g, devNum(count), 400, 300, 120, 'rgba(244,181,28,0.85)');
  devText(g, 'बार', 400, 390, 40, 'rgba(244,181,28,0.6)');
  // a white bird out of the window
  if (free > 0.4) { const u = seg(free, 0.4, 1); g.save(); g.translate(lerp(1180, 1700, u), lerp(400, 100, u)); const f = Math.sin(t * 12) * 0.6; g.fillStyle = C.white; g.strokeStyle = C.ink; g.lineWidth = 2; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(-30, -30 * (1 + f), -60, -10); g.quadraticCurveTo(-30, -6, 0, 0); g.moveTo(0, 0); g.quadraticCurveTo(30, -30 * (1 - f), 60, -10); g.quadraticCurveTo(30, -6, 0, 0); g.fill(); g.stroke(); g.restore(); }
  g.restore();
};

/* ═════════ 39: whoever reads it attains; Shiva is witness ═════════ */
export const witness: Scene = (g, b) => {
  const t = b.t, [c0, c1] = b.c;
  night(g);
  g.save(); cam(g, [{ p: 0, x: 600, y: 600, z: 1.1 }, { p: 0.5, x: 700, y: 520, z: 1 }, { p: 0.6, x: 900, y: 300, z: 1 }, { p: 1, x: 950, y: 300, z: 1.08 }], b.p);
  sky(g, t, 97);
  // Kailash: Shiva and Parvati watching from the snow
  g.beginPath(); g.moveTo(560, 600); g.lineTo(900, 60); g.lineTo(1000, 140); g.lineTo(1100, 40); g.lineTo(1500, 600); g.closePath(); fs(g, '#e9eef5', C.ink, 3);
  const wit = io(seg(c1, 0.2, 0.6));
  const sh = F(SHIVA, { x: 960, s: 0.95, t, pose: { ...P.sit, fa: wit > 0 ? [2.0 + wit * 0.4, 1.3] : [0.6, 1.0] }, b: { k: 'trident', a: 0 }, eye: wit > 0 ? 'open' : 'closed', mouth: 'smile', glow: wit }); onGround(sh, 300); draw(g, sh);
  const pv = F(PARVATI, { x: 1110, s: 0.9, face: -1, t, pose: P.sit, mouth: 'smile', eye: wit > 0 ? 'down' : 'open' }); onGround(pv, 300); draw(g, pv);
  if (wit > 0) { for (let i = 0; i < 3; i++) { const k = ((t * 0.7 + i / 3) % 1); g.globalAlpha = (1 - k) * wit; circle(g, 960, 180, 40 + k * 300, null, C.cream, 3); } g.globalAlpha = 1; }
  // below: a reader with the book of forty verses by lamplight
  hills(g, 760, [C.indigo, C.navy2]);
  floor(g, 840, '#2c2450', 'rgba(205,189,240,0.25)');
  const rd = F(WOMAN(3), { x: 520, s: 1.1, t, pose: { ...P.sit, fa: [1.3, 0.9], ba: [1.2, 1.0] }, f: { k: 'book', a: 0 }, eye: 'down', mouth: Math.sin(t * 7) > 0 ? 'sing' : 'calm', glow: seg(c0, 0.3, 1) }); onGround(rd, 840); draw(g, rd);
  diya(g, 660, 840, 1.3, t);
  // the verses rising from the book toward the mountain
  for (let i = 0; i < 10; i++) { const ph = (t * 0.25 + i / 10) % 1; devText(g, ['जय', 'हनुमान', 'ज्ञान', 'गुन', 'सागर', 'राम', 'दूत', 'बल', 'धामा', '॥'][i], lerp(600, 960, ph), lerp(700, 240, ph), 24 + ph * 10, `rgba(244,181,28,${Math.sin(ph * Math.PI)})`); }
  g.restore();
};

/* ═════════ 40: Tulsidas asks the Lord to live in his heart ═════════ */
export const tulsi: Scene = (g, b) => {
  const t = b.t, [c0, c1] = b.c;
  daySky(g, '#f3a24a', '#f7d6a8');
  g.save(); cam(g, [{ p: 0, x: 800, y: 450, z: 1 }, { p: 0.5, x: 760, y: 470, z: 1.05 }, { p: 0.65, x: 640, y: 540, z: 1.6 }, { p: 1, x: 640, y: 540, z: 1.7 }], b.p);
  sunDisc(g, 1320, 180, 70, t, false);
  // Varanasi: the river, boats, the ghats and temples
  water(g, 660, 900, t, C.teal);
  for (let i = 0; i < 3; i++) { const x = ((t * 20 + i * 500) % 1900) - 150; g.save(); g.translate(x, 720 + i * 50); g.beginPath(); g.moveTo(-60, 0); g.quadraticCurveTo(0, 22, 60, 0); g.lineTo(70, -8); g.lineTo(-70, -8); g.closePath(); fs(g, C.brown, C.ink, 2); g.restore(); }
  for (let i = 0; i < 6; i++) { g.beginPath(); g.rect(-100, 560 + i * 18, 1800, 18); fs(g, i % 2 ? C.stone : '#d8b48a', C.ink, 1.4); }
  for (let i = 0; i < 5; i++) { const x = 140 + i * 330; g.beginPath(); g.rect(x - 60, 380, 120, 180); fs(g, i % 2 ? C.cream : '#f3d2a0', C.ink, 2); g.beginPath(); g.moveTo(x - 50, 380); g.lineTo(x, 300 - (i % 2) * 40); g.lineTo(x + 50, 380); g.closePath(); fs(g, C.vermilion, C.ink, 2); line(g, [[x, 300 - (i % 2) * 40], [x, 270 - (i % 2) * 40]], C.ink, 2); g.beginPath(); g.moveTo(x, 270 - (i % 2) * 40); g.lineTo(x + 24, 280 - (i % 2) * 40); g.lineTo(x, 288 - (i % 2) * 40); fs(g, C.saffron, null); }
  // Tulsidas writes, then prays
  const pray = io(seg(c1, 0, 0.3));
  const tl = F(TULSI, { x: 640, s: 1.2, t, pose: pray > 0.5 ? P.sitNamaste : { ...P.sit, fa: [1.3, 1.1], ba: [1.0, 1.2] }, f: pray > 0.5 ? undefined : { k: 'quill', a: 0.4 }, eye: pray > 0.5 ? 'closed' : 'down', mouth: pray > 0.5 ? 'sing' : 'calm', glow: c1 }); onGround(tl, 600); draw(g, tl);
  if (pray < 0.5) { g.beginPath(); g.rect(700, 560, 120, 30); fs(g, '#e7c98c', C.ink, 2); for (let i = 0; i < 3; i++) line(g, [[710, 568 + i * 8], [710 + ((t * 40 + i * 30) % 100), 568 + i * 8]], C.maroon, 1.4); }
  // the Lord's light enters his heart
  if (c1 > 0.3) {
    const a = io(seg(c1, 0.3, 0.8));
    g.save(); g.globalAlpha = a;
    const gr = g.createLinearGradient(1000, 100, 660, 520); gr.addColorStop(0, 'rgba(255,214,90,0)'); gr.addColorStop(1, 'rgba(255,214,90,0.6)'); g.fillStyle = gr; g.beginPath(); g.moveTo(1050, 60); g.lineTo(660, 500); g.lineTo(700, 520); g.lineTo(1150, 80); g.closePath(); g.fill();
    heartLotus(g, 662, 518, 34, a, t);
    const hf = H({ x: 662, s: 0.18, t, pose: P.namaste, mouth: 'smile' }); onGround(hf, 528); draw(g, hf);
    g.restore();
  }
  g.restore();
  void c0;
};

/* ═════════ closing doha: dwell in my heart ═════════ */
export const heart: Scene = (g, b) => {
  const t = b.t, [c0, c1, c2, c3] = b.c;
  g.fillStyle = floretP(g, C.maroon, 'rgba(244,181,28,0.3)', 30); g.fillRect(0, 0, PW, PH);
  g.save(); cam(g, [{ p: 0, x: 800, y: 430, z: 1.1 }, { p: 0.5, x: 800, y: 440, z: 1 }, { p: 0.78, x: 800, y: 450, z: 1 }, { p: 1, x: 800, y: 470, z: 0.7 }], b.p);
  // the great shrine
  night(g);
  sky(g, t, 101);
  glory(g, 800, 380, 100, 420, t, 44, [C.gold, C.marigold]);
  shrine(g, 800, 800, 820, 660, floretP(g, C.blush, 'rgba(214,58,40,0.22)', 26), t);
  lotusPond(g, 800, t, 103, C.teal);
  // Pavan's son with the wind about him (first foot)
  vayuRing(g, 800, 470, t, 1 - seg(c1, 0.5, 1) * 0.5);
  const hf = H({ x: 800, s: 1.45, t, pose: c1 > 0 ? P.bless : P.mace, f: c1 > 0 ? undefined : { k: 'mace', a: 0.2 }, b: c1 > 0 ? { k: 'mace', a: -0.15 } : undefined, mouth: 'smile', glow: 1 + c1 * 0.5, skin: c1 > 0.3 ? '#ee8a2e' : C.hanu });
  onGround(hf, 790); draw(g, hf);
  // Rama, Lakshmana and Sita appear beside him (third foot)
  const tri = io(seg(c2, 0, 0.6));
  if (tri > 0) {
    g.save(); g.globalAlpha = tri;
    const sita = F(SITA, { x: 1060, s: 1.2, t, pose: P.namaste, mouth: 'smile', face: -1 }); onGround(sita, 790); draw(g, sita);
    const lk = F(LAKSHMANA, { x: 1220, s: 1.2, t, pose: P.namaste, mouth: 'smile', face: -1, b: { k: 'bow' } }); onGround(lk, 790); draw(g, lk);
    const rm = F(RAMA, { x: 560, s: 1.3, t, pose: P.bless, b: { k: 'bow' }, mouth: 'smile', glow: 0.8 }); onGround(rm, 790); draw(g, rm);
    g.restore();
  }
  g.restore();
  // fourth foot: the whole shrine becomes the lotus in a devotee's heart
  if (c3 > 0) {
    const k = io(seg(c3, 0.1, 0.9));
    g.save(); g.globalAlpha = k;
    // a vignette in the shape of a heart-lotus opens around everything
    g.beginPath(); g.rect(0, 0, PW, PH);
    const r = lerp(1400, 470, k);
    g.moveTo(800 + r, 450); g.arc(800, 450, r, 0, Math.PI * 2, true);
    g.fillStyle = C.night; g.fill('evenodd');
    for (let i = 0; i < 16; i++) { g.save(); g.translate(800, 450); g.rotate((i / 16) * Math.PI * 2 + t * 0.05); g.beginPath(); g.moveTo(0, -r); g.bezierCurveTo(60, -r - 40, 50, -r - 120, 0, -r - 160); g.bezierCurveTo(-50, -r - 120, -60, -r - 40, 0, -r); fs(g, i % 2 ? C.pink : C.rani, C.ink, 2.4); g.restore(); }
    g.restore();
  }
  petals(g, t, 107, 30 + c3 * 30);
  void c0;
};
function vayuRing(g: G, x: number, y: number, t: number, a: number) {
  g.save(); g.globalAlpha = a * 0.8;
  for (let i = 0; i < 5; i++) { g.save(); g.translate(x, y); g.rotate(t * 0.4 + i * 1.25); g.scale(1, 0.55); curl(g, 220, 0, 60, 1.2, 1, t + i); g.strokeStyle = i % 2 ? 'rgba(255,255,255,0.8)' : 'rgba(205,189,240,0.75)'; g.lineWidth = 7; g.stroke(); g.restore(); }
  g.restore();
}

/* ═════════ end card ═════════ */
export const end: Scene = (g, b) => {
  const t = b.t;
  night(g);
  g.save(); cam(g, [{ p: 0, x: 800, y: 450, z: 1 }, { p: 1, x: 800, y: 450, z: 1.06 }], clamp(t / 12));
  sky(g, t, 109);
  glory(g, 800, 330, 80, 260, t, 36, [C.gold, C.marigold]);
  halo(g, 800, 330, 120, C.navy, C.gold);
  const hf = H({ x: 800, s: 0.95, t, pose: P.namaste, eye: 'closed', mouth: 'smile', glow: 1 }); onGround(hf, 440); draw(g, hf);
  g.restore();
  const a = seg(t, 0.8, 2.6);
  g.save(); g.globalAlpha = a;
  devText(g, '॥ इति श्री हनुमान चालीसा ॥', 800, 560, 54, C.gold);
  devText(g, 'सियावर रामचंद्र की जय · पवनसुत हनुमान की जय', 800, 630, 30, C.cream, 'center', '"Noto Serif Devanagari", serif');
  g.font = 'italic 24px "Cormorant Garamond", Georgia, serif'; g.fillStyle = 'rgba(248,236,208,0.85)'; g.textAlign = 'center';
  g.fillText('Words by Goswami Tulsidas (16th century). Pictures, music and English by Claude.', 800, 720);
  g.restore();
  petals(g, t, 113, 34);
};

export const SCENES_C: Record<string, Scene> = { rescue, king, wishes, ages, saints, boon, elixir, bhajan, saket, devotion, storm, guru, freedom, witness, tulsi, heart, end };
void [ellipse, bump, rng, mountain, moon, star4, stroke2, pillar, speed, lotusPond, walk, shade, RAMA_ASCETIC, PW, PH, LAKSHMANA, sparks, palace];
export type { Fig };
