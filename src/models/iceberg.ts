/**
 * The Iceberg — after Virginia Satir's iceberg (The Satir Model, 1991):
 * what someone does is the small part above the water; beneath it, in
 * layers, how they cope, what they feel, what they feel about feeling it,
 * what they believe, what they expect, what they long for, and the self.
 */
import { type G, C, HAIR, SKIN, INK, inkFill, ellipse, ln, rng, mix, shade, grain, TAU, type Pt } from '../walks/kit';
import { POSES, randomLook, person, type Look } from '../walks/people';
import { type Plate, type Who } from '../walks/stage';
import { W, H, titlePanel, keyPanel, badge, bubble, CINZEL } from './note';
import { SERIF } from '../walks/kit';

const look = (seed: number, o: Partial<Look>) => randomLook(seed, o);
const SEA = 540, LW = 2.4;

const NOTES = [
  { n: 1, title: 'Behaviour', gloss: 'What we see: the words, the tone, the slammed door.', line: 'The only part anyone else can see: what he said in the meeting and how he said it. It is real, and it is small. Satir began here and then asked what was underneath it.' },
  { n: 2, title: 'Coping', gloss: 'The stance we fall into under stress.', line: 'Satir named four stances people take when they feel threatened: placating (I don’t matter), blaming (you don’t matter), super-reasonable (feelings don’t matter) and irrelevant (nothing here matters). Her aim was a fifth, congruent, where words and feelings agree.' },
  { n: 3, title: 'Feelings', gloss: 'Anger, hurt, fear, the weather inside.', line: 'Beneath the stance is the weather: anger on the surface, often hurt or fear underneath it.' },
  { n: 4, title: 'Feelings about feelings', gloss: 'Ashamed of being angry; afraid of being afraid.', line: 'We have feelings about our feelings: shame at being angry, fear of being sad. Satir thought this layer often decides whether a feeling gets shown or hidden.' },
  { n: 5, title: 'Perceptions', gloss: 'Beliefs and the story we tell about what happened.', line: 'The lens: beliefs, assumptions and the story told about the event. "They think I’m not good enough" is a perception, and it can be checked.' },
  { n: 6, title: 'Expectations', gloss: 'Of ourselves, of others, and theirs of us.', line: 'What we expect of ourselves, of others, and what we think others expect of us, often formed long ago and never said out loud.' },
  { n: 7, title: 'Yearnings', gloss: 'To be loved, accepted, respected, free.', line: 'The universal longings beneath the expectations: to be loved, accepted, valued, to belong and to be free. Satir saw these as shared by everyone.' },
  { n: 8, title: 'Self', gloss: 'The core: the “I am”, the life force.', line: 'At the bottom Satir placed the Self: the life force, the essence, the "I am". In her model, change that reaches this level changes everything above it.' },
];
const BANDS: [number, number][] = [[560, 700], [700, 830], [830, 950], [950, 1080], [1080, 1210], [1210, 1360], [1360, 1620]];

/** the iceberg's left and right edges at depth y */
function edges(): [Pt[], Pt[]] {
  const R = rng(3);
  const L: [number, number][] = [[1000, 300], [960, 330], [935, 410], [890, 470], [860, 540], [760, 610], [690, 720], [600, 840], [560, 960], [500, 1080], [470, 1200], [430, 1330], [400, 1460], [380, 1620]];
  const Rt: [number, number][] = [[1170, 300], [1200, 350], [1240, 420], [1280, 480], [1310, 540], [1420, 620], [1500, 730], [1560, 860], [1610, 980], [1640, 1100], [1660, 1230], [1690, 1380], [1700, 1500], [1710, 1620]];
  const j = (p: [number, number]): Pt => [p[0] + (R() - 0.5) * 24, p[1]];
  return [L.map(j), Rt.map(j)];
}

function paint(g: G, who: Who[]) {
  /* sky and sea */
  const sky = g.createLinearGradient(0, 0, 0, SEA); sky.addColorStop(0, '#f3d9b8'); sky.addColorStop(1, '#f8ecd8');
  g.fillStyle = sky; g.fillRect(0, 0, W, SEA);
  ellipse(g, 1900, 200, 80, 80, 0, '#fbe3a8', 0);
  for (const [x, y, w] of [[1500, 120, 220], [2050, 330, 180], [300, 420, 160]]) { g.fillStyle = 'rgba(255,250,240,0.85)'; g.beginPath(); g.roundRect(x, y, w, 24, 12); g.fill(); g.beginPath(); g.roundRect(x + w * 0.2, y - 14, w * 0.5, 24, 12); g.fill(); }
  const sea = g.createLinearGradient(0, SEA, 0, H); sea.addColorStop(0, '#6fb8c8'); sea.addColorStop(0.35, '#2f7690'); sea.addColorStop(1, '#0e2c44');
  g.fillStyle = sea; g.fillRect(0, SEA, W, H - SEA);
  // light rays
  g.save(); g.globalCompositeOperation = 'screen'; g.fillStyle = 'rgba(160,220,230,0.08)';
  for (const x of [200, 520, 1500, 1900, 2250]) { g.beginPath(); g.moveTo(x, SEA); g.lineTo(x + 90, SEA); g.lineTo(x - 160, H); g.lineTo(x - 320, H); g.closePath(); g.fill(); }
  g.restore();

  /* the iceberg */
  const [L, Rt] = edges();
  const outline = () => { g.beginPath(); g.moveTo(...L[0]); for (const p of L) g.lineTo(...p); for (let i = Rt.length - 1; i >= 0; i--) g.lineTo(...Rt[i]); g.closePath(); };
  // underwater: banded, darker with depth
  g.save(); outline(); g.clip();
  g.fillStyle = '#f4fbfd'; g.fillRect(0, 0, W, SEA);
  g.fillStyle = 'rgba(200,225,235,0.9)'; g.beginPath(); g.moveTo(1085, 300); g.lineTo(1310, 540); g.lineTo(1090, 540); g.closePath(); g.fill();
  BANDS.forEach(([y0, y1], i) => {
    const t = i / (BANDS.length - 1);
    g.fillStyle = i === BANDS.length - 1 ? '#2a3f5a' : mix('#bfe2ec', '#3d6a88', t); g.fillRect(0, y0 - 20, W, y1 - y0 + 20);
    // the boundary, a little irregular
    const R = rng(i + 7); g.beginPath(); g.moveTo(0, y0); for (let x = 0; x <= W; x += 60) g.lineTo(x, y0 + (R() - 0.5) * 10); g.lineTo(W, y0 - 40); g.lineTo(0, y0 - 40); g.closePath();
    g.fillStyle = i === 0 ? '#d8eef4' : (i === BANDS.length - 1 ? mix('#bfe2ec', '#3d6a88', 1) : mix('#bfe2ec', '#3d6a88', (i - 1) / (BANDS.length - 1))); g.fill();
  });
  // redraw bands with crisp wavy tops
  BANDS.forEach(([y0, y1], i) => {
    const t = i / (BANDS.length - 1), col = i === BANDS.length - 1 ? '#2b4562' : mix('#c9e8f0', '#3d6a88', t);
    const R = rng(i + 7); g.beginPath(); g.moveTo(0, y0); for (let x = 0; x <= W; x += 60) g.lineTo(x, y0 + (R() - 0.5) * 12); g.lineTo(W, y1); g.lineTo(0, y1); g.closePath(); g.fillStyle = col; g.fill();
    g.beginPath(); const R2 = rng(i + 7); g.moveTo(0, y0); for (let x = 0; x <= W; x += 60) g.lineTo(x, y0 + (R2() - 0.5) * 12); g.lineWidth = 2; g.strokeStyle = 'rgba(20,40,60,0.45)'; g.stroke();
  });
  // facets
  const Rf = rng(11); g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 2;
  for (let i = 0; i < 26; i++) { const y = 580 + Rf() * 980, x = 500 + Rf() * 1100; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 40 + Rf() * 60, y + 30 + Rf() * 50); g.stroke(); }
  // the self glows at the core
  const glow = g.createRadialGradient(1060, 1500, 10, 1060, 1500, 300); glow.addColorStop(0, 'rgba(255,214,120,0.95)'); glow.addColorStop(0.4, 'rgba(255,190,90,0.45)'); glow.addColorStop(1, 'rgba(255,190,90,0)');
  g.fillStyle = glow; g.fillRect(700, 1250, 760, 400);
  g.restore();
  outline(); g.lineWidth = LW * 1.3; g.strokeStyle = INK; g.stroke();
  // the waterline across the ice, and ripples
  g.save(); outline(); g.clip(); g.fillStyle = 'rgba(111,184,200,0.25)'; g.fillRect(0, SEA, W, H); g.restore();
  g.strokeStyle = '#fbfaf5'; g.lineWidth = 3; for (let x = 0; x < W; x += 70) { g.beginPath(); g.moveTo(x, SEA + 4 + (x % 140 ? 6 : 0)); g.quadraticCurveTo(x + 18, SEA - 2, x + 36, SEA + 4 + (x % 140 ? 6 : 0)); g.stroke(); }
  ln(g, 0, SEA, W, SEA, 2, 'rgba(31,26,23,0.5)');

  /* 1 · behaviour: on the tip */
  const J = person(g, { x: 1085, y: 302, s: 2.6, turn: 0.45, look: look(2001, { fem: false, skin: SKIN[2], hair: HAIR.dark, style: 'short', topKind: 'shirt', top: C.sky, accent: C.white, bottom: C.navy, shoes: C.brown }), pose: { ...POSES.hips, head: -4 }, face: 'frown', lw: LW });
  bubble(g, 1180, 90, 300, '“Fine. Whatever. Do it your way.”', J.H[0] + 24, J.H[1] + 4, { size: 26 });
  // the colleague in a little boat, who only sees the tip
  {
    const bx = 520, by = SEA + 8;
    g.beginPath(); g.moveTo(bx - 120, by - 30); g.lineTo(bx + 130, by - 30); g.quadraticCurveTo(bx + 120, by + 20, bx + 80, by + 22); g.lineTo(bx - 90, by + 22); g.quadraticCurveTo(bx - 120, by + 10, bx - 120, by - 30); inkFill(g, '#e3584a', LW);
    ln(g, bx - 110, by - 18, bx + 124, by - 18, 2, '#fbfaf5');
    person(g, { x: bx + 10, y: by - 30, s: 2.2, turn: 0.55, look: look(2002, { fem: true, skin: SKIN[0], hair: HAIR.auburn, style: 'bob', topKind: 'jacket', top: C.mustard, inner: C.white, bottom: C.denim }), pose: { ...POSES.sit, armN: [40, 100], armF: [30, 90] }, face: 'flat', lw: LW, anchor: 'seat' });
    bubble(g, 220, 300, 330, 'What’s his problem?', bx + 30, by - 150, { thought: true, size: 26 });
  }
  /* 2 · coping stances, four small figures across the band */
  const stance = (x: number, y: number, pose: Parameters<typeof person>[1]['pose'], label: string, seed: number, face: 'smile' | 'frown' | 'flat' | 'open') => {
    person(g, { x, y, s: 1.05, turn: 0.4, look: look(seed, { fem: seed % 2 === 0, skin: SKIN[2], hair: HAIR.dark, style: seed % 2 ? 'short' : 'bob', topKind: 'shirt', top: C.sky, bottom: C.navy }), pose, face, lw: 1.6 });
    g.fillStyle = '#18324a'; g.font = `italic 21px ${SERIF}`; g.textAlign = 'center'; g.fillText(label, x, y + 22); g.textAlign = 'left';
  };
  stance(820, 670, { ...POSES.kneel, armN: [150, 160], armF: [140, 160] }, 'placating', 2011, 'open');
  stance(990, 670, { ...POSES.point, armF: [90, 92], lean: 8 }, 'blaming', 2012, 'frown');
  stance(1160, 670, { ...POSES.standFront, armN: [40, -40], armF: [-40, 40] }, 'super-reasonable', 2013, 'flat');
  stance(1340, 670, { ...POSES.run, armN: [-60, 60], armF: [120, 160] }, 'irrelevant', 2014, 'open');
  /* 3 · feelings: weather */
  const cloud = (x: number, y: number, s: number, col: string) => { g.beginPath(); for (const [dx, dy, r] of [[-30, 6, 24], [0, -8, 30], [32, 4, 24], [10, 12, 22], [-12, 14, 20]]) { g.moveTo(x + dx * s + r * s, y + dy * s); g.arc(x + dx * s, y + dy * s, r * s, 0, TAU); } g.lineWidth = LW * 2; g.strokeStyle = INK; g.stroke(); g.fillStyle = col; g.fill(); };
  cloud(860, 748, 1.1, '#5c6670'); g.beginPath(); g.moveTo(866, 772); g.lineTo(854, 790); g.lineTo(868, 788); g.lineTo(858, 806); g.lineWidth = 4; g.strokeStyle = '#ffd25a'; g.stroke();
  cloud(1100, 748, 1.1, '#8aa2b8'); for (let k = 0; k < 6; k++) ln(g, 1076 + k * 10, 774, 1072 + k * 10, 792, 3, '#cfe8f4');
  cloud(1340, 748, 1.0, '#a8b4c4');
  g.fillStyle = '#122a40'; g.font = `italic 21px ${SERIF}`; g.textAlign = 'center'; g.fillText('anger', 960, 790); g.fillText('hurt', 1200, 790); g.fillText('fear', 1430, 790); g.textAlign = 'left';
  /* 4 · feelings about feelings: hiding the face */
  person(g, { x: 1000, y: 940, s: 1.0, turn: 0.4, look: look(2020, { fem: false, skin: SKIN[2], hair: HAIR.dark, style: 'short', topKind: 'shirt', top: C.sky, bottom: C.navy }), pose: { ...POSES.kneel, lean: 18, head: 34, armN: [60, 168], armF: [70, 172] }, eyes: 'closed', face: 'frown', lw: 1.6 });
  cloud(1180, 880, 0.55, '#5c6670');
  g.fillStyle = '#eaf6fa'; g.font = `italic 24px ${SERIF}`; g.fillText('“I shouldn’t be this angry.”', 1100, 934);
  /* 5 · perceptions: the lens */
  {
    const cx = 1040, cy = 1015;
    g.lineWidth = 6; g.strokeStyle = INK; g.beginPath(); g.ellipse(cx - 60, cy, 46, 34, 0, 0, TAU); g.ellipse(cx + 60, cy, 46, 34, 0, 0, TAU); g.stroke();
    g.fillStyle = 'rgba(255,190,120,0.55)'; g.beginPath(); g.ellipse(cx - 60, cy, 44, 32, 0, 0, TAU); g.ellipse(cx + 60, cy, 44, 32, 0, 0, TAU); g.fill();
    ln(g, cx - 14, cy - 6, cx + 14, cy - 6, 6); ln(g, cx - 106, cy - 4, cx - 150, cy - 18, 6); ln(g, cx + 106, cy - 4, cx + 150, cy - 18, 6);
    g.fillStyle = '#eaf6fa'; g.font = `italic 24px ${SERIF}`; g.fillText('“They think I’m not good enough.”', cx + 170, cy + 8);
  }
  /* 6 · expectations: a clipboard */
  {
    const x = 980, y = 1100;
    g.beginPath(); g.roundRect(x, y, 120, 96, 6); inkFill(g, '#c9a070', LW); g.beginPath(); g.rect(x + 12, y + 14, 96, 76); inkFill(g, '#fbfaf5', 2);
    g.beginPath(); g.roundRect(x + 38, y - 8, 44, 18, 4); inkFill(g, '#9aa0a6', 2);
    for (let k = 0; k < 3; k++) { const yy = y + 30 + k * 22; g.beginPath(); g.rect(x + 22, yy - 9, 14, 14); g.lineWidth = 2; g.strokeStyle = INK; g.stroke(); ln(g, x + 44, yy - 2, x + 98, yy - 2, 2, 'rgba(31,26,23,0.45)'); if (k < 2) { g.beginPath(); g.moveTo(x + 23, yy - 3); g.lineTo(x + 29, yy + 3); g.lineTo(x + 40, yy - 14); g.lineWidth = 3; g.strokeStyle = '#2f8a4a'; g.stroke(); } else { ln(g, x + 23, yy - 9, x + 36, yy + 4, 3, '#d9493f'); ln(g, x + 36, yy - 9, x + 23, yy + 4, 3, '#d9493f'); } }
    g.fillStyle = '#eaf6fa'; g.font = `italic 24px ${SERIF}`; g.fillText('“A good colleague is always agreed with.”', x + 150, y + 56);
  }
  /* 7 · yearnings: two hands, almost touching */
  {
    const y = 1280;
    const hand = (x: number, dir: 1 | -1) => { g.save(); g.translate(x, y); g.scale(dir, 1); g.beginPath(); g.moveTo(-160, 18); g.lineTo(-40, 10); g.quadraticCurveTo(-10, 4, 10, -2); g.quadraticCurveTo(28, -8, 34, 0); g.quadraticCurveTo(30, 8, 12, 10); g.lineTo(-40, 26); g.lineTo(-160, 36); g.closePath(); inkFill(g, SKIN[dir > 0 ? 2 : 4], LW); g.beginPath(); g.moveTo(-160, 14); g.lineTo(-110, 10); g.lineTo(-110, 40); g.lineTo(-160, 40); g.closePath(); inkFill(g, dir > 0 ? C.sky : C.mustard, LW); g.restore(); };
    hand(1000, 1); hand(1140, -1);
    g.save(); g.globalCompositeOperation = 'screen'; const gl = g.createRadialGradient(1070, y + 2, 2, 1070, y + 2, 40); gl.addColorStop(0, 'rgba(255,230,160,0.9)'); gl.addColorStop(1, 'rgba(255,230,160,0)'); g.fillStyle = gl; g.fillRect(1020, y - 40, 100, 80); g.restore();
    g.fillStyle = '#eaf6fa'; g.font = `italic 24px ${SERIF}`; g.textAlign = 'center'; g.fillText('to be accepted · to be valued · to belong', 1070, y + 70); g.textAlign = 'left';
  }
  /* 8 · self: a child with a lantern, at the core */
  person(g, { x: 1060, y: 1540, s: 1.6, turn: 0.15, look: look(2030, { fem: false, age: 'kid', skin: SKIN[2], hair: HAIR.dark, style: 'short', topKind: 'tee', top: C.butter, bottom: C.navy }), pose: { ...POSES.floorCross }, face: 'smile', eyes: 'closed', lw: 2, anchor: 'seat', hold: (gg, Jj) => { const [x, y] = Jj.hF; gg.beginPath(); gg.roundRect(x - 10, y - 30, 20, 28, 4); inkFill(gg, '#ffe08a', 2); ln(gg, x, y - 30, x, y - 40, 2); } });
  g.fillStyle = '#ffe9b8'; g.font = `600 26px ${CINZEL}`; g.textAlign = 'center'; g.fillText('I AM', 1060, 1590); g.textAlign = 'left';

  /* two divers going down with torches */
  const diver = (x: number, y: number, rot: number, col: string, seed: number) => {
    g.save(); g.translate(x, y); g.rotate(rot);
    const Jd = person(g, { x: 0, y: 0, s: 1.4, turn: 0.95, look: look(seed, { fem: seed % 2 === 0, skin: SKIN[seed % 7], hair: HAIR.black, style: 'short', topKind: 'tee', top: '#26262b', sleeve: 'long', bottom: '#26262b', shoes: col }), pose: { ...POSES.run, armF: [100, 110], armN: [20, 40] }, face: 'flat', lw: 1.8 });
    g.beginPath(); g.roundRect(-30, -120, 18, 50, 8); inkFill(g, col, 1.8);
    g.restore();
    return Jd;
  };
  const D1 = diver(330, 1000, 0.5, '#ffd25a', 2041); diver(240, 1160, 0.6, '#e3584a', 2042);
  g.save(); g.globalCompositeOperation = 'screen'; g.fillStyle = 'rgba(255,240,180,0.22)'; g.beginPath(); g.moveTo(D1.hF[0], D1.hF[1]); g.lineTo(D1.hF[0] + 330, D1.hF[1] - 40); g.lineTo(D1.hF[0] + 330, D1.hF[1] + 140); g.closePath(); g.fill(); g.restore();
  const Rb = rng(5); for (let i = 0; i < 18; i++) { const x = 300 + Rb() * 60, y = 600 + Rb() * 380; g.beginPath(); g.arc(x, y, 3 + Rb() * 5, 0, TAU); g.lineWidth = 1.6; g.strokeStyle = 'rgba(230,248,255,0.8)'; g.stroke(); }

  /* badges */
  const B: [number, number][] = [[870, 400], [690, 640], [640, 770], [590, 890], [560, 1015], [520, 1145], [490, 1285], [450, 1440]];
  NOTES.forEach((n, i) => badge(g, who, B[i][0], B[i][1], n, i === 7 ? '#e3b23c' : '#d9493f'));

  titlePanel(g, { x: 50, y: 40, w: 760, title: 'The Iceberg', def: 'What a person does is the small part above the water. Most of what drives it is below, in layers.', credit: 'After Virginia Satir · The Satir Model, 1991' });
  keyPanel(g, 1760, 600, 590, NOTES);
  grain(g, W, H, 0.1, 4);
  void shade;
}

export const ICEBERG: Plate = {
  key: 'iceberg', title: 'The Iceberg', place: 'After Virginia Satir',
  blurb: 'Behaviour is the tip; beneath the water, layer by layer, coping stances, feelings, feelings about feelings, perceptions, expectations, yearnings, and at the core, the self.',
  w: W, h: H, paint,
};
