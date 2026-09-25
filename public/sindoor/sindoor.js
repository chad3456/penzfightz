/**
 * Operation Sindoor, explained — a short animated documentary, in plain
 * JavaScript, in the manner of an explainer video: cut paper, a map that
 * moves, highlighter over the words that matter, and big numbers.
 *
 * Everything is drawn on a 2D canvas and every sound is synthesised here.
 * No libraries, no images, no audio files; the coastlines and boundary lines
 * are Natural Earth's, in region.js, and the map made from them is schematic.
 *
 * On facts. Everything stated as fact is from the public record of April and
 * May 2025. Where the two governments disagree — on who was killed, on what
 * was hit, on aircraft lost — the film says who claimed what rather than
 * choosing, because that is the honest state of the record.
 *
 * Every frame is a pure function of its timestamp, so the page plays it live
 * and scripts/render-sindoor.mjs asks it for frame n at n/30 s.
 */
(() => {
  'use strict';

  const W = 1920;
  const H = 1080;
  const DURATION = 190;
  const TAU = Math.PI * 2;

  const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
  const lerp = (a, b, t) => a + (b - a) * t;
  const prog = (t, a, b) => clamp((t - a) / (b - a));
  const eOut = (t) => 1 - (1 - t) * (1 - t);
  const eOut3 = (t) => 1 - Math.pow(1 - t, 3);
  const eInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  // exactly zero at zero: at t = 0 the polynomial lands a hair below it, and a
  // negative radius makes arc() throw
  const eBack = (t) => { if (t <= 0) return 0; const c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
  function hash(n) {
    const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return s - Math.floor(s);
  }
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
  const can = (w, h) => {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  };

  /* ══════════════════════════════════════════════════════════════════════
     the look
     ══════════════════════════════════════════════════════════════════════ */

  const C = {
    paper: '#f2ede2',
    paper2: '#e8e1d2',
    ink: '#1c1b19',
    grey: '#77716a',
    yellow: '#ffd83d',
    red: '#d3241c',
    sindoor: '#e0301e',
    teal: '#1d7f86',
    navy: '#1e2a44',
    sea: '#d3e2e4',
    land: '#f1ead9',
    india: '#f3d9b8',
    pak: '#d7e0cc',
    blue: '#2f6fd1',
  };
  const HEAD = "'Oswald', 'Bebas Neue', 'Avenir Next Condensed', 'Roboto Condensed', 'Arial Narrow', 'Liberation Sans', Arial, sans-serif";
  const BODY = "'Avenir Next', 'Helvetica Neue', 'Liberation Sans', Arial, sans-serif";
  const SERIF = "Georgia, 'Times New Roman', 'Liberation Serif', serif";

  function wrapText(ctx, text, maxW) {
    const out = [];
    for (const para of String(text).split('\n')) {
      const words = para.split(' ');
      let cur = '';
      for (const w of words) {
        const next = cur ? cur + ' ' + w : w;
        if (ctx.measureText(next).width > maxW && cur) { out.push(cur); cur = w; } else cur = next;
      }
      out.push(cur);
    }
    return out;
  }

  /** Paper, with fibre and a little unevenness, cached once. */
  let paperTile = null;
  function paper(ctx, col = C.paper) {
    ctx.fillStyle = col;
    ctx.fillRect(0, 0, W, H);
    if (!paperTile) {
      const c = can(512, 512);
      const g = c.getContext('2d');
      const r = mulberry(31);
      for (let i = 0; i < 2600; i++) {
        g.strokeStyle = `rgba(90,70,40,${0.02 + r() * 0.05})`;
        g.lineWidth = 0.6;
        const x = r() * 512;
        const y = r() * 512;
        const a = r() * TAU;
        const l = 3 + r() * 12;
        g.beginPath();
        g.moveTo(x, y);
        g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
        g.stroke();
      }
      for (let i = 0; i < 1800; i++) {
        g.fillStyle = `rgba(255,255,255,${r() * 0.12})`;
        g.fillRect(r() * 512, r() * 512, 1.4, 1.4);
      }
      paperTile = ctx.createPattern(c, 'repeat');
    }
    ctx.fillStyle = paperTile;
    ctx.fillRect(0, 0, W, H);
  }

  /** A card of paper with a soft shadow under it, turned a little. */
  function card(ctx, x, y, w, h, rot, fill = '#fbf8f1', o = {}) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.fillStyle = 'rgba(40,30,20,0.18)';
    ctx.fillRect(-w / 2 + 8, -h / 2 + 12, w, h);
    ctx.fillStyle = fill;
    ctx.fillRect(-w / 2, -h / 2, w, h);
    if (o.tape) {
      ctx.fillStyle = 'rgba(255,240,180,0.7)';
      ctx.save();
      ctx.translate(-w / 2 + 30, -h / 2 + 4);
      ctx.rotate(-0.5);
      ctx.fillRect(-40, -12, 80, 24);
      ctx.restore();
      ctx.save();
      ctx.translate(w / 2 - 30, -h / 2 + 4);
      ctx.rotate(0.5);
      ctx.fillRect(-40, -12, 80, 24);
      ctx.restore();
    }
    if (o.draw) o.draw(ctx, w, h);
    ctx.restore();
  }

  /** The yellow marker, swiped left to right under a line of text. */
  function highlight(ctx, x, y, w, h, k, col = C.yellow) {
    if (k <= 0) return;
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = col;
    ctx.beginPath();
    const ww = w * eOut(k);
    ctx.moveTo(x - 6, y + h * 0.1);
    ctx.lineTo(x + ww + 6, y);
    ctx.lineTo(x + ww + 2, y + h);
    ctx.lineTo(x - 4, y + h * 1.05);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  /**
   * Text that arrives a word at a time, with parts marked *like this* given
   * the highlighter. Returns the height it took.
   */
  function words(ctx, text, x, y, o = {}) {
    const size = o.size || 44;
    const lh = size * (o.lh || 1.3);
    const t = o.t == null ? 99 : o.t;
    ctx.save();
    ctx.font = `${o.weight || 500} ${size}px ${o.font || BODY}`;
    ctx.textBaseline = 'alphabetic';
    const plain = text.replace(/\*/g, '');
    const lines = wrapText(ctx, plain, o.maxW || 1300);
    // work out which words are marked
    const marked = new Set();
    let inMark = false;
    let wi = 0;
    for (const tok of text.split(/(\s+)/)) {
      if (!tok.trim()) continue;
      const starts = tok.startsWith('*');
      if (starts) inMark = true;
      if (inMark) marked.add(wi);
      if (tok.replace(/[.,;:!?’'")]+$/, '').endsWith('*')) inMark = false;
      wi++;
    }
    let n = 0;
    const rate = o.rate || 14;
    const align = o.align || 'left';
    lines.forEach((line, li) => {
      const lw = ctx.measureText(line).width;
      let cx = align === 'center' ? x - lw / 2 : x;
      const ly = y + li * lh;
      for (const w of line.split(' ')) {
        const appear = n / rate;
        const k = clamp((t - appear) / 0.25);
        const ww = ctx.measureText(w + ' ').width;
        if (marked.has(n) && k > 0) highlight(ctx, cx - 4, ly - size * 0.82, ww - ctx.measureText(' ').width + 8, size * 1.0, clamp((t - appear - 0.15) / 0.35), o.mark || C.yellow);
        ctx.globalAlpha = k;
        ctx.fillStyle = o.color || C.ink;
        ctx.fillText(w, cx, ly + (1 - eOut(k)) * 12);
        cx += ww;
        n++;
      }
    });
    ctx.restore();
    return lines.length * lh;
  }

  function label(ctx, text, x, y, o = {}) {
    ctx.save();
    ctx.font = `${o.weight || 700} ${o.size || 22}px ${o.font || BODY}`;
    ctx.textAlign = o.align || 'left';
    ctx.textBaseline = o.base || 'middle';
    if (o.track) ctx.letterSpacing = `${o.track}px`;
    ctx.globalAlpha = o.alpha == null ? 1 : o.alpha;
    if (o.box) {
      const w = ctx.measureText(text).width;
      const bx = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
      ctx.fillStyle = o.box;
      ctx.fillRect(bx - 10, y - (o.size || 22) * 0.75, w + 20, (o.size || 22) * 1.5);
    }
    if (o.halo) {
      ctx.strokeStyle = o.halo;
      ctx.lineWidth = 6;
      ctx.lineJoin = 'round';
      ctx.strokeText(text, x, y);
    }
    ctx.fillStyle = o.color || C.ink;
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  /** A number that counts up to itself. */
  function bigNumber(ctx, value, x, y, k, o = {}) {
    const v = Math.round(value * eOut3(clamp(k)));
    label(ctx, (o.pre || '') + v.toLocaleString('en-US') + (o.post || ''), x, y, { size: o.size || 260, weight: 700, font: HEAD, color: o.color || C.ink, align: o.align || 'left', base: 'alphabetic' });
  }

  /** A chapter card: a slab of colour across the whole frame, a number, a title. */
  function chapter(ctx, t, T, n, title, col = C.yellow) {
    const inK = eOut3(prog(t, 0, 0.45));
    const outK = eInOut(prog(t, T - 0.4, T));
    ctx.save();
    ctx.fillStyle = col;
    ctx.fillRect(-W + inK * W + outK * W, 0, W, H);
    ctx.translate(outK * W, 0);
    const a = prog(t, 0.3, 0.7);
    ctx.globalAlpha = a;
    label(ctx, String(n).padStart(2, '0'), 180, 470, { size: 150, font: HEAD, weight: 700, color: C.ink, base: 'alphabetic' });
    ctx.fillStyle = C.ink;
    ctx.fillRect(180, 510, 520 * eOut(prog(t, 0.4, 1)), 10);
    label(ctx, title, 180, 640, { size: 110, font: HEAD, weight: 700, color: C.ink, base: 'alphabetic' });
    ctx.restore();
  }

  function grain(ctx, t) {
    const f = Math.floor(t * 12);
    ctx.save();
    ctx.globalAlpha = 0.05;
    ctx.fillStyle = C.ink;
    for (let i = 0; i < 260; i++) ctx.fillRect(hash(i * 1.3 + f) * W, hash(i * 2.7 + f) * H, 1.5, 1.5);
    ctx.restore();
  }

  /* ══════════════════════════════════════════════════════════════════════
     icons, drawn as cut paper
     ══════════════════════════════════════════════════════════════════════ */

  function icon(ctx, kind, x, y, s, col = C.ink) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s / 100, s / 100);
    ctx.fillStyle = col;
    ctx.strokeStyle = col;
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const P = new Path2D();
    switch (kind) {
      case 'water':
        P.moveTo(0, -46);
        P.bezierCurveTo(26, -10, 36, 8, 36, 20);
        P.arc(0, 20, 36, 0, Math.PI);
        P.bezierCurveTo(-36, 8, -26, -10, 0, -46);
        ctx.fill(P);
        ctx.strokeStyle = C.paper;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(-20, 22);
        ctx.quadraticCurveTo(-10, 12, 0, 22);
        ctx.quadraticCurveTo(10, 32, 20, 22);
        ctx.stroke();
        break;
      case 'gate':
        ctx.fillRect(-46, -40, 12, 86);
        ctx.fillRect(34, -40, 12, 86);
        ctx.fillRect(-40, -44, 80, 10);
        for (let i = 0; i < 5; i++) ctx.fillRect(-28 + i * 13, -30, 6, 70);
        break;
      case 'passport':
        ctx.fillRect(-32, -44, 64, 88);
        ctx.fillStyle = C.paper;
        ctx.beginPath();
        ctx.arc(0, -8, 16, 0, TAU);
        ctx.fill();
        ctx.fillRect(-18, 22, 36, 5);
        break;
      case 'person':
        ctx.beginPath();
        ctx.arc(0, -26, 16, 0, TAU);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-26, 44);
        ctx.quadraticCurveTo(-26, -4, 0, -4);
        ctx.quadraticCurveTo(26, -4, 26, 44);
        ctx.fill();
        ctx.fillRect(26, 14, 24, 20);
        break;
      case 'plane':
        ctx.beginPath();
        ctx.moveTo(-44, 4);
        ctx.lineTo(40, -4);
        ctx.quadraticCurveTo(50, 0, 40, 4);
        ctx.lineTo(-44, 8);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(6, 0);
        ctx.lineTo(-14, -34);
        ctx.lineTo(-4, -34);
        ctx.lineTo(22, 0);
        ctx.lineTo(-4, 36);
        ctx.lineTo(-14, 36);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-36, 4);
        ctx.lineTo(-46, -16);
        ctx.lineTo(-40, -16);
        ctx.lineTo(-28, 4);
        ctx.fill();
        break;
      case 'crate':
        ctx.fillRect(-40, -34, 80, 68);
        ctx.strokeStyle = C.paper;
        ctx.lineWidth = 5;
        ctx.strokeRect(-32, -26, 64, 52);
        ctx.beginPath();
        ctx.moveTo(-32, -26);
        ctx.lineTo(32, 26);
        ctx.stroke();
        break;
      case 'doc':
        ctx.beginPath();
        ctx.moveTo(-30, -44);
        ctx.lineTo(16, -44);
        ctx.lineTo(32, -28);
        ctx.lineTo(32, 44);
        ctx.lineTo(-30, 44);
        ctx.fill();
        ctx.fillStyle = C.paper;
        for (let i = 0; i < 4; i++) ctx.fillRect(-18, -18 + i * 14, 36, 5);
        break;
      case 'drone':
        ctx.fillRect(-12, -8, 24, 16);
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(-30, -24);
        ctx.lineTo(30, 24);
        ctx.moveTo(30, -24);
        ctx.lineTo(-30, 24);
        ctx.stroke();
        for (const [px, py] of [[-30, -24], [30, -24], [-30, 24], [30, 24]]) {
          ctx.beginPath();
          ctx.ellipse(px, py, 18, 5, 0, 0, TAU);
          ctx.fill();
        }
        break;
      case 'radar':
        ctx.beginPath();
        ctx.ellipse(0, -8, 38, 20, -0.6, 0, Math.PI);
        ctx.fill();
        ctx.fillRect(-4, -6, 8, 40);
        ctx.fillRect(-22, 32, 44, 10);
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(26, -40, 10, -1.2, 0.6);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(26, -40, 22, -1.2, 0.6);
        ctx.stroke();
        break;
      case 'jet':
        ctx.beginPath();
        ctx.moveTo(0, -48);
        ctx.lineTo(8, -20);
        ctx.lineTo(44, 10);
        ctx.lineTo(44, 18);
        ctx.lineTo(8, 8);
        ctx.lineTo(8, 30);
        ctx.lineTo(20, 42);
        ctx.lineTo(-20, 42);
        ctx.lineTo(-8, 30);
        ctx.lineTo(-8, 8);
        ctx.lineTo(-44, 18);
        ctx.lineTo(-44, 10);
        ctx.lineTo(-8, -20);
        ctx.closePath();
        ctx.fill();
        break;
      case 'phone':
        ctx.beginPath();
        ctx.moveTo(-40, -10);
        ctx.quadraticCurveTo(0, -40, 40, -10);
        ctx.lineTo(30, 6);
        ctx.lineTo(14, -2);
        ctx.lineTo(14, -12);
        ctx.quadraticCurveTo(0, -18, -14, -12);
        ctx.lineTo(-14, -2);
        ctx.lineTo(-30, 6);
        ctx.closePath();
        ctx.fill();
        ctx.fillRect(-30, 10, 60, 30);
        break;
      case 'atom':
        // the radiation trefoil
        ctx.beginPath();
        ctx.arc(0, 0, 9, 0, TAU);
        ctx.fill();
        for (let i = 0; i < 3; i++) {
          const a = -Math.PI / 2 + (i * TAU) / 3;
          ctx.beginPath();
          ctx.arc(0, 0, 44, a - 0.52, a + 0.52);
          ctx.arc(0, 0, 15, a + 0.52, a - 0.52, true);
          ctx.closePath();
          ctx.fill();
        }
        break;
      case 'meadow':
        ctx.beginPath();
        ctx.moveTo(-50, 40);
        ctx.quadraticCurveTo(-20, 10, 10, 26);
        ctx.quadraticCurveTo(30, 16, 50, 30);
        ctx.lineTo(50, 44);
        ctx.lineTo(-50, 44);
        ctx.fill();
        for (const [px, h] of [[-30, 50], [-14, 64], [22, 56]]) {
          ctx.beginPath();
          ctx.moveTo(px, 20 - h);
          ctx.lineTo(px + 14, 20);
          ctx.lineTo(px - 14, 20);
          ctx.fill();
        }
        break;
      case 'candle':
        ctx.fillRect(-10, -6, 20, 50);
        ctx.fillStyle = '#f0a020';
        ctx.beginPath();
        ctx.moveTo(0, -36);
        ctx.quadraticCurveTo(12, -18, 0, -10);
        ctx.quadraticCurveTo(-12, -18, 0, -36);
        ctx.fill();
        break;
      default:
        break;
    }
    ctx.restore();
  }
  /** An icon struck through. */
  function struck(ctx, x, y, s, k, col = C.red) {
    if (k <= 0) return;
    ctx.save();
    ctx.strokeStyle = col;
    ctx.lineWidth = s * 0.08;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - s * 0.5, y + s * 0.5);
    ctx.lineTo(x - s * 0.5 + s * eOut(k), y + s * 0.5 - s * eOut(k));
    ctx.stroke();
    ctx.restore();
  }

  /* ══════════════════════════════════════════════════════════════════════
     the map
     Land from Natural Earth; Pakistan's boundary from the same source, split
     into the part with its western and northern neighbours, the Line of
     Control, and the international border with India. Kashmir is shown the
     way most international maps show it: the Line of Control as a dashed
     line, with each side labelled by who administers it.
     ══════════════════════════════════════════════════════════════════════ */

  const REG = window.SINDOOR_REGION || { land: [], pakistan: [], split: { loc: 0, ib: 0 }, borders: [] };
  const toPts = (a) => { const o = []; for (let i = 0; i < a.length; i += 2) o.push([a[i] / 10, a[i + 1] / 10]); return o; };
  const LAND = REG.land.map(toPts);
  const PAK = toPts(REG.pakistan);
  const PAK_OUTER = PAK.slice(0, REG.split.loc + 1);
  const LOC = PAK.slice(REG.split.loc, REG.split.ib + 1);
  const IB = PAK.slice(REG.split.ib);
  const BORDERS = REG.borders.map(toPts);
  // closed along the coast; filled only where there is land
  const PAK_POLY = PAK.concat([[68.1, 23.4], [61.6, 24.9]]);
  const INDIA_POLY = LOC.concat(IB.slice(1), [[68.1, 23.4], [68, 5], [92, 5], [92, 36.2], [77.2, 36.2]]);

  const K0 = Math.cos((30 * Math.PI) / 180);
  let CAM = { lon: 72.5, lat: 28.5, z: 85 };
  const P = (lon, lat) => [W / 2 + (lon - CAM.lon) * CAM.z * K0, H / 2 - (lat - CAM.lat) * CAM.z];
  const lerpCam = (a, b, k) => ({ lon: lerp(a.lon, b.lon, k), lat: lerp(a.lat, b.lat, k), z: a.z * Math.pow(b.z / a.z, k) });

  const CAMS = {
    region: { lon: 72.5, lat: 28.6, z: 82 },
    kashmir: { lon: 74.7, lat: 33.7, z: 340 },
    strikes: { lon: 73.0, lat: 31.4, z: 158 },
    deep: { lon: 72.9, lat: 30.4, z: 230 },
    four: { lon: 72.8, lat: 28.9, z: 80 },
  };

  function tracePts(ctx, pts, close) {
    ctx.beginPath();
    let first = true;
    for (const [lon, lat] of pts) {
      const [x, y] = P(lon, lat);
      if (first) { ctx.moveTo(x, y); first = false; } else ctx.lineTo(x, y);
    }
    if (close) ctx.closePath();
  }
  function landPath() {
    const p = new Path2D();
    for (const ring of LAND) {
      let first = true;
      for (const [lon, lat] of ring) {
        const [x, y] = P(lon, lat);
        if (first) { p.moveTo(x, y); first = false; } else p.lineTo(x, y);
      }
      p.closePath();
    }
    return p;
  }

  const PLACES = {
    Pahalgam: [75.32, 34.01], Srinagar: [74.8, 34.08], Jammu: [74.86, 32.73], Poonch: [74.09, 33.77],
    Delhi: [77.21, 28.61], Islamabad: [73.05, 33.68], Lahore: [74.35, 31.55], Amritsar: [74.87, 31.63],
    Karachi: [67.01, 24.86], Muzaffarabad: [73.47, 34.37],
  };
  /** The nine sites India named, with the group it said each belonged to. Positions approximate. */
  const TARGETS = [
    ['Muzaffarabad', 73.52, 34.45, 'LeT', -1],
    ['Muzaffarabad', 73.44, 34.33, 'JeM', -1],
    ['Kotli', 73.9, 33.52, 'JeM', -1],
    ['Kotli', 73.98, 33.6, 'HM', 1],
    ['Bhimber', 74.1, 33.02, 'LeT', -1],
    ['Sialkot', 74.58, 32.56, 'HM', -1],
    ['Tehra Kalan', 74.95, 32.34, 'JeM', 1],
    ['Muridke', 74.26, 31.8, 'LeT', -1],
    ['Bahawalpur', 71.68, 29.39, 'JeM', -1],
  ];
  /** The military sites India said Pakistan aimed at on the night of 7–8 May. */
  const INDIA_SITES = [
    ['Awantipora', 74.99, 33.92], ['Srinagar', 74.8, 34.08], ['Jammu', 74.86, 32.73], ['Pathankot', 75.65, 32.27],
    ['Amritsar', 74.87, 31.63], ['Kapurthala', 75.38, 31.38], ['Jalandhar', 75.58, 31.33], ['Ludhiana', 75.85, 30.9],
    ['Adampur', 75.76, 31.43], ['Bathinda', 74.95, 30.21], ['Chandigarh', 76.78, 30.73], ['Nal', 73.2, 28.07],
    ['Phalodi', 72.37, 27.13], ['Uttarlai', 71.32, 25.8], ['Bhuj', 69.67, 23.25],
  ];
  /** The air bases India named on 10 May. */
  const AIRBASES = [
    ['Nur Khan', 73.1, 33.62], ['Murid', 72.77, 32.93], ['Rafiqui', 72.28, 30.76],
    ['Chunian', 73.98, 30.97], ['Rahim Yar Khan', 70.28, 28.43], ['Sukkur', 68.79, 27.72],
  ];

  /**
   * The base map at the current camera. `o.dim` fades it back behind text;
   * `o.labels` puts the country names on.
   */
  function baseMap(ctx, t, o = {}) {
    ctx.fillStyle = C.sea;
    ctx.fillRect(0, 0, W, H);
    // a few engraved lines on the water
    ctx.strokeStyle = 'rgba(40,90,110,0.08)';
    ctx.lineWidth = 1.5;
    for (let y = 20; y < H; y += 26) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
    const lp = landPath();
    ctx.save();
    ctx.translate(6, 9);
    ctx.fillStyle = 'rgba(60,45,25,0.2)';
    ctx.fill(lp);
    ctx.restore();
    ctx.fillStyle = C.land;
    ctx.fill(lp);
    ctx.save();
    ctx.clip(lp);
    // India, washed in from the middle so it has no hard northern edge
    const [ix, iy] = P(77, 26.5);
    const ig = ctx.createRadialGradient(ix, iy, 0, ix, iy, 13 * CAM.z);
    ig.addColorStop(0, rgba(C.india, 1));
    ig.addColorStop(0.7, rgba(C.india, 0.85));
    ig.addColorStop(1, rgba(C.india, 0));
    ctx.fillStyle = ig;
    tracePts(ctx, INDIA_POLY, true);
    ctx.fill();
    ctx.fillStyle = C.pak;
    tracePts(ctx, PAK_POLY, true);
    ctx.fill();
    // paper fibre over the land
    ctx.globalAlpha = 0.5;
    paperFibre(ctx);
    ctx.restore();
    // other boundaries, faint
    ctx.strokeStyle = 'rgba(60,55,50,0.35)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 6]);
    for (const b of BORDERS) { tracePts(ctx, b, false); ctx.stroke(); }
    ctx.setLineDash([]);
    ctx.strokeStyle = 'rgba(50,45,40,0.6)';
    ctx.lineWidth = 2;
    tracePts(ctx, PAK_OUTER, false);
    ctx.stroke();
    // the international border with India
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 2.6;
    tracePts(ctx, IB, false);
    ctx.stroke();
    // the Line of Control
    ctx.strokeStyle = '#8c2a1c';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 7]);
    tracePts(ctx, LOC, false);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = 'rgba(40,40,40,0.35)';
    ctx.lineWidth = 1.2;
    ctx.stroke(lp);
    if (o.labels !== false) countryLabels(ctx);
    if (o.dim) {
      ctx.fillStyle = rgba(C.paper, o.dim);
      ctx.fillRect(0, 0, W, H);
    }
  }
  let fibre = null;
  function paperFibre(ctx) {
    if (!fibre) {
      const c = can(400, 400);
      const g = c.getContext('2d');
      const r = mulberry(77);
      for (let i = 0; i < 900; i++) {
        g.strokeStyle = `rgba(110,85,50,${0.04 + r() * 0.06})`;
        g.lineWidth = 0.8;
        const x = r() * 400;
        const y = r() * 400;
        const a = r() * TAU;
        g.beginPath();
        g.moveTo(x, y);
        g.lineTo(x + Math.cos(a) * 9, y + Math.sin(a) * 9);
        g.stroke();
      }
      fibre = ctx.createPattern(c, 'repeat');
    }
    ctx.fillStyle = fibre;
    ctx.fillRect(0, 0, W, H);
  }
  function countryLabels(ctx) {
    const s = clamp(CAM.z / 90, 0.7, 1.6);
    const put = (text, lon, lat, size, o = {}) => {
      const [x, y] = P(lon, lat);
      if (x < -300 || x > W + 300 || y < -100 || y > H + 100) return;
      label(ctx, text, x, y, { size, weight: o.weight || 700, font: o.font || HEAD, color: o.color || 'rgba(28,27,25,0.55)', align: 'center', track: o.track || size * 0.25, alpha: o.alpha });
    };
    if (CAM.z < 200) {
      put('INDIA', 77.8, 25.2, 64 * s);
      put('PAKISTAN', 69.2, 28.2, 54 * s);
      put('AFGHANISTAN', 66.3, 33.6, 26 * s, { alpha: 0.6 });
      put('Arabian Sea', 64.5, 21.8, 24 * s, { font: SERIF, weight: 400, track: 4, color: 'rgba(30,80,100,0.6)' });
    }
    if (CAM.z > 300) {
      put('Pakistan-administered', 73.0, 34.95, 18 * s * 0.8, { font: BODY, weight: 600, track: 1, color: 'rgba(28,27,25,0.6)' });
      put('Kashmir', 73.0, 34.8, 18 * s * 0.8, { font: BODY, weight: 600, track: 1, color: 'rgba(28,27,25,0.6)' });
      put('(India calls it Pakistan-occupied Kashmir)', 73.0, 34.66, 14 * s * 0.8, { font: BODY, weight: 500, track: 0, color: 'rgba(28,27,25,0.5)' });
      put('Jammu & Kashmir', 75.6, 33.3, 18 * s * 0.8, { font: BODY, weight: 600, track: 1, color: 'rgba(28,27,25,0.6)' });
    }
  }

  function dot(ctx, lon, lat, r, col, k = 1) {
    if (k <= 0) return;
    const [x, y] = P(lon, lat);
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x, y, (r + 3) * eBack(clamp(k)), 0, TAU);
    ctx.fill();
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(x, y, r * eBack(clamp(k)), 0, TAU);
    ctx.fill();
    ctx.restore();
  }
  function ping(ctx, lon, lat, t, col, r0 = 10) {
    const [x, y] = P(lon, lat);
    for (let i = 0; i < 2; i++) {
      const k = mod(t * 0.8 + i * 0.5, 1);
      ctx.strokeStyle = rgba(col, (1 - k) * 0.7);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, r0 + k * 36, 0, TAU);
      ctx.stroke();
    }
  }
  function placeLabel(ctx, text, lon, lat, k, o = {}) {
    if (k <= 0) return;
    const [x, y] = P(lon, lat);
    const dx = (o.side || 1) * (o.off || 18);
    ctx.save();
    ctx.globalAlpha = clamp(k);
    label(ctx, text, x + dx, y + (o.dy || 0), { size: o.size || 22, weight: 700, align: (o.side || 1) > 0 ? 'left' : 'right', box: o.box || 'rgba(255,255,255,0.85)', color: o.color || C.ink });
    ctx.restore();
  }
  /** A curved line from a to b, drawn up to k, with a bright head. */
  function arc(ctx, a, b, k, col, o = {}) {
    if (k <= 0) return;
    const [x0, y0] = P(a[0], a[1]);
    const [x1, y1] = P(b[0], b[1]);
    const mx = (x0 + x1) / 2;
    const my = (y0 + y1) / 2 - Math.hypot(x1 - x0, y1 - y0) * (o.bend || 0.3);
    const n = 40;
    const kk = clamp(k);
    ctx.save();
    ctx.strokeStyle = col;
    ctx.lineWidth = o.w || 3;
    ctx.setLineDash(o.dash || []);
    ctx.beginPath();
    let hx = x0;
    let hy = y0;
    for (let i = 0; i <= n * kk; i++) {
      const u = i / n;
      hx = (1 - u) * (1 - u) * x0 + 2 * (1 - u) * u * mx + u * u * x1;
      hy = (1 - u) * (1 - u) * y0 + 2 * (1 - u) * u * my + u * u * y1;
      if (i === 0) ctx.moveTo(hx, hy); else ctx.lineTo(hx, hy);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    if (kk < 1) {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(hx, hy, (o.w || 3) * 2, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }
  function burst(ctx, lon, lat, k, col) {
    if (k <= 0 || k >= 1) return;
    const [x, y] = P(lon, lat);
    ctx.save();
    ctx.strokeStyle = rgba(col, 1 - k);
    ctx.lineWidth = 4 * (1 - k) + 1;
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * TAU;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(a) * (8 + k * 20), y + Math.sin(a) * (8 + k * 20));
      ctx.lineTo(x + Math.cos(a) * (16 + k * 44), y + Math.sin(a) * (16 + k * 44));
      ctx.stroke();
    }
    ctx.restore();
  }

  /* ══════════════════════════════════════════════════════════════════════
     the scenes
     Each takes (ctx, local time, length).
     ══════════════════════════════════════════════════════════════════════ */

  /** A panel of paper over the map, for words to sit on. */
  function panel(ctx, x, y, w, h, k, rot = -0.01) {
    if (k <= 0) return;
    ctx.save();
    ctx.globalAlpha = clamp(k * 1.5);
    card(ctx, x + w / 2, y + h / 2 + (1 - eOut3(clamp(k))) * 40, w, h, rot, '#fbf8f1');
    ctx.restore();
  }

  function clockFace(ctx, x, y, r, hh, mm, k = 1) {
    ctx.save();
    ctx.globalAlpha = k;
    ctx.fillStyle = '#fbf8f1';
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
    ctx.stroke();
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU;
      ctx.lineWidth = i % 3 ? 3 : 6;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(a) * r * 0.78, y + Math.sin(a) * r * 0.78);
      ctx.lineTo(x + Math.cos(a) * r * 0.9, y + Math.sin(a) * r * 0.9);
      ctx.stroke();
    }
    const ah = ((hh % 12) + mm / 60) / 12 * TAU - Math.PI / 2;
    const am = (mm / 60) * TAU - Math.PI / 2;
    ctx.lineCap = 'round';
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(ah) * r * 0.5, y + Math.sin(ah) * r * 0.5);
    ctx.stroke();
    ctx.lineWidth = 6;
    ctx.strokeStyle = C.red;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(am) * r * 0.75, y + Math.sin(am) * r * 0.75);
    ctx.stroke();
    ctx.restore();
  }

  function strikeOrigin(i) {
    const [, lon, lat] = TARGETS[i];
    return [lon + 1.3 + (i % 3) * 0.25, lat - 0.9 - (i % 2) * 0.3];
  }

  // ── cold open: 1:05 in the morning
  function sOpen(ctx, t) {
    CAM = lerpCam(CAMS.region, CAMS.strikes, eInOut(prog(t, 0.5, 8)));
    baseMap(ctx, t, { labels: true });
    for (let i = 0; i < 9; i++) {
      const at = 4.6 + i * 0.22;
      const [, lon, lat] = TARGETS[i];
      dot(ctx, lon, lat, 9, C.red, prog(t, at, at + 0.3));
    }
    panel(ctx, 70, 90, 760, 540, prog(t, 0.2, 0.8));
    const m = Math.min(5, Math.floor(prog(t, 0.6, 3.2) * 5));
    clockFace(ctx, 200, 230, 90, 1, m, prog(t, 0.3, 0.8));
    label(ctx, `1:0${m} am`, 320, 230, { size: 64, font: HEAD, weight: 700, alpha: prog(t, 0.5, 1) });
    words(ctx, 'On *7 May 2025,* India fired on nine sites in Pakistan and Pakistan-administered Kashmir.', 120, 390, { t: t - 1.2, size: 38, maxW: 660, weight: 600 });
    words(ctx, 'It called the operation *Sindoor.*', 120, 580, { t: t - 6.3, size: 38, maxW: 660, weight: 600, mark: '#ffb0a0' });
  }

  // ── title
  function smear(ctx, x0, y0, len, k, seed = 1, width = 110) {
    if (k <= 0) return;
    const r = mulberry(seed);
    ctx.save();
    for (let i = 0; i < 520; i++) {
      const u = r();
      if (u > k) { r(); r(); r(); continue; }
      const x = x0 + u * len + (r() - 0.5) * 30;
      const y = y0 + (r() - 0.5) * width * (0.5 + 0.5 * Math.sin(u * Math.PI));
      const rad = 3 + r() * 16 * (1 - u * 0.5);
      ctx.fillStyle = rgba(C.sindoor, 0.1 + r() * 0.25);
      ctx.beginPath();
      ctx.arc(x, y, rad, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = C.sindoor;
    ctx.beginPath();
    ctx.moveTo(x0, y0 - 10);
    ctx.quadraticCurveTo(x0 + len * k * 0.5, y0 - width * 0.34, x0 + len * k, y0 - 4);
    ctx.quadraticCurveTo(x0 + len * k * 0.5, y0 + width * 0.3, x0, y0 + 12);
    ctx.fill();
    ctx.restore();
  }
  function sTitle(ctx, t) {
    paper(ctx);
    smear(ctx, 330, 540, 1260, eOut(prog(t, 0.2, 1.4)), 5, 170);
    label(ctx, 'OPERATION', W / 2, 400, { size: 64, font: HEAD, weight: 700, align: 'center', track: 18, alpha: prog(t, 0.6, 1.1) });
    ctx.save();
    const k = eBack(prog(t, 0.9, 1.5));
    ctx.translate(W / 2, 600);
    ctx.scale(k, k);
    label(ctx, 'SINDOOR', 0, 0, { size: 250, font: HEAD, weight: 700, align: 'center', color: C.ink, base: 'alphabetic', track: 10 });
    ctx.restore();
    words(ctx, 'How India answered the Pahalgam attack — and the four days of fighting that followed', W / 2, 740, { t: t - 2.2, size: 34, maxW: 1300, align: 'center', color: C.grey, weight: 500 });
  }

  // ── 1 · the attack
  function sPahalgam(ctx, t) {
    CAM = lerpCam(CAMS.region, CAMS.kashmir, eInOut(prog(t, 0, 3.2)));
    baseMap(ctx, t, {});
    const k = prog(t, 2.8, 3.3);
    const [px, py] = P(...PLACES.Pahalgam);
    for (const n of ['Srinagar', 'Jammu', 'Poonch', 'Muzaffarabad', 'Islamabad']) {
      const [lon, lat] = PLACES[n];
      dot(ctx, lon, lat, 6, C.ink, prog(t, 3, 3.4));
      placeLabel(ctx, n, lon, lat, prog(t, 3.1, 3.5), { size: 20, side: n === 'Muzaffarabad' || n === 'Islamabad' ? -1 : 1, box: 'rgba(255,255,255,0.7)' });
    }
    if (k > 0) {
      ping(ctx, 75.32, 34.01, t, C.red, 14);
      dot(ctx, 75.32, 34.01, 12, C.red, k);
      placeLabel(ctx, 'Pahalgam', 75.32, 34.01, k, { size: 30, box: C.yellow });
      icon(ctx, 'meadow', px + 60, py - 90, 90 * eBack(prog(t, 3.2, 3.8)), C.teal);
    }
    const [lx, ly] = P(74.2, 34.55);
    label(ctx, 'LINE OF CONTROL', lx, ly, { size: 20, weight: 800, color: '#8c2a1c', track: 3, align: 'center', alpha: prog(t, 3.5, 4), halo: 'rgba(255,255,255,0.8)' });
    panel(ctx, 70, 700, 1000, 290, prog(t, 4, 4.6));
    words(ctx, '*22 April 2025.* Baisaran, a meadow above Pahalgam that visitors reach on foot or by pony.', 110, 780, { t: t - 4.5, size: 36, maxW: 920, weight: 600 });
    words(ctx, 'In the early afternoon, gunmen came out of the pine forest around it.', 110, 920, { t: t - 7.2, size: 30, maxW: 920, weight: 500, color: C.grey });
  }

  function sCount(ctx, t) {
    paper(ctx);
    bigNumber(ctx, 26, 140, 400, prog(t, 0.2, 1.6), { size: 300 });
    words(ctx, 'people were killed: *25 tourists,* and a local pony handler, Syed Adil Hussain Shah, who tried to wrestle a gun from one of the attackers.', 620, 250, { t: t - 1.2, size: 38, maxW: 1150, weight: 600 });
    words(ctx, 'Survivors said the gunmen *asked people their religion* before they shot, and that they singled out men.', 620, 520, { t: t - 4.6, size: 34, maxW: 1150, weight: 500 });
    // a candle for each of them
    for (let i = 0; i < 26; i++) {
      const at = 1.8 + i * 0.09;
      const k = prog(t, at, at + 0.3);
      if (k <= 0) continue;
      ctx.save();
      ctx.globalAlpha = k;
      icon(ctx, 'candle', 250 + (i % 13) * 118, 790 + Math.floor(i / 13) * 150, 100, '#3a342c');
      ctx.restore();
    }
  }

  function sClaim(ctx, t) {
    paper(ctx, C.paper2);
    const cards = [
      [520, 300, -0.035, 0.2, 'A group calling itself *The Resistance Front* claimed the attack — then withdrew the claim.'],
      [1330, 470, 0.03, 2.4, 'India says TRF is a front for *Lashkar-e-Taiba,* a banned militant group based in Pakistan.'],
      [720, 760, -0.015, 4.6, 'Pakistan *denied any role,* and offered to join a neutral investigation.'],
    ];
    for (const [x, y, rot, at, text] of cards) {
      const k = prog(t, at, at + 0.5);
      if (k <= 0) continue;
      ctx.save();
      ctx.globalAlpha = clamp(k * 2);
      card(ctx, x, y + (1 - eOut3(k)) * 50, 820, 230, rot, '#fdfbf6', { tape: true, draw: (c) => words(c, text, -370, -40, { t: t - at - 0.3, size: 34, maxW: 740, weight: 600 }) });
      ctx.restore();
    }
  }

  // ── 2 · the squeeze
  function iconRow(ctx, t, items, header, sub, col) {
    paper(ctx);
    label(ctx, header, 140, 170, { size: 70, font: HEAD, weight: 700, base: 'alphabetic', alpha: prog(t, 0, 0.4) });
    ctx.fillStyle = col;
    ctx.fillRect(140, 190, 380 * eOut(prog(t, 0.2, 0.8)), 8);
    label(ctx, sub, 140, 250, { size: 28, color: C.grey, weight: 500, alpha: prog(t, 0.4, 0.9) });
    items.forEach(([kind, text, at, strike], i) => {
      const x = 140 + i * 420;
      const k = prog(t, at, at + 0.45);
      if (k <= 0) return;
      ctx.save();
      ctx.globalAlpha = clamp(k * 2);
      card(ctx, x + 180, 520, 360, 300, (i % 2 ? 1 : -1) * 0.02, '#fbf8f1');
      icon(ctx, kind, x + 180, 500, 150 * eBack(k), col);
      if (strike) struck(ctx, x + 180, 500, 150, prog(t, at + 0.4, at + 0.8));
      ctx.restore();
      words(ctx, text, x + 10, 740, { t: t - at - 0.2, size: 28, maxW: 350, weight: 600 });
    });
  }
  function sIndiaSteps(ctx, t) {
    iconRow(ctx, t, [
      ['water', 'The *Indus Waters Treaty* put “in abeyance”', 0.8],
      ['gate', 'The Attari–Wagah border crossing *closed*', 2.6],
      ['passport', 'Visas for Pakistani nationals *cancelled*', 4.4],
      ['person', 'Military advisers expelled; missions cut to *30 staff*', 6.2],
    ], 'INDIA, 23 APRIL', 'The first answer was diplomatic.', C.teal);
  }
  function sPakSteps(ctx, t) {
    iconRow(ctx, t, [
      ['plane', 'Airspace *closed* to Indian airlines', 0.6, true],
      ['crate', 'All trade with India *suspended*', 1.8, true],
      ['doc', 'Said it could suspend the *1972 Simla Agreement*', 3.0],
      ['water', 'Stopping its water would be *“an act of war”*', 4.2],
    ], 'PAKISTAN, 24 APRIL', 'Pakistan answered in kind.', C.navy);
    words(ctx, 'For the next two weeks, the two armies exchanged fire across the Line of Control *almost every night.*', 140, 960, { t: t - 5.2, size: 30, maxW: 1640, weight: 600, color: C.grey });
  }

  // ── 3 · the strikes
  function sStrikes(ctx, t) {
    CAM = lerpCam(CAMS.region, CAMS.strikes, eInOut(prog(t, 0, 1.6)));
    baseMap(ctx, t, {});
    for (let i = 0; i < 9; i++) {
      const at = 1.6 + i * 0.95;
      const [name, lon, lat, grp, side] = TARGETS[i];
      const o = strikeOrigin(i);
      const kArc = prog(t, at, at + 0.7);
      arc(ctx, o, [lon, lat], kArc, C.red, { w: 3, bend: 0.35, dash: [2, 8] });
      const hit = prog(t, at + 0.7, at + 0.9);
      burst(ctx, lon, lat, prog(t, at + 0.7, at + 1.5), C.red);
      dot(ctx, lon, lat, 10, C.red, hit);
      placeLabel(ctx, `${name} · ${grp}`, lon, lat, prog(t, at + 0.8, at + 1.1), { size: 20, side, box: 'rgba(255,255,255,0.9)' });
    }
    // the clock in the corner
    panel(ctx, 60, 60, 560, 170, prog(t, 0.4, 0.9));
    const mins = Math.round(5 + 25 * prog(t, 1.6, 10.2));
    label(ctx, `7 MAY · 01:${String(mins).padStart(2, '0')} IST`, 100, 145, { size: 56, font: HEAD, weight: 700, alpha: prog(t, 0.6, 1) });
    // the legend
    panel(ctx, 1330, 60, 530, 200, prog(t, 1, 1.5), 0.01);
    ctx.save();
    ctx.globalAlpha = prog(t, 1.2, 1.7);
    label(ctx, 'JeM  Jaish-e-Mohammed', 1370, 115, { size: 22, weight: 600 });
    label(ctx, 'LeT  Lashkar-e-Taiba', 1370, 155, { size: 22, weight: 600 });
    label(ctx, 'HM   Hizbul Mujahideen', 1370, 195, { size: 22, weight: 600 });
    label(ctx, 'groups India said used each site', 1370, 232, { size: 17, weight: 500, color: C.grey });
    ctx.restore();
    const k = prog(t, 11, 11.6);
    panel(ctx, 60, 730, 900, 260, k);
    if (k > 0) {
      bigNumber(ctx, 9, 110, 930, prog(t, 11.2, 12), { size: 190, color: C.red });
      label(ctx, 'sites', 230, 910, { size: 44, weight: 700, font: HEAD, alpha: prog(t, 11.6, 12), base: 'alphabetic' });
      bigNumber(ctx, 25, 430, 930, prog(t, 11.6, 12.6), { size: 190 });
      label(ctx, 'minutes', 640, 910, { size: 44, weight: 700, font: HEAD, alpha: prog(t, 12.2, 12.6), base: 'alphabetic' });
      words(ctx, 'Army, Air Force and Navy, planned together.', 110, 970, { t: t - 12.8, size: 26, maxW: 820, color: C.grey, weight: 600 });
    }
  }

  function sDepth(ctx, t) {
    CAM = lerpCam(CAMS.strikes, CAMS.deep, eInOut(prog(t, 0, 1.4)));
    baseMap(ctx, t, {});
    for (let i = 0; i < 9; i++) dot(ctx, TARGETS[i][1], TARGETS[i][2], 9, C.red, 1);
    // a ruler from the border to Bahawalpur
    const a = [73.28, 29.6];
    const b = [71.68, 29.39];
    const k = eOut(prog(t, 1.2, 2.6));
    const [x0, y0] = P(...a);
    const [x1, y1] = P(...b);
    ctx.save();
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 4;
    ctx.setLineDash([14, 8]);
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(lerp(x0, x1, k), lerp(y0, y1, k));
    ctx.stroke();
    ctx.restore();
    placeLabel(ctx, 'Bahawalpur', 71.68, 29.39, prog(t, 1.4, 1.8), { size: 26, side: -1, box: C.yellow });
    label(ctx, 'about 100 km inside Pakistan', (x0 + x1) / 2, (y0 + y1) / 2 - 36, { size: 28, weight: 700, align: 'center', alpha: prog(t, 2.4, 2.9), box: 'rgba(255,255,255,0.9)' });
    placeLabel(ctx, 'Muridke', 74.26, 31.8, prog(t, 2.2, 2.6), { size: 26, side: -1, box: C.yellow });
    dot(ctx, 74.35, 31.55, 6, C.ink, prog(t, 2.4, 2.8));
    placeLabel(ctx, 'Lahore', 74.35, 31.55, prog(t, 2.5, 2.9), { size: 22, dy: 22 });
    panel(ctx, 1080, 640, 780, 330, prog(t, 3.4, 4));
    words(ctx, 'These were in *Punjab,* Pakistan’s most populous province. Reports called them India’s *deepest strikes* into Pakistan since the war of 1971.', 1120, 720, { t: t - 3.9, size: 32, maxW: 700, weight: 600 });
  }

  function sLadder(ctx, t) {
    paper(ctx);
    label(ctx, 'Each answer has gone further', 140, 170, { size: 70, font: HEAD, weight: 700, base: 'alphabetic', alpha: prog(t, 0, 0.4) });
    const steps = [
      ['2016', 'Uri: an army base is attacked', '“Surgical strikes”: ground raids just across the Line of Control', C.teal],
      ['2019', 'Pulwama: a convoy is bombed', 'An air strike at Balakot, in Khyber Pakhtunkhwa', C.navy],
      ['2025', 'Pahalgam: tourists are shot', 'Missiles and bombs on nine sites, deep into Punjab', C.red],
    ];
    steps.forEach(([year, cause, answer, col], i) => {
      const at = 0.6 + i * 1.5;
      const k = eOut3(prog(t, at, at + 0.6));
      if (k <= 0) return;
      const x = 160 + i * 560;
      const h = 190 + i * 150;
      const base = 960;
      ctx.fillStyle = col;
      ctx.fillRect(x, base - h * k, 480, h * k);
      ctx.save();
      ctx.globalAlpha = prog(t, at + 0.3, at + 0.7);
      label(ctx, year, x + 24, base - h * k + 70, { size: 64, font: HEAD, weight: 700, color: '#ffffff', base: 'alphabetic' });
      ctx.restore();
      words(ctx, cause, x, base - h - 150, { t: t - at - 0.3, size: 26, maxW: 470, weight: 500, color: C.grey });
      words(ctx, answer, x, base - h - 100, { t: t - at - 0.6, size: 28, maxW: 470, weight: 700 });
    });
  }

  function sName(ctx, t) {
    paper(ctx);
    smear(ctx, 240, 300, 1440, eOut(prog(t, 0.1, 1.2)), 9, 90);
    words(ctx, '*Sindoor* is the vermilion many married Hindu women wear in the parting of their hair.', W / 2, 520, { t: t - 1, size: 50, maxW: 1400, align: 'center', weight: 600, mark: '#ffb8a8' });
    words(ctx, 'India’s government said the name was for the women widowed at Pahalgam.', W / 2, 720, { t: t - 4.2, size: 38, maxW: 1400, align: 'center', weight: 500, color: C.grey });
  }

  function sClaims(ctx, t) {
    paper(ctx, C.paper2);
    const cols = [
      [120, 'INDIA SAID', C.teal, [
        '*“Focused, measured and non-escalatory.”*',
        'The targets were camps of JeM, LeT and Hizbul Mujahideen.',
        '“No Pakistani military facilities have been targeted.”',
      ]],
      [1000, 'PAKISTAN SAID', C.navy, [
        'The strikes *killed civilians,* including children, and hit mosques.',
        'It had *shot down Indian jets.*',
        'It would answer at a time of its choosing.',
      ]],
    ];
    for (const [x, head, col, lines] of cols) {
      const k = prog(t, x > 500 ? 0.5 : 0, (x > 500 ? 0.5 : 0) + 0.4);
      ctx.fillStyle = col;
      ctx.fillRect(x, 110, 800 * eOut(k), 90);
      label(ctx, head, x + 30, 157, { size: 48, font: HEAD, weight: 700, color: '#ffffff', alpha: k, track: 4 });
      let y = 290;
      lines.forEach((ln, i) => {
        const at = 0.8 + i * 1.5 + (x > 500 ? 0.7 : 0);
        y += words(ctx, ln, x + 20, y, { t: t - at, size: 32, maxW: 760, weight: 600 }) + 30;
      });
    }
    words(ctx, 'The briefing in Delhi was given by Foreign Secretary Vikram Misri, with Colonel Sofiya Qureshi of the Army and Wing Commander Vyomika Singh of the Air Force.', 120, 900, { t: t - 5.5, size: 26, maxW: 1680, weight: 500, color: C.grey });
  }

  // ── 4 · four days
  function dayTicker(ctx, t, day) {
    const days = ['7 MAY', '8 MAY', '9 MAY', '10 MAY'];
    ctx.save();
    ctx.fillStyle = 'rgba(251,248,241,0.94)';
    ctx.fillRect(0, 0, W, 90);
    days.forEach((d, i) => {
      const x = 360 + i * 360;
      const on = i === day;
      label(ctx, d, x, 48, { size: on ? 40 : 30, font: HEAD, weight: 700, align: 'center', color: on ? C.ink : 'rgba(28,27,25,0.35)' });
      if (on) { ctx.fillStyle = C.red; ctx.fillRect(x - 70, 76, 140, 6); }
    });
    ctx.restore();
  }
  function caption(ctx, text, t, at) {
    panel(ctx, 60, 810, 1200, 200, prog(t, at, at + 0.3), 0);
    words(ctx, text, 100, 880, { t: t - at - 0.2, size: 32, maxW: 1120, weight: 600 });
  }
  function sFour(ctx, t) {
    CAM = CAMS.four;
    baseMap(ctx, t, {});
    for (let i = 0; i < 9; i++) dot(ctx, TARGETS[i][1], TARGETS[i][2], 6, 'rgba(211,36,28,0.5)', 1);
    let day = 0;
    if (t < 4) {
      // shelling along the Line of Control
      for (let i = 0; i < 16; i++) {
        const [lon, lat] = LOC[Math.floor(hash(i * 3.3) * (LOC.length - 1))];
        const f = mod(t * 1.3 + hash(i), 1);
        const [x, y] = P(lon + 0.15, lat + (hash(i) - 0.5) * 0.2);
        ctx.fillStyle = rgba('#ff7a1a', (1 - f) * 0.9);
        ctx.beginPath();
        ctx.arc(x, y, 4 + f * 14, 0, TAU);
        ctx.fill();
      }
      ping(ctx, ...PLACES.Poonch, t, C.red, 8);
      placeLabel(ctx, 'Poonch', ...PLACES.Poonch, prog(t, 0.4, 0.8), { size: 22, box: C.yellow });
      caption(ctx, 'Pakistani shelling along the Line of Control. The town of *Poonch* was hit hardest, and civilians were killed.', t, 0.3);
    } else if (t < 9) {
      day = 0;
      const u = t - 4;
      INDIA_SITES.forEach(([name, lon, lat], i) => {
        const at = 0.3 + i * 0.12;
        const from = [lon - 2.2, lat + 0.4];
        const k = prog(u, at, at + 0.9);
        arc(ctx, from, [lon - 0.25, lat], k, C.navy, { w: 2.5, bend: 0.2 });
        burst(ctx, lon - 0.25, lat, prog(u, at + 0.9, at + 1.5), C.blue);
        dot(ctx, lon, lat, 7, C.blue, prog(u, at + 0.8, at + 1));
        if (i % 3 === 0 || i === 14) placeLabel(ctx, name, lon, lat, prog(u, at + 1, at + 1.3), { size: 17 });
      });
      label(ctx, 'NIGHT OF 7–8 MAY', 70, 140, { size: 30, font: HEAD, weight: 700, box: C.yellow });
      caption(ctx, 'India says Pakistan sent drones and missiles at *15 military sites,* from Srinagar to Bhuj — and that its air defences stopped them.', t, 4.2);
    } else if (t < 12) {
      day = 1;
      const [x, y] = P(...PLACES.Lahore);
      icon(ctx, 'radar', x - 60, y - 40, 80 * eBack(prog(t, 9.2, 9.7)), C.navy);
      dot(ctx, ...PLACES.Lahore, 9, C.red, prog(t, 9.6, 9.9));
      burst(ctx, ...PLACES.Lahore, prog(t, 9.8, 10.6), C.red);
      placeLabel(ctx, 'Lahore', ...PLACES.Lahore, prog(t, 9.5, 9.9), { size: 22, box: C.yellow });
      INDIA_SITES.forEach(([, lon, lat]) => dot(ctx, lon, lat, 5, C.blue, 1));
      caption(ctx, 'India says it disabled Pakistani *air-defence radars,* including one at Lahore.', t, 9.1);
    } else if (t < 15) {
      day = 2;
      // drones up and down the border, and the lights going out behind it
      for (let i = 0; i < 40; i++) {
        const [lon, lat] = IB[Math.floor(hash(i * 1.7) * (IB.length - 1))];
        const wob = Math.sin(t * 3 + i) * 0.1;
        const [x, y] = P(lon + 0.25 + wob, lat + (hash(i * 3) - 0.5) * 0.3);
        icon(ctx, 'drone', x, y, 36, 'rgba(30,42,68,0.8)');
      }
      INDIA_SITES.forEach(([, lon, lat]) => dot(ctx, lon, lat, 5, C.blue, 1));
      caption(ctx, 'India says *hundreds of drones* came over the border on 8 and 9 May. Towns along it were blacked out at night.', t, 12.1);
    } else {
      day = 3;
      const u = t - 15;
      AIRBASES.forEach(([name, lon, lat], i) => {
        const at = 0.8 + i * 0.45;
        const from = [lon + 3 + (i % 2) * 0.5, lat - 1.2];
        arc(ctx, from, [lon, lat], prog(u, at, at + 0.8), C.red, { w: 3, bend: 0.3, dash: [2, 8] });
        burst(ctx, lon, lat, prog(u, at + 0.8, at + 1.6), C.red);
        dot(ctx, lon, lat, 9, C.red, prog(u, at + 0.8, at + 1));
        const [x, y] = P(lon, lat);
        if (u > at + 0.8) icon(ctx, 'jet', x, y - 32, 30, C.navy);
        placeLabel(ctx, name, lon, lat, prog(u, at + 1, at + 1.3), { size: 19, side: i === 3 ? 1 : -1, dy: 0 });
      });
      label(ctx, 'EARLY 10 MAY', 70, 140, { size: 30, font: HEAD, weight: 700, box: C.yellow });
      caption(ctx, 'Pakistan launched what it called *Operation Bunyan-um-Marsoos.* India says it answered by striking Pakistani *air bases.*', t, 15.1);
    }
    dayTicker(ctx, t, day);
  }

  function sNuke(ctx, t) {
    paper(ctx);
    for (const [x, at, name] of [[560, 0.3, 'INDIA'], [1360, 0.7, 'PAKISTAN']]) {
      const k = eBack(prog(t, at, at + 0.5));
      ctx.fillStyle = name === 'INDIA' ? C.india : C.pak;
      ctx.beginPath();
      ctx.arc(x, 380, 190 * k, 0, TAU);
      ctx.fill();
      icon(ctx, 'atom', x, 380, 200 * k, C.ink);
      label(ctx, name, x, 620, { size: 50, font: HEAD, weight: 700, align: 'center', track: 6, alpha: prog(t, at + 0.3, at + 0.7) });
    }
    words(ctx, 'Both have nuclear weapons — about *170 warheads* each, by independent estimates.', W / 2, 760, { t: t - 1.4, size: 36, maxW: 1500, align: 'center', weight: 600 });
    words(ctx, 'India has promised never to use them first. Pakistan has made no such promise.', W / 2, 860, { t: t - 3.4, size: 32, maxW: 1500, align: 'center', weight: 500, color: C.grey });
  }

  // ── 5 · the ceasefire
  function sCease(ctx, t) {
    paper(ctx);
    const ring = t < 2.4 ? Math.sin(t * 40) * 0.08 * (Math.floor(t * 2.5) % 2) : 0;
    ctx.save();
    ctx.translate(330, 330);
    ctx.rotate(ring);
    icon(ctx, 'phone', 0, 0, 220 * eBack(prog(t, 0, 0.5)), C.ink);
    ctx.restore();
    words(ctx, '*10 May, 3:35 pm.* Pakistan’s Director General of Military Operations called his Indian counterpart.', 600, 260, { t: t - 0.6, size: 38, maxW: 1150, weight: 600 });
    clockFace(ctx, 330, 700, 130, 5, 0, prog(t, 3.2, 3.7));
    words(ctx, 'From *5 pm,* both sides agreed to stop all firing and military action — on land, in the air and at sea.', 600, 640, { t: t - 3.6, size: 36, maxW: 1150, weight: 600 });
    panel(ctx, 600, 820, 1200, 190, prog(t, 7, 7.5), 0.01);
    words(ctx, 'US President Donald Trump announced it first, saying the US had brokered it. India said the two militaries *agreed it directly.*', 640, 890, { t: t - 7.4, size: 30, maxW: 1120, weight: 600 });
  }

  // ── 6 · what changed
  function sAfter(ctx, t) {
    paper(ctx, C.paper2);
    const cards = [
      [560, 290, -0.02, 0.2, 'India’s military said more than *100 militants* were killed in the first night’s strikes.'],
      [1360, 330, 0.025, 2.2, 'Pakistan disputes India’s figures. In late May, India’s defence chief acknowledged *losing aircraft,* without saying how many.'],
    ];
    for (const [x, y, rot, at, text] of cards) {
      const k = prog(t, at, at + 0.5);
      if (k <= 0) continue;
      ctx.save();
      ctx.globalAlpha = clamp(k * 2);
      card(ctx, x, y + (1 - eOut3(k)) * 50, 740, 280, rot, '#fdfbf6', { tape: true, draw: (c) => words(c, text, -330, -60, { t: t - at - 0.3, size: 32, maxW: 660, weight: 600 }) });
      ctx.restore();
    }
    const k = prog(t, 5.2, 5.7);
    if (k > 0) {
      ctx.save();
      ctx.globalAlpha = clamp(k * 2);
      card(ctx, W / 2, 780, 1300, 330, 0, C.ink, {
        draw: (c) => {
          label(c, 'NARENDRA MODI, PRIME MINISTER OF INDIA · 12 MAY', -590, -110, { size: 22, weight: 700, color: C.yellow, track: 3 });
          words(c, '“Terror and talks cannot go together.”', -590, -20, { t: t - 5.8, size: 50, maxW: 1200, weight: 600, color: '#fbf8f1', font: SERIF });
          words(c, '“Water and blood cannot flow together.”', -590, 70, { t: t - 7.4, size: 50, maxW: 1200, weight: 600, color: '#fbf8f1', font: SERIF });
        },
      });
      ctx.restore();
    }
  }

  function sClose(ctx, t) {
    paper(ctx);
    // a line, drawn across, and a marker placed on it
    const k = eOut(prog(t, 0.2, 1.4));
    ctx.fillStyle = C.ink;
    ctx.fillRect(160, 560, 1600 * k, 6);
    for (const [x, name, at] of [[420, '2016', 1], [860, '2019', 1.3], [1300, '2025', 1.6]]) {
      const kk = prog(t, at, at + 0.4);
      ctx.fillStyle = rgba(C.ink, kk);
      ctx.fillRect(x - 3, 540, 6, 46);
      label(ctx, name, x, 620, { size: 32, font: HEAD, weight: 700, align: 'center', alpha: kk });
    }
    const m = eBack(prog(t, 2.4, 3));
    ctx.save();
    ctx.translate(1580, 530);
    ctx.scale(m, m);
    ctx.fillStyle = C.red;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-24, -44);
    ctx.lineTo(24, -44);
    ctx.fill();
    ctx.restore();
    label(ctx, 'the new threshold', 1580, 440, { size: 26, weight: 700, align: 'center', color: C.red, alpha: prog(t, 2.8, 3.2) });
    words(ctx, 'India now says it will treat a future terror attack as *an act of war.*', W / 2, 250, { t: t - 0.6, size: 46, maxW: 1500, align: 'center', weight: 600 });
    words(ctx, 'That moves the line, and both sides now know where it is. What neither can know is what happens the next time someone crosses it.', W / 2, 780, { t: t - 3.6, size: 36, maxW: 1400, align: 'center', weight: 500, color: C.grey });
  }

  function sEnd(ctx, t) {
    paper(ctx);
    label(ctx, 'SOURCES', 160, 250, { size: 44, font: HEAD, weight: 700, alpha: prog(t, 0, 0.4), track: 6 });
    ctx.fillStyle = C.yellow;
    ctx.fillRect(160, 280, 240 * eOut(prog(t, 0.1, 0.6)), 8);
    const lines = [
      'Statements and briefings by India’s Ministry of External Affairs, Ministry of Defence and armed forces, 23 April – 12 May 2025.',
      'Statements by Pakistan’s National Security Committee and its military’s press wing (ISPR), over the same weeks.',
      'Contemporaneous news reporting. Where the two governments disagree, this film says who claimed what.',
      'Map: Natural Earth. Boundaries are schematic and not authoritative; Kashmir is shown by who administers each side of the Line of Control.',
    ];
    let y = 380;
    lines.forEach((ln, i) => { y += words(ctx, ln, 160, y, { t: t - 0.4 - i * 0.5, size: 28, maxW: 1600, weight: 500, rate: 60 }) + 24; });
    label(ctx, 'Animated and scored in code on this page: no footage, no stock, no samples.', 160, 960, { size: 24, weight: 600, color: C.grey, alpha: prog(t, 2.5, 3) });
  }

  /* ══════════════════════════════════════════════════════════════════════
     the cut
     ══════════════════════════════════════════════════════════════════════ */

  const ch = (n, title, col) => (ctx, t, T) => { paper(ctx); chapter(ctx, t, T, n, title, col); };
  const SHOTS = [
    [0, 9, sOpen],
    [9, 16, sTitle],
    [16, 19, ch(1, 'The attack', C.yellow)],
    [19, 29, sPahalgam],
    [29, 38, sCount],
    [38, 46, sClaim],
    [46, 49, ch(2, 'The squeeze', '#9fd3c7')],
    [49, 60, sIndiaSteps],
    [60, 67, sPakSteps],
    [67, 70, ch(3, 'The strikes', '#ff8f7a')],
    [70, 86, sStrikes],
    [86, 94, sDepth],
    [94, 100, sLadder],
    [100, 108, sName],
    [108, 116, sClaims],
    [116, 119, ch(4, 'Four days', C.yellow)],
    [119, 140, sFour],
    [140, 146, sNuke],
    [146, 149, ch(5, 'The ceasefire', '#9fd3c7')],
    [149, 160, sCease],
    [160, 163, ch(6, 'What changed', '#ff8f7a')],
    [163, 175, sAfter],
    [175, 184, sClose],
    [184, 190, sEnd],
  ];

  function frame(ctx, t) {
    t = clamp(t, 0, DURATION - 0.001);
    let shot = SHOTS[SHOTS.length - 1];
    for (const s of SHOTS) if (t >= s[0] && t < s[1]) { shot = s; break; }
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, W, H);
    ctx.clip();
    ctx.save();
    shot[2](ctx, t - shot[0], shot[1] - shot[0]);
    ctx.restore();
    grain(ctx, t);
    // a soft darkening at the corners, the way paper looks under a lamp
    const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.5, W / 2, H / 2, H * 1.1);
    v.addColorStop(0, 'rgba(60,40,20,0)');
    v.addColorStop(1, 'rgba(60,40,20,0.22)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, W, H);
    const fade = Math.max(1 - prog(t, 0, 0.6), prog(t, DURATION - 1.2, DURATION - 0.1));
    if (fade > 0) {
      ctx.fillStyle = rgba('#000000', fade);
      ctx.fillRect(0, 0, W, H);
    }
    ctx.restore();
  }

  /* ══════════════════════════════════════════════════════════════════════
     the score — original, synthesised here
     A quiet electronic bed of the kind explainers run under their narration:
     plucked arpeggios, a soft pad, a lo-fi beat that comes and goes, and a
     few sounds for the graphics — pops, ticks, whooshes. It stays out of the
     way of the words, and it stops for the dead.
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
  const SAW = table(Array.from({ length: 24 }, (_, h) => 1 / (h + 1)));
  const SQR = table(Array.from({ length: 16 }, (_, h) => (h % 2 ? 0 : 1 / (h + 1))));

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
    const lowpass = (k) => { let y = 0; return (x) => (y += k * (x - y)); };
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

    const pluck = (t0, m, vel = 1, pan = 0, dec = 5) => {
      const o = osc(SQR);
      const f = m2f(m);
      const lp = lowpass(0.25);
      voice(t0, 1.2, (u) => lp(o(f)) * Math.exp(-u * dec) * Math.min(1, u / 0.003), 0.06 * vel, pan, 0.4);
    };
    const piano = (t0, m, vel = 1, pan = 0) => {
      const f = m2f(m);
      voice(t0, 3.5, (u) => {
        const e = Math.exp(-u * 1.3) * Math.min(1, u / 0.004);
        return (Math.sin(TAU * f * u) + 0.35 * Math.sin(TAU * f * 2.001 * u) * Math.exp(-u * 2) + 0.12 * Math.sin(TAU * f * 3.003 * u) * Math.exp(-u * 3)) * e;
      }, 0.09 * vel, pan, 0.6);
    };
    const pad = (t0, dur, ms, gain = 1, bright = 0.04) => {
      for (const m of ms) {
        const o1 = osc(SAW);
        const o2 = osc(SAW);
        const f = m2f(m);
        const lp = lowpass(bright);
        const lp2 = lowpass(bright);
        voice(t0, dur + 1.5, (u) => {
          const env = Math.min(1, u / 1.2) * (u > dur ? Math.max(0, 1 - (u - dur) / 1.5) : 1);
          return lp2(lp((o1(f * 1.004) + o2(f * 0.996)) * 0.5)) * env;
        }, 0.06 * gain, (m % 3 - 1) * 0.35, 0.6);
      }
    };
    const sub = (t0, dur, m, gain = 1) => {
      const f = m2f(m);
      voice(t0, dur, (u) => Math.sin(TAU * f * u) * Math.min(1, u / 0.02, (dur - u) / 0.05), 0.16 * gain, 0, 0);
    };
    const kick = (t0, vel = 1) => voice(t0, 0.5, (u) => Math.sin(TAU * (48 + 90 * Math.exp(-u * 30)) * u) * Math.exp(-u * 7), 0.45 * vel, 0, 0.05);
    const snare = (t0, vel = 1) => {
      const nz = noise();
      const lp = lowpass(0.35);
      voice(t0, 0.3, (u) => (lp(nz()) * 1.2 + Math.sin(TAU * 190 * u) * 0.4) * Math.exp(-u * 16), 0.22 * vel, 0.05, 0.25);
    };
    const hat = (t0, vel = 1) => {
      const nz = noise();
      const lp = lowpass(0.6);
      voice(t0, 0.08, (u) => { const n = nz(); return (n - lp(n)) * Math.exp(-u * 60); }, 0.12 * vel, 0.3, 0.05);
    };
    const tick = (t0, vel = 1) => voice(t0, 0.05, (u) => Math.sin(TAU * 2400 * u) * Math.exp(-u * 120), 0.06 * vel, -0.3, 0.1);
    const pop = (t0, vel = 1, pan = 0) => voice(t0, 0.2, (u) => Math.sin(TAU * (700 - 400 * Math.min(1, u * 20)) * u) * Math.exp(-u * 30), 0.12 * vel, pan, 0.2);
    const whoosh = (t0, dur, gain = 1) => {
      const nz = noise();
      const bp = bandpass();
      voice(t0, dur, (u) => { const k = u / dur; return bp(nz(), 500 + 3000 * Math.sin(Math.PI * k), 0.5) * Math.sin(Math.PI * k) * 1.4; }, 0.18 * gain, 0, 0.3);
    };
    const thud = (t0, gain = 1) => {
      const nz = noise();
      const lp = lowpass(0.02);
      voice(t0, 1.6, (u) => (Math.sin(TAU * (40 + 50 * Math.exp(-u * 8)) * u) * Math.exp(-u * 3) + lp(nz()) * 2.5 * Math.exp(-u * 2.5)) * Math.min(1, u / 0.004), 0.35 * gain, 0, 0.3);
    };
    const riser = (t0, dur, gain = 1) => {
      const nz = noise();
      const bp = bandpass();
      voice(t0, dur, (u) => { const k = u / dur; return bp(nz(), 300 * Math.pow(10, k), 0.4) * k * k * 1.4; }, 0.2 * gain, 0, 0.4);
    };
    const ring = (t0, n = 3) => {
      for (let i = 0; i < n; i++) {
        voice(t0 + i * 0.8, 0.5, (u) => (Math.sin(TAU * 440 * u) + Math.sin(TAU * 480 * u)) * (Math.floor(u * 25) % 2) * Math.min(1, (0.5 - u) / 0.05), 0.04, 0.2, 0.2);
      }
    };
    /** A two-bar lo-fi pattern at `bpm`, from t0 to t1. */
    const beat = (t0, t1, bpm, vel = 1, hats = true) => {
      const b = 60 / bpm;
      for (let t = t0, i = 0; t < t1 - 0.01; t += b / 2, i++) {
        const s = i % 16;
        if (s === 0 || s === 7 || s === 10) kick(t, vel);
        if (s === 4 || s === 12) snare(t, vel);
        if (hats) hat(t + (i % 2 ? 0.012 : 0), (i % 2 ? 0.6 : 1) * vel);
      }
    };
    const arp = (t0, t1, bpm, chords, vel = 1, oct = 0) => {
      const step = 60 / bpm / 2;
      const bar = step * 8;
      for (let t = t0, i = 0; t < t1 - 0.01; t += step, i++) {
        const c = chords[Math.floor((t - t0) / bar) % chords.length];
        const m = c[[0, 1, 2, 1, 3, 2, 1, 2][i % 8] % c.length] + oct;
        pluck(t, m, vel * (i % 2 ? 0.7 : 1), (i % 4) / 2 - 0.75);
      }
    };
    const progression = (t0, t1, bpm, chords, gain = 0.8, low = 0.6) => {
      const bar = (60 / bpm) * 4;
      let i = 0;
      for (let t = t0; t < t1 - 0.01; t += bar, i++) {
        const c = chords[i % chords.length];
        const d = Math.min(bar, t1 - t);
        pad(t, d, c.map((m) => m - 12), gain);
        if (low) sub(t, d, c[0] - 24, low);
      }
    };
    // A minor, mostly: Am – F – C – G, and darker turns for the fighting
    const AM = [[57, 60, 64, 67], [53, 57, 60, 64], [48, 52, 55, 60], [55, 59, 62, 67]];
    const DARK = [[57, 60, 64], [58, 62, 65], [57, 60, 64], [56, 60, 63]];
    const SAD = [[57, 60, 64], [53, 57, 60], [50, 53, 57], [52, 56, 59]];
    const HOPE = [[48, 52, 55, 60], [53, 57, 60, 65], [45, 48, 52, 57], [55, 59, 62, 67]];
    const BPM = 92;

    // cold open: a clock, a pulse, and nine pops
    for (let i = 0; i < 16; i++) tick(0.6 + i * 0.5);
    pad(0.3, 8.5, [45, 52, 57], 0.7, 0.03);
    for (let i = 0; i < 9; i++) pop(4.6 + i * 0.22, 1, (i / 4) - 1);
    // title
    thud(9.2, 0.8);
    whoosh(8.9, 0.6, 1);
    progression(9.2, 16, BPM, AM, 0.7);
    arp(9.2, 16, BPM, AM, 0.8, 12);
    // 1 · the attack: the beat stops; a piano, slowly
    whoosh(15.8, 0.5, 1);
    progression(16.2, 46, 70, SAD, 0.4, 0);
    const somber = [[16.5, 69], [18.2, 72], [19.9, 71], [21.6, 67], [23.4, 69], [25.1, 64], [26.8, 65], [28.5, 64],
      [30.4, 69], [32.1, 72], [33.8, 76], [35.5, 74], [37.2, 72], [39.4, 71], [41.1, 69], [42.8, 68], [44.5, 69]];
    for (const [t, m] of somber) piano(t, m, 0.9, 0.1);
    pop(22.2, 1.2);
    for (let i = 0; i < 26; i++) piano(30.8 + i * 0.09, 81 + (i % 3) * 3, 0.12, (i % 2) - 0.5);
    for (const t of [38.2, 40.4, 42.6]) whoosh(t, 0.4, 0.5);
    // 2 · the squeeze: the bed comes back, lighter
    whoosh(45.8, 0.5, 1);
    progression(46.2, 67, BPM, AM, 0.6);
    arp(49, 67, BPM, AM, 0.7, 12);
    beat(49, 67, BPM, 0.6, true);
    for (const t of [49.8, 51.6, 53.4, 55.2, 60.6, 61.8, 63.0, 64.2]) pop(t, 0.9);
    // 3 · the strikes: tension, then the nine
    whoosh(66.8, 0.5, 1);
    riser(68, 3.4, 1);
    progression(70, 86, BPM, DARK, 0.8);
    for (let t = 70, i = 0; t < 86; t += 60 / BPM / 2, i++) sub(t, 0.18, 45, 0.6 + (i % 2) * 0.2);
    beat(71.6, 86, BPM, 0.7, true);
    for (let i = 0; i < 9; i++) { const at = 70 + 1.6 + i * 0.95 + 0.7; thud(at, 0.35); pop(at, 0.7); }
    for (let i = 0; i < 18; i++) tick(70.6 + i * 0.5, 0.7);
    progression(86, 100, BPM, AM, 0.6);
    arp(86, 100, BPM, AM, 0.6, 12);
    beat(88, 100, BPM, 0.5, true);
    for (const t of [94.6, 96.1, 97.6]) thud(t, 0.3);
    // the name: the beat drops out
    for (const [t, m] of [[100.3, 76], [101.6, 74], [102.9, 72], [104.6, 69], [106.2, 72]]) piano(t, m, 0.8);
    pad(100, 8, [45, 52, 57, 60], 0.5, 0.03);
    progression(108, 116, BPM, AM, 0.55);
    arp(108, 116, BPM, AM, 0.5, 12);
    // 4 · four days: faster, darker, the clock again
    whoosh(115.8, 0.5, 1);
    progression(116.5, 140, 104, DARK, 0.8);
    beat(119, 140, 104, 0.75, true);
    for (let t = 119, i = 0; t < 140; t += 60 / 104 / 2, i++) sub(t, 0.16, 45 + (Math.floor(i / 16) % 2), 0.55);
    for (let i = 0; i < 15; i++) pop(123 + 0.3 + i * 0.12 + 0.8, 0.5, (i / 7) - 1);
    thud(128.9, 0.5);
    for (let i = 0; i < 6; i++) thud(134 + 0.8 + i * 0.45 + 0.8, 0.45);
    // the bombs that were not used: everything drops away but a drone
    pad(140, 6, [33, 40, 45], 1, 0.02);
    for (const t of [140.2, 141.6, 143.0, 144.4]) thud(t, 0.25);
    // 5 · the ceasefire
    whoosh(145.8, 0.5, 1);
    ring(149.1, 3);
    progression(151.5, 160, 84, HOPE, 0.6);
    arp(152.5, 160, 84, HOPE, 0.55, 12);
    // 6 · what changed: piano and pad, then the close
    whoosh(159.8, 0.5, 1);
    progression(160.5, 184, 76, SAD, 0.4, 0.25);
    for (const [t, m] of [[163.4, 69], [165.0, 72], [166.6, 71], [168.2, 67], [170.0, 69], [171.6, 72], [173.2, 74],
      [175.6, 76], [177.4, 74], [179.2, 72], [181.0, 71], [182.8, 69]]) piano(t, m, 0.8);
    pad(184, 5, [45, 52, 57, 64], 0.5, 0.03);
    piano(184.3, 57, 0.7);
    piano(184.3, 64, 0.5);

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
      L[i] = Math.tanh(L[i] * 1.6);
      R[i] = Math.tanh(R[i] * 1.6);
      peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
    }
    const g = peak > 0 ? 0.85 / peak : 1;
    for (let i = 0; i < N; i++) { L[i] *= g; R[i] *= g; }
    const f0 = Math.floor((DURATION - 1.2) * sr);
    for (let i = f0; i < N; i++) { const k = clamp(1 - (i - f0) / (1.8 * sr)); L[i] *= k; R[i] *= k; }
    if (onProgress) onProgress(1);
    return { L, R, sr };
  }

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
      for (let i = 0; i < out.length; i++) out[i] += wet[i] * 0.06;
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
