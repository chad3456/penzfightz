import { useCallback, useEffect, useRef, useState } from 'react';
import { DURATION, Projector, SHOTS } from './film';
import { PLATES } from './plates';

/**
 * A SMALL LIGHT, CARRIED — the player.
 *
 * The film is a pure function of one number, so the player is almost nothing:
 * a clock, a canvas, and a scrubber that sets the clock. Dragging the bar is
 * the same code path as playing it, because there is no state to wind forward.
 */

const SIZE = 620;

export function Film({ onExit }: { onExit: () => void }) {
  const host = useRef<HTMLDivElement>(null);
  const proj = useRef<Projector | null>(null);
  const ctx = useRef<CanvasRenderingContext2D | null>(null);
  const clock = useRef({ t: 0, playing: true, last: 0 });
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [slide, setSlide] = useState({ title: '', caption: '' });

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const canvas = document.createElement('canvas');
    canvas.width = SIZE;
    canvas.height = SIZE;
    const g = canvas.getContext('2d');
    if (!g) return;
    ctx.current = g;
    proj.current = new Projector(SIZE);
    el.replaceChildren(canvas);

    let raf = 0;
    clock.current.last = performance.now();
    const tick = () => {
      const now = performance.now();
      const dt = Math.min(0.1, (now - clock.current.last) / 1000);
      clock.current.last = now;
      if (clock.current.playing) clock.current.t = (clock.current.t + dt) % DURATION;
      const at = clock.current.t;
      proj.current?.frame(g, at);
      setT(at);
      setSlide(proj.current!.caption(at));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const seek = useCallback((to: number) => {
    clock.current.t = Math.max(0, Math.min(DURATION - 0.01, to));
  }, []);

  const toggle = useCallback(() => {
    clock.current.playing = !clock.current.playing;
    setPlaying(clock.current.playing);
  }, []);

  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (e.key === ' ') { e.preventDefault(); toggle(); }
      if (e.key === 'ArrowRight') seek(clock.current.t + 1);
      if (e.key === 'ArrowLeft') seek(clock.current.t - 1);
      if (e.key === 'Escape') onExit();
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, [onExit, seek, toggle]);

  return (
    <div className="film">
      <header className="film__head">
        <div>
          <p className="film__kicker">twenty-seven seconds · twelve plates · one lens</p>
          <h1 className="film__title">A Small Light, Carried</h1>
        </div>
        <button className="film__exit" onClick={onExit}>← back to the shelf</button>
      </header>

      <p className="film__lede">
        Rāma, without Rāma in it. One lantern lens is pointed at a dozen unrelated things — a bow,
        a deer that never existed, a branch of ashoka, a chart of the way south, a flame, the moon,
        two wooden sandals — and what they have in common is the whole of the film. He is never
        drawn. A drawing of him would be somebody’s idea of him; a drawing of his bow is only ever
        a bow.
      </p>

      <div className="film__stage">
        <div className="film__frame" ref={host} style={{ width: SIZE, height: SIZE }} />
      </div>

      <div className="film__slide">
        <b>{slide.title}</b>
        <span>{slide.caption}</span>
      </div>

      <div className="film__bar">
        <button className="film__play" onClick={toggle} aria-label={playing ? 'pause' : 'play'}>
          {playing ? '▮▮' : '▶'}
        </button>
        <input
          className="film__scrub"
          type="range"
          min={0}
          max={DURATION}
          step={0.02}
          value={t}
          onChange={(e) => seek(Number(e.target.value))}
          aria-label="seek"
        />
        <span className="film__time">
          {t.toFixed(1).padStart(4, '0')} / {DURATION.toFixed(1)}
        </span>
      </div>

      <nav className="film__plates" aria-label="plates">
        {SHOTS.filter((s) => s.kind === 'plate').map((s) => (
          <button
            key={s.at}
            className={`film__pip${t >= s.at && t < s.until ? ' is-on' : ''}`}
            onClick={() => seek(s.at + 0.05)}
          >
            {PLATES[s.plate!]!.title}
          </button>
        ))}
      </nav>

      <footer className="film__foot">
        <p>
          Every frame is a function of one number and nothing accumulates, so the film renders
          identically at any rate, in any order, on any machine — which is the only reason it can
          be written out to a file at all. The plates are drawn by the same press the rooms are:
          coverage on five plates, screened into dots at five angles, a line plate over the top.
          The lens is not a filter laid on afterwards. It is the reason the plates are a set.
        </p>
      </footer>
    </div>
  );
}
