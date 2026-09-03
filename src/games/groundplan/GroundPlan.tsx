import { useCallback, useEffect, useRef, useState } from 'react';
import { QUALITY, World, type Tool } from './world';
import { SPEEDS, type Stats } from './sim';
import type { Zone } from './buildings';

/**
 * Ground Plan.
 *
 * The React side owns the panel and nothing else. Everything on the canvas is
 * one `World`, driven by a hand-written loop, because a hundred thousand
 * terrain vertices, a few thousand merged buildings and several hundred cars
 * want an update order somebody chose.
 *
 * Two things cross the boundary and both are deliberate:
 *
 * - The **stats** are pulled on a timer at four hertz, not pushed every frame.
 *   A simulated day takes about a second; re-rendering the panel sixty times a
 *   second to show a number that changes once would be sixty React renders to
 *   deliver one fact.
 * - The **badges** are positioned imperatively. They do move every frame — they
 *   are pinned to points in the world — so they are DOM nodes whose transform
 *   the loop writes directly, and React never re-renders them at all.
 */

const TOOLS: { id: Tool; label: string; hint: string; tint: string }[] = [
  { id: 'street', label: 'Street', hint: '14 m · drag to lay', tint: '#ffc247' },
  { id: 'avenue', label: 'Avenue', hint: '22 m · four lanes', tint: '#ffa030' },
  { id: 'res', label: 'Homes', hint: 'paint a district', tint: '#5fc76c' },
  { id: 'com', label: 'Shops', hint: 'paint a district', tint: '#4a9ef5' },
  { id: 'ind', label: 'Works', hint: 'paint a district', tint: '#f2c245' },
  { id: 'off', label: 'Offices', hint: 'towers, once it is a city', tint: '#b872ee' },
  { id: 'park', label: 'Park', hint: 'keeps a block empty', tint: '#2fdc9e' },
  { id: 'bulldoze', label: 'Bulldoze', hint: 'roads, then zoning', tint: '#ff5a4a' },
];

const RCI: { id: Zone; label: string; tint: string }[] = [
  { id: 'res', label: 'R', tint: '#5fc76c' },
  { id: 'com', label: 'C', tint: '#4a9ef5' },
  { id: 'ind', label: 'I', tint: '#f2c245' },
  { id: 'off', label: 'O', tint: '#b872ee' },
];

export function GroundPlan({ onExit }: { onExit: () => void }) {
  const host = useRef<HTMLDivElement | null>(null);
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const world = useRef<World | null>(null);
  const badges = useRef<Record<string, HTMLDivElement | null>>({});
  const [hour, setHour] = useState(9.5);
  const [tool, setTool] = useState<Tool>('none');
  const [speed, setSpeed] = useState(2);
  const [brush, setBrush] = useState(46);
  const [stats, setStats] = useState<Stats | null>(null);
  const [notice, setNotice] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const c = canvas.current;
    const h = host.current;
    if (!c || !h) return;
    const w = new World(c, 20260904, QUALITY.high);
    world.current = w;
    // A handle for poking at the city from the dev console, and for driving it
    // from a browser test without waiting for a hundred simulated days.
    if (import.meta.env.DEV) (window as unknown as { gp: World }).gp = w;

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
      for (const l of w.labels()) {
        const el = badges.current[l.id];
        if (!el) continue;
        el.style.transform = `translate3d(${Math.round(l.x)}px, ${Math.round(l.y)}px, 0)`;
        el.style.opacity = '1';
        el.dataset.title = l.title;
        const t = el.querySelector('.gp__badgeName');
        const n = el.querySelector('.gp__badgeNote');
        if (t && t.textContent !== l.title) t.textContent = l.title;
        if (n && n.textContent !== l.note) n.textContent = l.note;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const poll = window.setInterval(() => {
      setStats({ ...w.sim.stats });
      if (w.notice) {
        setNotice(w.notice);
        w.notice = '';
      }
    }, 250);
    setReady(true);

    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(poll);
      ro.disconnect();
      w.dispose();
      world.current = null;
    };
  }, []);

  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice(''), 2600);
    return () => window.clearTimeout(t);
  }, [notice]);

  // --------------------------------------------------------------- pointer
  const drag = useRef<{ x: number; y: number; mode: 'pan' | 'orbit' | 'tool' } | null>(null);

  const norm = (e: React.PointerEvent) => {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * 2 - 1, y: -((e.clientY - r.top) / r.height) * 2 + 1 };
  };

  const down = (e: React.PointerEvent) => {
    const w = world.current;
    if (!w) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const n = norm(e);
    if (e.button === 2 || e.shiftKey) drag.current = { ...n, mode: 'orbit' };
    else if (e.button === 0 && w.begin(n.x, n.y)) drag.current = { ...n, mode: 'tool' };
    else drag.current = { ...n, mode: 'pan' };
  };

  const move = (e: React.PointerEvent) => {
    const w = world.current;
    if (!w) return;
    const n = norm(e);
    const d = drag.current;
    if (!d) {
      w.hover(n.x, n.y);
      return;
    }
    if (d.mode === 'orbit') w.orbitBy((n.x - d.x) * 0.9, -(n.y - d.y) * 0.9);
    else if (d.mode === 'tool') w.dragTool(n.x, n.y);
    else w.panBy(d.x, d.y, n.x, n.y);
    drag.current = { ...d, x: n.x, y: n.y };
  };

  const up = (e: React.PointerEvent) => {
    const w = world.current;
    if (w && drag.current?.mode === 'tool') {
      const n = norm(e);
      w.finish(n.x, n.y);
    }
    drag.current = null;
  };

  const wheel = useCallback((e: React.WheelEvent) => {
    world.current?.zoomBy(e.deltaY);
  }, []);

  const choose = (t: Tool) => {
    const next = tool === t ? 'none' : t;
    setTool(next);
    world.current?.setTool(next);
  };

  const money = (n: number) => (n < 0 ? '−' : '') + '§' + Math.abs(n).toLocaleString();

  return (
    <div className="gp">
      <div
        className={'gp__stage' + (tool === 'none' ? '' : ' gp__stage--tool')}
        ref={host}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onPointerLeave={() => world.current?.cursor.hide()}
        onWheel={wheel}
        onContextMenu={(e) => e.preventDefault()}
      >
        <canvas ref={canvas} className="gp__canvas" />
      </div>

      <div className="gp__badges">
        {(['city', 'tall'] as const).map((id) => (
          <div
            key={id}
            className={'gp__badge gp__badge--' + id}
            ref={(el) => {
              badges.current[id] = el;
            }}
          >
            <span className="gp__badgeName" />
            <span className="gp__badgeNote" />
            <i className="gp__badgeStem" />
          </div>
        ))}
      </div>

      <div className="gp__top">
        <div className="glass ink__plate">
          <div className="ink__eyebrow">three.js · planar road graph · procedural facades</div>
          <h1 className="ink__title">Ground Plan</h1>
        </div>
        <div className="ink__actions">
          <button className="glass glass--btn" onClick={onExit}>
            ← Shelf
          </button>
        </div>
      </div>

      {ready && stats && (
        <div className="glass gp__meters">
          <div className="gp__meterRow">
            <b>{stats.population.toLocaleString()}</b>
            <span>residents</span>
          </div>
          <div className="gp__meterRow">
            <b className={stats.funds < 0 ? 'gp__bad' : undefined}>{money(stats.funds)}</b>
            <span>
              {money(stats.income - stats.upkeep)}/day
            </span>
          </div>
          <div className="gp__meterRow">
            <b>{stats.jobs.toLocaleString()}</b>
            <span>jobs · {Math.round(stats.unemployment * 100)}% idle</span>
          </div>
          <div className="gp__rci">
            {RCI.map((r) => {
              const v = stats.demand[r.id];
              return (
                <div key={r.id} className="gp__rciCol" title={r.label + ' demand'}>
                  <div className="gp__rciTrack">
                    <i
                      style={{
                        background: r.tint,
                        height: Math.abs(v) * 50 + '%',
                        bottom: v >= 0 ? '50%' : undefined,
                        top: v < 0 ? '50%' : undefined,
                      }}
                    />
                  </div>
                  <span style={{ color: r.tint }}>{r.label}</span>
                </div>
              );
            })}
          </div>
          <div className="gp__meterRow gp__meterRow--thin">
            <span>
              day {stats.day} · {stats.buildings} buildings · {stats.roadKm.toFixed(1)} km
            </span>
          </div>
        </div>
      )}

      <div className="glass gp__desk">
        <div className="gp__tools">
          {TOOLS.map((t) => (
            <button
              key={t.id}
              className={'gp__tool' + (tool === t.id ? ' gp__tool--on' : '')}
              style={tool === t.id ? { borderColor: t.tint, color: t.tint } : undefined}
              onClick={() => choose(t.id)}
              title={t.hint}
            >
              <i style={{ background: t.tint }} />
              {t.label}
            </button>
          ))}
        </div>

        <div className="gp__knobs">
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

          <label className="ink__knob">
            <span className="ink__knobname">brush</span>
            <input
              type="range"
              min={20}
              max={130}
              step={2}
              value={brush}
              onChange={(e) => {
                const v = Number(e.target.value);
                setBrush(v);
                if (world.current) world.current.brush = v;
              }}
            />
            <span className="ink__knobval">{brush} m</span>
          </label>

          <div className="gp__speed">
            {SPEEDS.map((_, i) => (
              <button
                key={i}
                className={'gp__speedBtn' + (speed === i ? ' gp__speedBtn--on' : '')}
                onClick={() => {
                  setSpeed(i);
                  if (world.current) world.current.sim.speed = i;
                }}
              >
                {i === 0 ? '❙❙' : '▶'.repeat(i)}
              </button>
            ))}
          </div>
        </div>

        <p className="gp__hint">
          {tool === 'none'
            ? 'drag to pan · right-drag to orbit · wheel to zoom · pick a tool to build'
            : TOOLS.find((t) => t.id === tool)?.hint}
        </p>
      </div>

      {notice && <div className="gp__notice">{notice}</div>}
    </div>
  );
}
