import { Pad, type Pt } from '../flat/pad';
import { crosshatch, fade, hatch, outline, resample, rng, stipple, stroke, type Ink } from './ink';

/**
 * The furniture.
 *
 * Everything a cat needs in order to be doing something to a pip: a line to peg
 * them on, a box to take them out of, a shelf to push them off, a sofa for them
 * to go under. Each of these is a made object, so each of them is drawn with
 * corners kept and tone laid on with hatch or stipple — the opposite treatment
 * to the cats, who are pure smoothed outline. That contrast is deliberate: it
 * is how an engraver distinguishes a creature from a chair without using a
 * second colour.
 */

/** A slack line between two points, with the sag a real line has. */
export function washLine(pad: Pad, ink: Ink, a: Pt, b: Pt, sag = 0.05): (t: number) => Pt {
  const at = (t: number): Pt => [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t + Math.sin(Math.PI * t) * sag,
  ];
  const path: Pt[] = [];
  for (let i = 0; i <= 20; i++) path.push(at(i / 20));
  stroke(pad, path, ink.hex, { width: 0.0056, taper: 0.15, wobble: 0.0016 });
  // The nails it is tied to.
  for (const p of [a, b]) {
    stroke(pad, [[p[0], p[1] - 0.014], [p[0], p[1] + 0.014]], ink.hex, { width: 0.006, taper: 0.2 });
  }
  return at;
}

/** An open cardboard box in three-quarter view. */
export function box(pad: Pad, ink: Ink, at: Pt, w: number, h: number, seed = 1) {
  const d = w * 0.34;
  const x = at[0];
  const y = at[1];
  const front: Pt[] = [[x - w / 2, y], [x + w / 2, y], [x + w / 2, y - h], [x - w / 2, y - h]];
  const top: Pt[] = [
    [x - w / 2, y - h],
    [x + w / 2, y - h],
    [x + w / 2 + d, y - h - d * 0.6],
    [x - w / 2 + d, y - h - d * 0.6],
  ];
  const side: Pt[] = [
    [x + w / 2, y],
    [x + w / 2 + d, y - d * 0.6],
    [x + w / 2 + d, y - h - d * 0.6],
    [x + w / 2, y - h],
  ];
  pad.shape(top, ink.paper, { alpha: 1, sharp: true });
  outline(pad, front, ink.hex, { width: 0.0058, taper: 0.2, wobble: 0.0018, sharp: true });
  outline(pad, side, ink.hex, { width: 0.005, taper: 0.25, wobble: 0.0018, sharp: true });
  outline(pad, top, ink.hex, { width: 0.005, taper: 0.25, wobble: 0.0018, sharp: true });
  // Tone on the side that faces away from the light, and a hint of the flaps.
  pad.clip(side, () =>
    hatch(pad, [x + w / 2, y - h - d, x + w / 2 + d * 1.2, y + 0.01], fade(ink.hex, 0.55), {
      angle: -1.1,
      pitch: 130,
      width: 0.0026,
      skip: 0.12,
    }),
  );
  const r = rng(seed);
  stroke(pad, [[x - w / 2, y - h * 0.72], [x + w / 2, y - h * 0.72 + (r() - 0.5) * 0.006]], ink.hex, {
    width: 0.003,
    taper: 0.5,
    alpha: 0.5,
  });
}

/** A shelf with two brackets, seen straight on. */
export function shelf(pad: Pad, ink: Ink, y: number, x0: number, x1: number) {
  const t = 0.014;
  outline(pad, [[x0, y], [x1, y], [x1, y + t], [x0, y + t]], ink.hex, { width: 0.0056, taper: 0.2, wobble: 0.0014, sharp: true });
  for (const x of [x0 + (x1 - x0) * 0.18, x0 + (x1 - x0) * 0.82]) {
    stroke(pad, [[x, y + t], [x, y + t + 0.055], [x + 0.03, y + t]], ink.hex, { width: 0.0044, taper: 0.3 });
  }
  pad.clip([[x0, y], [x1, y], [x1, y + t], [x0, y + t]], () =>
    hatch(pad, [x0, y, x1, y + t], fade(ink.hex, 0.45), { angle: 0, pitch: 400, width: 0.0022 }),
  );
}

/** A goldfish bowl. Glass, so it is stippled rather than hatched. */
export function bowl(pad: Pad, ink: Ink, at: Pt, r: number) {
  const path: Pt[] = [];
  for (let i = 0; i <= 22; i++) {
    const a = Math.PI * (0.14 + (i / 22) * 1.72);
    path.push([at[0] - Math.cos(a) * r, at[1] - Math.sin(a) * r * 1.02]);
  }
  stroke(pad, path, ink.hex, { width: 0.0056, taper: 0.2, wobble: 0.0016 });
  // The rim, drawn as an ellipse that does not quite meet the body.
  stroke(
    pad,
    [path[0], [at[0], at[1] - r * 1.06], path[path.length - 1]],
    ink.hex,
    { width: 0.0044, taper: 0.35 },
  );
  // Water line and the light on the glass.
  stroke(pad, [[at[0] - r * 0.86, at[1] - r * 0.5], [at[0] + r * 0.86, at[1] - r * 0.5]], ink.hex, {
    width: 0.0032,
    taper: 0.5,
    alpha: 0.6,
  });
  stipple(pad, [at[0] - r * 0.8, at[1] - r * 0.4, at[0] + r * 0.8, at[1] + r * 0.8], fade(ink.hex, 0.6), {
    n: 220,
    density: (x, y) => {
      const dx = (x - at[0]) / r;
      const dy = (y - at[1]) / r;
      return Math.max(0, Math.min(1, (dx * dx + dy * dy) * 1.1 - 0.2));
    },
    size: 0.0026,
    alpha: 0.55,
  });
}

/** A sofa, from the side, with a dark gap under it. */
export function sofa(pad: Pad, ink: Ink, at: Pt, w: number, h: number) {
  const x = at[0];
  const y = at[1];
  // Traced the way you would trace one: along the floor, up the near arm,
  // across the seat, up the back, down the far arm, and home. Drawn as an open
  // outline it came out as a letter U, which is what happens when a silhouette
  // does not close.
  const body: Pt[] = [
    [x - w / 2, y],
    [x - w / 2, y - h * 0.66],
    [x - w * 0.42, y - h * 0.78],
    [x - w * 0.34, y - h * 0.62],
    [x - w * 0.3, y - h * 0.52],
    [x + w * 0.3, y - h * 0.52],
    [x + w * 0.3, y - h * 1.02],
    [x + w * 0.42, y - h * 1.06],
    [x + w / 2, y - h * 0.94],
    [x + w / 2, y],
  ];
  outline(pad, body, ink.hex, { width: 0.0058, taper: 0.2, wobble: 0.0016, sharp: true });
  // The back cushion, so the far side reads as a back and not as a wall.
  pad.clip(
    [[x - w * 0.3, y - h * 0.52], [x + w * 0.3, y - h * 0.52], [x + w * 0.3, y - h * 0.98], [x - w * 0.3, y - h * 0.6]],
    () => hatch(pad, [x - w, y - h * 1.1, x + w, y], fade(ink.hex, 0.34), { angle: -0.55, pitch: 120, width: 0.0024, skip: 0.25 }),
  );
  // The gap underneath: the darkest thing on any card that has one, because it
  // is the only place in a house that is genuinely a void.
  const gap: Pt[] = [[x - w * 0.44, y], [x + w * 0.44, y], [x + w * 0.44, y + h * 0.2], [x - w * 0.44, y + h * 0.2]];
  pad.clip(gap, () =>
    crosshatch(pad, [x - w * 0.5, y, x + w * 0.5, y + h * 0.24], fade(ink.hex, 0.8), { pitch: 140, width: 0.0026 }),
  );
  for (const fx of [-0.44, 0.44]) {
    stroke(pad, [[x + w * fx, y], [x + w * fx, y + h * 0.2]], ink.hex, { width: 0.005, taper: 0.3 });
  }
  stroke(pad, [[x - w * 0.44, y + h * 0.2], [x + w * 0.44, y + h * 0.2]], ink.hex, { width: 0.005, taper: 0.3 });
}

/** A cushion, tasselled, for a cat that expects one. */
export function cushion(pad: Pad, ink: Ink, at: Pt, w: number) {
  const h = w * 0.42;
  const path: Pt[] = [
    [at[0] - w / 2, at[1]], [at[0] - w * 0.44, at[1] - h * 0.9],
    [at[0], at[1] - h], [at[0] + w * 0.44, at[1] - h * 0.9], [at[0] + w / 2, at[1]],
    [at[0], at[1] + h * 0.14],
  ];
  outline(pad, path, ink.hex, { width: 0.0056, taper: 0.22, wobble: 0.0018, sharp: true });
  pad.clip(path, () =>
    hatch(pad, [at[0] - w, at[1] - h, at[0] + w, at[1] + h], fade(ink.hex, 0.4), {
      angle: 0.5,
      pitch: 130,
      width: 0.0024,
      skip: 0.2,
    }),
  );
  for (const s of [-1, 1] as const) {
    for (let i = 0; i < 4; i++) {
      stroke(
        pad,
        [
          [at[0] + (s * w) / 2, at[1] - h * 0.04],
          [at[0] + (s * w) / 2 + s * 0.012 + (i - 1.5) * 0.004, at[1] + 0.024],
        ],
        ink.hex,
        { width: 0.0026, taper: 0.5 },
      );
    }
  }
}

/** A letter slot in a door, with the flap held open. */
export function letterSlot(pad: Pad, ink: Ink, at: Pt, w: number) {
  const h = w * 0.2;
  outline(pad, [[at[0] - w / 2, at[1]], [at[0] + w / 2, at[1]], [at[0] + w / 2, at[1] + h], [at[0] - w / 2, at[1] + h]], ink.hex, {
    width: 0.0056,
    taper: 0.2,
    sharp: true,
  });
  // The mouth: hatched rather than solid, so it reads as a gap and not a bar.
  const mouth: Pt[] = [
    [at[0] - w * 0.44, at[1] + h * 0.24],
    [at[0] + w * 0.44, at[1] + h * 0.24],
    [at[0] + w * 0.44, at[1] + h * 0.76],
    [at[0] - w * 0.44, at[1] + h * 0.76],
  ];
  pad.clip(mouth, () =>
    hatch(pad, [at[0] - w, at[1], at[0] + w, at[1] + h], fade(ink.hex, 0.85), { angle: 0.4, pitch: 190, width: 0.0026 }),
  );
  outline(pad, mouth, ink.hex, { width: 0.0034, taper: 0.3, alpha: 0.8, sharp: true });
  // The flap, held open, which is what a cat has been doing to it.
  stroke(
    pad,
    [[at[0] - w * 0.4, at[1] + h * 0.24], [at[0] - w * 0.52, at[1] - h * 0.5], [at[0] + w * 0.3, at[1] - h * 0.72]],
    ink.hex,
    { width: 0.0044, taper: 0.3, sharp: true },
  );
  // The door it is set into.
  outline(
    pad,
    [
      [at[0] - w * 0.95, at[1] - w * 0.62],
      [at[0] + w * 0.95, at[1] - w * 0.62],
      [at[0] + w * 0.95, at[1] + w * 0.8],
      [at[0] - w * 0.95, at[1] + w * 0.8],
    ],
    ink.hex,
    { width: 0.004, taper: 0.4, alpha: 0.5, sharp: true },
  );
}

/** A litter tray, with the gravel stippled. */
export function tray(pad: Pad, ink: Ink, at: Pt, w: number) {
  const h = w * 0.3;
  const path: Pt[] = [
    [at[0] - w / 2, at[1] - h], [at[0] + w / 2, at[1] - h],
    [at[0] + w * 0.42, at[1]], [at[0] - w * 0.42, at[1]],
  ];
  outline(pad, path, ink.hex, { width: 0.0056, taper: 0.2, wobble: 0.0016, sharp: true });
  stipple(pad, [at[0] - w * 0.44, at[1] - h * 0.9, at[0] + w * 0.44, at[1] - h * 0.2], fade(ink.hex, 0.7), {
    n: 260,
    size: 0.0026,
    alpha: 0.7,
  });
}

/** A ball of yarn with a thread running off it. */
export function yarn(pad: Pad, ink: Ink, at: Pt, r: number, to: Pt) {
  const rr = rng(Math.round(r * 1e4));
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI;
    const path: Pt[] = [];
    for (let k = 0; k <= 16; k++) {
      const t = (k / 16) * Math.PI * 2;
      const rx = r * (0.55 + 0.45 * Math.cos(a));
      path.push([at[0] + Math.cos(t) * r, at[1] + Math.sin(t) * rx]);
    }
    stroke(pad, path, ink.hex, { width: 0.0028, taper: 0.3, alpha: 0.7 + rr() * 0.2 });
  }
  const path: Pt[] = [
    [at[0] + r * 0.7, at[1]],
    [at[0] + (to[0] - at[0]) * 0.4, at[1] + (to[1] - at[1]) * 0.2 - 0.03],
    [at[0] + (to[0] - at[0]) * 0.7, at[1] + (to[1] - at[1]) * 0.7 + 0.02],
    to,
  ];
  stroke(pad, path, ink.hex, { width: 0.0032, taper: 0.4, wobble: 0.003 });
}

/** A high-backed chair, from the side, occupied or otherwise. */
export function chair(pad: Pad, ink: Ink, at: Pt, w: number, h: number) {
  const x = at[0];
  const y = at[1];
  outline(
    pad,
    [
      [x - w / 2, y], [x - w / 2, y - h], [x - w * 0.36, y - h * 1.06],
      [x - w * 0.3, y - h * 0.52], [x + w / 2, y - h * 0.5], [x + w / 2, y - h * 0.36],
      [x + w * 0.4, y - h * 0.36], [x + w * 0.4, y],
    ],
    ink.hex,
    { width: 0.0058, taper: 0.2, wobble: 0.0016, sharp: true },
  );
  pad.clip(
    [[x - w * 0.3, y - h * 0.52], [x + w / 2, y - h * 0.5], [x + w / 2, y - h * 0.36], [x - w * 0.3, y - h * 0.38]],
    () => hatch(pad, [x - w, y - h, x + w, y], fade(ink.hex, 0.4), { angle: -0.5, pitch: 150, width: 0.0024, skip: 0.2 }),
  );
}

/** A window with four panes and a sill. */
export function window(pad: Pad, ink: Ink, at: Pt, w: number, h: number) {
  const x0 = at[0] - w / 2;
  const y0 = at[1] - h / 2;
  outline(pad, [[x0, y0], [x0 + w, y0], [x0 + w, y0 + h], [x0, y0 + h]], ink.hex, { width: 0.0062, taper: 0.18, sharp: true });
  stroke(pad, [[x0 + w / 2, y0], [x0 + w / 2, y0 + h]], ink.hex, { width: 0.0044, taper: 0.3 });
  stroke(pad, [[x0, y0 + h / 2], [x0 + w, y0 + h / 2]], ink.hex, { width: 0.0044, taper: 0.3 });
  outline(pad, [[x0 - w * 0.06, y0 + h], [x0 + w * 1.06, y0 + h], [x0 + w * 1.06, y0 + h + 0.02], [x0 - w * 0.06, y0 + h + 0.02]], ink.hex, {
    width: 0.005,
    taper: 0.25,
    sharp: true,
  });
}

/** A stack of pips needs something to stand on. */
export function plinth(pad: Pad, ink: Ink, at: Pt, w: number) {
  outline(pad, [[at[0] - w / 2, at[1]], [at[0] + w / 2, at[1]], [at[0] + w * 0.42, at[1] + 0.026], [at[0] - w * 0.42, at[1] + 0.026]], ink.hex, {
    width: 0.0052,
    taper: 0.2,
    sharp: true,
  });
  pad.clip(
    [[at[0] - w / 2, at[1]], [at[0] + w / 2, at[1]], [at[0] + w * 0.42, at[1] + 0.026], [at[0] - w * 0.42, at[1] + 0.026]],
    () => hatch(pad, [at[0] - w, at[1], at[0] + w, at[1] + 0.03], fade(ink.hex, 0.45), { angle: -0.4, pitch: 260, width: 0.0022 }),
  );
}

/** A rug, seen in perspective, with a fringe. */
export function rug(pad: Pad, ink: Ink, at: Pt, w: number) {
  const h = w * 0.22;
  const path: Pt[] = [
    [at[0] - w / 2, at[1]], [at[0] + w / 2, at[1]],
    [at[0] + w * 0.38, at[1] + h], [at[0] - w * 0.38, at[1] + h],
  ];
  outline(pad, path, ink.hex, { width: 0.0044, taper: 0.3, wobble: 0.002, sharp: true });
  pad.clip(path, () =>
    hatch(pad, [at[0] - w, at[1], at[0] + w, at[1] + h], fade(ink.hex, 0.35), { angle: 0.34, pitch: 120, width: 0.0022, skip: 0.3 }),
  );
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    const x = at[0] - w * 0.38 + w * 0.76 * t;
    stroke(pad, [[x, at[1] + h], [x, at[1] + h + 0.014]], ink.hex, { width: 0.002, taper: 0.5, alpha: 0.7 });
  }
}

/** A fish, whole or a skeleton. The only non-pip a cat truly wants. */
export function fish(pad: Pad, ink: Ink, at: Pt, len: number, bones = false) {
  const body: Pt[] = [
    [at[0] - len * 0.5, at[1]], [at[0] - len * 0.2, at[1] - len * 0.16],
    [at[0] + len * 0.18, at[1] - len * 0.14], [at[0] + len * 0.42, at[1]],
    [at[0] + len * 0.18, at[1] + len * 0.14], [at[0] - len * 0.2, at[1] + len * 0.16],
  ];
  if (bones) {
    stroke(pad, [[at[0] - len * 0.46, at[1]], [at[0] + len * 0.42, at[1]]], ink.hex, { width: 0.0038, taper: 0.3 });
    for (let i = 0; i < 7; i++) {
      const t = i / 6;
      const x = at[0] - len * 0.36 + len * 0.68 * t;
      const s = len * 0.15 * Math.sin(Math.PI * (0.2 + t * 0.7));
      stroke(pad, [[x, at[1] - s], [x, at[1] + s]], ink.hex, { width: 0.0026, taper: 0.5, alpha: 0.85 });
    }
  } else {
    outline(pad, body, ink.hex, { width: 0.0044, taper: 0.3, wobble: 0.0016 });
    pad.blob([at[0] + len * 0.26, at[1] - len * 0.03], len * 0.02, len * 0.02, 0, ink.hex, { alpha: 1 });
  }
  // The tail, always.
  stroke(
    pad,
    [[at[0] - len * 0.5, at[1]], [at[0] - len * 0.66, at[1] - len * 0.16], [at[0] - len * 0.62, at[1]], [at[0] - len * 0.66, at[1] + len * 0.16], [at[0] - len * 0.5, at[1]]],
    ink.hex,
    { width: 0.0036, taper: 0.35 },
  );
}

/** A stepladder, for reaching what should not be reached. */
export function ladder(pad: Pad, ink: Ink, at: Pt, h: number) {
  const w = h * 0.42;
  stroke(pad, [[at[0] - w * 0.5, at[1]], [at[0] - w * 0.16, at[1] - h]], ink.hex, { width: 0.0054, taper: 0.2 });
  stroke(pad, [[at[0] + w * 0.1, at[1]], [at[0] - w * 0.06, at[1] - h]], ink.hex, { width: 0.0054, taper: 0.2 });
  for (let i = 1; i <= 4; i++) {
    const t = i / 5;
    stroke(
      pad,
      [
        [at[0] - w * 0.5 + w * 0.34 * t, at[1] - h * t],
        [at[0] + w * 0.1 - w * 0.16 * t, at[1] - h * t],
      ],
      ink.hex,
      { width: 0.0042, taper: 0.3 },
    );
  }
  stroke(pad, [[at[0] + w * 0.44, at[1]], [at[0] - w * 0.02, at[1] - h * 0.96]], ink.hex, { width: 0.0044, taper: 0.25, alpha: 0.7 });
}

/** A curtain, hanging, with a cat-sized problem in it. */
export function curtain(pad: Pad, ink: Ink, at: Pt, w: number, h: number, snag = 0) {
  const folds = 6;
  for (let i = 0; i <= folds; i++) {
    const t = i / folds;
    const x = at[0] - w / 2 + w * t;
    const pull = Math.exp(-((t - 0.55) ** 2) * 26) * snag;
    const path: Pt[] = [];
    for (let k = 0; k <= 8; k++) {
      const u = k / 8;
      path.push([x + Math.sin(u * 3.1) * w * 0.02 + pull * u * 0.5, at[1] + h * u + pull * u * u * 0.4]);
    }
    stroke(pad, path, ink.hex, { width: 0.0034, taper: 0.3, alpha: 0.85 });
  }
  stroke(pad, [[at[0] - w * 0.56, at[1]], [at[0] + w * 0.56, at[1]]], ink.hex, { width: 0.005, taper: 0.2 });
}

/** A mirror, oval, in a frame — and whatever is reflected is the caller's job. */
export function mirror(pad: Pad, ink: Ink, at: Pt, w: number, h: number) {
  const oval: Pt[] = [];
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * Math.PI * 2;
    oval.push([at[0] + Math.cos(a) * w * 0.5, at[1] + Math.sin(a) * h * 0.5]);
  }
  outline(pad, oval, ink.hex, { width: 0.0062, taper: 0.2, wobble: 0.0016 });
  const inner = oval.map((p): Pt => [at[0] + (p[0] - at[0]) * 0.9, at[1] + (p[1] - at[1]) * 0.9]);
  outline(pad, inner, ink.hex, { width: 0.0032, taper: 0.4, alpha: 0.7 });
  // A flash of light across the glass, which is what tells you it is glass.
  stroke(pad, [[at[0] - w * 0.28, at[1] + h * 0.1], [at[0] - w * 0.08, at[1] - h * 0.24]], ink.hex, {
    width: 0.0038,
    taper: 0.5,
    alpha: 0.5,
  });
}

/** A dotted trail, for a thing that has recently been somewhere else. */
export function trail(pad: Pad, ink: Ink, path: Pt[], gap = 0.02) {
  const dense = resample(path, 60);
  let d = 0;
  for (let i = 1; i < dense.length; i++) {
    d += Math.hypot(dense[i][0] - dense[i - 1][0], dense[i][1] - dense[i - 1][1]);
    if (d < gap) continue;
    d = 0;
    pad.blob(dense[i], 0.0034, 0.0034, 0, ink.hex, { alpha: 0.6 });
  }
}

/** Motion lines, the cartoon kind, for a pip that has just been hit. */
export function whoosh(pad: Pad, ink: Ink, from: Pt, dir: Pt, len: number, n = 3) {
  const d = Math.hypot(dir[0], dir[1]) || 1;
  const ux = dir[0] / d;
  const uy = dir[1] / d;
  for (let i = 0; i < n; i++) {
    const off = (i - (n - 1) / 2) * 0.018;
    const k = 1 - Math.abs(i - (n - 1) / 2) * 0.28;
    stroke(
      pad,
      [
        [from[0] - uy * off, from[1] + ux * off],
        [from[0] - ux * len * k - uy * off, from[1] - uy * len * k + ux * off],
      ],
      ink.hex,
      { width: 0.0038, taper: 0.7, alpha: 0.8 },
    );
  }
}
