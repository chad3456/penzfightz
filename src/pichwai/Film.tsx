/**
 * The player for a chanted work painted as a moving pichwai: the canvas, the
 * chant captions (each syllable lit as it is chanted, in Devanagari and in
 * roman letters, with the English beneath), the speaker, the names of the
 * thousand as they come, chapter and verse navigation, a reading view, and a
 * memory of where you stopped — the Gita runs to well over two hours.
 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { PW, PH, grain, vignette, archPath, clamp, io, C } from '../chalisa/kit';
import { buildTimeline, segAt, type Seg, type Timeline } from './time';
import { beatFor, type Scene } from './stage';
import { Chant } from './audio';
import type { Work, WVerse } from './work';
import { dn, chantSyllables } from './work';

const TR = 1.0;
type Caps = 'both' | 'dev' | 'off';

function drawFrame(g: CanvasRenderingContext2D, tl: Timeline, scenes: Record<string, Scene>, T: number) {
  const i = segAt(tl, T), seg = tl.segs[i], t = T - seg.start;
  const scene = scenes[seg.scene] ?? scenes.__fallback;
  const run = (s: Scene, si: number, tt: number) => { g.save(); try { s(g, beatFor(tl, si, tt)); } catch (e) { console.error(e); } g.restore(); };
  if (i > 0 && seg.run.i === 0 && t < TR) {
    const prev = tl.segs[i - 1];
    run(scenes[prev.scene] ?? scenes.__fallback, i - 1, prev.dur + t);
    const k = io(t / TR);
    g.save(); archPath(g, PW / 2, PH + 40, PW * 1.9 * k + 1, PH * 2.3 * k + 1, 7); g.clip();
    run(scene, i, t);
    g.restore();
    archPath(g, PW / 2, PH + 40, PW * 1.9 * k + 1, PH * 2.3 * k + 1, 7);
    g.strokeStyle = C.gold; g.lineWidth = 10; g.stroke(); g.strokeStyle = C.vermilion; g.lineWidth = 4; g.stroke();
  } else run(scene, i, t);
  grain(g); vignette(g, 0.28);
}

const fmt = (s: number) => {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = Math.floor(s % 60);
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(x).padStart(2, '0')}` : `${m}:${String(x).padStart(2, '0')}`;
};

interface Cap { si: number; li: number; k: number; t: number }

export interface FilmProps {
  work: Work;
  scenes: Record<string, Scene>;
  chant: { sa: number; flute?: boolean };
  onExit: () => void;
  /** Extra panel under the captions, e.g. the name being chanted. */
  extra?: (seg: Seg, cap: Cap) => ReactNode;
  /** Extra block under each verse in the reading view. */
  readExtra?: (v: WVerse) => ReactNode;
  className?: string;
}

export function Film({ work, scenes, chant, onExit, extra, readExtra, className }: FilmProps) {
  const tl = useMemo(() => buildTimeline(work), [work]);
  const cv = useRef<HTMLCanvasElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const store = `pw-${work.id}`;
  const saved = useMemo(() => { try { return +(localStorage.getItem(`${store}-T`) ?? 0) || 0; } catch { return 0; } }, [store]);
  const T = useRef(0);
  const playingRef = useRef(false), rateRef = useRef(1), repeatRef = useRef(false);
  const score = useRef<Chant | null>(null);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [rate, setRate] = useState(1);
  const [caps, setCaps] = useState<Caps>(() => { try { return (localStorage.getItem(`${store}-caps`) as Caps) || 'both'; } catch { return 'both'; } });
  const [showEn, setShowEn] = useState(true);
  const [sound, setSound] = useState(true);
  const [voice, setVoice] = useState(false);
  const [hasVoice, setHasVoice] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [view, setView] = useState<'film' | 'read'>('film');
  const [readSec, setReadSec] = useState(0);
  const [cap, setCap] = useState<Cap>({ si: 0, li: -1, k: -1, t: 0 });

  useEffect(() => { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = '/fonts-sacred/fonts.css'; document.head.appendChild(l); return () => l.remove(); }, []);
  useEffect(() => { try { localStorage.setItem(`${store}-caps`, caps); } catch { /* private */ } }, [caps, store]);
  useEffect(() => { playingRef.current = playing; }, [playing]);
  useEffect(() => { rateRef.current = rate; }, [rate]);
  useEffect(() => { repeatRef.current = repeat; }, [repeat]);

  // the render loop
  useEffect(() => {
    const c = cv.current!, g = c.getContext('2d')!;
    let raf = 0, last = performance.now(), lastKey = '', lastSaved = 0, lastSpoken = '';
    const fit = () => { const d = Math.min(2, window.devicePixelRatio || 1), r = c.getBoundingClientRect(); c.width = Math.max(1, Math.round(r.width * d)); c.height = Math.max(1, Math.round(r.height * d)); };
    fit(); const ro = new ResizeObserver(fit); ro.observe(c);
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.1, (now - last) / 1000); last = now;
      if (playingRef.current) {
        const before = segAt(tl, T.current);
        T.current += dt * rateRef.current;
        const after = segAt(tl, T.current);
        // repeat the verse: jump back to its start when it ends
        if (repeatRef.current && after !== before && tl.segs[before].kind === 'verse') { T.current = tl.segs[before].start + 0.01; score.current?.seek(T.current); }
        if (T.current >= tl.total) { T.current = tl.total - 0.01; playingRef.current = false; setPlaying(false); }
        score.current?.pump(T.current, rateRef.current);
        if (now - lastSaved > 4000) { lastSaved = now; try { localStorage.setItem(`${store}-T`, String(T.current)); } catch { /* private */ } }
      }
      const W = c.width, H = c.height, k = Math.min(W / PW, H / PH), ox = (W - PW * k) / 2, oy = (H - PH * k) / 2;
      g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#0b1034'; g.fillRect(0, 0, W, H);
      g.setTransform(k, 0, 0, k, ox, oy);
      g.save(); g.beginPath(); g.rect(0, 0, PW, PH); g.clip();
      drawFrame(g, tl, scenes, T.current);
      g.restore();
      // captions follow the clock, syllable by syllable
      const si = segAt(tl, T.current), seg = tl.segs[si], t = T.current - seg.start;
      let li = -1, sk = -1;
      seg.lines.forEach((L, i) => { if (t >= L.start && t < L.start + L.dur + 0.05) { li = i; sk = L.syl.findIndex((s) => t >= s.start && t < s.start + s.dur); } });
      const key = `${si}:${li}:${sk}`;
      if (key !== lastKey) {
        lastKey = key; setCap({ si, li, k: sk, t: T.current });
        if (li >= 0 && playingRef.current) { const sp = `${si}:${li}`; if (sp !== lastSpoken) { lastSpoken = sp; score.current?.speak(seg.lines[li].dev, seg.lines[li].dur / rateRef.current); } }
      }
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [tl, scenes, store]);
  useEffect(() => () => { score.current?.stop(); try { localStorage.setItem(`${store}-T`, String(T.current)); } catch { /* private */ } }, [store]);

  const ensureAudio = () => {
    if (!score.current) score.current = new Chant(tl, chant);
    score.current.start(); score.current.setOn(sound); score.current.setDrone(true); score.current.seek(T.current);
    setTimeout(() => setHasVoice(!!score.current?.hasVoice), 400);
  };
  const play = () => { if (!started) setStarted(true); ensureAudio(); score.current?.resume(); score.current?.seek(T.current); setPlaying(true); };
  const pause = () => { setPlaying(false); score.current?.suspend(); };
  const seek = (t: number) => { T.current = clamp(t, 0, tl.total - 0.01); score.current?.seek(T.current); setCap((c) => ({ ...c, si: segAt(tl, T.current), t: T.current })); };
  const toSeg = (i: number) => seek(tl.segs[clamp(i, 0, tl.segs.length - 1)].start + 0.01);
  const step = (dir: number) => {
    const si = segAt(tl, T.current), s = tl.segs[si];
    toSeg(dir < 0 && T.current - s.start > 2.5 ? si : si + dir);
  };
  const toSection = (k: number) => toSeg(tl.sections[k].first);
  useEffect(() => { score.current?.setOn(sound); if (sound && playing) score.current?.setDrone(true); }, [sound, playing]);
  useEffect(() => { if (score.current) score.current.speakOn = voice; if (!voice) score.current?.hush(); }, [voice]);

  useEffect(() => {
    const kd = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
      if (e.code === 'Space') { e.preventDefault(); if (playingRef.current) pause(); else play(); }
      else if (e.key === 'ArrowRight') step(1);
      else if (e.key === 'ArrowLeft') step(-1);
      else if (e.key === 'r' || e.key === 'R') setRepeat((v) => !v);
      else if (e.key === 'c' || e.key === 'C') setCaps((m) => (m === 'both' ? 'dev' : m === 'dev' ? 'off' : 'both'));
      else if (e.key === 'e' || e.key === 'E') setShowEn((v) => !v);
      else if (e.key === 'Escape') { if (view === 'read') setView('film'); else onExit(); }
    };
    window.addEventListener('keydown', kd); return () => window.removeEventListener('keydown', kd);
  });

  const seg = tl.segs[cap.si];
  const sec = work.sections[seg.sec];
  const secT = tl.sections[seg.sec];
  const verse = seg.verse;
  const ticks = useMemo(() => tl.segs.slice(secT.first, secT.last + 1).map((s) => ({ x: ((s.start - secT.start) / secT.dur) * 100, card: s.kind === 'card' })), [tl, secT]);
  const full = () => { const el = root.current; if (!el) return; if (document.fullscreenElement) void document.exitFullscreen(); else void el.requestFullscreen?.().catch(() => {}); };

  return (
    <div className={`pw ${className ?? ''}`} ref={root}>
      <header className="pw-top">
        <button className="pw-btn" onClick={() => { score.current?.stop(); onExit(); }} aria-label="Exit">← Exit</button>
        <div className="pw-title"><span className="dev">{work.dev}</span><span className="pw-sub">{work.sub}</span></div>
        <select className="pw-sel pw-secsel" value={seg.sec} onChange={(e) => { toSection(+e.target.value); if (view === 'read') setReadSec(+e.target.value); }} aria-label="Go to section">
          {work.sections.map((s, i) => <option key={s.key} value={i}>{s.title}</option>)}
        </select>
        <div className="pw-views">
          <button className={view === 'film' ? 'on' : ''} onClick={() => setView('film')}>Film</button>
          <button className={view === 'read' ? 'on' : ''} onClick={() => { pause(); setReadSec(seg.sec); setView('read'); }}>Read</button>
        </div>
      </header>

      <div className="pw-stage">
        <canvas ref={cv} className="pw-canvas" role="img" aria-label={verse ? `${verse.label}: ${verse.en}` : sec.title} onClick={() => (playing ? pause() : play())} />
        {!started && (
          <div className="pw-start">
            <button className="pw-play-big" onClick={play}><span className="dev">आरम्भः</span><span>Begin · {fmt(tl.total)}</span></button>
            {saved > 30 && saved < tl.total - 30 && <button className="pw-btn pw-resume" onClick={() => { seek(saved); play(); }}>Continue from {fmt(saved)} · {work.sections[tl.segs[segAt(tl, saved)].sec].title}</button>}
            <p>{work.about}</p>
          </div>
        )}
        <div className="pw-badge">
          {verse ? <><span className="dev">{verse.num ?? ''}</span> {verse.label}</> : <>{sec.title}</>}
        </div>
      </div>

      <section className={`pw-cap caps-${caps}`} aria-live="off">
        {seg.kind === 'card' && (
          <div className="pw-card-cap">
            <div className="dev big">{sec.dev}</div>
            <div className="en">{sec.title} — {sec.sub}</div>
          </div>
        )}
        {caps !== 'off' && seg.lines.length > 0 && (
          <div className="pw-lines">
            {seg.lines.map((L, li) => {
              const act = cap.li === li, done = cap.li > li || (cap.li === -1 && cap.t - seg.start > L.start + L.dur);
              return (
                <div key={li} className={`pw-line ${L.speaker ? 'spk' : ''} ${act ? 'act' : done ? 'done' : ''}`}>
                  <div className="dev">
                    {L.syl.map((s, k) => <span key={k} className={act && k === cap.k ? 'now' : act && k < cap.k ? 'past' : ''}>{s.dev}{s.end ? ' ' : ''}</span>)}
                    {L.speaker ? '' : <span className="danda">{li === seg.lines.length - 1 ? ' ॥' : ' ।'}</span>}
                  </div>
                  {caps === 'both' && <div className="rom">{L.syl.map((s, k) => <span key={k} className={act && k === cap.k ? 'now' : act && k < cap.k ? 'past' : ''}>{s.rom}{s.end ? ' ' : ''}</span>)}</div>}
                </div>
              );
            })}
          </div>
        )}
        {extra?.(seg, cap)}
        {verse && showEn && <p className="pw-en">{verse.speaker && <b>{verse.speaker.en}: </b>}{verse.en}</p>}
        {seg.kind === 'close' && <p className="pw-en">{work.credit}</p>}
      </section>

      <footer className="pw-ctl">
        <button className="pw-btn" onClick={() => step(-1)} aria-label="Previous verse">⏮</button>
        <button className="pw-btn pw-pp" onClick={() => (playing ? pause() : play())} aria-label={playing ? 'Pause' : 'Play'}>{playing ? '❚❚' : '▶'}</button>
        <button className="pw-btn" onClick={() => step(1)} aria-label="Next verse">⏭</button>
        <div className="pw-bar" title={sec.title} onPointerDown={(e) => {
          const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
          const go = (x: number) => seek(secT.start + clamp((x - r.left) / r.width) * secT.dur);
          go(e.clientX);
          const mv = (ev: PointerEvent) => go(ev.clientX);
          const up = () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); };
          window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
        }}>
          <div className="pw-fill" style={{ width: `${clamp((cap.t - secT.start) / secT.dur) * 100}%` }} />
          {ticks.map((k, i) => <i key={i} className={k.card ? 'card' : ''} style={{ left: `${k.x}%` }} />)}
        </div>
        <span className="pw-time">{fmt(cap.t - secT.start)} / {fmt(secT.dur)}</span>
        <div className="pw-opts">
          <button className={`pw-btn ${repeat ? 'on' : ''}`} onClick={() => setRepeat((v) => !v)} title="Repeat this verse (R)">↻ Verse</button>
          <button className="pw-btn" onClick={() => setCaps((m) => (m === 'both' ? 'dev' : m === 'dev' ? 'off' : 'both'))} title="Text (C)">{caps === 'both' ? 'देव + roman' : caps === 'dev' ? 'देवनागरी' : 'No text'}</button>
          <button className={`pw-btn ${showEn ? 'on' : ''}`} onClick={() => setShowEn((v) => !v)} title="English (E)">English</button>
          <select className="pw-sel" value={rate} onChange={(e) => setRate(+e.target.value)} aria-label="Speed"><option value={0.75}>0.75×</option><option value={1}>1×</option><option value={1.25}>1.25×</option><option value={1.5}>1.5×</option></select>
          <button className={`pw-btn ${sound ? 'on' : ''}`} onClick={() => setSound((s) => !s)} aria-label="Music">{sound ? '♪ On' : '♪ Off'}</button>
          {hasVoice && <button className={`pw-btn ${voice ? 'on' : ''}`} onClick={() => setVoice((v) => !v)} title="Also read each line with this device's voice">{voice ? 'Voice on' : 'Voice off'}</button>}
          <button className="pw-btn" onClick={full} aria-label="Full screen">⛶</button>
        </div>
      </footer>

      {view === 'read' && (
        <div className="pw-read" role="dialog" aria-label={`${work.title}, the text`}>
          <div className="pw-read-head">
            <h2 className="dev">{work.dev}</h2>
            <div className="pw-read-tabs">
              {work.sections.map((s, i) => <button key={s.key} className={readSec === i ? 'on' : ''} onClick={() => setReadSec(i)}>{s.title}</button>)}
            </div>
            <button className="pw-btn" onClick={() => setView('film')}>Back to the film</button>
          </div>
          <section className="pw-read-sec">
            <h3><span className="dev">{work.sections[readSec].dev}</span> {work.sections[readSec].title}</h3>
            <p className="pw-read-sub">{work.sections[readSec].sub}</p>
            {work.sections[readSec].verses.map((v) => (
              <article key={v.id} className={`pw-verse ${v.kind ?? 'verse'}`}>
                <header>
                  <span>{v.label}{v.speaker ? ` · ${v.speaker.en}` : ''}</span>
                  <button className="pw-btn" onClick={() => { const gi = tl.segs.findIndex((s) => s.verse === v); if (gi >= 0) { toSeg(gi); setView('film'); play(); } }}>▶ Watch</button>
                </header>
                {v.speaker && <div className="dev spk">{v.speaker.dev}</div>}
                <div className="dev">{v.lines.map((l, i) => <div key={i}>{l}{i === v.lines.length - 1 ? ` ॥${v.num ? ` ${v.num} ॥` : ''}` : ' ।'}</div>)}</div>
                <div className="rom">{v.lines.map((l, i) => <div key={i}>{iastOf(l)}</div>)}</div>
                <p className="en">{v.en}</p>
                {readExtra?.(v)}
              </article>
            ))}
          </section>
          <p className="pw-credit">{work.credit}</p>
        </div>
      )}
    </div>
  );
}

function iastOf(line: string) { return chantSyllables(line).map((s) => s.rom + (s.end ? ' ' : '')).join('').trim(); }
export { dn };
