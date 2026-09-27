/**
 * Gita, the reel — Krishna talks Arjuna back onto his feet, in eighty seconds.
 *
 * A vertical 1080 × 1920 reel in the visual language of a certain kind of
 * explainer on the feed: an off-white paper ground; figures drawn in ink and
 * then stippled, the shading made of grains of ink rather than grey; loose
 * watercolour washes in pastel, one mustard word to a line; heavy condensed
 * display type, an italic serif, a plain grotesque and a small mono for the
 * interface; captions revealed a word at a time with the words to come
 * waiting in grey; a meter in the corner. Here the meter reads AURA.
 *
 * Everything is drawn on a 2D canvas each frame and every sound is made in
 * this script — no images, no fonts to download, no audio files. Every frame
 * is a pure function of its timestamp, so the page plays it live and
 * scripts/render-gita-reel.mjs writes the same frames to a video file.
 *
 * The verses are the Bhagavad Gita's (2.23, 2.47, 2.48, 6.5, 11.32); the
 * English around them is a paraphrase written for this.
 */
(() => {
  'use strict';

  const W = 1080;
  const H = 1920;
  const DURATION = 80;
  const BEAT = 0.625; // 96 bpm
  const TAU = Math.PI * 2;

  /* ══════════════════════════════════════════════════════════════════════
     arithmetic
     ══════════════════════════════════════════════════════════════════════ */

  const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
  const lerp = (a, b, t) => a + (b - a) * t;
  const prog = (t, a, b) => clamp((t - a) / (b - a));
  const eOut = (t) => 1 - (1 - t) * (1 - t);
  const eOut3 = (t) => 1 - Math.pow(1 - t, 3);
  const eInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  const eBack = (t) => { const c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
  function hash(n) {
    const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return s - Math.floor(s);
  }
  const hash2 = (x, y) => hash(x * 57.13 + y * 911.7);
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
  function rgb(hex) {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const rgba = (hex, a) => { const [r, g, b] = rgb(hex); return `rgba(${r},${g},${b},${a})`; };
  const A = (a) => `rgba(0,0,0,${a})`;
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };

  /* ══════════════════════════════════════════════════════════════════════
     the look
     ══════════════════════════════════════════════════════════════════════ */

  const PAL = {
    paper: '#ebe7df', ink: '#17140f', ghost: '#c9c3b7', grey: '#8d877c',
    mustard: '#d4951a', blue: '#4f6fb8', indigo: '#2c3d86', teal: '#2f8f86', pink: '#e7b3b0',
    lav: '#b8b1d8', ochre: '#e9c46a', red: '#e0302a', cream: '#f4efe4',
  };
  const F = {
    block: (s) => `bold ${s}px "Liberation Sans", Arial, Helvetica, sans-serif`,
    grot: (s) => `${s}px "Liberation Sans", Arial, Helvetica, sans-serif`,
    serif: (s) => `italic ${s}px "Bitstream Charter", Charter, Georgia, serif`,
    mono: (s) => `${s}px "DejaVu Sans Mono", Menlo, Consolas, monospace`,
    monoB: (s) => `bold ${s}px "DejaVu Sans Mono", Menlo, Consolas, monospace`,
    deva: (s) => `${s}px FreeSerif, "Noto Serif Devanagari", "Kohinoor Devanagari", "Nirmala UI", "Devanagari MT", serif`,
  };

  /* the paper, the grain, the hatching behind a stamp — made once */
  let PAPER = null;
  let GRAIN = null;
  let HATCH = null;
  function paperTex() {
    if (PAPER) return PAPER;
    const c = mk(W, H);
    const g = c.getContext('2d');
    g.fillStyle = PAL.paper;
    g.fillRect(0, 0, W, H);
    const R = mulberry(7);
    for (let i = 0; i < 0; i++) {
      const x = R() * W;
      const y = R() * H;
      const r = 80 + R() * 320;
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, R() < 0.7 ? 'rgba(255,255,250,0.2)' : 'rgba(200,190,170,0.035)');
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr;
      g.fillRect(x - r, y - r, r * 2, r * 2);
    }
    for (let i = 0; i < 700; i++) {
      g.strokeStyle = `rgba(120,110,95,${0.04 + R() * 0.06})`;
      g.lineWidth = 0.6 + R() * 0.8;
      const x = R() * W;
      const y = R() * H;
      const a = R() * TAU;
      const l = 6 + R() * 22;
      g.beginPath();
      g.moveTo(x, y);
      g.quadraticCurveTo(x + Math.cos(a + 0.6) * l * 0.5, y + Math.sin(a + 0.6) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l);
      g.stroke();
    }
    PAPER = c;
    return c;
  }
  function grainTex() {
    if (GRAIN) return GRAIN;
    GRAIN = [0, 1, 2].map((k) => {
      const c = mk(540, 960);
      const g = c.getContext('2d');
      const img = g.createImageData(540, 960);
      const R = mulberry(100 + k);
      for (let i = 0; i < img.data.length; i += 4) {
        const v = R() * 255;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
        img.data[i + 3] = 26;
      }
      g.putImageData(img, 0, 0);
      return c;
    });
    return GRAIN;
  }
  function hatchTex() {
    if (HATCH) return HATCH;
    const c = mk(W, H);
    const g = c.getContext('2d');
    g.fillStyle = PAL.paper;
    g.fillRect(0, 0, W, H);
    const R = mulberry(31);
    g.lineCap = 'round';
    for (let i = 0; i < 6500; i++) {
      const x = R() * W;
      const y = R() * H;
      const a = -0.35 + (R() - 0.5) * 0.5;
      const l = 7 + R() * 13;
      g.strokeStyle = `rgba(23,20,15,${0.2 + R() * 0.35})`;
      g.lineWidth = 2 + R() * 2.2;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
      g.stroke();
    }
    HATCH = c;
    return c;
  }

  /**
   * Stippling: a picture is drawn as a map of how much ink each place wants
   * (alpha, in a quarter-size canvas), then each grain is either inked or not
   * against a noise threshold — so a mid-tone becomes half its grains black.
   * The outlines are drawn afterwards, crisp, over the grains.
   */
  const SPR = new Map();
  function thr(x, y) {
    const b = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]][y & 3][x & 3] / 16;
    return hash2(x, y) * 0.72 + b * 0.28;
  }
  function stipple(key, w, h, tone, line, color = PAL.ink, res = 0.5, gamma = 1.2) {
    const k = key + color;
    if (SPR.has(k)) return SPR.get(k);
    const tw = Math.ceil(w * res);
    const th = Math.ceil(h * res);
    const tc = mk(tw, th);
    const tg = tc.getContext('2d');
    tg.scale(res, res);
    tone(tg);
    const img = tg.getImageData(0, 0, tw, th);
    const d = img.data;
    const [r, g, b] = rgb(color);
    for (let y = 0; y < th; y++) {
      for (let x = 0; x < tw; x++) {
        const i = (y * tw + x) * 4;
        const a = Math.pow(d[i + 3] / 255, gamma);
        const on = a > thr(x, y);
        d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = on ? 255 : 0;
      }
    }
    tg.setTransform(1, 0, 0, 1, 0, 0);
    tg.putImageData(img, 0, 0);
    const out = mk(w, h);
    const og = out.getContext('2d');
    og.imageSmoothingEnabled = true;
    og.drawImage(tc, 0, 0, w, h);
    if (line) {
      og.save();
      og.strokeStyle = color;
      og.fillStyle = color;
      og.lineCap = 'round';
      og.lineJoin = 'round';
      line(og);
      og.restore();
    }
    SPR.set(k, out);
    return out;
  }

  /** A loose watercolour wash: soft layered blobs, darker at the rim, a little granulated. */
  const WASH = new Map();
  function wash(color, w, h, seed) {
    const k = `${color}|${w}|${h}|${seed}`;
    if (WASH.has(k)) return WASH.get(k);
    const pad = 40;
    const c = mk(w + pad * 2, h + pad * 2);
    const g = c.getContext('2d');
    const R = mulberry(seed);
    const n = 40;
    const ph = [R() * TAU, R() * TAU, R() * TAU];
    const blob = (shrink, jitter) => {
      g.beginPath();
      for (let i = 0; i <= n; i++) {
        const a = (i / n) * TAU;
        const rr = 1 - shrink + 0.13 * Math.sin(a * 2 + ph[0]) + 0.08 * Math.sin(a * 5 + ph[1]) + 0.05 * Math.sin(a * 9 + ph[2]) + (R() - 0.5) * jitter;
        const x = pad + w / 2 + Math.cos(a) * (w / 2) * rr * 0.92;
        const y = pad + h / 2 + Math.sin(a) * (h / 2) * rr * 0.92;
        if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
      }
      g.closePath();
    };
    g.filter = 'blur(10px)';
    for (let l = 0; l < 6; l++) {
      blob(l * 0.07, 0.05);
      g.fillStyle = rgba(color, 0.19);
      g.fill();
    }
    g.filter = 'blur(2px)';
    blob(0.02, 0.03);
    g.strokeStyle = rgba(color, 0.45);
    g.lineWidth = 5;
    g.stroke();
    g.filter = 'none';
    // pigment granulation
    g.globalCompositeOperation = 'source-atop';
    for (let i = 0; i < (w * h) / 180; i++) {
      g.fillStyle = R() < 0.5 ? rgba(color, 0.25) : 'rgba(255,255,255,0.18)';
      g.fillRect(R() * c.width, R() * c.height, 2, 2);
    }
    g.globalCompositeOperation = 'source-over';
    WASH.set(k, c);
    return c;
  }
  function drawWash(ctx, color, x, y, w, h, seed, a = 1) {
    if (a <= 0) return;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.globalCompositeOperation = 'multiply';
    ctx.drawImage(wash(color, w, h, seed), x - 40, y - 40);
    ctx.restore();
  }

  /** Heavy condensed display type, with a little wear on it. */
  const BLK = new Map();
  function blockWord(text, size, color) {
    const k = `${text}|${size}|${color}`;
    if (BLK.has(k)) return BLK.get(k);
    const m = mk(10, 10).getContext('2d');
    m.font = F.block(size);
    const sx = 0.78;
    const tw = m.measureText(text).width * sx;
    const pad = size * 0.08;
    const c = mk(tw + pad * 2, size * 1.1);
    const g = c.getContext('2d');
    g.font = F.block(size);
    g.fillStyle = color;
    g.strokeStyle = color;
    g.lineWidth = size * 0.055;
    g.lineJoin = 'miter';
    g.save();
    g.translate(pad, size * 0.9);
    g.scale(sx, 1);
    g.fillText(text, 0, 0);
    g.strokeText(text, 0, 0);
    g.restore();
    // wear: nicks out of the edges and a few flecks in the fill
    g.globalCompositeOperation = 'destination-out';
    const R = mulberry(text.length * 97 + size);
    for (let i = 0; i < (c.width * c.height) / 90; i++) {
      g.fillStyle = `rgba(0,0,0,${0.25 + R() * 0.75})`;
      const s = 1 + R() * 2.5;
      g.fillRect(R() * c.width, R() * c.height, s, s);
    }
    g.globalCompositeOperation = 'source-over';
    const out = { c, w: tw, pad, size };
    BLK.set(k, out);
    return out;
  }

  /* ══════════════════════════════════════════════════════════════════════
     words, a word at a time
     ══════════════════════════════════════════════════════════════════════ */

  const LAY = new Map();
  const measure = mk(10, 10).getContext('2d');
  function fontFor(style, size) {
    return style === 'serif' ? F.serif(size) : style === 'mono' ? F.mono(size) : style === 'monoB' ? F.monoB(size) : style === 'deva' ? F.deva(size) : F.grot(size);
  }
  function layout(cfg) {
    const k = JSON.stringify([cfg.text, cfg.style, cfg.size, cfg.w, cfg.lh, cfg.align]);
    if (LAY.has(k)) return LAY.get(k);
    const words = [];
    const lh = (cfg.lh || 1.12) * cfg.size;
    let y = 0;
    const lines = [];
    for (const para of cfg.text.split('\n')) {
      let line = [];
      let x = 0;
      for (const raw of para.split(' ').filter(Boolean)) {
        const hl = raw.startsWith('*');
        const t = raw.replace(/\*/g, '');
        let ww;
        if (cfg.style === 'block') ww = blockWord(t, cfg.size, PAL.ink).w;
        else { measure.font = fontFor(cfg.style, cfg.size); ww = measure.measureText(t).width; }
        const space = cfg.style === 'block' ? cfg.size * 0.2 : cfg.size * 0.27;
        if (line.length && x + ww > cfg.w) { lines.push({ line, width: x - space, y }); y += lh; line = []; x = 0; }
        line.push({ t, hl, x, w: ww });
        x += ww + space;
      }
      lines.push({ line, width: x - (cfg.style === 'block' ? cfg.size * 0.2 : cfg.size * 0.27), y });
      y += lh;
    }
    for (const L of lines) {
      const off = cfg.align === 'center' ? (cfg.w - L.width) / 2 : cfg.align === 'right' ? cfg.w - L.width : 0;
      for (const wd of L.line) words.push({ ...wd, x: wd.x + off, y: L.y });
    }
    const out = { words, height: y };
    LAY.set(k, out);
    return out;
  }
  /**
   * cfg: text (with *highlight*), x, y, w, size, style, t0, per, ghost, color, hl, align, a
   */
  function say(ctx, lt, cfg) {
    const L = layout(cfg);
    const per = cfg.per ?? 0.2;
    const col = cfg.color || PAL.ink;
    const hl = cfg.hl || PAL.mustard;
    const a0 = cfg.a ?? 1;
    L.words.forEach((wd, i) => {
      const tw = cfg.t0 + i * per;
      const r = prog(lt, tw, tw + 0.14);
      const x = cfg.x + wd.x;
      const y = cfg.y + wd.y;
      let colr;
      let alpha;
      let dy = 0;
      if (r <= 0) {
        if (!cfg.ghost) return;
        colr = cfg.ghostColor || PAL.ghost;
        alpha = a0;
      } else {
        colr = wd.hl ? hl : col;
        alpha = a0 * (cfg.ghost ? 1 : r);
        dy = (1 - eOut(r)) * cfg.size * 0.2;
      }
      ctx.save();
      ctx.globalAlpha = alpha;
      if (cfg.style === 'block') {
        const b = blockWord(wd.t, cfg.size, colr);
        const s = r > 0 && r < 1 ? lerp(1.18, 1, eOut3(r)) : 1;
        ctx.translate(x + b.w / 2, y + cfg.size * 0.5 + dy);
        ctx.scale(s, s);
        ctx.drawImage(b.c, -b.w / 2 - b.pad, -cfg.size * 0.5 - cfg.size * 0.02);
      } else {
        ctx.font = fontFor(cfg.style, cfg.size);
        ctx.fillStyle = colr;
        ctx.textBaseline = 'top';
        ctx.fillText(wd.t, x, y + dy);
      }
      ctx.restore();
    });
    return L.height;
  }
  function text(ctx, s, x, y, font, color, align = 'left', a = 1, base = 'top') {
    ctx.save();
    ctx.globalAlpha = a;
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = base;
    ctx.fillText(s, x, y);
    ctx.restore();
  }

  /* ══════════════════════════════════════════════════════════════════════
     drawing helpers
     ══════════════════════════════════════════════════════════════════════ */

  /** A mukut: a jewelled band, a flared body, a row of lotus-petal points. */
  function crownBody(g) {
    g.beginPath();
    g.moveTo(-118, -38);
    g.bezierCurveTo(-128, -80, -146, -118, -144, -150);
    const n = 5;
    for (let i = 0; i < n; i++) {
      const xa = -144 + (288 / n) * i;
      const xb = xa + 288 / n;
      const mid = (xa + xb) / 2;
      const ph = i === 2 ? 78 : i === 1 || i === 3 ? 58 : 40;
      g.quadraticCurveTo(xa + 4, -150 - ph * 0.7, mid, -150 - ph);
      g.quadraticCurveTo(xb - 4, -150 - ph * 0.7, xb, -150);
    }
    g.bezierCurveTo(146, -118, 128, -80, 118, -38);
    g.closePath();
  }
  function crown(g, x, y, s, rot, tone) {
    g.save();
    g.translate(x, y);
    g.rotate(rot);
    g.scale(s, s);
    if (tone) {
      crownBody(g);
      const gr = g.createLinearGradient(-140, 0, 140, 0);
      gr.addColorStop(0, A(0.1)); gr.addColorStop(0.6, A(0.2)); gr.addColorStop(1, A(0.5));
      g.fillStyle = gr; g.fill();
      g.fillStyle = A(0.55);
      g.fillRect(-126, -40, 252, 40);
      g.fillStyle = A(0.95);
      for (let i = -3; i <= 3; i++) { g.beginPath(); g.arc(i * 33, -20, 8, 0, TAU); g.fill(); }
      g.beginPath(); g.arc(0, -98, 24, 0, TAU); g.fill();
      for (const [px, py] of [[-86, -178], [-29, -196], [29, -196], [86, -178], [0, -215]]) { g.beginPath(); g.arc(px * 0.9, py + 12, 7, 0, TAU); g.fill(); }
      g.beginPath(); g.arc(0, -242, 12, 0, TAU); g.fill();
    } else {
      g.lineWidth = 4 / s;
      crownBody(g); g.stroke();
      g.strokeRect(-126, -40, 252, 40);
      g.lineWidth = 2.5 / s;
      for (const r of [36, 24]) { g.beginPath(); g.arc(0, -98, r, 0, TAU); g.stroke(); }
      g.beginPath(); g.moveTo(-132, -140); g.quadraticCurveTo(0, -120, 132, -140); g.stroke();
      for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(-95 + i * 38, -58, 12, Math.PI, TAU); g.stroke(); }
      g.beginPath(); g.moveTo(0, -228); g.lineTo(0, -254); g.stroke();
    }
    g.restore();
  }
  /** A peacock feather: the quill from (x0,y0) curving to the eye at (x1,y1). */
  function feather(g, x0, y0, x1, y1, bend, tone, s = 1) {
    const cx = (x0 + x1) / 2 + bend;
    const cy = (y0 + y1) / 2;
    const at = (u) => [(1 - u) * (1 - u) * x0 + 2 * (1 - u) * u * cx + u * u * x1, (1 - u) * (1 - u) * y0 + 2 * (1 - u) * u * cy + u * u * y1];
    const ang = Math.atan2(y1 - cy, x1 - cx);
    if (tone) {
      g.lineWidth = 2.2 * s;
      g.strokeStyle = A(0.42);
      for (let i = 0; i < 70; i++) {
        const u = 0.12 + (i / 70) * 0.9;
        const [px, py] = at(u);
        const [qx, qy] = at(Math.min(1, u + 0.01));
        const a = Math.atan2(qy - py, qx - px);
        const len = (26 + u * 70) * s;
        for (const sd of [-1, 1]) {
          g.beginPath();
          g.moveTo(px, py);
          g.quadraticCurveTo(px + Math.cos(a + sd * 1.1) * len * 0.6, py + Math.sin(a + sd * 1.1) * len * 0.6, px + Math.cos(a + sd * 0.7) * len, py + Math.sin(a + sd * 0.7) * len);
          g.stroke();
        }
      }
      g.save();
      g.translate(x1, y1);
      g.rotate(ang + Math.PI / 2);
      for (const [rx, ry, a, dy] of [[56, 84, 0.55, 0], [42, 64, 0.18, 6], [30, 46, 0.7, 10], [17, 26, 0.98, 14]]) {
        g.beginPath();
        g.ellipse(0, dy * s, rx * s, ry * s, 0, 0, TAU);
        g.fillStyle = A(a);
        g.fill();
      }
      g.restore();
    } else {
      g.lineWidth = 4 * s;
      g.beginPath();
      g.moveTo(x0, y0);
      g.quadraticCurveTo(cx, cy, x1, y1);
      g.stroke();
      g.save();
      g.translate(x1, y1);
      g.rotate(ang + Math.PI / 2);
      g.lineWidth = 2.5 * s;
      for (const [rx, ry, dy] of [[56, 84, 0], [30, 46, 10]]) { g.beginPath(); g.ellipse(0, dy * s, rx * s, ry * s, 0, 0, TAU); g.stroke(); }
      g.restore();
    }
  }
  function curls(g, x, y, n, r, dir = 1) {
    for (let i = 0; i < n; i++) {
      g.beginPath();
      const cx = x + i * r * 1.6 * dir;
      for (let k = 0; k <= 24; k++) {
        const a = (k / 24) * TAU * 1.2;
        const rr = r * (1 - k / 30);
        const px = cx + Math.cos(a) * rr * dir;
        const py = y + Math.sin(a) * rr;
        if (k === 0) g.moveTo(px, py); else g.lineTo(px, py);
      }
      g.stroke();
    }
  }

  /* ══════════════════════════════════════════════════════════════════════
     the pictures
     ══════════════════════════════════════════════════════════════════════ */

  /* Krishna in profile, facing left: 1000 × 1300 */
  function profileFront(g) {
    g.moveTo(548, 352);
    g.bezierCurveTo(528, 385, 514, 418, 511, 446);
    g.bezierCurveTo(510, 462, 522, 476, 523, 488);
    g.bezierCurveTo(508, 525, 470, 572, 452, 598);
    g.bezierCurveTo(446, 607, 462, 617, 486, 616);
    g.bezierCurveTo(492, 622, 494, 632, 490, 640);
    g.bezierCurveTo(482, 646, 480, 652, 492, 659);
    g.bezierCurveTo(488, 664, 482, 672, 492, 680);
    g.bezierCurveTo(500, 688, 506, 694, 500, 704);
    g.bezierCurveTo(490, 722, 488, 742, 502, 760);
    g.bezierCurveTo(520, 778, 552, 786, 578, 788);
    g.bezierCurveTo(584, 840, 590, 960, 596, 1080);
  }
  function profileHair(g) {
    g.beginPath();
    g.moveTo(690, 350);
    g.bezierCurveTo(850, 350, 930, 540, 890, 740);
    g.bezierCurveTo(930, 830, 880, 900, 900, 960);
    g.bezierCurveTo(910, 1010, 860, 1060, 820, 1040);
    g.bezierCurveTo(800, 1080, 740, 1070, 730, 1030);
    g.bezierCurveTo(690, 1040, 670, 990, 700, 950);
    g.bezierCurveTo(660, 820, 640, 640, 660, 430);
    g.closePath();
  }
  function kProfileTone(g, flute) {
    // hair behind
    profileHair(g);
    g.fillStyle = A(0.76);
    g.fill();
    g.save();
    g.globalCompositeOperation = 'destination-out';
    g.strokeStyle = A(0.35);
    g.lineWidth = 7;
    for (let i = 0; i < 9; i++) {
      g.beginPath();
      for (let y = 420; y <= 1010; y += 12) g.lineTo(700 + i * 20 + (y - 420) * 0.08 + 14 * Math.sin(y * 0.035 + i * 0.8), y);
      g.stroke();
    }
    g.restore();
    // shoulders and the yellow cloth
    g.beginPath();
    g.moveTo(596, 1060); g.bezierCurveTo(500, 1110, 360, 1160, 250, 1300); g.lineTo(1000, 1300); g.lineTo(1000, 1120); g.bezierCurveTo(900, 1080, 820, 1070, 790, 1050); g.closePath();
    g.fillStyle = A(0.2);
    g.fill();
    g.strokeStyle = A(0.16);
    g.lineWidth = 16;
    for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(420 + i * 90, 1300); g.quadraticCurveTo(520 + i * 80, 1180, 640 + i * 60, 1120); g.stroke(); }
    // neck
    g.beginPath();
    g.moveTo(578, 780); g.bezierCurveTo(588, 900, 592, 1000, 596, 1080); g.lineTo(800, 1080); g.bezierCurveTo(770, 950, 760, 860, 760, 760); g.closePath();
    let gr = g.createLinearGradient(580, 0, 800, 0);
    gr.addColorStop(0, A(0.5)); gr.addColorStop(1, A(0.78));
    g.fillStyle = gr;
    g.fill();
    // the face
    g.beginPath();
    profileFront(g);
    g.lineTo(800, 1080);
    g.bezierCurveTo(770, 900, 760, 760, 800, 620);
    g.bezierCurveTo(830, 480, 780, 360, 660, 330);
    g.bezierCurveTo(610, 325, 570, 335, 548, 352);
    g.closePath();
    gr = g.createLinearGradient(450, 0, 780, 0);
    gr.addColorStop(0, A(0.3)); gr.addColorStop(0.5, A(0.46)); gr.addColorStop(1, A(0.68));
    g.fillStyle = gr;
    g.fill();
    // light on the brow, the nose, the cheek; shadow in the eye and under the jaw
    g.save();
    g.globalCompositeOperation = 'destination-out';
    for (const [x, y, r, a] of [[535, 410, 70, 0.4], [485, 560, 50, 0.35], [575, 600, 70, 0.28], [520, 725, 36, 0.25]]) {
      const rg = g.createRadialGradient(x, y, 0, x, y, r);
      rg.addColorStop(0, A(a)); rg.addColorStop(1, A(0));
      g.fillStyle = rg;
      g.fillRect(x - r, y - r, r * 2, r * 2);
    }
    g.restore();
    for (const [x, y, r, a] of [[552, 492, 42, 0.3], [620, 780, 90, 0.3], [660, 600, 80, 0.18]]) {
      const rg = g.createRadialGradient(x, y, 0, x, y, r);
      rg.addColorStop(0, A(a)); rg.addColorStop(1, A(0));
      g.fillStyle = rg;
      g.fillRect(x - r, y - r, r * 2, r * 2);
    }
    // ear and the earring
    g.fillStyle = A(0.55);
    g.beginPath(); g.ellipse(686, 585, 30, 58, 0.15, 0, TAU); g.fill();
    g.fillStyle = A(0.3);
    g.beginPath(); g.arc(680, 700, 34, 0, TAU); g.fill();
    g.fillStyle = A(0.9);
    g.beginPath(); g.arc(680, 700, 12, 0, TAU); g.fill();
    g.beginPath(); g.moveTo(668, 732); g.lineTo(680, 770); g.lineTo(692, 732); g.fill();
    // necklace
    for (let i = 0; i < 13; i++) {
      const u = i / 12;
      const x = lerp(600, 800, u);
      const y = 1070 + Math.sin(u * Math.PI) * 70;
      g.fillStyle = A(i % 2 ? 0.85 : 0.35);
      g.beginPath(); g.arc(x, y, 12, 0, TAU); g.fill();
    }
    // crown and feather
    feather(g, 745, 300, 915, 60, 60, true);
    crown(g, 655, 348, 0.9, -0.1, true);
    // brow and lashes, dark
    g.fillStyle = A(0.95);
    g.beginPath(); g.moveTo(516, 460); g.quadraticCurveTo(556, 434, 610, 450); g.quadraticCurveTo(560, 446, 518, 468); g.closePath(); g.fill();
    if (flute) fluteTone(g);
  }
  function fluteTone(g) {
    g.save();
    g.translate(470, 660);
    g.rotate(Math.PI - 0.52);
    const gr = g.createLinearGradient(0, -16, 0, 16);
    gr.addColorStop(0, A(0.15)); gr.addColorStop(1, A(0.6));
    g.fillStyle = gr;
    g.fillRect(-20, -15, 560, 30);
    g.fillStyle = A(0.95);
    for (let i = 0; i < 7; i++) { g.beginPath(); g.ellipse(170 + i * 42, -2, 7, 5, 0, 0, TAU); g.fill(); }
    for (const x of [30, 110, 480]) g.fillRect(x, -16, 10, 32);
    g.restore();
  }
  function kProfileLine(g, flute) {
    g.lineWidth = 5.5;
    g.beginPath(); profileFront(g); g.stroke();
    g.lineWidth = 3;
    g.beginPath(); g.moveTo(505, 764); g.quadraticCurveTo(610, 772, 660, 700); g.stroke();
    g.beginPath(); g.moveTo(668, 548); g.bezierCurveTo(712, 520, 722, 620, 690, 650); g.stroke();
    g.beginPath(); g.moveTo(676, 568); g.quadraticCurveTo(696, 580, 686, 620); g.stroke();
    // the eye: lowered, half-shut
    g.lineWidth = 4.5;
    g.beginPath(); g.moveTo(530, 497); g.quadraticCurveTo(548, 484, 576, 491); g.stroke();
    g.lineWidth = 2.5;
    g.beginPath(); g.moveTo(535, 503); g.quadraticCurveTo(554, 510, 572, 499); g.stroke();
    g.beginPath(); g.arc(544, 500, 7, 0, Math.PI); g.fill();
    for (let i = 0; i < 5; i++) {
      const x = 534 + i * 8;
      g.beginPath(); g.moveTo(x, 494 - Math.sin((i / 4) * Math.PI) * 4); g.lineTo(x - 8, 504 + i * 0.6); g.stroke();
    }
    g.beginPath(); g.moveTo(476, 606); g.quadraticCurveTo(488, 598, 500, 610); g.stroke();
    g.lineWidth = 3.5;
    g.beginPath(); g.moveTo(492, 659); g.quadraticCurveTo(506, 664, 519, 655); g.stroke();
    // tilak
    g.lineWidth = 4;
    g.beginPath(); g.moveTo(524, 395); g.lineTo(517, 440); g.stroke();
    // hair curls where the hair ends
    g.lineWidth = 3;
    curls(g, 742, 1010, 4, 20, 1);
    curls(g, 882, 900, 2, 18, -1);
    g.beginPath(); profileHair(g); g.stroke();
    crown(g, 655, 348, 0.9, -0.1, false);
    feather(g, 745, 300, 915, 60, 60, false);
    g.lineWidth = 3;
    g.beginPath(); g.arc(680, 700, 34, 0, TAU); g.stroke();
    g.beginPath(); g.moveTo(596, 1062); g.bezierCurveTo(500, 1110, 360, 1160, 250, 1300); g.stroke();
    if (flute) {
      g.save();
      g.translate(470, 660);
      g.rotate(Math.PI - 0.52);
      g.lineWidth = 3.5;
      g.strokeRect(-20, -15, 560, 30);
      g.restore();
    }
  }
  const kProfile = (color = PAL.ink, flute = false) => stipple('kprof' + flute, 1000, 1300, (g) => kProfileTone(g, flute), (g) => kProfileLine(g, flute), color);

  /* Krishna facing us, eyes lowered: 1000 × 1300 */
  function faceOval(g) {
    g.moveTo(500, 368);
    g.bezierCurveTo(612, 368, 660, 470, 656, 560);
    g.bezierCurveTo(652, 652, 600, 738, 500, 762);
    g.bezierCurveTo(400, 738, 348, 652, 344, 560);
    g.bezierCurveTo(340, 470, 388, 368, 500, 368);
  }
  function kFrontTone(g) {
    // hair falling to the shoulders in locks
    for (const sd of [-1, 1]) {
      g.beginPath();
      for (let y = 400; y <= 980; y += 10) {
        const x = 500 + sd * (150 + (y - 400) * 0.21 + 16 * Math.sin(y * 0.045));
        if (y === 400) g.moveTo(x, y); else g.lineTo(x, y);
      }
      for (let k = 0; k <= 4; k++) g.quadraticCurveTo(500 + sd * (268 - k * 26), 1010, 500 + sd * (262 - (k + 1) * 26), 975 + (k % 2) * 16);
      for (let y = 960; y >= 600; y -= 10) g.lineTo(500 + sd * (128 + (y - 600) * 0.06 + 6 * Math.sin(y * 0.07)), y);
      g.closePath();
      g.fillStyle = A(0.78);
      g.fill();
      g.save();
      g.globalCompositeOperation = 'destination-out';
      g.strokeStyle = A(0.4);
      g.lineWidth = 5;
      for (let i = 0; i < 5; i++) {
        g.beginPath();
        for (let y = 440; y <= 950; y += 12) g.lineTo(500 + sd * (150 + i * 22 + (y - 400) * 0.17 + 12 * Math.sin(y * 0.05 + i)), y);
        g.stroke();
      }
      g.restore();
    }
    // shoulders, chest, the draped cloth
    g.beginPath();
    g.moveTo(440, 850); g.bezierCurveTo(360, 900, 200, 920, 150, 1040); g.lineTo(90, 1300); g.lineTo(910, 1300); g.lineTo(850, 1040);
    g.bezierCurveTo(800, 920, 640, 900, 560, 850); g.closePath();
    let gr = g.createLinearGradient(0, 850, 0, 1300);
    gr.addColorStop(0, A(0.48)); gr.addColorStop(1, A(0.62));
    g.fillStyle = gr;
    g.fill();
    g.beginPath();
    g.moveTo(170, 990); g.bezierCurveTo(360, 1060, 600, 1180, 760, 1300); g.lineTo(560, 1300); g.bezierCurveTo(420, 1200, 280, 1110, 140, 1070); g.closePath();
    g.fillStyle = A(0.12);
    g.fill();
    // neck
    g.beginPath(); g.moveTo(452, 700); g.lineTo(440, 870); g.lineTo(560, 870); g.lineTo(548, 700); g.closePath();
    g.fillStyle = A(0.58);
    g.fill();
    g.fillStyle = A(0.18);
    g.beginPath(); g.ellipse(500, 800, 60, 22, 0, 0, TAU); g.fill();
    // face
    g.beginPath(); faceOval(g);
    gr = g.createRadialGradient(480, 520, 40, 500, 580, 240);
    gr.addColorStop(0, A(0.28)); gr.addColorStop(0.7, A(0.46)); gr.addColorStop(1, A(0.66));
    g.fillStyle = gr;
    g.fill();
    for (const [x, y, r, a] of [[438, 585, 26, 0.25], [562, 585, 26, 0.25]]) {
      const rg = g.createRadialGradient(x, y, 0, x, y, r);
      rg.addColorStop(0, A(a)); rg.addColorStop(1, A(0));
      g.fillStyle = rg; g.fillRect(x - r, y - r, r * 2, r * 2);
    }
    g.fillStyle = A(0.5);
    g.beginPath(); g.moveTo(462, 690); g.quadraticCurveTo(500, 684, 538, 690); g.quadraticCurveTo(500, 722, 462, 690); g.fill();
    // ears and earrings
    for (const s of [-1, 1]) {
      g.fillStyle = A(0.55);
      g.beginPath(); g.ellipse(500 + s * 160, 575, 22, 50, 0, 0, TAU); g.fill();
      g.fillStyle = A(0.3);
      g.beginPath(); g.arc(500 + s * 165, 668, 30, 0, TAU); g.fill();
      g.fillStyle = A(0.9);
      g.beginPath(); g.arc(500 + s * 165, 668, 10, 0, TAU); g.fill();
    }
    // brows
    g.fillStyle = A(0.95);
    for (const s of [-1, 1]) {
      g.beginPath();
      g.moveTo(500 + s * 18, 512); g.quadraticCurveTo(500 + s * 62, 488, 500 + s * 112, 508); g.quadraticCurveTo(500 + s * 62, 498, 500 + s * 20, 520); g.closePath(); g.fill();
    }
    // the garland
    for (let i = 0; i <= 30; i++) {
      const u = i / 30;
      const x = lerp(240, 760, u);
      const y = 930 + Math.sin(u * Math.PI) * 330;
      g.fillStyle = A(i % 3 === 0 ? 0.9 : i % 3 === 1 ? 0.4 : 0.65);
      g.beginPath(); g.arc(x, y, i % 3 === 0 ? 20 : 15, 0, TAU); g.fill();
    }
    g.fillStyle = A(0.95);
    g.beginPath(); g.arc(500, 960, 24, 0, TAU); g.fill();
    feather(g, 600, 300, 720, 50, 50, true, 0.85);
    crown(g, 500, 378, 1.05, 0, true);
  }
  function kFrontLine(g) {
    g.lineWidth = 5;
    g.beginPath(); faceOval(g); g.stroke();
    g.lineWidth = 4.5;
    for (const s of [-1, 1]) {
      const cx = 500 + s * 62;
      g.beginPath(); g.moveTo(cx - 40, 560); g.quadraticCurveTo(cx, 548, cx + 40, 562); g.stroke();
      g.lineWidth = 2.5;
      g.beginPath(); g.ellipse(cx, 563, 14, 7, 0, 0, Math.PI); g.fill();
      for (let i = 0; i < 5; i++) { const x = cx - 30 + i * 15; g.beginPath(); g.moveTo(x, 556 - Math.sin((i / 4) * Math.PI) * 5); g.lineTo(x - 3 * s, 570); g.stroke(); }
      g.lineWidth = 4.5;
    }
    g.lineWidth = 3.5;
    g.beginPath(); g.moveTo(505, 575); g.quadraticCurveTo(514, 612, 508, 640); g.stroke();
    g.beginPath(); g.moveTo(482, 646); g.quadraticCurveTo(500, 662, 518, 646); g.stroke();
    g.lineWidth = 4;
    g.beginPath(); g.moveTo(455, 684); g.quadraticCurveTo(480, 696, 500, 692); g.quadraticCurveTo(520, 696, 545, 684); g.stroke();
    g.lineWidth = 3;
    g.beginPath(); g.moveTo(470, 700); g.quadraticCurveTo(500, 716, 530, 700); g.stroke();
    // tilak: the U and the line
    g.lineWidth = 4.5;
    g.beginPath(); g.moveTo(480, 425); g.lineTo(484, 505); g.quadraticCurveTo(500, 530, 516, 505); g.lineTo(520, 425); g.stroke();
    g.lineWidth = 6;
    g.beginPath(); g.moveTo(500, 432); g.lineTo(500, 500); g.stroke();
    g.lineWidth = 3;
    for (const s of [-1, 1]) {
      g.beginPath(); g.arc(500 + s * 165, 668, 30, 0, TAU); g.stroke();
      curls(g, 500 + s * 250, 960, 2, 18, -s);
    }
    g.beginPath(); g.moveTo(440, 870); g.bezierCurveTo(360, 900, 200, 920, 150, 1040); g.stroke();
    g.beginPath(); g.moveTo(560, 870); g.bezierCurveTo(640, 900, 800, 920, 850, 1040); g.stroke();
    crown(g, 500, 378, 1.05, 0, false);
    feather(g, 600, 300, 720, 50, 50, false, 0.85);
  }
  const kFront = (color = PAL.ink) => stipple('kfront', 1000, 1300, kFrontTone, kFrontLine, color);

  /* Arjuna from behind, sat down, head in his hands: 1000 × 1100 */
  function arjunaBackTone(g) {
    // the bow, dropped
    g.strokeStyle = A(0.85);
    g.lineWidth = 16;
    g.beginPath(); g.moveTo(40, 1010); g.quadraticCurveTo(250, 900, 470, 990); g.stroke();
    g.lineWidth = 3;
    g.beginPath(); g.moveTo(40, 1010); g.lineTo(470, 990); g.stroke();
    // floor shadow
    const fs = g.createRadialGradient(520, 1000, 20, 520, 1000, 380);
    fs.addColorStop(0, A(0.4)); fs.addColorStop(1, A(0));
    g.fillStyle = fs;
    g.fillRect(100, 880, 840, 220);
    // seat: the folded legs and the dhoti
    g.beginPath(); g.ellipse(520, 910, 270, 95, 0, 0, TAU);
    g.fillStyle = A(0.3); g.fill();
    // torso, from behind: armour
    g.beginPath();
    g.moveTo(330, 520); g.bezierCurveTo(360, 470, 440, 455, 520, 458); g.bezierCurveTo(600, 455, 680, 470, 710, 520);
    g.bezierCurveTo(700, 640, 660, 760, 640, 860); g.lineTo(400, 860); g.bezierCurveTo(380, 760, 340, 640, 330, 520); g.closePath();
    const tg = g.createLinearGradient(330, 0, 710, 0);
    tg.addColorStop(0, A(0.72)); tg.addColorStop(0.45, A(0.45)); tg.addColorStop(1, A(0.8));
    g.fillStyle = tg; g.fill();
    // arms up to the head, elbows out
    for (const s of [-1, 1]) {
      g.strokeStyle = A(0.7);
      g.lineWidth = 62;
      g.lineCap = 'round';
      g.beginPath(); g.moveTo(520 + s * 175, 520); g.lineTo(520 + s * 230, 690); g.stroke();
      g.lineWidth = 52;
      g.beginPath(); g.moveTo(520 + s * 230, 690); g.lineTo(520 + s * 80, 420); g.stroke();
    }
    // the quiver
    g.save();
    g.translate(600, 560); g.rotate(0.28);
    g.fillStyle = A(0.88);
    g.fillRect(-28, -150, 56, 300);
    g.strokeStyle = A(0.8);
    g.lineWidth = 4;
    for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(-20 + i * 8, -150); g.lineTo(-24 + i * 9, -210); g.stroke(); }
    g.restore();
    // head, bowed
    g.fillStyle = A(0.82);
    g.beginPath(); g.ellipse(520, 400, 82, 92, 0, 0, TAU); g.fill();
    g.fillStyle = A(0.95);
    g.beginPath(); g.ellipse(520, 318, 36, 30, 0, 0, TAU); g.fill();
    g.fillStyle = A(0.3);
    g.fillRect(470, 300, 100, 14);
  }
  function arjunaBackLine(g) {
    g.lineWidth = 5;
    g.beginPath();
    g.moveTo(330, 520); g.bezierCurveTo(360, 470, 440, 455, 520, 458); g.bezierCurveTo(600, 455, 680, 470, 710, 520);
    g.bezierCurveTo(700, 640, 660, 760, 640, 860);
    g.moveTo(330, 520); g.bezierCurveTo(340, 640, 380, 760, 400, 860);
    g.stroke();
    g.lineWidth = 2.5;
    for (let r = 0; r < 6; r++) for (let c = 0; c < 7; c++) {
      const x = 400 + c * 40 + (r % 2) * 20;
      const y = 560 + r * 45;
      g.beginPath(); g.arc(x, y, 16, 0.1, Math.PI - 0.1); g.stroke();
    }
    g.lineWidth = 4;
    g.beginPath(); g.ellipse(520, 910, 270, 95, 0, Math.PI * 1.05, Math.PI * 1.95, true); g.stroke();
    g.beginPath(); g.ellipse(520, 400, 82, 92, 0, 0, TAU); g.stroke();
  }
  const arjunaBack = () => stipple('arjback', 1000, 1100, arjunaBackTone, arjunaBackLine);

  /* Arjuna standing, the bow drawn: 1000 × 1300, facing right */
  function arjunaBowTone(g) {
    const gr = g.createRadialGradient(480, 1250, 10, 480, 1250, 380);
    gr.addColorStop(0, A(0.45)); gr.addColorStop(1, A(0));
    g.fillStyle = gr;
    g.fillRect(80, 1150, 800, 150);
    g.lineCap = 'round';
    // legs: a long stance
    g.strokeStyle = A(0.8);
    g.lineWidth = 58;
    g.beginPath(); g.moveTo(470, 800); g.lineTo(640, 1000); g.lineTo(660, 1230); g.stroke();
    g.beginPath(); g.moveTo(430, 800); g.lineTo(300, 1020); g.lineTo(220, 1230); g.stroke();
    // dhoti
    g.beginPath(); g.moveTo(360, 700); g.lineTo(560, 700); g.lineTo(620, 930); g.lineTo(320, 930); g.closePath();
    g.fillStyle = A(0.3); g.fill();
    // torso
    g.beginPath(); g.moveTo(380, 420); g.bezierCurveTo(470, 395, 540, 410, 560, 440); g.lineTo(540, 720); g.lineTo(380, 720); g.bezierCurveTo(360, 600, 350, 500, 380, 420); g.closePath();
    const tg = g.createLinearGradient(350, 0, 560, 0);
    tg.addColorStop(0, A(0.85)); tg.addColorStop(1, A(0.5));
    g.fillStyle = tg; g.fill();
    // bow arm out to the right, drawing arm back
    g.strokeStyle = A(0.72);
    g.lineWidth = 46;
    g.beginPath(); g.moveTo(540, 450); g.lineTo(870, 430); g.stroke();
    g.lineWidth = 44;
    g.beginPath(); g.moveTo(400, 450); g.lineTo(300, 400); g.lineTo(520, 380); g.stroke();
    // head
    g.fillStyle = A(0.7);
    g.beginPath(); g.ellipse(500, 310, 66, 78, 0, 0, TAU); g.fill();
    crown(g, 502, 262, 0.42, 0.05, true);
    g.fillStyle = A(0.95);
    g.beginPath(); g.moveTo(446, 300); g.bezierCurveTo(390, 360, 380, 440, 420, 470); g.lineTo(450, 330); g.fill();
    // the bow
    g.strokeStyle = A(0.95);
    g.lineWidth = 18;
    g.beginPath(); g.moveTo(830, 90); g.bezierCurveTo(990, 260, 990, 600, 830, 780); g.stroke();
    // quiver
    g.save(); g.translate(380, 470); g.rotate(-0.35);
    g.fillStyle = A(0.9); g.fillRect(-24, -140, 48, 260);
    g.restore();
  }
  function arjunaBowLine(g) {
    g.lineWidth = 3;
    g.beginPath(); g.moveTo(830, 90); g.lineTo(520, 382); g.lineTo(830, 780); g.stroke();
    g.lineWidth = 5;
    g.beginPath(); g.moveTo(420, 386); g.lineTo(990, 420); g.stroke();
    g.beginPath(); g.moveTo(990, 420); g.lineTo(955, 404); g.lineTo(962, 420); g.lineTo(955, 436); g.closePath(); g.fill();
    for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(430 + i * 12, 387); g.lineTo(418 + i * 12, 368); g.moveTo(430 + i * 12, 387); g.lineTo(418 + i * 12, 406); g.stroke(); }
    g.lineWidth = 4;
    g.beginPath(); g.moveTo(560, 312); g.quadraticCurveTo(575, 330, 562, 350); g.stroke();
    crown(g, 502, 262, 0.42, 0.05, false);
  }
  const arjunaBow = () => stipple('arjbow', 1000, 1300, arjunaBowTone, arjunaBowLine);

  /* The field: two armies, four horses, the chariot: 1600 × 900 */
  function horse(g, x, y, s, lift, tone) {
    g.save();
    g.translate(x, y);
    g.scale(s, s);
    if (tone) {
      g.fillStyle = A(0.22);
      g.beginPath(); g.ellipse(0, 0, 120, 58, -0.05, 0, TAU); g.fill();
      g.beginPath(); g.moveTo(-80, -30); g.lineTo(-150, -150); g.lineTo(-110, -160); g.lineTo(-40, -40); g.closePath(); g.fill();
      g.beginPath(); g.ellipse(-160, -150, 55, 26, -0.6, 0, TAU); g.fill();
      g.fillStyle = A(0.85);
      g.beginPath(); g.moveTo(-120, -175); g.quadraticCurveTo(-60, -120, -40, -50); g.lineTo(-70, -60); g.quadraticCurveTo(-100, -120, -140, -165); g.closePath(); g.fill();
      g.strokeStyle = A(0.3);
      g.lineWidth = 16;
      g.lineCap = 'round';
      const legs = [[-80, 30, -110 - lift * 40, 90 - lift * 60, -120 - lift * 60, 150 - lift * 80], [-50, 40, -60, 110, -70, 170], [70, 30, 90, 100, 70, 170], [95, 25, 130, 90, 150 - lift * 20, 150]];
      for (const [x0, y0, x1, y1, x2, y2] of legs) { g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.lineTo(x2, y2); g.stroke(); }
      g.strokeStyle = A(0.8);
      g.lineWidth = 12;
      g.beginPath(); g.moveTo(115, -10); g.quadraticCurveTo(180, 20, 170, 90); g.stroke();
    } else {
      g.lineWidth = 3 / s;
      g.beginPath(); g.ellipse(0, 0, 120, 58, -0.05, 0, TAU); g.stroke();
      g.beginPath(); g.ellipse(-160, -150, 55, 26, -0.6, 0, TAU); g.stroke();
    }
    g.restore();
  }
  function fieldTone(g) {
    let gr = g.createLinearGradient(0, 0, 0, 900);
    gr.addColorStop(0, A(0.05)); gr.addColorStop(0.55, A(0.2)); gr.addColorStop(0.62, A(0.55)); gr.addColorStop(1, A(0.75));
    g.fillStyle = gr;
    g.fillRect(0, 0, 1600, 900);
    // the sun behind dust
    g.save(); g.globalCompositeOperation = 'destination-out';
    gr = g.createRadialGradient(800, 330, 20, 800, 330, 300);
    gr.addColorStop(0, A(0.9)); gr.addColorStop(1, A(0));
    g.fillStyle = gr; g.fillRect(400, 0, 800, 700);
    g.restore();
    // two armies to the horizon: spears, banners
    const R = mulberry(5);
    for (const [x0, x1] of [[0, 520], [1080, 1600]]) {
      for (let i = 0; i < 260; i++) {
        const x = x0 + R() * (x1 - x0);
        const h = 30 + R() * 70;
        g.strokeStyle = A(0.55 + R() * 0.3);
        g.lineWidth = 2 + R() * 2;
        g.beginPath(); g.moveTo(x, 560); g.lineTo(x + (R() - 0.5) * 8, 560 - h); g.stroke();
        if (R() < 0.12) { g.fillStyle = A(0.7); g.beginPath(); g.moveTo(x, 560 - h); g.lineTo(x + 28, 560 - h + 8); g.lineTo(x, 560 - h + 18); g.fill(); }
      }
      g.fillStyle = A(0.7);
      g.fillRect(x0, 540, x1 - x0, 30);
    }
    // horses
    for (const [x, y, s, l] of [[560, 640, 0.9, 1], [640, 660, 0.92, 0.3], [700, 690, 0.95, 0.8], [780, 700, 1, 0]]) horse(g, x, y, s, l, true);
    // the chariot
    g.fillStyle = A(0.6);
    g.beginPath(); g.moveTo(880, 520); g.lineTo(1160, 520); g.lineTo(1180, 700); g.lineTo(870, 700); g.closePath(); g.fill();
    g.fillStyle = A(0.85);
    g.beginPath(); g.arc(1000, 720, 110, 0, TAU); g.fill();
    g.save(); g.globalCompositeOperation = 'destination-out';
    g.beginPath(); g.arc(1000, 720, 88, 0, TAU); g.fillStyle = A(0.8); g.fill();
    g.restore();
    g.strokeStyle = A(0.9); g.lineWidth = 8;
    for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; g.beginPath(); g.moveTo(1000, 720); g.lineTo(1000 + Math.cos(a) * 92, 720 + Math.sin(a) * 92); g.stroke(); }
    // flag pole and the banner
    g.lineWidth = 7;
    g.beginPath(); g.moveTo(1150, 520); g.lineTo(1150, 200); g.stroke();
    g.fillStyle = A(0.75);
    g.beginPath(); g.moveTo(1150, 205); g.quadraticCurveTo(1230, 220, 1290, 200); g.lineTo(1270, 250); g.lineTo(1290, 300); g.quadraticCurveTo(1230, 280, 1150, 300); g.closePath(); g.fill();
    // Krishna at the reins
    g.fillStyle = A(0.8);
    g.beginPath(); g.ellipse(900, 470, 30, 60, 0, 0, TAU); g.fill();
    g.beginPath(); g.arc(895, 395, 24, 0, TAU); g.fill();
    g.beginPath(); g.moveTo(878, 380); g.lineTo(895, 330); g.lineTo(912, 380); g.fill();
    g.lineWidth = 4;
    g.beginPath(); g.moveTo(905, 360); g.quadraticCurveTo(930, 320, 950, 300); g.stroke();
    // Arjuna, standing, head down
    g.beginPath(); g.ellipse(1050, 430, 38, 92, 0, 0, TAU); g.fill();
    g.beginPath(); g.arc(1058, 330, 26, 0, TAU); g.fill();
  }
  function fieldLine(g) {
    g.lineWidth = 2.5;
    for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(880, 450); g.quadraticCurveTo(720 - i * 30, 440, 440 + i * 60 + (i === 3 ? 20 : 0), 490 + i * 16); g.stroke(); }
    g.lineWidth = 3;
    g.beginPath(); g.moveTo(870, 700); g.lineTo(560, 640); g.stroke();
    g.beginPath(); g.arc(1000, 720, 110, 0, TAU); g.stroke();
  }
  const field = () => stipple('field', 1600, 900, fieldTone, fieldLine, PAL.ink, 0.5, 1.1);

  /* the four things that cannot touch the self */
  function icon(kind) {
    return stipple('icon-' + kind, 400, 400, (g) => {
      g.lineCap = 'round';
      if (kind === 'sword') {
        g.save(); g.translate(200, 200); g.rotate(-0.7);
        const gr = g.createLinearGradient(-20, 0, 20, 0);
        gr.addColorStop(0, A(0.15)); gr.addColorStop(1, A(0.6));
        g.fillStyle = gr;
        g.beginPath(); g.moveTo(-18, 80); g.lineTo(-14, -150); g.lineTo(0, -185); g.lineTo(14, -150); g.lineTo(18, 80); g.closePath(); g.fill();
        g.fillStyle = A(0.9); g.fillRect(-60, 80, 120, 20); g.fillRect(-12, 100, 24, 70);
        g.beginPath(); g.arc(0, 178, 16, 0, TAU); g.fill();
        g.restore();
      } else if (kind === 'fire') {
        for (const [x, s, a] of [[200, 1, 0.55], [150, 0.6, 0.4], [255, 0.7, 0.45], [200, 0.5, 0.95]]) {
          g.fillStyle = A(a);
          g.beginPath(); g.moveTo(x, 320); g.bezierCurveTo(x - 110 * s, 300, x - 60 * s, 170, x, 330 - 280 * s); g.bezierCurveTo(x + 60 * s, 170, x + 110 * s, 300, x, 320); g.fill();
        }
      } else if (kind === 'water') {
        g.fillStyle = A(0.5);
        g.beginPath(); g.moveTo(200, 70); g.bezierCurveTo(120, 190, 110, 260, 200, 300); g.bezierCurveTo(290, 260, 280, 190, 200, 70); g.fill();
        g.save(); g.globalCompositeOperation = 'destination-out';
        g.beginPath(); g.ellipse(170, 230, 16, 30, -0.4, 0, TAU); g.fillStyle = A(0.8); g.fill();
        g.restore();
        g.strokeStyle = A(0.6); g.lineWidth = 10;
        for (let i = 0; i < 2; i++) { g.beginPath(); for (let x = 60; x <= 340; x += 10) g.lineTo(x, 330 + i * 30 + Math.sin(x * 0.06) * 8); g.stroke(); }
      } else {
        g.strokeStyle = A(0.55); g.lineWidth = 12;
        for (const [y, l] of [[140, 260], [200, 300], [260, 220]]) {
          g.beginPath(); g.moveTo(50, y); g.lineTo(50 + l, y); g.arc(50 + l, y - 30, 30, Math.PI / 2, -Math.PI * 0.9, true); g.stroke();
        }
      }
    }, (g) => {
      g.lineWidth = 4;
      if (kind === 'sword') {
        g.save(); g.translate(200, 200); g.rotate(-0.7);
        g.beginPath(); g.moveTo(-18, 80); g.lineTo(-14, -150); g.lineTo(0, -185); g.lineTo(14, -150); g.lineTo(18, 80); g.closePath(); g.stroke();
        g.beginPath(); g.moveTo(0, 70); g.lineTo(0, -160); g.stroke();
        g.restore();
      } else if (kind === 'fire') {
        g.beginPath(); g.moveTo(200, 320); g.bezierCurveTo(90, 300, 140, 170, 200, 50); g.bezierCurveTo(260, 170, 310, 300, 200, 320); g.stroke();
      } else if (kind === 'water') {
        g.beginPath(); g.moveTo(200, 70); g.bezierCurveTo(120, 190, 110, 260, 200, 300); g.bezierCurveTo(290, 260, 280, 190, 200, 70); g.stroke();
      }
    });
  }

  /* ══════════════════════════════════════════════════════════════════════
     the chrome: meter, watermark, grain
     ══════════════════════════════════════════════════════════════════════ */

  function auraAt(t) {
    const steps = [[0, 2], [0.4, 3], [20.4, 6], [27.5, 7], [37.5, 8], [47.5, 8.5], [57.5, 9], [64.4, 10]];
    let v = 0;
    for (const [at, n] of steps) if (t >= at) v = n;
    return v;
  }
  function doubtAt(t) {
    const steps = [[5, 10], [25, 9], [35, 7], [45, 5], [55, 3], [63.75, 1], [70, 0]];
    let v = -1;
    for (const [at, n] of steps) if (t >= at) v = n;
    return v;
  }
  function meter(ctx, x, y, label, n, color, a, blink) {
    ctx.save();
    ctx.globalAlpha = a;
    ctx.font = F.monoB(22);
    ctx.fillStyle = color === PAL.paper ? PAL.paper : PAL.ink;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    const cw = 15;
    const gap = 4;
    const total = 10 * (cw + gap);
    ctx.fillText(label, x - total - 14, y);
    for (let i = 0; i < 10; i++) {
      const cx = x - total + i * (cw + gap);
      const on = i < Math.floor(n) || (i < n && blink);
      ctx.fillStyle = on ? PAL.red : 'rgba(0,0,0,0)';
      ctx.strokeStyle = PAL.red;
      ctx.lineWidth = 2;
      if (on) ctx.fillRect(cx, y - 12, cw, 24);
      else ctx.strokeRect(cx + 1, y - 11, cw - 2, 22);
    }
    ctx.restore();
  }
  function chrome(ctx, t, dark) {
    const ink = dark ? PAL.paper : PAL.ink;
    const a = prog(t, 0.35, 0.7);
    text(ctx, 'the-gita.reel', 56, 64, F.mono(22), ink, 'left', 0.8 * a, 'middle');
    const ch = t < 27.5 ? 'BG 2.3' : t < 37.5 ? 'BG 2.23' : t < 47.5 ? 'BG 2.47' : t < 57.5 ? 'BG 2.48' : t < 63.75 ? 'BG 6.5' : t < 70 ? 'BG 11.32' : 'BG 18.73';
    text(ctx, ch, 56, 96, F.mono(20), dark ? PAL.paper : PAL.grey, 'left', 0.8 * a, 'middle');
    const n = auraAt(t);
    const max = n >= 10;
    const blink = Math.floor(t * 4) % 2 === 0;
    meter(ctx, W - 56, 64, max ? (t >= 75 ? 'AURA · FARMED' : 'AURA · MAX') : 'AURA', n, PAL.red, a * (max && t < 70 && !blink ? 0.6 : 1), blink);
    const d = doubtAt(t);
    if (d >= 0) {
      meter(ctx, W - 56, 100, d === 0 ? 'DOUBT · 0' : 'DOUBT', d, PAL.red, a * 0.85, false);
    } else {
      const clk = `KURUKSHETRA · 06:${String(Math.floor(t) % 60).padStart(2, '0')}`;
      text(ctx, clk, W - 56, 100, F.mono(18), dark ? PAL.paper : PAL.grey, 'right', 0.8 * a, 'middle');
    }
  }
  function grain(ctx, t) {
    const G = grainTex();
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = 0.5;
    ctx.drawImage(G[Math.floor(t * 12) % 3], 0, 0, W, H);
    ctx.restore();
  }

  /* ══════════════════════════════════════════════════════════════════════
     the scenes
     ══════════════════════════════════════════════════════════════════════ */

  function paper(ctx) { ctx.drawImage(paperTex(), 0, 0); }
  function place(ctx, spr, x, y, w, a = 1) {
    ctx.save();
    ctx.globalAlpha = a;
    ctx.drawImage(spr, x, y, w, (w * spr.height) / spr.width);
    ctx.restore();
  }
  function shakeAt(t, at, amt, dur = 0.35) {
    const k = prog(t, at, at + dur);
    if (k <= 0 || k >= 1) return [0, 0];
    const f = (1 - k) * amt;
    return [Math.sin(t * 90) * f, Math.cos(t * 77) * f];
  }

  // 1 · the hook
  function sHook(ctx, t) {
    paper(ctx);
    const z = 1 + t * 0.012;
    drawWash(ctx, PAL.blue, 470, 560, 480, 560, 3, 0.55);
    drawWash(ctx, PAL.ochre, 520, 240, 420, 300, 4, 0.6);
    drawWash(ctx, PAL.teal, 800, 170, 240, 260, 5, 0.45);
    ctx.save();
    ctx.translate(W, 1920);
    ctx.scale(z, z);
    place(ctx, kProfile(), -1030, -1700, 1180);
    ctx.restore();
    const [sx, sy] = [0.3, 0.95, 1.6].reduce((acc, at) => { const s = shakeAt(t, at, 10, 0.25); return [acc[0] + s[0], acc[1] + s[1]]; }, [0, 0]);
    ctx.save();
    ctx.translate(sx, sy);
    say(ctx, t, { text: 'STAND\nUP,\nARJUNA.', x: 56, y: 250, w: 900, size: 200, style: 'block', t0: 0.3, per: 0.65, lh: 0.95 });
    ctx.restore();
    say(ctx, t, { text: 'what Krishna said, in so many words', x: 60, y: 900, w: 420, size: 34, style: 'serif', t0: 2.6, per: 0.12, color: PAL.grey });
    say(ctx, t, { text: '— the Bhagavad Gita, chapter 2', x: 60, y: 1010, w: 440, size: 26, style: 'mono', t0: 3.6, per: 0.1, color: PAL.grey });
  }

  // 2 · the bow on the floor
  function sDropped(ctx, t) {
    paper(ctx);
    drawWash(ctx, PAL.ochre, -60, 160, 700, 1100, 11, 0.55);
    drawWash(ctx, PAL.lav, 420, 900, 620, 700, 12, 0.5);
    const lt = t - 5;
    ctx.save();
    ctx.translate(0, (1 - eOut(prog(lt, 0, 0.6))) * 40);
    place(ctx, arjunaBack(), 290, 800, 820);
    ctx.restore();
    say(ctx, lt, { text: 'YOU JUST\nDROPPED\nYOUR BOW.\nDIDN’T\nYOU?', x: 64, y: 230, w: 700, size: 104, style: 'grot', t0: 0.15, per: 0.34, ghost: true, lh: 1.08 });
  }

  // 3 · the group chat
  function bubble(ctx, x, y, w, h, dotted, lt0, lt) {
    const r = eBack(clamp(prog(lt, lt0, lt0 + 0.3)));
    if (lt < lt0) return 0;
    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);
    ctx.scale(r, r);
    ctx.beginPath();
    const rr = h / 2;
    ctx.moveTo(-w / 2 + rr, -h / 2); ctx.lineTo(w / 2 - rr, -h / 2); ctx.arc(w / 2 - rr, 0, rr, -Math.PI / 2, Math.PI / 2); ctx.lineTo(-w / 2 + rr, h / 2); ctx.arc(-w / 2 + rr, 0, rr, Math.PI / 2, Math.PI * 1.5);
    ctx.strokeStyle = PAL.ink;
    ctx.lineWidth = 4;
    ctx.setLineDash(dotted ? [2, 9] : []);
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.restore();
    return r;
  }
  function sChat(ctx, t) {
    paper(ctx);
    const lt = t - 10;
    text(ctx, 'Pandavas (5)', W / 2, 400, F.monoB(40), PAL.ink, 'center', prog(lt, 0, 0.2));
    text(ctx, 'arjuna, bhima, yudhishthira, nakula, sahadeva', W / 2, 452, F.mono(22), PAL.grey, 'center', prog(lt, 0.1, 0.3));
    // arjuna
    if (lt > 0.5) text(ctx, 'arjuna', 130, 540, F.mono(24), PAL.grey, 'left', prog(lt, 0.5, 0.7));
    if (bubble(ctx, 110, 580, 820, 104, true, 0.55, lt)) text(ctx, 'i can’t fight my own family.', 160, 632, F.monoB(38), PAL.ink, 'left', prog(lt, 0.7, 0.8), 'middle');
    if (lt > 1.5) text(ctx, 'bhima', 950, 730, F.mono(24), PAL.grey, 'right', prog(lt, 1.5, 1.7));
    if (bubble(ctx, 470, 770, 460, 104, true, 1.55, lt)) text(ctx, 'skill issue.', 520, 822, F.monoB(38), PAL.ink, 'left', prog(lt, 1.7, 1.8), 'middle');
    // krishna, typing
    if (lt > 2.4) text(ctx, 'krishna is typing…', 130, 930, F.mono(24), PAL.mustard, 'left', prog(lt, 2.4, 2.6));
    const r = bubble(ctx, 110, 970, 330, 150, true, 2.45, lt);
    if (r) {
      for (let i = 0; i < 3; i++) {
        const b = Math.max(0, Math.sin((lt - 2.5) * 7 - i * 0.9)) * 12;
        ctx.fillStyle = PAL.ink;
        ctx.beginPath(); ctx.arc(190 + i * 85, 1045 - b, 30 * r, 0, TAU); ctx.fill();
      }
    }
    say(ctx, lt, { text: 'three dots\nin the middle\nof a *war.*', x: 110, y: 1230, w: 860, size: 78, style: 'serif', t0: 3.0, per: 0.22, ghost: true, lh: 1.1 });
  }

  // 4 · live from the field
  function tvFrame(ctx, x, y, w, h) {
    const n = 26;
    ctx.beginPath();
    ctx.moveTo(x + n, y); ctx.lineTo(x + w - n, y); ctx.lineTo(x + w, y + n); ctx.lineTo(x + w, y + h - n); ctx.lineTo(x + w - n, y + h); ctx.lineTo(x + n, y + h); ctx.lineTo(x, y + h - n); ctx.lineTo(x, y + n); ctx.closePath();
  }
  function sLive(ctx, t) {
    paper(ctx);
    const lt = t - 15;
    const x = 70;
    const y = 360;
    const w = 940;
    const h = 700;
    ctx.save();
    tvFrame(ctx, x, y, w, h);
    ctx.clip();
    const pan = lt * 18;
    const f = field();
    ctx.drawImage(f, 200 + pan, 60, 1180, 740, x, y, w, h);
    // scan jitter
    const sc = ctx.getTransform().a;
    for (let i = 0; i < 6; i++) {
      const yy = y + ((hash(Math.floor(lt * 10) + i) * h) | 0);
      ctx.drawImage(ctx.canvas, x * sc, yy * sc, w * sc, 6 * sc, x + (hash(i + Math.floor(lt * 10)) - 0.5) * 18, yy, w, 6);
    }
    ctx.restore();
    ctx.lineWidth = 5;
    ctx.strokeStyle = PAL.ink;
    tvFrame(ctx, x, y, w, h);
    ctx.stroke();
    ctx.fillStyle = PAL.ink;
    ctx.fillRect(x + 30, y + 26, 92, 40);
    text(ctx, 'LIVE', x + 76, y + 47, F.monoB(24), PAL.paper, 'center', 1, 'middle');
    if (Math.floor(lt * 2) % 2 === 0) { ctx.fillStyle = PAL.red; ctx.beginPath(); ctx.arc(x + 140, y + 46, 9, 0, TAU); ctx.fill(); }
    text(ctx, 'KURUKSHETRA · DAY 1 · 18 AKSHAUHINIS', x + 10, y + h + 30, F.mono(22), PAL.ink, 'left', 0.85);
    say(ctx, lt, { text: 'Two armies. One chariot.\nAnd the charioteer\nwas *smiling.*', x: 70, y: 1200, w: 940, size: 76, style: 'serif', t0: 0.9, per: 0.24, ghost: true, lh: 1.14 });
  }

  // 5 · he turns around
  function halo(ctx, cx, cy, lt, color, a) {
    ctx.save();
    ctx.globalAlpha = a;
    ctx.strokeStyle = color;
    for (let i = 0; i < 7; i++) {
      const r = 230 + i * 44 + ((lt * 40) % 44);
      ctx.lineWidth = 2;
      ctx.globalAlpha = a * (1 - i / 7) * 0.8;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.stroke();
    }
    ctx.globalAlpha = a * 0.5;
    ctx.lineWidth = 2;
    for (let i = 0; i < 48; i++) {
      const ang = (i / 48) * TAU + lt * 0.08;
      const r0 = 250;
      const r1 = 380 + (i % 3) * 60;
      ctx.beginPath(); ctx.moveTo(cx + Math.cos(ang) * r0, cy + Math.sin(ang) * r0); ctx.lineTo(cx + Math.cos(ang) * r1, cy + Math.sin(ang) * r1); ctx.stroke();
    }
    ctx.restore();
  }
  function sKrishna(ctx, t) {
    paper(ctx);
    const lt = t - 20;
    drawWash(ctx, PAL.blue, 160, 700, 760, 820, 21, 0.62);
    drawWash(ctx, PAL.ochre, 250, 1300, 620, 420, 22, 0.55);
    halo(ctx, 540, 1050, lt, PAL.mustard, eOut(prog(lt, 0.2, 1.4)));
    const z = 1.06 - lt * 0.01;
    ctx.save();
    ctx.translate(540, 1920);
    ctx.scale(z, z);
    place(ctx, kFront(), -520, -1430, 1040);
    ctx.restore();
    say(ctx, lt, { text: '*Krishna* didn’t panic.\nHe started talking.', x: 64, y: 230, w: 950, size: 82, style: 'serif', t0: 0.3, per: 0.26, ghost: true, lh: 1.12 });
    say(ctx, lt, { text: 'aura: farming…', x: 64, y: 470, w: 600, size: 26, style: 'mono', t0: 2.9, per: 0.2, color: PAL.red });
  }

  // stamps between the lessons
  function sStamp(ctx, t, t0, n, sub) {
    ctx.drawImage(hatchTex(), 0, 0);
    const lt = t - t0;
    const [sx, sy] = shakeAt(lt, 0, 22, 0.4);
    ctx.save();
    ctx.translate(W / 2 + sx, 0 + sy);
    const k = eBack(clamp(prog(lt, 0, 0.28)));
    const s = lerp(1.7, 1, k);
    for (const [word, y, size] of [['GYAN', 640, 330], [n, 1070, 460]]) {
      const b = blockWord(word, size, PAL.ink);
      ctx.save();
      ctx.translate(0, y);
      ctx.scale(s, s);
      ctx.globalAlpha = clamp(k * 1.5);
      ctx.fillStyle = PAL.paper;
      ctx.fillRect(-b.w / 2 - 30, -size * 0.55, b.w + 60, size * 1.1);
      ctx.drawImage(b.c, -b.w / 2 - b.pad, -size * 0.5 - size * 0.05);
      ctx.restore();
    }
    ctx.restore();
    const a = prog(lt, 0.7, 0.9);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.font = F.monoB(38);
    const tw = ctx.measureText(sub).width;
    ctx.fillStyle = PAL.ink;
    ctx.fillRect(W / 2 - tw / 2 - 26, 1440, tw + 52, 74);
    ctx.restore();
    text(ctx, sub, W / 2, 1478, F.monoB(38), PAL.paper, 'center', a, 'middle');
  }

  // 6 · you are not the body (2.23)
  function sSoul(ctx, t) {
    paper(ctx);
    const lt = t - 27.5;
    say(ctx, lt, { text: 'THE SELF IS\nNEVER BORN.\nNEVER DIES.', x: 64, y: 190, w: 950, size: 92, style: 'grot', t0: 0.1, per: 0.2, ghost: true, lh: 1.06 });
    const cells = [['sword', 'weapons can’t cut it'], ['fire', 'fire can’t burn it'], ['water', 'water can’t wet it'], ['wind', 'wind can’t dry it']];
    const gx = 70;
    const gy = 560;
    const cw = 460;
    const chh = 420;
    cells.forEach(([k, cap], i) => {
      const at = 1.3 + i * BEAT * 2;
      const r = prog(lt, at, at + 0.2);
      if (r <= 0) return;
      const x = gx + (i % 2) * (cw + 20);
      const y = gy + Math.floor(i / 2) * (chh + 20);
      ctx.save();
      ctx.globalAlpha = r;
      if (i === 1) drawWash(ctx, PAL.ochre, x + 60, y + 30, cw - 120, chh - 120, 60 + i, 0.6);
      if (i === 2) drawWash(ctx, PAL.blue, x + 60, y + 30, cw - 120, chh - 120, 60 + i, 0.5);
      if (i === 3) drawWash(ctx, PAL.lav, x + 60, y + 30, cw - 120, chh - 120, 60 + i, 0.6);
      if (i === 0) drawWash(ctx, PAL.pink, x + 60, y + 30, cw - 120, chh - 120, 60 + i, 0.6);
      ctx.drawImage(icon(k), x + cw / 2 - 140, y + 100 + (1 - eOut(r)) * 20, 280, 280);
      ctx.strokeStyle = PAL.ink;
      ctx.lineWidth = 4;
      ctx.strokeRect(x, y, cw, chh);
      ctx.restore();
      text(ctx, cap, x + cw / 2, y + 50, F.monoB(28), PAL.ink, 'center', r, 'middle');
    });
    // the verdict, boxed, over the grid
    const v = prog(lt, 5.4, 5.6);
    if (v > 0) {
      ctx.save();
      ctx.translate(W / 2, gy + chh + 10);
      const s = lerp(1.25, 1, eOut3(v));
      ctx.scale(s, s);
      ctx.globalAlpha = v;
      ctx.fillStyle = PAL.paper;
      ctx.strokeStyle = PAL.ink;
      ctx.lineWidth = 5;
      ctx.fillRect(-300, -95, 600, 190);
      ctx.strokeRect(-300, -95, 600, 190);
      ctx.restore();
      say(ctx, lt, { text: 'YES. THAT’S\nWHAT *YOU* ARE.', x: W / 2 - 280, y: gy + chh - 70, w: 560, size: 62, style: 'grot', t0: 5.5, per: 0.12, lh: 1.1, align: 'center', ghost: false });
    }
    text(ctx, 'नैनं छिन्दन्ति शस्त्राणि नैनं दहति पावकः', W / 2, 1540, F.deva(46), PAL.ink, 'center', prog(lt, 0.8, 1.2));
    text(ctx, '— BG 2.23', W / 2, 1610, F.mono(22), PAL.grey, 'center', prog(lt, 1, 1.3));
  }

  // 7 · the work, not the fruit (2.47)
  function sKarma(ctx, t) {
    paper(ctx);
    const lt = t - 37.5;
    say(ctx, lt, { text: '*Do* the work.\n*Drop* the outcome.', x: 64, y: 210, w: 950, size: 92, style: 'serif', t0: 0.1, per: 0.3, ghost: true, lh: 1.12 });
    // the graph
    const x0 = 150;
    const y0 = 1260;
    const gw = 800;
    const gh = 560;
    const ga = prog(lt, 1.2, 1.5);
    ctx.save();
    ctx.globalAlpha = ga;
    ctx.strokeStyle = PAL.ink;
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(x0, y0 - gh); ctx.lineTo(x0, y0); ctx.lineTo(x0 + gw, y0); ctx.stroke();
    ctx.restore();
    text(ctx, 'overthinking', x0 + 16, y0 - gh + 6, F.serif(34), PAL.ink, 'left', ga);
    text(ctx, 'caring about the result →', x0 + gw, y0 + 26, F.serif(32), PAL.grey, 'right', ga);
    text(ctx, 'letting it go →', x0 + gw, y0 + 70, F.serif(32), PAL.ink, 'right', prog(lt, 4.6, 5));
    const k = eInOut(prog(lt, 1.8, 4.6));
    ctx.save();
    ctx.strokeStyle = PAL.mustard;
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.beginPath();
    const N = 80;
    for (let i = 0; i <= N * k; i++) {
      const u = i / N;
      const yv = u < 0.35 ? 0.2 + (u / 0.35) * 0.72 + Math.sin(u * 40) * 0.03 : 0.92 * Math.exp(-(u - 0.35) * 9);
      const px = x0 + u * gw;
      const py = y0 - yv * gh * 0.95;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.restore();
    if (lt > 2.6) text(ctx, '“what if we lose?”', x0 + 0.36 * gw, y0 - 0.95 * gh, F.serif(32), PAL.ink, 'left', prog(lt, 2.6, 2.9));
    if (lt > 4.3) text(ctx, 'just shoot.', x0 + 0.72 * gw, y0 - 90, F.serif(34), PAL.mustard, 'left', prog(lt, 4.3, 4.6));
    text(ctx, 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन', W / 2, 1430, F.deva(46), PAL.ink, 'center', prog(lt, 0.8, 1.2));
    text(ctx, '— BG 2.47 · your right is to the work, never to its fruits', W / 2, 1500, F.mono(22), PAL.grey, 'center', prog(lt, 1, 1.3));
  }

  // 8 · same energy (2.48)
  function card(ctx, x, y, w, h, who, handle, body, stats, lt, at, reply) {
    const r = prog(lt, at, at + 0.25);
    if (r <= 0) return;
    ctx.save();
    ctx.globalAlpha = r;
    ctx.translate(0, (1 - eOut(r)) * 30);
    ctx.fillStyle = PAL.cream;
    ctx.strokeStyle = PAL.ink;
    ctx.lineWidth = 5;
    const rr = 26;
    ctx.beginPath();
    ctx.moveTo(x + rr, y); ctx.arcTo(x + w, y, x + w, y + h, rr); ctx.arcTo(x + w, y + h, x, y + h, rr); ctx.arcTo(x, y + h, x, y, rr); ctx.arcTo(x, y, x + w, y, rr); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(x + 70, y + 72, 36, 0, TAU); ctx.fillStyle = who === 'krishna' ? PAL.blue : PAL.ochre; ctx.fill(); ctx.stroke();
    ctx.restore();
    text(ctx, who, x + 126, y + 42, F.monoB(34), PAL.ink, 'left', r);
    text(ctx, handle, x + 126, y + 84, F.mono(24), PAL.grey, 'left', r);
    if (reply) text(ctx, 'replying to @partha', x + 40, y + 132, F.mono(22), PAL.mustard, 'left', r);
    say(ctx, lt, { text: body, x: x + 40, y: y + (reply ? 172 : 140), w: w - 80, size: 46, style: 'monoB', t0: at + 0.25, per: 0.1, lh: 1.2 });
    text(ctx, stats, x + 40, y + h - 50, F.mono(24), PAL.ink, 'left', prog(lt, at + 0.9, at + 1.1));
  }
  function scale(ctx, cx, cy, lt) {
    const tilt = Math.sin(lt * 3.2) * 0.35 * Math.exp(-lt * 0.55);
    ctx.save();
    ctx.strokeStyle = PAL.ink;
    ctx.fillStyle = PAL.ink;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(cx, cy + 250); ctx.lineTo(cx, cy); ctx.stroke();
    ctx.fillRect(cx - 90, cy + 246, 180, 14);
    ctx.translate(cx, cy);
    ctx.rotate(tilt);
    ctx.beginPath(); ctx.moveTo(-230, 0); ctx.lineTo(230, 0); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, 12, 0, TAU); ctx.fill();
    for (const [s, word] of [[-1, 'win'], [1, 'lose']]) {
      ctx.save();
      ctx.translate(s * 220, 0);
      ctx.rotate(-tilt);
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-70, 110); ctx.moveTo(0, 0); ctx.lineTo(70, 110); ctx.stroke();
      ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(-85, 110); ctx.quadraticCurveTo(0, 160, 85, 110); ctx.closePath(); ctx.stroke();
      ctx.font = F.serif(40);
      ctx.textAlign = 'center';
      ctx.fillText(word, 0, 100);
      ctx.restore();
    }
    ctx.restore();
  }
  function sEnergy(ctx, t) {
    paper(ctx);
    const lt = t - 47.5;
    drawWash(ctx, PAL.pink, 520, 1250, 460, 360, 81, 0.5);
    card(ctx, 70, 200, 940, 380, 'arjuna', '@partha · 4h', 'what if we lose tho', '18 likes   700 replies', lt, 0.1, false);
    card(ctx, 70, 620, 940, 520, 'krishna', '@govinda · 4h', 'win, lose. same energy. that balance? that’s yoga.', '108K likes   18 reposts', lt, 1.6, true);
    if (lt > 3.4) scale(ctx, W / 2, 1230, lt - 3.4);
    text(ctx, 'समत्वं योग उच्यते', W / 2, 1560, F.deva(52), PAL.ink, 'center', prog(lt, 3.6, 4));
    text(ctx, '— BG 2.48 · evenness of mind is called yoga', W / 2, 1635, F.mono(22), PAL.grey, 'center', prog(lt, 3.8, 4.1));
  }

  // 9 · the mind (6.5)
  function branch(ctx, x, y, a, len, depth, grow, seed) {
    if (depth <= 0 || grow <= 0) return;
    const g = clamp(grow);
    const x1 = x + Math.cos(a) * len * g;
    const y1 = y + Math.sin(a) * len * g;
    ctx.lineWidth = Math.max(1.5, depth * 2.2);
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x1, y1); ctx.stroke();
    if (grow < 1) return;
    const r = hash(seed);
    branch(ctx, x1, y1, a - 0.35 - r * 0.25, len * (0.72 + r * 0.1), depth - 1, (grow - 1) * 1.3, seed * 2 + 1);
    branch(ctx, x1, y1, a + 0.3 + hash(seed + 7) * 0.25, len * (0.7 + hash(seed + 3) * 0.12), depth - 1, (grow - 1) * 1.3, seed * 2 + 2);
  }
  function sMind(ctx, t) {
    paper(ctx);
    const lt = t - 57.5;
    drawWash(ctx, PAL.ochre, 300, 480, 700, 700, 91, 0.55 * prog(lt, 1.5, 3));
    say(ctx, lt, { text: 'YOUR MIND:\n*BEST FRIEND*\nOR WORST ENEMY.\nYOU PICK.', x: 64, y: 200, w: 950, size: 84, style: 'grot', t0: 0.1, per: 0.22, ghost: true, lh: 1.06 });
    const gy = 1300;
    ctx.save();
    ctx.strokeStyle = PAL.ink;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(70, gy); ctx.lineTo(1010, gy); ctx.stroke();
    ctx.fillStyle = PAL.ink;
    ctx.beginPath(); ctx.arc(1010, gy, 8, 0, TAU); ctx.fill();
    ctx.restore();
    text(ctx, 'doubt', 80, gy + 18, F.serif(30), PAL.ink);
    text(ctx, 'practice', 560, gy + 18, F.serif(30), PAL.ink, 'center');
    text(ctx, 'clarity', 1010, gy + 18, F.serif(30), PAL.ink, 'right');
    ctx.save();
    ctx.strokeStyle = PAL.mustard;
    ctx.lineCap = 'round';
    branch(ctx, 600, gy, -Math.PI / 2 + 0.12, 230, 8, prog(lt, 1.4, 5.8) * 8, 1);
    ctx.restore();
    // a small figure at the foot of it
    place(ctx, arjunaBow(), 360, gy - 250, 190);
    text(ctx, 'उद्धरेदात्मनात्मानम्', W / 2, 1480, F.deva(50), PAL.ink, 'center', prog(lt, 2, 2.4));
    text(ctx, '— BG 6.5 · lift yourself up by yourself', W / 2, 1552, F.mono(22), PAL.grey, 'center', prog(lt, 2.2, 2.5));
  }

  // 10 · everything (11.32)
  function sCosmic(ctx, t) {
    const lt = t - 63.75;
    ctx.fillStyle = PAL.ink;
    ctx.fillRect(0, 0, W, H);
    const cx = W / 2;
    const cy = 1060;
    if (lt < 0.65) {
      // the record, spinning up
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(lt * lt * 18);
      for (let r = 120; r < 420; r += 7) {
        ctx.strokeStyle = rgba(PAL.paper, 0.25 + hash(r) * 0.5);
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke();
      }
      ctx.fillStyle = PAL.paper;
      ctx.beginPath(); ctx.arc(0, 0, 110, 0, TAU); ctx.fill();
      ctx.fillStyle = PAL.ink;
      ctx.font = F.monoB(34);
      ctx.textAlign = 'center';
      ctx.fillText('BG 11', 0, 12);
      ctx.restore();
    } else {
      const k = lt - 0.65;
      const flash = Math.exp(-k * 7);
      // rays
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(k * 0.12);
      for (let i = 0; i < 72; i++) {
        ctx.strokeStyle = rgba(i % 2 ? PAL.mustard : PAL.paper, 0.18 + 0.2 * (i % 3 === 0));
        ctx.lineWidth = i % 3 === 0 ? 5 : 2;
        const a = (i / 72) * TAU;
        ctx.beginPath(); ctx.moveTo(Math.cos(a) * 300, Math.sin(a) * 300); ctx.lineTo(Math.cos(a) * 1400, Math.sin(a) * 1400); ctx.stroke();
      }
      ctx.restore();
      // the arms, a wheel of them, turning
      ctx.save();
      ctx.translate(cx, cy);
      const arms = 18;
      for (let i = 0; i < arms; i++) {
        const a = (i / arms) * TAU + k * 0.35;
        ctx.save();
        ctx.rotate(a);
        ctx.fillStyle = rgba(PAL.paper, 0.9);
        ctx.beginPath(); ctx.ellipse(430, 0, 170, 24, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = PAL.ink;
        ctx.beginPath(); ctx.ellipse(430, 0, 150, 12, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = PAL.paper;
        ctx.beginPath(); ctx.arc(610, 0, 34, 0, TAU); ctx.fill();
        // what each hand holds: a discus, a conch, a lotus, a mace
        ctx.strokeStyle = i % 2 ? PAL.mustard : PAL.paper;
        ctx.lineWidth = 5;
        const kind = i % 4;
        ctx.beginPath();
        if (kind === 0) { ctx.arc(680, 0, 40, 0, TAU); for (let s = 0; s < 8; s++) { const b = (s / 8) * TAU + k * 3; ctx.moveTo(680, 0); ctx.lineTo(680 + Math.cos(b) * 40, Math.sin(b) * 40); } }
        else if (kind === 1) { ctx.moveTo(650, 0); ctx.bezierCurveTo(700, -40, 740, -10, 720, 20); ctx.bezierCurveTo(700, 40, 660, 20, 650, 0); }
        else if (kind === 2) { for (let p = 0; p < 5; p++) { const b = -Math.PI / 2 + (p - 2) * 0.5; ctx.moveTo(660, 0); ctx.quadraticCurveTo(660 + Math.cos(b - 0.3) * 50, Math.sin(b - 0.3) * 50, 660 + Math.cos(b) * 70, Math.sin(b) * 70); } }
        else { ctx.moveTo(640, 0); ctx.lineTo(760, 0); ctx.moveTo(790, 0); ctx.arc(770, 0, 26, 0, TAU); }
        ctx.stroke();
        ctx.restore();
      }
      // a ring of heads
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * TAU - k * 0.2;
        const hx = Math.cos(a) * 250;
        const hy = Math.sin(a) * 250 - 60;
        ctx.fillStyle = rgba(PAL.paper, 0.85);
        ctx.beginPath(); ctx.arc(hx, hy, 46, 0, TAU); ctx.fill();
        ctx.fillStyle = PAL.mustard;
        ctx.fillRect(hx - 34, hy - 50, 68, 14);
        for (let p = -1; p <= 1; p++) { ctx.beginPath(); ctx.arc(hx + p * 22, hy - 50, 12 + (p === 0 ? 6 : 0), Math.PI, TAU); ctx.fill(); }
        ctx.strokeStyle = PAL.ink;
        ctx.lineWidth = 3;
        for (const e of [-1, 1]) { ctx.beginPath(); ctx.arc(hx + e * 15, hy - 2, 9, 0.2, Math.PI - 0.2); ctx.stroke(); }
        ctx.beginPath(); ctx.arc(hx, hy + 18, 10, 0.3, Math.PI - 0.3); ctx.stroke();
      }
      ctx.restore();
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = 0.5;
      ctx.drawImage(wash(PAL.blue, 700, 800, 101), cx - 390, cy - 520);
      ctx.restore();
      const z = 0.62 + k * 0.03;
      ctx.save();
      ctx.translate(cx, cy + 260);
      ctx.scale(z, z);
      place(ctx, kFront(PAL.paper), -520, -1250, 1040);
      ctx.restore();
      // stars
      for (let i = 0; i < 160; i++) {
        const tw = 0.5 + 0.5 * Math.sin(t * 3 + i);
        ctx.fillStyle = rgba(PAL.paper, 0.3 + tw * 0.5);
        ctx.fillRect(hash(i) * W, hash(i + 99) * H, 3, 3);
      }
      const [sx, sy] = shakeAt(lt, 0.65, 26, 0.5);
      ctx.save();
      ctx.translate(sx, sy);
      say(ctx, lt, { text: 'I AM\nTIME.', x: 64, y: 190, w: 950, size: 250, style: 'block', t0: 0.7, per: 0.625, lh: 0.95, color: PAL.paper });
      ctx.restore();
      text(ctx, 'कालोऽस्मि', W / 2, 1590, F.deva(96), PAL.mustard, 'center', prog(lt, 2.0, 2.4));
      text(ctx, '— BG 11.32 · Krishna shows Arjuna his universal form', W / 2, 1720, F.mono(22), PAL.paper, 'center', prog(lt, 2.2, 2.5));
      // beat flashes
      for (const at of [0.65, 2.5, 3.75, 5.0]) {
        const f = Math.exp(-Math.max(0, lt - at) * 9) * (lt >= at ? 1 : 0);
        if (f > 0.02) { ctx.fillStyle = rgba(PAL.paper, f * 0.85); ctx.fillRect(0, 0, W, H); }
      }
      if (flash > 0.02) { ctx.fillStyle = rgba(PAL.paper, flash); ctx.fillRect(0, 0, W, H); }
    }
  }

  // 11 · he picks it up
  function sRise(ctx, t) {
    paper(ctx);
    const lt = t - 70;
    drawWash(ctx, PAL.ochre, 250, 520, 820, 900, 111, 0.7);
    drawWash(ctx, PAL.pink, 520, 1300, 520, 420, 112, 0.45);
    const k = eOut3(prog(lt, 0, 1.2));
    ctx.save();
    ctx.translate(0, (1 - k) * 80);
    place(ctx, arjunaBow(), 200, 620, 900, k);
    ctx.restore();
    say(ctx, lt, { text: 'He picked up\nthe bow.', x: 64, y: 220, w: 950, size: 86, style: 'serif', t0: 0.2, per: 0.26, ghost: true, lh: 1.12 });
    say(ctx, lt, { text: 'Not because the fear left.\nBecause he knew *who he was.*', x: 64, y: 470, w: 950, size: 44, style: 'serif', t0: 2.2, per: 0.14, ghost: true, lh: 1.2, ghostColor: 'rgba(0,0,0,0)' });
  }

  // 12 · the end, which loops to the start
  function sEnd(ctx, t) {
    paper(ctx);
    const lt = t - 75;
    drawWash(ctx, PAL.blue, 470, 560, 480, 560, 3, 0.55);
    drawWash(ctx, PAL.ochre, 520, 240, 420, 300, 4, 0.6);
    drawWash(ctx, PAL.teal, 800, 170, 240, 260, 5, 0.45);
    ctx.save();
    ctx.translate(W, 1920);
    const z = 1.06 - lt * 0.008;
    ctx.scale(z, z);
    place(ctx, kProfile(PAL.ink, true), -1030, -1700, 1180);
    ctx.restore();
    say(ctx, lt, { text: 'DO\nYOUR\nDHARMA.', x: 56, y: 250, w: 900, size: 200, style: 'block', t0: 0.2, per: 0.5, lh: 0.95 });
    say(ctx, lt, { text: '700 verses.\n1 conversation.\nstill the best advice\nanyone’s been given.', x: 60, y: 900, w: 460, size: 36, style: 'serif', t0: 1.8, per: 0.1, color: PAL.ink });
    say(ctx, lt, { text: 'save this for the day you need it.', x: 60, y: 1690, w: 900, size: 26, style: 'mono', t0: 3.2, per: 0.08, color: PAL.grey });
  }

  const SCENES = [
    [0, 5, sHook], [5, 10, sDropped], [10, 15, sChat], [15, 20, sLive], [20, 25, sKrishna],
    [25, 27.5, (c, t) => sStamp(c, t, 25, '01', 'YOU ARE NOT YOUR BODY')], [27.5, 35, sSoul],
    [35, 37.5, (c, t) => sStamp(c, t, 35, '02', 'DO THE WORK. DROP THE RESULT.')], [37.5, 45, sKarma],
    [45, 47.5, (c, t) => sStamp(c, t, 45, '03', 'WIN OR LOSE. SAME ENERGY.')], [47.5, 55, sEnergy],
    [55, 57.5, (c, t) => sStamp(c, t, 55, '04', 'YOUR MIND. YOUR RULES.')], [57.5, 63.75, sMind],
    [63.75, 70, sCosmic], [70, 75, sRise], [75, 80.1, sEnd],
  ];

  function frame(ctx, t) {
    t = clamp(t, 0, DURATION - 0.001);
    ctx.save();
    const sc = SCENES.find(([a, b]) => t >= a && t < b) || SCENES[SCENES.length - 1];
    sc[2](ctx, t);
    ctx.restore();
    const dark = t >= 63.75 && t < 70;
    chrome(ctx, t, dark);
    grain(ctx, t);
    // a hard cut gets one frame of misregistration
    const since = t - sc[0];
    if (since < 1 / 30 && t > 0.1) {
      ctx.save();
      ctx.globalAlpha = 0.25;
      ctx.drawImage(ctx.canvas, 0, 0, ctx.canvas.width, ctx.canvas.height, 8, 0, W, H);
      ctx.restore();
    }
    // fade in from paper at the very start
    if (t < 0.25) { ctx.fillStyle = rgba(PAL.paper, 1 - t / 0.25); ctx.fillRect(0, 0, W, H); }
  }

  /* ══════════════════════════════════════════════════════════════════════
     the sound: D Yaman on a bansuri, a tanpura, a lo-fi beat, and the war
     ══════════════════════════════════════════════════════════════════════ */

  const m2f = (m) => 440 * Math.pow(2, (m - 69) / 12);
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
  const TANP = table([1, 0.7, 0.55, 0.5, 0.42, 0.36, 0.3, 0.26, 0.2, 0.17, 0.14, 0.12, 0.1, 0.08, 0.06, 0.05, 0.04]);
  const CONCH = table(Array.from({ length: 30 }, (_, h) => { const f = (h + 1) * 233; return 0.05 + Math.exp(-Math.pow((f - 700) / 380, 2)) + 0.4 * Math.exp(-Math.pow((f - 1700) / 500, 2)); }));
  const CHOIR = table(Array.from({ length: 36 }, (_, h) => { const f = (h + 1) * 147; return 0.02 + Math.exp(-Math.pow((f - 750) / 130, 2)) + 0.5 * Math.exp(-Math.pow((f - 1180) / 160, 2)) + 0.12 * Math.exp(-Math.pow((f - 2600) / 300, 2)); }));
  const look = (tb, ph) => { const x = (ph - Math.floor(ph)) * 2048; const i = x | 0; return tb[i] + (tb[i + 1] - tb[i]) * (x - i); };

  async function synth(sr, onProgress) {
    const N = Math.ceil((DURATION + 2) * sr);
    const L = new Float32Array(N);
    const R = new Float32Array(N);
    const SL = new Float32Array(N);
    const SR = new Float32Array(N);
    const jobs = [];
    const voice = (t0, dur, fn, gain, pan = 0, send = 0) => jobs.push(() => {
      const i0 = Math.floor(t0 * sr);
      const n = Math.floor(dur * sr);
      const gl = Math.cos(((pan + 1) * Math.PI) / 4) * gain;
      const gr = Math.sin(((pan + 1) * Math.PI) / 4) * gain;
      for (let k = 0; k < n; k++) {
        const i = i0 + k;
        if (i < 0) continue;
        if (i >= N) break;
        const v = fn(k / sr);
        L[i] += v * gl;
        R[i] += v * gr;
        if (send) { SL[i] += v * gl * send; SR[i] += v * gr * send; }
      }
    });
    const rnd = mulberry(2026);
    const noiseFn = () => rnd() * 2 - 1;
    const beatT = (b) => b * BEAT;
    const inBeat = (tt) => (tt >= 5 && tt < 25) || (tt >= 27.5 && tt < 35) || (tt >= 37.5 && tt < 45) || (tt >= 47.5 && tt < 55) || (tt >= 57.5 && tt < 61.25) || (tt >= 70 && tt < 75);

    /* drums */
    const kick = (t0, g = 1) => { let ph = 0; voice(t0, 0.5, (t) => { ph += (45 + 90 * Math.exp(-t * 28)) / sr; return Math.sin(TAU * ph) * Math.exp(-t * 7) + (t < 0.004 ? noiseFn() * 0.3 : 0); }, 0.8 * g); };
    const snare = (t0, g = 1) => { let lp = 0; voice(t0, 0.35, (t) => { const n = noiseFn(); lp += (n - lp) * 0.35; return (n - lp) * Math.exp(-t * 16) * 0.8 + Math.sin(TAU * 190 * t) * Math.exp(-t * 30) * 0.5; }, 0.42 * g, 0.05, 0.25); };
    const hat = (t0, g = 1, open = false) => { let p = 0; voice(t0, open ? 0.3 : 0.07, (t) => { const n = noiseFn(); const hp = n - p; p = n; return hp * Math.exp(-t * (open ? 12 : 60)); }, 0.16 * g, 0.3); };
    const clap = (t0) => { voice(t0, 0.25, (t) => noiseFn() * (Math.exp(-((t % 0.012) * 300)) * (t < 0.036 ? 1 : 0) + Math.exp(-t * 14) * 0.6), 0.22, -0.1, 0.3); };
    for (let b = 0; b < 128; b++) {
      const t0 = beatT(b);
      if (!inBeat(t0 + 0.01)) continue;
      const soft = t0 >= 70 ? 0.7 : 1;
      const bb = b % 4;
      if (bb === 0 || bb === 2) kick(t0, soft);
      if (bb === 2) kick(t0 - BEAT * 0.25, 0.55 * soft);
      if (bb === 1 || bb === 3) { snare(t0, soft); clap(t0); }
      hat(t0, 0.9 * soft);
      hat(t0 + BEAT * 0.55, 0.6 * soft, b % 8 === 7);
    }
    // the climax: half-time and heavy
    for (let b = 103; b < 112; b++) {
      const t0 = beatT(b);
      if (b % 2 === 1) kick(t0, 1.3);
      if (b % 4 === 3) snare(t0, 1.3);
      hat(t0, 0.7, true);
    }
    // snare roll into the climax
    for (let i = 0; i < 24; i++) snare(61.25 + (2.5 * Math.pow(i / 24, 0.8)), 0.25 + (i / 24) * 0.8);
    // hook thuds
    for (const at of [0.3, 0.95, 1.6, 75.2, 75.7, 76.2]) kick(at, 1.1);

    /* bass and keys: Dmaj7 – Bm7 – Gmaj7 – A, a bar each */
    const CH = [[50, 57, 61, 66], [47, 54, 57, 62], [43, 50, 54, 59], [45, 52, 61, 64]];
    const ROOT = [38, 35, 31, 33];
    const keys = (t0, m, dur, g) => { let ph = 0; let mp = 0; const f = m2f(m); voice(t0, dur + 0.6, (t) => { mp += f / sr; const idx = 1.8 * Math.exp(-t * 3); ph += f / sr; const env = Math.min(1, t * 200) * Math.exp(-t * 1.1) * (t > dur ? Math.exp(-(t - dur) * 8) : 1); return Math.sin(TAU * ph + idx * Math.sin(TAU * mp)) * env * (1 + 0.12 * Math.sin(TAU * 4.5 * t)); }, g, (m % 5) / 5 - 0.4, 0.45); };
    const bass = (t0, m, dur) => { let ph = 0; const f = m2f(m); voice(t0, dur + 0.1, (t) => { ph += f / sr; const env = Math.min(1, t * 80) * (t > dur ? Math.exp(-(t - dur) * 30) : 1); return Math.tanh(Math.sin(TAU * ph) * 1.6) * env; }, 0.32); };
    for (let bar = 0; bar < 32; bar++) {
      const t0 = bar * 2.5;
      const c = bar % 4;
      if (inBeat(t0 + 0.1) || (t0 >= 20 && t0 < 25)) {
        for (const m of CH[c]) { keys(t0, m, 1.5, 0.05); keys(t0 + BEAT * 2.5, m, 0.3, 0.035); }
        if (inBeat(t0 + 0.1)) { bass(t0, ROOT[c], 0.55); bass(t0 + BEAT * 1.5, ROOT[c], 0.25); bass(t0 + BEAT * 2, ROOT[c] + 12, 0.25); bass(t0 + BEAT * 3, ROOT[c], 0.5); }
      }
    }

    /* tanpura, the whole way through */
    const tanpura = (t0, m) => { let ph = 0; const f = m2f(m); voice(t0, 3.5, (t) => { ph += (f * (1 + 0.0015 * Math.sin(t * 5))) / sr; return look(TANP, ph) * Math.min(1, t * 40) * Math.exp(-t * 0.9); }, 0.055, -0.3, 0.6); };
    for (let c = 0; c < 32; c++) {
      const t0 = c * 2.5;
      tanpura(t0, 45); tanpura(t0 + 0.6, 50); tanpura(t0 + 1.2, 50); tanpura(t0 + 1.9, 38);
    }

    /* the bansuri: D Yaman — D E F# G# A B C# */
    const flute = (t0, m, dur, g = 0.16) => {
      let ph = 0;
      let lp = 0;
      const f = m2f(m);
      voice(t0, dur + 0.25, (t) => {
        const vib = 1 + Math.min(1, t / 0.4) * 0.006 * Math.sin(TAU * 5.4 * t);
        const scoop = 1 - 0.03 * Math.exp(-t * 18);
        ph += (f * vib * scoop) / sr;
        const env = Math.min(1, t / 0.07) * (t > dur ? Math.exp(-(t - dur) * 14) : 1);
        const n = noiseFn();
        lp += (n - lp) * 0.08;
        return (Math.sin(TAU * ph) + 0.22 * Math.sin(2 * TAU * ph) + 0.07 * Math.sin(3 * TAU * ph) + lp * 0.5) * env;
      }, g, 0.15, 0.7);
    };
    const phrase = (t0, notes, g) => notes.forEach(([dt, m, d]) => flute(t0 + dt, m, d, g));
    const INTRO = [[0, 73, 0.55], [0.6, 76, 0.45], [1.1, 78, 1.3], [2.5, 76, 0.4], [2.95, 74, 1.7]];
    const M1 = [[0, 78, 0.35], [0.4, 80, 0.28], [0.7, 81, 0.9], [1.7, 78, 0.45], [2.2, 76, 1.2]];
    const M2 = [[0, 81, 0.45], [0.5, 83, 0.35], [0.9, 85, 0.55], [1.5, 86, 1.3], [2.9, 85, 0.28], [3.2, 83, 1.0]];
    const M3 = [[0, 76, 0.35], [0.4, 78, 0.35], [0.8, 76, 0.28], [1.1, 74, 0.45], [1.6, 73, 0.35], [2.0, 74, 1.4]];
    phrase(0.1, INTRO, 0.13);
    phrase(20.3, M2, 0.16);
    phrase(29.9, M1, 0.13);
    phrase(40.0, M3, 0.13);
    phrase(50.0, M1, 0.13);
    phrase(58.3, M3, 0.13);
    phrase(66.0, M2.map(([d, m, l]) => [d, m, l]), 0.14);
    phrase(70.4, M1, 0.15);
    phrase(75.4, INTRO, 0.15);

    /* the conch: Panchajanya, once for the war and once for the vision */
    const conch = (t0, dur, g) => { let ph = 0; voice(t0, dur, (t) => { const f = 233 * (1 + 0.04 * Math.min(1, t / 0.8)) * (1 + 0.004 * Math.sin(TAU * 5 * t)); ph += f / sr; const env = Math.min(1, t / 0.5) * Math.min(1, (dur - t) / 0.6); return look(CONCH, ph) * env; }, g, 0, 0.8); };
    conch(15.0, 2.4, 0.2);
    conch(64.4, 3.2, 0.22);

    /* the choir, for the vision */
    for (const m of [50, 57, 62, 66]) {
      let ph = 0;
      const f = m2f(m);
      voice(64.4, 5.8, (t) => { ph += (f * (1 + 0.003 * Math.sin(TAU * 4.8 * t + m))) / sr; return look(CHOIR, ph) * Math.min(1, t / 0.6) * Math.min(1, (5.8 - t) / 1.2); }, 0.05, (m - 58) / 12, 0.9);
    }

    /* bells */
    const bell = (t0, m, g = 0.08) => { const f = m2f(m); voice(t0, 2.5, (t) => (Math.sin(TAU * f * t) + 0.5 * Math.sin(TAU * f * 2.76 * t) * Math.exp(-t * 2) + 0.25 * Math.sin(TAU * f * 5.4 * t) * Math.exp(-t * 4)) * Math.exp(-t * 1.6), g, 0.2, 0.8); };
    for (const [at, m] of [[20.4, 86], [64.4, 74], [65.65, 81], [66.9, 78], [68.15, 86], [75.2, 86]]) bell(at, m);

    /* effects */
    const whoosh = (t0, dur, up = true, g = 0.25) => { let lp = 0; let bp = 0; voice(t0, dur, (t) => { const u = t / dur; const fc = up ? 300 + u * u * 5000 : 5000 - u * 4700; const k = (TAU * fc) / sr; const n = noiseFn(); lp += k * bp; const hp = n - lp - bp * 0.6; bp += k * hp; return bp * (up ? u * u : 1 - u) * 1.2; }, g, 0, 0.4); };
    const impact = (t0, g = 1) => { kick(t0, 1.4 * g); let ph = 0; voice(t0, 1.6, (t) => { ph += (70 * Math.exp(-t * 1.5) + 30) / sr; return Math.sin(TAU * ph) * Math.exp(-t * 2.2); }, 0.5 * g); voice(t0, 0.6, (t) => noiseFn() * Math.exp(-t * 9), 0.18 * g, 0, 0.8); };
    const pop = (t0, f = 900) => { let ph = 0; voice(t0, 0.12, (t) => { ph += (f + 900 * t * 8) / sr; return Math.sin(TAU * ph) * Math.exp(-t * 40); }, 0.22, 0.1); };
    for (const at of [25, 35, 45, 55]) { whoosh(at - 0.9, 0.9, true, 0.2); impact(at); }
    whoosh(61.25, 2.5, true, 0.3);
    impact(64.4, 1.5);
    whoosh(4.2, 0.8, true, 0.18);
    whoosh(70.0, 0.8, false, 0.18);
    for (const at of [10.55, 11.55, 12.45]) pop(at, 900 + hash(at) * 500);
    for (let i = 0; i < 10; i++) voice(12.45 + i * 0.055 + hash(i) * 0.02, 0.02, (t) => noiseFn() * Math.exp(-t * 400), 0.12, 0.2);
    for (let i = 0; i < 4; i++) pop(28.8 + i * BEAT * 2, 700 + i * 120);
    pop(48.1, 1100); pop(49.6, 1300);
    // vinyl crackle
    voice(0, DURATION, (t) => (rnd() < 0.0009 ? (rnd() * 2 - 1) * 0.9 : 0) + noiseFn() * 0.004, 0.25, 0);

    let done = 0;
    for (const j of jobs) {
      j();
      done++;
      if (onProgress && done % 60 === 0) { onProgress(done / jobs.length); await new Promise((r) => setTimeout(r, 0)); }
    }
    reverb(SL, SR, L, R, sr);
    // a little tape: soft saturation and a gentle top-end roll-off
    let pl = 0;
    let pr = 0;
    let peak = 0;
    for (let i = 0; i < N; i++) {
      pl += (L[i] - pl) * 0.55;
      pr += (R[i] - pr) * 0.55;
      L[i] = Math.tanh(pl * 1.1);
      R[i] = Math.tanh(pr * 1.1);
      peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
    }
    const norm = 0.9 / (peak || 1);
    for (let i = 0; i < N; i++) {
      const t = i / sr;
      const fade = t > DURATION - 1.2 ? clamp((DURATION + 0.2 - t) / 1.4) : 1;
      L[i] *= norm * fade;
      R[i] *= norm * fade;
    }
    if (onProgress) onProgress(1);
    return { L, R, sr };
  }

  function reverb(inL, inR, outL, outR, sr) {
    const scale = sr / 44100;
    const combs = [1617, 1557, 1491, 1422, 1356, 1277, 1188, 1116];
    const alls = [556, 441, 341, 225];
    for (const [inp, out, spread] of [[inL, outL, 0], [inR, outR, 23]]) {
      const wet = new Float32Array(inp.length);
      for (const c of combs) {
        const n = Math.round((c + spread) * scale * 1.2);
        const buf = new Float32Array(n);
        let idx = 0;
        let store = 0;
        for (let i = 0; i < inp.length; i++) {
          const y = buf[idx];
          store = y * 0.5 + store * 0.5;
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
      for (let i = 0; i < out.length; i++) out[i] += wet[i] * 0.045;
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

  const FILM = { W, H, DURATION, frame, synth, wavBytes };
  window[(document.currentScript && document.currentScript.dataset.global) || 'FILM'] = FILM;

  const params = new URLSearchParams(location.search);
  if (params.has('render')) return;

  const canvasEl = document.getElementById('c');
  if (!canvasEl) return;
  const ctx = canvasEl.getContext('2d');
  const ui = document.getElementById('ui');
  const playBtn = document.getElementById('play');
  const note = document.getElementById('note');
  const bar = document.getElementById('bar');
  const fill = document.getElementById('fill');
  const idle = note.textContent;

  let scl = 1;
  function fit() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const s = Math.min(window.innerWidth / W, (window.innerHeight - 8) / H);
    const cw = Math.floor(W * s);
    const ch = Math.floor(H * s);
    canvasEl.style.width = cw + 'px';
    canvasEl.style.height = ch + 'px';
    canvasEl.width = Math.floor(cw * dpr);
    canvasEl.height = Math.floor(ch * dpr);
    scl = (cw * dpr) / W;
    if (bar) bar.style.width = cw + 'px';
  }
  const still = params.has('t') ? Number(params.get('t')) : Number(canvasEl.dataset.poster || 0);
  let mode = 'still';
  let shown = still;
  function draw(t) {
    shown = t;
    ctx.setTransform(scl, 0, 0, scl, 0, 0);
    frame(ctx, t);
    if (fill) fill.style.width = `${(t / DURATION) * 100}%`;
  }
  window.addEventListener('resize', () => { fit(); if (mode !== 'film') draw(shown); });
  fit();
  draw(still);

  let samples = null;
  let making = null;
  const make = () => {
    if (!making) {
      making = synth(44100, (p) => { if (mode === 'still' && !samples) note.textContent = `composing the score… ${Math.round(p * 100)}%`; })
        .then((s) => { samples = s; if (mode === 'still') note.textContent = idle; return s; });
    }
    return making;
  };
  setTimeout(make, 300);

  let actx = null;
  let buffer = null;
  let src = null;
  let t0 = 0;
  let raf = 0;
  function loop() {
    const t = actx.currentTime - t0;
    draw(clamp(t, 0, DURATION));
    if (t >= DURATION) {
      mode = 'still';
      ui.classList.remove('is-hidden');
      playBtn.textContent = '↺ watch again';
      return;
    }
    raf = requestAnimationFrame(loop);
  }
  async function play(from = 0) {
    playBtn.disabled = true;
    if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
    await actx.resume();
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
    const at = actx.currentTime + 0.08;
    src.start(at, from);
    t0 = at - from;
    mode = 'film';
    ui.classList.add('is-hidden');
    playBtn.disabled = false;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(loop);
  }
  playBtn.addEventListener('click', () => play(0));
  canvasEl.addEventListener('click', () => {
    if (mode !== 'film' || !actx) return;
    if (actx.state === 'running') actx.suspend(); else actx.resume();
  });
  if (bar) {
    bar.addEventListener('click', (e) => {
      const r = bar.getBoundingClientRect();
      const t = clamp((e.clientX - r.left) / r.width) * DURATION;
      if (mode === 'film') play(t); else draw(t);
    });
  }
  window.addEventListener('keydown', (e) => {
    if (e.key === ' ') {
      e.preventDefault();
      if (mode !== 'film') play(0);
      else if (actx.state === 'running') actx.suspend(); else actx.resume();
    }
    if (e.key === 'r' || e.key === 'R') play(0);
    if (mode === 'film' && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) play(clamp(shown + (e.key === 'ArrowRight' ? 5 : -5), 0, DURATION - 0.5));
  });
})();
