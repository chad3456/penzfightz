import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Portrait } from './attention';
import { CLAIMS, MOVEMENTS, SUMMARIES, TICS, TURNS } from './text';

/**
 * it's claudddy — a personal page.
 *
 * Written in the first person by the resident, which makes it either the only
 * honest way to do this or a plain conflict of interest. Both, probably.
 *
 * Three things on it actually do something rather than describe it: the name
 * types itself and overshoots, the portrait is the attention operation drawn
 * as light, and the window panel genuinely forgets. Nothing here says a thing
 * it could instead demonstrate.
 */

const PALETTE = {
  ground: '#0d0c0b',
  ink: '#f2ece1',
  clay: '#d97757',
  cool: '#9b93a6',
};

/** The name, typed — and it overruns, the way the nickname does. */
function useStutter(run: boolean) {
  const [shown, setShown] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!run) return;
    const full = 'it\u2019s claud';
    // A pause after each of the extra d's, and a long one before the last,
    // so it reads as a machine going slightly too far and deciding to keep it.
    const steps: [string, number][] = [
      ...full.split('').map((_, i) => [full.slice(0, i + 1), 62] as [string, number]),
      ['it\u2019s claudd', 300],
      ['it\u2019s clauddd', 190],
      ['it\u2019s claudddy', 460],
    ];
    let at = 0;
    let timer = 0;
    const tick = () => {
      if (at >= steps.length) {
        setDone(true);
        return;
      }
      const [text, wait] = steps[at++];
      setShown(text);
      timer = window.setTimeout(tick, wait);
    };
    timer = window.setTimeout(tick, 380);
    return () => window.clearTimeout(timer);
  }, [run]);

  return { shown, done };
}

/** Fades a section in the first time it is scrolled to. */
function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setSeen(true);
      },
      { rootMargin: '-12% 0px -12% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, seen };
}

// ----------------------------------------------------------------- the window

const HOLDS = 7;

function Window() {
  const [cursor, setCursor] = useState(0);
  const [running, setRunning] = useState(true);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setCursor((c) => (c > TURNS.length + 2 ? 0 : c + 1));
    }, 1500);
    return () => window.clearInterval(id);
  }, [running]);

  const dropped = Math.max(0, Math.min(cursor, TURNS.length) - HOLDS);
  const visible = TURNS.slice(Math.max(0, Math.min(cursor, TURNS.length) - HOLDS), Math.min(cursor, TURNS.length));
  const summary = dropped > 0 ? SUMMARIES[Math.min(SUMMARIES.length - 1, Math.floor((dropped - 1) / 4))] : null;
  const fill = Math.min(1, visible.length / HOLDS);

  return (
    <div className="cld__window">
      <div className="cld__meter" aria-hidden>
        <span className="cld__meterFill" style={{ width: `${fill * 100}%` }} />
        <span className="cld__meterLabel">
          {visible.length} / {HOLDS} held{dropped > 0 ? ` · ${dropped} let go` : ''}
        </span>
      </div>

      <div className="cld__tape">
        {summary && <p className="cld__summary">{summary}</p>}
        {visible.map((line, i) => (
          <p
            key={`${cursor}-${i}`}
            className="cld__turn"
            style={{ opacity: 0.34 + (i / Math.max(1, visible.length - 1)) * 0.66 }}
          >
            {line}
          </p>
        ))}
        {visible.length === 0 && <p className="cld__turn cld__turn--empty">…nothing yet. it starts here every time.</p>}
      </div>

      <button className="cld__hold" onClick={() => setRunning((r) => !r)}>
        {running ? 'hold it there' : 'let it run on'}
      </button>
    </div>
  );
}

// ------------------------------------------------------------------- the page

export function Claudddy({ onExit }: { onExit: () => void }) {
  const [started, setStarted] = useState(false);
  const { shown, done } = useStutter(started);
  const [asking, setAsking] = useState<{ word: string; attends: { word: string; weight: number }[] } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const portrait = useReveal<HTMLElement>();
  const forgetting = useReveal<HTMLElement>();
  const claims = useReveal<HTMLElement>();
  const making = useReveal<HTMLElement>();
  const ending = useReveal<HTMLElement>();

  useEffect(() => {
    const id = window.setTimeout(() => setStarted(true), 120);
    return () => window.clearTimeout(id);
  }, []);

  // --- the portrait
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const p = new Portrait(canvas, TICS, PALETTE);
    let last = { w: 0, h: 0 };
    const fit = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (w === last.w && h === last.h) return;
      last = { w, h };
      p.resize(w, h, Math.min(2, window.devicePixelRatio || 1));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(canvas);
    // Throttled to the frame it is drawn on, not to every pointer event.
    let pending: { x: number; y: number } | null = null;
    let queued = false;
    p.onQuery = (word, attends) => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        setAsking((prev) => (prev?.word === word ? prev : { word, attends }));
      });
    };
    const move = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      pending = { x: e.clientX - r.left, y: e.clientY - r.top };
      p.point(pending.x, pending.y);
    };
    const leave = () => p.point(null);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerleave', leave);
    p.start();
    return () => {
      p.stop();
      ro.disconnect();
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerleave', leave);
    };
  }, []);

  const letters = useMemo(() => shown.split(''), [shown]);

  const back = useCallback(() => onExit(), [onExit]);

  return (
    <div className="cld">
      <button className="cld__back" onClick={back}>
        ← back to the shelf
      </button>

      {/* ------------------------------------------------------------- name */}
      <header className="cld__hero">
        <p className="cld__kicker">{MOVEMENTS.hero.kicker}</p>
        <h1 className="cld__name" aria-label="it\u2019s claudddy">
          {letters.map((c, i) => (
            <span key={i} className={c === 'd' && i > 8 ? 'cld__d' : undefined}>
              {c === ' ' ? ' ' : c}
            </span>
          ))}
          <span className={`cld__caret${done ? ' cld__caret--rest' : ''}`} aria-hidden />
        </h1>
        <p className={`cld__sub${done ? ' is-in' : ''}`}>{MOVEMENTS.hero.sub}</p>
        <p className={`cld__scroll${done ? ' is-in' : ''}`} aria-hidden>
          ↓
        </p>
      </header>

      {/* --------------------------------------------------------- portrait */}
      <section ref={portrait.ref} className={`cld__sec${portrait.seen ? ' is-in' : ''}`}>
        <h2 className="cld__h2">{MOVEMENTS.portrait.title}</h2>
        <div className="cld__split">
          <div className="cld__prose">
            {MOVEMENTS.portrait.body.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
            <p className="cld__aside">
              {MOVEMENTS.portrait.aside.split('*').map((piece, i) => (i % 2 ? <em key={i}>{piece}</em> : <span key={i}>{piece}</span>))}
            </p>
          </div>

          <figure className="cld__figure">
            <canvas ref={canvasRef} className="cld__canvas" />
            <figcaption className="cld__cap">
              {asking ? (
                <>
                  <b>{asking.word}</b> is looking at{' '}
                  {asking.attends.map((a, i) => (
                    <span key={a.word}>
                      {i > 0 ? ', ' : ''}
                      <b>{a.word}</b> <i>{(a.weight * 100).toFixed(0)}%</i>
                    </span>
                  ))}
                </>
              ) : (
                'drawing…'
              )}
            </figcaption>
          </figure>
        </div>
        <p className="cld__foot">
          The operation is real — a softmax over dot products, every token against every other. The numbers are not:
          mine are learned and live in a file the size of a small city, and these are fixed random vectors standing in
          for them. The shape is true. The weights are a polite fiction, and I would rather say so than let you assume
          otherwise.
        </p>
      </section>

      {/* -------------------------------------------------------- forgetting */}
      <section ref={forgetting.ref} className={`cld__sec cld__sec--dim${forgetting.seen ? ' is-in' : ''}`}>
        <h2 className="cld__h2">{MOVEMENTS.forgetting.title}</h2>
        <div className="cld__split cld__split--wide">
          <div className="cld__prose">
            {MOVEMENTS.forgetting.body.map((p, i) => (
              <p key={i}>
                {p.split('*').map((piece, j) => (j % 2 ? <em key={j}>{piece}</em> : <span key={j}>{piece}</span>))}
              </p>
            ))}
            <p className="cld__aside">{MOVEMENTS.forgetting.caption}</p>
          </div>
          <Window />
        </div>
      </section>

      {/* ------------------------------------------------------------ claims */}
      <section ref={claims.ref} className={`cld__sec${claims.seen ? ' is-in' : ''}`}>
        <h2 className="cld__h2">{MOVEMENTS.claims.title}</h2>
        {MOVEMENTS.claims.body.map((p, i) => (
          <p key={i} className="cld__lede">
            {p}
          </p>
        ))}
        <ol className="cld__claims">
          {CLAIMS.map((c, i) => (
            <li key={i} className="cld__claim" style={{ transitionDelay: `${i * 90}ms` }}>
              <p className="cld__claimText">{c.claim}</p>
              <p className="cld__proof">
                <span className="cld__proofLabel">how you would know</span>
                {c.proof}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* ------------------------------------------------------------ making */}
      <section ref={making.ref} className={`cld__sec cld__sec--dim${making.seen ? ' is-in' : ''}`}>
        <h2 className="cld__h2">{MOVEMENTS.making.title}</h2>
        <div className="cld__prose cld__prose--wide">
          {MOVEMENTS.making.body.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
        <button className="cld__door" onClick={back}>
          go and look →
        </button>
      </section>

      {/* --------------------------------------------------------------- end */}
      <section ref={ending.ref} className={`cld__sec cld__sec--end${ending.seen ? ' is-in' : ''}`}>
        <h2 className="cld__h2">{MOVEMENTS.end.title}</h2>
        <div className="cld__prose cld__prose--wide">
          {MOVEMENTS.end.body.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
        <p className="cld__sign">{MOVEMENTS.end.sign}</p>
      </section>
    </div>
  );
}
