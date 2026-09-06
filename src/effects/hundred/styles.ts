import { box, ctx, dab, grid, mix, paper, Region, ride, scatter, scatterLight, steps, stroke, type Ctx } from './kit';
import { L, type Field } from './source';

/**
 * A hundred ways of looking at the same picture.
 *
 * Every one of these reads the same luminance and region fields and none of
 * them knows what it is drawing — which is the point. A technique is a rule
 * for turning tone into marks, and the reason a woodcut and a stipple of the
 * same photograph are recognisably the same photograph is that the rule is
 * the only thing that changed.
 *
 * They are grouped by what the mark is made *with*, because that is what
 * actually separates them: a pen leaves a line, a press leaves a flat area, a
 * brush leaves a load of paint, a machine leaves a grid, and a needle leaves
 * a stitch.
 */

export interface Style {
  id: string;
  name: string;
  family: 'Line' | 'Press' | 'Paint' | 'System' | 'Craft';
  /** What the technique actually is, in one line. */
  note: string;
  draw: (c: Ctx) => void;
}

const INK = '#17140f';
const CREAM = '#efe6d3';
const BONE = '#e4dcc8';

/** Ink on paper, which is where two thirds of these start. */
const on = (c: Ctx, p = CREAM) => paper(c, p);

// ------------------------------------------------------------------- line

const LINE: Style[] = [
  {
    id: 'contour', name: 'Contour line', family: 'Line',
    note: 'One weight, no shading: the whole drawing carried by where the edges are.',
    draw: (c) => {
      on(c);
      for (const [x, y] of scatter(c, 900, 1)) {
        const s = c.slope(x, y);
        if (s.mag < 0.05) continue;
        stroke(c, ride(c, [x, y], 14, 0.006, 0.1), c.w * 0.004, INK, 0.85);
      }
    },
  },
  {
    id: 'blind', name: 'Blind contour', family: 'Line',
    note: 'Drawn without looking at the paper: one unbroken line, and the proportions take the consequences.',
    draw: (c) => {
      on(c);
      let p: [number, number] = [0.5, 0.1];
      const path: [number, number][] = [p];
      for (let i = 0; i < 1400; i++) {
        const s = c.slope(p[0], p[1]);
        const a = s.angle + Math.PI / 2 + (c.r() - 0.5) * 0.9 + (s.mag < 0.04 ? (c.r() - 0.5) * 2.4 : 0);
        p = [p[0] + Math.cos(a) * 0.009, p[1] + Math.sin(a) * 0.009];
        if (p[0] < 0.04 || p[0] > 0.96) p[0] = Math.min(0.96, Math.max(0.04, p[0]));
        if (p[1] < 0.04 || p[1] > 0.96) p[1] = Math.min(0.96, Math.max(0.04, p[1]));
        path.push(p);
      }
      stroke(c, path, c.w * 0.0035, INK, 0.75);
    },
  },
  {
    id: 'hatch', name: 'Hatching', family: 'Line',
    note: 'Parallel lines at one angle. Tone is how many of them, never how dark they are.',
    draw: (c) => {
      on(c);
      const a = -0.5;
      // Eight interleaved passes. Line k only prints where the tone has
      // reached that pass's level, so a pale cheek takes one line in eight
      // and a black coat takes all eight. One threshold for every line would
      // give a silhouette: lit side blank, dark side solid, nothing between.
      const order = [0, 4, 2, 6, 1, 5, 3, 7];
      // The lines run up and to the right from below the bottom edge, so the
      // run has to be long enough to leave the card again. At u < 1.6 it
      // stopped a third of the way up and the head was never hatched at all.
      let pass = 0;
      for (let k = -2.4; k < 2.4; k += 0.0055) {
        const level = 0.07 + (order[pass++ % 8] / 8) * 0.68;
        let pts: [number, number][] = [];
        const flush = () => { stroke(c, pts, c.w * 0.004, INK, 0.92); pts = []; };
        for (let u = 0; u < 2.6; u += 0.006) {
          const x = k + Math.cos(a) * u;
          const y = Math.sin(a) * u + 1.1;
          if (x < 0 || x > 1 || y < 0 || y > 1 || c.t(x, y) <= level) flush();
          else pts.push([x, y]);
        }
        flush();
      }
    },
  },
  {
    id: 'crosshatch', name: 'Cross-hatching', family: 'Line',
    note: 'Two passes at forty degrees. The darkest areas take both, and that is the entire tonal range.',
    draw: (c) => {
      on(c);
      // Each pass has to cross the whole card. Run short, the first pass never
      // reaches the top third and the second never reaches the bottom fifth,
      // and the plate ends up with a band of single hatching at each end.
      // Leaving the card also has to break the line, or it is drawn straight
      // back across the picture to wherever it comes in again.
      for (const [a, gate] of [[-0.5, 0.34], [0.6, 0.58]] as const) {
        for (let k = -2.4; k < 2.4; k += 0.009) {
          let pts: [number, number][] = [];
          const flush = () => { stroke(c, pts, c.w * 0.003, INK, 0.85); pts = []; };
          for (let u = 0; u < 2.6; u += 0.008) {
            const x = k + Math.cos(a) * u;
            const y = Math.sin(a) * u + (a < 0 ? 1.1 : -0.1);
            if (x < 0 || x > 1 || y < 0 || y > 1 || c.t(x, y) <= gate) flush();
            else pts.push([x, y]);
          }
          flush();
        }
      }
    },
  },
  {
    id: 'formhatch', name: 'Form hatching', family: 'Line',
    note: 'The lines run *along* the form rather than across the page, so the shading describes the head instead of lying on it.',
    draw: (c) => {
      on(c);
      for (const [x, y] of scatter(c, 1500, 1.3)) {
        const t = c.t(x, y);
        stroke(c, ride(c, [x, y], 10 + Math.round(t * 16), 0.007, 0.05), c.w * 0.0032, INK, 0.2 + t * 0.6);
      }
    },
  },
  {
    id: 'stipple', name: 'Stipple', family: 'Line',
    note: 'Dots of one size. Tone is density and never diameter, which is the rule every beginner breaks.',
    draw: (c) => {
      on(c);
      for (const [x, y] of scatter(c, 9000, 1.7)) dab(c, x, y, 0.0034, 0.0034, INK, 1);
    },
  },
  {
    id: 'engrave', name: 'Line engraving', family: 'Line',
    note: 'A burin cuts wider as it presses deeper, so one line carries the whole tonal range by swelling.',
    draw: (c) => {
      on(c, '#eae0ca');
      for (let k = 0; k < 1; k += 0.011) {
        for (let seg = 0; seg < 1; seg++) {
          const pts: [number, number][] = [];
          const wide: number[] = [];
          for (let y = 0; y <= 1; y += 0.006) {
            const x = k + Math.sin(y * 5 + k * 22) * 0.012;
            pts.push([x, y]);
            wide.push(c.t(x, y));
          }
          for (let i = 1; i < pts.length; i++) {
            stroke(c, [pts[i - 1], pts[i]], c.w * 0.0012 + c.w * 0.008 * Math.pow(wide[i], 2.2), INK, 0.95);
          }
        }
      }
    },
  },
  {
    id: 'etch', name: 'Etching', family: 'Line',
    note: 'Acid bites where the needle scratched. Fine, nervous, and the whites are simply untouched ground.',
    draw: (c) => {
      on(c, '#e8dfcb');
      // Weighted hard towards the darks, and the line lengthens with them, or
      // the whole plate bites evenly and there is no picture in it.
      for (const [x, y] of scatter(c, 5200, 2.6)) {
        const t = c.t(x, y);
        const a = c.slope(x, y).angle + Math.PI / 2 + (c.r() - 0.5) * 0.5;
        const len = 0.006 + t * 0.05;
        stroke(c, [[x, y], [x + Math.cos(a) * len, y + Math.sin(a) * len]], c.w * 0.0018, '#241d14', 0.3 + t * 0.45);
      }
    },
  },
  {
    id: 'scratch', name: 'Scratchboard', family: 'Line',
    note: 'White cut out of black. The drawing is made of the light rather than the dark, which reverses every instinct.',
    draw: (c) => {
      paper(c, '#0d0b09');
      // The scatter has to be biased towards the *lights* here, because on a
      // black plate the drawing is made of what is scraped away.
      for (let i = 0; i < 30000; i++) {
        const x = c.r();
        const y = c.r();
        const v = 1 - c.t(x, y);
        if (c.r() > v * v * 1.5) continue;
        const a = c.slope(x, y).angle + Math.PI / 2;
        const len = 0.005 + v * 0.03;
        stroke(c, [[x, y], [x + Math.cos(a) * len, y + Math.sin(a) * len]], c.w * 0.0018, '#f2ead6', 0.5);
      }
    },
  },
  {
    id: 'woodcut', name: 'Woodcut', family: 'Press',
    note: 'What is left standing prints. Bold masses, gouged whites, and no half tones at all.',
    draw: (c) => {
      on(c, '#e6dcc4');
      grid(c, 150, (x, y, t) => {
        if (t > 0.56) box(c, x - 0.004, y - 0.004, 0.009, 0.009, '#14110c');
      });
      for (let k = 0; k < 1; k += 0.026) {
        const pts: [number, number][] = [];
        for (let y = 0; y <= 1; y += 0.01) {
          const x = k + Math.sin(y * 3.4 + k * 9) * 0.02;
          if (c.t(x, y) > 0.56 && c.t(x, y) < 0.86) pts.push([x, y]);
          else if (pts.length > 1) { stroke(c, pts, c.w * 0.005, '#e6dcc4'); pts.length = 0; }
        }
        stroke(c, pts, c.w * 0.005, '#e6dcc4');
      }
    },
  },
  {
    id: 'lino', name: 'Linocut', family: 'Press',
    note: 'Lino gouges wider and rounder than wood, so the whites are fat and the corners never quite meet.',
    draw: (c) => {
      on(c, '#e9e0cb');
      grid(c, 90, (x, y, t) => {
        if (t > 0.52) dab(c, x, y, 0.009, 0.009, '#1a140f');
      });
      for (const [x, y] of scatter(c, 700, 0.6)) {
        if (c.t(x, y) < 0.52 || c.t(x, y) > 0.9) continue;
        const a = c.slope(x, y).angle + Math.PI / 2;
        stroke(c, [[x, y], [x + Math.cos(a) * 0.05, y + Math.sin(a) * 0.05]], c.w * 0.009, '#e9e0cb', 0.95);
      }
    },
  },
  {
    id: 'penwash', name: 'Pen and wash', family: 'Line',
    note: 'The line does the drawing and a single grey wash does the weather. Neither tries to do the other’s job.',
    draw: (c) => {
      on(c, '#f0e9da');
      grid(c, 64, (x, y, t) => {
        if (t > 0.3) dab(c, x, y, 0.014, 0.014, '#6d6555', (t - 0.3) * 0.5);
      });
      for (const [x, y] of scatter(c, 700, 1.6)) {
        const s = c.slope(x, y);
        if (s.mag < 0.06) continue;
        stroke(c, ride(c, [x, y], 12, 0.007, 0.12), c.w * 0.0032, '#211b12', 0.9);
      }
    },
  },
  {
    id: 'ballpoint', name: 'Ballpoint', family: 'Line',
    note: 'Biro cannot make a dark, only a slow one. Tone is loops laid over loops until the paper gives in.',
    draw: (c) => {
      on(c, '#f2eee1');
      for (const [x, y] of scatter(c, 3000, 2.1)) {
        const t = c.t(x, y);
        const pts: [number, number][] = [];
        let a = c.r() * 6.3;
        let p: [number, number] = [x, y];
        // How many times round, and how hard: a biro gets dark by going back
        // over itself, so both the number of loops and the pressure ride the
        // tone. One of the two on its own is a texture, not a picture.
        const loops = 5 + Math.round(t * 30);
        for (let i = 0; i < loops; i++) {
          a += 0.85 + (c.r() - 0.5) * 0.5;
          p = [p[0] + Math.cos(a) * 0.0035, p[1] + Math.sin(a) * 0.0035];
          pts.push(p);
        }
        stroke(c, pts, c.w * 0.0018, '#2b3a6b', 0.09 + t * 0.4);
      }
    },
  },
  {
    id: 'technical', name: 'Technical pen', family: 'Line',
    note: 'One nib, no pressure, no taper. Every line is exactly as important as every other line.',
    draw: (c) => {
      on(c, '#f4efe2');
      grid(c, 118, (x, y, t) => {
        const n = Math.round(t * 4);
        for (let i = 0; i < n; i++) {
          const o = (i - n / 2) * 0.0022;
          stroke(c, [[x - 0.004 + o, y - 0.004], [x + 0.004 + o, y + 0.004]], c.w * 0.0016, '#151313', 1);
        }
      });
    },
  },
  {
    id: 'brushpen', name: 'Brush pen', family: 'Line',
    note: 'Pressure is the whole vocabulary: a hairline and a slab from the same stroke.',
    draw: (c) => {
      on(c);
      for (const [x, y] of scatter(c, 420, 1.1)) {
        const path = ride(c, [x, y], 22, 0.011, 0.18);
        for (let i = 1; i < path.length; i++) {
          const t = c.t(path[i][0], path[i][1]);
          stroke(c, [path[i - 1], path[i]], c.w * (0.001 + t * 0.014), INK, 0.85);
        }
      }
    },
  },
  {
    id: 'drybrush', name: 'Dry brush', family: 'Paint',
    note: 'Not enough ink on the brush, so the stroke skips and only the tooth of the paper takes it.',
    draw: (c) => {
      on(c, '#e9e2d0');
      for (const [x, y] of scatter(c, 1600, 1.6)) {
        const t = c.t(x, y);
        const a = c.slope(x, y).angle + Math.PI / 2;
        // Which bristles catch is the tone: a dry brush over a light passage
        // drops most of them, and over a dark one lays the whole ferrule down.
        for (let i = 0; i < 7; i++) {
          if (c.r() > 0.22 + t * 0.72) continue;
          const o = (i - 3) * 0.0032;
          const nx = x + Math.cos(a + 1.57) * o;
          const ny = y + Math.sin(a + 1.57) * o;
          const len = 0.02 + t * 0.03;
          stroke(c, [[nx, ny], [nx + Math.cos(a) * len, ny + Math.sin(a) * len]], c.w * 0.0026, '#201a13', 0.32 + t * 0.5);
        }
      }
    },
  },
  {
    id: 'charcoal', name: 'Charcoal', family: 'Line',
    note: 'Smudges as readily as it marks, so the darks are pushed around with a thumb rather than drawn.',
    draw: (c) => {
      on(c, '#e6e1d4');
      for (const [x, y] of scatter(c, 7000, 1.6)) {
        const t = c.t(x, y);
        const s = 0.003 + t * 0.009;
        dab(c, x, y, s + c.r() * 0.004, s * 0.8, '#1d1b18', 0.07 + t * 0.3);
      }
      for (const [x, y] of scatter(c, 260, 2.4)) {
        const a = c.slope(x, y).angle + Math.PI / 2;
        stroke(c, [[x, y], [x + Math.cos(a) * 0.07, y + Math.sin(a) * 0.07]], c.w * 0.014, '#15130f', 0.24);
      }
    },
  },
  {
    id: 'graphite', name: 'Graphite', family: 'Line',
    note: 'Pencil is a grey that shines. The darkest it goes is about eighty per cent, and the trick is not to fight that.',
    draw: (c) => {
      on(c, '#eeeae0');
      for (let k = 0; k < 1.6; k += 0.0055) {
        const pts: [number, number][] = [];
        for (let u = 0; u < 1.5; u += 0.012) {
          const x = k - u * 0.7;
          const y = u * 0.72;
          if (x < 0 || x > 1 || y > 1) continue;
          const t = c.t(x, y);
          if (t > 0.3 + c.r() * 0.3) pts.push([x, y]);
          else if (pts.length > 1) { stroke(c, pts, c.w * 0.0026, '#3a3833', 0.5); pts.length = 0; }
        }
        stroke(c, pts, c.w * 0.0026, '#3a3833', 0.5);
      }
    },
  },
  {
    id: 'silverpoint', name: 'Silverpoint', family: 'Line',
    note: 'A silver stylus on prepared ground. It cannot be erased and it will not go dark, so nothing is guessed.',
    draw: (c) => {
      on(c, '#d9d5c4');
      for (const [x, y] of scatter(c, 7000, 1.8)) {
        const t = c.t(x, y);
        const a = c.slope(x, y).angle + Math.PI / 2;
        const len = 0.007 + t * 0.024;
        stroke(c, [[x, y], [x + Math.cos(a) * len, y + Math.sin(a) * len]], c.w * 0.0018, '#4a4940', 0.18 + t * 0.5);
      }
    },
  },
  {
    id: 'oneline', name: 'One continuous line', family: 'Line',
    note: 'A single spiral from the middle outwards, its radius pushed by the tone. The pen never leaves the paper.',
    draw: (c) => {
      on(c, '#f1ead9');
      // The spiral is only a carrier and it never changes. What changes is
      // how hard the pen is pressed, so the darks swell until neighbouring
      // turns touch and close up, and the lights stay hairlines.
      // The pressure has to be able to close the gap. At a maximum weight of
      // half the turn spacing the darkest passage is still only half covered,
      // so the picture never gets past the ring pattern that carries it — the
      // widest line has to be as wide as the gap it sits in.
      const turns = 76;
      const span = 0.66;
      const gap = span / turns;
      const steps = 26000;
      let prev: [number, number] | null = null;
      for (let i = 0; i <= steps; i++) {
        const u = i / steps;
        const a = u * turns * Math.PI * 2;
        const rad = 0.04 + u * span;
        const p: [number, number] = [0.5 + Math.cos(a) * rad, 0.42 + Math.sin(a) * rad * (c.w / c.h)];
        if (prev) {
          const t = c.t((p[0] + prev[0]) / 2, (p[1] + prev[1]) / 2);
          stroke(c, [prev, p], c.w * gap * (0.06 + Math.pow(t, 1.5) * 1.05), INK, 0.95);
        }
        prev = p;
      }
    },
  },
];

// ------------------------------------------------------------------ press

const PRESS: Style[] = [
  {
    id: 'flat', name: 'Flat vector', family: 'Press',
    note: 'Six colours, no outline, every edge a change of fill. The hardest part is deciding what to throw away.',
    draw: (c) => {
      on(c, '#f1e8d4');
      grid(c, 210, (x, y, t) => {
        const q = steps(t, 5);
        if (q > 0.05) box(c, x - 0.0026, y - 0.0026, 0.0056, 0.0056, mix('#e2c9a8', '#191510', q));
      });
    },
  },
  {
    id: 'posterise', name: 'Posterised', family: 'Press',
    note: 'Four tones and nothing between them. The banding is the picture, not an artefact of it.',
    draw: (c) => {
      on(c, '#efe4cd');
      grid(c, 200, (x, y, t) => {
        const q = steps(t, 4);
        box(c, x - 0.0028, y - 0.0028, 0.006, 0.006, ['#f0e5ce', '#b9a184', '#5f4f3f', '#151210'][Math.round(q * 3)]);
      });
    },
  },
  {
    id: 'notan', name: 'Notan', family: 'Press',
    note: 'Two values only. If the drawing survives being reduced to black and white shapes, it was a good drawing.',
    draw: (c) => {
      paper(c, '#f2ead8');
      grid(c, 220, (x, y, t) => {
        if (t > 0.5) box(c, x - 0.0026, y - 0.0026, 0.0055, 0.0055, '#131110');
      });
    },
  },
  {
    id: 'duotone', name: 'Duotone', family: 'Press',
    note: 'Two inks mapped to the ends of the range, so the shadows go one colour and the lights the other.',
    draw: (c) => {
      on(c, '#f0e2c6');
      grid(c, 200, (x, y, t) => {
        box(c, x - 0.0028, y - 0.0028, 0.006, 0.006, mix('#e8d6ad', '#22304f', Math.pow(t, 0.85)));
      });
    },
  },
  {
    id: 'riso', name: 'Risograph', family: 'Press',
    note: 'Two passes through a drum, and the second never lands quite where the first did. The misregistration is the charm.',
    draw: (c) => {
      on(c, '#f4efe0');
      const layer = (colour: string, dx: number, dy: number, gate: number) => {
        grid(c, 130, (x, y, t) => {
          if (t > gate && c.r() < (t - gate) * 2.4) dab(c, x + dx, y + dy, 0.0055, 0.0055, colour, 0.72);
        });
      };
      layer('#f04a58', 0.006, -0.004, 0.24);
      layer('#2b4c9b', -0.005, 0.005, 0.46);
    },
  },
  {
    id: 'screen', name: 'Screen print', family: 'Press',
    note: 'Three flat layers pulled one at a time. Where they overlap you get a fourth colour nobody chose.',
    draw: (c) => {
      on(c, '#efe7d2');
      const layer = (colour: string, dx: number, dy: number, lo: number, hi: number) => {
        c.g.save();
        c.g.globalAlpha = 0.78;
        grid(c, 170, (x, y, t) => {
          if (t > lo && t <= hi) box(c, x + dx - 0.0032, y + dy - 0.0032, 0.0068, 0.0068, colour);
        });
        c.g.restore();
      };
      layer('#e8b13c', 0.008, 0.004, 0.2, 1);
      layer('#c8442f', -0.006, 0.006, 0.44, 1);
      layer('#1c2230', 0.003, -0.006, 0.66, 1);
    },
  },
  {
    id: 'halftone', name: 'Halftone', family: 'Press',
    note: 'A dot per cell, sized by tone, on a screen turned forty-five degrees so the grid stops being visible as a grid.',
    draw: (c) => {
      on(c, '#f2ecdc');
      const n = 62;
      const a = Math.PI / 4;
      for (let j = -n; j < n * 2; j++) {
        for (let i = -n; i < n * 2; i++) {
          const u = (i / n) * 1.42;
          const v = (j / n) * 1.42;
          const x = 0.5 + (u - 0.7) * Math.cos(a) - (v - 0.7) * Math.sin(a);
          const y = 0.5 + (u - 0.7) * Math.sin(a) + (v - 0.7) * Math.cos(a);
          if (x < 0 || x > 1 || y < 0 || y > 1) continue;
          // A screen's black is dots that touch. At 0.0085 against a pitch of
          // 0.023 the densest cell is still less than half covered, so the
          // whole plate prints as a pale grey however dark the picture is.
          const t = Math.min(1, c.t(x, y) * 1.14);
          if (t > 0.03) dab(c, x, y, 0.0125 * Math.sqrt(t), 0.0125 * Math.sqrt(t), '#171410');
        }
      }
    },
  },
  {
    id: 'linescreen', name: 'Line screen', family: 'Press',
    note: 'The same idea with a line instead of a dot: the rule thickens where the picture darkens.',
    draw: (c) => {
      on(c, '#f1ead8');
      for (let k = 0; k < 1; k += 0.014) {
        for (let y = 0; y <= 1; y += 0.004) {
          const t = c.t(k, y);
          if (t > 0.03) box(c, k - 0.007 * t, y, 0.014 * t, 0.0045, '#16130f');
        }
      }
    },
  },
  {
    id: 'lowpoly', name: 'Low poly', family: 'Press',
    note: 'Triangles that meet edge to edge, each one flat. The picture appears in the sizes rather than in any single facet.',
    draw: (c) => {
      on(c, '#e9e0cc');
      const n = 26;
      for (let j = 0; j < n; j++) {
        for (let i = 0; i < n; i++) {
          const jitter = () => (c.r() - 0.5) * 0.014;
          const x0 = i / n + jitter();
          const y0 = j / n + jitter();
          const x1 = (i + 1) / n + jitter();
          const y1 = (j + 1) / n + jitter();
          for (const tri of [[[x0, y0], [x1, y0], [x0, y1]], [[x1, y0], [x1, y1], [x0, y1]]]) {
            const mx = (tri[0][0] + tri[1][0] + tri[2][0]) / 3;
            const my = (tri[0][1] + tri[1][1] + tri[2][1]) / 3;
            c.g.fillStyle = c.col(mx, my);
            c.g.beginPath();
            c.g.moveTo(c.X(tri[0][0]), c.Y(tri[0][1]));
            c.g.lineTo(c.X(tri[1][0]), c.Y(tri[1][1]));
            c.g.lineTo(c.X(tri[2][0]), c.Y(tri[2][1]));
            c.g.closePath();
            c.g.fill();
          }
        }
      }
    },
  },
  {
    id: 'cubist', name: 'Cubist facets', family: 'Press',
    note: 'The same head from several angles at once, which is to say the planes are slid apart and left where they land.',
    draw: (c) => {
      on(c, '#ded3ba');
      // Sliding the planes apart only works if they were planes of something
      // first. Placed at random they are confetti: the facets have to sit
      // where the picture is, turn with the form, and get small where there
      // is detail to lose.
      for (const [x, y] of scatter(c, 560, 1.25)) {
        const t = c.t(x, y);
        const a = c.slope(x, y).angle + (c.r() - 0.5) * 1.1;
        const s = 0.028 + (1 - t) * 0.095;
        const off = (c.r() - 0.5) * 0.05;
        c.g.save();
        c.g.globalAlpha = 0.45 + t * 0.45;
        c.g.fillStyle = c.col(x + off, y + off);
        c.g.translate(c.X(x), c.Y(y));
        c.g.rotate(a);
        c.g.fillRect(-s * c.w * 0.5, -s * c.w * 0.3, s * c.w, s * c.w * 0.6);
        c.g.restore();
      }
    },
  },
  {
    id: 'papercut', name: 'Paper cut', family: 'Press',
    note: 'Four flat layers with a millimetre of air between them, so every edge throws a small shadow.',
    draw: (c) => {
      on(c, '#f0e7d4');
      const cols = ['#e6d8ba', '#c3a985', '#7d6650', '#1d1815'];
      for (let k = 0; k < 4; k++) {
        const gate = 0.18 + k * 0.2;
        c.g.save();
        c.g.shadowColor = 'rgba(0,0,0,0.3)';
        c.g.shadowBlur = c.w * 0.012;
        c.g.shadowOffsetY = c.w * 0.006;
        grid(c, 120, (x, y, t) => {
          if (t > gate) box(c, x - 0.0046, y - 0.0046, 0.0095, 0.0095, cols[k]);
        });
        c.g.restore();
      }
    },
  },
  {
    id: 'stencil', name: 'Stencil', family: 'Press',
    note: 'Two cut plates and a can of paint. Everything has to connect to everything, or it falls out of the stencil.',
    draw: (c) => {
      on(c, '#e5ddc9');
      grid(c, 96, (x, y, t) => {
        if (t > 0.42) {
          for (let i = 0; i < 5; i++) {
            dab(c, x + (c.r() - 0.5) * 0.016, y + (c.r() - 0.5) * 0.016, 0.0035, 0.0035, '#1a1714', 0.5);
          }
        }
      });
    },
  },
  {
    id: 'pop', name: 'Pop art', family: 'Press',
    note: 'Four panels, four hot colourways, one plate. The repetition is the point being made.',
    draw: (c) => {
      const sets = [['#f5d327', '#e0403a'], ['#3fb0a8', '#1d2b52'], ['#f07ea8', '#4a2050'], ['#f2f0e2', '#d9522c']];
      for (let p = 0; p < 4; p++) {
        const ox = (p % 2) * 0.5;
        const oy = Math.floor(p / 2) * 0.5;
        box(c, ox, oy, 0.5, 0.5, sets[p][0]);
        grid(c, 110, (x, y, t) => {
          if (t > 0.46) box(c, ox + x * 0.5 - 0.0024, oy + y * 0.5 - 0.0024, 0.005, 0.005, sets[p][1]);
        });
      }
    },
  },
  {
    id: 'mosaic', name: 'Mosaic', family: 'Craft',
    note: 'Tesserae with grout between them. Each is one flat colour and the grid is deliberately not quite square.',
    draw: (c) => {
      paper(c, '#2a2620');
      const n = 46;
      for (let j = 0; j < n * 1.05; j++) {
        for (let i = 0; i < n; i++) {
          const x = (i + 0.5 + (c.r() - 0.5) * 0.2) / n;
          const y = (j + 0.5 + (c.r() - 0.5) * 0.2) / (n * 1.05);
          c.g.save();
          c.g.translate(c.X(x), c.Y(y));
          c.g.rotate((c.r() - 0.5) * 0.24);
          c.g.fillStyle = c.col(x, y);
          const s = c.w / n * 0.82;
          c.g.fillRect(-s / 2, -s / 2, s, s);
          c.g.restore();
        }
      }
    },
  },
  {
    id: 'glass', name: 'Stained glass', family: 'Craft',
    note: 'Every pane is one colour and every join is lead. The black is structural, not drawn.',
    draw: (c) => {
      paper(c, '#0f0d0c');
      const cells = scatter(c, 260, 0.5).concat(Array.from({ length: 90 }, () => [c.r(), c.r()] as [number, number]));
      const n = 132;
      const rows = Math.round(n * (c.h / c.w));
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < n; i++) {
          const x = (i + 0.5) / n;
          const y = (j + 0.5) / rows;
          let best = 0;
          let bd = 9;
          cells.forEach((p, k) => {
            const d = (p[0] - x) ** 2 + ((p[1] - y) * 0.9) ** 2;
            if (d < bd) { bd = d; best = k; }
          });
          const p = cells[best];
          box(c, x - 0.004, y - 0.004, 0.009, 0.009, c.col(p[0], p[1]));
        }
      }
      c.g.globalCompositeOperation = 'multiply';
      c.g.globalCompositeOperation = 'source-over';
    },
  },
  {
    id: 'terrazzo', name: 'Terrazzo', family: 'Craft',
    note: 'Chips of stone thrown into a ground and polished flat. The picture is in where the dark chips fell.',
    draw: (c) => {
      on(c, '#eee7d6');
      // Chips thrown only at the darks leave the lit half as bare ground, and
      // bare ground is not a face. Cover the whole slab and let the size and
      // colour of the chip be the picture.
      for (let i = 0; i < 4600; i++) {
        const x = c.r();
        const y = c.r();
        const s = 0.0032 + c.t(x, y) * 0.0095;
        c.g.save();
        c.g.translate(c.X(x), c.Y(y));
        c.g.rotate(c.r() * 6.3);
        c.g.fillStyle = c.col(x, y);
        c.g.beginPath();
        c.g.moveTo(-s * c.w, 0);
        c.g.lineTo(0, -s * c.w * 0.7);
        c.g.lineTo(s * c.w, s * c.w * 0.2);
        c.g.lineTo(-s * c.w * 0.4, s * c.w * 0.8);
        c.g.closePath();
        c.g.fill();
        c.g.restore();
      }
    },
  },
  {
    id: 'blockprint', name: 'Block print', family: 'Press',
    note: 'One block, hand-inked, hand-pressed. The ink is uneven because a hand is uneven.',
    draw: (c) => {
      on(c, '#eae1cb');
      grid(c, 130, (x, y, t) => {
        if (t > 0.48 && c.r() > 0.12) box(c, x - 0.0042, y - 0.0042, 0.009, 0.009, '#191410', 0.6 + c.r() * 0.4);
      });
    },
  },
  {
    id: 'quilt', name: 'Patchwork', family: 'Craft',
    note: 'Squares of cloth chosen for value rather than colour, which is how a quilt manages to be a picture at all.',
    draw: (c) => {
      paper(c, '#2b2621');
      const n = 26;
      const swatch = ['#e6dcc0', '#c8a86e', '#a0553c', '#4d6b6a', '#2c3550', '#7d3f47', '#dcbf8a', '#1b1a18'];
      const rows = Math.round(n * (c.h / c.w));
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < n; i++) {
          const x = (i + 0.5) / n;
          const y = (j + 0.5) / rows;
          const t = c.t(x, y);
          const k = Math.min(7, Math.floor(t * 7.6));
          box(c, i / n + 0.002, j / rows + 0.002, 1 / n - 0.004, 1 / rows - 0.004, swatch[k]);
        }
      }
    },
  },
  {
    id: 'inlay', name: 'Inlay', family: 'Craft',
    note: 'Flat fields of stone with a wire of brass between them, which is how a pietra dura panel is made.',
    draw: (c) => {
      paper(c, '#141110');
      grid(c, 160, (x, y, t) => {
        const q = steps(t, 5);
        box(c, x - 0.0034, y - 0.0034, 0.0072, 0.0072, ['#e6dcc2', '#bda27c', '#8a5f45', '#3f3226', '#141110'][Math.round(q * 4)]);
      });
      for (const [x, y] of scatter(c, 900, 2)) {
        if (c.slope(x, y).mag < 0.09) continue;
        dab(c, x, y, 0.0018, 0.0018, '#d8ad4e', 0.8);
      }
    },
  },
  {
    id: 'lithograph', name: 'Lithograph', family: 'Press',
    note: 'Grease and water on limestone. It holds a soft grainy tone that no line process can reach.',
    draw: (c) => {
      on(c, '#ece5d4');
      for (const [x, y] of scatter(c, 16000, 1.6)) {
        const s = 0.0024 + c.r() * 0.0022;
        dab(c, x, y, s, s * 0.85, '#221e18', 0.45);
      }
    },
  },
];

// ------------------------------------------------------------------ paint

const PAINT: Style[] = [
  {
    id: 'watercolour', name: 'Watercolour', family: 'Paint',
    note: 'Pigment carried to the edge of a wet shape and left there. The darks are earned in layers, never in one go.',
    draw: (c) => {
      on(c, '#f4efe0');
      for (let pass = 0; pass < 5; pass++) {
        for (const [x, y] of scatter(c, 420, 1.1)) {
          const rad = 0.02 + c.r() * 0.05;
          const g = c.g.createRadialGradient(c.X(x), c.Y(y), 0, c.X(x), c.Y(y), rad * c.w);
          const col = c.col(x, y);
          g.addColorStop(0, col.replace('rgb', 'rgba').replace(')', ',0.1)'));
          g.addColorStop(0.72, col.replace('rgb', 'rgba').replace(')', ',0.16)'));
          g.addColorStop(1, col.replace('rgb', 'rgba').replace(')', ',0)'));
          c.g.fillStyle = g;
          c.g.fillRect(c.X(x) - rad * c.w, c.Y(y) - rad * c.w, rad * c.w * 2, rad * c.w * 2);
        }
      }
    },
  },
  {
    id: 'gouache', name: 'Gouache', family: 'Paint',
    note: 'Opaque and matte: every patch covers what is under it, so the painting is built light over dark and back again.',
    draw: (c) => {
      on(c, '#e8dfc9');
      for (const [x, y] of scatter(c, 1500, 0.7)) {
        c.g.save();
        c.g.translate(c.X(x), c.Y(y));
        c.g.rotate(c.slope(x, y).angle + Math.PI / 2);
        c.g.fillStyle = c.col(x, y);
        c.g.fillRect(-c.w * 0.018, -c.w * 0.007, c.w * 0.036, c.w * 0.014);
        c.g.restore();
      }
    },
  },
  {
    id: 'impasto', name: 'Oil impasto', family: 'Paint',
    note: 'Short loaded strokes that keep the shape of the brush. Each one is a decision you cannot take back.',
    draw: (c) => {
      paper(c, '#3a3226');
      for (const [x, y] of scatter(c, 2400, 0.5)) {
        const a = c.slope(x, y).angle + Math.PI / 2 + (c.r() - 0.5) * 0.5;
        const len = 0.02 + c.r() * 0.03;
        stroke(c, [[x, y], [x + Math.cos(a) * len, y + Math.sin(a) * len]], c.w * 0.011, c.col(x, y), 0.92);
        stroke(c, [[x, y - 0.002], [x + Math.cos(a) * len, y + Math.sin(a) * len - 0.002]], c.w * 0.003, '#ffffff', 0.07);
      }
    },
  },
  {
    id: 'knife', name: 'Palette knife', family: 'Paint',
    note: 'Slabs pushed flat with a blade. No blending anywhere, and the edges are where two colours simply stop.',
    draw: (c) => {
      paper(c, '#2e2820');
      for (const [x, y] of scatter(c, 620, 0.4)) {
        const a = c.slope(x, y).angle + Math.PI / 2;
        c.g.save();
        c.g.translate(c.X(x), c.Y(y));
        c.g.rotate(a);
        c.g.fillStyle = c.col(x, y);
        c.g.beginPath();
        c.g.moveTo(-c.w * 0.045, -c.w * 0.012);
        c.g.lineTo(c.w * 0.05, -c.w * 0.016);
        c.g.lineTo(c.w * 0.042, c.w * 0.014);
        c.g.lineTo(-c.w * 0.04, c.w * 0.01);
        c.g.closePath();
        c.g.fill();
        c.g.restore();
      }
    },
  },
  {
    id: 'pointillism', name: 'Pointillism', family: 'Paint',
    note: 'Unmixed colour in separate touches, left to mix in the eye rather than on the palette.',
    draw: (c) => {
      on(c, '#efe8d6');
      const hot = ['#e04a2f', '#f0a828', '#2f6fae', '#4f9a52', '#8e4a92'];
      for (let i = 0; i < 30000; i++) {
        const x = c.r();
        const y = c.r();
        const t = c.t(x, y);
        if (c.r() > Math.pow(t, 1.45) * 1.5) continue;
        const col = c.r() < 0.55 ? c.col(x, y) : hot[Math.floor(c.r() * hot.length)];
        dab(c, x, y, 0.0032, 0.0032, col, 0.85);
      }
    },
  },
  {
    id: 'divisionist', name: 'Divisionist', family: 'Paint',
    note: 'The same idea with a bigger brush: short bars of pure colour laid side by side.',
    draw: (c) => {
      on(c, '#e9e1cd');
      for (const [x, y] of scatter(c, 3600, 0.8)) {
        c.g.save();
        c.g.translate(c.X(x), c.Y(y));
        c.g.rotate(1.1);
        c.g.globalAlpha = 0.8;
        c.g.fillStyle = c.col(x, y);
        c.g.fillRect(-c.w * 0.004, -c.w * 0.011, c.w * 0.008, c.w * 0.022);
        c.g.restore();
      }
    },
  },
  {
    id: 'wetonwet', name: 'Wet on wet', family: 'Paint',
    note: 'Colour dropped into colour that has not dried. Nobody controls the edge and that is the reason to do it.',
    draw: (c) => {
      on(c, '#f2ecdd');
      for (let pass = 0; pass < 3; pass++) {
        for (const [x, y] of scatter(c, 260, 0.9)) {
          const rad = 0.03 + c.r() * 0.07;
          const pts: [number, number][] = [];
          for (let i = 0; i <= 26; i++) {
            const a = (i / 26) * Math.PI * 2;
            const rr = rad * (0.72 + Math.sin(a * 3 + x * 20) * 0.16 + c.r() * 0.2);
            pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr * (c.w / c.h)]);
          }
          c.g.save();
          c.g.globalAlpha = 0.2;
          c.g.fillStyle = c.col(x, y);
          c.g.beginPath();
          c.g.moveTo(c.X(pts[0][0]), c.Y(pts[0][1]));
          for (const p of pts) c.g.lineTo(c.X(p[0]), c.Y(p[1]));
          c.g.closePath();
          c.g.fill();
          c.g.restore();
        }
      }
    },
  },
  {
    id: 'sumi', name: 'Sumi-e', family: 'Paint',
    note: 'One loaded brush, and the tone from black to nothing in a single stroke. There is no correcting it.',
    draw: (c) => {
      on(c, '#efe9da');
      for (const [x, y] of scatter(c, 190, 1.4)) {
        const path = ride(c, [x, y], 26, 0.012, 0.2);
        for (let i = 1; i < path.length; i++) {
          const k = 1 - i / path.length;
          stroke(c, [path[i - 1], path[i]], c.w * (0.002 + k * 0.02), '#1a1714', 0.16 + k * 0.5);
        }
      }
    },
  },
  {
    id: 'airbrush', name: 'Airbrush', family: 'Paint',
    note: 'No edges at all unless a mask makes one. Everything is a gradient, which is either the point or the problem.',
    draw: (c) => {
      paper(c, '#151317');
      for (const [x, y] of scatter(c, 2600, 0.6)) {
        const rad = 0.012 + c.r() * 0.03;
        const g = c.g.createRadialGradient(c.X(x), c.Y(y), 0, c.X(x), c.Y(y), rad * c.w);
        const col = c.col(x, y);
        g.addColorStop(0, col.replace('rgb', 'rgba').replace(')', ',0.22)'));
        g.addColorStop(1, col.replace('rgb', 'rgba').replace(')', ',0)'));
        c.g.fillStyle = g;
        c.g.fillRect(c.X(x) - rad * c.w, c.Y(y) - rad * c.w, rad * c.w * 2, rad * c.w * 2);
      }
    },
  },
  {
    id: 'spray', name: 'Spray paint', family: 'Paint',
    note: 'A can held far enough back to fog and close enough to run. The drips are not a mistake, they are the clock.',
    draw: (c) => {
      paper(c, '#2c2c2e');
      // Paint is lighter than the wall, so the can goes where the picture is
      // light. Scattering by darkness sprays the wall its own colour, which
      // is a lot of work for a blank wall.
      for (const [x, y] of scatterLight(c, 18000, 1.5)) {
        const s = 0.0026 + c.r() * 0.003;
        dab(c, x, y, s, s, c.col(x, y), 0.45);
      }
      for (const [x, y] of scatterLight(c, 36, 2.2)) {
        stroke(c, [[x, y], [x, y + 0.05 + c.r() * 0.16]], c.w * 0.005, c.col(x, y), 0.55);
      }
    },
  },
  {
    id: 'pastel', name: 'Soft pastel', family: 'Paint',
    note: 'Pure pigment dragged over a toothed ground, so the paper shows through everything and unifies it.',
    draw: (c) => {
      paper(c, '#8c7f6a');
      for (const [x, y] of scatter(c, 4200, 0.7)) {
        const a = c.slope(x, y).angle + Math.PI / 2;
        stroke(c, [[x, y], [x + Math.cos(a) * 0.03, y + Math.sin(a) * 0.03]], c.w * 0.009, c.col(x, y), 0.3);
      }
    },
  },
  {
    id: 'conte', name: 'Conté on toned paper', family: 'Paint',
    note: 'Three sticks — black, white, sanguine — and the paper is the middle value. Half the work is already done.',
    draw: (c) => {
      paper(c, '#a08f76');
      for (const [x, y] of scatter(c, 3000, 1.5)) {
        const a = c.slope(x, y).angle + Math.PI / 2;
        stroke(c, [[x, y], [x + Math.cos(a) * 0.024, y + Math.sin(a) * 0.024]], c.w * 0.005, '#2a211c', 0.3);
      }
      for (let i = 0; i < 3000; i++) {
        const x = c.r();
        const y = c.r();
        if (c.t(x, y) > 0.34) continue;
        const a = c.slope(x, y).angle + Math.PI / 2;
        stroke(c, [[x, y], [x + Math.cos(a) * 0.02, y + Math.sin(a) * 0.02]], c.w * 0.005, '#efe6d2', 0.3);
      }
    },
  },
  {
    id: 'fresco', name: 'Fresco', family: 'Paint',
    note: 'Painted into wet plaster, so the colour is in the wall. What you see is mostly what has survived.',
    draw: (c) => {
      on(c, '#ddd2b8');
      // Painted into the plaster, so the colour is everywhere the wall is,
      // not only where it is dark. What is missing is what has fallen off.
      for (let i = 0; i < 9000; i++) {
        const x = c.r();
        const y = c.r();
        dab(c, x, y, 0.006, 0.006, c.col(x, y), 0.5);
      }
      for (let i = 0; i < 90; i++) {
        const x = c.r();
        const y = c.r();
        const pts: [number, number][] = [[x, y]];
        let a = c.r() * 6.3;
        for (let k = 0; k < 12; k++) {
          a += (c.r() - 0.5) * 0.9;
          pts.push([pts[k][0] + Math.cos(a) * 0.02, pts[k][1] + Math.sin(a) * 0.02]);
        }
        stroke(c, pts, c.w * 0.002, '#c6b99c', 0.6);
      }
    },
  },
  {
    id: 'encaustic', name: 'Encaustic', family: 'Paint',
    note: 'Pigment in hot wax. It goes on thick and translucent and every layer slightly veils the one beneath.',
    draw: (c) => {
      paper(c, '#e5dcc4');
      for (let pass = 0; pass < 4; pass++) {
        for (const [x, y] of scatter(c, 900, 0.8)) {
          c.g.save();
          c.g.globalAlpha = 0.16;
          c.g.fillStyle = c.col(x, y);
          c.g.beginPath();
          c.g.ellipse(c.X(x), c.Y(y), c.w * (0.01 + c.r() * 0.02), c.w * 0.012, c.r() * 3, 0, Math.PI * 2);
          c.g.fill();
          c.g.restore();
        }
      }
    },
  },
  {
    id: 'tempera', name: 'Egg tempera', family: 'Paint',
    note: 'It dries in seconds, so it cannot be blended — the modelling is done by laying one fine hatch over another.',
    draw: (c) => {
      on(c, '#e7ddc4');
      // Three hatches over the whole panel, each carrying the local colour.
      // Biasing them towards the darks builds the shadows and never paints
      // the light, which is the one thing tempera is actually good at.
      for (let pass = 0; pass < 3; pass++) {
        const a = -0.5 + pass * 0.6;
        for (let i = 0; i < 6000; i++) {
          const x = c.r();
          const y = c.r();
          stroke(c, [[x, y], [x + Math.cos(a) * 0.018, y + Math.sin(a) * 0.018]], c.w * 0.003, c.col(x, y), 0.42);
        }
      }
    },
  },
];

// ----------------------------------------------------------------- system

const SYSTEM: Style[] = [
  {
    id: 'voronoi', name: 'Voronoi', family: 'System',
    note: 'Every pixel takes the colour of the nearest seed, and the seeds are scattered where the picture is dark.',
    draw: (c) => {
      const seeds = scatter(c, 320, 0.9).concat(Array.from({ length: 60 }, () => [c.r(), c.r()] as [number, number]));
      const n = 150;
      const rows = Math.round(n * (c.h / c.w));
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < n; i++) {
          const x = (i + 0.5) / n;
          const y = (j + 0.5) / rows;
          let bd = 9;
          let bp = seeds[0];
          for (const p of seeds) {
            const d = (p[0] - x) ** 2 + (p[1] - y) ** 2;
            if (d < bd) { bd = d; bp = p; }
          }
          box(c, x - 0.004, y - 0.004, 0.0088, 0.0088, c.col(bp[0], bp[1]));
        }
      }
    },
  },
  {
    id: 'delaunay', name: 'Delaunay', family: 'System',
    note: 'The dual of the same scatter: the seeds joined into triangles rather than fenced into cells.',
    draw: (c) => {
      paper(c, '#12100e');
      // Seeds pulled towards the edges, where a triangulation has something
      // to say, and enough of them that the net itself is a tonal field. Each
      // edge takes the colour under its middle: on a black ground the pale
      // side of the face lights up and the dark side stays out of it, so the
      // picture is in the mesh rather than behind it.
      const seeds: [number, number][] = [];
      // Pulled towards the edges but not piled onto them. At a strong bias
      // every seed lands on the same few contours, each finds its three
      // nearest a pixel away, and the plate is a handful of tight clumps
      // with nothing between them.
      for (let guard = 0; seeds.length < 820 && guard < 60000; guard++) {
        const x = c.r();
        const y = c.r();
        const m = Math.min(1, c.slope(x, y).mag * 3.4);
        if (c.r() < 0.45 + m * 0.55) seeds.push([x, y]);
      }
      for (const p of seeds) {
        // Three nearest, tracked in place. Sorting six hundred distances six
        // hundred times is a quarter of a second nobody asked for.
        const best: [number, number][] = [];
        const d3 = [Infinity, Infinity, Infinity];
        for (const q of seeds) {
          if (q === p) continue;
          const d = (q[0] - p[0]) ** 2 + (q[1] - p[1]) ** 2;
          if (d >= d3[2]) continue;
          const k = d < d3[0] ? 0 : d < d3[1] ? 1 : 2;
          d3.splice(k, 0, d);
          d3.length = 3;
          best.splice(k, 0, q);
          best.length = 3;
        }
        for (const q of best) {
          const mx = (p[0] + q[0]) / 2;
          const my = (p[1] + q[1]) / 2;
          // Colour alone will not do it: on a black ground almost every edge
          // is a dark edge, and lifting them all towards cream to make them
          // visible flattens the one difference that matters. Let the weight
          // carry it instead — the lit side thick and opaque, the shadow a
          // whisper — and leave the colour where the source put it.
          const b = 1 - c.t(mx, my);
          stroke(c, [p, q], c.w * (0.0008 + b * b * 0.0032), c.col(mx, my), 0.22 + b * 0.78);
        }
      }
    },
  },
  {
    id: 'packing', name: 'Circle packing', family: 'System',
    note: 'Discs dropped largest first and shrunk until they fit. Detail happens where they had to get small.',
    draw: (c) => {
      on(c, '#f0e9d8');
      const placed: [number, number, number][] = [];
      for (let i = 0; i < 2600; i++) {
        const x = c.r();
        const y = c.r();
        const t = c.t(x, y);
        let rad = 0.004 + (1 - t) * 0.03;
        for (const [px2, py2, pr] of placed) {
          const d = Math.hypot(px2 - x, py2 - y) - pr;
          if (d < rad) rad = d;
        }
        if (rad < 0.003) continue;
        placed.push([x, y, rad]);
        dab(c, x, y, rad * 0.94, rad * 0.94, c.col(x, y), 0.95);
      }
    },
  },
  {
    id: 'flowfield', name: 'Flow field', family: 'System',
    note: 'Particles released into the picture and steered by its gradient. They pile up where the tone changes fastest.',
    draw: (c) => {
      paper(c, '#100f12');
      for (let i = 0; i < 1400; i++) {
        const start: [number, number] = [c.r(), c.r()];
        const path = ride(c, start, 80, 0.005, 0.06);
        stroke(c, path, c.w * 0.0016, c.col(start[0], start[1]), 0.4);
      }
    },
  },
  {
    id: 'contourmap', name: 'Contour map', family: 'System',
    note: 'Isolines at even intervals of tone, exactly as a hill is drawn on a survey sheet.',
    draw: (c) => {
      on(c, '#efe9d6');
      const n = 250;
      const rows = Math.round(n * (c.h / c.w));
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < n; i++) {
          const x = (i + 0.5) / n;
          const y = (j + 0.5) / rows;
          const a = Math.floor(c.t(x, y) * 11);
          const b = Math.floor(c.t(x + 1 / n, y) * 11);
          const d = Math.floor(c.t(x, y + 1 / rows) * 11);
          if (a !== b || a !== d) dab(c, x, y, 0.0018, 0.0018, '#2c4a3e', 0.85);
        }
      }
    },
  },
  {
    id: 'scanlines', name: 'Scan lines', family: 'System',
    note: 'One horizontal trace per line, its height pushed by the brightness underneath it.',
    draw: (c) => {
      paper(c, '#0b0d10');
      // Displacement alone reads as a wobble in a green field. The beam also
      // has to burn brighter and wider where it is hot, which means the trace
      // is drawn a segment at a time rather than as one polyline per row.
      for (let k = 0.01; k < 1; k += 0.0125) {
        for (let x = 0; x < 1; x += 0.006) {
          const b0 = 1 - c.t(x, k);
          const b1 = 1 - c.t(Math.min(1, x + 0.006), k);
          const b = (b0 + b1) / 2;
          stroke(
            c,
            [[x, k - b0 * 0.009], [x + 0.006, k - b1 * 0.009]],
            c.w * (0.0012 + b * b * 0.005),
            '#7fe6c8',
            0.2 + b * 0.75,
          );
        }
      }
    },
  },
  {
    id: 'crt', name: 'CRT', family: 'System',
    note: 'A shadow mask of red, green and blue stripes, and the picture only in how brightly each one is lit.',
    draw: (c) => {
      paper(c, '#07070a');
      const n = 108;
      const rows = Math.round(n * (c.h / c.w));
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < n; i++) {
          const x = (i + 0.5) / n;
          const y = (j + 0.5) / rows;
          const [rr, gg, bb] = [0, 1, 2].map((k) => {
            const px2 = x + (k - 1) * (0.33 / n);
            const v = 1 - c.t(px2, y);
            return v;
          });
          const cols = [`rgba(255,60,60,${rr})`, `rgba(60,255,90,${gg})`, `rgba(70,110,255,${bb})`];
          for (let k = 0; k < 3; k++) {
            box(c, x - 0.0042 + k * 0.0028, y - 0.0044, 0.0024, 0.0072, cols[k]);
          }
        }
      }
    },
  },
  {
    id: 'glitch', name: 'Glitch', family: 'System',
    note: 'Rows displaced and the channels pulled apart, which is what a corrupted scanline actually looks like.',
    draw: (c) => {
      paper(c, '#0d0c10');
      for (let y = 0; y < 1; y += 0.004) {
        const shove = c.r() < 0.08 ? (c.r() - 0.5) * 0.14 : 0;
        for (let x = 0; x < 1; x += 0.004) {
          const [rr, gg, bb] = [0, 1, 2].map((k) => 1 - c.t(x + shove + (k - 1) * 0.006, y));
          box(c, x, y, 0.0045, 0.0045, `rgb(${rr * 255},${gg * 235},${bb * 250})`);
        }
      }
    },
  },
  {
    id: 'dither', name: 'Error diffusion', family: 'System',
    note: 'One bit per pixel, and the error from each decision pushed onto the neighbours that have not been decided yet.',
    draw: (c) => {
      paper(c, '#f2ecdc');
      const n = 150;
      const rows = Math.round(n * (c.h / c.w));
      const buf = new Float32Array(n * rows);
      for (let j = 0; j < rows; j++) for (let i = 0; i < n; i++) buf[j * n + i] = c.t((i + 0.5) / n, (j + 0.5) / rows);
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < n; i++) {
          const old = buf[j * n + i];
          const nu = old > 0.5 ? 1 : 0;
          const err = old - nu;
          if (i + 1 < n) buf[j * n + i + 1] += err * 0.4375;
          if (j + 1 < rows) {
            if (i > 0) buf[(j + 1) * n + i - 1] += err * 0.1875;
            buf[(j + 1) * n + i] += err * 0.3125;
            if (i + 1 < n) buf[(j + 1) * n + i + 1] += err * 0.0625;
          }
          if (nu) box(c, i / n, j / rows, 1 / n + 0.001, 1 / rows + 0.001, '#141210');
        }
      }
    },
  },
  {
    id: 'bayer', name: 'Ordered dither', family: 'System',
    note: 'A fixed four-by-four threshold matrix. No memory, no diffusion, and a texture you can recognise across a room.',
    draw: (c) => {
      paper(c, '#f0e9d6');
      const m = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
      const n = 156;
      const rows = Math.round(n * (c.h / c.w));
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < n; i++) {
          const t = c.t((i + 0.5) / n, (j + 0.5) / rows);
          if (t * 17 > m[(j % 4) * 4 + (i % 4)]) box(c, i / n, j / rows, 1 / n + 0.001, 1 / rows + 0.001, '#171310');
        }
      }
    },
  },
  {
    id: 'ascii', name: 'ASCII', family: 'System',
    note: 'A ramp of characters ordered by how much of the cell each one fills, which is a halftone screen made of type.',
    draw: (c) => {
      paper(c, '#0e0e10');
      const ramp = ' .:-=+*#%@';
      const n = 74;
      const rows = Math.round(n * (c.h / c.w) * 0.52);
      c.g.font = `${(c.w / n) * 1.5}px ui-monospace, Menlo, monospace`;
      c.g.textBaseline = 'middle';
      c.g.textAlign = 'center';
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < n; i++) {
          const x = (i + 0.5) / n;
          const y = (j + 0.5) / rows;
          const ch = ramp[Math.min(9, Math.floor(c.t(x, y) * 10))];
          if (ch === ' ') continue;
          c.g.fillStyle = '#c8e0b8';
          c.g.fillText(ch, c.X(x), c.Y(y));
        }
      }
    },
  },
  {
    id: 'pixel', name: 'Pixel art', family: 'System',
    note: 'Sixty-four across and a palette of eight. Every pixel is a decision because there are so few of them.',
    draw: (c) => {
      const pal = ['#12100f', '#3a2b28', '#6b4a3c', '#a9765a', '#d8a887', '#efd7b8', '#2b3550', '#c8442f'];
      const n = 60;
      const rows = Math.round(n * (c.h / c.w));
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < n; i++) {
          const x = (i + 0.5) / n;
          const y = (j + 0.5) / rows;
          const t = c.t(x, y);
          const k = c.region(x, y) === Region.Neon ? 7 : Math.min(5, Math.floor((1 - t) * 6));
          box(c, i / n, j / rows, 1 / n + 0.001, 1 / rows + 0.001, pal[k]);
        }
      }
    },
  },
  {
    id: 'wireframe', name: 'Wireframe', family: 'System',
    note: 'A mesh laid over the tone and displaced by it, so the surface is described by the deformation of a grid.',
    draw: (c) => {
      paper(c, '#0d1016');
      const n = 40;
      const cols = Math.round(n * 1.2);
      // Displaced by more than the grid spacing, the mesh folds through
      // itself and every row lands on some other row. Keep the lift under
      // one cell and let the wire also brighten where the surface rises.
      const off = (x: number, y: number): [number, number] => [x, y - (1 - c.t(x, y)) * 0.021];
      const wire = (pts: [number, number][], warm: boolean) => {
        for (let i = 1; i < pts.length; i++) {
          const b = 1 - c.t(pts[i][0], pts[i][1] + 0.016);
          stroke(c, [pts[i - 1], pts[i]], c.w * (0.0006 + b * b * 0.0036), warm ? '#63d4c2' : '#3f8ea8', 0.08 + b * b * 0.85);
        }
      };
      for (let j = 0; j <= n; j++) {
        const pts: [number, number][] = [];
        for (let i = 0; i <= cols; i++) pts.push(off(i / cols, j / n));
        wire(pts, true);
      }
      for (let i = 0; i <= cols; i += 2) {
        const pts: [number, number][] = [];
        for (let j = 0; j <= n; j++) pts.push(off(i / cols, j / n));
        wire(pts, false);
      }
    },
  },
  {
    id: 'slitscan', name: 'Slit scan', family: 'System',
    note: 'One column of the picture at a time, each taken a moment later, so the frame is smeared through time.',
    draw: (c) => {
      paper(c, '#101014');
      for (let x = 0; x < 1; x += 0.0035) {
        const shift = Math.sin(x * 9) * 0.06;
        for (let y = 0; y < 1; y += 0.0035) {
          box(c, x, y, 0.004, 0.004, c.col(x, y + shift));
        }
      }
    },
  },
  {
    id: 'moire', name: 'Moiré', family: 'System',
    note: 'Two fine rulings at a small angle. Neither carries the picture; the interference between them does.',
    draw: (c) => {
      paper(c, '#f0ead8');
      // Stepping along a near-vertical line by its own arc length covers
      // almost no height at all — the old ruling ran out after three per cent
      // of the card. Step down y and let x follow.
      const rule = (lean: number, bend: number) => {
        for (let k = -0.3; k < 1.3; k += 0.0075) {
          const pts: [number, number][] = [];
          for (let y = 0; y <= 1; y += 0.005) {
            const x = k + y * lean;
            pts.push([x + c.t(Math.min(1, Math.max(0, x)), y) * bend, y]);
          }
          stroke(c, pts, c.w * 0.0022, '#191712', 0.45);
        }
      };
      rule(0.06, 0);
      rule(-0.06, 0.02);
    },
  },
  {
    id: 'string', name: 'String art', family: 'System',
    note: 'One thread wound between pins on a hoop. Tone is how many times the thread happened to cross that spot.',
    draw: (c) => {
      paper(c, '#efe7d4');
      const pins: [number, number][] = [];
      for (let i = 0; i < 200; i++) {
        const a = (i / 200) * Math.PI * 2;
        pins.push([0.5 + Math.cos(a) * 0.47, 0.46 + Math.sin(a) * 0.47 * (c.w / c.h)]);
      }
      // The thread has to spend the tone as it lays it down. Scored against
      // the picture itself, every chord is judged by the same unchanged darks
      // and the winder keeps re-crossing them: fifteen hundred threads and a
      // ball of wool. Scored against what is *left*, it fills and moves on.
      const N = 72;
      const res = new Float32Array(N * N);
      for (let j = 0; j < N; j++) {
        for (let i = 0; i < N; i++) res[j * N + i] = c.t((i + 0.5) / N, (j + 0.5) / N);
      }
      const cell = (x: number, y: number) =>
        Math.min(N - 1, Math.max(0, Math.floor(y * N))) * N + Math.min(N - 1, Math.max(0, Math.floor(x * N)));
      let at = 0;
      for (let i = 0; i < 900; i++) {
        let best = -1;
        let bs = 0;
        for (let k = 0; k < 40; k++) {
          const j = Math.floor(c.r() * pins.length);
          if (j === at) continue;
          let sum = 0;
          for (let t = 0; t <= 12; t++) {
            const u = t / 12;
            sum += res[cell(pins[at][0] + (pins[j][0] - pins[at][0]) * u, pins[at][1] + (pins[j][1] - pins[at][1]) * u)];
          }
          if (sum > bs) { bs = sum; best = j; }
        }
        if (best < 0) break;
        for (let t = 0; t <= 26; t++) {
          const u = t / 26;
          const ix = cell(pins[at][0] + (pins[best][0] - pins[at][0]) * u, pins[at][1] + (pins[best][1] - pins[at][1]) * u);
          res[ix] = Math.max(0, res[ix] - 0.045);
        }
        stroke(c, [pins[at], pins[best]], c.w * 0.0012, '#1b1815', 0.15);
        at = best;
      }
    },
  },
  {
    id: 'seismo', name: 'Seismograph', family: 'System',
    note: 'A row of pens that only wobble where there is something to report.',
    draw: (c) => {
      paper(c, '#f2ecdb');
      for (let k = 0.015; k < 1; k += 0.021) {
        const pts: [number, number][] = [];
        for (let x = 0; x <= 1; x += 0.0025) {
          const t = c.t(x, k);
          pts.push([x, k + Math.sin(x * 260) * t * t * 0.012]);
        }
        stroke(c, pts, c.w * 0.0022, '#1d1a16', 0.9);
      }
    },
  },
  {
    id: 'truchet', name: 'Truchet tiles', family: 'System',
    note: 'One tile with two arcs on it, dropped in a grid at random quarter turns. Continuous curves emerge from nothing.',
    draw: (c) => {
      paper(c, '#efe8d5');
      const n = 42;
      const rows = Math.round(n * (c.h / c.w));
      const s = c.w / n;
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < n; i++) {
          const x = (i + 0.5) / n;
          const y = (j + 0.5) / rows;
          const t = c.t(x, y);
          c.g.save();
          c.g.translate(i * s, (j * c.h) / rows);
          if (c.r() < 0.5) { c.g.translate(s, 0); c.g.scale(-1, 1); }
          c.g.strokeStyle = '#1c1815';
          c.g.lineWidth = 1 + t * s * 0.42;
          c.g.beginPath();
          c.g.arc(0, 0, s / 2, 0, Math.PI / 2);
          c.g.moveTo(s, s);
          c.g.arc(s, s, s / 2, Math.PI, Math.PI * 1.5);
          c.g.stroke();
          c.g.restore();
        }
      }
    },
  },
  {
    id: 'maze', name: 'Maze', family: 'System',
    note: 'Each cell gets one of two diagonals, chosen by whether it is lighter or darker than its neighbour.',
    draw: (c) => {
      paper(c, '#f1ead7');
      const n = 66;
      const rows = Math.round(n * (c.h / c.w));
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < n; i++) {
          const x = i / n;
          const y = j / rows;
          const t = c.t(x + 0.5 / n, y + 0.5 / rows);
          const dir = ((i * 7 + j * 13) % 11) / 11 < t;
          const a: [number, number] = dir ? [x, y] : [x + 1 / n, y];
          const b: [number, number] = dir ? [x + 1 / n, y + 1 / rows] : [x, y + 1 / rows];
          stroke(c, [a, b], c.w * (0.0016 + t * 0.0028), '#1a1714', 0.18 + t * 0.8);
        }
      }
    },
  },
  {
    id: 'growth', name: 'Differential growth', family: 'System',
    note: 'A closed line that keeps adding points and pushing them apart. It buckles where it has run out of room.',
    draw: (c) => {
      paper(c, '#f0e9d7');
      // One ring per cell, each running the real algorithm: pulled towards
      // its neighbours, pushed off anything within its personal distance, and
      // handed more points than the circle it started as can hold. It has to
      // buckle, and how many times it buckles is the tone — a light cell gets
      // a dozen points and stays nearly round, a dark one gets forty and
      // crenellates until it is almost solid.
      //
      // Two earlier versions of this printed a blank card and then a black
      // egg. The first pushed each point *away* from its neighbours, which
      // amplifies curvature every step and reaches infinity in about forty of
      // them. The second grew one ring for the whole picture, which spends
      // its entire point budget in the first dark thing it touches.
      const cols = 18;
      const rows = Math.round(cols * (c.h / c.w));
      const CAP = 48;
      const px = new Float64Array(CAP);
      const py = new Float64Array(CAP);
      const nx = new Float64Array(CAP);
      const ny = new Float64Array(CAP);
      const squash = c.w / c.h;
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          const cx = (i + 0.5) / cols;
          const cy = (j + 0.5) / rows;
          const t = c.t(cx, cy);
          // Two properties riding the tone, not one. How many times the ring
          // buckles is the interesting half, but on its own a taut knot and a
          // slack circle are the same amount of ink; the cell it fills has to
          // grow with the tone as well or the plate reads as wallpaper.
          const R = (0.72 / cols) * (0.3 + t * 1.0) * (0.85 + c.r() * 0.3);
          const want = Math.min(CAP, 10 + Math.round(t * 34));
          // Loose enough that the finished ring cannot lie flat inside R.
          const near = ((2 * Math.PI * R) / want) * 1.45;
          const near2 = near * near;
          let m = 10;
          for (let k = 0; k < m; k++) {
            const a = (k / m) * Math.PI * 2;
            px[k] = cx + Math.cos(a) * R * 0.4;
            py[k] = cy + Math.sin(a) * R * 0.4 * squash;
          }
          for (let step = 0; step < 34; step++) {
            for (let k = 0; k < m; k++) {
              const before = (k - 1 + m) % m;
              const after = (k + 1) % m;
              let mvx = ((px[before] + px[after]) / 2 - px[k]) * 0.35;
              let mvy = ((py[before] + py[after]) / 2 - py[k]) * 0.35;
              for (let q = 0; q < m; q++) {
                if (q === k) continue;
                const dx = px[k] - px[q];
                const dy = py[k] - py[q];
                const d2 = dx * dx + dy * dy;
                if (d2 >= near2 || d2 < 1e-12) continue;
                const d = Math.sqrt(d2);
                mvx += (dx / d) * (near - d) * 0.42;
                mvy += (dy / d) * (near - d) * 0.42;
              }
              // A weak outward pressure that gives up at the cell wall, so
              // the ring fills its cell and then has to fold instead of grow.
              const ox = px[k] - cx;
              const oy = (py[k] - cy) / squash;
              const od = Math.sqrt(ox * ox + oy * oy) || 1;
              const out = 0.55 * near * Math.max(0, 1 - od / R);
              nx[k] = px[k] + mvx + (ox / od) * out;
              ny[k] = py[k] + mvy + (oy / od) * out * squash;
            }
            let w = 0;
            for (let k = 0; k < m && w < want; k++) {
              px[w] = nx[k];
              py[w] = ny[k];
              w++;
              const after = (k + 1) % m;
              const gx = nx[after] - nx[k];
              const gy = ny[after] - ny[k];
              if (w < want && gx * gx + gy * gy > near2 * 0.36) {
                px[w] = (nx[k] + nx[after]) / 2;
                py[w] = (ny[k] + ny[after]) / 2;
                w++;
              }
            }
            m = w;
          }
          const ring: [number, number][] = [];
          for (let k = 0; k < m; k++) ring.push([px[k], py[k]]);
          ring.push(ring[0]);
          // Past about half tone the ring is dense enough that the paper
          // inside it is doing nothing but glowing, so close it up.
          if (t > 0.5) {
            c.g.save();
            c.g.globalAlpha = (t - 0.5) * 1.3;
            c.g.fillStyle = '#1b1815';
            c.g.beginPath();
            c.g.moveTo(c.X(ring[0][0]), c.Y(ring[0][1]));
            for (let k = 1; k < ring.length; k++) c.g.lineTo(c.X(ring[k][0]), c.Y(ring[k][1]));
            c.g.closePath();
            c.g.fill();
            c.g.restore();
          }
          stroke(c, ring, c.w * 0.0024, '#1b1815', 0.35 + t * 0.6);
        }
      }
    },
  },
];

// ------------------------------------------------------------------ craft

const CRAFT: Style[] = [
  {
    id: 'embroidery', name: 'Embroidery', family: 'Craft',
    note: 'Long and short stitch, worked in the direction of the form. The sheen changes with the angle, which is why it moves.',
    draw: (c) => {
      paper(c, '#e2d8c0');
      for (const [x, y] of scatter(c, 5200, 0.9)) {
        const a = c.slope(x, y).angle + Math.PI / 2 + (c.r() - 0.5) * 0.2;
        const len = 0.012 + c.r() * 0.014;
        stroke(c, [[x, y], [x + Math.cos(a) * len, y + Math.sin(a) * len]], c.w * 0.0032, c.col(x, y), 0.9);
        stroke(c, [[x, y - 0.0008], [x + Math.cos(a) * len * 0.6, y + Math.sin(a) * len * 0.6 - 0.0008]], c.w * 0.001, '#ffffff', 0.18);
      }
    },
  },
  {
    id: 'crossstitch', name: 'Cross stitch', family: 'Craft',
    note: 'One X per square of aida, one colour per X. The grid is not hidden and is not meant to be.',
    draw: (c) => {
      paper(c, '#ded3b8');
      const n = 52;
      const rows = Math.round(n * (c.h / c.w));
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < n; i++) {
          const x = (i + 0.5) / n;
          const y = (j + 0.5) / rows;
          if (c.t(x, y) < 0.1) continue;
          const s = 0.42 / n;
          const col = c.col(x, y);
          stroke(c, [[x - s, y - s * (c.w / c.h)], [x + s, y + s * (c.w / c.h)]], c.w * 0.0034, col);
          stroke(c, [[x + s, y - s * (c.w / c.h)], [x - s, y + s * (c.w / c.h)]], c.w * 0.0034, col);
        }
      }
    },
  },
  {
    id: 'weaving', name: 'Weaving', family: 'Craft',
    note: 'Warp one way, weft the other, and the picture is only ever in which thread is on top.',
    draw: (c) => {
      paper(c, '#2b261e');
      const n = 62;
      const rows = Math.round(n * (c.h / c.w));
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < n; i++) {
          const x = (i + 0.5) / n;
          const y = (j + 0.5) / rows;
          const over = (i + j) % 2 === 0;
          const t = c.t(x, y);
          const col = over ? c.col(x, y) : mix(c.col(x, y), '#241f19', 0.45);
          if (over) box(c, i / n, j / rows + 0.0012, 1 / n, 1 / rows - 0.0024, col);
          else box(c, i / n + 0.0012, j / rows, 1 / n - 0.0024, 1 / rows, col);
          void t;
        }
      }
    },
  },
  {
    id: 'knitting', name: 'Knitting', family: 'Craft',
    note: 'Every stitch is a little V pulled through the row below, which is why knitted pictures are always slightly stretched.',
    draw: (c) => {
      paper(c, '#d9cfb6');
      const n = 44;
      const rows = Math.round(n * (c.h / c.w) * 0.8);
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < n; i++) {
          const x = (i + 0.5) / n;
          const y = (j + 0.5) / rows;
          const col = c.col(x, y);
          const s = 0.5 / n;
          stroke(c, [[x - s, y - s * 0.8], [x, y + s * 0.9], [x + s, y - s * 0.8]], c.w * 0.006, col, 0.95);
        }
      }
    },
  },
  {
    id: 'beadwork', name: 'Beadwork', family: 'Craft',
    note: 'Seed beads in rows, each one a bright point of one colour. Nothing is blended and it does not need to be.',
    draw: (c) => {
      paper(c, '#1d1a16');
      const n = 56;
      const rows = Math.round(n * (c.h / c.w));
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < n; i++) {
          const x = (i + 0.5 + (j % 2) * 0.5) / n;
          const y = (j + 0.5) / rows;
          dab(c, x, y, 0.4 / n, 0.4 / n, c.col(x, y));
          dab(c, x - 0.15 / n, y - 0.15 / n, 0.14 / n, 0.14 / n, '#ffffff', 0.4);
        }
      }
    },
  },
  {
    id: 'batik', name: 'Batik', family: 'Craft',
    note: 'Wax resists the dye, then cracks, and the dye runs into the cracks. The crackle is the signature.',
    draw: (c) => {
      on(c, '#e9dcb8');
      grid(c, 130, (x, y, t) => {
        const q = steps(t, 4);
        if (q > 0.2) box(c, x - 0.0042, y - 0.0042, 0.009, 0.009, ['#e9dcb8', '#b98b3f', '#7d3a28', '#221a16'][Math.round(q * 3)]);
      });
      for (let i = 0; i < 130; i++) {
        const pts: [number, number][] = [[c.r(), c.r()]];
        let a = c.r() * 6.3;
        for (let k = 0; k < 16; k++) {
          a += (c.r() - 0.5) * 0.6;
          pts.push([pts[k][0] + Math.cos(a) * 0.022, pts[k][1] + Math.sin(a) * 0.022]);
        }
        stroke(c, pts, c.w * 0.0015, '#231b15', 0.5);
      }
    },
  },
  {
    id: 'woodgrain', name: 'Wood grain', family: 'Craft',
    note: 'Burnt into board, so the tone is how long the iron rested and the grain runs through regardless.',
    draw: (c) => {
      paper(c, '#d9b783');
      for (let k = 0; k < 1; k += 0.006) {
        const pts: [number, number][] = [];
        for (let y = 0; y <= 1; y += 0.01) pts.push([k + Math.sin(y * 7 + k * 30) * 0.01, y]);
        stroke(c, pts, c.w * 0.0022, '#a8814e', 0.35);
      }
      // Burning is cumulative and one-way: brown where the iron passed, black
      // where it rested. At a quarter opacity it is board with a rumour on it.
      for (const [x, y] of scatter(c, 15000, 1.5)) {
        const t = c.t(x, y);
        const s = 0.004 + c.r() * 0.004;
        dab(c, x, y, s, s * 0.55, t > 0.62 ? '#2a170a' : '#6b4218', 0.22 + t * 0.5);
      }
    },
  },
  {
    id: 'neon', name: 'Neon tube', family: 'Craft',
    note: 'Bent glass: a line of one thickness that can only glow, never shade. The drawing has to be all contour.',
    draw: (c) => {
      paper(c, '#0a0a10');
      for (const [x, y] of scatter(c, 260, 1.6)) {
        const s = c.slope(x, y);
        if (s.mag < 0.07) continue;
        const path = ride(c, [x, y], 20, 0.009, 0.06);
        const hue = c.region(x, y) === Region.Hair ? '#4a7bff' : '#ff4d7a';
        stroke(c, path, c.w * 0.016, hue, 0.1);
        stroke(c, path, c.w * 0.008, hue, 0.28);
        stroke(c, path, c.w * 0.0026, '#fff4ff', 0.92);
      }
    },
  },
  {
    id: 'chalkboard', name: 'Chalk on slate', family: 'Craft',
    note: 'Light on dark, and every mark is dust sitting on a surface it has not stained.',
    draw: (c) => {
      paper(c, '#22322e');
      // Chalk is light on dark, so it goes where the picture is light. The
      // old pass scattered by darkness and then discarded everything dark,
      // which is a great deal of arithmetic to arrive at an empty board.
      for (const [x, y] of scatterLight(c, 9000, 1.6)) {
        const b = 1 - c.t(x, y);
        const a = c.slope(x, y).angle + Math.PI / 2;
        const len = 0.008 + b * 0.024;
        stroke(c, [[x, y], [x + Math.cos(a) * len, y + Math.sin(a) * len]], c.w * 0.004, '#e6e8dd', 0.08 + b * 0.34);
      }
    },
  },
  {
    id: 'sand', name: 'Sand', family: 'Craft',
    note: 'Poured, not drawn. The lightest touch is a thin line and the darkest is a heap.',
    draw: (c) => {
      paper(c, '#3a332a');
      for (const [x, y] of scatter(c, 34000, 2.6)) {
        const t = c.t(x, y);
        dab(c, x, y, 0.0014 + t * 0.0018, 0.0014, c.r() < 0.5 ? '#e6d3ac' : '#c2a877', 0.35 + t * 0.5);
      }
    },
  },
  {
    id: 'rangoli', name: 'Rangoli', family: 'Craft',
    note: 'Coloured powder laid on a grid of dots at the threshold, and swept away at the end of the day.',
    draw: (c) => {
      paper(c, '#2a231d');
      const n = 40;
      const rows = Math.round(n * (c.h / c.w));
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < n; i++) {
          const x = (i + 0.5 + (j % 2) * 0.5) / n;
          const y = (j + 0.5) / rows;
          const t = c.t(x, y);
          const pal = ['#f2e2b8', '#e8a13c', '#d1452f', '#7a3f8e', '#2f6f8e'];
          const col = pal[Math.min(4, Math.floor(t * 5))];
          const petals = 6;
          for (let k = 0; k < petals; k++) {
            const a = (k / petals) * Math.PI * 2;
            dab(c, x + Math.cos(a) * (0.3 / n) * t, y + Math.sin(a) * (0.3 / n) * t, 0.2 / n * (0.3 + t), 0.2 / n * (0.3 + t), col, 0.9);
          }
        }
      }
    },
  },
  {
    id: 'mehndi', name: 'Mehndi', family: 'Craft',
    note: 'A fine cone of paste, one continuous line, and every space that opens up gets filled with a smaller pattern.',
    draw: (c) => {
      paper(c, '#e8d3b4');
      for (const [x, y] of scatter(c, 2000, 1.8)) {
        const t = c.t(x, y);
        const a = c.slope(x, y).angle + Math.PI / 2;
        const pts: [number, number][] = [];
        // A long fat petal in the darks and a short thin one in the lights.
        // At a bias of three the cone never reaches the lit side at all, so
        // the whole hand is pattern and none of it is a face.
        const len = 0.012 + t * 0.046;
        for (let i = 0; i <= 12; i++) {
          const u = i / 12;
          const swell = Math.sin(u * Math.PI) * (0.004 + t * 0.012);
          pts.push([x + Math.cos(a) * u * len + Math.cos(a + 1.57) * swell, y + Math.sin(a) * u * len + Math.sin(a + 1.57) * swell]);
        }
        stroke(c, pts, c.w * 0.0022, '#5a2d15', 0.25 + t * 0.65);
        dab(c, x, y, 0.0026 + t * 0.003, 0.0026, '#5a2d15', 0.8);
      }
    },
  },
  {
    id: 'kolam', name: 'Kolam', family: 'Craft',
    note: 'Rice flour looped around a lattice of dots without ever crossing the dots themselves.',
    draw: (c) => {
      paper(c, '#3a3128');
      const n = 34;
      const rows = Math.round(n * (c.h / c.w));
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < n; i++) {
          const x = (i + 0.5) / n;
          const y = (j + 0.5) / rows;
          const t = c.t(x, y);
          if (t < 0.18) continue;
          const s = (0.5 / n) * (0.15 + t * 1.5);
          const pts: [number, number][] = [];
          for (let k = 0; k <= 18; k++) {
            const a = (k / 18) * Math.PI * 2;
            pts.push([x + Math.cos(a) * s, y + Math.sin(a) * s * (c.w / c.h)]);
          }
          stroke(c, pts, c.w * (0.0012 + t * 0.0026), '#f0e8d6', 0.25 + t * 0.7);
        }
      }
    },
  },
  {
    id: 'tattoo', name: 'Tattoo flash', family: 'Craft',
    note: 'Heavy black outline, one solid fill, and the shading done entirely in whip-shaded dots.',
    draw: (c) => {
      on(c, '#efe4cd');
      for (const [x, y] of scatter(c, 420, 1.8)) {
        const s = c.slope(x, y);
        if (s.mag < 0.09) continue;
        stroke(c, ride(c, [x, y], 16, 0.008, 0.05), c.w * 0.007, '#12100e', 0.95);
      }
      for (const [x, y] of scatter(c, 5000, 2.4)) dab(c, x, y, 0.0018, 0.0018, '#12100e', 0.5);
    },
  },
  {
    id: 'blueprint', name: 'Blueprint', family: 'Craft',
    note: 'White lines on cyanotype blue, with a grid underneath that belongs to the paper rather than the subject.',
    draw: (c) => {
      paper(c, '#153a6b');
      for (let k = 0; k <= 1; k += 0.05) {
        stroke(c, [[k, 0], [k, 1]], c.w * 0.0012, '#ffffff', 0.1);
        stroke(c, [[0, k], [1, k]], c.w * 0.0012, '#ffffff', 0.1);
      }
      for (const [x, y] of scatter(c, 1100, 1.6)) {
        if (c.slope(x, y).mag < 0.05) continue;
        stroke(c, ride(c, [x, y], 14, 0.008, 0.05), c.w * 0.0022, '#dceafc', 0.8);
      }
    },
  },
  {
    id: 'xray', name: 'Radiograph', family: 'Craft',
    note: 'Density rather than light: the negative, with the bright places being where least got through.',
    draw: (c) => {
      paper(c, '#07090c');
      grid(c, 190, (x, y, t) => {
        const v = Math.pow(t, 0.7);
        box(c, x - 0.003, y - 0.003, 0.0064, 0.0064, `rgb(${v * 190},${v * 210},${v * 235})`);
      });
    },
  },
  {
    id: 'thermal', name: 'Thermogram', family: 'Craft',
    note: 'A false-colour ramp from black through red to white, which is how heat is drawn when it has to be seen.',
    draw: (c) => {
      paper(c, '#08060c');
      grid(c, 170, (x, y, t) => {
        const v = 1 - t;
        const col = v < 0.25 ? mix('#0a0620', '#5c1b7a', v / 0.25)
          : v < 0.5 ? mix('#5c1b7a', '#d43a2a', (v - 0.25) / 0.25)
          : v < 0.75 ? mix('#d43a2a', '#f2a81e', (v - 0.5) / 0.25)
          : mix('#f2a81e', '#fff8e0', (v - 0.75) / 0.25);
        box(c, x - 0.0034, y - 0.0034, 0.0072, 0.0072, col);
      });
    },
  },
  {
    id: 'sonar', name: 'Sonar', family: 'Craft',
    note: 'Returns plotted on concentric rings from a single point, so everything is measured as a distance.',
    draw: (c) => {
      paper(c, '#04140f');
      for (let rad = 0.02; rad < 0.8; rad += 0.0075) {
        const pts: [number, number][] = [];
        for (let a = 0; a <= Math.PI * 2; a += 0.03) {
          const x = 0.5 + Math.cos(a) * rad;
          const y = 0.45 + Math.sin(a) * rad * (c.w / c.h);
          if (x < 0 || x > 1 || y < 0 || y > 1) { if (pts.length > 1) stroke(c, pts, c.w * 0.0018, '#4ce0a0', 0.5); pts.length = 0; continue; }
          const t = c.t(x, y);
          pts.push([x + Math.cos(a) * t * 0.035, y + Math.sin(a) * t * 0.035]);
        }
        stroke(c, pts, c.w * 0.0022, '#4ce0a0', 0.75);
      }
    },
  },
  {
    id: 'dotmatrix', name: 'Dot matrix', family: 'System',
    note: 'Nine pins striking through a ribbon. Every dot is the same size and the same colour, and it shows.',
    draw: (c) => {
      paper(c, '#efeade');
      const n = 96;
      const rows = Math.round(n * (c.h / c.w));
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < n; i++) {
          const x = (i + 0.5) / n;
          const y = (j + 0.5) / rows;
          if (c.t(x, y) > 0.34 + (((i * 3 + j * 5) % 7) / 7) * 0.5) {
            dab(c, x, y, 0.0032, 0.0032, '#2a2a30', 0.85);
          }
        }
      }
    },
  },
  {
    id: 'spirograph', name: 'Spirograph', family: 'System',
    note: 'A pen in a small wheel rolling inside a big one. Tone comes from how often the curve happens to pass.',
    draw: (c) => {
      paper(c, '#f0e9d7');
      for (let k = 0; k < 16; k++) {
        const R = 0.4 - k * 0.008;
        const rr = 0.06 + k * 0.011;
        const d = 0.1 + k * 0.012;
        const pts: [number, number][] = [];
        for (let a = 0; a < Math.PI * 22; a += 0.03) {
          const x = 0.5 + (R - rr) * Math.cos(a) + d * Math.cos(((R - rr) / rr) * a);
          const y = 0.47 + ((R - rr) * Math.sin(a) - d * Math.sin(((R - rr) / rr) * a)) * (c.w / c.h);
          pts.push([x, y]);
        }
        for (let i = 1; i < pts.length; i++) {
          const t = c.t(pts[i][0], pts[i][1]);
          if (t > 0.3) stroke(c, [pts[i - 1], pts[i]], c.w * 0.0016, '#1d1a15', t * 0.6);
        }
      }
    },
  },
];


/** The five that finished the hundred. */
const LAST: Style[] = [
  {
    id: 'mezzotint', name: 'Mezzotint', family: 'Press',
    note: 'The plate is roughened all over until it prints solid black, and the picture is burnished back out of it.',
    draw: (c) => {
      paper(c, '#100e0c');
      for (let i = 0; i < 90000; i++) {
        const x = c.r();
        const y = c.r();
        const v = 1 - c.t(x, y);
        if (c.r() > Math.pow(v, 0.7)) continue;
        dab(c, x, y, 0.0026, 0.0026, '#efe6d0', 0.55);
      }
    },
  },
  {
    id: 'cyanotype', name: 'Cyanotype', family: 'Press',
    note: 'Iron salts and sunlight. Where the light got through it goes Prussian blue, and the edges of the paper never quite take.',
    draw: (c) => {
      paper(c, '#e8e4d2');
      grid(c, 190, (x, y, t) => {
        const v = Math.pow(t, 0.8);
        box(c, x - 0.003, y - 0.003, 0.0066, 0.0066, `rgba(20,52,110,${v})`);
      });
      for (const [x, y] of scatter(c, 900, 0.2)) dab(c, x, y, 0.006 + c.r() * 0.02, 0.006, '#e8e4d2', 0.1);
    },
  },
  {
    id: 'marbling', name: 'Suminagashi', family: 'Paint',
    note: 'Ink floated on water and lifted onto paper. The rings are concentric and the drift is whatever the surface did.',
    draw: (c) => {
      paper(c, '#efe9db');
      grid(c, 130, (x, y, t) => {
        if (t > 0.14) dab(c, x, y, 0.0068, 0.0068, '#5c6a74', (t - 0.14) * 0.85);
      });
      for (const [x, y] of scatter(c, 130, 2.2)) {
        const rings = 3 + Math.round(c.t(x, y) * 9);
        for (let k = 1; k < rings; k++) {
          const pts: [number, number][] = [];
          for (let a = 0; a <= Math.PI * 2 + 0.1; a += 0.12) {
            const rad = k * 0.008 * (1 + Math.sin(a * 3 + x * 30) * 0.24);
            pts.push([x + Math.cos(a) * rad + Math.sin(y * 12 + k) * 0.012, y + Math.sin(a) * rad * (c.w / c.h)]);
          }
          stroke(c, pts, c.w * 0.0022, k % 2 ? '#141c26' : '#7d8c96', 0.72);
        }
      }
    },
  },
  {
    id: 'anaglyph', name: 'Anaglyph', family: 'System',
    note: 'Two views a few millimetres apart, one in red and one in cyan, printed on top of each other.',
    draw: (c) => {
      paper(c, '#0c0c0e');
      c.g.globalCompositeOperation = 'lighter';
      grid(c, 180, (x, y) => {
        const l = 1 - c.t(x - 0.007, y);
        const rr = 1 - c.t(x + 0.007, y);
        box(c, x - 0.0032, y - 0.0032, 0.0068, 0.0068, `rgba(230,40,40,${l})`);
        box(c, x - 0.0032, y - 0.0032, 0.0068, 0.0068, `rgba(40,220,230,${rr})`);
      });
      c.g.globalCompositeOperation = 'source-over';
    },
  },
  {
    id: 'op', name: 'Op art', family: 'System',
    note: 'One ruling of concentric rings, displaced by the tone. Nothing is drawn; the distortion is the whole image.',
    draw: (c) => {
      paper(c, '#f2ecdc');
      // Displaced by twice the gap between rings, every ring lands on its
      // neighbour and the ruling closes up into a black disc. Keep the push
      // under half a gap and let the ring also thicken where it is dark, so
      // the distortion and the weight say the same thing.
      const gap = 0.018;
      const at = (a: number, k: number): [number, number] => {
        const x = 0.5 + Math.cos(a) * k;
        const y = 0.44 + Math.sin(a) * k * (c.w / c.h);
        const push = c.t(x, y) * gap * 0.34;
        return [x + Math.cos(a) * push, y + Math.sin(a) * push];
      };
      for (let k = gap; k < 0.98; k += gap) {
        for (let a = 0; a < Math.PI * 2; a += 0.022) {
          const p = at(a, k);
          const t = c.t(p[0], p[1]);
          stroke(c, [p, at(a + 0.022, k)], c.w * gap * (0.05 + Math.pow(t, 1.4) * 1.0), '#15130f', 0.95);
        }
      }
    },
  },
];

/** The hundred, in the order they were worked out. */
export const STYLES: Style[] = [...LINE, ...PRESS, ...PAINT, ...SYSTEM, ...CRAFT, ...LAST];

export const FAMILIES = ['Line', 'Press', 'Paint', 'System', 'Craft'] as const;

export function drawStyle(g: CanvasRenderingContext2D, f: Field, style: Style, w: number, h: number, seed: number) {
  let a = (seed ^ 0x51ed) >>> 0;
  const r = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const c = ctx(g, f, w, h, r);
  g.save();
  g.beginPath();
  g.rect(0, 0, w, h);
  g.clip();
  style.draw(c);
  g.restore();
}

export { L, BONE };
