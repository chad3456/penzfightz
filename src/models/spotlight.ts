/**
 * The Spotlight Effect — Gilovich, Medvec & Savitsky (2000): we overrate
 * how much others notice us. A student walks into a lecture late, in a
 * loud T-shirt, under what feels like a stage light, sure that the whole
 * hall is staring; seen from the lectern, almost nobody is, because each of
 * them is under a spotlight of their own.
 */
import { type G, C, HAIR, SKIN, INK, inkFill, ellipse, ln, rng, pick, grain, TAU, SERIF } from '../walks/kit';
import { POSES, randomLook, type Look, type Joints, type Pose } from '../walks/people';
import { type Plate, type Who } from '../walks/stage';
import { W, H, titlePanel, keyPanel, badge, bubble, CINZEL } from './note';
import { rp, PRoom, Scene } from './rooms';

const look = (seed: number, o: Partial<Look>) => randomLook(seed, o);
const LW = 2.2;

const NOTES = [
  { n: 1, title: 'The spotlight you feel', gloss: 'Late, in a loud T-shirt, sure everyone is staring.', line: 'He feels lit up: every eye on the shirt, the lateness, the squeaky door. In the original study, students sent into a room in an embarrassing T-shirt guessed that about half the people there would notice it.' },
  { n: 2, title: 'What is really happening', gloss: 'Almost nobody looked up.', line: 'From the lectern the hall looks very different: one or two glance up, and the rest go back to their notes, phones and daydreams. In the study, only about a quarter of the room could say what was on the shirt.' },
  { n: 3, title: 'Everyone’s own spotlight', gloss: 'Each of them is busy worrying about themselves.', line: 'The reason nobody is watching him is that each of them is under a spotlight of their own: their hair, the quiz, a text, lunch. The effect is everyone’s at once.' },
  { n: 4, title: 'Why it happens', gloss: 'We start from our own view and adjust too little.', line: 'Gilovich and colleagues put it down to anchoring on our own experience, which is vivid to us, and then adjusting too little for how little of it others see. It applies to good moments too: others notice our triumphs less than we think.' },
];
const _WORRIES = ['Is my hair weird?', 'Did I lock my bike?', 'The quiz is Friday?!', 'Lunch.', 'Why hasn’t she texted?', 'zzz', 'Was I too loud earlier?', 'I hope he doesn’t call on me.', 'Rent is due.', 'Is that my stomach?'];

function paint(g: G, who: Who[]) {
  const R = new PRoom(-160, -60, 2720, 1700, 600, 640, 0.62, 0.3, 0.52);
  const WC = R.Wc;
  R.shell(g, { back: '#e8dcc4', left: '#dccfb2', right: '#d2c4a6', floor: '#8a6a50', ceil: '#efe6d2' }, LW);
  for (let X = 0; X < WC; X += 40) { const a = R.p(X, 0, 0), b = R.p(X, 0, 240); ln(g, a[0], a[1], b[0], b[1], 1, 'rgba(80,50,20,0.22)'); }
  R.onBack(g, 0, 240, WC, 246, '#b97a45', LW);
  const B0 = WC * 0.34, B1 = WC * 0.8;
  R.onBack(g, B0, 330, B1, 540, '#2f4a3a', LW * 1.4); R.onBack(g, B0, 324, B1, 332, '#b97a45', LW);
  {
    const tx = (X: number, Z: number, t: string, size: number, al: CanvasTextAlign = 'left') => { const [x, y] = R.p(X, 0, Z); g.font = `600 ${Math.round(size)}px ${CINZEL}`; g.fillStyle = '#eef3ea'; g.textAlign = al; g.fillText(t, x, y); g.textAlign = 'left'; };
    tx((B0 + B1) / 2, 505, 'WHO NOTICED THE T-SHIRT?', 30, 'center');
    const L = B0 + (B1 - B0) * 0.47, full = (B1 - B0) * 0.48;
    const bar = (Z: number, frac: number, label: string, col: string) => { R.onBack(g, L, Z, L + full * frac, Z + 40, col, 2); tx(L - 12, Z + 12, label, 18, 'right'); };
    bar(430, 0.5, 'HE GUESSED · ABOUT HALF', '#f3dc8a'); bar(365, 0.24, 'ACTUALLY · ABOUT A QUARTER', '#9ad0b0');
    for (let k = 0; k <= 4; k++) { const a = R.p(L + full * k / 4, 0, 350), b = R.p(L + full * k / 4, 0, 480); ln(g, a[0], a[1], b[0], b[1], 1, 'rgba(238,243,234,0.25)'); }
  }
  { const [x, y] = R.p(WC * 0.9, 0, 460), k = R.k(0); ellipse(g, x, y, 22 * k, 22 * k, 0, '#fbfaf5', LW); ln(g, x, y, x, y - 15 * k, LW * 1.4); ln(g, x, y, x + 10 * k, y + 3 * k, LW * 1.4); }

  const sc = new Scene(g);
  const ROWS = [{ d: 110, Z: 200 }, { d: 220, Z: 150 }, { d: 330, Z: 100 }, { d: 440, Z: 50 }];
  // who sits where: [row, slot 0..6, act, thought?]
  type Act = 'phone' | 'write' | 'sleep' | 'chat' | 'read' | 'look';
  const SEATS: [number, number, Act, string?][] = [
    [0, 0, 'read'], [0, 1, 'phone', 'Why hasn’t she texted?'], [0, 3, 'write'], [0, 4, 'chat'], [0, 5, 'chat'], [0, 6, 'sleep'],
    [1, 0, 'write'], [1, 2, 'look'], [1, 3, 'phone'], [1, 5, 'read', 'The quiz is Friday?!'], [1, 6, 'write'],
    [2, 1, 'sleep'], [2, 2, 'write', 'Is my hair weird?'], [2, 4, 'phone'], [2, 5, 'chat'], [2, 6, 'chat'],
    [3, 3, 'write'], [3, 4, 'read', 'Did I lock my bike?'], [3, 5, 'phone'], [3, 6, 'look'],
  ];
  const WHAT: Record<Act, string> = { phone: 'On the phone, under the desk. Did not see the shirt.', write: 'Taking notes, a little behind. Did not see the shirt.', sleep: 'Asleep since the second slide. Did not see the shirt.', chat: 'Whispering about the weekend. Did not see the shirt.', read: 'Reading ahead for Friday. Did not see the shirt.', look: 'One of the few who looked up: half a second, then back to the notes. Ask tomorrow what was on the shirt and the answer will be a shrug.' };
  ROWS.forEach((row) => {
    sc.add(row.d - 40, () => R.box(g, 0, WC, row.d - 60, row.d + 50, 0, row.Z, { front: '#7a5a40', top: '#9a7a5a', lw: LW }));
    sc.add(row.d + 1, () => { R.box(g, 0, WC, row.d + 18, row.d + 28, row.Z, row.Z + 64, { front: '#9a6a40', lw: LW }); R.box(g, 0, WC, row.d + 12, row.d + 34, row.Z + 64, row.Z + 72, { front: '#b97a45', top: '#c98a55', lw: LW }); });
  });
  SEATS.forEach(([ri, slot, act, thought], n) => {
    const row = ROWS[ri], X = WC * (0.12 + slot * 0.13) + ((n * 37) % 20) - 10;
    const pose: Pose = act === 'phone' ? POSES.sitPhone : act === 'sleep' ? { ...POSES.sitDesk, lean: 34, head: 36, armN: [70, 100], armF: [74, 104] } : act === 'read' ? POSES.sitRead : act === 'chat' ? { ...POSES.sitDesk, head: -4, armF: [60, 140] } : act === 'look' ? { ...POSES.sitDesk, head: -4 } : POSES.sitDesk;
    const Rr = rng(n + 3);
    rp(sc, R, who, X, row.d, row.Z + 45, { turn: act === 'look' ? -0.5 : act === 'chat' ? (slot % 2 ? -0.55 : 0.55) : 0.06, look: look(5000 + n * 7, {}), pose, mood: act === 'look' ? 'o' : act === 'chat' ? 'open' : act === 'sleep' ? 'flat' : pick(Rr, ['flat', 'smile'] as const), eyes: act === 'sleep' ? 'closed' : act === 'phone' || act === 'write' || act === 'read' ? 'down' : undefined,
      hold: act === 'phone' ? (gg: G, J: Joints) => { const [x, y] = J.hN; gg.beginPath(); gg.roundRect(x - 6, y - 14, 12, 18, 2); inkFill(gg, '#3a3a40', 1.6); } : act === 'read' ? (gg: G, J: Joints) => { const cx = (J.hN[0] + J.hF[0]) / 2, cy = (J.hN[1] + J.hF[1]) / 2 - 4; gg.beginPath(); gg.rect(cx - 16, cy - 10, 32, 20); inkFill(gg, pick(Rr, [C.red, C.navy, C.teal]), 1.6); } : undefined,
      who: [thought ? `“${thought}”` : act === 'look' ? 'Glanced up' : 'Busy', thought ? `Thinking about this, and nothing else. Did not see the shirt: under a spotlight of their own.` : WHAT[act]] }, row.d);
    if (thought) sc.add(500 + n, () => { const [x, y] = R.p(X, row.d, row.Z + 165); bubble(g, x - 120, y - 96, 250, thought, x + 6, y + 6, { thought: true, size: 23 }); });
  });

  /* the latecomer at the side door */
  sc.add(470, () => { R.onSide(g, 0, 400, 600, 0, 260, '#6b4128', LW); R.onSide(g, 0, 416, 584, 12, 248, '#8a5a3a', LW * 0.7); });
  const LX = 150, LD = 600;
  sc.add(580, () => {
    const [fx, fy] = R.p(LX, LD, 0), k = R.k(LD);
    g.save(); g.globalCompositeOperation = 'screen';
    const gr = g.createLinearGradient(fx, 0, fx, fy); gr.addColorStop(0, 'rgba(255,246,200,0.05)'); gr.addColorStop(1, 'rgba(255,246,200,0.5)');
    g.fillStyle = gr; g.beginPath(); g.moveTo(fx - 30, -10); g.lineTo(fx + 50, -10); g.lineTo(fx + 80 * k, fy); g.lineTo(fx - 80 * k, fy); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,246,200,0.5)'; g.beginPath(); g.ellipse(fx, fy, 80 * k, 20 * k, 0, 0, TAU); g.fill();
    g.restore();
  });
  rp(sc, R, who, LX, LD, 0, { turn: 0.25, look: look(5101, { fem: false, age: 'teen', skin: SKIN[1], hair: HAIR.ginger, style: 'curly', topKind: 'tee', top: '#ffd25a', bottom: C.denim, bag: { kind: 'backpack', color: C.teal } }), pose: { ...POSES.walk, armN: [-10, 30], armF: [50, 140], head: 10 }, mood: 'o', scale: 1.35,
    over: (gg: G, J: Joints) => {
      const cx = (J.N[0] + J.P[0]) / 2, cy = (J.N[1] + J.P[1]) / 2 + 4, r = J.s * 6.2;
      gg.beginPath(); gg.arc(cx, cy, r, 0, TAU); inkFill(gg, '#f2a23a', 2);
      for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU; ln(gg, cx + Math.cos(a) * r * 1.15, cy + Math.sin(a) * r * 1.15, cx + Math.cos(a) * r * 1.45, cy + Math.sin(a) * r * 1.45, 3, '#e3584a'); }
      gg.fillStyle = INK; gg.fillRect(cx - r * 0.62, cy - r * 0.3, r * 0.5, r * 0.26); gg.fillRect(cx + r * 0.12, cy - r * 0.3, r * 0.5, r * 0.26); gg.fillRect(cx - r * 0.15, cy - r * 0.26, r * 0.3, r * 0.06);
      gg.beginPath(); gg.arc(cx, cy + r * 0.12, r * 0.45, 0.2, Math.PI - 0.2); gg.lineWidth = 3; gg.strokeStyle = INK; gg.stroke();
      gg.beginPath(); gg.ellipse(J.H[0] + J.s * 5 * J.fwd, J.H[1] - J.s * 2, 4, 6, 0, 0, TAU); inkFill(gg, '#cfe7ec', 1.4);
    } }, LD);
  sc.draw();

  /* what he imagines: every eye in the hall */
  {
    const x = 60, y = 330, w = 520, h = 230;
    for (let k = 0; k < 3; k++) { g.beginPath(); g.arc(300 - k * 30, 760 - k * 70, 8 + k * 5, 0, TAU); inkFill(g, '#fbfaf5', 2); }
    g.beginPath(); g.roundRect(x, y, w, h, 110); inkFill(g, '#fbfaf5', 2.6);
    g.save(); g.beginPath(); g.roundRect(x + 10, y + 10, w - 20, h - 20, 100); g.clip();
    const Re = rng(4);
    for (let r = 0; r < 4; r++) for (let c = 0; c < 8; c++) { const ex = x + 50 + c * 54 + (r % 2) * 26, ey = y + 40 + r * 48; ellipse(g, ex - 9, ey, 9, 11, 0, '#fbfaf5', 1.8); ellipse(g, ex + 9, ey, 9, 11, 0, '#fbfaf5', 1.8); ellipse(g, ex - 13 + Re() * 2, ey + 2, 3.6, 3.6, 0, INK, 0); ellipse(g, ex + 5 + Re() * 2, ey + 2, 3.6, 3.6, 0, INK, 0); }
    g.restore();
    g.fillStyle = '#a9302a'; g.font = `italic 26px ${SERIF}`; g.fillText('“Everyone is staring.”', x + 120, y + h + 36);
  }

  badge(g, who, 470, 1020, NOTES[0]);
  badge(g, who, 1560, 1180, NOTES[1]);
  badge(g, who, 1930, 590, NOTES[2]);
  badge(g, who, 960, 320, NOTES[3], '#3a3a40');

  titlePanel(g, { x: 50, y: 40, w: 760, title: 'The Spotlight Effect', def: 'We think the whole room notices us. Mostly, the room is busy noticing itself.', credit: 'Gilovich, Medvec & Savitsky · 1999–2000' });
  keyPanel(g, 1760, 1180, 600, NOTES, { fill: (n) => n === 4 ? '#3a3a40' : '#d9493f' });
  // a soft darkening at the edges, like a hall with the house lights half up
  const vg = g.createRadialGradient(W / 2, H * 0.6, 500, W / 2, H * 0.6, 1500); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(30,15,0,0.25)'); g.fillStyle = vg; g.fillRect(0, 0, W, H);
  grain(g, W, H, 0.1, 12);
}

void _WORRIES;
export const SPOTLIGHT: Plate = {
  key: 'spotlight', title: 'The Spotlight Effect', place: 'Gilovich, Medvec & Savitsky',
  blurb: 'A student walks in late in a loud T-shirt, sure the whole hall is staring. Seen from the lectern, almost nobody looked up: each of them is under a spotlight of their own.',
  w: W, h: H, paint,
};
