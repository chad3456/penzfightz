/*
 * THE MARAUDER'S MAP — a fan-made one, in plain JavaScript.
 *
 * Two sheets of enchanted parchment: the school and its grounds, and — the
 * marauders having run out of castle — the whole wide world. Swear you are up
 * to no good and the ink comes up out of the paper; the sheet unfolds panel by
 * panel; everybody on it walks about as a pair of footprints and a name on a
 * little scroll. Say "mischief managed" and it all drains away again.
 *
 * A fan work. The school, its people and the map are J. K. Rowling's; the
 * plan drawn here, every line of text on it and its looks are original — the
 * castle is an interpretation, not a copy of anybody's floor plan or of the
 * prop from the films. Coastlines are Natural Earth (public domain).
 *
 * No libraries, no images, no fonts. Every mark is drawn on a canvas.
 */
(function () {
  'use strict';

  /* ══════════════════════════════════════════════════════════════════════
     numbers
     ══════════════════════════════════════════════════════════════════════ */

  const TAU = Math.PI * 2;
  const hash = (n) => {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
    return x - Math.floor(x);
  };
  const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
  const lerp = (a, b, t) => a + (b - a) * t;
  const prog = (t, a, b) => clamp((t - a) / (b - a));
  const eOut = (t) => 1 - Math.pow(1 - t, 3);
  const eInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

  const INK = '#3a2413';
  const INK_SOFT = '#6b4a2c';
  const PARCH = '#d9c39a';

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
    const l = pts[pts.length - 1];
    out.push([l[0], l[1]]);
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
      const s = i * 0.43 + seed * 3.17;
      const w = (Math.sin(s) * 0.6 + Math.sin(s * 2.3 + seed) * 0.3 + Math.sin(s * 5.1) * 0.1) * amp;
      out[i] = [pts[i][0] - dy * w, pts[i][1] + dx * w];
    }
    return out;
  }

  function trace(g, pts, closed) {
    g.beginPath();
    g.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
    if (closed) g.closePath();
  }

  function ellipse(cx, cy, rx, ry, n = 40, a0 = 0, a1 = TAU) {
    const out = [];
    for (let i = 0; i <= n; i++) {
      const a = a0 + ((a1 - a0) * i) / n;
      out.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
    }
    return out;
  }
  const rectP = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]];

  /** A closed polygon pushed outward (or inward, for negative d) along its normals. */
  function offset(pts, d) {
    const n = pts.length;
    return pts.map((p, i) => {
      const a = pts[(i - 1 + n) % n];
      const b = pts[(i + 1) % n];
      let dx = b[0] - a[0];
      let dy = b[1] - a[1];
      const l = Math.hypot(dx, dy) || 1;
      dx /= l;
      dy /= l;
      return [p[0] + dy * d, p[1] - dx * d];
    });
  }

  /** An open polyline as two parallel lines, for walls either side of a corridor. */
  function sides(pts, d) {
    const L = [];
    const R = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[Math.max(0, i - 1)];
      const b = pts[Math.min(pts.length - 1, i + 1)];
      let dx = b[0] - a[0];
      let dy = b[1] - a[1];
      const l = Math.hypot(dx, dy) || 1;
      dx /= l;
      dy /= l;
      L.push([pts[i][0] - dy * d, pts[i][1] + dx * d]);
      R.push([pts[i][0] + dy * d, pts[i][1] - dx * d]);
    }
    return [L, R];
  }

  function pathLen(pts) {
    let l = 0;
    for (let i = 1; i < pts.length; i++) l += dist(pts[i], pts[i - 1]);
    return l;
  }

  function pointAt(pts, s) {
    let acc = 0;
    for (let i = 1; i < pts.length; i++) {
      const d = dist(pts[i], pts[i - 1]);
      if (acc + d >= s) {
        const f = (s - acc) / (d || 1);
        return [lerp(pts[i - 1][0], pts[i][0], f), lerp(pts[i - 1][1], pts[i][1], f), Math.atan2(pts[i][1] - pts[i - 1][1], pts[i][0] - pts[i - 1][0])];
      }
      acc += d;
    }
    const a = pts[pts.length - 2];
    const b = pts[pts.length - 1];
    return [b[0], b[1], Math.atan2(b[1] - a[1], b[0] - a[0])];
  }

  /* ══════════════════════════════════════════════════════════════════════
     the hand
     ══════════════════════════════════════════════════════════════════════ */

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

  function glyphStrokes(ch, x, top, size, slant, seed) {
    const g = glyph(ch);
    const s = seed;
    const dy = (Math.sin(s * 0.7) + Math.sin(s * 1.9) * 0.5) * 0.012 * size;
    const sl = slant + Math.sin(s * 3.1) * 0.02;
    return g.s.map((st) => {
      let pts = st.map(([ux, uy]) => [x + ux * size + (0.78 - uy) * size * sl, top + uy * size + dy]);
      if (pts.length > 2) pts = chaikin(pts, 2);
      return resample(pts, Math.max(1.2, size * 0.05));
    });
  }

  /**
   * A broad nib at forty-five degrees: every segment as wide as the nib looks
   * from the direction it travels. It is what makes these letters look like
   * lettering rather than like a plotter.
   */
  function nib(g, pts, w) {
    for (let i = 1; i < pts.length; i++) {
      const [ax, ay] = pts[i - 1];
      const [bx, by] = pts[i];
      const a = Math.atan2(by - ay, bx - ax);
      g.lineWidth = w * (0.38 + 0.9 * Math.abs(Math.sin(a + 0.75)));
      g.beginPath();
      g.moveTo(ax, ay);
      g.lineTo(bx, by);
      g.stroke();
    }
  }

  /**
   * A label, in pixels. `y` is the vertical centre of the line. Capitals are
   * spaced out the way map lettering is; lower case is set a little slanted.
   */
  function label(g, text, x, y, o) {
    const size = o.size;
    if (size < 4) return 0;
    const caps = text === text.toUpperCase() && /[A-Z]/.test(text);
    const tracking = o.track == null ? (caps ? 0.2 : 0.04) : o.track;
    const slant = o.slant == null ? (caps ? 0.02 : 0.16) : o.slant;
    const w = measure(text, tracking) * size;
    let pen = o.align === 'left' ? x : o.align === 'right' ? x - w : x - w / 2;
    const top = y - size * 0.55;
    g.save();
    g.strokeStyle = o.color || INK;
    g.globalAlpha *= o.alpha == null ? 0.92 : o.alpha;
    g.lineCap = 'round';
    const lw = Math.max(0.55, size * 0.07 * (o.weight || 1));
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      for (const st of glyphStrokes(ch, pen, top, size, slant, (o.seed || 1) * 31 + i * 17)) nib(g, st, lw);
      pen += (glyph(ch).w + tracking) * size;
    }
    g.restore();
    return w;
  }

  /** Text that follows a path: passages, shorelines, the edge of a forest. */
  function labelAlong(g, text, path, o) {
    const size = o.size;
    if (size < 4) return;
    const caps = text === text.toUpperCase() && /[A-Z]/.test(text);
    const tracking = o.track == null ? (caps ? 0.22 : 0.06) : o.track;
    const total = measure(text, tracking) * size;
    const L = pathLen(path);
    let s = (o.at == null ? 0.5 : o.at) * L - total / 2;
    g.save();
    g.strokeStyle = o.color || INK;
    g.globalAlpha *= o.alpha == null ? 0.9 : o.alpha;
    g.lineCap = 'round';
    const lw = Math.max(0.55, size * 0.07);
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      const gw = glyph(ch).w * size;
      const [px, py, ang] = pointAt(path, clamp(s + gw / 2, 0, L));
      g.save();
      g.translate(px, py);
      g.rotate(ang);
      for (const st of glyphStrokes(ch, -gw / 2, -size * 0.55 - (o.lift || 0), size, caps ? 0.02 : 0.14, (o.seed || 1) * 29 + i * 13)) nib(g, st, lw);
      g.restore();
      s += gw + tracking * size;
    }
    g.restore();
  }

  /** Handwriting that arrives stroke by stroke. For the map's remarks. */
  function writeOut(g, text, x, y, size, reveal, o = {}) {
    const lines = [];
    const maxW = o.maxW || 1e9;
    let line = '';
    for (const word of text.split(' ')) {
      const next = line ? line + ' ' + word : word;
      if (line && measure(next, 0.04) * size > maxW) { lines.push(line); line = word; } else line = next;
    }
    lines.push(line);
    const strokes = [];
    lines.forEach((ln, li) => {
      const w = measure(ln, 0.04) * size;
      let pen = x - w / 2;
      const top = y + (li - lines.length / 2) * size * 1.3;
      for (let i = 0; i < ln.length; i++) {
        for (const st of glyphStrokes(ln[i], pen, top, size, 0.18, li * 71 + i * 17 + (o.seed || 0))) strokes.push(st);
        pen += (glyph(ln[i]).w + 0.04) * size;
      }
    });
    let total = 0;
    for (const s of strokes) total += s.length;
    let budget = total * reveal;
    g.save();
    g.strokeStyle = o.color || INK;
    g.globalAlpha *= o.alpha == null ? 1 : o.alpha;
    g.lineCap = 'round';
    for (const s of strokes) {
      if (budget <= 1) break;
      const pts = s.slice(0, Math.min(s.length, Math.round(budget)));
      budget -= s.length;
      if (pts.length > 1) nib(g, pts, size * 0.075);
    }
    g.restore();
  }

  /* ══════════════════════════════════════════════════════════════════════
     parchment
     ══════════════════════════════════════════════════════════════════════ */

  const tiles = {};

  /** Fine fibre and speckle, as a tile, so it stays sharp at any zoom. */
  function fibreTile() {
    if (tiles.fibre) return tiles.fibre;
    const c = document.createElement('canvas');
    c.width = 384;
    c.height = 384;
    const g = c.getContext('2d');
    const img = g.createImageData(384, 384);
    for (let i = 0; i < 384 * 384; i++) {
      const v = hash(i * 0.713 + 3);
      const dark = v < 0.5;
      img.data[i * 4] = dark ? 90 : 255;
      img.data[i * 4 + 1] = dark ? 60 : 245;
      img.data[i * 4 + 2] = dark ? 30 : 220;
      img.data[i * 4 + 3] = Math.pow(Math.abs(v - 0.5) * 2, 3.2) * 70;
    }
    g.putImageData(img, 0, 0);
    g.strokeStyle = 'rgba(110,70,30,0.09)';
    for (let i = 0; i < 260; i++) {
      const x = hash(i * 3.1) * 384;
      const y = hash(i * 5.7) * 384;
      const a = hash(i * 7.3) * TAU;
      const l = 6 + hash(i * 9.1) * 26;
      g.lineWidth = 0.6 + hash(i) * 0.8;
      g.beginPath();
      g.moveTo(x, y);
      g.quadraticCurveTo(x + Math.cos(a + 0.4) * l * 0.5, y + Math.sin(a + 0.4) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l);
      g.stroke();
    }
    tiles.fibre = c;
    return c;
  }

  const patterns = new WeakMap();
  function fibrePattern(g) {
    let p = patterns.get(g);
    if (!p) { p = g.createPattern(fibreTile(), 'repeat'); patterns.set(g, p); }
    return p;
  }

  /**
   * The paper of a sheet, in plate pixels: a warm ground, slow stains in sheet
   * coordinates (so they do not slide about when you pan), fibre, darkened
   * panel edges and the creases between the panels.
   */
  function drawPaper(g, sheet, S, w, h) {
    g.fillStyle = PARCH;
    g.fillRect(0, 0, w, h);
    // each panel its own shade: paper folded for years ages unevenly
    sheet.panels.forEach((p, i) => {
      g.fillStyle = hash(i * 7.7 + sheet.seed) > 0.5 ? 'rgba(255,240,200,0.12)' : 'rgba(120,80,30,0.07)';
      g.fillRect(S.X(p.x), S.Y(p.y), p.w * S.k, p.h * S.k);
    });
    for (let i = 0; i < 70; i++) {
      const x = hash(i * 3.3 + sheet.seed) * sheet.w;
      const y = hash(i * 5.1 + sheet.seed) * sheet.h;
      const r = (60 + hash(i * 2.2) * 320) * S.k;
      const px = S.X(x);
      const py = S.Y(y);
      if (px + r < 0 || py + r < 0 || px - r > w || py - r > h) continue;
      const gr = g.createRadialGradient(px, py, 0, px, py, r);
      const dark = hash(i * 9.9) > 0.45;
      gr.addColorStop(0, dark ? 'rgba(130,85,35,0.16)' : 'rgba(255,245,215,0.16)');
      gr.addColorStop(1, 'rgba(130,85,35,0)');
      g.fillStyle = gr;
      g.fillRect(px - r, py - r, r * 2, r * 2);
    }
    // foxing
    for (let i = 0; i < 260; i++) {
      const px = S.X(hash(i * 4.4 + 1) * sheet.w);
      const py = S.Y(hash(i * 6.6 + 2) * sheet.h);
      if (px < -20 || py < -20 || px > w + 20 || py > h + 20) continue;
      const r = (1.5 + hash(i * 8.8) * 5) * Math.max(0.6, S.k * 1.4);
      g.fillStyle = `rgba(120,70,25,${0.12 + hash(i) * 0.2})`;
      g.beginPath();
      g.ellipse(px, py, r, r * (0.6 + hash(i * 2.9) * 0.6), hash(i * 1.3) * 3, 0, TAU);
      g.fill();
    }
    g.save();
    g.fillStyle = fibrePattern(g);
    g.fillRect(0, 0, w, h);
    g.restore();
    // panel edges and creases
    for (const p of sheet.panels) {
      const x0 = S.X(p.x);
      const y0 = S.Y(p.y);
      const pw = p.w * S.k;
      const ph = p.h * S.k;
      const e = Math.min(pw, ph) * 0.09;
      for (const [gx0, gy0, gx1, gy1, rx, ry, rw, rh] of [
        [x0, 0, x0 + e, 0, x0, y0, e, ph], [x0 + pw, 0, x0 + pw - e, 0, x0 + pw - e, y0, e, ph],
        [0, y0, 0, y0 + e, x0, y0, pw, e], [0, y0 + ph, 0, y0 + ph - e, x0, y0 + ph - e, pw, e],
      ]) {
        const gr = g.createLinearGradient(gx0, gy0, gx1, gy1);
        gr.addColorStop(0, 'rgba(90,55,20,0.22)');
        gr.addColorStop(1, 'rgba(90,55,20,0)');
        g.fillStyle = gr;
        g.fillRect(rx, ry, rw, rh);
      }
      g.strokeStyle = 'rgba(80,50,20,0.28)';
      g.lineWidth = Math.max(1, S.k * 2.2);
      g.strokeRect(x0, y0, pw, ph);
      g.strokeStyle = 'rgba(255,248,225,0.25)';
      g.lineWidth = 1;
      g.strokeRect(x0 + 2, y0 + 2, pw - 4, ph - 4);
    }
    // a scorch in one corner, because this has been in a boy's pocket for years
    const bx = S.X(sheet.w * 0.97);
    const by = S.Y(sheet.h * 0.95);
    const br = 260 * S.k;
    const gr = g.createRadialGradient(bx, by, 0, bx, by, br);
    gr.addColorStop(0, 'rgba(70,40,15,0.35)');
    gr.addColorStop(1, 'rgba(70,40,15,0)');
    g.fillStyle = gr;
    g.fillRect(bx - br, by - br, br * 2, br * 2);
  }

  /* ══════════════════════════════════════════════════════════════════════
     ink helpers for the sheets, in sheet coordinates via S
     ══════════════════════════════════════════════════════════════════════ */

  function mk(S) {
    const P = (pts) => pts.map(([x, y]) => [S.X(x), S.Y(y)]);
    const px = (w, lo = 0.55, hi = 3.4) => clamp(w * S.k, lo, hi);
    const line = (g, pts, w = 2, o = {}) => {
      const q = P(pts);
      const r = resample(q, Math.max(2.5, 5));
      const wq = wobble(r, o.amp == null ? 0.45 : o.amp, o.seed || pts.length);
      g.save();
      g.strokeStyle = o.color || INK;
      g.globalAlpha *= o.alpha == null ? 0.9 : o.alpha;
      g.lineWidth = px(w, o.min || 0.55, o.max || 3.4);
      g.lineCap = 'round';
      g.lineJoin = 'round';
      if (o.dash) g.setLineDash(o.dash.map((d) => Math.max(1.5, d * S.k)));
      trace(g, wq, false);
      g.stroke();
      g.restore();
    };
    const double = (g, pts, d, w = 1.6, o = {}) => {
      const [a, b] = sides(pts, d);
      line(g, a, w, o);
      line(g, b, w, { ...o, seed: (o.seed || 1) + 7 });
    };
    const room = (g, poly, o = {}) => {
      line(g, poly, o.w || 2.2, { seed: o.seed });
      line(g, offset(poly.slice(0, -1), -(o.inset || 7)).concat([offset(poly.slice(0, -1), -(o.inset || 7))[0]]), 1.1, { seed: (o.seed || 1) + 3, alpha: 0.7 });
    };
    const tower = (g, cx, cy, r, o = {}) => {
      line(g, ellipse(cx, cy, r, r, 48), 2.4, { seed: o.seed });
      line(g, ellipse(cx, cy, r - 9, r - 9, 44), 1.1, { seed: (o.seed || 1) + 1, alpha: 0.7 });
      // the spiral stair inside
      const sp = [];
      for (let i = 0; i <= 60; i++) {
        const a = (i / 60) * TAU * 1.6;
        const rr = (r - 16) * (1 - i / 75);
        sp.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
      }
      line(g, sp, 0.9, { alpha: 0.55, seed: (o.seed || 1) + 2 });
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * TAU;
        line(g, [[cx + Math.cos(a) * (r - 9), cy + Math.sin(a) * (r - 9)], [cx + Math.cos(a) * (r - 22), cy + Math.sin(a) * (r - 22)]], 0.8, { alpha: 0.5 });
      }
    };
    const steps = (g, x, y, w, h, n, vertical, o = {}) => {
      line(g, rectP(x, y, w, h), 1.4, { seed: o.seed });
      for (let i = 1; i < n; i++) {
        const t = i / n;
        if (vertical) line(g, [[x + 4, y + h * t], [x + w - 4, y + h * t]], 0.9, { alpha: 0.75 });
        else line(g, [[x + w * t, y + 4], [x + w * t, y + h - 4]], 0.9, { alpha: 0.75 });
      }
    };
    const txt = (g, text, x, y, size, o = {}) => {
      if (o.min && S.scale < o.min) return;
      label(g, text, S.X(x), S.Y(y), { ...o, size: clamp(size * S.k, 0, o.cap || 40) });
    };
    const along = (g, text, pts, size, o = {}) => {
      if (o.min && S.scale < o.min) return;
      labelAlong(g, text, P(pts), { ...o, size: clamp(size * S.k, 0, o.cap || 40) });
    };
    return { P, px, line, double, room, tower, steps, txt, along };
  }

  function waterLines(g, S, polys, spacing, rings, alpha = 0.45) {
    /*
      Water lines, the old way: concentric strokes following the shore.

      Each ring is one wide stroke of the coast with a slightly narrower stroke
      rubbed out of its middle, which leaves a thin line at exactly that
      distance from the land — on both sides of it. The inside half is then
      rubbed out with the land itself, so the lines only ever lie on water.
    */
    const w = g.canvas.width;
    const h = g.canvas.height;
    const tmp = scratch(w, h);
    const t = tmp.getContext('2d');
    t.setTransform(g.getTransform());
    const path = () => {
      t.beginPath();
      for (const p of polys) {
        t.moveTo(S.X(p[0][0]), S.Y(p[0][1]));
        for (let i = 1; i < p.length; i++) t.lineTo(S.X(p[i][0]), S.Y(p[i][1]));
        t.closePath();
      }
    };
    for (let k = 1; k <= rings; k++) {
      const d = spacing * k * S.k;
      const lw = Math.max(0.6, Math.min(1.4, 1.2 * S.k + 0.4));
      t.save();
      t.setTransform(1, 0, 0, 1, 0, 0);
      t.clearRect(0, 0, w, h);
      t.restore();
      t.lineJoin = 'round';
      t.globalCompositeOperation = 'source-over';
      t.strokeStyle = INK;
      path();
      t.lineWidth = 2 * d + lw;
      t.stroke();
      t.globalCompositeOperation = 'destination-out';
      t.lineWidth = Math.max(0.1, 2 * d - lw);
      t.stroke();
      t.fillStyle = '#000';
      path();
      t.fill('evenodd');
      g.save();
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.globalAlpha = alpha * (1 - (k - 1) / (rings + 1));
      g.drawImage(tmp, 0, 0);
      g.restore();
    }
  }

  const scratches = {};
  function scratch(w, h) {
    let c = scratches.c;
    if (!c) { c = document.createElement('canvas'); scratches.c = c; }
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
    return c;
  }

  /** An ornate compass rose, in sheet coordinates. */
  function compass(g, S, K, cx, cy, r) {
    K.line(g, ellipse(cx, cy, r, r, 60), 2, { seed: 91 });
    K.line(g, ellipse(cx, cy, r * 0.84, r * 0.84, 60), 1, { seed: 92, alpha: 0.6 });
    K.line(g, ellipse(cx, cy, r * 0.3, r * 0.3, 40), 1.2, { seed: 93 });
    for (let i = 0; i < 32; i++) {
      const a = (i / 32) * TAU;
      const r0 = r * 0.84;
      const r1 = r * (i % 4 === 0 ? 0.7 : 0.78);
      K.line(g, [[cx + Math.cos(a) * r0, cy + Math.sin(a) * r0], [cx + Math.cos(a) * r1, cy + Math.sin(a) * r1]], 0.8, { alpha: 0.6 });
    }
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU - Math.PI / 2;
      const long = i % 2 === 0;
      const tip = r * (long ? 1.15 : 0.66);
      const side = r * (long ? 0.14 : 0.1);
      const pts = [[cx, cy], [cx + Math.cos(a - Math.PI / 2) * side, cy + Math.sin(a - Math.PI / 2) * side], [cx + Math.cos(a) * tip, cy + Math.sin(a) * tip], [cx + Math.cos(a + Math.PI / 2) * side, cy + Math.sin(a + Math.PI / 2) * side], [cx, cy]];
      const q = K.P(pts);
      g.save();
      g.fillStyle = long ? 'rgba(58,36,19,0.8)' : 'rgba(58,36,19,0.35)';
      trace(g, [q[0], q[1], q[2]], true);
      g.fill();
      g.restore();
      K.line(g, pts, 1.1, { seed: 94 + i });
    }
    K.txt(g, 'N', cx, cy - r * 1.32, r * 0.3, { weight: 1.2 });
    K.txt(g, 'S', cx, cy + r * 1.32, r * 0.22);
    K.txt(g, 'E', cx + r * 1.3, cy, r * 0.22);
    K.txt(g, 'W', cx - r * 1.3, cy, r * 0.22);
  }

  /** A cartouche: a ruled frame with scrolls at the corners and words inside. */
  function cartouche(g, S, K, cx, cy, w, h, lines) {
    const x = cx - w / 2;
    const y = cy - h / 2;
    const q = K.P(rectP(x, y, w, h));
    // the title sits on a clean patch: whatever was drawn under it is lifted first
    g.save();
    g.globalCompositeOperation = 'destination-out';
    trace(g, q, true);
    g.fill();
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = 'rgba(236,220,180,0.55)';
    g.fill();
    g.restore();
    K.line(g, rectP(x, y, w, h), 2.4, { seed: 71 });
    K.line(g, rectP(x + 12, y + 12, w - 24, h - 24), 1, { seed: 72, alpha: 0.65 });
    for (const [sx, sy] of [[x, y], [x + w, y], [x, y + h], [x + w, y + h]]) {
      const sp = [];
      for (let i = 0; i <= 30; i++) {
        const a = (i / 30) * TAU * 1.5;
        const rr = 26 * (1 - i / 38);
        sp.push([sx + Math.cos(a) * rr, sy + Math.sin(a) * rr]);
      }
      K.line(g, sp, 1.4, { seed: sx + sy });
    }
    let yy = y + 60;
    for (const [text, size, gap, o] of lines) {
      K.txt(g, text, cx, yy, size, { cap: 90, ...(o || {}) });
      yy += gap;
    }
  }

  /* ══════════════════════════════════════════════════════════════════════
     sheet one: the school and its grounds
     ══════════════════════════════════════════════════════════════════════ */

  const HOG = (() => {
    const W = 3200;
    const H = 2000;

    // ── rooms and towers
    const ROOMS = [
      { name: 'THE GREAT HALL', poly: rectP(1120, 780, 330, 300), lx: 1285, ly: 1060, size: 22 },
      { name: 'ENTRANCE HALL', poly: rectP(1470, 900, 190, 180), lx: 1565, ly: 1055, size: 15 },
      { name: 'LIBRARY', poly: rectP(1250, 560, 240, 170), lx: 1370, ly: 710, size: 17, shelves: true },
      { name: 'TROPHY ROOM', poly: rectP(1510, 720, 150, 120), lx: 1585, ly: 820, size: 12 },
      { name: 'HOSPITAL WING', poly: rectP(1890, 660, 130, 120), lx: 1955, ly: 760, size: 12 },
      { name: 'TRANSFIGURATION', poly: rectP(1890, 900, 150, 110), lx: 1965, ly: 990, size: 11 },
      { name: 'CHARMS', poly: rectP(1700, 1040, 150, 90), lx: 1775, ly: 1110, size: 12 },
      { name: 'KITCHENS', poly: rectP(1120, 1110, 200, 110), lx: 1220, ly: 1200, size: 13 },
      { name: 'DUNGEONS', poly: rectP(1470, 1120, 210, 120), lx: 1575, ly: 1150, size: 14 },
      { name: 'CLOCK TOWER COURTYARD', poly: rectP(1880, 1060, 220, 170), lx: 1990, ly: 1215, size: 11 },
    ];
    const TOWERS = [
      { name: 'GRYFFINDOR TOWER', x: 2060, y: 470, r: 80 },
      { name: 'RAVENCLAW TOWER', x: 1150, y: 480, r: 70 },
      { name: 'ASTRONOMY TOWER', x: 2110, y: 830, r: 72 },
      { name: 'NORTH TOWER', x: 1590, y: 420, r: 52 },
      { name: 'HEADMASTER', x: 1600, y: 600, r: 56, sub: '(mind the gargoyle)' },
      { name: 'OWLERY', x: 930, y: 380, r: 55 },
      { name: 'HUFFLEPUFF', x: 1370, y: 1175, r: 50, sub: 'basement' },
    ];
    const WALL = [[1060, 400], [1260, 360], [1560, 348], [1800, 370], [2190, 380], [2230, 700], [2200, 1000], [2240, 1300], [1700, 1312], [1100, 1300], [1050, 900], [1060, 400]];

    const LAKE = (() => {
      const out = [];
      for (let i = 0; i < 64; i++) {
        const a = (i / 64) * TAU;
        const r = 1 + 0.12 * Math.sin(a * 3 + 1) + 0.07 * Math.sin(a * 7 + 2) + 0.04 * Math.sin(a * 13);
        out.push([1760 + Math.cos(a) * 660 * r, 1700 + Math.sin(a) * 260 * r]);
      }
      return out;
    })();

    // ── the ways people walk
    const WAYS = [
      ['great hall', [[1150, 930], [1450, 930]]],
      ['entrance hall', [[1450, 990], [1660, 990]]],
      ['the grand staircase', [[1660, 990], [1775, 850], [1775, 700], [1775, 600]]],
      ['the seventh floor', [[1775, 600], [2060, 600], [2060, 470]]],
      ['the library corridor', [[1775, 700], [1500, 700], [1375, 650]]],
      ['the library', [[1375, 650], [1300, 620]]],
      ['to Ravenclaw', [[1300, 620], [1150, 560], [1150, 480]]],
      ['the headmaster’s stair', [[1500, 700], [1600, 640], [1600, 600]]],
      ['the north tower', [[1600, 600], [1590, 420]]],
      ['the hospital wing', [[1775, 760], [1955, 720]]],
      ['the astronomy tower', [[1955, 720], [2110, 830]]],
      ['the transfiguration corridor', [[1775, 850], [1965, 955]]],
      ['the clock courtyard', [[1965, 955], [1990, 1140]]],
      ['the dungeons', [[1560, 990], [1575, 1180], [1850, 1230]]],
      ['the kitchens', [[1450, 990], [1300, 1110], [1220, 1165], [1370, 1175]]],
      ['the front steps', [[1560, 1080], [1560, 1340]]],
      ['the lake shore', [[1560, 1340], [1760, 1410], [2100, 1450], [2400, 1560]]],
      ['the path to Hagrid’s', [[1560, 1340], [1250, 1330], [1100, 1300], [860, 1200]]],
      ['the forest edge', [[860, 1200], [600, 1250], [420, 1420], [300, 1420]]],
      ['deep in the forest', [[600, 1250], [520, 900], [450, 700]]],
      ['the whomping willow', [[1100, 1300], [1000, 1000], [1000, 760]]],
      ['the quidditch pitch', [[1990, 1140], [2300, 1160], [2600, 1050]]],
      ['the north door', [[1775, 600], [1800, 390], [2320, 330], [2450, 300]]],
      ['Hogsmeade high street', [[2450, 300], [3050, 300]]],
      ['Honeydukes', [[2645, 300], [2645, 250]]],
      ['the Three Broomsticks', [[2765, 300], [2765, 250]]],
      ['the Hog’s Head', [[3000, 300], [3000, 380]]],
      ['the road to the Shrieking Shack', [[3000, 380], [3000, 560]]],
      ['the owlery path', [[1150, 480], [930, 380]]],
      ['the clock tower', [[1990, 1140], [2150, 1100]]],
    ];
    const SECRET = [
      ['the passage to Honeydukes', [[1760, 760], [1900, 560], [2100, 300], [2350, 200], [2645, 250]]],
      ['the passage under the willow', [[1000, 760], [1060, 330], [1500, 180], [2300, 140], [2800, 360], [3000, 560]]],
      ['the passage behind the mirror', [[1400, 560], [1340, 300], [1440, 130]]],
      ['the chamber below', [[1270, 720], [1400, 1450], [1520, 1620]]],
    ];

    const PLACES = {
      'Great Hall': [1300, 930], 'Library': [1340, 640], 'Gryffindor Tower': [2060, 470], 'Ravenclaw Tower': [1150, 480],
      'Astronomy Tower': [2110, 830], 'Hospital Wing': [1955, 720], 'Dungeons': [1700, 1210], 'Slytherin': [1850, 1230],
      'Kitchens': [1300, 1120], 'Hufflepuff': [1370, 1175], 'Headmaster': [1600, 600], 'Owlery': [930, 380],
      'Hagrid': [860, 1200], 'Forest': [420, 1420], 'Glade': [450, 700], 'Willow': [1000, 800], 'Pitch': [2600, 1050],
      'Hogsmeade': [2760, 300], 'Honeydukes': [2645, 250], 'Broomsticks': [2765, 250], 'Shack': [3000, 560],
      'Lake': [2100, 1450], 'Clock': [1990, 1140], 'Seventh floor': [1900, 600], 'Transfiguration': [1965, 955],
    };

    function draw(g, S) {
      const K = mk(S);
      // ── the grounds first
      // forest: little scribbled crowns on a jittered grid
      if (S.scale > 0.12) {
        for (let i = 0; i < 520; i++) {
          const gx = hash(i * 3.7) * 820 + 40;
          const gy = hash(i * 5.3) * 1680 + 260;
          const inBand = gx < 820 || gy > 1750;
          const x = inBand ? gx : 0;
          if (!inBand) continue;
          const r = 16 + hash(i * 7.1) * 12;
          const pts = [];
          for (let k = 0; k <= 12; k++) {
            const a = (k / 12) * TAU;
            const rr = r * (0.8 + 0.3 * Math.sin(a * 4 + i));
            pts.push([x + Math.cos(a) * rr, gy + Math.sin(a) * rr * 0.85]);
          }
          K.line(g, pts, 1, { alpha: 0.55, seed: i });
          K.line(g, [[x, gy + r * 0.8], [x, gy + r * 1.35]], 1, { alpha: 0.5 });
        }
        for (let i = 0; i < 90; i++) {
          const x = 900 + hash(i * 2.2) * 900;
          const y = 1780 + hash(i * 4.4) * 160;
          if (hash(i * 6.6) < 0.5) continue;
          K.line(g, ellipse(x, y, 16, 13, 12), 1, { alpha: 0.5, seed: i + 700 });
        }
      }
      K.along(g, 'THE FORBIDDEN FOREST', [[120, 1600], [260, 1000], [430, 520], [560, 300]], 34, { alpha: 0.85 });
      K.txt(g, 'Aragog’s hollow', 300, 1470, 15, { min: 0.3 });
      K.line(g, ellipse(300, 1420, 40, 30, 20), 0.9, { alpha: 0.6 });
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * TAU;
        K.line(g, [[300, 1420], [300 + Math.cos(a) * 60, 1420 + Math.sin(a) * 46]], 0.7, { alpha: 0.5 });
      }
      K.txt(g, 'a clearing', 450, 660, 14, { min: 0.3 });

      // the lake, its water lines, and its label along the shore
      K.line(g, LAKE.concat([LAKE[0]]), 2.2, { seed: 51 });
      waterLines(g, S, [LAKE], 16, 4, 0.3);
      // hatched water inside: every line inset from the shore
      for (let k = 1; k <= 3; k++) K.line(g, offset(LAKE, -26 * k).concat([offset(LAKE, -26 * k)[0]]), 0.8, { alpha: 0.35, seed: 52 + k });
      K.along(g, 'THE BLACK LAKE', ellipse(1760, 1700, 520, 170, 40, Math.PI * 0.15, Math.PI * 0.85).reverse(), 30);
      // something with a great many arms
      for (let k = 0; k < 4; k++) {
        const pts = [];
        for (let i = 0; i <= 24; i++) {
          const u = i / 24;
          pts.push([2050 + k * 30 + Math.sin(u * 7 + k) * 22 * u, 1760 - u * 90]);
        }
        K.line(g, pts, 1.2, { alpha: 0.55, seed: 60 + k });
      }
      K.txt(g, 'the squid', 2110, 1790, 13, { min: 0.3 });
      K.room(g, rectP(1720, 1390, 80, 50), { seed: 61 });
      K.txt(g, 'BOATHOUSE', 1760, 1462, 10, { min: 0.3 });

      // Hagrid's hut and its pumpkins
      K.tower(g, 860, 1200, 44, { seed: 81 });
      for (let i = 0; i < 5; i++) K.line(g, ellipse(760 + i * 22, 1280 + (i % 2) * 14, 11, 9, 14), 1, { alpha: 0.7, seed: 82 + i });
      K.txt(g, 'HAGRID’S HUT', 860, 1120, 14);

      // the whomping willow
      K.line(g, [[1000, 820], [1000, 760]], 3, { seed: 90 });
      for (let i = 0; i < 9; i++) {
        const a = -Math.PI / 2 + (i - 4) * 0.35;
        const pts = [[1000, 770]];
        for (let k = 1; k <= 6; k++) pts.push([1000 + Math.cos(a + Math.sin(k * 1.7 + i) * 0.4) * k * 14, 770 + Math.sin(a + Math.sin(k * 1.3 + i) * 0.4) * k * 14]);
        K.line(g, pts, 1.3, { seed: 91 + i });
      }
      K.txt(g, 'WHOMPING WILLOW', 1000, 860, 13);

      // greenhouses
      for (let i = 0; i < 3; i++) {
        K.room(g, rectP(1150 + i * 100, 1340, 80, 46), { seed: 100 + i, inset: 5 });
        for (let k = 1; k < 4; k++) K.line(g, [[1150 + i * 100 + k * 20, 1344], [1150 + i * 100 + k * 20, 1382]], 0.7, { alpha: 0.5 });
      }
      K.txt(g, 'GREENHOUSES', 1250, 1410, 12);

      // the quidditch pitch
      K.line(g, ellipse(2600, 1050, 250, 125, 60), 2, { seed: 110 });
      K.line(g, ellipse(2600, 1050, 225, 104, 60), 1, { alpha: 0.6, seed: 111 });
      for (const s of [-1, 1]) {
        for (let i = -1; i <= 1; i++) {
          K.line(g, ellipse(2600 + s * 195, 1050 + i * 34, 10, 10, 14), 1.2, { seed: 112 + i });
        }
      }
      K.line(g, [[2600, 946], [2600, 1154]], 0.8, { alpha: 0.5 });
      K.line(g, ellipse(2600, 1050, 24, 24, 20), 0.8, { alpha: 0.5 });
      K.txt(g, 'QUIDDITCH PITCH', 2600, 1210, 18);

      // Hogsmeade
      const shops = [['Honeydukes', 2600, 200], ['Three Broomsticks', 2720, 200], ['Zonko’s', 2840, 200], ['Post Office', 2600, 340], ['Madam Puddifoot’s', 2720, 340], ['Hog’s Head', 2960, 340]];
      for (const [n, x, y] of shops) {
        K.room(g, rectP(x, y, 90, 60), { seed: x + y, inset: 5 });
        K.line(g, [[x, y], [x + 45, y - 22], [x + 90, y]], 1.2, { seed: x });
        K.txt(g, n, x + 45, y + 80, 11, { min: 0.25 });
      }
      K.double(g, [[2450, 300], [3080, 300]], 16, 1.1, { alpha: 0.6 });
      K.txt(g, 'HOGSMEADE', 2780, 130, 30);
      // the shack, on its hill, with its broken fence
      K.room(g, rectP(2955, 540, 90, 64), { seed: 131, inset: 5 });
      K.line(g, [[2955, 540], [3000, 505], [3045, 540]], 1.3, { seed: 132 });
      for (let i = 0; i < 9; i++) K.line(g, [[2920 + i * 20, 640], [2922 + i * 20, 612 - (i % 3) * 6]], 1, { alpha: 0.6 });
      K.txt(g, 'THE SHRIEKING SHACK', 3000, 680, 13);
      // the gates, with their winged boars
      for (const x of [2300, 2350]) K.room(g, rectP(x, 310, 24, 24), { seed: x, inset: 4 });
      K.txt(g, 'the gates', 2330, 380, 12, { min: 0.3 });
      K.line(g, [[1800, 390], [2320, 330], [2450, 300]], 1, { dash: [10, 8], alpha: 0.55 });
      K.line(g, [[1560, 1080], [1560, 1340], [1250, 1330], [1100, 1300], [860, 1200]], 1, { dash: [10, 8], alpha: 0.5 });
      K.line(g, [[1990, 1140], [2300, 1160], [2360, 1100]], 1, { dash: [10, 8], alpha: 0.5 });

      // ── the castle
      const wall = WALL;
      K.line(g, wall, 3, { seed: 140 });
      K.line(g, offset(wall.slice(0, -1), -14).concat([offset(wall.slice(0, -1), -14)[0]]), 1.2, { alpha: 0.7, seed: 141 });
      // crenellations
      for (let i = 0; i < wall.length - 1; i++) {
        const a = wall[i];
        const b = wall[i + 1];
        const L = dist(a, b);
        const n = Math.floor(L / 40);
        const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
        const nx = Math.sin(ang);
        const ny = -Math.cos(ang);
        for (let k = 1; k < n; k += 2) {
          const t0 = k / n;
          const t1 = (k + 0.5) / n;
          const p0 = [lerp(a[0], b[0], t0), lerp(a[1], b[1], t0)];
          const p1 = [lerp(a[0], b[0], t1), lerp(a[1], b[1], t1)];
          K.line(g, [p0, [p0[0] + nx * 10, p0[1] + ny * 10], [p1[0] + nx * 10, p1[1] + ny * 10], p1], 1, { alpha: 0.7 });
        }
      }
      // corridors as double lines
      for (const [, pts] of WAYS.slice(0, 15)) K.double(g, pts, 13, 1.1, { alpha: 0.75, seed: pts.length * 7 });
      // a corridor stops at the door: lift its ink back out of every room and tower it runs into
      g.save();
      g.globalCompositeOperation = 'destination-out';
      g.fillStyle = '#000';
      for (const r of ROOMS) { trace(g, K.P(r.poly), true); g.fill(); }
      for (const t of TOWERS) { trace(g, K.P(ellipse(t.x, t.y, t.r, t.r, 40)), true); g.fill(); }
      g.restore();
      for (const r of ROOMS) {
        K.room(g, r.poly, { seed: r.lx });
        if (r.shelves) for (let k = 1; k < 7; k++) K.line(g, [[1265, 560 + k * 22], [1475, 560 + k * 22]], 0.7, { alpha: 0.5 });
        K.txt(g, r.name, r.lx, r.ly, r.size, { cap: 34 });
      }
      // the four long tables and the one across the top
      for (let k = 0; k < 4; k++) K.line(g, [[1170 + k * 65, 850], [1170 + k * 65, 1030]], 2.2, { seed: 150 + k });
      K.line(g, [[1150, 815], [1420, 815]], 2.2, { seed: 155 });
      // the staircases, which do not stay where they are put
      K.steps(g, 1690, 690, 50, 150, 10, true, { seed: 160 });
      K.steps(g, 1805, 760, 50, 150, 10, true, { seed: 161 });
      K.steps(g, 1700, 870, 160, 44, 12, false, { seed: 162 });
      K.txt(g, 'GRAND STAIRCASE', 1775, 650, 12);
      for (const t of TOWERS) {
        K.tower(g, t.x, t.y, t.r, { seed: t.x });
        K.txt(g, t.name, t.x, t.y + t.r + 22, t.name.length > 12 ? 12 : 14, { cap: 30 });
        if (t.sub) K.txt(g, t.sub, t.x, t.y + t.r + 44, 11, { min: 0.35 });
      }
      K.tower(g, 2150, 1100, 40, { seed: 170 });
      K.line(g, ellipse(1990, 1140, 26, 26, 24), 1.2, { seed: 171 });
      K.txt(g, 'Slytherin common room', 1850, 1275, 12, { min: 0.3 });
      K.txt(g, '(under the lake)', 1850, 1297, 10, { min: 0.45 });
      K.txt(g, 'Potions', 1560, 1215, 11, { min: 0.35 });
      K.txt(g, 'the one-eyed witch', 1760, 785, 10, { min: 0.4 });
      K.line(g, ellipse(1760, 760, 8, 8, 12), 1.1, {});
      K.txt(g, 'a tall mirror', 1400, 590, 10, { min: 0.45 });
      K.txt(g, 'a girls’ bathroom, out of order', 1270, 750, 10, { min: 0.45 });

      // ── the passages nobody else has on their map
      for (const [name, pts] of SECRET) {
        const sm = chaikin(pts, 3);
        K.line(g, sm, 1.4, { dash: [3, 9], alpha: 0.85, seed: pts.length });
        K.along(g, name, sm, 12, { alpha: 0.75, lift: 10, min: 0.2 });
      }
      K.line(g, [[1425, 130], [1455, 150]], 2, {});
      K.line(g, [[1455, 130], [1425, 150]], 2, {});
      K.txt(g, 'caved in', 1440, 100, 11, { min: 0.3 });
      K.line(g, ellipse(1540, 1640, 50, 34, 24), 1.2, { dash: [3, 7] });
      K.txt(g, 'CHAMBER', 1540, 1700, 12, { min: 0.25 });

      compass(g, S, K, 2950, 1700, 130);
      cartouche(g, S, K, 1600, 210, 980, 250, [
        ['Messrs Moony, Wormtail, Padfoot & Prongs', 30, 50],
        ['keepers of secrets and walkers after dark', 22, 46],
        ['humbly present', 20, 56],
        ['THE MARAUDER’S MAP', 58, 0, { weight: 1.3, cap: 120 }],
      ]);
    }

    const panels = [];
    for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) panels.push({ x: c * (W / 4), y: r * (H / 2), w: W / 4, h: H / 2, c, r });

    return { id: 'hogwarts', W, H, w: W, h: H, seed: 11, panels, first: [1, 0], draw, WAYS, SECRET, PLACES };
  })();

  /* ══════════════════════════════════════════════════════════════════════
     sheet two: the whole wide world
     ══════════════════════════════════════════════════════════════════════ */

  const WORLD = (() => {
    const W = 3600;
    const H = 1900;
    const K7 = 610;
    const LAT_TOP = 84;
    const LAT_BOT = -58;
    const Y0 = 110 + (LAT_TOP * Math.PI / 180) * K7;
    /** Kavrayskiy VII: rounded at the sides, like an old wall map. */
    const proj = (lon, lat) => {
      const l = (lon * Math.PI) / 180;
      const p = (clamp(lat, LAT_BOT - 4, LAT_TOP) * Math.PI) / 180;
      return [W / 2 + K7 * (3 / (2 * Math.PI)) * l * Math.sqrt((Math.PI * Math.PI) / 3 - p * p), Y0 - K7 * p];
    };
    const data = window.MARAUDER_WORLD || { land: [], borders: [] };
    const toPts = (arr) => {
      const out = [];
      for (let i = 0; i < arr.length; i += 2) out.push([arr[i] / 10, arr[i + 1] / 10]);
      return out;
    };
    const LAND_LL = data.land.map(toPts).filter((r) => Math.max(...r.map((p) => p[1])) > LAT_BOT + 2);
    const LAND = LAND_LL.map((r) => r.map(([lo, la]) => proj(lo, la)));
    const BORDERS = data.borders.map(toPts).map((r) => r.map(([lo, la]) => proj(lo, la)));
    const BOXES = LAND_LL.map((r) => {
      let x0 = 999; let y0 = 999; let x1 = -999; let y1 = -999;
      for (const [x, y] of r) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
      return [x0, y0, x1, y1];
    });
    function onLand(lon, lat) {
      for (let k = 0; k < LAND_LL.length; k++) {
        const b = BOXES[k];
        if (lon < b[0] || lon > b[2] || lat < b[1] || lat > b[3]) continue;
        const r = LAND_LL[k];
        let inside = false;
        for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
          const [xi, yi] = r[i];
          const [xj, yj] = r[j];
          if ((yi > lat) !== (yj > lat) && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
        }
        if (inside) return true;
      }
      return false;
    }

    // [name, lon, lat, importance (1 = always, 3 = zoomed in), kind]
    const CITIES = [
      ['London', -0.1, 51.5, 1], ['Edinburgh', -3.2, 55.95, 2], ['Paris', 2.35, 48.85, 1], ['Rome', 12.5, 41.9, 1], ['Berlin', 13.4, 52.5, 2],
      ['Madrid', -3.7, 40.4, 2], ['Vienna', 16.4, 48.2, 3], ['Moscow', 37.6, 55.75, 1], ['Istanbul', 29, 41, 1], ['Athens', 23.7, 38, 3],
      ['Stockholm', 18.1, 59.3, 3], ['Reykjavík', -21.9, 64.1, 2], ['Cairo', 31.2, 30, 1], ['Lagos', 3.4, 6.5, 2], ['Nairobi', 36.8, -1.3, 2],
      ['Cape Town', 18.4, -33.9, 1], ['Marrakesh', -8, 31.6, 3], ['Tehran', 51.4, 35.7, 2], ['Mumbai', 72.8, 19, 1], ['Delhi', 77.2, 28.6, 1],
      ['Kathmandu', 85.3, 27.7, 3], ['Beijing', 116.4, 39.9, 1], ['Shanghai', 121.5, 31.2, 2], ['Tokyo', 139.7, 35.7, 1], ['Bangkok', 100.5, 13.75, 2],
      ['Singapore', 103.8, 1.35, 2], ['Jakarta', 106.8, -6.2, 3], ['Sydney', 151.2, -33.9, 1], ['Perth', 115.9, -31.95, 2], ['Auckland', 174.8, -36.8, 2],
      ['New York', -74, 40.7, 1], ['Chicago', -87.6, 41.9, 2], ['New Orleans', -90, 30, 3], ['San Francisco', -122.4, 37.8, 1], ['Los Angeles', -118.2, 34, 3],
      ['Mexico City', -99.1, 19.4, 1], ['Toronto', -79.4, 43.7, 3], ['Vancouver', -123.1, 49.3, 2], ['Anchorage', -149.9, 61.2, 3],
      ['Lima', -77, -12, 2], ['Rio de Janeiro', -43.2, -22.9, 1], ['Buenos Aires', -58.4, -34.6, 1], ['Santiago', -70.7, -33.4, 3], ['Bogotá', -74.1, 4.7, 3],
      ['Dubai', 55.3, 25.2, 3], ['Addis Ababa', 38.7, 9, 3], ['Kinshasa', 15.3, -4.3, 3], ['Seoul', 127, 37.6, 3], ['Manila', 121, 14.6, 3],
    ];
    // the wizarding places: [name, lon, lat, note]
    const MAGIC = [
      ['Hogwarts', -4.6, 57.3, 'a castle in the Highlands'], ['Beauxbatons', 0.6, 42.8, 'in the Pyrenees'], ['Durmstrang', 19, 68.6, 'somewhere cold'],
      ['Ilvermorny', -73.2, 42.6, 'on Mount Greylock'], ['Castelobruxo', -63, -4, 'in the rainforest'], ['Uagadou', 29.9, 0.4, 'Mountains of the Moon'],
      ['Mahoutokoro', 141.3, 24.2, 'on a volcanic isle'], ['Koldovstoretz', 60, 62, 'somewhere in the snow'], ['Azkaban', 3.5, 57.8, 'in the North Sea'],
      ['Nurmengard', 13.5, 47.4, 'a tower in the Alps'], ['Godric’s Hollow', -2.4, 51.2, 'a village in the West Country'],
      ['Dragon reserve', 24.9, 45.6, 'Romania'], ['Gringotts, Cairo branch', 31.1, 29.9, 'curse-breakers wanted'],
    ];
    const LL = {};
    for (const [n, lo, la] of CITIES) LL[n] = [lo, la];
    for (const [n, lo, la] of MAGIC) LL[n] = [lo, la];

    const OCEANS = [
      ['NORTH ATLANTIC OCEAN', -40, 32, 1.0], ['SOUTH ATLANTIC OCEAN', -18, -24, 1.0], ['PACIFIC OCEAN', -150, 8, 1.3],
      ['PACIFIC OCEAN', 170, 18, 1.0], ['INDIAN OCEAN', 78, -20, 1.2], ['ARCTIC OCEAN', 0, 80, 0.9], ['SOUTHERN OCEAN', 60, -52, 0.9],
    ];
    const CONTINENTS = [
      ['EUROPE', 18, 53], ['ASIA', 92, 50], ['AFRICA', 18, 6], ['NORTH AMERICA', -102, 46], ['SOUTH AMERICA', -60, -14], ['AUSTRALIA', 134, -25],
    ];

    function draw(g, S) {
      const K = mk(S);
      // graticule
      for (let lon = -180; lon <= 180; lon += 30) {
        const pts = [];
        for (let lat = LAT_BOT; lat <= LAT_TOP; lat += 2) pts.push(proj(lon, lat));
        K.line(g, pts, 0.7, { alpha: 0.28, dash: [8, 10], amp: 0.2 });
      }
      for (let lat = -30; lat <= 60; lat += 30) {
        const pts = [];
        for (let lon = -180; lon <= 180; lon += 3) pts.push(proj(lon, lat));
        K.line(g, pts, lat === 0 ? 1.2 : 0.7, { alpha: lat === 0 ? 0.55 : 0.28, dash: lat === 0 ? null : [8, 10], amp: 0.2 });
      }
      for (const [name, lat] of [['Tropic of Cancer', 23.44], ['Tropic of Capricorn', -23.44], ['Arctic Circle', 66.56]]) {
        const pts = [];
        for (let lon = -180; lon <= 180; lon += 3) pts.push(proj(lon, lat));
        K.line(g, pts, 0.8, { alpha: 0.4, dash: [2, 7], amp: 0.2 });
        K.txt(g, name, proj(-172, lat)[0] + 60, proj(-172, lat)[1] - 14, 16, { alpha: 0.6, align: 'left' });
      }
      K.txt(g, 'the Equator', proj(-172, 0)[0] + 50, proj(-172, 0)[1] - 14, 16, { alpha: 0.6, align: 'left' });
      // the outline of the world itself
      const rim = [];
      for (let lat = LAT_BOT; lat <= LAT_TOP; lat += 2) rim.push(proj(-180, lat));
      for (let lon = -180; lon <= 180; lon += 4) rim.push(proj(lon, LAT_TOP));
      for (let lat = LAT_TOP; lat >= LAT_BOT; lat -= 2) rim.push(proj(180, lat));
      for (let lon = 180; lon >= -180; lon -= 4) rim.push(proj(lon, LAT_BOT));
      K.line(g, rim, 2.4, { seed: 5 });
      K.line(g, offset(rim, 12), 1, { alpha: 0.6, seed: 6 });

      // the land: a shade, water lines outside, the coast itself
      g.save();
      g.fillStyle = 'rgba(150,105,55,0.12)';
      g.beginPath();
      for (const r of LAND) {
        g.moveTo(S.X(r[0][0]), S.Y(r[0][1]));
        for (let i = 1; i < r.length; i++) g.lineTo(S.X(r[i][0]), S.Y(r[i][1]));
        g.closePath();
      }
      g.fill();
      g.restore();
      waterLines(g, S, LAND, 9, 3, 0.4);
      for (const [i, r] of LAND.entries()) K.line(g, r.concat([r[0]]), 1.5, { seed: i, amp: 0.35, max: 2.2 });
      for (const [i, b] of BORDERS.entries()) K.line(g, b, 0.9, { dash: [2, 6], alpha: 0.55, seed: i + 400, amp: 0.2 });
      // Antarctica, as the old maps had it: a guess
      const south = [];
      for (let lon = -180; lon <= 180; lon += 4) south.push(proj(lon, LAT_BOT + 2 + Math.sin(lon * 0.09) * 1.6 + Math.sin(lon * 0.23) * 0.8));
      K.line(g, south, 1.4, { seed: 800 });
      K.txt(g, 'TERRA AUSTRALIS · largely unwalked', W / 2, proj(0, LAT_BOT + 0.5)[1] + 4, 20, { alpha: 0.6 });

      for (const [n, lo, la, s] of OCEANS) {
        const pts = [];
        for (let d = -22 * s; d <= 22 * s; d += 2) pts.push(proj(lo + d, la + Math.sin((d / 22) * 1.3) * 3));
        K.along(g, n, pts, 26, { alpha: 0.7, cap: 60 });
      }
      for (const [n, lo, la] of CONTINENTS) {
        const [x, y] = proj(lo, la);
        K.txt(g, n, x, y, 40, { alpha: 0.55, cap: 80, weight: 1.1 });
      }
      // cities
      for (const [n, lo, la, imp] of CITIES) {
        const minScale = imp === 1 ? 0 : imp === 2 ? 0.55 : 1.0;
        if (S.scale < minScale) continue;
        const [x, y] = proj(lo, la);
        g.save();
        g.fillStyle = INK;
        g.beginPath();
        g.arc(S.X(x), S.Y(y), clamp(3.4 * S.k, 1.6, 4), 0, TAU);
        g.fill();
        g.restore();
        K.txt(g, n, x + 10, y - 14, imp === 1 ? 17 : 14, { align: 'left', cap: 26 });
      }
      // the wizarding places: a little shield with a star on it
      for (const [n, lo, la, note] of MAGIC) {
        const [x, y] = proj(lo, la);
        const shield = [[x - 12, y - 16], [x + 12, y - 16], [x + 12, y - 2], [x, y + 14], [x - 12, y - 2], [x - 12, y - 16]];
        const q = K.P(shield);
        g.save();
        g.fillStyle = 'rgba(120,30,20,0.55)';
        trace(g, q, true);
        g.fill();
        g.restore();
        K.line(g, shield, 1.4, { color: '#5a1a10', seed: x });
        K.txt(g, n, x - 18, y + 4, 15, { align: 'right', color: '#5a1a10', cap: 24, slant: 0.2 });
        K.txt(g, note, x - 18, y + 24, 10, { align: 'right', color: '#5a1a10', alpha: 0.7, min: 1.0 });
      }
      // what the old map-makers put in the empty bits
      seaSerpent(g, K, proj(-142, 4));
      ship(g, K, proj(-38, 12));
      tentacles(g, K, proj(88, -38));
      dragon(g, K, proj(26, 44.4));
      K.txt(g, 'here be dragons', proj(26, 44)[0], proj(26, 44)[1] - 64, 13, { min: 0.6, alpha: 0.8 });

      compass(g, S, K, 260, H - 360, 120);
      // the title goes where the world is emptiest, which is the South Pacific
      const [tx, ty] = proj(-134, -24);
      cartouche(g, S, K, tx, ty, 700, 250, [
        ['Messrs Moony, Wormtail, Padfoot & Prongs,', 23, 40],
        ['having run clean out of castle,', 18, 38],
        ['humbly present', 16, 50],
        ['THE MARAUDER’S MAP', 46, 50, { weight: 1.3, cap: 120 }],
        ['of the whole wide World', 20, 0],
      ]);
    }

    function seaSerpent(g, K, [x, y]) {
      const body = [];
      for (let i = 0; i <= 40; i++) {
        const u = i / 40;
        body.push([x - 120 + u * 260, y + Math.sin(u * TAU * 1.5) * 34]);
      }
      K.line(g, body, 3, { seed: 900 });
      for (let i = 4; i < 40; i += 8) K.line(g, [body[i], [body[i][0] + 4, body[i][1] - 16]], 1.2, { alpha: 0.7 });
      K.line(g, ellipse(x + 150, y - 6, 20, 12, 16), 1.6, { seed: 901 });
      K.line(g, [[x + 168, y - 4], [x + 190, y - 2], [x + 196, y - 8]], 1, {});
      for (let i = 0; i < 3; i++) K.line(g, [[x - 100 + i * 90, y + 40], [x - 80 + i * 90, y + 36], [x - 60 + i * 90, y + 40]], 0.9, { alpha: 0.6 });
    }
    function ship(g, K, [x, y]) {
      K.line(g, [[x - 60, y], [x + 60, y], [x + 44, y + 22], [x - 44, y + 22], [x - 60, y]], 1.6, { seed: 910 });
      K.line(g, [[x, y], [x, y - 90]], 1.4, {});
      K.line(g, [[x + 4, y - 86], [x + 50, y - 50], [x + 4, y - 14]], 1.2, {});
      K.line(g, [[x - 4, y - 70], [x - 40, y - 40], [x - 4, y - 18]], 1.2, {});
      for (let i = 0; i < 4; i++) K.line(g, [[x - 80 + i * 40, y + 30], [x - 60 + i * 40, y + 26], [x - 40 + i * 40, y + 30]], 0.9, { alpha: 0.6 });
    }
    function tentacles(g, K, [x, y]) {
      for (let k = 0; k < 5; k++) {
        const pts = [];
        for (let i = 0; i <= 20; i++) {
          const u = i / 20;
          pts.push([x - 80 + k * 40 + Math.sin(u * 6 + k) * 18 * u, y + 30 - u * 110]);
        }
        K.line(g, pts, 1.8 - k * 0.1, { seed: 920 + k });
      }
      for (let i = 0; i < 5; i++) K.line(g, [[x - 110 + i * 50, y + 34], [x - 90 + i * 50, y + 30], [x - 70 + i * 50, y + 34]], 0.9, { alpha: 0.6 });
    }
    function dragon(g, K, [x, y]) {
      const body = [[x - 50, y - 20], [x - 20, y - 36], [x + 20, y - 30], [x + 44, y - 44], [x + 60, y - 40]];
      K.line(g, chaikin(body, 2), 2, { seed: 930 });
      K.line(g, [[x - 10, y - 34], [x - 30, y - 80], [x + 6, y - 56], [x + 14, y - 32]], 1.3, { seed: 931 });
      K.line(g, [[x - 50, y - 20], [x - 76, y - 10], [x - 64, y - 26]], 1.2, {});
      K.line(g, [[x + 60, y - 40], [x + 80, y - 30]], 1, { color: '#8a2a14' });
    }

    const panels = [];
    for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) panels.push({ x: c * (W / 4), y: r * (H / 2), w: W / 4, h: H / 2, c, r });

    return { id: 'world', W, H, w: W, h: H, seed: 23, panels, first: [1, 0], draw, proj, onLand, LL, MAGIC, CITIES };
  })();

  /* ══════════════════════════════════════════════════════════════════════
     the plate: what does not move, drawn once per view and blitted
     ══════════════════════════════════════════════════════════════════════ */

  class Plate {
    constructor() {
      this.paper = document.createElement('canvas');
      this.ink = document.createElement('canvas');
      this.rect = null;
      this.scale = 0;
      this.sheet = null;
      this.lastMs = 0;
    }

    covers(view, sheet, vw, vh) {
      if (!this.rect || this.sheet !== sheet) return false;
      if (Math.abs(view.s - this.scale) / this.scale > 0.02) return false;
      const need = visible(view, sheet, vw, vh);
      return need.x0 >= this.rect.x0 && need.y0 >= this.rect.y0 && need.x1 <= this.rect.x1 && need.y1 <= this.rect.y1;
    }

    draw(view, sheet, vw, vh, dpr) {
      const t0 = performance.now();
      const need = visible(view, sheet, vw, vh);
      const mx = (need.x1 - need.x0) * 0.35;
      const my = (need.y1 - need.y0) * 0.35;
      const r = { x0: Math.max(0, need.x0 - mx), y0: Math.max(0, need.y0 - my), x1: Math.min(sheet.w, need.x1 + mx), y1: Math.min(sheet.h, need.y1 + my) };
      let k = view.s * dpr;
      const maxDim = 4096;
      k = Math.min(k, maxDim / (r.x1 - r.x0), maxDim / (r.y1 - r.y0));
      const w = Math.max(1, Math.ceil((r.x1 - r.x0) * k));
      const h = Math.max(1, Math.ceil((r.y1 - r.y0) * k));
      for (const c of [this.paper, this.ink]) { c.width = w; c.height = h; }
      const S = { k, scale: view.s, X: (x) => (x - r.x0) * k, Y: (y) => (y - r.y0) * k };
      drawPaper(this.paper.getContext('2d'), sheet, S, w, h);
      const g = this.ink.getContext('2d');
      g.clearRect(0, 0, w, h);
      sheet.draw(g, S);
      this.rect = r;
      this.k = k;
      this.scale = view.s;
      this.sheet = sheet;
      this.lastMs = performance.now() - t0;
    }

    /** Blit one layer, or a sheet-space sub-rectangle of it. */
    blit(ctx, which, src) {
      const c = which === 'ink' ? this.ink : this.paper;
      const r = this.rect;
      if (!src) {
        ctx.drawImage(c, r.x0, r.y0, r.x1 - r.x0, r.y1 - r.y0);
        return;
      }
      const sx0 = Math.max(src.x, r.x0);
      const sy0 = Math.max(src.y, r.y0);
      const sx1 = Math.min(src.x + src.w, r.x1);
      const sy1 = Math.min(src.y + src.h, r.y1);
      if (sx1 <= sx0 || sy1 <= sy0) return;
      ctx.drawImage(c, (sx0 - r.x0) * this.k, (sy0 - r.y0) * this.k, (sx1 - sx0) * this.k, (sy1 - sy0) * this.k, sx0, sy0, sx1 - sx0, sy1 - sy0);
    }
  }

  function visible(view, sheet, vw, vh) {
    const hw = vw / 2 / view.s;
    const hh = vh / 2 / view.s;
    return {
      x0: clamp(view.cx - hw, 0, sheet.w), y0: clamp(view.cy - hh, 0, sheet.h),
      x1: clamp(view.cx + hw, 0, sheet.w), y1: clamp(view.cy + hh, 0, sheet.h),
    };
  }

  /* ══════════════════════════════════════════════════════════════════════
     the people on the map
     ══════════════════════════════════════════════════════════════════════ */

  function buildGraph(ways, secret, step = 26, join = 30) {
    const nodes = [];
    const add = (list, isSecret, label) => {
      for (const [name, pts] of list) {
        const sm = isSecret ? chaikin(pts, 3) : pts;
        const L = pathLen(sm);
        const n = Math.max(2, Math.round(L / step) + 1);
        let prev = -1;
        for (let i = 0; i < n; i++) {
          const [x, y] = pointAt(sm, (i / (n - 1)) * L);
          const id = nodes.length;
          nodes.push({ id, x, y, way: name, secret: isSecret, to: [] });
          if (prev >= 0) { nodes[prev].to.push(id); nodes[id].to.push(prev); }
          prev = id;
        }
        void label;
      }
    };
    add(ways, false);
    add(secret, true);
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (nodes[i].way === nodes[j].way) continue;
        if (Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y) < join) {
          nodes[i].to.push(j);
          nodes[j].to.push(i);
        }
      }
    }
    return nodes;
  }

  function route(nodes, from, to, allowSecret) {
    const best = new Float64Array(nodes.length).fill(Infinity);
    const prev = new Int32Array(nodes.length).fill(-1);
    const done = new Uint8Array(nodes.length);
    best[from] = 0;
    for (;;) {
      let at = -1;
      let b = Infinity;
      for (let i = 0; i < nodes.length; i++) if (!done[i] && best[i] < b) { b = best[i]; at = i; }
      if (at < 0 || at === to) break;
      done[at] = 1;
      for (const m of nodes[at].to) {
        if (nodes[m].secret && !allowSecret) continue;
        const d = best[at] + Math.hypot(nodes[at].x - nodes[m].x, nodes[at].y - nodes[m].y);
        if (d < best[m]) { best[m] = d; prev[m] = at; }
      }
    }
    if (!isFinite(best[to])) return null;
    const out = [];
    for (let at = to; at >= 0; at = prev[at]) out.push(at);
    return out.reverse();
  }

  function nearestNode(nodes, x, y, allowSecret) {
    let bi = 0;
    let bd = Infinity;
    for (const n of nodes) {
      if (n.secret && !allowSecret) continue;
      const d = Math.hypot(n.x - x, n.y - y);
      if (d < bd) { bd = d; bi = n.id; }
    }
    return bi;
  }

  /**
   * The school's people. Some walk in company: the three who are always
   * together, the one with his two large friends, a caretaker and his cat.
   * A follower does not find its own way; it walks where its leader walked a
   * moment ago, which is exactly how people walking together look from above.
   */
  function hogwartsCrowd(sheet) {
    const nodes = buildGraph(sheet.WAYS, sheet.SECRET);
    const P = sheet.PLACES;
    const W = (name, places, o = {}) => ({ name, places, speed: o.speed || 60, secret: !!o.secret, leader: o.leader || null, lag: o.lag || 0 });
    const people = [
      W('Harry Potter', ['Gryffindor Tower', 'Great Hall', 'Hagrid', 'Pitch', 'Library', 'Seventh floor', 'Hogsmeade', 'Honeydukes'], { secret: true, speed: 70 }),
      W('Ron Weasley', [], { leader: 'Harry Potter', lag: 0.9 }),
      W('Hermione Granger', [], { leader: 'Harry Potter', lag: 1.8 }),
      W('Draco Malfoy', ['Slytherin', 'Great Hall', 'Dungeons', 'Seventh floor', 'Pitch', 'Hogsmeade'], { speed: 62 }),
      W('Vincent Crabbe', [], { leader: 'Draco Malfoy', lag: 1.0 }),
      W('Gregory Goyle', [], { leader: 'Draco Malfoy', lag: 2.0 }),
      W('Fred Weasley', ['Honeydukes', 'Kitchens', 'Gryffindor Tower', 'Shack', 'Hogsmeade', 'Great Hall'], { secret: true, speed: 78 }),
      W('George Weasley', [], { leader: 'Fred Weasley', lag: 0.7 }),
      W('Argus Filch', ['Great Hall', 'Library', 'Dungeons', 'Seventh floor', 'Transfiguration', 'Clock', 'Kitchens'], { speed: 44 }),
      W('Mrs Norris', [], { leader: 'Argus Filch', lag: -0.6 }),
      W('Albus Dumbledore', ['Headmaster', 'Great Hall', 'Hospital Wing', 'Owlery', 'Headmaster', 'Hagrid'], { speed: 40 }),
      W('Severus Snape', ['Dungeons', 'Great Hall', 'Seventh floor', 'Library', 'Slytherin', 'Headmaster', 'Willow'], { speed: 72 }),
      W('Minerva McGonagall', ['Transfiguration', 'Great Hall', 'Gryffindor Tower', 'Headmaster', 'Pitch'], { speed: 55 }),
      W('Rubeus Hagrid', ['Hagrid', 'Forest', 'Glade', 'Lake', 'Great Hall', 'Hogsmeade'], { speed: 50 }),
      W('Neville Longbottom', ['Gryffindor Tower', 'Great Hall', 'Lake', 'Library', 'Clock'], { speed: 52 }),
      W('Luna Lovegood', ['Ravenclaw Tower', 'Forest', 'Lake', 'Owlery', 'Glade', 'Great Hall'], { speed: 46 }),
      W('Ginny Weasley', ['Gryffindor Tower', 'Pitch', 'Great Hall', 'Hogsmeade'], { speed: 66 }),
      W('Cedric Diggory', ['Hufflepuff', 'Kitchens', 'Pitch', 'Great Hall', 'Library'], { speed: 60 }),
      W('Cho Chang', ['Ravenclaw Tower', 'Owlery', 'Pitch', 'Great Hall', 'Hogsmeade'], { speed: 58 }),
      W('Peeves', ['Great Hall', 'Seventh floor', 'Kitchens', 'Transfiguration', 'Library', 'Dungeons', 'Clock', 'Hospital Wing'], { speed: 110 }),
      W('Nearly Headless Nick', ['Gryffindor Tower', 'Great Hall', 'Seventh floor'], { speed: 36 }),
      W('Moaning Myrtle', ['Library', 'Dungeons', 'Lake'], { speed: 34 }),
    ];
    return makeCrowd(nodes, people, P, { stride: 16, foot: 5.5 });
  }

  function makeCrowd(nodes, people, places, o) {
    const byName = {};
    const list = people.map((p, i) => {
      const start = nearestNode(nodes, ...(places[p.places[i % Math.max(1, p.places.length)]] || places[Object.keys(places)[i % Object.keys(places).length]]), false);
      const w = {
        ...p, x: nodes[start].x, y: nodes[start].y, node: start, path: [], leg: 0, dwell: hash(i) * 3, heading: 0,
        prints: [], stride: 0, foot: false, trail: [], vis: 1,
      };
      byName[p.name] = w;
      return w;
    });
    for (const w of list) if (w.leader) w.lead = byName[w.leader];
    return {
      list, nodes, places, o,
      step(dt, now) {
        for (const w of list) {
          for (const p of w.prints) p.age += dt;
          while (w.prints.length && w.prints[0].age > 7) w.prints.shift();
          if (w.lead) {
            // walk where the leader was a moment ago
            const L = w.lead;
            const tr = L.trail;
            const want = now - Math.abs(w.lag);
            let tx = L.x;
            let ty = L.y;
            if (w.lag > 0) {
              for (let k = tr.length - 1; k >= 0; k--) if (tr[k][2] <= want) { tx = tr[k][0]; ty = tr[k][1]; break; }
            } else {
              tx = L.x + Math.cos(L.heading) * 14;
              ty = L.y + Math.sin(L.heading) * 14;
            }
            const d = Math.hypot(tx - w.x, ty - w.y);
            if (d > 0.5) {
              w.heading = Math.atan2(ty - w.y, tx - w.x);
              const mv = Math.min(d, Math.max(L.speed * 1.4, d * 3) * dt);
              w.x += Math.cos(w.heading) * mv;
              w.y += Math.sin(w.heading) * mv;
              footstep(w, mv, o);
            }
            continue;
          }
          if (w.leg >= w.path.length) {
            w.dwell -= dt;
            if (w.dwell > 0) continue;
            const pick = w.places[Math.floor(hash(now * 7 + w.name.length) * w.places.length)];
            const target = places[pick];
            if (!target) { w.dwell = 1; continue; }
            const to = nearestNode(nodes, target[0], target[1], w.secret);
            const path = route(nodes, w.node, to, w.secret);
            if (!path || path.length < 2) { w.dwell = 1 + hash(now) * 2; continue; }
            w.path = path;
            w.leg = 1;
          }
          const n = nodes[w.path[w.leg]];
          const d = Math.hypot(n.x - w.x, n.y - w.y);
          const mv = w.speed * dt;
          if (d <= mv) {
            w.x = n.x;
            w.y = n.y;
            w.node = n.id;
            w.leg++;
            if (w.leg >= w.path.length) { w.path = []; w.leg = 0; w.dwell = 2 + hash(now * 3 + w.x) * 6; }
            footstep(w, d, o);
          } else {
            w.heading = Math.atan2(n.y - w.y, n.x - w.x);
            w.x += Math.cos(w.heading) * mv;
            w.y += Math.sin(w.heading) * mv;
            footstep(w, mv, o);
          }
          w.trail.push([w.x, w.y, now]);
          while (w.trail.length > 200) w.trail.shift();
        }
      },
    };
  }

  function footstep(w, moved, o) {
    w.stride += moved;
    if (w.stride < o.stride) return;
    w.stride = 0;
    w.foot = !w.foot;
    const side = w.foot ? 1 : -1;
    const off = o.foot * 0.55;
    w.prints.push({ x: w.x + Math.cos(w.heading + Math.PI / 2) * off * side, y: w.y + Math.sin(w.heading + Math.PI / 2) * off * side, a: w.heading, age: 0 });
    if (w.prints.length > 16) w.prints.shift();
  }

  /**
   * The world's people, who travel. Over land they walk; over sea they do
   * what anyone sensible would do and Disapparate, with a small ink puff at
   * each end and nothing at all in between.
   */
  function worldCrowd(sheet) {
    const T = (name, stops, speed = 36) => ({ name, stops, speed });
    const people = [
      T('Newt Scamander', ['London', 'New York', 'Mexico City', 'Rio de Janeiro', 'Castelobruxo', 'Lagos', 'Uagadou', 'Nairobi', 'Mumbai', 'Kathmandu', 'Beijing', 'Tokyo', 'Mahoutokoro', 'Sydney', 'London'], 44),
      T('Harry Potter', ['Hogwarts', 'Edinburgh', 'London', 'Godric’s Hollow', 'London']),
      T('Viktor Krum', ['Durmstrang', 'Stockholm', 'Berlin', 'Hogwarts', 'Durmstrang'], 40),
      T('Fleur Delacour', ['Beauxbatons', 'Paris', 'London', 'Hogwarts', 'Paris']),
      T('Charlie Weasley', ['Dragon reserve', 'Istanbul', 'Dragon reserve', 'Vienna', 'London', 'Dragon reserve']),
      T('Bill Weasley', ['Gringotts, Cairo branch', 'Marrakesh', 'Cairo', 'Athens', 'London']),
      T('Luna Lovegood', ['London', 'Stockholm', 'Reykjavík', 'Stockholm', 'Moscow', 'Koldovstoretz']),
      T('Gellert Grindelwald', ['Nurmengard', 'Vienna', 'Paris', 'New York', 'Berlin', 'Nurmengard'], 30),
      T('Albus Dumbledore', ['Hogwarts', 'London', 'Godric’s Hollow', 'Paris', 'Rome', 'Hogwarts'], 30),
      T('Rubeus Hagrid', ['Hogwarts', 'Edinburgh', 'London', 'Paris', 'Beauxbatons', 'Hogwarts'], 34),
      T('Gilderoy Lockhart', ['London', 'Athens', 'Cairo', 'Tehran', 'Delhi', 'Bangkok', 'Singapore']),
      T('Seraphina Picquery', ['New York', 'Ilvermorny', 'Chicago', 'New Orleans', 'New York']),
    ];
    const list = people.map((p, i) => {
      const [lo, la] = sheet.LL[p.stops[0]];
      const [x, y] = sheet.proj(lo, la);
      return { ...p, x, y, i: 0, leg: null, dwell: hash(i) * 4, heading: 0, prints: [], stride: 0, foot: false, vis: 1, puff: [] };
    });
    return {
      list,
      step(dt) {
        for (const w of list) {
          for (const p of w.prints) p.age += dt;
          while (w.prints.length && w.prints[0].age > 9) w.prints.shift();
          w.puff = w.puff.filter((p) => (p.age += dt) < 1.6);
          if (!w.leg) {
            w.dwell -= dt;
            if (w.dwell > 0) continue;
            const a = sheet.LL[w.stops[w.i % w.stops.length]];
            const b = sheet.LL[w.stops[(w.i + 1) % w.stops.length]];
            w.i++;
            const A = sheet.proj(a[0], a[1]);
            const B = sheet.proj(b[0], b[1]);
            let water = 0;
            for (let k = 1; k < 10; k++) {
              const t = k / 10;
              if (!sheet.onLand(lerp(a[0], b[0], t), lerp(a[1], b[1], t))) water++;
            }
            const len = Math.hypot(B[0] - A[0], B[1] - A[1]);
            w.leg = { A, B, t: 0, jump: water > 2 || len > 900, len };
            if (w.leg.jump) {
              w.puff.push({ x: A[0], y: A[1], age: 0 });
            }
          }
          const L = w.leg;
          if (L.jump) {
            L.t += dt;
            w.vis = L.t < 0.2 ? 1 - L.t / 0.2 : L.t > 1.0 ? Math.min(1, (L.t - 1.0) / 0.3) : 0;
            if (L.t >= 1.0 && !L.landed) { L.landed = true; w.x = L.B[0]; w.y = L.B[1]; w.puff.push({ x: w.x, y: w.y, age: 0 }); }
            if (L.t > 1.4) { w.leg = null; w.dwell = 1.5 + hash(w.x) * 3; w.vis = 1; }
            continue;
          }
          L.t += (w.speed * dt) / Math.max(1, L.len);
          const t = Math.min(1, L.t);
          const nx = lerp(L.A[0], L.B[0], t);
          const ny = lerp(L.A[1], L.B[1], t);
          const mv = Math.hypot(nx - w.x, ny - w.y);
          w.heading = Math.atan2(L.B[1] - L.A[1], L.B[0] - L.A[0]);
          w.x = nx;
          w.y = ny;
          footstep(w, mv, { stride: 12, foot: 5 });
          if (t >= 1) { w.leg = null; w.dwell = 1.5 + hash(w.x + w.y) * 3; }
        }
      },
    };
  }

  /* ══════════════════════════════════════════════════════════════════════
     name scrolls
     ══════════════════════════════════════════════════════════════════════ */

  const scrolls = new Map();

  /** A little banner with a name on it, drawn once and kept. */
  function scroll(name, px, dpr) {
    const key = name + '|' + px + '|' + dpr;
    const hit = scrolls.get(key);
    if (hit) return hit;
    const text = name.toUpperCase();
    const size = px;
    const tw = measure(text, 0.14) * size;
    const pad = size * 0.7;
    const w = tw + pad * 2 + size * 1.2;
    const h = size * 1.7;
    const c = document.createElement('canvas');
    c.width = Math.ceil(w * dpr);
    c.height = Math.ceil(h * dpr);
    const g = c.getContext('2d');
    g.scale(dpr, dpr);
    const tail = size * 0.6;
    const y0 = h * 0.18;
    const y1 = h * 0.82;
    // forked ends, tucked behind
    g.fillStyle = '#c9ae7e';
    g.strokeStyle = INK;
    g.lineWidth = 1;
    for (const [x0, dir] of [[tail, -1], [w - tail, 1]]) {
      g.beginPath();
      g.moveTo(x0, y0 + h * 0.12);
      g.lineTo(x0 + dir * tail, y0 + h * 0.12);
      g.lineTo(x0 + dir * tail * 0.55, (y0 + y1) / 2 + h * 0.1);
      g.lineTo(x0 + dir * tail, y1 + h * 0.12);
      g.lineTo(x0, y1 + h * 0.12);
      g.closePath();
      g.fill();
      g.stroke();
    }
    g.fillStyle = '#ecdcb6';
    g.beginPath();
    g.moveTo(tail, y0);
    g.quadraticCurveTo(w / 2, y0 - h * 0.08, w - tail, y0);
    g.lineTo(w - tail, y1);
    g.quadraticCurveTo(w / 2, y1 - h * 0.08, tail, y1);
    g.closePath();
    g.fill();
    g.stroke();
    label(g, text, w / 2, (y0 + y1) / 2 - h * 0.03, { size, track: 0.14, slant: 0.02, weight: 1.05 });
    const out = { c, w, h };
    scrolls.set(key, out);
    return out;
  }

  function printShape(ctx, x, y, a, s, alpha) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a + Math.PI / 2);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.ellipse(0, -s * 0.3, s * 0.3, s * 0.52, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, s * 0.45, s * 0.24, s * 0.27, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  /* ══════════════════════════════════════════════════════════════════════
     sound: paper, a quill, a puff. Made at run time with Web Audio.
     ══════════════════════════════════════════════════════════════════════ */

  let actx = null;
  function audio() {
    if (!actx) {
      try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { actx = null; }
    }
    if (actx && actx.state === 'suspended') actx.resume();
    return actx;
  }
  function noiseBuf(a, dur, shape) {
    const n = Math.floor(a.sampleRate * dur);
    const b = a.createBuffer(1, n, a.sampleRate);
    const d = b.getChannelData(0);
    let s = 1;
    for (let i = 0; i < n; i++) {
      s = (s * 16807) % 2147483647;
      d[i] = ((s / 2147483647) * 2 - 1) * shape(i / n);
    }
    return b;
  }
  function play(buf, freq, q, gain, when = 0) {
    const a = actx;
    const s = a.createBufferSource();
    s.buffer = buf;
    const f = a.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = freq;
    f.Q.value = q;
    const gn = a.createGain();
    gn.gain.value = gain;
    s.connect(f).connect(gn).connect(a.destination);
    s.start(a.currentTime + when);
  }
  const sfx = {
    rustle(when = 0) {
      const a = audio();
      if (!a) return;
      play(noiseBuf(a, 0.45, (x) => Math.sin(Math.PI * x) * (0.5 + 0.5 * Math.sin(x * 70))), 2400, 0.7, 0.55, when);
      play(noiseBuf(a, 0.25, (x) => Math.exp(-x * 5)), 900, 0.8, 0.35, when + 0.18);
    },
    bloom() {
      const a = audio();
      if (!a) return;
      play(noiseBuf(a, 2.8, (x) => Math.sin(Math.PI * x) * x), 600, 0.5, 0.45);
      [74, 78, 81, 86].forEach((m, i) => {
        const o = a.createOscillator();
        const gn = a.createGain();
        o.frequency.value = 440 * Math.pow(2, (m - 69) / 12);
        gn.gain.setValueAtTime(0, a.currentTime + 0.3 + i * 0.18);
        gn.gain.linearRampToValueAtTime(0.06, a.currentTime + 0.32 + i * 0.18);
        gn.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + 2.6 + i * 0.18);
        o.connect(gn).connect(a.destination);
        o.start(a.currentTime + 0.3 + i * 0.18);
        o.stop(a.currentTime + 3 + i * 0.18);
      });
    },
    drain() {
      const a = audio();
      if (!a) return;
      play(noiseBuf(a, 1.8, (x) => (1 - x) * Math.sin(Math.PI * Math.min(1, x * 4))), 450, 0.5, 0.45);
    },
    quill(dur) {
      const a = audio();
      if (!a) return;
      play(noiseBuf(a, dur, (x) => ((Math.floor(x * dur * 22) % 3) ? 0.6 : 0.1) * Math.sin(Math.PI * x)), 3600, 0.9, 0.35);
    },
    pop() {
      const a = audio();
      if (!a) return;
      play(noiseBuf(a, 0.12, (x) => Math.exp(-x * 14)), 1400, 1.2, 0.3);
    },
  };

  /* ══════════════════════════════════════════════════════════════════════
     the page
     ══════════════════════════════════════════════════════════════════════ */

  const canvas = document.getElementById('map');
  if (!canvas) { window.MARAUDER = { HOG, WORLD }; return; }
  const ctx = canvas.getContext('2d');
  const $ = (id) => document.getElementById(id);
  const ui = {
    oath: $('oath'), swear: $('swear'), close: $('close'), tabs: $('tabs'), who: $('who'),
    list: $('people'), hint: $('hint'), follow: $('following'),
  };

  let vw = 1;
  let vh = 1;
  let dpr = 1;
  function fit() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    vw = window.innerWidth;
    vh = window.innerHeight;
    canvas.width = Math.round(vw * dpr);
    canvas.height = Math.round(vh * dpr);
    canvas.style.width = vw + 'px';
    canvas.style.height = vh + 'px';
  }
  window.addEventListener('resize', () => { fit(); if (state.mode === 'open') view = { ...view }; });
  fit();

  const plate = new Plate();
  const state = {
    mode: 'closed', // closed → opening → open → closing
    sheet: HOG,
    t0: 0,
    bloom: null,
    remark: null,
    crowd: null,
    follow: null,
    next: null,
  };
  let view = { cx: 0, cy: 0, s: 1 };

  function firstPanel(sheet) {
    return sheet.panels.find((p) => p.c === sheet.first[0] && p.r === sheet.first[1]);
  }
  function packetView(sheet) {
    const p = firstPanel(sheet);
    const s = Math.min(vw / p.w, vh / p.h) * 0.62;
    return { cx: p.x + p.w / 2, cy: p.y + p.h / 2, s };
  }
  function sheetView(sheet) {
    // leave room on the right for the list of who is about, when there is room to leave
    const right = vw > 900 ? 212 : 0;
    const s = Math.min((vw - right - 24) / sheet.w, (vh - 96) / sheet.h);
    return { cx: sheet.w / 2 + right / 2 / s, cy: sheet.h / 2 - 4 / s, s };
  }

  /** The order the panels come open in, and which edge each one hinges on. */
  function unfoldPlan(sheet) {
    const [c0, r0] = sheet.first;
    const order = [];
    const seen = new Set([c0 + ',' + r0]);
    const queue = [[c0, r0]];
    while (queue.length) {
      const [c, r] = queue.shift();
      const nb = r === r0 ? [[c + 1, r, 'L'], [c - 1, r, 'R'], [c, r + 1, 'T'], [c, r - 1, 'B']] : [[c, r + 1, 'T'], [c, r - 1, 'B']];
      for (const [nc, nr, hinge] of nb) {
        const p = sheet.panels.find((q) => q.c === nc && q.r === nr);
        const k = nc + ',' + nr;
        if (!p || seen.has(k)) continue;
        seen.add(k);
        order.push({ p, hinge });
        queue.push([nc, nr]);
      }
    }
    // the top row first, left and right; then everything drops down
    return order.map((o, i) => ({ ...o, at: 0.9 + i * 0.28 }));
  }

  const UNFOLD = 0.5;

  /* ── drawing a frame ───────────────────────────────────────────────── */

  function toScreen(v) {
    ctx.setTransform(dpr * v.s, 0, 0, dpr * v.s, dpr * (vw / 2 - v.cx * v.s), dpr * (vh / 2 - v.cy * v.s));
  }

  function bloomPath(sheet, b, now) {
    const r = bloomRadius(b, now, sheet);
    ctx.beginPath();
    if (r <= 0) return 0;
    const n = 90;
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * TAU;
      const w = 1 + 0.08 * Math.sin(a * 5 + b.seed) + 0.05 * Math.sin(a * 11 + b.seed * 2) + 0.03 * Math.sin(a * 23 + now * 0.5);
      const x = b.x + Math.cos(a) * r * w;
      const y = b.y + Math.sin(a) * r * w;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    return r;
  }
  function bloomRadius(b, now, sheet) {
    const far = Math.max(...[[0, 0], [sheet.w, 0], [0, sheet.h], [sheet.w, sheet.h]].map(([x, y]) => Math.hypot(x - b.x, y - b.y))) * 1.15;
    const k = prog(now, b.t0, b.t0 + b.dur);
    return b.out ? far * (1 - eInOut(k)) : far * eOut(k) * (0.02 + 0.98 * k);
  }

  function drawDesk() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const g = ctx.createRadialGradient(vw * 0.5, vh * 0.45, 0, vw * 0.5, vh * 0.5, Math.max(vw, vh) * 0.75);
    g.addColorStop(0, '#3a2718');
    g.addColorStop(1, '#0e0805');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, vw, vh);
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 60; i++) {
      const y = (i / 60) * vh + Math.sin(i * 3.3) * 6;
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x <= vw; x += 60) ctx.lineTo(x, y + Math.sin(x * 0.01 + i) * 3);
      ctx.stroke();
    }
  }

  /** The folded packet: the first panel, with the others as a stack under it. */
  function drawPacket(sheet, now, inkTo) {
    const p = firstPanel(sheet);
    for (let k = 6; k >= 1; k--) {
      ctx.fillStyle = k % 2 ? '#b99f73' : '#c8ae82';
      ctx.fillRect(p.x + k * 5, p.y + k * 6, p.w, p.h);
      ctx.strokeStyle = 'rgba(60,35,15,0.4)';
      ctx.lineWidth = 1.5 / view.s;
      ctx.strokeRect(p.x + k * 5, p.y + k * 6, p.w, p.h);
    }
    plate.blit(ctx, 'paper', p);
    if (inkTo) {
      ctx.save();
      if (bloomPath(sheet, state.bloom, now) > 0) {
        ctx.clip();
        ctx.beginPath();
        ctx.rect(p.x, p.y, p.w, p.h);
        ctx.clip();
        plate.blit(ctx, 'ink', p);
      }
      ctx.restore();
    }
  }

  function drawPanels(sheet, now, plan, closing) {
    const p0 = firstPanel(sheet);
    const t = now - state.t0;
    // stack thickness under the first panel while most of the sheet is still folded
    // the walkers are drawn panel by panel, under anything still folding over them
    const walkers = (r) => {
      if (closing || t < 1.5) return;
      ctx.save();
      ctx.beginPath();
      ctx.rect(r.x, r.y, r.w, r.h);
      ctx.clip();
      if (bloomPath(sheet, state.bloom, now) > 0) { ctx.clip(); drawPeople(sheet, now); }
      ctx.restore();
    };
    plate.blit(ctx, 'paper', p0);
    drawInkIn(sheet, now, p0);
    walkers(p0);
    for (const { p, hinge, at } of plan) {
      let u = closing ? 1 - prog(t, at, at + UNFOLD) : prog(t, at, at + UNFOLD);
      if (u <= 0) continue;
      u = eInOut(u);
      const theta = Math.PI * (1 - u);
      const c = Math.cos(theta);
      ctx.save();
      // hinge transform
      if (hinge === 'L') { ctx.translate(p.x, 0); ctx.scale(c, 1); ctx.translate(-p.x, 0); }
      if (hinge === 'R') { ctx.translate(p.x + p.w, 0); ctx.scale(c, 1); ctx.translate(-(p.x + p.w), 0); }
      if (hinge === 'T') { ctx.translate(0, p.y); ctx.scale(1, c); ctx.translate(0, -p.y); }
      if (hinge === 'B') { ctx.translate(0, p.y + p.h); ctx.scale(1, c); ctx.translate(0, -(p.y + p.h)); }
      if (c < 0) {
        // the back of the panel: blank, a shade darker
        ctx.fillStyle = '#c3a878';
        ctx.fillRect(p.x, p.y, p.w, p.h);
      } else {
        plate.blit(ctx, 'paper', p);
        drawInkIn(sheet, now, p);
      }
      ctx.fillStyle = `rgba(30,15,5,${0.45 * (1 - Math.abs(c))})`;
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.restore();
      if (u >= 1) walkers(p);
    }
  }

  function drawInkIn(sheet, now, rect) {
    if (!state.bloom) { plate.blit(ctx, 'ink', rect); return; }
    ctx.save();
    if (bloomPath(sheet, state.bloom, now) > 0) {
      ctx.clip();
      plate.blit(ctx, 'ink', rect);
    }
    ctx.restore();
  }

  /** The fine branching lines that run ahead of the ink as it spreads. */
  function tendrils(sheet, now) {
    const b = state.bloom;
    if (!b || b.out) return;
    const r = bloomRadius(b, now, sheet);
    const k = prog(now, b.t0, b.t0 + b.dur);
    if (k >= 1) return;
    ctx.save();
    ctx.strokeStyle = INK;
    ctx.lineCap = 'round';
    for (let i = 0; i < 46; i++) {
      const a = (i / 46) * TAU + hash(i + b.seed) * 0.3;
      const len = r * (0.25 + hash(i * 3.1) * 0.35);
      const pts = [];
      for (let s = 0; s <= 14; s++) {
        const u = s / 14;
        const rr = r * 0.92 + u * len;
        const aa = a + Math.sin(u * 5 + i) * 0.08 * u;
        pts.push([b.x + Math.cos(aa) * rr, b.y + Math.sin(aa) * rr]);
      }
      ctx.globalAlpha = 0.5 * (1 - k);
      ctx.lineWidth = (1.6 - hash(i) * 0.8) / view.s;
      trace(ctx, pts, false);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawPeople(sheet, now) {
    const crowd = state.crowd;
    if (!crowd) return;
    const s = view.s;
    const footPx = clamp((sheet === HOG ? 9 : 7) * s, 3.5, 11);
    // footprints, in sheet space
    for (const w of crowd.list) {
      for (const p of w.prints) {
        const a = Math.pow(Math.max(0, 1 - p.age / (sheet === HOG ? 3.2 : 5)), 1.6) * 0.85;
        if (a > 0.02) printShape(ctx, p.x, p.y, p.a, footPx / s, a);
      }
      if (w.puff) {
        for (const pf of w.puff) {
          const k = pf.age / 1.6;
          ctx.save();
          ctx.strokeStyle = INK;
          ctx.globalAlpha = 0.8 * (1 - k);
          ctx.lineWidth = 1.4 / s;
          for (let i = 0; i < 8; i++) {
            const a = (i / 8) * TAU;
            const r0 = (6 + 30 * k) / s;
            const r1 = (12 + 44 * k) / s;
            ctx.beginPath();
            ctx.moveTo(pf.x + Math.cos(a) * r0, pf.y + Math.sin(a) * r0);
            ctx.lineTo(pf.x + Math.cos(a) * r1, pf.y + Math.sin(a) * r1);
            ctx.stroke();
          }
          ctx.restore();
          if (k < 0.7) {
            ctx.save();
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            const sx = (pf.x - view.cx) * s + vw / 2;
            const sy = (pf.y - view.cy) * s + vh / 2;
            ctx.globalAlpha = 1 - k / 0.7;
            label(ctx, 'crack!', sx, sy - 26, { size: 12, slant: 0.2 });
            ctx.restore();
          }
        }
      }
    }
    // the feet they are standing on, and their names
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const taken = [];
    const sorted = crowd.list.slice().sort((a, b) => (state.follow === a ? -1 : state.follow === b ? 1 : 0));
    const px = clamp(sheet === HOG ? 9 + 5 * s : 9 + 4 * s, 9, 13);
    for (const w of sorted) {
      if (w.vis <= 0.01) continue;
      const sx = (w.x - view.cx) * s + vw / 2;
      const sy = (w.y - view.cy) * s + vh / 2;
      if (sx < -120 || sy < -60 || sx > vw + 120 || sy > vh + 60) continue;
      ctx.globalAlpha = w.vis;
      for (const side of [-1, 1]) {
        const off = footPx * 0.4;
        printShape(ctx, sx + Math.cos(w.heading + Math.PI / 2) * off * side, sy + Math.sin(w.heading + Math.PI / 2) * off * side, w.heading, footPx, 0.95);
      }
      const sc = scroll(w.name, px, dpr);
      let bx = sx + 10;
      let by = sy - sc.h - 8;
      let ok = false;
      for (let tries = 0; tries < 4; tries++) {
        const box = [bx, by, sc.w, sc.h];
        if (!taken.some((t) => box[0] < t[0] + t[2] && box[0] + box[2] > t[0] && box[1] < t[1] + t[3] && box[1] + box[3] > t[1])) { ok = true; taken.push(box); break; }
        by -= sc.h * 0.9;
      }
      if (!ok && state.follow !== w) continue;
      ctx.strokeStyle = 'rgba(58,36,19,0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sx + 3, sy - 4);
      ctx.lineTo(bx + 8, by + sc.h * 0.75);
      ctx.stroke();
      ctx.drawImage(sc.c, bx, by, sc.w, sc.h);
      w.box = [bx, by, sc.w, sc.h];
      if (state.follow === w) {
        ctx.strokeStyle = 'rgba(140,30,20,0.8)';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(sx, sy, 16 + Math.sin(now * 3) * 2, 0, TAU);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  /** Things on the Hogwarts sheet that will not hold still. */
  function drawLiving(sheet, now) {
    if (sheet !== HOG) return;
    // the room that is only there when you need it
    const a = 0.5 + 0.5 * Math.sin(now * 0.8);
    ctx.save();
    ctx.globalAlpha = a * 0.9;
    ctx.strokeStyle = INK;
    ctx.setLineDash([6 / view.s, 6 / view.s]);
    ctx.lineWidth = 1.4 / view.s;
    ctx.strokeRect(1840, 520, 170, 54);
    ctx.restore();
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const sx = (1925 - view.cx) * view.s + vw / 2;
    const sy = (547 - view.cy) * view.s + vh / 2;
    ctx.globalAlpha = a;
    label(ctx, 'ROOM OF REQUIREMENT', sx, sy, { size: clamp(11 * view.s * 1.2, 5, 14) });
    ctx.globalAlpha = (1 - a) * 0.8;
    label(ctx, '(or is it?)', sx, sy + clamp(16 * view.s, 8, 18), { size: clamp(10 * view.s, 5, 12) });
    ctx.restore();
  }

  /** The map's opinion of anybody who says the wrong thing to it. */
  function drawRemark(now) {
    const r = state.remark;
    if (!r) return;
    const age = now - r.t0;
    if (age > 6) { state.remark = null; return; }
    const p = firstPanel(state.sheet);
    ctx.save();
    const fade = age > 4.8 ? 1 - (age - 4.8) / 1.2 : 1;
    ctx.globalAlpha = fade;
    writeOut(ctx, r.text, p.x + p.w / 2, p.y + p.h * 0.42, p.w * 0.058, clamp(age / 2.2), { maxW: p.w * 0.8, seed: r.seed });
    writeOut(ctx, '— ' + r.by, p.x + p.w * 0.62, p.y + p.h * 0.74, p.w * 0.045, clamp((age - 2.0) / 0.8), { seed: r.seed + 5 });
    ctx.restore();
  }

  let lastNow = 0;
  function frame(ms) {
    const now = ms / 1000;
    const dt = Math.min(0.05, now - (lastNow || now));
    lastNow = now;
    const sheet = state.sheet;
    drawDesk();

    // camera
    if (state.mode === 'closed') view = packetView(sheet);
    if (state.mode === 'opening') {
      const k = eInOut(prog(now - state.t0, 0.7, 3.4));
      const a = packetView(sheet);
      const b = sheetView(sheet);
      view = { cx: lerp(a.cx, b.cx, k), cy: lerp(a.cy, b.cy, k), s: a.s * Math.pow(b.s / a.s, k) };
    }
    if (state.mode === 'closing') {
      const k = eInOut(prog(now - state.t0, 1.4, 3.6));
      const a = state.from;
      const b = packetView(sheet);
      view = { cx: lerp(a.cx, b.cx, k), cy: lerp(a.cy, b.cy, k), s: a.s * Math.pow(b.s / a.s, k) };
    }
    if (state.mode === 'open' && state.follow) {
      view.cx = lerp(view.cx, state.follow.x, Math.min(1, dt * 3));
      view.cy = lerp(view.cy, state.follow.y, Math.min(1, dt * 3));
    }

    // the plate: redrawn when the view leaves it, but not while a gesture is
    // still going on — a few frames of a slightly soft plate are far better
    // than a stutter every time a finger moves
    const settling = now - lastGesture < 0.18;
    const animating = state.mode === 'opening' || state.mode === 'closing';
    if (!plate.covers(view, sheet, vw, vh) && (!settling || !plate.rect || plate.sheet !== sheet)) {
      if (animating) {
        const whole = sheetView(sheet);
        if (!plate.rect || plate.sheet !== sheet || plate.scale < whole.s * 0.98 || plate.scale > whole.s * 2.5) {
          plate.draw({ ...whole, s: Math.max(view.s, whole.s) }, sheet, vw, vh, dpr);
        }
      } else {
        plate.draw(view, sheet, vw, vh, dpr);
      }
    }

    if (state.crowd && state.mode !== 'closed') state.crowd.step(dt, now);

    toScreen(view);
    if (state.mode === 'closed') {
      drawPacket(sheet, now, false);
      drawRemark(now);
    } else if (state.mode === 'opening' || state.mode === 'closing') {
      const t = now - state.t0;
      if (state.mode === 'opening' && t < 0.9) {
        drawPacket(sheet, now, true);
      } else {
        drawPanels(sheet, now, state.plan, state.mode === 'closing');
      }
      tendrils(sheet, now);
      if (state.mode === 'opening' && t > 5.2) { state.mode = 'open'; state.bloom = null; showOpen(); }
      if (state.mode === 'closing' && t > 3.8) {
        state.mode = 'closed';
        state.bloom = null;
        state.crowd = null;
        if (state.next) {
          const n = state.next;
          state.next = null;
          state.sheet = n;
          plate.rect = null;
          setTimeout(() => open(null), 300);
        } else showClosed();
      }
    } else {
      // open
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, sheet.w, sheet.h);
      ctx.clip();
      plate.blit(ctx, 'paper');
      plate.blit(ctx, 'ink');
      drawLiving(sheet, now);
      drawPeople(sheet, now);
      ctx.restore();
    }

    // a warm light from somewhere above, and the dark round the edges
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const v = ctx.createRadialGradient(vw * 0.45, vh * 0.4, Math.min(vw, vh) * 0.3, vw * 0.5, vh * 0.5, Math.max(vw, vh) * 0.8);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(8,4,1,0.55)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, vw, vh);
    requestAnimationFrame(frame);
  }

  /* ── opening, closing, switching ──────────────────────────────────── */

  const REMARKS = [
    ['Mr Moony would like to point out that this is not how one opens a map.', 'Mr Moony'],
    ['Mr Prongs agrees, and suggests you try swearing properly.', 'Mr Prongs'],
    ['Mr Padfoot has seen better attempts from a garden gnome.', 'Mr Padfoot'],
    ['Mr Wormtail has nothing to add. Mr Wormtail rarely does.', 'Mr Wormtail'],
    ['This parchment is blank, and it intends to stay that way for you.', 'Mr Moony'],
  ];
  let remarkN = 0;

  function sworn(text) {
    const t = text.toLowerCase().replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ');
    return /swear/.test(t) && /(no good|mischief|up to)/.test(t);
  }

  function open(at) {
    const sheet = state.sheet;
    const p = firstPanel(sheet);
    state.bloom = { x: at ? at[0] : p.x + p.w / 2, y: at ? at[1] : p.y + p.h * 0.45, t0: performance.now() / 1000, dur: 4.6, seed: hash(performance.now()) * 10 };
    state.t0 = performance.now() / 1000;
    state.mode = 'opening';
    state.plan = unfoldPlan(sheet);
    state.remark = null;
    state.follow = null;
    state.crowd = sheet === HOG ? hogwartsCrowd(sheet) : worldCrowd(sheet);
    sfx.bloom();
    state.plan.forEach((o) => sfx.rustle(o.at));
    document.body.classList.remove('is-closing');
    document.body.classList.add('is-opening');
    ui.oath.blur();
  }

  function close(next) {
    if (state.mode !== 'open') return;
    state.from = { ...view };
    state.t0 = performance.now() / 1000;
    state.mode = 'closing';
    const plan = unfoldPlan(state.sheet);
    // fold up in the reverse order, after the ink has drained
    const last = plan.length ? plan[plan.length - 1].at : 0;
    state.plan = plan.map((o) => ({ ...o, at: 1.4 + (last - o.at) * 0.7 }));
    state.bloom = { x: view.cx, y: view.cy, t0: state.t0, dur: 1.5, seed: 3, out: true };
    state.follow = null;
    state.next = next || null;
    sfx.drain();
    state.plan.forEach((o) => sfx.rustle(o.at));
    document.body.classList.remove('is-open');
    document.body.classList.add('is-closing');
  }

  function showOpen() {
    document.body.classList.remove('is-opening');
    document.body.classList.add('is-open');
    renderList();
  }
  function showClosed() {
    document.body.classList.remove('is-open', 'is-opening', 'is-closing');
    ui.oath.value = '';
  }

  function tryOath() {
    const text = ui.oath.value.trim();
    if (state.mode !== 'closed') return;
    audio();
    if (sworn(text)) { open(null); return; }
    const [r, by] = REMARKS[remarkN++ % REMARKS.length];
    state.remark = { text: r, by, t0: performance.now() / 1000, seed: remarkN * 7 };
    sfx.quill(2.2);
  }

  ui.swear.addEventListener('click', tryOath);
  ui.oath.addEventListener('keydown', (e) => { if (e.key === 'Enter') tryOath(); });
  ui.close.addEventListener('click', () => close(null));
  for (const b of ui.tabs.querySelectorAll('button')) {
    b.addEventListener('click', () => {
      const want = b.dataset.sheet === 'world' ? WORLD : HOG;
      for (const o of ui.tabs.querySelectorAll('button')) o.classList.toggle('is-on', o === b);
      if (want === state.sheet) return;
      if (state.mode === 'open') close(want);
      else if (state.mode === 'closed') { state.sheet = want; plate.rect = null; }
    });
  }

  function renderList() {
    ui.list.innerHTML = '';
    for (const w of state.crowd ? state.crowd.list : []) {
      const li = document.createElement('li');
      const b = document.createElement('button');
      b.textContent = w.name;
      b.addEventListener('click', () => followWho(w));
      li.appendChild(b);
      ui.list.appendChild(li);
    }
  }
  function followWho(w) {
    state.follow = w;
    view.s = Math.max(view.s, state.sheet === HOG ? 1.1 : 0.9);
    ui.follow.textContent = w ? `following ${w.name} · drag to let go` : '';
  }

  /* ── pan and zoom ─────────────────────────────────────────────────── */

  let lastGesture = 0;
  const pointers = new Map();
  let pinch = null;
  canvas.addEventListener('pointerdown', (e) => {
    canvas.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY });
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), s: view.s };
    }
  });
  canvas.addEventListener('pointermove', (e) => {
    const p = pointers.get(e.pointerId);
    if (!p || state.mode !== 'open') { if (p) { p.x = e.clientX; p.y = e.clientY; } return; }
    if (pointers.size === 2 && pinch) {
      p.x = e.clientX;
      p.y = e.clientY;
      const [a, b] = [...pointers.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      view.s = clampScale(pinch.s * (d / pinch.d));
      lastGesture = performance.now() / 1000;
      return;
    }
    const dx = e.clientX - p.x;
    const dy = e.clientY - p.y;
    p.x = e.clientX;
    p.y = e.clientY;
    if (Math.hypot(e.clientX - p.x0, e.clientY - p.y0) > 4) {
      state.follow = null;
      ui.follow.textContent = '';
      view.cx -= dx / view.s;
      view.cy -= dy / view.s;
      clampView();
      lastGesture = performance.now() / 1000;
    }
  });
  canvas.addEventListener('pointerup', (e) => {
    const p = pointers.get(e.pointerId);
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinch = null;
    if (!p) return;
    const click = Math.hypot(e.clientX - p.x0, e.clientY - p.y0) < 5;
    if (!click) return;
    if (state.mode === 'closed') {
      // tapping the parchment with a wand counts as swearing, if the words are right
      if (ui.oath.value.trim()) tryOath(); else ui.oath.focus();
      return;
    }
    if (state.mode === 'open' && state.crowd) {
      const hit = state.crowd.list.find((w) => w.box && e.clientX >= w.box[0] && e.clientX <= w.box[0] + w.box[2] && e.clientY >= w.box[1] && e.clientY <= w.box[1] + w.box[3]);
      if (hit) followWho(hit);
    }
  });
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (state.mode !== 'open') return;
    const k = Math.exp(-e.deltaY * 0.0015);
    const before = [(e.clientX - vw / 2) / view.s + view.cx, (e.clientY - vh / 2) / view.s + view.cy];
    view.s = clampScale(view.s * k);
    if (!state.follow) {
      view.cx = before[0] - (e.clientX - vw / 2) / view.s;
      view.cy = before[1] - (e.clientY - vh / 2) / view.s;
    }
    clampView();
    lastGesture = performance.now() / 1000;
  }, { passive: false });
  canvas.addEventListener('dblclick', (e) => {
    if (state.mode !== 'open') return;
    const before = [(e.clientX - vw / 2) / view.s + view.cx, (e.clientY - vh / 2) / view.s + view.cy];
    view.s = clampScale(view.s * 1.8);
    view.cx = before[0] - (e.clientX - vw / 2) / view.s;
    view.cy = before[1] - (e.clientY - vh / 2) / view.s;
    clampView();
  });
  function clampScale(s) {
    const fitS = sheetView(state.sheet).s;
    return clamp(s, fitS * 0.9, fitS * 9);
  }
  function clampView() {
    const sh = state.sheet;
    view.cx = clamp(view.cx, 0, sh.w);
    view.cy = clamp(view.cy, 0, sh.h);
  }
  window.addEventListener('keydown', (e) => {
    if (e.target === ui.oath) return;
    if (e.key === 'Escape' && state.mode === 'open') close(null);
    if ((e.key === '+' || e.key === '=') && state.mode === 'open') view.s = clampScale(view.s * 1.25);
    if (e.key === '-' && state.mode === 'open') view.s = clampScale(view.s / 1.25);
  });

  const params = new URLSearchParams(location.search);
  if (params.get('sheet') === 'world') {
    state.sheet = WORLD;
    for (const o of ui.tabs.querySelectorAll('button')) o.classList.toggle('is-on', o.dataset.sheet === 'world');
  }
  window.MARAUDER = { HOG, WORLD, state, open, close, get view() { return view; }, set view(v) { view = v; }, plate };
  requestAnimationFrame(frame);
})();
