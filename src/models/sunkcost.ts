/**
 * The Sunk Cost Fallacy — Arkes & Blumer, "The psychology of sunk cost"
 * (1985): people who had paid full price for a theatre season went to more
 * plays than people given a discount, though the money was gone either way.
 * A cinema seen from the screen, an hour into a terrible film: most of the
 * audience stays because they paid; one couple walks out into the sun.
 */
import { type G, C, HAIR, SKIN, INK, inkFill, ellipse, ln, rng, pick, grain, TAU, SERIF } from '../walks/kit';
import { POSES, randomLook, type Look, type Joints, type Pose } from '../walks/people';
import { type Plate, type Who } from '../walks/stage';
import { W, H, titlePanel, keyPanel, badge, bubble, CINZEL, wrap } from './note';
import { rp, PRoom, Scene } from './rooms';

const look = (seed: number, o: Partial<Look>) => randomLook(seed, o);
const LW = 2.2;

const NOTES = [
  { n: 1, title: 'The sunk cost', gloss: 'Two tickets, $36. Gone, whether they stay or leave.', line: 'The money was spent the moment the tickets were bought. Staying does not get it back; leaving does not lose it again. It is the same $36 in both futures, so it should not decide between them.' },
  { n: 2, title: 'Staying because of it', gloss: '“We paid for this. We’re watching the whole thing.”', line: 'Arkes and Blumer (1985) sold theatre season tickets at full price or at a discount, at random. The full-price buyers went to more plays in the first half of the season, though the money was spent either way.' },
  { n: 3, title: 'The only real question', gloss: 'Is the next hour worth more here than out there?', line: 'A good decision looks forward: given where I am now, which future is better? Here: ninety more minutes of this film, or a sunny afternoon. The tickets are the same in both.' },
  { n: 4, title: 'Why we stay', gloss: 'Hating waste, hating loss, wanting to look consistent.', line: 'Psychologists point to loss aversion, a dislike of appearing wasteful, and the wish to justify the earlier choice. Abandoning feels like admitting the money was wasted, though it already was.' },
  { n: 5, title: 'The same, bigger', gloss: 'Concorde; the war that must not have been in vain.', line: 'Governments, companies and people continue failing projects because of what has already gone into them. Arkes and Ayton (1999) called it the Concorde fallacy, after the airliner Britain and France kept funding long after it was clear it would not pay.' },
];

function paint(g: G, who: Who[]) {
  const R = new PRoom(-160, -60, 2720, 1700, 560, 640, 0.6, 0.3, 0.5);
  const WC = R.Wc;
  R.shell(g, { back: '#3a2430', left: '#4a2a36', right: '#40242e', floor: '#2a1820', ceil: '#2e1a24' }, LW);
  // the light from the screen behind us falls on the room
  g.save(); g.globalCompositeOperation = 'screen'; const gl = g.createRadialGradient(W / 2, H * 0.9, 100, W / 2, H * 0.5, 1500); gl.addColorStop(0, 'rgba(150,180,230,0.32)'); gl.addColorStop(1, 'rgba(150,180,230,0)'); g.fillStyle = gl; g.fillRect(0, 0, W, H); g.restore();
  // the projector window in the back wall and its beam over our heads
  R.onBack(g, WC * 0.48, 470, WC * 0.54, 510, '#fff6d0', LW);
  { const [px, py] = R.p(WC * 0.51, 0, 490); g.save(); g.globalCompositeOperation = 'screen'; const bm = g.createLinearGradient(px, py, px, -100); bm.addColorStop(0, 'rgba(255,246,208,0.28)'); bm.addColorStop(1, 'rgba(255,246,208,0)'); g.fillStyle = bm; g.beginPath(); g.moveTo(px - 20, py); g.lineTo(px + 20, py); g.lineTo(px + 900, -80); g.lineTo(px - 900, -80); g.closePath(); g.fill(); g.restore(); }
  // wall sconces
  for (const d of [150, 380]) for (const side of [0, 1] as const) { const X = side ? WC : 0; const [x, y] = R.p(X, d, 330); ellipse(g, x, y, 14, 20, 0, '#e3a24a', 1.6); g.save(); g.globalCompositeOperation = 'screen'; const sg = g.createRadialGradient(x, y, 2, x, y, 80); sg.addColorStop(0, 'rgba(255,200,120,0.5)'); sg.addColorStop(1, 'rgba(255,200,120,0)'); g.fillStyle = sg; g.fillRect(x - 80, y - 80, 160, 160); g.restore(); }

  const sc = new Scene(g);
  const ROWS = [{ d: 110, Z: 200 }, { d: 220, Z: 150 }, { d: 330, Z: 100 }, { d: 440, Z: 50 }];
  ROWS.forEach((row) => sc.add(row.d - 40, () => R.box(g, 0, WC, row.d - 60, row.d + 50, 0, row.Z, { front: '#5a2a36', top: '#6a3440', lw: LW })));
  type Act = 'asleep' | 'phone' | 'groan' | 'stare' | 'popcorn';
  const LINES: Record<Act, string> = { asleep: 'Asleep since the second explosion. Paid $18 to nap.', phone: 'Reading the film’s plot online to find out how much is left. Fifty-three minutes.', groan: 'Has said “ohhh no” out loud four times. Is staying.', stare: 'Has not blinked in some time. Is not enjoying it. Is not leaving.', popcorn: 'Large popcorn, $9. Eating it slowly, to get his money’s worth.' };
  const Rr = rng(13);
  const SEATS: [number, number, Act][] = [[0, 1, 'asleep'], [0, 2, 'stare'], [0, 4, 'phone'], [0, 5, 'groan'], [1, 0, 'popcorn'], [1, 2, 'groan'], [1, 3, 'asleep'], [1, 6, 'stare'], [2, 1, 'phone'], [2, 4, 'stare'], [2, 5, 'popcorn'], [3, 4, 'asleep']];
  SEATS.forEach(([ri, slot, act], n) => {
    const row = ROWS[ri], X = WC * (0.12 + slot * 0.13);
    const pose: Pose = act === 'asleep' ? { ...POSES.sleep, legN: [80, 4], legF: [76, -2] } : act === 'phone' ? POSES.sitPhone : act === 'groan' ? { ...POSES.sit, armN: [150, 190], armF: [150, 190], head: 10 } : act === 'popcorn' ? { ...POSES.sit, armN: [30, 100], armF: [40, 140] } : POSES.sit;
    rp(sc, R, who, X, row.d, row.Z + 45, { turn: 0.05, look: look(11000 + n * 11, {}), pose, mood: act === 'groan' ? 'open' : act === 'stare' ? 'flat' : act === 'asleep' ? 'flat' : 'flat', eyes: act === 'asleep' ? 'closed' : act === 'phone' ? 'down' : undefined,
      hold: act === 'phone' ? (gg: G, J: Joints) => { const [x, y] = J.hN; gg.beginPath(); gg.roundRect(x - 6, y - 14, 12, 18, 2); inkFill(gg, '#3a3a40', 1.6); gg.fillStyle = 'rgba(200,230,255,0.9)'; gg.fillRect(x - 4, y - 12, 8, 13); } : act === 'popcorn' ? (gg: G, J: Joints) => { const cx = (J.hN[0] + J.hF[0]) / 2, cy = J.P[1] - 10; gg.beginPath(); gg.moveTo(cx - 14, cy - 20); gg.lineTo(cx + 14, cy - 20); gg.lineTo(cx + 10, cy + 8); gg.lineTo(cx - 10, cy + 8); gg.closePath(); inkFill(gg, '#fbfaf5', 1.6); for (let k = 0; k < 3; k++) gg.fillRect(cx - 12 + k * 9, cy - 20, 4, 28); for (let k = 0; k < 5; k++) ellipse(gg, cx - 10 + k * 5, cy - 22 - (k % 2) * 3, 4, 3.5, 0, '#f7e8b0', 1); } : undefined,
      who: [act === 'asleep' ? 'Asleep, but staying' : act === 'phone' ? 'How much is left?' : act === 'groan' ? '“Ohhh no.”' : act === 'popcorn' ? 'Getting his money’s worth' : 'Enduring', LINES[act]] }, row.d);
    void Rr;
  });
  // the couple who are staying, front and centre
  const fr = ROWS[3];
  const C1 = WC * 0.38, C2 = WC * 0.5;
  rp(sc, R, who, C1, fr.d, fr.Z + 45, { turn: 0.15, look: look(11201, { fem: false, skin: SKIN[2], hair: HAIR.black, style: 'short', topKind: 'jacket', top: C.navy, inner: C.white, bottom: C.khaki, beard: 'stubble' }), pose: { ...POSES.sit, armF: [60, 130] }, mood: 'frown', hold: (gg: G, J: Joints) => { const [x, y] = J.hF; gg.beginPath(); gg.rect(x - 4, y - 18, 22, 12); inkFill(gg, '#e3b23c', 1.6); gg.fillStyle = INK; gg.font = 'bold 7px Arial'; gg.fillText('ADMIT 2', x - 1, y - 9); }, who: ['Marcus, holding the stubs', 'Has not enjoyed one minute in sixty. Has reminded his wife, twice, what the tickets cost.'] }, fr.d);
  rp(sc, R, who, C2, fr.d, fr.Z + 45, { turn: -0.25, look: look(11202, { fem: true, skin: SKIN[2], hair: HAIR.black, style: 'braids', topKind: 'sweater', top: C.wine, bottom: C.navy }), pose: { ...POSES.sitBack, head: -6 }, mood: 'flat', eyes: 'closed', who: ['Dana, enduring', 'Would rather be anywhere. Will stay, because leaving now would mean they had wasted the money.'] }, fr.d + 0.1);
  ROWS.forEach((row) => sc.add(row.d + 1, () => R.box(g, 0, WC, row.d + 30, row.d + 38, row.Z, row.Z + 70, { front: '#6a3440', lw: LW })));
  // the exit on the right wall, open, sunlight pouring in
  sc.add(560, () => {
    R.onSide(g, 1, 380, 520, 0, 260, '#fbe6a8', LW);
    const a = R.p(WC, 380, 0), b = R.p(WC, 520, 0); g.save(); g.globalCompositeOperation = 'screen'; g.fillStyle = 'rgba(255,236,170,0.45)'; g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.lineTo(b[0] - 600, b[1] + 60); g.lineTo(a[0] - 500, a[1] + 40); g.closePath(); g.fill(); g.restore();
    const [ex, ey] = R.p(WC, 370, 290); g.beginPath(); g.rect(ex - 70, ey - 26, 110, 34); inkFill(g, '#2f8a4a', 1.6); g.fillStyle = '#fbfaf5'; g.font = `bold 22px Arial`; g.fillText('EXIT', ex - 50, ey - 2);
  });
  // the couple leaving, hand in hand
  rp(sc, R, who, WC - 190, 450, 0, { turn: 0.75, back: false, look: look(11301, { fem: true, skin: SKIN[0], hair: HAIR.auburn, style: 'ponytail', topKind: 'tee', top: C.mustard, bottom: C.denim }), pose: { ...POSES.walk, armF: [40, 50] }, mood: 'smile', who: ['Leaving, at minute sixty', 'Said “this is terrible, shall we go?” and he said yes. The tickets cost the same whether they stay or not; the afternoon does not.'] }, 450);
  rp(sc, R, who, WC - 90, 470, 0, { turn: 0.75, look: look(11302, { fem: false, skin: SKIN[5], hair: HAIR.black, style: 'curly', topKind: 'shirt', top: C.sky, bottom: C.khaki }), pose: { ...POSES.walk2, armN: [-30, -20] }, mood: 'open' }, 470);
  sc.draw();

  // the speech bubbles
  const [mx, my] = R.p(C1, fr.d, fr.Z + 190);
  bubble(g, mx - 520, my - 160, 400, '“We paid $36 for this. We’re watching the whole thing.”', mx - 10, my - 20, { size: 26 });
  bubble(g, 1990, 620, 330, '“The money’s gone either way. The sunshine isn’t.”', 1960, 1000, { size: 26 });

  // the two futures, as two ledgers
  const ledger = (x: number, y: number, title: string, rows: [string, string][], col: string) => { g.beginPath(); g.rect(x + 6, y + 6, 360, 200); g.fillStyle = INK; g.fill(); g.beginPath(); g.rect(x, y, 360, 200); inkFill(g, '#fbf6e6', 2.4); g.fillStyle = col; g.fillRect(x, y, 360, 44); g.fillStyle = '#fbfaf5'; g.font = `600 22px ${CINZEL}`; g.fillText(title, x + 16, y + 30); g.fillStyle = INK; g.font = `italic 22px ${SERIF}`; rows.forEach(([a, b], i) => { g.fillText(a, x + 16, y + 80 + i * 36); g.textAlign = 'right'; g.fillText(b, x + 344, y + 80 + i * 36); g.textAlign = 'left'; }); ln(g, x + 16, y + 92 + (rows.length - 1) * 36 - 26, x + 344, y + 92 + (rows.length - 1) * 36 - 26, 1.4, 'rgba(31,26,23,0.4)'); };
  ledger(50, 330, 'IF THEY STAY', [['tickets', '−$36'], ['90 more minutes', 'awful'], ['', '']], '#7d2a3a');
  ledger(50, 570, 'IF THEY LEAVE', [['tickets', '−$36'], ['90 more minutes', 'the park'], ['', '']], '#2f8a4a');
  g.fillStyle = '#fbe6a8'; g.font = `italic 26px ${SERIF}`; wrap(g, 'The $36 is in both columns. Cross it out, and compare what is left.', 56, 830, 360, 32);
  g.strokeStyle = '#ffd25a'; g.lineWidth = 4; for (const y of [410, 650]) { g.beginPath(); g.moveTo(60, y - 10); g.lineTo(400, y - 2); g.stroke(); }

  badge(g, who, 420, 340, NOTES[0]); badge(g, who, mx - 120, my - 170, NOTES[1]); badge(g, who, 420, 580, NOTES[2], '#2f8a4a');
  badge(g, who, 1080, 560, NOTES[3], '#3a3a40'); badge(g, who, 1080, 330, NOTES[4], '#3a3a40');

  titlePanel(g, { x: 50, y: 40, w: 820, title: 'The Sunk Cost Fallacy', def: 'What is spent is spent. Decide by what lies ahead, not by what you have already paid.', credit: 'Arkes & Blumer, 1985 · Arkes & Ayton, 1999' });
  keyPanel(g, 1780, 40, 580, NOTES, { fill: (n) => n === 3 ? '#2f8a4a' : n >= 4 ? '#3a3a40' : '#d9493f' });
  grain(g, W, H, 0.1, 37);
  void pick; void TAU;
}

export const SUNKCOST: Plate = {
  key: 'sunkcost', title: 'The Sunk Cost Fallacy', place: 'After Arkes & Blumer',
  blurb: 'A cinema seen from the screen, an hour into a terrible film: a man clutching the ticket stubs insists they stay because they paid; a couple walks out into the sunshine. The $36 is gone in both futures.',
  w: W, h: H, paint,
};
