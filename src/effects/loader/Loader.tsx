import { useEffect, useRef, useState } from 'react';
import { Press, type PressState, type Sheet } from './press';

/**
 * The loading screen, which is a workshop rather than an apology.
 *
 * Every gallery in the case has to build itself before it can be looked at —
 * two and a half thousand drawings, or a thousand solved watercolours — and
 * that wait used to be a two-pixel bar and a number. This replaces it with the
 * three things the wait actually deserves.
 *
 * **The machinery, running.** A flatbed plotter whose pen speed is read off the
 * real throughput, and an output tray that fills with specimens *blitted out of
 * the atlas being baked* — so what stacks up beside the plotter is genuinely
 * the thing you are waiting for, at no cost, because the pixels already exist.
 *
 * **The numbers, all of them.** Cells, rate, elapsed, an estimate, plate count,
 * atlas dimensions and megapixels. If a person is going to be made to wait,
 * they are at least owed the readout.
 *
 * **Something to do.** Hold the pointer down anywhere on the bed and you have
 * the pen. It is a doodle pad with a progress bar attached.
 */

export interface LoaderProps {
  /** What is being built. */
  title: string;
  done: number;
  total: number;
  plates: Sheet[];
  accent: string;
  /** Two or three lines about the medium. Shown one at a time. */
  facts: string[];
}

const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
const clock = (s: number) => `${Math.floor(s / 60)}:${pad(Math.floor(s % 60))}`;

export function Loader({ title, done, total, plates, accent, facts }: LoaderProps) {
  const host = useRef<HTMLCanvasElement>(null);
  const live = useRef<PressState>({
    progress: 0,
    done: 0,
    total: 1,
    rate: 0,
    plates: [],
    accent,
    hand: { x: 0.5, y: 0.5, on: false },
  });
  const started = useRef(performance.now());
  const mark = useRef({ at: performance.now(), done: 0, rate: 0 });
  const [rate, setRate] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [fact, setFact] = useState(0);

  live.current.done = done;
  live.current.total = total;
  live.current.plates = plates;
  live.current.accent = accent;
  live.current.progress = total ? done / total : 0;

  // Rate, smoothed over a second. Instantaneous rate on a thread that yields
  // in bursts reads as noise; a running average reads as a machine.
  useEffect(() => {
    const id = window.setInterval(() => {
      const now = performance.now();
      const m = mark.current;
      const dt = (now - m.at) / 1000;
      if (dt > 0.35) {
        const inst = (done - m.done) / dt;
        m.rate = m.rate ? m.rate * 0.6 + inst * 0.4 : inst;
        m.at = now;
        m.done = done;
        setRate(m.rate);
        live.current.rate = m.rate;
      }
      setElapsed((now - started.current) / 1000);
    }, 250);
    return () => window.clearInterval(id);
  }, [done]);

  useEffect(() => {
    if (facts.length < 2) return;
    const id = window.setInterval(() => setFact((f) => (f + 1) % facts.length), 5200);
    return () => window.clearInterval(id);
  }, [facts.length]);

  useEffect(() => {
    const c = host.current;
    if (!c) return;
    const g = c.getContext('2d');
    if (!g) return;
    const press = new Press();
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const r = c.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = Math.max(1, Math.round(r.width));
      const h = Math.max(1, Math.round(r.height));
      if (c.width !== w * dpr || c.height !== h * dpr) {
        c.width = w * dpr;
        c.height = h * dpr;
      }
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      press.step(g, w, h, dt, live.current);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const at = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = host.current;
    if (!c) return;
    const r = c.getBoundingClientRect();
    const p = live.current.hand;
    p.x = (e.clientX - r.left) / r.width;
    p.y = (e.clientY - r.top) / r.height;
  };

  const pct = Math.round(live.current.progress * 100);
  const left = rate > 0.5 ? (total - done) / rate : 0;
  const px = plates.reduce((a, p) => a + p.canvas.width * p.canvas.height, 0) / 1e6;
  const sheet = plates[0];

  return (
    <div className="load">
      <div className="glass load__panel">
        <div className="load__head">
          <div className="load__eyebrow">building · hold to take the pen</div>
          <h2 className="load__title" style={{ color: accent }}>
            {title}
          </h2>
        </div>

        <canvas
          className="load__bed"
          ref={host}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            at(e);
            live.current.hand.on = true;
          }}
          onPointerMove={at}
          onPointerUp={() => (live.current.hand.on = false)}
          onPointerCancel={() => (live.current.hand.on = false)}
          onPointerLeave={() => (live.current.hand.on = false)}
        />

        <div className="load__bar">
          <span style={{ width: `${pct}%`, background: accent }} />
        </div>

        <dl className="load__readout">
          <Row k="drawn" v={`${done.toLocaleString('en-IN')} / ${total.toLocaleString('en-IN')}`} />
          <Row k="rate" v={`${rate < 10 ? rate.toFixed(1) : Math.round(rate)}/s`} />
          <Row k="elapsed" v={clock(elapsed)} />
          <Row k="remaining" v={left > 0.5 ? `~${clock(left)}` : '—'} />
          <Row k="plates" v={`${plates.length}${sheet ? ` × ${sheet.grid}²` : ''}`} />
          <Row
            k="atlas"
            v={sheet ? `${sheet.canvas.width}px · ${px.toFixed(1)} Mpx` : 'allocating'}
          />
        </dl>

        <div className="load__fact">{facts[fact] ?? ''}</div>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="load__row">
      <dt>{k}</dt>
      <dd>{v}</dd>
    </div>
  );
}
