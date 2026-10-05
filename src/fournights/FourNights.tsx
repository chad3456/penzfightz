import { useEffect, useMemo, useRef, useState } from 'react';
import { BEATS, CHAPTERS } from './story';
import { Painter, frameAt } from './painter';
import { NightAudio } from './audio';

/**
 * FOUR NIGHTS AND A MORNING: Dostoevsky's White Nights told as a painted film
 * you scroll through. One long view of Petersburg along the water changes
 * with the story (the pale nights, the rain, the dawn, the dreams and the
 * memories) while the book's own words, in Constance Garnett's translation,
 * come and go beside it.
 */

const ROMAN = ['', 'I', 'II', 'II½', 'III', 'IV', ''];

function grainURL() {
  const c = document.createElement('canvas'); c.width = c.height = 200;
  const g = c.getContext('2d')!;
  const img = g.createImageData(200, 200);
  for (let i = 0; i < img.data.length; i += 4) { const v = 200 + Math.random() * 55; img.data[i] = v; img.data[i + 1] = v * 0.97; img.data[i + 2] = v * 0.9; img.data[i + 3] = 255; }
  g.putImageData(img, 0, 0);
  return c.toDataURL();
}

export function FourNights({ onExit }: { onExit: () => void }) {
  const cvRef = useRef<HTMLCanvasElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLElement | null)[]>([]);
  const painterRef = useRef<Painter | null>(null);
  const audio = useRef(new NightAudio());
  const [sound, setSound] = useState(false);
  const [auto, setAuto] = useState(false);
  const [beat, setBeat] = useState(0);
  const [menu, setMenu] = useState(false);
  const grain = useMemo(() => (typeof document !== 'undefined' ? grainURL() : ''), []);
  const autoRef = useRef(false);
  autoRef.current = auto;

  useEffect(() => {
    const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = '/fonts-sacred/fonts.css';
    document.head.appendChild(l);
    return () => l.remove();
  }, []);

  useEffect(() => {
    const cv = cvRef.current!, sc = scrollRef.current!;
    const painter = new Painter(cv);
    painterRef.current = painter;
    let raf = 0, alive = true, last = performance.now(), t = 0, shownBeat = -1, autoHold = 0;
    const fit = () => painter.resize(cv.clientWidth, cv.clientHeight, Math.min(window.devicePixelRatio || 1, cv.clientWidth < 700 ? 1.5 : 1.75));
    fit();
    window.addEventListener('resize', fit);
    const sectionH = () => sc.clientHeight * 1.3;
    const loop = (now: number) => {
      if (!alive) return;
      const dt = Math.min(0.1, (now - last) / 1000); last = now; t += dt;
      if (autoRef.current) {
        // read at a gentle pace: rest on each passage in proportion to its length, then glide on
        const b = sc.scrollTop / sectionH();
        const i = Math.round(b);
        const words = BEATS[Math.min(BEATS.length - 1, i)].text.join(' ').split(/\s+/).length;
        const rest = 2.5 + words / 3.2;
        if (Math.abs(b - i) < 0.01 && autoHold < rest) autoHold += dt;
        else {
          autoHold = Math.abs(b - i) < 0.01 ? 0 : autoHold;
          if (i < BEATS.length - 1 || b < i) sc.scrollTop += sectionH() * dt / 3.2;
          if (Math.abs(sc.scrollTop / sectionH() - Math.round(sc.scrollTop / sectionH())) < 0.008) autoHold = 0;
          if (sc.scrollTop / sectionH() >= BEATS.length - 1) setAuto(false);
        }
      }
      const b = sc.scrollTop / sectionH();
      const f = frameAt(b);
      painter.draw(f, t);
      // cards fade in and out around the middle of the screen
      const H = sc.clientHeight;
      for (let i = Math.max(0, Math.floor(b) - 1); i <= Math.min(BEATS.length - 1, Math.floor(b) + 2); i++) {
        const el = cards.current[i];
        if (!el) continue;
        const r = el.getBoundingClientRect();
        const mid = r.top + r.height / 2;
        const d = Math.abs(mid - H * (painter.focusY < 0.4 ? 0.73 : 0.5)) / (H * 0.55);
        el.style.opacity = String(Math.max(0, Math.min(1, 1.25 - d * d * 1.6)));
      }
      const nb = Math.round(b);
      if (nb !== shownBeat) { shownBeat = nb; setBeat(nb); }
      const sky = BEATS[Math.min(BEATS.length - 1, nb)].scene;
      audio.current.update({
        rain: f.rain, water: 1 - (sky.vision?.startsWith('room') || sky.vision === 'letter:last' ? 0.8 : 0), beat: nb, bell: f.bell,
        mood: BEATS[nb]?.ch === 5 && nb < 60 ? 'major' : sky.sky === 'dawn' || sky.sky === 'golden' || sky.sky === 'day' ? 'major' : 'minor',
        tempo: 0.9,
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const key = (e: KeyboardEvent) => {
      const h = sectionH();
      const i = Math.round(sc.scrollTop / h);
      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') { e.preventDefault(); sc.scrollTo({ top: Math.min(BEATS.length - 1, i + 1) * h, behavior: 'smooth' }); }
      if (e.key === 'ArrowUp' || e.key === 'PageUp') { e.preventDefault(); sc.scrollTo({ top: Math.max(0, i - 1) * h, behavior: 'smooth' }); }
    };
    window.addEventListener('keydown', key);
    (window as unknown as { __nights?: unknown }).__nights = {
      painter, frameAt, beats: BEATS.length,
      stop: () => { alive = false; cancelAnimationFrame(raf); },
      show: (b: number, time = 10) => { sc.scrollTop = b * sectionH(); painter.draw(frameAt(b), time); for (const el of cards.current) if (el) el.style.opacity = '0'; const el = cards.current[Math.round(b)]; if (el) el.style.opacity = '1'; },
    };
    const a = audio.current;
    return () => { alive = false; cancelAnimationFrame(raf); window.removeEventListener('resize', fit); window.removeEventListener('keydown', key); a.dispose(); };
  }, []);

  const go = (i: number) => {
    const sc = scrollRef.current!;
    setAuto(false);
    autoRef.current = false;
    const top = i * sc.clientHeight * 1.3;
    // a long way: cut there; a short way: glide
    sc.scrollTo({ top, behavior: Math.abs(top - sc.scrollTop) > sc.clientHeight * 4 ? 'auto' : 'smooth' });
    setMenu(false);
  };
  const chStart = (ch: number) => BEATS.findIndex((b) => b.ch === ch);
  const ch = BEATS[Math.min(BEATS.length - 1, beat)]?.ch ?? 0;
  const toggleSound = () => { if (sound) { audio.current.stop(); setSound(false); } else { audio.current.start(); setSound(true); } };

  return (
    <div className="fn-root">
      <canvas ref={cvRef} className="fn-canvas" />
      <div className="fn-grain" style={{ backgroundImage: `url(${grain})` }} />
      <div className="fn-vignette" />
      <div className="fn-scroll" ref={scrollRef}>
        {BEATS.map((b, i) => {
          const first = i === 0 || BEATS[i - 1].ch !== b.ch;
          const last = i === BEATS.length - 1;
          return (
            <section key={i} className="fn-section">
              {i === 0 ? (
                <header className="fn-title" ref={(el) => { cards.current[i] = el; }}>
                  <span className="fn-title-kicker">Fyodor Dostoevsky · 1848</span>
                  <h1>White Nights</h1>
                  <p className="fn-title-sub">A sentimental story from the diary of a dreamer</p>
                  <p className="fn-title-note">Four nights and a morning on a Petersburg canal, in the words of the book (Constance Garnett’s translation), painted as you read.</p>
                  <span className="fn-cue">Scroll to begin</span>
                </header>
              ) : (
                <article className={`fn-card ${last ? 'fn-card--last' : ''}`} ref={(el) => { cards.current[i] = el; }}>
                  {first && (
                    <h2 className="fn-ch">
                      {ROMAN[b.ch] && <span className="fn-ch-num">{ROMAN[b.ch] === 'II½' ? '' : ROMAN[b.ch]}</span>}
                      {CHAPTERS[b.ch]}
                    </h2>
                  )}
                  {b.text.map((p, k) => <p key={k} className={p.startsWith('“') ? 'fn-said' : ''}>{p}</p>)}
                  {last && (
                    <div className="fn-end">
                      <span>The end</span>
                      <button className="fn-btn" onClick={() => go(0)}>Read it again</button>
                    </div>
                  )}
                </article>
              )}
            </section>
          );
        })}
      </div>
      <header className="fn-top">
        <button className="fn-btn fn-btn--ghost" onClick={onExit}>← Shelf</button>
        <button className="fn-chapter" onClick={() => setMenu((m) => !m)} aria-expanded={menu}>
          <span>{ch === 0 ? 'White Nights' : CHAPTERS[ch]}</span>
          <i aria-hidden="true">▾</i>
        </button>
        <div className="fn-tools">
          <button className={`fn-btn fn-btn--ghost ${auto ? 'on' : ''}`} onClick={() => setAuto((a) => !a)}>{auto ? 'Pause' : 'Read to me'}</button>
          <button className={`fn-btn fn-btn--ghost ${sound ? 'on' : ''}`} onClick={toggleSound}>{sound ? 'Sound on' : 'Sound off'}</button>
        </div>
      </header>
      {menu && (
        <nav className="fn-menu" aria-label="Chapters">
          {CHAPTERS.map((c, k) => (
            <button key={c} className={k === ch ? 'on' : ''} onClick={() => go(chStart(k))}>
              <span>{k === 0 ? '' : ROMAN[k] === 'II½' ? '·' : ROMAN[k]}</span>{c}
            </button>
          ))}
        </nav>
      )}
      <div className="fn-progress" aria-hidden="true">
        <i style={{ width: `${(beat / (BEATS.length - 1)) * 100}%` }} />
        {CHAPTERS.slice(1).map((c, k) => <b key={c} style={{ left: `${(chStart(k + 1) / (BEATS.length - 1)) * 100}%` }} title={c} />)}
      </div>
    </div>
  );
}
