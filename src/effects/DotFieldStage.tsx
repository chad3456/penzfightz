import { useCallback, useEffect, useRef, useState } from 'react';
import { DotField, FIELD, type Phrase } from './dotfield';

/**
 * The dot field, full screen.
 *
 * Move the pointer and the lattice gets out of the way. Scroll and the whole
 * field leans with you, then settles, and the words rearrange themselves into
 * the next line — dots travel to their nearest new home rather than cutting,
 * so you can watch the sentence take itself apart.
 */

const PHRASES: Phrase[] = [
  { lines: ['The back', 'bench.'] },
  { lines: ['Games we', 'used to play.'] },
  { lines: ['Bring your', 'own pen.'] },
  { lines: ['Last period.', 'Go home.'] },
];

export function DotFieldStage({ onExit }: { onExit: () => void }) {
  const wrap = useRef<HTMLDivElement | null>(null);
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const field = useRef<DotField | null>(null);
  const [phrase, setPhrase] = useState(0);
  const [specs, setSpecs] = useState(false);
  // On a touch screen a drag is a scroll, so there is no pointer to move.
  const [touch, setTouch] = useState(false);

  // ------------------------------------------------------------- the field
  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const f = new DotField(c, PHRASES, { onPhrase: setPhrase });
    field.current = f;

    const size = () => f.resize(window.innerWidth, window.innerHeight);
    size();
    f.start();

    const ro = new ResizeObserver(size);
    ro.observe(document.documentElement);

    const move = (e: PointerEvent) => {
      if (e.pointerType === 'touch') {
        setTouch(true);
        return;
      }
      f.pointer(e.clientX, e.clientY);
    };
    const leave = () => f.pointerAway();
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerdown', move, { passive: true });
    document.addEventListener('pointerleave', leave);

    return () => {
      f.stop();
      ro.disconnect();
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerdown', move);
      document.removeEventListener('pointerleave', leave);
    };
  }, []);

  // -------------------------------------------------------------- scrolling
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    let last = el.scrollTop;
    let raf = 0;

    const read = () => {
      raf = 0;
      const f = field.current;
      if (!f) return;
      const y = el.scrollTop;
      f.scrolled((y - last) * 0.5);
      last = y;
      const page = Math.max(1, window.innerHeight);
      f.setPhrase(Math.round(y / page));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const jump = useCallback((i: number) => {
    const el = wrap.current;
    if (el) el.scrollTo({ top: i * window.innerHeight, behavior: 'smooth' });
  }, []);

  return (
    <div className="stage">
      <canvas ref={canvas} className="stage__canvas" />

      {/* The scroll surface sits over the canvas and drives it. */}
      <div className="stage__scroll" ref={wrap}>
        {PHRASES.map((p, i) => (
          <section className="stage__panel" key={i} aria-label={p.lines.join(' ')} />
        ))}
      </div>

      <div className="stage__chrome">
        <button className="stage__back" onClick={onExit}>
          ← Back to the shelf
        </button>
        <button
          className={`stage__spec${specs ? ' stage__spec--on' : ''}`}
          onClick={() => setSpecs((s) => !s)}
          aria-pressed={specs}
        >
          {specs ? 'Hide numbers' : 'Numbers'}
        </button>
      </div>

      <div className="stage__rail" aria-hidden="true">
        {PHRASES.map((_, i) => (
          <button
            key={i}
            className={`stage__tick${i === phrase ? ' stage__tick--on' : ''}`}
            onClick={() => jump(i)}
            tabIndex={-1}
          />
        ))}
      </div>

      {specs && (
        <div className="stage__panelnums">
          <div>
            lattice <b>{FIELD.pitch}px</b> · dot <b>{FIELD.dot}px</b>
          </div>
          <div>
            radius <b>{FIELD.radius}px</b> · push <b>{FIELD.strength}px</b>
          </div>
          <div>
            falloff <b>1 − d/r</b> · no swirl
          </div>
          <div>
            pointer eased <b>{Math.round(FIELD.ease * 100)}%</b> per frame
          </div>
        </div>
      )}

      <div className="stage__hint">
        {phrase === 0
          ? touch
            ? 'scroll'
            : 'move the pointer · scroll'
          : `${phrase + 1} of ${PHRASES.length}`}
      </div>
    </div>
  );
}
