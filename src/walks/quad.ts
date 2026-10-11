/**
 * The Quad — a university campus on a warm afternoon in September, seen
 * from above: the old brick hall and the library steps, the oak with the
 * round bench, the fountain, frisbee on the lawn, the campus tour walking
 * backwards, the club tables, the taco truck, and a graduate in a gown
 * posing for her mother's phone.
 */
import { type G, Iso, Scene, C, HAIR, SKIN, INK, box, plane, onPlane, inkFill, ln, ellipse, shade, rng, pick, grain, SERIF, SANS, TAU, type Pt } from './kit';
import { POSES, randomLook, type Look, type Joints } from './people';
import { table, chair, laptop, openBook, isoTree, treeShadow, bench, dog, wallText } from './props';
import { type Plate, type Who, ip, type IP } from './stage';

const W = 2400, H = 1600, LW = 1.5;
const look = (seed: number, o: Partial<Look>) => randomLook(seed, o);
const GRASS = '#93c45f', GRASS2 = '#86b955', PATH = '#eadfc8', BRICK = '#b5583e';

function paint(g: G, who: Who[]) {
  const I = new Iso(1110, -480, 0.8);
  const sc = new Scene(g);
  const person = (x: number, y: number, z: number, o: IP) => ip(sc, I, who, x, y, z, o);
  const shadowAt = (x: number, y: number, r = 26) => { onPlane(g, I, 'z', 0, (gg) => gg.ellipse(x + 8, y + 10, r, r * 0.8, 0, 0, TAU)); g.fillStyle = 'rgba(30,40,20,0.22)'; g.fill(); };

  /* ── the ground ── */
  g.fillStyle = GRASS; g.fillRect(0, 0, W, H);
  // mowing stripes across the lawn
  for (let i = -20; i < 40; i++) if (i % 2) plane(g, I, 'z', 0, (gg) => gg.rect(-1000, i * 120, 5000, 120), GRASS2, 0);
  // paths: along x, along y, and the diagonal
  const pathX = (y: number, x0: number, x1: number, w = 220) => { plane(g, I, 'z', 0, (gg) => gg.rect(x0, y - w / 2, x1 - x0, w), PATH, LW); onPlane(g, I, 'z', 0, (gg) => { for (let x = x0; x < x1; x += 40) { gg.moveTo(x, y - w / 2); gg.lineTo(x, y + w / 2); } for (let k = 1; k < w / 40; k++) { gg.moveTo(x0, y - w / 2 + k * 40); gg.lineTo(x1, y - w / 2 + k * 40); } }); g.strokeStyle = 'rgba(31,26,23,0.12)'; g.lineWidth = 1; g.stroke(); };
  const pathY = (x: number, y0: number, y1: number, w = 220) => { plane(g, I, 'z', 0, (gg) => gg.rect(x - w / 2, y0, w, y1 - y0), PATH, LW); onPlane(g, I, 'z', 0, (gg) => { for (let y = y0; y < y1; y += 40) { gg.moveTo(x - w / 2, y); gg.lineTo(x + w / 2, y); } for (let k = 1; k < w / 40; k++) { gg.moveTo(x - w / 2 + k * 40, y0); gg.lineTo(x - w / 2 + k * 40, y1); } }); g.strokeStyle = 'rgba(31,26,23,0.12)'; g.lineWidth = 1; g.stroke(); };
  pathX(1700, 600, 4200); pathY(1750, 500, 4000);
  // the diagonal, worn in by twelve thousand students cutting the corner
  // the plaza round the fountain
  plane(g, I, 'z', 0, (gg) => gg.ellipse(1750, 1700, 430, 430, 0, 0, TAU), PATH, LW);
  onPlane(g, I, 'z', 0, (gg) => { for (let r = 120; r < 430; r += 60) { gg.moveTo(1750 + r, 1700); gg.ellipse(1750, 1700, r, r, 0, 0, TAU); } }); g.strokeStyle = 'rgba(31,26,23,0.12)'; g.lineWidth = 1; g.stroke();
  // tree shadows, before anything stands on them
  const trees: [number, number, number, number, number][] = [[1150, 1150, 560, 300, 3], [2600, 820, 520, 260, 5], [620, 1980, 480, 240, 8]];
  for (const [x, y, , r] of trees) treeShadow(g, I, x, y, r);

  /* ── the brick hall on the left, facing +x ── */
  sc.add(I.depth(300, 300) - 2000, () => {
    box(g, I, -400, -400, 0, 900, 3600, 760, { top: '#7a3a2a', left: BRICK, right: BRICK, lw: LW });
    // brick courses
    onPlane(g, I, 'x', 500, (gg) => { for (let z = 20; z < 760; z += 20) { gg.moveTo(-400, z); gg.lineTo(3200, z); } }); g.strokeStyle = 'rgba(80,20,10,0.18)'; g.lineWidth = 1; g.stroke();
    // windows, three storeys
    for (let f = 0; f < 3; f++) for (let y = -300; y < 3100; y += 260) { if (f === 0 && y > 700 && y < 1600) continue; plane(g, I, 'x', 500, (gg) => gg.rect(y, 110 + f * 220, 140, 150), '#f4ecd6', LW); plane(g, I, 'x', 500, (gg) => gg.rect(y + 10, 120 + f * 220, 120, 130), '#a9cfe0', LW * 0.7); onPlane(g, I, 'x', 500, (gg) => { gg.moveTo(y + 70, 120 + f * 220); gg.lineTo(y + 70, 250 + f * 220); gg.moveTo(y + 10, 185 + f * 220); gg.lineTo(y + 130, 185 + f * 220); }); g.strokeStyle = '#f4ecd6'; g.lineWidth = LW * 1.6; g.stroke(); }
    // the portico: pediment and columns over the door
    box(g, I, 500, 820, 400, 160, 760, 40, { top: '#e9dfc6', left: '#f4ecd6', right: '#e2d5b8', lw: LW });
    plane(g, I, 'x', 660, (gg) => { gg.moveTo(820, 440); gg.lineTo(1580, 440); gg.lineTo(1200, 560); gg.closePath(); }, '#f4ecd6', LW);
    wallText(g, I, 'x', 660, 1200, 470, 'MORRISON HALL · 1891', 34, '"Cinzel", serif', '#5a4a3a');
    plane(g, I, 'x', 500, (gg) => gg.rect(1080, 0, 240, 300), '#5a3826', LW);
    plane(g, I, 'x', 500, (gg) => { gg.rect(1092, 10, 104, 270); gg.rect(1204, 10, 104, 270); }, '#7a4a2a', LW);
    for (let i = 0; i < 5; i++) { const y = 860 + i * 170; box(g, I, 620, y, 0, 40, 40, 400, { top: '#f4ecd6', left: '#fbf6ea', right: '#e2d5b8', lw: LW }); }
    // the steps
    for (let k = 0; k < 4; k++) box(g, I, 500 + k * 40, 840 - k * 0, 0, 200 - k * 40, 720, 18 * (4 - k) / 4 * 4 - k * 0, { top: '#e9dfc6', left: '#d8cbb0', right: '#cbbd9e', lw: LW });
  });
  // students on the hall steps
  person(640, 900, 30, { face: '+x', turn: 0.6, look: look(601, { fem: true, skin: SKIN[2], hair: HAIR.black, style: 'long', topKind: 'tee', top: C.white, bottom: C.denim }), pose: POSES.sitPhone, who: ['Priyanka, 20', 'Computer science and dance. Texting her mom that she ate lunch. She did not eat lunch.'] });
  person(650, 1460, 30, { face: '+x', turn: 0.6, look: look(602, { fem: false, skin: SKIN[5], hair: HAIR.black, style: 'locs', topKind: 'hoodie', top: C.navy, bottom: C.khaki }), pose: POSES.sitRead, hold: (gg: G, J: Joints) => { const cx = (J.hN[0] + J.hF[0]) / 2, cy = (J.hN[1] + J.hF[1]) / 2 - 5; gg.beginPath(); gg.rect(cx - 9, cy - 6, 18, 12); inkFill(gg, C.red, LW); }, who: ['Marcus, 21', 'Reading Baldwin for a seminar and also for himself. Has underlined nearly every sentence, which his professor says is allowed.'] });

  /* ── the library at the back, facing +y ── */
  sc.add(I.depth(1500, 0) - 2000, () => {
    box(g, I, 820, -600, 0, 3000, 900, 820, { top: '#cdbf9e', left: '#e9dfc6', right: '#d8cbb0', lw: LW });
    for (let i = 0; i < 5; i++) { const x = 1440 + i * 160; plane(g, I, 'y', 300, (gg) => { gg.rect(x + 20, 80, 90, 360); }, '#a9cfe0', LW); }
    // windows along the rest
    for (let x = 900; x < 3800; x += 180) { if (x > 1300 && x < 2280) continue; for (let f = 0; f < 3; f++) { plane(g, I, 'y', 300, (gg) => gg.rect(x, 120 + f * 230, 110, 150), '#a9cfe0', LW); } }
    // the colonnade
    box(g, I, 1350, 300, 0, 900, 180, 30, { top: '#e9dfc6', left: '#d8cbb0', right: '#cbbd9e', lw: LW });
    for (let i = 0; i < 6; i++) box(g, I, 1390 + i * 160, 360, 30, 50, 50, 520, { top: '#f4ecd6', left: '#fbf6ea', right: '#e2d5b8', lw: LW });
    box(g, I, 1350, 300, 550, 900, 180, 60, { top: '#e9dfc6', left: '#f4ecd6', right: '#e2d5b8', lw: LW });
    wallText(g, I, 'y', 480, 1800, 578, 'LUX · LIBERTAS', 40, '"Cinzel", serif', '#5a4a3a');
    // the steps down to the quad
    for (let k = 0; k < 5; k++) box(g, I, 1350, 480 + k * 30, 0, 900, 30, 30 - k * 6, { top: '#e9dfc6', left: '#d8cbb0', right: '#cbbd9e', lw: LW });
  });

  /* ── the oak with the round bench, and the guitarist ── */
  sc.add(I.depth(1150, 1150) - 1, () => {
    for (let k = 0; k < 12; k++) { const a = (k / 12) * TAU; const x = 1150 + Math.cos(a) * 150, y = 1150 + Math.sin(a) * 150; void x; void y; }
    onPlane(g, I, 'z', 42, (gg) => { gg.ellipse(1150, 1150, 170, 170, 0, 0, TAU); gg.ellipse(1150, 1150, 120, 120, 0, 0, TAU); }); g.fillStyle = '#b9824e'; g.fill('evenodd'); g.lineWidth = LW; g.strokeStyle = INK; g.stroke();
  });
  sc.add(I.depth(1150, 1150), () => isoTree(g, I, 1150, 1150, 600, 320, LW, 3, { leaf: '#5f9a4a', leaf2: '#4a8040' }));
  person(1300, 1240, 42, { face: '+y', turn: 0.55, look: look(611, { fem: false, skin: SKIN[1], hair: HAIR.brown, style: 'curly', topKind: 'shirt', top: '#e0c08a', accent: C.white, bottom: C.denim, beard: true }), pose: POSES.guitar, hold: (gg: G, J: Joints) => guitarIso(gg, J), mood: 'open', who: ['Ezra, 22', 'Music education, from Tulsa. Plays the same four songs under this tree every afternoon. People come back for the fourth one.'] });
  person(1240, 1360, 0, { face: '-y', turn: 0.4, look: look(612, { fem: true, skin: SKIN[4], hair: HAIR.black, style: 'curly', topKind: 'tee', top: C.mustard, bottom: C.olive }), pose: POSES.floorCross, mood: 'smile', who: ['Nia, 19', 'Pre-med, first semester. Was supposed to be at chemistry. Is going to the next one, probably.'] });
  person(1100, 1350, 0, { face: '-x', turn: 0.5, look: look(613, { fem: false, skin: SKIN[2], hair: HAIR.black, style: 'short', topKind: 'tee', top: C.red, bottom: C.khaki }), pose: POSES.floorLegs, mood: 'open', who: ['Diego, 20', 'Engineering. Sings the harmony on the fourth song, badly, with total commitment.'] });

  /* ── the fountain ── */
  sc.add(I.depth(1750, 1700), () => {
    onPlane(g, I, 'z', 0, (gg) => gg.ellipse(1750, 1700, 200, 200, 0, 0, TAU)); g.fillStyle = '#d8cbb0'; g.fill();
    for (let z = 0; z < 50; z += 5) { onPlane(g, I, 'z', z, (gg) => gg.ellipse(1750, 1700, 200, 200, 0, 0, TAU)); g.fillStyle = '#d8cbb0'; g.fill(); }
    onPlane(g, I, 'z', 0, (gg) => gg.ellipse(1750, 1700, 200, 200, 0, Math.PI * 0.25, Math.PI * 1.25, true)); g.lineWidth = LW; g.strokeStyle = INK; g.stroke();
    plane(g, I, 'z', 50, (gg) => gg.ellipse(1750, 1700, 200, 200, 0, 0, TAU), '#e9dfc6', LW);
    plane(g, I, 'z', 46, (gg) => gg.ellipse(1750, 1700, 170, 170, 0, 0, TAU), '#7ac0d8', LW);
    onPlane(g, I, 'z', 46, (gg) => { for (const r of [60, 100, 140]) { gg.moveTo(1750 + r, 1700); gg.ellipse(1750, 1700, r, r, 0, 0, TAU); } }); g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 1.2; g.stroke();
    box(g, I, 1730, 1680, 46, 40, 40, 90, { top: '#e9dfc6', left: '#f4ecd6', right: '#d8cbb0', lw: LW });
    const [jx, jy] = I.p(1750, 1700, 136);
    g.save(); g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 2.4; for (let k = 0; k < 8; k++) { const a = (k / 8) * TAU; g.beginPath(); g.moveTo(jx, jy); g.quadraticCurveTo(jx + Math.cos(a) * 40, jy - 60, jx + Math.cos(a) * 70, jy + 30 + Math.sin(a) * 22); g.stroke(); } g.restore();
  });
  // on the fountain rim
  person(1890, 1860, 50, { face: '+x', turn: 0.6, look: look(621, { fem: true, skin: SKIN[0], hair: HAIR.ginger, style: 'ponytail', topKind: 'tee', top: C.teal, bottom: C.denim, bottomKind: 'shorts' }), pose: POSES.sitPhone, who: ['Sadie, 18', 'Week three. Just found out the dining hall has a waffle machine. Telling everyone.'] });
  person(1600, 1880, 50, { face: '+y', turn: 0.55, look: look(622, { fem: false, skin: SKIN[3], hair: HAIR.black, style: 'side', topKind: 'tee', top: C.lav, bottom: C.char, glasses: true }), pose: POSES.sitRead, hold: (gg: G, J: Joints) => { const cx = (J.hN[0] + J.hF[0]) / 2, cy = (J.hN[1] + J.hF[1]) / 2 - 5; gg.beginPath(); gg.rect(cx - 10, cy - 7, 20, 13); inkFill(gg, C.navy, LW); }, who: ['Arjun, 24', 'PhD in astrophysics. Reading a romance novel. It is research, he says, about gravity.'] });

  /* ── the graduate, posing ── */
  person(2160, 1960, 0, { face: '+y', turn: 0.3, look: look(631, { fem: true, skin: SKIN[5], hair: HAIR.black, style: 'braids', topKind: 'coat', top: '#2a2a50', bottom: '#2a2a50', shoes: C.red, hat: { kind: 'mortar', color: '#2a2a50', tassel: C.mustard }, scarf: C.mustard }), pose: { ...POSES.wave, armF: [150, 175] }, mood: 'open', who: ['Keisha, 22', 'Nursing, summer graduate, first in her family with a degree. Back for photos by the fountain where she cried in sophomore year.'] });
  person(2160, 2260, 0, { face: '-y', turn: 0.35, look: look(632, { fem: true, age: 'old', skin: SKIN[5], hair: HAIR.grey, style: 'short', topKind: 'blouse', top: C.mustard, bottom: C.navy, bottomKind: 'skirt', glasses: true }), pose: { ...POSES.phone, armN: [70, 150], head: 0 }, hold: (gg: G, J: Joints) => { const [x, y] = J.hN; gg.beginPath(); gg.roundRect(x - 6, y - 12, 12, 16, 2); inkFill(gg, C.char, LW); }, who: ['Lorraine, 61', 'Keisha’s mother. Cleaned this building for nine years. Has taken two hundred and eleven photos this afternoon and will take more.'] });
  person(2290, 2230, 0, { face: '-y', turn: 0.4, look: look(633, { fem: false, age: 'kid', skin: SKIN[5], hair: HAIR.black, style: 'short', topKind: 'shirt', top: C.white, accent: C.red, bottom: C.navy }), pose: POSES.hips, mood: 'flat', who: ['Jaylen, 9', 'Keisha’s brother, in a clip-on tie. Has been asked to smile forty times and is saving it for the last photo.'] });

  /* ── frisbee on the lawn ── */
  person(2300, 1150, 0, { face: '-x', turn: 0.5, look: look(641, { fem: false, skin: SKIN[0], hair: HAIR.blond, style: 'short', topKind: 'tank', top: C.red, bottom: C.navy, bottomKind: 'shorts' }), pose: { ...POSES.run, armF: [120, 140] }, who: ['Tyler, 20', 'Ultimate frisbee captain. Majoring in accounting, though nobody on the team believes it.'] });
  person(2750, 1000, 0, { face: '-x', turn: 0.5, look: look(642, { fem: true, skin: SKIN[2], hair: HAIR.black, style: 'ponytail', topKind: 'tee', top: C.white, bottom: C.navy, bottomKind: 'shorts', hat: { kind: 'cap', color: C.navy } }), pose: { ...POSES.point, armF: [70, 70], lean: 10 }, who: ['Camila, 21', 'Threw the frisbee. Is about to say, quietly, that she meant to throw it there.'] });
  sc.add(I.depth(2500, 1060), () => { const [fx, fy] = I.p(2500, 1060, 220); ellipse(g, fx, fy, 16, 6, -0.2, C.butter, LW); });
  sc.add(I.depth(2420, 1250), () => { const [x, y] = I.p(2420, 1250, 0); dog(g, x, y - 26, I.zs * 0.85, -1, '#9a5b34', LW, { tail: 14 }); });
  for (const [x, y] of [[2300, 1150], [2750, 1000], [2420, 1250]]) sc.add(1, () => shadowAt(x, y));

  /* ── reading on a blanket ── */
  sc.add(I.depth(1150, 2150) - 600, () => { plane(g, I, 'z', 0, (gg) => gg.rect(980, 2050, 280, 220), '#e3584a', LW); onPlane(g, I, 'z', 0, (gg) => { for (let k = 1; k < 7; k++) { gg.moveTo(980 + k * 40, 2050); gg.lineTo(980 + k * 40, 2270); gg.moveTo(980, 2050 + k * 32); gg.lineTo(1260, 2050 + k * 32); } }); g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 1.6; g.stroke(); openBook(g, I, 1180, 2100, 1, LW); });
  person(1060, 2160, 0, { face: '+x', turn: 0.55, look: look(651, { fem: true, skin: SKIN[1], hair: HAIR.black, style: 'bob', topKind: 'sweater', top: C.lav, bottom: C.denim }), pose: { ...POSES.floorLegs, armN: [20, 60], armF: [40, 100] }, hold: (gg: G, J: Joints) => { const [x, y] = J.hF; gg.beginPath(); gg.rect(x - 6, y - 14, 14, 18); inkFill(gg, C.green, LW); }, mood: 'smile', who: ['Mei, 20', 'Comparative literature. Reading Toni Morrison aloud to Sam, who says he is listening.'] });
  person(1150, 2200, 0, { face: '+y', turn: 0.4, rot: -1.45, look: look(652, { fem: false, skin: SKIN[3], hair: HAIR.dark, style: 'curly', topKind: 'tee', top: C.olive, bottom: C.khaki }), pose: { ...POSES.stand, armN: [170, 150], armF: [175, 160] }, eyes: 'closed', mood: 'smile', who: ['Sam, 20', 'Is listening. With his eyes closed. Mostly.'] });

  /* ── the study group on the grass ── */
  sc.add(I.depth(2500, 2200) - 30, () => { laptop(g, I, 2500, 2180, 0, LW, '+y', C.ash); laptop(g, I, 2620, 2270, 0, LW, '+x', C.char); for (let k = 0; k < 3; k++) { const [x, y] = I.p(2560 + k * 20, 2250, 0); g.beginPath(); g.rect(x - 8, y - 4, 16, 10); inkFill(g, C.white, LW * 0.6); } });
  person(2440, 2130, 0, { face: '+y', turn: 0.5, look: look(661, { fem: true, skin: SKIN[2], style: 'hijab', hijab: C.coral, hair: C.coral, topKind: 'tee', top: C.white, bottom: C.denim, bottomKind: 'longskirt' }), pose: POSES.floorCross, who: ['Amira, 21', 'Civil engineering, team lead. Bridges, specifically. Has opinions about the one on Route 9.'] });
  person(2580, 2130, 0, { face: '+y', turn: 0.5, look: look(662, { fem: false, skin: SKIN[0], hair: HAIR.brown, style: 'short', topKind: 'hoodie', top: C.forest, bottom: C.char, glasses: true }), pose: POSES.floorCross, eyes: 'down', who: ['Owen, 22', 'Does the calculations. Does them twice. Does them a third time when Amira asks.'] });
  person(2700, 2270, 0, { face: '-x', turn: 0.5, look: look(663, { fem: true, skin: SKIN[6], hair: HAIR.black, style: 'afro', topKind: 'tee', top: C.mustard, bottom: C.denim }), pose: POSES.floorLegs, mood: 'open', who: ['Grace, 21', 'Brought the snacks. Is the reason the group is still a group.'] });

  /* ── the campus tour, walking backwards ── */
  person(1200, 1700, 0, { face: '-x', turn: 0.5, look: look(671, { fem: true, skin: SKIN[3], hair: HAIR.black, style: 'ponytail', topKind: 'tee', top: C.red, bottom: C.khaki }), pose: { ...POSES.point, armF: [140, 160] }, mood: 'open', who: ['Rosa, 20', 'Tour guide, walking backwards for three miles a day. Has never once tripped, and knows the name of every squirrel.'] });
  const tour: [number, number, Partial<Look>, string, string][] = [
    [1000, 1640, { fem: false, age: 'teen', skin: SKIN[1], hair: HAIR.black, style: 'short', topKind: 'tee', top: C.navy, bottom: C.khaki }, 'Hyun-woo, 17', 'From Fort Lee. Wants to study film; is counting the vending machines.'],
    [960, 1740, { fem: false, skin: SKIN[1], hair: HAIR.black, style: 'balding', topKind: 'shirt', top: C.white, bottom: C.khaki, glasses: true }, 'Mr. Park, 50', 'Hyun-woo’s father. Asking about the computer science department. Hyun-woo wishes he would stop asking about the computer science department.'],
    [880, 1660, { fem: true, age: 'teen', skin: SKIN[5], hair: HAIR.black, style: 'long', topKind: 'tee', top: C.pink, bottom: C.denim }, 'Destiny, 17', 'From a town of eleven hundred in Mississippi. Has never seen a building this old or this many people under thirty.'],
    [840, 1770, { fem: true, skin: SKIN[5], hair: HAIR.black, style: 'short', topKind: 'blouse', top: C.teal, bottom: C.navy, bottomKind: 'skirt' }, 'Ms. Harris, 46', 'Destiny’s mom. Drove nine hours. Has a folder of every scholarship form, tabbed.'],
  ];
  for (const [x, y, lk, n, l] of tour) person(x, y, 0, { face: '+x', turn: 0.5, look: look(680 + x, lk), pose: POSES.walk, who: [n, l] });
  for (const [x, y] of [[1200, 1700], ...tour.map((t) => [t[0], t[1]])]) sc.add(1, () => shadowAt(x as number, y as number, 22));

  /* ── the club tables below the library steps ── */
  const clubTable = (x: number, y: number, cloth: string, sign: string) => {
    sc.add(I.depth(x + 90, y + 40), () => {
      table(g, I, x, y, 180, 70, 74, cloth, LW);
      plane(g, I, 'y', y + 70, (gg) => gg.rect(x, 20, 180, 54), cloth, LW);
      box(g, I, x + 30, y + 10, 74, 120, 6, 60, { top: C.white, left: C.white, right: '#e9e6dd', lw: LW });
      wallText(g, I, 'y', y + 16, x + 90, 110, sign, 17, `bold ${SANS}`, INK);
      for (let k = 0; k < 4; k++) { const [px, py] = I.p(x + 20 + k * 40, y + 50, 74); g.beginPath(); g.rect(px - 6, py - 5, 12, 8); inkFill(g, C.white, LW * 0.6); }
    });
  };
  clubTable(1460, 700, '#3b7dd8', 'REGISTER TO VOTE');
  clubTable(1860, 700, '#e3b23c', 'ROBOTICS CLUB');
  person(1550, 650, 0, { face: '+y', turn: 0.35, look: look(691, { fem: true, skin: SKIN[0], hair: HAIR.brown, style: 'bun', topKind: 'tee', top: C.white, bottom: C.denim, glasses: true }), pose: { ...POSES.point, armF: [80, 90] }, mood: 'open', who: ['Abby, 19', 'Has registered three hundred and twelve students since August. Her goal is a thousand by November.'] });
  person(1550, 860, 0, { face: '-y', turn: 0.4, look: look(692, { fem: false, skin: SKIN[4], hair: HAIR.black, style: 'buzz', topKind: 'tee', top: C.grey, bottom: C.khaki, bag: { kind: 'backpack', color: C.red } }), pose: POSES.cook, who: ['Jamal, 18', 'Signing up to vote for the first time. Asks if he can do it again in four years. He can.'] });
  person(1950, 650, 0, { face: '+y', turn: 0.35, look: look(693, { fem: false, skin: SKIN[2], hair: HAIR.black, style: 'curly', topKind: 'hoodie', top: C.orange, bottom: C.char, glasses: true }), pose: { ...POSES.cradle, head: 0 }, hold: (gg: G, J: Joints) => { const cx = (J.hN[0] + J.hF[0]) / 2, cy = (J.hN[1] + J.hF[1]) / 2 - 6; gg.beginPath(); gg.rect(cx - 12, cy - 8, 24, 14); inkFill(gg, C.ash, LW); ellipse(gg, cx - 7, cy + 8, 4, 4, 0, C.char, LW); ellipse(gg, cx + 7, cy + 8, 4, 4, 0, C.char, LW); ellipse(gg, cx - 4, cy - 2, 2, 2, 0, C.red, 0); ellipse(gg, cx + 4, cy - 2, 2, 2, 0, C.red, 0); }, mood: 'open', who: ['Luis, 20', 'Built the robot. Named it Gerald. Gerald can climb stairs, slowly, and wave, quickly.'] });

  /* ── the taco truck on the right, its window toward us ── */
  sc.add(I.depth(2600, 1560), () => {
    const x0 = 2380, y0 = 1460, L = 400, Wd = 150, Hh = 230;
    box(g, I, x0, y0, 34, L, Wd, Hh, { top: C.white, left: '#f3dc8a', right: '#e3c060', lw: LW });
    box(g, I, x0 + L, y0 + 10, 34, 100, Wd - 20, 150, { top: C.white, left: '#f3dc8a', right: '#e3c060', lw: LW });
    plane(g, I, 'x', x0 + L + 100, (gg) => gg.rect(y0 + 22, 110, Wd - 44, 60), '#a9cfe0', LW);
    // the window and Don Ramón inside it
    const yw = y0 + Wd;
    onPlane(g, I, 'y', yw, (gg) => gg.rect(x0 + 60, 110, 240, 100)); g.save(); g.clip(); g.fillStyle = '#3a3a40'; g.fillRect(0, 0, W, H);
    const s2 = new Scene(g); ip(s2, I, who, x0 + 180, y0 + Wd - 10, 22, { face: '+y', turn: 0.35, look: look(701, { fem: false, skin: SKIN[3], hair: HAIR.black, style: 'short', topKind: 'tee', top: C.white, bottom: C.navy, apron: '#f4ecd6', beard: 'mustache', hat: { kind: 'cap', color: C.red } }), pose: { ...POSES.point, armF: [80, 100], armN: [10, 10] }, mood: 'smile', hold: (gg: G, J: Joints) => { const [x, y] = J.hF; gg.beginPath(); gg.ellipse(x + 8, y, 12, 6, 0, 0, TAU); inkFill(gg, '#e0c08a', LW); }, who: ['Don Ramón, 57', 'Twenty years on this corner. Feeds students on credit in the last week of every semester and writes their names in a notebook. Nobody has ever not paid.'] }); s2.draw();
    g.restore();
    plane(g, I, 'y', yw, (gg) => gg.rect(x0 + 60, 110, 240, 100), null, LW);
    plane(g, I, 'y', yw, (gg) => gg.rect(x0 + 50, 100, 260, 12), C.white, LW);
    // the awning, propped out over the window
    const a1 = I.p(x0 + 50, yw, 215), a2 = I.p(x0 + 310, yw, 215), a3 = I.p(x0 + 310, yw + 60, 250), a4 = I.p(x0 + 50, yw + 60, 250);
    g.beginPath(); g.moveTo(...a1); g.lineTo(...a2); g.lineTo(...a3); g.lineTo(...a4); g.closePath(); inkFill(g, '#d9493f', LW);
    wallText(g, I, 'y', yw, x0 + 180, 238, 'TACOS EL GÜERO', 26, `bold ${SANS}`, '#d9493f');
    for (const x of [x0 + 70, x0 + 330]) { onPlane(g, I, 'y', yw + 1, (gg) => gg.ellipse(x, 30, 32, 32, 0, 0, TAU)); inkFill(g, C.char, LW); onPlane(g, I, 'y', yw + 1, (gg) => gg.ellipse(x, 30, 12, 12, 0, 0, TAU)); inkFill(g, C.ash, LW * 0.7); }
    onPlane(g, I, 'x', x0 + L + 101, (gg) => gg.ellipse(y0 + Wd - 30, 30, 30, 30, 0, 0, TAU)); inkFill(g, C.char, LW);
  });
  const line: [number, number, Partial<Look>, string, string][] = [
    [2540, 1720, { fem: false, skin: SKIN[0], hair: HAIR.ginger, style: 'curly', topKind: 'hoodie', top: C.green, bottom: C.denim }, 'Connor, 19', 'Third time this week. Al pastor, always.'],
    [2420, 1780, { fem: true, skin: SKIN[2], hair: HAIR.black, style: 'braids', topKind: 'tee', top: C.coral, bottom: C.khaki }, 'Valentina, 20', 'Orders for the whole study group, from memory.'],
    [2300, 1840, { fem: false, skin: SKIN[1], hair: HAIR.grey, style: 'side', topKind: 'jacket', top: C.brown, inner: C.white, bottom: C.khaki, glasses: true, beard: true }, 'Professor Novak, 64', 'Teaches medieval history. Has eaten here every Tuesday since 2006 and calls it field work.'],
  ];
  for (const [x, y, lk, n, l] of line) person(x, y, 0, { face: '-y', turn: 0.45, look: look(710 + x, lk), pose: POSES.stand, who: [n, l] });

  /* ── people crossing ── */
  person(1750, 1000, 0, { face: '+y', turn: 0.55, look: look(721, { fem: false, skin: SKIN[5], hair: HAIR.black, style: 'buzz', topKind: 'tee', top: C.mustard, bottom: C.char, bag: { kind: 'backpack', color: C.navy } }), pose: { ...POSES.walk, armN: [-60, -20] }, rot: 0, who: ['Trey, 20', 'Skateboards from the dorms to every class. Late to this one anyway.'], over: (gg: G, J: Joints) => { const [x, y] = J.aN; gg.beginPath(); gg.roundRect(x - 26, y + 4, 60, 7, 3); inkFill(gg, C.red, LW); ellipse(gg, x - 16, y + 13, 3.5, 3.5, 0, C.white, LW * 0.7); ellipse(gg, x + 24, y + 13, 3.5, 3.5, 0, C.white, LW * 0.7); } });
  person(2300, 1700, 0, { face: '-x', turn: 0.5, look: look(722, { fem: true, skin: SKIN[1], hair: HAIR.black, style: 'long', topKind: 'jacket', top: C.navy, inner: C.white, bottom: C.black, bottomKind: 'pants' }), pose: POSES.stride, hold: (gg: G, J: Joints) => { const [x, y] = J.hF; gg.beginPath(); gg.rect(x - 3, y - 2, 18, 14); inkFill(gg, '#7a4a2a', LW); }, who: ['Dr. Okonkwo, 43', 'Professor of chemical engineering. Late for her own lecture by four minutes. Will walk in and say, “Well. Thermodynamics.”'] });
  sc.add(I.depth(1760, 2400), () => {
    const x = 1760, y = 2400;
    const wheel = (yy: number) => { onPlane(g, I, 'y', yy, (gg) => gg.ellipse(x, 30, 30, 30, 0, 0, TAU)); g.lineWidth = LW * 3.2; g.strokeStyle = INK; g.stroke(); g.lineWidth = LW * 1.4; g.strokeStyle = C.slate; g.stroke(); onPlane(g, I, 'y', yy, (gg) => { for (let a = 0; a < 6; a++) { gg.moveTo(x, 30); gg.lineTo(x + Math.cos(a) * 28, 30 + Math.sin(a) * 28); } }); g.strokeStyle = 'rgba(31,26,23,0.5)'; g.lineWidth = 0.8; g.stroke(); };
    wheel(y - 24);
    box(g, I, x - 22, y - 22, 42, 44, 44, 5, { top: C.char, left: C.black, right: C.black, lw: LW });
    box(g, I, x - 24, y - 22, 42, 4, 44, 46, { top: C.char, left: C.black, right: C.char, lw: LW });
    const s2 = new Scene(g); ip(s2, I, who, x, y, 46, { face: '+x', turn: 0.62, look: look(723, { fem: false, skin: SKIN[0], hair: HAIR.brown, style: 'short', topKind: 'tee', top: C.sky, bottom: C.khaki, bag: { kind: 'backpack', color: C.forest } }), pose: { ...POSES.sit, armN: [20, 60], armF: [30, 70] }, mood: 'smile', who: ['Ben, 23', 'Army veteran, two tours, now studying to be a physical therapist. His wheelchair is faster than anyone\u2019s legs on this path and he knows it.'] }); s2.draw();
    wheel(y + 24);
  });
  for (const [x, y] of [[1750, 1000], [2300, 1700], ...line.map((l) => [l[0], l[1]])]) sc.add(1, () => shadowAt(x as number, y as number, 22));

  /* ── benches ── */
  sc.add(I.depth(2050, 1250), () => bench(g, I, 2000, 1200, 'x', LW));
  person(2080, 1245, 42, { face: '+y', turn: 0.5, look: look(731, { fem: false, age: 'old', skin: SKIN[6], hair: HAIR.white, style: 'balding', topKind: 'shirt', top: C.sky, accent: C.white, bottom: C.khaki, hat: { kind: 'cap', color: C.navy } }), pose: POSES.sitBack, mood: 'smile', who: ['Mr. Washington, 79', 'Groundskeeper here for forty-one years, retired in 2014. Comes back to sit on this bench and check the oak.'] });

  /* ── the trees ── */
  for (const [x, y, h, r, s2] of trees.slice(1)) sc.add(I.depth(x, y), () => isoTree(g, I, x, y, h, r, LW, s2));

  sc.draw();

  // the title, in a band of sky-less paper at the top right
  g.beginPath(); g.rect(50, 1390, 830, 150); inkFill(g, '#fbf6e6', LW * 1.4);
  g.fillStyle = '#1f3a26'; g.textAlign = 'left';
  g.font = `600 60px "Cinzel", ${SERIF}`; g.fillText('The Quad', 82, 1462);
  g.font = `italic 29px ${SERIF}`; g.fillText('A state university, the third week of September, 2:40 p.m.', 84, 1508);
  grain(g, W, H, 0.12, 21);
  void chair; void pick; void rng; void shade; void ln;
}

/** a guitar held by someone sitting, small enough for the quad */
function guitarIso(g: G, J: Joints) {
  const s = J.s, bx = (J.P[0] + J.hN[0]) / 2 + 4 * s * J.fwd, by = J.P[1] - 6 * s;
  g.save(); g.translate(bx, by); g.rotate(J.fwd * -0.45);
  g.beginPath(); g.ellipse(-6 * s, 2 * s, 9 * s, 7.5 * s, 0, 0, TAU); g.ellipse(4 * s, 0, 6.5 * s, 5.5 * s, 0, 0, TAU); inkFill(g, '#d9893a', 1.5);
  ellipse(g, -1 * s, 1 * s, 2.2 * s, 2.2 * s, 0, INK, 0);
  g.beginPath(); g.rect(8 * s, -1.4 * s, 26 * s, 2.8 * s); inkFill(g, C.chocolate, 1.5);
  g.restore();
}

export const QUAD: Plate = {
  key: 'quad', title: 'The Quad', place: 'A state university',
  blurb: 'A campus on a September afternoon: the brick hall and the library steps, the oak, the fountain, frisbee, a campus tour walking backwards, club tables, a taco truck, and a graduate back for photos with her mother.',
  w: W, h: H, paint,
};
export type { Pt };
