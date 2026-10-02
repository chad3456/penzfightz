/**
 * The cartoon: the full-size drawing a mosaicist lays tiles over. It is
 * painted three times from the same list of shapes: once in colour, once as
 * a metal mask (where gold and silver tesserae go) and once as a region map
 * (which part of the story each tile belongs to).
 *
 * Units: the panel is 1000 × 1250.
 */

export const W = 1000;
export const H = 1250;
export const BORDER = 30;
export const EYE = { x: 500, y: 290, r: 64 };
const TAU = Math.PI * 2;

export type Region = 'eye' | 'sun' | 'sky' | 'vimana' | 'himalaya' | 'temple' | 'city' | 'sarayu' | 'kuru' | 'border';
export const REGIONS: Region[] = ['eye', 'sun', 'sky', 'vimana', 'himalaya', 'temple', 'city', 'sarayu', 'kuru', 'border'];

/** Tesserae. Gold and silver are handled separately as metal. */
export const PALETTE: { id: string; hex: string; mat: 'stone' | 'smalti' }[] = [
  { id: 'black', hex: '#16120f', mat: 'smalti' },
  { id: 'night', hex: '#1c2659', mat: 'smalti' },
  { id: 'lapis', hex: '#2a4593', mat: 'smalti' },
  { id: 'azure', hex: '#4a78c0', mat: 'smalti' },
  { id: 'sky', hex: '#8fb2da', mat: 'stone' },
  { id: 'mist', hex: '#c6d4e2', mat: 'stone' },
  { id: 'rose', hex: '#e2a090', mat: 'stone' },
  { id: 'saffron', hex: '#eea036', mat: 'smalti' },
  { id: 'vermilion', hex: '#cb3a22', mat: 'smalti' },
  { id: 'maroon', hex: '#6f1d1c', mat: 'stone' },
  { id: 'ochre', hex: '#c88b4a', mat: 'stone' },
  { id: 'sand', hex: '#e2bc88', mat: 'stone' },
  { id: 'marble', hex: '#f0e9dc', mat: 'stone' },
  { id: 'cream', hex: '#d7c9ad', mat: 'stone' },
  { id: 'grey', hex: '#8c877f', mat: 'stone' },
  { id: 'slate', hex: '#46464d', mat: 'stone' },
  { id: 'terracotta', hex: '#a6512e', mat: 'stone' },
  { id: 'malachite', hex: '#2b744a', mat: 'smalti' },
  { id: 'leaf', hex: '#6b983f', mat: 'stone' },
  { id: 'olive', hex: '#556030', mat: 'stone' },
  { id: 'teal', hex: '#2a8a8a', mat: 'smalti' },
  { id: 'deepteal', hex: '#185462', mat: 'smalti' },
  { id: 'pink', hex: '#e48cae', mat: 'smalti' },
  { id: 'umber', hex: '#573821', mat: 'stone' },
  { id: 'peacock', hex: '#2164b0', mat: 'smalti' },
];
const P = Object.fromEntries(PALETTE.map((p) => [p.id, p.hex])) as Record<string, string>;
export const GOLD = 1, SILVER = 2;

type Ctx = OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;
type Fill = string | ((c: Ctx) => CanvasGradient);
type Op = { r: Region; f: Fill; p: (c: Ctx) => void; m?: 'g' | 's'; lw?: number };

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ops: Op[] = [];
const add = (r: Region, f: Fill, p: (c: Ctx) => void, m?: 'g' | 's', lw?: number) => ops.push({ r, f, p, m, lw });
const rect = (x: number, y: number, w: number, h: number) => (c: Ctx) => c.rect(x, y, w, h);
const circ = (x: number, y: number, r: number) => (c: Ctx) => { c.moveTo(x + r, y); c.arc(x, y, r, 0, TAU); };
const ell = (x: number, y: number, rx: number, ry: number, rot = 0) => (c: Ctx) => { c.moveTo(x + rx * Math.cos(rot), y + rx * Math.sin(rot)); c.ellipse(x, y, rx, ry, rot, 0, TAU); };
const poly = (pts: number[][]) => (c: Ctx) => { c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.closePath(); };
const line = (pts: number[][]) => (c: Ctx) => { c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); };

/* ───────── sky ───────── */
add('sky', (c) => {
  const g = c.createLinearGradient(0, 0, 0, 660);
  g.addColorStop(0, P.night); g.addColorStop(0.2, P.lapis); g.addColorStop(0.45, P.azure);
  g.addColorStop(0.7, P.sky); g.addColorStop(0.84, P.rose); g.addColorStop(1, P.saffron);
  return g;
}, rect(0, 0, W, 720));
add('sky', P.mist, circ(EYE.x, EYE.y, 232));
add('sky', P.rose, circ(EYE.x, EYE.y, 190));
add('sky', P.sand, circ(EYE.x, EYE.y, 148));
add('sky', P.saffron, circ(EYE.x, EYE.y, 104));

function cloud(cx: number, cy: number, s: number) {
  const parts = [[-52, 6, 28], [-22, -14, 34], [16, -12, 32], [48, 4, 26], [0, 10, 32], [-36, 14, 22], [32, 16, 22]];
  add('sky', P.night, (c) => { for (const [x, y, r] of parts) circ(cx + x * s, cy + y * s, r * s + 6)(c); });
  add('sky', P.marble, (c) => { for (const [x, y, r] of parts) circ(cx + x * s, cy + y * s, r * s)(c); });
  add('sky', P.mist, (c) => { for (const [x, y, r] of parts.slice(4)) circ(cx + x * s, cy + y * s + 6, r * s * 0.8)(c); });
}
cloud(150, 170, 1.15); cloud(855, 205, 1.05); cloud(820, 455, 0.8); cloud(110, 470, 0.7);

/* ───────── the sun: rays (the eye itself is laid by hand) ───────── */
for (let k = 0; k < 28; k++) {
  const a = (k / 28) * TAU + 0.06, long = k % 2 === 0, r1 = long ? 196 : 146, hw = long ? 0.07 : 0.055, r0 = 60;
  add('sun', long ? P.saffron : P.vermilion, poly([
    [EYE.x + Math.cos(a - hw) * r0, EYE.y + Math.sin(a - hw) * r0],
    [EYE.x + Math.cos(a) * r1, EYE.y + Math.sin(a) * r1],
    [EYE.x + Math.cos(a + hw) * r0, EYE.y + Math.sin(a + hw) * r0],
  ]), long ? 'g' : undefined);
}
add('eye', P.saffron, circ(EYE.x, EYE.y, 70));

/* ───────── Pushpaka vimana ───────── */
{
  const x = 205, y = 330, s = 1.05;
  const T = (px: number, py: number) => [x + px * s, y + py * s];
  add('vimana', P.marble, poly([T(-28, -4), T(-80, -50), T(-118, -38), T(-92, -18), T(-120, -10), T(-84, 4), T(-40, 10)]));
  add('vimana', P.mist, poly([T(-84, -40), T(-106, -32), T(-76, -16)]));
  add('vimana', P.marble, poly([T(28, -4), T(70, -42), T(104, -34), T(84, -16), T(108, -6), T(76, 6), T(40, 10)]));
  add('vimana', P.vermilion, rect(x - 36 * s, y - 38 * s, 72 * s, 46 * s));
  add('vimana', P.night, (c) => { for (const ox of [-22, 0, 22]) { c.moveTo(x + (ox - 7) * s, y + 6 * s); c.lineTo(x + (ox - 7) * s, y - 18 * s); c.quadraticCurveTo(x + ox * s, y - 30 * s, x + (ox + 7) * s, y - 18 * s); c.lineTo(x + (ox + 7) * s, y + 6 * s); c.closePath(); } });
  add('vimana', P.saffron, (c) => { const [a, b] = T(-44, -38); c.moveTo(a, b); const [q1, q2] = T(-30, -96); const [e1, e2] = T(0, -100); c.quadraticCurveTo(q1, q2, e1, e2); const [r1, r2] = T(30, -96); const [f1, f2] = T(44, -38); c.quadraticCurveTo(r1, r2, f1, f2); c.closePath(); }, 'g');
  add('vimana', P.saffron, circ(x, y - 108 * s, 8 * s), 'g');
  add('vimana', P.saffron, (c) => { const [a, b] = T(-62, 6); c.moveTo(a, b); const [q1, q2] = T(0, 46); const [e1, e2] = T(62, 6); c.quadraticCurveTo(q1, q2, e1, e2); c.closePath(); }, 'g');
  add('vimana', P.marble, circ(x + 74 * s, y - 4 * s, 11 * s));
  add('vimana', P.saffron, poly([T(84, -6), T(98, -2), T(84, 2)]));
  add('vimana', P.saffron, poly([T(-40, -40), T(-70, -60), T(-44, -56)]));
  add('vimana', P.saffron, poly([T(40, -40), T(70, -62), T(46, -56)]));
}

/* ───────── Himavat ───────── */
{
  const far = [[0, 600], [60, 560], [120, 585], [190, 518], [260, 570], [330, 540], [400, 578], [470, 548], [540, 572], [620, 515], [700, 560], [760, 532], [830, 575], [900, 522], [960, 562], [1000, 545]];
  add('himalaya', P.sky, poly([...far, [1000, 720], [0, 720]]));
  for (let i = 1; i < far.length - 1; i++) {
    const [px, py] = far[i];
    if (py < far[i - 1][1] && py < far[i + 1][1]) add('himalaya', P.marble, poly([[px, py], [px + 26, py + 24], [px + 10, py + 20], [px, py + 30], [px - 12, py + 22], [px - 26, py + 26]]));
  }
  add('himalaya', '#5a78b0', poly([[0, 642], [80, 604], [170, 632], [260, 598], [360, 636], [440, 612], [560, 640], [650, 602], [760, 632], [860, 600], [1000, 628], [1000, 720], [0, 720]]));
}

/* ───────── the plain before the city ───────── */
add('city', (c) => { const g = c.createLinearGradient(0, 640, 0, 900); g.addColorStop(0, P.leaf); g.addColorStop(1, P.olive); return g; }, rect(0, 650, W, 260));
for (const [x, y, r] of [[60, 700, 44], [128, 712, 36], [205, 722, 30], [940, 698, 44], [872, 712, 36], [796, 722, 30]]) {
  add('city', P.malachite, circ(x, y, r));
  add('city', P.umber, rect(x - 4, y + r - 6, 8, 26));
}

/* ───────── Ayodhya: houses and palaces behind the wall ───────── */
{
  const r = rng(42);
  const cols = [P.marble, P.terracotta, P.sand, P.marble, P.ochre, P.cream];
  for (let x = 104; x < 896;) {
    const w = 38 + r() * 36;
    if (x + w > 396 && x < 604) { x = 604; continue; }
    const h = 58 + r() * 70, top = 770 - h, col = cols[Math.floor(r() * cols.length)];
    add('city', col, rect(x, top, w, h));
    for (let wy = top + 14; wy < 750; wy += 28) for (let wx = x + 7; wx < x + w - 12; wx += 18) if (r() < 0.55) add('city', P.slate, rect(wx, wy, 10, 15));
    const roof = r();
    if (roof < 0.35) { add('city', r() < 0.25 ? P.saffron : P.marble, (c) => { c.moveTo(x + 4, top); c.arc(x + w / 2, top, w / 2 - 4, Math.PI, 0); c.closePath(); }, r() < 0.25 ? 'g' : undefined); }
    else if (roof < 0.6) { add('city', P.marble, (c) => { c.moveTo(x + w / 2 - 12, top - 14); c.arc(x + w / 2, top - 14, 12, Math.PI, 0); c.closePath(); }); add('city', P.umber, rect(x + w / 2 - 12, top - 14, 4, 14)); add('city', P.umber, rect(x + w / 2 + 8, top - 14, 4, 14)); }
    else if (roof < 0.75) { add('city', P.umber, rect(x + w / 2 - 1.5, top - 40, 3, 40)); add('city', P.saffron, poly([[x + w / 2 + 1, top - 40], [x + w / 2 + 26, top - 33], [x + w / 2 + 1, top - 26]])); }
    if (r() < 0.3) add('city', P.saffron, rect(x + 4, top + h * 0.4, w - 8, 8));
    x += w + 2;
  }
}

/* ───────── the temples ───────── */
function shikhara(cx: number, base: number, top: number, hw0: number, gold: boolean) {
  const n = 24, h = base - top;
  const hw = (y: number) => 10 + (hw0 - 10) * Math.pow((y - top) / h, 0.62);
  const pts: number[][] = [];
  for (let i = 0; i <= n; i++) { const y = top + (h * i) / n; pts.push([cx - hw(y), y]); }
  for (let i = n; i >= 0; i--) { const y = top + (h * i) / n; pts.push([cx + hw(y), y]); }
  add('temple', P.sand, poly(pts));
  for (let y = top + 18; y < base - 6; y += 22) add('temple', P.terracotta, poly([[cx - hw(y), y], [cx + hw(y), y], [cx + hw(y + 7), y + 7], [cx - hw(y + 7), y + 7]]));
  add('temple', P.ochre, poly([[cx - 6, top + 4], [cx + 6, top + 4], [cx + hw(base) * 0.2, base], [cx - hw(base) * 0.2, base]]));
  add('temple', P.cream, ell(cx, top - 4, hw0 * 0.36, 9));
  add('temple', P.saffron, circ(cx, top - 22, 10), gold ? 'g' : undefined);
  add('temple', P.umber, rect(cx - 3, top - 92, 6, 72));
  add('temple', P.saffron, poly([[cx + 3, top - 92], [cx + 66, top - 76], [cx + 3, top - 58]]));
}
shikhara(338, 690, 548, 46, false);
shikhara(662, 690, 548, 46, false);
add('temple', P.sand, rect(410, 616, 180, 90));
shikhara(500, 650, 430, 78, true);
for (const x of [440, 560]) { add('temple', P.cream, (c) => { c.moveTo(x - 30, 640); c.arc(x, 640, 30, Math.PI, 0); c.closePath(); }); add('temple', P.saffron, circ(x, 606, 6), 'g'); }

/* ───────── the walls and the gate ───────── */
add('city', P.ochre, rect(56, 770, 888, 92));
for (let x = 56; x < 940; x += 34) add('city', P.ochre, rect(x, 752, 20, 20));
add('city', P.terracotta, rect(56, 800, 888, 12));
add('city', P.umber, rect(56, 852, 888, 10));
for (const x of [96, 286, 714, 904]) {
  add('city', P.sand, rect(x - 30, 722, 60, 140));
  add('city', P.marble, (c) => { c.moveTo(x - 30, 722); c.arc(x, 722, 30, Math.PI, 0); c.closePath(); });
  add('city', P.saffron, circ(x, 686, 6), 'g');
  add('city', P.slate, rect(x - 5, 758, 10, 22));
  add('city', P.terracotta, rect(x - 30, 800, 60, 12));
}
add('city', P.sand, rect(428, 690, 144, 172));
for (let x = 428; x < 572; x += 24) add('city', P.sand, rect(x, 676, 14, 16));
add('city', P.slate, (c) => { c.moveTo(464, 862); c.lineTo(464, 784); c.quadraticCurveTo(500, 730, 536, 784); c.lineTo(536, 862); c.closePath(); });
add('city', P.umber, rect(472, 790, 26, 72));
add('city', P.umber, rect(502, 790, 26, 72));
for (const x of [446, 554]) { add('city', P.marble, (c) => { c.moveTo(x - 17, 676); c.arc(x, 676, 17, Math.PI, 0); c.closePath(); }); add('city', P.saffron, circ(x, 654, 5), 'g'); }
add('city', P.saffron, rect(432, 712, 136, 10), 'g');

/* ───────── ghats ───────── */
add('city', P.olive, rect(0, 862, W, 46));
for (let i = 0; i < 5; i++) add('city', i % 2 ? P.sand : P.cream, rect(160 + i * 12, 862 + i * 9, 680 - i * 24, 9));
for (const x of [190, 810]) { add('city', P.marble, poly([[x - 16, 862], [x - 16, 836], [x, 806], [x + 16, 836], [x + 16, 862]])); add('city', P.saffron, circ(x, 802, 4), 'g'); }

/* ───────── Sarayu ───────── */
add('sarayu', (c) => { const g = c.createLinearGradient(0, 905, 0, 1006); g.addColorStop(0, P.teal); g.addColorStop(1, P.deepteal); return g; }, rect(0, 905, W, 102));
{
  const r = rng(9);
  for (let y = 920; y < 1000; y += 16) for (let x = -30 + ((y / 16) % 2) * 35; x < W; x += 70 + r() * 20) add('sarayu', P.mist, line([[x, y], [x + 14, y - 4], [x + 30, y], [x + 44, y - 3]]), undefined, 4);
  for (let y = 910; y < 1002; y += 9) { const w = 56 - (y - 910) * 0.35 + r() * 14; add('sarayu', P.saffron, rect(500 - w / 2 + (r() - 0.5) * 8, y, w, 4.5), 'g'); }
}
for (const [x, y] of [[250, 952], [770, 966]]) {
  add('sarayu', P.umber, (c) => { c.moveTo(x - 66, y - 4); c.quadraticCurveTo(x, y + 34, x + 66, y - 4); c.closePath(); });
  add('sarayu', P.umber, rect(x - 3, y - 74, 6, 72));
  add('sarayu', P.saffron, poly([[x + 3, y - 72], [x + 50, y - 10], [x + 3, y - 10]]));
  add('sarayu', P.marble, poly([[x - 3, y - 60], [x - 36, y - 10], [x - 3, y - 10]]));
}
for (const [x, y] of [[80, 928], [118, 962], [920, 932], [884, 978]]) { add('sarayu', P.malachite, ell(x + 14, y + 6, 18, 7)); add('sarayu', P.pink, circ(x, y, 8)); }
add('sarayu', P.sand, rect(0, 1002, W, 12));

/* ───────── Kurukshetra ───────── */
add('kuru', P.saffron, rect(0, 1014, W, 9), 'g');
add('kuru', P.maroon, rect(0, 1023, W, 230));
add('kuru', P.terracotta, rect(0, 1178, W, 80));
{
  const r = rng(77);
  const cols = [P.saffron, P.lapis, P.vermilion, P.malachite, P.marble];
  for (const [x0, x1] of [[40, 230], [770, 960]]) for (let x = x0; x < x1; x += 22) {
    const y = 1062 + (Math.floor(x / 22) % 2) * 16, col = cols[Math.floor(r() * cols.length)];
    add('kuru', P.umber, rect(x, y, 4, 116 - (y - 1062)));
    if (r() < 0.55) add('kuru', col, poly([[x + 4, y], [x + 26, y + 8], [x + 4, y + 16]]));
    else add('kuru', col, (c) => { c.moveTo(x - 14, y + 10); c.arc(x + 2, y + 10, 16, Math.PI, 0); c.closePath(); });
  }
}
{ // an elephant with its howdah
  const x = 880, y = 1132;
  add('kuru', P.grey, ell(x, y, 58, 38));
  add('kuru', P.grey, circ(x - 52, y - 16, 28));
  add('kuru', P.grey, line([[x - 72, y - 6], [x - 82, y + 24], [x - 74, y + 46]]), undefined, 12);
  for (const lx of [x - 40, x - 14, x + 18, x + 40]) add('kuru', P.grey, rect(lx - 9, y + 20, 18, 40));
  add('kuru', P.marble, line([[x - 62, y + 2], [x - 76, y + 12]]), undefined, 5);
  add('kuru', P.vermilion, rect(x - 40, y - 42, 70, 24));
  add('kuru', P.saffron, rect(x - 32, y - 70, 54, 28), 'g');
  add('kuru', P.slate, circ(x - 58, y - 22, 3.5));
}
function horse(x: number, y: number) {
  add('kuru', P.grey, ell(x + 2, y + 4, 50, 22));
  add('kuru', P.marble, ell(x, y, 48, 20));
  add('kuru', P.marble, poly([[x - 32, y - 10], [x - 58, y - 46], [x - 44, y - 56], [x - 18, y - 16]]));
  add('kuru', P.marble, ell(x - 64, y - 46, 17, 9, -0.35));
  add('kuru', P.grey, line([[x - 42, y - 54], [x - 26, y - 30], [x - 18, y - 16]]), undefined, 5);
  for (const [a, b, c2, d] of [[-30, 10, -64, 38], [-22, 12, -44, 48], [30, 10, 58, 42], [22, 12, 40, 50]]) add('kuru', P.marble, line([[x + a, y + b], [x + c2, y + d]]), undefined, 8);
  add('kuru', P.cream, line([[x + 46, y - 6], [x + 66, y - 2], [x + 76, y + 18]]), undefined, 7);
}
horse(300, 1118); horse(372, 1104); horse(332, 1140); horse(410, 1128);
{ // the chariot
  add('kuru', P.umber, line([[566, 1124], [380, 1092]]), undefined, 7);
  add('kuru', P.umber, line([[592, 1048], [338, 1070]]), undefined, 3);
  add('kuru', P.umber, line([[592, 1050], [298, 1080]]), undefined, 3);
  add('kuru', P.saffron, poly([[562, 1068], [718, 1068], [708, 1142], [574, 1142]]));
  add('kuru', P.saffron, rect(560, 1062, 160, 9), 'g');
  for (const x of [596, 636, 676]) add('kuru', P.vermilion, circ(x, 1104, 11));
  add('kuru', P.saffron, circ(645, 1162, 42), 'g', 10);
  for (let k = 0; k < 8; k++) { const a = (k / 8) * TAU; add('kuru', P.umber, line([[645, 1162], [645 + Math.cos(a) * 38, 1162 + Math.sin(a) * 38]]), undefined, 4); }
  add('kuru', P.saffron, circ(645, 1162, 9), 'g');
  // Krishna, the charioteer
  add('kuru', P.saffron, rect(578, 1026, 28, 44));
  add('kuru', P.peacock, circ(592, 1012, 12));
  add('kuru', P.peacock, line([[582, 1036], [566, 1050]]), undefined, 7);
  add('kuru', P.saffron, poly([[580, 1002], [592, 984], [604, 1002]]), 'g');
  add('kuru', P.malachite, ell(606, 984, 6, 12, 0.5));
  add('kuru', P.peacock, circ(607, 982, 3.5));
  // Arjuna with Gandiva
  add('kuru', P.malachite, rect(660, 1006, 26, 62));
  add('kuru', P.sand, circ(673, 994, 12));
  add('kuru', P.saffron, poly([[660, 986], [673, 966], [686, 986]]), 'g');
  add('kuru', P.umber, (c) => { c.moveTo(712 + Math.cos(-1.25) * 62, 1036 + Math.sin(-1.25) * 62); c.arc(712, 1036, 62, -1.25, 1.25); }, undefined, 6);
  add('kuru', P.cream, line([[712 + Math.cos(-1.25) * 62, 1036 + Math.sin(-1.25) * 62], [712 + Math.cos(1.25) * 62, 1036 + Math.sin(1.25) * 62]]), undefined, 2);
  // the kapidhvaja: Hanuman on Arjuna's banner
  add('kuru', P.umber, rect(722, 972, 6, 98));
  add('kuru', P.saffron, poly([[728, 974], [804, 982], [788, 1004], [804, 1026], [728, 1022]]));
  add('kuru', P.vermilion, circ(756, 990, 10));
  add('kuru', P.vermilion, ell(759, 1008, 10, 9));
  add('kuru', P.vermilion, line([[768, 1014], [782, 1006], [780, 990]]), undefined, 4);
  // dust behind the wheels
  for (const [x, y, rr] of [[740, 1190, 22], [770, 1200, 16], [210, 1196, 20], [240, 1204, 14]]) add('kuru', P.ochre, circ(x, y, rr));
}

/** Places that need smaller tesserae (faces, figures, small craft). */
export const DETAIL: { x: number; y: number; w: number; h: number; k: number }[] = [
  { x: 548, y: 960, w: 270, h: 200, k: 2.4 },
  { x: 230, y: 1040, w: 230, h: 130, k: 1.6 },
  { x: 80, y: 200, w: 260, h: 180, k: 1.4 },
  { x: 440, y: 330, w: 130, h: 140, k: 1.6 },
  { x: 420, y: 650, w: 160, h: 220, k: 1.4 },
  { x: 175, y: 870, w: 150, h: 110, k: 1.7 },
  { x: 695, y: 880, w: 150, h: 110, k: 1.7 },
  { x: 800, y: 1050, w: 160, h: 140, k: 1.3 },
];

/* ───────── painting ───────── */

const REGION_CODE = Object.fromEntries(REGIONS.map((r, i) => [r, i])) as Record<Region, number>;

export function paint(c: Ctx, mode: 'color' | 'metal' | 'region', scale: number) {
  c.save();
  c.scale(scale, scale);
  c.fillStyle = mode === 'color' ? P.night : '#000';
  c.fillRect(0, 0, W, H);
  for (const op of ops) {
    let style: string | CanvasGradient;
    if (mode === 'color') style = typeof op.f === 'string' ? op.f : op.f(c);
    else if (mode === 'metal') style = op.m === 'g' ? '#ff0000' : op.m === 's' ? '#00ff00' : '#000000';
    else style = `rgb(${(REGION_CODE[op.r] + 1) * 20},0,0)`;
    if (mode !== 'color' && typeof op.f !== 'string' && op.r === 'sky' && mode === 'metal') continue;
    c.beginPath();
    op.p(c);
    if (op.lw) { c.strokeStyle = style; c.lineWidth = op.lw; c.lineCap = 'round'; c.lineJoin = 'round'; c.stroke(); }
    else { c.fillStyle = style; c.fill(); }
  }
  c.restore();
}

export function regionFromCode(r: number): number {
  return Math.max(0, Math.min(REGIONS.length - 1, Math.round(r / 20) - 1));
}
