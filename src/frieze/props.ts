import { box, crayon, doodle, loop, pen, ring, rng, scrawl, shadowOf, type Pt } from './doodle';
import { INK, LINE } from './paper';

/**
 * The things the story is made of.
 *
 * A crayon box and a cast. Everything is deliberately the drawing a person does
 * when they are telling you something rather than showing off — a house is a
 * box with a roof on it, a monkey is a person with a tail, the sea is a row of
 * bumps. The story is doing the work; the drawing only has to be unmistakable
 * and quick.
 */

export const C = {
  skin: '#e6b189',
  blue: '#7ea9d6',
  deep: '#4a6fa5',
  green: '#8bbb6b',
  leaf: '#5e9455',
  red: '#d5685a',
  rust: '#b4543f',
  yellow: '#edc75a',
  gold: '#e0a93b',
  brown: '#b98456',
  bark: '#8a6141',
  purple: '#a68ac2',
  teal: '#6fbfae',
  kraft: '#dcb68d',
  stone: '#bcb4a5',
  night: '#3b4a6b',
  white: '#f6f3e9',
  pink: '#e6a8a0',
};

export interface Figure {
  x: number;
  y: number;
  /** Height from the ground to the top of the head. */
  h?: number;
  robe?: string;
  skin?: string;
  hair?: string;
  /** A crown, a topknot, a helm, a veil, a monkey's ears. */
  hat?: 'none' | 'crown' | 'knot' | 'helm' | 'veil' | 'monkey' | 'sage';
  face?: 1 | -1;
  /** What they are holding. */
  holds?: 'none' | 'bow' | 'staff' | 'lamp' | 'club';
  /** Arms out, for reaching, fighting, being amazed. */
  arms?: 'down' | 'out' | 'up' | 'one';
  /** Ten heads, for the one character who has them. */
  heads?: number;
  seed?: number;
  /** A tail, for the ones with tails. */
  tail?: boolean;
  /** Sitting, for the ones who are waiting. */
  sit?: boolean;
}

/**
 * A person.
 *
 * Head, robe, two arms, two legs — and one identifying thing on top, which at
 * this size is the whole of characterisation. The face is two dots and a line,
 * and that is on purpose: a doodle that tries for an expression stops being a
 * doodle.
 */
export function figure(g: CanvasRenderingContext2D, f: Figure) {
  const h = f.h ?? LINE * 3.4;
  const seed = f.seed ?? Math.round(f.x * 7 + f.y);
  const dir = f.face ?? 1;
  const skin = f.skin ?? C.skin;
  const robe = f.robe ?? C.blue;
  const hair = f.hair ?? '#3b3128';
  const headR = h * 0.17;
  const sit = f.sit ?? false;
  const footY = f.y;
  const hipY = footY - h * (sit ? 0.16 : 0.42);
  const shoulderY = hipY - h * 0.26;
  const headY = shoulderY - headR * 1.25;
  const halfW = h * 0.13;

  // ── robe: a bell from the shoulders to the ground
  const body: Pt[] = [
    [f.x - halfW, shoulderY],
    [f.x + halfW, shoulderY],
    [f.x + halfW * (sit ? 1.9 : 1.55), hipY + h * (sit ? 0.14 : 0.3)],
    [f.x - halfW * (sit ? 1.9 : 1.55), hipY + h * (sit ? 0.14 : 0.3)],
  ];
  doodle(g, loop(body, 6), seed, robe, { w: h * 0.038, slop: h * 0.022 });

  // ── legs, if the robe is short enough to have any showing
  if (!sit) {
    for (const s of [-1, 1]) {
      const lx = f.x + s * halfW * 0.6;
      pen(g, [[lx, hipY + h * 0.3], [lx + s * h * 0.02, footY]], seed + s + 3, { w: h * 0.034, passes: 1 });
      pen(g, [[lx + s * h * 0.02, footY], [lx + s * h * 0.02 + dir * h * 0.05, footY]], seed + s + 7,
        { w: h * 0.038, passes: 1, overshoot: 0 });
    }
  }

  // ── arms
  const armY = shoulderY + h * 0.04;
  const arms = f.arms ?? 'down';
  for (const s of [-1, 1]) {
    const from: Pt = [f.x + s * halfW * 0.9, armY];
    let to: Pt;
    if (arms === 'up') to = [f.x + s * halfW * 2.0, armY - h * 0.24];
    else if (arms === 'out') to = [f.x + s * halfW * 2.4, armY + h * 0.02];
    else if (arms === 'one' && s === dir) to = [f.x + s * halfW * 2.3, armY - h * 0.18];
    else to = [f.x + s * halfW * 1.5, armY + h * 0.22];
    pen(g, [from, [(from[0] + to[0]) / 2 + s * h * 0.03, (from[1] + to[1]) / 2], to], seed + s * 11, {
      w: h * 0.032, passes: 1,
    });
  }

  // ── head, or heads
  const heads = Math.max(1, f.heads ?? 1);
  for (let i = 0; i < heads; i++) {
    const spread = heads === 1 ? 0 : (i - (heads - 1) / 2);
    const hx = f.x + spread * headR * 0.92;
    const hy = headY - (heads === 1 ? 0 : Math.abs(spread) * -headR * 0.16) - (heads > 1 ? headR * 0.3 : 0);
    const rr = heads === 1 ? headR : headR * 0.62;
    doodle(g, loop(ring(hx, hy, rr, 11, 1.06, seed + i), 6), seed + 31 + i, skin,
      { w: h * 0.034, slop: rr * 0.16, shadow: i === 0 });
    // Hair as a cap over the top, unless something else is going up there.
    if (f.hat !== 'helm' && f.hat !== 'veil') {
      g.save();
      g.beginPath();
      g.arc(hx, hy, rr * 1.04, Math.PI * 1.05, Math.PI * 1.95);
      g.lineTo(hx + rr * 0.9, hy - rr * 0.1);
      g.closePath();
      g.fillStyle = hair;
      g.fill();
      g.restore();
    }
    // Two dots and a line.
    const ex = rr * 0.34;
    g.save();
    g.fillStyle = INK;
    for (const s of [-1, 1]) {
      g.beginPath();
      g.arc(hx + s * ex + dir * rr * 0.06, hy + rr * 0.06, Math.max(1.1, rr * 0.11), 0, Math.PI * 2);
      g.fill();
    }
    g.restore();
    pen(g, [[hx - rr * 0.24, hy + rr * 0.44], [hx, hy + rr * 0.52], [hx + rr * 0.24, hy + rr * 0.44]],
      seed + 41 + i, { w: Math.max(1.3, h * 0.016), passes: 1, overshoot: 0 });
  }

  // ── the one thing on top
  const hx = f.x;
  const hy = headY;
  const hat = f.hat ?? 'none';
  if (hat === 'crown') {
    const c: Pt[] = [
      [hx - headR * 0.95, hy - headR * 0.72], [hx + headR * 0.95, hy - headR * 0.72],
      [hx + headR * 0.6, hy - headR * 1.75], [hx + headR * 0.22, hy - headR * 1.15],
      [hx - headR * 0.22, hy - headR * 1.75], [hx - headR * 0.6, hy - headR * 1.15],
    ];
    doodle(g, c, seed + 51, C.gold, { w: h * 0.03, slop: 2, shadow: false });
  } else if (hat === 'knot') {
    doodle(g, loop(ring(hx, hy - headR * 1.15, headR * 0.42, 9, 1, seed), 6), seed + 53, hair,
      { w: h * 0.028, slop: 2, shadow: false });
  } else if (hat === 'helm') {
    g.save();
    g.beginPath();
    g.arc(hx, hy - headR * 0.05, headR * 1.12, Math.PI, 0);
    g.closePath();
    g.fillStyle = C.stone;
    g.fill();
    g.restore();
    pen(g, [[hx - headR * 1.12, hy - headR * 0.05], [hx, hy - headR * 1.2], [hx + headR * 1.12, hy - headR * 0.05]],
      seed + 55, { w: h * 0.03, passes: 1, overshoot: 0 });
  } else if (hat === 'veil') {
    const v: Pt[] = [
      [hx - headR * 1.25, hy + headR * 0.2], [hx - headR * 0.8, hy - headR * 1.25],
      [hx + headR * 0.8, hy - headR * 1.25], [hx + headR * 1.25, hy + headR * 0.2],
      [hx + headR * 1.35, hy + headR * 1.9], [hx - headR * 1.35, hy + headR * 1.9],
    ];
    g.save();
    g.globalAlpha = 0.85;
    crayon(g, loop(v, 5), seed + 57, { colour: robe, slop: 3 });
    g.restore();
    pen(g, loop(v, 5), seed + 59, { w: h * 0.026, passes: 1, close: true, overshoot: 0 });
  } else if (hat === 'monkey') {
    for (const s of [-1, 1]) {
      doodle(g, loop(ring(hx + s * headR * 1.05, hy - headR * 0.12, headR * 0.42, 8, 1, seed + s), 6),
        seed + 61 + s, skin, { w: h * 0.026, slop: 1.5, shadow: false });
    }
  } else if (hat === 'sage') {
    // A beard, which is the whole of a sage.
    const b: Pt[] = [
      [hx - headR * 0.7, hy + headR * 0.5], [hx + headR * 0.7, hy + headR * 0.5],
      [hx + headR * 0.5, hy + headR * 1.8], [hx, hy + headR * 2.2], [hx - headR * 0.5, hy + headR * 1.8],
    ];
    doodle(g, loop(b, 5), seed + 63, C.white, { w: h * 0.026, slop: 2, shadow: false });
  }

  if (f.tail) {
    pen(g, [
      [f.x - halfW * 1.5 * dir, hipY + h * 0.2],
      [f.x - halfW * 3.0 * dir, hipY + h * 0.02],
      [f.x - halfW * 3.4 * dir, hipY - h * 0.22],
      [f.x - halfW * 2.4 * dir, hipY - h * 0.3],
    ], seed + 71, { w: h * 0.03, passes: 1 });
  }

  // ── what they are holding
  const holds = f.holds ?? 'none';
  const hxh = f.x + dir * halfW * 2.2;
  if (holds === 'bow') {
    const b: Pt[] = [
      [hxh, armY - h * 0.28], [hxh + dir * h * 0.1, armY - h * 0.1],
      [hxh + dir * h * 0.11, armY + h * 0.08], [hxh, armY + h * 0.26],
    ];
    pen(g, b, seed + 81, { w: h * 0.03, passes: 2 });
    pen(g, [[hxh, armY - h * 0.28], [hxh, armY + h * 0.26]], seed + 83, { w: h * 0.014, passes: 1, overshoot: 0 });
  } else if (holds === 'staff') {
    pen(g, [[hxh, armY - h * 0.5], [hxh, footY]], seed + 85, { w: h * 0.026, passes: 1 });
  } else if (holds === 'club') {
    pen(g, [[hxh, armY], [hxh + dir * h * 0.14, armY - h * 0.34]], seed + 87, { w: h * 0.034, passes: 1 });
    doodle(g, loop(ring(hxh + dir * h * 0.16, armY - h * 0.4, h * 0.075, 9, 1, seed), 6), seed + 89, C.bark,
      { w: h * 0.026, slop: 2, shadow: false });
  } else if (holds === 'lamp') {
    flame(g, hxh, armY - h * 0.04, h * 0.12, seed + 91);
  }
}

/** A little flame. Used more than anything else in this story. */
export function flame(g: CanvasRenderingContext2D, x: number, y: number, r: number, seed: number) {
  const bowl: Pt[] = [[x - r, y], [x + r, y], [x + r * 0.72, y + r * 0.7], [x - r * 0.72, y + r * 0.7]];
  doodle(g, loop(bowl, 5), seed, C.rust, { w: r * 0.26, slop: r * 0.1 });
  const f: Pt[] = [
    [x, y - r * 1.9], [x + r * 0.55, y - r * 0.55], [x + r * 0.3, y - r * 0.05],
    [x - r * 0.3, y - r * 0.05], [x - r * 0.55, y - r * 0.55],
  ];
  doodle(g, loop(f, 6), seed + 3, C.yellow, { w: r * 0.2, slop: r * 0.08, shadow: false });
  doodle(g, loop([
    [x, y - r * 1.1], [x + r * 0.22, y - r * 0.4], [x - r * 0.22, y - r * 0.4],
  ], 5), seed + 5, C.rust, { w: r * 0.13, slop: 1, shadow: false });
}

/** A tree: a trunk and a lumpy head of leaves. */
export function tree(g: CanvasRenderingContext2D, x: number, y: number, h: number, seed: number, colour = C.green) {
  const w = h * 0.1;
  doodle(g, box(x - w / 2, y - h * 0.55, w, h * 0.55), seed, C.bark, { w: h * 0.022, slop: 2 });
  const r = h * 0.3;
  for (const [ox, oy, k] of [[-r * 0.6, 0, 0.8], [r * 0.6, -r * 0.1, 0.78], [0, -r * 0.55, 1]] as const) {
    doodle(g, loop(ring(x + ox, y - h * 0.62 + oy, r * k, 11, 0.92, seed + ox), 7), seed + 11 + ox, colour,
      { w: h * 0.022, slop: h * 0.012, shadow: ox === 0 });
  }
}

/** A palm, for the shore and the south. */
export function palm(g: CanvasRenderingContext2D, x: number, y: number, h: number, seed: number) {
  pen(g, [[x, y], [x - h * 0.06, y - h * 0.5], [x + h * 0.04, y - h * 0.9]], seed, { w: h * 0.038, passes: 2 });
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI * 0.9 + (i / 5) * Math.PI * 0.8;
    const tipX = x + h * 0.04 + Math.cos(a) * h * 0.42;
    const tipY = y - h * 0.9 + Math.sin(a) * h * 0.3;
    const leaf: Pt[] = [
      [x + h * 0.04, y - h * 0.9],
      [(x + tipX) / 2, (y - h * 0.9 + tipY) / 2 - h * 0.09],
      [tipX, tipY],
      [(x + tipX) / 2, (y - h * 0.9 + tipY) / 2 + h * 0.02],
    ];
    doodle(g, loop(leaf, 6), seed + i * 7, C.leaf, { w: h * 0.02, slop: 2, shadow: false });
  }
}

/** A hut: the forest years happen in and around one of these. */
export function hut(g: CanvasRenderingContext2D, x: number, y: number, w: number, seed: number) {
  const h = w * 0.62;
  doodle(g, box(x, y - h, w, h), seed, C.kraft, { w: w * 0.016, slop: 3 });
  doodle(g, [[x - w * 0.12, y - h], [x + w / 2, y - h * 1.62], [x + w * 1.12, y - h]], seed + 3, C.bark,
    { w: w * 0.018, slop: 3 });
  doodle(g, box(x + w * 0.36, y - h * 0.58, w * 0.28, h * 0.58), seed + 5, '#6b563f', { w: w * 0.014, slop: 2 });
}

/** A palace: boxes, domes and a great many little windows. */
export function palace(g: CanvasRenderingContext2D, x: number, y: number, w: number, seed: number, colour = C.pink) {
  const h = w * 0.72;
  doodle(g, box(x, y - h, w, h), seed, colour, { w: w * 0.011, slop: 3 });
  for (let i = 0; i < 3; i++) {
    const tx = x + w * (0.08 + i * 0.36);
    const tw = w * 0.2;
    const th = h * (0.5 + (i % 2) * 0.22);
    doodle(g, box(tx, y - h - th, tw, th), seed + i * 5, colour, { w: w * 0.011, slop: 3 });
    doodle(g, loop([
      [tx - tw * 0.1, y - h - th], [tx + tw / 2, y - h - th - tw * 0.62], [tx + tw * 1.1, y - h - th],
    ], 6), seed + i * 7 + 2, C.gold, { w: w * 0.012, slop: 2, shadow: false });
    pen(g, [[tx + tw / 2, y - h - th - tw * 0.62], [tx + tw / 2, y - h - th - tw * 0.86]], seed + i, { w: w * 0.008, passes: 1 });
  }
  const r = rng(seed + 99);
  for (let i = 0; i < 12; i++) {
    const wx = x + w * (0.06 + (i % 6) * 0.16);
    const wy = y - h * (0.28 + Math.floor(i / 6) * 0.34);
    doodle(g, box(wx, wy, w * 0.07, h * 0.16), seed + 200 + i, r() > 0.5 ? C.gold : '#7a6a52',
      { w: w * 0.007, slop: 1.4, shadow: false });
  }
}

/** Water: a band of bumps, which is how everybody draws the sea. */
export function water(
  g: CanvasRenderingContext2D, x0: number, x1: number, y: number, depth: number, seed: number,
) {
  const top: Pt[] = [];
  const step = LINE * 1.5;
  for (let x = x0; x <= x1; x += step) {
    top.push([x, y + Math.sin((x / step) * 1.7 + seed) * LINE * 0.16]);
  }
  const shape: Pt[] = [...top, [x1, y + depth], [x0, y + depth]];
  crayon(g, shape, seed, { colour: C.blue, slop: 4, alpha: 0.8 });
  pen(g, top, seed + 3, { w: 3, passes: 1, overshoot: 0 });
  // A few strokes below the surface, which is all a doodle sea needs.
  const r = rng(seed + 7);
  for (let i = 0; i < Math.round((x1 - x0) / (LINE * 2.2)); i++) {
    const wx = x0 + r() * (x1 - x0);
    const wy = y + LINE * 0.6 + r() * (depth - LINE);
    pen(g, [[wx, wy], [wx + LINE * 0.5, wy - LINE * 0.14], [wx + LINE, wy]], seed + 300 + i,
      { w: 2.2, passes: 1, colour: 'rgba(60,110,165,0.6)', overshoot: 0 });
  }
}

/** A hill or a mountain, depending on how tall you make it. */
export function hill(
  g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, seed: number, colour = C.stone,
) {
  const s: Pt[] = [
    [x, y], [x + w * 0.18, y - h * 0.62], [x + w * 0.42, y - h],
    [x + w * 0.66, y - h * 0.7], [x + w, y],
  ];
  doodle(g, s, seed, colour, { w: w * 0.012, slop: 4 });
}

/** A paper card pinned into the scene, with something written on it. */
export function card(
  g: CanvasRenderingContext2D,
  x: number, y: number, w: number, lines: string[], seed: number,
  tone = '#f0e6cf', title?: string,
) {
  const lineH = LINE * 0.86;
  const h = lineH * (lines.length + (title ? 1.5 : 0)) + LINE * 0.9;
  const tilt = ((rng(seed)() - 0.5) * 0.045);
  g.save();
  g.translate(x + w / 2, y + h / 2);
  g.rotate(tilt);
  g.translate(-(x + w / 2), -(y + h / 2));
  const shape = box(x, y, w, h);
  shadowOf(g, shape, 6, 10, 10);
  crayon(g, shape, seed, { colour: tone, slop: 2, alpha: 1, grain: false });
  pen(g, shape, seed + 3, { w: 2.2, close: true, overshoot: 0, passes: 1, colour: 'rgba(60,52,40,0.55)' });
  let ty = y + LINE * 0.95;
  if (title) {
    scrawl(g, title, x + LINE * 0.5, ty, LINE * 0.72, seed + 11, '#9a4b3c');
    ty += lineH * 1.4;
  }
  for (const [i, l] of lines.entries()) {
    scrawl(g, l, x + LINE * 0.5, ty + i * lineH, LINE * 0.56, seed + 20 + i, '#3b352d');
  }
  g.restore();
}

/** A dashed track, for a journey across the page. */
export function track(g: CanvasRenderingContext2D, pts: Pt[], seed: number) {
  g.save();
  g.setLineDash([LINE * 0.4, LINE * 0.42]);
  pen(g, pts, seed, { w: 2.8, passes: 1, colour: 'rgba(70,62,50,0.5)', overshoot: 0 });
  g.restore();
}

/** An arrow in flight, with its fletching. */
export function arrow(g: CanvasRenderingContext2D, x: number, y: number, len: number, ang: number, seed: number) {
  const dx = Math.cos(ang) * len;
  const dy = Math.sin(ang) * len;
  pen(g, [[x, y], [x + dx, y + dy]], seed, { w: len * 0.05, passes: 1, overshoot: 0 });
  pen(g, [
    [x + dx - Math.cos(ang - 0.4) * len * 0.22, y + dy - Math.sin(ang - 0.4) * len * 0.22],
    [x + dx, y + dy],
    [x + dx - Math.cos(ang + 0.4) * len * 0.22, y + dy - Math.sin(ang + 0.4) * len * 0.22],
  ], seed + 3, { w: len * 0.045, passes: 1, overshoot: 0 });
  for (const s of [-1, 1]) {
    pen(g, [
      [x, y],
      [x - Math.cos(ang - s * 0.5) * len * 0.2, y - Math.sin(ang - s * 0.5) * len * 0.2],
    ], seed + 5 + s, { w: len * 0.04, passes: 1, overshoot: 0 });
  }
}

/** The sun, with a face, because the reference's sun has a face. */
export function sun(g: CanvasRenderingContext2D, x: number, y: number, r: number, seed: number) {
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const p: Pt[] = [
      [x + Math.cos(a - 0.11) * r, y + Math.sin(a - 0.11) * r],
      [x + Math.cos(a) * r * 1.42, y + Math.sin(a) * r * 1.42],
      [x + Math.cos(a + 0.11) * r, y + Math.sin(a + 0.11) * r],
    ];
    doodle(g, loop(p, 4), seed + i, C.yellow, { w: r * 0.06, slop: 2, shadow: false });
  }
  doodle(g, loop(ring(x, y, r, 14, 1, seed), 8), seed + 21, '#efd97e', { w: r * 0.07, slop: r * 0.05 });
  g.save();
  g.fillStyle = INK;
  for (const s of [-1, 1]) {
    g.beginPath();
    g.ellipse(x + s * r * 0.34, y - r * 0.1, r * 0.1, r * 0.15, 0, 0, Math.PI * 2);
    g.fill();
  }
  g.restore();
  pen(g, [[x - r * 0.3, y + r * 0.34], [x, y + r * 0.44], [x + r * 0.3, y + r * 0.34]], seed + 23,
    { w: r * 0.06, passes: 1, overshoot: 0 });
}

/** The moon, for the nights. */
export function moon(g: CanvasRenderingContext2D, x: number, y: number, r: number, seed: number) {
  doodle(g, loop(ring(x, y, r, 14, 1, seed), 8), seed, '#f0e6bf', { w: r * 0.07, slop: r * 0.05 });
  const rn = rng(seed + 5);
  for (let i = 0; i < 4; i++) {
    doodle(g, loop(ring(x + (rn() - 0.5) * r, y + (rn() - 0.5) * r, r * (0.1 + rn() * 0.12), 8, 1, seed + i), 6),
      seed + 30 + i, '#ddd0a8', { w: r * 0.04, slop: 1, shadow: false });
  }
}

/**
 * The band of page between the caption and the ground.
 *
 * Left empty it is the thing that gives the whole film away as a diagram: ruled
 * paper with a strip of drawing along the bottom. The reference page is busy —
 * a sun with a face, birds, a cloud, things doodled in the margin — so every
 * scene gets a sky, seeded from where it is so it never moves.
 */
export function sky(
  g: CanvasRenderingContext2D, cx: number, seed: number,
  night = false, t = 0,
) {
  const r = rng(seed);
  if (night) {
    moon(g, cx + (r() - 0.5) * 900, -LINE * 15.4, LINE * 1.45, seed + 1);
    for (let i = 0; i < 18; i++) {
      const sx = cx - 900 + r() * 1800;
      const sy = -LINE * (9 + r() * 8);
      const k = 5 + Math.sin(t * 2 + i) * 1.2;
      pen(g, [[sx - k, sy], [sx + k, sy]], seed + 10 + i, { w: 2, passes: 1, colour: '#e8dfc0', overshoot: 0 });
      pen(g, [[sx, sy - k], [sx, sy + k]], seed + 40 + i, { w: 2, passes: 1, colour: '#e8dfc0', overshoot: 0 });
    }
    return;
  }

  sun(g, cx + (r() < 0.5 ? -1 : 1) * (620 + r() * 220), -LINE * 15.2, LINE * 1.55, seed + 3);

  /*
    Two or three clouds.

    Built as a lumpy squashed ring rather than an arch of puffs over a flat
    bottom: the arch version read as a croquet hoop, because the fill is close
    enough to the paper that all you see is the outline, and an outline with a
    straight edge along the bottom is not a cloud. A low wide blob is.
  */
  for (let i = 0; i < 2 + Math.round(r()); i++) {
    const x = cx - 820 + r() * 1640;
    const y = -LINE * (14.2 + r() * 2);
    const w = 70 + r() * 60;
    doodle(g, loop(ring(x, y, w, 13, 0.36, seed + 100 + i), 7), seed + 100 + i, '#eef2f6',
      { w: 2.4, slop: 3, colour: 'rgba(94,104,120,0.5)' });
  }

  // Birds: the two-stroke tick everybody draws.
  for (let i = 0; i < 4 + Math.round(r() * 3); i++) {
    const x = cx - 700 + r() * 1400;
    const y = -LINE * (9.5 + r() * 4);
    const w = 14 + r() * 10;
    const drift = Math.sin(t * 0.3 + i) * 5;
    pen(g, [[x - w + drift, y], [x + drift, y - w * 0.45], [x + w + drift, y]], seed + 200 + i,
      { w: 2.6, passes: 1, overshoot: 0, colour: '#5a5243' });
  }
}
