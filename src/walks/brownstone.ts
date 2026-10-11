/**
 * The Brownstone — a Brooklyn rowhouse cut open like a dollhouse, one
 * evening: the roof and its pigeons, a bedroom, a studio, a kitchen, a
 * living room, a home office, a bath, the tailor's shop on the parlour
 * floor, the hall, the boiler room and a band in the basement — and under
 * the street, the train.
 */
import { type G, type Pt, Scene, C, INK, HAIR, SKIN, shade, rect, ellipse, ln, inkFill, rng, pick, grain, SERIF, SANS, TAU, mix } from './kit';
import { POSES, randomLook, person, type Look, type Pose, type Joints, type Fig } from './people';
import { PRoom } from './pers';
import { dog } from './props';
import { type Plate, type Who } from './stage';

const W = 1920, H = 2400, LW = 2.1;
const SECTION = '#7a3e30', SECTION2 = '#5e2e24';
const look = (seed: number, o: Partial<Look>) => randomLook(seed, o);

interface RP { look: Look; pose: Pose; turn: number; back?: boolean; who?: [string, string]; hold?: Fig['hold']; over?: Fig['over']; mood?: Fig['face']; eyes?: Fig['eyes']; rot?: number; scale?: number }
/** a person in a room, on the floor at (X, d) or on a seat at height Z */
function rp(sc: Scene, R: PRoom, who: Who[], X: number, d: number, Z: number, o: RP, depth?: number) {
  sc.add(depth ?? d, () => {
    const [x, y] = R.p(X, d, Z), s = R.fig(d) * (o.scale ?? 1);
    const J = person(sc.g!, { x, y, s, turn: o.turn, back: o.back, look: o.look, pose: o.pose, lw: LW * 0.95, hold: o.hold, over: o.over, face: o.mood, eyes: o.eyes, rot: o.rot, anchor: o.pose.sit ? 'seat' : 'feet' });
    if (o.who) who.push({ x: J.H[0], y: (J.H[1] + J.P[1]) / 2, r: Math.max(34, s * 30), name: o.who[0], line: o.who[1] });
  });
}
/** a person drawn flat in profile (on the roof, the stoop, the train) */
function fp(g: G, who: Who[], x: number, y: number, s: number, o: RP) {
  const J = person(g, { x, y, s, turn: o.turn, back: o.back, look: o.look, pose: o.pose, lw: LW * 0.95, hold: o.hold, over: o.over, face: o.mood, eyes: o.eyes, rot: o.rot, anchor: o.pose.sit ? 'seat' : 'feet' });
  if (o.who) who.push({ x: J.H[0], y: (J.H[1] + J.P[1]) / 2, r: Math.max(34, s * 30), name: o.who[0], line: o.who[1] });
  return J;
}

/* ───────── furniture in perspective ───────── */

function windowBack(g: G, R: PRoom, X0: number, X1: number, Z0: number, Z1: number, sky: string, frame = C.white) {
  R.onBack(g, X0 - 8, Z0 - 8, X1 + 8, Z1 + 8, frame, LW);
  R.onBack(g, X0, Z0, X1, Z1, sky, LW);
  // the street trees and the brownstones across the yard
  const [a] = R.p(X0, 0, Z0), [b] = R.p(X1, 0, Z0);
  const [, ya] = R.p(X0, 0, Z0), [, yb] = R.p(X0, 0, Z1);
  g.save(); g.beginPath(); g.rect(a, yb, b - a, ya - yb); g.clip();
  g.fillStyle = shade(sky, -0.18); for (let i = 0; i < 4; i++) g.fillRect(a + (b - a) * (i * 0.27), ya - (ya - yb) * (0.35 + (i % 2) * 0.12), (b - a) * 0.22, ya);
  g.fillStyle = 'rgba(255,240,170,0.9)'; for (let i = 0; i < 6; i++) g.fillRect(a + (b - a) * (0.05 + i * 0.16), ya - (ya - yb) * (0.25 + (i % 3) * 0.06), 6, 8);
  g.restore();
  const [mx] = R.p((X0 + X1) / 2, 0, 0);
  ln(g, mx, yb, mx, ya, LW * 2.4, frame); ln(g, mx, yb, mx, ya, LW * 0.6);
  const ym = (ya + yb) / 2; ln(g, a, ym, b, ym, LW * 2.4, frame); ln(g, a, ym, b, ym, LW * 0.6);
}
function frameOnBack(g: G, R: PRoom, X: number, Z: number, w: number, h: number, art: string, frame = C.chocolate, draw?: (g: G, x: number, y: number, w: number, h: number) => void) {
  R.onBack(g, X, Z, X + w, Z + h, frame, LW);
  R.onBack(g, X + 4, Z + 4, X + w - 4, Z + h - 4, art, LW * 0.7);
  if (draw) { const [x0, y1] = R.p(X + 4, 0, Z + 4), [x1, y0] = R.p(X + w - 4, 0, Z + h - 4); g.save(); g.beginPath(); g.rect(x0, y0, x1 - x0, y1 - y0); g.clip(); draw(g, x0, y0, x1 - x0, y1 - y0); g.restore(); }
}
function pendant(g: G, R: PRoom, X: number, d: number, col: string, drop = 70) {
  const [x0, y0] = R.p(X, d, R.Hc), [x1, y1] = R.p(X, d, R.Hc - drop); ln(g, x0, y0, x1, y1, LW);
  const k = R.k(d);
  g.save(); const gr = g.createRadialGradient(x1, y1 + 10 * k, 4, x1, y1 + 10 * k, 160 * k); gr.addColorStop(0, 'rgba(255,240,180,0.35)'); gr.addColorStop(1, 'rgba(255,240,180,0)'); g.fillStyle = gr; g.fillRect(x1 - 170 * k, y1 - 40 * k, 340 * k, 260 * k); g.restore();
  g.beginPath(); g.moveTo(x1 - 26 * k, y1 + 18 * k); g.quadraticCurveTo(x1 - 24 * k, y1 - 4 * k, x1, y1 - 4 * k); g.quadraticCurveTo(x1 + 24 * k, y1 - 4 * k, x1 + 26 * k, y1 + 18 * k); g.closePath(); inkFill(g, col, LW);
  ellipse(g, x1, y1 + 18 * k, 10 * k, 4 * k, 0, '#fff4c8', LW * 0.7);
}
function sofa(g: G, R: PRoom, X: number, d: number, w: number, col: string, facing: 'front' = 'front') {
  void facing;
  R.box(g, X, X + w, d, d + 90, 0, 42, { front: col, lw: LW });
  R.box(g, X, X + w, d, d + 22, 42, 88, { front: shade(col, -0.05), lw: LW });
  R.box(g, X - 4, X + 18, d, d + 90, 0, 62, { front: shade(col, 0.06), lw: LW });
  R.box(g, X + w - 18, X + w + 4, d, d + 90, 0, 62, { front: shade(col, 0.06), lw: LW });
  // the cushion seams
  const n = Math.round(w / 90); for (let i = 1; i < n; i++) { const a = R.p(X + (w * i) / n, d + 90, 42), b = R.p(X + (w * i) / n, d + 90, 10); ln(g, a[0], a[1], b[0], b[1], LW * 0.7); }
}
function rugF(g: G, R: PRoom, X0: number, d0: number, X1: number, d1: number, col: string, border: string) { R.onFloor(g, X0, d0, X1, d1, col, LW); R.onFloor(g, X0 + 14, d0 + 10, X1 - 14, d1 - 10, null, LW * 0.6); const a = R.p(X0 + 14, d0 + 10, 0), b = R.p(X1 - 14, d0 + 10, 0), c = R.p(X1 - 14, d1 - 10, 0), dd = R.p(X0 + 14, d1 - 10, 0); g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.lineTo(...c); g.lineTo(...dd); g.closePath(); g.strokeStyle = border; g.lineWidth = LW * 2; g.stroke(); }
function plantP(g: G, R: PRoom, X: number, d: number, h: number, pot: string, seed: number) {
  R.box(g, X - 16, X + 16, d - 16, d + 16, 0, 36, { front: pot, lw: LW });
  const [cx, cy] = R.p(X, d + 8, 34), k = R.k(d), Rr = rng(seed);
  for (let i = 0; i < 11; i++) { const a = -Math.PI / 2 + (Rr() - 0.5) * 2.4, L = h * k * (0.45 + Rr() * 0.55); const ex = cx + Math.cos(a) * L * 0.8, ey = cy + Math.sin(a) * L; g.beginPath(); g.moveTo(cx, cy); g.quadraticCurveTo(cx + Math.cos(a - 0.35) * L * 0.6, cy + Math.sin(a - 0.35) * L * 0.6, ex, ey); g.quadraticCurveTo(cx + Math.cos(a + 0.35) * L * 0.6, cy + Math.sin(a + 0.35) * L * 0.6, cx, cy); inkFill(g, Rr() < 0.5 ? C.green : C.forest, LW * 0.8); }
}

/* ───────── the rooms ───────── */

type RoomFn = (g: G, R: PRoom, who: Who[]) => void;

const bedroom: RoomFn = (g, R, who) => {
  R.shell(g, { back: '#b9aee6', left: '#a99bd8', right: '#9d8ed0', floor: '#d9c3a0', ceil: '#c9bff0' }, LW);
  windowBack(g, R, 290, 420, 110, 220, '#f6b48a');
  // string lights
  const pts: Pt[] = []; for (let i = 0; i <= 20; i++) { const X = 20 + i * 32; pts.push(R.p(X, 0, 248 - Math.sin((i / 20) * Math.PI * 3) * 8)); }
  g.beginPath(); g.moveTo(...pts[0]); for (const p of pts) g.lineTo(...p); g.lineWidth = LW * 0.6; g.strokeStyle = INK; g.stroke();
  pts.forEach((p, i) => { if (i % 2) ellipse(g, p[0], p[1] + 4, 4, 5, 0, ['#ffd25a', '#ff8a7a', '#9ae0c0'][i % 3], LW * 0.5); });
  // posters
  frameOnBack(g, R, 60, 150, 90, 110, C.navy, C.white, (gg, x, y, w, h) => { gg.fillStyle = C.mustard; gg.beginPath(); gg.arc(x + w / 2, y + h * 0.42, w * 0.28, 0, TAU); gg.fill(); gg.fillStyle = C.coral; gg.fillRect(x, y + h * 0.7, w, h * 0.3); });
  frameOnBack(g, R, 170, 160, 80, 70, C.pink, C.white, (gg, x, y, w, h) => { gg.fillStyle = C.violet; for (let i = 0; i < 4; i++) gg.fillRect(x + w * 0.1, y + h * (0.15 + i * 0.2), w * 0.8, h * 0.08); });
  frameOnBack(g, R, 470, 140, 70, 95, C.teal, C.white, (gg, x, y, w, h) => { gg.strokeStyle = C.butter; gg.lineWidth = 3; gg.beginPath(); gg.moveTo(x + w * 0.5, y + h * 0.1); gg.lineTo(x + w * 0.5, y + h * 0.9); gg.moveTo(x + w * 0.2, y + h * 0.5); gg.lineTo(x + w * 0.8, y + h * 0.5); gg.stroke(); });
  const sc = new Scene(g);
  // the bed against the left wall
  sc.add(20, () => {
    R.box(g, 10, 230, 0, 220, 0, 34, { front: C.wood, lw: LW });
    R.box(g, 14, 226, 0, 216, 34, 52, { front: '#f7f1df', lw: LW });
    R.box(g, 10, 230, 0, 14, 0, 110, { front: shade(C.wood, -0.1), lw: LW });
    R.box(g, 30, 120, 16, 60, 52, 64, { front: '#fbfaf5', lw: LW });
    R.box(g, 14, 226, 110, 216, 52, 58, { front: C.coral, top: C.coral, lw: LW });
  });
  rp(sc, R, who, 150, 140, 58, { turn: 0.55, look: look(201, { fem: true, age: 'teen', skin: SKIN[3], hair: HAIR.black, style: 'long', topKind: 'tee', top: C.mustard, bottom: C.navy, bottomKind: 'pants', socks: C.white, shoes: C.white }), pose: POSES.guitar, eyes: 'down', hold: (gg, J) => guitar(gg, J, C.orange), who: ['Priya, 16', 'Three chords and a song about a boy who does not know she exists. Her mother, downstairs, knows all the words already.'] }, 141);
  // desk and lamp at the back right
  sc.add(30, () => {
    R.box(g, 520, 670, 10, 80, 72, 76, { front: C.white, lw: LW });
    for (const X of [524, 662]) R.box(g, X, X + 6, 70, 78, 0, 72, { front: C.white, lw: LW });
    R.box(g, 560, 610, 30, 60, 76, 78, { front: C.ash, lw: LW });
    R.box(g, 562, 608, 28, 32, 78, 108, { front: '#dfeff2', lw: LW });
    const [lx, ly] = R.p(640, 40, 76), [tx, ty] = R.p(640, 40, 130); ln(g, lx, ly, tx, ty, LW * 1.4);
    g.beginPath(); g.moveTo(tx - 16, ty + 14); g.lineTo(tx - 6, ty - 6); g.lineTo(tx + 10, ty - 6); g.lineTo(tx + 18, ty + 14); g.closePath(); inkFill(g, C.mint, LW);
  });
  // clothes on the floor, and the cat
  sc.add(300, () => {
    rugF(g, R, 300, 200, 560, 330, C.pink, C.white);
    const [x, y] = R.p(470, 270, 0); g.beginPath(); g.ellipse(x - 10, y - 4, 26, 9, 0.1, 0, TAU); inkFill(g, C.denim, LW);
    const [cx, cy] = R.p(380, 290, 0); g.beginPath(); g.ellipse(cx, cy - 12, 26, 14, 0, 0, TAU); inkFill(g, '#3a3a40', LW); g.beginPath(); g.ellipse(cx - 22, cy - 22, 12, 11, 0, 0, TAU); inkFill(g, '#3a3a40', LW);
    g.beginPath(); g.moveTo(cx - 32, cy - 30); g.lineTo(cx - 30, cy - 40); g.lineTo(cx - 24, cy - 32); g.moveTo(cx - 18, cy - 32); g.lineTo(cx - 14, cy - 41); g.lineTo(cx - 10, cy - 30); g.fillStyle = '#3a3a40'; g.fill(); g.lineWidth = LW; g.strokeStyle = INK; g.stroke();
    g.beginPath(); g.moveTo(cx + 24, cy - 10); g.quadraticCurveTo(cx + 46, cy - 2, cx + 30, cy + 4); g.lineWidth = LW * 2.6; g.stroke(); g.lineWidth = LW * 1.2; g.strokeStyle = '#3a3a40'; g.stroke();
    ln(g, cx - 26, cy - 22, cx - 22, cy - 22, LW * 0.8, '#ffd25a'); ln(g, cx - 18, cy - 22, cx - 14, cy - 22, LW * 0.8, '#ffd25a');
  });
  sc.draw();
};

function guitar(g: G, J: Joints, col: string) {
  const s = J.s, bx = (J.P[0] + J.hN[0]) / 2 + 4 * s * J.fwd, by = J.P[1] - 6 * s;
  g.save(); g.translate(bx, by); g.rotate(J.fwd * -0.45);
  g.beginPath(); g.ellipse(-6 * s, 2 * s, 9 * s, 7.5 * s, 0, 0, TAU); g.ellipse(4 * s, 0, 6.5 * s, 5.5 * s, 0, 0, TAU); inkFill(g, col, LW);
  ellipse(g, -1 * s, 1 * s, 2.2 * s, 2.2 * s, 0, INK, 0);
  g.beginPath(); g.rect(8 * s, -1.4 * s, 26 * s, 2.8 * s); inkFill(g, C.chocolate, LW);
  g.beginPath(); g.rect(33 * s, -2.2 * s, 6 * s, 4.4 * s); inkFill(g, C.chocolate, LW);
  g.restore();
}

const studio: RoomFn = (g, R, who) => {
  R.shell(g, { back: '#f3ece0', left: '#e6ddcc', right: '#ddd2bf', floor: '#c9a87a', ceil: '#fbf6ea' }, LW);
  windowBack(g, R, 180, 470, 90, 240, '#f7c58f');
  // paint splats on the floor
  const Rr = rng(5); for (let i = 0; i < 26; i++) { const [x, y] = R.p(Rr() * 680, 40 + Rr() * 330, 0); ellipse(g, x, y, 3 + Rr() * 6, 2 + Rr() * 3, 0, pick(Rr, [C.coral, C.blue, C.mustard, C.teal, C.white]), 0); }
  const sc = new Scene(g);
  // canvases leaning on the right wall
  sc.add(60, () => { R.box(g, 600, 612, 40, 160, 0, 150, { front: C.white, side: '#f7f1df', lw: LW }); R.box(g, 620, 632, 60, 190, 0, 120, { front: C.white, side: C.butter, lw: LW }); R.box(g, 640, 652, 90, 200, 0, 96, { front: C.white, side: C.sky, lw: LW }); });
  // the table of paints
  sc.add(70, () => {
    R.box(g, 30, 190, 40, 120, 74, 80, { front: C.wood, lw: LW });
    for (const X of [34, 180]) R.box(g, X, X + 6, 112, 118, 0, 74, { front: C.wood, lw: LW });
    const Rr2 = rng(9); for (let i = 0; i < 7; i++) { const X = 44 + i * 20, col = pick(Rr2, [C.coral, C.blue, C.mustard, C.teal, C.violet, C.green]); R.box(g, X, X + 12, 70, 82, 80, 96 + Rr2() * 10, { front: '#e8e6e0', lw: LW * 0.7 }); const [x, y] = R.p(X + 6, 76, 100); ellipse(g, x, y, 4, 2, 0, col, 0); }
  });
  // the easel and the painting
  sc.add(200, () => {
    const L = (a: [number, number, number], b: [number, number, number]) => { const p = R.p(...a), q = R.p(...b); ln(g, p[0], p[1], q[0], q[1], LW * 3.6); ln(g, p[0], p[1], q[0], q[1], LW * 1.6, C.wood); };
    L([300, 190, 0], [345, 180, 230]); L([390, 190, 0], [345, 180, 230]); L([345, 150, 0], [345, 180, 220]);
    R.box(g, 255, 435, 190, 196, 100, 222, { front: C.white, side: '#eee', lw: LW });
    const [x0, y0] = R.p(262, 196, 215), [x1, y1] = R.p(428, 196, 107);
    g.save(); g.beginPath(); g.rect(x0, y0, x1 - x0, y1 - y0); g.clip();
    g.fillStyle = '#2c3f6b'; g.fillRect(x0, y0, x1 - x0, y1 - y0);
    g.fillStyle = C.orange; g.beginPath(); g.arc(x0 + (x1 - x0) * 0.65, y0 + (y1 - y0) * 0.38, (x1 - x0) * 0.18, 0, TAU); g.fill();
    g.fillStyle = C.coral; g.beginPath(); g.moveTo(x0, y1); g.lineTo(x0 + (x1 - x0) * 0.4, y0 + (y1 - y0) * 0.5); g.lineTo(x1, y1); g.fill();
    g.fillStyle = C.sea; g.fillRect(x0, y0 + (y1 - y0) * 0.82, x1 - x0, (y1 - y0) * 0.18);
    g.restore(); R.box(g, 255, 435, 196, 198, 100, 106, { front: C.wood, lw: LW });
  });
  rp(sc, R, who, 470, 250, 0, { turn: -0.75, look: look(211, { fem: true, skin: SKIN[1], hair: HAIR.black, style: 'bun', topKind: 'shirt', top: '#dfe6ef', accent: C.white, bottom: C.denim, apron: '#c7b07a', shoes: C.black }), pose: { ...POSES.point, armF: [118, 128], armN: [20, 100], head: -6 }, hold: (gg, J) => { const [x, y] = J.hN; gg.beginPath(); gg.ellipse(x, y, 13 * J.s * 0.5, 9 * J.s * 0.5, 0.2, 0, TAU); inkFill(gg, '#d2a679', LW); for (const [dx, dy, c] of [[-4, -2, C.coral], [2, -3, C.blue], [5, 1, C.mustard]] as [number, number, string][]) ellipse(gg, x + dx * J.s * 0.5, y + dy * J.s * 0.5, 2.2, 2, 0, c, 0); }, over: (gg, J) => { const [x, y] = J.hF; ln(gg, x, y, x - 12 * J.fwd, y - 16, LW * 2.2); ln(gg, x - 12 * J.fwd, y - 16, x - 15 * J.fwd, y - 20, LW * 3, C.coral); }, who: ['Inés, 31', 'Paints all night, sells coffee all morning. The orange sun in this one is the streetlight outside her window; it has been in every painting since she moved in.'] }, 250);
  sc.add(330, () => plantP(g, R, 620, 320, 120, C.ochre, 4));
  sc.draw();
};

const kitchen: RoomFn = (g, R, who) => {
  R.shell(g, { back: '#d9a23a', left: '#e3b23c', right: '#cf9a30', floor: '#f3dc8a', ceil: '#ecc35a' }, LW);
  // checkerboard floor
  for (let i = 0; i < 12; i++) for (let j = 0; j < 7; j++) if ((i + j) % 2) R.onFloor(g, i * 57, j * 55, (i + 1) * 57, (j + 1) * 55, C.black, 0);
  R.onFloor(g, 0, 0, R.Wc, R.D, null, LW);
  windowBack(g, R, 40, 170, 120, 220, '#f6a982');
  const sc = new Scene(g);
  // counter, stove with hood, fridge
  sc.add(5, () => {
    R.box(g, 190, 560, 0, 64, 0, 88, { front: '#e9dfc6', lw: LW });
    R.box(g, 186, 564, 0, 68, 88, 94, { front: '#7d2a3a', top: '#8a3a40', lw: LW });
    for (let i = 0; i < 4; i++) R.onBack(g, 196 + i * 92, 6, 278 + i * 92, 80, null, LW * 0.7, 64);
    // stove
    R.box(g, 330, 450, 0, 66, 0, 92, { front: '#8a9a7a', lw: LW });
    R.onBack(g, 342, 14, 438, 60, '#2b2b30', LW, 66);
    for (const X of [355, 425]) { const [x, y] = R.p(X, 40, 92); ellipse(g, x, y, 14, 4, 0, '#2b2b30', LW * 0.6); }
    R.box(g, 345, 435, 6, 60, 230, 270, { front: '#7a7a6a', lw: LW });
    R.box(g, 370, 410, 4, 30, 160, 230, { front: '#7a7a6a', lw: LW });
    // a pot, steaming
    R.box(g, 340, 380, 28, 58, 92, 118, { front: '#3a3a40', lw: LW });
    const [sx, sy] = R.p(360, 44, 125);
    for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(sx - 8 + i * 8, sy); g.bezierCurveTo(sx - 18 + i * 8, sy - 20, sx + 2 + i * 8, sy - 30, sx - 8 + i * 8, sy - 52); g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = LW * 1.4; g.stroke(); }
    // fridge
    R.box(g, 580, 680, 0, 70, 0, 190, { front: '#bfe0e8', lw: LW });
    const a = R.p(580, 70, 120), b = R.p(680, 70, 120); ln(g, a[0], a[1], b[0], b[1], LW);
    for (const [X, Z, c] of [[600, 150, C.red], [630, 140, C.mustard], [650, 160, C.teal], [610, 100, C.white]] as [number, number, string][]) { const [x, y] = R.p(X, 70, Z); g.beginPath(); g.rect(x, y, 14, 18); inkFill(g, c, LW * 0.6); }
  });
  rp(sc, R, who, 395, 120, 0, { turn: -0.35, back: true, look: look(221, { fem: true, age: 'old', skin: SKIN[2], hair: HAIR.grey, style: 'bun', topKind: 'blouse', top: C.violet, bottom: C.navy, bottomKind: 'longskirt', apron: C.white }), pose: POSES.cook, who: ['Carmen, 72', 'Sancocho on a Sunday, the way her mother made it in Santo Domingo. The secret is that there is no recipe.'] }, 120);
  // the table, with the boy doing homework
  sc.add(240, () => {
    R.box(g, 180, 400, 200, 280, 72, 78, { front: '#f4ecd6', top: '#fbf6e6', lw: LW });
    for (const X of [186, 390]) R.box(g, X, X + 6, 270, 278, 0, 72, { front: C.wood, lw: LW });
    pendant(g, R, 290, 240, C.pink, 80);
  });
  rp(sc, R, who, 250, 220, 46, { turn: 0.6, look: look(222, { fem: false, age: 'kid', skin: SKIN[2], hair: HAIR.black, style: 'curly', topKind: 'tee', top: C.red, bottom: C.denim }), pose: { ...POSES.sitDesk, head: 30 }, who: ['Leo, 8', 'Spelling words: neighbour, neighbourhood, neighbourly. He has written NEIGHBOR four times and is not convinced by the extra letters.'] }, 230);
  sc.add(226, () => { R.box(g, 220, 262, 200, 240, 0, 44, { front: C.teal, lw: LW }); R.box(g, 212, 220, 200, 240, 0, 96, { front: C.teal, lw: LW }); });
  sc.add(285, () => { const [x, y] = R.p(300, 260, 78); g.beginPath(); g.rect(x - 14, y - 6, 34, 12); inkFill(g, C.white, LW * 0.7); });
  rp(sc, R, who, 90, 300, 0, { turn: 0.5, look: look(223, { fem: false, skin: SKIN[3], hair: HAIR.black, style: 'short', topKind: 'jacket', top: C.navy, inner: C.white, bottom: C.char, beard: 'stubble' }), pose: { ...POSES.carry, armN: [10, 20] }, hold: (gg, J) => { const [x, y] = J.hF; gg.beginPath(); gg.moveTo(x - 14, y - 4); gg.lineTo(x + 18, y - 4); gg.lineTo(x + 14, y + 34); gg.lineTo(x - 10, y + 34); gg.closePath(); inkFill(gg, '#c9a070', LW); ellipse(gg, x + 2, y - 10, 8, 8, 0, C.green, LW); ellipse(gg, x + 10, y - 6, 6, 9, 0.3, C.butter, LW); }, mood: 'smile', who: ['Victor, 41', 'MTA bus driver, the B41 down Flatbush. Home with plantains and the good bread.'] }, 300);
  sc.draw();
};

const living: RoomFn = (g, R, who) => {
  R.shell(g, { back: '#3f8f8a', left: '#4b9a94', right: '#367f7a', floor: '#c98e5a', ceil: '#5aa29c' }, LW);
  frameOnBack(g, R, 160, 160, 70, 70, '#f3dc8a', C.ochre, (gg, x, y, w, h) => { gg.fillStyle = '#8a5a3a'; gg.beginPath(); gg.ellipse(x + w * 0.35, y + h * 0.5, w * 0.16, h * 0.22, 0, 0, TAU); gg.ellipse(x + w * 0.65, y + h * 0.5, w * 0.16, h * 0.22, 0, 0, TAU); gg.fill(); });
  frameOnBack(g, R, 250, 175, 50, 60, '#f7f1df', C.ochre, (gg, x, y, w, h) => { gg.fillStyle = '#5a3826'; gg.beginPath(); gg.ellipse(x + w / 2, y + h * 0.45, w * 0.22, h * 0.25, 0, 0, TAU); gg.fill(); gg.fillStyle = C.navy; gg.fillRect(x + w * 0.2, y + h * 0.7, w * 0.6, h * 0.3); });
  frameOnBack(g, R, 320, 150, 110, 80, C.sky, C.ochre, (gg, x, y, w, h) => { gg.fillStyle = C.green; gg.fillRect(x, y + h * 0.6, w, h * 0.4); gg.fillStyle = C.white; gg.beginPath(); gg.moveTo(x + w * 0.3, y + h * 0.9); gg.lineTo(x + w * 0.5, y + h * 0.35); gg.lineTo(x + w * 0.7, y + h * 0.9); gg.fill(); });
  const sc = new Scene(g);
  sc.add(40, () => {
    // the TV on its stand, against the right wall at an angle-ish
    R.box(g, 560, 670, 40, 110, 0, 56, { front: C.wood, lw: LW });
    R.box(g, 580, 660, 60, 70, 56, 64, { front: C.char, lw: LW });
    R.box(g, 540, 680, 66, 72, 64, 144, { front: '#26262b', lw: LW });
    const [x0, y0] = R.p(546, 72, 138), [x1, y1] = R.p(674, 72, 70);
    g.save(); g.beginPath(); g.rect(x0, y0, x1 - x0, y1 - y0); g.clip(); g.fillStyle = '#5fa04a'; g.fillRect(x0, y0, x1 - x0, y1 - y0); g.fillStyle = '#c9a070'; g.beginPath(); g.moveTo(x0 + (x1 - x0) * 0.5, y0 + (y1 - y0) * 0.3); g.lineTo(x1 - 6, y1 - 6); g.lineTo(x0 + 6, y1 - 6); g.fill(); g.fillStyle = '#fff'; g.fillRect(x0 + 4, y0 + 4, 46, 12); g.fillStyle = C.navy; g.font = `bold 9px ${SANS}`; g.fillText('NYM 4 · ATL 3', x0 + 6, y0 + 13); g.restore();
  });
  sc.add(150, () => { sofa(g, R, 80, 120, 330, C.mustard); });
  rp(sc, R, who, 170, 175, 44, { turn: 0.5, look: look(231, { fem: true, age: 'old', skin: SKIN[5], hair: HAIR.grey, style: 'short', topKind: 'sweater', top: C.coral, bottom: C.navy, glasses: true }), pose: { ...POSES.sit, armN: [30, 80], armF: [20, 60] }, mood: 'open', who: ['Denise, 66', 'Retired from thirty years at the post office. Has watched every Mets game since 1969 and believes, every single spring.'] }, 176);
  rp(sc, R, who, 300, 175, 44, { turn: 0.5, look: look(232, { fem: false, age: 'old', skin: SKIN[6], hair: HAIR.white, style: 'balding', topKind: 'shirt', top: C.white, accent: C.blue, bottom: C.khaki, hat: { kind: 'cap', color: C.blue } }), pose: { ...POSES.sit, armN: [150, 170], armF: [140, 165] }, mood: 'open', who: ['Paul, 69', 'Denise’s husband. Was a jazz pianist on weekends for forty years; this is the bottom of the ninth and he is on his feet without getting up.'] }, 177);
  sc.add(250, () => {
    R.box(g, 150, 330, 240, 300, 34, 40, { front: C.wood, top: shade(C.wood, 0.12), lw: LW });
    for (const X of [156, 320]) R.box(g, X, X + 6, 292, 300, 0, 34, { front: C.chocolate, lw: LW });
    const [x, y] = R.p(220, 270, 40); ellipse(g, x, y - 8, 22, 8, 0, C.white, LW); for (let i = 0; i < 5; i++) ellipse(g, x - 10 + i * 5, y - 12, 4, 3, 0, C.butter, LW * 0.5);
    const [cx, cy] = R.p(290, 265, 40); g.beginPath(); g.rect(cx - 6, cy - 22, 12, 22); inkFill(g, C.red, LW);
  });
  sc.add(320, () => { const [x, y] = R.p(470, 330, 0); dog(g, x, y, R.k(330) * 0.9, -1, '#f2efe6', LW, { sit: false, tail: 2, ear: '#9a5b34' }); });
  sc.add(60, () => { const [x0, y0] = R.p(40, 60, 0), [, y1] = R.p(40, 60, 170); ln(g, x0, y0, x0, y1, LW * 1.6); g.beginPath(); g.moveTo(x0 - 24, y1 + 30); g.lineTo(x0 - 14, y1 - 6); g.lineTo(x0 + 14, y1 - 6); g.lineTo(x0 + 24, y1 + 30); g.closePath(); inkFill(g, C.cream, LW); g.save(); const gr = g.createRadialGradient(x0, y1 + 30, 4, x0, y1 + 30, 120); gr.addColorStop(0, 'rgba(255,240,180,0.4)'); gr.addColorStop(1, 'rgba(255,240,180,0)'); g.fillStyle = gr; g.fillRect(x0 - 120, y1 - 80, 240, 240); g.restore(); });
  sc.draw();
};

const office: RoomFn = (g, R, who) => {
  R.shell(g, { back: '#f2b3c8', left: '#f0a3c4', right: '#e690b4', floor: '#b97a45', ceil: '#f7c6d6' }, LW);
  windowBack(g, R, 420, 620, 100, 230, '#f7c58f');
  // a bookshelf on the left wall
  const sc = new Scene(g);
  sc.add(30, () => {
    R.box(g, 0, 40, 30, 200, 0, 210, { front: C.white, side: '#f4ecd6', lw: LW });
    const Rr = rng(3); for (let r = 0; r < 4; r++) { let d = 36; while (d < 194) { const t = 4 + Rr() * 5, hh = 28 + Rr() * 14; R.onSide(g, 0, d, d + t, 10 + r * 50, 10 + r * 50 + hh, pick(Rr, [C.red, C.navy, C.mustard, C.teal, C.cream, C.violet]), LW * 0.5); d += t + 0.5; } }
  });
  // the desk facing the window
  sc.add(80, () => {
    R.box(g, 120, 400, 20, 110, 72, 78, { front: C.white, lw: LW });
    for (const X of [124, 392]) R.box(g, X, X + 6, 100, 108, 0, 72, { front: C.white, lw: LW });
    R.box(g, 220, 320, 40, 46, 92, 156, { front: C.char, lw: LW });
    R.box(g, 266, 274, 46, 56, 78, 92, { front: C.char, lw: LW });
    // the call on the back of the screen is not visible; a mug and a plant
    R.box(g, 140, 160, 70, 90, 78, 100, { front: C.coral, lw: LW });
    const [px, py] = R.p(370, 60, 78); g.beginPath(); g.rect(px - 10, py - 18, 20, 18); inkFill(g, C.white, LW); for (let i = 0; i < 4; i++) { g.beginPath(); g.ellipse(px - 6 + i * 4, py - 26, 4, 10, -0.4 + i * 0.3, 0, TAU); inkFill(g, C.green, LW * 0.6); }
  });
  rp(sc, R, who, 270, 160, 46, { turn: 0.3, back: true, look: look(241, { fem: true, skin: SKIN[4], hair: HAIR.black, style: 'braids', topKind: 'blouse', top: C.white, bottom: C.black, hat: { kind: 'headphones', color: C.char } }), pose: { ...POSES.sitDesk, armF: [80, 160] }, who: ['Aisha, 38', 'Quarterly budget review for a company in Ohio, with eleven people on the call. Her microphone is muted; her daughter is not.'] }, 160);
  sc.add(162, () => { R.box(g, 248, 292, 176, 204, 0, 40, { front: C.teal, lw: LW }); R.box(g, 254, 286, 196, 202, 44, 84, { front: C.teal, lw: LW }); });
  rp(sc, R, who, 340, 230, 0, { turn: -0.4, look: look(242, { fem: true, age: 'kid', skin: SKIN[4], hair: HAIR.black, style: 'afro', topKind: 'dress', top: C.butter, bottom: C.butter, shoes: C.pink, scale: 0.78 } as Partial<Look>), pose: { ...POSES.reach, armF: [140, 150], head: -20 }, scale: 0.78, mood: 'open', who: ['Noor, 2', 'Would like to be on the call. Would like it very much.'] }, 230);
  sc.add(300, () => {
    rugF(g, R, 380, 250, 620, 360, C.sky, C.white);
    for (const [X, d, c] of [[450, 300, C.red], [520, 320, C.mustard], [560, 290, C.teal]] as [number, number, string][]) R.box(g, X, X + 22, d, d + 22, 0, 22, { front: c, lw: LW });
  });
  sc.draw();
};

const bath: RoomFn = (g, R, who) => {
  R.shell(g, { back: '#cfe7ec', left: '#bfe0e8', right: '#b0d6df', floor: '#f4f0e6', ceil: '#e4f2f5' }, LW);
  // tiles
  for (let X = 0; X < R.Wc; X += 30) { const a = R.p(X, 0, 0), b = R.p(X, 0, 140); ln(g, a[0], a[1], b[0], b[1], 0.8, 'rgba(31,26,23,0.3)'); }
  for (let Z = 0; Z <= 140; Z += 30) { const a = R.p(0, 0, Z), b = R.p(R.Wc, 0, Z); ln(g, a[0], a[1], b[0], b[1], 0.8, 'rgba(31,26,23,0.3)'); }
  R.onBack(g, 0, 140, R.Wc, 146, C.white, LW * 0.7);
  for (let i = 0; i < 12; i++) for (let j = 0; j < 7; j++) if ((i + j) % 2) R.onFloor(g, i * 57, j * 55, (i + 1) * 57, (j + 1) * 55, '#3a3a40', 0);
  const sc = new Scene(g);
  // the tub, on feet
  sc.add(60, () => {
    R.box(g, 40, 300, 30, 120, 10, 70, { front: C.white, top: '#e9f3f6', lw: LW });
    R.box(g, 54, 286, 40, 110, 66, 70, { front: '#9ad0e0', top: '#9ad0e0', lw: LW * 0.6 });
    for (const X of [52, 280]) { const [x, y] = R.p(X, 116, 0); ellipse(g, x, y - 5, 7, 6, 0, C.ochre, LW); }
    // bubbles
    const Rr = rng(4); for (let i = 0; i < 20; i++) { const [x, y] = R.p(70 + Rr() * 200, 60 + Rr() * 40, 72); ellipse(g, x, y - Rr() * 10, 5 + Rr() * 9, 5 + Rr() * 8, 0, '#fbfaf5', LW * 0.6); }
  });
  rp(sc, R, who, 170, 80, 40, { turn: 0.4, look: look(251, { fem: false, age: 'kid', skin: SKIN[0], hair: HAIR.ginger, style: 'curly', topKind: 'tank', top: SKIN[0], bottom: SKIN[0], scale: 0.9 } as Partial<Look>), pose: { ...POSES.handsUp, sit: true, legN: [80, 0], legF: [80, 0] }, mood: 'open', who: ['Ben, 5', 'Has made a bubble beard. Is now a pirate. The duck is also a pirate.'] }, 81);
  sc.add(90, () => { R.box(g, 40, 300, 118, 122, 10, 70, { front: C.white, lw: LW }); const [x, y] = R.p(240, 100, 76); g.beginPath(); g.ellipse(x, y, 14, 10, 0, 0, TAU); inkFill(g, '#ffd25a', LW); g.beginPath(); g.ellipse(x + 10, y - 12, 8, 7, 0, 0, TAU); inkFill(g, '#ffd25a', LW); g.beginPath(); g.moveTo(x + 17, y - 13); g.lineTo(x + 26, y - 10); g.lineTo(x + 17, y - 8); inkFill(g, C.orange, LW * 0.7); });
  rp(sc, R, who, 260, 200, 0, { turn: -0.5, look: look(252, { fem: false, skin: SKIN[0], hair: HAIR.brown, style: 'short', topKind: 'tee', top: C.grey, bottom: C.navy, beard: true }), pose: POSES.kneel, mood: 'smile', hold: (gg, J) => { const [x, y] = J.hN; gg.beginPath(); gg.rect(x - 8, y - 20, 20, 30); inkFill(gg, C.coral, LW); }, who: ['Tom, 37', 'Kindergarten teacher, which is to say a professional. Has been splashed eleven times tonight and is counting.'] }, 200);
  // sink and mirror on the right
  sc.add(80, () => {
    R.box(g, 520, 640, 20, 90, 0, 80, { front: C.white, lw: LW });
    R.box(g, 516, 644, 18, 94, 80, 88, { front: '#e9f3f6', lw: LW });
    R.onBack(g, 540, 120, 620, 220, '#dff1f6', LW);
    R.onBack(g, 548, 128, 612, 212, '#bfe0e8', LW * 0.6);
    const [tx, ty] = R.p(580, 40, 88); ln(g, tx, ty, tx, ty - 22, LW * 3); ln(g, tx, ty - 22, tx + 12, ty - 22, LW * 3);
  });
  sc.add(320, () => { R.box(g, 600, 680, 300, 360, 0, 6, { front: C.teal, top: C.teal, lw: LW }); });
  sc.draw();
};

const tailor: RoomFn = (g, R, who) => {
  R.shell(g, { back: '#efe2c2', left: '#e6d6b0', right: '#dccaa0', floor: '#9a6440', ceil: '#f4ecd6' }, LW);
  // shelves of cloth on the back wall
  R.onBack(g, 30, 30, 340, 200, '#c08a54', LW);
  const Rr = rng(8); for (let r = 0; r < 4; r++) for (let i = 0; i < 9; i++) { const X = 40 + i * 33, Z = 40 + r * 40; R.onBack(g, X, Z, X + 30, Z + 32, pick(Rr, [C.navy, C.wine, C.khaki, C.char, C.cream, C.teal, C.brick, C.olive, C.grey]), LW * 0.6); }
  R.onBack(g, 380, 100, 640, 170, C.white, LW);
  const sc = new Scene(g);
  // the sign, painted on the back wall in gold
  sc.add(0, () => { const [x, y] = R.p(510, 0, 135); g.font = `600 ${Math.round(28 * R.k(0) / 1.1)}px "Cinzel", serif`; g.textAlign = 'center'; g.fillStyle = '#9a6a1a'; g.fillText('KIM ALTERATIONS', x, y + 6); g.font = `italic ${Math.round(18 * R.k(0))}px ${SERIF}`; g.fillText('since 1984', x, y + 30); });
  // the sewing table
  sc.add(80, () => {
    R.box(g, 420, 640, 30, 100, 72, 78, { front: C.wood, lw: LW });
    for (const X of [424, 632]) R.box(g, X, X + 6, 92, 100, 0, 72, { front: C.chocolate, lw: LW });
    R.box(g, 480, 560, 50, 80, 78, 108, { front: C.char, lw: LW }); R.box(g, 540, 560, 50, 80, 78, 120, { front: C.char, lw: LW });
    R.box(g, 470, 560, 50, 80, 112, 122, { front: C.char, lw: LW });
  });
  // the mannequin
  sc.add(120, () => {
    const [x, y] = R.p(330, 120, 0), k = R.k(120);
    ln(g, x, y, x, y - 90 * k, LW * 2);
    g.beginPath(); g.moveTo(x - 30 * k, y - 160 * k); g.quadraticCurveTo(x - 34 * k, y - 120 * k, x - 22 * k, y - 90 * k); g.lineTo(x + 22 * k, y - 90 * k); g.quadraticCurveTo(x + 34 * k, y - 120 * k, x + 30 * k, y - 160 * k); g.quadraticCurveTo(x, y - 170 * k, x - 30 * k, y - 160 * k); inkFill(g, C.navy, LW);
    g.beginPath(); g.moveTo(x - 8 * k, y - 164 * k); g.lineTo(x, y - 120 * k); g.lineTo(x + 8 * k, y - 164 * k); inkFill(g, C.white, LW * 0.8);
    ellipse(g, x, y - 170 * k, 8 * k, 5 * k, 0, '#d2a679', LW);
  });
  // a customer on the little platform, being measured
  sc.add(208, () => R.box(g, 160, 260, 180, 250, 0, 14, { front: C.wine, top: shade(C.wine, 0.15), lw: LW }));
  rp(sc, R, who, 210, 215, 14, { turn: 0.15, look: look(261, { fem: false, skin: SKIN[5], hair: HAIR.black, style: 'buzz', topKind: 'jacket', top: '#2c3f6b', inner: C.white, bottom: '#2c3f6b', shoes: C.black, beard: 'stubble' }), pose: { ...POSES.standFront, armN: [-40, -40], armF: [40, 40] }, mood: 'smile', who: ['Darnell, 26', 'Getting married on Saturday. The suit was his grandfather’s; Mr. Kim is taking it in an inch and letting the trousers down two.'] }, 215);
  rp(sc, R, who, 300, 250, 0, { turn: -0.6, look: look(262, { fem: false, age: 'old', skin: SKIN[1], hair: HAIR.white, style: 'side', topKind: 'vest', top: C.char, inner: C.white, bottom: C.char, glasses: true }), pose: POSES.kneel, hold: (gg, J) => { const [x1, y1] = J.hN, [x2, y2] = J.hF; gg.beginPath(); gg.moveTo(x1, y1); gg.quadraticCurveTo((x1 + x2) / 2, Math.max(y1, y2) + 20, x2, y2); gg.strokeStyle = '#ffd25a'; gg.lineWidth = 4; gg.stroke(); }, who: ['Mr. Kim, 79', 'Opened this shop in 1984 with one machine and a loan from his brother-in-law. Has taken in, let out and hemmed most of the neighbourhood since.'] }, 250);
  sc.draw();
};

const hall: RoomFn = (g, R, who) => {
  R.shell(g, { back: '#9fc0a0', left: '#a9c9a6', right: '#8fb090', floor: '#e6dcc6', ceil: '#c3d9c0' }, LW);
  // black-and-white hall tiles
  for (let i = 0; i < 24; i++) for (let j = 0; j < 14; j++) if ((i + j) % 2) R.onFloor(g, i * 28.5, j * 27.5, (i + 1) * 28.5, (j + 1) * 27.5, '#3a3a40', 0);
  // the stairs, climbing to the back left
  const sc = new Scene(g);
  sc.add(5, () => {
    for (let i = 0; i < 12; i++) { const X0 = 40, X1 = 230, d1 = 380 - i * 30, d0 = d1 - 30, Z1 = 20 + i * 20; R.box(g, X0, X1, d0, d1, Z1 - 20, Z1, { front: '#7a4a2a', top: '#a86a3e', lw: LW }); }
    R.box(g, 226, 236, 30, 380, 0, 270, { front: '#5a3826', lw: LW, side: '#6b4128' });
  });
  // mailboxes on the right wall
  sc.add(30, () => { R.onSide(g, 1, 60, 200, 100, 170, '#c9a04a', LW); for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) R.onSide(g, 1, 66 + i * 33, 96 + i * 33, 106 + j * 32, 132 + j * 32, '#d9b45a', LW * 0.6); });
  rp(sc, R, who, 590, 120, 0, { turn: 0.55, back: true, look: look(271, { fem: false, age: 'old', skin: SKIN[0], hair: HAIR.white, style: 'balding', topKind: 'coat', top: C.khaki, bottom: C.grey, hat: { kind: 'cap', color: '#5c6670' } }), pose: { ...POSES.cradle, head: 10 }, who: ['Mr. Abernathy, 88', 'Lived on the top floor since 1961. Checks the mailbox three times a day for a letter from his granddaughter in Lagos. It comes on Thursdays.'] }, 120);
  // the delivery, at the door
  sc.add(260, () => { for (let i = 0; i < 3; i++) R.box(g, 360 + i * 10, 420 + i * 6, 300 - i * 4, 340 - i * 4, i * 30, i * 30 + 30, { front: '#c9a070', top: '#dcb886', lw: LW }); });
  rp(sc, R, who, 470, 300, 0, { turn: -0.5, look: look(272, { fem: true, skin: SKIN[3], hair: HAIR.black, style: 'ponytail', topKind: 'tee', top: C.tang, bottom: C.char, hat: { kind: 'cap', color: C.tang } }), pose: { ...POSES.phone, head: 18 }, hold: (gg, J) => { const [x, y] = J.hN; gg.beginPath(); gg.roundRect(x - 6, y - 14, 12, 18, 2); inkFill(gg, C.char, LW); }, who: ['Maribel, 29', 'One hundred and forty stops today. Scans the boxes, takes the photo, knows which dogs bark and which ones just want to say hello.'] }, 300);
  // a bicycle on the wall
  sc.add(50, () => { for (const d of [70, 150]) { const [x, y] = R.p(R.Wc - 2, d, 150); g.beginPath(); g.ellipse(x - 8, y, 14, 40, 0, 0, TAU); g.lineWidth = LW * 1.6; g.strokeStyle = INK; g.stroke(); } const a = R.p(R.Wc - 4, 70, 160), b = R.p(R.Wc - 4, 150, 160); ln(g, a[0] - 8, a[1], b[0] - 8, b[1], LW * 2, C.red); });
  sc.draw();
};

const boiler: RoomFn = (g, R, who) => {
  R.shell(g, { back: '#b8b3a8', left: '#aaa59a', right: '#9e998e', floor: '#8f8a80', ceil: '#c4c0b6' }, LW);
  // block joints
  for (let Z = 20; Z < 270; Z += 30) { const a = R.p(0, 0, Z), b = R.p(R.Wc, 0, Z); ln(g, a[0], a[1], b[0], b[1], 0.8, 'rgba(31,26,23,0.25)'); }
  const sc = new Scene(g);
  // pipes along the ceiling
  sc.add(1, () => { for (const [Z, c] of [[240, '#b9824e'], [220, '#c9c9c4']] as [number, string][]) { const a = R.p(0, 20, Z), b = R.p(R.Wc, 20, Z); ln(g, a[0], a[1], b[0], b[1], 14 * R.k(20) + LW * 2); ln(g, a[0], a[1], b[0], b[1], 14 * R.k(20), c); } });
  // boiler
  sc.add(40, () => {
    R.box(g, 40, 200, 10, 110, 0, 180, { front: '#d9493f', lw: LW });
    R.box(g, 100, 130, 30, 60, 180, 240, { front: '#9aa0a6', lw: LW });
    const [gx, gy] = R.p(90, 110, 130); ellipse(g, gx, gy, 18, 18, 0, C.white, LW); ln(g, gx, gy, gx + 10, gy - 8, LW);
    R.onBack(g, 70, 30, 170, 80, '#a9483a', LW, 110);
    const [fx, fy] = R.p(120, 110, 50); g.save(); g.fillStyle = '#ffb347'; g.beginPath(); g.moveTo(fx - 16, fy + 10); g.quadraticCurveTo(fx - 8, fy - 20, fx, fy - 2); g.quadraticCurveTo(fx + 8, fy - 24, fx + 16, fy + 10); g.fill(); g.restore();
  });
  rp(sc, R, who, 250, 150, 0, { turn: -0.55, look: look(281, { fem: false, skin: SKIN[3], hair: HAIR.grey, style: 'short', topKind: 'shirt', top: '#5c6f86', accent: '#5c6f86', bottom: C.navy, beard: 'mustache' }), pose: { ...POSES.cook, armF: [110, 130] }, hold: (gg, J) => { const [x, y] = J.hF; gg.save(); gg.translate(x, y); gg.rotate(-0.8 * J.fwd); gg.beginPath(); gg.rect(-3, -26, 6, 30); inkFill(gg, '#9aa0a6', LW); gg.beginPath(); gg.arc(0, -30, 7, 0, TAU); inkFill(gg, '#9aa0a6', LW); gg.restore(); }, who: ['Héctor, 58', 'The super. Has kept this boiler running since 1997 with a wrench, a flashlight and, he says, conversation.'] }, 150);
  // washer, dryer and the laundry table
  sc.add(60, () => {
    for (const [X, c] of [[440, '#f4f0e6'], [540, '#f4f0e6']] as [number, string][]) { R.box(g, X, X + 90, 10, 90, 0, 100, { front: c, lw: LW }); const [x, y] = R.p(X + 45, 90, 50); ellipse(g, x, y, 26, 26, 0, '#cfe7ec', LW); ellipse(g, x, y, 18, 18, 0, '#9ad0e0', LW * 0.7); }
  });
  sc.add(220, () => { R.box(g, 420, 640, 200, 270, 80, 86, { front: C.wood, lw: LW }); for (const X of [424, 632]) R.box(g, X, X + 6, 262, 270, 0, 80, { front: C.chocolate, lw: LW }); for (const [X, c] of [[440, C.white], [490, C.sky], [540, C.pink], [590, C.mustard]] as [number, string][]) R.box(g, X, X + 40, 215, 245, 86, 92 + (X % 3) * 3, { front: c, lw: LW * 0.7 }); });
  rp(sc, R, who, 530, 175, 0, { turn: -0.2, look: look(282, { fem: true, skin: SKIN[6], hair: HAIR.black, style: 'short', topKind: 'scrubs', top: '#6cc0b0', bottom: '#6cc0b0', shoes: C.white }), pose: { ...POSES.carry, lean: 10, head: 20 }, hold: (gg, J) => { const cx = (J.hN[0] + J.hF[0]) / 2, cy = (J.hN[1] + J.hF[1]) / 2; gg.beginPath(); gg.rect(cx - 16, cy - 8, 32, 10); inkFill(gg, C.lav, LW); }, eyes: 'down', who: ['Grace, 45', 'ICU nurse, three twelves a week at Kings County. Folding scrubs at nine at night so she can sleep through tomorrow.'] }, 175);
  sc.draw();
};

const band: RoomFn = (g, R, who) => {
  R.shell(g, { back: '#3a3550', left: '#443e5e', right: '#332e48', floor: '#5a4a40', ceil: '#2a263a' }, LW);
  // foam on the walls
  for (let X = 20; X < R.Wc - 20; X += 40) for (let Z = 40; Z < 250; Z += 40) R.onBack(g, X, Z, X + 34, Z + 34, ((X + Z) / 40) % 2 ? '#4a4466' : '#403a5a', LW * 0.5);
  // a poster and lights
  R.onBack(g, 280, 120, 400, 230, C.tang, LW); R.onBack(g, 290, 130, 390, 220, null, LW * 0.6);
  const [px, py] = R.p(340, 0, 170); g.font = `bold ${Math.round(22 * R.k(0))}px ${SANS}`; g.textAlign = 'center'; g.fillStyle = INK; g.fillText('THE', px, py - 12); g.fillText('SUPERS', px, py + 12);
  const pts: Pt[] = []; for (let i = 0; i <= 16; i++) pts.push(R.p(20 + i * 40, 0, 255 - Math.sin(i / 2) * 6));
  pts.forEach((p, i) => { if (i % 2) ellipse(g, p[0], p[1], 4, 5, 0, ['#ffd25a', '#ff8a7a', '#9ae0c0'][i % 3], LW * 0.4); });
  const sc = new Scene(g);
  sc.add(200, () => rugF(g, R, 120, 140, 560, 370, '#a9483a', C.butter));
  // the drums
  sc.add(120, () => {
    const dr = (X: number, d: number, Z: number, r: number, h: number, col: string) => { const [x, y] = R.p(X, d, Z), k = R.k(d); g.beginPath(); g.rect(x - r * k, y - h * k, 2 * r * k, h * k); inkFill(g, col, LW); ellipse(g, x, y - h * k, r * k, r * k * 0.32, 0, '#f4f0e6', LW); };
    dr(330, 110, 0, 36, 50, C.red);
    const [bx, by] = R.p(330, 140, 0), k = R.k(140); ellipse(g, bx, by - 30 * k, 34 * k, 32 * k, 0, C.red, LW); ellipse(g, bx, by - 30 * k, 24 * k, 22 * k, 0, '#f4f0e6', LW); g.font = `bold ${Math.round(9 * k)}px ${SANS}`; g.textAlign = 'center'; g.fillStyle = C.red; g.fillText('SUPERS', bx, by - 27 * k);
    dr(270, 150, 50, 18, 18, C.red); dr(390, 150, 54, 16, 16, C.red);
    for (const [X, Z] of [[230, 110], [430, 120]] as [number, number][]) { const [x, y] = R.p(X, 130, 0), [, yt] = R.p(X, 130, Z); ln(g, x, y, x, yt, LW); ellipse(g, x, yt, 26 * R.k(130), 6 * R.k(130), -0.1, '#e3b23c', LW); }
  });
  rp(sc, R, who, 330, 70, 46, { turn: 0.1, look: look(291, { fem: false, skin: SKIN[1], hair: HAIR.black, style: 'side', topKind: 'tank', top: C.white, bottom: C.black, beard: false }), pose: { ...POSES.sit, armN: [-60, 20], armF: [60, -20] }, mood: 'open', hold: (gg, J) => { for (const h of [J.hN, J.hF]) ln(gg, h[0], h[1], h[0] + (h === J.hN ? -16 : 16), h[1] - 14, LW * 1.8, C.tan); }, who: ['Kenji, 22', 'Drums. Studies accounting at Brooklyn College, which his parents know about, and plays in a band, which they are finding out about tonight.'] }, 71);
  sc.add(60, () => { R.box(g, 520, 610, 30, 80, 0, 90, { front: '#26262b', lw: LW }); R.onBack(g, 528, 10, 602, 76, '#3a3a40', LW * 0.7, 80); for (let i = 0; i < 4; i++) { const [x, y] = R.p(530 + i * 18, 80, 82); ellipse(g, x, y, 3, 3, 0, C.ash, 0.6); } });
  rp(sc, R, who, 180, 230, 0, { turn: 0.5, look: look(292, { fem: true, skin: SKIN[5], hair: HAIR.black, style: 'afro', topKind: 'jacket', top: C.black, inner: C.red, bottom: C.denim, shoes: C.white }), pose: POSES.play, hold: (gg, J) => guitar(gg, J, C.teal), mood: 'flat', who: ['Tasha, 23', 'Bass. Wrote the riff on the 2 train between Nostrand and Franklin. The super has asked them to stop at ten. They stop at ten fifteen.'] }, 230);
  rp(sc, R, who, 470, 260, 0, { turn: -0.35, look: look(293, { fem: false, skin: SKIN[2], hair: HAIR.dark, style: 'curly', topKind: 'tee', top: C.mustard, bottom: C.char, beard: 'stubble' }), pose: { ...POSES.call, armF: [150, 175], head: -14 }, mood: 'open', hold: (gg, J) => { const [x, y] = J.hN; gg.beginPath(); gg.ellipse(x + 3, y - 8, 4.5, 6, 0.2, 0, TAU); inkFill(gg, C.char, LW); }, who: ['Marco, 21', 'Vocals. Works the counter at the bakery on Cortelyou; sings to the ovens at five in the morning, which is where most of these songs started.'] }, 260);
  sc.draw();
};

/* ───────── the house ───────── */

function paint(g: G, who: Who[]) {
  // the sky, evening
  const sky = g.createLinearGradient(0, 0, 0, 560); sky.addColorStop(0, '#f7b98a'); sky.addColorStop(1, '#f9dfae');
  g.fillStyle = sky; g.fillRect(0, 0, W, 1800);
  ellipse(g, 1500, 250, 90, 90, 0, '#fff1c8', 0);
  for (const [x, y, w] of [[260, 170, 220], [700, 120, 160], [1180, 230, 260], [1700, 140, 140]]) { g.fillStyle = 'rgba(255,248,232,0.75)'; g.beginPath(); g.roundRect(x, y, w, 26, 13); g.fill(); g.beginPath(); g.roundRect(x + w * 0.2, y - 16, w * 0.45, 26, 13); g.fill(); }
  // the skyline far off
  g.fillStyle = '#e8a080'; for (const [x, w, h] of [[0, 120, 180], [140, 70, 260], [230, 110, 150], [1840, 80, 200]]) g.fillRect(x, 560 - h, w, h + 1200);

  /* neighbours */
  // left: an intact brownstone, lit
  g.fillStyle = '#9a5a43'; g.fillRect(0, 380, 262, 1380); rect(g, -2, 380, 264, 1380, null, LW);
  rect(g, -2, 360, 266, 24, '#7a3e30', LW); rect(g, -2, 384, 266, 12, '#b8705a', LW);
  for (let f = 0; f < 4; f++) for (const x of [40, 150]) { const y = 450 + f * 322; rect(g, x, y, 76, 150, '#ffd98a', LW); rect(g, x - 6, y - 14, 88, 14, '#b8705a', LW); ln(g, x + 38, y, x + 38, y + 150, LW); ln(g, x, y + 75, x + 76, y + 75, LW); }
  // right
  g.fillStyle = '#b8574a'; g.fillRect(1850, 330, 70, 1430); rect(g, 1850, 330, 72, 1430, null, LW);
  for (let f = 0; f < 5; f++) rect(g, 1872, 400 + f * 270, 60, 120, '#ffd98a', LW);

  /* the cut section of the house */
  g.fillStyle = SECTION; g.fillRect(270, 470, 1570, 1314);
  rect(g, 270, 470, 1570, 1314, null, LW * 1.4);
  // cornice and parapet
  rect(g, 258, 440, 1594, 32, '#5e2e24', LW); rect(g, 270, 430, 1570, 12, '#8a4a3a', LW);
  // the floors: four storeys over the street, two rooms each
  const floors = [496, 822, 1148, 1474];
  const roomsL: RoomFn[] = [bedroom, kitchen, office, tailor], roomsR: RoomFn[] = [studio, living, bath, hall];
  floors.forEach((y, i) => {
    const RL = new PRoom(296, y, 750, 300, 270, 380, 0.7, 0.44, 0.5), RR = new PRoom(1072, y, 742, 300, 270, 380, 0.7, 0.44, 0.5);
    g.save(); g.beginPath(); g.rect(296, y, 750, 300); g.clip(); roomsL[i](g, RL, who); g.restore();
    g.save(); g.beginPath(); g.rect(1072, y, 742, 300); g.clip(); roomsR[i](g, RR, who); g.restore();
    rect(g, 296, y, 750, 300, null, LW * 1.6); rect(g, 1072, y, 742, 300, null, LW * 1.6);
  });
  // a little hatching in the section, so it reads as cut
  g.save(); g.beginPath(); g.rect(270, 470, 1570, 1314); for (const y of floors) { g.rect(296, y, 750, 300); g.rect(1072, y, 742, 300); } g.clip('evenodd');
  g.strokeStyle = SECTION2; g.lineWidth = 1.4; g.beginPath(); for (let d = -2400; d < 2400; d += 14) { g.moveTo(270 + d, 470); g.lineTo(270 + d + 1314, 1784); } g.stroke(); g.restore();

  /* the street, the sidewalk, the stoop next door */
  g.fillStyle = '#d6cfc0'; g.fillRect(0, 1774, W, 30); rect(g, -2, 1774, W + 4, 30, null, LW);
  // the neighbour's stoop
  for (let i = 0; i < 7; i++) rect(g, 0, 1774 - (i + 1) * 30, 230 - i * 22, 30, '#a8644c', LW);
  rect(g, 196, 1550, 20, 224, '#3a2a22', LW);
  const st = new Scene(g);
  st.add(1, () => fp(g, who, 70, 1714, 1.75, { turn: 0.55, look: look(301, { fem: true, age: 'old', skin: SKIN[6], hair: HAIR.white, style: 'short', topKind: 'blouse', top: C.pink, bottom: C.navy, bottomKind: 'skirt', glasses: true }), pose: { ...POSES.sit, armN: [30, 70], armF: [50, 100] }, mood: 'open', who: ['Mrs. Johnson, 84', 'On this stoop every evening it is warm enough since 1958. Knows everyone on the block, and who they used to be.'] }));
  st.add(2, () => fp(g, who, 150, 1774, 1.7, { turn: -0.4, look: look(302, { fem: true, skin: SKIN[3], hair: HAIR.black, style: 'long', topKind: 'tee', top: C.butter, bottom: C.denim }), pose: { ...POSES.stand, armF: [60, 100] }, mood: 'smile', hold: (gg, J) => { const [x, y] = J.hF; gg.beginPath(); gg.rect(x - 6, y - 10, 12, 14); inkFill(gg, C.white, LW); gg.beginPath(); gg.rect(x - 6, y - 14, 12, 4); inkFill(gg, C.red, LW); }, who: ['Yolanda, 52', 'Brought Mrs. Johnson an iced coffee. Stayed forty minutes. Will stay forty more.'] }));
  st.draw();

  /* the roof */
  const rs = new Scene(g);
  // chimney and antenna
  rect(g, 340, 360, 60, 70, '#8a4a3a', LW); rect(g, 334, 352, 72, 12, '#5e2e24', LW);
  ln(g, 480, 430, 480, 300, LW * 1.4); for (let i = 0; i < 4; i++) ln(g, 450 + i * 4, 320 + i * 22, 510 - i * 4, 320 + i * 22, LW);
  // tomatoes in tubs
  for (let i = 0; i < 3; i++) { const x = 600 + i * 90; rect(g, x, 395, 70, 36, '#c97a4a', LW); const R2 = rng(i + 3); for (let j = 0; j < 7; j++) { ellipse(g, x + 10 + R2() * 50, 380 - R2() * 34, 12, 8, R2() * 3, C.green, LW * 0.8); } for (let j = 0; j < 4; j++) ellipse(g, x + 12 + R2() * 46, 384 - R2() * 26, 6, 6, 0, C.red, LW * 0.8); ln(g, x + 35, 395, x + 35, 330, LW * 0.8, C.wood); }
  // two lawn chairs and the couple
  rs.add(1, () => {
    for (const [x, dir] of [[960, 1], [1150, -1]] as [number, number][]) { rect(g, x, 392, 74, 10, C.sky, LW); ln(g, x + 4, 402, x - 4, 440, LW * 1.4); ln(g, x + 70, 402, x + 78, 440, LW * 1.4); const bx = dir > 0 ? x : x + 74; g.beginPath(); g.moveTo(bx, 392); g.lineTo(bx - 18 * dir, 342); g.lineTo(bx - 6 * dir, 338); g.lineTo(bx + 12 * dir, 392); g.closePath(); inkFill(g, C.sky, LW); }
    fp(g, who, 1000, 396, 1.75, { turn: 0.55, look: look(311, { fem: true, skin: SKIN[1], hair: HAIR.black, style: 'bob', topKind: 'tee', top: C.coral, bottom: C.denim, bottomKind: 'shorts' }), pose: { ...POSES.sitBack, armF: [80, 100] }, mood: 'smile', hold: (gg, J) => { const [x, y] = J.hF; gg.beginPath(); gg.rect(x - 4, y - 14, 8, 16); inkFill(gg, '#cfe7ec', LW); }, who: ['Jae, 33', 'Moved up from the second floor when the top-floor lease came open; the roof was the reason.'] });
    fp(g, who, 1182, 396, 1.75, { turn: -0.55, look: look(312, { fem: false, skin: SKIN[4], hair: HAIR.black, style: 'locs', topKind: 'shirt', top: C.olive, accent: C.butter, bottom: C.khaki }), pose: { ...POSES.sitBack, armF: [60, 110] }, mood: 'open', who: ['Sam, 34', 'Says the sunset over the Verrazzano is the best free thing in the city. Is about to propose. Jae has known since Tuesday.'] });
  });
  rs.draw();
  // string lights over the roof
  g.beginPath(); g.moveTo(900, 330); g.quadraticCurveTo(1060, 380, 1240, 330); g.lineWidth = LW * 0.7; g.strokeStyle = INK; g.stroke();
  for (let i = 1; i < 10; i++) { const t = i / 10, x = 900 + 340 * t, y = 330 + 2 * t * (1 - t) * 50; ellipse(g, x, y + 5, 4, 5, 0, '#ffe08a', LW * 0.5); }
  // the pigeon coop and the man with the flag
  rect(g, 1440, 330, 220, 100, '#d8c49a', LW);
  g.save(); g.beginPath(); g.rect(1450, 340, 120, 80); g.clip(); g.strokeStyle = 'rgba(31,26,23,0.5)'; g.lineWidth = 1; g.beginPath(); for (let d = -100; d < 220; d += 10) { g.moveTo(1450 + d, 340); g.lineTo(1450 + d + 80, 420); g.moveTo(1450 + d + 80, 340); g.lineTo(1450 + d, 420); } g.stroke(); g.restore();
  rect(g, 1450, 340, 120, 80, null, LW); g.beginPath(); g.moveTo(1428, 334); g.lineTo(1550, 290); g.lineTo(1672, 334); g.closePath(); inkFill(g, '#8a4a3a', LW);
  rect(g, 1590, 360, 50, 70, '#a87a4a', LW);
  fp(g, who, 1760, 440, 1.78, { turn: -0.5, look: look(321, { fem: false, age: 'old', skin: SKIN[1], hair: HAIR.white, style: 'balding', topKind: 'tank', top: C.white, bottom: C.navy, beard: false, hat: { kind: 'cap', color: C.navy } }), pose: { ...POSES.wave, armF: [150, 168] }, mood: 'open', over: (gg, J) => { const [x, y] = J.hF; ln(gg, x, y + 30, x - 30 * J.fwd, y - 120, LW * 2.6); ln(gg, x, y + 30, x - 30 * J.fwd, y - 120, LW, C.wood); gg.beginPath(); gg.moveTo(x - 30 * J.fwd, y - 120); gg.lineTo(x - 90 * J.fwd, y - 104); gg.lineTo(x - 26 * J.fwd, y - 86); gg.closePath(); inkFill(gg, C.red, LW); }, who: ['Sal, 81', 'Has kept pigeons on this roof since he was nine. Waves the flag and they wheel over Prospect Park and come home. They always come home.'] });
  // the pigeons in the sky
  const Rp = rng(12);
  for (let i = 0; i < 26; i++) { const x = 1150 + Rp() * 700, y = 60 + Rp() * 220, s = 0.7 + Rp() * 0.6, a = Rp() * 0.6 - 0.3; g.save(); g.translate(x, y); g.rotate(a); g.scale(s, s); g.beginPath(); g.moveTo(-18, -2); g.quadraticCurveTo(-8, -14, 0, -2); g.quadraticCurveTo(8, -14, 18, -2); g.quadraticCurveTo(8, -6, 0, 2); g.quadraticCurveTo(-8, -6, -18, -2); inkFill(g, Rp() < 0.4 ? '#f4f0e6' : '#8a8f9a', 1.6); g.restore(); }

  /* below the street: the basement, then the earth, then the train */
  g.fillStyle = '#6b4a3a'; g.fillRect(0, 1804, W, H - 1804);
  const Re = rng(21); g.fillStyle = 'rgba(31,26,23,0.25)'; for (let i = 0; i < 1600; i++) { g.beginPath(); g.arc(Re() * W, 1804 + Re() * (H - 1804), 1 + Re() * 2.5, 0, TAU); g.fill(); }
  g.fillStyle = SECTION; g.fillRect(270, 1804, 1570, 330); rect(g, 270, 1804, 1570, 330, null, LW * 1.4);
  const BL = new PRoom(296, 1810, 750, 296, 260, 380, 0.7, 0.44, 0.5), BR = new PRoom(1072, 1810, 742, 296, 260, 380, 0.7, 0.44, 0.5);
  g.save(); g.beginPath(); g.rect(296, 1810, 750, 296); g.clip(); boiler(g, BL, who); g.restore();
  g.save(); g.beginPath(); g.rect(1072, 1810, 742, 296); g.clip(); band(g, BR, who); g.restore();
  rect(g, 296, 1810, 750, 296, null, LW * 1.6); rect(g, 1072, 1810, 742, 296, null, LW * 1.6);
  // pipes through the earth
  for (const [x, c] of [[160, '#9aa0a6'], [210, '#b9824e']] as [number, string][]) { rect(g, x, 1804, 18, 380, c, LW); }
  rect(g, 0, 2120, 270, 16, '#9aa0a6', LW);
  // the tunnel
  g.fillStyle = '#4a4a4c'; g.fillRect(0, 2180, W, 220); rect(g, -2, 2180, W + 4, 230, null, LW * 1.4);
  g.fillStyle = '#5c5c5e'; g.fillRect(0, 2180, W, 22);
  g.fillStyle = '#3a3a3c'; g.fillRect(0, 2372, W, 28); ln(g, 0, 2372, W, 2372, LW);
  // the train: two cars, the riders seen through the windows
  const car = (x0: number, x1: number) => {
    g.beginPath(); g.roundRect(x0, 2206, x1 - x0, 160, 10); inkFill(g, '#c9ccd0', LW * 1.2);
    rect(g, x0, 2340, x1 - x0, 10, '#9a9ea4', LW);
    rect(g, x0, 2226, x1 - x0, 6, '#3b7dd8', 0);
    for (let x = x0 + 20; x < x1 - 120; x += 150) { rect(g, x, 2240, 110, 64, '#f7efc8', LW); }
    for (const x of [x0 + 6, x1 - 16]) rect(g, x, 2236, 10, 100, '#9a9ea4', LW);
    for (const x of [x0 + 40, x1 - 80]) { ellipse(g, x, 2364, 16, 14, 0, '#3a3a3c', LW); ellipse(g, x + 40, 2364, 16, 14, 0, '#3a3a3c', LW); }
  };
  car(-40, 900); car(920, 1960);
  // the destination sign
  rect(g, 742, 2250, 92, 20, '#26262b', LW); g.fillStyle = '#ffb347'; g.font = `bold 11px ${SANS}`; g.textAlign = 'center'; g.fillText('FLATBUSH AV', 788, 2264);
  const riders: [number, Partial<Look>, Pose, [string, string], number?][] = [
    [-20, { fem: false, skin: SKIN[5], hair: HAIR.black, style: 'buzz', topKind: 'jacket', top: C.mustard, inner: C.grey, bottom: C.denim, hat: { kind: 'hardhat', color: C.tang } }, { ...POSES.sleep }, ['Curtis, 44', 'Ironworker, on a tower in Long Island City since six this morning. Asleep before the doors closed. He will wake up exactly at Church Avenue; he always does.'], 1],
    [130, { fem: true, skin: SKIN[1], hair: HAIR.black, style: 'long', topKind: 'coat', top: C.navy, bottom: C.black, hat: { kind: 'headphones', color: C.white } }, POSES.sitPhone, ['Lin, 24', 'Second-year law student. Reading contracts on her phone with a podcast about whales in her ears.']],
    [280, { fem: false, age: 'old', skin: SKIN[3], hair: HAIR.grey, style: 'short', topKind: 'sweater', top: C.wine, bottom: C.khaki, beard: true }, POSES.sitRead, ['Eduardo, 70', 'Reading a paperback western he bought for a dollar on Atlantic Avenue. Has read it before. Does not mind.']],
    [430, { fem: true, skin: SKIN[4], hair: HAIR.black, style: 'hijab', hijab: C.pink, topKind: 'coat', top: C.teal, bottom: C.black }, { ...POSES.sit, armN: [20, 90], armF: [30, 95] }, ['Fatima, 36', 'Pharmacist, on her way home to Flatbush with a cake for her son’s birthday on her knees. It will survive the trip.']],
    [940, { fem: false, skin: SKIN[0], hair: HAIR.blond, style: 'short', topKind: 'shirt', top: C.white, accent: C.navy, bottom: C.navy }, { ...POSES.stand, armF: [160, 175] }, ['Greg, 31', 'Finance, still in his work shirt. Holding the bar with one hand and a single sunflower with the other, for no reason he will explain.'], 0],
    [1090, { fem: true, age: 'teen', skin: SKIN[5], hair: HAIR.black, style: 'braids', topKind: 'hoodie', top: C.lav, bottom: C.denim, bag: { kind: 'backpack', color: C.coral } }, POSES.sitPhone, ['Aaliyah, 15', 'Coming home from debate practice. Won. Telling everyone.']],
    [1390, { fem: false, skin: SKIN[2], hair: HAIR.black, style: 'short', topKind: 'jacket', top: C.black, inner: C.white, bottom: C.black }, { ...POSES.guitar, sit: true }, ['Rafael, 28', 'Plays the bachata his father played. Gets off at Franklin to play the platform there till midnight.']],
    [1540, { fem: true, age: 'old', skin: SKIN[0], hair: HAIR.white, style: 'bun', topKind: 'coat', top: C.mustard, bottom: C.grey, glasses: true }, { ...POSES.sit, armN: [20, 60], armF: [30, 60] }, ['Edith, 90', 'Rode the train to her first job in 1953. Rides it now to her great-granddaughter’s ballet recital. Still takes the seat at the end.']],
    [580, { fem: true, skin: SKIN[2], hair: HAIR.black, style: 'ponytail', topKind: 'hoodie', top: C.sea, bottom: C.denim }, { ...POSES.cradle, sit: true, legN: [86, 2], legF: [82, -4] }, ['Ana, 27', 'Six weeks into motherhood; this is the baby\u2019s first train ride. He has slept through all of it, which is a family tradition.']],
    [1240, { fem: false, age: 'old', skin: SKIN[6], hair: HAIR.grey, style: 'short', topKind: 'coat', top: C.brown, bottom: C.char, glasses: true, hat: { kind: 'cowboy', color: C.char } }, POSES.sitRead, ['Kwame, 66', 'Cab driver for thirty years, now retired; takes the train on purpose so that somebody else can drive.']],
    [1690, { fem: false, age: 'teen', skin: SKIN[1], hair: HAIR.ginger, style: 'curly', topKind: 'tee', top: C.navy, bottom: C.khaki, hat: { kind: 'beanie', color: C.mustard } }, { ...POSES.sit, armN: [40, 90], armF: [30, 80] }, ['Luke, 19', 'Bike messenger, bike in the car, legs done for the day. Ate three slices standing up at Atlantic.']],
  ];
  for (const [x, lk, pose, w2, standing] of riders) {
    const L = look(400 + x, lk);
    const wx = x;
    g.save(); g.beginPath(); g.rect(wx, 2240, 110, 64); g.clip();
    if (standing === 0) fp(g, who, wx + 55, 2384, 1.45, { turn: 0.5, look: L, pose, who: w2, hold: (gg, J) => { const [hx, hy] = J.hN; ln(gg, hx, hy, hx + 10, hy - 30, LW * 1.4, C.green); ellipse(gg, hx + 12, hy - 36, 9, 9, 0, '#ffd25a', LW); ellipse(gg, hx + 12, hy - 36, 4, 4, 0, C.brown, 0); } });
    else fp(g, who, wx + 55, 2328, 1.45, { turn: x % 300 < 150 ? 0.5 : -0.5, look: L, pose, who: w2, hold: pose === POSES.guitar ? (gg, J) => guitar(gg, J, C.wood) : pose.armN[0] === POSES.cradle.armN[0] && pose.sit ? (gg, J) => { const cx = (J.hN[0] + J.hF[0]) / 2, cy = (J.hN[1] + J.hF[1]) / 2 - 6; gg.beginPath(); gg.ellipse(cx, cy, 14, 9, -0.2, 0, TAU); inkFill(gg, C.butter, LW); ellipse(gg, cx + 9 * J.fwd, cy - 5, 6, 6, 0, SKIN[2], LW); } : undefined, eyes: pose === POSES.sleep ? 'closed' : undefined });
    g.restore();
    rect(g, wx, 2240, 110, 64, null, LW);
    // the pole in the window
    ln(g, wx + 92, 2240, wx + 92, 2304, LW * 2.4); ln(g, wx + 92, 2240, wx + 92, 2304, LW, C.ash);
  }
  // rails
  ln(g, 0, 2380, W, 2380, LW * 2, '#9a9ea4');

  // the title, on the sky
  g.textAlign = 'left'; g.fillStyle = '#5e2e24';
  g.font = `600 64px "Cinzel", ${SERIF}`; g.fillText('The Brownstone', 80, 110);
  g.font = `italic 30px ${SERIF}`; g.fillText('Prospect Heights, Brooklyn. A Sunday, a little after seven.', 82, 154);
  grain(g, W, H, 0.11, 4);
  void mix; void shade;
}

export const BROWNSTONE: Plate = {
  key: 'brownstone', title: 'The Brownstone', place: 'A rowhouse in Brooklyn',
  blurb: 'A Brooklyn brownstone cut open like a dollhouse on a Sunday evening: pigeons on the roof, a song upstairs, sancocho on the stove, the Mets on TV, a band in the basement, and the 2 train underneath.',
  w: W, h: H, paint,
};
