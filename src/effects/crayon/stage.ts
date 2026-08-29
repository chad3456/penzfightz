import type { Sheet, Rgb } from './sheet';
import { drag, inEllipse, inPoly, scrub, wander, type Nib, type Pt } from './nib';

/**
 * The places.
 *
 * A figure in a rectangle is a figure. A figure *placed against something*,
 * with air between them, is a picture — and the difference is almost entirely
 * **staging**: where the person sits in the frame relative to one prop and one
 * horizon, and how much of the page is left doing nothing.
 *
 * So the pieces here are deliberately thin. A bench is a slab, four legs and
 * three slats; a library is four horizontal lines and some ticks. None of them
 * is trying to be a drawing on its own — they are there to give the figure
 * somewhere to be, and the moment they get detailed enough to look at they stop
 * doing that job and start competing for attention with the person.
 *
 * Everything is in **frame coordinates**, 0..1 across and down, so a scene can
 * be composed once and drawn at any size.
 */

export interface Frame {
  sheet: Sheet;
  w: number;
  h: number;
  ink: Rgb;
  col: Rgb;
  r: () => number;
  n: number;
}

export type Piece =
  | 'horizon' | 'bench' | 'tree' | 'lamp' | 'window' | 'door' | 'shelves' | 'table' | 'chair'
  | 'stairs' | 'railing' | 'counter' | 'bed' | 'parapet' | 'sign' | 'rug' | 'moon' | 'rain'
  | 'birds' | 'crowd' | 'pillar' | 'easel';

const px = (f: Frame, x: number, y: number): Pt => [x * f.w, y * f.h];
const P = (f: Frame, pts: [number, number][]): Pt[] => pts.map(([x, y]) => px(f, x, y));

function nib(f: Frame, colour: Rgb, width: number, o: Partial<Nib> = {}): Nib {
  return {
    colour,
    width: width * f.w,
    bite: o.bite ?? 0.92,
    hand: o.hand ?? 0.85,
    fray: o.fray ?? 0.3,
    taper: o.taper,
  };
}

const line = (f: Frame, pts: [number, number][], n: Nib) => drag(f.sheet, P(f, pts), n, f.n++);
/** The same, with the corners left square. Everything built rather than grown. */
const built = (f: Frame, pts: [number, number][], n: Nib) =>
  drag(f.sheet, P(f, pts), n, f.n++, { sharp: true });

function mass(f: Frame, poly: [number, number][], colour: Rgb, bite = 1.05, passes = 3) {
  const page = P(f, poly);
  const xs = page.map((q) => q[0]);
  const ys = page.map((q) => q[1]);
  scrub(
    f.sheet,
    inPoly(page),
    { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) },
    nib(f, colour, 0.006, { bite }),
    f.n++,
    { passes },
  );
}

function disc(f: Frame, x: number, y: number, rx: number, ry: number, colour: Rgb, bite = 1.05) {
  const [cx, cy] = px(f, x, y);
  const a = rx * f.w;
  const b = ry * f.h;
  scrub(
    f.sheet,
    inEllipse(cx, cy, a, b, 0, f.n),
    { x0: cx - a * 2, y0: cy - b * 2, x1: cx + a * 2, y1: cy + b * 2 },
    nib(f, colour, 0.006, { bite }),
    f.n++,
    { passes: 3 },
  );
}

/**
 * Draw one piece of the set.
 *
 * `at` is where it sits: x is the centre, y is the line the figures stand on,
 * and `s` scales the piece. Everything is drawn relative to that, so the same
 * bench works at the front of the frame or small and far back.
 */
export function piece(f: Frame, kind: Piece, at: { x: number; y: number; s: number }) {
  const { x, y, s } = at;
  const wob = wander(f.n++);

  switch (kind) {
    case 'horizon':
      // The single most useful mark in the file: it turns a blank page into a
      // room, and it costs one stroke.
      line(
        f,
        [
          [x - 0.62 * s, y + wob(1) * 0.01],
          [x + 0.66 * s, y + wob(3) * 0.01],
        ],
        nib(f, f.ink, 0.004, { fray: 0.55, bite: 0.82, hand: 0.7 }),
      );
      break;

    case 'bench': {
      const w = 0.34 * s;
      const seat = y - 0.09 * s;
      mass(
        f,
        [
          [x - w, seat],
          [x + w, seat - 0.005],
          [x + w, seat + 0.022],
          [x - w, seat + 0.026],
        ],
        f.ink,
        1.1,
        2,
      );
      // Back: two rails and the uprights.
      for (const k of [0, 1]) {
        const by = seat - 0.09 * s - k * 0.045 * s;
        built(
          f,
          [
            [x - w * 0.94, by],
            [x + w * 0.94, by - 0.004],
          ],
          nib(f, f.ink, 0.008),
        );
      }
      for (const sx of [-0.86, 0.86]) {
        built(
          f,
          [
            [x + w * sx, seat + 0.01],
            [x + w * sx, seat - 0.15 * s],
          ],
          nib(f, f.ink, 0.007),
        );
      }
      // Legs.
      for (const sx of [-0.8, 0.8]) {
        built(
          f,
          [
            [x + w * sx, seat + 0.02],
            [x + w * sx * 1.06, y],
          ],
          nib(f, f.ink, 0.009),
        );
      }
      break;
    }

    case 'tree': {
      line(
        f,
        [
          [x, y],
          [x + 0.01 * s, y - 0.26 * s],
          [x - 0.01 * s, y - 0.4 * s],
        ],
        nib(f, f.ink, 0.014, { taper: [1.6, 0.6] }),
      );
      // The canopy is a scribble, not a shape — a drawn outline of leaves is a
      // broccoli. It has to be a *wander*, though: the first version swept a
      // clean spiral, and a smoothed clean spiral is a bullseye.
      const c: [number, number][] = [];
      let a = f.r() * 6;
      const cy = y - 0.46 * s;
      // Few loops, wide, and light. Thirty passes at full weight over the same
      // patch is not a canopy, it is a hole in the paper.
      for (let i = 0; i <= 26; i++) {
        a += 2.2 + (f.r() - 0.5) * 1.9;
        const rr = (0.1 + f.r() * 0.11) * s;
        c.push([x + Math.cos(a) * rr * 1.5, cy + Math.sin(a) * rr * 0.8]);
      }
      line(f, c, nib(f, f.ink, 0.005, { fray: 0.5, hand: 0.5, bite: 0.82 }));
      break;
    }

    case 'lamp': {
      line(
        f,
        [
          [x, y],
          [x, y - 0.56 * s],
        ],
        nib(f, f.ink, 0.008, { taper: [1.5, 0.8] }),
      );
      line(
        f,
        [
          [x - 0.03 * s, y - 0.58 * s],
          [x + 0.03 * s, y - 0.58 * s],
        ],
        nib(f, f.ink, 0.007),
      );
      disc(f, x, y - 0.6 * s, 0.028 * s, 0.03 * s, f.col, 1.1);
      // The pool of light it throws, which is the reason to draw a lamp.
      disc(f, x, y + 0.004, 0.13 * s, 0.018 * s, f.col, 0.85);
      break;
    }

    case 'window': {
      const w = 0.17 * s;
      const t = y - 0.62 * s;
      const bt = y - 0.16 * s;
      built(
        f,
        [
          [x - w, t],
          [x + w, t],
          [x + w, bt],
          [x - w, bt],
          [x - w, t],
        ],
        nib(f, f.ink, 0.01),
      );
      built(
        f,
        [
          [x, t],
          [x, bt],
        ],
        nib(f, f.ink, 0.006),
      );
      built(
        f,
        [
          [x - w, (t + bt) / 2],
          [x + w, (t + bt) / 2],
        ],
        nib(f, f.ink, 0.006),
      );
      // Light on the floor, thrown well out of register with the window itself.
      mass(
        f,
        [
          [x - w * 0.7, bt + 0.03],
          [x + w * 1.5, bt + 0.02],
          [x + w * 2.4, y],
          [x - w * 0.2, y + 0.01],
        ],
        f.col,
        0.8,
        2,
      );
      break;
    }

    case 'door': {
      const w = 0.13 * s;
      const t = y - 0.68 * s;
      built(
        f,
        [
          [x - w, y],
          [x - w, t],
          [x + w, t],
          [x + w, y],
        ],
        nib(f, f.ink, 0.012),
      );
      built(
        f,
        [
          [x + w * 0.62, y - 0.3 * s],
          [x + w * 0.62, y - 0.27 * s],
        ],
        nib(f, f.ink, 0.01),
      );
      break;
    }

    case 'shelves': {
      const w = 0.42 * s;
      for (let k = 0; k < 4; k++) {
        const sy = y - 0.14 * s - k * 0.16 * s;
        built(
          f,
          [
            [x - w, sy],
            [x + w, sy + wob(k) * 0.006],
          ],
          nib(f, f.ink, 0.008),
        );
        // Books: ticks of varying height leaning on each other. Sparse on
        // purpose — packed tight at full weight the shelf came out as a black
        // hedge, which is the set winning an argument it should not be in.
        let bx = x - w * 0.94;
        while (bx < x + w * 0.9) {
          const bh = (0.05 + f.r() * 0.055) * s;
          const lean = (f.r() - 0.5) * 0.2;
          built(
            f,
            [
              [bx, sy - 0.002],
              [bx + lean * bh, sy - bh],
            ],
            nib(f, f.r() < 0.14 ? f.col : f.ink, 0.004 + f.r() * 0.003, {
              hand: 0.35,
              bite: 0.8,
            }),
          );
          bx += 0.028 * s + f.r() * 0.02 * s;
        }
      }
      break;
    }

    case 'table': {
      const w = 0.26 * s;
      const t = y - 0.2 * s;
      mass(
        f,
        [
          [x - w, t],
          [x + w, t - 0.004],
          [x + w, t + 0.016],
          [x - w, t + 0.02],
        ],
        f.ink,
        1.1,
        2,
      );
      for (const sx of [-0.86, 0.86]) {
        built(
          f,
          [
            [x + w * sx, t + 0.016],
            [x + w * sx * 1.1, y],
          ],
          nib(f, f.ink, 0.009),
        );
      }
      break;
    }

    case 'chair': {
      const w = 0.09 * s;
      const seat = y - 0.16 * s;
      built(
        f,
        [
          [x - w, seat],
          [x + w, seat - 0.003],
        ],
        nib(f, f.ink, 0.011),
      );
      built(
        f,
        [
          [x - w * 0.9, seat],
          [x - w * 1.05, seat - 0.2 * s],
        ],
        nib(f, f.ink, 0.009),
      );
      for (const sx of [-0.8, 0.8]) {
        built(
          f,
          [
            [x + w * sx, seat + 0.004],
            [x + w * sx * 1.1, y],
          ],
          nib(f, f.ink, 0.008),
        );
      }
      break;
    }

    case 'stairs': {
      const steps = 5;
      const zig: [number, number][] = [];
      for (let k = 0; k <= steps; k++) {
        const sx = x - 0.28 * s + (k / steps) * 0.56 * s;
        const sy = y - (k / steps) * 0.3 * s;
        zig.push([sx, sy], [sx + 0.056 * s, sy], [sx + 0.056 * s, sy - 0.06 * s]);
      }
      built(f, zig, nib(f, f.ink, 0.009, { hand: 0.4 }));
      break;
    }

    case 'railing': {
      const w = 0.46 * s;
      const t = y - 0.24 * s;
      built(
        f,
        [
          [x - w, t],
          [x + w, t - 0.004],
        ],
        nib(f, f.ink, 0.01),
      );
      built(
        f,
        [
          [x - w, t + 0.11 * s],
          [x + w, t + 0.107 * s],
        ],
        nib(f, f.ink, 0.006),
      );
      for (let k = 0; k <= 9; k++) {
        const bx = x - w + (k / 9) * w * 2;
        built(
          f,
          [
            [bx, t],
            [bx, y],
          ],
          nib(f, f.ink, 0.005, { hand: 0.4 }),
        );
      }
      break;
    }

    case 'counter': {
      const w = 0.44 * s;
      const t = y - 0.26 * s;
      mass(
        f,
        [
          [x - w, t],
          [x + w, t - 0.005],
          [x + w, t + 0.024],
          [x - w, t + 0.03],
        ],
        f.ink,
        1.1,
        2,
      );
      built(
        f,
        [
          [x - w * 0.96, t + 0.03],
          [x - w * 0.96, y],
        ],
        nib(f, f.ink, 0.007),
      );
      built(
        f,
        [
          [x + w * 0.96, t + 0.03],
          [x + w * 0.96, y],
        ],
        nib(f, f.ink, 0.007),
      );
      break;
    }

    case 'bed': {
      const w = 0.34 * s;
      const t = y - 0.13 * s;
      mass(
        f,
        [
          [x - w, t],
          [x + w, t - 0.006],
          [x + w, t + 0.03],
          [x - w, t + 0.036],
        ],
        f.ink,
        1.0,
        2,
      );
      built(
        f,
        [
          [x - w * 1.02, t + 0.02],
          [x - w * 1.02, t - 0.16 * s],
        ],
        nib(f, f.ink, 0.011),
      );
      disc(f, x - w * 0.72, t - 0.03 * s, 0.05 * s, 0.026 * s, f.col, 0.9);
      break;
    }

    case 'parapet': {
      const w = 0.6 * s;
      const t = y - 0.1 * s;
      built(
        f,
        [
          [x - w, t],
          [x + w, t - 0.006],
        ],
        nib(f, f.ink, 0.016, { fray: 0.4 }),
      );
      built(
        f,
        [
          [x - w, t + 0.03],
          [x + w, t + 0.026],
        ],
        nib(f, f.ink, 0.006, { hand: 0.4 }),
      );
      break;
    }

    case 'sign': {
      built(
        f,
        [
          [x, y],
          [x, y - 0.42 * s],
        ],
        nib(f, f.ink, 0.008),
      );
      mass(
        f,
        [
          [x - 0.05 * s, y - 0.44 * s],
          [x + 0.05 * s, y - 0.45 * s],
          [x + 0.05 * s, y - 0.38 * s],
          [x - 0.05 * s, y - 0.37 * s],
        ],
        f.col,
        1.05,
        2,
      );
      break;
    }

    case 'rug':
      disc(f, x, y + 0.006, 0.2 * s, 0.02 * s, f.col, 0.85);
      break;

    case 'moon':
      disc(f, x, y, 0.045 * s, 0.05 * s, f.col, 1.05);
      break;

    case 'rain':
      for (let k = 0; k < 26; k++) {
        const rx = x - 0.5 + f.r();
        const ry = f.r() * 0.8;
        line(
          f,
          [
            [rx, ry],
            [rx - 0.02, ry + 0.07],
          ],
          nib(f, f.ink, 0.0035, { hand: 0.3, fray: 0.5 }),
        );
      }
      break;

    case 'birds':
      for (let k = 0; k < 3 + Math.floor(f.r() * 3); k++) {
        const bx = x + (f.r() - 0.5) * 0.5 * s;
        const by = y - (0.06 + f.r() * 0.5) * s;
        const bw = 0.02 * s;
        line(
          f,
          [
            [bx - bw, by],
            [bx, by - bw * 0.5],
            [bx + bw, by],
          ],
          nib(f, f.ink, 0.004, { hand: 0.3 }),
        );
      }
      break;

    case 'crowd':
      // Other people, far enough back to be two marks each. They are what makes
      // one figure read as alone rather than merely as the only one drawn.
      for (let k = 0; k < 5 + Math.floor(f.r() * 4); k++) {
        const cx = x + (f.r() - 0.5) * 1.1 * s;
        const cs = (0.1 + f.r() * 0.05) * s;
        line(
          f,
          [
            [cx, y - cs * 0.1],
            [cx + (f.r() - 0.5) * 0.02, y - cs],
          ],
          nib(f, f.ink, 0.009, { taper: [1.4, 0.7], hand: 0.5 }),
        );
        disc(f, cx + (f.r() - 0.5) * 0.02, y - cs - cs * 0.12, cs * 0.1, cs * 0.13, f.ink, 1.05);
      }
      break;

    case 'pillar':
      // Two lines, not a black bar. A pillar drawn solid is a wall.
      for (const sx of [-0.022, 0.022]) {
        built(
          f,
          [
            [x + sx * s, y],
            [x + sx * s, y - 0.75 * s],
          ],
          nib(f, f.ink, 0.006, { fray: 0.3 }),
        );
      }
      built(
        f,
        [
          [x - 0.04 * s, y - 0.75 * s],
          [x + 0.04 * s, y - 0.755 * s],
        ],
        nib(f, f.ink, 0.008),
      );
      break;

    case 'easel': {
      line(
        f,
        [
          [x, y],
          [x + 0.04 * s, y - 0.42 * s],
        ],
        nib(f, f.ink, 0.008),
      );
      line(
        f,
        [
          [x + 0.12 * s, y],
          [x + 0.06 * s, y - 0.42 * s],
        ],
        nib(f, f.ink, 0.008),
      );
      mass(
        f,
        [
          [x - 0.02 * s, y - 0.5 * s],
          [x + 0.15 * s, y - 0.51 * s],
          [x + 0.15 * s, y - 0.28 * s],
          [x - 0.02 * s, y - 0.27 * s],
        ],
        f.col,
        0.8,
        2,
      );
      line(
        f,
        [
          [x - 0.02 * s, y - 0.5 * s],
          [x + 0.15 * s, y - 0.51 * s],
          [x + 0.15 * s, y - 0.28 * s],
          [x - 0.02 * s, y - 0.27 * s],
          [x - 0.02 * s, y - 0.5 * s],
        ],
        nib(f, f.ink, 0.007),
      );
      break;
    }
  }
}
