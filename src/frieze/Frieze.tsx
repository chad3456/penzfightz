import { useCallback, useEffect, useRef, useState } from 'react';
import { DURATION, Reel, shotAt } from './camera';
import { SCENES } from './story';

/**
 * The Ramayana, drawn along one very long page — the player.
 *
 * The film is a pure function of one number, so the player is a clock, a
 * canvas and a scrubber. Dragging the bar runs exactly the same code as
 * playing does, because there is no state to wind forward.
 */

const W = 1120;
const H = Math.round((W * 9) / 16);

export function Frieze({ onExit }: { onExit: () => void }) {
  const host = useRef<HTMLDivElement>(null);
  const reel = useRef<Reel | null>(null);
  const clock = useRef({ t: 0, playing: true, last: 0 });
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [cap, setCap] = useState({ n: 1, of: SCENES.length, title: '' });

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const g = canvas.getContext('2d');
    if (!g) return;
    reel.current = new Reel(W, H);
    el.replaceChildren(canvas);

    let raf = 0;
    clock.current.last = performance.now();
    const tick = () => {
      const now = performance.now();
      const dt = Math.min(0.12, (now - clock.current.last) / 1000);
      clock.current.last = now;
      if (clock.current.playing) clock.current.t = (clock.current.t + dt) % DURATION;
      const at = clock.current.t;
      reel.current?.frame(g, at);
      setT(at);
      setCap(reel.current!.caption(at));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const seek = useCallback((to: number) => {
    clock.current.t = Math.max(0, Math.min(DURATION - 0.02, to));
  }, []);
  const toggle = useCallback(() => {
    clock.current.playing = !clock.current.playing;
    setPlaying(clock.current.playing);
  }, []);

  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (e.key === ' ') { e.preventDefault(); toggle(); }
      if (e.key === 'ArrowRight') seek(clock.current.t + 3);
      if (e.key === 'ArrowLeft') seek(clock.current.t - 3);
      if (e.key === 'Escape') onExit();
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, [onExit, seek, toggle]);

  const mmss = (s: number) =>
    `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  return (
    <div className="frz">
      <header className="frz__head">
        <div>
          <p className="frz__kicker">
            twenty scenes · one page · {mmss(DURATION)}
          </p>
          <h1 className="frz__title">The Ramayana, drawn along one very long page</h1>
        </div>
        <button className="frz__exit" onClick={onExit}>← back to the shelf</button>
      </header>

      <p className="frz__lede">
        His whole life, left to right, in the order it happens — a fire in a hall with no heir in
        it, four boys, a bow that breaks, two boons called in years late, a road south, ten quiet
        years, a deer the wrong colour, a line drawn across a doorway, a sea, a bridge, a war, and
        a city that counted the days and lit every window on the way in. There is one cut in this
        film and it is at the very end. Everything else is one move along one page, because the
        middle of this story is a journey and the page can simply <i>be</i> the journey.
      </p>

      <div className="frz__stage">
        <div className="frz__frame" ref={host} />
      </div>

      <div className="frz__slide">
        <span className="frz__num">{String(cap.n).padStart(2, '0')} / {cap.of}</span>
        <b>{cap.title}</b>
      </div>

      <div className="frz__bar">
        <button className="frz__play" onClick={toggle} aria-label={playing ? 'pause' : 'play'}>
          {playing ? '▮▮' : '▶'}
        </button>
        <input
          className="frz__scrub"
          type="range"
          min={0}
          max={DURATION}
          step={0.05}
          value={t}
          onChange={(e) => seek(Number(e.target.value))}
          aria-label="seek"
        />
        <span className="frz__time">{mmss(t)} / {mmss(DURATION)}</span>
      </div>

      <nav className="frz__scenes" aria-label="scenes">
        {SCENES.map((s, i) => {
          // Find the moment the camera settles on this scene.
          const at = 5.2 + i * 7.7 + 1.2;
          return (
            <button
              key={s.id}
              className={`frz__pip${cap.n === i + 1 ? ' is-on' : ''}`}
              onClick={() => seek(at)}
            >
              {String(i + 1).padStart(2, '0')} {s.title}
            </button>
          );
        })}
      </nav>

      <footer className="frz__foot">
        <p>
          Drawn on ruled exercise paper with a felt tip and crayon: every line wanders off the path
          it meant to take, the colour overshoots the outline on one side and falls short on the
          other, and everything casts a small shadow onto the page, because everything is a cut-out
          lying on it. Nothing is seeded from the clock — only from where it is — so a doodle looks
          hand-drawn and does not crawl about while the camera passes over it.
        </p>
        <p className="frz__small">
          Scenes, not doctrine: the beats most tellings share, with nothing invented for effect and
          nothing settled that the tradition leaves open. He is drawn here, where the lantern film
          left him out — this one is a life, and a life needs somebody living it. The register is
          the point: it is plainly a retelling in a school notebook, and makes no claim to be a
          likeness of anybody. <span aria-hidden>·</span>{' '}
          <span className="frz__key">space</span> to pause, <span className="frz__key">←</span>
          <span className="frz__key">→</span> to skip.
        </p>
      </footer>
    </div>
  );
}

/** Kept for the render script, which asks for the camera directly. */
export { shotAt };
