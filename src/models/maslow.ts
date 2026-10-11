/**
 * The Hierarchy of Needs — Abraham Maslow, "A Theory of Human Motivation"
 * (1943), drawn as the pyramid it later became: a stepped house of five
 * floors, food and rest on the ground floor, safety above it, then
 * belonging, then esteem, and on the roof, under the open sky, becoming
 * who you are.
 */
import { type G, C, HAIR, SKIN, INK, inkFill, ellipse, ln, rng, shade, grain, rect, TAU, SERIF } from '../walks/kit';
import { POSES, randomLook, type Look, type Joints } from '../walks/people';
import { dog } from '../walks/props';
import { type Plate, type Who } from '../walks/stage';
import { W, H, titlePanel, keyPanel, badge, CINZEL } from './note';
import { rp, backText, PRoom, Scene } from './rooms';

const look = (seed: number, o: Partial<Look>) => randomLook(seed, o);
const LW = 2.1, GROUND = 1520, FH = 236, CXM = 1300;
const WIDTHS = [1700, 1400, 1110, 830, 560];
const FILL = ['#7aa86a', '#5d8fc4', '#e8894a', '#9a7ac8', '#e3b23c'];

const NOTES = [
  { n: 1, title: 'Physiological', gloss: 'Food, water, warmth, sleep.', line: 'The ground floor: food, water, warmth, rest. Maslow argued that a person who is starving thinks of little but food; until these are met, the floors above barely register.' },
  { n: 2, title: 'Safety', gloss: 'A lock on the door, health, money for the rent.', line: 'Security of body, health, work and home: a door that locks, a doctor, savings for a bad month, predictability.' },
  { n: 3, title: 'Love & belonging', gloss: 'Friends, family, a table to sit at.', line: 'Friendship, family, intimacy, being part of something. Maslow placed the pain of loneliness and rejection here.' },
  { n: 4, title: 'Esteem', gloss: 'Respect from others, and from yourself.', line: 'Two kinds: the respect, recognition and status that come from others, and the self-respect, competence and confidence that come from within.' },
  { n: 5, title: 'Self-actualization', gloss: '“What a man can be, he must be.”', line: 'Becoming the most one can be: the painter painting, the scientist wondering. Maslow’s own line: “What a man can be, he must be.” Late in life he added self-transcendence beyond it.' },
  { n: 6, title: 'Not a ladder', gloss: 'Needs overlap; the order bends.', line: 'Maslow never drew a pyramid; others did, later. He wrote that needs are only partly satisfied at any time and that the order is not fixed: people risk safety for love, or go hungry for an idea. Research since supports universal needs more than a strict order.' },
];

function paint(g: G, who: Who[]) {
  // sky
  const sky = g.createLinearGradient(0, 0, 0, GROUND); sky.addColorStop(0, '#7fb6d8'); sky.addColorStop(1, '#f4dcb0');
  g.fillStyle = sky; g.fillRect(0, 0, W, H);
  ellipse(g, 2050, 360, 70, 70, 0, '#fff1c8', 0);
  for (const [x, y, w] of [[260, 520, 240], [1950, 640, 200], [500, 900, 160], [2100, 1000, 220]]) { g.fillStyle = 'rgba(255,250,240,0.85)'; g.beginPath(); g.roundRect(x, y, w, 26, 13); g.fill(); g.beginPath(); g.roundRect(x + w * 0.2, y - 16, w * 0.5, 26, 13); g.fill(); }
  // ground
  g.fillStyle = '#8cbf5a'; g.fillRect(0, GROUND, W, H - GROUND); ln(g, 0, GROUND, W, GROUND, LW);
  const Rg = rng(3); g.strokeStyle = '#6fa04a'; g.lineWidth = 2; for (let i = 0; i < 160; i++) { const x = Rg() * W, y = GROUND + 10 + Rg() * 70; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 3, y - 8); g.stroke(); }

  // the stepped building: five floors, each a cutaway room
  const rooms: PRoom[] = [];
  WIDTHS.forEach((w, i) => {
    const x0 = CXM - w / 2, y0 = GROUND - (i + 1) * FH;
    // the section around the room
    rect(g, x0 - 22, y0 - 10, w + 44, FH + 10, '#8a4a3a', LW);
    g.save(); g.beginPath(); g.rect(x0 - 22, y0 - 10, w + 44, FH + 10); g.clip(); g.strokeStyle = '#6e3a2c'; g.lineWidth = 1.2; g.beginPath(); for (let d = -400; d < w + 400; d += 13) { g.moveTo(x0 - 22 + d, y0 - 10); g.lineTo(x0 - 22 + d + FH, y0 + FH); } g.stroke(); g.restore();
    // the coloured floor slab with the floor's number painted on its face
    rect(g, x0 - 30, y0 + FH - 14, w + 60, 18, FILL[i], LW);
    rooms.push(new PRoom(x0, y0 + 4, w, FH - 18, 270, 330, 0.82, 0.45, 0.5));
  });
  // the roof parapet for the top floor (an open terrace)
  const roofY = GROUND - 5 * FH - 10;
  const paintRoom = (i: number, fn: (g: G, R: PRoom) => void) => { const R = rooms[i]; g.save(); g.beginPath(); g.rect(R.x, R.y, R.w, R.h); g.clip(); fn(g, R); g.restore(); rect(g, R.x, R.y, R.w, R.h, null, LW * 1.3); };

  /* 1 · physiological */
  paintRoom(0, (g, R) => {
    R.shell(g, { back: '#d8e8c8', left: '#c8dcb4', right: '#bcd2a6', floor: '#c9a070', ceil: '#e4efd8' }, LW);
    backText(g, R, R.Wc / 2, 220, 'FOOD · WATER · WARMTH · REST', 30, `600 {s}px ${CINZEL}`, '#4a6a3a');
    const sc = new Scene(g);
    sc.add(5, () => { R.box(g, 60, 520, 0, 60, 0, 88, { front: '#f4ecd6', lw: LW }); R.box(g, 56, 524, 0, 64, 88, 94, { front: '#7d2a3a', lw: LW }); R.box(g, 260, 380, 0, 62, 0, 92, { front: '#8a9a7a', lw: LW }); R.box(g, 280, 330, 26, 56, 92, 118, { front: '#3a3a40', lw: LW }); const [sx, sy] = R.p(305, 40, 124); for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(sx - 8 + k * 8, sy); g.bezierCurveTo(sx - 16 + k * 8, sy - 18, sx + k * 8, sy - 28, sx - 8 + k * 8, sy - 46); g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 2.4; g.stroke(); } });
    rp(sc, R, who, 330, 120, 0, { turn: -0.3, back: true, look: look(4001, { fem: false, skin: SKIN[4], hair: HAIR.black, style: 'short', topKind: 'tee', top: C.white, bottom: C.navy, apron: C.mustard }), pose: POSES.cook, who: ['Making dinner', 'Rice, beans and greens for four. Nothing upstairs gets much attention while anyone in this house is hungry.'] }, 120);
    sc.add(200, () => { R.box(g, 700, 960, 180, 260, 70, 76, { front: '#b97a45', lw: LW }); for (const X of [706, 950]) R.box(g, X, X + 6, 250, 260, 0, 70, { front: '#6b4128', lw: LW }); const [jx, jy] = R.p(780, 220, 76), k = R.k(220); g.beginPath(); g.moveTo(jx - 12 * k, jy); g.lineTo(jx - 14 * k, jy - 34 * k); g.lineTo(jx + 14 * k, jy - 34 * k); g.lineTo(jx + 12 * k, jy); g.closePath(); inkFill(g, '#cfe7ec', LW); const [bx, by] = R.p(880, 220, 76); ellipse(g, bx, by - 8 * k, 26 * k, 12 * k, 0, '#d2a679', LW); });
    rp(sc, R, who, 800, 300, 0, { turn: 0.3, look: look(4002, { fem: true, age: 'kid', skin: SKIN[4], hair: HAIR.black, style: 'afro', topKind: 'tee', top: C.coral, bottom: C.denim }), pose: { ...POSES.phone, armN: [10, 160], head: -10 }, hold: (gg: G, J: Joints) => { const [x, y] = J.hN; gg.beginPath(); gg.rect(x - 6, y - 16, 12, 18); inkFill(gg, '#cfe7ec', LW); }, who: ['A glass of water', 'Clean water from a tap: the most basic need there is, and one the whole house rests on.'] }, 300);
    // bed on the right, someone asleep
    sc.add(80, () => { R.box(g, 1500, 1960, 40, 260, 0, 40, { front: '#9a6440', lw: LW }); R.box(g, 1504, 1956, 44, 256, 40, 58, { front: '#f7f1df', lw: LW }); R.box(g, 1500, 1520, 40, 260, 0, 110, { front: '#7a4a2a', lw: LW }); R.box(g, 1530, 1640, 60, 120, 58, 72, { front: '#fbfaf5', lw: LW }); R.box(g, 1620, 1956, 50, 256, 58, 66, { front: '#5d8fc4', top: '#6f9fd0', lw: LW }); const [hx, hy] = R.p(1585, 100, 82), k = R.k(100); ellipse(g, hx, hy, 18 * k, 16 * k, 0, SKIN[1], LW); g.beginPath(); g.arc(hx, hy - 4 * k, 18 * k, Math.PI, TAU); g.fillStyle = HAIR.brown; g.fill(); g.lineWidth = LW; g.strokeStyle = INK; g.stroke(); g.font = `italic ${Math.round(28 * k)}px ${SERIF}`; g.fillStyle = '#4a6a3a'; g.fillText('z z z', hx + 30 * k, hy - 30 * k); who.push({ x: hx, y: hy, r: 40, name: 'Asleep after a night shift', line: 'Rest, warmth, a bed of one’s own. Without sleep, nothing on the higher floors goes well for long.' }); });
    // a radiator
    sc.add(10, () => { R.box(g, 1150, 1290, 0, 20, 10, 70, { front: '#e9e6dd', lw: LW }); for (let k = 0; k < 6; k++) { const a = R.p(1162 + k * 22, 20, 14), b = R.p(1162 + k * 22, 20, 66); ln(g, a[0], a[1], b[0], b[1], 1.4); } });
    sc.draw();
  });

  /* 2 · safety */
  paintRoom(1, (g, R) => {
    R.shell(g, { back: '#cfe0f0', left: '#bcd2e8', right: '#aec6e0', floor: '#9aa8b8', ceil: '#e0ecf6' }, LW);
    backText(g, R, R.Wc / 2, 225, 'SECURITY · HEALTH · A STEADY INCOME', 30, `600 {s}px ${CINZEL}`, '#2c4f7a');
    const sc = new Scene(g);
    // the front door with locks
    sc.add(1, () => { R.onBack(g, 120, 0, 300, 210, '#6b4128', LW); R.onBack(g, 136, 16, 284, 196, '#7a4a2a', LW * 0.7); for (const Z of [90, 120, 150]) { const [x, y] = R.p(270, 0, Z), k = R.k(0); ellipse(g, x, y, 7 * k, 7 * k, 0, '#e3b23c', 1.6); } const [cx, cy] = R.p(210, 0, 260), k = R.k(0); ellipse(g, cx, cy, 16 * k, 8 * k, 0, '#fbfaf5', 1.6); ellipse(g, cx, cy, 3 * k, 3 * k, 0, '#d9493f', 0); });
    rp(sc, R, who, 330, 60, 0, { turn: -0.55, back: false, look: look(4011, { fem: true, skin: SKIN[1], hair: HAIR.black, style: 'bob', topKind: 'coat', top: C.teal, bottom: C.char }), pose: { ...POSES.reach, armF: [110, 120], head: 4 }, who: ['Locking up', 'The door locks, the smoke alarm works, the street is safe enough to walk. Safety is mostly invisible until it is gone.'] }, 60);
    // the bills at the table
    sc.add(200, () => { R.box(g, 700, 1000, 160, 240, 70, 76, { front: '#e9dfc6', lw: LW }); for (const X of [706, 990]) R.box(g, X, X + 6, 230, 240, 0, 70, { front: '#9a6440', lw: LW }); const [jx, jy] = R.p(930, 200, 76), k = R.k(200); g.beginPath(); g.moveTo(jx - 14 * k, jy); g.lineTo(jx - 16 * k, jy - 36 * k); g.lineTo(jx + 16 * k, jy - 36 * k); g.lineTo(jx + 14 * k, jy); g.closePath(); inkFill(g, 'rgba(220,240,250,0.8)', LW); for (let i = 0; i < 6; i++) ellipse(g, jx - 8 * k + (i % 3) * 8 * k, jy - 6 * k - Math.floor(i / 3) * 7 * k, 5 * k, 3 * k, 0, '#e3b23c', 1); g.font = `bold ${Math.round(9 * k)}px Arial`; g.fillStyle = INK; g.textAlign = 'center'; g.fillText('RAINY DAY', jx, jy - 42 * k); g.textAlign = 'left'; for (let i = 0; i < 3; i++) { const [px, py] = R.p(760 + i * 40, 200, 76); g.beginPath(); g.rect(px - 14 * k, py - 6 * k, 26 * k, 14 * k); inkFill(g, '#fbfaf5', 1.2); } });
    rp(sc, R, who, 820, 270, 46, { turn: 0.15, back: true, look: look(4012, { fem: false, skin: SKIN[2], hair: HAIR.black, style: 'balding', topKind: 'sweater', top: C.mustard, bottom: C.khaki, glasses: true }), pose: POSES.sitDesk, who: ['Paying the rent', 'Rent paid, a little saved, insurance renewed. A steady income is a safety need: the floor above is hard to stand on if this one shakes.'] }, 270);
    sc.add(262, () => { R.box(g, 790, 850, 250, 290, 0, 44, { front: C.teal, lw: LW }); R.box(g, 790, 850, 286, 292, 44, 96, { front: C.teal, lw: LW }); });
    // first aid on the wall, a doctor's appointment card
    sc.add(2, () => { R.onBack(g, 1300, 110, 1380, 170, '#fbfaf5', LW); const [x, y] = R.p(1340, 0, 140), k = R.k(0); g.fillStyle = '#d9493f'; g.fillRect(x - 6 * k, y - 18 * k, 12 * k, 36 * k); g.fillRect(x - 18 * k, y - 6 * k, 36 * k, 12 * k); });
    rp(sc, R, who, 1340, 160, 0, { turn: -0.3, look: look(4013, { fem: true, age: 'old', skin: SKIN[3], hair: HAIR.grey, style: 'bun', topKind: 'blouse', top: C.lav, bottom: C.navy, bottomKind: 'skirt', glasses: true }), pose: { ...POSES.phone, head: 10 }, hold: (gg: G, J: Joints) => { const [x, y] = J.hN; gg.beginPath(); gg.roundRect(x - 6, y - 16, 12, 18, 2); inkFill(gg, '#3a3a40', LW); }, who: ['Booking a check-up', 'Health is on this floor too: a doctor who answers, medicine that is affordable.'] }, 160);
    sc.draw();
  });

  /* 3 · love and belonging */
  paintRoom(2, (g, R) => {
    R.shell(g, { back: '#f6d2b0', left: '#f0c49c', right: '#e8b88c', floor: '#b97a45', ceil: '#fae0c8' }, LW);
    backText(g, R, R.Wc / 2, 218, 'FRIENDS · FAMILY · BELONGING', 30, `600 {s}px ${CINZEL}`, '#8a3a1a');
    const sc = new Scene(g);
    // string lights
    sc.add(0, () => { const pts = Array.from({ length: 18 }, (_, i) => R.p(40 + i * 72, 0, 262 - Math.sin(i / 1.3) * 5)); g.beginPath(); g.moveTo(...pts[0]); for (const p of pts) g.lineTo(...p); g.lineWidth = 1; g.strokeStyle = INK; g.stroke(); pts.forEach((p, i) => { if (i % 2) ellipse(g, p[0], p[1] + 4, 4, 5, 0, ['#ffd25a', '#ff8a7a', '#9ae0c0'][i % 3], 1); }); });
    // the long table
    const T0 = 300, T1 = 1000;
    const seated: [number, number, Partial<Look>, [string, string] | undefined, 'smile' | 'open'][] = [
      [400, 150, { fem: true, skin: SKIN[5], hair: HAIR.black, style: 'braids', topKind: 'tee', top: C.red }, ['Sunday dinner', 'Friends, family, the people who would notice if you didn’t come. Maslow placed the ache of loneliness on this floor.'], 'open'],
      [600, 150, { fem: false, skin: SKIN[1], hair: HAIR.brown, style: 'short', topKind: 'shirt', top: C.sky }, undefined, 'smile'],
      [800, 150, { fem: true, age: 'old', skin: SKIN[2], hair: HAIR.white, style: 'bun', topKind: 'sweater', top: C.mustard }, ['Grandma', 'Has hosted this dinner every Sunday for thirty-one years. Attendance is not compulsory. Everyone comes.'], 'smile'],
      [930, 150, { fem: false, age: 'kid', skin: SKIN[3], hair: HAIR.black, style: 'curly', topKind: 'tee', top: C.green }, undefined, 'open'],
    ];
    for (const [X, d, lk, w2, m] of seated) { sc.add(d - 2, () => { R.box(g, X - 26, X + 26, d - 26, d + 4, 0, 44, { front: C.wood, lw: LW }); R.box(g, X - 26, X + 26, d - 30, d - 24, 44, 96, { front: C.wood, lw: LW }); }); rp(sc, R, who, X, d, 44, { turn: 0.05, look: look(4020 + X, { bottom: C.navy, ...lk }), pose: { ...POSES.sitDesk, lean: 4, head: -6, armF: [40, 80] }, mood: m, who: w2 }, d); }
    sc.add(220, () => { R.box(g, T0, T1, 170, 270, 70, 76, { front: '#f7f1df', top: '#fbf6e6', lw: LW }); for (const X of [T0 + 6, T1 - 12]) R.box(g, X, X + 6, 260, 270, 0, 70, { front: '#6b4128', lw: LW }); const k = R.k(220); for (let i = 0; i < 5; i++) { const [px, py] = R.p(380 + i * 140, 210, 76); ellipse(g, px, py, 22 * k, 9 * k, 0, '#fbfaf5', 1.4); ellipse(g, px, py - 2, 12 * k, 5 * k, 0, ['#e3584a', '#8cbf5a', '#e3b23c'][i % 3], 1); } const [cx, cy] = R.p(650, 230, 76); ellipse(g, cx, cy - 10 * k, 34 * k, 16 * k, 0, '#c97a4a', LW); });
    rp(sc, R, who, 1100, 260, 0, { turn: -0.4, look: look(4031, { fem: false, skin: SKIN[5], hair: HAIR.black, style: 'buzz', topKind: 'jacket', top: C.navy, inner: C.white, bottom: C.khaki, beard: true }), pose: { ...POSES.carry, armN: [60, 100] }, mood: 'open', hold: (gg: G, J: Joints) => { const cx = (J.hN[0] + J.hF[0]) / 2, cy = (J.hN[1] + J.hF[1]) / 2 - 6; ellipse(gg, cx, cy, 26, 10, 0, '#fbfaf5', LW); ellipse(gg, cx, cy - 8, 20, 9, 0, '#e3b23c', LW); }, who: ['Late, with pie', 'New in town. Was invited by a neighbour in March. Has not missed a Sunday since.'] }, 260);
    sc.add(300, () => { const [x, y] = R.p(160, 300, 0); dog(g, x, y, R.k(300) * 0.8, 1, '#c9a070', LW, { sit: true }); });
    sc.draw();
  });

  /* 4 · esteem */
  paintRoom(3, (g, R) => {
    R.shell(g, { back: '#ddd0f0', left: '#d0c0ea', right: '#c4b2e2', floor: '#8a7aa8', ceil: '#e8e0f6' }, LW);
    backText(g, R, R.Wc / 2, 232, 'RESPECT · ACHIEVEMENT · CONFIDENCE', 30, `600 {s}px ${CINZEL}`, '#4a2a7a');
    const sc = new Scene(g);
    sc.add(2, () => { R.onBack(g, 140, 120, 260, 200, '#e3b23c', LW); R.onBack(g, 152, 132, 248, 188, '#fbf6e6', LW * 0.6); backText(g, R, 200, 168, 'MASTER CARPENTER', 10, `600 {s}px ${CINZEL}`, INK); R.onBack(g, 300, 130, 360, 190, '#fbfaf5', LW); });
    // a chair she made, on a low plinth
    sc.add(160, () => { R.box(g, 420, 560, 120, 200, 0, 20, { front: '#6b4128', lw: LW }); const wd = '#d2a679'; R.box(g, 452, 528, 140, 150, 20, 130, { front: wd, lw: LW }); for (const X of [452, 520]) R.box(g, X, X + 8, 180, 190, 20, 62, { front: wd, lw: LW }); R.box(g, 448, 532, 144, 190, 62, 70, { front: wd, lw: LW }); for (const Z of [90, 112]) R.box(g, 452, 528, 150, 152, Z, Z + 6, { front: shade(wd, -0.15), lw: 1.4 }); });
    rp(sc, R, who, 640, 180, 0, { turn: -0.4, look: look(4041, { fem: true, skin: SKIN[4], hair: HAIR.black, style: 'afro', topKind: 'shirt', top: '#c9a070', bottom: C.navy, apron: '#8a5a3a' }), pose: { ...POSES.point, armF: [110, 120], head: -4 }, mood: 'smile', who: ['Finishing the chair', 'Twelve years of carpentry; her first piece in the city museum. Esteem has two halves: the pride she takes in it, and the respect it earns.'] }, 180);
    const clap = (X: number, d: number, seed: number, turn: number, w2?: [string, string]) => rp(sc, R, who, X, d, 0, { turn, look: look(seed, {}), pose: { ...POSES.cradle, armN: [40, 130], armF: [44, 134], head: 0 }, mood: 'open', who: w2 }, d);
    clap(150, 270, 4042, 0.4, ['Applause', 'Recognition from others: a colleague’s praise, a name on a plaque, a raise. It feeds the floor, but cannot build it alone.']); clap(270, 300, 4043, 0.3); clap(820, 280, 4044, -0.4);
    sc.draw();
  });

  /* 5 · self-actualization: an open terrace under the sky */
  paintRoom(4, (g, R) => {
    const sk = g.createLinearGradient(0, R.y, 0, R.y + R.h); sk.addColorStop(0, '#7fb6d8'); sk.addColorStop(1, '#bcd8ea');
    g.fillStyle = sk; g.fillRect(R.x, R.y, R.w, R.h);
    R.onFloor(g, 0, 0, R.Wc, R.D, '#e3c27a', LW);
    for (let i = 0; i <= 10; i++) { const a = R.p(i * R.Wc / 10, 0, 0), b = R.p(i * R.Wc / 10, R.D, 0); ln(g, a[0], a[1], b[0], b[1], 1, 'rgba(31,26,23,0.25)'); }
    // stars appearing and a few birds
    const Rs = rng(9); for (let i = 0; i < 14; i++) ellipse(g, R.x + Rs() * R.w, R.y + Rs() * R.h * 0.4, 2, 2, 0, '#fbfaf5', 0);
    const sc = new Scene(g);
    // the painter at an easel
    sc.add(150, () => { const L = (a: [number, number, number], b: [number, number, number]) => { const p = R.p(...a), q = R.p(...b); ln(g, p[0], p[1], q[0], q[1], LW * 2.6); ln(g, p[0], p[1], q[0], q[1], LW * 1.2, C.wood); }; L([180, 170, 0], [215, 160, 180]); L([250, 170, 0], [215, 160, 180]); R.box(g, 150, 280, 168, 174, 80, 175, { front: '#2c3f6b', lw: LW }); const [x0, y0] = R.p(156, 174, 170), [x1, y1] = R.p(274, 174, 86); g.fillStyle = '#e3b23c'; g.beginPath(); g.arc((x0 + x1) / 2, y0 + (y1 - y0) * 0.4, (x1 - x0) * 0.16, 0, TAU); g.fill(); g.fillStyle = '#e8894a'; g.fillRect(x0, y0 + (y1 - y0) * 0.7, x1 - x0, (y1 - y0) * 0.3); });
    rp(sc, R, who, 330, 220, 0, { turn: -0.6, look: look(4051, { fem: false, age: 'old', skin: SKIN[1], hair: HAIR.white, style: 'balding', topKind: 'shirt', top: '#fbfaf5', bottom: C.khaki, beard: true }), pose: { ...POSES.point, armF: [120, 130], head: -6 }, mood: 'smile', who: ['Painting, at seventy', 'Retired from forty years as an accountant; finally painting. Maslow: “What a man can be, he must be.”'] }, 220);
    // the stargazer with a telescope
    sc.add(200, () => { const a = R.p(560, 200, 0), b = R.p(560, 200, 80); ln(g, a[0], a[1], b[0], b[1], LW * 2); ln(g, a[0], a[1], a[0] - 30, a[1], LW * 2); ln(g, a[0], a[1], a[0] + 30, a[1], LW * 2); g.save(); g.translate(b[0], b[1]); g.rotate(-0.6); g.beginPath(); g.roundRect(-20, -10, 110, 20, 6); inkFill(g, '#d9493f', LW); g.restore(); });
    rp(sc, R, who, 500, 240, 0, { turn: 0.5, look: look(4052, { fem: true, age: 'teen', skin: SKIN[5], hair: HAIR.black, style: 'braids', topKind: 'hoodie', top: C.violet, bottom: C.denim }), pose: { ...POSES.reach, armF: [110, 120], head: -24 }, mood: 'o', who: ['Looking up', 'Sixteen, wants to be an astronomer, counting the moons of Jupiter. Curiosity for its own sake lives up here.'] }, 240);
    sc.draw();
  });
  // the parapet round the terrace
  { const w = WIDTHS[4], x0 = CXM - w / 2; rect(g, x0 - 22, roofY - 30, w + 44, 30, '#8a4a3a', LW); }
  // a flag on the roof
  { const x = CXM + WIDTHS[4] / 2 - 10; ln(g, x, roofY - 30, x, roofY - 200, LW * 1.6); g.beginPath(); g.moveTo(x, roofY - 200); g.lineTo(x + 90, roofY - 180); g.lineTo(x, roofY - 160); g.closePath(); inkFill(g, '#e3b23c', LW); }
  // a staircase climbing up the outside of the steps, with someone going up and someone coming down
  // (the floors are not a ladder; people move between them)
  for (let i = 0; i < 4; i++) {
    const xR = CXM + WIDTHS[i] / 2 + 22, xR2 = CXM + WIDTHS[i + 1] / 2 + 22, yb = GROUND - (i + 1) * FH - 10;
    ln(g, xR + 10, yb + 6, xR2 + 10 - 30 + 30, yb - FH + 6, 7); ln(g, xR + 10, yb + 6, xR2 + 10, yb - FH + 6, 4, '#8a4a3a');
    for (let k = 0; k < 7; k++) { const t = k / 7; rect(g, xR - (xR - xR2) * t - 30, yb - FH * t - 8, 60, 8, '#d8cbb0', 1.4); }
  }

  /* badges */
  WIDTHS.forEach((w, i) => { const x = CXM - w / 2 - 70, y = GROUND - i * FH - FH / 2; badge(g, who, x, y, NOTES[i], FILL[i]); });
  badge(g, who, 1640, 250, NOTES[5], '#3a3a40');

  titlePanel(g, { x: 50, y: 40, w: 800, title: 'The Hierarchy of Needs', def: 'Needs built on needs: the body first, then safety, love, esteem, and at the top, becoming what you can be.', credit: 'Abraham Maslow · “A Theory of Human Motivation”, 1943' });
  keyPanel(g, 1720, 40, 640, NOTES, { fill: (n) => n === 6 ? '#3a3a40' : FILL[n - 1] });
  grain(g, W, H, 0.1, 11);
  void shade;
}

export const MASLOW: Plate = {
  key: 'maslow', title: 'The Hierarchy of Needs', place: 'After Abraham Maslow',
  blurb: 'A stepped house of five floors: food and sleep on the ground, a lock and the rent above, Sunday dinner, a carpenter’s first museum piece, and on the open roof, a retired accountant painting and a girl at a telescope.',
  w: W, h: H, paint,
};
