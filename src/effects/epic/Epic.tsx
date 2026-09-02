import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Globe, type Layout, type Plate } from '../globe/Globe';
import { LayoutToggle } from '../globe/LayoutToggle';
import { bakeEpic, printEpic } from './plates';
import { NAMED, beings } from './cast';
import type { Being } from './figure';
import { sfx } from '../../lib/audio';
import { Loader } from '../loader/Loader';
import type { Sheet } from '../loader/press';

/**
 * Name and Form.
 *
 * Two thousand figures out of the Mahabharata, the Ramayana and the asura
 * literature, drawn by the same hand as Picture Book — the same head, the same
 * torn ground, the same crayon scuff and grain. That is the point of doing it
 * this way. The claim the picture book makes is that a generator can hold one
 * illustrator's hand steady across a cast; the honest test of the claim is to
 * hand that hand a completely different subject and see whether it still looks
 * like one book.
 *
 * ### What a card is
 *
 * *Nāma-rūpa* — name and form. There is no likeness in any of this and there
 * could not be. Two hundred and sixty-eight of these are figures the texts
 * name, each carrying the attributes the texts give them: that this one is dark
 * as a rain cloud, that one wears matted locks, that one has fangs, that one
 * bound her own eyes. Everything else about the face comes from the seed.
 *
 * The rest are the host. The epics are full of thousands who are counted and
 * never named — eighteen akshauhinis at Kurukshetra, the vanara army at the
 * bridge, the night-rangers of Lanka, the ganas on the mountain — and every one
 * of those cards says so on its face. That seemed better than either padding
 * the roster with invented characters or pretending the epics contain only the
 * people with speaking parts.
 */

const COUNT = 2000;
const CELL = 132;
const GRID = 13;
/** Square cards; see `globeRadius`. */
const SPACING = 1.17;

type Filter = 'all' | 'named' | Being['book'];

const TABS: { id: Filter; name: string }[] = [
  { id: 'all', name: 'Everything' },
  { id: 'named', name: `The named (${NAMED})` },
  { id: 'mahabharata', name: 'Mahābhārata' },
  { id: 'ramayana', name: 'Rāmāyaṇa' },
  { id: 'asura', name: 'Asuras' },
  { id: 'deva', name: 'Devas' },
  { id: 'rishi', name: 'Seers' },
];

export function Epic({ onExit }: { onExit: () => void }) {
  const [seed, setSeed] = useState(5);
  const [layout, setLayout] = useState<Layout>('grid');
  const [filter, setFilter] = useState<Filter>('all');
  const [plates, setPlates] = useState<Plate[]>([]);
  const [baked, setBaked] = useState(0);
  const [live, setLive] = useState<Sheet | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);

  const cast = useMemo(
    () => beings(COUNT, seed, filter === 'all' ? undefined : filter),
    [seed, filter],
  );

  useEffect(() => {
    const signal = { cancelled: false };
    setPlates([]);
    setBaked(0);
    setLive(null);
    setOpen(null);
    const t = setTimeout(() => {
      void bakeEpic(cast, {
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
  }, [cast]);

  const step = useCallback(
    (d: number) => {
      setOpen((o) => (o === null ? o : (o + d + cast.length) % cast.length));
      sfx.tick();
    },
    [cast.length],
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

  const who = open === null ? null : cast[open];

  return (
    <div className="book epic">
      <div className="book__globe">
        <Globe
          plates={plates}
          count={cast.length}
          picked={open}
          hovered={hover}
          onPick={setOpen}
          onHover={(i) => setHover(i)}
          spacing={SPACING}
              layout={layout}
          background="#14120f"
        />
      </div>

      <div className="ink__top">
        <div className="glass ink__plate">
          <div className="ink__eyebrow">
            {cast.length.toLocaleString('en-IN')} figures · {NAMED} of them named · nāma-rūpa
          </div>
          <h1 className="ink__title">Name and Form</h1>
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
            Draw again
          </button>
          <button className="glass glass--btn" onClick={onExit}>
            ← Shelf
          </button>
        </div>
      </div>

      <div className="epic__tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`glass glass--btn${filter === t.id ? ' glass--on' : ''}`}
            onClick={() => {
              sfx.tick();
              setFilter(t.id);
            }}
          >
            {t.name}
          </button>
        ))}
      </div>

      <div className="glass book__lede">
        <em>Nāma-rūpa</em> — name and form. Nothing here is a likeness and nothing here could be.
        The roster records only what the texts record — that this one is dark as a rain cloud, that
        one wears matted locks, that one has fangs, that one bound her own eyes for a lifetime — and
        the generator draws a face under it in the same hand that drew the picture book. The rest
        are the host: the epics count thousands they never name, and every one of those cards says
        so. Turn the globe, hover to read one, click to draw it again at size.
      </div>

      {baked < 1 && (
        <Loader
          title="Name and Form"
          done={Math.round(baked * cast.length)}
          total={cast.length}
          plates={live ? [...plates, live] : plates}
          accent="#d0762c"
          facts={[
            'Nāma-rūpa — name and form. Nothing here is a likeness and nothing here could be; these are not people who were photographed, they are people who were described.',
            'A tall tapering crown is sovereignty, matted hair piled and tied is renunciation, a fan of hoods is a nāga. None of it is invented here.',
            'Two hundred and sixty-eight are named. The rest are the host: the epics count thousands they never name, and every one of those cards says so.',
          ]}
        />
      )}

      {hover !== null && cast[hover] && (
        <div className="glass book__peek">
          <div className="book__peekname">{cast[hover].name}</div>
          <div className="book__peeknote">{cast[hover].note}</div>
          <div className="book__meta">{cast[hover].side}</div>
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
                {who.side} · {who.named ? 'named in the text' : 'one of the host'} · seed {who.seed}
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

/** The same figure, drawn again at size rather than scaled up. */
function PrintOne({ who }: { who: Being }) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const width = Math.min(520, Math.max(240, Math.round(window.innerWidth - 96)));
    el.replaceChildren(printEpic(who, width));
  }, [who]);
  // React renders nothing inside this node; the canvas is put there by hand.
  return (
    <div className="book__print">
      <div className="book__printhost" ref={host} />
    </div>
  );
}
