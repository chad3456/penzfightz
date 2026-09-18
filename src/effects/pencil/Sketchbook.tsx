import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Globe, type Layout, type Plate } from '../globe/Globe';
import { LayoutToggle } from '../globe/LayoutToggle';
import { bakeFaces, printFace } from './plates';
import { FAMILIES, type Family } from './expressions';
import { CAST } from './characters';
import { VARIANTS, type Variant } from './variants';
import { sfx } from '../../lib/audio';
import { Loader } from '../loader/Loader';
import type { Sheet } from '../loader/press';

/**
 * A hundred faces, one character, one pencil.
 *
 * The drawing is graphite rather than line art, and the difference is a
 * deposit: no path here is ever stroked, because `stroke()` lays a band of
 * even darkness with clean edges and a pencil does neither. Every mark is a
 * run of small grains whose spacing flickers with the tooth of the paper, laid
 * down two or three times over because a sketched contour is several passes
 * that nearly agree.
 *
 * The hundred are a taxonomy, not a jitter. A face is not a random point in
 * parameter space — a brow raised at the inner end is grief and the same brow
 * raised at the outer end is scepticism, and halfway between them is nothing
 * at all. So each is a named expression first and a set of numbers second.
 */

const CELL = 176;
const GRID = 10;
const SPACING = 1.4;

const SAID: Record<Family, string> = {
  joy: 'The eyes do it, not the mouth. A smiling mouth under flat eyes is not a smile, and the squint of the lower lid is what separates a real one from a polite one.',
  sorrow: 'The inner ends of the brows lift. That single action is read as grief before anything else on the face is looked at.',
  anger: 'Brows down and in, lids tight, pupils small. Everything contracts towards the middle of the face.',
  fear: 'The opposite contraction: brows up, lids wide, and the whole face opens. Fear and surprise share the shape, and only the mouth tells them apart.',
  surprise: 'Brief and symmetrical. Held longer than a moment it stops reading as surprise and starts reading as alarm.',
  disdain: 'Almost nothing moves. An eyelid lowered a fraction and the gaze taken slightly off you does the whole thing.',
  tender: 'Large pupils, a soft lid, and the head tipped. The idiom draws affection as the eye letting more light in.',
  thought: 'The gaze leaves. Up and away is remembering, down and away is deciding, and neither is aimed at anybody.',
  exhaustion: 'The lids fall before anything else. Everything on this face is a thing that stopped being held up.',
  unhinged: 'The parts stop agreeing. A grin at full width under a pupil at its smallest is the whole effect.',
};

export function Sketchbook({ onExit }: { onExit: () => void }) {
  const [seed, setSeed] = useState(1);
  const [layout, setLayout] = useState<Layout>('grid');
  const [only, setOnly] = useState<'all' | Family>('all');
  const [who, setWho] = useState<'both' | string>('both');
  const [plates, setPlates] = useState<Plate[]>([]);
  const [baked, setBaked] = useState(0);
  const [live, setLive] = useState<Sheet | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);

  const shown = useMemo(
    () =>
      VARIANTS.filter(
        (v) => (only === 'all' || v.face.family === only) && (who === 'both' || v.who.id === who),
      ),
    [only, who],
  );

  useEffect(() => {
    const signal = { cancelled: false };
    setPlates([]);
    setBaked(0);
    setLive(null);
    setOpen(null);
    const t = setTimeout(() => {
      void bakeFaces(shown, {
        cell: CELL,
        grid: GRID,
        seed,
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

  // Both filters feed one list, so changing either has to reset the opened card
  // rather than leave an index pointing into a set that no longer has it.
  useEffect(() => setOpen(null), [only, who]);

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
    <div className="book pencil">
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
          background="#20201e"
        />
      </div>

      <div className="ink__top">
        <div className="glass ink__plate">
          <div className="ink__eyebrow">50 expressions · two faces · one pencil</div>
          <h1 className="ink__title">Sasaki &amp; Tayama</h1>
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
            Draw them again
          </button>
          <button className="glass glass--btn" onClick={onExit}>
            ← Shelf
          </button>
        </div>
      </div>

      <div className="pencil__bars">
      <div className="pencil__who">
        <button
          className={`pencil__fam${who === 'both' ? ' pencil__fam--on' : ''}`}
          onClick={() => { sfx.tick(); setWho('both'); }}
        >
          Both
        </button>
        {CAST.map((c) => (
          <button
            key={c.id}
            className={`pencil__fam${who === c.id ? ' pencil__fam--on' : ''}`}
            onClick={() => { sfx.tick(); setWho(c.id); }}
          >
            {c.name}
            <span className="pencil__famn">{VARIANTS.filter((v) => v.who.id === c.id).length}</span>
          </button>
        ))}
      </div>

      <div className="pencil__families">
        <button
          className={`pencil__fam${only === 'all' ? ' pencil__fam--on' : ''}`}
          onClick={() => { sfx.tick(); setOnly('all'); }}
        >
          All
        </button>
        {FAMILIES.map((fam) => (
          <button
            key={fam.id}
            className={`pencil__fam${only === fam.id ? ' pencil__fam--on' : ''}`}
            onClick={() => { sfx.tick(); setOnly(fam.id); }}
          >
            {fam.label}
            <span className="pencil__famn">
              {VARIANTS.filter((v) => v.face.family === fam.id && (who === 'both' || v.who.id === who)).length}
            </span>
          </button>
        ))}
      </div>
      </div>

      <div className="glass book__lede">
        Nothing on this page is stroked. A stroked path has one darkness and two clean edges, and
        graphite has neither — so every mark is a run of small deposits whose spacing flickers with
        the tooth of the paper, laid two or three times over, because a sketched line is several
        passes that nearly agree. The construction is left showing under the face for the same
        reason: rubbing it out would be tidier and would stop the drawing reading as a sketch.
        The hundred expressions are named ones, chosen along the axes a face actually uses.
      </div>

      {baked < 1 && (
        <Loader
          title="Sasaki &amp; Tayama"
          done={Math.round(baked * shown.length)}
          total={shown.length}
          plates={live ? [...plates, live] : plates}
          accent="#6d665c"
          facts={[
            'Pressure sets darkness and width together. Change one without the other and the mark reads as a brush instead of a pencil.',
            'The upper lash line is the heaviest mark on the face — a wedge, not a line. Thickening it is most of what makes a drawing read as anime rather than as cartoon.',
            'The brows are drawn over the fringe. A grief brow lifts above the hairline, and underneath the hair it would be invisible on the one face that needs it most.',
          ]}
        />
      )}

      {hover !== null && shown[hover] && (
        <div className="glass book__peek pencil__peek">
          <div className="pencil__peektitle">{shown[hover]!.face.name}</div>
          <div className="pencil__peekmeta">
            {shown[hover]!.who.name} · {shown[hover]!.face.family}
          </div>
        </div>
      )}

      {one && (
        <div className="book__sheet" onClick={() => setOpen(null)}>
          <div className="glass book__sheetinner" onClick={(e) => e.stopPropagation()}>
            <div className="book__print">
              <PrintOne v={one} seed={seed * 131 + (open ?? 0) + 1} />
            </div>
            <div className="book__caption">
              <div className="book__name">
                {one.who.name} — {one.face.name}
              </div>
              <div className="book__note">{SAID[one.face.family]}</div>
              <div className="book__note pencil__whonote">{one.who.note}</div>
              <div className="book__meta">
                {(open ?? 0) + 1} of {shown.length} · {one.face.family}
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

function PrintOne({ v, seed }: { v: Variant; seed: number }) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const w = Math.min(420, Math.max(250, Math.round(window.innerWidth - 96)));
    el.replaceChildren(printFace(v, w, seed));
  }, [v, seed]);
  return <div className="book__printhost" ref={host} />;
}
