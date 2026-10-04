/*
 * video-recipe engine: a deterministic 2D animation renderer.
 *
 * VR.load(storyboard, style, timing) prepares a film; VR.frame(t) draws the
 * frame at time t seconds onto #c. Everything is drawn from code: original
 * shapes, characters and type, in a look set by the style tokens learned
 * from a reference video. No frames from the reference are ever used.
 *
 * World space is 1920 × 1080 whatever the output size.
 */
(function () {
  const VW = 1920, VH = 1080, TAU = Math.PI * 2;
  const cv = document.getElementById('c');
  const MAIN = cv.getContext('2d');
  let ctx = MAIN;
  let SB = null, ST = null, TM = null, scale = 1;
  const off = [document.createElement('canvas'), document.createElement('canvas')];
  let grainCv = null;

  /* ───────── utilities ───────── */
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = {
    linear: (t) => t,
    in: (t) => t * t * t,
    out: (t) => 1 - Math.pow(1 - t, 3),
    inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    back: (t) => { const c = 1.6; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
  };
  function rng(seed) {
    let a = seed >>> 0;
    return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  function hexRgb(h) {
    if (!h || h[0] !== '#') return [255, 0, 255];
    if (h.length === 4) h = '#' + h[1] + h[1] + h[2] + h[2] + h[3] + h[3];
    return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  }
  const rgbHex = (r, g, b) => '#' + [r, g, b].map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('');
  function mix(a, b, t) { const x = hexRgb(a), y = hexRgb(b); return rgbHex(lerp(x[0], y[0], t), lerp(x[1], y[1], t), lerp(x[2], y[2], t)); }
  const lighten = (c, t) => mix(c, '#ffffff', t);
  const darken = (c, t) => mix(c, '#000000', t);
  function rgba(c, a) { const [r, g, b] = hexRgb(c); return `rgba(${r},${g},${b},${a})`; }

  /** colour by role name or hex */
  function C(c) {
    if (!c) return ST.palette.ink;
    if (c[0] === '#') return c;
    // modifiers: "a2/d40" = accent 2 darkened 40%, "bg/l15" = background lightened 15%
    const mod = /^(.+)\/([dl])(\d+)$/.exec(c);
    if (mod) return mod[2] === 'd' ? darken(C(mod[1]), +mod[3] / 100) : lighten(C(mod[1]), +mod[3] / 100);
    const p = ST.palette;
    if (c === 'bg') return p.bg[0];
    if (c === 'bg2') return p.bg[1] || p.bg[0];
    if (c === 'ink') return p.ink;
    if (c === 'hi') return p.highlight;
    if (c === 'sh') return p.shadow;
    const m = /^a(\d)$/.exec(c);
    if (m) return p.accents[+m[1] % p.accents.length];
    const named = { skinDeep: '#8a5a3c', skinMid: '#b97f57', skinLight: '#e6b994', hairBlack: '#1d1714', hairBrown: '#5b3a24', white: '#f4f1ea', paper: '#efe6cf', gold: '#e2b44a' };
    return named[c] || p.ink;
  }

  /* ───────── the house style: fills, rim light, outline, glow ───────── */
  function fillShape(path, color, o = {}) {
    const c = C(color);
    if (ST.shading === 'soft' || ST.shading === 'cel') {
      const b = o.box || [-100, -100, 100, 100];
      const g = ctx.createLinearGradient(b[0], b[1], b[2], b[3]);
      if (ST.shading === 'cel') { g.addColorStop(0, lighten(c, 0.06)); g.addColorStop(0.55, lighten(c, 0.06)); g.addColorStop(0.551, darken(c, 0.12)); g.addColorStop(1, darken(c, 0.12)); }
      else { g.addColorStop(0, lighten(c, 0.1)); g.addColorStop(1, darken(c, 0.14)); }
      ctx.fillStyle = g;
    } else ctx.fillStyle = c;
    ctx.fill(path);
    if (ST.outline > 0 && !o.noOutline) { ctx.lineWidth = ST.outline; ctx.strokeStyle = C(ST.outlineColor || 'sh'); ctx.lineJoin = 'round'; ctx.stroke(path); }
  }
  function rim(drawFn, color = 'hi', alpha = 0.55, w = 5) {
    if (!ST.rimLight) return;
    ctx.save(); ctx.globalAlpha *= alpha; ctx.strokeStyle = C(color); ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.beginPath(); drawFn(); ctx.stroke(); ctx.restore();
  }
  function glow(x, y, r, color, a = 1) {
    if (ST.glow <= 0) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, rgba(C(color), 0.55 * a * ST.glow)); g.addColorStop(0.4, rgba(C(color), 0.18 * a * ST.glow)); g.addColorStop(1, rgba(C(color), 0));
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
    ctx.restore();
  }
  function rr(x, y, w, h, r) { const p = new Path2D(); const k = Math.min(r, w / 2, h / 2); p.roundRect(x, y, w, h, k); return p; }
  function circle(x, y, r) { const p = new Path2D(); p.arc(x, y, r, 0, TAU); return p; }
  function poly(pts) { const p = new Path2D(); p.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) p.lineTo(pts[i][0], pts[i][1]); p.closePath(); return p; }
  const R = () => ST.corner * 40;
  function font(size, weight) { return `${weight || ST.type.weight} ${size}px ${ST.type.font}`; }
  function caseText(s) { return ST.type.case === 'upper' ? s.toUpperCase() : s; }

  /* ───────── backgrounds ───────── */
  const BG = {
    gradient(b, t) {
      const g = ctx.createLinearGradient(0, 0, 0, VH);
      g.addColorStop(0, C(b.top || 'bg')); g.addColorStop(1, C(b.bottom || 'bg2'));
      ctx.fillStyle = g; ctx.fillRect(-VW, -VH, VW * 3, VH * 3);
    },
    space(b, t) {
      BG.gradient(b, t);
      const r = rng(b.seed || 3);
      for (let i = 0; i < 6; i++) { const x = r() * VW, y = r() * VH; glow(x, y, 300 + r() * 400, ST.palette.accents[i % ST.palette.accents.length], 0.35); }
      for (let i = 0; i < (b.stars ?? 260); i++) {
        const x = r() * VW * 1.4 - VW * 0.2, y = r() * VH * 1.4 - VH * 0.2, s = r() < 0.08 ? 3.2 : 1 + r() * 1.6;
        const tw = 0.55 + 0.45 * Math.sin(t * (0.8 + r() * 2) + r() * 10);
        ctx.fillStyle = rgba(C('hi'), tw * (0.5 + r() * 0.5));
        ctx.beginPath(); ctx.arc(x, y, s, 0, TAU); ctx.fill();
        if (s > 3) glow(x, y, 18, 'hi', tw);
      }
    },
    dusk(b, t) {
      BG.gradient({ top: b.top || 'bg', bottom: b.bottom || 'a1' }, t);
      glow(VW * (b.sunX ?? 0.7), VH * 0.62, 520, b.sun || 'a1', 0.9);
      const layers = b.layers || ['a2', 'bg2', 'sh'];
      layers.forEach((col, k) => {
        const r = rng(11 + k), base = VH * (0.66 + k * 0.08), p = new Path2D();
        p.moveTo(-VW * 0.3, VH * 1.5); p.lineTo(-VW * 0.3, base);
        for (let x = -VW * 0.3; x <= VW * 1.3; x += 120) p.lineTo(x, base - 30 - r() * (90 - k * 20) * (b.hills ?? 1));
        p.lineTo(VW * 1.3, VH * 1.5); p.closePath();
        ctx.fillStyle = C(col); ctx.fill(p);
      });
    },
    room(b, t) {
      ctx.fillStyle = C(b.wall || 'bg'); ctx.fillRect(-VW, -VH, VW * 3, VH * 3);
      ctx.fillStyle = C(b.floor || 'bg2'); ctx.fillRect(-VW, VH * 0.74, VW * 3, VH);
      const g = ctx.createRadialGradient(VW * 0.5, VH * 0.35, 50, VW * 0.5, VH * 0.4, VW * 0.8);
      g.addColorStop(0, rgba('#ffffff', 0.08)); g.addColorStop(1, rgba('#000000', 0.25));
      ctx.fillStyle = g; ctx.fillRect(-VW, -VH, VW * 3, VH * 3);
    },
    void(b, t) {
      ctx.fillStyle = C(b.color || 'bg'); ctx.fillRect(-VW, -VH, VW * 3, VH * 3);
      if (b.grid) { ctx.fillStyle = rgba(C('ink'), 0.08); for (let x = 0; x < VW; x += 60) for (let y = 0; y < VH; y += 60) ctx.fillRect(x, y, 3, 3); }
    },
  };

  /* ───────── characters: original "pebble people" ───────── */
  function figure(el, lt) {
    const h = el.h || 360, u = h / 360, dir = el.facing === 'left' ? -1 : 1;
    const skin = C(el.skin || 'skinMid'), hair = C(el.hair || 'hairBlack'), outfit = C(el.outfit || 'a0'), trim = C(el.trim || 'hi');
    const pose = el.pose || 'stand';
    const breathe = Math.sin(lt * 2.2 + (el.seed || 0)) * 3 * u;
    const walk = pose === 'walk' ? Math.sin(lt * 7) : 0;
    ctx.save(); ctx.scale(dir, 1);
    // shadow
    ctx.fillStyle = rgba('#000000', 0.22); ctx.beginPath(); ctx.ellipse(0, 0, 70 * u, 14 * u, 0, 0, TAU); ctx.fill();
    // legs
    const leg = (x, sw) => { ctx.save(); ctx.translate(x * u, -96 * u); ctx.rotate(sw * 0.35); fillShape(rr(-13 * u, 0, 26 * u, 96 * u, 12 * u), darken(outfit, 0.35), { box: [-13 * u, 0, 13 * u, 96 * u] }); ctx.restore(); };
    if (pose !== 'sit') { leg(-20, walk); leg(20, -walk); }
    // body: a soft pebble
    const bodyTop = -270 * u + breathe, body = new Path2D();
    body.moveTo(-58 * u, -90 * u);
    body.bezierCurveTo(-70 * u, -170 * u, -55 * u, bodyTop, 0, bodyTop);
    body.bezierCurveTo(55 * u, bodyTop, 70 * u, -170 * u, 58 * u, -90 * u);
    body.quadraticCurveTo(0, -70 * u, -58 * u, -90 * u);
    fillShape(body, outfit, { box: [-60 * u, bodyTop, 60 * u, -80 * u] });
    rim(() => { ctx.moveTo(-50 * u, -120 * u); ctx.bezierCurveTo(-60 * u, -190 * u, -40 * u, bodyTop + 6 * u, 0, bodyTop + 4 * u); }, 'hi', 0.45, 4 * u);
    if (el.collar !== false) { ctx.fillStyle = trim; ctx.beginPath(); ctx.moveTo(-18 * u, bodyTop + 6 * u); ctx.lineTo(0, bodyTop + 34 * u); ctx.lineTo(18 * u, bodyTop + 6 * u); ctx.closePath(); ctx.fill(); }
    if (el.jacket) { ctx.fillStyle = C(el.jacket); ctx.beginPath(); ctx.moveTo(-58 * u, -90 * u); ctx.bezierCurveTo(-70 * u, -170 * u, -55 * u, bodyTop, -14 * u, bodyTop + 2 * u); ctx.lineTo(-4 * u, -84 * u); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(58 * u, -90 * u); ctx.bezierCurveTo(70 * u, -170 * u, 55 * u, bodyTop, 14 * u, bodyTop + 2 * u); ctx.lineTo(4 * u, -84 * u); ctx.closePath(); ctx.fill(); }
    // arms
    const arm = (side, ang, len = 92) => {
      ctx.save(); ctx.translate(side * 50 * u, bodyTop + 50 * u); ctx.rotate(ang);
      fillShape(rr(-12 * u, 0, 24 * u, len * u, 12 * u), el.jacket ? C(el.jacket) : outfit, { box: [-12 * u, 0, 12 * u, len * u], noOutline: true });
      ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(0, len * u, 12 * u, 0, TAU); ctx.fill();
      ctx.restore();
    };
    const wob = Math.sin(lt * 3) * 0.08;
    if (pose === 'write') { arm(-1, 0.25); arm(1, -2.1 + Math.sin(lt * 9) * 0.12, 96); }
    else if (pose === 'think') { arm(-1, 0.2); arm(1, -2.75, 70); }
    else if (pose === 'wave') { arm(-1, 0.2); arm(1, -2.6 + Math.sin(lt * 6) * 0.35); }
    else if (pose === 'hold') { arm(-1, -0.9); arm(1, -0.9); }
    else if (pose === 'present') { arm(-1, 0.2); arm(1, -1.4 + wob); }
    else if (pose === 'walk') { arm(-1, walk * 0.4); arm(1, -walk * 0.4); }
    else { arm(-1, 0.15 + wob * 0.3); arm(1, -0.15 - wob * 0.3); }
    // head
    const hy = bodyTop - 58 * u, hr = 58 * u;
    fillShape(circle(8 * u, hy, hr), skin, { box: [-50 * u, hy - hr, 60 * u, hy + hr], noOutline: false });
    rim(() => { ctx.arc(8 * u, hy, hr - 3 * u, Math.PI * 1.05, Math.PI * 1.55); }, 'hi', 0.4, 4 * u);
    // hair (style: parted, swept, bun)
    ctx.fillStyle = hair;
    ctx.beginPath();
    if (el.hairStyle === 'swept') { ctx.arc(8 * u, hy - 8 * u, hr + 2 * u, Math.PI * 0.95, Math.PI * 2.05); ctx.quadraticCurveTo(30 * u, hy - 30 * u, -40 * u, hy - 4 * u); }
    else if (el.hairStyle === 'bald') { ctx.arc(8 * u, hy - 30 * u, 0.1, 0, 1); }
    else { ctx.arc(8 * u, hy - 6 * u, hr + 3 * u, Math.PI * 0.92, Math.PI * 2.02); ctx.quadraticCurveTo(10 * u, hy - 26 * u, -48 * u, hy + 10 * u); }
    ctx.fill();
    if (el.mark) { ctx.fillStyle = C(el.mark); ctx.beginPath(); ctx.ellipse(36 * u, hy - 30 * u, 3.5 * u, 9 * u, 0, 0, TAU); ctx.fill(); }
    if (el.moustache) { ctx.fillStyle = hair; ctx.beginPath(); ctx.ellipse(46 * u, hy + 22 * u, 13 * u, 4.5 * u, -0.1, 0, TAU); ctx.fill(); }
    // eyes: blink now and then
    const blink = (Math.sin(lt * 1.3 + (el.seed || 0) * 3) > 0.985) ? 0.15 : 1;
    const eye = (ex) => { ctx.fillStyle = '#1a1410'; ctx.beginPath(); ctx.ellipse(ex * u, hy - 4 * u, 6.5 * u, 9 * u * blink, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(ex * u + 2 * u, hy - 7 * u, 2.2 * u, 0, TAU); ctx.fill(); };
    eye(24); eye(46);
    if (el.glasses) { ctx.strokeStyle = C(el.glasses); ctx.lineWidth = 3 * u; ctx.beginPath(); ctx.arc(24 * u, hy - 4 * u, 13 * u, 0, TAU); ctx.moveTo(59 * u, hy - 4 * u); ctx.arc(46 * u, hy - 4 * u, 13 * u, 0, TAU); ctx.stroke(); }
    if (el.smile !== false) { ctx.strokeStyle = darken(skin, 0.45); ctx.lineWidth = 3 * u; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(38 * u, hy + 22 * u, 9 * u, 0.25, Math.PI - 0.25); ctx.stroke(); }
    ctx.restore();
    // props (drawn unflipped so text reads)
    if (el.prop === 'book') { ctx.save(); ctx.translate(dir * 30 * u, bodyTop + 120 * u); book({ w: 150 * u, h: 100 * u, pages: true }, lt); ctx.restore(); }
    if (el.prop === 'letter') { ctx.save(); ctx.translate(dir * 30 * u, bodyTop + 110 * u); ctx.rotate(-0.1 * dir); letter({ w: 120 * u, open: true }, lt); ctx.restore(); }
    if (el.prop === 'chalk') { glow(dir * 140 * u, bodyTop - 40 * u, 40 * u, 'hi', 0.8); }
  }

  /* ───────── props and places ───────── */
  function book(el, lt) {
    const w = el.w || 300, h = el.h || 200;
    ctx.fillStyle = darken(C(el.color || 'a2'), 0.2); ctx.beginPath(); ctx.roundRect(-w / 2 - 8, -h / 2 + 6, w + 16, h + 6, 10); ctx.fill();
    const page = (sx) => { const p = new Path2D(); p.moveTo(0, -h / 2 + 10); p.quadraticCurveTo(sx * w * 0.25, -h / 2 - 6, sx * w / 2, -h / 2 + 4); p.lineTo(sx * w / 2, h / 2); p.quadraticCurveTo(sx * w * 0.25, h / 2 - 10, 0, h / 2); p.closePath(); return p; };
    fillShape(page(-1), 'paper', { box: [-w / 2, -h / 2, 0, h / 2], noOutline: true }); fillShape(page(1), 'paper', { box: [0, -h / 2, w / 2, h / 2], noOutline: true });
    if (el.pages !== false) {
      ctx.strokeStyle = rgba('#3a3226', 0.45); ctx.lineWidth = Math.max(1.5, h / 90);
      const r = rng(el.seed || 5);
      for (const sx of [-1, 1]) for (let i = 0; i < 6; i++) { const y = -h / 2 + h * 0.18 + i * h * 0.12, x0 = sx * w * 0.06, x1 = sx * (w * 0.12 + r() * w * 0.32); ctx.beginPath(); ctx.moveTo(x0, y); for (let x = x0; Math.abs(x) < Math.abs(x1); x += sx * 6) ctx.lineTo(x, y + Math.sin(x * 0.4 + i) * 2); ctx.stroke(); }
    }
    if (el.flip) { const f = (lt * 0.8) % 1, a = Math.cos(f * Math.PI); const p = new Path2D(); p.moveTo(0, -h / 2 + 10); p.lineTo(a * w / 2, -h / 2 + 4 - Math.sin(f * Math.PI) * 20); p.lineTo(a * w / 2, h / 2 - Math.sin(f * Math.PI) * 14); p.lineTo(0, h / 2); p.closePath(); ctx.fillStyle = lighten(C('paper'), 0.1); ctx.fill(p); }
  }
  function letter(el, lt) {
    const w = el.w || 260, h = w * 0.64;
    fillShape(rr(-w / 2, -h / 2, w, h, 6), 'paper', { box: [-w / 2, -h / 2, w / 2, h / 2] });
    if (el.open) { ctx.strokeStyle = rgba('#3a3226', 0.5); ctx.lineWidth = Math.max(1.2, w / 140); for (let i = 0; i < 6; i++) { const y = -h / 2 + h * 0.2 + i * h * 0.12; ctx.beginPath(); ctx.moveTo(-w * 0.38, y); for (let x = -w * 0.38; x < w * (0.18 + (i % 3) * 0.08); x += 5) ctx.lineTo(x, y + Math.sin(x * 0.5 + i) * 1.6); ctx.stroke(); } }
    else { ctx.strokeStyle = darken(C('paper'), 0.25); ctx.lineWidth = w / 80; ctx.beginPath(); ctx.moveTo(-w / 2, -h / 2); ctx.lineTo(0, h * 0.08); ctx.lineTo(w / 2, -h / 2); ctx.stroke(); ctx.fillStyle = C(el.stamp || 'a1'); ctx.fillRect(w * 0.3, -h * 0.4, w * 0.14, w * 0.16); }
  }
  function temple(el, lt) {
    const w = el.w || 420, h = el.h || 620, c = C(el.color || 'a1'), tiers = el.tiers || 6;
    fillShape(rr(-w / 2, -h * 0.2, w, h * 0.2, 4), darken(c, 0.1), { box: [-w / 2, -h * 0.2, w / 2, 0] });
    ctx.fillStyle = darken(c, 0.55); ctx.beginPath(); ctx.moveTo(-w * 0.1, 0); ctx.lineTo(-w * 0.1, -h * 0.12); ctx.arc(0, -h * 0.12, w * 0.1, Math.PI, 0); ctx.lineTo(w * 0.1, 0); ctx.closePath(); ctx.fill();
    let y = -h * 0.2, tw = w * 0.92;
    for (let i = 0; i < tiers; i++) {
      const th = (h * 0.62) / tiers, nw = tw * 0.84;
      fillShape(poly([[-tw / 2, y], [tw / 2, y], [nw / 2, y - th], [-nw / 2, y - th]]), i % 2 ? c : lighten(c, 0.08), { box: [-tw / 2, y - th, tw / 2, y] });
      ctx.fillStyle = darken(c, 0.4);
      for (let k = -2; k <= 2; k++) ctx.fillRect(k * nw * 0.18 - 5, y - th * 0.7, 10, th * 0.45);
      y -= th; tw = nw;
    }
    fillShape(rr(-tw / 2 - 10, y - h * 0.08, tw + 20, h * 0.08, h * 0.04), lighten(c, 0.1), { box: [-tw / 2, y - h * 0.08, tw / 2, y] });
    for (let k = -1; k <= 1; k++) { ctx.fillStyle = C('gold'); ctx.beginPath(); ctx.arc(k * tw * 0.3, y - h * 0.09, 9, 0, TAU); ctx.fill(); glow(k * tw * 0.3, y - h * 0.09, 40, 'gold', 0.7); }
  }
  function chapel(el, lt) {
    const w = el.w || 700, h = el.h || 380, c = C(el.color || 'a2');
    fillShape(rr(-w / 2, -h, w, h, 4), c, { box: [-w / 2, -h, w / 2, 0] });
    for (const sx of [-1, 1]) {
      fillShape(rr(sx * w / 2 - 40, -h - 140, 80, h + 140, 4), lighten(c, 0.06), { box: [sx * w / 2 - 40, -h - 140, sx * w / 2 + 40, 0] });
      fillShape(poly([[sx * w / 2 - 40, -h - 140], [sx * w / 2 + 40, -h - 140], [sx * w / 2, -h - 230]]), lighten(c, 0.1), { box: [sx * w / 2 - 40, -h - 230, sx * w / 2 + 40, -h - 140] });
    }
    const n = 7;
    for (let i = 0; i < n; i++) {
      const x = -w / 2 + 80 + i * (w - 160) / (n - 1), ww = 44, wh = h * 0.62, y = -h * 0.15;
      const p = new Path2D(); p.moveTo(x - ww / 2, y); p.lineTo(x - ww / 2, y - wh); p.quadraticCurveTo(x, y - wh - 50, x + ww / 2, y - wh); p.lineTo(x + ww / 2, y); p.closePath();
      ctx.fillStyle = el.lit ? C('gold') : darken(c, 0.5); ctx.fill(p);
      if (el.lit) glow(x, y - wh / 2, 60, 'gold', 0.5);
    }
  }
  function ship(el, lt) {
    const w = el.w || 360, bob = Math.sin(lt * 1.6) * 6, rock = Math.sin(lt * 1.2) * 0.025;
    ctx.save(); ctx.translate(0, bob); ctx.rotate(rock);
    fillShape(poly([[-w / 2, -w * 0.12], [w / 2, -w * 0.12], [w * 0.4, w * 0.08], [-w * 0.42, w * 0.08]]), el.color || 'sh', { box: [-w / 2, -w * 0.12, w / 2, w * 0.08] });
    ctx.fillStyle = C('hi'); ctx.fillRect(-w / 2, -w * 0.12, w, w * 0.025);
    fillShape(rr(-w * 0.28, -w * 0.3, w * 0.5, w * 0.18, 8), 'white', { box: [-w * 0.28, -w * 0.3, w * 0.22, -w * 0.12] });
    for (let k = 0; k < 2; k++) {
      const fx = -w * 0.12 + k * w * 0.18;
      fillShape(rr(fx, -w * 0.48, w * 0.08, w * 0.2, 4), el.funnel || 'a0', { box: [fx, -w * 0.48, fx + w * 0.08, -w * 0.28] });
      for (let s = 0; s < 4; s++) { const ph = (lt * 0.5 + s / 4 + k * 0.13) % 1; ctx.fillStyle = rgba('#e8e4dc', 0.5 * (1 - ph)); ctx.beginPath(); ctx.arc(fx + w * 0.04 - ph * w * 0.4, -w * 0.5 - ph * w * 0.25, w * 0.04 + ph * w * 0.06, 0, TAU); ctx.fill(); }
    }
    ctx.restore();
  }
  function waves(el, lt) {
    const w = el.w || VW * 1.6, c = C(el.color || 'a3');
    for (let k = 0; k < 3; k++) {
      const p = new Path2D(), y0 = k * 40;
      p.moveTo(-w / 2, 400);
      for (let x = -w / 2; x <= w / 2; x += 20) p.lineTo(x, y0 + Math.sin(x * 0.012 + lt * (1 + k * 0.4) + k) * 14);
      p.lineTo(w / 2, 400); p.closePath();
      ctx.fillStyle = k === 0 ? lighten(c, 0.1) : darken(c, k * 0.12); ctx.fill(p);
    }
  }
  function palm(el, lt) {
    const h = el.h || 420, c = C(el.color || 'sh'), sway = Math.sin(lt * 0.9 + (el.seed || 0)) * 0.05;
    ctx.save(); ctx.rotate(sway);
    ctx.strokeStyle = c; ctx.lineWidth = h * 0.05; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(h * 0.12, -h * 0.5, h * 0.05, -h); ctx.stroke();
    ctx.translate(h * 0.05, -h);
    for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * 0.5; ctx.save(); ctx.rotate(a + Math.PI / 2); ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(h * 0.18, -h * 0.08, h * 0.36, h * 0.06); ctx.quadraticCurveTo(h * 0.18, -h * 0.01, 0, 0); ctx.fill(); ctx.restore(); }
    ctx.restore();
  }
  function planet(el, lt) {
    const r = el.r || 200, c = C(el.color || 'a0');
    glow(0, 0, r * 2.2, c, 0.6);
    const g = ctx.createRadialGradient(-r * 0.4, -r * 0.4, r * 0.1, 0, 0, r);
    g.addColorStop(0, lighten(c, 0.25)); g.addColorStop(0.7, c); g.addColorStop(1, darken(c, 0.45));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
    rim(() => ctx.arc(0, 0, r - 3, Math.PI * 1.0, Math.PI * 1.6), 'hi', 0.6, 6);
    if (el.ring) { ctx.strokeStyle = rgba(C(el.ring), 0.8); ctx.lineWidth = r * 0.08; ctx.beginPath(); ctx.ellipse(0, 0, r * 1.7, r * 0.35, -0.25, 0, TAU); ctx.stroke(); }
  }
  function particles(el, lt) {
    const n = el.n || 60, r = rng(el.seed || 9), sp = el.spread || 600, c = C(el.color || 'hi');
    for (let i = 0; i < n; i++) {
      let x, y; const s = 2 + r() * (el.size || 5), ph = r() * 10, sp2 = 0.3 + r();
      if (el.mode === 'orbit') { const a = ph + lt * sp2 * 0.4, d = sp * (0.3 + r() * 0.7); x = Math.cos(a) * d; y = Math.sin(a) * d * 0.45; }
      else if (el.mode === 'rise') { x = (r() - 0.5) * sp * 2; y = sp - ((lt * 60 * sp2 + ph * 100) % (sp * 2)); }
      else { x = (r() - 0.5) * sp * 2 + Math.sin(lt * sp2 + ph) * 30; y = (r() - 0.5) * sp + Math.cos(lt * sp2 * 0.8 + ph) * 30; }
      ctx.fillStyle = rgba(c, 0.5 + 0.5 * Math.sin(lt * 2 + ph)); ctx.beginPath(); ctx.arc(x, y, s, 0, TAU); ctx.fill();
      if (s > 5) glow(x, y, s * 6, c, 0.4);
    }
  }

  /* ───────── maths props ───────── */
  function drawText(txt, size, color, align = 'center', weight, alpha = 1) {
    ctx.font = font(size, weight); ctx.textAlign = align; ctx.textBaseline = 'middle';
    ctx.fillStyle = rgba(C(color), alpha); ctx.fillText(txt, 0, 0);
  }
  function equation(el, lt, k) {
    const txt = el.text, size = el.size || 90, c = C(el.color || 'ink');
    ctx.font = font(size, el.weight || 700); ctx.textBaseline = 'middle';
    const chars = [...txt], ws = chars.map((ch) => ctx.measureText(ch).width), total = ws.reduce((a, b) => a + b, 0);
    const prog = el.draw === false ? 1 : clamp((lt - (el.at || 0)) / (el.speed || Math.max(0.8, chars.length * 0.06)));
    let x = el.align === 'left' ? 0 : -total / 2;
    const shown = prog * chars.length;
    chars.forEach((ch, i) => {
      const a = clamp(shown - i);
      if (a <= 0) { x += ws[i]; return; }
      ctx.save(); ctx.translate(x + ws[i] / 2, (1 - ease.out(a)) * size * 0.3);
      ctx.fillStyle = rgba(c, a); ctx.textAlign = 'center'; ctx.fillText(ch, 0, 0);
      if (a < 1 && a > 0) glow(0, 0, size * 0.9, el.glow || 'hi', 1 - a);
      ctx.restore();
      x += ws[i];
    });
    if (el.box) { ctx.strokeStyle = rgba(C(el.box), prog); ctx.lineWidth = 4; ctx.beginPath(); ctx.roundRect(-total / 2 - 30, -size * 0.8, total + 60, size * 1.6, 18); ctx.stroke(); }
  }
  function halves(el, lt) {
    const w = el.w || 1100, h = el.h || 120, n = el.n || 7, dur = el.speed || 4;
    const p = clamp((lt - (el.at || 0)) / dur) * n;
    ctx.strokeStyle = rgba(C('ink'), 0.6); ctx.lineWidth = 4; ctx.strokeRect(-w / 2, -h / 2, w, h);
    let x = -w / 2, seg = w / 2;
    for (let i = 0; i < n; i++) {
      const a = clamp(p - i);
      if (a > 0) {
        fillShape(rr(x + 3, -h / 2 + 3, Math.max(0, seg * ease.out(a) - 6), h - 6, Math.min(12, seg / 3)), ST.palette.accents[i % ST.palette.accents.length], { box: [x, -h / 2, x + seg, h / 2], noOutline: true });
        if (seg > 70) { ctx.save(); ctx.translate(x + seg / 2, h * 0.95); drawText(i === 0 ? '1' : `1/${2 ** i}`, Math.min(54, seg * 0.3), 'ink', 'center', 700, a); ctx.restore(); }
      }
      x += seg; seg /= 2;
    }
    ctx.save(); ctx.translate(w / 2 + 40, 0); glow(0, 0, 90, 'hi', clamp(p - n + 1)); ctx.restore();
  }
  function staircase(el, lt) {
    const n = el.n || 14, bw = el.bw || 70, gap = 12, base = 0, grow = clamp((lt - (el.at || 0)) / (el.speed || 4)) * n;
    for (let i = 0; i < n; i++) {
      const a = clamp(grow - i); if (a <= 0) continue;
      const hh = (i + 1) * (el.unit || 26) * ease.back(a), x = i * (bw + gap);
      fillShape(rr(x, base - hh, bw, hh, 8), ST.palette.accents[i % ST.palette.accents.length], { box: [x, base - hh, x + bw, base] });
      ctx.save(); ctx.translate(x + bw / 2, base + 40); drawText(String(i + 1), 36, 'ink', 'center', 700, a); ctx.restore();
    }
  }
  function radical(el, lt) {
    // √(1 + 2√(1 + 3√(1 + 4√(1 + …)))) as nested, shrinking roots
    const depth = el.depth || 5, prog = clamp((lt - (el.at || 0)) / (el.speed || 4)) * depth, size0 = el.size || 90;
    const lv = [];
    let x = 0, size = size0;
    for (let d = 0; d < depth; d++) {
      ctx.font = font(size * 0.8, 700);
      const label = d < depth - 1 ? `1 + ${d + 2}` : '1 + …';
      lv.push({ x, size, label });
      x += size * 0.58 + ctx.measureText(label).width + size * 0.08; size *= 0.78;
    }
    const end = x + 10;
    lv.forEach((L, d) => {
      const a = clamp(prog - d); if (a <= 0) return;
      ctx.save(); ctx.globalAlpha *= a;
      ctx.strokeStyle = C(ST.palette.accents[d % ST.palette.accents.length]); ctx.lineWidth = Math.max(2, L.size * 0.06); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      const h = L.size * 1.1 * Math.pow(0.97, d), top = -h * 0.62 - (depth - d) * 4;
      ctx.beginPath(); ctx.moveTo(L.x, 0); ctx.lineTo(L.x + L.size * 0.14, -L.size * 0.1); ctx.lineTo(L.x + L.size * 0.3, h * 0.35); ctx.lineTo(L.x + L.size * 0.48, top); ctx.lineTo(lerp(L.x + L.size * 0.48, end - d * 6, ease.out(a)), top); ctx.stroke();
      ctx.font = font(L.size * 0.8, 700); ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.fillStyle = C('ink');
      ctx.fillText(L.label, L.x + L.size * 0.58, 0);
      ctx.restore();
    });
    if (el.result) { const r = clamp((lt - (el.at || 0) - (el.speed || 4)) * 1.5); if (r > 0) { ctx.save(); ctx.translate(end + 30, 0); ctx.font = font(size0 * 0.9, 800); ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = C('hi'); ctx.globalAlpha *= r; ctx.fillText(`= ${el.result}`, 0, 0); glow(60, 0, 160, 'hi', r); ctx.restore(); } }
  }
  function lemniscate(el, lt) {
    const a = el.size || 360, prog = clamp((lt - (el.at || 0)) / (el.speed || 2.6)), steps = 240, c = C(el.color || 'hi');
    const pt = (s) => { const t = s * TAU, d = 1 + Math.sin(t) ** 2; return [a * Math.cos(t) / d, a * Math.sin(t) * Math.cos(t) / d]; };
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const [w, al] of [[34, 0.12], [20, 0.25], [9, 1]]) {
      ctx.strokeStyle = rgba(c, al); ctx.lineWidth = w; ctx.beginPath();
      for (let i = 0; i <= steps * prog; i++) { const [x, y] = pt(i / steps); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
      ctx.stroke();
    }
    const [hx, hy] = pt((prog + (prog >= 1 ? lt * 0.15 : 0)) % 1);
    glow(hx, hy, 120, el.color || 'hi', 1); ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(hx, hy, 9, 0, TAU); ctx.fill();
  }
  function partitions(el, lt) {
    // every way to split n into parts, as rows of dots (Young diagrams)
    const n = el.n || 5, parts = [];
    const gen = (rem, max, acc) => { if (!rem) { parts.push(acc); return; } for (let k = Math.min(rem, max); k >= 1; k--) gen(rem - k, k, [...acc, k]); };
    gen(n, n, []);
    const dot = el.dot || 26, cellW = (n + 1) * dot * 1.25, cols = Math.min(parts.length, el.cols || 4), prog = clamp((lt - (el.at || 0)) / (el.speed || 3)) * parts.length;
    const rows = Math.ceil(parts.length / cols), cellH = (n + 1) * dot * 1.25;
    parts.forEach((p, i) => {
      const a = clamp(prog - i); if (a <= 0) return;
      const cx = (i % cols - (cols - 1) / 2) * cellW, cy = (Math.floor(i / cols) - (rows - 1) / 2) * cellH;
      ctx.save(); ctx.translate(cx - (n * dot * 1.2) / 2, cy - (p.length * dot * 1.2) / 2); ctx.globalAlpha *= a;
      p.forEach((len, r) => { for (let j = 0; j < len; j++) { fillShape(circle(j * dot * 1.2, r * dot * 1.2, dot * 0.46 * ease.back(a)), ST.palette.accents[r % ST.palette.accents.length], { box: [-dot, -dot, dot, dot], noOutline: true }); } });
      ctx.restore();
    });
  }
  function counter(el, lt) {
    const p = ease.out(clamp((lt - (el.at || 0)) / (el.speed || 3)));
    const from = BigInt(el.from || 0), to = BigInt(el.to || 0);
    const scaleN = 1000000n, v = from + ((to - from) * BigInt(Math.round(p * 1000000))) / scaleN;
    const s = v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    ctx.save(); drawText((el.prefix || '') + s, el.size || 120, el.color || 'hi', 'center', 800); ctx.restore();
    if (el.label) { ctx.save(); ctx.translate(0, (el.size || 120) * 0.85); drawText(caseText(el.label), (el.size || 120) * 0.32, 'ink', 'center', 500, 0.85); ctx.restore(); }
  }
  function piSpiral(el, lt) {
    const digits = '3.14159265358979323846264338327950288419716939937510582097494459230781640628620899862803482534211706798214808651328230664709384460955058223172535940812848111745028410270193852110555964462294895493038196';
    const n = Math.floor(clamp((lt - (el.at || 0)) / (el.speed || 6)) * digits.length);
    for (let i = 0; i < n; i++) {
      const a = i * 0.32, r = 40 + i * 3.4;
      ctx.save(); ctx.translate(Math.cos(a + lt * 0.15) * r, Math.sin(a + lt * 0.15) * r); ctx.rotate(a + Math.PI / 2 + lt * 0.15);
      drawText(digits[i], 30 + i * 0.12, ST.palette.accents[Math.floor(i / 8) % ST.palette.accents.length], 'center', 700, i > n - 6 ? (n - i) / 6 + 0.3 : 1);
      ctx.restore();
    }
  }
  function taxi(el, lt) {
    const w = el.w || 520, c = C(el.color || 'a1'), rollX = 0;
    ctx.save(); ctx.translate(rollX, Math.sin(lt * 9) * 1.5);
    fillShape(rr(-w / 2, -w * 0.2, w, w * 0.2, 24), c, { box: [-w / 2, -w * 0.2, w / 2, 0] });
    fillShape(poly([[-w * 0.3, -w * 0.2], [w * 0.22, -w * 0.2], [w * 0.12, -w * 0.38], [-w * 0.2, -w * 0.38]]), darken(c, 0.08), { box: [-w * 0.3, -w * 0.38, w * 0.22, -w * 0.2] });
    ctx.fillStyle = rgba(C('hi'), 0.65); ctx.fillRect(-w * 0.17, -w * 0.35, w * 0.13, w * 0.12); ctx.fillRect(w * 0.0, -w * 0.35, w * 0.12, w * 0.12);
    for (const sx of [-0.3, 0.3]) { ctx.fillStyle = '#1b1b1f'; ctx.beginPath(); ctx.arc(sx * w, 0, w * 0.085, 0, TAU); ctx.fill(); ctx.fillStyle = '#9a9aa2'; ctx.beginPath(); ctx.arc(sx * w, 0, w * 0.035, 0, TAU); ctx.fill(); }
    fillShape(rr(-w * 0.09, -w * 0.13, w * 0.18, w * 0.08, 6), 'white', { box: [0, 0, 1, 1], noOutline: true });
    ctx.save(); ctx.translate(0, -w * 0.09); drawText(el.plate || '1729', w * 0.06, '#1b1b1f', 'center', 800); ctx.restore();
    glow(w * 0.5, -w * 0.1, 80, 'gold', 0.8);
    ctx.restore();
  }
  function isoCube(s, col) {
    const c = C(col), h = s * 0.5;
    fillShape(poly([[0, -s], [s * 0.87, -s + h], [0, -s + 2 * h], [-s * 0.87, -s + h]]), lighten(c, 0.15), { box: [-s, -s, s, 0], noOutline: true });
    fillShape(poly([[-s * 0.87, -s + h], [0, -s + 2 * h], [0, h * 2], [-s * 0.87, h]]), c, { box: [-s, -s, 0, s], noOutline: true });
    fillShape(poly([[s * 0.87, -s + h], [0, -s + 2 * h], [0, h * 2], [s * 0.87, h]]), darken(c, 0.25), { box: [0, -s, s, s], noOutline: true });
  }
  function cubes(el, lt) {
    const pairs = el.pairs || [[1, 12], [9, 10]], prog = clamp((lt - (el.at || 0)) / (el.speed || 3)) * pairs.length;
    pairs.forEach((pr, row) => {
      const a = clamp(prog - row); if (a <= 0) return;
      const y = (row - (pairs.length - 1) / 2) * 280;
      ctx.save(); ctx.translate(0, y); ctx.globalAlpha *= a;
      let x = -560;
      pr.forEach((n, j) => {
        const s = 22 + n * 6.5;
        ctx.save(); ctx.translate(x + s, 20); isoCube(s * ease.back(a), ST.palette.accents[(row * 2 + j) % ST.palette.accents.length]); ctx.restore();
        ctx.save(); ctx.translate(x + s, 20 - s * 1.4 - 20); drawText(`${n}³`, 54, 'ink', 'center', 800); ctx.restore();
        x += s * 2 + 60;
        if (j === 0) { ctx.save(); ctx.translate(x - 20, 0); drawText('+', 70, 'ink', 'center', 800); ctx.restore(); x += 40; }
      });
      ctx.save(); ctx.translate(x + 40, 0); drawText(`= ${pr.reduce((s, n) => s + n ** 3, 0)}`, 76, 'hi', 'left', 800); ctx.restore();
      ctx.restore();
    });
  }
  function journey(el, lt) {
    const [x0, y0] = el.from || [-600, 0], [x1, y1] = el.to || [600, 0], lift = el.lift ?? -260, prog = ease.inOut(clamp((lt - (el.at || 0)) / (el.speed || 4)));
    const pt = (t) => [lerp(lerp(x0, (x0 + x1) / 2, t), lerp((x0 + x1) / 2, x1, t), t), lerp(lerp(y0, (y0 + y1) / 2 + lift, t), lerp((y0 + y1) / 2 + lift, y1, t), t)];
    ctx.setLineDash([14, 16]); ctx.lineDashOffset = -lt * 30; ctx.strokeStyle = rgba(C('ink'), 0.7); ctx.lineWidth = 5; ctx.beginPath();
    for (let i = 0; i <= 60 * prog; i++) { const [x, y] = pt(i / 60); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
    ctx.stroke(); ctx.setLineDash([]);
    for (const [[x, y], lab] of [[[x0, y0], el.fromLabel], [[x1, y1], el.toLabel]]) { fillShape(circle(x, y, 16), 'a0', { box: [x - 16, y - 16, x + 16, y + 16] }); glow(x, y, 60, 'a0', 0.7); if (lab) { ctx.save(); ctx.translate(x, y + 60); drawText(caseText(lab), 44, 'ink', 'center', 700); ctx.restore(); } }
    const [hx, hy] = pt(prog);
    ctx.save(); ctx.translate(hx, hy - 40); ship({ w: 150 }, lt); ctx.restore();
  }
  function board(el, lt) {
    const w = el.w || 900, h = el.h || 520;
    fillShape(rr(-w / 2 - 22, -h / 2 - 22, w + 44, h + 44, 14), '#6b4a2e', { box: [-w / 2, -h / 2, w / 2, h / 2] });
    ctx.fillStyle = C(el.color || '#1f3a32'); ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.fillStyle = rgba('#ffffff', 0.04); for (let i = 0; i < 8; i++) ctx.fillRect(-w / 2 + i * w / 8, -h / 2, w / 16, h);
  }
  function windowNight(el, lt) {
    const w = el.w || 420, h = el.h || 520;
    fillShape(rr(-w / 2 - 18, -h / 2 - 18, w + 36, h + 36, 10), el.frame || 'white', { box: [-w / 2, -h / 2, w / 2, h / 2] });
    const g = ctx.createLinearGradient(0, -h / 2, 0, h / 2); g.addColorStop(0, C('bg')); g.addColorStop(1, C('bg2'));
    ctx.fillStyle = g; ctx.fillRect(-w / 2, -h / 2, w, h);
    const r = rng(4);
    ctx.save(); ctx.beginPath(); ctx.rect(-w / 2, -h / 2, w, h); ctx.clip();
    for (let i = 0; i < 40; i++) { ctx.fillStyle = rgba(C('hi'), 0.4 + 0.4 * Math.sin(lt + i)); ctx.fillRect(-w / 2 + r() * w, -h / 2 + r() * h, 2, 2); }
    if (el.rain) { ctx.strokeStyle = rgba('#cfe3ff', 0.35); ctx.lineWidth = 2; for (let i = 0; i < 50; i++) { const x = -w / 2 + r() * w, y = -h / 2 + ((r() * h + lt * 600) % h); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 6, y + 26); ctx.stroke(); } }
    ctx.restore();
    ctx.fillStyle = C(el.frame || 'white'); ctx.fillRect(-6, -h / 2, 12, h); ctx.fillRect(-w / 2, -6, w, 12);
  }
  function shape(el) {
    if (el.kind === 'ring') { ctx.strokeStyle = C(el.color || 'a0'); ctx.lineWidth = el.lw || 10; ctx.beginPath(); ctx.arc(0, 0, el.r || 100, 0, TAU); ctx.stroke(); return; }
    if (el.kind === 'circle') { fillShape(circle(0, 0, el.r || 100), el.color || 'a0', { box: [-el.r, -el.r, el.r, el.r] }); return; }
    const w = el.w || 200, h = el.h || 100; fillShape(rr(-w / 2, -h / 2, w, h, el.radius ?? R()), el.color || 'a0', { box: [-w / 2, -h / 2, w / 2, h / 2] });
  }
  function notebook(el, lt) {
    const w = el.w || 760, h = el.h || 960;
    ctx.save(); ctx.rotate(el.rot || -0.04);
    fillShape(rr(-w / 2, -h / 2, w, h, 12), 'paper', { box: [-w / 2, -h / 2, w / 2, h / 2] });
    ctx.strokeStyle = rgba('#7c9cc9', 0.35); ctx.lineWidth = 2; for (let y = -h / 2 + 90; y < h / 2 - 30; y += 46) { ctx.beginPath(); ctx.moveTo(-w / 2 + 30, y); ctx.lineTo(w / 2 - 30, y); ctx.stroke(); }
    (el.lines || []).forEach((ln, i) => {
      const a = clamp((lt - (el.at || 0) - i * (el.gap || 0.7)) / 0.7); if (a <= 0) return;
      ctx.save(); ctx.translate(-w / 2 + 60, -h / 2 + 120 + i * 92); ctx.globalAlpha *= a;
      ctx.font = `italic 600 ${el.size || 46}px Georgia, serif`; ctx.fillStyle = '#2b2a3a'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      const full = ctx.measureText(ln).width; ctx.save(); ctx.beginPath(); ctx.rect(0, -60, full * ease.out(a) + 4, 120); ctx.clip(); ctx.fillText(ln, 0, 0); ctx.restore();
      ctx.restore();
    });
    ctx.restore();
  }

  const DRAW = { figure, book, letter, temple, chapel, ship, waves, palm, planet, particles, equation, halves, staircase, radical, lemniscate, partitions, counter, piSpiral, taxi, cubes, journey, board, window: windowNight, shape, notebook,
    title(el, lt) {
      ctx.save(); drawText(caseText(el.text), el.size || 130, el.color || 'ink', 'center', 800); ctx.restore();
      if (el.sub) { ctx.save(); ctx.translate(0, (el.size || 130) * 0.9); drawText(el.sub, (el.size || 130) * 0.36, el.subColor || 'a0', 'center', 500); ctx.restore(); }
    },
    text(el) { ctx.save(); drawText(el.upper ? caseText(el.text) : el.text, el.size || 60, el.color || 'ink', el.align || 'center', el.weight || 600); ctx.restore(); },
    glow(el) { glow(0, 0, el.r || 300, el.color || 'hi', el.a ?? 1); },
    sun(el, lt) { const r = el.r || 140; glow(0, 0, r * 4, el.color || 'gold', 1); fillShape(circle(0, 0, r), el.color || 'gold', { box: [-r, -r, r, r], noOutline: true }); },
  };

  /* ───────── elements: entrance, exit, loops ───────── */
  function drawElement(el, lt, sceneDur) {
    const at = el.at || 0, inD = el.inDur || 0.7, out = el.out ?? null;
    if (lt < at) return;
    let k = clamp((lt - at) / inD);
    let ko = out != null ? 1 - clamp((lt - out) / 0.5) : 1;
    if (ko <= 0) return;
    const en = el.enter || 'pop';
    ctx.save();
    let x = el.x ?? VW / 2, y = el.y ?? VH / 2, s = el.s ?? 1, a = ko, rot = el.rot || 0;
    if (el.move) { const m = ease.inOut(clamp((lt - (el.move.at ?? at)) / (el.move.dur || 2))); x = lerp(x, el.move.x ?? x, m); y = lerp(y, el.move.y ?? y, m); s = lerp(s, el.move.s ?? s, m); }
    const e = ease.out(k), b = ease.back(k);
    if (en === 'pop') s *= b; else if (en === 'fade') a *= e; else if (en === 'rise') { y += (1 - e) * 120; a *= e; } else if (en === 'drop') { y -= (1 - b) * 300; a *= e; }
    else if (en === 'slideL') { x -= (1 - e) * 600; a *= e; } else if (en === 'slideR') { x += (1 - e) * 600; a *= e; } else if (en === 'grow') { s *= e; }
    const fl = (ST.motion.float ?? 1) * (el.loop === 'float' ? 1 : el.loop === 'bob' ? 0.5 : 0);
    if (fl) y += Math.sin(lt * 1.3 + (el.seed || x * 0.01)) * 14 * fl;
    if (el.loop === 'spin') rot += lt * (el.spin || 0.3);
    if (el.loop === 'pulse') s *= 1 + Math.sin(lt * 3) * 0.04;
    ctx.globalAlpha *= a;
    ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
    const fn = DRAW[el.type];
    if (fn) fn(el, lt, k); else { ctx.fillStyle = '#ff00ff'; ctx.fillRect(-20, -20, 40, 40); }
    ctx.restore();
  }

  function drawScene(sc, lt, target) {
    const c = target.getContext('2d');
    const prev = ctx;
    swap(c);
    c.setTransform(scale, 0, 0, scale, 0, 0);
    // camera: from → to with a little drift
    const cam = sc.camera || {}, p = ease.inOut(clamp(lt / Math.max(0.01, sc._dur)));
    const f = Object.assign({ x: 0, y: 0, z: 1 }, cam.from), t = Object.assign({ x: 0, y: 0, z: 1.05 }, cam.to);
    const dr = (ST.motion.drift || 0.02) * 400;
    const cx = lerp(f.x, t.x, p) + Math.sin(lt * 0.37 + sc._i) * dr * 0.3, cy = lerp(f.y, t.y, p) + Math.cos(lt * 0.29 + sc._i) * dr * 0.2, z = lerp(f.z, t.z, p);
    const layer = (depth, fn) => { c.save(); c.translate(VW / 2, VH / 2); c.scale(1 + (z - 1) * depth, 1 + (z - 1) * depth); c.translate(-VW / 2 - cx * depth, -VH / 2 - cy * depth); fn(); c.restore(); };
    const bg = sc.bg || { kind: 'gradient' };
    layer(0.25, () => (BG[bg.kind] || BG.gradient)(bg, lt));
    const els = (sc.elements || []).slice().sort((a, b) => (a.depth ?? 1) - (b.depth ?? 1));
    for (const el of els) layer(el.depth ?? 1, () => drawElement(el, lt, sc._dur));
    swap(prev);
  }
  /** every helper draws to `ctx`; point it at whichever canvas is being filled */
  function swap(c) { ctx = c; }

  /* ───────── post: captions, vignette, grain ───────── */
  function captions(t) {
    if (!SB.meta || SB.meta.captions === false) return;
    const sc = SB.scenes.find((s) => t >= s._start && t < s._start + s._dur);
    if (!sc || !sc.narration || !sc._vo) return;
    const lt = t - sc._start - (SB.meta.voOffset ?? 0.35);
    if (lt < 0 || lt > sc._vo + 0.4) return;
    const parts = sc.narration.match(/[^.!?;:]+[.!?;:]*\s*/g) || [sc.narration];
    const totalW = parts.reduce((s, p) => s + p.length, 0);
    let acc = 0, cur = parts[0];
    for (const p of parts) { const a0 = (acc / totalW) * sc._vo; acc += p.length; if (lt >= a0) cur = p; }
    const c = MAIN;
    c.setTransform(scale, 0, 0, scale, 0, 0);
    c.font = `500 40px ${ST.type.font}`; c.textAlign = 'center'; c.textBaseline = 'middle';
    const lines = wrap(c, cur.trim(), 1500);
    lines.forEach((ln, i) => {
      const y = VH - 70 - (lines.length - 1 - i) * 52, w = c.measureText(ln).width;
      c.fillStyle = 'rgba(8,10,20,0.62)'; c.beginPath(); c.roundRect(VW / 2 - w / 2 - 22, y - 26, w + 44, 52, 12); c.fill();
      c.fillStyle = '#f5f2ea'; c.fillText(ln, VW / 2, y + 1);
    });
  }
  function wrap(c, s, max) { const w = s.split(' '), out = []; let line = ''; for (const x of w) { const t = line ? line + ' ' + x : x; if (c.measureText(t).width > max && line) { out.push(line); line = x; } else line = t; } if (line) out.push(line); return out; }
  function post(t) {
    const c = MAIN;
    c.setTransform(scale, 0, 0, scale, 0, 0);
    if (ST.vignette > 0) { const g = c.createRadialGradient(VW / 2, VH / 2, VH * 0.35, VW / 2, VH / 2, VW * 0.72); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${ST.vignette})`); c.fillStyle = g; c.fillRect(0, 0, VW, VH); }
    if (ST.grain > 0) {
      if (!grainCv) { grainCv = document.createElement('canvas'); grainCv.width = grainCv.height = 256; const gc = grainCv.getContext('2d'), im = gc.createImageData(256, 256), r = rng(1); for (let i = 0; i < im.data.length; i += 4) { const v = r() * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; } gc.putImageData(im, 0, 0); }
      c.save(); c.globalAlpha = ST.grain; c.globalCompositeOperation = 'overlay'; const r = rng(Math.floor(t * 24)); const pat = c.createPattern(grainCv, 'repeat'); pat.setTransform(new DOMMatrix().translate(r() * 256, r() * 256).scale(1.5)); c.fillStyle = pat; c.fillRect(0, 0, VW, VH); c.restore();
    }
  }

  /* ───────── transitions and the public API ───────── */
  function frame(t) {
    const scenes = SB.scenes;
    let i = scenes.findIndex((s) => t >= s._start && t < s._start + s._dur);
    if (i < 0) i = scenes.length - 1;
    const sc = scenes[i], lt = t - sc._start, tr = sc.transition || ST.pacing.transitions[0] || 'cut', T = sc.transitionDur || 0.7;
    const main = MAIN;
    if (i > 0 && tr !== 'cut' && lt < T) {
      const prev = scenes[i - 1], p = ease.inOut(lt / T);
      drawScene(prev, prev._dur + lt, off[0]);
      drawScene(sc, lt, off[1]);
      swap(main);
      main.setTransform(1, 0, 0, 1, 0, 0); main.globalAlpha = 1; main.clearRect(0, 0, cv.width, cv.height);
      if (tr === 'fade') { main.drawImage(off[0], 0, 0); main.globalAlpha = p; main.drawImage(off[1], 0, 0); }
      else if (tr === 'zoom') { const z = 1 + p * 0.8; main.save(); main.globalAlpha = 1 - p; main.translate(cv.width / 2, cv.height / 2); main.scale(z, z); main.drawImage(off[0], -cv.width / 2, -cv.height / 2); main.restore(); const z2 = 0.8 + 0.2 * p; main.save(); main.globalAlpha = p; main.translate(cv.width / 2, cv.height / 2); main.scale(z2, z2); main.drawImage(off[1], -cv.width / 2, -cv.height / 2); main.restore(); }
      else if (tr === 'iris') { main.drawImage(off[0], 0, 0); main.save(); main.beginPath(); main.arc(cv.width / 2, cv.height / 2, p * Math.hypot(cv.width, cv.height) / 2, 0, TAU); main.clip(); main.drawImage(off[1], 0, 0); main.restore(); }
      else if (tr === 'whip') { const dx = p * cv.width; for (let k = 0; k < 4; k++) { main.globalAlpha = 0.3; main.drawImage(off[0], -dx - k * 18, 0); main.drawImage(off[1], cv.width - dx + k * 18, 0); } main.globalAlpha = 1; main.drawImage(off[0], -dx, 0); main.drawImage(off[1], cv.width - dx, 0); }
      else { main.drawImage(off[1], 0, 0); }
      main.globalAlpha = 1;
    } else {
      drawScene(sc, lt, cv);
      swap(main);
    }
    captions(t);
    post(t);
    return true;
  }

  function load(storyboard, style, timing) {
    SB = storyboard;
    ST = Object.assign({ shading: 'soft', outline: 0, glow: 0.7, grain: 0.04, vignette: 0.3, rimLight: true, corner: 0.5, motion: { energy: 0.5, drift: 0.02, float: 1 }, pacing: { transitions: ['cut'] }, type: {} }, style);
    ST.type = Object.assign({ font: "'Rubik', 'Helvetica Neue', Arial, sans-serif", weight: 800, case: 'upper' }, style.type || {});
    ST.palette = Object.assign({ bg: ['#10142e', '#1d2552'], ink: '#f4f1ea', accents: ['#ff8a3d', '#ffd166', '#4cc9f0', '#f72585'], highlight: '#fff6d6', shadow: '#0a0c1c' }, style.palette || {});
    const W = (storyboard.meta && storyboard.meta.width) || 1280, H = Math.round(W * 9 / 16);
    cv.width = W; cv.height = H; off.forEach((o) => { o.width = W; o.height = H; });
    scale = W / VW;
    let t = 0;
    SB.scenes.forEach((sc, i) => {
      const vo = timing && timing.clips && timing.clips[sc.id] ? timing.clips[sc.id].seconds : 0;
      sc._vo = vo; sc._i = i;
      sc._dur = Math.max(sc.dur || 4, vo ? vo + (SB.meta.voOffset ?? 0.35) + (SB.meta.tail ?? 0.8) : 0);
      sc._start = t; t += sc._dur;
    });
    return { total: t, scenes: SB.scenes.map((s) => ({ id: s.id, start: s._start, dur: s._dur, mood: s.mood || (SB.meta && SB.meta.mood) || 'wonder', vo: s._vo })) };
  }

  window.VR = { load, frame };
})();
