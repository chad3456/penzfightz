import { createNoise2D } from 'simplex-noise';

/**
 * A painter's kit for the look of a landscape architect's rendering: flat
 * pastel shapes, fine stipple in every fill, round clustered trees, meadows
 * of lavender, yarrow and daisies, pink-timber boardwalks, and pale faceless
 * figures like the white people in a presentation board.
 *
 * Everything draws into a 2D canvas in pixel units; `u` is one hundredth of
 * the canvas height, so a drawing scales with its canvas.
 */

export type Ctx = CanvasRenderingContext2D;
export type Rng = () => number;

export function rng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const PAPER = '#f3f2ea';

export function canvas(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = Math.max(2, Math.round(w));
  c.height = Math.max(2, Math.round(h));
  return c;
}

/** A colour, lighter (k > 0) or darker (k < 0). */
export function shade(hex: string, k: number) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  if (k >= 0) { r += (255 - r) * k; g += (255 - g) * k; b += (255 - b) * k; }
  else { r *= 1 + k; g *= 1 + k; b *= 1 + k; }
  return `rgb(${r | 0},${g | 0},${b | 0})`;
}
export function rgba(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

/** Scatter dots over whatever is clipped: the grain of a marker rendering. */
export function stipple(g: Ctx, x: number, y: number, w: number, h: number, color: string, density: number, R: Rng, size = 1.2) {
  g.fillStyle = color;
  const n = Math.min(60000, Math.round(w * h * density * 0.001));
  for (let i = 0; i < n; i++) {
    const s = size * (0.6 + R() * 0.8);
    g.fillRect(x + R() * w, y + R() * h, s, s);
  }
}

/** Fill a path flat, then stipple it darker and lighter inside the path. */
export function fillStipple(g: Ctx, path: Path2D, color: string, R: Rng, box: [number, number, number, number], dens = 1, dot = 1.2) {
  g.fillStyle = color;
  g.fill(path);
  g.save();
  g.clip(path);
  stipple(g, box[0], box[1], box[2], box[3], shade(color, -0.18), 9 * dens, R, dot);
  stipple(g, box[0], box[1], box[2], box[3], shade(color, 0.35), 6 * dens, R, dot);
  g.restore();
}

/** The whole sheet: warm off-white with its own grain. */
export function paper(g: Ctx, W: number, H: number, R: Rng, color = PAPER) {
  g.fillStyle = color;
  g.fillRect(0, 0, W, H);
  stipple(g, 0, 0, W, H, shade(color, -0.07), 5, R, 1.1);
}

/** A vertical wash: sky, dusk, dawn. */
export function wash(g: Ctx, W: number, H: number, stops: [number, string][]) {
  const gr = g.createLinearGradient(0, 0, 0, H);
  for (const [o, c] of stops) gr.addColorStop(o, c);
  g.fillStyle = gr;
  g.fillRect(0, 0, W, H);
}

/** A blob path: a circle whose radius wanders with noise. */
export function blob(cx: number, cy: number, r: number, R: Rng, wob = 0.18, n = 28) {
  const p = new Path2D();
  const ph = R() * 10;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const rr = r * (1 + wob * Math.sin(a * 3 + ph) * 0.6 + wob * (R() - 0.5) * 0.5);
    const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
    if (i === 0) p.moveTo(x, y); else p.lineTo(x, y);
  }
  p.closePath();
  return p;
}

/**
 * A round broadleaf tree, drawn the way the reference draws them: a cluster
 * of scalloped leaf-lobes, lighter on top and left, darker underneath, each
 * lobe veined with a few fine lines.
 */
export function roundTree(g: Ctx, x: number, y: number, r: number, R: Rng, pal: { light: string; mid: string; dark: string; trunk?: string }) {
  g.strokeStyle = pal.trunk ?? '#8a7560';
  g.lineWidth = Math.max(1, r * 0.07);
  g.beginPath(); g.moveTo(x, y); g.lineTo(x + (R() - 0.5) * r * 0.1, y - r * 1.3); g.stroke();
  const lobes = 6 + Math.floor(R() * 6);
  const cy = y - r * 1.55;
  for (let i = 0; i < lobes; i++) {
    const a = R() * Math.PI * 2, d = R() * r * 0.6;
    const lx = x + Math.cos(a) * d, ly = cy + Math.sin(a) * d * 0.8;
    const lr = r * (0.35 + R() * 0.3);
    const top = ly < cy;
    const col = top ? pal.light : R() < 0.5 ? pal.mid : pal.dark;
    const p = blob(lx, ly, lr, R, 0.25, 18);
    fillStipple(g, p, col, R, [lx - lr * 1.3, ly - lr * 1.3, lr * 2.6, lr * 2.6], 0.8);
    g.strokeStyle = shade(col, -0.25);
    g.lineWidth = Math.max(0.5, r * 0.012);
    for (let k = 0; k < 3; k++) {
      const va = a + (R() - 0.5) * 2;
      g.beginPath(); g.moveTo(lx, ly); g.lineTo(lx + Math.cos(va) * lr * 0.8, ly + Math.sin(va) * lr * 0.8); g.stroke();
    }
  }
}

/** A conifer: jagged tiers, dark. */
export function conifer(g: Ctx, x: number, y: number, h: number, R: Rng, col = '#5f8a5a') {
  const tiers = 5 + Math.floor(R() * 3);
  for (let i = 0; i < tiers; i++) {
    const t = i / tiers;
    const w = h * 0.34 * (1 - t * 0.8);
    const ty = y - h * t * 0.9;
    const p = new Path2D();
    p.moveTo(x - w, ty); p.lineTo(x, ty - h * 0.3); p.lineTo(x + w, ty);
    for (let k = 0; k <= 6; k++) p.lineTo(x + w - (k / 6) * w * 2, ty + (k % 2 ? h * 0.03 : 0));
    p.closePath();
    fillStipple(g, p, i % 2 ? col : shade(col, 0.12), R, [x - w, ty - h * 0.3, w * 2, h * 0.35], 0.8);
  }
}

/**
 * A whitewood tree of Nova Pacifica: a six-sided trunk drawn as two
 * flat-lit faces, and a canopy of small hexagonal leaves like mirrors.
 */
export function hexTree(g: Ctx, x: number, y: number, h: number, R: Rng, tint = '#dfe9e2') {
  const w = h * 0.045;
  g.fillStyle = shade(tint, -0.08); g.fillRect(x - w, y - h, w, h);
  g.fillStyle = shade(tint, -0.22); g.fillRect(x, y - h, w * 0.8, h);
  g.strokeStyle = shade(tint, -0.35); g.lineWidth = Math.max(0.5, w * 0.08);
  g.strokeRect(x - w, y - h, w * 1.8, h);
  const n = 26 + Math.floor(R() * 20);
  for (let i = 0; i < n; i++) {
    const a = R() * Math.PI * 2, d = Math.sqrt(R()) * h * 0.3;
    hexagon(g, x + Math.cos(a) * d, y - h * 0.95 + Math.sin(a) * d * 0.7, h * (0.03 + R() * 0.035), R() * 0.5,
      R() < 0.3 ? '#ffffff' : R() < 0.6 ? tint : shade(tint, -0.12), shade(tint, -0.3));
  }
}

export function hexagon(g: Ctx, x: number, y: number, r: number, rot: number, fill: string, stroke?: string) {
  g.beginPath();
  for (let i = 0; i < 6; i++) { const a = rot + (i / 6) * Math.PI * 2; g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); }
  g.closePath();
  g.fillStyle = fill; g.fill();
  if (stroke) { g.strokeStyle = stroke; g.lineWidth = Math.max(0.5, r * 0.08); g.stroke(); }
}

/** A band of grass and flowers across the bottom of a canvas, in the meadow style. */
export function meadow(g: Ctx, W: number, top: number, H: number, R: Rng, o: { density?: number; flowers?: string[]; grass?: string; leaves?: boolean; hexes?: boolean } = {}) {
  const dens = o.density ?? 1;
  const grass = o.grass ?? '#9cbf7a';
  const flowers = o.flowers ?? ['#7a63b8', '#e48aa8', '#e9c54a', '#ffffff', '#9a86d6'];
  g.fillStyle = shade(grass, 0.25);
  g.fillRect(0, top, W, H - top);
  stipple(g, 0, top, W, H - top, shade(grass, -0.15), 12, R);
  const n = Math.round(W * (H - top) * 0.004 * dens);
  const items: [number, number, number][] = [];
  for (let i = 0; i < n; i++) items.push([R() * W, top + Math.pow(R(), 0.8) * (H - top), R()]);
  items.sort((a, b) => a[1] - b[1]);
  for (const [x, y, k] of items) {
    const s = 0.4 + ((y - top) / Math.max(1, H - top)) * 1.4;
    const hh = (8 + R() * 22) * s * (H / 1000) * 1.6;
    g.strokeStyle = R() < 0.5 ? grass : shade(grass, -0.2);
    g.lineWidth = Math.max(0.6, s * 0.9);
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + (R() - 0.5) * hh * 0.4, y - hh * 0.6, x + (R() - 0.5) * hh * 0.5, y - hh); g.stroke();
    if (k < 0.55) {
      const c = flowers[Math.floor(R() * flowers.length)]!;
      const fx = x + (R() - 0.5) * hh * 0.4, fy = y - hh;
      if (c === '#7a63b8' || c === '#9a86d6') {
        // a lavender or salvia spike
        g.fillStyle = c;
        for (let j = 0; j < 7; j++) g.fillRect(fx - s, fy + j * s * 2.2, s * 2.2, s * 1.6);
      } else if (o.hexes && R() < 0.5) {
        hexagon(g, fx, fy, s * 2.6, R(), c, shade(c, -0.25));
      } else {
        // a disc: daisy, yarrow head, pink bloom
        g.fillStyle = c;
        g.beginPath(); g.arc(fx, fy, s * (c === '#ffffff' ? 2.4 : 2), 0, Math.PI * 2); g.fill();
        if (c === '#ffffff') { g.fillStyle = '#e9c54a'; g.beginPath(); g.arc(fx, fy, s * 0.8, 0, Math.PI * 2); g.fill(); }
      }
    }
  }
  if (o.leaves) {
    for (let i = 0; i < 8 * dens; i++) {
      const x = R() * W, y = H - R() * (H - top) * 0.25, r = H * (0.05 + R() * 0.05);
      const p = new Path2D();
      const a = -Math.PI / 2 + (R() - 0.5) * 1.4;
      p.moveTo(x, y);
      p.quadraticCurveTo(x + Math.cos(a - 0.5) * r, y + Math.sin(a - 0.5) * r, x + Math.cos(a) * r * 1.8, y + Math.sin(a) * r * 1.8);
      p.quadraticCurveTo(x + Math.cos(a + 0.5) * r, y + Math.sin(a + 0.5) * r, x, y);
      fillStipple(g, p, '#6e9a5a', R, [x - r * 2, y - r * 2, r * 4, r * 4]);
      g.strokeStyle = '#4f7a45'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * r * 1.7, y + Math.sin(a) * r * 1.7); g.stroke();
    }
  }
}

/** Ploughed or striped fields, as in an axonometric site plan. */
export function stripes(g: Ctx, path: Path2D, color: string, angle: number, gap: number, R: Rng, box: [number, number, number, number]) {
  fillStipple(g, path, color, R, box, 0.6);
  g.save(); g.clip(path);
  g.strokeStyle = shade(color, -0.12); g.lineWidth = Math.max(0.6, gap * 0.12);
  const [bx, by, bw, bh] = box;
  const d = Math.hypot(bw, bh);
  const cx = bx + bw / 2, cy = by + bh / 2;
  for (let s = -d; s < d; s += gap) {
    g.beginPath();
    g.moveTo(cx + Math.cos(angle) * -d + Math.cos(angle + Math.PI / 2) * s, cy + Math.sin(angle) * -d + Math.sin(angle + Math.PI / 2) * s);
    g.lineTo(cx + Math.cos(angle) * d + Math.cos(angle + Math.PI / 2) * s, cy + Math.sin(angle) * d + Math.sin(angle + Math.PI / 2) * s);
    g.stroke();
  }
  g.restore();
}

/** Water: a lilac wash with drawn ripple lines. */
export function water(g: Ctx, path: Path2D, R: Rng, box: [number, number, number, number], color = '#b9b6da') {
  fillStipple(g, path, color, R, box, 0.7);
  g.save(); g.clip(path);
  g.strokeStyle = shade(color, 0.35); g.lineWidth = Math.max(0.7, box[3] * 0.003);
  for (let i = 0; i < box[2] * box[3] * 0.00018; i++) {
    const x = box[0] + R() * box[2], y = box[1] + R() * box[3], l = box[2] * (0.01 + R() * 0.03);
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + l / 2, y - l * 0.08, x + l, y); g.stroke();
  }
  g.restore();
}

export interface FigureOpts {
  /** Body colour: the reference's people are white. */
  color?: string;
  pose?: 'stand' | 'walk' | 'sit' | 'swim' | 'arms-up';
  /** Ona's helmet, Fred's rubber mask, a veil… */
  head?: 'plain' | 'helmet' | 'mask' | 'crown' | 'queue' | 'hat' | 'hair';
  scales?: boolean;
  dress?: boolean;
  facing?: 1 | -1;
  accent?: string;
}

/**
 * A pale faceless figure, like the white people in the reference. `h` is the
 * standing height in pixels; the figure stands with its feet at (x, y).
 */
export function figure(g: Ctx, x: number, y: number, h: number, R: Rng, o: FigureOpts = {}) {
  const col = o.color ?? '#f7f6f2';
  const edge = shade(col === '#f7f6f2' ? '#c9c6bd' : col, -0.3);
  const f = o.facing ?? 1;
  g.save();
  g.translate(x, y);
  g.scale(f, 1);
  g.lineJoin = 'round'; g.lineCap = 'round';
  const u = h / 100;
  const pose = o.pose ?? 'stand';
  const limb = (pts: number[][], w: number) => {
    g.strokeStyle = edge; g.lineWidth = w * u + 1.4;
    g.beginPath(); pts.forEach(([a, b], i) => (i ? g.lineTo(a! * u, b! * u) : g.moveTo(a! * u, b! * u))); g.stroke();
    g.strokeStyle = col; g.lineWidth = w * u;
    g.beginPath(); pts.forEach(([a, b], i) => (i ? g.lineTo(a! * u, b! * u) : g.moveTo(a! * u, b! * u))); g.stroke();
  };
  if (pose === 'sit') {
    limb([[-2, -46], [14, -44], [16, -22]], 9);
    limb([[2, -46], [18, -44], [22, -22]], 8);
  } else if (pose === 'swim') {
    limb([[-30, -10], [0, -8]], 10);
  } else {
    const s = pose === 'walk' ? 10 : 3;
    limb([[-3, -48], [-3 - s, -24], [-4 - s, 0]], 9);
    limb([[3, -48], [3 + s, -24], [4 + s * 1.3, 0]], 9);
  }
  // torso
  const tp = new Path2D();
  const ty = pose === 'sit' ? -46 : -48;
  if (o.dress) { tp.moveTo(-8 * u, (ty - 32) * u); tp.lineTo(8 * u, (ty - 32) * u); tp.lineTo(16 * u, (ty + 14) * u); tp.lineTo(-16 * u, (ty + 14) * u); }
  else { tp.moveTo(-9 * u, (ty - 32) * u); tp.lineTo(9 * u, (ty - 32) * u); tp.lineTo(7 * u, (ty + 2) * u); tp.lineTo(-7 * u, (ty + 2) * u); }
  tp.closePath();
  if (pose === 'swim') { g.rotate(-Math.PI / 2 + 0.1); g.translate(-ty * u * 0.2, -40 * u); }
  g.fillStyle = col; g.fill(tp);
  g.strokeStyle = edge; g.lineWidth = 1.2; g.stroke(tp);
  if (o.scales) {
    g.save(); g.clip(tp);
    for (let i = 0; i < 70; i++) { g.fillStyle = ['#bfe3e8', '#e8d6f4', '#f4e7b8', '#ffffff'][i % 4]!; g.fillRect((R() - 0.5) * 18 * u, (ty - 32 + R() * 34) * u, 1.6 * u, 1.2 * u); }
    g.restore();
  }
  if (o.accent) { g.fillStyle = o.accent; g.fillRect(-9 * u, (ty - 32) * u, 18 * u, 6 * u); }
  // arms
  if (pose === 'arms-up') { limb([[-8, ty - 28], [-16, ty - 46], [-14, ty - 60]], 6); limb([[8, ty - 28], [16, ty - 46], [14, ty - 60]], 6); }
  else if (pose === 'swim') { limb([[8, ty - 28], [26, ty - 34]], 6); limb([[-8, ty - 28], [-20, ty - 18]], 6); }
  else { limb([[-9, ty - 28], [-12, ty - 12], [-12, ty + 2]], 6); limb([[9, ty - 28], [13, ty - 12], [13 + (pose === 'walk' ? 3 : 0), ty + 2]], 6); }
  // head
  const hy = (ty - 42) * u, hr = 8.5 * u;
  g.fillStyle = col; g.beginPath(); g.arc(0, hy, hr, 0, Math.PI * 2); g.fill();
  g.strokeStyle = edge; g.lineWidth = 1.2; g.stroke();
  const head = o.head ?? 'plain';
  if (head === 'helmet') {
    g.strokeStyle = 'rgba(150,190,200,0.9)'; g.lineWidth = 1.6 * u;
    g.fillStyle = 'rgba(210,235,240,0.45)';
    g.beginPath(); g.arc(0, hy, hr * 1.55, 0, Math.PI * 2); g.fill(); g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.8)'; g.beginPath(); g.ellipse(-hr * 0.6, hy - hr * 0.7, hr * 0.35, hr * 0.18, -0.6, 0, Math.PI * 2); g.fill();
  } else if (head === 'mask') {
    // a rubber mask: a pinkish face with a quiff and a painted grin
    g.fillStyle = '#e9c3ae'; g.beginPath(); g.ellipse(0, hy + hr * 0.1, hr * 1.02, hr * 1.12, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#6b5a4c'; g.beginPath(); g.ellipse(0, hy - hr * 0.8, hr * 1.05, hr * 0.45, 0, Math.PI, Math.PI * 2); g.fill();
    g.strokeStyle = '#7a4d3c'; g.lineWidth = Math.max(1, u);
    g.beginPath(); g.arc(0, hy + hr * 0.25, hr * 0.5, 0.2, Math.PI - 0.2); g.stroke();
    g.fillStyle = '#3a2d26'; g.fillRect(-hr * 0.45, hy - hr * 0.2, hr * 0.22, hr * 0.14); g.fillRect(hr * 0.25, hy - hr * 0.2, hr * 0.22, hr * 0.14);
  } else if (head === 'crown') {
    g.strokeStyle = '#cfe0d6'; g.lineWidth = 1.2 * u;
    for (let i = 0; i < 12; i++) { const a = -Math.PI / 2 + ((i - 5.5) / 12) * Math.PI * 1.3; g.beginPath(); g.moveTo(Math.cos(a) * hr, hy + Math.sin(a) * hr); g.quadraticCurveTo(Math.cos(a) * hr * 1.8, hy + Math.sin(a) * hr * 1.6, Math.cos(a + 0.2) * hr * 2.4, hy + Math.sin(a + 0.2) * hr * 2.3); g.stroke(); }
  } else if (head === 'queue' || head === 'hair') {
    g.fillStyle = '#3a3430'; g.beginPath(); g.arc(0, hy - hr * 0.1, hr * 1.02, Math.PI * 1.05, Math.PI * 1.95); g.fill();
    if (head === 'queue') { g.strokeStyle = '#3a3430'; g.lineWidth = 2 * u; g.beginPath(); g.moveTo(-hr * 0.8, hy); g.quadraticCurveTo(-hr * 1.4, hy + hr * 2, -hr * 0.9, hy + hr * 4); g.stroke(); }
  } else if (head === 'hat') {
    g.fillStyle = '#4a4340'; g.fillRect(-hr * 1.6, hy - hr * 0.9, hr * 3.2, hr * 0.35); g.fillRect(-hr * 0.9, hy - hr * 2.1, hr * 1.8, hr * 1.3);
  }
  g.restore();
}

/** Noise for paths that should wander: shorelines, hills, smoke. */
export function noise2(seed: number) { return createNoise2D(rng(seed)); }

/** A ridge line across the canvas, filled below. */
export function ridge(g: Ctx, W: number, y: number, amp: number, freq: number, R: Rng, color: string, H: number, seed = 1) {
  const n = noise2(seed);
  const p = new Path2D();
  p.moveTo(0, H);
  for (let x = 0; x <= W; x += W / 160) p.lineTo(x, y + n(x * freq, seed) * amp + n(x * freq * 3, seed + 3) * amp * 0.3);
  p.lineTo(W, H); p.closePath();
  fillStipple(g, p, color, R, [0, y - amp * 1.4, W, H - y + amp * 1.4], 0.8);
  return p;
}

/** An axonometric box building: two walls and a roof, timber lines on the walls. */
export function building(g: Ctx, x: number, y: number, w: number, h: number, d: number, R: Rng, o: { wall: string; roof: string; lines?: boolean; windows?: string; roofPeak?: number } ) {
  const dx = d * 0.7, dy = d * 0.35;
  const front = new Path2D(); front.rect(x, y - h, w, h);
  fillStipple(g, front, o.wall, R, [x, y - h, w, h], 0.6);
  const side = new Path2D(); side.moveTo(x + w, y); side.lineTo(x + w + dx, y - dy); side.lineTo(x + w + dx, y - dy - h); side.lineTo(x + w, y - h); side.closePath();
  fillStipple(g, side, shade(o.wall, -0.14), R, [x + w, y - h - dy, dx, h + dy], 0.6);
  if (o.lines) {
    g.strokeStyle = shade(o.wall, -0.12); g.lineWidth = Math.max(0.5, w * 0.004);
    for (let lx = x; lx < x + w; lx += Math.max(3, w * 0.018)) { g.beginPath(); g.moveTo(lx, y); g.lineTo(lx, y - h); g.stroke(); }
  }
  const pk = o.roofPeak ?? 0;
  const roof = new Path2D();
  roof.moveTo(x - w * 0.03, y - h); roof.lineTo(x + w / 2, y - h - pk); roof.lineTo(x + w * 1.03, y - h); roof.lineTo(x + w * 1.03 + dx, y - h - dy); roof.lineTo(x + w / 2 + dx, y - h - pk - dy); roof.lineTo(x - w * 0.03 + dx, y - h - dy); roof.closePath();
  fillStipple(g, roof, o.roof, R, [x - w * 0.05, y - h - pk - dy, w * 1.1 + dx, pk + dy], 0.6);
  if (o.windows) {
    const cols = Math.max(1, Math.round(w / (h * 0.45)));
    for (let i = 0; i < cols; i++) {
      const wx = x + (w / cols) * (i + 0.3), wy = y - h * 0.72;
      g.fillStyle = o.windows; g.fillRect(wx, wy, (w / cols) * 0.4, h * 0.3);
    }
  }
}

/** Soft glow: lanterns, jellies, the sun. */
export function glow(g: Ctx, x: number, y: number, r: number, color: string, a = 1) {
  const gr = g.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, rgba(color, a));
  gr.addColorStop(1, rgba(color, 0));
  g.fillStyle = gr;
  g.fillRect(x - r, y - r, r * 2, r * 2);
}
