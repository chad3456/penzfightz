import type { Pad, Pt } from '../flat/pad';
import { contourHatch, crosshatch, fade, hatch, rng, stipple, stroke } from '../cards/ink';

/**
 * A face, built rather than drawn.
 *
 * Nothing here is a picture of anybody. A face is a set of landmarks in three
 * dimensions — brow, eye line, nose base, mouth line, chin — and a head turned
 * three-quarters is those landmarks rotated about a vertical axis and drawn
 * flat. Do it that way and the far eye foreshortens, the far cheek disappears
 * behind the nose and the near ear goes out of frame, all of them for free, all
 * of them correct. Warp a front view sideways instead — which is the tempting
 * shortcut — and you get a face that is looking at you and pretending not to.
 *
 * The register is 1840s Petersburg book illustration: pen line, hatching along
 * the form, a single wash for the shadow side. The gaze does most of the work,
 * so the eyes get more parameters than everything else together.
 */

export const PAPER = '#f0e7d3';
export const INK = '#2c2419';
export const BLUSH = '#a8543f';

export type Hair =
  | 'parted'
  | 'gathered'
  | 'loose'
  | 'braid'
  | 'chignon'
  | 'ringlets'
  | 'scarf'
  | 'hood'
  | 'bonnet'
  | 'crownplait'
  | 'fringe'
  | 'wind';

export type Collar = 'none' | 'lace' | 'high' | 'shawl' | 'fur' | 'ribbon' | 'open';

/** Everything that makes one of these different from the next. */
export interface Genes {
  /** Rotation about the vertical axis, radians. Positive turns to her left. */
  turn: number;
  /** Roll in the picture plane. */
  tilt: number;
  /** Chin lifted or dropped, as a fraction of head height. */
  lift: number;

  width: number;
  jaw: number;
  chin: number;
  brow: number;

  eye: number;
  /** Outer corner above the inner one, which is most of what "a look" is. */
  canthal: number;
  /** 0 wide open, 1 nearly closed. */
  lidded: number;
  iris: number;
  lash: number;
  /** Where she is looking, relative to the eye. */
  gaze: [number, number];

  browArch: number;
  browWeight: number;
  browLift: number;

  nose: number;
  noseWide: number;

  mouth: number;
  lip: number;
  smile: number;
  part: number;

  hair: Hair;
  mass: number;
  flow: number;
  dark: number;

  collar: Collar;
  neck: number;
  shoulder: number;

  /** Which side the light is on. */
  light: number;
  key: number;
  earring: boolean;
  mole: boolean;
  freckles: boolean;
}

const HAIRS: Hair[] = [
  'parted', 'gathered', 'loose', 'braid', 'chignon', 'ringlets',
  'scarf', 'hood', 'bonnet', 'crownplait', 'fringe', 'wind',
];
const COLLARS: Collar[] = ['none', 'lace', 'high', 'shawl', 'fur', 'ribbon', 'open'];

/**
 * Genes from a seed.
 *
 * The ranges matter more than the values. Too narrow and a thousand of these
 * are one face a thousand times; too wide and half of them are not faces. Every
 * range below is the widest one that still produced a face on the contact
 * sheet, which is the only way to set a range like this.
 */
export function genes(seed: number): Genes {
  const r = rng(seed);
  const pick = <T,>(l: T[]) => l[Math.floor(r() * l.length) % l.length];
  const turn = (r() - 0.45) * 1.45;
  return {
    turn,
    tilt: (r() - 0.5) * 0.34,
    lift: (r() - 0.5) * 0.07,

    width: 0.315 + r() * 0.055,
    jaw: 0.88 + r() * 0.26,
    chin: 0.3 + r() * 0.16,
    brow: 0.4 + r() * 0.03,

    eye: 0.085 + r() * 0.026,
    canthal: (r() - 0.28) * 0.09,
    lidded: 0.12 + r() * r() * 0.62,
    iris: 0.35 + r() * 0.1,
    lash: r() * r(),
    gaze: [(r() - 0.5) * 0.5, (r() - 0.55) * 0.34],

    browArch: 0.3 + r() * 0.7,
    browWeight: 0.5 + r() * 0.8,
    browLift: 0.05 + r() * 0.045,

    nose: 0.6 + r() * 0.24,
    noseWide: 0.7 + r() * 0.5,

    mouth: 0.115 + r() * 0.042,
    lip: 0.6 + r() * 0.7,
    smile: (r() - 0.34) * 0.055,
    part: r() < 0.4 ? r() * 0.02 : 0,

    hair: pick(HAIRS),
    mass: 0.7 + r() * 0.6,
    flow: r(),
    dark: 0.4 + r() * 0.6,

    collar: pick(COLLARS),
    neck: 0.12 + r() * 0.08,
    shoulder: 0.5 + r() * 0.5,

    light: turn > 0 ? (r() < 0.7 ? -1 : 1) : r() < 0.7 ? 1 : -1,
    key: 0.4 + r() * 0.6,
    earring: r() < 0.34,
    mole: r() < 0.14,
    freckles: r() < 0.18,
  };
}

/**
 * The head's own coordinate frame.
 *
 * `x` runs across the face from her right to her left, `y` down from the crown,
 * `z` out of the face towards the viewer — all in head-heights, with the origin
 * at the crown's centre. `P` turns one of those into a point on the pad, and it
 * is the only place the projection lives.
 */
export interface Head {
  P: (x: number, y: number, z?: number) => Pt;
  g: Genes;
  /** Head height in pad units. */
  h: number;
  /** Half-width of the skull at a given y. */
  wide: (y: number) => number;
  /** Screen-space x of the face's midline at a given y. */
  mid: (y: number) => number;
  /** How much the near side is the near side. */
  toward: number;
}

/** The half-width of a head at ten heights, as a fraction of its widest. */
const PROFILE: [number, number][] = [
  [0.0, 0.5], [0.08, 0.8], [0.17, 0.94], [0.3, 1.0],
  [0.44, 0.99], [0.55, 0.97], [0.66, 0.9], [0.76, 0.78],
  [0.87, 0.56], [1.0, 0.2],
];

export function head(g: Genes, at: Pt, size: number): Head {
  const c = Math.cos(g.turn);
  const s = Math.sin(g.turn);
  const ct = Math.cos(g.tilt);
  const st = Math.sin(g.tilt);
  const P = (x: number, y: number, z = 0): Pt => {
    const rx = x * c + z * s;
    const ry = y - 0.5 + g.lift * (x * s - z * c);
    return [at[0] + (rx * ct - ry * st) * size, at[1] + (ry * ct + rx * st) * size];
  };
  const wide = (y: number) => {
    // Measured off the profile rather than fitted to a curve. A single sine
    // gives an egg, and an egg with eyes on it is not a face: what makes a head
    // read is that it is widest at the temples *and* at the cheekbone with a
    // slight pinch between, then falls away fast below the jaw angle.
    const t = Math.max(0, Math.min(1, y));
    let i = 0;
    while (i < PROFILE.length - 2 && PROFILE[i + 1][0] < t) i++;
    const [ay, aw] = PROFILE[i];
    const [by, bw] = PROFILE[i + 1];
    const u = by === ay ? 0 : (t - ay) / (by - ay);
    let f = aw + (bw - aw) * u;
    // Below the cheekbone the jaw is the whole shape of the face, and it is
    // the one measurement that differs most from one person to the next.
    if (t > 0.5) f *= 1 + (g.jaw - 1) * Math.min(1, (t - 0.5) / 0.32);
    if (t > 0.86) f *= 0.5 + g.chin * 1.6;
    return g.width * f;
  };
  return { P, g, h: size, wide, mid: (y) => P(0, y, 0.22)[0], toward: Math.sign(g.turn) || 1 };
}

// -------------------------------------------------------------------- draw

/**
 * The whole portrait, in the order a pen would do it.
 *
 * Back hair, then shoulders, then the head's silhouette, then the wash, then
 * the features, then the hair that falls in front, then the marks that only
 * work if everything under them is already dry. Getting the order wrong is why
 * the first attempts had hair growing out of the eyebrows.
 */
export function drawFace(pad: Pad, g: Genes, at: Pt, size: number, seed: number) {
  const H = head(g, at, size);
  const r = rng(seed ^ 0x51ed);
  const ink = INK;

  hairBack(pad, H, r, ink);
  body(pad, H, r, ink);
  skull(pad, H, r, ink);
  shading(pad, H, r, ink);
  ears(pad, H, ink);
  eyes(pad, H, r, ink);
  brows(pad, H, r, ink);
  nose(pad, H, r, ink);
  mouth(pad, H, r, ink);
  hairFront(pad, H, r, ink);
  finish(pad, H, r, ink);
}

/** Where the jaw stops and the chin's own curve takes over. */
const CHIN = 0.955;
/** A head is deeper than it is wide, by about this much. */
const DEEP = 1.16;

/**
 * A point on the outside of the head at height `y`, on one side.
 *
 * The *contour generator* of a turned ellipse, not its widest point swung
 * sideways. For semi-axes `a` across and `b` deep, the extreme of x·cosθ +
 * z·sinθ on the ellipse is √(a²cos²θ + b²sin²θ), reached at the point below;
 * it is two lines of algebra and it is the difference between a head that
 * turns and a head that slides sideways.
 *
 * `grow` pushes the point outwards, which is how the hair gets a silhouette
 * that agrees with the face's. Building the two on different formulas is what
 * made the face's own fill spill over the hair on every turned head — a pale
 * wedge across one cheek, which looked like a lighting bug and was a geometry
 * bug.
 */
function rimAt(H: Head, side: 1 | -1, y: number, grow = 1): Pt {
  const a = H.wide(Math.max(0, Math.min(CHIN, y))) * grow;
  const b = a * DEEP;
  const c = Math.cos(H.g.turn);
  const sn = Math.sin(H.g.turn);
  const k = Math.hypot(a * c, b * sn) || 1;
  return H.P((side * a * a * c) / k, y, (side * b * b * sn) / k);
}

/** The line of the face, from crown to the start of the chin. */
function silhouette(H: Head, side: 1 | -1): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i <= 22; i++) out.push(rimAt(H, side, (i / 22) * CHIN));
  return out;
}

function skull(pad: Pad, H: Head, r: () => number, ink: string) {
  const left = silhouette(H, -1);
  const right = silhouette(H, 1);
  // The chin. A woman's chin in this register is a soft point, not a curve and
  // not a corner. Written left to right, like everything else here, so the
  // closed contour can be assembled without any path being reversed in place —
  // which is what turned the first version of this into a face with a diagonal
  // ruled across it.
  const cw = H.wide(CHIN);
  // The chin's ends are *taken from* the jaw rather than recomputed. The jaw is
  // drawn on the contour generator of a turned ellipse and the chin is not, so
  // asking both for "the half-width at y = 0.955" gives two different points on
  // the page and leaves a notch in every jaw in the deck.
  const chin: Pt[] = [
    left[left.length - 1],
    H.P(-cw * 0.86, 0.985, 0.09),
    H.P(-cw * 0.3, 1.005, 0.11),
    H.P(cw * 0.3, 1.005, 0.11),
    H.P(cw * 0.86, 0.985, 0.09),
    right[right.length - 1],
  ];
  const face = [...left, ...chin, ...right.slice().reverse()];
  pad.shape(face, PAPER, { alpha: 1 });
  stroke(pad, [...face, face[0]], ink, { width: 0.0026, taper: 0.1, alpha: 0.6, wobble: 0.0014 });
  // The near edge again, heavier. A contour that is the same weight all the way
  // round is a cut-out; the line has to say which side is nearer the light and
  // which side is turning away.
  // The near edge again, heavier, running continuously from the temple round
  // to the middle of the chin. Slicing into the middle of the silhouette and
  // then jumping to the chin leaves a spur sticking out of the jaw.
  const near = (H.toward > 0 ? right : left).slice(5);
  const half = H.toward > 0 ? chin.slice().reverse().slice(0, 4) : chin.slice(0, 4);
  stroke(pad, [...near, ...half], ink, { width: 0.0046, taper: 0.4, wobble: 0.0014 });
  void r;
}

/** Neck, shoulders, and whatever is around them. */
function body(pad: Pad, H: Head, r: () => number, ink: string) {
  const g = H.g;
  const top = 0.9;
  const bot = 1.0 + g.neck + 0.42;
  const nw = g.width * 0.56;
  // The neck is a cylinder and it leans with the head, so it is built in head
  // space like everything else and comes out leaning for nothing.
  const neck: Pt[] = [];
  const steps = 5;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    neck.push(H.P(-nw * (0.94 + t * 0.14), top + t * (1.06 + g.neck - top), -t * 0.03));
  }
  for (let i = steps; i >= 0; i--) {
    const t = i / steps;
    neck.push(H.P(nw * (0.94 + t * 0.14), top + t * (1.06 + g.neck - top), -t * 0.03));
  }
  pad.shape(neck, PAPER, { alpha: 1 });

  const sw = g.width * (1.55 + g.shoulder * 0.55);
  const drop = g.shoulder * 0.14;
  const shoulders: Pt[] = [
    H.P(-nw * 1.05, 1.0 + g.neck * 0.9, 0),
    H.P(-g.width * 0.9, 1.06 + g.neck, -0.05),
    H.P(-sw, 1.2 + g.neck + drop, -0.16),
    H.P(-sw * 1.02, bot, -0.2),
    H.P(sw * 1.02, bot, -0.2),
    H.P(sw, 1.2 + g.neck + drop, -0.16),
    H.P(g.width * 0.9, 1.06 + g.neck, -0.05),
    H.P(nw * 1.05, 1.0 + g.neck * 0.9, 0),
  ];
  pad.shape(shoulders, PAPER, { alpha: 1 });
  stroke(pad, shoulders.slice(0, 4), ink, { width: 0.0036, taper: 0.4, wobble: 0.002 });
  stroke(pad, shoulders.slice(4, 8), ink, { width: 0.0036, taper: 0.4, wobble: 0.002 });
  // The far side of the neck is a shadow, not a line.
  const sh = H.toward;
  stroke(pad, [H.P(-nw * sh, top + 0.02, 0), H.P(-nw * sh * 1.03, 1.0 + g.neck * 0.8, 0)], ink, {
    width: 0.0026,
    taper: 0.6,
    alpha: 0.5,
  });
  // The hollow of the throat, which is one mark and reads as anatomy.
  stroke(pad, [H.P(-nw * 0.3, 1.02 + g.neck, 0.05), H.P(0, 1.05 + g.neck, 0.08), H.P(nw * 0.3, 1.02 + g.neck, 0.05)], ink, {
    width: 0.0024,
    taper: 0.7,
    alpha: 0.42,
  });
  collar(pad, H, r, ink, bot);
}

function collar(pad: Pad, H: Head, r: () => number, ink: string, bot: number) {
  const g = H.g;
  const y = 1.1 + g.neck;
  const w = g.width;
  if (g.collar === 'none') return;
  if (g.collar === 'high') {
    const band: Pt[] = [H.P(-w * 0.62, y + 0.02, 0), H.P(0, y + 0.09, 0.1), H.P(w * 0.62, y + 0.02, 0)];
    stroke(pad, band, ink, { width: 0.0034, taper: 0.4 });
    stroke(pad, band.map((p, i) => [p[0], p[1] + (i === 1 ? 0.052 : 0.04) * H.h] as Pt), ink, {
      width: 0.0028,
      taper: 0.5,
      alpha: 0.7,
    });
  }
  if (g.collar === 'lace') {
    for (let i = 0; i <= 12; i++) {
      const t = i / 12;
      const x = (t - 0.5) * w * 1.7;
      const yy = y + 0.06 + Math.pow(Math.abs(t - 0.5) * 2, 2) * 0.06;
      pad.blob(H.P(x, yy, 0.04), 0.008, 0.007, 0, ink, { alpha: 0.5 });
      pad.blob(H.P(x, yy + 0.035, 0.04), 0.005, 0.005, 0, ink, { alpha: 0.32 });
    }
  }
  if (g.collar === 'shawl' || g.collar === 'fur') {
    const wrap: Pt[] = [
      H.P(-w * 1.5, bot, -0.2),
      H.P(-w * 0.8, y + 0.1, 0),
      H.P(0, y + 0.24, 0.1),
      H.P(w * 0.8, y + 0.1, 0),
      H.P(w * 1.5, bot, -0.2),
    ];
    stroke(pad, wrap, ink, { width: 0.0038, taper: 0.3, wobble: 0.003 });
    if (g.collar === 'fur') {
      for (let i = 0; i < 44; i++) {
        const t = i / 43;
        const p = along(wrap, t);
        stroke(pad, [p, [p[0] + (r() - 0.5) * 0.02, p[1] - 0.012 - r() * 0.014]], ink, {
          width: 0.0022,
          taper: 0.8,
          alpha: 0.5,
        });
      }
    } else {
      contourHatch(pad, wrap, () => 0.026, fade(ink, 0.4), { pitch: 26, width: 0.0022, alpha: 0.5 });
    }
  }
  if (g.collar === 'ribbon') {
    const b = H.P(0, y - 0.02, 0.1);
    stroke(pad, [H.P(-w * 0.5, y - 0.05, 0), b, H.P(w * 0.5, y - 0.05, 0)], ink, { width: 0.004, taper: 0.4 });
    pad.shape([b, [b[0] - 0.03, b[1] - 0.016], [b[0] - 0.034, b[1] + 0.018]], ink, { alpha: 0.85 });
    pad.shape([b, [b[0] + 0.03, b[1] - 0.016], [b[0] + 0.034, b[1] + 0.018]], ink, { alpha: 0.85 });
  }
  if (g.collar === 'open') {
    stroke(pad, [H.P(-w * 0.5, y, 0), H.P(-w * 0.16, y + 0.3, 0.04)], ink, { width: 0.003, taper: 0.5 });
    stroke(pad, [H.P(w * 0.5, y, 0), H.P(w * 0.16, y + 0.3, 0.04)], ink, { width: 0.003, taper: 0.5 });
  }
}

function along(path: Pt[], t: number): Pt {
  const i = Math.min(path.length - 2, Math.floor(t * (path.length - 1)));
  const u = t * (path.length - 1) - i;
  return [path[i][0] + (path[i + 1][0] - path[i][0]) * u, path[i][1] + (path[i + 1][1] - path[i][1]) * u];
}

/**
 * The wash, the hatching, and the stipple.
 *
 * One light, on one side, and everything else follows from it. The wash is a
 * flat translucent shape over the shadow half; the hatching runs *along the
 * form* rather than across the page, which is the difference between shading
 * and scribbling; and the stipple sits only where the two meet, because a
 * gradient made of dots is the one place stipple beats a line.
 */
function shading(pad: Pad, H: Head, r: () => number, ink: string) {
  const g = H.g;
  const s = -g.light as 1 | -1;
  // The terminator: where the form turns away from the light. It is not a
  // straight line down the face — it bulges out over the brow and the
  // cheekbone and pulls in at the temple and the jaw, and that shape is most
  // of what says the head is round.
  const edge: Pt[] = [];
  for (let i = 0; i <= 16; i++) {
    const y = 0.04 + (i / 16) * 0.93;
    const bulge = 0.42 + 0.44 * Math.sin((y - 0.02) * 2.4);
    edge.push(H.P(H.wide(y) * s * bulge, y, 0.3));
  }
  const rim = silhouette(H, s).slice(1, 21);
  const shadow = [...edge, ...rim.slice().reverse()];
  pad.shape(shadow, fade(ink, 0.05 * g.key), { alpha: 1 });
  // Tone inside it, as engraving lines running with the turn of the form.
  //
  // The first version hatched *across* the terminator with short ticks, which
  // is what a contour hatch does, and at portrait scale a row of short ticks
  // down somebody's cheek reads as stitches. Long lines lying along the shadow
  // read as tone.
  pad.clip(shadow, () => {
    for (let i = 0; i < 13; i++) {
      const t = i / 12;
      const path: Pt[] = [];
      for (let k = 0; k <= 8; k++) {
        const y = 0.08 + (k / 8) * 0.84;
        const bulge = 0.42 + 0.44 * Math.sin((y - 0.02) * 2.4);
        const across = bulge + (1 - bulge) * t * 1.15;
        path.push(H.P(H.wide(y) * s * across, y, 0.3));
      }
      stroke(pad, path, fade(ink, 0.45), {
        width: 0.0018 + r() * 0.0008,
        taper: 0.55,
        alpha: 0.1 + t * 0.16 * g.key,
        wobble: 0.0016,
      });
    }
  });
  // Under the cheekbone: the one place a stipple beats a line, because the
  // edge of this shadow has to be nothing at all.
  const a = H.P(H.wide(0.52) * s * 0.86, 0.55, 0.2);
  const b = H.P(H.wide(0.68) * s * 0.46, 0.71, 0.3);
  stipple(
    pad,
    [Math.min(a[0], b[0]) - 0.015, a[1], Math.max(a[0], b[0]) + 0.015, b[1]],
    fade(ink, 0.5),
    { n: Math.round(40 * g.key), size: 0.0013, alpha: 0.14 },
  );
  // Under the jaw, which is what stops the head reading as a sticker.
  const under: Pt[] = [
    H.P(-H.wide(0.9) * 0.72, 0.95, 0.04),
    H.P(0, 1.03, 0.1),
    H.P(H.wide(0.9) * 0.72, 0.95, 0.04),
    H.P(H.wide(0.9) * 0.5, 1.02, 0.0),
    H.P(0, 1.08, 0.04),
    H.P(-H.wide(0.9) * 0.5, 1.02, 0.0),
  ];
  pad.shape(under, fade(ink, 0.22), { alpha: 0.55 });
}

// ------------------------------------------------------------------ eyes

/**
 * The eye.
 *
 * Everything that makes a gaze happen is here: the upper lid is heavier than
 * the lower and sits *in front of* the iris, the iris is cropped by it, the
 * pupil carries one highlight, and the outer corner sits above the inner one by
 * an amount that is the single strongest lever on expression in the whole
 * drawing. Draw two symmetrical almonds with circles in them and you get a doll.
 */
function eye(pad: Pad, H: Head, side: 1 | -1, r: () => number, ink: string) {
  const g = H.g;
  const y = g.brow + 0.07;
  const cx = side * g.width * 0.46;
  // The far eye is narrower because it is further round the head, which the
  // projection already does — but it also sits nearer the silhouette, so it
  // gets a little less width of its own.
  const far = side * H.toward < 0;
  const w = g.eye * (far ? 0.86 : 1);
  const tiltUp = g.canthal * side;
  const z = 0.13;

  const inner = H.P(cx - side * w, y - tiltUp * 0.3, z);
  const outer = H.P(cx + side * w, y - tiltUp, z + 0.02);
  const open = (1 - g.lidded) * w * 0.62;

  const upper: Pt[] = [
    inner,
    H.P(cx - side * w * 0.35, y - open * 0.95 - tiltUp * 0.5, z),
    H.P(cx + side * w * 0.2, y - open * 0.8 - tiltUp * 0.8, z),
    outer,
  ];
  const lower: Pt[] = [
    inner,
    H.P(cx - side * w * 0.2, y + open * 0.6 - tiltUp * 0.4, z),
    H.P(cx + side * w * 0.4, y + open * 0.42 - tiltUp * 0.8, z),
    outer,
  ];

  // The white, so hatching behind the eye does not show through it.
  pad.shape([...upper, ...lower.slice().reverse()], PAPER, { alpha: 1 });

  // The iris, clipped by the lids. A pupil that clears the upper lid is a
  // startled expression, and nobody in this book is startled.
  const ir = w * g.iris;
  const ix = cx + g.gaze[0] * w * 0.5;
  const iy = y + g.gaze[1] * open * 0.7 + open * 0.06;
  pad.clip([...upper, ...lower.slice().reverse()], () => {
    const c = H.P(ix, iy, z + 0.01);
    pad.blob(c, ir, ir * 1.02, 0, fade(ink, 0.55), { alpha: 0.9 });
    pad.blob(c, ir * 0.46, ir * 0.46, 0, ink, { alpha: 0.98 });
    // Iris fibres, which is the one place a stipple is worth its cost.
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + r();
      stroke(
        pad,
        [
          [c[0] + Math.cos(a) * ir * 0.5, c[1] + Math.sin(a) * ir * 0.5],
          [c[0] + Math.cos(a) * ir * 0.94, c[1] + Math.sin(a) * ir * 0.94],
        ],
        ink,
        { width: 0.0014, alpha: 0.4, taper: 0.6 },
      );
    }
    // The shadow the upper lid throws on the eyeball. Without it the eye is
    // pasted on rather than set in.
    stroke(pad, upper, fade(ink, 0.45), { width: 0.009, alpha: 0.35, taper: 0.2 });
  });
  // One highlight, at the ten o'clock of the pupil, and never two.
  const hl = H.P(ix - side * ir * 0.34, iy - ir * 0.36, z + 0.02);
  pad.blob(hl, ir * 0.2, ir * 0.2, 0, PAPER, { alpha: 0.95 });

  // The lids. Upper heavy, lower a hint — the asymmetry is the whole trick.
  stroke(pad, upper, ink, { width: 0.0038 + g.lash * 0.0022, taper: 0.25, wobble: 0.0008 });
  stroke(pad, lower.slice(1), ink, { width: 0.0018, taper: 0.7, alpha: 0.6 });
  // The crease above it, set back by the lid's own thickness.
  stroke(
    pad,
    upper.map((p, i) => [p[0], p[1] - (i === 0 || i === 3 ? 0.006 : 0.016) * H.h] as Pt),
    ink,
    { width: 0.0018, taper: 0.6, alpha: 0.5 },
  );
  // Lashes, out and up from the outer third, never evenly spaced.
  if (g.lash > 0.25) {
    for (let i = 0; i < 7; i++) {
      const t = 0.42 + (i / 7) * 0.62;
      if (t > 1) break;
      const p = along(upper, Math.min(1, t));
      const len = (0.014 + r() * 0.016) * H.h * g.lash;
      stroke(pad, [p, [p[0] + side * len * 0.8, p[1] - len]], ink, { width: 0.0022, taper: 0.85, alpha: 0.85 });
    }
  }
}

function eyes(pad: Pad, H: Head, r: () => number, ink: string) {
  eye(pad, H, -1, r, ink);
  eye(pad, H, 1, r, ink);
}

function brows(pad: Pad, H: Head, r: () => number, ink: string) {
  const g = H.g;
  for (const side of [-1, 1] as const) {
    const cx = side * g.width * 0.46;
    const y = g.brow - g.browLift;
    const w = g.eye * 1.24;
    const arch = g.browArch * 0.045;
    const path: Pt[] = [
      H.P(cx - side * w, y + 0.012, 0.14),
      H.P(cx - side * w * 0.2, y - arch, 0.16),
      H.P(cx + side * w * 0.5, y - arch * 0.72, 0.15),
      H.P(cx + side * w * 1.05, y + 0.016, 0.12),
    ];
    // A brow is a field of hairs with a direction, so it is hatched along its
    // own spine and then edged, rather than drawn as a filled comma.
    // A brow is a field of hairs sweeping outwards, so they are drawn as
    // strokes along it rather than as ticks across it: a row of ticks at
    // portrait size is a row of stitches.
    for (let i = 0; i < 14; i++) {
      const t = (i + 0.5) / 14;
      const p = along(path, t);
      const len = 0.03 * H.h * g.browWeight * Math.sin(Math.min(1, t * 1.25) * Math.PI);
      stroke(
        pad,
        [
          [p[0] - side * len * 0.5, p[1] + len * 0.34],
          [p[0] + side * len * 0.5, p[1] - len * 0.22],
        ],
        ink,
        { width: 0.0019, taper: 0.7, alpha: 0.62 + t * 0.2 },
      );
    }
    stroke(pad, path, ink, { width: 0.0022 * g.browWeight, taper: 0.6, alpha: 0.8 });
    void r;
  }
}

/**
 * The nose.
 *
 * Three marks and no outline. A woman's nose in pen is the shadow down one
 * side, the underplane at the tip and one nostril; outline it and she is a
 * cartoon. On a turned head the near nostril shows and the far one does not,
 * which is worth the two lines it takes to get right.
 */
function nose(pad: Pad, H: Head, r: () => number, ink: string) {
  const g = H.g;
  const base = g.brow + 0.06 + g.nose * 0.2;
  const w = g.eye * g.noseWide * 0.62;
  const s = H.toward;
  const bridge: Pt[] = [
    H.P(-s * w * 0.32, g.brow + 0.03, 0.19),
    H.P(-s * w * 0.44, base - 0.06, 0.25),
    H.P(-s * w * 0.3, base - 0.012, 0.29),
  ];
  stroke(pad, bridge, ink, { width: 0.0032, taper: 0.7, alpha: 0.6 });
  // The ball of the tip, and the plane under it.
  const tip = H.P(0, base, 0.3);
  pad.blob(tip, 0.015 * H.h * g.noseWide, 0.011 * H.h, 0, fade(ink, 0.35), { alpha: 0.5 });
  stroke(
    pad,
    [H.P(-w * 0.5, base + 0.006, 0.24), H.P(0, base + 0.016, 0.29), H.P(w * 0.5, base + 0.006, 0.24)],
    ink,
    { width: 0.0034, taper: 0.5, alpha: 0.82 },
  );
  // Nostrils: the near one is a mark, the far one is a suggestion.
  for (const side of [-1, 1] as const) {
    const near = side * s > 0;
    stroke(
      pad,
      [H.P(side * w * 0.62, base - 0.004, 0.21), H.P(side * w * 0.86, base + 0.012, 0.16)],
      ink,
      { width: near ? 0.003 : 0.002, taper: 0.6, alpha: near ? 0.8 : 0.4 },
    );
  }
  void r;
}

/**
 * The mouth.
 *
 * The line between the lips is the only one that is fully dark. The outer edges
 * of both lips are drawn softer than that seam and are allowed to break, and
 * the lower lip is not outlined at the bottom at all — a highlight and a
 * shadow under it are enough. Ink a closed contour round a mouth and you get a
 * pair of sausages every time.
 */
function mouth(pad: Pad, H: Head, r: () => number, ink: string) {
  const g = H.g;
  const y = g.brow + 0.06 + g.nose * 0.2 + 0.13;
  const w = g.width * g.mouth * 2.4;
  const lift = g.smile;
  const seam: Pt[] = [
    H.P(-w, y - lift, 0.15),
    H.P(-w * 0.42, y - 0.006, 0.22),
    H.P(0, y + 0.002, 0.25),
    H.P(w * 0.42, y - 0.006, 0.22),
    H.P(w, y - lift, 0.15),
  ];
  const up = 0.032 * g.lip;
  const bow: Pt[] = [
    seam[0],
    H.P(-w * 0.52, y - up * 0.8, 0.2),
    H.P(-w * 0.16, y - up * 1.25, 0.24),
    H.P(0, y - up * 0.85, 0.25),
    H.P(w * 0.16, y - up * 1.25, 0.24),
    H.P(w * 0.52, y - up * 0.8, 0.2),
    seam[4],
  ];
  const lowY = 0.044 * g.lip;
  const low: Pt[] = [
    seam[0],
    H.P(-w * 0.5, y + lowY * 0.8, 0.2),
    H.P(0, y + lowY * 1.2, 0.25),
    H.P(w * 0.5, y + lowY * 0.8, 0.2),
    seam[4],
  ];
  pad.shape([...bow, ...low.slice().reverse()], fade(BLUSH, 0.2), { alpha: 0.55 });
  if (g.part > 0) {
    pad.shape(
      [...seam, ...seam.slice().reverse().map((p) => [p[0], p[1] + g.part * H.h * 1.4] as Pt)],
      fade(ink, 0.7),
      { alpha: 0.7 },
    );
  }
  stroke(pad, seam, ink, { width: 0.0042, taper: 0.28, wobble: 0.001 });
  stroke(pad, bow.slice(1, 6), ink, { width: 0.0018, taper: 0.75, alpha: 0.5 });
  // The corners are two dots of shadow and they do more than the rest of it.
  for (const s of [-1, 1] as const) {
    pad.blob(H.P(s * w * 0.96, y - lift * 0.9, 0.22), 0.006 * H.h, 0.005 * H.h, 0, ink, { alpha: 0.55 });
  }
  // Under the lower lip: a shadow, not a line.
  contourHatch(
    pad,
    [H.P(-w * 0.6, y + lowY * 1.5, 0.3), H.P(0, y + lowY * 1.9, 0.36), H.P(w * 0.6, y + lowY * 1.5, 0.3)],
    (t) => 0.012 * H.h * Math.sin(t * Math.PI),
    fade(ink, 0.4),
    { pitch: 16, width: 0.0018, alpha: 0.4 },
  );
  void r;
}

function ears(pad: Pad, H: Head, ink: string) {
  const g = H.g;
  // Only the near ear, and only when the turn has not swung it out of sight.
  const s = -H.toward as 1 | -1;
  if (Math.abs(g.turn) > 0.5 && s === H.toward) return;
  const x = H.wide(0.55) * s;
  const path: Pt[] = [
    H.P(x * 0.98, g.brow + 0.01, 0),
    H.P(x * 1.12, g.brow + 0.06, -0.04),
    H.P(x * 1.06, g.brow + 0.15, -0.02),
    H.P(x * 0.94, g.brow + 0.17, 0.02),
  ];
  stroke(pad, path, ink, { width: 0.0026, taper: 0.5, alpha: 0.7 });
  stroke(pad, [H.P(x * 1.0, g.brow + 0.05, -0.01), H.P(x * 1.02, g.brow + 0.12, 0)], ink, {
    width: 0.0018,
    taper: 0.7,
    alpha: 0.45,
  });
}

// ------------------------------------------------------------------ hair

/**
 * The dome the hair sits in.
 *
 * An arc a little larger than the skull, from the left temple over the crown to
 * the right — not a ring round the whole head. The first version walked the
 * full circle and closed through the chin, which put two dark spikes above
 * every head in the deck.
 */
function crownArc(H: Head, puff: number): Pt[] {
  const grow = 1.04 + puff * 0.17;
  const ys = [0.66, 0.54, 0.44, 0.34, 0.25, 0.18, 0.12, 0.07];
  const out: Pt[] = [];
  for (const y of ys) out.push(rimAt(H, -1, y, grow));
  // Over the crown. The profile table has nothing above y = 0, so the top is
  // closed with an arc between the two rim points rather than extrapolated —
  // extrapolating a table off its end is how you get a horn.
  const a = out[out.length - 1];
  const b = rimAt(H, 1, 0.07, grow);
  const lift = (0.16 + puff * 0.05) * H.h;
  for (let i = 1; i < 9; i++) {
    const t = i / 9;
    out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - Math.sin(t * Math.PI) * lift]);
  }
  for (let i = ys.length - 1; i >= 0; i--) out.push(rimAt(H, 1, ys[i], grow));
  return out;
}

function hairBack(pad: Pad, H: Head, r: () => number, ink: string) {
  const g = H.g;
  const dark = fade(ink, 0.6 + g.dark * 0.38);
  const w = g.width;
  const loose = g.hair === 'loose' || g.hair === 'wind' || g.hair === 'ringlets';
  const drop = loose ? 1.12 + g.mass * 0.32 : g.hair === 'braid' ? 0.78 : 0.62;
  const out = loose ? 1.04 + g.mass * 0.3 : 0.9 + g.mass * 0.1;
  // The mass behind the head: down past the ears and no further round than the
  // shoulders. It is a shape *behind* a face, not a shape the face sits in.
  const fall = Math.min(CHIN, drop);
  const back: Pt[] = [
    rimAt(H, -1, 0.12, out * 0.98),
    rimAt(H, -1, 0.42, out),
    rimAt(H, -1, 0.7, out),
    rimAt(H, -1, fall, out * 1.04),
    H.P(0, drop + 0.08, -0.22),
    rimAt(H, 1, fall, out * 1.04),
    rimAt(H, 1, 0.7, out),
    rimAt(H, 1, 0.42, out),
    rimAt(H, 1, 0.12, out * 0.98),
  ];
  const dome = crownArc(H, g.mass);
  const mass = [...back, ...dome.slice().reverse()];
  pad.shape(mass, dark, { alpha: 0.95 });
  // Hair is a solid with light running over it, so the highlight is taken back
  // *out* of the mass rather than drawn onto it. Flat black either side of a
  // face is a wimple; a dozen pale strokes following the sweep is hair.
  pad.clip(mass, () => {
    for (let i = 0; i < 26; i++) {
      const t = i / 25;
      const side: 1 | -1 = i % 2 ? 1 : -1;
      const x0 = side * w * (0.3 + (t % 0.5) * 1.5);
      const y0 = 0.08 + t * 0.1;
      stroke(
        pad,
        [
          H.P(x0 * 0.5, y0, 0.2),
          H.P(x0 * 1.02, y0 + 0.26 + r() * 0.1, 0.02),
          H.P(x0 * (0.9 + r() * 0.2), y0 + 0.6 + r() * 0.3, -0.1),
        ],
        PAPER,
        { width: 0.0016 + r() * 0.0018, taper: 0.65, alpha: 0.1 + r() * 0.18 },
      );
    }
  });
  if (g.hair === 'wind') {
    const s = -H.toward;
    for (let i = 0; i < 8; i++) {
      const t = i / 7;
      const y = 0.2 + t * 0.42;
      stroke(
        pad,
        [
          H.P(s * w * 0.96, y, 0.08),
          H.P(s * w * (1.35 + r() * 0.5), y - 0.1 - r() * 0.12, -0.05),
          H.P(s * w * (1.8 + r() * 0.9), y - 0.02 + r() * 0.16, -0.15),
          H.P(s * w * (2.1 + r() * 1.3), y + 0.1 + r() * 0.2, -0.2),
        ],
        dark,
        { width: 0.0028 + r() * 0.0034, taper: 0.7, alpha: 0.6 + r() * 0.3, wobble: 0.005 },
      );
    }
  }
  if (g.hair === 'braid') {
    const s = H.toward;
    const spine: Pt[] = [
      H.P(s * w * 0.86, 0.66, -0.1),
      H.P(s * w * 1.02, 0.98, -0.15),
      H.P(s * w * 0.94, 1.3, -0.15),
      H.P(s * w * 0.74, 1.52, -0.15),
    ];
    stroke(pad, spine, dark, { width: 0.028, taper: 0.5, alpha: 0.95 });
    for (let i = 0; i < 12; i++) {
      const p = along(spine, i / 11);
      stroke(pad, [[p[0] - 0.018, p[1] - 0.006], [p[0] + 0.018, p[1] + 0.008]], PAPER, {
        width: 0.002,
        taper: 0.7,
        alpha: 0.4,
      });
    }
  }
  if (g.hair === 'chignon') {
    pad.blob(H.P(H.toward * w * 0.66, 0.3, -0.5), 0.05 * (0.8 + g.mass * 0.4), 0.044, 0.3, dark, { alpha: 0.95 });
  }
}

/**
 * The hair that falls in front of the face.
 *
 * Drawn as a filled mass with pale strokes *taken out* of it rather than as a
 * bundle of dark strands on light paper. Hair is a solid with light running
 * over it, and scraperboard is the right model: the highlight is what you
 * remove.
 */
function hairFront(pad: Pad, H: Head, r: () => number, ink: string) {
  const g = H.g;
  const dark = fade(ink, 0.55 + g.dark * 0.42);
  const w = g.width;

  if (g.hair === 'scarf' || g.hair === 'hood' || g.hair === 'bonnet') {
    // A headcloth covers the crown and comes down past the ear; it does not
    // cross the forehead like a bandage, which is what the first version did by
    // closing its shape through two points below the chin.
    const deep = g.hair === 'hood' ? 0.24 : g.hair === 'bonnet' ? 0.14 : 0.11;
    const dome = crownArc(H, g.mass * 1.2);
    // The front edge of the cloth is built on the *same* parametrisation as the
    // hairline — a curve across the front surface of the head — rather than
    // from raw half-widths. Points given as plain half-widths swing across the
    // face on a turned head, and the result is a hood worn over one eye.
    const brim: Pt[] = [];
    for (let i = 0; i <= 16; i++) {
      const t = i / 16;
      const x = (t - 0.5) * 2;
      const dip = Math.pow(Math.abs(x), 1.7) * 0.42;
      const yy = Math.min(0.72, deep + dip);
      brim.push(Math.abs(x) > 0.96 ? rimAt(H, x < 0 ? -1 : 1, yy, 1.1) : H.P(x * w * 1.1, yy, 0.18));
    }
    const fill = g.hair === 'hood' ? fade(ink, 0.62 + g.dark * 0.28) : fade(ink, 0.3 + g.dark * 0.22);
    pad.shape([brim[0], ...dome, brim[brim.length - 1], ...brim.slice(1, -1).reverse()], fill, { alpha: 0.96 });
    stroke(pad, brim, ink, { width: 0.0032, taper: 0.4, wobble: 0.002 });
    // Folds, gathered towards where it is tied.
    const knot = H.P(-w * 0.9 * H.toward, 0.6, 0);
    for (let i = 1; i < 6; i++) {
      const p = along(brim, i / 6);
      stroke(pad, [p, [(p[0] * 2 + knot[0]) / 3, (p[1] * 2 + knot[1]) / 3 + 0.03]], fade(ink, 0.55), {
        width: 0.0022,
        taper: 0.75,
        alpha: 0.4,
      });
    }
    // Hair still shows at the temple. It always does.
    for (const side of [-1, 1] as const) {
      stroke(
        pad,
        [H.P(side * w * 0.82, deep + 0.12, 0.3), H.P(side * w * 0.94, deep + 0.3, 0.26), H.P(side * w * 0.86, deep + 0.42, 0.24)],
        dark,
        { width: 0.007, taper: 0.55, alpha: 0.85, wobble: 0.002 },
      );
    }
    return;
  }

  const line = g.hair === 'fringe' ? 0.15 : 0.18 + g.flow * 0.05;
  const parted = g.hair !== 'fringe' && g.hair !== 'wind';
  const px = parted ? (g.flow - 0.5) * 0.7 : 0;

  /**
   * The hairline.
   *
   * The single thing that decides whether this reads as hair or as a swimming
   * cap. A shallow arc across the forehead is a cap; hair parted and drawn down
   * over the temples falls nearly to the cheekbone at the sides, and the curve
   * between the two is steep. The exponent is what makes it steep.
   */
  const front: Pt[] = [];
  for (let i = 0; i <= 22; i++) {
    const t = i / 22;
    const x = (t - 0.5) * 2;
    const away = Math.abs(x - px);
    const dip =
      g.hair === 'fringe'
        ? 0.11 + Math.cos(t * Math.PI * 2) * 0.018
        : Math.pow(Math.min(1, away), 1.8) * (0.27 + g.mass * 0.05);
    front.push(H.P(x * w * 1.05, Math.min(0.62, line + dip), 0.3));
  }
  const cap: Pt[] = [...crownArc(H, g.mass), ...front.slice().reverse()];
  pad.shape(cap, dark, { alpha: 0.96 });
  stroke(pad, front, ink, { width: 0.0024, taper: 0.55, alpha: 0.5 });

  pad.clip(cap, () => {
    // Strands, running from the part outwards and back. Drawn *within* the mass
    // in both directions from the parting, because the two halves of a parted
    // head of hair sweep opposite ways and drawing them all one way is the
    // thing that makes procedural hair look combed by a machine.
    const top = H.P(px * w, line - 0.03, 0.34);
    for (let i = 0; i < 22; i++) {
      const t = (i + 0.4) / 22;
      const to = along(front, t);
      const dir = t < 0.5 + px / 2 ? -1 : 1;
      const light = i % 3 === 0;
      stroke(
        pad,
        [
          [top[0] + dir * 0.004, top[1]],
          [(top[0] + to[0]) / 2 + dir * 0.03, (top[1] + to[1]) / 2 - 0.03],
          [to[0], to[1] + 0.01],
          [to[0] + dir * 0.02, to[1] + 0.1 + r() * 0.08],
        ],
        light ? PAPER : ink,
        { width: 0.0016 + r() * 0.0016, taper: 0.55, alpha: light ? 0.16 + r() * 0.16 : 0.3, wobble: 0.002 },
      );
    }
    // The sheen: a band of light across the curve of the skull, which is the
    // one mark that says the hair is round rather than flat.
    for (let i = 0; i < 5; i++) {
      const y = line + 0.03 + i * 0.018;
      stroke(
        pad,
        [H.P(-w * 0.8, y + 0.05, 0.2), H.P(px * w * 0.5, y - 0.012, 0.34), H.P(w * 0.8, y + 0.05, 0.2)],
        PAPER,
        { width: 0.003, taper: 0.5, alpha: 0.12 },
      );
    }
  });
  if (parted) {
    // The parting itself: a pale line at the crown, and it stops well short of
    // the hairline, because a part that runs the whole way is a scar.
    stroke(pad, [H.P(px * w, 0.07, 0.12), H.P(px * w * 0.9, line + 0.02, 0.2)], PAPER, {
      width: 0.0026,
      taper: 0.6,
      alpha: 0.3,
    });
  }

  // Loose strands in front of the face, which is what stops it reading as a
  // wig on a stand.
  const looseN = g.hair === 'loose' || g.hair === 'wind' || g.hair === 'ringlets' ? 5 : 2;
  for (let i = 0; i < looseN; i++) {
    const side: 1 | -1 = r() < 0.5 ? -1 : 1;
    const y0 = line + 0.06 + r() * 0.14;
    stroke(
      pad,
      [
        H.P(side * w * (0.6 + r() * 0.3), y0, 0.18),
        H.P(side * w * (1.02 + r() * 0.12), y0 + 0.12, 0.13),
        H.P(side * w * (1.0 + r() * 0.1), y0 + 0.26 + r() * 0.1, 0.1),
        H.P(side * w * (0.82 + r() * 0.16), y0 + 0.38 + r() * 0.12, 0.07),
      ],
      dark,
      { width: 0.0034, taper: 0.75, alpha: 0.8, wobble: 0.002 },
    );
  }
  if (g.hair === 'ringlets') {
    // A curl is a coil seen from the side: a spiral that narrows as it falls.
    // Three dark discs in a column, which is what this was, are buttons.
    for (const side of [-1, 1] as const) {
      for (let k = 0; k < 2; k++) {
        const top = H.P(side * w * (0.94 + k * 0.06), 0.4 + k * 0.2, 0.16);
        const coil: Pt[] = [];
        const turns = 2.4 + r() * 1.2;
        const n = 26;
        for (let i = 0; i <= n; i++) {
          const t = i / n;
          const a = t * Math.PI * 2 * turns;
          const rad = 0.034 * (1 - t * 0.45) * (0.8 + g.mass * 0.3);
          coil.push([top[0] + Math.cos(a) * rad * side, top[1] + t * 0.16 + Math.sin(a) * rad * 0.4]);
        }
        stroke(pad, coil, dark, { width: 0.0075, taper: 0.35, alpha: 0.9 });
        stroke(pad, coil.map((c) => [c[0] - 0.004, c[1] - 0.004] as Pt), PAPER, {
          width: 0.0018,
          taper: 0.6,
          alpha: 0.2,
        });
      }
    }
  }
  if (g.hair === 'crownplait') {
    const plait: Pt[] = [H.P(-w * 1.0, line + 0.12, 0.2), H.P(px * w, line - 0.05, 0.4), H.P(w * 1.0, line + 0.12, 0.2)];
    stroke(pad, plait, dark, { width: 0.019, taper: 0.4, alpha: 0.95 });
    for (let i = 0; i < 11; i++) {
      const p = along(plait, i / 10);
      stroke(pad, [[p[0] - 0.011, p[1] - 0.006], [p[0] + 0.011, p[1] + 0.006]], PAPER, {
        width: 0.0018,
        taper: 0.7,
        alpha: 0.34,
      });
    }
  }
}

/** The last marks: the ones that only work on dry ink. */
function finish(pad: Pad, H: Head, r: () => number, ink: string) {
  const g = H.g;
  if (g.earring) {
    const s = -H.toward as 1 | -1;
    const p = H.P(H.wide(0.55) * s * 1.02, g.brow + 0.17, 0);
    stroke(pad, [p, [p[0], p[1] + 0.022]], ink, { width: 0.0016, alpha: 0.7 });
    pad.blob([p[0], p[1] + 0.03], 0.008, 0.01, 0, ink, { alpha: 0.85 });
    pad.blob([p[0] - 0.002, p[1] + 0.027], 0.003, 0.003, 0, PAPER, { alpha: 0.9 });
  }
  if (g.mole) {
    pad.blob(H.P(H.toward * g.width * 0.5, g.brow + 0.2, 0.3), 0.0035, 0.0035, 0, ink, { alpha: 0.8 });
  }
  if (g.freckles) {
    for (let i = 0; i < 16; i++) {
      const x = (r() - 0.5) * g.width * 1.5;
      const y = g.brow + 0.1 + r() * 0.09;
      pad.blob(H.P(x, y, 0.3), 0.0017, 0.0016, 0, fade(ink, 0.4), { alpha: 0.16 + r() * 0.16 });
    }
  }
  // The blush of the cheek, which in one colour is a stipple and nothing else.
  const s = H.toward;
  const cx = H.P(s * g.width * 0.52, g.brow + 0.16, 0.24);
  stipple(pad, [cx[0] - 0.04, cx[1] - 0.026, cx[0] + 0.04, cx[1] + 0.03], fade(BLUSH, 0.5), {
    n: 22,
    size: 0.0016,
    alpha: 0.11,
  });
  void hatch;
  void crosshatch;
}
