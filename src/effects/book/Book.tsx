import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Globe, type Plate } from '../globe/Globe';
import { bakeBook, printBook } from './plates';
import { cast } from './people';
import type { Person } from './portrait';
import { sfx } from '../../lib/audio';

/**
 * Picture Book.
 *
 * A hundred people in one hand. Every other gallery in this case makes a
 * thousand of something and the number is part of the argument; this one is
 * deliberately small, because the claim it is making is different. The others
 * are about *range* — how far one method can be pushed before it repeats. This
 * one is about *style*: whether a generator can hold a single illustrator's
 * hand steady across a whole cast, so that a hundred faces read as a hundred
 * spreads from one book rather than a hundred outputs from one program.
 *
 * So the mark never changes. Same torn ground, same warm charcoal line, same
 * pencil scuff over every fill, same grain on top. What varies is who is under
 * it — the head, the hair, the hat, the glasses, the beard and the shirt — and
 * the caption is read off the same seed as the picture, so the trade always
 * matches the hat.
 */

const COUNT = 100;
const CELL = 168;
const GRID = 10;
/** Square cards pack tighter than the landscape ones the globe was built for. */
const SPACING = 1.42;

export function Book({ onExit }: { onExit: () => void }) {
  const [seed, setSeed] = useState(3);
  const [plates, setPlates] = useState<Plate[]>([]);
  const [baked, setBaked] = useState(0);
  const [open, setOpen] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);

  const people = useMemo(() => cast(COUNT, seed), [seed]);

  useEffect(() => {
    const signal = { cancelled: false };
    setPlates([]);
    setBaked(0);
    setOpen(null);
    const t = setTimeout(() => {
      void bakeBook(people, {
        cell: CELL,
        grid: GRID,
        onProgress: (d, total) => !signal.cancelled && setBaked(d / total),
        onPlate: (plate) => !signal.cancelled && setPlates((all) => [...all, plate]),
        signal,
      }).catch(() => undefined);
    }, 20);
    return () => {
      signal.cancelled = true;
      clearTimeout(t);
    };
  }, [people]);

  const step = useCallback(
    (d: number) => {
      setOpen((o) => (o === null ? o : (o + d + people.length) % people.length));
      sfx.tick();
    },
    [people.length],
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

  const who = open === null ? null : people[open];

  return (
    <div className="book">
      <div className="book__globe">
        <Globe
          plates={plates}
          count={people.length}
          picked={open}
          hovered={hover}
          onPick={setOpen}
          onHover={(i) => setHover(i)}
          spacing={SPACING}
          background="#1b1a19"
        />
      </div>

      <div className="ink__top">
        <div className="glass ink__plate">
          <div className="ink__eyebrow">
            {COUNT} people · one hand · canvas 2d, no photographs
          </div>
          <h1 className="ink__title">Picture Book</h1>
        </div>
        <div className="ink__actions">
          <button
            className="glass glass--btn"
            onClick={() => {
              sfx.paper();
              setSeed((s) => s + 1 + Math.floor(Math.random() * 900));
            }}
          >
            New cast
          </button>
          <button className="glass glass--btn" onClick={onExit}>
            ← Shelf
          </button>
        </div>
      </div>

      <div className="glass book__lede">
        A hundred neighbours, none of them anybody. The style is fixed and the person is not: every
        card gets the same torn ground, the same warm charcoal line, the same pencil scuff over
        every fill and the same grain on top, and what changes underneath is the head, the hair, the
        hat and the shirt. Nothing here is a photograph or a trace of one — a beard is nine hundred
        drawn strands, straw is two passes of weave crossing at a shallow angle, and the caption is
        read off the same seed as the face, so the trade always matches the hat. Turn the globe,
        hover to read one, click to draw it again at size.
      </div>

      {baked < 1 && (
        <div className="glass book__baking">
          <div className="book__bakebar">
            <span style={{ width: `${Math.round(baked * 100)}%` }} />
          </div>
          <div className="book__baketext">
            drawing {Math.round(baked * people.length)} of {people.length}
          </div>
        </div>
      )}

      {hover !== null && people[hover] && (
        <div className="glass book__peek">
          <div className="book__peekname">{people[hover].name}</div>
          <div className="book__peeknote">{people[hover].note}</div>
        </div>
      )}

      {who && (
        <div className="book__sheet" onClick={() => setOpen(null)}>
          <div className="glass book__sheetinner" onClick={(e) => e.stopPropagation()}>
            <PrintOne who={who} />
            <div className="book__caption">
              <div className="book__name">{who.name}</div>
              <div className="book__note">{who.note}</div>
              <div className="book__meta">
                {who.hat === 'none' ? 'no hat' : `${who.hat} hat`} ·{' '}
                {who.glasses === 'none' ? 'no glasses' : `${who.glasses} glasses`} ·{' '}
                {who.beard === 'none' ? 'clean-shaven' : who.beard} · seed {who.seed}
              </div>
              <div className="book__nav">
                <button className="glass glass--btn" onClick={() => step(-1)}>
                  ← Before
                </button>
                <button className="glass glass--btn" onClick={() => setOpen(null)}>
                  Close
                </button>
                <button className="glass glass--btn" onClick={() => step(1)}>
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
 * The same portrait, drawn again.
 *
 * Not the card scaled up. Every width in the medium is a fraction of the short
 * side, so running it at print size gives the same drawing with more room in
 * it: the four hundred strands in a beard that were a smudge at 168 pixels are
 * four hundred strands at 520.
 */
function PrintOne({ who }: { who: Person }) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const width = Math.min(520, Math.max(240, Math.round(window.innerWidth - 96)));
    el.replaceChildren(printBook(who, width));
  }, [who]);
  // React renders nothing inside this node; the canvas is put there by hand.
  return (
    <div className="book__print">
      <div className="book__printhost" ref={host} />
    </div>
  );
}
