import { contour, type Pad, type Pt } from './pad';
import { word } from './letters';
import { paintFace, type Beard, type Cut, type Extra, type FaceLook,
  type FaceRecipe } from './face';
import type { Ink } from './palette';

/**
 * Movie stars.
 *
 * ### On not using real people
 *
 * These are not portraits of anybody, and they are deliberately not labelled as
 * if they were. Two reasons, and the second is the one that decided it.
 *
 * A living public figure's name and face together are the exact thing publicity
 * rights exist to cover, and a website that generates and publishes them is not
 * a commentary or a parody, it is a use.
 *
 * But more simply: this engine draws faces out of twenty haircuts, five beards
 * and a flat fill. It cannot produce a likeness of a specific person and does
 * not try to. Putting a real name under an arbitrary output would be a false
 * attribution of a face that does not resemble them — which is worse than
 * useless, because the whole appeal of a star portrait is recognition, and this
 * would be recognition of nothing.
 *
 * What *is* here is the thing that actually reads as stardom, which turns out
 * not to be the face at all:
 *
 * ### Stardom is staging
 *
 * A plain portrait and a star portrait can be the same head. What separates
 * them is **a backdrop, a light, and a name in lettering underneath** — the
 * apparatus of publicity rather than anything about the person. Put a disc of
 * flat colour behind an ordinary face and letter a film title under it and the
 * face becomes a star; take those away from an actual star and you have a
 * passport photograph. That is the study.
 *
 * Two idioms, because the apparatus differs. The **silver screen** set is
 * black-tie, sunglasses, spotlight and a title card. The **Bombay** set is the
 * hand-painted cinema hoarding — a tradition of enormous brush-made billboards
 * with flat colour, hard shadows and lettering across the bottom, which is a
 * genuinely close relative of the flat-brush style this whole effect is drawn
 * in. Jhumkas, a bindi, a pallu over the crown, marigold, and the title in two
 * scripts' worth of energy if not two scripts.
 */

export type Backdrop = 'none' | 'spot' | 'halo' | 'block' | 'rays' | 'marquee' | 'bands';
export type Idiom = 'silver' | 'bombay';

export const BACKDROPS: Backdrop[] = ['none', 'spot', 'spot', 'halo', 'block', 'rays',
  'marquee', 'bands'];

/** Accessories that belong to each tradition's publicity, not to a person. */
const DRESS: Record<Idiom, Extra[]> = {
  silver: ['shades', 'shades', 'bowtie', 'lapels', 'necklace', 'collar', 'hat', 'tiara',
    'studs', 'chain'],
  bombay: ['jhumka', 'jhumka', 'bindi', 'nosering', 'pallu', 'necklace', 'flower', 'hoops',
    'shades', 'chain'],
};

const CUTS_BY: Record<Idiom, Cut[]> = {
  silver: ['wave', 'slick', 'pompadour', 'bob', 'sidepart', 'undercut', 'up', 'curls', 'crop',
    'long', 'afro', 'locs', 'shaved', 'topknot'],
  bombay: ['long', 'plait', 'bun', 'wave', 'slick', 'pompadour', 'up', 'veil', 'turban',
    'curls', 'sidepart', 'topknot', 'fringe'],
};

/**
 * Titles.
 *
 * Built in two halves and joined, which does two things: it gives a marquee the
 * right *length* — real film titles are longer than one word and shorter than a
 * sentence — and it puts the odds of landing on an actual film's title
 * somewhere near nothing. Neither half is a title on its own.
 */
const HEAD: Record<Idiom, string[]> = {
  silver: ['THE LAST', 'THE LONG', 'THE QUIET', 'A DARK', 'THE GOLDEN', 'THE THIRD',
    'THE FINAL', 'THE BROKEN', 'THE WILD', 'ONE MORE', 'NO MORE', 'THE SLOW', 'ANOTHER',
    'THE HONEST', 'THE COLD'],
  bombay: ['MONSOON', 'SAPNON KI', 'RAAT KI', 'DIL KE', 'AAKHRI', 'PEHLA', 'SAATVAN',
    'CHOTI SI', 'BADI SI', 'ADHOORI', 'PURANI', 'NAYI', 'TEESRI', 'LAMBI'],
};

const TAIL: Record<Idiom, string[]> = {
  silver: ['TRAIN', 'ROOM', 'CITY', 'SUMMER', 'HARBOUR', 'HOUR', 'LETTER', 'PROMISE',
    'SIGNAL', 'COAST', 'CROSSING', 'WINTER', 'GARDEN', 'BRIDGE', 'STATION', 'TUESDAY'],
  bombay: ['EXPRESS', 'KAHANI', 'SAFAR', 'AASMAAN', 'BAARISH', 'RASTA', 'CHITHI', 'MELA',
    'GALI', 'SHEHER', 'PARCHHAI', 'DASTAAN', 'MULAQAT', 'JUGNU'],
};

/** What they are billed as. Never who they are. */
const BILLING = ['TOP BILLING', 'INTRODUCING', 'AND', 'WITH', 'SPECIAL APPEARANCE',
  'IN HER FIRST PICTURE', 'IN HIS FIRST PICTURE', 'GUEST APPEARANCE', 'SECOND LEAD',
  'THE VILLAIN', 'PLAYBACK', 'THE DOUBLE', 'ALSO STARRING', 'A NEW FACE'];

export const ROLES = ['Top billing', 'The second lead', 'The one on the poster', 'Introducing',
  'Special appearance', 'The villain', 'The villain’s sister', 'Playing the doctor',
  'The one who leaves', 'The stunt double', 'Playback', 'A new face', 'The character actor',
  'Guest appearance', 'Third on the bill', 'The one who stays', 'Screen test', 'Wardrobe test'];

export interface StarRecipe {
  idiom: Idiom;
  backdrop: Backdrop;
  title: string;
  billing: string;
  /** How much of the card the staging takes; the face gets the rest. */
  plate: boolean;
}

const pick = <T,>(list: T[], r: () => number) => list[Math.floor(r() * list.length) % list.length];

/** The face a star gets: the same grammar, dressed out of the tradition's box. */
export function starFace(r: () => number, idiom: Idiom, skin: string, lip: string,
  beards: Beard[]): FaceRecipe {
  const build = r() < 0.5 ? 0.55 + r() * 0.45 : r() * 0.4;
  return {
    cut: pick(CUTS_BY[idiom], r),
    extra: pick(DRESS[idiom], r),
    beard: build > 0.5 ? pick(beards, r) : 'none',
    build,
    skin,
    lip,
    jaw: 0.72 + r() * 0.2,
    crown: 1 + r() * 0.14,
    long: 1.02 + r() * 0.16,
    // A star portrait leans further than a plain one. It is a photograph taken
    // by somebody who was told to make them look like a star.
    tilt: (r() - 0.5) * 32,
    turn: (r() - 0.5) * 1.6,
    eyes: pick(['open', 'open', 'side', 'wide', 'shut'] as const, r),
    brows: r(),
    smile: r(),
  };
}

export function makeStar(r: () => number): StarRecipe {
  const idiom: Idiom = r() < 0.5 ? 'bombay' : 'silver';
  return {
    idiom,
    backdrop: pick(BACKDROPS, r),
    title: `${pick(HEAD[idiom], r)} ${pick(TAIL[idiom], r)}`,
    billing: pick(BILLING, r),
    plate: r() < 0.78,
  };
}

/**
 * The backdrop.
 *
 * Flat, geometric, and behind everything. It is the cheapest mark in the whole
 * study and by a distance the one that changes the reading of the card most —
 * a head on white is a drawing of a person, and the identical head on a disc of
 * orange is a poster.
 */
function backdrop(pad: Pad, star: StarRecipe, inks: Ink[], cx: number, cy: number, size: number) {
  const r = pad.r;
  const ink = () => inks[Math.floor(r() * inks.length) % inks.length].hex;
  switch (star.backdrop) {
    case 'spot':
      pad.blob([cx, cy], size * 1.05, size * 1.05, 0, ink(), { alpha: 0.9 });
      break;
    case 'halo': {
      const c = ink();
      for (let lap = 0; lap < 2; lap++) {
        const ring: Pt[] = [];
        const rad = size * (0.95 + lap * 0.16);
        for (let i = 0; i < 26; i++) {
          const a = (i / 26) * Math.PI * 2;
          ring.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad * (pad.w / pad.h)]);
        }
        contour(pad, ring, [c, ink()], { laps: 1, arc: 0.14, gap: 0.5, offset: 0.01,
          width: 0.016 });
      }
      break;
    }
    case 'block':
      pad.shape([[0.06, 0.05], [0.94, 0.05], [0.94, 0.58], [0.06, 0.58]], ink(),
        { alpha: 0.92, sharp: true });
      break;
    case 'rays': {
      const c = ink();
      for (let i = 0; i < 18; i++) {
        const a = (i / 18) * Math.PI * 2 + r() * 0.1;
        pad.line([[cx + Math.cos(a) * size * 0.8, cy + Math.sin(a) * size * 0.8 * (pad.w / pad.h)],
          [cx + Math.cos(a) * size * 2.4, cy + Math.sin(a) * size * 2.4 * (pad.w / pad.h)]],
          i % 3 === 0 ? ink() : c, { width: 0.012, alpha: 0.85 });
      }
      break;
    }
    case 'marquee': {
      // Bulbs round the edge. Cinema frontage, drawn as the only thing anybody
      // remembers about cinema frontage.
      const c = ink();
      const n = 26;
      for (let i = 0; i < n; i++) {
        const t = i / n;
        const p: Pt = t < 0.25
          ? [0.06 + (t / 0.25) * 0.88, 0.05]
          : t < 0.5
            ? [0.94, 0.05 + ((t - 0.25) / 0.25) * 0.9]
            : t < 0.75
              ? [0.94 - ((t - 0.5) / 0.25) * 0.88, 0.95]
              : [0.06, 0.95 - ((t - 0.75) / 0.25) * 0.9];
        pad.blob(p, 0.012, 0.012, 0, i % 4 === 0 ? ink() : c, { alpha: 0.95 });
      }
      break;
    }
    case 'bands': {
      const c1 = ink();
      const c2 = ink();
      for (let i = 0; i < 5; i++) {
        pad.shape([[0.0, 0.1 + i * 0.15], [1.0, 0.1 + i * 0.15], [1.0, 0.17 + i * 0.15],
          [0.0, 0.17 + i * 0.15]], i % 2 ? c1 : c2, { alpha: 0.8, sharp: true });
      }
      break;
    }
    default:
      break;
  }
}

/**
 * The nameplate.
 *
 * Lettering across the bottom, on a bar, with a smaller line of billing above
 * it. This is the single element that turns the card into publicity, and it has
 * to sit *on* the picture rather than under it — a caption in a margin is a
 * museum label, and a museum label is the opposite of a poster.
 */
const lum = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
};

function plate(pad: Pad, star: StarRecipe, inks: Ink[]) {
  const dark = inks.find((i) => i.dark) ?? inks[0];
  // The billing line is four times smaller than the title and has to be read
  // at a glance, so it takes the ink furthest from the bar in brightness
  // rather than a random one. Chosen at random it lands on the bar's own
  // neighbour about a third of the time and simply is not there.
  const bar = lum(dark.hex);
  const legible = inks.reduce((best, i) =>
    Math.abs(lum(i.hex) - bar) > Math.abs(lum(best.hex) - bar) ? i : best, inks[0]);
  const y = 0.828;
  // Full bleed. A bar with margins either side wants the title to fit inside
  // the margins as well, and a title that overruns its bar is the one thing a
  // poster may never do.
  pad.shape([[0, y - 0.048], [1, y - 0.058], [1, y + 0.092], [0, y + 0.086]],
    dark.hex, { alpha: 0.95, sharp: true });

  // Fitted, and then clipped anyway. Every letter leans by a random fraction of
  // its own width and the stroke has thickness, so the advance is a *floor* on
  // the real extent rather than the extent — which is why the first two goes at
  // this arithmetic both ran off the card. The clip makes it structural instead
  // of arithmetical, and the budget keeps the clip from ever biting.
  const per = 0.62 * (pad.h / pad.w) * 1.42;
  const fit = (text: string, cap: number, room: number) =>
    Math.min(cap, room / (text.length * per));

  // The clip has to clear the tallest a letter can get — cap height times the
  // per-letter height jitter — or it trims the feet off the title instead of
  // catching an overrun.
  pad.clipRect(0.02, y - 0.062, 0.98, y + 0.104, () => {
    const size = fit(star.title, 0.048, 0.7);
    const w = star.title.length * size * per;
    word(pad, star.title, [0.5 - w / 2, y + 0.032], size, '#ffffff', { width: 0.0115 });

    const bSize = fit(star.billing, 0.023, 0.52);
    const bw = star.billing.length * bSize * per;
    word(pad, star.billing, [0.5 - bw / 2, y - 0.02], bSize, legible.hex, { width: 0.008 });
  });
}

export function paintStar(pad: Pad, star: StarRecipe, face: FaceRecipe, look: FaceLook,
  box: { cx: number; cy: number; w: number; h: number }) {
  backdrop(pad, star, look.inks, box.cx, box.cy + box.h * 0.15, box.h * 2.1);
  paintFace(pad, face, look, box);
  if (star.plate) plate(pad, star, look.inks);
}
