import type p5 from 'p5';
import { cat, dial, mulberry, type Genome } from './genome';
import { LINE, WASH, flat, pick, ring, stroke, type Ink } from './ink';

/**
 * Blooms.
 *
 * Not a second generator. The same genome, the same novelty search, the same
 * pen out of `ink.ts` — a flower simply reads a different eighteen of the
 * genes than a face does, and `species` is the switch that decides which.
 *
 * What makes a drawn flower read as drawn rather than as a symmetry exercise is
 * that **no two petals are the same petal**. A generator that lays one shape
 * around a circle at equal angles produces a rosette, which is a pattern, not a
 * flower. So every petal here gets its own length, its own width, its own
 * angular nudge and its own place in the draw order, and the ones at the back
 * are drawn first and overlapped. The tremor in the outline does the rest.
 *
 * The other thing is that a flower is mostly *not* the flower. The stem, the
 * bend in it and the leaves carry more of the character than the petals do —
 * a bloom with no stem reads as a sticker.
 */

/** Petals, from the ones a child draws first to the ones they never do. */
const PETAL = {
  round: 0, lance: 1, heart: 2, spoon: 3, ragged: 4, spike: 5, trumpet: 6, quill: 7,
} as const;

const BLOOM_INK = [
  '#d94f4f', '#e07a2c', '#e8b93c', '#f0d95e', '#f4efdd', '#e58bb8', '#c95a9a',
  '#9a5ec2', '#6a6fc4', '#4a8fd0', '#3f9a7a', '#8fbf4a', '#d05a2c', '#b8365a',
];
const CENTRE_INK = ['#6b4a1f', '#8a6a2a', '#5a4a30', '#d8b83c', '#4a3f2c', '#a8862f'];
const GREEN = ['#4a7a3a', '#5f8a44', '#3f6a34', '#7a8f4a', '#6a7a3a', '#557a4a'];

/**
 * Push a colour towards the paper.
 *
 * These have been in a book for eleven years. Nothing that has been pressed
 * comes out the colour it went in, and a page of full-strength petals looks
 * like a seed catalogue rather than something kept.
 */
function fade(hex: string, t: number): string {
  const n = parseInt(hex.slice(1), 16);
  const to = 0xf1ecdf;
  const mix = (sh: number) => {
    const a = (n >> sh) & 255;
    const b = (to >> sh) & 255;
    return Math.round(a + (b - a) * t);
  };
  return `rgb(${mix(16)}, ${mix(8)}, ${mix(0)})`;
}

interface Bed {
  p: p5;
  r: () => number;
  ink: Ink;
  /** Where the bloom sits. The stem hangs off this. */
  cx: number;
  cy: number;
}

// ------------------------------------------------------------------- petals

/**
 * One petal, base at the origin, pointing along +x.
 *
 * Held to unit-ish proportions and scaled by the caller, so a family is a
 * *shape* and the length and width stay the bloom's business.
 */
function petalPath(kind: number, L: number, W: number, r: () => number): [number, number][] {
  switch (kind) {
    case PETAL.lance:
      return [
        [0, 0], [L * 0.3, -W * 0.4], [L * 0.7, -W * 0.3], [L * 1.05, 0],
        [L * 0.7, W * 0.3], [L * 0.3, W * 0.4],
      ];
    case PETAL.heart:
      // Round, with the tip notched back in on itself.
      return [
        [0, 0], [L * 0.28, -W * 0.6], [L * 0.74, -W * 0.66], [L * 1.0, -W * 0.3],
        [L * 0.78, 0], [L * 1.0, W * 0.3], [L * 0.74, W * 0.66], [L * 0.28, W * 0.6],
      ];
    case PETAL.spoon:
      return [
        [0, 0], [L * 0.36, -W * 0.22], [L * 0.64, -W * 0.62], [L * 0.95, -W * 0.44],
        [L * 1.04, 0], [L * 0.95, W * 0.44], [L * 0.64, W * 0.62], [L * 0.36, W * 0.22],
      ];
    case PETAL.ragged: {
      // A round petal with the edge torn. The jitter is per-petal, so no two
      // are torn the same way.
      const out: [number, number][] = [];
      const n = 11;
      for (let i = 0; i < n; i++) {
        const t = (i / n) * Math.PI * 2;
        const wob = 0.78 + r() * 0.34;
        out.push([
          L * 0.52 + Math.cos(t) * L * 0.54 * wob,
          Math.sin(t) * W * 0.62 * wob,
        ]);
      }
      return out;
    }
    case PETAL.spike:
      return [[0, 0], [L * 0.5, -W * 0.3], [L * 1.12, 0], [L * 0.5, W * 0.3]];
    case PETAL.trumpet:
      // Narrow at the base, flaring open at the mouth.
      return [
        [0, 0], [L * 0.4, -W * 0.28], [L * 0.82, -W * 0.78], [L * 1.06, -W * 0.5],
        [L * 1.0, 0], [L * 1.06, W * 0.5], [L * 0.82, W * 0.78], [L * 0.4, W * 0.28],
      ];
    case PETAL.quill:
      // Thin, and bowed to one side, which is what stops a chrysanthemum
      // looking like a bicycle wheel.
      return [
        [0, 0], [L * 0.35, -W * 0.2], [L * 0.76, -W * 0.24], [L * 1.1, -W * 0.06],
        [L * 0.8, W * 0.12], [L * 0.36, W * 0.14],
      ];
    default:
      return [
        [0, 0], [L * 0.25, -W * 0.55], [L * 0.62, -W * 0.62], [L * 1.0, -W * 0.18],
        [L * 1.04, 0], [L * 1.0, W * 0.18], [L * 0.62, W * 0.62], [L * 0.25, W * 0.55],
      ];
  }
}

function petals(b: Bed, gn: Genome, colour: string) {
  const kind = cat(gn, 'petal');
  const p = b.p;
  // Quills and spikes come in crowds; trumpets come in fives.
  const crowd = kind === PETAL.quill || kind === PETAL.spike;
  const few = kind === PETAL.trumpet;
  const lo = crowd ? 11 : few ? 4 : 5;
  const hi = crowd ? 21 : few ? 6 : 12;
  const n = Math.round(lo + dial(gn, 'petals') * (hi - lo));

  const L = (0.34 + dial(gn, 'petalLen') * 0.36) * (crowd ? 1.12 : 1);
  // Width falls off as the count rises. A fixed width at fourteen petals gives
  // a solid disc with no individual petal readable in it, which is a pom-pom,
  // not a flower.
  const W = L * Math.min(crowd ? 0.3 : kind === PETAL.lance ? 0.52 : 0.78, 2.7 / n);
  // A second, shorter ring on the fuller families, offset by half a step so it
  // shows through the gaps rather than hiding behind the front row.
  const rings = crowd || kind === PETAL.ragged ? 2 : 1;

  for (let ringN = rings - 1; ringN >= 0; ringN--) {
    const scale = ringN === 0 ? 1 : 0.68;
    const half = ringN === 0 ? 0 : Math.PI / n;
    for (let i = 0; i < n; i++) {
      // Every petal its own length, width and angle. Equal angles and one
      // shared shape is a rosette, and a rosette is a pattern, not a flower.
      const jitterA = (b.r() - 0.5) * (Math.PI / n) * 0.8;
      const jitterL = 0.84 + b.r() * 0.32;
      const a = (i / n) * Math.PI * 2 + half + jitterA;
      p.push();
      p.translate(b.cx, b.cy);
      p.rotate(a);
      const path = petalPath(kind, L * scale * jitterL, W * scale * jitterL, b.r);
      flat(p, path, ringN === 0 ? colour : fade(colour, 0.28));
      p.stroke(LINE);
      p.noFill();
      stroke(p, path, b.ink, { close: true, passes: 1, weightScale: 0.8 });
      p.pop();
    }
  }
}

// ------------------------------------------------------------------- centre

function centre(b: Bed, gn: Genome) {
  const kind = cat(gn, 'centre');
  const p = b.p;
  const s = (0.075 + dial(gn, 'centreSize') * 0.105) * (cat(gn, 'petal') === 5 ? 0.75 : 1);
  const ink = pick(CENTRE_INK, dial(gn, 'petalInk'));
  const { cx, cy } = b;

  if (kind === 5) {
    // Open: a bare ring, so the petals meet nothing in the middle.
    p.stroke(LINE);
    p.noFill();
    stroke(p, ring(cx, cy, s * 1.1), b.ink, { close: true, passes: 1 });
    return;
  }

  flat(p, ring(cx, cy, s * 2), ink);
  p.stroke(LINE);
  p.noFill();
  stroke(p, ring(cx, cy, s * 2), b.ink, { close: true, passes: 1 });

  if (kind === 0) {
    // Disc: radial hatching, which is the cheapest thing that reads as florets.
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2 + b.r() * 0.1;
      stroke(
        p,
        [
          [cx + Math.cos(a) * s * 0.35, cy + Math.sin(a) * s * 0.35],
          [cx + Math.cos(a) * s * 0.94, cy + Math.sin(a) * s * 0.94],
        ],
        b.ink,
        { passes: 1, weightScale: 0.45 },
      );
    }
  } else if (kind === 1) {
    // Spiral: seeds placed on the golden angle, which is where a real seed head
    // puts them and the only arrangement that fills a disc without rings.
    p.noStroke();
    p.fill('#2f2a22');
    const seeds = 46;
    for (let i = 0; i < seeds; i++) {
      const rr = Math.sqrt(i / seeds) * s * 0.92;
      const a = i * 2.399963;
      p.circle(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, s * 0.15);
    }
    p.stroke(LINE);
  } else if (kind === 2) {
    p.noFill();
    p.stroke(LINE);
    stroke(p, ring(cx, cy, s * 1.1), b.ink, { close: true, passes: 1, weightScale: 0.6 });
    p.noStroke();
    p.fill('#2f2a22');
    p.circle(cx, cy, s * 0.5);
    p.stroke(LINE);
  } else if (kind === 3) {
    // Stamens: stalks out past the disc with a head on each.
    const n = 6 + Math.floor(b.r() * 4);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + b.r() * 0.3;
      const len = s * (1.3 + b.r() * 0.7);
      p.stroke(LINE);
      p.noFill();
      stroke(p, [[cx, cy], [cx + Math.cos(a) * len, cy + Math.sin(a) * len]], b.ink, {
        passes: 1,
        weightScale: 0.5,
      });
      p.noStroke();
      p.fill('#d8b83c');
      p.circle(cx + Math.cos(a) * len, cy + Math.sin(a) * len, s * 0.28);
    }
    p.stroke(LINE);
  } else {
    // Seeds: a lattice of little ovals, clipped to the disc by distance.
    p.noStroke();
    p.fill('#3a3226');
    const step = s * 0.34;
    for (let x = -s; x <= s; x += step) {
      for (let y = -s; y <= s; y += step) {
        if (x * x + y * y > s * s * 0.86) continue;
        p.ellipse(cx + x, cy + y, step * 0.55, step * 0.8);
      }
    }
    p.stroke(LINE);
  }
}

// -------------------------------------------------------------- stem, leaves

/** The stem, returned as a path so the leaves can hang off the real curve. */
function stemPath(gn: Genome, cx: number, cy: number): [number, number][] {
  const kind = cat(gn, 'stem');
  const len = (0.78 + dial(gn, 'stemLen') * 0.72) * (kind === 3 ? 0.3 : 1);
  const bend = (dial(gn, 'stemBend') - 0.5) * (kind === 0 ? 0.06 : kind === 2 ? 0.9 : 0.5);
  const out: [number, number][] = [];
  const steps = 9;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    // A crooked stem kinks once rather than bowing; a curved one bows.
    const off = kind === 2 ? bend * (t < 0.5 ? t : 1 - t) * 2 : bend * Math.sin(t * Math.PI * 0.8);
    out.push([cx + off, cy + t * len]);
  }
  return out;
}

function leaves(b: Bed, gn: Genome, path: [number, number][]) {
  const kind = cat(gn, 'leaf');
  if (kind === 0) return;
  const p = b.p;
  const s = 0.2 + dial(gn, 'leafSize') * 0.26;
  const green = pick(GREEN, dial(gn, 'petalInk'));

  const blade = (x: number, y: number, a: number, len: number) => {
    const path2: [number, number][] = [
      [0, 0], [len * 0.35, -len * 0.3], [len * 0.75, -len * 0.26],
      [len * 1.02, 0], [len * 0.75, len * 0.26], [len * 0.35, len * 0.3],
    ];
    p.push();
    p.translate(x, y);
    p.rotate(a);
    flat(p, path2, green);
    p.stroke(LINE);
    p.noFill();
    stroke(p, path2, b.ink, { close: true, passes: 1, weightScale: 0.7 });
    // The midrib. Without it a leaf is a blob.
    stroke(p, [[len * 0.06, 0], [len * 0.9, 0]], b.ink, { passes: 1, weightScale: 0.4 });
    p.pop();
  };

  const at = (t: number) => path[Math.min(path.length - 1, Math.round(t * (path.length - 1)))];

  if (kind === 1) {
    const [x, y] = at(0.62);
    blade(x, y, -0.5, s);
    blade(x, y, Math.PI + 0.5, s * 0.88);
  } else if (kind === 2) {
    const [x, y] = at(0.72);
    blade(x, y, b.r() < 0.5 ? -0.6 : Math.PI + 0.6, s * 1.1);
  } else if (kind === 3) {
    // A whorl: three or four out of one point on the stem.
    const [x, y] = at(0.56);
    const n = 3 + Math.floor(b.r() * 2);
    for (let i = 0; i < n; i++) blade(x, y, Math.PI * 0.25 + (i / n) * Math.PI * 1.5, s * 0.86);
  } else {
    // A sheath: one long blade running most of the way up beside the stem.
    const [x, y] = at(0.86);
    blade(x, y, -1.35 + (b.r() - 0.5) * 0.4, s * 2.1);
  }
}

// ----------------------------------------------------------------- assembly

export function drawBloom(p: p5, gn: Genome, size: number, style: { colour?: boolean } = {}) {
  const seed = Math.floor(gn.g[3] * 1e9) >>> 0;
  const r = mulberry(Math.floor(gn.g[0] * 1e9) ^ Math.floor(gn.g[5] * 1e6) ^ 0x71c3);
  const ink: Ink = {
    tremor: 0.004 + dial(gn, 'tremor') * 0.014,
    weight: (0.9 + dial(gn, 'weight') * 1.9) / 100,
    seed,
  };

  p.push();
  p.scale(size / 2.35);
  // A pressed flower is never square to the page.
  p.rotate((dial(gn, 'bloomTilt') - 0.5) * 0.5);

  const cx = (dial(gn, 'washOffX') - 0.5) * 0.12;
  const cy = -0.44 + (dial(gn, 'headHeight') - 0.5) * 0.14;
  const b: Bed = { p, r, ink, cx, cy };

  // Colour: the ramp, then faded by however long it has been in the book.
  const raw = pick(BLOOM_INK, dial(gn, 'petalInk'));
  const colour = fade(raw, 0.1 + dial(gn, 'skin') * 0.45);

  // The wash blob, off register, exactly as the faces do it.
  if (style.colour !== false && cat(gn, 'paper') !== 0) {
    const tint = pick(WASH, dial(gn, 'washScale'));
    const blob = ring(
      cx + (dial(gn, 'washOffX') - 0.5) * 0.2,
      cy + (dial(gn, 'washOffY') - 0.5) * 0.2,
      (1.3 + dial(gn, 'headWidth') * 0.5) * (0.6 + dial(gn, 'petalLen') * 0.5),
      0.94,
    );
    flat(p, blob, tint);
  }

  const stem = stemPath(gn, cx, cy);
  p.stroke(LINE);
  p.noFill();
  stroke(p, stem, ink, { weightScale: 1.15 });
  leaves(b, gn, stem);
  petals(b, gn, colour);
  centre(b, gn);

  p.pop();
}
