// Archival photos for the collage reel: effects and paper frames, baked once
// per photo on a canvas so every frame of the film just shows an image.
//
//   await REEL_PHOTO.bake(src, { fx, frame, cap, seed, inks, archival }) -> { url, ratio }
//
// fx     none | faded | sepia | bw | duotone | pinkwash | halftone | riso | vhs
// frame  plain | white | polaroid | tape | torn | cutout | stamp | tv
// inks   [dark, light] colours for duotone / halftone / riso
// archival adds film scratches and dust; grain and vignette come with the
//          vintage looks automatically
(function () {
  const cache = new Map();
  const hex = (h) => { const n = parseInt(h.replace('#', ''), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const clamp = (v) => (v < 0 ? 0 : v > 255 ? 255 : v);
  function rng(seed) { let s = (seed >>> 0) || 7; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
  function load(src) { return new Promise((res, rej) => { const im = new Image(); im.crossOrigin = 'anonymous'; im.onload = () => res(im); im.onerror = () => rej(new Error('missing photo ' + src)); im.src = src; }); }
  function canvas(w, h) { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; }

  // ---------- colour effects ----------
  function tone(c, fx, inks, r) {
    const g = c.getContext('2d');
    const d = g.getImageData(0, 0, c.width, c.height), p = d.data;
    const [dk, lt] = (inks || (fx === 'pinkwash' ? ['#2b2266', '#f9b9d2'] : ['#2a1d3e', '#f6e7d0'])).map(hex);
    for (let i = 0; i < p.length; i += 4) {
      let R = p[i], G = p[i + 1], B = p[i + 2];
      const L = 0.299 * R + 0.587 * G + 0.114 * B;
      if (fx === 'faded') { // lifted blacks, warm, a little washed out
        const m = 0.25 + 0.75 * (L / 255);
        R = 34 + R * 0.82 * (0.85 + 0.15 * m) + 10; G = 30 + G * 0.8; B = 26 + B * 0.7;
        const avg = (R + G + B) / 3; R = avg + (R - avg) * 0.7; G = avg + (G - avg) * 0.7; B = avg + (B - avg) * 0.7;
      } else if (fx === 'sepia') {
        const s = Math.pow(L / 255, 0.95) * 255;
        R = s * 1.07 + 22; G = s * 0.9 + 12; B = s * 0.68 + 4;
      } else if (fx === 'bw') {
        const t = L / 255, s = t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t);
        R = G = B = (0.35 * t + 0.65 * s) * 255;
      } else if (fx === 'duotone' || fx === 'pinkwash') {
        const t = Math.pow(L / 255, 0.9);
        const D = [dk[0] + (lt[0] - dk[0]) * t, dk[1] + (lt[1] - dk[1]) * t, dk[2] + (lt[2] - dk[2]) * t];
        const k = fx === 'pinkwash' ? 0.72 : 1;
        R = R * (1 - k) + D[0] * k; G = G * (1 - k) + D[1] * k; B = B * (1 - k) + D[2] * k;
      } else if (fx === 'vhs') {
        const avg = (R + G + B) / 3; R = avg + (R - avg) * 1.35 + 8; G = avg + (G - avg) * 1.25; B = avg + (B - avg) * 1.4 + 12;
      }
      p[i] = clamp(R); p[i + 1] = clamp(G); p[i + 2] = clamp(B);
    }
    g.putImageData(d, 0, 0);
    if (fx === 'vhs') { // colour bleed + scanlines
      const o = canvas(c.width, c.height), og = o.getContext('2d');
      og.drawImage(c, 0, 0);
      g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.18;
      g.filter = 'hue-rotate(-40deg)'; g.drawImage(o, 5, 0); g.filter = 'hue-rotate(120deg)'; g.drawImage(o, -5, 0);
      g.filter = 'none'; g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
      g.fillStyle = 'rgba(0,0,0,0.16)';
      for (let y = 0; y < c.height; y += 4) g.fillRect(0, y, c.width, 1.5);
      g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(0, c.height * (0.2 + r() * 0.6), c.width, 10);
    }
  }

  function halftone(src, inks, paper = '#fbf1de') {
    const c = canvas(src.width, src.height), g = c.getContext('2d');
    const sg = src.getContext('2d'), d = sg.getImageData(0, 0, src.width, src.height).data;
    g.fillStyle = paper; g.fillRect(0, 0, c.width, c.height);
    g.fillStyle = inks ? inks[0] : '#e8458f';
    const cell = Math.max(8, Math.round(c.width / 75));
    for (let y = 0; y < c.height; y += cell) for (let x = (y / cell) % 2 ? cell / 2 : 0; x < c.width; x += cell) {
      const i = (Math.min(c.height - 1, Math.round(y + cell / 2)) * c.width + Math.min(c.width - 1, Math.round(x + cell / 2))) * 4;
      const L = (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) / 255;
      const rad = (cell / 2) * 1.15 * Math.sqrt(1 - L);
      if (rad > 0.4) { g.beginPath(); g.arc(x + cell / 2, y + cell / 2, rad, 0, Math.PI * 2); g.fill(); }
    }
    return c;
  }

  function riso(src, inks, r) {
    const [a, b] = inks || ['#ff48b0', '#3255d6'];
    const w = src.width, h = src.height;
    const c = canvas(w, h), g = c.getContext('2d');
    g.fillStyle = '#fbf3e4'; g.fillRect(0, 0, w, h);
    const d = src.getContext('2d').getImageData(0, 0, w, h).data;
    for (const [ink, dx, dy, gamma] of [[b, -4, 3, 1.3], [a, 3, -2, 0.8]]) {
      const layer = canvas(w, h), lg = layer.getContext('2d');
      const out = lg.createImageData(w, h), o = out.data, [R, G, B] = hex(ink);
      for (let i = 0; i < d.length; i += 4) {
        const L = (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) / 255;
        const cover = Math.pow(1 - L, gamma) * (0.85 + r() * 0.3);
        o[i] = R; o[i + 1] = G; o[i + 2] = B; o[i + 3] = clamp(cover * 235);
      }
      lg.putImageData(out, 0, 0);
      g.globalCompositeOperation = 'multiply'; g.drawImage(layer, dx, dy); g.globalCompositeOperation = 'source-over';
    }
    return c;
  }

  function wear(c, { grain, vignette, archival }, r) {
    const g = c.getContext('2d'), w = c.width, h = c.height;
    if (grain) {
      const n = canvas(w, h), ng = n.getContext('2d'), nd = ng.createImageData(w, h), q = nd.data;
      for (let i = 0; i < q.length; i += 4) { const v = 128 + (r() - 0.5) * 255 * grain; q[i] = q[i + 1] = q[i + 2] = v; q[i + 3] = 255; }
      ng.putImageData(nd, 0, 0);
      g.globalCompositeOperation = 'overlay'; g.globalAlpha = 0.35; g.drawImage(n, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    }
    if (archival) {
      g.strokeStyle = 'rgba(255,250,235,0.5)';
      for (let i = 0; i < 5; i++) { const x = r() * w; g.lineWidth = 0.6 + r() * 1.4; g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + (r() - 0.5) * 30, h * 0.3, x + (r() - 0.5) * 30, h * 0.7, x + (r() - 0.5) * 20, h); g.stroke(); }
      for (let i = 0; i < 140; i++) { g.fillStyle = r() < 0.7 ? 'rgba(255,250,235,0.55)' : 'rgba(30,20,10,0.4)'; g.beginPath(); g.arc(r() * w, r() * h, 0.5 + r() * 2.2, 0, Math.PI * 2); g.fill(); }
    }
    if (vignette) {
      const v = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.72);
      v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, `rgba(20,10,5,${vignette})`);
      g.fillStyle = v; g.fillRect(0, 0, w, h);
    }
  }

  // ---------- frames ----------
  function shadowed(g, fn) { g.save(); g.shadowColor = 'rgba(40,10,30,0.3)'; g.shadowBlur = 26; g.shadowOffsetY = 14; fn(); g.restore(); }

  function tornPath(g, x, y, w, h, r, jag = 9) {
    g.beginPath();
    const step = 14;
    g.moveTo(x, y);
    for (let t = 0; t <= w; t += step) g.lineTo(x + t, y + (r() - 0.5) * jag);
    for (let t = 0; t <= h; t += step) g.lineTo(x + w + (r() - 0.5) * jag, y + t);
    for (let t = w; t >= 0; t -= step) g.lineTo(x + t, y + h + (r() - 0.5) * jag);
    for (let t = h; t >= 0; t -= step) g.lineTo(x + (r() - 0.5) * jag, y + t);
    g.closePath();
  }

  function framed(photo, frame, o, r) {
    const pw = photo.width, ph = photo.height, u = pw / 100;
    let pad = [0, 0, 0, 0], extra = 40; // top right bottom left, plus room for shadow
    if (frame === 'white' || frame === 'tape') pad = [3 * u, 3 * u, 3 * u, 3 * u];
    if (frame === 'polaroid') pad = [5 * u, 5 * u, (o.cap ? 20 : 15) * u, 5 * u];
    if (frame === 'torn') pad = [5 * u, 5 * u, 5 * u, 5 * u];
    if (frame === 'stamp') pad = [7 * u, 7 * u, 7 * u, 7 * u];
    if (frame === 'cutout') pad = [3.2 * u, 3.2 * u, 3.2 * u, 3.2 * u];
    if (frame === 'tv') pad = [8 * u, 8 * u, 15 * u, 8 * u];
    const W = pw + pad[1] + pad[3], H = ph + pad[0] + pad[2];
    const c = canvas(W + extra * 2, H + extra * 2), g = c.getContext('2d');
    const x0 = extra, y0 = extra;
    if (frame === 'plain') { shadowed(g, () => g.drawImage(photo, x0, y0)); return c; }
    if (frame === 'tv') {
      shadowed(g, () => { g.fillStyle = '#2b2626'; roundRect(g, x0, y0, W, H, 12 * u); g.fill(); });
      g.save(); roundRect(g, x0 + pad[3], y0 + pad[0], pw, ph, 9 * u); g.clip();
      g.drawImage(photo, x0 + pad[3], y0 + pad[0]);
      g.fillStyle = 'rgba(0,0,0,0.18)'; for (let y = 0; y < ph; y += 5) g.fillRect(x0 + pad[3], y0 + pad[0] + y, pw, 2);
      const gl = g.createLinearGradient(x0, y0, x0 + W, y0 + H); gl.addColorStop(0, 'rgba(255,255,255,0.22)'); gl.addColorStop(0.4, 'rgba(255,255,255,0)'); g.fillStyle = gl; g.fillRect(x0, y0, W, H);
      const v = g.createRadialGradient(x0 + W / 2, y0 + pad[0] + ph / 2, ph * 0.3, x0 + W / 2, y0 + pad[0] + ph / 2, ph * 0.75); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.55)'); g.fillStyle = v; g.fillRect(x0, y0, W, H);
      g.restore();
      for (let i = 0; i < 2; i++) { g.fillStyle = '#4a4242'; g.beginPath(); g.arc(x0 + W - 18 * u - i * 12 * u, y0 + H - 7.5 * u, 3.2 * u, 0, Math.PI * 2); g.fill(); }
      g.fillStyle = '#ef5fa3'; g.beginPath(); g.arc(x0 + 12 * u, y0 + H - 7.5 * u, 1.6 * u, 0, Math.PI * 2); g.fill();
      return c;
    }
    if (frame === 'torn') {
      shadowed(g, () => { g.fillStyle = '#fffaf0'; tornPath(g, x0, y0, W, H, r, 2.2 * u); g.fill(); });
      g.drawImage(photo, x0 + pad[3], y0 + pad[0]);
      return c;
    }
    if (frame === 'stamp') {
      shadowed(g, () => {
        g.fillStyle = '#fffdf5'; g.beginPath(); g.rect(x0, y0, W, H);
        const rr = 2.2 * u, gap = 6.4 * u;
        for (let t = gap / 2; t < W; t += gap) { g.moveTo(x0 + t + rr, y0); g.arc(x0 + t, y0, rr, 0, Math.PI * 2); g.moveTo(x0 + t + rr, y0 + H); g.arc(x0 + t, y0 + H, rr, 0, Math.PI * 2); }
        for (let t = gap / 2; t < H; t += gap) { g.moveTo(x0 + rr, y0 + t); g.arc(x0, y0 + t, rr, 0, Math.PI * 2); g.moveTo(x0 + W + rr, y0 + t); g.arc(x0 + W, y0 + t, rr, 0, Math.PI * 2); }
        g.fill('evenodd');
      });
      g.drawImage(photo, x0 + pad[3], y0 + pad[0]);
      g.strokeStyle = 'rgba(42,29,36,0.5)'; g.lineWidth = 0.5 * u; g.strokeRect(x0 + pad[3] - 1.5 * u, y0 + pad[0] - 1.5 * u, pw + 3 * u, ph + 3 * u);
      return c;
    }
    if (frame === 'cutout') {
      // scissor-cut: a slightly wobbly rounded shape with a white sticker edge;
      // a transparent PNG keeps its own silhouette
      const m = canvas(pw, ph), mg = m.getContext('2d');
      if (o.alpha) mg.drawImage(photo, 0, 0);
      else {
        mg.beginPath(); const n = 40;
        for (let i = 0; i <= n; i++) { const a = (i / n) * Math.PI * 2; const ex = Math.cos(a), ey = Math.sin(a); const sx = Math.sign(ex) * Math.pow(Math.abs(ex), 0.45), sy = Math.sign(ey) * Math.pow(Math.abs(ey), 0.45); const k = 0.97 + (r() - 0.5) * 0.035; const px = pw / 2 + sx * pw / 2 * k, py = ph / 2 + sy * ph / 2 * k; i ? mg.lineTo(px, py) : mg.moveTo(px, py); }
        mg.closePath(); mg.fill();
        mg.globalCompositeOperation = 'source-in'; mg.drawImage(photo, 0, 0);
      }
      const sil = canvas(pw, ph), sg = sil.getContext('2d'); sg.drawImage(m, 0, 0); sg.globalCompositeOperation = 'source-in'; sg.fillStyle = '#fff'; sg.fillRect(0, 0, pw, ph);
      const e = 3.2 * u;
      shadowed(g, () => { for (let a = 0; a < 24; a++) g.drawImage(sil, x0 + pad[3] + Math.cos(a / 24 * Math.PI * 2) * e, y0 + pad[0] + Math.sin(a / 24 * Math.PI * 2) * e); });
      for (let a = 0; a < 24; a++) g.drawImage(sil, x0 + pad[3] + Math.cos(a / 24 * Math.PI * 2) * e, y0 + pad[0] + Math.sin(a / 24 * Math.PI * 2) * e);
      g.drawImage(m, x0 + pad[3], y0 + pad[0]);
      return c;
    }
    // white, polaroid, tape
    shadowed(g, () => { g.fillStyle = frame === 'polaroid' ? '#fffdf7' : '#ffffff'; g.fillRect(x0, y0, W, H); });
    g.drawImage(photo, x0 + pad[3], y0 + pad[0]);
    if (frame === 'polaroid' && o.cap) {
      g.fillStyle = '#2a1d24'; g.font = `700 ${Math.round(9 * u)}px Caveat, cursive`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(o.cap, x0 + W / 2, y0 + pad[0] + ph + pad[2] / 2, W - 10 * u);
    }
    if (frame === 'tape') {
      const tapes = o.tapeColors || ['rgba(244,169,198,0.82)', 'rgba(214,227,163,0.82)'];
      for (const [cx, cy, ang, i] of [[x0 + 6 * u, y0 + 3 * u, -0.7, 0], [x0 + W - 6 * u, y0 + H - 3 * u, -0.7, 1]]) {
        g.save(); g.translate(cx, cy); g.rotate(ang + (r() - 0.5) * 0.2);
        g.fillStyle = tapes[i % tapes.length]; g.fillRect(-14 * u, -4 * u, 28 * u, 8 * u);
        g.fillStyle = 'rgba(255,255,255,0.35)'; for (let k = -14; k < 14; k += 3) g.fillRect(k * u, -4 * u, 1.2 * u, 8 * u);
        g.restore();
      }
    }
    return c;
  }

  function roundRect(g, x, y, w, h, rad) { g.beginPath(); g.moveTo(x + rad, y); g.arcTo(x + w, y, x + w, y + h, rad); g.arcTo(x + w, y + h, x, y + h, rad); g.arcTo(x, y + h, x, y, rad); g.arcTo(x, y, x + w, y, rad); g.closePath(); }

  async function bake(src, o = {}) {
    const key = JSON.stringify([src, o]);
    if (cache.has(key)) return cache.get(key);
    if (o.cap) await document.fonts.load('700 60px Caveat');
    const im = await load(src);
    const r = rng(o.seed ?? (src.length * 131 + (o.fx || '').length));
    const max = o.max || 1000;
    const s = Math.min(1, max / Math.max(im.width, im.height));
    let c = canvas(im.width * s, im.height * s);
    c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
    const alpha = /\.png$/i.test(src) && hasAlpha(c);
    const fx = o.fx || 'none';
    if (fx === 'halftone') c = halftone(c, o.inks);
    else if (fx === 'riso') c = riso(c, o.inks, r);
    else if (fx !== 'none') tone(c, fx, o.inks, r);
    const vintage = ['faded', 'sepia', 'bw', 'duotone'].includes(fx);
    wear(c, { grain: o.grain ?? (vintage ? 0.5 : fx === 'riso' || fx === 'vhs' ? 0.35 : 0), vignette: o.vignette ?? (vintage ? 0.45 : 0), archival: o.archival ?? (fx === 'sepia' || fx === 'bw' || fx === 'faded') }, r);
    const f = o.frame === 'none' ? c : framed(c, o.frame || 'plain', { ...o, alpha }, r);
    const out = { url: f.toDataURL(o.frame === 'none' && !alpha ? 'image/jpeg' : 'image/png', 0.9), ratio: f.height / f.width, w: f.width, h: f.height };
    cache.set(key, out);
    return out;
  }
  function hasAlpha(c) { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; for (let i = 3; i < d.length; i += 4 * 97) if (d[i] < 250) return true; return false; }

  window.REEL_PHOTO = { bake };
})();
