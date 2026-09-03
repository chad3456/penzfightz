import { useCallback, useEffect, useRef, useState } from 'react';
import { QUALITY, World, type Hud, type Mode, type Perf, type Tool } from './world';
import { SPEEDS, type Stats } from './sim';
import type { Zone } from './buildings';
import type { VehicleKind } from './vehicles';
import type { OpKind, Report } from './ops';

/**
 * Ground Plan.
 *
 * React owns the panels and nothing else. Everything on the canvas is one
 * `World`, driven by a hand-written loop, because a hundred thousand terrain
 * vertices, a few thousand merged buildings, several hundred vehicles and a
 * helicopter want an update order somebody chose.
 *
 * Three things cross the boundary and each does so differently on purpose:
 *
 * - **Stats and the operation report** are pulled on a timer at four hertz. A
 *   simulated day takes about a second; re-rendering the panel sixty times a
 *   second to show a number that changes once is sixty renders for one fact.
 * - **The badges** are positioned imperatively — they move every frame because
 *   they are pinned to points in the world, so the loop writes their transform
 *   and React never re-renders them at all.
 * - **The controls** are written straight into a plain object the physics reads.
 *   Driving through React state would put a render between the key and the
 *   wheel.
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

const RIDES: { id: VehicleKind; label: string }[] = [
  { id: 'auto', label: 'Rickshaw' },
  { id: 'taxi', label: 'Taxi' },
  { id: 'scooter', label: 'Scooter' },
  { id: 'car', label: 'Car' },
  { id: 'jeep', label: 'Jeep' },
  { id: 'truck', label: 'Lorry' },
  { id: 'bus', label: 'Bus' },
];

const OPS: { id: OpKind; label: string; hint: string }[] = [
  { id: 'lift', label: 'Monsoon lift', hint: 'helicopter · hover over six cut-off roofs' },
  { id: 'sweep', label: 'Blackout sweep', hint: 'drive or fly · reach every junction on the list' },
  { id: 'convoy', label: 'Convoy', hint: 'keep up with the column, end to end' },
];

/** Which key does what, per mode. */
const KEYS: Record<string, [keyof Ctl, number]> = {
  KeyW: ['throttle', 1],
  ArrowUp: ['throttle', 1],
  KeyS: ['throttle', -1],
  ArrowDown: ['throttle', -1],
  KeyA: ['steer', -1],
  ArrowLeft: ['steer', -1],
  KeyD: ['steer', 1],
  ArrowRight: ['steer', 1],
  Space: ['brake', 1],
  KeyQ: ['yaw', -1],
  KeyE: ['yaw', 1],
  ShiftLeft: ['lift', 1],
  ShiftRight: ['lift', 1],
  ControlLeft: ['lift', -1],
  KeyZ: ['lift', -1],
};

type Ctl = { throttle: number; brake: number; steer: number; lift: number; yaw: number; boost: boolean };

export function GroundPlan({ onExit }: { onExit: () => void }) {
  const host = useRef<HTMLDivElement | null>(null);
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const world = useRef<World | null>(null);
  const badges = useRef<Record<string, HTMLDivElement | null>>({});
  const [hour, setHour] = useState(9.5);
  const [tool, setTool] = useState<Tool>('none');
  const [mode, setMode] = useState<Mode>('plan');
  const [ride, setRide] = useState<VehicleKind>('auto');
  const [speed, setSpeed] = useState(2);
  const [brush, setBrush] = useState(46);
  const [stats, setStats] = useState<Stats | null>(null);
  const [hud, setHud] = useState<Hud | null>(null);
  const [op, setOp] = useState<Report | null>(null);
  const [perf, setPerf] = useState<Perf | null>(null);
  const [notice, setNotice] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const c = canvas.current;
    const h = host.current;
    if (!c || !h) return;
    const w = new World(c, 20260904, QUALITY.high);
    world.current = w;
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
        el.style.opacity = w.mode === 'plan' ? '1' : '0';
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
      setHud(w.hud());
      setOp(w.ops.report());
      setPerf(w.perf());
      if (w.notice) {
        setNotice(w.notice);
        w.notice = '';
      }
    }, 250);
    setReady(true);

    // Controls are written straight into the object the physics reads; putting
    // a React render between the key and the wheel is a frame of lag you can
    // feel at thirty kilometres an hour.
    const key = (e: KeyboardEvent, down: boolean) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.code === 'Escape' && down) {
        w.setMode('plan');
        setMode('plan');
        return;
      }
      if (down && e.code === 'KeyL' && w.mode === 'fly') {
        w.chopper.lightOn = !w.chopper.lightOn;
        return;
      }
      if (down && (e.code === 'Digit1' || e.code === 'Digit2' || e.code === 'Digit3')) {
        const m: Mode = e.code === 'Digit1' ? 'plan' : e.code === 'Digit2' ? 'drive' : 'fly';
        w.setMode(m);
        setMode(m);
        return;
      }
      const hit = KEYS[e.code];
      if (!hit) return;
      if (w.mode === 'plan') return;
      e.preventDefault();
      const [field, value] = hit;
      if (field === 'boost') return;
      if (down) w.input[field] = value;
      else if (w.input[field] === value) w.input[field] = 0;
    };
    const kd = (e: KeyboardEvent) => key(e, true);
    const ku = (e: KeyboardEvent) => key(e, false);
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);

    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(poll);
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
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
    if (!w || w.mode !== 'plan') return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const n = norm(e);
    if (e.button === 2 || e.shiftKey) drag.current = { ...n, mode: 'orbit' };
    else if (e.button === 0 && w.begin(n.x, n.y)) drag.current = { ...n, mode: 'tool' };
    else drag.current = { ...n, mode: 'pan' };
  };

  const move = (e: React.PointerEvent) => {
    const w = world.current;
    if (!w || w.mode !== 'plan') return;
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

  const go = (m: Mode) => {
    world.current?.setMode(m);
    setMode(m);
    if (m !== 'plan') setTool('none');
  };

  const money = (n: number) => (n < 0 ? '−' : '') + '§' + Math.abs(n).toLocaleString();
  const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  return (
    <div className="gp">
      <div
        className={'gp__stage' + (mode !== 'plan' ? ' gp__stage--ride' : tool === 'none' ? '' : ' gp__stage--tool')}
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
          <div className="glass gp__modes">
            {(['plan', 'drive', 'fly'] as Mode[]).map((m, i) => (
              <button
                key={m}
                className={'gp__mode' + (mode === m ? ' gp__mode--on' : '')}
                onClick={() => go(m)}
                title={`${m} — key ${i + 1}`}
              >
                {m === 'plan' ? 'Plan' : m === 'drive' ? 'Drive' : 'Fly'}
              </button>
            ))}
          </div>
          <button className="glass glass--btn" onClick={onExit}>
            ← Shelf
          </button>
        </div>
      </div>

      {ready && stats && mode === 'plan' && (
        <div className="glass gp__meters">
          <div className="gp__meterRow">
            <b>{stats.population.toLocaleString()}</b>
            <span>residents</span>
          </div>
          <div className="gp__meterRow">
            <b className={stats.funds < 0 ? 'gp__bad' : undefined}>{money(stats.funds)}</b>
            <span>{money(stats.income - stats.upkeep)}/day</span>
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

      {ready && hud && mode !== 'plan' && (
        <div className="glass gp__hud">
          <div className="gp__dial">
            <b>{Math.round(hud.kmh)}</b>
            <span>km/h</span>
          </div>
          {mode === 'fly' ? (
            <>
              <div className="gp__dial gp__dial--small">
                <b>{Math.round(hud.altitude)}</b>
                <span>m agl</span>
              </div>
              <div className="gp__rotor">
                <i style={{ width: Math.round(hud.rpm * 100) + '%' }} />
                <span>rotor</span>
              </div>
            </>
          ) : (
            <div className="gp__dial gp__dial--small">
              <b>{(hud.odo / 1000).toFixed(2)}</b>
              <span>km</span>
            </div>
          )}
        </div>
      )}

      {ready && op && op.state !== 'idle' && (
        <div className={'glass gp__op gp__op--' + op.state}>
          <div className="gp__opHead">
            <b>{OPS.find((o) => o.id === op.kind)?.label ?? 'Operation'}</b>
            <span>{clock(op.seconds)}</span>
          </div>
          <div className="gp__opBar">
            <i style={{ width: (op.total ? (op.done / op.total) * 100 : 0) + '%' }} />
          </div>
          <p>
            {op.done}/{op.total} · {op.message}
          </p>
          {op.state !== 'running' && (
            <button
              className="glass glass--btn"
              onClick={() => {
                world.current?.ops.stop();
                setOp(world.current?.ops.report() ?? null);
              }}
            >
              clear
            </button>
          )}
        </div>
      )}

      <div className="glass gp__desk">
        {mode === 'plan' ? (
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
        ) : mode === 'drive' ? (
          <div className="gp__tools">
            {RIDES.map((r) => (
              <button
                key={r.id}
                className={'gp__tool' + (ride === r.id ? ' gp__tool--on' : '')}
                onClick={() => {
                  setRide(r.id);
                  world.current?.drive(r.id);
                }}
              >
                {r.label}
              </button>
            ))}
          </div>
        ) : (
          <div className="gp__tools">
            <button
              className={'gp__tool' + (hud?.light ? ' gp__tool--on' : '')}
              onClick={() => {
                const w = world.current;
                if (w) w.chopper.lightOn = !w.chopper.lightOn;
              }}
            >
              <i style={{ background: '#ffe9b0' }} />
              Searchlight
            </button>
          </div>
        )}

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

          {mode === 'plan' && (
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
          )}

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

          <div className="gp__speed">
            {OPS.map((o) => (
              <button
                key={o.id}
                className={'gp__speedBtn' + (op?.kind === o.id ? ' gp__speedBtn--on' : '')}
                title={o.hint}
                onClick={() => {
                  const w = world.current;
                  if (!w) return;
                  const ok = w.ops.start(o.id);
                  setOp(w.ops.report());
      setPerf(w.perf());
                  if (!ok) setNotice(w.ops.report().message);
                  else if (o.id === 'lift') go('fly');
                  else if (w.mode === 'plan') go('drive');
                }}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <p className="gp__hint">
          {mode === 'drive'
            ? 'W/S throttle · A/D steer · Space brake · wheel pulls the camera back · Esc for the plan'
            : mode === 'fly'
              ? 'Shift climbs · Z descends · W/S tilt · A/D bank · Q/E pedals · L searchlight · Esc for the plan'
              : tool === 'none'
                ? 'drag to pan · right-drag to orbit · wheel to zoom · 1 plan · 2 drive · 3 fly'
                : TOOLS.find((t) => t.id === tool)?.hint}
        </p>
      </div>

      {perf && (
        <div className="gp__perf">
          {Math.round(perf.fps)} fps · {perf.calls} draws · {(perf.triangles / 1000).toFixed(0)}k tris ·{' '}
          {perf.chunks} chunks · {perf.vehicles} vehicles
        </div>
      )}

      {notice && <div className="gp__notice">{notice}</div>}
    </div>
  );
}
