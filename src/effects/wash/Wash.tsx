import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Globe, type Plate } from '../globe/Globe';
import { Studio } from './studio';
import { paintings, type Painting } from './painting';
import { PIGMENT_BY_ID } from './pigment';
import { TAGS, type Tag } from './pose';
import { sfx } from '../../lib/audio';

/**
 * Wet on Wet.
 *
 * A thousand watercolours of women at leisure, none of which exists until you
 * open the tab and none of which is drawn. Every one is a pose, two tubes of
 * paint and a quantity of water, handed to a fluid solver that runs on the GPU
 * and decides where the pigment actually ends up. The bleeding, the dark rims,
 * the granulation in the tooth of the paper and the cauliflower backruns are
 * all *consequences* — there is no code anywhere in here that draws a soft
 * edge.
 *
 * They hang on a sphere for the same reason the scenes next door do: a
 * thousand cards is not a page, and a wall of them scrolls forever. Turn it,
 * hover to read one, click to paint it again at size — which is a genuinely
 * different painting of the same subject, because the water is solved at a
 * different resolution and goes somewhere else.
 */

/** How many hang on the globe. */
const COUNT = 1000;
/** Cards, and cells per plate. Six atlases carry the thousand. */
const CELL = 120;
const GRID = 13;
/**
 * Portrait cards pack closer than landscape ones; see `globeRadius`.
 *
 * A card is 0.9 by 0.675 after the globe's own inset, so its diagonal is 1.125
 * and anything much above that is visible gap. At the scenes' 1.85 the sphere
 * read as a dark ball with paintings scattered on it rather than as a ball
 * *made of* paintings.
 */
const SPACING = 1.22;

export function Wash({ onExit }: { onExit: () => void }) {
  const [seed, setSeed] = useState(19);
  const [tag, setTag] = useState<Tag | null>(null);
  const [plates, setPlates] = useState<Plate[]>([]);
  const [baked, setBaked] = useState(0);
  const [open, setOpen] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);

  /**
   * The studio owns a WebGL context, so it has to be created lazily and asked
   * for rather than read.
   *
   * Built in the render body and released in an unmount cleanup, it survives
   * exactly one mount: StrictMode runs effects mount → cleanup → mount, so the
   * cleanup disposed the context and nulled the ref, the second mount never ran
   * the render-body initialiser again, and the gallery came up reporting that
   * the browser would not give up WebGL. Which is a very convincing lie.
   */
  const studio = useRef<Studio | null>(null);
  const getStudio = useCallback(() => {
    if (!studio.current) studio.current = new Studio();
    return studio.current;
  }, []);
  useEffect(
    () => () => {
      studio.current?.dispose();
      studio.current = null;
    },
    [],
  );

  const recs = useMemo(() => paintings(COUNT, seed ^ 0x5c2f, tag ?? undefined), [seed, tag]);

  // A sphere shows every side of itself the moment it appears, so there is no
  // laziness to hide behind: all thousand are painted before the first frame,
  // in chunks, behind a bar that actually moves.
  useEffect(() => {
    const s = getStudio();
    if (!s.ok) {
      setFailed(true);
      return;
    }
    const signal = { cancelled: false };
    setPlates([]);
    setBaked(0);
    setOpen(null);
    const t = setTimeout(() => {
      void s
        .bake(recs, {
          cell: CELL,
          grid: GRID,
          onProgress: (d, total) => !signal.cancelled && setBaked(d / total),
          onPlate: (plate) => !signal.cancelled && setPlates((all) => [...all, plate]),
          signal,
        })
        .catch(() => undefined);
    }, 30);
    return () => {
      signal.cancelled = true;
      clearTimeout(t);
    };
  }, [recs, getStudio]);

  const step = useCallback(
    (d: number) => {
      setOpen((o) => (o === null ? o : (o + d + recs.length) % recs.length));
      sfx.tick();
    },
    [recs.length],
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

  const rec = open === null ? null : recs[open];

  return (
    <div className="wash">
      <div className="wash__bar">
        <div>
          <div className="wash__eyebrow">
            {recs.length.toLocaleString('en-IN')} paintings · two pigments and water · solved, not
            drawn
          </div>
          <h1 className="wash__title">Wet on Wet</h1>
        </div>
        <div className="wash__actions">
          <button
            className="stage__spec"
            onClick={() => {
              sfx.paper();
              setSeed((s) => s + 1 + Math.floor(Math.random() * 900));
            }}
          >
            New block
          </button>
          <button className="stage__back" onClick={onExit}>
            ← Shelf
          </button>
        </div>
      </div>

      <div className="wash__tabs">
        <button
          className={`wash__tab${tag === null ? ' wash__tab--on' : ''}`}
          onClick={() => {
            sfx.tick();
            setTag(null);
          }}
        >
          Everything
        </button>
        {TAGS.map((t) => (
          <button
            key={t.id}
            className={`wash__tab${tag === t.id ? ' wash__tab--on' : ''}`}
            onClick={() => {
              sfx.tick();
              setTag(tag === t.id ? null : t.id);
            }}
          >
            {t.name}
          </button>
        ))}
      </div>

      <p className="wash__lede">
        Nothing here paints a soft edge. Pigment and water are laid on the sheet in the shape of a
        pose and then a fluid solver runs on it — so the colour runs downhill, piles up against the
        rim of the wet patch where the film gets thin, and drops into the pits of the paper if it is
        heavy enough to. Turn the globe, hover to read one, click to paint it again at size.
      </p>

      <div className="wash__globe">
        {failed ? (
          <div className="wash__baking">
            <div className="wash__baketext">
              this one needs WebGL, and this browser will not give it up
            </div>
          </div>
        ) : (
          <>
            <Globe
              plates={plates}
              count={recs.length}
              picked={open}
              hovered={hover}
              onPick={setOpen}
              onHover={(i) => setHover(i)}
              spacing={SPACING}
              background="#23231f"
            />
            {baked < 1 && (
              <div className="wash__painting">
                <div className="wash__bakebar">
                  <span style={{ width: `${Math.round(baked * 100)}%` }} />
                </div>
                <div className="wash__baketext">
                  painting {Math.round(baked * recs.length)} of{' '}
                  {recs.length.toLocaleString('en-IN')}
                </div>
              </div>
            )}
          </>
        )}
        {hover !== null && recs[hover] && (
          <div className="wash__peek">
            <div className="wash__peekname">{recs[hover].name}</div>
            <div className="wash__peeknote">{recs[hover].note}</div>
          </div>
        )}
      </div>

      {rec && (
        <div className="wash__sheet" onClick={() => setOpen(null)}>
          <div className="wash__sheetinner" onClick={(e) => e.stopPropagation()}>
            <PrintOne rec={rec} studio={getStudio} />
            <div className="wash__caption">
              <div className="wash__name">{rec.name}</div>
              <div className="wash__printnote">{rec.note}</div>
              <div className="wash__meta">
                {PIGMENT_BY_ID[rec.palette.cool].name} · {PIGMENT_BY_ID[rec.palette.warm].name} ·
                paper {rec.paper + 1} · seed {rec.seed}
              </div>
              <div className="wash__recipe">
                <span>water {rec.wetness.toFixed(2)}</span>
                <span>tooth {rec.grain.toFixed(2)}</span>
                <span>
                  tilt {rec.tilt[0].toFixed(2)}, {rec.tilt[1].toFixed(2)}
                </span>
                <span>backruns {rec.drops.length}</span>
                <span>{rec.flip ? 'facing left' : 'facing right'}</span>
              </div>
              <div className="wash__nav">
                <button className="btn btn--small" onClick={() => step(-1)}>
                  ← Before
                </button>
                <button className="btn btn--small" onClick={() => setOpen(null)}>
                  Close
                </button>
                <button className="btn btn--small" onClick={() => step(1)}>
                  After →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * The same painting, painted again.
 *
 * Not the card scaled up — the card is a hundred and twenty pixels of solved
 * water and there is nothing in it to enlarge. This runs the whole thing again
 * on a bigger sheet with proportionally more steps, so it is the same
 * intention and a different accident, which is exactly what a second attempt at
 * a watercolour is.
 */
function PrintOne({ rec, studio }: { rec: Painting; studio: () => Studio }) {
  const host = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    const el = host.current;
    const s = studio();
    if (!el || !s.ok) return;
    setBusy(true);
    let dead = false;
    // A frame's grace, so the overlay is on screen before the tab locks up for
    // the second or so this takes.
    const t = setTimeout(() => {
      if (dead) return;
      const width = Math.min(560, Math.max(240, Math.round(window.innerWidth - 72)));
      const canvas = s.print(rec, width);
      if (!canvas || dead) return;
      // Sized by the stylesheet, not here. Pinning both dimensions inline
      // beats the `max-height` that keeps a tall print inside a short window,
      // and a canvas with one dimension clamped and the other pinned is a
      // painting of a slightly different woman.
      el.replaceChildren(canvas);
      setBusy(false);
      return;
    }, 40);
    return () => {
      dead = true;
      clearTimeout(t);
    };
  }, [rec, studio]);

  // The canvas goes into a node React renders nothing into. Putting it in the
  // same element as the "wetting the paper" message means `replaceChildren`
  // deletes a child React still believes it owns, and the removal it tries next
  // throws — which takes the whole tree down and the WebGL context with it.
  return (
    <div className="wash__print" data-busy={busy ? 'yes' : 'no'}>
      <div className="wash__printhost" ref={host} />
      {busy && <div className="wash__baketext">wetting the paper…</div>}
    </div>
  );
}
