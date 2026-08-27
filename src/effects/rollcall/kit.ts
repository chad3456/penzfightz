import type p5 from 'p5';
import { cat, dial, mulberry, type Genome } from './genome';
import { LINE, WASH, arc, box, flat, pick, ring, slab, stroke, type Ink } from './ink';

/**
 * The geometry box.
 *
 * Twelve pieces of school equipment, each one drawn rather than looked up, out
 * of the same pen as every face and every flower. `species` is the switch;
 * `tool` picks which of the twelve; `livery` decides how it was finished and
 * `toolWear` how badly it has been treated since.
 *
 * The thing that stops these reading as icons is that an icon is a silhouette
 * and an object is a **stack of parts**. A pencil is not a pencil-shaped
 * outline: it is a wood cone, a graphite tip, a painted barrel with two seam
 * lines that tell you it is hexagonal, a crimped metal ferrule and a rubber. Get
 * those five in the right order at the right proportions and the thing is
 * unmistakable at forty pixels; draw the outline alone and it is a stick.
 *
 * And nothing in a geometry box is new. Wear is not decoration here — chips,
 * scuffs, a chewed end and a stub that has been sharpened away are what make
 * the tin read as somebody's rather than as a catalogue.
 */

const TOOL = {
  pencil: 0, ballpoint: 1, fountain: 2, ruler: 3, eraser: 4, sharpener: 5,
  compass: 6, protractor: 7, scissors: 8, glue: 9, chalk: 10, brush: 11,
} as const;

const LIVERY = { plain: 0, banded: 1, striped: 2, dotted: 3, twoTone: 4, chewed: 5 } as const;

const BODY = [
  '#d8a13c', '#c2392b', '#1f6fb2', '#2f8f5b', '#7a3fc2', '#2b2b2b',
  '#d05a2c', '#3a4657', '#8a6a2f', '#b8365a',
];
const METAL = '#b6b1a2';
const WOOD = '#e2c493';
const LEAD = '#3a3a3a';
const RUBBER = '#e6a6a2';
const CLEARISH = '#dfe4e0';

/**
 * How long and how broad each of the twelve actually is.
 *
 * One `half` and one `wide` for all twelve gave a protractor the proportions of
 * a ruler and put a tall rectangular shadow behind a semicircle. Length scales
 * the object; breadth only sizes the wash, because each drawing already knows
 * how wide its own parts are.
 */
const LONG = [1, 1, 1, 1, 0.55, 0.5, 0.95, 0.5, 0.95, 0.55, 0.46, 1];
const BROAD = [1, 1, 1, 1.15, 2.5, 2.3, 2.8, 2.6, 2.8, 1.7, 1.2, 1];

interface Tin {
  p: p5;
  r: () => number;
  ink: Ink;
  /** Half-length of the object along its own long axis. */
  half: number;
  /** Half-width across it. */
  wide: number;
  body: string;
  wear: number;
}

/** Outline a path in ink after it has been filled. */
function edge(t: Tin, path: [number, number][], w = 1) {
  t.p.stroke(LINE);
  t.p.noFill();
  stroke(t.p, path, t.ink, { close: true, passes: 1, weightScale: w });
}

/** A filled part with its outline, which is nearly every part of nearly every tool. */
function part(t: Tin, path: [number, number][], colour: string, w = 1) {
  flat(t.p, path, colour);
  edge(t, path, w);
}

// ------------------------------------------------------------------ livery

/**
 * How the barrel was finished.
 *
 * Clipped to the barrel rectangle by construction rather than by a mask: every
 * mark is generated inside `[y0, y1]` in the first place, which is cheaper than
 * clipping and means a stripe cannot escape onto the ferrule.
 */
function livery(t: Tin, gn: Genome, x: number, y0: number, y1: number, w: number) {
  const kind = cat(gn, 'livery');
  if (kind === LIVERY.plain) return;
  const p = t.p;
  const h = y1 - y0;
  const second = pick(BODY, dial(gn, 'toolWear'));

  if (kind === LIVERY.banded) {
    const n = 2 + Math.floor(t.r() * 2);
    for (let i = 0; i < n; i++) {
      const yy = y0 + h * (0.18 + (i / n) * 0.62);
      part(t, box(x, yy, w, h * 0.075), i % 2 ? METAL : second, 0.5);
    }
  } else if (kind === LIVERY.striped) {
    p.noStroke();
    p.fill(second);
    const n = 4;
    for (let i = 0; i < n; i++) {
      const xx = x - w / 2 + (w / n) * (i + 0.25);
      if (i % 2) p.rect(xx, y0 + h * 0.06, w / n * 0.5, h * 0.88);
    }
    p.stroke(LINE);
  } else if (kind === LIVERY.dotted) {
    p.noStroke();
    p.fill(second);
    for (let i = 0; i < 9; i++) {
      p.circle(x + (t.r() - 0.5) * w * 0.7, y0 + h * (0.08 + t.r() * 0.84), w * 0.17);
    }
    p.stroke(LINE);
  } else if (kind === LIVERY.twoTone) {
    part(t, box(x, y0 + h * 0.74, w, h * 0.5), second, 0.5);
  } else {
    // Chewed: bites out of one edge, and the tooth marks that go with them.
    p.noStroke();
    p.fill('#efeadd');
    const side = t.r() < 0.5 ? -1 : 1;
    for (let i = 0; i < 4; i++) {
      const yy = y0 + h * (0.1 + t.r() * 0.5);
      p.circle(x + (side * w) / 2, yy, w * (0.2 + t.r() * 0.2));
    }
    p.stroke(LINE);
    p.noFill();
    for (let i = 0; i < 3; i++) {
      const yy = y0 + h * (0.14 + t.r() * 0.5);
      stroke(t.p, [[x - w * 0.3, yy], [x + w * 0.3, yy + h * 0.02]], t.ink, {
        passes: 1,
        weightScale: 0.35,
      });
    }
  }
}

/** Scuffs and a chipped corner, in proportion to how hard a life it has had. */
function scuffs(t: Tin, x: number, y0: number, y1: number, w: number) {
  if (t.wear < 0.35) return;
  const p = t.p;
  p.stroke(LINE);
  p.noFill();
  const n = Math.round((t.wear - 0.35) * 9);
  for (let i = 0; i < n; i++) {
    const yy = y0 + (y1 - y0) * t.r();
    const len = w * (0.2 + t.r() * 0.5);
    stroke(
      p,
      [[x - len / 2 + (t.r() - 0.5) * w * 0.3, yy], [x + len / 2 + (t.r() - 0.5) * w * 0.3, yy + (t.r() - 0.5) * 0.03]],
      t.ink,
      { passes: 1, weightScale: 0.3 },
    );
  }
}

// ------------------------------------------------------------- the twelve

function pencil(t: Tin, gn: Genome) {
  const { half, wide } = t;
  // A stub is a stub: hard wear takes most of the barrel away.
  const tip = -half;
  const coneTo = tip + half * 0.34;
  const barrelTo = half * (t.wear > 0.72 ? 0.1 : 0.66);

  part(t, [[0, tip], [-wide / 2, coneTo], [wide / 2, coneTo]], WOOD);
  part(t, [[0, tip], [-wide * 0.17, tip + half * 0.14], [wide * 0.17, tip + half * 0.14]], LEAD, 0.6);
  part(t, box(0, (coneTo + barrelTo) / 2, wide, barrelTo - coneTo), t.body);
  // Two seam lines: the whole reason it reads as hexagonal rather than round.
  for (const s of [-1, 1]) {
    t.p.stroke(LINE);
    t.p.noFill();
    stroke(t.p, [[s * wide * 0.19, coneTo], [s * wide * 0.19, barrelTo]], t.ink, {
      passes: 1,
      weightScale: 0.4,
    });
  }
  livery(t, gn, 0, coneTo, barrelTo, wide);
  scuffs(t, 0, coneTo, barrelTo, wide);
  // Ferrule and rubber.
  const fer = barrelTo + half * 0.12;
  part(t, box(0, (barrelTo + fer) / 2, wide * 1.06, fer - barrelTo), METAL, 0.6);
  for (let i = 0; i < 2; i++) {
    const yy = barrelTo + (fer - barrelTo) * (0.34 + i * 0.34);
    t.p.stroke(LINE);
    t.p.noFill();
    stroke(t.p, [[-wide * 0.5, yy], [wide * 0.5, yy]], t.ink, { passes: 1, weightScale: 0.35 });
  }
  part(t, slab(0, fer + half * 0.09, wide * 0.98, half * 0.18, wide * 0.3), RUBBER, 0.7);
}

function ballpoint(t: Tin, gn: Genome) {
  const { half, wide } = t;
  const tip = -half;
  const coneTo = tip + half * 0.26;
  const capFrom = half * 0.3;
  part(t, [[0, tip], [-wide * 0.42, coneTo], [wide * 0.42, coneTo]], METAL);
  part(t, box(0, tip + half * 0.05, wide * 0.1, half * 0.1), LEAD, 0.4);
  part(t, box(0, (coneTo + capFrom) / 2, wide, capFrom - coneTo), t.body);
  livery(t, gn, 0, coneTo, capFrom, wide);
  scuffs(t, 0, coneTo, capFrom, wide);
  // The cap, and the clip that is the giveaway.
  part(t, slab(0, (capFrom + half) / 2, wide * 1.08, half - capFrom, wide * 0.24), t.body);
  part(t, box(wide * 0.5, (capFrom + half * 0.86) / 2 + half * 0.1, wide * 0.16, (half - capFrom) * 0.72), METAL, 0.5);
}

function fountain(t: Tin, gn: Genome) {
  const { half, wide } = t;
  const tip = -half;
  const nibTo = tip + half * 0.3;
  // The nib: a leaf with a slit up the middle and a breather hole.
  const nib: [number, number][] = [
    [0, tip], [-wide * 0.34, tip + half * 0.16], [-wide * 0.36, nibTo],
    [wide * 0.36, nibTo], [wide * 0.34, tip + half * 0.16],
  ];
  part(t, nib, '#d8b447');
  t.p.stroke(LINE);
  t.p.noFill();
  stroke(t.p, [[0, tip + half * 0.03], [0, nibTo - half * 0.06]], t.ink, { passes: 1, weightScale: 0.4 });
  t.p.noStroke();
  t.p.fill('#efeadd');
  t.p.circle(0, nibTo - half * 0.05, wide * 0.16);
  t.p.stroke(LINE);

  const capFrom = half * 0.16;
  part(t, box(0, (nibTo + capFrom) / 2, wide * 0.94, capFrom - nibTo), t.body);
  livery(t, gn, 0, nibTo, capFrom, wide * 0.94);
  part(t, slab(0, (capFrom + half) / 2, wide * 1.06, half - capFrom, wide * 0.2), t.body);
  part(t, box(0, capFrom + half * 0.07, wide * 1.08, half * 0.09), '#d8b447', 0.5);
  scuffs(t, 0, nibTo, capFrom, wide);
}

function ruler(t: Tin, gn: Genome) {
  const { half } = t;
  const w = t.wide * 2.1;
  const body = slab(0, 0, w, half * 2, w * 0.12);
  part(t, body, cat(gn, 'livery') === LIVERY.plain ? CLEARISH : t.body);
  // Ticks up one edge, every fifth one long. The numbers are dashes: at this
  // size a real numeral is three grey pixels and a lie.
  t.p.stroke(LINE);
  t.p.noFill();
  const n = 22;
  for (let i = 1; i < n; i++) {
    const yy = -half + (i / n) * half * 2;
    const long = i % 5 === 0;
    stroke(t.p, [[-w / 2, yy], [-w / 2 + w * (long ? 0.44 : 0.24), yy]], t.ink, {
      passes: 1,
      weightScale: 0.35,
    });
    if (long) {
      stroke(t.p, [[w * 0.06, yy], [w * 0.22, yy]], t.ink, { passes: 1, weightScale: 0.3 });
    }
  }
  t.p.noStroke();
  t.p.fill('#efeadd');
  t.p.circle(0, half * 0.86, w * 0.2);
  edge(t, ring(0, half * 0.86, w * 0.2), 0.5);
  scuffs(t, 0, -half, half, w * 0.7);
}

function eraser(t: Tin, gn: Genome) {
  const h = t.half * 1.15;
  const w = t.wide * 2.4;
  part(t, slab(0, 0, w, h * 2, w * 0.16), cat(gn, 'livery') === LIVERY.twoTone ? t.body : RUBBER);
  // The paper sleeve, notched at both ends the way they always are.
  part(t, box(0, h * 0.06, w * 1.04, h * 0.46), t.body, 0.7);
  for (const s of [-1, 1]) {
    t.p.noStroke();
    t.p.fill(RUBBER);
    t.p.triangle(
      (s * w) / 2, h * 0.06 - h * 0.23,
      (s * w) / 2, h * 0.06 + h * 0.23,
      (s * w) / 2 - s * w * 0.14, h * 0.06,
    );
    t.p.stroke(LINE);
  }
  // A rounded-off corner: nobody's eraser has four square ones.
  if (t.wear > 0.4) {
    t.p.noStroke();
    t.p.fill('#efeadd');
    t.p.circle(-w * 0.5, -h * 0.92, w * (0.2 + t.wear * 0.24));
    t.p.stroke(LINE);
  }
}

function sharpener(t: Tin) {
  const h = t.half * 0.72;
  const w = t.wide * 2.2;
  part(t, slab(0, 0, w, h * 2, w * 0.12), t.body);
  // The cone hole, and the blade over it with its one screw.
  part(t, ring(-w * 0.16, 0, w * 0.5), '#2a2620', 0.6);
  part(t, box(w * 0.2, 0, w * 0.34, h * 1.5), METAL, 0.6);
  t.p.noStroke();
  t.p.fill(LINE);
  t.p.circle(w * 0.2, 0, w * 0.11);
  t.p.stroke(LINE);
  scuffs(t, 0, -h, h, w * 0.7);
}

function compass(t: Tin) {
  const { half, wide } = t;
  const spread = wide * (2.4 + t.r() * 1.1);
  const hinge: [number, number] = [0, -half * 0.92];
  const foot = half * 0.86;
  const legs: [number, number][][] = [
    [hinge, [-spread, foot]],
    [hinge, [spread, foot]],
  ];
  t.p.stroke(LINE);
  t.p.noFill();
  for (const l of legs) stroke(t.p, l, t.ink, { weightScale: 3.2 });
  // The knurled knob on top.
  part(t, ring(hinge[0], hinge[1] - half * 0.04, wide * 0.85), METAL, 0.7);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI;
    stroke(
      t.p,
      [
        [hinge[0] + Math.cos(a) * wide * 0.4, hinge[1] - half * 0.04 + Math.sin(a) * wide * 0.4],
        [hinge[0] - Math.cos(a) * wide * 0.4, hinge[1] - half * 0.04 - Math.sin(a) * wide * 0.4],
      ],
      t.ink,
      { passes: 1, weightScale: 0.3 },
    );
  }
  // One leg ends in a needle, the other holds a stub of pencil.
  part(t, [[-spread, foot + half * 0.08], [-spread - wide * 0.26, foot - half * 0.18], [-spread + wide * 0.26, foot - half * 0.18]], METAL, 0.6);
  part(t, box(spread, foot - half * 0.2, wide * 0.6, half * 0.32), t.body, 0.7);
  part(t, [[spread, foot + half * 0.1], [spread - wide * 0.28, foot - half * 0.04], [spread + wide * 0.28, foot - half * 0.04]], LEAD, 0.5);
}

function protractor(t: Tin) {
  const rr = t.wide * 2.3;
  const flat0 = t.half * 0.5;
  const half0: [number, number][] = [
    ...arc(0, flat0, rr * 2, Math.PI, Math.PI * 2).map(([x, y]) => [x, y] as [number, number]),
  ];
  part(t, half0, CLEARISH);
  t.p.stroke(LINE);
  t.p.noFill();
  stroke(t.p, [[-rr, flat0], [rr, flat0]], t.ink, { passes: 1 });
  // Degree ticks around the arc, long every thirty.
  for (let i = 0; i <= 18; i++) {
    const a = Math.PI + (i / 18) * Math.PI;
    const long = i % 3 === 0;
    const r0 = rr * (long ? 0.76 : 0.86);
    stroke(
      t.p,
      [
        [Math.cos(a) * r0, flat0 + Math.sin(a) * r0],
        [Math.cos(a) * rr * 0.98, flat0 + Math.sin(a) * rr * 0.98],
      ],
      t.ink,
      { passes: 1, weightScale: 0.32 },
    );
  }
  // The centre notch on the baseline.
  part(t, [[-rr * 0.1, flat0], [rr * 0.1, flat0], [0, flat0 - rr * 0.14]], '#efeadd', 0.5);
  scuffs(t, 0, flat0 - rr * 0.8, flat0, rr);
}

function scissors(t: Tin) {
  const { half, wide } = t;
  const p = t.p;
  const px = 0;
  const py = -half * 0.08;
  const W = wide * 2.2;

  for (const side of [-1, 1]) {
    // The blade: a real wedge from the pivot to a point, not a line. The first
    // version stroked two thin paths and the whole thing read as a wishbone.
    const tipX = side * W * 0.42;
    const tipY = -half;
    const blade: [number, number][] = [
      [px + side * wide * 0.06, py],
      [px + side * wide * 0.34, py - half * 0.1],
      [tipX + side * wide * 0.06, tipY + half * 0.06],
      [tipX, tipY],
      [px - side * wide * 0.16, py - half * 0.06],
    ];
    part(t, blade, METAL, 0.8);

    // Handle: a shank down and out to a loop big enough to be a loop.
    const lx = px - side * W * 0.34;
    const ly = half * 0.72;
    const shank: [number, number][] = [
      [px - side * wide * 0.12, py],
      [px - side * W * 0.16, py + half * 0.44],
      [lx, ly - wide * 0.5],
    ];
    p.stroke(LINE);
    p.noFill();
    stroke(p, shank, t.ink, { weightScale: 2.2 });
    part(t, ring(lx, ly, wide * 1.5, 1.15), t.body, 0.9);
    p.noStroke();
    p.fill('#efeadd');
    p.ellipse(lx, ly, wide * 0.86, wide * 0.99);
    p.stroke(LINE);
    edge(t, ring(lx, ly, wide * 0.9, 1.15), 0.5);
  }

  p.noStroke();
  p.fill(LINE);
  p.circle(px, py, wide * 0.3);
  p.stroke(LINE);
}

function glue(t: Tin, gn: Genome) {
  const { half, wide } = t;
  const capFrom = half * 0.28;
  part(t, slab(0, (-half + capFrom) / 2, wide * 1.5, half + capFrom, wide * 0.16), t.body);
  livery(t, gn, 0, -half, capFrom, wide * 1.5);
  // The label, which is the only flat white thing in the tin.
  part(t, box(0, -half * 0.24, wide * 1.2, half * 0.6), '#f2eee0', 0.6);
  t.p.stroke(LINE);
  t.p.noFill();
  for (let i = 0; i < 3; i++) {
    const yy = -half * 0.44 + i * half * 0.2;
    stroke(t.p, [[-wide * 0.44, yy], [wide * (i === 2 ? 0.1 : 0.44), yy]], t.ink, {
      passes: 1,
      weightScale: 0.3,
    });
  }
  part(t, slab(0, (capFrom + half) / 2, wide * 1.56, half - capFrom, wide * 0.16), METAL, 0.8);
  scuffs(t, 0, -half, capFrom, wide);
}

function chalk(t: Tin) {
  const h = t.half;
  const w = t.wide * 1.7;
  part(t, [[-w * 0.44, -h], [w * 0.44, -h], [w * 0.5, h], [-w * 0.5, h]], '#f7f4ea');
  // Dust. A stick of chalk with no dust round it is a candle — and the first
  // pass made the dust two shades off the paper, so there may as well not have
  // been any.
  t.p.noStroke();
  t.p.fill('#cdc7b4');
  for (let i = 0; i < 30; i++) {
    const a = t.r() * Math.PI * 2;
    const rr = w * (0.55 + t.r() * 1.3);
    t.p.circle(Math.cos(a) * rr, h * 0.86 + Math.sin(a) * rr * 0.45, w * (0.05 + t.r() * 0.06));
  }
  t.p.stroke(LINE);
  t.p.noFill();
  // The worn end, and the ghost of a grip halfway down.
  stroke(t.p, [[-w * 0.42, -h + h * 0.14], [w * 0.42, -h + h * 0.1]], t.ink, {
    passes: 1,
    weightScale: 0.5,
  });
  for (let i = 0; i < 2; i++) {
    stroke(t.p, [[-w * 0.3, h * (0.1 + i * 0.2)], [w * 0.32, h * (0.12 + i * 0.2)]], t.ink, {
      passes: 1,
      weightScale: 0.3,
    });
  }
}

function brush(t: Tin, gn: Genome) {
  const { half, wide } = t;
  const bristleTo = -half * 0.42;
  const ferTo = -half * 0.18;
  // Bristles: a soft wedge, with hairs drawn over it so it is not a leaf.
  const tuft: [number, number][] = [
    [0, -half], [-wide * 0.3, -half * 0.72], [-wide * 0.36, bristleTo],
    [wide * 0.36, bristleTo], [wide * 0.3, -half * 0.72],
  ];
  part(t, tuft, '#8a6a4a');
  t.p.stroke(LINE);
  t.p.noFill();
  for (let i = 0; i < 5; i++) {
    const x = -wide * 0.26 + (i / 4) * wide * 0.52;
    stroke(t.p, [[x * 0.4, -half * 0.94], [x, bristleTo]], t.ink, { passes: 1, weightScale: 0.3 });
  }
  part(t, box(0, (bristleTo + ferTo) / 2, wide * 0.82, ferTo - bristleTo), METAL, 0.7);
  for (let i = 0; i < 2; i++) {
    const yy = bristleTo + (ferTo - bristleTo) * (0.3 + i * 0.4);
    stroke(t.p, [[-wide * 0.4, yy], [wide * 0.4, yy]], t.ink, { passes: 1, weightScale: 0.3 });
  }
  part(t, [[-wide * 0.4, ferTo], [wide * 0.4, ferTo], [wide * 0.22, half], [-wide * 0.22, half]], t.body);
  livery(t, gn, 0, ferTo, half, wide * 0.6);
  scuffs(t, 0, ferTo, half, wide * 0.6);
}

// ----------------------------------------------------------------- assembly

export function drawKit(p: p5, gn: Genome, size: number, style: { colour?: boolean } = {}) {
  const seed = Math.floor(gn.g[3] * 1e9) >>> 0;
  const r = mulberry(Math.floor(gn.g[0] * 1e9) ^ Math.floor(gn.g[5] * 1e6) ^ 0x2ab7);
  const which = cat(gn, 'tool');

  const t: Tin = {
    p,
    r,
    ink: {
      tremor: 0.004 + dial(gn, 'tremor') * 0.012,
      weight: (1 + dial(gn, 'weight') * 1.8) / 100,
      seed,
    },
    // The long ones really are long; a ruler the length of an eraser reads as
    // neither.
    half: (0.5 + dial(gn, 'toolLen') * 0.5) * LONG[which],
    wide: 0.13 + dial(gn, 'headWidth') * 0.1,
    body: pick(BODY, dial(gn, 'toolInk')),
    wear: dial(gn, 'toolWear'),
  };

  p.push();
  p.scale(size / 2.35);
  // Nothing lies square in a pencil tin.
  p.rotate((dial(gn, 'headTilt') - 0.5) * 0.7);

  if (style.colour !== false && cat(gn, 'paper') !== 0) {
    // The same off-register wash the faces get: the shadow it was drawn over.
    const tint = pick(WASH, dial(gn, 'washScale'));
    flat(
      p,
      slab(
        (dial(gn, 'washOffX') - 0.5) * 0.16,
        (dial(gn, 'washOffY') - 0.5) * 0.16,
        t.wide * 2.2 * BROAD[which],
        t.half * 2.3,
        t.wide,
      ),
      tint,
    );
  }

  switch (which) {
    case TOOL.ballpoint: ballpoint(t, gn); break;
    case TOOL.fountain: fountain(t, gn); break;
    case TOOL.ruler: ruler(t, gn); break;
    case TOOL.eraser: eraser(t, gn); break;
    case TOOL.sharpener: sharpener(t); break;
    case TOOL.compass: compass(t); break;
    case TOOL.protractor: protractor(t); break;
    case TOOL.scissors: scissors(t); break;
    case TOOL.glue: glue(t, gn); break;
    case TOOL.chalk: chalk(t); break;
    case TOOL.brush: brush(t, gn); break;
    default: pencil(t, gn);
  }

  p.pop();
}

/** What each of the twelve is called, for the card. */
export const TOOL_NAMES = [
  'Pencil', 'Ballpoint', 'Fountain pen', 'Ruler', 'Eraser', 'Sharpener',
  'Compass', 'Protractor', 'Scissors', 'Glue stick', 'Chalk', 'Paintbrush',
];
