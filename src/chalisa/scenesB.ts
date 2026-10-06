/**
 * Scenes for chaupais 11–25: the herb and the embrace, the praise of gods
 * and sages, the friends he made kings, the sun and the ocean, and the
 * protector at Rama's door.
 */
import { C, type G, PW, PH, cam, circle, ellipse, line, fs, clamp, seg, io, lerp, bump, rng, glory, cloud, ocean, lotus, petals, mountain, hills, tree, flame, diya, sunDisc, moon, palace, star4, curl, devText, poly, archPath, floretP, sparks, nightSky, daySky, stroke2, water, shake, halo } from './kit';
import { draw, onGround, P, mix, walk, HANUMAN, RAMA, LAKSHMANA, BHARATA, SUGRIVA, VANARA, VIBHISHANA, RAKSHASA, SAGE, CHILD_SAGE, NARADA, SARASWATI, YAMA, KUBERA, VILLAGER, WOMAN, CHILD, BABY_HANUMAN, shesha, brahma, ghost, type Fig } from './figures';
import { type Scene, H, F, shrine, floor, night, speed, pillar, twinkle } from './stage';

const sky = (g: G, t: number, seed = 1) => nightSky(g, t, seed, 80);
const embrace = (g: G, x: number, gy: number, s: number, t: number, a = 1) => {
  // Rama and Hanuman hold each other: two figures leaning in, arms around
  const r = F(RAMA, { x: x - 34 * s, s, t, pose: { fa: [1.75, 0.9], ba: [1.4, 1.1], lean: 0.18 * a, fl: [0.06, 0.04], bl: [-0.07, 0.04] }, eye: 'closed', mouth: 'smile', glow: 0.6 });
  const h = H({ x: x + 34 * s, s: s * 0.96, face: -1, t, pose: { fa: [1.7, 0.9], ba: [1.3, 1.1], lean: 0.2 * a, fl: [0.06, 0.04], bl: [-0.07, 0.04] }, eye: 'closed', mouth: 'smile', glow: 0.6 });
  onGround(r, gy); onGround(h, gy); draw(g, h); draw(g, r);
};

/* ═════════ 11: the herb, Lakshmana revived, the embrace ═════════ */
export const sanjeevani: Scene = (g, b) => {
  const t = b.t, [c0, c1] = b.c;
  night(g);
  g.save(); cam(g, [{ p: 0, x: 1100, y: 330, z: 1.05 }, { p: 0.3, x: 900, y: 420, z: 1 }, { p: 0.5, x: 760, y: 500, z: 1.05 }, { p: 0.7, x: 700, y: 480, z: 1.2 }, { p: 1, x: 700, y: 480, z: 1.25 }], b.p);
  sky(g, t, 19); moon(g, 1300, 140, 50);
  hills(g, 700, [C.indigo, C.navy2]);
  floor(g, 780, '#3a2a4a', 'rgba(200,180,255,0.3)');
  // the battlefield camp: Lakshmana lying, Rama grieving, the healer
  const revive = io(seg(c0, 0.6, 1));
  const lk = F(LAKSHMANA, { x: 640, s: 1.1, t, pose: { root: lerp(-Math.PI / 2, 0, revive), fa: [0.2, 0.2], ba: [-0.1, 0.2], fl: [0.06, 0.04], bl: [-0.07, 0.04] }, eye: revive > 0.5 ? 'open' : 'closed', mouth: revive > 0.5 ? 'smile' : 'calm' });
  if (revive < 0.5) { lk.x = 560; lk.y = 760 - 10; } else onGround(lk, 780);
  draw(g, lk);
  const rm = F(RAMA, { x: 430, s: 1.2, t, pose: c1 > 0 ? P.stand : { ...P.kneelOpen, head: 0.35 }, eye: revive > 0.5 ? 'open' : 'down', mouth: revive > 0.5 ? 'smile' : 'calm' });
  if (c1 <= 0) { onGround(rm, 780); draw(g, rm); }
  // Hanuman arrives with the mountain
  const fly = io(seg(c0, 0, 0.55));
  if (c1 <= 0) {
    const hx = lerp(1700, 900, fly), hy = lerp(160, 420, fly);
    const hf = H({ x: hx, y: hy, s: 1.1, face: -1, t, pose: fly < 1 ? { ...P.fly, fa: [3.0, 0.1] } : { ...P.stand, fa: [2.95, 0.05] }, f: { k: 'mountain', a: 0, s: 0.75 }, wind: 2.5, glow: 0.6 });
    if (fly >= 1) onGround(hf, 780);
    draw(g, hf);
    if (fly < 1) speed(g, hx + 260, hy - 40, 260, 5, t);
    // the healer gives the herb
    if (c0 > 0.5) { const hl = F(SAGE, { x: 760, s: 1.0, face: -1, t, pose: { ...P.kneelOpen, fa: [1.3, 0.4] }, f: { k: 'herb', glow: 1 } }); onGround(hl, 780); draw(g, hl); }
  }
  if (revive > 0) sparks(g, 600, 640, t, 18, 160 * revive, C.lime);
  // the embrace
  if (c1 > 0) {
    g.save(); g.globalAlpha = io(seg(c1, 0, 0.25));
    glory(g, 700, 520, 80, 300, t, 32, [C.gold, C.cream]);
    embrace(g, 700, 780, 1.3, t, io(seg(c1, 0.1, 0.4)));
    g.restore();
    petals(g, t, 7, 34);
  }
  g.restore();
};

/* ═════════ 12: "dear to me as Bharata" ═════════ */
export const praise: Scene = (g, b) => {
  const t = b.t, [c0, c1] = b.c;
  g.fillStyle = floretP(g, C.maroon, 'rgba(244,181,28,0.3)', 30); g.fillRect(0, 0, PW, PH);
  g.save(); cam(g, [{ p: 0, x: 800, y: 450, z: 1 }, { p: 0.5, x: 760, y: 450, z: 1.05 }, { p: 1, x: 840, y: 450, z: 1 }], b.p);
  pillar(g, 160, 780, 560); pillar(g, 1440, 780, 560);
  shrine(g, 520, 780, 420, 520, floretP(g, C.blush, 'rgba(214,58,40,0.22)', 24), t);
  floor(g, 780);
  // the throne
  g.beginPath(); g.rect(400, 640, 240, 140); fs(g, floretP(g, C.gold, C.vermilion, 20), C.ink, 3);
  const rm = F(RAMA, { x: 520, s: 1.25, t, pose: { ...P.sit, fa: [1.45, 0.6] }, b: { k: 'bow' }, mouth: Math.sin(t * 7) > 0 && c0 > 0 && c0 < 1 ? 'open' : 'smile' }); onGround(rm, 650); draw(g, rm);
  const hf = H({ x: 860, s: 1.2, face: -1, t, pose: P.kneel, eye: c1 > 0 ? 'up' : 'down', mouth: 'smile', glow: 0.4 + c0 * 0.6 }); onGround(hf, 780); draw(g, hf);
  // praise as golden garlands of light falling on him
  if (c0 > 0) for (let i = 0; i < 12; i++) { const ph = (t * 0.6 + i / 12) % 1; g.globalAlpha = (1 - ph) * seg(c0, 0, 0.2); star4(g, lerp(620, 860, ph) + Math.sin(i) * 20, lerp(460, 520, ph) - Math.sin(ph * Math.PI) * 120, 6); } g.globalAlpha = 1;
  // Bharata appears beside him, as an equal
  if (c1 > 0) {
    const a = io(seg(c1, 0.05, 0.45));
    g.save(); g.globalAlpha = a;
    glory(g, 1120, 560, 60, 220, t, 24, [C.cream, C.gold]);
    const bh = F(BHARATA, { x: 1120, s: 1.2, face: -1, t, pose: { ...P.stand, fa: [1.4, 1.0] }, f: { k: 'paduka', a: 0 }, mouth: 'smile' }); onGround(bh, 780); draw(g, bh);
    g.restore();
    // a line of light joins the two brothers' hearts to Rama
    const lk = io(seg(c1, 0.4, 0.8));
    if (lk > 0) { g.save(); g.globalAlpha = lk; g.strokeStyle = C.fire2; g.lineWidth = 4; g.setLineDash([10, 10]); g.lineDashOffset = -t * 30; g.beginPath(); g.moveTo(540, 560); g.quadraticCurveTo(700, 460, 860, 600); g.moveTo(540, 560); g.quadraticCurveTo(840, 400, 1120, 560); g.stroke(); g.setLineDash([]); g.restore(); }
  }
  g.restore();
};

/* ═════════ 13: a thousand mouths sing; the Lord embraces him ═════════ */
export const sheshaScene: Scene = (g, b) => {
  const t = b.t, [c0, c1] = b.c;
  night(g);
  g.save(); cam(g, [{ p: 0, x: 800, y: 380, z: 1.1 }, { p: 0.45, x: 800, y: 420, z: 1 }, { p: 0.62, x: 800, y: 520, z: 1.15 }, { p: 1, x: 800, y: 520, z: 1.2 }], b.p);
  sky(g, t, 23);
  ocean(g, 640, 900, t * 0.6, [C.indigo, C.navy2, C.peacock]);
  const sx = lerp(800, 520, io(seg(c1, 0, 0.4))), ss = lerp(1.25, 0.8, io(seg(c1, 0, 0.4)));
  shesha(g, sx, 600, ss, t, 11);
  // songs rise from the hoods
  for (let i = 0; i < 16; i++) { const ph = (t * 0.5 + i / 16) % 1, a = -1.3 + (i % 11) / 10 * 2.6; const x = sx + Math.sin(a) * 140 * ss + Math.sin(ph * 8 + i) * 12, y = 600 - 240 * ss - ph * 200; g.globalAlpha = (1 - ph) * (1 - seg(c1, 0.3, 0.6) * 0.6); devText(g, ['जय', 'हनुमान', 'जय', 'कपीस', '॥'][i % 5], x, y, 22, C.gold); }
  g.globalAlpha = 1;
  if (c1 > 0) {
    g.save(); g.globalAlpha = io(seg(c1, 0, 0.3));
    lotus(g, 1060, 790, 3.6, 1, C.pink, C.rani);
    glory(g, 1060, 560, 80, 280, t, 30, [C.gold, C.cream]);
    embrace(g, 1060, 770, 1.15, t, io(seg(c1, 0.15, 0.5)));
    g.restore();
  }
  g.restore();
  void c0;
};

/* ═════════ 14: the heavenly chorus ═════════ */
export const chorus: Scene = (g, b) => {
  const t = b.t, [c0, c1] = b.c;
  daySky(g, '#8fc7ef', '#f7d7b0');
  g.save(); cam(g, [{ p: 0, x: 520, y: 440, z: 1.2 }, { p: 0.45, x: 700, y: 430, z: 1.05 }, { p: 0.6, x: 1100, y: 450, z: 1.15 }, { p: 1, x: 900, y: 450, z: 0.95 }], b.p);
  for (let i = 0; i < 8; i++) cloud(g, 80 + i * 220, 830 + (i % 2) * 20, 1.3, t, C.white);
  for (let i = 0; i < 6; i++) cloud(g, 140 + i * 280, 560, 1, t, C.white);
  // centre: Hanuman, small and radiant, whom all are praising
  glory(g, 800, 230, 40, 150, t, 24, [C.gold, C.cream]);
  const hf = H({ x: 800, s: 0.7, t, pose: P.namaste, glow: 1, mouth: 'smile' }); onGround(hf, 320); draw(g, hf);
  // left tier: Sanaka and the child sages, Brahma on a lotus, seers
  for (let i = 0; i < 4; i++) { const f = F(CHILD_SAGE, { x: 180 + i * 85, s: 0.75, t: t + i, pose: P.sitNamaste, eye: 'up', mouth: 'sing' }); onGround(f, 560); draw(g, f); }
  lotus(g, 560, 610, 2.6, 1, C.pink, C.rani);
  brahma(g, 560, 596 - 26, 1.0, t);
  // (place brahma on his lotus)
  const seers = [0, 1, 2].map((i) => onGround(F(SAGE, { x: 230 + i * 130, s: 0.85, t: t + i * 2, pose: { ...P.sit, fa: [1.6, 1.2] }, eye: 'up', mouth: 'sing', b: { k: 'mala' } }), 800));
  seers.forEach((f) => draw(g, f));
  // right tier: Narada, Saraswati, the serpent king
  const nr = F(NARADA, { x: 1060, s: 1.0, face: -1, t, pose: { ...P.stand, fa: [1.0, 1.4] }, f: { k: 'veena', a: 0.3 }, eye: 'up', mouth: 'sing' }); onGround(nr, 560); draw(g, nr);
  lotus(g, 1260, 590, 2.2, 1, C.white, C.cream);
  const sw = F(SARASWATI, { x: 1260, s: 1.0, face: -1, t, pose: { ...P.sit, fa: [1.2, 1.4], ba: [0.8, 1.3] }, f: { k: 'veena', a: 0.6 }, eye: 'up', mouth: 'sing' }); onGround(sw, 580); draw(g, sw);
  shesha(g, 1250, 760, 0.42, t, 7);
  // music notes
  for (let i = 0; i < 14; i++) { const ph = (t * 0.45 + i / 14) % 1; const x = i < 7 ? lerp(300, 760, ph) : lerp(1260, 840, ph), y = lerp(600, 260, ph) - Math.sin(ph * Math.PI) * 60; g.globalAlpha = Math.sin(ph * Math.PI); g.fillStyle = C.vermilion; star4(g, x, y, 6); g.globalAlpha = 1; }
  g.restore();
  void c0; void c1;
};

/* ═════════ 15: Yama, Kubera, the guardians; poets cannot tell it ═════════ */
export const guardians: Scene = (g, b) => {
  const t = b.t, [c0, c1] = b.c;
  night(g);
  g.save(); cam(g, [{ p: 0, x: 800, y: 430, z: 1 }, { p: 0.5, x: 800, y: 430, z: 1.02 }, { p: 0.65, x: 800, y: 560, z: 1.05 }, { p: 1, x: 800, y: 600, z: 1.05 }], b.p);
  sky(g, t, 29);
  // the compass of directions: eight guardians around a wheel
  g.save(); g.translate(800, 380); g.rotate(t * 0.05);
  circle(g, 0, 0, 300, null, C.gold, 4); circle(g, 0, 0, 220, null, 'rgba(244,181,28,0.5)', 2);
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; line(g, [[Math.cos(a) * 60, Math.sin(a) * 60], [Math.cos(a) * 300, Math.sin(a) * 300]], 'rgba(244,181,28,0.5)', 2); halo(g, Math.cos(a) * 300, Math.sin(a) * 300, 40, [C.vermilion, C.teal, C.gold, C.rani, C.green, C.sky, C.marigold, C.lilac][i], C.gold); }
  g.restore();
  // Yama on his buffalo and Kubera with his pot
  // buffalo
  g.save(); g.translate(420, 610); g.beginPath(); g.ellipse(0, 0, 120, 60, 0, 0, 7); fs(g, '#2a2a33', C.ink, 3); g.beginPath(); g.ellipse(120, -20, 46, 36, 0.2, 0, 7); fs(g, '#2a2a33', C.ink, 3); g.beginPath(); g.moveTo(130, -50); g.quadraticCurveTo(180, -90, 200, -40); g.quadraticCurveTo(170, -60, 140, -40); fs(g, C.cream, C.ink, 2); for (const x of [-80, -40, 40, 80]) stroke2(g, [[x, 40], [x, 110]], 16, '#2a2a33', C.ink, 2); circle(g, 135, -24, 5, C.vermilion); g.restore();
  const ym = F(YAMA, { x: 410, s: 0.95, t, pose: P.sit, f: { k: 'noose', a: 0 } }); onGround(ym, 590); draw(g, ym);
  const kb = F(KUBERA, { x: 1190, s: 1.15, face: -1, t, pose: { ...P.stand, fa: [1.1, 1.2] }, f: { k: 'pot', a: 0 }, mouth: 'smile' }); onGround(kb, 720); draw(g, kb);
  // their scrolls of praise unroll forever
  const un = seg(c0, 0.2, 1) + c1;
  for (const [x, y] of [[560, 440], [1020, 440]]) { g.beginPath(); g.rect(x - 30, y, 60, 30 + un * 260); fs(g, C.cream, C.ink, 2); for (let i = 0; i < Math.floor(un * 12); i++) line(g, [[x - 20, y + 20 + i * 22], [x + 20, y + 20 + i * 22]], 'rgba(124,29,46,0.6)', 2); ellipse(g, x, y, 34, 10, 0, C.gold, C.ink, 2); }
  // second line: poets at their desks, ink running out
  if (c1 > 0) {
    const a = io(seg(c1, 0, 0.3));
    g.save(); g.globalAlpha = a;
    floor(g, 900, C.maroon);
    for (let i = 0; i < 4; i++) {
      const x = 260 + i * 360, f = F(i % 2 ? SAGE : VILLAGER(i + 2), { x, s: 0.95, face: 1, t: t + i, pose: { ...P.sit, fa: [1.3, 1.0], ba: [0.6, 1.0], head: 0.2 }, f: { k: 'quill', a: 0.6 }, eye: 'down' });
      onGround(f, 900); draw(g, f);
      g.beginPath(); g.rect(x + 40, 860, 120, 40); fs(g, C.brown, C.ink, 2);
      // a sheet that keeps growing off the desk
      const L = 40 + ((t * 40 + i * 30) % 200);
      g.beginPath(); g.rect(x + 60, 840 - L * 0.1, 80, L); fs(g, C.cream, C.ink, 1.6);
      if (seg(c1, 0.5, 0.8) > 0 && i % 2) { devText(g, '?', x + 10, 700, 50, C.gold); }
    }
    g.restore();
  }
  g.restore();
};

/* ═════════ 16: Sugriva brought to Rama, given a throne ═════════ */
export const sugriva: Scene = (g, b) => {
  const t = b.t, [c0, c1] = b.c;
  daySky(g, C.gold, C.peach);
  g.save(); cam(g, [{ p: 0, x: 700, y: 450, z: 1 }, { p: 0.45, x: 760, y: 450, z: 1.05 }, { p: 0.6, x: 2350, y: 450, z: 1 }, { p: 1, x: 2400, y: 450, z: 1.05 }], b.p);
  for (let i = 0; i < 10; i++) cloud(g, 100 + i * 330, 140 + (i % 2) * 60, 1, t, C.cream);
  // Rishyamukh hill
  hills(g, 680, [C.leaf, C.green]);
  mountain(g, 1100, 760, 600, 300, C.stone, C.earth, 12);
  tree(g, 300, 780, 1.1, 'mango', t, 9);
  const walkIn = io(seg(c0, 0, 0.6));
  const rx = lerp(200, 520, walkIn);
  const lk = F(LAKSHMANA, { x: rx - 130, s: 1.15, t, pose: walkIn < 1 ? walk(t * 6) : P.stand, b: { k: 'bow' } }); onGround(lk, 780); draw(g, lk);
  const rm = F(RAMA, { x: rx, s: 1.2, t, pose: walkIn < 1 ? walk(t * 6 + 1) : { ...P.stand, fa: [1.5, 0.2] }, b: { k: 'bow' }, mouth: 'smile' }); onGround(rm, 780); draw(g, rm);
  const hf = H({ x: rx + 150, s: 1.15, t, pose: walkIn < 1 ? walk(t * 6 + 2, { fa: [1.6, 0.2] }) : { ...P.stand, fa: [1.7, 0.2] }, mouth: 'smile' }); onGround(hf, 780); draw(g, hf);
  const meet = io(seg(c0, 0.55, 0.95));
  const sg = F(SUGRIVA, { x: 960, s: 1.15, face: -1, t, pose: meet > 0 ? { ...P.stand, fa: [1.55, 0.1] } : { ...P.stand, head: 0.2, fa: [0.6, 1.4] }, eye: meet > 0 ? 'open' : 'down', mouth: meet > 0.5 ? 'smile' : 'calm', crown: 'none' }); onGround(sg, 780); draw(g, sg);
  if (meet > 0.5) { flame(g, 820, 780, 0.6, t, 2); sparks(g, 820, 700, t, 14, 100); }
  // Kishkindha: Sugriva crowned among cheering vanaras
  g.save(); g.translate(1600, 0);
  g.beginPath(); g.rect(0, -400, 1800, 1700); g.clip();
  daySky(g, C.marigold, C.blush);
  palace(g, 800, 760, 1.1, 'ayodhya', t);
  floor(g, 780);
  const crown = io(seg(c1, 0.2, 0.7));
  const king = F(SUGRIVA, { x: 800, s: 1.35, t, pose: crown > 0.9 ? P.raise : P.namaste, b: { k: 'mace', a: 0 }, mouth: 'smile', glow: crown }); onGround(king, 780); draw(g, king);
  if (crown < 1) { g.save(); g.translate(800 + 14, lerp(220, 410, crown)); g.beginPath(); g.moveTo(-26, 0); g.lineTo(-20, -40); g.lineTo(0, -64); g.lineTo(20, -40); g.lineTo(26, 0); g.closePath(); fs(g, C.gold, C.ink, 2.4); circle(g, 0, -24, 6, C.vermilion); g.restore(); }
  for (let i = 0; i < 6; i++) { const x = i < 3 ? 260 + i * 130 : 1080 + (i - 3) * 130, j = Math.abs(Math.sin(t * 6 + i)) * 30 * seg(c1, 0.6, 0.9); const v = F({ ...VANARA, skin: ['#a8743e', '#8a5a30', '#c08a4a'][i % 3] }, { x, s: 0.95, face: i < 3 ? 1 : -1, t: t + i, pose: crown > 0.9 ? P.raise : P.stand, mouth: 'smile' }); onGround(v, 780 - j); draw(g, v); }
  if (crown > 0.9) petals(g, t, 33, 40);
  g.restore();
  g.restore();
};

/* ═════════ 17: Vibhishana heeds and is crowned ═════════ */
export const vibhishana: Scene = (g, b) => {
  const t = b.t, [c0, c1] = b.c;
  night(g);
  g.save(); cam(g, [{ p: 0, x: 760, y: 470, z: 1.15 }, { p: 0.5, x: 760, y: 460, z: 1.05 }, { p: 0.65, x: 800, y: 450, z: 1 }, { p: 1, x: 800, y: 450, z: 0.98 }], b.p);
  sky(g, t, 37); moon(g, 1350, 130, 46);
  palace(g, 800, 700, 0.95, 'lanka', t);
  floor(g, 780, C.maroon);
  const crowned = io(seg(c1, 0.05, 0.4));
  if (crowned < 1) {
    g.save(); g.globalAlpha = 1 - crowned;
    // a quiet counsel by lamplight
    diya(g, 760, 770, 1.3, t);
    const vb = F(VIBHISHANA, { x: 620, s: 1.2, t, pose: { ...P.sit, fa: [0.8, 1.6], head: 0.15 }, crown: 'small', eye: c0 > 0.5 ? 'open' : 'down' }); onGround(vb, 780); draw(g, vb);
    const hf = H({ x: 900, s: 1.15, face: -1, t, pose: { ...P.sit, fa: [1.5, 0.9] }, mouth: Math.sin(t * 8) > 0 ? 'open' : 'smile' }); onGround(hf, 780); draw(g, hf);
    for (let i = 0; i < 6; i++) { const ph = (t * 0.5 + i / 6) % 1; devText(g, 'राम', lerp(850, 680, ph), 560 - Math.sin(ph * Math.PI) * 60, 22, `rgba(244,181,28,${Math.sin(ph * Math.PI)})`); }
    g.restore();
  }
  if (crowned > 0) {
    g.save(); g.globalAlpha = crowned;
    glory(g, 800, 470, 60, 260, t, 28, [C.gold, C.cream]);
    const vb = F(VIBHISHANA, { x: 800, s: 1.35, t, pose: P.namaste, mouth: 'smile', glow: 1 }); onGround(vb, 780); draw(g, vb);
    const rm = F(RAMA, { x: 560, s: 1.25, t, pose: { ...P.stand, fa: [2.0, 0.6] }, b: { k: 'bow' }, mouth: 'smile' }); onGround(rm, 780); draw(g, rm);
    const hf = H({ x: 1040, s: 1.15, face: -1, t, pose: P.namaste, mouth: 'smile' }); onGround(hf, 780); draw(g, hf);
    // the world knows: rings of light spreading, drums
    const k = seg(c1, 0.4, 1);
    for (let i = 0; i < 3; i++) { const r = ((k + i / 3) % 1) * 900; g.globalAlpha = (1 - ((k + i / 3) % 1)) * 0.6 * crowned; circle(g, 800, 400, r, null, C.gold, 4); }
    g.restore();
  }
  g.restore();
};

/* ═════════ 18: the sun taken for a sweet fruit ═════════ */
export const sunScene: Scene = (g, b) => {
  const t = b.t, [c0, c1] = b.c;
  const gulp = io(seg(c1, 0.15, 0.5)), dark = io(seg(c1, 0.3, 0.7));
  daySky(g, C.peach, C.blush);
  if (dark > 0) { g.fillStyle = `rgba(16,24,69,${dark * 0.9})`; g.fillRect(0, 0, PW, PH); }
  g.save(); cam(g, [{ p: 0, x: 400, y: 600, z: 1.3 }, { p: 0.3, x: 600, y: 480, z: 1 }, { p: 0.55, x: 900, y: 360, z: 1 }, { p: 1, x: 1100, y: 300, z: 1.2 }], b.p);
  if (dark > 0) { g.globalAlpha = dark; nightSky(g, t, 41, 120); g.globalAlpha = 1; }
  for (let i = 0; i < 7; i++) cloud(g, 100 + i * 240, 520 + (i % 3) * 60, 0.9, t, dark > 0.5 ? 'rgba(200,190,240,0.5)' : C.cream);
  // the mountaintop where the child woke
  mountain(g, 300, 900, 500, 260, C.stone, C.earth, 14);
  // the sun: red, round, like a fruit
  const sunX = 1200, sunY = 230;
  if (gulp < 1) { g.save(); g.translate(sunX, sunY); const s = 1 - gulp * 0.9; g.scale(s, s); sunDisc(g, 0, 0, 90, t, true); g.restore(); }
  // the child sees it, wonders, leaps
  const leap = io(seg(c0, 0.35, 1));
  const bx = lerp(300, sunX - 120, leap), by = lerp(640, sunY + 40, leap) - Math.sin(leap * Math.PI) * 120;
  const baby = { ...BABY_HANUMAN, x: bx, y: by, s: 0.9, t, pose: leap > 0 && leap < 1 ? { ...P.fly, root: -0.9, fa: [3.0, 0.1], ba: [2.6, 0.3] } : leap >= 1 ? { ...P.fly, root: -0.3, fa: [2.2, 1.6], ba: [1.8, 1.6] } : { ...P.stand, fa: [2.0, 0.6] }, eye: leap < 0.1 ? 'wide' : 'open', mouth: gulp > 0.5 ? 'calm' : leap < 0.1 ? 'smile' : 'open' } as Fig;
  if (leap <= 0) onGround(baby, 650);
  if (c1 > 0.5) { baby.x = sunX - 120; baby.y = sunY + 40; }
  draw(g, baby);
  if (leap > 0 && leap < 1) speed(g, bx - 80, by - 40, 200, 5, t);
  // cheeks full of sun: a glow from his face, and the stars come out
  if (gulp > 0.5) { g.save(); g.globalAlpha = gulp; const r = g.createRadialGradient(sunX - 80, sunY - 30, 5, sunX - 80, sunY - 30, 140); r.addColorStop(0, 'rgba(255,190,60,0.9)'); r.addColorStop(1, 'rgba(255,190,60,0)'); g.fillStyle = r; g.fillRect(sunX - 240, sunY - 200, 320, 320); g.restore(); }
  g.restore();
  if (c0 > 0 && c0 < 0.4) { g.save(); g.globalAlpha = bump(seg(c0, 0, 0.4)); devText(g, '?', 470, 380, 60, C.vermilion); g.restore(); }
};

/* ═════════ 19: the ring in his mouth, over the ocean ═════════ */
export const leap: Scene = (g, b) => {
  const t = b.t, [c0, c1] = b.c;
  const jump = io(seg(c1, 0, 0.85));
  daySky(g, C.sky, C.peach);
  g.save(); cam(g, [{ p: 0, x: 420, y: 470, z: 1.35 }, { p: 0.45, x: 460, y: 450, z: 1.2 }, { p: 0.55, x: 700, y: 400, z: 1 }, { p: 0.9, x: 2400, y: 420, z: 1 }, { p: 1, x: 2600, y: 430, z: 1.05 }], b.p);
  for (let i = 0; i < 14; i++) cloud(g, i * 260, 150 + (i % 3) * 50, 1, t, C.white);
  ocean(g, 600, 900, t, [C.blue, C.teal, C.navy2]);
  // fish and a makara in the waves
  for (let i = 0; i < 8; i++) { const x = 600 + i * 320 + Math.sin(t + i) * 30, y = 700 + (i % 3) * 50; g.save(); g.translate(x, y); g.scale(i % 2 ? -1 : 1, 1); g.beginPath(); g.ellipse(0, 0, 30, 12, 0, 0, 7); fs(g, [C.gold, C.coral, C.lime][i % 3], C.ink, 2); g.beginPath(); g.moveTo(-28, 0); g.lineTo(-44, -12); g.lineTo(-44, 12); g.closePath(); fs(g, [C.gold, C.coral, C.lime][i % 3], C.ink, 2); circle(g, 16, -3, 3, C.ink); g.restore(); }
  // the near shore and the far shore of Lanka
  mountain(g, 360, 760, 560, 260, C.stone, C.earth, 15);
  g.save(); g.beginPath(); g.ellipse(2600, 790, 620, 110, 0, Math.PI, 0); fs(g, C.green, C.ink, 3); g.restore();
  palace(g, 2700, 700, 0.6, 'lanka', t);
  // Hanuman places the ring in his mouth, crouches, leaps
  const crouch = io(seg(c0, 0.5, 1));
  const hx = lerp(380, 2380, jump), hy0 = 520, hy = lerp(hy0, 640, jump) - Math.sin(jump * Math.PI) * 330;
  const hf = H({ x: hx, y: hy, s: 1.15, t, pose: jump > 0 && jump < 1 ? P.fly : c0 < 0.5 ? { ...P.stand, fa: [2.3, 1.9] } : mix(P.stand, { ...P.kneel, namaste: false, fa: [0.9, 0.6], ba: [-0.6, 0.4] }, crouch), f: c0 < 0.5 ? { k: 'ring', glow: 1 } : undefined, mouth: c0 > 0.45 ? 'calm' : 'smile', wind: 2 });
  if (jump <= 0 || jump >= 1) onGround(hf, jump >= 1 ? 720 : 520);
  draw(g, hf);
  if (c0 > 0.45) { g.fillStyle = C.fire2; g.globalAlpha = 0.6 + 0.4 * Math.sin(t * 10); star4(g, hf.x + (jump > 0 && jump < 1 ? 40 : 34) * 1.15, hf.y - (jump > 0 && jump < 1 ? 120 : 132) * 1.15, 9); g.globalAlpha = 1; }
  if (jump > 0 && jump < 1) speed(g, hx - 80, hy - 40, 300, 6, t);
  g.restore();
};

/* ═════════ 20: every hard task made easy ═════════ */
export const pathScene: Scene = (g, b) => {
  const t = b.t, [c0, c1] = b.c;
  const ease = io(seg(c1, 0, 0.6));
  daySky(g, C.gold, C.peach);
  g.save(); cam(g, [{ p: 0, x: 800, y: 470, z: 1.05 }, { p: 1, x: 800, y: 450, z: 1 }], b.p);
  for (let i = 0; i < 6; i++) cloud(g, 100 + i * 280, 120, 0.9, t, C.cream);
  // the path: jagged rocks and thorns melt into a lotus-paved road
  const y0 = 700;
  g.beginPath(); g.moveTo(-100, PH + 100); g.lineTo(-100, y0);
  for (let x = -100; x <= PW + 100; x += 80) { const jag = (x / 80) % 2 ? 1 : -1; g.lineTo(x, y0 - (1 - ease) * (120 + jag * 80)); }
  g.lineTo(PW + 100, PH + 100); g.closePath(); fs(g, ease > 0.5 ? C.stone : '#6a5a4a', C.ink, 3);
  // thorny crags
  if (ease < 1) { g.save(); g.globalAlpha = 1 - ease; for (let i = 0; i < 9; i++) { const x = 100 + i * 170; g.beginPath(); g.moveTo(x - 60, y0); g.lineTo(x - 20, y0 - 260 - (i % 2) * 80); g.lineTo(x + 10, y0 - 200); g.lineTo(x + 50, y0 - 300 + (i % 3) * 40); g.lineTo(x + 80, y0); g.closePath(); fs(g, '#4a3a4a', C.ink, 3); for (let k = 0; k < 4; k++) line(g, [[x + k * 12 - 20, y0 - 100 - k * 30], [x + k * 12 - 34, y0 - 112 - k * 30]], C.ink, 2); } g.restore(); }
  // lotus paving
  if (ease > 0) for (let i = 0; i < 12; i++) { g.globalAlpha = ease; lotus(g, 80 + i * 130, y0 + 40, 0.6, ease, C.pink, C.rani); g.globalAlpha = 1; }
  // Hanuman's grace from above
  if (c1 > 0) { g.save(); g.globalAlpha = io(seg(c1, 0, 0.3)); glory(g, 800, 120, 40, 160, t, 24, [C.gold, C.cream]); const hf = H({ x: 800, y: 210, s: 0.75, t, pose: P.bless, mouth: 'smile', glow: 1 }); draw(g, hf); const gr = g.createLinearGradient(800, 200, 800, 700); gr.addColorStop(0, 'rgba(255,214,90,0.5)'); gr.addColorStop(1, 'rgba(255,214,90,0)'); g.fillStyle = gr; g.beginPath(); g.moveTo(760, 220); g.lineTo(200, 720); g.lineTo(1400, 720); g.lineTo(840, 220); g.closePath(); g.fill(); g.restore(); }
  // travellers: stuck, then walking freely
  for (let i = 0; i < 4; i++) {
    const L = [VILLAGER(3), WOMAN(2), VILLAGER(5), CHILD(1)][i];
    const x = ease < 0.5 ? 140 + i * 70 : lerp(140 + i * 70, 1100 + i * 90, seg(c1, 0.5, 1));
    const f = F(L, { x, s: i === 3 ? 0.7 : 0.95, t: t + i, pose: ease < 0.5 ? { ...P.stand, head: 0.3, fa: [0.5, 1.6] } : walk(t * 6 + i), eye: ease < 0.5 ? 'down' : 'open', mouth: ease < 0.5 ? 'calm' : 'smile' });
    onGround(f, y0 + 20); draw(g, f);
  }
  g.restore();
  void c0;
};

/* ═════════ 21: the keeper of Rama's door ═════════ */
export const door: Scene = (g, b) => {
  const t = b.t, [c0, c1] = b.c;
  const open = io(seg(c1, 0.25, 0.75));
  g.fillStyle = floretP(g, C.maroon, 'rgba(244,181,28,0.3)', 30); g.fillRect(0, 0, PW, PH);
  g.save(); cam(g, [{ p: 0, x: 800, y: 440, z: 1 }, { p: 0.6, x: 800, y: 440, z: 1.02 }, { p: 1, x: 800, y: 420, z: 1.3 }], b.p);
  // the gateway
  pillar(g, 360, 800, 620, 50); pillar(g, 1240, 800, 620, 50);
  archPath(g, 800, 800, 760, 760, 7); fs(g, C.gold, C.ink, 4);
  archPath(g, 800, 800, 700, 720, 7); fs(g, C.vermilion, C.ink, 2);
  // inside: Rama's light
  g.save(); archPath(g, 800, 800, 660, 690, 7); g.clip();
  g.fillStyle = C.cream; g.fillRect(400, 0, 800, 900);
  glory(g, 800, 380, 60, 360, t, 36, [C.gold, C.cream]);
  const rm = F(RAMA, { x: 800, s: 1.1, t, pose: P.bless, b: { k: 'bow' }, mouth: 'smile', glow: 1 }); onGround(rm, 790); draw(g, rm);
  // the two door leaves
  for (const sd of [-1, 1]) { g.save(); g.translate(800 + sd * 330, 0); g.scale(1 - open * 0.92, 1); g.beginPath(); g.rect(sd > 0 ? -330 : 0, 0, 330, 800); fs(g, floretP(g, '#8a4a24', C.gold, 30), C.ink, 4); for (let i = 0; i < 5; i++) for (let k = 0; k < 3; k++) circle(g, (sd > 0 ? -280 : 50) + k * 110, 160 + i * 130, 10, C.gold, C.ink, 1.6); g.restore(); }
  g.restore();
  toranLine(g, 440, 1160, 120, t);
  // the guard
  const hf = H({ x: 1300, s: 1.35, face: -1, t, pose: c1 > 0.1 ? { ...P.stand, fa: [1.3, 0.2] } : P.mace, f: c1 > 0.1 ? undefined : { k: 'mace', a: 0.25 }, b: c1 > 0.1 ? { k: 'mace', a: -0.2 } : undefined, mouth: c1 > 0.1 ? 'smile' : 'calm' }); onGround(hf, 800); draw(g, hf);
  // a devotee waits, then walks in
  const go = seg(c1, 0.6, 1);
  const dv = F(WOMAN(4), { x: lerp(180, 700, go), s: 1.05, t, pose: go > 0 ? walk(t * 5) : P.namaste, alpha: 1 - seg(go, 0.7, 1) }); onGround(dv, 800); draw(g, dv);
  floor(g, 800);
  g.restore();
  void c0;
};
function toranLine(g: G, x0: number, x1: number, y: number, t: number) {
  line(g, [[x0, y], [x1, y]], C.brown, 3);
  for (let x = x0 + 14; x < x1; x += 28) { g.save(); g.translate(x, y); g.rotate(Math.sin(t * 1.5 + x * 0.1) * 0.08); g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(10, 22, 0, 44); g.quadraticCurveTo(-10, 22, 0, 0); fs(g, C.leaf, C.ink, 1.4); g.restore(); }
}

/* ═════════ 22: refuge — no fear ═════════ */
export const refuge: Scene = (g, b) => {
  const t = b.t, [c0, c1] = b.c;
  night(g);
  g.save(); cam(g, [{ p: 0, x: 800, y: 470, z: 1 }, { p: 1, x: 800, y: 470, z: 1.08 }], b.p);
  sky(g, t, 43);
  hills(g, 700, [C.indigo, C.navy2]);
  floor(g, 790, '#2c2450', 'rgba(205,189,240,0.25)');
  // shadows with yellow eyes circle in the dark, then fade
  const fade = io(seg(c1, 0.1, 0.7));
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + t * 0.3, x = 800 + Math.cos(a) * 560, y = 560 + Math.sin(a) * 200;
    g.save(); g.globalAlpha = (1 - fade) * 0.9; g.translate(x + (fade * (x - 800)), y);
    g.fillStyle = '#0c0a1e'; g.beginPath(); g.ellipse(0, 0, 70, 46, 0, 0, 7); g.fill(); g.beginPath(); g.moveTo(-50, -20); g.lineTo(-40, -60); g.lineTo(-20, -30); g.moveTo(20, -30); g.lineTo(40, -60); g.lineTo(50, -20); g.fill();
    circle(g, -16, -8, 6, C.fire2); circle(g, 16, -8, 6, C.fire2); g.restore();
  }
  // Hanuman spreads his scarf like a canopy; people gather in its warmth
  const spread = io(seg(c0, 0.3, 0.9));
  const r = g.createRadialGradient(800, 560, 30, 800, 560, 420); r.addColorStop(0, `rgba(255,200,90,${0.55 * spread})`); r.addColorStop(1, 'rgba(255,200,90,0)'); g.fillStyle = r; g.fillRect(300, 120, 1000, 800);
  g.beginPath(); g.moveTo(800 - 420 * spread, 470); g.quadraticCurveTo(800, 470 - 260 * spread, 800 + 420 * spread, 470); g.quadraticCurveTo(800, 470 - 160 * spread, 800 - 420 * spread, 470); fs(g, floretP(g, C.gold, C.vermilion, 20), C.ink, 2.4);
  const hf = H({ x: 800, s: 1.35, t, pose: { ...P.raise, fa: [2.5, 0.2], ba: [-2.4, 0.2] }, mouth: 'smile', glow: 0.8 }); onGround(hf, 790); draw(g, hf);
  const people = [[520, VILLAGER(1)], [620, WOMAN(3)], [980, WOMAN(1)], [1080, VILLAGER(4)], [700, CHILD(0)], [900, CHILD(2)]] as [number, object][];
  people.forEach(([x, L], i) => {
    const run = io(seg(c0, i * 0.08, 0.5 + i * 0.08)), sx = x < 800 ? x - 400 : x + 400;
    const child = i >= 4;
    const play = c1 > 0.5 && child;
    const f = F(L, { x: lerp(sx, x, run), s: child ? 0.7 : 0.95, face: x < 800 ? 1 : -1, t: t + i, pose: run < 1 ? walk(t * 9 + i, { lean: 0.2 }) : play ? { ...P.raise, fa: [2.6, 0.4], ba: [-2.2, 0.3] } : P.namaste, eye: c1 > 0.3 ? 'open' : 'wide', mouth: c1 > 0.3 ? 'smile' : 'calm' });
    onGround(f, 790 - (play ? Math.abs(Math.sin(t * 6 + i)) * 26 : 0)); draw(g, f);
  });
  g.restore();
};

/* ═════════ 23: his power; the three worlds tremble at his roar ═════════ */
export const roar: Scene = (g, b) => {
  const t = b.t, [c0, c1] = b.c;
  const hold = io(seg(c0, 0, 1)), boom = seg(c1, 0.15, 0.5), quake = c1 > 0.15 ? Math.max(0, 1 - seg(c1, 0.15, 1)) * 12 : 0;
  night(g);
  g.save(); shake(g, quake, t); cam(g, [{ p: 0, x: 800, y: 430, z: 1.25 }, { p: 0.45, x: 800, y: 430, z: 1.1 }, { p: 0.6, x: 800, y: 450, z: 0.9 }, { p: 1, x: 800, y: 450, z: 0.92 }], b.p);
  // three bands: heaven, earth, underworld
  daySkyBand(g, -200, 260, C.sky, C.white);
  for (let i = 0; i < 6; i++) cloud(g, i * 300, 120 + (i % 2) * 40 + Math.sin(t * 20 * (quake / 12) + i) * quake, 0.9, t, C.white);
  palace(g, 1300, 250, 0.35, 'ayodhya', t);
  g.fillStyle = C.leaf; g.fillRect(-400, 260, PW + 800, 380);
  hills(g, 560, [C.green, C.olive]);
  for (let i = 0; i < 5; i++) tree(g, 140 + i * 330, 560 + Math.sin(t * 30 + i) * quake * 0.5, 0.8, i % 2 ? 'mango' : 'kadamba', t * (1 + quake), i);
  g.fillStyle = C.indigo; g.fillRect(-400, 640, PW + 800, 600);
  for (let i = 0; i < 5; i++) { g.save(); g.translate(150 + i * 320 + Math.sin(t * 25 + i) * quake, 760); g.beginPath(); g.moveTo(0, 60); g.bezierCurveTo(-30, 20, -26, -16, 0, -30); g.bezierCurveTo(26, -16, 30, 20, 0, 60); fs(g, C.teal, C.ink, 2); circle(g, -6, -14, 3, C.white); circle(g, 6, -14, 3, C.white); g.restore(); }
  // Hanuman gathers his power, then roars
  glory(g, 800, 380, 60 + hold * 40, 200 + hold * 120 + boom * 200, t * (1 + hold), 36, [C.gold, C.vermilion]);
  const hf = H({ x: 800, s: 1.6, t, pose: c1 > 0.15 ? { ...P.raise, fa: [2.0, 0.6], ba: [-2.0, 0.6], lean: -0.1, head: -0.3 } : { ...P.stand, fa: [0.7, 1.9], ba: [0.5, 1.9] }, mouth: c1 > 0.15 ? 'roar' : 'calm', eye: c1 > 0.15 ? 'wide' : 'closed', glow: 0.5 + hold });
  onGround(hf, 640); draw(g, hf);
  // shock rings
  if (boom > 0) for (let i = 0; i < 4; i++) { const k = ((t * 0.8 + i / 4) % 1); g.globalAlpha = (1 - k) * 0.8; circle(g, 830, 270, k * 1100, null, i % 2 ? C.fire2 : C.white, 8 - i); }
  g.globalAlpha = 1;
  g.restore();
};
function daySkyBand(g: G, y0: number, y1: number, top: string, bot: string) { const gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, top); gr.addColorStop(1, bot); g.fillStyle = gr; g.fillRect(-400, y0 - 400, PW + 800, y1 - y0 + 400); }

/* ═════════ 24: ghosts flee at the name ═════════ */
export const ghosts: Scene = (g, b) => {
  const t = b.t, [c0, c1] = b.c;
  const flee = io(seg(c1, 0.25, 0.9));
  night(g);
  g.save(); cam(g, [{ p: 0, x: 800, y: 450, z: 1.05 }, { p: 1, x: 800, y: 460, z: 1 }], b.p);
  sky(g, t, 47); moon(g, 260, 140, 46);
  // a peepal tree at night
  tree(g, 1180, 780, 1.6, 'peepal', t, 3);
  floor(g, 780, '#231d3e', 'rgba(205,189,240,0.2)');
  // the traveller with a lantern
  const tr = F(VILLAGER(0), { x: 620, s: 1.15, t, pose: c1 > 0.1 ? P.namaste : { ...P.stand, fa: [1.2, 0.6] }, f: c1 > 0.1 ? undefined : { k: 'lamp', a: 0 }, eye: c1 > 0.1 ? 'closed' : 'wide', mouth: c1 > 0.1 ? 'sing' : 'calm' });
  onGround(tr, 780); draw(g, tr);
  // the name, shining
  if (c1 > 0.1) { const a = io(seg(c1, 0.1, 0.4)); g.save(); g.globalAlpha = a; glory(g, 620, 280, 40, 140 + a * 40, t, 24, [C.gold, C.cream]); devText(g, 'महावीर', 620, 280, 64, C.vermilion); g.restore(); if (a > 0.5) sparks(g, 620, 280, t, 20, 300 * a); }
  // ghosts gather, then flee in all directions
  const R = rng(51);
  for (let i = 0; i < 9; i++) {
    const a0 = R() * Math.PI * 2, r0 = 260 + R() * 160;
    const gather = io(seg(c0, i * 0.06, 0.6 + i * 0.04));
    const cx = 620 + Math.cos(a0 + t * 0.4) * lerp(r0 * 2, r0, gather), cy = 520 + Math.sin(a0 + t * 0.4) * lerp(r0, r0 * 0.5, gather);
    const fx = cx + Math.cos(a0) * flee * 1400, fy = cy + Math.sin(a0) * flee * 700 - flee * 200;
    ghost(g, fx, fy, 0.9 + R() * 0.5, t + i, ['#c9d8ee', '#d8c9ee', '#bfe3d9'][i % 3], flee > 0 ? 1 : 0, i % 3 === 1);
  }
  g.restore();
};

/* ═════════ 25: disease and pain removed by his name ═════════ */
export const healing: Scene = (g, b) => {
  const t = b.t, [c0, c1] = b.c;
  const well = io(seg(c1, 0.1, 0.9));
  g.fillStyle = floretP(g, '#e8c9a0', 'rgba(167,48,111,0.18)', 30); g.fillRect(0, 0, PW, PH);
  if (well < 1) { g.fillStyle = `rgba(60,50,80,${0.45 * (1 - well)})`; g.fillRect(0, 0, PW, PH); }
  g.save(); cam(g, [{ p: 0, x: 760, y: 500, z: 1.1 }, { p: 1, x: 800, y: 470, z: 1 }], b.p);
  // a room: window, lamp, a cot
  archPath(g, 1250, 520, 220, 300, 5); fs(g, C.navy, C.ink, 3); moon(g, 1260, 330, 30);
  floor(g, 790, C.maroon);
  g.beginPath(); g.rect(360, 640, 520, 40); fs(g, floretP(g, C.cream, C.rani, 20), C.ink, 2.4);
  for (const x of [380, 840]) { g.beginPath(); g.rect(x, 680, 24, 110); fs(g, C.brown, C.ink, 2); }
  // the patient: lying, then sitting up well
  const pt = F(VILLAGER(2), { x: lerp(560, 600, well), s: 1.05, t, crown: 'none', hairStyle: 'short', pose: { root: lerp(-Math.PI / 2, 0, well), ...(well > 0.5 ? P.sitNamaste : { fa: [0.2, 0.3], ba: [0, 0.2], fl: [0.05, 0.05], bl: [0, 0.05] }), legs: well > 0.5 ? 'lotus' : 'legs' }, eye: well > 0.4 ? 'open' : 'closed', mouth: well > 0.5 ? 'smile' : 'calm', skin: well > 0.5 ? '#c98856' : '#a59a8a' });
  if (well > 0.5) onGround(pt, 640); else { pt.x = 500; pt.y = 620; }
  draw(g, pt);
  // pain: dark red knots that untie into petals
  for (let i = 0; i < 6; i++) { const x = 480 + i * 60, y = 560 - (i % 2) * 40; const k = seg(c1, i * 0.1, 0.4 + i * 0.1); if (k < 1) { g.save(); g.globalAlpha = 1 - k; curl(g, x, y, 22, 1.5, i % 2 ? 1 : -1, t * 2 + i); g.strokeStyle = '#8a2a3a'; g.lineWidth = 5; g.stroke(); g.restore(); } if (k > 0) { g.save(); g.globalAlpha = Math.sin(k * Math.PI); g.translate(x, y - k * 160); g.rotate(t); g.fillStyle = [C.pink, C.marigold][i % 2]; g.beginPath(); g.ellipse(0, 0, 9, 4, 0, 0, 7); g.fill(); g.restore(); } }
  // the family chanting with a mala
  const fam = F(WOMAN(1), { x: 1020, s: 1.05, face: -1, t, pose: { ...P.sit, fa: [1.2, 1.5] }, f: { k: 'mala' }, eye: 'closed', mouth: Math.sin(t * 7) > 0 ? 'sing' : 'calm' }); onGround(fam, 790); draw(g, fam);
  const kid = F(CHILD(2), { x: 1140, s: 0.75, face: -1, t, pose: P.sitNamaste, eye: 'closed', mouth: 'sing' }); onGround(kid, 790); draw(g, kid);
  for (let i = 0; i < 5; i++) { const ph = (t * 0.4 + i / 5) % 1; devText(g, i % 2 ? 'हनुमत' : 'वीर', lerp(980, 720, ph), 520 - Math.sin(ph * Math.PI) * 120, 26, `rgba(167,48,111,${Math.sin(ph * Math.PI)})`); }
  diya(g, 940, 790, 1.2, t);
  // a small Hanuman in the window, blessing
  if (c1 > 0) { g.save(); g.globalAlpha = io(seg(c1, 0, 0.4)); const hf = H({ x: 1250, s: 0.55, t, pose: P.bless, mouth: 'smile', glow: 1 }); onGround(hf, 515); draw(g, hf); g.restore(); }
  g.restore();
  void c0;
};

export const SCENES_B: Record<string, Scene> = { sanjeevani, praise, shesha: sheshaScene, chorus, guardians, sugriva, vibhishana, sun: sunScene, leap, path: pathScene, door, refuge, roar, ghosts, healing };
void [ellipse, clamp, bump, mountain, flame, star4, poly, stroke2, water, halo, HANUMAN, LAKSHMANA, RAKSHASA, twinkle, mix];
