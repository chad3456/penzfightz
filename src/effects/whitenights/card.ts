import { Pad, type Pt } from '../flat/pad';
import { fade, rng, stipple, stroke } from '../cards/ink';
import { DREAMER, NASTENKA, write, type Hand } from './hand';
import { drawFace, genes, INK, PAPER } from './face';
import { quoted, type Line } from './lines';

/**
 * One story card.
 *
 * A portrait, the city behind it, and a line of dialogue written underneath in
 * the speaker's own hand. The three are not independent: the night the line
 * belongs to decides what is behind her and how close the crop is, and who is
 * speaking decides which hand writes it. A card where the picture and the words
 * were chosen separately is a card where you can feel they were.
 */

export const ASPECT = 0.72;
/** Where the plate stops and the writing begins. */
const RULE = 0.7;

const SKY = ['#dfe3e6', '#e2e0dc', '#e6e2d6', '#dcdfe4', '#e4e4de'];

/**
 * Petersburg at one in the morning in June, which is the whole point of the
 * title: it never gets dark, and the light is the colour of the inside of a
 * shell. Drawn thin, because it is behind her.
 */
function city(pad: Pad, night: number, r: () => number) {
  const sky = SKY[night % SKY.length];
  pad.shape(
    [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ],
    sky,
    { alpha: 0.5, sharp: true },
  );
  const water = 0.72 + r() * 0.06;
  // The far bank: a low band of roofs with the odd spire, and nothing legible.
  const roof: Pt[] = [[0, water - 0.1]];
  let x = 0;
  while (x < 1) {
    const w = 0.05 + r() * 0.1;
    const h = water - 0.1 - (0.02 + r() * 0.07);
    roof.push([x, h], [Math.min(1, x + w), h]);
    if (r() < 0.16) {
      const sx = x + w * 0.5;
      roof.push([sx, h - 0.06 - r() * 0.06], [Math.min(1, x + w), h]);
    }
    x += w;
  }
  roof.push([1, water - 0.1], [1, water], [0, water]);
  pad.shape(roof, fade(INK, 0.3), { alpha: 0.42, sharp: true });

  // The water: horizontal strokes only, and fewer as they go back.
  for (let i = 0; i < 26; i++) {
    const t = i / 25;
    const y = water + t * (1 - water) * 1.1;
    const x0 = r() * 0.4;
    stroke(pad, [[x0, y], [x0 + 0.2 + r() * 0.5, y + (r() - 0.5) * 0.004]], fade(INK, 0.4), {
      width: 0.0016,
      taper: 0.7,
      alpha: 0.1 + t * 0.22,
    });
  }
  // The parapet she is standing at, and a lamp on it.
  const rail = water - 0.005;
  stroke(pad, [[0, rail], [1, rail - 0.004]], INK, { width: 0.003, taper: 0.15, alpha: 0.5, wobble: 0.002 });
  for (let i = 0; i < 14; i++) {
    const px = (i + 0.5) / 14;
    stroke(pad, [[px, rail], [px, rail + 0.05]], fade(INK, 0.5), { width: 0.0018, alpha: 0.3, taper: 0.4 });
  }
  const lx = r() < 0.5 ? 0.1 + r() * 0.12 : 0.78 + r() * 0.12;
  stroke(pad, [[lx, rail], [lx, rail - 0.3]], INK, { width: 0.0034, taper: 0.3, alpha: 0.6 });
  for (let i = 6; i > 0; i--) {
    pad.blob([lx, rail - 0.325], 0.05 * (i / 6), 0.05 * (i / 6), 0, '#c8a24a', { alpha: 0.05 });
  }
  pad.blob([lx, rail - 0.325], 0.012, 0.016, 0, '#c8a24a', { alpha: 0.8 });
}

/** The paper: a wove sheet with a bit of tooth and a bit of foxing. */
function sheet(pad: Pad, seed: number) {
  const r = rng(seed ^ 0x9e11);
  const g = pad.g;
  g.fillStyle = PAPER;
  g.fillRect(0, 0, pad.w, pad.h);
  // Flecks nobody can see still cost what a fleck costs, so the count follows
  // the size of the sheet rather than being a constant chosen at print size.
  const flecks = Math.round(Math.min(320, pad.w * 0.72));
  for (let i = 0; i < flecks; i++) {
    const s = 0.001 + r() * 0.0026;
    pad.blob([r(), r() * (pad.h / pad.w)], s, s * 0.7, r() * 3, r() < 0.4 ? '#cfc2a4' : '#e2d6ba', {
      alpha: 0.16 + r() * 0.3,
    });
  }
  // Foxing, in the corners, where damp gets in.
  for (let i = 0; i < 5; i++) {
    const c: Pt = [r() < 0.5 ? r() * 0.15 : 1 - r() * 0.15, r() < 0.5 ? r() * 0.2 : pad.h / pad.w - r() * 0.2];
    stipple(pad, [c[0] - 0.06, c[1] - 0.05, c[0] + 0.06, c[1] + 0.05], '#a98a52', { n: 26, size: 0.0026, alpha: 0.07 });
  }
}

/**
 * Draw the card.
 *
 * `w` is the short side and every measurement is a fraction of it, so one
 * function makes both the atlas cell and the print.
 */
export function drawCard(g: CanvasRenderingContext2D, line: Line, w: number, h: number) {
  const pad = new Pad(g, w, h, line.seed);
  const r = rng(line.seed);
  g.save();
  g.clearRect(0, 0, w, h);
  sheet(pad, line.seed);

  const box: [number, number, number, number] = [0.06, 0.055, 0.94, RULE - 0.02];
  g.save();
  g.beginPath();
  g.rect(box[0] * w, box[1] * h, (box[2] - box[0]) * w, (box[3] - box[1]) * h);
  g.clip();
  g.translate(box[0] * w, box[1] * h);
  const iw = (box[2] - box[0]) * w;
  const ih = (box[3] - box[1]) * h;
  const plate = new Pad(g, iw, ih, line.seed);
  city(plate, line.night, r);

  // How close. The first night is a stranger seen across a bridge and the
  // fourth is a face filling the plate, so the crop carries the story as much
  // as the drawing does.
  const near = line.night >= 3 ? 0.72 + r() * 0.16 : line.night === 0 ? 0.46 + r() * 0.14 : 0.56 + r() * 0.2;
  const size = near * (ih / iw) * 1.28;
  drawFace(plate, genes(line.seed * 977 + 13), [0.5, 0.44 + (1 - near) * 0.1], size, line.seed);
  g.restore();

  // The plate mark: the bruise a copper plate leaves in damp paper.
  const mark: Pt[] = [
    [box[0], box[1]],
    [box[2], box[1]],
    [box[2], box[3]],
    [box[0], box[3]],
  ];
  stroke(pad, [...mark, mark[0]], fade(INK, 0.4), { width: 0.0026, alpha: 0.5, sharp: true, wobble: 0.0016 });

  caption(pad, line, w, h);
  g.restore();
}

/**
 * The line, written out.
 *
 * Two hands: hers is small, upright and even, his leans hard and runs downhill.
 * Nothing here is set type — the letters are skeletons inked with a pointed
 * nib, so the same sentence is never written twice the same way.
 */
function caption(pad: Pad, line: Line, w: number, h: number) {
  const hand: Hand = line.voice === 'nastenka' ? NASTENKA : DREAMER;
  const top = (h * RULE) / h;
  // A rule, drawn rather than set, because it is part of the plate.
  stroke(pad, [[0.1, top - 0.028], [0.9, top - 0.026]], fade(INK, 0.35), {
    width: 0.0018,
    alpha: 0.5,
    taper: 0.6,
    wobble: 0.0018,
  });

  // As many lines as fit, and the writing gets smaller rather than being cut:
  // a written line with its last word missing is a fault, not a style.
  // `write` puts the *baseline* where it is told, and a cursive ascender
  // reaches nearly two x-heights above that — so the first line has to start
  // clear of the plate or the l's and h's climb into the picture.
  const room = 1 - top - 0.06;
  let size = 0.043;
  let lead = 0;
  for (let i = 0; i < 7; i++) {
    lead = size * 1.95 * (w / h);
    const end = write(pad, line.text, [0.5, top + lead], hand, {
      size,
      width: 0.84,
      align: 'centre',
      seed: line.seed + i,
      dry: true,
    });
    if (end - top < room) break;
    size *= 0.87;
  }
  lead = size * 1.95 * (w / h);
  write(pad, line.text, [0.5, top + lead], hand, {
    size,
    width: 0.84,
    align: 'centre',
    seed: line.seed,
  });

  // Who said it, in a smaller hand, off to one side and underlined the way
  // anybody signs a note.
  const who = line.voice === 'nastenka' ? 'Nastenka' : 'the dreamer';
  write(pad, quoted(line.text) ? who + ', his own words' : who, [0.72, 1 - 0.035], hand, {
    size: size * 0.74,
    width: 0.56,
    align: 'centre',
    seed: line.seed + 91,
    alpha: 0.6,
  });
}
