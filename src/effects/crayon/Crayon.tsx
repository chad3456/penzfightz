import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { drawFace, gallery, nameOf, type Recipe } from './face';
import { drawFigure, figures, type FigureRecipe } from './figure';
import { TAGS, type Tag } from './pose';
import { SCENE_TAGS, drawScene, scenes, type SceneRecipe } from './scene';
import { bakeScenes } from './plates';
import { Globe, type Plate } from '../globe/Globe';
import type { Sheet } from './sheet';
import { sfx } from '../../lib/audio';

/**
 * Two Crayons.
 *
 * Two hundred heads and sixteen hundred whole figures, in black and one colour,
 * on paper. Nothing is a picture and nothing is trained: each one is a recipe
 * of family choices drawn by a seeded sampler and then *deposited*, one pixel at
 * a time, wherever the pressure of the imagined stick beats the tooth of the
 * imagined paper. The medium is the study; the drawings are what the medium is
 * for.
 *
 * Rendering is lazy twice over. Tiles are only in the DOM in pages of a hundred
 * and eighty — sixteen hundred live buttons, each with its own observer, costs
 * more than the drawing does — and a tile only draws when it comes into view,
 * one animation frame late, so a fast scroll pays for nothing it flies past.
 */

const HEADS = 200;
const FIGURES = 1600;
/**
 * How many scenes go on the globe.
 *
 * Everything on a sphere is visible at once, so unlike the walls there is no
 * laziness to hide behind — all of these are baked before the first frame. At
 * about five milliseconds a scene at plate size that is a few seconds behind a
 * progress bar, which is the same deal Roll Call makes.
 */
const SCENES_ON_GLOBE = 1000;
/** Tiles added each time the bottom of the wall comes into view. */
const PAGE = 180;

const HEAD_THUMB = { w: 208, h: 268 };
const FIG_THUMB = { w: 208, h: 286 };
const HEAD_PRINT = { w: 520, h: 670 };
const FIG_PRINT = { w: 520, h: 715 };
const SCENE_PRINT = { w: 760, h: 570 };

type Kind = 'heads' | 'figures' | 'scenes';

/** One entry on the wall, whichever kind it is. */
interface Item {
  seed: number;
  name: string;
  accent: string;
  paper: number;
  /** The chips under a print. */
  recipe: [string, string | number][];
  /** One line under the name, when there is one worth saying. */
  note?: string;
  draw: (w: number, h: number) => Sheet;
}

const headItem = (rec: Recipe, i: number): Item => ({
  seed: rec.seed,
  name: nameOf(rec, i),
  accent: rec.accent,
  paper: rec.paper,
  recipe: Object.entries(rec.pick),
  draw: (w, h) => drawFace(rec, w, h),
});

const sceneItem = (rec: SceneRecipe, i: number): Item => ({
  seed: rec.seed,
  name: `${rec.scene.name} — no. ${String(i + 1).padStart(4, '0')}`,
  accent: rec.accent,
  paper: rec.paper,
  recipe: [
    ['scene', rec.scene.id],
    ['cast', rec.cast.length],
    ['set', rec.scene.set.length],
    ['mood', rec.scene.tag],
  ],
  note: rec.scene.note,
  draw: (w, h) => drawScene(rec, w, h),
});

const figureItem = (rec: FigureRecipe, i: number): Item => ({
  seed: rec.seed,
  name: `${rec.pose.name} — no. ${String(i + 1).padStart(4, '0')}`,
  accent: rec.accent,
  paper: rec.paper,
  recipe: [
    ['pose', rec.pose.id],
    ['build', rec.build],
    ['dress', rec.dress],
    ['ground', rec.ground],
    ['facing', rec.flip ? 'left' : 'right'],
  ],
  draw: (w, h) => drawFigure(rec, w, h),
});

/** Ink an item into a host element, once, and only when it is worth doing. */
function useInk(item: Item | null, size: { w: number; h: number }, active: boolean) {
  const host = useRef<HTMLDivElement>(null);
  const done = useRef('');

  useEffect(() => {
    const h = host.current;
    if (!h || !item || !active) return;
    const key = `${item.seed}:${size.w}x${size.h}`;
    if (done.current === key) return;
    let cancelled = false;
    const id = requestAnimationFrame(() => {
      if (cancelled) return;
      const canvas = item.draw(size.w, size.h).toCanvas();
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
  }, [item, size.w, size.h, active]);

  return host;
}

function Tile({
  item,
  index,
  size,
  watch,
  onOpen,
}: {
  item: Item;
  index: number;
  size: { w: number; h: number };
  watch: (el: Element | null, on: () => void) => () => void;
  onOpen: (i: number) => void;
}) {
  const [seen, setSeen] = useState(false);
  const box = useRef<HTMLButtonElement>(null);
  const host = useInk(item, size, seen);

  useEffect(() => {
    if (seen) return;
    return watch(box.current, () => setSeen(true));
  }, [seen, watch]);

  return (
    <button
      ref={box}
      className="crayon__tile"
      style={{ aspectRatio: `${size.w} / ${size.h}` }}
      onClick={() => onOpen(index)}
      title={item.name}
    >
      <div ref={host} className="crayon__ink" />
      <span className="crayon__no">{String(index + 1).padStart(4, '0')}</span>
    </button>
  );
}

function Print({ item, size }: { item: Item; size: { w: number; h: number } }) {
  const host = useInk(item, size, true);
  return <div ref={host} className="crayon__print" />;
}

export function Crayon({ onExit }: { onExit: () => void }) {
  const [seed, setSeed] = useState(20260828);
  const [kind, setKind] = useState<Kind>('scenes');
  const [tag, setTag] = useState<Tag | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  const [shown, setShown] = useState(PAGE);
  const [hover, setHover] = useState<number | null>(null);

  const [mood, setMood] = useState<string | null>(null);
  const [plates, setPlates] = useState<Plate[] | null>(null);
  const [baked, setBaked] = useState(0);

  const heads = useMemo(() => gallery(HEADS, seed).map(headItem), [seed]);
  const figs = useMemo(() => figures(FIGURES, seed ^ 0x77c1), [seed]);
  const scen = useMemo(
    () => scenes(SCENES_ON_GLOBE, seed ^ 0x31af, mood ?? undefined),
    [seed, mood],
  );

  const items = useMemo(() => {
    if (kind === 'heads') return heads;
    if (kind === 'scenes') return scen.map(sceneItem);
    const pool = tag ? figs.filter((f) => f.pose.tag === tag) : figs;
    return pool.map(figureItem);
  }, [kind, tag, heads, figs, scen]);

  // The globe wants every card baked up front; the walls do not.
  useEffect(() => {
    if (kind !== 'scenes') {
      setPlates(null);
      return;
    }
    const signal = { cancelled: false };
    setPlates(null);
    setBaked(0);
    const t = setTimeout(() => {
      void bakeScenes(scen, {
        onProgress: (d, total) => !signal.cancelled && setBaked(d / total),
        signal,
      })
        .then((p) => !signal.cancelled && setPlates(p))
        .catch(() => undefined);
    }, 30);
    return () => {
      signal.cancelled = true;
      clearTimeout(t);
    };
  }, [kind, scen]);

  const size = kind === 'heads' ? HEAD_THUMB : FIG_THUMB;
  const printSize = kind === 'heads' ? HEAD_PRINT : kind === 'scenes' ? SCENE_PRINT : FIG_PRINT;

  // Reset the page whenever the wall changes under it.
  useEffect(() => {
    setShown(PAGE);
    setOpen(null);
  }, [kind, tag, mood, seed]);

  // One observer for the whole wall. Sixteen hundred tiles each standing up
  // their own is a real cost before a single mark has been drawn.
  const seers = useRef(new Map<Element, () => void>());
  const io = useRef<IntersectionObserver | null>(null);
  useEffect(() => {
    io.current = new IntersectionObserver(
      (rows) => {
        for (const row of rows) {
          if (!row.isIntersecting) continue;
          const fn = seers.current.get(row.target);
          if (fn) fn();
        }
      },
      { rootMargin: '500px 0px' },
    );
    return () => {
      io.current?.disconnect();
      seers.current.clear();
    };
  }, []);

  const watch = useCallback((el: Element | null, on: () => void) => {
    if (!el || !io.current) return () => undefined;
    seers.current.set(el, on);
    io.current.observe(el);
    return () => {
      seers.current.delete(el);
      io.current?.unobserve(el);
    };
  }, []);

  const more = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = more.current;
    if (!el) return;
    return watch(el, () => setShown((n) => Math.min(items.length, n + PAGE)));
  }, [watch, items.length, shown]);

  const step = useCallback(
    (d: number) => {
      setOpen((o) => (o === null ? o : (o + d + items.length) % items.length));
      sfx.tick();
    },
    [items.length],
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

  const item = open === null ? null : items[open];

  return (
    <div className="crayon">
      <div className="crayon__bar">
        <div>
          <div className="crayon__eyebrow">
            {items.length.toLocaleString('en-IN')}{' '}
            {kind === 'heads' ? 'heads' : kind === 'scenes' ? 'scenes' : 'figures'} · one black, one
            colour · nothing drawn by hand
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
          <button className="stage__back" onClick={onExit}>
            ← Shelf
          </button>
        </div>
      </div>

      <div className="crayon__tabs">
        {(['scenes', 'figures', 'heads'] as Kind[]).map((k) => (
          <button
            key={k}
            className={`crayon__tab${kind === k ? ' crayon__tab--on' : ''}`}
            onClick={() => {
              sfx.tick();
              setKind(k);
            }}
          >
            {k === 'heads' ? 'Heads' : k === 'figures' ? 'Whole figures' : 'Scenes · a globe'}
          </button>
        ))}
        {kind === 'scenes' && (
          <>
            <span className="crayon__split" />
            <button
              className={`crayon__tab${mood === null ? ' crayon__tab--on' : ''}`}
              onClick={() => {
                sfx.tick();
                setMood(null);
              }}
            >
              Everything
            </button>
            {SCENE_TAGS.map((t) => (
              <button
                key={t.id}
                className={`crayon__tab${mood === t.id ? ' crayon__tab--on' : ''}`}
                onClick={() => {
                  sfx.tick();
                  setMood(mood === t.id ? null : t.id);
                }}
              >
                {t.name}
              </button>
            ))}
          </>
        )}
        {kind === 'figures' && (
          <>
            <span className="crayon__split" />
            <button
              className={`crayon__tab${tag === null ? ' crayon__tab--on' : ''}`}
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
                className={`crayon__tab${tag === t.id ? ' crayon__tab--on' : ''}`}
                onClick={() => {
                  sfx.tick();
                  setTag(tag === t.id ? null : t.id);
                }}
              >
                {t.name}
              </button>
            ))}
          </>
        )}
      </div>

      <p className="crayon__lede">
        {kind === 'scenes'
          ? 'Fifty-one places somebody could be. A figure in a rectangle is a figure; a figure placed against a bench, with three quarters of the page left empty, is a picture — the difference is staging, not detail. Turn the globe, hover to read one, click to print it.'
          : 'Every mark here is pigment laid down where the pressure of the stick beat the tooth of the paper — which is why the strokes break up, why they taper, and why two marks crossing skip in the same places. The figures are built on a line of action before a single limb goes on. Tap one to print it larger.'}
      </p>

      {kind === 'scenes' ? (
        <div className="crayon__globe">
          {plates ? (
            <Globe
              plates={plates}
              count={items.length}
              picked={open}
              hovered={hover}
              onPick={setOpen}
              onHover={(i) => setHover(i)}
            />
          ) : (
            <div className="crayon__baking">
              <div className="crayon__bakebar">
                <span style={{ width: `${Math.round(baked * 100)}%` }} />
              </div>
              <div className="crayon__baketext">
                drawing scene {Math.round(baked * items.length)} of{' '}
                {items.length.toLocaleString('en-IN')}
              </div>
            </div>
          )}
          {hover !== null && items[hover] && (
            <div className="crayon__peek">
              <div className="crayon__peekname">{items[hover].name}</div>
              {items[hover].note && <div className="crayon__peeknote">{items[hover].note}</div>}
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="crayon__wall">
            {items.slice(0, shown).map((it, i) => (
              <Tile key={it.seed} item={it} index={i} size={size} watch={watch} onOpen={setOpen} />
            ))}
          </div>
          {shown < items.length && (
            <div ref={more} className="crayon__more">
              drawing the next {Math.min(PAGE, items.length - shown)} of{' '}
              {items.length.toLocaleString('en-IN')}…
            </div>
          )}
        </>
      )}

      {item && open !== null && (
        <div className="crayon__sheet" onClick={() => setOpen(null)}>
          <div className="crayon__sheetinner" onClick={(e) => e.stopPropagation()}>
            <Print item={item} size={printSize} />
            <div className="crayon__caption">
              <div className="crayon__name">{item.name}</div>
              {item.note && <div className="crayon__printnote">{item.note}</div>}
              <div className="crayon__meta">
                <span style={{ background: item.accent }} className="crayon__swatch" />
                {item.accent} · paper {item.paper + 1} · seed {item.seed}
              </div>
              <div className="crayon__recipe">
                {item.recipe.map(([k, v]) => (
                  <span key={k}>
                    {k} {v}
                  </span>
                ))}
              </div>
              <div className="crayon__nav">
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
