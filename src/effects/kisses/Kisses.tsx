import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Globe, type Layout, type Plate } from '../globe/Globe';
import { LayoutToggle } from '../globe/LayoutToggle';
import { bakeKisses, printKiss } from './plates';
import { kisses, type Kiss } from './kiss';
import { sfx } from '../../lib/audio';
import { Loader } from '../loader/Loader';
import type { Sheet } from '../loader/press';

/**
 * A Hundred Kisses.
 *
 * Scribble is a way of *finding* a drawing rather than a texture applied to a
 * finished one, so nothing here is outlined and filled: a pen with momentum is
 * let loose inside each shape and turns back in when it would leave. The form
 * appears because the line spent longer in some places than others.
 */

const COUNT = 100;
const CELL = 190;
const GRID = 10;
const SPACING = 1.42;

export function Kisses({ onExit }: { onExit: () => void }) {
  const [seed, setSeed] = useState(4);
  const [layout, setLayout] = useState<Layout>('grid');
  const [plates, setPlates] = useState<Plate[]>([]);
  const [baked, setBaked] = useState(0);
  const [live, setLive] = useState<Sheet | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);

  const shown = useMemo(() => kisses(COUNT, seed), [seed]);

  useEffect(() => {
    const signal = { cancelled: false };
    setPlates([]);
    setBaked(0);
    setLive(null);
    setOpen(null);
    const t = setTimeout(() => {
      void bakeKisses(shown, {
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
    <div className="book kisses">
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
          background="#191713"
        />
      </div>

      <div className="ink__top">
        <div className="glass ink__plate">
          <div className="ink__eyebrow">100 kisses · one unbroken line each</div>
          <h1 className="ink__title">A Hundred Kisses</h1>
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
            Another hundred
          </button>
          <button className="glass glass--btn" onClick={onExit}>
            ← Shelf
          </button>
        </div>
      </div>

      <div className="glass book__lede">
        A hundred kisses, all scribble. Nothing here is outlined and then filled: a pen with
        momentum is let loose inside each shape, wanders, and turns roughly back in when the next
        step would take it outside — one unbroken line, no lifts, and the form appears because the
        line spent longer in some places than others. Two earlier attempts at this drew a zigzag
        across the shape and then the same zigzag at an angle; the first is corduroy and the second
        is hatching. What makes a scribble a scribble is that the line has no plan.
      </div>

      {baked < 1 && (
        <Loader
          title="A Hundred Kisses"
          done={Math.round(baked * shown.length)}
          total={shown.length}
          plates={live ? [...plates, live] : plates}
          accent="#c85a6a"
          facts={[
            'A scribble has no plan. The direction is only ever the last direction plus a nudge, and the density is how long it was left running.',
            'The upper lip is the furthest forward point of a profile — further than the nose. Get that wrong and the two of them are touching noses.',
            'The searching outline goes round two or three times and never lands in the same place twice. That overlap is the whole difference from a shaky line.',
          ]}
        />
      )}

      {hover !== null && shown[hover] && (
        <div className="glass book__peek kisses__peek">
          <div className="kisses__peeknote">{shown[hover].note}</div>
          <div className="kisses__peekhair">
            {shown[hover].left.hair} · {shown[hover].right.hair}
          </div>
        </div>
      )}

      {one && (
        <div className="book__sheet" onClick={() => setOpen(null)}>
          <div className="glass book__sheetinner" onClick={(e) => e.stopPropagation()}>
            <div className="book__print">
              <PrintOne k={one} />
            </div>
            <div className="book__caption">
              <div className="book__name">{one.note}</div>
              <div className="book__note">
                {one.left.hair} and {one.right.hair}
                {one.extra !== 'none' ? `, with a ${one.extra === 'hand' ? 'hand at the jaw' : one.extra}` : ''}.
                {one.close > 0.01 ? ' Pressed.' : one.close < -0.01 ? ' Not quite yet.' : ' Just met.'}
              </div>
              <div className="book__meta">
                {(open ?? 0) + 1} of {shown.length} · seed {one.seed}
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

function PrintOne({ k }: { k: Kiss }) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const w = Math.min(420, Math.max(260, Math.round(window.innerWidth - 96)));
    el.replaceChildren(printKiss(k, w));
  }, [k]);
  return <div className="book__printhost" ref={host} />;
}
