import type { Press } from '../rooms/riso';
import {
  dimension, disc, hatch, label, leader, line, shape, stipple, wash,
  type Field, type UPt,
} from './draw';

/**
 * Twelve plates, and not one of them is a portrait.
 *
 * The film this is built against never shows the thing it is about. It points
 * one lens at a dozen unrelated subjects — a bird, a foxglove, a map, a cell, a
 * curve, the moon — and the thing it is about is whatever those have in common.
 *
 * So this is Rama without Rama in it. **He is never drawn.** What is drawn is
 * what he is made of: a bow, a road, a tree somebody waited under, a sea that
 * had to be crossed, a pair of sandals that ruled a kingdom for fourteen years,
 * and a city that counted the days and then lit every window on the way in.
 *
 * That is not squeamishness. He is a figure a great many people hold sacred,
 * and a drawing of him would be somebody's idea of him — where a drawing of his
 * bow is only ever a bow. The method and the subject happen to want the same
 * thing.
 */

export interface Plate {
  id: string;
  /** What the lantern operator would have written on the slide. */
  title: string;
  /** The line underneath, in the plate's own hand. */
  caption: string;
  draw: (p: Press, f: Field, t: number) => void;
}

const sway = (t: number, speed: number, amount: number, phase = 0) =>
  Math.sin(t * speed + phase) * amount;

// ─────────────────────────────────────────────────────────────── the bow

const bow: Plate = {
  id: 'bow',
  title: 'The Bow',
  caption: 'Shiva’s, kept at Mithila. Lifted once, and broken in the lifting.',
  draw: (p, f, t) => {
    const b = 0.42 + sway(t, 0.7, 0.004);
    // A recurve: out at the tips, back through the belly. Drawn as a closed
    // shape with real thickness, because a bow drawn as a line is a hair.
    const outer: UPt[] = [
      [b + 0.02, 0.14], [b - 0.05, 0.22], [b - 0.10, 0.36],
      [b - 0.11, 0.50], [b - 0.10, 0.64], [b - 0.05, 0.78], [b + 0.02, 0.86],
    ];
    const inner: UPt[] = [
      [b + 0.045, 0.855], [b - 0.018, 0.775], [b - 0.062, 0.64],
      [b - 0.072, 0.50], [b - 0.062, 0.36], [b - 0.018, 0.225], [b + 0.045, 0.145],
    ];
    const stave: UPt[] = [...outer, ...inner];
    shape(p, 'brick', f, stave, 0.72, 1.4);
    hatch(p, f, stave, -Math.PI / 3, 0.012, 0.5, 11);
    // The string, taut between the nocks.
    line(p, f, [[b + 0.03, 0.145], [b + 0.03, 0.855]], 0.9, false, false);
    // The grip, bound in cord.
    const grip: UPt[] = [
      [b - 0.115, 0.435], [b - 0.055, 0.435], [b - 0.055, 0.565], [b - 0.115, 0.565],
    ];
    shape(p, 'mustard', f, grip, 0.78, 1, false);
    for (let i = 0; i < 9; i++) {
      const v = 0.442 + i * 0.015;
      line(p, f, [[b - 0.117, v], [b - 0.053, v + 0.009]], 0.5, false, false);
    }
    dimension(p, f, [b - 0.20, 0.145], [b - 0.20, 0.855], 'six cubits');
    leader(p, f, [b + 0.20, 0.26], [b + 0.031, 0.30]);
    label(p, f, 'the string, which is the part that is heard', b + 0.215, 0.263, 0.024);
    leader(p, f, [b + 0.20, 0.60], [b - 0.086, 0.50]);
    label(p, f, 'the grip, bound in cord', b + 0.215, 0.603, 0.024);
    label(p, f, 'Fig. I', b - 0.20, 0.925, 0.026, 'caps');
  },
};

// ─────────────────────────────────────────────────────────── the deer

const deer: Plate = {
  id: 'deer',
  title: 'The Deer',
  caption: 'Cervus aureus — the golden one. No such animal.',
  draw: (p, f, t) => {
    const lift = sway(t, 1.0, 0.008);
    // Barrel of the body: deep at the shoulder, tucked at the flank, which is
    // the one proportion that separates a deer from a dog.
    const body: UPt[] = [
      [0.26, 0.50], [0.34, 0.435], [0.50, 0.425], [0.62, 0.45],
      [0.685, 0.50], [0.675, 0.575], [0.60, 0.605], [0.44, 0.615],
      [0.32, 0.595], [0.255, 0.545],
    ];
    shape(p, 'mustard', f, body, 0.74, 1.2);
    hatch(p, f, body, -Math.PI / 3.2, 0.011, 0.5, 21);
    // Haunch and shoulder, drawn as their own curves over the barrel.
    line(p, f, [[0.30, 0.44], [0.345, 0.53], [0.325, 0.60]], 0.7);
    line(p, f, [[0.62, 0.45], [0.645, 0.53], [0.625, 0.60]], 0.7);
    // Neck, up and back: it has heard something.
    const ny = lift;
    const neck: UPt[] = [
      [0.655, 0.455], [0.700, 0.398 + ny], [0.726, 0.342 + ny],
      [0.686, 0.332 + ny], [0.652, 0.382 + ny], [0.615, 0.44],
    ];
    shape(p, 'mustard', f, neck, 0.7, 1.1);
    // Head: a wedge, with an ear and an eye.
    const head: UPt[] = [
      [0.700, 0.344 + ny], [0.770, 0.312 + ny], [0.822, 0.328 + ny],
      [0.812, 0.360 + ny], [0.742, 0.374 + ny], [0.688, 0.369 + ny],
    ];
    shape(p, 'mustard', f, head, 0.76, 1.1);
    disc(p, 'navy', f, 0.742, 0.340 + ny, 0.010, 0.85, 0.8);
    disc(p, 'navy', f, 0.820, 0.336 + ny, 0.006, 0.8, 0);
    shape(p, 'mustard', f, [
      [0.706, 0.340 + ny], [0.690, 0.296 + ny], [0.716, 0.290 + ny], [0.726, 0.332 + ny],
    ], 0.62, 0.8);
    // Antlers, tined, because a plate of a species has to show the tines.
    for (const side of [0, 1]) {
      const o = side * 0.022;
      const base: UPt = [0.706 + o, 0.336 + ny];
      line(p, f, [base, [0.700 + o, 0.276 + ny], [0.722 + o, 0.222 + ny]], 1.0);
      line(p, f, [[0.702 + o, 0.296 + ny], [0.656 + o, 0.260 + ny]], 0.75);
      line(p, f, [[0.712 + o, 0.256 + ny], [0.678 + o, 0.210 + ny]], 0.75);
      line(p, f, [[0.722 + o, 0.222 + ny], [0.752 + o, 0.190 + ny]], 0.75);
    }
    // Legs: thigh, cannon, hoof — with a joint you can see.
    const leg = (u: number, back: boolean, phase: number) => {
      const k = sway(t, 0.8, 0.006, phase);
      const kneeU = u + (back ? -0.022 : 0.018);
      const hoofU = kneeU + (back ? 0.03 : -0.014) + k;
      line(p, f, [[u, 0.60], [kneeU, 0.715]], 1.5);
      line(p, f, [[kneeU, 0.715], [hoofU, 0.845]], 1.2);
      line(p, f, [[hoofU, 0.845], [hoofU + 0.014, 0.862]], 1.6);
    };
    leg(0.315, true, 0);
    leg(0.355, true, 0.8);
    leg(0.605, false, 1.6);
    leg(0.645, false, 2.4);
    // A short tail, and the ground it stands on.
    line(p, f, [[0.255, 0.49], [0.225, 0.52], [0.232, 0.565]], 1);
    stipple(p, f, [[0.20, 0.858], [0.76, 0.858], [0.78, 0.885], [0.18, 0.885]], 300, 22, 0.9);
    label(p, f, 'Cervus aureus', 0.18, 0.935, 0.034);
    label(p, f, 'after the manner of nothing living', 0.18, 0.966, 0.021, 'caps');
  },
};

// ────────────────────────────────────────────────────────── the ashoka

const ashoka: Plate = {
  id: 'ashoka',
  title: 'The Tree',
  caption: 'Saraca asoca. Ten months were spent under one of these.',
  draw: (p, f, t) => {
    // A cut branch laid across the plate on the diagonal, which is how a
    // specimen is mounted — a plant drawn growing straight up is a garden
    // catalogue, not a herbarium sheet.
    const stem: UPt[] = [[0.16, 0.86], [0.34, 0.70], [0.52, 0.52], [0.66, 0.34], [0.74, 0.22]];
    const thick: UPt[] = [[0.185, 0.875], [0.365, 0.715], [0.545, 0.535], [0.68, 0.355], [0.755, 0.235]];
    shape(p, 'brick', f, [...stem, ...thick.reverse()], 0.62, 1);
    const leaf = (u: number, v: number, ang: number, s: number, ph: number) => {
      const d = sway(t, 0.85, 0.02, ph);
      const a = ang + d;
      const tip: UPt = [u + Math.cos(a) * s, v + Math.sin(a) * s];
      const w = s * 0.26;
      const pts: UPt[] = [
        [u, v],
        [u + Math.cos(a - 0.42) * s * 0.55, v + Math.sin(a - 0.42) * s * 0.55],
        tip,
        [u + Math.cos(a + 0.42) * s * 0.55, v + Math.sin(a + 0.42) * s * 0.55],
      ];
      shape(p, 'teal', f, pts, 0.54, 0.8);
      line(p, f, [[u, v], tip], 0.5, false, false);
      void w;
    };
    // Leaves in opposite pairs down the branch, getting smaller toward the tip.
    for (let i = 0; i < 7; i++) {
      const k = i / 6;
      const u = 0.20 + k * 0.50;
      const v = 0.82 - k * 0.56;
      const s = 0.20 - k * 0.075;
      leaf(u, v, -0.35 + Math.PI * 0.5, s, i * 0.6);
      leaf(u + 0.012, v - 0.012, -0.35 - Math.PI * 0.5, s, i * 0.6 + 1.9);
    }
    // The corymb at the tip: a dome of small trumpets, orange going red.
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2;
      const rr = 0.038 + (i % 3) * 0.016;
      const d = sway(t, 1.2, 0.0025, i);
      disc(p, i % 3 === 0 ? 'brick' : 'rose', f,
        0.775 + Math.cos(a) * rr, 0.185 + Math.sin(a) * rr * 0.85 + d, 0.017, 0.76, 0.7);
    }
    disc(p, 'mustard', f, 0.775, 0.185, 0.024, 0.85, 0.7);
    // One flower enlarged in the corner, as a plate always has.
    disc(p, null, f, 0.22, 0.24, 0.10, 0, 0.7);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 - Math.PI / 2;
      shape(p, 'rose', f, [
        [0.22, 0.24],
        [0.22 + Math.cos(a - 0.3) * 0.075, 0.24 + Math.sin(a - 0.3) * 0.075],
        [0.22 + Math.cos(a) * 0.092, 0.24 + Math.sin(a) * 0.092],
        [0.22 + Math.cos(a + 0.3) * 0.075, 0.24 + Math.sin(a + 0.3) * 0.075],
      ], 0.62, 0.7);
    }
    disc(p, 'mustard', f, 0.22, 0.24, 0.018, 0.85, 0.7);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      line(p, f, [[0.22, 0.24], [0.22 + Math.cos(a) * 0.055, 0.24 + Math.sin(a) * 0.055]], 0.5, false, false);
    }
    label(p, f, 'a', 0.22, 0.365, 0.024, 'caps', 'center');
    leader(p, f, [0.52, 0.16], [0.745, 0.175]);
    label(p, f, 'corymb, orange turning red', 0.51, 0.163, 0.023, 'italic', 'right');
    leader(p, f, [0.62, 0.78], [0.44, 0.70]);
    label(p, f, 'leaves in opposite pairs', 0.63, 0.783, 0.023);
    label(p, f, 'Saraca asoca', 0.10, 0.945, 0.034);
    label(p, f, 'the tree called without-sorrow', 0.10, 0.975, 0.021, 'caps');
  },
};

// ─────────────────────────────────────────────────────────── the road

const road: Plate = {
  id: 'road',
  title: 'The Road South',
  caption: 'Ayodhya to the sea. Fourteen years, most of it on foot.',
  draw: (p, f) => {
    wash(p, 'mustard', f, [[0.08, 0.10], [0.92, 0.10], [0.92, 0.90], [0.08, 0.90]], 0.16, false);
    line(p, f, [[0.08, 0.10], [0.92, 0.10], [0.92, 0.90], [0.08, 0.90]], 1, true, false);
    // Rivers, which is what an old map is mostly made of.
    for (const [a, b, c] of [[0.16, 0.30, 0.52], [0.40, 0.48, 0.74]] as const) {
      line(p, f, [[a, 0.12], [a + 0.06, 0.28], [b, 0.44], [b + 0.05, 0.62], [c, 0.88]], 0.9);
    }
    // The coast and the sea at the bottom.
    const sea: UPt[] = [[0.08, 0.72], [0.30, 0.74], [0.52, 0.71], [0.74, 0.75], [0.92, 0.73],
      [0.92, 0.90], [0.08, 0.90]];
    wash(p, 'teal', f, sea, 0.3);
    line(p, f, [[0.08, 0.72], [0.30, 0.74], [0.52, 0.71], [0.74, 0.75], [0.92, 0.73]], 1);
    for (let i = 0; i < 5; i++) {
      line(p, f, [[0.10, 0.78 + i * 0.026], [0.90, 0.765 + i * 0.026]], 0.4);
    }
    // The forest, as a field of little trees.
    for (let i = 0; i < 26; i++) {
      const u = 0.14 + (i % 7) * 0.105 + (i % 3) * 0.012;
      const v = 0.34 + Math.floor(i / 7) * 0.085;
      line(p, f, [[u, v + 0.02], [u, v - 0.012]], 0.6, false, false);
      disc(p, 'teal', f, u, v - 0.024, 0.016, 0.42, 0.6);
    }
    // The road itself, dotted, running from the top to the water.
    p.key((g) => {
      g.save();
      g.setLineDash([f.size * 0.012, f.size * 0.01]);
      g.lineWidth = Math.max(0.7, f.size * 0.0028);
      g.beginPath();
      g.moveTo(f.x + 0.30 * f.size, f.y + 0.14 * f.size);
      g.bezierCurveTo(
        f.x + 0.24 * f.size, f.y + 0.38 * f.size,
        f.x + 0.56 * f.size, f.y + 0.50 * f.size,
        f.x + 0.50 * f.size, f.y + 0.73 * f.size,
      );
      g.stroke();
      g.restore();
    });
    for (const [u, v, n] of [[0.30, 0.14, 'AYODHYA'], [0.25, 0.37, 'CHITRAKUTA'],
      [0.47, 0.52, 'PANCHAVATI'], [0.56, 0.66, 'KISHKINDHA'], [0.50, 0.74, 'THE SHORE']] as const) {
      disc(p, 'brick', f, u, v, 0.008, 0.9, 0.8);
      label(p, f, n, u + 0.02, v + 0.008, 0.02, 'caps');
    }
    label(p, f, 'LANKA', 0.70, 0.865, 0.024, 'caps');
    disc(p, null, f, 0.66, 0.86, 0.022, 0, 0.9);
    label(p, f, 'A Chart of the Way Out', 0.10, 0.075, 0.03);
    label(p, f, 'scale unknown · fourteen years', 0.92, 0.075, 0.019, 'caps', 'right');
  },
};

// ──────────────────────────────────────────────────────── the causeway

const causeway: Plate = {
  id: 'causeway',
  title: 'The Causeway',
  caption: 'Stones on water. In the tellings people like best, each has a name on it.',
  draw: (p, f, t) => {
    wash(p, 'navy', f, [[0.06, 0.34], [0.94, 0.34], [0.94, 0.94], [0.06, 0.94]], 0.34, false);
    for (let i = 0; i < 13; i++) {
      const v = 0.38 + i * 0.043;
      const d = sway(t, 0.8, 0.004, i * 0.5);
      line(p, f, [[0.06, v + d], [0.30, v - 0.006 + d], [0.62, v + 0.007 + d], [0.94, v + d]], 0.45);
    }
    // The stones, getting smaller as they go out.
    for (let i = 0; i < 11; i++) {
      const k = i / 10;
      const u = 0.12 + k * 0.76;
      const v = 0.72 - k * 0.28;
      const s = 0.048 - k * 0.028;
      shape(p, i % 2 ? 'brick' : 'rose', f, [
        [u - s, v], [u - s * 0.6, v - s * 0.55], [u + s * 0.6, v - s * 0.5],
        [u + s, v + s * 0.1], [u + s * 0.5, v + s * 0.55], [u - s * 0.5, v + s * 0.5],
      ], 0.7, 0.9);
      if (i < 7) hatch(p, f, [
        [u - s, v], [u + s, v + s * 0.1], [u + s * 0.5, v + s * 0.55], [u - s * 0.5, v + s * 0.5],
      ], Math.PI / 3, 0.008, 0.5, 30 + i);
    }
    label(p, f, 'Section, looking west', 0.08, 0.28, 0.028);
    dimension(p, f, [0.12, 0.90], [0.88, 0.90], 'one hundred leagues');
    leader(p, f, [0.20, 0.50], [0.30, 0.64]);
    label(p, f, 'the stones float, and nobody explains it', 0.06, 0.485, 0.021);
    label(p, f, 'Fig. V', 0.08, 0.20, 0.024, 'caps');
  },
};

// ─────────────────────────────────────────────────────────── the flame

const flame: Plate = {
  id: 'flame',
  title: 'A Flame',
  caption: 'The unit the last night of the story is counted in.',
  draw: (p, f, t) => {
    const k = 1 + sway(t, 5.3, 0.06) + sway(t, 8.7, 0.03, 1.1);
    const body: UPt[] = [
      [0.50, 0.24 - (k - 1) * 0.2], [0.565, 0.40], [0.575, 0.56], [0.50, 0.66],
      [0.425, 0.56], [0.435, 0.40],
    ];
    wash(p, 'mustard', f, body, 0.62);
    line(p, f, body, 1, true);
    const inner: UPt[] = [
      [0.50, 0.40 - (k - 1) * 0.1], [0.535, 0.49], [0.50, 0.60], [0.465, 0.49],
    ];
    wash(p, 'brick', f, inner, 0.7);
    line(p, f, inner, 0.8, true);
    disc(p, 'navy', f, 0.50, 0.605, 0.018, 0.75, 0.8);
    // The wick and the lamp under it.
    line(p, f, [[0.50, 0.60], [0.50, 0.70]], 1);
    shape(p, 'brick', f, [
      [0.40, 0.70], [0.60, 0.70], [0.635, 0.755], [0.50, 0.785], [0.365, 0.755],
    ], 0.7, 1.1);
    hatch(p, f, [[0.40, 0.70], [0.60, 0.70], [0.635, 0.755], [0.50, 0.785], [0.365, 0.755]],
      -Math.PI / 3, 0.009, 0.6, 41);
    for (const [u, v, txt] of [
      [0.72, 0.34, 'the part that gives no light'],
      [0.72, 0.52, 'the part that does'],
      [0.24, 0.70, 'oil, and a twist of cotton'],
    ] as const) {
      leader(p, f, [u, v], u > 0.5 ? [0.52, v + 0.06] : [0.44, v + 0.02]);
      label(p, f, txt, u + 0.01, v + 0.003, 0.022, 'italic', u > 0.5 ? 'left' : 'right');
    }
    label(p, f, 'Fig. VI · one lamp', 0.08, 0.92, 0.024, 'caps');
  },
};

// ───────────────────────────────────────────────────────────── the arc

const arc: Plate = {
  id: 'arc',
  title: 'The Arc',
  caption: 'An arrow, once loosed, has exactly one path and no opinion about it.',
  draw: (p, f, t) => {
    // Axes.
    line(p, f, [[0.12, 0.84], [0.90, 0.84]], 0.9, false, false);
    line(p, f, [[0.12, 0.84], [0.12, 0.14]], 0.9, false, false);
    for (let i = 1; i <= 7; i++) {
      line(p, f, [[0.12 + i * 0.105, 0.84], [0.12 + i * 0.105, 0.855]], 0.5, false, false);
      line(p, f, [[0.105, 0.84 - i * 0.09], [0.12, 0.84 - i * 0.09]], 0.5, false, false);
    }
    // Three trajectories, the middle one the one that was taken.
    const curve = (h: number, w: number): UPt[] =>
      Array.from({ length: 33 }, (_, i) => {
        const s = i / 32;
        return [0.12 + s * w, 0.84 - Math.sin(s * Math.PI) * h] as UPt;
      });
    line(p, f, curve(0.34, 0.6), 0.5);
    line(p, f, curve(0.62, 0.78), 1.4);
    line(p, f, curve(0.44, 0.86), 0.5);
    // The arrow itself, travelling along it.
    const s = (t * 0.22) % 1.35;
    if (s <= 1) {
      const u = 0.12 + s * 0.78;
      const v = 0.84 - Math.sin(s * Math.PI) * 0.62;
      const ang = Math.atan2(
        -Math.cos(s * Math.PI) * Math.PI * 0.62, 0.78,
      );
      const dx = Math.cos(ang) * 0.05;
      const dy = Math.sin(ang) * 0.05;
      line(p, f, [[u - dx, v - dy], [u + dx, v + dy]], 1.6, false, false);
      disc(p, 'brick', f, u + dx, v + dy, 0.009, 0.9, 0.8);
    }
    for (const [u, v, txt] of [
      [0.36, 0.30, 'the one that was taken'],
      [0.62, 0.62, 'the ones that were not'],
    ] as const) {
      label(p, f, txt, u, v, 0.022);
    }
    label(p, f, 'distance', 0.51, 0.90, 0.02, 'caps', 'center');
    label(p, f, 'Fig. VII', 0.90, 0.20, 0.024, 'caps', 'right');
  },
};

// ────────────────────────────────────────────────────────────── the sea

const moon: Plate = {
  id: 'moon',
  title: 'The Moon Over Lanka',
  caption: 'Seen from a grove, by somebody counting months in it.',
  draw: (p, f, t) => {
    // Night, then the disc: a lunar plate is a grey thing on a black field, and
    // drawing it pink because the palette had a pink in it was simply wrong.
    p.solid('navy', (g) => {
      g.fillStyle = '#111';
      g.fillRect(0, 0, f.size, f.size);
    }, [0, 0, f.size, f.size]);
    for (let i = 0; i < 40; i++) {
      const a = (i * 2.399) % (Math.PI * 2);
      const rr = 0.36 + ((i * 53) % 100) / 100 * 0.14;
      disc(p, 'mustard', f,
        0.5 + Math.cos(a + t * 0.008) * rr, 0.5 + Math.sin(a + t * 0.008) * rr * 0.98,
        0.0035 + (i % 3) * 0.0016, 0.95, 0);
    }
    disc(p, 'rose', f, 0.5, 0.48, 0.315, 0.1, 0);
    disc(p, 'navy', f, 0.5, 0.48, 0.315, 0.08, 1.1);
    // Maria: broad, soft, darker. Craters: rings with a lit rim.
    for (const [u, v, r, d] of [
      [0.445, 0.395, 0.098, 0.2], [0.585, 0.432, 0.062, 0.17],
      [0.470, 0.572, 0.118, 0.19], [0.380, 0.512, 0.046, 0.16],
      [0.606, 0.596, 0.052, 0.17],
    ] as const) {
      disc(p, 'navy', f, u, v, r, d, 0);
      stipple(p, f, [
        [u - r, v - r], [u + r, v - r], [u + r, v + r], [u - r, v + r],
      ], 120, 61 + r * 100, 0.7);
    }
    for (let i = 0; i < 22; i++) {
      const a = (i * 1.77) % (Math.PI * 2);
      const rr = 0.05 + ((i * 37) % 100) / 100 * 0.24;
      const u = 0.5 + Math.cos(a) * rr;
      const v = 0.48 + Math.sin(a) * rr;
      const r = 0.008 + (i % 4) * 0.006;
      disc(p, null, f, u, v, r, 0, 0.6);
      line(p, f, [[u - r * 0.7, v + r * 0.7], [u + r * 0.7, v + r * 0.5]], 0.4, false, false);
    }
    label(p, f, 'the tenth month', 0.5, 0.95, 0.03, 'italic', 'center');
  },
};

// ─────────────────────────────────────────────────────── the sandals

const sandals: Plate = {
  id: 'sandals',
  title: 'The Sandals',
  caption: 'Two pieces of wood. They held a throne for fourteen years.',
  draw: (p, f) => {
    for (const [ox, rot] of [[0.26, -0.05], [0.56, 0.04]] as const) {
      const sole: UPt[] = [
        [ox + 0.00, 0.30], [ox + 0.11, 0.31], [ox + 0.15, 0.42], [ox + 0.14, 0.58],
        [ox + 0.10, 0.70], [ox + 0.04, 0.72], [ox - 0.01, 0.64], [ox - 0.02, 0.46],
      ].map(([u, v]) => [u + (v - 0.5) * rot, v] as UPt);
      shape(p, 'brick', f, sole, 0.62, 1.2);
      hatch(p, f, sole, Math.PI / 2.6, 0.01, 0.55, 51);
      // The post between the toes, which is the whole of the design.
      disc(p, 'mustard', f, ox + 0.065 + (0.36 - 0.5) * rot, 0.38, 0.022, 0.8, 1);
      disc(p, null, f, ox + 0.065 + (0.36 - 0.5) * rot, 0.38, 0.009, 0, 0.7);
    }
    stipple(p, f, [[0.18, 0.74], [0.82, 0.74], [0.84, 0.80], [0.16, 0.80]], 320, 52, 0.85);
    dimension(p, f, [0.20, 0.24], [0.44, 0.24], 'ten inches');
    label(p, f, 'Wooden sandals, a pair', 0.18, 0.88, 0.032);
    label(p, f, 'placed upon the throne in the absence of the king', 0.18, 0.915, 0.021, 'caps');
  },
};

// ───────────────────────────────────────────────────────────── the city

const lamps: Plate = {
  id: 'lamps',
  title: 'The Lamps',
  caption: 'A city puts a light in every window so the road in is lit the whole way.',
  draw: (p, f, t) => {
    wash(p, 'navy', f, [[0.06, 0.06], [0.94, 0.06], [0.94, 0.94], [0.06, 0.94]], 0.62, false);
    // Roofs, as a skyline: the city drawn only by where its windows are.
    const lights: UPt[] = [];
    for (let i = 0; i < 46; i++) {
      const u = 0.10 + ((i * 17) % 40) / 40 * 0.80;
      const v = 0.24 + ((i * 29) % 37) / 37 * 0.58;
      lights.push([u, v]);
    }
    for (const [i, [u, v]] of lights.entries()) {
      const k = 0.6 + 0.4 * Math.abs(Math.sin(t * (1.4 + (i % 5) * 0.3) + i));
      disc(p, 'mustard', f, u, v, 0.010 * k + 0.004, 0.9, 0);
      disc(p, 'mustard', f, u, v, 0.026 * k, 0.16, 0);
    }
    // The road in, unlit stone between two rows of them.
    line(p, f, [[0.42, 0.94], [0.47, 0.60], [0.50, 0.30]], 0.9);
    line(p, f, [[0.62, 0.94], [0.56, 0.60], [0.52, 0.30]], 0.9);
    label(p, f, 'and on the day they said they would', 0.5, 0.155, 0.028, 'italic', 'center');
    label(p, f, 'Fig. XII · the fourteenth year', 0.5, 0.90, 0.021, 'caps', 'center');
  },
};

// ──────────────────────────────────────────────────── the branch, twice

/**
 * The shot the film opens and closes on.
 *
 * Not a plate — a place. Everything else in the film is a diagram of something
 * and this is the only thing in it that is alive: a branch at the end of the
 * day, and one small bird on it that has no idea any of this happened. It has
 * to carry the open and the close, so it gets more care than anything else
 * here.
 */
export function branch(p: Press, f: Field, t: number) {
  const s = sway(t, 0.38, 0.005);

  // Sky, in bands: warm at the horizon, cool at the top.
  wash(p, 'navy', f, [[0, 0], [1, 0], [1, 0.52], [0, 0.52]], 0.2, false);
  wash(p, 'rose', f, [[0, 0.30], [1, 0.30], [1, 1], [0, 1]], 0.26, false);
  wash(p, 'mustard', f, [[0, 0.52], [1, 0.52], [1, 0.86], [0, 0.86]], 0.16, false);
  // Cloud, long and flat, the way they lie at dusk.
  for (let i = 0; i < 4; i++) {
    const v = 0.22 + i * 0.09;
    const d = sway(t, 0.06, 0.02, i * 1.3);
    wash(p, 'rose', f, [
      [0.02 + i * 0.16 + d, v], [0.30 + i * 0.15 + d, v - 0.035],
      [0.58 + i * 0.14 + d, v - 0.01], [0.74 + i * 0.13 + d, v + 0.03],
      [0.34 + i * 0.14 + d, v + 0.055], [0.06 + i * 0.15 + d, v + 0.04],
    ], 0.2 - i * 0.03);
  }

  // The bough: a tapering shape, not a stroked line, so it has a near side and
  // a far side and reads as wood.
  const bough = (off: number): UPt[] => [
    [-0.04, 0.80 + s + off], [0.22, 0.735 + s + off * 0.8], [0.50, 0.672 + s + off * 0.6],
    [0.76, 0.632 + s + off * 0.4], [1.04, 0.598 + s + off * 0.25],
  ];
  shape(p, 'brick', f, [...bough(0), ...bough(0.032).reverse()], 0.72, 1.1);
  // Twigs, and a few late blossoms on them.
  const twigs: [number, number, number][] = [
    [0.10, 0.772, -1], [0.30, 0.718, 1], [0.44, 0.686, -1],
    [0.66, 0.650, 1], [0.88, 0.616, -1],
  ];
  for (const [u, v, d] of twigs) {
    line(p, f, [[u, v + s], [u + d * 0.045, v - 0.075 + s], [u + d * 0.075, v - 0.16 + s]], 1.1);
    line(p, f, [[u + d * 0.05, v - 0.09 + s], [u + d * 0.12, v - 0.125 + s]], 0.7);
    for (const [bu, bv] of [[u + d * 0.075, v - 0.165], [u + d * 0.12, v - 0.13]] as const) {
      disc(p, 'rose', f, bu, bv + s, 0.016, 0.42, 0.6);
      disc(p, 'mustard', f, bu, bv + s, 0.005, 0.8, 0);
    }
  }

  // The bird. Big enough to be a bird.
  const bu = 0.545;
  const bv = 0.648 + s;
  const hop = Math.max(0, Math.sin(t * 0.85)) * 0.006;
  const turn = sway(t, 0.55, 0.008, 1.7);
  const bodyPts: UPt[] = [
    [bu - 0.085, bv - 0.030 - hop], [bu - 0.060, bv - 0.072 - hop],
    [bu - 0.010, bv - 0.092 - hop], [bu + 0.042, bv - 0.080 - hop],
    [bu + 0.066, bv - 0.046 - hop], [bu + 0.060, bv - 0.008 - hop],
    [bu + 0.016, bv + 0.008 - hop], [bu - 0.044, bv + 0.004 - hop],
  ];
  shape(p, 'teal', f, bodyPts, 0.6, 1.1);
  // Wing, folded, a shade darker.
  shape(p, 'navy', f, [
    [bu - 0.048, bv - 0.058 - hop], [bu + 0.004, bv - 0.064 - hop],
    [bu + 0.030, bv - 0.040 - hop], [bu - 0.006, bv - 0.014 - hop],
    [bu - 0.046, bv - 0.024 - hop],
  ], 0.46, 0.8);
  // Head, cap, beak, eye.
  disc(p, 'teal', f, bu + 0.058 + turn, bv - 0.078 - hop, 0.032, 0.5, 1);
  shape(p, 'navy', f, [
    [bu + 0.030 + turn, bv - 0.094 - hop], [bu + 0.062 + turn, bv - 0.112 - hop],
    [bu + 0.088 + turn, bv - 0.094 - hop], [bu + 0.058 + turn, bv - 0.082 - hop],
  ], 0.62, 0.7);
  disc(p, 'navy', f, bu + 0.066 + turn, bv - 0.082 - hop, 0.0075, 0.9, 0);
  line(p, f, [
    [bu + 0.086 + turn, bv - 0.074 - hop], [bu + 0.118 + turn, bv - 0.068 - hop],
    [bu + 0.086 + turn, bv - 0.062 - hop],
  ], 0.9, true, false);
  // Tail, and two feet on the wood.
  shape(p, 'navy', f, [
    [bu - 0.082, bv - 0.034 - hop], [bu - 0.166, bv - 0.020 - hop],
    [bu - 0.162, bv + 0.004 - hop], [bu - 0.078, bv + 0.000 - hop],
  ], 0.55, 0.8);
  for (const d of [-0.016, 0.014]) {
    line(p, f, [[bu + d, bv + 0.004 - hop], [bu + d, bv + 0.018]], 0.8, false, false);
    line(p, f, [[bu + d - 0.008, bv + 0.020], [bu + d + 0.010, bv + 0.020]], 0.7, false, false);
  }
}

/**
 * The frame the lens opens out into.
 *
 * The reference ends by widening from an eyepiece onto an ordinary sky with a
 * moon in it — the instrument is put down and you are outside again. This is
 * that sky.
 */
export function sky(p: Press, f: Field, t: number) {
  wash(p, 'navy', f, [[0, 0], [1, 0], [1, 1], [0, 1]], 0.34, false);
  wash(p, 'navy', f, [[0, 0.46], [1, 0.46], [1, 1], [0, 1]], 0.14, false);
  wash(p, 'rose', f, [[0, 0.62], [1, 0.62], [1, 1], [0, 1]], 0.2, false);
  for (let i = 0; i < 5; i++) {
    const v = 0.40 + i * 0.12;
    const d = sway(t, 0.05, 0.03, i * 1.1);
    wash(p, i % 2 ? 'rose' : 'mustard', f, [
      [-0.05 + i * 0.14 + d, v], [0.26 + i * 0.13 + d, v - 0.05],
      [0.62 + i * 0.12 + d, v - 0.02], [0.82 + i * 0.12 + d, v + 0.04],
      [0.34 + i * 0.13 + d, v + 0.075], [0.00 + i * 0.13 + d, v + 0.05],
    ], 0.26 - i * 0.035);
  }
  /*
    A crescent is a lit disc with an unlit one across it, and the plain way to
    draw one is exactly that: the bright disc, then a disc of the sky over it,
    offset. Punching the second one out with a knockout instead left a bare
    rectangle of paper hanging in the sky, because a knockout takes ink off
    every plate and the sky is made of ink.
  */
  disc(p, 'mustard', f, 0.68, 0.24, 0.072, 0.7, 0);
  disc(p, 'navy', f, 0.648, 0.218, 0.068, 0.34, 0);
  for (let i = 0; i < 18; i++) {
    const u = ((i * 37) % 100) / 100;
    const v = ((i * 61) % 100) / 100 * 0.42;
    disc(p, 'mustard', f, u, v, 0.0035, 0.8, 0);
  }
}

export const PLATES: Plate[] = [bow, deer, ashoka, road, causeway, flame, arc, moon, sandals, lamps];
