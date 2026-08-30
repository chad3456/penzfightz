/**
 * The mark.
 *
 * This is the third medium in the repository and the first one that is honestly
 * a *screen* medium. The crayon study deposits pigment a pixel at a time
 * because a wax stick on rough paper is a physical event; the watercolour study
 * solves a fluid because water is one. A brush in a drawing app is neither. It
 * is a stamped round nib dragged along a path at a flat colour and an alpha,
 * and pretending otherwise — adding grain, adding bleed — is what makes digital
 * drawings look like bad reproductions of analogue ones.
 *
 * So there is no paper here, no tooth, no water, and nothing is simulated. A
 * mark is a path with a round cap. What has to be got right instead is
 * everything about *where the marks go*, because with no medium to hide behind
 * that is all there is.
 *
 * Coordinates are 0..1 across and down, and every width is a fraction of the
 * short side, so a drawing is resolution independent and a print is the card
 * again at size rather than the card enlarged.
 */

export type Pt = [number, number];

export interface MarkOptions {
  /** 0..1 of the short side. */
  width?: number;
  alpha?: number;
  /** How far the line staggers off its path, in short-side units. */
  wobble?: number;
  /** Overshoot at each end, as a fraction of the path length. */
  over?: number;
  cap?: CanvasLineCap;
  /** Multiply, for translucent fills that have to darken where they cross. */
  under?: boolean;
  /**
   * Keep the corners.
   *
   * Shapes are smoothed through their midpoints by default, which is what a
   * hand does and is right for a head, a leaf or a cheek. It is catastrophic
   * for anything that was manufactured: the first labels here were rectangles
   * and came out as circles with the word sitting in the middle of a
   * lozenge. Exactly the failure the crayon study hit with its doorframes,
   * reached from a different direction, and it is worth stating the rule
   * plainly — *smooth what grew, keep the corners on what was made.*
   */
  sharp?: boolean;
}

const mulberry = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/** A wandering 1-D signal. Every hand-made line needs one. */
function drift(seed: number) {
  const r = mulberry(seed);
  const g = new Float32Array(96);
  for (let i = 0; i < g.length; i++) g[i] = r() - 0.5;
  return (t: number) => {
    const f = t * 96;
    const i = Math.floor(f) % 96;
    const j = (i + 1) % 96;
    const k = f - Math.floor(f);
    return g[i] * (1 - k) + g[j] * k;
  };
}

export class Pad {
  readonly g: CanvasRenderingContext2D;
  readonly w: number;
  readonly h: number;
  /** Short side in pixels; every width is measured against it. */
  readonly s: number;
  private wob: (t: number) => number;
  private rnd: () => number;

  constructor(g: CanvasRenderingContext2D, w: number, h: number, seed: number) {
    this.g = g;
    this.w = w;
    this.h = h;
    this.s = Math.min(w, h);
    this.wob = drift(seed ^ 0x2f19);
    this.rnd = mulberry(seed ^ 0x77a3);
    g.lineJoin = 'round';
    g.lineCap = 'round';
  }

  reseed(seed: number) {
    this.wob = drift(seed ^ 0x2f19);
    this.rnd = mulberry(seed ^ 0x77a3);
  }

  get r() {
    return this.rnd;
  }

  px(p: Pt): Pt {
    return [p[0] * this.w, p[1] * this.h];
  }

  /**
   * A stroke.
   *
   * Drawn as quadratics through the midpoints of the polyline rather than as
   * straight segments, which is what a stylus actually produces and is the
   * difference between a hand and a graph. The wobble is applied along the
   * normal so the line keeps its shape while losing its confidence.
   */
  line(path: Pt[], colour: string, o: MarkOptions = {}) {
    if (path.length < 2) return;
    const g = this.g;
    const wob = (o.wobble ?? 0) * this.s;
    let pts = path.map(this.px, this);

    if (o.over) {
      const a = pts[0];
      const b = pts[1];
      const y = pts[pts.length - 1];
      const x = pts[pts.length - 2];
      const ext = (from: Pt, to: Pt, k: number): Pt => [
        to[0] + (to[0] - from[0]) * k,
        to[1] + (to[1] - from[1]) * k,
      ];
      pts = [ext(b, a, o.over * 3), ...pts, ext(x, y, o.over * 3)];
    }

    if (wob > 0) {
      pts = pts.map((p, i) => {
        const q = pts[Math.min(pts.length - 1, i + 1)];
        const d = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1;
        const nx = -(q[1] - p[1]) / d;
        const ny = (q[0] - p[0]) / d;
        const k = this.wob(i / pts.length + colour.length * 0.07) * wob;
        return [p[0] + nx * k, p[1] + ny * k] as Pt;
      });
    }

    g.save();
    if (o.under) g.globalCompositeOperation = 'multiply';
    g.globalAlpha = o.alpha ?? 1;
    g.strokeStyle = colour;
    g.lineWidth = Math.max(0.7, (o.width ?? 0.012) * this.s);
    g.lineCap = o.cap ?? 'round';
    g.beginPath();
    g.moveTo(pts[0][0], pts[0][1]);
    if (pts.length === 2) {
      g.lineTo(pts[1][0], pts[1][1]);
    } else {
      for (let i = 1; i < pts.length - 1; i++) {
        const mx = (pts[i][0] + pts[i + 1][0]) / 2;
        const my = (pts[i][1] + pts[i + 1][1]) / 2;
        g.quadraticCurveTo(pts[i][0], pts[i][1], mx, my);
      }
      g.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]);
    }
    g.stroke();
    g.restore();
  }

  /** A filled shape, smoothed the same way. */
  shape(path: Pt[], colour: string, o: MarkOptions = {}) {
    if (path.length < 3) return;
    const g = this.g;
    const pts = path.map(this.px, this);
    g.save();
    if (o.under) g.globalCompositeOperation = 'multiply';
    g.globalAlpha = o.alpha ?? 1;
    g.fillStyle = colour;
    g.beginPath();
    if (o.sharp) {
      g.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
    } else {
      g.moveTo((pts[0][0] + pts[pts.length - 1][0]) / 2, (pts[0][1] + pts[pts.length - 1][1]) / 2);
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i];
        const b = pts[(i + 1) % pts.length];
        g.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
      }
    }
    g.closePath();
    g.fill();
    g.restore();
  }

  /** One press of a fat round brush. The leaf, the petal, the cheek. */
  blob(at: Pt, rx: number, ry: number, rot: number, colour: string, o: MarkOptions = {}) {
    const g = this.g;
    const [x, y] = this.px(at);
    g.save();
    if (o.under) g.globalCompositeOperation = 'multiply';
    g.globalAlpha = o.alpha ?? 1;
    g.fillStyle = colour;
    g.translate(x, y);
    g.rotate(rot);
    g.beginPath();
    g.ellipse(0, 0, rx * this.s, ry * this.s, 0, 0, Math.PI * 2);
    g.fill();
    g.restore();
  }

  /** The swatch shape: a stroke so short it is a lozenge. */
  pill(at: Pt, len: number, thick: number, colour: string, alpha = 1) {
    this.line([[at[0] - len / 2, at[1]], [at[0] + len / 2, at[1]]], colour, {
      width: thick,
      alpha,
    });
  }

  clip(path: Pt[], fn: () => void) {
    const g = this.g;
    const pts = path.map(this.px, this);
    g.save();
    g.beginPath();
    g.moveTo((pts[0][0] + pts[pts.length - 1][0]) / 2, (pts[0][1] + pts[pts.length - 1][1]) / 2);
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      g.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
    }
    g.closePath();
    g.clip();
    fn();
    g.restore();
  }
}

// -------------------------------------------------------------- the contour

/**
 * The broken contour, which is the entire style.
 *
 * An outline in one colour is a colouring book. What these drawings do instead
 * is go round the form several times in different inks, in **arcs with gaps
 * between them**, each arc sitting a few pixels off the true edge. Three
 * separate things are happening and all three are needed:
 *
 * **It is broken.** A closed unbroken outline flattens whatever is inside it
 * into a sticker. Gaps let the fill and the paper meet, and the eye closes the
 * shape anyway — it is very good at that, and the drawing gets the credit.
 *
 * **It is off-register.** Every arc is displaced along the normal by a
 * few pixels, in or out at random. A contour exactly on the edge reads as a
 * *border*; a contour beside the edge reads as a person deciding where the edge
 * was. This is the same misregistration the crayon study uses for its accent,
 * arrived at from a completely different direction.
 *
 * **The colour is wrong on purpose.** Each arc takes one of the six, with no
 * regard for what it is going round. A bottle outlined in lime and blue is a
 * bottle you have to look at, which a bottle outlined in bottle-colour is not.
 */
export interface ContourOptions {
  width?: number;
  /** Passes round the form. Two is lively, four is a scribble. */
  laps?: number;
  /** Mean arc length as a fraction of the perimeter. */
  arc?: number;
  /** Fraction of the perimeter left as gap. */
  gap?: number;
  /** How far off the true edge an arc may sit, in short-side units. */
  offset?: number;
  alpha?: number;
}

export function contour(pad: Pad, path: Pt[], inks: string[], o: ContourOptions = {}) {
  if (path.length < 3 || !inks.length) return;
  const laps = o.laps ?? 3;
  const arc = o.arc ?? 0.13;
  const gap = o.gap ?? 0.5;
  const offset = o.offset ?? 0.012;
  const r = pad.r;

  // Resample the closed path evenly so an arc is a length rather than a count
  // of however many points the form happened to be described with.
  const closed = [...path, path[0]];
  const pxPath = closed.map((p) => [p[0], p[1]] as Pt);
  const seg: number[] = [0];
  for (let i = 1; i < pxPath.length; i++) {
    const dx = (pxPath[i][0] - pxPath[i - 1][0]) * pad.w;
    const dy = (pxPath[i][1] - pxPath[i - 1][1]) * pad.h;
    seg.push(seg[i - 1] + Math.hypot(dx, dy));
  }
  const total = seg[seg.length - 1] || 1;
  const at = (d: number): Pt => {
    const u = ((d % total) + total) % total;
    let i = 1;
    while (i < seg.length - 1 && seg[i] < u) i++;
    const t = (u - seg[i - 1]) / Math.max(1e-6, seg[i] - seg[i - 1]);
    return [
      pxPath[i - 1][0] + (pxPath[i][0] - pxPath[i - 1][0]) * t,
      pxPath[i - 1][1] + (pxPath[i][1] - pxPath[i - 1][1]) * t,
    ];
  };

  for (let lap = 0; lap < laps; lap++) {
    let d = r() * total;
    let guard = 0;
    while (d < total * (lap + 1) && guard++ < 200) {
      const len = total * arc * (0.45 + r() * 1.4);
      const push = (r() - 0.5) * 2 * offset;
      const steps = Math.max(3, Math.round(len / (total * 0.02)));
      const pts: Pt[] = [];
      for (let k = 0; k <= steps; k++) {
        const dd = d + (len * k) / steps;
        const a = at(dd);
        const b = at(dd + total * 0.01);
        const dx = (b[0] - a[0]) * pad.w;
        const dy = (b[1] - a[1]) * pad.h;
        const m = Math.hypot(dx, dy) || 1;
        pts.push([a[0] + (-dy / m) * push, a[1] + (dx / m) * push * (pad.w / pad.h)]);
      }
      pad.line(pts, inks[Math.floor(r() * inks.length) % inks.length], {
        width: o.width ?? 0.011,
        alpha: o.alpha ?? 1,
        wobble: 0.004,
        over: 0.02,
      });
      d += len + total * gap * arc * (0.3 + r() * 1.6);
    }
  }
}
