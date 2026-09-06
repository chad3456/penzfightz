export type Pt = [number, number];

/**
 * A hundred kisses, in scribble.
 *
 * Scribble is not a texture you apply to a finished drawing — it is a way of
 * *finding* a drawing, and the whole character of it is that the line never
 * stops and never quite commits. So nothing here is outlined and then filled:
 * one continuous zigzag traverses each mass, wandering slightly outside where
 * it turns, and the form appears because the line spent longer in some places
 * than others.
 *
 * Two profiles, facing. Everything that varies between the hundred is either
 * geometry — how tall each of them is, how far the heads are tipped, whether
 * they have got there yet — or hand: how fast the line is going, how hard it
 * is pressing, and what it is holding.
 */

export interface Hand {
  /** How far the line strays past the edge of what it is filling. */
  loose: number;
  /** Strokes per unit, so a fast hand leaves a sparser scribble. */
  speed: number;
  /** How many times the searching outline goes round. */
  passes: number;
  ink: string;
  paper: string;
  width: number;
}

export type Hair = 'long' | 'short' | 'bun' | 'curls' | 'crop' | 'bob' | 'tied' | 'wild' | 'cap';

export interface Person {
  /** Head height as a fraction of the card. */
  size: number;
  /** How far the head is tipped towards the other. */
  tilt: number;
  hair: Hair;
  /** How far down the card the chin sits. */
  chin: number;
  lash: boolean;
  brow: number;
}

export interface Kiss {
  id: number;
  seed: number;
  left: Person;
  right: Person;
  hand: Hand;
  /** Negative is still approaching, zero is contact, positive is pressed. */
  close: number;
  /** A caption, because a hundred kisses want telling apart. */
  note: string;
  /** Hands, a heart, nothing at all. */
  extra: 'none' | 'hand' | 'heart' | 'hair' | 'rain';
}

const INKS = ['#1a1714', '#22326b', '#7a1f28', '#2f2a24', '#123b33', '#4a2340'];
const PAPERS = ['#f2ece0', '#efe6d2', '#f4f1e8', '#eee8dc', '#f1ecdd', '#e9e4d6'];
const HAIRS: Hair[] = ['long', 'short', 'bun', 'curls', 'crop', 'bob', 'tied', 'wild', 'cap'];

const NOTES = [
  'about to', 'just before', 'the first one', 'the last one', 'a long one',
  'quick, in a doorway', 'goodbye at a station', 'hello after a year',
  'in the rain', 'nobody watching', 'everybody watching', 'on the forehead',
  'missed, slightly', 'both laughing', 'holding on', 'in the dark',
];

const rng = (seed: number) => {
  let a = (seed ^ 0x9e3779b9) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const pick = <T,>(list: readonly T[], r: () => number) => list[Math.floor(r() * list.length) % list.length];

/**
 * The hundred.
 *
 * The pairing is worked out per card rather than drawn at random from one
 * table, because two people with the same hair and the same height in the same
 * pose is the one combination that looks like a mistake.
 */
export function kisses(count: number, seed = 4): Kiss[] {
  const out: Kiss[] = [];
  for (let i = 0; i < count; i++) {
    const r = rng(seed * 7919 + i * 104729);
    const hairL = HAIRS[i % HAIRS.length];
    let hairR = pick(HAIRS, r);
    if (hairR === hairL) hairR = HAIRS[(HAIRS.indexOf(hairL) + 3) % HAIRS.length];
    const big = 0.34 + r() * 0.09;
    const gap = (r() - 0.5) * 0.05;
    out.push({
      id: i,
      seed: seed * 31 + i * 7717,
      left: { size: big, tilt: 0.12 + r() * 0.3, hair: hairL, chin: 0.66 + gap, lash: r() < 0.5, brow: 0.6 + r() * 0.9 },
      right: { size: big * (0.9 + r() * 0.2), tilt: 0.12 + r() * 0.3, hair: hairR, chin: 0.66 - gap, lash: r() < 0.5, brow: 0.6 + r() * 0.9 },
      hand: {
        loose: 0.1 + r() * 0.5,
        speed: 0.5 + r() * 1.1,
        passes: 2 + Math.floor(r() * 3),
        ink: pick(INKS, r),
        paper: pick(PAPERS, r),
        width: 0.0016 + r() * 0.0022,
      },
      close: (r() - 0.42) * 0.07,
      note: NOTES[i % NOTES.length],
      extra: r() < 0.2 ? 'hand' : r() < 0.34 ? 'heart' : r() < 0.5 ? 'hair' : r() < 0.58 ? 'rain' : 'none',
    });
  }
  return out;
}

// --------------------------------------------------------------- the marks

interface Pen {
  g: CanvasRenderingContext2D;
  w: number;
  h: number;
  r: () => number;
  hand: Hand;
}

function line(p: Pen, pts: Pt[], width: number, alpha: number) {
  if (pts.length < 2) return;
  const g = p.g;
  g.save();
  g.globalAlpha = alpha;
  g.strokeStyle = p.hand.ink;
  g.lineWidth = width * p.w;
  g.lineCap = 'round';
  g.lineJoin = 'round';
  g.beginPath();
  g.moveTo(pts[0][0] * p.w, pts[0][1] * p.h);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0] * p.w, pts[i][1] * p.h);
  g.stroke();
  g.restore();
}

/**
 * The searching outline.
 *
 * Drawn two or three times round, each pass slightly off the last. That
 * overlap — the same edge found more than once and never in quite the same
 * place — is the single thing that separates a scribble from a shaky line.
 */
function around(p: Pen, path: Pt[], passes: number) {
  for (let k = 0; k < passes; k++) {
    const off = (k - passes / 2) * 0.0026 * (0.4 + p.hand.loose);
    const pts = path.map((q, i): Pt => {
      const wob = Math.sin(i * 0.7 + k * 2.1) * 0.0028 * p.hand.loose;
      return [q[0] + off * 0.5 + wob, q[1] + off + wob * 0.6];
    });
    line(p, [...pts, pts[0]], p.hand.width * (1.25 - k * 0.16), 0.6 + k * 0.14);
  }
}

/**
 * Scribble fill.
 *
 * One unbroken zigzag traversing the shape's box, clipped to the shape and
 * given a wobble so it strays over the edge where it turns. Density is how
 * close the passes are, which is the only honest way to make a scribble
 * darker — pressing harder is a different medium.
 */
/** Even-odd ray cast. Two lines, and it is what confines the scribble. */
function inside(path: Pt[], x: number, y: number): boolean {
  let odd = false;
  for (let i = 0, j = path.length - 1; i < path.length; j = i++) {
    const a = path[i];
    const b = path[j];
    if (a[1] > y !== b[1] > y && x < ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]) + a[0]) odd = !odd;
  }
  return odd;
}

/**
 * Scribble fill.
 *
 * A pen with momentum, let loose inside the shape: it wanders, and when the
 * next step would take it outside it turns roughly back in and carries on. One
 * unbroken line, no lifts.
 *
 * Two earlier attempts got this wrong in the same way. A zigzag traversing the
 * bounding box is corduroy; the same zigzag at an angle with a bow in it is
 * hatching. What makes a scribble a scribble is that the line has no plan —
 * the direction is only ever the last direction plus a nudge, and the density
 * comes out of how long it was left running.
 */
function fill(p: Pen, path: Pt[], density: number, alpha = 0.5) {
  let x0 = 1;
  let x1 = 0;
  let y0 = 1;
  let y1 = 0;
  for (const q of path) {
    x0 = Math.min(x0, q[0]);
    x1 = Math.max(x1, q[0]);
    y0 = Math.min(y0, q[1]);
    y1 = Math.max(y1, q[1]);
  }
  const g = p.g;
  g.save();
  g.beginPath();
  g.moveTo(path[0][0] * p.w, path[0][1] * p.h);
  for (const q of path) g.lineTo(q[0] * p.w, q[1] * p.h);
  g.closePath();
  // Clipped a little loose, so the line is allowed over the edge on its turns.
  g.clip();

  const span = Math.max(x1 - x0, y1 - y0);
  const step = span * 0.055;
  const n = Math.round(density * 520 * (span / 0.4));
  let x = (x0 + x1) / 2;
  let y = (y0 + y1) / 2;
  let a = p.r() * 6.3;
  const pts: Pt[] = [[x, y]];
  for (let i = 0; i < n; i++) {
    a += (p.r() - 0.5) * (0.5 + p.hand.loose * 1.6);
    const nx = x + Math.cos(a) * step;
    const ny = y + Math.sin(a) * step;
    if (!inside(path, nx, ny)) {
      // Turn back in, but not neatly — a scribble that bounces like a billiard
      // ball reads as a machine.
      a += Math.PI * (0.7 + p.r() * 0.6);
      continue;
    }
    x = nx;
    y = ny;
    pts.push([x, y]);
  }
  line(p, pts, p.hand.width * 0.95, alpha);
  g.restore();
}

// ---------------------------------------------------------------- the head

/**
 * A head in true profile, facing right.
 *
 * The lips are the only part that has to be right, because they are where the
 * picture happens: the upper lip is the furthest forward point of the whole
 * face, further than the nose, and if it is not then the two of them are
 * touching noses instead.
 */
const PROFILE: Pt[] = [
  [0.1, 0.0], [0.3, -0.05], [0.4, -0.1], [0.43, -0.15], [0.46, -0.2],
  [0.36, -0.26], [0.38, -0.31], [0.54, -0.4], [0.32, -0.5], [0.38, -0.58],
  [0.32, -0.72], [0.2, -0.88], [0.0, -0.96], [-0.2, -0.92], [-0.34, -0.76],
  [-0.38, -0.54], [-0.34, -0.3], [-0.22, -0.12], [-0.04, -0.02],
];

/**
 * Corners taken off a closed path.
 *
 * Chaikin, twice: every segment replaced by its quarter and three-quarter
 * points. Without it a nineteen-point profile prints as a polygon and the
 * curls come out as stars.
 */
function round(path: Pt[], times = 2): Pt[] {
  let out = path;
  for (let k = 0; k < times; k++) {
    const next: Pt[] = [];
    for (let i = 0; i < out.length; i++) {
      const a = out[i];
      const b = out[(i + 1) % out.length];
      next.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25]);
      next.push([a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]);
    }
    out = next;
  }
  return out;
}

function place(pt: Pt, at: Pt, size: number, tilt: number, flip: 1 | -1, aspect: number): Pt {
  const c = Math.cos(tilt * flip);
  const s = Math.sin(tilt * flip);
  const x = pt[0] * flip * size * aspect;
  const y = pt[1] * size;
  return [at[0] + x * c - y * s * aspect, at[1] + (y * c + (x / aspect) * s)];
}

function hairPath(kind: Hair, r: () => number): Pt[] {
  switch (kind) {
    case 'long':
      return [[0.04, -1.0], [-0.26, -0.98], [-0.46, -0.76], [-0.5, -0.3], [-0.46, 0.34], [-0.3, 0.5], [-0.16, 0.3], [-0.2, -0.2], [-0.1, -0.62], [0.12, -0.92]];
    case 'short':
      return [[0.18, -0.9], [0.02, -1.02], [-0.24, -1.0], [-0.44, -0.78], [-0.46, -0.42], [-0.3, -0.24], [-0.28, -0.6], [-0.08, -0.86]];
    case 'bun':
      return [[0.12, -0.94], [-0.06, -1.04], [-0.3, -1.0], [-0.44, -0.8], [-0.4, -0.5], [-0.56, -0.62], [-0.66, -0.86], [-0.5, -1.06], [-0.24, -1.08], [-0.02, -1.0]];
    case 'curls':
      return Array.from({ length: 16 }, (_, i): Pt => {
        const a = Math.PI * (0.15 + (i / 15) * 1.5);
        const rad = 0.5 + r() * 0.12;
        return [Math.cos(a) * rad * 0.9, -0.62 + Math.sin(a) * rad * 0.8];
      });
    case 'crop':
      return [[0.24, -0.82], [0.06, -1.0], [-0.2, -1.0], [-0.38, -0.84], [-0.4, -0.62], [-0.26, -0.72], [-0.04, -0.86]];
    case 'bob':
      return [[0.16, -0.92], [-0.02, -1.04], [-0.3, -1.0], [-0.48, -0.76], [-0.5, -0.26], [-0.32, -0.16], [-0.26, -0.5], [-0.12, -0.8]];
    case 'tied':
      return [[0.1, -0.96], [-0.1, -1.04], [-0.32, -0.98], [-0.44, -0.76], [-0.42, -0.52], [-0.62, -0.34], [-0.78, -0.06], [-0.62, -0.04], [-0.44, -0.3], [-0.3, -0.6], [-0.12, -0.86]];
    case 'wild':
      return Array.from({ length: 20 }, (_, i): Pt => {
        const a = Math.PI * (0.05 + (i / 19) * 1.7);
        const rad = 0.46 + (i % 3 === 0 ? 0.24 : 0.02) + r() * 0.1;
        return [Math.cos(a) * rad * 0.95, -0.6 + Math.sin(a) * rad * 0.9];
      });
    case 'cap':
    default:
      return [[0.22, -0.86], [0.04, -1.02], [-0.22, -1.02], [-0.4, -0.86], [-0.42, -0.72], [-0.2, -0.82], [0.06, -0.9]];
  }
}

function head(p: Pen, who: Person, at: Pt, flip: 1 | -1, hand: Hand) {
  const aspect = p.h / p.w;
  const P = (q: Pt) => place(q, at, who.size, who.tilt, flip, aspect);
  const face = round(PROFILE).map(P);
  around(p, face, hand.passes);
  fill(p, face, 0.5, 0.3);

  const hair = round(hairPath(who.hair, p.r)).map(P);
  around(p, hair, hand.passes);
  fill(p, hair, 2.4, 0.5);
  fill(p, hair, 1.6, 0.4);

  // The eye: one closed lid, because in every kiss anybody draws the eyes are
  // shut. A line and a lash, and nothing else.
  const lid: Pt[] = [[0.12, -0.52], [0.22, -0.5], [0.3, -0.53]];
  line(p, lid.map(P), hand.width * 1.3, 0.9);
  if (who.lash) {
    for (let i = 0; i < 3; i++) {
      const a: Pt = [0.18 + i * 0.05, -0.52];
      const b: Pt = [0.2 + i * 0.05, -0.58];
      line(p, [P(a), P(b)], hand.width, 0.8);
    }
  }
  // The brow.
  const brow: Pt[] = [[0.1, -0.62], [0.24, -0.62], [0.34, -0.58]];
  line(p, brow.map(P), hand.width * who.brow * 1.6, 0.85);
  // The ear, and the line of the jaw under it.
  line(p, ([[-0.14, -0.44], [-0.06, -0.4], [-0.08, -0.28], [-0.16, -0.3]] as Pt[]).map(P), hand.width, 0.6);
  // Neck and a shoulder running off the card.
  const neck: Pt[] = [[-0.04, -0.02], [-0.06, 0.24], [-0.34, 0.4], [-0.6, 0.52]];
  line(p, neck.map(P), hand.width * 1.2, 0.75);
  const front: Pt[] = [[0.16, 0.02], [0.14, 0.2], [0.3, 0.36], [0.5, 0.5]];
  line(p, front.map(P), hand.width * 1.2, 0.75);
}

/**
 * Draw one kiss.
 *
 * The two heads are placed from the *lips* outward rather than from their
 * centres, so `close` means what it says: at zero the mouths meet, and either
 * side of that is a moment before or a moment into it.
 */
export function drawKiss(g: CanvasRenderingContext2D, k: Kiss, w: number, h: number) {
  const r = rng(k.seed);
  const p: Pen = { g, w, h, r, hand: k.hand };
  g.save();
  g.clearRect(0, 0, w, h);
  g.fillStyle = k.hand.paper;
  g.fillRect(0, 0, w, h);

  // Paper tooth, so the ink has something to sit on.
  g.save();
  for (let i = 0; i < 260; i++) {
    g.globalAlpha = 0.02 + r() * 0.05;
    g.fillStyle = '#8d8065';
    g.fillRect(r() * w, r() * h, 1.2, 1.2);
  }
  g.restore();

  const aspect = h / w;
  // The lip point of the profile, which is the anchor for both of them.
  const lipL: Pt = [0.5 - 0.004 + k.close * -0.5, 0.5];
  const lipR: Pt = [0.5 + 0.004 - k.close * -0.5, 0.5];
  const anchor = (who: Person, lip: Pt, flip: 1 | -1): Pt => {
    const l = place([0.46, -0.2], [0, 0], who.size, who.tilt, flip, aspect);
    return [lip[0] - l[0], lip[1] - l[1]];
  };

  if (k.extra === 'rain') {
    for (let i = 0; i < 90; i++) {
      const x = r();
      const y = r();
      line(p, [[x, y], [x - 0.02, y + 0.05]], k.hand.width * 0.7, 0.3);
    }
  }

  head(p, k.left, anchor(k.left, lipL, 1), 1, k.hand);
  head(p, k.right, anchor(k.right, lipR, -1), -1, k.hand);

  if (k.extra === 'hand') {
    // A hand at the jaw, which is what the other one is usually doing.
    const c: Pt = [0.34 + r() * 0.05, 0.56];
    const fingers: Pt[] = [];
    for (let i = 0; i < 4; i++) {
      fingers.push([c[0] + i * 0.022, c[1] - 0.02 - i * 0.006], [c[0] + 0.05 + i * 0.02, c[1] - 0.055 - i * 0.004]);
    }
    around(p, [[c[0] - 0.03, c[1] + 0.05], ...fingers, [c[0] + 0.11, c[1] + 0.06]], 2);
  }
  if (k.extra === 'heart') {
    const c: Pt = [0.5, 0.18];
    const pts: Pt[] = [];
    for (let i = 0; i <= 40; i++) {
      const t = (i / 40) * Math.PI * 2;
      pts.push([c[0] + 0.055 * Math.pow(Math.sin(t), 3), c[1] - 0.05 * (0.81 * Math.cos(t) - 0.31 * Math.cos(2 * t) - 0.12 * Math.cos(3 * t) - 0.03 * Math.cos(4 * t))]);
    }
    around(p, pts, 2);
  }
  if (k.extra === 'hair') {
    for (let i = 0; i < 9; i++) {
      const x = 0.5 + (r() - 0.5) * 0.5;
      const y = 0.2 + r() * 0.2;
      line(p, [[x, y], [x + (r() - 0.5) * 0.14, y - 0.06 - r() * 0.08]], k.hand.width, 0.4);
    }
  }
  g.restore();
}

export const ASPECT = 1;
