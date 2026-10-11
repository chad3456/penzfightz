/**
 * Circles of Control — the Stoics' oldest distinction (Epictetus: some
 * things are within our power, some are not), drawn as Stephen Covey's
 * circles of concern and influence: a woman tends the small garden that is
 * hers; around it, the neighbours, friends and team she can reach; and
 * outside that, the weather, the news, the economy and other people's
 * opinions, which she can only watch.
 */
import { type G, Iso, Scene, C, HAIR, SKIN, INK, box, plane, onPlane, inkFill, ln, ellipse, rng, pick, grain, SANS, SERIF, TAU, type Pt } from '../walks/kit';
import { POSES, randomLook, type Look, type Joints } from '../walks/people';
import { table, chair, laptop, plant, bench, isoTree, treeShadow, wallText, dog } from '../walks/props';
import { type Plate, type Who, ip, type IP } from '../walks/stage';
import { W, H, titlePanel, keyPanel, badge, bubble, CINZEL } from './note';

const look = (seed: number, o: Partial<Look>) => randomLook(seed, o);
const LW = 1.6, CX = 1500, CY = 1500, R1 = 330, R2 = 720, R3 = 1180;

const NOTES = [
  { n: 1, title: 'What I control', gloss: 'My effort, my words, my sleep, how I respond.', line: 'The inner garden: her own effort, what she says, whether she sleeps, how she answers. It is small, and it is the only part that is entirely hers. Epictetus opens his handbook with this distinction.' },
  { n: 2, title: 'What I can influence', gloss: 'Friends, neighbours, the team: reachable, not commandable.', line: 'The middle ring: people and things she can reach by asking, persuading, helping or setting an example, but cannot order. Covey called it the circle of influence.' },
  { n: 3, title: 'What I can only watch', gloss: 'The weather, the news, the economy, other people’s opinions.', line: 'The outer ring, Covey’s circle of concern: things that matter to her and that she cannot change by worrying about them: tomorrow’s weather, the market, a delayed flight, what two strangers are saying about her.' },
  { n: 4, title: 'Where the energy goes', gloss: 'Attention on the inside ring widens the middle one.', line: 'Covey’s observation: people who spend their energy on what they can affect find their influence growing; people who spend it on what they cannot find it shrinking. The gate between the rings swings both ways.' },
];

function sign(g: G, x: number, y: number, text: string, col = '#fbfaf5', size = 22) {
  g.font = `600 ${size}px ${CINZEL}`; const w = g.measureText(text).width + 26;
  ln(g, x, y, x, y - 46, 3.4); ln(g, x, y, x, y - 46, 1.6, '#9a6440');
  g.beginPath(); g.rect(x - w / 2 + 3, y - 46 - size - 14 + 3, w, size + 14); g.fillStyle = INK; g.fill();
  g.beginPath(); g.rect(x - w / 2, y - 46 - size - 14, w, size + 14); inkFill(g, col, 2);
  g.fillStyle = INK; g.textAlign = 'center'; g.fillText(text, x, y - 46 - 7); g.textAlign = 'left';
}

function paint(g: G, who: Who[]) {
  const I = new Iso(1240, -150, 0.62);
  const sc = new Scene(g);
  const P = (x: number, y: number, o: IP, z = 0) => ip(sc, I, who, x, y, z, o);
  const ring = (r: number) => (gg: G) => gg.ellipse(CX, CY, r, r, 0, 0, TAU);

  // the world beyond, and the three rings
  g.fillStyle = '#b9bcc4'; g.fillRect(0, 0, W, H);
  // the wide world beyond the rings: rooftops, faint
  { const Rr = rng(8); for (let i = 0; i < 90; i++) { const x = Rr() * 4000 - 600, y = Rr() * 4000 - 600; if (Math.hypot(x - CX, y - CY) < R3 + 80) continue; const w = 80 + Rr() * 120, d = 80 + Rr() * 120, h = 40 + Rr() * 160; sc.add(-1e6 + I.depth(x, y), () => box(g, I, x, y, 0, w, d, h, { top: '#a9adb6', left: '#c4c7ce', right: '#b2b5bd', lw: 1 })); } }
  plane(g, I, 'z', 0, ring(R3), '#d6d3cc', LW * 1.4);
  // streets in the outer ring
  onPlane(g, I, 'z', 0, (gg) => { gg.ellipse(CX, CY, R3 - 60, R3 - 60, 0, 0, TAU); gg.moveTo(CX + R2 + 110, CY); gg.ellipse(CX, CY, R2 + 110, R2 + 110, 0, 0, TAU); }); g.fillStyle = '#7d8088'; g.fill('evenodd');
  onPlane(g, I, 'z', 0, (gg) => { const r = (R3 + R2 + 50) / 2; for (let a = 0; a < TAU; a += 0.09) { gg.moveTo(CX + Math.cos(a) * r, CY + Math.sin(a) * r); gg.lineTo(CX + Math.cos(a + 0.04) * r, CY + Math.sin(a + 0.04) * r); } }); g.strokeStyle = '#f3dc8a'; g.lineWidth = 3; g.stroke();
  plane(g, I, 'z', 0, ring(R2), '#cfe0b8', LW * 1.4);
  // paving in the middle ring
  onPlane(g, I, 'z', 0, (gg) => { for (let r = R1 + 60; r < R2; r += 70) { gg.moveTo(CX + r, CY); gg.ellipse(CX, CY, r, r, 0, 0, TAU); } }); g.strokeStyle = 'rgba(80,100,60,0.18)'; g.lineWidth = 1.4; g.stroke();
  plane(g, I, 'z', 0, ring(R1), '#7a5236', LW * 1.4);
  // furrows in the garden
  g.save(); onPlane(g, I, 'z', 0, ring(R1 - 20)); g.clip(); onPlane(g, I, 'z', 0, (gg) => { for (let y = CY - R1; y < CY + R1; y += 40) { gg.moveTo(CX - R1, y); gg.lineTo(CX + R1, y); } }); g.strokeStyle = '#5a3826'; g.lineWidth = 6; g.stroke(); g.restore();

  // the hedge round the garden, and the low wall round the middle ring, with gates
  const hedge = (r: number, h: number, col: string, gap: number) => { for (let a = 0; a < TAU; a += 0.035) { if (Math.abs(((a - gap + TAU) % TAU) - 0) < 0.14) continue; const x = CX + Math.cos(a) * r, y = CY + Math.sin(a) * r; sc.add(I.depth(x, y), () => { const [px, py] = I.p(x, y, h * 0.6); ellipse(g, px, py, 12 * I.s * 1.6, 10 * I.s * 1.6, 0, col, LW); }); } };
  hedge(R1, 50, '#4f8a3a', Math.PI * 0.25);
  for (let a = 0; a < TAU; a += 0.05) { if (Math.abs(((a - Math.PI * 0.25 + TAU) % TAU)) < 0.09) continue; const x = CX + Math.cos(a) * R2, y = CY + Math.sin(a) * R2; sc.add(I.depth(x, y), () => box(g, I, x - 18, y - 18, 0, 36, 36, 40, { top: '#e9dfc6', left: '#d8cbb0', right: '#c4b498', lw: LW })); }

  /* ── 1 · the garden ── */
  for (let i = 0; i < 18; i++) { const R = rng(i + 40); const x = CX - 220 + (i % 6) * 80 + R() * 10, y = CY - 200 + Math.floor(i / 6) * 120 + R() * 10; if (Math.hypot(x - CX, y - CY) > R1 - 50) continue; sc.add(I.depth(x, y), () => plant(g, I, x, y, -10, 70 + R() * 30, LW, '#7a5236', i, 'bush')); }
  P(CX + 60, CY + 160, { face: '-y', turn: 0.4, look: look(3001, { fem: true, skin: SKIN[3], hair: HAIR.black, style: 'bun', topKind: 'tee', top: C.mustard, bottom: C.denim, hat: { kind: 'bucket', color: C.khaki } }), pose: POSES.kneel, mood: 'smile', who: ['Ines', 'Tending what is hers. She cannot make it rain; she can water.'], hold: (gg: G, J: Joints) => { const [x, y] = J.hF; gg.beginPath(); gg.moveTo(x, y); gg.lineTo(x + 18 * J.fwd, y + 20); gg.lineWidth = 3; gg.strokeStyle = INK; gg.stroke(); gg.beginPath(); gg.ellipse(x + 20 * J.fwd, y + 22, 7, 4, 0.5, 0, TAU); inkFill(gg, '#9aa0a6', 1.4); } });
  sc.add(I.depth(CX + 160, CY + 60), () => { const [x, y] = I.p(CX + 160, CY + 60, 0); g.beginPath(); g.moveTo(x - 18, y); g.lineTo(x - 14, y - 30); g.lineTo(x + 14, y - 30); g.lineTo(x + 18, y); g.closePath(); inkFill(g, '#3b7dd8', LW); ln(g, x + 14, y - 22, x + 40, y - 40, 4); });
  sc.add(I.depth(CX + 400, CY + 400), () => { for (const [x, y, t] of [[CX - 120, CY - 140, 'MY EFFORT'], [CX + 150, CY - 120, 'MY WORDS'], [CX - 200, CY + 120, 'MY SLEEP'], [CX + 230, CY + 220, 'HOW I RESPOND']] as [number, number, string][]) { const [px, py] = I.p(x, y, 0); sign(g, px, py, t, '#f3dc8a'); } });

  /* ── 2 · the middle ring ── */
  // the neighbour over the hedge
  P(CX + R1 + 90, CY - 160, { face: '-x', turn: 0.5, look: look(3011, { fem: false, age: 'old', skin: SKIN[5], hair: HAIR.grey, style: 'balding', topKind: 'sweater', top: '#b8cfa8', bottom: C.khaki, beard: true }), pose: { ...POSES.point, armF: [100, 120] }, mood: 'open', who: ['Mr. Adeyemi, the neighbour', 'She cannot make him fix his fence. She can ask him nicely, and offer to help. He is considering it.'] });
  // the team at a table
  sc.add(I.depth(CX - 420, CY + 380), () => { table(g, I, CX - 520, CY + 320, 200, 110, 74, '#e9dfc6', LW); laptop(g, I, CX - 420, CY + 370, 74, LW, '+y', C.ash); });
  for (const [dx, dy, f, seed, nm] of [[-560, 350, '+x', 3021, 'Her team'], [-300, 400, '-x', 3022, undefined], [-440, 470, '-y', 3023, undefined]] as [number, number, '+x' | '-x' | '-y', number, string | undefined][]) {
    sc.add(I.depth(CX + dx, CY + dy) - 0.5, () => chair(g, I, CX + dx, CY + dy, f, C.teal, LW, 'seat'));
    P(CX + dx, CY + dy, { face: f, turn: 0.5, look: look(seed, {}), pose: POSES.sitDesk, who: nm ? [nm, 'She cannot decide for them. She can make the case, share the work and listen; the deadline is theirs too.'] : undefined }, 45);
  }
  // friends on a bench
  sc.add(I.depth(CX + 120, CY + R1 + 160), () => bench(g, I, CX + 40, CY + R1 + 140, 'x', LW));
  P(CX + 90, CY + R1 + 175, { face: '+y', turn: 0.5, look: look(3031, { fem: true, skin: SKIN[1], hair: HAIR.blond, style: 'long', topKind: 'jacket', top: C.coral, inner: C.white, bottom: C.navy }), pose: { ...POSES.sit, armF: [50, 100] }, mood: 'open', who: ['Her friend Dana', 'Going through a hard month. She cannot fix it. She can show up on Thursdays, which she does.'] }, 45);
  P(CX + 150, CY + R1 + 175, { face: '+y', turn: 0.5, look: look(3032, { fem: false, skin: SKIN[4], hair: HAIR.black, style: 'curly', topKind: 'hoodie', top: C.lav, bottom: C.denim }), pose: POSES.sit, mood: 'smile' }, 45);
  // a child she is teaching to plant
  P(CX - 260, CY - R1 - 120, { face: '+y', turn: 0.5, look: look(3041, { fem: false, age: 'kid', skin: SKIN[3], hair: HAIR.black, style: 'short', topKind: 'tee', top: C.red, bottom: C.khaki, bottomKind: 'shorts' }), pose: POSES.cradle, hold: (gg: G, J: Joints) => { const cx = (J.hN[0] + J.hF[0]) / 2, cy = (J.hN[1] + J.hF[1]) / 2 - 4; gg.beginPath(); gg.rect(cx - 8, cy - 2, 16, 12); inkFill(gg, '#c97a4a', LW); for (let k = 0; k < 3; k++) { gg.beginPath(); gg.ellipse(cx - 4 + k * 4, cy - 8, 3, 7, -0.4 + k * 0.4, 0, TAU); inkFill(gg, C.green, 1); } }, mood: 'open', who: ['Her nephew, Teo, 7', 'She can show him how to plant a tomato. Whether he becomes a gardener is up to him.'] });
  sc.add(I.depth(CX + 600, CY + 600), () => { for (const [x, y, t] of [[CX + R1 + 220, CY - 300, 'MY NEIGHBOURS'], [CX - 600, CY + 200, 'MY TEAM'], [CX + 420, CY + R1 + 200, 'MY FRIENDS'], [CX + 780, CY + 1000, 'WHAT THEY THINK']] as [number, number, string][]) { const [px, py] = I.p(x, y, 0); sign(g, px, py, t, '#cfe0b8'); } });

  /* ── 3 · the outer ring ── */
  // cars in a jam on the ring road
  const car = (a: number, col: string) => { const r = (R3 + R2 + 50) / 2, x = CX + Math.cos(a) * r, y = CY + Math.sin(a) * r; sc.add(I.depth(x, y), () => { box(g, I, x - 60, y - 34, 10, 120, 68, 40, { top: col, left: col, right: col, lw: LW }); box(g, I, x - 30, y - 30, 50, 66, 60, 30, { top: col, left: '#a9cfe0', right: '#a9cfe0', lw: LW }); for (const [wx, wy] of [[x - 40, y + 34], [x + 40, y + 34]]) { onPlane(g, I, 'y', wy, (gg) => gg.ellipse(wx, 14, 14, 14, 0, 0, TAU)); inkFill(g, '#26262b', LW); } for (const [wx, wy] of [[x + 60, y - 18], [x + 60, y + 18]]) { onPlane(g, I, 'x', wx, (gg) => gg.ellipse(wy, 14, 14, 14, 0, 0, TAU)); inkFill(g, '#26262b', LW); } }); };
  [0.15, 0.32, 0.5, 0.7, 2.6, 2.8, 3.0].forEach((a, i) => car(a, pick(rng(i + 5), ['#d9493f', '#3b7dd8', '#e3b23c', '#fbfaf5', '#3a3a40', '#4f9a5a'])));
  // the news kiosk
  sc.add(I.depth(CX - 980, CY + 200), () => {
    const x = CX - 1020, y = CY + 120; box(g, I, x, y, 0, 120, 160, 160, { top: '#2c5f3a', left: '#3f8a5a', right: '#2f6a46', lw: LW });
    for (const [k, t] of [[0, 'MARKETS TUMBLE'], [1, 'STORM ON THE WAY'], [2, 'WHO IS TO BLAME?']] as [number, string][]) { onPlane(g, I, 'x', x + 120, (gg) => gg.rect(y + 10, 115 - k * 38, 140, 30)); inkFill(g, '#fbfaf5', 1.4); wallText(g, I, 'x', x + 120, y + 80, 128 - k * 38, t, 13, `bold ${SANS}`, INK); }
  });
  // the billboard: the market falling
  sc.add(I.depth(CX + 200, CY - 1000), () => {
    const x = CX + 80, y = CY - 1040; for (const dx of [40, 200]) box(g, I, x + dx, y, 0, 12, 12, 200, { top: '#5c6670', left: '#5c6670', right: '#3a3a40', lw: LW });
    plane(g, I, 'y', y + 12, (gg) => gg.rect(x, 200, 260, 140), '#26262b', LW);
    onPlane(g, I, 'y', y + 12, (gg) => { gg.moveTo(x + 20, 320); gg.lineTo(x + 70, 300); gg.lineTo(x + 110, 315); gg.lineTo(x + 160, 260); gg.lineTo(x + 200, 270); gg.lineTo(x + 240, 220); }); g.strokeStyle = '#d9493f'; g.lineWidth = 5; g.stroke();
    wallText(g, I, 'y', y + 12, x + 130, 216, 'THE ECONOMY', 18, `bold ${SANS}`, '#fbfaf5');
  });
  // the departures board
  sc.add(I.depth(CX + 1000, CY - 300), () => {
    const x = CX + 960, y = CY - 360; box(g, I, x, y, 0, 20, 20, 140, { top: '#5c6670', left: '#5c6670', right: '#3a3a40', lw: LW });
    plane(g, I, 'x', x + 20, (gg) => gg.rect(y - 80, 140, 200, 110), '#26262b', LW);
    for (let k = 0; k < 3; k++) { wallText(g, I, 'x', x + 20, y + 20, 225 - k * 32, ['MY FLIGHT  DELAYED', 'TRAIN 16  DELAYED', 'BUS 41  CANCELLED'][k], 15, `bold ${SANS}`, k ? '#ffd25a' : '#ff7a6a'); }
  });
  // two strangers talking about her
  P(CX + 700, CY + 820, { face: '-x', turn: 0.5, look: look(3051, { fem: true, skin: SKIN[0], hair: HAIR.brown, style: 'ponytail', topKind: 'coat', top: C.wine, bottom: C.black }), pose: { ...POSES.phone, armN: [20, 150], head: 0 }, mood: 'open', who: ['What they think of me', 'Two people she has met once, discussing her outfit. She will never hear what they said. It changes nothing in the garden.'] });
  P(CX + 600, CY + 900, { face: '+y', turn: 0.5, look: look(3052, { fem: false, skin: SKIN[2], hair: HAIR.black, style: 'side', topKind: 'jacket', top: C.navy, inner: C.white, bottom: C.char }), pose: POSES.stand, mood: 'smile' });
  // the clock tower: the past
  sc.add(I.depth(CX - 700, CY - 900), () => {
    const x = CX - 760, y = CY - 960; box(g, I, x, y, 0, 120, 120, 380, { top: '#8a4a3a', left: '#b5583e', right: '#9a4a36', lw: LW });
    plane(g, I, 'y', y + 120, (gg) => gg.ellipse(x + 60, 320, 40, 40, 0, 0, TAU), '#fbfaf5', LW);
    onPlane(g, I, 'y', y + 120, (gg) => { gg.moveTo(x + 60, 320); gg.lineTo(x + 60, 350); gg.moveTo(x + 60, 320); gg.lineTo(x + 40, 330); }); g.lineWidth = 3; g.strokeStyle = INK; g.stroke();
    wallText(g, I, 'y', y + 120, x + 60, 250, 'THE PAST', 18, CINZEL, '#fbfaf5');
  });
  sc.add(I.depth(CX - 900, CY - 200), () => { treeShadow(g, I, CX - 950, CY - 200, 160); isoTree(g, I, CX - 950, CY - 200, 420, 180, LW, 7); });
  sc.add(I.depth(CX + 560, CY + 560), () => { const [x, y] = I.p(CX + 560, CY + 560, 0); dog(g, x, y, I.zs * 0.9, -1, '#c9a070', LW, { tail: 10 }); });
  sc.draw();

  // the storm cloud over the outer ring: the weather
  const cl = (x: number, y: number, s: number) => { g.beginPath(); for (const [dx, dy, r] of [[-60, 10, 44], [0, -16, 58], [64, 6, 46], [20, 26, 40], [-28, 28, 38]]) { g.moveTo(x + dx * s + r * s, y + dy * s); g.arc(x + dx * s, y + dy * s, r * s, 0, TAU); } g.lineWidth = 5; g.strokeStyle = INK; g.stroke(); g.fillStyle = '#6e7480'; g.fill(); };
  cl(2170, 180, 1.3); for (let k = 0; k < 9; k++) ln(g, 2110 + k * 16, 250, 2090 + k * 16, 330, 3, '#a9cfe0');
  g.beginPath(); g.moveTo(2200, 230); g.lineTo(2180, 280); g.lineTo(2202, 276); g.lineTo(2182, 330); g.lineWidth = 6; g.strokeStyle = '#ffd25a'; g.stroke();
  bubble(g, 1800, 60, 230, 'THE WEATHER', 2060, 150, { size: 24 });

  // the badges
  const b = (x: number, y: number, n: number) => { const [px, py] = I.p(x, y, 0); badge(g, who, px, py - 60, NOTES[n - 1]); };
  b(CX - 60, CY - 60, 1); b(CX - R1 - 150, CY + 120, 2); b(CX - R2 - 200, CY + 520, 3);
  { const [px, py] = I.p(CX + Math.cos(Math.PI * 0.25) * R2, CY + Math.sin(Math.PI * 0.25) * R2, 0); badge(g, who, px + 40, py - 50, NOTES[3], '#e3b23c'); }

  titlePanel(g, { x: 50, y: 40, w: 780, title: 'Circles of Control', def: 'Spend yourself on what you can change; notice the rest, and let the weather be the weather.', credit: 'After Epictetus, Enchiridion · Stephen Covey, 1989' });
  keyPanel(g, 50, 1150, 640, NOTES);
  grain(g, W, H, 0.1, 6);
  void SERIF;
}

export const CONTROL: Plate = {
  key: 'control', title: 'Circles of Control', place: 'After Epictetus and Stephen Covey',
  blurb: 'A woman tends the small garden that is hers; around it, the neighbours, friends and team she can reach; outside, the weather, the news, the economy and strangers’ opinions, which she can only watch.',
  w: W, h: H, paint,
};
export type { Pt };
