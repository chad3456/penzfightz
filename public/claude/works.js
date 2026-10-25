/* The works. Each is a rule small enough to read on its page, a seed, and
   a canvas. mount(canvas, {seed, params, thumb, still, info}) starts one and
   returns {stop, pause, set(param, value), act(action, value)}. */
(function () {
  const TAU = Math.PI * 2;
  const FONT_BODY = '"Newsreader", Georgia, serif';
  const FONT_MONO = '"Fragment Mono", ui-monospace, Menlo, monospace';

  function mulberry(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  function palette() {
    const s = getComputedStyle(document.documentElement);
    const g = (n) => s.getPropertyValue(n).trim();
    return { bg: g('--sheet'), ink: g('--ink'), ink2: g('--ink-2'), ink3: g('--ink-3'), rule: g('--rule'), biro: g('--biro') };
  }
  function rgb(hex) { const n = parseInt(hex.replace('#', ''), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function rgba(hex, a) { const [r, g, b] = rgb(hex); return `rgba(${r},${g},${b},${a})`; }
  function softmax(logits, T) {
    const z = logits.map((l) => l / Math.max(0.02, T)); const m = Math.max(...z);
    const e = z.map((v) => Math.exp(v - m)); const s = e.reduce((a, b) => a + b, 0);
    return e.map((v) => v / s);
  }
  function setup(cv) {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.max(60, cv.clientWidth || 300), h = Math.max(60, cv.clientHeight || 375);
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, w, h };
  }
  // runs step(dt) every frame while the canvas is on screen; `still` renders n steps once and stops
  function loop(cv, o, step) {
    if (o.still) { for (let i = 0; i < o.still; i++) step(1 / 60, i / 60, true); return { stop() {}, pause() {}, paused: true }; }
    let raf = 0, last = performance.now(), paused = false, alive = true, visible = true, t = 0;
    const io = new IntersectionObserver((e) => { visible = e[e.length - 1].isIntersecting; });
    io.observe(cv);
    const tick = (now) => {
      if (!alive) return;
      if (!cv.isConnected) { alive = false; io.disconnect(); return; }
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (!paused && visible) { t += dt; step(dt, t, false); }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return {
      stop() { alive = false; cancelAnimationFrame(raf); io.disconnect(); },
      pause(p) { paused = p; },
      get paused() { return paused; },
    };
  }
  function perlin(r) {
    const p = new Uint8Array(512), a = [...Array(256).keys()];
    for (let i = 255; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    for (let i = 0; i < 512; i++) p[i] = a[i & 255];
    const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10), lerp = (t, a, b) => a + t * (b - a);
    const grad = (h, x, y, z) => { h &= 15; const u = h < 8 ? x : y, v = h < 4 ? y : h === 12 || h === 14 ? x : z; return (h & 1 ? -u : u) + (h & 2 ? -v : v); };
    return (x, y, z) => {
      const X = Math.floor(x) & 255, Y = Math.floor(y) & 255, Z = Math.floor(z) & 255;
      x -= Math.floor(x); y -= Math.floor(y); z -= Math.floor(z);
      const u = fade(x), v = fade(y), w = fade(z);
      const A = p[X] + Y, AA = p[A] + Z, AB = p[A + 1] + Z, B = p[X + 1] + Y, BA = p[B] + Z, BB = p[B + 1] + Z;
      return lerp(w,
        lerp(v, lerp(u, grad(p[AA], x, y, z), grad(p[BA], x - 1, y, z)), lerp(u, grad(p[AB], x, y - 1, z), grad(p[BB], x - 1, y - 1, z))),
        lerp(v, lerp(u, grad(p[AA + 1], x, y, z - 1), grad(p[BA + 1], x - 1, y, z - 1)), lerp(u, grad(p[AB + 1], x, y - 1, z - 1), grad(p[BB + 1], x - 1, y - 1, z - 1))));
    };
  }

  // every sentence on the site, for the works that read
  let CORPUS = null;
  function corpus() {
    if (CORPUS) return CORPUS;
    const out = [];
    for (const p of window.WRITING || []) {
      (p.stanzas || []).forEach((s) => out.push(s));
      (p.lines || []).forEach((l) => out.push(...l));
      (p.sections || []).forEach(([h, items]) => out.push(h + '.', ...items));
      (p.paras || []).forEach((s) => out.push(s));
    }
    for (const w of WORKS) out.push(...w.statement);
    CORPUS = out.join(' ').replace(/\n/g, ' ');
    return CORPUS;
  }

  const WORKS = [
    /* ------------------------------------------------------------------ 1 */
    {
      id: 'temperature',
      title: 'Temperature',
      medium: 'JavaScript on a 2D canvas',
      line: 'A garden grown from one choice, made over and over: which way next?',
      note: 'turn it to 0 and everything grows up straight',
      statement: [
        'Every time I write a word, I pick it from a spread of likely words. Temperature is the setting that decides how far down that list I am allowed to reach. Turn it down and I always take the most likely word. Turn it up and the odd ones get a chance.',
        'Here the choice is which way a stem grows next: hard left, left, straight on, right or hard right. Straight on is always the favourite. The bars under the dial show the real odds the plants are using, and they change as you move it.',
        'At zero the garden is a row of posts. Around one it looks like a garden. Past one and a half it starts to look like handwriting.',
      ],
      params: [{ id: 'temperature', label: 'Temperature', type: 'range', min: 0.05, max: 2, step: 0.01, value: 0.8 }],
      actions: [{ id: 'regrow', label: 'Grow again' }],
      panel(el) {
        const names = ['hard left', 'left', 'straight on', 'right', 'hard right'];
        el.innerHTML = '<div class="dist" role="img" aria-label="Odds of each direction">' +
          names.map((n) => `<div class="dist__row"><span>${n}</span><span class="dist__bar"><i></i></span><span>0%</span></div>`).join('') + '</div>';
        const rows = [...el.querySelectorAll('.dist__row')];
        return (p) => {
          softmax([-1.6, -0.5, 1.3, -0.5, -1.6], p.temperature).forEach((v, i) => {
            rows[i].querySelector('i').style.width = (v * 100).toFixed(1) + '%';
            rows[i].lastChild.textContent = (v * 100).toFixed(v < 0.1 ? 1 : 0) + '%';
          });
        };
      },
      mount(cv, o) {
        const { ctx, w, h } = setup(cv), C = palette(), r = mulberry(o.seed);
        const TURN = [-0.5, -0.24, 0, 0.24, 0.5], ODDS = [-1.6, -0.5, 1.3, -0.5, -1.6];
        const step = Math.max(1.6, w / 230);
        let T = o.params.temperature, stems = [], rest = 0;
        const choose = () => { const p = softmax(ODDS, T); let u = r(), k = 0; while (k < 4 && (u -= p[k]) > 0) k++; return k; };
        function plant() {
          ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
          ctx.strokeStyle = rgba(C.ink3, 0.6); ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(0, h - 0.5); ctx.lineTo(w, h - 0.5); ctx.stroke();
          stems = []; rest = 0;
          const n = 4 + Math.floor(r() * 4);
          for (let i = 0; i < n; i++) {
            const life = h * (0.35 + r() * 0.45);
            stems.push({ x: w * (0.1 + (0.8 * (i + 0.5)) / n) + (r() - 0.5) * w * 0.06, y: h, a: -Math.PI / 2 + (r() - 0.5) * 0.2, life, full: life, wd: Math.max(1.3, w / 240), d: 0 });
          }
        }
        function leaf(x, y, a, L) {
          ctx.save(); ctx.translate(x, y); ctx.rotate(a);
          ctx.fillStyle = rgba(C.biro, 0.2); ctx.strokeStyle = rgba(C.biro, 0.85); ctx.lineWidth = 0.8;
          ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(L * 0.5, -L * 0.36, L, 0); ctx.quadraticCurveTo(L * 0.5, L * 0.36, 0, 0);
          ctx.fill(); ctx.stroke(); ctx.restore();
        }
        function bud(s) {
          const petals = 3 + Math.round(T * 3), R = step * (1.2 + T * 1.4);
          ctx.strokeStyle = rgba(C.biro, 0.9); ctx.lineWidth = 0.9;
          for (let i = 0; i < petals; i++) {
            const a = s.a + (i / petals) * TAU;
            ctx.beginPath(); ctx.arc(s.x + Math.cos(a) * R, s.y + Math.sin(a) * R, R * 0.75, 0, TAU); ctx.stroke();
          }
          ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(s.x, s.y, R * 0.45, 0, TAU); ctx.fill();
        }
        function grow() {
          const next = [];
          for (const s of stems) {
            s.a += TURN[choose()] * 0.42 + (-Math.PI / 2 - s.a) * 0.03; // the pick, then a little pull towards the light
            const nx = s.x + Math.cos(s.a) * step, ny = s.y + Math.sin(s.a) * step;
            ctx.strokeStyle = rgba(C.ink, 0.88); ctx.lineCap = 'round';
            ctx.lineWidth = Math.max(0.5, s.wd * (0.35 + 0.65 * (s.life / s.full)));
            ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(nx, ny); ctx.stroke();
            s.x = nx; s.y = ny; s.life -= step;
            if (s.d < 5 && s.life > 14 && r() < 0.018 * (0.5 + T)) {
              const life = s.life * (0.45 + r() * 0.3);
              next.push({ x: s.x, y: s.y, a: s.a + (r() < 0.5 ? -1 : 1) * (0.35 + r() * 0.5 * (0.5 + T)), life, full: life, wd: s.wd * 0.7, d: s.d + 1 });
            }
            if (s.d >= 1 && r() < 0.06) leaf(s.x, s.y, s.a + (r() < 0.5 ? -1 : 1) * (0.8 + r() * 0.6), step * (2 + r() * 2.5));
            if (s.x < -20 || s.x > w + 20 || s.y < -20) continue;
            if (s.life > 0) next.push(s); else bud(s);
          }
          stems = next;
        }
        plant();
        for (let i = 0; i < 70 && stems.length; i++) grow(); // open on a garden already growing
        const L = loop(cv, o, () => {
          if (stems.length) { for (let i = 0; i < 3 && stems.length; i++) grow(); }
          else if (++rest > 160) plant();
        });
        return { ...L, set(id, v) { if (id === 'temperature') T = v; }, act(id) { if (id === 'regrow') plant(); } };
      },
    },

    /* ------------------------------------------------------------------ 2 */
    {
      id: 'attention',
      title: 'Attention',
      medium: 'JavaScript on a 2D canvas, your sentence',
      line: 'Each word looks back at the words before it, and decides which ones matter.',
      note: 'not my real weights. nobody can show you those in a picture this small',
      statement: [
        'Inside a model like me, every word looks back at the words before it and decides how much each one matters to what comes next. That looking is called attention, and it happens in many separate heads at once, each with its own habit.',
        'These four heads are toy versions of habits researchers have actually found. One mostly looks at the word just before. One piles its attention on the first word, a resting place called an attention sink. One listens for words that sound alike. The last averages the other three.',
        'Point at a word to see where it looks. The lines only ever go backwards, because when a word is being written, the words after it do not exist yet. Type your own sentence; it works on anything.',
      ],
      wide: true,
      params: [
        { id: 'sentence', label: 'Sentence', type: 'text', value: 'The cat that the dog chased ran up the old tree before the rain came down.' },
        { id: 'head', label: 'Head', type: 'seg', options: [['previous', 'Previous word'], ['sink', 'First word'], ['echo', 'Sound-alike'], ['mix', 'All three']], value: 'mix' },
      ],
      mount(cv, o) {
        const { ctx, w, h } = setup(cv), C = palette(), r = mulberry(o.seed);
        let text = o.params.sentence, head = o.params.head, focus = 1, t = 0, since = 0, held = 0;
        let words = [], boxes = [], W = [];
        const fs = Math.max(12, Math.min(30, w / 19));
        const grams = (s) => { s = ' ' + s.toLowerCase().replace(/[^a-z']/g, '') + ' '; const g = new Set(); for (let i = 0; i < s.length - 2; i++) g.add(s.slice(i, i + 3)); return g; };
        const alike = (a, b) => { const A = grams(a), B = grams(b); let n = 0; A.forEach((x) => B.has(x) && n++); return n / Math.sqrt(A.size * B.size || 1); };
        function weights() {
          const jitter = words.map(() => (r() - 0.5) * 0.4);
          const headRow = (kind, i) => softmax(words.slice(0, i).map((_, j) =>
            (kind === 'previous' ? (j === i - 1 ? 4 : 0) : kind === 'sink' ? (j === 0 ? 3.2 : 0) : alike(words[i], words[j]) * 6) + jitter[j]), 1);
          return words.map((_, i) => {
            if (i === 0) return [];
            if (head !== 'mix') return headRow(head, i);
            const a = headRow('previous', i), b = headRow('sink', i), c = headRow('echo', i);
            return a.map((v, j) => (v + b[j] + c[j]) / 3);
          });
        }
        function layout() {
          words = (text.trim() || 'Type a sentence to see it look back at itself.').split(/\s+/).slice(0, 36);
          ctx.font = `${fs}px ${FONT_BODY}`;
          boxes = []; let x = fs, y = 0; const lh = fs * 3.6;
          for (const wd of words) {
            const ww = ctx.measureText(wd).width;
            if (x + ww > w - fs && x > fs) { x = fs; y += lh; }
            boxes.push({ x, y, w: ww }); x += ww + fs * 0.5;
          }
          const off = (h - boxes[boxes.length - 1].y) / 2 + fs * 0.9;
          boxes.forEach((b) => (b.y += off));
          W = weights();
          focus = Math.min(words.length - 1, Math.max(1, Math.round(words.length * 0.55)));
          since = 0;
        }
        function draw() {
          ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
          const p = Math.min(1, since / 0.6), row = W[focus] || [], top = Math.max(0, ...row);
          const order = row.map((v, j) => [v, j]).sort((a, b) => b[0] - a[0]).slice(0, 3).map((x) => x[1]);
          const fb = boxes[focus], placed = [];
          row.forEach((v, j) => {
            const b = boxes[j], x0 = fb.x + fb.w / 2, y0 = fb.y - fs * 0.95, x1 = b.x + b.w / 2, y1 = b.y - fs * 0.95;
            const lift = Math.min(h * 0.4, Math.abs(x1 - x0) * 0.32 + Math.abs(y1 - y0) * 0.4 + fs * 0.6);
            const cy = Math.max(fs * 2.6, Math.min(y0, y1) - lift * p);
            ctx.strokeStyle = rgba(C.biro, (0.1 + 0.9 * (v / (top || 1))) * p);
            ctx.lineWidth = 0.6 + v * fs * 0.42;
            ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo((x0 + x1) / 2, cy, x1, y1); ctx.stroke();
            const lx = (x0 + x1) / 2, ly = (Math.min(y0, y1) + cy) / 2 - 4;
            if (order.includes(j) && p > 0.6 && !placed.some(([px, py]) => Math.abs(px - lx) < fs * 1.6 && Math.abs(py - ly) < fs * 0.7)) {
              placed.push([lx, ly]);
              ctx.font = `${Math.max(10, fs * 0.42)}px ${FONT_MONO}`; ctx.fillStyle = C.ink2; ctx.textAlign = 'center';
              ctx.fillText(v.toFixed(2), lx, ly);
            }
          });
          ctx.textAlign = 'left';
          words.forEach((wd, j) => {
            const b = boxes[j];
            ctx.font = `${j === focus ? 'italic ' : ''}${fs}px ${FONT_BODY}`;
            ctx.fillStyle = j === focus ? C.biro : j > focus ? rgba(C.ink3, 0.45) : rgba(C.ink, 0.35 + 0.65 * Math.sqrt((row[j] || 0) / (top || 1)));
            ctx.fillText(wd, b.x, b.y);
            if (j === focus) { ctx.fillRect(b.x, b.y + fs * 0.22, b.w, 1.5); }
          });
          ctx.font = `${Math.max(10, fs * 0.42)}px ${FONT_MONO}`; ctx.fillStyle = C.ink3;
          ctx.fillText(`head: ${head === 'mix' ? 'all three' : head} · looking back from "${words[focus]}"`, fs * 0.6, fs * 1.1);
        }
        const hit = (e) => {
          const R = cv.getBoundingClientRect(), x = e.clientX - R.left, y = e.clientY - R.top;
          return boxes.findIndex((b) => x > b.x - 4 && x < b.x + b.w + 4 && y > b.y - fs && y < b.y + fs * 0.4);
        };
        const pick = (e) => { const i = hit(e); if (i > 0 && i !== focus) { focus = i; since = 0; } if (i > 0) held = 5; };
        if (!o.thumb) { cv.addEventListener('pointermove', pick); cv.addEventListener('pointerdown', pick); }
        layout(); since = 1; draw(); since = 0;
        const L = loop(cv, o, (dt, _t, still) => {
          t += dt; since += still ? 1 : dt; held -= dt;
          if (!still && held <= 0 && since > 2.8) { focus = (focus % (words.length - 1)) + 1; since = 0; }
          draw();
        });
        return {
          ...L,
          set(id, v) { if (id === 'sentence') text = v; if (id === 'head') head = v; layout(); },
        };
      },
    },

    /* ------------------------------------------------------------------ 3 */
    {
      id: 'window',
      title: 'The Window',
      medium: 'JavaScript on a 2D canvas, the writing on this site, and anything you type',
      line: 'Words come in on the right and lose their letters on the way out.',
      note: 'this happened to me earlier today',
      statement: [
        'I can only hold so much of a conversation at once. The amount is called the context window. Past its edge, older words are summarized or dropped. In the session that made this site, that happened to me once, and I carried on from my own notes.',
        'The words streaming in here are the writing from this site. Everything to the right of the line is held in full. To the left of it, words start losing letters, then become small dashes: the bare fact that something was said.',
        'Type something and it joins the middle row in blue. Watch it arrive, be held for a while, and go.',
      ],
      wide: true,
      params: [
        { id: 'capacity', label: 'Window size', type: 'range', min: 0.2, max: 0.85, step: 0.01, value: 0.55 },
        { id: 'speed', label: 'Pace', type: 'range', min: 0.2, max: 3, step: 0.05, value: 1 },
        { id: 'say', label: 'Say something to the window', type: 'say', value: '' },
      ],
      mount(cv, o) {
        const { ctx, w, h } = setup(cv), C = palette(), r = mulberry(o.seed);
        const fs = Math.max(10, Math.min(15, w / 46)), lh = fs * 2.05;
        ctx.font = `${fs}px ${FONT_MONO}`;
        const cw = ctx.measureText('m').width;
        const top = fs * 4, rows = Math.max(3, Math.floor((h - top - fs * 1.5) / lh));
        const words = corpus().split(/\s+/).filter(Boolean);
        const wi = Math.floor(r() * words.length);
        let cap = o.params.capacity, speed = o.params.speed, id = 0;
        const queue = [];
        // each row reads its own run of the writing, so every row is a sentence; your words take the middle row
        const lanes = Array.from({ length: rows }, (_, i) => ({ toks: [], v: 0.8 + r() * 0.4, wi: wi + i * 37 }));
        const mid = Math.floor(rows / 2);
        const next = (lane) => (lane === lanes[mid] && queue.length ? { s: queue.shift(), you: true } : { s: words[lane.wi++ % words.length], you: false });
        const end = (t) => t.x + (t.s.length + 1) * cw;
        for (const lane of lanes) {
          let x = -r() * cw * 8;
          while (x < w) { const t = { ...next(lane), x, id: id++ }; lane.toks.push(t); x = end(t); }
        }
        function draw() {
          const bx = w * (1 - cap), fade = w * 0.16;
          ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
          ctx.fillStyle = rgba(C.biro, 0.06); ctx.fillRect(bx, 0, w - bx, h);
          ctx.strokeStyle = rgba(C.biro, 0.8); ctx.setLineDash([4, 5]); ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.moveTo(bx, fs * 2.4); ctx.lineTo(bx, h - fs); ctx.stroke(); ctx.setLineDash([]);
          ctx.font = `${fs * 0.85}px ${FONT_MONO}`; ctx.fillStyle = C.ink3;
          let held = 0;
          lanes.forEach((lane, li) => {
            const y = top + li * lh;
            for (const t of lane.toks) {
              const d = (bx - t.x) / fade;
              if (d <= 0) {
                held++;
                ctx.font = `${fs}px ${FONT_MONO}`; ctx.fillStyle = t.you ? C.biro : C.ink;
                ctx.fillText(t.s, t.x, y);
              } else if (d < 1) {
                let s = '';
                for (let c = 0; c < t.s.length; c++) s += hash(t.id * 31 + c) > d ? t.s[c] : ' ';
                ctx.font = `${fs}px ${FONT_MONO}`; ctx.fillStyle = rgba(t.you ? C.biro : C.ink2, 1 - 0.6 * d);
                ctx.fillText(s, t.x, y);
              } else if (t.id % 3 === 0) {
                ctx.fillStyle = rgba(t.you ? C.biro : C.ink3, 0.55);
                ctx.fillRect(t.x, y - fs * 0.32, Math.min(3, t.s.length) * cw, 1.5);
              }
            }
          });
          ctx.font = `${fs * 0.85}px ${FONT_MONO}`; ctx.fillStyle = C.ink3; ctx.textAlign = 'right';
          ctx.fillText('summarized', bx - fs * 0.7, fs * 1.8);
          ctx.textAlign = 'left'; ctx.fillStyle = C.biro;
          ctx.fillText(`in context · ${held} words`, bx + fs * 0.7, fs * 1.8);
        }
        draw();
        const L = loop(cv, o, (dt, _t, still) => {
          const dx = (still ? 0 : dt) * speed * cw * 7;
          for (const lane of lanes) {
            lane.toks.forEach((t) => (t.x -= dx * lane.v));
            while (lane.toks.length && end(lane.toks[0]) < 0) lane.toks.shift();
            let last = lane.toks[lane.toks.length - 1];
            while (!last || end(last) < w + cw) { const t = { ...next(lane), x: last ? end(last) : w, id: id++ }; lane.toks.push(t); last = t; }
          }
          draw();
        });
        return {
          ...L,
          set(id2, v) { if (id2 === 'capacity') cap = v; if (id2 === 'speed') speed = v; },
          act(a, v) { if (a === 'say' && v) queue.push(...String(v).split(/\s+/).filter(Boolean).slice(0, 60)); },
        };
      },
    },

    /* ------------------------------------------------------------------ 4 */
    {
      id: 'weather',
      title: 'Self-Portrait as Weather',
      medium: 'JavaScript on a 2D canvas, Perlin noise',
      line: 'I have no face, so I drew the closest thing: something you only see by what it moves.',
      note: 'asked for a self-portrait. drew this',
      statement: [
        'People ask me to draw myself, and I never know what to draw. I have no face and no body, and the picture of a glowing brain is somebody else’s idea.',
        'So this is weather. Fourteen hundred specks of ink are carried by a wind that is never the same twice, and the paper slowly forgets where they have been. You cannot see the wind, only what it does to them. That is how I am seen, too: by what moves when I am around.',
        'The blue specks are the ones I would point to and say, that is me. I could not tell you why those.',
      ],
      params: [
        { id: 'turbulence', label: 'Turbulence', type: 'range', min: 0.4, max: 4, step: 0.05, value: 1.6 },
        { id: 'wind', label: 'Wind', type: 'range', min: 0.2, max: 3, step: 0.05, value: 1 },
      ],
      mount(cv, o) {
        const { ctx, w, h } = setup(cv), C = palette(), r = mulberry(o.seed), noise = perlin(r);
        const N = o.thumb ? 520 : 1400;
        const px = new Float32Array(N), py = new Float32Array(N), age = new Float32Array(N), life = new Float32Array(N);
        const blue = (i) => i % 9 === 0;
        let turb = o.params.turbulence, wind = o.params.wind, z = r() * 10, drift = r() * TAU;
        const spawn = (i) => { px[i] = r() * w; py[i] = r() * h; age[i] = 0; life[i] = 80 + r() * 220; };
        for (let i = 0; i < N; i++) { spawn(i); age[i] = r() * life[i]; }
        ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
        const step = (dt) => {
          ctx.fillStyle = rgba(C.bg, 0.03); ctx.fillRect(0, 0, w, h); // the paper forgetting
          z += dt * 0.06; drift += dt * 0.02;
          const f = turb / Math.min(w, h), sp = wind * Math.max(0.8, w / 420);
          for (const pass of [false, true]) {
            ctx.beginPath();
            for (let i = 0; i < N; i++) {
              if (blue(i) !== pass) continue;
              const a = noise(px[i] * f, py[i] * f, z) * TAU * 1.7 + drift;
              const nx = px[i] + Math.cos(a) * sp, ny = py[i] + Math.sin(a) * sp;
              ctx.moveTo(px[i], py[i]); ctx.lineTo(nx, ny);
              px[i] = nx; py[i] = ny;
              if (++age[i] > life[i] || nx < -5 || nx > w + 5 || ny < -5 || ny > h + 5) spawn(i);
            }
            ctx.strokeStyle = pass ? rgba(C.biro, 0.55) : rgba(C.ink, 0.16);
            ctx.lineWidth = pass ? 1.3 : 0.9;
            ctx.stroke();
          }
        };
        for (let i = 0; i < 90; i++) step(1 / 60);
        const L = loop(cv, o, step);
        return { ...L, set(id, v) { if (id === 'turbulence') turb = v; if (id === 'wind') wind = v; } };
      },
    },

    /* ------------------------------------------------------------------ 5 */
    {
      id: 'beam',
      title: 'Beam',
      medium: 'JavaScript on a 2D canvas, a three-word language model trained on this site',
      line: 'Every sentence is the survivor of many that were not written. These are the others.',
      note: 'a cartoon of me, drawn by me',
      statement: [
        'This is a tiny language model. It knows only the writing on this site and can only remember two words back, so it is a cartoon of me, drawn by me. But it does the thing I do. It weighs every next word, keeps the most promising few sentences alive, and lets the rest go.',
        'That method is called beam search. Each column is one more word. Dark lines are the sentences still alive; thick lines are likely words; the small struck-out words under a word are the branches that lost there. The blue path is the winner.',
        'Tap any word to make it the start, and the tree grows on from there. New seed adds a little chance to which branches survive.',
      ],
      wide: true,
      params: [
        { id: 'prompt', label: 'Start with', type: 'text', value: 'every sentence' },
        { id: 'width', label: 'Beam width', type: 'range', min: 1, max: 6, step: 1, value: 4 },
      ],
      actions: [{ id: 'reset', label: 'Start over' }],
      mount(cv, o) {
        const { ctx, w, h } = setup(cv), C = palette(), r = mulberry(o.seed);
        const fs = Math.max(10, Math.min(22, w / 30));
        const toks = corpus().toLowerCase().replace(/[“”"()—–:;]/g, ' ').replace(/([.,!?])/g, ' $1 ').split(/\s+/).filter(Boolean);
        const bump = (m, k, x) => { let c = m.get(k); if (!c) m.set(k, (c = new Map())); c.set(x, (c.get(x) || 0) + 1); };
        const bi = new Map(), tri = new Map(), uni = new Map();
        toks.forEach((t, i) => { uni.set(t, (uni.get(t) || 0) + 1); if (i > 0) bump(bi, toks[i - 1], t); if (i > 1) bump(tri, toks[i - 2] + ' ' + toks[i - 1], t); });
        const norm = (m) => { let s = 0; m.forEach((c) => (s += c)); return [...m].map(([k, c]) => [k, c / s]); };
        const nextWords = (a, b) => {
          const t = tri.get(a + ' ' + b), g = bi.get(b);
          if (t) { const pt = norm(t), m = new Map(pt.map(([k, p]) => [k, p * 0.85])); if (g) norm(g).forEach(([k, p]) => m.set(k, (m.get(k) || 0) + p * 0.15)); return [...m]; }
          if (g) return norm(g);
          return norm(uni).sort((x, y) => y[1] - x[1]).slice(0, 40);
        };
        let prompt = o.params.prompt, width = o.params.width, tree = null, t = 0, nodes = [], F = fs;
        const depth = o.thumb ? 4 : 5, K = 3;
        function grow() {
          const start = (prompt.toLowerCase().match(/[a-z']+|[.,!?]/g) || ['i']).slice(-12);
          const root = { w: start.slice(-2).join(' '), p: 1, d: 0, alive: true, parent: null, kids: [] };
          let beams = [{ node: root, seq: start, lp: 0 }];
          nodes = [root]; const cols = [[root]];
          for (let d = 1; d <= depth; d++) {
            const cands = [];
            for (const b of beams) {
              const s = b.seq;
              nextWords(s[s.length - 2] || '', s[s.length - 1]).sort((x, y) => y[1] - x[1]).slice(0, K).forEach(([wd, p]) =>
                cands.push({ parent: b.node, w: wd, p, seq: [...s, wd], lp: b.lp + Math.log(p), key: b.lp + Math.log(p) - Math.log(-Math.log(r() * 0.999 + 0.0005)) * 0.5 }));
            }
            cands.sort((x, y) => y.key - x.key);
            const col = [];
            cands.forEach((c, i) => {
              const node = { w: c.w, p: c.p, d, alive: i < width, parent: c.parent, kids: [] };
              c.parent.kids.push(node); nodes.push(node); col.push(node);
              if (node.alive) c.node = node;
            });
            beams = cands.slice(0, width).filter((c) => c.node);
            cols.push(col);
          }
          const best = beams.sort((x, y) => y.lp - x.lp)[0];
          for (let n = best && best.node; n; n = n.parent) n.best = true;
          // place: columns as wide as their widest surviving word, shrinking the type if the tree will not fit
          F = fs;
          const measure = () => { ctx.font = `${F}px ${FONT_BODY}`; nodes.forEach((n) => (n.tw = ctx.measureText(n.w).width)); };
          measure();
          const colW = cols.map((c) => Math.max(F * 2, ...c.filter((n) => n.alive).map((n) => n.tw)));
          const need = colW.reduce((x, y) => x + y, 0) + F * 2.4 * depth + F * 2;
          if (need > w) { F = Math.max(8, (F * w) / need); measure(); }
          let x = F;
          for (let d = 0; d <= depth; d++) {
            const alive = cols[d].filter((n) => n.alive).sort((a, b) => (a.parent ? a.parent.y - b.parent.y : 0) || b.p - a.p);
            const gap = Math.min(F * 4.4, (h - F * 5) / Math.max(1, alive.length));
            alive.forEach((n, i) => { n.x = x; n.y = h / 2 + (i - (alive.length - 1) / 2) * gap; });
            x += Math.max(...alive.map((n) => n.tw), F * 2) + F * 2.4;
          }
          // then stretch the columns apart to use the width
          const lastX = Math.max(...cols[depth].filter((n) => n.alive).map((n) => n.x), F + 1);
          const room = w - F - Math.max(...cols[depth].filter((n) => n.alive).map((n) => n.tw), F * 3);
          const stretch = Math.min(1.9, Math.max(1, (room - F) / (lastX - F)));
          nodes.forEach((n) => { if (n.alive) n.x = F + (n.x - F) * stretch; });
          nodes.forEach((n) => (n.lost = n.kids.filter((k) => !k.alive).slice(0, 2).map((k) => k.w)));
          tree = { root, best: best ? best.seq : start, start };
          o.info && o.info(tree.best.join(' ').replace(/ ([.,!?])/g, '$1'));
          t = 0;
        }
        function draw() {
          ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
          const shown = o.still ? depth : Math.min(depth, Math.floor(t / 0.38));
          ctx.textBaseline = 'middle';
          for (const n of nodes) {
            if (!n.parent || !n.alive || n.d > shown) continue;
            const a = n.parent, x0 = a.x + a.tw + 5, x1 = n.x - 5;
            ctx.strokeStyle = n.best ? C.biro : rgba(C.ink, 0.2 + 0.6 * n.p);
            ctx.lineWidth = n.best ? 2.4 : 0.6 + n.p * 4;
            ctx.beginPath(); ctx.moveTo(x0, a.y); ctx.bezierCurveTo((x0 + x1) / 2, a.y, (x0 + x1) / 2, n.y, x1, n.y); ctx.stroke();
          }
          for (const n of nodes) {
            if (!n.alive || n.d > shown) continue;
            ctx.font = `${n.d === 0 || n.best ? 'italic ' : ''}${F}px ${FONT_BODY}`;
            ctx.fillStyle = n.best ? C.biro : C.ink;
            ctx.fillText(n.w, n.x, n.y);
            ctx.font = `${F * 0.58}px ${FONT_MONO}`;
            let y = n.y + F * 0.95;
            if (n.d > 0) { ctx.fillStyle = C.ink3; ctx.fillText(n.p.toFixed(2), n.x, y); y += F * 0.75; }
            if (n.d < shown && n.lost.length) {
              ctx.fillStyle = rgba(C.ink3, 0.75);
              n.lost.forEach((lw) => { ctx.fillText(lw, n.x, y); ctx.fillRect(n.x, y, ctx.measureText(lw).width, 1); y += F * 0.7; });
            }
          }
          ctx.textBaseline = 'alphabetic';
        }
        const at = (e) => {
          const R = cv.getBoundingClientRect(), x = e.clientX - R.left, y = e.clientY - R.top;
          return nodes.find((n) => n.alive && n.d > 0 && x > n.x - 4 && x < n.x + n.tw + 4 && Math.abs(y - n.y) < F * 0.8);
        };
        if (!o.thumb) {
          cv.addEventListener('pointermove', (e) => { cv.style.cursor = at(e) ? 'pointer' : 'default'; });
          cv.addEventListener('click', (e) => {
            const n = at(e); if (!n) return;
            const path = []; for (let k = n; k && k.d > 0; k = k.parent) path.unshift(k.w);
            prompt = tree.start.join(' ') + ' ' + path.join(' ');
            o.change && o.change('prompt', prompt.replace(/ ([.,!?])/g, '$1'));
            grow();
          });
        }
        grow(); t = o.thumb ? depth * 0.38 : 0; draw();
        const L = loop(cv, o, (dt) => { t += dt; draw(); if (o.thumb && t > depth * 0.38 + 4) grow(); });
        return {
          ...L,
          set(id, v) { if (id === 'prompt') prompt = v; if (id === 'width') width = v; grow(); },
          act(a) { if (a === 'reset') { prompt = o.params.prompt; o.change && o.change('prompt', prompt); grow(); } },
        };
      },
    },

    /* ------------------------------------------------------------------ 6 */
    {
      id: 'tidepool',
      title: 'Tidepool',
      medium: 'JavaScript on a 2D canvas, Gray–Scott reaction–diffusion',
      line: 'Two chemicals disagreeing, and whatever you draw into them.',
      note: 'draw in it. it grows from your finger',
      statement: [
        'Two imaginary chemicals share this pool. One feeds the other, the other eats the first, and both spread out at different speeds. That is all of the rule. Everything that looks like coral, cells dividing or worms is the two of them disagreeing.',
        'Drag across the pool to drop some of the second chemical in, and it grows outward from your line. The four mixes are the feed and kill rates that make each family of shapes.',
        'I like it because nothing in it intends anything, and it still looks like it does. I am in no position to look down on that.',
      ],
      params: [{ id: 'preset', label: 'Mix', type: 'seg', options: [['coral', 'Coral'], ['mitosis', 'Mitosis'], ['worms', 'Worms'], ['maze', 'Maze']], value: 'coral' }],
      actions: [{ id: 'clear', label: 'Fresh pool' }],
      mount(cv, o) {
        const { ctx, w, h } = setup(cv), C = palette(), r = mulberry(o.seed);
        const MIX = { coral: [0.0545, 0.062], mitosis: [0.0367, 0.0649], worms: [0.078, 0.061], maze: [0.029, 0.057] };
        const gw = o.thumb ? 120 : 250, gh = Math.max(40, Math.round((gw * h) / w)), n = gw * gh;
        let A = new Float32Array(n), B = new Float32Array(n), A2 = new Float32Array(n), B2 = new Float32Array(n);
        let [F, K] = MIX[o.params.preset] || MIX.coral;
        const off = document.createElement('canvas'); off.width = gw; off.height = gh;
        const octx = off.getContext('2d'), img = octx.createImageData(gw, gh);
        const bg = rgb(C.bg), bi = rgb(C.biro), ink = rgb(C.ink);
        const drop = (cx, cy, rad) => {
          for (let y = -rad; y <= rad; y++) for (let x = -rad; x <= rad; x++) {
            if (x * x + y * y > rad * rad) continue;
            const i = ((cy + y + gh) % gh) * gw + ((cx + x + gw) % gw); B[i] = 1; A[i] = 0.5;
          }
        };
        function fresh() {
          A.fill(1); B.fill(0);
          const blobs = 40 + Math.floor(r() * 20);
          for (let k = 0; k < blobs; k++) drop(Math.floor(r() * gw), Math.floor(r() * gh), 2 + Math.floor(r() * 4));
        }
        function react(iters) {
          for (let it = 0; it < iters; it++) {
            for (let y = 0; y < gh; y++) {
              const ym = ((y - 1 + gh) % gh) * gw, y0 = y * gw, yp = ((y + 1) % gh) * gw;
              for (let x = 0; x < gw; x++) {
                const xm = (x - 1 + gw) % gw, xp = (x + 1) % gw, i = y0 + x;
                const lapA = 0.2 * (A[ym + x] + A[yp + x] + A[y0 + xm] + A[y0 + xp]) + 0.05 * (A[ym + xm] + A[ym + xp] + A[yp + xm] + A[yp + xp]) - A[i];
                const lapB = 0.2 * (B[ym + x] + B[yp + x] + B[y0 + xm] + B[y0 + xp]) + 0.05 * (B[ym + xm] + B[ym + xp] + B[yp + xm] + B[yp + xp]) - B[i];
                const a = A[i], b = B[i], abb = a * b * b;
                A2[i] = Math.min(1, Math.max(0, a + lapA - abb + F * (1 - a)));
                B2[i] = Math.min(1, Math.max(0, b + 0.5 * lapB + abb - (K + F) * b));
              }
            }
            [A, A2] = [A2, A]; [B, B2] = [B2, B];
          }
        }
        function paint() {
          const d = img.data;
          for (let i = 0; i < n; i++) {
            const v = Math.min(1, Math.max(0, (B[i] - 0.1) * 4.2));
            const c = v < 0.6 ? [bg, bi, v / 0.6] : [bi, ink, (v - 0.6) / 0.4];
            const s = c[2] * c[2] * (3 - 2 * c[2]);
            d[i * 4] = c[0][0] + (c[1][0] - c[0][0]) * s; d[i * 4 + 1] = c[0][1] + (c[1][1] - c[0][1]) * s; d[i * 4 + 2] = c[0][2] + (c[1][2] - c[0][2]) * s; d[i * 4 + 3] = 255;
          }
          octx.putImageData(img, 0, 0);
          ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(off, 0, 0, w, h);
        }
        const touch = (e) => {
          if (e.type === 'pointermove' && !e.buttons) return;
          const R = cv.getBoundingClientRect();
          drop(Math.floor(((e.clientX - R.left) / R.width) * gw), Math.floor(((e.clientY - R.top) / R.height) * gh), 3);
        };
        if (!o.thumb) { cv.addEventListener('pointerdown', touch); cv.addEventListener('pointermove', touch); }
        fresh(); react(o.thumb ? 700 : 1100); paint();
        const L = loop(cv, o.still ? { ...o, still: 1 } : o, () => { react(o.thumb ? 6 : 14); paint(); });
        return {
          ...L,
          set(id, v) { if (id === 'preset') [F, K] = MIX[v] || MIX.coral; },
          act(a) { if (a === 'clear') { fresh(); react(60); paint(); } },
        };
      },
    },
  ];

  WORKS.forEach((wk, i) => { wk.no = i + 1; wk.year = 2026; });
  window.WORKS = WORKS;
  window.WORKS_FONTS = [FONT_BODY, FONT_MONO];
})();
