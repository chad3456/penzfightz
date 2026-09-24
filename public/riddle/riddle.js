/*
 * THE DIARY
 * Two minutes inside a schoolboy's diary, written in the first person by
 * somebody who has already decided what he is going to become.
 *
 * A fan work. Tom Riddle, his diary and the rest of that world are J. K.
 * Rowling's; every word written in this diary here is original, nothing is
 * quoted from the books, and the music is an original score rather than
 * anything from the films. Non-commercial, and made because somebody asked.
 *
 * Plain JavaScript, no libraries, no image files, no audio files. Every
 * frame is drawn on a 2D canvas; every sound is synthesised in this script.
 *
 * ── The rules ───────────────────────────────────────────────────────────
 *
 * Every frame is a pure function of its timestamp: `frame(ctx, t)` draws the
 * film at t seconds and depends on nothing else. No Math.random, no clock, no
 * accumulated state — every "random" thing is a hash. That is what lets the
 * same code play live and render to video frame by frame.
 *
 * The diary does one thing that no other book does: it drinks. Ink written on
 * its pages sinks into the paper and is gone. So every line here is written
 * stroke by stroke with a broad nib — thick on the downstrokes, thin across —
 * and then bleeds outward and vanishes, and the page is blank again.
 */
(function () {
  'use strict';

  /* ══════════════════════════════════════════════════════════════════════
     numbers
     ══════════════════════════════════════════════════════════════════════ */

  const W = 1920;
  const H = 1080;
  const DURATION = 120;
  const TAU = Math.PI * 2;

  const hash = (n) => {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
    return x - Math.floor(x);
  };
  const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
  const lerp = (a, b, t) => a + (b - a) * t;
  const prog = (t, a, b) => clamp((t - a) / (b - a));
  const eOut = (t) => 1 - Math.pow(1 - t, 3);
  const eIn = (t) => t * t * t;
  const eInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  /** Ink boils: re-traced ten times a second. */
  const boil = (t) => Math.floor(t * 10);

  function mulberry(seed) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ══════════════════════════════════════════════════════════════════════
     colour
     ══════════════════════════════════════════════════════════════════════ */

  const INK = '#1a120c';
  const BLEED = '#4a3524';
  const RED = '#7d1712';
  const GOLD = '#e6c15c';
  const GREEN = '#3fdc86';
  const PAPER = '#e7d9bb';

  /* ══════════════════════════════════════════════════════════════════════
     geometry
     ══════════════════════════════════════════════════════════════════════ */

  function resample(pts, step) {
    const out = [[pts[0][0], pts[0][1]]];
    let need = step;
    for (let i = 1; i < pts.length; i++) {
      let x0 = pts[i - 1][0];
      let y0 = pts[i - 1][1];
      const x1 = pts[i][0];
      const y1 = pts[i][1];
      let seg = Math.hypot(x1 - x0, y1 - y0);
      while (seg >= need && seg > 1e-9) {
        const k = need / seg;
        x0 += (x1 - x0) * k;
        y0 += (y1 - y0) * k;
        out.push([x0, y0]);
        seg -= need;
        need = step;
      }
      need -= seg;
    }
    const last = pts[pts.length - 1];
    out.push([last[0], last[1]]);
    return out;
  }

  function chaikin(pts, n = 2) {
    let p = pts;
    for (let k = 0; k < n; k++) {
      if (p.length < 3) return p;
      const q = [p[0]];
      for (let i = 0; i < p.length - 1; i++) {
        const [ax, ay] = p[i];
        const [bx, by] = p[i + 1];
        q.push([ax * 0.75 + bx * 0.25, ay * 0.75 + by * 0.25]);
        q.push([ax * 0.25 + bx * 0.75, ay * 0.25 + by * 0.75]);
      }
      q.push(p[p.length - 1]);
      p = q;
    }
    return p;
  }

  function wobble(pts, amp, seed) {
    const n = pts.length;
    const out = new Array(n);
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(0, i - 1)];
      const b = pts[Math.min(n - 1, i + 1)];
      let dx = b[0] - a[0];
      let dy = b[1] - a[1];
      const l = Math.hypot(dx, dy) || 1;
      dx /= l;
      dy /= l;
      const s = i * 0.41 + seed * 3.17;
      const w = (Math.sin(s) * 0.6 + Math.sin(s * 2.3 + seed) * 0.3 + Math.sin(s * 5.1 + seed * 1.7) * 0.1) * amp;
      out[i] = [pts[i][0] - dy * w, pts[i][1] + dx * w];
    }
    return out;
  }

  function trace(ctx, pts, closed) {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    if (closed) ctx.closePath();
  }

  function ellipse(cx, cy, rx, ry, n = 36, a0 = 0, a1 = TAU) {
    const out = [];
    for (let i = 0; i <= n; i++) {
      const a = a0 + ((a1 - a0) * i) / n;
      out.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
    }
    return out;
  }
  const rectP = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]];
  const lineP = (x0, y0, x1, y1) => [[x0, y0], [x1, y1]];
  const shift = (paths, dx, dy, s = 1) => paths.map((p) => p.map(([x, y]) => [x * s + dx, y * s + dy]));

  /** Parallel hatching clipped to a polygon, as a list of two-point paths. */
  function hatch(poly, angle, spacing, jitter = 0.25, seed = 1) {
    const c = Math.cos(-angle);
    const s = Math.sin(-angle);
    const rot = poly.map(([x, y]) => [x * c - y * s, x * s + y * c]);
    let y0 = Infinity;
    let y1 = -Infinity;
    for (const [, y] of rot) { y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    const out = [];
    const ci = Math.cos(angle);
    const si = Math.sin(angle);
    let k = 0;
    for (let y = y0 + spacing * 0.5; y < y1; y += spacing) {
      const xs = [];
      for (let i = 0; i < rot.length - 1; i++) {
        const [ax, ay] = rot[i];
        const [bx, by] = rot[i + 1];
        if ((ay <= y && by > y) || (by <= y && ay > y)) xs.push(ax + ((y - ay) / (by - ay)) * (bx - ax));
      }
      xs.sort((a, b) => a - b);
      for (let i = 0; i + 1 < xs.length; i += 2) {
        const j = (hash(seed * 17 + k++) - 0.5) * spacing * jitter * 4;
        const a = [xs[i] + j, y];
        const b = [xs[i + 1] - j, y];
        out.push([[a[0] * ci - a[1] * si, a[0] * si + a[1] * ci], [b[0] * ci - b[1] * si, b[0] * si + b[1] * ci]]);
      }
    }
    return out;
  }

  /** Cut two-point lines where they cross a circle, keeping what is outside. */
  function aroundCircle(lines, cx, cy, r) {
    const out = [];
    for (const [[ax, ay], [bx, by]] of lines) {
      const dx = bx - ax;
      const dy = by - ay;
      const fx = ax - cx;
      const fy = ay - cy;
      const A = dx * dx + dy * dy;
      const B = 2 * (fx * dx + fy * dy);
      const C = fx * fx + fy * fy - r * r;
      const disc = B * B - 4 * A * C;
      if (disc <= 0) { out.push([[ax, ay], [bx, by]]); continue; }
      const sq = Math.sqrt(disc);
      const t1 = (-B - sq) / (2 * A);
      const t2 = (-B + sq) / (2 * A);
      if (t1 > 0) out.push([[ax, ay], [ax + dx * Math.min(1, t1), ay + dy * Math.min(1, t1)]]);
      if (t2 < 1) out.push([[ax + dx * Math.max(0, t2), ay + dy * Math.max(0, t2)], [bx, by]]);
    }
    return out;
  }

  /* ══════════════════════════════════════════════════════════════════════
     the hand
     ══════════════════════════════════════════════════════════════════════ */

  // The same stroke-order letterforms the rest of the Back Bench is lettered in,
  // carried in whole so this file has no dependencies.
  const TOP = 0.05;
  const X = 0.40;
  const BASE = 0.78;
  const DESC = 0.98;

  const bowl = (cx, r, top = X, bot = BASE, from = 0.2, turns = 1) => {
    const pts = [];
    const ry = (bot - top) / 2;
    const cy = (top + bot) / 2;
    const n = Math.max(10, Math.round(18 * turns));
    for (let i = 0; i <= n; i++) {
      const a = (from + (i / n) * turns) * TAU;
      pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * ry]);
    }
    return pts;
  };
  const shoulder = (x0, x1) => [
    [x0, X + 0.12], [x0 + (x1 - x0) * 0.2, X - 0.02], [x0 + (x1 - x0) * 0.62, X - 0.01],
    [x1, X + 0.14], [x1, BASE],
  ];

  /**
   * The e, as one stroke: across the bar, then up and over and round, ending
   * open at the bottom right. Drawn the other way round — bowl clockwise from
   * the bar — the opening lands top right and every e on the screen reads as
   * a 6, which is exactly what the first draft of this film did.
   */
  function eStroke() {
    const cy = (X + BASE) / 2;
    const ry = (BASE - X) / 2;
    const pts = [[0.08, cy + 0.01], [0.47, cy]];
    const n = 16;
    for (let i = 1; i <= n; i++) {
      const a = -(i / n) * 0.8 * TAU;
      pts.push([0.27 + Math.cos(a) * 0.2, cy + Math.sin(a) * ry]);
    }
    return pts;
  }

  const G = {
    ' ': { w: 0.30, s: [] },
    a: { w: 0.54, s: [bowl(0.26, 0.19, X, BASE, 0.05, 1), [[0.45, X], [0.46, BASE]]] },
    b: { w: 0.54, s: [[[0.08, TOP], [0.09, BASE]], bowl(0.31, 0.21, X + 0.02, BASE, 0.42, 0.9)] },
    c: { w: 0.50, s: [bowl(0.28, 0.20, X, BASE, 0.08, 0.72)] },
    d: { w: 0.54, s: [bowl(0.26, 0.19, X, BASE, 0.05, 1), [[0.46, TOP], [0.46, BASE]]] },
    e: { w: 0.50, s: [eStroke()] },
    f: { w: 0.36, s: [[[0.30, TOP + 0.02], [0.18, TOP + 0.06], [0.16, X + 0.1], [0.16, BASE]], [[0.02, X + 0.04], [0.34, X + 0.02]]] },
    g: { w: 0.54, s: [bowl(0.26, 0.19, X, BASE, 0.05, 1), [[0.45, X], [0.46, BASE + 0.1], [0.36, DESC], [0.16, DESC - 0.03]]] },
    h: { w: 0.54, s: [[[0.09, TOP], [0.10, BASE]], shoulder(0.10, 0.46)] },
    i: { w: 0.26, s: [[[0.12, X], [0.13, BASE]], [[0.13, X - 0.14], [0.13, X - 0.11]]] },
    j: { w: 0.26, s: [[[0.16, X], [0.17, BASE + 0.12], [0.08, DESC], [-0.04, DESC - 0.03]], [[0.17, X - 0.14], [0.17, X - 0.11]]] },
    k: { w: 0.50, s: [[[0.09, TOP], [0.10, BASE]], [[0.44, X + 0.02], [0.12, X + 0.26]], [[0.22, X + 0.2], [0.45, BASE]]] },
    l: { w: 0.24, s: [[[0.11, TOP], [0.12, BASE - 0.04], [0.20, BASE]]] },
    m: { w: 0.80, s: [[[0.08, X], [0.09, BASE]], shoulder(0.09, 0.40), shoulder(0.40, 0.71)] },
    n: { w: 0.54, s: [[[0.09, X], [0.10, BASE]], shoulder(0.10, 0.46)] },
    o: { w: 0.56, s: [bowl(0.28, 0.21, X, BASE, 0, 1)] },
    p: { w: 0.54, s: [[[0.08, X], [0.09, DESC]], bowl(0.31, 0.21, X + 0.02, BASE, 0.42, 0.9)] },
    q: { w: 0.54, s: [bowl(0.26, 0.19, X, BASE, 0.05, 1), [[0.45, X], [0.46, DESC]]] },
    r: { w: 0.38, s: [[[0.09, X], [0.10, BASE]], [[0.10, X + 0.14], [0.18, X + 0.01], [0.34, X], [0.38, X + 0.06]]] },
    s: { w: 0.44, s: [[[0.36, X + 0.05], [0.18, X - 0.01], [0.08, X + 0.1], [0.22, X + 0.22], [0.34, X + 0.3], [0.30, BASE], [0.08, BASE - 0.02]]] },
    t: { w: 0.34, s: [[[0.16, TOP + 0.14], [0.16, BASE - 0.06], [0.28, BASE]], [[0.02, X + 0.02], [0.32, X]]] },
    u: { w: 0.54, s: [[[0.09, X], [0.09, BASE - 0.1], [0.20, BASE], [0.40, BASE - 0.06], [0.45, X]], [[0.45, X + 0.24], [0.46, BASE]]] },
    v: { w: 0.50, s: [[[0.06, X], [0.25, BASE], [0.45, X]]] },
    w: { w: 0.74, s: [[[0.05, X], [0.20, BASE], [0.34, X + 0.16], [0.49, BASE], [0.66, X]]] },
    x: { w: 0.48, s: [[[0.07, X], [0.42, BASE]], [[0.42, X], [0.07, BASE]]] },
    y: { w: 0.50, s: [[[0.06, X], [0.25, BASE]], [[0.47, X], [0.28, BASE + 0.08], [0.16, DESC], [0.00, DESC - 0.04]]] },
    z: { w: 0.46, s: [[[0.07, X + 0.02], [0.40, X]], [[0.40, X], [0.08, BASE]], [[0.06, BASE], [0.42, BASE - 0.03]]] },

    A: { w: 0.62, s: [[[0.04, BASE], [0.30, TOP], [0.58, BASE]], [[0.14, BASE - 0.22], [0.48, BASE - 0.24]]] },
    B: { w: 0.58, s: [[[0.10, TOP], [0.11, BASE]], [[0.11, TOP], [0.42, TOP + 0.05], [0.44, TOP + 0.2], [0.12, BASE * 0.53]], [[0.12, BASE * 0.53], [0.50, BASE * 0.56], [0.52, BASE - 0.08], [0.12, BASE]]] },
    C: { w: 0.58, s: [[[0.52, TOP + 0.08], [0.24, TOP - 0.01], [0.06, BASE * 0.5], [0.24, BASE + 0.02], [0.52, BASE - 0.1]]] },
    D: { w: 0.60, s: [[[0.10, TOP], [0.11, BASE]], [[0.11, TOP], [0.44, TOP + 0.06], [0.54, BASE * 0.5], [0.42, BASE - 0.02], [0.11, BASE]]] },
    E: { w: 0.52, s: [[[0.46, TOP], [0.10, TOP + 0.01], [0.11, BASE], [0.48, BASE - 0.01]], [[0.11, BASE * 0.52], [0.38, BASE * 0.5]]] },
    F: { w: 0.48, s: [[[0.44, TOP], [0.10, TOP + 0.01], [0.11, BASE]], [[0.11, BASE * 0.5], [0.36, BASE * 0.48]]] },
    G: { w: 0.62, s: [[[0.54, TOP + 0.08], [0.24, TOP - 0.01], [0.06, BASE * 0.5], [0.26, BASE + 0.02], [0.54, BASE - 0.08], [0.54, BASE * 0.6], [0.34, BASE * 0.6]]] },
    H: { w: 0.62, s: [[[0.09, TOP], [0.10, BASE]], [[0.52, TOP], [0.53, BASE]], [[0.10, BASE * 0.52], [0.52, BASE * 0.5]]] },
    I: { w: 0.24, s: [[[0.12, TOP], [0.13, BASE]]] },
    J: { w: 0.40, s: [[[0.32, TOP], [0.33, BASE - 0.06], [0.20, BASE + 0.02], [0.06, BASE - 0.08]]] },
    K: { w: 0.58, s: [[[0.09, TOP], [0.10, BASE]], [[0.50, TOP], [0.11, BASE * 0.56]], [[0.22, BASE * 0.44], [0.52, BASE]]] },
    L: { w: 0.48, s: [[[0.11, TOP], [0.12, BASE], [0.46, BASE - 0.02]]] },
    M: { w: 0.78, s: [[[0.07, BASE], [0.09, TOP], [0.35, BASE * 0.74], [0.62, TOP], [0.68, BASE]]] },
    N: { w: 0.66, s: [[[0.09, BASE], [0.10, TOP], [0.56, BASE], [0.57, TOP]]] },
    O: { w: 0.68, s: [bowl(0.33, 0.27, TOP, BASE, 0, 1)] },
    P: { w: 0.54, s: [[[0.10, TOP], [0.11, BASE]], [[0.11, TOP], [0.44, TOP + 0.06], [0.46, BASE * 0.44], [0.12, BASE * 0.56]]] },
    Q: { w: 0.68, s: [bowl(0.33, 0.27, TOP, BASE, 0, 1), [[0.40, BASE - 0.16], [0.60, BASE + 0.08]]] },
    R: { w: 0.58, s: [[[0.10, TOP], [0.11, BASE]], [[0.11, TOP], [0.44, TOP + 0.06], [0.46, BASE * 0.44], [0.12, BASE * 0.56]], [[0.26, BASE * 0.56], [0.52, BASE]]] },
    S: { w: 0.52, s: [[[0.46, TOP + 0.06], [0.20, TOP], [0.10, BASE * 0.36], [0.30, BASE * 0.56], [0.46, BASE * 0.74], [0.38, BASE + 0.02], [0.08, BASE - 0.06]]] },
    T: { w: 0.52, s: [[[0.02, TOP + 0.01], [0.50, TOP]], [[0.26, TOP], [0.27, BASE]]] },
    U: { w: 0.62, s: [[[0.09, TOP], [0.10, BASE - 0.1], [0.28, BASE + 0.01], [0.50, BASE - 0.1], [0.51, TOP]]] },
    V: { w: 0.62, s: [[[0.05, TOP], [0.30, BASE], [0.57, TOP]]] },
    W: { w: 0.88, s: [[[0.04, TOP], [0.22, BASE], [0.42, TOP + 0.2], [0.62, BASE], [0.82, TOP]]] },
    X: { w: 0.58, s: [[[0.07, TOP], [0.51, BASE]], [[0.51, TOP], [0.07, BASE]]] },
    Y: { w: 0.58, s: [[[0.06, TOP], [0.29, BASE * 0.6]], [[0.52, TOP], [0.29, BASE * 0.6], [0.29, BASE]]] },
    Z: { w: 0.54, s: [[[0.06, TOP + 0.01], [0.48, TOP]], [[0.48, TOP], [0.07, BASE]], [[0.05, BASE], [0.50, BASE - 0.02]]] },

    0: { w: 0.54, s: [bowl(0.27, 0.20, TOP, BASE, 0, 1)] },
    1: { w: 0.34, s: [[[0.08, TOP + 0.12], [0.20, TOP], [0.21, BASE]]] },
    2: { w: 0.50, s: [[[0.08, TOP + 0.1], [0.26, TOP - 0.01], [0.42, TOP + 0.14], [0.08, BASE], [0.44, BASE - 0.02]]] },
    3: { w: 0.50, s: [[[0.08, TOP + 0.06], [0.36, TOP], [0.22, BASE * 0.54], [0.42, BASE * 0.62], [0.34, BASE + 0.01], [0.08, BASE - 0.06]]] },
    4: { w: 0.52, s: [[[0.36, TOP], [0.06, BASE * 0.66], [0.48, BASE * 0.64]], [[0.36, TOP + 0.1], [0.37, BASE]]] },
    5: { w: 0.50, s: [[[0.42, TOP], [0.12, TOP + 0.02], [0.10, BASE * 0.52], [0.34, BASE * 0.5], [0.44, BASE * 0.76], [0.28, BASE + 0.01], [0.08, BASE - 0.06]]] },
    6: { w: 0.52, s: [[[0.40, TOP + 0.03], [0.14, TOP + 0.24], [0.10, BASE - 0.06], [0.30, BASE + 0.01], [0.44, BASE * 0.78], [0.24, BASE * 0.64], [0.11, BASE * 0.78]]] },
    7: { w: 0.48, s: [[[0.06, TOP + 0.01], [0.44, TOP], [0.20, BASE]]] },
    8: { w: 0.52, s: [bowl(0.27, 0.16, TOP, BASE * 0.6, 0, 1), bowl(0.27, 0.20, BASE * 0.56, BASE, 0, 1)] },
    9: { w: 0.52, s: [bowl(0.28, 0.17, TOP, BASE * 0.56, 0, 1), [[0.45, BASE * 0.4], [0.42, BASE - 0.06], [0.16, BASE - 0.01]]] },

    '.': { w: 0.24, s: [[[0.11, BASE - 0.02], [0.12, BASE]]] },
    ',': { w: 0.24, s: [[[0.13, BASE - 0.02], [0.08, BASE + 0.1]]] },
    ':': { w: 0.22, s: [[[0.11, X + 0.12], [0.11, X + 0.15]], [[0.11, BASE - 0.02], [0.11, BASE]]] },
    ';': { w: 0.22, s: [[[0.11, X + 0.12], [0.11, X + 0.15]], [[0.13, BASE - 0.02], [0.08, BASE + 0.1]]] },
    "'": { w: 0.18, s: [[[0.09, TOP], [0.07, TOP + 0.14]]] },
    '’': { w: 0.18, s: [[[0.09, TOP], [0.07, TOP + 0.14]]] },
    '!': { w: 0.24, s: [[[0.12, TOP], [0.10, BASE - 0.14]], [[0.09, BASE - 0.02], [0.09, BASE]]] },
    '?': { w: 0.46, s: [[[0.07, TOP + 0.1], [0.24, TOP - 0.01], [0.38, TOP + 0.14], [0.22, BASE * 0.6], [0.21, BASE - 0.14]], [[0.20, BASE - 0.02], [0.20, BASE]]] },
    '-': { w: 0.36, s: [[[0.05, BASE * 0.66], [0.31, BASE * 0.64]]] },
    '—': { w: 0.62, s: [[[0.03, BASE * 0.66], [0.59, BASE * 0.64]]] },
    '(': { w: 0.26, s: [[[0.20, TOP], [0.08, BASE * 0.54], [0.20, BASE + 0.06]]] },
    ')': { w: 0.26, s: [[[0.06, TOP], [0.18, BASE * 0.54], [0.06, BASE + 0.06]]] },
    '&': { w: 0.66, s: [[[0.56, BASE], [0.18, TOP + 0.06], [0.34, TOP + 0.02], [0.36, TOP + 0.22], [0.08, BASE * 0.7], [0.18, BASE + 0.02], [0.44, BASE * 0.72], [0.58, BASE * 0.6]]] },
    '/': { w: 0.38, s: [[[0.04, BASE], [0.32, TOP]]] },
    '·': { w: 0.26, s: [[[0.12, BASE * 0.6], [0.13, BASE * 0.6 + 0.02]]] },
    // added for this film
    '“': { w: 0.32, s: [[[0.10, TOP], [0.07, TOP + 0.14]], [[0.22, TOP], [0.19, TOP + 0.14]]] },
    '”': { w: 0.32, s: [[[0.10, TOP], [0.07, TOP + 0.14]], [[0.22, TOP], [0.19, TOP + 0.14]]] },
    '%': { w: 0.62, s: [bowl(0.15, 0.09, TOP, TOP + 0.24, 0, 1), [[0.08, BASE], [0.52, TOP]], bowl(0.46, 0.09, BASE - 0.24, BASE, 0, 1)] },
    '~': { w: 0.50, s: [[[0.04, BASE * 0.66], [0.14, BASE * 0.58], [0.26, BASE * 0.66], [0.38, BASE * 0.72], [0.46, BASE * 0.62]]] },
  };
  G['ö'] = { w: 0.56, s: [bowl(0.28, 0.21, X, BASE, 0, 1), [[0.18, X - 0.13], [0.18, X - 0.11]], [[0.38, X - 0.13], [0.38, X - 0.11]]] };
  G['"'] = G['“'];

  const glyph = (ch) => G[ch] || G[ch.toLowerCase()] || G[' '];

  function measure(text, tracking) {
    let w = 0;
    for (const ch of text) w += glyph(ch).w + tracking;
    return w;
  }

  function wrap(text, size, maxW, tracking) {
    const out = [];
    for (const para of text.split('\n')) {
      let line = '';
      for (const word of para.split(' ')) {
        const next = line ? line + ' ' + word : word;
        if (line && measure(next, tracking) * size > maxW) { out.push(line); line = word; } else line = next;
      }
      out.push(line);
    }
    return out;
  }

  const layoutCache = new Map();

  /**
   * A block of handwriting, laid out as strokes. `y` is the top of the block.
   * Cached: the shapes never change, only the boil and how much is showing.
   */
  function layout(b) {
    const key = [b.text, b.x, b.y, b.size, b.maxW, b.align, b.slant, b.seed].join('|');
    const hit = layoutCache.get(key);
    if (hit) return hit;
    if (layoutCache.size > 800) layoutCache.clear();
    const size = b.size;
    const tracking = b.tracking == null ? 0.03 : b.tracking;
    const lead = b.lead || 1.36;
    const slant = b.slant == null ? 0.22 : b.slant;
    const lines = wrap(b.text, size, b.maxW || 1e9, tracking);
    const strokes = [];
    let total = 0;
    lines.forEach((line, li) => {
      const lw = measure(line, tracking) * size;
      let pen = b.align === 'center' ? b.x - lw / 2 : b.align === 'right' ? b.x - lw : b.x;
      const top = b.y + li * size * lead;
      for (let i = 0; i < line.length; i++) {
        const g = glyph(line[i]);
        const s = (b.seed || 1) * 131 + li * 71 + i * 17;
        const dy = (Math.sin(s * 0.7) + Math.sin(s * 1.9) * 0.5) * 0.012 * size;
        const sl = slant + Math.sin(s * 3.1) * 0.02;
        const sx = 1 + Math.sin(s * 2.3) * 0.03;
        for (const st of g.s) {
          let pts = st.map(([ux, uy]) => [pen + ux * size * sx + (0.78 - uy) * size * sl, top + uy * size + dy]);
          if (pts.length > 2) pts = chaikin(pts, 2);
          const r = resample(pts, Math.max(1.6, size * 0.045));
          let len = 0;
          for (let k = 1; k < r.length; k++) len += Math.hypot(r[k][0] - r[k - 1][0], r[k][1] - r[k - 1][1]);
          strokes.push({ pts: r, len: Math.max(len, 0.5), seed: s });
          total += Math.max(len, 0.5);
        }
        pen += (g.w + tracking) * size * sx;
      }
    });
    const out = { strokes, total, lines, h: lines.length * size * lead };
    layoutCache.set(key, out);
    return out;
  }

  /**
   * A broad nib held at forty-five degrees: every segment is as wide as the
   * nib looks from the direction it is travelling. That single rule is what
   * turns a monoline scrawl into something that reads as pen and ink.
   */
  function nibStroke(ctx, pts, w, nib = -0.75) {
    for (let i = 1; i < pts.length; i++) {
      const [ax, ay] = pts[i - 1];
      const [bx, by] = pts[i];
      const a = Math.atan2(by - ay, bx - ax);
      ctx.lineWidth = w * (0.34 + 0.9 * Math.abs(Math.sin(a - nib)));
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.stroke();
    }
  }

  function partial(pts, budget) {
    const cut = [pts[0]];
    let acc = 0;
    for (let k = 1; k < pts.length; k++) {
      const d = Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]);
      if (acc + d > budget) {
        const f = (budget - acc) / d;
        cut.push([lerp(pts[k - 1][0], pts[k][0], f), lerp(pts[k - 1][1], pts[k][1], f)]);
        return cut;
      }
      acc += d;
      cut.push(pts[k]);
    }
    return cut;
  }

  const writeDur = (b) => b.dur || clamp(b.text.length * 0.05, 0.8, 3.4);

  /**
   * Write a block, then — if it has a sink time — let the page drink it.
   *
   * The sink is the whole character of the book, so it is not a fade. For a
   * second and a bit the ink spreads outward into the fibres of the paper,
   * browner and fainter as it goes, and then it is simply not there.
   */
  function inkText(ctx, b, t) {
    if (t < b.at) return;
    const sinkK = b.sink != null ? prog(t, b.sink, b.sink + 1.35) : 0;
    if (sinkK >= 1) return;
    const L = layout(b);
    const reveal = prog(t, b.at, b.at + writeDur(b));
    let budget = L.total * reveal;
    const w = b.size * 0.075 * (b.weight || 1);
    const bo = boil(t);
    const fade = 1 - eOut(sinkK);
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    let tip = null;
    for (const st of L.strokes) {
      if (budget <= 0) break;
      const pts = budget < st.len ? partial(st.pts, budget) : st.pts;
      budget -= st.len;
      if (pts.length < 2) continue;
      const q = wobble(pts, b.size * 0.007, st.seed + bo * 0.61);
      if (sinkK > 0) {
        ctx.globalAlpha = 0.2 * (1 - sinkK) * Math.min(1, sinkK * 6);
        ctx.strokeStyle = BLEED;
        ctx.lineWidth = w * (1.4 + 4.5 * sinkK);
        trace(ctx, q, false);
        ctx.stroke();
      }
      ctx.globalAlpha = (b.alpha == null ? 0.95 : b.alpha) * fade;
      ctx.strokeStyle = b.color || INK;
      nibStroke(ctx, q, w);
      tip = q[q.length - 1];
    }
    // a wet bead of ink at the nib while it is still writing
    if (reveal > 0 && reveal < 1 && tip) {
      ctx.globalAlpha = 0.8;
      ctx.fillStyle = b.color || INK;
      ctx.beginPath();
      ctx.arc(tip[0], tip[1], w * 0.9, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  /** One letter's strokes, placed. For the letters that come off the page. */
  function letterStrokes(ch, x, top, size, slant, seed) {
    const g = glyph(ch);
    return g.s.map((st, k) => {
      let pts = st.map(([ux, uy]) => [x + ux * size + (0.78 - uy) * size * slant, top + uy * size]);
      if (pts.length > 2) pts = chaikin(pts, 2);
      return { pts: resample(pts, Math.max(2, size * 0.05)), seed: seed * 7 + k };
    });
  }

  /* ══════════════════════════════════════════════════════════════════════
     drawings: ink that draws itself, washes that seep in
     ══════════════════════════════════════════════════════════════════════ */

  const sketchCache = new WeakMap();

  function prep(paths) {
    let c = sketchCache.get(paths);
    if (c) return c;
    const list = paths.map((p) => {
      const r = resample(p, 3.5);
      let len = 0;
      for (let k = 1; k < r.length; k++) len += Math.hypot(r[k][0] - r[k - 1][0], r[k][1] - r[k - 1][1]);
      return { pts: r, len: Math.max(0.5, len) };
    });
    const total = list.reduce((a, b) => a + b.len, 0);
    c = { list, total };
    sketchCache.set(paths, c);
    return c;
  }

  /**
   * A drawing that draws itself in pen order, then — like the writing — sinks.
   * `o.at` start, `o.dur` how long the pen takes, `o.sink` when it drinks.
   */
  function sketch(ctx, paths, t, o) {
    if (t < o.at) return;
    const sinkK = o.sink != null ? prog(t, o.sink, o.sink + 1.35) : 0;
    if (sinkK >= 1) return;
    const P = prep(paths);
    const reveal = prog(t, o.at, o.at + (o.dur || 2));
    let budget = P.total * (o.order === 'all' ? 1 : reveal);
    const bo = boil(t);
    const fade = 1 - eOut(sinkK);
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = o.color || INK;
    const w = o.w || 3;
    P.list.forEach((p, i) => {
      if (budget <= 0) return;
      const pts = budget < p.len ? partial(p.pts, budget) : p.pts;
      budget -= p.len;
      if (pts.length < 2) return;
      const q = wobble(pts, o.amp == null ? 1.1 : o.amp, (o.seed || 1) * 13 + i + bo * 0.37);
      if (sinkK > 0) {
        ctx.globalAlpha = 0.18 * (1 - sinkK) * Math.min(1, sinkK * 6);
        ctx.strokeStyle = BLEED;
        ctx.lineWidth = w * (1.5 + 4 * sinkK);
        trace(ctx, q, false);
        ctx.stroke();
        ctx.strokeStyle = o.color || INK;
      }
      ctx.globalAlpha = (o.alpha == null ? 0.9 : o.alpha) * fade;
      ctx.lineWidth = w;
      trace(ctx, q, false);
      ctx.stroke();
    });
    ctx.restore();
  }

  /** A wash of colour that seeps in after the lines, pooling at its edges. */
  function wash(ctx, poly, t, o) {
    const k = prog(t, o.at, o.at + (o.dur || 1.2));
    if (k <= 0) return;
    const sinkK = o.sink != null ? prog(t, o.sink, o.sink + 1.35) : 0;
    if (sinkK >= 1) return;
    const a = (o.alpha == null ? 0.5 : o.alpha) * eOut(k) * (1 - eOut(sinkK));
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = o.color;
    trace(ctx, poly, true);
    ctx.fill();
    ctx.globalAlpha = a * 0.6;
    ctx.strokeStyle = o.edge || o.color;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
  }

  /* ══════════════════════════════════════════════════════════════════════
     the book
     ══════════════════════════════════════════════════════════════════════ */

  const PW = 780;        // page width
  const PH = 940;        // page height
  const SPX = 960;       // the spine
  const TOPY = 80;       // top of the pages
  const M = 18;          // how far the boards stand proud of the pages
  const CLOSED_X = -(PW + M) / 2;

  const cache = {};

  function canvas(w, h, draw) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    draw(c.getContext('2d'), w, h);
    return c;
  }

  /** Old paper: fibre, foxing, a damp stain, and edges gone brown with handling. */
  function paperCanvas(side) {
    const key = 'paper' + side;
    if (cache[key]) return cache[key];
    cache[key] = canvas(PW, PH, (g, w, h) => {
      g.fillStyle = PAPER;
      g.fillRect(0, 0, w, h);
      const img = g.getImageData(0, 0, w, h);
      const d = img.data;
      for (let i = 0; i < w * h; i++) {
        const n = (hash(i * 0.917 + side * 7) - 0.5) * 16 + (hash(Math.floor(i / w) * 0.31 + side) - 0.5) * 5;
        d[i * 4] += n;
        d[i * 4 + 1] += n;
        d[i * 4 + 2] += n * 0.8;
      }
      g.putImageData(img, 0, 0);
      for (let i = 0; i < 70; i++) {
        const x = hash(i * 3.1 + side * 11) * w;
        const y = hash(i * 5.3 + side * 13) * h;
        const r = 2 + hash(i * 7.7) * (hash(i * 9.9) > 0.85 ? 26 : 7);
        const gr = g.createRadialGradient(x, y, 0, x, y, r);
        gr.addColorStop(0, 'rgba(140,90,40,0.28)');
        gr.addColorStop(1, 'rgba(140,90,40,0)');
        g.fillStyle = gr;
        g.fillRect(x - r, y - r, r * 2, r * 2);
      }
      // a tide-line stain from something set down on it long ago
      const sx = side ? w * 0.72 : w * 0.3;
      const sy = side ? h * 0.82 : h * 0.2;
      g.strokeStyle = 'rgba(130,85,40,0.12)';
      g.lineWidth = 5;
      g.beginPath();
      g.ellipse(sx, sy, 90, 70, 0.4, 0.2, TAU - 0.7);
      g.stroke();
      g.fillStyle = 'rgba(150,100,50,0.05)';
      g.beginPath();
      g.ellipse(sx, sy, 88, 68, 0.4, 0, TAU);
      g.fill();
      // handled edges
      const outer = side ? w : 0;
      const ge = g.createLinearGradient(outer, 0, side ? w - 140 : 140, 0);
      ge.addColorStop(0, 'rgba(110,70,30,0.35)');
      ge.addColorStop(1, 'rgba(110,70,30,0)');
      g.fillStyle = ge;
      g.fillRect(0, 0, w, h);
      for (const [y0, y1] of [[0, 110], [h, h - 110]]) {
        const gv = g.createLinearGradient(0, y0, 0, y1);
        gv.addColorStop(0, 'rgba(110,70,30,0.3)');
        gv.addColorStop(1, 'rgba(110,70,30,0)');
        g.fillStyle = gv;
        g.fillRect(0, 0, w, h);
      }
    });
    return cache[key];
  }

  /** Black leather, cracked with age, worn brown at the corners. */
  function leatherCanvas() {
    if (cache.leather) return cache.leather;
    const w = PW + M;
    const h = PH + M * 2;
    cache.leather = canvas(w, h, (g) => {
      g.fillStyle = '#1b1614';
      g.fillRect(0, 0, w, h);
      const img = g.getImageData(0, 0, w, h);
      const d = img.data;
      for (let i = 0; i < w * h; i++) {
        const n = (hash(i * 0.613) - 0.5) * 18;
        d[i * 4] += n;
        d[i * 4 + 1] += n * 0.9;
        d[i * 4 + 2] += n * 0.8;
      }
      g.putImageData(img, 0, 0);
      g.strokeStyle = 'rgba(0,0,0,0.5)';
      g.lineWidth = 1.2;
      for (let i = 0; i < 90; i++) {
        let x = hash(i * 2.7) * w;
        let y = hash(i * 4.1) * h;
        g.beginPath();
        g.moveTo(x, y);
        for (let k = 0; k < 6; k++) {
          x += (hash(i * 11 + k) - 0.5) * 40;
          y += (hash(i * 13 + k) - 0.5) * 40;
          g.lineTo(x, y);
        }
        g.stroke();
      }
      for (const [cx, cy] of [[w, 0], [w, h], [0, 0], [0, h]]) {
        const gr = g.createRadialGradient(cx, cy, 0, cx, cy, 170);
        gr.addColorStop(0, 'rgba(92,64,44,0.75)');
        gr.addColorStop(1, 'rgba(92,64,44,0)');
        g.fillStyle = gr;
        g.fillRect(0, 0, w, h);
      }
      g.strokeStyle = 'rgba(120,90,60,0.35)';
      g.lineWidth = 2;
      g.strokeRect(22, 22, w - 44, h - 44);
    });
    return cache.leather;
  }

  function deskCanvas() {
    if (cache.desk) return cache.desk;
    const w = 2400;
    const h = 1500;
    cache.desk = canvas(w, h, (g) => {
      g.fillStyle = '#20150e';
      g.fillRect(0, 0, w, h);
      for (let i = 0; i < 520; i++) {
        const y = hash(i * 1.37) * h;
        const tone = hash(i * 2.9);
        g.strokeStyle = tone > 0.5 ? 'rgba(90,58,34,0.22)' : 'rgba(0,0,0,0.3)';
        g.lineWidth = 1 + hash(i * 4.4) * 3;
        g.beginPath();
        for (let x = 0; x <= w; x += 40) {
          const yy = y + Math.sin(x * 0.004 + i) * 10 + Math.sin(x * 0.013 + i * 3) * 3;
          if (x === 0) g.moveTo(x, yy); else g.lineTo(x, yy);
        }
        g.stroke();
      }
      g.fillStyle = 'rgba(0,0,0,0.55)';
      for (let y = 180; y < h; y += 330) g.fillRect(0, y, w, 4);
    });
    return cache.desk;
  }

  const GUTTER = (ctx, side) => {
    const x0 = side ? 0 : PW;
    const gr = ctx.createLinearGradient(x0, 0, side ? 90 : PW - 90, 0);
    gr.addColorStop(0, 'rgba(40,24,12,0.42)');
    gr.addColorStop(0.35, 'rgba(40,24,12,0.12)');
    gr.addColorStop(1, 'rgba(40,24,12,0)');
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, PW, PH);
  };

  /** A page, in its own coordinates: 0..PW across, 0..PH down. */
  function page(ctx, side, content, t) {
    ctx.drawImage(paperCanvas(side), 0, 0);
    if (content) content(ctx, t);
    GUTTER(ctx, side);
  }

  function board(ctx, side) {
    ctx.save();
    ctx.translate(side ? SPX : SPX - PW - M, TOPY - M);
    ctx.drawImage(leatherCanvas(), 0, 0);
    ctx.restore();
  }

  /** The block of pages under the top one, seen as lines at the fore-edge. */
  function pageBlock(ctx, side) {
    ctx.save();
    ctx.strokeStyle = 'rgba(200,180,140,0.55)';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 5; i++) {
      const x = side ? SPX + PW + i * 2 : SPX - PW - i * 2;
      ctx.beginPath();
      ctx.moveTo(x, TOPY + i * 1.2);
      ctx.lineTo(x, TOPY + PH - i * 1.2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function pageAt(ctx, side, content, t) {
    ctx.save();
    ctx.translate(side ? SPX : SPX - PW, TOPY);
    page(ctx, side, content, t);
    ctx.restore();
  }

  /** The cover, in right-page coordinates, with the name on it. */
  function coverFront(ctx, t) {
    ctx.drawImage(leatherCanvas(), 0, -M);
    const flick = candleLevel(t);
    const b = { text: 'T. M. RIDDLE', x: PW / 2 + 10, y: PH - 190, size: 40, align: 'center', slant: 0, seed: 4, tracking: 0.14, at: -1, dur: 0.01, color: GOLD, alpha: 0.55 + 0.25 * flick, weight: 0.9 };
    inkText(ctx, b, t);
  }

  /**
   * A leaf turning over the spine. θ = 0 lies flat on the right, π flat on the
   * left. The front is drawn in right-page coordinates and the back in left.
   */
  function leaf(ctx, theta, front, back, t, isCover) {
    const c = Math.cos(theta);
    ctx.save();
    if (c >= 0) {
      const s = Math.max(0.002, c);
      // the shadow it throws on the page below
      const edge = SPX + PW * s;
      const sh = ctx.createLinearGradient(edge, 0, edge + 160 * (1 - s) + 10, 0);
      sh.addColorStop(0, `rgba(10,5,2,${0.45 * (1 - s)})`);
      sh.addColorStop(1, 'rgba(10,5,2,0)');
      ctx.fillStyle = sh;
      ctx.fillRect(edge, TOPY, 170, PH);
      ctx.translate(SPX, TOPY);
      ctx.scale(s, 1);
      if (isCover) coverFront(ctx, t); else page(ctx, 1, front, t);
      ctx.fillStyle = `rgba(0,0,0,${0.35 * (1 - s)})`;
      ctx.fillRect(0, isCover ? -M : 0, PW + (isCover ? M : 0), PH + (isCover ? 2 * M : 0));
    } else {
      const s = Math.max(0.002, -c);
      const edge = SPX - PW * s;
      const sh = ctx.createLinearGradient(edge, 0, edge - 160 * (1 - s) - 10, 0);
      sh.addColorStop(0, `rgba(10,5,2,${0.45 * (1 - s)})`);
      sh.addColorStop(1, 'rgba(10,5,2,0)');
      ctx.fillStyle = sh;
      ctx.fillRect(edge - 170, TOPY, 170, PH);
      ctx.translate(SPX - PW * s, TOPY);
      ctx.scale(s, 1);
      if (isCover) ctx.drawImage(leatherCanvas(), -M, -M);
      page(ctx, 0, back, t);
      ctx.fillStyle = `rgba(0,0,0,${0.3 * (1 - s)})`;
      ctx.fillRect(isCover ? -M : 0, isCover ? -M : 0, PW + (isCover ? M : 0), PH + (isCover ? 2 * M : 0));
    }
    ctx.restore();
  }

  /* ══════════════════════════════════════════════════════════════════════
     the candle
     ══════════════════════════════════════════════════════════════════════ */

  const CANDLE = { x: 96, y: 330 };
  const LIGHT_AT = 1.0;
  const OUT_AT = 119.0;

  function candleLevel(t) {
    if (t < LIGHT_AT) return 0;
    const on = eOut(prog(t, LIGHT_AT, LIGHT_AT + 0.5));
    const off = 1 - prog(t, OUT_AT, OUT_AT + 0.18);
    const fl = 0.86 + 0.08 * Math.sin(t * 13.1) + 0.05 * Math.sin(t * 23.7 + 1.3) + 0.03 * Math.sin(t * 41.9);
    return on * off * fl;
  }

  function drawCandle(ctx, t) {
    const { x, y } = CANDLE;
    ctx.save();
    // holder
    ctx.fillStyle = '#6b4e22';
    ctx.beginPath();
    ctx.ellipse(x, y + 430, 62, 16, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#8c6a30';
    ctx.beginPath();
    ctx.ellipse(x, y + 424, 56, 12, 0, 0, TAU);
    ctx.fill();
    // wax, with drips
    const gw = ctx.createLinearGradient(x - 24, 0, x + 24, 0);
    gw.addColorStop(0, '#b9a98a');
    gw.addColorStop(0.45, '#efe4cc');
    gw.addColorStop(1, '#9d8d70');
    ctx.fillStyle = gw;
    ctx.beginPath();
    ctx.moveTo(x - 24, y + 422);
    ctx.lineTo(x - 24, y + 40);
    ctx.quadraticCurveTo(x - 10, y + 30, x, y + 34);
    ctx.quadraticCurveTo(x + 12, y + 28, x + 24, y + 40);
    ctx.lineTo(x + 24, y + 422);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#e4d7bc';
    for (const [dx, len] of [[-16, 60], [10, 110], [19, 40]]) {
      ctx.beginPath();
      ctx.ellipse(x + dx, y + 40 + len / 2, 5, len / 2, 0, 0, TAU);
      ctx.fill();
    }
    // wick
    ctx.strokeStyle = '#1a1208';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, y + 34);
    ctx.lineTo(x + 1, y + 16);
    ctx.stroke();
    const lv = candleLevel(t);
    if (lv > 0.01) {
      const fh = 58 * lv * (0.92 + 0.08 * Math.sin(t * 17));
      const sway = Math.sin(t * 3.1) * 3 + Math.sin(t * 7.3) * 1.5;
      const fg = ctx.createRadialGradient(x, y + 4, 0, x, y - 10, fh);
      fg.addColorStop(0, 'rgba(255,255,230,1)');
      fg.addColorStop(0.35, 'rgba(255,214,120,0.95)');
      fg.addColorStop(1, 'rgba(255,120,30,0)');
      ctx.fillStyle = fg;
      ctx.beginPath();
      ctx.moveTo(x, y + 20);
      ctx.bezierCurveTo(x - 16, y + 8, x - 12, y - fh * 0.5, x + sway, y + 18 - fh);
      ctx.bezierCurveTo(x + 12, y - fh * 0.5, x + 16, y + 8, x, y + 20);
      ctx.fill();
      ctx.fillStyle = 'rgba(80,120,255,0.55)';
      ctx.beginPath();
      ctx.ellipse(x, y + 14, 5, 7, 0, 0, TAU);
      ctx.fill();
    }
    // smoke, once it is out
    if (t > OUT_AT) {
      const k = prog(t, OUT_AT, OUT_AT + 1.2);
      ctx.strokeStyle = `rgba(200,200,200,${0.35 * (1 - k)})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let i = 0; i <= 30; i++) {
        const u = i / 30;
        const px = x + Math.sin(u * 7 + t * 2) * 12 * u;
        const py = y + 16 - u * 220 * (0.4 + k);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  function lighting(ctx, t) {
    const lv = candleLevel(t);
    /*
      One candle does not light a desk evenly. Before this, both pages sat in
      the same flat cream from edge to edge and the whole film read as a
      well-lit reading room rather than somebody's bed after lights out.
    */
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    const fall = ctx.createRadialGradient(CANDLE.x, CANDLE.y, 60, CANDLE.x, CANDLE.y, 2000);
    const dim = 0.55 + 0.45 * lv;
    fall.addColorStop(0, `rgb(${Math.round(255 * dim)},${Math.round(245 * dim)},${Math.round(225 * dim)})`);
    fall.addColorStop(0.55, `rgb(${Math.round(190 * dim)},${Math.round(160 * dim)},${Math.round(135 * dim)})`);
    fall.addColorStop(1, `rgb(${Math.round(110 * dim)},${Math.round(88 * dim)},${Math.round(74 * dim)})`);
    ctx.fillStyle = fall;
    ctx.fillRect(-400, -300, W + 800, H + 600);
    ctx.restore();
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(CANDLE.x, CANDLE.y, 0, CANDLE.x, CANDLE.y, 1500);
    g.addColorStop(0, `rgba(255,170,80,${0.34 * lv})`);
    g.addColorStop(0.18, `rgba(255,150,60,${0.1 * lv})`);
    g.addColorStop(1, 'rgba(255,140,50,0)');
    ctx.fillStyle = g;
    ctx.fillRect(-400, -300, W + 800, H + 600);
    ctx.restore();
    // the dark, which is most of the room
    const v = ctx.createRadialGradient(W * 0.46, H * 0.48, H * 0.3, W * 0.5, H * 0.5, H * 1.05);
    v.addColorStop(0, 'rgba(6,3,1,0)');
    v.addColorStop(1, `rgba(6,3,1,${0.86 - 0.3 * lv})`);
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, W, H);
  }

  /* ══════════════════════════════════════════════════════════════════════
     what is written
     Page coordinates. `at` the pen starts, `sink` the page drinks it.
     ══════════════════════════════════════════════════════════════════════ */

  const T = (page, text, x, y, size, at, sink, o = {}) => ({ page, text, x, y, size, at, sink, maxW: 620, align: 'left', seed: Math.round(x + y + at * 10), ...o });

  const TEXT = [
    // 0 · the first page
    [
      T('R', 'You found me.', 390, 250, 64, 10.9, 15.9, { align: 'center' }),
      T('R', 'Most people never look twice at an empty book.', 80, 390, 42, 12.6, 16.1),
      T('L', 'Let me show you what I think about, when nobody is reading.', 80, 330, 44, 16.6, 20.6),
      T('R', 'Turn the page.', 390, 700, 38, 19.4, 21.1, { align: 'center' }),
    ],
    // 1 · Wool's
    [
      T('R', 'Wool’s Orphanage, London. 1938.', 80, 80, 32, 23.2, 35.3),
      T('R', 'They called me strange, as if strange were a smaller word than special.', 80, 200, 40, 24.6, 35.5),
      T('R', 'I learned early that people will do almost anything to stop being afraid of you.', 80, 420, 40, 28.4, 35.7),
      T('R', 'Then a letter came. It said I was not strange at all.', 80, 640, 40, 32.0, 35.9),
    ],
    // 2 · potions
    [
      T('L', 'Notes on Potions', 80, 70, 44, 37.9, 57.2),
      T('R', 'Felix Felicis', 80, 70, 40, 38.6, 57.2, { weight: 1.15 }),
      T('R', 'luck, bottled. For people who need it.', 110, 122, 29, 39.4, 57.2, { alpha: 0.8 }),
      T('R', 'Amortentia', 80, 222, 40, 41.4, 57.3, { weight: 1.15 }),
      T('R', 'smells of whatever you love. To me it smelled of nothing at all.', 110, 274, 29, 42.1, 57.3, { alpha: 0.8 }),
      T('R', 'Draught of Living Death', 80, 414, 40, 44.6, 57.4, { weight: 1.15 }),
      T('R', 'a sleep so deep it passes for the other thing.', 110, 466, 29, 45.8, 57.4, { alpha: 0.8 }),
      T('R', 'Veritaserum', 80, 566, 40, 47.6, 57.5, { weight: 1.15 }),
      T('R', 'three drops, and nobody keeps a secret from you. Almost nobody.', 110, 618, 29, 48.4, 57.5, { alpha: 0.8 }),
      T('R', 'Polyjuice', 80, 758, 40, 50.8, 57.6, { weight: 1.15 }),
      T('R', 'an hour as someone else. I have never wanted to be anyone else.', 110, 810, 29, 51.5, 57.6, { alpha: 0.8 }),
      T('L', 'The Potions master is easy to flatter.', 440, 140, 26, 53.8, 57.2, { color: RED, maxW: 300, slant: 0.3 }),
      T('L', 'a potion against dying', 90, 880, 30, 54.6, 57.6, { color: RED }),
      T('L', '— none. Yet.', 430, 880, 30, 56.3, 57.7, { color: RED }),
    ],
    // 3 · the chamber
    [
      T('L', 'I found what the founder left behind: a door that only opens for a language nobody else can speak.', 80, 90, 38, 60.4, 72.6),
      T('R', 'A girl died.', 80, 90, 46, 64.4, 72.7),
      T('R', 'I was given an award.', 80, 170, 46, 65.7, 72.8),
      T('R', 'Somebody had to take the blame. I chose the biggest boy in the school. People are always ready to believe the worst of the big ones.', 80, 300, 34, 67.6, 72.9),
    ],
    // 4 · the name
    [
      T('L', 'I carried my father’s name for sixteen years.', 80, 500, 44, 76.0, 85.2),
      T('L', 'Then I found a better use for the letters.', 80, 680, 44, 78.0, 85.4),
    ],
    // 5 · the split
    [
      T('L', 'Death is the only thing I have ever been afraid of.', 80, 80, 40, 91.2, 97.5),
      T('R', 'So I made sure there would be more of me than it could carry.', 80, 80, 40, 93.7, 97.6),
      T('L', 'Seven. The most magical number there is.', 80, 850, 36, 102.6, 107.4),
      T('R', 'One of them is in your hands.', 80, 850, 42, 104.8, 107.6),
    ],
    // 6 · the last page
    [
      T('R', 'Write to me.', 390, 360, 76, 110.6, null, { align: 'center', weight: 1.1 }),
      T('R', 'I will be waiting.', 390, 520, 36, 113.2, null, { align: 'center', alpha: 0.75 }),
    ],
  ];

  /* ── illustrations, in page coordinates ─────────────────────────────── */

  const ART = {};

  // Wool's: a barred window with a thin moon, an iron bed, and a spoon that will not stay still
  (() => {
    const win = rectP(170, 130, 440, 400);
    const inner = rectP(190, 150, 400, 360);
    const bars = [1, 2, 3, 4].map((i) => lineP(190 + i * 80, 150, 190 + i * 80, 510));
    const mid = [lineP(190, 330, 590, 330)];
    const moon = [ellipse(470, 230, 46, 46, 30, -1.2, 1.9), ellipse(452, 226, 40, 44, 30, -1.05, 1.75)];
    // Split round the moon, not filtered by midpoint: the hatch lines run the
    // full width of the window, so a line's middle is almost never anywhere
    // near the moon and the first cut drew the night straight across it.
    const night = aroundCircle(hatch(inner.slice(0, 4).concat([inner[0]]), 0.9, 11, 0.3, 3), 470, 230, 58);
    const sill = [lineP(150, 540, 630, 540), lineP(160, 556, 620, 556)];
    const bed = [
      lineP(80, 650, 80, 860), lineP(80, 650, 330, 650), lineP(330, 650, 330, 860),
      ...[1, 2, 3, 4, 5].map((i) => lineP(80 + i * 41, 650, 80 + i * 41, 760)),
      lineP(80, 760, 700, 760), lineP(330, 780, 700, 780), lineP(700, 760, 700, 860),
      [[330, 740], [420, 720], [520, 726], [640, 716], [700, 740]],
    ];
    ART.wools = { paths: [win, inner, ...bars, ...mid, ...moon, ...sill, ...bed], at: 23.2, dur: 4.2, w: 3, sink: 35.2 };
    ART.night = { paths: night, at: 26.4, dur: 2.2, w: 1.6, sink: 35.2, alpha: 0.75 };
  })();

  function spoon(ctx, t) {
    if (t < 27) return;
    const sinkK = prog(t, 35.2, 36.5);
    if (sinkK >= 1) return;
    const bend = eInOut(prog(t, 29.5, 31.5)) * 0.9;
    const float = eOut(prog(t, 27.4, 28.6)) * 40;
    ctx.save();
    ctx.translate(640, 640 - float + Math.sin(t * 1.7) * 6);
    ctx.rotate(-0.5 + Math.sin(t * 1.1) * 0.06);
    const handle = [];
    for (let i = 0; i <= 12; i++) {
      const u = i / 12;
      const a = u * bend;
      handle.push([Math.sin(a) * u * 120, -u * 120 * Math.cos(a) * 0.9 - 14]);
    }
    sketch(ctx, [ellipse(0, 22, 24, 34, 24), handle], t, { at: 27, dur: 0.8, w: 3.4, sink: 35.2, seed: 9 });
    ctx.restore();
    // three little motion marks
    if (t > 28.6 && sinkK === 0) {
      ctx.save();
      ctx.globalAlpha = 0.5 + 0.3 * Math.sin(t * 6);
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(585 + i * 8, 700 - i * 10);
        ctx.lineTo(575 + i * 8, 716 - i * 10);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  // the letter
  ART.envelope = {
    paths: [rectP(250, 800, 290, 120), [[250, 800], [395, 868], [540, 800]], [[250, 920], [360, 850]], [[540, 920], [430, 850]]],
    at: 33.8, dur: 1.2, w: 3, sink: 35.9,
  };

  // potions: five bottles and a cauldron
  const BOTTLES = [
    { x: 110, body: ellipse(0, 60, 44, 44, 30), neck: rectP(-12, -8, 24, 30), color: '#e3b33c', liquid: ellipse(0, 70, 40, 34, 30, 0, Math.PI) },
    { x: 250, body: [[0, -4], [36, 30], [42, 70], [0, 104], [-42, 70], [-36, 30], [0, -4]], neck: rectP(-10, -26, 20, 24), color: '#f0a0b8', liquid: [[-40, 60], [40, 60], [0, 102]] },
    { x: 390, body: rectP(-24, 0, 48, 110), neck: rectP(-9, -28, 18, 28), color: '#2a2230', liquid: rectP(-22, 30, 44, 78) },
    { x: 530, body: rectP(-16, 30, 32, 76), neck: rectP(-7, 14, 14, 16), color: '#c8dbe6', liquid: rectP(-14, 70, 28, 34) },
    { x: 670, body: rectP(-38, 10, 76, 96), neck: rectP(-12, -14, 24, 24), color: '#6b7a2e', liquid: rectP(-36, 44, 72, 60) },
  ];
  const BOTTLE_AT = [40.2, 42.6, 45.4, 48.4, 51.6];

  const CAULDRON = (() => {
    const cx = 390;
    const cy = 700;
    const body = [];
    for (let i = 0; i <= 30; i++) {
      const a = Math.PI * (i / 30);
      body.push([cx - Math.cos(a) * 190, cy + Math.sin(a) * 150]);
    }
    return {
      paths: [
        ellipse(cx, cy, 190, 34, 40), ellipse(cx, cy, 170, 26, 40), body,
        lineP(cx - 120, cy + 110, cx - 150, cy + 190), lineP(cx + 120, cy + 110, cx + 150, cy + 190), lineP(cx, cy + 150, cx, cy + 195),
        ...hatch(body.concat([body[0]]), -0.7, 13, 0.3, 5),
      ],
      liquid: ellipse(cx, cy, 168, 25, 40),
    };
  })();

  function potionsArt(ctx, t) {
    sketch(ctx, CAULDRON.paths, t, { at: 38.2, dur: 3, w: 3, sink: 57.2, seed: 21 });
    wash(ctx, CAULDRON.liquid, t, { at: 40.4, color: '#2f9e5c', alpha: 0.65, sink: 57.2 });
    // fumes
    if (t > 40.6 && t < 58.6) {
      const a = prog(t, 40.6, 41.8) * (1 - prog(t, 57.2, 58.4));
      ctx.save();
      ctx.globalCompositeOperation = 'multiply';
      for (let i = 0; i < 6; i++) {
        const ph = t * 0.55 + i * 0.37;
        const base = 330 + (i - 2.5) * 46;
        const pts = [];
        for (let k = 0; k <= 26; k++) {
          const u = k / 26;
          pts.push([base + Math.sin(u * 6 + ph * 3 + i) * (18 + u * 34), 690 - u * 300]);
        }
        ctx.globalAlpha = 0.35 * a;
        ctx.strokeStyle = '#3aa46a';
        ctx.lineWidth = 7 - i * 0.5;
        trace(ctx, pts, false);
        ctx.stroke();
      }
      ctx.restore();
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(390, 660, 0, 390, 600, 300);
      g.addColorStop(0, `rgba(60,220,130,${0.28 * a})`);
      g.addColorStop(1, 'rgba(60,220,130,0)');
      ctx.fillStyle = g;
      ctx.fillRect(60, 300, 660, 520);
      ctx.restore();
      // bubbles on the surface
      for (let i = 0; i < 7; i++) {
        const ph = (t * 0.9 + hash(i * 3.3)) % 1;
        ctx.save();
        ctx.globalAlpha = a * (1 - ph) * 0.8;
        ctx.strokeStyle = INK;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(260 + hash(i * 7.1) * 260, 700 - ph * 14, 4 + ph * 10, 0, TAU);
        ctx.stroke();
        ctx.restore();
      }
    }
    // the bottles
    BOTTLES.forEach((b, i) => {
      ctx.save();
      ctx.translate(b.x, 330);
      const at = BOTTLE_AT[i];
      sketch(ctx, [b.body, b.neck, rectP(-8, -40 + (i === 1 ? -6 : 0), 16, 14)], t, { at, dur: 0.9, w: 2.6, sink: 57.3, seed: 30 + i });
      wash(ctx, b.liquid, t, { at: at + 0.7, color: b.color, alpha: 0.72, sink: 57.3 });
      if (i === 0 && t > at + 1.2 && t < 57.8) {
        ctx.globalCompositeOperation = 'lighter';
        const g = ctx.createRadialGradient(0, 60, 0, 0, 60, 60);
        g.addColorStop(0, `rgba(255,210,90,${0.25 + 0.1 * Math.sin(t * 4)})`);
        g.addColorStop(1, 'rgba(255,210,90,0)');
        ctx.fillStyle = g;
        ctx.fillRect(-60, 0, 120, 120);
      }
      ctx.restore();
    });
    // the underline under the heading and the strike through the potion that does not exist
    sketch(ctx, [[[80, 136], [420, 130]]], t, { at: 38.9, dur: 0.5, w: 2.4, sink: 57.2, seed: 41 });
    sketch(ctx, [[[84, 912], [420, 906]]], t, { at: 55.9, dur: 0.35, w: 3, color: RED, sink: 57.6, seed: 42 });
  }

  // the chamber: a round door with seven serpents for bolts
  ART.door = (() => {
    const cx = 390;
    const cy = 560;
    const paths = [ellipse(cx, cy, 150, 150, 50), ellipse(cx, cy, 128, 128, 50), ellipse(cx, cy, 26, 26, 20)];
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * TAU - Math.PI / 2;
      const p = [];
      for (let k = 0; k <= 16; k++) {
        const u = k / 16;
        const r = 30 + u * 92;
        const off = Math.sin(u * 9) * 0.1;
        p.push([cx + Math.cos(a + off) * r, cy + Math.sin(a + off) * r]);
      }
      paths.push(p);
      paths.push(ellipse(cx + Math.cos(a) * 124, cy + Math.sin(a) * 124, 8, 6, 12));
    }
    return { paths, at: 60.6, dur: 3.2, w: 3, sink: 72.8 };
  })();

  // the six things, drawn where the pieces landed
  const OBJECTS = (() => {
    const diary = [rectP(-46, -60, 92, 120), lineP(-34, -60, -34, 60), lineP(46, -54, 52, -48), lineP(52, -48, 52, 64), lineP(52, 64, -40, 64)];
    const ring = [ellipse(0, 26, 52, 22, 30), ellipse(0, 26, 42, 15, 30), ellipse(0, -10, 22, 18, 20), lineP(-18, 4, -10, 12), lineP(18, 4, 10, 12)];
    const locket = [ellipse(0, 20, 40, 50, 30), ellipse(0, 20, 30, 40, 30), [[0, -30], [-10, -54], [0, -76], [10, -54], [0, -30]],
      [[12, -8], [-10, 0], [10, 20], [-8, 34], [10, 48]]];
    const cup = [[[-48, -44], [-40, 10], [0, 32], [40, 10], [48, -44]], ellipse(0, -44, 48, 11, 30), lineP(0, 32, 0, 62), ellipse(0, 66, 32, 9, 24),
      ellipse(-58, -14, 14, 20, 16, Math.PI * 0.5, Math.PI * 1.5), ellipse(58, -14, 14, 20, 16, -Math.PI * 0.5, Math.PI * 0.5)];
    const diadem = [ellipse(0, 20, 64, 20, 30, 0, Math.PI), [[-64, 20], [-50, -10], [-34, 10], [-18, -30], [0, 0], [18, -30], [34, 10], [50, -10], [64, 20]], ellipse(0, -18, 10, 14, 16)];
    const coil = [];
    for (let i = 0; i <= 70; i++) {
      const u = i / 70;
      const a = u * TAU * 2.4;
      const r = 8 + u * 46;
      coil.push([Math.cos(a) * r, Math.sin(a) * r * 0.8]);
    }
    const snake = [coil, ellipse(62, -4, 14, 9, 14), [[74, -4], [90, -8], [96, -14]], [[90, -8], [97, -2]]];
    return [
      { name: 'a diary', side: 'L', x: 250, y: 250, paths: diary, fill: rectP(-46, -60, 92, 120), color: '#241a14', alpha: 0.75 },
      { name: 'a cup', side: 'R', x: 530, y: 250, paths: cup, fill: [[-46, -40], [-40, 10], [0, 30], [40, 10], [46, -40]], color: '#c9a24a', alpha: 0.6 },
      { name: 'a ring', side: 'L', x: 150, y: 500, paths: ring, fill: ellipse(0, -10, 22, 18, 20), color: '#111', alpha: 0.9 },
      { name: 'a diadem', side: 'R', x: 640, y: 500, paths: diadem, fill: ellipse(0, -18, 10, 14, 16), color: '#3f6fb0', alpha: 0.85 },
      { name: 'a locket', side: 'L', x: 300, y: 715, paths: locket, fill: ellipse(0, 20, 40, 50, 30), color: '#c9a24a', alpha: 0.55 },
      { name: 'a snake', side: 'R', x: 490, y: 715, paths: snake, fill: null, color: '#3f6b3a', alpha: 0.6 },
    ];
  })();
  const SHATTER = 97.6;
  const ARRIVE = OBJECTS.map((_, i) => 99.2 + i * 0.32);
  const DEPART = OBJECTS.map((_, i) => SHATTER + 0.15 + i * 0.12);

  function objectsOn(ctx, side, t) {
    OBJECTS.forEach((o, i) => {
      if (o.side !== side) return;
      const at = ARRIVE[i];
      if (t < at) return;
      ctx.save();
      ctx.translate(o.x, o.y);
      // the green flash of arrival
      const f = 1 - prog(t, at, at + 0.9);
      if (f > 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 130);
        g.addColorStop(0, `rgba(80,255,150,${0.5 * f})`);
        g.addColorStop(1, 'rgba(80,255,150,0)');
        ctx.fillStyle = g;
        ctx.fillRect(-130, -130, 260, 260);
        ctx.restore();
      }
      sketch(ctx, o.paths, t, { at, dur: 1.0, w: 2.8, sink: 107.4, seed: 50 + i });
      if (o.fill) wash(ctx, o.fill, t, { at: at + 0.8, color: o.color, alpha: o.alpha, sink: 107.4 });
      ctx.restore();
      inkText(ctx, { text: o.name, x: o.x, y: o.y + 82, size: 28, align: 'center', at: at + 1.0, dur: 0.6, sink: 107.3, alpha: 0.75, seed: 60 + i, maxW: 400 }, t);
      // the diary, which is this diary, keeps a faint glow
      if (i === 0 && t > 105.4 && t < 107.6) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const k = Math.sin(prog(t, 105.4, 107.6) * Math.PI);
        const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, 140);
        g.addColorStop(0, `rgba(80,255,150,${0.4 * k})`);
        g.addColorStop(1, 'rgba(80,255,150,0)');
        ctx.fillStyle = g;
        ctx.fillRect(o.x - 140, o.y - 140, 280, 280);
        ctx.restore();
      }
    });
  }

  // the last page: an inkwell and a quill
  ART.quill = {
    paths: [
      ellipse(210, 780, 70, 18, 30), [[140, 780], [146, 850], [274, 850], [280, 780]], ellipse(210, 850, 66, 12, 30),
      [[230, 770], [330, 560], [420, 380]],
      [[420, 380], [380, 420], [350, 480], [330, 560]],
      [[420, 380], [440, 440], [400, 520], [330, 560]],
      ...[0, 1, 2, 3, 4, 5, 6].map((k) => [[340 + k * 12, 520 - k * 22], [370 + k * 12, 510 - k * 22]]),
    ],
    at: 110.4, dur: 2.4, w: 2.6,
  };

  /* ── what each page shows ────────────────────────────────────────────── */

  const SPREAD_AT = [0, 21.5, 36.2, 58.0, 74.0, 89.5, 108.5];
  const TURN = 1.5;
  const OPEN_AT = 6.2;
  const OPEN_DUR = 2.0;
  const CLOSE_AT = 116.6;
  const CLOSE_DUR = 2.0;

  function texts(ctx, i, side, t) {
    for (const b of TEXT[i]) if (b.page === side) inkText(ctx, b, t);
  }

  function content(i, side) {
    return (ctx, t) => {
      if (i === 0 && side === 'R') {
        // the drop of ink, and the blot it makes before the page takes it
        if (t > 9.55) {
          const k = prog(t, 9.55, 11.4);
          if (k < 1) {
            ctx.save();
            ctx.globalAlpha = 0.9 * (1 - eIn(k));
            ctx.fillStyle = INK;
            ctx.beginPath();
            const r = 22 + 14 * eOut(prog(t, 9.55, 9.75)) + k * 30;
            for (let a = 0; a <= 24; a++) {
              const ang = (a / 24) * TAU;
              const rr = r * (0.8 + 0.4 * hash(a * 3.7));
              const px = 390 + Math.cos(ang) * rr;
              const py = 250 + Math.sin(ang) * rr * 0.9;
              if (a === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            }
            ctx.fill();
            ctx.restore();
          }
        }
      }
      if (i === 1 && side === 'L') {
        sketch(ctx, ART.wools.paths, t, ART.wools);
        sketch(ctx, ART.night.paths, t, ART.night);
        spoon(ctx, t);
      }
      if (i === 1 && side === 'R') {
        sketch(ctx, ART.envelope.paths, t, ART.envelope);
        wash(ctx, ellipse(395, 862, 22, 22, 20), t, { at: 34.7, color: RED, alpha: 0.85, sink: 35.9 });
      }
      if (i === 2 && side === 'L') potionsArt(ctx, t);
      if (i === 3 && side === 'L') sketch(ctx, ART.door.paths, t, ART.door);
      if (i === 4 && side === 'R') nameOnPage(ctx, t);
      if (i === 5) objectsOn(ctx, side, t);
      if (i === 6 && side === 'L') sketch(ctx, ART.quill.paths, t, ART.quill);
      texts(ctx, i, side, t);
    };
  }

  /* ══════════════════════════════════════════════════════════════════════
     things that leave the page
     ══════════════════════════════════════════════════════════════════════ */

  /* ── the snake ───────────────────────────────────────────────────────── */

  const SNAKE_PATH = (() => {
    const pts = [];
    for (let i = 0; i <= 600; i++) {
      const u = i / 600;
      pts.push([-260 + u * 2500, 850 + Math.sin(u * TAU * 2.1) * 80 + Math.sin(u * TAU * 5.3 + 1) * 18]);
    }
    const cum = [0];
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    return { pts, cum, len: cum[cum.length - 1] };
  })();
  const SNAKE_T0 = 60.2;
  const SNAKE_V = 215;
  const SNAKE_L = 720;

  function along(s) {
    const { pts, cum } = SNAKE_PATH;
    if (s <= 0) return pts[0];
    let lo = 0;
    let hi = cum.length - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (cum[m] < s) lo = m; else hi = m; }
    const f = (s - cum[lo]) / (cum[hi] - cum[lo] || 1);
    return [lerp(pts[lo][0], pts[hi][0], f), lerp(pts[lo][1], pts[hi][1], f)];
  }
  const snakeHeadX = (t) => along((t - SNAKE_T0) * SNAKE_V)[0];

  function drawSnake(ctx, t) {
    const head = (t - SNAKE_T0) * SNAKE_V;
    if (head < 0 || head - SNAKE_L > SNAKE_PATH.len) return;
    ctx.save();
    ctx.lineCap = 'round';
    const N = 90;
    let prev = null;
    for (let i = N; i >= 0; i--) {
      const s = head - (i / N) * SNAKE_L;
      const p = along(s);
      // the body undulates sideways as it goes
      const q = along(s + 4);
      const ang = Math.atan2(q[1] - p[1], q[0] - p[0]);
      const wig = Math.sin(s * 0.03 - t * 9) * 10 * (i / N);
      const pp = [p[0] - Math.sin(ang) * wig, p[1] + Math.cos(ang) * wig];
      if (prev) {
        const u = i / N;
        const w = u > 0.9 ? 30 * (1 - (u - 0.9) * 8) : 12 + 22 * Math.pow(1 - u, 0.5) * Math.min(1, u * 8 + 0.2);
        ctx.strokeStyle = INK;
        ctx.globalAlpha = 0.92;
        ctx.lineWidth = w;
        ctx.beginPath();
        ctx.moveTo(prev[0], prev[1]);
        ctx.lineTo(pp[0], pp[1]);
        ctx.stroke();
        if (i % 3 === 0 && w > 10) {
          ctx.strokeStyle = 'rgba(160,140,100,0.35)';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.arc(pp[0], pp[1], w * 0.3, ang + 2, ang + 4.3);
          ctx.stroke();
        }
      }
      prev = pp;
    }
    // the head
    const hp = along(head);
    const hq = along(head + 6);
    const ang = Math.atan2(hq[1] - hp[1], hq[0] - hp[0]);
    ctx.translate(hp[0], hp[1]);
    ctx.rotate(ang);
    ctx.globalAlpha = 1;
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.ellipse(10, 0, 32, 20, 0, 0, TAU);
    ctx.fill();
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = GREEN;
    ctx.shadowColor = GREEN;
    ctx.shadowBlur = 16;
    for (const sy of [-9, 9]) {
      ctx.beginPath();
      ctx.ellipse(20, sy, 6, 2.2, 0, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
    if (Math.sin(t * 9) > 0.35) {
      ctx.strokeStyle = RED;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(40, 0);
      ctx.lineTo(62, 0);
      ctx.lineTo(72, -6);
      ctx.moveTo(62, 0);
      ctx.lineTo(72, 6);
      ctx.stroke();
    }
    ctx.restore();
  }

  /* ── the name ────────────────────────────────────────────────────────── */

  const SRC = 'TOM MARVOLO RIDDLE';
  const DST = 'I AM LORD VOLDEMORT';
  const NAME_WRITE = [79.2, 81.0];
  const LIFT = 81.2;
  const MOVE = 82.3;
  const LAND = 85.0;
  const SETTLE = 86.6;
  const DROWN = 87.6;

  function place(str, cx, top, size, tracking) {
    const w = measure(str, tracking) * size;
    let pen = cx - w / 2;
    const out = [];
    for (const ch of str) {
      const g = glyph(ch);
      if (ch !== ' ') out.push({ ch, x: pen, y: top, size, w: g.w * size });
      pen += (g.w + tracking) * size;
    }
    return out;
  }

  const NAME = (() => {
    const src = place(SRC, SPX + 390, TOPY + 400, 62, 0.08);
    const dst = place(DST, SPX, 250, 92, 0.1);
    const used = new Array(src.length).fill(false);
    const map = dst.map((d) => {
      const j = src.findIndex((s, k) => !used[k] && s.ch === d.ch);
      used[j] = true;
      return j;
    });
    // for each source letter, where it goes
    const to = new Array(src.length);
    map.forEach((j, i) => { to[j] = i; });
    return { src, dst, to };
  })();

  /** The name as it is first written: ordinary ink, on the right-hand page. */
  function nameOnPage(ctx, t) {
    if (t < NAME_WRITE[0]) return;
    NAME.src.forEach((L, i) => {
      if (t >= LIFT + i * 0.04) return;
      const k = prog(t, NAME_WRITE[0] + (i / NAME.src.length) * (NAME_WRITE[1] - NAME_WRITE[0]), NAME_WRITE[0] + ((i + 1) / NAME.src.length) * (NAME_WRITE[1] - NAME_WRITE[0]));
      if (k <= 0) return;
      const strokes = letterStrokes(L.ch, L.x - SPX, L.y - TOPY, L.size, 0.1, i);
      ctx.save();
      ctx.strokeStyle = INK;
      ctx.lineCap = 'round';
      ctx.globalAlpha = 0.95;
      const total = strokes.reduce((a, s) => a + s.pts.length, 0);
      let budget = total * k;
      for (const s of strokes) {
        if (budget <= 1) break;
        const pts = s.pts.slice(0, Math.max(2, Math.min(s.pts.length, Math.round(budget))));
        budget -= s.pts.length;
        nibStroke(ctx, wobble(pts, 0.6, s.seed + boil(t) * 0.5), L.size * 0.075);
      }
      ctx.restore();
    });
  }

  /** The letters in the air: lifting, travelling, landing as the other name. */
  function drawName(ctx, t) {
    if (t < LIFT || t > DROWN + 1.4) return;
    NAME.src.forEach((L, i) => {
      const lift = eOut(prog(t, LIFT + i * 0.04, LIFT + i * 0.04 + 0.9));
      if (lift <= 0) return;
      const d = NAME.dst[NAME.to[i]];
      const mk = eInOut(prog(t, MOVE + i * 0.07, MOVE + i * 0.07 + 1.6));
      // where it is lifted to: straight up off the page, grown
      const ux = L.x;
      const uy = L.y - 130 * lift;
      const usize = lerp(L.size, d.size * 0.8, lift);
      // then an arc to its place in the new name
      const arc = Math.sin(mk * Math.PI) * (i % 2 ? -140 : 110);
      let x = lerp(ux, d.x, mk);
      let y = lerp(uy, d.y, mk) + arc;
      let size = lerp(usize, d.size, mk);
      const settle = eIn(prog(t, SETTLE, SETTLE + 0.9));
      y += settle * 120;
      size *= 1 - settle * 0.3;
      const drown = prog(t, DROWN, DROWN + 1.3);
      if (drown >= 1) return;
      const hover = mk >= 1 && settle === 0 ? Math.sin(t * 2.2 + i) * 4 : 0;
      y += hover;
      // colour: ink, then gold in the air, then ink again as it goes back down
      const goldness = lift * (1 - settle);
      const flash = t > LAND && t < LAND + 0.6 ? 1 - prog(t, LAND, LAND + 0.6) : 0;
      ctx.save();
      /*
        A small glow each, not a big one. Sixteen generous additive glows
        overlapping each other summed to white, and the new name — the entire
        point of the scene — landed inside a flare nobody could read through.
      */
      if (goldness > 0.05) {
        ctx.globalCompositeOperation = 'lighter';
        const r = size * 0.62;
        const g = ctx.createRadialGradient(x + size * 0.28, y + size * 0.52, 0, x + size * 0.28, y + size * 0.52, r);
        g.addColorStop(0, `rgba(255,190,80,${0.16 * goldness + 0.22 * flash})`);
        g.addColorStop(1, 'rgba(255,190,80,0)');
        ctx.fillStyle = g;
        ctx.fillRect(x - r, y - r, size + r * 2, size + r * 2);
        ctx.globalCompositeOperation = 'source-over';
      }
      ctx.lineCap = 'round';
      ctx.globalAlpha = 1 - eOut(drown);
      const strokes = letterStrokes(L.ch, x, y, size, 0.1, i).map((s) => wobble(s.pts, 0.8, s.seed + boil(t) * 0.5));
      if (goldness > 0.5) {
        // gold on cream has no contrast, so the gold sits on a dark stroke
        ctx.strokeStyle = 'rgba(30,16,6,0.85)';
        for (const q of strokes) nibStroke(ctx, q, size * 0.11);
      }
      ctx.strokeStyle = goldness > 0.5 ? (flash > 0.3 ? '#fff4c8' : GOLD) : INK;
      for (const q of strokes) nibStroke(ctx, q, size * 0.07);
      ctx.restore();
    });
    // the ring of light when it lands
    if (t > LAND && t < LAND + 1.2) {
      const k = prog(t, LAND, LAND + 1.2);
      ctx.save();
      ctx.strokeStyle = `rgba(255,210,110,${0.6 * (1 - k)})`;
      ctx.lineWidth = 5 * (1 - k) + 1;
      ctx.beginPath();
      ctx.ellipse(SPX, 300, 200 + k * 700, 60 + k * 220, 0, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
  }

  /* ── the split ───────────────────────────────────────────────────────── */

  const FIG = { x: SPX, y: 600, s: 0.95 };
  const FIG_AT = 91.4;
  const CRACK_AT = [95.5, 95.95, 96.35, 96.7, 97.0, 97.25];

  const FIGURE = (() => {
    const outline = [[0, -300], [60, -285], [95, -240], [105, -180], [150, -150], [190, -60], [210, 60], [240, 200], [262, 292],
      [180, 302], [100, 286], [0, 302], [-100, 286], [-180, 302], [-262, 292], [-240, 200], [-210, 60], [-190, -60],
      [-150, -150], [-105, -180], [-95, -240], [-60, -285], [0, -300]];
    const face = ellipse(0, -205, 46, 62, 30);
    const folds = [[[-40, -120], [-70, 60], [-90, 280]], [[40, -120], [70, 60], [90, 280]], [[0, -100], [0, 290]], [[-120, -120], [-160, 120], [-190, 290]], [[120, -120], [160, 120], [190, 290]]];
    const shade = hatch(outline, 0.6, 9, 0.2, 8);
    const center = [0, -40];
    const cracks = [];
    const angles = [];
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI / 2 + (i / 6) * TAU + (hash(i * 5.1) - 0.5) * 0.4;
      angles.push(a);
      const p = [center.slice()];
      for (let k = 0; k <= 9; k++) {
        const r = 64 + k * 29;
        const j = (hash(i * 13 + k) - 0.5) * 0.3;
        p.push([center[0] + Math.cos(a + j) * r, center[1] + Math.sin(a + j) * r]);
      }
      cracks.push(p);
    }
    return { outline, face, folds, shade, center, cracks, angles };
  })();

  function drawFigure(ctx, t, full) {
    const reveal = full ? 1 : 0;
    const at = full ? -1 : FIG_AT;
    ctx.save();
    const wk = full ? 1 : eOut(prog(t, FIG_AT + 1.4, FIG_AT + 3.4));
    ctx.globalAlpha = 0.9 * wk;
    ctx.fillStyle = '#140d09';
    trace(ctx, FIGURE.outline, true);
    ctx.fill();
    ctx.restore();
    sketch(ctx, [FIGURE.outline], t, { at, dur: 2.0, w: 3.4, seed: 70, order: reveal ? 'all' : undefined });
    sketch(ctx, FIGURE.shade, t, { at: full ? -1 : FIG_AT + 1.0, dur: 2.2, w: 1.4, seed: 71, alpha: 0.5, order: reveal ? 'all' : undefined });
    ctx.save();
    ctx.globalAlpha = wk * 0.25;
    ctx.strokeStyle = '#c9b48f';
    ctx.lineWidth = 2;
    for (const f of FIGURE.folds) { trace(ctx, chaikin(f, 2), false); ctx.stroke(); }
    ctx.globalAlpha = wk;
    ctx.fillStyle = '#050302';
    trace(ctx, FIGURE.face, true);
    ctx.fill();
    // two red points in the dark of the hood, once it is finished
    const eyes = full ? 1 : prog(t, FIG_AT + 3.2, FIG_AT + 3.8);
    if (eyes > 0) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = `rgba(230,40,30,${0.9 * eyes})`;
      ctx.shadowColor = '#ff2a1a';
      ctx.shadowBlur = 14;
      for (const ex of [-16, 16]) {
        ctx.beginPath();
        ctx.ellipse(ex, -212, 5, 2.4, 0, 0, TAU);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawCracks(ctx, t, full) {
    FIGURE.cracks.forEach((c, i) => {
      const k = full ? 1 : prog(t, CRACK_AT[i], CRACK_AT[i] + 0.35);
      if (k <= 0) return;
      const n = Math.max(2, Math.round(c.length * k));
      const pts = c.slice(0, n);
      ctx.save();
      ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(120,255,170,0.9)';
      ctx.shadowColor = GREEN;
      ctx.shadowBlur = 12;
      ctx.lineWidth = 3;
      trace(ctx, pts, false);
      ctx.stroke();
      ctx.restore();
    });
  }

  function figureCanvas() {
    if (cache.fig) return cache.fig;
    cache.fig = canvas(760, 820, (g) => {
      g.translate(380, 420);
      drawFigure(g, SHATTER, true);
      drawCracks(g, SHATTER, true);
    });
    return cache.fig;
  }

  /*
    Each piece is bounded by two cracks, carried on out past the edge of the
    figure, and by the rim of the piece that stays in the middle.

    The first cut clipped a crude wedge and punched the middle out with an
    even-odd circle — and even-odd is exclusive-or, so the part of that circle
    lying *outside* each wedge was added rather than removed, and every flying
    shard carried a whole green disc along with it.
  */
  const WEDGES = FIGURE.cracks.map((c, i) => {
    const j = (i + 1) % 6;
    const next = FIGURE.cracks[j];
    const [cx, cy] = FIGURE.center;
    const a0 = FIGURE.angles[i];
    let a1 = FIGURE.angles[j];
    if (a1 <= a0) a1 += TAU;
    const far = [];
    for (let k = 0; k <= 6; k++) {
      const a = a0 + ((a1 - a0) * k) / 6;
      far.push([cx + Math.cos(a) * 1000, cy + Math.sin(a) * 1000]);
    }
    const rim = [];
    for (let k = 0; k <= 8; k++) {
      const a = a1 - ((a1 - a0) * k) / 8;
      rim.push([cx + Math.cos(a) * 64, cy + Math.sin(a) * 64]);
    }
    const poly = c.slice(1).concat(far, next.slice(1).reverse(), rim);
    const inner = c.slice(1).concat(next.slice(1));
    let mx = 0;
    let my = 0;
    for (const [x, y] of inner) { mx += x; my += y; }
    return { poly, c: [mx / inner.length, my / inner.length] };
  });

  function objectStage(o) {
    return [o.side === 'L' ? SPX - PW + o.x : SPX + o.x, TOPY + o.y];
  }

  function drawSplit(ctx, t) {
    if (t < FIG_AT || t > 108.6) return;
    if (t < SHATTER) {
      ctx.save();
      ctx.translate(FIG.x, FIG.y);
      ctx.scale(FIG.s, FIG.s);
      // it trembles as it cracks
      if (t > CRACK_AT[0]) {
        const k = prog(t, CRACK_AT[0], SHATTER);
        ctx.translate(Math.sin(t * 61) * 3 * k, Math.sin(t * 47) * 2 * k);
      }
      drawFigure(ctx, t, false);
      drawCracks(ctx, t, false);
      ctx.restore();
      return;
    }
    const fig = figureCanvas();
    // the six pieces that leave
    WEDGES.forEach((w, i) => {
      const k = prog(t, DEPART[i], ARRIVE[i]);
      if (k >= 1) return;
      const [tx, ty] = objectStage(OBJECTS[i]);
      const sx = FIG.x + w.c[0] * FIG.s;
      const sy = FIG.y + w.c[1] * FIG.s;
      const e = eIn(k);
      const x = lerp(sx, tx, e) + Math.sin(k * Math.PI) * (i % 2 ? 60 : -60);
      const y = lerp(sy, ty, e) - Math.sin(k * Math.PI) * 80;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((i % 2 ? 1 : -1) * k * 5);
      const sc = FIG.s * (1 - 0.85 * e) * (t < DEPART[i] ? 1 : 1);
      ctx.scale(sc, sc);
      ctx.translate(-w.c[0], -w.c[1]);
      ctx.globalAlpha = 1 - eIn(prog(k, 0.75, 1));
      ctx.beginPath();
      ctx.moveTo(w.poly[0][0], w.poly[0][1]);
      for (const p of w.poly.slice(1)) ctx.lineTo(p[0], p[1]);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(fig, -380, -420);
      ctx.restore();
      // a trail of green sparks behind it
      if (t > DEPART[i]) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (let s = 1; s <= 8; s++) {
          const kk = Math.max(0, k - s * 0.03);
          const ee = eIn(kk);
          const px = lerp(sx, tx, ee) + Math.sin(kk * Math.PI) * (i % 2 ? 60 : -60);
          const py = lerp(sy, ty, ee) - Math.sin(kk * Math.PI) * 80;
          ctx.fillStyle = `rgba(90,255,160,${0.35 * (1 - s / 9)})`;
          ctx.beginPath();
          ctx.arc(px, py, 7 - s * 0.6, 0, TAU);
          ctx.fill();
        }
        ctx.restore();
      }
    });
    // what is left in the middle, glowing
    const left = 1 - prog(t, 107.6, 108.4);
    if (left > 0) {
      ctx.save();
      ctx.translate(FIG.x, FIG.y);
      ctx.scale(FIG.s, FIG.s);
      ctx.globalAlpha = left;
      ctx.beginPath();
      ctx.arc(FIGURE.center[0], FIGURE.center[1], 64, 0, TAU);
      ctx.clip();
      ctx.drawImage(fig, -380, -420);
      ctx.restore();
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const p = 0.5 + 0.5 * Math.sin(t * 3);
      const g = ctx.createRadialGradient(FIG.x, FIG.y - 38, 0, FIG.x, FIG.y - 38, 150);
      g.addColorStop(0, `rgba(80,255,150,${(0.2 + 0.15 * p) * left})`);
      g.addColorStop(1, 'rgba(80,255,150,0)');
      ctx.fillStyle = g;
      ctx.fillRect(FIG.x - 150, FIG.y - 190, 300, 300);
      ctx.restore();
    }
    // the shatter itself: a white-green flash
    const f = 1 - prog(t, SHATTER, SHATTER + 0.5);
    if (f > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(FIG.x, FIG.y - 38, 0, FIG.x, FIG.y - 38, 700);
      g.addColorStop(0, `rgba(200,255,220,${0.75 * f})`);
      g.addColorStop(0.3, `rgba(80,255,150,${0.3 * f})`);
      g.addColorStop(1, 'rgba(80,255,150,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
  }

  /* ── the ink drop ────────────────────────────────────────────────────── */

  function drawDrop(ctx, t) {
    if (t < 8.9 || t > 9.6) return;
    const k = prog(t, 8.9, 9.55);
    const x = SPX + 390;
    const y = lerp(-80, TOPY + 250, eIn(k));
    ctx.save();
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.moveTo(x, y - 30);
    ctx.quadraticCurveTo(x + 14, y, x, y + 10);
    ctx.quadraticCurveTo(x - 14, y, x, y - 30);
    ctx.fill();
    ctx.restore();
  }

  /* ══════════════════════════════════════════════════════════════════════
     the camera
     ══════════════════════════════════════════════════════════════════════ */

  const CAM = [
    [0, 870, 540, 1.1], [6.2, 870, 540, 1.1], [9, 960, 560, 1.0],
    [81, 960, 560, 1.0], [82.6, 960, 400, 1.1], [86.8, 960, 400, 1.1], [89, 960, 560, 1.0],
    [97.4, 960, 580, 1.04], [97.7, 960, 580, 1.0], [108.4, 960, 560, 1.02],
    [111, 1330, 530, 1.14], [116.2, 1330, 530, 1.14], [118.6, 900, 540, 1.1], [120, 900, 540, 1.1],
  ];

  function camera(t) {
    let i = 0;
    while (i + 1 < CAM.length && t >= CAM[i + 1][0]) i++;
    const a = CAM[i];
    const b = CAM[Math.min(CAM.length - 1, i + 1)];
    const k = b[0] > a[0] ? eInOut(prog(t, a[0], b[0])) : 0;
    let x = lerp(a[1], b[1], k);
    let y = lerp(a[2], b[2], k);
    const s = lerp(a[3], b[3], k);
    // a shudder on the two big moments
    for (const [at, amp] of [[LAND, 10], [SHATTER, 14]]) {
      const q = 1 - prog(t, at, at + 0.7);
      if (t > at && q > 0) { x += Math.sin(t * 90) * amp * q; y += Math.sin(t * 73) * amp * q; }
    }
    return { x, y, s };
  }

  function bookX(t) {
    if (t < OPEN_AT) return CLOSED_X;
    if (t < CLOSE_AT) return lerp(CLOSED_X, 0, eInOut(prog(t, OPEN_AT - 0.2, OPEN_AT + OPEN_DUR + 0.2)));
    return lerp(0, CLOSED_X, eInOut(prog(t, CLOSE_AT, CLOSE_AT + CLOSE_DUR + 0.2)));
  }

  /* ══════════════════════════════════════════════════════════════════════
     the frame
     ══════════════════════════════════════════════════════════════════════ */

  function drawBook(ctx, t, spec) {
    ctx.save();
    ctx.translate(spec.x, 0);
    // its shadow on the desk
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.filter = 'none';
    const lx = spec.open === 0 ? SPX : SPX - PW - M;
    const lw = spec.open === 0 ? PW + M : (PW + M) * 2;
    ctx.fillRect(lx + 14, TOPY - M + 22, lw, PH + 2 * M);
    ctx.restore();
    if (spec.leftBoard) board(ctx, 0);
    board(ctx, 1);
    if (spec.leftBoard) pageBlock(ctx, 0);
    pageBlock(ctx, 1);
    if (spec.left) pageAt(ctx, 0, spec.left, t);
    if (spec.right) pageAt(ctx, 1, spec.right, t);
    // the spine crease
    if (spec.leftBoard) {
      const g = ctx.createLinearGradient(SPX - 30, 0, SPX + 30, 0);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(0.5, 'rgba(20,10,4,0.4)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(SPX - 30, TOPY, 60, PH);
    }
    if (spec.leaf) leaf(ctx, spec.leaf.theta, spec.leaf.front, spec.leaf.back, t, spec.leaf.cover);
    ctx.restore();
  }

  function bookSpec(t) {
    const last = SPREAD_AT.length - 1;
    if (t < OPEN_AT) return { x: bookX(t), open: 0, right: content(0, 'R'), leaf: { theta: 0, cover: true } };
    if (t < OPEN_AT + OPEN_DUR) {
      return { x: bookX(t), open: 1, right: content(0, 'R'), leaf: { theta: Math.PI * eInOut(prog(t, OPEN_AT, OPEN_AT + OPEN_DUR)), back: content(0, 'L'), cover: true } };
    }
    if (t >= CLOSE_AT + CLOSE_DUR) return { x: bookX(t), open: 0, right: content(last, 'R'), leaf: { theta: 0, cover: true } };
    if (t >= CLOSE_AT) {
      return { x: bookX(t), open: 1, right: content(last, 'R'), leaf: { theta: Math.PI * (1 - eInOut(prog(t, CLOSE_AT, CLOSE_AT + CLOSE_DUR))), back: content(last, 'L'), cover: true } };
    }
    let i = 0;
    while (i + 1 < SPREAD_AT.length && t >= SPREAD_AT[i + 1]) i++;
    if (i > 0 && t < SPREAD_AT[i] + TURN) {
      return {
        x: 0, open: 1, leftBoard: true, left: content(i - 1, 'L'), right: content(i, 'R'),
        leaf: { theta: Math.PI * eInOut(prog(t, SPREAD_AT[i], SPREAD_AT[i] + TURN)), front: content(i - 1, 'R'), back: content(i, 'L') },
      };
    }
    return { x: 0, open: 1, leftBoard: true, left: content(i, 'L'), right: content(i, 'R') };
  }

  function grain(ctx, t) {
    if (!cache.grain) {
      cache.grain = canvas(256, 256, (g, w, h) => {
        const img = g.createImageData(w, h);
        for (let i = 0; i < w * h; i++) {
          const v = hash(i * 0.731 + 5);
          img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v > 0.5 ? 255 : 0;
          img.data[i * 4 + 3] = Math.pow(Math.abs(v - 0.5) * 2, 4) * 90;
        }
        g.putImageData(img, 0, 0);
      });
    }
    if (!cache.grainPat) cache.grainPat = new WeakMap();
    let pat = cache.grainPat.get(ctx);
    if (!pat) { pat = ctx.createPattern(cache.grain, 'repeat'); cache.grainPat.set(ctx, pat); }
    const b = Math.floor(t * 12);
    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = pat;
    ctx.translate((b * 37) % 256, (b * 91) % 256);
    ctx.fillRect(-256, -256, W + 512, H + 512);
    ctx.restore();
  }

  /** The room around the book, in camera space. */
  function room(ctx, t, cam, spec, overlays) {
    ctx.save();
    ctx.fillStyle = '#0d0805';
    ctx.fillRect(0, 0, W, H);
    ctx.translate(W / 2, H / 2);
    ctx.scale(cam.s, cam.s);
    ctx.translate(-cam.x, -cam.y);
    ctx.drawImage(deskCanvas(), -240, -210);
    drawBook(ctx, t, spec);
    if (overlays) overlays(ctx, t);
    drawCandle(ctx, t);
    lighting(ctx, t);
    ctx.restore();
  }

  function frame(ctx, t) {
    t = clamp(t, 0, DURATION);
    const spec = bookSpec(t);
    room(ctx, t, camera(t), spec, (c, tt) => {
      drawDrop(c, tt);
      if (tt > SNAKE_T0 && tt < 74) drawSnake(c, tt);
      if (tt > LIFT && tt < 89.5) drawName(c, tt);
      if (tt > FIG_AT && tt < 108.6) drawSplit(c, tt);
    });
    grain(ctx, t);
    const fade = Math.max(1 - prog(t, 0, 0.8), prog(t, 119.3, 120));
    if (fade > 0) {
      ctx.fillStyle = `rgba(0,0,0,${fade})`;
      ctx.fillRect(0, 0, W, H);
    }
  }

  /* ══════════════════════════════════════════════════════════════════════
     the score — original, synthesised here, sample by sample
     ══════════════════════════════════════════════════════════════════════ */

  const m2f = (m) => 440 * Math.pow(2, (m - 69) / 12);

  /** One cycle of a waveform, from its harmonic amplitudes. */
  function table(amps, n = 2048) {
    const out = new Float32Array(n + 1);
    for (let h = 0; h < amps.length; h++) {
      const a = amps[h];
      if (!a) continue;
      for (let i = 0; i <= n; i++) out[i] += a * Math.sin((TAU * (h + 1) * i) / n);
    }
    let peak = 0;
    for (let i = 0; i <= n; i++) peak = Math.max(peak, Math.abs(out[i]));
    for (let i = 0; i <= n; i++) out[i] /= peak || 1;
    return out;
  }
  const SAW = table(Array.from({ length: 24 }, (_, h) => 1 / Math.pow(h + 1, 1.15)));
  const choirTables = new Map();
  /** An "oo", built from formants, so it depends on the pitch sung. */
  function choirTable(m) {
    if (choirTables.has(m)) return choirTables.get(m);
    const f0 = m2f(m);
    const amps = [];
    for (let h = 1; h <= 30; h++) {
      const f = f0 * h;
      if (f > 5000) break;
      const g = (c, bw) => Math.exp(-Math.pow((f - c) / bw, 2));
      amps.push(g(320, 110) + 0.55 * g(800, 160) + 0.1 * g(2400, 300) + 0.02);
    }
    const tb = table(amps);
    choirTables.set(m, tb);
    return tb;
  }

  async function synth(sr, onProgress) {
    const N = Math.ceil((DURATION + 2) * sr);
    const L = new Float32Array(N);
    const R = new Float32Array(N);
    const SL = new Float32Array(N);
    const SR = new Float32Array(N);
    const jobs = [];

    const voice = (t0, dur, fn, gain, pan, send) => jobs.push(() => {
      const i0 = Math.floor(t0 * sr);
      const n = Math.floor(dur * sr);
      const gl = Math.cos(((pan + 1) * Math.PI) / 4) * gain;
      const gr = Math.sin(((pan + 1) * Math.PI) / 4) * gain;
      for (let k = 0; k < n; k++) {
        const i = i0 + k;
        if (i < 0) continue;
        if (i >= N) break;
        const v = fn(k / sr, k);
        L[i] += v * gl;
        R[i] += v * gr;
        if (send) { SL[i] += v * gl * send; SR[i] += v * gr * send; }
      }
    });

    const osc = (tb, freq) => {
      let ph = 0;
      const n = tb.length - 1;
      return (f) => {
        ph += ((f || freq) * n) / sr;
        if (ph >= n) ph -= n * Math.floor(ph / n);
        const i = ph | 0;
        return tb[i] + (tb[i + 1] - tb[i]) * (ph - i);
      };
    };

    // ── instruments
    const celesta = (t0, m, vel = 1, pan = 0) => {
      const f = m2f(m);
      voice(t0, 2.6, (u) => Math.min(1, u / 0.002) * (Math.sin(TAU * f * u) * Math.exp(-u * 2.2) + 0.35 * Math.sin(TAU * f * 4 * u) * Math.exp(-u * 9) + 0.08 * Math.sin(TAU * f * 6.8 * u) * Math.exp(-u * 16)), 0.1 * vel, pan, 0.5);
    };
    const musicBox = (t0, m, vel = 1, pan = 0, detune = 0) => {
      const f = m2f(m) * Math.pow(2, detune / 1200);
      voice(t0, 2.8, (u) => Math.min(1, u / 0.003) * (Math.sin(TAU * f * u) * Math.exp(-u * 2) + 0.3 * Math.sin(TAU * f * 2 * u) * Math.exp(-u * 5) + 0.12 * Math.sin(TAU * f * 5.4 * u) * Math.exp(-u * 12)), 0.1 * vel, pan, 0.6);
    };
    let pseed = 1;
    const harp = (t0, m, vel = 1, pan = 0, dur = 1.6) => {
      const f = m2f(m);
      const n = Math.max(2, Math.round(sr / f));
      const buf = new Float32Array(n);
      const r = mulberry(pseed++ * 7919);
      let pv = 0;
      for (let i = 0; i < n; i++) { const w = r() * 2 - 1; pv = pv * 0.4 + w * 0.6; buf[i] = pv; }
      let idx = 0;
      voice(t0, dur, (u) => {
        const a = buf[idx];
        const b = buf[(idx + 1) % n];
        buf[idx] = (a + b) * 0.5 * 0.996;
        idx = (idx + 1) % n;
        return a * Math.min(1, (dur - u) / 0.1);
      }, 0.22 * vel, pan, 0.3);
    };
    /** Low strings: a sawtooth through a gentle low-pass, slow bow. */
    const strings = (t0, dur, m, vel = 1, pan = 0, att = 1.2) => {
      const o1 = osc(SAW, m2f(m) * 1.002);
      const o2 = osc(SAW, m2f(m) * 0.998);
      let lp = 0;
      voice(t0, dur + 1.5, (u) => {
        const env = Math.min(1, u / att) * (u > dur ? Math.max(0, 1 - (u - dur) / 1.5) : 1);
        const vib = 1 + 0.004 * Math.sin(TAU * 5.2 * u);
        const x = (o1(m2f(m) * 1.002 * vib) + o2(m2f(m) * 0.998 * vib)) * 0.5;
        lp += 0.08 * (x - lp);
        return lp * env;
      }, 0.16 * vel, pan, 0.35);
    };
    const choir = (t0, dur, ms, vel = 1, att = 1.2) => {
      ms.forEach((m, j) => {
        for (const det of [-6, 0, 6]) {
          const f = m2f(m) * Math.pow(2, det / 1200);
          const o = osc(choirTable(m), f);
          voice(t0, dur + 1.8, (u) => {
            const env = Math.min(1, u / att) * (u > dur ? Math.max(0, 1 - (u - dur) / 1.8) : 1);
            return o(f * (1 + 0.006 * Math.sin(TAU * (4.6 + j * 0.3 + det * 0.02) * u + j))) * env;
          }, 0.03 * vel, (j % 2 ? 0.3 : -0.3) + det * 0.02, 0.6);
        }
      });
    };
    const brass = (t0, dur, m, vel = 1) => {
      const o = osc(SAW, m2f(m));
      let lp = 0;
      voice(t0, dur, (u) => {
        const env = Math.min(1, u / 0.04) * Math.exp(-u * 1.4);
        lp += (0.05 + 0.35 * Math.exp(-u * 3)) * (o() - lp);
        return lp * env;
      }, 0.35 * vel, 0, 0.3);
    };
    const timp = (t0, m, vel = 1) => {
      let ph = 0;
      const f = m2f(m);
      voice(t0, 2.2, (u) => {
        ph += (TAU * f * (1 + 0.5 * Math.exp(-u * 25))) / sr;
        return (Math.sin(ph) + 0.4 * Math.sin(ph * 1.5)) * Math.exp(-u * 2.6) * Math.min(1, u / 0.003);
      }, 0.4 * vel, 0, 0.25);
    };
    const heart = (t0, vel = 1) => { timp(t0, 31, 0.6 * vel); timp(t0 + 0.32, 31, 0.4 * vel); };
    let nseed = 3;
    const noise = (t0, dur, o) => {
      const r = mulberry(nseed++ * 104729);
      let a = 0;
      let b = 0;
      voice(t0, dur, (u, k) => {
        const w = r() * 2 - 1;
        a += o.hi * (w - a);
        b += o.lo * (a - b);
        return (a - b) * o.env(u / dur, u, k);
      }, o.gain, o.pan || 0, o.send == null ? 0.2 : o.send);
    };
    const whoosh = (t0, dur = 0.9, vel = 1, pan = 0) => noise(t0, dur, { hi: 0.25, lo: 0.02, gain: 0.45 * vel, pan, env: (x) => Math.sin(Math.PI * x) * Math.sin(Math.PI * x) });
    const pageTurn = (t0) => {
      whoosh(t0, 1.3, 0.9, 0.2);
      noise(t0 + 0.3, 0.5, { hi: 0.7, lo: 0.2, gain: 0.12, env: (x) => Math.exp(-x * 4) * (0.5 + 0.5 * Math.sin(x * 90)) });
    };
    /** A quill on paper: short grains of rasping noise, never evenly spaced. */
    const scratch = (t0, dur, vel = 1, pan = 0) => {
      const r = mulberry(Math.round(t0 * 1000) + 17);
      let t = t0;
      while (t < t0 + dur) {
        const g = 0.018 + r() * 0.05;
        noise(t, g, { hi: 0.85, lo: 0.35, gain: 0.07 * vel * (0.6 + r() * 0.6), pan, send: 0.05, env: (x) => Math.sin(Math.PI * x) });
        t += g + r() * 0.07;
      }
    };
    const hiss = (t0, dur, pan, vel = 1) => noise(t0, dur, { hi: 0.95, lo: 0.55, gain: 0.12 * vel, pan, send: 0.3, env: (x, u) => Math.sin(Math.PI * x) * (0.6 + 0.4 * Math.sin(u * 40)) });
    const glass = (t0, vel = 1, pan = 0) => {
      const r = mulberry(Math.round(t0 * 997));
      for (let i = 0; i < 5; i++) {
        const f = 2400 + r() * 4200;
        voice(t0 + r() * 0.03, 0.6, (u) => Math.sin(TAU * f * u) * Math.exp(-u * (9 + i * 3)), 0.03 * vel, pan + (r() - 0.5) * 0.6, 0.6);
      }
      noise(t0, 0.08, { hi: 0.95, lo: 0.5, gain: 0.25 * vel, pan, env: (x) => Math.exp(-x * 6) });
    };
    const shatter = (t0) => {
      for (let i = 0; i < 14; i++) glass(t0 + i * 0.03 + (i % 3) * 0.01, 1.2, (i / 7) - 1);
      noise(t0, 1.2, { hi: 0.9, lo: 0.2, gain: 0.45, env: (x) => Math.exp(-x * 5), send: 0.5 });
    };
    const blip = (t0, pan) => {
      let ph = 0;
      voice(t0, 0.09, (u) => { ph += (TAU * (170 + 2600 * u)) / sr; return Math.sin(ph) * Math.sin(Math.PI * u / 0.09); }, 0.06, pan, 0.2);
    };
    const tick = (t0, hi) => voice(t0, 0.05, (u) => Math.sin(TAU * (hi ? 1700 : 1250) * u) * Math.exp(-u * 80), 0.07, 0.4, 0.2);
    const puff = (t0, vel = 1) => noise(t0, 0.5, { hi: 0.3, lo: 0.04, gain: 0.4 * vel, env: (x) => Math.exp(-x * 6) * Math.min(1, x * 40) });

    // ── the score
    const BEAT = 0.75;
    const BAR = BEAT * 3;
    const MEL = [
      [[74, 2], [76, 0.5], [77, 0.5]], [[81, 2], [79, 1]], [[77, 1], [76, 1], [73, 1]], [[74, 3]],
      [[70, 2], [72, 0.5], [74, 0.5]], [[79, 2], [77, 1]], [[76, 1], [74, 1], [73, 1]], [[69, 3]],
      [[74, 2], [76, 0.5], [77, 0.5]], [[81, 1], [82, 1], [81, 1]], [[79, 1], [77, 1], [76, 1]], [[77, 2], [76, 1]],
      [[74, 1], [73, 1], [74, 1]], [[76, 2], [69, 1]], [[77, 1], [76, 1], [73, 1]], [[74, 3]],
    ];
    const CH = [
      [50, [62, 65, 69]], [50, [62, 65, 69]], [45, [61, 64, 67]], [50, [62, 65, 69]],
      [43, [62, 67, 70]], [43, [62, 67, 70]], [45, [61, 64, 67]], [45, [61, 64, 69]],
      [50, [62, 65, 69]], [46, [62, 65, 70]], [43, [62, 67, 70]], [50, [62, 65, 69]],
      [45, [61, 64, 67]], [45, [61, 64, 69]], [45, [61, 64, 67]], [50, [62, 65, 69]],
    ];
    const waltz = (t0, bars, o) => {
      bars.forEach((bi, n) => {
        const b0 = t0 + n * BAR;
        const [root, tri] = CH[bi];
        if (o.harp) {
          harp(b0, root, 0.9, -0.25, 1.4);
          if (o.harp > 1) {
            harp(b0 + BEAT, tri[0] + (bi % 2 ? 0 : 0), 0.45, 0.2, 0.9);
            harp(b0 + BEAT, tri[1], 0.4, 0.25, 0.9);
            harp(b0 + BEAT * 2, tri[1], 0.4, 0.2, 0.9);
            harp(b0 + BEAT * 2, tri[2], 0.38, 0.25, 0.9);
          }
        }
        if (o.pad) strings(b0, BAR * 0.95, root - 12, o.pad, -0.1, 0.6);
        if (o.choir) choir(b0, BAR * 0.95, tri, o.choir, 0.7);
        let at = b0;
        for (const [m, beats] of MEL[bi]) {
          if (o.lead === 'box') musicBox(at, m + (o.octave || 0), o.vel || 0.9, 0.15, o.detune || 0);
          else if (o.lead === 'celesta') celesta(at, m + (o.octave || 0), o.vel || 1, 0.15);
          at += beats * BEAT;
        }
      });
    };

    // 0 · the candle, the closed book
    noise(LIGHT_AT - 0.12, 0.3, { hi: 0.9, lo: 0.3, gain: 0.2, env: (x) => Math.exp(-x * 5) });
    noise(LIGHT_AT, 0.6, { hi: 0.2, lo: 0.03, gain: 0.35, env: (x) => Math.sin(Math.PI * x) * Math.exp(-x * 2) });
    strings(0.6, 8.2, 38, 0.9, -0.2, 3);
    strings(0.6, 8.2, 45, 0.7, 0.2, 3);
    [[3.4, 74], [4.4, 76], [5.3, 77], [6.4, 81]].forEach(([at, m]) => musicBox(at, m, 0.9, 0.1));
    choir(4.6, 4.2, [50, 57], 0.8, 2.5);
    whoosh(OPEN_AT, 1.6, 1.1, 0.2);
    noise(OPEN_AT + 0.1, 0.9, { hi: 0.12, lo: 0.02, gain: 0.25, env: (x) => Math.sin(Math.PI * x) * (0.5 + 0.5 * Math.sin(x * 55)) });

    // 1 · the first page: the waltz begins
    waltz(9.0, [0, 1, 2, 3, 4, 5], { harp: 2, lead: 'celesta', pad: 0.5 });
    celesta(9.55, 93, 0.9, 0.3);
    timp(9.55, 38, 0.35);

    // 2 · Wool's: the same tune on a cheaper music box, and a clock
    waltz(23.0, [0, 1, 2, 3, 4, 5], { harp: 1, lead: 'box', octave: -12, detune: -18, pad: 0.35 });
    for (let t = 23.0, k = 0; t < 35.9; t += BEAT, k++) tick(t, k % 2 === 0);

    // 3 · potions: the full waltz, a choir, and something bubbling
    waltz(37.7, [0, 1, 2, 3, 8, 9, 10, 11, 15], { harp: 2, lead: 'celesta', pad: 0.6, choir: 0.45 });
    {
      const r = mulberry(4242);
      for (let t = 40.6; t < 57.4; t += 0.1 + r() * 0.3) blip(t, -0.4 + (r() - 0.5) * 0.3);
    }
    BOTTLE_AT.forEach((at, i) => glass(at + 0.7, 0.6, -0.5 + i * 0.1));

    // 4 · the chamber: no waltz. A tritone, a heartbeat, a hiss that follows the snake.
    strings(59.4, 13.8, 38, 1.0, -0.2, 2.5);
    strings(59.4, 13.8, 44, 0.8, 0.2, 2.5);
    choir(60.5, 12.2, [50, 51, 56], 0.9, 3);
    for (let t = 60.4; t < 73; t += 1.6) heart(t, 1);
    for (let t = SNAKE_T0; t < 72.6; t += 0.14) {
      const x = snakeHeadX(t);
      if (x < -60 || x > W + 60) continue;
      hiss(t, 0.2, clamp((x / W) * 2 - 1, -1, 1), 0.75);
    }
    noise(72.4, 1.8, { hi: 0.4, lo: 0.02, gain: 0.5, env: (x) => Math.pow(x, 3), send: 0.5 });

    // 5 · the name
    strings(75.6, 5.2, 38, 0.6, -0.2, 1.5);
    choir(75.6, 5.2, [62, 65, 69], 0.35, 1.5);
    {
      const scale = [62, 65, 67, 69, 72, 74, 77, 79, 81, 84, 86, 89, 91, 93, 96, 98];
      scale.forEach((m, i) => celesta(LIFT + i * 0.065, m, 0.7, -0.6 + i * 0.08));
      const r = mulberry(99);
      for (let t = MOVE; t < LAND; t += 0.09) celesta(t, scale[8 + Math.floor(r() * 8)], 0.35, (r() - 0.5) * 1.4);
    }
    choir(LIFT, LAND - LIFT, [62, 65, 69, 74], 0.9, 2.2);
    strings(LIFT, LAND - LIFT, 50, 0.6, 0, 2.2);
    // the landing
    timp(LAND, 26, 1.3);
    timp(LAND, 38, 0.8);
    [34, 41, 46, 50, 53].forEach((m) => brass(LAND, 3.2, m, 0.8));
    choir(LAND, 1.6, [46, 50, 53, 58, 62], 1.6, 0.05);
    [86, 82, 77, 74, 70].forEach((m, i) => celesta(SETTLE + i * 0.14, m, 0.6, 0.2));
    noise(DROWN - 0.4, 1.6, { hi: 0.3, lo: 0.02, gain: 0.35, env: (x) => Math.pow(x, 2) * (1 - x) * 4 });

    // 6 · the split
    strings(90.8, 16.5, 26, 1.0, 0, 3);
    strings(90.8, 16.5, 33, 0.7, 0.1, 3);
    choir(91.2, 6.2, [50, 57, 62], 0.5, 3);
    for (let t = 91.4; t < 97.4; t += 1.4) heart(t, 0.9);
    CRACK_AT.forEach((at, i) => glass(at, 0.8, -0.5 + i * 0.2));
    shatter(SHATTER);
    timp(SHATTER, 26, 1.2);
    [34, 41, 46].forEach((m) => brass(SHATTER, 2.4, m, 0.7));
    choir(SHATTER, 3.0, [50, 51, 56, 62, 63], 1.2, 0.1);
    DEPART.forEach((at, i) => whoosh(at, ARRIVE[i] - at + 0.1, 0.6, i % 2 ? 0.5 : -0.5));
    ARRIVE.forEach((at, i) => { timp(at, [38, 33, 41, 37, 34, 26][i], 0.7); celesta(at, [86, 81, 89, 85, 82, 74][i], 0.6, OBJECTS[i].side === 'L' ? -0.5 : 0.5); });
    choir(101.4, 6.2, [50, 57, 62, 65], 0.6, 2.5);
    waltz(102.2, [0, 1], { lead: 'celesta', octave: -12, vel: 0.8 });
    for (let t = 102.4; t < 104.8; t += 1.8) heart(t, 0.6);

    // 7 · the last page
    pageTurn(108.5);
    [[110.6, 74], [111.9, 76], [113.4, 77], [115.3, 81]].forEach(([at, m]) => musicBox(at, m, 0.85, 0.15));
    musicBox(117.2, 62, 0.8, 0);
    strings(110.0, 8.6, 38, 0.6, 0, 2);
    choir(110.2, 8.4, [50, 57], 0.55, 3);
    whoosh(CLOSE_AT, 1.8, 1.0, -0.2);
    timp(CLOSE_AT + CLOSE_DUR - 0.12, 29, 0.8);
    noise(CLOSE_AT + CLOSE_DUR - 0.12, 0.3, { hi: 0.3, lo: 0.05, gain: 0.35, env: (x) => Math.exp(-x * 8) });
    puff(OUT_AT, 1);
    strings(118.8, 0.8, 26, 0.5, 0, 0.2);

    // page turns
    SPREAD_AT.slice(1, -1).forEach((at) => pageTurn(at));

    // the quill, whenever anything is being written
    TEXT.forEach((list) => list.forEach((b) => scratch(b.at, writeDur(b), b.size > 60 ? 1.2 : 0.9, b.page === 'L' ? -0.35 : 0.35)));
    scratch(NAME_WRITE[0], NAME_WRITE[1] - NAME_WRITE[0], 1, 0.35);
    for (const a of [ART.wools, ART.envelope, ART.door, ART.quill]) scratch(a.at, a.dur, 0.7, 0);
    scratch(38.2, 3, 0.6, -0.35);

    // ── run the jobs, a few at a time, so the page stays responsive
    let last = performance.now();
    for (let j = 0; j < jobs.length; j++) {
      jobs[j]();
      if (performance.now() - last > 30) {
        if (onProgress) onProgress(j / jobs.length);
        await new Promise((r) => setTimeout(r, 0));
        last = performance.now();
      }
    }
    reverb(SL, SR, L, R, sr);
    let peak = 0;
    for (let i = 0; i < N; i++) {
      L[i] = Math.tanh(L[i] * 2.6);
      R[i] = Math.tanh(R[i] * 2.6);
      peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
    }
    const g = peak > 0 ? 0.89 / peak : 1;
    for (let i = 0; i < N; i++) { L[i] *= g; R[i] *= g; }
    const f0 = Math.floor((DURATION - 0.8) * sr);
    for (let i = f0; i < N; i++) { const k = clamp(1 - (i - f0) / (2.5 * sr)); L[i] *= k; R[i] *= k; }
    if (onProgress) onProgress(1);
    return { L, R, sr };
  }

  /** A stone room: longer combs than the last film, and a darker tail. */
  function reverb(inL, inR, outL, outR, sr) {
    const scale = sr / 44100;
    const combs = [1557, 1617, 1491, 1422, 1277, 1356];
    const alls = [556, 441, 341];
    for (const [inp, out, spread] of [[inL, outL, 0], [inR, outR, 23]]) {
      const wet = new Float32Array(inp.length);
      for (const c of combs) {
        const n = Math.round((c + spread) * scale);
        const buf = new Float32Array(n);
        let idx = 0;
        let store = 0;
        for (let i = 0; i < inp.length; i++) {
          const y = buf[idx];
          store = y * 0.6 + store * 0.4;
          buf[idx] = inp[i] + store * 0.84;
          idx = (idx + 1) % n;
          wet[i] += y;
        }
      }
      for (const a of alls) {
        const n = Math.round((a + spread) * scale);
        const buf = new Float32Array(n);
        let idx = 0;
        for (let i = 0; i < wet.length; i++) {
          const b = buf[idx];
          const x = wet[i];
          buf[idx] = x + b * 0.5;
          wet[i] = b - x;
          idx = (idx + 1) % n;
        }
      }
      for (let i = 0; i < out.length; i++) out[i] += wet[i] * 0.07;
    }
  }

  function wavBytes(L, R, sr) {
    const n = L.length;
    const buf = new ArrayBuffer(44 + n * 4);
    const v = new DataView(buf);
    const s = (o, str) => { for (let i = 0; i < str.length; i++) v.setUint8(o + i, str.charCodeAt(i)); };
    s(0, 'RIFF'); v.setUint32(4, 36 + n * 4, true); s(8, 'WAVE'); s(12, 'fmt ');
    v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 2, true);
    v.setUint32(24, sr, true); v.setUint32(28, sr * 4, true); v.setUint16(32, 4, true); v.setUint16(34, 16, true);
    s(36, 'data'); v.setUint32(40, n * 4, true);
    let o = 44;
    for (let i = 0; i < n; i++) {
      v.setInt16(o, clamp(L[i], -1, 1) * 32767, true);
      v.setInt16(o + 2, clamp(R[i], -1, 1) * 32767, true);
      o += 4;
    }
    return new Uint8Array(buf);
  }

  /* ══════════════════════════════════════════════════════════════════════
     the diary, afterwards: write in it, and it writes back
     ══════════════════════════════════════════════════════════════════════ */

  const REPLIES = [
    [/\b(hello|hi|hey|good (morning|evening))\b/i, 'Hello. It has been a very long time since anybody wrote to me.'],
    [/who are you|your name|tom|riddle/i, 'A memory, kept in a book. Nobody important. Not yet.'],
    [/potion|felix|amortentia|veritaserum|polyjuice/i, 'Felix for luck, Veritaserum for the truth. For everything else, patience.'],
    [/horcrux|soul|seven|split/i, 'Some things are not written down, even here.'],
    [/chamber|snake|serpent|basilisk|parsel/i, 'There are doors in that castle that only listen to one language.'],
    [/voldemort|dark lord/i, 'You know that name? Then you know more than I did at sixteen.'],
    [/harry|potter/i, 'Tell me about him. Everything.'],
    [/love|friend/i, 'Amortentia smelled of nothing to me. Draw your own conclusions.'],
    [/afraid|fear|death|die|dying|dead/i, 'Death is the only thing worth being afraid of. I am working on it.'],
    [/help|how|why|what/i, 'Ask me anything you like. I have all the time in the world.'],
    [/secret/i, 'You first.'],
  ];
  const FALLBACK = [
    'Go on.',
    'Interesting. And what would you do about it?',
    'You write very carefully. So did I.',
    'I remember everything that is written here. Everything.',
    'Tell me more. I am a very good listener.',
  ];

  function reply(text) {
    for (const [re, r] of REPLIES) if (re.test(text)) return r;
    let h = 0;
    for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return FALLBACK[h % FALLBACK.length];
  }

  /**
   * The diary with nothing scheduled: an open spread, and whatever the reader
   * and the book are saying to each other. Not part of the film, so it is
   * allowed a clock.
   */
  function diaryFrame(ctx, lt, state) {
    const spec = {
      x: 0, open: 1, leftBoard: true,
      left: (c, t) => sketch(c, ART.quill.paths, t, { ...ART.quill, at: -1, order: 'all' }),
      right: (c, t) => {
        if (state.typing) {
          inkText(c, { text: state.typing, x: 80, y: 120, size: 38, maxW: 620, align: 'left', at: -1, dur: 0.01, color: '#16233f', slant: 0.12, seed: 3 }, t);
        }
        for (const b of state.blocks) inkText(c, b, t);
      },
    };
    room(ctx, lt, { x: 1330, y: 530, s: 1.12 }, spec, null);
    grain(ctx, lt);
  }

  /* ══════════════════════════════════════════════════════════════════════
     the player
     ══════════════════════════════════════════════════════════════════════ */

  window.RIDDLE = { W, H, DURATION, frame, synth, wavBytes, reply };

  const params = new URLSearchParams(location.search);
  if (params.has('render')) return;

  const canvasEl = document.getElementById('c');
  if (!canvasEl) return;
  const ctx = canvasEl.getContext('2d');
  const ui = document.getElementById('ui');
  const playBtn = document.getElementById('play');
  const writeBtn = document.getElementById('write');
  const note = document.getElementById('note');
  const input = document.getElementById('pen');

  let scale = 1;
  function fit() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const s = Math.min(window.innerWidth / W, window.innerHeight / H);
    const cw = Math.floor(W * s);
    const ch = Math.floor(H * s);
    canvasEl.style.width = cw + 'px';
    canvasEl.style.height = ch + 'px';
    canvasEl.width = Math.floor(cw * dpr);
    canvasEl.height = Math.floor(ch * dpr);
    scale = (cw * dpr) / W;
  }
  const still = params.has('t') ? Number(params.get('t')) : 4.2;
  let mode = 'still';
  function draw(t) {
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    frame(ctx, t);
  }
  window.addEventListener('resize', () => { fit(); if (mode === 'still') draw(still); });
  fit();
  draw(still);

  // the score is made while the poster is up; only playing it needs a click
  let samples = null;
  let making = null;
  const make = () => {
    if (!making) {
      making = synth(44100, (p) => { if (mode === 'still' && !samples) note.textContent = `tuning the music box… ${Math.round(p * 100)}%`; })
        .then((s) => { samples = s; if (mode === 'still') note.textContent = 'about two minutes · click the picture to pause · R to start again'; return s; });
    }
    return making;
  };
  setTimeout(make, 300);

  let actx = null;
  let buffer = null;
  let src = null;
  let t0 = 0;
  let raf = 0;

  function filmLoop() {
    const t = actx.currentTime - t0;
    draw(Math.max(0, t));
    if (t >= DURATION) {
      mode = 'still';
      ui.classList.remove('is-hidden');
      playBtn.textContent = '↺ watch again';
      note.textContent = 'the book is closed. you can open it.';
      return;
    }
    raf = requestAnimationFrame(filmLoop);
  }

  async function play() {
    playBtn.disabled = true;
    if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') await actx.resume();
    const s = samples || await make();
    if (!buffer) {
      buffer = actx.createBuffer(2, s.L.length, s.sr);
      buffer.copyToChannel(s.L, 0);
      buffer.copyToChannel(s.R, 1);
    }
    if (src) { try { src.stop(); } catch (e) { /* already stopped */ } }
    src = actx.createBufferSource();
    src.buffer = buffer;
    src.connect(actx.destination);
    t0 = actx.currentTime + 0.12;
    src.start(t0);
    mode = 'film';
    ui.classList.add('is-hidden');
    input.blur();
    document.body.classList.remove('is-writing');
    playBtn.disabled = false;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(filmLoop);
  }

  /* ── writing in it ─────────────────────────────────────────────────── */

  const state = { typing: '', blocks: [] };
  let wt0 = 0;
  const lt = () => (performance.now() - wt0) / 1000;

  function scratchSound(dur) {
    if (!actx) return;
    const n = Math.floor(actx.sampleRate * dur);
    const buf = actx.createBuffer(1, n, actx.sampleRate);
    const d = buf.getChannelData(0);
    const r = mulberry(n);
    let on = 0;
    for (let i = 0; i < n; i++) {
      if (i % 600 === 0) on = r() > 0.35 ? 1 : 0;
      d[i] = (r() * 2 - 1) * on * 0.25;
    }
    const s = actx.createBufferSource();
    s.buffer = buf;
    const f = actx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = 3200;
    f.Q.value = 0.8;
    s.connect(f).connect(actx.destination);
    s.start();
  }

  function writeLoop() {
    diaryFrameAt();
    if (mode === 'write') raf = requestAnimationFrame(writeLoop);
  }
  function diaryFrameAt() {
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    diaryFrame(ctx, lt(), state);
  }

  function startWriting() {
    if (src) { try { src.stop(); } catch (e) { /* stopped */ } }
    if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
    actx.resume();
    mode = 'write';
    wt0 = performance.now();
    state.typing = '';
    state.blocks = [];
    ui.classList.add('is-hidden');
    document.body.classList.add('is-writing');
    input.value = '';
    input.focus();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(writeLoop);
  }

  input.addEventListener('input', () => {
    state.typing = input.value.slice(0, 90);
    // whatever the book said last goes back into the paper when you start to write
    const now = lt();
    for (const b of state.blocks) if (b.sink == null) b.sink = now;
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      mode = 'still';
      document.body.classList.remove('is-writing');
      ui.classList.remove('is-hidden');
      draw(still);
      return;
    }
    if (e.key !== 'Enter') return;
    const text = input.value.trim();
    if (!text) return;
    const now = lt();
    const mine = { text, x: 80, y: 120, size: 38, maxW: 620, align: 'left', at: now - 1, dur: 0.01, sink: now + 0.5, color: '#16233f', slant: 0.12, seed: Math.round(now * 10) };
    const r = reply(text);
    const theirs = { text: r, x: 80, y: 420, size: 42, maxW: 620, align: 'left', at: now + 2.2, sink: null, seed: Math.round(now * 10) + 7 };
    state.blocks = state.blocks.filter((b) => b.sink == null || b.sink + 2 > now).concat([mine, theirs]);
    state.typing = '';
    input.value = '';
    setTimeout(() => scratchSound(writeDur(theirs)), 2200);
  });

  playBtn.addEventListener('click', play);
  writeBtn.addEventListener('click', startWriting);
  canvasEl.addEventListener('click', () => {
    if (mode === 'write') { input.focus(); return; }
    if (mode !== 'film' || !actx) return;
    if (actx.state === 'running') actx.suspend(); else actx.resume();
  });
  window.addEventListener('keydown', (e) => {
    if (mode === 'write') return;
    if (e.key === ' ') {
      e.preventDefault();
      if (mode !== 'film') play();
      else if (actx.state === 'running') actx.suspend(); else actx.resume();
    }
    if (e.key === 'r' || e.key === 'R') play();
  });
})();
