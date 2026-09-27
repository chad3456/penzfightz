/**
 * Gita — the epic cut. A vertical reel, 1080 × 1920, 102.5 seconds.
 *
 * The faces are 3D renders (public/bust3d: Lee Perry-Smith's head scan,
 * CC BY 3.0, re-toned and dressed), lit like sculpture in the dark blue of a
 * night temple. Over them: the verses themselves, Sanskrit in gold and the
 * English of Shri Purohit Swami's 1935 translation (public domain) or a plain
 * modern rendering where his is archaic; a voice-over; gold embers; ink-wash
 * transitions; and cuts on the beat of the music.
 *
 * The film is a pure function of time. The page plays it against the voice
 * track; scripts/render-gita-epic.mjs writes the frames and muxes the full
 * mix (which, for the reel, carries music the user supplied and which is not
 * part of this repository).
 */
(() => {
  'use strict';

  const W = 1080;
  const H = 1920;
  const DURATION = 102.5;
  const DROP = 64.2;
  const BEAT = 0.672;
  const TAU = Math.PI * 2;

  const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
  const lerp = (a, b, t) => a + (b - a) * t;
  const prog = (t, a, b) => clamp((t - a) / (b - a));
  const eOut = (t) => 1 - Math.pow(1 - t, 3);
  const eInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const bump = (t, a, b, f = 0.4) => Math.min(prog(t, a, a + f), 1 - prog(t, b - f, b));
  const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

  const GOLD = '#e9b45a';
  const GOLD_HI = '#ffd98a';
  const PAPER = '#f2ecdf';
  const FONT = {
    cinzel: (s, w = 600) => `${w} ${s}px Cinzel, "Trajan Pro", Georgia, serif`,
    corm: (s, w = 400) => `${w} ${s}px "Cormorant Garamond", Georgia, serif`,
    cormI: (s, w = 400) => `italic ${w} ${s}px "Cormorant Garamond", Georgia, serif`,
    deva: (s) => `${s}px "Tiro Devanagari Sanskrit", "Noto Serif Devanagari", FreeSerif, serif`,
  };
  const BASE = (document.currentScript && document.currentScript.src.replace(/[^/]*$/, '')) || '';

  /* ── assets ─────────────────────────────────────────────────────────── */

  const NAMES = ['k_hero', 'k_face', 'k_eyes', 'k_34', 'k_low', 'a_front', 'a_down', 'a_face', 'a_rise'];
  const IMG = {};
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  function loadImg(src) { return new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = src; }); }
  let NEB = null;
  let EMBER = null;
  async function load() {
    await Promise.all(NAMES.map(async (n) => {
      const im = await loadImg(BASE + 'img/' + n + '.webp');
      // a blurred copy for bloom, made once
      const g = mk(540, 960);
      const gx = g.getContext('2d');
      gx.filter = 'blur(14px)';
      gx.drawImage(im, 0, 0, 540, 960);
      IMG[n] = { im, glow: g };
    }));
    // a head, cut out soft, for the ring of faces
    const hd = mk(520, 640);
    const hx = hd.getContext('2d');
    hx.drawImage(IMG.k_face.im, 280, 330, 520, 640, 0, 0, 520, 640);
    hx.globalCompositeOperation = 'destination-in';
    const hg = hx.createRadialGradient(260, 330, 120, 260, 330, 300);
    hg.addColorStop(0, 'rgba(0,0,0,1)');
    hg.addColorStop(1, 'rgba(0,0,0,0)');
    hx.fillStyle = hg;
    hx.fillRect(0, 0, 520, 640);
    IMG.head = { im: hd };
    if (document.fonts) {
      await Promise.all(['Cinzel', 'Cormorant Garamond', 'Tiro Devanagari Sanskrit'].map((f) => document.fonts.load(`40px "${f}"`, 'क A')));
      await document.fonts.load('italic 40px "Cormorant Garamond"');
    }
    // nebula: soft coloured clouds, drawn once
    NEB = mk(540, 960);
    const nx = NEB.getContext('2d');
    for (let i = 0; i < 90; i++) {
      const x = hash(i) * 540;
      const y = hash(i + 50) * 960;
      const r = 60 + hash(i + 9) * 220;
      const c = i % 3 === 0 ? '60,90,220' : i % 3 === 1 ? '120,60,200' : '20,140,200';
      const gr = nx.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, `rgba(${c},0.10)`);
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      nx.fillStyle = gr;
      nx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    EMBER = mk(64, 64);
    const ex = EMBER.getContext('2d');
    const eg = ex.createRadialGradient(32, 32, 0, 32, 32, 32);
    eg.addColorStop(0, 'rgba(255,240,200,1)');
    eg.addColorStop(0.25, 'rgba(255,190,90,0.7)');
    eg.addColorStop(1, 'rgba(255,120,20,0)');
    ex.fillStyle = eg;
    ex.fillRect(0, 0, 64, 64);
  }

  /* ── drawing helpers ────────────────────────────────────────────────── */

  function bg(ctx, t, mood) {
    const g = ctx.createRadialGradient(W / 2, H * 0.38, 40, W / 2, H * 0.45, H * 0.75);
    if (mood === 'fire') { g.addColorStop(0, '#3a1608'); g.addColorStop(0.55, '#140605'); g.addColorStop(1, '#030101'); }
    else if (mood === 'void') { g.addColorStop(0, '#0a0f2e'); g.addColorStop(1, '#010103'); }
    else if (mood === 'gold') { g.addColorStop(0, '#4a3208'); g.addColorStop(0.5, '#1a1006'); g.addColorStop(1, '#040302'); }
    else { g.addColorStop(0, '#0f2a8a'); g.addColorStop(0.45, '#071245'); g.addColorStop(1, '#010208'); }
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    if (mood !== 'fire' && NEB) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = mood === 'void' ? 0.5 : 0.8;
      ctx.translate(W / 2, H / 2);
      ctx.rotate(t * 0.01);
      ctx.drawImage(NEB, -W * 0.6, -H * 0.6, W * 1.2, H * 1.2);
      ctx.restore();
    }
  }

  function stars(ctx, t, n, a) {
    ctx.save();
    for (let i = 0; i < n; i++) {
      const tw = 0.4 + 0.6 * Math.abs(Math.sin(t * (0.6 + hash(i) * 2) + i));
      ctx.globalAlpha = a * tw * (0.3 + hash(i + 3) * 0.7);
      ctx.fillStyle = hash(i + 7) < 0.2 ? GOLD_HI : '#cfe0ff';
      const s = hash(i + 11) < 0.1 ? 3 : 1.6;
      ctx.fillRect(hash(i + 1) * W, hash(i + 2) * H, s, s);
    }
    ctx.restore();
  }

  /** Embers drifting up, or motes circling. */
  function embers(ctx, t, n, o = {}) {
    if (!EMBER) return;
    const speed = o.speed || 60;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < n; i++) {
      const life = 6 + hash(i) * 6;
      const ph = ((t + hash(i + 1) * life) % life) / life;
      const x = hash(i + 2) * W + Math.sin(t * 0.8 + i) * 40 + (o.wind || 0) * ph * 200;
      const y = H * (1.05 - ph * (1.1 + hash(i + 3) * 0.3)) - (o.lift || 0);
      const s = (4 + hash(i + 4) * 16) * (o.scale || 1);
      ctx.globalAlpha = Math.sin(ph * Math.PI) * (o.a || 0.8) * (0.4 + 0.6 * hash(i + 5));
      ctx.drawImage(EMBER, x - s / 2, y - s / 2 - speed * 0, s, s);
    }
    ctx.restore();
  }

  /** A render, moved like a camera: scale and offset eased over the shot. */
  function shot(ctx, name, k, m = {}) {
    const I = IMG[name];
    if (!I) return;
    const s = lerp(m.s0 ?? 1, m.s1 ?? 1.06, eInOut(k));
    const x = lerp(m.x0 ?? 0, m.x1 ?? 0, eInOut(k));
    const y = lerp(m.y0 ?? 0, m.y1 ?? 0, eInOut(k));
    ctx.save();
    ctx.globalAlpha = m.a ?? 1;
    ctx.translate(W / 2 + x, H / 2 + y);
    ctx.scale(s, s);
    if (m.filter) ctx.filter = m.filter;
    ctx.drawImage(I.im, -W / 2, -H / 2, W, H);
    ctx.filter = 'none';
    // bloom
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = (m.a ?? 1) * (m.bloom ?? 0.35);
    ctx.drawImage(I.glow, -W / 2, -H / 2, W, H);
    ctx.restore();
  }

  /** Light passing across the figure. */
  function sweep(ctx, k, color = 'rgba(160,200,255,0.35)', angle = -0.5) {
    if (k <= 0 || k >= 1) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.translate(W / 2, H / 2);
    ctx.rotate(angle);
    const x = lerp(-W * 1.2, W * 1.2, k);
    const g = ctx.createLinearGradient(x - 220, 0, x + 220, 0);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(0.5, color);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(-W * 2, -H * 2, W * 4, H * 4);
    ctx.restore();
  }

  function rays(ctx, cx, cy, t, a, color = '255,210,130', n = 36) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.translate(cx, cy);
    ctx.rotate(t * 0.05);
    for (let i = 0; i < n; i++) {
      const ang = (i / n) * TAU;
      const w = 0.02 + hash(i) * 0.05;
      const len = H * (0.6 + hash(i + 4) * 0.6);
      const g = ctx.createLinearGradient(0, 0, Math.cos(ang) * len, Math.sin(ang) * len);
      g.addColorStop(0, `rgba(${color},${0.22 * a})`);
      g.addColorStop(1, `rgba(${color},0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, len, ang - w, ang + w);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function vignette(ctx, a = 0.75) {
    const g = ctx.createRadialGradient(W / 2, H * 0.45, H * 0.25, W / 2, H * 0.5, H * 0.72);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, `rgba(0,0,5,${a})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  function flash(ctx, t, at, color = '255,245,225', dur = 0.5, peak = 0.9) {
    const k = (t - at) / dur;
    if (k < 0 || k > 1) return;
    ctx.fillStyle = `rgba(${color},${peak * Math.pow(1 - k, 2)})`;
    ctx.fillRect(0, 0, W, H);
  }

  function shake(t, at, amt, dur = 0.5) {
    const k = (t - at) / dur;
    if (k < 0 || k > 1) return [0, 0];
    const f = (1 - k) * amt;
    return [Math.sin(t * 83) * f, Math.cos(t * 71) * f];
  }

  /** Ink-wash transition: dark ink that retreats to reveal the new shot. */
  function ink(ctx, t, at, seed, color = '2,3,12', dur = 0.7) {
    const k = (t - at) / dur;
    if (k < 0 || k > 1) return;
    const c = 1 - eOut(k);
    ctx.save();
    ctx.fillStyle = `rgba(${color},1)`;
    for (let i = 0; i < 26; i++) {
      const x = hash(seed + i) * W;
      const y = hash(seed + i + 40) * H;
      const r = (180 + hash(seed + i + 80) * 420) * c;
      if (r < 2) continue;
      ctx.beginPath();
      for (let j = 0; j <= 28; j++) {
        const a = (j / 28) * TAU;
        const rr = r * (0.75 + 0.25 * Math.sin(a * 5 + i) + 0.12 * Math.sin(a * 13 + seed));
        const px = x + Math.cos(a) * rr;
        const py = y + Math.sin(a) * rr;
        if (j === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.fill();
    }
    // splatter
    ctx.globalAlpha = c;
    for (let i = 0; i < 60; i++) {
      const r = 3 + hash(seed + i + 200) * 14;
      ctx.beginPath();
      ctx.arc(hash(seed + i + 300) * W, hash(seed + i + 400) * H, r, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  /* ── type ──────────────────────────────────────────────────────────── */

  function text(ctx, s, x, y, font, color, a = 1, o = {}) {
    if (a <= 0) return;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = o.align || 'center';
    ctx.textBaseline = o.base || 'alphabetic';
    if ('letterSpacing' in ctx) ctx.letterSpacing = (o.ls || 0) + 'px';
    if (o.glow) { ctx.shadowColor = o.glow; ctx.shadowBlur = o.blur || 24; }
    ctx.fillText(s, x, y);
    if (o.glow) ctx.fillText(s, x, y);
    ctx.restore();
  }

  /** Words that arrive one at a time, rising out of a blur. */
  function reveal(ctx, t, t0, lines, x, y, font, size, color, o = {}) {
    const per = o.per || 0.16;
    const lh = size * (o.lh || 1.25);
    let wi = 0;
    ctx.save();
    ctx.font = font;
    if ('letterSpacing' in ctx) ctx.letterSpacing = (o.ls || 0) + 'px';
    lines.forEach((line, li) => {
      const words = line.split(' ');
      const widths = words.map((w) => ctx.measureText(w + ' ').width);
      const total = widths.reduce((a, b) => a + b, 0) - ctx.measureText(' ').width;
      let cx = o.align === 'left' ? x : x - total / 2;
      words.forEach((w, i) => {
        const k = prog(t, t0 + wi * per, t0 + wi * per + 0.45);
        wi++;
        if (k > 0) {
          const out = o.out ? 1 - prog(t, o.out, o.out + 0.5) : 1;
          ctx.globalAlpha = eOut(k) * out * (o.a ?? 1);
          ctx.fillStyle = o.hl && o.hl.includes(w) ? GOLD_HI : color;
          if (o.glow) { ctx.shadowColor = o.glow; ctx.shadowBlur = 22 * (1 - k * 0.5); }
          ctx.textAlign = 'left';
          ctx.fillText(w, cx, y + li * lh + (1 - eOut(k)) * 18);
        }
        cx += widths[i];
      });
    });
    ctx.restore();
  }

  /** A verse on the image: Sanskrit in gold, the English under it, a reference. */
  function verse(ctx, t, t0, t1, deva, eng, ref, y, o = {}) {
    const a = bump(t, t0, t1, 0.6);
    if (a <= 0) return;
    const ds = o.dsize || 58;
    if (!o.noBand) {
      const g = ctx.createLinearGradient(0, y - 220, 0, y + 620);
      g.addColorStop(0, 'rgba(1,2,10,0)');
      g.addColorStop(0.3, `rgba(1,2,10,${0.72 * a})`);
      g.addColorStop(0.8, `rgba(1,2,10,${0.8 * a})`);
      g.addColorStop(1, 'rgba(1,2,10,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, y - 220, W, 840);
    }
    deva.forEach((line, i) => {
      const k = prog(t, t0 + i * 0.35, t0 + i * 0.35 + 0.8);
      text(ctx, line, W / 2, y + i * ds * 1.35 + (1 - eOut(k)) * 20, FONT.deva(ds), GOLD_HI, a * eOut(k), { glow: 'rgba(255,170,60,0.9)', blur: 28 });
    });
    const ey = y + deva.length * ds * 1.35 + 30;
    // a thin rule
    ctx.save();
    ctx.globalAlpha = a * 0.7;
    const rw = 220 * eOut(prog(t, t0 + 0.4, t0 + 1.2));
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(W / 2 - rw, ey); ctx.lineTo(W / 2 + rw, ey); ctx.stroke();
    ctx.fillStyle = GOLD;
    ctx.translate(W / 2, ey); ctx.rotate(Math.PI / 4); ctx.fillRect(-5, -5, 10, 10);
    ctx.restore();
    reveal(ctx, t, t0 + 0.7, eng, W / 2, ey + 70, FONT.cormI(o.esize || 46), o.esize || 46, PAPER, { per: 0.07, lh: 1.28, glow: 'rgba(0,0,0,0.9)', out: t1 - 0.6 });
    text(ctx, ref, W / 2, ey + 70 + eng.length * (o.esize || 46) * 1.28 + 36, FONT.cinzel(22, 400), GOLD, a * prog(t, t0 + 1.2, t0 + 1.8) * 0.9, { ls: 6 });
  }

  /* ── the chrome: Trinetra-like corners ─────────────────────────────── */
  const CHAPTERS = [[0, 'KURUKSHETRA', 'I'], [21.4, 'THE TEACHER', 'II'], [44, 'KARMA', 'II · 47'], [64.2, 'VISHVARUPA', 'XI'], [84.8, 'SURRENDER', 'XVIII']];
  function chrome(ctx, t) {
    const a = prog(t, 1, 2.2) * (1 - prog(t, DURATION - 1.2, DURATION - 0.3));
    if (a <= 0) return;
    let ch = CHAPTERS[0];
    for (const c of CHAPTERS) if (t >= c[0]) ch = c;
    const idx = CHAPTERS.indexOf(ch) + 1;
    text(ctx, 'BHAGAVAD GITA', 70, 110, FONT.cinzel(24, 400), PAPER, a * 0.85, { align: 'left', ls: 10 });
    text(ctx, 'ॐ नमो भगवते वासुदेवाय', W - 70, 110, FONT.deva(26), GOLD, a * 0.85, { align: 'right' });
    text(ctx, `${String(idx).padStart(2, '0')} / 05`, W - 70, 150, FONT.corm(24), PAPER, a * 0.6, { align: 'right', ls: 8 });
    // a progress line down the right edge
    ctx.save();
    ctx.globalAlpha = a * 0.5;
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(W - 44, 560); ctx.lineTo(W - 44, 1180); ctx.stroke();
    ctx.globalAlpha = a;
    ctx.fillStyle = GOLD_HI;
    ctx.beginPath(); ctx.arc(W - 44, 560 + (t / DURATION) * 620, 5, 0, TAU); ctx.fill();
    ctx.restore();
    // chapter name, vertical, bottom left
    ctx.save();
    ctx.translate(58, 1560);
    ctx.rotate(-Math.PI / 2);
    text(ctx, `${ch[2]} · ${ch[1]}`, 0, 0, FONT.cinzel(20, 400), PAPER, a * 0.6, { align: 'left', ls: 9 });
    ctx.restore();
  }

  /* ── subtitles for the voice ───────────────────────────────────────── */
  const SUBS = {
    N1: 'Five thousand years ago, two armies stood face to face, on a field called Kurukshetra.',
    N2: 'And the greatest archer alive… let his bow fall.',
    A1: '“My limbs are failing. My mouth is dry. Gandiva slips from my hand. I will not fight, Krishna.”',
    N3: 'Krishna did not argue. He smiled… and he spoke.',
    K2: '“Do not yield to this weakness, Partha. It does not become you. Stand up.”',
    K3: '“You grieve for what cannot die. It was never born. It will never die.”',
    K5: '“Your right is to the work alone. Never to its fruits.”',
    K6: '“Whenever dharma fades, and wrong rises… I come. Age after age.”',
    N4: 'Then Arjuna asked to see him as he truly is.',
    N5: 'If a thousand suns rose at once in the sky, that would be the splendour of that mighty being.',
    K9: '“Let go of everything, and come to me. I will free you. Do not grieve.”',
    A3: '“My delusion is gone. My doubts are gone. I will do as you say.”',
    N6: 'The Bhagavad Gita. Seven hundred verses. One conversation. Still speaking.',
  };
  let SPANS = [];
  function subs(ctx, t) {
    for (const [name, a, b] of SPANS) {
      if (!SUBS[name] || t < a - 0.1 || t > b + 0.4) continue;
      const k = bump(t, a - 0.1, b + 0.4, 0.25);
      const words = SUBS[name].split(' ');
      // wrap to two lines
      ctx.save();
      ctx.font = FONT.cormI(40, 600);
      const lines = [];
      let cur = '';
      for (const w of words) { const tryL = cur ? cur + ' ' + w : w; if (ctx.measureText(tryL).width > 900 && cur) { lines.push(cur); cur = w; } else cur = tryL; }
      lines.push(cur);
      ctx.restore();
      lines.forEach((l, i) => text(ctx, l, W / 2, 1664 + i * 52 - (lines.length - 1) * 26, FONT.cormI(40, 600), name[0] === 'A' ? '#ffd2a8' : name[0] === 'K' ? '#cfe2ff' : PAPER, k, { glow: 'rgba(0,0,0,1)', blur: 16 }));
    }
  }

  /* ── the scenes ────────────────────────────────────────────────────── */

  function sOpen(ctx, t) {
    bg(ctx, t, 'fire');
    // two lines of armies at the horizon, as ink
    ctx.save();
    const hy = 1180;
    const g = ctx.createLinearGradient(0, hy - 300, 0, H);
    g.addColorStop(0, 'rgba(255,120,40,0)');
    g.addColorStop(0.3, 'rgba(255,110,40,0.25)');
    g.addColorStop(1, 'rgba(20,6,2,1)');
    ctx.fillStyle = g;
    ctx.fillRect(0, hy - 300, W, H);
    ctx.fillStyle = '#0a0302';
    for (const [x0, x1, dir] of [[-20, 470, 1], [610, 1100, -1]]) {
      for (let i = 0; i < 180; i++) {
        const x = x0 + hash(i * 3 + dir) * (x1 - x0);
        const h = 40 + hash(i + 17 * dir) * 150;
        ctx.fillRect(x, hy - h, 3, h);
        if (hash(i + 5 * dir) < 0.15) { ctx.beginPath(); ctx.moveTo(x + 3, hy - h); ctx.lineTo(x + 3 + dir * 36, hy - h + 12); ctx.lineTo(x + 3, hy - h + 24); ctx.fill(); }
      }
      ctx.fillRect(x0, hy - 26, x1 - x0, 60);
    }
    ctx.fillRect(0, hy + 20, W, H);
    // the sun, low and red
    const sg = ctx.createRadialGradient(W / 2, hy - 120, 10, W / 2, hy - 120, 320);
    sg.addColorStop(0, 'rgba(255,190,110,0.85)');
    sg.addColorStop(0.2, 'rgba(255,90,30,0.45)');
    sg.addColorStop(1, 'rgba(255,60,10,0)');
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = sg;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
    embers(ctx, t, 80, { a: 0.8, wind: 0.4 });
    const hits = [[3.95, 'TWO ARMIES'], [4.5, 'ONE FIELD'], [5.7, 'KURUKSHETRA']];
    let word = null;
    for (const [at, w] of hits) if (t >= at) word = [at, w];
    if (word) {
      const k = prog(t, word[0], word[0] + 0.25);
      const s = lerp(1.25, 1, eOut(k));
      ctx.save();
      ctx.translate(W / 2, 760);
      ctx.scale(s, s);
      text(ctx, word[1], 0, 0, FONT.cinzel(word[1].length > 9 ? 96 : 110, 700), PAPER, eOut(k), { ls: 18, glow: 'rgba(255,120,40,0.8)', blur: 30 });
      ctx.restore();
    } else {
      text(ctx, 'c. 3100 BCE · by tradition', W / 2, 760, FONT.cormI(40), '#ffcfa0', bump(t, 0.8, 3.9, 0.6) * 0.9, { ls: 4 });
    }
    for (const [at] of hits) flash(ctx, t, at, '255,200,150', 0.35, 0.5);
    vignette(ctx, 0.8);
  }

  function sTitle(ctx, t) {
    const lt = t - 6.6;
    bg(ctx, t, 'void');
    stars(ctx, t, 160, 0.8);
    rays(ctx, W / 2, 900, t, eOut(prog(lt, 0, 1.5)) * 1.2);
    const k = eOut(prog(lt, 0.05, 1.2));
    ctx.save();
    ctx.translate(W / 2, 880);
    ctx.scale(lerp(1.15, 1, k), lerp(1.15, 1, k));
    text(ctx, 'श्रीमद्भगवद्गीता', 0, -120, FONT.deva(92), GOLD_HI, k, { glow: 'rgba(255,170,60,1)', blur: 40 });
    text(ctx, 'THE BHAGAVAD GITA', 0, 40, FONT.cinzel(78, 700), PAPER, k, { ls: 16, glow: 'rgba(120,160,255,0.8)', blur: 30 });
    text(ctx, 'THE SONG OF GOD', 0, 120, FONT.cinzel(28, 400), GOLD, k * prog(lt, 0.8, 1.6), { ls: 22 });
    ctx.restore();
    embers(ctx, t, 60, { a: 0.6, scale: 0.8 });
    flash(ctx, t, 6.6, '255,235,200', 0.6, 0.95);
    vignette(ctx);
  }

  function sArjuna(ctx, t) {
    const lt = t - 9.9;
    bg(ctx, t, 'fire');
    const close = t >= 14;
    const [sx, sy] = close ? [Math.sin(t * 23) * 3 * prog(t, 16, 18), Math.cos(t * 19) * 3 * prog(t, 16, 18)] : [0, 0];
    ctx.save();
    ctx.translate(sx, sy);
    if (!close) shot(ctx, 'a_down', prog(t, 9.9, 14.2), { s0: 0.95, s1: 1.04, y0: -40, y1: -80, filter: 'contrast(1.12) saturate(1.1)', bloom: 0.3 });
    else shot(ctx, 'a_face', prog(t, 14, 21.4), { s0: 0.92, s1: 1.04, y0: -60, y1: -20, filter: 'contrast(1.18) saturate(1.05) brightness(0.95)', bloom: 0.25 });
    ctx.restore();
    embers(ctx, t, 70, { a: 0.7, wind: 0.2 });
    verse(ctx, t, 15.2, 21.2, ['गाण्डीवं स्रंसते हस्तात्'], ['“The bow Gandiva slips from my hand,', 'and my skin burns.”'], 'BHAGAVAD GITA 1.30', 1130, { dsize: 64 });
    ink(ctx, t, 9.9, 11, '3,1,1');
    ink(ctx, t, 14.0, 23, '3,1,1', 0.55);
    vignette(ctx, 0.85);
  }

  function sReveal(ctx, t) {
    const lt = t - 21.4;
    bg(ctx, t, 'blue');
    stars(ctx, t, 120, 0.6);
    // he comes out of the dark from above
    const r = eOut(prog(lt, 0, 3.2));
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, W, H * lerp(0.05, 1.2, r));
    ctx.clip();
    shot(ctx, 'k_face', prog(t, 21.4, 30.4), { s0: 1.0, s1: 0.94, y0: -60, y1: -20, a: lerp(0.2, 1, r), filter: 'contrast(1.15) saturate(1.2)', bloom: 0.4 });
    ctx.restore();
    // a soft edge where the light reaches
    const edge = H * lerp(0.05, 1.2, r);
    const eg = ctx.createLinearGradient(0, edge - 220, 0, edge);
    eg.addColorStop(0, 'rgba(1,2,8,0)');
    eg.addColorStop(1, 'rgba(1,2,8,1)');
    ctx.fillStyle = eg;
    ctx.fillRect(0, edge - 220, W, 222);
    ctx.fillStyle = '#010208';
    ctx.fillRect(0, edge, W, H);
    sweep(ctx, prog(lt, 1.0, 4.0), 'rgba(150,190,255,0.28)', -0.6);
    embers(ctx, t, 50, { a: 0.5, scale: 0.7 });
    verse(ctx, t, 25.6, 30.2, ['क्लैब्यं मा स्म गमः पार्थ', 'उत्तिष्ठ परन्तप'], ['Yield not to weakness, Partha.', 'Stand up, scorcher of foes.'], 'BHAGAVAD GITA 2.3', 1080, { dsize: 66 });
    vignette(ctx);
  }

  function sStand(ctx, t) {
    const lt = t - 30.2;
    bg(ctx, t, 'blue');
    rays(ctx, W / 2, 620, t, 0.9);
    shot(ctx, 'k_low', prog(t, 30.2, 35.8), { s0: 1.0, s1: 1.1, y0: 140, y1: 90, filter: 'contrast(1.18) saturate(1.2)', bloom: 0.45 });
    embers(ctx, t, 90, { a: 0.8 });
    const k = prog(lt, 3.6, 4.1);
    if (k > 0) {
      ctx.save();
      ctx.translate(W / 2, 360);
      const s = lerp(1.6, 1, eOut(k));
      ctx.scale(s, s);
      text(ctx, 'उत्तिष्ठ', 0, -40, FONT.deva(120), GOLD_HI, eOut(k), { glow: 'rgba(255,170,60,1)', blur: 40 });
      text(ctx, 'STAND UP', 0, 80, FONT.cinzel(96, 700), PAPER, eOut(k), { ls: 26, glow: 'rgba(120,170,255,0.9)', blur: 30 });
      ctx.restore();
      flash(ctx, t, 30.2 + 3.6, '200,220,255', 0.4, 0.6);
    }
    ink(ctx, t, 30.2, 37, '1,2,10', 0.5);
    vignette(ctx);
  }

  function sSoul(ctx, t) {
    bg(ctx, t, 'blue');
    shot(ctx, 'k_eyes', prog(t, 35.8, 44), { s0: 0.92, s1: 1.02, y0: -120, y1: -80, filter: 'contrast(1.15) saturate(1.25) brightness(0.9)', bloom: 0.5 });
    sweep(ctx, prog(t, 36.5, 40.5), 'rgba(255,220,160,0.25)', 0.3);
    embers(ctx, t, 40, { a: 0.4, scale: 0.6 });
    verse(ctx, t, 37.0, 43.8, ['नैनं छिन्दन्ति शस्त्राणि', 'नैनं दहति पावकः'], ['“Weapons cannot cleave it, fire cannot burn it,', 'water cannot drench it,', 'and wind cannot dry it.”'], 'BHAGAVAD GITA 2.23 · TR. SHRI PUROHIT SWAMI', 1060, { dsize: 58, esize: 42 });
    ink(ctx, t, 35.8, 51, '1,2,10', 0.55);
    vignette(ctx);
  }

  function sKarma(ctx, t) {
    bg(ctx, t, 'blue');
    stars(ctx, t, 100, 0.5);
    shot(ctx, 'k_hero', prog(t, 44, 54.4), { s0: 1.0, s1: 1.1, y0: -40, y1: 0, filter: 'contrast(1.15) saturate(1.2)', bloom: 0.4 });
    embers(ctx, t, 60 + 60 * prog(t, 46, 54), { a: 0.7 });
    const g = ctx.createLinearGradient(0, 0, 0, 900);
    g.addColorStop(0, 'rgba(1,2,10,0.9)');
    g.addColorStop(1, 'rgba(1,2,10,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, 900);
    verse(ctx, t, 44.3, 54.2, ['कर्मण्येवाधिकारस्ते', 'मा फलेषु कदाचन'], ['“You have only the right to work,', 'but none to the fruit of it.”'], 'BHAGAVAD GITA 2.47 · TR. SHRI PUROHIT SWAMI', 1060, { dsize: 74 });
    ink(ctx, t, 44, 61, '1,2,10', 0.6);
    vignette(ctx);
  }

  function sDharma(ctx, t) {
    bg(ctx, t, 'blue');
    rays(ctx, W / 2, 700, t, prog(t, 54.4, 60) * 1.2);
    shot(ctx, 'k_34', prog(t, 54.4, 60.2), { s0: 0.95, s1: 1.06, x0: 30, x1: -20, y0: -80, y1: -40, filter: 'contrast(1.2) saturate(1.2)', bloom: 0.45 });
    embers(ctx, t, 120, { a: 0.9, speed: 90 });
    verse(ctx, t, 54.6, 60.1, ['यदा यदा हि धर्मस्य ग्लानिर्भवति भारत'], ['“To protect the righteous, to destroy the wicked…', 'I am reborn from age to age.”'], 'BHAGAVAD GITA 4.7–8 · TR. SHRI PUROHIT SWAMI', 1110, { dsize: 46, esize: 42 });
    ink(ctx, t, 54.4, 71, '1,2,10', 0.5);
    vignette(ctx);
  }

  function sBuild(ctx, t) {
    // beat cuts between the two faces, tighter and faster, into the dark
    const lt = t - 60.2;
    bg(ctx, t, 'void');
    const beat = Math.floor((t - (DROP - 6 * BEAT)) / BEAT);
    const cuts = ['k_eyes', 'a_face', 'k_face', 'a_front', 'k_eyes', 'a_face', 'k_eyes'];
    const name = cuts[((beat % cuts.length) + cuts.length) % cuts.length];
    const tight = 1 + prog(t, 60.2, DROP) * 0.35;
    shot(ctx, name, 0.5, { s0: tight, s1: tight, y0: 260, y1: 260, filter: `contrast(1.3) saturate(${name[0] === 'a' ? 0.6 : 1.3}) brightness(${lerp(1, 0.55, prog(t, 62, DROP))})`, bloom: 0.5 });
    const bk = ((t - (DROP - 6 * BEAT)) % BEAT) / BEAT;
    ctx.fillStyle = `rgba(255,255,255,${0.35 * Math.pow(1 - bk, 4)})`;
    ctx.fillRect(0, 0, W, H);
    text(ctx, 'SHOW ME', W / 2, 400, FONT.cinzel(88, 700), PAPER, bump(t, 61.2, 63.9, 0.3) * 0.9, { ls: 30, glow: 'rgba(120,170,255,1)', blur: 30 });
    text(ctx, 'WHO YOU ARE', W / 2, 500, FONT.cinzel(52, 400), GOLD, bump(t, 61.9, 63.9, 0.3) * 0.9, { ls: 20 });
    ctx.fillStyle = `rgba(0,0,0,${prog(t, DROP - 0.35, DROP)})`;
    ctx.fillRect(0, 0, W, H);
    void lt;
    vignette(ctx, 0.9);
  }

  function arm(ctx, ang, len, w, t, i) {
    ctx.save();
    ctx.rotate(ang);
    const g = ctx.createLinearGradient(0, 0, len, 0);
    g.addColorStop(0, 'rgba(60,110,255,0.0)');
    g.addColorStop(0.35, 'rgba(70,120,255,0.55)');
    g.addColorStop(1, 'rgba(160,200,255,0.9)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, -w);
    ctx.quadraticCurveTo(len * 0.5, -w * 1.3, len, -w * 0.6);
    ctx.lineTo(len, w * 0.6);
    ctx.quadraticCurveTo(len * 0.5, w * 1.3, 0, w);
    ctx.closePath();
    ctx.fill();
    // a gold bangle and what the hand holds
    ctx.strokeStyle = GOLD_HI;
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.ellipse(len * 0.82, 0, 8, w * 0.75, 0, 0, TAU); ctx.stroke();
    ctx.translate(len + 36, 0);
    ctx.rotate(-ang + t * (i % 2 ? 1.2 : -1.2));
    ctx.shadowColor = 'rgba(255,190,90,1)';
    ctx.shadowBlur = 20;
    ctx.lineWidth = 4;
    const kind = i % 4;
    ctx.beginPath();
    if (kind === 0) { ctx.arc(0, 0, 30, 0, TAU); for (let s = 0; s < 12; s++) { const b = (s / 12) * TAU; ctx.moveTo(0, 0); ctx.lineTo(Math.cos(b) * 30, Math.sin(b) * 30); } }
    else if (kind === 1) { ctx.moveTo(-26, 0); ctx.bezierCurveTo(-10, -34, 26, -26, 28, 0); ctx.bezierCurveTo(20, 22, -6, 24, -26, 0); ctx.moveTo(-10, 0); ctx.arc(-4, 0, 8, 0, TAU); }
    else if (kind === 2) { for (let p = 0; p < 8; p++) { const b = (p / 8) * TAU; ctx.moveTo(0, 0); ctx.quadraticCurveTo(Math.cos(b - 0.3) * 30, Math.sin(b - 0.3) * 30, Math.cos(b) * 38, Math.sin(b) * 38); } }
    else { ctx.moveTo(-30, 0); ctx.lineTo(18, 0); ctx.moveTo(40, 0); ctx.arc(28, 0, 14, 0, TAU); }
    ctx.stroke();
    ctx.restore();
  }

  function sCosmic(ctx, t) {
    const lt = t - DROP;
    const beatK = ((t - DROP) % BEAT) / BEAT;
    const pulse = Math.pow(1 - beatK, 3);
    bg(ctx, t, 'void');
    stars(ctx, t, 260, 1);
    // a galaxy turning behind him
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.translate(W / 2, 820);
    for (let i = 0; i < 900; i++) {
      const arm2 = i % 3;
      const r = 40 + hash(i) * 900;
      const a = arm2 * (TAU / 3) + r * 0.006 + lt * 0.25 + hash(i + 1) * 0.5;
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r * 0.55;
      ctx.globalAlpha = 0.25 + hash(i + 2) * 0.6;
      ctx.fillStyle = hash(i + 3) < 0.3 ? GOLD_HI : '#9fc4ff';
      ctx.fillRect(x, y, 2.4, 2.4);
    }
    ctx.restore();
    rays(ctx, W / 2, 820, t * 2, 1.2 + pulse * 0.6);
    // the thousand arms
    ctx.save();
    ctx.translate(W / 2, 900);
    ctx.globalCompositeOperation = 'lighter';
    const n = 24;
    for (let i = 0; i < n; i++) {
      const ang = (i / n) * TAU + lt * 0.12 + Math.sin(lt * 0.8 + i) * 0.03;
      arm(ctx, ang, 330 + (i % 3) * 60 + pulse * 30, 26, t, i);
    }
    ctx.restore();
    // a ring of faces
    const I = IMG.head;
    if (I) {
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * TAU - lt * 0.18;
        const x = W / 2 + Math.cos(a) * 420;
        const y = 820 + Math.sin(a) * 420 * 0.72;
        const depth = 0.75 + 0.25 * Math.sin(a);
        ctx.save();
        ctx.globalAlpha = (0.5 + 0.3 * Math.sin(lt * 2 + i)) * depth;
        ctx.translate(x, y);
        ctx.scale(depth * 0.5, depth * 0.5);
        ctx.drawImage(I.im, -260, -320);
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.25;
        ctx.drawImage(I.im, -260, -320);
        ctx.restore();
      }
    }
    // the centre: the full figure, growing
    const [sx, sy] = shake(t, DROP, 22, 0.8);
    ctx.save();
    ctx.translate(sx, sy);
    shot(ctx, 'k_hero', prog(t, DROP, 79.6), { s0: 0.72 + pulse * 0.015, s1: 0.95, y0: 60, y1: 40, filter: 'contrast(1.2) saturate(1.3) brightness(1.1)', bloom: 0.7 + pulse * 0.3 });
    ctx.restore();
    embers(ctx, t, 160, { a: 1, speed: 120, scale: 1.1 });
    // the words: Kaalo'smi, then I AM TIME, then a thousand suns
    const k1 = prog(t, DROP + 0.1, DROP + 0.5);
    if (t < 72.4) {
      ctx.save();
      ctx.translate(W / 2, 330);
      const s = lerp(1.8, 1, eOut(k1)) * (1 + pulse * 0.03);
      ctx.scale(s, s);
      text(ctx, 'कालोऽस्मि', 0, 0, FONT.deva(170), GOLD_HI, eOut(k1) * (1 - prog(t, 71.6, 72.4)), { glow: 'rgba(255,160,40,1)', blur: 50 });
      ctx.restore();
      text(ctx, 'I AM TIME', W / 2, 1530, FONT.cinzel(110, 700), PAPER, bump(t, 68.1, 72.4, 0.3), { ls: 24, glow: 'rgba(120,170,255,1)', blur: 36 });
      text(ctx, 'THE MIGHTY DESTROYER OF WORLDS', W / 2, 1610, FONT.cinzel(30, 400), GOLD, bump(t, 69.2, 72.4, 0.4), { ls: 10 });
      text(ctx, 'BHAGAVAD GITA 11.32', W / 2, 1670, FONT.cinzel(20, 400), PAPER, bump(t, 69.6, 72.4, 0.4) * 0.7, { ls: 8 });
    } else {
      verse(ctx, t, 72.6, 79.5, ['दिवि सूर्यसहस्रस्य', 'भवेद्युगपदुत्थिता'], ['“Could a thousand suns blaze forth together,', 'it would be but a faint reflection', 'of the radiance of the Lord God.”'], 'BHAGAVAD GITA 11.12 · TR. SHRI PUROHIT SWAMI', 1080, { dsize: 64, esize: 42 });
    }
    // light: a thousand suns
    const white = bump(t, 74.2, 76.6, 0.9);
    ctx.fillStyle = `rgba(255,248,230,${white * 0.55})`;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = `rgba(255,255,255,${0.18 * pulse})`;
    ctx.fillRect(0, 0, W, H);
    flash(ctx, t, DROP, '255,250,235', 0.9, 1);
    vignette(ctx, 0.7);
  }

  function sSurrender(ctx, t) {
    bg(ctx, t, 'blue');
    stars(ctx, t, 140, 0.5);
    shot(ctx, 'k_face', prog(t, 79.6, 84.8), { s0: 0.95, s1: 1.0, y0: -60, y1: -80, filter: 'contrast(1.12) saturate(1.2)', bloom: 0.45 });
    sweep(ctx, prog(t, 80, 84), 'rgba(255,230,180,0.22)', -0.3);
    embers(ctx, t, 50, { a: 0.5, scale: 0.7 });
    const g = ctx.createLinearGradient(0, 1050, 0, 1600);
    g.addColorStop(0, 'rgba(1,2,10,0)');
    g.addColorStop(0.5, 'rgba(1,2,10,0.8)');
    g.addColorStop(1, 'rgba(1,2,10,0.9)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 1050, W, 870);
    verse(ctx, t, 80.0, 84.7, ['सर्वधर्मान्परित्यज्य', 'मामेकं शरणं व्रज'], ['“Surrender yourself to Me alone.', 'Do not be anxious.”'], 'BHAGAVAD GITA 18.66 · TR. SHRI PUROHIT SWAMI', 1080, { dsize: 60 });
    ink(ctx, t, 79.6, 91, '1,2,10', 0.6);
    vignette(ctx);
  }

  function sRise(ctx, t) {
    bg(ctx, t, 'gold');
    rays(ctx, W / 2, 360, t, 1.3, '255,215,150', 44);
    shot(ctx, 'a_rise', prog(t, 84.8, 93.2), { s0: 0.95, s1: 1.04, y0: -60, y1: -100, filter: 'contrast(1.15) saturate(1.15) brightness(1.05)', bloom: 0.45 });
    embers(ctx, t, 110, { a: 0.9, speed: 100 });
    verse(ctx, t, 85.4, 93.0, ['नष्टो मोहः स्मृतिर्लब्धा'], ['“My delusion has fled… My doubts have been', 'dispelled, and I stand before You', 'ready to do Your will.”'], 'BHAGAVAD GITA 18.73 · TR. SHRI PUROHIT SWAMI', 1080, { dsize: 64, esize: 42 });
    flash(ctx, t, 84.8, '255,230,180', 0.6, 0.7);
    ink(ctx, t, 84.8, 101, '4,3,1', 0.6);
    vignette(ctx, 0.7);
  }

  function sEnd(ctx, t) {
    const lt = t - 93.2;
    bg(ctx, t, 'blue');
    stars(ctx, t, 200, 0.8);
    rays(ctx, W / 2, 780, t, 0.8);
    shot(ctx, 'k_hero', prog(t, 93.2, DURATION), { s0: 0.86, s1: 0.8, y0: 240, y1: 250, filter: 'contrast(1.15) saturate(1.2)', bloom: 0.5, a: prog(lt, 0, 1.2) });
    embers(ctx, t, 70, { a: 0.6 });
    const k = eOut(prog(lt, 0.4, 1.8));
    const out = 1 - prog(t, DURATION - 1.2, DURATION - 0.2);
    text(ctx, 'श्रीमद्भगवद्गीता', W / 2, 330, FONT.deva(80), GOLD_HI, k * out, { glow: 'rgba(255,170,60,1)', blur: 36 });
    text(ctx, 'BHAGAVAD GITA', W / 2, 450, FONT.cinzel(86, 700), PAPER, k * out, { ls: 20, glow: 'rgba(120,170,255,0.9)', blur: 30 });
    text(ctx, '700 VERSES  ·  18 CHAPTERS  ·  ONE CONVERSATION', W / 2, 520, FONT.cinzel(24, 400), GOLD, eOut(prog(lt, 1.5, 2.5)) * out, { ls: 7 });
    text(ctx, 'Voices synthesised · Head scan “Infinite” by Lee Perry-Smith, CC BY 3.0', W / 2, 1760, FONT.corm(24), PAPER, eOut(prog(lt, 2.5, 3.5)) * 0.6 * out, {});
    text(ctx, 'Verses from the Bhagavad Gita · English tr. Shri Purohit Swami (1935)', W / 2, 1795, FONT.corm(24), PAPER, eOut(prog(lt, 2.5, 3.5)) * 0.6 * out, {});
    flash(ctx, t, 93.4, '200,220,255', 0.6, 0.5);
    vignette(ctx);
    ctx.fillStyle = `rgba(0,0,0,${prog(t, DURATION - 0.8, DURATION)})`;
    ctx.fillRect(0, 0, W, H);
  }

  const SCENES = [
    [0, 6.6, sOpen], [6.6, 9.9, sTitle], [9.9, 21.4, sArjuna], [21.4, 30.2, sReveal], [30.2, 35.8, sStand],
    [35.8, 44, sSoul], [44, 54.4, sKarma], [54.4, 60.2, sDharma], [60.2, DROP, sBuild], [DROP, 79.6, sCosmic],
    [79.6, 84.8, sSurrender], [84.8, 93.2, sRise], [93.2, DURATION + 1, sEnd],
  ];

  function grain(ctx, t) {
    ctx.save();
    ctx.globalAlpha = 0.06;
    ctx.globalCompositeOperation = 'overlay';
    const s = Math.floor(t * 24);
    for (let i = 0; i < 260; i++) {
      ctx.fillStyle = hash(s * 7 + i) < 0.5 ? '#fff' : '#000';
      ctx.fillRect(hash(s + i * 3) * W, hash(s + i * 5) * H, 2 + hash(i) * 3, 2 + hash(i + 1) * 3);
    }
    ctx.restore();
  }

  function frame(ctx, t) {
    t = clamp(t, 0, DURATION - 0.001);
    const sc = SCENES.find(([a, b]) => t >= a && t < b) || SCENES[SCENES.length - 1];
    ctx.save();
    sc[2](ctx, t);
    ctx.restore();
    subs(ctx, t);
    chrome(ctx, t);
    grain(ctx, t);
    // letterbox bars breathe in at the climax
    const bars = 90 * bump(t, DROP, 79.6, 0.6);
    if (bars > 0) { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, bars); ctx.fillRect(0, H - bars, W, bars); }
    if (t < 0.4) { ctx.fillStyle = `rgba(0,0,0,${1 - t / 0.4})`; ctx.fillRect(0, 0, W, H); }
  }

  /* ── sound: the page plays the voice track; the reel file carries the full mix ── */
  async function synth(sr) {
    const res = await fetch(BASE + 'audio/voice.mp3');
    const buf = await res.arrayBuffer();
    const ac = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(2, Math.ceil(sr * (DURATION + 1)), sr);
    const dec = await ac.decodeAudioData(buf);
    const L = new Float32Array(Math.ceil(sr * (DURATION + 1)));
    const R = new Float32Array(L.length);
    L.set(dec.getChannelData(0).subarray(0, L.length));
    R.set((dec.numberOfChannels > 1 ? dec.getChannelData(1) : dec.getChannelData(0)).subarray(0, R.length));
    return { L, R, sr: dec.sampleRate };
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
    for (let i = 0; i < n; i++) { v.setInt16(o, clamp(L[i], -1, 1) * 32767, true); v.setInt16(o + 2, clamp(R[i], -1, 1) * 32767, true); o += 4; }
    return new Uint8Array(buf);
  }

  const ready = (async () => {
    await load();
    try {
      const tl = await (await fetch(BASE + 'timeline.json')).json();
      SPANS = tl.vo;
    } catch (e) { /* subtitles are optional */ }
    return true;
  })();

  const FILM = { W, H, DURATION, frame, synth, wavBytes, ready };
  window[(document.currentScript && document.currentScript.dataset.global) || 'FILM'] = FILM;

  const params = new URLSearchParams(location.search);
  if (params.has('render')) return;

  /* ── the player ────────────────────────────────────────────────────── */
  const canvasEl = document.getElementById('c');
  if (!canvasEl) return;
  const ctx = canvasEl.getContext('2d');
  const ui = document.getElementById('ui');
  const playBtn = document.getElementById('play');
  const note = document.getElementById('note');
  const bar = document.getElementById('bar');
  const fill = document.getElementById('fill');
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
  let mode = 'still';
  let shown = Number(params.get('t') || canvasEl.dataset.poster || 0);
  function draw(t) { shown = t; ctx.setTransform(scl, 0, 0, scl, 0, 0); frame(ctx, t); if (fill) fill.style.width = `${(t / DURATION) * 100}%`; }
  window.addEventListener('resize', () => { fit(); if (mode !== 'film') draw(shown); });
  fit();
  note.textContent = 'loading…';
  ready.then(() => { draw(shown); note.textContent = '1 min 42 s · 9:16 · with voice · click to pause · ← → to skip'; });
  const audio = new Audio(BASE + 'audio/voice.mp3');
  audio.preload = 'auto';
  let raf = 0;
  function loop() {
    const t = audio.currentTime;
    draw(clamp(t, 0, DURATION));
    if (audio.ended || t >= DURATION) { mode = 'still'; ui.classList.remove('is-hidden'); playBtn.textContent = '↺ watch again'; return; }
    raf = requestAnimationFrame(loop);
  }
  async function play(from = 0) {
    await ready;
    audio.currentTime = from;
    await audio.play();
    mode = 'film';
    ui.classList.add('is-hidden');
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(loop);
  }
  playBtn.addEventListener('click', () => play(0));
  canvasEl.addEventListener('click', () => { if (mode !== 'film') return; if (audio.paused) audio.play(); else audio.pause(); });
  if (bar) bar.addEventListener('click', (e) => { const r = bar.getBoundingClientRect(); const t = clamp((e.clientX - r.left) / r.width) * DURATION; if (mode === 'film') play(t); else draw(t); });
  window.addEventListener('keydown', (e) => {
    if (e.key === ' ') { e.preventDefault(); if (mode !== 'film') play(0); else if (audio.paused) audio.play(); else audio.pause(); }
    if (mode === 'film' && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) play(clamp(shown + (e.key === 'ArrowRight' ? 5 : -5), 0, DURATION - 0.5));
  });
})();
