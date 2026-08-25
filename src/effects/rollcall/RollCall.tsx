import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import p5 from 'p5';
import { buildRegister, type Genome } from './genome';
import { drawFace, PAPER } from './face';
import { personaFor, type Persona } from './persona';
import { sfx } from '../../lib/audio';

/**
 * Roll Call.
 *
 * A hundred faces, none of them drawn. Each is a point in a 39-dimensional
 * cube found by novelty search — proposed, scored on how far it sits from
 * everyone already on the register, and then hill-climbed away from its
 * nearest neighbour until it stops improving. The drawing code is a pure
 * function of those numbers, and so is the persona, which is why the note
 * under a name always describes the face above it.
 */

const COLS = 10;
const ROWS = 10;

export function RollCall({ onExit }: { onExit: () => void }) {
  const [seed, setSeed] = useState(20260824);
  const [colour, setColour] = useState(true);
  const [picked, setPicked] = useState<number | null>(null);

  // Derived, not stored: calling setState during render made React run the
  // render twice, which mounted the sketch twice and left two canvases stacked
  // in the grid.
  const { faces, report } = useMemo(() => buildRegister(COLS * ROWS, seed), [seed]);

  const people = useMemo(() => faces.map((g, i) => personaFor(g, i)), [faces]);

  const gridHost = useRef<HTMLDivElement | null>(null);
  const cardHost = useRef<HTMLDivElement | null>(null);

  // ------------------------------------------------------------- the register
  useEffect(() => {
    const host = gridHost.current;
    if (!host) return;
    // p5 v2 attaches its canvas asynchronously, so a cleanup that only calls
    // remove() runs before the canvas exists and StrictMode's double mount
    // leaves two stacked in the grid. Each sketch gets its own node instead:
    // detach the node and a late canvas lands in something already unhooked.
    const mount = document.createElement('div');
    host.appendChild(mount);
    let sketch: p5 | null = null;

    const make = (q: p5) => {
      let cell = 0;
      const layout = () => {
        const w = Math.max(320, host.clientWidth);
        cell = Math.floor(w / COLS);
        q.resizeCanvas(cell * COLS, cell * ROWS);
        q.redraw();
      };

      q.setup = () => {
        const w = Math.max(320, host.clientWidth);
        cell = Math.floor(w / COLS);
        q.createCanvas(cell * COLS, cell * ROWS);
        q.noLoop();
        q.pixelDensity(Math.min(2, window.devicePixelRatio || 1));
      };

      q.draw = () => {
        q.background(PAPER[0]);
        faces.forEach((g, i) => {
          const cx = (i % COLS) * cell + cell / 2;
          const cy = Math.floor(i / COLS) * cell + cell / 2;
          q.push();
          q.translate(cx, cy);
          drawFace(q, g, cell * 0.82, { colour });
          q.pop();
        });
      };

      // Deliberately not q.mousePressed: p5 hangs that off the window, so a
      // click on the toolbar counted as a click on whichever cell the pointer
      // happened to be over and opened a card behind the button.
      q.windowResized = layout;
    };

    sketch = new p5(make, mount);

    const onClick = (ev: MouseEvent) => {
      const canvas = mount.querySelector('canvas');
      if (!canvas) return;
      const box = canvas.getBoundingClientRect();
      // The canvas is laid out at 100% width, so screen pixels are not sketch
      // pixels; go through the box rather than through q.mouseX.
      const col = Math.floor(((ev.clientX - box.left) / box.width) * COLS);
      const row = Math.floor(((ev.clientY - box.top) / box.height) * ROWS);
      const i = row * COLS + col;
      if (col >= 0 && col < COLS && row >= 0 && row < ROWS && i < faces.length) {
        sfx.tick();
        setPicked(i);
      }
    };
    mount.addEventListener('click', onClick);

    return () => {
      mount.removeEventListener('click', onClick);
      sketch?.remove();
      mount.remove();
    };
  }, [faces, colour]);

  // ---------------------------------------------------------------- the card
  useEffect(() => {
    const host = cardHost.current;
    if (!host || picked === null) return;
    const mount = document.createElement('div');
    host.appendChild(mount);
    let sketch: p5 | null = null;
    const g: Genome = faces[picked];
    sketch = new p5((q: p5) => {
      q.setup = () => {
        q.createCanvas(260, 260);
        q.pixelDensity(Math.min(2, window.devicePixelRatio || 1));
        q.noLoop();
      };
      q.draw = () => {
        q.background(PAPER[0]);
        q.push();
        q.translate(130, 132);
        drawFace(q, g, 232, { colour });
        q.pop();
      };
    }, mount);
    return () => {
      sketch?.remove();
      mount.remove();
    };
  }, [picked, faces, colour]);

  const reroll = useCallback(() => {
    sfx.paper();
    setPicked(null);
    setSeed((s) => s + 1 + Math.floor(Math.random() * 900));
  }, []);

  const who: Persona | null = picked === null ? null : people[picked];

  return (
    <div className="roll">
      <div className="roll__head">
        <div>
          <div className="roll__eyebrow">attendance register · section B</div>
          <h1 className="roll__title">Roll Call</h1>
        </div>
        <div className="roll__actions">
          <button className="stage__spec" onClick={() => setColour((c) => !c)}>
            {colour ? 'Ink only' : 'Colour'}
          </button>
          <button className="stage__spec" onClick={reroll}>
            New class
          </button>
          <button className="stage__back" onClick={onExit}>
            ← Shelf
          </button>
        </div>
      </div>

      <p className="roll__lede">
        A hundred faces, none of them drawn. Each is thirty-nine numbers found by
        searching for the face least like everyone already on the register — then
        the same numbers are read back as a name and a note, which is why the
        description always matches the drawing. Click a face.
      </p>

      <div className="roll__grid" ref={gridHost} />

      {report && (
        <div className="roll__stats">
          <span>
            nearest-neighbour spread <b>{report.meanNearest.toFixed(2)}</b> against{' '}
            <b>{report.baselineMean.toFixed(2)}</b> for the same hundred drawn at random
          </span>
          <span>
            closest pair on the register <b>{report.minNearest.toFixed(2)}</b> against{' '}
            <b>{report.baselineMin.toFixed(2)}</b> — the worst duplicate is{' '}
            <b>{Math.round((report.minNearest / report.baselineMin - 1) * 100)}%</b> further apart
          </span>
          <span>
            {report.proposals.toLocaleString('en-IN')} candidates proposed and rejected to seat 100
          </span>
        </div>
      )}

      {who && (
        <div className="roll__card" onClick={() => setPicked(null)}>
          <div className="roll__cardinner" onClick={(e) => e.stopPropagation()}>
            <div className="roll__portrait" ref={cardHost} />
            <div className="roll__who">
              <div className="roll__roll">Roll no. {String(who.roll).padStart(3, '0')}</div>
              <div className="roll__name">{who.name}</div>
              <div className="roll__handle">known to the class as “{who.handle}”</div>
              <ul className="roll__traits">
                {who.traits.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
              <p className="roll__note">{who.note}</p>
              <button className="btn btn--small" onClick={() => setPicked(null)}>
                Back to the register
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
