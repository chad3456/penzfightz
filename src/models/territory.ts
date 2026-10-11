/**
 * The Map Is Not the Territory — Alfred Korzybski (1931; Science and
 * Sanity, 1933). A hiker trusts her paper map; beside it lies the land
 * itself, which the map has simplified, left out, or fallen behind: the
 * bridge washed away, the river moved, the cliff the map never showed, the
 * meadow that is now a marsh. Every model is a map: useful because it
 * leaves things out, dangerous when we forget that it does.
 */
import { type G, Iso, Scene, C, HAIR, SKIN, INK, box, plane, onPlane, inkFill, ln, ellipse, rng, grain, TAU, SERIF, rect, type Pt } from '../walks/kit';
import { POSES, randomLook, type Look, type Joints } from '../walks/people';
import { isoTree, treeShadow, wallText } from '../walks/props';
import { type Plate, type Who, ip } from '../walks/stage';
import { W, H, titlePanel, keyPanel, badge, bubble, CINZEL } from './note';

const look = (seed: number, o: Partial<Look>) => randomLook(seed, o);
const LW = 1.7;

const NOTES = [
  { n: 1, title: 'The map', gloss: 'Clean, flat, legible, and simpler than the world.', line: 'A map is useful precisely because it leaves almost everything out. Korzybski’s point was not that maps are bad, but that they are not the thing they describe.' },
  { n: 2, title: 'The territory', gloss: 'Everything the map could not hold.', line: 'The land itself has mud, slope, weather, fallen trees and the river’s own ideas. No map, model or theory contains all of it.' },
  { n: 3, title: 'Out of date', gloss: 'The bridge on the map washed out two winters ago.', line: 'Maps describe the world as it was when they were drawn. The territory keeps changing; the map does not, until someone redraws it.' },
  { n: 4, title: 'Left out', gloss: 'The cliff between here and the campsite.', line: 'What a map omits can matter more than what it shows. This one has no contour lines, so the dotted path runs straight up a cliff.' },
  { n: 5, title: 'Mistaking one for the other', gloss: 'The phone says the road goes straight on.', line: 'The danger is not using maps but obeying them over your own eyes: walking into the lake because the screen says the road is there.' },
];

function paint(g: G, who: Who[]) {
  const I = new Iso(1200, 200, 0.62);
  const sc = new Scene(g);
  const P = (x: number, y: number, o: Parameters<typeof ip>[6], z = 0) => ip(sc, I, who, x, y, z, o);

  g.fillStyle = '#b8d4a0'; g.fillRect(0, 0, W, H);
  plane(g, I, 'z', 0, (gg) => gg.rect(-2000, -2000, 8000, 8000), '#a8c88a', 0);
  // the river, meandering where it likes
  const riverY = (x: number) => 1088 + Math.sin((x - 1170) / 520) * 200 + Math.sin(x / 190) * 30;
  { const top: Pt[] = [], bot: Pt[] = []; for (let x = -1200; x <= 4200; x += 40) { top.push(I.p(x, riverY(x) - 90, 0)); bot.push(I.p(x, riverY(x) + 90, 0)); }
    g.beginPath(); g.moveTo(...top[0]); for (const p of top) g.lineTo(...p); for (let i = bot.length - 1; i >= 0; i--) g.lineTo(...bot[i]); g.closePath(); inkFill(g, '#6cb0c8', LW);
    g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 2; for (let x = -1200; x < 4200; x += 120) { const [a, b] = I.p(x, riverY(x), 0); g.beginPath(); g.moveTo(a - 14, b); g.quadraticCurveTo(a, b - 5, a + 14, b); g.stroke(); } }
  // the marsh where the map has a meadow
  sc.add(-1e5, () => { const R = rng(5); for (let i = 0; i < 22; i++) { const x = 250 + R() * 450, y = 1450 + R() * 420; plane(g, I, 'z', 0, (gg) => gg.ellipse(x, y, 60 + R() * 60, 40 + R() * 40, 0, 0, TAU), '#7eaab0', 1.2); } for (let i = 0; i < 70; i++) { const [rx, ry] = I.p(230 + R() * 500, 1430 + R() * 460, 0); ln(g, rx, ry, rx + (R() - 0.5) * 6, ry - 18 - R() * 14, 2, '#5f7f3a'); } });
  // the trail
  const trail: [number, number][] = [[1300, 2900], [1290, 2097], [1371, 1855], [1200, 1450], [1160, riverY(1160) + 140], [1180, riverY(1180) - 160], [1100, 820], [1000, 700]];
  onPlane(g, I, 'z', 0, (gg) => { gg.moveTo(...trail[0]); for (const p of trail) gg.lineTo(...p); }); g.lineWidth = 60 * I.s; g.lineJoin = 'round'; g.strokeStyle = INK; g.stroke(); g.lineWidth = 56 * I.s; g.strokeStyle = '#e6d2a0'; g.stroke();
  // the cliff the map leaves out: a plateau with a rock face
  sc.add(I.depth(850, 450), () => {
    box(g, I, 400, 100, 0, 900, 700, 340, { top: '#a8c88a', left: '#b8a080', right: '#9a8466', lw: LW });
    onPlane(g, I, 'y', 800, (gg) => { const R = rng(3); for (let i = 0; i < 30; i++) { const x = 420 + R() * 860, z = 20 + R() * 300; gg.moveTo(x, z); gg.lineTo(x + 30 + R() * 50, z + (R() - 0.5) * 20); } }); g.strokeStyle = 'rgba(60,40,20,0.45)'; g.lineWidth = 2; g.stroke();
    onPlane(g, I, 'x', 1300, (gg) => { const R = rng(4); for (let i = 0; i < 26; i++) { const y = 120 + R() * 660, z = 20 + R() * 300; gg.moveTo(y, z); gg.lineTo(y + 30 + R() * 40, z + (R() - 0.5) * 20); } }); g.stroke();
    // the campsite on top
    for (const [x, y, c] of [[760, 400, '#e3584a'], [980, 520, '#e3b23c']] as [number, number, string][]) { const a = I.p(x - 60, y, 340), b = I.p(x + 60, y, 340), t = I.p(x, y, 440), a2 = I.p(x - 60, y + 100, 340), b2 = I.p(x + 60, y + 100, 340), t2 = I.p(x, y + 100, 440); g.beginPath(); g.moveTo(...a); g.lineTo(...t); g.lineTo(...t2); g.lineTo(...a2); g.closePath(); inkFill(g, c, LW); g.beginPath(); g.moveTo(...b); g.lineTo(...t); g.lineTo(...t2); g.lineTo(...b2); g.closePath(); inkFill(g, c, LW); g.beginPath(); g.moveTo(...a2); g.lineTo(...t2); g.lineTo(...b2); g.closePath(); inkFill(g, '#3a3a40', LW); }
  });
  // the bridge, washed out in the middle
  sc.add(I.depth(1170, riverY(1170)), () => {
    const y0 = riverY(1170) - 130, y1 = riverY(1170) + 130;
    box(g, I, 1130, y1 - 90, 0, 90, 90, 40, { top: '#b9824e', left: '#9a6440', right: '#7a4a2a', lw: LW });
    box(g, I, 1130, y0, 0, 90, 70, 40, { top: '#b9824e', left: '#9a6440', right: '#7a4a2a', lw: LW });
    // a few planks hanging into the water
    for (let k = 0; k < 3; k++) { const a = I.p(1135 + k * 28, y1 - 92, 40), b = I.p(1145 + k * 28, y1 - 140, 0); ln(g, a[0], a[1], b[0], b[1], 7); ln(g, a[0], a[1], b[0], b[1], 4, '#b9824e'); }
    const [sx, sy] = I.p(1260, y1 + 60, 0); ln(g, sx, sy, sx, sy - 70, 4); g.beginPath(); g.rect(sx - 44, sy - 100, 88, 36); inkFill(g, '#e3b23c', 2); g.fillStyle = INK; g.font = `bold 15px Arial`; g.textAlign = 'center'; g.fillText('BRIDGE OUT', sx, sy - 77); g.textAlign = 'left';
  });
  // a fallen tree across the trail
  sc.add(I.depth(1380, 1880), () => { const a = I.p(1240, 1760, 20), b = I.p(1520, 1960, 20); ln(g, a[0], a[1], b[0], b[1], 30); ln(g, a[0], a[1], b[0], b[1], 24, '#8a5a3a'); ellipse(g, a[0], a[1], 13, 13, 0, '#d2a679', 2); });
  // trees
  for (const [x, y, s] of [[1048, 2500, 1], [1774, 1290, 2], [-161, 1452, 3], [-81, 887, 4], [2100, 1700, 5], [1900, 900, 6], [200, 2300, 7]] as [number, number, number][]) sc.add(I.depth(x, y), () => { treeShadow(g, I, x, y, 150); isoTree(g, I, x, y, 420, 170, LW, s, { leaf: '#4f8a4a', leaf2: '#3f7a3e' }); });

  // the hiker with her map, at the fallen tree
  P(1290, 2097, { scale: 1.7, face: '-y', turn: 0.55, look: look(8001, { fem: true, skin: SKIN[3], hair: HAIR.black, style: 'ponytail', topKind: 'jacket', top: '#d9493f', inner: C.white, bottom: '#5c6670', bag: { kind: 'backpack', color: '#e3b23c' }, hat: { kind: 'cap', color: '#3a3a40' } }), pose: { ...POSES.cradle, head: 26, armN: [30, 110], armF: [40, 116] }, eyes: 'down',
    hold: (gg: G, J: Joints) => { const cx = (J.hN[0] + J.hF[0]) / 2, cy = (J.hN[1] + J.hF[1]) / 2 - 4; gg.beginPath(); gg.rect(cx - 26, cy - 16, 52, 30); inkFill(gg, '#f7f1df', 1.6); ln(gg, cx, cy - 16, cx, cy + 14, 1); ln(gg, cx - 22, cy, cx + 20, cy - 8, 2, '#d9493f'); },
    who: ['The hiker, Ana', 'Bought the map at the trailhead store. It is a good map. It says the bridge is fine and the path to the campsite is gentle.'] });
  // the man following his phone into the pond
  sc.add(I.depth(1780, 1940) - 400, () => plane(g, I, 'z', 0, (gg) => gg.ellipse(1800, 1940, 300, 220, 0, 0, TAU), '#6cb0c8', LW));
  P(1780, 1940, { scale: 1.7, face: '-x', turn: 0.4, look: look(8002, { fem: false, skin: SKIN[1], hair: HAIR.brown, style: 'short', topKind: 'hoodie', top: '#3b7dd8', bottom: C.khaki }), pose: { ...POSES.phone, head: 28 }, eyes: 'down', hold: (gg: G, J: Joints) => { const [x, y] = J.hN; gg.beginPath(); gg.roundRect(x - 6, y - 14, 12, 18, 2); inkFill(gg, '#3a3a40', 1.6); },
    over: (gg: G, J: Joints) => { const y = J.kN[1] + 6; gg.save(); gg.beginPath(); gg.rect(J.P[0] - 60, y, 120, 120); gg.clip(); gg.fillStyle = '#6cb0c8'; gg.fillRect(J.P[0] - 60, y, 120, 120); gg.restore(); gg.beginPath(); gg.ellipse(J.P[0], y + 2, 34, 8, 0, 0, TAU); gg.strokeStyle = '#fbfaf5'; gg.lineWidth = 2; gg.stroke(); },
    who: ['Dev, following his phone', 'The app says the trail goes straight on. It does, on the app.'] });
  sc.draw();
  { const [x, y] = I.p(1780, 1940, 330); bubble(g, x - 60, y - 130, 290, '“Recalculating…”', x + 10, y - 10, { size: 25 }); }

  /* the map she is holding, drawn large */
  const MX = 1620, MY = 50, MW = 730, MH = 560;
  g.save(); g.translate(MX + MW / 2, MY + MH / 2); g.rotate(0.02);
  const mx = -MW / 2, my = -MH / 2;
  g.beginPath(); g.rect(mx + 8, my + 8, MW, MH); g.fillStyle = INK; g.fill();
  g.beginPath(); g.rect(mx, my, MW, MH); inkFill(g, '#f7f1df', 2.6);
  for (const t of [1, 2]) ln(g, mx + MW * t / 3, my, mx + MW * t / 3, my + MH, 1.2, 'rgba(31,26,23,0.18)'); ln(g, mx, my + MH / 2, mx + MW, my + MH / 2, 1.2, 'rgba(31,26,23,0.18)');
  g.fillStyle = '#e4efd8'; g.fillRect(mx + 20, my + 60, MW - 40, MH - 80);
  // river, straight-ish, in the wrong place
  g.beginPath(); g.moveTo(mx + 20, my + 300); g.bezierCurveTo(mx + 250, my + 280, mx + 450, my + 330, mx + MW - 20, my + 300); g.lineWidth = 22; g.strokeStyle = '#8cc8e8'; g.stroke();
  // the bridge, intact
  g.beginPath(); g.rect(mx + 330, my + 286, 40, 30); inkFill(g, '#c9a070', 2);
  // the trail, dashed, straight up to the campsite
  g.setLineDash([14, 10]); g.beginPath(); g.moveTo(mx + 120, my + MH - 40); g.lineTo(mx + 350, my + 300); g.lineTo(mx + 560, my + 120); g.lineWidth = 5; g.strokeStyle = '#d9493f'; g.stroke(); g.setLineDash([]);
  // campsite
  g.beginPath(); g.moveTo(mx + 560, my + 96); g.lineTo(mx + 584, my + 136); g.lineTo(mx + 536, my + 136); g.closePath(); inkFill(g, '#d9493f', 2);
  // a meadow, a pond, trees as circles
  g.fillStyle = '#b8d890'; g.beginPath(); g.ellipse(mx + 180, my + 400, 90, 50, 0, 0, TAU); g.fill(); g.fillStyle = '#4f8a4a'; g.font = `italic 20px ${SERIF}`; g.fillText('meadow', mx + 146, my + 406);
  for (let i = 0; i < 14; i++) { const R = rng(i + 20); ellipse(g, mx + 40 + R() * (MW - 80), my + 80 + R() * 160, 12, 12, 0, '#8cbf6a', 1.2); }
  ellipse(g, mx + 120, my + 470, 10, 10, 0, '#3b7dd8', 2); g.fillStyle = INK; g.font = `italic 19px ${SERIF}`; g.fillText('you are here', mx + 136, my + 476);
  g.fillStyle = INK; g.font = `600 30px ${CINZEL}`; g.fillText('PINE RIDGE TRAIL', mx + 30, my + 44); g.font = `italic 19px ${SERIF}`; g.fillText('surveyed 2009', mx + MW - 150, my + 44);
  g.restore();
  ln(g, MX + 120, MY + MH - 30, I.p(1290, 2097, 140)[0] + 30, I.p(1290, 2097, 140)[1] - 30, 2, 'rgba(31,26,23,0.35)');

  const B = (x: number, y: number, z: number, n: number, col?: string) => { const [px, py] = I.p(x, y, z); badge(g, who, px, py, NOTES[n - 1], col); };
  badge(g, who, MX - 10, MY + 90, NOTES[0], '#3b7dd8');
  B(1600, 1050, 60, 2); badge(g, who, 1420, 900, NOTES[2]); badge(g, who, 1120, 500, NOTES[3]); badge(g, who, 1300, 1150, NOTES[4], '#3a3a40');

  titlePanel(g, { x: 50, y: 40, w: 800, title: 'The Map Is Not the Territory', def: 'Every map, model and theory leaves things out. That is what makes it useful, and what makes it dangerous.', credit: 'Alfred Korzybski · 1931; Science and Sanity, 1933' });
  keyPanel(g, 1660, 1060, 700, NOTES, { fill: (n) => n === 1 ? '#3b7dd8' : n === 5 ? '#3a3a40' : '#d9493f' });
  grain(g, W, H, 0.1, 23);
  void wallText; void rect; void box;
}

export const TERRITORY: Plate = {
  key: 'territory', title: 'The Map Is Not the Territory', place: 'After Alfred Korzybski',
  blurb: 'A hiker reads a clean map from 2009 while the land beside it has moved on: the bridge washed out, the river shifted, a marsh where the meadow was, a cliff the map never showed, and a man walking into a pond because his phone says the road goes straight.',
  w: W, h: H, paint,
};
