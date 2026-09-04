import { Pad, type Pt } from '../flat/pad';
import { crosshatch, fade, hatch, outline, resample, rng, stipple, stroke } from '../cards/ink';

/**
 * Petersburg, in two colours and a bit of weather.
 *
 * The cards next door are pure outline on cream, so this deliberately is not:
 * these are **spot black on grey paper with one warm light in them**, which is
 * the register the joke wants. A man drawn as an outline is a character in a
 * story; a man drawn as a filled silhouette with a lamp behind him is a man in
 * a city at four in the afternoon in December, and half the joke is already
 * done before the caption arrives.
 *
 * One accent colour, ochre, and it is only ever *light*: a lamp, a candle, a
 * window with somebody else's evening in it. Nothing else on the panel is warm,
 * which is why the warmth reads.
 */

export const PAPER = '#e6e0d3';
export const INK = '#22201e';
export const LAMP = '#c8842a';

export type Setting = 'room' | 'table' | 'desk' | 'street' | 'door' | 'stairs' | 'bridge' | 'corridor' | 'garret';
export type Stance = 'stand' | 'seated' | 'writing' | 'walk' | 'stairs' | 'window' | 'bow' | 'hat';

const H = 1;

// ------------------------------------------------------------------ figure

/** What a particular man looks like. Drawn from the panel's seed. */
export interface Look {
  /** 0 short jacket, 1 to the ankle. */
  coat: number;
  hat: 'top' | 'cap' | 'fur' | 'none';
  /** How far forward he is bent. */
  stoop: number;
  /** Collar up, which is most of them, most of the year. */
  collar: boolean;
  scarf: boolean;
  /** Overall height, as a multiplier. */
  tall: number;
}

export function look(seed: number): Look {
  const r = rng(seed ^ 0x1d3a);
  const h = r();
  return {
    coat: 0.45 + r() * 0.55,
    hat: h < 0.42 ? 'top' : h < 0.72 ? 'cap' : h < 0.9 ? 'fur' : 'none',
    stoop: 0.04 + r() * 0.16,
    collar: r() < 0.72,
    scarf: r() < 0.34,
    tall: 0.92 + r() * 0.18,
  };
}

/**
 * A man in a greatcoat.
 *
 * The first version of this was a filled bell with a hat on it, and it read as
 * a mushroom. What was missing was everything that makes a silhouette a
 * *person*: boots under the hem, a shoulder line that slopes, a neck, and a
 * head with a face-side and a back-side. A coat is only a coat if you can see
 * where the man stops and it starts.
 *
 * Filled rather than outlined, and then cut back into with pale strokes for
 * the collar and the near arm. Scraperboard, more or less — the light is what
 * you take away.
 */
export function figure(pad: Pad, at: Pt, size: number, stance: Stance, seed: number, flip = 1) {
  const L = look(seed);
  const k = size * L.tall;
  const P = (x: number, y: number): Pt => [at[0] + x * k * flip, at[1] - y * k];
  const lean = L.stoop * 0.7 + (stance === 'writing' ? 0.1 : stance === 'bow' ? 0.2 : 0);
  const bend = (y: number) => lean * y * y;

  const hemY = stance === 'seated' || stance === 'writing' ? 0.34 : 0.1 + (1 - L.coat) * 0.12;
  // A greatcoat flares by about half again from the shoulder, not by double.
  // At double it is a cone with a head on it, which is a bell, which is what
  // the first version of this was.
  const shoulderW = 0.115;
  const hemW = shoulderW * (1.24 + L.coat * 0.28);
  const shoulder = 0.8;

  // Boots, under the hem. Close together and pointing the same way, because
  // two feet planted wide apart is a stance and this man has never had one.
  //
  // They are drawn up *past* the hem and the coat goes over them afterwards.
  // Stopping them at a fixed height leaves a strip of paper between boot and
  // hem on every long coat, and a man standing a centimetre above his own feet
  // is the sort of thing you only see once and then cannot stop seeing.
  if (stance !== 'seated' && stance !== 'writing') {
    const shin = hemY + 0.04;
    for (const s of [-1, 1] as const) {
      pad.shape(
        [P(s * 0.035 - 0.028, 0), P(s * 0.035 + 0.038, 0), P(s * 0.035 + 0.03, shin), P(s * 0.035 - 0.02, shin)],
        INK,
        { alpha: 0.95, sharp: true },
      );
    }
  }

  // The coat: a narrow shoulder, a waist that is only implied, and a hem that
  // flares because of what is under it rather than for its own sake.
  const body: Pt[] = [
    P(-shoulderW + bend(shoulder), shoulder),
    P(-shoulderW * 0.92 + bend(0.62), 0.62),
    P(-shoulderW * 1.02 + bend(0.42), 0.42),
    P(-hemW * 0.96, hemY + 0.12),
    P(-hemW, hemY),
    P(hemW * 0.94, hemY),
    P(hemW * 0.88 - 0.01, hemY + 0.14),
    P(shoulderW * 0.96 + bend(0.42), 0.42),
    P(shoulderW * 0.86 + bend(0.62), 0.62),
    P(shoulderW * 0.8 + bend(shoulder), shoulder),
  ];
  pad.shape(body, INK, { alpha: 0.95 });
  outline(pad, body, INK, { width: 0.005, taper: 0.3, wobble: 0.002 });

  // The near arm, cut back out of the silhouette. One pale line, and it is the
  // only interior mark that survives being a hundred pixels tall.
  const armY = stance === 'writing' ? 0.46 : 0.3;
  stroke(pad, [P(shoulderW * 0.72 + bend(0.74), 0.74), P(shoulderW * 0.94 + bend(0.54), 0.54), P(shoulderW * 0.78, armY)], PAPER, {
    width: 0.006,
    taper: 0.6,
    alpha: 0.3,
  });

  const hx = bend(0.9);
  // Neck, then head. The neck is two per cent of the drawing and it is why the
  // head is a head and not a knob on a coat.
  pad.shape([P(hx - 0.028, shoulder - 0.02), P(hx + 0.028, shoulder - 0.02), P(hx + 0.026, 0.86), P(hx - 0.026, 0.86)], INK, {
    alpha: 0.95,
    sharp: true,
  });
  // Head with a face side: a nose notch, so the silhouette has a direction.
  const head: Pt[] = [];
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    const nose = a > -0.35 && a < 0.8 ? 1.14 : 1;
    head.push(P(hx + Math.cos(a) * 0.062 * nose, 0.9 + Math.sin(a) * 0.072));
  }
  pad.shape(head, INK, { alpha: 0.96 });

  if (L.collar) {
    // A collar turned up: it rises beside the neck towards the ear, close in.
    // Splayed out at the shoulder it reads as a pair of horns, which is what
    // the first attempt looked like and is a difficult thing to unsee.
    for (const s of [-1, 1] as const) {
      pad.shape(
        [
          P(hx + s * 0.024, shoulder - 0.02),
          P(hx + s * 0.082, shoulder + 0.01),
          P(hx + s * 0.072, 0.9),
          P(hx + s * 0.03, 0.88),
        ],
        INK,
        { alpha: 0.95, sharp: true },
      );
    }
  }
  if (L.scarf) {
    stroke(pad, [P(hx - 0.06, 0.82), P(hx + 0.05, 0.84), P(hx + 0.1, 0.7), P(hx + 0.09, 0.58)], INK, {
      width: 0.011,
      taper: 0.4,
      alpha: 0.9,
    });
  }

  hat(pad, P, hx, L.hat, stance);

  if (stance === 'writing') {
    stroke(pad, [P(0.1, 0.48), P(0.26, 0.42)], INK, { width: 0.008, taper: 0.4 });
    stroke(pad, [P(0.26, 0.42), P(0.34, 0.5)], INK, { width: 0.004, taper: 0.6 });
  }
  if (stance === 'bow') stroke(pad, [P(0.1, 0.54), P(0.2, 0.36), P(0.17, 0.24)], INK, { width: 0.009, taper: 0.4 });
  if (stance === 'stairs') stroke(pad, [P(0.11, 0.62), P(0.3, 0.58)], INK, { width: 0.008, taper: 0.4 });
  if (stance === 'walk') {
    stroke(pad, [P(-hemW, hemY + 0.02), P(-hemW - 0.1, hemY + 0.12), P(-hemW - 0.14, hemY + 0.3)], INK, {
      width: 0.011,
      taper: 0.5,
      wobble: 0.003,
    });
  }
  if (stance === 'window') {
    stroke(pad, [P(-0.1, 0.7), P(0.09, 0.7)], PAPER, { width: 0.005, taper: 0.5, alpha: 0.3 });
  }
}

/** Whatever is on his head, which in this weather is not optional. */
function hat(pad: Pad, P: (x: number, y: number) => Pt, hx: number, kind: Look['hat'], stance: Stance) {
  if (stance === 'hat') {
    // Held, not worn, which is the whole of the graveside pose.
    pad.blob(P(0.17, 0.38), 0.03, 0.018, 0.3, INK, { alpha: 0.94 });
    return;
  }
  const brow = 0.952;
  if (kind === 'none') {
    stroke(pad, [P(hx - 0.06, brow), P(hx - 0.02, brow + 0.04), P(hx + 0.05, brow)], INK, { width: 0.008, taper: 0.4 });
    return;
  }
  if (kind === 'top') {
    pad.shape(
      [P(hx - 0.1, brow), P(hx + 0.1, brow), P(hx + 0.095, brow + 0.02), P(hx - 0.095, brow + 0.02)],
      INK,
      { alpha: 0.96, sharp: true },
    );
    pad.shape(
      [P(hx - 0.062, brow + 0.005), P(hx + 0.062, brow + 0.005), P(hx + 0.056, brow + 0.19), P(hx - 0.056, brow + 0.19)],
      INK,
      { alpha: 0.96, sharp: true },
    );
    return;
  }
  if (kind === 'cap') {
    pad.shape(
      [P(hx - 0.062, brow - 0.01), P(hx + 0.058, brow - 0.01), P(hx + 0.05, brow + 0.08), P(hx - 0.05, brow + 0.08)],
      INK,
      { alpha: 0.96, sharp: true },
    );
    pad.shape(
      [P(hx + 0.04, brow - 0.015), P(hx + 0.13, brow - 0.025), P(hx + 0.13, brow), P(hx + 0.04, brow + 0.005)],
      INK,
      { alpha: 0.96, sharp: true },
    );
    return;
  }
  // Fur: a squat blob with a rough edge, and the roughness is the point.
  const r = rng(Math.round(hx * 9973) + 5);
  const fur: Pt[] = [];
  for (let i = 0; i < 16; i++) {
    const a = Math.PI + (i / 15) * Math.PI;
    fur.push(P(hx + Math.cos(a) * 0.082 * (0.94 + r() * 0.16), brow + Math.sin(a) * -0.085 * (0.9 + r() * 0.2)));
  }
  fur.push(P(hx + 0.082, brow - 0.01));
  fur.push(P(hx - 0.082, brow - 0.01));
  pad.shape(fur, INK, { alpha: 0.96 });
}

/** Two figures, the second smaller and further off, because depth is free. */
export function pair(pad: Pad, a: Pt, b: Pt, size: number, stances: [Stance, Stance], seed: number) {
  figure(pad, b, size * 0.82, stances[1], seed + 11, -1);
  figure(pad, a, size, stances[0], seed);
}

// ------------------------------------------------------------------ places

/** A wall with a window in it, and somebody else's evening behind the glass. */
export function room(pad: Pad, seed: number, y = 0.74) {
  const r = rng(seed);
  // The floor line, and the wall above it hatched to nothing.
  stroke(pad, [[0, y], [1, y + 0.008]], INK, { width: 0.005, taper: 0.3, wobble: 0.003 });
  hatch(pad, [0, y, 1, H], fade(INK, 0.3), { angle: 0.1, pitch: 26, width: 0.0024, skip: 0.45 });

  const wx = 0.16 + r() * 0.14;
  window(pad, [wx, 0.36], 0.24, 0.3, seed);
  // A chair, because a room with nothing in it is a wall.
  const cx = 0.72 + r() * 0.08;
  stroke(pad, [[cx, y], [cx, 0.5], [cx + 0.1, 0.5]], INK, { width: 0.006, taper: 0.3, sharp: true });
  stroke(pad, [[cx + 0.11, y], [cx + 0.11, 0.5]], INK, { width: 0.006, taper: 0.3 });
  stroke(pad, [[cx - 0.01, 0.5], [cx + 0.13, 0.5]], INK, { width: 0.007, taper: 0.3 });
}

/**
 * A table, in two halves.
 *
 * A table is the one piece of furniture in this set that the man is *behind*,
 * so it cannot all be painted before he is. Drawn in one pass he stands on the
 * tabletop with his legs cut off at the knee by a black slab, which is what the
 * first version of this did. The wall goes down first, the man goes down next,
 * and the table comes over the top of him — which is also the order you would
 * see them in.
 */
export function tableBack(pad: Pad, seed: number, y = 0.8) {
  void seed;
  crosshatch(pad, [0, 0, 1, y * 0.6], fade(INK, 0.22), { pitch: 20, width: 0.0022, skip: 0.5 });
}

/** The table itself, and what is on it. Drawn over the figure. */
export function tableFront(pad: Pad, seed: number, y = 0.8) {
  const r = rng(seed);
  pad.shape([[0, y], [1, y - 0.01], [1, H], [0, H]], INK, { alpha: 0.9, sharp: true });
  stroke(pad, [[0, y], [1, y - 0.01]], INK, { width: 0.008, taper: 0.2, wobble: 0.002 });

  const cx = 0.24 + r() * 0.1;
  candle(pad, [cx, y - 0.005], 0.13);
  // A glass, and a second one somebody has left.
  glass(pad, [0.66 + r() * 0.06, y - 0.005], 0.05);
  if (r() < 0.7) glass(pad, [0.8, y - 0.008], 0.042);
}

/** The wall behind the desk. See `tableBack` for why this is split in two. */
export function deskBack(pad: Pad, seed: number, y = 0.82) {
  void seed;
  void y;
  crosshatch(pad, [0, 0, 1, 0.5], fade(INK, 0.2), { pitch: 18, width: 0.0022, skip: 0.55 });
}

/** A clerk's desk: a slope, a stack, an inkwell, a lamp with a shade. */
export function deskFront(pad: Pad, seed: number, y = 0.82) {
  const r = rng(seed);
  pad.shape([[0.02, y], [0.98, y - 0.02], [0.98, H], [0.02, H]], INK, { alpha: 0.88, sharp: true });
  stroke(pad, [[0.02, y], [0.98, y - 0.02]], INK, { width: 0.008, taper: 0.2 });
  // Paper: a few sheets, one of them out of true.
  for (let i = 0; i < 3; i++) {
    const x = 0.5 + i * 0.03;
    const a = (r() - 0.5) * 0.14;
    const p: Pt[] = [
      [x - 0.1, y - 0.02 + a * 0.1],
      [x + 0.1, y - 0.03 - a * 0.1],
      [x + 0.09, y + 0.03],
      [x - 0.11, y + 0.04],
    ];
    pad.shape(p, PAPER, { alpha: 0.9, sharp: true });
    outline(pad, p, INK, { width: 0.0034, taper: 0.4, sharp: true });
    for (let l = 0; l < 4; l++) {
      stroke(pad, [[x - 0.07, y - 0.008 + l * 0.011], [x + 0.05, y - 0.012 + l * 0.011]], INK, {
        width: 0.0022,
        taper: 0.6,
        alpha: 0.5,
      });
    }
  }
  // The inkwell, which is the darkest thing on the desk.
  pad.blob([0.32, y - 0.012], 0.026, 0.016, 0, INK, { alpha: 1 });
  lamp(pad, [0.78, y - 0.02], 0.16);
}

/** A street: a lamp, a wall going away, and weather. */
export function street(pad: Pad, seed: number, y = 0.82) {
  const r = rng(seed);
  stroke(pad, [[0, y + 0.02], [1, y]], INK, { width: 0.006, taper: 0.2, wobble: 0.004 });
  // A wall in perspective, hatched darker as it recedes.
  const vp = 0.42 + r() * 0.3;
  const path: Pt[] = [[0, 0.16], [vp, 0.56], [vp, y], [0, y + 0.02]];
  pad.shape(path, INK, { alpha: 0.62, sharp: true });
  pad.clip(path, () => crosshatch(pad, [0, 0, vp, H], fade(INK, 0.5), { pitch: 24, width: 0.0026, skip: 0.3 }));
  stroke(pad, [[0, 0.16], [vp, 0.56]], INK, { width: 0.005, taper: 0.3 });
  stroke(pad, [[vp, 0.56], [vp, y]], INK, { width: 0.005, taper: 0.3 });
  // Windows in it, one of them lit, which is the only kindness on the card.
  const lit = Math.floor(r() * 4);
  for (let i = 0; i < 4; i++) {
    const t = 0.12 + i * 0.13;
    const x = t * vp;
    const top = 0.2 + t * 0.4;
    const w = 0.05 * (1 - t * 0.6);
    const h = 0.09 * (1 - t * 0.5);
    const pane: Pt[] = [[x, top], [x + w, top + 0.02], [x + w, top + h], [x, top + h - 0.01]];
    pad.shape(pane, i === lit ? LAMP : INK, { alpha: i === lit ? 0.85 : 0.5, sharp: true });
    if (i === lit) glow(pad, [x + w / 2, top + h / 2], 0.2);
  }
  if (r() < 0.78) streetLamp(pad, [vp + 0.1 + r() * 0.22, y], 0.36 + r() * 0.2);
  snow(pad, seed, 0.25 + r() * 0.6);
}

/** A doorway with a party behind it. */
export function door(pad: Pad, seed: number, y = 0.86) {
  const r = rng(seed);
  crosshatch(pad, [0, 0, 1, H], fade(INK, 0.34), { pitch: 22, width: 0.0024, skip: 0.4 });
  const x0 = 0.34;
  const w = 0.34;
  const frame: Pt[] = [[x0, 0.2], [x0 + w, 0.2], [x0 + w, y], [x0, y]];
  pad.shape(frame, LAMP, { alpha: 0.5, sharp: true });
  pad.clip(frame, () => {
    // The light in the room beyond, and the shapes of people in it who are
    // not thinking about him.
    hatch(pad, [x0, 0.2, x0 + w, y], fade(LAMP, 0.7), { angle: 1.4, pitch: 40, width: 0.004, skip: 0.4 });
    for (let i = 0; i < 3; i++) {
      figure(pad, [x0 + 0.07 + i * 0.1 + r() * 0.02, y], 0.4, 'stand', seed + i * 7, i % 2 ? -1 : 1);
    }
  });
  outline(pad, frame, INK, { width: 0.009, taper: 0.2, sharp: true });
  stroke(pad, [[0, y], [1, y]], INK, { width: 0.006, taper: 0.3, wobble: 0.003 });
}

/** A flight of stairs, seen from the side, going up into nothing. */
export function stairs(pad: Pad, seed: number, y = 0.9) {
  const r = rng(seed);
  crosshatch(pad, [0, 0, 1, H], fade(INK, 0.28), { pitch: 22, width: 0.0024, skip: 0.45 });
  const n = 6 + Math.floor(r() * 3);
  const x0 = 0.04 + r() * 0.14;
  const y0 = y;
  const rise = 0.062 + r() * 0.02;
  const run = 0.088 + r() * 0.026;
  const tread: Pt[] = [];
  for (let i = 0; i < n; i++) {
    tread.push([x0 + i * run, y0 - i * rise]);
    tread.push([x0 + (i + 1) * run, y0 - i * rise]);
    tread.push([x0 + (i + 1) * run, y0 - (i + 1) * rise]);
  }
  stroke(pad, tread, INK, { width: 0.0068, taper: 0.15, sharp: true, wobble: 0.0018 });
  pad.clip([...tread, [x0 + n * run, H], [x0, H]], () =>
    crosshatch(pad, [x0, y0 - n * rise, x0 + n * run, H], fade(INK, 0.5), { pitch: 26, width: 0.0024 }),
  );
  // The bannister: two rails and the posts between them.
  stroke(pad, [[x0 + 0.02, y0 - 0.22], [x0 + n * run + 0.02, y0 - n * rise - 0.22]], INK, { width: 0.006, taper: 0.3 });
  for (let i = 0; i <= n; i++) {
    const x = x0 + i * run + 0.02;
    const yy = y0 - i * rise;
    stroke(pad, [[x, yy], [x, yy - 0.22]], INK, { width: 0.003, taper: 0.4, alpha: 0.8 });
  }
}

/**
 * A bridge over a frozen canal, with the far bank as a low band.
 *
 * Half of Petersburg is a bridge, and a bridge gives the one thing the
 * interiors cannot: a horizon with nothing on it, which is where a man goes to
 * have an argument with himself.
 */
export function bridge(pad: Pad, seed: number, y = 0.8) {
  const r = rng(seed);
  crosshatch(pad, [0, 0, 1, y - 0.12], fade(INK, 0.14), { pitch: 16, width: 0.0022, skip: 0.6 });
  // The far bank: a strip of roofs, small, so the scale reads.
  const bank = y - 0.16 - r() * 0.06;
  for (let x = -0.05; x < 1.05; x += 0.04 + r() * 0.05) {
    const hh = 0.02 + r() * 0.05;
    pad.shape([[x, bank], [x + 0.045, bank], [x + 0.045, bank - hh], [x, bank - hh]], INK, { alpha: 0.62, sharp: true });
  }
  stroke(pad, [[0, bank], [1, bank + 0.004]], INK, { width: 0.004, taper: 0.3, wobble: 0.003 });
  // The ice, hatched flat, and the parapet across the front.
  hatch(pad, [0, bank, 1, y], fade(INK, 0.16), { angle: 0.02, pitch: 42, width: 0.0022, skip: 0.5 });
  const rail = y - 0.1;
  stroke(pad, [[0, rail], [1, rail - 0.006]], INK, { width: 0.0072, taper: 0.2, wobble: 0.002 });
  stroke(pad, [[0, y], [1, y]], INK, { width: 0.006, taper: 0.25, wobble: 0.003 });
  for (let x = 0.02; x < 1; x += 0.075) {
    stroke(pad, [[x, rail], [x, y]], INK, { width: 0.0034, taper: 0.4, alpha: 0.85 });
  }
  if (r() < 0.7) streetLamp(pad, [0.08 + r() * 0.12, y], 0.42);
  snow(pad, seed + 3, 0.4 + r() * 0.5);
}

/**
 * A corridor of doors, going away, all of them shut.
 *
 * One-point perspective done the way it is actually done: a small rectangle at
 * the far end, and four lines from its corners to the corners of the frame.
 * Drawing the walls as two independent converging pairs, which is what the
 * first version did, gives a large X and no corridor.
 */
export function corridor(pad: Pad, seed: number, y = 0.84) {
  const r = rng(seed);
  const vx = 0.42 + r() * 0.16;
  const vy = y - 0.3 - r() * 0.06;
  const fw = 0.11 + r() * 0.05;
  const fh = fw * 1.5;
  const far: Pt[] = [[vx - fw, vy - fh * 0.5], [vx + fw, vy - fh * 0.5], [vx + fw, vy + fh * 0.5], [vx - fw, vy + fh * 0.5]];
  const frame: Pt[] = [[0, 0], [1, 0], [1, y + 0.12], [0, y + 0.12]];

  // Ceiling, floor and the two walls, as four wedges, each with its own tone.
  const wedge = (a: Pt, b: Pt, c: Pt, d: Pt, alpha: number, angle: number) => {
    const p = [a, b, c, d];
    pad.clip(p, () => hatch(pad, [0, 0, 1, 1], fade(INK, alpha), { angle, pitch: 30, width: 0.0024, skip: 0.35 }));
    stroke(pad, [a, d], INK, { width: 0.004, taper: 0.4, alpha: 0.8 });
    stroke(pad, [b, c], INK, { width: 0.004, taper: 0.4, alpha: 0.8 });
  };
  wedge(frame[0], frame[1], far[1], far[0], 0.16, 0.05);
  wedge(frame[3], frame[2], far[2], far[3], 0.3, 0.1);
  wedge(frame[0], frame[3], far[3], far[0], 0.42, -0.7);
  wedge(frame[1], frame[2], far[2], far[1], 0.34, 0.7);

  // The doors, on both walls, each a step further away and a step smaller.
  for (const side of [-1, 1] as const) {
    const edge = side < 0 ? 0 : 1;
    for (let i = 0; i < 3; i++) {
      const t0 = 0.2 + i * 0.24;
      const t1 = t0 + 0.16;
      const x0 = edge + (vx + side * fw - edge) * t0;
      const x1 = edge + (vx + side * fw - edge) * t1;
      const top0 = (vy - fh * 0.5) * t0;
      const top1 = (vy - fh * 0.5) * t1;
      const bot0 = y + 0.12 + (vy + fh * 0.5 - y - 0.12) * t0;
      const bot1 = y + 0.12 + (vy + fh * 0.5 - y - 0.12) * t1;
      const p: Pt[] = [[x0, top0 + (bot0 - top0) * 0.14], [x1, top1 + (bot1 - top1) * 0.14], [x1, bot1], [x0, bot0]];
      pad.shape(p, INK, { alpha: 0.74, sharp: true });
      outline(pad, p, INK, { width: 0.003, taper: 0.4, alpha: 0.9, sharp: true });
    }
  }

  // The far end: a window, or a door with somebody else's light behind it.
  pad.shape(far, r() < 0.5 ? LAMP : INK, { alpha: r() < 0.5 ? 0.4 : 0.8, sharp: true });
  outline(pad, far, INK, { width: 0.005, taper: 0.3, sharp: true });
  stroke(pad, [[0, y + 0.12], [1, y + 0.12]], INK, { width: 0.006, taper: 0.25, wobble: 0.003 });
}

/** A garret: a sloping ceiling, a skylight, and not enough room to stand. */
export function garret(pad: Pad, seed: number, y = 0.78) {
  const r = rng(seed);
  const peak = 0.08 + r() * 0.08;
  // Sharp, because a roof has a ridge. Smoothed it comes out as a rainbow,
  // which is a cheerful thing to put over a man in a garret and wrong.
  stroke(pad, [[0, 0.34 + r() * 0.1], [0.46 + r() * 0.1, peak], [1, 0.3 + r() * 0.12]], INK, {
    width: 0.007,
    taper: 0.2,
    wobble: 0.002,
    sharp: true,
  });
  hatch(pad, [0, 0, 1, 0.3], fade(INK, 0.3), { angle: -0.9, pitch: 30, width: 0.0024, skip: 0.4 });
  window(pad, [0.6 + r() * 0.12, 0.24], 0.17, 0.2, seed);
  stroke(pad, [[0, y], [1, y + 0.006]], INK, { width: 0.005, taper: 0.3, wobble: 0.003 });
  hatch(pad, [0, y, 1, 1], fade(INK, 0.26), { angle: 0.08, pitch: 26, width: 0.0024, skip: 0.5 });
  // A bed, which in a garret is the furniture.
  const bx = 0.06 + r() * 0.1;
  pad.shape([[bx, y], [bx + 0.3, y], [bx + 0.3, y - 0.08], [bx, y - 0.08]], INK, { alpha: 0.8, sharp: true });
  stroke(pad, [[bx, y - 0.08], [bx + 0.3, y - 0.09]], INK, { width: 0.005, taper: 0.3 });
}

// ------------------------------------------------------------------- props

export function window(pad: Pad, at: Pt, w: number, h: number, seed: number) {
  const f: Pt[] = [[at[0], at[1]], [at[0] + w, at[1]], [at[0] + w, at[1] + h], [at[0], at[1] + h]];
  pad.shape(f, LAMP, { alpha: 0.24, sharp: true });
  pad.clip(f, () => {
    stipple(pad, [at[0], at[1], at[0] + w, at[1] + h], fade(INK, 0.5), { n: 200, size: 0.0024, alpha: 0.35 });
    snowInside(pad, at, w, h, seed);
  });
  outline(pad, f, INK, { width: 0.0072, taper: 0.2, sharp: true });
  stroke(pad, [[at[0] + w / 2, at[1]], [at[0] + w / 2, at[1] + h]], INK, { width: 0.005, taper: 0.3 });
  stroke(pad, [[at[0], at[1] + h * 0.44], [at[0] + w, at[1] + h * 0.44]], INK, { width: 0.005, taper: 0.3 });
}

export function candle(pad: Pad, at: Pt, h: number) {
  pad.shape(
    [[at[0] - 0.016, at[1]], [at[0] + 0.016, at[1]], [at[0] + 0.013, at[1] - h], [at[0] - 0.013, at[1] - h]],
    PAPER,
    { alpha: 0.92, sharp: true },
  );
  outline(pad, [[at[0] - 0.016, at[1]], [at[0] + 0.016, at[1]], [at[0] + 0.013, at[1] - h], [at[0] - 0.013, at[1] - h]], INK, {
    width: 0.004,
    taper: 0.3,
    sharp: true,
  });
  glow(pad, [at[0], at[1] - h - 0.02], 0.14);
  pad.blob([at[0], at[1] - h - 0.018], 0.008, 0.018, 0, LAMP, { alpha: 0.95 });
}

export function glass(pad: Pad, at: Pt, h: number) {
  const w = h * 0.52;
  const p: Pt[] = [
    [at[0] - w, at[1] - h], [at[0] + w, at[1] - h],
    [at[0] + w * 0.72, at[1]], [at[0] - w * 0.72, at[1]],
  ];
  pad.shape(p, PAPER, { alpha: 0.24, sharp: true });
  outline(pad, p, INK, { width: 0.0038, taper: 0.35, sharp: true });
  stroke(pad, [[at[0] - w * 0.8, at[1] - h * 0.36], [at[0] + w * 0.8, at[1] - h * 0.36]], INK, {
    width: 0.003,
    taper: 0.5,
    alpha: 0.6,
  });
}

export function lamp(pad: Pad, at: Pt, h: number) {
  glow(pad, [at[0], at[1] - h * 0.55], 0.3);
  const shade: Pt[] = [
    [at[0] - h * 0.34, at[1] - h * 0.5], [at[0] + h * 0.34, at[1] - h * 0.5],
    [at[0] + h * 0.16, at[1] - h], [at[0] - h * 0.16, at[1] - h],
  ];
  pad.shape(shade, INK, { alpha: 0.92, sharp: true });
  stroke(pad, [[at[0], at[1]], [at[0], at[1] - h * 0.5]], INK, { width: 0.005, taper: 0.3 });
  pad.blob([at[0], at[1] - h * 0.42], 0.03, 0.012, 0, LAMP, { alpha: 0.8 });
}

export function streetLamp(pad: Pad, at: Pt, h: number) {
  stroke(pad, [[at[0], at[1]], [at[0], at[1] - h]], INK, { width: 0.008, taper: 0.2 });
  glow(pad, [at[0], at[1] - h - 0.02], 0.34);
  pad.shape(
    [
      [at[0] - 0.03, at[1] - h], [at[0] + 0.03, at[1] - h],
      [at[0] + 0.045, at[1] - h - 0.06], [at[0] - 0.045, at[1] - h - 0.06],
    ],
    INK,
    { alpha: 0.9, sharp: true },
  );
  pad.blob([at[0], at[1] - h - 0.03], 0.024, 0.02, 0, LAMP, { alpha: 0.9 });
}

/** Light, as concentric washes. The only warm thing in the medium. */
export function glow(pad: Pad, at: Pt, r: number) {
  for (let i = 8; i > 0; i--) {
    const t = i / 8;
    pad.blob(at, r * t, r * t, 0, LAMP, { alpha: 0.05 * (1 - t) + 0.01 });
  }
}

export function snow(pad: Pad, seed: number, amount = 1) {
  const r = rng(seed ^ 0x5f5);
  const n = Math.round(260 * amount * Math.min(1, pad.w / 300 + 0.35));
  for (let i = 0; i < n; i++) {
    const x = r();
    const y = r() * H;
    const s = 0.0022 + r() * 0.004;
    pad.blob([x, y], s, s, 0, PAPER, { alpha: 0.3 + r() * 0.5 });
  }
  // A few streaks, because it is always blowing.
  for (let i = 0; i < 22; i++) {
    const x = r();
    const y = r() * H;
    stroke(pad, [[x, y], [x - 0.03, y + 0.05]], PAPER, { width: 0.0026, taper: 0.7, alpha: 0.25 });
  }
}

function snowInside(pad: Pad, at: Pt, w: number, h: number, seed: number) {
  const r = rng(seed ^ 0x77);
  for (let i = 0; i < 60; i++) {
    const x = at[0] + r() * w;
    const y = at[1] + r() * h;
    pad.blob([x, y], 0.0024, 0.0024, 0, PAPER, { alpha: 0.4 + r() * 0.4 });
  }
}

/** The paper, and the plate mark it was printed inside. */
export function sheet(pad: Pad, seed: number) {
  const g = pad.g;
  const r = rng(seed);
  g.fillStyle = PAPER;
  g.fillRect(0, 0, pad.w, pad.h);
  const grad = g.createLinearGradient(0, 0, 0, pad.h);
  grad.addColorStop(0, 'rgba(255,253,246,0.5)');
  grad.addColorStop(1, 'rgba(150,142,126,0.22)');
  g.fillStyle = grad;
  g.fillRect(0, 0, pad.w, pad.h);
  // The fleck count follows the size of the sheet rather than being fixed.
  // Nine hundred of them on a hundred-and-sixty-pixel thumbnail is nine
  // hundred marks nobody will ever see, times a thousand panels, and it was
  // most of the bake.
  const flecks = Math.round(Math.min(1100, Math.max(150, pad.w * 2.1)));
  for (let i = 0; i < flecks; i++) {
    const x = r();
    const y = r() * (pad.h / pad.w);
    const a = r() * Math.PI;
    const l = 0.002 + r() * 0.01;
    pad.line([[x, y], [x + Math.cos(a) * l, y + Math.sin(a) * l]], r() < 0.5 ? '#b9b0a0' : '#fffdf6', {
      width: 0.0026,
      alpha: 0.05 + r() * 0.08,
    });
  }
}

/** The mark the plate leaves in the paper: a bevelled rectangle. */
export function plateMark(pad: Pad, box: [number, number, number, number]) {
  const [x0, y0, x1, y1] = box;
  const p: Pt[] = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
  outline(pad, p, fade(INK, 0.4), { width: 0.0032, taper: 0.2, wobble: 0.0016, sharp: true });
  outline(
    pad,
    p.map(([x, y]): Pt => [x + (x < 0.5 ? -0.006 : 0.006), y + (y < (y0 + y1) / 2 ? -0.006 : 0.006)]),
    '#ffffff',
    { width: 0.004, taper: 0.3, alpha: 0.28, sharp: true },
  );
}

export { resample };
