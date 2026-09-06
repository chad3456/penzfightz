import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Globe, type Layout, type Plate } from '../globe/Globe';
import { LayoutToggle } from '../globe/LayoutToggle';
import { bakeStyles, printStyle } from './plates';
import { FAMILIES, STYLES, type Style } from './styles';
import { sfx } from '../../lib/audio';
import { Loader } from '../loader/Loader';
import type { Sheet } from '../loader/press';

/**
 * A Hundred Ways.
 *
 * One picture, drawn once into a buffer, and a hundred techniques that each
 * read the same luminance and never learn what they are drawing. That is the
 * whole architecture, and it is why a woodcut and a stipple of it are
 * recognisably the same picture: a technique is a rule for turning tone into
 * marks, and the rule is the only thing that changes.
 *
 * The subject is a composition rather than a likeness — the framing, the light
 * and the mood of a face against bar neon.
 */

const CELL = 176;
const GRID = 6;
const SPACING = 1.46;

export function Hundred({ onExit }: { onExit: () => void }) {
  const [seed, setSeed] = useState(1);
  const [layout, setLayout] = useState<Layout>('grid');
  const [only, setOnly] = useState<string>('all');
  const [plates, setPlates] = useState<Plate[]>([]);
  const [baked, setBaked] = useState(0);
  const [live, setLive] = useState<Sheet | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);

  const shown = useMemo(
    () => (only === 'all' ? STYLES : STYLES.filter((s) => s.family === only)),
    [only],
  );

  useEffect(() => {
    const signal = { cancelled: false };
    setPlates([]);
    setBaked(0);
    setLive(null);
    setOpen(null);
    const t = setTimeout(() => {
      void bakeStyles(shown, seed, {
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
  }, [shown, seed]);

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
    <div className="book hundred">
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
          background="#17161a"
        />
      </div>

      <div className="ink__top">
        <div className="glass ink__plate">
          <div className="ink__eyebrow">
            {shown.length} techniques · one picture · nothing drawn twice
          </div>
          <h1 className="ink__title">A Hundred Ways</h1>
        </div>
        <div className="ink__actions">
          <LayoutToggle layout={layout} onChange={setLayout} className="glass glass--btn" />
          <button
            className="glass glass--btn"
            onClick={() => {
              sfx.paper();
              setSeed((s) => s + 1);
            }}
          >
            Redraw the room
          </button>
          <button className="glass glass--btn" onClick={onExit}>
            ← Shelf
          </button>
        </div>
      </div>

      <div className="glass under__kinds hundred__kinds">
        <button
          className={'under__kind' + (only === 'all' ? ' under__kind--on' : '')}
          onClick={() => { setOnly('all'); sfx.tick(); }}
        >
          Everything
        </button>
        {FAMILIES.map((fam) => (
          <button
            key={fam}
            className={'under__kind' + (only === fam ? ' under__kind--on' : '')}
            onClick={() => { setOnly(fam); sfx.tick(); }}
          >
            {fam}
          </button>
        ))}
      </div>

      <div className="glass book__lede">
        One picture and a hundred techniques. The picture is drawn once, tonally, into an offscreen
        buffer, and every technique after that is a <em>resampling</em> of the same luminance —
        engraving, stipple and voronoi are not three drawings but three ways of asking the same
        field what it looks like. None of them knows what it is depicting, which is exactly why
        they all depict it. The subject is a composition rather than a likeness: the framing, the
        low key and the red-and-blue neon of a face in a bar, and not anybody’s face.
      </div>

      {baked < 1 && (
        <Loader
          title="A Hundred Ways"
          done={Math.round(baked * shown.length)}
          total={shown.length}
          plates={live ? [...plates, live] : plates}
          accent="#c8a04a"
          facts={[
            'Every technique reads the same two arrays and none of them knows what it is drawing. That is the reason all hundred draw the same thing.',
            'A mid-grey background is the worst possible ground: it prints as a flat mass in every threshold technique and tells you nothing.',
            'Half of these need the *gradient* rather than the tone — hatching that runs along the form, a flow field, a single line that follows an edge.',
          ]}
        />
      )}

      {hover !== null && shown[hover] && (
        <div className="glass book__peek hundred__peek">
          <div className="hundred__peekname">{shown[hover].name}</div>
          <div className="hundred__peeknote">{shown[hover].note}</div>
        </div>
      )}

      {one && (
        <div className="book__sheet" onClick={() => setOpen(null)}>
          <div className="glass book__sheetinner" onClick={(e) => e.stopPropagation()}>
            <div className="book__print">
              <PrintOne style={one} seed={seed} />
            </div>
            <div className="book__caption">
              <div className="book__name">{one.name}</div>
              <div className="hundred__fam">{one.family}</div>
              <div className="book__note">{one.note}</div>
              <div className="book__meta">
                {(open ?? 0) + 1} of {shown.length}
              </div>
              <div className="book__nav">
                <button className="glass glass--btn" onClick={() => step(-1)}>← Previous</button>
                <button className="glass glass--btn" onClick={() => setOpen(null)}>Close</button>
                <button className="glass glass--btn" onClick={() => step(1)}>Next →</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Drawn again at size, because a stipple at print scale is a different object. */
function PrintOne({ style, seed }: { style: Style; seed: number }) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const w = Math.min(430, Math.max(260, Math.round(window.innerWidth - 96)));
    el.replaceChildren(printStyle(style, seed, w));
  }, [style, seed]);
  return <div className="book__printhost" ref={host} />;
}
