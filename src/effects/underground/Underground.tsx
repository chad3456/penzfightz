import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Globe, type Layout, type Plate } from '../globe/Globe';
import { LayoutToggle } from '../globe/LayoutToggle';
import { bakePanels, printPanel } from './plates';
import { jokes, type Joke, type Kind } from './joke';
import { sfx } from '../../lib/audio';
import { Loader } from '../loader/Loader';
import type { Sheet } from '../loader/press';

/**
 * Notes from Under the Stairs.
 *
 * A thousand single-panel cartoons in one register. The joke is always the same
 * joke — a man does something and immediately begins performing his own
 * reaction to it, for an audience of one — and the thousand versions are what
 * that looks like from a thousand angles.
 *
 * Nothing here is written out. Fifty mechanisms, each of which is a *shape* of
 * joke rather than a sentence with holes in it, and ten vocabularies that
 * supply the specifics the mechanism then does something to. The picture is
 * never the punchline: it is the situation, drawn as spot black on grey paper
 * with one warm light in it, and the turn happens in the italic line underneath
 * and nowhere else.
 */

const COUNT = 1000;
const CELL = 164;
const GRID = 10;
/** Square panels pack close; this is the gap that stops them touching. */
const SPACING = 1.44;

/**
 * What each mechanism is, said once.
 *
 * The printed panel already carries the joke, so repeating the setup and the
 * turn beside it makes the reader read the same two lines twice and gives the
 * second reading nothing. What the margin can usefully hold is the *shape* —
 * which of the twelve hinges this one turns on — because that is the thing a
 * reader works out by the fortieth panel and might as well be told at the
 * first.
 */
const NOTE: Record<Kind, string> = {
  pride: 'He was not slighted, and has prepared remarks about not having been.',
  confession: 'The confession is complete, and it is waiting to be admired.',
  slight: 'Something nobody else registered, kept, and worked on.',
  debt: 'The money is not the relationship. The owing is.',
  paperwork: 'A department, a form, and a man who has begun to take it personally.',
  charity: 'The gift was real. So was the wish to be seen giving it.',
  god: 'A question settled at a table, by the last man at the table.',
  illness: 'The symptom is being saved for a moment when it will mean something.',
  party: 'A doorway, an expression decided on in advance, and nobody looking up.',
  letter: 'Everything said, at length, to a drawer.',
  stairs: 'The thing to say arrives one flight below where it was needed.',
  funeral: 'A grief he can watch himself having.',
};

const KINDS: { id: Kind | 'all'; label: string }[] = [
  { id: 'all', label: 'Everything' },
  { id: 'pride', label: 'Pride' },
  { id: 'confession', label: 'Confession' },
  { id: 'slight', label: 'The slight' },
  { id: 'debt', label: 'Debt' },
  { id: 'paperwork', label: 'The department' },
  { id: 'charity', label: 'Charity' },
  { id: 'god', label: 'God' },
  { id: 'illness', label: 'Illness' },
  { id: 'party', label: 'The party' },
  { id: 'letter', label: 'Letters' },
  { id: 'stairs', label: 'The stairs' },
  { id: 'funeral', label: 'Funerals' },
];

export function Underground({ onExit }: { onExit: () => void }) {
  const [seed, setSeed] = useState(7);
  const [layout, setLayout] = useState<Layout>('grid');
  const [only, setOnly] = useState<Kind | 'all'>('all');
  const [plates, setPlates] = useState<Plate[]>([]);
  const [baked, setBaked] = useState(0);
  const [live, setLive] = useState<Sheet | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);

  const all = useMemo(() => jokes(COUNT, seed), [seed]);
  const shown = useMemo(() => (only === 'all' ? all : all.filter((j) => j.kind === only)), [all, only]);

  useEffect(() => {
    const signal = { cancelled: false };
    setPlates([]);
    setBaked(0);
    setLive(null);
    setOpen(null);
    const t = setTimeout(() => {
      void bakePanels(shown, {
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
    <div className="book under">
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
          background="#181715"
        />
      </div>

      <div className="ink__top">
        <div className="glass ink__plate">
          <div className="ink__eyebrow">
            {shown.length.toLocaleString()} panels · 50 mechanisms · canvas 2d, nothing written out
          </div>
          <h1 className="ink__title">Notes from Under the Stairs</h1>
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

      <div className="glass under__kinds">
        {KINDS.map((k) => (
          <button
            key={k.id}
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
        One joke, a thousand times. A man does something and immediately begins composing his own
        account of it, for an audience of one — the confession that wants applause, the generosity
        that follows the beggar for six streets to see what he does with the money, the two-year
        campaign of revenge for a slight the other man never noticed. Nothing here is a written
        joke: fifty mechanisms, each a <em>shape</em> of joke rather than a sentence with holes in
        it, and ten vocabularies supplying what the mechanism then does something to. The picture
        is never the punchline. It is the situation, in spot black with one warm light in it, and
        the turn is the italic line underneath.
      </div>

      {baked < 1 && (
        <Loader
          title="Notes from Under the Stairs"
          done={Math.round(baked * shown.length)}
          total={shown.length}
          plates={live ? [...plates, live] : plates}
          accent="#c8842a"
          facts={[
            'The picture is never the punchline. Draw the turn and the caption becomes a label, and the whole thing dies.',
            'One accent colour, ochre, and it is only ever light: a lamp, a candle, somebody else’s evening through a window.',
            'A man in true profile has one eye and a snout. This one is a filled silhouette with a nose notch, so the shape has a direction.',
          ]}
        />
      )}

      {hover !== null && shown[hover] && (
        <div className="glass book__peek under__peek">
          <div className="under__peeksetup">{shown[hover].setup}</div>
          <div className="under__peekturn">{shown[hover].turn}</div>
        </div>
      )}

      {one && (
        <div className="book__sheet" onClick={() => setOpen(null)}>
          <div className="glass book__sheetinner" onClick={(e) => e.stopPropagation()}>
            <div className="book__print">
              <PrintOne joke={one} />
            </div>
            <div className="book__caption">
              <div className="book__name">{KINDS.find((k) => k.id === one.kind)?.label ?? one.kind}</div>
              <div className="book__note">{NOTE[one.kind]}</div>
              <div className="book__meta">
                panel {(open ?? 0) + 1} of {shown.length.toLocaleString()} · seed {one.seed}
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
 * The panel, drawn again rather than scaled.
 *
 * Every width in the medium is a fraction of the short side, so running it at
 * print size gives the same drawing with more room in it — and, more to the
 * point, a caption you can read.
 */
function PrintOne({ joke }: { joke: Joke }) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const w = Math.min(520, Math.max(280, Math.round(window.innerWidth - 96)));
    el.replaceChildren(printPanel(joke, w));
  }, [joke]);
  return <div className="book__printhost" ref={host} />;
}
