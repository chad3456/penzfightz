import { useEffect, useMemo, useRef, useState } from 'react';
import GITA from './gita.json';
import { HI } from './hi';
import { CHAPTERS, INTRO, type Chapter } from './chapters';
import { devNum, iast, syllables, type Syl } from './translit';
import { makeScene, type Ptr } from './scenes';
import { Recital } from './audio';

/**
 * अष्टावक्र गीता — the Ashtavakra Gita as Claude reads it. Every one of the
 * 298 verses in Sanskrit with its IAST and the shape of its metre, a Hindi
 * rendering and John Richards's public-domain English; Claude's reading of
 * each of the twenty chapters and of the verses that carry them; a living
 * picture per chapter; and a recitation mode — tanpura, the verse unfolding
 * syllable by syllable at the pace of its metre, then the meaning, then
 * silence.
 */

interface Verse { id: string; c: number; n: number; sp: 'janaka' | 'ashtavakra'; sa: [string, string]; en: string }
const VERSES = (GITA as unknown as { verses: Verse[] }).verses;
type Lang = 'hi' | 'en' | 'both';
type View = { k: 'home' } | { k: 'chapter'; c: number } | { k: 'recite'; c: number; i: number };

const BY_CH: Verse[][] = Array.from({ length: 21 }, () => []);
for (const v of VERSES) BY_CH[v.c].push(v);
const READING = new Map(CHAPTERS.flatMap((c) => c.readings.map((r) => [r.v, r] as const)));
const SPEAKER = { janaka: { hi: 'जनक', en: 'Janaka' }, ashtavakra: { hi: 'अष्टावक्र', en: 'Ashtavakra' } };

/** A canvas that runs one chapter's picture. */
function SceneCanvas({ ch, className }: { ch: Chapter; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current!;
    const g = cv.getContext('2d')!;
    const painter = makeScene(ch.scene);
    const p: Ptr = { x: 0.5, y: 0.5, on: false, down: false };
    let raf = 0, t0 = performance.now(), vis = true;
    const fit = () => { const d = Math.min(2, window.devicePixelRatio || 1); cv.width = Math.round(cv.clientWidth * d); cv.height = Math.round(cv.clientHeight * d); g.setTransform(d, 0, 0, d, 0, 0); };
    fit();
    const io = new IntersectionObserver((e) => { vis = e[0].isIntersecting; });
    io.observe(cv);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (!vis) return;
      painter.draw(g, cv.clientWidth, cv.clientHeight, reduce ? 3 : (now - t0) / 1000, p);
    };
    raf = requestAnimationFrame(loop);
    const mv = (e: PointerEvent) => { const r = cv.getBoundingClientRect(); p.x = (e.clientX - r.left) / r.width; p.y = (e.clientY - r.top) / r.height; p.on = true; };
    const lv = () => { p.on = false; p.down = false; };
    const dn = (e: PointerEvent) => { mv(e); p.down = true; };
    const up = () => { p.down = false; };
    cv.addEventListener('pointermove', mv); cv.addEventListener('pointerleave', lv); cv.addEventListener('pointerdown', dn); window.addEventListener('pointerup', up);
    window.addEventListener('resize', fit);
    return () => { cancelAnimationFrame(raf); io.disconnect(); cv.removeEventListener('pointermove', mv); cv.removeEventListener('pointerleave', lv); cv.removeEventListener('pointerdown', dn); window.removeEventListener('pointerup', up); window.removeEventListener('resize', fit); };
  }, [ch]);
  return <canvas ref={ref} className={className} aria-label={`${ch.sa} — ${ch.imageEn}`} role="img" />;
}

/** The eight-bend line: crooked at rest, straightening as you move toward it. */
function EightBends() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current!, g = cv.getContext('2d')!;
    let raf = 0, straight = 0, target = 0;
    const fit = () => { const d = Math.min(2, window.devicePixelRatio || 1); cv.width = cv.clientWidth * d; cv.height = cv.clientHeight * d; g.setTransform(d, 0, 0, d, 0, 0); };
    fit();
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const w = cv.clientWidth, h = cv.clientHeight, t = now / 1000;
      straight += (target - straight) * 0.04;
      g.clearRect(0, 0, w, h);
      const x0 = w / 2, top = h * 0.12, bot = h * 0.88;
      const pts: [number, number][] = [];
      for (let i = 0; i <= 8; i++) {
        const y = top + ((bot - top) * i) / 8;
        const bend = (i % 2 ? 1 : -1) * Math.min(w * 0.07, 46) * (i === 0 || i === 8 ? 0 : 1) * (1 - straight);
        pts.push([x0 + bend + Math.sin(t * 0.7 + i) * 2 * (1 - straight), y]);
      }
      const gr = g.createLinearGradient(0, top, 0, bot);
      gr.addColorStop(0, 'rgba(232,176,74,0.1)'); gr.addColorStop(0.5, 'rgba(232,176,74,0.95)'); gr.addColorStop(1, 'rgba(232,176,74,0.1)');
      g.strokeStyle = gr; g.lineWidth = 2.4; g.lineJoin = 'round';
      g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke();
      pts.slice(1, 8).forEach(([x, y], i) => { g.fillStyle = `rgba(243,234,216,${0.6 * (1 - straight)})`; g.beginPath(); g.arc(x, y, 2.4, 0, 7); g.fill(); g.font = '12px "Noto Serif Devanagari", serif'; g.fillStyle = `rgba(243,234,216,${0.35 * (1 - straight)})`; g.fillText(devNum(i + 1), x + (i % 2 ? -22 : 14), y + 4); });
      const gl = g.createRadialGradient(x0, h / 2, 0, x0, h / 2, h * 0.35);
      gl.addColorStop(0, `rgba(243,234,216,${0.12 + 0.2 * straight})`); gl.addColorStop(1, 'rgba(243,234,216,0)');
      g.fillStyle = gl; g.fillRect(0, 0, w, h);
    };
    raf = requestAnimationFrame(loop);
    const mv = (e: PointerEvent) => { const r = cv.getBoundingClientRect(); const d = Math.abs(e.clientX - (r.left + r.width / 2)) / (r.width / 2); target = Math.max(0, 1 - d * 1.4); };
    const lv = () => { target = 0; };
    cv.parentElement!.addEventListener('pointermove', mv); cv.parentElement!.addEventListener('pointerleave', lv);
    window.addEventListener('resize', fit);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', fit); };
  }, []);
  return <canvas ref={ref} className="av-bends" aria-hidden="true" />;
}

function Metre({ line, active = -1 }: { line: string; active?: number }) {
  const syl = useMemo(() => syllables(line), [line]);
  return (
    <span className="av-metre" aria-label={syl.map((s) => (s.heavy ? 'गुरु' : 'लघु')).join(' ')}>
      {syl.map((s, i) => <i key={i} className={(s.heavy ? 'g' : 'l') + (i === active ? ' on' : '') + (i === 7 ? ' pada' : '')} title={`${s.rom} · ${s.heavy ? 'गुरु' : 'लघु'}`} />)}
    </span>
  );
}

export function Ashtavakra({ onExit }: { onExit: () => void }) {
  const [lang, setLang] = useState<Lang>(() => { try { return (localStorage.getItem('av-lang') as Lang) || 'both'; } catch { return 'both'; } });
  const [view, setView] = useState<View>({ k: 'home' });
  const [showIast, setShowIast] = useState(true);
  const [showMetre, setShowMetre] = useState(true);
  const rec = useRef<Recital | null>(null);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = '/fonts-sacred/fonts.css'; document.head.appendChild(l);
    rec.current = new Recital();
    return () => { l.remove(); rec.current?.stop(); };
  }, []);
  useEffect(() => { try { localStorage.setItem('av-lang', lang); } catch { /* ignore */ } }, [lang]);
  useEffect(() => { topRef.current?.scrollTo({ top: 0 }); }, [view.k, view.k === 'chapter' ? view.c : 0]);
  useEffect(() => { document.documentElement.lang = lang === 'en' ? 'en' : 'hi'; return () => { document.documentElement.lang = 'en'; }; }, [lang]);

  const hi = lang !== 'en', en = lang !== 'hi';
  const T = (h: string, e: string) => (lang === 'en' ? e : lang === 'hi' ? h : `${h} · ${e}`);
  const num = (n: number | string) => (lang === 'en' ? String(n) : devNum(n));
  const go = (v: View) => { rec.current?.hush(); setView(v); };

  const bar = (
    <header className="av-bar">
      <button className="av-brand" onClick={() => go({ k: 'home' })}><span className="dev">अष्टावक्र गीता</span></button>
      <nav className="av-langs" aria-label="Language / भाषा">
        {(['hi', 'both', 'en'] as Lang[]).map((l) => <button key={l} className={lang === l ? 'on' : ''} onClick={() => setLang(l)}>{l === 'hi' ? 'हिन्दी' : l === 'en' ? 'English' : 'दोनों'}</button>)}
      </nav>
      <button className="av-x" onClick={() => { rec.current?.stop(); onExit(); }}>{T('बाहर', 'Exit')}</button>
    </header>
  );

  // ------------------------------------------------------------ home
  if (view.k === 'home') return (
    <div className="av" ref={topRef}>
      {bar}
      <section className="av-hero">
        <EightBends />
        <div className="av-hero-txt">
          <p className="av-kicker">{T('राजा जनक और ऋषि अष्टावक्र का संवाद', 'A dialogue between King Janaka and the sage Ashtavakra')}</p>
          <h1>अष्टावक्र गीता</h1>
          <p className="av-sub">{hi && <span className="dev">{INTRO.hi.sub}</span>}{en && <span>{INTRO.en.sub}</span>}</p>
          <p className="av-count">{T(`२० अध्याय · २९८ श्लोक`, '20 chapters · 298 verses')}</p>
          <div className="av-row">
            <button className="av-btn av-gold" onClick={() => go({ k: 'chapter', c: 1 })}>{T('पढ़ना शुरू करें', 'Begin reading')}</button>
            <button className="av-btn" onClick={() => { rec.current?.start(); go({ k: 'recite', c: 1, i: 0 }); }}>{T('पाठ सुनें', 'Hear the recitation')}</button>
          </div>
          <p className="av-hint">{T('रेखा के पास आइए — आठ मोड़ सीधे हो जाते हैं।', 'Move toward the line: the eight bends straighten.')}</p>
        </div>
      </section>

      <section className="av-two">
        <article>
          <h2>{T('आठ मोड़', 'Eight bends')}</h2>
          {hi && <p className="dev">{INTRO.hi.story}</p>}
          {en && <p>{INTRO.en.story}</p>}
        </article>
        <article>
          <h2>{T('Claude कैसे पढ़ता है', 'How Claude recites')}</h2>
          {hi && <p className="dev">{INTRO.hi.method}</p>}
          {en && <p>{INTRO.en.method}</p>}
          <div className="av-demo">
            <div className="av-sa">{VERSES[2].sa[0]}</div>
            <Metre line={VERSES[2].sa[0]} />
            <small>{T('हर बिंदु एक अक्षर: छोटा = लघु (एक मात्रा), लंबा = गुरु (दो मात्रा)। सोलह अक्षर — अनुष्टुप् छंद की आधी पंक्ति।', 'Each mark is a syllable: short = light (one beat), long = heavy (two). Sixteen syllables — half an anuṣṭubh.')}</small>
          </div>
        </article>
      </section>

      <section className="av-mala-wrap">
        <h2>{T('बीस अध्याय — एक माला', 'Twenty chapters — one mala')}</h2>
        <Mala lang={lang} onPick={(c) => go({ k: 'chapter', c })} />
        <ol className="av-list">
          {CHAPTERS.map((c) => (
            <li key={c.n}><button onClick={() => go({ k: 'chapter', c: c.n })}>
              <b>{num(c.n)}</b><span className="dev sa">{c.sa}</span>
              <span className="nm">{T(c.hiName, c.en)}</span>
              <span className="ct">{num(BY_CH[c.n].length)} {T('श्लोक', 'verses')} · {T(SPEAKER[c.speaker].hi, SPEAKER[c.speaker].en)}</span>
            </button></li>
          ))}
        </ol>
      </section>

      <footer className="av-foot">
        {hi && <p className="dev">{INTRO.hi.honest}</p>}
        {en && <p>{INTRO.en.honest}</p>}
      </footer>
    </div>
  );

  // ------------------------------------------------------------ recitation
  if (view.k === 'recite') return <Recite lang={lang} start={view} rec={rec.current!} onClose={(c) => go({ k: 'chapter', c })} bar={bar} />;

  // ------------------------------------------------------------ a chapter
  const ch = CHAPTERS[view.c - 1];
  const vs = BY_CH[view.c];
  return (
    <div className="av" ref={topRef}>
      {bar}
      <section className="av-ch-hero">
        <SceneCanvas ch={ch} className="av-scene" />
        <div className="av-ch-title">
          <p className="av-kicker">{T(`अध्याय ${devNum(ch.n)}`, `Chapter ${ch.n}`)} · {num(vs.length)} {T('श्लोक', 'verses')} · {T('वक्ता', 'speaker')}: {T(SPEAKER[ch.speaker].hi, SPEAKER[ch.speaker].en)}</p>
          <h1>{ch.sa}</h1>
          <p className="av-sub">{hi && <span className="dev">{ch.hiName}</span>}{en && <span>{ch.en}</span>}</p>
          <p className="av-image">{hi && <span className="dev">{ch.image}</span>}{en && <span>{ch.imageEn}</span>}</p>
        </div>
      </section>

      <section className="av-claude">
        <h2><span className="spark">✦</span> {T('Claude का पाठ', 'Claude reads')}</h2>
        {hi && <p className="dev">{ch.hi}</p>}
        {en && <p>{ch.enText}</p>}
        <div className="av-row">
          <button className="av-btn av-gold" onClick={() => { rec.current?.start(); go({ k: 'recite', c: ch.n, i: 0 }); }}>{T('इस अध्याय का पाठ', 'Recite this chapter')}</button>
          <label className="av-tog"><input type="checkbox" checked={showIast} onChange={(e) => setShowIast(e.target.checked)} /> IAST</label>
          <label className="av-tog"><input type="checkbox" checked={showMetre} onChange={(e) => setShowMetre(e.target.checked)} /> {T('छंद', 'Metre')}</label>
        </div>
      </section>

      <section className="av-verses">
        {vs.map((v, i) => {
          const r = READING.get(v.id);
          const first = i === 0 || vs[i - 1].sp !== v.sp;
          return (
            <article key={v.id} id={'v' + v.id} className={'av-verse' + (r ? ' featured' : '')}>
              {first && <p className="av-speaker dev">{SPEAKER[v.sp].hi} उवाच <span>· {SPEAKER[v.sp].en} said</span></p>}
              <div className="av-vnum">{num(v.c)}.{num(v.n)}</div>
              <div className="av-sa">{v.sa.map((l, k) => <div key={k}>{l}</div>)}</div>
              {showMetre && <div className="av-metres">{v.sa.map((l, k) => <Metre key={k} line={l} />)}</div>}
              {showIast && <div className="av-iast">{v.sa.map((l, k) => <div key={k}>{iast(l)}</div>)}</div>}
              {hi && <p className="av-hi dev">{HI[v.id]}</p>}
              {en && <p className="av-en">{v.en} <span className="src">— J. H. Richards</span></p>}
              {r && (
                <div className="av-reading">
                  <p className="av-r-h"><span className="spark">✦</span> {T('Claude की टिप्पणी', 'Claude\'s note')}</p>
                  {hi && <p className="dev">{r.hi}</p>}
                  {en && <p>{r.en}</p>}
                </div>
              )}
              <div className="av-acts">
                <button onClick={() => { rec.current?.start(); go({ k: 'recite', c: v.c, i }); }}>{T('▶ पाठ', '▶ Recite')}</button>
                <button onClick={() => { rec.current?.start(); rec.current?.speak(v.sa.join(' ')); }}>{T('🔊 सुनें', '🔊 Listen')}</button>
              </div>
            </article>
          );
        })}
      </section>

      <nav className="av-pn">
        {ch.n > 1 ? <button className="av-btn" onClick={() => go({ k: 'chapter', c: ch.n - 1 })}>← {CHAPTERS[ch.n - 2].sa}</button> : <span />}
        <button className="av-btn" onClick={() => go({ k: 'home' })}>{T('माला', 'All chapters')}</button>
        {ch.n < 20 ? <button className="av-btn av-gold" onClick={() => go({ k: 'chapter', c: ch.n + 1 })}>{CHAPTERS[ch.n].sa} →</button> : <span />}
      </nav>
    </div>
  );
}

/** Twenty beads; each bead's size is its chapter's length. */
function Mala({ lang, onPick }: { lang: Lang; onPick: (c: number) => void }) {
  const [hover, setHover] = useState<number | null>(null);
  const R = 150, cx = 200, cy = 200;
  const total = VERSES.length;
  let acc = 0;
  const beads = CHAPTERS.map((c) => {
    const n = BY_CH[c.n].length;
    const a0 = (acc / total) * Math.PI * 2 - Math.PI / 2; acc += n;
    const a1 = (acc / total) * Math.PI * 2 - Math.PI / 2;
    const a = (a0 + a1) / 2;
    return { c, n, a, x: cx + Math.cos(a) * R, y: cy + Math.sin(a) * R, r: 5 + Math.sqrt(n) * 2.4 };
  });
  const h = hover ? CHAPTERS[hover - 1] : null;
  return (
    <svg className="av-mala" viewBox="0 0 400 400" role="list" aria-label="chapters">
      <circle cx={cx} cy={cy} r={R} fill="none" stroke="rgba(232,176,74,0.35)" strokeWidth="1" />
      {beads.map((b) => (
        <g key={b.c.n} role="listitem" tabIndex={0} onClick={() => onPick(b.c.n)} onKeyDown={(e) => { if (e.key === 'Enter') onPick(b.c.n); }} onMouseEnter={() => setHover(b.c.n)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(b.c.n)} style={{ cursor: 'pointer' }}>
          <circle cx={b.x} cy={b.y} r={b.r} fill={b.c.speaker === 'janaka' ? 'rgba(243,234,216,0.9)' : 'rgba(232,176,74,0.9)'} stroke={hover === b.c.n ? '#fff' : 'rgba(0,0,0,0.4)'} strokeWidth={hover === b.c.n ? 2 : 1} />
          <text x={b.x} y={b.y + 4} textAnchor="middle" fontSize="10" fill="#0b0d1a" style={{ pointerEvents: 'none', fontFamily: '"Noto Serif Devanagari", serif' }}>{lang === 'en' ? b.c.n : devNum(b.c.n)}</text>
        </g>
      ))}
      <text x={cx} y={cy - 14} textAnchor="middle" fontSize="26" fill="#f3ead8" style={{ fontFamily: '"Tiro Devanagari Sanskrit", serif' }}>{h ? h.sa : 'ॐ'}</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize="12" fill="#e8b04a" style={{ fontFamily: '"Noto Serif Devanagari", serif' }}>{h ? (lang === 'en' ? h.en : h.hiName) : (lang === 'en' ? 'gold: Ashtavakra · ivory: Janaka' : 'सुनहरा: अष्टावक्र · हाथीदाँत: जनक')}</text>
      {h && <text x={cx} y={cy + 32} textAnchor="middle" fontSize="11" fill="rgba(243,234,216,0.7)">{lang === 'en' ? `${BY_CH[h.n].length} verses` : `${devNum(BY_CH[h.n].length)} श्लोक`}</text>}
    </svg>
  );
}

/**
 * Recitation: the verse appears syllable by syllable at the pace of its
 * metre (light = one beat, heavy = two), over a tanpura; then the Hindi,
 * then the English, then Claude's note if there is one; then a silence.
 */
function Recite({ lang, start, rec, onClose, bar }: { lang: Lang; start: { c: number; i: number }; rec: Recital; onClose: (c: number) => void; bar: React.ReactNode }) {
  const [c, setC] = useState(start.c);
  const [i, setI] = useState(start.i);
  const [k, setK] = useState(0); // syllables shown so far (both lines)
  const [stage, setStage] = useState<'sa' | 'hi' | 'en' | 'note' | 'rest'>('sa');
  const [playing, setPlaying] = useState(true);
  const [drone, setDrone] = useState(true);
  const [voice, setVoice] = useState(false);
  const [beat, setBeat] = useState(0.32);
  const v = BY_CH[c][i];
  const syl: Syl[][] = useMemo(() => v.sa.map((l) => syllables(l)), [v]);
  const all = syl[0].length + syl[1].length;
  const r = READING.get(v.id);
  const ch = CHAPTERS[c - 1];
  const T = (h: string, e: string) => (lang === 'en' ? e : lang === 'hi' ? h : `${h} · ${e}`);

  useEffect(() => { rec.start(); rec.setDrone(drone); return () => rec.setDrone(false); }, [drone, rec]);
  useEffect(() => { setK(0); setStage('sa'); if (voice) rec.speak(v.sa.join(' ')); }, [c, i]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!playing) return;
    let id = 0;
    if (stage === 'sa') {
      if (k >= all) { id = window.setTimeout(() => setStage(lang === 'en' ? 'en' : 'hi'), 900); }
      else {
        const s = k < syl[0].length ? syl[0][k] : syl[1][k - syl[0].length];
        rec.tick(s.heavy);
        const pause = (k === syl[0].length - 1 ? 3 : 0) + (k === 7 || k === syl[0].length + 7 ? 1 : 0);
        id = window.setTimeout(() => setK(k + 1), beat * 1000 * ((s.heavy ? 2 : 1) + pause));
      }
    } else if (stage === 'hi') id = window.setTimeout(() => setStage(lang === 'hi' ? (r ? 'note' : 'rest') : 'en'), Math.max(4500, HI[v.id].length * 70));
    else if (stage === 'en') id = window.setTimeout(() => setStage(r ? 'note' : 'rest'), Math.max(4000, v.en.length * 55));
    else if (stage === 'note') id = window.setTimeout(() => setStage('rest'), Math.max(7000, (lang === 'en' ? r!.en : r!.hi).length * 60));
    else if (stage === 'rest') id = window.setTimeout(() => next(), 3000);
    return () => window.clearTimeout(id);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  const next = () => { if (i + 1 < BY_CH[c].length) setI(i + 1); else if (c < 20) { setC(c + 1); setI(0); } else setPlaying(false); };
  const prev = () => { if (i > 0) setI(i - 1); else if (c > 1) { setC(c - 1); setI(BY_CH[c - 1].length - 1); } };
  const order = ['sa', 'hi', 'en', 'note', 'rest'];
  const past = (s: string) => order.indexOf(stage) >= order.indexOf(s);

  return (
    <div className="av av-recite">
      {bar}
      <SceneCanvas ch={ch} className="av-rc-scene" />
      <div className="av-rc">
        <p className="av-kicker">{ch.sa} · {lang === 'en' ? `${v.c}.${v.n}` : `${devNum(v.c)}.${devNum(v.n)}`} · {T(SPEAKER[v.sp].hi, SPEAKER[v.sp].en)}</p>
        <div className="av-rc-sa" aria-live="polite">
          {syl.map((line, li) => (
            <div key={li}>{line.map((s, si) => {
              const idx = li === 0 ? si : syl[0].length + si;
              return <span key={si} className={(idx < k ? 'on' : '') + (idx === k - 1 ? ' now' : '') + (s.heavy ? ' g' : ' l')}>{s.dev}{s.end ? ' ' : ''}</span>;
            })}</div>
          ))}
        </div>
        <div className="av-rc-metre">{syl.map((line, li) => <span key={li}>{line.map((s, si) => <i key={si} className={(s.heavy ? 'g' : 'l') + ((li === 0 ? si : syl[0].length + si) < k ? ' on' : '')} />)}</span>)}</div>
        {past('hi') && lang !== 'en' && <p className="av-rc-hi dev av-fade">{HI[v.id]}</p>}
        {past('en') && lang !== 'hi' && <p className="av-rc-en av-fade">{v.en}</p>}
        {past('note') && r && <p className="av-rc-note av-fade"><span className="spark">✦</span> {lang === 'en' ? r.en : r.hi}</p>}
        {stage === 'rest' && <p className="av-rc-rest av-fade">{T('… मौन …', '… silence …')}</p>}
      </div>
      <div className="av-rc-ctl">
        <button onClick={prev} aria-label="previous">⏮</button>
        <button onClick={() => setPlaying(!playing)} aria-label={playing ? 'pause' : 'play'}>{playing ? '⏸' : '▶'}</button>
        <button onClick={next} aria-label="next">⏭</button>
        <label className="av-tog"><input type="checkbox" checked={drone} onChange={(e) => setDrone(e.target.checked)} /> {T('तानपुरा', 'Tanpura')}</label>
        <label className="av-tog" title={rec.hasVoice ? '' : 'No Hindi voice on this device'}><input type="checkbox" checked={voice} disabled={!rec.hasVoice} onChange={(e) => { setVoice(e.target.checked); if (e.target.checked) rec.speak(v.sa.join(' ')); else rec.hush(); }} /> {T('स्वर', 'Voice')}</label>
        <label className="av-tog">{T('गति', 'Pace')} <input type="range" min="0.18" max="0.5" step="0.02" value={beat} onChange={(e) => setBeat(+e.target.value)} /></label>
        <button onClick={() => onClose(c)}>{T('अध्याय पर लौटें', 'Back to chapter')}</button>
      </div>
    </div>
  );
}
