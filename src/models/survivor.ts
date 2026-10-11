/**
 * Survivorship Bias — Abraham Wald and the Statistical Research Group,
 * Columbia, during the Second World War. The planes that came back were
 * full of holes in the wings and fuselage and had almost none in the
 * engines. The engineers wanted armour where the holes were; Wald pointed
 * out that the holes showed where a plane could be hit and still come home.
 * The planes hit in the engines were the ones that never came back.
 */
import { type G, C, HAIR, SKIN, INK, inkFill, ellipse, ln, rng, grain, TAU, SERIF, rect } from '../walks/kit';
import { POSES, randomLook, person, type Look, type Joints } from '../walks/people';
import { type Plate, type Who } from '../walks/stage';
import { W, H, titlePanel, keyPanel, badge, bubble, CINZEL } from './note';

const look = (seed: number, o: Partial<Look>) => randomLook(seed, o);
const LW = 2.4, FLOOR = 1330;
const OD = '#7d8a5a', OD2 = '#66724a';

const NOTES = [
  { n: 1, title: 'The planes that came back', gloss: 'Holes in the wings, the body and the tail.', line: 'Every plane that landed was inspected and its bullet holes counted. They clustered on the wings, along the fuselage and on the tail.' },
  { n: 2, title: 'The obvious answer', gloss: 'Put the armour where the holes are.', line: 'The natural conclusion was to armour the places most often hit. Armour is heavy, so it had to go where it would help most.' },
  { n: 3, title: 'Wald’s answer', gloss: 'Armour where the holes aren’t: the engines.', line: 'Abraham Wald saw that the sample only contained survivors. The holes marked where a plane could be hit and still fly home; the clean engines meant planes hit there did not come back. Armour belonged where the returning planes had no holes.' },
  { n: 4, title: 'The missing data', gloss: 'The planes that never came home.', line: 'The evidence that mattered most was the evidence that never arrived: the planes lost over the sea. Survivorship bias is drawing conclusions from what made it through a filter, while forgetting the filter.' },
  { n: 5, title: 'Everywhere else', gloss: 'Dropouts who got rich; buildings that “were built better”.', line: 'The same mistake: studying the college dropouts who became billionaires (and not the many who didn’t), or deciding old buildings were built better because the badly built ones have already fallen down.' },
];

/** a twin-engine plane in side view, nose to the right, length L, wheels at (x, y) */
function planeSide(g: G, x: number, y: number, L: number, holes: boolean) {
  const s = L / 1000;
  g.save(); g.translate(x, y); g.scale(s, s);
  const k = LW / s;
  // far wing, far engine
  g.beginPath(); g.moveTo(0, -252); g.lineTo(330, -262); g.lineTo(340, -246); g.lineTo(0, -234); g.closePath(); inkFill(g, OD2, k);
  // tail
  g.beginPath(); g.moveTo(-420, -260); g.lineTo(-470, -470); g.lineTo(-390, -470); g.lineTo(-300, -270); g.closePath(); inkFill(g, OD, k);
  g.beginPath(); g.moveTo(-460, -282); g.lineTo(-330, -296); g.lineTo(-330, -270); g.lineTo(-470, -262); g.closePath(); inkFill(g, OD2, k);
  // fuselage
  g.beginPath(); g.moveTo(-470, -270); g.quadraticCurveTo(-200, -330, 300, -320); g.quadraticCurveTo(520, -318, 560, -260); g.quadraticCurveTo(540, -200, 300, -190); g.quadraticCurveTo(-100, -190, -470, -250); g.closePath(); inkFill(g, OD, k);
  g.fillStyle = 'rgba(255,255,255,0.12)'; g.beginPath(); g.moveTo(-440, -268); g.quadraticCurveTo(-200, -318, 300, -308); g.lineTo(300, -295); g.quadraticCurveTo(-200, -300, -440, -258); g.fill();
  // cockpit glass and the nose glass
  g.beginPath(); g.moveTo(330, -318); g.quadraticCurveTo(380, -360, 440, -318); g.closePath(); inkFill(g, '#bfe0e8', k);
  g.beginPath(); g.moveTo(520, -292); g.quadraticCurveTo(565, -262, 540, -222); g.lineTo(510, -230); g.closePath(); inkFill(g, '#bfe0e8', k);
  // windows and the letters
  for (let i = 0; i < 4; i++) { g.beginPath(); g.rect(-120 + i * 60, -282, 26, 18); inkFill(g, '#bfe0e8', k * 0.7); }
  g.fillStyle = '#f4ecd6'; g.font = `bold 46px Arial`; g.fillText('SRG · 7', -330, -214);
  // near wing (seen from slightly below)
  g.beginPath(); g.moveTo(-20, -232); g.lineTo(330, -222); g.quadraticCurveTo(346, -212, 330, -200); g.lineTo(-20, -204); g.closePath(); inkFill(g, OD, k);
  // the engine nacelle on the near wing, and its propeller
  g.beginPath(); g.moveTo(120, -214); g.lineTo(380, -216); g.quadraticCurveTo(420, -196, 380, -170); g.lineTo(140, -172); g.quadraticCurveTo(110, -190, 120, -214); g.closePath(); inkFill(g, OD2, k);
  ellipse(g, 420, -194, 9, 70, 0, 'rgba(220,220,210,0.55)', k * 0.8); ellipse(g, 424, -194, 9, 9, 0, '#3a3a40', k);
  // landing gear
  ln(g, 260, -172, 260, -30, k * 1.6); ln(g, 260, -172, 260, -30, k * 0.8, '#5c6670'); ellipse(g, 260, -30, 30, 30, 0, '#26262b', k); ellipse(g, 260, -30, 10, 10, 0, '#9aa0a6', k * 0.6);
  ln(g, -380, -250, -380, -18, k * 1.2); ellipse(g, -380, -14, 14, 14, 0, '#26262b', k);
  if (holes) {
    const R = rng(4);
    const spot = (x0: number, x1: number, y0: number, y1: number, n: number) => { for (let i = 0; i < n; i++) { const hx = x0 + R() * (x1 - x0), hy = y0 + R() * (y1 - y0); ellipse(g, hx, hy, 6, 6, 0, '#26262b', 0); ellipse(g, hx, hy, 3, 3, 0, '#d9493f', 0); } };
    spot(-380, 300, -300, -215, 38); spot(-460, -400, -440, -300, 9); spot(-10, 110, -228, -206, 6);
  }
  g.restore();
}

/** a twin-engine plane seen from above, nose up, centre (x, y), span S */
function planeTop(g: G, x: number, y: number, S: number, dots: boolean, ghost = false) {
  const s = S / 1000;
  g.save(); g.translate(x, y); g.scale(s, s);
  const k = (ghost ? 3 : LW) / s, f = ghost ? null : '#d8d2bc';
  if (ghost) g.setLineDash([24, 18]);
  const shape = (pts: [number, number][]) => { g.beginPath(); g.moveTo(...pts[0]); for (const p of pts) g.lineTo(...p); g.closePath(); inkFill(g, f, k, ghost ? 'rgba(255,255,255,0.75)' : INK); };
  shape([[-500, -40], [-80, -110], [80, -110], [500, -40], [500, 10], [80, -10], [-80, -10], [-500, 10]]);
  shape([[-200, 330], [-30, 300], [30, 300], [200, 330], [200, 365], [30, 355], [-30, 355], [-200, 365]]);
  g.beginPath(); g.ellipse(0, 0, 60, 380, 0, 0, TAU); inkFill(g, f, k, ghost ? 'rgba(255,255,255,0.75)' : INK);
  for (const ex of [-230, 230]) { g.beginPath(); g.ellipse(ex, -80, 34, 110, 0, 0, TAU); inkFill(g, ghost ? null : '#c4bda4', k, ghost ? 'rgba(255,255,255,0.75)' : INK); }
  if (!ghost) { g.beginPath(); g.ellipse(0, -300, 34, 50, 0, 0, TAU); inkFill(g, '#bfe0e8', k); }
  if (dots) {
    const R = rng(9); g.fillStyle = '#d9493f';
    const sp = (x0: number, x1: number, y0: number, y1: number, n: number, avoid?: (x: number, y: number) => boolean) => { let m = 0; while (m < n) { const px = x0 + R() * (x1 - x0), py = y0 + R() * (y1 - y0); if (avoid && avoid(px, py)) continue; g.beginPath(); g.arc(px, py, 11, 0, TAU); g.fill(); m++; } };
    const nearEngine = (px: number, py: number) => Math.abs(Math.abs(px) - 230) < 70 && py > -200 && py < 40;
    sp(-480, -90, -90, 0, 26, nearEngine); sp(90, 480, -90, 0, 26, nearEngine); sp(-40, 40, -150, 260, 22); sp(-180, 180, 305, 355, 12);
  }
  g.setLineDash([]);
  g.restore();
}

function paint(g: G, who: Who[]) {
  // the hangar: corrugated walls, a great open door on the right
  g.fillStyle = '#c9c4b4'; g.fillRect(0, 0, W, FLOOR);
  for (let x = 0; x < W; x += 28) { g.fillStyle = (x / 28) % 2 ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.06)'; g.fillRect(x, 0, 14, FLOOR); }
  // roof trusses
  for (let x = -100; x < W; x += 300) { ln(g, x, 40, x + 300, 40, 6); ln(g, x, 40, x + 150, 200, 4); ln(g, x + 300, 40, x + 150, 200, 4); ln(g, x, 200, x + 300, 200, 6); }
  // the door opening onto the sea and sky, with the planes that did not come back
  const DX = 1560, DY = 300, DW = 840, DH = FLOOR - DY;
  g.save(); g.beginPath(); g.rect(DX, DY, DW, DH); g.clip();
  const sky = g.createLinearGradient(0, DY, 0, FLOOR); sky.addColorStop(0, '#5f86a8'); sky.addColorStop(1, '#e9c99a'); g.fillStyle = sky; g.fillRect(DX, DY, DW, DH);
  g.fillStyle = '#3f6f8a'; g.fillRect(DX, 1060, DW, FLOOR - 1060); ln(g, DX, 1060, DX + DW, 1060, 2);
  g.fillStyle = '#d8c49a'; g.fillRect(DX, 1220, DW, FLOOR - 1220);
  for (const [px, py, sp, rot] of [[1780, 560, 260, -0.3], [2120, 470, 220, 0.2], [1960, 760, 300, -0.1], [2260, 840, 180, 0.4]] as [number, number, number, number][]) { g.save(); g.translate(px, py); g.rotate(rot); planeTop(g, 0, 0, sp, false, true); g.restore(); }
  g.fillStyle = 'rgba(255,255,255,0.85)'; g.font = `italic 30px ${SERIF}`; g.fillText('the planes that never came back', DX + 120, DY + 80);
  g.restore();
  rect(g, DX, DY, DW, DH, null, LW * 1.4);
  rect(g, DX - 20, DY - 30, DW + 40, 30, '#8a8f9a', LW);
  // the floor
  g.fillStyle = '#a8a39a'; g.fillRect(0, FLOOR, W, H - FLOOR); ln(g, 0, FLOOR, W, FLOOR, LW);
  for (let x = -200; x < W; x += 240) ln(g, x, FLOOR, x - 160, H, 1.4, 'rgba(31,26,23,0.2)');
  g.fillStyle = 'rgba(31,26,23,0.16)'; g.beginPath(); g.ellipse(980, FLOOR + 40, 620, 34, 0, 0, TAU); g.fill();

  // the chalkboard on the left wall: the famous diagram
  const BX = 900, BY = 40, BW = 600, BH = 500;
  rect(g, BX - 14, BY - 14, BW + 28, BH + 28, '#8a5a3a', LW); rect(g, BX, BY, BW, BH, '#2f4a3a', LW);
  planeTop(g, BX + BW / 2, BY + 270, 440, true);
  g.fillStyle = '#eef3ea'; g.font = `600 26px ${CINZEL}`; g.textAlign = 'center'; g.fillText('HITS ON RETURNING AIRCRAFT', BX + BW / 2, BY + 52); g.textAlign = 'left';
  // the chalk circles on the clean engines
  g.strokeStyle = '#ffd25a'; g.lineWidth = 4; for (const ex of [-230, 230]) { g.beginPath(); g.ellipse(BX + BW / 2 + ex * 0.44, BY + 270 - 35, 30, 62, 0, 0, TAU); g.stroke(); }
  g.fillStyle = '#ffd25a'; g.font = `italic 28px ${SERIF}`; g.fillText('no holes here → armour HERE', BX + 40, BY + BH - 30);

  // the plane that came back
  planeSide(g, 820, FLOOR, 1500, true);

  // the engineers' armour plates: patches being riveted over the holes
  const patch = (x: number, y: number, w: number, h: number) => { g.beginPath(); g.rect(x, y, w, h); inkFill(g, '#9aa0a6', 2); for (const [dx, dy] of [[4, 4], [w - 4, 4], [4, h - 4], [w - 4, h - 4]]) ellipse(g, x + dx, y + dy, 2, 2, 0, INK, 0); };
  patch(640, FLOOR - 450, 80, 54); patch(820, FLOOR - 460, 70, 50);
  // a ladder against the fuselage, an engineer on it
  ln(g, 700, FLOOR, 740, FLOOR - 400, 5); ln(g, 740, FLOOR, 780, FLOOR - 400, 5); for (let k = 1; k < 10; k++) ln(g, 700 + k * 4, FLOOR - k * 40, 740 + k * 4, FLOOR - k * 40, 4);
  person(g, { x: 770, y: FLOOR - 200, s: 2.3, turn: 0.4, back: true, look: look(6001, { fem: false, skin: SKIN[1], hair: HAIR.brown, style: 'short', topKind: 'shirt', top: '#5c6f86', bottom: '#5c6f86', hat: { kind: 'cap', color: '#5c6f86' } }), pose: { ...POSES.reach, armF: [150, 160], armN: [130, 150] }, lw: 2.2,
    over: (gg: G, J: Joints) => { ln(gg, J.hF[0], J.hF[1], J.hF[0] - 10, J.hF[1] - 26, 5, '#5c6670'); } });
  // the engineer with the plan to armour the holes
  const E = person(g, { x: 400, y: FLOOR + 22, s: 2.8, turn: 0.5, look: look(6002, { fem: false, skin: SKIN[0], hair: HAIR.blond, style: 'side', topKind: 'shirt', top: C.white, accent: C.white, bottom: C.khaki, glasses: true }), pose: { ...POSES.point, armF: [110, 112] }, face: 'open', lw: 2.2 });
  bubble(g, 40, 820, 380, '“The holes are on the wings and the body. Armour them.”', E.H[0] - 10, E.H[1] - 34, { size: 25 });
  // the woman counting holes, with a clipboard
  person(g, { x: 1340, y: FLOOR + 22, s: 2.8, turn: -0.4, look: look(6003, { fem: true, skin: SKIN[3], hair: HAIR.black, style: 'bun', topKind: 'jacket', top: '#5c6f86', inner: C.white, bottom: '#5c6f86', bottomKind: 'skirt' }), pose: { ...POSES.cradle, head: 20 }, eyes: 'down', lw: 2.2,
    hold: (gg: G, J: Joints) => { const cx = (J.hN[0] + J.hF[0]) / 2, cy = (J.hN[1] + J.hF[1]) / 2 - 6; gg.beginPath(); gg.rect(cx - 16, cy - 20, 32, 40); inkFill(gg, '#c9a070', 2); gg.beginPath(); gg.rect(cx - 12, cy - 15, 24, 32); inkFill(gg, '#fbfaf5', 1.4); gg.fillStyle = INK; for (let i = 0; i < 4; i++) gg.fillRect(cx - 8, cy - 9 + i * 7, 4 + i * 3, 2); } });
  // Wald, at the board, pointing at the engines
  const Wd = person(g, { x: 1080, y: FLOOR + 28, s: 2.9, turn: -0.5, look: look(6004, { fem: false, skin: SKIN[0], hair: HAIR.dark, style: 'balding', topKind: 'jacket', top: '#3a3a40', inner: C.white, bottom: '#3a3a40', glasses: true, beard: 'mustache' }), pose: { ...POSES.point, armF: [140, 150], head: -14 }, face: 'smile', lw: 2.2 });
  bubble(g, 1130, 760, 470, '“The holes show where a plane can be hit and still come home. Armour the engines.”', Wd.H[0] - 10, Wd.H[1] - 40, { size: 25 });

  // the hotspots on the figures themselves
  who.push({ x: E.H[0], y: E.H[1] + 40, r: 60, name: 'The engineers', line: 'Sensible people with good data and a wrong question: where do the planes get hit? The question that mattered was: where do the planes we never see get hit?' });
  who.push({ x: Wd.H[0], y: Wd.H[1] + 40, r: 60, name: 'Abraham Wald (1902–1950)', line: 'A Hungarian-born mathematician who fled Austria in 1938 and worked for the Statistical Research Group at Columbia during the war. His memos on estimating aircraft vulnerability from the damage on returning planes were written in 1943.' });

  badge(g, who, 600, 700, NOTES[0]);
  badge(g, who, 470, 820, NOTES[1]);
  badge(g, who, 1530, 120, NOTES[2], '#e3b23c');
  badge(g, who, 2300, 380, NOTES[3]);
  badge(g, who, 2300, 1150, NOTES[4], '#3a3a40');

  titlePanel(g, { x: 50, y: 40, w: 800, title: 'Survivorship Bias', def: 'Learning only from what made it through, and forgetting what didn’t.', credit: 'Abraham Wald · Statistical Research Group, Columbia, 1943' });
  keyPanel(g, 50, 1380, 2300, NOTES, { cols: 3, fill: (n) => n === 3 ? '#e3b23c' : n === 5 ? '#3a3a40' : '#d9493f' });
  grain(g, W, H, 0.1, 15);
}

export const SURVIVOR: Plate = {
  key: 'survivor', title: 'Survivorship Bias', place: 'After Abraham Wald',
  blurb: 'A plane back from a mission, riddled on the wings and body and clean on the engines. The engineers want armour on the holes; Abraham Wald points at the engines, and at the open door, where the planes that never came back would be.',
  w: W, h: H, paint,
};
