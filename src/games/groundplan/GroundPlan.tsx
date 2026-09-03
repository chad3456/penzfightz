import { useCallback, useEffect, useRef, useState } from 'react';
import { QUALITY, World } from './world';

/**
 * Ground Plan.
 *
 * The React side owns the panel and nothing else. Everything on the canvas is
 * one `World`, driven by a hand-written loop, because a hundred thousand
 * terrain vertices and several thousand instanced buildings want an update
 * order somebody chose.
 */

export function GroundPlan({ onExit }: { onExit: () => void }) {
  const host = useRef<HTMLDivElement | null>(null);
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const world = useRef<World | null>(null);
  const [hour, setHour] = useState(9.5);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const c = canvas.current;
    const h = host.current;
    if (!c || !h) return;
    const w = new World(c, 20260904, QUALITY.high);
    world.current = w;

    const fit = () => {
      const r = h.getBoundingClientRect();
      w.resize(Math.max(2, Math.round(r.width)), Math.max(2, Math.round(r.height)));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(h);

    let raf = 0;
    const tick = () => {
      w.render();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    setReady(true);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      w.dispose();
      world.current = null;
    };
  }, []);

  // --------------------------------------------------------------- pointer
  const drag = useRef<{ x: number; y: number; button: number } | null>(null);

  const norm = (e: React.PointerEvent) => {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * 2 - 1, y: -((e.clientY - r.top) / r.height) * 2 + 1 };
  };

  const down = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const n = norm(e);
    drag.current = { x: n.x, y: n.y, button: e.button };
  };

  const move = (e: React.PointerEvent) => {
    const w = world.current;
    const d = drag.current;
    if (!w || !d) return;
    const n = norm(e);
    if (d.button === 2 || e.shiftKey) w.orbitBy((n.x - d.x) * 0.9, -(n.y - d.y) * 0.9);
    else w.panBy(d.x, d.y, n.x, n.y);
    drag.current = { ...d, x: n.x, y: n.y };
  };

  const up = () => {
    drag.current = null;
  };

  const wheel = useCallback((e: React.WheelEvent) => {
    world.current?.zoomBy(e.deltaY);
  }, []);

  return (
    <div className="gp">
      <div
        className="gp__stage"
        ref={host}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onWheel={wheel}
        onContextMenu={(e) => e.preventDefault()}
      >
        <canvas ref={canvas} className="gp__canvas" />
      </div>

      <div className="gp__top">
        <div className="glass ink__plate">
          <div className="ink__eyebrow">three.js · procedural terrain · one height field</div>
          <h1 className="ink__title">Ground Plan</h1>
        </div>
        <div className="ink__actions">
          <button className="glass glass--btn" onClick={onExit}>
            ← Shelf
          </button>
        </div>
      </div>

      {ready && (
        <div className="glass gp__desk">
          <label className="ink__knob">
            <span className="ink__knobname">hour</span>
            <input
              type="range"
              min={0}
              max={24}
              step={0.1}
              value={hour}
              onChange={(e) => {
                const v = Number(e.target.value);
                setHour(v);
                world.current?.setHour(v);
              }}
            />
            <span className="ink__knobval">{hour.toFixed(1)}</span>
          </label>
        </div>
      )}
    </div>
  );
}
