/**
 * The goddess, her mounts and her enemies, inked: shapes filled flat, then
 * hatched, then outlined with a trembling pen. The goddess is drawn frontal,
 * as in folk prints and calendar art — a tall crown, wide almond eyes, a
 * skirt in hatched bands, arms fanned out with what each hand holds — and
 * the animals in profile, as in a frieze.
 *
 * Every figure is drawn in its own units (a standing goddess is 600 tall)
 * with its base at (0, 0), and placed with translate and scale.
 */
import { type G, type Pt, type Ink, type Hatch, rng, lerp, TAU, pen, shape, hatch, arcPts, blob, curve, band, toPath, crescent } from './ink';

export type Hold = 'trident' | 'lotus' | 'mala' | 'pot' | 'sword' | 'bow' | 'arrow' | 'chakra' | 'conch' | 'mace' | 'bell' | 'damru' | 'vajra' | 'noose' | 'cleaver' | 'shield' | 'spear' | 'kalash' | 'skull' | 'abhaya' | 'varada' | 'book' | 'hook' | 'fire' | 'none';

export interface Devi {
  ink: Ink;
  skin: string;
  sari: string; sari2: string; blouse: string;
  /** Hands from the lowest pair upward: [right, left] for each pair. */
  hands: Hold[];
  crown?: 'mukut' | 'bell' | 'wild' | 'jata' | 'veil';
  moon?: boolean;
  mood?: 'calm' | 'smile' | 'fierce';
  tongue?: boolean;
  garland?: 'flowers' | 'skulls' | 'none';
  /** Skirt pattern bands, top to bottom. */
  bands?: Hatch[];
  seat?: 'stand' | 'ride' | 'lotus';
  child?: boolean;
  seed?: number;
  /** Animate: breathing, hair, a raised arm's swing. */
  t?: number;
  /** Turn the whole body a little, for battle poses (radians). */
  lean?: number;
  /** Override the angle of a hand (index) to strike. */
  strike?: { i: number; a: number };
}

/* ───────── held things ───────── */

export function holdThing(g: G, k: Hold, ink: Ink, R: () => number, s = 1, glow = false) {
  const I = ink.dark, gold = ink.accent;
  g.save(); g.scale(s, s);
  const ln = (pts: Pt[], c = I, w = 2) => pen(g, pts, c, w, R, 0.5);
  switch (k) {
    case 'trident': ln([[0, 40], [0, -110]], I, 4); ln([[-22, -95], [-22, -120], [-14, -130]]); ln([[22, -95], [22, -120], [14, -130]]); g.beginPath(); g.moveTo(-22, -95); g.quadraticCurveTo(0, -80, 22, -95); g.strokeStyle = I; g.lineWidth = 3; g.stroke(); shape(g, [[0, -140], [6, -112], [-6, -112]], { fill: gold, line: I, seed: 1 }); break;
    case 'spear': ln([[0, 40], [0, -120]], I, 3.5); shape(g, [[0, -150], [9, -118], [0, -110], [-9, -118]], { fill: gold, line: I, seed: 2 }); break;
    case 'sword': shape(g, [[-3, 10], [-5, -90], [4, -118], [7, -88], [5, 10]], { fill: ink.light, hatch: 'lines', h: { color: ink.ink2, gap: 4, w: 0.5, angle: 1.4 }, line: I, seed: 3 }); ln([[-14, 10], [14, 10]], gold, 5); ln([[0, 10], [0, 26]], I, 4); break;
    case 'cleaver': shape(g, [[-4, 10], [-6, -60], [10, -96], [30, -84], [8, -50], [6, 10]], { fill: ink.light, hatch: 'lines', h: { color: ink.ink2, gap: 4, w: 0.5 }, line: I, seed: 4 }); ln([[0, 10], [0, 26]], I, 5); break;
    case 'lotus': { ln([[0, 30], [2, -30]], ink.ink2, 2.5); for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * 0.32; g.save(); g.translate(2, -34); g.rotate(a + Math.PI / 2); shape(g, blob([[0, 0], [8, -14], [0, -30], [-8, -14]], 4), { fill: i % 2 ? '#f08aa8' : '#f6b6c8', line: I, lw: 1.1, seed: i }); g.restore(); } break; }
    case 'mala': { for (let i = 0; i < 18; i++) { const a = (i / 18) * TAU; g.fillStyle = i === 0 ? ink.red : '#7a4a24'; g.beginPath(); g.arc(Math.cos(a) * 16, 22 + Math.sin(a) * 26, 3.2, 0, TAU); g.fill(); } break; }
    case 'pot': case 'kalash': { shape(g, blob([[-16, -6], [0, -12], [16, -6], [22, 18], [0, 34], [-22, 18]], 5), { fill: gold, hatch: 'lines', h: { color: I, gap: 5, w: 0.6, angle: 0 }, line: I, seed: 5 }); if (k === 'kalash') for (let i = 0; i < 3; i++) shape(g, blob([[-6 + i * 6, -12], [-2 + i * 6, -30], [2 + i * 6, -12]], 3), { fill: '#3f8a4a', line: I, lw: 1, seed: i }); else ln([[16, -2], [30, -14]], I, 3); break; }
    case 'bow': { g.beginPath(); g.moveTo(-4, -110); g.bezierCurveTo(34, -60, 34, 40, -4, 90); g.strokeStyle = I; g.lineWidth = 5; g.stroke(); g.strokeStyle = gold; g.lineWidth = 2.5; g.stroke(); ln([[-4, -110], [-4, 90]], I, 1); break; }
    case 'arrow': { ln([[0, 50], [0, -110]], '#7a4a24', 2.5); shape(g, [[0, -126], [6, -108], [-6, -108]], { fill: I }); for (const d of [-1, 1]) ln([[0, 44], [d * 7, 56]], ink.red, 2); break; }
    case 'chakra': { g.save(); g.translate(0, -30); if (glow) { g.fillStyle = 'rgba(255,190,80,0.35)'; g.beginPath(); g.arc(0, 0, 40, 0, TAU); g.fill(); } shape(g, arcPts(0, 0, 26, 26, 0, TAU, 32), { fill: gold, line: I, seed: 6 }); shape(g, arcPts(0, 0, 17, 17, 0, TAU, 28), { fill: ink.red, line: I, seed: 7 }); for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; ln([[Math.cos(a) * 5, Math.sin(a) * 5], [Math.cos(a) * 16, Math.sin(a) * 16]], gold, 2); } for (let i = 0; i < 16; i++) { const a = (i / 16) * TAU; ln([[Math.cos(a) * 26, Math.sin(a) * 26], [Math.cos(a) * 34, Math.sin(a) * 34]], ink.red, 2); } g.restore(); break; }
    case 'conch': { g.save(); g.translate(0, -26); g.rotate(-0.4); shape(g, blob([[-20, 10], [-14, -14], [6, -24], [22, -6], [16, 16], [-6, 22]], 5), { fill: '#fbf2e2', hatch: 'wave', h: { color: ink.ink2, gap: 6, w: 0.6 }, line: I, seed: 8 }); ln(arcPts(4, -6, 9, 9, 0, 4.5, 14), I, 1.2); g.restore(); break; }
    case 'mace': { ln([[0, 40], [0, -70]], I, 5); ln([[0, 40], [0, -70]], gold, 2.5); shape(g, blob([[0, -116], [18, -100], [16, -76], [0, -66], [-16, -76], [-18, -100]], 4), { fill: gold, hatch: 'dots', h: { color: I, gap: 7, w: 1 }, line: I, seed: 9 }); break; }
    case 'bell': { ln([[0, 0], [0, -20]], I, 3); shape(g, [[-18, 26], [-12, -14], [0, -24], [12, -14], [18, 26]], { fill: gold, hatch: 'lines', h: { color: I, gap: 5, w: 0.6, angle: 0 }, line: I, seed: 10 }); g.fillStyle = I; g.beginPath(); g.arc(0, 30, 4, 0, TAU); g.fill(); break; }
    case 'damru': { shape(g, [[-16, -30], [16, -30], [0, -6], [16, 18], [-16, 18], [0, -6]], { fill: '#c9874a', hatch: 'cross', h: { color: I, gap: 5, w: 0.5 }, line: I, seed: 11 }); ln([[-18, -6], [-28, 6]], I, 1.4); ln([[18, -6], [28, 6]], I, 1.4); break; }
    case 'vajra': { ln([[0, 30], [0, -50]], gold, 5); for (const d of [-1, 1]) { ln([[0, -50], [d * 12, -70], [0, -92]], gold, 3); ln([[0, 30], [d * 12, 50], [0, 72]], gold, 3); } ln([[0, -50], [0, -96]], gold, 3); break; }
    case 'noose': { g.strokeStyle = '#7a4a24'; g.lineWidth = 3; g.beginPath(); g.ellipse(0, -30, 22, 26, 0, 0, TAU); g.stroke(); ln([[0, -4], [0, 30]], '#7a4a24', 3); break; }
    case 'hook': { ln([[0, 40], [0, -70]], I, 4); g.beginPath(); g.arc(12, -70, 12, Math.PI, Math.PI * 2.2); g.strokeStyle = I; g.lineWidth = 4; g.stroke(); break; }
    case 'shield': { shape(g, arcPts(0, -10, 34, 34, 0, TAU, 32), { fill: '#7a4a24', hatch: 'scales', h: { color: gold, gap: 9, w: 1 }, line: I, seed: 12 }); for (let i = 0; i < 4; i++) { const a = (i / 4) * TAU + 0.6; g.fillStyle = gold; g.beginPath(); g.arc(Math.cos(a) * 18, -10 + Math.sin(a) * 18, 3.5, 0, TAU); g.fill(); } break; }
    case 'skull': { shape(g, blob([[-14, -6], [0, -18], [14, -6], [10, 10], [-10, 10]], 4), { fill: '#f4ead2', line: I, seed: 13 }); g.fillStyle = I; g.beginPath(); g.arc(-5, -4, 3, 0, TAU); g.arc(5, -4, 3, 0, TAU); g.fill(); break; }
    case 'book': { shape(g, [[-26, -16], [26, -16], [26, 10], [-26, 10]], { fill: '#e8cf96', hatch: 'lines', h: { color: '#7a4a24', gap: 4, w: 0.6, angle: 0 }, line: I, seed: 14 }); ln([[-10, -16], [-10, 10]], ink.red, 3); ln([[10, -16], [10, 10]], ink.red, 3); break; }
    case 'fire': { for (const [c, h, w] of [[ink.red, 70, 26], [ink.accent, 50, 18], ['#ffd65a', 30, 10]] as [string, number, number][]) { g.fillStyle = c; g.beginPath(); g.moveTo(0, 10); g.bezierCurveTo(w, -h * 0.2, w * 0.6, -h * 0.7, 0, -h); g.bezierCurveTo(-w * 0.6, -h * 0.7, -w, -h * 0.2, 0, 10); g.fill(); } break; }
    case 'abhaya': case 'varada': case 'none': break;
  }
  g.restore();
}

/* ───────── the goddess ───────── */

function hand(g: G, ink: Ink, skin: string, R: () => number, kind: Hold) {
  const open = kind === 'abhaya' || kind === 'varada';
  if (open) {
    g.save(); if (kind === 'varada') g.rotate(Math.PI);
    shape(g, [[-9, 8], [-11, -10], [-9, -24], [-4, -26], [-2, -14], [1, -28], [5, -28], [6, -14], [9, -24], [12, -20], [11, -2], [9, 8]], { fill: skin, line: ink.dark, lw: 1.2, seed: 21 });
    g.fillStyle = ink.red; g.beginPath(); g.arc(0, -6, 3, 0, TAU); g.fill();
    g.restore();
  } else shape(g, blob([[-9, -6], [0, -12], [10, -5], [9, 8], [-8, 8]], 3), { fill: skin, line: ink.dark, lw: 1.2, seed: 22 });
  void R;
}

/** A pair of eyes, brows, nose, lips; calm, smiling or fierce. */
function face(g: G, d: Devi, R: () => number) {
  const ink = d.ink, I = ink.dark, fierce = d.mood === 'fierce';
  // eyes: long almonds with kohl wings
  for (const sx of [-1, 1]) {
    g.save(); g.translate(sx * 18, -4); g.scale(sx, 1);
    const w = fierce ? 16 : 18, h = fierce ? 9 : 6;
    shape(g, [[-w, 0], [-w * 0.3, -h], [w * 0.6, -h * 0.8], [w, 0], [w * 1.5, -2], [w * 0.4, h * 0.9], [-w * 0.4, h * 0.7]], { fill: '#fdf8ee', line: I, lw: 1.5, seed: 30 });
    g.fillStyle = I; g.beginPath(); g.arc(fierce ? 0 : 2, 0, fierce ? 6 : 5, 0, TAU); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(3, -2, 1.4, 0, TAU); g.fill();
    pen(g, curve([[-w, -10], [0, fierce ? -20 : -16], [w * 1.2, fierce ? -8 : -12]], 4), I, fierce ? 3 : 2.2, R, 0.3);
    g.restore();
  }
  // third eye
  g.save(); g.translate(0, -26); shape(g, blob([[0, -9], [5, 0], [0, 9], [-5, 0]], 3), { fill: fierce ? ink.red : '#fdf8ee', line: I, lw: 1.2, seed: 31 }); g.fillStyle = fierce ? '#ffd65a' : ink.red; g.beginPath(); g.arc(0, 0, 2.4, 0, TAU); g.fill(); g.restore();
  // nose, nose ring
  pen(g, [[-2, 2], [-4, 20], [2, 24]], I, 1.4, R, 0.3);
  g.strokeStyle = ink.accent; g.lineWidth = 1.8; g.beginPath(); g.arc(-6, 24, 6, 0, TAU); g.stroke();
  // mouth
  if (fierce) {
    shape(g, blob([[-14, 34], [0, 30], [14, 34], [8, 46], [-8, 46]], 3), { fill: '#5a0a12', line: I, lw: 1.5, seed: 32 });
    g.fillStyle = '#fff'; for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(sx * 9, 34); g.lineTo(sx * 6, 42); g.lineTo(sx * 4, 34); g.fill(); }
    if (d.tongue) shape(g, blob([[-7, 40], [7, 40], [6, 70], [0, 78], [-6, 70]], 3), { fill: ink.red, line: I, lw: 1.3, seed: 33 });
  } else {
    shape(g, [[-10, 36], [-3, 33], [0, 35], [3, 33], [10, 36], [4, 41], [-4, 41]], { fill: ink.red, line: I, lw: 1.1, seed: 34 });
    if (d.mood === 'smile') pen(g, curve([[-14, 33], [0, 40], [14, 33]], 4), I, 1, R, 0.2);
  }
}

/** Draw the goddess, base at (0,0), 600 tall when standing. */
export function devi(g: G, d: Devi) {
  const ink = d.ink, I = ink.dark, R = rng(d.seed ?? 5), t = d.t ?? 0;
  const seat = d.seat ?? 'stand', ride = seat === 'ride' || seat === 'lotus';
  const breathe = Math.sin(t * 1.4) * 1.5;
  g.save();
  if (d.lean) g.rotate(d.lean);
  const headY = -500 + breathe, shY = -425 + breathe, waistY = -330, hipY = -300, footY = ride ? -110 : 0;

  // hair behind
  if (d.crown === 'wild') {
    for (let i = 0; i < 26; i++) { const a = -Math.PI / 2 + (i / 25 - 0.5) * 3.2, l = 120 + R() * 90, sw = Math.sin(t * 2 + i) * 6; pen(g, curve([[0, headY], [Math.cos(a) * l * 0.5 + sw, headY + Math.sin(a) * l * 0.5], [Math.cos(a) * l + sw * 2, headY + Math.sin(a) * l + 30]], 4), I, 7 + R() * 5, R, 1); }
  } else {
    shape(g, blob([[-58, headY - 20], [0, headY - 70], [58, headY - 20], [70, shY + 40], [40, waistY], [-40, waistY], [-70, shY + 40]], 6), { fill: I, hatch: 'wave', h: { color: ink.ink2, gap: 7, w: 0.7, angle: 1.5 }, seed: 40 });
  }

  // arms behind the body: the upper pairs fan out
  const pairs = Math.max(1, Math.floor(d.hands.length / 2));
  const armAt = (idx: number) => {
    const p = Math.floor(idx / 2), side = idx % 2 === 0 ? -1 : 1; // right hand (viewer's left) first
    const u = pairs === 1 ? 0 : p / (pairs - 1);
    let a = pairs === 1 ? 0.35 : lerp(0.35, 2.55, u); // 0 = straight down, π = straight up
    if (p === 0 && pairs > 1) a = 0.25;
    if (d.strike && d.strike.i === idx) a = d.strike.a;
    const sway = Math.sin(t * 1.2 + idx) * 0.04;
    return { side, a: a + sway, p };
  };
  const drawArm = (idx: number) => {
    const { side, a, p } = armAt(idx);
    const sx = side * (52 - p * 2), sy = shY + 14 + p * 4;
    const L1 = 92, L2 = 86;
    const ex = sx + side * Math.sin(a) * L1, ey = sy + Math.cos(a) * L1;
    const a2 = a + (p === 0 ? (idx % 2 ? -0.9 : -0.9) : 0.35);
    const hx = ex + side * Math.sin(a2) * L2, hy = ey + Math.cos(a2) * L2;
    const arm = band(curve([[sx, sy], [ex, ey], [hx, hy]], 6), 24, 15);
    shape(g, arm, { fill: d.skin, hatch: 'lines', h: { color: I, gap: 6, w: 0.5, alpha: 0.35, angle: a }, line: I, lw: 1.5, seed: 50 + idx });
    for (const k of [0.35, 0.92]) { const q = curve([[sx, sy], [ex, ey], [hx, hy]], 6), i = Math.floor(k * (q.length - 1)); g.fillStyle = ink.accent; g.beginPath(); g.ellipse(q[i][0], q[i][1], 11, 4, a2 * side, 0, TAU); g.fill(); }
    g.save(); g.translate(hx, hy); g.rotate(side * Math.max(-0.35, Math.min(0.5, (a2 - 1.4) * 0.3)));
    const k = d.hands[idx];
    if (k !== 'abhaya' && k !== 'varada') holdThing(g, k, ink, R, 0.9, true);
    hand(g, ink, d.skin, R, k);
    g.restore();
  };
  // draw the raised arms behind the body first
  for (let i = d.hands.length - 1; i >= 2; i--) drawArm(i);

  // skirt (lehenga) in bands
  const skirt: Pt[] = ride ? [[-70, hipY], [70, hipY], [150, footY], [-150, footY]] : [[-70, hipY], [70, hipY], [150, -20], [140, footY], [-140, footY], [-150, -20]];
  shape(g, skirt, { fill: d.sari });
  const bands = d.bands ?? ['lines', 'dots', 'chevron', 'wave', 'diamonds'];
  const top = hipY, bot = footY;
  bands.forEach((b, i) => {
    const y0 = lerp(top, bot, i / bands.length), y1 = lerp(top, bot, (i + 1) / bands.length);
    const wAt = (y: number) => lerp(70, 150, (y - top) / (bot - top));
    const strip: Pt[] = [[-wAt(y0), y0], [wAt(y0), y0], [wAt(y1), y1], [-wAt(y1), y1]];
    hatch(g, strip, b, { color: i % 2 ? d.sari2 : I, gap: b === 'lines' ? 4 : 10, w: 0.9, angle: b === 'lines' ? 1.5 : 0, seed: 60 + i, color2: ink.red, alpha: 0.85 });
    pen(g, [[-wAt(y1), y1], [wAt(y1), y1]], ink.accent, 2.4, R, 0.6);
  });
  pen(g, skirt, I, 1.8, R, 0.8, true);
  // border
  hatch(g, [[-150, footY - 22], [150, footY - 22], [150, footY], [-150, footY]], 'beads', { color: ink.accent, gap: 8, w: 1.4, color2: ink.red });
  // feet (standing) or the hanging foot (riding)
  if (!ride) for (const sx of [-1, 1]) { shape(g, blob([[sx * 30 - 16, -4], [sx * 30, -14], [sx * 30 + 18, -6], [sx * 30 + 20, 6], [sx * 30 - 18, 6]], 3), { fill: d.skin, line: I, lw: 1.2, seed: 70 }); g.fillStyle = ink.red; g.fillRect(sx * 30 - 16, 2, 34, 3); }
  else { shape(g, band(curve([[60, footY - 6], [90, footY + 40], [96, footY + 90]], 5), 30, 22), { fill: d.skin, line: I, lw: 1.3, seed: 71 }); shape(g, blob([[84, footY + 86], [110, footY + 88], [112, footY + 100], [82, footY + 100]], 3), { fill: d.skin, line: I, seed: 72 }); }

  // torso: blouse, midriff, the pallu across
  shape(g, [[-56, shY + 4], [56, shY + 4], [48, waistY], [-48, waistY]], { fill: d.skin, line: I, lw: 1.5, seed: 80 });
  shape(g, blob([[-54, shY + 6], [0, shY - 4], [54, shY + 6], [46, shY + 66], [0, shY + 74], [-46, shY + 66]], 4), { fill: d.blouse, hatch: 'cross', h: { color: I, gap: 5, w: 0.5, alpha: 0.5 }, line: I, lw: 1.4, seed: 81 });
  const pallu: Pt[] = [[34, shY - 2], [58, shY + 10], [-20, waistY + 4], [-58, waistY - 4]];
  shape(g, pallu, { fill: d.sari, hatch: 'stitch', h: { color: d.sari2, gap: 6, w: 0.8, angle: 0.8 }, line: I, lw: 1.4, seed: 82 });
  g.fillStyle = 'rgba(0,0,0,0)';
  // the two lower arms in front
  drawArm(0); if (d.hands.length > 1) drawArm(1);

  // garland
  if (d.garland === 'skulls') for (let i = 0; i < 11; i++) { const u = i / 10, x = lerp(-48, 48, u), y = shY + 20 + Math.sin(u * Math.PI) * 120; g.save(); g.translate(x, y); g.scale(0.7, 0.7); holdThing(g, 'skull', ink, R); g.restore(); }
  else if (d.garland !== 'none') for (let i = 0; i < 16; i++) { const u = i / 15, x = lerp(-50, 50, u), y = shY + 16 + Math.sin(u * Math.PI) * 130; g.fillStyle = i % 2 ? ink.red : '#f2a23a'; g.beginPath(); g.arc(x, y, 6, 0, TAU); g.fill(); g.strokeStyle = I; g.lineWidth = 0.8; g.stroke(); }
  // necklace
  pen(g, curve([[-26, shY - 10], [0, shY + 18], [26, shY - 10]], 6), ink.accent, 4, R, 0.4);

  // neck, head
  shape(g, [[-14, headY + 40], [14, headY + 40], [16, shY + 4], [-16, shY + 4]], { fill: d.skin, line: I, lw: 1.2, seed: 90 });
  g.save(); g.translate(0, headY);
  shape(g, blob([[0, -50], [38, -30], [42, 10], [24, 46], [0, 54], [-24, 46], [-42, 10], [-38, -30]], 5), { fill: d.skin, hatch: 'stipple', h: { color: I, gap: 9, w: 0.5, alpha: 0.3 }, line: I, lw: 1.6, seed: 91 });
  // earrings
  for (const sx of [-1, 1]) { g.fillStyle = ink.accent; g.beginPath(); g.arc(sx * 42, 22, 7, 0, TAU); g.fill(); g.strokeStyle = I; g.lineWidth = 1; g.stroke(); g.beginPath(); g.arc(sx * 42, 34, 4, 0, TAU); g.fillStyle = ink.red; g.fill(); }
  // hair parting
  if (d.crown !== 'wild') shape(g, blob([[-40, -20], [0, -54], [40, -20], [30, -34], [0, -44], [-30, -34]], 4), { fill: I, seed: 92 });
  face(g, d, R);
  // crown
  if (d.crown === 'mukut' || d.crown === 'bell' || d.crown === undefined) {
    const cr: Pt[] = [[-44, -36], [-40, -78], [-24, -92], [-14, -120], [0, -150], [14, -120], [24, -92], [40, -78], [44, -36]];
    shape(g, cr, { fill: ink.accent, hatch: 'diamonds', h: { color: I, gap: 10, w: 1 }, line: I, lw: 1.8, seed: 93 });
    pen(g, [[-44, -46], [44, -46]], ink.red, 4, R, 0.5);
    g.fillStyle = ink.red; g.beginPath(); g.arc(0, -96, 7, 0, TAU); g.fill();
    for (const sx of [-1, 1]) { g.fillStyle = '#3f8a4a'; g.beginPath(); g.arc(sx * 22, -66, 4, 0, TAU); g.fill(); }
  } else if (d.crown === 'jata') {
    shape(g, blob([[-30, -40], [-20, -96], [0, -112], [20, -96], [30, -40]], 4), { fill: I, hatch: 'wave', h: { color: ink.ink2, gap: 6, w: 0.7 }, line: I, seed: 94 });
    for (let i = 0; i < 5; i++) { g.fillStyle = '#fbf2e2'; g.beginPath(); g.arc(-16 + i * 8, -60 - (i % 2) * 8, 3, 0, TAU); g.fill(); }
  } else if (d.crown === 'veil') {
    shape(g, blob([[-56, 20], [-50, -40], [0, -70], [50, -40], [56, 20], [40, -20], [0, -50], [-40, -20]], 5), { fill: d.sari, hatch: 'stitch', h: { color: d.sari2, gap: 6, w: 0.8 }, line: I, seed: 95 });
  }
  if (d.moon) crescent(g, 0, d.crown === 'bell' ? -120 : -60, d.crown === 'bell' ? 24 : 16, Math.PI, '#fbf2e2', 3);
  if (d.crown === 'bell') { g.save(); g.translate(0, -112); holdThing(g, 'bell', ink, R, 0.7); g.restore(); }
  g.restore();

  // the child on her lap (Skandamata)
  if (d.child) {
    g.save(); g.translate(-20, waistY + 20);
    shape(g, blob([[-30, 0], [0, -20], [30, 0], [28, 50], [-28, 50]], 4), { fill: ink.accent, hatch: 'dots', h: { color: I, gap: 7, w: 1 }, line: I, seed: 96 });
    shape(g, blob([[-20, -40], [0, -60], [20, -40], [16, -16], [-16, -16]], 4), { fill: '#f0b48a', line: I, seed: 97 });
    for (const sx of [-1, 1]) { g.fillStyle = I; g.beginPath(); g.arc(sx * 7, -38, 2.4, 0, TAU); g.fill(); }
    shape(g, [[-14, -58], [-8, -82], [0, -72], [8, -82], [14, -58]], { fill: ink.accent, line: I, seed: 98 });
    g.restore();
  }
  g.restore();
}

/* ───────── mounts ───────── */

export type Mount = 'lion' | 'tiger' | 'bull' | 'donkey' | 'lotus' | 'none';

/** A mount in profile, facing right, feet at y = 0; about 420 long. Returns the seat point. */
export function mount(g: G, k: Mount, ink: Ink, t = 0, seed = 3, o: { roar?: number; white?: boolean } = {}): Pt {
  const R = rng(seed), I = ink.dark;
  if (k === 'none') return [0, 0];
  if (k === 'lotus') {
    for (let row = 0; row < 3; row++) for (let i = 0; i < 9 - row * 2; i++) { const u = (i + 0.5) / (9 - row * 2), x = lerp(-150 + row * 30, 150 - row * 30, u); g.save(); g.translate(x, -row * 22); g.rotate((u - 0.5) * 1.2); shape(g, blob([[0, 0], [16, -28], [0, -62], [-16, -28]], 4), { fill: row % 2 ? '#f6b6c8' : '#f08aa8', hatch: 'lines', h: { color: ink.red, gap: 4, w: 0.5, angle: 1.57 }, line: I, lw: 1.2, seed: i + row * 9 }); g.restore(); }
    return [0, -40];
  }
  const leg = (x: number, ph: number, front: boolean) => {
    const sw = Math.sin(t * 2 + ph) * 3, kx = x + (front ? 8 : -10);
    const pts = band(curve([[x, -150], [kx + sw, -70], [x + (front ? 4 : -2) + sw, -10]], 5), front ? 46 : 52, 22);
    shape(g, pts, { fill: body, hatch: hk, h: { color: k === 'tiger' ? I : ink.ink2, gap: k === 'tiger' ? 14 : 6, w: k === 'tiger' ? 4 : 0.6, alpha: 0.6, angle: 1.4 }, line: I, lw: 1.3, seed: 100 + x });
    shape(g, blob([[x - 16 + sw, -14], [x + 18 + sw, -14], [x + 24 + sw, 0], [x - 16 + sw, 2]], 3), { fill: k === 'bull' || k === 'donkey' ? I : body, line: I, lw: 1.2, seed: 120 + x });
    if (k === 'lion' || k === 'tiger') for (let c = 0; c < 3; c++) pen(g, [[x - 6 + c * 9 + sw, -6], [x - 6 + c * 9 + sw, 1]], I, 1, R, 0.2);
  };
  const white = o.white || k === 'bull';
  const body = k === 'tiger' ? '#e8902c' : k === 'lion' ? '#e7b04a' : k === 'donkey' ? '#8a8494' : white ? '#f7f1e2' : '#e7b04a';
  const hk: Hatch = k === 'tiger' ? 'lines' : 'stipple';
  // far legs
  leg(-150, 1, false); leg(120, 2.4, true);
  // body: rump, haunch, back, shoulder, chest, belly
  const torso = blob([[-205, -140], [-175, -210], [-40, -198], [90, -222], [168, -196], [182, -130], [110, -96], [-20, -108], [-130, -100], [-200, -108]], 6);
  shape(g, torso, { fill: body, hatch: k === 'tiger' ? 'lines' : 'stipple', h: { color: k === 'tiger' ? I : ink.ink2, gap: k === 'tiger' ? 16 : 7, w: k === 'tiger' ? 5 : 0.7, angle: 1.5, alpha: k === 'tiger' ? 0.85 : 0.4 }, line: I, lw: 1.8, seed: seed + 1 });
  pen(g, curve([[-170, -180], [-140, -150], [-150, -110]], 4), I, 1.2, R, 0.3);
  if (k === 'bull') { shape(g, blob([[50, -210], [90, -262], [140, -214]], 4), { fill: body, line: I, seed: 4 }); hatch(g, torso, 'beads', { color: ink.red, gap: 26, w: 2, alpha: 0.6 }); }
  // tail
  pen(g, curve([[-185, -150], [-230, -170], [-250, -230], [-232, -262]], 5), I, 4, R, 0.6);
  if (k === 'lion' || k === 'tiger') shape(g, blob([[-238, -262], [-226, -284], [-216, -262]], 3), { fill: I });
  // near legs
  leg(-118, 0, false); leg(150, 3.3, true);
  // head
  g.save(); g.translate(170, -190);
  if (k === 'lion') {
    const roar = o.roar ?? 0;
    for (let i = 0; i < 20; i++) { const a = (i / 20) * TAU, l = 62 + (i % 2) * 14 + Math.sin(t * 3 + i) * 3; shape(g, blob([[0, 0], [Math.cos(a - 0.15) * l * 0.7, Math.sin(a - 0.15) * l * 0.7], [Math.cos(a) * l, Math.sin(a) * l], [Math.cos(a + 0.15) * l * 0.7, Math.sin(a + 0.15) * l * 0.7]], 2), { fill: i % 2 ? '#b8661c' : '#d0862a', hatch: 'lines', h: { color: I, gap: 4, w: 0.5, angle: a }, line: I, lw: 1, seed: i }); }
    shape(g, blob([[-20, -30], [30, -34], [56, -6], [60, 18 + roar * 10], [20, 34 + roar * 10], [-20, 20]], 5), { fill: '#e7b04a', line: I, lw: 1.6, seed: 5 });
    g.fillStyle = I; g.beginPath(); g.arc(28, -12, 4, 0, TAU); g.fill();
    shape(g, blob([[50, 0], [62, 6], [56, 14]], 2), { fill: I });
    if (roar > 0.1) { shape(g, [[30, 20], [62, 18], [56, 30 + roar * 14], [26, 34 + roar * 10]], { fill: '#5a0a12', line: I }); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(52, 18); g.lineTo(54, 26); g.lineTo(58, 18); g.fill(); }
    for (let i = 0; i < 3; i++) pen(g, [[48, 16 + i * 4], [74, 12 + i * 6]], I, 0.8, R, 0.2);
  } else if (k === 'tiger') {
    shape(g, blob([[-30, -30], [20, -40], [58, -10], [62, 20], [20, 34], [-30, 22]], 5), { fill: '#e8902c', hatch: 'lines', h: { color: I, gap: 12, w: 4, angle: 0.2, alpha: 0.85 }, line: I, lw: 1.6, seed: 6 });
    for (const ex of [-14, 10]) shape(g, [[ex, -34], [ex + 8, -54], [ex + 16, -34]], { fill: '#e8902c', line: I, seed: 7 });
    shape(g, blob([[20, 14], [62, 14], [60, 28], [24, 30]], 3), { fill: '#fbf2e2', line: I, seed: 8 });
    g.fillStyle = '#3f8a4a'; g.beginPath(); g.arc(26, -10, 5, 0, TAU); g.fill(); g.fillStyle = I; g.beginPath(); g.arc(27, -10, 2.2, 0, TAU); g.fill();
  } else if (k === 'bull') {
    shape(g, blob([[-20, -24], [30, -30], [70, 0], [74, 30], [40, 40], [-10, 20]], 5), { fill: '#f7f1e2', hatch: 'stipple', h: { color: ink.ink2, gap: 8, w: 0.6, alpha: 0.4 }, line: I, lw: 1.6, seed: 9 });
    for (const d of [-1, 1]) pen(g, curve([[10 + d * 6, -24], [d * 30, -60], [d * 18, -82]], 4), ink.accent, 5, R, 0.4);
    g.fillStyle = I; g.beginPath(); g.arc(30, -6, 4, 0, TAU); g.fill();
    for (let i = 0; i < 6; i++) { g.fillStyle = i % 2 ? ink.red : ink.accent; g.beginPath(); g.arc(-10 + i * 6, 30 + i * 3, 5, 0, TAU); g.fill(); }
  } else if (k === 'donkey') {
    shape(g, blob([[-20, -24], [30, -30], [80, 10], [80, 34], [40, 36], [-10, 20]], 5), { fill: '#8a8494', hatch: 'stipple', h: { color: I, gap: 7, w: 0.6, alpha: 0.5 }, line: I, lw: 1.6, seed: 10 });
    for (const ex of [-6, 10]) shape(g, blob([[ex, -24], [ex + 6, -86], [ex + 14, -24]], 3), { fill: '#8a8494', line: I, seed: 11 });
    g.fillStyle = I; g.beginPath(); g.arc(30, -4, 4, 0, TAU); g.fill();
    pen(g, curve([[-30, -30], [-10, -40], [10, -30]], 4), I, 5, R, 0.6);
  }
  g.restore();
  return [-20, -205];
}

/* ───────── enemies ───────── */

export interface Asura { ink: Ink; skin?: string; crown?: boolean; horns?: boolean; hold?: [Hold, Hold]; seed?: number; t?: number; fall?: number; tint?: string; scale?: number }

/** A demon warrior, frontal, 520 tall: broad, moustached, crowned or horned, with sword and shield. */
export function asura(g: G, a: Asura) {
  const ink = a.ink, I = ink.dark, R = rng(a.seed ?? 9), t = a.t ?? 0, skin = a.skin ?? '#5b6aa0';
  g.save();
  if (a.fall) { g.rotate(a.fall * 1.3); g.globalAlpha *= 1 - a.fall * 0.3; }
  const swing = Math.sin(t * 3) * 0.2;
  // legs
  for (const sx of [-1, 1]) shape(g, band(curve([[sx * 40, -250], [sx * 60, -120], [sx * 54, 0]], 4), 50, 34), { fill: skin, hatch: 'lines', h: { color: I, gap: 6, w: 0.6, alpha: 0.4 }, line: I, lw: 1.6, seed: 10 + sx });
  // dhoti
  shape(g, [[-80, -300], [80, -300], [96, -170], [0, -200], [-96, -170]], { fill: a.tint ?? ink.red, hatch: 'zig', h: { color: I, gap: 9, w: 1 }, line: I, lw: 1.6, seed: 12 });
  // body
  shape(g, blob([[-90, -430], [0, -450], [90, -430], [80, -330], [60, -290], [-60, -290], [-80, -330]], 5), { fill: skin, hatch: 'cross', h: { color: I, gap: 7, w: 0.5, alpha: 0.4 }, line: I, lw: 1.8, seed: 13 });
  // arms with weapons
  const holds = a.hold ?? ['sword', 'shield'];
  for (const [i, sx] of [[0, -1], [1, 1]] as [number, number][]) {
    const ang = (sx < 0 ? 2.4 + swing : 0.6 - swing * 0.5);
    const ex = sx * 90 + sx * Math.sin(ang) * 80, ey = -420 + Math.cos(ang) * 80, hx = ex + sx * Math.sin(ang + 0.4) * 70, hy = ey + Math.cos(ang + 0.4) * 70;
    shape(g, band(curve([[sx * 84, -420], [ex, ey], [hx, hy]], 5), 34, 22), { fill: skin, hatch: 'lines', h: { color: I, gap: 6, w: 0.5, alpha: 0.4 }, line: I, lw: 1.6, seed: 14 + i });
    g.save(); g.translate(hx, hy); if (holds[i] !== 'shield') g.rotate(sx * (Math.PI - ang) * 0.6); holdThing(g, holds[i], ink, R, 1.2); g.restore();
  }
  // head
  g.save(); g.translate(0, -500);
  shape(g, blob([[-40, -40], [0, -54], [40, -40], [46, 10], [26, 44], [-26, 44], [-46, 10]], 5), { fill: skin, line: I, lw: 1.8, seed: 15 });
  for (const sx of [-1, 1]) { shape(g, [[sx * 8, -10], [sx * 28, -16], [sx * 34, -4], [sx * 10, 2]], { fill: '#fff', line: I, lw: 1.2, seed: 16 }); g.fillStyle = ink.red; g.beginPath(); g.arc(sx * 20, -8, 4, 0, TAU); g.fill(); pen(g, [[sx * 6, -22], [sx * 36, -30]], I, 4, R, 0.3); }
  // moustache, fangs
  pen(g, curve([[-34, 26], [-14, 14], [0, 18], [14, 14], [34, 26]], 4), I, 6, R, 0.4);
  g.fillStyle = '#fff'; for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(sx * 8, 26); g.lineTo(sx * 10, 40); g.lineTo(sx * 14, 26); g.fill(); }
  if (a.horns) for (const sx of [-1, 1]) pen(g, curve([[sx * 30, -36], [sx * 60, -60], [sx * 56, -96]], 4), '#f4ead2', 9, R, 0.3);
  if (a.crown !== false) shape(g, [[-40, -36], [-34, -80], [-18, -66], [0, -96], [18, -66], [34, -80], [40, -36]], { fill: ink.accent, hatch: 'dots', h: { color: I, gap: 8, w: 1 }, line: I, lw: 1.6, seed: 17 });
  g.restore();
  g.restore();
}

/** The buffalo, Mahisha, in profile facing left (towards the goddess). */
export function buffalo(g: G, ink: Ink, t = 0, o: { charge?: number; head?: boolean } = {}) {
  const I = ink.dark, R = rng(31), ch = o.charge ?? 0;
  g.save(); g.scale(-1, 1);
  const body = '#2e2a34';
  const leg = (x: number, ph: number) => { const sw = Math.sin(t * 6 * (ch + 0.2) + ph) * 10 * ch; shape(g, band(curve([[x, -120], [x + sw, -60], [x + sw * 1.4, 0]], 4), 34, 22), { fill: body, hatch: 'cross', h: { color: '#6a6474', gap: 4, w: 0.6 }, line: I, lw: 1.3, seed: x }); };
  leg(-140, 1); leg(110, 2);
  const torso = blob([[-190, -160], [-120, -230], [60, -250], [150, -210], [180, -140], [130, -100], [-120, -100], [-190, -110]], 6);
  shape(g, torso, { fill: body, hatch: 'cross', h: { color: '#6a6474', gap: 4, w: 0.6, angle: 0.6 }, line: I, lw: 1.8, seed: 32 });
  pen(g, curve([[-190, -150], [-226, -150], [-240, -100]], 4), I, 4, R, 0.5);
  leg(-110, 0); leg(140, 3);
  shape(g, blob([[0, -236], [70, -280], [140, -230]], 4), { fill: body, hatch: 'cross', h: { color: '#6a6474', gap: 4, w: 0.6 }, line: I, seed: 34 });
  if (o.head !== false) {
    g.save(); g.translate(175, -160); g.rotate(-0.1 - ch * 0.25); g.scale(1.45, 1.45);
    shape(g, blob([[-30, -40], [30, -46], [80, -10], [90, 30], [50, 50], [-10, 30]], 5), { fill: body, hatch: 'cross', h: { color: '#6a6474', gap: 4, w: 0.6 }, line: I, lw: 1.6, seed: 33 });
    for (const d of [0, 1]) shape(g, band(curve([[0 + d * 30, -38], [-30 + d * 30, -86], [-90 + d * 20, -96], [-120 + d * 16, -66]], 6), 20, 6), { fill: '#e8dcc0', hatch: 'rule', h: { color: '#8a7a5a', gap: 5, w: 0.6, angle: 0 }, line: I, lw: 1.2, seed: 35 + d });
    g.fillStyle = ink.red; g.beginPath(); g.arc(40, -12, 6, 0, TAU); g.fill();
    for (let i = 0; i < 3; i++) { const ph = (t * 1.5 + i / 3) % 1; g.globalAlpha = (1 - ph) * 0.6 * ch; g.fillStyle = '#c9c0d0'; g.beginPath(); g.arc(96 + ph * 40, 34 + i * 4, 6 + ph * 10, 0, TAU); g.fill(); }
    g.globalAlpha = 1;
    g.restore();
  }
  g.restore();
}

/** An elephant in profile facing left, for Mahisha's elephant form. */
export function elephantForm(g: G, ink: Ink, t = 0, trunkCut = 0) {
  const I = ink.dark;
  g.save(); g.scale(-1, 1);
  const body = '#6a6474';
  for (const x of [-120, 100]) shape(g, [[x - 26, -140], [x + 26, -140], [x + 24, 0], [x - 24, 0]], { fill: body, hatch: 'lines', h: { color: I, gap: 6, w: 0.6 }, line: I, seed: x });
  shape(g, blob([[-180, -150], [-120, -280], [60, -300], [170, -230], [170, -150], [-160, -120]], 6), { fill: body, hatch: 'lines', h: { color: I, gap: 7, w: 0.6, angle: 1.4, alpha: 0.6 }, line: I, lw: 1.8, seed: 41 });
  shape(g, blob([[120, -280], [70, -220], [110, -150], [160, -200]], 4), { fill: '#8a8494', line: I, seed: 42 });
  const tr = trunkCut > 0.5 ? curve([[200, -220], [230, -160], [236, -120]], 4) : curve([[200, -220], [236, -150], [230, -60], [200 + Math.sin(t * 2) * 10, -30]], 5);
  shape(g, band(tr, 46, 20), { fill: body, hatch: 'rule', h: { color: I, gap: 7, w: 0.6, angle: 0 }, line: I, lw: 1.6, seed: 43 });
  pen(g, curve([[190, -180], [230, -170], [250, -200]], 4), '#f4ead2', 8, rng(1), 0.3);
  g.fillStyle = I; g.beginPath(); g.arc(180, -240, 5, 0, TAU); g.fill();
  g.restore();
}

/** Vishnu asleep on the serpent Shesha on the cosmic ocean, lying along x, ~600 wide. */
export function sleepingVishnu(g: G, ink: Ink, t = 0, awake = 0) {
  const I = ink.dark, R = rng(51);
  // coils
  for (let i = 3; i >= 0; i--) shape(g, arcPts(0, -20 - i * 22, 300 - i * 16, 26, 0, TAU, 40), { fill: '#2e8a7a', hatch: 'scales', h: { color: '#f4ead2', gap: 10, w: 0.8 }, line: I, lw: 1.6, seed: i });
  // hoods
  for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * 0.32, hx = -290 + Math.cos(a) * 80, hy = -160 + Math.sin(a) * 90; g.save(); g.translate(hx, hy); g.rotate(a + Math.PI / 2); shape(g, blob([[0, 30], [-22, 0], [-16, -30], [0, -40], [16, -30], [22, 0]], 4), { fill: '#2e8a7a', hatch: 'scales', h: { color: '#f4ead2', gap: 8, w: 0.7 }, line: I, seed: i + 10 }); g.fillStyle = I; g.beginPath(); g.arc(-6, -22, 2.4, 0, TAU); g.arc(6, -22, 2.4, 0, TAU); g.fill(); g.restore(); }
  // the Lord lying: a long blue figure with a yellow cloth
  const body = blob([[-250, -120], [-150, -150], [50, -140], [240, -120], [250, -96], [40, -100], [-160, -100], [-250, -100]], 6);
  shape(g, body, { fill: '#3f6fd0', hatch: 'lines', h: { color: I, gap: 6, w: 0.5, alpha: 0.35, angle: 0 }, line: I, lw: 1.6, seed: 52 });
  shape(g, [[-60, -146], [180, -132], [190, -102], [-60, -100]], { fill: '#f2b52a', hatch: 'dots', h: { color: ink.red, gap: 9, w: 1.2 }, line: I, seed: 53 });
  g.save(); g.translate(-240, -150);
  shape(g, blob([[-30, -20], [0, -38], [30, -20], [30, 20], [0, 30], [-30, 20]], 4), { fill: '#3f6fd0', line: I, lw: 1.6, seed: 54 });
  shape(g, [[-22, -30], [-16, -70], [0, -86], [16, -70], [22, -30]], { fill: ink.accent, hatch: 'diamonds', h: { color: I, gap: 8, w: 0.8 }, line: I, seed: 55 });
  for (const sx of [-1, 1]) { if (awake > 0.5) { g.fillStyle = '#fff'; g.beginPath(); g.ellipse(sx * 11, -4, 7, 4, 0, 0, TAU); g.fill(); g.fillStyle = I; g.beginPath(); g.arc(sx * 11, -4, 2.5, 0, TAU); g.fill(); } else pen(g, curve([[sx * 4, -4], [sx * 11, 0], [sx * 18, -4]], 3), I, 1.8, R, 0.2); }
  g.restore();
  void t;
}

/** Brahma on a lotus: small, four-faced (three seen), seated. */
export function brahma(g: G, ink: Ink, t = 0, fear = 0) {
  const I = ink.dark, R = rng(61);
  mount(g, 'lotus', ink, t, 4);
  g.save(); g.translate(0, -50); g.scale(0.4, 0.4);
  devi(g, { ink, skin: '#e8a060', sari: ink.red, sari2: ink.accent, blouse: ink.accent, hands: ['book', 'kalash', 'mala', 'lotus'], crown: 'mukut', seat: 'lotus', seed: 7, mood: fear > 0.5 ? 'fierce' : 'calm', garland: 'none' });
  g.restore();
  for (const sx of [-1, 1]) { g.save(); g.translate(sx * 26, -232); shape(g, blob([[-14, -14], [0, -20], [14, -14], [12, 12], [-12, 12]], 3), { fill: '#e8a060', line: I, lw: 1, seed: 62 + sx }); g.restore(); }
  pen(g, curve([[-6, -250], [0, -236], [6, -250]], 3), '#f4ead2', 3, R, 0.2);
}

/** A matrika's emblem mount, small: swan, bull, peacock, eagle, boar, lion, elephant. */
export function matrikaMount(g: G, k: string, ink: Ink) {
  const I = ink.dark;
  switch (k) {
    case 'swan': shape(g, blob([[-40, 0], [20, -6], [40, -30], [30, -70], [44, -76], [50, -30], [40, 10], [-30, 14]], 5), { fill: '#fbf2e2', hatch: 'scales', h: { color: ink.ink2, gap: 8, w: 0.6 }, line: I, seed: 1 }); break;
    case 'peacock': shape(g, blob([[-50, -10], [0, -40], [40, -20], [30, -70], [40, -80], [50, -20], [20, 10]], 5), { fill: '#1f6a8a', hatch: 'scales', h: { color: '#3fae6a', gap: 10, w: 1 }, line: I, seed: 2 }); for (let i = 0; i < 7; i++) { const a = Math.PI + (i / 6) * 0.9; g.fillStyle = '#3fae6a'; g.beginPath(); g.arc(-20 + Math.cos(a) * 60, -20 + Math.sin(a) * 60, 9, 0, TAU); g.fill(); g.fillStyle = '#1f3a8a'; g.beginPath(); g.arc(-20 + Math.cos(a) * 60, -20 + Math.sin(a) * 60, 4, 0, TAU); g.fill(); } break;
    case 'eagle': shape(g, blob([[-60, -20], [0, -50], [60, -20], [20, -10], [10, 20], [-10, 20], [-20, -10]], 5), { fill: '#c9872a', hatch: 'chevron', h: { color: I, gap: 8, w: 0.8 }, line: I, seed: 3 }); break;
    case 'boar': shape(g, blob([[-50, 0], [-30, -40], [30, -44], [60, -20], [64, 0], [-40, 10]], 5), { fill: '#5a4a5a', hatch: 'lines', h: { color: I, gap: 5, w: 0.6 }, line: I, seed: 4 }); pen(g, curve([[56, -6], [70, -20], [64, -30]], 3), '#f4ead2', 4, rng(1), 0.2); break;
    case 'bull': g.save(); g.scale(0.32, 0.32); mount(g, 'bull', ink); g.restore(); break;
    case 'lion': g.save(); g.scale(0.32, 0.32); mount(g, 'lion', ink); g.restore(); break;
    case 'elephant': g.save(); g.scale(-0.3, 0.3); elephantForm(g, ink); g.restore(); break;
  }
}

/** Dark smoke and flying ash, for Dhumralochana burnt to nothing. */
export function ashes(g: G, x: number, y: number, k: number, t: number, ink: Ink) {
  const R = rng(81);
  for (let i = 0; i < 60; i++) { const a = R() * TAU, d = k * (40 + R() * 260), ph = (t * 0.3 + R()) % 1; g.globalAlpha = (1 - k * 0.6) * (0.4 + 0.6 * R()); g.fillStyle = i % 4 ? '#4a4450' : ink.red; g.beginPath(); g.arc(x + Math.cos(a) * d, y + Math.sin(a) * d - ph * 60 * k, 2 + R() * 6, 0, TAU); g.fill(); }
  g.globalAlpha = 1;
}

export { hatch, toPath };
