import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import p5 from 'p5';
import { buildCensus, type CensusReport, type Seat } from './census';
import type { Genome } from './genome';
import { bakeAtlases, type Atlas } from './atlas';
import { PAPER } from './face';
import { drawItem } from './item';
import { FaceWall } from './FaceWall';
import { personaFor, type Persona } from './persona';
import { SETS } from './sets';
import { Portrait } from './Portrait';
import { sfx } from '../../lib/audio';
import { Loader } from '../loader/Loader';

/**
 * Roll Call.
 *
 * Two thousand things across seventeen sets — people, creatures, pressed
 * flowers and the contents of a geometry box — standing on the surface of a
 * globe you can turn, fly inside, and pick cards off. Hovering one enlarges it
 * where it stands and opens the reading of it beside the pointer; clicking one
 * opens the full card.
 *
 * Nothing here is a picture. Every one of them is sixty-four numbers found by
 * novelty search, drawn by one pure function in p5, baked into texture atlases
 * and put on instanced cards. The persona is read off the same numbers, which is why
 * the note under a name always describes the face above it.
 */

const PER_SET = 128;

/**
 * One face, inked at whatever size is asked for.
 *
 * The p5 instance is created once and kept: the hovered face changes every time
 * the pointer crosses a card, and standing up a fresh sketch each time — p5 v2
 * attaches its canvas asynchronously — flickered and leaked canvases. Instead
 * the genome lives in a ref that `draw` reads, and an update is a `redraw()`.
 */
function InkFace({ genome, size, className }: { genome: Genome; size: number; className?: string }) {
  const host = useRef<HTMLDivElement | null>(null);
  const sketch = useRef<p5 | null>(null);
  const live = useRef(genome);
  const ready = useRef(false);
  live.current = genome;

  useEffect(() => {
    const h = host.current;
    if (!h) return;
    // Its own child div, detached on teardown. p5 v2 attaches the canvas after
    // `new p5()` returns, so a cleanup that ran against the host directly could
    // leave a second canvas behind.
    const mount = document.createElement('div');
    h.appendChild(mount);
    ready.current = false;
    const s = new p5((q: p5) => {
      q.setup = () => {
        q.createCanvas(size, size);
        q.pixelDensity(Math.min(2, window.devicePixelRatio || 1));
        q.noLoop();
        ready.current = true;
      };
      q.draw = () => {
        q.background(PAPER[0]);
        q.push();
        q.translate(size / 2, size * 0.513);
        drawItem(q, live.current, size * 0.82, { colour: true });
        q.pop();
      };
    }, mount);
    sketch.current = s;
    return () => {
      ready.current = false;
      sketch.current = null;
      s.remove();
      mount.remove();
    };
  }, [size]);

  useEffect(() => {
    if (ready.current) sketch.current?.redraw();
  }, [genome]);

  return <div className={className} ref={host} />;
}

export function RollCall({ onExit }: { onExit: () => void }) {
  const [seed, setSeed] = useState(20260824);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [report, setReport] = useState<CensusReport | null>(null);
  const [atlases, setAtlases] = useState<Atlas[]>([]);
  const [progress, setProgress] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [focusSet, setFocusSet] = useState<string | null>(null);
  const [studio, setStudio] = useState(false);
  // Where the pointer was when it arrived on this card. Set once per card
  // rather than on every move, so the panel does not chase the cursor and the
  // whole page does not re-render sixty times a second.
  const [hover, setHover] = useState<{ i: number; x: number; y: number } | null>(null);

  // ------------------------------------------------------- build and bake
  useEffect(() => {
    const signal = { cancelled: false };
    setAtlases([]);
    setProgress(0);
    setPicked(null);

    // Off the paint path, so the loading state gets a chance to show.
    const t = setTimeout(() => {
      const built = buildCensus(PER_SET, seed);
      if (signal.cancelled) return;
      setSeats(built.seats);
      setReport(built.report);
      void bakeAtlases(built.seats, {
        onProgress: (done, total) => !signal.cancelled && setProgress(done / total),
        signal,
      })
        .then((a) => !signal.cancelled && setAtlases(a))
        .catch(() => undefined);
    }, 30);

    return () => {
      signal.cancelled = true;
      clearTimeout(t);
    };
  }, [seed]);

  const people = useMemo(
    () =>
      seats.map((s, i) => {
        const p = personaFor(s.genome, i, s.set);
        // A caricature carries its own name and its own note; the generated
        // ones would be nonsense over a face that was set by hand.
        return s.likeness
          ? { ...p, name: s.likeness.name, handle: 'a caricature', note: s.likeness.signature }
          : p;
      }),
    [seats],
  );

  // ------------------------------------------------------------- the card
  const who: Persona | null = picked === null ? null : people[picked] ?? null;
  const whoSet = picked === null ? null : seats[picked]?.set ?? null;
  const ready = atlases.length > 0;

  const onHover = useCallback((i: number | null, x: number, y: number) => {
    setHover(i === null ? null : { i, x, y });
  }, []);

  const reseed = useCallback(() => {
    sfx.paper();
    setSeed((s) => s + 1 + Math.floor(Math.random() * 900));
  }, []);

  if (studio) return <Portrait onExit={() => setStudio(false)} />;

  return (
    <div className="roll roll--wall">
      <div className="roll__bar">
        <div>
          <div className="roll__eyebrow">
            the census · {seats.length || PER_SET * SETS.length} things · none of them drawn
          </div>
          <h1 className="roll__title">Roll Call</h1>
        </div>
        <div className="roll__actions">
          <button className="stage__spec" onClick={() => setStudio(true)}>
            From a photo
          </button>
          <button className="stage__spec" onClick={reseed}>
            New census
          </button>
          <button className="stage__back" onClick={onExit}>
            ← Shelf
          </button>
        </div>
      </div>

      <div className="roll__tabs">
        <button
          className={`roll__tab${focusSet === null ? ' roll__tab--on' : ''}`}
          onClick={() => {
            sfx.tick();
            setFocusSet(null);
          }}
        >
          Everyone
        </button>
        {SETS.map((s) => (
          <button
            key={s.id}
            className={`roll__tab${focusSet === s.id ? ' roll__tab--on' : ''}`}
            style={{ ['--tab-ink' as string]: s.ink }}
            onClick={() => {
              sfx.tick();
              setFocusSet(focusSet === s.id ? null : s.id);
            }}
            title={s.tagline}
          >
            {s.name}
          </button>
        ))}
      </div>

      <div className="roll__stage">
        {ready ? (
          <FaceWall
            seats={seats}
            atlases={atlases}
            focusSet={focusSet}
            onPick={(i) => {
              sfx.tick();
              setHover(null);
              setPicked(i);
            }}
            onHover={onHover}
            picked={picked}
            hovered={hover?.i ?? null}
          />
        ) : (
          <Loader
            title="Roll Call"
            done={Math.round(progress * seats.length)}
            total={seats.length || 1}
            plates={atlases}
            accent="#7a6a55"
            facts={[
              seats.length
                ? 'Nothing here is a picture. Every one of them is sixty-four numbers found by novelty search and drawn by one pure function.'
                : 'Searching for two thousand things that are not each other. Novelty search keeps whatever is furthest from everything found so far.',
              'The note under a name is read off the same genes as the face, which is why it always describes the thing above it.',
              'Drawn in p5, baked into texture atlases, and put on instanced cards — one draw call a plate.',
            ]}
          />
        )}
      </div>

      <div className="roll__foot">
        <span className="roll__hint">drag to turn · scroll to fly inside · hover to read one · click for the detail · shift-drag to pull one off</span>
        {report && (
          <span className="roll__stats2">
            nearest neighbour within a set <b>{report.withinMin.toFixed(2)}</b> against{' '}
            <b>{report.baselineWithinMin.toFixed(2)}</b> unsearched —{' '}
            <b>{Math.round((report.withinMin / report.baselineWithinMin - 1) * 100)}%</b> further
            apart · {report.proposals.toLocaleString('en-IN')} candidates rejected ·{' '}
            {report.ms}ms
          </span>
        )}
      </div>

      {hover && seats[hover.i] && !who && (
        <div
          className="roll__peek"
          style={{
            // Clamped to the viewport, because a card near the right edge would
            // otherwise open the panel off the side of the screen.
            left: Math.min(hover.x + 20, window.innerWidth - 286),
            top: Math.min(Math.max(12, hover.y - 130), Math.max(12, window.innerHeight - 320)),
            ['--peek-ink' as string]: seats[hover.i].set.ink,
          }}
        >
          <InkFace genome={seats[hover.i].genome} size={264} className="roll__peekink" />
          <div className="roll__peekbody">
            <div className="roll__peekset">
              {seats[hover.i].set.name} · no. {String(people[hover.i].roll).padStart(4, '0')}
            </div>
            <div className="roll__peekname">{people[hover.i].name}</div>
            <div className="roll__peekhandle">
              {seats[hover.i].likeness
                ? 'a caricature — not a likeness'
                : `known to the room as “${people[hover.i].handle}”`}
            </div>
            <ul className="roll__traits">
              {/* Two of the three trait words can coincide — a wide head on a
                  wide-eyed face — so the position is the identity, not the word. */}
              {people[hover.i].traits.map((t, n) => (
                <li key={n}>{t}</li>
              ))}
            </ul>
            <p className="roll__peeknote">{people[hover.i].note}</p>
            <div className="roll__peekmore">click for the genome</div>
          </div>
        </div>
      )}

      {who && (
        <div className="roll__card" onClick={() => setPicked(null)}>
          <div className="roll__cardinner" onClick={(e) => e.stopPropagation()}>
            <InkFace genome={seats[picked!].genome} size={230} className="roll__portrait" />
            <div className="roll__who">
              <div className="roll__roll" style={{ color: whoSet?.ink }}>
                {whoSet?.name} · no. {String(who.roll).padStart(4, '0')}
              </div>
              <div className="roll__name">{who.name}</div>
              <div className="roll__handle">
                {seats[picked!]?.likeness ? 'a caricature — not a likeness' : `known to the room as “${who.handle}”`}
              </div>
              <ul className="roll__traits">
                {who.traits.map((t, n) => (
                  <li key={n}>{t}</li>
                ))}
              </ul>
              <p className="roll__note">{who.note}</p>
              <details className="roll__genes">
                <summary>the {seats[picked!].genome.g.length} numbers this is</summary>
                <code>
                  {seats[picked!].genome.g.map((v) => v.toFixed(3)).join('  ')}
                </code>
                <span>
                  Nothing else exists. No image is stored, loaded or copied anywhere in this
                  project — change one of these and the drawing changes with it.
                </span>
              </details>
              <button className="btn btn--small" onClick={() => setPicked(null)}>
                Back to the globe
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
