import {
  building, conifer, fillStipple, figure, glow, hexTree, hexagon, meadow, noise2, paper, ridge, rgba, roundTree, shade, stipple, stripes, wash, water, blob,
  type Ctx, type Rng,
} from '../paint';
import type { LayerDef, SceneDef, V3 } from '../stage';
import { alien, alienSign, brazier, fadeTop, hexTower, lantern, paperCar, sheetGhost, spade, vignette } from './art';

/**
 * The six scenes of "Ghost Days". The story is built like the recursive
 * function its first scene is about — 2313 calls 1989 calls 1905, and then
 * each returns — so the scenes go A1 → B1 → C1 → B2 → A2 → A3.
 */

const card = (name: string, at: V3, h: number, aspect: number, px: number, draw: LayerDef['draw'], extra: Partial<LayerDef> = {}): LayerDef => ({ name, at, h, aspect, px, draw, ...extra });

/* ───────────────────────── A · Nova Pacifica, 2313 ───────────────────────── */

function novaSky(warm = 0) {
  return (g: Ctx, W: number, H: number, R: Rng) => {
    wash(g, W, H, [[0, warm ? '#e7ecd9' : '#dcebe4'], [0.45, warm ? '#f7efd6' : '#f3f2e3'], [1, '#f6f1e1']]);
    stipple(g, 0, 0, W, H, 'rgba(120,140,120,0.18)', 4, R);
    // their sun: bigger and paler than ours
    glow(g, W * 0.73, H * 0.24, H * 0.2, '#fff4c8', 0.8);
    g.fillStyle = '#fbeec0'; g.beginPath(); g.arc(W * 0.73, H * 0.24, H * 0.055, 0, Math.PI * 2); g.fill();
    // a pale second moon
    g.fillStyle = 'rgba(210,220,230,0.7)'; g.beginPath(); g.arc(W * 0.2, H * 0.18, H * 0.018, 0, Math.PI * 2); g.fill();
  };
}

function novaFar(g: Ctx, W: number, H: number, R: Rng) {
  ridge(g, W, H * 0.4, H * 0.04, 0.004, R, '#dbe8df', H, 3);
  // far whitewood forest along the ridges: tiny hexagon crowns
  for (let i = 0; i < 380; i++) { const x = R() * W, y = H * (0.41 + R() * 0.08); hexagon(g, x, y, H * (0.003 + R() * 0.004), R(), R() < 0.5 ? '#eef5ef' : '#c9ddd0'); }
  ridge(g, W, H * 0.47, H * 0.03, 0.006, R, '#cfe2d3', H, 5);
  for (let i = 0; i < 420; i++) { const x = R() * W, y = H * (0.48 + R() * 0.07); hexagon(g, x, y, H * (0.004 + R() * 0.005), R(), R() < 0.4 ? '#f4f8f4' : '#b9d3c1'); }
  // the Dome, on its hill: the Teachers' Earth air
  const dx = W * 0.3, dy = H * 0.52, dr = H * 0.085;
  g.fillStyle = 'rgba(206,229,236,0.75)'; g.beginPath(); g.ellipse(dx, dy, dr * 1.5, dr, 0, Math.PI, 0); g.fill();
  for (let i = 0; i < 9; i++) building(g, dx - dr * 1.1 + i * dr * 0.26, dy, dr * 0.18, dr * (0.25 + R() * 0.35), dr * 0.12, R, { wall: '#eef0ec', roof: '#d9e0e2' });
  g.strokeStyle = 'rgba(120,160,175,0.9)'; g.lineWidth = H * 0.002;
  g.beginPath(); g.ellipse(dx, dy, dr * 1.5, dr, 0, Math.PI, 0); g.stroke();
  for (let i = 1; i < 6; i++) { g.beginPath(); g.ellipse(dx, dy, dr * 1.5 * (i / 6), dr, 0, Math.PI, 0); g.stroke(); }
  g.fillStyle = 'rgba(255,255,255,0.7)'; g.beginPath(); g.ellipse(dx - dr * 0.7, dy - dr * 0.7, dr * 0.3, dr * 0.08, -0.5, 0, Math.PI * 2); g.fill();
  // broken spires of the first people, to the east
  for (let i = 0; i < 7; i++) {
    const x = W * (0.62 + i * 0.045 + R() * 0.02), h = H * (0.04 + R() * 0.07), w = H * 0.012;
    g.fillStyle = '#cdd2dc'; g.beginPath(); g.moveTo(x - w, H * 0.5); g.lineTo(x - w, H * 0.5 - h); g.lineTo(x + w * 0.3, H * 0.5 - h - w * (R() * 3)); g.lineTo(x + w, H * 0.5 - h * 0.8); g.lineTo(x + w, H * 0.5); g.closePath(); g.fill();
    g.fillStyle = '#b7bfcc'; g.fillRect(x, H * 0.5 - h * 0.8, w, h * 0.8);
  }
  ridge(g, W, H * 0.53, H * 0.02, 0.005, R, '#c5dcc4', H, 9);
}

function novaMid(g: Ctx, W: number, H: number, R: Rng) {
  // striped fields and a winding track back to the Dome
  const top = H * 0.46;
  const land = new Path2D(); land.rect(0, top, W, H - top);
  fillStipple(g, land, '#d2e5c8', R, [0, top, W, H - top], 0.8);
  for (let i = 0; i < 6; i++) {
    const x = R() * W, y = top + R() * (H - top) * 0.6, w = W * (0.08 + R() * 0.1), h = H * (0.04 + R() * 0.06);
    const p = new Path2D(); p.moveTo(x, y); p.lineTo(x + w, y + h * 0.2); p.lineTo(x + w * 0.9, y + h); p.lineTo(x - w * 0.1, y + h * 0.8); p.closePath();
    stripes(g, p, R() < 0.5 ? '#c4dcb0' : '#dbe9c9', 0.3 + R(), H * 0.006, R, [x - w * 0.2, y, w * 1.4, h * 1.2]);
  }
  const n = noise2(12);
  g.strokeStyle = '#c9cbc8'; g.lineWidth = H * 0.012; g.lineCap = 'round';
  g.beginPath(); g.moveTo(W * 0.3, top); for (let t = 0; t <= 1; t += 0.02) g.lineTo(W * (0.3 + t * 0.25 + n(t * 2, 1) * 0.08), top + t * (H - top)); g.stroke();
  fadeTop(g, W, H, 0.44, 0.47);
  // the rubble hills: angular heaps over the dead city
  for (let i = 0; i < 16; i++) {
    const x = R() * W, y = top + H * (0.04 + R() * 0.3), s = H * (0.012 + R() * 0.022);
    for (let k = 0; k < 7; k++) {
      const px = x + (R() - 0.5) * s * 2, py = y - R() * s * 0.8;
      hexagon(g, px, py, s * (0.25 + R() * 0.3), R(), R() < 0.5 ? '#d9d7e0' : '#c6c4d2', '#a9a6b8');
    }
  }
  // whitewood groves
  const trees: [number, number, number][] = [];
  for (let i = 0; i < 90; i++) trees.push([R() * W, top + H * (0.02 + Math.pow(R(), 1.4) * 0.4), H * (0.07 + R() * 0.08)]);
  trees.sort((a, b) => a[1] - b[1]);
  for (const [x, y, h] of trees) hexTree(g, x, y, h * (0.6 + (y - top) / H), R);
}

function novaNear(g: Ctx, W: number, H: number, R: Rng) {
  meadow(g, W, H * 0.8, H, R, { grass: '#b5d3aa', flowers: ['#6fa8dc', '#ffffff', '#b6a6e0', '#e6f0f6'], hexes: true, density: 1.2 });
  fadeTop(g, W, H, 0.76, 0.82);
  // tall whitewoods framing the view
  for (const [x, h] of [[0.04, 1.1], [0.12, 0.95], [0.9, 1.05], [0.97, 1.2], [0.82, 0.8]] as [number, number][]) hexTree(g, W * x, H * 1.02, H * h, R, '#e6efe8', 0.45);
}

function novaOna(g: Ctx, W: number, H: number, R: Rng) {
  figure(g, W * 0.5, H * 0.96, H * 0.88, R, { pose: 'walk', scales: true, facing: 1 });
}

function novaSpade(g: Ctx, W: number, H: number, R: Rng) {
  // a heap of the first people's rubble, silver tinselgrass, and the coin in the steam
  const base = new Path2D(); base.ellipse(W / 2, H * 0.72, W * 0.48, H * 0.34, 0, 0, Math.PI * 2);
  fillStipple(g, base, '#cfe0c6', R, [0, H * 0.3, W, H * 0.7]);
  for (let i = 0; i < 140; i++) {
    const a = R() * Math.PI * 2, d = Math.sqrt(R());
    const x = W / 2 + Math.cos(a) * d * W * 0.34, y = H * 0.62 + Math.sin(a) * d * H * 0.22;
    hexagon(g, x, y, H * (0.02 + R() * 0.04), R(), ['#dddbe4', '#c9c6d5', '#e9e7ef', '#b8b5c7'][i % 4]!, '#9d99ae');
  }
  for (let i = 0; i < 260; i++) {
    const x = W * (0.08 + R() * 0.84), y = H * (0.62 + R() * 0.34), h = H * (0.05 + R() * 0.12);
    g.strokeStyle = R() < 0.5 ? '#cfd9e0' : '#aebfb6'; g.lineWidth = Math.max(1, H * 0.003);
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + (R() - 0.5) * h * 0.6, y - h * 0.6, x + (R() - 0.5) * h, y - h); g.stroke();
    if (R() < 0.2) { g.fillStyle = '#ffffff'; g.fillRect(x + (R() - 0.5) * h, y - h, H * 0.006, H * 0.006); }
  }
  // steam curling up from under it
  for (let i = 0; i < 16; i++) glow(g, W * (0.5 + (R() - 0.5) * 0.08), H * (0.5 - i * 0.025), H * (0.05 + i * 0.006), '#ffffff', 0.35);
  spade(g, W * 0.5, H * 0.52, H * 0.3, R, { rot: 0.5, gleam: 0.5 });
  vignette(g, W, H, 0.28, 0.5);
}

export const A1: SceneDef = {
  id: 'a1',
  paper: '#f3f2e6',
  cam: [
    { u: 0, pos: [0, 3, 30], look: [0, 1, 0] },
    { u: 0.3, pos: [-0.5, 1.8, 20], look: [0, -0.5, -10] },
    { u: 0.62, pos: [1.2, -0.6, 7], look: [2, -2.6, -8] },
    { u: 0.9, pos: [2.2, -2.3, -4.2], look: [2.2, -3.1, -8] },
    { u: 1, pos: [2.2, -2.7, -5.6], look: [2.2, -3.15, -8] },
  ],
  layers: [
    card('sky', [0, -2, -60], 110, 2.0, 1400, novaSky()),
    card('far', [0, -1.7, -40], 80, 2.0, 2200, novaFar),
    card('mid', [0, -0.2, -18], 56, 2.0, 2600, novaMid),
    card('spade', [2.2, -3.2, -8], 4.4, 1.5, 1600, novaSpade),
    card('ona', [-1.2, -4.4, 5], 3.2, 0.6, 700, novaOna, { anim: (o, t, u) => { o.position.x += u * 6; o.position.y += Math.abs(Math.sin(t * 5)) * 0.06; } }),
    card('near', [0, 1, 0], 34, 2.0, 2400, novaNear),
  ],
  particles: [
    { kind: 'steam', n: 90, box: [-18, -8, -20, 18, -4, -12], colors: ['#ffffff'], size: 1.8 },
    { kind: 'steam', n: 40, box: [1.9, -3.2, -8.2, 2.5, -3, -7.9], colors: ['#ffffff'], size: 0.5 },
    { kind: 'flutter', n: 40, box: [-12, -4, -14, 12, 3, 4], colors: ['#4f8fd6', '#6fb0f0', '#3c78c4'], size: 0.35 },
    { kind: 'motes', n: 120, box: [-15, -8, -10, 15, 8, 20], colors: ['#ffffff'], size: 0.12 },
  ],
};

/* ───────────────────────── B · East Norbury, Connecticut, 1989 ───────────────────────── */

const AUTUMN = [
  { light: '#f0bf7a', mid: '#e3a35a', dark: '#c9824a' },
  { light: '#eda186', mid: '#d9735a', dark: '#b85a48' },
  { light: '#f2d98a', mid: '#e8c35a', dark: '#caa148' },
];

function duskSky(g: Ctx, W: number, H: number, R: Rng) {
  wash(g, W, H, [[0, '#8f8cc0'], [0.3, '#b9b3d6'], [0.52, '#f0c9b3'], [1, '#f6dcc4']]);
  stipple(g, 0, 0, W, H, 'rgba(255,255,255,0.25)', 3, R);
  glow(g, W * 0.2, H * 0.22, H * 0.09, '#fff6dc', 0.6);
  g.fillStyle = '#fbf3dc'; g.beginPath(); g.arc(W * 0.2, H * 0.22, H * 0.025, 0, Math.PI * 2); g.fill();
}

function soundFar(g: Ctx, W: number, H: number, R: Rng) {
  // Long Island Sound, the far shore, and the mansion lit red as a haunted house
  const sea = new Path2D(); sea.rect(0, H * 0.5, W, H * 0.5);
  water(g, sea, R, [0, H * 0.5, W, H * 0.5], '#a3a3cf');
  ridge(g, W, H * 0.47, H * 0.015, 0.004, R, '#8a86b0', H * 0.505, 21);
  for (let i = 0; i < 60; i++) { g.fillStyle = 'rgba(255,230,170,0.9)'; g.fillRect(R() * W, H * (0.47 + R() * 0.03), 2, 2); }
  const mx = W * 0.72, my = H * 0.49;
  glow(g, mx, my - H * 0.02, H * 0.08, '#ff5a4a', 0.55);
  building(g, mx - H * 0.03, my, H * 0.06, H * 0.035, H * 0.02, R, { wall: '#6a5f86', roof: '#4d4668', roofPeak: H * 0.018, windows: '#ff6a55' });
  g.fillStyle = '#4d4668'; g.fillRect(mx + H * 0.018, my - H * 0.07, H * 0.01, H * 0.035);
  for (let i = 0; i < 12; i++) { g.fillStyle = rgba('#ff6a55', 0.5 - i * 0.035); g.fillRect(mx - H * 0.02 + (R() - 0.5) * H * 0.02, my + H * 0.01 + i * H * 0.008, H * (0.03 + R() * 0.02), H * 0.003); }
}

function norbury(g: Ctx, W: number, H: number, R: Rng) {
  const ground = H * 0.62;
  // lawns and the parking lot
  const lawn = new Path2D(); lawn.rect(0, ground - H * 0.02, W, H - ground);
  fillStipple(g, lawn, '#b9cf98', R, [0, ground, W, H - ground], 0.8);
  const lot = new Path2D(); lot.moveTo(W * 0.02, ground); lot.lineTo(W * 0.44, ground); lot.lineTo(W * 0.48, H); lot.lineTo(0, H); lot.closePath();
  fillStipple(g, lot, '#cfcbc6', R, [0, ground, W * 0.5, H - ground], 0.6);
  g.strokeStyle = '#f4f1ea'; g.lineWidth = H * 0.003;
  for (let i = 0; i < 12; i++) { const x = W * (0.04 + i * 0.034); g.beginPath(); g.moveTo(x, ground + H * 0.04); g.lineTo(x + W * 0.01, ground + H * 0.12); g.stroke(); }
  stripes(g, (() => { const p = new Path2D(); p.rect(W * 0.6, ground + H * 0.02, W * 0.4, H * 0.3); return p; })(), '#a8c38a', 0, H * 0.012, R, [W * 0.6, ground, W * 0.4, H * 0.32]);
  // the field house, streamers on its front
  building(g, W * 0.06, ground, W * 0.28, H * 0.16, W * 0.05, R, { wall: '#d9a896', roof: '#b98a7a', lines: true });
  g.fillStyle = '#ffe3a0'; g.fillRect(W * 0.17, ground - H * 0.08, W * 0.05, H * 0.08);
  glow(g, W * 0.195, ground - H * 0.03, H * 0.08, '#ffd27a', 0.5);
  g.strokeStyle = '#ec8a3c'; g.lineWidth = H * 0.003;
  for (let k = 0; k < 3; k++) { g.beginPath(); for (let x = W * 0.06; x < W * 0.34; x += W * 0.01) g.lineTo(x, ground - H * (0.15 - k * 0.012) + ((x / (W * 0.01)) % 2 ? H * 0.008 : 0)); g.stroke(); }
  g.fillStyle = '#5a4a44'; g.font = `600 ${Math.round(H * 0.018)}px Georgia, serif`;
  g.fillText('EAST NORBURY H.S. · HALLOWEEN DANCE', W * 0.08, ground - H * 0.11);
  // boxy cars
  for (let i = 0; i < 6; i++) {
    const x = W * (0.05 + i * 0.065), y = ground + H * (0.08 + (i % 2) * 0.05), c = ['#9fb8d8', '#e0b0a8', '#d8d0b0', '#b0c8b0'][i % 4]!;
    const p = new Path2D(); p.rect(x, y - H * 0.03, W * 0.045, H * 0.03); fillStipple(g, p, c, R, [x, y - H * 0.05, W * 0.05, H * 0.05]);
    const t = new Path2D(); t.rect(x + W * 0.01, y - H * 0.05, W * 0.025, H * 0.02); fillStipple(g, t, shade(c, -0.1), R, [x, y - H * 0.06, W * 0.05, H * 0.03]);
  }
  // costumes in the lot: ghosts, witches, a superman
  for (let i = 0; i < 14; i++) {
    const x = W * (0.03 + R() * 0.4), y = ground + H * (0.05 + R() * 0.3), h = H * (0.07 + (y - ground) / H * 0.12);
    const k = i % 4;
    if (k === 0) sheetGhost(g, x, y, h);
    else figure(g, x, y, h, R, { pose: R() < 0.5 ? 'walk' : 'stand', accent: k === 1 ? '#d9534a' : k === 2 ? '#6a5a8a' : undefined, head: k === 2 ? 'hat' : 'plain', facing: R() < 0.5 ? 1 : -1 });
  }
  // autumn trees along the road
  const trees: [number, number, number][] = [];
  for (let i = 0; i < 26; i++) trees.push([W * (0.36 + R() * 0.26), ground + H * (R() * 0.2), H * (0.04 + R() * 0.03)]);
  trees.push([W * 0.93, ground + H * 0.04, H * 0.06], [W * 0.58, ground + H * 0.02, H * 0.05]);
  trees.sort((a, b) => a[1] - b[1]);
  for (const [x, y, r] of trees) roundTree(g, x, y, r, R, AUTUMN[Math.floor(R() * 3)]!);
  for (let i = 0; i < 6; i++) conifer(g, W * (0.97 + i * 0.006), ground, H * 0.14, R, '#6d8f6a');
  // the Wynnes' white raised ranch, and its big front window (cut through to the room behind)
  const hx = W * 0.64, hw = W * 0.2;
  building(g, hx, ground, hw, H * 0.14, W * 0.04, R, { wall: '#f6f3ec', roof: '#8e8e9a', roofPeak: H * 0.04, lines: true });
  g.fillStyle = '#7a8ea0'; g.fillRect(hx + hw * 0.05, ground - H * 0.05, hw * 0.12, H * 0.05);
  g.fillStyle = '#e9e4da'; g.fillRect(hx + hw * 0.45, ground - H * 0.02, hw * 0.12, H * 0.02);
  g.clearRect(W * 0.69, H * 0.5, W * 0.07, H * 0.065);
  g.strokeStyle = '#d8d2c6'; g.lineWidth = H * 0.004; g.strokeRect(W * 0.69, H * 0.5, W * 0.07, H * 0.065);
  // jack-o'-lantern on the step, mailbox at the drive
  const jx = hx + hw * 0.51, jy = ground - H * 0.022;
  glow(g, jx, jy, H * 0.03, '#ffb050', 0.6);
  g.fillStyle = '#ec8a3c'; g.beginPath(); g.ellipse(jx, jy, H * 0.012, H * 0.009, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#ffe07a'; g.fillRect(jx - H * 0.006, jy - H * 0.003, H * 0.003, H * 0.003); g.fillRect(jx + H * 0.003, jy - H * 0.003, H * 0.003, H * 0.003); g.fillRect(jx - H * 0.005, jy + H * 0.003, H * 0.01, H * 0.002);
  g.fillStyle = '#44485a'; g.fillRect(W * 0.63, ground - H * 0.03, W * 0.012, H * 0.012); g.fillRect(W * 0.635, ground - H * 0.018, W * 0.002, H * 0.03);
  g.font = `600 ${Math.round(H * 0.008)}px Georgia, serif`; g.fillStyle = '#f6f3ec'; g.fillText('WYNNE', W * 0.6305, ground - H * 0.021);
  fadeTop(g, W, H, 0.3, 0.34);
}

function wynneRoom(g: Ctx, W: number, H: number, R: Rng) {
  // a warm living room seen through the window
  const wall = new Path2D(); wall.rect(0, 0, W, H);
  fillStipple(g, wall, '#f2dcc0', R, [0, 0, W, H], 0.8);
  g.strokeStyle = 'rgba(200,160,130,0.35)'; g.lineWidth = W * 0.004;
  for (let x = 0; x < W; x += W * 0.04) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H * 0.72); g.stroke(); }
  const floor = new Path2D(); floor.rect(0, H * 0.72, W, H * 0.28); fillStipple(g, floor, '#c9a888', R, [0, H * 0.72, W, H * 0.28]);
  glow(g, W * 0.18, H * 0.35, H * 0.35, '#ffe6a8', 0.7);
  g.fillStyle = '#e9c54a'; g.beginPath(); g.moveTo(W * 0.15, H * 0.3); g.lineTo(W * 0.21, H * 0.3); g.lineTo(W * 0.23, H * 0.42); g.lineTo(W * 0.13, H * 0.42); g.closePath(); g.fill();
  g.fillStyle = '#8a6a5a'; g.fillRect(W * 0.175, H * 0.42, W * 0.01, H * 0.3);
  const sofa = new Path2D(); sofa.rect(W * 0.3, H * 0.52, W * 0.34, H * 0.22); fillStipple(g, sofa, '#9fb0c8', R, [W * 0.3, H * 0.5, W * 0.34, H * 0.26]);
  // a framed picture, a television with the news from Beijing
  g.fillStyle = '#6a5a4a'; g.fillRect(W * 0.72, H * 0.4, W * 0.14, H * 0.18); g.fillStyle = '#b8c8d8'; g.fillRect(W * 0.735, H * 0.42, W * 0.11, H * 0.12);
  for (let i = 0; i < 40; i++) { g.fillStyle = '#6a7080'; g.fillRect(W * (0.74 + R() * 0.1), H * (0.46 + R() * 0.07), 2, 3); }
  g.fillStyle = '#c8b090'; g.fillRect(W * 0.4, H * 0.12, W * 0.16, H * 0.18); g.fillStyle = '#a8c0a0'; g.fillRect(W * 0.41, H * 0.135, W * 0.14, H * 0.15);
  figure(g, W * 0.42, H * 0.74, H * 0.5, R, { pose: 'sit', head: 'hair' });
  figure(g, W * 0.6, H * 0.8, H * 0.55, R, { pose: 'stand', color: '#5b5f6e', facing: -1 });
  figure(g, W * 0.9, H * 0.82, H * 0.55, R, { pose: 'stand', dress: true, color: '#d0505a', head: 'hair', facing: -1 });
}

function lotCouple(g: Ctx, W: number, H: number, R: Rng) {
  // Fred and Carrie, in the masks of a president and his wife
  figure(g, W * 0.42, H * 0.95, H * 0.8, R, { pose: 'walk', color: '#5b5f6e', head: 'mask' });
  figure(g, W * 0.58, H * 0.95, H * 0.78, R, { pose: 'walk', dress: true, color: '#d0505a', head: 'mask' });
}

function leavesNear(g: Ctx, W: number, H: number, R: Rng) {
  meadow(g, W, H * 0.78, H, R, { grass: '#a9c38a', flowers: ['#ec8a3c', '#d9735a', '#e8c35a'], density: 0.9 });
  fadeTop(g, W, H, 0.74, 0.8);
  // a picket fence
  g.fillStyle = '#f6f3ec'; g.strokeStyle = '#cfc8ba'; g.lineWidth = 1;
  for (let x = W * 0.55; x < W; x += W * 0.018) { g.fillRect(x, H * 0.72, W * 0.01, H * 0.2); g.strokeRect(x, H * 0.72, W * 0.01, H * 0.2); }
  g.fillRect(W * 0.55, H * 0.76, W * 0.45, H * 0.015);
}

export const B1: SceneDef = {
  id: 'b1',
  paper: '#f4ece2',
  cam: [
    { u: 0, pos: [-12, 1.5, 28], look: [-12, -1, -2] },
    { u: 0.3, pos: [-11, 0.2, 17], look: [-13, -2.2, -2] },
    { u: 0.55, pos: [7, 0.4, 16], look: [12, -2, -2] },
    { u: 0.8, pos: [13.2, -1.85, 3], look: [13.2, -1.95, -3.6] },
    { u: 1, pos: [13.2, -1.95, -1.3], look: [13.2, -1.95, -3.6] },
  ],
  layers: [
    card('sky', [0, 6, -60], 110, 2.2, 1400, duskSky),
    card('sound', [0, -1, -40], 70, 2.2, 2400, soundFar),
    card('room', [13.2, -1.95, -3.6], 3.4, 1.6, 1400, wynneRoom),
    card('town', [0, -1, -2], 30, 2.0, 3000, norbury),
    card('couple', [-12.5, -5.6, 8], 3.2, 1.2, 800, lotCouple, { show: [0, 0.5], anim: (o, t) => { o.position.x += Math.sin(t * 0.3) * 0.3; } }),
    card('leaves', [0, -4, 12], 20, 2.4, 2000, leavesNear),
  ],
  particles: [
    { kind: 'stars', n: 160, box: [-50, 8, -58, 50, 40, -58], colors: ['#ffffff', '#fff3d0'], size: 0.5 },
    { kind: 'petals', n: 120, box: [-25, 2, -4, 30, 12, 14], colors: ['#ec8a3c', '#d9735a', '#e8c35a'], size: 0.32 },
  ],
};

/* ───────────────────────── C · Hong Kong, 1905 ───────────────────────── */

function hkSky(g: Ctx, W: number, H: number, R: Rng) {
  wash(g, W, H, [[0, '#7fa7b0'], [0.35, '#a9c6c2'], [0.6, '#efd2b8'], [1, '#f3dcc6']]);
  stipple(g, 0, 0, W, H, 'rgba(255,255,255,0.2)', 3, R);
  // the full moon of the seventh month, when the gates of the underworld open
  glow(g, W * 0.7, H * 0.2, H * 0.12, '#fff4d8', 0.7);
  g.fillStyle = '#fdf5e0'; g.beginPath(); g.arc(W * 0.7, H * 0.2, H * 0.035, 0, Math.PI * 2); g.fill();
}

function hkPeak(g: Ctx, W: number, H: number, R: Rng) {
  ridge(g, W, H * 0.36, H * 0.07, 0.002, R, '#8fb0a8', H * 0.56, 31);
  ridge(g, W, H * 0.44, H * 0.035, 0.004, R, '#7d9d98', H * 0.56, 33);
  const harbour = new Path2D(); harbour.rect(0, H * 0.54, W, H * 0.1);
  water(g, harbour, R, [0, H * 0.54, W, H * 0.1], '#a8bcc8');
  // junks with batwing sails
  for (let i = 0; i < 7; i++) {
    const x = W * (0.08 + i * 0.13 + R() * 0.04), y = H * (0.57 + R() * 0.04), s = H * (0.02 + R() * 0.012);
    g.fillStyle = '#6a4e3c'; g.fillRect(x - s, y, s * 2, s * 0.35);
    for (let k = 0; k < 2; k++) { g.fillStyle = '#b8805a'; g.beginPath(); g.moveTo(x + k * s * 0.6 - s * 0.3, y); g.lineTo(x + k * s * 0.6 - s * 0.8, y - s * 1.6); g.quadraticCurveTo(x + k * s * 0.6, y - s * 2, x + k * s * 0.6 + s * 0.3, y - s * 1.5); g.closePath(); g.fill(); }
  }
  fadeTop(g, W, H, 0.25, 0.3);
}

const HK_SHOP = { x0: 0.43, x1: 0.57, y0: 0.6, y1: 0.8 };

function hkStreet(g: Ctx, W: number, H: number, R: Rng) {
  const ground = H * 0.8;
  const road = new Path2D(); road.rect(0, ground, W, H - ground);
  fillStipple(g, road, '#d8cdb8', R, [0, ground, W, H - ground]);
  // the opera matshed, far left
  const mp = new Path2D(); mp.moveTo(W * 0.02, ground); mp.lineTo(W * 0.02, H * 0.52); mp.lineTo(W * 0.1, H * 0.46); mp.lineTo(W * 0.18, H * 0.52); mp.lineTo(W * 0.18, ground); mp.closePath();
  fillStipple(g, mp, '#d8c49a', R, [W * 0.02, H * 0.46, W * 0.16, ground - H * 0.46]);
  g.fillStyle = '#b8453c'; g.fillRect(W * 0.04, H * 0.6, W * 0.12, H * 0.1);
  for (let i = 0; i < 4; i++) figure(g, W * (0.06 + i * 0.03), H * 0.7, H * 0.08, R, { pose: 'arms-up', accent: ['#d8534a', '#3a6fb0', '#e9c54a', '#6a9a5a'][i] });
  // a row of shophouses with verandahs
  const cols = ['#e6d3ad', '#ead9b8', '#dcc7a0', '#e9dcc4', '#e3caa4'];
  for (let i = 0; i < 7; i++) {
    const x = W * (0.19 + i * 0.115), w = W * 0.11, h = H * (0.36 + (i % 3) * 0.04);
    building(g, x, ground, w, h, W * 0.012, R, { wall: cols[i % 5]!, roof: '#9a7a6a' });
    for (let f = 1; f < 3; f++) {
      const fy = ground - h * (f / 3);
      g.fillStyle = shade(cols[i % 5]!, -0.25); g.fillRect(x, fy, w, H * 0.006);
      for (let k = 0; k < 4; k++) { g.fillStyle = '#7fa38e'; g.fillRect(x + w * (0.08 + k * 0.23), fy - h * 0.25, w * 0.12, h * 0.2); }
    }
    // the arcade
    for (let k = 0; k <= 4; k++) { g.fillStyle = shade(cols[i % 5]!, -0.1); g.fillRect(x + (w / 4) * k - W * 0.003, ground - h / 3, W * 0.006, h / 3); }
    // shop signs, hung vertical
    g.fillStyle = '#2f2a28'; g.fillRect(x + w * 0.42, ground - h * 0.62, w * 0.12, h * 0.26);
  }
  // Ho's shop: an antiques dealer; its front is open onto the warehouse behind
  const sx0 = W * HK_SHOP.x0, sx1 = W * HK_SHOP.x1;
  g.fillStyle = '#2f2a28'; g.fillRect(sx0 + (sx1 - sx0) * 0.38, H * 0.36, (sx1 - sx0) * 0.24, H * 0.2);
  g.fillStyle = '#e9c54a'; g.font = `${Math.round(H * 0.035)}px 'Noto Serif TC', 'Songti TC', serif`;
  ['何', '記', '古', '玩'].forEach((c, i) => g.fillText(c, sx0 + (sx1 - sx0) * 0.405, H * (0.395 + i * 0.045)));
  g.clearRect(sx0, H * HK_SHOP.y0, sx1 - sx0, H * (HK_SHOP.y1 - HK_SHOP.y0));
  g.strokeStyle = '#6a4e3c'; g.lineWidth = H * 0.006; g.strokeRect(sx0, H * HK_SHOP.y0, sx1 - sx0, H * (HK_SHOP.y1 - HK_SHOP.y0));
  // lanterns strung across the street
  for (let s = 0; s < 3; s++) {
    const y0 = H * (0.46 + s * 0.05);
    g.strokeStyle = '#5a4a44'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(0, y0); g.quadraticCurveTo(W / 2, y0 + H * 0.05, W, y0); g.stroke();
    for (let k = 1; k < 18; k++) { const x = (W / 18) * k, t = k / 18; lantern(g, x, y0 + 4 * t * (1 - t) * H * 0.05 + H * 0.015, H * 0.009); }
  }
  // offerings burning in the street, and the crowd
  for (let i = 0; i < 6; i++) brazier(g, W * (0.08 + i * 0.17), ground + H * 0.1, H * 0.05, R);
  paperCar(g, W * 0.62, ground + H * 0.12, W * 0.05, R);
  for (let i = 0; i < 26; i++) {
    const x = R() * W, y = ground + H * (0.03 + R() * 0.17);
    if (x > W * 0.4 && x < W * 0.6 && y < ground + H * 0.08) continue;
    figure(g, x, y, H * (0.08 + (y - ground) / H * 0.3), R, { pose: R() < 0.5 ? 'walk' : 'stand', head: R() < 0.6 ? 'queue' : 'plain', facing: R() < 0.5 ? 1 : -1 });
  }
}

function hkInside(g: Ctx, W: number, H: number, R: Rng) {
  const wall = new Path2D(); wall.rect(0, 0, W, H); fillStipple(g, wall, '#d9c2a0', R, [0, 0, W, H], 0.8);
  const floor = new Path2D(); floor.rect(0, H * 0.72, W, H * 0.28); fillStipple(g, floor, '#b8906a', R, [0, H * 0.72, W, H * 0.28]);
  g.strokeStyle = 'rgba(120,80,50,0.35)'; g.lineWidth = 1;
  for (let y = H * 0.74; y < H; y += H * 0.03) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  // the warehouse: shelves of bronzes, jade, tomb figures, porcelain
  for (let s = 0; s < 4; s++) {
    const y = H * (0.18 + s * 0.15);
    g.fillStyle = '#8a6448'; g.fillRect(W * 0.02, y, W * 0.4, H * 0.015);
    for (let k = 0; k < 11; k++) {
      const x = W * (0.04 + k * 0.035), kind = Math.floor(R() * 4);
      if (kind === 0) { const p = new Path2D(); p.moveTo(x - W * 0.01, y); p.quadraticCurveTo(x - W * 0.014, y - H * 0.06, x, y - H * 0.08); p.quadraticCurveTo(x + W * 0.014, y - H * 0.06, x + W * 0.01, y); p.closePath(); fillStipple(g, p, '#6e8f74', R, [x - W * 0.02, y - H * 0.09, W * 0.04, H * 0.09]); }
      else if (kind === 1) { g.fillStyle = '#f2efe6'; g.beginPath(); g.ellipse(x, y - H * 0.035, W * 0.009, H * 0.035, 0, 0, Math.PI * 2); g.fill(); g.strokeStyle = '#4a70b0'; g.lineWidth = 1.5; g.beginPath(); g.ellipse(x, y - H * 0.035, W * 0.006, H * 0.02, 0, 0, Math.PI * 2); g.stroke(); }
      else if (kind === 2) { g.fillStyle = '#9cc2a4'; g.fillRect(x - W * 0.006, y - H * 0.05, W * 0.012, H * 0.05); }
      else figure(g, x, y, H * 0.08, R, { color: '#e2c9a0', dress: true });
    }
  }
  // a shaft of light through the papered window, and a doorway through to the hall
  g.fillStyle = 'rgba(255,240,200,0.3)';
  g.beginPath(); g.moveTo(W * 0.3, 0); g.lineTo(W * 0.38, 0); g.lineTo(W * 0.43, H * 0.62); g.lineTo(W * 0.29, H * 0.62); g.closePath(); g.fill();
  g.fillStyle = '#7a4a34'; g.fillRect(W * 0.55, 0, W * 0.006, H * 0.72);
  const hall = new Path2D(); hall.rect(W * 0.556, 0, W * 0.444, H * 0.72); fillStipple(g, hall, '#e2cba6', R, [W * 0.556, 0, W * 0.444, H * 0.72], 0.6);
  for (let k = 0; k < 4; k++) lantern(g, W * (0.62 + k * 0.1), H * 0.12, H * 0.025);
}

/** The workbench, close: the matched pair of bubi, the copper-blue powder, the brush. */
function hkBench(g: Ctx, W: number, H: number, R: Rng) {
  g.fillStyle = 'rgba(255,240,200,0.35)';
  g.beginPath(); g.moveTo(W * 0.2, 0); g.lineTo(W * 0.55, 0); g.lineTo(W * 0.75, H * 0.62); g.lineTo(W * 0.15, H * 0.62); g.closePath(); g.fill();
  const top = new Path2D(); top.rect(W * 0.02, H * 0.6, W * 0.96, H * 0.1); fillStipple(g, top, '#8a6448', R, [0, H * 0.6, W, H * 0.1]);
  g.strokeStyle = 'rgba(60,35,20,0.4)'; g.lineWidth = 2;
  for (let y = H * 0.62; y < H * 0.7; y += H * 0.02) { g.beginPath(); g.moveTo(W * 0.02, y); g.lineTo(W * 0.98, y + H * 0.004); g.stroke(); }
  const face = new Path2D(); face.rect(W * 0.02, H * 0.7, W * 0.96, H * 0.08); fillStipple(g, face, '#6a4a36', R, [0, H * 0.7, W, H * 0.08]);
  g.fillStyle = '#5a3a2a'; g.fillRect(W * 0.05, H * 0.78, W * 0.04, H * 0.22); g.fillRect(W * 0.91, H * 0.78, W * 0.04, H * 0.22);
  // the pair, lying on the bench
  for (const [x, rot, gleam] of [[0.36, -0.2, 0], [0.55, 0.15, 0.8]] as [number, number, number][]) {
    g.save(); g.translate(W * x, H * 0.64); g.scale(1, 0.42);
    spade(g, 0, 0, H * 0.24, R, { rot, gleam });
    g.restore();
  }
  // the dish of powder, the brush, a file
  g.fillStyle = '#e8e2d6'; g.beginPath(); g.ellipse(W * 0.75, H * 0.62, W * 0.07, H * 0.03, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#3f5fa0'; g.beginPath(); g.ellipse(W * 0.75, H * 0.615, W * 0.05, H * 0.02, 0, 0, Math.PI * 2); g.fill();
  stipple(g, W * 0.7, H * 0.6, W * 0.1, H * 0.03, '#7ea0d8', 30, R, 2);
  g.strokeStyle = '#5a3a2a'; g.lineWidth = H * 0.012; g.lineCap = 'round';
  g.beginPath(); g.moveTo(W * 0.82, H * 0.6); g.lineTo(W * 0.93, H * 0.52); g.stroke();
  g.fillStyle = '#2f2a28'; g.beginPath(); g.ellipse(W * 0.815, H * 0.605, W * 0.012, H * 0.012, 0.6, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#9a9a9a'; g.fillRect(W * 0.12, H * 0.61, W * 0.1, H * 0.012);
  vignette(g, W, H, 0.3, 0.52);
}

/** The front hall, laid for the ghosts: eight places, mock meats, paper houses, paper money; father and son. */
function hkHall(g: Ctx, W: number, H: number, R: Rng) {
  const table = new Path2D(); table.rect(W * 0.12, H * 0.56, W * 0.6, H * 0.05); fillStipple(g, table, '#9a5a3a', R, [W * 0.12, H * 0.56, W * 0.6, H * 0.05]);
  g.fillStyle = '#7a4a2a'; g.fillRect(W * 0.14, H * 0.61, W * 0.02, H * 0.3); g.fillRect(W * 0.68, H * 0.61, W * 0.02, H * 0.3);
  for (let k = 0; k < 8; k++) {
    const x = W * (0.16 + k * 0.073);
    g.fillStyle = '#f4f0e6'; g.beginPath(); g.ellipse(x, H * 0.555, W * 0.028, H * 0.012, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = ['#c8844a', '#e9c54a', '#d06a5a', '#9cc27a'][k % 4]!; g.beginPath(); g.arc(x, H * 0.548, W * 0.013, Math.PI, 0); g.fill();
    g.strokeStyle = '#3a2a1a'; g.lineWidth = 2; g.beginPath(); g.moveTo(x + W * 0.02, H * 0.556); g.lineTo(x + W * 0.03, H * 0.53); g.stroke();
  }
  for (let k = 0; k < 3; k++) { g.strokeStyle = '#b84a3a'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(W * (0.42 + k * 0.012), H * 0.55); g.lineTo(W * (0.42 + k * 0.012), H * 0.44); g.stroke(); glow(g, W * (0.42 + k * 0.012), H * 0.44, H * 0.012, '#ffb070', 0.8); }
  for (let k = 0; k < 7; k++) { g.fillStyle = k % 2 ? '#e9c54a' : '#f4e9c8'; g.fillRect(W * (0.2 + k * 0.06), H * 0.8, W * 0.05, H * 0.025); }
  building(g, W * 0.78, H * 0.78, W * 0.12, H * 0.14, W * 0.03, R, { wall: '#f2e7c9', roof: '#c85a4a', roofPeak: H * 0.05, windows: '#e9c54a' });
  paperCar(g, W * 0.76, H * 0.93, W * 0.18, R);
  figure(g, W * 0.3, H * 0.95, H * 0.6, R, { head: 'queue', color: '#e8e2d6', facing: 1 });
  figure(g, W * 0.56, H * 0.95, H * 0.64, R, { head: 'hair', color: '#f7f6f2', accent: '#3a3a44', facing: -1 });
}

function hkDixon(g: Ctx, W: number, H: number, R: Rng) {
  figure(g, W * 0.5, H * 0.96, H * 0.88, R, { head: 'hat', color: '#e9e4dc', accent: '#4a4340', facing: -1 });
  figure(g, W * 0.75, H * 0.96, H * 0.8, R, { color: '#d8cfc0', facing: -1 });
  figure(g, W * 0.25, H * 0.96, H * 0.82, R, { color: '#d8cfc0', facing: -1 });
}

function hkAfter(g: Ctx, W: number, H: number, R: Rng) {
  // the feast on the floor
  const floor = new Path2D(); floor.rect(0, H * 0.4, W, H * 0.6); fillStipple(g, floor, '#b8906a', R, [0, H * 0.4, W, H * 0.6]);
  fadeTop(g, W, H, 0.3, 0.45);
  for (let k = 0; k < 30; k++) {
    const x = W * (0.1 + R() * 0.8), y = H * (0.55 + R() * 0.4);
    if (k % 3 === 0) { g.fillStyle = '#f4f0e6'; g.beginPath(); g.ellipse(x, y, W * 0.03, H * 0.02, R(), 0, Math.PI * 2); g.fill(); }
    else { g.fillStyle = ['#c8844a', '#e9c54a', '#d06a5a', '#9cc27a', '#f4e9c8'][k % 5]!; g.fillRect(x, y, W * 0.02, H * 0.012); }
  }
  spade(g, W * 0.45, H * 0.8, H * 0.14, R, { rot: 1.2 });
  spade(g, W * 0.6, H * 0.84, H * 0.14, R, { rot: -2.4, gleam: 0.8 });
}

export const C1: SceneDef = {
  id: 'c1',
  paper: '#f1e6d6',
  cam: [
    { u: 0, pos: [0, 2, 28], look: [0, 0, -12] },
    { u: 0.3, pos: [0, -2.5, 6], look: [0, -4.4, -12] },
    { u: 0.42, pos: [0, -4.4, -9.4], look: [-1.5, -5, -17] },
    { u: 0.55, pos: [-3.7, -5.55, -14.3], look: [-3.7, -5.7, -16.9] },
    { u: 0.72, pos: [-3.5, -5.4, -13.4], look: [-3.5, -5.6, -16.9] },
    { u: 0.77, pos: [1, -5, -8.5], look: [2, -5.5, -16.9] },
    { u: 0.82, pos: [5.4, -5.3, -8.4], look: [5.7, -5.7, -16.9] },
    { u: 1, pos: [5.2, -5.2, -7.6], look: [5.7, -5.7, -16.9] },
  ],
  layers: [
    card('sky', [0, -4, -60], 100, 2.0, 1400, hkSky),
    card('peak', [0, -2, -42], 80, 2.0, 2200, hkPeak),
    card('inside', [0, -4.6, -17], 12, 2.2, 2600, hkInside),
    card('bench', [-3.7, -5.6, -16.9], 2.4, 1.6, 1600, hkBench),
    card('hall', [5.8, -5.2, -16.9], 6.5, 1.5, 2000, hkHall),
    card('dixon', [7.4, -6.2, -16.4], 3.4, 1.4, 900, hkDixon, { show: [0.8, 0.92] }),
    card('after', [6.6, -6.4, -16.2], 3.6, 1.8, 1000, hkAfter, { show: [0.92, 1.1] }),
    card('street', [0, 4, -12], 44, 2.1, 3200, hkStreet),
  ],
  particles: [
    { kind: 'stars', n: 60, box: [-50, 14, -58, 50, 40, -58], colors: ['#ffffff'], size: 0.4 },
    { kind: 'embers', n: 160, box: [-22, -9, -11.5, 22, -7.5, -11], colors: ['#ffb050', '#ff8040', '#ffd070'], size: 0.25 },
    { kind: 'motes', n: 120, box: [-6, -7, -16.8, 0, -2, -15], colors: ['#fff0c0'], size: 0.04 },
  ],
};

/* ───────────────────────── B · the beach, 1989 (returning) ───────────────────────── */

function nightSky(g: Ctx, W: number, H: number, R: Rng) {
  wash(g, W, H, [[0, '#4f4c80'], [0.5, '#6f6a9e'], [0.85, '#9a90bc'], [1, '#b9a8c8']]);
  stipple(g, 0, 0, W, H, 'rgba(255,255,255,0.18)', 3, R);
  glow(g, W * 0.3, H * 0.3, H * 0.12, '#fff6dc', 0.5);
  g.fillStyle = '#fbf3dc'; g.beginPath(); g.arc(W * 0.3, H * 0.3, H * 0.03, 0, Math.PI * 2); g.fill();
}

function nightShore(g: Ctx, W: number, H: number, R: Rng) {
  ridge(g, W, H * 0.48, H * 0.012, 0.004, R, '#4a466e', H * 0.52, 41);
  for (let i = 0; i < 50; i++) { g.fillStyle = 'rgba(255,220,160,0.9)'; g.fillRect(R() * W, H * (0.48 + R() * 0.03), 2, 2); }
  const mx = W * 0.62, my = H * 0.5;
  glow(g, mx, my - H * 0.03, H * 0.1, '#ff5a4a', 0.7);
  building(g, mx - H * 0.03, my, H * 0.06, H * 0.035, H * 0.02, R, { wall: '#3e3860', roof: '#2e2a48', roofPeak: H * 0.018, windows: '#ff6a55' });
  fadeTop(g, W, H, 0.3, 0.4);
  g.globalCompositeOperation = 'destination-out';
  g.fillRect(0, H * 0.52, W, H);
  g.globalCompositeOperation = 'source-over';
}

function nightWater(g: Ctx, W: number, H: number, R: Rng) {
  // a floor of dark water; the far edge (top of the card) under the mansion
  wash(g, W, H, [[0, '#3f3c68'], [0.5, '#4d4a7c'], [1, '#5c5889']]);
  stipple(g, 0, 0, W, H, 'rgba(160,160,220,0.35)', 8, R);
  g.strokeStyle = 'rgba(190,190,240,0.35)'; g.lineWidth = Math.max(1, W * 0.0015);
  for (let i = 0; i < 900; i++) { const x = R() * W, y = R() * H, l = W * (0.005 + R() * 0.02); g.beginPath(); g.moveTo(x, y); g.lineTo(x + l, y); g.stroke(); }
  // the moon's path, broken; the red of the haunted house, streaked
  for (let i = 0; i < 260; i++) { const y = R() * H, x = W * 0.42 + (R() - 0.5) * W * 0.05 * (1 + y / H); g.fillStyle = rgba('#fff3d0', 0.35 + R() * 0.4); g.fillRect(x, y, W * (0.004 + R() * 0.012), Math.max(1, H * 0.0015)); }
  for (let i = 0; i < 120; i++) { const y = R() * H * 0.3, x = W * 0.58 + (R() - 0.5) * W * 0.03; g.fillStyle = rgba('#ff6a55', 0.5 * (1 - y / (H * 0.3))); g.fillRect(x, y, W * (0.004 + R() * 0.01), Math.max(1, H * 0.0015)); }
}

function beach(g: Ctx, W: number, H: number, R: Rng) {
  const sand = new Path2D(); sand.moveTo(0, H * 0.7); sand.quadraticCurveTo(W * 0.5, H * 0.62, W, H * 0.72); sand.lineTo(W, H); sand.lineTo(0, H); sand.closePath();
  fillStipple(g, sand, '#b8aac0', R, [0, H * 0.6, W, H * 0.4]);
  g.strokeStyle = 'rgba(240,240,255,0.7)'; g.lineWidth = H * 0.004;
  g.beginPath(); g.moveTo(0, H * 0.705); g.quadraticCurveTo(W * 0.5, H * 0.625, W, H * 0.725); g.stroke();
  figure(g, W * 0.46, H * 0.72, H * 0.24, R, { dress: true, color: '#e8d8e0', head: 'hair' });
  figure(g, W * 0.52, H * 0.72, H * 0.25, R, { color: '#f0eef4', facing: -1 });
  // a folded suit, a rubber mask on the sand
  g.fillStyle = '#5b5f6e'; g.fillRect(W * 0.56, H * 0.72, W * 0.02, H * 0.01);
  g.fillStyle = '#e9c3ae'; g.beginPath(); g.ellipse(W * 0.585, H * 0.722, W * 0.005, H * 0.008, 0.3, 0, Math.PI * 2); g.fill();
  for (let i = 0; i < 40; i++) { g.strokeStyle = '#8e84a0'; g.lineWidth = 1; const x = R() * W, y = H * (0.75 + R() * 0.25); g.beginPath(); g.moveTo(x, y); g.lineTo(x + (R() - 0.5) * 6, y - H * (0.02 + R() * 0.04)); g.stroke(); }
}

function swimmer(g: Ctx, W: number, H: number, R: Rng) {
  glow(g, W / 2, H * 0.55, H * 0.5, '#bfe9ff', 0.25);
  figure(g, W * 0.5, H * 0.6, H * 1.2, R, { pose: 'swim', color: '#f0eef4' });
  g.strokeStyle = 'rgba(230,240,255,0.8)'; g.lineWidth = Math.max(1, H * 0.02);
  for (let i = 0; i < 4; i++) { g.beginPath(); g.ellipse(W / 2, H * 0.62, W * (0.15 + i * 0.08), H * (0.08 + i * 0.03), 0, 0, Math.PI * 2); g.stroke(); }
}

export const B2: SceneDef = {
  id: 'b2',
  paper: '#4f4c80',
  cam: [
    { u: 0, pos: [0, 1.2, 26], look: [0, -0.8, -40] },
    { u: 0.45, pos: [0, 0.4, 16], look: [0, -0.8, -40] },
    { u: 1, pos: [0, -1.1, -14], look: [0, -1.5, -60] },
  ],
  layers: [
    card('sky', [0, 12, -70], 100, 2.4, 1400, nightSky),
    card('shore', [0, -1.4, -55], 70, 2.4, 2400, nightShore),
    card('water', [0, -2, -20], 100, 1.0, 2400, nightWater, { rx: -Math.PI / 2 }),
    card('swimmer', [0, -1.75, 8], 1.4, 2, 600, swimmer, { show: [0.45, 1.1], anim: (o, t, u) => { o.position.z = 8 - Math.max(0, u - 0.45) * 44; o.position.x = Math.sin(t * 0.8) * 0.1; } }),
    card('beach', [0, -3.5, 12], 16, 2.4, 2200, beach, { show: [0, 0.6] }),
  ],
  particles: [
    { kind: 'stars', n: 220, box: [-60, 6, -68, 60, 50, -68], colors: ['#ffffff', '#fff3d0', '#d8e0ff'], size: 0.5 },
    { kind: 'jelly', n: 260, box: [-14, -2.1, -40, 14, -1.85, 20], colors: ['#9ff0ff', '#b0ffd8', '#d0c0ff'], size: 0.22 },
  ],
};

/* ───────────────────────── A · the city of the first people ───────────────────────── */

function citySky(g: Ctx, W: number, H: number, R: Rng) {
  wash(g, W, H, [[0, '#b7b0cf'], [0.5, '#e8d2c0'], [1, '#f2dcc6']]);
  stipple(g, 0, 0, W, H, 'rgba(255,255,255,0.2)', 3, R);
}
function citySun(g: Ctx, W: number, H: number) {
  glow(g, W / 2, H / 2, W / 2, '#ffe8b0', 0.9);
  g.fillStyle = '#fff4d0'; g.beginPath(); g.arc(W / 2, H / 2, W * 0.12, 0, Math.PI * 2); g.fill();
}
function cityTowers(dense: number, col: string, fade: number) {
  return (g: Ctx, W: number, H: number, R: Rng) => {
    const base = H * 0.78;
    const n = Math.round(24 * dense);
    for (let i = 0; i < n; i++) {
      const x = R() * W;
      if (Math.abs(x - W / 2) < W * (0.05 + fade * 0.1)) continue; // the street
      const w = H * (0.03 + R() * 0.04) * (1 + fade), h = H * (0.25 + R() * 0.45);
      hexTower(g, x, base, w, h, R, col);
    }
    for (let i = 0; i < 10 * dense; i++) alienSign(g, R() * W, H * (0.3 + R() * 0.35), H * (0.06 + R() * 0.08), H * 0.018, R);
    const road = new Path2D(); road.rect(0, base, W, H - base); fillStipple(g, road, '#d9cfc2', R, [0, base, W, H - base]);
  };
}
function crowd(gaze: boolean) {
  return (g: Ctx, W: number, H: number, R: Rng) => {
    const items: [number, number][] = [];
    for (let i = 0; i < 38; i++) items.push([R() * W, H * (0.55 + R() * 0.4)]);
    items.sort((a, b) => a[1] - b[1]);
    for (const [x, y] of items) {
      if (Math.abs(x - W / 2) < W * 0.08 && y > H * 0.75) continue;
      const h = H * (0.12 + (y / H - 0.55) * 0.35);
      alien(g, x, y, h, R, { gaze, facing: gaze ? 1 : R() < 0.5 ? 1 : -1 });
    }
    if (!gaze) {
      // vehicles like darting fish
      for (let i = 0; i < 5; i++) {
        const x = W * (0.35 + R() * 0.3), y = H * (0.7 + R() * 0.2), s = H * 0.06;
        const p = new Path2D(); p.moveTo(x - s * 1.6, y); p.quadraticCurveTo(x, y - s * 0.9, x + s * 1.6, y); p.lineTo(x + s * 2, y - s * 0.5); p.lineTo(x + s * 1.9, y + s * 0.2); p.quadraticCurveTo(x, y + s * 0.4, x - s * 1.6, y); p.closePath();
        fillStipple(g, p, ['#9fc0d8', '#d8b0c0', '#c0d8b0'][i % 3]!, R, [x - s * 2, y - s, s * 4.2, s * 1.6]);
        for (let k = 0; k < 6; k++) { g.fillStyle = '#3a3440'; g.beginPath(); g.arc(x - s * 1.2 + k * s * 0.5, y + s * 0.3, s * 0.12, 0, Math.PI * 2); g.fill(); }
      }
    }
  };
}
function onaAndChild(g: Ctx, W: number, H: number, R: Rng) {
  g.globalAlpha = 0.7;
  figure(g, W * 0.36, H * 0.96, H * 0.8, R, { scales: true, pose: 'stand' });
  g.globalAlpha = 1;
  alien(g, W * 0.66, H * 0.96, H * 0.55, R, { color: '#d8e6e0', facing: -1 });
  spade(g, W * 0.5, H * 0.6, H * 0.12, R, { rot: 0.3 });
  glow(g, W * 0.5, H * 0.6, H * 0.15, '#fff0b0', 0.4);
}

export const A2: SceneDef = {
  id: 'a2',
  paper: '#efe0cf',
  white: (u) => Math.pow(Math.max(0, (u - 0.55) / 0.45), 1.6) * 0.97,
  cam: [
    { u: 0, pos: [0, 1, 24], look: [0, 2, -40] },
    { u: 0.45, pos: [0, 0.2, 10], look: [0, 4, -40] },
    { u: 0.8, pos: [0, -1.2, 2], look: [0, -1.4, -4] },
    { u: 1, pos: [0, -1.25, 0.4], look: [0, -1.4, -4] },
  ],
  layers: [
    card('sky', [0, 8, -70], 110, 2.4, 1200, citySky),
    card('sun', [5, 14, -66], 14, 1, 600, citySun, { add: true, anim: (o, _t, u) => o.scale.setScalar(1 + u * u * 5) }),
    card('far', [0, 8, -45], 70, 2.4, 2400, cityTowers(2.4, '#c9c3d8', 0)),
    card('mid', [0, 5, -25], 46, 2.4, 2400, cityTowers(1.4, '#bdb6cf', 0.6)),
    card('walk', [0, -1, -6], 16, 2.4, 2200, crowd(false), { show: [0, 0.5] }),
    card('gaze', [0, -1, -6], 16, 2.4, 2200, crowd(true), { show: [0.5, 1.1] }),
    card('ona', [0, -1.35, -3.4], 2.4, 1.4, 900, onaAndChild, { show: [0.62, 1.1] }),
  ],
  particles: [
    { kind: 'motes', n: 160, box: [-20, -3, -30, 20, 12, 10], colors: ['#fff4d0'], size: 0.12 },
  ],
};

/* ───────────────────────── A · the meadow, and home ───────────────────────── */

function meadowMid(g: Ctx, W: number, H: number, R: Rng) {
  meadow(g, W, H * 0.34, H, R, { grass: '#aecb98', flowers: ['#6fa8dc', '#ffffff', '#b6a6e0', '#7a63b8', '#e9c54a'], hexes: true, density: 2.2 });
  fadeTop(g, W, H, 0.3, 0.38);
  for (let i = 0; i < 12; i++) hexTree(g, R() * W, H * (0.4 + R() * 0.06), H * (0.22 + R() * 0.16), R, '#e6efe8', 0.6);
}
function meadowNear(g: Ctx, W: number, H: number, R: Rng) {
  meadow(g, W, H * 0.5, H, R, { grass: '#9cbf7a', flowers: ['#7a63b8', '#9a86d6', '#ffffff', '#6fa8dc', '#e48aa8'], hexes: true, density: 3, leaves: true });
  fadeTop(g, W, H, 0.46, 0.54);
}
function onaSits(g: Ctx, W: number, H: number, R: Rng) {
  figure(g, W * 0.5, H * 0.95, H * 0.75, R, { pose: 'sit', scales: true });
  spade(g, W * 0.62, H * 0.62, H * 0.1, R, { rot: 0.4, gleam: 0.6 });
}
function onaCrowned(g: Ctx, W: number, H: number, R: Rng) {
  figure(g, W * 0.5, H * 0.95, H * 0.7, R, { pose: 'stand', scales: true, head: 'crown' });
  spade(g, W * 0.62, H * 0.6, H * 0.08, R, { rot: 0.2, gleam: 0.8 });
}

export const A3: SceneDef = {
  id: 'a3',
  paper: '#f3f2e6',
  cam: [
    { u: 0, pos: [1, -2.4, 8.5], look: [1, -3.2, 0] },
    { u: 0.5, pos: [0.6, -1.6, 11], look: [0.8, -3, 0] },
    { u: 1, pos: [0, 4, 34], look: [0, 0, -20] },
  ],
  layers: [
    card('sky', [0, -2, -60], 110, 2.0, 1400, novaSky(1)),
    card('far', [0, -1.7, -40], 80, 2.0, 2200, novaFar),
    card('mid', [0, -0.2, -18], 56, 2.0, 2600, novaMid),
    card('meadow', [0, -4.5, 0], 26, 2.2, 2600, meadowMid),
    card('sits', [1, -3.3, 1.2], 1.8, 0.8, 600, onaSits, { show: [0, 0.5] }),
    card('crowned', [1, -3.3, 1.2], 1.8, 0.8, 600, onaCrowned, { show: [0.5, 1.1] }),
    card('near', [0, -5.8, 4.5], 10, 2.4, 2200, meadowNear),
  ],
  particles: [
    { kind: 'flutter', n: 60, box: [-10, -4, -6, 10, 2, 6], colors: ['#4f8fd6', '#6fb0f0', '#3c78c4'], size: 0.3 },
    { kind: 'steam', n: 90, box: [-18, -8, -20, 18, -4, -12], colors: ['#ffffff'], size: 1.8 },
    { kind: 'petals', n: 60, box: [-8, 0, -4, 8, 6, 6], colors: ['#ffffff', '#e6f0f6'], size: 0.15 },
  ],
};

export const SCENES = [A1, B1, C1, B2, A2, A3];

// keep unused helpers from being flagged when scenes change
void blob; void paper;
