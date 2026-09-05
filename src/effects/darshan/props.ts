import type { Palette } from './palette';
import { disc, Light, poly, blob, type Frame } from './ink';
import type { Pt } from './rig';

/**
 * The attributes.
 *
 * In this iconography an object in the hand is not a prop, it is the name of
 * the god written down — a conch, a discus, a mace and a lotus in four hands
 * *is* Vishnu, and swapping any one of them makes it somebody else. So these
 * are drawn to be read rather than to be admired: a silhouette that survives
 * at forty pixels, in two tones, from across a room.
 *
 * Each is drawn along a direction, usually the forearm continued, so an object
 * follows the hand that holds it without the pose needing to know what it is
 * holding.
 */

export type PropId =
  | 'flute' | 'bow' | 'mace' | 'trident' | 'chakra' | 'conch' | 'lotus'
  | 'sword' | 'damaru' | 'veena' | 'noose' | 'goad' | 'modak' | 'vajra'
  | 'mountain' | 'book' | 'pot' | 'spear' | 'axe' | 'skull' | 'shield' | 'none';

const rot = (p: Pt, d: Pt, n: Pt, a: number, b: number): Pt => [p[0] + d[0] * a + n[0] * b, p[1] + d[1] * a + n[1] * b];

/**
 * Draw one attribute.
 *
 * `at` is the hand, `dir` the direction the object points away from it, and
 * `k` the figure height, so every measurement below is a fraction of the god
 * rather than of the canvas.
 */
export function prop(
  f: Frame, L: Light, pal: Palette, id: PropId, at: Pt, dir: Pt, k: number, seed: number,
  /** The hand is up at the face, which changes how some things are held. */
  raised = false,
) {
  const len = Math.hypot(dir[0], dir[1]) || 1;
  const d: Pt = [dir[0] / len, dir[1] / len];
  const n: Pt = [-d[1], d[0]];
  const P = (a: number, b: number) => rot(at, d, n, a * k, b * k);
  const shaft = (from: number, to: number, w: number, colour: string) =>
    poly(f, [P(from, -w), P(to, -w), P(to, w), P(from, w)], colour);
  const wood = pal.ink;
  const metal = pal.steel;

  switch (id) {
    case 'flute': {
      // At the lip it lies across the face; at the side it is carried along
      // the hand. The same object drawn across the body in every pose comes
      // out as a broom handle through the hips.
      const a: Pt = raised ? [at[0] - 0.06 * k, at[1] - 0.03 * k] : P(-0.05, 0);
      const b: Pt = raised ? [at[0] + 0.2 * k, at[1] + 0.03 * k] : P(0.27, 0.01);
      poly(f, [
        [a[0], a[1] - 0.011 * k], [b[0], b[1] - 0.011 * k],
        [b[0], b[1] + 0.011 * k], [a[0], a[1] + 0.011 * k],
      ], '#c8a05a');
      for (let i = 1; i <= 6; i++) {
        const t = 0.28 + i * 0.1;
        disc(f, [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], 0.006 * k, 0.006 * k, 0, '#6b4a1e', 0.85);
      }
      break;
    }
    case 'bow': {
      // A recurve, drawn as an arc of the string and a thicker arc of the limb.
      const arc: Pt[] = [];
      const inner: Pt[] = [];
      for (let i = 0; i <= 14; i++) {
        const t = (i / 14) * 2 - 1;
        const bow = (1 - t * t) * 0.16;
        arc.push(P(bow + 0.026, t * 0.32));
        inner.unshift(P(bow + 0.004, t * 0.32));
      }
      poly(f, [...arc, ...inner], wood);
      poly(f, [P(0.008, -0.32), P(0.008, 0.32), P(-0.002, 0.32), P(-0.002, -0.32)], '#e2d8bd');
      disc(f, P(0.09, 0), 0.018 * k, 0.03 * k, 0, pal.gold);
      break;
    }
    case 'spear':
    case 'trident': {
      shaft(-0.3, 0.42, 0.011, wood);
      if (id === 'spear') {
        poly(f, [P(0.42, -0.03), P(0.6, 0), P(0.42, 0.03)], metal);
      } else {
        // Three prongs, the middle one longer. The silhouette is the god.
        poly(f, [P(0.4, -0.008), P(0.62, 0), P(0.4, 0.008)], metal);
        for (const s of [-1, 1]) {
          poly(f, [
            P(0.4, s * 0.008), P(0.42, s * 0.07), P(0.54, s * 0.076),
            P(0.57, s * 0.058), P(0.45, s * 0.048), P(0.43, s * 0.008),
          ], metal);
        }
        disc(f, P(0.38, 0), 0.02 * k, 0.02 * k, 0, pal.gold);
      }
      break;
    }
    case 'mace': {
      shaft(-0.04, 0.24, 0.013, wood);
      // The head: a fluted drum, which is what a gada actually is.
      const head = P(0.33, 0);
      disc(f, head, 0.072 * k, 0.082 * k, 0, pal.gold);
      L.shadeDisc(f, head, 0.062 * k, 0.072 * k, 0, { light: pal.gold, dark: '#8a641b' });
      for (const t of [-0.045, 0, 0.045]) poly(f, [P(0.27, t - 0.006), P(0.41, t - 0.006), P(0.41, t + 0.006), P(0.27, t + 0.006)], '#7d5a16', 0.5);
      disc(f, P(0.43, 0), 0.02 * k, 0.02 * k, 0, pal.gold);
      break;
    }
    case 'chakra': {
      // The discus, as a toothed ring seen face on.
      const c = P(0.15, 0);
      const R = 0.11 * k;
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2;
        poly(f, [
          [c[0] + Math.cos(a) * R * 0.92, c[1] + Math.sin(a) * R * 0.92],
          [c[0] + Math.cos(a + 0.14) * R * 1.3, c[1] + Math.sin(a + 0.14) * R * 1.3],
          [c[0] + Math.cos(a + 0.3) * R * 0.92, c[1] + Math.sin(a + 0.3) * R * 0.92],
        ], pal.gold);
      }
      disc(f, c, R, R, 0, pal.gold);
      disc(f, c, R * 0.62, R * 0.62, 0, pal.paper);
      disc(f, c, R * 0.3, R * 0.3, 0, pal.gold);
      break;
    }
    case 'conch': {
      // A shankha: a spiral turning one way, with a lipped mouth.
      const c = P(0.13, 0);
      blob(f, [P(0.0, -0.05), P(0.16, -0.09), P(0.28, -0.02), P(0.2, 0.08), P(0.04, 0.07)], '#eae2cd');
      L.clipTo(f, [P(0.0, -0.05), P(0.16, -0.09), P(0.28, -0.02), P(0.2, 0.08), P(0.04, 0.07)], () => poly(f, L.shadow, '#b6ab90'));
      for (let i = 0; i < 4; i++) {
        const t = i / 4;
        disc(f, [c[0] + Math.cos(t * 5) * 0.03 * k, c[1] + Math.sin(t * 5) * 0.02 * k], 0.016 * k * (1 - t * 0.4), 0.01 * k, t * 1.4, '#c4b99c', 0.7);
      }
      break;
    }
    case 'lotus': {
      shaft(-0.02, 0.26, 0.008, '#4f7a45');
      const c = P(0.3, 0);
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * Math.PI * 2;
        poly(f, [
          [c[0], c[1]],
          [c[0] + Math.cos(a - 0.2) * 0.05 * k, c[1] + Math.sin(a - 0.2) * 0.05 * k],
          [c[0] + Math.cos(a) * 0.095 * k, c[1] + Math.sin(a) * 0.095 * k],
          [c[0] + Math.cos(a + 0.2) * 0.05 * k, c[1] + Math.sin(a + 0.2) * 0.05 * k],
        ], i % 2 ? '#e8a0a8' : '#d9838e');
      }
      disc(f, c, 0.028 * k, 0.028 * k, 0, pal.gold);
      break;
    }
    case 'sword': {
      poly(f, [P(0.0, -0.016), P(0.06, -0.02), P(0.06, 0.02), P(0.0, 0.016)], pal.gold);
      poly(f, [P(0.02, -0.05), P(0.02, 0.05), P(0.05, 0.05), P(0.05, -0.05)], pal.gold);
      // A khanda: broad, straight-backed, widening towards the tip.
      poly(f, [P(0.06, -0.022), P(0.34, -0.04), P(0.44, -0.014), P(0.44, 0.016), P(0.06, 0.028)], metal);
      break;
    }
    case 'axe': {
      shaft(-0.06, 0.26, 0.012, wood);
      poly(f, [P(0.2, -0.02), P(0.4, -0.11), P(0.45, 0.0), P(0.4, 0.09), P(0.2, 0.02)], metal);
      break;
    }
    case 'damaru': {
      // The hourglass drum, and the cord with its knot.
      const c = P(0.1, 0);
      poly(f, [P(0.02, -0.06), P(0.06, -0.014), P(0.14, -0.014), P(0.18, -0.06), P(0.18, 0.06), P(0.14, 0.014), P(0.06, 0.014), P(0.02, 0.06)], '#c8a05a');
      poly(f, [P(0.02, -0.062), P(0.03, -0.062), P(0.03, 0.062), P(0.02, 0.062)], '#e6dcc2');
      disc(f, [c[0] + 0.06 * k, c[1] + 0.06 * k], 0.014 * k, 0.014 * k, 0, wood);
      break;
    }
    case 'veena': {
      shaft(-0.24, 0.4, 0.014, '#a8763c');
      const g = P(0.46, 0);
      L.shadeDisc(f, g, 0.1 * k, 0.11 * k, 0, { light: '#c08a48', dark: '#7a5220' });
      disc(f, g, 0.032 * k, 0.032 * k, 0, wood);
      L.shadeDisc(f, P(-0.3, 0), 0.058 * k, 0.064 * k, 0, { light: '#c08a48', dark: '#7a5220' });
      for (let i = 0; i < 4; i++) shaft(-0.22, 0.38, 0.0022, '#efe6cc');
      break;
    }
    case 'noose': {
      const c = P(0.18, 0);
      for (let i = 0; i < 3; i++) disc(f, c, (0.09 - i * 0.012) * k, (0.06 - i * 0.008) * k, 0.3, i % 2 ? pal.paper : pal.accent, 0.9);
      shaft(-0.02, 0.1, 0.008, pal.accent);
      break;
    }
    case 'goad': {
      shaft(-0.04, 0.24, 0.011, wood);
      poly(f, [P(0.24, -0.01), P(0.36, -0.01), P(0.36, -0.09), P(0.32, -0.09), P(0.32, -0.05), P(0.24, 0.012)], metal);
      break;
    }
    case 'modak': {
      const c = P(0.06, 0);
      poly(f, [
        [c[0], c[1] - 0.07 * k], [c[0] + 0.05 * k, c[1] + 0.03 * k],
        [c[0], c[1] + 0.05 * k], [c[0] - 0.05 * k, c[1] + 0.03 * k],
      ], '#e6c98a');
      disc(f, [c[0], c[1] - 0.07 * k], 0.012 * k, 0.012 * k, 0, pal.gold);
      break;
    }
    case 'vajra': {
      shaft(-0.16, 0.16, 0.014, pal.gold);
      for (const s of [-1, 1]) {
        for (const t of [-1, 0, 1]) {
          poly(f, [P(s * 0.16, t * 0.03), P(s * 0.3, t * 0.045), P(s * 0.34, 0), P(s * 0.3, t * 0.02)], pal.gold);
        }
      }
      break;
    }
    case 'mountain': {
      // Dronagiri, carried in one hand: the whole hill, because he could not
      // tell which herb was wanted.
      const c = P(0.24, 0);
      poly(f, [
        [c[0] - 0.19 * k, c[1] + 0.1 * k], [c[0] - 0.09 * k, c[1] - 0.11 * k],
        [c[0] - 0.01 * k, c[1] - 0.03 * k], [c[0] + 0.08 * k, c[1] - 0.17 * k],
        [c[0] + 0.2 * k, c[1] + 0.1 * k],
      ], '#7c7f76');
      L.clipTo(f, [
        [c[0] - 0.19 * k, c[1] + 0.1 * k], [c[0] - 0.09 * k, c[1] - 0.11 * k],
        [c[0] - 0.01 * k, c[1] - 0.03 * k], [c[0] + 0.08 * k, c[1] - 0.17 * k],
        [c[0] + 0.2 * k, c[1] + 0.1 * k],
      ], () => poly(f, L.shadow, '#4a4d47'));
      poly(f, [[c[0] + 0.02 * k, c[1] - 0.1 * k], [c[0] + 0.08 * k, c[1] - 0.17 * k], [c[0] + 0.13 * k, c[1] - 0.08 * k]], '#d8d3c0', 0.8);
      for (let i = 0; i < 4; i++) {
        disc(f, [c[0] + (i - 1.6) * 0.06 * k, c[1] - 0.02 * k], 0.022 * k, 0.026 * k, 0, '#3f6141', 0.85);
      }
      break;
    }
    case 'book': {
      const c = P(0.08, 0);
      poly(f, [[c[0] - 0.1 * k, c[1] - 0.05 * k], [c[0] + 0.1 * k, c[1] - 0.06 * k], [c[0] + 0.1 * k, c[1] + 0.03 * k], [c[0] - 0.1 * k, c[1] + 0.04 * k]], '#e2d6b4');
      for (let i = 1; i < 4; i++) poly(f, [[c[0] - 0.08 * k, c[1] - 0.05 * k + i * 0.02 * k], [c[0] + 0.08 * k, c[1] - 0.055 * k + i * 0.02 * k], [c[0] + 0.08 * k, c[1] - 0.048 * k + i * 0.02 * k], [c[0] - 0.08 * k, c[1] - 0.043 * k + i * 0.02 * k]], '#a89670', 0.7);
      break;
    }
    case 'pot': {
      const c = P(0.12, 0);
      L.shadeBlob(f, [
        [c[0] - 0.07 * k, c[1] - 0.03 * k], [c[0], c[1] - 0.09 * k], [c[0] + 0.07 * k, c[1] - 0.03 * k],
        [c[0] + 0.055 * k, c[1] + 0.08 * k], [c[0] - 0.055 * k, c[1] + 0.08 * k],
      ], { light: pal.gold, dark: '#8a641b' });
      for (let i = 0; i < 5; i++) {
        disc(f, [c[0] + (i - 2) * 0.028 * k, c[1] - 0.1 * k - (i % 2) * 0.02 * k], 0.016 * k, 0.016 * k, 0, pal.gold, 0.9);
      }
      break;
    }
    case 'skull': {
      const c = P(0.14, 0);
      blob(f, [[c[0] - 0.06 * k, c[1] - 0.02 * k], [c[0], c[1] - 0.08 * k], [c[0] + 0.06 * k, c[1] - 0.02 * k], [c[0] + 0.03 * k, c[1] + 0.07 * k], [c[0] - 0.03 * k, c[1] + 0.07 * k]], '#e4dcc6');
      disc(f, [c[0] - 0.025 * k, c[1] - 0.01 * k], 0.016 * k, 0.02 * k, 0, pal.ink);
      disc(f, [c[0] + 0.025 * k, c[1] - 0.01 * k], 0.016 * k, 0.02 * k, 0, pal.ink);
      break;
    }
    case 'shield': {
      const c = P(0.1, 0);
      L.shadeDisc(f, c, 0.11 * k, 0.12 * k, 0, { light: pal.steel, dark: '#7c8384' });
      disc(f, c, 0.03 * k, 0.03 * k, 0, pal.gold);
      break;
    }
    case 'none':
    default:
      break;
  }
  void seed;
}

/**
 * How far each thing reaches beyond the hand.
 *
 * Used to frame the card. Without it the camera fits the *body* and a trident
 * a metre longer than the god runs off both edges — which is what the first
 * contact sheet of Durga looked like.
 */
export const PROP_REACH: Record<PropId, number> = {
  flute: 0.28, bow: 0.34, mace: 0.46, trident: 0.6, chakra: 0.26, conch: 0.28,
  lotus: 0.36, sword: 0.44, damaru: 0.2, veena: 0.5, noose: 0.26, goad: 0.36,
  modak: 0.12, vajra: 0.34, mountain: 0.4, book: 0.18, pot: 0.2, spear: 0.58,
  axe: 0.44, skull: 0.2, shield: 0.22, none: 0,
};

/** A name for the caption, because half the point is knowing what it is. */
export const PROP_NAME: Record<PropId, string> = {
  flute: 'the bansuri',
  bow: 'the bow',
  mace: 'the gada',
  trident: 'the trishula',
  chakra: 'the sudarshana chakra',
  conch: 'the shankha',
  lotus: 'the padma',
  sword: 'the khadga',
  damaru: 'the damaru',
  veena: 'the veena',
  noose: 'the pasha',
  goad: 'the ankusha',
  modak: 'a modak',
  vajra: 'the vajra',
  mountain: 'the mountain',
  book: 'the pustaka',
  pot: 'the kalasha',
  spear: 'the vel',
  axe: 'the parashu',
  skull: 'the kapala',
  shield: 'the shield',
  none: 'nothing at all',
};
