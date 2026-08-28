import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { drawFace, gallery, nameOf, type Recipe } from './face';
import { sfx } from '../../lib/audio';

/**
 * Two Crayons.
 *
 * Two hundred faces in black and one colour, on paper. Nothing is a picture and
 * nothing is trained — each face is a recipe of eight family choices drawn by a
 * seeded sampler and then *deposited*, one pixel at a time, wherever the
 * pressure of the imagined stick beats the tooth of the imagined paper. The
 * medium is the study; the faces are what the medium is for.
 *
 * Rendering is lazy and off the paint path. A face costs about ten milliseconds
 * at thumbnail size, so drawing all two hundred up front is two seconds of
 * locked tab for a wall you can only see a dozen of. They are drawn as they
 * scroll into view, in small batches, with a frame given back to the browser
 * between each.
 */

const COUNT = 200;
/** Thumbnail size on the wall. */
const THUMB = { w: 208, h: 268 };
/** The size one face is printed at when you open it. */
const PRINT = { w: 520, h: 670 };

function useCrayonCanvas(
  rec: Recipe | null,
  size: { w: number; h: number },
  active: boolean,
) {
  const host = useRef<HTMLDivElement>(null);
  const done = useRef<string>('');

  useEffect(() => {
    const h = host.current;
    if (!h || !rec || !active) return;
    const key = `${rec.seed}:${size.w}x${size.h}`;
    if (done.current === key) return;
    let cancelled = false;
    // A frame's grace before the work, so a fast scroll does not pay for every
    // tile it flies past.
    const id = requestAnimationFrame(() => {
      if (cancelled) return;
      const canvas = drawFace(rec, size.w, size.h).toCanvas();
      canvas.style.width = '100%';
      canvas.style.height = 'auto';
      canvas.style.display = 'block';
      h.replaceChildren(canvas);
      done.current = key;
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(id);
    };
  }, [rec, size.w, size.h, active]);

  return host;
}

function Tile({
  rec,
  index,
  onOpen,
}: {
  rec: Recipe;
  index: number;
  onOpen: (i: number) => void;
}) {
  const [seen, setSeen] = useState(false);
  const box = useRef<HTMLButtonElement>(null);
  const host = useCrayonCanvas(rec, THUMB, seen);

  useEffect(() => {
    const el = box.current;
    if (!el || seen) return;
    const io = new IntersectionObserver(
      (rows) => rows.some((r) => r.isIntersecting) && setSeen(true),
      { rootMargin: '400px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [seen]);

  return (
    <button
      ref={box}
      className="crayon__tile"
      style={{ aspectRatio: `${THUMB.w} / ${THUMB.h}` }}
      onClick={() => onOpen(index)}
      title={nameOf(rec, index)}
    >
      <div ref={host} className="crayon__ink" />
      <span className="crayon__no">{String(index + 1).padStart(3, '0')}</span>
    </button>
  );
}

function Print({ rec }: { rec: Recipe }) {
  const host = useCrayonCanvas(rec, PRINT, true);
  return <div ref={host} className="crayon__print" />;
}

export function Crayon({ onExit }: { onExit: () => void }) {
  const [seed, setSeed] = useState(20260828);
  const [open, setOpen] = useState<number | null>(null);
  const recipes = useMemo(() => gallery(COUNT, seed), [seed]);

  const step = useCallback(
    (d: number) => {
      setOpen((o) => (o === null ? o : (o + d + COUNT) % COUNT));
      sfx.tick();
    },
    [],
  );

  useEffect(() => {
    if (open === null) return;
    const on = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null);
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, [open, step]);

  const rec = open === null ? null : recipes[open];

  return (
    <div className="crayon">
      <div className="crayon__bar">
        <div>
          <div className="crayon__eyebrow">
            {COUNT} faces · one black, one colour · nothing drawn by hand
          </div>
          <h1 className="crayon__title">Two Crayons</h1>
        </div>
        <div className="crayon__actions">
          <button
            className="stage__spec"
            onClick={() => {
              sfx.paper();
              setSeed((s) => s + 1 + Math.floor(Math.random() * 900));
            }}
          >
            New sheet
          </button>
          <button className="stage__back" onClick={onExit}>← Shelf</button>
        </div>
      </div>

      <p className="crayon__lede">
        Every mark here is pigment laid down where the pressure of the stick beat the
        tooth of the paper — which is why the strokes break up, why they taper, and
        why two marks crossing skip in the same places. Tap one to print it larger.
      </p>

      <div className="crayon__wall">
        {recipes.map((r, i) => (
          <Tile key={r.seed} rec={r} index={i} onOpen={setOpen} />
        ))}
      </div>

      {rec && open !== null && (
        <div className="crayon__sheet" onClick={() => setOpen(null)}>
          <div className="crayon__sheetinner" onClick={(e) => e.stopPropagation()}>
            <Print rec={rec} />
            <div className="crayon__caption">
              <div className="crayon__name">{nameOf(rec, open)}</div>
              <div className="crayon__meta">
                <span style={{ background: rec.accent }} className="crayon__swatch" />
                {rec.accent} · paper {rec.paper + 1} · seed {rec.seed}
              </div>
              <div className="crayon__recipe">
                {Object.entries(rec.pick).map(([k, v]) => (
                  <span key={k}>
                    {k} {v}
                  </span>
                ))}
              </div>
              <div className="crayon__nav">
                <button className="btn btn--small" onClick={() => step(-1)}>← Before</button>
                <button className="btn btn--small" onClick={() => setOpen(null)}>Close</button>
                <button className="btn btn--small" onClick={() => step(1)}>After →</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
