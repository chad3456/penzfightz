import { Pad } from './pad';
import { sixColours, BODIES, BODY_BY_ID, SKINS, LIPS, type Ink } from './palette';
import { FORMS, TAGS as FORM_TAGS, bouquet, paintVessel, silhouette, type Form,
  type Tag as FormTag } from './vessel';
import { CUTS, EXTRAS, paintFace, type FaceRecipe } from './face';
import { word } from './letters';

/**
 * One drawing.
 *
 * Everything the sampler chooses is either **what the thing is** or **how it
 * was drawn**, and the two never touch. A cola bottle can come out in six
 * colours that contain no red at all; a teapot can be given the palette a fire
 * extinguisher would want. That separation is not a quirk of the code, it is
 * the subject of the study: these drawings are about the distance between an
 * object and the marks that stand for it, and the moment the sampler starts
 * choosing greens for the vase the distance closes and the pictures become
 * illustrations of things.
 *
 * The only place local colour survives is the translucent fill that goes down
 * first, which is why it goes down first — everything after it is free.
 */

export type Kind = 'vessel' | 'face';
export type Tag = FormTag | 'face';

export const TAGS: { id: Tag; name: string }[] = [...FORM_TAGS, { id: 'face', name: 'Faces' }];

export interface Subject {
  seed: number;
  kind: Kind;
  tag: Tag;
  inks: Ink[];
  name: string;
  note: string;
  key: string;
  /** Placement in the card. */
  cx: number;
  top: number;
  height: number;
  strip: boolean;
  laps: number;
  highlights: number;
  /** Vessels. */
  form?: Form;
  body?: string;
  squash?: number;
  marks?: number;
  drips?: number;
  label?: { logo: boolean; text?: string };
  bouquet?: boolean;
  /** Faces. */
  face?: FaceRecipe;
  hair?: string;
}

const mulberry = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const pick = <T,>(list: T[], r: () => number) => list[Math.floor(r() * list.length) % list.length];

const WORDS = ['ORIGINAL', 'CLASSIC', 'NO. 7', 'PURE', 'FRESH', 'DAILY', 'HOUSE', 'RESERVE',
  'GENUINE', 'FULL FAT', 'EXTRA', 'FIRST PRESS', 'SODA', 'REFILL', 'TABLE', 'STILL', 'ICED',
  'MORNING', 'STRONG', 'SMALL BATCH'];

const HOW = [
  'six colours, and none of them is its colour',
  'outlined three times and never once accurately',
  'the line goes round twice and misses twice',
  'local colour underneath, argument on top',
  'drawn quickly and not corrected',
  'white last, over everything',
  'the palette is in the corner; the drawing keeps to it',
  'every edge decided more than once',
];

const NAMED: Record<string, string[]> = {
  cola: ['Cola', 'The bottle'],
  tea: ['Tea', 'Still warm'],
  wine: ['Wine', 'Half a bottle'],
  milk: ['Milk', 'A pint'],
  water: ['Water', 'Tap water'],
  oil: ['Oil', 'Good oil'],
  juice: ['Juice', 'Orange'],
  glass: ['Empty', 'Clear'],
  greenglass: ['Green glass', 'Old glass'],
  ceramic: ['Glazed', 'Off the wheel'],
  enamel: ['Enamel', 'Chipped enamel'],
  copper: ['Copper', 'Beaten copper'],
};

export function makeSubject(seed: number, only?: Tag): Subject {
  const r = mulberry(seed);
  const inks = sixColours(r);
  const wantFace = only === 'face' || (!only && r() < 0.26);

  const shared = {
    seed,
    inks,
    strip: r() < 0.62,
    laps: 2 + Math.floor(r() * 3),
    highlights: 1 + Math.floor(r() * 4),
    cx: 0.42 + r() * 0.14,
    top: 0.14 + r() * 0.1,
    height: 0.5 + r() * 0.18,
    note: `${inks.map((i) => i.name.toLowerCase()).slice(0, 3).join(', ')} — ${
      HOW[Math.floor(r() * HOW.length) % HOW.length]
    }.`,
  };

  if (wantFace) {
    const cut = pick(CUTS, r);
    const face: FaceRecipe = {
      cut,
      extra: pick(EXTRAS, r),
      skin: pick(SKINS, r),
      lip: pick(LIPS, r),
      jaw: 0.72 + r() * 0.2,
      crown: 1 + r() * 0.14,
      long: 1.02 + r() * 0.16,
      tilt: (r() - 0.5) * 24,
      turn: (r() - 0.5) * 1.4,
      eyes: pick(['open', 'open', 'open', 'shut', 'wide', 'side'] as const, r),
      brows: r(),
      smile: r(),
    };
    const hair = pick(inks, r).hex;
    return {
      ...shared,
      kind: 'face',
      tag: 'face',
      face,
      hair,
      height: 0.3 + r() * 0.08,
      top: 0.19 + r() * 0.07,
      name: faceName(face, r),
      key: `face|${cut}|${face.extra}|${face.eyes}|${inks[0].id}|${Math.round(face.turn * 2)}`,
    };
  }

  // `only` cannot be 'face' here: that branch returned above.
  const pool = only ? FORMS.filter((f) => f.tag === only) : FORMS;
  const chosen = pick(pool.length ? pool : FORMS, r);
  const body = pick(chosen.holds.length ? chosen.holds : BODIES.map((b) => b.id), r);
  const label = chosen.band
    ? { logo: r() < 0.45, text: r() < 0.7 ? pick(WORDS, r) : undefined }
    : undefined;

  return {
    ...shared,
    kind: 'vessel',
    tag: chosen.tag,
    form: chosen,
    body,
    squash: 0.86 + r() * 0.3,
    marks: 5 + Math.floor(r() * 7),
    drips: Math.floor(r() * 5),
    label,
    bouquet: chosen.bouquet && r() < 0.8,
    height: chosen.bouquet ? 0.34 + r() * 0.1 : 0.56 + r() * 0.2,
    top: chosen.bouquet ? 0.52 + r() * 0.06 : 0.12 + r() * 0.1,
    name: vesselName(chosen, body, r),
    key: `${chosen.id}|${body}|${inks[0].id}|${inks[3].id}|${label?.text ?? '-'}`,
  };
}

function vesselName(f: Form, body: string, r: () => number) {
  const names = NAMED[body];
  if (f.bouquet) return r() < 0.5 ? 'Flowers' : `Flowers, ${f.name.toLowerCase()}`;
  if (!names) return f.name;
  return r() < 0.5 ? `${names[0]}, ${f.name.toLowerCase()}` : names[1];
}

const FIRST = ['She is looking away', 'Straight at you', 'Head tilted', 'Eyes shut', 'Hair up',
  'A quarter turn', 'Chin down', 'Listening', 'Half a smile', 'Nearly laughing', 'Thinking',
  'Waiting'];

function faceName(f: FaceRecipe, r: () => number) {
  if (f.eyes === 'shut') return r() < 0.5 ? 'Eyes shut' : 'Almost asleep';
  if (f.extra === 'glasses') return 'In her glasses';
  if (f.extra === 'hat') return 'Under a hat';
  if (f.cut === 'wrap') return 'Headwrap';
  if (Math.abs(f.turn) > 0.5) return r() < 0.5 ? 'A quarter turn' : 'Looking away';
  return FIRST[Math.floor(r() * FIRST.length) % FIRST.length];
}

/** Distinct drawings, by rejection on the recipe. */
export function subjects(count: number, seed: number, only?: Tag): Subject[] {
  const out: Subject[] = [];
  const seen = new Set<string>();
  let s = seed >>> 0;
  let tries = 0;
  while (out.length < count && tries < count * 50) {
    tries++;
    s = (s + 0x9e3779b9) >>> 0;
    const sub = makeSubject(s, only);
    if (seen.has(sub.key)) continue;
    seen.add(sub.key);
    out.push(sub);
  }
  while (out.length < count) {
    s = (s + 0x9e3779b9) >>> 0;
    out.push(makeSubject(s, only));
  }
  return out;
}

const GREENS = ['#2cb92c', '#7fbf4a', '#a9e22c', '#1f7a3a', '#5ea86a', '#c8e08a', '#357f45'];

/** Draw one, into a context already translated and clipped to its cell. */
export function drawSubject(g: CanvasRenderingContext2D, sub: Subject, w: number, h: number) {
  const pad = new Pad(g, w, h, sub.seed);
  const aspect = w / h;
  g.save();
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, w, h);
  g.restore();

  if (sub.kind === 'face' && sub.face && sub.hair) {
    paintFace(pad, sub.face, {
      inks: sub.inks, hair: sub.hair, strip: sub.strip, highlights: sub.highlights,
      laps: sub.laps,
    }, {
      cx: sub.cx,
      cy: sub.top + sub.height * 0.5,
      // A head is roughly seven tenths as wide as it is long, and the aspect
      // has to come back out because x is measured across the short side.
      w: (sub.height * 0.36) / aspect,
      h: sub.height * 0.5,
    });
    return;
  }

  const form = sub.form;
  if (!form) return;
  const box = { cx: sub.cx, top: sub.top, h: sub.height, aspect };
  const look = {
    inks: sub.inks,
    body: sub.body ?? 'glass',
    squash: sub.squash ?? 1,
    marks: sub.marks ?? 6,
    drips: sub.drips ?? 0,
    highlights: sub.highlights,
    laps: sub.laps,
    label: sub.label,
    strip: sub.strip,
    seed: sub.seed,
  };

  if (sub.bouquet) {
    const neck: [number, number] = [box.cx, box.top + box.h * 0.02];
    bouquet(pad, neck, (box.h / aspect) * 0.16, box.h * 1.15, look, GREENS);
  }
  paintVessel(pad, form, box, look);
}

export { silhouette, word, BODY_BY_ID };
