import { contour, type Pad, type Pt } from './pad';
import { swatches } from './letters';
import { LIPS, SKINS, type Ink } from './palette';

/**
 * Faces.
 *
 * The objects in this study are lathes and the faces are not, so this is a
 * separate grammar — but it keeps the one rule that matters: **the colour is
 * not the thing's colour.** Skin is the only local colour on the page, and even
 * that is a flat unmodulated fill; hair is whichever of the six was going
 * spare, and it is at full strength. A face drawn this way is not a portrait of
 * anybody and does not try to be. It is a face the way a road sign is a person.
 *
 * Three things carry the likeness, and none of them is detail:
 *
 * **The silhouette of the hair.** More than the features, more than the head.
 * Cover the face of any of these and you can still tell them apart; cover the
 * hair and you cannot.
 *
 * **The tilt.** A head that is exactly upright is a passport photograph. Every
 * one of these leans, and the neck leans the other way.
 *
 * **How little is in the middle.** Two marks for eyes, one for a nose, two for
 * a mouth. Every extra mark inside the oval costs expression rather than adding
 * it, which is the opposite of what it feels like while drawing.
 */

export type Cut =
  | 'bob' | 'long' | 'up' | 'curls' | 'crop' | 'wrap' | 'fringe' | 'plait' | 'wave' | 'bun'
  | 'slick' | 'pompadour' | 'sidepart' | 'afro' | 'locs' | 'undercut' | 'veil' | 'turban'
  | 'shaved' | 'topknot';

export const CUTS: Cut[] = ['bob', 'long', 'up', 'curls', 'crop', 'wrap', 'fringe', 'plait',
  'wave', 'bun', 'slick', 'pompadour', 'sidepart', 'afro', 'locs', 'undercut', 'veil',
  'turban', 'shaved', 'topknot'];

export type Extra =
  | 'none' | 'hoops' | 'studs' | 'glasses' | 'hat' | 'collar' | 'scarf' | 'flower'
  | 'shades' | 'jhumka' | 'bindi' | 'nosering' | 'necklace' | 'bowtie' | 'lapels' | 'tiara'
  | 'pallu' | 'chain';

export const EXTRAS: Extra[] = ['none', 'none', 'hoops', 'studs', 'glasses', 'hat', 'collar',
  'scarf', 'flower', 'shades', 'jhumka', 'bindi', 'nosering', 'necklace', 'bowtie', 'lapels',
  'tiara', 'pallu', 'chain'];

/**
 * Facial hair, which is a silhouette problem rather than a texture one.
 *
 * Drawn as a *shape under the jaw* and never as strokes. A beard rendered as
 * hairs is a smudge at this size; a beard rendered as the mass it makes changes
 * the outline of the head, which is the only thing the eye is reading.
 */
export type Beard = 'none' | 'stubble' | 'moustache' | 'goatee' | 'full';

export const BEARDS: Beard[] = ['none', 'none', 'none', 'stubble', 'moustache', 'goatee',
  'full', 'full'];

export interface FaceRecipe {
  cut: Cut;
  extra: Extra;
  beard: Beard;
  skin: string;
  lip: string;
  /**
   * Heavy or soft.
   *
   * One number, not a gender switch. It runs the jaw square, the brow forward
   * and low, the lip thinner and the neck wider, all together — which is what
   * actually varies between faces, and it varies continuously. Every value in
   * between is a face somebody has.
   */
  build: number;
  /** Head proportions. */
  jaw: number;
  crown: number;
  long: number;
  /** Degrees. The head leans and the neck answers it. */
  tilt: number;
  /** −1 looking left, 1 looking right, 0 straight on. */
  turn: number;
  eyes: 'open' | 'shut' | 'wide' | 'side';
  brows: number;
  smile: number;
}

export interface FaceLook {
  inks: Ink[];
  hair: string;
  strip: boolean;
  highlights: number;
  laps: number;
}

/** Head outline, as a closed loop from the crown clockwise. */
function headShape(cx: number, cy: number, w: number, h: number, rec: FaceRecipe): Pt[] {
  const pts: Pt[] = [];
  const n = 22;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    // A head is an egg: wide at the temples, narrow at the jaw, and the widest
    // point is above the middle. A circle reads as a doll at any size.
    const down = Math.sin(a);
    // A heavy build squares the jaw off rather than narrowing it to a point.
    const jaw = rec.jaw + rec.build * 0.16;
    const square = down > 0 ? Math.pow(down, 1 + rec.build * 1.4) : down;
    const taper = down > 0 ? 1 - square * (1 - jaw) : 1 + -down * (rec.crown - 1) * 0.5;
    pts.push([cx + Math.cos(a) * w * taper, cy + down * h * (down > 0 ? rec.long : 1)]);
  }
  const t = (rec.tilt * Math.PI) / 180;
  const c = Math.cos(t);
  const s = Math.sin(t);
  return pts.map(([x, y]) => [
    cx + (x - cx) * c - (y - cy) * s,
    cy + (x - cx) * s + (y - cy) * c,
  ]);
}

export function paintFace(pad: Pad, rec: FaceRecipe, look: FaceLook, box: { cx: number; cy: number;
  w: number; h: number }) {
  const r = pad.r;
  const ink = () => look.inks[Math.floor(r() * look.inks.length) % look.inks.length].hex;
  const { cx, cy, w, h } = box;
  const head = headShape(cx, cy, w, h, rec);
  const t = (rec.tilt * Math.PI) / 180;
  // Everything inside the face is placed in head space and then leaned with it,
  // or the features slide off the front of a tilted head.
  const on = (dx: number, dy: number): Pt => [
    cx + (dx * w) * Math.cos(t) - (dy * h) * Math.sin(t),
    cy + (dx * w) * Math.sin(t) + (dy * h) * Math.cos(t),
  ];

  // Neck, shoulders, head — in that order and each one covering the last.
  // Drawn the other way round there is a white gap under the chin, and a head
  // floating above a shape is not a portrait of anybody.
  const neckTop = on(rec.turn * 0.16, 0.7);
  const neckY = cy + h * 1.66;
  pad.shape([
    [neckTop[0] - w * 0.44, neckTop[1]], [cx + rec.turn * w * 0.1 - w * 0.4, neckY],
    [cx + rec.turn * w * 0.1 + w * 0.4, neckY], [neckTop[0] + w * 0.44, neckTop[1]],
  ], rec.skin, { alpha: 1, sharp: true });

  // Narrow, with a real corner at the shoulder. Wide and rounded it came out
  // as a dome with a head on it, which is the shape of a chess piece.
  const drop = Math.max(cy + h * 3.4, 1.04);
  const shoulders: Pt[] = [
    [cx - w * 2.05, drop], [cx - w * 1.92, cy + h * 2.05], [cx - w * 0.58, cy + h * 1.55],
    [cx + w * 0.58, cy + h * 1.55], [cx + w * 1.92, cy + h * 2.05], [cx + w * 2.05, drop],
  ];
  const shirt = look.inks[1] ?? look.inks[0];
  pad.shape(shoulders, shirt.hex, { alpha: 0.94, sharp: true });
  contour(pad, shoulders, look.inks.map((i) => i.hex),
    { laps: 1, arc: 0.22, gap: 0.7, offset: 0.01, width: 0.01 });

  // Hair behind. The mass that carries the likeness.
  hairBehind(pad, rec, look, on, w, h);

  // The face itself: one flat fill, no modelling anywhere.
  pad.shape(head, rec.skin, { alpha: 1 });

  // Features.
  const eyeY = 0.06;
  const eyeX = 0.44;
  const lid = rec.eyes;
  for (const side of [-1, 1]) {
    const e = on(side * eyeX + rec.turn * 0.14, eyeY);
    const wide = w * (lid === 'wide' ? 0.2 : 0.17) * (rec.turn * side > 0 ? 0.8 : 1);
    if (lid === 'shut') {
      pad.line([[e[0] - wide, e[1]], [e[0], e[1] + h * 0.03], [e[0] + wide, e[1]]], '#1d1d24',
        { width: 0.011, wobble: 0.002 });
    } else {
      pad.blob(e, wide * 0.9, h * (lid === 'wide' ? 0.075 : 0.055), t, '#ffffff', { alpha: 1 });
      const look2 = lid === 'side' ? side * wide * 0.35 : 0;
      pad.blob([e[0] + look2, e[1]], wide * 0.42, h * 0.045, t, '#1d1d24', { alpha: 1 });
      pad.line([[e[0] - wide, e[1] - h * 0.02], [e[0], e[1] - h * 0.035],
        [e[0] + wide, e[1] - h * 0.018]], '#1d1d24', { width: 0.008, wobble: 0.002 });
    }
    // A heavy brow sits lower and thicker, and it is doing more work than the
    // eye under it: brow height is most of what reads as an expression.
    const b = on(side * eyeX + rec.turn * 0.14,
      eyeY - 0.19 - rec.brows * 0.06 + rec.build * 0.06);
    pad.line([[b[0] - wide * 1.1, b[1] + h * 0.02], [b[0], b[1] - h * 0.01],
      [b[0] + wide * 1.05, b[1] + h * 0.03]], look.hair,
      { width: 0.011 + rec.build * 0.008, wobble: 0.003 });
  }

  // The nose is one stroke and it is the side of the nose, not the front.
  const n0 = on(rec.turn * 0.3 + 0.05, 0.1);
  const n1 = on(rec.turn * 0.3 + 0.02, 0.42);
  pad.line([n0, [n1[0] + w * 0.1, n1[1]], [n1[0] - w * 0.06, n1[1] + h * 0.02]], ink(),
    { width: 0.009, wobble: 0.003 });

  beardMass(pad, rec, on, w, h, t, look);

  // Mouth: one blob for the colour and one line for the join.
  const m = on(rec.turn * 0.24, 0.62);
  pad.blob([m[0], m[1] + h * 0.02], w * (0.3 - rec.build * 0.06),
    h * (0.06 + rec.smile * 0.03) * (1 - rec.build * 0.35), t, rec.lip, { alpha: 0.95 });
  pad.line([[m[0] - w * 0.32, m[1] - h * rec.smile * 0.04], [m[0], m[1] + h * 0.02],
    [m[0] + w * 0.32, m[1] - h * rec.smile * 0.04]], '#7a2f38', { width: 0.008, wobble: 0.002 });

  // A cheek, flat, as one soft mark.
  pad.blob(on(-rec.turn * 0.2 - 0.5, 0.34), w * 0.3, h * 0.14, t, rec.lip,
    { alpha: 0.2, under: true });

  if (rec.beard === 'moustache' || rec.beard === 'full') {
    const mo = on(rec.turn * 0.24, 0.5);
    pad.line([[mo[0] - w * 0.4, mo[1]], [mo[0], mo[1] + h * 0.05], [mo[0] + w * 0.4, mo[1]]],
      look.hair, { width: 0.02 + rec.build * 0.008, wobble: 0.002 });
  }

  hairFront(pad, rec, look, on, w, h);
  extras(pad, rec, on, w, h, t, ink);

  // The six, round the head and the hair, off-register as everywhere else.
  contour(pad, head, look.inks.map((i) => i.hex),
    { laps: look.laps, arc: 0.12, gap: 0.6, offset: 0.012, width: 0.011 });

  for (let i = 0; i < look.highlights; i++) {
    const q = on((r() - 0.5) * 1.6, (r() - 0.5) * 1.2);
    pad.line([[q[0], q[1]], [q[0] + (r() - 0.5) * 0.02, q[1] + h * (0.06 + r() * 0.14)]],
      '#ffffff', { width: 0.012 + r() * 0.01 });
  }

  if (look.strip) swatches(pad, look.inks.map((i) => i.hex), [0.87, 0.2], 0.017);
}

/**
 * A beard, as the shape it makes.
 *
 * Under the skin fill would hide it and over the mouth would smother it, so it
 * goes between: the mass sits along the jaw and the moustache is added after
 * the lips. Stubble is the same shape at a quarter of the opacity, which is
 * exactly what stubble is.
 */
function beardMass(pad: Pad, rec: FaceRecipe, on: (dx: number, dy: number) => Pt,
  w: number, h: number, t: number, look: FaceLook) {
  if (rec.beard === 'none' || rec.beard === 'moustache') return;
  const c = look.hair;
  if (rec.beard === 'goatee') {
    pad.blob(on(rec.turn * 0.2, 0.78), w * 0.34, h * 0.24, t, c, { alpha: 0.95 });
    return;
  }
  const alpha = rec.beard === 'stubble' ? 0.3 : 1;
  pad.shape([
    on(-1.0, 0.16), on(-0.96, 0.62), on(-0.6, 1.02), on(0, 1.14), on(0.6, 1.02),
    on(0.96, 0.62), on(1.0, 0.16), on(0.62, 0.42), on(0, 0.5), on(-0.62, 0.42),
  ], c, { alpha });
}

/**
 * The hair, behind.
 *
 * Shapes, not a stack of ellipses. The first pass built every cut out of
 * overlapping ovals and they all came out as the same helmet with a different
 * outline — because an ellipse has no *corners*, and the whole difference
 * between a bob and long hair is where the corners are: a bob has two at the
 * jaw, long hair has none until well below the shoulder. Ovals survive only for
 * curls, where being a pile of ovals is the correct answer.
 */
function hairBehind(pad: Pad, rec: FaceRecipe, look: FaceLook,
  on: (dx: number, dy: number) => Pt, w: number, h: number) {
  const r = pad.r;
  const c = look.hair;
  const crown = (spread: number, lift: number): Pt[] => [
    on(-spread, 0.2), on(-spread * 0.92, -0.8), on(-0.5, -lift), on(0.4, -lift),
    on(spread * 0.92, -0.8), on(spread, 0.2),
  ];

  switch (rec.cut) {
    case 'long':
    case 'wave': {
      pad.shape([...crown(1.5, 1.34), on(1.42, 1.5), on(0.7, 1.2), on(0, 1.05),
        on(-0.7, 1.2), on(-1.42, 1.5)], c, { alpha: 1 });
      if (rec.cut === 'wave') {
        for (let i = 0; i < 6; i++) {
          const s = i % 2 ? 1 : -1;
          const q = on(s * (1.0 + r() * 0.35), 0.3 + r() * 0.9);
          pad.line([[q[0], q[1] - h * 0.35], [q[0] + s * w * 0.3, q[1]],
            [q[0], q[1] + h * 0.35]], c, { width: 0.018, wobble: 0.005 });
        }
      }
      break;
    }
    case 'bob':
      pad.shape([...crown(1.46, 1.26), on(1.4, 0.8), on(0.95, 0.92), on(0, 0.74),
        on(-0.95, 0.92), on(-1.4, 0.8)], c, { alpha: 1 });
      break;
    case 'curls':
      for (let i = 0; i < 18; i++) {
        const a = r() * Math.PI * 2;
        pad.blob(on(Math.cos(a) * 1.18, -0.25 + Math.sin(a) * 1.0),
          w * (0.4 + r() * 0.2), h * (0.38 + r() * 0.2), r() * 3, c, { alpha: 1 });
      }
      break;
    case 'up':
    case 'bun': {
      pad.shape(crown(1.3, 1.2), c, { alpha: 1 });
      const side = rec.turn > 0 ? -1 : 1;
      pad.blob(on(side * 0.95, -1.1), w * 0.46, h * 0.42, 0, c, { alpha: 1 });
      break;
    }
    case 'plait': {
      pad.shape([...crown(1.38, 1.24), on(1.18, 0.5), on(0, 0.6), on(-1.18, 0.5)], c,
        { alpha: 1 });
      const side = rec.turn > 0 ? -1 : 1;
      for (let i = 0; i < 6; i++) {
        const k = 1 - i * 0.13;
        pad.blob(on(side * (1.0 + i * 0.04), 0.55 + i * 0.32), w * 0.3 * k, h * 0.19 * k,
          0, c, { alpha: 1 });
      }
      break;
    }
    case 'crop':
    case 'fringe':
      pad.shape(crown(1.24, 1.14), c, { alpha: 1 });
      break;
    case 'wrap':
      pad.shape(crown(1.38, 1.12), c, { alpha: 1 });
      break;

    // ---------------------------------------------------------------- added
    case 'slick':
    case 'sidepart':
      pad.shape(crown(1.1, 1.08), c, { alpha: 1 });
      break;
    case 'undercut':
      // Shaved at the sides, mass on top: two shapes and the gap between them
      // is the haircut.
      pad.shape([on(-0.9, -0.55), on(-0.8, -1.2), on(0, -1.34), on(0.8, -1.2), on(0.9, -0.55)],
        c, { alpha: 1 });
      break;
    case 'pompadour':
      pad.shape([on(-1.05, -0.5), on(-1.0, -1.15), on(-0.3, -1.62), on(0.5, -1.5),
        on(1.02, -1.05), on(1.06, -0.5)], c, { alpha: 1 });
      break;
    case 'afro':
      for (let i = 0; i < 22; i++) {
        const a = r() * Math.PI * 2;
        const rad = 0.55 + r() * 0.95;
        pad.blob(on(Math.cos(a) * rad * 1.5, -0.3 + Math.sin(a) * rad * 1.25),
          w * (0.44 + r() * 0.22), h * (0.42 + r() * 0.2), r() * 3, c, { alpha: 1 });
      }
      break;
    case 'locs': {
      pad.shape([...crown(1.26, 1.2), on(1.2, 0.6), on(0, 0.66), on(-1.2, 0.6)], c,
        { alpha: 1 });
      for (let i = 0; i < 9; i++) {
        const side = i % 2 ? 1 : -1;
        const x = side * (0.85 + (i % 3) * 0.16);
        pad.line([on(x, 0.2), on(x + side * 0.1, 0.9), on(x, 1.6 + (i % 4) * 0.15)], c,
          { width: 0.017, wobble: 0.004 });
      }
      break;
    }
    case 'veil':
      // Drapes past the shoulders, and that length is the whole silhouette.
      pad.shape([on(-1.55, -0.3), on(-1.2, -1.15), on(0, -1.4), on(1.2, -1.15), on(1.55, -0.3),
        on(1.7, 1.9), on(0.8, 1.6), on(0, 1.7), on(-0.8, 1.6), on(-1.7, 1.9)], c,
        { alpha: 1 });
      break;
    case 'turban':
      pad.shape([on(-1.2, -0.5), on(-1.15, -1.3), on(0, -1.75), on(1.15, -1.3), on(1.2, -0.5)],
        c, { alpha: 1 });
      break;
    case 'topknot':
      pad.shape(crown(1.14, 1.1), c, { alpha: 1 });
      pad.blob(on(0.1, -1.4), w * 0.4, h * 0.34, 0, c, { alpha: 1 });
      break;
    case 'shaved':
      // Nothing. A shaved head is the head, and pretending otherwise puts a
      // grey cap on it.
      break;
  }
}

function hairFront(pad: Pad, rec: FaceRecipe, look: FaceLook,
  on: (dx: number, dy: number) => Pt, w: number, h: number) {
  const r = pad.r;
  const c = look.hair;
  if (rec.cut === 'wrap') {
    // A headwrap is two shapes and a knot, and it is the strongest silhouette
    // in the set for exactly that reason.
    pad.shape([on(-1.1, -0.42), on(-0.9, -1.05), on(0, -1.25), on(0.9, -1.05), on(1.1, -0.42),
      on(0, -0.55)], c, { alpha: 1 });
    pad.blob(on(0.95, -0.95), w * 0.34, h * 0.3, 0.4, c, { alpha: 1 });
    return;
  }
  if (rec.cut === 'shaved') return;
  if (rec.cut === 'turban') {
    // The wrap, and the one fold across it that says it was wound rather than
    // put on.
    pad.shape([on(-1.2, -0.52), on(-1.14, -1.3), on(0, -1.72), on(1.14, -1.3), on(1.2, -0.52),
      on(0, -0.66)], c, { alpha: 1 });
    pad.line([on(-1.1, -0.95), on(0, -1.3), on(1.05, -0.8)], c, { width: 0.016, wobble: 0.004 });
    return;
  }
  if (rec.cut === 'veil') {
    pad.shape([on(-1.5, -0.34), on(-1.16, -1.16), on(0, -1.38), on(1.16, -1.16), on(1.5, -0.34),
      on(0.7, -0.78), on(0, -0.86), on(-0.7, -0.78)], c, { alpha: 1 });
    return;
  }
  if (rec.cut === 'afro' || rec.cut === 'locs') {
    pad.shape([on(-1.05, -0.55), on(-0.8, -1.1), on(0.2, -1.2), on(1.0, -0.95), on(1.0, -0.5),
      on(0.2, -0.72), on(-0.5, -0.6)], c, { alpha: 1 });
    return;
  }
  if (rec.cut === 'slick' || rec.cut === 'pompadour' || rec.cut === 'undercut') {
    // Swept up and back off the forehead, so the front edge is a *diagonal*.
    // A horizontal front edge is a fringe whatever is behind it.
    pad.shape([on(-1.0, -0.52), on(-0.95, -1.1),
      on(0.1, rec.cut === 'pompadour' ? -1.62 : -1.32), on(0.95, -1.05), on(1.0, -0.46),
      on(0.4, -0.66), on(-0.6, -0.4)], c, { alpha: 1 });
    return;
  }
  const fringe = rec.cut === 'fringe' || rec.cut === 'bob' || rec.cut === 'up'
    || rec.cut === 'bun' || rec.cut === 'plait' || rec.cut === 'topknot';
  if (fringe) {
    pad.shape([on(-1.05, -0.5), on(-0.8, -1.12), on(0.2, -1.28), on(1.02, -0.95),
      on(1.05, -0.45), on(0.3, -0.62), on(-0.4, -0.5)], c, { alpha: 1 });
  } else {
    pad.shape([on(-1.05, -0.55), on(-0.7, -1.15), on(0.4, -1.25), on(1.05, -0.8),
      on(0.85, -0.35), on(0.4, -0.78), on(-0.5, -0.72)], c, { alpha: 1 });
  }
  for (let i = 0; i < 4; i++) {
    const q = on(-0.9 + r() * 1.8, -1.0 + r() * 0.4);
    pad.line([[q[0], q[1]], [q[0] + (r() - 0.5) * w * 0.6, q[1] + h * 0.3]], c,
      { width: 0.012, wobble: 0.004 });
  }
}

function extras(pad: Pad, rec: FaceRecipe, on: (dx: number, dy: number) => Pt,
  w: number, h: number, t: number, ink: () => string) {
  const r = pad.r;
  switch (rec.extra) {
    case 'hoops':
      for (const side of [-1, 1]) {
        const e = on(side * 1.02, 0.44);
        pad.line([[e[0], e[1]], [e[0] + side * w * 0.22, e[1] + h * 0.16],
          [e[0], e[1] + h * 0.3], [e[0] - side * w * 0.18, e[1] + h * 0.16], [e[0], e[1]]],
          ink(), { width: 0.011 });
      }
      break;
    case 'studs':
      for (const side of [-1, 1]) {
        pad.blob(on(side * 1.0, 0.42), w * 0.11, h * 0.05, t, ink(), { alpha: 1 });
      }
      break;
    case 'glasses': {
      const c = ink();
      for (const side of [-1, 1]) {
        const e = on(side * 0.46 + rec.turn * 0.14, 0.06);
        pad.line([[e[0] - w * 0.32, e[1] - h * 0.09], [e[0] + w * 0.32, e[1] - h * 0.09],
          [e[0] + w * 0.34, e[1] + h * 0.1], [e[0] - w * 0.3, e[1] + h * 0.1],
          [e[0] - w * 0.32, e[1] - h * 0.09]], c, { width: 0.01, wobble: 0.002 });
      }
      const b = on(rec.turn * 0.14, 0.02);
      pad.line([[b[0] - w * 0.14, b[1]], [b[0] + w * 0.14, b[1]]], c, { width: 0.009 });
      break;
    }
    case 'hat': {
      // A crown and a brim, not one wide slab round the head — which is what
      // the first version was, and it read as a letterbox.
      const c = ink();
      pad.shape([on(-0.95, -1.0), on(-0.82, -1.7), on(0, -1.92), on(0.82, -1.7),
        on(0.95, -1.0)], c, { alpha: 1 });
      pad.blob(on(0, -1.0), w * 1.85, h * 0.2, t, c, { alpha: 1 });
      break;
    }
    case 'collar': {
      const c = ink();
      const q = on(rec.turn * 0.1, 1.25);
      pad.line([[q[0] - w * 0.8, q[1]], [q[0], q[1] + h * 0.25], [q[0] + w * 0.8, q[1]]], c,
        { width: 0.016, wobble: 0.003 });
      break;
    }
    case 'scarf': {
      const c = ink();
      const q = on(0, 1.12);
      pad.line([[q[0] - w * 1.1, q[1]], [q[0], q[1] + h * 0.18], [q[0] + w * 1.1, q[1] - h * 0.05]],
        c, { width: 0.05, wobble: 0.004 });
      break;
    }
    case 'flower': {
      const c = ink();
      const q = on(rec.turn > 0 ? -1.0 : 1.0, -0.85);
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 + r();
        pad.blob([q[0] + Math.cos(a) * w * 0.22, q[1] + Math.sin(a) * h * 0.16], w * 0.16,
          h * 0.08, a, c, { alpha: 1 });
      }
      break;
    }
    // -------------------------------------------------------------- added
    case 'shades': {
      // Wide, dark and flat. The one accessory that removes information from
      // a face and makes it read as *more* of a person, not less.
      const c = ink();
      for (const side of [-1, 1]) {
        const e = on(side * 0.5 + rec.turn * 0.14, 0.04);
        pad.shape([[e[0] - w * 0.44, e[1] - h * 0.14], [e[0] + w * 0.42, e[1] - h * 0.16],
          [e[0] + w * 0.4, e[1] + h * 0.14], [e[0] - w * 0.4, e[1] + h * 0.16]], c,
          { alpha: 0.95, sharp: true });
      }
      const b = on(rec.turn * 0.14, 0.0);
      pad.line([[b[0] - w * 0.14, b[1]], [b[0] + w * 0.14, b[1]]], c, { width: 0.014 });
      break;
    }
    case 'jhumka':
      for (const side of [-1, 1]) {
        const e = on(side * 1.0, 0.42);
        const c = ink();
        pad.line([[e[0], e[1]], [e[0], e[1] + h * 0.16]], c, { width: 0.008 });
        pad.blob([e[0], e[1] + h * 0.28], w * 0.24, h * 0.14, 0, c, { alpha: 1 });
        for (let i = -2; i <= 2; i++) {
          pad.blob([e[0] + i * w * 0.11, e[1] + h * 0.4], w * 0.05, h * 0.035, 0, c,
            { alpha: 1 });
        }
      }
      break;
    case 'bindi':
      pad.blob(on(rec.turn * 0.16, -0.42), w * 0.1, h * 0.05, t, ink(), { alpha: 1 });
      break;
    case 'nosering': {
      const c = ink();
      const q = on(rec.turn * 0.3 + 0.14, 0.42);
      pad.line([[q[0], q[1]], [q[0] + w * 0.16, q[1] + h * 0.05], [q[0] + w * 0.1, q[1] - h * 0.05],
        [q[0], q[1]]], c, { width: 0.008 });
      pad.line([[q[0] + w * 0.14, q[1]], [q[0] + w * 0.7, q[1] - h * 0.2],
        [q[0] + w * 1.05, q[1] + h * 0.05]], c, { width: 0.006 });
      break;
    }
    case 'necklace':
    case 'chain': {
      const c = ink();
      const q = on(rec.turn * 0.1, 1.5);
      pad.line([[q[0] - w * 0.6, q[1] - h * 0.1], [q[0], q[1] + h * 0.22],
        [q[0] + w * 0.6, q[1] - h * 0.1]], c, { width: rec.extra === 'chain' ? 0.008 : 0.014 });
      if (rec.extra === 'necklace') {
        pad.blob([q[0], q[1] + h * 0.3], w * 0.14, h * 0.09, 0, c, { alpha: 1 });
      }
      break;
    }
    case 'bowtie': {
      const c = ink();
      const q = on(rec.turn * 0.1, 1.72);
      pad.shape([[q[0] - w * 0.5, q[1] - h * 0.14], [q[0] - w * 0.08, q[1]],
        [q[0] - w * 0.5, q[1] + h * 0.14]], c, { alpha: 1, sharp: true });
      pad.shape([[q[0] + w * 0.5, q[1] - h * 0.14], [q[0] + w * 0.08, q[1]],
        [q[0] + w * 0.5, q[1] + h * 0.14]], c, { alpha: 1, sharp: true });
      break;
    }
    case 'lapels': {
      // Two triangles and a V of skin. Black tie is a silhouette, which is why
      // it survives being drawn in six colours none of which is black.
      const c = ink();
      const q = on(rec.turn * 0.1, 1.6);
      pad.shape([[q[0] - w * 0.26, q[1] - h * 0.2], [q[0] - w * 1.5, q[1] + h * 1.5],
        [q[0] - w * 0.7, q[1] + h * 1.6]], c, { alpha: 1, sharp: true });
      pad.shape([[q[0] + w * 0.26, q[1] - h * 0.2], [q[0] + w * 1.5, q[1] + h * 1.5],
        [q[0] + w * 0.7, q[1] + h * 1.6]], c, { alpha: 1, sharp: true });
      break;
    }
    case 'tiara': {
      const c = ink();
      const q = on(0, -1.12);
      for (let i = -2; i <= 2; i++) {
        pad.line([[q[0] + i * w * 0.34, q[1] + h * 0.12],
          [q[0] + i * w * 0.34, q[1] - h * (0.12 + (2 - Math.abs(i)) * 0.06)]], c,
          { width: 0.012 });
      }
      pad.line([[q[0] - w * 0.8, q[1] + h * 0.14], [q[0], q[1] + h * 0.04],
        [q[0] + w * 0.8, q[1] + h * 0.14]], c, { width: 0.012 });
      break;
    }
    case 'pallu': {
      // A length of cloth over one shoulder and the crown. One shape, and it
      // reframes the whole head.
      const c = ink();
      const side = rec.turn > 0 ? -1 : 1;
      pad.shape([on(side * 1.35, -0.5), on(side * 1.05, -1.25), on(0, -1.45),
        on(-side * 0.9, -1.15), on(-side * 1.0, -0.6), on(-side * 0.4, -0.9), on(0, -1.0),
        on(side * 0.7, -0.85)], c, { alpha: 1 });
      pad.line([on(side * 1.35, -0.5), on(side * 1.8, 0.9), on(side * 2.1, 2.2)], c,
        { width: 0.05, wobble: 0.006 });
      break;
    }
    default:
      break;
  }
}

export { SKINS, LIPS };
