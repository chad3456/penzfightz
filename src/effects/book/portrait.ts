import { Pad, type Pt } from '../flat/pad';
import { bristle, fade, grain, ground, rng, scuff, shift } from './crayon';
import { LINE, PAPER, type Skin } from './tone';

/**
 * One portrait.
 *
 * The style is fixed and the person is not. That is the whole design: a picture
 * book has exactly one hand in it, and the reason a hundred spreads do not look
 * like a hundred different books is that the mark never changes — only the
 * face under it does. So every card here gets the same torn ground, the same
 * warm charcoal line, the same pencil scuff over every fill and the same grain
 * on top, and what varies is the head, the hair, the hat, the glasses and the
 * shirt.
 *
 * ### The proportions are the joke
 *
 * These faces are funny for one structural reason, and it is not the beard. The
 * cranium is small, the features are crowded into the bottom third of it, the
 * ears are enormous and the eyes are twice the size they should be. Every one
 * of those is a fixed ratio here rather than a random one, because the moment
 * you let them vary the drawings stop being one artist's and start being a
 * generator's.
 */

export type Hat = 'straw' | 'flatcap' | 'beanie' | 'cap' | 'scarf' | 'none';
export type Glasses = 'round' | 'square' | 'half' | 'none';
export type Beard = 'full' | 'chin' | 'goatee' | 'moustache' | 'stubble' | 'none';
export type Cut = 'crop' | 'mop' | 'long' | 'bald' | 'bun' | 'curls' | 'tuft';
export type Mouth = 'smile' | 'flat' | 'open' | 'purse' | 'whistle';

export interface Person {
  seed: number;
  name: string;
  note: string;
  ground: [string, string];
  skin: Skin;
  hair: string;
  cloth: string;
  under: string;
  hatColour: string;
  hat: Hat;
  glasses: Glasses;
  beard: Beard;
  cut: Cut;
  mouth: Mouth;
  /** A hoop, a stud, or nothing. Small, and it does a lot of work. */
  ear: 'hoop' | 'stud' | 'none';
  /** Small proportions, all near 1. */
  wide: number;
  long: number;
  /** Which way they are looking, −1 to 1. */
  gaze: number;
  brow: number;
}

const CX = 0.5;
const TOP = 0.245;
const CHIN = 0.6;
const HW = 0.15;
const EYE_Y = 0.418;
const EAR_Y = 0.435;

/** A smoothed ring of points. Everything organic here is one of these. */
function oval(cx: number, cy: number, rx: number, ry: number, n = 14, wob = 0, r?: () => number): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k = wob && r ? 1 + (r() - 0.5) * wob : 1;
    out.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  return out;
}

function headPath(p: Person): Pt[] {
  const hw = HW * p.wide;
  const chin = CHIN * p.long + (1 - p.long) * CHIN;
  const hh = chin - TOP;
  // Narrow at the crown, widest at the cheekbone, tucked in at the jaw. A head
  // drawn as an ellipse is an egg; the two inflections are the whole face.
  return [
    [CX, TOP],
    [CX + hw * 0.66, TOP + hh * 0.045],
    [CX + hw * 0.99, TOP + hh * 0.36],
    [CX + hw * 0.97, TOP + hh * 0.66],
    [CX + hw * 0.66, chin - hh * 0.055],
    [CX, chin],
    [CX - hw * 0.66, chin - hh * 0.055],
    [CX - hw * 0.97, TOP + hh * 0.66],
    [CX - hw * 0.99, TOP + hh * 0.36],
    [CX - hw * 0.66, TOP + hh * 0.045],
  ];
}

// ------------------------------------------------------------------- pieces

const COLLAR = 0.712;

function body(pad: Pad, p: Person, r: () => number) {
  const collar = COLLAR;
  // Wide. A picture-book figure is a head sitting on a hill of shoulder that
  // runs off both sides of the card, and a narrow pair reads as a passport
  // photograph of somebody unwell.
  const shoulder: Pt[] = [
    [0.5 - 0.098, collar - 0.02],
    [0.5 - 0.3, collar + 0.06],
    [0.5 - 0.46, 1.05],
    [0.5 + 0.46, 1.05],
    [0.5 + 0.3, collar + 0.06],
    [0.5 + 0.098, collar - 0.02],
  ];
  pad.shape(shoulder, p.cloth);
  pad.clip(shoulder, () => scuff(pad, [0.1, collar, 0.9, 1], p.cloth, { n: 130, angle: 1.2, len: 0.16, alpha: 0.26 }));

  // What is under the collar, in the gap the shirt leaves.
  pad.shape(
    [
      [0.5 - 0.062, collar - 0.03],
      [0.5 - 0.04, collar + 0.1],
      [0.5, collar + 0.15],
      [0.5 + 0.04, collar + 0.1],
      [0.5 + 0.062, collar - 0.03],
    ],
    p.under,
  );

  // Two lapels and a placket. Three lines and the shirt is a shirt.
  for (const side of [-1, 1]) {
    pad.line(
      [
        [0.5 + side * 0.072, collar - 0.015],
        [0.5 + side * 0.105, collar + 0.1],
        [0.5 + side * 0.042, collar + 0.14],
      ],
      LINE,
      { width: 0.0085, alpha: 0.85, wobble: 0.004 },
    );
  }
  pad.line([[0.5, collar + 0.16], [0.5 + (r() - 0.5) * 0.02, 1.02]], LINE, {
    width: 0.007,
    alpha: 0.7,
    wobble: 0.005,
  });
  pad.blob([0.5 + 0.004, 0.93], 0.008, 0.008, 0, shift(p.cloth, 0.45));

  // Where the shoulders meet the air.
  for (const side of [-1, 1]) {
    pad.line(
      [
        [0.5 + side * 0.098, collar - 0.02],
        [0.5 + side * 0.3, collar + 0.06],
        [0.5 + side * 0.45, 1.03],
      ],
      LINE,
      { width: 0.008, alpha: 0.8, wobble: 0.005 },
    );
  }
}

function neck(pad: Pad, p: Person) {
  const chin = CHIN;
  // Short and thick. The first version was a column: a long thin neck under a
  // large head is a lightbulb, and it made everyone look ill.
  pad.shape(
    [
      [0.5 - 0.08, chin - 0.03],
      [0.5 - 0.072, COLLAR + 0.03],
      [0.5 + 0.072, COLLAR + 0.03],
      [0.5 + 0.08, chin - 0.03],
    ],
    p.skin.base,
  );
  // The shadow the jaw throws, and no more than that. At full width and full
  // strength it is a dark trapezoid under the chin, which reads as a goatee on
  // every face that does not have one.
  pad.shape(
    [
      [0.5 - 0.072, chin - 0.025],
      [0.5 - 0.05, chin + 0.028],
      [0.5 + 0.05, chin + 0.028],
      [0.5 + 0.072, chin - 0.025],
    ],
    fade(p.skin.shade, 0.34),
  );
}

function ears(pad: Pad, p: Person) {
  const hw = HW * p.wide;
  for (const side of [-1, 1]) {
    const x = 0.5 + side * hw * 1.02;
    pad.blob([x, EAR_Y], 0.046, 0.058, side * 0.2, p.skin.base);
    pad.blob([x + side * 0.008, EAR_Y + 0.004], 0.024, 0.036, side * 0.2, fade(p.skin.blush, 0.55));
    pad.line([...oval(x, EAR_Y, 0.046, 0.058, 12)], LINE, { width: 0.0075, alpha: 0.85 });
    pad.line(
      [
        [x + side * 0.018, EAR_Y - 0.036],
        [x + side * 0.038, EAR_Y],
        [x + side * 0.012, EAR_Y + 0.044],
      ],
      LINE,
      { width: 0.0068, alpha: 0.75 },
    );
    if (p.ear === 'hoop') {
      pad.line([...oval(x, EAR_Y + 0.072, 0.022, 0.024, 12)], '#d8a63c', { width: 0.008, alpha: 0.95 });
    } else if (p.ear === 'stud') {
      pad.blob([x, EAR_Y + 0.05], 0.011, 0.011, 0, '#e0b04a');
    }
  }
}

function face(pad: Pad, p: Person) {
  const path = headPath(p);
  pad.shape(path, p.skin.base);
  pad.clip(path, () => {
    scuff(pad, [0.3, TOP, 0.7, CHIN], p.skin.base, { n: 110, angle: -0.7, len: 0.1, alpha: 0.22, spread: 0.1 });
    // The shadow down one side, in the direction they are not looking.
    const s = p.gaze >= 0 ? -1 : 1;
    pad.blob([0.5 + s * HW * p.wide * 0.85, 0.44], 0.09, 0.17, 0, fade(p.skin.shade, 0.32));
  });
  pad.line([...path, path[0]], LINE, { width: 0.0085, alpha: 0.9, wobble: 0.004 });
}

function features(pad: Pad, p: Person) {
  const gap = 0.075;
  const gz = p.gaze * 0.012;

  // Blush. Two soft ovals, and they go on before the line work so the line
  // stays on top of them — a blush over a drawn cheek reads as a sticker.
  for (const side of [-1, 1]) {
    pad.blob([0.5 + side * 0.098, EYE_Y + 0.055], 0.042, 0.026, 0, fade(p.skin.blush, 0.3));
  }

  // Nose: a wedge with a warm underside, not an outline. The reference draws
  // it as a *volume* and lets one short line do the nostril.
  const ny = EYE_Y + 0.035;
  pad.shape(
    [
      [0.5 - 0.006, ny - 0.03],
      [0.5 + 0.03, ny + 0.03],
      [0.5 + 0.022, ny + 0.052],
      [0.5 - 0.026, ny + 0.05],
      [0.5 - 0.032, ny + 0.022],
    ],
    fade(p.skin.blush, 0.42),
  );
  pad.line(
    [
      [0.5 - 0.03, ny + 0.03],
      [0.5 - 0.01, ny + 0.052],
      [0.5 + 0.026, ny + 0.044],
    ],
    LINE,
    { width: 0.0075, alpha: 0.85 },
  );

  // Eyes. Enormous, because that is the convention, and the pupil is small and
  // sits high in the white — a pupil in the middle of a big eye looks dead.
  for (const side of [-1, 1]) {
    const x = 0.5 + side * gap;
    pad.blob([x, EYE_Y], 0.043, 0.045, 0, PAPER);
    pad.blob([x + gz, EYE_Y - 0.004], 0.013, 0.014, 0, '#231d1a');
    pad.blob([x + gz + 0.005, EYE_Y - 0.011], 0.0045, 0.0045, 0, fade('#ffffff', 0.85));
  }

  // Brows, above the glasses and doing all the acting.
  for (const side of [-1, 1]) {
    const x = 0.5 + side * gap;
    const lift = side * p.gaze * 0.008;
    pad.line(
      [
        [x - side * 0.05, EYE_Y - 0.062 + lift + p.brow * 0.006],
        [x, EYE_Y - 0.078 + lift],
        [x + side * 0.042, EYE_Y - 0.066 + lift - p.brow * 0.004],
      ],
      shift(p.hair, -0.15),
      { width: 0.011 + p.brow * 0.009, alpha: 0.95, cap: 'round' },
    );
  }

  mouth(pad, p);
}

function mouth(pad: Pad, p: Person) {
  const y = EYE_Y + 0.115;
  const w = 0.05;
  if (p.mouth === 'open') {
    pad.blob([0.5, y + 0.008], 0.028, 0.022, 0, '#6d3b32');
    pad.blob([0.5, y - 0.004], 0.024, 0.008, 0, PAPER);
    return;
  }
  if (p.mouth === 'whistle') {
    pad.blob([0.5, y], 0.016, 0.018, 0, '#7c463a');
    return;
  }
  const dip = p.mouth === 'smile' ? 0.022 : p.mouth === 'purse' ? -0.012 : 0;
  pad.line(
    [
      [0.5 - w, y - dip * 0.4],
      [0.5, y + dip],
      [0.5 + w, y - dip * 0.4],
    ],
    '#7a4136',
    { width: 0.011, alpha: 0.92, cap: 'round' },
  );
}

// -------------------------------------------------------------------- fibre

function beard(pad: Pad, p: Person, r: () => number) {
  if (p.beard === 'none') return;
  const hw = HW * p.wide;
  const c = p.hair;

  if (p.beard === 'stubble') {
    const spine: Pt[] = [
      [0.5 - hw * 0.9, EAR_Y + 0.03],
      [0.5 - hw * 0.6, CHIN - 0.01],
      [0.5, CHIN + 0.012],
      [0.5 + hw * 0.6, CHIN - 0.01],
      [0.5 + hw * 0.9, EAR_Y + 0.03],
    ];
    bristle(pad, spine, (t) => [(t - 0.5) * 0.5, 1], c, p.seed ^ 0x51, {
      n: 150, len: 0.03, taper: 0.3, fan: 1.1, width: 0.0035, alpha: 0.45, curl: 0.1,
    });
    return;
  }

  if (p.beard === 'moustache' || p.beard === 'goatee') {
    const my = EYE_Y + 0.082;
    for (const side of [-1, 1]) {
      pad.shape(
        [
          [0.5, my - 0.008],
          [0.5 + side * 0.03, my - 0.014],
          [0.5 + side * 0.072, my + 0.004],
          [0.5 + side * 0.056, my + 0.028],
          [0.5 + side * 0.012, my + 0.02],
        ],
        c,
      );
      bristle(
        pad,
        [
          [0.5 + side * 0.01, my + 0.004],
          [0.5 + side * 0.07, my + 0.006],
        ],
        () => [side * 0.9, 0.5],
        c,
        p.seed ^ (side > 0 ? 0x22 : 0x33),
        { n: 34, len: 0.04, taper: 0.3, fan: 0.7, width: 0.004, alpha: 0.8 },
      );
    }
  }

  if (p.beard === 'goatee' || p.beard === 'chin') {
    const spine: Pt[] = [
      [0.5 - 0.052, CHIN - 0.028],
      [0.5, CHIN - 0.016],
      [0.5 + 0.052, CHIN - 0.028],
    ];
    pad.shape(
      [
        [0.5 - 0.058, CHIN - 0.05],
        [0.5 + 0.058, CHIN - 0.05],
        [0.5 + 0.044, CHIN + 0.05],
        [0.5, CHIN + 0.075],
        [0.5 - 0.044, CHIN + 0.05],
      ],
      c,
    );
    bristle(pad, spine, (t) => [(t - 0.5) * 0.8, 1], c, p.seed ^ 0x44, {
      n: 90, len: 0.085, taper: 0.35, fan: 0.5, width: 0.0045, alpha: 0.85,
    });
    return;
  }

  if (p.beard !== 'full') return;

  // The full beard: a mass, then fibre round the whole of its edge.
  //
  // Drawn as a shape alone it is a bib. What makes it a beard is that the
  // outline is never seen — several hundred strands cross it, so the silhouette
  // is made of ends rather than of a curve.
  const drop = 0.19 + r() * 0.06;
  const mass: Pt[] = [
    [0.5 - hw * 0.98, EAR_Y + 0.01],
    [0.5 - hw * 1.05, CHIN - 0.05],
    [0.5 - hw * 0.8, CHIN + drop * 0.62],
    [0.5 - hw * 0.34, CHIN + drop],
    [0.5, CHIN + drop * 1.06],
    [0.5 + hw * 0.34, CHIN + drop],
    [0.5 + hw * 0.8, CHIN + drop * 0.62],
    [0.5 + hw * 1.05, CHIN - 0.05],
    [0.5 + hw * 0.98, EAR_Y + 0.01],
    [0.5 + hw * 0.5, EYE_Y + 0.1],
    [0.5, EYE_Y + 0.085],
    [0.5 - hw * 0.5, EYE_Y + 0.1],
  ];
  pad.shape(mass, c);
  pad.clip(mass, () => {
    scuff(pad, [0.28, EYE_Y, 0.72, CHIN + drop * 1.1], c, {
      n: 150, angle: 1.35, len: 0.13, alpha: 0.3, spread: 0.22,
    });
  });

  // The lit side, which is the same trick the shirt uses: one soft blob of a
  // paler tone, inside the shape, and the mass has a front and a back.
  pad.clip(mass, () => {
    pad.blob([0.5 - hw * 0.3, CHIN - 0.02], 0.1, 0.11, 0, fade(shift(c, 0.32), 0.4));
  });

  const edge = mass.slice(0, 9);
  bristle(pad, edge, (t) => {
    const a = Math.PI * (0.12 + t * 0.76);
    return [-Math.cos(a), Math.sin(a) * 0.9 + 0.5];
  }, c, p.seed ^ 0x7a1, { n: 260, len: 0.075, taper: 0.35, fan: 0.55, width: 0.0052, alpha: 0.9, curl: 0.4 });

  bristle(pad, [
    [0.5 - hw * 0.7, EYE_Y + 0.1],
    [0.5, EYE_Y + 0.115],
    [0.5 + hw * 0.7, EYE_Y + 0.1],
  ], (t) => [(t - 0.5) * 1.2, 1], c, p.seed ^ 0x9c3, {
    n: 120, len: 0.1, taper: 0.5, fan: 0.45, width: 0.0045, alpha: 0.55,
  });

  // A moustache always comes with a full beard, and it always sits over it.
  const my = EYE_Y + 0.078;
  for (const side of [-1, 1]) {
    pad.shape(
      [
        [0.5, my - 0.006],
        [0.5 + side * 0.034, my - 0.016],
        [0.5 + side * 0.078, my + 0.006],
        [0.5 + side * 0.055, my + 0.03],
        [0.5 + side * 0.012, my + 0.022],
      ],
      shift(c, -0.08),
    );
  }
}

function hair(pad: Pad, p: Person, r: () => number, front: boolean) {
  const hw = HW * p.wide;
  const c = p.hair;
  const crown: Pt[] = [
    [0.5 - hw * 0.95, TOP + 0.09],
    [0.5 - hw * 0.7, TOP + 0.01],
    [0.5, TOP - 0.012],
    [0.5 + hw * 0.7, TOP + 0.01],
    [0.5 + hw * 0.95, TOP + 0.09],
  ];

  if (!front) {
    if (p.cut === 'long') {
      // One mass behind the head, not two beside it. Drawn as a pair of shapes
      // it comes out as a sausage over each ear; drawn as a single silhouette
      // that widens past the jaw it is hair, and the head sits in front of it.
      const mass: Pt[] = [
        [0.5 - hw * 0.6, TOP - 0.02],
        [0.5 - hw * 1.42, TOP + 0.15],
        [0.5 - hw * 1.66, 0.6],
        [0.5 - hw * 1.44, 0.83],
        [0.5 - hw * 0.62, 0.78],
        [0.5, 0.74],
        [0.5 + hw * 0.62, 0.78],
        [0.5 + hw * 1.44, 0.83],
        [0.5 + hw * 1.66, 0.6],
        [0.5 + hw * 1.42, TOP + 0.15],
        [0.5 + hw * 0.6, TOP - 0.02],
        [0.5, TOP - 0.045],
      ];
      pad.shape(mass, c);
      pad.clip(mass, () =>
        scuff(pad, [0.5 - hw * 1.7, TOP, 0.5 + hw * 1.7, 0.85], c, {
          n: 170, angle: 1.42, len: 0.16, alpha: 0.3, spread: 0.24,
        }),
      );
      bristle(
        pad,
        [
          [0.5 - hw * 1.5, 0.72],
          [0.5 - hw * 1.0, 0.82],
          [0.5 + hw * 1.0, 0.82],
          [0.5 + hw * 1.5, 0.72],
        ],
        () => [0, 1],
        c,
        p.seed ^ 0x2c4,
        { n: 90, len: 0.07, taper: 0.4, fan: 0.6, width: 0.005, alpha: 0.85, curl: 0.35 },
      );
    }
    if (p.cut === 'bun') {
      pad.blob([0.5 + 0.02, TOP - 0.055], 0.062, 0.055, 0.2, c);
      bristle(pad, oval(0.5 + 0.02, TOP - 0.055, 0.055, 0.05, 10), () => [0, -1], c, p.seed ^ 0x8, {
        n: 60, len: 0.03, fan: 2.6, width: 0.004, alpha: 0.6,
      });
    }
    return;
  }

  if (p.cut === 'bald') {
    // Not nothing: two tufts over the ears, which is what bald looks like.
    for (const side of [-1, 1]) {
      bristle(pad, [
        [0.5 + side * hw * 0.86, TOP + 0.11],
        [0.5 + side * hw * 1.0, TOP + 0.17],
      ], () => [side, -0.5], c, p.seed ^ (side > 0 ? 0x11 : 0x12), {
        n: 26, len: 0.05, fan: 0.8, width: 0.005, alpha: 0.8,
      });
    }
    return;
  }

  if (p.cut === 'curls') {
    const n = 13;
    for (let i = 0; i < n; i++) {
      const a = Math.PI * (1.06 + (i / (n - 1)) * 0.88);
      pad.blob(
        [0.5 + Math.cos(a) * hw * 1.02, TOP + 0.1 + Math.sin(a) * 0.11],
        0.03 + r() * 0.014,
        0.028 + r() * 0.014,
        r() * 3,
        shift(c, (r() - 0.5) * 0.24),
      );
    }
    return;
  }

  if (p.cut === 'long') {
    for (const side of [-1, 1]) {
      pad.shape(
        [
          [0.5 + side * hw * 0.72, TOP + 0.02],
          [0.5 + side * hw * 1.24, TOP + 0.2],
          [0.5 + side * hw * 1.3, 0.66],
          [0.5 + side * hw * 0.95, 0.72],
          [0.5 + side * hw * 0.94, TOP + 0.24],
        ],
        shift(c, 0.08),
      );
    }
  }

  if (p.cut === 'mop' || p.cut === 'long' || p.cut === 'bun') {
    pad.shape(
      [
        [0.5 - hw * 1.02, TOP + 0.13],
        [0.5 - hw * 0.85, TOP - 0.01],
        [0.5, TOP - 0.03],
        [0.5 + hw * 0.85, TOP - 0.01],
        [0.5 + hw * 1.02, TOP + 0.13],
        [0.5 + hw * 0.6, TOP + 0.075],
        [0.5 - hw * 0.2, TOP + 0.095],
      ],
      c,
    );
  }

  bristle(pad, crown, (t) => [(t - 0.5) * 1.8, -1], c, p.seed ^ 0x3f1, {
    n: p.cut === 'tuft' ? 40 : 130,
    len: p.cut === 'mop' ? 0.075 : 0.05,
    taper: 0.4,
    fan: 0.75,
    width: 0.005,
    alpha: 0.88,
    curl: 0.35,
  });
}

// --------------------------------------------------------------------- hats

function hatOn(pad: Pad, p: Person, r: () => number) {
  if (p.hat === 'none') return;
  const c = p.hatColour;
  const brimY = TOP + 0.055;
  const hw = HW * p.wide;

  // Hair escaping under the brim, on both sides, before the hat goes on.
  //
  // Not a flourish. A hat drawn straight onto a scalp looks *stuck on*, and
  // every reference solves it the same way: a few strands coming out from
  // under the edge, so the hat is sitting on hair rather than on a head.
  if (p.cut !== 'bald') {
    for (const side of [-1, 1]) {
      bristle(
        pad,
        [
          [0.5 + side * hw * 0.72, brimY + 0.012],
          [0.5 + side * hw * 1.02, brimY + 0.05],
        ],
        () => [side * 1.3, -0.35],
        p.hair,
        p.seed ^ (side > 0 ? 0x5a1 : 0x5b2),
        { n: 26, len: 0.075, taper: 0.4, fan: 0.85, width: 0.0055, alpha: 0.9, curl: 0.5 },
      );
    }
  }

  if (p.hat === 'straw') {
    // Brim first, then crown, so the crown sits in front of it. Both get the
    // weave, which is two passes of short strokes crossing at a shallow angle
    // — a straw hat is the one thing here that has a *manufactured* texture.
    const brim = oval(0.5, brimY + 0.012, 0.36, 0.085, 20, 0.07, r);
    pad.shape(brim, c);
    pad.clip(brim, () => {
      scuff(pad, [0.12, brimY - 0.09, 0.88, brimY + 0.11], c, { n: 190, angle: 0.42, len: 0.09, alpha: 0.34, spread: 0.24 });
      scuff(pad, [0.12, brimY - 0.09, 0.88, brimY + 0.11], c, { n: 150, angle: -0.42, len: 0.08, alpha: 0.26, spread: 0.2 });
    });
    pad.line([...brim, brim[0]], shift(c, -0.35), { width: 0.007, alpha: 0.75 });

    const crown = [
      [0.5 - 0.145, brimY + 0.012],
      [0.5 - 0.135, TOP - 0.052],
      [0.5 - 0.06, TOP - 0.1],
      [0.5 + 0.06, TOP - 0.1],
      [0.5 + 0.135, TOP - 0.052],
      [0.5 + 0.145, brimY + 0.012],
    ] as Pt[];
    pad.shape(crown, shift(c, 0.08));
    pad.clip(crown, () => {
      scuff(pad, [0.34, TOP - 0.12, 0.66, brimY + 0.02], c, { n: 120, angle: 0.5, len: 0.07, alpha: 0.34, spread: 0.24 });
      scuff(pad, [0.34, TOP - 0.12, 0.66, brimY + 0.02], c, { n: 100, angle: -0.5, len: 0.07, alpha: 0.26, spread: 0.2 });
    });
    // The band. Always darker than the straw, always sits on the brim.
    pad.shape(
      [
        [0.5 - 0.143, brimY - 0.004],
        [0.5 - 0.138, brimY - 0.036],
        [0.5 + 0.138, brimY - 0.036],
        [0.5 + 0.143, brimY - 0.004],
      ],
      '#2a2723',
      { sharp: true },
    );
    pad.line([...crown], LINE, { width: 0.008, alpha: 0.8, wobble: 0.004 });
    return;
  }

  if (p.hat === 'flatcap' || p.hat === 'cap') {
    const dome: Pt[] = [
      [0.5 - 0.175, brimY + 0.01],
      [0.5 - 0.165, TOP - 0.03],
      [0.5, TOP - 0.075],
      [0.5 + 0.165, TOP - 0.03],
      [0.5 + 0.175, brimY + 0.01],
    ];
    pad.shape(dome, c);
    pad.clip(dome, () => scuff(pad, [0.3, TOP - 0.09, 0.7, brimY + 0.02], c, { n: 110, angle: -0.6, len: 0.09, alpha: 0.3 }));
    // The peak, drawn as something that *droops*. Four points in a straight
    // band read as a plank nailed to the side of the head; the curve down at
    // the far end and the tuck back under the crown are the whole difference.
    const side = p.gaze >= 0 ? 1 : -1;
    const reach = p.hat === 'cap' ? 0.3 : 0.25;
    const peak: Pt[] = [
      [0.5 - side * 0.16, brimY + 0.002],
      [0.5 + side * reach * 0.55, brimY + 0.012],
      [0.5 + side * reach, brimY + 0.046],
      [0.5 + side * reach * 0.86, brimY + 0.062],
      [0.5 + side * reach * 0.4, brimY + 0.05],
      [0.5 - side * 0.16, brimY + 0.032],
    ];
    pad.shape(peak, shift(c, -0.22));
    pad.line([...peak, peak[0]], LINE, { width: 0.0075, alpha: 0.8 });
    pad.line([...dome], LINE, { width: 0.0085, alpha: 0.85, wobble: 0.004 });
    return;
  }

  if (p.hat === 'beanie') {
    const dome: Pt[] = [
      [0.5 - 0.168, brimY + 0.02],
      [0.5 - 0.16, TOP - 0.045],
      [0.5, TOP - 0.095],
      [0.5 + 0.16, TOP - 0.045],
      [0.5 + 0.168, brimY + 0.02],
    ];
    pad.shape(dome, c);
    pad.clip(dome, () => {
      for (let i = 0; i < 9; i++) {
        const x = 0.5 - 0.16 + (i / 8) * 0.32;
        pad.line([[x, TOP - 0.1], [x + 0.006, brimY + 0.03]], shift(c, -0.2), { width: 0.006, alpha: 0.45 });
      }
    });
    pad.shape(
      [
        [0.5 - 0.172, brimY + 0.026],
        [0.5 + 0.172, brimY + 0.026],
        [0.5 + 0.166, brimY - 0.026],
        [0.5 - 0.166, brimY - 0.026],
      ],
      shift(c, 0.22),
      { sharp: true },
    );
    pad.blob([0.5, TOP - 0.115], 0.032, 0.03, 0, shift(c, 0.22));
    return;
  }

  // A headscarf, tied at the side.
  const wrap: Pt[] = [
    [0.5 - 0.17, brimY + 0.06],
    [0.5 - 0.16, TOP - 0.02],
    [0.5, TOP - 0.06],
    [0.5 + 0.16, TOP - 0.02],
    [0.5 + 0.17, brimY + 0.06],
    [0.5 + 0.1, brimY + 0.02],
    [0.5 - 0.1, brimY + 0.02],
  ];
  pad.shape(wrap, c);
  pad.clip(wrap, () => scuff(pad, [0.3, TOP - 0.08, 0.7, brimY + 0.07], c, { n: 110, angle: 0.5, len: 0.09, alpha: 0.28 }));
  const side = p.gaze >= 0 ? 1 : -1;
  pad.blob([0.5 + side * 0.175, brimY + 0.04], 0.04, 0.032, side * 0.5, shift(c, 0.14));
  // Two tapering flaps rather than one round stroke. A knot in cloth has two
  // ends and they do not have the same width all the way down.
  for (const k of [0, 1]) {
    pad.shape(
      [
        [0.5 + side * 0.19, brimY + 0.05],
        [0.5 + side * (0.25 + k * 0.05), brimY + 0.1 + k * 0.02],
        [0.5 + side * (0.2 + k * 0.06), brimY + 0.17 + k * 0.03],
        [0.5 + side * (0.17 + k * 0.05), brimY + 0.15 + k * 0.03],
        [0.5 + side * 0.19, brimY + 0.09],
      ],
      shift(c, k ? -0.14 : 0.02),
    );
  }
  pad.line([...wrap], LINE, { width: 0.008, alpha: 0.8, wobble: 0.004 });
}

function spectacles(pad: Pad, p: Person) {
  if (p.glasses === 'none') return;
  const gap = 0.075;
  const rim = LINE;
  const w = 0.0105;
  for (const side of [-1, 1]) {
    const x = 0.5 + side * gap;
    if (p.glasses === 'square') {
      const box: Pt[] = [
        [x - 0.056, EYE_Y - 0.05],
        [x + 0.056, EYE_Y - 0.05],
        [x + 0.056, EYE_Y + 0.05],
        [x - 0.056, EYE_Y + 0.05],
      ];
      pad.shape(box, fade('#ffffff', 0.14), { sharp: true });
      pad.line([...box, box[0]], rim, { width: w, alpha: 0.95, sharp: true } as never);
    } else if (p.glasses === 'half') {
      pad.line(
        [
          [x - 0.058, EYE_Y - 0.002],
          [x - 0.05, EYE_Y + 0.042],
          [x, EYE_Y + 0.056],
          [x + 0.05, EYE_Y + 0.042],
          [x + 0.058, EYE_Y - 0.002],
        ],
        rim,
        { width: w, alpha: 0.95 },
      );
    } else {
      const ring = oval(x, EYE_Y, 0.058, 0.058, 16);
      pad.shape(ring, fade('#ffffff', 0.14));
      pad.line([...ring, ring[0]], rim, { width: w, alpha: 0.95 });
    }
    // The arm, running back to the ear it is hooked over.
    pad.line(
      [
        [x + side * 0.056, EYE_Y - 0.004],
        [0.5 + side * (HW * p.wide + 0.012), EAR_Y - 0.014],
      ],
      rim,
      { width: w * 0.75, alpha: 0.9 },
    );
  }
  pad.line(
    [
      [0.5 - gap + 0.055, EYE_Y - 0.012],
      [0.5, EYE_Y - 0.02],
      [0.5 + gap - 0.055, EYE_Y - 0.012],
    ],
    rim,
    { width: w * 0.85, alpha: 0.95 },
  );
}

// -------------------------------------------------------------------- entry

export function drawPortrait(g: CanvasRenderingContext2D, p: Person, w: number, h: number) {
  const pad = new Pad(g, w, h, p.seed);
  const r = rng(p.seed ^ 0x51ab);

  g.save();
  g.fillStyle = PAPER;
  g.fillRect(0, 0, w, h);
  ground(pad, p.ground[0], p.ground[1], p.seed ^ 0x2211);

  hair(pad, p, r, false);
  neck(pad, p);
  body(pad, p, r);
  ears(pad, p);
  face(pad, p);
  features(pad, p);
  beard(pad, p, r);
  spectacles(pad, p);
  hair(pad, p, r, true);
  hatOn(pad, p, r);
  grain(pad, p.seed ^ 0x66c1);
  g.restore();
}
