/**
 * The Eisenhower Matrix — after a remark Dwight Eisenhower attributed to a
 * university president (1954): "What is important is seldom urgent and
 * what is urgent is seldom important." Popularised as a 2 × 2 by Stephen
 * Covey (1989). Four rooms of one house on a Tuesday evening: do it now,
 * schedule it, hand it to someone, or let it go.
 */
import { type G, C, HAIR, SKIN, INK, inkFill, ellipse, ln, rect, grain, TAU, SERIF } from '../walks/kit';
import { POSES, randomLook, type Look, type Joints } from '../walks/people';
import { dog } from '../walks/props';
import { type Plate, type Who } from '../walks/stage';
import { W, H, titlePanel, badge, CINZEL, wrap } from './note';
import { rp, backText, PRoom, Scene } from './rooms';

const look = (seed: number, o: Partial<Look>) => randomLook(seed, o);
const LW = 2;
const X0 = 300, Y0 = 220, RW = 1000, RH = 560, GAP = 40;
const COL = ['#e3584a', '#3f9a96', '#e3b23c', '#8a8f9a'];

const NOTES = [
  { n: 1, title: 'Do it now', gloss: 'Urgent and important.', line: 'Crises and real deadlines: the pan on fire, the child with a fever, the report due at nine tomorrow. These must be done, and done by you. A life lived only here is a life of firefighting.' },
  { n: 2, title: 'Schedule it', gloss: 'Important, not urgent.', line: 'The quadrant that decides how life goes: exercise, learning, sleep, relationships, planning, the slow work. Nothing makes it urgent, so it is the first to be squeezed out. Covey argued this is where effective people spend most of their time.' },
  { n: 3, title: 'Delegate it', gloss: 'Urgent, not important to you.', line: 'Interruptions that demand attention now but do not need you in particular: the doorbell, the routine call, the form someone else can fill in. Hand them on, batch them, or answer them briefly.' },
  { n: 4, title: 'Let it go', gloss: 'Neither urgent nor important.', line: 'The feed, the sixth episode, the argument in the comments. Some rest belongs in quadrant 2; this is the part that only fills time.' },
];

function paint(g: G, who: Who[]) {
  g.fillStyle = '#efe6d0'; g.fillRect(0, 0, W, H);
  const rooms = [0, 1, 2, 3].map((i) => new PRoom(X0 + (i % 2) * (RW + GAP), Y0 + Math.floor(i / 2) * (RH + GAP), RW, RH, 500, 360, 0.82, 0.42, 0.5));
  // the section of the house around the four rooms
  rect(g, X0 - 26, Y0 - 26, RW * 2 + GAP + 52, RH * 2 + GAP + 52, '#7a3e30', LW * 1.4);
  const paintRoom = (i: number, fn: (g: G, R: PRoom, sc: Scene) => void) => { const R = rooms[i]; g.save(); g.beginPath(); g.rect(R.x, R.y, R.w, R.h); g.clip(); const sc = new Scene(g); fn(g, R, sc); sc.draw(); g.restore(); rect(g, R.x, R.y, R.w, R.h, null, LW * 1.4); };

  /* 1 · urgent and important: the kitchen, the pan on fire */
  paintRoom(0, (g, R, sc) => {
    R.shell(g, { back: '#f4c2b0', left: '#efb39e', right: '#e8a48c', floor: '#d8c8ae', ceil: '#f8d6c8' }, LW);
    backText(g, R, R.Wc / 2, 245, 'DO IT NOW', 34, `600 {s}px ${CINZEL}`, '#a9302a');
    sc.add(5, () => { R.box(g, 40, 560, 0, 60, 0, 88, { front: '#f4ecd6', lw: LW }); R.box(g, 36, 564, 0, 64, 88, 94, { front: '#7d2a3a', lw: LW }); R.box(g, 240, 380, 0, 62, 0, 92, { front: '#8a9a7a', lw: LW }); R.box(g, 270, 350, 22, 56, 92, 104, { front: '#3a3a40', lw: LW });
      const [fx, fy] = R.p(310, 40, 106), k = R.k(40); for (const [dx, h, c] of [[-14, 50, '#ffb347'], [6, 70, '#e3584a'], [22, 44, '#ffd25a']] as [number, number, string][]) { g.beginPath(); g.moveTo(fx + dx * k - 14 * k, fy); g.quadraticCurveTo(fx + dx * k - 10 * k, fy - h * k * 0.6, fx + dx * k, fy - h * k); g.quadraticCurveTo(fx + dx * k + 10 * k, fy - h * k * 0.6, fx + dx * k + 14 * k, fy); g.closePath(); inkFill(g, c, 1.8); }
      R.onBack(g, 700, 140, 760, 180, '#fbfaf5', LW); const [ax, ay] = R.p(730, 0, 160), kk = R.k(0); ellipse(g, ax, ay, 8 * kk, 8 * kk, 0, '#e3584a', 1.4); });
    rp(sc, R, who, 470, 150, 0, { turn: -0.5, look: look(10001, { fem: true, skin: SKIN[4], hair: HAIR.black, style: 'bun', topKind: 'tee', top: C.navy, bottom: C.denim }), pose: { ...POSES.point, armF: [80, 90], armN: [60, 90], lean: 10 }, mood: 'open', hold: (gg: G, J: Joints) => { const [x, y] = J.hF; gg.beginPath(); gg.ellipse(x + 16 * J.fwd, y, 22, 14, 0, 0, TAU); inkFill(gg, '#d9493f', 2); ln(gg, x + 16 * J.fwd, y + 14, x + 16 * J.fwd, y + 30, 3); }, who: ['The pan is on fire', 'Urgent, important, and nobody else is going to do it. Lid on, gas off, window open. Done in forty seconds.'] }, 150);
    // the laptop with the deadline, on the table
    sc.add(250, () => { R.box(g, 600, 860, 200, 280, 70, 76, { front: '#e9dfc6', lw: LW }); for (const X of [606, 850]) R.box(g, X, X + 6, 270, 278, 0, 70, { front: '#9a6440', lw: LW }); R.box(g, 740, 820, 220, 250, 76, 78, { front: C.ash, lw: 1.4 }); R.box(g, 740, 820, 218, 222, 78, 120, { front: '#dfeff2', lw: 1.4 }); const [nx, ny] = R.p(860, 240, 76), k = R.k(240); g.beginPath(); g.rect(nx - 18 * k, ny - 12 * k, 36 * k, 24 * k); inkFill(g, '#ffd25a', 1.2); g.fillStyle = INK; g.font = `bold ${Math.round(8 * k)}px Arial`; g.textAlign = 'center'; g.fillText('DUE 9AM', nx, ny + 3 * k); g.textAlign = 'left'; who.push({ x: nx, y: ny, r: 34, name: 'The report due at nine', line: 'Important and, by now, urgent. It was quadrant 2 three weeks ago.' }); });
  });

  /* 2 · important, not urgent: the study and the garden */
  paintRoom(1, (g, R, sc) => {
    R.shell(g, { back: '#c8e8e0', left: '#b6dcd2', right: '#a8d0c6', floor: '#b97a45', ceil: '#d8f0ea' }, LW);
    backText(g, R, R.Wc / 2, 245, 'SCHEDULE IT', 34, `600 {s}px ${CINZEL}`, '#2a6a66');
    // a calendar on the wall with blocks
    sc.add(1, () => { R.onBack(g, 380, 90, 620, 210, '#fbfaf5', LW); for (let r = 0; r < 4; r++) for (let c = 0; c < 7; c++) R.onBack(g, 390 + c * 33, 100 + r * 26, 418 + c * 33, 122 + r * 26, (r * 7 + c) % 5 === 1 ? '#9ad0b0' : (r * 7 + c) % 9 === 3 ? '#e3b23c' : null, 1); });
    // exercise: someone on a yoga mat
    sc.add(240, () => R.onFloor(g, 80, 220, 320, 300, '#7aa86a', LW));
    rp(sc, R, who, 200, 260, 0, { turn: 0.5, look: look(10011, { fem: false, skin: SKIN[1], hair: HAIR.ginger, style: 'short', topKind: 'tank', top: C.teal, bottom: C.char, bottomKind: 'shorts' }), pose: { ...POSES.handsUp, armN: [-90, -90], armF: [90, 90], legN: [-32, -10], legF: [36, 20] }, mood: 'flat', who: ['Exercise, at 7 p.m., in the calendar', 'Nothing will ever make this urgent until it is very urgent indeed. So it goes in the calendar like a meeting.'] }, 260);
    // a parent and child reading
    sc.add(180, () => { R.box(g, 560, 820, 140, 220, 0, 42, { front: C.mustard, lw: LW }); R.box(g, 560, 820, 140, 160, 42, 90, { front: C.mustard, lw: LW }); });
    rp(sc, R, who, 640, 190, 42, { turn: 0.2, look: look(10012, { fem: true, skin: SKIN[2], hair: HAIR.black, style: 'long', topKind: 'sweater', top: C.coral, bottom: C.navy }), pose: POSES.sitRead, mood: 'smile', hold: (gg: G, J: Joints) => { const cx = (J.hN[0] + J.hF[0]) / 2, cy = (J.hN[1] + J.hF[1]) / 2 - 4; gg.beginPath(); gg.rect(cx - 18, cy - 10, 36, 20); inkFill(gg, C.butter, 1.6); }, who: ['Bedtime story', 'Twenty minutes, every night, phones in another room. Never urgent. Possibly the most important thing in this house.'] }, 191);
    rp(sc, R, who, 740, 190, 42, { turn: -0.2, scale: 0.7, look: look(10013, { age: 'kid', fem: false, skin: SKIN[2], hair: HAIR.black, style: 'curly', topKind: 'tee', top: C.sky, bottom: C.navy }), pose: POSES.sit, mood: 'open' }, 192);
    // a plant being watered, a sapling in a pot
    sc.add(300, () => { R.box(g, 800, 860, 300, 340, 0, 40, { front: '#c97a4a', lw: LW }); const [px, py] = R.p(830, 320, 40), k = R.k(320); for (let i = 0; i < 6; i++) { g.beginPath(); g.ellipse(px + (i - 2.5) * 8 * k, py - 30 * k - (i % 2) * 14 * k, 8 * k, 18 * k, (i - 2.5) * 0.3, 0, TAU); inkFill(g, '#5f9a4a', 1.4); } });
  });

  /* 3 · urgent, not important: the hall, the doorbell and the phone */
  paintRoom(2, (g, R, sc) => {
    R.shell(g, { back: '#f6e2a8', left: '#f0d896', right: '#e8cc84', floor: '#9a7a5a', ceil: '#faecc4' }, LW);
    backText(g, R, R.Wc / 2, 245, 'DELEGATE IT', 34, `600 {s}px ${CINZEL}`, '#8a6a1a');
    sc.add(1, () => { R.onBack(g, 120, 0, 300, 210, '#6b4128', LW); const [x, y] = R.p(330, 0, 120), k = R.k(0); ellipse(g, x, y, 8 * k, 8 * k, 0, '#e3b23c', 1.4); for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(x, y, (16 + i * 10) * k, -0.8, 0.8); g.lineWidth = 2; g.strokeStyle = '#a9302a'; g.stroke(); } });
    rp(sc, R, who, 360, 140, 0, { turn: -0.4, look: look(10021, { fem: false, age: 'teen', skin: SKIN[3], hair: HAIR.black, style: 'short', topKind: 'hoodie', top: C.red, bottom: C.denim }), pose: { ...POSES.walk, armF: [60, 100] }, mood: 'smile', who: ['“Can you get the door?”', 'The parcel needs a signature now; it does not need Mum. Her son can sign for it.'] }, 140);
    // the phone ringing on a side table, and someone handing a form across
    sc.add(200, () => { R.box(g, 640, 760, 180, 240, 0, 70, { front: '#9a6440', lw: LW }); R.box(g, 670, 730, 200, 225, 70, 82, { front: '#e3584a', lw: 1.4 }); const [x, y] = R.p(700, 210, 92); for (let i = 0; i < 2; i++) { g.beginPath(); g.arc(x, y, 18 + i * 12, -2.4, -0.7); g.lineWidth = 2; g.strokeStyle = '#a9302a'; g.stroke(); } who.push({ x, y, r: 34, name: 'The ringing phone', line: 'A survey about her energy plan. Urgent in the sense that it is ringing; important to nobody.' }); });
    rp(sc, R, who, 700, 260, 0, { turn: -0.5, look: look(10022, { fem: true, skin: SKIN[4], hair: HAIR.black, style: 'bun', topKind: 'tee', top: C.navy, bottom: C.denim }), pose: { ...POSES.point, armF: [90, 96] }, mood: 'smile', hold: (gg: G, J: Joints) => { const [x, y] = J.hF; gg.beginPath(); gg.rect(x - 2, y - 14, 22, 28); inkFill(gg, '#fbfaf5', 1.6); }, who: ['Handing it on', 'The school trip form needs filling in tonight. Her partner can do it. She asks; he does.'] }, 260);
    rp(sc, R, who, 800, 230, 0, { turn: -0.6, look: look(10023, { fem: false, skin: SKIN[1], hair: HAIR.brown, style: 'short', topKind: 'shirt', top: C.white, bottom: C.khaki, beard: 'stubble' }), pose: { ...POSES.reach, armF: [80, 90], armN: [-10, 0] }, mood: 'flat' }, 230);
  });

  /* 4 · neither: the den, the feed, the sixth episode */
  paintRoom(3, (g, R, sc) => {
    R.shell(g, { back: '#c8c8cc', left: '#bcbcc2', right: '#b0b0b6', floor: '#8a8a90', ceil: '#d6d6da' }, LW);
    backText(g, R, R.Wc / 2, 245, 'LET IT GO', 34, `600 {s}px ${CINZEL}`, '#4a4a52');
    sc.add(5, () => { R.box(g, 520, 860, 20, 70, 0, 50, { front: '#5c6670', lw: LW }); R.box(g, 540, 840, 50, 60, 50, 200, { front: '#26262b', lw: LW }); R.onBack(g, 550, 60, 830, 190, '#8cc8e8', 1.4, 60); backText(g, R, 690, 175, 'NEXT EPISODE IN 5', 12, `bold {s}px Arial`, '#fbfaf5'); });
    sc.add(180, () => { R.box(g, 120, 460, 160, 250, 0, 42, { front: '#8a7aa8', lw: LW }); R.box(g, 120, 460, 160, 180, 42, 92, { front: '#8a7aa8', lw: LW }); });
    rp(sc, R, who, 220, 210, 42, { turn: 0.3, look: look(10031, { fem: false, skin: SKIN[0], hair: HAIR.blond, style: 'side', topKind: 'hoodie', top: C.olive, bottom: C.grey }), pose: POSES.sitPhone, eyes: 'down', mood: 'flat', hold: (gg: G, J: Joints) => { const [x, y] = J.hN; gg.beginPath(); gg.roundRect(x - 6, y - 14, 12, 18, 2); inkFill(gg, '#3a3a40', 1.4); }, who: ['The feed', 'An argument in the comments between two strangers about a third stranger. He has been reading it for forty minutes.'] }, 211);
    rp(sc, R, who, 360, 210, 42, { turn: 0.2, look: look(10032, { fem: true, skin: SKIN[5], hair: HAIR.black, style: 'afro', topKind: 'sweater', top: C.lav, bottom: C.navy }), pose: { ...POSES.sitBack, head: 0 }, eyes: 'closed', mood: 'flat', who: ['Episode six', 'She stopped enjoying it two episodes ago. The next one starts in five seconds.'] }, 212);
    sc.add(320, () => { const [x, y] = R.p(640, 320, 0); dog(g, x, y, R.k(320) * 0.8, -1, '#c9a070', LW, { tail: 4 }); });
  });

  // the axes
  const ax = (x1: number, y1: number, x2: number, y2: number) => { ln(g, x1, y1, x2, y2, 4); const a = Math.atan2(y2 - y1, x2 - x1); g.beginPath(); g.moveTo(x2, y2); g.lineTo(x2 - 18 * Math.cos(a - 0.4), y2 - 18 * Math.sin(a - 0.4)); g.lineTo(x2 - 18 * Math.cos(a + 0.4), y2 - 18 * Math.sin(a + 0.4)); g.closePath(); g.fillStyle = INK; g.fill(); };
  ax(X0 - 120, Y0 + RH * 2 + GAP, X0 - 120, Y0 + 30);
  ax(X0 - 26, Y0 + RH * 2 + GAP + 90, X0 + RW * 2 + GAP + 40, Y0 + RH * 2 + GAP + 90);
  g.fillStyle = INK; g.font = `600 30px ${CINZEL}`; g.textAlign = 'center';
  g.save(); g.translate(X0 - 160, Y0 + RH * 0.5); g.rotate(-Math.PI / 2); g.fillText('IMPORTANT', 0, 0); g.restore();
  g.save(); g.translate(X0 - 160, Y0 + RH * 1.5 + GAP); g.rotate(-Math.PI / 2); g.fillText('NOT IMPORTANT', 0, 0); g.restore();
  g.fillText('URGENT', X0 + RW / 2, Y0 + RH * 2 + GAP + 136); g.fillText('NOT URGENT', X0 + RW * 1.5 + GAP, Y0 + RH * 2 + GAP + 136); g.textAlign = 'left';

  rooms.forEach((R, i) => badge(g, who, R.x + 50, R.y + 50, NOTES[i], COL[i]));

  // title strip across the top, and a quote
  titlePanel(g, { x: 50, y: 30, w: 1000, title: 'The Eisenhower Matrix', def: 'Sort by two questions: does it matter, and does it have to be now?', credit: 'After Dwight D. Eisenhower, 1954 · Stephen Covey, 1989' });
  g.fillStyle = '#5a3826'; g.font = `italic 32px ${SERIF}`; wrap(g, '“What is important is seldom urgent and what is urgent is seldom important.”', 1160, 90, 1180, 42);
  g.font = `600 18px ${CINZEL}`; g.fillText('EISENHOWER, QUOTING AN UNNAMED UNIVERSITY PRESIDENT, 1954', 1160, 150);
  grain(g, W, H, 0.09, 31);
}

export const EISENHOWER: Plate = {
  key: 'eisenhower', title: 'The Eisenhower Matrix', place: 'After Eisenhower and Covey',
  blurb: 'Four rooms of one house on a Tuesday evening: a pan on fire and a report due at nine; exercise and a bedtime story, kept in the calendar; a doorbell and a form, handed on; and the feed and the sixth episode, which can go.',
  w: W, h: H, paint,
};
