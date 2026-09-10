/**
 * The portrait.
 *
 * Words on a ring, and light drawn between them.
 *
 * The geometry is the honest part: attention really is every token looking at
 * every other token and weighting them, and a ring is the shape of all-to-all —
 * there is no privileged position on it, which is the point. What is *not*
 * honest, and is said so on the page, is the weights. Mine are learned and live
 * in a file the size of a small city. These are a softmax over dot products of
 * fixed random vectors: the right operation, standing in for the right numbers.
 *
 * Everything accumulates. One chord is a line; ten thousand chords, laid over
 * each other with the ground fading slowly underneath, is a woven core that
 * nobody drew directly. That is the picture.
 */

const DIM = 8;
/**
 * Labels scale with the canvas, and they have to.
 *
 * The ring's radius is whatever is left after the longest word, so a label set
 * at a fixed size on a phone eats the picture: at 358px across, ten and a half
 * point type leaves a ring of sixty pixels with a corona of text round it.
 */
const labelFont = (px: number) => `${px}px ui-monospace, SFMono-Regular, Menlo, monospace`;
const TAU = Math.PI * 2;

function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 4294967296;
  };
}

interface Token {
  text: string;
  /** Where it sits on the ring, and where its label goes. */
  a: number;
  x: number;
  y: number;
  align: CanvasTextAlign;
  /** Set along the radius; flipped on the left half so nothing reads upside down. */
  k: number[];
  q: number[];
  /** How lit the label is, eased. */
  heat: number;
}

export interface PortraitOptions {
  ink: string;
  clay: string;
  cool: string;
  ground: string;
}

export class Portrait {
  private ctx: CanvasRenderingContext2D;
  private tokens: Token[] = [];
  private w = 1;
  private h = 1;
  private cx = 0;
  private cy = 0;
  private radius = 1;
  private font = labelFont(10.5);
  /** How much light one chord is worth, given how much room the ring has. */
  private density = 1;

  /** Which token is being asked. Follows the pointer, or sweeps on its own. */
  private query = 0;
  private sweep = 0;
  private pointer: { x: number; y: number } | null = null;
  private raf = 0;
  private t = 0;

  /** Told to the page, so it can print the word under the picture. */
  onQuery: ((word: string, attends: { word: string; weight: number }[]) => void) | null = null;

  constructor(
    private canvas: HTMLCanvasElement,
    words: string[],
    private opt: PortraitOptions,
  ) {
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('no 2d context');
    this.ctx = ctx;

    const r = rng(20260910);
    this.tokens = words.map((text) => ({
      text,
      a: 0, x: 0, y: 0,
      align: 'left' as CanvasTextAlign,
      // Two vectors, not one. A token asks with its query and is found by its
      // key, and keeping them separate is why attention is not symmetric —
      // *let me* leans on *careful* far harder than the other way round.
      q: Array.from({ length: DIM }, () => r() * 2 - 1),
      k: Array.from({ length: DIM }, () => r() * 2 - 1),
      heat: 0,
    }));
  }

  // ------------------------------------------------------------------ layout

  resize(w: number, h: number, dpr: number) {
    this.w = Math.max(1, w);
    this.h = Math.max(1, h);
    this.canvas.width = Math.round(this.w * dpr);
    this.canvas.height = Math.round(this.h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    this.cx = this.w / 2;
    this.cy = this.h / 2;
    // Labels radiate, so the room they need is the same in every direction and
    // the radius comes off the shorter side minus the longest word.
    const short = Math.min(this.w, this.h);
    this.font = labelFont(short < 460 ? 8 : short < 620 ? 9.5 : 10.5);
    this.ctx.font = this.font;
    const longest = this.tokens.reduce((m, t) => Math.max(m, this.ctx.measureText(t.text).width), 0);
    this.radius = Math.max(52, short * 0.5 - longest - (short < 460 ? 10 : 18));
    this.density = Math.max(0.45, Math.min(1, this.radius / 190));

    const n = this.tokens.length;
    const r = rng(77);
    this.tokens.forEach((tk, i) => {
      // A perfect ring reads as a dial. Breathe it slightly and it reads as a
      // thing that grew.
      const wobble = (r() - 0.5) * (TAU / n) * 0.5;
      tk.a = (i / n) * TAU - Math.PI / 2 + wobble;
      const rr = this.radius * (0.965 + r() * 0.07);
      tk.x = this.cx + Math.cos(tk.a) * rr;
      tk.y = this.cy + Math.sin(tk.a) * rr;
      // Set along the radius rather than horizontally. On a ring, horizontal
      // labels pile into each other at the top and the bottom — the words there
      // are neighbours by angle but overlap by width. Radiating, they cannot
      // collide at all, and the ring reads as a dial of its own making.
      tk.align = Math.cos(tk.a) > 0 ? 'left' : 'right';
    });

    this.ctx.fillStyle = this.opt.ground;
    this.ctx.fillRect(0, 0, this.w, this.h);
  }

  point(x: number | null, y = 0) {
    this.pointer = x === null ? null : { x, y };
  }

  // --------------------------------------------------------------- attention

  /** Softmax over dot products. The real operation, on stand-in numbers. */
  private attend(qi: number): number[] {
    const q = this.tokens[qi].q;
    const scale = 1 / Math.sqrt(DIM);
    const raw = this.tokens.map((t, j) => {
      if (j === qi) return -Infinity; // a token attending to itself draws nothing
      let d = 0;
      for (let k = 0; k < DIM; k++) d += q[k] * t.k[k];
      return d * scale * 3.4;
    });
    const max = Math.max(...raw.filter(Number.isFinite));
    const exp = raw.map((v) => (Number.isFinite(v) ? Math.exp(v - max) : 0));
    const sum = exp.reduce((a, b) => a + b, 0) || 1;
    return exp.map((v) => v / sum);
  }

  /** One token's worth of light, laid over whatever is already there. */
  private chords(qi: number, gain: number) {
    const ctx = this.ctx;
    const from = this.tokens[qi];
    const w = this.attend(qi);
    // Strongest last, so the brightest sit on top of the bundle.
    const order = w.map((v, i) => [v, i] as const).sort((a, b) => a[0] - b[0]);
    for (const [weight, j] of order) {
      if (weight < 0.004) continue;
      const to = this.tokens[j];
      const strong = Math.min(1, weight * 6);

      // Bundled. A weak link is dragged right through the middle and a strong
      // one cuts closer to straight, so the faint majority braid together into
      // a core and the few that matter are the ones you can follow across it.
      const pull = 0.88 - strong * 0.46;
      const mx = this.cx + (((from.x + to.x) / 2 - this.cx) * (1 - pull));
      const my = this.cy + (((from.y + to.y) / 2 - this.cy) * (1 - pull));

      ctx.strokeStyle = strong > 0.45 ? this.opt.clay : this.opt.cool;
      // Scaled to the ring. The same forty-odd chords crossing a small circle
      // put the same light through a fraction of the area, and a phone gets a
      // white blot where a laptop gets a weave.
      ctx.globalAlpha = (0.016 + strong * 0.2) * gain * this.density;
      ctx.lineWidth = 0.3 + strong * 1.4;
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.quadraticCurveTo(mx, my, to.x, to.y);
      ctx.stroke();

      if (gain > 0.5) to.heat = Math.max(to.heat, strong);
    }
  }

  private nearestToken(x: number, y: number): number | null {
    let best = -1;
    let bestD = 46 * 46;
    this.tokens.forEach((t, i) => {
      const dx = t.x - x;
      const dy = t.y - y;
      const d = dx * dx + dy * dy;
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    return best < 0 ? null : best;
  }

  // ------------------------------------------------------------------- frame

  private step = (ms: number) => {
    this.raf = requestAnimationFrame(this.step);
    const ctx = this.ctx;
    const dt = Math.min(0.05, (ms - this.t) / 1000 || 0.016);
    this.t = ms;

    // The ground does not clear, it fades. Everything drawn stays a while and
    // the overlap is the picture.
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = this.opt.ground;
    // Very slow. A chord has to still be on the canvas when the next three
    // queries are drawn over it, or nothing ever accumulates and the picture
    // is a single fan that keeps being replaced.
    ctx.globalAlpha = 0.006;
    ctx.fillRect(0, 0, this.w, this.h);
    ctx.globalAlpha = 1;

    // Who is being asked.
    let held: number | null = null;
    if (this.pointer) held = this.nearestToken(this.pointer.x, this.pointer.y);
    if (held !== null) {
      this.query = held;
    } else {
      this.sweep += dt * 0.55;
      if (this.sweep >= 1) {
        this.sweep = 0;
        this.query = (this.query + 1 + Math.floor(Math.random() * 5)) % this.tokens.length;
      }
    }

    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';

    // Attention is not one word's turn — it is every word at once. So a few
    // others are drawn faintly under the one being asked, and what builds up
    // over a few seconds is the whole operation rather than a single fan.
    const also = [
      (this.query + 7 + Math.floor(this.t / 900)) % this.tokens.length,
      (this.query + 19 + Math.floor(this.t / 1500)) % this.tokens.length,
      (this.query + 31 + Math.floor(this.t / 2300)) % this.tokens.length,
    ];
    for (const q of also) this.chords(q, 0.16);
    this.chords(this.query, 1);
    this.tokens[this.query].heat = 1;

    const w = this.attend(this.query);
    const from = this.tokens[this.query];

    // Labels, redrawn crisp every frame over whatever has accumulated.
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.font = this.font;
    ctx.textBaseline = 'middle';
    for (const t of this.tokens) {
      t.heat *= 1 - dt * 1.9;
      const lit = Math.max(0, Math.min(1, t.heat));
      const left = t.align === 'right';

      ctx.save();
      ctx.translate(t.x, t.y);
      ctx.rotate(left ? t.a + Math.PI : t.a);
      ctx.textAlign = left ? 'right' : 'left';
      ctx.fillStyle = t === from ? this.opt.clay : this.opt.ink;
      ctx.globalAlpha = 0.22 + lit * 0.78;
      const off = this.radius < 90 ? 6 : 9;
      ctx.fillText(t.text, left ? -off : off, 0);
      ctx.restore();

      ctx.globalAlpha = 0.25 + lit * 0.75;
      ctx.beginPath();
      ctx.arc(t.x, t.y, t === from ? 3 : 1.5, 0, TAU);
      ctx.fillStyle = t === from ? this.opt.clay : this.opt.ink;
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    if (this.onQuery) {
      const top = w
        .map((v, i) => ({ word: this.tokens[i].text, weight: v }))
        .sort((a, b) => b.weight - a.weight)
        .slice(0, 3);
      this.onQuery(from.text, top);
    }
  };

  start() {
    if (!this.raf) this.raf = requestAnimationFrame(this.step);
  }

  stop() {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
  }
}
