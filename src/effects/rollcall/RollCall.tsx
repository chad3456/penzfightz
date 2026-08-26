import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import p5 from 'p5';
import { buildCensus, type CensusReport, type Seat } from './census';
import { bakeAtlases, type Atlas } from './atlas';
import { drawFace, PAPER } from './face';
import { FaceWall } from './FaceWall';
import { personaFor, type Persona } from './persona';
import { SETS } from './sets';
import { Portrait } from './Portrait';
import { sfx } from '../../lib/audio';

/**
 * Roll Call.
 *
 * A thousand and twenty-four faces across eight sets, standing in a wall you
 * can orbit, and pick up, and leave where you dropped them.
 *
 * Nothing here is a picture. Every face is forty-one numbers found by novelty
 * search, drawn by one pure function in p5, baked into texture atlases and put
 * on instanced cards. The persona is read off the same numbers, which is why
 * the note under a name always describes the face above it.
 */

const PER_SET = 128;
const COLUMNS = 40;

export function RollCall({ onExit }: { onExit: () => void }) {
  const [seed, setSeed] = useState(20260824);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [report, setReport] = useState<CensusReport | null>(null);
  const [atlases, setAtlases] = useState<Atlas[]>([]);
  const [progress, setProgress] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [focusSet, setFocusSet] = useState<string | null>(null);
  const [studio, setStudio] = useState(false);

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
  const portrait = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const host = portrait.current;
    if (!host || picked === null || !seats[picked]) return;
    const mount = document.createElement('div');
    host.appendChild(mount);
    const g = seats[picked].genome;
    const sketch = new p5((q: p5) => {
      q.setup = () => {
        q.createCanvas(230, 230);
        q.pixelDensity(Math.min(2, window.devicePixelRatio || 1));
        q.noLoop();
      };
      q.draw = () => {
        q.background(PAPER[0]);
        q.push();
        q.translate(115, 118);
        drawFace(q, g, 206, { colour: true });
        q.pop();
      };
    }, mount);
    return () => {
      sketch.remove();
      mount.remove();
    };
  }, [picked, seats]);

  const who: Persona | null = picked === null ? null : people[picked] ?? null;
  const whoSet = picked === null ? null : seats[picked]?.set ?? null;
  const ready = atlases.length > 0;

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
            the census · {seats.length || PER_SET * SETS.length} faces · none of them drawn
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
            columns={COLUMNS}
            focusSet={focusSet}
            onPick={(i) => {
              sfx.tick();
              setPicked(i);
            }}
            picked={picked}
          />
        ) : (
          <div className="roll__loading">
            <div className="roll__loadbar">
              <span style={{ width: `${Math.round(progress * 100)}%` }} />
            </div>
            <div className="roll__loadtext">
              {seats.length
                ? `drawing face ${Math.round(progress * seats.length)} of ${seats.length}`
                : 'searching for a thousand faces that are not each other'}
            </div>
          </div>
        )}
      </div>

      <div className="roll__foot">
        <span className="roll__hint">drag to orbit · scroll to zoom · drag a face to move it</span>
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

      {who && (
        <div className="roll__card" onClick={() => setPicked(null)}>
          <div className="roll__cardinner" onClick={(e) => e.stopPropagation()}>
            <div className="roll__portrait" ref={portrait} />
            <div className="roll__who">
              <div className="roll__roll" style={{ color: whoSet?.ink }}>
                {whoSet?.name} · no. {String(who.roll).padStart(4, '0')}
              </div>
              <div className="roll__name">{who.name}</div>
              <div className="roll__handle">
                {seats[picked!]?.likeness ? 'a caricature — not a likeness' : `known to the room as “${who.handle}”`}
              </div>
              <ul className="roll__traits">
                {who.traits.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
              <p className="roll__note">{who.note}</p>
              <details className="roll__genes">
                <summary>the {seats[picked!].genome.g.length} numbers this face is</summary>
                <code>
                  {seats[picked!].genome.g.map((v) => v.toFixed(3)).join('  ')}
                </code>
                <span>
                  Nothing else exists. No image is stored, loaded or copied anywhere in this
                  project — change one of these and the drawing changes with it.
                </span>
              </details>
              <button className="btn btn--small" onClick={() => setPicked(null)}>
                Back to the wall
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
