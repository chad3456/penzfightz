import { arc, bez, line, quad, smooth, type P, type Pen } from './pen';

/**
 * Everything drawn on the site: Hazel the witch in her poses, Parsnip the
 * cat, the broom, the humans of 2026 and their strange belongings. All drawn
 * with the one wobbly pen, in local coordinates that a Frame places and
 * scales. Original drawings.
 */

export class Frame {
  constructor(public pen: Pen, public x: number, public y: number, public s = 1, public rot = 0, public flip = 1, public id = 1) {}
  map(p: P): P {
    const lx = p[0] * this.s * this.flip, ly = p[1] * this.s;
    const c = Math.cos(this.rot), n = Math.sin(this.rot);
    return [this.x + lx * c - ly * n, this.y + lx * n + ly * c];
  }
  L(pts: P[], k: number, o: { w?: number; close?: boolean; fill?: string; wob?: number } = {}) {
    line(this.pen, pts.map((p) => this.map(p)), this.id * 1000 + k, { ...o, w: (o.w ?? this.pen.width) * Math.min(1.6, Math.max(0.55, Math.sqrt(this.s))) });
  }
  sub(x: number, y: number, s = 1, rot = 0, flip = 1, id = 1) {
    const [px, py] = this.map([x, y]);
    return new Frame(this.pen, px, py, this.s * s, this.rot + rot * this.flip, this.flip * flip, this.id * 31 + id);
  }
}

const sin = Math.sin;

// --------------------------------------------------------------- Hazel
export type Pose = 'arms-up' | 'wave' | 'shrug' | 'point' | 'hold' | 'fly' | 'stand' | 'write';

/**
 * Hazel Mothwick, 347, field correspondent. Origin at her feet, about 220
 * units tall to the tip of her hat. t animates the hair and the hem.
 */
export function witch(f: Frame, pose: Pose, t = 0, mouth: 'grin' | 'o' | 'flat' = 'grin') {
  const sway = sin(t * 2) * 2;
  // hat: a tall cone that has given up near the top, and a brim like a plate
  const hy = -212; // so that her boots are on y = 0
  f.L([[-16, hy - 2], [-8, hy - 40], [-2, hy - 62], [4, hy - 72], [22 + sway, hy - 86], [10, hy - 66], [12, hy - 40], [18, hy]], 1);
  f.L(arc(1, hy + 2, 62, 9, 0, Math.PI * 2, 30), 2, { close: true });
  // hair: long and stringy, out from under the brim
  for (let i = 0; i < 5; i++) {
    const side = i < 2 ? -1 : i < 4 ? 1 : -1;
    const x0 = side * (10 + i * 2);
    f.L(smooth([[x0, hy + 8], [x0 + side * 4, hy + 30], [x0 + side * (6 + sin(t * 3 + i) * 2), hy + 55], [x0 + side * (4 + i), hy + 72 + i * 4]]), 10 + i);
  }
  // face
  f.L(smooth([[-11, hy + 10], [-13, hy + 30], [-6, hy + 46], [6, hy + 48], [13, hy + 32], [12, hy + 10]], 6), 20);
  f.L([[-2, hy + 22], [8, hy + 30], [1, hy + 32]], 21); // the nose, long
  f.L([[-7, hy + 18], [-6, hy + 20]], 22, { w: 2.6 }); f.L([[7, hy + 17], [8, hy + 19]], 23, { w: 2.6 });
  if (mouth === 'grin') { f.L(quad([-8, hy + 36], [1, hy + 44], [9, hy + 35]), 24); f.L([[-6, hy + 37], [7, hy + 37]], 25); }
  else if (mouth === 'o') f.L(arc(1, hy + 38, 3.5, 4, 0, Math.PI * 2, 10), 24, { close: true });
  else f.L([[-5, hy + 38], [7, hy + 37]], 24);
  // neck and robe
  const sh = hy + 54;
  f.L([[-4, hy + 47], [-6, sh]], 30); f.L([[5, hy + 47], [7, sh]], 31);
  const hem = (i: number) => sin(t * 2.5 + i) * 3;
  f.L(smooth([[-18, sh + 4], [-26, sh + 60], [-36, sh + 110], [-44, sh + 146 + hem(1)]]), 32);
  f.L(smooth([[20, sh + 4], [28, sh + 60], [38, sh + 110], [46, sh + 146 + hem(2)]]), 33);
  f.L(smooth([[-44, sh + 146 + hem(1)], [-20, sh + 150 + hem(3)], [0, sh + 145 + hem(4)], [22, sh + 151 + hem(5)], [46, sh + 146 + hem(2)]]), 34);
  // pointy boots
  f.L([[-12, sh + 149], [-14, sh + 156], [-30, sh + 158], [-22, sh + 152]], 35); f.L([[12, sh + 149], [14, sh + 156], [32, sh + 158], [24, sh + 152]], 36);
  // arms: wide bell sleeves; angles per pose (0 = straight out, negative = up)
  const A: Record<Pose, [number, number]> = { 'arms-up': [-0.55, -0.55], wave: [0.9, -1.0 + sin(t * 8) * 0.25], shrug: [0.15, 0.15], point: [1.1, -0.12], hold: [0.55, 0.55], fly: [0.5, 0.2], stand: [1.25, 1.25], write: [1.1, 0.6] };
  const [al, ar] = A[pose];
  arm(f, -1, al, sh, t, 40);
  arm(f, 1, ar, sh, t, 60);
}

function arm(f: Frame, side: number, ang: number, sh: number, t: number, k: number) {
  // shoulder at (side*18, sh+4); arm runs out at angle ang below horizontal
  const sx = side * 18, sy = sh + 6;
  const L = 78;
  const dx = Math.cos(ang) * side, dy = Math.sin(ang);
  const ex = sx + dx * L, ey = sy + dy * L;
  // sleeve: top line, bottom line, the bell at the wrist
  const nx = -dy * side, ny = dx * side; // normal (down-ish)
  const w0 = 5, w1 = 18;
  f.L(smooth([[sx, sy - 2], [sx + dx * L * 0.5 - nx * 3, sy + dy * L * 0.5 - ny * 3], [ex - nx * w1 * 0.4, ey - ny * w1 * 0.4]]), k);
  f.L(smooth([[sx - nx * 0 + 0, sy + 14], [sx + dx * L * 0.55 + nx * (w0 + 6), sy + dy * L * 0.55 + ny * (w0 + 6)], [ex + nx * w1, ey + ny * w1]]), k + 1);
  f.L([[ex - nx * w1 * 0.4, ey - ny * w1 * 0.4], [ex + nx * w1 * 0.3 + dx * 3, ey + ny * w1 * 0.3 + dy * 3], [ex + nx * w1, ey + ny * w1]], k + 2);
  // hand: palm and four quick fingers, spread
  const hx = ex + dx * 8, hy = ey + dy * 8;
  f.L([[ex + dx * 1, ey + dy * 1], [hx, hy]], k + 3);
  for (let i = 0; i < 4; i++) {
    const a = Math.atan2(dy, dx) + (i - 1.5) * 0.38 + sin(t * 5 + i) * 0.05;
    f.L([[hx, hy], [hx + Math.cos(a) * 11, hy + Math.sin(a) * 11]], k + 4 + i);
  }
}

// --------------------------------------------------------------- Parsnip the cat
export function cat(f: Frame, t = 0, mood: 'sit' | 'cross' | 'loaf' = 'sit') {
  const tail = sin(t * 3) * 6;
  if (mood === 'loaf') {
    f.L(smooth([[-30, 0], [-32, -18], [-18, -28], [10, -28], [28, -20], [32, 0], [-30, 0]]), 1);
  } else {
    f.L(smooth([[-14, 0], [-20, -20], [-16, -42], [-10, -52]]), 1);
    f.L(smooth([[14, 0], [18, -22], [14, -42], [10, -52]]), 2);
    f.L([[-14, 0], [14, 0]], 3);
  }
  const hy = mood === 'loaf' ? -30 : -54;
  f.L(arc(0, hy - 12, 15, 13, 0, Math.PI * 2, 18), 4, { close: true });
  f.L([[-13, hy - 18], [-11, hy - 34], [-3, hy - 24]], 5); f.L([[13, hy - 18], [11, hy - 34], [3, hy - 24]], 6);
  if (mood === 'cross') { f.L([[-8, hy - 15], [-3, hy - 13]], 7); f.L([[8, hy - 15], [3, hy - 13]], 8); }
  else { f.L([[-6, hy - 14], [-5, hy - 12]], 7, { w: 3 }); f.L([[6, hy - 14], [5, hy - 12]], 8, { w: 3 }); }
  f.L([[-2, hy - 7], [0, hy - 5], [2, hy - 7]], 9);
  f.L([[-4, hy - 6], [-22, hy - 9]], 10); f.L([[-4, hy - 5], [-21, hy - 2]], 11); f.L([[4, hy - 6], [22, hy - 9]], 12); f.L([[4, hy - 5], [21, hy - 2]], 13);
  f.L(smooth([[16, -4], [34, -8], [40 + tail, -26], [32 + tail, -38]]), 14);
}

export function broom(f: Frame, t = 0) {
  f.L([[-90, 0], [70, 0]], 1, { w: 2.6 });
  f.L([[-90, 3], [70, 3]], 2);
  for (let i = 0; i < 8; i++) {
    const a = (i - 3.5) * 0.09;
    f.L([[-90, 2], [-140 + sin(t * 4 + i) * 2, 2 + Math.tan(a) * 50 + (i - 3.5) * 2.5]], 3 + i);
  }
  f.L([[-92, -8], [-88, 12]], 20); f.L([[-96, -9], [-92, 13]], 21);
}

/** Hazel on her broom with Parsnip on the back, facing right. */
export function flying(f: Frame, t: number, tilt = 0) {
  const b = f.sub(0, 0, 1, tilt, 1, 3);
  broom(b, t);
  const w = b.sub(8, 56, 0.62, 0, 1, 5);
  // riding side-saddle: the broom crosses her at the hip and the robe hangs below
  witch(w, 'fly', t);
  cat(b.sub(-62, -2, 0.55, 0, 1, 7), t, 'loaf');
}

// --------------------------------------------------------------- humans of 2026
export interface Human { kind?: 'a' | 'b' | 'c'; head?: 'down' | 'up' | 'side'; hold?: 'phone' | 'cup' | 'none' | 'leash'; dress?: boolean; scarf?: boolean }
/** A human, simply drawn: about 170 units tall, origin at the feet. */
export function human(f: Frame, h: Human, t = 0) {
  const down = h.head === 'down' ? 1 : 0;
  const hx = down ? 6 : 0, hy = -150 + down * 8;
  f.L(arc(hx, hy, 13, 15, 0, Math.PI * 2, 18), 1, { close: true });
  if (h.kind === 'b') f.L(smooth([[hx - 13, hy - 2], [hx - 6, hy - 16], [hx + 8, hy - 16], [hx + 14, hy - 4]]), 2); // a fringe
  if (h.kind === 'c') { f.L(arc(hx, hy - 12, 14, 6, Math.PI, Math.PI * 2, 10), 2); f.L([[hx + 13, hy - 12], [hx + 26, hy - 10]], 3); } // a cap
  if (down) { f.L([[hx + 2, hy + 4], [hx + 9, hy + 5]], 4); } else { f.L([[hx - 4, hy - 2], [hx - 3, hy]], 4, { w: 2.6 }); f.L([[hx + 5, hy - 2], [hx + 6, hy]], 5, { w: 2.6 }); f.L([[hx - 3, hy + 7], [hx + 5, hy + 7]], 6); }
  const nt = hy + 15;
  if (h.dress) {
    f.L(smooth([[-12, nt + 6], [-18, nt + 50], [-30, nt + 100]]), 7); f.L(smooth([[12, nt + 6], [18, nt + 50], [30, nt + 100]]), 8);
    f.L([[-30, nt + 100], [30, nt + 100]], 9);
    f.L([[-8, nt + 100], [-8, 0]], 10); f.L([[8, nt + 100], [9, 0]], 11);
  } else {
    f.L(smooth([[-14, nt + 6], [-16, nt + 40], [-14, nt + 72]]), 7); f.L(smooth([[14, nt + 6], [16, nt + 40], [14, nt + 72]]), 8);
    f.L([[-14, nt + 72], [14, nt + 72]], 9);
    const step = sin(t * 6) * 4;
    f.L([[-8, nt + 72], [-10 - step, 0]], 10); f.L([[8, nt + 72], [10 + step, 0]], 11);
  }
  if (h.scarf) f.L(smooth([[-12, nt + 4], [0, nt + 10], [12, nt + 4], [6, nt + 30]]), 12);
  // arms and what they hold
  if (h.hold === 'phone') {
    f.L(smooth([[-14, nt + 10], [-10, nt + 40], [4, nt + 40]]), 13); f.L(smooth([[14, nt + 10], [16, nt + 36], [8, nt + 40]]), 14);
    f.L([[0, nt + 30], [14, nt + 30], [14, nt + 46], [0, nt + 46], [0, nt + 30]], 15, { close: true });
  } else if (h.hold === 'cup') {
    f.L(smooth([[-14, nt + 10], [-18, nt + 50], [-16, nt + 70]]), 13); f.L(smooth([[14, nt + 10], [22, nt + 36], [24, nt + 24]]), 14);
    f.L([[18, nt + 8], [30, nt + 8], [28, nt + 26], [20, nt + 26], [18, nt + 8]], 15, { close: true });
  } else {
    f.L(smooth([[-14, nt + 10], [-18, nt + 50], [-16, nt + 72]]), 13); f.L(smooth([[14, nt + 10], [18, nt + 50], [16, nt + 72]]), 14);
  }
}

export function bubble(f: Frame, w: number, h: number, tailX = 0.3, k = 90) {
  const r = 12;
  const pts: P[] = [[r, 0], [w - r, 0], [w, r], [w, h - r], [w - r, h], [w * tailX + 18, h], [w * tailX - 4, h + 24], [w * tailX + 2, h], [r, h], [0, h - r], [0, r], [r, 0]];
  f.L(smooth(pts, 3), k, { close: true, fill: '#fffefb' });
}

// --------------------------------------------------------------- things
export function phone(f: Frame, glow = 0, t = 0) {
  f.L([[-14, -26], [14, -26], [14, 26], [-14, 26], [-14, -26]], 1, { close: true, fill: '#fffefb' });
  f.L([[-4, -22], [4, -22]], 2);
  if (glow) for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + t; f.L([[Math.cos(a) * 34, Math.sin(a) * 40], [Math.cos(a) * (44 + glow * 8), Math.sin(a) * (52 + glow * 8)]], 10 + i); }
}
export function checkout(f: Frame, t = 0, beep = 0) {
  f.L([[-60, 0], [-60, -90], [40, -90], [40, 0]], 1);
  f.L([[-60, -90], [-80, -96], [60, -96], [40, -90]], 2);
  f.L([[20, -96], [20, -150], [70, -160], [70, -110], [20, -100]], 3);
  if (beep) { f.L([[-30, -100], [-10, -100]], 4, { w: 3 }); f.L([[-50, -110], [-60, -125]], 5); f.L([[-20, -112], [-20, -130]], 6); f.L([[10, -110], [18, -126]], 7); }
  f.L([[-140, -96], [-80, -96], [-80, -40], [-140, -40]], 8); // bagging area
  void t;
}
export function speaker(f: Frame, talk = 0, t = 0) {
  f.L([[-16, 0], [-16, -50]], 1); f.L([[16, 0], [16, -50]], 2);
  f.L(arc(0, -50, 16, 5, 0, Math.PI * 2, 14), 3, { close: true }); f.L(arc(0, 0, 16, 5, 0, Math.PI, 10), 4);
  f.L(arc(0, -50, 10, 3, 0, Math.PI * 2, 12), 5, { close: true });
  for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) f.L([[-10 + j * 6, -36 + i * 9], [-9 + j * 6, -35 + i * 9]], 10 + i * 4 + j, { w: 2.4 });
  if (talk) for (let i = 0; i < 3; i++) f.L(arc(0, -50, 26 + i * 10 + sin(t * 6) * 2, 12 + i * 5, -Math.PI * 0.85, -Math.PI * 0.15, 10), 30 + i);
}
export function laptop(f: Frame) {
  f.L([[-60, 0], [60, 0], [70, 8], [-70, 8], [-60, 0]], 1, { close: true });
  f.L([[-55, 0], [-58, -80], [58, -80], [55, 0]], 2);
  for (let i = 0; i < 5; i++) f.L([[-44, -66 + i * 12], [-44 + 30 + ((i * 37) % 50), -66 + i * 12]], 3 + i);
}
export function cup(f: Frame, t = 0, cream = true) {
  f.L([[-24, -70], [24, -70], [18, 0], [-18, 0], [-24, -70]], 1, { close: true, fill: '#fffefb' });
  f.L([[-26, -70], [-24, -80], [24, -80], [26, -70]], 2);
  f.L([[-22, -40], [22, -40]], 3); f.L([[-20, -26], [20, -26]], 4);
  if (cream) f.L(smooth([[-22, -80], [-16, -96], [-6, -90], [0, -108], [8, -94], [16, -100], [22, -82]]), 5);
  for (let i = 0; i < 3; i++) f.L(smooth([[-10 + i * 10, -112], [-14 + i * 10 + sin(t * 2 + i) * 4, -128], [-8 + i * 10, -146], [-12 + i * 10 + sin(t * 2 + i) * 5, -160]]), 6 + i);
}
export function leaf(f: Frame, k: number) {
  f.L(smooth([[0, 0], [10, -8], [20, -4], [28, 0], [20, 5], [10, 8], [0, 0]]), k, { close: true });
  f.L([[0, 0], [24, 0]], k + 1);
}
export function scooter(f: Frame, t = 0) {
  f.L(arc(-40, -12, 12, 12, 0, Math.PI * 2, 14), 1, { close: true }); f.L(arc(40, -12, 12, 12, 0, Math.PI * 2, 14), 2, { close: true });
  f.L([[-40, -16], [36, -16]], 3); f.L([[36, -16], [26, -100]], 4); f.L([[14, -100], [38, -102]], 5);
  for (let i = 0; i < 3; i++) f.L([[-60 - i * 14, -40 - i * 8], [-80 - i * 14 - sin(t * 9 + i) * 4, -40 - i * 8]], 10 + i); // speed lines
}
export function drone(f: Frame, t = 0) {
  f.L([[-30, 0], [30, 0], [30, 14], [-30, 14], [-30, 0]], 1, { close: true });
  f.L([[-30, 0], [-50, -10]], 2); f.L([[30, 0], [50, -10]], 3);
  for (const s of [-1, 1]) { const w = 18 * Math.abs(sin(t * 30 + s)); f.L([[s * 50 - w, -12], [s * 50 + w, -8]], 4 + s); }
  f.L([[0, 14], [0, 40]], 7); f.L([[-20, 40], [20, 40], [20, 74], [-20, 74], [-20, 40]], 8, { close: true }); f.L([[-20, 52], [20, 52]], 9);
}
export function owl(f: Frame, t = 0, flying = false) {
  f.L(smooth([[-20, 0], [-26, -30], [-16, -54], [0, -58], [16, -54], [26, -30], [20, 0], [-20, 0]]), 1, { close: true });
  f.L(arc(-8, -38, 7, 7, 0, Math.PI * 2, 12), 2, { close: true }); f.L(arc(8, -38, 7, 7, 0, Math.PI * 2, 12), 3, { close: true });
  f.L([[-8, -38], [-7, -37]], 4, { w: 3 }); f.L([[8, -38], [9, -37]], 5, { w: 3 }); f.L([[-3, -30], [0, -24], [3, -30]], 6);
  f.L([[-16, -56], [-20, -66], [-10, -58]], 7); f.L([[16, -56], [20, -66], [10, -58]], 8);
  if (flying) { const w = sin(t * 10) * 18; for (const s of [-1, 1]) f.L(smooth([[s * 22, -32], [s * 48, -42 - w], [s * 64, -30 - w * 1.4]]), 9 + s); }
  else { f.L([[-8, 0], [-10, 6]], 11); f.L([[8, 0], [10, 6]], 12); }
}
export function plant(f: Frame, t = 0) {
  f.L([[-26, 0], [-32, -40], [32, -40], [26, 0], [-26, 0]], 1, { close: true });
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI / 2 + (i - 2.5) * 0.42, L = 80 + (i % 2) * 30, sw = sin(t * 1.5 + i) * 0.04;
    const ex = Math.cos(a + sw) * L, ey = -40 + Math.sin(a + sw) * L;
    f.L(quad([0, -40], [ex * 0.3, -40 + (ey + 40) * 0.6], [ex, ey]), 10 + i);
    // monstera leaf with its notches
    const lf = f.sub(ex, ey, 0.9, a + sw + Math.PI / 2, 1, 20 + i);
    lf.L(smooth([[0, 0], [-22, -10], [-26, -34], [-8, -46], [0, -44], [8, -46], [26, -34], [22, -10], [0, 0]]), 1, { close: true });
    lf.L([[-14, -14], [-20, -20]], 2); lf.L([[14, -14], [20, -20]], 3); lf.L([[0, 0], [0, -40]], 4);
  }
}
export function candle(f: Frame, t = 0) {
  f.L([[-8, 0], [-8, -40], [8, -40], [8, 0]], 1);
  f.L(smooth([[0, -42], [-5 + sin(t * 9) * 1.5, -52], [0, -64], [5, -52], [0, -42]]), 2, { close: true });
}
export function stone(f: Frame, k = 1) { f.L(smooth([[-14, 0], [-12, -12], [0, -20], [12, -10], [14, 0], [-14, 0]]), k, { close: true }); }
export function house(f: Frame, w: number, h: number, k = 1) {
  f.L([[-w / 2, 0], [-w / 2, -h], [w / 2, -h], [w / 2, 0]], k);
  for (let i = 0; i < Math.floor(h / 40); i++) for (let j = 0; j < Math.floor(w / 36); j++) f.L([[-w / 2 + 12 + j * 36, -h + 14 + i * 40], [-w / 2 + 26 + j * 36, -h + 14 + i * 40], [-w / 2 + 26 + j * 36, -h + 30 + i * 40], [-w / 2 + 12 + j * 36, -h + 30 + i * 40]], k * 50 + i * 9 + j, { close: true });
}
export function cloud(f: Frame, k = 1) {
  f.L(smooth([[0, 0], [10, -14], [30, -18], [44, -30], [70, -26], [86, -12], [104, -10], [110, 0], [0, 0]]), k, { close: true });
}
export function bird(f: Frame, t: number, k = 1) { const w = sin(t * 7 + k) * 4; f.L([[-10, -w], [0, 2], [10, -w]], k); }
export function star(f: Frame, k = 1, r = 8) {
  const pts: P[] = [];
  for (let i = 0; i <= 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r; pts.push([Math.cos(a) * rr, Math.sin(a) * rr]); }
  f.L(pts, k, { close: true });
}
export function moon(f: Frame) { f.L(arc(0, 0, 40, 40, -Math.PI * 0.6, Math.PI * 0.6, 20).concat(arc(-16, 0, 30, 34, Math.PI * 0.45, -Math.PI * 0.45, 16)), 1, { close: true }); }
export function portal(f: Frame, t: number) {
  for (let r = 0; r < 4; r++) {
    const pts: P[] = [];
    for (let i = 0; i <= 40; i++) { const a = (i / 40) * Math.PI * 2 * 1.2 + t * (1 + r * 0.3); const rr = 20 + r * 16 + i * 0.6; pts.push([Math.cos(a) * rr, Math.sin(a) * rr * 1.4]); }
    f.L(pts, r + 1);
  }
}
export function stamp(f: Frame, kind: string, k = 1, t = 0) {
  // a postage stamp with perforations and a tiny drawing
  const pts: P[] = [];
  for (let i = 0; i <= 12; i++) pts.push([-30 + i * 5, -36 + (i % 2) * 2]);
  for (let i = 0; i <= 14; i++) pts.push([30 + (i % 2) * 2, -36 + i * 5.2]);
  for (let i = 0; i <= 12; i++) pts.push([30 - i * 5, 36 + (i % 2) * 2]);
  for (let i = 0; i <= 14; i++) pts.push([-30 - (i % 2) * 2, 36 - i * 5.2]);
  f.L(pts, k, { close: true, fill: '#fffefb' });
  const g = f.sub(0, 8, 0.5, 0, 1, k + 7);
  const S: Record<string, () => void> = {
    phone: () => phone(g.sub(0, -20, 1)), checkout: () => checkout(g.sub(10, 20, 0.35)), speaker: () => speaker(g.sub(0, 20, 0.9)), ai: () => laptop(g.sub(0, 10, 0.5)),
    spa: () => candle(g.sub(0, 20, 1.1), t), coffee: () => cup(g.sub(0, 30, 0.6), t), scooter: () => scooter(g.sub(0, 20, 0.6)), fashion: () => human(g.sub(0, 40, 0.38), { dress: true }),
    drone: () => drone(g.sub(0, -20, 0.6), t), plant: () => plant(g.sub(0, 30, 0.38), t),
  };
  S[kind]?.();
}
export { bez };
