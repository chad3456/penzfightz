import { useCallback, useEffect, useRef, useState } from 'react';
import p5 from 'p5';
import { drawFace, PAPER } from './face';
import { MEASURED, genomeFromReading, readFace, type Marks, type Reading } from './fromPhoto';
import type { Genome } from './genome';

/**
 * From a photograph.
 *
 * Pick a picture, drag three markers onto it — both eyes and the chin — and the
 * stall reads what a photograph can honestly tell it and sets those genes.
 * Everything it cannot measure is left to the seed, so "another go" gives you a
 * different face that still agrees on tone, proportion and hair.
 *
 * The picture never leaves the browser: FileReader to an Image to a canvas,
 * sampled, then dropped. No upload, no request, nothing stored.
 */

type MarkKey = keyof Marks;
const ORDER: MarkKey[] = ['leftEye', 'rightEye', 'chin'];
const LABEL: Record<MarkKey, string> = {
  leftEye: 'their left eye',
  rightEye: 'their right eye',
  chin: 'the chin',
};

export function Portrait({ onExit }: { onExit: () => void }) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [size, setSize] = useState<[number, number]>([0, 0]);
  const [marks, setMarks] = useState<Marks | null>(null);
  const [dragging, setDragging] = useState<MarkKey | null>(null);
  const [reading, setReading] = useState<Reading | null>(null);
  const [genome, setGenome] = useState<Genome | null>(null);
  const [seed, setSeed] = useState(1);

  const photo = useRef<HTMLCanvasElement | null>(null);
  const out = useRef<HTMLDivElement | null>(null);

  // ------------------------------------------------------------- load
  const onFile = useCallback((file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const i = new Image();
      i.onload = () => {
        const long = Math.max(i.width, i.height);
        const k = Math.min(1, 520 / long);
        const w = Math.round(i.width * k);
        const h = Math.round(i.height * k);
        setImg(i);
        setSize([w, h]);
        // Sensible opening guesses, so there is something to drag rather than
        // a blank instruction.
        setMarks({
          leftEye: [w * 0.37, h * 0.42],
          rightEye: [w * 0.63, h * 0.42],
          chin: [w * 0.5, h * 0.78],
        });
        setReading(null);
        setGenome(null);
      };
      i.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  }, []);

  // ------------------------------------------------------- draw the photo
  useEffect(() => {
    const c = photo.current;
    if (!c || !img || !marks) return;
    const [w, h] = size;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = w * dpr;
    c.height = h * dpr;
    c.style.width = `${w}px`;
    c.style.height = `${h}px`;
    const ctx = c.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);

    ORDER.forEach((k) => {
      const [x, y] = marks[k];
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, 9, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = '#8a2b2b';
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - 14, y);
      ctx.lineTo(x + 14, y);
      ctx.moveTo(x, y - 14);
      ctx.lineTo(x, y + 14);
      ctx.stroke();
    });
  }, [img, marks, size]);

  const point = (e: React.PointerEvent<HTMLCanvasElement>): [number, number] => {
    const r = e.currentTarget.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * size[0], ((e.clientY - r.top) / r.height) * size[1]];
  };

  // ------------------------------------------------------------- measure
  const measure = useCallback(() => {
    if (!img || !marks) return;
    const r = readFace(img, size[0], size[1], marks);
    setReading(r);
    setGenome(genomeFromReading(r, seed));
  }, [img, marks, size, seed]);

  const again = useCallback(() => {
    const n = seed + 1 + Math.floor(Math.random() * 900);
    setSeed(n);
    if (reading) setGenome(genomeFromReading(reading, n));
  }, [reading, seed]);

  // ------------------------------------------------------------- the result
  useEffect(() => {
    const host = out.current;
    if (!host || !genome) return;
    const mount = document.createElement('div');
    host.appendChild(mount);
    const sketch = new p5((q: p5) => {
      q.setup = () => {
        q.createCanvas(260, 260);
        q.pixelDensity(Math.min(2, window.devicePixelRatio || 1));
        q.noLoop();
      };
      q.draw = () => {
        q.background(PAPER[0]);
        q.push();
        q.translate(130, 132);
        drawFace(q, genome, 232, { colour: true });
        q.pop();
      };
    }, mount);
    return () => {
      sketch.remove();
      mount.remove();
    };
  }, [genome]);

  return (
    <div className="roll roll--portrait">
      <div className="roll__bar">
        <div>
          <div className="roll__eyebrow">from a photograph · nothing leaves this browser</div>
          <h1 className="roll__title">Sit for a portrait</h1>
        </div>
        <div className="roll__actions">
          <button className="stage__back" onClick={onExit}>
            ← Back
          </button>
        </div>
      </div>

      <p className="roll__lede">
        Pick a picture and drag the three markers onto both eyes and the chin. The
        stall measures what a photograph can honestly tell it — tone, proportion,
        how much hair and where — and sets those genes. It is not a likeness and
        does not pretend to be; everything it cannot measure is left to chance,
        which is why another go gives a different face that still agrees on the
        measured parts.
      </p>

      <div className="port">
        <div className="port__side">
          <label className="port__drop">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => onFile(e.target.files?.[0])}
              hidden
            />
            {img ? 'Choose a different picture' : 'Choose a picture'}
          </label>

          {img && marks && (
            <>
              <canvas
                ref={photo}
                className="port__photo"
                onPointerDown={(e) => {
                  const [x, y] = point(e);
                  let best: MarkKey = 'leftEye';
                  let bestD = Infinity;
                  ORDER.forEach((k) => {
                    const d = Math.hypot(marks[k][0] - x, marks[k][1] - y);
                    if (d < bestD) {
                      bestD = d;
                      best = k;
                    }
                  });
                  setDragging(best);
                  setMarks({ ...marks, [best]: [x, y] });
                  e.currentTarget.setPointerCapture(e.pointerId);
                }}
                onPointerMove={(e) => {
                  if (!dragging) return;
                  setMarks({ ...marks, [dragging]: point(e) });
                }}
                onPointerUp={() => setDragging(null)}
              />
              <div className="port__legend">
                {ORDER.map((k) => (
                  <span key={k}>{LABEL[k]}</span>
                ))}
              </div>
              <button className="stall__start" onClick={measure}>
                Read this face
              </button>
            </>
          )}
        </div>

        <div className="port__side">
          {genome && reading ? (
            <>
              <div className="port__out" ref={out} />
              <button className="btn btn--small" onClick={again}>
                Another go at the rest
              </button>
              <table className="port__table">
                <tbody>
                  <tr>
                    <th>tone read</th>
                    <td>
                      <i style={{ background: reading.toneHex }} /> {reading.toneHex}
                    </td>
                  </tr>
                  <tr>
                    <th>hair</th>
                    <td>
                      <i style={{ background: reading.hairHex }} />{' '}
                      {Math.round(reading.hairAmount * 100)}% cover
                    </td>
                  </tr>
                  <tr>
                    <th>jaw vs cheek</th>
                    <td>{Math.round(reading.beardAmount * 100)}% darker</td>
                  </tr>
                  <tr>
                    <th>eye gap</th>
                    <td>{reading.eyeGap.toFixed(2)} of eye-to-chin</td>
                  </tr>
                  <tr>
                    <th>aspect</th>
                    <td>{reading.aspect.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
              <details className="roll__genes">
                <summary>which genes the photograph set</summary>
                <ul className="port__measured">
                  {MEASURED.map((m) => (
                    <li key={m.gene}>
                      <b>{m.gene}</b> — {m.from}
                    </li>
                  ))}
                </ul>
                <span>
                  The other {genome.g.length - 9} genes came from the seed. Press “another
                  go” and only those change.
                </span>
              </details>
            </>
          ) : (
            <div className="port__empty">
              <p>The face will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
