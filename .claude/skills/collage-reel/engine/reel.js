// Collage reel engine. Deterministic: REEL.seek(t) draws the frame at time t.
//
//   await REEL.load(reel, voice, opts) -> { total, shots, events }
//   REEL.seek(t)
//
// reel  : the script (meta + lines, each line has `say` and `shots`), see SKILL.md
// voice : what voice.py wrote (per-line duration, word times, mouth envelope),
//         or null to estimate timing from the words
// opts  : { stickers: 'url/of/sticker/folder/', media: 'url/of/user/media/' }
(function () {
  const W = 1080, H = 1920;
  const A = window.REEL_ART, HOST = window.REEL_HOST;
  const stage = document.getElementById('stage');
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = { out: (x) => 1 - Math.pow(1 - x, 3), back: (x) => { const c = 1.9; x = clamp(x); return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); }, io: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2) };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // every SVG gets its own ids: a gradient id shared with a hidden shot would draw nothing
  let nid = 0;
  const uniq = (svg) => { const k = '_' + (++nid); return svg.replace(/id="([^"]+)"/g, (m, a) => `id="${a}${k}"`).replace(/url\(#([^)]+)\)/g, (m, a) => `url(#${a}${k})`); };
  const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  const BOX = { main: [8, 4.5, 84, 75], tall: [9, 3.5, 82, 80], top: [6, 4, 88, 41], bottom: [6, 47, 88, 36], inset: [13, 9, 74, 58], full: [0, 0, 100, 100], mid: [10, 18, 80, 50] };
  const BGS = ['stripes:pink', 'grid:pink', 'stripes:green', 'gingham:pink', 'grid:blue', 'stripes:lilac', 'check:pink', 'grid:green', 'plaid:pink'];
  const SCENES = ['room', 'paper', 'city', 'sky', 'stage', 'suburb'];

  let R = null, shots = [], events = [], total = 0, voice = null, opts = {}, fps = 30, cur = -1, hostEl = null, lapEl = null, flashEl = null;
  const stickerCache = {};

  // ---------- timing ----------
  function syl(w) { const m = w.toLowerCase().replace(/[^a-z]/g, '').match(/[aeiouy]+/g); return Math.max(1, m ? m.length : 1) + (/\d/.test(w) ? w.replace(/\D/g, '').length * 0.8 : 0); }
  function estimateLine(say) {
    const words = say.split(/\s+/).filter(Boolean);
    const rate = 4.6; // syllables per second, brisk reel delivery
    let t = 0;
    const out = words.map((w) => { const d = syl(w) / rate; const r = { t0: t, t1: t + d }; t += d + (/[,.!?;:]$/.test(w) ? 0.18 : 0.03); return r; });
    return { dur: t, words: out, env: null };
  }

  function buildTimeline() {
    const m = R.meta || {};
    fps = m.fps || 30;
    let t = m.lead ?? 0.2;
    shots = []; events = [];
    R.lines.forEach((ln, li) => {
      const words = ln.say.split(/\s+/).filter(Boolean);
      const v = (voice && voice.lines && voice.lines[li]) || estimateLine(ln.say);
      ln._t0 = t; ln._v = v;
      const abs = words.map((w, k) => ({ w, t0: t + (v.words[k]?.t0 ?? 0), t1: t + (v.words[k]?.t1 ?? v.dur) }));
      let k = 0;
      const list = ln.shots && ln.shots.length ? ln.shots : [{}];
      list.forEach((sh, si) => {
        const n = si === list.length - 1 ? words.length - k : Math.max(1, sh.w ?? 1);
        const ws = abs.slice(k, k + n);
        sh._words = ws; sh._line = li;
        sh._t0 = si === 0 ? t : (ws[0] ? ws[0].t0 - 0.04 : t);
        shots.push(sh);
        k += n;
      });
      t += v.dur + (ln.gap ?? m.gap ?? 0.12);
    });
    total = t - (R.lines.at(-1).gap ?? m.gap ?? 0.12) + (m.tail ?? 1.0);
    if (shots.length) shots[0]._t0 = 0;
    shots.forEach((s, i) => { s._t1 = i < shots.length - 1 ? shots[i + 1]._t0 : total; s._i = i; });
  }

  // when does an item start? number = seconds into the shot, "wN" = when word N of the shot is spoken
  function startOf(sh, at, idx) {
    if (typeof at === 'string' && /^w\d+$/.test(at)) { const w = sh._words[+at.slice(1)] || sh._words.at(-1); return (w ? w.t0 : sh._t0) - sh._t0; }
    if (typeof at === 'number') return at;
    return 0.04 + idx * 0.07;
  }

  // ---------- stickers: bake a white die-cut edge + soft shadow once ----------
  function loadImg(src) { return new Promise((res, rej) => { const im = new Image(); im.crossOrigin = 'anonymous'; im.onload = () => res(im); im.onerror = () => rej(new Error('missing image ' + src)); im.src = src; }); }
  async function bakeSticker(src, edge = 12) {
    if (stickerCache[src]) return stickerCache[src];
    const im = await loadImg(src);
    const s = 512 / Math.max(im.width, im.height), w = Math.round(im.width * s), h = Math.round(im.height * s), pad = edge + 30;
    const c = document.createElement('canvas'); c.width = w + pad * 2; c.height = h + pad * 2;
    const g = c.getContext('2d');
    const sil = document.createElement('canvas'); sil.width = w; sil.height = h;
    const sg = sil.getContext('2d'); sg.drawImage(im, 0, 0, w, h); sg.globalCompositeOperation = 'source-in'; sg.fillStyle = '#fff'; sg.fillRect(0, 0, w, h);
    g.save(); g.shadowColor = 'rgba(40,10,30,0.28)'; g.shadowBlur = 22; g.shadowOffsetY = 12;
    for (let a = 0; a < 24; a++) g.drawImage(sil, pad + Math.cos((a / 24) * Math.PI * 2) * edge, pad + Math.sin((a / 24) * Math.PI * 2) * edge);
    g.restore();
    for (let a = 0; a < 24; a++) g.drawImage(sil, pad + Math.cos((a / 24) * Math.PI * 2) * edge, pad + Math.sin((a / 24) * Math.PI * 2) * edge);
    g.drawImage(im, pad, pad, w, h);
    const url = c.toDataURL('image/png');
    stickerCache[src] = { url, ratio: c.height / c.width };
    return stickerCache[src];
  }
  function stickerSrc(e) { return /[./]/.test(e) && /\.(png|webp|jpe?g|gif)$/i.test(e) ? (opts.media || '') + e : (opts.stickers || '') + slug(e) + '.png'; }

  // ---------- building a shot ----------
  function bgHTML(sh) {
    const bg = sh.bg || BGS[(sh._i * 5 + 2) % BGS.length];
    if (bg === 'sky') return `<div class="bg bg-full">${uniq(A.skyScene(1080, 1920, 5 + sh._i))}</div>`;
    if (bg === 'tv') return `<div class="bg bg-full tv">${uniq(A.tvScene())}</div>`;
    const [kind, tone] = bg.split(':');
    const stars = sh.stars ?? true;
    const starCol = typeof stars === 'string' ? stars : ({ green: '#ef9fc0', blue: '#ec8db4', lilac: '#f1a2c5', hot: '#ffd3e4' }[tone] || '#ec8db4');
    return `<div class="bg" style="${A.pattern(kind, tone)}"></div>${stars ? `<div class="bg stars">${A.starsLayer(sh._i * 31 + 7, starCol, 0.9)}</div>` : ''}`;
  }

  function sceneHTML(win) {
    if (win.img) return `<img src="${(opts.media || '') + win.img}">`;
    const name = win.scene || 'room';
    if (name.startsWith('#')) return A.scenes.solid({ color: name });
    const f = A.scenes[name] || A.scenes.room;
    return f(win);
  }

  function winEl(sh, win, key) {
    const b = Array.isArray(win.box) ? win.box : BOX[win.box || 'main'];
    const el = document.createElement('div');
    el.className = `win f-${win.frame || 'white'}`;
    el.style.cssText = `left:${b[0] * W / 100}px;top:${b[1] * H / 100}px;width:${b[2] * W / 100}px;height:${b[3] * H / 100}px;${win.r ? `transform:rotate(${win.r}deg);` : ''}${win.radius ? `border-radius:${win.radius}px;` : ''}`;
    el.innerHTML = `<div class="cam"><div class="scene">${uniq(sceneHTML(win))}</div></div>`;
    const cams = ['push', 'up', 'pull', 'left', 'push', 'down', 'right'];
    return { el, cam: el.querySelector('.cam'), kind: win.cam || cams[(sh._i + key) % cams.length], win };
  }

  function wordsHTML(t, mark) {
    const parts = String(t).split(/(\s+)/);
    let k = 0;
    return parts.map((p) => (/^\s+$/.test(p) ? (p.includes('\n') ? '<br>' : ' ') : `<span class="w" data-k="${k++}">${esc(p)}</span>`)).join('') + (mark ? `<span class="mk" style="background:${mark}"></span>` : '');
  }

  async function itemEl(sh, it, idx) {
    const el = document.createElement('div');
    el.className = 'it';
    const k = it.k || (it.e ? 'sticker' : it.t != null ? 'text' : 'text');
    const x = (it.x ?? 50) * W / 100, y = (it.y ?? 20) * H / 100;
    const rec = { el, it, k, x, y, r: it.r ?? 0, s: it.s ?? 1, at: startOf(sh, it.at, idx), inn: it.in, idle: it.idle };
    if (k === 'sticker') {
      const st = await bakeSticker(stickerSrc(it.e), it.edge ?? 12);
      const w = (it.size ?? 300) * (R.meta?.stickerScale ?? 1.2);
      el.classList.add('stk'); el.style.width = w + 'px';
      el.innerHTML = `<img src="${st.url}">`;
      rec.inn = rec.inn || 'pop'; rec.idle = rec.idle ?? true; rec.sfx = 'pop';
    } else if (k === 'text') {
      const style = it.style || 'bold';
      el.classList.add('tx', 's-' + style);
      el.style.fontSize = (it.size ?? 120) + 'px';
      el.style.width = (it.w ?? 92) * W / 100 + 'px';
      if (it.color) el.style.color = it.color;
      if (it.align) el.style.textAlign = it.align;
      if (it.mark) el.style.position = 'absolute';
      el.innerHTML = wordsHTML(it.t, it.mark);
      rec.reveal = it.reveal || (style === 'type' ? 'type' : style === 'sub' ? 'words' : 'pop');
      if (rec.reveal === 'type') { rec.full = String(it.t); el.innerHTML = '<span class="tt"></span><span class="cur"></span>'; rec.sfx = 'type'; }
      else rec.sfx = it.sfx ?? (rec.reveal === 'pop' ? 'swish' : null);
    } else if (k === 'count') {
      el.classList.add('cnt');
      el.innerHTML = `<b style="font-size:${it.size ?? 260}px">${esc(it.n)}</b><span style="font-size:${(it.size ?? 260) * 0.36}px">${esc(it.label || '').replace(/\n/g, '<br>')}</span>`;
      rec.inn = rec.inn || 'pop'; rec.sfx = 'ding';
    } else if (k === 'bubble') {
      el.classList.add('bub', it.side === 'l' ? 'l' : 'r');
      if (it.size) el.style.fontSize = it.size + 'px';
      el.textContent = it.t;
      rec.inn = rec.inn || 'rise'; rec.sfx = 'blip';
    } else if (k === 'def') {
      el.classList.add('card'); el.style.width = (it.w ?? 82) * W / 100 + 'px';
      el.innerHTML = `<div class="hw">${esc(it.word)}</div><div class="pos">${esc(it.pos || 'noun')}</div><div class="df">${wordsHTML(it.def)}</div>${it.by ? `<div class="by">${esc(it.by)}</div>` : ''}`;
      rec.reveal = 'words'; rec.inn = rec.inn || 'rise'; rec.sfx = 'swish';
    } else if (k === 'note') {
      el.classList.add('note'); el.style.width = (it.w ?? 74) * W / 100 + 'px';
      el.innerHTML = (it.lines || []).map((l) => `<div class="ln"><span class="tt" data-full="${esc(l)}"></span></div>`).join('');
      rec.reveal = 'lines'; rec.inn = rec.inn || 'rise'; rec.sfx = 'scribble';
    } else if (k === 'stamp') {
      el.classList.add('stamp'); el.style.fontSize = (it.size ?? 110) + 'px'; if (it.color) el.style.color = it.color;
      el.textContent = it.t; rec.inn = rec.inn || 'slam'; rec.sfx = 'stamp';
    } else if (k === 'tag') {
      el.classList.add('tag'); el.style.fontSize = (it.size ?? 46) + 'px'; if (it.bgc) el.style.background = it.bgc; if (it.color) el.style.color = it.color;
      el.textContent = it.t; rec.inn = rec.inn || 'pop'; rec.sfx = 'blip';
    } else if (k === 'bars') {
      el.classList.add('bars');
      const max = Math.max(...it.bars.map((b) => b.v));
      el.innerHTML = it.bars.map((b) => `<div class="bar"><div class="col" style="height:${(b.v / max) * (it.h ?? 620)}px;background:${b.color || '#e8458f'}"></div><div class="lab">${esc(b.label).replace(/\n/g, '<br>')}</div></div>`).join('');
      rec.reveal = 'bars'; rec.inn = rec.inn || 'fade'; rec.sfx = 'rise';
    } else if (k === 'pola') {
      el.classList.add('pola'); const w = it.size ?? 460; el.style.width = w + 'px'; el.style.height = w * 1.18 + 'px';
      el.innerHTML = `<div class="ph">${it.img ? `<img src="${(opts.media || '') + it.img}" style="width:100%;height:100%;object-fit:cover">` : uniq((A.scenes[it.scene] || A.scenes.sky)(it))}</div><div class="cap">${esc(it.cap || '')}</div>`;
      rec.inn = rec.inn || 'drop'; rec.idle = rec.idle ?? true; rec.sfx = 'pop';
    } else if (k === 'img') {
      el.innerHTML = `<img src="${(opts.media || '') + it.src}" style="width:${it.size ?? 500}px;display:block;${it.round ? 'border-radius:24px;' : ''}">`;
      rec.inn = rec.inn || 'pop';
    } else if (k === 'svg') {
      el.innerHTML = it.svg; el.style.width = (it.size ?? 300) + 'px';
      rec.inn = rec.inn || 'pop';
    } else if (k === 'doodle') {
      const w = it.size ?? 420, col = it.color || '#e8458f';
      const d = it.shape === 'arrow' ? 'M10 60 C 120 10, 240 10, 330 70 M 300 30 L 334 72 L 284 88' : it.shape === 'underline' ? 'M10 40 C 120 20, 260 60, 410 30' : 'M210 20 C 80 18, 12 70, 30 130 C 50 190, 330 200, 390 120 C 430 60, 330 10, 200 26';
      el.innerHTML = `<svg viewBox="0 0 420 220" style="width:${w}px;display:block;overflow:visible"><path d="${d}" fill="none" stroke="${col}" stroke-width="${it.thick ?? 12}" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"/></svg>`;
      rec.reveal = 'draw'; rec.inn = 'none'; rec.sfx = 'scribble';
    }
    el.style.left = rec.x + 'px'; el.style.top = rec.y + 'px';
    if (it.z) el.style.zIndex = it.z;
    return rec;
  }

  async function buildShot(sh) {
    const root = document.createElement('div');
    root.className = 'shot';
    root.innerHTML = bgHTML(sh);
    const wins = [];
    const win = sh.win === false ? null : Object.assign({ scene: SCENES[sh._i % SCENES.length] }, sh.win || {});
    if (win) wins.push(winEl(sh, win, 0));
    if (sh.win2) wins.push(winEl(sh, sh.win2, 3));
    wins.forEach((w) => root.appendChild(w.el));
    const items = [];
    for (const [i, it] of (sh.items || []).entries()) {
      const rec = await itemEl(sh, it, i);
      items.push(rec);
      root.appendChild(rec.el);
    }
    sh._root = root; sh._wins = wins; sh._items = items;
    stage.insertBefore(root, hostEl ? hostEl.parentNode === stage ? hostEl : null : null);
    for (const rec of items) {
      if (rec.sfx && rec.inn !== 'none' || rec.sfx === 'scribble') events.push({ t: sh._t0 + rec.at, kind: rec.sfx, dur: rec.reveal === 'type' ? typeDur(sh, rec) : 0.3 });
    }
    if (sh.flash) events.push({ t: sh._t0, kind: 'whoosh' });
  }

  function typeDur(sh, rec) { return rec.it.dur ?? Math.min(Math.max(0.3, (sh._t1 - sh._t0) - rec.at - 0.15), rec.full.length * 0.06); }

  // ---------- per-frame ----------
  function entrance(rec, lt) {
    const t = lt - rec.at;
    let o = 1, sx = 1, dx = 0, dy = 0, rot = 0;
    if (t < 0) return { o: 0, sx: 0.0001, dx, dy, rot };
    const inn = rec.inn || 'pop';
    if (inn === 'pop') { const p = clamp(t / 0.32); sx = Math.max(0.0001, ease.back(p)); rot = (1 - ease.out(p)) * -14; }
    else if (inn === 'zoom') { const p = ease.out(clamp(t / 0.3)); sx = 1.7 - 0.7 * p; o = p; }
    else if (inn === 'slam') { const p = clamp(t / 0.22); sx = 2.4 - 1.4 * ease.out(p); o = clamp(p * 2); }
    else if (inn === 'drop') { const p = clamp(t / 0.42); dy = -(1 - ease.back(p)) * 500; rot = (1 - p) * 20; }
    else if (inn === 'rise') { const p = clamp(t / 0.36); dy = (1 - ease.back(p)) * 260; o = clamp(p * 3); }
    else if (inn === 'left' || inn === 'right') { const p = clamp(t / 0.38); dx = (1 - ease.back(p)) * (inn === 'left' ? -900 : 900); }
    else if (inn === 'fade') { o = clamp(t / 0.25); }
    return { o, sx, dx, dy, rot };
  }

  function drawItem(sh, rec, lt, T) {
    const e = entrance(rec, lt);
    let bob = 0, wig = 0;
    if (rec.idle) { const ph = rec.x * 0.013 + rec.y * 0.007; bob = Math.sin(T * 2.2 + ph) * 9; wig = Math.sin(T * 1.7 + ph * 2) * 3; }
    rec.el.style.opacity = e.o;
    rec.el.style.transform = `translate(-50%,-50%) translate(${e.dx}px,${e.dy + bob}px) rotate(${rec.r + e.rot + wig}deg) scale(${rec.s * e.sx})`;
    const t = lt - rec.at;
    if (rec.reveal === 'words') {
      const ws = rec.el.querySelectorAll('.w');
      const spoken = sh._words.filter((w) => w.t0 - sh._t0 >= rec.at - 0.05);
      ws.forEach((w, k) => {
        const sw = spoken.length ? spoken[Math.min(spoken.length - 1, Math.floor((k * spoken.length) / ws.length))] : null;
        const at = sw ? sw.t0 - sh._t0 : rec.at + k * 0.18;
        const p = clamp((lt - at) / 0.16);
        w.style.opacity = p > 0 ? 1 : 0;
        w.style.transform = `translateY(${(1 - ease.back(p)) * 30}px) scale(${0.6 + 0.4 * ease.back(p)})`;
      });
    } else if (rec.reveal === 'type') {
      const d = typeDur(sh, rec);
      const n = Math.round(rec.full.length * clamp(t / d));
      rec.el.querySelector('.tt').textContent = rec.full.slice(0, n);
      rec.el.querySelector('.cur').style.opacity = Math.floor(lt * 2.5) % 2 === 0 || t < d ? 1 : 0;
    } else if (rec.reveal === 'lines') {
      const ls = rec.el.querySelectorAll('.tt');
      const per = rec.it.per ?? 0.7;
      ls.forEach((l, i) => { const full = l.dataset.full; l.textContent = full.slice(0, Math.round(full.length * clamp((t - 0.25 - i * per) / (per * 0.85)))); });
    } else if (rec.reveal === 'bars') {
      rec.el.querySelectorAll('.col').forEach((c, i) => { c.style.transform = `scaleY(${Math.max(0.001, ease.back(clamp((t - 0.2 - i * 0.45) / 0.5)))})`; });
    } else if (rec.reveal === 'draw') {
      const p = rec.el.querySelector('path'); p.setAttribute('stroke-dashoffset', String(1 - ease.out(clamp(t / 0.45))));
    }
    const mk = rec.el.querySelector('.mk');
    if (mk) mk.style.transform = `scaleX(${ease.out(clamp((t - 0.15) / 0.35))})`;
  }

  function camTransform(kind, p) {
    const e = ease.io(p);
    switch (kind) {
      case 'push': return `scale(${1 + 0.14 * e})`;
      case 'pull': return `scale(${1.14 - 0.14 * e})`;
      case 'up': return `translateY(${5 - 10 * e}%) scale(1.12)`;
      case 'down': return `translateY(${-5 + 10 * e}%) scale(1.12)`;
      case 'left': return `translateX(${5 - 10 * e}%) scale(1.12)`;
      case 'right': return `translateX(${-5 + 10 * e}%) scale(1.12)`;
      default: return 'none';
    }
  }

  function envAt(T) {
    // mouth openness from the voice envelope (or a fake flap while a word is spoken)
    for (const ln of R.lines) {
      const v = ln._v, lt = T - ln._t0;
      if (lt < 0 || lt > v.dur) continue;
      if (v.env) return v.env[Math.min(v.env.length - 1, Math.floor(lt * (v.envFps || 30)))] || 0;
      const w = v.words.find((x) => lt >= x.t0 && lt <= x.t1);
      return w ? 0.4 + 0.45 * Math.abs(Math.sin(lt * 22)) : 0;
    }
    return 0;
  }

  function drawHost(sh, T) {
    const mode = sh.host ?? 'corner';
    const box = hostEl.parentNode;
    if (!mode) { box.style.display = 'none'; return; }
    box.style.display = 'block';
    const open = envAt(T);
    const blink = ((T + 0.7) % 3.7) < 0.12 ? 1 : 0;
    if (!R.meta?.host?.image) HOST.update(hostEl, open, blink);
    const bob = Math.sin(T * 3.1) * 0.012 + open * 0.03;
    const tilt = Math.sin(T * 1.3) * 2.5 + open * 2;
    const lt = T - sh._t0;
    const pop = sh._i === 0 || (shots[sh._i - 1] && (shots[sh._i - 1].host ?? 'corner') !== mode) ? ease.back(clamp(lt / 0.35)) : 1;
    if (mode === 'center') {
      hostEl.className = 'host full';
      Object.assign(hostEl.style, { left: '290px', top: '760px', width: '500px' });
      lapEl.style.display = 'none';
    } else {
      const right = mode === 'right';
      hostEl.className = 'host';
      Object.assign(hostEl.style, { left: right ? '720px' : '22px', top: '1300px', width: '340px' });
      Object.assign(lapEl.style, { display: 'block', left: right ? '722px' : '14px', top: '1625px', width: '350px' });
    }
    hostEl.style.transform = `rotate(${tilt}deg) scale(${(1 + bob) * Math.max(0.0001, pop)})`;
    // swap the full-body / bust drawing when the mode changes
    const want = mode === 'center' ? 'full' : 'bust';
    if (hostEl.dataset.kind !== want && !R.meta?.host?.image) { hostEl.innerHTML = HOST.build(want === 'full'); hostEl.dataset.kind = want; }
  }

  async function load(reel, v, o = {}) {
    R = reel; voice = v; opts = o;
    stage.innerHTML = '';
    buildTimeline();
    for (const sh of shots) await buildShot(sh);
    const hb = document.createElement('div');
    hb.className = 'hostbox';
    hb.innerHTML = '<div class="host"></div><div class="laptop"></div>';
    stage.appendChild(hb);
    hostEl = hb.querySelector('.host'); lapEl = hb.querySelector('.laptop');
    lapEl.innerHTML = HOST.laptop();
    if (R.meta?.host?.image) hostEl.innerHTML = `<img src="${(opts.media || '') + R.meta.host.image}">`;
    // items that must sit in front of the host
    flashEl = document.createElement('div'); flashEl.className = 'flash'; stage.appendChild(flashEl);
    await document.fonts.ready;
    events.sort((a, b) => a.t - b.t);
    for (const sh of shots) if (sh.cut !== false && sh._i > 0) events.push({ t: sh._t0, kind: 'cut' });
    const jc = R.meta?.jumpCut ?? 1.25;
    for (const sh of shots) { const d = sh._t1 - sh._t0, n = jc > 0 && sh.jump !== false ? Math.max(1, Math.round(d / jc)) : 1; for (let k = 1; k < n; k++) events.push({ t: sh._t0 + (k * d) / n, kind: 'cut' }); }
    return { total, fps, shots: shots.map((s) => ({ i: s._i, line: s._line, t0: s._t0, t1: s._t1, words: s._words.map((w) => w.w).join(' ') })), events, lines: R.lines.map((l) => ({ t0: l._t0, dur: l._v.dur })) };
  }

  function seek(T) {
    let i = shots.findIndex((s) => T >= s._t0 && T < s._t1);
    if (i < 0) i = T < 0 ? 0 : shots.length - 1;
    const sh = shots[i];
    if (i !== cur) { if (cur >= 0) shots[cur]._root.classList.remove('on'); sh._root.classList.add('on'); cur = i; }
    const lt = T - sh._t0, dur = Math.max(0.01, sh._t1 - sh._t0), p = clamp(lt / dur);
    for (const w of sh._wins) w.cam.style.transform = camTransform(w.kind, p);
    // jump cuts: long shots alternate between a wide and a punched-in framing,
    // and every cut lands with a small settle, like a talking-head edit
    const every = R.meta?.jumpCut ?? 1.25;
    const parts = every > 0 && sh.jump !== false ? Math.max(1, Math.round(dur / every)) : 1;
    const k = Math.min(parts - 1, Math.floor(lt / (dur / parts)));
    const since = lt - k * (dur / parts);
    const zoom = (k % 2 ? 1.12 : 1) * (1 + 0.035 * (1 - ease.out(clamp(since / 0.22))));
    sh._root.style.transformOrigin = k % 4 === 3 ? '62% 30%' : '45% 34%';
    sh._root.style.transform = zoom === 1 ? 'none' : `scale(${zoom.toFixed(4)})`;
    const st = sh._root.querySelector('.stars');
    if (st) st.style.transform = `translate(${Math.sin(T * 0.4) * 18}px, ${-(T * 14) % 60}px) rotate(${Math.sin(T * 0.3) * 1.5}deg)`;
    const tun = sh._root.querySelector('.tunnel');
    if (tun) { const k = 1 + lt * 0.12; tun.setAttribute('transform', `translate(540 820) scale(${k}) translate(-540 -820)`); }
    for (const rec of sh._items) drawItem(sh, rec, lt, T);
    drawHost(sh, T);
    flashEl.style.opacity = sh.flash ? clamp(1 - lt / 0.18) * 0.9 : 0;
  }

  window.REEL = { load, seek, W, H, get total() { return total; } };
})();
