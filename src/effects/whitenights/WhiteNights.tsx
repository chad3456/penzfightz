import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Globe, type Layout, type Plate } from '../globe/Globe';
import { LayoutToggle } from '../globe/LayoutToggle';
import { bakeCards, printCard } from './plates';
import { lines, NIGHTS, quoted, type Line } from './lines';
import { sfx } from '../../lib/audio';
import { Loader } from '../loader/Loader';
import type { Sheet } from '../loader/press';

/**
 * White Nights.
 *
 * A thousand story cards for Dostoevsky's four nights on the Petersburg
 * embankment. Each is a portrait and a line of dialogue, and the dialogue is
 * *written* — a cursive alphabet stored as skeletons and inked with a pointed
 * nib, joined up word by word — rather than set in a face that looks casual.
 *
 * Nothing in the deck is a picture of anybody. A head is a set of landmarks in
 * three dimensions, and a three-quarter view is those landmarks rotated about a
 * vertical axis, so the far eye foreshortens and the far cheek goes behind the
 * nose for free.
 */

const COUNT = 1000;
const CELL = 150;
const GRID = 10;
/** Portrait cards pack closer than square ones before they touch. */
const SPACING = 1.5;

const FILTERS: { id: 'all' | 'nastenka' | 'dreamer' | number; label: string }[] = [
  { id: 'all', label: 'Everything' },
  { id: 'nastenka', label: 'Nastenka' },
  { id: 'dreamer', label: 'The dreamer' },
  { id: 0, label: 'First Night' },
  { id: 1, label: 'Second Night' },
  { id: 2, label: 'Third Night' },
  { id: 3, label: 'Fourth Night' },
  { id: 4, label: 'Morning' },
];

export function WhiteNights({ onExit }: { onExit: () => void }) {
  const [seed, setSeed] = useState(5);
  const [layout, setLayout] = useState<Layout>('grid');
  const [only, setOnly] = useState<'all' | 'nastenka' | 'dreamer' | number>('all');
  const [plates, setPlates] = useState<Plate[]>([]);
  const [baked, setBaked] = useState(0);
  const [live, setLive] = useState<Sheet | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);

  const all = useMemo(() => lines(COUNT, seed), [seed]);
  const shown = useMemo(
    () =>
      only === 'all'
        ? all
        : all.filter((l) => (typeof only === 'number' ? l.night === only : l.voice === only)),
    [all, only],
  );

  useEffect(() => {
    const signal = { cancelled: false };
    setPlates([]);
    setBaked(0);
    setLive(null);
    setOpen(null);
    const t = setTimeout(() => {
      void bakeCards(shown, {
        cell: CELL,
        grid: GRID,
        onProgress: (d, total) => !signal.cancelled && setBaked(d / total),
        onPlate: (plate) => !signal.cancelled && setPlates((p) => [...p, plate]),
        onSheet: (sh) => !signal.cancelled && setLive(sh),
        signal,
      }).catch(() => undefined);
    }, 20);
    return () => {
      signal.cancelled = true;
      clearTimeout(t);
    };
  }, [shown]);

  const step = useCallback(
    (d: number) => {
      setOpen((o) => (o === null ? o : (o + d + shown.length) % shown.length));
      sfx.tick();
    },
    [shown.length],
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

  const one = open === null ? null : shown[open];

  return (
    <div className="book nights">
      <div className="book__globe">
        <Globe
          plates={plates}
          count={shown.length}
          picked={open}
          hovered={hover}
          onPick={setOpen}
          onHover={(i) => setHover(i)}
          spacing={SPACING}
          layout={layout}
          background="#16171b"
        />
      </div>

      <div className="ink__top">
        <div className="glass ink__plate">
          <div className="ink__eyebrow">
            {shown.length.toLocaleString()} cards · every word written, not set
          </div>
          <h1 className="ink__title">White Nights</h1>
        </div>
        <div className="ink__actions">
          <LayoutToggle layout={layout} onChange={setLayout} className="glass glass--btn" />
          <button
            className="glass glass--btn"
            onClick={() => {
              sfx.paper();
              setSeed((s) => s + 1 + Math.floor(Math.random() * 900));
            }}
          >
            Another thousand
          </button>
          <button className="glass glass--btn" onClick={onExit}>
            ← Shelf
          </button>
        </div>
      </div>

      <div className="glass under__kinds nights__kinds">
        {FILTERS.map((k) => (
          <button
            key={String(k.id)}
            className={'under__kind' + (only === k.id ? ' under__kind--on' : '')}
            onClick={() => {
              setOnly(k.id);
              sfx.tick();
            }}
          >
            {k.label}
          </button>
        ))}
      </div>

      <div className="glass book__lede">
        Four nights and a morning on the embankment, in the summer when it never gets dark. Every
        card is a face and a line of dialogue, and the dialogue is <em>handwritten</em>: a cursive
        alphabet kept as skeletons, joined letter to letter, and inked with a pointed nib whose
        width comes from the direction it is travelling — heavy on the pull, a hairline on the lift.
        The faces are built rather than drawn. A head is a set of landmarks in three dimensions, so
        a three-quarter view is those landmarks turned about a vertical axis and the far eye
        foreshortens by itself. A dozen of the lines are Dostoevsky’s own and say so; the rest are
        in his register.
      </div>

      {baked < 1 && (
        <Loader
          title="White Nights"
          done={Math.round(baked * shown.length)}
          total={shown.length}
          plates={live ? [...plates, live] : plates}
          accent="#c8a24a"
          facts={[
            'A pointed nib splays under pressure, and pressure happens on the pull. Heavy going down, a hairline going up — everything else is detail.',
            'r reads as n the moment its arm comes back down. Shoulder first, then the stem, and it can only be an r.',
            'A head is deeper than it is wide, so a turned one is wider on the page, not narrower. The contour is solved rather than fudged.',
          ]}
        />
      )}

      {hover !== null && shown[hover] && (
        <div className="glass book__peek nights__peek">
          <div className="nights__peekwho">
            {shown[hover].voice === 'nastenka' ? 'Nastenka' : 'The dreamer'} ·{' '}
            {NIGHTS[shown[hover].night]}
          </div>
          <div className="nights__peekline">{shown[hover].text}</div>
        </div>
      )}

      {one && (
        <div className="book__sheet" onClick={() => setOpen(null)}>
          <div className="glass book__sheetinner" onClick={(e) => e.stopPropagation()}>
            <div className="book__print">
              <PrintOne line={one} />
            </div>
            <div className="book__caption">
              <div className="book__name">
                {one.voice === 'nastenka' ? 'Nastenka' : 'The dreamer'}
              </div>
              <div className="book__note">
                {NIGHTS[one.night]}
                {quoted(one.text) ? ' · Dostoevsky’s own words, in Garnett’s translation' : ''}
              </div>
              <div className="book__meta">
                card {(open ?? 0) + 1} of {shown.length.toLocaleString()} · seed {one.seed}
              </div>
              <div className="book__nav">
                <button className="glass glass--btn" onClick={() => step(-1)}>
                  ← Previous
                </button>
                <button className="glass glass--btn" onClick={() => setOpen(null)}>
                  Close
                </button>
                <button className="glass glass--btn" onClick={() => step(1)}>
                  Next →
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
 * The card, drawn again rather than scaled.
 *
 * Every width in the medium is a fraction of the short side, so at print size
 * it is the same card with more room in it — and, more to the point, the
 * handwriting is legible instead of implied.
 */
function PrintOne({ line }: { line: Line }) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const w = Math.min(430, Math.max(260, Math.round(window.innerWidth - 96)));
    el.replaceChildren(printCard(line, w));
  }, [line]);
  return <div className="book__printhost" ref={host} />;
}
