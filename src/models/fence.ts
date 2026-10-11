/**
 * Chesterton's Fence — G. K. Chesterton, The Thing (1929): a reformer
 * finds a fence across a road and, seeing no use for it, wants it pulled
 * down; the wiser answer is "Go away and think" — come back when you know
 * why it was put there. Second-order thinking: the reason is just over the
 * rise, where the reformer cannot see it and we can.
 */
import { type G, Iso, Scene, C, HAIR, SKIN, INK, box, plane, onPlane, inkFill, ln, ellipse, rng, grain, TAU, SERIF, type Pt } from '../walks/kit';
import { POSES, randomLook, type Look, type Joints } from '../walks/people';
import { isoTree, treeShadow } from '../walks/props';
import { type Plate, type Who, ip } from '../walks/stage';
import { W, H, titlePanel, keyPanel, badge, bubble } from './note';

const look = (seed: number, o: Partial<Look>) => randomLook(seed, o);
const LW = 1.8, FY = 1500;

const NOTES = [
  { n: 1, title: 'A fence with no use', gloss: 'Across a road, in an empty field, for no reason anyone remembers.', line: 'Chesterton’s example: a fence or gate erected across a road. To anyone arriving now it looks like an obstacle with no purpose.' },
  { n: 2, title: 'The reformer', gloss: '“I don’t see the use of this. Pull it down.”', line: 'The first kind of reformer sees no use for it and wants it cleared away. Not seeing a reason is taken as proof there isn’t one.' },
  { n: 3, title: 'Go away and think', gloss: 'Find out why it is there; then you may take it down.', line: 'Chesterton’s answer, in The Thing (1929): “If you don’t see the use of it, I certainly won’t let you clear it away. Go away and think.” When you can say why it was put up, you may decide it is no longer needed.' },
  { n: 4, title: 'The reason, out of sight', gloss: 'Over the rise: the bull, and the lane the children walk.', line: 'Fences are rarely put up for no reason; the reason is often simply out of view, or from before your time. Here it is over the hill, where the bull grazes, and the children walk this road to school.' },
  { n: 5, title: 'The fallen sign', gloss: 'The explanation existed. It was lost.', line: 'Rules outlive their explanations. The sign that said why fell over years ago; the fence stayed. Second-order thinking asks what happens next, after the obvious first effect of removing something.' },
];

function paint(g: G, who: Who[]) {
  const I = new Iso(1116, -242, 0.9);
  const sc = new Scene(g);
  const P = (x: number, y: number, o: Parameters<typeof ip>[6], z = 0) => ip(sc, I, who, x, y, z, o);

  // sky band and the land
  const sky = g.createLinearGradient(0, 0, 0, 500); sky.addColorStop(0, '#9cc7dc'); sky.addColorStop(1, '#f4e6c4');
  g.fillStyle = sky; g.fillRect(0, 0, W, H);
  plane(g, I, 'z', 0, (gg) => gg.rect(-1600, -1600, 6000, 6000), '#9cc46a', 0);
  // field strips
  for (let i = -6; i < 14; i++) if (i % 2) plane(g, I, 'z', 0, (gg) => gg.rect(-1600, i * 260, 6000, 260), '#93bb62', 0);
  // the road
  plane(g, I, 'z', 0, (gg) => gg.rect(1150, -1600, 220, 6000), '#d8c49a', LW);
  onPlane(g, I, 'z', 0, (gg) => { for (let y = -1600; y < 4400; y += 70) { gg.moveTo(1195, y); gg.lineTo(1200, y + 30); gg.moveTo(1320, y + 30); gg.lineTo(1325, y + 60); } }); g.strokeStyle = 'rgba(120,90,50,0.35)'; g.lineWidth = 2; g.stroke();

  // the rise beyond the fence: a long grassy hill with contour lines
  const hillTop = (x: number) => 760 + Math.sin(x / 900) * 50;
  sc.add(-1e5, () => {
    const pts: Pt[] = []; for (let x = -1400; x <= 4000; x += 80) pts.push(I.p(x, hillTop(x) + 260, 0));
    const top: Pt[] = []; for (let x = 4000; x >= -1400; x -= 80) top.push(I.p(x, hillTop(x), 230));
    g.beginPath(); g.moveTo(...pts[0]); for (const p of pts) g.lineTo(...p); for (const p of top) g.lineTo(...p); g.closePath(); g.fillStyle = '#76a648'; g.fill();
    // the road climbing the rise
    g.beginPath(); g.moveTo(...I.p(1150, hillTop(1150) + 260, 0)); g.lineTo(...I.p(1370, hillTop(1370) + 260, 0)); g.lineTo(...I.p(1370, hillTop(1370), 230)); g.lineTo(...I.p(1150, hillTop(1150), 230)); g.closePath(); inkFill(g, '#cbb488', LW);
    for (let k = 1; k < 5; k++) { g.beginPath(); for (let x = -1400; x <= 4000; x += 80) { const p = I.p(x, hillTop(x) + 260 - k * 52, k * 46); if (x === -1400) g.moveTo(...p); else g.lineTo(...p); } g.strokeStyle = 'rgba(30,60,15,0.45)'; g.lineWidth = 2.4; g.stroke(); }
    g.beginPath(); g.moveTo(...top[0]); for (const p of top) g.lineTo(...p); g.lineWidth = LW * 1.4; g.strokeStyle = INK; g.stroke();
    // the far side of the rise, falling away
    g.beginPath(); g.moveTo(...top[0]); for (const p of top) g.lineTo(...p); for (let x = -1400; x <= 4000; x += 80) g.lineTo(...I.p(x, hillTop(x) - 300, 0)); g.closePath(); g.fillStyle = '#a8cc7a'; g.fill();
  });
  // beyond the rise: the bull, the cows, the school lane
  sc.add(-9e4, () => {
    // the bull
    const bull = (x: number, y: number, s: number, dir: 1 | -1, col: string) => { const [px, py] = I.p(x, y, 0); g.save(); g.translate(px, py); g.scale(dir * s, s);
      for (const lx of [-34, -20, 22, 34]) { g.beginPath(); g.roundRect(lx - 5, -40, 10, 40, 3); inkFill(g, col, 1.8 / s); }
      g.beginPath(); g.ellipse(0, -52, 52, 26, 0, 0, TAU); inkFill(g, col, 1.8 / s);
      g.beginPath(); g.ellipse(58, -48, 20, 18, 0.2, 0, TAU); inkFill(g, col, 1.8 / s);
      g.beginPath(); g.moveTo(52, -66); g.quadraticCurveTo(46, -86, 30, -86); g.moveTo(66, -64); g.quadraticCurveTo(76, -86, 90, -84); g.lineWidth = 5 / s; g.strokeStyle = '#f4ecd6'; g.stroke();
      ellipse(g, 74, -40, 7, 5, 0, '#d9a08a', 1.4 / s); ellipse(g, 62, -54, 2.4, 2.4, 0, INK, 0);
      g.beginPath(); g.moveTo(-50, -56); g.quadraticCurveTo(-66, -40, -60, -20); g.lineWidth = 3 / s; g.strokeStyle = INK; g.stroke();
      g.restore(); };
    bull(1050, 420, 1.3, -1, '#3a2a22');
    for (const [x, y, d] of [[700, 250, 1], [1700, 200, -1], [1900, 420, 1]] as [number, number, 1 | -1][]) bull(x, y, 0.95, d, '#f4ecd6');
    // children with backpacks walking the lane to school
    for (const [y, sd] of [[420, 1], [300, 2]] as [number, number][]) { const s2 = new Scene(g); ip(s2, I, who, 1260, y, 0, { face: '-y', turn: 0.4, look: look(7000 + sd, { age: 'kid', fem: sd === 1, bag: { kind: 'backpack', color: sd === 1 ? C.red : C.teal } }), pose: POSES.walk }); s2.draw(); }
  });
  // trees
  for (const [x, y, s] of [[200, 2100, 4], [2300, 2300, 6], [2700, 1700, 9], [-200, 1700, 11]] as [number, number, number][]) sc.add(I.depth(x, y), () => { treeShadow(g, I, x, y, 170); isoTree(g, I, x, y, 460, 200, LW, s); });

  // the fence across the road and the field
  for (let x = -600; x <= 3200; x += 160) sc.add(I.depth(x, FY), () => { box(g, I, x, FY - 8, 0, 16, 16, 120, { top: '#c9a070', left: '#a87a4a', right: '#8a5a3a', lw: LW }); });
  for (let x = -600; x < 3200; x += 160) sc.add(I.depth(x + 80, FY) - 1, () => { for (const z of [50, 95]) box(g, I, x, FY - 4, z, 160, 8, 12, { top: '#d2a679', left: '#b98a5a', right: '#9a6a40', lw: LW }); });
  // the gate across the road, painted white, padlocked
  sc.add(I.depth(1260, FY) + 2, () => { for (let k = 0; k < 4; k++) box(g, I, 1150, FY - 6, 20 + k * 28, 220, 6, 10, { top: '#fbfaf5', left: '#f4ecd6', right: '#e6dcc4', lw: LW }); box(g, I, 1150, FY - 6, 20, 8, 6, 100, { top: '#fbfaf5', left: '#f4ecd6', right: '#e6dcc4', lw: LW }); box(g, I, 1362, FY - 6, 20, 8, 6, 100, { top: '#fbfaf5', left: '#f4ecd6', right: '#e6dcc4', lw: LW }); const [lx, ly] = I.p(1366, FY, 60); g.beginPath(); g.roundRect(lx - 7, ly - 4, 14, 14, 2); inkFill(g, '#e3b23c', 1.6); g.beginPath(); g.arc(lx, ly - 4, 5, Math.PI, TAU); g.lineWidth = 2; g.strokeStyle = INK; g.stroke(); });
  // the fallen sign, face up in the grass
  sc.add(I.depth(800, FY + 120), () => { plane(g, I, 'z', 2, (gg) => gg.rect(700, FY + 60, 240, 120), '#fbfaf5', LW); onPlane(g, I, 'z', 2, (gg) => { gg.moveTo(940, FY + 120); gg.lineTo(1100, FY + 140); }); g.lineWidth = 6; g.strokeStyle = '#8a5a3a'; g.stroke(); const [cx, cy] = I.p(820, FY + 120, 2); g.save(); g.translate(cx, cy); g.transform(0.72, 0.36, -0.72, 0.36, 0, 0); g.fillStyle = '#d9493f'; g.font = `bold 34px Arial`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('BULL IN FIELD', 0, -18); g.fillStyle = INK; g.font = `bold 22px Arial`; g.fillText('KEEP GATE SHUT', 0, 22); g.restore(); for (let i = 0; i < 9; i++) { const R = rng(i); const [gx, gy] = I.p(700 + R() * 240, FY + 60 + R() * 120, 2); ln(g, gx, gy, gx + 3, gy - 12, 2, '#6fa04a'); } });

  // the reformer with the sledgehammer, and the farmer
  P(1250, FY + 260, { face: '-y', turn: 0.35, look: look(7101, { fem: false, skin: SKIN[0], hair: HAIR.blond, style: 'side', topKind: 'jacket', top: '#3b7dd8', inner: C.white, bottom: C.khaki }), pose: { ...POSES.point, armF: [100, 110], armN: [20, 40], lean: 4 }, mood: 'open',
    hold: (gg: G, J: Joints) => { const [x, y] = J.hN; const ex = x + 18 * J.fwd, ey = J.aN[1] + 10; ln(gg, x, y - 10, ex, ey, 7); ln(gg, x, y - 10, ex, ey, 3.5, '#c9a070'); gg.beginPath(); gg.rect(ex - 22, ey - 6, 44, 20); inkFill(gg, '#5c6670', 2); },
    who: ['The reformer', 'New to the county, full of good intentions and very sure of himself. Has spent a whole morning walking round this gate. Sees no use for it.'] });
  P(1480, FY + 330, { face: '-x', turn: 0.45, look: look(7102, { fem: true, age: 'old', skin: SKIN[4], hair: HAIR.grey, style: 'bun', topKind: 'coat', top: '#7a8a4a', bottom: C.brown, hat: { kind: 'bucket', color: C.khaki } }), pose: { ...POSES.point, armF: [150, 168], head: -4 }, mood: 'flat',
    who: ['The farmer, Mrs. Okoro', 'Has farmed this valley for fifty years. Does not remember who put the gate up either. Knows better than to pull it down before she finds out.'] });
  sc.draw();

  // the reformer's line of sight stops at the rise; ours does not
  { const [ex, ey] = I.p(1250, FY + 260, 165); const [hx, hy] = I.p(1300, hillTop(1300), 230); g.setLineDash([12, 10]); ln(g, ex, ey, hx, hy, 3, '#a9302a'); g.setLineDash([]); g.beginPath(); g.arc(hx, hy, 14, 0, TAU); inkFill(g, '#fbfaf5', 2.4); ln(g, hx - 6, hy - 6, hx + 6, hy + 6, 3, '#a9302a'); ln(g, hx + 6, hy - 6, hx - 6, hy + 6, 3, '#a9302a'); g.fillStyle = '#7d2a3a'; g.font = `italic 26px ${SERIF}`; g.fillText('what he can see ends here', hx + 26, hy + 8); }
  const [rx, ry] = I.p(1250, FY + 260, 190); bubble(g, rx - 470, ry - 300, 420, '“I don’t see the use of this. Let’s pull it down.”', rx - 20, ry - 20, { size: 25 });
  const [fx, fy] = I.p(1480, FY + 330, 190); bubble(g, fx + 60, fy - 80, 400, '“Go away and think. Come back when you know why it’s here.”', fx + 10, fy - 10, { size: 25 });

  // badges
  const B = (x: number, y: number, z: number, n: number, col?: string) => { const [px, py] = I.p(x, y, z); badge(g, who, px, py, NOTES[n - 1], col); };
  B(1800, FY, 170, 1); B(1050, FY + 300, 260, 2); B(1650, FY + 380, 260, 3, '#e3b23c'); B(1250, 420, 200, 4); B(640, FY + 160, 40, 5, '#3a3a40');

  titlePanel(g, { x: 50, y: 40, w: 760, title: 'Chesterton’s Fence', def: 'Don’t remove a fence until you know why it was put up.', credit: 'G. K. Chesterton · The Thing, 1929' });
  keyPanel(g, 1760, 1000, 600, NOTES, { fill: (n) => n === 3 ? '#e3b23c' : n === 5 ? '#3a3a40' : '#d9493f' });
  grain(g, W, H, 0.1, 19);
}

export const FENCE: Plate = {
  key: 'fence', title: 'Chesterton’s Fence', place: 'After G. K. Chesterton',
  blurb: 'A young reformer with a sledgehammer at a gate that seems to serve no purpose; the old farmer tells him to go away and think. Over the rise, where only we can see, a bull grazes beside the lane the children walk to school.',
  w: W, h: H, paint,
};
