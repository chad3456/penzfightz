import * as THREE from 'three';
import { blob, block, bloom, column, outcrop, plank, rng, rock, tuft, weld } from './forms';

/**
 * The catalogue.
 *
 * A scene is written as a list of names and positions, so everything a story
 * can put on a stage has to exist here as a builder. They all return a
 * `THREE.Group` of meshes with a *slot name* on each, and the scene composer
 * looks the slot up in the palette — so a chair is a chair whether it is
 * standing in a Petersburg garret or on a paper coast, and it takes the colour
 * of wherever it is standing.
 *
 * Every builder puts its origin **on the floor**, centred, facing −z. Nothing
 * anywhere has to remember an offset.
 */

/** Which palette colour a mesh takes. */
export type Slot =
  | 'rock' | 'rockDark' | 'grass' | 'water' | 'timber' | 'stone'
  | 'cloth' | 'metal' | 'skin' | 'accent' | 'ground' | 'glow' | 'paper' | 'dark';

export interface Part {
  geometry: THREE.BufferGeometry;
  slot: Slot;
  at?: [number, number, number];
  turn?: number;
  /** Emissive things do not take shadow and are not dimmed by the grade. */
  light?: boolean;
  noShadow?: boolean;
}

export type Prop = Part[];

const P = (geometry: THREE.BufferGeometry, slot: Slot, at?: [number, number, number], extra: Partial<Part> = {}): Part => ({
  geometry,
  slot,
  at,
  ...extra,
});

// ------------------------------------------------------------------- masonry

/** A wall, with the top edge worn. */
export function wall(w = 4, h = 3, t = 0.4, seed = 1): Prop {
  const r = rng(seed);
  const parts: THREE.BufferGeometry[] = [block(w, h, t, 0.06)];
  parts[0].translate(0, h / 2, 0);
  // A few loose stones along the top, so the line is not ruled.
  for (let i = 0; i < Math.max(2, Math.round(w * 1.4)); i++) {
    const s = 0.1 + r() * 0.12;
    const g = rock(seed * 31 + i, { size: s, rough: 0.3, squash: 0.7 });
    g.translate((r() - 0.5) * w * 0.92, h + s * 0.35, (r() - 0.5) * t * 0.6);
    parts.push(g);
  }
  return [P(weld(parts), 'stone')];
}

/** An opening with a lintel: a gate, a doorway, an arch. */
export function gate(w = 2.2, h = 3.4, t = 0.6, seed = 5): Prop {
  const side = (x: number) => {
    const g = block(0.5, h, t, 0.08);
    g.translate(x, h / 2, 0);
    return g;
  };
  const lintel = block(w + 1.2, 0.55, t * 1.2, 0.1);
  lintel.translate(0, h + 0.26, 0);
  const cap = rock(seed, { size: 0.6, rough: 0.24, squash: 0.5 });
  cap.translate(0, h + 0.7, 0);
  return [P(weld([side(-w / 2 - 0.25), side(w / 2 + 0.25), lintel, cap]), 'stone')];
}

/** A door in a frame, hinged open by `ajar` radians. */
export function door(w = 1.1, h = 2.4, ajar = 0): Prop {
  const frame = weld([
    plank(0.16, 0.22, h + 0.2).translate(-w / 2 - 0.08, (h + 0.2) / 2, 0) as THREE.BufferGeometry,
    plank(0.16, 0.22, h + 0.2).translate(w / 2 + 0.08, (h + 0.2) / 2, 0) as THREE.BufferGeometry,
    plank(w + 0.5, 0.22, 0.2).translate(0, h + 0.1, 0) as THREE.BufferGeometry,
  ]);
  // Hinged on the left stile, so it swings rather than spinning on its middle.
  const leaf = block(w, h, 0.1, 0.04);
  leaf.translate(w / 2, h / 2, 0);
  const knob = new THREE.SphereGeometry(0.07, 10, 8);
  knob.translate(w - 0.16, h * 0.5, 0.09);
  const swung = weld([leaf, knob]);
  swung.rotateY(ajar);
  swung.translate(-w / 2, 0, 0);
  return [P(frame, 'timber'), P(swung, 'timber')];
}

/** A window: frame, four panes, sill. */
export function window(w = 1.4, h = 1.7, sill = 1.1): Prop {
  const bars: THREE.BufferGeometry[] = [];
  const push = (g: THREE.BufferGeometry) => bars.push(g);
  push(plank(w + 0.24, 0.12, 0.14).translate(0, sill + h + 0.06, 0) as THREE.BufferGeometry);
  push(plank(w + 0.4, 0.2, 0.24).translate(0, sill - 0.06, 0) as THREE.BufferGeometry);
  push(plank(0.12, 0.14, h).translate(-w / 2, sill + h / 2, 0) as THREE.BufferGeometry);
  push(plank(0.12, 0.14, h).translate(w / 2, sill + h / 2, 0) as THREE.BufferGeometry);
  push(plank(w, 0.08, 0.08).translate(0, sill + h / 2, 0) as THREE.BufferGeometry);
  push(plank(0.08, 0.08, h).translate(0, sill + h / 2, 0) as THREE.BufferGeometry);
  const glass = block(w - 0.06, h - 0.06, 0.04, 0.02);
  glass.translate(0, sill + h / 2, -0.03);
  return [P(weld(bars), 'timber'), P(glass, 'glow', undefined, { light: true, noShadow: true })];
}

/** Floorboards, running along z. */
export function boards(w = 8, d = 8, seed = 3): Prop {
  const r = rng(seed);
  const parts: THREE.BufferGeometry[] = [];
  const boardW = 0.62;
  for (let x = -w / 2; x < w / 2; x += boardW) {
    const g = block(boardW * 0.94, 0.12, d, 0.02);
    g.translate(x + boardW / 2, -0.06 - r() * 0.012, 0);
    parts.push(g);
  }
  return [P(weld(parts, false), 'timber')];
}

/** A short flight of steps. */
export function stair(steps = 5, w = 2, rise = 0.3, run = 0.42): Prop {
  const parts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < steps; i++) {
    const g = block(w, rise, run * (steps - i), 0.03);
    g.translate(0, rise * (i + 0.5), (-run * (steps - i)) / 2 + run * i);
    parts.push(g);
  }
  return [P(weld(parts, false), 'stone')];
}

/** A railing: posts and two rails. */
export function railing(len = 4, h = 1, seed = 9): Prop {
  const parts: THREE.BufferGeometry[] = [];
  const n = Math.max(2, Math.round(len / 0.9));
  for (let i = 0; i <= n; i++) {
    const g = column(0.05, 0.06, h, 8);
    g.translate(-len / 2 + (len * i) / n, h / 2, 0);
    parts.push(g);
  }
  for (const y of [h * 0.95, h * 0.5]) {
    const g = column(0.04, 0.04, len, 8, false);
    g.rotateZ(Math.PI / 2);
    g.translate(0, y, 0);
    parts.push(g);
  }
  void seed;
  return [P(weld(parts), 'metal')];
}

// ------------------------------------------------------------------ furniture

export function table(w = 1.6, h = 0.78, d = 0.9): Prop {
  const parts: THREE.BufferGeometry[] = [block(w, 0.1, d, 0.03).translate(0, h, 0) as THREE.BufferGeometry];
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const g = column(0.055, 0.07, h, 10);
      g.translate((sx * (w / 2 - 0.14)), h / 2, sz * (d / 2 - 0.14));
      parts.push(g);
    }
  }
  return [P(weld(parts), 'timber')];
}

export function chair(h = 0.95): Prop {
  const seat = block(0.5, 0.08, 0.48, 0.03);
  seat.translate(0, 0.46, 0);
  const parts = [seat];
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const g = column(0.035, 0.045, 0.46, 8);
      g.translate(sx * 0.2, 0.23, sz * 0.19);
      parts.push(g);
    }
  }
  const backLeft = column(0.035, 0.04, h - 0.46, 8);
  backLeft.translate(-0.2, 0.46 + (h - 0.46) / 2, -0.19);
  const backRight = backLeft.clone();
  backRight.translate(0.4, 0, 0);
  const rail = block(0.46, 0.13, 0.06, 0.03);
  rail.translate(0, h - 0.1, -0.19);
  parts.push(backLeft, backRight, rail);
  return [P(weld(parts), 'timber')];
}

export function stool(h = 0.5): Prop {
  const top = column(0.24, 0.24, 0.08, 14);
  top.translate(0, h, 0);
  const parts = [top];
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const g = column(0.035, 0.05, h, 8);
    g.translate(Math.cos(a) * 0.15, h / 2, Math.sin(a) * 0.15);
    parts.push(g);
  }
  return [P(weld(parts), 'timber')];
}

export function bed(w = 1.2, l = 2.1): Prop {
  const frame = block(w + 0.14, 0.34, l + 0.14, 0.05);
  frame.translate(0, 0.28, 0);
  const head = block(w + 0.14, 0.85, 0.12, 0.05);
  head.translate(0, 0.6, -l / 2 - 0.02);
  const legs: THREE.BufferGeometry[] = [];
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const g = column(0.06, 0.07, 0.24, 8);
      g.translate(sx * (w / 2 - 0.02), 0.12, sz * (l / 2 - 0.02));
      legs.push(g);
    }
  }
  const mattress = block(w, 0.24, l, 0.1);
  mattress.translate(0, 0.55, 0);
  const pillow = block(w * 0.62, 0.16, 0.42, 0.08);
  pillow.translate(0, 0.72, -l / 2 + 0.34);
  return [P(weld([frame, head, ...legs]), 'timber'), P(weld([mattress, pillow]), 'cloth')];
}

export function crate(s = 0.6): Prop {
  const parts = [block(s, s, s, 0.03)];
  parts[0].translate(0, s / 2, 0);
  for (const y of [s * 0.22, s * 0.78]) {
    const band = block(s + 0.03, 0.05, s + 0.03, 0.02);
    band.translate(0, y, 0);
    parts.push(band);
  }
  return [P(weld(parts), 'timber')];
}

/** A shelf of books, as blocks of varying height. */
export function shelfOfBooks(w = 1.8, seed = 4): Prop {
  const r = rng(seed);
  const board = block(w, 0.07, 0.3, 0.02);
  const books: THREE.BufferGeometry[] = [];
  let x = -w / 2 + 0.05;
  while (x < w / 2 - 0.08) {
    const bw = 0.05 + r() * 0.06;
    const bh = 0.24 + r() * 0.14;
    const g = block(bw, bh, 0.24, 0.012);
    g.rotateZ((r() - 0.5) * 0.14);
    g.translate(x + bw / 2, 0.035 + bh / 2, 0);
    books.push(g);
    x += bw + 0.006;
  }
  return [P(board, 'timber'), P(weld(books, false), 'cloth')];
}

/** A single book, shut, lying down. */
export function book(w = 0.34, h = 0.06, d = 0.24): Prop {
  const covers = block(w, h, d, 0.012);
  covers.translate(0, h / 2, 0);
  const pages = block(w * 0.94, h * 0.7, d * 0.94, 0.008);
  pages.translate(0.01, h / 2, 0);
  return [P(covers, 'cloth'), P(pages, 'paper')];
}

/** Loose sheets, scattered flat. */
export function papers(count = 7, spread = 0.7, seed = 12): Prop {
  const r = rng(seed);
  const parts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < count; i++) {
    const g = block(0.24 + r() * 0.06, 0.006, 0.3 + r() * 0.06, 0.004);
    g.rotateY(r() * Math.PI);
    g.translate((r() - 0.5) * spread, 0.004 + i * 0.006, (r() - 0.5) * spread);
    parts.push(g);
  }
  return [P(weld(parts, false), 'paper')];
}

// ---------------------------------------------------------------------- light

/** A street lamp: post, arm, and a lit head. */
export function lamp(h = 3.2): Prop {
  const post = column(0.07, 0.12, h, 12);
  post.translate(0, h / 2, 0);
  const foot = column(0.2, 0.26, 0.24, 12);
  foot.translate(0, 0.12, 0);
  const hood = new THREE.ConeGeometry(0.3, 0.34, 12);
  hood.translate(0, h + 0.28, 0);
  const head = new THREE.SphereGeometry(0.19, 14, 10);
  head.translate(0, h + 0.04, 0);
  return [P(weld([post, foot, hood]), 'metal'), P(head, 'glow', undefined, { light: true, noShadow: true })];
}

/** A candle or an oil lamp on a surface. */
export function lantern(h = 0.4): Prop {
  const body = column(0.11, 0.14, h, 12);
  body.translate(0, h / 2, 0);
  const cage = column(0.13, 0.13, 0.3, 10, false);
  cage.translate(0, h + 0.15, 0);
  const flame = new THREE.SphereGeometry(0.075, 10, 8);
  flame.scale(1, 1.5, 1);
  flame.translate(0, h + 0.14, 0);
  return [P(weld([body, cage]), 'metal'), P(flame, 'glow', undefined, { light: true, noShadow: true })];
}

/** A single candle, burning. */
export function candle(h = 0.3): Prop {
  const stick = column(0.035, 0.045, h, 10);
  stick.translate(0, h / 2, 0);
  const dish = column(0.1, 0.12, 0.04, 12);
  dish.translate(0, 0.02, 0);
  const flame = new THREE.SphereGeometry(0.04, 8, 6);
  flame.scale(1, 1.9, 1);
  flame.translate(0, h + 0.06, 0);
  return [P(weld([stick, dish]), 'metal'), P(flame, 'glow', undefined, { light: true, noShadow: true })];
}

// -------------------------------------------------------------------- outdoor

export function boulder(seed = 1, size = 1): Prop {
  return [P(rock(seed, { size, rough: 0.26, squash: 0.8 }), 'rock')];
}

export function crag(seed = 1, size = 1.4): Prop {
  return [P(outcrop(seed, 4, 1.1, size), 'rock')];
}

export function bush(seed = 1, size = 0.7): Prop {
  const r = rng(seed);
  const body = blob(seed, size, 5, 0.78);
  body.translate(0, size * 0.6, 0);

  // A fringe of grass round the foot, so the mound sits in the ground rather
  // than on it, and a couple of flower heads pushed through the top.
  const fringe: THREE.BufferGeometry[] = [body];
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + r();
    const g = tuft(size * (0.45 + r() * 0.3), size * 0.11);
    g.rotateY(a);
    g.translate(Math.cos(a) * size * 0.72, 0, Math.sin(a) * size * 0.72);
    fringe.push(g);
  }
  const heads: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 3; i++) {
    const a = r() * Math.PI * 2;
    const d = size * (0.15 + r() * 0.4);
    const g = bloom(size * 0.15);
    g.translate(Math.cos(a) * d, size * (0.95 + r() * 0.2), Math.sin(a) * d);
    heads.push(g);
  }
  return [P(weld(fringe), 'grass'), P(weld(heads), 'accent')];
}

/** A tree: a leaning trunk and a canopy of blobs. */
export function tree(seed = 1, h = 3.4, spread = 1.5): Prop {
  const r = rng(seed);
  const trunk = column(0.11, 0.26, h, 10);
  trunk.translate(0, h / 2, 0);
  const boughs: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 3; i++) {
    const g = column(0.05, 0.09, h * 0.34, 8);
    g.rotateZ((r() - 0.5) * 1.2);
    g.rotateY(r() * Math.PI * 2);
    g.translate(0, h * (0.66 + i * 0.1), 0);
    boughs.push(g);
  }
  const crown = blob(seed * 7, spread, 6, 0.72);
  crown.translate(0, h + spread * 0.2, 0);
  return [P(weld([trunk, ...boughs]), 'timber'), P(crown, 'grass')];
}

/** A bare tree, for the houses that have damp in the walls. */
export function deadTree(seed = 1, h = 3.6): Prop {
  const r = rng(seed);
  const parts: THREE.BufferGeometry[] = [column(0.09, 0.24, h, 10).translate(0, h / 2, 0) as THREE.BufferGeometry];
  for (let i = 0; i < 7; i++) {
    const len = h * (0.2 + r() * 0.28);
    const g = column(0.025, 0.06, len, 6);
    g.rotateZ((r() - 0.5) * 2.0);
    g.rotateX((r() - 0.5) * 1.2);
    g.rotateY(r() * Math.PI * 2);
    g.translate((r() - 0.5) * 0.3, h * (0.5 + r() * 0.5), (r() - 0.5) * 0.3);
    parts.push(g);
  }
  return [P(weld(parts), 'timber')];
}

/** Water, as a disc that sits wherever it is put. */
export function pool(radius = 6): Prop {
  const g = new THREE.CircleGeometry(radius, 44);
  g.rotateX(-Math.PI / 2);
  return [P(g, 'water', undefined, { noShadow: true })];
}

// --------------------------------------------------------------------- people

export type Pose = 'stand' | 'sit' | 'kneel' | 'lie' | 'reach' | 'bow';

/**
 * A person, in six attitudes.
 *
 * Deliberately simplified — a head, a body, two arms and two legs, all soft
 * cylinders. At the scale these are seen a face would be a liability: a
 * featureless figure reads as *anybody*, which is what a parable needs, and a
 * badly-modelled face reads as a badly-modelled face.
 */
export function figure(pose: Pose = 'stand', height = 1.7, seed = 1): Prop {
  const r = rng(seed);
  const s = height / 1.7;
  const body: THREE.BufferGeometry[] = [];
  const skin: THREE.BufferGeometry[] = [];

  const limb = (len: number, thick: number, from: [number, number, number], pitch: number, yaw: number) => {
    const g = column(thick * 0.82, thick, len, 8);
    g.translate(0, -len / 2, 0);
    g.rotateX(pitch);
    g.rotateY(yaw);
    g.translate(from[0], from[1], from[2]);
    return g;
  };

  const shoulder = 1.36 * s;
  const hip = 0.86 * s;
  let headY = 1.62 * s;
  let lean = 0;

  if (pose === 'sit') {
    body.push(
      limb(0.42 * s, 0.1 * s, [-0.14 * s, hip * 0.62, 0], Math.PI / 2, 0),
      limb(0.42 * s, 0.1 * s, [0.14 * s, hip * 0.62, 0], Math.PI / 2, 0),
      limb(0.44 * s, 0.09 * s, [-0.14 * s, hip * 0.62, 0.42 * s], 0, 0),
      limb(0.44 * s, 0.09 * s, [0.14 * s, hip * 0.62, 0.42 * s], 0, 0),
    );
    headY = 1.12 * s;
  } else if (pose === 'kneel') {
    body.push(
      limb(0.44 * s, 0.1 * s, [-0.14 * s, 0.44 * s, 0], Math.PI / 2, 0),
      limb(0.44 * s, 0.1 * s, [0.14 * s, 0.44 * s, 0], Math.PI / 2, 0),
    );
    headY = 1.0 * s;
  } else if (pose === 'lie') {
    body.push(
      limb(0.82 * s, 0.1 * s, [-0.14 * s, 0.14 * s, 0], Math.PI / 2, 0),
      limb(0.82 * s, 0.1 * s, [0.14 * s, 0.14 * s, 0], Math.PI / 2, 0),
    );
    headY = 0.16 * s;
  } else {
    body.push(
      limb(hip, 0.1 * s, [-0.13 * s, hip, 0], 0.04, 0),
      limb(hip, 0.1 * s, [0.13 * s, hip, 0], -0.04, 0),
    );
    if (pose === 'bow') lean = 0.5;
  }

  // Torso. Narrower than it was, and flattened front-to-back.
  //
  // A round column as wide as the shoulders leaves the arms buried in it, and
  // the whole figure reads as one lozenge with a head on top. Taking the width
  // in and squashing the depth is what lets an arm hang clear of the ribs and
  // put a line of shade between the two.
  const torsoLen = pose === 'lie' ? 0.72 * s : (shoulder - hip) + 0.16 * s;
  const torso = column(0.155 * s, 0.125 * s, torsoLen, 12);
  torso.scale(1.18, 1, 0.78);
  if (pose === 'lie') {
    torso.rotateX(Math.PI / 2);
    torso.translate(0, 0.2 * s, -0.3 * s);
  } else {
    torso.translate(0, hip + torsoLen / 2 - 0.02 * s, 0);
    if (lean) {
      torso.rotateX(lean);
      torso.translate(0, -0.1 * s, 0.16 * s);
    }
  }
  body.push(torso);

  // Arms.
  const armPitch = pose === 'reach' ? -1.5 : pose === 'bow' ? 0.8 : 0.12 + r() * 0.16;
  const armY = pose === 'lie' ? 0.22 * s : shoulder - 0.04 * s;
  const armZ = pose === 'lie' ? -0.1 * s : 0.02 * s;
  // Hung outside the ribs and swung out at the shoulder, so there is daylight
  // between arm and body — that gap is the whole silhouette.
  const armOut = 0.245 * s;
  body.push(
    limb(0.6 * s, 0.062 * s, [-armOut, armY, armZ], armPitch, 0.24),
    limb(0.6 * s, 0.062 * s, [armOut, armY, armZ], armPitch, -0.24),
  );
  // Shoulders, so the arms are joined on rather than stuck to the side.
  const yoke = column(0.075 * s, 0.075 * s, 0.5 * s, 10, false);
  yoke.rotateZ(Math.PI / 2);
  yoke.translate(0, shoulder + 0.02 * s, armZ);
  if (pose !== 'lie') body.push(yoke);

  // Head and neck.
  const neck = column(0.048 * s, 0.055 * s, 0.1 * s, 8);
  neck.translate(0, shoulder + 0.02 * s, 0);
  if (pose !== 'lie' && !lean) body.push(neck);

  const head = new THREE.SphereGeometry(0.125 * s, 16, 12);
  head.scale(1, 1.14, 0.92);
  if (pose === 'lie') head.translate(0, headY + 0.1 * s, -0.72 * s);
  else if (lean) head.translate(0, headY - 0.24 * s, 0.34 * s);
  else head.translate(0, headY, 0);
  skin.push(head);

  return [P(weld(body), 'cloth'), P(weld(skin), 'skin')];
}

/** A folded-paper animal, small enough to hold. */
export function origami(seed = 1, size = 0.3): Prop {
  const r = rng(seed);
  const parts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 6; i++) {
    const g = new THREE.TetrahedronGeometry(size * (0.4 + r() * 0.5), 0);
    g.rotateX(r() * 3);
    g.rotateY(r() * 3);
    g.translate((r() - 0.5) * size * 0.9, size * (0.25 + r() * 0.6), (r() - 0.5) * size * 0.9);
    parts.push(g);
  }
  return [P(weld(parts, false), 'paper')];
}

// -------------------------------------------------------------- the catalogue

/**
 * Everything a scene may name, and the arguments it may pass.
 *
 * Keyed rather than free functions so a scene file is data — which is what
 * makes the story graph checkable without a renderer anywhere near it.
 */
export const CATALOGUE = {
  wall, gate, door, window, boards, stair, railing,
  table, chair, stool, bed, crate, shelfOfBooks, book, papers,
  lamp, lantern, candle,
  boulder, crag, bush, tree, deadTree, pool,
  figure, origami,
} as const;

export type PropName = keyof typeof CATALOGUE;
