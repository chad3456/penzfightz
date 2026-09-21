import { Press } from '../rooms/riso';
import type { Field } from './draw';
import { branch, PLATES, sky } from './plates';
import { EYEPIECE, openFrame, throughLens, title } from './lens';

/**
 * A SMALL LIGHT, CARRIED — twenty-seven seconds.
 *
 * The shape is taken straight from the reference: open on something alive and
 * ordinary, go through a run of plates seen down one lens, open out, put a name
 * on it, and come back to the same ordinary thing. The whole trick is that the
 * plates have nothing to do with each other and everything to do with the
 * subject, and the subject is never shown.
 *
 * Every frame is a pure function of one number. Nothing accumulates, nothing is
 * tweened from a previous frame, and the film therefore renders identically at
 * any frame rate, in any order, on any machine — which is what makes it
 * possible to render it to a file at all.
 */

export const DURATION = 27.4;
export const FPS = 24;

interface Shot {
  at: number;
  until: number;
  kind: 'branch' | 'plate' | 'sky' | 'title';
  plate?: number;
}

const HOLD = 1.62;
const START = 3.0;

export const SHOTS: Shot[] = [
  { at: 0, until: START, kind: 'branch' },
  ...PLATES.map((_, i) => ({
    at: START + i * HOLD,
    until: START + (i + 1) * HOLD,
    kind: 'plate' as const,
    plate: i,
  })),
  { at: START + PLATES.length * HOLD, until: START + PLATES.length * HOLD + 2.1, kind: 'sky' },
  { at: START + PLATES.length * HOLD + 2.1, until: START + PLATES.length * HOLD + 4.7, kind: 'title' },
  { at: START + PLATES.length * HOLD + 4.7, until: DURATION, kind: 'branch' },
];

/**
 * How long a slide change takes.
 *
 * It was four tenths at each end of a shot that is one and six — so nearly
 * half of every plate was spent in the dark, and the film read as more dip than
 * picture. Three tenths leaves the plate a clear second to be looked at, which
 * is what it is for.
 */
const FADE = 0.3;

const ease = (x: number) => x * x * (3 - 2 * x);

/**
 * The projector.
 *
 * Holds one press at plate size and one scratch canvas, and can be asked for
 * any moment of the film. The plates are drawn fresh each frame rather than
 * baked, because several of them move — the flame gutters, the arrow travels,
 * the lamps breathe — and a plate is small enough that it costs less than the
 * grain does.
 */
export class Projector {
  readonly W: number;
  private press: Press;
  private plate: HTMLCanvasElement;
  private pg: CanvasRenderingContext2D;
  private field: Field;

  constructor(W: number) {
    this.W = W;
    const size = Math.round(W * 0.9);
    this.plate = document.createElement('canvas');
    this.plate.width = size;
    this.plate.height = size;
    const g = this.plate.getContext('2d');
    if (!g) throw new Error('no 2d context for the plate');
    this.pg = g;
    this.press = new Press(size, size);
    this.field = { x: 0, y: 0, size };
  }

  /** Which shot is on at this moment, and how far through it. */
  private shotAt(t: number) {
    for (const s of SHOTS) if (t >= s.at && t < s.until) return s;
    return SHOTS[SHOTS.length - 1]!;
  }

  private drawPlate(shot: Shot, t: number) {
    const p = this.press;
    p.reset();
    const f = this.field;
    if (shot.kind === 'plate') {
      const plate = PLATES[shot.plate!]!;
      // Paper under the whole plate, so the field reads as a lit slide.
      p.solid('rose', (g) => {
        g.fillStyle = '#ffffff';
        g.fillRect(0, 0, f.size, f.size);
      }, [0, 0, f.size, f.size]);
      plate.draw(p, f, t);
    } else if (shot.kind === 'sky') {
      sky(p, f, t);
    } else {
      branch(p, f, t);
    }
    p.print(this.pg, 2.4);
  }

  /** Render the whole frame for a moment of the film. */
  frame(out: CanvasRenderingContext2D, t: number) {
    const shot = this.shotAt(t);
    const into = t - shot.at;
    const left = shot.until - t;

    if (shot.kind === 'title') {
      out.fillStyle = '#0b0c10';
      out.fillRect(0, 0, this.W, this.W);
      this.drawPlate({ ...shot, kind: 'sky' }, t);
      out.save();
      out.globalAlpha = 0.5;
      openFrame(out, this.plate, this.W, t);
      out.restore();
      const a = Math.min(1, into / 0.7) * Math.min(1, left / 0.7);
      title(out, this.W, 'Rāma', 'a small light, carried', a);
      return;
    }

    if (shot.kind === 'sky') {
      // The aperture opens: the instrument is put down and you are outside.
      this.drawPlate(shot, t);
      const k = ease(Math.min(1, into / (shot.until - shot.at)));
      if (k < 0.96) throughLens(out, this.plate, this.W, t, EYEPIECE, 1 + k * 2.2);
      else openFrame(out, this.plate, this.W, t);
      return;
    }

    this.drawPlate(shot, t);
    if (shot.kind === 'branch') {
      openFrame(out, this.plate, this.W, t);
    } else {
      throughLens(out, this.plate, this.W, t);
    }

    // Dissolves, done as a dip rather than a cross-fade: two plates a frame
    // would double the cost for something the barrel mostly hides anyway, and
    // a lantern operator changing a slide is a dip, not a mix.
    const dip = Math.max(
      into < FADE ? 1 - into / FADE : 0,
      left < FADE ? 1 - left / FADE : 0,
    );
    if (dip > 0) {
      out.fillStyle = `rgba(11,12,16,${ease(dip) * 0.86})`;
      out.fillRect(0, 0, this.W, this.W);
    }
  }

  /** What the slide says, for the caption under the player. */
  caption(t: number): { title: string; caption: string } {
    const s = this.shotAt(t);
    if (s.kind === 'plate') {
      const pl = PLATES[s.plate!]!;
      return { title: pl.title, caption: pl.caption };
    }
    if (s.kind === 'title') return { title: 'Rāma', caption: 'a small light, carried' };
    return {
      title: 'Before, and after',
      caption: 'A branch, a bird, and the light going. The only living thing in the film.',
    };
  }
}
