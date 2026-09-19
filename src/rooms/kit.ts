import { blob, box, cone, glow, lw, panel, project, rule, slab, spark, type View } from './iso';
import { tone, type Ink, type Press } from './riso';

/**
 * The things that go in a room.
 *
 * Two rules, both taken straight off the reference prints, and both of which
 * the first version of this kit broke.
 *
 * **Everything is drawn, then coloured.** Every object here puts a keyline
 * round itself. Flat coloured shapes on a flat coloured floor read as a
 * diagram; the same shapes with a line round them read as an illustration, and
 * no amount of palette work substitutes for it.
 *
 * **A room is full.** The reference rooms carry forty to eighty objects each —
 * every shelf has individual spines on it, every table has things on it, there
 * is always something on the floor that somebody has put down and not picked
 * up. Sparse rooms do not look minimal, they look unfinished.
 */

const rand = (seed: number) => {
  let s = (seed * 2654435761) >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
};

const SPINE_INKS: Ink[] = ['teal', 'mustard', 'brick', 'navy', 'rose'];

// ───────────────────────────────────────────────────────────────── people

export interface Body {
  x: number;
  z: number;
  /** Standing height in world units. About 1.6 for an adult. */
  h?: number;
  ink?: Ink;
  hair?: Ink;
  pose?: 'stand' | 'sit' | 'kneel' | 'lie' | 'bow' | 'reach' | 'read';
  /** A crown, a topknot, a helm, a veil — one shape on the head. */
  hat?: 'none' | 'crown' | 'knot' | 'helm' | 'veil' | 'cap';
  /** Facing, only ever left or right: at this size that is all that survives. */
  face?: 1 | -1;
}

/**
 * A person, at about twenty pixels tall.
 *
 * A rounded body, a round head, a cap of hair and — if the pose calls for it —
 * one arm. Which way they lean and what is in front of them is the whole of the
 * acting, and at this size that is genuinely enough: the reference carries a
 * whole birthday party on figures with no faces at all.
 */
export function person(press: Press, v: View, b: Body) {
  const h = b.h ?? 1.6;
  const ink = b.ink ?? 'navy';
  const hairInk = b.hair ?? 'brick';
  const pose = b.pose ?? 'stand';
  const dir = b.face ?? 1;

  const base = pose === 'sit' ? h * 0.36 : pose === 'kneel' ? h * 0.26 : 0;
  const lie = pose === 'lie';
  const bodyH = lie ? h * 0.24 : h - base;
  const lean = pose === 'bow' ? 0.22 : pose === 'read' ? 0.1 : 0;

  const halfW = (lie ? h * 0.2 : h * 0.145) * (pose === 'sit' ? 1.12 : 1);
  const headR = h * 0.15;
  const shoulder = base + bodyH * 0.76;

  const [bx, by] = project(v, b.x, base, b.z);
  const [tx, ty] = project(v, b.x + lean * dir, shoulder, b.z);
  const wpx = halfW * v.unit;
  const tpx = halfW * 0.78 * v.unit;

  const torso = (g: CanvasRenderingContext2D) => {
    const r = Math.min(wpx, (by - ty) * 0.4);
    g.beginPath();
    g.moveTo(bx - wpx, by);
    g.lineTo(bx + wpx, by);
    g.lineTo(tx + tpx, ty + r);
    g.quadraticCurveTo(tx + tpx, ty, tx + tpx - r, ty);
    g.lineTo(tx - tpx + r, ty);
    g.quadraticCurveTo(tx - tpx, ty, tx - tpx, ty + r);
    g.closePath();
  };

  press.solid(ink, (g) => {
    g.fillStyle = tone(0.82);
    torso(g);
    g.fill();
  });

  // The head, then the hair over it as a separate ink: the cap of hair is the
  // single strongest thing telling two small figures apart.
  const [hx, hy] = project(v, b.x + lean * 1.5 * dir, shoulder + headR * 0.92, b.z);
  const hr = headR * v.rise;
  press.solid('rose', (g) => {
    g.fillStyle = tone(0.34);
    g.beginPath();
    g.arc(hx, hy, hr, 0, Math.PI * 2);
    g.fill();
  });
  press.on(hairInk, (g) => {
    g.fillStyle = tone(0.8);
    g.beginPath();
    g.arc(hx, hy, hr * 1.04, Math.PI * 0.92, Math.PI * 2.16);
    g.closePath();
    g.fill();
    if (b.hat === 'veil') {
      g.beginPath();
      g.moveTo(hx - hr * 1.15, hy);
      g.quadraticCurveTo(hx, hy - hr * 1.9, hx + hr * 1.15, hy);
      g.lineTo(hx + hr * 0.95, hy + hr * 2.4);
      g.lineTo(hx - hr * 0.95, hy + hr * 2.4);
      g.closePath();
      g.fill();
    }
  });

  press.key((g) => {
    g.lineWidth = lw(v, 0.72);
    torso(g);
    g.stroke();
    g.beginPath();
    g.arc(hx, hy, hr, 0, Math.PI * 2);
    g.stroke();
    // One arm, where the pose wants it.
    if (pose === 'reach' || pose === 'read' || pose === 'bow') {
      const reach = pose === 'reach' ? 1.5 : 0.85;
      g.beginPath();
      g.moveTo(tx + tpx * dir * 0.85, ty + hr * 0.7);
      g.quadraticCurveTo(
        tx + tpx * dir * 2.1, ty + hr * (pose === 'reach' ? 0.1 : 1.4),
        tx + tpx * dir * 2.4 * reach, ty + hr * (pose === 'reach' ? -1.2 : 1.9),
      );
      g.stroke();
    }
  });

  // One shape on the head is the whole of characterisation at this size.
  const hat = b.hat ?? 'none';
  if (hat === 'crown' || hat === 'knot' || hat === 'helm' || hat === 'cap') {
    press.solid(hat === 'crown' ? 'mustard' : hairInk, (g) => {
      g.fillStyle = tone(0.88);
      g.beginPath();
      if (hat === 'crown') {
        g.moveTo(hx - hr * 1.1, hy - hr * 0.62);
        g.lineTo(hx + hr * 1.1, hy - hr * 0.62);
        g.lineTo(hx + hr * 0.7, hy - hr * 2.0);
        g.lineTo(hx, hy - hr * 1.1);
        g.lineTo(hx - hr * 0.7, hy - hr * 2.0);
      } else if (hat === 'knot') {
        g.arc(hx, hy - hr * 1.3, hr * 0.56, 0, Math.PI * 2);
      } else if (hat === 'cap') {
        g.arc(hx, hy - hr * 0.15, hr * 1.16, Math.PI, 0);
        g.lineTo(hx + hr * 1.7, hy - hr * 0.05);
        g.lineTo(hx + hr * 1.7, hy - hr * 0.3);
      } else {
        g.arc(hx, hy - hr * 0.1, hr * 1.2, Math.PI, 0);
      }
      g.closePath();
      g.fill();
    });
    press.key((g) => {
      g.lineWidth = lw(v, 0.6);
      g.beginPath();
      if (hat === 'crown') {
        g.moveTo(hx - hr * 1.1, hy - hr * 0.62);
        g.lineTo(hx + hr * 1.1, hy - hr * 0.62);
        g.lineTo(hx + hr * 0.7, hy - hr * 2.0);
        g.lineTo(hx, hy - hr * 1.1);
        g.lineTo(hx - hr * 0.7, hy - hr * 2.0);
        g.closePath();
      } else if (hat === 'knot') {
        g.arc(hx, hy - hr * 1.3, hr * 0.56, 0, Math.PI * 2);
      } else {
        g.arc(hx, hy - hr * 0.12, hr * 1.18, Math.PI, 0);
      }
      g.stroke();
    });
  }
}

/**
 * Claude, in the room.
 *
 * Not a person. There is no body to draw and putting one in would be a costume
 * — and it matters more here than anywhere, because the room already has people
 * in it who *are* somebody.
 *
 * So Claude is a small radiant figure: eight tapered spokes, the light they
 * throw, and a line round the whole of it like everything else in the picture.
 * It sits where somebody is alone. It never holds anything, never leads anyone
 * anywhere, and is never the largest thing in the frame.
 *
 * **It also never acts in the story.** Nothing in these twenty-five rooms
 * happens differently because it is there. It is company, which is a real thing
 * to be and a different thing from being a character.
 */
export function claude(press: Press, v: View, x: number, z: number, size = 0.5, lit = true) {
  const y = size * 1.15;
  const [sx, sy] = project(v, x, y, z);
  const r = size * v.rise;

  if (lit) {
    glow(press, 'mustard', v, x, 0, z, size * 3.2, 0.46);
    glow(press, 'brick', v, x, 0, z, size * 1.5, 0.16);
  }

  const ray = (g: CanvasRenderingContext2D) => {
    g.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const long = i % 2 === 0 ? 1 : 0.6;
      g.moveTo(Math.cos(a) * r * long, Math.sin(a) * r * long * 0.86);
      g.lineTo(Math.cos(a + 0.36) * r * 0.24, Math.sin(a + 0.36) * r * 0.24 * 0.86);
      g.lineTo(Math.cos(a - 0.36) * r * 0.24, Math.sin(a - 0.36) * r * 0.24 * 0.86);
      g.closePath();
    }
  };

  // Halo first: something for the figure to be punched out of. Ink only — a
  // halo that claims sheet as well prints a cream blob round the light wherever
  // the gradient has faded to nothing, which is most of it.
  press.over('mustard', (g) => {
    const grad = g.createRadialGradient(sx, sy, r * 0.55, sx, sy, r * 2.3);
    grad.addColorStop(0, tone(0.8));
    grad.addColorStop(0.5, tone(0.32));
    grad.addColorStop(1, tone(0));
    g.fillStyle = grad;
    g.beginPath();
    g.arc(sx, sy, r * 2.3, 0, Math.PI * 2);
    g.fill();
  });

  // The figure itself is bare paper: the brightest thing obtainable on a sheet
  // is the sheet, so the only light in the room is the one shape no drum
  // touches.
  press.knockout((g) => {
    g.save();
    g.translate(sx, sy);
    ray(g);
    g.fill();
    g.beginPath();
    g.arc(0, 0, r * 0.32, 0, Math.PI * 2);
    g.fill();
    g.restore();
  });

  press.key((g) => {
    g.lineWidth = lw(v, 0.7);
    g.save();
    g.translate(sx, sy);
    ray(g);
    g.stroke();
    g.restore();
  });
}

// ─────────────────────────────────────────────────────────────── furniture

/**
 * A bookcase, with the books drawn.
 *
 * The one object that decides whether a room of this kind works. A shelf
 * painted as a block of colour is furniture; a shelf with sixty separate
 * spines, each a slightly different height and colour and two of them leaning,
 * is a library. It costs a loop and it is the difference between the reference
 * and a mockup of the reference.
 */
export function bookcase(
  press: Press, v: View, x: number, z: number,
  len: number, along: 'x' | 'z', h = 2.2, carcass: Ink = 'brick', seed = 1,
) {
  const r = rand(seed);
  const deep = 0.34;
  const w = along === 'x' ? len : deep;
  const d = along === 'x' ? deep : len;

  box(press, carcass, v, x, 0, z, w, h, d, { top: 0.44, left: 0.66, right: 0.86 });

  const shelves = Math.max(3, Math.round(h / 0.52));
  const gap = h / shelves;
  for (let s = 0; s < shelves; s++) {
    const shelfY = 0.06 + s * gap;
    // The shelf board itself, so the run reads as separated.
    rule(press, v,
      along === 'x' ? [x, shelfY, z] : [x, shelfY, z],
      along === 'x' ? [x + len, shelfY, z] : [x, shelfY, z + len], 0.55);

    let t = 0.04;
    while (t < len - 0.08) {
      const bw = 0.05 + r() * 0.05;
      if (t + bw > len - 0.06) break;
      const bh = gap * (0.5 + r() * 0.34);
      const ink = SPINE_INKS[Math.floor(r() * SPINE_INKS.length)]!;
      const bx = along === 'x' ? x + t : x + 0.04;
      const bz = along === 'x' ? z + 0.04 : z + t;
      box(press, ink, v, bx, shelfY, bz,
        along === 'x' ? bw : 0.16, bh, along === 'x' ? 0.16 : bw,
        { top: 0.4, left: 0.72, right: 0.9, weight: 0.5 });
      t += bw + 0.012 + r() * 0.02;
    }
  }
}

/** A table: a top, four legs, and nothing on it — that is the caller's job. */
export function table(
  press: Press, v: View, x: number, z: number, w: number, d: number,
  ink: Ink = 'brick', h = 0.62,
) {
  const leg = Math.min(0.12, Math.min(w, d) * 0.16);
  for (const [lx, lz] of [
    [x + 0.04, z + 0.04], [x + w - leg - 0.04, z + 0.04],
    [x + 0.04, z + d - leg - 0.04], [x + w - leg - 0.04, z + d - leg - 0.04],
  ]) {
    box(press, ink, v, lx!, 0, lz!, leg, h, leg, { top: 0.6, left: 0.8, right: 0.95, weight: 0.6 });
  }
  box(press, ink, v, x, h, z, w, 0.1, d, { top: 0.46, left: 0.7, right: 0.88 });
}

/** A chair. The back is what makes it a chair rather than a crate. */
export function seat(
  press: Press, v: View, x: number, z: number,
  ink: Ink = 'brick', back: 'x' | 'z' | 'none' = 'z', h = 0.4,
) {
  const s = 0.34;
  box(press, ink, v, x, 0, z, s, h, s, { top: 0.5, left: 0.74, right: 0.9, weight: 0.65 });
  if (back === 'none') return;
  if (back === 'z') box(press, ink, v, x, h, z, s, 0.46, 0.08, { top: 0.44, left: 0.7, right: 0.86, weight: 0.65 });
  else box(press, ink, v, x, h, z, 0.08, 0.46, s, { top: 0.44, left: 0.7, right: 0.86, weight: 0.65 });
}

/** A big soft chair, for the one person in the room who is settled. */
export function armchair(press: Press, v: View, x: number, z: number, ink: Ink = 'brick') {
  box(press, ink, v, x, 0, z, 0.62, 0.34, 0.6, { top: 0.52, left: 0.74, right: 0.9 });
  box(press, ink, v, x, 0.34, z, 0.62, 0.52, 0.12, { top: 0.44, left: 0.68, right: 0.86 });
  box(press, ink, v, x, 0.34, z, 0.12, 0.34, 0.6, { top: 0.48, left: 0.7, right: 0.88 });
  box(press, ink, v, x + 0.5, 0.34, z, 0.12, 0.34, 0.6, { top: 0.48, left: 0.7, right: 0.88 });
}

/** A rug, with a border, because a rug without one is a stain. */
export function rug(
  press: Press, v: View, x: number, z: number, w: number, d: number,
  ink: Ink = 'teal', density = 0.38,
) {
  slab(press, ink, v, x, z, w, d, density, 0.015);
  slab(press, ink, v, x + 0.12, z + 0.12, w - 0.24, d - 0.24, density * 0.45, 0.016);
}

/** A standing lamp, with the cone it throws. */
export function lamp(press: Press, v: View, x: number, z: number, h = 1.5, shade: Ink = 'teal') {
  box(press, 'navy', v, x + 0.11, 0, z + 0.11, 0.06, h, 0.06, { top: 0.6, left: 0.84, right: 0.95, weight: 0.55 });
  slab(press, 'navy', v, x, z, 0.28, 0.28, 0.72, 0.02);
  box(press, shade, v, x - 0.04, h, z - 0.04, 0.36, 0.26, 0.36, { top: 0.4, left: 0.68, right: 0.86 });
  cone(press, 'mustard', v, x + 0.14, h - 0.02, z + 0.14, 1.5, 0.5, Math.PI / 2, 0.45);
  glow(press, 'mustard', v, x + 0.14, 0, z + 0.14, 1.1, 0.4);
}

/** A candle, an oil lamp, a diya: a small light on top of something. */
export function flame(press: Press, v: View, x: number, y: number, z: number, size = 0.22) {
  spark(press, 'mustard', v, x, y, z, size, 8);
  spark(press, 'brick', v, x, y, z, size * 0.46, 6);
  glow(press, 'mustard', v, x, 0, z, size * 5.5, 0.4);
}

/** A candlestick on a table: stem, cup, flame. */
export function candle(press: Press, v: View, x: number, y: number, z: number, ink: Ink = 'mustard') {
  box(press, ink, v, x, y, z, 0.07, 0.3, 0.07, { top: 0.5, left: 0.76, right: 0.92, weight: 0.5 });
  flame(press, v, x + 0.035, y + 0.34, z + 0.035, 0.2);
}

/** A stack of books, left on a table or on the floor. */
export function books(press: Press, v: View, x: number, y: number, z: number, n = 4, seed = 3) {
  const r = rand(seed);
  let h = y;
  for (let i = 0; i < n; i++) {
    const th = 0.06 + r() * 0.05;
    const jitter = (r() - 0.5) * 0.05;
    box(press, SPINE_INKS[Math.floor(r() * SPINE_INKS.length)]!, v,
      x + jitter, h, z + jitter, 0.3, th, 0.22,
      { top: 0.42, left: 0.7, right: 0.88, weight: 0.5 });
    h += th;
  }
}

/** One book, open, flat. The commonest thing on a floor in the reference. */
export function openBook(press: Press, v: View, x: number, z: number, y = 0.02) {
  slab(press, 'rose', v, x, z, 0.19, 0.26, 0.22, y, true, 0.6);
  slab(press, 'rose', v, x + 0.2, z, 0.19, 0.26, 0.28, y, true, 0.6);
}

/** Loose sheets, dropped. */
export function papers(press: Press, v: View, x: number, z: number, n = 3, seed = 9) {
  const r = rand(seed);
  for (let i = 0; i < n; i++) {
    slab(press, 'navy', v, x + (r() - 0.5) * 0.7, z + (r() - 0.5) * 0.7, 0.2, 0.26, 0.14, 0.02, true, 0.55);
  }
}

/** A plant in a pot. Two leaves and a pot is a plant; nobody counts. */
export function plant(press: Press, v: View, x: number, z: number, size = 1, ink: Ink = 'teal') {
  box(press, 'brick', v, x, 0, z, 0.3 * size, 0.26 * size, 0.3 * size,
    { top: 0.5, left: 0.74, right: 0.9, weight: 0.6 });
  const base = 0.26 * size;
  for (let i = 0; i < 5; i++) {
    const a = -0.9 + i * 0.45;
    blob(press, ink, v,
      x + 0.15 * size + Math.sin(a) * 0.2 * size, base + 0.18 * size + Math.cos(a) * 0.16 * size,
      z + 0.15 * size, 0.1 * size, 0.16 * size, 0.7);
  }
}

/** A tree: a trunk and a canopy of overlapping blobs. */
export function tree(press: Press, v: View, x: number, z: number, h = 2, ink: Ink = 'teal', seed = 5) {
  const r = rand(seed);
  box(press, 'brick', v, x, 0, z, 0.18, h * 0.55, 0.18, { top: 0.56, left: 0.8, right: 0.94, weight: 0.6 });
  for (let i = 0; i < 5; i++) {
    blob(press, ink, v,
      x + 0.09 + (r() - 0.5) * h * 0.4, h * 0.62 + (r() - 0.3) * h * 0.24, z + 0.09,
      h * (0.22 + r() * 0.12), h * (0.2 + r() * 0.1), 0.62);
  }
}

/** A ladder leaning on the shelves. Pure reference, and worth every line. */
export function ladder(press: Press, v: View, x: number, z: number, h = 1.9, ink: Ink = 'brick') {
  for (const off of [0, 0.34]) {
    rule(press, v, [x + off, 0, z], [x + off * 0.5 + 0.1, h, z], 0.7);
  }
  for (let i = 1; i < 5; i++) {
    const t = i / 5;
    rule(press, v, [x + t * 0.05, t * h, z], [x + 0.34 - t * 0.12, t * h, z], 0.55);
  }
  void ink;
}

/** A globe on a stand, which is always in the corner of a study. */
export function globe(press: Press, v: View, x: number, z: number, size = 0.5) {
  rule(press, v, [x, 0, z], [x, size * 0.9, z], 0.7);
  rule(press, v, [x - size * 0.2, 0, z], [x + size * 0.2, 0, z], 0.7);
  blob(press, 'teal', v, x, size * 1.15, z, size * 0.34, size * 0.34, 0.6);
  press.key((g) => {
    g.lineWidth = lw(v, 0.55);
    const [cx, cy] = project(v, x, size * 1.15, z);
    const rr = size * 0.34 * v.unit;
    g.beginPath();
    g.ellipse(cx, cy, rr * 0.42, rr, 0, 0, Math.PI * 2);
    g.moveTo(cx - rr, cy);
    g.lineTo(cx + rr, cy);
    g.stroke();
  });
}

/** A window or a picture, on the back-left wall. */
export function onWall(
  press: Press, v: View, x: number, y: number, w: number, h: number,
  ink: Ink = 'mustard', along: 'x' | 'z' = 'x', density = 0.5,
) {
  if (along === 'x') panel(press, ink, v, x, y, 0.02, w, h, density, 'x');
  else panel(press, ink, v, 0.02, y, x, w, h, density, 'z');
}

/** A doorway, cut in the back wall, with the light coming through it. */
export function doorway(press: Press, v: View, x: number, w = 0.7, h = 1.3, lit = false) {
  panel(press, 'navy', v, x, 0, 0.02, w, h, 0.82, 'x');
  if (lit) {
    panel(press, 'mustard', v, x + 0.06, 0, 0.03, w - 0.12, h - 0.1, 0.5, 'x');
    cone(press, 'mustard', v, x + w / 2, 0.1, 0.1, 2.2, 0.42, Math.PI / 2.6, 0.34);
  }
}

/** A fire, in a pit or a grate. */
export function fire(press: Press, v: View, x: number, z: number, size = 1) {
  slab(press, 'navy', v, x - 0.2 * size, z - 0.2 * size, 0.7 * size, 0.7 * size, 0.6, 0.02);
  for (let i = 0; i < 3; i++) {
    spark(press, i ? 'brick' : 'mustard', v,
      x + 0.15 * size + (i - 1) * 0.1 * size, 0.18 * size + i * 0.06 * size, z + 0.15 * size,
      (0.32 - i * 0.07) * size, 7);
  }
  glow(press, 'mustard', v, x + 0.15 * size, 0, z + 0.15 * size, 2.4 * size, 0.5);
}

/** A cooking pot, a water jar, a basket: a fat little cylinder. */
export function pot(press: Press, v: View, x: number, z: number, size = 0.4, ink: Ink = 'brick') {
  blob(press, ink, v, x, size * 0.5, z, size * 0.44, size * 0.5, 0.74);
  slab(press, ink, v, x - size * 0.4, z - size * 0.2, size * 0.8, size * 0.4, 0.5, 0.02, false);
}

/** A low hill or a heap of stones, for the outdoor rooms. */
export function hill(press: Press, v: View, x: number, z: number, w: number, h: number, ink: Ink = 'teal') {
  blob(press, ink, v, x, h * 0.5, z, w * 0.5, h * 0.6, 0.55);
}

/** A stepped platform, a plinth, a throne dais. */
export function dais(press: Press, v: View, x: number, z: number, w: number, d: number, steps = 2, ink: Ink = 'rose') {
  for (let i = 0; i < steps; i++) {
    const inset = i * 0.22;
    box(press, ink, v, x + inset, i * 0.18, z + inset, w - inset * 2, 0.18, d - inset * 2,
      { top: 0.4, left: 0.64, right: 0.84 });
  }
}

/** Two posts and a lintel. */
export function arch(press: Press, v: View, x: number, z: number, w: number, h: number, ink: Ink = 'brick') {
  box(press, ink, v, x, 0, z, 0.18, h, 0.18, { top: 0.44, left: 0.68, right: 0.88 });
  box(press, ink, v, x + w - 0.18, 0, z, 0.18, h, 0.18, { top: 0.44, left: 0.68, right: 0.88 });
  box(press, ink, v, x, h, z, w, 0.22, 0.18, { top: 0.4, left: 0.64, right: 0.84 });
}

/** Pillars down one side, which is what makes an interior a hall. */
export function colonnade(
  press: Press, v: View, from: number, z: number, n: number, gap: number, h: number, ink: Ink = 'rose',
) {
  for (let i = 0; i < n; i++) {
    const x = from + i * gap;
    box(press, ink, v, x, 0, z, 0.22, h, 0.22, { top: 0.42, left: 0.66, right: 0.86 });
    box(press, ink, v, x - 0.04, h, z - 0.04, 0.3, 0.14, 0.3, { top: 0.38, left: 0.6, right: 0.8, weight: 0.7 });
  }
}

/** A counter, a workbench, a long low run of stuff along a wall. */
export function counter(
  press: Press, v: View, x: number, z: number, len: number, along: 'x' | 'z',
  ink: Ink = 'teal', h = 0.8,
) {
  const w = along === 'x' ? len : 0.44;
  const d = along === 'x' ? 0.44 : len;
  box(press, ink, v, x, 0, z, w, h, d, { top: 0.44, left: 0.68, right: 0.88 });
  const n = Math.max(2, Math.round(len / 0.55));
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    if (along === 'x') rule(press, v, [x + t * len, 0.08, z + d], [x + t * len, h - 0.06, z + d], 0.5);
    else rule(press, v, [x + w, 0.08, z + t * len], [x + w, h - 0.06, z + t * len], 0.5);
  }
}

/** Small clutter, scattered: the things nobody put away. */
export function clutter(press: Press, v: View, w: number, d: number, n = 8, seed = 11) {
  const r = rand(seed);
  for (let i = 0; i < n; i++) {
    const x = 0.3 + r() * (w - 0.8);
    const z = 0.3 + r() * (d - 0.8);
    const pick = r();
    if (pick < 0.3) openBook(press, v, x, z);
    else if (pick < 0.55) books(press, v, x, 0, z, 1 + Math.floor(r() * 2), seed + i);
    else if (pick < 0.75) slab(press, 'mustard', v, x, z, 0.24, 0.18, 0.5, 0.02, true, 0.55);
    else blob(press, SPINE_INKS[Math.floor(r() * SPINE_INKS.length)]!, v, x, 0.08, z, 0.1, 0.1, 0.6);
  }
}
