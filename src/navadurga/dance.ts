/**
 * The dancing, in ink. A garba circle round the garbo — the pierced pot
 * with a lamp inside — turning and clapping on the beat; dandiya pairs
 * striking sticks; for the Pujo, a dhaki beating a tall dhaak plumed with
 * kaash grass and dancers swinging smoking dhunuchi before the goddess.
 * Dancers are painted once per pose into sprites.
 */
import { type G, type Pt, type Ink, INKS, rng, lerp, TAU, paper, pen, shape, hatch, arcPts, blob, curve, band, patternedRays, crescent, label } from './ink';
import { devi, mount } from './figures';
import { sprite, put } from './battles';
import type { Mode, Hit } from './music';

export const DW = 1600, DH = 900;

const DRESS = [['#d0402a', '#f2b52a'], ['#2f6a8a', '#f7d98a'], ['#3f8a4a', '#f08aa8'], ['#e8722c', '#2234a8'], ['#a7306f', '#f2b52a'], ['#f2b52a', '#d0402a']];

/** One dancer, 300 tall, base at (0,0). pose: 0 step, 1 step other foot, 2 clap high, 3 twirl. */
function dancer(g: G, ink: Ink, woman: boolean, c: number, pose: number, hold: 'none' | 'stick' | 'dhunuchi' = 'none') {
  const R = rng(c * 7 + pose), I = ink.dark, [col, col2] = DRESS[c % DRESS.length];
  const skin = ['#e8a06a', '#c98856', '#f0b88a'][c % 3];
  const twirl = pose === 3 ? 1 : 0;
  // legs / skirt
  if (woman) {
    const w = 70 + twirl * 40;
    const skirt: Pt[] = [[-30, -150], [30, -150], [w, -8], [-w, -8]];
    shape(g, skirt, { fill: col, hatch: twirl ? 'chevron' : 'beads', h: { color: col2, gap: 10, w: 1.2, color2: '#fff', angle: twirl ? 0.3 : 0 }, line: I, lw: 1.4, seed: c });
    for (let i = 0; i < 6; i++) { const u = (i + 0.5) / 6; g.fillStyle = '#fbf2e2'; g.beginPath(); g.arc(lerp(-w, w, u), -14, 3, 0, TAU); g.fill(); }
    for (const sx of [-1, 1]) shape(g, blob([[sx * 14 - 8, -8], [sx * 14 + 8, -8], [sx * 14 + 10, 2], [sx * 14 - 8, 2]], 2), { fill: skin, line: I, lw: 1, seed: 3 });
  } else {
    const st = pose === 0 ? 0.25 : pose === 1 ? -0.25 : 0;
    for (const sx of [-1, 1]) shape(g, band(curve([[sx * 12, -150], [sx * 16 + st * 40 * sx, -80], [sx * 14 + st * 50 * sx, -6]], 4), 24, 16), { fill: '#fbf2e2', hatch: 'lines', h: { color: I, gap: 6, w: 0.5, alpha: 0.4 }, line: I, lw: 1.3, seed: sx });
    shape(g, [[-34, -210], [34, -210], [52, -120], [-52, -120]], { fill: col, hatch: 'stitch', h: { color: col2, gap: 7, w: 0.9 }, line: I, lw: 1.4, seed: c });
  }
  // body
  shape(g, blob([[-24, -230], [0, -238], [24, -230], [22, -150], [-22, -150]], 3), { fill: woman ? col2 : col, hatch: 'dots', h: { color: I, gap: 8, w: 0.9 }, line: I, lw: 1.3, seed: c + 1 });
  // arms by pose
  const arms: [Pt, Pt][] = pose === 2 ? [[[-26, -270], [-6, -300]], [[26, -270], [6, -300]]] : pose === 3 ? [[[-60, -240], [-100, -250]], [[60, -240], [100, -230]]] : pose === 0 ? [[[-46, -200], [-30, -250]], [[40, -260], [70, -290]]] : [[[-40, -260], [-70, -290]], [[46, -200], [30, -250]]];
  arms.forEach(([e, h], i) => {
    const sx = i ? 1 : -1;
    shape(g, band(curve([[sx * 20, -226], e, h], 4), 14, 10), { fill: skin, line: I, lw: 1.1, seed: 5 + i });
    if (hold === 'stick') { g.save(); g.translate(h[0], h[1]); g.rotate(sx * 0.5); pen(g, [[0, 10], [0, -60]], '#d0402a', 6, R, 0.2); pen(g, [[0, -10], [0, -40]], '#f2b52a', 6, R, 0.2); g.restore(); }
    if (hold === 'dhunuchi' && i === 1) { g.save(); g.translate(h[0], h[1] - 10); shape(g, blob([[-18, -10], [18, -10], [12, 14], [-12, 14]], 3), { fill: '#b0552a', hatch: 'lines', h: { color: I, gap: 4, w: 0.5 }, line: I, seed: 7 }); g.fillStyle = '#ffb03a'; g.beginPath(); g.arc(0, -12, 7, 0, TAU); g.fill(); g.restore(); }
  });
  // head
  g.save(); g.translate(0, -262);
  shape(g, blob([[0, -26], [20, -14], [20, 10], [0, 24], [-20, 10], [-20, -14]], 3), { fill: skin, line: I, lw: 1.2, seed: 8 });
  shape(g, blob([[-22, -2], [-18, -24], [0, -32], [18, -24], [22, -2], [10, -18], [-10, -18]], 3), { fill: I, seed: 9 });
  if (woman) { g.fillStyle = I; g.beginPath(); g.arc(14, -24, 9, 0, TAU); g.fill(); g.fillStyle = '#d0402a'; g.beginPath(); g.arc(0, -6, 2.4, 0, TAU); g.fill(); }
  else shape(g, blob([[-22, -14], [-14, -36], [14, -40], [24, -14]], 3), { fill: col2, hatch: 'lines', h: { color: I, gap: 4, w: 0.6 }, line: I, seed: 10 });
  for (const sx of [-1, 1]) { g.fillStyle = I; g.beginPath(); g.ellipse(sx * 8, 2, 3.4, 2.2, 0, 0, TAU); g.fill(); }
  pen(g, curve([[-6, 12], [0, 15], [6, 12]], 3), '#a03020', 1.4, R, 0.1);
  g.restore();
  // a dupatta flying in the twirl
  if (woman && twirl) shape(g, band(curve([[0, -230], [60, -250], [110, -220]], 5), 20, 8), { fill: col2, hatch: 'dots', h: { color: col, gap: 7, w: 1 }, line: I, lw: 1, seed: 11 });
}
const dancerSprite = (ink: Ink, woman: boolean, c: number, pose: number, hold: 'none' | 'stick' | 'dhunuchi' = 'none') => sprite(`d-${ink.paper}-${woman}-${c}-${pose}-${hold}`, 300, 360, 150, 340, (g) => dancer(g, ink, woman, c, pose, hold));

/** The garbo: an earthen pot pierced with holes, a lamp burning inside. */
function garbo(g: G, x: number, y: number, s: number, t: number, ink: Ink) {
  g.save(); g.translate(x, y); g.scale(s, s);
  const pot = blob([[-60, -10], [-74, -70], [-40, -120], [0, -130], [40, -120], [74, -70], [60, -10], [0, 0]], 6);
  shape(g, pot, { fill: '#b0552a', hatch: 'lines', h: { color: ink.dark, gap: 5, w: 0.6, angle: 0, alpha: 0.5 }, line: ink.dark, lw: 1.8, seed: 3 });
  const R = rng(2);
  for (let i = 0; i < 26; i++) { const a = R() * TAU, r = R(); const px = Math.cos(a) * 56 * r, py = -66 + Math.sin(a) * 44 * r; const fl = 0.6 + 0.4 * Math.sin(t * 9 + i); g.fillStyle = `rgba(255,${190 + Math.round(fl * 50)},90,${0.7 + 0.3 * fl})`; g.beginPath(); g.arc(px, py, 4 + (i % 3), 0, TAU); g.fill(); }
  // the lamp on top
  shape(g, blob([[-26, -128], [26, -128], [16, -112], [-16, -112]], 3), { fill: '#d08a3a', line: ink.dark, seed: 4 });
  const f = 1 + Math.sin(t * 11) * 0.08;
  for (const [c, h, w] of [['#d0402a', 40, 14], ['#f2a23a', 30, 10], ['#ffe08a', 18, 5]] as [string, number, number][]) { g.fillStyle = c; g.beginPath(); g.moveTo(0, -128); g.bezierCurveTo(w, -128 - h * 0.3, w * 0.6, -128 - h * 0.8 * f, 0, -128 - h * f); g.bezierCurveTo(-w * 0.6, -128 - h * 0.8 * f, -w, -128 - h * 0.3, 0, -128); g.fill(); }
  g.restore();
  const gr = g.createRadialGradient(x, y - 80 * s, 10, x, y - 80 * s, 260 * s); gr.addColorStop(0, 'rgba(255,200,110,0.35)'); gr.addColorStop(1, 'rgba(255,200,110,0)'); g.fillStyle = gr; g.fillRect(x - 260 * s, y - 340 * s, 520 * s, 520 * s);
}

/** A dhaak, tall, slung across, with a plume of kaash grass. */
function dhaki(g: G, x: number, y: number, s: number, t: number, ink: Ink, hit: number) {
  g.save(); g.translate(x, y); g.scale(s, s);
  put(g, dancerSprite(ink, false, 3, hit > 0.5 ? 2 : 0), 0, 0, 1);
  g.save(); g.translate(0, -170); g.rotate(-0.25);
  shape(g, [[-60, -40], [60, -40], [70, 40], [-70, 40]], { fill: '#c8743a', hatch: 'zig', h: { color: '#d0402a', gap: 10, w: 2 }, line: ink.dark, lw: 1.6, seed: 6 });
  for (const sx of [-1, 1]) shape(g, arcPts(sx * 66, 0, 10, 42, 0, TAU, 16), { fill: '#f4ead2', line: ink.dark, seed: 7 });
  for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 - 0.6 + i * 0.15 + Math.sin(t * 2 + i) * 0.04; pen(g, curve([[-50, -40], [-50 + Math.cos(a) * 60, -40 + Math.sin(a) * 80], [-50 + Math.cos(a) * 90, -40 + Math.sin(a) * 150]], 4), '#f8f4e6', 5, rng(i), 0.4); }
  g.restore();
  if (hit > 0) { g.strokeStyle = '#fff'; g.globalAlpha = hit; g.lineWidth = 3; for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(70, -170, 30 + i * 18 + (1 - hit) * 30, -0.8, 0.8); g.stroke(); } g.globalAlpha = 1; }
  g.restore();
}

/** The backdrop for each mode, painted once. */
export function stageBg(mode: Mode): HTMLCanvasElement {
  return sprite(`stage-${mode}`, DW, DH, 0, 0, (g) => {
    const pujo = mode === 'dhaak' || mode === 'dhunuchi';
    const ink = pujo ? INKS.rust : INKS.night;
    paper(g, DW, DH, ink, pujo ? 7 : 8);
    if (!pujo) {
      hatch(g, [[0, 0], [DW, 0], [DW, DH], [0, DH]], 'cross', { color: '#2a2e6a', gap: 6, w: 0.6, seed: 2 });
      for (let i = 0; i < 9; i++) crescent(g, 120 + i * 170, 70 + Math.sin(i) * 20, 22, Math.PI * 0.4 + (i / 8) * Math.PI, '#fbf2e2', i);
      // strings of lights from a mast
      for (let i = 0; i < 18; i++) { const a = Math.PI * 1.05 + (i / 17) * Math.PI * 0.9; const x1 = 800 + Math.cos(a) * 1000, y1 = 140 + Math.sin(a) * 300 + 300; for (let k = 0; k <= 16; k++) { const u = k / 16; g.fillStyle = ['#f2b52a', '#d0402a', '#3fae6a', '#f08aa8'][(i + k) % 4]; g.beginPath(); g.arc(lerp(800, x1, u), lerp(140, y1, u) + Math.sin(u * Math.PI) * 40, 4, 0, TAU); g.fill(); } }
      g.fillStyle = '#2a1a3a'; g.fillRect(0, 640, DW, 260); hatch(g, [[0, 640], [DW, 640], [DW, DH], [0, DH]], 'scales', { color: '#5a4a7a', gap: 16, w: 1, seed: 3 });
    } else {
      patternedRays(g, 800, 560, 260, 1300, 26, { ...ink, ink: '#f3dcc0', ink2: '#6a1a14', dark: '#3a120c' }, 9);
      // the pandal: a gilded arch and the goddess with her lion
      g.fillStyle = '#7a1a14'; g.beginPath(); g.moveTo(420, 620); g.lineTo(420, 260); g.quadraticCurveTo(800, 40, 1180, 260); g.lineTo(1180, 620); g.closePath(); g.fill();
      hatch(g, [[420, 620], [420, 260], [800, 120], [1180, 260], [1180, 620]], 'scales', { color: '#f3a24a', gap: 14, w: 1, seed: 4 });
      g.save(); g.translate(900, 610); g.scale(0.8, 0.8); mount(g, 'lion', ink, 0, 3, { roar: 0.6 }); g.restore();
      g.save(); g.translate(780, 600); g.scale(0.62, 0.62); devi(g, { ink: { ...ink, dark: '#2a0c08', accent: '#f3a24a', light: '#fbead2' }, skin: '#f2b07a', sari: '#c8282a', sari2: '#f2b52a', blouse: '#2a5a5a', hands: ['abhaya', 'varada', 'trident', 'sword', 'chakra', 'conch', 'bow', 'bell', 'mace', 'lotus'], crown: 'mukut', mood: 'calm', seed: 41 }); g.restore();
      g.fillStyle = '#3a120c'; g.fillRect(0, 640, DW, 260); hatch(g, [[0, 640], [DW, 640], [DW, DH], [0, DH]], 'rule', { color: '#f3dcc0', gap: 12, w: 0.8, angle: 0, alpha: 0.5, seed: 5 });
    }
  });
}

/** One frame of the dance. */
export function danceFrame(g: G, mode: Mode, beat: number, now: number, hits: Hit[], heat: number) {
  g.drawImage(stageBg(mode), 0, 0);
  const t = now, b = Math.floor(beat), f = beat - b;
  const recent = (kinds: Hit['kind'][], win = 0.18) => hits.some((h) => kinds.includes(h.kind) && now - h.t >= 0 && now - h.t < win);
  if (mode === 'garba' || mode === 'dandiya') {
    const ink = INKS.night;
    if (mode === 'garba') garbo(g, 800, 600, 1.1, t, ink);

    const n = 14, clap = recent(['clap', 'tap', 'stick']);
    const people: { x: number; y: number; s: number; pose: number; woman: boolean; c: number; flip: boolean }[] = [];
    for (let i = 0; i < n; i++) {
      // the ring turns a little every beat: three steps forward and a turn
      const turn = (b + f) * 0.08 + i / n * TAU;
      const x = 800 + Math.cos(turn) * 560, y = 700 + Math.sin(turn) * 150;
      const phase = (b + i) % 4;
      let pose = clap ? 2 : phase === 3 && mode === 'garba' ? 3 : phase % 2;
      if (mode === 'dandiya') pose = clap ? 2 : phase % 2;
      people.push({ x, y, s: 0.75 + (y - 550) / 900, pose, woman: i % 3 !== 2, c: i, flip: Math.sin(turn) < 0 });
    }
    people.sort((a, c) => a.y - c.y).forEach((p) => put(g, dancerSprite(ink, p.woman, p.c, p.pose, mode === 'dandiya' ? 'stick' : 'none'), p.x, p.y, p.s, { flip: p.flip }));
    if (clap && mode === 'dandiya') { for (const p of people) if (p.c % 2 === 0) { g.fillStyle = '#fff'; g.globalAlpha = 0.8; g.beginPath(); g.arc(p.x, p.y - 270 * p.s, 8, 0, TAU); g.fill(); } g.globalAlpha = 1; }
  } else {
    const ink = INKS.rust;
    const drum = recent(['bass', 'slap', 'tap'], 0.15) ? 1 : 0;
    dhaki(g, 260, 860, 1.25, t, ink, drum);
    dhaki(g, 1340, 860, 1.25, t + 1, ink, recent(['slap'], 0.15) ? 1 : 0);
    const n = mode === 'dhunuchi' ? 6 : 3;
    for (let i = 0; i < n; i++) {
      const x = (n === 6 ? 470 : 600) + i * ((n === 6 ? 660 : 400) / Math.max(1, n - 1)), sw = Math.sin((b + f) * Math.PI / 2 + i) * (mode === 'dhunuchi' ? 0.35 : 0.1);
      const pose = mode === 'dhunuchi' ? ((b + i) % 2 ? 0 : 2) : 1;
      put(g, dancerSprite(ink, i % 2 === 0, i + 1, pose, 'dhunuchi'), x, 870, 0.95, { rot: sw, flip: i % 2 === 1 });
      // smoke rising from the dhunuchi
      for (let k = 0; k < 8; k++) { const ph = (t * 0.35 + k / 8 + i * 0.13) % 1; g.globalAlpha = (1 - ph) * 0.35; g.fillStyle = '#e8dccc'; g.beginPath(); g.arc(x + 40 + Math.sin(ph * 6 + i) * 30 * (1 + heat), 870 - 290 - ph * 260, 10 + ph * 26, 0, TAU); g.fill(); }
      g.globalAlpha = 1;
    }
    if (recent(['gong'], 0.3)) { g.strokeStyle = '#f2b52a'; g.globalAlpha = 0.6; g.lineWidth = 3; g.beginPath(); g.arc(800, 300, 340, 0, TAU); g.stroke(); g.globalAlpha = 1; }
    if (recent(['conch'], 1.8)) label(g, 'the conch — shankh', 800, 80, 40, '#fbead2');
    if (recent(['ulu'], 1.4)) label(g, 'ulu! ulu!', 800, 130, 36, '#fbead2');
  }
  // the tempo, as a rising line of lamps along the bottom
  for (let i = 0; i < 20; i++) { const on = i / 20 < heat; g.fillStyle = on ? '#f2b52a' : 'rgba(255,255,255,0.15)'; g.beginPath(); g.arc(600 + i * 20, 880, 5, 0, TAU); g.fill(); }
}

export { blob };
