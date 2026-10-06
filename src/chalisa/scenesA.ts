/**
 * Scenes for the opening: the title, the two invocation dohas and chaupais
 * 1–10 — who Hanuman is, and what he did in Lanka.
 */
import { C, type G, PW, PH, cam, circle, ellipse, line, fs, clamp, seg, io, out, lerp, bump, rng, glory, cloud, ocean, lotus, lotusPond, petals, mountain, hills, tree, flame, diya, sunDisc, palace, star4, curl, devText, curtains, smooth, poly, archPath, floretP, sparks, nightSky, daySky, stroke2, frame } from './kit';
import { draw, onGround, P, mix, walk, HANUMAN, RAMA, LAKSHMANA, SITA_GROVE, ANJANI, KESARI, SHIVA, SAGE, VILLAGER, WOMAN, RAKSHASA, RAKSHASA2, BABY_HANUMAN, TULSI, vayu, sparkle, type Fig } from './figures';
import { type Beat, type Scene, H, F, shrine, floor, night, heartLotus, speed, twinkle, pillar } from './stage';

const sky = (g: G, t: number, seed = 1) => nightSky(g, t, seed, 80);

/* ═════════ title ═════════ */
export const title: Scene = (g, b) => {
  const t = b.t, o = io(seg(t, 1.2, 4.5));
  night(g);
  g.save(); cam(g, [{ p: 0, x: 800, y: 450, z: 1.12 }, { p: 1, x: 800, y: 450, z: 1 }], clamp(t / 9));
  glory(g, 800, 380, 120, 330, t, 36, [C.gold, C.marigold]);
  shrine(g, 800, 760, 360, 560, floretP(g, C.blush, 'rgba(214,58,40,0.25)', 24), t);
  floor(g, 760);
  const hf = H({ x: 800, s: 1.55, t, pose: mix(P.stand, P.mace, 0.5), f: { k: 'mace', a: 0.25 }, glow: 0.8, mouth: 'smile' });
  onGround(hf, 760); draw(g, hf);
  for (let i = 0; i < 6; i++) diya(g, 520 + i * 112, 790, 0.9, t + i);
  g.restore();
  // the title fades in on a cream scroll
  const a = seg(t, 3.2, 5);
  g.save(); g.globalAlpha = a;
  g.fillStyle = 'rgba(16,24,69,0.78)'; g.fillRect(0, 40, PW, 150);
  devText(g, 'श्री हनुमान चालीसा', 800, 104, 74, C.gold);
  devText(g, 'गोस्वामी तुलसीदास कृत', 800, 164, 30, C.cream, 'center', '"Noto Serif Devanagari", serif');
  g.restore();
  curtains(g, o, t);
  petals(g, t, 3, 26);
};

/* ═════════ doha 1: the mirror of the mind ═════════ */
function mirror(g: G, x: number, y: number, r: number, clear: number, t: number, inner?: (g: G) => void) {
  // a round hand mirror in a lotus frame
  for (let i = 0; i < 16; i++) { g.save(); g.translate(x, y); g.rotate((i / 16) * Math.PI * 2 + t * 0.1); g.beginPath(); g.ellipse(0, -r - 10, 9, 18, 0, 0, 7); fs(g, i % 2 ? C.gold : C.marigold, C.ink, 1.6); g.restore(); }
  circle(g, x, y, r + 6, C.gold, C.ink, 3);
  g.save(); g.beginPath(); g.arc(x, y, r, 0, 7); g.clip();
  const gr = g.createLinearGradient(x - r, y - r, x + r, y + r); gr.addColorStop(0, '#cfe3ef'); gr.addColorStop(1, '#8fb0c8'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
  if (inner) inner(g);
  // dust and clouds on the glass, wiped away by `clear`
  const R = rng(4);
  for (let i = 0; i < 26; i++) { const px = x + (R() - 0.5) * r * 1.8, py = y + (R() - 0.5) * r * 1.8, rr = 20 + R() * 40; g.fillStyle = `rgba(90,80,90,${0.55 * (1 - clear) * (0.5 + R() * 0.5)})`; g.beginPath(); g.arc(px, py, rr, 0, 7); g.fill(); }
  if (clear > 0.6) { g.globalAlpha = (clear - 0.6) * 2; g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = 6; line(g, [[x - r * 0.5, y - r * 0.2], [x - r * 0.1, y - r * 0.6]], 'rgba(255,255,255,0.8)', 8); line(g, [[x - r * 0.3, y + r * 0.1], [x + r * 0.1, y - r * 0.35]], 'rgba(255,255,255,0.6)', 5); g.globalAlpha = 1; }
  g.restore();
  // handle
  g.beginPath(); g.rect(x - 9, y + r + 4, 18, r * 0.6); fs(g, C.gold, C.ink, 2.4);
  circle(g, x, y + r * 1.62, 12, C.vermilion, C.ink, 2);
}
export const mirrorScene: Scene = (g, b) => {
  const t = b.t, [c0, c1, c2, c3] = b.c;
  night(g);
  g.save(); cam(g, [{ p: 0, x: 780, y: 470, z: 1 }, { p: 0.4, x: 840, y: 460, z: 1.04 }, { p: 0.56, x: 1080, y: 400, z: 1.45 }, { p: 0.82, x: 1080, y: 420, z: 1.3 }, { p: 1, x: 900, y: 450, z: 1.05 }], b.p);
  sky(g, t, 2);
  shrine(g, 470, 760, 380, 520, floretP(g, C.blush, 'rgba(214,58,40,0.22)', 24), t);
  floor(g, 760);
  // the guru, seated, blessing
  const guru = F(SAGE, { x: 470, s: 1.25, t, pose: { ...P.sit, fa: [1.2, 1.2] }, b: { k: 'mala' }, eye: c0 > 0.2 ? 'down' : 'open', glow: 0.5 });
  onGround(guru, 760); draw(g, guru);
  // the disciple bows, gathers pollen, then sits up with the mirror
  const bow = bump(seg(c0, 0.05, 0.85));
  const dis = F(TULSI, { x: 760, s: 1.15, face: -1, t, head: 'man', beard: undefined, hair: '#1a1530', hairStyle: 'short', skin: '#d9a070', pose: { ...P.kneelOpen, lean: 0.15 + bow * 0.75, fa: [1.2 + bow * 0.4, 0.3], ba: [1.0, 0.6] }, eye: c1 > 0 ? 'open' : 'down' });
  onGround(dis, 760); draw(g, dis);
  // pollen rising from the lotus feet
  if (c0 > 0 && c1 < 1) { const R = rng(9); for (let i = 0; i < 40; i++) { const ph = (t * 0.6 + R()) % 1, x = lerp(560, 700, ph) + Math.sin(i + t * 3) * 10, y = 740 - ph * 80 - R() * 40; g.globalAlpha = (1 - ph) * seg(c0, 0, 0.3); circle(g, x, y, 2 + R() * 2.5, C.fire2); } g.globalAlpha = 1; }
  // the mirror
  const mx = 1080, my = 400, appear = seg(c0, 0.7, 1) + c1;
  if (appear > 0) {
    g.save(); g.globalAlpha = clamp(appear);
    const clear = io(c1);
    mirror(g, mx, my, 150, clear, t, (gg) => {
      if (c2 > 0) {
        gg.save(); gg.globalAlpha = io(c2);
        glory(gg, mx, my + 10, 40, 160, t, 24, [C.gold, C.cream]);
        const r = F(RAMA, { x: mx, s: 0.95, t, pose: P.bless, b: { k: 'bow' }, mouth: 'smile' }); onGround(r, my + 140); draw(gg, r);
        gg.restore();
      }
    });
    // the polishing hand: a cloth moving in circles
    if (c1 > 0 && c1 < 1) { const a = t * 4; ellipse(g, mx + Math.cos(a) * 70, my + Math.sin(a) * 60, 34, 22, a, C.white, C.ink, 2); }
    g.restore();
  }
  // four fruits of life orbit and settle
  if (c3 > 0) {
    const cols = [C.gold, C.vermilion, C.lime, C.marigold];
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + t * 0.8 * (1 - c3), r = lerp(230, 0, io(seg(c3, 0.4, 1)));
      const x = lerp(mx + Math.cos(a) * 220, 980 + i * 70, io(seg(c3, 0.4, 1))), y = lerp(my + Math.sin(a) * 200, 640, io(seg(c3, 0.4, 1)));
      g.globalAlpha = seg(c3, 0, 0.2); ellipse(g, x, y, 22, 26, 0, cols[i], C.ink, 2.4); line(g, [[x, y - 26], [x + 6, y - 40]], C.brown, 3); g.beginPath(); g.ellipse(x + 12, y - 38, 10, 5, -0.4, 0, 7); fs(g, C.green, C.ink, 1.4); circle(g, x - 8, y - 8, 5, 'rgba(255,255,255,0.5)'); void r;
    }
    g.globalAlpha = 1;
    if (c3 > 0.5) { g.beginPath(); g.ellipse(1085, 670, 170, 26, 0, 0, Math.PI); fs(g, C.gold, C.ink, 2.4); }
  }
  g.restore();
  if (c3 > 0.3) petals(g, t, 12, 30);
};

/* ═════════ doha 2: the son of the wind ═════════ */
export const windScene: Scene = (g, b) => {
  const t = b.t, [, c1, c2, c3] = b.c;
  night(g);
  g.save(); cam(g, [{ p: 0, x: 520, y: 520, z: 1.35 }, { p: 0.3, x: 760, y: 470, z: 1.05 }, { p: 1, x: 800, y: 450, z: 1 }], b.p);
  sky(g, t, 5);
  hills(g, 700, [C.indigo, C.navy2]);
  // the storm of sorrows over the devotee
  const storm = 1 - io(seg(c3, 0.1, 0.9));
  if (storm > 0) {
    g.save(); g.globalAlpha = storm; g.translate(-io(c3) * 500, 0);
    for (let i = 0; i < 6; i++) { g.fillStyle = i % 2 ? '#3a3550' : '#2a2640'; g.beginPath(); g.ellipse(330 + i * 60, 230 + Math.sin(t + i) * 8, 90, 50, 0, 0, 7); g.fill(); }
    for (let i = 0; i < 5; i++) { cloud(g, 300 + i * 70, 240, 0.5, t, 'rgba(110,100,140,0.9)'); }
    if (Math.sin(t * 7) > 0.92) line(g, [[420, 280], [400, 340], [430, 360], [405, 430]], C.fire2, 4);
    g.restore();
  }
  // the devotee by a small lamp
  const lift = io(c3);
  const dv = F(VILLAGER(2), { x: 470, s: 1.15, t, crown: 'none', hairStyle: 'short', pose: { ...(c3 > 0.2 ? P.sitNamaste : P.sit), head: lerp(0.35, -0.08, lift), fa: [0.3, 1.2], ba: [-0.2, 1.0] }, eye: lift > 0.3 ? 'up' : 'down', glow: seg(c2, 0, 1) * 0.9 });
  onGround(dv, 760); draw(g, dv);
  diya(g, 600, 770, 1.1 + c2 * 0.6, t);
  // the wind arrives and Hanuman stands in it
  if (c1 > 0) {
    const wx = lerp(1800, 1080, io(seg(c1, 0, 0.6)));
    g.save(); g.globalAlpha = 1 - seg(c1, 0.7, 1) * 0.5; vayu(g, wx, 420, 1.6, t); g.restore();
    const ap = io(seg(c1, 0.4, 1));
    if (ap > 0) {
      g.save(); g.globalAlpha = ap;
      glory(g, 1080, 440, 70, 230, t, 28, [C.gold, C.cream]);
      const hf = H({ x: 1080, s: 1.4 * lerp(0.85, 1, ap), t, pose: c2 > 0 ? mix(P.stand, P.bless, io(seg(c2, 0, 0.3))) : P.stand, f: c2 > 0 ? undefined : { k: 'mace', a: 0.15 }, mouth: 'smile', glow: 1, wind: 2 });
      onGround(hf, 770); draw(g, hf);
      g.restore();
    }
  }
  // three gifts: strength (the mace), understanding (the lamp), learning (the book)
  if (c2 > 0) {
    const items = ['mace', 'lamp', 'book'];
    items.forEach((k, i) => {
      const u = io(seg(c2, i * 0.22, i * 0.22 + 0.5));
      if (u <= 0) return;
      const x = lerp(1060, 520, u), y = lerp(560, 600, u) - Math.sin(u * Math.PI) * 220;
      g.save(); g.globalAlpha = 1 - seg(u, 0.85, 1);
      glory(g, x, y, 20, 60, t, 16, [C.gold, C.cream]);
      g.translate(x, y); g.scale(0.7, 0.7);
      if (k === 'mace') { g.translate(0, 60); line(g, [[0, 30], [0, -60]], C.ink, 9); line(g, [[0, 30], [0, -60]], C.gold, 5); ellipse(g, 0, -86, 24, 30, 0, C.gold, C.ink, 2.4); line(g, [[-23, -86], [23, -86]], C.vermilion, 4); }
      else if (k === 'lamp') { diya(g, 0, 10, 1.6, t); }
      else { g.beginPath(); g.rect(-44, -14, 88, 22); fs(g, '#e7c98c', C.ink, 2); line(g, [[-20, -14], [-20, 8]], C.vermilion, 3); line(g, [[20, -14], [20, 8]], C.vermilion, 3); }
      g.restore();
    });
  }
  g.restore();
  if (c3 > 0.4) petals(g, t, 22, 22, [C.gold, C.white]);
};

/* ═════════ chaupai 1: ocean of wisdom, light of three worlds ═════════ */
export const oceanScene: Scene = (g, b) => {
  const t = b.t, [c0, c1] = b.c;
  void c0;
  night(g);
  g.save(); cam(g, [{ p: 0, x: 800, y: 640, z: 1.6 }, { p: 0.35, x: 800, y: 460, z: 1.05 }, { p: 0.55, x: 860, y: 450, z: 1 }, { p: 1, x: 880, y: 450, z: 1 }], b.p);
  sky(g, t, 7);
  const gl = io(seg(c0, 0.2, 1));
  glory(g, 620, 420, 100, 330 + gl * 60, t, 40, [C.gold, C.cream]);
  ocean(g, 600, 900, t, [C.navy2, C.teal, C.peacock]);
  // jewels on the ocean of virtues
  const R = rng(17);
  for (let i = 0; i < 30; i++) { const x = R() * PW, y = 640 + R() * 250; g.fillStyle = [C.vermilion, C.gold, C.white, C.lime][i % 4]; g.globalAlpha = 0.5 + 0.5 * Math.sin(t * 3 + i); star4(g, x, y, 4 + R() * 5); }
  g.globalAlpha = 1;
  // a great lotus to stand on
  lotus(g, 620, 700, 3.2, 1, C.pink, C.rani);
  const hf = H({ x: 620, s: 1.5, t, pose: mix(P.stand, P.raise, io(seg(c1, 0, 0.3)) * 0.8), f: { k: 'mace', a: 0.2 }, glow: 0.6 + gl * 0.6, mouth: 'smile' });
  onGround(hf, 690); draw(g, hf);
  // the three worlds as roundels, lit one after another
  const worlds = [
    { y: 200, k: 'heaven' }, { y: 430, k: 'earth' }, { y: 660, k: 'nether' },
  ];
  worlds.forEach((w, i) => {
    const lit = io(seg(c1, i * 0.25, i * 0.25 + 0.35)), x = 1240;
    // the ray from Hanuman
    if (lit > 0) { g.save(); g.globalAlpha = lit * 0.6; g.fillStyle = C.fire2; g.beginPath(); g.moveTo(650, 360); g.lineTo(x - 120, w.y - 60); g.lineTo(x - 120, w.y + 60); g.closePath(); g.fill(); g.restore(); }
    circle(g, x, w.y, 112, C.gold, C.ink, 3);
    g.save(); g.beginPath(); g.arc(x, w.y, 100, 0, 7); g.clip();
    g.fillStyle = w.k === 'heaven' ? C.sky : w.k === 'earth' ? C.peach : C.navy; g.fillRect(x - 110, w.y - 110, 220, 220);
    if (w.k === 'heaven') { cloud(g, x - 40, w.y + 40, 0.6, t); cloud(g, x + 40, w.y + 10, 0.5, t); g.save(); g.translate(x, w.y - 20); palace(g, 0, 30, 0.25, 'ayodhya', t); g.restore(); }
    if (w.k === 'earth') { hills(g, w.y + 30, [C.leaf, C.green]); tree(g, x - 40, w.y + 40, 0.35, 'mango', t, 3); for (let k = 0; k < 3; k++) { g.beginPath(); g.rect(x + 10 + k * 26, w.y + 10, 22, 30); fs(g, C.cream, C.ink, 1.5); g.beginPath(); g.moveTo(x + 8 + k * 26, w.y + 10); g.lineTo(x + 21 + k * 26, w.y - 6); g.lineTo(x + 34 + k * 26, w.y + 10); fs(g, C.vermilion, C.ink, 1.5); } }
    if (w.k === 'nether') { for (let k = 0; k < 3; k++) { g.save(); g.translate(x - 50 + k * 50, w.y + 40); g.beginPath(); g.moveTo(0, 40); g.bezierCurveTo(-24, 10, -20, -16, 0, -26); g.bezierCurveTo(20, -16, 24, 10, 0, 40); fs(g, C.teal, C.ink, 2); circle(g, -5, -12, 3, C.white); circle(g, 5, -12, 3, C.white); g.restore(); } }
    // dim until lit
    g.fillStyle = `rgba(10,12,40,${0.7 * (1 - lit)})`; g.fillRect(x - 110, w.y - 110, 220, 220);
    g.restore();
    if (lit > 0.5) sparks(g, x, w.y, t + i, 14, 140 * lit);
  });
  g.restore();
};

/* ═════════ chaupai 2: Rama's messenger; Anjani's son, the Wind's son ═════════ */
export const birthScene: Scene = (g, b) => {
  const t = b.t, [c0, c1] = b.c;
  night(g);
  g.save(); cam(g, [{ p: 0, x: 760, y: 460, z: 1.05 }, { p: 0.45, x: 800, y: 450, z: 1 }, { p: 0.62, x: 2380, y: 450, z: 1 }, { p: 1, x: 2400, y: 470, z: 1.12 }], b.p);
  // left: the court of Rama
  g.fillStyle = floretP(g, C.peach, 'rgba(214,58,40,0.18)', 26); g.fillRect(-400, -400, 2000, 1700);
  shrine(g, 520, 780, 340, 520, floretP(g, C.blush, 'rgba(167,48,111,0.22)', 24), t);
  floor(g, 780, C.maroon);
  const r = F(RAMA, { x: 520, s: 1.35, t, pose: P.bless, b: { k: 'bow' }, mouth: 'smile' }); onGround(r, 780); draw(g, r);
  const rise = io(seg(c0, 0.45, 0.9));
  const hf = H({ x: 900, s: 1.35, face: -1, t, pose: mix(P.kneel, P.mace, rise), f: rise > 0.5 ? { k: 'mace', a: -0.1 } : undefined, glow: rise, mouth: 'smile' });
  onGround(hf, 780); draw(g, hf);
  if (rise > 0.3) sparks(g, 900, 520, t, 18, 220 * rise, C.gold);
  // the gap: a column of clouds
  for (let i = 0; i < 5; i++) cloud(g, 1600, 120 + i * 160, 0.9, t, C.white, i % 2 ? 1 : -1);
  // right: Anjani's mountain at night
  g.save(); g.beginPath(); g.rect(1640, -400, 2000, 1700); g.clip();
  nightSky(g, t, 21, 0); g.translate(0, 0);
  g.fillStyle = 'rgba(0,0,0,0)';
  for (let i = 0; i < 70; i++) { const R = rng(i + 3); g.fillStyle = 'rgba(255,236,170,0.8)'; circle(g, 1640 + R() * 1560, R() * 520, 1.4 + R() * 2, 'rgba(255,236,170,0.8)'); }
  mountain(g, 2400, 860, 1300, 420, C.stone, C.earth, 4);
  g.beginPath(); g.ellipse(2400, 700, 230, 170, 0, Math.PI, 0); g.lineTo(2630, 860); g.lineTo(2170, 860); g.closePath(); fs(g, '#2a1b2a', C.ink, 3);
  const an = F(ANJANI, { x: 2380, s: 1.3, t, pose: { ...P.sit, fa: [1.2, 1.4], ba: [0.6, 1.4], head: 0.25 }, eye: 'down', mouth: 'smile' });
  onGround(an, 830); draw(g, an);
  const baby = { ...BABY_HANUMAN, x: 2420, y: 0, s: 0.55, t, pose: { ...P.sit, fa: [2.2 + Math.sin(t * 3) * 0.3, 0.4], ba: [-0.6, 0.4] }, mouth: 'smile' } as Fig;
  onGround(baby, 800); draw(g, baby);
  // the wind wraps the child
  if (c1 > 0.3) { g.save(); g.globalAlpha = seg(c1, 0.3, 0.7); vayu(g, 2430, 700, 0.9, t * 1.5); g.restore(); }
  g.restore();
  g.restore();
  if (c1 > 0.6) petals(g, t, 31, 20, [C.white, C.lav]);
};

/* ═════════ chaupai 3: limbs like the thunderbolt; dispelling bad thought ═════════ */
export const thunderScene: Scene = (g, b) => {
  const t = b.t, [c0, c1] = b.c;
  night(g);
  g.save(); cam(g, [{ p: 0, x: 800, y: 420, z: 1.15 }, { p: 0.45, x: 800, y: 430, z: 1.05 }, { p: 0.6, x: 800, y: 560, z: 1.08 }, { p: 1, x: 800, y: 520, z: 1 }], b.p);
  g.fillStyle = '#1a1840'; g.fillRect(-400, -400, PW + 800, PH + 800);
  for (let i = 0; i < 5; i++) cloud(g, 200 + i * 300, 120 + (i % 2) * 40, 1, t, 'rgba(140,130,190,0.8)');
  // bolts strike; he is unmoved
  const R = rng(Math.floor(t * 2.2));
  if (c0 > 0 && c1 < 0.3) for (let k = 0; k < 2; k++) { const x = 600 + R() * 400; const pts: number[][] = [[x, -20]]; let y = -20, xx = x; while (y < 420) { y += 40 + R() * 30; xx += (R() - 0.5) * 70; pts.push([xx, y]); } g.globalAlpha = 0.6 + R() * 0.4; line(g, pts, 'rgba(255,210,63,0.35)', 22); line(g, pts, C.fire2, 9); line(g, pts, C.white, 3); g.globalAlpha = 1; }
  mountain(g, 800, 640, 700, 180, '#6a5a7a', '#544468', 5);
  const flash = Math.max(0, Math.sin(t * 9)) ** 8;
  const hf = H({ x: 800, s: 1.5, t, pose: P.mace, f: { k: 'mace', a: 0.2 }, glow: 0.6 + flash, mouth: 'calm' });
  onGround(hf, 560); draw(g, hf);
  if (flash > 0.3) { g.save(); g.globalAlpha = flash * 0.5; g.fillStyle = C.white; g.fillRect(-400, -400, PW + 800, PH + 800); g.restore(); }
  // below: a crowd with smoky thoughts that become lamps
  const people = [0, 1, 2, 3, 4, 5].map((i) => { const L = i % 2 ? WOMAN(i) : VILLAGER(i); return onGround(F(L, { x: 300 + i * 200, s: 1.05, t: t + i, pose: P.stand, face: i < 3 ? 1 : -1, eye: c1 > 0.5 ? 'up' : 'down' }), 900); });
  const crowdIn = io(seg(c1, 0, 0.25));
  g.save(); g.globalAlpha = crowdIn; g.translate(0, (1 - crowdIn) * 120);
  people.forEach((f, i) => {
    draw(g, f);
    const turn = io(seg(c1, 0.2 + i * 0.1, 0.5 + i * 0.1)), hx = f.x, hy = f.y - 210;
    if (turn < 1) { g.save(); g.globalAlpha = 1 - turn; for (let k = 0; k < 3; k++) { g.fillStyle = '#3a3346'; g.beginPath(); g.arc(hx + Math.sin(t * 2 + k + i) * 10 + k * 14 - 14, hy - k * 22, 18 - k * 3, 0, 7); g.fill(); } curl(g, hx, hy - 30, 14, 1.2, 1, t); g.strokeStyle = '#6a6278'; g.lineWidth = 3; g.stroke(); g.restore(); }
    if (turn > 0) { g.save(); g.globalAlpha = turn * crowdIn; flame(g, hx, hy, 0.28, t, i); g.restore(); }
  });
  g.restore();
  g.restore();
};

/* ═════════ chaupai 4: golden, finely dressed, earrings, curling hair ═════════ */
export const portraitScene: Scene = (g, b) => {
  const t = b.t, [c0, c1] = b.c;
  g.fillStyle = floretP(g, C.maroon, 'rgba(244,181,28,0.35)', 30); g.fillRect(0, 0, PW, PH);
  g.save(); cam(g, [{ p: 0, x: 800, y: 560, z: 0.95 }, { p: 0.45, x: 800, y: 520, z: 1.05 }, { p: 0.62, x: 860, y: 300, z: 1.8 }, { p: 1, x: 860, y: 300, z: 1.95 }], b.p);
  archPath(g, 800, 980, 760, 980, 7); fs(g, C.navy, C.ink, 4);
  glory(g, 820, 300, 120, 420, t, 40, [C.gold, C.marigold]);
  const hf = H({ x: 800, s: 3.0, t, pose: { fa: [0.9, 1.5], ba: [-0.2, 0.3], fl: [0.06, 0.04], bl: [-0.07, 0.04] }, f: { k: 'mace', a: 0.2 }, mouth: 'smile', glow: 0.7 });
  hf.y = 850; draw(g, hf);
  // a band of gold light sweeps across him
  const sw = (t * 0.35) % 1.4 - 0.2;
  g.save(); g.globalCompositeOperation = 'overlay'; g.globalAlpha = 0.7 * (1 - c1 * 0.4);
  const gr = g.createLinearGradient(sw * 1600 - 200, 0, sw * 1600 + 200, 900); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(255,240,180,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(-200, -200, 2000, 1300); g.restore();
  // gold dust
  const R = rng(5); for (let i = 0; i < 50; i++) { const x = R() * 1600, y = (R() * 900 - t * 20 * (0.5 + R())) % 900; g.globalAlpha = 0.6; g.fillStyle = C.fire2; star4(g, x, y < 0 ? y + 900 : y, 2 + R() * 4); } g.globalAlpha = 1;
  g.restore();
  void c0;
};

/* ═════════ chaupai 5: thunderbolt and banner; the sacred thread ═════════ */
export const bannerScene: Scene = (g, b) => {
  const t = b.t, [c0, c1] = b.c;
  daySky(g, C.marigold, C.peach);
  g.save(); cam(g, [{ p: 0, x: 800, y: 470, z: 1 }, { p: 0.5, x: 800, y: 440, z: 1.05 }, { p: 0.65, x: 790, y: 330, z: 1.9 }, { p: 1, x: 790, y: 330, z: 2 }], b.p);
  for (let i = 0; i < 6; i++) cloud(g, 120 + i * 280, 130 + (i % 2) * 70, 0.9, t, C.cream);
  hills(g, 640, [C.leaf, C.green, C.olive]);
  mountain(g, 800, 680, 520, 160, C.stone, C.earth, 8);
  const hf = H({ x: 780, s: 1.6, t, pose: { fa: [1.15, 1.3], ba: [-0.6, 2.6], fl: [0.14, 0.04], bl: [-0.12, 0.04] }, f: { k: 'mace', a: 0.15 }, b: { k: 'flag', a: -0.05 }, hl: io(c1), wind: 2.2, mouth: 'smile', glow: 0.5 });
  onGround(hf, 560); draw(g, hf);
  // the vajra's lightning crackles around the mace while the first line is sung
  if (c0 > 0 && c1 < 0.2) { const R = rng(Math.floor(t * 10)); for (let k = 0; k < 3; k++) { const pts: number[][] = []; let x = 900, y = 260; for (let i = 0; i < 5; i++) { pts.push([x, y]); x += (R() - 0.3) * 40; y -= 20 + R() * 20; } line(g, pts, C.fire2, 3); } }
  g.restore();
};

/* ═════════ chaupai 6: Shankara's own, Kesari's joy; the world bows ═════════ */
export const parentsScene: Scene = (g, b) => {
  const t = b.t, [c0, c1] = b.c;
  night(g);
  g.save(); cam(g, [{ p: 0, x: 760, y: 420, z: 1.05 }, { p: 0.5, x: 800, y: 440, z: 1 }, { p: 0.62, x: 800, y: 470, z: 0.95 }, { p: 1, x: 800, y: 470, z: 0.95 }], b.p);
  sky(g, t, 9);
  const second = io(seg(c1, 0, 0.35));
  // Kailash and Shiva in meditation
  g.save(); g.globalAlpha = 1 - second * 0.85;
  g.beginPath(); g.moveTo(80, 760); g.lineTo(330, 260); g.lineTo(420, 330); g.lineTo(520, 220); g.lineTo(760, 760); g.closePath(); fs(g, '#e9eef5', C.ink, 3);
  for (let i = 0; i < 6; i++) line(g, [[200 + i * 50, 600 - i * 40], [260 + i * 40, 640 - i * 30]], '#b9c6d8', 3);
  const sh = F(SHIVA, { x: 420, s: 1.05, t, pose: { ...P.sit, fa: [0.6, 1.0] }, eye: 'closed', b: { k: 'trident', a: 0 } }); onGround(sh, 350); draw(g, sh);
  // a beam of blessing to the child
  const beam = io(seg(c0, 0.1, 0.6));
  if (beam > 0) { g.save(); g.globalAlpha = 0.55 * beam; const gr = g.createLinearGradient(420, 240, 1040, 600); gr.addColorStop(0, 'rgba(200,230,255,1)'); gr.addColorStop(1, 'rgba(255,220,120,0.4)'); g.strokeStyle = gr; g.lineWidth = 40; g.lineCap = 'round'; g.beginPath(); g.moveTo(440, 250); g.quadraticCurveTo(760, 120, lerp(440, 1040, beam), lerp(250, 560, beam)); g.stroke(); g.restore(); }
  // Kesari and Anjani with the child
  floor(g, 780, C.maroon);
  const ke = F(KESARI, { x: 1180, s: 1.3, t, face: -1, pose: { ...P.stand, fa: [1.3, 1.0] }, mouth: 'smile', glow: beam * 0.6 }); onGround(ke, 780); draw(g, ke);
  const an = F(ANJANI, { x: 960, s: 1.25, t, pose: { ...P.stand, fa: [1.4, 1.4], ba: [0.9, 1.4] }, mouth: 'smile' }); onGround(an, 780); draw(g, an);
  const bb = { ...BABY_HANUMAN, x: 1030, y: 0, s: 0.42, t, pose: { ...P.sit, fa: [2.5, 0.3], ba: [-0.5, 0.3] }, mouth: 'smile', glow: beam } as Fig; onGround(bb, 610); draw(g, bb);
  g.restore();
  // second line: Hanuman radiant, the world bowing in waves
  if (second > 0) {
    g.save(); g.globalAlpha = second;
    glory(g, 800, 360, 80, 330, t, 40, [C.gold, C.cream]);
    const hf = H({ x: 800, s: 1.35, t, pose: P.bless, f: undefined, mouth: 'smile', glow: 1.2 }); onGround(hf, 600); draw(g, hf);
    for (let row = 0; row < 2; row++) for (let i = 0; i < 9; i++) {
      const x = 80 + i * 180 + row * 90, wave = io(seg(c1, 0.25 + Math.abs(x - 800) / 3000, 0.6 + Math.abs(x - 800) / 3000));
      const L = (i + row) % 2 ? WOMAN(i + row) : VILLAGER(i + row);
      const f = F(L, { x, s: 0.85, t: t + i, face: x < 800 ? 1 : -1, pose: { ...P.namaste, lean: wave * 0.7 }, eye: 'down' });
      onGround(f, 760 + row * 120); draw(g, f);
    }
    g.restore();
  }
  g.restore();
};

/* ═════════ chaupai 7: learned, clever, eager ═════════ */
export const studentScene: Scene = (g, b) => {
  const t = b.t, [c0, c1] = b.c;
  daySky(g, C.gold, C.blush);
  g.save(); cam(g, [{ p: 0, x: 800, y: 430, z: 1.05 }, { p: 0.5, x: 820, y: 430, z: 1 }, { p: 0.7, x: 900, y: 480, z: 1 }, { p: 1, x: 960, y: 480, z: 1.05 }], b.p);
  for (let i = 0; i < 6; i++) cloud(g, 100 + i * 290, 600 + (i % 2) * 60, 1, t, C.cream);
  const first = 1 - io(seg(c1, 0, 0.3));
  // the sun crosses the sky; he flies before it, facing his teacher, reading
  const sx = lerp(300, 1300, seg(b.p, 0, 0.55));
  g.save(); g.globalAlpha = Math.max(0.15, first);
  sunDisc(g, sx, 220, 110, t, true);
  // letters drift from the sun to the student
  for (let i = 0; i < 8; i++) { const ph = (t * 0.5 + i / 8) % 1; const x = lerp(sx, sx + 300, ph), y = lerp(260, 380, ph); devText(g, ['अ', 'क', 'ॐ', 'ज्ञ', 'श्री', 'र', 'म', 'ध'][i], x, y, 30, `rgba(124,29,46,${1 - ph})`); }
  const hf = H({ x: sx + 330, s: 1.15, face: -1, t, pose: { ...P.fly, root: 1.0, head: -0.8, fa: [1.6, 0.9], ba: [1.2, 1.0] }, f: { k: 'book', a: 0.2 }, eye: 'down', mouth: 'calm', wind: 2 });
  hf.y = 430; draw(g, hf);
  g.restore();
  // second line: he lands before Rama and is off at once
  if (c1 > 0) {
    const a = io(seg(c1, 0, 0.3));
    g.save(); g.globalAlpha = a;
    hills(g, 740, [C.leaf, C.green]);
    const r = F(RAMA, { x: 1280, s: 1.25, face: -1, t, pose: { ...P.stand, fa: [1.6, 0.1] }, b: { k: 'bow' }, mouth: 'smile' }); onGround(r, 760); draw(g, r);
    const dash = io(seg(c1, 0.55, 1));
    const hf2 = H({ x: lerp(1000, 300, dash), s: 1.2, face: dash > 0 ? -1 : 1, t, pose: dash > 0 ? walk(t * 14, { lean: 0.35 }) : { ...P.namaste, lean: 0.2 }, mouth: 'smile', wind: 2 });
    onGround(hf2, 760); draw(g, hf2);
    if (dash > 0) speed(g, hf2.x + 180, hf2.y - 60, 220, 6, t);
    g.restore();
  }
  g.restore();
  void c0;
};

/* ═════════ chaupai 8: the listener; Rama, Lakshmana, Sita in the heart ═════════ */
export const kathaScene: Scene = (g, b) => {
  const t = b.t, [c0, c1] = b.c;
  daySky(g, '#f3a24a', '#f6c79a');
  g.save(); cam(g, [{ p: 0, x: 760, y: 470, z: 1 }, { p: 0.5, x: 760, y: 470, z: 1.02 }, { p: 0.68, x: 930, y: 470, z: 1.9 }, { p: 1, x: 930, y: 470, z: 2 }], b.p);
  hills(g, 700, [C.olive, C.green]);
  tree(g, 420, 760, 1.3, 'kadamba', t, 4);
  floor(g, 780, C.green, 'rgba(255,255,255,0.25)');
  const sg = F(SAGE, { x: 470, s: 1.15, t, pose: { ...P.sit, fa: [1.3, 0.8], ba: [1.2, 0.9] }, f: { k: 'book', a: 0 }, mouth: Math.sin(t * 8) > 0 ? 'open' : 'calm' }); onGround(sg, 780); draw(g, sg);
  // the story rises as little notes
  for (let i = 0; i < 6; i++) { const ph = (t * 0.4 + i / 6) % 1; devText(g, ['राम', 'सीता', 'लखन', 'अयोध्या', 'वन', 'राम'][i], lerp(560, 860, ph), 560 - ph * 120 + Math.sin(ph * 6) * 20, 24, `rgba(124,29,46,${(1 - ph) * 0.9})`); }
  const sway = Math.sin(t * 1.6) * 0.06;
  const hf = H({ x: 900, s: 1.25, face: -1, t, pose: { ...P.sitNamaste, head: 0.1 + sway, lean: sway }, eye: 'closed', mouth: 'smile', glow: 0.4 + c1 });
  onGround(hf, 780); draw(g, hf);
  // tears of joy
  for (let i = 0; i < 2; i++) { const ph = (t * 0.7 + i * 0.5) % 1; g.globalAlpha = 1 - ph; ellipse(g, 868, 560 + ph * 40, 3, 4.5, 0, C.sky); } g.globalAlpha = 1;
  // the heart opens
  if (c1 > 0) {
    const o = io(seg(c1, 0.05, 0.5));
    heartLotus(g, 925, 660, 70, o, t);
    g.save(); g.globalAlpha = io(seg(c1, 0.3, 0.7)); g.beginPath(); g.arc(925, 650, 50, 0, 7); g.clip();
    const k = 0.25;
    for (const [L, x] of [[LAKSHMANA, 895], [RAMA, 925], [SITA_GROVE, 955]] as [object, number][]) { const f = F(L, { x, s: k, t, pose: P.namaste }); onGround(f, 690); draw(g, f); }
    g.restore();
  }
  g.restore();
  void c0;
};

/* ═════════ chaupai 9: tiny before Sita; terrible over Lanka ═════════ */
export const lankaScene: Scene = (g, b) => {
  const t = b.t, [c0, c1] = b.c;
  const burn = io(seg(c1, 0.1, 0.9));
  night(g);
  g.save(); cam(g, [{ p: 0, x: 560, y: 440, z: 1.25 }, { p: 0.45, x: 620, y: 440, z: 1.15 }, { p: 0.6, x: 1700, y: 440, z: 1 }, { p: 1, x: 1720, y: 420, z: 0.95 }], b.p);
  // the Ashoka grove
  sky(g, t, 13);
  floor(g, 760, C.green, 'rgba(255,255,255,0.18)');
  tree(g, 520, 770, 1.6, 'ashoka', t, 7);
  tree(g, 160, 770, 1.1, 'ashoka', t, 8);
  const looked = seg(c0, 0.45, 0.7);
  const si = F(SITA_GROVE, { x: 610, s: 1.15, t, pose: { ...P.sit, fa: looked > 0 ? [1.6 + looked * 0.4, 1.4] : [0.6, 1.3], ba: [0.8, 1.2], head: lerp(0.3, -0.35, looked) }, eye: looked > 0 ? 'up' : 'down', mouth: looked > 0.5 ? 'smile' : 'calm' });
  onGround(si, 760); draw(g, si);
  // tiny Hanuman on a branch, the ring falling
  const tiny = H({ x: 560, s: 0.32, face: 1, t, pose: P.namaste, mouth: 'smile' }); onGround(tiny, 455); draw(g, tiny);
  const fall = seg(c0, 0.15, 0.5), rx = 600, ry = lerp(450, 600, io(fall));
  if (fall > 0) { circle(g, rx, ry, 9, null, C.gold, 4); circle(g, rx, ry - 9, 4, C.vermilion); g.fillStyle = C.fire2; g.globalAlpha = 0.6 + 0.4 * Math.sin(t * 8); star4(g, rx + 10, ry - 12, 10); g.globalAlpha = 1; }
  // Lanka
  const lx = 1800;
  g.save(); g.beginPath(); g.rect(1180, -400, 1600, 1700); g.clip();
  if (burn > 0) { const gr = g.createLinearGradient(0, 0, 0, 900); gr.addColorStop(0, `rgba(240,90,30,${0.7 * burn})`); gr.addColorStop(1, `rgba(120,20,30,${0.6 * burn})`); g.fillStyle = gr; g.fillRect(1180, -400, 1600, 1700); }
  palace(g, lx, 760, 1.25, 'lanka', t);
  floor(g, 760, C.maroon);
  // the fire spreads tower by tower
  const towers = [lx - 275, lx - 137, lx + 12, lx + 175, lx + 300];
  towers.forEach((x, i) => { const on = seg(burn, i * 0.15, i * 0.15 + 0.3); if (on > 0) { for (let k = 0; k < 3; k++) flame(g, x + (k - 1) * 30, 760 - 200 - i * 20 + k * 30, 0.9 * on, t, i * 3 + k); } });
  // smoke curls
  if (burn > 0.3) for (let i = 0; i < 6; i++) { g.save(); g.globalAlpha = 0.5 * burn; cloud(g, lx - 300 + i * 120, 140 - ((t * 20 + i * 50) % 120), 0.7, t, '#5a3a4a'); g.restore(); }
  // Hanuman grows, his tail aflame
  const grow = io(seg(c1, 0, 0.5)), hs = lerp(0.6, 2.0, grow);
  const hx = lerp(1450, 1560, burn), hf = H({ x: hx, s: hs, t, pose: { ...P.mace, fa: [2.4, 0.3] }, f: { k: 'mace', a: 0.1 }, mouth: 'roar', glow: 0.8, wind: 2 });
  onGround(hf, 780); if (c1 > 0) { draw(g, hf); for (let k = 0; k < 4; k++) flame(g, hx - 90 * hs + Math.sin(t * 3 + k) * 6, 780 - 105 * hs - k * 12 * hs, 0.35 * hs, t, k); }
  g.restore();
  g.restore();
  if (burn > 0.4) sparks(g, 1100, 300, t, 20, 500, C.fire2);
};

/* ═════════ chaupai 10: the terrible form; Rama's tasks done ═════════ */
export const battleScene: Scene = (g, b) => {
  const t = b.t, [c0, c1] = b.c;
  daySky(g, C.saffron, C.coral);
  g.save(); cam(g, [{ p: 0, x: 900, y: 420, z: 1 }, { p: 0.5, x: 900, y: 440, z: 1 }, { p: 0.7, x: 700, y: 470, z: 1 }, { p: 1, x: 700, y: 470, z: 1.05 }], b.p);
  for (let i = 0; i < 5; i++) cloud(g, 200 + i * 320, 140, 1, t, C.cream);
  hills(g, 660, ['#b8562e', C.maroon]);
  floor(g, 780, '#8a3a24', 'rgba(255,200,150,0.35)');
  // demons charge; each is struck and flies away
  const N = 7;
  for (let i = 0; i < N; i++) {
    const hit = seg(c0, 0.1 + i * 0.1, 0.3 + i * 0.1);
    const baseX = 1000 + i * 120 - seg(c0, 0, 0.1 + i * 0.1) * 120;
    const x = baseX + hit * 900, y = 780 - Math.sin(hit * Math.PI) * 400 - hit * 200;
    const f = F(i % 2 ? RAKSHASA : RAKSHASA2, { x, s: 1.05, face: -1, t: t + i, pose: hit > 0 ? { ...P.raise, root: hit * 6, fa: [2.4, 0.2], ba: [2.1, 0.3] } : walk(t * 8 + i, { lean: 0.2 }), f: { k: 'sword', a: -0.4 }, mouth: hit > 0 ? 'open' : 'calm', eye: hit > 0 ? 'wide' : 'open' });
    if (hit <= 0) onGround(f, 780); else f.y = y - 110;
    if (hit < 1) draw(g, f);
  }
  // the giant
  const swing = Math.sin(t * 5) * 0.6;
  const hf = H({ x: 760, s: 2.1, t, pose: c1 > 0.4 ? P.namaste : { ...P.stride, fa: [1.6 + swing, 0.4], lean: 0.1 }, f: c1 > 0.4 ? undefined : { k: 'mace', a: 0.8 + swing }, mouth: c1 > 0.4 ? 'smile' : 'roar', glow: 0.6, wind: 2 });
  hf.face = c1 > 0.4 ? -1 : 1;
  onGround(hf, 780); draw(g, hf);
  // dust
  if (c0 > 0 && c1 < 0.4) for (let i = 0; i < 6; i++) { g.globalAlpha = 0.4; cloud(g, 900 + i * 90, 760 - (t * 30 + i * 20) % 60, 0.4, t, '#e8c8a0'); g.globalAlpha = 1; }
  // Rama, the work accomplished
  if (c1 > 0) {
    const a = io(seg(c1, 0, 0.4));
    g.save(); g.globalAlpha = a;
    const r = F(RAMA, { x: 300, s: 1.35, t, pose: P.bless, b: { k: 'bow' }, mouth: 'smile', glow: 0.8 }); onGround(r, 780); draw(g, r);
    const v = F({ ...HANUMAN, crown: 'none', skin: '#a8743e', faceCol: '#e8c28e', dhoti: C.green, garland: false, janeu: false, scarf: undefined }, { x: 1250, s: 1.05, face: -1, t, pose: P.raise, b: { k: 'flag', a: 0 }, mouth: 'smile' }); onGround(v, 780); draw(g, v);
    g.restore();
    petals(g, t, 41, 30 * a);
  }
  g.restore();
};

export const SCENES_A: Record<string, Scene> = { title, mirror: mirrorScene, wind: windScene, ocean: oceanScene, birth: birthScene, thunder: thunderScene, portrait: portraitScene, banner: bannerScene, parents: parentsScene, student: studentScene, katha: kathaScene, lanka: lankaScene, battle: battleScene };
void [out, rng, smooth, poly, stroke2, frame, pillar, twinkle, sparkle, TULSI, lotusPond, LAKSHMANA, curl];
export type { Beat, Fig };
