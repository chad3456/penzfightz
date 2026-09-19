import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Press, PAPER } from './riso';
import { fitView } from './iso';
import { CLOSING, ROOMS, type Kanda, type Room } from './rooms';
import { sfx } from '../lib/audio';

/**
 * Twenty-five rooms of the Ramayana, on one sheet.
 *
 * The rooms are laid out on the same isometric lattice they are drawn in, so
 * the page reads as one continuous plan rather than as a grid of pictures —
 * every room is a diamond and the diamonds tile. That is the only layout that
 * makes the set look printed rather than uploaded.
 *
 * Each room is baked once to its own canvas. They are static prints: there is
 * nothing to animate, and re-screening a halftone on every frame would cost
 * about a second per room for no gain at all.
 */

const CELL_W = 430;
const CELL_H = Math.round(CELL_W * 0.78);
/**
 * How far along the lattice each step moves.
 *
 * Under one on both axes, so the diamonds interlock at their corners the way
 * they do on a plan rather than sitting in a grid with cream gaps between
 * them. This only works now that a room prints with a transparent surround.
 */
const STEP_X = 0.5;
const STEP_Y = 0.54;
const COLS = 5;

const KANDA_NOTE: Record<Kanda, string> = {
  Bala: 'The book of childhood. A kingdom gets its heirs, and a bow gets broken.',
  Ayodhya: 'The book of the city. Two promises made years ago come due in a single afternoon.',
  Aranya: 'The book of the forest. Ten good years, and then about four minutes that undo them.',
  Kishkindha: 'The book of the monkey kingdom. Everybody here is somebody else’s exile.',
  Sundara: 'The beautiful book. One character crosses the sea and the whole poem changes gear.',
  Yuddha: 'The book of the war. It is long, most of them die, and then the lamps go on.',
};

export function Ramayana({ onExit }: { onExit: () => void }) {
  const [open, setOpen] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [done, setDone] = useState(0);
  const hostRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);
  const canvases = useRef<Map<number, HTMLCanvasElement>>(new Map());
  /**
   * One alpha byte per pixel per room, kept for hit-testing.
   *
   * The rooms are diamonds laid out so that they overlap, but every room is a
   * rectangular element, and a rectangle's empty corner still swallows the
   * click meant for the room underneath it. So the boxes are taken out of the
   * pointer path entirely and the plan hit-tests against what was actually
   * printed: topmost room whose ink is under the cursor wins.
   */
  const masks = useRef<Map<number, Uint8Array>>(new Map());

  const placed = useMemo(
    () =>
      ROOMS.map((r, i) => {
        const col = i % COLS;
        const row = Math.floor(i / COLS);
        // Odd rows are offset half a cell, which is what makes the diamonds
        // interlock instead of sitting in a square grid with gaps at the corners.
        const x = (col + (row % 2 ? 0.5 : 0)) * CELL_W * STEP_X * 2;
        const y = row * CELL_H * STEP_Y;
        return { room: r, x, y };
      }),
    [],
  );

  // The plan is a fixed-size sheet, scaled down to whatever width there is.
  // Reflowing it into fewer columns would break the lattice, which is the
  // whole look; a printed plan is one size and you hold it further away.
  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const fit = () => {
      const avail = el.clientWidth;
      setScale(Math.min(1, avail / extentRef.current.w));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const extent = useMemo(() => {
    const maxX = Math.max(...placed.map((p) => p.x)) + CELL_W;
    const maxY = Math.max(...placed.map((p) => p.y)) + CELL_H;
    return { w: maxX + 40, h: maxY + 90 };
  }, [placed]);

  const extentRef = useRef(extent);
  extentRef.current = extent;

  // ── bake, one room at a time, so the page is usable while it prints
  useEffect(() => {
    let cancelled = false;
    const store = canvases.current;

    const idle = () => new Promise<void>((r) => setTimeout(r, 0));

    (async () => {
      for (const { room } of placed) {
        if (cancelled) return;
        const canvas = document.createElement('canvas');
        canvas.width = CELL_W;
        canvas.height = CELL_H;
        const g = canvas.getContext('2d');
        if (!g) continue;
        const press = new Press(CELL_W, CELL_H);
        const v = fitView(CELL_W, CELL_H, room.w, room.d, room.wallH);
        room.build(press, v);
        press.print(g, 3.0);
        store.set(room.n, canvas);
        const px = g.getImageData(0, 0, CELL_W, CELL_H).data;
        const a = new Uint8Array(CELL_W * CELL_H);
        for (let i = 0; i < a.length; i++) a[i] = px[i * 4 + 3];
        masks.current.set(room.n, a);

        const slot = hostRef.current?.querySelector<HTMLDivElement>(`[data-room="${room.n}"]`);
        if (slot) slot.replaceChildren(canvas);
        if (!cancelled) setDone((d) => d + 1);
        await idle();
      }
    })();

    return () => { cancelled = true; };
  }, [placed]);

  /** Topmost room with ink under the page point, or null for bare paper. */
  const roomAt = useCallback(
    (clientX: number, clientY: number): number | null => {
      const plan = hostRef.current;
      if (!plan) return null;
      const box = plan.getBoundingClientRect();
      const px = (clientX - box.left) / scale;
      const py = (clientY - box.top) / scale;
      for (let i = placed.length - 1; i >= 0; i--) {
        const { room, x, y } = placed[i];
        const lx = Math.floor(px - x);
        const ly = Math.floor(py - y);
        if (lx < 0 || ly < 0 || lx >= CELL_W || ly >= CELL_H) continue;
        const mask = masks.current.get(room.n);
        // Not printed yet: fall back to the box, so early clicks still land.
        if (!mask) return room.n;
        if (mask[ly * CELL_W + lx] > 8) return room.n;
      }
      return null;
    },
    [placed, scale],
  );

  const step = useCallback(
    (d: number) => {
      setOpen((o) => (o === null ? o : ((o - 1 + d + ROOMS.length) % ROOMS.length) + 1));
      sfx.tick();
    },
    [],
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

  const shown: Room | null = open === null ? null : ROOMS[open - 1] ?? null;

  return (
    <div className="rama" style={{ background: PAPER }}>
      <header className="rama__head">
        <div className="rama__mark" aria-hidden>
          <svg viewBox="0 0 40 40" width="34" height="34">
            <circle cx="20" cy="20" r="13" fill="none" stroke="#3d4f78" strokeWidth="1.4" />
            <path d="M20 2v36M2 20h36" stroke="#3d4f78" strokeWidth="1.4" />
            <circle cx="20" cy="20" r="4.5" fill="#3d4f78" />
          </svg>
        </div>
        <div>
          <p className="rama__kicker">twenty-five rooms · five inks · one screen each</p>
          <h1 className="rama__title">The Ramayana, in rooms</h1>
          <p className="rama__lede">
            The whole epic as twenty-five isometric rooms, printed rather than drawn: every surface
            is a separate ink screened into dots at its own angle, overprinted the way a risograph
            lays one colour down at a time. In each room there is a small light, and it is keeping
            somebody company. It never does anything else.
          </p>
        </div>
        <button className="rama__exit" onClick={onExit}>← back to the shelf</button>
      </header>

      {done < ROOMS.length && (
        <div className="rama__press">
          printing {done} of {ROOMS.length}
          <span className="rama__bar"><i style={{ width: `${(done / ROOMS.length) * 100}%` }} /></span>
        </div>
      )}

      <div className="rama__frame" ref={frameRef} style={{ height: extent.h * scale }}>
      <div
        className={`rama__plan${hover !== null ? ' is-over' : ''}`}
        ref={hostRef}
        style={{ width: extent.w, height: extent.h, transform: `scale(${scale})` }}
        onMouseMove={(e) => setHover(roomAt(e.clientX, e.clientY))}
        onMouseLeave={() => setHover(null)}
        onClick={(e) => {
          const n = roomAt(e.clientX, e.clientY);
          if (n === null) return;
          sfx.paper();
          setOpen(n);
        }}
      >
        {placed.map(({ room, x, y }) => (
          <button
            key={room.n}
            className={`rama__room${hover === room.n ? ' is-hot' : ''}`}
            style={{ left: x, top: y, width: CELL_W, height: CELL_H }}
            data-room={room.n}
            onFocus={() => setHover(room.n)}
            onBlur={() => setHover((h) => (h === room.n ? null : h))}
            onClick={() => { sfx.paper(); setOpen(room.n); }}
            aria-label={`${room.n}. ${room.title}`}
          />
        ))}
        {/*
          Callouts, not captions: a plan labels its rooms on a little patch of
          paper laid over the drawing, because anywhere you put bare type on a
          halftone it stops being readable. Drawn after every room so they sit
          over the whole lattice rather than under the next room along.
        */}
        {placed.map(({ room, x, y }) => (
          <span
            key={`t${room.n}`}
            className={`rama__tag${hover === room.n ? ' is-hot' : ''}`}
            style={{ left: x + CELL_W * 0.5, top: y + CELL_H * 0.84 }}
          >
            <b>{room.n}</b> {room.title}
          </span>
        ))}
      </div>
      </div>

      <footer className="rama__foot">
        <p>{CLOSING}</p>
        <p className="rama__small">
          Scenes, not doctrine — the beats most tellings share, with nothing invented for effect and
          nothing settled that the tradition leaves open.
        </p>
      </footer>

      {shown && (
        <div className="rama__sheet" onClick={() => setOpen(null)}>
          <div className="rama__card" onClick={(e) => e.stopPropagation()}>
            <RoomPrint room={shown} />
            <div className="rama__text">
              <p className="rama__kanda">{shown.kanda} Kanda · room {shown.n} of 25</p>
              <h2>{shown.title}</h2>
              <p className="rama__where">{shown.where}</p>
              <p className="rama__line">{shown.line}</p>
              <p className="rama__company"><span>keeping company with</span>{shown.company}</p>
              <p className="rama__note">{KANDA_NOTE[shown.kanda]}</p>
              <div className="rama__nav">
                <button onClick={() => step(-1)}>← previous</button>
                <button onClick={() => setOpen(null)}>close</button>
                <button onClick={() => step(1)}>next →</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Re-printed at size rather than a thumbnail scaled up. */
function RoomPrint({ room }: { room: Room }) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const w = Math.min(680, Math.max(300, window.innerWidth - 120));
    const h = Math.round(w * 0.78);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const g = canvas.getContext('2d');
    if (!g) return;
    const press = new Press(w, h);
    const v = fitView(w, h, room.w, room.d, room.wallH);
    room.build(press, v);
    press.print(g, 3.2);
    el.replaceChildren(canvas);
  }, [room]);
  return <div className="rama__print" ref={host} />;
}
