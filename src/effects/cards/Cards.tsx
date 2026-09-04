import { useCallback, useEffect, useRef, useState } from 'react';
import { Globe, type Layout, type Plate } from '../globe/Globe';
import { LayoutToggle } from '../globe/LayoutToggle';
import { bakeDeck, printCard } from './plates';
import { auditDeck, DECK, type Card } from './card';
import { sfx } from '../../lib/audio';
import { Loader } from '../loader/Loader';
import type { Sheet } from '../loader/press';

/**
 * Fifty-Two Cats.
 *
 * A full deck — fifty-two, both jokers — where the pips are not a count printed
 * on a card but *objects*, and a cat is interfering with them. That single rule
 * is the whole design, and it is what makes a deck rather than a set of
 * illustrations: every card has to solve the same puzzle, which is to find a
 * reason for exactly this many of exactly this shape to be somewhere a cat can
 * get at them.
 *
 * Nothing here is an image file. Every card is drawn at request time in canvas
 * 2d: cream stock with fibre and foxing, a hand-cut pen line with a taper on
 * it, hatching and stipple for the made things, and three impressions through a
 * press so the ink spreads and the register is a hair out.
 *
 * The one number that is checked rather than trusted is the pip count. Cards go
 * through an audit that draws all fifty-four and counts the pips that actually
 * reached the paper, because a five with four diamonds on it is not a
 * stylistic choice.
 */

const CELL = 232;
const GRID = 8;
/** Tall cards need more room round them on the shell than square ones. */
const SPACING = 1.62;

export function Cards({ onExit }: { onExit: () => void }) {
  const [layout, setLayout] = useState<Layout>('grid');
  const [plates, setPlates] = useState<Plate[]>([]);
  const [baked, setBaked] = useState(0);
  const [live, setLive] = useState<Sheet | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [hand, setHand] = useState<number[] | null>(null);
  const [misprints, setMisprints] = useState<string | null>(null);

  useEffect(() => {
    const signal = { cancelled: false };
    setPlates([]);
    setBaked(0);
    const t = setTimeout(() => {
      void bakeDeck(DECK, {
        cell: CELL,
        grid: GRID,
        onProgress: (d, total) => !signal.cancelled && setBaked(d / total),
        onPlate: (plate) => !signal.cancelled && setPlates((all) => [...all, plate]),
        onSheet: (sh) => !signal.cancelled && setLive(sh),
        signal,
      }).catch(() => undefined);
    }, 20);
    return () => {
      signal.cancelled = true;
      clearTimeout(t);
    };
  }, []);

  const step = useCallback((d: number) => {
    setOpen((o) => (o === null ? o : (o + d + DECK.length) % DECK.length));
    sfx.tick();
  }, []);

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

  const card = open === null ? null : DECK[open];

  const deal = () => {
    sfx.paper();
    const pool = [...DECK.keys()];
    const picked: number[] = [];
    for (let i = 0; i < 5; i++) picked.push(...pool.splice(Math.floor(Math.random() * pool.length), 1));
    setHand(picked);
    setOpen(null);
  };

  return (
    <div className="book deck">
      <div className="book__globe">
        <Globe
          plates={plates}
          count={DECK.length}
          picked={open}
          hovered={hover}
          onPick={setOpen}
          onHover={(i) => setHover(i)}
          spacing={SPACING}
          layout={layout}
          background="#1d1b18"
        />
      </div>

      <div className="ink__top">
        <div className="ink__plate glass">
          <div className="ink__eyebrow">54 cards · one ink · canvas 2d, nothing sampled</div>
          <h1 className="ink__title">Fifty-Two Cats</h1>
        </div>
        <div className="ink__actions">
          <LayoutToggle layout={layout} onChange={setLayout} className="glass glass--btn" />
          <button className="glass glass--btn" onClick={deal}>
            Deal five
          </button>
          <button
            className="glass glass--btn"
            onClick={() => {
              const bad = auditDeck();
              setMisprints(
                bad.length
                  ? bad.map((b) => `${b.id}: wanted ${b.want}, printed ${b.got}`).join(' · ')
                  : 'All fifty-four counted. No misprints.',
              );
            }}
            title="Redraw every card and count the pips that actually reached the paper"
          >
            Count the pips
          </button>
          <button className="glass glass--btn" onClick={onExit}>
            ← Shelf
          </button>
        </div>
      </div>

      <div className="glass book__lede">
        The pips are objects. That is the whole rule, and every card has to obey it: five diamonds
        are five things somebody has washed and pegged out, ten clubs are what was on the shelf
        before the shelf was investigated, and an ace of spades is a hole in the garden nobody is
        answering questions about. The cats are pure outline and the furniture is hatched, which is
        how an engraver tells a creature from a chair without reaching for a second colour. Turn the
        shelf, hover for the name, click to have one drawn again at size.
      </div>

      {baked < 1 && (
        <Loader
          title="Fifty-Two Cats"
          done={Math.round(baked * DECK.length)}
          total={DECK.length}
          plates={live ? [...plates, live] : plates}
          accent="#c8352c"
          facts={[
            'Every pip goes on through one function that counts as it goes, and the deck refuses to agree it is finished until fifty-four counts match fifty-four ranks.',
            'The press draws each card three times: a soft spread, the impression, and a ghost a hair out of register. The ghost is what makes it look printed.',
            'Cats are smoothed outline and furniture is hatched with the corners kept. Smooth what grew; keep the corners on what was made.',
          ]}
        />
      )}

      {hover !== null && DECK[hover] && (
        <div className="glass book__peek">
          <div className="book__peekname">{DECK[hover].name}</div>
          <div className="book__peeknote">{DECK[hover].joke}</div>
        </div>
      )}

      {misprints && (
        <div className="glass deck__audit" onClick={() => setMisprints(null)}>
          {misprints}
        </div>
      )}

      {hand && (
        <div className="deck__hand" onClick={() => setHand(null)}>
          <div className="deck__handinner" onClick={(e) => e.stopPropagation()}>
            {hand.map((i, k) => (
              <button
                key={i}
                className="deck__handcard"
                style={{ transform: `rotate(${(k - 2) * 5}deg) translateY(${Math.abs(k - 2) * 9}px)` }}
                onClick={() => {
                  setOpen(i);
                  setHand(null);
                }}
              >
                <PrintOne card={DECK[i]} width={150} />
              </button>
            ))}
            <button className="glass glass--btn deck__handclose" onClick={() => setHand(null)}>
              Fold
            </button>
          </div>
        </div>
      )}

      {card && (
        <div className="book__sheet" onClick={() => setOpen(null)}>
          <div className="glass book__sheetinner" onClick={(e) => e.stopPropagation()}>
            <div className="book__print">
              <PrintOne card={card} />
            </div>
            <div className="book__caption">
              <div className="book__name">{card.name}</div>
              <div className="book__note">{card.joke}</div>
              <div className="book__meta">
                {card.pips === 0 ? 'a court card, no pips' : `${card.pips} pip${card.pips === 1 ? '' : 's'}`} ·{' '}
                {card.red ? 'red plate' : 'black plate'} · seed {card.seed}
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
 * Every width in the medium is a fraction of the short side, so running it at
 * print size gives the same drawing with more room in it: the fibre in the
 * stock that was a smudge in the atlas is fifteen hundred separate flecks at
 * four hundred pixels.
 */
function PrintOne({ card, width }: { card: Card; width?: number }) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const w = width ?? Math.min(400, Math.max(230, Math.round(window.innerWidth - 120)));
    el.replaceChildren(printCard(card, w));
  }, [card, width]);
  return <div className="book__printhost" ref={host} />;
}
