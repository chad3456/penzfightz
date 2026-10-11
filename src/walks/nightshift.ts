/**
 * Night Shift — 3:10 in the morning, printed in one colour. A trench is cut
 * through a solid orange block and in it the city that does not close: a
 * diner, an emergency room, a parcel hub and a bakery. Everything is drawn
 * in colour first and then printed through a three-ink ramp, so it reads as
 * one ink on orange paper.
 */
import { type G, Iso, Scene, C, SKIN, HAIR, box, plane, onPlane, inkFill, ln, ellipse, SANS, SERIF, rng, TAU, INK, type Pt } from './kit';
import { POSES, randomLook, type Look, type Joints } from './people';
import { table, chair, monitor, laptop, bookStack, plant, tiles, floorShadow, wallText as wallTextFn } from './props';
import { type Plate, type Who, ip } from './stage';

const W = 2400, H = 1600, LW = 1.5, HT = 230, CELL = 50;
const look = (seed: number, o: Partial<Look>) => randomLook(seed, o);

/** The trench, as rectangles in centimetres. */
const RECTS: [number, number, number, number][] = [
  [0, 0, 1100, 560],      // diner
  [600, 560, 600, 700],   // emergency room
  [1200, 800, 1100, 550], // parcel hub
  [1800, 1350, 500, 500], // bakery
];
const inTrench = (x: number, y: number) => RECTS.some(([a, b, w, d]) => x >= a && x < a + w && y >= b && y < b + d);

/* the three inks: dark, the orange of the paper, and cream */
const DARK = [42, 18, 8], ORANGE = [242, 106, 27], CREAM = [255, 236, 214];
function duotone(g: G, w: number, h: number) {
  const im = g.getImageData(0, 0, w, h), d = im.data;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue;
    const L = (0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2]) / 255;
    // posterise a little so it prints like ink: dark, mid, light
    // dark ink below 0.2, the orange through the middle, cream only for the lightest things
    const t = L < 0.2 ? (L / 0.2) * 0.15 : L < 0.55 ? 0.15 + ((L - 0.2) / 0.35) * 0.4 : L < 0.8 ? 0.55 + ((L - 0.55) / 0.25) * 0.25 : 0.8 + ((L - 0.8) / 0.2) * 0.2;
    let c: number[];
    if (t < 0.5) { const k = t / 0.5; c = DARK.map((v, j) => v + (ORANGE[j] - v) * k); }
    else { const k = (t - 0.5) / 0.5; c = ORANGE.map((v, j) => v + (CREAM[j] - v) * k); }
    d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2];
  }
  g.putImageData(im, 0, 0);
}

function paint(g0: G, who: Who[]) {
  // draw the trench in colour on its own canvas, then print it
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d')!;
  const I = new Iso(600, 196, 0.68);
  const sc = new Scene(g);

  /* floors */
  for (const [a, b, w, d] of RECTS) plane(g, I, 'z', 0, (gg) => gg.rect(a, b, w, d), '#e9e2d6', LW);
  // the diner's checkerboard, the ER's sheet vinyl, the hub's concrete, the bakery's tiles
  tiles(g, I, 0, 0, 1100, 560, 40, '#f4efe6', '#2b2b30', LW);
  tiles(g, I, 600, 560, 600, 700, 100, '#dfe9e6', null, LW);
  tiles(g, I, 1200, 800, 1100, 550, 200, '#cfcac0', null, LW);
  tiles(g, I, 1800, 1350, 500, 500, 40, '#e9dcc6', '#d8c8ae', LW);
  // the far walls: every cell edge with solid on its far side
  for (let x = -CELL; x < 2400; x += CELL) for (let y = -CELL; y < 1700; y += CELL) {
    if (!inTrench(x + 1, y + 1)) continue;
    if (!inTrench(x + 1, y - CELL + 1)) plane(g, I, 'y', y, (gg) => gg.rect(x, 0, CELL, HT), '#f4e6d4', LW * 0.0001);
    if (!inTrench(x - CELL + 1, y + 1)) plane(g, I, 'x', x, (gg) => gg.rect(y, 0, CELL, HT), '#d9c6ae', LW * 0.0001);
  }
  // wall outlines and a skirting board, room by room
  for (const [a, b, w, d] of RECTS) {
    for (let x = a; x < a + w; x += CELL) if (!inTrench(x + 1, b - CELL + 1)) { plane(g, I, 'y', b, (gg) => gg.rect(x, 0, CELL, 12), '#8a7a6a', 0); }
    for (let y = b; y < b + d; y += CELL) if (!inTrench(a - CELL + 1, y + 1)) { plane(g, I, 'x', a, (gg) => gg.rect(y, 0, CELL, 12), '#6a5a4a', 0); }
  }
  /* ── the diner ── */
  plane(g, I, 'y', 0, (gg) => { for (let x = 0; x < 1100; x += 25) { gg.moveTo(x, 12); gg.lineTo(x, 110); } for (let z = 12; z <= 110; z += 25) { gg.moveTo(0, z); gg.lineTo(1100, z); } }, null, 0.5);
  g.strokeStyle = 'rgba(31,26,23,0.35)'; g.lineWidth = 0.7; g.stroke();
  plane(g, I, 'y', 0, (gg) => gg.rect(430, 125, 400, 80), '#2b2b30', LW);
  for (let i2 = 0; i2 < 3; i2++) for (let j2 = 0; j2 < 4; j2++) plane(g, I, 'y', 0, (gg) => gg.rect(450 + i2 * 128, 190 - j2 * 18, 70 + (j2 % 2) * 22, 6), '#fbfaf5', 0);
  plane(g, I, 'y', 0, (gg) => gg.rect(90, 140, 280, 60), '#2b2b30', LW);
  wallTextFn(g, I, 'y', 0, 230, 170, 'OPEN 24 HOURS', 40, `bold ${SANS}`, '#fbfaf5');
  plane(g, I, 'y', 0, (gg) => gg.ellipse(960, 170, 32, 32, 0, 0, TAU), '#fbfaf5', LW);
  onPlane(g, I, 'y', 0, (gg) => { gg.moveTo(960, 170); gg.lineTo(965, 195); gg.moveTo(960, 170); gg.lineTo(980, 172); }); g.strokeStyle = INK; g.lineWidth = LW * 1.4; g.stroke();
  // the back counter: griddle, coffee, pie case
  sc.add(I.depth(560, 30), () => {
    box(g, I, 100, 0, 0, 950, 55, 90, { top: '#9a9aa0', left: '#c9c9c4', right: '#a8a8a2', lw: LW });
    box(g, I, 140, 4, 90, 220, 46, 6, { top: '#2b2b30', left: '#5a5a60', right: '#3a3a40', lw: LW });
    for (let i2 = 0; i2 < 4; i2++) { const [px, py] = I.p(170 + i2 * 50, 26, 96); ellipse(g, px, py - 2, 13, 6, 0, '#f3dc8a', LW * 0.7); }
    for (let i2 = 0; i2 < 3; i2++) { const [px, py] = I.p(175 + i2 * 55, 26, 100); g.beginPath(); g.moveTo(px, py); g.bezierCurveTo(px - 10, py - 20, px + 10, py - 30, px, py - 46); g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 2; g.stroke(); }
    box(g, I, 420, 8, 90, 70, 40, 55, { top: '#c9c9c4', left: '#9a9aa0', right: '#7a7a80', lw: LW });
    const [cx, cy] = I.p(455, 50, 100); ellipse(g, cx, cy, 9, 5, 0, '#5a3826', LW);
    box(g, I, 700, 6, 90, 150, 46, 60, { top: '#dfeef0', left: '#cfe7ec', right: '#b8d8e0', lw: LW });
    for (let i2 = 0; i2 < 3; i2++) { const [px, py] = I.p(730 + i2 * 42, 30, 112); ellipse(g, px, py, 13, 6, 0, '#e3b23c', LW * 0.8); }
  });
  ip(sc, I, who, 250, 90, 0, { face: '-y', turn: 0.4, look: look(502, { fem: false, skin: SKIN[3], hair: HAIR.black, style: 'buzz', topKind: 'tee', top: C.white, bottom: C.char, apron: '#f4efe6', hat: { kind: 'band', color: C.white } }), pose: POSES.cook, who: ['Chuy, 47', 'Night cook, twenty-two years. Can crack two eggs in each hand and remembers how every regular takes their hash browns.'] });
  ip(sc, I, who, 600, 100, 0, { face: '+y', turn: 0.45, look: look(503, { fem: true, age: 'old', skin: SKIN[0], hair: HAIR.ash, style: 'bun', topKind: 'dress', top: '#bfe3c8', bottom: '#bfe3c8', apron: C.white, glasses: true }), pose: { ...POSES.point, armF: [70, 100] }, hold: (gg: G, J: Joints) => { const [x, y] = J.hF; gg.beginPath(); gg.ellipse(x + 6 * J.fwd, y + 4, 9, 11, 0, 0, TAU); inkFill(gg, '#3a3a40', LW); ln(gg, x + 12 * J.fwd, y + 12, x + 14 * J.fwd, y + 26, 2, '#5a3826'); }, mood: 'smile', who: ['Marlene, 63', 'Has poured coffee here since 1987. Calls everyone honey and means it. Knows who is going through something before they sit down.'] });
  // the front counter and its stools
  sc.add(I.depth(600, 165), () => {
    box(g, I, 150, 130, 0, 900, 65, 100, { top: '#9a9aa0', left: '#c9c9c4', right: '#a8a8a2', lw: LW });
    plane(g, I, 'y', 195, (gg) => gg.rect(150, 0, 900, 12), '#5a5a60', 0);
    for (const x of [320, 680, 920]) { const [px, py] = I.p(x, 160, 100); ellipse(g, px, py - 3, 10, 5, 0, C.white, LW); g.beginPath(); g.rect(px - 5, py - 12, 10, 9); inkFill(g, C.white, LW); }
    const [px, py] = I.p(560, 160, 100); ellipse(g, px, py - 2, 16, 7, 0, C.white, LW); g.beginPath(); g.moveTo(px - 12, py - 6); g.lineTo(px, py - 14); g.lineTo(px + 12, py - 6); g.closePath(); inkFill(g, '#c9433a', LW * 0.8);
    laptop(g, I, 920, 165, 100, LW, '-y', '#9a9aa0');
  });
  for (const x of [200, 320, 440, 560, 680, 800, 920]) sc.add(I.depth(x, 232), () => { const [px, py] = I.p(x, 235, 0), [tx, ty] = I.p(x, 235, 66); ln(g, px, py, tx, ty, LW * 2.4); ln(g, px, py, tx, ty, LW, '#c9c9c4'); ellipse(g, tx, ty, 17, 8, 0, '#c9433a', LW); });
  const counterFolks: [number, Partial<Look>, string, string][] = [
    [320, { fem: false, skin: SKIN[1], hair: HAIR.brown, style: 'short', topKind: 'jacket', top: '#4a6fa5', inner: C.white, bottom: C.denim, hat: { kind: 'cap', color: C.red }, beard: true }, 'Bud, 58', 'Long-haul, Memphis to Newark with a trailer of oranges. Coffee, black, and the meatloaf, at three in the morning, because his body stopped knowing what time it is in 1994.'],
    [560, { fem: true, skin: SKIN[5], hair: HAIR.black, style: 'ponytail', topKind: 'scrubs', top: '#6cc0b0', bottom: '#6cc0b0' }, 'Tamika, 33', 'Respiratory therapist, two hours left on a twelve. On her break, with a slice of cherry pie and her eyes closed for exactly four minutes.'],
    [680, { fem: false, skin: SKIN[3], hair: HAIR.black, style: 'short', topKind: 'shirt', top: '#2c3f6b', accent: '#2c3f6b', bottom: '#2c3f6b' }, 'Officer Reyes, 29', 'Grew up four blocks from here. Comes in at three every night shift; Marlene saves him the corner of the coffee cake.'],
    [920, { fem: false, age: 'teen', skin: SKIN[0], hair: HAIR.blond, style: 'curly', topKind: 'hoodie', top: C.mustard, bottom: C.khaki }, 'Cody, 19', 'Writing a paper due at nine on a laptop with eleven per cent battery. Has ordered fries three times so they won’t ask him to leave. They would never ask him to leave.'],
  ];
  for (const [x, lk, n, l] of counterFolks) ip(sc, I, who, x, 235, 66, { face: '-y', turn: 0.4, look: look(510 + x, lk), pose: POSES.sitDesk, who: [n, l], depth: I.depth(x, 236) });
  // a booth on the left wall
  sc.add(I.depth(40, 220), () => {
    box(g, I, 0, 140, 0, 50, 170, 45, { top: '#c9433a', left: '#a9302a', right: '#8a2420', lw: LW });
    box(g, I, 0, 140, 45, 14, 170, 70, { top: '#c9433a', left: '#a9302a', right: '#b9382f', lw: LW });
    const s2 = new Scene(g);
    ip(s2, I, who, 32, 225, 45, { face: '+x', turn: 0.55, look: look(501, { fem: true, skin: SKIN[2], hair: HAIR.black, style: 'long', topKind: 'jacket', top: '#3a3a40', inner: C.red, bottom: C.denim }), pose: POSES.sitDesk, who: ['Daniela, 22', 'Just off a double at the airport. Pancakes at three in the morning are the best pancakes there are, and she will fight you on this.'] });
    s2.draw();
    table(g, I, 64, 170, 70, 110, 74, '#e9e2d6', LW);
    const [px, py] = I.p(98, 225, 74); ellipse(g, px, py, 16, 7, 0, C.white, LW); for (let k = 0; k < 3; k++) ellipse(g, px, py - 3 - k * 3, 11, 5, 0, '#e0c08a', LW * 0.6);
  });

  /* ── the emergency room ── */
  sc.add(I.depth(800, 560) - 300, () => { box(g, I, 600, 556, 0, 220, 8, HT, { top: '#4a3a30', left: '#f4e6d4', right: '#d9c6ae', lw: LW }); box(g, I, 990, 556, 0, 110, 8, HT, { top: '#4a3a30', left: '#f4e6d4', right: '#d9c6ae', lw: LW }); });
  sc.add(I.depth(605, 600), () => {
    for (let k = 0; k < 2; k++) { const y0 = 600 + k * 200; plane(g, I, 'x', 600, (gg) => gg.rect(y0, 200, 180, 5), '#9a9aa0', LW); for (let i2 = 0; i2 < 7; i2++) plane(g, I, 'x', 600, (gg) => { gg.moveTo(y0 + i2 * 25, 200); gg.quadraticCurveTo(y0 + i2 * 25 + 12, 60, y0 + i2 * 25 + 4, 30); gg.lineTo(y0 + i2 * 25 + 25, 30); gg.quadraticCurveTo(y0 + i2 * 25 + 36, 120, y0 + i2 * 25 + 25, 200); gg.closePath(); }, i2 % 2 ? '#bfe3c8' : '#a8d4b8', LW * 0.6); }
  });
  ip(sc, I, who, 830, 615, 0, { face: '+y', turn: 0.35, look: look(521, { fem: true, skin: SKIN[1], hair: HAIR.black, style: 'bob', topKind: 'scrubs', top: '#2c3f6b', bottom: '#2c3f6b', lanyard: C.red }), pose: { ...POSES.phone, head: 30 }, eyes: 'down', hold: (gg: G, J: Joints) => { const [x, y] = J.hN; gg.beginPath(); gg.roundRect(x - 4, y - 10, 8, 13, 1.5); inkFill(gg, '#2b2b30', LW); }, who: ['Joy, 44', 'Charge nurse. Fourteen beds, nine patients, two ambulances on the way, one vending machine that only takes exact change.'] });
  sc.add(I.depth(830, 680), () => {
    box(g, I, 700, 650, 0, 260, 60, 105, { top: '#cfcac0', left: '#e9e6dd', right: '#cfcac0', lw: LW });
    monitor(g, I, 780, 675, 105, LW, '-y', () => {}); monitor(g, I, 890, 675, 105, LW, '-y', () => {});
    bookStack(g, I, 730, 680, 105, 3, LW, 7);
  });
  ip(sc, I, who, 700, 790, 0, { face: '-y', turn: 0.35, look: look(522, { fem: false, skin: SKIN[2], hair: HAIR.black, style: 'side', topKind: 'coat', top: C.white, bottom: '#6cc0b0', glasses: true, lanyard: C.blue }), pose: { ...POSES.cradle, head: 30 }, hold: (gg: G, J: Joints) => { const cx = (J.hN[0] + J.hF[0]) / 2, cy = (J.hN[1] + J.hF[1]) / 2 - 4; gg.beginPath(); gg.rect(cx - 8, cy - 10, 16, 20); inkFill(gg, '#9a5b34', LW); gg.beginPath(); gg.rect(cx - 6, cy - 8, 12, 15); inkFill(gg, C.white, LW * 0.6); }, who: ['Dr. Raman, 36', 'Second-year resident, twenty-two hours awake. Fluent in five languages, two of them medical; the one he is thinking in right now is Tamil.'] });
  sc.add(I.depth(860, 880), () => {
    box(g, I, 760, 850, 0, 190, 64, 6, { top: '#9a9aa0', left: '#7a7a80', right: '#7a7a80', lw: LW });
    for (const [x, y] of [[770, 858], [940, 858], [770, 906], [940, 906]]) { const a = I.p(x, y, 6), b = I.p(x, y, 66); ln(g, a[0], a[1], b[0], b[1], LW * 1.6); ellipse(g, a[0], a[1], 5, 4, 0, '#3a3a40', LW * 0.6); }
    box(g, I, 760, 850, 66, 190, 64, 12, { top: '#f4efe6', left: '#dfeef0', right: '#cfe7ec', lw: LW });
    // the patient, under a blanket, head on the pillow
    box(g, I, 770, 858, 78, 40, 48, 10, { top: '#fbfaf5', left: '#e9e6dd', right: '#dfdbd0', lw: LW });
    const [hx, hy] = I.p(792, 882, 96); ellipse(g, hx, hy, 9, 10, 0, SKIN[4], LW);
    g.beginPath(); g.arc(hx - 1, hy - 3, 9, Math.PI * 1.05, Math.PI * 1.95); g.lineWidth = LW * 2.6; g.strokeStyle = HAIR.grey; g.stroke();
    ln(g, hx + 2, hy - 1, hx + 5, hy - 1, LW * 0.8); ln(g, hx - 4, hy - 1, hx - 1, hy - 1, LW * 0.8);
    who.push({ x: hx, y: hy, r: 30, name: 'Mr. Delgado, 81', line: 'Chest pains at two; it is his gallbladder, which is good news, and his daughter is driving up from Philadelphia.' });
    box(g, I, 806, 853, 78, 140, 58, 16, { top: '#bfe0e8', left: '#a8cfdb', right: '#9ac4d2', lw: LW });
  });
  ip(sc, I, who, 990, 880, 0, { face: '-x', turn: 0.5, look: look(524, { fem: true, skin: SKIN[3], hair: HAIR.dark, style: 'ponytail', topKind: 'jacket', top: '#2c3f6b', inner: C.white, bottom: '#2c3f6b', shoes: C.black }), pose: { ...POSES.carry, lean: 16, armN: [62, 72], armF: [66, 74] }, who: ['Lupe, 31', 'Paramedic. Her fourth run since midnight. She held Mr. Delgado’s hand the whole way in and told him about her grandmother’s gallbladder.'] });
  for (const y of [870, 940]) sc.add(I.depth(630, y) - 1, () => chair(g, I, 630, y, '+x', '#4a6fa5', LW));
  ip(sc, I, who, 630, 940, 45, { face: '+x', turn: 0.55, look: look(525, { fem: false, skin: SKIN[5], hair: HAIR.black, style: 'short', topKind: 'hoodie', top: C.grey, bottom: C.char, beard: true }), pose: { ...POSES.cradle, sit: true, legN: [86, 2], legF: [82, -4], head: 30 }, eyes: 'closed', hold: (gg: G, J: Joints) => { const cx = (J.hN[0] + J.hF[0]) / 2, cy = (J.hN[1] + J.hF[1]) / 2 - 6; gg.beginPath(); gg.ellipse(cx, cy, 15, 10, -0.3, 0, TAU); inkFill(gg, '#f0a3c4', LW); ellipse(gg, cx + 10 * J.fwd, cy - 6, 6, 6, 0, SKIN[5], LW); }, who: ['Andre, 30, and Kiara, 3', 'Her fever broke an hour ago. They are waiting to be told they can go home. Both asleep.'] });
  ip(sc, I, who, 630, 870, 45, { face: '+x', turn: 0.55, look: look(526, { fem: false, skin: SKIN[0], hair: HAIR.ginger, style: 'short', topKind: 'tee', top: C.green, bottom: C.denim, beard: 'stubble' }), pose: { ...POSES.sit, armN: [40, 100], armF: [30, 110] }, mood: 'frown', hold: (gg: G, J: Joints) => { const [x, y] = J.hN; gg.beginPath(); gg.ellipse(x, y - 4, 10, 7, 0, 0, TAU); inkFill(gg, '#cfe7ec', LW); }, who: ['Kyle, 26', 'Kitchen knife, a bagel, 2:15 a.m. Seven stitches. Will never cut a bagel toward his hand again.'] });

  /* ── the parcel hub ── */
  wallTextFn(g, I, 'y', 800, 1700, 200, '1,204 DAYS WITHOUT AN ACCIDENT', 34, `bold ${SANS}`, '#2b2b30');
  sc.add(I.depth(1650, 825), () => {
    for (let i2 = 0; i2 < 3; i2++) { const x0 = 1260 + i2 * 260; for (const z of [0, 70, 140]) box(g, I, x0, 805, z, 230, 50, 4, { top: '#9a9aa0', left: '#7a7a80', right: '#7a7a80', lw: LW }); const R = rng(i2 + 11); for (const z of [4, 74]) { let u = x0 + 6; while (u < x0 + 210) { const w = 24 + R() * 30, h = 26 + R() * 34; box(g, I, u, 810, z, w, 38, Math.min(h, 64), { top: '#e0c08a', left: '#c9a070', right: '#b08a5a', lw: LW * 0.6 }); u += w + 4; } } }
  });
  sc.add(I.depth(1700, 935), () => {
    box(g, I, 1260, 900, 0, 840, 70, 80, { top: '#3a3a40', left: '#9a9aa0', right: '#7a7a80', lw: LW });
    onPlane(g, I, 'z', 80, (gg) => { for (let x = 1270; x < 2100; x += 20) { gg.moveTo(x, 902); gg.lineTo(x, 968); } }); g.strokeStyle = 'rgba(255,255,255,0.25)'; g.lineWidth = 1; g.stroke();
    const R = rng(4); let x = 1280;
    while (x < 2060) { const w = 30 + R() * 45, d = 30 + R() * 30, h = 18 + R() * 34; box(g, I, x, 915 + R() * 10, 80, w, d, h, { top: '#e0c08a', left: '#c9a070', right: '#b08a5a', lw: LW * 0.8 }); x += w + 26 + R() * 40; }
  });
  const hub: [number, number, string, string, Partial<Look>, keyof typeof POSES, ('+y' | '-y' | '+x' | '-x')][] = [
    [1420, 1010, 'Ahmed, 52', 'Engineer in Cairo; here, eleven years on the sort line. Sends his daughter’s tuition home on the fifteenth of every month. She is going to be an engineer too.', { fem: false, skin: SKIN[3], hair: HAIR.black, style: 'balding', beard: true }, 'cook', '-y'],
    [1640, 1010, 'Brianna, 24', 'Scans eighteen hundred parcels a night and listens to whole audiobooks doing it. This month: everything ever written about octopuses.', { fem: true, skin: SKIN[5], hair: HAIR.black, style: 'braids', hat: { kind: 'headphones', color: C.char } }, 'cook', '-y'],
    [1860, 1020, 'Tran, 41', 'Lead on the sort. Can tell from the weight of a box what is in it. Will not tell you what is in it.', { fem: false, skin: SKIN[1], hair: HAIR.black, style: 'short' }, 'carry', '+x'],
  ];
  for (const [x, y, n, l, o, ps, f] of hub) ip(sc, I, who, x, y, 0, { face: f, turn: 0.45, look: look(530 + x, { topKind: 'tee', top: C.grey, bottom: C.navy, apron: '#ffd25a', ...o } as Partial<Look>), pose: POSES[ps], who: [n, l], hold: ps === 'carry' ? (gg: G, J: Joints) => { const cx = (J.hN[0] + J.hF[0]) / 2, cy = (J.hN[1] + J.hF[1]) / 2 - 6; gg.beginPath(); gg.rect(cx - 14, cy - 12, 28, 22); inkFill(gg, '#e0c08a', LW); } : undefined });
  // the forklift, and Gloria in it
  sc.add(I.depth(1290, 1040), () => {
    const x0 = 1220, y0 = 990;
    box(g, I, x0, y0, 0, 110, 80, 60, { top: '#ffd25a', left: '#e3b23c', right: '#c99a2a', lw: LW });
    for (const y of [y0, y0 + 80]) { const [ax, ay] = I.p(x0 + 25, y, 20), [bx, by] = I.p(x0 + 90, y, 20); ellipse(g, ax, ay, 11, 11, 0, '#2b2b30', LW); ellipse(g, bx, by, 11, 11, 0, '#2b2b30', LW); }
    const s2 = new Scene(g);
    ip(s2, I, who, x0 + 45, y0 + 40, 60, { face: '+x', turn: 0.55, look: look(560, { fem: true, skin: SKIN[2], hair: HAIR.dark, style: 'short', glasses: true, topKind: 'tee', top: C.grey, bottom: C.navy, apron: '#ffd25a' }), pose: POSES.sitDesk, who: ['Gloria, 58', 'Forklift, thirty-one years, no accidents. That sign on the wall is about her, and she is not shy about it.'] });
    s2.draw();
    for (const [a, b] of [[[x0, y0, 60], [x0, y0, 190]], [[x0, y0 + 80, 60], [x0, y0 + 80, 190]], [[x0 + 80, y0, 60], [x0 + 80, y0, 190]], [[x0 + 80, y0 + 80, 60], [x0 + 80, y0 + 80, 190]]] as [[number, number, number], [number, number, number]][]) { const p1 = I.p(...a), p2 = I.p(...b); ln(g, p1[0], p1[1], p2[0], p2[1], LW * 2.4); ln(g, p1[0], p1[1], p2[0], p2[1], LW, '#3a3a40'); }
    plane(g, I, 'z', 190, (gg) => gg.rect(x0, y0, 80, 80), '#3a3a40', LW);
    box(g, I, x0 + 110, y0 + 10, 0, 8, 60, 160, { top: '#3a3a40', left: '#5a5a60', right: '#3a3a40', lw: LW });
    box(g, I, x0 + 118, y0 + 10, 20, 50, 60, 5, { top: '#9a9aa0', left: '#7a7a80', right: '#7a7a80', lw: LW });
    box(g, I, x0 + 120, y0 + 12, 25, 46, 56, 40, { top: '#e0c08a', left: '#c9a070', right: '#b08a5a', lw: LW });
  });

  /* ── the bakery ── */
  sc.add(I.depth(1830, 1500), () => {
    box(g, I, 1800, 1380, 0, 80, 280, 200, { top: '#3a3a40', left: '#9a9aa0', right: '#c9c9c4', lw: LW });
    for (const z of [26, 90, 154]) { plane(g, I, 'x', 1880, (gg) => gg.rect(1400, z, 240, 38), '#2b2b30', LW); plane(g, I, 'x', 1880, (gg) => gg.rect(1410, z + 6, 220, 26), '#ffb347', LW * 0.6); }
  });
  sc.add(I.depth(2000, 1470), () => {
    table(g, I, 1940, 1420, 110, 110, 88, '#e9dcc6', LW, { leg: '#9a6440' });
    plane(g, I, 'z', 88, (gg) => { gg.ellipse(1975, 1460, 26, 16, 0, 0, TAU); gg.ellipse(2015, 1490, 22, 14, 0.3, 0, TAU); }, '#fbf6ea', LW);
    for (let i2 = 0; i2 < 16; i2++) { const R = rng(i2); const [px, py] = I.p(1945 + R() * 100, 1425 + R() * 100, 88); ellipse(g, px, py, 1.6, 1, 0, '#fbfaf5', 0); }
  });
  ip(sc, I, who, 1995, 1570, 0, { face: '-y', turn: 0.4, look: look(541, { fem: true, skin: SKIN[0], hair: HAIR.blond, style: 'bun', topKind: 'tee', top: C.white, bottom: '#c9c9c4', apron: '#f4efe6' }), pose: { ...POSES.cook, armN: [50, 80], armF: [60, 84] }, who: ['Inge, 49', 'Started baking at three a.m. in Hamburg when she was sixteen. Moved here, kept the hours. The rye is her grandmother’s.'] });
  ip(sc, I, who, 1915, 1470, 0, { face: '-x', turn: 0.5, look: look(542, { fem: false, skin: SKIN[4], hair: HAIR.black, style: 'short', topKind: 'tee', top: C.white, bottom: C.char, apron: '#f4efe6', hat: { kind: 'band', color: C.white } }), pose: { ...POSES.point, armF: [80, 92], armN: [60, 80], lean: 6 }, hold: (gg: G, J: Joints) => { const [x, y] = J.hF; ln(gg, x - 40 * J.fwd, y + 20, x + 60 * J.fwd, y - 10, LW * 3.6); ln(gg, x - 40 * J.fwd, y + 20, x + 60 * J.fwd, y - 10, LW * 1.6, '#c9a070'); gg.beginPath(); gg.ellipse(x + 70 * J.fwd, y - 14, 18, 8, -0.3 * J.fwd, 0, TAU); inkFill(gg, '#c9a070', LW); gg.beginPath(); gg.ellipse(x + 70 * J.fwd, y - 18, 12, 6, -0.3 * J.fwd, 0, TAU); inkFill(gg, '#a8703e', LW); }, who: ['Kofi, 34', 'Pulls four hundred loaves before the sun comes up. Learned to bake in the Army. The bakery opens at six; there is always a line by five-forty.'] });
  sc.add(I.depth(2020, 1375), () => { for (let i2 = 0; i2 < 3; i2++) box(g, I, 2000 + (i2 % 2) * 14, 1360, i2 * 24, 60, 44, 24, { top: '#f4efe6', left: '#e9e2d6', right: '#d8cfc0', lw: LW }); });

  /* ── the cleaner, between the ER and the hub ── */
  ip(sc, I, who, 1120, 960, 0, { face: '+x', turn: 0.5, look: look(551, { fem: true, age: 'old', skin: SKIN[2], hair: HAIR.grey, style: 'bun', topKind: 'tee', top: '#5c6f86', bottom: '#5c6f86' }), pose: POSES.sweep, hold: (gg: G, J: Joints) => { const [x, y] = J.hF; ln(gg, x - 10 * J.fwd, y - 20, x + 34 * J.fwd, y + 70, LW * 3); ln(gg, x - 10 * J.fwd, y - 20, x + 34 * J.fwd, y + 70, LW * 1.2, '#c9a070'); gg.beginPath(); gg.ellipse(x + 38 * J.fwd, y + 72, 16, 5, 0, 0, TAU); inkFill(gg, '#e9e2d6', LW); }, who: ['Rosario, 61', 'Cleans the ER and the hub, eleven to seven. Sings boleros under her breath. The night nurses request them.'] });
  sc.add(I.depth(1080, 930), () => { box(g, I, 1060, 900, 0, 46, 38, 56, { top: '#ffd25a', left: '#e3b23c', right: '#c99a2a', lw: LW }); });
  void plant; void floorShadow;

  sc.draw();

  // print it in one ink
  duotone(g, W, H);

  /* the solid block, over everything outside the trench (its near walls hide what is behind them) */
  g0.fillStyle = `rgb(${ORANGE.join(',')})`; g0.fillRect(0, 0, W, H);
  g0.drawImage(cv, 0, 0);
  // the top surface: everything but the trench mouth at height HT
  g0.save(); g0.beginPath(); g0.rect(0, 0, W, H);
  for (const [a, b, w, d] of RECTS) { const p = [I.p(a, b, HT), I.p(a + w, b, HT), I.p(a + w, b + d, HT), I.p(a, b + d, HT)]; g0.moveTo(...p[0]); g0.lineTo(...p[3]); g0.lineTo(...p[2]); g0.lineTo(...p[1]); g0.closePath(); }
  g0.fillStyle = `rgb(${ORANGE.join(',')})`; g0.fill('nonzero'); g0.restore();
  // ink the edges of the mouth
  for (let x = -CELL; x < 2400; x += CELL) for (let y = -CELL; y < 1700; y += CELL) {
    if (!inTrench(x + 1, y + 1)) continue;
    const e = (a: Pt, b: Pt) => ln(g0, a[0], a[1], b[0], b[1], LW * 1.3, '#2a1208');
    if (!inTrench(x + 1, y - CELL + 1)) e(I.p(x, y, HT), I.p(x + CELL, y, HT));
    if (!inTrench(x - CELL + 1, y + 1)) e(I.p(x, y, HT), I.p(x, y + CELL, HT));
    if (!inTrench(x + 1, y + CELL + 1)) e(I.p(x, y + CELL, HT), I.p(x + CELL, y + CELL, HT));
    if (!inTrench(x + CELL + 1, y + 1)) e(I.p(x + CELL, y, HT), I.p(x + CELL, y + CELL, HT));
  }
  // the title, cut in cream
  g0.fillStyle = `rgb(${CREAM.join(',')})`; g0.textAlign = 'left';
  g0.font = `600 80px "Cinzel", ${SERIF}`; g0.fillText('Night Shift', 1560, 170);
  g0.font = `italic 34px ${SERIF}`; g0.fillText('3:10 a.m. The city that does not close.', 1562, 220);
  g0.fillStyle = 'rgba(42,18,8,0.7)'; g0.font = `600 22px "Cinzel", ${SERIF}`; g0.fillText('A DINER · AN ER · A PARCEL HUB · A BAKERY', 1562, 264);
  grainTint(g0);
}

function grainTint(g: G) {
  // a fine darker speckle, the paper's tooth
  const R = rng(31); g.fillStyle = 'rgba(42,18,8,0.08)';
  for (let i = 0; i < 26000; i++) g.fillRect(R() * W, R() * H, 1.2, 1.2);
  g.fillStyle = 'rgba(255,236,214,0.08)'; for (let i = 0; i < 20000; i++) g.fillRect(R() * W, R() * H, 1.2, 1.2);
}

export const NIGHTSHIFT: Plate = {
  key: 'nightshift', title: 'Night Shift', place: 'A city at 3 a.m.',
  blurb: 'One ink on orange: a trench cut through the night with a 24-hour diner, an emergency room, a parcel hub and a bakery in it, and the people who keep the city running while it sleeps.',
  w: W, h: H, paint,
};
