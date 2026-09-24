/*
 * WHERE IS EVERYBODY?
 * The Fermi Paradox, explained by a cat who may or may not be in this box.
 *
 * Plain JavaScript, no libraries, no image files, no audio files. Everything
 * you see is drawn on a 2D canvas and everything you hear is synthesised
 * sample by sample in this script.
 *
 * ── The one rule ────────────────────────────────────────────────────────
 *
 * Every frame is a pure function of its timestamp. `frame(ctx, t)` draws the
 * film at `t` seconds and depends on nothing else — no accumulated state, no
 * Math.random, no clock. That is what lets the same code play live in a
 * browser and render to a video file frame by frame without running in real
 * time, and it is why every "random" thing below is a hash of something.
 *
 * ── The look ────────────────────────────────────────────────────────────
 *
 * Collage: paper cut out with scissors (a white rim where the colour was cut,
 * a small hard shadow where it lifts off the sheet), torn strips held on with
 * washi tape, halftone and newsprint and gingham glued into shapes. Over the
 * paper, ink that boils — the outlines are redrawn eight times a second with
 * a fresh wobble, the way a hand-drawn line shivers when every frame is traced
 * again. Paper does not boil; ink does. And the cut-outs move on twelves,
 * like stop-motion, so the whole thing reads as made rather than rendered.
 *
 * ── The sound ───────────────────────────────────────────────────────────
 *
 * A music box, a plucked bass (Karplus–Strong), a soft pad, paper rustles,
 * star plinks, a ticking clock, radio static, a cat's chirp and three beeps
 * from very far away — rendered offline into one buffer, then played. The
 * superposition section plays its tune on two music boxes a few cents apart,
 * which is the nearest thing a soundtrack has to being two things at once.
 */
(function () {
  'use strict';

  /* ══════════════════════════════════════════════════════════════════════
     stage, numbers, noise
     ══════════════════════════════════════════════════════════════════════ */

  const W = 1920;
  const H = 1080;
  const DURATION = 58;
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
  const eBack = (t) => {
    const c1 = 1.8;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  };
  /** Cut-outs move on twelves, like stop-motion. */
  const stepT = (t) => Math.floor(t * 12) / 12;
  /** Ink boils on eights. */
  const boil = (t) => Math.floor(t * 8);

  /** A small deterministic generator, for the sound, which needs a stream. */
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

  const INK = '#2a211b';
  const CREAM = '#fbf3e1';
  const RIM = '#fffaf0';
  const KRAFT = '#c99a5f';
  const KRAFT_D = '#a87a45';
  const NAVY = '#1c2a4f';
  const NAVY_D = '#131c38';
  const CAT = '#ee9444';
  const CAT_D = '#c1612a';
  const CAT_L = '#fde5c6';
  const PINK = '#f2a1a4';
  const GOLD = '#f4c649';

  /* ══════════════════════════════════════════════════════════════════════
     geometry
     ══════════════════════════════════════════════════════════════════════ */

  function resample(pts, closed, step) {
    const src = closed ? pts.concat([pts[0]]) : pts;
    const out = [[src[0][0], src[0][1]]];
    let need = step;
    for (let i = 1; i < src.length; i++) {
      let x0 = src[i - 1][0];
      let y0 = src[i - 1][1];
      const x1 = src[i][0];
      const y1 = src[i][1];
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
    const last = src[src.length - 1];
    out.push([last[0], last[1]]);
    return out;
  }

  /** Chaikin, for softening the corners of a stroke that was stored sparse. */
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

  /** Push every sample sideways along its own normal by a slow wave. */
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
      const s = i * 0.37 + seed * 3.17;
      const w = (Math.sin(s) * 0.6 + Math.sin(s * 2.3 + seed) * 0.3 + Math.sin(s * 5.1 + seed * 1.7) * 0.1) * amp;
      out[i] = [pts[i][0] - dy * w, pts[i][1] + dx * w];
    }
    return out;
  }

  /**
   * A scissor cut: the outline walked in short straight runs, each nudged a
   * little. Seeded by the shape and not by time — paper, once cut, stays cut.
   */
  function scissor(pts, amp, seed, step = 16) {
    const r = resample(pts, true, step);
    return r.slice(0, -1).map((p, i) => [
      p[0] + (hash(seed * 7.1 + i * 1.37) - 0.5) * 2 * amp,
      p[1] + (hash(seed * 3.3 + i * 2.71) - 0.5) * 2 * amp,
    ]);
  }

  function trace(ctx, pts, closed) {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    if (closed) ctx.closePath();
  }

  function bbox(pts) {
    let x0 = Infinity; let y0 = Infinity; let x1 = -Infinity; let y1 = -Infinity;
    for (const [x, y] of pts) {
      if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y;
    }
    return [x0, y0, x1 - x0, y1 - y0];
  }

  function ellipse(cx, cy, rx, ry, n = 36, a0 = 0, a1 = TAU) {
    const out = [];
    const full = Math.abs(a1 - a0 - TAU) < 1e-6;
    const m = full ? n : n + 1;
    for (let i = 0; i < m; i++) {
      const a = a0 + ((a1 - a0) * i) / n;
      out.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
    }
    return out;
  }

  const rect = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];

  function roundRect(x, y, w, h, r) {
    const out = [];
    const c = [[x + w - r, y + r, -Math.PI / 2], [x + w - r, y + h - r, 0], [x + r, y + h - r, Math.PI / 2], [x + r, y + r, Math.PI]];
    for (const [cx, cy, a0] of c) {
      for (let i = 0; i <= 5; i++) {
        const a = a0 + (i / 5) * (Math.PI / 2);
        out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
      }
    }
    return out;
  }

  function star5(cx, cy, r, inner = 0.45, rot = -Math.PI / 2) {
    const out = [];
    for (let i = 0; i < 10; i++) {
      const rr = i % 2 ? r * inner : r;
      const a = rot + (i / 10) * TAU;
      out.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
    }
    return out;
  }

  /** A rectangle whose edges have been torn rather than cut. */
  function torn(x, y, w, h, seed, amp = 7, step = 11) {
    const out = [];
    const edge = (ax, ay, bx, by, k) => {
      const len = Math.hypot(bx - ax, by - ay);
      const n = Math.max(2, Math.round(len / step));
      const nx = (by - ay) / len;
      const ny = -(bx - ax) / len;
      for (let i = 0; i < n; i++) {
        const t = i / n;
        const j = (hash(seed * 11.3 + k * 97 + i * 1.91) - 0.5) * 2 * amp;
        out.push([ax + (bx - ax) * t + nx * j, ay + (by - ay) * t + ny * j]);
      }
    };
    edge(x, y, x + w, y, 1);
    edge(x + w, y, x + w, y + h, 2);
    edge(x + w, y + h, x, y + h, 3);
    edge(x, y + h, x, y, 4);
    return out;
  }

  /* ══════════════════════════════════════════════════════════════════════
     paper textures
     ══════════════════════════════════════════════════════════════════════ */

  const texCache = new WeakMap();

  function makeTex(size, draw) {
    const c = document.createElement('canvas');
    c.width = size[0];
    c.height = size[1];
    draw(c.getContext('2d'), size[0], size[1]);
    return c;
  }

  const TEX_SRC = {};
  function textures() {
    if (TEX_SRC.grain) return TEX_SRC;
    TEX_SRC.grain = makeTex([256, 256], (g, w, h) => {
      const img = g.createImageData(w, h);
      for (let i = 0; i < w * h; i++) {
        const v = hash(i * 0.731 + 5);
        const dark = v < 0.5;
        img.data[i * 4] = dark ? 60 : 255;
        img.data[i * 4 + 1] = dark ? 40 : 250;
        img.data[i * 4 + 2] = dark ? 20 : 235;
        img.data[i * 4 + 3] = Math.pow(Math.abs(v - 0.5) * 2, 3) * 120;
      }
      g.putImageData(img, 0, 0);
    });
    TEX_SRC.halftone = makeTex([18, 18], (g) => {
      g.fillStyle = 'rgba(0,0,0,1)';
      g.beginPath(); g.arc(4.5, 4.5, 3.1, 0, TAU); g.fill();
      g.beginPath(); g.arc(13.5, 13.5, 3.1, 0, TAU); g.fill();
    });
    TEX_SRC.stripes = makeTex([24, 24], (g) => {
      g.strokeStyle = 'rgba(0,0,0,1)';
      g.lineWidth = 5;
      for (let k = -24; k <= 48; k += 12) {
        g.beginPath(); g.moveTo(k, 0); g.lineTo(k + 24, 24); g.stroke();
      }
    });
    TEX_SRC.corrugate = makeTex([16, 16], (g) => {
      g.fillStyle = 'rgba(80,45,10,1)';
      g.fillRect(0, 0, 3, 16);
      g.fillStyle = 'rgba(255,230,190,1)';
      g.fillRect(8, 0, 2, 16);
    });
    TEX_SRC.news = makeTex([320, 240], (g, w, h) => {
      g.fillStyle = '#efe9dc';
      g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(40,36,32,0.55)';
      let k = 1;
      for (let y = 10; y < h; y += 11) {
        let x = 8;
        while (x < w - 10) {
          const len = 8 + hash(k++ * 3.3) * 34;
          g.fillRect(x, y, Math.min(len, w - 10 - x), 4);
          x += len + 5;
        }
      }
    });
    TEX_SRC.gingham = makeTex([44, 44], (g) => {
      g.fillStyle = '#fdf6ea';
      g.fillRect(0, 0, 44, 44);
      g.fillStyle = 'rgba(206,52,52,0.45)';
      g.fillRect(0, 0, 22, 44);
      g.fillRect(0, 0, 44, 22);
      g.fillStyle = 'rgba(206,52,52,0.35)';
      g.fillRect(0, 0, 22, 22);
    });
    TEX_SRC.grid = makeTex([36, 36], (g) => {
      g.strokeStyle = 'rgba(70,120,190,0.5)';
      g.lineWidth = 1.2;
      g.strokeRect(0.5, 0.5, 36, 36);
    });
    TEX_SRC.dots = makeTex([30, 30], (g) => {
      g.fillStyle = 'rgba(255,255,255,1)';
      g.beginPath(); g.arc(7, 7, 2.4, 0, TAU); g.fill();
      g.beginPath(); g.arc(22, 21, 1.6, 0, TAU); g.fill();
    });
    TEX_SRC.gouache = makeTex([300, 300], (g, w, h) => {
      for (let i = 0; i < 260; i++) {
        const x = hash(i * 2.1) * w;
        const y = hash(i * 3.7 + 1) * h;
        const r = 10 + hash(i * 5.3) * 46;
        const gr = g.createRadialGradient(x, y, 0, x, y, r);
        const light = hash(i * 9.1) > 0.5;
        gr.addColorStop(0, light ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.12)');
        gr.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = gr;
        for (const ox of [-w, 0, w]) for (const oy of [-h, 0, h]) g.fillRect(x - r + ox, y - r + oy, r * 2, r * 2);
      }
    });
    return TEX_SRC;
  }

  /** Patterns belong to a context, so they are made once per canvas. */
  function tex(ctx, name) {
    let m = texCache.get(ctx);
    if (!m) { m = {}; texCache.set(ctx, m); }
    if (!m[name]) m[name] = ctx.createPattern(textures()[name], 'repeat');
    return m[name];
  }

  /* ══════════════════════════════════════════════════════════════════════
     ink and paper
     ══════════════════════════════════════════════════════════════════════ */

  /** An ink line. It boils: every eighth of a second it is traced afresh. */
  function ink(ctx, pts, o) {
    o = o || {};
    const closed = !!o.closed;
    const w = o.w == null ? 4 : o.w;
    const amp = o.amp == null ? 1.4 : o.amp;
    const passes = o.passes == null ? 2 : o.passes;
    const seed = (o.seed || 1) + boil(o.t || 0) * 0.771;
    const base = resample(pts, closed, o.step || 10);
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = o.color || INK;
    const a = o.alpha == null ? 1 : o.alpha;
    // Whatever alpha the caller is already drawing at — a caption fading, a
    // ghost cat — has to survive into the line, so it is read once and
    // multiplied, never overwritten.
    const outer = ctx.globalAlpha;
    for (let p = 0; p < passes; p++) {
      const q = wobble(base, amp * (p ? 1.35 : 1), seed + p * 9.1);
      ctx.globalAlpha = outer * (p ? 0.42 : 1) * a;
      ctx.lineWidth = w * (p ? 0.65 : 1);
      trace(ctx, q, false);
      ctx.stroke();
    }
    ctx.restore();
  }

  /**
   * A piece of cut paper.
   *
   * Shadow first (it has lifted off the sheet), then a white rim (where the
   * colour was cut through to the paper underneath), then the colour, then a
   * texture glued inside it, then — for the drawn things — an ink outline.
   */
  function cutout(ctx, pts, o) {
    const seed = o.seed || 1;
    const shape = o.raw ? pts : scissor(pts, o.cut == null ? 1.3 : o.cut, seed);
    ctx.save();
    if (o.alpha != null) ctx.globalAlpha *= o.alpha;
    if (o.shadow !== false) {
      ctx.save();
      ctx.translate(o.sx == null ? 5 : o.sx, o.sy == null ? 7 : o.sy);
      ctx.fillStyle = 'rgba(28,16,6,0.24)';
      trace(ctx, shape, true);
      ctx.fill();
      ctx.restore();
    }
    const rim = o.rim == null ? 5 : o.rim;
    if (rim) {
      ctx.lineJoin = 'round';
      ctx.lineWidth = rim * 2;
      ctx.strokeStyle = o.rimColor || RIM;
      trace(ctx, shape, true);
      ctx.stroke();
    }
    ctx.fillStyle = o.fill || '#eee';
    trace(ctx, shape, true);
    ctx.fill();
    if (o.tex) {
      ctx.save();
      trace(ctx, shape, true);
      ctx.clip();
      ctx.globalAlpha *= o.texAlpha == null ? 0.3 : o.texAlpha;
      ctx.fillStyle = tex(ctx, o.tex);
      const b = bbox(shape);
      ctx.fillRect(b[0] - 2, b[1] - 2, b[2] + 4, b[3] + 4);
      ctx.restore();
    }
    if (o.ink) ink(ctx, shape, { closed: true, w: o.inkW || 3.4, color: o.ink, seed, t: o.t, amp: o.amp == null ? 1.1 : o.amp, passes: 1 });
    ctx.restore();
    return shape;
  }

  /** A full sheet of paper, a little larger than the frame, torn at the edges. */
  function sheet(ctx, o) {
    const pts = torn(-50, -50, W + 100, H + 100, o.seed || 1, 12, 14);
    ctx.save();
    ctx.fillStyle = 'rgba(10,6,2,0.4)';
    ctx.translate(0, 16);
    trace(ctx, pts, true);
    ctx.fill();
    ctx.translate(0, -16);
    ctx.fillStyle = o.color;
    trace(ctx, pts, true);
    ctx.fill();
    ctx.save();
    trace(ctx, pts, true);
    ctx.clip();
    if (o.tex) {
      /*
        Twice, at two scales and an angle. Laid once, a three-hundred-pixel
        tile of blotches repeats as a grid you can count, and a sheet of
        painted paper that repeats is wallpaper.
      */
      const a = o.texAlpha == null ? 0.5 : o.texAlpha;
      ctx.globalAlpha = a * 0.6;
      ctx.fillStyle = tex(ctx, o.tex);
      ctx.fillRect(-60, -60, W + 120, H + 120);
      ctx.save();
      ctx.globalAlpha = a * 0.55;
      ctx.translate(W / 2, H / 2);
      ctx.rotate(0.61);
      ctx.scale(1.73, 1.73);
      ctx.translate(-W / 2 + 97, -H / 2 + 41);
      ctx.fillRect(-W, -H, W * 3, H * 3);
      ctx.restore();
    }
    ctx.restore();
    ctx.restore();
  }

  /* ══════════════════════════════════════════════════════════════════════
     the hand
     A handwriting stored as the strokes a hand makes, in the order it makes
     them. The same letterforms the rest of the Back Bench is lettered in.
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

  function wrap(text, size, maxW, tracking) {
    const out = [];
    for (const para of text.split('\n')) {
      const words = para.split(' ');
      let line = '';
      for (const word of words) {
        const next = line ? line + ' ' + word : word;
        if (line && measure(next, tracking) * size > maxW) {
          out.push(line);
          line = word;
        } else line = next;
      }
      out.push(line);
    }
    return out;
  }

  const layoutCache = new Map();

  /**
   * Lay a block of text out as strokes, centred on (x, y).
   * Cached, because the shapes do not change — only the boil does.
   */
  function layout(text, x, y, o) {
    const key = [text, x | 0, y | 0, o.size, o.maxW, o.align, o.seed, o.lead].join('|');
    const hit = layoutCache.get(key);
    if (hit) return hit;
    if (layoutCache.size > 600) layoutCache.clear();

    const size = o.size;
    const tracking = 0.035;
    const lead = o.lead || 1.22;
    const lines = wrap(text, size, o.maxW || 1e9, tracking);
    const blockH = lines.length * size * lead;
    const strokes = [];
    let total = 0;
    let widest = 0;
    lines.forEach((line, li) => {
      const lw = measure(line, tracking) * size;
      widest = Math.max(widest, lw);
      let pen = o.align === 'left' ? x : o.align === 'right' ? x - lw : x - lw / 2;
      const top = y - blockH / 2 + li * size * lead + size * (lead - 1) * 0.5;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        const g = glyph(ch);
        const s = (o.seed || 1) * 131 + li * 71 + i * 17;
        const dy = (Math.sin(s * 0.7) + Math.sin(s * 1.9) * 0.5) * 0.014 * size;
        const sl = 0.09 + Math.sin(s * 3.1) * 0.02;
        for (const st of g.s) {
          let pts = st.map(([ux, uy]) => [pen + ux * size + (0.78 - uy) * size * sl, top + uy * size + dy]);
          if (pts.length > 2) pts = chaikin(pts, 2);
          const r = resample(pts, false, Math.max(2, size * 0.06));
          let len = 0;
          for (let k = 1; k < r.length; k++) len += Math.hypot(r[k][0] - r[k - 1][0], r[k][1] - r[k - 1][1]);
          strokes.push({ pts: r, len: Math.max(len, 0.5), seed: s });
          total += Math.max(len, 0.5);
        }
        pen += (g.w + tracking) * size;
      }
    });
    const out = { strokes, total, lines, w: widest, h: blockH };
    layoutCache.set(key, out);
    return out;
  }

  /**
   * Write text in ink. `reveal` from 0 to 1 draws it on in stroke order, so it
   * arrives the way handwriting arrives, a letter at a time.
   */
  function write(ctx, text, x, y, o) {
    const L = layout(text, x, y, o);
    const reveal = o.reveal == null ? 1 : o.reveal;
    let budget = L.total * reveal;
    const t = o.t || 0;
    const b = boil(t);
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = o.color || INK;
    ctx.lineWidth = o.w || Math.max(2.2, o.size * 0.075);
    if (o.alpha != null) ctx.globalAlpha *= o.alpha;
    for (const st of L.strokes) {
      if (budget <= 0) break;
      let pts = st.pts;
      if (budget < st.len) {
        let acc = 0;
        const cut = [pts[0]];
        for (let k = 1; k < pts.length; k++) {
          const d = Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]);
          if (acc + d > budget) {
            const f = (budget - acc) / d;
            cut.push([lerp(pts[k - 1][0], pts[k][0], f), lerp(pts[k - 1][1], pts[k][1], f)]);
            break;
          }
          acc += d;
          cut.push(pts[k]);
        }
        pts = cut;
      }
      budget -= st.len;
      if (pts.length < 2) continue;
      const q = wobble(pts, o.size * 0.012, st.seed + b * 0.53);
      trace(ctx, q, false);
      ctx.stroke();
    }
    ctx.restore();
    return L;
  }

  /* ══════════════════════════════════════════════════════════════════════
     captions: torn strips, taped down, written on
     ══════════════════════════════════════════════════════════════════════ */

  function tape(ctx, x, y, rot, seed, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    const w = 118;
    const h = 36;
    const pts = [];
    for (let i = 0; i <= 6; i++) pts.push([-w / 2 + (i % 2 ? 4 : 0), -h / 2 + (i / 6) * h]);
    for (let i = 6; i >= 0; i--) pts.push([w / 2 - (i % 2 ? 4 : 0), -h / 2 + (i / 6) * h]);
    ctx.fillStyle = color || 'rgba(244,160,176,0.62)';
    trace(ctx, pts, true);
    ctx.fill();
    ctx.save();
    trace(ctx, pts, true);
    ctx.clip();
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = tex(ctx, 'stripes');
    ctx.fillRect(-w, -h, w * 2, h * 2);
    ctx.restore();
    ctx.restore();
    void seed;
  }

  const TAPES = ['rgba(244,160,176,0.62)', 'rgba(150,205,190,0.62)', 'rgba(250,214,110,0.66)', 'rgba(170,185,240,0.62)'];

  /**
   * A caption: a torn strip of paper pops onto the page, a piece of tape holds
   * it down, and the words are written onto it.
   */
  function caption(ctx, t, text, x, y, o) {
    const at = o.at;
    if (t < at) return;
    if (o.out != null && t > o.out + 0.35) return;
    const size = o.size || 44;
    const maxW = o.maxW || 900;
    const seed = o.seed || Math.round(x * 3 + y * 7);
    const L = layout(text, 0, 0, { size, maxW, align: o.align || 'center', seed, lead: 1.24 });
    const padX = size * 0.62;
    const padY = size * 0.42;
    const w = L.w + padX * 2;
    const h = L.h + padY * 2;
    const st = stepT(t);
    const pop = eBack(prog(st, at, at + 0.28));
    const gone = o.out != null ? prog(st, o.out, o.out + 0.3) : 0;
    const rot = ((o.rot == null ? (hash(seed) - 0.5) * 4 : o.rot) * Math.PI) / 180;
    ctx.save();
    ctx.translate(x, y + gone * 30);
    ctx.rotate(rot);
    ctx.scale(0.86 + 0.14 * pop, 0.86 + 0.14 * pop);
    ctx.globalAlpha *= clamp(pop * 1.4) * (1 - gone);
    const pts = torn(-w / 2, -h / 2, w, h, seed, 4.5, 10);
    ctx.save();
    ctx.translate(4, 7);
    ctx.fillStyle = 'rgba(20,12,4,0.28)';
    trace(ctx, pts, true);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = o.paper || CREAM;
    trace(ctx, pts, true);
    ctx.fill();
    ctx.save();
    trace(ctx, pts, true);
    ctx.clip();
    ctx.globalAlpha *= 0.55;
    ctx.fillStyle = tex(ctx, 'grain');
    ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.restore();
    // Fast enough to finish while the strip is still on screen. At a
    // thirtieth of a second a letter the longer captions were still being
    // written when the scene cut away from them.
    const writeDur = o.dur || clamp(text.length * 0.02, 0.45, 1.5);
    write(ctx, text, 0, 0, {
      size, maxW, align: o.align || 'center', seed, lead: 1.24, t,
      reveal: prog(t, at + 0.15, at + 0.15 + writeDur), color: o.color || INK,
    });
    if (o.tape !== false) {
      const side = hash(seed * 2.1) > 0.5 ? 1 : -1;
      tape(ctx, side * (w / 2 - 30), -h / 2 + 4, side * 0.5 + (hash(seed) - 0.5) * 0.3, seed, TAPES[seed % 4 | 0] || TAPES[0]);
    }
    ctx.restore();
  }

  /* ══════════════════════════════════════════════════════════════════════
     the cat
     ══════════════════════════════════════════════════════════════════════ */

  /**
   * An orange tabby, in cut paper, with drawn whiskers.
   *
   * Poses: `peek` (ears, face and two paws hooked over whatever it is hiding
   * behind), `sit`, and `lie`. `look` points the pupils; `blink` closes the
   * eyes; `ears` twitches them; `halo` is for the half of the superposition
   * that did not make it.
   */
  function drawCat(ctx, t, o) {
    const pose = o.pose || 'sit';
    const look = o.look || [0, 0];
    const blink = o.blink || 0;
    const seed = o.seed || 7;
    const ear = o.ears || 0;
    ctx.save();
    if (o.alpha != null) ctx.globalAlpha *= o.alpha;
    const cut = { rim: 4, ink: INK, inkW: 3.2, t, amp: 1.0 };

    if (pose === 'sit') {
      // tail, behind everything
      const sw = Math.sin((o.tail == null ? t : o.tail) * 2.2) * 18;
      const cl = [];
      for (let i = 0; i <= 10; i++) {
        const u = i / 10;
        cl.push([70 + u * 90 + Math.sin(u * 3) * 10, 150 - u * 120 - sw * u * u]);
      }
      const left = [];
      const right = [];
      for (let i = 0; i < cl.length; i++) {
        const a = cl[Math.max(0, i - 1)];
        const b = cl[Math.min(cl.length - 1, i + 1)];
        const dx = b[0] - a[0];
        const dy = b[1] - a[1];
        const l = Math.hypot(dx, dy) || 1;
        const wdt = lerp(20, 11, i / 10);
        left.push([cl[i][0] - (dy / l) * wdt, cl[i][1] + (dx / l) * wdt]);
        right.push([cl[i][0] + (dy / l) * wdt, cl[i][1] - (dx / l) * wdt]);
      }
      cutout(ctx, left.concat(right.reverse()), { ...cut, fill: CAT, seed: seed + 1 });
      // body
      const body = [];
      for (let i = 0; i <= 24; i++) {
        const a = Math.PI + (i / 24) * Math.PI;
        body.push([Math.cos(a) * 64, 34 + Math.sin(a) * 30]);
      }
      body.push([92, 110], [96, 168], [-96, 168], [-92, 110]);
      cutout(ctx, body, { ...cut, fill: CAT, tex: 'stripes', texAlpha: 0.08, seed: seed + 2 });
      cutout(ctx, ellipse(0, 112, 42, 52, 26), { ...cut, fill: CAT_L, rim: 0, ink: null, shadow: false, seed: seed + 3 });
      for (const k of [-1, 1]) {
        ink(ctx, [[k * 70, 80], [k * 86, 92]], { w: 5, color: CAT_D, t, seed: seed + 20 + k, passes: 1 });
        ink(ctx, [[k * 74, 104], [k * 90, 116]], { w: 5, color: CAT_D, t, seed: seed + 23 + k, passes: 1 });
      }
      for (const k of [-1, 1]) cutout(ctx, ellipse(k * 34, 166, 26, 15, 18), { ...cut, fill: CAT_L, seed: seed + 5 + k });
    }

    if (pose === 'lie') {
      const cl = [];
      for (let i = 0; i <= 8; i++) {
        const u = i / 8;
        cl.push([190 + u * 70, 120 - Math.sin(u * 2.2) * 30]);
      }
      ink(ctx, cl, { w: 26, color: CAT, t, seed: seed + 1, passes: 1, amp: 0.6 });
      const body = ellipse(95, 105, 120, 52, 30);
      cutout(ctx, body, { ...cut, fill: CAT, tex: 'stripes', texAlpha: 0.08, seed: seed + 2 });
      cutout(ctx, ellipse(-20, 140, 36, 16, 18), { ...cut, fill: CAT_L, seed: seed + 6 });
      cutout(ctx, ellipse(40, 145, 36, 16, 18), { ...cut, fill: CAT_L, seed: seed + 7 });
    }

    // ── the head (all poses)
    ctx.save();
    if (pose === 'lie') { ctx.translate(-10, 70); ctx.rotate(-0.12); }
    for (const k of [-1, 1]) {
      ctx.save();
      ctx.translate(k * 44, -40);
      ctx.rotate(k * (ear * 0.35));
      const e = [[k * -22, 10], [k * -6, -64], [k * 30, -8]].map(([x, y]) => [x, y]);
      cutout(ctx, e, { ...cut, fill: CAT, seed: seed + 30 + k });
      cutout(ctx, [[k * -10, 2], [k * -4, -44], [k * 16, -8]], { rim: 0, ink: null, shadow: false, fill: PINK, seed: seed + 33 + k, cut: 0.6 });
      ctx.restore();
    }
    const head = [];
    for (let i = 0; i < 40; i++) {
      const a = (i / 40) * TAU;
      const rx = 82 + 10 * Math.pow(Math.max(0, Math.sin(a)), 2);
      head.push([Math.cos(a) * rx, Math.sin(a) * 66]);
    }
    cutout(ctx, head, { ...cut, fill: CAT, seed: seed + 40 });
    for (let i = -1; i <= 1; i++) {
      ink(ctx, [[i * 16, -64], [i * 13, -44]], { w: 6, color: CAT_D, t, seed: seed + 41 + i, passes: 1 });
    }
    cutout(ctx, ellipse(0, 30, 38, 25, 22), { rim: 0, ink: null, shadow: false, fill: CAT_L, seed: seed + 44 });

    // eyes
    for (const k of [-1, 1]) {
      const ex = k * 32;
      const ey = -6;
      if (o.asleep || blink > 0.8) {
        ink(ctx, ellipse(ex, ey - 4, 15, 9, 10, 0.15 * Math.PI, 0.85 * Math.PI), { w: 4.2, t, seed: seed + 50 + k, passes: 1 });
      } else {
        const ry = 21 * (1 - blink);
        cutout(ctx, ellipse(ex, ey, 18, Math.max(3, ry), 20), { rim: 0, shadow: false, fill: '#fffdf6', ink: INK, inkW: 3, t, seed: seed + 52 + k, cut: 0.4 });
        const px = ex + look[0] * 6;
        const py = ey + look[1] * 7;
        ctx.save();
        ctx.fillStyle = INK;
        ctx.beginPath();
        ctx.ellipse(px, py, 9, Math.max(2, 14 * (1 - blink)), 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(px + 3.5, py - 5 * (1 - blink), 3.2, 0, TAU);
        ctx.fill();
        ctx.restore();
      }
    }
    // nose, mouth, whiskers
    cutout(ctx, [[-9, 14], [9, 14], [0, 24]], { rim: 0, shadow: false, fill: PINK, ink: INK, inkW: 2.4, t, seed: seed + 60, cut: 0.4 });
    ink(ctx, [[-16, 34], [-8, 40], [0, 33], [8, 40], [16, 34]], { w: 3.2, t, seed: seed + 61, passes: 1, step: 5 });
    for (const k of [-1, 1]) {
      for (let j = 0; j < 3; j++) {
        ink(ctx, [[k * 36, 26 + j * 7], [k * (100 + j * 4), 16 + j * 14]], { w: 2.2, t, seed: seed + 70 + j + k * 5, passes: 1, amp: 1.4 });
      }
    }
    if (o.halo) {
      // Inside the head's own transform, so it sits over this cat's head and
      // not — as it did in the first cut — over the living one beside it.
      ctx.save();
      ctx.shadowColor = 'rgba(255,220,120,0.9)';
      ctx.shadowBlur = 18;
      ink(ctx, ellipse(0, -118, 52, 13, 30), { closed: true, w: 7, color: GOLD, t, seed: seed + 90, passes: 1, amp: 0.8 });
      ctx.restore();
    }
    ctx.restore();

    if (pose === 'peek' && o.paws !== false) {
      for (const k of [-1, 1]) cutout(ctx, ellipse(k * 52, 70, 27, 17, 18), { ...cut, fill: CAT_L, seed: seed + 80 + k });
      for (const k of [-1, 1]) {
        for (const j of [-8, 0, 8]) ink(ctx, [[k * 52 + j, 62], [k * 52 + j, 74]], { w: 2.2, t, seed: seed + 85 + j, passes: 1, amp: 0.4 });
      }
    }

    ctx.restore();
  }

  /** Two front paws hooked over whatever the cat is hiding behind. */
  function paws(ctx, t, seed, y) {
    for (const k of [-1, 1]) {
      cutout(ctx, ellipse(k * 50, y, 27, 16, 18), { fill: CAT_L, rim: 4, ink: INK, inkW: 3.2, t, seed: seed + 80 + k });
      for (const j of [-8, 0, 8]) ink(ctx, [[k * 50 + j, y - 8], [k * 50 + j, y + 4]], { w: 2.2, t, seed: seed + 85 + j + k, passes: 1, amp: 0.4 });
    }
  }

  /* ══════════════════════════════════════════════════════════════════════
     the box
     ══════════════════════════════════════════════════════════════════════ */

  /**
   * A cardboard box, seen from a little above. `open` runs 0 (taped shut) to
   * 1 (flaps flung wide). `inside` is drawn between the back wall and the
   * front face, which is where a cat goes; `over` after the front, which is
   * where paws hooked over the rim go.
   */
  function drawBox(ctx, t, o, inside, over) {
    const open = o.open || 0;
    const seed = o.seed || 3;
    const cut = { ink: INK, inkW: 3.4, t, rim: 5 };
    const front = rect(-150, -100, 300, 210);
    const topFace = [[-150, -100], [150, -100], [126, -144], [-126, -144]];

    if (open > 0.12) {
      // back flap, standing up behind
      cutout(ctx, [[-126, -144], [126, -144], [118, -144 - 96 * open], [-118, -144 - 96 * open]], { ...cut, fill: KRAFT_D, tex: 'corrugate', texAlpha: 0.12, seed: seed + 1 });
      // the dark inside
      cutout(ctx, topFace, { ...cut, fill: '#5c3a1c', rim: 3, seed: seed + 2, shadow: false });
      cutout(ctx, [[-126, -144], [126, -144], [140, -112], [-140, -112]], { fill: '#7a5028', rim: 0, shadow: false, ink: null, seed: seed + 3 });
    }
    if (inside) inside();

    ctx.save();
    if (o.xray != null) ctx.globalAlpha *= o.xray;
    cutout(ctx, front, { ...cut, fill: KRAFT, tex: 'corrugate', texAlpha: 0.1, seed: seed + 4 });
    // a printed "this way up" and a fragile glass, because it is a real box
    ctx.save();
    ctx.globalAlpha *= 0.55;
    ink(ctx, [[-110, 60], [-110, 20], [-122, 32]], { w: 3, color: '#6b3f1c', t, seed: seed + 5, passes: 1 });
    ink(ctx, [[-110, 20], [-98, 32]], { w: 3, color: '#6b3f1c', t, seed: seed + 6, passes: 1 });
    ink(ctx, [[-86, 60], [-86, 20], [-98, 32]], { w: 3, color: '#6b3f1c', t, seed: seed + 7, passes: 1 });
    ink(ctx, [[-86, 20], [-74, 32]], { w: 3, color: '#6b3f1c', t, seed: seed + 8, passes: 1 });
    write(ctx, o.label || 'THIS WAY UP', 44, 76, { size: 22, color: '#6b3f1c', t, seed: seed + 9 });
    ctx.restore();
    if (open <= 0.12) {
      cutout(ctx, topFace, { ...cut, fill: '#d8ad72', tex: 'corrugate', texAlpha: 0.08, seed: seed + 10 });
      ink(ctx, [[0, -100], [0, -144]], { w: 3, t, seed: seed + 11, passes: 1 });
      cutout(ctx, [[-22, -100], [22, -100], [20, -144], [-20, -144]], { fill: 'rgba(214,190,150,0.8)', rim: 0, shadow: false, seed: seed + 12, cut: 0.6 });
    }
    ctx.restore();

    if (open > 0.12) {
      // side flaps and the front flap, hanging open
      cutout(ctx, [[-150, -100], [-126, -144], [-126 - 92 * open, -150 - 36 * open], [-150 - 104 * open, -104 - 22 * open]], { ...cut, fill: '#d8ad72', tex: 'corrugate', texAlpha: 0.1, seed: seed + 13 });
      cutout(ctx, [[150, -100], [126, -144], [126 + 92 * open, -150 - 36 * open], [150 + 104 * open, -104 - 22 * open]], { ...cut, fill: '#d8ad72', tex: 'corrugate', texAlpha: 0.1, seed: seed + 14 });
      cutout(ctx, [[-150, -100], [150, -100], [146, -100 + 64 * open], [-146, -100 + 64 * open]], { ...cut, fill: '#dcb57e', tex: 'corrugate', texAlpha: 0.1, seed: seed + 15 });
    }
    if (over) over();
  }

  /* ══════════════════════════════════════════════════════════════════════
     the galaxy
     ══════════════════════════════════════════════════════════════════════ */

  /**
   * A two-armed spiral, a bulge and a scatter of field stars, in the plane of
   * the galaxy. Projected at draw time: tilted, flattened, placed.
   */
  const STARS = (() => {
    const out = [];
    let k = 1;
    const r = () => hash(k++ * 1.618);
    for (let i = 0; i < 260; i++) {
      const a = r() * TAU;
      const d = Math.pow(r(), 0.8) * 110;
      out.push([Math.cos(a) * d, Math.sin(a) * d]);
    }
    for (let arm = 0; arm < 2; arm++) {
      for (let i = 0; i < 420; i++) {
        const u = i / 420;
        const d = 70 + u * 400;
        const th = arm * Math.PI + u * 3.9;
        const sc = (r() - 0.5) * (22 + u * 70);
        const sa = (r() - 0.5) * 0.25;
        out.push([Math.cos(th + sa) * (d + sc), Math.sin(th + sa) * (d + sc)]);
      }
    }
    for (let i = 0; i < 170; i++) {
      const a = r() * TAU;
      const d = 120 + r() * 380;
      out.push([Math.cos(a) * d, Math.sin(a) * d]);
    }
    const stars = out.map(([gx, gy], i) => {
      const v = hash(i * 7.77 + 3);
      const size = v > 0.975 ? 3 : v > 0.8 ? 2 : 1;
      const col = ['#fff4d6', '#ffe08a', '#cfe3ff', '#ffc7a0'][Math.floor(hash(i * 3.1) * 4)];
      return { gx, gy, d: Math.hypot(gx, gy), size, col, i };
    });
    const order = stars.slice().sort((a, b) => a.d - b.d);
    order.forEach((s, rank) => {
      s.pop = 11.45 + (rank / order.length) * 3.9 + (hash(s.i * 5.1) - 0.5) * 0.25;
    });
    return stars;
  })();

  const GAL = { cx: 960, cy: 560, scale: 1.12, tilt: (-14 * Math.PI) / 180, flat: 0.56 };

  function project(s, g) {
    const c = Math.cos(g.tilt);
    const sn = Math.sin(g.tilt);
    const x = s.gx * c - s.gy * sn;
    const y = (s.gx * sn + s.gy * c) * g.flat;
    return [g.cx + x * g.scale, g.cy + y * g.scale];
  }

  /** The one star the curious species starts from, out on an arm. */
  const ORIGIN = (() => {
    let best = STARS[0];
    let bd = Infinity;
    for (const s of STARS) {
      const d = Math.hypot(s.gx - 330, s.gy - 120);
      if (s.size >= 2 && d < bd) { bd = d; best = s; }
    }
    return best;
  })();
  const FAR = Math.max(...STARS.map((s) => Math.hypot(s.gx - ORIGIN.gx, s.gy - ORIGIN.gy)));
  const SPREAD = [19.9, 23.4];

  function drawGalaxy(ctx, t, g, o) {
    const alpha = o.alpha == null ? 1 : o.alpha;
    ctx.save();
    ctx.globalAlpha *= alpha;
    // glow
    ctx.save();
    ctx.translate(g.cx, g.cy);
    ctx.rotate(g.tilt);
    ctx.scale(1, g.flat);
    const grd = ctx.createRadialGradient(0, 0, 0, 0, 0, 470 * g.scale);
    grd.addColorStop(0, 'rgba(255,226,170,0.55)');
    grd.addColorStop(0.18, 'rgba(255,200,150,0.22)');
    grd.addColorStop(0.6, 'rgba(160,170,255,0.07)');
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(0, 0, 470 * g.scale, 0, TAU);
    ctx.fill();
    ctx.restore();

    const R = o.spread ? FAR * prog(t, SPREAD[0], SPREAD[1]) : -1;
    for (const s of STARS) {
      const p = o.all ? 1 : eBack(prog(t, s.pop, s.pop + 0.3));
      if (p <= 0) continue;
      const [x, y] = project(s, g);
      const tw = 0.75 + 0.25 * Math.sin(t * (1.5 + hash(s.i) * 3) + s.i);
      const sz = (s.size === 3 ? 11 : s.size === 2 ? 3.4 : 1.7) * g.scale * p;
      ctx.globalAlpha = alpha * (s.size === 1 ? 0.8 * tw : 1);
      if (s.size === 3) {
        cutout(ctx, star5(x, y, sz, 0.46, -Math.PI / 2 + s.i), { fill: s.col, rim: 3, ink: null, seed: s.i + 900, sx: 3, sy: 4, cut: 0.6 });
      } else {
        ctx.fillStyle = s.col;
        ctx.beginPath();
        ctx.arc(x, y, sz, 0, TAU);
        ctx.fill();
      }
      if (R >= 0) {
        const d = Math.hypot(s.gx - ORIGIN.gx, s.gy - ORIGIN.gy);
        if (d <= R) {
          const age = (R - d) / 60;
          ctx.globalAlpha = alpha * clamp(age * 3);
          if (s.size >= 2) {
            ctx.strokeStyle = CAT;
            ctx.lineWidth = 2.4;
            ctx.beginPath();
            ctx.arc(x, y, sz + 6, 0, TAU);
            ctx.stroke();
            if (s.size === 3 || hash(s.i * 1.3) > 0.55) {
              // a very small flag
              ctx.strokeStyle = INK;
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.moveTo(x + 2, y);
              ctx.lineTo(x + 2, y - 22);
              ctx.stroke();
              ctx.fillStyle = CAT;
              ctx.beginPath();
              ctx.moveTo(x + 2, y - 22);
              ctx.lineTo(x + 16, y - 17);
              ctx.lineTo(x + 2, y - 12);
              ctx.fill();
            }
          } else {
            ctx.fillStyle = CAT;
            ctx.beginPath();
            ctx.arc(x, y, 2.6, 0, TAU);
            ctx.fill();
          }
        }
      }
    }
    ctx.globalAlpha = alpha;
    if (R > 0 && R < FAR) {
      // the wavefront, drawn in the plane of the galaxy
      ctx.save();
      const [ox, oy] = project(ORIGIN, g);
      ctx.translate(ox, oy);
      ctx.rotate(g.tilt);
      ctx.scale(1, g.flat);
      ctx.setLineDash([14, 12]);
      ctx.lineDashOffset = -t * 40;
      ctx.strokeStyle = 'rgba(238,148,68,0.85)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, R * g.scale, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  /* ══════════════════════════════════════════════════════════════════════
     a few props
     ══════════════════════════════════════════════════════════════════════ */

  function doodleStars(ctx, t, list, color) {
    for (const [x, y, r, s] of list) {
      ink(ctx, star5(x, y, r, 0.42, -Math.PI / 2 + s), { closed: true, w: 2.4, color: color || 'rgba(60,50,40,0.55)', t, seed: s * 10, passes: 1, amp: 1.2 });
    }
  }

  function coffeeRing(ctx, x, y, r) {
    ctx.save();
    ctx.strokeStyle = 'rgba(120,70,30,0.16)';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(x, y, r, 0.3, TAU - 0.5);
    ctx.stroke();
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(120,70,30,0.1)';
    ctx.beginPath();
    ctx.arc(x + 6, y - 4, r - 8, 1.2, TAU - 0.1);
    ctx.stroke();
    ctx.restore();
  }

  function paperDoll(ctx, t, x, y, texName, fill, seed, bob) {
    ctx.save();
    ctx.translate(x, y + bob);
    const body = [[-62, 10], [62, 10], [80, 200], [-80, 200]];
    cutout(ctx, body, { fill, tex: texName, texAlpha: texName === 'news' ? 1 : 0.35, rim: 5, seed, ink: INK, inkW: 3, t });
    cutout(ctx, ellipse(0, -46, 50, 56, 28), { fill: '#e9d2b4', tex: 'grain', texAlpha: 0.6, rim: 5, seed: seed + 1, ink: INK, inkW: 3, t });
    ctx.restore();
  }

  function speechBubble(ctx, t, x, y, w, h, tailTo, seed) {
    const pts = [];
    const n = 16;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU;
      const bump = 1 + 0.07 * Math.sin(i * 2.7 + seed);
      pts.push([x + Math.cos(a) * (w / 2) * bump, y + Math.sin(a) * (h / 2) * bump]);
    }
    const sm = chaikin(pts.concat([pts[0]]), 2);
    cutout(ctx, sm, { fill: '#fffdf7', rim: 5, ink: INK, inkW: 3.6, seed, t, raw: true });
    const tail = [[tailTo[0], tailTo[1]], [x - w * 0.18, y + h * 0.36], [x - w * 0.02, y + h * 0.42]];
    cutout(ctx, tail, { fill: '#fffdf7', rim: 0, ink: null, seed: seed + 1, shadow: false, raw: true });
    ink(ctx, [[x - w * 0.19, y + h * 0.36], [tailTo[0], tailTo[1]], [x - w * 0.01, y + h * 0.43]], { w: 3.6, t, seed: seed + 2, passes: 1 });
  }

  function dish(ctx, t, x, y, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    const cut = { ink: INK, inkW: 3.2, t, rim: 5 };
    // stand
    cutout(ctx, [[-70, 170], [-18, 20], [18, 20], [70, 170]], { ...cut, fill: '#8b93a3', tex: 'halftone', texAlpha: 0.12, seed: 301 });
    cutout(ctx, rect(-100, 160, 200, 40), { ...cut, fill: '#6f7686', seed: 302 });
    ctx.rotate(-0.55);
    // the bowl
    const bowlPts = ellipse(0, 0, 170, 70, 40, 0, Math.PI).concat(ellipse(0, -8, 170, 38, 30, Math.PI, 0).reverse());
    cutout(ctx, ellipse(0, 0, 172, 72, 44), { ...cut, fill: '#e9ecf2', tex: 'halftone', texAlpha: 0.14, seed: 303 });
    cutout(ctx, ellipse(0, -6, 150, 52, 40), { fill: '#c9cfdb', rim: 0, ink: null, shadow: false, seed: 304, tex: 'halftone', texAlpha: 0.2 });
    void bowlPts;
    // feed legs
    for (const k of [-1, 1]) ink(ctx, [[k * 120, -18], [0, -150]], { w: 4, t, seed: 305 + k, passes: 1 });
    ink(ctx, [[0, -6], [0, -150]], { w: 4, t, seed: 307, passes: 1 });
    cutout(ctx, rect(-16, -172, 32, 28), { ...cut, fill: '#e1574b', seed: 308 });
    ctx.restore();
  }

  function card(ctx, t, i, x, y, rot, flip, sc, o) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.scale(sc * Math.max(0.02, Math.abs(flip)), sc);
    const w = 300;
    const h = 400;
    const back = flip < 0;
    cutout(ctx, roundRect(-w / 2, -h / 2, w, h, 20), { fill: back ? '#c8352c' : '#fff8e8', tex: back ? 'dots' : 'grain', texAlpha: back ? 0.35 : 0.6, rim: 5, ink: INK, inkW: 3, t, seed: 600 + i * 10 });
    if (!back) {
      ink(ctx, roundRect(-w / 2 + 14, -h / 2 + 14, w - 28, h - 28, 12), { closed: true, w: 2.4, color: o.color, t, seed: 601 + i * 10, passes: 1 });
      ctx.save();
      ctx.translate(0, -h / 2 + 108);
      o.icon(ctx, t);
      ctx.restore();
      const local = t - o.at;
      write(ctx, o.title, 0, 30, { size: 44, t, seed: 610 + i, reveal: prog(local, 0.5, 1.0), color: INK });
      write(ctx, o.line, 0, 118, { size: 27, maxW: 240, t, seed: 620 + i, reveal: prog(local, 0.85, 1.9), color: '#4a3d33' });
    }
    ctx.restore();
  }

  /* ── the five card icons ────────────────────────────────────────────── */

  const ICONS = [
    (ctx, t) => { // behind us: a wall, and one small planet over it with a sprout
      cutout(ctx, rect(-80, -10, 160, 60), { fill: '#b8553e', tex: 'grid', texAlpha: 0.0, rim: 3, ink: INK, inkW: 2.6, t, seed: 701 });
      for (let r = 0; r < 3; r++) ink(ctx, [[-80, 10 + r * 20], [80, 10 + r * 20]], { w: 1.6, t, seed: 702 + r, passes: 1 });
      cutout(ctx, ellipse(60, -40, 26, 26, 20), { fill: '#4e9fd8', rim: 3, ink: INK, inkW: 2.6, t, seed: 705 });
      ink(ctx, [[60, -66], [60, -84]], { w: 3, color: '#2f8a4a', t, seed: 706, passes: 1 });
      cutout(ctx, ellipse(68, -86, 9, 5, 10), { fill: '#46b35d', rim: 0, ink: null, shadow: false, seed: 707 });
    },
    (ctx, t) => { // ahead of us: a round bomb with a lit fuse
      cutout(ctx, ellipse(-10, 0, 46, 46, 26), { fill: '#2d2d34', rim: 4, ink: INK, inkW: 2.6, t, seed: 711 });
      ink(ctx, [[18, -34], [40, -60], [60, -52]], { w: 4, color: '#8a6a3c', t, seed: 712, passes: 1 });
      const f = 0.7 + 0.3 * Math.sin(t * 30);
      cutout(ctx, star5(64, -56, 14 * f, 0.4, t * 6), { fill: GOLD, rim: 0, ink: null, shadow: false, seed: 713, cut: 0.5 });
    },
    (ctx, t) => { // hiding: curtains, and two eyes between them
      cutout(ctx, [[-90, -70], [-10, -70], [-24, 70], [-90, 70]], { fill: '#8f2f5a', tex: 'stripes', texAlpha: 0.12, rim: 3, ink: INK, inkW: 2.4, t, seed: 721 });
      cutout(ctx, [[90, -70], [10, -70], [24, 70], [90, 70]], { fill: '#8f2f5a', tex: 'stripes', texAlpha: 0.12, rim: 3, ink: INK, inkW: 2.4, t, seed: 722 });
      const blink = (t % 2.6) < 0.12 ? 1 : 0;
      for (const k of [-1, 1]) {
        ctx.fillStyle = '#fffdf6';
        ctx.beginPath(); ctx.ellipse(k * 8, -6, 6, 8 * (1 - blink) + 0.5, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = INK;
        ctx.beginPath(); ctx.arc(k * 8 + 1, -5, 3 * (1 - blink) + 0.3, 0, TAU); ctx.fill();
      }
    },
    (ctx, t) => { // bad timing: an hourglass
      cutout(ctx, [[-44, -72], [44, -72], [8, 0], [44, 72], [-44, 72], [-8, 0]], { fill: '#f6e7c1', rim: 3, ink: INK, inkW: 2.6, t, seed: 731 });
      const k = (t * 0.4) % 1;
      cutout(ctx, [[-30 * (1 - k), -60 + 60 * k], [30 * (1 - k), -60 + 60 * k], [4, -2], [-4, -2]], { fill: '#e0a64a', rim: 0, ink: null, shadow: false, seed: 732, raw: true });
      cutout(ctx, [[-36, 68], [36, 68], [30 * k + 4, 68 - 52 * k], [-30 * k - 4, 68 - 52 * k]], { fill: '#e0a64a', rim: 0, ink: null, shadow: false, seed: 733, raw: true });
      cutout(ctx, rect(-54, -82, 108, 12), { fill: '#8a5a2c', rim: 2, ink: INK, inkW: 2.2, t, seed: 734 });
      cutout(ctx, rect(-54, 70, 108, 12), { fill: '#8a5a2c', rim: 2, ink: INK, inkW: 2.2, t, seed: 735 });
    },
    (ctx, t) => { // barely looked: a bucket beside a great deal of sea
      for (let r = 0; r < 4; r++) {
        const wv = [];
        for (let i = 0; i <= 12; i++) wv.push([-100 + i * 12, -50 + r * 22 + Math.sin(i * 1.3 + t * 3 + r) * 6]);
        ink(ctx, wv, { w: 3, color: '#3f7fbf', t, seed: 741 + r, passes: 1 });
      }
      cutout(ctx, [[34, 10], [96, 10], [88, 70], [42, 70]], { fill: '#d24b3e', rim: 3, ink: INK, inkW: 2.4, t, seed: 745 });
      ink(ctx, ellipse(65, 12, 32, 38, 16, Math.PI, TAU), { w: 2.4, t, seed: 746, passes: 1 });
    },
  ];

  const GUESSES = [
    { title: 'Lucky us', line: 'Life is rare: the Great Filter is behind us.', color: '#2f8a4a' },
    { title: 'Uh-oh', line: '...or the Great Filter is still ahead of us.', color: '#c8352c' },
    { title: 'Shh!', line: 'They are out there, keeping quiet.', color: '#8f2f5a' },
    { title: 'Bad timing', line: 'Civilisations flicker, a million years apart.', color: '#c08a3a' },
    { title: 'Barely looked', line: 'We have searched a hot tub of the ocean.', color: '#3f7fbf' },
  ];
  const CARD_AT = GUESSES.map((_, i) => 34.2 + i * 2.1);
  const SLOTS = [[300, 500, -6], [630, 470, 3], [960, 490, -2], [1290, 470, 4], [1620, 500, -5]];

  /* ══════════════════════════════════════════════════════════════════════
     the scenes
     ══════════════════════════════════════════════════════════════════════ */

  // ── 0 · title ───────────────────────────────────────────────────────────
  function sTitle(ctx, t) {
    sheet(ctx, { color: '#f1e3c4', tex: 'grain', texAlpha: 0.9, seed: 11 });
    coffeeRing(ctx, 1650, 190, 90);
    doodleStars(ctx, t, [[220, 180, 26, 1], [330, 120, 14, 2], [1560, 520, 18, 3], [1720, 420, 12, 4], [180, 760, 16, 5], [1760, 820, 22, 6]]);
    const st = stepT(t);
    const rise = eOut(prog(st, 0.2, 0.9));
    const open = eBack(prog(st, 1.0, 1.35));
    const peek = eBack(prog(st, 1.3, 1.75));
    const blink = t > 2.6 && t < 2.75 ? 1 : 0;
    const look = t > 3.2 ? [0.2, -1] : [0, 0];
    ctx.save();
    ctx.translate(960, 760 + (1 - rise) * 600);
    ctx.scale(1.35, 1.35);
    drawBox(ctx, t, { open, seed: 21 }, () => {
      if (peek > 0) {
        ctx.save();
        ctx.translate(0, -40 - 125 * peek);
        drawCat(ctx, t, { pose: 'peek', look, blink, seed: 31, ears: t > 1.5 && t < 1.8 ? 0.4 : 0, paws: false });
        ctx.restore();
      }
    }, () => { if (peek > 0.6) paws(ctx, t, 31, -96); });
    ctx.restore();
    write(ctx, 'Where is everybody?', 960, 230, { size: 132, t, seed: 5, reveal: prog(t, 1.75, 2.9), w: 8.5 });
    caption(ctx, t, 'the Fermi Paradox, explained by a cat who may or may not be in this box', 960, 400, { at: 2.95, size: 40, maxW: 1100, rot: -1.2, seed: 41 });
  }

  // ── 1 · lunch, 1950 ─────────────────────────────────────────────────────
  function sLunch(ctx, t) {
    sheet(ctx, { color: '#e9dcc0', tex: 'grain', texAlpha: 0.9, seed: 12 });
    // a rubber stamp
    ctx.save();
    ctx.translate(1660, 92);
    ctx.rotate(-0.1);
    ctx.globalAlpha = 0.75;
    ink(ctx, roundRect(-230, -46, 460, 92, 14), { closed: true, w: 5, color: '#b33a2e', t, seed: 51, passes: 1 });
    write(ctx, 'LOS ALAMOS · 1950', 0, 2, { size: 42, color: '#b33a2e', t, seed: 52 });
    ctx.restore();
    const st = stepT(t);
    const dolls = [[560, 'news', '#efe9dc'], [860, 'halftone', '#6f8fbf'], [1160, 'stripes', '#c9b36a'], [1440, 'halftone', '#b86b5a']];
    dolls.forEach(([x, tx, fill], i) => {
      const bob = Math.round(Math.sin(st * 3 + i * 1.7) * 5);
      const shout = i === 1 && t > 7.4 && t < 8.4 ? -14 : 0;
      paperDoll(ctx, t, x, 470 + shout, tx, fill, 60 + i * 5, bob);
    });
    // the table
    cutout(ctx, rect(300, 690, 1400, 260), { fill: '#fdf6ea', tex: 'gingham', texAlpha: 1, rim: 6, seed: 70, cut: 1.6 });
    for (const [x, i] of [[560, 0], [860, 1], [1160, 2], [1440, 3]]) {
      cutout(ctx, [[x - 40, 640], [x + 40, 640], [x + 32, 710], [x - 32, 710]], { fill: '#f7f7f2', tex: 'grain', texAlpha: 0.4, rim: 3, ink: INK, inkW: 2.6, t, seed: 71 + i });
      for (let k = 0; k < 2; k++) {
        const wv = [];
        for (let j = 0; j <= 6; j++) wv.push([x - 10 + k * 18 + Math.sin(j * 1.2 + t * 4 + k) * 6, 626 - j * 12]);
        ink(ctx, wv, { w: 2.4, color: 'rgba(90,70,60,0.5)', t, seed: 80 + i * 3 + k, passes: 1 });
      }
    }
    // the cat's box, on the end of the table
    ctx.save();
    ctx.translate(1700, 690);
    ctx.scale(0.62, 0.62);
    const look = t > 7.6 ? [-1, -0.6] : [0, 0];
    drawBox(ctx, t, { open: 1, seed: 22 }, () => {
      ctx.save();
      ctx.translate(0, -165);
      drawCat(ctx, t, { pose: 'peek', look, seed: 32, ears: t > 9 && t < 9.3 ? 0.5 : 0, blink: t > 9.6 && t < 9.72 ? 1 : 0, paws: false });
      ctx.restore();
    }, () => paws(ctx, t, 32, -96));
    ctx.restore();
    caption(ctx, t, 'Over lunch in 1950, the physicist Enrico Fermi asked a simple question:', 440, 170, { at: 5.35, size: 40, maxW: 700, rot: -1.5, seed: 43 });
    if (t > 7.4) {
      const p = eBack(prog(st, 7.4, 7.75));
      ctx.save();
      ctx.translate(880, 360);
      ctx.scale(p, p);
      ctx.translate(-880, -360);
      speechBubble(ctx, t, 1150, 250, 600, 190, [880, 362], 91);
      write(ctx, '“But where is everybody?”', 1150, 250, { size: 54, maxW: 520, t, seed: 92, reveal: prog(t, 7.7, 8.6) });
      ctx.restore();
    }
    if (t > 9.8) {
      const q = prog(t, 9.8, 11);
      write(ctx, '?', 1760, 520 - q * 120, { size: 70, t, seed: 93, alpha: 1 - q * 0.6 });
    }
  }

  // ── 2 · the numbers ─────────────────────────────────────────────────────
  function sGalaxy(ctx, t) {
    sheet(ctx, { color: NAVY, tex: 'gouache', texAlpha: 1, seed: 13 });
    drawGalaxy(ctx, t, GAL, {});
    const st = stepT(t);
    // the cat, in its box, with a paper telescope
    ctx.save();
    const bob = Math.round(Math.sin(st * 2.2) * 6);
    ctx.translate(250, 860 + bob);
    ctx.rotate(Math.sin(st * 1.6) * 0.04);
    ctx.scale(0.8, 0.8);
    drawBox(ctx, t, { open: 1, seed: 23 }, () => {
      ctx.save();
      ctx.translate(0, -165);
      drawCat(ctx, t, { pose: 'peek', look: [1, -0.8], seed: 33, paws: false });
      ctx.restore();
    }, () => {
      paws(ctx, t, 33, -96);
      ctx.save();
      ctx.translate(60, -110);
      ctx.rotate(-0.62);
      cutout(ctx, rect(0, -18, 190, 36), { fill: '#d24b3e', tex: 'stripes', texAlpha: 0.12, rim: 4, ink: INK, inkW: 3, t, seed: 95 });
      cutout(ctx, rect(170, -24, 34, 48), { fill: GOLD, rim: 4, ink: INK, inkW: 3, t, seed: 96 });
      ctx.restore();
    });
    ctx.restore();
    const out = 19.0;
    caption(ctx, t, 'Our galaxy: a few hundred billion stars', 430, 150, { at: 12.3, size: 42, maxW: 700, rot: -2.5, seed: 44, out });
    caption(ctx, t, 'most of them with planets', 1540, 230, { at: 14.2, size: 42, maxW: 600, rot: 2, seed: 45, out });
    caption(ctx, t, 'many of them billions of years older than the Sun', 1180, 950, { at: 16.2, size: 42, maxW: 1000, rot: -1, seed: 46, out });
  }

  // ── 3 · the spread, and the arithmetic ───────────────────────────────────
  function sSpread(ctx, t) {
    sheet(ctx, { color: NAVY, tex: 'gouache', texAlpha: 1, seed: 13 });
    const st = stepT(t);
    const away = eInOut(prog(st, 23.3, 23.9));
    const g = { ...GAL, cy: GAL.cy - away * 60, scale: 1 - away * 0.1 };
    drawGalaxy(ctx, t, g, { all: true, spread: true, alpha: 1 - away * 0.78 });
    caption(ctx, t, 'Crawling along at just 1% of the speed of light, one curious species could cross the whole galaxy in about 10 million years.', 960, 120, { at: 19.8, size: 40, maxW: 1400, rot: -0.8, seed: 47, out: 23.2, dur: 2.2 });
    // the counter
    if (t < 23.5) {
      const p = prog(t, SPREAD[0], SPREAD[1]);
      const years = Math.round((10e6 * p) / 10000) * 10000;
      const txt = years.toLocaleString('en-US') + ' years';
      caption(ctx, t, txt, 330, 960, { at: 19.9, size: 46, maxW: 700, rot: 2, seed: 48, out: 23.2, dur: 0.01, tape: true });
    }
    if (t > 23.6) {
      // two strips of paper, at the same scale
      const shortW = 28;
      const longFull = 1800;
      const unroll = eInOut(prog(st, 24.0, 25.6));
      const a1 = eOut(prog(st, 23.6, 23.9));
      ctx.save();
      ctx.globalAlpha = a1;
      cutout(ctx, torn(170, 440, shortW, 64, 71, 3, 8), { fill: GOLD, rim: 3, seed: 171, raw: true });
      write(ctx, '~10 million years: time to cross the galaxy', 230, 474, { size: 40, align: 'left', t, seed: 172, color: CREAM, reveal: prog(t, 23.7, 24.6) });
      if (unroll > 0) {
        cutout(ctx, torn(170, 600, longFull * unroll, 64, 73, 3, 8), { fill: '#e56b5d', rim: 3, seed: 173, raw: true });
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 580, 170 + longFull * unroll, 110);
        ctx.clip();
        write(ctx, '~13 billion years: the age of the galaxy', 200, 632, { size: 40, align: 'left', t, seed: 174, color: CREAM });
        ctx.restore();
      }
      write(ctx, '(drawn to the same scale, this strip would be about ' + SCREENS + ' screens long)', 960, 740, { size: 30, t, seed: 175, color: 'rgba(251,243,225,0.85)', reveal: prog(t, 25.3, 26.0) });
      ctx.restore();
    }
    caption(ctx, t, 'It has had time to do that a thousand times over.', 960, 880, { at: 25.8, size: 46, maxW: 1200, rot: 1.2, seed: 49 });
    // the cat, watching the strip go by
    if (t > 23.6) {
      const endX = 170 + 1800 * eInOut(prog(st, 24.0, 25.6));
      ctx.save();
      ctx.translate(1720, 1000);
      ctx.scale(0.6, 0.6);
      const lx = clamp((endX - 1720) / 400, -1, 1);
      drawBox(ctx, t, { open: 1, seed: 24 }, () => {
        ctx.save();
        ctx.translate(0, -165);
        drawCat(ctx, t, { pose: 'peek', look: [lx, -0.9], seed: 34, paws: false });
        ctx.restore();
      }, () => paws(ctx, t, 34, -96));
      ctx.restore();
    }
  }
  const SCREENS = Math.round((1300 * 28) / 1920);

  // ── 4 · the silence ─────────────────────────────────────────────────────
  function sSilence(ctx, t) {
    sheet(ctx, { color: NAVY_D, tex: 'gouache', texAlpha: 1, seed: 14 });
    for (let i = 0; i < 90; i++) {
      const x = hash(i * 3.1) * W;
      const y = hash(i * 5.7) * 620;
      ctx.globalAlpha = 0.4 + 0.5 * hash(i * 1.1) * (0.7 + 0.3 * Math.sin(t * 2 + i));
      ctx.fillStyle = '#fff4d6';
      ctx.beginPath();
      ctx.arc(x, y, 1.2 + hash(i) * 2, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    // the hill
    const hill = [[-60, 760]];
    for (let i = 0; i <= 20; i++) hill.push([i * 100, 700 - Math.sin(i * 0.45) * 60 - Math.sin(i * 0.9) * 18]);
    hill.push([W + 60, 760], [W + 60, H + 60], [-60, H + 60]);
    cutout(ctx, hill, { fill: '#243b2c', tex: 'stripes', texAlpha: 0.06, rim: 0, seed: 111, shadow: false });
    dish(ctx, t, 1260, 560, 1.25);
    // the cat, sitting beside it
    const look = t > 31.5 ? [0, 0.1] : [0.6, -1];
    ctx.save();
    ctx.translate(760, 720);
    ctx.scale(0.8, 0.8);
    drawCat(ctx, t, { pose: 'sit', look, seed: 35, ears: t > 30 && t < 30.4 ? 0.55 : 0, blink: t > 32.3 && t < 32.45 ? 1 : 0 });
    ctx.restore();
    // a chart recorder, recording nothing
    const sx = 140;
    const sy = 890;
    cutout(ctx, rect(sx, sy, 820, 120), { fill: '#fbf6ea', tex: 'grid', texAlpha: 1, rim: 5, seed: 112, cut: 1 });
    const line = [];
    for (let i = 0; i <= 80; i++) {
      const x = sx + 10 + i * 10;
      line.push([x, sy + 60 + (hash(i * 3.3 + boil(t)) - 0.5) * 3]);
    }
    ink(ctx, line, { w: 3, color: '#b33a2e', t, seed: 113, passes: 1, amp: 0.4 });
    cutout(ctx, [[sx + 812, sy + 60], [sx + 850, sy + 44], [sx + 850, sy + 76]], { fill: '#3a3a3a', rim: 2, ink: INK, inkW: 2, t, seed: 114 });
    write(ctx, 'nothing', 420, 870, { size: 30, t, seed: 115, color: '#f3e6c9', reveal: prog(t, 29.5, 30.2) });
    write(ctx, 'still nothing', 720, 870, { size: 30, t, seed: 116, color: '#f3e6c9', reveal: prog(t, 31.3, 32.1) });
    caption(ctx, t, 'So the sky should be full of their noise. Instead: silence.', 960, 150, { at: 28.2, size: 46, maxW: 1200, rot: -1, seed: 50 });
  }

  // ── 5 · the guesses ─────────────────────────────────────────────────────
  function sGuesses(ctx, t) {
    sheet(ctx, { color: '#e7eee4', tex: 'grain', texAlpha: 0.9, seed: 15 });
    doodleStars(ctx, t, [[140, 300, 18, 11], [1800, 260, 22, 12], [120, 860, 14, 13], [1810, 880, 16, 14]]);
    caption(ctx, t, 'So where is everybody? A few guesses:', 960, 120, { at: 33.25, size: 50, maxW: 1200, rot: -1.2, seed: 51 });
    const boxX = 960;
    const boxY = 930;
    // cards that have landed, and the one in flight
    let flying = -1;
    for (let i = 0; i < GUESSES.length; i++) {
      const at = CARD_AT[i];
      if (t < at) continue;
      const k = prog(stepT(t), at, at + 0.55);
      if (k < 1) flying = i;
      const [sx, sy, sr] = SLOTS[i];
      const e = eOut(k);
      const x = lerp(boxX, sx, e);
      const y = lerp(boxY - 120, sy, e) - Math.sin(k * Math.PI) * 180;
      const rot = lerp(-0.8, (sr * Math.PI) / 180, e);
      const flip = Math.cos(Math.PI * (1 - clamp(k * 1.25)));
      card(ctx, t, i, x, y, rot, flip, lerp(0.35, 1, e), { ...GUESSES[i], at, icon: ICONS[i] });
    }
    ctx.save();
    ctx.translate(boxX, boxY);
    ctx.scale(0.72, 0.72);
    const target = flying >= 0 ? SLOTS[flying][0] : 960;
    const look = [clamp((target - 960) / 600, -1, 1), -1];
    drawBox(ctx, t, { open: 1, seed: 25 }, () => {
      ctx.save();
      const hop = flying >= 0 ? Math.round(Math.sin(prog(t, CARD_AT[flying], CARD_AT[flying] + 0.4) * Math.PI) * 18) : 0;
      ctx.translate(0, -165 - hop);
      drawCat(ctx, t, { pose: 'peek', look, seed: 36, paws: false });
      ctx.restore();
    }, () => paws(ctx, t, 36, -96 - (flying >= 0 ? Math.round(Math.sin(prog(t, CARD_AT[flying], CARD_AT[flying] + 0.4) * Math.PI) * 18) : 0)));
    ctx.restore();
  }

  // ── 6 · the box ─────────────────────────────────────────────────────────
  function sBox(ctx, t) {
    sheet(ctx, { color: '#3a2b58', tex: 'gouache', texAlpha: 1, seed: 16 });
    doodleStars(ctx, t, [[200, 260, 20, 21], [1720, 300, 16, 22], [300, 820, 14, 23], [1640, 800, 22, 24]], 'rgba(255,240,210,0.35)');
    const st = stepT(t);
    const lift = eOut(prog(st, 48.2, 48.8)) * 0.22;
    // stars leaking out of the box and wheeling up into a small galaxy
    if (t > 48.2) {
      for (let i = 0; i < 140; i++) {
        const born = 48.3 + hash(i * 1.7) * 2.6;
        const k = prog(t, born, born + 1.8);
        if (k <= 0) continue;
        const a = hash(i * 3.9) * TAU + k * 3.5;
        const r = eOut(k) * (80 + hash(i * 2.3) * 250);
        const x = 960 + Math.cos(a) * r * 1.5;
        const y = 560 - eOut(k) * 180 + Math.sin(a) * r * 0.45;
        ctx.globalAlpha = clamp(k * 3) * 0.95;
        ctx.fillStyle = ['#fff4d6', '#ffe08a', '#cfe3ff'][i % 3];
        ctx.beginPath();
        ctx.arc(x, y, 1.6 + hash(i) * 3.2, 0, TAU);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    ctx.save();
    ctx.translate(960, 760);
    ctx.scale(2.0, 2.0);
    const pulse = Math.sin((t - 44.5) * TAU / 1.8);
    drawBox(ctx, t, { open: lift, xray: 0.42, seed: 26, label: 'CAT (?)' }, () => {
      ctx.save();
      ctx.translate(-8, -8);
      ctx.scale(0.5, 0.5);
      drawCat(ctx, t, { pose: 'sit', look: [0, 0], seed: 37, alpha: 0.5 + 0.35 * pulse });
      ctx.restore();
      ctx.save();
      ctx.translate(-52, 26);
      ctx.scale(0.5, 0.5);
      drawCat(ctx, t, { pose: 'lie', asleep: true, halo: true, seed: 38, alpha: 0.5 - 0.35 * pulse });
      ctx.restore();
    });
    ctx.restore();
    // tags
    if (t > 45.6) {
      const a = prog(t, 45.6, 46.0);
      ctx.save();
      ctx.globalAlpha = a;
      write(ctx, 'alive', 1400, 640, { size: 44, t, seed: 131, color: '#fbe9c8', reveal: prog(t, 45.6, 46.1) });
      ink(ctx, [[1340, 655], [1050, 730]], { w: 3, color: '#fbe9c8', t, seed: 132, passes: 1 });
      write(ctx, 'dead', 520, 900, { size: 44, t, seed: 133, color: '#fbe9c8', reveal: prog(t, 46.0, 46.5) });
      ink(ctx, [[580, 905], [760, 890]], { w: 3, color: '#fbe9c8', t, seed: 134, passes: 1 });
      ctx.restore();
    }
    caption(ctx, t, 'Schrödinger’s cat is alive and dead at once — until somebody opens the box.', 960, 130, { at: 45.0, size: 46, maxW: 1300, rot: -1, seed: 52, out: 48.3 });
    caption(ctx, t, 'The galaxy is the same sort of box. Until we find someone — or are sure there is no one — it is both crowded and empty.', 960, 150, { at: 48.6, size: 44, maxW: 1400, rot: 0.8, seed: 53, dur: 2.4 });
    caption(ctx, t, '(a metaphor. Schrödinger meant his cat to sound absurd, too.)', 1480, 1000, { at: 49.9, size: 28, maxW: 760, rot: -1.5, seed: 54, tape: false });
  }

  // ── 7 · keep listening ──────────────────────────────────────────────────
  const BLINKS = [54.0, 54.6, 55.4];
  function sEnd(ctx, t) {
    sheet(ctx, { color: NAVY, tex: 'gouache', texAlpha: 1, seed: 17 });
    for (let i = 0; i < 140; i++) {
      const x = hash(i * 7.3) * W;
      const y = hash(i * 9.1) * 700;
      ctx.globalAlpha = 0.35 + 0.55 * hash(i * 1.9) * (0.7 + 0.3 * Math.sin(t * 1.7 + i));
      ctx.fillStyle = '#fff4d6';
      ctx.beginPath();
      ctx.arc(x, y, 1 + hash(i * 2.2) * 2.2, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    // the far light
    const fx = 1500;
    const fy = 270;
    let flash = 0;
    for (const b of BLINKS) flash = Math.max(flash, 1 - Math.abs(t - b - 0.12) / 0.2);
    flash = clamp(flash);
    const glow = ctx.createRadialGradient(fx, fy, 0, fx, fy, 60 + flash * 50);
    glow.addColorStop(0, `rgba(255,236,170,${0.35 + flash * 0.65})`);
    glow.addColorStop(1, 'rgba(255,236,170,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(fx - 120, fy - 120, 240, 240);
    cutout(ctx, star5(fx, fy, 10 + flash * 8, 0.45), { fill: '#fff4d6', rim: 2, ink: null, seed: 150, cut: 0.4 });
    for (const b of BLINKS) {
      const k = prog(t, b, b + 1.2);
      if (k > 0 && k < 1) {
        ctx.strokeStyle = `rgba(255,236,170,${0.6 * (1 - k)})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(fx, fy, 20 + k * 140, 0, TAU);
        ctx.stroke();
      }
    }
    // the hill, the box, the cat
    const hill = [[-60, 900]];
    for (let i = 0; i <= 20; i++) hill.push([i * 100, 880 - Math.sin(i * 0.35 + 1) * 40]);
    hill.push([W + 60, 900], [W + 60, H + 60], [-60, H + 60]);
    cutout(ctx, hill, { fill: '#1f3326', rim: 0, seed: 151, shadow: false });
    const perked = t > 54.3;
    ctx.save();
    ctx.translate(960, 820);
    ctx.scale(1.05, 1.05);
    drawBox(ctx, t, { open: 0, seed: 27 }, null);
    ctx.translate(0, -272);
    ctx.scale(0.9, 0.9);
    if (perked) ctx.rotate(0.08);
    drawCat(ctx, t, { pose: 'sit', look: perked ? [1, -1] : [0.5, -0.8], seed: 39, ears: perked && t < 54.8 ? -0.4 : 0, blink: t > 53.4 && t < 53.55 ? 1 : 0 });
    ctx.restore();
    caption(ctx, t, 'So we keep listening.', 470, 560, { at: 52.95, size: 56, maxW: 700, rot: -2.5, seed: 55 });
    caption(ctx, t, 'Where is everybody?', 960, 150, { at: 55.9, size: 84, maxW: 1400, rot: -0.6, seed: 56, dur: 0.9 });
    write(ctx, 'the box is still closed', 960, 290, { size: 34, t, seed: 57, color: 'rgba(251,243,225,0.9)', reveal: prog(t, 56.35, 56.95) });
  }

  /* ══════════════════════════════════════════════════════════════════════
     the film
     ══════════════════════════════════════════════════════════════════════ */

  const SCENES = [
    { start: 0, draw: sTitle },
    { start: 5.0, draw: sLunch, from: [1, 0.05], dur: 0.7 },
    { start: 11.0, draw: sGalaxy, from: [0, 1], dur: 0.75 },
    { start: 19.5, draw: sSpread },
    { start: 27.5, draw: sSilence, from: [-1, 0.04], dur: 0.6 },
    { start: 33.0, draw: sGuesses, from: [0, 1], dur: 0.7 },
    { start: 44.5, draw: sBox, from: [1, -0.04], dur: 0.7 },
    { start: 52.5, draw: sEnd, from: [0, -1], dur: 0.8 },
  ];

  /** The whole frame at time t, in stage units. */
  function frame(ctx, t) {
    t = clamp(t, 0, DURATION);
    ctx.save();
    ctx.fillStyle = '#1b1712';
    ctx.fillRect(0, 0, W, H);
    let i = 0;
    while (i + 1 < SCENES.length && t >= SCENES[i + 1].start) i++;
    const cur = SCENES[i];
    const k = cur.from ? prog(stepT(t), cur.start, cur.start + cur.dur) : 1;
    if (k < 1 && i > 0) {
      SCENES[i - 1].draw(ctx, t);
      const e = eOut(k);
      ctx.save();
      ctx.translate(cur.from[0] * (1 - e) * (W + 140), cur.from[1] * (1 - e) * (H + 140));
      ctx.rotate((cur.from[0] ? 0.05 : -0.04) * (1 - e));
      cur.draw(ctx, t);
      ctx.restore();
    } else {
      cur.draw(ctx, t);
    }
    // grain that boils, and a vignette
    ctx.save();
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = tex(ctx, 'grain');
    const b = boil(t);
    ctx.translate((b * 37) % 256, (b * 91) % 256);
    ctx.fillRect(-256, -256, W + 512, H + 512);
    ctx.restore();
    const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 1.05);
    v.addColorStop(0, 'rgba(20,12,4,0)');
    v.addColorStop(1, 'rgba(20,12,4,0.45)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, W, H);
    // in, and out
    const fade = Math.max(1 - prog(t, 0, 0.35), prog(t, 57.3, 58));
    if (fade > 0) {
      ctx.fillStyle = `rgba(27,23,18,${fade})`;
      ctx.fillRect(0, 0, W, H);
    }
    ctx.restore();
  }

  /* ══════════════════════════════════════════════════════════════════════
     the soundtrack
     Everything synthesised here, into one buffer, then played — so the live
     page and the rendered video hear exactly the same samples.
     ══════════════════════════════════════════════════════════════════════ */

  const m2f = (m) => 440 * Math.pow(2, (m - 69) / 12);

  function synth(sr) {
    const N = Math.ceil((DURATION + 1.5) * sr);
    const L = new Float32Array(N);
    const R = new Float32Array(N);
    const SL = new Float32Array(N);
    const SR = new Float32Array(N);

    function voice(t0, dur, fn, gain, pan, send) {
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
    }

    // ── instruments
    const musicBox = (t0, m, vel = 1, pan = 0, detune = 0) => {
      const f = m2f(m) * Math.pow(2, detune / 1200);
      voice(t0, 2.4, (u) => {
        const a = Math.min(1, u / 0.003);
        return a * (
          Math.sin(TAU * f * u) * Math.exp(-u * 2.4) +
          0.28 * Math.sin(TAU * f * 2 * u) * Math.exp(-u * 5) +
          0.1 * Math.sin(TAU * f * 5.4 * u) * Math.exp(-u * 13)
        );
      }, 0.12 * vel, pan, 0.55);
    };

    let pluckSeed = 1;
    const pluck = (t0, m, vel = 1, pan = 0, dur = 1.1) => {
      const f = m2f(m);
      const n = Math.max(2, Math.round(sr / f));
      const buf = new Float32Array(n);
      const r = mulberry(pluckSeed++ * 7919);
      let prev = 0;
      for (let i = 0; i < n; i++) { const w = r() * 2 - 1; prev = prev * 0.5 + w * 0.5; buf[i] = prev; }
      let idx = 0;
      voice(t0, dur, (u) => {
        const a = buf[idx];
        const b = buf[(idx + 1) % n];
        buf[idx] = (a + b) * 0.5 * 0.994;
        idx = (idx + 1) % n;
        return a * Math.min(1, (dur - u) / 0.08);
      }, 0.3 * vel, pan, 0.15);
    };

    const pad = (t0, dur, ms, vel = 1) => {
      ms.forEach((m, j) => {
        for (const det of [-0.35, 0.35]) {
          const f = m2f(m) + det;
          voice(t0, dur + 1.4, (u) => {
            const env = Math.min(1, u / 1.3) * (u > dur ? Math.max(0, 1 - (u - dur) / 1.4) : 1);
            const ph = TAU * f * u + 0.5 * Math.sin(TAU * 4.3 * u + j);
            return env * (Math.sin(ph) + 0.3 * Math.sin(2 * ph) + 0.12 * Math.sin(3 * ph));
          }, 0.028 * vel, (j % 2 ? 0.35 : -0.35), 0.4);
        }
      });
    };

    let nseed = 11;
    const rustle = (t0, dur = 0.45, vel = 1, pan = 0) => {
      const r = mulberry(nseed++ * 104729);
      let lp = 0;
      voice(t0, dur, (u) => {
        const w = r() * 2 - 1;
        lp += 0.3 * (w - lp);
        const hp = w - lp;
        const env = Math.sin(Math.PI * Math.min(1, u / dur)) * (0.6 + 0.4 * Math.sin(u * 80 + r()));
        const crack = r() < 0.015 ? (r() * 2 - 1) * 2.2 : 0;
        return (hp * 0.7 + crack) * env;
      }, 0.1 * vel, pan, 0.1);
    };

    const whoosh = (t0, dur = 0.5, vel = 1, pan = 0) => {
      const r = mulberry(nseed++ * 15485863);
      let lp = 0;
      voice(t0, dur, (u) => {
        const k = u / dur;
        const c = 0.02 + 0.3 * Math.sin(Math.PI * k);
        lp += c * ((r() * 2 - 1) - lp);
        return lp * Math.sin(Math.PI * k);
      }, 0.5 * vel, pan, 0.2);
    };

    const plink = (t0, m, vel = 1, pan = 0) => {
      const f = m2f(m);
      let ph = 0;
      voice(t0, 0.7, (u) => {
        ph += (TAU * f * (1 + 0.4 * Math.exp(-u * 45))) / sr;
        return Math.sin(ph) * Math.exp(-u * 8) * Math.min(1, u / 0.002);
      }, 0.07 * vel, pan, 0.7);
    };

    const snap = (t0, vel = 1) => {
      const r = mulberry(nseed++ * 7);
      voice(t0, 0.12, (u) => {
        const click = (r() * 2 - 1) * Math.exp(-u * 90);
        const thump = Math.sin(TAU * 120 * u) * Math.exp(-u * 30);
        return click * 0.8 + thump * 0.9;
      }, 0.22 * vel, 0, 0.1);
    };

    const tick = (t0, vel = 1) => {
      voice(t0, 0.06, (u) => (Math.sin(TAU * 1850 * u) * 0.6 + Math.sin(TAU * 1210 * u)) * Math.exp(-u * 70), 0.08 * vel, 0.2, 0.2);
    };

    const thump = (t0, vel = 1) => {
      let ph = 0;
      voice(t0, 0.5, (u) => {
        ph += (TAU * (52 + 40 * Math.exp(-u * 18))) / sr;
        return Math.sin(ph) * Math.exp(-u * 7) * Math.min(1, u / 0.004);
      }, 0.32 * vel, 0, 0.05);
    };

    const mrrp = (t0, pitch = 1, question = false, pan = 0) => {
      let ph = 0;
      const D = 0.44;
      voice(t0, D, (u) => {
        const k = u / D;
        const f = pitch * (430 + 360 * Math.sin(Math.PI * Math.min(1, k * 1.25)) + (question ? 300 * k * k : -80 * k));
        ph += (TAU * f) / sr;
        const trill = 0.55 + 0.45 * Math.sin(TAU * 27 * u);
        const env = Math.min(1, u / 0.025) * Math.pow(1 - k, 1.1);
        let s = 0;
        for (let h = 1; h <= 6; h++) s += (Math.sin(ph * h) / h) * (h === 2 || h === 3 ? 1.4 : 1);
        return s * env * trill;
      }, 0.075, pan, 0.25);
    };

    const beep = (t0, m, vel = 1) => {
      const f = m2f(m);
      for (const [dt, g] of [[0, 1], [0.3, 0.35], [0.6, 0.14]]) {
        voice(t0 + dt, 0.3, (u) => Math.sin(TAU * f * u) * Math.min(1, u / 0.015) * Math.min(1, (0.3 - u) / 0.05), 0.09 * vel * g, 0.3, 0.9);
      }
    };

    const staticNoise = (t0, t1, vel = 1) => {
      const r = mulberry(99991);
      let a = 0;
      let b = 0;
      voice(t0, t1 - t0, (u) => {
        const w = r() * 2 - 1;
        a += 0.45 * (w - a);
        b += 0.08 * (a - b);
        const band = a - b;
        const crack = r() < 0.004 ? (r() * 2 - 1) * 3 : 0;
        const env = Math.min(1, u / 0.8) * Math.min(1, (t1 - t0 - u) / 0.6) * (0.75 + 0.25 * Math.sin(u * 1.7));
        return (band + crack * 0.4) * env;
      }, 0.09 * vel, 0, 0.05);
    };

    // ── the score
    const BEAT = 0.6; // 100 bpm
    const bar = (t0, n) => t0 + n * BEAT * 4;
    const D2 = 38; const G2 = 43; const A2 = 45; const E2 = 40; const FS2 = 42;
    const tune = [
      [74, 78, 81, 78, 76, 78, 74, null],
      [79, 83, 81, 79, 78, 76, 74, null],
      [76, 78, 79, 81, 83, 81, 79, 76],
      [78, 74, 81, null, 74, null, null, null],
    ];
    const roots = [D2, G2, A2, D2];

    // A · 0–11: a little tune
    const a0 = 0.55;
    for (let b = 0; b < 4; b++) {
      const t0 = bar(a0, b);
      pluck(t0, roots[b], 1, -0.2);
      pluck(t0 + BEAT * 2, roots[b] + 7, 0.8, -0.2);
      tune[b].forEach((m, j) => { if (m) musicBox(t0 + j * BEAT * 0.5, m, 0.9 + 0.1 * Math.sin(j), 0.25); });
    }
    mrrp(1.5, 1.0, false, 0.1);
    rustle(0.25, 0.7, 1.2);
    rustle(3.3, 0.4, 0.6, -0.3);

    // 1 · the lunch
    rustle(5.0, 0.6, 1.3, 0.4);
    rustle(5.35, 0.35, 0.6, -0.4);
    musicBox(7.4, 86, 0.8, 0.4);
    musicBox(7.55, 90, 0.7, 0.4);
    mrrp(9.0, 1.15, true, 0.5);

    // B · 11–27.5: wonder
    rustle(11.0, 0.7, 1.3);
    whoosh(10.8, 0.7, 0.8);
    const chords = [[62, 66, 69, 73], [59, 62, 66, 69], [55, 59, 62, 66, 73], [57, 61, 64, 69]];
    chords.forEach((c, i) => {
      const t0 = 11.0 + i * 4.8;
      const end = Math.min(t0 + 4.8, 27.45);
      pad(t0, end - t0, c, 1);
      pluck(t0, c[0] - 24, 0.9, -0.1, 2.2);
      c.slice(0, 4).forEach((m, j) => {
        musicBox(t0 + 0.6 + j * 1.2, m + 24 - (j % 2 ? 12 : 0), 0.55, j % 2 ? 0.4 : -0.4);
      });
    });
    const penta = [74, 76, 78, 81, 83, 86, 88, 90, 93, 95];
    for (const s of STARS) {
      if (s.size === 3 || (s.size === 2 && s.i % 4 === 0)) plink(s.pop, penta[(s.i * 7) % penta.length] + (s.size === 3 ? 0 : 12), s.size === 3 ? 1 : 0.5, (hash(s.i) - 0.5) * 1.4);
    }
    rustle(12.3, 0.35, 0.5); rustle(14.2, 0.35, 0.5, 0.4); rustle(16.2, 0.35, 0.5, -0.2);
    // time passing, faster and faster
    let tt = 19.85;
    let iv = 0.46;
    while (tt < 23.4) { tick(tt, 0.7 + 0.3 * (tt - 19.85) / 3.5); tt += iv; iv *= 0.9; }
    rustle(19.8, 0.35, 0.5);
    // the long strip unrolling
    for (let i = 0; i < 12; i++) plink(24.0 + i * 0.13, penta[i % penta.length] - 12 + (i > 9 ? 12 : 0), 0.7, -0.6 + i * 0.1);
    rustle(24.0, 1.5, 0.9, 0.3);
    musicBox(25.8, 81, 0.6, 0); musicBox(26.1, 86, 0.6, 0.2);

    // 4 · silence. Everything stops.
    rustle(27.5, 0.5, 1.1, -0.4);
    staticNoise(27.55, 33.1, 1);
    thump(29.0, 0.9); thump(29.33, 0.6); thump(31.0, 0.9); thump(31.33, 0.6);
    mrrp(30.15, 1.2, true, -0.1);

    // C · 33–44.5: the guesses
    rustle(33.0, 0.6, 1.3);
    const walk = [D2, E2, FS2, A2, G2, FS2, E2, A2];
    for (let b = 0; b < 5; b++) {
      const t0 = bar(33.3, b);
      if (t0 > 44.3) break;
      for (let q = 0; q < 4; q++) {
        const tq = t0 + q * BEAT;
        if (tq < 44.3) pluck(tq, walk[(b * 4 + q) % walk.length], 0.8, -0.2, 0.55);
      }
      tune[b % 4].forEach((m, j) => {
        const tj = t0 + j * BEAT * 0.5;
        if (m && tj < 44.2) musicBox(tj, m + (b % 2 ? 0 : 12), 0.55, 0.3);
      });
    }
    CARD_AT.forEach((at, i) => {
      whoosh(at - 0.05, 0.5, 0.9, -0.3 + i * 0.15);
      snap(at + 0.5, 1);
      [0, 4, 7].forEach((d, j) => musicBox(at + 0.5 + j * 0.07, 86 + d, 0.6, -0.4 + i * 0.2));
    });

    // D · 44.5–52.5: the box, on two music boxes a few cents apart
    rustle(44.5, 0.6, 1.2, 0.4);
    const dark = [[47, 59, 62, 66], [43, 55, 59, 62, 67], [40, 52, 55, 59, 64], [42, 54, 58, 61]];
    dark.forEach((c, i) => pad(44.5 + i * 2, 2, c, 1.1));
    const ghost = [71, 74, 78, 76, 74, 71, 69, null, 67, 71, 74, 73, 78, null, 76, 78];
    ghost.forEach((m, j) => {
      if (!m) return;
      const tj = 44.8 + j * 0.46;
      musicBox(tj, m, 0.55, -0.5, -14);
      musicBox(tj + 0.012, m, 0.55, 0.5, 14);
    });
    for (let i = 0; i < 18; i++) plink(48.3 + i * 0.14, penta[(i * 3) % penta.length], 0.35, (hash(i * 9.1) - 0.5) * 1.6);

    // E · 52.5–58: listening
    rustle(52.5, 0.6, 1.0);
    pad(52.5, 4.6, [50, 57, 62, 66], 1.1);
    BLINKS.forEach((b) => beep(b, 88, 1));
    mrrp(54.5, 1.25, false, 0.1);
    [[55.9, 81], [56.2, 78], [56.5, 74], [56.95, 86]].forEach(([tq, m]) => musicBox(tq, m, 0.8, 0));
    [62, 66, 69, 74].forEach((m, j) => musicBox(56.95 + j * 0.05, m, 0.5, -0.3 + j * 0.2));
    pluck(56.95, D2, 0.9, 0, 1.8);

    // ── a small hall to put it in
    reverb(SL, SR, L, R, sr);

    // ── master
    let peak = 0;
    for (let i = 0; i < N; i++) {
      L[i] = Math.tanh(L[i] * 1.1);
      R[i] = Math.tanh(R[i] * 1.1);
      peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
    }
    const g = peak > 0 ? 0.89 / peak : 1;
    for (let i = 0; i < N; i++) { L[i] *= g; R[i] *= g; }
    // tail fade
    const f0 = Math.floor((DURATION - 0.6) * sr);
    for (let i = f0; i < N; i++) {
      const k = clamp(1 - (i - f0) / (1.6 * sr));
      L[i] *= k; R[i] *= k;
    }
    return { L, R, sr };
  }

  /** Four combs and two allpasses a side. Freeverb, more or less. */
  function reverb(inL, inR, outL, outR, sr) {
    const scale = sr / 44100;
    const combs = [1116, 1188, 1277, 1356];
    const alls = [556, 441];
    for (const [inp, out, spread] of [[inL, outL, 0], [inR, outR, 23]]) {
      const wet = new Float32Array(inp.length);
      for (const c of combs) {
        const n = Math.round((c + spread) * scale);
        const buf = new Float32Array(n);
        let idx = 0;
        let store = 0;
        for (let i = 0; i < inp.length; i++) {
          const y = buf[idx];
          store = y * 0.75 + store * 0.25;
          buf[idx] = inp[i] + store * 0.8;
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
      for (let i = 0; i < out.length; i++) out[i] += wet[i] * 0.09;
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
     the player
     ══════════════════════════════════════════════════════════════════════ */

  window.FERMI = { W, H, DURATION, frame, synth, wavBytes };

  const params = new URLSearchParams(location.search);
  if (params.has('render')) return;

  const canvas = document.getElementById('c');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const ui = document.getElementById('ui');
  const playBtn = document.getElementById('play');
  const note = document.getElementById('note');

  let scale = 1;
  function fit() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const s = Math.min(vw / W, vh / H);
    const cw = Math.floor(W * s);
    const ch = Math.floor(H * s);
    canvas.style.width = cw + 'px';
    canvas.style.height = ch + 'px';
    canvas.width = Math.floor(cw * dpr);
    canvas.height = Math.floor(ch * dpr);
    scale = (cw * dpr) / W;
  }
  function draw(t) {
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    frame(ctx, t);
  }
  window.addEventListener('resize', () => { fit(); if (!playing) draw(still); });
  fit();

  let still = params.has('t') ? Number(params.get('t')) : 4.6;
  draw(still);

  let actx = null;
  let buffer = null;
  /*
    The score takes a few seconds to synthesise, and none of that needs a user
    gesture — only playing it does. So it is made while the poster frame is
    on screen, and by the time anybody reaches for the button it is waiting.
  */
  let samples = null;
  setTimeout(() => { samples = samples || synth(44100); }, 250);
  let src = null;
  let t0 = 0;
  let playing = false;
  let raf = 0;

  function loop() {
    const t = actx.currentTime - t0;
    draw(Math.max(0, t));
    if (t >= DURATION) {
      playing = false;
      still = DURATION;
      ui.classList.remove('is-hidden');
      playBtn.textContent = '↺ once more';
      note.textContent = 'the box is still closed';
      return;
    }
    raf = requestAnimationFrame(loop);
  }

  async function start() {
    playBtn.disabled = true;
    note.textContent = 'tuning the music box…';
    await new Promise((r) => setTimeout(r, 30));
    if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') await actx.resume();
    if (!buffer) {
      const s = samples || (samples = synth(44100));
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
    playing = true;
    ui.classList.add('is-hidden');
    playBtn.disabled = false;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(loop);
  }

  playBtn.addEventListener('click', start);
  canvas.addEventListener('click', () => {
    if (!actx || !playing) return;
    if (actx.state === 'running') actx.suspend(); else actx.resume();
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === ' ') {
      e.preventDefault();
      if (!playing) start();
      else if (actx.state === 'running') actx.suspend(); else actx.resume();
    }
    if (e.key === 'r' || e.key === 'R') start();
  });
})();
