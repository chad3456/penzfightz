/**
 * The Reading Room — a public library cut open and seen from above: long
 * tables under green lamps, the computers, the circulation desk, story time
 * on the round rug, and everyone the library is free to.
 */
import { type G, Iso, Scene, C, INK, HAIR, SKIN, box, plane, onPlane, inkFill, shade, rect, ln, ellipse, withPlane, SERIF, SANS, grain, TAU, type Pt } from './kit';
import { POSES, randomLook, type Look, type Pose, type Joints } from './people';
import { table, chair, bookcase, bankerLamp, openBook, bookStack, laptop, monitor, plant, rug, beanbag, bookCart, archWindow, wallClock, wallText, boards, floorShadow, dog } from './props';
import { type Plate, type Who, ip } from './stage';

const W = 2400, H = 1600;
const LW = 1.6;

/** a large-print newspaper held open in front of the face */
const newspaper = (g: G, J: Joints) => {
  const cx = (J.hN[0] + J.hF[0]) / 2, cy = Math.min(J.hN[1], J.hF[1]) - 4 * J.s;
  const w = 36 * J.s, h = 26 * J.s;
  const pts: Pt[] = [[cx - w / 2, cy - h / 2], [cx + w / 2, cy - h / 2 - 2], [cx + w / 2 + 2, cy + h / 2], [cx - w / 2 + 1, cy + h / 2 + 2]];
  g.beginPath(); g.moveTo(...pts[0]); for (const p of pts.slice(1)) g.lineTo(...p); g.closePath(); inkFill(g, '#f3efe4', LW);
  ln(g, cx, cy - h / 2 - 1, cx + 1, cy + h / 2 + 1, LW * 0.8);
  g.fillStyle = 'rgba(31,26,23,0.55)';
  g.fillRect(cx - w / 2 + 4, cy - h / 2 + 4, w / 2 - 8, 4);
  for (let i = 0; i < 6; i++) { g.fillRect(cx - w / 2 + 4, cy - h / 2 + 11 + i * 3.2, w / 2 - 8, 1.2); g.fillRect(cx + 4, cy - h / 2 + 4 + i * 3.2, w / 2 - 8, 1.2); }
  g.fillStyle = 'rgba(31,26,23,0.25)'; g.fillRect(cx + 4, cy + 4, w / 2 - 8, 8);
};
/** a picture book held open toward the children */
const pictureBook = (g: G, J: Joints) => {
  const cx = J.hF[0] + 2, cy = J.hF[1] - 10 * J.s, w = 15 * J.s, h = 11 * J.s;
  g.beginPath(); g.rect(cx - w, cy - h / 2, w, h); inkFill(g, C.butter, LW);
  g.beginPath(); g.rect(cx, cy - h / 2, w, h); inkFill(g, '#f7f1df', LW);
  ellipse(g, cx - w / 2, cy, w * 0.28, h * 0.28, 0, C.orange, LW * 0.8);
  g.beginPath(); g.moveTo(cx + 3, cy + 4); g.lineTo(cx + w / 2, cy - 4); g.lineTo(cx + w - 3, cy + 4); g.closePath(); inkFill(g, C.green, LW * 0.8);
};
const carryBooks = (g: G, J: Joints) => {
  const cx = (J.hN[0] + J.hF[0]) / 2, cy = (J.hN[1] + J.hF[1]) / 2 - 3 * J.s;
  const cols = [C.red, C.teal, C.mustard, C.navy];
  cols.forEach((c, i) => { g.beginPath(); g.rect(cx - 12 * J.s + (i % 2) * 2, cy - (i + 1) * 4 * J.s, 22 * J.s, 4 * J.s); inkFill(g, c, LW * 0.8); });
};
const phoneIn = (hand: 'hN' | 'hF') => (g: G, J: Joints) => { const [x, y] = J[hand]; g.beginPath(); g.roundRect(x - 2.2 * J.s, y - 6 * J.s, 4.4 * J.s, 7.5 * J.s, 1); inkFill(g, C.char, LW * 0.8); };
const magnifier = (g: G, J: Joints) => { const [x, y] = J.hN; ln(g, x, y, x + 6 * J.s, y - 6 * J.s, LW * 2.4); ln(g, x, y, x + 6 * J.s, y - 6 * J.s, LW, C.brown); ellipse(g, x + 9 * J.s, y - 9 * J.s, 4.5 * J.s, 4.5 * J.s, 0, 'rgba(210,235,245,0.7)', LW); };

function look(seed: number, o: Partial<Look>) { return randomLook(seed, o); }

function paint(g: G, who: Who[]) {
  const I = new Iso(1010, 418, 0.78);
  const sc = new Scene(g);
  const RX = 1700, RY = 1200, WH = 430;

  g.fillStyle = '#a7c4bc'; g.fillRect(0, 0, W, H);

  /* ── the building, cut ── */
  box(g, I, -24, -24, -34, RX + 24, RY + 24, 34, { top: '#c9b48a', left: '#b99d6c', right: '#a88b5c', lw: LW });
  boards(g, I, 0, 0, RX, RY, 24, '#dcae72', LW, 4);
  // sunlight from the windows, falling across the floor
  g.save(); onPlane(g, I, 'z', 0, (gg) => gg.rect(0, 0, RX, RY)); g.clip(); g.fillStyle = 'rgba(255,248,222,0.3)';
  for (const u of [120, 520, 920]) {
    const proj = (y: number, z: number): Pt => I.p(z * 1.05, y + z * 0.2, 0);
    const a = proj(u + 12, 250), b = proj(u + 178, 250), c2 = proj(u + 178, 395), d = proj(u + 12, 395);
    g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.lineTo(...c2); g.lineTo(...d); g.closePath(); g.fill();
  }
  g.restore();
  box(g, I, -24, -24, 0, 24, RY + 24, WH, { top: '#8e7a5c', left: '#c9b48a', right: '#efe2c2', lw: LW });
  box(g, I, 0, -24, 0, RX, 24, WH, { top: '#8e7a5c', left: '#efe2c2', right: '#c9b48a', lw: LW });
  plane(g, I, 'x', 0, (gg) => gg.rect(0, 0, RY, 16), '#2f5a3e', LW);
  plane(g, I, 'y', 0, (gg) => gg.rect(0, 0, RX, 16), '#2f5a3e', LW);
  plane(g, I, 'x', 0, (gg) => gg.rect(0, WH - 22, RY, 12), '#e2cfa2', LW);
  plane(g, I, 'y', 0, (gg) => gg.rect(0, WH - 22, RX, 12), '#e2cfa2', LW);
  for (const u of [120, 520, 920]) archWindow(g, I, 'x', 0, u, 245, 190, 160, LW, '#cfe7ec', '#fbf6e6');
  wallText(g, I, 'y', 0, 470, 330, 'FREE TO ALL', 64, '"Cinzel", serif', '#7a5a2a');
  // the doors
  plane(g, I, 'y', 0, (gg) => gg.rect(1010, 0, 210, 262), '#6b4128', LW);
  plane(g, I, 'y', 0, (gg) => { gg.rect(1024, 10, 84, 238); gg.rect(1122, 10, 84, 238); }, '#cfe7ec', LW);
  onPlane(g, I, 'y', 0, (gg) => { gg.moveTo(1031, 120); gg.lineTo(1060, 230); gg.moveTo(1130, 120); gg.lineTo(1160, 230); }); g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = LW * 1.6; g.stroke();
  plane(g, I, 'y', 0, (gg) => gg.rect(1075, 274, 80, 24), '#d9493f', LW);
  wallText(g, I, 'y', 0, 1115, 285, 'EXIT', 16, `bold ${SANS}`, '#fff');
  wallClock(g, I, 'y', 0, 1115, 352, 34, LW, 4.2);
  // the notice board
  plane(g, I, 'y', 0, (gg) => gg.rect(1330, 105, 300, 160), '#c08a54', LW);
  const notes: [number, number, number, number, string, string][] = [[1345, 190, 74, 60, '#f7f1df', 'ESL · TUES 6PM'], [1430, 200, 64, 50, '#f3dc8a', 'FREE TAX HELP'], [1505, 178, 110, 72, '#f4a6a0', 'JOB FAIR SAT'], [1350, 118, 86, 60, '#bfe3c8', 'STORY TIME 10AM'], [1446, 122, 76, 64, '#cfe7ec', 'CHESS CLUB'], [1532, 116, 84, 52, '#f7f1df', 'LOST CAT: BISCUIT']];
  for (const [u, v, w, h, col, t] of notes) { plane(g, I, 'y', 0, (gg) => gg.rect(u, v, w, h), col, LW * 0.7); wallText(g, I, 'y', 0, u + w / 2, v + h - 13, t, 9.5, `bold ${SANS}`, '#3a2a1a'); onPlane(g, I, 'y', 0, (gg) => { for (let i2 = 0; i2 < 3; i2++) { gg.moveTo(u + 8, v + 10 + i2 * 8); gg.lineTo(u + w - 8, v + 10 + i2 * 8); } }); g.strokeStyle = 'rgba(31,26,23,0.35)'; g.lineWidth = 1; g.stroke(); const pin = I.p(u + w / 2, 0, v + h - 3); ellipse(g, pin[0], pin[1], 2.6, 2.6, 0, C.red, 0.8); }

  /* ── bookcases ── */
  bookcase(g, I, 0, 40, 880, 225, '+x', LW, 11);
  bookcase(g, I, 40, 0, 880, 225, '+y', LW, 12);

  const seat = (x: number, y: number, f: '+y' | '-y', col: string, person?: () => void) => {
    if (f === '+y') { chair(g, I, x, y, f, col, LW); person?.(); }
    else { chair(g, I, x, y, f, col, LW, 'seat'); person?.(); chair(g, I, x, y, f, col, LW, 'back'); }
  };
  const now = (x: number, y: number, z: number, o: Parameters<typeof ip>[6]) => () => { const s2 = new Scene(g); ip(s2, I, who, x, y, z, o); s2.draw(); };
  const tableGroup = (x0: number, y0: number, len: number, far: (() => void)[], items: () => void, near: (() => void)[]) => {
    sc.add(I.depth(x0 + len / 2, y0 + 55), () => {
      floorShadow(g, I, x0, y0, len, 110, 16);
      far.forEach((f) => f());
      table(g, I, x0, y0, len, 110, 76, '#b97a45', LW, { leg: '#6b4128', apron: true });
      items();
      near.forEach((f) => f());
    });
  };

  /* ── table A ── */
  tableGroup(240, 380, 680,
    [
      () => seat(320, 352, '+y', C.wood, now(320, 352, 45, { face: '+y', look: look(3, { fem: false, skin: SKIN[5], hair: HAIR.black, style: 'short', topKind: 'hoodie', top: C.red, bottom: C.char, hat: { kind: 'headphones', color: C.char }, glasses: false, beard: false }), pose: POSES.sitDesk, who: ['Jordan, 19', 'Community college, two part-time jobs. Studies here between shifts because the Wi-Fi is free and nobody asks him to buy anything.'] })),
      () => seat(500, 352, '+y', C.wood),
      () => seat(680, 352, '+y', C.wood, now(680, 352, 45, { face: '+y', look: look(8, { fem: true, age: 'old', skin: SKIN[1], hair: HAIR.white, style: 'bob', topKind: 'sweater', top: C.lav, bottom: C.grey, glasses: true }), pose: { ...POSES.sitRead, armN: [30, 100] }, hold: magnifier, who: ['Ruth, 86', 'Large-print mysteries, two a week. She solved this one by page forty and is reading on to see if she was right.'] })),
      () => seat(860, 352, '+y', C.wood, now(860, 352, 45, { face: '+y', look: look(9, { fem: true, skin: SKIN[2], style: 'hijab', hijab: C.teal, hair: HAIR.black, topKind: 'blouse', top: C.butter, bottom: C.navy, glasses: false }), pose: POSES.sitDesk, who: ['Amina, 34', 'Working through the hundred civics questions. Her citizenship interview is on Thursday; she knows all hundred, and is going through them again.'] })),
    ],
    () => {
      laptop(g, I, 320, 412, 76, LW, '+y', C.ash, '#dfeff2');
      bankerLamp(g, I, 410, 435, 76, LW); bankerLamp(g, I, 770, 435, 76, LW);
      openBook(g, I, 680, 410, 76, LW);
      bookStack(g, I, 900, 425, 76, 3, LW, 4); openBook(g, I, 850, 412, 76, LW, 'x', '#fdf6e3');
      bookStack(g, I, 530, 425, 76, 2, LW, 6);
      openBook(g, I, 410, 466, 76, LW);
    },
    [
      () => seat(410, 518, '-y', C.wood, now(410, 518, 45, { face: '-y', look: look(14, { fem: true, age: 'teen', skin: SKIN[3], hair: HAIR.dark, style: 'ponytail', topKind: 'hoodie', top: C.sky, bottom: C.denim }), pose: { sit: true, lean: 52, head: 40, armN: [100, 200], armF: [96, 190], legN: [86, 2], legF: [82, -4] }, who: ['Destiny, 15', 'Asleep on chapter nine of her biology book. Her little brothers are loud at home; this is the quietest room she knows.'] })),
      () => seat(770, 518, '-y', C.wood, now(770, 518, 45, { face: '-y', look: look(15, { fem: false, skin: SKIN[0], hair: HAIR.ginger, style: 'curly', topKind: 'sweater', top: C.olive, bottom: C.khaki, glasses: true }), pose: POSES.sitDesk, who: ['Theo, 27', 'Writing his first novel by hand. It is set in a library. He will not tell you what happens.'] })),
    ]);

  /* ── table B ── */
  tableGroup(240, 680, 680,
    [
      () => seat(320, 652, '+y', C.wood, now(320, 652, 45, { face: '+y', look: look(21, { fem: false, age: 'old', skin: SKIN[4], hair: HAIR.grey, style: 'balding', topKind: 'shirt', top: C.sky, bottom: C.brown, beard: 'mustache' }), pose: { ...POSES.sitRead, armN: [40, 120], armF: [45, 125] }, hold: newspaper, who: ['Walt, 74', 'Retired machinist. Reads three newspapers a day, cover to cover, and has never paid for one since 1998.'] })),
      () => seat(590, 652, '+y', C.wood, now(590, 652, 45, { face: '+y', look: look(22, { fem: true, skin: SKIN[0], hair: HAIR.blond, style: 'bun', topKind: 'sweater', top: C.cream, bottom: C.black, glasses: true }), pose: POSES.sitDesk, who: ['Hannah, 29', 'Fourth year of a history PhD. The thing she needs is on microfilm, in this building, and only here.'] })),
      () => seat(840, 652, '+y', C.wood, now(840, 652, 45, { face: '+y', look: look(23, { fem: false, age: 'kid', skin: SKIN[5], hair: HAIR.black, style: 'short', topKind: 'tee', top: C.orange, bottom: C.denim }), pose: { ...POSES.sitDesk, head: 4 }, mood: 'open', who: ['Malik, 9', 'Long division. Asked his tutor whether you can divide by zero, and has been told to wait until high school.'] })),
    ],
    () => {
      bookStack(g, I, 570, 720, 76, 5, LW, 9); bookStack(g, I, 630, 730, 76, 3, LW, 10); laptop(g, I, 590, 712, 76, LW, '+y', C.char, '#e8f1f2');
      bankerLamp(g, I, 450, 735, 76, LW); bankerLamp(g, I, 730, 735, 76, LW);
      openBook(g, I, 840, 718, 76, LW, 'x', '#f7f1df');
      plane(g, I, 'z', 76, (gg) => gg.rect(815, 740, 26, 32), C.white, LW * 0.7);
    },
    [
      () => seat(500, 818, '-y', C.wood, now(500, 818, 45, { face: '-y', look: look(31, { fem: true, skin: SKIN[2], hair: HAIR.black, style: 'long', topKind: 'jacket', top: C.wine, inner: C.cream, bottom: C.char }), pose: POSES.sitDesk, who: ['Lucía, 41', 'Writing a letter to her mother in Oaxaca, by hand, because her mother keeps them in a tin.'] })),
      () => seat(840, 818, '-y', C.wood, now(840, 818, 45, { face: '-y', look: look(32, { fem: true, age: 'old', skin: SKIN[0], hair: HAIR.ash, style: 'short', topKind: 'sweater', top: C.mint, bottom: C.navy, glasses: true }), pose: { ...POSES.sitDesk, armF: [60, 100] }, who: ['Barbara, 68', 'Volunteer tutor, Tuesdays and Thursdays since she retired from teaching fourth grade. Thirty-one years and she still loves fractions.'] })),
    ]);
  // at the head of table B, a wheelchair
  sc.add(I.depth(190, 735), () => {
    const x = 175, y = 735;
    const wheel = (yy: number) => { plane(g, I, 'y', yy, (gg) => gg.ellipse(x, 30, 30, 30, 0, 0, TAU), null, LW * 2.4); onPlane(g, I, 'y', yy, (gg) => gg.ellipse(x, 30, 30, 30, 0, 0, TAU)); g.strokeStyle = C.slate; g.lineWidth = LW * 1.2; g.stroke(); onPlane(g, I, 'y', yy, (gg) => { for (let a = 0; a < 6; a++) { gg.moveTo(x, 30); gg.lineTo(x + Math.cos(a) * 28, 30 + Math.sin(a) * 28); } }); g.strokeStyle = 'rgba(31,26,23,0.5)'; g.lineWidth = 0.8; g.stroke(); };
    wheel(y - 24);
    box(g, I, x - 22, y - 22, 42, 44, 44, 5, { top: C.char, left: C.black, right: C.black, lw: LW });
    box(g, I, x - 24, y - 22, 42, 4, 44, 46, { top: C.char, left: C.black, right: C.char, lw: LW });
    const s2 = new Scene(g); ip(s2, I, who, x, y, 46, { face: '+x', turn: 0.62, look: look(141, { fem: true, skin: SKIN[3], hair: HAIR.black, style: 'curly', topKind: 'tee', top: C.violet, bottom: C.denim, glasses: true }), pose: { ...POSES.sitDesk, lean: 6 }, who: ['Gabriela, 23', 'Paralegal studies, night classes. Uses the reading room because the elevator here works, which is more than she can say for her school’s.'] }); s2.draw();
    wheel(y + 24);
  });

  /* ── the computers ── */
  {
    const x0 = 1040, y0 = 560;
    sc.add(I.depth(x0 + 225, y0 + 40), () => {
      floorShadow(g, I, x0, y0, 450, 80, 14);
      table(g, I, x0, y0, 450, 80, 76, '#e9dfc6', LW, { leg: C.slate });
      const screen = (kind: number) => (gg: G, u0: number, v0: number) => {
        gg.fillStyle = '#f4f8fa'; gg.fillRect(u0, v0, 47, 27);
        if (kind === 0) { gg.fillStyle = '#2c3f6b'; gg.fillRect(u0, v0 + 22, 47, 5); gg.fillStyle = 'rgba(31,26,23,0.45)'; for (let i2 = 0; i2 < 5; i2++) gg.fillRect(u0 + 6, v0 + 4 + i2 * 3.4, 20 + (i2 % 2) * 12, 1.2); }
        if (kind === 1) { gg.fillStyle = '#ffd9a8'; gg.fillRect(u0, v0, 47, 27); gg.fillStyle = '#3a2418'; gg.beginPath(); gg.ellipse(u0 + 24, v0 + 12, 8, 9, 0, 0, TAU); gg.fill(); gg.fillStyle = '#c98c62'; gg.beginPath(); gg.ellipse(u0 + 24, v0 + 11, 6, 7, 0, 0, TAU); gg.fill(); gg.fillStyle = '#4a6fa5'; gg.fillRect(u0 + 15, v0, 18, 4); gg.fillStyle = '#e8b48f'; gg.fillRect(u0 + 38, v0 + 19, 7, 6); }
        if (kind === 2) { gg.fillStyle = '#e9f3e6'; gg.fillRect(u0, v0, 47, 27); gg.fillStyle = '#2f5a3e'; gg.fillRect(u0, v0 + 21, 47, 6); gg.fillStyle = 'rgba(31,26,23,0.4)'; for (let i2 = 0; i2 < 4; i2++) { gg.fillRect(u0 + 5, v0 + 3 + i2 * 4.5, 14, 1.4); gg.strokeStyle = 'rgba(31,26,23,0.5)'; gg.lineWidth = 0.6; gg.strokeRect(u0 + 22, v0 + 2.5 + i2 * 4.5, 20, 3); } }
      };
      monitor(g, I, x0 + 75, y0 + 30, 76, LW, '+y', screen(0));
      monitor(g, I, x0 + 225, y0 + 30, 76, LW, '+y', screen(1));
      monitor(g, I, x0 + 375, y0 + 30, 76, LW, '+y', screen(2));
      for (const u of [75, 225, 375]) box(g, I, x0 + u - 20, y0 + 50, 76, 40, 14, 1.5, { top: C.ash, left: C.grey, right: C.slate, lw: LW * 0.7 });
      const users: [number, Look, Pose, [string, string]][] = [
        [75, look(41, { fem: false, skin: SKIN[4], hair: HAIR.black, style: 'buzz', topKind: 'shirt', top: C.white, accent: C.navy, bottom: C.char }), POSES.sitDesk, ['Marcus, 51', 'Laid off in March after twenty-two years at the bottling plant. Fourth application today; the librarian helped him with the résumé.']],
        [225, look(42, { fem: true, age: 'old', skin: SKIN[1], hair: HAIR.grey, style: 'bun', topKind: 'sweater', top: C.rose, bottom: C.grey }), { ...POSES.sitDesk, armF: [140, 160] }, ['Dolores, 77', 'Learned video calls at the Tuesday class. Her grandson in San Diego is showing her his new tooth, and she is waving.']],
        [375, look(43, { fem: false, age: 'teen', skin: SKIN[2], hair: HAIR.black, style: 'side', topKind: 'tee', top: C.mustard, bottom: C.denim }), POSES.sitDesk, ['Kevin, 17', 'Filling in his financial-aid form with his mother reading over his shoulder. He will be the first in the family to go to college.']],
      ];
      for (const [u, lk, pose, w2] of users) { chair(g, I, x0 + u, y0 + 112, '-y', C.navy, LW, 'seat'); const s2 = new Scene(g); ip(s2, I, who, x0 + u, y0 + 112, 45, { face: '-y', look: lk, pose, who: w2 }); s2.draw(); chair(g, I, x0 + u, y0 + 112, '-y', C.navy, LW, 'back'); }
    });
    ip(sc, I, who, 1470, 700, 0, { face: '-y', look: look(44, { fem: true, skin: SKIN[2], hair: HAIR.black, style: 'long', topKind: 'coat', top: C.wine, bottom: C.black }), pose: { ...POSES.point, lean: 14, head: 10, armF: [60, 80] }, who: ['Rosa, 46', 'Kevin’s mother. Cleans offices downtown at night; came straight here to help him finish before the deadline.'] });
  }

  /* ── circulation desk ── */
  {
    const x0 = 1250, y0 = 260;
    ip(sc, I, who, 1360, 205, 0, { face: '+y', turn: 0.4, look: look(51, { fem: true, skin: SKIN[5], hair: HAIR.black, style: 'locs', topKind: 'blouse', top: C.mustard, bottom: C.navy, glasses: '#7d2a3a', lanyard: C.red }), pose: { ...POSES.point, armF: [70, 100] }, mood: 'smile', who: ['Ms. Okafor, librarian', 'Master’s in library science. Today: a résumé, two tax forms, a lost-cat flyer, where the bathroom is, and a question about black holes.'] });
    ip(sc, I, who, 1520, 200, 0, { face: '+x', turn: 0.5, look: look(54, { fem: false, skin: SKIN[0], hair: HAIR.brown, style: 'short', topKind: 'sweater', top: C.navy, bottom: C.khaki, glasses: true, lanyard: C.red }), pose: { ...POSES.cradle, head: 20 }, hold: (gg, J) => { const cx = (J.hN[0] + J.hF[0]) / 2, cy = (J.hN[1] + J.hF[1]) / 2 - 4; gg.beginPath(); gg.rect(cx - 9, cy - 6, 18, 12); inkFill(gg, C.teal, LW); }, who: ['Pete, 58', 'Processes the holds. Sixty-one people are waiting for the same thriller; he has ordered a twelfth copy.'] });
    sc.add(I.depth(x0 + 175, y0 + 40), () => {
      floorShadow(g, I, x0, y0, 350, 80, 12);
      box(g, I, x0, y0, 0, 350, 80, 100, { top: '#3d2a1e', left: '#8a5a3a', right: '#6b4128', lw: LW });
      plane(g, I, 'y', y0 + 80, (gg) => { for (let i2 = 0; i2 < 6; i2++) gg.rect(x0 + 11 + i2 * 56, 14, 48, 70); }, '#9a6440', LW * 0.7);
      box(g, I, x0 + 20, y0 + 10, 100, 60, 40, 2, { top: C.ash, left: C.grey, right: C.slate, lw: LW });
      monitor(g, I, x0 + 70, y0 + 30, 100, LW, '-y', () => {});
      bookStack(g, I, x0 + 280, y0 + 40, 100, 4, LW, 21);
      box(g, I, x0 + 190, y0 + 30, 100, 10, 8, 10, { top: C.red, left: C.red, right: shade(C.red, -0.2), lw: LW * 0.7 });
    });
    ip(sc, I, who, 1370, 400, 0, { face: '-y', look: look(52, { fem: false, skin: SKIN[3], hair: HAIR.dark, style: 'short', topKind: 'jacket', top: C.denim, inner: C.white, bottom: C.khaki, hat: { kind: 'cap', color: C.red } }), pose: POSES.carry, hold: carryBooks, who: ['Ray, 38', 'Long-haul trucker. Borrows eight audiobooks at a time for the run to Albuquerque and back.'] });
    ip(sc, I, who, 1480, 420, 0, { face: '-y', look: look(53, { fem: true, age: 'kid', skin: SKIN[3], hair: HAIR.dark, style: 'ponytail', topKind: 'dress', top: C.pink, bottom: C.pink, shoes: C.red }), pose: { ...POSES.reach, armF: [150, 160], head: -10 }, who: ['Ella, 6', 'Her first library card. She has been practising her signature all week.'] });
    ip(sc, I, who, 1555, 455, 0, { face: '-y', turn: 0.4, look: look(55, { fem: false, skin: SKIN[3], hair: HAIR.black, style: 'short', topKind: 'tee', top: C.white, bottom: C.navy }), pose: { ...POSES.stand, armN: [40, 60] }, who: ['Luis, 34', 'Ella’s father. Did not have a library card until he was twenty-five. Is very calm about this. Is not calm.'] });
  }

  /* ── by the door: the guard, and a woman with her guide dog ── */
  ip(sc, I, who, 960, 130, 0, { face: '+y', turn: 0.35, look: look(61, { fem: false, skin: SKIN[6], hair: HAIR.black, style: 'buzz', topKind: 'shirt', top: '#4a5a7a', accent: '#4a5a7a', bottom: C.char, beard: true }), pose: { ...POSES.standFront, armN: [10, 40], armF: [-10, -40] }, mood: 'flat', who: ['Earl, 63', 'Security, nineteen years. Knows every regular by name and keeps a jar of dog biscuits behind the desk.'] });
  sc.add(I.depth(1070, 400), () => { const [x, y] = I.p(1070, 400, 0); dog(g, x, y, I.zs * 0.95, -1, '#e8c47a', LW, { harness: C.red, tail: 6 }); });
  ip(sc, I, who, 1110, 370, 0, { face: '+y', turn: 0.6, look: look(62, { fem: true, age: 'old', skin: SKIN[0], hair: HAIR.white, style: 'short', topKind: 'coat', top: C.teal, bottom: C.navy, bottomKind: 'pants', glasses: '#2b2b30' }), pose: { ...POSES.walk, armF: [40, 50] }, mood: 'smile', who: ['June, 71, and Pilot', 'Comes every Wednesday for the new audiobooks. Pilot comes for Earl’s biscuits.'] });

  /* ── the shelves: someone browsing, the cart and its page ── */
  ip(sc, I, who, 62, 300, 0, { face: '-x', turn: 0.45, look: look(71, { fem: false, skin: SKIN[1], hair: HAIR.brown, style: 'short', topKind: 'coat', top: C.khaki, bottom: C.navy, scarf: C.red, glasses: true }), pose: { ...POSES.reach, armF: [140, 150] }, who: ['Professor Lindqvist, 59', 'Teaches at the university across the river, which has a far bigger library. He likes this one better.'] });
  sc.add(I.depth(110, 560), () => bookCart(g, I, 60, 520, LW, 5));
  ip(sc, I, who, 120, 620, 0, { face: '+x', turn: 0.5, look: look(72, { fem: false, age: 'teen', skin: SKIN[4], hair: HAIR.black, style: 'afro', topKind: 'tee', top: C.green, bottom: C.khaki, lanyard: C.green }), pose: POSES.walk, who: ['Andre, 17', 'Shelving page, after school. Reshelves the cookbooks people leave open at the cake pages.'] });
  ip(sc, I, who, 520, 75, 0, { face: '-y', turn: 0.45, look: look(73, { fem: true, skin: SKIN[6], hair: HAIR.black, style: 'braids', topKind: 'jacket', top: C.orange, inner: C.white, bottom: C.denim }), pose: { ...POSES.cradle, head: 26 }, hold: (gg, J) => { const cx = (J.hN[0] + J.hF[0]) / 2, cy = (J.hN[1] + J.hF[1]) / 2 - 4; gg.beginPath(); gg.rect(cx - 7, cy - 9, 14, 18); inkFill(gg, C.navy, LW); }, who: ['Keisha, 31', 'Looking up her rights as a tenant. Her landlord has not fixed the heat since November. She has a plan now.'] });

  /* ── the reading chair by the window ── */
  sc.add(I.depth(130, 1010), () => {
    const x = 110, y = 990, F = C.forest;
    box(g, I, x - 50, y - 50, 0, 100, 100, 40, { top: F, left: shade(F, -0.1), right: shade(F, -0.2), lw: LW });
    box(g, I, x - 50, y - 50, 0, 22, 100, 95, { top: F, left: shade(F, 0.05), right: shade(F, -0.15), lw: LW });
    box(g, I, x - 50, y - 50, 0, 100, 18, 66, { top: F, left: shade(F, 0.05), right: shade(F, -0.15), lw: LW });
    const s2 = new Scene(g);
    ip(s2, I, who, x + 4, y + 4, 40, { face: '+x', turn: 0.6, look: look(81, { fem: false, skin: SKIN[2], hair: HAIR.dark, style: 'curly', topKind: 'coat', top: C.olive, bottom: C.brown, beard: true }), pose: { ...POSES.sitRead, lean: -6 }, hold: (gg, J) => { const cx = (J.hN[0] + J.hF[0]) / 2 + 3, cy = (J.hN[1] + J.hF[1]) / 2 - 4; gg.beginPath(); gg.rect(cx - 9, cy - 7, 9, 12); inkFill(gg, C.red, LW); gg.beginPath(); gg.rect(cx, cy - 7, 9, 12); inkFill(gg, C.red, LW); }, who: ['Daniel, 44', 'Here at opening every day. Charges his phone, washes up, reads. He finished all of Steinbeck this winter and is starting on Toni Morrison.'] });
    s2.draw();
    box(g, I, x - 50, y + 32, 0, 100, 18, 66, { top: F, left: shade(F, 0.05), right: shade(F, -0.15), lw: LW });
    const [bx, by] = I.p(x + 70, y + 40, 0);
    ellipse(g, bx, by - 14, 22, 15, 0, C.moss, LW); g.beginPath(); g.roundRect(bx - 12, by - 22, 24, 12, 3); inkFill(g, shade(C.moss, -0.15), LW);
    const [sx, sy] = I.p(x + 30, y + 95, 0); ellipse(g, sx, sy - 10, 24, 12, -0.45, C.navy, LW); ellipse(g, sx - 18, sy - 2, 7, 11, -0.45, shade(C.navy, 0.25), LW);
  });
  sc.add(I.depth(55, 1150), () => plant(g, I, 55, 1150, 0, 160, LW, C.brick, 3, 'palm'));

  /* ── story time ── */
  sc.add(1, () => rug(g, I, 520, 1010, 440, 330, '#e8714a', '#f3dc8a', LW, true));
  sc.add(I.depth(330, 960) - 1, () => box(g, I, 312, 942, 0, 36, 36, 34, { top: C.teal, left: shade(C.teal, -0.1), right: shade(C.teal, -0.2), lw: LW }));
  ip(sc, I, who, 330, 960, 34, { face: '+x', turn: 0.62, look: look(91, { fem: false, skin: SKIN[1], hair: HAIR.auburn, style: 'short', topKind: 'sweater', top: C.mustard, bottom: C.navy, beard: true, glasses: true }), pose: { ...POSES.sit, armF: [90, 120], armN: [30, 100], head: -6 }, hold: pictureBook, mood: 'open', who: ['Mr. Hal, children’s librarian', 'Does all the voices; the bear is the best one. Story time has run here every Saturday at ten since 1974.'] });
  const kids: [number, number, number, Partial<Look>, string, string, ('open' | 'o' | 'smile')?][] = [
    [480, 905, 1, { fem: true, skin: SKIN[0], hair: HAIR.blond, style: 'ponytail', top: C.red, topKind: 'tee' }, 'Ivy, 5', 'Knows this book by heart and says the bear’s lines a beat early.', 'open'],
    [490, 1030, 2, { fem: false, skin: SKIN[5], hair: HAIR.black, style: 'curly', top: C.teal, topKind: 'tee' }, 'Jamal, 4', 'Came for the bear. Staying for the bear.', 'o'],
    [560, 1120, 3, { fem: true, skin: SKIN[2], hair: HAIR.black, style: 'bun', top: C.lav, topKind: 'sweater' }, 'Mei, 5', 'Brought her own book, in case.'],
    [600, 950, 4, { fem: false, skin: SKIN[3], hair: HAIR.dark, style: 'short', top: C.mustard, topKind: 'hoodie' }, 'Mateo, 6', 'Has a question. Has had it for ten minutes. Is being very patient about it.'],
    [620, 1050, 5, { fem: true, skin: SKIN[6], hair: HAIR.black, style: 'afro', top: C.pink, topKind: 'tee' }, 'Zuri, 4', 'Her grandmother brought her mother to this story time thirty years ago.'],
  ];
  for (const [x, y, sd, o, n, l, m] of kids) ip(sc, I, who, x, y, 0, { face: '-x', turn: 0.5, look: look(100 + sd, { age: 'kid', bottom: C.denim, bottomKind: 'pants', shoes: C.white, ...o }), pose: { ...POSES.floorCross, kLegN: [0.7, 0.8], kLegF: [0.7, 0.8] }, mood: m, who: [n, l] });
  // a dad at the edge, with the stroller
  sc.add(I.depth(700, 1185), () => {
    const x = 690, y = 1180;
    const wheel = (wx: number, wy: number) => { const [a, b] = I.p(wx, wy, 9); ellipse(g, a, b, 7, 8, 0, C.char, LW); ellipse(g, a, b, 2.5, 3, 0, C.ash, 0.8); };
    wheel(x - 26, y - 18); wheel(x + 26, y - 18);
    box(g, I, x - 30, y - 20, 22, 60, 38, 30, { top: C.char, left: C.navy, right: shade(C.navy, -0.2), lw: LW });
    // the hood, from the front edge back over the top
    const h0 = I.p(x - 30, y - 20, 52), h1 = I.p(x - 30, y + 18, 52), top = I.p(x - 8, y, 90);
    g.beginPath(); g.moveTo(...h0); g.quadraticCurveTo(top[0] - 30, top[1] - 6, top[0], top[1]); g.quadraticCurveTo(top[0] + 18, top[1] + 20, h1[0] + 34, h1[1] - 10); g.lineTo(...h1); g.closePath(); inkFill(g, C.teal, LW);
    g.beginPath(); g.moveTo(h0[0] + 10, h0[1] - 6); g.quadraticCurveTo(top[0] - 14, top[1] + 8, h1[0] + 20, h1[1] - 6); g.lineWidth = LW * 0.7; g.strokeStyle = 'rgba(31,26,23,0.6)'; g.stroke();
    wheel(x - 26, y + 18); wheel(x + 26, y + 18);
    const p1 = I.p(x + 30, y - 16, 50), p2 = I.p(x + 52, y - 16, 98), p3 = I.p(x + 52, y + 16, 98), p4 = I.p(x + 30, y + 16, 50);
    g.beginPath(); g.moveTo(...p1); g.lineTo(...p2); g.lineTo(...p3); g.lineTo(...p4); g.lineWidth = LW * 2.6; g.strokeStyle = INK; g.stroke(); g.lineWidth = LW; g.strokeStyle = C.ash; g.stroke();
  });
  ip(sc, I, who, 840, 1160, 0, { face: '-x', turn: 0.5, look: look(111, { fem: false, skin: SKIN[2], hair: HAIR.black, style: 'short', topKind: 'tee', top: C.grey, bottom: C.denim, beard: 'stubble', bag: { kind: 'backpack', color: C.navy } }), pose: { ...POSES.stand, armF: [40, 60] }, mood: 'smile', who: ['Sam, 36', 'Night-shift nurse, on dad duty until noon. The baby is asleep. He is pretending not to listen to the bear.'] });

  /* ── the chess table ── */
  sc.add(I.depth(1150, 920), () => {
    const x = 1150, y = 920;
    const s2 = new Scene(g);
    chair(g, I, x - 62, y, '+x', C.brick, LW);
    ip(s2, I, who, x - 62, y, 45, { face: '+x', turn: 0.55, look: look(151, { fem: false, age: 'old', skin: SKIN[6], hair: HAIR.white, style: 'balding', topKind: 'sweater', top: C.wine, bottom: C.char, beard: true, hat: { kind: 'cap', color: C.navy } }), pose: { ...POSES.sitDesk, head: 26, armN: [20, 60] }, who: ['Clarence, 80', 'Played chess in this spot every afternoon since 1971. Claims never to have lost to a librarian.'] });
    s2.draw();
    table(g, I, x - 32, y - 32, 64, 64, 72, C.wood, LW);
    plane(g, I, 'z', 72, (gg) => { for (let i2 = 0; i2 < 8; i2++) for (let j2 = 0; j2 < 8; j2++) if ((i2 + j2) % 2) gg.rect(x - 24 + i2 * 6, y - 24 + j2 * 6, 6, 6); }, C.chocolate, 0);
    plane(g, I, 'z', 72, (gg) => gg.rect(x - 24, y - 24, 48, 48), null, LW * 0.7);
    const R = (k: number) => [[-18, -14], [-6, -18], [6, -12], [-12, 8], [12, 14], [0, 2], [16, -2], [-20, 18]][k];
    for (let k = 0; k < 8; k++) { const [px, py] = I.p(x + R(k)[0], y + R(k)[1], 72); g.beginPath(); g.ellipse(px, py - 3, 2.6, 4, 0, 0, TAU); inkFill(g, k % 2 ? C.white : C.black, 0.8); }
    chair(g, I, x + 62, y, '-x', C.brick, LW, 'seat');
    ip(s2, I, who, x + 62, y, 45, { face: '-x', turn: 0.55, look: look(152, { fem: false, age: 'teen', skin: SKIN[1], hair: HAIR.dark, style: 'short', topKind: 'hoodie', top: C.green, bottom: C.denim }), pose: { ...POSES.sitDesk, head: 20, armF: [60, 90] }, who: ['Owen, 13', 'Has lost to Clarence forty-four times. Won once, in May. Clarence says that one did not count.'] });
    s2.draw();
    chair(g, I, x + 62, y, '-x', C.brick, LW, 'back');
  });
  ip(sc, I, who, 1150, 845, 0, { face: '+y', turn: 0.4, look: look(153, { fem: false, age: 'old', skin: SKIN[2], hair: HAIR.grey, style: 'short', topKind: 'jacket', top: C.brown, inner: C.cream, bottom: C.khaki, hat: { kind: 'cowboy', color: C.tan } }), pose: { ...POSES.hips }, who: ['Ernesto, 77', 'Not playing. Has opinions about every move. Is asked to keep them to himself, and does not.'] });

  ip(sc, I, who, 1080, 1090, 0, { face: '-x', turn: 0.5, look: look(171, { fem: false, skin: SKIN[3], hair: HAIR.black, style: 'short', topKind: 'jacket', top: C.char, inner: C.sky, bottom: C.khaki, beard: true }), pose: POSES.walk2, hold: (gg, J) => { const [x, y] = J.hF; gg.beginPath(); gg.rect(x - 5, y - 2, 12, 15); inkFill(gg, C.butter, LW); gg.beginPath(); gg.rect(x - 3, y - 5, 12, 15); inkFill(gg, C.red, LW); }, who: ['Yusuf, 52', 'Drives a cab nights. Bringing back three cookbooks; he has cooked his way through the Persian one twice.'] });
  /* ── the beanbags ── */
  sc.add(I.depth(940, 1020), () => beanbag(g, I, 950, 1030, C.violet, LW));
  const sb = new Scene(g);
  sc.add(I.depth(950, 1035), () => { ip(sb, I, who, 950, 1020, 22, { face: '+y', turn: 0.5, look: look(121, { age: 'teen', fem: true, skin: SKIN[4], hair: HAIR.black, style: 'braids', topKind: 'tee', top: C.butter, bottom: C.denim }), pose: { ...POSES.sitBack, armN: [30, 130], armF: [40, 130], legN: [70, 20], legF: [60, 10], head: 20 }, hold: (gg, J) => { const cx = (J.hN[0] + J.hF[0]) / 2, cy = (J.hN[1] + J.hF[1]) / 2 - 6; gg.beginPath(); gg.rect(cx - 10, cy - 7, 20, 13); inkFill(gg, C.navy, LW); gg.fillStyle = C.butter; gg.fillRect(cx - 7, cy - 4, 8, 2); }, who: ['Imani, 14', 'Third graphic novel today. Her mother will pick her up at six; the library is open until eight.'] }); sb.draw(); });

  /* ── the copier ── */
  sc.add(I.depth(1590, 830), () => {
    box(g, I, 1550, 790, 0, 90, 70, 92, { top: C.ash, left: '#e9e6dd', right: '#cfcac0', lw: LW });
    box(g, I, 1556, 796, 92, 78, 58, 6, { top: C.grey, left: C.ash, right: C.grey, lw: LW });
    plane(g, I, 'y', 860, (gg) => { gg.rect(1560, 40, 60, 10); gg.rect(1560, 20, 60, 10); }, C.white, LW * 0.6);
    const [lx, ly] = I.p(1640, 830, 80); ellipse(g, lx, ly, 3, 3, 0, C.grass, 0.6);
  });
  ip(sc, I, who, 1595, 900, 0, { face: '-y', turn: 0.45, look: look(161, { fem: true, skin: SKIN[0], hair: HAIR.ginger, style: 'long', topKind: 'tee', top: C.sky, bottom: C.khaki }), pose: { ...POSES.cook, head: 18 }, who: ['Megan, 26', 'Copying forty LOST CAT flyers. Biscuit is orange, answers to nothing, and is probably fine.'] });
  sc.add(I.depth(1650, 1100), () => plant(g, I, 1650, 1100, 0, 130, LW, C.ochre, 7, 'bush'));
  sc.add(I.depth(1450, 1140), () => plant(g, I, 1450, 1140, 0, 110, LW, C.teal, 9, 'fern'));

  /* ── a globe ── */
  sc.add(I.depth(960, 360), () => {
    const x = 990, y = 300; box(g, I, x - 4, y - 4, 0, 8, 8, 80, { top: C.wood, left: C.wood, right: shade(C.wood, -0.2), lw: LW });
    const [gx, gy] = I.p(x, y, 108); ellipse(g, gx, gy, 28, 28, 0, '#8cc8e8', LW);
    g.save(); g.beginPath(); g.arc(gx, gy, 28, 0, TAU); g.clip(); g.fillStyle = C.grass; g.beginPath(); g.ellipse(gx - 9, gy - 7, 10, 15, 0.4, 0, TAU); g.fill(); g.beginPath(); g.ellipse(gx + 12, gy + 7, 8, 10, -0.3, 0, TAU); g.fill(); g.restore();
    ellipse(g, gx, gy, 28, 28, 0, null, LW);
    g.beginPath(); g.arc(gx, gy, 34, -2.4, 0.8); g.lineWidth = LW * 2.4; g.strokeStyle = C.ochre; g.stroke();
  });

  sc.draw();

  /* ── the title ── */
  g.fillStyle = '#1f3a36'; g.textAlign = 'left'; g.textBaseline = 'alphabetic';
  g.font = `600 58px "Cinzel", ${SERIF}`; g.fillText('The Reading Room', 80, 120);
  g.font = `italic 30px ${SERIF}`; g.fillText('A public library, a Tuesday, a little after four.', 82, 162);
  grain(g, W, H, 0.12, 9);
}

export const LIBRARY: Plate = {
  key: 'library', title: 'The Reading Room', place: 'A public library',
  blurb: 'A Carnegie-era reading room cut open: the long tables under green lamps, the computers, story time on the round rug, and the circulation desk, on an ordinary afternoon.',
  w: W, h: H, paint,
};
void rect; void withPlane; void phoneIn;
