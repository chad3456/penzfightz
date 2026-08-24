/**
 * The dot field.
 *
 * Text is rendered to an offscreen canvas, sampled onto a fixed lattice, and
 * drawn back as small squares. A pointer moving over the field pushes those
 * squares out of the way; a straight row of them bends into an arc as it goes,
 * which is where the whole effect comes from — nothing is rotated, blurred or
 * faded, the dots simply stand somewhere else.
 *
 * Every constant in FIELD was measured off the reference recording rather than
 * guessed. See `docs/dot-field.md` for how, and for the error bars.
 */

export const FIELD = {
  /** Lattice pitch in CSS px. Dots sit every 6px in both directions. */
  pitch: 6,
  /** Side of the square drawn at each lattice point. */
  dot: 3,
  /** Nothing outside this radius of the pointer moves at all. */
  radius: 166,
  /** How far a dot directly under the pointer is pushed. */
  strength: 55,
  /**
   * The pointer the field uses is not the real one — it chases it, moving
   * 12% of the remaining distance every 60th of a second. That lag is what
   * makes the field feel like it has weight.
   */
  ease: 0.12,
  bg: '#171717',
  ink: '#595959',
} as const;

export interface Phrase {
  /** One entry per line. */
  lines: string[];
  /** Cap height in CSS px; everything else is derived from it. */
  cap?: number;
}

/**
 * Weight of the sampled face. The reference is heavy — its stems are three
 * lattice columns wide against a cap height of eighteen — and a regular mono
 * samples two, which reads as a different typeface once it is dots.
 */
export const FONT_WEIGHT = 700;

interface Dot {
  /** Where this dot lives now, between phrases. */
  hx: number;
  hy: number;
  /** Where it came from and where it is going, for the morph. */
  ax: number;
  ay: number;
  bx: number;
  by: number;
  /** 0 while it belongs to neither phrase, 1 when it is fully part of one. */
  a: number;
  a0: number;
  a1: number;
}

/**
 * Monospace, because the reference is: every glyph in it advances by the same
 * amount, and the word gap is exactly one of those advances. No web font is
 * downloaded — the field samples whatever mono the machine already has, and at
 * a 6px lattice the differences between them disappear.
 */
const FONT_STACK =
  'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace';

/** Cap height as a fraction of font-size, near enough for every mono we sample. */
const CAP_RATIO = 0.7;
/** Baseline-to-baseline as a fraction of cap height, measured off the reference. */
const LINE_RATIO = 168 / 110;

export interface DotFieldOptions {
  /** Called with 0..1 whenever the visible phrase changes. */
  onPhrase?: (index: number) => void;
  /** Scale the field with the viewport below this width, so phones are usable. */
  minWidthForFullField?: number;
}

export class DotField {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private off: HTMLCanvasElement;
  private offCtx: CanvasRenderingContext2D;

  private w = 0;
  private h = 0;
  private dpr = 1;
  /** Field scale — 1 on anything desktop-sized, smaller on a phone. */
  private k = 1;
  /**
   * Lattice in use. Exactly the measured 6px/3px on any screen wide enough to
   * match the reference; a finer 4px/2px lattice below that, because a phone
   * only fits about eight characters across and eight dots of cap height is
   * not a letter any more. The force law is untouched either way.
   */
  private pitch: number = FIELD.pitch;
  private dotSize: number = FIELD.dot;

  private dots: Dot[] = [];
  private phrases: Phrase[] = [];
  private index = 0;

  /** The real pointer, and the one the field chases it with. */
  private tx = -1e5;
  private ty = -1e5;
  private px = -1e5;
  private py = -1e5;
  private engaged = false;

  /** Morph clock, 0..1. */
  private morph = 1;
  /** Scroll drag: dots lag behind a fast scroll and catch up after it. */
  private drag = 0;

  private raf = 0;
  private last = 0;
  private opts: DotFieldOptions;

  constructor(canvas: HTMLCanvasElement, phrases: Phrase[], opts: DotFieldOptions = {}) {
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('2D canvas unavailable');
    this.canvas = canvas;
    this.ctx = ctx;
    this.off = document.createElement('canvas');
    const octx = this.off.getContext('2d', { willReadFrequently: true });
    if (!octx) throw new Error('2D canvas unavailable');
    this.offCtx = octx;
    this.phrases = phrases;
    this.opts = opts;
  }

  // ---------------------------------------------------------------- layout

  resize(w: number, h: number, dpr = window.devicePixelRatio || 1) {
    this.w = w;
    this.h = h;
    this.dpr = Math.min(dpr, 2);
    this.canvas.width = Math.round(w * this.dpr);
    this.canvas.height = Math.round(h * this.dpr);
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    const full = this.opts.minWidthForFullField ?? 900;
    this.k = w >= full ? 1 : Math.max(0.42, w / full);
    const fine = this.k < 0.72;
    this.pitch = fine ? 4 : FIELD.pitch;
    this.dotSize = fine ? 2 : FIELD.dot;

    this.off.width = Math.max(1, Math.round(w));
    this.off.height = Math.max(1, Math.round(h));

    const cells = this.cellsFor(this.index);
    this.dots = cells.map((c) => ({
      hx: c[0],
      hy: c[1],
      ax: c[0],
      ay: c[1],
      bx: c[0],
      by: c[1],
      a: 1,
      a0: 1,
      a1: 1,
    }));
    this.morph = 1;
  }

  /**
   * Sample one phrase onto the lattice.
   *
   * The lattice is anchored to the canvas, not to the text, so a dot that is
   * part of two phrases in a row does not shift by a fraction of a cell when
   * the words change — it either stays exactly put or travels a whole number
   * of cells.
   */
  private cellsFor(i: number): [number, number][] {
    const p = this.phrases[i];
    if (!p || this.w === 0) return [];

    const cap = (p.cap ?? 110) * this.k;
    const size = cap / CAP_RATIO;
    const lineH = cap * LINE_RATIO;

    const c = this.offCtx;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, this.w, this.h);
    c.font = `${FONT_WEIGHT} ${size}px ${FONT_STACK}`;
    c.textBaseline = 'alphabetic';
    c.fillStyle = '#fff';

    // Shrink to fit rather than overflow: the longest line sets the size.
    const pad = Math.max(24, this.w * 0.043);
    const widest = Math.max(...p.lines.map((l) => c.measureText(l).width));
    const room = this.w - pad * 2;
    if (widest > room) {
      const shrunk = size * (room / widest);
      c.font = `${FONT_WEIGHT} ${shrunk}px ${FONT_STACK}`;
    }

    const block = lineH * (p.lines.length - 1) + cap;
    const top = (this.h - block) / 2;
    p.lines.forEach((line, n) => c.fillText(line, pad, top + cap + lineH * n));

    const pitch = this.pitch;
    const img = c.getImageData(0, 0, this.off.width, this.off.height).data;
    const out: [number, number][] = [];
    // Half-pitch offset keeps the lattice off the very edge of the canvas.
    for (let y = pitch / 2; y < this.h; y += pitch) {
      for (let x = pitch / 2; x < this.w; x += pitch) {
        const px = (Math.round(y) * this.off.width + Math.round(x)) * 4;
        if (img[px + 3] > 127) out.push([x, y]);
      }
    }
    return out;
  }

  // ------------------------------------------------------------- phrases

  /** Cross-fade to another phrase, dots travelling to their nearest new home. */
  setPhrase(i: number) {
    const next = Math.max(0, Math.min(this.phrases.length - 1, i));
    if (next === this.index) return;
    this.index = next;
    this.opts.onPhrase?.(next);

    const to = this.cellsFor(next);
    const from = this.dots.map((d) => [d.hx, d.hy] as [number, number]);
    const pair = nearestPairs(from, to);

    const dots: Dot[] = [];
    // Everything that exists now, heading for its partner (or fading out).
    this.dots.forEach((d, n) => {
      const t = pair.forward[n];
      dots.push({
        hx: d.hx,
        hy: d.hy,
        ax: d.hx,
        ay: d.hy,
        bx: t ? t[0] : d.hx,
        by: t ? t[1] : d.hy,
        a: d.a,
        a0: d.a,
        a1: t ? 1 : 0,
      });
    });
    // Everything new that nothing grew into, arriving from its nearest source.
    pair.orphans.forEach((t) => {
      const s = pair.back.get(t) ?? t;
      dots.push({
        hx: s[0],
        hy: s[1],
        ax: s[0],
        ay: s[1],
        bx: t[0],
        by: t[1],
        a: 0,
        a0: 0,
        a1: 1,
      });
    });

    this.dots = dots;
    this.morph = 0;
  }

  get phrase() {
    return this.index;
  }

  // ------------------------------------------------------------- input

  pointer(x: number, y: number) {
    this.tx = x;
    this.ty = y;
    if (!this.engaged) {
      // Do not sweep the field across the whole page on the first move.
      this.px = x;
      this.py = y;
      this.engaged = true;
    }
  }

  pointerAway() {
    this.engaged = false;
    this.tx = -1e5;
    this.ty = -1e5;
    this.px = -1e5;
    this.py = -1e5;
  }

  /** Feed scroll velocity in px/frame; dots lag it and settle back. */
  scrolled(velocity: number) {
    this.drag += velocity;
    if (this.drag > 90) this.drag = 90;
    if (this.drag < -90) this.drag = -90;
  }

  // -------------------------------------------------------------- render

  start() {
    if (this.raf) return;
    this.last = performance.now();
    const loop = (t: number) => {
      const dt = Math.min(64, t - this.last) / (1000 / 60); // in 60fps frames
      this.last = t;
      this.step(dt);
      this.draw();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop() {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  private step(dt: number) {
    // The measured 12%-per-frame chase, held steady if a frame runs long.
    const e = 1 - Math.pow(1 - FIELD.ease, dt);
    this.px += (this.tx - this.px) * e;
    this.py += (this.ty - this.py) * e;

    if (this.morph < 1) {
      this.morph = Math.min(1, this.morph + dt / 34);
      const m = easeInOut(this.morph);
      for (const d of this.dots) {
        d.hx = d.ax + (d.bx - d.ax) * m;
        d.hy = d.ay + (d.by - d.ay) * m;
        d.a = d.a0 + (d.a1 - d.a0) * m;
      }
    }

    this.drag *= Math.pow(0.86, dt);
    if (Math.abs(this.drag) < 0.01) this.drag = 0;
  }

  private draw() {
    const { ctx } = this;
    const { radius, strength, bg, ink } = FIELD;
    const dot = this.dotSize;
    const R = radius * this.k;
    const S = strength * this.k;
    // Dots land on whole pixels, displaced or not, so every square stays a
    // crisp 3x3 instead of smearing into a grey blob the moment it moves.
    const off = Math.floor(dot / 2);

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, this.w, this.h);

    const px = this.px;
    const py = this.py;
    // Scroll drag leans the field: dots further down the page lag further.
    const lean = this.drag;

    let alpha = -1;
    for (const d of this.dots) {
      if (d.a <= 0.004) continue;
      const bx = d.hx;
      const by = d.hy + lean * (0.25 + (d.hy / Math.max(1, this.h)) * 0.75);

      let x = bx;
      let y = by;
      const dx = bx - px;
      const dy = by - py;
      const r = Math.sqrt(dx * dx + dy * dy);
      if (r < R && r > 1e-6) {
        const f = 1 - r / R;
        x = bx + (dx / r) * S * f;
        y = by + (dy / r) * S * f;
      }

      if (d.a !== alpha) {
        alpha = d.a;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = ink;
      }
      ctx.fillRect(Math.round(x) - off, Math.round(y) - off, dot, dot);
    }
    ctx.globalAlpha = 1;
  }
}

// ------------------------------------------------------------------ helpers

const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/**
 * Pair up two sets of lattice points by proximity.
 *
 * Greedy nearest-first over a coarse hash: good enough that the morph reads as
 * the letters rearranging rather than the whole block teleporting, and cheap
 * enough to run on a phrase change without dropping a frame.
 */
function nearestPairs(
  from: [number, number][],
  to: [number, number][],
): {
  forward: ([number, number] | null)[];
  back: Map<[number, number], [number, number]>;
  orphans: [number, number][];
} {
  const CELL = 48;
  const key = (x: number, y: number) => `${Math.floor(x / CELL)},${Math.floor(y / CELL)}`;
  const buckets = new Map<string, [number, number][]>();
  for (const t of to) {
    const k = key(t[0], t[1]);
    const b = buckets.get(k);
    if (b) b.push(t);
    else buckets.set(k, [t]);
  }

  const taken = new Set<[number, number]>();
  const forward: ([number, number] | null)[] = new Array(from.length).fill(null);
  const back = new Map<[number, number], [number, number]>();

  from.forEach((f, i) => {
    let best: [number, number] | null = null;
    let bestD = Infinity;
    const gx = Math.floor(f[0] / CELL);
    const gy = Math.floor(f[1] / CELL);
    for (let ring = 0; ring <= 4 && !best; ring++) {
      for (let oy = -ring; oy <= ring; oy++) {
        for (let ox = -ring; ox <= ring; ox++) {
          if (ring > 0 && Math.abs(ox) !== ring && Math.abs(oy) !== ring) continue;
          for (const t of buckets.get(`${gx + ox},${gy + oy}`) ?? []) {
            if (taken.has(t)) continue;
            const d = (t[0] - f[0]) ** 2 + (t[1] - f[1]) ** 2;
            if (d < bestD) {
              bestD = d;
              best = t;
            }
          }
        }
      }
      if (best) break;
    }
    if (best) {
      taken.add(best);
      forward[i] = best;
      back.set(best, f);
    }
  });

  const orphans = to.filter((t) => !taken.has(t));
  // An arriving dot with no ancestor starts from the closest one that does.
  for (const t of orphans) {
    let best: [number, number] | null = null;
    let bestD = Infinity;
    for (const f of from) {
      const d = (t[0] - f[0]) ** 2 + (t[1] - f[1]) ** 2;
      if (d < bestD) {
        bestD = d;
        best = f;
      }
    }
    if (best) back.set(t, best);
  }
  return { forward, back, orphans };
}
