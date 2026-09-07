export type Pt = [number, number];

/**
 * A loaded brush, and the one rule that makes it look like one.
 *
 * A stroked path is the wrong tool for this entirely. `lineWidth` is constant
 * along a path, and a brush is nothing *but* its change of width — the mark is
 * a ribbon whose thickness is how hard the hand was pressing, tapering to
 * nothing where it lifts. So every mark here is built as a filled polygon: the
 * path is resampled to an even step, given a width at each step, and offset to
 * both sides.
 *
 * The rule that sells it as wet media rather than a fat pen is that **thin is
 * also pale**. A brush carrying less pigment lays down less of it, so the width
 * and the depth of colour are the same variable. Draw the ribbon at one flat
 * colour and it reads as a cut-out ribbon; let the colour ride the width and it
 * reads as ink.
 */

export interface Hand {
  /** Deepest colour, where the brush is fully loaded. */
  ink: string;
  /** Palest, where it is running out. */
  wash: string;
  paper: string;
  /** Multiplies every width on the card. */
  weight: number;
  /** How much the two edges of the ribbon disagree with each other. */
  wobble: number;
  /** Extra swelling where the brush turns a corner and sits down. */
  wet: number;
  /** How often the brush skips off the tooth of the paper. */
  dry: number;
}

export interface Stroke {
  pts: Pt[];
  /** Widest the mark ever gets, as a fraction of the card's width. */
  weight: number;
  /** Bumps in the pressure: `[where along the stroke, how much extra]`. */
  swell?: [number, number][];
  /** How much of each end is spent tapering in and out. */
  taper?: [number, number];
}

// ------------------------------------------------------------------- geometry

/** Catmull-Rom through the control points, so a mark is authored as a gesture. */
function spline(pts: Pt[], per: number): Pt[] {
  if (pts.length < 3) return pts.slice();
  const at = (i: number) => pts[Math.max(0, Math.min(pts.length - 1, i))];
  const out: Pt[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = at(i - 1);
    const [x1, y1] = at(i);
    const [x2, y2] = at(i + 1);
    const [x3, y3] = at(i + 2);
    for (let s = 0; s < per; s++) {
      const t = s / per;
      const t2 = t * t;
      const t3 = t2 * t;
      out.push([
        0.5 * (2 * x1 + (-x0 + x2) * t + (2 * x0 - 5 * x1 + 4 * x2 - x3) * t2 + (-x0 + 3 * x1 - 3 * x2 + x3) * t3),
        0.5 * (2 * y1 + (-y0 + y2) * t + (2 * y0 - 5 * y1 + 4 * y2 - y3) * t2 + (-y0 + 3 * y1 - 3 * y2 + y3) * t3),
      ]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

/**
 * Resample to a constant step *in pixels*.
 *
 * The width profile is indexed by position along the mark, so the samples have
 * to be evenly spaced or a swell authored at the halfway point lands wherever
 * the control points happened to bunch up.
 */
function even(pts: Pt[], step: number): Pt[] {
  const out: Pt[] = [pts[0]];
  let ax = pts[0][0];
  let ay = pts[0][1];
  for (let i = 1; i < pts.length; i++) {
    let dx = pts[i][0] - ax;
    let dy = pts[i][1] - ay;
    let d = Math.hypot(dx, dy);
    while (d >= step) {
      ax += (dx / d) * step;
      ay += (dy / d) * step;
      out.push([ax, ay]);
      dx = pts[i][0] - ax;
      dy = pts[i][1] - ay;
      d = Math.hypot(dx, dy);
    }
  }
  if (out.length < 2) out.push(pts[pts.length - 1]);
  return out;
}

function hex(s: string): [number, number, number] {
  const v = parseInt(s.slice(1), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

export function mix(a: string, b: string, k: number): string {
  const p = hex(a);
  const q = hex(b);
  return `rgb(${Math.round(p[0] + (q[0] - p[0]) * k)},${Math.round(p[1] + (q[1] - p[1]) * k)},${Math.round(p[2] + (q[2] - p[2]) * k)})`;
}

// ---------------------------------------------------------------------- marks

/** Two sines at unrelated frequencies: enough wander, no repeating pattern. */
function wander(r: () => number) {
  const p1 = r() * 6.283;
  const f1 = 2.5 + r() * 3.5;
  const p2 = r() * 6.283;
  const f2 = 8 + r() * 9;
  return (u: number) => Math.sin(u * f1 * 6.283 + p1) * 0.64 + Math.sin(u * f2 * 6.283 + p2) * 0.36;
}

const SEG = 7;

/**
 * Lay one mark down.
 *
 * Drawn as a run of short overlapping polygons rather than one long one,
 * because each needs its own colour. Overlapping translucent fills would
 * double up at every join and print a ladder of dark rungs, so the run is
 * composited with `darken`: two overlapping pieces of ink take the deeper of
 * the two rather than the sum, which is also roughly what wet ink does.
 */
export function inkStroke(
  g: CanvasRenderingContext2D,
  k: Stroke,
  hand: Hand,
  w: number,
  h: number,
  r: () => number,
): void {
  const px = k.pts.map(([x, y]) => [x * w, y * h] as Pt);
  const line = even(spline(px, 16), Math.max(1.4, w * 0.006));
  const n = line.length;
  if (n < 4) return;

  const peak = k.weight * hand.weight * w;
  const [tin, tout] = k.taper ?? [0.16, 0.24];
  const swells = k.swell ?? [];
  const breathe = wander(r);

  // Where the brush loses the paper for a moment. Not random noise on the
  // width — a skip is a short, sharp, isolated event.
  const skips: number[] = [];
  for (let i = 0; i < 3; i++) if (r() < hand.dry) skips.push(0.12 + r() * 0.76);

  const wid = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1);
    // The base the swells sit on. The reference runs from a hairline at the
    // edge of the paper to a shoulder nine times as thick, and a base of much
    // over a third of the peak cannot get anywhere near that range — every
    // mark comes out the same confident middleweight.
    let m = 0.32;
    for (const [at, amt] of swells) {
      const d = (u - at) / 0.15;
      m += amt * Math.exp(-d * d);
    }
    for (const at of skips) {
      const d = (u - at) / 0.022;
      m -= 0.62 * Math.exp(-d * d);
    }
    const fin = Math.min(1, Math.pow(Math.min(u / tin, 1), 0.62));
    const fout = Math.min(1, Math.pow(Math.min((1 - u) / tout, 1), 0.62));
    wid[i] = Math.max(0.35, peak * m * fin * fout * (1 + breathe(u) * 0.14));
  }

  // Independent noise on each rim. One shared wobble moves the whole ribbon
  // and reads as a shaky line; two disagreeing ones read as a brush.
  const rimA = wander(r);
  const rimB = wander(r);
  const A: Pt[] = [];
  const B: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = line[Math.max(0, i - 1)];
    const b = line[Math.min(n - 1, i + 1)];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const d = Math.hypot(dx, dy) || 1;
    const nx = -dy / d;
    const ny = dx / d;
    const u = i / (n - 1);
    const half = wid[i] / 2;
    const ja = 1 + rimA(u) * hand.wobble;
    const jb = 1 + rimB(u) * hand.wobble;
    A.push([line[i][0] + nx * half * ja, line[i][1] + ny * half * ja]);
    B.push([line[i][0] - nx * half * jb, line[i][1] - ny * half * jb]);
  }

  g.save();

  // The wick: pigment creeping into the paper a little beyond the mark.
  g.globalAlpha = 0.1;
  g.fillStyle = hand.wash;
  g.beginPath();
  g.moveTo(A[0][0], A[0][1]);
  for (let i = 1; i < n; i++) g.lineTo(A[i][0], A[i][1]);
  for (let i = n - 1; i >= 0; i--) g.lineTo(B[i][0], B[i][1]);
  g.closePath();
  g.fill();
  g.lineJoin = 'round';
  g.lineWidth = Math.max(1, w * 0.006);
  g.strokeStyle = hand.wash;
  g.stroke();

  g.globalAlpha = 1;
  g.globalCompositeOperation = 'darken';
  for (let s = 0; s + 1 < n; s += SEG) {
    // Two steps of overlap, and each piece outlined in its own colour. Butted
    // exactly end to end the pieces share an edge but not a pixel, and the
    // antialiasing down that shared edge leaves a pale hairline — a ladder of
    // rungs across every mark on the card.
    const e = Math.min(n - 1, s + SEG + 2);
    let sum = 0;
    for (let i = s; i <= e; i++) sum += wid[i];
    const load = Math.min(1, sum / (e - s + 1) / (peak * 0.8));
    g.fillStyle = mix(hand.wash, hand.ink, Math.pow(load, 0.95));
    g.strokeStyle = g.fillStyle;
    g.lineWidth = 0.9;
    g.lineJoin = 'round';
    g.beginPath();
    g.moveTo(A[s][0], A[s][1]);
    for (let i = s + 1; i <= e; i++) g.lineTo(A[i][0], A[i][1]);
    for (let i = e; i >= s; i--) g.lineTo(B[i][0], B[i][1]);
    g.closePath();
    g.fill();
    g.stroke();
  }

  // Where the mark turns hard the brush stops travelling and sits down, and a
  // little more pigment goes in. It is the one place a corner is not sharp.
  if (hand.wet > 0) {
    for (let i = SEG; i < n - SEG; i += SEG * 2) {
      const a = line[i - SEG];
      const b = line[i];
      const c = line[i + SEG];
      const t1 = Math.atan2(b[1] - a[1], b[0] - a[0]);
      const t2 = Math.atan2(c[1] - b[1], c[0] - b[0]);
      let turn = Math.abs(t2 - t1);
      if (turn > Math.PI) turn = Math.PI * 2 - turn;
      if (turn < 0.85) continue;
      g.fillStyle = hand.ink;
      g.beginPath();
      g.ellipse(b[0], b[1], wid[i] * 0.5 * hand.wet, wid[i] * 0.38 * hand.wet, t1, 0, Math.PI * 2);
      g.fill();
    }
  }

  g.restore();
}

// ---------------------------------------------------------------------- paper

/** Cream stock with a few flecks in it, which is most of why it reads as paper. */
export function layPaper(
  g: CanvasRenderingContext2D,
  hand: Hand,
  w: number,
  h: number,
  r: () => number,
): void {
  g.fillStyle = hand.paper;
  g.fillRect(0, 0, w, h);
  g.save();
  for (let i = 0; i < 34; i++) {
    g.globalAlpha = 0.05 + r() * 0.13;
    g.fillStyle = r() < 0.7 ? '#6b6250' : hand.ink;
    const s = Math.max(0.5, w * (0.0012 + r() * 0.002));
    g.beginPath();
    g.ellipse(r() * w, r() * h, s, s * (0.6 + r() * 0.7), r() * 3, 0, Math.PI * 2);
    g.fill();
  }
  g.restore();
}
