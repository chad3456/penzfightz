import type { Pad, Pt } from '../flat/pad';
import { bristle, fade, rng, scuff, shift } from '../book/crayon';
import { CHIN, COLLAR, EAR_Y, EYE_Y, HW, TOP, oval } from '../book/portrait';
import { LINE } from '../book/tone';
import { PIGMENT } from './look';

/**
 * The vocabulary of the epics.
 *
 * A face in this style is a face; what makes it Ravana rather than a
 * greengrocer is a very short list of marks, and the list is not a matter of
 * taste. It is the same iconographic grammar every painter of this material
 * has used for a thousand years, and it is legible precisely because it is
 * fixed: a tall tapering crown means sovereignty, matted hair piled on the head
 * means renunciation, three horizontal lines mean Shiva and a vertical U means
 * Vishnu, a fang means a rakshasa, a fan of hoods means a naga.
 *
 * So none of this is invented. Each piece here is one of those marks, drawn in
 * the same crayon that draws everything else in the case.
 *
 * ### The one thing that is a choice
 *
 * There is no attempt at likeness anywhere in this, and there could not be —
 * these are not people who were photographed. What the roster records is what
 * the *texts* say: that this one is dark as a rain cloud, that one wears matted
 * locks, that one has fangs. The generator then draws a face under it. A card
 * here is a name and a set of attributes, which is all any of these figures has
 * ever been on a painted page.
 */

export type Crown = 'kirita' | 'karanda' | 'jata' | 'turban' | 'helm' | 'flowers' | 'bare';
export type Mark = 'urdhva' | 'tripundra' | 'bindu' | 'tilak' | 'none';
export type Ornament = 'kundala' | 'makara' | 'stud' | 'none';
export type Neckwear = 'haar' | 'rudraksha' | 'serpent' | 'torque' | 'none';
export type Drape = 'uttariya' | 'armour' | 'sari' | 'bark' | 'bare';
export type Kind = 'human' | 'rakshasa' | 'vanara' | 'naga' | 'bird' | 'elephant';

export interface Regalia {
  seed: number;
  /** Open, shut, or bound: three figures in this material are defined by it. */
  sight: 'open' | 'closed' | 'bound';
  wide: number;
  gaze: number;
  crown: Crown;
  metal: string;
  steel: string;
  silk: string;
  hem: string;
  mark: Mark;
  markInk: keyof typeof PIGMENT;
  thirdEye: boolean;
  ornament: Ornament;
  neckwear: Neckwear;
  drape: Drape;
  kind: Kind;
  fangs: boolean;
  horns: boolean;
  /** Heads *beside* the main one. Ravana gets the most; nobody else gets many. */
  heads: number;
  halo: boolean;
  hairColour: string;
}

// ------------------------------------------------------------------- behind

/**
 * Everything that goes on before the head does.
 *
 * The order matters and it is the order a painter works in: the light behind
 * the figure, then anything growing out of the back of it, then the figure.
 */
export function behind(pad: Pad, g: Regalia, skin: string) {
  const r = rng(g.seed ^ 0x1a2b);

  if (g.halo) {
    // Prabhamandala: a disc of light, drawn as a ring of short rays rather
    // than a filled circle, so it reads as light rather than as a plate.
    const cy = EYE_Y - 0.01;
    pad.blob([0.5, cy], 0.245, 0.245, 0, fade(shift(g.metal, 0.35), 0.55));
    pad.blob([0.5, cy], 0.212, 0.212, 0, fade(shift(g.metal, 0.62), 0.6));
    for (let i = 0; i < 48; i++) {
      const a = (i / 48) * Math.PI * 2;
      pad.line(
        [
          [0.5 + Math.cos(a) * 0.2, cy + Math.sin(a) * 0.2],
          [0.5 + Math.cos(a) * (0.235 + r() * 0.03), cy + Math.sin(a) * (0.235 + r() * 0.03)],
        ],
        shift(g.metal, 0.2),
        { width: 0.006, alpha: 0.5 },
      );
    }
    pad.line([...oval(0.5, cy, 0.205, 0.205, 30)], shift(g.metal, -0.1), { width: 0.007, alpha: 0.55 });
  }

  if (g.kind === 'naga') {
    // The hood: a fan of serpents rising behind the shoulders. Odd numbers
    // only, because every carving of this has an odd number.
    // A cobra hood is wider than it is tall and flares at the *top*. Drawn as
    // a disc on a stalk — which is the obvious way and was the first way — a
    // fan of seven of them is a jester's hat.
    const n = 5 + 2 * Math.floor(r() * 2);
    const root: Pt = [0.5, CHIN + 0.02];
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0.5 : i / (n - 1);
      const a = -Math.PI / 2 + (t - 0.5) * 2.05;
      const len = 0.34 - Math.abs(t - 0.5) * 0.1;
      const hx = root[0] + Math.cos(a) * len * 1.2;
      const hy = root[1] + Math.sin(a) * len;
      pad.line([root, [(root[0] + hx) / 2, (root[1] + hy) / 2], [hx, hy]], shift(g.silk, -0.14), {
        width: 0.036,
        alpha: 1,
        cap: 'round',
      });
      // The hood itself, built flat and then turned to face out along `a`.
      const ca = Math.cos(a + Math.PI / 2);
      const sa = Math.sin(a + Math.PI / 2);
      const put = (u: number, v: number): Pt => [hx + u * ca - v * sa, hy + u * sa + v * ca];
      const w = 0.085;
      const h = 0.12;
      const hood: Pt[] = [
        put(-w * 0.28, 0), put(-w, -h * 0.5), put(-w * 0.72, -h * 0.95),
        put(0, -h * 1.1), put(w * 0.72, -h * 0.95), put(w, -h * 0.5), put(w * 0.28, 0),
      ];
      pad.shape(hood, shift(g.silk, 0.12));
      pad.line([...hood, hood[0]], LINE, { width: 0.006, alpha: 0.8 });
      // The mark on the back of the hood, which every painted naga has.
      pad.blob(put(0, -h * 0.6), 0.026, 0.03, a + Math.PI / 2, shift(g.metal, 0.1));
      pad.blob(put(0, -h * 0.6), 0.011, 0.013, a + Math.PI / 2, '#b8332c');
    }
  }

  if (g.heads > 0) {
    // Ravana's other heads, shown as a receding row either side. A painter
    // does not draw ten heads in a line; they stack them behind the first and
    // let the count be understood.
    for (let i = 1; i <= g.heads; i++) {
      const side = i % 2 === 0 ? 1 : -1;
      const step = Math.ceil(i / 2);
      const x = 0.5 + side * (0.125 + step * 0.072);
      const y = TOP + 0.075 - step * 0.008;
      const sc = 1 - step * 0.115;
      pad.blob([x, y], 0.115 * sc, 0.142 * sc, side * 0.1, skin);
      pad.line([...oval(x, y, 0.115 * sc, 0.142 * sc, 14)], LINE, { width: 0.0065, alpha: 0.75 });
      for (const e of [-1, 1]) {
        pad.blob([x + e * 0.042 * sc, y + 0.004], 0.021 * sc, 0.021 * sc, 0, '#f5efe2');
        pad.blob([x + e * 0.042 * sc, y + 0.004], 0.009 * sc, 0.009 * sc, 0, '#241d1a');
      }
      if (g.fangs) {
        for (const e of [-1, 1]) {
          pad.blob([x + e * 0.03 * sc, y + 0.078 * sc], 0.009 * sc, 0.02 * sc, 0, '#f2ecdc');
        }
      }
      pad.blob([x, y - 0.13 * sc], 0.07 * sc, 0.062 * sc, 0, g.metal);
      pad.line([...oval(x, y - 0.13 * sc, 0.07 * sc, 0.062 * sc, 10)], shift(g.metal, -0.35),
        { width: 0.005, alpha: 0.7 });
    }
  }
}

// -------------------------------------------------------------------- crown

export function crownOn(pad: Pad, g: Regalia, hairColour: string) {
  const r = rng(g.seed ^ 0x4c1d);
  const brim = TOP + 0.03;
  const m = g.metal;

  if (g.crown === 'jata') {
    // Matted locks piled and tied. Not hair drawn tall — a *bundle*, which is
    // why it gets a band round it and a few strands escaping the top.
    const knot: Pt[] = [
      [0.5 - 0.135, brim + 0.02],
      [0.5 - 0.155, TOP - 0.06],
      [0.5 - 0.09, TOP - 0.15],
      [0.5, TOP - 0.185],
      [0.5 + 0.09, TOP - 0.15],
      [0.5 + 0.155, TOP - 0.06],
      [0.5 + 0.135, brim + 0.02],
    ];
    pad.shape(knot, hairColour);
    pad.clip(knot, () =>
      scuff(pad, [0.33, TOP - 0.2, 0.67, brim + 0.03], hairColour, {
        n: 150, angle: 1.4, len: 0.12, alpha: 0.34, spread: 0.26,
      }),
    );
    for (let i = 0; i < 7; i++) {
      const x = 0.5 - 0.12 + (i / 6) * 0.24;
      pad.line([[x, brim], [x + (r() - 0.5) * 0.05, TOP - 0.17]], shift(hairColour, -0.25), {
        width: 0.009,
        alpha: 0.6,
      });
    }
    bristle(pad, [[0.5 - 0.07, TOP - 0.17], [0.5 + 0.07, TOP - 0.17]], () => [0, -1], hairColour,
      g.seed ^ 0x77, { n: 34, len: 0.075, taper: 0.4, fan: 1.5, width: 0.005, alpha: 0.8, curl: 0.6 });
    pad.line([[0.5 - 0.15, TOP - 0.045], [0.5, TOP - 0.058], [0.5 + 0.15, TOP - 0.045]], m,
      { width: 0.016, alpha: 0.95 });
    return;
  }

  if (g.crown === 'bare') return;

  if (g.crown === 'flowers') {
    for (let i = 0; i < 11; i++) {
      const t = i / 10;
      const a = Math.PI * (1.04 + t * 0.92);
      const x = 0.5 + Math.cos(a) * 0.165;
      const y = TOP + 0.08 + Math.sin(a) * 0.1;
      const c = i % 3 === 0 ? '#f0efe4' : i % 3 === 1 ? '#e8a93c' : '#d9636a';
      for (let k = 0; k < 5; k++) {
        const b = (k / 5) * Math.PI * 2;
        pad.blob([x + Math.cos(b) * 0.011, y + Math.sin(b) * 0.011], 0.011, 0.011, 0, c);
      }
      pad.blob([x, y], 0.008, 0.008, 0, '#d9a63c');
    }
    return;
  }

  if (g.crown === 'turban') {
    const wrap: Pt[] = [
      [0.5 - 0.175, brim + 0.045],
      [0.5 - 0.165, TOP - 0.03],
      [0.5, TOP - 0.085],
      [0.5 + 0.165, TOP - 0.03],
      [0.5 + 0.175, brim + 0.045],
      [0.5, brim + 0.015],
    ];
    pad.shape(wrap, g.silk);
    pad.clip(wrap, () => {
      for (let i = 0; i < 6; i++) {
        const t = i / 5;
        pad.line(
          [
            [0.5 - 0.19, brim + 0.03 - t * 0.075],
            [0.5, brim - 0.005 - t * 0.085],
            [0.5 + 0.19, brim + 0.03 - t * 0.075],
          ],
          shift(g.silk, i % 2 ? 0.2 : -0.2),
          { width: 0.013, alpha: 0.55 },
        );
      }
    });
    // The jewel and the plume, which is what separates a king's turban from a
    // wound length of cloth.
    pad.blob([0.5 + 0.02, TOP - 0.05], 0.026, 0.03, 0, m);
    pad.blob([0.5 + 0.02, TOP - 0.05], 0.012, 0.015, 0, '#b8332c');
    // A filled leaf with a spine down it, not a white line. A stroke this
    // thin coming off the top of a turban reads as smoke every time.
    const plume: Pt[] = [
      [0.5 + 0.038, TOP - 0.055],
      [0.5 + 0.115, TOP - 0.115],
      [0.5 + 0.105, TOP - 0.2],
      [0.5 + 0.07, TOP - 0.215],
      [0.5 + 0.052, TOP - 0.13],
    ];
    pad.shape(plume, '#f4f0e2');
    pad.line([...plume, plume[0]], shift('#f4f0e2', -0.3), { width: 0.006, alpha: 0.7 });
    pad.line(
      [
        [0.5 + 0.042, TOP - 0.06],
        [0.5 + 0.088, TOP - 0.14],
        [0.5 + 0.082, TOP - 0.205],
      ],
      shift('#f4f0e2', -0.22),
      { width: 0.007, alpha: 0.8 },
    );
    pad.line([...wrap], LINE, { width: 0.008, alpha: 0.8, wobble: 0.004 });
    return;
  }

  if (g.crown === 'helm') {
    // In the armour's metal, not the crown's. A field of a thousand soldiers
    // in gold helmets is a field of a thousand identical soldiers.
    const helm = g.steel;
    const dome: Pt[] = [
      [0.5 - 0.172, brim + 0.05],
      [0.5 - 0.16, TOP - 0.035],
      [0.5, TOP - 0.09],
      [0.5 + 0.16, TOP - 0.035],
      [0.5 + 0.172, brim + 0.05],
    ];
    pad.shape(dome, helm);
    pad.clip(dome, () => scuff(pad, [0.32, TOP - 0.1, 0.68, brim + 0.06], helm, { n: 100, angle: -1.3, len: 0.1, alpha: 0.3 }));
    pad.line([[0.5, TOP - 0.09], [0.5, brim + 0.05]], shift(helm, -0.35), { width: 0.01, alpha: 0.7 });
    pad.blob([0.5, TOP - 0.115], 0.024, 0.03, 0, shift(helm, -0.2));
    // Cheek guards, which is the mark that says helmet rather than hat.
    for (const side of [-1, 1]) {
      pad.shape(
        [
          [0.5 + side * 0.168, brim + 0.035],
          [0.5 + side * 0.185, EYE_Y + 0.02],
          [0.5 + side * 0.15, EYE_Y + 0.05],
          [0.5 + side * 0.132, brim + 0.03],
        ],
        shift(helm, -0.15),
      );
    }
    pad.line([...dome], LINE, { width: 0.0085, alpha: 0.85 });
    return;
  }

  // Kirita and karanda: the two crowns, and the difference is the profile.
  // Kirita is one tall tapering cone with a finial; karanda is a stack of
  // shallow tiers. Both sit on a jewelled band across the brow.
  const tall = g.crown === 'kirita';
  const peak = tall ? TOP - 0.235 : TOP - 0.135;
  if (tall) {
    const cone: Pt[] = [
      [0.5 - 0.135, brim + 0.005],
      [0.5 - 0.105, TOP - 0.075],
      [0.5 - 0.05, peak + 0.02],
      [0.5, peak],
      [0.5 + 0.05, peak + 0.02],
      [0.5 + 0.105, TOP - 0.075],
      [0.5 + 0.135, brim + 0.005],
    ];
    pad.shape(cone, m, { sharp: true });
    pad.clip(cone, () => scuff(pad, [0.35, peak, 0.65, brim + 0.02], m, { n: 110, angle: -1.4, len: 0.1, alpha: 0.3 }));
    pad.line([...cone, cone[0]], shift(m, -0.42), { width: 0.008, alpha: 0.9, sharp: true } as never);
    for (let i = 0; i < 3; i++) {
      const t = 0.24 + i * 0.24;
      const y = brim + (peak - brim) * t;
      const w = 0.13 * (1 - t * 0.72);
      pad.line([[0.5 - w, y], [0.5 + w, y]], shift(m, -0.3), { width: 0.008, alpha: 0.7 });
    }
    pad.blob([0.5, peak - 0.018], 0.02, 0.024, 0, shift(m, 0.25));
    pad.blob([0.5, TOP - 0.1], 0.019, 0.022, 0, '#b8332c');
  } else {
    for (let i = 0; i < 3; i++) {
      const y = brim - i * 0.048;
      const w = 0.15 - i * 0.033;
      pad.shape(
        [
          [0.5 - w, y + 0.008],
          [0.5 - w * 0.86, y - 0.042],
          [0.5 + w * 0.86, y - 0.042],
          [0.5 + w, y + 0.008],
        ],
        shift(m, i * 0.1),
        { sharp: true },
      );
      pad.line(
        [
          [0.5 - w * 0.86, y - 0.042],
          [0.5 + w * 0.86, y - 0.042],
        ],
        shift(m, -0.3),
        { width: 0.007, alpha: 0.7 },
      );
    }
    pad.blob([0.5, peak], 0.022, 0.03, 0, shift(m, 0.2));
  }

  // The band across the brow, with three stones. Every crown has it.
  pad.shape(
    [
      [0.5 - 0.16, brim + 0.03],
      [0.5 - 0.155, brim - 0.014],
      [0.5 + 0.155, brim - 0.014],
      [0.5 + 0.16, brim + 0.03],
    ],
    shift(m, -0.12),
    { sharp: true },
  );
  for (const k of [-1, 0, 1]) {
    pad.blob([0.5 + k * 0.06, brim + 0.008], 0.016, 0.018, 0, k === 0 ? '#b8332c' : '#3f6f8c');
  }
  // Ear ribbons, hanging from the band. Painters use them to fill the gap
  // between the crown and the shoulder, and without them a crown floats.
  for (const side of [-1, 1]) {
    pad.line(
      [
        [0.5 + side * 0.152, brim + 0.018],
        [0.5 + side * 0.182, brim + 0.07],
        [0.5 + side * 0.168, brim + 0.115],
      ],
      shift(g.metal, -0.14),
      { width: 0.016, alpha: 0.9, cap: 'round' },
    );
  }
}

// ------------------------------------------------------------------- marks

export function forehead(pad: Pad, g: Regalia) {
  const y = EYE_Y - 0.105;
  const ink = PIGMENT[g.markInk];

  if (g.thirdEye) {
    // Vertical, always. A third eye drawn horizontally is a second pair of
    // eyebrows; the whole point is that it is turned the other way.
    pad.blob([0.5, y + 0.012], 0.017, 0.03, 0, '#f5efe2');
    pad.blob([0.5, y + 0.012], 0.008, 0.017, 0, '#241d1a');
    pad.line([...oval(0.5, y + 0.012, 0.017, 0.03, 12)], LINE, { width: 0.006, alpha: 0.9 });
    return;
  }

  if (g.mark === 'urdhva') {
    pad.line([[0.5 - 0.022, y + 0.045], [0.5 - 0.026, y - 0.03]], ink, { width: 0.012, alpha: 0.95 });
    pad.line([[0.5 + 0.022, y + 0.045], [0.5 + 0.026, y - 0.03]], ink, { width: 0.012, alpha: 0.95 });
    pad.line([[0.5 - 0.02, y + 0.042], [0.5, y + 0.055], [0.5 + 0.02, y + 0.042]], ink,
      { width: 0.011, alpha: 0.95 });
    pad.line([[0.5, y + 0.04], [0.5, y - 0.018]], PIGMENT.red, { width: 0.009, alpha: 0.95 });
  } else if (g.mark === 'tripundra') {
    for (let i = 0; i < 3; i++) {
      pad.line(
        [
          [0.5 - 0.048, y + 0.014 + i * 0.018],
          [0.5, y + 0.008 + i * 0.018],
          [0.5 + 0.048, y + 0.014 + i * 0.018],
        ],
        ink,
        { width: 0.009, alpha: 0.9 },
      );
    }
  } else if (g.mark === 'tilak') {
    pad.line([[0.5, y + 0.04], [0.5, y - 0.022]], ink, { width: 0.012, alpha: 0.95 });
  } else if (g.mark === 'bindu') {
    pad.blob([0.5, y + 0.02], 0.014, 0.014, 0, PIGMENT.red);
  }
}

/**
 * Eyes that are not looking.
 *
 * Three of the most important figures in the Mahabharata are defined by their
 * sight — one born blind, one who bound her own eyes for a lifetime because her
 * husband could not use his, and the seers who keep theirs shut on purpose. It
 * is drawn over the finished eyes rather than instead of them, because the eyes
 * are still there; that is the whole point of the detail.
 */
export function sight(pad: Pad, g: Regalia, skin: string) {
  if (g.sight === 'open') return;
  const gap = 0.075;
  if (g.sight === 'bound') {
    pad.shape(
      [
        [0.5 - 0.175, EYE_Y - 0.045],
        [0.5 + 0.175, EYE_Y - 0.05],
        [0.5 + 0.18, EYE_Y + 0.052],
        [0.5 - 0.18, EYE_Y + 0.048],
      ],
      g.silk,
      { sharp: true },
    );
    scuff(pad, [0.32, EYE_Y - 0.05, 0.68, EYE_Y + 0.05], g.silk, {
      n: 60, angle: 0.1, len: 0.08, alpha: 0.3,
    });
    pad.line(
      [
        [0.5 - 0.18, EYE_Y + 0.05],
        [0.5, EYE_Y + 0.056],
        [0.5 + 0.18, EYE_Y + 0.05],
      ],
      LINE,
      { width: 0.008, alpha: 0.8 },
    );
    return;
  }
  // Painted back out in skin and given a lash line. Drawing a closed lid over
  // an open eye leaves the white showing at the corners, which reads as a
  // squint rather than as shut.
  for (const side of [-1, 1]) {
    const x = 0.5 + side * gap;
    pad.blob([x, EYE_Y], 0.047, 0.05, 0, skin);
    pad.line(
      [
        [x - 0.045, EYE_Y - 0.004],
        [x, EYE_Y + 0.016],
        [x + 0.045, EYE_Y - 0.004],
      ],
      LINE,
      { width: 0.011, alpha: 0.95, cap: 'round' },
    );
  }
}

// ------------------------------------------------------- faces that are not

/** A rakshasa's mouth, a vanara's muzzle: the marks that change the species. */
export function creature(pad: Pad, g: Regalia, hairColour: string) {
  const r = rng(g.seed ^ 0x9911);
  const my = EYE_Y + 0.115;

  if (g.kind === 'vanara') {
    // The muzzle is the whole animal. A monkey face is a projecting snout with
    // the eyes above it and the ears out to the side, and once the snout is
    // there nothing else has to be done.
    pad.blob([0.5, my - 0.012], 0.115, 0.082, 0, shift(hairColour, 0.66));
    pad.blob([0.5, my - 0.03], 0.05, 0.032, 0, shift(hairColour, 0.4));
    pad.blob([0.5 - 0.017, my - 0.036], 0.008, 0.008, 0, '#3a2b24');
    pad.blob([0.5 + 0.017, my - 0.036], 0.008, 0.008, 0, '#3a2b24');
    pad.line([...oval(0.5, my - 0.012, 0.115, 0.082, 14)], LINE, { width: 0.0075, alpha: 0.85 });
    pad.line([[0.5 - 0.06, my + 0.03], [0.5, my + 0.042], [0.5 + 0.06, my + 0.03]], LINE,
      { width: 0.009, alpha: 0.9 });
    // Fur round the whole face, which is what stops it reading as a mask.
    bristle(
      pad,
      [
        [0.5 - HW * g.wide * 0.95, EYE_Y - 0.05],
        [0.5 - HW * g.wide * 0.8, CHIN - 0.02],
        [0.5, CHIN + 0.02],
        [0.5 + HW * g.wide * 0.8, CHIN - 0.02],
        [0.5 + HW * g.wide * 0.95, EYE_Y - 0.05],
      ],
      (t) => [(t - 0.5) * 2.4, 0.7],
      hairColour,
      g.seed ^ 0x3c,
      { n: 150, len: 0.06, taper: 0.35, fan: 0.9, width: 0.0045, alpha: 0.8, curl: 0.4 },
    );
    return;
  }

  if (g.kind === 'elephant') {
    // The trunk comes down from between the eyes and curls, the tusks come out
    // under it, and the ears are drawn separately and enormous. Three marks,
    // and there is no mistaking whose face it is.
    const t0: Pt = [0.5, EYE_Y + 0.03];
    pad.line(
      [
        t0,
        [0.5 - 0.01, EYE_Y + 0.11],
        [0.5 - 0.055, EYE_Y + 0.18],
        [0.5 - 0.11, EYE_Y + 0.185],
        [0.5 - 0.135, EYE_Y + 0.14],
      ],
      hairColour,
      { width: 0.075, alpha: 1, cap: 'round' },
    );
    pad.line(
      [
        [0.5 - 0.03, EYE_Y + 0.09],
        [0.5 - 0.065, EYE_Y + 0.155],
        [0.5 - 0.115, EYE_Y + 0.152],
      ],
      shift(hairColour, -0.22),
      { width: 0.008, alpha: 0.5 },
    );
    for (const side of [-1, 1]) {
      const tusk: Pt[] = [
        [0.5 + side * 0.055, EYE_Y + 0.07],
        [0.5 + side * 0.1, EYE_Y + 0.085],
        [0.5 + side * 0.128, EYE_Y + 0.155],
        [0.5 + side * 0.098, EYE_Y + 0.115],
      ];
      // Ganesha's right tusk is broken; that is the point of the story.
      if (side > 0) tusk.length = 3;
      pad.shape(tusk, '#f2ecdc');
      pad.line([...tusk, tusk[0]], LINE, { width: 0.006, alpha: 0.8 });
    }
    return;
  }

  if (g.kind === 'bird') {
    // Two marks make a bird: a hooked beak where the nose and mouth were, and
    // a ruff of feathers round the whole face. Jatayu and Sampati are vultures
    // in the poem and there is no honest way to draw them as men.
    const beak: Pt[] = [
      [0.5 - 0.052, my - 0.062],
      [0.5 + 0.052, my - 0.062],
      [0.5 + 0.03, my + 0.03],
      [0.5 + 0.01, my + 0.075],
      [0.5 - 0.02, my + 0.036],
    ];
    pad.shape(beak, '#d9b463');
    pad.line([...beak, beak[0]], LINE, { width: 0.0075, alpha: 0.9 });
    pad.line([[0.5 - 0.05, my - 0.03], [0.5 + 0.03, my - 0.006]], LINE, { width: 0.007, alpha: 0.8 });
    pad.blob([0.5 - 0.02, my - 0.05], 0.008, 0.006, 0, LINE);
    bristle(
      pad,
      [
        [0.5 - HW * g.wide, EYE_Y - 0.03],
        [0.5 - HW * g.wide * 0.8, CHIN],
        [0.5, CHIN + 0.04],
        [0.5 + HW * g.wide * 0.8, CHIN],
        [0.5 + HW * g.wide, EYE_Y - 0.03],
      ],
      (t) => [(t - 0.5) * 2.6, 0.8],
      hairColour,
      g.seed ^ 0x6d,
      { n: 130, len: 0.075, taper: 0.3, fan: 0.55, width: 0.006, alpha: 0.85, curl: 0.25 },
    );
    return;
  }

  if (g.kind !== 'rakshasa') return;

  if (g.fangs) {
    for (const side of [-1, 1]) {
      const tusk: Pt[] = [
        [0.5 + side * 0.03, my - 0.012],
        [0.5 + side * 0.062, my - 0.006],
        [0.5 + side * 0.05, my + 0.07],
      ];
      pad.shape(tusk, '#f2ecdc', { sharp: true });
      pad.line([...tusk, tusk[0]], LINE, { width: 0.006, alpha: 0.8, sharp: true } as never);
    }
  }

  if (g.horns) {
    for (const side of [-1, 1]) {
      pad.line(
        [
          [0.5 + side * 0.12, TOP + 0.055],
          [0.5 + side * 0.185, TOP - 0.03],
          [0.5 + side * 0.165, TOP - 0.095],
        ],
        '#cdbfa6',
        { width: 0.026, alpha: 1, cap: 'round' },
      );
      pad.line(
        [
          [0.5 + side * 0.13, TOP + 0.045],
          [0.5 + side * 0.18, TOP - 0.025],
        ],
        shift('#cdbfa6', -0.3),
        { width: 0.008, alpha: 0.5 },
      );
    }
  }

  // Brows that meet, and a wilder edge to the hair. Two lines, and the face
  // stops being a person in a costume.
  pad.line(
    [
      [0.5 - 0.13, EYE_Y - 0.05],
      [0.5, EYE_Y - 0.082],
      [0.5 + 0.13, EYE_Y - 0.05],
    ],
    shift(hairColour, -0.35),
    { width: 0.019, alpha: 0.95, cap: 'round' },
  );
  for (let i = 0; i < 5; i++) {
    const t = i / 4;
    const x = 0.5 + (t - 0.5) * 0.26;
    pad.line([[x, TOP + 0.05], [x + (r() - 0.5) * 0.06, TOP - 0.06 - r() * 0.05]], hairColour, {
      width: 0.008,
      alpha: 0.75,
    });
  }
}

// ------------------------------------------------------------- ear and neck

export function ornament(pad: Pad, g: Regalia) {
  if (g.ornament === 'none') return;
  const hw = HW * g.wide;
  for (const side of [-1, 1]) {
    const x = 0.5 + side * hw * 1.02;
    if (g.ornament === 'kundala') {
      pad.line([...oval(x, EAR_Y + 0.082, 0.032, 0.034, 14)], g.metal, { width: 0.011, alpha: 1 });
    } else if (g.ornament === 'makara') {
      pad.line([[x, EAR_Y + 0.05], [x + side * 0.006, EAR_Y + 0.12]], g.metal, { width: 0.013, alpha: 1 });
      pad.blob([x + side * 0.008, EAR_Y + 0.135], 0.02, 0.026, 0, g.metal);
      pad.blob([x + side * 0.008, EAR_Y + 0.135], 0.009, 0.012, 0, '#b8332c');
    } else {
      pad.blob([x, EAR_Y + 0.05], 0.013, 0.013, 0, g.metal);
    }
  }
}

export function neckwear(pad: Pad, g: Regalia) {
  const y = CHIN + 0.055;
  if (g.neckwear === 'none') return;

  if (g.neckwear === 'rudraksha') {
    for (let k = 0; k < 2; k++) {
      const yy = y + k * 0.03;
      for (let i = 0; i <= 14; i++) {
        const t = i / 14;
        const a = Math.PI * (0.08 + t * 0.84);
        pad.blob(
          [0.5 - Math.cos(a) * 0.088, yy + Math.sin(a) * 0.026],
          0.011,
          0.011,
          0,
          k ? '#6b4a2e' : '#7d5836',
        );
      }
    }
    return;
  }

  if (g.neckwear === 'serpent') {
    // The snake round the throat, which is Shiva's and nobody else's.
    pad.line(
      [
        [0.5 - 0.11, y - 0.01],
        [0.5, y + 0.036],
        [0.5 + 0.11, y - 0.01],
      ],
      '#7f9070',
      { width: 0.024, alpha: 1, cap: 'round' },
    );
    pad.blob([0.5 + 0.125, y - 0.028], 0.028, 0.022, -0.5, '#8fa07d');
    pad.blob([0.5 + 0.132, y - 0.03], 0.006, 0.006, 0, '#241d1a');
    return;
  }

  if (g.neckwear === 'torque') {
    pad.line(
      [
        [0.5 - 0.1, y - 0.012],
        [0.5, y + 0.03],
        [0.5 + 0.1, y - 0.012],
      ],
      g.metal,
      { width: 0.026, alpha: 1, cap: 'round' },
    );
    return;
  }

  // Haar: three strands, and a pendant on the longest.
  for (let k = 0; k < 3; k++) {
    const yy = y + k * 0.032;
    const w = 0.09 + k * 0.016;
    pad.line(
      [
        [0.5 - w, yy - 0.012],
        [0.5, yy + 0.03 + k * 0.012],
        [0.5 + w, yy - 0.012],
      ],
      k === 1 ? shift(g.metal, 0.3) : g.metal,
      { width: 0.011, alpha: 1 },
    );
  }
  pad.blob([0.5, y + 0.116], 0.024, 0.03, 0, g.metal);
  pad.blob([0.5, y + 0.116], 0.011, 0.014, 0, '#3f6f8c');
}

// ------------------------------------------------------------------- drape

export function drapery(pad: Pad, g: Regalia, skin: string) {
  const r = rng(g.seed ^ 0x2b7a);
  const collar = COLLAR;
  const shoulder: Pt[] = [
    [0.5 - 0.1, collar - 0.03],
    [0.5 - 0.3, collar + 0.05],
    [0.5 - 0.46, 1.05],
    [0.5 + 0.46, 1.05],
    [0.5 + 0.3, collar + 0.05],
    [0.5 + 0.1, collar - 0.03],
  ];

  if (g.drape === 'bare' || g.drape === 'bark') {
    // Bare shoulders, which is how ascetics and most of the men are painted.
    pad.shape(shoulder, skin);
    pad.clip(shoulder, () => scuff(pad, [0.05, collar, 0.95, 1], skin, { n: 120, angle: 1.1, len: 0.14, alpha: 0.2 }));
    if (g.drape === 'bark') {
      // One length of bark cloth over the left shoulder.
      pad.shape(
        [
          [0.5 - 0.34, collar + 0.12],
          [0.5 - 0.1, collar + 0.05],
          [0.5 + 0.04, 1.05],
          [0.5 - 0.42, 1.05],
        ],
        '#c2a06a',
      );
    }
    // Yajnopavita: the thread over the left shoulder and under the right arm.
    pad.line(
      [
        [0.5 - 0.19, collar + 0.03],
        [0.5 - 0.02, collar + 0.16],
        [0.5 + 0.16, 1.02],
      ],
      '#f2ecdc',
      { width: 0.011, alpha: 0.95 },
    );
    pad.line([...shoulder.slice(0, 3)], LINE, { width: 0.008, alpha: 0.8, wobble: 0.005 });
    pad.line([...shoulder.slice(3, 6).reverse()], LINE, { width: 0.008, alpha: 0.8, wobble: 0.005 });
    return;
  }

  if (g.drape === 'armour') {
    // Bare shoulders first, because a kavacha is a *breastplate* strapped over
    // a body and not a metal shirt. Painted as one filled silhouette it came
    // out as a yellow poncho with a face on top.
    pad.shape(shoulder, skin);
    pad.clip(shoulder, () => scuff(pad, [0.05, collar, 0.95, 1], skin, { n: 80, angle: 1.1, len: 0.14, alpha: 0.18 }));
    const plate: Pt[] = [
      [0.5 - 0.26, collar + 0.06],
      [0.5 - 0.13, collar + 0.11],
      [0.5, collar + 0.06],
      [0.5 + 0.13, collar + 0.11],
      [0.5 + 0.26, collar + 0.06],
      [0.5 + 0.34, 1.05],
      [0.5 - 0.34, 1.05],
    ];
    pad.shape(plate, g.steel);
    pad.clip(plate, () => {
      scuff(pad, [0.1, collar, 0.9, 1], g.steel, { n: 110, angle: 1.1, len: 0.14, alpha: 0.26 });
      for (let i = 0; i < 4; i++) {
        const y = collar + 0.14 + i * 0.075;
        pad.line([[0.1, y], [0.5, y + 0.026], [0.9, y]], shift(g.steel, -0.4), { width: 0.011, alpha: 0.55 });
      }
      pad.blob([0.5, collar + 0.19], 0.05, 0.05, 0, g.metal);
      pad.blob([0.5, collar + 0.19], 0.022, 0.022, 0, '#b8332c');
    });
    pad.line([...plate.slice(0, 5)], g.metal, { width: 0.014, alpha: 0.95 });
    // Shoulder guards, over the strap and outlined, or they read as two
    // circles floating beside the neck.
    for (const side of [-1, 1]) {
      const at: Pt = [0.5 + side * 0.32, collar + 0.115];
      pad.blob(at, 0.085, 0.062, side * 0.32, shift(g.steel, 0.14));
      pad.line([...oval(at[0], at[1], 0.085, 0.062, 12)], LINE, { width: 0.008, alpha: 0.8 });
      pad.line(
        [
          [at[0] - side * 0.06, at[1] - 0.02],
          [at[0] + side * 0.05, at[1] - 0.012],
        ],
        shift(g.steel, -0.35),
        { width: 0.008, alpha: 0.55 },
      );
    }
    pad.line([...shoulder.slice(0, 3)], LINE, { width: 0.008, alpha: 0.85, wobble: 0.004 });
    pad.line([...shoulder.slice(3, 6).reverse()], LINE, { width: 0.008, alpha: 0.85, wobble: 0.004 });
    return;
  }

  // Silk: uttariya over both shoulders, or a sari drawn over one.
  pad.shape(shoulder, skin);
  pad.clip(shoulder, () => scuff(pad, [0.05, collar, 0.95, 1], skin, { n: 90, angle: 1.1, len: 0.14, alpha: 0.18 }));

  const cloth: Pt[] =
    g.drape === 'sari'
      ? [
          [0.5 - 0.34, collar + 0.1],
          [0.5 - 0.06, collar + 0.02],
          [0.5 + 0.2, collar + 0.12],
          [0.5 + 0.46, 1.05],
          [0.5 - 0.46, 1.05],
        ]
      : [
          [0.5 - 0.3, collar + 0.05],
          [0.5 - 0.12, collar + 0.13],
          [0.5 + 0.12, collar + 0.13],
          [0.5 + 0.3, collar + 0.05],
          [0.5 + 0.46, 1.05],
          [0.5 - 0.46, 1.05],
        ];
  pad.shape(cloth, g.silk);
  pad.clip(cloth, () => {
    scuff(pad, [0.05, collar, 0.95, 1], g.silk, { n: 130, angle: 1.25, len: 0.15, alpha: 0.26 });
    for (let i = 0; i < 5; i++) {
      const x = 0.5 - 0.34 + (i / 4) * 0.68 + (r() - 0.5) * 0.04;
      pad.line([[x, collar + 0.1], [x + 0.03, 1.04]], shift(g.silk, -0.22), { width: 0.01, alpha: 0.4 });
    }
  });
  // The hem. Gold, always, and it is what makes a shape of colour into silk.
  pad.line(
    g.drape === 'sari'
      ? [
          [0.5 - 0.34, collar + 0.1],
          [0.5 - 0.06, collar + 0.02],
          [0.5 + 0.2, collar + 0.12],
          [0.5 + 0.38, 0.86],
        ]
      : [
          [0.5 - 0.3, collar + 0.05],
          [0.5 - 0.12, collar + 0.13],
          [0.5 + 0.12, collar + 0.13],
          [0.5 + 0.3, collar + 0.05],
        ],
    g.hem,
    { width: 0.017, alpha: 0.95 },
  );
  pad.line([...shoulder.slice(0, 3)], LINE, { width: 0.008, alpha: 0.8, wobble: 0.005 });
  pad.line([...shoulder.slice(3, 6).reverse()], LINE, { width: 0.008, alpha: 0.8, wobble: 0.005 });
}
