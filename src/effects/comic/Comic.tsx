import { useCallback, useEffect, useRef, useState } from 'react';
import { ISSUE } from './script';
import { PAGE_ASPECT, printPage } from './page';
import { sfx } from '../../lib/audio';

/**
 * THE SMOKING AREA — the reader.
 *
 * A comic is read one page at a time, so this shows one page at a time. The
 * pages are drawn rather than animated: every one is a few thousand graphite
 * deposits and takes the better part of a second, so each is baked once to its
 * own canvas, kept, and never redrawn unless the window changes size enough to
 * matter.
 *
 * Baking runs ahead of the reader in page order with a yield between pages, so
 * page one is on screen while the rest are still printing.
 */

/** Below this the page is redrawn; above it the canvas is just scaled. */
const RESIZE_SLACK = 90;

export function Comic({ onExit }: { onExit: () => void }) {
  const [page, setPage] = useState(0);
  const [done, setDone] = useState(0);
  const [width, setWidth] = useState(760);
  const host = useRef<HTMLDivElement | null>(null);
  const stage = useRef<HTMLDivElement | null>(null);
  const pages = useRef<Map<number, HTMLCanvasElement>>(new Map());

  // How wide a page can be drawn: the shorter of the column and what the room
  // left over allows at the page's aspect, so a page is never taller than the
  // screen and never needs scrolling to finish a panel.
  //
  // Measured off the stage rather than off the window minus a guess at the
  // chrome. The guess was out by about forty pixels and the page hung over the
  // page strip below it, which left the strip visible, enabled and unclickable
  // — the canvas was eating the clicks. The stage is a flex child with
  // `min-height: 0` and `overflow: hidden`, so its height is the space left
  // over and does not depend on what we put in it: no feedback loop.
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const fit = () => {
      const byWidth = el.clientWidth - 110; // the two page-turn buttons
      const byHeight = el.clientHeight * PAGE_ASPECT;
      const want = Math.round(Math.max(320, Math.min(880, byWidth, byHeight)));
      setWidth((w) => (Math.abs(w - want) > RESIZE_SLACK ? want : w));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    window.addEventListener('resize', fit);
    return () => { ro.disconnect(); window.removeEventListener('resize', fit); };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const store = pages.current;
    store.clear();
    setDone(0);

    const yieldToPaint = () => new Promise<void>((r) => setTimeout(r, 0));

    (async () => {
      for (const p of ISSUE) {
        if (cancelled) return;
        store.set(p.n, printPage(p, width, p.n * 7 + 1));
        if (cancelled) return;
        setDone((d) => d + 1);
        await yieldToPaint();
      }
    })();

    return () => { cancelled = true; };
  }, [width]);

  // Put the current page in the frame whenever either changes.
  useEffect(() => {
    const el = host.current;
    const canvas = pages.current.get(ISSUE[page]!.n);
    if (el && canvas) el.replaceChildren(canvas);
  }, [page, done, width]);

  const go = useCallback((d: number) => {
    setPage((p) => {
      const next = Math.min(ISSUE.length - 1, Math.max(0, p + d));
      if (next !== p) sfx.paper();
      return next;
    });
  }, []);

  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); go(1); }
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'Escape') onExit();
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, [go, onExit]);

  const here = ISSUE[page]!;
  const printed = pages.current.has(here.n);

  return (
    <div className="comic">
      <header className="comic__head">
        <div>
          <p className="comic__kicker">one issue · six pages · pencil, no strokes</p>
          <h1 className="comic__title">The Smoking Area</h1>
        </div>
        <button className="comic__exit" onClick={onExit}>← back to the shelf</button>
      </header>

      <p className="comic__lede">
        Gareth sells extended warranties. He has one good ten minutes a day, in the gap between
        the bottle bank and the wall, with a woman he does not recognise — because twenty minutes
        earlier she served him at the till, and she has never told him. You find out on page two.
        He never does.
      </p>

      <div className="comic__stage" ref={stage}>
        <button
          className="comic__turn comic__turn--back"
          onClick={() => go(-1)}
          disabled={page === 0}
          aria-label="previous page"
        >‹</button>

        <div className="comic__frame" style={{ width, height: Math.round(width / PAGE_ASPECT) }}>
          <div className="comic__page" ref={host} />
          {!printed && <p className="comic__wait">drawing page {here.n}…</p>}
        </div>

        <button
          className="comic__turn comic__turn--on"
          onClick={() => go(1)}
          disabled={page === ISSUE.length - 1}
          aria-label="next page"
        >›</button>
      </div>

      <nav className="comic__strip" aria-label="pages">
        {ISSUE.map((p, i) => (
          <button
            key={p.n}
            className={`comic__pip${i === page ? ' is-on' : ''}`}
            onClick={() => { sfx.paper(); setPage(i); }}
            aria-current={i === page ? 'page' : undefined}
          >
            <b>{p.n}</b>
            <span>{p.title}</span>
          </button>
        ))}
      </nav>

      <p className="comic__foot">
        {done < ISSUE.length
          ? `printing ${done} of ${ISSUE.length} pages`
          : 'Nothing is stroked. Every mark is a run of graphite deposits, laid two or three times over, on paper with a tooth.'}
      </p>
    </div>
  );
}
