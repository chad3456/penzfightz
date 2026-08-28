import { Sheet, hexToRgb, mulberry, PAPERS, type Rgb } from './sheet';
import { drag, inEllipse, scrub, wander, type Nib, type Pt } from './nib';

/**
 * A face in two crayons.
 *
 * The discipline is the idea. **Two sticks and not many marks**: one black, one
 * colour, on a page that is mostly empty. Everything interesting comes out of
 * what that forbids — you cannot render, you cannot shade, you cannot correct,
 * so every mark has to be the right one first time and the drawing has to be
 * carried by *gesture* rather than by accuracy.
 *
 * Three rules the grammar keeps to, all of them taken off the reference:
 *
 * **The contour is open.** A head drawn as a closed loop reads as a balloon
 * with a face in it. The one in the reference is a single stroke down one side,
 * round the jaw and part-way up the other, and it simply stops — the hat and
 * the eye do the rest of the work of saying "head". Closing that gap is the
 * fastest way to lose the whole style.
 *
 * **The colour is off-register.** The orange is laid first and does not line up
 * with the black. It sits half off the cheek, it crosses an eye, it runs past
 * the jaw. Align them and it turns into a colouring book.
 *
 * **The two eyes disagree.** One is a blot, the other is a dot; one has colour
 * across it and the other does not. Symmetry is the other thing that kills it.
 */

const BLACK = '#141414';

/**
 * One accent per face, and only one.
 *
 * Vermilion is the reference's, and is weighted to about half the sheet so the
 * wall reads as that drawing rather than as a paint chart. The rest are there
 * because two hundred identical colour schemes is a swatch, not a set.
 */
const ACCENTS = [
  '#f0431c', '#f0431c', '#f0431c', '#f0431c', '#f0431c', '#f0431c',
  '#ee5a26', '#ee5a26', '#d4232f', '#d4232f', '#e8a417', '#e8a417',
  '#1f6fb2', '#2f8f6a', '#c2378f', '#5a3fb8', '#8a5a2f',
];

// ------------------------------------------------------------------- the genes

export const FAMILIES = {
  /** Skull: rounded block, egg, wedge, tall, potato, pear. */
  head: 6,
  /** What is on top: toque, mop, sweep, knot, cap, bare, kerchief, spikes. */
  crown: 8,
  /** Eyes, always a mismatched pair of these. */
  eyes: 7,
  nose: 5,
  mouth: 6,
  /** Below the chin: V collar, lapels, round collar, high neck, bare, scarf. */
  collar: 6,
  /** Where the colour goes. */
  mark: 7,
  /** Floating marks around the head: ticks, a flick, a halo scribble, none. */
  air: 5,
} as const;

export type Family = keyof typeof FAMILIES;

export interface Recipe {
  seed: number;
  accent: string;
  paper: number;
  /** Family choices, one per family. */
  pick: Record<Family, number>;
  /** How far the colour is printed out of register, in face units. */
  offX: number;
  offY: number;
  /** Overall weight of hand, 0 light to 1 heavy. */
  weight: number;
  tilt: number;
  /** A signature of the choices, used to keep two hundred faces distinct. */
  key: string;
}

const FAMS = Object.keys(FAMILIES) as Family[];

export function makeRecipe(seed: number): Recipe {
  const r = mulberry(seed);
  const pick = {} as Record<Family, number>;
  for (const f of FAMS) pick[f] = Math.floor(r() * FAMILIES[f]);
  return {
    seed,
    accent: ACCENTS[Math.floor(r() * ACCENTS.length)],
    paper: Math.floor(r() * PAPERS),
    pick,
    offX: (r() - 0.5) * 0.12,
    offY: (r() - 0.5) * 0.12,
    weight: 0.35 + r() * 0.65,
    tilt: (r() - 0.5) * 0.44,
    key: FAMS.map((f) => pick[f]).join('-'),
  };
}

/**
 * A gallery of distinct faces.
 *
 * Not a search and not a model — a rejection sampler. Draw a recipe, throw it
 * away if that exact set of family choices has already been used, and keep
 * going. It guarantees two hundred genuinely different *drawings* rather than
 * two hundred rolls of a die that happen to repeat, which at these odds they
 * would: eight families give a large space but the birthday problem does not
 * care how large a space is.
 */
export function gallery(count: number, seed = 1): Recipe[] {
  const out: Recipe[] = [];
  const seen = new Set<string>();
  let s = seed;
  let tries = 0;
  while (out.length < count && tries < count * 400) {
    tries++;
    const rec = makeRecipe((s = (s * 1103515245 + 12345) >>> 0));
    if (seen.has(rec.key)) continue;
    seen.add(rec.key);
    out.push(rec);
  }
  return out;
}

// ------------------------------------------------------------------ the hand

interface Hand {
  sheet: Sheet;
  r: () => number;
  /** Face-unit to pixel. */
  u: number;
  cx: number;
  cy: number;
  ink: Rgb;
  col: Rgb;
  rec: Recipe;
  n: number;
}

/** Face units to page pixels, with the head's tilt applied. */
function px(h: Hand, x: number, y: number): Pt {
  const c = Math.cos(h.rec.tilt);
  const s = Math.sin(h.rec.tilt);
  return [h.cx + (x * c - y * s) * h.u, h.cy + (x * s + y * c) * h.u];
}

const P = (h: Hand, pts: [number, number][]): Pt[] => pts.map(([x, y]) => px(h, x, y));

function nib(h: Hand, colour: Rgb, width: number, o: Partial<Nib> = {}): Nib {
  return {
    colour,
    width: width * h.u * (0.85 + h.rec.weight * 0.4),
    bite: o.bite ?? 0.94,
    hand: o.hand ?? 1,
    fray: o.fray ?? 0.26,
  };
}

const line = (h: Hand, pts: [number, number][], n: Nib) => drag(h.sheet, P(h, pts), n, h.n++);

/** An arc in face units, given as a list of points. */
function arc(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  a0: number,
  a1: number,
  steps = 14,
): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const a = a0 + ((a1 - a0) * i) / steps;
    out.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
  }
  return out;
}

// ------------------------------------------------------------------ the marks

/**
 * The skull.
 *
 * A **superellipse**, not a circle: one exponent takes it from an egg through to
 * a rounded block with near-vertical sides and a flat jaw, which is what the
 * reference head actually is. Drawn as an open arc with a gap left at the top —
 * a closed loop reads as a balloon with a face in it, and closing that gap is
 * the single fastest way to lose the style.
 */
function head(h: Hand) {
  const kind = h.rec.pick.head;
  //           block  egg   wedge  tall  potato  pear
  const W = [0.5, 0.44, 0.52, 0.4, 0.55, 0.45][kind];
  const T = [0.54, 0.58, 0.46, 0.68, 0.5, 0.6][kind];
  const N = [3.6, 2.1, 2.4, 3.2, 2.6, 2.2][kind];
  const jaw = [1.02, 1, 0.82, 0.96, 1.1, 1.18][kind];
  const wob = wander(h.n++);

  const shape = (a: number): [number, number] => {
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    const k = 2 / N;
    const x = Math.sign(ca) * Math.abs(ca) ** k * W;
    let y = Math.sign(sa) * Math.abs(sa) ** k * T;
    if (y > 0) y *= jaw;
    // Nothing a hand draws is exactly anything.
    const lump = 1 + wob(a * 1.6 + 3) * 0.09;
    return [x * lump, y * lump];
  };

  // Gap at the top, roughly where a hat or a fringe would cover it.
  const gap = 0.5 + h.r() * 0.7;
  const from = -Math.PI / 2 + gap / 2;
  const to = from + Math.PI * 2 - gap;
  const main: [number, number][] = [];
  for (let i = 0; i <= 44; i++) main.push(shape(from + ((to - from) * i) / 44));
  line(h, main, nib(h, h.ink, 0.055, { fray: 0.3 }));

  // Sometimes a second, shorter stroke across the gap that does not quite meet
  // either end of the first.
  if (h.r() < 0.4) {
    const g0 = to + 0.12 + h.r() * 0.2;
    const g1 = from + Math.PI * 2 - 0.12 - h.r() * 0.2;
    if (g1 > g0) {
      const cap: [number, number][] = [];
      for (let i = 0; i <= 10; i++) cap.push(shape(g0 + ((g1 - g0) * i) / 10));
      line(h, cap, nib(h, h.ink, 0.04, { fray: 0.38 }));
    }
  }
}

function crown(h: Hand) {
  const kind = h.rec.pick.crown;
  const t = 0.52;
  const N = nib(h, h.ink, 0.046, { fray: 0.3 });
  if (kind === 0) {
    // A toque: a tall soft loop sitting clear of the crown, with a tie flicking
    // off it. The first version drew the loop flush with the skull and the ties
    // straight up, and the whole thing read as a pair of antennae.
    line(h, arc(0, -t * 1.06, 0.42, 0.34, Math.PI * 0.04, Math.PI * 1.96, 24), N);
    line(h, arc(0, -t * 0.7, 0.34, 0.12, Math.PI, Math.PI * 2, 10), nib(h, h.ink, 0.03));
    const s = h.r() < 0.5 ? -1 : 1;
    line(
      h,
      [
        [s * 0.34, -t * 1.22],
        [s * (0.6 + h.r() * 0.22), -t * (1.38 + h.r() * 0.2)],
        [s * (0.44 + h.r() * 0.2), -t * (1.5 + h.r() * 0.12)],
      ],
      nib(h, h.ink, 0.028, { fray: 0.45 }),
    );
  } else if (kind === 1) {
    // A mop: three or four overlapping scribbles.
    for (let i = 0; i < 3 + Math.floor(h.r() * 2); i++) {
      const a = -Math.PI * 0.9 + (i / 4) * Math.PI * 0.8;
      const pts: [number, number][] = [];
      for (let k = 0; k <= 7; k++) {
        const u = k / 7;
        pts.push([
          Math.cos(a + u * 1.5) * (0.5 + u * 0.2) + (h.r() - 0.5) * 0.06,
          Math.sin(a + u * 1.5) * t * (1 + u * 0.35) + (h.r() - 0.5) * 0.06,
        ]);
      }
      line(h, pts, nib(h, h.ink, 0.04, { fray: 0.4 }));
    }
  } else if (kind === 2) {
    // One long sweep over the top and down a side.
    line(
      h,
      [
        [-0.52, -t * 0.3],
        [-0.34, -t * 1.22],
        [0.22, -t * 1.3],
        [0.55, -t * 0.72],
        [0.5, -t * 0.1],
      ],
      nib(h, h.ink, 0.058, { fray: 0.28 }),
    );
  } else if (kind === 3) {
    // A knot, sat on top.
    line(h, arc(0.05, -t * 1.06, 0.16, 0.15, 0, Math.PI * 2.1, 16), nib(h, h.ink, 0.042));
    line(h, arc(0, -t * 0.86, 0.4, 0.2, Math.PI, Math.PI * 2, 12), N);
  } else if (kind === 4) {
    // A cap: a dome and a peak off one side.
    line(h, arc(0, -t * 0.86, 0.46, 0.32, Math.PI, Math.PI * 2, 14), N);
    const s = h.r() < 0.5 ? -1 : 1;
    line(
      h,
      [
        [s * 0.4, -t * 0.86],
        [s * 0.82, -t * 0.96],
        [s * 0.78, -t * 0.74],
      ],
      nib(h, h.ink, 0.04),
    );
  } else if (kind === 5) {
    // Bare, but for one line where the hair would start.
    line(h, arc(0, -t * 0.55, 0.34, 0.16, Math.PI * 1.1, Math.PI * 1.9, 10), nib(h, h.ink, 0.034));
  } else if (kind === 6) {
    // A kerchief: a band and a knot to one side.
    line(h, arc(0, -t * 0.66, 0.5, 0.24, Math.PI, Math.PI * 2, 14), nib(h, h.ink, 0.05));
    const s = h.r() < 0.5 ? -1 : 1;
    line(
      h,
      [
        [s * 0.44, -t * 0.62],
        [s * 0.66, -t * 0.5],
        [s * 0.52, -t * 0.34],
      ],
      nib(h, h.ink, 0.034),
    );
  } else {
    // Spikes.
    for (let i = 0; i < 5; i++) {
      const x = -0.36 + (i / 4) * 0.72;
      line(
        h,
        [
          [x, -t * 0.6],
          [x + (h.r() - 0.5) * 0.14, -t * (1.05 + h.r() * 0.35)],
        ],
        nib(h, h.ink, 0.03, { fray: 0.45 }),
      );
    }
  }
}

/** One eye. The two are always drawn from different families. */
function eye(h: Hand, x: number, y: number, kind: number, big: number) {
  const N = nib(h, h.ink, 0.036);
  if (kind === 0) {
    // A blot.
    scrub(
      h.sheet,
      inEllipse(...px(h, x, y), 0.1 * big * h.u, 0.125 * big * h.u, 0.2, h.n),
      { x0: px(h, x, y)[0] - 20 * big, y0: px(h, x, y)[1] - 24 * big,
        x1: px(h, x, y)[0] + 20 * big, y1: px(h, x, y)[1] + 24 * big },
      nib(h, h.ink, 0.016, { bite: 1.15 }),
      h.n++,
      { passes: 3 },
    );
  } else if (kind === 1) {
    line(h, arc(x, y, 0.088 * big, 0.088 * big, 0, Math.PI * 2.15, 14), N);
  } else if (kind === 2) {
    // Closed: a contented arc.
    line(h, arc(x, y, 0.09 * big, 0.05 * big, Math.PI, Math.PI * 2, 8), N);
  } else if (kind === 3) {
    // A short bar.
    line(h, [[x - 0.095 * big, y], [x + 0.095 * big, y + 0.01]], nib(h, h.ink, 0.044));
  } else if (kind === 4) {
    // A dot with a lash.
    scrub(
      h.sheet,
      inEllipse(...px(h, x, y), 0.052 * big * h.u, 0.052 * big * h.u, 0, h.n),
      { x0: px(h, x, y)[0] - 12, y0: px(h, x, y)[1] - 12, x1: px(h, x, y)[0] + 12, y1: px(h, x, y)[1] + 12 },
      nib(h, h.ink, 0.014, { bite: 1.2 }),
      h.n++,
      { passes: 2 },
    );
    line(h, [[x - 0.07, y - 0.08], [x + 0.06, y - 0.11]], nib(h, h.ink, 0.024));
  } else if (kind === 5) {
    // Spectacle: a ring with a bridge.
    line(h, arc(x, y, 0.11 * big, 0.1 * big, 0, Math.PI * 2.1, 16), nib(h, h.ink, 0.028));
    line(h, [[x + 0.11 * big, y], [x + 0.21, y - 0.01]], nib(h, h.ink, 0.022));
  } else {
    // A scribble where an eye should be.
    const pts: [number, number][] = [];
    for (let i = 0; i <= 9; i++) {
      pts.push([x + Math.cos(i * 2.2) * 0.06 * big, y + Math.sin(i * 1.7) * 0.06 * big]);
    }
    line(h, pts, nib(h, h.ink, 0.026, { fray: 0.45 }));
  }
}

function nose(h: Hand) {
  const kind = h.rec.pick.nose;
  if (kind === 4) return;
  const x = -0.02 + (h.r() - 0.5) * 0.12;
  const N = nib(h, h.ink, 0.034);
  if (kind === 0) line(h, [[x, 0.02], [x - 0.06, 0.15], [x + 0.05, 0.16]], N);
  else if (kind === 1) line(h, [[x, 0.05], [x + 0.02, 0.19]], nib(h, h.ink, 0.04));
  else if (kind === 2) line(h, arc(x, 0.12, 0.07, 0.06, Math.PI * 0.9, Math.PI * 2.1, 8), N);
  else line(h, [[x - 0.07, 0.14], [x + 0.07, 0.12]], N);
}

function mouth(h: Hand) {
  const kind = h.rec.pick.mouth;
  const y = 0.3 + (h.r() - 0.5) * 0.08;
  const w = 0.14 + h.r() * 0.14;
  const N = nib(h, h.ink, 0.042);
  if (kind === 0) line(h, [[-w, y], [w, y + (h.r() - 0.5) * 0.05]], N);
  else if (kind === 1) line(h, arc(0, y - 0.05, w, 0.09, 0.2, Math.PI - 0.2, 10), N);
  else if (kind === 2) line(h, arc(0, y + 0.06, w, 0.08, Math.PI + 0.25, Math.PI * 2 - 0.25, 10), N);
  else if (kind === 3) {
    scrub(
      h.sheet,
      inEllipse(...px(h, 0, y), w * 0.75 * h.u, 0.06 * h.u, 0, h.n),
      { x0: px(h, 0, y)[0] - w * 1.4 * h.u, y0: px(h, 0, y)[1] - 0.14 * h.u,
        x1: px(h, 0, y)[0] + w * 1.4 * h.u, y1: px(h, 0, y)[1] + 0.14 * h.u },
      nib(h, h.ink, 0.016, { bite: 1.1 }),
      h.n++,
      { passes: 2 },
    );
  } else if (kind === 4) {
    line(h, [[-w, y], [-w * 0.2, y + 0.05], [w * 0.4, y - 0.03], [w, y + 0.02]], nib(h, h.ink, 0.03));
  } else {
    line(h, arc(0, y, w * 0.7, 0.075, 0, Math.PI * 2.1, 12), nib(h, h.ink, 0.03));
  }
}

function collar(h: Hand) {
  const kind = h.rec.pick.collar;
  const y = 0.62;
  const N = nib(h, h.ink, 0.055, { fray: 0.24 });
  if (kind === 5) return;
  // Neck, always: two short strokes that do not meet the jaw.
  line(h, [[-0.16, y - 0.08], [-0.2, y + 0.12]], nib(h, h.ink, 0.038));
  line(h, [[0.18, y - 0.08], [0.22, y + 0.12]], nib(h, h.ink, 0.038));

  if (kind === 0) {
    line(h, [[-0.62, y + 0.55], [-0.1, y + 0.16], [0.06, y + 0.34]], N);
    line(h, [[0.66, y + 0.5], [0.16, y + 0.16], [0.06, y + 0.34]], N);
  } else if (kind === 1) {
    line(h, [[-0.7, y + 0.6], [-0.24, y + 0.14]], N);
    line(h, [[0.72, y + 0.56], [0.24, y + 0.14]], N);
    line(h, [[-0.05, y + 0.18], [-0.02, y + 0.66]], nib(h, h.ink, 0.034));
  } else if (kind === 2) {
    line(h, arc(0, y + 0.2, 0.36, 0.2, 0.15, Math.PI - 0.15, 12), N);
    line(h, [[-0.66, y + 0.6], [-0.34, y + 0.24]], N);
    line(h, [[0.68, y + 0.58], [0.36, y + 0.24]], N);
  } else if (kind === 3) {
    line(h, [[-0.3, y + 0.06], [-0.34, y + 0.4]], N);
    line(h, [[0.32, y + 0.06], [0.36, y + 0.4]], N);
    line(h, [[-0.34, y + 0.4], [0.36, y + 0.36]], nib(h, h.ink, 0.038));
  } else {
    // A scarf: a loop and a hanging end.
    line(h, arc(0, y + 0.2, 0.34, 0.16, 0, Math.PI * 2.1, 14), N);
    line(h, [[0.2, y + 0.3], [0.34, y + 0.7], [0.24, y + 0.86]], nib(h, h.ink, 0.04));
  }

  // Buttons, sometimes.
  if (h.r() < 0.55) {
    for (let i = 0; i < 2 + Math.floor(h.r() * 3); i++) {
      const bx = 0.12 + h.r() * 0.42;
      const by = y + 0.3 + i * 0.16 + h.r() * 0.05;
      line(h, [[bx, by], [bx + 0.04, by + 0.025]], nib(h, h.ink, 0.022, { hand: 0.6 }));
    }
  }
}

/** Where the colour goes. Laid before the ink, and never quite lined up. */
function colourMark(h: Hand) {
  const kind = h.rec.pick.mark;
  const dx = h.rec.offX;
  const dy = h.rec.offY;
  const C = nib(h, h.col, 0.055, { bite: 1.0, fray: 0.3 });
  const put = (cx: number, cy: number, rx: number, ry: number, rot = 0) => {
    const [ax, ay] = px(h, cx + dx, cy + dy);
    scrub(
      h.sheet,
      inEllipse(ax, ay, rx * h.u, ry * h.u, rot, h.n),
      { x0: ax - rx * 2.2 * h.u, y0: ay - ry * 2.2 * h.u, x1: ax + rx * 2.2 * h.u, y1: ay + ry * 2.2 * h.u },
      nib(h, h.col, 0.02, { bite: 1.05 }),
      h.n++,
      { passes: 3 },
    );
  };

  if (kind === 0) put(-0.46, 0.16, 0.17, 0.16);
  else if (kind === 1) {
    put(-0.46, 0.14, 0.15, 0.14);
    put(0.12, -0.16, 0.26, 0.12, -0.25);
  } else if (kind === 2) put(0.08, -0.15, 0.3, 0.13, -0.2);
  else if (kind === 3) {
    // A slash across the cheek, drawn not scrubbed.
    line(h, [[-0.56 + dx, -0.06 + dy], [0.16 + dx, 0.14 + dy]], C);
  } else if (kind === 4) {
    // A band across the crown.
    line(h, [[-0.56 + dx, -0.5 + dy], [0.56 + dx, -0.57 + dy]], nib(h, h.col, 0.08, { bite: 1.0 }));
  } else if (kind === 5) {
    put(-0.44, 0.14, 0.14, 0.13);
    put(0.44, 0.16, 0.14, 0.13);
  } else {
    // A loose scribble over one side of the face, like the flame.
    const pts: [number, number][] = [];
    for (let i = 0; i <= 22; i++) {
      const t = i / 22;
      pts.push([-0.4 + dx + t * 0.55, -0.3 + dy + Math.sin(t * 8) * 0.16 + t * 0.2]);
    }
    line(h, pts, nib(h, h.col, 0.05, { bite: 0.95, fray: 0.35 }));
  }
}

/** Marks in the air around the head: the flicks and ticks in the reference. */
function air(h: Hand) {
  const kind = h.rec.pick.air;
  if (kind === 4) return;
  const n = kind === 0 ? 2 : kind === 1 ? 3 : kind === 2 ? 1 : 4;
  for (let i = 0; i < n; i++) {
    const a = -Math.PI * 0.95 + h.r() * Math.PI * 0.9;
    const rad = 0.85 + h.r() * 0.5;
    const x = Math.cos(a) * rad;
    const y = Math.sin(a) * rad * 0.9 - 0.2;
    const len = 0.06 + h.r() * 0.12;
    const dir = h.r() * Math.PI;
    line(
      h,
      [
        [x, y],
        [x + Math.cos(dir) * len, y + Math.sin(dir) * len],
      ],
      nib(h, kind === 3 ? h.ink : h.col, 0.034, { fray: 0.35 }),
    );
  }
}

// ----------------------------------------------------------------- assembly

/**
 * Draw one face onto a fresh sheet.
 *
 * The order is the order a person would work in: colour first, because it is
 * laid down as a block and everything else has to sit on top of it, then the
 * contour, then the hat, then the features, then the body. Draw the colour last
 * and it covers the eyes; draw the hat before the head and it sits behind it.
 */
/** Which parts of a head to put down. */
export interface HeadParts {
  /** The blush and the smear. Off for a small head, where they only muddy it. */
  colour?: boolean;
  /** The neck, jacket and buttons. Off when a body is going to supply them. */
  collar?: boolean;
  /** The ticks and flicks in the air around the head. */
  air?: boolean;
}

/**
 * Draw a head into an existing sheet, at a given place and size.
 *
 * Split out of `drawFace` so the figures can use the same faces the gallery
 * does — a head on a body is the same head, at a twelfth of the height instead
 * of a third, with the collar left off because the body has shoulders of its
 * own. Nothing about the grammar is duplicated.
 */
export function drawHead(
  sheet: Sheet,
  rec: Recipe,
  cx: number,
  cy: number,
  u: number,
  parts: HeadParts = {},
) {
  const r = mulberry(rec.seed ^ 0x2f1b);
  const hand: Hand = {
    sheet,
    r,
    u,
    cx,
    cy,
    ink: hexToRgb(BLACK),
    col: hexToRgb(rec.accent),
    rec,
    n: rec.seed & 0xffff,
  };

  if (parts.colour !== false) colourMark(hand);
  head(hand);
  crown(hand);

  // The two eyes are drawn from different families on purpose. A matched pair
  // is the single quickest way to make this read as a cartoon rather than as a
  // drawing.
  const a = rec.pick.eyes;
  const b = (a + 1 + Math.floor(r() * (FAMILIES.eyes - 1))) % FAMILIES.eyes;
  const gap = 0.17 + r() * 0.1;
  const ey = -0.1 + (r() - 0.5) * 0.1;
  eye(hand, -gap, ey + (r() - 0.5) * 0.06, a, 0.9 + r() * 0.5);
  eye(hand, gap, ey + (r() - 0.5) * 0.06, b, 0.9 + r() * 0.5);

  nose(hand);
  mouth(hand);
  if (parts.collar !== false) collar(hand);
  if (parts.air !== false) air(hand);
}

export function drawFace(rec: Recipe, w: number, h: number): Sheet {
  const sheet = new Sheet(w, h, rec.seed, rec.paper);
  const r = mulberry(rec.seed ^ 0x91c5);
  drawHead(
    sheet,
    rec,
    w * (0.5 + (r() - 0.5) * 0.06),
    h * (0.44 + (r() - 0.5) * 0.05),
    // The head is about a third of the sheet's height, which leaves the page as
    // empty as the reference keeps it.
    Math.min(w, h) * 0.34,
  );
  return sheet;
}

/** Names, so a face on the wall can be referred to. */
const FIRST = [
  'Study', 'Head', 'Portrait', 'Figure', 'Sketch', 'Sitter', 'Face', 'Profile',
];
const OF = [
  'in vermilion', 'at the window', 'looking away', 'with the hat on', 'after lunch',
  'in one sitting', 'from memory', 'with a cold', 'unfinished', 'in two colours',
  'on the last page', 'before the light went', 'without the glasses', 'listening',
  'at the back', 'who would not sit still', 'in a hurry', 'with the collar up',
];

export function nameOf(rec: Recipe, index: number): string {
  const r = mulberry(rec.seed ^ 0x77ab);
  return `${FIRST[Math.floor(r() * FIRST.length)]} no. ${String(index + 1).padStart(3, '0')} — ${OF[Math.floor(r() * OF.length)]}`;
}

export { wander };
