import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Globe, type Layout, type Plate } from '../globe/Globe';
import { LayoutToggle } from '../globe/LayoutToggle';
import { bakeBreath, printBreath } from './plates';
import { looks, type Look } from './figure';
import { sfx } from '../../lib/audio';
import { Loader } from '../loader/Loader';
import type { Sheet } from '../loader/press';

/**
 * One Breath.
 *
 * A hundred brush drawings, each of them four or five marks and a lot of
 * paper. Nothing is outlined and filled and nothing is stroked: every mark is
 * a ribbon whose width is how hard the hand was pressing, and whose colour is
 * the same variable, because a brush carrying less pigment lays down less of
 * it.
 */

const COUNT = 100;
const CELL = 168;
const GRID = 10;
const SPACING = 1.42;

const SAID: Record<Look['attitude'], string> = {
  recline: 'Lying down, face turned up. The contour is her hair and her shoulder; the face is three marks inside it.',
  profile: 'True profile — the one attitude where the outline is the face, and every landmark from brow to chin has to be in it.',
  turned: 'From behind. No face at all: the mass of the hair, the shoulders it falls onto, and the hairline at the nape.',
  thrown: 'Head back, so the chin is the highest thing on the card and the throat is the longest line.',
  arms: 'Head down on folded arms — the one attitude where two marks have to touch.',
  bust: 'Head and both shoulders. A jaw and a neck, or the silhouette swells from crown to shoulder and prints a bell.',
};

export function OneBreath({ onExit }: { onExit: () => void }) {
  const [seed, setSeed] = useState(3);
  const [layout, setLayout] = useState<Layout>('grid');
  const [plates, setPlates] = useState<Plate[]>([]);
  const [baked, setBaked] = useState(0);
  const [live, setLive] = useState<Sheet | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);

  const shown = useMemo(() => looks(COUNT, seed), [seed]);

  useEffect(() => {
    const signal = { cancelled: false };
    setPlates([]);
    setBaked(0);
    setLive(null);
    setOpen(null);
    const t = setTimeout(() => {
      void bakeBreath(shown, {
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
    <div className="book breath">
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
          <div className="ink__eyebrow">100 drawings · one loaded brush</div>
          <h1 className="ink__title">One Breath</h1>
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
        Nothing here is stroked and nothing is outlined and filled. A stroked path has one width
        along its whole length, and a brush is nothing but its change of width — so every mark is a
        filled ribbon, resampled to an even step and offset to both sides by however hard the hand
        was pressing. The rule that makes it read as wet media rather than a fat pen is that thin is
        also pale: a brush carrying less pigment lays down less of it, so the width and the depth of
        the colour are the same variable. The economy is the subject. Four or five marks, and the
        silhouette is almost never the face.
      </div>

      {baked < 1 && (
        <Loader
          title="One Breath"
          done={Math.round(baked * shown.length)}
          total={shown.length}
          plates={live ? [...plates, live] : plates}
          accent="#e2551f"
          facts={[
            'A head turned towards you shows its hair and its shoulder in outline. The face is interior, and it is three small marks.',
            'Head to shoulder in one smooth swell reads as a bell. Two narrowings and one widening, in that order, reads as a person.',
            'The lips have a fraction of the nose’s relief. Give them the same swing in the chain and a profile prints as a zigzag.',
          ]}
        />
      )}

      {hover !== null && shown[hover] && (
        <div className="glass book__peek breath__peek">
          <div className="breath__peektitle">{shown[hover].title}</div>
          <div className="breath__peekmeta">{shown[hover].attitude}</div>
        </div>
      )}

      {one && (
        <div className="book__sheet" onClick={() => setOpen(null)}>
          <div className="glass book__sheetinner" onClick={(e) => e.stopPropagation()}>
            <div className="book__print">
              <PrintOne v={one} />
            </div>
            <div className="book__caption">
              <div className="book__name">{one.title}</div>
              <div className="book__note">{SAID[one.attitude]}</div>
              <div className="book__meta">
                {(open ?? 0) + 1} of {shown.length} · {one.attitude}
                {one.flip ? ' · reversed' : ''}
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

function PrintOne({ v }: { v: Look }) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const w = Math.min(400, Math.max(250, Math.round(window.innerWidth - 96)));
    el.replaceChildren(printBreath(v, w));
  }, [v]);
  return <div className="book__printhost" ref={host} />;
}
