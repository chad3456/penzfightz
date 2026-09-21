import { grainOver, LINE, rulePaper, vignette, waxOver } from './paper';
import { scrawl } from './doodle';
import { SCENES } from './story';

/**
 * The travelling shot.
 *
 * There is one cut in this film and it is at the very end. Everything else is
 * one move along one page: the camera sits on a scene, reads it, and then
 * carries on to the next, the way a finger moves along a line of a book.
 *
 * The middle of the Ramayana is a journey south. Rather than illustrate that,
 * the film *does* it — Ayodhya is at the start of the page and Lanka is a very
 * long way into it, and getting there takes as long as it takes.
 */

export const FPS = 24;
/**
 * How much of the page one frame shows, in world pixels, top to bottom.
 *
 * Fixed in *world* units rather than derived from the output size, or the film
 * frames itself differently at every resolution — which it did: a probe at 540
 * high showed a sensible band of ground and the same film at 720 showed twice
 * as much empty paper, because the camera was measuring itself in pixels.
 */
export const VIEW_H = 820;
/** Where the eye sits relative to the ground: high enough to read the cards. */
const EYE = LINE * 6.2;
/** How long the camera rests on a scene before moving on. */
const HOLD = 5.1;
/** How long the move between two scenes takes. */
const TRAVEL = 2.6;
/** Before the first scene and after the last. */
const OPEN = 5.2;
const CLOSE = 7.0;

export const DURATION = OPEN + SCENES.length * HOLD + (SCENES.length - 1) * TRAVEL + CLOSE;

const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

export interface Shot {
  x: number;
  y: number;
  zoom: number;
  /** Which scene is being read, for the caption under the player. */
  scene: number;
  /** Title-card opacity, 0 unless we are at one end of the film. */
  titleIn: number;
  endIn: number;
}

/**
 * Where the camera is at a moment.
 *
 * A pure function of time, like everything else in these films: no easing state
 * carried between frames, so the film can be rendered out of order and is the
 * same every time it runs.
 */
export function shotAt(t: number): Shot {
  const first = SCENES[0]!;
  const last = SCENES[SCENES.length - 1]!;

  if (t < OPEN) {
    // Sitting on the first scene while the title is up, drifting in a little.
    const k = ease(Math.min(1, t / OPEN));
    return {
      x: first.at - 340 + k * 340, y: (first.eye ?? 0) - EYE,
      zoom: 1.16 - k * 0.16, scene: 0,
      titleIn: Math.min(1, t / 1.1) * Math.min(1, (OPEN - t) / 1.4), endIn: 0,
    };
  }

  const after = t - OPEN;
  const cycle = HOLD + TRAVEL;
  let i = Math.floor(after / cycle);
  let within = after - i * cycle;
  if (i >= SCENES.length) {
    i = SCENES.length - 1;
    within = HOLD;
  }
  const here = SCENES[Math.min(i, SCENES.length - 1)]!;
  const next = SCENES[Math.min(i + 1, SCENES.length - 1)]!;

  const tailStart = OPEN + SCENES.length * HOLD + (SCENES.length - 1) * TRAVEL;
  if (t >= tailStart) {
    // The one cut: pull right back and look at the whole page at once.
    const k = ease(Math.min(1, (t - tailStart) / (CLOSE * 0.6)));
    return {
      x: lerp(last.at, last.at + 260, k), y: (last.eye ?? 0) - EYE - k * LINE * 2,
      zoom: lerp(1, 1.5, k), scene: SCENES.length - 1,
      titleIn: 0, endIn: Math.min(1, (t - tailStart - 1.2) / 1.6),
    };
  }

  if (within < HOLD) {
    // Resting: still moving, but only just — a held shot that is perfectly
    // still reads as a photograph of a drawing rather than a look at one.
    const k = within / HOLD;
    return {
      x: here.at + (k - 0.5) * 120, y: (here.eye ?? 0) - EYE + Math.sin(k * Math.PI) * LINE * 0.5,
      zoom: 1.02 - Math.sin(k * Math.PI) * 0.05, scene: i, titleIn: 0, endIn: 0,
    };
  }

  const k = ease((within - HOLD) / TRAVEL);
  return {
    x: lerp(here.at + 60, next.at - 60, k),
    y: lerp((here.eye ?? 0) - EYE, (next.eye ?? 0) - EYE, k),
    // Pull back a touch through the move, so travelling feels like travelling.
    zoom: 1.02 + Math.sin(k * Math.PI) * 0.22,
    scene: k < 0.5 ? i : i + 1, titleIn: 0, endIn: 0,
  };
}

/**
 * The projector.
 *
 * Draws one frame: rule the visible page, draw whatever scenes overlap the
 * window, then the grain and the wax over the top. Scenes outside the window
 * are skipped, so the cost of a frame is two or three scenes however long the
 * page gets.
 */
export class Reel {
  readonly w: number;
  readonly h: number;

  constructor(w: number, h: number) {
    this.w = w;
    this.h = h;
  }

  frame(g: CanvasRenderingContext2D, t: number) {
    const s = shotAt(t);
    const viewH = VIEW_H * s.zoom;
    const viewW = viewH * (this.w / this.h);
    const x0 = s.x - viewW / 2;
    const y0 = s.y - viewH / 2;

    g.save();
    g.scale(this.w / viewW, this.h / viewH);
    g.translate(-x0, -y0);

    rulePaper(g, x0, y0, viewW, viewH);
    for (const sc of SCENES) {
      if (sc.at + sc.w < x0 - 400 || sc.at - sc.w > x0 + viewW + 400) continue;
      sc.draw(g, t);
    }
    g.restore();

    waxOver(g, this.w, this.h, 0.26);
    grainOver(g, this.w, this.h, 0.42);
    vignette(g, this.w, this.h, 0.26);

    if (s.titleIn > 0) this.title(g, s.titleIn);
    if (s.endIn > 0) this.end(g, s.endIn);
  }

  /** The title, written on a card taped onto the first page. */
  private title(g: CanvasRenderingContext2D, alpha: number) {
    const w = this.w;
    const h = this.h;
    g.save();
    g.globalAlpha = Math.min(1, alpha);
    g.fillStyle = 'rgba(244, 242, 234, 0.9)';
    g.fillRect(0, h * 0.3, w, h * 0.3);
    g.fillStyle = '#2b2b2f';
    g.textAlign = 'center';
    scrawl(g, 'The Ramayana', w / 2, h * 0.44, h * 0.105, 1, '#2b2b2f', 'center');
    scrawl(g, 'drawn along one very long page', w / 2, h * 0.52, h * 0.036, 3, '#7a6a52', 'center');
    g.restore();
  }

  private end(g: CanvasRenderingContext2D, alpha: number) {
    const w = this.w;
    const h = this.h;
    g.save();
    g.globalAlpha = Math.min(1, alpha) * 0.93;
    g.fillStyle = 'rgba(20, 18, 16, 0.86)';
    g.fillRect(0, 0, w, h);
    g.globalAlpha = Math.min(1, alpha);
    scrawl(g, 'and then the lamps go on', w / 2, h * 0.47, h * 0.062, 5, '#f0e6cf', 'center');
    scrawl(g, 'scenes, not doctrine', w / 2, h * 0.56, h * 0.028, 7, '#9c9180', 'center');
    g.restore();
  }

  /** What the scene under the camera is called. */
  caption(t: number) {
    const s = shotAt(t);
    const sc = SCENES[Math.max(0, Math.min(SCENES.length - 1, s.scene))]!;
    return { n: s.scene + 1, of: SCENES.length, title: sc.title };
  }
}
