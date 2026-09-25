/**
 * Ramayana — a short anime film, in plain JavaScript.
 *
 * Everything on screen is drawn on a 2D canvas each frame; every sound is
 * synthesised in this script. No libraries, no images, no audio files.
 *
 * The look is the look of a certain kind of Japanese feature animation:
 * painted skies with lit cloud-bellies and god rays, figures as cel
 * silhouettes with a hard rim of light on the side facing the sun, focus
 * lines, impact frames, extreme close-ups of eyes, petals and embers in the
 * air, grain over all of it. The story is Valmiki's, told in twenty-odd shots.
 *
 * Every frame is a pure function of its timestamp — every "random" thing is a
 * hash — so the page plays it live and scripts/render-ramayana-anime.mjs asks
 * it for frame n at n/30 s and gets the same picture.
 */
(() => {
  'use strict';

  const W = 1920;
  const H = 1080;
  const DURATION = 114;
  const TAU = Math.PI * 2;

  /* ══════════════════════════════════════════════════════════════════════
     arithmetic
     ══════════════════════════════════════════════════════════════════════ */

  const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
  const lerp = (a, b, t) => a + (b - a) * t;
  const prog = (t, a, b) => clamp((t - a) / (b - a));
  const eOut = (t) => 1 - (1 - t) * (1 - t);
  const eOut3 = (t) => 1 - Math.pow(1 - t, 3);
  const eIn = (t) => t * t;
  const eInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  const bump = (t, a, b, f = 0.2) => Math.min(prog(t, a, a + f), 1 - prog(t, b - f, b));
  function hash(n) {
    const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return s - Math.floor(s);
  }
  const h2 = (a, b) => hash(a * 17.13 + b * 91.7);
  function mulberry(seed) {
    let a = seed >>> 0;
    return () => {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const mod = (x, m) => ((x % m) + m) % m;

  function rgb(hex) {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const rgba = (hex, a) => { const [r, g, b] = rgb(hex); return `rgba(${r},${g},${b},${a})`; };
  function mix(h1, h2_, t) {
    const a = rgb(h1);
    const b = rgb(h2_);
    const c = a.map((v, i) => Math.round(lerp(v, b[i], t)));
    return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
  }

  const can = (w, h) => {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  };

  /* ══════════════════════════════════════════════════════════════════════
     the painter's kit
     ══════════════════════════════════════════════════════════════════════ */

  function sky(ctx, stops, y0 = 0, y1 = H) {
    const g = ctx.createLinearGradient(0, y0, 0, y1);
    for (const [p, c] of stops) g.addColorStop(p, c);
    ctx.fillStyle = g;
    ctx.fillRect(-200, -200, W + 400, H + 400);
  }

  function glow(ctx, x, y, r, color, a = 1) {
    if (r <= 0 || a <= 0) return;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, rgba(color, a));
    g.addColorStop(0.35, rgba(color, a * 0.35));
    g.addColorStop(1, rgba(color, 0));
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  function sun(ctx, x, y, r, core, halo, a = 1) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, x, y, r * 9, halo, 0.22 * a);
    glow(ctx, x, y, r * 3.2, halo, 0.45 * a);
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  /** Long soft wedges of light out of a bright point. */
  function rays(ctx, x, y, t, o = {}) {
    const n = o.n || 14;
    const len = o.len || 1800;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < n; i++) {
      const a0 = (o.a0 == null ? 0 : o.a0) + (i / n) * (o.span || TAU) + Math.sin(t * 0.15 + i * 1.7) * 0.03;
      const w = (0.02 + hash(i * 3.3) * 0.05) * (o.wide || 1);
      const al = (o.alpha || 0.12) * (0.4 + 0.6 * hash(i * 7.1)) * (0.75 + 0.25 * Math.sin(t * 0.7 + i));
      const g = ctx.createRadialGradient(x, y, 0, x, y, len);
      g.addColorStop(0, rgba(o.color || '#fff4d8', al));
      g.addColorStop(1, rgba(o.color || '#fff4d8', 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(a0 - w) * len, y + Math.sin(a0 - w) * len);
      ctx.lineTo(x + Math.cos(a0 + w) * len, y + Math.sin(a0 + w) * len);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  /**
   * A painted cumulus, cached as a sprite: a shadowed body, lit tops towards
   * the light, and a hard rim where the light grazes the edge.
   */
  const cloudCache = new Map();
  function cloudSprite(seed, w, h, pal, lx = 0, ly = -1) {
    const key = [seed, w, h, pal.light, pal.mid, pal.dark, pal.rim, lx, ly].join('|');
    if (cloudCache.has(key)) return cloudCache.get(key);
    const pad = 40;
    const c = can(w + pad * 2, h + pad * 2);
    const g = c.getContext('2d');
    g.translate(pad, pad);
    const r = mulberry(seed * 9973 + 1);
    const puffs = [];
    const n = 9 + Math.floor(r() * 7);
    for (let i = 0; i < n; i++) {
      const u = (i + 0.5) / n;
      const dome = Math.sin(u * Math.PI);
      const rad = (0.16 + 0.22 * dome * (0.6 + r() * 0.6)) * h;
      puffs.push([u * w * 0.86 + w * 0.07 + (r() - 0.5) * w * 0.05, h - rad * 0.9 - dome * h * 0.28 * r(), rad]);
    }
    for (let i = 0; i < 5; i++) puffs.push([w * (0.25 + r() * 0.5), h * (0.3 + r() * 0.25), h * (0.2 + r() * 0.12)]);
    const shape = new Path2D();
    for (const [x, y, rr] of puffs) { shape.moveTo(x + rr, y); shape.arc(x, y, rr, 0, TAU); }
    shape.moveTo(w * 0.92, h * 0.8);
    shape.ellipse(w / 2, h * 0.8, w * 0.42, h * 0.17, 0, 0, TAU);
    const base = g.createLinearGradient(0, ly < 0 ? h : 0, 0, ly < 0 ? 0 : h);
    base.addColorStop(0, pal.dark);
    base.addColorStop(1, pal.mid);
    g.fillStyle = base;
    g.fill(shape);
    g.save();
    g.clip(shape);
    for (const [x, y, rr] of puffs) {
      const gx = x + lx * rr * 0.35;
      const gy = y + ly * rr * 0.35;
      const lg = g.createRadialGradient(gx, gy, 0, gx, gy, rr * 0.95);
      lg.addColorStop(0, rgba(pal.light, 0.95));
      lg.addColorStop(0.55, rgba(pal.light, 0.55));
      lg.addColorStop(1, rgba(pal.light, 0));
      g.fillStyle = lg;
      g.beginPath();
      g.arc(gx, gy, rr, 0, TAU);
      g.fill();
    }
    g.restore();
    // the rim: the body, less itself shifted away from the light, leaves a
    // thin crescent along the edge the light grazes
    const rim = can(w + pad * 2, h + pad * 2);
    const rg = rim.getContext('2d');
    rg.translate(pad, pad);
    rg.fillStyle = pal.rim;
    rg.fill(shape);
    rg.globalCompositeOperation = 'destination-out';
    rg.translate(-lx * 6, -ly * 6);
    rg.fill(shape);
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalAlpha = 0.9;
    g.drawImage(rim, 0, 0);
    g.globalAlpha = 1;
    const out = { c, pad, w, h };
    cloudCache.set(key, out);
    return out;
  }
  function cloud(ctx, x, y, s, seed, w, h, pal, lx, ly, a = 1) {
    const sp = cloudSprite(seed, w, h, pal, lx, ly);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.drawImage(sp.c, x - (sp.pad + w / 2) * s, y - (sp.pad + h) * s, sp.c.width * s, sp.c.height * s);
    ctx.restore();
  }

  /** Radial focus lines, redrawn a dozen times a second like a hand-drawn cel. */
  function focusLines(ctx, cx, cy, t, o = {}) {
    const n = o.n || 110;
    const seed = Math.floor(t * (o.rate || 14));
    const rIn = o.rIn || 320;
    ctx.save();
    ctx.fillStyle = o.color || '#ffffff';
    ctx.globalAlpha = o.alpha == null ? 0.85 : o.alpha;
    for (let i = 0; i < n; i++) {
      const a = hash(i * 13.1 + seed * 7.7) * TAU;
      const w = (0.002 + hash(i * 3.7 + seed) * 0.012) * (o.thick || 1);
      const r0 = rIn * (0.8 + hash(i * 5.1 + seed * 3.3) * 0.9);
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
      ctx.lineTo(cx + Math.cos(a - w) * 2600, cy + Math.sin(a - w) * 2600);
      ctx.lineTo(cx + Math.cos(a + w) * 2600, cy + Math.sin(a + w) * 2600);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  /** Parallel speed streaks, moving along angle `ang`. */
  function streaks(ctx, t, o = {}) {
    const n = o.n || 70;
    const ang = o.ang || 0;
    const sp = o.speed || 5000;
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.rotate(ang);
    ctx.strokeStyle = o.color || '#ffffff';
    ctx.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const y = (hash(i * 2.3) - 0.5) * H * 1.8;
      const len = 150 + hash(i * 4.1) * 700;
      const x = mod(hash(i * 6.7) * 5000 - t * sp * (0.6 + hash(i * 8.9) * 0.8), 5000) - 2500;
      ctx.globalAlpha = (o.alpha || 0.5) * (0.3 + hash(i * 9.3) * 0.7);
      ctx.lineWidth = 1 + hash(i * 1.9) * (o.thick || 4);
      ctx.beginPath();
      ctx.moveTo(-x, y);
      ctx.lineTo(-x + len, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  /** An impact frame: the picture inverted and bled of colour, with shards of black. */
  function impactFrame(ctx, t, seed, cx = W / 2, cy = H / 2) {
    const k = Math.floor(t * 18) % 3;
    ctx.save();
    if (k !== 1) {
      ctx.globalCompositeOperation = 'difference';
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-200, -200, W + 400, H + 400);
    }
    ctx.globalCompositeOperation = 'saturation';
    ctx.fillStyle = '#808080';
    ctx.fillRect(-200, -200, W + 400, H + 400);
    ctx.globalCompositeOperation = 'source-over';
    if (k === 1) {
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = '#b01818';
      ctx.fillRect(-200, -200, W + 400, H + 400);
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.fillStyle = k === 2 ? '#ffffff' : '#000000';
    const s = seed + Math.floor(t * 18);
    for (let i = 0; i < 14; i++) {
      const a = hash(i * 3.1 + s) * TAU;
      const w = 0.02 + hash(i * 5.3 + s) * 0.05;
      const r0 = 120 + hash(i * 7.7 + s) * 260;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
      ctx.lineTo(cx + Math.cos(a - w) * 2400, cy + Math.sin(a - w) * 2400);
      ctx.lineTo(cx + Math.cos(a + w * 0.3) * 2400, cy + Math.sin(a + w * 0.3) * 2400);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  /** Hand-held shake, decaying from `at`. */
  function shake(t, at, amt, dur = 0.8) {
    if (t < at) return [0, 0];
    const k = Math.max(0, 1 - (t - at) / dur);
    const f = Math.floor(t * 30);
    return [(hash(f * 1.3) - 0.5) * amt * k * k, (hash(f * 2.9) - 0.5) * amt * k * k];
  }

  /** Falling petals — marigold and rose. */
  function petals(ctx, t, o = {}) {
    const n = o.n || 60;
    const cols = o.colors || ['#ff9a3c', '#ffc23d', '#ff6f91', '#ffe0ea'];
    for (let i = 0; i < n; i++) {
      const sp = 60 + hash(i * 3.3) * 120;
      const x = mod(hash(i * 1.1) * (W + 300) + t * (o.wind || 40) + Math.sin(t * 1.3 + i) * 50, W + 300) - 150;
      const y = mod(hash(i * 2.2) * (H + 300) + t * sp * (o.fall || 1), H + 300) - 150;
      const s = (6 + hash(i * 4.4) * 10) * (o.size || 1);
      const rot = t * (1 + hash(i * 5.5) * 3) + i;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.scale(1, 0.35 + 0.65 * Math.abs(Math.sin(t * 2.3 + i)));
      ctx.fillStyle = cols[i % cols.length];
      ctx.globalAlpha = o.alpha || 0.9;
      ctx.beginPath();
      ctx.ellipse(0, 0, s, s * 0.6, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }

  /** Sparks that rise and flicker: embers, fireflies, motes. */
  function motes(ctx, t, o = {}) {
    const n = o.n || 50;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < n; i++) {
      const sp = (o.rise || 40) * (0.5 + hash(i * 2.7));
      const x0 = (o.x0 || 0) + hash(i * 1.9) * (o.w || W);
      const y0 = (o.y0 || 0) + hash(i * 3.9) * (o.h || H);
      const x = x0 + Math.sin(t * (0.6 + hash(i) * 1.2) + i * 2) * (o.sway || 30) + t * (o.drift || 0);
      const y = mod(y0 - t * sp - (o.y0 || 0), o.h || H) + (o.y0 || 0);
      const fl = 0.5 + 0.5 * Math.sin(t * (2 + hash(i * 6.1) * 5) + i * 3);
      const r = (o.r || 3) * (0.5 + hash(i * 8.3));
      glow(ctx, x, y, r * 6, o.color || '#ffb347', (o.alpha || 0.7) * fl);
      ctx.fillStyle = rgba(o.core || '#fff3c4', (o.alpha || 0.7) * fl);
      ctx.beginPath();
      ctx.arc(x, y, r * 0.6, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  /** A bokeh field: soft discs out of focus. */
  function bokeh(ctx, t, o = {}) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < (o.n || 24); i++) {
      const x = mod(hash(i * 4.7) * W + t * (o.drift || 8) * (hash(i) - 0.3), W + 200) - 100;
      const y = hash(i * 7.3) * H;
      const r = 20 + hash(i * 9.1) * 70;
      const c = (o.colors || ['#ffd18a', '#ff9ec4', '#a0c8ff'])[i % (o.colors || [1, 2, 3]).length];
      ctx.fillStyle = rgba(c, (o.alpha || 0.1) * (0.6 + 0.4 * Math.sin(t + i)));
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function lightning(ctx, x0, y0, x1, y1, seed, a) {
    if (a <= 0) return;
    const pts = [[x0, y0]];
    const n = 14;
    for (let i = 1; i < n; i++) {
      const u = i / n;
      pts.push([lerp(x0, x1, u) + (hash(seed + i * 3.1) - 0.5) * 140, lerp(y0, y1, u) + (hash(seed + i * 5.3) - 0.5) * 30]);
    }
    pts.push([x1, y1]);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineJoin = 'round';
    for (const [w, al, c] of [[18, 0.15, '#9fb8ff'], [7, 0.4, '#cfe0ff'], [2.5, 1, '#ffffff']]) {
      ctx.strokeStyle = rgba(c, al * a);
      ctx.lineWidth = w;
      ctx.beginPath();
      pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.stroke();
      for (let b = 0; b < 3; b++) {
        const i = 3 + Math.floor(hash(seed + b * 11) * (n - 6));
        const [bx, by] = pts[i];
        ctx.beginPath();
        ctx.moveTo(bx, by);
        let px = bx;
        let py = by;
        for (let k = 0; k < 4; k++) {
          px += (hash(seed + b * 7 + k) - 0.3) * 90;
          py += 40 + hash(seed + b * 13 + k) * 50;
          ctx.lineTo(px, py);
        }
        ctx.lineWidth = w * 0.5;
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  /** A flame, as a teardrop that breathes. */
  function flame(ctx, x, y, s, t, seed = 0, a = 1) {
    const fl = 1 + 0.08 * Math.sin(t * 13 + seed) + 0.05 * Math.sin(t * 29 + seed * 2);
    const lean = Math.sin(t * 3.1 + seed) * 0.12 * s;
    const hgt = s * 2.4 * fl;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, x, y - hgt * 0.4, s * 7, '#ff9a2a', 0.35 * a);
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = a;
    const g = ctx.createLinearGradient(x, y, x, y - hgt);
    g.addColorStop(0, '#ff7a18');
    g.addColorStop(0.35, '#ffd25a');
    g.addColorStop(1, 'rgba(255,240,200,0.2)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x - s * 0.55, y);
    ctx.bezierCurveTo(x - s * 0.7, y - hgt * 0.45, x + lean - s * 0.1, y - hgt * 0.8, x + lean, y - hgt);
    ctx.bezierCurveTo(x + lean + s * 0.1, y - hgt * 0.8, x + s * 0.7, y - hgt * 0.45, x + s * 0.55, y);
    ctx.quadraticCurveTo(x, y + s * 0.35, x - s * 0.55, y);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,235,0.9)';
    ctx.beginPath();
    ctx.ellipse(x + lean * 0.4, y - hgt * 0.22, s * 0.22, s * 0.5 * fl, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  /** A clay diya with its flame. */
  function diya(ctx, x, y, s, t, seed = 0, a = 1) {
    ctx.save();
    ctx.globalAlpha = a;
    const g = ctx.createLinearGradient(x, y - s * 0.4, x, y + s * 0.7);
    g.addColorStop(0, '#d4722e');
    g.addColorStop(1, '#4a1c0c');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x - s * 1.4, y - s * 0.15);
    ctx.quadraticCurveTo(x - s * 1.1, y + s * 0.75, x, y + s * 0.7);
    ctx.quadraticCurveTo(x + s * 1.1, y + s * 0.75, x + s * 1.6, y - s * 0.3);
    ctx.lineTo(x + s * 0.9, y - s * 0.1);
    ctx.quadraticCurveTo(x, y + s * 0.05, x - s * 1.4, y - s * 0.15);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,190,110,0.8)';
    ctx.beginPath();
    ctx.ellipse(x - s * 0.1, y - s * 0.08, s * 1.1, s * 0.16, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
    flame(ctx, x + s * 1.25, y - s * 0.3, s * 0.42, t, seed, a);
  }

  /** Text with an outline, the way subtitles and title cards are lettered. */
  const SANS = "'Avenir Next', 'Futura', 'Montserrat', 'Helvetica Neue', 'Liberation Sans', Arial, sans-serif";
  const SERIF = "'Cormorant Garamond', 'Palatino Linotype', Palatino, 'Book Antiqua', 'Liberation Serif', Georgia, serif";
  const DEVA = "'Noto Serif Devanagari', 'Kohinoor Devanagari', 'Nirmala UI', 'Mangal', 'Devanagari MT', FreeSerif, serif";

  function wrapText(ctx, text, maxW) {
    const words = text.split(' ');
    const lines = [];
    let cur = '';
    for (const w of words) {
      const next = cur ? cur + ' ' + w : w;
      if (ctx.measureText(next).width > maxW && cur) { lines.push(cur); cur = w; } else cur = next;
    }
    if (cur) lines.push(cur);
    return lines;
  }

  /* ══════════════════════════════════════════════════════════════════════
     figures
     A body is a skeleton of capsules in units of its own height, feet at
     the origin, facing +x. It is drawn in one flat colour, twice, and the
     second pass is shifted away from the light: what the first pass leaves
     showing is the rim.
     ══════════════════════════════════════════════════════════════════════ */

  const SCR = can(2200, 2200);
  const sg = SCR.getContext('2d');

  /**
   * Draw `paint(g, colour)` — which draws around (0, 0) — at (x, y), as a
   * dark cel with a rim of light on the side the light comes from.
   */
  function lit(ctx, x, y, box, paint, o) {
    const [bx, by, bw, bh] = box.map(Math.round);
    const w = Math.min(bw, SCR.width);
    const h = Math.min(bh, SCR.height);
    sg.setTransform(1, 0, 0, 1, 0, 0);
    sg.globalCompositeOperation = 'source-over';
    sg.clearRect(0, 0, w, h);
    sg.setTransform(1, 0, 0, 1, -bx, -by);
    paint(sg, o.rim);
    sg.globalCompositeOperation = 'source-atop';
    sg.setTransform(1, 0, 0, 1, -bx + (o.dx || 0), -by + (o.dy || 0));
    paint(sg, o.dark);
    if (o.fill) {
      // a second, softer tone on the lit half, for figures seen by daylight
      sg.setTransform(1, 0, 0, 1, 0, 0);
      const gr = sg.createLinearGradient(o.dx > 0 ? 0 : w, 0, o.dx > 0 ? w : 0, 0);
      gr.addColorStop(0, rgba(o.fill, 0.55));
      gr.addColorStop(0.6, rgba(o.fill, 0));
      sg.fillStyle = gr;
      sg.fillRect(0, 0, w, h);
    }
    sg.globalCompositeOperation = 'source-over';
    sg.setTransform(1, 0, 0, 1, 0, 0);
    if (o.glow) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = o.glowA || 0.5;
      ctx.filter = `blur(${o.glow}px)`;
      ctx.drawImage(SCR, 0, 0, w, h, x + bx, y + by, w, h);
      ctx.restore();
    }
    ctx.save();
    if (o.alpha != null) ctx.globalAlpha = o.alpha;
    ctx.drawImage(SCR, 0, 0, w, h, x + bx, y + by, w, h);
    ctx.restore();
  }

  function limb(g, x, y, a1, l1, a2, l2, w1, w2) {
    const kx = x + Math.sin(a1) * l1;
    const ky = y + Math.cos(a1) * l1;
    const fx = kx + Math.sin(a2) * l2;
    const fy = ky + Math.cos(a2) * l2;
    g.lineWidth = w1;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(kx, ky);
    g.stroke();
    g.lineWidth = w2;
    g.beginPath();
    g.moveTo(kx, ky);
    g.lineTo(fx, fy);
    g.stroke();
    return [fx, fy, kx, ky];
  }

  function ribbon(g, pts, w0, w1) {
    const L = [];
    const R = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[Math.max(0, i - 1)];
      const b = pts[Math.min(pts.length - 1, i + 1)];
      const an = Math.atan2(b[1] - a[1], b[0] - a[0]) + Math.PI / 2;
      const w = lerp(w0, w1, i / (pts.length - 1)) / 2;
      L.push([pts[i][0] + Math.cos(an) * w, pts[i][1] + Math.sin(an) * w]);
      R.push([pts[i][0] - Math.cos(an) * w, pts[i][1] - Math.sin(an) * w]);
    }
    g.beginPath();
    L.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    for (let i = R.length - 1; i >= 0; i--) g.lineTo(R[i][0], R[i][1]);
    g.closePath();
    g.fill();
  }

  /**
   * A bow, in body units: grip at (x, y), limbs along angle `ang`. The tips
   * sweep back towards the archer; the string runs between them and is drawn
   * back a further `pull`.
   */
  function bowShape(g, x, y, ang, size, pull, w) {
    const ux = Math.cos(ang);
    const uy = Math.sin(ang);
    const nx = -uy; // towards the archer
    const ny = ux;
    const back = size * 0.3;
    const tip = (s) => [x + s * ux * size + nx * back, y + s * uy * size + ny * back];
    const [ax, ay] = tip(1);
    const [bx, by] = tip(-1);
    g.lineWidth = w;
    g.beginPath();
    g.moveTo(ax, ay);
    g.bezierCurveTo(x + ux * size * 0.75 + nx * back * 0.35, y + uy * size * 0.75 + ny * back * 0.35, x + ux * size * 0.25, y + uy * size * 0.25, x, y);
    g.bezierCurveTo(x - ux * size * 0.25, y - uy * size * 0.25, x - ux * size * 0.75 + nx * back * 0.35, y - uy * size * 0.75 + ny * back * 0.35, bx, by);
    g.stroke();
    g.lineWidth = w * 0.25;
    g.beginPath();
    g.moveTo(ax, ay);
    g.lineTo(x + nx * (back + size * pull), y + ny * (back + size * pull));
    g.lineTo(bx, by);
    g.stroke();
  }

  /** The poses, as joint angles. Angles are from straight down; positive swings forward. */
  function walkPose(ph, stride = 0.42) {
    const s = Math.sin(ph);
    const c = Math.cos(ph);
    return {
      legs: [[s * stride, Math.max(0, -c) * 0.7 + 0.05], [-s * stride, Math.max(0, c) * 0.7 + 0.05]],
      arms: [[-s * 0.35, 0.25], [s * 0.35, 0.25]],
      bob: Math.abs(c) * 0.012,
      lean: 0.02,
    };
  }
  const POSES = {
    stand: { legs: [[0.06, 0.04], [-0.06, 0.04]], arms: [[0.08, 0.15], [-0.05, 0.1]], lean: 0 },
    lift: { legs: [[0.18, 0.1], [-0.2, 0.05]], arms: [[Math.PI * 0.92, -0.1], [Math.PI * 1.08, 0.1]], lean: -0.01 },
    draw: { legs: [[0.3, 0.05], [-0.28, 0.02]], arms: [[Math.PI * 0.5, 0.0], [-1.45, 2.95]], lean: -0.02 },
    crouch: { legs: [[1.35, 2.3], [0.9, 2.2]], arms: [[0.9, 0.4], [-0.3, 0.6]], lean: 0.18, drop: 0.28 },
    leap: { legs: [[0.9, 2.1], [-0.35, 0.1]], arms: [[Math.PI * 0.92, 0.05], [-0.25, -0.2]], lean: 0.05 },
    garland: { legs: [[0.05, 0.04], [-0.05, 0.04]], arms: [[Math.PI * 0.62, 0.35], [Math.PI * 0.58, 0.45]], lean: 0.01 },
  };

  /**
   * One person. o = { kind, pose, t, wind }.
   * kinds: rama, laks, sita, hanu.
   */
  function person(g, col, o) {
    const P = o.pose;
    const t = o.t || 0;
    const wind = o.wind == null ? 1 : o.wind;
    const hanu = o.kind === 'hanu';
    const sita = o.kind === 'sita';
    const drop = (P.drop || 0) + (P.bob || 0);
    const lean = P.lean || 0;
    const hipY = -0.5 + drop;
    const shY = -0.82 + drop;
    const shX = lean * 0.6;
    g.save();
    g.fillStyle = col;
    g.strokeStyle = col;
    g.lineCap = 'round';
    g.lineJoin = 'round';
    // the far arm and leg first
    const legW = hanu ? 0.062 : 0.05;
    const armW = hanu ? 0.05 : 0.036;
    limb(g, 0, hipY, P.legs[1][0], 0.25, P.legs[1][0] - P.legs[1][1], 0.25, legW, legW * 0.72);
    limb(g, shX, shY + 0.02, P.arms[1][0], 0.16, P.arms[1][0] + P.arms[1][1], 0.16, armW, armW * 0.8);
    // hair and scarf, behind the body
    const bx = shX - 0.05;
    const flow = [];
    for (let i = 0; i <= 10; i++) {
      const u = i / 10;
      flow.push([bx - u * 0.2 * wind - u * 0.04, shY + 0.03 + u * 0.12 + Math.sin(t * 4 - u * 5) * 0.035 * u * wind]);
    }
    if (!hanu) ribbon(g, flow, 0.07, 0.03);
    if (sita) {
      // her braid and the end of her sari, lifted by the wind
      const br = [];
      for (let i = 0; i <= 10; i++) {
        const u = i / 10;
        br.push([shX - 0.04 - u * 0.12 * wind, shY - 0.1 + u * 0.4 + Math.sin(t * 3 - u * 4) * 0.02 * u]);
      }
      ribbon(g, br, 0.05, 0.02);
      const pal = [];
      for (let i = 0; i <= 12; i++) {
        const u = i / 12;
        pal.push([shX - 0.02 - u * 0.28 * wind, shY + 0.05 + u * 0.2 + Math.sin(t * 3.4 - u * 6) * 0.04 * u * wind]);
      }
      ribbon(g, pal, 0.12, 0.06);
    }
    if (hanu) {
      // the tail: out from the base of the spine, up, and over in a curl
      const sw = Math.sin(t * 2.2) * 0.05;
      g.lineWidth = 0.035;
      g.beginPath();
      g.moveTo(-0.05, hipY + 0.02);
      g.bezierCurveTo(-0.35, hipY + 0.05, -0.42 + sw, hipY - 0.45, -0.28 + sw, -1.05 + drop);
      g.bezierCurveTo(-0.2 + sw, -1.15 + drop, -0.12 + sw, -1.05 + drop, -0.17 + sw, -0.98 + drop);
      g.stroke();
    }
    // the near leg
    limb(g, 0.01, hipY, P.legs[0][0], 0.25, P.legs[0][0] - P.legs[0][1], 0.25, legW, legW * 0.72);
    // feet
    for (const L of P.legs) {
      const kx = Math.sin(L[0]) * 0.25;
      const ky = hipY + Math.cos(L[0]) * 0.25;
      const fx = kx + Math.sin(L[0] - L[1]) * 0.25;
      const fy = ky + Math.cos(L[0] - L[1]) * 0.25;
      g.beginPath();
      g.ellipse(fx + 0.03, fy, 0.045, 0.018, 0, 0, TAU);
      g.fill();
    }
    // the torso
    const chest = hanu ? 0.11 : 0.075;
    g.beginPath();
    g.moveTo(shX - 0.06, shY - 0.01);
    g.quadraticCurveTo(shX + chest + 0.02, shY + 0.02, shX + chest - 0.01, shY + 0.14);
    g.quadraticCurveTo(0.06, hipY - 0.04, 0.055, hipY + 0.02);
    g.lineTo(-0.055, hipY + 0.02);
    g.quadraticCurveTo(-0.06, shY + 0.12, shX - 0.06, shY - 0.01);
    g.fill();
    // the dhoti, or the sari: cloth from the waist that the wind takes backwards
    const sw = Math.sin(t * 3) * 0.02 * wind;
    g.beginPath();
    if (sita) {
      g.moveTo(0.06, hipY - 0.02);
      g.quadraticCurveTo(0.12, hipY + 0.25, 0.13 + P.legs[0][0] * 0.2, -0.02);
      g.lineTo(-0.16 - 0.08 * wind + sw, -0.01);
      g.quadraticCurveTo(-0.1, hipY + 0.2, -0.06, hipY - 0.02);
    } else if (!hanu) {
      const f = P.legs[0][0] * 0.25;
      g.moveTo(0.06, hipY - 0.02);
      g.quadraticCurveTo(0.1 + f, hipY + 0.14, 0.08 + f * 1.4, hipY + 0.26);
      g.lineTo(-0.1 - 0.06 * wind + sw, hipY + 0.24);
      g.quadraticCurveTo(-0.1, hipY + 0.1, -0.06, hipY - 0.02);
    } else {
      g.moveTo(0.06, hipY - 0.02);
      g.lineTo(0.08, hipY + 0.1);
      g.lineTo(-0.08, hipY + 0.1);
      g.lineTo(-0.06, hipY - 0.02);
    }
    g.closePath();
    g.fill();
    // neck and head
    const hx = shX + 0.02 + (P.head || 0);
    const hy = shY - 0.09;
    g.lineWidth = 0.04;
    g.beginPath();
    g.moveTo(shX, shY);
    g.lineTo(hx, hy + 0.03);
    g.stroke();
    g.beginPath();
    if (hanu) {
      g.ellipse(hx, hy, 0.07, 0.068, 0, 0, TAU);
      g.fill();
      g.beginPath();
      g.ellipse(hx + 0.06, hy + 0.025, 0.045, 0.035, 0.2, 0, TAU);
    } else {
      g.ellipse(hx, hy, 0.058, 0.066, 0, 0, TAU);
      g.fill();
      // the line of the nose and chin, so the profile reads as a face
      g.beginPath();
      g.moveTo(hx + 0.04, hy - 0.03);
      g.lineTo(hx + 0.07, hy + 0.005);
      g.lineTo(hx + 0.045, hy + 0.02);
      g.quadraticCurveTo(hx + 0.05, hy + 0.06, hx + 0.02, hy + 0.066);
      g.lineTo(hx, hy + 0.02);
    }
    g.fill();
    // hair falling to the shoulders
    if (!hanu) {
      g.beginPath();
      g.moveTo(hx - 0.02, hy - 0.06);
      g.quadraticCurveTo(hx - 0.1 - 0.03 * wind, hy + 0.02, hx - 0.07 - 0.05 * wind, hy + 0.15);
      g.lineTo(hx - 0.02, hy + 0.05);
      g.closePath();
      g.fill();
    }
    // the crown: a tall mukut for the princes and Hanuman, a small one for Sita
    g.beginPath();
    if (sita) {
      g.moveTo(hx - 0.045, hy - 0.05);
      g.lineTo(hx - 0.02, hy - 0.1);
      g.lineTo(hx, hy - 0.08);
      g.lineTo(hx + 0.02, hy - 0.1);
      g.lineTo(hx + 0.045, hy - 0.05);
    } else {
      g.moveTo(hx - 0.052, hy - 0.035);
      g.lineTo(hx - 0.06, hy - 0.075);
      g.quadraticCurveTo(hx - 0.05, hy - 0.16, hx, hy - 0.21);
      g.quadraticCurveTo(hx + 0.05, hy - 0.16, hx + 0.06, hy - 0.075);
      g.lineTo(hx + 0.052, hy - 0.035);
      g.closePath();
      g.fill();
      g.beginPath();
      g.arc(hx, hy - 0.215, 0.014, 0, TAU);
    }
    g.closePath();
    g.fill();
    // the quiver, for the two brothers
    if (o.kind === 'rama' || o.kind === 'laks') {
      g.save();
      g.translate(shX - 0.06, shY + 0.05);
      g.rotate(-0.45);
      g.fillRect(-0.025, -0.12, 0.05, 0.26);
      for (let i = 0; i < 4; i++) {
        g.beginPath();
        g.moveTo(-0.02 + i * 0.013, -0.12);
        g.lineTo(-0.028 + i * 0.013, -0.2);
        g.lineTo(-0.012 + i * 0.013, -0.2);
        g.closePath();
        g.fill();
      }
      g.restore();
    }
    // the near arm
    const [hx2, hy2] = limb(g, shX + 0.01, shY + 0.02, P.arms[0][0], 0.16, P.arms[0][0] + P.arms[0][1], 0.16, armW, armW * 0.8);
    if (hanu && o.mace !== false) {
      // the mace, held in the far hand
      const fa = P.arms[1][0] + P.arms[1][1];
      const mx = shX + Math.sin(P.arms[1][0]) * 0.16 + Math.sin(fa) * 0.16;
      const my = shY + 0.02 + Math.cos(P.arms[1][0]) * 0.16 + Math.cos(fa) * 0.16;
      g.lineWidth = 0.022;
      g.beginPath();
      g.moveTo(mx, my);
      g.lineTo(mx + Math.sin(fa) * 0.3, my + Math.cos(fa) * 0.3);
      g.stroke();
      g.beginPath();
      g.arc(mx + Math.sin(fa) * 0.36, my + Math.cos(fa) * 0.36, 0.08, 0, TAU);
      g.fill();
    }
    if (o.bow) {
      const b = o.bow;
      if (b.held === 'shoulder') bowShape(g, shX - 0.02, shY + 0.1, Math.PI / 2 + 0.25, 0.3, 0.02, 0.02);
      if (b.held === 'draw') {
        bowShape(g, hx2 + 0.01, hy2, Math.PI / 2, 0.38, b.pull == null ? 0.2 : b.pull, 0.024);
      }
    }
    g.restore();
    return { hand: [hx2, hy2], head: [hx, hy], sh: [shX, shY] };
  }

  /** A person at (x, y), `h` pixels tall, facing `f` (1 right, −1 left), rim-lit. */
  function figure(ctx, x, y, h, f, o, light) {
    const paint = (g, col) => {
      g.save();
      g.scale(h * f, h);
      person(g, col, o);
      g.restore();
    };
    const box = [-h * 0.9, -h * 1.35, h * 1.8, h * 1.45];
    lit(ctx, x, y, box, paint, light);
  }

  /** Ravana: ten crowned heads on one pair of shoulders, twenty arms fanned behind. */
  function ravanaBody(g, col, t, arms = 1) {
    g.save();
    g.fillStyle = col;
    g.strokeStyle = col;
    g.lineCap = 'round';
    g.lineJoin = 'round';
    // arms, fanned, each with something in its fist
    for (let i = 0; i < 20; i++) {
      const side = i < 10 ? -1 : 1;
      const k = i % 10;
      const a = side * (0.35 + k * 0.13 * arms) + Math.sin(t * 1.2 + i) * 0.02;
      const sx = side * 0.16;
      const sy = -0.78;
      const ex = sx + Math.sin(a) * 0.22;
      const ey = sy - Math.cos(a) * 0.1 + k * 0.012;
      const hx = ex + Math.sin(a + side * 0.4) * 0.2;
      const hy = ey - Math.cos(a + side * 0.4) * 0.22;
      g.lineWidth = 0.045;
      g.beginPath();
      g.moveTo(sx, sy);
      g.lineTo(ex, ey);
      g.lineTo(hx, hy);
      g.stroke();
      // a weapon: sword, trident, axe or mace, by turns
      g.lineWidth = 0.014;
      const wa = a * 0.8;
      const wx = hx + Math.sin(wa) * 0.2;
      const wy = hy - Math.cos(wa) * 0.2;
      g.beginPath();
      g.moveTo(hx - Math.sin(wa) * 0.05, hy + Math.cos(wa) * 0.05);
      g.lineTo(wx, wy);
      g.stroke();
      const kind = i % 4;
      g.beginPath();
      if (kind === 0) {
        g.moveTo(wx, wy);
        g.lineTo(wx + Math.sin(wa) * 0.12 - Math.cos(wa) * 0.02, wy - Math.cos(wa) * 0.12 - Math.sin(wa) * 0.02);
        g.lineTo(wx + Math.cos(wa) * 0.02, wy + Math.sin(wa) * 0.02);
        g.fill();
      } else if (kind === 1) {
        for (const d of [-0.035, 0, 0.035]) {
          g.moveTo(wx + Math.cos(wa) * d, wy + Math.sin(wa) * d);
          g.lineTo(wx + Math.cos(wa) * d * 1.3 + Math.sin(wa) * 0.07, wy + Math.sin(wa) * d * 1.3 - Math.cos(wa) * 0.07);
        }
        g.stroke();
      } else if (kind === 2) {
        g.ellipse(wx, wy, 0.045, 0.03, wa, 0, Math.PI);
        g.fill();
      } else {
        g.arc(wx, wy, 0.035, 0, TAU);
        g.fill();
      }
    }
    // body
    g.beginPath();
    g.moveTo(-0.24, -0.8);
    g.quadraticCurveTo(0, -0.86, 0.24, -0.8);
    g.lineTo(0.17, -0.45);
    g.lineTo(0.22, 0);
    g.lineTo(-0.22, 0);
    g.lineTo(-0.17, -0.45);
    g.closePath();
    g.fill();
    // heads
    for (const hd of RAVANA_HEADS) {
      g.beginPath();
      g.ellipse(hd[0], hd[1], hd[2] * 0.85, hd[2], 0, 0, TAU);
      g.fill();
      g.beginPath();
      g.moveTo(hd[0] - hd[2] * 0.8, hd[1] - hd[2] * 0.6);
      g.lineTo(hd[0] - hd[2] * 0.5, hd[1] - hd[2] * 1.7);
      g.lineTo(hd[0], hd[1] - hd[2] * 2.4);
      g.lineTo(hd[0] + hd[2] * 0.5, hd[1] - hd[2] * 1.7);
      g.lineTo(hd[0] + hd[2] * 0.8, hd[1] - hd[2] * 0.6);
      g.closePath();
      g.fill();
    }
    g.restore();
  }
  const RAVANA_HEADS = (() => {
    const out = [];
    for (let i = 0; i < 10; i++) {
      const u = (i - 4.5) / 4.5;
      const main = i === 4 || i === 5;
      out.push([u * 0.42, -0.94 + u * u * 0.08 - (main ? 0.02 : 0), main ? 0.07 : 0.058]);
    }
    return out;
  })();

  /** Twenty eyes, each a small hot coal. */
  function ravanaEyes(ctx, x, y, h, t, a = 1) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const [hx, hy, r] of RAVANA_HEADS) {
      for (const s of [-1, 1]) {
        const ex = x + (hx + s * r * 0.35) * h;
        const ey = y + (hy - r * 0.05) * h;
        const fl = 0.8 + 0.2 * Math.sin(t * 9 + hx * 40 + s);
        glow(ctx, ex, ey, r * h * 0.9, '#ff3a1a', 0.7 * a * fl);
        ctx.fillStyle = rgba('#ffe2a0', a * fl);
        ctx.beginPath();
        ctx.ellipse(ex, ey, r * h * 0.16, r * h * 0.07, -s * 0.25, 0, TAU);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  /** Jatayu: a great vulture, wings spread, feathers fingered at the tips. */
  function bird(g, col, flap) {
    g.save();
    g.fillStyle = col;
    for (const s of [-1, 1]) {
      g.beginPath();
      g.moveTo(0, -0.05);
      const up = flap * 0.25;
      g.quadraticCurveTo(s * 0.35, -0.25 - up, s * 0.9, -0.1 - up * 1.4);
      for (let k = 0; k < 7; k++) {
        const u = k / 6;
        g.lineTo(s * (0.9 - u * 0.35) + s * 0.08, -0.1 - up * 1.4 + u * 0.28 + 0.05);
        g.lineTo(s * (0.86 - u * 0.36), -0.1 - up * 1.4 + u * 0.3);
      }
      g.quadraticCurveTo(s * 0.3, 0.12, 0, 0.08);
      g.closePath();
      g.fill();
    }
    g.beginPath();
    g.ellipse(0, 0.05, 0.1, 0.22, 0, 0, TAU);
    g.fill();
    g.beginPath();
    g.moveTo(-0.08, 0.2);
    g.lineTo(0, 0.42);
    g.lineTo(0.08, 0.2);
    g.fill();
    g.beginPath();
    g.arc(0, -0.2, 0.06, 0, TAU);
    g.fill();
    g.beginPath();
    g.moveTo(0.02, -0.24);
    g.lineTo(0.0, -0.33);
    g.lineTo(-0.03, -0.22);
    g.fill();
    g.restore();
  }

  /** The golden deer, in profile. */
  function deerPath(g, ph) {
    g.beginPath();
    g.ellipse(0, -0.55, 0.32, 0.13, 0, 0, TAU);
    g.moveTo(0.22, -0.62);
    g.quadraticCurveTo(0.34, -0.85, 0.36, -0.98);
    g.lineTo(0.44, -0.98);
    g.quadraticCurveTo(0.42, -0.8, 0.3, -0.55);
    g.closePath();
    g.moveTo(0.34, -1.02);
    g.ellipse(0.42, -1.0, 0.1, 0.05, 0.3, 0, TAU);
    g.fill();
    g.lineCap = 'round';
    g.lineWidth = 0.022;
    g.beginPath();
    for (const s of [0, 1]) {
      const bx = 0.36 + s * 0.05;
      g.moveTo(bx, -1.04);
      g.lineTo(bx - 0.05, -1.25);
      g.lineTo(bx - 0.12, -1.33);
      g.moveTo(bx - 0.03, -1.15);
      g.lineTo(bx + 0.05, -1.24);
      g.moveTo(bx - 0.06, -1.27);
      g.lineTo(bx - 0.02, -1.38);
    }
    g.stroke();
    g.lineWidth = 0.04;
    g.beginPath();
    const legs = [[0.22, 0], [0.16, Math.PI], [-0.2, Math.PI * 0.5], [-0.25, Math.PI * 1.5]];
    for (const [lx, p] of legs) {
      const a = Math.sin(ph + p) * 0.35;
      const kx = lx + Math.sin(a) * 0.22;
      const ky = -0.5 + Math.cos(a) * 0.22;
      g.moveTo(lx, -0.5);
      g.lineTo(kx, ky);
      g.lineTo(kx + Math.sin(a * 0.3) * 0.26, ky + 0.26);
    }
    g.stroke();
    g.beginPath();
    g.moveTo(-0.3, -0.6);
    g.lineTo(-0.42, -0.7);
    g.lineTo(-0.34, -0.56);
    g.fill();
  }

  /** The flying palace: a hull like a boat, a tower like a temple, and light underneath. */
  function vimana(g, col) {
    g.save();
    g.fillStyle = col;
    g.beginPath();
    g.moveTo(-1, -0.1);
    g.quadraticCurveTo(-0.7, 0.25, 0, 0.28);
    g.quadraticCurveTo(0.7, 0.25, 1.05, -0.15);
    g.lineTo(0.85, -0.05);
    g.lineTo(-0.85, -0.05);
    g.closePath();
    g.fill();
    g.fillRect(-0.6, -0.3, 1.2, 0.26);
    for (let i = -2; i <= 2; i++) {
      g.beginPath();
      g.moveTo(i * 0.25 - 0.07, -0.3);
      g.lineTo(i * 0.25 - 0.07, -0.42);
      g.quadraticCurveTo(i * 0.25, -0.5, i * 0.25 + 0.07, -0.42);
      g.lineTo(i * 0.25 + 0.07, -0.3);
      g.fill();
    }
    g.beginPath();
    g.moveTo(-0.28, -0.3);
    g.bezierCurveTo(-0.28, -0.7, -0.08, -0.95, 0, -1.05);
    g.bezierCurveTo(0.08, -0.95, 0.28, -0.7, 0.28, -0.3);
    g.fill();
    g.beginPath();
    g.ellipse(0, -1.08, 0.08, 0.03, 0, 0, TAU);
    g.fill();
    g.fillRect(-0.008, -1.25, 0.016, 0.18);
    g.beginPath();
    g.moveTo(0.008, -1.25);
    g.lineTo(0.12, -1.21);
    g.lineTo(0.008, -1.17);
    g.fill();
    g.restore();
  }

  function handPos(P, which) {
    const drop = (P.drop || 0) + (P.bob || 0);
    const shX = (P.lean || 0) * 0.6 + (which === 0 ? 0.01 : 0);
    const shY = -0.82 + drop + 0.02;
    const [a, e] = P.arms[which];
    return [shX + Math.sin(a) * 0.16 + Math.sin(a + e) * 0.16, shY + Math.cos(a) * 0.16 + Math.cos(a + e) * 0.16];
  }

  /* ══════════════════════════════════════════════════════════════════════
     eyes, very close
     ══════════════════════════════════════════════════════════════════════ */

  function eyes(ctx, t, o) {
    const cy = o.cy || 560;
    const g = ctx.createLinearGradient(0, 200, 0, 900);
    g.addColorStop(0, o.skin);
    g.addColorStop(1, o.shade);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    // a little shape to the face: the bridge of the nose, lit, between the eyes
    ctx.save();
    ctx.globalAlpha = 0.25;
    const ng = ctx.createLinearGradient(900, 0, 1020, 0);
    ng.addColorStop(0, rgba(o.shade, 0));
    ng.addColorStop(0.5, rgba('#ffffff', 0.35));
    ng.addColorStop(1, rgba(o.shade, 0));
    ctx.fillStyle = ng;
    ctx.fillRect(900, cy - 60, 120, 500);
    ctx.restore();
    if (o.forehead) o.forehead(ctx, t);
    const open = o.open == null ? 1 : o.open;
    const narrow = o.narrow || 0;
    const lk = o.look || [0, 0];
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(W / 2 + side * (o.sp || 400), cy);
      ctx.scale(side * (o.s || 1), o.s || 1);
      const lidTop = lerp(20, -115, open * (1 - narrow * 0.45));
      const upper = new Path2D();
      upper.moveTo(-175, 12);
      upper.bezierCurveTo(-120, lidTop * 0.85, 90, lidTop, 195, -18);
      const lower = [[195, -18], [125, 52 - narrow * 12], [-90, 62 - narrow * 10], [-175, 12]];
      const eye = new Path2D();
      eye.moveTo(-175, 12);
      eye.bezierCurveTo(-120, lidTop * 0.85, 90, lidTop, 195, -18);
      eye.bezierCurveTo(lower[1][0], lower[1][1], lower[2][0], lower[2][1], lower[3][0], lower[3][1]);
      eye.closePath();
      ctx.fillStyle = o.white || '#f6f1ec';
      ctx.fill(eye);
      ctx.save();
      ctx.clip(eye);
      // the iris, dark above and bright below, with fine spokes of colour
      const ix = 10 + lk[0] * 40 * side;
      const iy = 8 + lk[1] * 20;
      const ig = ctx.createLinearGradient(0, iy - 95, 0, iy + 95);
      ig.addColorStop(0, o.iris[0]);
      ig.addColorStop(0.55, mix(o.iris[0], o.iris[1], 0.5));
      ig.addColorStop(1, o.iris[1]);
      ctx.fillStyle = ig;
      ctx.beginPath();
      ctx.ellipse(ix, iy, 84, 96, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(o.iris[1], 0.5);
      ctx.lineWidth = 2;
      for (let i = 0; i < 28; i++) {
        const a = (i / 28) * TAU;
        ctx.beginPath();
        ctx.moveTo(ix + Math.cos(a) * 40, iy + Math.sin(a) * 44);
        ctx.lineTo(ix + Math.cos(a) * 76, iy + Math.sin(a) * 88);
        ctx.stroke();
      }
      ctx.strokeStyle = rgba('#000000', 0.55);
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.ellipse(ix, iy, 84, 96, 0, 0, TAU);
      ctx.stroke();
      if (o.refl) { ctx.save(); ctx.beginPath(); ctx.ellipse(ix, iy, 80, 92, 0, 0, TAU); ctx.clip(); o.refl(ctx, ix, iy, t, side); ctx.restore(); }
      ctx.fillStyle = o.pupil || '#0a0608';
      ctx.beginPath();
      ctx.ellipse(ix, iy + 4, o.slit ? 12 : 34, 40, 0, 0, TAU);
      ctx.fill();
      if (o.irisGlow) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        glow(ctx, ix, iy + 40, 110, o.irisGlow, 0.35 + 0.1 * Math.sin(t * 7));
        ctx.restore();
      }
      // the shadow the upper lid throws
      const sh = ctx.createLinearGradient(0, lidTop - 20, 0, lidTop + 90);
      sh.addColorStop(0, rgba(o.lidShadow || '#3a2a3a', 0.55));
      sh.addColorStop(1, rgba(o.lidShadow || '#3a2a3a', 0));
      ctx.fillStyle = sh;
      ctx.fillRect(-200, lidTop - 40, 420, 160);
      // highlights: a big soft window, a small hard spark, and a star that turns
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.beginPath();
      ctx.ellipse(ix - 32, iy - 38, 26, 20, -0.3, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(ix + 36, iy + 40, 9, 0, TAU);
      ctx.fill();
      const tw = 0.5 + 0.5 * Math.sin(t * 5 + side);
      ctx.globalAlpha = tw;
      ctx.beginPath();
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * TAU + t * 0.8;
        const r = k % 2 ? 4 : 18;
        ctx.lineTo(ix - 50 + Math.cos(a) * r, iy + 10 + Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.restore();
      // the upper lash line: thick, tapered, with a flick at the outer corner
      ctx.fillStyle = o.lash || '#120c14';
      ctx.beginPath();
      ctx.moveTo(-178, 14);
      ctx.bezierCurveTo(-120, lidTop * 0.85 - 4, 90, lidTop - 4, 198, -16);
      ctx.lineTo(232, -52 - narrow * 10);
      ctx.lineTo(206, -40);
      ctx.bezierCurveTo(90, lidTop - 26, -120, lidTop * 0.85 - 16, -170, 4);
      ctx.closePath();
      ctx.fill();
      // lower lashes, fainter, only towards the outer corner
      ctx.strokeStyle = rgba(o.lash || '#120c14', 0.7);
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(195, -14);
      ctx.bezierCurveTo(lower[1][0], lower[1][1] + 2, 20, 66, -40, 64);
      ctx.stroke();
      // the crease above the lid
      ctx.strokeStyle = rgba(o.lash || '#120c14', 0.35);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-120, lidTop * 0.85 - 40);
      ctx.bezierCurveTo(-40, lidTop - 60, 90, lidTop - 58, 170, -60);
      ctx.stroke();
      // the brow: lower and harder at the inner end the more he means it
      ctx.fillStyle = o.brow || o.lash || '#120c14';
      const bi = -200 + narrow * 40;
      ctx.beginPath();
      ctx.moveTo(-190, bi + 8);
      ctx.quadraticCurveTo(-40, -250 + narrow * 30, 210, -205);
      ctx.lineTo(205, -190);
      ctx.quadraticCurveTo(-40, -228 + narrow * 30, -185, bi + 30);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    // hair across the top, moving
    ctx.fillStyle = o.hair || '#0d0a16';
    for (let i = 0; i < 9; i++) {
      const x = 120 + i * 210 + Math.sin(i * 3.3) * 40;
      const sw = Math.sin(t * 1.6 + i) * 18;
      ctx.beginPath();
      ctx.moveTo(x - 90, 0);
      ctx.quadraticCurveTo(x + sw, 300 + (i % 3) * 30, x + 30 + sw * 1.5, 370 + (i % 2) * 40);
      ctx.quadraticCurveTo(x + 20, 230, x + 110, 0);
      ctx.closePath();
      ctx.fill();
    }
    if (o.light) o.light(ctx, t);
  }

  /* ══════════════════════════════════════════════════════════════════════
     Ayodhya, by day and by night: one city, drawn from one list
     ══════════════════════════════════════════════════════════════════════ */

  const CITY = (() => {
    const r = mulberry(4242);
    const near = [];
    const far = [];
    let x = -40;
    while (x < W + 40) {
      const w = 60 + r() * 90;
      const cx = x + w / 2;
      const center = Math.abs(cx - 960) < 180;
      const kind = center ? 'none' : r() < 0.3 ? 'shikhara' : r() < 0.55 ? 'dome' : 'block';
      if (kind !== 'none') near.push({ kind, x: cx, w: kind === 'shikhara' ? w * 0.75 : w, h: kind === 'shikhara' ? 150 + r() * 120 : 60 + r() * 90, flag: r() < 0.35, win: r() });
      x += w + r() * 10;
    }
    near.push({ kind: 'shikhara', x: 960, w: 170, h: 400, flag: true, win: 0.3 });
    near.push({ kind: 'shikhara', x: 830, w: 110, h: 280, flag: true, win: 0.6 });
    near.push({ kind: 'shikhara', x: 1090, w: 110, h: 280, flag: true, win: 0.2 });
    near.push({ kind: 'dome', x: 720, w: 120, h: 150, flag: false, win: 0.5 });
    near.push({ kind: 'dome', x: 1200, w: 120, h: 150, flag: false, win: 0.8 });
    x = -20;
    while (x < W + 20) {
      const w = 40 + r() * 70;
      far.push({ kind: r() < 0.35 ? 'shikhara' : r() < 0.6 ? 'dome' : 'block', x: x + w / 2, w: w * 0.8, h: 50 + r() * 110, flag: r() < 0.2, win: r() });
      x += w + r() * 30;
    }
    near.sort((a, b) => b.h - a.h);
    return { near, far };
  })();

  function building(g, b, base, t, s = 1) {
    const { x } = b;
    const w = b.w * s;
    const h = b.h * s;
    g.beginPath();
    if (b.kind === 'shikhara') {
      g.moveTo(x - w / 2, base);
      g.lineTo(x - w / 2, base - h * 0.18);
      g.bezierCurveTo(x - w / 2, base - h * 0.62, x - w * 0.22, base - h * 0.92, x - w * 0.08, base - h * 0.96);
      g.lineTo(x + w * 0.08, base - h * 0.96);
      g.bezierCurveTo(x + w * 0.22, base - h * 0.92, x + w / 2, base - h * 0.62, x + w / 2, base - h * 0.18);
      g.lineTo(x + w / 2, base);
      g.closePath();
      g.fill();
      g.beginPath();
      g.ellipse(x, base - h * 0.97, w * 0.14, w * 0.045, 0, 0, TAU);
      g.fill();
      g.beginPath();
      g.moveTo(x - w * 0.04, base - h);
      g.quadraticCurveTo(x, base - h - w * 0.2, x + w * 0.04, base - h);
      g.fill();
      if (b.flag) flag(g, x, base - h - w * 0.15, 36 * s, t, b.x);
    } else if (b.kind === 'dome') {
      g.rect(x - w / 2, base - h * 0.6, w, h * 0.6);
      g.fill();
      g.beginPath();
      g.moveTo(x - w * 0.42, base - h * 0.6);
      g.bezierCurveTo(x - w * 0.46, base - h * 1.0, x - w * 0.1, base - h * 1.05, x, base - h * 1.12);
      g.bezierCurveTo(x + w * 0.1, base - h * 1.05, x + w * 0.46, base - h * 1.0, x + w * 0.42, base - h * 0.6);
      g.fill();
      g.fillRect(x - 1.5 * s, base - h * 1.22, 3 * s, h * 0.12);
      if (b.flag) flag(g, x, base - h * 1.2, 28 * s, t, b.x);
    } else {
      g.rect(x - w / 2, base - h, w, h);
      g.fill();
      // a small pavilion on the roof
      g.beginPath();
      g.rect(x - w * 0.18, base - h - 16 * s, w * 0.36, 16 * s);
      g.fill();
      g.beginPath();
      g.moveTo(x - w * 0.24, base - h - 16 * s);
      g.quadraticCurveTo(x, base - h - 44 * s, x + w * 0.24, base - h - 16 * s);
      g.fill();
      if (b.flag) flag(g, x + w * 0.3, base - h, 24 * s, t, b.x);
    }
  }
  function flag(g, x, y, s, t, seed) {
    g.fillRect(x - 1, y - s * 1.3, 2, s * 1.3);
    g.beginPath();
    g.moveTo(x, y - s * 1.3);
    const wv = Math.sin(t * 5 + seed) * s * 0.12;
    g.quadraticCurveTo(x + s * 0.5, y - s * 1.35 + wv, x + s, y - s * 1.12 + wv);
    g.quadraticCurveTo(x + s * 0.5, y - s * 1.0 - wv, x, y - s * 0.9);
    g.fill();
  }
  function cityNear(g, col, t) {
    g.fillStyle = col;
    for (const b of CITY.near) building(g, b, 770, t);
    // the wall and its gate
    g.fillRect(-50, 700, W + 100, 72);
    for (let x = -40; x < W + 40; x += 34) g.fillRect(x, 688, 20, 14);
    g.fillRect(-50, 770, W + 100, 30);
  }
  function cityFar(g, col, t) {
    g.fillStyle = col;
    for (const b of CITY.far) building(g, b, 705, t, 0.9);
  }
  /** Where the lamps go on the night they came home: along the wall, the eaves, and the ghats. */
  const LAMPS = (() => {
    const out = [];
    for (let x = -20; x < W + 20; x += 17) out.push([x + 8, 686]);
    for (const b of CITY.near) {
      if (b.kind === 'block') for (let x = b.x - b.w / 2 + 6; x < b.x + b.w / 2; x += 13) out.push([x, 770 - b.h]);
      if (b.kind === 'dome') for (let x = b.x - b.w / 2 + 6; x < b.x + b.w / 2; x += 13) out.push([x, 770 - b.h * 0.6]);
      if (b.kind === 'shikhara') { out.push([b.x - b.w / 2, 770 - b.h * 0.18]); out.push([b.x + b.w / 2, 770 - b.h * 0.18]); out.push([b.x, 770 - b.h * 1.02]); }
    }
    for (const y of [812, 838, 866]) for (let x = 0; x < W; x += 15) out.push([x + ((y / 13) % 2) * 7, y]);
    return out;
  })();

  const glowSprites = new Map();
  function glowSprite(color, r) {
    const key = color + r;
    if (glowSprites.has(key)) return glowSprites.get(key);
    const c = can(r * 2, r * 2);
    const g = c.getContext('2d');
    const gr = g.createRadialGradient(r, r, 0, r, r, r);
    gr.addColorStop(0, rgba('#fff6d8', 1));
    gr.addColorStop(0.12, rgba(color, 0.9));
    gr.addColorStop(0.4, rgba(color, 0.25));
    gr.addColorStop(1, rgba(color, 0));
    g.fillStyle = gr;
    g.fillRect(0, 0, r * 2, r * 2);
    glowSprites.set(key, c);
    return c;
  }
  function lamp(ctx, x, y, s, a) {
    if (a <= 0.01) return;
    const sp = glowSprite('#ffae42', 32);
    ctx.globalAlpha = a;
    ctx.drawImage(sp, x - 32 * s, y - 32 * s, 64 * s, 64 * s);
  }

  function birds(ctx, t, n, y0, col) {
    ctx.strokeStyle = col;
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const x = mod(hash(i * 3.1) * W - 200 + t * (60 + hash(i) * 30), W + 400) - 200;
      const y = y0 + hash(i * 5.7) * 160 + Math.sin(t + i) * 6;
      const s = 7 + hash(i * 7.7) * 6;
      const f = Math.sin(t * 9 + i * 2) * s * 0.6;
      ctx.beginPath();
      ctx.moveTo(x - s, y - f);
      ctx.quadraticCurveTo(x - s * 0.4, y - s * 0.2, x, y);
      ctx.quadraticCurveTo(x + s * 0.4, y - s * 0.2, x + s, y - f);
      ctx.stroke();
    }
  }

  function water(ctx, y0, top, bottom, sunX, t, glint = '#fff0c0', a = 0.8) {
    const g = ctx.createLinearGradient(0, y0, 0, H);
    g.addColorStop(0, top);
    g.addColorStop(1, bottom);
    ctx.fillStyle = g;
    ctx.fillRect(-100, y0, W + 200, H - y0 + 100);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const f = Math.floor(t * 8);
    for (let i = 0; i < 90; i++) {
      const yy = y0 + Math.pow(hash(i * 1.7), 1.6) * (H - y0);
      const d = (yy - y0) / (H - y0);
      const spread = 30 + d * 260;
      const x = sunX + (hash(i * 3.3 + f * 0.37) - 0.5) * spread * 2;
      const w = (8 + d * 60) * (0.4 + hash(i * 5.1 + f));
      ctx.fillStyle = rgba(glint, a * (0.3 + 0.7 * hash(i * 9.9 + f * 1.3)));
      ctx.fillRect(x - w / 2, yy, w, 1.5 + d * 3);
    }
    ctx.strokeStyle = rgba('#ffffff', 0.06);
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 30; i++) {
      const yy = y0 + Math.pow(i / 30, 1.8) * (H - y0);
      const x = mod(i * 377 + t * 20, W);
      ctx.beginPath();
      ctx.moveTo(x - 120, yy);
      ctx.lineTo(x + 120, yy);
      ctx.stroke();
    }
    ctx.restore();
  }

  function stars(ctx, t, n = 220, maxY = 700) {
    ctx.save();
    for (let i = 0; i < n; i++) {
      const x = hash(i * 1.37) * W;
      const y = Math.pow(hash(i * 2.71), 1.4) * maxY;
      const tw = 0.5 + 0.5 * Math.sin(t * (1 + hash(i) * 3) + i);
      ctx.fillStyle = rgba('#ffffff', (0.25 + 0.6 * hash(i * 4.4)) * tw);
      const r = 0.6 + hash(i * 5.5) * 1.6;
      ctx.fillRect(x, y, r, r);
    }
    ctx.restore();
  }

  function titleCard(ctx, t, a, y, big = 170) {
    if (a <= 0) return;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `600 ${big * 0.36}px ${DEVA}`;
    ctx.fillStyle = '#ffe7a8';
    ctx.shadowColor = 'rgba(255,150,40,0.8)';
    ctx.shadowBlur = 20;
    ctx.fillText('रामायण', W / 2, y - big * 0.82);
    ctx.font = `800 ${big}px ${SANS}`;
    const track = lerp(70, 22, eOut3(clamp(t / 1.6)));
    ctx.letterSpacing = `${track}px`;
    const gr = ctx.createLinearGradient(0, y - big / 2, 0, y + big / 2);
    gr.addColorStop(0, '#fff6d6');
    gr.addColorStop(0.5, '#f5c14e');
    gr.addColorStop(1, '#b8640f');
    ctx.fillStyle = gr;
    ctx.shadowBlur = 40;
    ctx.fillText('RAMAYANA', W / 2 + track / 2, y);
    ctx.shadowBlur = 0;
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = 'rgba(80,30,5,0.8)';
    ctx.strokeText('RAMAYANA', W / 2 + track / 2, y);
    // the shine: a bright bar that crosses the letters once
    const sx = lerp(-300, W + 300, prog(t, 0.9, 2.1));
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.beginPath();
    ctx.moveTo(sx - 60, y - big);
    ctx.lineTo(sx + 20, y - big);
    ctx.lineTo(sx - 60, y + big);
    ctx.lineTo(sx - 140, y + big);
    ctx.closePath();
    ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillText('RAMAYANA', W / 2 + track / 2, y);
    ctx.restore();
    ctx.letterSpacing = '14px';
    ctx.font = `600 ${big * 0.19}px ${SANS}`;
    ctx.fillStyle = 'rgba(255,245,225,0.9)';
    ctx.fillText('THE JOURNEY OF RAMA', W / 2 + 7, y + big * 0.8);
    ctx.letterSpacing = '0px';
    ctx.restore();
  }

  /* ══════════════════════════════════════════════════════════════════════
     the shots
     Each takes (ctx, local time, global time, length).
     ══════════════════════════════════════════════════════════════════════ */

  // ── 0 · a lamp in the dark
  function sDiya(ctx, t) {
    ctx.fillStyle = '#040202';
    ctx.fillRect(0, 0, W, H);
    const k = eOut(prog(t, 0.5, 2.4));
    ctx.save();
    ctx.translate(960, 640);
    ctx.scale(1 + t * 0.025, 1 + t * 0.025);
    ctx.translate(-960, -640);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, 1020, 650, 1100 * k + 1, '#ff8a2a', 0.28 * k);
    ctx.restore();
    // the floor it stands on, catching its light
    const fl = ctx.createRadialGradient(990, 760, 0, 990, 760, 700);
    fl.addColorStop(0, rgba('#6b3414', 0.8 * k));
    fl.addColorStop(1, rgba('#1a0a04', 0));
    ctx.fillStyle = fl;
    ctx.fillRect(0, 740, W, 400);
    diya(ctx, 900, 745, 80, t, 2, k);
    // the smoke from it, one slow thread
    ctx.strokeStyle = rgba('#d8b8a0', 0.12 * k);
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i < 40; i++) {
      const u = i / 40;
      const x = 1000 + Math.sin(u * 7 - t * 1.4) * 30 * u;
      const y = 560 - u * 420;
      if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
    }
    ctx.stroke();
    motes(ctx, t, { n: 26, color: '#ff9a3c', r: 2.2, rise: 14, alpha: 0.45 * k, x0: 700, w: 600, y0: 250, h: 500 });
    ctx.restore();
  }

  // ── 1 · Ayodhya at sunrise, and the title
  const DAWN = { light: '#ffe2b0', mid: '#c77f9c', dark: '#5b4b8f', rim: '#fff4cf' };
  function sAyodhya(ctx, t) {
    const z = 1 + t * 0.006;
    ctx.save();
    ctx.translate(1150, 650);
    ctx.scale(z, z);
    ctx.translate(-1150, -650);
    sky(ctx, [[0, '#131b48'], [0.3, '#394795'], [0.5, '#a86a9e'], [0.6, '#ef8f7a'], [0.66, '#ffcf87'], [0.7, '#ffe6b0']]);
    const sy = 690 - t * 7;
    sun(ctx, 1150, sy, 58, '#fffbe8', '#ffc670');
    rays(ctx, 1150, sy, t, { a0: -Math.PI, span: Math.PI, n: 16, alpha: 0.1 });
    const cl = [[330, 250, 1.1, 1, 820, 250], [1520, 190, 1.0, 2, 760, 230], [980, 420, 0.7, 3, 700, 200], [150, 520, 0.6, 4, 600, 190], [1780, 470, 0.65, 5, 600, 190], [620, 560, 0.45, 6, 520, 160]];
    for (const [x, y, s, seed, w, h] of cl) {
      const lx = clamp((1150 - x) / 900, -1, 1) * 0.6;
      cloud(ctx, x + t * 7 * s, y, s, seed, w, h, DAWN, lx, 0.8);
    }
    birds(ctx, t, 9, 330, 'rgba(40,25,60,0.7)');
    // far hills and the far city, in the blue of distance
    ctx.fillStyle = '#8a73a8';
    ctx.beginPath();
    ctx.moveTo(-100, 700);
    for (let x = -100; x <= W + 100; x += 40) ctx.lineTo(x, 672 + Math.sin(x * 0.004) * 16 + Math.sin(x * 0.013) * 6);
    ctx.lineTo(W + 100, 720);
    ctx.lineTo(-100, 720);
    ctx.fill();
    cityFar(ctx, '#6b5690', t);
    lit(ctx, 0, 0, [-60, 230, W + 120, 580], (g, col) => cityNear(g, col, t), { rim: '#ffd18c', dark: '#261c42', dx: 0, dy: 4 });
    // windows lit before the sun is properly up
    ctx.save();
    for (const b of CITY.near) {
      if (b.kind !== 'block' || b.win < 0.4) continue;
      for (let k = 0; k < 3; k++) {
        const wx = b.x - b.w * 0.3 + k * b.w * 0.3;
        lamp(ctx, wx, 770 - b.h * 0.55, 0.35, 0.6 * (0.8 + 0.2 * Math.sin(t * 3 + wx)));
      }
    }
    ctx.restore();
    // the Sarayu, with the sun in it
    water(ctx, 800, '#e79a88', '#231f55', 1150, t, '#ffe9b8', 0.7);
    ctx.fillStyle = 'rgba(30,20,50,0.55)';
    ctx.fillRect(-100, 800, W + 200, 16);
    ctx.restore();
    titleCard(ctx, t - 3.5, prog(t, 3.5, 4.3) * (1 - prog(t, 8.3, 9)), 195, 140);
  }

  // ── 2 · the hall at Mithila, and the bow nobody could lift
  function sHall(ctx, t, T) {
    const u = t / T;
    const z = 1 + u * 0.08;
    ctx.save();
    ctx.translate(960, 470);
    ctx.scale(z, z);
    ctx.translate(-960, -470);
    ctx.fillStyle = '#23120a';
    ctx.fillRect(-200, -200, W + 400, H + 400);
    // the far wall and a bright doorway
    const wall = ctx.createLinearGradient(0, 160, 0, 580);
    wall.addColorStop(0, '#5a2f16');
    wall.addColorStop(1, '#8a4d24');
    ctx.fillStyle = wall;
    ctx.fillRect(520, 170, 880, 400);
    ctx.fillStyle = '#ffe2a8';
    ctx.beginPath();
    ctx.moveTo(880, 570);
    ctx.lineTo(880, 360);
    ctx.quadraticCurveTo(960, 250, 1040, 360);
    ctx.lineTo(1040, 570);
    ctx.fill();
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, 960, 430, 420, '#ffc977', 0.4);
    ctx.restore();
    // floor, with lines running to the doorway
    const fl = ctx.createLinearGradient(0, 570, 0, H);
    fl.addColorStop(0, '#6a3718');
    fl.addColorStop(1, '#170905');
    ctx.fillStyle = fl;
    ctx.beginPath();
    ctx.moveTo(520, 570);
    ctx.lineTo(1400, 570);
    ctx.lineTo(W + 400, H + 200);
    ctx.lineTo(-400, H + 200);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,200,140,0.12)';
    ctx.lineWidth = 2;
    for (let i = -12; i <= 12; i++) {
      ctx.beginPath();
      ctx.moveTo(960 + i * 40, 570);
      ctx.lineTo(960 + i * 260, H + 100);
      ctx.stroke();
    }
    for (let k = 1; k < 12; k++) {
      const y = 570 + Math.pow(k / 11, 2.2) * 560;
      ctx.beginPath();
      ctx.moveTo(-200, y);
      ctx.lineTo(W + 200, y);
      ctx.stroke();
    }
    // seated kings, in rows along both walls
    ctx.fillStyle = '#140905';
    for (const s of [-1, 1]) {
      for (let row = 0; row < 3; row++) {
        const y = 600 + row * 55;
        const n = 8 - row;
        for (let i = 0; i < n; i++) {
          const x = 960 + s * (330 + row * 140 + i * (46 + row * 14));
          const r = 12 + row * 5;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, TAU);
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(x - r * 0.8, y - r * 0.6);
          ctx.lineTo(x, y - r * 2.2);
          ctx.lineTo(x + r * 0.8, y - r * 0.6);
          ctx.fill();
          ctx.fillRect(x - r * 1.5, y + r * 0.8, r * 3, r * 3);
        }
      }
    }
    // pillars, far to near
    const P = [[500, 36, 175, 600], [430, 58, 140, 680], [300, 95, 80, 820], [60, 170, -20, 1120]];
    for (const [x, w, top, bot] of P) {
      for (const s of [-1, 1]) {
        const px = s < 0 ? x : W - x - w;
        const g = ctx.createLinearGradient(px, 0, px + w, 0);
        const litSide = s < 0 ? 1 : 0;
        g.addColorStop(litSide ? 0 : 1, '#1c0e07');
        g.addColorStop(litSide ? 1 : 0, '#8a5228');
        ctx.fillStyle = g;
        ctx.fillRect(px, top, w, bot - top);
        ctx.fillStyle = '#140905';
        ctx.fillRect(px - w * 0.15, top, w * 1.3, w * 0.25);
        ctx.fillRect(px - w * 0.15, bot - w * 0.3, w * 1.3, w * 0.3);
      }
    }
    // the bow, lying on its dais
    ctx.fillStyle = '#2a1409';
    ctx.fillRect(780, 548, 360, 30);
    ctx.fillStyle = '#b47a3c';
    ctx.fillRect(780, 548, 360, 4);
    const pulse = 0.6 + 0.4 * Math.sin(t * 2.4);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, 960, 525, 260, '#9fc6ff', 0.25 * pulse);
    ctx.restore();
    ctx.strokeStyle = '#e9b54a';
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(800, 520);
    ctx.quadraticCurveTo(960, 560, 1120, 520);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,240,200,0.8)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(800, 520);
    ctx.lineTo(1120, 520);
    ctx.stroke();
    // the light from high windows, with dust turning in it
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 4; i++) {
      const x0 = 250 + i * 170;
      const g = ctx.createLinearGradient(x0, 0, x0 + 600, H);
      g.addColorStop(0, 'rgba(255,214,150,0.14)');
      g.addColorStop(1, 'rgba(255,214,150,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(x0, -50);
      ctx.lineTo(x0 + 70, -50);
      ctx.lineTo(x0 + 700, H + 50);
      ctx.lineTo(x0 + 560, H + 50);
      ctx.fill();
    }
    ctx.restore();
    motes(ctx, t, { n: 40, color: '#ffd9a0', r: 1.6, rise: 6, sway: 20, alpha: 0.35 });
    // Rama walks in
    const x = lerp(250, 640, eInOut(u));
    figure(ctx, x, 1010, 420, 1, { kind: 'rama', pose: walkPose(t * 5.2), t, wind: 0.4, bow: null }, { rim: '#ffd59a', dark: '#140a06', dx: 4, dy: 3, glow: 6, glowA: 0.4 });
    ctx.restore();
  }

  // ── 3 · Rama's eyes
  function sRamaEyes(ctx, t, T) {
    const blink = 1 - bump(t, 0.35, 0.55, 0.1);
    eyes(ctx, t, {
      skin: '#5f8ed3', shade: '#35578f', iris: ['#150d24', '#9a6a36'], lash: '#0b0a1c', brow: '#0b0a1c', hair: '#0a0918',
      lidShadow: '#1f2f5c', open: blink, narrow: eOut(prog(t, 1.2, 2.4)) * 0.4, look: [0.1, -0.1], cy: 600, sp: 390,
      forehead: (c) => {
        // the mark of Vishnu on his forehead: white, with a line of red down the middle
        c.save();
        c.lineCap = 'round';
        c.strokeStyle = 'rgba(255,248,235,0.95)';
        c.lineWidth = 14;
        c.beginPath();
        c.moveTo(930, 250);
        c.lineTo(932, 400);
        c.quadraticCurveTo(960, 440, 988, 400);
        c.lineTo(990, 250);
        c.stroke();
        c.strokeStyle = '#d4231b';
        c.lineWidth = 12;
        c.beginPath();
        c.moveTo(960, 250);
        c.lineTo(960, 405);
        c.stroke();
        c.restore();
      },
      refl: (c, ix, iy) => {
        // the gold of the bow, across his eye
        c.save();
        c.globalCompositeOperation = 'lighter';
        c.strokeStyle = 'rgba(255,200,90,0.55)';
        c.lineWidth = 6;
        c.beginPath();
        c.moveTo(ix - 70, iy + 30);
        c.quadraticCurveTo(ix, iy + 55, ix + 70, iy + 30);
        c.stroke();
        c.restore();
      },
    });
    focusLines(ctx, 960, 600, t, { alpha: 0.18 * prog(t, 1.5, T), n: 70, rIn: 520, color: '#ffffff' });
  }

  // ── 4 · he lifts it, and it breaks
  const SNAP = 3.6;
  function sSnap(ctx, t, T) {
    const [sx, sy] = shake(t, SNAP, 70, 1.2);
    const pre = shake(t, 1.0, 10 * prog(t, 1, SNAP), 99);
    ctx.save();
    ctx.translate(sx + (t < SNAP ? pre[0] : 0), sy + (t < SNAP ? pre[1] : 0));
    const bg = ctx.createRadialGradient(960, 300, 0, 960, 300, 1300);
    bg.addColorStop(0, '#fff6d8');
    bg.addColorStop(0.2, '#ffc15a');
    bg.addColorStop(0.55, '#c0341e');
    bg.addColorStop(1, '#240505');
    ctx.fillStyle = bg;
    ctx.fillRect(-200, -200, W + 400, H + 400);
    rays(ctx, 960, 260, t * 6, { n: 22, alpha: 0.16, color: '#fff1c1', len: 2200 });
    const charge = prog(t, 0.6, SNAP);
    if (t < SNAP) focusLines(ctx, 960, 260, t, { alpha: 0.25 + 0.6 * charge, n: 60 + 80 * charge, rIn: 460 - 200 * charge, color: '#fffaf0' });
    // Rama, from below, the bow above his head
    const h = 760;
    const fx = 960;
    const fy = 1080;
    const pose = POSES.lift;
    const rim = { rim: '#fff3cf', dark: '#1b0b0e', dx: 0, dy: 6, glow: 12, glowA: 0.6 };
    figure(ctx, fx, fy, h, 1, { kind: 'rama', pose, t, wind: 1.2 }, rim);
    const [hx, hy] = handPos(pose, 0);
    const gx = fx + hx * h;
    const gy = fy + hy * h - 10;
    const bend = eIn(charge);
    if (t < SNAP) {
      // the bow bends, and begins to glow at the middle
      const span = 560 - bend * 70;
      const sag = 40 + bend * 150;
      ctx.save();
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#2a1406';
      ctx.lineWidth = 30;
      ctx.beginPath();
      ctx.moveTo(gx - span, gy - sag);
      ctx.quadraticCurveTo(gx, gy + sag * 0.6, gx + span, gy - sag);
      ctx.stroke();
      const bg2 = ctx.createLinearGradient(0, gy - sag, 0, gy + 30);
      bg2.addColorStop(0, '#fff0b0');
      bg2.addColorStop(1, '#d8901f');
      ctx.strokeStyle = bg2;
      ctx.lineWidth = 20;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,250,230,0.9)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(gx - span, gy - sag);
      ctx.lineTo(gx + span, gy - sag);
      ctx.stroke();
      ctx.restore();
      if (charge > 0.45) {
        const c = prog(charge, 0.45, 1);
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        glow(ctx, gx, gy + sag * 0.15, 80 + 260 * c, '#ffffff', 0.9 * c);
        ctx.strokeStyle = rgba('#ffffff', c);
        ctx.lineWidth = 3;
        for (let i = 0; i < 7; i++) {
          const a = hash(i * 3.3) * TAU;
          ctx.beginPath();
          ctx.moveTo(gx, gy + sag * 0.15);
          let px = gx;
          let py = gy + sag * 0.15;
          for (let k = 0; k < 4; k++) {
            px += Math.cos(a + (hash(i + k) - 0.5)) * 30 * c;
            py += Math.sin(a + (hash(i * 2 + k) - 0.5)) * 30 * c;
            ctx.lineTo(px, py);
          }
          ctx.stroke();
        }
        ctx.restore();
      }
    } else {
      // two halves, going their own ways, with the air still ringing
      const k = t - SNAP;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 3; i++) {
        const r = (k - i * 0.12) * 2600;
        if (r <= 0) continue;
        ctx.strokeStyle = rgba('#ffffff', Math.max(0, 0.8 - k * 0.6) / (i + 1));
        ctx.lineWidth = 30 / (1 + k * 4);
        ctx.beginPath();
        ctx.ellipse(gx, gy, r, r * 0.55, 0, 0, TAU);
        ctx.stroke();
      }
      glow(ctx, gx, gy, 600, '#ffffff', Math.max(0, 0.9 - k));
      ctx.restore();
      for (const s of [-1, 1]) {
        for (let gh = 2; gh >= 0; gh--) {
          const kk = Math.max(0, k - gh * 0.03);
          ctx.save();
          ctx.globalAlpha = gh ? 0.25 : 1;
          ctx.translate(gx + s * (30 + kk * 900), gy - kk * 520 + kk * kk * 300);
          ctx.rotate(s * kk * 5);
          ctx.lineCap = 'round';
          ctx.strokeStyle = '#2a1406';
          ctx.lineWidth = 30;
          ctx.beginPath();
          ctx.moveTo(0, 20);
          ctx.quadraticCurveTo(s * 240, 10, s * 480, -150);
          ctx.stroke();
          ctx.strokeStyle = '#f2c35a';
          ctx.lineWidth = 20;
          ctx.stroke();
          ctx.restore();
        }
      }
      // petals and splinters, out from the break
      for (let i = 0; i < 90; i++) {
        const a = hash(i * 2.1) * TAU;
        const v = 600 + hash(i * 3.7) * 1400;
        const px = gx + Math.cos(a) * v * k;
        const py = gy + Math.sin(a) * v * k * 0.8 + 400 * k * k;
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(k * 8 + i);
        ctx.fillStyle = ['#ff9a3c', '#ffd25a', '#ff6f91', '#fff2d0'][i % 4];
        ctx.globalAlpha = Math.max(0, 1 - k * 0.4);
        ctx.beginPath();
        ctx.ellipse(0, 0, 10, 5, 0, 0, TAU);
        ctx.fill();
        ctx.restore();
      }
    }
    ctx.restore();
  }

  // ── 5 · Sita chooses him
  function sSita(ctx, t, T) {
    const u = t / T;
    sky(ctx, [[0, '#f3b9d3'], [0.55, '#ffe0c8'], [1, '#ffd0b0']]);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, 1500, 200, 900, '#ffffff', 0.5);
    ctx.restore();
    rays(ctx, 1500, 200, t, { a0: Math.PI * 0.5, span: Math.PI * 0.6, n: 10, alpha: 0.12 });
    bokeh(ctx, t, { n: 26, alpha: 0.18, colors: ['#ffffff', '#ffd0e0', '#ffe9b0'] });
    ctx.fillStyle = '#eab0a2';
    ctx.fillRect(0, 960, W, 200);
    const light = { rim: '#fff8ee', dark: '#5a2a48', dx: -5, dy: 4, glow: 8, glowA: 0.35, fill: '#8d4a6e' };
    const sp = POSES.garland;
    figure(ctx, 800, 1000, 600, 1, { kind: 'sita', pose: sp, t, wind: 0.7 }, light);
    figure(ctx, 1170, 1000, 660, -1, { kind: 'rama', pose: POSES.stand, t, wind: 0.6, bow: { held: 'shoulder' } }, { ...light, dark: '#20305a', fill: '#3e5a92', dx: 5 });
    // the garland: in her hands, then round his neck
    const [hx, hy] = handPos(sp, 0);
    const from = [800 + hx * 600 + 10, 1000 + hy * 600];
    const to = [1170 - 0.02 * 660, 1000 - 0.8 * 660];
    const k = eInOut(prog(u, 0.35, 0.75));
    const cx = lerp(from[0], to[0], k);
    const cy = lerp(from[1], to[1], k) - Math.sin(k * Math.PI) * 60;
    const rx = lerp(34, 44, k);
    const ry = lerp(120, 130, k);
    for (let i = 0; i < 44; i++) {
      const a = Math.PI + (i / 43) * Math.PI;
      const x = cx + Math.cos(a) * rx * (i % 2 ? 1 : 0.96);
      const y = cy - Math.sin(a) * ry;
      ctx.fillStyle = i % 5 === 0 ? '#fff4e6' : i % 2 ? '#ff9a1f' : '#ffb938';
      ctx.beginPath();
      ctx.arc(x, y, 9, 0, TAU);
      ctx.fill();
      ctx.fillStyle = 'rgba(160,60,0,0.35)';
      ctx.beginPath();
      ctx.arc(x + 2, y + 3, 4, 0, TAU);
      ctx.fill();
    }
    petals(ctx, t, { n: 70, fall: 0.6, wind: 25 });
  }

  // ── 6 · into the forest, for fourteen years
  const DUSK = { light: '#ffb572', mid: '#8a4a72', dark: '#3a2856', rim: '#ffe6a8' };
  function ridgeY(x) { return 830 + Math.sin(x * 0.0022) * 30 + Math.sin(x * 0.007) * 10; }
  function sExile(ctx, t) {
    sky(ctx, [[0, '#231a48'], [0.35, '#6b3a6e'], [0.55, '#d8664e'], [0.68, '#ffb45c'], [0.72, '#ffd89a']]);
    sun(ctx, 1320, 700, 120, '#fff4d8', '#ff9a4a');
    rays(ctx, 1320, 700, t, { a0: -Math.PI, span: Math.PI, n: 14, alpha: 0.09 });
    for (const [x, y, s, seed] of [[300, 240, 1.2, 11], [1100, 170, 1.0, 12], [1700, 330, 0.8, 13], [700, 430, 0.6, 14]]) {
      cloud(ctx, x - t * 8 * s, y, s * 0.8, seed, 900, 260, DUSK, clamp((1320 - x) / 1200, -1, 1) * 0.5, 0.9);
    }
    const scroll = t * 70;
    const layers = [['#6a4a7a', 700, 0.15, 60], ['#4a3060', 740, 0.35, 45], ['#2c1c40', 780, 0.6, 30]];
    for (const [col, base, par, amp] of layers) {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(-50, H);
      for (let x = -50; x <= W + 50; x += 30) {
        const wx = x + scroll * par;
        ctx.lineTo(x, base - amp * (0.6 + 0.4 * Math.sin(wx * 0.003 + par * 9)) - Math.abs(Math.sin(wx * 0.011)) * amp * 0.3);
      }
      ctx.lineTo(W + 50, H);
      ctx.fill();
    }
    // the ridge they walk along, and trees on it
    const rs = scroll;
    lit(ctx, 0, 0, [-40, 420, W + 80, 700], (g, col) => {
      g.fillStyle = col;
      g.beginPath();
      g.moveTo(-40, H + 60);
      for (let x = -40; x <= W + 40; x += 20) g.lineTo(x, ridgeY(x + rs));
      g.lineTo(W + 40, H + 60);
      g.fill();
      for (let i = 0; i < 14; i++) {
        const tx = mod(i * 260 + hash(i) * 120 - rs, W + 520) - 260;
        const ty = ridgeY(tx + rs) + 6;
        const th = 140 + hash(i * 3.3) * 150;
        g.fillRect(tx - 5, ty - th, 10, th);
        for (let k = 0; k < 6; k++) {
          g.beginPath();
          g.arc(tx + (hash(i * 7 + k) - 0.5) * 90, ty - th - (hash(i * 9 + k) - 0.3) * 80, 30 + hash(i * 11 + k) * 30, 0, TAU);
          g.fill();
        }
      }
    }, { rim: '#ffc27a', dark: '#1b1028', dx: -4, dy: 3 });
    // three of them: Rama leading, Sita, Lakshmana behind
    const light = { rim: '#ffd89c', dark: '#150c1e', dx: -4, dy: 3, glow: 6, glowA: 0.45 };
    const walkers = [['laks', 700, 0.9], ['sita', 880, 0.3], ['rama', 1060, 0]];
    for (const [kind, x0, off] of walkers) {
      const x = x0 + t * 6;
      const hgt = kind === 'sita' ? 245 : 265;
      figure(ctx, x, ridgeY(x + rs) + 4, hgt, 1, { kind, pose: walkPose(t * 4.6 + off, 0.38), t, wind: 0.8, bow: kind === 'sita' ? null : { held: 'shoulder' } }, light);
    }
    // foreground grass, much faster
    ctx.fillStyle = '#0c0712';
    for (let i = 0; i < 70; i++) {
      const gx = mod(i * 41 - scroll * 1.7, W + 100) - 50;
      const gh = 60 + hash(i * 2.2) * 110;
      const sw = Math.sin(t * 2 + i) * 12;
      ctx.beginPath();
      ctx.moveTo(gx - 6, H);
      ctx.quadraticCurveTo(gx + sw * 0.5, H - gh * 0.6, gx + sw, H - gh);
      ctx.quadraticCurveTo(gx + sw * 0.3 + 3, H - gh * 0.5, gx + 6, H);
      ctx.fill();
    }
    if (t > 4.5) motes(ctx, t, { n: 40, color: '#c8ff7a', core: '#f4ffd0', r: 2.4, rise: 8, sway: 40, alpha: 0.6 * prog(t, 4.5, 6), y0: 600, h: 480 });
  }

  // ── 7 · a golden deer
  function sDeer(ctx, t, T) {
    const u = t / T;
    sky(ctx, [[0, '#050d1c'], [0.5, '#0e2838'], [1, '#17404a']]);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, 1500, 120, 800, '#9fd8ff', 0.25);
    ctx.restore();
    rays(ctx, 1500, 60, t, { a0: Math.PI * 0.55, span: Math.PI * 0.35, n: 8, alpha: 0.07, color: '#bfe6ff' });
    // three depths of trunks
    for (const [col, n, wmin, par, seed] of [['#1c4450', 16, 14, 0.2, 1], ['#10303a', 12, 26, 0.5, 2], ['#071820', 7, 50, 1, 3]]) {
      ctx.fillStyle = col;
      for (let i = 0; i < n; i++) {
        const x = hash(i * 3.1 + seed) * (W + 200) - 100 - t * 12 * par;
        const w = wmin * (0.7 + hash(i * 5.3 + seed) * 0.8);
        ctx.beginPath();
        ctx.moveTo(x - w / 2, H);
        ctx.lineTo(x - w * 0.35, -20);
        ctx.lineTo(x + w * 0.35, -20);
        ctx.lineTo(x + w / 2, H);
        ctx.fill();
      }
      // mist between the layers
      const mg = ctx.createLinearGradient(0, 600, 0, 900);
      mg.addColorStop(0, 'rgba(160,210,220,0)');
      mg.addColorStop(0.6, 'rgba(160,210,220,0.08)');
      mg.addColorStop(1, 'rgba(160,210,220,0)');
      ctx.fillStyle = mg;
      ctx.fillRect(0, 600, W, 300);
    }
    ctx.fillStyle = '#04121a';
    ctx.fillRect(0, 880, W, 300);
    // the deer, which is gold all the way through and shines
    const dx = lerp(1420, 1120, eInOut(u));
    const dh = 280;
    ctx.save();
    ctx.translate(dx, 890);
    ctx.scale(-dh, dh);
    const dg = ctx.createLinearGradient(0, -1.3, 0, 0);
    dg.addColorStop(0, '#fff3b0');
    dg.addColorStop(0.5, '#f5b83a');
    dg.addColorStop(1, '#b86a10');
    ctx.fillStyle = dg;
    ctx.strokeStyle = dg;
    ctx.shadowColor = 'rgba(255,200,80,0.9)';
    ctx.shadowBlur = 40;
    deerPath(ctx, t * 5);
    ctx.restore();
    motes(ctx, t, { n: 40, color: '#ffd35a', core: '#fffbe0', r: 2.5, rise: 20, sway: 30, alpha: 0.8, x0: dx - 200, w: 400, y0: 560, h: 380 });
    // Rama and Sita in the near dark, watching it
    const light = { rim: '#bfe8ff', dark: '#03080c', dx: -4, dy: 4, glow: 6, glowA: 0.4 };
    figure(ctx, 520, 1100, 640, 1, { kind: 'sita', pose: POSES.stand, t, wind: 0.2 }, light);
    figure(ctx, 300, 1140, 760, 1, { kind: 'rama', pose: POSES.stand, t, wind: 0.2, bow: { held: 'shoulder' } }, light);
    motes(ctx, t, { n: 24, color: '#9cff9a', core: '#eaffea', r: 2, rise: 6, sway: 50, alpha: 0.5 });
  }

  // ── 8 · the storm, and the flying palace
  const STORM = { light: '#7a6a9e', mid: '#2e2644', dark: '#110d1c', rim: '#c8baff' };
  function stormBg(ctx, t, flash) {
    sky(ctx, [[0, '#06050e'], [0.6, '#1c1430'], [1, '#2f203c']]);
    for (let i = 0; i < 9; i++) {
      const s = 0.6 + hash(i * 2.3) * 0.9;
      const x = mod(hash(i * 5.1) * (W + 1400) - t * 90 * s, W + 1400) - 700;
      const y = 120 + hash(i * 7.3) * 700;
      cloud(ctx, x, y, s, 30 + i, 900, 300, STORM, 0, -1, 0.95);
    }
    if (flash > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = rgba('#b8a8ff', flash * 0.45);
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
  }
  function rain(ctx, t) {
    ctx.save();
    ctx.strokeStyle = 'rgba(190,200,255,0.22)';
    ctx.lineWidth = 1.5;
    const f = t * 1400;
    for (let i = 0; i < 160; i++) {
      const x = mod(hash(i * 1.3) * (W + 400) - f * 0.35, W + 400) - 200;
      const y = mod(hash(i * 2.9) * H + f * (0.8 + hash(i) * 0.4), H + 100) - 50;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 14, y + 44);
      ctx.stroke();
    }
    ctx.restore();
  }
  function flying(ctx, x, y, s, t, flash, lean = 0) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, x, y + s * 0.3, s * 1.6, '#ff8a3a', 0.35);
    ctx.restore();
    lit(ctx, x, y, [-s * 1.3, -s * 1.45, s * 2.6, s * 1.9], (g, col) => {
      g.save();
      g.rotate(lean);
      g.scale(s, s);
      vimana(g, col);
      // on the deck: Ravana, and Sita reaching out
      g.save();
      g.translate(0.52, -0.3);
      g.scale(0.55, 0.55);
      ravanaBody(g, col, t, 0.5);
      g.restore();
      g.save();
      g.translate(0.18, -0.3);
      g.scale(-0.42, 0.42);
      person(g, col, { kind: 'sita', pose: POSES.garland, t, wind: 1.6 });
      g.restore();
      g.restore();
    }, { rim: mix('#7a68b0', '#ffffff', flash), dark: '#0d0916', dx: 0, dy: 5, glow: 6, glowA: 0.3 + flash * 0.5 });
  }
  function sStorm(ctx, t) {
    const flash = Math.max(Math.exp(-(t - 0.8) * 9) * (t > 0.8 ? 1 : 0), Math.exp(-(t - 3.2) * 9) * (t > 3.2 ? 1 : 0));
    stormBg(ctx, t, flash);
    if (t > 0.8 && t < 1.1) lightning(ctx, 400, -20, 620, 700, 17, 1 - (t - 0.8) / 0.3);
    if (t > 3.2 && t < 3.5) lightning(ctx, 1500, -20, 1320, 760, 41, 1 - (t - 3.2) / 0.3);
    const x = lerp(1500, 700, t / 5);
    const y = 520 + Math.sin(t * 1.3) * 14;
    flying(ctx, x, y, 300, t, flash, -0.05);
    ravanaEyes(ctx, x + 0.52 * 300, y - 0.3 * 300, 0.55 * 300, t, 0.9);
    rain(ctx, t);
  }

  // ── 9 · Jatayu
  const CLASH = 2.5;
  function sJatayu(ctx, t) {
    const flash = t > CLASH ? Math.exp(-(t - CLASH) * 6) : 0;
    const [sx, sy] = shake(t, CLASH, 60, 1);
    ctx.save();
    ctx.translate(sx, sy);
    stormBg(ctx, t + 5, flash);
    streaks(ctx, t, { ang: 0.55, speed: 3000, n: 60, alpha: 0.35 * (t < CLASH ? 1 : 0.3), color: '#d8d0ff', thick: 3 });
    flying(ctx, 1350, 560, 300, t, flash, 0.04);
    ravanaEyes(ctx, 1350 + 0.52 * 300, 560 - 0.3 * 300, 0.55 * 300, t, 1);
    const k = eIn(prog(t, 0, CLASH));
    let bx = lerp(-250, 1180, k);
    let by = lerp(60, 470, k);
    let rot = 0.9;
    if (t > CLASH) {
      const f = t - CLASH;
      bx = 1180 - f * 380;
      by = 470 + f * f * 260 + f * 120;
      rot = 0.9 + f * 3;
    }
    const bh = 460;
    lit(ctx, bx, by, [-bh * 1.1, -bh * 1.1, bh * 2.2, bh * 2.2], (g, col) => {
      g.save();
      g.rotate(rot);
      g.scale(bh, bh);
      bird(g, col, Math.sin(t * (t < CLASH ? 4 : 14)));
      g.restore();
    }, { rim: '#e2dcff', dark: '#0b0812', dx: 0, dy: 5, glow: 6, glowA: 0.4 });
    if (t > CLASH) {
      // sparks at the clash, then feathers, slowly
      const f = t - CLASH;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 60; i++) {
        const a = hash(i * 1.7) * TAU;
        const v = 300 + hash(i * 3.1) * 900;
        const px = 1200 + Math.cos(a) * v * f;
        const py = 480 + Math.sin(a) * v * f + 300 * f * f;
        ctx.fillStyle = rgba('#ffd68a', Math.max(0, 1 - f * 0.9));
        ctx.fillRect(px, py, 4, 4);
      }
      ctx.restore();
      ctx.fillStyle = '#0d0a14';
      for (let i = 0; i < 18; i++) {
        const px = 1150 + (hash(i * 4.1) - 0.5) * 500 + Math.sin(f * 2 + i) * 40;
        const py = 450 + hash(i * 6.3) * 200 + f * (60 + hash(i) * 60);
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(Math.sin(f * 3 + i) * 0.8);
        ctx.beginPath();
        ctx.ellipse(0, 0, 26, 7, 0, 0, TAU);
        ctx.fill();
        ctx.restore();
      }
    }
    rain(ctx, t);
    ctx.restore();
  }

  // ── 10 · she lets her jewels fall
  function sAnklet(ctx, t, T) {
    sky(ctx, [[0, '#070b24'], [1, '#1d2b5e']]);
    bokeh(ctx, t, { n: 30, alpha: 0.12, colors: ['#ffd27a', '#ffb347', '#8fb0ff'] });
    const u = t / T;
    const cx = 960 + Math.sin(t * 0.8) * 60;
    const cy = lerp(-120, 760, eOut(u));
    const rot = t * 1.1;
    const sq = 0.35 + 0.3 * Math.abs(Math.cos(t * 0.9));
    const beads = 36;
    for (let i = 0; i < beads; i++) {
      const a = (i / beads) * TAU + rot;
      const x = cx + Math.cos(a) * 220;
      const y = cy + Math.sin(a) * 220 * sq;
      const front = Math.sin(a) > 0;
      const g = ctx.createRadialGradient(x - 4, y - 4, 1, x, y, 13);
      g.addColorStop(0, '#fffbe0');
      g.addColorStop(0.4, '#f4c04a');
      g.addColorStop(1, '#8a5010');
      ctx.fillStyle = g;
      ctx.globalAlpha = front ? 1 : 0.7;
      ctx.beginPath();
      ctx.arc(x, y, 12, 0, TAU);
      ctx.fill();
      if (i % 4 === 0) {
        // a little bell hanging off it
        ctx.beginPath();
        ctx.arc(x, y + 24, 9, Math.PI, 0);
        ctx.lineTo(x + 11, y + 32);
        ctx.lineTo(x - 11, y + 32);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    // glints that come and go on the gold
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 4; i++) {
      const a = hash(i * 9.1) * TAU + rot;
      const x = cx + Math.cos(a) * 220;
      const y = cy + Math.sin(a) * 220 * sq;
      const k = Math.max(0, Math.sin(t * 3 + i * 1.7));
      glow(ctx, x, y, 60 * k, '#fff2c0', 0.8 * k);
      ctx.fillStyle = rgba('#ffffff', k);
      ctx.fillRect(x - 70 * k, y - 1.5, 140 * k, 3);
      ctx.fillRect(x - 1.5, y - 70 * k, 3, 140 * k);
    }
    ctx.restore();
    // other pieces, further off and out of focus
    for (let i = 0; i < 7; i++) {
      const x = 200 + hash(i * 3.3) * 1500;
      const y = mod(hash(i * 5.5) * H + t * (80 + hash(i) * 60), H + 100) - 50;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      glow(ctx, x, y, 40, '#ffc04a', 0.4);
      ctx.restore();
    }
  }

  // ── 11 · Hanuman on the cliff
  const DAY = { light: '#ffffff', mid: '#d9e8ff', dark: '#8ba8d8', rim: '#ffffff' };
  function sCrouch(ctx, t, T) {
    const z = 1 + prog(t, 1.5, T) * 0.12;
    ctx.save();
    ctx.translate(900, 560);
    ctx.scale(z, z);
    ctx.translate(-900, -560);
    sky(ctx, [[0, '#0f2452'], [0.35, '#3a70b8'], [0.55, '#9fd0f0'], [0.6, '#ffe8b8']]);
    sun(ctx, 1550, 600, 44, '#ffffff', '#ffe0a0');
    rays(ctx, 1550, 600, t, { a0: -Math.PI, span: Math.PI, n: 12, alpha: 0.08 });
    for (const [x, y, s, seed] of [[500, 250, 1, 21], [1300, 320, 0.8, 22], [1800, 200, 0.7, 23]]) cloud(ctx, x - t * 10, y, s, seed, 800, 240, { light: '#fff5e0', mid: '#b8c8ea', dark: '#6f86bd', rim: '#fff4d0' }, 0.6, 0.4);
    water(ctx, 640, '#4a86c0', '#0b1f40', 1550, t, '#fff4d0', 0.9);
    lit(ctx, 0, 0, [-100, 560, 1400, 620], (g, col) => {
      g.fillStyle = col;
      g.beginPath();
      g.moveTo(-100, H + 60);
      g.lineTo(-100, 700);
      g.quadraticCurveTo(500, 720, 980, 790);
      g.lineTo(1010, 830);
      g.lineTo(960, 900);
      g.lineTo(1000, H + 60);
      g.fill();
      for (let i = 0; i < 40; i++) {
        const x = i * 24;
        const y = 700 + (x / 980) * 90;
        const sw = Math.sin(t * 5 + i) * 12;
        g.beginPath();
        g.moveTo(x - 4, y + 4);
        g.quadraticCurveTo(x + sw * 0.5, y - 10, x + sw + 14, y - 16 - hash(i) * 12);
        g.lineTo(x + 4, y + 4);
        g.fill();
      }
    }, { rim: '#ffe7b0', dark: '#140e10', dx: -4, dy: 4 });
    figure(ctx, 860, 800, 540, 1, { kind: 'hanu', pose: POSES.crouch, t, wind: 1 }, { rim: '#ffe2a0', dark: '#1a0f0a', dx: -5, dy: 4, glow: 8, glowA: 0.5 });
    streaks(ctx, t, { ang: Math.PI, speed: 900, n: 30, alpha: 0.15, thick: 2 });
    motes(ctx, t, { n: 20, color: '#ffe0a0', r: 1.8, rise: -10, drift: -120, alpha: 0.4 });
    ctx.restore();
    if (t > 2) focusLines(ctx, 860, 540, t, { alpha: 0.5 * prog(t, 2, T), n: 90, rIn: 420, color: '#ffffff' });
  }

  // ── 12 · the leap
  function sLeap(ctx, t) {
    sky(ctx, [[0, '#1552c4'], [0.5, '#4c9cf5'], [1, '#bfe4ff']]);
    sun(ctx, 1520, 230, 70, '#ffffff', '#fff2c0');
    rays(ctx, 1520, 230, t, { n: 16, alpha: 0.1 });
    // clouds racing past at three speeds
    for (let i = 0; i < 12; i++) {
      const s = 0.5 + (i % 3) * 0.45;
      const x = mod(hash(i * 3.7) * (W + 1800) - t * 900 * s, W + 1800) - 900;
      const y = 250 + hash(i * 4.9) * 800;
      cloud(ctx, x, y, s, 50 + i, 900, 280, DAY, 0.5, -0.8, 0.96);
    }
    streaks(ctx, t, { ang: 0, speed: 5200, n: 80, alpha: 0.55, thick: 3 });
    const hx = 820 + Math.sin(t * 0.9) * 30;
    const hy = 560 + Math.cos(t * 1.3) * 20;
    const h = 560;
    lit(ctx, hx, hy, [-h * 1.1, -h * 1.3, h * 2.2, h * 2.0], (g, col) => {
      g.save();
      g.rotate(1.2);
      g.scale(h, h);
      g.translate(0, 0.5);
      person(g, col, { kind: 'hanu', pose: POSES.leap, t, wind: 1.6 });
      g.restore();
    }, { rim: '#fff6d6', dark: '#2a1a14', dx: -5, dy: 5, glow: 10, glowA: 0.5, fill: '#5a3a28' });
    // a lens flare along the line from the sun through the middle
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const [k, r, c, a] of [[0.3, 40, '#ffd0ff', 0.2], [0.55, 90, '#a0e0ff', 0.12], [0.8, 26, '#ffffff', 0.3], [1.2, 140, '#9fb8ff', 0.08]]) {
      const x = lerp(1520, 960, k * 1.6);
      const y = lerp(230, 540, k * 1.6);
      glow(ctx, x, y, r, c, a);
    }
    ctx.restore();
  }

  // ── 13 · Lanka burning
  const LANKA = (() => {
    const r = mulberry(909);
    const out = [];
    let x = -60;
    while (x < W + 60) {
      const w = 50 + r() * 110;
      out.push({ kind: r() < 0.45 ? 'dome' : r() < 0.7 ? 'shikhara' : 'block', x: x + w / 2, w, h: 90 + r() * 240, flag: r() < 0.3, win: r() });
      x += w + r() * 6;
    }
    return out;
  })();
  function sLanka(ctx, t, T) {
    sky(ctx, [[0, '#08040e'], [0.45, '#2a0c16'], [0.8, '#7a2410'], [1, '#c2481a']]);
    // smoke rising across the whole sky
    for (let i = 0; i < 26; i++) {
      const x = hash(i * 2.1) * W + Math.sin(t * 0.4 + i) * 60;
      const y = mod(700 - t * (30 + hash(i) * 30) - hash(i * 3.3) * 700, 900) - 100;
      const r = 120 + hash(i * 5.5) * 200;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(20,8,10,0.45)');
      g.addColorStop(1, 'rgba(20,8,10,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    const front = lerp(-100, W + 200, prog(t, 0.4, T - 0.6));
    ctx.fillStyle = '#3a1308';
    for (const b of CITY.far) building(ctx, b, 760, t, 0.95);
    // the city itself: gold roofs catching the firelight
    const base = 900;
    const gold = ctx.createLinearGradient(0, 500, 0, base);
    gold.addColorStop(0, '#8a4a12');
    gold.addColorStop(1, '#1e0904');
    ctx.fillStyle = gold;
    for (const b of LANKA) building(ctx, b, base, t);
    ctx.fillRect(-60, base, W + 120, H - base + 60);
    // windows
    for (const b of LANKA) {
      if (b.win < 0.3) continue;
      for (let k = 0; k < 2; k++) lamp(ctx, b.x - b.w * 0.2 + k * b.w * 0.4, base - b.h * 0.4, 0.3, 0.7);
    }
    ctx.globalAlpha = 1;
    // fire along every roof the tail has passed
    for (const b of LANKA) {
      if (b.x > front) continue;
      const age = clamp((front - b.x) / 500);
      const top = base - (b.kind === 'dome' ? b.h * 1.05 : b.kind === 'shikhara' ? b.h * 0.8 : b.h);
      for (let k = 0; k < 4; k++) {
        const fx = b.x + (hash(b.x + k) - 0.5) * b.w * 0.8;
        flame(ctx, fx, top + 10 + k * 8, (10 + hash(b.x * 3 + k) * 10) * (0.5 + age * 0.8), t, b.x + k, 0.9);
      }
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      glow(ctx, b.x, top, 110 * age + 30, '#ff6a1a', 0.12);
      ctx.restore();
    }
    motes(ctx, t, { n: 90, color: '#ff7a2a', core: '#ffe0a0', r: 2.4, rise: 90, sway: 40, alpha: 0.8, x0: 0, w: Math.max(1, front), y0: 200, h: 700 });
    // Hanuman, bounding over the roofs with his tail alight
    const hx = front + 60;
    const hop = Math.abs(Math.sin(t * 2.6));
    const hy = 520 - hop * 160;
    const h = 200;
    lit(ctx, hx, hy, [-h, -h * 1.3, h * 2, h * 1.9], (g, col) => {
      g.save();
      g.rotate(1.1);
      g.scale(h, h);
      g.translate(0, 0.5);
      person(g, col, { kind: 'hanu', pose: POSES.leap, t, wind: 1.4, mace: true });
      g.restore();
    }, { rim: '#ffb35a', dark: '#120604', dx: 3, dy: -3, glow: 6, glowA: 0.5 });
    // the burning tail, and the trail it leaves
    // where the curl of the tail ends up once the body is turned to fly
    const c1 = Math.cos(1.1);
    const s1 = Math.sin(1.1);
    const tipX = hx + (-0.17 * c1 - -0.48 * s1) * h;
    const tipY = hy + (-0.17 * s1 + -0.48 * c1) * h;
    for (let i = 0; i < 6; i++) flame(ctx, tipX - i * 34, tipY + i * 10 + Math.sin(t * 8 + i) * 8, 26 - i * 3, t, i * 7, 1 - i * 0.12);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = 'rgba(255,120,40,0.08)';
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  // ── 14 · the bridge
  const VP = [1180, 560];
  function stonePos(i) {
    const z = 1 + i * 0.55;
    return [VP[0] + (-1500 + Math.sin(i * 0.4) * 120) / z, VP[1] + 560 / z, 1 / z];
  }
  function sSetu(ctx, t, T) {
    sky(ctx, [[0, '#223a6c'], [0.3, '#6a6aa0'], [0.45, '#e4876a'], [0.52, '#ffd59a']]);
    sun(ctx, 1280, 548, 50, '#fffaf0', '#ffd08a');
    rays(ctx, 1280, 548, t, { a0: -Math.PI, span: Math.PI, n: 14, alpha: 0.08 });
    for (const [x, y, s, seed] of [[400, 200, 1, 61], [1500, 150, 0.9, 62], [900, 330, 0.6, 63]]) cloud(ctx, x + t * 5, y, s, seed, 900, 220, DAWN, 0.2, 0.9);
    water(ctx, 560, '#6a7fa8', '#0b1a38', 1280, t, '#ffe2b0', 0.8);
    const shown = 6 + Math.floor(prog(t, 0, T - 1) * 36);
    for (let i = 41; i >= 0; i--) {
      if (i > shown) continue;
      const [x, y, s] = stonePos(i);
      const bob = Math.sin(t * 1.5 + i) * 4 * s;
      const w = 520 * s;
      const hgt = 150 * s;
      const r = mulberry(i * 31 + 7);
      ctx.fillStyle = '#4a4050';
      ctx.beginPath();
      for (let k = 0; k < 10; k++) {
        const a = (k / 10) * TAU;
        const rr = 1 + (r() - 0.5) * 0.18;
        ctx.lineTo(x + Math.cos(a) * w / 2 * rr, y + bob + Math.sin(a) * hgt / 2 * rr);
      }
      ctx.closePath();
      ctx.fill();
      const top = ctx.createLinearGradient(0, y - hgt / 2, 0, y + hgt / 2);
      top.addColorStop(0, '#b3a098');
      top.addColorStop(1, 'rgba(90,80,90,0)');
      ctx.fillStyle = top;
      ctx.fill();
      if (s > 0.08) {
        const fresh = i === 0 ? prog(t, 1.2, 2) : 1;
        ctx.save();
        ctx.font = `700 ${Math.round(96 * s)}px ${DEVA}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(255,200,80,0.9)';
        ctx.shadowBlur = 30 * s * (1 + 2 * (1 - fresh));
        ctx.fillStyle = rgba('#ffd66a', 0.25 + 0.75 * fresh);
        ctx.fillText('राम', x, y + bob - 6 * s);
        ctx.restore();
      }
      // the army crossing on it
      if (i < shown - 2 && i > 0) {
        ctx.fillStyle = '#1a1420';
        for (let m = 0; m < 3; m++) {
          const mx = x + (m - 1) * w * 0.25 + Math.sin(t * 3 + i + m) * 4 * s;
          const my = y + bob - hgt * 0.25;
          const mh = 110 * s;
          ctx.beginPath();
          ctx.ellipse(mx, my - mh * 0.45, mh * 0.12, mh * 0.3, 0, 0, TAU);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(mx + mh * 0.04, my - mh * 0.85, mh * 0.1, 0, TAU);
          ctx.fill();
          ctx.lineWidth = mh * 0.04;
          ctx.strokeStyle = '#1a1420';
          ctx.beginPath();
          ctx.moveTo(mx - mh * 0.1, my - mh * 0.3);
          ctx.quadraticCurveTo(mx - mh * 0.4, my - mh * 0.6, mx - mh * 0.25, my - mh * 1.0);
          ctx.stroke();
        }
      }
    }
    // the first stone, falling in, and the water thrown up
    if (t < 1.4) {
      const [x, y, s] = stonePos(0);
      const k = prog(t, 0.2, 0.9);
      if (k < 1) {
        ctx.fillStyle = '#4a4050';
        ctx.beginPath();
        ctx.ellipse(x, lerp(-200, y, eIn(k)), 260 * s, 75 * s, 0.1, 0, TAU);
        ctx.fill();
      }
    }
    if (t > 0.9) {
      const k = t - 0.9;
      const [x, y, s] = stonePos(0);
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - k * 0.8);
      ctx.strokeStyle = '#e8f4ff';
      ctx.lineWidth = 4;
      for (let r = 0; r < 3; r++) {
        ctx.beginPath();
        ctx.ellipse(x, y + 20 * s, (300 + k * 500 + r * 60) * s, (60 + k * 90 + r * 12) * s, 0, 0, TAU);
        ctx.stroke();
      }
      ctx.fillStyle = '#f4faff';
      for (let i = 0; i < 40; i++) {
        const a = -Math.PI * (0.1 + hash(i * 3.3) * 0.8);
        const v = 300 + hash(i * 5.1) * 700;
        const px = x + Math.cos(a) * v * k * s * 1.6;
        const py = y + Math.sin(a) * v * k * s * 1.4 + 900 * k * k * s;
        ctx.beginPath();
        ctx.arc(px, py, 5 + hash(i) * 6, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  // ── 15 · Ravana's eyes
  function sRavanaEyes(ctx, t) {
    eyes(ctx, t, {
      skin: '#6a3a26', shade: '#2a120a', iris: ['#2a0000', '#ff5a14'], pupil: '#120000', lash: '#050202', brow: '#050202', hair: '#040202',
      lidShadow: '#1a0503', irisGlow: '#ff3a0a', slit: true, open: 1 - bump(t, 2.2, 2.4, 0.08), narrow: 0.55, look: [0, 0.05], cy: 600, sp: 400,
      white: '#f0dccb',
      forehead: (c) => {
        // three lines of ash and a red dot: a devotee of Shiva, which he was
        c.save();
        c.strokeStyle = 'rgba(245,238,230,0.9)';
        c.lineCap = 'round';
        c.lineWidth = 12;
        for (let i = 0; i < 3; i++) {
          c.beginPath();
          c.moveTo(760, 280 + i * 30);
          c.quadraticCurveTo(960, 270 + i * 30, 1160, 280 + i * 30);
          c.stroke();
        }
        c.fillStyle = '#c0180e';
        c.beginPath();
        c.arc(960, 312, 16, 0, TAU);
        c.fill();
        c.restore();
      },
      refl: (c, ix, iy, tt) => {
        c.save();
        c.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 6; i++) {
          const x = ix - 60 + i * 24;
          const h = 30 + Math.sin(tt * 9 + i * 2) * 14;
          c.fillStyle = 'rgba(255,190,80,0.35)';
          c.beginPath();
          c.ellipse(x, iy + 50 - h / 2, 8, h / 2, 0, 0, TAU);
          c.fill();
        }
        c.restore();
      },
      light: (c) => {
        const g = c.createLinearGradient(0, H, 0, 400);
        g.addColorStop(0, 'rgba(255,60,10,0.35)');
        g.addColorStop(1, 'rgba(255,60,10,0)');
        c.fillStyle = g;
        c.fillRect(0, 0, W, H);
      },
    });
  }

  // ── 16 · ten heads, twenty arms
  function sTenHeads(ctx, t, T) {
    const u = t / T;
    const flash = t > 1.6 ? Math.exp(-(t - 1.6) * 7) : 0;
    sky(ctx, [[0, '#120000'], [0.5, '#4a0805'], [0.8, '#a8280c'], [1, '#e2561a']]);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, 960, 900, 1100, '#ff5a1a', 0.35);
    ctx.fillStyle = rgba('#ffd0b0', flash * 0.4);
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
    if (t > 1.6 && t < 1.9) lightning(ctx, 1700, -20, 1500, 600, 91, 1 - (t - 1.6) / 0.3);
    // the battlefield far below: fires in rows
    for (let i = 0; i < 40; i++) {
      const x = hash(i * 2.3) * W;
      const y = 930 + hash(i * 4.1) * 120;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      glow(ctx, x, y, 30, '#ff8a2a', 0.5 + 0.3 * Math.sin(t * 8 + i));
      ctx.restore();
    }
    const h = 920;
    const fy = lerp(1400, 1085, eOut(u));
    lit(ctx, 960, fy, [-h * 0.8, -h * 1.22, h * 1.6, h * 1.26], (g, col) => {
      g.save();
      g.scale(h, h);
      ravanaBody(g, col, t, 1);
      g.restore();
    }, { rim: mix('#ff8a4a', '#ffffff', flash), dark: '#100304', dx: 0, dy: 7, glow: 10, glowA: 0.45 });
    ravanaEyes(ctx, 960, fy, h, t, 1);
    motes(ctx, t, { n: 50, color: '#ff6a1a', r: 2.2, rise: 60, alpha: 0.6 });
  }

  // ── 17 · one arrow
  const DRAW_POSE = POSES.draw;
  function arrowTip(x, y, h) {
    const [gx, gy] = handPos(DRAW_POSE, 0);
    return [x + (gx + 0.14) * h, y + gy * h];
  }
  function sDraw(ctx, t, T) {
    const z = 1 + t * 0.03;
    ctx.save();
    ctx.translate(960, 560);
    ctx.scale(z, z);
    ctx.translate(-960, -560);
    sky(ctx, [[0, '#0a0000'], [0.5, '#3a0503'], [1, '#6a1208']]);
    sun(ctx, 1000, 560, 380, '#fff4dc', '#ffb070', 1);
    rays(ctx, 1000, 560, t, { n: 24, alpha: 0.12 });
    // the rock he stands on
    ctx.fillStyle = '#0a0304';
    ctx.beginPath();
    ctx.moveTo(-100, H + 50);
    ctx.lineTo(-100, 1010);
    ctx.lineTo(500, 990);
    ctx.lineTo(1150, 1030);
    ctx.lineTo(1300, H + 50);
    ctx.fill();
    const x = 820;
    const y = 1000;
    const h = 640;
    figure(ctx, x, y, h, 1, { kind: 'rama', pose: DRAW_POSE, t, wind: 1, bow: { held: 'draw', pull: 0.5 } }, { rim: '#fff4d8', dark: '#12060a', dx: -5, dy: 4, glow: 14, glowA: 0.55 });
    // the arrow, and light gathering at its point
    const [tx, ty] = arrowTip(x, y, h);
    const [dx0] = handPos(DRAW_POSE, 1);
    ctx.strokeStyle = '#12060a';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(x + dx0 * h, ty);
    ctx.lineTo(tx, ty);
    ctx.stroke();
    const c = prog(t, 0.2, T);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 80; i++) {
      const f = mod(t * 0.7 + hash(i * 1.3), 1);
      const a = hash(i * 3.1) * TAU + f * 2;
      const r = (1 - f) * (700 + hash(i * 5.7) * 400);
      const px = tx + Math.cos(a) * r;
      const py = ty + Math.sin(a) * r;
      ctx.fillStyle = rgba('#fff2c0', f * 0.9 * c);
      ctx.fillRect(px - 2, py - 2, 4, 4);
      ctx.strokeStyle = rgba('#ffd27a', f * 0.4 * c);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + Math.cos(a) * 40, py + Math.sin(a) * 40);
      ctx.stroke();
    }
    glow(ctx, tx, ty, 60 + 260 * c, '#ffffff', 0.5 + 0.5 * c);
    glow(ctx, tx, ty, 30 + 60 * c, '#ffffff', 1);
    ctx.restore();
    if (t > 1) focusLines(ctx, tx, ty, t, { alpha: 0.5 * prog(t, 1, T), n: 100, rIn: 300, color: '#fff6e0' });
    ctx.restore();
  }

  // ── 18 · release
  function sRelease(ctx, t) {
    sky(ctx, [[0, '#0a0000'], [1, '#6a1208']]);
    sun(ctx, 1000, 560, 380, '#fff4dc', '#ffb070', 1);
    const [tx, ty] = arrowTip(820, 1000, 640);
    figure(ctx, 820, 1000, 640, 1, { kind: 'rama', pose: { ...DRAW_POSE, arms: [DRAW_POSE.arms[0], [-1.2, 1.6]] }, t, wind: 1.4, bow: { held: 'draw', pull: 0.05 } }, { rim: '#fff4d8', dark: '#12060a', dx: -5, dy: 4, glow: 14, glowA: 0.55 });
    const k = eOut(prog(t, 0, 0.25));
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const wdt = 30 + 90 * k;
    const g = ctx.createLinearGradient(0, ty - wdt, 0, ty + wdt);
    g.addColorStop(0, 'rgba(255,190,80,0)');
    g.addColorStop(0.5, 'rgba(255,255,240,1)');
    g.addColorStop(1, 'rgba(255,190,80,0)');
    ctx.fillStyle = g;
    ctx.fillRect(tx, ty - wdt, (W - tx + 100) * k, wdt * 2);
    glow(ctx, tx, ty, 400, '#ffffff', 0.9);
    ctx.restore();
    streaks(ctx, t, { ang: Math.PI, speed: 8000, n: 90, alpha: 0.7, thick: 5, color: '#fff6e0' });
    if (t > 1.1) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, W, H);
    }
  }

  // ── 19 · after
  function sAfter(ctx, t) {
    sky(ctx, [[0, '#ffe4cc'], [0.5, '#ffc6aa'], [1, '#f2a3a6']]);
    rays(ctx, 960, -200, t, { a0: Math.PI * 0.2, span: Math.PI * 0.6, n: 14, alpha: 0.16, color: '#ffffff' });
    for (const [x, y, s, seed] of [[300, 700, 1, 71], [1200, 800, 1.2, 72], [1800, 650, 0.8, 73]]) cloud(ctx, x + t * 10, y, s, seed, 900, 260, { light: '#ffffff', mid: '#ffd6c8', dark: '#e8a0a8', rim: '#ffffff' }, 0, -1);
    petals(ctx, t, { n: 110, fall: 0.8, wind: 20, colors: ['#ffd25a', '#ff9a3c', '#ffffff', '#ff7fa6'] });
    ctx.fillStyle = rgba('#ffffff', 1 - eOut(prog(t, 0, 1.6)));
    ctx.fillRect(0, 0, W, H);
  }

  // ── 20 · the night they came home
  function sDiwali(ctx, t, T) {
    const u = t / T;
    const z = 1 + u * 0.05;
    ctx.save();
    ctx.translate(960, 600);
    ctx.scale(z, z);
    ctx.translate(-960, -600 + u * 30);
    sky(ctx, [[0, '#03061a'], [0.55, '#0f1843'], [0.72, '#2a1f4a']]);
    stars(ctx, t, 260, 640);
    cityFar(ctx, '#1a1636', t);
    cityNear(ctx, '#0a0816', t);
    // the lamps, lit outward from the palace in a wave
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < LAMPS.length; i++) {
      const [x, y] = LAMPS[i];
      const at = 0.8 + (Math.abs(x - 960) / 960) * 3.5 + hash(i * 1.1) * 0.5 + (y > 800 ? 0.6 : 0);
      const a = prog(t, at, at + 0.4) * (0.8 + 0.2 * Math.sin(t * 7 + i));
      lamp(ctx, x, y, 0.55, a);
    }
    ctx.restore();
    ctx.globalAlpha = 1;
    // the river, with lamps set floating on it
    const rg = ctx.createLinearGradient(0, 800, 0, H);
    rg.addColorStop(0, '#1a1330');
    rg.addColorStop(1, '#05040c');
    ctx.fillStyle = rg;
    ctx.fillRect(-100, 880, W + 200, 300);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 70; i++) {
      const x = mod(hash(i * 2.7) * W + t * (8 + hash(i) * 10), W + 100) - 50;
      const y = 900 + hash(i * 4.3) * 180;
      const a = prog(t, 2 + hash(i) * 3, 3 + hash(i) * 3);
      lamp(ctx, x, y, 0.5, a);
      ctx.globalAlpha = a * 0.25;
      ctx.fillStyle = '#ffae42';
      ctx.fillRect(x - 1.5, y + 6, 3, 40 + hash(i) * 30);
    }
    ctx.restore();
    ctx.globalAlpha = 1;
    // the Pushpaka, bringing them home, lit gold
    const vk = eInOut(prog(t, 0, 6));
    const vx = lerp(1650, 1120, vk);
    const vy = lerp(90, 330, vk);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, vx, vy, 260, '#ffc46a', 0.5);
    ctx.restore();
    ctx.save();
    ctx.translate(vx, vy);
    ctx.scale(110, 110);
    const vg = ctx.createLinearGradient(0, -1.2, 0, 0.3);
    vg.addColorStop(0, '#fff2c0');
    vg.addColorStop(1, '#c47a1a');
    vimana(ctx, vg);
    ctx.restore();
    // sky lanterns going up
    ctx.save();
    for (let i = 0; i < 26; i++) {
      const born = 2.5 + hash(i * 3.9) * 6;
      if (t < born) continue;
      const k = t - born;
      const x = hash(i * 5.3) * W + Math.sin(k * 0.8 + i) * 30;
      const y = 1000 - k * (60 + hash(i) * 40);
      ctx.globalCompositeOperation = 'lighter';
      lamp(ctx, x, y, 1.1, 0.6);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#ffb45a';
      ctx.beginPath();
      ctx.moveTo(x - 11, y - 18);
      ctx.lineTo(x + 11, y - 18);
      ctx.lineTo(x + 8, y + 10);
      ctx.lineTo(x - 8, y + 10);
      ctx.fill();
    }
    ctx.restore();
    ctx.restore();
    // the people watching, in the near dark, lamps in their hands
    ctx.fillStyle = '#030208';
    for (let i = 0; i < 22; i++) {
      const x = i * 92 + hash(i) * 40 - 20;
      const hh = 150 + hash(i * 3.1) * 60;
      ctx.beginPath();
      ctx.arc(x, H - hh, 30, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(x, H - hh + 150, 70, 130, 0, 0, TAU);
      ctx.fill();
      if (i % 3 === 1) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        lamp(ctx, x + 40, H - hh + 40, 1.3, 0.9);
        ctx.restore();
        ctx.globalAlpha = 1;
      }
    }
  }

  // ── 21 · the end card
  function sEnd(ctx, t, T) {
    ctx.fillStyle = '#030204';
    ctx.fillRect(0, 0, W, H);
    diya(ctx, 925, 770, 46, t + 3, 5, prog(t, 0.2, 1.2));
    titleCard(ctx, t + 1.2, prog(t, 0.3, 1.3), 430, 120);
    ctx.save();
    ctx.textAlign = 'center';
    ctx.globalAlpha = prog(t, 1.4, 2.2);
    ctx.fillStyle = 'rgba(255,240,215,0.85)';
    ctx.font = `italic 400 34px ${SERIF}`;
    ctx.fillText('after Valmiki', W / 2, 640);
    ctx.font = `500 20px ${SANS}`;
    ctx.letterSpacing = '4px';
    ctx.fillStyle = 'rgba(255,240,215,0.5)';
    ctx.fillText('A FAN ANIMATION · PICTURES AND MUSIC MADE IN CODE', W / 2 + 2, 690);
    ctx.letterSpacing = '0px';
    ctx.restore();
    void T;
  }

  /* ══════════════════════════════════════════════════════════════════════
     the cut
     ══════════════════════════════════════════════════════════════════════ */

  const SHOTS = [
    [0, 6, sDiya, 0],
    [6, 15, sAyodhya, 0],
    [15, 20, sHall, 64],
    [20, 23, sRamaEyes, 270],
    [23, 29, sSnap, 64],
    [29, 33, sSita, 64],
    [33, 41, sExile, 64],
    [41, 46, sDeer, 64],
    [46, 51, sStorm, 64],
    [51, 55, sJatayu, 64],
    [55, 58, sAnklet, 64],
    [58, 61, sCrouch, 64],
    [61, 67, sLeap, 64],
    [67, 74, sLanka, 64],
    [74, 81, sSetu, 64],
    [81, 84, sRavanaEyes, 270],
    [84, 88, sTenHeads, 64],
    [88, 91, sDraw, 64],
    [91, 93.5, sRelease, 64],
    [93.5, 97, sAfter, 64],
    [97, 108, sDiwali, 64],
    [108, 114, sEnd, 0],
  ];

  /** Frames that hit: [from, to, centre x, centre y]. */
  const IMPACTS = [
    [23 + SNAP, 23 + SNAP + 0.45, 960, 240],
    [51 + CLASH, 51 + CLASH + 0.4, 1200, 480],
    [91.6, 92.1, 1500, 540],
  ];

  const CAPTIONS = [
    [1.8, 5.7, 'Long ago, in Ayodhya, a prince was born to set the world right.'],
    [15.3, 19.8, 'At Mithila lay a bow no king could even lift — the bow of Shiva.'],
    [23.3, 25.8, 'Rama lifted it.'],
    [27.4, 28.9, 'And it broke.'],
    [29.4, 32.8, 'Sita chose him.'],
    [33.4, 37.1, 'Then, on the eve of his crowning, a promise sent him to the forest for fourteen years.'],
    [37.3, 40.8, 'Sita and Lakshmana would not let him go alone.'],
    [41.3, 43.6, 'In the forest, a golden deer…'],
    [43.8, 45.8, '…and it was a trap.'],
    [46.4, 50.8, 'Ravana, king of Lanka, carried Sita off into the sky.'],
    [51.3, 54.9, 'Old Jatayu fought for her, and fell.'],
    [55.3, 57.9, 'She let her jewels fall, to leave a trail.'],
    [58.3, 60.9, 'Hanuman leapt the ocean to find her.'],
    [67.4, 70.8, 'He found her in the Ashoka grove.'],
    [71.0, 73.8, 'Then he set Lanka alight.'],
    [74.5, 80.7, 'Stone by stone, each carved with Rama’s name, a bridge crossed the sea.'],
    [84.4, 87.8, 'Ten heads. Twenty arms.'],
    [89.0, 90.9, 'One arrow.'],
    [94.8, 96.9, 'And the war was over.'],
    [98.2, 102.4, 'They came home after fourteen years.'],
    [102.6, 107.7, 'And Ayodhya lit every lamp it had, to show them the way.'],
  ];

  function captions(ctx, t, bar) {
    for (const [a, b, text] of CAPTIONS) {
      if (t < a || t > b) continue;
      const al = Math.min(prog(t, a, a + 0.25), 1 - prog(t, b - 0.3, b));
      ctx.save();
      ctx.globalAlpha = al;
      ctx.font = `600 42px ${SANS}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      const lines = wrapText(ctx, text, 1500);
      const y0 = H - Math.max(bar, 30) - 36 - (lines.length - 1) * 54;
      ctx.lineJoin = 'round';
      lines.forEach((ln, i) => {
        ctx.strokeStyle = 'rgba(0,0,0,0.85)';
        ctx.lineWidth = 8;
        ctx.strokeText(ln, W / 2, y0 + i * 54);
        ctx.fillStyle = '#fffaf0';
        ctx.fillText(ln, W / 2, y0 + i * 54);
      });
      ctx.restore();
    }
  }

  let grainTiles = null;
  function grain(ctx, t) {
    if (!grainTiles) {
      grainTiles = [];
      for (let k = 0; k < 4; k++) {
        const c = can(256, 256);
        const g = c.getContext('2d');
        const img = g.createImageData(256, 256);
        const r = mulberry(k * 1013 + 5);
        for (let i = 0; i < img.data.length; i += 4) {
          const v = r() * 255;
          img.data[i] = v;
          img.data[i + 1] = v;
          img.data[i + 2] = v;
          img.data[i + 3] = 255;
        }
        g.putImageData(img, 0, 0);
        grainTiles.push(ctx.createPattern(c, 'repeat'));
      }
    }
    const f = Math.floor(t * 24);
    const p = grainTiles[f % 4];
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = 0.07;
    ctx.translate(-(hash(f) * 256), -(hash(f * 3.1) * 256));
    ctx.fillStyle = p;
    ctx.fillRect(0, 0, W + 256, H + 256);
    ctx.restore();
  }

  let bloomC = null;
  /**
   * The picture, shrunk to a thumbnail and laid back over itself enlarged:
   * the scaling does the blurring, and 'screen' lets only the light through.
   */
  function bloom(ctx) {
    const src = ctx.canvas;
    if (!src || !src.width) return;
    if (!bloomC) bloomC = [can(240, 135), can(96, 54)];
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    for (const [c, a] of [[bloomC[0], 0.22], [bloomC[1], 0.18]]) {
      const g = c.getContext('2d');
      g.globalCompositeOperation = 'copy';
      g.drawImage(src, 0, 0, c.width, c.height);
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = a;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(c, 0, 0, src.width, src.height);
    }
    ctx.restore();
  }

  function vignette(ctx) {
    const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 1.05);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  function frame(ctx, t) {
    t = clamp(t, 0, DURATION - 0.001);
    let shot = SHOTS[SHOTS.length - 1];
    for (const s of SHOTS) if (t >= s[0] && t < s[1]) { shot = s; break; }
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, W, H);
    ctx.clip();
    ctx.save();
    shot[2](ctx, t - shot[0], shot[1] - shot[0], t);
    ctx.restore();
    for (const [a, b, cx, cy] of IMPACTS) if (t >= a && t < b) impactFrame(ctx, t, a * 10, cx, cy);
    bloom(ctx);
    vignette(ctx);
    grain(ctx, t);
    const bar = shot[3];
    if (bar) {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, bar);
      ctx.fillRect(0, H - bar, W, bar);
    }
    captions(ctx, t, bar);
    // in from black, and out to it
    const fade = Math.max(1 - prog(t, 0, 0.8), prog(t, DURATION - 1.4, DURATION - 0.1));
    if (fade > 0) {
      ctx.fillStyle = rgba('#000000', fade);
      ctx.fillRect(0, 0, W, H);
    }
    ctx.restore();
  }

  /* ══════════════════════════════════════════════════════════════════════
     the score — original, synthesised here, sample by sample
     A tanpura under nearly all of it; a bansuri for the tunes; strings and a
     choir for the big moments; dhol and taiko for the fights; and the sound
     effects anime can't do without — risers, whooshes, impacts, the glint.
     Sa is D. The main theme leans on the sharp fourth, the way Yaman does;
     the sad one borrows Bhairavi's flat second.
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
  const SAW = table(Array.from({ length: 28 }, (_, h) => 1 / Math.pow(h + 1, 1.05)));
  const TANP = table([1, 0.7, 0.55, 0.5, 0.42, 0.36, 0.3, 0.26, 0.2, 0.17, 0.14, 0.12, 0.1, 0.08, 0.06]);
  const choirTables = new Map();
  function choirTable(m, vowel = 'aa') {
    const key = m + vowel;
    if (choirTables.has(key)) return choirTables.get(key);
    const F = vowel === 'aa' ? [[750, 130, 1], [1180, 160, 0.5], [2600, 300, 0.12]] : [[320, 110, 1], [800, 160, 0.55], [2400, 300, 0.1]];
    const f0 = m2f(m);
    const amps = [];
    for (let h = 1; h <= 40; h++) {
      const f = f0 * h;
      if (f > 6000) break;
      let a = 0.02;
      for (const [c, bw, g] of F) a += g * Math.exp(-Math.pow((f - c) / bw, 2));
      amps.push(a);
    }
    const tb = table(amps);
    choirTables.set(key, tb);
    return tb;
  }

  async function synth(sr, onProgress) {
    const N = Math.ceil((DURATION + 3) * sr);
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
    const osc = (tb) => {
      let ph = 0;
      const n = tb.length - 1;
      return (f) => {
        ph += (f * n) / sr;
        if (ph >= n) ph -= n * Math.floor(ph / n);
        const i = ph | 0;
        return tb[i] + (tb[i + 1] - tb[i]) * (ph - i);
      };
    };
    let nseed = 1;
    const noise = () => { const r = mulberry(nseed++ * 7919); return () => r() * 2 - 1; };
    /** A state-variable band-pass, tuned per sample. */
    const bandpass = () => {
      let lp = 0;
      let bp = 0;
      return (x, f, q = 0.7) => {
        const F = 2 * Math.sin((Math.PI * Math.min(f, sr / 6)) / sr);
        const hp = x - lp - q * bp;
        bp += F * hp;
        lp += F * bp;
        return bp;
      };
    };
    const lowpass = (k) => { let y = 0; return (x) => (y += k * (x - y)); };

    // ── instruments
    const tanpura = (t0, t1, sa = 50, gain = 1) => {
      const cycle = [sa - 5, sa, sa, sa - 12];
      let k = 0;
      for (let t = t0; t < t1; t += 0.62, k++) {
        const m = cycle[k % 4];
        const o1 = osc(TANP);
        const o2 = osc(TANP);
        const f = m2f(m);
        const fade = Math.min(1, (t - t0) / 1.5, (t1 - t) / 1.5);
        voice(t, 3.2, (u) => {
          const env = Math.min(1, u / 0.01) * Math.exp(-u * 0.9);
          // the jawari: a buzz that swells a moment after the pluck
          const buzz = 1 + 0.6 * Math.exp(-Math.pow((u - 0.35) / 0.25, 2));
          return (o1(f) * 0.6 + o2(f * 1.003) * 0.4 * buzz) * env;
        }, 0.045 * gain * Math.max(0, fade), (k % 4) / 2 - 0.75, 0.5);
      }
    };
    /** A bansuri: a line of notes with glides between them, breath in the tone. */
    const flute = (notes, gain = 1, pan = 0.1, oct = 0) => {
      if (!notes.length) return;
      const t0 = notes[0][0];
      const end = notes[notes.length - 1][0] + notes[notes.length - 1][2];
      const nz = noise();
      const lp = lowpass(0.08);
      let ph = 0;
      voice(t0, end - t0 + 0.4, (u) => {
        const t = t0 + u;
        let i = 0;
        while (i < notes.length - 1 && notes[i + 1][0] <= t) i++;
        const [ns, m, d] = notes[i];
        const prev = i > 0 ? notes[i - 1][1] : m;
        const into = t - ns;
        const glide = clamp(into / 0.09);
        const mm = lerp(prev, m, eOut(glide)) + oct;
        const vib = 1 + 0.007 * Math.sin(TAU * 5.3 * into) * clamp((into - 0.25) / 0.4);
        const f = m2f(mm) * vib;
        ph += f / sr;
        const tone = Math.sin(TAU * ph) + 0.22 * Math.sin(TAU * 2 * ph) + 0.05 * Math.sin(TAU * 3 * ph);
        const atk = i === 0 ? clamp(into / 0.08) : 1;
        const gap = i < notes.length - 1 && notes[i + 1][0] - (ns + d) > 0.05;
        const rel = into > d ? Math.max(0, 1 - (into - d) / 0.15) : 1;
        const env = atk * (gap || i === notes.length - 1 ? rel : 1) * (0.85 + 0.15 * Math.sin(into * 3));
        const breath = lp(nz()) * 1.8;
        return (tone * 0.8 + breath * 0.25) * env;
      }, 0.09 * gain, pan, 0.6);
    };
    /** Write a phrase as [beats, midi] pairs at a tempo, starting at t. */
    const phrase = (t, bpm, seq) => {
      const out = [];
      const b = 60 / bpm;
      let at = t;
      for (const [beats, m] of seq) {
        if (m != null) out.push([at, m, beats * b * 0.96]);
        at += beats * b;
      }
      return out;
    };
    const pad = (t0, dur, ms, gain = 1, bright = 0.06, pan = 0) => {
      for (const m of ms) {
        const o1 = osc(SAW);
        const o2 = osc(SAW);
        const f = m2f(m);
        const lp = lowpass(bright);
        const lp2 = lowpass(bright);
        voice(t0, dur + 2, (u) => {
          const env = Math.min(1, u / 1.4) * (u > dur ? Math.max(0, 1 - (u - dur) / 2) : 1);
          const vib = 1 + 0.003 * Math.sin(TAU * 4.8 * u + m);
          return lp2(lp((o1(f * 1.003 * vib) + o2(f * 0.997 * vib)) * 0.5)) * env;
        }, 0.07 * gain, pan + (m % 3 - 1) * 0.3, 0.7);
      }
    };
    const brass = (t0, dur, ms, gain = 1) => {
      for (const m of ms) {
        const o = osc(SAW);
        const f = m2f(m);
        let y = 0;
        voice(t0, dur + 0.5, (u) => {
          const env = Math.min(1, u / 0.06) * (u > dur ? Math.max(0, 1 - (u - dur) / 0.5) : 1) * (0.8 + 0.2 * Math.exp(-u * 3));
          const k = 0.03 + 0.25 * env * Math.exp(-u * 1.5) + 0.05;
          y += k * (o(f) - y);
          return y * env;
        }, 0.08 * gain, (m % 5 - 2) * 0.15, 0.5);
      }
    };
    const choir = (t0, dur, ms, gain = 1, vowel = 'aa') => {
      for (const m of ms) {
        for (const d of [-0.004, 0.004]) {
          const o = osc(choirTable(m, vowel));
          const f = m2f(m) * (1 + d);
          voice(t0, dur + 2.5, (u) => {
            const env = Math.min(1, u / 1.2) * (u > dur ? Math.max(0, 1 - (u - dur) / 2.5) : 1);
            return o(f * (1 + 0.005 * Math.sin(TAU * 5 * u + m + d * 900))) * env;
          }, 0.045 * gain, d > 0 ? 0.35 : -0.35, 0.9);
        }
      }
    };
    /** Plucked strings, a little like a santoor: Karplus–Strong, bright. */
    let kseed = 1;
    const santoor = (t0, m, vel = 1, pan = 0) => {
      const f = m2f(m);
      const n = Math.max(2, Math.round(sr / f));
      const buf = new Float32Array(n);
      const r = mulberry(kseed++ * 104729);
      for (let i = 0; i < n; i++) buf[i] = r() * 2 - 1;
      let idx = 0;
      voice(t0, 2.4, (u) => {
        const a = buf[idx];
        const b = buf[(idx + 1) % n];
        buf[idx] = (a * 0.6 + b * 0.4) * 0.997;
        idx = (idx + 1) % n;
        return a * Math.min(1, (2.4 - u) / 0.2);
      }, 0.12 * vel, pan, 0.5);
    };
    const bell = (t0, m, gain = 1, pan = 0) => {
      const f = m2f(m);
      const parts = [[1, 1, 1.2], [2.76, 0.5, 2], [5.4, 0.25, 3.5], [8.93, 0.12, 5], [0.5, 0.35, 0.8]];
      voice(t0, 5, (u) => {
        let s = 0;
        for (const [k, a, d] of parts) s += a * Math.sin(TAU * f * k * u) * Math.exp(-u * d);
        return s * Math.min(1, u / 0.002);
      }, 0.06 * gain, pan, 0.8);
    };
    const glint = (t0, gain = 1) => {
      voice(t0, 1.2, (u) => {
        const f = 2600 + 1800 * eOut(clamp(u / 0.15));
        return (Math.sin(TAU * f * u) + 0.4 * Math.sin(TAU * f * 1.5 * u)) * Math.exp(-u * 4) * Math.min(1, u / 0.005);
      }, 0.05 * gain, 0.2, 1);
    };
    const drum = (t0, kind, vel = 1, pan = 0) => {
      const nz = noise();
      const lp = lowpass(kind === 'taiko' ? 0.05 : 0.2);
      if (kind === 'taiko') {
        voice(t0, 1.6, (u) => {
          const f = 52 + 70 * Math.exp(-u * 22);
          return Math.sin(TAU * f * u) * Math.exp(-u * 3.2) + lp(nz()) * Math.exp(-u * 30) * 1.2;
        }, 0.5 * vel, pan, 0.35);
      } else if (kind === 'dhol') {
        voice(t0, 0.6, (u) => {
          const f = 95 + 60 * Math.exp(-u * 30);
          return Math.sin(TAU * f * u) * Math.exp(-u * 8) + nz() * Math.exp(-u * 60) * 0.35;
        }, 0.32 * vel, pan, 0.2);
      } else {
        // the high side of the dhol: a crack with a ring in it
        voice(t0, 0.35, (u) => (Math.sin(TAU * 380 * u) * 0.6 + Math.sin(TAU * 940 * u) * 0.3) * Math.exp(-u * 18) + nz() * Math.exp(-u * 70) * 0.5, 0.2 * vel, pan + 0.2, 0.25);
      }
    };
    const rhythm = (t0, t1, bpm, pat, kind, vel = 1, pan = 0) => {
      const step = 60 / bpm / 2;
      let i = 0;
      for (let t = t0; t < t1 - 0.01; t += step, i++) {
        const c = pat[i % pat.length];
        if (c === 'x') drum(t, kind, vel, pan);
        if (c === 'o') drum(t, kind, vel * 0.55, pan);
      }
    };
    const boom = (t0, gain = 1) => {
      const nz = noise();
      const lp = lowpass(0.02);
      const hp = lowpass(0.3);
      voice(t0, 4, (u) => {
        const f = 30 + 60 * Math.exp(-u * 6);
        const sub = Math.sin(TAU * f * u) * Math.exp(-u * 1.4);
        const n = nz();
        const rumble = lp(n) * 3 * Math.exp(-u * 1.1);
        const crash = (n - hp(n)) * Math.exp(-u * 2.5) * 0.5;
        return (sub + rumble + crash) * Math.min(1, u / 0.003);
      }, 0.7 * gain, 0, 0.6);
    };
    const riser = (t0, dur, gain = 1) => {
      const nz = noise();
      const bp = bandpass();
      voice(t0, dur, (u) => {
        const k = u / dur;
        const f = 300 * Math.pow(12, k);
        return (bp(nz(), f, 0.35) * 1.5 + Math.sin(TAU * (180 * Math.pow(6, k)) * u) * 0.15) * Math.pow(k, 2);
      }, 0.25 * gain, 0, 0.5);
    };
    const whoosh = (t0, dur, gain = 1, pan = 0) => {
      const nz = noise();
      const bp = bandpass();
      voice(t0, dur, (u) => {
        const k = u / dur;
        const f = 400 + 2600 * Math.sin(Math.PI * k);
        return bp(nz(), f, 0.5) * Math.sin(Math.PI * k) * 1.6;
      }, 0.3 * gain, pan, 0.4);
    };
    const wind = (t0, dur, gain = 1) => {
      const nz = noise();
      const bp = bandpass();
      voice(t0, dur, (u) => {
        const f = 500 + 300 * Math.sin(u * 0.7) + 200 * Math.sin(u * 1.9);
        return bp(nz(), f, 0.25) * Math.min(1, u / 1, (dur - u) / 1);
      }, 0.12 * gain, 0, 0.2);
    };
    const rainfall = (t0, dur, gain = 1) => {
      const nz = noise();
      const lp = lowpass(0.5);
      voice(t0, dur, (u) => { const n = nz(); return (n - lp(n)) * Math.min(1, u / 0.5, (dur - u) / 0.5); }, 0.06 * gain, 0, 0.2);
    };
    const thunder = (t0, gain = 1) => {
      const nz = noise();
      const lp = lowpass(0.012);
      const lp2 = lowpass(0.004);
      voice(t0, 4, (u) => {
        const mod = 0.6 + 0.4 * Math.sin(u * 7) * Math.sin(u * 2.3);
        return (lp(nz()) * 6 + lp2(nz()) * 10) * Math.exp(-u * 0.9) * mod * Math.min(1, u / 0.02);
      }, 0.5 * gain, -0.2, 0.4);
    };
    const crackle = (t0, dur, gain = 1) => {
      const nz = noise();
      const r = mulberry(99);
      const lp = lowpass(0.05);
      let pop = 0;
      voice(t0, dur, (u) => {
        if (r() < 0.0009) pop = 1;
        pop *= 0.992;
        return (lp(nz()) * 1.5 + nz() * pop * 0.8) * Math.min(1, u / 0.8, (dur - u) / 0.8);
      }, 0.18 * gain, 0.1, 0.3);
    };
    const shimmer = (t0, dur, gain = 1) => {
      const scale = [86, 88, 90, 93, 95, 98, 100];
      const r = mulberry(Math.floor(t0 * 100));
      for (let t = t0; t < t0 + dur; t += 0.08 + r() * 0.12) {
        const f = m2f(scale[Math.floor(r() * scale.length)]);
        voice(t, 0.8, (u) => Math.sin(TAU * f * u) * Math.exp(-u * 6) * Math.min(1, u / 0.003), 0.025 * gain, r() * 2 - 1, 1);
      }
    };
    const splash = (t0) => {
      const nz = noise();
      const lp = lowpass(0.15);
      voice(t0, 1.5, (u) => lp(nz()) * Math.exp(-u * 3) * Math.min(1, u / 0.01) * 2, 0.35, -0.3, 0.5);
    };

    // ── the cue sheet
    const D = 62; // Sa, in the middle
    // the main theme, with the sharp fourth
    const THEME = [[1, 69], [0.5, 71], [0.5, 73], [1.5, 74], [0.5, 73], [0.5, 71], [1.5, 69], [0.5, 66], [0.5, 68], [1, 69], [0.5, 71], [0.5, 69], [0.5, 66], [0.5, 64], [2, 62]];
    // the forest theme, with the flat second
    const SAD = [[1, 74], [0.5, 72], [0.5, 70], [1.5, 69], [0.5, 67], [0.5, 65], [1, 63], [2, 62], [0.5, null], [1, 65], [0.5, 67], [0.5, 69], [1, 70], [0.5, 69], [0.5, 67], [2.5, 62]];

    // 0 · the lamp
    tanpura(0.2, 23, 50, 1);
    bell(0.9, 86, 0.6, 0.3);
    flute([[2.2, 69, 1.1], [3.3, 71, 0.5], [3.8, 69, 0.4], [4.2, 66, 0.4], [4.6, 64, 0.4], [5.0, 62, 1.6]], 0.9);
    // 1 · Ayodhya, and the title
    pad(6, 9, [50, 57, 62, 66], 0.8);
    flute(phrase(6.4, 96, THEME), 1);
    drum(9.5, 'taiko', 1.1);
    boom(9.5, 0.5);
    choir(9.5, 5, [62, 66, 69, 74], 0.9);
    bell(9.5, 74, 0.8, -0.2);
    glint(10.4, 1);
    shimmer(10.4, 2.5, 0.8);
    // 2 · the hall
    pad(15, 5, [38, 45, 50], 0.9, 0.03);
    rhythm(15.5, 20, 100, 'x..ox.o.', 'dhol', 0.6);
    drum(19.2, 'taiko', 0.8);
    // 3 · his eyes
    pad(20, 3, [86], 0.35, 0.2);
    glint(22.2, 1.3);
    // 4 · the bow
    riser(23.6, 3.0, 1.2);
    for (let i = 0; i < 18; i++) {
      const at = 24 + 2.55 * (1 - Math.pow(1 - i / 18, 1.8));
      drum(at, i % 3 === 2 ? 'na' : 'dhol', 0.5 + i * 0.03);
    }
    choir(23.4, 3.2, [50, 57, 62], 0.9);
    choir(24.9, 1.7, [66, 69], 0.7);
    boom(26.6, 1.3);
    drum(26.6, 'taiko', 1.4);
    choir(26.6, 2.4, [62, 66, 69, 74, 78], 1.2);
    brass(26.6, 1.6, [50, 57, 62, 66], 1);
    bell(27.0, 81, 0.8, 0.4);
    shimmer(26.8, 2.2, 1);
    // 5 · Sita
    pad(29, 4, [62, 66, 69, 73], 0.55, 0.1);
    for (let i = 0; i < 14; i++) santoor(29.1 + i * 0.26, [62, 66, 69, 74, 78, 74, 69, 66][i % 8] + 12, 0.8, (i % 2) * 0.6 - 0.3);
    flute(phrase(29.8, 84, [[1, 74], [0.5, 76], [0.5, 78], [2, 76], [1, 74]]), 0.8, -0.1);
    // 6 · the forest
    tanpura(33, 46, 50, 0.9);
    pad(33, 8, [50, 57, 62, 65], 0.6, 0.04);
    flute(phrase(33.6, 64, SAD), 0.95);
    // 7 · the deer
    shimmer(41.2, 2.6, 1.1);
    for (let i = 0; i < 8; i++) bell(41.3 + i * 0.3, [86, 88, 90, 92, 94, 92, 90, 88][i], 0.25, i % 2 ? 0.5 : -0.5);
    pad(41, 2.6, [62, 68, 72], 0.45, 0.08);
    boom(43.8, 0.5);
    pad(43.8, 2.2, [50, 51, 56], 0.8, 0.03);
    // 8 · the storm
    rainfall(46, 9, 1);
    thunder(46.8, 1);
    thunder(49.2, 0.9);
    pad(46, 5, [38, 44, 50], 1, 0.02);
    choir(46.3, 4.5, [50, 53, 56], 0.8, 'oo');
    for (let t = 46.4; t < 51; t += 1.2) drum(t, 'taiko', 0.7);
    // 9 · Jatayu
    rhythm(51, 53.5, 150, 'xoxoxxox', 'dhol', 0.8);
    rhythm(51, 53.5, 150, '..x...x.', 'na', 0.7);
    whoosh(51.3, 2.2, 1.2, -0.4);
    boom(53.5, 1.1);
    drum(53.5, 'taiko', 1.3);
    flute(phrase(53.8, 72, [[0.5, 70], [0.5, 69], [0.5, 67], [1.5, 63]]), 0.7);
    // 10 · the anklet
    for (let i = 0; i < 16; i++) bell(55.2 + i * 0.17 + hash(i) * 0.05, 96 + (i % 4), 0.12, (hash(i * 3) - 0.5));
    pad(55, 3, [62, 65, 69], 0.5, 0.06);
    // 11 · Hanuman on the cliff
    wind(58, 3.2, 1);
    tanpura(58, 67, 50, 0.7);
    for (let i = 0; i < 10; i++) drum(58.2 + 2.7 * (1 - Math.pow(1 - i / 10, 1.6)), 'taiko', 0.5 + i * 0.05);
    choir(58.4, 2.6, [50, 57, 62], 0.9);
    riser(59.3, 1.7, 1);
    // 12 · the leap
    whoosh(60.95, 1.2, 1.5);
    boom(61, 0.8);
    brass(61, 6, [50, 57, 62], 0.9);
    choir(61, 6, [62, 66, 69, 74], 1);
    rhythm(61, 67, 120, 'x.oxx.o.', 'dhol', 0.8);
    rhythm(61, 67, 120, '..x...xx', 'na', 0.6);
    flute(phrase(61.2, 120, THEME), 1.1, 0.1, 12);
    for (let t = 62.5; t < 67; t += 1.5) whoosh(t, 0.9, 0.5, hash(t) - 0.5);
    // 13 · Lanka
    crackle(67, 7.2, 1.2);
    rhythm(67, 74, 132, 'xoxxoxox', 'dhol', 0.85);
    rhythm(67, 74, 132, 'x...x.x.', 'taiko', 0.6);
    for (let i = 0; i < 7; i++) brass(67 + i, 0.8, [50 + [0, 3, 5, 7, 5, 3, 0][i]], 0.9);
    choir(67.2, 6.5, [50, 53, 57, 62], 0.8);
    // 14 · the bridge
    splash(75.0);
    rhythm(75.2, 81, 100, 'x.o.x.oo', 'dhol', 0.6);
    pad(74, 7, [50, 57, 62, 66], 0.7, 0.06);
    flute(phrase(75.4, 90, [[1, 69], [0.5, 71], [0.5, 73], [1.5, 74], [0.5, 76], [0.5, 74], [1, 73], [1, 71], [2, 69]]), 0.9);
    for (let i = 0; i < 9; i++) drum(76.5 + i * 0.5 + hash(i) * 0.2, 'dhol', 0.25, 0.4);
    // 15 · his eyes
    pad(81, 3, [26, 33, 38], 1.2, 0.015);
    choir(81.2, 2.8, [38, 44, 50], 0.8, 'oo');
    for (const t of [81.4, 82.2, 83.0, 83.6]) drum(t, 'taiko', 0.6);
    // 16 · ten heads
    boom(84.1, 0.9);
    thunder(85.6, 1);
    brass(84.1, 3.8, [38, 45, 50, 51], 1.1);
    choir(84.1, 3.9, [50, 53, 56, 62], 1.1);
    rhythm(84.1, 88, 110, 'x..x..x.', 'taiko', 0.9);
    // 17 · one arrow
    riser(88, 3, 1.4);
    choir(88, 3, [62, 69, 74], 1);
    for (let i = 0; i < 24; i++) drum(88.1 + 2.85 * (1 - Math.pow(1 - i / 24, 2)), i % 2 ? 'na' : 'dhol', 0.4 + i * 0.025);
    // 18 · release
    whoosh(90.95, 0.7, 1.6);
    boom(91.0, 1.1);
    boom(91.6, 1.4);
    drum(91.6, 'taiko', 1.5);
    brass(91.6, 2, [50, 57, 62, 66, 69], 1.2);
    choir(91.6, 5.2, [62, 66, 69, 74, 78], 1.2);
    bell(92.0, 74, 1, 0);
    // 19 · after
    for (let i = 0; i < 12; i++) santoor(93.8 + i * 0.28, [74, 78, 81, 86, 81, 78][i % 6], 0.6, (i % 2) * 0.6 - 0.3);
    shimmer(93.6, 3, 0.9);
    // 20 · home
    tanpura(97, 113.5, 50, 0.9);
    pad(97, 11, [50, 57, 62, 66, 69], 0.7, 0.07);
    for (const [t, m] of [[98.2, 74], [100.4, 81], [102.6, 74], [104.8, 81]]) bell(t, m, 0.5, 0.3);
    flute(phrase(98.4, 96, THEME.concat([[0.5, null]], THEME.map(([b, m]) => [b, m + 12]).slice(0, 8), [[2, 74]])), 1);
    rhythm(99.2, 107.6, 96, 'x.oxo.x.', 'dhol', 0.45);
    rhythm(99.2, 107.6, 96, '..x...x.', 'na', 0.4);
    for (let i = 0; i < 30; i++) santoor(99.2 + i * 0.28, [62, 66, 69, 74][i % 4] + 12, 0.45, (i % 2) * 0.7 - 0.35);
    // 21 · the end
    bell(108.4, 74, 0.8, 0);
    flute([[108.8, 69, 1.2], [110.0, 74, 3.2]], 0.8);
    choir(108.6, 4.5, [62, 69, 74], 0.6, 'oo');

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
      L[i] = Math.tanh(L[i] * 1.8);
      R[i] = Math.tanh(R[i] * 1.8);
      peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
    }
    const g = peak > 0 ? 0.9 / peak : 1;
    for (let i = 0; i < N; i++) { L[i] *= g; R[i] *= g; }
    const f0 = Math.floor((DURATION - 1.5) * sr);
    for (let i = f0; i < N; i++) { const k = clamp(1 - (i - f0) / (2 * sr)); L[i] *= k; R[i] *= k; }
    void D;
    if (onProgress) onProgress(1);
    return { L, R, sr };
  }

  /** A big hall, for a big story. */
  function reverb(inL, inR, outL, outR, sr) {
    const scale = sr / 44100;
    const combs = [1617, 1557, 1491, 1422, 1356, 1277, 1188, 1116];
    const alls = [556, 441, 341, 225];
    for (const [inp, out, spread] of [[inL, outL, 0], [inR, outR, 23]]) {
      const wet = new Float32Array(inp.length);
      for (const c of combs) {
        const n = Math.round((c + spread) * scale * 1.3);
        const buf = new Float32Array(n);
        let idx = 0;
        let store = 0;
        for (let i = 0; i < inp.length; i++) {
          const y = buf[idx];
          store = y * 0.55 + store * 0.45;
          buf[idx] = inp[i] + store * 0.86;
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
      for (let i = 0; i < out.length; i++) out[i] += wet[i] * 0.05;
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
  window[document.currentScript && document.currentScript.dataset.global || 'FILM'] = FILM;

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
    if (bar) bar.style.width = cw + 'px';
  }
  const still = params.has('t') ? Number(params.get('t')) : Number(canvasEl.dataset.poster || 0);
  let mode = 'still';
  let shown = still;
  function draw(t) {
    shown = t;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    frame(ctx, t);
    if (fill) fill.style.width = `${(t / DURATION) * 100}%`;
  }
  window.addEventListener('resize', () => { fit(); if (mode !== 'film') draw(shown); });
  fit();
  draw(still);

  // the score is made while the poster is up; playing it needs a click
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
      if (mode === 'film') play(t); else { draw(t); }
    });
  }
  window.addEventListener('keydown', (e) => {
    if (e.key === ' ') {
      e.preventDefault();
      if (mode !== 'film') play(0);
      else if (actx.state === 'running') actx.suspend(); else actx.resume();
    }
    if (e.key === 'r' || e.key === 'R') play(0);
    if (mode === 'film' && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
      play(clamp(shown + (e.key === 'ArrowRight' ? 5 : -5), 0, DURATION - 0.5));
    }
  });
})();
