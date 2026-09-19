import { glow, panel, project, type View } from './iso';
import { box } from './iso';
import { tone, type Ink, type Press } from './riso';

/**
 * The things that go in a room, and the one that keeps company.
 *
 * Everything is tiny — a person is about fourteen pixels tall in a four
 * hundred pixel room — so nothing is detailed and everything is silhouette. A
 * figure is a tapered body and a head, and which way it leans is the only
 * acting it will ever do. At this size that is genuinely enough: the reference
 * carries a whole birthday party on figures with no faces.
 */

export interface Body {
  /** Ground position. */
  x: number;
  z: number;
  /** Standing height in world units. About 1.7 for an adult. */
  h?: number;
  ink?: Ink;
  /** Which way the shoulders face, in radians about the vertical. */
  turn?: number;
  pose?: 'stand' | 'sit' | 'kneel' | 'lie' | 'bow';
  /** A crown, a topknot, a helm — one shape on the head. */
  hat?: 'none' | 'crown' | 'knot' | 'helm' | 'veil';
}

export function person(press: Press, v: View, b: Body) {
  const h = b.h ?? 1.7;
  const ink = b.ink ?? 'navy';
  const pose = b.pose ?? 'stand';
  const lean = pose === 'bow' ? 0.34 : 0;
  const base = pose === 'sit' ? h * 0.42 : pose === 'kneel' ? h * 0.3 : pose === 'lie' ? 0 : 0;
  const bodyH = pose === 'lie' ? h * 0.22 : h - base;

  press.on(ink, (g) => {
    const P = (x: number, y: number, z: number) => project(v, x, y, z);
    const wBot = 0.3;
    const wTop = 0.2;
    const [bx, by] = P(b.x, base, b.z);
    const [tx, ty] = P(b.x + lean * 0.4, base + bodyH * 0.78, b.z);
    const wpx = wBot * v.unit;
    const tpx = wTop * v.unit;

    // The body: a tapered slab, wider at the hem.
    g.fillStyle = tone(0.9);
    g.beginPath();
    g.moveTo(bx - wpx, by);
    g.lineTo(bx + wpx, by);
    g.lineTo(tx + tpx, ty);
    g.lineTo(tx - tpx, ty);
    g.closePath();
    g.fill();

    // The head.
    const [hx, hy] = P(b.x + lean * 0.7, base + bodyH * 0.96, b.z);
    const hr = Math.max(1.9, h * 0.17 * v.rise * 0.9);
    g.beginPath();
    g.arc(hx, hy, hr, 0, Math.PI * 2);
    g.fill();

    // One shape on the head is the whole of characterisation at this size.
    const hat = b.hat ?? 'none';
    if (hat === 'crown') {
      g.beginPath();
      g.moveTo(hx - hr * 1.15, hy - hr * 0.7);
      g.lineTo(hx + hr * 1.15, hy - hr * 0.7);
      g.lineTo(hx + hr * 0.75, hy - hr * 2.1);
      g.lineTo(hx, hy - hr * 1.2);
      g.lineTo(hx - hr * 0.75, hy - hr * 2.1);
      g.closePath();
      g.fill();
    } else if (hat === 'knot') {
      g.beginPath();
      g.arc(hx, hy - hr * 1.4, hr * 0.62, 0, Math.PI * 2);
      g.fill();
    } else if (hat === 'helm') {
      g.beginPath();
      g.arc(hx, hy - hr * 0.2, hr * 1.25, Math.PI, 0);
      g.fill();
    } else if (hat === 'veil') {
      g.beginPath();
      g.moveTo(hx - hr * 1.3, hy + hr * 0.4);
      g.quadraticCurveTo(hx, hy - hr * 1.9, hx + hr * 1.3, hy + hr * 0.4);
      g.lineTo(hx + hr * 1.1, hy + hr * 2.2);
      g.lineTo(hx - hr * 1.1, hy + hr * 2.2);
      g.closePath();
      g.fill();
    }
  });
}

/**
 * Claude, in the room.
 *
 * Not a person. There is no body to draw and putting one in would be a costume
 * — the same argument as the portrait page, and it matters more here, because
 * the room already has people in it who *are* somebody.
 *
 * So Claude is a small radiant figure: eight tapered spokes and the light they
 * throw. It sits where somebody is alone. It never holds anything, never leads
 * anyone anywhere, and is never the largest thing in the frame.
 *
 * **It also never acts in the story.** Nothing in these twenty-five rooms
 * happens differently because it is there. It is company, which is a real thing
 * to be and a different thing from a character.
 */
export function claude(press: Press, v: View, x: number, z: number, size = 0.52, lit = true) {
  const y = size * 1.1;
  const [sx, sy] = project(v, x, y, z);
  const r = size * v.rise;

  // The pool on the floor, which is what tells you the light is in the room
  // rather than pasted on top of it.
  if (lit) {
    glow(press, 'mustard', v, x, 0, z, size * 3.4, 0.44);
    glow(press, 'brick', v, x, 0, z, size * 1.6, 0.16);
  }

  const ray = (g: CanvasRenderingContext2D, k: number) => {
    g.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const long = (i % 2 === 0 ? 1 : 0.62) * k;
      g.moveTo(Math.cos(a) * r * long, Math.sin(a) * r * long * 0.85);
      g.lineTo(Math.cos(a + 0.34) * r * 0.22 * k, Math.sin(a + 0.34) * r * 0.22 * k * 0.85);
      g.lineTo(Math.cos(a - 0.34) * r * 0.22 * k, Math.sin(a - 0.34) * r * 0.22 * k * 0.85);
      g.closePath();
    }
  };

  // Halo first: a warm surround for the figure to be punched out of. Without
  // it the knockout below would read as a hole in the picture rather than as
  // something giving off light.
  press.on('mustard', (g) => {
    const grad = g.createRadialGradient(sx, sy, r * 0.6, sx, sy, r * 2.4);
    grad.addColorStop(0, tone(0.78));
    grad.addColorStop(0.5, tone(0.3));
    grad.addColorStop(1, tone(0));
    g.fillStyle = grad;
    g.beginPath();
    g.arc(sx, sy, r * 2.4, 0, Math.PI * 2);
    g.fill();
  });

  // The figure itself is bare paper. It is the only thing on the whole sheet
  // that no drum touches, which is exactly the right amount of special: it is
  // the brightest thing in every room and it has no colour of its own.
  press.knockout((g) => {
    g.save();
    g.translate(sx, sy);
    ray(g, 1);
    g.fill();
    g.beginPath();
    g.arc(0, 0, r * 0.34, 0, Math.PI * 2);
    g.fill();
    g.restore();
  });

  // A filament round the edge, so it is a drawn shape and not an absence.
  press.on('brick', (g) => {
    g.save();
    g.translate(sx, sy);
    g.strokeStyle = tone(0.85);
    g.lineWidth = Math.max(0.7, r * 0.09);
    g.lineJoin = 'round';
    ray(g, 1);
    g.stroke();
    g.restore();
  });
}

// ─────────────────────────────────────────────────────────────── furniture

export function shelf(press: Press, v: View, x: number, z: number, len: number, along: 'x' | 'z', ink: Ink = 'brick') {
  const w = along === 'x' ? len : 0.34;
  const d = along === 'x' ? 0.34 : len;
  box(press, ink, v, x, 0, z, w, 2.1, d, { top: 0.5, left: 0.7, right: 0.9 });
  // Rows of spines, which is what says books rather than cupboard.
  for (let sh = 0; sh < 4; sh++) {
    const y = 0.25 + sh * 0.48;
    const n = Math.round(len * 3.4);
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n;
      const bx = along === 'x' ? x + t * len : x + 0.05;
      const bz = along === 'x' ? z + 0.05 : z + t * len;
      const ink2: Ink = i % 3 === 0 ? 'teal' : i % 3 === 1 ? 'mustard' : 'navy';
      box(press, ink2, v, bx, y, bz,
        along === 'x' ? len / n * 0.72 : 0.12, 0.34, along === 'x' ? 0.12 : len / n * 0.72,
        { top: 0.45, left: 0.75, right: 0.85 });
    }
  }
}

export function table(press: Press, v: View, x: number, z: number, w: number, d: number, ink: Ink = 'rose') {
  box(press, ink, v, x, 0.62, z, w, 0.12, d, { top: 0.52, left: 0.72, right: 0.86 });
  for (const [lx, lz] of [[x + 0.08, z + 0.08], [x + w - 0.2, z + 0.08], [x + 0.08, z + d - 0.2], [x + w - 0.2, z + d - 0.2]]) {
    box(press, ink, v, lx!, 0, lz!, 0.12, 0.62, 0.12, { top: 0.6, left: 0.8, right: 0.95 });
  }
}

export function seat(press: Press, v: View, x: number, z: number, ink: Ink = 'brick', back = true) {
  box(press, ink, v, x, 0.34, z, 0.5, 0.1, 0.5, { top: 0.5, left: 0.72, right: 0.86 });
  for (const [lx, lz] of [[x, z], [x + 0.4, z], [x, z + 0.4], [x + 0.4, z + 0.4]]) {
    box(press, ink, v, lx!, 0, lz!, 0.1, 0.34, 0.1, { top: 0.6, left: 0.8, right: 0.95 });
  }
  if (back) box(press, ink, v, x, 0.44, z, 0.5, 0.6, 0.1, { top: 0.5, left: 0.7, right: 0.84 });
}

export function tree(press: Press, v: View, x: number, z: number, h = 2.6, ink: Ink = 'teal') {
  box(press, 'brick', v, x - 0.09, 0, z - 0.09, 0.18, h * 0.55, 0.18, { top: 0.6, left: 0.82, right: 0.95 });
  const [sx, sy] = project(v, x, h * 0.62, z);
  press.on(ink, (g) => {
    g.fillStyle = tone(0.78);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const rr = h * 0.3 * v.unit * 0.5;
      g.beginPath();
      g.ellipse(sx + Math.cos(a) * rr * 0.7, sy + Math.sin(a) * rr * 0.34, rr, rr * 0.72, 0, 0, Math.PI * 2);
      g.fill();
    }
  });
}

export function pot(press: Press, v: View, x: number, z: number, ink: Ink = 'brick') {
  box(press, ink, v, x, 0, z, 0.28, 0.26, 0.28, { top: 0.55, left: 0.78, right: 0.92 });
  const [sx, sy] = project(v, x + 0.14, 0.38, z + 0.14);
  press.on('teal', (g) => {
    g.fillStyle = tone(0.72);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + 0.4;
      g.beginPath();
      g.ellipse(sx + Math.cos(a) * 5, sy + Math.sin(a) * 2.6, 5.5, 3.6, a, 0, Math.PI * 2);
      g.fill();
    }
  });
}

export function fire(press: Press, v: View, x: number, z: number, size = 0.5) {
  box(press, 'brick', v, x - size / 2, 0, z - size / 2, size, 0.16, size, { top: 0.6, left: 0.82, right: 0.95 });
  glow(press, 'mustard', v, x, 0, z, size * 3.4, 0.46);
  const [sx, sy] = project(v, x, 0.2, z);
  press.on('brick', (g) => {
    g.fillStyle = tone(0.9);
    g.beginPath();
    g.moveTo(sx, sy - size * v.rise * 1.5);
    g.quadraticCurveTo(sx + size * v.unit * 0.4, sy - size * v.rise * 0.3, sx, sy);
    g.quadraticCurveTo(sx - size * v.unit * 0.4, sy - size * v.rise * 0.3, sx, sy - size * v.rise * 1.5);
    g.fill();
  });
}

/** Water, grass, sand — a flat expanse with its own tone. */
export function ground(
  press: Press, v: View, ink: Ink,
  x: number, z: number, w: number, d: number, density = 0.42, ripples = false,
) {
  press.on(ink, (g) => {
    const P = (px: number, py: number, pz: number) => project(v, px, py, pz);
    g.fillStyle = tone(density);
    g.beginPath();
    const a = P(x, 0.02, z); const b = P(x + w, 0.02, z);
    const c = P(x + w, 0.02, z + d); const e = P(x, 0.02, z + d);
    g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.lineTo(c[0], c[1]); g.lineTo(e[0], e[1]);
    g.closePath();
    g.fill();
    if (ripples) {
      g.fillStyle = tone(density * 1.7);
      for (let i = 0; i < 26; i++) {
        const rx = x + ((i * 37) % 100) / 100 * w;
        const rz = z + ((i * 61) % 100) / 100 * d;
        const [px, py] = P(rx, 0.03, rz);
        g.fillRect(px - 4, py, 8, 1.2);
      }
    }
  });
}

export function arch(press: Press, v: View, x: number, z: number, w: number, h: number, ink: Ink = 'rose') {
  box(press, ink, v, x, 0, z, 0.24, h, 0.24, { top: 0.5, left: 0.7, right: 0.88 });
  box(press, ink, v, x + w - 0.24, 0, z, 0.24, h, 0.24, { top: 0.5, left: 0.7, right: 0.88 });
  box(press, ink, v, x, h, z, w, 0.26, 0.24, { top: 0.46, left: 0.68, right: 0.86 });
}

export function hill(press: Press, v: View, x: number, z: number, w: number, h: number, ink: Ink = 'navy') {
  const [sx, sy] = project(v, x, 0, z);
  press.on(ink, (g) => {
    g.fillStyle = tone(0.55);
    g.beginPath();
    g.moveTo(sx - w * v.unit * 0.5, sy);
    g.lineTo(sx, sy - h * v.rise);
    g.lineTo(sx + w * v.unit * 0.5, sy);
    g.closePath();
    g.fill();
  });
}

/** A hanging lamp and the pool it throws. */
export function lamp(press: Press, v: View, x: number, z: number, hang = 2.1) {
  box(press, 'navy', v, x - 0.02, hang, z - 0.02, 0.04, 0.6, 0.04, { top: 0.4, left: 0.6, right: 0.7 });
  box(press, 'teal', v, x - 0.18, hang - 0.16, z - 0.18, 0.36, 0.18, 0.36, { top: 0.45, left: 0.68, right: 0.82 });
  glow(press, 'mustard', v, x, 0, z, 2.0, 0.42);
}

export { panel };
