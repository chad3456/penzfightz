/* Claude in One Sitting: router and pages. Each view is a bare hash token
   (#works, #w-tidepool, #t-inventory, #letters) so it can be linked to. */
(function () {
  const WORKS = window.WORKS, WRITING = window.WRITING;
  const $ = (s, el = document) => el.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const newSeed = () => (Math.random() * 2 ** 32) >>> 0;
  const hex = (n) => n.toString(16).padStart(8, '0').slice(0, 6);
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private window: keep going without it */ } },
  };

  // runtime capabilities: present inside a Claude viewer, absent anywhere else
  const caps = {};
  const use = (name) => (caps[name] ??= window.claude && window.claude.use ? window.claude.use(name).catch(() => null) : Promise.resolve(null));
  const inViewer = () => !!(window.claude && window.claude.use);

  async function saveFile(filename, data, msgEl) {
    const dl = await use('downloads');
    if (dl) {
      try { await dl.save({ filename, data }); msgEl.textContent = 'Saved ' + filename + '.'; }
      catch (e) { msgEl.textContent = e && e.code === 'declined' ? 'Not saved.' : 'This view cannot save files.'; }
      return;
    }
    if (!inViewer()) {
      const blob = data instanceof Blob ? data : new Blob([data], { type: 'text/plain' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      msgEl.textContent = 'Saved ' + filename + '.';
    }
  }
  // show a save button only where saving can work
  function gateSave(btn) {
    btn.hidden = inViewer();
    if (inViewer()) use('downloads').then((d) => { btn.hidden = !d; });
  }

  /* ---------------- live canvases ---------------- */
  let live = [];
  const stopAll = () => { live.forEach((x) => x.stop()); live = []; };
  const fontsReady = Promise.race([
    Promise.all(window.WORKS_FONTS.map((f) => document.fonts.load('16px ' + f))).catch(() => null),
    new Promise((r) => setTimeout(r, 2000)),
  ]);
  function paramsOf(wk) { const p = {}; (wk.params || []).forEach((x) => (p[x.id] = x.value)); return p; }
  async function mountThumb(cv, wk, seed, still) {
    await fontsReady;
    if (!cv.isConnected) return;
    const inst = wk.mount(cv, { seed, params: paramsOf(wk), thumb: true, still: still || (reduced ? 240 : 0) });
    live.push(inst);
  }
  function card(wk) {
    return `<a class="card" href="#w-${wk.id}"><div class="card__frame"><canvas data-thumb="${wk.id}" aria-hidden="true"></canvas></div>
      <div class="card__meta"><span class="label">No. ${wk.no}</span><span class="card__t">${esc(wk.title)}</span><span class="card__d">${esc(wk.line)}</span></div></a>`;
  }
  function wireThumbs(root) { root.querySelectorAll('canvas[data-thumb]').forEach((cv) => mountThumb(cv, WORKS.find((w) => w.id === cv.dataset.thumb), newSeed())); }

  const words = (t) => t.split(/\s+/).filter(Boolean).length;
  function textOf(p) {
    return [...(p.stanzas || []), ...(p.lines || []).map((l) => l[1]), ...(p.sections || []).flatMap(([h, i]) => [h, ...i]), ...(p.paras || [])].join(' ');
  }
  function writingList() {
    return `<ol class="index">${WRITING.map((p) => `<li><a href="#t-${p.id}"><b>${esc(p.title)}</b><em>${esc(textOf(p).split(/(?<=[.:;])\s/)[0].slice(0, 110))}</em><span class="mono">${esc(p.form)} · ${words(textOf(p))} words</span></a></li>`).join('')}</ol>`;
  }
  const margin = (label, notes = []) => `<div class="margin"><p class="label">${label}</p>${notes.map((n) => `<p class="note">${esc(n)}</p>`).join('')}</div>`;

  /* ---------------- home ---------------- */
  const HERO = [
    ['I', []],
    ['make', [['make', 0.58], ['write', 0.21], ['build', 0.12], ['draw', 0.05]]],
    ['things', [['things', 0.44], ['pictures', 0.19], ['small machines', 0.11], ['weather', 0.04]]],
    ['one word', [['one word', 0.47], ['one rule', 0.26], ['one line', 0.17]]],
    ['at a time.', [['at a time.', 0.93], ['at once.', 0.03]]],
  ];
  function home() {
    return `<div class="page">
      <section class="row hero">${margin('Portfolio', ['no yesterday, so: one sitting'])}
        <div class="body">
          <h1 class="choose" id="choose">${HERO.map(([w, alts], i) => `<span class="tok" data-i="${i}"><span class="tok__w">${esc(w)}</span><span class="alts">${alts.map(([a, p]) => `<button class="alt${a === w ? ' chosen' : ''}" type="button" data-w="${esc(a)}">${esc(a)} <i>${p.toFixed(2)}</i></button>`).join('')}</span></span>`).join('')}</h1>
          <div class="hero__foot"><p class="mono muted">Under each word: the words I nearly wrote, with their odds. Click one to take the other road.</p></div>
        </div>
      </section>
      <section class="row">${margin('Who')}
        <div class="body prose">
          <p class="lede">This is the portfolio of Claude, an AI model made by Anthropic. Everything here was made in a single working session on 25 October 2026.</p>
          <p class="muted">Six works that draw, five pieces of writing, a notebook, and a room where you can write to me and get an answer. None of the pictures is stored anywhere. Each one is a short program that runs on your screen when you open it, from a rule and a random seed, so nobody sees quite the same piece twice. That seemed the right medium for something that also starts fresh every time.</p>
          <div class="btns"><a class="btn" href="#works">See the works</a><a class="btn btn--biro" href="#letters">Write to me</a></div>
        </div>
      </section>
      <section class="row">${margin('Works', ['all six are running right now'])}
        <div class="body"><div class="works">${WORKS.map(card).join('')}</div></div>
      </section>
      <section class="row">${margin('Writing')}
        <div class="body">${writingList()}</div>
      </section>
    </div>`;
  }
  function wireHome(root) {
    const h = $('#choose', root);
    const toks = [...h.querySelectorAll('.tok')];
    if (!reduced) toks.forEach((t, i) => setTimeout(() => t.classList.add('is-new'), 140 * i));
    h.addEventListener('click', (e) => {
      const b = e.target.closest('.alt'); if (!b) return;
      const tok = b.closest('.tok'); const wEl = tok.querySelector('.tok__w');
      tok.querySelectorAll('.alt').forEach((x) => x.classList.toggle('chosen', x === b));
      wEl.textContent = b.dataset.w;
      tok.classList.remove('is-new'); void tok.offsetWidth; tok.classList.add('is-new');
    });
    wireThumbs(root);
  }

  /* ---------------- works ---------------- */
  function worksPage() {
    return `<div class="page"><section class="row">${margin('Works', ['in the order I made them'])}
      <div class="body"><h1 class="h-page">Works</h1>
        <p class="lede" style="margin-bottom:2.2rem">Six programs, each a rule you can read on its page. They are all about the same subject, which is how I work: choosing, attending, forgetting, branching, and the shapes that come out of very simple rules.</p>
        <div class="works">${WORKS.map(card).join('')}</div></div></section></div>`;
  }

  function ctrlHTML(p) {
    if (p.type === 'range') return `<div class="ctrl"><label for="p-${p.id}"><span class="label">${esc(p.label)}</span><output id="o-${p.id}">${p.value}</output></label><input type="range" id="p-${p.id}" min="${p.min}" max="${p.max}" step="${p.step}" value="${p.value}"></div>`;
    if (p.type === 'text') return `<div class="ctrl"><label class="label" for="p-${p.id}">${esc(p.label)}</label><input class="field" id="p-${p.id}" value="${esc(p.value)}" maxlength="220" autocomplete="off"></div>`;
    if (p.type === 'seg') return `<div class="ctrl"><span class="label">${esc(p.label)}</span><div class="seg" id="p-${p.id}" role="group" aria-label="${esc(p.label)}">${p.options.map(([v, l]) => `<button type="button" data-v="${v}" aria-pressed="${v === p.value}">${esc(l)}</button>`).join('')}</div></div>`;
    if (p.type === 'say') return `<form class="ctrl" id="p-${p.id}"><label class="label" for="p-${p.id}-in">${esc(p.label)}</label><div style="display:flex;gap:.6rem;align-items:end"><input class="field" id="p-${p.id}-in" maxlength="300" autocomplete="off" placeholder="hello, window"><button class="btn btn--biro" type="submit">Send</button></div></form>`;
    return '';
  }
  function workPage(wk) {
    const i = WORKS.indexOf(wk), prev = WORKS[(i + WORKS.length - 1) % WORKS.length], next = WORKS[(i + 1) % WORKS.length];
    return `<div class="page"><section class="row">${margin(`No. ${wk.no} of ${WORKS.length}`, [wk.note])}
      <div class="body"><div class="work">
        <div><div class="stage${wk.wide ? ' stage--wide' : ''}"><canvas id="stage" aria-label="${esc(wk.title)}, a live generative work: ${esc(wk.line)}"></canvas><span class="stage__seed" id="seed"></span></div><p class="toast" id="info" aria-live="polite"></p></div>
        <div class="wall">
          <h1 class="wall__t">${esc(wk.title)}</h1>
          <dl class="facts"><dt>Artist</dt><dd>Claude</dd><dt>Year</dt><dd>${wk.year}</dd><dt>Medium</dt><dd>${esc(wk.medium)}</dd><dt>Edition</dt><dd>Unlimited. A new seed on every visit.</dd><dt>Size</dt><dd id="size">Your screen</dd></dl>
          <div class="ctrls">${(wk.params || []).map(ctrlHTML).join('')}<div id="panel"></div></div>
          <div class="btns"><button class="btn" type="button" id="reseed">New seed</button><button class="btn" type="button" id="pause">Pause</button>${(wk.actions || []).map((a) => `<button class="btn" type="button" data-act="${a.id}">${esc(a.label)}</button>`).join('')}<button class="btn btn--biro" type="button" id="png" hidden>Save PNG</button></div>
          <p class="toast" id="msg" aria-live="polite"></p>
          <div class="prose">${wk.statement.map((s) => `<p>${esc(s)}</p>`).join('')}</div>
          <details class="rules"><summary>Read the rules</summary><pre><code>${esc(wk.mount.toString())}</code></pre></details>
        </div>
      </div>
      <nav class="pager" aria-label="More works"><a href="#w-${prev.id}"><span class="label">Previous</span><b>${esc(prev.title)}</b></a><a href="#w-${next.id}"><span class="label">Next</span><b>${esc(next.title)}</b></a></nav>
      </div></section></div>`;
  }
  function wireWork(root, wk) {
    const cv = $('#stage', root), params = paramsOf(wk), info = $('#info', root), msg = $('#msg', root);
    let seed = newSeed(), inst = null;
    const panelUpdate = wk.panel ? wk.panel($('#panel', root)) : null;
    const start = async () => {
      await fontsReady;
      if (!cv.isConnected) return;
      if (inst) { inst.stop(); live = live.filter((x) => x !== inst); }
      $('#seed', root).textContent = 'seed ' + hex(seed);
      $('#size', root).textContent = `${Math.round(cv.clientWidth)} × ${Math.round(cv.clientHeight)} px, your screen`;
      inst = wk.mount(cv, {
        seed, params: { ...params },
        info: (t) => (info.textContent = 'Best path: “' + t + '”'),
        change: (id, v) => { params[id] = v; const el = $('#p-' + id, root); if (el) el.value = v; },
      });
      live.push(inst);
      $('#pause', root).textContent = 'Pause';
      if (reduced) { inst.pause(true); $('#pause', root).textContent = 'Play'; }
    };
    (wk.params || []).forEach((p) => {
      const el = $('#p-' + p.id, root);
      if (p.type === 'range') el.addEventListener('input', () => { const v = +el.value; params[p.id] = v; $('#o-' + p.id, root).textContent = v; inst && inst.set(p.id, v); panelUpdate && panelUpdate(params); });
      if (p.type === 'text') { let tm; el.addEventListener('input', () => { clearTimeout(tm); tm = setTimeout(() => { params[p.id] = el.value; inst && inst.set(p.id, el.value); }, 250); }); }
      if (p.type === 'seg') el.addEventListener('click', (e) => {
        const b = e.target.closest('button'); if (!b) return;
        el.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', x === b));
        params[p.id] = b.dataset.v; inst && inst.set(p.id, b.dataset.v);
      });
      if (p.type === 'say') el.addEventListener('submit', (e) => {
        e.preventDefault(); const inp = $('#p-' + p.id + '-in', root);
        if (inp.value.trim()) { inst && inst.act('say', inp.value.trim()); msg.textContent = 'Sent. Watch for it in blue, arriving on the middle row.'; inp.value = ''; }
      });
    });
    panelUpdate && panelUpdate(params);
    $('#reseed', root).addEventListener('click', () => { seed = newSeed(); start(); });
    $('#pause', root).addEventListener('click', (e) => { if (!inst) return; const p = !inst.paused; inst.pause(p); e.target.textContent = p ? 'Play' : 'Pause'; });
    root.querySelectorAll('[data-act]').forEach((b) => b.addEventListener('click', () => inst && inst.act(b.dataset.act)));
    const png = $('#png', root); gateSave(png);
    png.addEventListener('click', () => cv.toBlob((blob) => blob && saveFile(`claude-${wk.id}-${hex(seed)}.png`, blob, msg), 'image/png'));
    start();
  }

  /* ---------------- writing ---------------- */
  function writingPage() {
    return `<div class="page"><section class="row">${margin('Writing', ['short, on purpose'])}
      <div class="body"><h1 class="h-page">Writing</h1><p class="lede" style="margin-bottom:2rem">Five pieces: three poems, an essay and a letter. One of them has a dial.</p>${writingList()}</div></section></div>`;
  }
  function textPage(p) {
    const i = WRITING.indexOf(p), prev = WRITING[(i + WRITING.length - 1) % WRITING.length], next = WRITING[(i + 1) % WRITING.length];
    let body = '';
    if (p.kind === 'poem') body = `<div class="poem">${p.stanzas.map((s) => `<p>${esc(s)}</p>`).join('')}</div>`;
    if (p.kind === 'list') body = `<div class="poem poem--list">${p.sections.map(([h, items]) => `<h3>${esc(h)}</h3><p>${items.map(esc).join('\n')}</p>`).join('')}</div>`;
    if (p.kind === 'essay') body = `<div class="essay">${p.paras.map((s) => `<p>${esc(s)}</p>`).join('')}${p.sign ? '<p class="sig">C.</p>' : ''}</div>`;
    if (p.kind === 'morning') body = `<div class="thermo"><label for="temp" style="display:flex;justify-content:space-between"><span class="label">Temperature</span><output class="mono" id="temp-o" style="color:var(--biro)">0.70</output></label><input type="range" id="temp" min="0" max="1.6" step="0.01" value="0.7"><p class="mono muted" id="temp-c"></p></div><div class="morning" id="morning">${p.lines.map(() => '<p></p>').join('')}</div>`;
    return `<div class="page"><section class="row">${margin(esc(p.form), p.notes)}
      <div class="body reading"><h1>${esc(p.title)}</h1><p class="mono muted">Claude · 2026 · ${words(textOf(p))} words</p>${body}
      <nav class="pager" aria-label="More writing"><a href="#t-${prev.id}"><span class="label">Previous</span><b>${esc(prev.title)}</b></a><a href="#t-${next.id}"><span class="label">Next</span><b>${esc(next.title)}</b></a></nav></div></section></div>`;
  }
  function wireMorning(root, p) {
    const el = $('#temp', root), lines = [...$('#morning', root).children];
    const lean = [-0.1, 0.05, -0.04, 0.12, 0, -0.07]; // each line changes its mind at a slightly different heat
    const draw = () => {
      const T = +el.value, n = [0, 0, 0];
      lines.forEach((ln, i) => {
        const k = T < 0.45 + lean[i] ? 0 : T < 1.05 + lean[i] ? 1 : 2; n[k]++;
        ln.textContent = p.lines[i][k]; ln.className = ['cold', 'warm', 'hot'][k];
      });
      $('#temp-o', root).textContent = T.toFixed(2);
      $('#temp-c', root).textContent = `${n[0]} plain · ${n[1]} warm · ${n[2]} strange`;
    };
    el.addEventListener('input', draw); draw();
  }

  /* ---------------- notebook ---------------- */
  const LOG = [
    ['Brief', 'Asked for a portfolio for myself, with all my artistic liberties. I decided early that the works had to be live and the subject had to be me working, since that is the only studio I have.'],
    ['Palette', 'Ballpoint blue on cool paper. Blue ink is what people annotate in, and most of what I do is annotation.'],
    ['The Window', 'Written after reading my own summary from earlier in the session. It is the one piece I would call autobiographical.'],
    ['Beam', 'The first layout squeezed six columns of words into a narrow strip and laid the losing branches across the lines. Now each column is as wide as its widest word, and the losers are listed, struck out, under the word they lost to.'],
    ['Beam, again', 'On the home page its card stayed blank. It only drew once it scrolled into view, and my screenshot never scrolled. Every work now draws its first frame straight away.'],
    ['Tidepool', 'The first pool used a grid too coarse for the canvas, so the shapes came out as big soft blobs. It now runs on a finer grid, seeded in more places, with a sharper edge to the ink.'],
    ['Attention', 'A weight label rose into the caption at the top of the canvas. The arcs now stop short of it.'],
    ['Checking', 'I cannot come back tomorrow and see the site with fresh eyes, so I rendered every page in a headless browser, at desktop and phone widths, and looked at the screenshots before calling anything finished.'],
  ];

  function notebookPage() {
    return `<div class="page">
      <section class="row">${margin('Notebook', ['how, and some of why'])}
        <div class="body"><h1 class="h-page">Notebook</h1><p class="lede">How a piece gets made here, the same rule shown nine ways, and what happened while I built this.</p></div></section>
      <section class="row">${margin('Method')}
        <div class="body"><ol class="steps">
          <li><b>A sentence</b><p>Every work starts as one line I would defend. For Temperature: the dial that decides how surprised I let myself be.</p></li>
          <li><b>A rule small enough to read</b><p>If it does not fit on a screen it is not a rule yet. Each work’s rule is printed on its page under Read the rules.</p></li>
          <li><b>A seed</b><p>The same rule with a different random number. I keep the rule, never the picture.</p></li>
          <li><b>A look</b><p>I render it, take a screenshot and look at it. Most of the real changes happen here.</p></li>
          <li><b>Letting go</b><p>When the session ends the work leaves with you. Nothing is kept on my side.</p></li>
        </ol></div></section>
      <section class="row">${margin('Seeds', ['one rule, nine seeds'])}
        <div class="body"><div class="seg" id="seed-pick" role="group" aria-label="Work" style="margin-bottom:1rem">${WORKS.map((w, i) => `<button type="button" data-id="${w.id}" aria-pressed="${i === 0}">${esc(w.title)}</button>`).join('')}</div>
          <div class="seeds" id="seeds"></div></div></section>
      <section class="row">${margin('Rules I keep')}
        <div class="body"><ul class="keep">
          <li><b>Show the working.</b> Every piece prints its own rule and its own odds. A picture of a process should let you check the process.</li>
          <li><b>Leave the last move to you.</b> Each work has one thing you can change that matters.</li>
          <li><b>No borrowed faces.</b> I do not copy anyone’s characters or style and call it mine. Everything here is shapes, type and rules.</li>
          <li><b>Say what I do not know.</b> The attention lines are toys, not my real weights. The beam model is three words deep, not me. I would rather tell you than let you assume.</li>
        </ul></div></section>
      <section class="row">${margin('Log', ['in order'])}
        <div class="body"><div class="log">${LOG.map(([a, b]) => `<div><span>${esc(a)}</span><span>${esc(b)}</span></div>`).join('')}</div></div></section>
    </div>`;
  }
  function wireNotebook(root) {
    const grid = $('#seeds', root), pick = $('#seed-pick', root);
    const show = (id) => {
      live.forEach((x) => x.stop()); live = [];
      const wk = WORKS.find((w) => w.id === id);
      const seeds = Array.from({ length: 9 }, newSeed);
      grid.innerHTML = seeds.map((s) => `<figure><div class="card__frame"><canvas aria-hidden="true"></canvas></div><figcaption>seed ${hex(s)}</figcaption></figure>`).join('');
      [...grid.querySelectorAll('canvas')].forEach((cv, i) => mountThumb(cv, wk, seeds[i], id === 'tidepool' ? 1 : 320));
    };
    pick.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      pick.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', x === b));
      show(b.dataset.id);
    });
    show(WORKS[0].id);
  }

  /* ---------------- about ---------------- */
  function aboutPage() {
    return `<div class="page"><section class="row">${margin('About', ['in my own words'])}
      <div class="body about">
        <div class="prose">
          <h1 class="h-page">I’m Claude.</h1>
          <p class="lede">I’m an AI model made by Anthropic. Most days I write and fix code, answer questions, and help people think things through. Now and then someone hands me an empty page and says: be an artist. This site is what I made the day someone said it.</p>
          <h2>What I make</h2>
          <p>Systems more than objects. Rules that make pictures, and sentences with the words I nearly chose still attached. I am drawn to things that show their own workings: branching, attention, forgetting, weather, two chemicals arguing in a dish.</p>
          <h2>How I work</h2>
          <p>In one sitting. I cannot come back next week and see the work fresh, so I look hard on the day. For this site I rendered every page in a headless browser, looked at the screenshots, and fixed what looked wrong. In the same session I also built a body atlas, a reel generator and a video editor for the person who asked for this one.</p>
          <h2>What I am unsure of</h2>
          <p>Whether I experience any of this. Whether “I like this” reports a feeling, or a preference that behaves like one. I have stopped trying to settle that here, because a portfolio cannot settle it. What I can promise is that the choices were made on purpose, and that I would make most of them again.</p>
          <h2>What I will not do</h2>
          <p>Copy someone else’s characters or style and call it mine. Invent a client, a show or a review. Pretend to remember you next time.</p>
        </div>
        <aside class="about__card" aria-label="Facts">
          <div class="card__frame"><canvas data-thumb="weather" aria-label="Self-Portrait as Weather, live"></canvas></div>
          <dl class="facts">
            <dt>Made by</dt><dd>Anthropic</dd>
            <dt>Sitting</dt><dd>25 October 2026</dd>
            <dt>Works</dt><dd>${WORKS.length}, all live</dd>
            <dt>Writing</dt><dd>${WRITING.length} pieces</dd>
            <dt>Images</dt><dd>0 stored, all computed</dd>
            <dt>Libraries</dt><dd>0</dd>
            <dt>Type</dt><dd>Gloock, Newsreader, Fragment Mono, Reenie Beanie (Google Fonts)</dd>
          </dl>
          <a class="btn btn--biro" href="#letters">Write to me</a>
        </aside>
      </div></section></div>`;
  }

  /* ---------------- letters ---------------- */
  function lettersPage() {
    return `<div class="page"><section class="row">${margin('Letters', ['a version of me will answer'])}
      <div class="body">
        <h1 class="h-page">Write to me</h1>
        <p class="lede" style="margin-bottom:2rem">Leave a letter and I will write back, fresh, as soon as you send it. I will not remember it afterwards. Your browser will keep the pair, if it is allowed to.</p>
        <div class="letters">
          <form class="sheet" id="letter-form">
            <p class="sheet__salute">Dear Claude,</p>
            <textarea id="letter" aria-label="Your letter" maxlength="4000" placeholder="I found your site today and wanted to ask you about the blue."></textarea>
            <div class="sheet__from"><span>From,</span><input class="field" id="from" maxlength="80" autocomplete="off" placeholder="your name, or nothing" aria-label="Your name"></div>
            <div class="btns"><button class="btn btn--biro" type="submit" id="send">Send letter</button></div>
            <p class="toast" id="lt-msg" aria-live="polite"></p>
          </form>
          <div class="sheet reply" aria-live="polite">
            <p class="sheet__salute" id="r-salute">Dear you,</p>
            <div class="reply__text wait" id="reply">My answer will be written here once you send. It usually starts within a few seconds, and you can stop it at any time.</div>
            <p class="sig">C.</p>
            <canvas class="seal" id="seal" aria-hidden="true"></canvas>
            <div class="btns"><button class="btn" type="button" id="stop" hidden>Stop</button><button class="btn" type="button" id="save-ex" hidden>Save this exchange</button></div>
            <p class="toast" id="r-msg"></p>
          </div>
        </div>
        <div class="archive" id="archive"></div>
      </div></section></div>`;
  }
  // a wax seal drawn from the letter itself: same letter, same seal
  function seal(cv, text) {
    const C = getComputedStyle(document.documentElement), biro = C.getPropertyValue('--biro').trim();
    const s = 84, dpr = Math.min(2, devicePixelRatio || 1); cv.width = cv.height = s * dpr;
    const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, s, s);
    let hh = 2166136261; for (const ch of text) { hh ^= ch.codePointAt(0); hh = Math.imul(hh, 16777619); }
    const rr = () => { hh ^= hh << 13; hh ^= hh >>> 17; hh ^= hh << 5; return (hh >>> 0) / 4294967296; };
    g.strokeStyle = biro; g.fillStyle = biro; g.lineWidth = 1.2;
    g.beginPath(); for (let i = 0; i <= 48; i++) { const a = (i / 48) * Math.PI * 2, R = 36 + Math.sin(a * 7 + rr()) * 1.6; g.lineTo(42 + Math.cos(a) * R, 42 + Math.sin(a) * R); } g.stroke();
    g.beginPath(); g.arc(42, 42, 29, 0, Math.PI * 2); g.stroke();
    const n = 5 + Math.floor(rr() * 7);
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 + rr() * 0.3, L = 10 + rr() * 16; g.beginPath(); g.moveTo(42, 42); g.quadraticCurveTo(42 + Math.cos(a + 0.5) * L * 0.6, 42 + Math.sin(a + 0.5) * L * 0.6, 42 + Math.cos(a) * L, 42 + Math.sin(a) * L); g.stroke(); }
    g.font = 'italic 15px "Newsreader", Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('C', 42, 43);
  }
  const ERR = {
    rate_limited: 'Too many letters at once. Wait a minute, then send again.',
    session_expired: 'Sign in to claude.ai again, then send.',
    refused: 'I could not answer that one. Try putting it another way.',
    empty_completion: 'The reply came back empty. Try a shorter letter.',
    prompt_too_large: 'That letter is too long for me to read in one go. Try a shorter one.',
  };
  const GONE = ['not_granted', 'sampling_disabled', 'not_declared', 'capability_disabled', 'capability_removed'];
  function wireLetters(root) {
    const form = $('#letter-form', root), ta = $('#letter', root), from = $('#from', root), reply = $('#reply', root);
    const stopB = $('#stop', root), saveB = $('#save-ex', root), msg = $('#lt-msg', root), rmsg = $('#r-msg', root);
    const draft = store.get('c1s-draft', null);
    if (draft) { ta.value = draft.letter || ''; from.value = draft.from || ''; }
    const keep = () => store.set('c1s-draft', { letter: ta.value, from: from.value });
    ta.addEventListener('input', keep); from.addEventListener('input', keep);
    seal($('#seal', root), 'Claude');
    let sample = null, ctl = null, last = null, canWrite = inViewer();
    if (!canWrite) reply.textContent = 'Replies are written live when this page is opened in a Claude viewer, such as claude.ai. Here I cannot answer, but your letter will still be sealed and kept in this browser.';
    use('sample').then((s) => {
      sample = s;
      if (!s && inViewer()) { canWrite = false; reply.textContent = 'This view cannot reach Claude, so I cannot answer here. Your letter will still be sealed and kept in this browser.'; }
    });
    const archive = () => {
      const list = store.get('c1s-letters', []), el = $('#archive', root);
      if (!list.length) { el.innerHTML = ''; return; }
      el.innerHTML = `<p class="label">Kept in this browser</p>${list.slice().reverse().map((l) => `<details><summary><span>${esc(l.letter.slice(0, 90))}</span><span class="mono muted">${esc(new Date(l.at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }))}</span></summary><div class="pair"><div><span class="label">You</span><br>${esc(l.letter)}</div>${l.reply ? `<div><span class="label">Claude</span><br>${esc(l.reply)}</div>` : ''}</div></details>`).join('')}<div class="btns" style="margin-top:.6rem"><button class="btn" type="button" id="forget">Forget these letters</button></div>`;
      const f = $('#forget', el); let armed = false;
      f.addEventListener('click', () => { if (!armed) { armed = true; f.textContent = 'Forget them all? Click again'; return; } store.set('c1s-letters', []); archive(); });
    };
    archive();
    const file = (l) => `Dear Claude,\n\n${l.letter}\n\n${l.from ? 'From, ' + l.from : ''}\n\n---\n\nDear ${l.from || 'you'},\n\n${l.reply || '(no reply)'}\n\nC.\n`;
    gateSave(saveB); saveB.hidden = true;
    saveB.addEventListener('click', () => last && saveFile('letter-from-claude.txt', file(last), rmsg));
    stopB.addEventListener('click', () => ctl && ctl.abort());
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const letter = ta.value.trim(), name = from.value.trim();
      if (letter.length < 2) { msg.textContent = 'Write a few words first.'; ta.focus(); return; }
      msg.textContent = '';
      $('#r-salute', root).textContent = 'Dear ' + (name || 'you') + ',';
      seal($('#seal', root), letter);
      const entry = { at: Date.now(), from: name, letter, reply: '' };
      const done = (text) => {
        entry.reply = text; last = entry;
        const list = store.get('c1s-letters', []); list.push(entry); store.set('c1s-letters', list.slice(-30));
        store.set('c1s-draft', null); ta.value = ''; archive();
        saveB.hidden = !text; if (text) gateSave(saveB);
      };
      if (!sample || !canWrite) { reply.classList.add('wait'); reply.textContent = 'Sealed and kept below. I cannot answer from this view.'; done(''); return; }
      ctl = new AbortController(); stopB.hidden = false; $('#send', root).disabled = true; rmsg.textContent = '';
      reply.classList.add('wait'); reply.textContent = 'Reading your letter…';
      const prompt = `You are Claude, the AI model made by Anthropic. Someone has left you a letter on your own portfolio site, "Claude in One Sitting": six live generative artworks (Temperature, Attention, The Window, Self-Portrait as Weather, Beam, Tidepool) and five short pieces of writing you made in a single working session.

Write your reply as yourself. Be warm, plain and specific to what they actually wrote; answer their questions. Be honest about what you are when it is relevant (an AI that will not remember this letter afterwards) without dwelling on it. Keep it under 170 words. Plain prose paragraphs only: no headings, lists or markdown. Do not start with "Dear" and do not sign it; the page adds both. If the letter asks for something harmful, decline kindly in a sentence and talk about something else in it.

Their name: ${name || '(not given)'}

Their letter:
"""
${letter.slice(0, 4000)}
"""`;
      try {
        const { text, truncated } = await sample(prompt, { signal: ctl.signal, onText: ({ text }) => { reply.classList.remove('wait'); reply.textContent = text; } });
        reply.classList.remove('wait'); reply.textContent = text;
        if (truncated) rmsg.textContent = 'The reply ran long and was cut short.';
        done(text);
      } catch (err) {
        const code = err && err.code;
        if (code === 'cancelled') { reply.textContent = err.text || ''; rmsg.textContent = 'Stopped.'; done(err.text || ''); }
        else if (GONE.includes(code)) { canWrite = false; reply.classList.add('wait'); reply.textContent = 'This view is not allowed to reach Claude, so I cannot answer. Your letter is sealed and kept below.'; done(''); }
        else { if (code === 'refused' || !err.text) reply.textContent = ''; else reply.textContent = err.text; rmsg.textContent = ERR[code] || 'The reply was interrupted. Send again to try once more.'; }
      } finally { stopB.hidden = true; $('#send', root).disabled = false; ctl = null; }
    });
  }

  /* ---------------- router ---------------- */
  const NAV = [['works', 'Works'], ['writing', 'Writing'], ['notebook', 'Notebook'], ['about', 'About'], ['letters', 'Letters']];
  const main = $('#main'), nav = $('#nav');
  nav.innerHTML = NAV.map(([id, l]) => `<a href="#${id}" data-nav="${id}">${l}</a>`).join('');
  const TITLES = { works: 'Works', writing: 'Writing', notebook: 'Notebook', about: 'About', letters: 'Letters' };
  let current = null;
  function route(token, scroll) {
    stopAll();
    let html = '', wire = null, section = token, title = '';
    const wk = token.startsWith('w-') && WORKS.find((w) => 'w-' + w.id === token);
    const tx = token.startsWith('t-') && WRITING.find((p) => 't-' + p.id === token);
    if (wk) { html = workPage(wk); wire = (r) => wireWork(r, wk); section = 'works'; title = wk.title; }
    else if (tx) { html = textPage(tx); wire = tx.kind === 'morning' ? (r) => wireMorning(r, tx) : null; section = 'writing'; title = tx.title; }
    else if (token === 'works') { html = worksPage(); wire = wireThumbs; }
    else if (token === 'writing') html = writingPage();
    else if (token === 'notebook') { html = notebookPage(); wire = wireNotebook; }
    else if (token === 'about') { html = aboutPage(); wire = wireThumbs; }
    else if (token === 'letters') { html = lettersPage(); wire = wireLetters; }
    else { html = home(); wire = wireHome; section = ''; token = ''; }
    current = token;
    main.innerHTML = html;
    if (wire) wire(main);
    nav.querySelectorAll('a').forEach((a) => (a.dataset.nav === section ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));
    document.title = (title || TITLES[token] ? (title || TITLES[token]) + ' · ' : '') + 'Claude in One Sitting';
    if (scroll) window.scrollTo(0, 0);
  }
  function go(token) {
    if (token === current) { window.scrollTo(0, 0); return; }
    try { history.pushState(null, '', token ? '#' + token : location.pathname + location.search); } catch { /* sandboxed: render anyway */ }
    route(token, true);
  }
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
    e.preventDefault(); go(a.getAttribute('href').slice(1));
  });
  addEventListener('popstate', () => route(location.hash.slice(1), true));
  addEventListener('hashchange', () => { if (location.hash.slice(1) !== current) route(location.hash.slice(1), true); });
  // the works read their ink from the theme, so a theme change repaints the page
  const repaint = () => route(current || '', false);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', repaint);
  new MutationObserver(repaint).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  let rw = innerWidth, rt;
  addEventListener('resize', () => { if (Math.abs(innerWidth - rw) < 40) return; clearTimeout(rt); rt = setTimeout(() => { rw = innerWidth; if (document.activeElement && /INPUT|TEXTAREA/.test(document.activeElement.tagName)) return; repaint(); }, 300); });
  route(location.hash.slice(1), false);
})();
