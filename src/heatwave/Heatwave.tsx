import { useEffect, useRef, useState } from 'react';
import { Game, type Hud, type Result } from './game';
import { PLAYER, type VehicleTuning } from './config';
import type { Driver } from './cars';

/**
 * HEATWAVE — the page.
 *
 * The game fills the window. Put a thumb down anywhere and a stick appears
 * under it: push the way you want the car to go, on screen, and it goes
 * there; lift off and it keeps going. On a keyboard the arrows or WASD do
 * the same. Over the top: the score, the stars, the hull. T opens the
 * tuning panel.
 */

const TUNE: [keyof VehicleTuning, string, number, number, number][] = [
  ['acceleration', 'acceleration', 8, 50, 1],
  ['maxSpeed', 'max speed', 15, 50, 1],
  ['turnSpeed', 'turn speed', 1, 6, 0.1],
  ['turnCurve', 'turn curve', 0, 1, 0.05],
  ['lateralGrip', 'lateral grip', 1, 15, 0.5],
  ['driftFactor', 'drift factor', 0, 1, 0.05],
  ['mass', 'mass', 0.5, 3, 0.1],
  ['collisionForce', 'collision force', 0, 1.5, 0.05],
  ['drag', 'drag', 0, 0.5, 0.01],
  ['recoverySpeed', 'recovery speed', 0.5, 6, 0.1],
];
const DEFAULTS = { ...PLAYER };

const EMPTY: Hud = { score: 0, wanted: 1, hull: 100, best: 0, time: 0, chain: 0 };

function fmt(n: number) { return n.toLocaleString('en-US'); }
function clock(s: number) { return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`; }

export function Heatwave({ onExit }: { onExit: () => void }) {
  const view = useRef<HTMLDivElement>(null);
  const layer = useRef<HTMLDivElement>(null);
  const game = useRef<Game | null>(null);
  const [phase, setPhase] = useState<'ready' | 'play' | 'over'>('ready');
  const [hud, setHud] = useState<Hud>(EMPTY);
  const [result, setResult] = useState<Result | null>(null);
  const [driver, setDriver] = useState<Driver>('boss');
  const [muted, setMuted] = useState(false);
  const [tuning, setTuning] = useState(() => new URLSearchParams(window.location.search).has('tune'));
  const [, setTick] = useState(0);
  const [stick, setStick] = useState<{ ox: number; oy: number; x: number; y: number } | null>(null);
  const overAt = useRef(0);

  useEffect(() => {
    const el = view.current;
    const fx = layer.current;
    if (!el || !fx) return;
    const canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    el.replaceChildren(canvas);
    const g = new Game(canvas, fx, setHud, (r) => { overAt.current = performance.now(); setResult(r); setPhase('over'); });
    game.current = g;
    (window as unknown as { __heatwave?: Game }).__heatwave = g;
    setHud({ ...EMPTY, best: g.best });
    const fit = () => g.resize(el.clientWidth, el.clientHeight);
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    const vis = () => (document.hidden ? g.audio.suspend() : g.audio.resume());
    document.addEventListener('visibilitychange', vis);
    return () => {
      ro.disconnect();
      document.removeEventListener('visibilitychange', vis);
      g.dispose();
      game.current = null;
    };
  }, []);

  const start = () => {
    const g = game.current;
    if (!g) return;
    g.start();
    setResult(null);
    setPhase('play');
  };

  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onExit();
      if (e.key === 't' || e.key === 'T') setTuning((v) => !v);
      if (e.key === 'm' || e.key === 'M') toggleMute();
      if ((e.key === 'Enter' || e.key === ' ') && phase !== 'play') {
        e.preventDefault();
        if (phase === 'ready' || performance.now() - overAt.current > 600) start();
      }
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  });

  const toggleMute = () => setMuted((m) => { game.current?.audio.setMuted(!m); return !m; });

  // the floating stick: wherever the thumb lands
  const R = 56;
  const onDown = (e: React.PointerEvent) => {
    if (phase === 'ready') { start(); }
    else if (phase === 'over') { if (performance.now() - overAt.current > 600) start(); return; }
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setStick({ ox: e.clientX, oy: e.clientY, x: 0, y: 0 });
  };
  const onMove = (e: React.PointerEvent) => {
    if (!stick) return;
    const dx = e.clientX - stick.ox;
    const dy = e.clientY - stick.oy;
    const len = Math.hypot(dx, dy);
    if (len > 12) game.current?.setStick({ x: dx, y: dy });
    if (len > R) {
      // drag the base along behind the thumb so it never runs out of travel
      const k = (len - R) / len;
      setStick({ ox: stick.ox + dx * k, oy: stick.oy + dy * k, x: (dx * R) / len, y: (dy * R) / len });
      return;
    }
    setStick({ ...stick, x: dx, y: dy });
  };
  const onUp = () => { setStick(null); game.current?.setStick(null); };

  const pickDriver = (d: Driver) => { setDriver(d); game.current?.setDriver(d); };

  const hullPct = Math.max(0, Math.min(100, hud.hull));
  return (
    <div className="hw">
      <div className="hw__view" ref={view} />
      <div className="hw__layer" ref={layer} />
      <div className="hw__touch" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} />
      {stick && (
        <div className="hw-stick" style={{ left: stick.ox, top: stick.oy }}>
          <div className="hw-stick__knob" style={{ transform: `translate(${stick.x}px, ${stick.y}px)` }} />
        </div>
      )}

      {phase !== 'ready' && (
        <header className="hw__hud">
          <div className="hw__score">
            <b>{fmt(hud.score)}</b>
            {hud.chain > 1 && <span className="hw__chain">×{hud.chain} CHAIN</span>}
          </div>
          <div className={`hw__stars hw__stars--${hud.wanted}`} aria-label={`wanted level ${hud.wanted}`}>
            {[1, 2, 3, 4, 5].map((i) => <span key={i} className={i <= hud.wanted ? 'is-on' : ''}>★</span>)}
          </div>
          <div className="hw__hull">
            <span>HULL</span>
            <i><em style={{ width: `${hullPct}%` }} className={hullPct < 35 ? 'is-low' : ''} /></i>
          </div>
        </header>
      )}
      <div className="hw__tools">
        <button onClick={toggleMute} aria-label={muted ? 'sound on' : 'mute'}>{muted ? '🔇' : '🔊'}</button>
        <button onClick={() => setTuning((v) => !v)} aria-label="tuning">⚙</button>
        <button onClick={onExit} aria-label="back to the shelf">✕</button>
      </div>

      {phase === 'ready' && (
        <section className="hw__card hw__card--start">
          <p className="hw__kicker">a police-chase arcade prototype</p>
          <h1 className="hw__logo">HEAT<span>WAVE</span></h1>
          <p className="hw__line">Drive. Bait the cops. Don't get caught.</p>
          <ul className="hw__how">
            <li><b>Steer</b> put a thumb down anywhere and push the way you want to go · or arrows / WASD</li>
            <li><b>Score</b> make the police crash — into rocks, walls, barrels, each other. Chain them.</li>
            <li><b>Survive</b> every star brings more of them.</li>
          </ul>
          <div className="hw__drivers" onPointerDown={(e) => e.stopPropagation()}>
            <span>driver</span>
            <button className={driver === 'boss' ? 'is-on' : ''} onClick={() => pickDriver('boss')}>The Boss</button>
            <button className={driver === 'outlaw' ? 'is-on' : ''} onClick={() => pickDriver('outlaw')}>The Outlaw</button>
          </div>
          <button className="hw__go" onClick={start}>TAP TO DRIVE</button>
          {hud.best > 0 && <p className="hw__best">best {fmt(hud.best)}</p>}
        </section>
      )}

      {phase === 'over' && result && (
        <section className="hw__card hw__card--over">
          <h2 className="hw__busted">BUSTED</h2>
          <p className="hw__final">{fmt(result.score)}</p>
          {result.newBest ? <p className="hw__newbest">NEW BEST!</p> : <p className="hw__best">best {fmt(result.best)}</p>}
          <p className="hw__sub">{result.smashed} cop{result.smashed === 1 ? '' : 's'} smashed · survived {clock(result.time)}</p>
          <button className="hw__go" onClick={start}>AGAIN</button>
        </section>
      )}

      {tuning && (
        <aside className="hw__tune" onPointerDown={(e) => e.stopPropagation()}>
          <h3>player vehicle <button onClick={() => { Object.assign(PLAYER, DEFAULTS); setTick((n) => n + 1); }}>reset</button></h3>
          {TUNE.map(([k, label, min, max, step]) => (
            <label key={k}>
              <span>{label}</span>
              <input type="range" min={min} max={max} step={step} value={PLAYER[k]}
                onChange={(e) => { PLAYER[k] = Number(e.target.value); setTick((n) => n + 1); }} />
              <output>{PLAYER[k].toFixed(step < 0.1 ? 2 : step < 1 ? 1 : 0)}</output>
            </label>
          ))}
          <p>Live. Defaults are in <code>src/heatwave/config.ts</code>. T to close.</p>
        </aside>
      )}
    </div>
  );
}
