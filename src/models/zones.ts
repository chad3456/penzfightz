/**
 * Comfort, Learning, Panic — the learning-zone model (Tom Senninger, 2000,
 * after Karl Rohnke and older ideas of an optimal level of stretch): an
 * island where everything is easy; around it the shallows, where people
 * learn, wobble and are helped; beyond, the deep water and the storm, where
 * nobody learns anything because all they can do is survive.
 */
import { type G, Iso, Scene, C, HAIR, SKIN, INK, box, plane, onPlane, inkFill, ln, ellipse, rng, grain, TAU, SERIF, type Pt } from '../walks/kit';
import { POSES, randomLook, type Look, type Joints } from '../walks/people';
import { type Plate, type Who, ip, type IP } from '../walks/stage';
import { W, H, titlePanel, keyPanel, badge, bubble, CINZEL } from './note';

const look = (seed: number, o: Partial<Look>) => randomLook(seed, o);
const LW = 1.7, CX = 1500, CY = 1500, R1 = 470, R2 = 1080;

const NOTES = [
  { n: 1, title: 'Comfort zone', gloss: 'Safe, familiar, restful, and nothing new happens.', line: 'The island: everything here is known and easy. It is where we rest and recover, and it is necessary. But skills do not grow here, because nothing asks them to.' },
  { n: 2, title: 'Learning zone', gloss: 'Out of your depth, but not by much.', line: 'The shallows: hard enough to wobble, safe enough to try again. Water wings, a teacher at arm’s length, a rope from below. This is where people actually learn.' },
  { n: 3, title: 'Panic zone', gloss: 'Too far, too fast: survival, not learning.', line: 'The deep water in a storm: the challenge is so far beyond present skill that all the effort goes into staying afloat. Stress here blocks learning rather than driving it.' },
  { n: 4, title: 'The shore moves', gloss: 'What you learn becomes part of the island.', line: 'Each time something in the shallows becomes easy, the comfort zone grows to include it, and the learning zone moves outward with it. Today’s stretch is next year’s rest.' },
  { n: 5, title: 'Someone at arm’s length', gloss: 'Teachers keep the stretch from becoming a panic.', line: 'A good coach or teacher keeps a learner in the shallows: far enough out to stretch, close enough to catch. Vygotsky called the space of what you can do with help the zone of proximal development.' },
];

function paint(g: G, who: Who[]) {
  const I = new Iso(1150, -80, 0.62);
  const sc = new Scene(g);
  const P = (x: number, y: number, o: IP, z = 0) => ip(sc, I, who, x, y, z, o);
  const ring = (r: number) => (gg: G) => gg.ellipse(CX, CY, r, r, 0, 0, TAU);

  // the deep, stormy sea
  g.fillStyle = '#25506e'; g.fillRect(0, 0, W, H);
  const R = rng(5); g.strokeStyle = 'rgba(255,255,255,0.75)'; g.lineWidth = 3;
  for (let i = 0; i < 160; i++) { const a = R() * TAU, r = R2 + 60 + R() * 1600, [x, y] = I.p(CX + Math.cos(a) * r, CY + Math.sin(a) * r, 0); const w = 20 + R() * 40; g.beginPath(); g.moveTo(x - w, y); g.quadraticCurveTo(x - w / 3, y - 14, x, y - 4); g.quadraticCurveTo(x + w / 3, y - 16, x + w, y); g.stroke(); }
  // the shallows: turquoise, with a sandbar and ripples
  plane(g, I, 'z', 0, ring(R2), '#6fc8c4', LW * 1.4);
  onPlane(g, I, 'z', 0, (gg) => { for (let r = R1 + 80; r < R2; r += 90) { gg.moveTo(CX + r, CY); gg.ellipse(CX, CY, r, r, 0, 0, TAU); } }); g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 2; g.stroke();
  // the edge where shallow meets deep
  onPlane(g, I, 'z', 0, ring(R2 - 20)); g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 4; g.setLineDash([18, 12]); g.stroke(); g.setLineDash([]);
  // the island
  plane(g, I, 'z', 0, ring(R1), '#efd6a0', LW * 1.4);
  plane(g, I, 'z', 0, (gg) => gg.ellipse(CX - 60, CY - 60, R1 - 110, R1 - 130, 0, 0, TAU), '#a8cc7a', LW);
  // the old shoreline, now grass: the island has grown
  onPlane(g, I, 'z', 0, (gg) => gg.ellipse(CX - 60, CY - 60, R1 - 230, R1 - 250, 0, 0, TAU)); g.strokeStyle = 'rgba(80,110,40,0.5)'; g.lineWidth = 3; g.setLineDash([10, 10]); g.stroke(); g.setLineDash([]);
  { const [x, y] = I.p(CX - 60 - R1 + 260, CY - 60, 0); g.fillStyle = '#4a6a2a'; g.font = `italic 22px ${SERIF}`; g.fillText('last year’s shore', x - 40, y + 30); }

  /* ── 1 · the island: comfort ── */
  // palms and a hammock
  const palm = (x: number, y: number, h: number) => sc.add(I.depth(x, y), () => { const [bx, by] = I.p(x, y, 0), [tx, ty] = I.p(x + 30, y, h); g.beginPath(); g.moveTo(bx - 7, by); g.quadraticCurveTo(bx + 20, (by + ty) / 2, tx - 4, ty); g.lineTo(tx + 4, ty); g.quadraticCurveTo(bx + 30, (by + ty) / 2, bx + 7, by); g.closePath(); inkFill(g, '#9a6a40', LW); for (let k = 0; k < 7; k++) { const a = -Math.PI + (k / 6) * Math.PI + 0.1; g.beginPath(); g.moveTo(tx, ty); g.quadraticCurveTo(tx + Math.cos(a) * 50, ty + Math.sin(a) * 40 - 20, tx + Math.cos(a) * 100, ty + Math.sin(a) * 40 + 20); g.quadraticCurveTo(tx + Math.cos(a) * 50, ty + Math.sin(a) * 30, tx, ty); inkFill(g, k % 2 ? '#4f8a3a' : '#5f9a4a', LW); } });
  palm(CX - 260, CY - 180, 260); palm(CX + 120, CY - 280, 300); palm(CX + 260, CY + 60, 240);
  sc.add(I.depth(CX - 120, CY - 220), () => { const a = I.p(CX - 230, CY - 180, 120), b = I.p(CX + 140, CY - 270, 120); g.beginPath(); g.moveTo(...a); g.quadraticCurveTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 60, ...b); g.lineWidth = 16; g.strokeStyle = INK; g.stroke(); g.lineWidth = 12; g.strokeStyle = '#e3584a'; g.stroke(); });
  P(CX - 50, CY - 225, { face: '+x', turn: 0.6, rot: -1.35, look: look(9001, { fem: false, skin: SKIN[4], hair: HAIR.black, style: 'short', topKind: 'tank', top: C.butter, bottom: C.teal, bottomKind: 'shorts', hat: { kind: 'bucket', color: C.khaki } }), pose: { ...POSES.stand, armN: [170, 150], armF: [175, 160] }, eyes: 'closed', mood: 'smile', who: ['Rest', 'Resting is not a failure; it is what the island is for. Every learner comes back here to recover.'] }, 95);
  // a sofa and a screen under an umbrella
  sc.add(I.depth(CX + 40, CY + 160), () => { box(g, I, CX - 80, CY + 120, 0, 200, 80, 40, { top: '#d9493f', left: '#c9433a', right: '#a9302a', lw: LW }); box(g, I, CX - 80, CY + 120, 40, 200, 18, 50, { top: '#d9493f', left: '#c9433a', right: '#a9302a', lw: LW }); });
  P(CX + 20, CY + 170, { face: '+y', turn: 0.5, look: look(9002, { fem: true, skin: SKIN[1], hair: HAIR.brown, style: 'bun', topKind: 'hoodie', top: C.lav, bottom: C.grey }), pose: POSES.sitPhone, depth: I.depth(CX + 40, CY + 160) + 5, eyes: 'down', hold: (gg: G, J: Joints) => { const [x, y] = J.hN; gg.beginPath(); gg.roundRect(x - 5, y - 12, 10, 15, 2); inkFill(gg, '#3a3a40', 1.4); }, who: ['Scrolling', 'Third hour of the same feed. Pleasant, familiar, and it does not ask anything of her.'] }, 40);
  sc.add(I.depth(CX + 120, CY + 300), () => { box(g, I, CX + 60, CY + 300, 0, 100, 16, 60, { top: '#3a3a40', left: '#3a3a40', right: '#26262b', lw: LW }); plane(g, I, 'y', CY + 316, (gg) => gg.rect(CX + 66, 8, 88, 46), '#8cc8e8', 1); });
  { const [x, y] = I.p(CX - 300, CY + 200, 0); g.save(); sc.add(I.depth(CX - 300, CY + 200), () => { ln(g, x, y, x, y - 60, 4); g.beginPath(); g.rect(x - 120, y - 104, 240, 44); inkFill(g, '#fbfaf5', 2); g.fillStyle = INK; g.font = `600 22px ${CINZEL}`; g.textAlign = 'center'; g.fillText('COMFORT ZONE', x, y - 75); g.textAlign = 'left'; }); g.restore(); }

  /* ── 2 · the shallows: learning ── */
  const wading = (x: number, y: number, depth: number, o: IP) => P(x, y, { ...o, over: (gg: G, J: Joints) => { o.over?.(gg, J); const wy = J.aN[1] - depth * J.s; gg.save(); gg.beginPath(); gg.rect(J.P[0] - 30 * J.s, wy, 60 * J.s, 60 * J.s); gg.clip(); gg.fillStyle = 'rgba(111,200,196,0.92)'; gg.fillRect(J.P[0] - 30 * J.s, wy, 60 * J.s, 60 * J.s); gg.restore(); gg.beginPath(); gg.ellipse(J.P[0], wy, 16 * J.s, 4 * J.s, 0, 0, TAU); gg.lineWidth = 2; gg.strokeStyle = '#fbfaf5'; gg.stroke(); } });
  // a swimming lesson
  wading(CX + 700, CY + 120, 50, { scale: 1.6, face: '-x', turn: 0.5, look: look(9011, { fem: false, skin: SKIN[5], hair: HAIR.black, style: 'buzz', topKind: 'tank', top: C.red, bottom: C.red, bottomKind: 'shorts' }), pose: { ...POSES.point, armF: [80, 90], armN: [40, 70] }, mood: 'smile', who: ['The swimming teacher', 'Stands an arm’s length away, waist-deep. Close enough to catch; far enough that she is really swimming.'] });
  wading(CX + 560, CY + 200, 26, { face: '+x', turn: 0.5, scale: 1.2, look: look(9012, { fem: true, age: 'kid', skin: SKIN[2], hair: HAIR.black, style: 'ponytail', topKind: 'tank', top: C.pink, bottom: C.pink, bottomKind: 'shorts' }), pose: { ...POSES.handsUp, armN: [-70, -110], armF: [70, 110] }, mood: 'open', over: (gg: G, J: Joints) => { for (const [x, y] of [J.eN, J.eF]) { gg.beginPath(); gg.ellipse(x, y, 7 * J.s * 0.75, 5 * J.s * 0.75, 0, 0, TAU); inkFill(gg, '#f2a23a', 2); } }, who: ['Lucía, 7, water wings', 'Three lessons in. Today she put her face in the water. It was terrible, and then it was fine.'] });
  // a paddleboarder wobbling
  sc.add(I.depth(CX - 400, CY + 760) - 1, () => plane(g, I, 'z', 2, (gg) => gg.ellipse(CX - 400, CY + 760, 150, 40, 0.3, 0, TAU), '#fbfaf5', LW));
  P(CX - 400, CY + 760, { face: '+x', turn: 0.5, look: look(9021, { fem: false, age: 'old', skin: SKIN[0], hair: HAIR.grey, style: 'balding', topKind: 'tank', top: C.sky, bottom: C.navy, bottomKind: 'shorts' }), pose: { ...POSES.handsUp, armN: [-80, -70], armF: [80, 70], lean: -6, legN: [-14, -4], legF: [14, 4] }, mood: 'o', who: ['Ron, 66, first paddleboard', 'Retired last month and decided to learn three things this summer. This is the first. He has fallen in nine times and is laughing.'] }, 4);
  // a kayak lesson
  sc.add(I.depth(CX + 300, CY - 860) - 1, () => { plane(g, I, 'z', 2, (gg) => gg.ellipse(CX + 300, CY - 860, 200, 40, 0, 0, TAU), '#e3b23c', LW); });
  for (const [dx, seed, nm] of [[-80, 9031, ['Kayaking, week two', 'Learning to steer as a pair: it takes about two weeks to stop going in circles.']], [70, 9032, undefined]] as [number, number, [string, string] | undefined][]) P(CX + 300 + dx, CY - 860, { face: '+x', turn: 0.5, look: look(seed, { topKind: 'tank', top: C.mustard }), pose: { ...POSES.sit, armN: [60, 120], armF: [70, 110], legN: [88, 90], legF: [88, 90] }, who: nm }, 0);
  // a climbing rock on the sandbar, a climber and a belayer
  sc.add(I.depth(CX - 860, CY - 300), () => { box(g, I, CX - 980, CY - 380, 0, 160, 160, 280, { top: '#b8a080', left: '#a89070', right: '#8a7458', lw: LW }); const a = I.p(CX - 820, CY - 300, 280); ellipse(g, a[0], a[1], 6, 6, 0, '#9aa0a6', 2); });
  P(CX - 810, CY - 280, { face: '-x', turn: 0.4, look: look(9041, { fem: true, skin: SKIN[5], hair: HAIR.black, style: 'braids', topKind: 'tank', top: C.green, bottom: C.navy }), pose: { ...POSES.reach, armF: [160, 170], armN: [140, 150], legN: [-30, 10], legF: [40, -20] }, mood: 'flat', who: ['Climbing, with a rope', 'Her first wall above head height. Her hands are shaking. The rope is holding, and so is she.'] }, 120);
  P(CX - 700, CY - 160, { face: '-x', turn: 0.5, look: look(9042, { fem: false, skin: SKIN[3], hair: HAIR.dark, style: 'short', topKind: 'tank', top: C.orange, bottom: C.khaki, bottomKind: 'shorts' }), pose: { ...POSES.cradle, armN: [140, 160], head: -30 }, mood: 'open', who: ['The belayer', '“I’ve got you. Next hold’s on your left.”'] });
  sc.add(I.depth(CX - 760, CY - 220) + 1, () => { const a = I.p(CX - 820, CY - 300, 280), b = I.p(CX - 810, CY - 280, 260), c = I.p(CX - 700, CY - 160, 120); g.beginPath(); g.moveTo(...b); g.lineTo(...a); g.lineTo(...c); g.lineWidth = 2.4; g.strokeStyle = '#e3584a'; g.stroke(); });

  /* ── 3 · the deep: panic ── */
  // a capsized boat and someone clinging to it
  const bx = 1880, by = 420;
  g.save(); g.translate(bx, by); g.rotate(-0.4); g.beginPath(); g.moveTo(-90, 0); g.quadraticCurveTo(0, -46, 90, 0); g.lineTo(80, 10); g.lineTo(-80, 10); g.closePath(); inkFill(g, '#fbfaf5', 2.4); ln(g, -60, -14, 60, -14, 3, '#d9493f'); g.restore();
  const swimmerHead = (x: number, y: number, skin: string, hair: string) => { ellipse(g, x, y, 14, 16, 0, skin, 2); g.beginPath(); g.arc(x, y - 4, 14, Math.PI, TAU); g.fillStyle = hair; g.fill(); g.lineWidth = 2; g.strokeStyle = INK; g.stroke(); ellipse(g, x - 5, y + 2, 1.6, 2, 0, INK, 0); ellipse(g, x + 5, y + 2, 1.6, 2, 0, INK, 0); ellipse(g, x, y + 9, 3, 3, 0, '#5a2020', 0); g.beginPath(); g.ellipse(x, y + 16, 26, 6, 0, 0, TAU); g.strokeStyle = '#fbfaf5'; g.lineWidth = 3; g.stroke(); };
  swimmerHead(1850, 450, SKIN[1], HAIR.blond); ln(g, 1834, 440, 1820, 400, 7, SKIN[1]); ln(g, 1866, 440, 1890, 402, 7, SKIN[1]);
  bubble(g, 1600, 330, 190, '“Help!”', 1830, 430, { size: 26 });
  who.push({ x: 1850, y: 440, r: 50, name: 'Too far, too fast', line: 'Signed up for an open-water race after one lesson. Out here there is no learning to swim, only trying not to sink.' });
  // the lifeguard paddling out
  sc.add(I.depth(CX + 980, CY + 520) - 1, () => plane(g, I, 'z', 2, (gg) => gg.ellipse(CX + 980, CY + 520, 150, 34, -0.3, 0, TAU), '#d9493f', LW));
  P(CX + 980, CY + 520, { face: '-y', turn: 0.5, look: look(9051, { fem: false, skin: SKIN[4], hair: HAIR.black, style: 'locs', topKind: 'tank', top: '#d9493f', bottom: '#d9493f', bottomKind: 'shorts' }), pose: { ...POSES.kneel, armN: [80, 100], armF: [90, 110] }, mood: 'flat', who: ['Paddling out', 'The way back to the shallows usually needs someone else.'] }, 2);
  // the storm
  const cl = (x: number, y: number, s: number) => { g.beginPath(); for (const [dx, dy, r] of [[-60, 10, 44], [0, -16, 58], [64, 6, 46], [20, 26, 40], [-28, 28, 38]]) { g.moveTo(x + dx * s + r * s, y + dy * s); g.arc(x + dx * s, y + dy * s, r * s, 0, TAU); } g.lineWidth = 5; g.strokeStyle = INK; g.stroke(); g.fillStyle = '#5c6670'; g.fill(); };
  sc.draw();
  cl(2050, 200, 1.2); g.beginPath(); g.moveTo(2070, 250); g.lineTo(2050, 300); g.lineTo(2072, 296); g.lineTo(2050, 352); g.lineWidth = 6; g.strokeStyle = '#ffd25a'; g.stroke();
  for (let k = 0; k < 8; k++) ln(g, 1990 + k * 16, 260, 1970 + k * 16, 330, 3, '#a9cfe0');

  // badges
  const B = (x: number, y: number, z: number, n: number, col?: string) => { const [px, py] = I.p(x, y, z); badge(g, who, px, py, NOTES[n - 1], col); };
  B(CX + 40, CY - 40, 330, 1, '#e3b23c'); B(CX + 840, CY - 120, 120, 2, '#3f9a96'); badge(g, who, 2210, 420, NOTES[2], '#25506e');
  B(CX - 440, CY - 40, 40, 4, '#5f8a3a'); B(CX + 820, CY + 300, 200, 5);

  titlePanel(g, { x: 50, y: 40, w: 780, title: 'Comfort, Learning, Panic', def: 'We learn in the shallows: past what is easy, short of what is overwhelming.', credit: 'After Tom Senninger, 2000 · Karl Rohnke · Lev Vygotsky' });
  keyPanel(g, 1700, 1040, 660, NOTES, { fill: (n) => ['#e3b23c', '#3f9a96', '#25506e', '#5f8a3a', '#d9493f'][n - 1] });
  grain(g, W, H, 0.1, 27);
}

export const ZONES: Plate = {
  key: 'zones', title: 'Comfort, Learning, Panic', place: 'After Tom Senninger',
  blurb: 'An island where everything is easy; around it the shallows, where a girl in water wings, a retired man on his first paddleboard and a climber on a rope are learning; beyond, the deep water and the storm, where all anyone can do is stay afloat.',
  w: W, h: H, paint,
};
export type { Pt };
