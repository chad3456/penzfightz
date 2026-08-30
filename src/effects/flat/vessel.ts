import { contour, type Pad, type Pt } from './pad';
import { scrawl, swatches, word } from './letters';
import { BODY_BY_ID, type Ink } from './palette';

/**
 * Things you could pick up.
 *
 * Every one of these is a **profile turned about a vertical axis** — a list of
 * half-widths from the lid to the foot — plus a handful of attachments. That is
 * not a shortcut, it is what the subject actually is: the whole family of
 * bottles, jugs, jars, vases, cups, decanters, flasks and teapots are objects
 * made on a wheel or in a two-part mould, and both of those are lathes. Get the
 * lathe right and thirty silhouettes cost thirty lines of numbers.
 *
 * The attachments are where the family splits. A handle makes a jug; a spout
 * and a lid make a teapot; a crown cap and a waist make a Coke bottle and
 * nothing else in the world. There are four of them and they carry more
 * identity than the profile does.
 */

export type Tag = 'bottle' | 'pot' | 'glass' | 'jar' | 'vase' | 'cup' | 'tin';

export const TAGS: { id: Tag; name: string }[] = [
  { id: 'bottle', name: 'Bottles' },
  { id: 'pot', name: 'Pots' },
  { id: 'glass', name: 'Glasses' },
  { id: 'jar', name: 'Jars' },
  { id: 'vase', name: 'Vases' },
  { id: 'cup', name: 'Cups' },
  { id: 'tin', name: 'Tins' },
];

export type Cap = 'none' | 'crown' | 'screw' | 'cork' | 'dome' | 'flat';
export type Handle = 'none' | 'ear' | 'loop' | 'grip';

export interface Form {
  id: string;
  name: string;
  tag: Tag;
  /** [y from the top, half-width] — both as fractions of the object's height. */
  profile: [number, number][];
  cap: Cap;
  handle: Handle;
  spout?: boolean;
  /** Label band, as [top, bottom] down the object. */
  band?: [number, number];
  /** Which contents make sense in it. */
  holds: string[];
  /** How full, as a fraction of the object. 0 is empty, and empty is allowed. */
  full: number;
  /** Room above for flowers. */
  bouquet?: boolean;
}

const p = (...n: number[]): [number, number][] => {
  const out: [number, number][] = [];
  for (let i = 0; i < n.length; i += 2) out.push([n[i], n[i + 1]]);
  return out;
};

export const FORMS: Form[] = [
  // ------------------------------------------------------------------ bottles
  { id: 'contour', name: 'The contour bottle', tag: 'bottle',
    profile: p(0, 0.052, 0.07, 0.052, 0.12, 0.08, 0.19, 0.15, 0.26, 0.172, 0.42, 0.168,
      0.56, 0.148, 0.68, 0.158, 0.85, 0.178, 0.96, 0.172, 1, 0.15),
    cap: 'crown', handle: 'none', band: [0.34, 0.62], holds: ['cola'], full: 0.94 },
  { id: 'soda', name: 'Soda bottle', tag: 'bottle',
    profile: p(0, 0.05, 0.09, 0.05, 0.15, 0.09, 0.24, 0.155, 0.72, 0.16, 0.86, 0.15,
      0.94, 0.165, 1, 0.155),
    cap: 'screw', handle: 'none', band: [0.36, 0.66], holds: ['cola', 'juice', 'water'],
    full: 0.9 },
  { id: 'wine', name: 'Wine bottle', tag: 'bottle',
    profile: p(0, 0.042, 0.04, 0.05, 0.08, 0.045, 0.36, 0.048, 0.46, 0.135, 0.96, 0.14,
      1, 0.128),
    cap: 'cork', handle: 'none', band: [0.62, 0.84], holds: ['wine'], full: 0.96 },
  { id: 'milkbottle', name: 'Milk bottle', tag: 'bottle',
    profile: p(0, 0.075, 0.06, 0.075, 0.14, 0.12, 0.22, 0.145, 0.94, 0.145, 1, 0.132),
    cap: 'flat', handle: 'none', holds: ['milk'], full: 0.86 },
  { id: 'oilbottle', name: 'Oil bottle', tag: 'bottle',
    profile: p(0, 0.03, 0.1, 0.032, 0.3, 0.036, 0.42, 0.115, 0.92, 0.12, 1, 0.108),
    cap: 'cork', handle: 'none', band: [0.56, 0.78], holds: ['oil'], full: 0.9 },
  { id: 'flask', name: 'Flat flask', tag: 'bottle',
    profile: p(0, 0.045, 0.08, 0.048, 0.16, 0.13, 0.26, 0.17, 0.9, 0.175, 1, 0.155),
    cap: 'screw', handle: 'none', band: [0.4, 0.68], holds: ['tea', 'water'], full: 0.8 },
  { id: 'perfume', name: 'Scent bottle', tag: 'bottle',
    profile: p(0, 0.05, 0.1, 0.052, 0.2, 0.05, 0.3, 0.15, 0.9, 0.155, 1, 0.14),
    cap: 'dome', handle: 'none', holds: ['oil', 'water'], full: 0.62 },
  { id: 'thermos', name: 'Thermos', tag: 'bottle',
    profile: p(0, 0.1, 0.12, 0.1, 0.18, 0.13, 0.94, 0.13, 1, 0.12),
    cap: 'flat', handle: 'none', band: [0.34, 0.6], holds: ['tea'], full: 0 },

  // -------------------------------------------------------------------- pots
  { id: 'teapot', name: 'Glass teapot', tag: 'pot',
    profile: p(0, 0.13, 0.08, 0.19, 0.2, 0.27, 0.42, 0.31, 0.66, 0.3, 0.86, 0.24, 1, 0.16),
    cap: 'dome', handle: 'loop', spout: true, holds: ['tea', 'glass'], full: 0.42 },
  { id: 'kettle', name: 'Enamel kettle', tag: 'pot',
    profile: p(0, 0.11, 0.09, 0.16, 0.24, 0.26, 0.6, 0.29, 0.9, 0.26, 1, 0.2),
    cap: 'dome', handle: 'grip', spout: true, holds: ['enamel'], full: 0 },
  { id: 'cafetiere', name: 'Cafetière', tag: 'pot',
    profile: p(0, 0.12, 0.1, 0.12, 0.16, 0.155, 0.94, 0.155, 1, 0.145),
    cap: 'flat', handle: 'ear', spout: true, holds: ['tea'], full: 0.62 },
  { id: 'jug', name: 'Jug', tag: 'pot',
    profile: p(0, 0.16, 0.1, 0.185, 0.5, 0.2, 0.9, 0.185, 1, 0.16),
    cap: 'none', handle: 'ear', spout: true, holds: ['milk', 'water', 'ceramic'], full: 0.55 },
  { id: 'coffeepot', name: 'Coffee pot', tag: 'pot',
    profile: p(0, 0.1, 0.08, 0.14, 0.3, 0.2, 0.9, 0.22, 1, 0.19),
    cap: 'dome', handle: 'loop', spout: true, holds: ['tea', 'enamel'], full: 0.5 },
  { id: 'watering', name: 'Watering can', tag: 'pot',
    profile: p(0, 0.14, 0.12, 0.19, 0.5, 0.24, 0.92, 0.235, 1, 0.2),
    cap: 'none', handle: 'grip', spout: true, holds: ['enamel', 'copper'], full: 0.35 },

  // ------------------------------------------------------------------ glasses
  { id: 'tumbler', name: 'Tumbler', tag: 'glass',
    profile: p(0, 0.15, 0.08, 0.152, 0.9, 0.135, 1, 0.128),
    cap: 'none', handle: 'none', holds: ['water', 'juice', 'glass'], full: 0.6 },
  { id: 'wineglass', name: 'Wine glass', tag: 'glass',
    profile: p(0, 0.155, 0.06, 0.16, 0.3, 0.145, 0.42, 0.055, 0.48, 0.022, 0.9, 0.02,
      0.94, 0.16, 1, 0.17),
    cap: 'none', handle: 'none', holds: ['wine', 'water'], full: 0.28 },
  { id: 'highball', name: 'Highball', tag: 'glass',
    profile: p(0, 0.115, 0.06, 0.118, 0.94, 0.108, 1, 0.104),
    cap: 'none', handle: 'none', holds: ['juice', 'water'], full: 0.72 },
  { id: 'goblet', name: 'Goblet', tag: 'glass',
    profile: p(0, 0.17, 0.1, 0.185, 0.34, 0.175, 0.46, 0.06, 0.52, 0.03, 0.88, 0.028,
      0.94, 0.17, 1, 0.18),
    cap: 'none', handle: 'none', holds: ['wine', 'greenglass'], full: 0.34 },

  // -------------------------------------------------------------------- jars
  { id: 'masonjar', name: 'Mason jar', tag: 'jar',
    profile: p(0, 0.15, 0.07, 0.152, 0.16, 0.185, 0.9, 0.185, 1, 0.17),
    cap: 'flat', handle: 'none', band: [0.36, 0.66], holds: ['glass', 'oil'], full: 0.7 },
  { id: 'jamjar', name: 'Jam jar', tag: 'jar',
    profile: p(0, 0.145, 0.08, 0.148, 0.18, 0.175, 0.92, 0.175, 1, 0.16),
    cap: 'flat', handle: 'none', band: [0.4, 0.68], holds: ['juice', 'glass'], full: 0.78 },
  { id: 'storagejar', name: 'Storage jar', tag: 'jar',
    profile: p(0, 0.11, 0.06, 0.19, 0.14, 0.21, 0.9, 0.21, 1, 0.19),
    cap: 'dome', handle: 'none', holds: ['ceramic', 'glass'], full: 0.4 },
  { id: 'tin', name: 'Tin', tag: 'tin',
    profile: p(0, 0.17, 0.05, 0.175, 0.95, 0.175, 1, 0.17),
    cap: 'flat', handle: 'none', band: [0.24, 0.7], holds: ['enamel', 'copper'], full: 0 },
  { id: 'can', name: 'Drink can', tag: 'tin',
    profile: p(0, 0.1, 0.05, 0.13, 0.12, 0.145, 0.88, 0.145, 0.95, 0.13, 1, 0.108),
    cap: 'flat', handle: 'none', band: [0.24, 0.72], holds: ['cola', 'juice'], full: 0 },
  { id: 'caddy', name: 'Tea caddy', tag: 'tin',
    profile: p(0, 0.14, 0.06, 0.16, 0.94, 0.16, 1, 0.15),
    cap: 'dome', handle: 'none', band: [0.3, 0.68], holds: ['copper', 'enamel'], full: 0 },

  // ------------------------------------------------------------------- vases
  { id: 'bottlevase', name: 'Bottle vase', tag: 'vase',
    profile: p(0, 0.07, 0.12, 0.072, 0.2, 0.1, 0.34, 0.17, 0.86, 0.185, 0.96, 0.18, 1, 0.16),
    cap: 'none', handle: 'none', holds: ['glass', 'greenglass'], full: 0.5, bouquet: true },
  { id: 'flare', name: 'Flared vase', tag: 'vase',
    profile: p(0, 0.2, 0.1, 0.17, 0.5, 0.13, 0.86, 0.15, 1, 0.16),
    cap: 'none', handle: 'none', holds: ['glass', 'ceramic'], full: 0.4, bouquet: true },
  { id: 'bulb', name: 'Bulb vase', tag: 'vase',
    profile: p(0, 0.06, 0.16, 0.062, 0.32, 0.1, 0.5, 0.2, 0.86, 0.2, 1, 0.15),
    cap: 'none', handle: 'none', holds: ['glass', 'water'], full: 0.55, bouquet: true },
  { id: 'cylinder', name: 'Cylinder vase', tag: 'vase',
    profile: p(0, 0.14, 0.05, 0.142, 0.95, 0.142, 1, 0.136),
    cap: 'none', handle: 'none', holds: ['glass', 'greenglass'], full: 0.6, bouquet: true },

  // -------------------------------------------------------------------- cups
  { id: 'mug', name: 'Mug', tag: 'cup',
    profile: p(0, 0.16, 0.06, 0.162, 0.92, 0.152, 1, 0.145),
    cap: 'none', handle: 'ear', holds: ['tea', 'ceramic'], full: 0.62 },
  { id: 'teacup', name: 'Teacup', tag: 'cup',
    profile: p(0, 0.22, 0.08, 0.215, 0.62, 0.14, 0.72, 0.06, 0.86, 0.055, 0.94, 0.19, 1, 0.2),
    cap: 'none', handle: 'ear', holds: ['tea', 'ceramic'], full: 0.4 },
  { id: 'espresso', name: 'Espresso cup', tag: 'cup',
    profile: p(0, 0.17, 0.08, 0.168, 0.86, 0.135, 1, 0.13),
    cap: 'none', handle: 'ear', holds: ['tea', 'ceramic'], full: 0.5 },
  { id: 'bowl', name: 'Bowl', tag: 'cup',
    profile: p(0, 0.26, 0.1, 0.255, 0.72, 0.16, 0.94, 0.1, 1, 0.098),
    cap: 'none', handle: 'none', holds: ['ceramic', 'water'], full: 0.5 },
];

export const FORM_BY_ID = Object.fromEntries(FORMS.map((f) => [f.id, f])) as Record<string, Form>;

export interface Box {
  /** Centre line and the top and bottom of the object, in card units. */
  cx: number;
  top: number;
  /** Height in y units. */
  h: number;
  /** Card aspect, width over height. */
  aspect: number;
}

/** Profile to closed outline: down the right side, across the foot, up the left. */
export function silhouette(f: Form, box: Box, squash = 1): Pt[] {
  const ux = (box.h / box.aspect) * squash;
  const out: Pt[] = [];
  for (const [y, w] of f.profile) out.push([box.cx + w * ux, box.top + y * box.h]);
  for (let i = f.profile.length - 1; i >= 0; i--) {
    const [y, w] = f.profile[i];
    out.push([box.cx - w * ux, box.top + y * box.h]);
  }
  return out;
}

const at = (f: Form, box: Box, y: number, side: number, squash = 1): Pt => {
  const ux = (box.h / box.aspect) * squash;
  let w = f.profile[f.profile.length - 1][1];
  for (let i = 1; i < f.profile.length; i++) {
    if (f.profile[i][0] >= y) {
      const a = f.profile[i - 1];
      const b = f.profile[i];
      const t = (y - a[0]) / Math.max(1e-6, b[0] - a[0]);
      w = a[1] + (b[1] - a[1]) * t;
      break;
    }
  }
  return [box.cx + side * w * ux, box.top + y * box.h];
};

export interface VesselLook {
  inks: Ink[];
  body: string;
  squash: number;
  /** How many broad translucent marks go inside. */
  marks: number;
  /** Drips down from the band and the shoulder. */
  drips: number;
  highlights: number;
  laps: number;
  label?: { logo: boolean; text?: string };
  strip: boolean;
  seed: number;
}

/**
 * Paint one.
 *
 * The order is the whole thing, and it is the reverse of the crayon and
 * watercolour studies: **the local colour goes down first and loosely, and the
 * arbitrary colour goes on last and precisely.** Broad translucent marks that
 * roughly know where the object is, then contents, then the label, then the
 * six inks arguing with all of it, then white on top of everything. Reverse any
 * two of those and the picture becomes an illustration.
 */
export function paintVessel(pad: Pad, f: Form, box: Box, look: VesselLook) {
  const r = pad.r;
  const ink = () => look.inks[Math.floor(r() * look.inks.length) % look.inks.length].hex;
  const body = BODY_BY_ID[look.body] ?? BODY_BY_ID.glass;
  const shape = silhouette(f, box, look.squash);
  const ux = (box.h / box.aspect) * look.squash;
  const wide = f.profile.reduce((m, q) => Math.max(m, q[1]), 0) * ux;

  // 1 · the body, as a few broad marks that only roughly agree with the form.
  pad.clip(shape, () => {
    for (let i = 0; i < look.marks; i++) {
      const t = r();
      const y0 = box.top + box.h * t * 0.9;
      const y1 = y0 + box.h * (0.12 + r() * 0.45);
      const x = box.cx + (r() - 0.5) * wide * 1.7;
      pad.line(
        [[x, y0], [x + (r() - 0.5) * wide * 0.4, (y0 + y1) / 2], [x + (r() - 0.5) * wide * 0.5, y1]],
        body.tints[Math.floor(r() * body.tints.length) % body.tints.length],
        { width: wide * (0.35 + r() * 0.6) * pad.w / pad.s, alpha: body.weight * (0.5 + r() * 0.5),
          under: true, wobble: 0.006 },
      );
    }
  });

  // 2 · what is in it. A liquid line across the form is one of the few marks
  // here that has to be accurate: put it off level and the object tips over.
  if (f.full > 0.02) {
    const y = box.top + box.h * (1 - f.full) + box.h * 0.06;
    const l = at(f, box, Math.min(0.98, (y - box.top) / box.h), -1, look.squash);
    const rr = at(f, box, Math.min(0.98, (y - box.top) / box.h), 1, look.squash);
    pad.clip(shape, () => {
      pad.line([[l[0] - 0.02, y], [rr[0] + 0.02, y]], ink(), { width: 0.011, wobble: 0.003 });
    });
  }

  // 3 · the label band.
  if (f.band && look.label) {
    const [t0, t1] = f.band;
    const yTop = box.top + box.h * t0;
    const yBot = box.top + box.h * t1;
    const l0 = at(f, box, t0, -1, look.squash);
    const r0 = at(f, box, t0, 1, look.squash);
    const l1 = at(f, box, t1, -1, look.squash);
    const r1 = at(f, box, t1, 1, look.squash);
    const band: Pt[] = [
      [l0[0], yTop], [r0[0], yTop], [r1[0], yBot], [l1[0], yBot],
    ];
    const face = look.inks.find((i) => i.dark) ?? look.inks[0];
    pad.shape(band, face.hex, { alpha: 0.94, sharp: true });
    if (look.label.logo) {
      scrawl(pad, [l0[0] + (r0[0] - l0[0]) * 0.12, yTop + (yBot - yTop) * 0.44],
        (r0[0] - l0[0]) * 0.78, box.h * 0.075, ink(), 3 + Math.floor(r() * 3),
        { width: 0.013 });
    }
    if (look.label.text) {
      // Fitted to the band, not set at a fixed size. A word wider than the
      // label it is on reads as a mistake rather than as a hand — the one
      // failure in this style that cannot be passed off as looseness.
      const room = Math.abs(r1[0] - l1[0]) * 0.84;
      const per = 0.62 * (pad.h / pad.w) * 1.42;
      const size = Math.min(box.h * 0.075, room / (look.label.text.length * per));
      const w = look.label.text.length * size * per;
      word(pad, look.label.text, [(l1[0] + r1[0]) / 2 - w / 2, yBot - (yBot - yTop) * 0.36],
        size, '#ffffff', { width: 0.0105 });
    }
  }

  // 4 · the drips. A wet edge on a vertical surface runs, and a few runs are
  // what stop a flat fill reading as a printed panel.
  for (let i = 0; i < look.drips; i++) {
    const t = f.band ? f.band[1] : 0.4 + r() * 0.3;
    const x = box.cx + (r() - 0.5) * wide * 1.6;
    const y = box.top + box.h * t;
    pad.line([[x, y - box.h * 0.02], [x, y + box.h * (0.05 + r() * 0.16)]], ink(),
      { width: 0.008 + r() * 0.008, wobble: 0.002 });
  }

  // 5 · the attachments, drawn as line rather than as form. A handle in this
  // style is two arcs and a gap, never a filled shape.
  if (f.spout) {
    const s = at(f, box, 0.14, -1, look.squash);
    const s2 = at(f, box, 0.34, -1, look.squash);
    pad.line([[s[0] + 0.005, s2[1]], [s[0] - wide * 0.55, s[1] - box.h * 0.02],
      [s[0] - wide * 0.5, s[1] + box.h * 0.03]], ink(), { width: 0.011, wobble: 0.003 });
    pad.line([[s2[0], s2[1]], [s[0] - wide * 0.42, s[1] + box.h * 0.05]], ink(),
      { width: 0.01, wobble: 0.003 });
  }
  if (f.handle !== 'none') {
    const a = at(f, box, f.handle === 'ear' ? 0.18 : 0.1, 1, look.squash);
    const b = at(f, box, f.handle === 'ear' ? 0.66 : 0.42, 1, look.squash);
    const reach = wide * (f.handle === 'grip' ? 0.95 : 0.72);
    const arcPts: Pt[] = [
      a, [a[0] + reach, a[1] + box.h * 0.04], [a[0] + reach * 1.05, (a[1] + b[1]) / 2],
      [b[0] + reach * 0.7, b[1] - box.h * 0.03], b,
    ];
    pad.line(arcPts, ink(), { width: 0.013, wobble: 0.003 });
    pad.line(arcPts.map((q) => [q[0] - 0.012, q[1] + 0.004] as Pt), ink(),
      { width: 0.009, wobble: 0.003, alpha: 0.9 });
  }
  if (f.cap !== 'none') {
    const c = at(f, box, 0.02, 1, look.squash);
    const capW = f.cap === 'crown' ? Math.max(c[0] - box.cx, wide * 0.3) * 1.45 : (c[0] - box.cx) * 1.2;
    const capH = box.h * (f.cap === 'cork' ? 0.055 : f.cap === 'dome' ? 0.05 : 0.035);
    const top = box.top - capH * (f.cap === 'dome' ? 0.4 : 1);
    const capShape: Pt[] =
      f.cap === 'dome'
        ? [[box.cx - capW, box.top + capH * 0.4], [box.cx - capW * 0.7, top],
          [box.cx, top - capH * 0.35], [box.cx + capW * 0.7, top],
          [box.cx + capW, box.top + capH * 0.4]]
        : [[box.cx - capW, box.top + capH * 0.5], [box.cx - capW, top],
          [box.cx + capW, top], [box.cx + capW, box.top + capH * 0.5]];
    const face = look.inks.find((i) => i.dark) ?? look.inks[0];
    pad.shape([...capShape, [box.cx + capW, box.top + capH * 0.5]], face.hex,
      { alpha: 0.92, sharp: f.cap !== 'dome' });
    contour(pad, capShape, look.inks.map((i) => i.hex),
      { laps: 2, arc: 0.3, offset: 0.008, width: 0.01 });
    if (f.cap === 'dome') {
      pad.blob([box.cx, top - capH * 0.5], box.h * 0.028 / box.aspect, box.h * 0.028, 0,
        ink(), { alpha: 0.95 });
    }
  }

  // 6 · the six, going round the form. See `contour` for why it is broken,
  // off-register and the wrong colour.
  contour(pad, shape, look.inks.map((i) => i.hex), {
    laps: look.laps, arc: 0.1, gap: 0.55, offset: 0.013, width: 0.011,
  });

  // Inner edges: shoulder, foot, the seam of a band. The same treatment, or
  // they read as construction lines under a finished drawing.
  const rings = [0.1, f.band ? f.band[0] : 0.35, f.band ? f.band[1] : 0.7, 0.96];
  for (const t of rings) {
    if (r() < 0.45) continue;
    const l = at(f, box, t, -1, look.squash);
    const rr = at(f, box, t, 1, look.squash);
    pad.line([[l[0], l[1]], [box.cx, l[1] + box.h * 0.012], [rr[0], rr[1]]], ink(),
      { width: 0.009, wobble: 0.003, over: 0.03 });
  }

  // 7 · white. Not a highlight in the rendering sense — an opaque mark laid
  // over the finished drawing, which is what a lit edge on glass looks like
  // when you have no way of lightening anything.
  for (let i = 0; i < look.highlights; i++) {
    const x = box.cx + (r() - 0.5) * wide * 1.4;
    const y0 = box.top + box.h * (0.08 + r() * 0.6);
    pad.line([[x, y0], [x + (r() - 0.5) * 0.01, y0 + box.h * (0.1 + r() * 0.34)]], '#ffffff',
      { width: 0.02 + r() * 0.026, wobble: 0.002 });
  }

  if (look.strip) swatches(pad, look.inks.map((i) => i.hex), [0.87, 0.2], 0.017);
}

/**
 * Flowers.
 *
 * Not drawn as flowers. What the reference actually contains is a cloud of
 * rounded blobs at four or five greens, a dozen long single-stroke stems that
 * go all the way down into the neck of the vase, and about six marks of
 * something bright. Nothing in it is a species. The reason it reads as a
 * bunch is the *stems* — they converge, and the convergence is the only piece
 * of drawing in the whole shape.
 */
export function bouquet(pad: Pad, neck: Pt, spread: number, height: number, look: VesselLook,
  greens: string[]) {
  const r = pad.r;
  const ink = () => look.inks[Math.floor(r() * look.inks.length) % look.inks.length].hex;
  const stems = 9 + Math.floor(r() * 8);
  const tips: Pt[] = [];
  for (let i = 0; i < stems; i++) {
    const t = i / (stems - 1) - 0.5;
    const lean = t * spread * (1.2 + r() * 0.9);
    const tip: Pt = [neck[0] + lean, neck[1] - height * (0.55 + r() * 0.5)];
    tips.push(tip);
    pad.line(
      [neck, [neck[0] + lean * 0.35, neck[1] - height * 0.3], [tip[0] * 0.98 + neck[0] * 0.02,
        tip[1] + height * 0.08], tip],
      greens[Math.floor(r() * greens.length) % greens.length],
      { width: 0.006 + r() * 0.005, wobble: 0.004 },
    );
  }
  // The mass. Blobs clustered on the tips rather than scattered, or the bunch
  // reads as confetti thrown near a vase.
  for (let i = 0; i < 150; i++) {
    const t = tips[Math.floor(r() * tips.length) % tips.length];
    const rad = height * (0.05 + r() * 0.26);
    const a = r() * Math.PI * 2;
    const at2: Pt = [t[0] + Math.cos(a) * rad * 0.8 / pad.w * pad.s,
      t[1] + Math.sin(a) * rad * 0.8];
    const size = height * (0.022 + r() * 0.045);
    pad.blob(at2, size / pad.w * pad.s * 0.9, size, r() * Math.PI,
      greens[Math.floor(r() * greens.length) % greens.length],
      { alpha: 0.72 + r() * 0.28 });
  }
  for (let i = 0; i < 14; i++) {
    const t = tips[Math.floor(r() * tips.length) % tips.length];
    const size = height * (0.02 + r() * 0.03);
    pad.blob([t[0] + (r() - 0.5) * height * 0.2 / pad.w * pad.s, t[1] + (r() - 0.5) * height * 0.2],
      size / pad.w * pad.s, size, r() * Math.PI, ink(), { alpha: 0.9 });
  }
  // Loose dots away from the bunch: the few marks that make the page air
  // rather than background.
  for (let i = 0; i < 12; i++) {
    const size = height * (0.008 + r() * 0.014);
    pad.blob([neck[0] + (r() - 0.5) * spread * 5, neck[1] - height * (0.1 + r() * 1.1)],
      size / pad.w * pad.s, size, 0,
      r() < 0.5 ? greens[Math.floor(r() * greens.length) % greens.length] : ink(),
      { alpha: 0.85 });
  }
}
