import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Globe, type Layout, type Plate } from '../globe/Globe';
import { LayoutToggle } from '../globe/LayoutToggle';
import { bakePortraits, printPortrait } from './plates';
import { deck, variants, type Variant } from './portrait';
import { GODS, GOD_BY_ID } from './gods';
import { sfx } from '../../lib/audio';
import { Loader } from '../loader/Loader';
import type { Sheet } from '../loader/press';

/**
 * Darshan.
 *
 * *Darshan* is the word for the act of seeing a deity, and of being seen back;
 * it is what you go to a temple for. Thirteen gods, thirty-two of each, and
 * none of the four hundred and sixteen is a drawing that exists anywhere — a
 * jointed figure is posed, lit by a single terminator that crosses the whole
 * body, and given the attributes that name it.
 *
 * The iconography is the received one rather than anything invented. Krishna
 * is the colour of a rain cloud and holds a flute; put a discus in that hand
 * and the picture means Vishnu instead.
 */

const PER_GOD = 32;
const CELL = 156;
const GRID = 8;
/** Portrait cards pack closer than square ones before they touch. */
const SPACING = 1.52;

export function Darshan({ onExit }: { onExit: () => void }) {
  const [seed, setSeed] = useState(3);
  const [layout, setLayout] = useState<Layout>('grid');
  const [only, setOnly] = useState<string>('all');
  const [plates, setPlates] = useState<Plate[]>([]);
  const [baked, setBaked] = useState(0);
  const [live, setLive] = useState<Sheet | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);

  const shown = useMemo(
    () => (only === 'all' ? deck(PER_GOD, seed) : variants(GOD_BY_ID[only], PER_GOD, seed)),
    [only, seed],
  );

  useEffect(() => {
    const signal = { cancelled: false };
    setPlates([]);
    setBaked(0);
    setLive(null);
    setOpen(null);
    const t = setTimeout(() => {
      void bakePortraits(shown, {
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
    <div className="book darshan">
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
          background="#1b1a16"
        />
      </div>

      <div className="ink__top">
        <div className="glass ink__plate">
          <div className="ink__eyebrow">
            {shown.length.toLocaleString()} portraits · {GODS.length} gods · {PER_GOD} postures each
          </div>
          <h1 className="ink__title">Darshan</h1>
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
            Draw them again
          </button>
          <button className="glass glass--btn" onClick={onExit}>
            ← Shelf
          </button>
        </div>
      </div>

      <div className="glass under__kinds darshan__kinds">
        <button
          className={'under__kind' + (only === 'all' ? ' under__kind--on' : '')}
          onClick={() => {
            setOnly('all');
            sfx.tick();
          }}
        >
          Everyone
        </button>
        {GODS.map((g) => (
          <button
            key={g.id}
            className={'under__kind' + (only === g.id ? ' under__kind--on' : '')}
            onClick={() => {
              setOnly(g.id);
              sfx.tick();
            }}
          >
            {g.name}
          </button>
        ))}
      </div>

      <div className="glass book__lede">
        <em>Darshan</em> is the word for seeing a god, and for being seen back. Thirteen of them,
        thirty-two postures apiece, and not one of the four hundred and sixteen exists as a drawing
        anywhere: a jointed figure is posed — <em>tribhanga</em>, the triple bend every Krishna in
        stone stands in; <em>alidha</em>, the archer’s lunge — and then lit by a single terminator
        that crosses the whole body, so thirty separate shapes turn away from the light at the same
        moment and read as one person. The iconography is the received one. Krishna is the colour
        of a rain cloud and holds a flute; put a discus in that hand and the picture is Vishnu.
      </div>

      {baked < 1 && (
        <Loader
          title="Darshan"
          done={Math.round(baked * shown.length)}
          total={shown.length}
          plates={live ? [...plates, live] : plates}
          accent="#d9a83f"
          facts={[
            'One light, one terminator, and every part of the body clipped against the same line. Shade each limb on its own normal and you get thirty correctly-lit objects that are not a person.',
            'A seated figure is not a standing one with its knees bent — the whole body drops, and what you can actually see of the legs is cloth.',
            'The eye line is half way down the head. Put it under the hairline, where everybody first puts it, and every god looks startled.',
          ]}
        />
      )}

      {hover !== null && shown[hover] && (
        <div className="glass book__peek darshan__peek">
          <div className="darshan__peekname">
            {shown[hover].god.name} <span>{shown[hover].god.script}</span>
          </div>
          <div className="darshan__peekline">{shown[hover].line}</div>
        </div>
      )}

      {one && (
        <div className="book__sheet" onClick={() => setOpen(null)}>
          <div className="glass book__sheetinner" onClick={(e) => e.stopPropagation()}>
            <div className="book__print">
              <PrintOne v={one} />
            </div>
            <div className="book__caption">
              <div className="book__name">
                {one.god.name} <span className="darshan__script">{one.god.script}</span>
              </div>
              <div className="darshan__epithet">{one.god.epithet}</div>
              <div className="book__note">{one.god.note}</div>
              <div className="darshan__row">
                <span>{one.poseName}</span>
                <span>{one.god.vahana}</span>
              </div>
              <div className="book__meta">
                {one.index + 1} of {PER_GOD} · card {(open ?? 0) + 1} of{' '}
                {shown.length.toLocaleString()}
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
 * The portrait, drawn again rather than scaled.
 *
 * Every width in the medium is a fraction of the short side, so at print size
 * it is the same picture with more room in it — and the jewellery, which is
 * three pixels in the atlas, becomes jewellery.
 */
function PrintOne({ v }: { v: Variant }) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const w = Math.min(420, Math.max(260, Math.round(window.innerWidth - 96)));
    el.replaceChildren(printPortrait(v, w));
  }, [v]);
  return <div className="book__printhost" ref={host} />;
}
