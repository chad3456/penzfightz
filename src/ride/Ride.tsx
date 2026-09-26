import { useEffect, useRef, useState } from 'react';
import { type CamMode, World } from './world';
import { Sound } from './sound';
import { NAMES, type DistrictId } from './path';

/**
 * 風と自転車 — the page.
 *
 * The world fills the window. Over it: where she is, what time it is, and a
 * few things to touch — the hour, the camera, the sound, the bell. Drag to
 * pull the camera round her; it drifts back when you let go.
 */

const CAMS: [CamMode, string][] = [['auto', 'director'], ['chase', 'behind'], ['side', 'beside'], ['front', 'ahead'], ['crane', 'above']];

function clock(tod: number) {
  const m = Math.floor(tod * 24 * 60);
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

export function Ride({ onExit }: { onExit: () => void }) {
  const host = useRef<HTMLDivElement>(null);
  const world = useRef<World | null>(null);
  const sound = useRef<Sound | null>(null);
  const [tod, setTod] = useState(0.3);
  const [autoTime, setAutoTime] = useState(true);
  const [mode, setMode] = useState<CamMode>('auto');
  const [district, setDistrict] = useState<DistrictId>('sea');
  const [soundOn, setSoundOn] = useState(false);
  const [tuning, setTuning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [fps, setFps] = useState(0);
  const [waiting, setWaiting] = useState(false);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    el.replaceChildren(canvas);
    const probe = document.createElement('canvas').getContext('webgl2');
    const dbg = probe && probe.getExtension('WEBGL_debug_renderer_info');
    const name = dbg ? String(probe!.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : '';
    const forced = new URLSearchParams(window.location.search).get('q');
    const low = forced ? forced === 'low' : /swiftshader|llvmpipe|software/i.test(name) || window.innerWidth < 700;
    const w = new World(canvas, { quality: low ? 'low' : 'high' });
    world.current = w;
    (window as unknown as { __ride?: World }).__ride = w;
    const snd = new Sound();
    sound.current = snd;

    const fit = () => w.resize(el.clientWidth, el.clientHeight);
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);

    let last: { x: number; y: number } | null = null;
    const down = (e: PointerEvent) => { canvas.setPointerCapture(e.pointerId); last = { x: e.clientX, y: e.clientY }; w.dragging = true; };
    const move = (e: PointerEvent) => {
      if (!last) return;
      w.camYaw -= (e.clientX - last.x) * 0.006;
      w.camPitch = Math.max(-0.3, Math.min(1.2, w.camPitch - (e.clientY - last.y) * 0.004));
      last = { x: e.clientX, y: e.clientY };
    };
    const up = () => { last = null; w.dragging = false; };
    canvas.addEventListener('pointerdown', down);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);

    let raf = 0;
    let frames = 0;
    let lastT = performance.now();
    let lastUi = 0;
    const loop = () => {
      w.frame();
      snd.update({ night: w.night, tod: w.tod, district: w.district, crossing: w.crossing.active, crossingDist: w.crossing.dist, speed: w.speed });
      frames++;
      const now = performance.now();
      if (now - lastT > 1000) { setFps(Math.round((frames * 1000) / (now - lastT))); frames = 0; lastT = now; }
      if (now - lastUi > 250) {
        lastUi = now;
        setTod(w.tod);
        setDistrict(w.district);
        setWaiting(w.crossing.active && w.speed < 0.5);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      void snd.stop();
      w.dispose();
    };
  }, []);

  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onExit();
      if (e.key === 'b' || e.key === 'B') { sound.current?.ring(); world.current?.ring(); }
      if (e.key === ' ') { e.preventDefault(); setPaused((p) => { const n = !p; if (world.current) world.current.paused = n; return n; }); }
      const i = Number(e.key) - 1;
      if (i >= 0 && i < CAMS.length) { setMode(CAMS[i]![0]); if (world.current) world.current.mode = CAMS[i]![0]; }
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, [onExit]);

  const toggleSound = async () => {
    const s = sound.current;
    if (!s) return;
    if (soundOn) { await s.stop(); setSoundOn(false); return; }
    // the waltz is written out the first time, which takes a moment
    setTuning(true);
    await s.start();
    setTuning(false);
    setSoundOn(true);
  };

  const [jp, en] = NAMES[district];
  const isNight = tod < 0.24 || tod > 0.79;
  return (
    <div className="ride">
      <div className="ride__view" ref={host} />
      <header className="ride__top">
        <div>
          <p className="ride__kicker">a ride through a Japanese town, from morning round to morning</p>
          <h1 className="ride__title">風と自転車 <span>Wind and a Bicycle</span></h1>
        </div>
        <button className="ride__exit" onClick={onExit}>← back to the shelf</button>
      </header>
      <section className="ride__where" key={district}>
        <p className="ride__jp">{jp}</p>
        <p className="ride__en">{en}</p>
        {waiting && <p className="ride__wait">カンカンカン · waiting for the train</p>}
      </section>
      <footer className="ride__bar">
        <div className="ride__time">
          <span className="ride__clock">{isNight ? '☾' : '☀'} {clock(tod)}</span>
          <input
            type="range" min={0} max={1000} value={Math.round(tod * 1000)} aria-label="time of day"
            onChange={(e) => { const v = Number(e.target.value) / 1000; setTod(v); if (world.current) world.current.tod = v; }}
          />
          <button className={autoTime ? 'is-on' : ''} onClick={() => { const n = !autoTime; setAutoTime(n); if (world.current) world.current.autoTime = n; }}>
            {autoTime ? 'day passing' : 'time stopped'}
          </button>
        </div>
        <div className="ride__cams">
          {CAMS.map(([m, label]) => (
            <button key={m} className={mode === m ? 'is-on' : ''} onClick={() => { setMode(m); if (world.current) world.current.mode = m; }}>{label}</button>
          ))}
        </div>
        <div className="ride__tools">
          <button onClick={() => { setPaused((p) => { const n = !p; if (world.current) world.current.paused = n; return n; }); }}>{paused ? '▶ ride' : '❚❚ stop'}</button>
          <button onClick={() => { sound.current?.ring(); world.current?.ring(); }}>🔔 bell</button>
          <button className={soundOn ? 'is-on' : ''} onClick={toggleSound} disabled={tuning}>{tuning ? '♪ tuning…' : soundOn ? '♪ sound on' : '♪ sound'}</button>
        </div>
      </footer>
      <p className="ride__stats">{fps} fps · drag to look round · 1–5 camera · space to stop · B for the bell</p>
    </div>
  );
}
