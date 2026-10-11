/**
 * Wash & Fold — a neighbourhood laundromat on a Sunday evening, in pastel:
 * the machines turning colour over, the folding table and its cat, and the
 * people who wait here every week and have come to know each other's
 * laundry better than each other's names.
 */
import { type G, Scene, INK, inkFill, ellipse, ln, rng, pick, shade, SERIF, SANS, TAU, grain, rect } from './kit';
import { POSES, randomLook, person, type Look, type Joints, type Fig } from './people';
import { PRoom } from './pers';
import { type Plate, type Who } from './stage';

const W = 2400, H = 1600, LW = 2.4;
const P = { cream: '#fbf6dc', wall: '#f6efcf', floor: '#efe3c0', mint: '#cfe8d8', peach: '#f6c9a8', butter: '#f6e3a1', lilac: '#cfc4ec', powder: '#bcd6ea', blush: '#f4c2c8', sage: '#b8cfa8', grey: '#d8d6cf', steel: '#a9b8c4', ink: '#2c2a2a' };
const PASTEL = [P.mint, P.peach, P.butter, P.lilac, P.powder, P.blush, P.sage];
const look = (seed: number, o: Partial<Look>) => randomLook(seed, o);

interface RP { look: Look; pose: Fig['pose']; turn: number; back?: boolean; who: [string, string]; hold?: Fig['hold']; over?: Fig['over']; mood?: Fig['face']; eyes?: Fig['eyes']; scale?: number }
function rp(sc: Scene, R: PRoom, who: Who[], X: number, d: number, Z: number, o: RP, depth?: number) {
  sc.add(depth ?? d, () => {
    const [x, y] = R.p(X, d, Z), s = R.fig(d) * (o.scale ?? 1);
    const J = person(sc.g!, { x, y, s, turn: o.turn, back: o.back, look: o.look, pose: o.pose, lw: LW, hold: o.hold, over: o.over, face: o.mood, eyes: o.eyes, anchor: o.pose.sit ? 'seat' : 'feet' });
    who.push({ x: J.H[0], y: (J.H[1] + J.P[1]) / 2, r: Math.max(40, s * 26), name: o.who[0], line: o.who[1] });
  });
}

/** a front-loading machine against the back wall, its door toward us */
function machine(g: G, R: PRoom, X: number, Z: number, w: number, h: number, body: string, seed: number, spin = true) {
  R.box(g, X, X + w, 0, 62, Z, Z + h, { front: body, top: shade(body, 0.1), side: shade(body, -0.08), lw: LW });
  const [cx, cy] = R.p(X + w / 2, 62, Z + h * 0.46), k = R.k(62), r = w * 0.32 * k;
  ellipse(g, cx, cy, r * 1.18, r * 1.18, 0, '#e9ecef', LW);
  ellipse(g, cx, cy, r, r, 0, '#cfe3ee', LW);
  if (spin) {
    // laundry tumbling: soft swirls of colour
    g.save(); g.beginPath(); g.arc(cx, cy, r - 2, 0, TAU); g.clip();
    const Rr = rng(seed);
    for (let i = 0; i < 6; i++) { const a = Rr() * TAU, rr = r * (0.3 + Rr() * 0.6); g.beginPath(); g.ellipse(cx + Math.cos(a) * r * 0.35, cy + Math.sin(a) * r * 0.3 + r * 0.25, rr, rr * 0.45, a, 0, TAU); g.fillStyle = pick(Rr, ['#e98b8b', '#7aa8d8', '#f3c35a', '#9ac48a', '#c9a0e0', '#f7f1df']); g.fill(); }
    g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.ellipse(cx - r * 0.3, cy - r * 0.35, r * 0.35, r * 0.18, -0.6, 0, TAU); g.fill();
    g.restore();
    ellipse(g, cx, cy, r, r, 0, null, LW);
  }
  // the control strip and a coin slot
  const a = R.p(X + 6, 62, Z + h - 14), b = R.p(X + w - 6, 62, Z + h - 4); g.beginPath(); g.rect(a[0], b[1], b[0] - a[0], a[1] - b[1]); inkFill(g, shade(body, -0.12), LW * 0.7);
  const [lx, ly] = R.p(X + w - 14, 62, Z + h - 9); ellipse(g, lx, ly, 3, 3, 0, '#7ac08a', 0);
}

function paint(g: G, who: Who[]) {
  g.fillStyle = P.cream; g.fillRect(0, 0, W, H);
  const R = new PRoom(-220, -40, 2840, 1620, 380, 600, 0.6, 0.3, 0.5);
  R.shell(g, { back: P.wall, left: '#f3e9c6', right: '#efe3bd', floor: P.floor, ceil: '#fdf9e8' }, LW);
  for (let i = 0; i < 16; i++) for (let j = 0; j < 10; j++) if ((i + j) % 2) R.onFloor(g, i * 42, j * 60, (i + 1) * 42, (j + 1) * 60, '#f5ebcc', 0);
  // the sign, the clock and the TV above the machines
  R.onBack(g, 150, 250, 520, 292, P.blush, LW);
  { const [x, y] = R.p(335, 0, 271); g.fillStyle = P.ink; g.font = `600 ${Math.round(28 * R.k(0))}px "Cinzel", serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('SUDS · WASH & FOLD', x, y); g.textBaseline = 'alphabetic'; }
  { const [x, y] = R.p(600, 0, 272), k = R.k(0); ellipse(g, x, y, 20 * k, 20 * k, 0, '#fbfaf5', LW); ln(g, x, y, x, y - 13 * k, LW); ln(g, x, y, x + 9 * k, y + 4 * k, LW); }
  R.onBack(g, 30, 240, 110, 292, '#3a3a40', LW); R.onBack(g, 36, 246, 104, 286, '#f6c9a8', LW * 0.6);
  { const [x, y] = R.p(70, 0, 264), k = R.k(0); ellipse(g, x, y, 9 * k, 11 * k, 0, '#8a5a3a', 0); g.fillStyle = '#f7f1df'; g.fillRect(x - 28 * k, y + 8 * k, 56 * k, 5 * k); }
  // notices on the right wall
  R.onSide(g, 1, 120, 200, 140, 220, '#d9b48a', LW);
  for (const [d0, Z, c] of [[128, 186, P.butter], [160, 180, P.mint], [132, 148, P.blush], [166, 150, '#fbfaf5']] as [number, number, string][]) R.onSide(g, 1, d0, d0 + 26, Z, Z + 28, c, LW * 0.6);

  const sc = new Scene(g);
  // the whole back wall: machines two high
  sc.add(1, () => {
    for (let i = 0; i < 10; i++) for (let j = 0; j < 2; j++) machine(g, R, 4 + i * 66, j * 100, 64, 96, j ? '#cfe0e8' : (i % 2 ? '#dfe8ee' : '#e6ecef'), 30 + i * 2 + j, (i * 3 + j) % 4 !== 0);
  });
  // the counter on the left, and Mrs. Lim behind it
  rp(sc, R, who, 80, 230, 0, { turn: 0.7, look: look(904, { fem: true, skin: '#efc19f', hair: '#231d1b', style: 'bob', topKind: 'shirt', top: P.mint, accent: '#fbfaf5', bottom: '#5c6670', glasses: true }), pose: { ...POSES.phone, head: 10 }, mood: 'smile', hold: (gg: G, J: Joints) => { const [x, y] = J.hN; gg.beginPath(); gg.roundRect(x - 6, y - 16, 12, 18, 2); inkFill(gg, '#3a3a40', LW); }, who: ['Mrs. Lim, 64', 'Has owned SUDS since 1993. Gives the kids quarters for the gumball machine and knows exactly which dryer runs hot.'] }, 230);
  sc.add(260, () => {
    R.box(g, 0, 120, 270, 420, 0, 100, { front: P.peach, side: shade(P.peach, -0.08), lw: LW });
    R.box(g, -4, 124, 266, 424, 100, 106, { front: '#fbfaf5', lw: LW });
    R.box(g, 16, 66, 300, 340, 106, 146, { front: P.steel, lw: LW });
    // the gumball machine
    const [gx, gy] = R.p(16, 412, 106), k = R.k(412); g.beginPath(); g.rect(gx - 9 * k, gy - 18 * k, 18 * k, 18 * k); inkFill(g, '#d9493f', LW); ellipse(g, gx, gy - 32 * k, 16 * k, 16 * k, 0, 'rgba(220,240,250,0.9)', LW); const Rg = rng(3); for (let i = 0; i < 12; i++) ellipse(g, gx + (Rg() - 0.5) * 20 * k, gy - 32 * k + (Rg() - 0.3) * 18 * k, 3 * k, 3 * k, 0, pick(Rg, ['#e98b8b', '#7aa8d8', '#f3c35a', '#9ac48a']), 0);
  });
  // the toddler at a dryer window, Tomás loading the top row
  rp(sc, R, who, 300, 95, 0, { turn: 0.15, back: true, look: look(901, { fem: true, age: 'kid', skin: '#a8704a', hair: '#231d1b', style: 'afro', topKind: 'dress', top: P.butter, bottom: P.butter, shoes: P.blush }), pose: { ...POSES.handsUp, armN: [-150, -175], armF: [150, 175] }, scale: 0.86, who: ['Imani, 3', 'Has watched the dryer go round for twenty-two minutes. Believes the socks are dancing. She is right.'] }, 95);
  rp(sc, R, who, 540, 110, 0, { turn: 0.3, back: true, look: look(907, { fem: false, skin: '#e2a882', hair: '#231d1b', style: 'short', topKind: 'jacket', top: P.lilac, inner: '#fbfaf5', bottom: '#5c6670' }), pose: { ...POSES.reach, armF: [150, 150], armN: [120, 150] }, who: ['Tomás, 35', 'Brings his whole week in one bag and his grandmother’s whole week in another. Hers goes on delicate.'] }, 110);
  sc.add(140, () => { const [x, y] = R.p(470, 140, 0), k = R.k(140); g.beginPath(); g.ellipse(x, y - 26 * k, 34 * k, 28 * k, 0, 0, TAU); inkFill(g, '#f3dc8a', LW); g.beginPath(); g.moveTo(x - 10 * k, y - 52 * k); g.quadraticCurveTo(x, y - 70 * k, x + 10 * k, y - 52 * k); g.lineWidth = LW; g.strokeStyle = INK; g.stroke(); });
  // Shanice with her basket
  rp(sc, R, who, 190, 200, 0, { turn: 0.3, look: look(902, { fem: true, skin: '#a8704a', hair: '#231d1b', style: 'braids', topKind: 'tee', top: P.lilac, bottom: '#6f86a8' }), pose: POSES.carry, hold: (gg: G, J: Joints) => { const cx = (J.hN[0] + J.hF[0]) / 2, cy = (J.hN[1] + J.hF[1]) / 2 - 6 * J.s; gg.beginPath(); gg.moveTo(cx - 20 * J.s, cy - 8 * J.s); gg.lineTo(cx + 20 * J.s, cy - 8 * J.s); gg.lineTo(cx + 16 * J.s, cy + 8 * J.s); gg.lineTo(cx - 16 * J.s, cy + 8 * J.s); gg.closePath(); inkFill(gg, P.powder, LW); for (let i = 0; i < 4; i++) { gg.beginPath(); gg.ellipse(cx - 12 * J.s + i * 8 * J.s, cy - 9 * J.s, 5 * J.s, 3 * J.s, 0, 0, TAU); inkFill(gg, PASTEL[i], LW * 0.6); } }, mood: 'smile', who: ['Shanice, 29', 'Home health aide, six days a week. Sunday night is laundry and the only hour she gets to sit down; she has not sat down yet.'] }, 200);
  // the folding table, its folder and its cat
  rp(sc, R, who, 380, 290, 0, { turn: -0.15, look: look(903, { fem: false, age: 'old', skin: '#5f3c2a', hair: '#ecebe6', style: 'balding', topKind: 'sweater', top: P.sage, bottom: '#8a8f9a', glasses: true, beard: 'mustache' }), pose: { ...POSES.standFront, armN: [12, 78], armF: [-12, -78], head: 22 }, eyes: 'down', hold: (gg: G, J: Joints) => { const cx = (J.hN[0] + J.hF[0]) / 2, cy = (J.hN[1] + J.hF[1]) / 2; gg.beginPath(); gg.moveTo(cx - 22 * J.s, cy - 6 * J.s); gg.lineTo(cx + 22 * J.s, cy - 6 * J.s); gg.lineTo(cx + 20 * J.s, cy + 8 * J.s); gg.lineTo(cx - 20 * J.s, cy + 8 * J.s); gg.closePath(); inkFill(gg, '#fbfaf5', LW); gg.beginPath(); gg.moveTo(cx - 4 * J.s, cy - 6 * J.s); gg.lineTo(cx, cy - 1 * J.s); gg.lineTo(cx + 4 * J.s, cy - 6 * J.s); gg.lineWidth = LW * 0.8; gg.strokeStyle = INK; gg.stroke(); }, who: ['Mr. Okafor, 81', 'Retired tailor. Folds his shirts into perfect squares, and other people’s if they let him. Most of them let him.'] }, 290);
  sc.add(300, () => {
    R.box(g, 260, 560, 315, 380, 86, 92, { front: '#fbfaf5', top: '#ffffff', lw: LW });
    for (const X of [266, 548]) R.box(g, X, X + 8, 370, 380, 0, 86, { front: P.steel, lw: LW });
    for (let i = 0; i < 3; i++) R.box(g, 300 + i * 40, 336 + i * 40, 325, 355, 92, 92 + 6 + i * 3, { front: PASTEL[i + 1], lw: LW * 0.7 });
    R.box(g, 460, 540, 322, 364, 92, 112, { front: '#d2a679', lw: LW });
    const [cx, cy] = R.p(500, 343, 116), k = R.k(343);
    g.beginPath(); g.ellipse(cx, cy, 30 * k, 13 * k, 0, 0, TAU); inkFill(g, '#f3a65a', LW);
    g.beginPath(); g.ellipse(cx + 26 * k, cy - 4 * k, 12 * k, 10 * k, 0, 0, TAU); inkFill(g, '#f3a65a', LW);
    g.beginPath(); g.moveTo(cx + 20 * k, cy - 11 * k); g.lineTo(cx + 22 * k, cy - 20 * k); g.lineTo(cx + 27 * k, cy - 13 * k); g.moveTo(cx + 29 * k, cy - 13 * k); g.lineTo(cx + 34 * k, cy - 20 * k); g.lineTo(cx + 35 * k, cy - 10 * k); g.fillStyle = '#f3a65a'; g.fill(); g.lineWidth = LW; g.strokeStyle = INK; g.stroke();
    g.beginPath(); g.arc(cx + 23 * k, cy - 4 * k, 2.4 * k, 0.2, Math.PI - 0.2); g.moveTo(cx + 31 * k, cy - 4 * k); g.arc(cx + 30 * k, cy - 4 * k, 2.4 * k, 0.2, Math.PI - 0.2); g.lineWidth = LW * 0.7; g.stroke();
    g.strokeStyle = shade('#f3a65a', -0.25); g.lineWidth = LW * 0.8; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(cx - 10 * k + i * 9 * k, cy - 12 * k); g.lineTo(cx - 7 * k + i * 9 * k, cy - 5 * k); g.stroke(); }
    who.push({ x: cx, y: cy, r: 40, name: 'Biscuit', line: 'The laundromat cat, eleven years. Sleeps in whichever basket is warmest and has never once been asked to move.' });
  });
  // the front chairs and their sitters
  const chairP = (X: number, d: number, col: string) => {
    R.box(g, X - 30, X + 30, d - 26, d + 26, 30, 44, { front: col, lw: LW });
    R.box(g, X - 30, X + 30, d - 30, d - 22, 44, 96, { front: col, lw: LW });
    for (const XX of [X - 28, X + 22]) R.box(g, XX, XX + 6, d + 20, d + 26, 0, 30, { front: P.steel, lw: LW });
  };
  sc.add(470, () => chairP(150, 480, P.powder));
  rp(sc, R, who, 150, 480, 44, { turn: 0.55, look: look(905, { fem: true, skin: '#c98c62', hair: '#3b2a22', style: 'long', topKind: 'scrubs', top: '#a8d8cc', bottom: '#a8d8cc', shoes: '#fbfaf5' }), pose: { ...POSES.sitRead, head: 26 }, eyes: 'down', hold: (gg: G, J: Joints) => { const cx = (J.hN[0] + J.hF[0]) / 2, cy = (J.hN[1] + J.hF[1]) / 2 - 4 * J.s; gg.beginPath(); gg.rect(cx - 13 * J.s, cy - 9 * J.s, 13 * J.s, 15 * J.s); inkFill(gg, '#fbfaf5', LW); gg.beginPath(); gg.rect(cx, cy - 9 * J.s, 13 * J.s, 15 * J.s); inkFill(gg, '#f7f1df', LW); gg.strokeStyle = 'rgba(44,42,42,0.35)'; gg.lineWidth = 1.4; for (let i = 0; i < 5; i++) { gg.beginPath(); gg.moveTo(cx - 11 * J.s, cy - 6 * J.s + i * 2.6 * J.s); gg.lineTo(cx - 2 * J.s, cy - 6 * J.s + i * 2.6 * J.s); gg.moveTo(cx + 2 * J.s, cy - 6 * J.s + i * 2.6 * J.s); gg.lineTo(cx + 11 * J.s, cy - 6 * J.s + i * 2.6 * J.s); gg.stroke(); } gg.fillStyle = 'rgba(243,220,138,0.7)'; gg.fillRect(cx + 2 * J.s, cy - 4 * J.s, 9 * J.s, 1.6 * J.s); }, who: ['Rosa, 26', 'Nursing student, final year. Pharmacology exam on Tuesday. Highlighting in four colours; the washer has two minutes left and she has two chapters.'] }, 481);
  sc.add(470, () => chairP(560, 490, P.blush));
  rp(sc, R, who, 560, 490, 44, { turn: -0.5, look: look(906, { fem: false, skin: '#efc19f', hair: '#c8662e', style: 'curly', topKind: 'hoodie', top: P.butter, bottom: '#6f86a8', hat: { kind: 'headphones', color: '#3a3a40' }, beard: 'stubble' }), pose: POSES.sleep, eyes: 'closed', mood: 'flat', who: ['Kevin, 31', 'Line cook, finished at four. Asleep since the rinse cycle. His dryer stopped eleven minutes ago; nobody will wake him; everybody is watching his stuff.'] }, 491);
  sc.add(520, () => { const [x, y] = R.p(470, 540, 0), k = R.k(540); g.beginPath(); g.moveTo(x - 30 * k, y - 34 * k); g.lineTo(x + 30 * k, y - 34 * k); g.lineTo(x + 24 * k, y); g.lineTo(x - 24 * k, y); g.closePath(); inkFill(g, P.mint, LW); for (let i = 0; i < 3; i++) { g.beginPath(); g.ellipse(x - 16 * k + i * 16 * k, y - 36 * k, 10 * k, 5 * k, 0, 0, TAU); inkFill(g, PASTEL[i + 3], LW * 0.6); } });
  sc.draw();

  // title, small, like a label on the wall
  g.fillStyle = P.ink; g.textAlign = 'left'; g.font = `600 52px "Cinzel", ${SERIF}`; g.fillText('Wash & Fold', 400, 110);
  g.font = `italic 28px ${SERIF}`; g.fillText('A laundromat on a Sunday evening.', 402, 150);
  grain(g, W, H, 0.06, 8);
  void rect; void SANS;
}

export const LAUNDROMAT: Plate = {
  key: 'laundromat', title: 'Wash & Fold', place: 'A laundromat',
  blurb: 'A neighbourhood laundromat on a Sunday evening, in pastel: the machines turning colour over, the folding table and its cat, a nursing student with two chapters left, and a line cook asleep through the rinse cycle.',
  w: W, h: H, paint,
};
