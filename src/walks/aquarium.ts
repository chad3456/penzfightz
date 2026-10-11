/**
 * Field Trip — seen from inside the big tank: a second-grade class pressed
 * to the glass, their teacher counting heads, a volunteer explaining the
 * shark, and the fish going about their business in between.
 */
import { type G, C, HAIR, SKIN, INK, inkFill, ellipse, rng, grain, SERIF, SANS, TAU, ln } from './kit';
import { POSES, randomLook, person, type Look, type Joints, type Fig } from './people';
import { shark, turtle, manta, tang, grouper, smallFish, bubble } from './sea';
import { type Plate, type Who } from './stage';

const W = 2400, H = 1600;
const look = (seed: number, o: Partial<Look>) => randomLook(seed, o);

interface V { x: number; ground: number; s: number; turn: number; look: Look; pose: Fig['pose']; who: [string, string]; hold?: Fig['hold']; over?: Fig['over']; mood?: Fig['face']; eyes?: Fig['eyes'] }

function paint(g: G, who: Who[]) {
  /* the gallery behind the glass: dark, with the other tanks glowing */
  const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#173a52'); bg.addColorStop(1, '#0f2638');
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  g.fillStyle = 'rgba(80,170,200,0.18)'; for (const [x, y, w, h] of [[120, 300, 380, 260], [1880, 260, 420, 300], [980, 180, 360, 200]]) { g.beginPath(); g.roundRect(x, y, w, h, 18); g.fill(); }
  g.fillStyle = 'rgba(220,80,60,0.6)'; g.fillRect(1500, 120, 90, 34); g.fillStyle = 'rgba(255,230,220,0.9)'; g.font = `bold 22px ${SANS}`; g.textAlign = 'center'; g.fillText('EXIT', 1545, 145);

  /* the visitors, drawn on their own layer so the water can light them */
  const K = g.getTransform().a;
  const P = document.createElement('canvas'); P.width = Math.round(W * K); P.height = Math.round(H * K); const pg = P.getContext('2d')!; pg.scale(K, K);
  const back: V[] = [
    { x: 600, ground: 1500, s: 7.0, turn: 0.22, look: look(801, { fem: true, skin: SKIN[4], hair: HAIR.black, style: 'long', topKind: 'jacket', top: '#c9433a', inner: C.white, bottom: C.denim, glasses: true, lanyard: C.teal }), pose: { ...POSES.cradle, armF: [30, 140], head: 6 }, mood: 'smile', who: ['Ms. Begay, 34', 'Second-grade teacher, Navajo, from Gallup. Has counted to twenty-three eleven times since the bus. The answer has been twenty-three every time, and she will count again.'], hold: (gg, J) => { const cx = (J.hN[0] + J.hF[0]) / 2, cy = (J.hN[1] + J.hF[1]) / 2; gg.beginPath(); gg.rect(cx - 30, cy - 46, 60, 80); inkFill(gg, '#9a5b34', 4); gg.beginPath(); gg.rect(cx - 24, cy - 38, 48, 66); inkFill(gg, '#fbfaf5', 3); gg.fillStyle = 'rgba(31,26,23,0.45)'; for (let i = 0; i < 6; i++) gg.fillRect(cx - 18, cy - 30 + i * 10, 28, 3); } },
    { x: 1190, ground: 1510, s: 7.0, turn: -0.18, look: look(802, { fem: false, skin: SKIN[1], hair: HAIR.black, style: 'short', topKind: 'hoodie', top: '#5c6f86', bottom: C.khaki, glasses: true }), pose: { ...POSES.standFront, armN: [-20, -10], armF: [30, 70] }, mood: 'open', who: ['Hiro, 41', 'Chaperone dad. Took the day off from the hospital lab. Knows more about sharks than the volunteer and is being extremely polite about it.'] },
    { x: 1770, ground: 1500, s: 7.0, turn: -0.3, look: look(803, { fem: false, age: 'old', skin: SKIN[0], hair: HAIR.white, style: 'balding', topKind: 'vest', top: '#2f6a5a', inner: '#f4ecd6', bottom: C.khaki, glasses: true, beard: true, lanyard: C.mustard }), pose: { ...POSES.point, armF: [118, 130] }, mood: 'open', who: ['Walter, 76', 'Volunteer docent, retired from thirty-four years as a marine biologist. Tells every class that the shark’s name is Gloria and that she is older than their parents. Both are true.'] },
    { x: 2290, ground: 1510, s: 7.2, turn: -0.25, look: look(804, { fem: true, age: 'teen', skin: SKIN[2], hair: HAIR.black, style: 'bun', topKind: 'hoodie', top: '#e3b23c', bottom: C.black, glasses: false }), pose: { ...POSES.call, armN: [160, 170], head: -6 }, mood: 'smile', who: ['Jas, 16', 'Here with her little brother, because their mom works Saturdays. Taking a picture of the shark for a girl in her biology class. It is not about the shark.'], hold: (gg, J) => { const [x, y] = J.hN; gg.beginPath(); gg.roundRect(x - 14, y - 34, 28, 46, 4); inkFill(gg, '#2b2b30', 4); } },
  ];
  const front: V[] = [
    { x: 320, ground: 1640, s: 9.2, turn: 0.1, look: look(811, { fem: false, age: 'kid', skin: SKIN[5], hair: HAIR.black, style: 'buzz', topKind: 'tee', top: '#e3584a', bottom: C.denim }), pose: { ...POSES.handsUp, armN: [-120, -175], armF: [120, 175] }, mood: 'o', who: ['Amari, 6', 'Nose on the glass. Has not blinked in some time.'] },
    { x: 900, ground: 1630, s: 9.4, turn: 0.04, look: look(812, { fem: true, age: 'kid', skin: SKIN[0], hair: HAIR.ginger, style: 'ponytail', topKind: 'tee', top: '#e8a0b0', bottom: '#f3dc8a', bottomKind: 'skirt' }), pose: POSES.handsUp, mood: 'open', who: ['Zoe, 7', 'Has decided, today, to be a marine biologist. Last week it was a bus driver. Both remain on the list.'] },
    { x: 1480, ground: 1640, s: 9.2, turn: 0.32, look: look(813, { fem: false, age: 'kid', skin: SKIN[3], hair: HAIR.black, style: 'curly', topKind: 'hoodie', top: '#3b7dd8', bottom: C.char, glasses: '#c9433a' }), pose: { ...POSES.point, armF: [140, 152], armN: [-20, 10] }, mood: 'open', who: ['Mateo, 8', 'Found the shark first. Is going to tell everyone, including the shark.'] },
    { x: 2030, ground: 1630, s: 9.2, turn: -0.12, look: look(814, { fem: true, age: 'kid', skin: SKIN[2], style: 'hijab', hijab: '#bfe3c8', hair: '#bfe3c8', topKind: 'sweater', top: '#a99bd8', bottom: C.denim }), pose: { ...POSES.wave, armF: [146, 160] }, mood: 'smile', who: ['Noor, 7', 'Waving at the turtle, who she has named Grandpa. The turtle has not waved back yet. She is patient.'], hold: (gg, J) => { const [x, y] = J.hN; gg.beginPath(); gg.ellipse(x + 4, y - 4, 26, 16, 0.2, 0, TAU); inkFill(gg, '#7aaed0', 4); ellipse(gg, x + 18, y - 8, 3, 3, 0, INK, 0); gg.beginPath(); gg.moveTo(x - 20, y - 8); gg.lineTo(x - 34, y - 22); gg.lineTo(x - 30, y); gg.closePath(); inkFill(gg, '#7aaed0', 4); } },
  ];
  for (const v of [...back, ...front]) {
    person(pg, { x: v.x, y: v.ground, s: v.s, turn: v.turn, look: v.look, pose: v.pose, lw: 4.2, hold: v.hold, over: v.over, face: v.mood, eyes: v.eyes });
  }
  // the water's light on them: a blue wash, then ripples of light
  pg.save(); pg.globalCompositeOperation = 'source-atop';
  pg.fillStyle = 'rgba(40,110,160,0.2)'; pg.fillRect(0, 0, W, H);
  const R = rng(9); pg.strokeStyle = 'rgba(200,245,255,0.28)'; pg.lineWidth = 6;
  for (let i = 0; i < 30; i++) { const x = R() * W, y = 700 + R() * 900, w = 60 + R() * 120; pg.beginPath(); pg.moveTo(x, y); pg.bezierCurveTo(x + w * 0.3, y - 14, x + w * 0.6, y + 14, x + w, y); pg.stroke(); }
  pg.restore();
  g.drawImage(P, 0, 0, W, H);
  // hotspots
  for (const v of [...back, ...front]) { const kid = v.look.age === 'kid'; const hy = v.ground - v.s * (kid ? 56 : 88); who.push({ x: v.x, y: hy, r: v.s * (kid ? 18 : 16), name: v.who[0], line: v.who[1] }); }

  /* the glass: a few streaks, and the seam of two panes */
  g.save(); g.strokeStyle = 'rgba(220,245,255,0.18)'; g.lineWidth = 18; for (const [x0, y0] of [[300, 0], [1300, 0], [2000, 0]]) { g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0 - 500, H); g.stroke(); } g.restore();
  ln(g, 1190, 0, 1190, H, 3, 'rgba(10,30,45,0.5)');

  /* the water itself, between us and the glass */
  const wash = g.createLinearGradient(0, 0, 0, H); wash.addColorStop(0, 'rgba(70,170,200,0.22)'); wash.addColorStop(1, 'rgba(10,50,80,0.08)');
  g.fillStyle = wash; g.fillRect(0, 0, W, H);
  // shafts of light from the surface
  g.save(); g.globalCompositeOperation = 'screen'; g.fillStyle = 'rgba(120,200,220,0.1)';
  for (const [x, w] of [[300, 160], [760, 90], [1400, 200], [2050, 120]]) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + w, 0); g.lineTo(x + w - 380, H); g.lineTo(x - 420, H); g.closePath(); g.fill(); }
  g.restore();

  /* the swimmers, near us */
  manta(g, 1080, 300, 480, 1, 4, -0.12);
  shark(g, 1820, 480, 1000, -1, 4.2, 0.04);
  turtle(g, 520, 610, 340, 1, 4, -0.08);
  grouper(g, 150, 1420, 300, 1, 4, 0.05);
  for (let i = 0; i < 9; i++) tang(g, 1300 + (i % 3) * 120 + Math.floor(i / 3) * 50, 690 + Math.floor(i / 3) * 52 + (i % 2) * 16, 110, 1, 3.2, -0.05);
  const Rs = rng(17); for (let i = 0; i < 26; i++) smallFish(g, 300 + Rs() * 640, 230 + Rs() * 150 - (i % 4) * 14, 66, -1, 2.8, (Rs() - 0.5) * 0.2, '#e8e2d0', '#3a4a62');
  for (let i = 0; i < 6; i++) smallFish(g, 2150 + i * 60, 560 + (i % 2) * 40, 90, -1, 3, 0.1, '#e3584a', '#fbfaf5');
  const Rb = rng(3); for (let i = 0; i < 26; i++) bubble(g, 2200 + Rb() * 120 + (i % 3) * 20, 260 + Rb() * 520, 4 + Rb() * 10, 2.4);
  // a frond of kelp at each edge
  for (const [x, dir] of [[30, 1], [2380, -1]] as [number, number][]) { g.beginPath(); g.moveTo(x, H); g.bezierCurveTo(x + 40 * dir, 1300, x - 20 * dir, 1000, x + 20 * dir, 700); g.lineWidth = 9; g.strokeStyle = INK; g.stroke(); g.lineWidth = 5; g.strokeStyle = '#4a7a4a'; g.stroke(); for (let k = 0; k < 9; k++) { const t = k / 9, yy = H - t * 900, xx = x + Math.sin(t * 7) * 18 * dir; const side = k % 2 ? 1 : -1; g.beginPath(); g.moveTo(xx, yy); g.bezierCurveTo(xx + side * 60, yy - 30, xx + side * 90, yy - 90, xx + side * 70, yy - 150); g.bezierCurveTo(xx + side * 40, yy - 100, xx + side * 20, yy - 40, xx, yy); inkFill(g, k % 3 ? '#4a7a4a' : '#5f8f4a', 3.4); } }

  /* the title, on a placard */
  g.beginPath(); g.roundRect(70, 60, 760, 150, 10); inkFill(g, 'rgba(10,30,45,0.78)', 3, '#9fd0e0');
  g.fillStyle = '#e9f6fa'; g.textAlign = 'left'; g.font = `600 58px "Cinzel", ${SERIF}`; g.fillText('Field Trip', 104, 132);
  g.font = `italic 28px ${SERIF}`; g.fillText('Room 2B at the aquarium, seen from inside the big tank.', 106, 178);
  grain(g, W, H, 0.16, 5);
  void TAU; void C;
}

export const AQUARIUM: Plate = {
  key: 'aquarium', title: 'Field Trip', place: 'An aquarium',
  blurb: 'Seen from inside the big tank: a second-grade class pressed to the glass, their teacher counting heads, a retired marine biologist explaining the shark, and the fish going about their business in between.',
  w: W, h: H, paint,
};
export type { Joints };
