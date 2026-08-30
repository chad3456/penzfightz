import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Globe, type Plate } from '../globe/Globe';
import { bakeFlat, printFlat, ASPECT } from './plates';
import { subjects, TAGS, type Subject, type Tag } from './subject';
import { sfx } from '../../lib/audio';

/**
 * Six Colours.
 *
 * Two thousand drawings of things you could pick up, and of the people who
 * would pick them up. Every one is made under the rule printed in its own
 * corner: six inks, drawn from a pool of eighteen with a spacing test so no set
 * is three yellows, and not one line in the picture may be anything else.
 *
 * The whole study is about the distance between an object and the marks that
 * stand for it. Local colour goes down first, translucent and loose, and then
 * six colours that have nothing to do with the thing go round it two or three
 * times, broken, off-register, and disagreeing. A bottle outlined in lime and
 * blue is a bottle you have to look at.
 */

const COUNT = 2400;
const CELL = 132;
const GRID = 13;
/** Portrait cards; see `globeRadius`. */
const SPACING = 1.22;

export function Flat({ onExit }: { onExit: () => void }) {
  const [seed, setSeed] = useState(11);
  const [tag, setTag] = useState<Tag | null>(null);
  const [plates, setPlates] = useState<Plate[]>([]);
  const [baked, setBaked] = useState(0);
  const [open, setOpen] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);

  const subs = useMemo(() => subjects(COUNT, seed ^ 0x2ac1, tag ?? undefined), [seed, tag]);

  useEffect(() => {
    const signal = { cancelled: false };
    setPlates([]);
    setBaked(0);
    setOpen(null);
    const t = setTimeout(() => {
      void bakeFlat(subs, {
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
  }, [subs]);

  const step = useCallback(
    (d: number) => {
      setOpen((o) => (o === null ? o : (o + d + subs.length) % subs.length));
      sfx.tick();
    },
    [subs.length],
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

  const sub = open === null ? null : subs[open];

  return (
    <div className="flat">
      <div className="flat__bar">
        <div>
          <div className="flat__eyebrow">
            {subs.length.toLocaleString('en-IN')} drawings · six inks each · the palette is in the
            corner
          </div>
          <h1 className="flat__title">Six Colours</h1>
        </div>
        <div className="flat__actions">
          <button
            className="stage__spec"
            onClick={() => {
              sfx.paper();
              setSeed((s) => s + 1 + Math.floor(Math.random() * 900));
            }}
          >
            New set
          </button>
          <button className="stage__back" onClick={onExit}>
            ← Shelf
          </button>
        </div>
      </div>

      <div className="flat__tabs">
        <button
          className={`flat__tab${tag === null ? ' flat__tab--on' : ''}`}
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
            className={`flat__tab${tag === t.id ? ' flat__tab--on' : ''}`}
            onClick={() => {
              sfx.tick();
              setTag(tag === t.id ? null : t.id);
            }}
          >
            {t.name}
          </button>
        ))}
      </div>

      <p className="flat__lede">
        Six inks, and every line in a drawing is one of them — which is why they are printed in the
        corner, as a claim you can check. The colour of the marks has nothing to do with the colour
        of the thing: local colour goes down first, translucent and loose, and then the six go round
        it three times, broken and off-register and disagreeing. Turn the globe, hover to read one,
        click to draw it again at size.
      </p>

      <div className="flat__globe">
        <Globe
          plates={plates}
          count={subs.length}
          picked={open}
          hovered={hover}
          onPick={setOpen}
          onHover={(i) => setHover(i)}
          spacing={SPACING}
          background="#20201d"
        />
        {baked < 1 && (
          <div className="flat__drawing">
            <div className="flat__bakebar">
              <span style={{ width: `${Math.round(baked * 100)}%` }} />
            </div>
            <div className="flat__baketext">
              drawing {Math.round(baked * subs.length)} of {subs.length.toLocaleString('en-IN')}
            </div>
          </div>
        )}
        {hover !== null && subs[hover] && (
          <div className="flat__peek">
            <div className="flat__peekname">{subs[hover].name}</div>
            <div className="flat__peeknote">{subs[hover].note}</div>
          </div>
        )}
      </div>

      {sub && (
        <div className="flat__sheet" onClick={() => setOpen(null)}>
          <div className="flat__sheetinner" onClick={(e) => e.stopPropagation()}>
            <PrintOne sub={sub} />
            <div className="flat__caption">
              <div className="flat__name">{sub.name}</div>
              <div className="flat__printnote">{sub.note}</div>
              <div className="flat__strip">
                {sub.inks.map((i) => (
                  <span key={i.id} style={{ background: i.hex }} title={i.name} />
                ))}
              </div>
              <div className="flat__meta">
                {sub.kind === 'star'
                  ? `${sub.star?.idiom === 'bombay' ? 'a hoarding' : 'a title card'} · not anybody`
                  : sub.kind === 'face'
                    ? 'a face'
                    : sub.form?.name}{' '}
                · seed {sub.seed}
              </div>
              <div className="flat__recipe">
                {sub.inks.map((i) => (
                  <span key={i.id}>{i.name}</span>
                ))}
              </div>
              <div className="flat__nav">
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

/**
 * The same drawing, drawn again.
 *
 * Not the card scaled up. Every width in the medium is a fraction of the short
 * side and every position is a fraction of the card, so running it at print
 * size gives the same picture with more room in it — the wobble on a line is
 * resolved rather than magnified, and the lettering that was four pixels of
 * scribble on the card turns out to say something.
 */
function PrintOne({ sub }: { sub: Subject }) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const width = Math.min(560, Math.max(240, Math.round(window.innerWidth - 72)));
    const canvas = printFlat(sub, width);
    canvas.style.aspectRatio = `${ASPECT}`;
    el.replaceChildren(canvas);
  }, [sub]);
  // React renders nothing inside this node; the canvas is put there by hand.
  return (
    <div className="flat__print">
      <div className="flat__printhost" ref={host} />
    </div>
  );
}
