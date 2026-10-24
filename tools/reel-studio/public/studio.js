import { compile, FRAMES, FX, LAYOUTS, STYLES } from './director.js';

const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const S = { status: {}, project: null, info: null, voice: null, audio: null, playing: false, t: 0, startedAt: 0, pick: null, loadSeq: 0 };

async function api(method, url, body, headers = {}) {
  const isBin = body instanceof Blob || body instanceof ArrayBuffer;
  const r = await fetch(url, { method, headers: isBin ? headers : { 'content-type': 'application/json', ...headers }, body: body == null ? undefined : isBin ? body : JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || `${r.status}`);
  return j;
}
const debounce = (fn, ms) => { let h; return (...a) => { clearTimeout(h); h = setTimeout(() => fn(...a), ms); }; };
function toast(el, msg, err = false) { el.textContent = msg; el.className = 'hint' + (err ? ' err' : ''); }

// ---------- jobs ----------
function follow(job, box, done) {
  box.hidden = false; box.className = 'job';
  const draw = (j) => {
    const pct = Math.round((j.progress || 0) * 100);
    box.className = 'job' + (j.status === 'error' ? ' err' : '');
    box.innerHTML = `<b>${esc({ write: 'Writing', research: 'Researching', voice: 'Recording voice', render: 'Rendering' }[j.kind] || j.kind)}</b> · ${j.status === 'running' ? (pct ? pct + '%' : 'working…') : j.status === 'done' ? 'done' : 'failed'}
      <div class="bar ${j.status === 'running' && !pct ? 'busy' : ''}"><i style="width:${j.status === 'done' ? 100 : pct}%"></i></div>
      ${j.error ? `<div>${esc(j.error)}</div>` : ''}<ol>${j.log.map((l) => `<li>${esc(l)}</li>`).join('')}</ol>`;
  };
  draw(job);
  const es = new EventSource(`/api/jobs/${job.id}/events`);
  es.onmessage = (e) => { const j = JSON.parse(e.data); draw(j); if (j.status !== 'running') { es.close(); done && done(j); } };
  es.onerror = () => es.close();
}

// ---------- status and projects ----------
async function boot() {
  S.status = await api('GET', '/api/status');
  $('#chips').innerHTML = `<span class="chip ${S.status.claude ? 'ok' : 'warn'}" title="${S.status.claude ? 'Claude writes and researches scripts' : 'Set ANTHROPIC_API_KEY (or run ant auth login) and restart to let Claude research and write'}">${S.status.claude ? '✓ Claude ' + esc(S.status.model) : 'Offline drafts (no Claude key)'}</span><span class="chip ${S.status.voice ? 'ok' : 'warn'}">${S.status.voice ? '✓ voice ready' : 'voice downloads on first use'}</span>`;
  $('#researchBtn').disabled = !S.status.claude;
  $('#researchBtn').title = S.status.claude ? 'Claude searches the web and adds research notes as a source' : 'Needs an Anthropic API key';
  $('#writeBtn').textContent = S.status.claude ? '✨ Write the script with Claude' : '✨ Write an offline draft';
  $('#writeHint').textContent = S.status.claude ? 'Claude reads your sources, checks facts and plans every shot. Archival photos are found automatically.' : 'Without a Claude key the draft is picked out of your sources — rewrite it in your own words, or use your own narration.';
  $('#provs').innerHTML = S.status.providers.map((p) => `<label><input type="checkbox" value="${p}" checked> ${({ wikimedia: 'Wikimedia Commons', openverse: 'Openverse', loc: 'Library of Congress', met: 'The Met', aic: 'Art Institute of Chicago', nasa: 'NASA' })[p] || p}</label>`).join('');
  const list = await api('GET', '/api/projects');
  if (!list.length) list.push(await api('POST', '/api/projects', { topic: '', title: 'My first reel' }));
  const want = new URLSearchParams(location.search).get('p') || localStorage.getItem('reel-studio:last') || list[0].id;
  fillProjects(list, list.some((p) => p.id === want) ? want : list[0].id);
  await open(list.some((p) => p.id === want) ? want : list[0].id);
}
function fillProjects(list, cur) { $('#projSel').innerHTML = list.map((p) => `<option value="${p.id}" ${p.id === cur ? 'selected' : ''}>${esc(p.title || p.topic || p.id)}</option>`).join(''); }
async function open(id) {
  S.project = await api('GET', `/api/projects/${id}`);
  try { localStorage.setItem('reel-studio:last', id); } catch {}
  $('#topic').value = S.project.topic || ''; $('#angle').value = S.project.angle || '';
  segSet('#lenSeg', String(S.project.seconds || 60)); segSet('#lookSeg', S.project.look || 'archival');
  $('#result').hidden = true; $('#mediaJob').hidden = true; $('#writeJob').hidden = true;
  drawSources(); drawBoard(); drawLibrary();
  S.t = 0.6; // everything is mid-entrance at 0:00
  await loadVoice(); refresh();
  if (S.project.plan) tab('board');
}
const saveMeta = debounce(async () => {
  const p = S.project;
  const b = { topic: $('#topic').value.trim(), angle: $('#angle').value.trim(), seconds: +segGet('#lenSeg'), look: segGet('#lookSeg') };
  if (!p.title || p.title === 'New reel' || p.title === 'My first reel' || p.title === p.topic) b.title = b.topic || p.title;
  Object.assign(p, await api('PUT', `/api/projects/${p.id}`, b));
  const o = $(`#projSel option[value="${p.id}"]`); if (o) o.textContent = p.title;
  refresh();
}, 500);
const savePlan = debounce(() => api('PUT', `/api/projects/${S.project.id}`, { plan: S.project.plan }).catch((e) => console.error(e)), 600);

function segSet(sel, v) { $(sel).querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.v === v)); }
function segGet(sel) { return $(sel).querySelector('button.on')?.dataset.v; }

// ---------- sources ----------
function drawSources() {
  const p = S.project;
  $('#sourceList').innerHTML = p.sources.map((s) => `<li class="src" data-id="${s.id}">
    <div class="h"><span class="kind ${s.kind}">${esc(s.kind)}</span><span class="t" title="${esc(s.title)}">${esc(s.title)}${s.author ? ` <small>— ${esc(s.author)}</small>` : ''}</span><span class="n">${(s.kind === 'epub' ? chapterWords(s) : s.words || 0).toLocaleString()} words</span><button class="del" title="Remove">✕</button></div>
    ${s.kind === 'epub' ? `<div class="chtools"><span>${s.selected.length} of ${s.chapters.length} chapters</span><button data-all>all</button><button data-none>none</button>${s.rights ? `<span title="${esc(s.rights)}">rights: ${esc(s.rights.slice(0, 50))}${s.rights.length > 50 ? '…' : ''}</span>` : ''}</div>
      <div class="chapters">${s.chapters.map((c) => `<label><input type="checkbox" value="${c.id}" ${s.selected.includes(c.id) ? 'checked' : ''}>${esc(c.title)}<span class="w">${c.words.toLocaleString()}</span></label>`).join('')}</div>`
      : `<p class="pv">${esc(s.preview || '')}</p>${s.links?.length ? `<p class="pv">${s.links.length} links: ${s.links.slice(0, 3).map((l) => esc(new URL(l.url).host)).join(', ')}…</p>` : ''}`}
  </li>`).join('') || '<li class="hint">No sources yet. Add a link, an EPUB, Wikipedia or notes — or skip straight to your own narration.</li>';
}
function chapterWords(s) { const set = new Set(s.selected); return s.chapters.filter((c) => set.has(c.id)).reduce((a, c) => a + c.words, 0); }
$('#sourceList').addEventListener('click', async (e) => {
  const li = e.target.closest('.src'); if (!li) return;
  const s = S.project.sources.find((x) => x.id === li.dataset.id);
  if (e.target.matches('.del')) { S.project = await api('DELETE', `/api/projects/${S.project.id}/sources/${s.id}`); drawSources(); }
  if (e.target.matches('[data-all],[data-none]')) { s.selected = e.target.matches('[data-all]') ? s.chapters.map((c) => c.id) : []; await api('PATCH', `/api/projects/${S.project.id}/sources/${s.id}`, { selected: s.selected }); drawSources(); }
});
$('#sourceList').addEventListener('change', async (e) => {
  const li = e.target.closest('.src'); if (!li || !e.target.matches('.chapters input')) return;
  const s = S.project.sources.find((x) => x.id === li.dataset.id);
  s.selected = [...li.querySelectorAll('.chapters input:checked')].map((x) => x.value);
  await api('PATCH', `/api/projects/${S.project.id}/sources/${s.id}`, { selected: s.selected });
  li.querySelector('.n').textContent = `${chapterWords(s).toLocaleString()} words`; li.querySelector('.chtools span').textContent = `${s.selected.length} of ${s.chapters.length} chapters`;
});
async function addSource(path, body, btn) {
  const old = btn?.textContent; if (btn) { btn.disabled = true; btn.textContent = 'adding…'; }
  try { S.project = await api('POST', `/api/projects/${S.project.id}/sources/${path}`, body); drawSources(); toast($('#writeHint'), 'Source added.'); }
  catch (e) { toast($('#writeHint'), e.message, true); }
  finally { if (btn) { btn.disabled = false; btn.textContent = old; } }
}
$('#urlBtn').onclick = () => { const u = $('#urlIn').value.trim(); if (u) addSource('url', { url: u }, $('#urlBtn')).then(() => ($('#urlIn').value = '')); };
$('#wikiBtn').onclick = () => addSource('wikipedia', { topic: $('#topic').value.trim() || S.project.topic }, $('#wikiBtn'));
$('#notesBtn').onclick = () => { const t = $('#notesIn').value.trim(); if (t) addSource('text', { title: t.split('\n')[0].slice(0, 60), text: t }, $('#notesBtn')).then(() => ($('#notesIn').value = '')); };
$('#researchBtn').onclick = async () => { const j = await api('POST', `/api/projects/${S.project.id}/research`); follow(j, $('#writeJob'), async () => { S.project = await api('GET', `/api/projects/${S.project.id}`); drawSources(); }); };
async function uploadEpub(file) {
  if (!file) return;
  toast($('#writeHint'), `reading ${file.name}…`);
  try { const r = await api('POST', `/api/projects/${S.project.id}/sources/epub`, file, { 'x-filename': encodeURIComponent(file.name) }); S.project = await api('GET', `/api/projects/${S.project.id}`); drawSources(); drawLibrary(); toast($('#writeHint'), `Added “${r.sources.at(-1).title}”. Tick the chapters the reel should draw on.`); }
  catch (e) { toast($('#writeHint'), e.message, true); }
}
$('#epubIn').onchange = (e) => uploadEpub(e.target.files[0]);
const drop = $('#epubDrop');
drop.ondragover = (e) => { e.preventDefault(); drop.classList.add('over'); };
drop.ondragleave = () => drop.classList.remove('over');
drop.ondrop = (e) => { e.preventDefault(); drop.classList.remove('over'); uploadEpub(e.dataTransfer.files[0]); };

$('#writeBtn').onclick = async () => {
  if (!$('#topic').value.trim()) { toast($('#writeHint'), 'Say what the reel is about first.', true); $('#topic').focus(); return; }
  await api('PUT', `/api/projects/${S.project.id}`, { topic: $('#topic').value.trim(), angle: $('#angle').value.trim(), seconds: +segGet('#lenSeg'), look: segGet('#lookSeg') });
  const j = await api('POST', `/api/projects/${S.project.id}/write`, {});
  follow(j, $('#writeJob'), (done) => afterWrite(done));
};
async function afterWrite(j) {
  if (j.status !== 'done') return;
  S.project = await api('GET', `/api/projects/${S.project.id}`);
  drawBoard(); drawLibrary(); await loadVoice(); refresh(); tab('board');
  if (j.result.corrections?.length) $('#board').insertAdjacentHTML('afterbegin', `<div class="corr"><b>Fixed in the brief:</b> ${j.result.corrections.map(esc).join(' · ')}</div>`);
}
$('#ownBtn').onclick = () => { $('#ownText').value = S.project.plan ? S.project.plan.lines.map((l) => l.say).join(' ') : ''; $('#own').showModal(); };
$('#ownGo').onclick = async () => {
  const text = $('#ownText').value.trim(); if (!text) return;
  $('#own').close();
  const j = await api('POST', `/api/projects/${S.project.id}/plan-from-text`, { text });
  tab('sources'); follow(j, $('#writeJob'), afterWrite);
};

// ---------- storyboard ----------
const EXTRA = { count: [['number', 'Number'], ['label', 'Label']], definition: [['definition', 'Meaning']], stamp: [['stamp', 'Stamp text']], chat: [['bubbles', 'Bubbles (one per line)', 'list']], note: [['note', 'Notebook lines (one per line)', 'list']] };
const PHOTO_LAYOUTS = ['window', 'tvphoto', 'polaroid', 'stack', 'cutout', 'stamp'];
function drawBoard() {
  const plan = S.project.plan;
  if (!plan) { $('#board').innerHTML = '<p class="hint">No script yet — write one on the first tab.</p>'; return; }
  let g = 0;
  $('#board').innerHTML = plan.lines.map((ln, li) => `<div class="line" data-li="${li}">
    <div class="lh"><span class="num">${li + 1}</span><textarea class="say" rows="2" data-f="say">${esc(ln.say)}</textarea>
      <div class="tools"><button data-act="up" title="Move up">↑</button><button data-act="down" title="Move down">↓</button><button data-act="del" title="Delete line">✕</button></div></div>
    <input class="speak" data-f="speak" placeholder="Pronounce as (optional), e.g. eighteen sixteen" value="${esc(ln.speak || '')}">
    <div class="shots">${ln.shots.map((s, si) => shotCard(s, li, si, g++)).join('')}<button class="addshot" data-act="addshot" title="Add a shot">＋</button></div>
  </div>`).join('');
}
function shotCard(s, li, si, gi) {
  const ph = s.photo?.file ? S.project.photos.find((x) => x.file === s.photo.file) : null;
  const extra = (EXTRA[s.layout] || []).map(([k, label, type]) => type === 'list'
    ? `<textarea rows="2" data-s="${k}" placeholder="${label}">${esc((s[k] || []).join('\n'))}</textarea>`
    : `<input data-s="${k}" placeholder="${label}" value="${esc(s[k] || '')}">`).join('');
  return `<div class="shot" data-si="${si}" data-gi="${gi}">
    <button class="x" data-act="delshot" title="Delete shot">✕</button>
    <div class="sh"><b>Shot ${gi + 1}</b> · words <input type="number" min="1" class="words" data-s="words" value="${s.words || 1}" title="How many spoken words this shot lasts"></div>
    <select data-s="layout">${LAYOUTS.map((l) => `<option ${l === s.layout ? 'selected' : ''}>${l}</option>`).join('')}</select>
    <input class="hl" data-s="headline" placeholder="Loud word on screen" value="${esc(s.headline || '')}">
    <select data-s="style"><option value="">style: auto</option>${STYLES.map((x) => `<option ${x === s.style ? 'selected' : ''}>${x}</option>`).join('')}</select>
    <input data-s="stickers" placeholder="stickers: money bag, books" value="${esc((s.stickers || []).join(', '))}">
    ${extra}
    ${PHOTO_LAYOUTS.includes(s.layout) || s.photo ? `<div class="ph"><button class="thumb" data-act="photo" title="Choose photo" style="${ph ? `background-image:url('/p/${S.project.id}/media/${encodeURIComponent(ph.file)}')` : ''}">${ph ? '' : '📷'}</button>
      <div class="meta">${ph ? esc(ph.title).slice(0, 40) : s.photo?.query ? `wanted: “${esc(s.photo.query)}”` : 'no photo'}${s.photo?.fx ? `<br>${s.photo.fx}${s.photo.frame ? ' · ' + s.photo.frame : ''}` : ''}</div></div>` : ''}
  </div>`;
}
const board = $('#board');
board.addEventListener('input', (e) => {
  const lineEl = e.target.closest('.line'); if (!lineEl) return;
  const ln = S.project.plan.lines[+lineEl.dataset.li];
  if (e.target.dataset.f) { ln[e.target.dataset.f] = e.target.value; if (!ln.speak) delete ln.speak; }
  const shotEl = e.target.closest('.shot');
  if (shotEl && e.target.dataset.s) {
    const s = ln.shots[+shotEl.dataset.si], k = e.target.dataset.s, v = e.target.value;
    if (k === 'words') s.words = Math.max(1, +v || 1);
    else if (k === 'stickers') s.stickers = v.split(',').map((x) => x.trim()).filter(Boolean);
    else if (k === 'bubbles' || k === 'note') s[k] = v.split('\n').map((x) => x.trim()).filter(Boolean);
    else if (v) s[k] = v; else delete s[k];
  }
  savePlan(); refreshSoon();
});
board.addEventListener('change', (e) => { if (e.target.dataset.s === 'layout') drawBoard(); });
board.addEventListener('click', (e) => {
  const act = e.target.closest('[data-act]')?.dataset.act; if (!act) return;
  const lines = S.project.plan.lines, li = +e.target.closest('.line').dataset.li, si = +e.target.closest('.shot')?.dataset.si;
  if (act === 'photo') return openPicker(li, si);
  if (act === 'up' && li > 0) [lines[li - 1], lines[li]] = [lines[li], lines[li - 1]];
  if (act === 'down' && li < lines.length - 1) [lines[li + 1], lines[li]] = [lines[li], lines[li + 1]];
  if (act === 'del' && confirm('Delete this line?')) lines.splice(li, 1);
  if (act === 'addshot') lines[li].shots.push({ words: 2, layout: 'window', headline: '', stickers: [] });
  if (act === 'delshot' && lines[li].shots.length > 1) lines[li].shots.splice(si, 1);
  drawBoard(); savePlan(); refresh();
});
$('#addLineBtn').onclick = () => {
  S.project.plan ||= { title: S.project.title, lines: [] };
  S.project.plan.lines.push({ say: 'A new line to say.', shots: [{ words: 5, layout: 'window', headline: 'new', stickers: ['sparkles'] }] });
  drawBoard(); savePlan(); refresh();
  board.lastElementChild?.querySelector('textarea')?.focus();
};

// ---------- photos ----------
function photoCard(p, kind) {
  const src = kind === 'lib' ? `/p/${S.project.id}/media/${encodeURIComponent(p.file)}` : p.thumb;
  return `<button class="ph-card" data-id="${esc(p.id)}" data-kind="${kind}" title="${esc(`${p.title || ''}\n${p.creator || ''} ${p.date || ''}\n${p.provider || ''} · ${p.license || ''}`)}">
    <img src="${esc(src)}" alt="" loading="lazy"><span class="cap"><b>${esc(p.title || p.file)}</b>${esc(p.provider || '')}<br><span class="lic ${kind === 'res' && !p.open ? 'no' : ''}">${esc((p.license || '').slice(0, 26))}</span></span></button>`;
}
function drawLibrary() { $('#library').innerHTML = S.project.photos.map((p) => photoCard(p, 'lib')).join('') || '<p class="hint">No photos yet. Search above, upload your own, or add an illustrated EPUB.</p>'; }
async function searchPhotos(q, out, msg) {
  if (!q) return;
  toast(msg, 'searching…'); out.innerHTML = '';
  const provs = [...$('#provs').querySelectorAll('input:checked')].map((x) => x.value).join(',');
  try {
    const r = await api('GET', `/api/photos/search?q=${encodeURIComponent(q)}&providers=${provs}`);
    S.results = r.results;
    out.innerHTML = r.results.map((p) => photoCard(p, 'res')).join('');
    toast(msg, `${r.results.length} photos${r.errors.length ? ` · unreachable: ${r.errors.map((e) => e.split(':')[0]).join(', ')}` : ''}${!r.results.length && r.errors.length ? ' — check your internet connection' : ''}`, !r.results.length);
  } catch (e) { toast(msg, e.message, true); }
}
async function addResult(id) {
  const p = (S.results || []).find((x) => x.id === id);
  if (!p) return null;
  if (!p.open && !confirm(`The licence for this photo is “${p.license}”. Use it only if you have the right to. Add it?`)) return null;
  const r = await api('POST', `/api/projects/${S.project.id}/photos`, p);
  S.project.photos = r.photos; drawLibrary();
  return r.photo;
}
$('#photoGo').onclick = () => searchPhotos($('#photoQ').value.trim(), $('#photoResults'), $('#photoMsg'));
$('#photoQ').onkeydown = (e) => e.key === 'Enter' && $('#photoGo').click();
$('#photoResults').onclick = async (e) => { const c = e.target.closest('.ph-card'); if (!c) return; try { const ph = await addResult(c.dataset.id); if (ph) toast($('#photoMsg'), `Added “${ph.title}” to the library.`); } catch (err) { toast($('#photoMsg'), err.message, true); } };
$('#photoUp').onchange = async (e) => { for (const f of e.target.files) { const r = await api('POST', `/api/projects/${S.project.id}/photos/upload`, f, { 'x-filename': encodeURIComponent(f.name) }); S.project.photos = r.photos; } drawLibrary(); };

// picker for one shot
$('#pickFx').innerHTML = `<option value="">auto (${'look'})</option>` + FX.map((f) => `<option>${f}</option>`).join('');
$('#pickFrame').innerHTML = '<option value="">auto</option>' + FRAMES.map((f) => `<option>${f}</option>`).join('');
function openPicker(li, si) {
  S.pick = { li, si };
  const s = S.project.plan.lines[li].shots[si];
  $('#pickQ').value = s.photo?.query || s.headline || S.project.topic || '';
  $('#pickFx').value = s.photo?.fx || ''; $('#pickFrame').value = s.photo?.frame || '';
  $('#pickLib').innerHTML = S.project.photos.map((p) => photoCard(p, 'lib')).join('') || '<p class="hint">Library is empty.</p>';
  $('#pickRes').innerHTML = ''; toast($('#pickMsg'), '');
  $('#picker').showModal();
}
function setShotPhoto(file) {
  const s = S.project.plan.lines[S.pick.li].shots[S.pick.si];
  if (!file) delete s.photo;
  else { s.photo = { ...(s.photo || {}), file }; delete s.photo.query; if ($('#pickFx').value) s.photo.fx = $('#pickFx').value; else delete s.photo.fx; if ($('#pickFrame').value) s.photo.frame = $('#pickFrame').value; else delete s.photo.frame; if (!PHOTO_LAYOUTS.includes(s.layout)) s.layout = 'polaroid'; }
  $('#picker').close(); drawBoard(); savePlan(); refresh();
}
$('#pickGo').onclick = () => searchPhotos($('#pickQ').value.trim(), $('#pickRes'), $('#pickMsg'));
$('#pickQ').onkeydown = (e) => e.key === 'Enter' && (e.preventDefault(), $('#pickGo').click());
$('#pickLib').onclick = (e) => { const c = e.target.closest('.ph-card'); if (c) setShotPhoto(S.project.photos.find((p) => p.id === c.dataset.id)?.file); };
$('#pickRes').onclick = async (e) => { const c = e.target.closest('.ph-card'); if (!c) return; toast($('#pickMsg'), 'downloading…'); try { const ph = await addResult(c.dataset.id); if (ph) setShotPhoto(ph.file); } catch (err) { toast($('#pickMsg'), err.message, true); } };
$('#pickNone').onclick = () => setShotPhoto(null);
for (const sel of ['#pickFx', '#pickFrame']) $(sel).onchange = () => { const s = S.project.plan.lines[S.pick.li].shots[S.pick.si]; if (s.photo) { const k = sel === '#pickFx' ? 'fx' : 'frame'; if ($(sel).value) s.photo[k] = $(sel).value; else delete s.photo[k]; savePlan(); refresh(); drawBoard(); } };

// ---------- preview ----------
const frame = $('#stage');
function fitStage() { const w = $('#screen').clientWidth; frame.style.transform = `scale(${w / 1080})`; }
new ResizeObserver(fitStage).observe($('#screen'));
async function loadVoice() {
  S.voice = null; if (S.audio) { S.audio.pause(); S.audio = null; }
  try {
    const v = await (await fetch(`/p/${S.project.id}/vo/voice.json?${Date.now()}`)).json();
    if (v && v.lines) { S.voiceRaw = v; S.audio = new Audio(`/p/${S.project.id}/vo/preview.wav?${Date.now()}`); S.audio.preload = 'auto'; }
  } catch { S.voiceRaw = null; }
}
function voiceMatches(reel) {
  const v = S.voiceRaw; if (!v || v.lines.length !== reel.lines.length) return false;
  return reel.lines.every((l, i) => v.lines[i].words.map((w) => w.w).join(' ') === l.say.split(/\s+/).filter(Boolean).join(' '));
}
async function refresh() {
  const plan = S.project?.plan;
  $('#emptyMsg').hidden = !!(plan && plan.lines.length);
  if (!plan || !plan.lines.length) return;
  const seq = ++S.loadSeq;
  const reel = compile(plan, { speaker: S.project.voice?.speaker, speed: S.project.voice?.speed, host: S.project.hostImage });
  const ok = voiceMatches(reel);
  S.voice = ok ? S.voiceRaw : null;
  $('#voiceBtn').textContent = ok ? '🎙️ Voice up to date' : S.voiceRaw ? '🎙️ Re-record voice' : '🎙️ Record voice';
  const w = frame.contentWindow;
  if (!w || !w.REEL) { frame.onload = () => refresh(); return; }
  try {
    const info = await w.REEL.load(reel, S.voice, { stickers: '/stickers/', media: `/p/${S.project.id}/media/` });
    if (seq !== S.loadSeq) return;
    S.info = info;
    $('#scrub').max = info.total.toFixed(2);
    S.t = Math.min(S.t, info.total - 0.01);
    w.REEL.seek(S.t); tick(true);
  } catch (e) { console.error(e); }
}
const refreshSoon = debounce(refresh, 450);
function fmt(t) { return `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`; }
function tick(once) {
  if (!S.info) return;
  if (S.playing) {
    S.t = S.audio && S.voice ? S.audio.currentTime : (performance.now() - S.startedAt) / 1000;
    if (S.t >= S.info.total) { S.t = S.info.total - 0.01; pause(); }
  }
  frame.contentWindow.REEL.seek(S.t);
  $('#scrub').value = S.t; $('#clock').textContent = `${fmt(S.t)} / ${fmt(S.info.total)}`;
  const shot = S.info.shots.findIndex((s) => S.t >= s.t0 && S.t < s.t1);
  if (shot !== S.curShot) { S.curShot = shot; board.querySelectorAll('.shot.cur').forEach((x) => x.classList.remove('cur')); board.querySelector(`.shot[data-gi="${shot}"]`)?.classList.add('cur'); }
  if (S.playing && !once) requestAnimationFrame(() => tick());
}
function play() {
  if (!S.info) return;
  if (S.t >= S.info.total - 0.05) S.t = 0;
  S.playing = true; $('#playBtn').textContent = '❚❚'; $('#playBtn').setAttribute('aria-label', 'Pause');
  if (S.audio && S.voice) { S.audio.currentTime = S.t; S.audio.play().catch(() => {}); } else S.startedAt = performance.now() - S.t * 1000;
  tick();
}
function pause() { S.playing = false; $('#playBtn').textContent = '▶'; $('#playBtn').setAttribute('aria-label', 'Play'); S.audio?.pause(); }
$('#playBtn').onclick = () => (S.playing ? pause() : play());
$('#scrub').oninput = (e) => { S.t = +e.target.value; if (S.playing) { if (S.audio && S.voice) S.audio.currentTime = S.t; else S.startedAt = performance.now() - S.t * 1000; } tick(true); };
document.addEventListener('keydown', (e) => { if (e.code === 'Space' && !/INPUT|TEXTAREA|SELECT/.test(e.target.tagName) && !e.target.closest('dialog')) { e.preventDefault(); $('#playBtn').click(); } });

$('#voiceBtn').onclick = async () => {
  if (!S.project.plan) return;
  await api('PUT', `/api/projects/${S.project.id}`, { plan: S.project.plan });
  pause();
  follow(await api('POST', `/api/projects/${S.project.id}/voice`), $('#mediaJob'), async (j) => { if (j.status === 'done') { await loadVoice(); refresh(); } });
};
$('#renderBtn').onclick = async () => {
  if (!S.project.plan) return;
  await api('PUT', `/api/projects/${S.project.id}`, { plan: S.project.plan });
  pause(); $('#result').hidden = true;
  follow(await api('POST', `/api/projects/${S.project.id}/render`, { draft: $('#draftChk').checked }), $('#mediaJob'), async (j) => {
    if (j.status !== 'done') return;
    await loadVoice(); refresh();
    const r = j.result;
    $('#result').hidden = false;
    $('#result').innerHTML = `<video src="${r.video}" controls playsinline></video><div class="links"><a class="pill hot" href="${r.video}" download="${esc(r.file)}">⬇ Download MP4</a><a class="pill ghost" href="${r.credits}" target="_blank" rel="noopener">Credits</a></div>`;
  });
};

// ---------- misc wiring ----------
function tab(name) { document.querySelectorAll('.tabs button').forEach((b) => b.setAttribute('aria-selected', b.dataset.tab === name)); document.querySelectorAll('.tab').forEach((t) => (t.hidden = t.id !== `tab-${name}`)); }
document.querySelectorAll('.tabs button').forEach((b) => (b.onclick = () => tab(b.dataset.tab)));
for (const sel of ['#lenSeg', '#lookSeg']) $(sel).onclick = (e) => { const b = e.target.closest('button'); if (b) { segSet(sel, b.dataset.v); saveMeta(); } };
$('#topic').oninput = saveMeta; $('#angle').oninput = saveMeta;
$('#projSel').onchange = (e) => { pause(); open(e.target.value); };
$('#newBtn').onclick = async () => {
  const topic = prompt('What is the new reel about?'); if (topic == null) return;
  const p = await api('POST', '/api/projects', { topic: topic.trim(), title: topic.trim() || 'New reel' });
  fillProjects(await api('GET', '/api/projects'), p.id); pause(); await open(p.id); tab('sources');
};

boot().catch((e) => { document.body.insertAdjacentHTML('afterbegin', `<p class="hint err" style="padding:12px">Studio failed to start: ${esc(e.message)}</p>`); });
