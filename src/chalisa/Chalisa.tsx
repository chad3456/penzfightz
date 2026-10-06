import { useEffect, useMemo, useRef, useState } from 'react';
import { VERSES, verseLabel, type Verse } from './text';
import { TL, segAt, type Segment } from './time';
import { Score } from './audio';
import { PW, PH, grain, vignette, archPath, clamp, io, C } from './kit';
import type { Beat, Scene } from './stage';
import { SCENES_A } from './scenesA';
import { SCENES_B } from './scenesB';
import { SCENES_C } from './scenesC';

/**
 * श्री हनुमान चालीसा — the whole Chalisa, animated verse by verse in the
 * manner of a pichwai hanging come to life. Every word of Tulsidas's text is
 * on screen as it is sung, with its romanisation and meaning beneath it; an
 * original score sets each syllable to a note; a reading view lays the whole
 * text out word by word.
 */

const SCENES: Record<string, Scene> = { ...SCENES_A, ...SCENES_B, ...SCENES_C };
const TR = 0.9; // seconds of arch-shaped transition into each scene
type Mode = 'words' | 'line' | 'off';
type Mean = 'en' | 'hi' | 'off';

function beatFor(seg: Segment, t: number): Beat {
  const c = seg.charans.map((ch) => clamp((t - ch.start) / ch.dur));
  let ci = -1, w = -1;
  seg.charans.forEach((ch, i) => { if (t >= ch.start && t < ch.start + ch.dur) { ci = i; w = ch.words.findIndex((x) => t >= x.start && t < x.start + x.dur); } });
  return { t, d: seg.dur, p: clamp(t / seg.dur), c, ci, w, v: seg.verse ?? VERSES[0] };
}
function drawFrame(g: CanvasRenderingContext2D, T: number) {
  const i = segAt(T), seg = TL.segs[i], t = T - seg.start;
  const scene = SCENES[seg.scene];
  g.save();
  if (i > 0 && t < TR) {
    const prev = TL.segs[i - 1], ps = SCENES[prev.scene];
    g.save(); try { ps(g, { ...beatFor(prev, prev.dur), t: prev.dur + t, p: 1 }); } catch (e) { console.error(e); } g.restore();
    const k = io(t / TR);
    g.save(); archPath(g, PW / 2, PH + 40, PW * 1.9 * k + 1, PH * 2.3 * k + 1, 7); g.clip();
    try { scene(g, beatFor(seg, t)); } catch (e) { console.error(e); }
    g.restore();
    archPath(g, PW / 2, PH + 40, PW * 1.9 * k + 1, PH * 2.3 * k + 1, 7); g.strokeStyle = C.gold; g.lineWidth = 10; g.stroke(); g.strokeStyle = C.vermilion; g.lineWidth = 4; g.stroke();
  } else {
    try { scene(g, beatFor(seg, t)); } catch (e) { console.error(e); }
  }
  g.restore();
  grain(g); vignette(g, 0.3);
}
const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const isVerse = (s: Segment) => s.kind === 'doha' || s.kind === 'chaupai';

export function Chalisa({ onExit }: { onExit: () => void }) {
  const cv = useRef<HTMLCanvasElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const T = useRef(0);
  const playingRef = useRef(false), rateRef = useRef(1);
  const score = useRef<Score | null>(null);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [rate, setRate] = useState(1);
  const [mode, setMode] = useState<Mode>(() => (localStorage.getItem('hc-mode') as Mode) || 'words');
  const [mean, setMean] = useState<Mean>(() => (localStorage.getItem('hc-mean') as Mean) || 'en');
  const [sound, setSound] = useState(true);
  const [voice, setVoice] = useState(false);
  const [hasVoice, setHasVoice] = useState(false);
  const [view, setView] = useState<'film' | 'read'>('film');
  const [cap, setCap] = useState({ seg: 0, ci: -1, w: -1, t: 0 });
  const [pick, setPick] = useState<{ v: number; c: number; w: number } | null>(null);

  useEffect(() => { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = '/fonts-sacred/fonts.css'; document.head.appendChild(l); return () => l.remove(); }, []);
  useEffect(() => { try { localStorage.setItem('hc-mode', mode); localStorage.setItem('hc-mean', mean); } catch { /* private mode */ } }, [mode, mean]);
  useEffect(() => { playingRef.current = playing; }, [playing]);
  useEffect(() => { rateRef.current = rate; }, [rate]);

  // the render loop
  useEffect(() => {
    const c = cv.current!, g = c.getContext('2d')!;
    let raf = 0, last = performance.now(), lastKey = '', lastSpoken = '';
    const fit = () => { const d = Math.min(2, window.devicePixelRatio || 1), r = c.getBoundingClientRect(); c.width = Math.max(1, Math.round(r.width * d)); c.height = Math.max(1, Math.round(r.height * d)); };
    fit(); const ro = new ResizeObserver(fit); ro.observe(c);
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.1, (now - last) / 1000); last = now;
      if (playingRef.current) {
        T.current += dt * rateRef.current;
        if (T.current >= TL.total) { T.current = TL.total - 0.01; playingRef.current = false; setPlaying(false); }
        score.current?.pump(T.current, rateRef.current);
      }
      // fit the 1600×900 page inside the canvas
      const W = c.width, H = c.height, k = Math.min(W / PW, H / PH), ox = (W - PW * k) / 2, oy = (H - PH * k) / 2;
      g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#0b1034'; g.fillRect(0, 0, W, H);
      g.setTransform(k, 0, 0, k, ox, oy);
      g.save(); g.beginPath(); g.rect(0, 0, PW, PH); g.clip();
      drawFrame(g, T.current);
      g.restore();
      // captions follow the clock
      const si = segAt(T.current), seg = TL.segs[si], b = beatFor(seg, T.current - seg.start);
      const key = `${si}:${b.ci}:${b.w}`;
      if (key !== lastKey) {
        lastKey = key; setCap({ seg: si, ci: b.ci, w: b.w, t: T.current });
        if (b.ci >= 0 && seg.verse && playingRef.current) { const sk = `${si}:${b.ci}`; if (sk !== lastSpoken) { lastSpoken = sk; score.current?.speak(seg.verse.charans[b.ci].map((x) => x.d).join(' '), seg.charans[b.ci].dur / rateRef.current); } }
      }
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);
  useEffect(() => () => score.current?.stop(), []);

  const ensureAudio = () => {
    if (!score.current) { score.current = new Score(); }
    score.current.start(); score.current.setOn(sound); score.current.setDrone(true); score.current.seek(T.current);
    setTimeout(() => setHasVoice(!!score.current?.hasVoice), 400);
  };
  const play = () => { if (!started) setStarted(true); ensureAudio(); score.current?.resume(); score.current?.seek(T.current); setPlaying(true); };
  const pause = () => { setPlaying(false); score.current?.suspend(); };
  const seek = (t: number) => { T.current = clamp(t, 0, TL.total - 0.01); score.current?.seek(T.current); const si = segAt(T.current); setCap((c) => ({ ...c, seg: si, t: T.current })); };
  const toVerse = (dir: number) => {
    const si = segAt(T.current), seg = TL.segs[si];
    const target = dir < 0 && T.current - seg.start > 2 ? si : clamp(si + dir, 0, TL.segs.length - 1);
    seek(TL.segs[target].start + (target ? 0.01 : 0));
  };
  useEffect(() => { score.current?.setOn(sound); if (sound && playing) score.current?.setDrone(true); }, [sound, playing]);
  useEffect(() => { if (score.current) score.current.speakOn = voice; if (!voice) score.current?.hush(); }, [voice]);

  // keyboard
  useEffect(() => {
    const kd = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'SELECT') return;
      if (e.code === 'Space') { e.preventDefault(); if (playingRef.current) pause(); else play(); }
      else if (e.key === 'ArrowRight') toVerse(1);
      else if (e.key === 'ArrowLeft') toVerse(-1);
      else if (e.key === 'w' || e.key === 'W') setMode((m) => (m === 'words' ? 'line' : m === 'line' ? 'off' : 'words'));
      else if (e.key === 'm' || e.key === 'M') setMean((m) => (m === 'en' ? 'hi' : m === 'hi' ? 'off' : 'en'));
      else if (e.key === 'Escape') { if (view === 'read') setView('film'); else if (pick) setPick(null); }
    };
    window.addEventListener('keydown', kd); return () => window.removeEventListener('keydown', kd);
  });

  const seg = TL.segs[cap.seg];
  const verse = seg.verse;
  const vIndex = verse ? VERSES.indexOf(verse) : -1;
  const ticks = useMemo(() => TL.segs.map((s, i) => ({ i, x: (s.start / TL.total) * 100, verse: isVerse(s), doha: s.kind === 'doha' })), []);
  const fs = () => { const el = root.current; if (!el) return; if (document.fullscreenElement) void document.exitFullscreen(); else void el.requestFullscreen?.().catch(() => {}); };

  return (
    <div className="hc" ref={root}>
      <header className="hc-top">
        <button className="hc-btn" onClick={() => { score.current?.stop(); onExit(); }} aria-label="Exit">← Exit</button>
        <div className="hc-title"><span className="dev">श्री हनुमान चालीसा</span><span className="hc-sub">Goswami Tulsidas · animated word by word</span></div>
        <div className="hc-views">
          <button className={view === 'film' ? 'on' : ''} onClick={() => setView('film')}>Film</button>
          <button className={view === 'read' ? 'on' : ''} onClick={() => { pause(); setView('read'); }}>Read</button>
        </div>
      </header>

      <div className="hc-stage">
        <canvas ref={cv} className="hc-canvas" role="img" aria-label={verse ? `${verse.title}: ${verse.en}` : 'Shri Hanuman Chalisa'} onClick={() => (playing ? pause() : play())} />
        {!started && (
          <div className="hc-start">
            <button className="hc-play-big" onClick={play}><span className="dev">आरंभ</span><span>Begin · {fmtTime(TL.total)}</span></button>
            <p>Sound on. Every word is shown as it is sung, with its meaning beneath. Space pauses, ← → move between verses.</p>
          </div>
        )}
        {verse && <div className="hc-badge"><span className="dev">{verseLabel(verse, 'hi')}</span> · {verse.title}</div>}
      </div>

      <section className={`hc-cap mode-${mode}`} aria-live="off">
        {verse && mode !== 'off' && (
          <div className="hc-lines">
            {verse.charans.map((ws, ci) => {
              const active = cap.ci === ci, done = cap.ci > ci || (cap.ci === -1 && cap.t - seg.start > (seg.charans[ci]?.start ?? 0));
              return (
                <div key={ci} className={`hc-charan ${active ? 'act' : done ? 'done' : ''}`}>
                  {ws.map((w, wi) => (
                    <button key={wi} className={`hc-w ${active && cap.w === wi ? 'now' : ''} ${active && cap.w > wi ? 'past' : ''}`} onClick={() => setPick({ v: vIndex, c: ci, w: wi })}>
                      <span className="d dev">{w.d}</span>
                      {mode === 'words' && <><span className="r">{w.r}</span><span className="g">{w.g}</span></>}
                    </button>
                  ))}
                  <span className="hc-danda dev">{ci === verse.charans.length - 1 ? '॥' : ci % 2 === 1 || verse.kind === 'chaupai' ? '।' : ','}</span>
                </div>
              );
            })}
            {mode === 'line' && <div className="hc-roman">{verse.charans.map((ws) => ws.map((w) => w.r).join(' ')).join(' · ')}</div>}
          </div>
        )}
        {verse && mean !== 'off' && <p className={`hc-mean ${mean === 'hi' ? 'dev' : ''}`}>{mean === 'hi' ? verse.hi : verse.en}</p>}
        {!verse && <p className="hc-mean">{seg.kind === 'title' ? 'Shri Hanuman Chalisa — forty verses in praise of Hanuman, composed by Goswami Tulsidas in Awadhi in the 16th century.' : 'Complete. Siyavar Ramachandra ki jai. Pavansut Hanuman ki jai.'}</p>}
      </section>

      <footer className="hc-ctl">
        <button className="hc-btn" onClick={() => toVerse(-1)} aria-label="Previous verse">⏮</button>
        <button className="hc-btn hc-pp" onClick={() => (playing ? pause() : play())} aria-label={playing ? 'Pause' : 'Play'}>{playing ? '❚❚' : '▶'}</button>
        <button className="hc-btn" onClick={() => toVerse(1)} aria-label="Next verse">⏭</button>
        <div className="hc-bar" onPointerDown={(e) => { const r = (e.currentTarget as HTMLElement).getBoundingClientRect(); const go = (x: number) => seek(((x - r.left) / r.width) * TL.total); go(e.clientX); const mv = (ev: PointerEvent) => go(ev.clientX); const up = () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); }; window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up); }}>
          <div className="hc-fill" style={{ width: `${(cap.t / TL.total) * 100}%` }} />
          {ticks.map((k) => k.verse && <i key={k.i} className={k.doha ? 'd' : ''} style={{ left: `${k.x}%` }} />)}
        </div>
        <span className="hc-time">{fmtTime(cap.t)} / {fmtTime(TL.total)}</span>
        <div className="hc-opts">
          <button className="hc-btn" onClick={() => setMode((m) => (m === 'words' ? 'line' : m === 'line' ? 'off' : 'words'))} title="Captions (W)">{mode === 'words' ? 'Word by word' : mode === 'line' ? 'Verse only' : 'No text'}</button>
          <button className="hc-btn" onClick={() => setMean((m) => (m === 'en' ? 'hi' : m === 'hi' ? 'off' : 'en'))} title="Meaning (M)">{mean === 'en' ? 'Meaning: EN' : mean === 'hi' ? 'अर्थ: हिंदी' : 'No meaning'}</button>
          <select className="hc-sel" value={rate} onChange={(e) => setRate(+e.target.value)} aria-label="Speed"><option value={0.75}>0.75×</option><option value={1}>1×</option><option value={1.25}>1.25×</option></select>
          <button className={`hc-btn ${sound ? 'on' : ''}`} onClick={() => setSound((s) => !s)} aria-label="Music">{sound ? '♪ On' : '♪ Off'}</button>
          {hasVoice && <button className={`hc-btn ${voice ? 'on' : ''}`} onClick={() => setVoice((v) => !v)} title="Speak each line with this device's Hindi voice">{voice ? 'Voice on' : 'Voice off'}</button>}
          <button className="hc-btn" onClick={fs} aria-label="Full screen">⛶</button>
        </div>
      </footer>

      {pick && (() => { const v = VERSES[pick.v], w = v.charans[pick.c][pick.w]; return (
        <div className="hc-pop" onClick={() => setPick(null)}>
          <div className="hc-pop-card" onClick={(e) => e.stopPropagation()}>
            <div className="dev big">{w.d}</div><div className="r">{w.r}</div><div className="g">{w.g}</div>
            <p className="ctx dev">{v.charans[pick.c].map((x) => x.d).join(' ')}</p>
            <button className="hc-btn" onClick={() => setPick(null)}>Close</button>
          </div>
        </div>); })()}

      {view === 'read' && <ReadView onPlay={(i) => { setView('film'); const s = TL.segs.find((x) => x.verse === VERSES[i]); if (s) seek(s.start + 0.01); play(); }} onClose={() => setView('film')} />}
    </div>
  );
}

function ReadView({ onPlay, onClose }: { onPlay: (i: number) => void; onClose: () => void }) {
  return (
    <div className="hc-read" role="dialog" aria-label="The Chalisa, word by word">
      <div className="hc-read-head">
        <h2 className="dev">श्री हनुमान चालीसा</h2>
        <p>The whole text, word by word: Devanagari, romanisation and a short gloss for every word, then the verse in English and Hindi. Tap ▶ to watch any verse.</p>
        <button className="hc-btn" onClick={onClose}>Back to the film</button>
      </div>
      {VERSES.map((v: Verse, i) => (
        <article key={v.id} className={`hc-verse ${v.kind}`}>
          <header><span className="dev">{verseLabel(v, 'hi')}</span><span>{verseLabel(v, 'en')} · {v.title}</span><button className="hc-btn" onClick={() => onPlay(i)}>▶ Watch</button></header>
          {v.charans.map((ws, ci) => (
            <div key={ci} className="hc-row">
              {ws.map((w, wi) => <div key={wi} className="hc-cell"><span className="d dev">{w.d}</span><span className="r">{w.r}</span><span className="g">{w.g}</span></div>)}
            </div>
          ))}
          <p className="en">{v.en}</p>
          <p className="hi dev">{v.hi}</p>
        </article>
      ))}
      <p className="hc-credit">Text: Goswami Tulsidas (16th century), in the common Gita Press reading; some printings differ in a word or two. Glosses, meanings, pictures and music made for this page.</p>
    </div>
  );
}
