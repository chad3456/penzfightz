import {
  HB, hatch, mark, noise, paper, pencil, rng, smooth, type Pencil, type Pt,
} from './graphite';
import type { Face } from './expressions';
import type { Character } from './characters';

/**
 * One anime face, built the way one is actually drawn.
 *
 * Construction first, features second, and the construction is left showing.
 * A sketch is a record of the order it was made in — the ball of the cranium,
 * the centre line, the eye line, then the jaw hung off them — and a drawing
 * that hides that scaffolding reads as a finished illustration instead. Nearly
 * all of the "is this a pencil sketch?" signal lives in those four faint arcs.
 *
 * The proportions are the idiom's, not life's: the eyes sit below the middle of
 * the head and are enormous, the nose is barely stated, the jaw runs to a point.
 * The one rule worth naming is that **the eye is the expression**. The mouth
 * gets read second and contradicts it happily — a smiling mouth under flat eyes
 * is the whole of `Sinister calm`.
 */

export const ASPECT = 0.88;

interface Rig {
  cx: number;
  cy: number;
  /** Radius of the cranium ball. */
  R: number;
  /**
   * The chin, as a y on the canvas.
   *
   * It was a *length* below centre, and three of the five places that read it
   * treated it as a position. `eyeY + (chin - eyeY) * 0.56` then evaluated to a
   * point above the eyes, so the mouth and the nose were drawn on the bridge of
   * the nose — which is what the small hatched disc between the eyes was.
   */
  chinY: number;
  eyeY: number;
  eyeDx: number;
  eyeW: number;
  eyeH: number;
  tilt: number;
  c: Character;
}

const ellipse = (cx: number, cy: number, rx: number, ry: number, from = 0, to = Math.PI * 2, n = 40): Pt[] =>
  Array.from({ length: n + 1 }, (_, i) => {
    const a = from + ((to - from) * i) / n;
    return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry] as Pt;
  });

/**
 * The head outline: a ball for the cranium, then cheek and jaw to a point.
 *
 * The angles here are the whole of it, and getting them wrong is not subtle.
 * Canvas runs +y downward, so `sin` is positive *below* centre and the arc that
 * looks like "over the top of the head" in ordinary maths is the one under the
 * chin. Sweeping from 0 through π traced the bottom of the skull and then hung
 * a jaw off it, which drew a large V straight across the face. Over the top is
 * π to 2π.
 */
function skull(r: Rig): Pt[] {
  const { cx, cy, R, chinY, c } = r;
  const temple = cy - R * 0.08;
  // A high jaw number pulls the cheek in and runs the line straight to a
  // narrow chin; a low one keeps the cheek wide and rounds the corner. That
  // single control is most of the difference between the two heads.
  const cheek = c.cheek;
  // How much narrower than the cheekbone the jaw is, at two points on the way
  // down. These are fractions *of the cheek*, and they have to stay under one:
  // scaling them up instead made the jaw wider than the cheekbone it hangs
  // from, which drew a box with a flat bottom rather than a chin.
  const atJaw = cheek * (0.78 - c.jaw * 0.18);
  const atChin = cheek * (0.30 - c.jaw * 0.11);

  // Cranium: left temple, over the crown, to the right temple.
  const dome: Pt[] = Array.from({ length: 29 }, (_, i) => {
    const a = Math.PI + (Math.PI * i) / 28;
    return [cx + Math.cos(a) * R, cy + Math.sin(a) * R * 1.02] as Pt;
  });

  // Cheek and jaw, right side down to the chin and back up the left. The
  // cheekbone sits wide and high and the jaw runs almost straight to a narrow
  // chin: that line is the idiom, and softening it gives a rounder, younger
  // head than the style wants.
  const jaw = smooth([
    [cx + R * (cheek + 0.05), temple],
    [cx + R * cheek, cy + R * 0.46],
    [cx + R * atJaw, cy + (chinY - cy) * 0.66],
    [cx + R * atChin, cy + (chinY - cy) * 0.95],
    [cx, chinY],
    [cx - R * atChin, cy + (chinY - cy) * 0.95],
    [cx - R * atJaw, cy + (chinY - cy) * 0.66],
    [cx - R * cheek, cy + R * 0.46],
    [cx - R * (cheek + 0.05), temple],
  ], 9);

  return [...dome, ...jaw];
}

/** The scaffolding, drawn first and never rubbed out. */
function construction(g: CanvasRenderingContext2D, r: Rig, p: Pencil, seed: number) {
  const faint = pencil(p, { press: 0.16, passes: 1, size: 1.1, grade: 0.35, wobble: 1.4 });
  mark(g, ellipse(r.cx, r.cy, r.R, r.R * 0.98), faint, seed + 1, { flat: true });
  // Centre line and eye line, which is where the face is actually measured from.
  mark(g, [[r.cx, r.cy - r.R * 1.1], [r.cx, r.chinY + r.R * 0.06]], faint, seed + 2, { flat: true });
  mark(g, [[r.cx - r.R * 1.12, r.eyeY], [r.cx + r.R * 1.12, r.eyeY]], faint, seed + 3, { flat: true });
  mark(
    g,
    [[r.cx - r.R * 0.7, r.eyeY + (r.chinY - r.eyeY) * 0.5], [r.cx + r.R * 0.7, r.eyeY + (r.chinY - r.eyeY) * 0.5]],
    pencil(faint, { press: 0.1 }), seed + 4, { flat: true },
  );
}

/**
 * One eye.
 *
 * The lash line is the heaviest mark anywhere on the face — in this idiom it is
 * a thick wedge, not a line, and thickening it is most of what makes a drawing
 * look "anime" rather than "cartoon". Everything else about the eye is light.
 */
function eye(
  g: CanvasRenderingContext2D, r: Rig, f: Face, side: 1 | -1, p: Pencil, seed: number,
) {
  const cx = r.cx + side * r.eyeDx;
  const cy = r.eyeY;
  const w = r.eyeW;
  const open = Math.max(0.06, f.lid);
  const h = r.eyeH * open;
  const lashP = pencil(p, {
    press: 0.95 * r.c.lash, size: 2.3 * r.c.lash, passes: 3, grade: 0.85, wobble: 0.5,
  });

  // --- the shapes that are not an open eye at all
  if (f.eye === 'arc-up' || (f.eye === 'arc-down' && open < 0.3) || f.eye === 'line') {
    const dir = f.eye === 'arc-down' ? 1 : f.eye === 'line' ? 0 : -1;
    const arc: Pt[] = Array.from({ length: 13 }, (_, i) => {
      const t = i / 12;
      return [cx - w * 0.5 + w * t, cy + Math.sin(Math.PI * t) * r.eyeH * 0.34 * dir] as Pt;
    });
    mark(g, arc, lashP, seed, { weight: 1.05 });
    if (f.eye === 'arc-up') {
      // A crease above a laughing eye, which is what stops it reading as a brow.
      mark(g, arc.map(([x, y]) => [x * 1 + (x - cx) * 0.06, y - r.eyeH * 0.42] as Pt),
        pencil(p, { press: 0.3, passes: 1 }), seed + 9);
    }
    return;
  }
  if (f.eye === 'x' || f.eye === 'swirl') {
    if (f.eye === 'x') {
      const a = w * 0.42;
      mark(g, [[cx - a, cy - a], [cx + a, cy + a]], lashP, seed + 1);
      mark(g, [[cx + a, cy - a], [cx - a, cy + a]], lashP, seed + 2);
    } else {
      const sp: Pt[] = [];
      for (let i = 0; i <= 44; i++) {
        const t = i / 44;
        const a = t * Math.PI * 4.2;
        const rad = w * 0.46 * (1 - t * 0.86);
        sp.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad * 0.95]);
      }
      mark(g, sp, pencil(p, { press: 0.6, passes: 2, size: 1.7 }), seed + 3, { flat: true });
    }
    return;
  }

  // --- an open eye
  const wide = f.eye === 'wide' ? 1.12 : f.eye === 'half' ? 0.95 : 1;
  // `sharp` moves the peak of the lash line towards the outer corner and
  // flattens the inner half. A round eye peaks in the middle; a sharp one is
  // almost a straight run that lifts late, which is what reads as a hard look
  // before any brow has been drawn.
  const sharp = r.c.sharp;
  const peak = 0.5 + side * sharp * 0.22;
  const top: Pt[] = Array.from({ length: 15 }, (_, i) => {
    const t = i / 14;
    const d = Math.abs(t - peak) / Math.max(peak, 1 - peak);
    const lift = Math.cos(Math.min(1, d) * Math.PI * 0.5) ** (0.7 + sharp * 0.9);
    return [cx - w * 0.5 + w * t, cy - h * 0.82 * lift] as Pt;
  });
  // The lash line thickens toward the outer corner by being drawn again, short.
  mark(g, top, lashP, seed, { weight: 1.1 * wide, flat: true });
  mark(g, top.slice(side === 1 ? 7 : 0, side === 1 ? 15 : 8),
    pencil(lashP, { size: 3.1, press: 1 }), seed + 21, { flat: true });

  const squish = 1 - f.squint * 0.62;
  const bottom: Pt[] = Array.from({ length: 13 }, (_, i) => {
    const t = i / 12;
    return [cx - w * 0.46 + w * 0.92 * t, cy + h * 0.5 * squish * Math.sin(Math.PI * t) ** 0.8] as Pt;
  });
  mark(g, bottom, pencil(p, { press: 0.34, passes: 1, size: 1.3 }), seed + 4);

  // --- iris and pupil
  if (f.eye === 'dot') {
    const rr = w * 0.09 * f.pupil;
    g.globalAlpha = 0.9;
    g.beginPath();
    g.arc(cx, cy, Math.max(0.8, rr), 0, Math.PI * 2);
    g.fill();
    g.globalAlpha = 1;
    return;
  }
  const irisR = w * 0.3 * (f.eye === 'half' ? 0.95 : 1);
  const ix = cx + f.gazeX * w * 0.14;
  const iy = cy + f.gazeY * h * 0.2 + h * 0.05;
  const lidCut = cy - h * 0.72;

  g.save();
  // The upper lid crops the iris. Without this the eye reads as a staring
  // sphere, which is the difference between "alert" and "unhinged".
  g.beginPath();
  g.rect(cx - w, lidCut, w * 2, h * 3);
  g.clip();

  mark(g, ellipse(ix, iy, irisR, irisR * 1.08), pencil(p, { press: 0.42, passes: 2, size: 1.2 }), seed + 5, { flat: true });
  // Iris shading: dark at the top under the lid, open at the bottom.
  hatch(g, ellipse(ix, iy, irisR * 0.98, irisR * 1.06), pencil(p, { press: 0.5, size: 1.1 }), seed + 6, Math.PI / 2, 1.5, 0.75);
  const pupR = irisR * 0.44 * f.pupil;
  g.globalAlpha = 0.86;
  g.beginPath();
  g.arc(ix, iy, Math.max(0.7, pupR), 0, Math.PI * 2);
  g.fill();
  g.globalAlpha = 1;

  // The highlight is left as bare paper, the way a pencil drawing must do it.
  g.globalCompositeOperation = 'destination-out';
  g.globalAlpha = 1;
  g.beginPath();
  g.arc(ix - irisR * 0.34, iy - irisR * 0.4, irisR * 0.3, 0, Math.PI * 2);
  g.fill();
  g.beginPath();
  g.arc(ix + irisR * 0.3, iy + irisR * 0.34, irisR * 0.16, 0, Math.PI * 2);
  g.fill();
  g.globalCompositeOperation = 'source-over';
  g.restore();
}

function brow(g: CanvasRenderingContext2D, r: Rig, f: Face, side: 1 | -1, p: Pencil, seed: number) {
  const inner = r.cx + side * r.eyeDx * 0.42;
  const outer = r.cx + side * r.eyeDx * 1.42;
  const base = r.eyeY - r.eyeH * r.c.browY;
  // Sceptical raises one brow only; the asymmetry is the expression.
  const lift = f.name === 'Sceptical' && side === 1 ? 1.9 : 1;
  const yi = base - f.browInner * r.eyeH * 0.62 * lift;
  const yo = base - f.browOuter * r.eyeH * 0.5 * lift;
  const mid: Pt = [(inner + outer) / 2, (yi + yo) / 2 - r.eyeH * 0.2];
  const path = smooth([[inner, yi], mid, [outer, yo]], 7);
  // Heavier than seems right on paper. The brow is often the only feature not
  // under the fringe, and on a closed-eye expression it is carrying the whole
  // reading on its own.
  const heft = (f.browWeight ?? 1) * r.c.browWeight;
  mark(g, path, pencil(p, { press: 0.82 * heft, size: 2.4 * heft, passes: 2, grade: 0.85 }), seed);
}

function mouth(g: CanvasRenderingContext2D, r: Rig, f: Face, p: Pencil, seed: number) {
  // Just under halfway from the eye line to the chin. Lower than this and the
  // mouth reads as being on the jaw rather than on the face.
  const my = r.eyeY + (r.chinY - r.eyeY) * 0.47;
  const w = r.R * 0.56 * (0.5 + f.width) * r.c.mouthW;
  const lip = pencil(p, { press: 0.8, size: 2.1, passes: 2, grade: 0.86 });
  const open = f.open;

  const arcOf = (amp: number, n = 13): Pt[] =>
    Array.from({ length: n }, (_, i) => {
      const t = i / (n - 1);
      return [r.cx - w / 2 + w * t, my - Math.sin(Math.PI * t) * amp] as Pt;
    });

  if (f.mouth === 'gape' || (f.mouth === 'open' && open > 0.2) || f.mouth === 'o') {
    // A shouting mouth is an oval on its side. Drawn as a circle it reads as a
    // cartoon gasp whatever the brows above it are doing.
    const oh = r.R * (f.mouth === 'o' ? 0.085 : 0.055 + open * 0.15);
    const ow = f.mouth === 'o' ? oh * 0.85 : Math.max(oh * 1.55, w * 0.46);
    const ring = ellipse(r.cx, my + oh * 0.35, ow, oh);
    mark(g, ring, lip, seed, { flat: true });
    // The inside of an open mouth is shaded, never filled flat.
    hatch(g, ring, pencil(p, { press: 0.55, size: 1.2 }), seed + 1, Math.PI * 0.35, 1.9, 0.85);
    if (f.curve > 0.6) {
      mark(g, arcOf(r.R * 0.07).map(([x, y]) => [x, y - oh * 0.5] as Pt),
        pencil(lip, { press: 0.4, passes: 1 }), seed + 2);
    }
    return;
  }
  if (f.mouth === 'cat') {
    const a = w * 0.56;
    const path = smooth([
      [r.cx - a, my], [r.cx - a * 0.45, my - r.R * 0.08], [r.cx, my + r.R * 0.03],
      [r.cx + a * 0.45, my - r.R * 0.08], [r.cx + a, my],
    ], 8);
    mark(g, path, lip, seed);
    return;
  }
  if (f.mouth === 'wave') {
    const path = smooth([
      [r.cx - w * 0.5, my - r.R * 0.02], [r.cx - w * 0.17, my + r.R * 0.03],
      [r.cx + w * 0.17, my - r.R * 0.03], [r.cx + w * 0.5, my + r.R * 0.02],
    ], 8);
    mark(g, path, lip, seed);
    return;
  }
  if (f.mouth === 'grin' || f.mouth === 'tooth') {
    const amp = r.R * 0.13 * (0.6 + f.curve);
    const upper = arcOf(amp);
    mark(g, upper, lip, seed, { weight: 1.05 });
    const lower: Pt[] = Array.from({ length: 13 }, (_, i) => {
      const t = i / 12;
      return [r.cx - w / 2 + w * t, my - Math.sin(Math.PI * t) * amp + Math.sin(Math.PI * t) * r.R * 0.09 * (0.4 + open)] as Pt;
    });
    mark(g, lower, pencil(lip, { press: 0.45 }), seed + 1);
    // The bar of teeth is a line, not a row of squares.
    mark(g, upper.map(([x, y]) => [x, y + r.R * 0.02] as Pt), pencil(p, { press: 0.25, passes: 1, size: 1 }), seed + 2);
    return;
  }
  if (f.mouth === 'tight' || f.mouth === 'line') {
    const amp = r.R * 0.07 * f.curve;
    mark(g, arcOf(amp, 11), pencil(lip, { press: f.mouth === 'tight' ? 0.9 : 0.72 }), seed);
    return;
  }
  mark(g, arcOf(r.R * 0.11 * f.curve), lip, seed);
}

/**
 * Hair as a silhouette, because that is what the eye uses to know a character.
 *
 * Three parts, and the fringe is the one that was wrong twice. It has to travel
 * — from the crown down to just above the brows — and the first version ran
 * from a "hairline" at 0.68R above centre to a "brow" it computed at 0.46R
 * above centre, a journey of about a fifth of a radius. The result was a row of
 * short ticks around the crown and an enormous bare forehead under them.
 *
 * So the fringe is measured against the brow line the brows are *actually*
 * drawn on, and it covers the forehead, which is what a fringe is for.
 *
 * The mass also has to carry tone. A silhouette drawn as an outline reads as a
 * bonnet; what makes hair read as hair in a grey drawing is that it is darker
 * than the face, all over, with the strand direction showing through.
 */
function hair(g: CanvasRenderingContext2D, r: Rig, p: Pencil, seed: number) {
  const heavy = pencil(p, { press: 0.76, size: 2, passes: 2, grade: 0.85 });
  const { cx, cy, R } = r;
  const rand = rng(seed);
  // The line the brows sit on, taken from where brow() actually puts them.
  const browY = r.eyeY - r.eyeH * r.c.browY;
  // Where the fringe stops, measured from the *eye* rather than from the brow.
  //
  // Hung off the brow line it inherited the character's brow height, so Tayama's
  // high brows pulled the fringe up to a travel of about a third of a radius —
  // a row of short ticks near the crown with a bare band of forehead beneath
  // them. A fringe is cut to clear the eyes, and that is what it should be
  // measured against. Covering the brows is fine: they are drawn over it.
  // The *top edge* of the eye, not a multiple of its height: scaling by eyeH
  // meant the larger the eyes, the higher the fringe was cut, which is backwards
  // and left Tayama with a bare band of forehead over a pair of big eyes.
  const tipY = r.eyeY - r.eyeH * 0.5 - R * 0.06;
  void browY;

  // The mass: a dome proud of the skull, down past the temples on both sides.
  const mass: Pt[] = [];
  for (let i = 0; i <= 36; i++) {
    const a = Math.PI * 0.94 + (Math.PI * 1.12 * i) / 36;
    const t = i / 36;
    const puff = r.c.puff + Math.sin(t * Math.PI) * 0.12
      + Math.sin(t * Math.PI * 3) * (r.c.fringe === 'spiky' ? 0.05 : 0.02);
    mass.push([cx + Math.cos(a) * R * puff, cy + Math.sin(a) * R * puff * 1.05]);
  }
  mark(g, mass, heavy, seed + 1, { flat: true });

  // Tone across the whole mass, so it is a dark shape rather than an outline.
  // Clipped to the dome and stopped at the fringe line, so none of it lands on
  // the face.
  const cap: Pt[] = [
    ...mass,
    [cx + R * 1.0, tipY], [cx, tipY + R * 0.06], [cx - R * 1.0, tipY],
  ];
  hatch(g, cap, pencil(p, { press: 0.26, size: 1.15 }), seed + 60, -Math.PI / 2.6, 2.4, 0.9);
  hatch(g, cap, pencil(p, { press: 0.17, size: 1.1 }), seed + 61, -Math.PI / 6, 3.6, 0.7);

  // The fringe: wedges from the crown down over the forehead, each two edges
  // meeting at a point, parted a little off centre.
  // The fringe is the character. A straight one hangs in even lengths from a
  // near-centre parting; a spiky one is uneven, longer, and leans harder away
  // from a parting well off to one side.
  const spiky = r.c.fringe === 'spiky';
  const parted = r.c.parting;
  // A neat fringe is denser than a messy one — the strands of a spiky cut read
  // as separate locks, and of a straight cut as one edge with divisions in it.
  const tips = spiky
    ? [-0.9, -0.64, -0.38, -0.1, 0.18, 0.46, 0.72, 0.94]
    : [-0.94, -0.74, -0.55, -0.36, -0.17, 0.02, 0.21, 0.4, 0.59, 0.78, 0.95];
  for (let i = 0; i < tips.length; i++) {
    const t = tips[i]!;
    const dir = t < parted ? -1 : 1;
    // Roots spread nearly as wide as the tips. Fanning them out from a narrow
    // band at the crown drew something closer to a palm frond than a fringe:
    // hair hangs, and only leans on the way down.
    const rootX = cx + t * R * 0.74;
    const rootY = cy - R * (0.88 - Math.abs(t) * 0.16);
    const lean = spiky ? 0.13 : 0.04;
    const endX = cx + t * R * (0.94 + rand() * (spiky ? 0.2 : 0.08)) + dir * R * lean;
    const endY = tipY + R * (rand() * (spiky ? 0.3 : 0.1) - (spiky ? 0.1 : 0.02));
    const wide = R * ((spiky ? 0.06 : 0.09) + rand() * 0.05);
    for (const side of [-1, 1] as const) {
      mark(g, smooth([
        [rootX + side * wide * 0.55, rootY],
        [(rootX + endX) * 0.5 + side * wide + dir * R * 0.05, (rootY + endY) * 0.5],
        [endX, endY],
      ], 9), heavy, seed + 10 + i * 2 + (side > 0 ? 1 : 0));
    }
  }

  // Side locks, hanging past the cheek.
  for (const side of [-1, 1] as const) {
    const x0 = cx + side * R * 1.02;
    mark(g, smooth([
      [x0, cy - R * 0.62],
      [x0 + side * R * 0.2, cy + R * 0.28],
      [x0 + side * R * 0.05, cy + R * 1.0 * r.c.locks],
      [x0 - side * R * 0.14, cy + R * 1.26 * r.c.locks],
    ], 9), heavy, seed + 30 + side);
  }
}

/** Sweat, blush, tears, gloom, sparkle, vein — the idiom's own punctuation. */
function marks(g: CanvasRenderingContext2D, r: Rig, f: Face, p: Pencil, seed: number) {
  const rand = rng(seed);
  const { cx, cy, R } = r;

  if (f.blush) {
    for (const side of [-1, 1] as const) {
      const bx = cx + side * r.eyeDx * 1.12;
      const by = r.eyeY + r.eyeH * 1.5;
      for (let i = 0; i < 3; i++) {
        const off = (i - 1) * R * 0.09;
        mark(g, [[bx + off - R * 0.05, by - R * 0.05], [bx + off + R * 0.03, by + R * 0.07]],
          pencil(p, { press: 0.34 + f.blush * 0.4, size: 1.35, passes: 2 }), seed + i + side * 5);
      }
    }
  }
  if (f.sweat) {
    const sx = cx + r.eyeDx * 1.5;
    const sy = r.eyeY - r.eyeH * 2.4;
    const drop: Pt[] = [
      [sx, sy], [sx + R * 0.07, sy + R * 0.08], [sx, sy + R * 0.17],
      [sx - R * 0.07, sy + R * 0.08], [sx, sy],
    ];
    mark(g, smooth(drop, 7), pencil(p, { press: 0.7, size: 1.7, passes: 2 }), seed + 11, { flat: true });
  }
  if (f.tears) {
    for (const side of [-1, 1] as const) {
      const tx = cx + side * r.eyeDx * 1.2;
      const ty = r.eyeY + r.eyeH * 0.55;
      // Kept on the face. At full length this ran to a radius below the eye,
      // which is past the chin, and left two small circles hanging in the air.
      const run = R * (0.14 + f.tears * 0.3);
      mark(g, smooth([[tx, ty], [tx + side * R * 0.03, ty + run * 0.5], [tx, ty + run]], 8),
        pencil(p, { press: 0.6, size: 1.5, passes: 2 }), seed + 20 + side);
      if (f.tears > 0.6) {
        mark(g, ellipse(tx + side * R * 0.03, ty + run, R * 0.04, R * 0.055),
          pencil(p, { press: 0.45, size: 1.3, passes: 1 }), seed + 24 + side, { flat: true });
      }
    }
  }
  if (f.gloom) {
    // Vertical gloom down the upper face: the idiom's despair marker.
    //
    // Two things stop it reading as rain. It is dense — sixteen lines across a
    // face is a picket fence, and the gaps grow with the drawing, so the count
    // follows the radius instead of being fixed. And it stops at the top of the
    // eye: run through them and it hangs in front of the face rather than
    // lying on it.
    const y0 = cy - R * 0.32;
    const y1 = r.eyeY - r.eyeH * 0.55;
    const n = Math.max(18, Math.round(R * 0.42));
    for (let i = 0; i < n; i++) {
      const x = cx - R * 0.76 + (R * 1.52 * i) / (n - 1);
      const fade = 0.72 + 0.28 * Math.sin((i / (n - 1)) * Math.PI);
      mark(g, [[x, y0 + R * 0.06 * (1 - fade)], [x + R * 0.015, y1]],
        pencil(p, { press: (0.18 + f.gloom * 0.3) * fade, size: 1.05, passes: 1 }),
        seed + 40 + i, { flat: true });
    }
  }
  if (f.sparkle) {
    for (let i = 0; i < 3 + Math.round(f.sparkle * 3); i++) {
      const a = rand() * Math.PI * 2;
      const rr = R * (0.9 + rand() * 0.5);
      const x = cx + Math.cos(a) * rr;
      const y = cy + Math.sin(a) * rr * 0.9;
      const s = R * (0.05 + rand() * 0.06);
      mark(g, [[x - s, y], [x + s, y]], pencil(p, { press: 0.45, size: 1.2, passes: 1 }), seed + 60 + i);
      mark(g, [[x, y - s], [x, y + s]], pencil(p, { press: 0.45, size: 1.2, passes: 1 }), seed + 70 + i);
    }
  }
  if (f.vein) {
    const vx = cx + r.eyeDx * 1.35;
    const vy = cy - R * 0.6;
    const s = R * 0.1;
    for (const [a, b] of [[[-1, 0], [1, 0]], [[0, -1], [0, 1]]] as const) {
      mark(g, [[vx + a[0] * s, vy + a[1] * s], [vx + b[0] * s, vy + b[1] * s]],
        pencil(p, { press: 0.7, size: 1.8, passes: 2 }), seed + 80 + a[0]);
    }
    for (const [a, b] of [[[-0.7, -0.7], [0.7, 0.7]], [[0.7, -0.7], [-0.7, 0.7]]] as const) {
      mark(g, [[vx + a[0] * s, vy + a[1] * s], [vx + b[0] * s, vy + b[1] * s]],
        pencil(p, { press: 0.55, size: 1.5, passes: 1 }), seed + 90 + a[0]);
    }
  }
  if (f.shock) {
    for (let i = 0; i < 5 + Math.round(f.shock * 5); i++) {
      const a = -Math.PI * 0.95 + rand() * Math.PI * 0.9;
      const r0 = R * 1.28;
      const r1 = r0 + R * (0.1 + rand() * 0.18) * f.shock;
      mark(g, [[cx + Math.cos(a) * r0, cy + Math.sin(a) * r0], [cx + Math.cos(a) * r1, cy + Math.sin(a) * r1]],
        pencil(p, { press: 0.5, size: 1.3, passes: 1 }), seed + 100 + i);
    }
  }
}

export function drawFace(
  g: CanvasRenderingContext2D, f: Face, c: Character, w: number, h: number, seed = 1,
) {
  paper(g, w, h, seed * 17 + 5);
  g.fillStyle = '#23201c';

  // The idiom's proportions, not life's: a short face, a narrow chin, and eyes
  // that take up about a third of the head's width each.
  const R = Math.min(w * 0.345, h * 0.275);
  const cy = h * 0.42;
  const rig: Rig = {
    cx: w / 2,
    cy,
    R,
    chinY: cy + R * 1.36 * c.faceLen,
    eyeY: cy + R * c.eyeY,
    eyeDx: R * c.eyeDx,
    eyeW: R * c.eyeW,
    eyeH: R * c.eyeH,
    tilt: f.tilt ?? 0,
    c,
  };

  const n = noise(seed * 3 + 1);
  const p = pencil(HB, { wobble: 0.8 + n(seed) * 0.5 });
  const tilt = rig.tilt;

  g.save();
  if (tilt) {
    g.translate(rig.cx, rig.cy);
    g.rotate(tilt);
    g.translate(-rig.cx, -rig.cy);
  }

  construction(g, rig, p, seed * 31);
  mark(g, skull(rig), pencil(p, { press: 0.6, size: 1.8, passes: 3 }), seed * 37, { flat: true });

  // Under-chin and neck shadow, so the head sits on something.
  const neckY = rig.chinY;
  mark(g, [[rig.cx - R * 0.38, neckY - R * 0.06], [rig.cx - R * 0.34, neckY + R * 0.5]],
    pencil(p, { press: 0.45, size: 1.6, passes: 2 }), seed * 41);
  mark(g, [[rig.cx + R * 0.38, neckY - R * 0.06], [rig.cx + R * 0.34, neckY + R * 0.5]],
    pencil(p, { press: 0.45, size: 1.6, passes: 2 }), seed * 43);
  hatch(g, [
    [rig.cx - R * 0.42, neckY - R * 0.02], [rig.cx + R * 0.42, neckY - R * 0.02],
    [rig.cx + R * 0.36, neckY + R * 0.26], [rig.cx - R * 0.36, neckY + R * 0.26],
  ], pencil(p, { press: 0.34, size: 1.1 }), seed * 47, Math.PI * 0.3, 2.3, 0.7);

  // Hair first, then the brows over it.
  //
  // A grief brow is raised at the inner end by nearly a quarter of a radius,
  // which puts it above the fringe line — drawn underneath, the single most
  // informative feature on a crying face was hidden behind the hair. Anime
  // draws brows over the fringe for exactly this reason.
  hair(g, rig, p, seed * 79);
  brow(g, rig, f, -1, p, seed * 53);
  brow(g, rig, f, 1, p, seed * 59);
  eye(g, rig, f, -1, p, seed * 61);
  eye(g, rig, f, 1, p, seed * 67);

  // The nose: two marks at most, and mostly one.
  const ny = rig.eyeY + (rig.chinY - rig.eyeY) * 0.3;
  mark(g, smooth([
    [rig.cx + R * 0.02, ny - R * 0.07],
    [rig.cx + R * 0.1, ny + R * 0.01],
    [rig.cx + R * 0.02, ny + R * 0.04],
  ], 6), pencil(p, { press: 0.46, size: 1.4, passes: 1 }), seed * 71);

  mouth(g, rig, f, p, seed * 73);
  marks(g, rig, f, p, seed * 83);

  g.restore();
}
