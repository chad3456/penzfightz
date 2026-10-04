import { useEffect, useRef, useState } from 'react';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { DURATION, FlightFilm, SHOTS } from './film';

/**
 * HANUMAN IN FLIGHT: a realistic cinematic of Hanuman crossing the ocean at
 * dawn, rendered live: atmospheric sky, a Gerstner-wave sea with sun glitter,
 * clouds, a sculpted and skinned body with physically based skin, silk and
 * gold. Play, scrub, or break the camera free and orbit him mid-flight.
 */
export function Flight({ onExit }: { onExit: () => void }) {
  const cvRef = useRef<HTMLCanvasElement>(null);
  const filmRef = useRef<FlightFilm | null>(null);
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState('');
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [free, setFree] = useState(false);
  const [quality, setQuality] = useState<'high' | 'low'>(() => { const q = new URLSearchParams(location.search).get('fq'); if (q === 'low' || q === 'high') return q; return window.matchMedia('(max-width: 700px)').matches ? 'low' : 'high'; });
  const st = useRef({ t: 0, playing: true, last: 0 });

  useEffect(() => {
    const ls = ['/fonts-sacred/fonts.css', '/fonts-guitar/fonts.css'].map((href) => { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; document.head.appendChild(l); return l; });
    return () => ls.forEach((l) => l.remove());
  }, []);

  useEffect(() => {
    const cv = cvRef.current!;
    let raf = 0, alive = true, controls: OrbitControls | null = null;
    setReady(false);
    // let the "sculpting" message paint before the heavy build
    const start = window.setTimeout(() => {
      const tb = performance.now();
      let film: FlightFilm;
      try { film = new FlightFilm(cv, quality); } catch (e) { setErr(String((e as Error).message || e)); return; }
      console.info('flight: built in', Math.round(performance.now() - tb), 'ms');
      filmRef.current = film;
      const fit = () => film.setSize(cv.clientWidth, cv.clientHeight, Math.min(window.devicePixelRatio || 1, quality === 'high' ? 1.5 : 1));
      fit();
      window.addEventListener('resize', fit);
      (window as unknown as { __flight?: unknown }).__flight = {
        film, duration: DURATION,
        renderAt: (tt: number) => film.renderAt(tt),
        seek: (tt: number) => { st.current.t = tt; st.current.playing = false; setPlaying(false); },
        stop: () => { alive = false; cancelAnimationFrame(raf); },
      };
      setReady(true);
      st.current.last = performance.now();
      const loop = (now: number) => {
        if (!alive) return;
        const dt = Math.min(0.1, (now - st.current.last) / 1000); st.current.last = now;
        if (st.current.playing) st.current.t = (st.current.t + dt) % DURATION;
        if (film.freeCam && controls) { controls.target.copy(film.holder.position).setY(film.holder.position.y + 2); controls.update(); }
        film.renderAt(st.current.t);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
      const tick = window.setInterval(() => setT(st.current.t), 200);
      (film as unknown as { _cleanup: () => void })._cleanup = () => { window.clearInterval(tick); window.removeEventListener('resize', fit); };
      (film as unknown as { _orbit: (on: boolean) => void })._orbit = (on: boolean) => {
        film.freeCam = on;
        if (on && !controls) { controls = new OrbitControls(film.camera, cv); controls.enableDamping = true; controls.minDistance = 3; controls.maxDistance = 120; }
        if (!on && controls) { controls.dispose(); controls = null; }
      };
    }, 60);
    return () => {
      alive = false; window.clearTimeout(start); cancelAnimationFrame(raf);
      const f = filmRef.current as unknown as { _cleanup?: () => void } | null;
      f?._cleanup?.(); controls?.dispose(); filmRef.current?.dispose(); filmRef.current = null;
    };
  }, [quality]);

  useEffect(() => { st.current.playing = playing; }, [playing]);
  useEffect(() => { (filmRef.current as unknown as { _orbit?: (on: boolean) => void } | null)?._orbit?.(free); }, [free, ready]);

  const shot = SHOTS.find((s) => t >= s.from && t < s.to) ?? SHOTS[SHOTS.length - 1];
  const fmt = (v: number) => `0:${String(Math.floor(v)).padStart(2, '0')}`;

  return (
    <div className="fl-root">
      <canvas ref={cvRef} className="fl-canvas" />
      {!ready && !err && <div className="fl-load"><span className="fl-load-dot" />Sculpting the body and raising the sea…</div>}
      {err && <div className="fl-load">This device couldn't start the 3D renderer: {err}</div>}
      <header className="fl-top">
        <button className="fl-btn fl-btn--ghost" onClick={onExit}>← Shelf</button>
        <div className="fl-title"><b>Hanuman in Flight</b><span>dawn over the ocean, on the way to Lanka</span></div>
      </header>
      {ready && (
        <div className="fl-shot" key={shot.name}>
          <span>{shot.name}</span>
          <p>{shot.note}</p>
        </div>
      )}
      <div className="fl-bar">
        <button className="fl-btn" onClick={() => setPlaying((p) => !p)}>{playing ? '❚❚' : '▶'}</button>
        <input className="fl-scrub" type="range" min={0} max={DURATION} step={0.05} value={t} onChange={(e) => { st.current.t = +e.target.value; setT(st.current.t); }} aria-label="Time" />
        <span className="fl-time">{fmt(t)} / {fmt(DURATION)}</span>
        <div className="fl-chips">
          {SHOTS.map((s) => <button key={s.name} className={s === shot ? 'on' : ''} onClick={() => { st.current.t = s.from + 0.01; setT(s.from); }}>{s.name}</button>)}
        </div>
        <button className={`fl-btn fl-btn--ghost ${free ? 'on' : ''}`} onClick={() => setFree((f) => !f)}>{free ? 'Film camera' : 'Free camera'}</button>
        <button className="fl-btn fl-btn--ghost" onClick={() => setQuality((q) => (q === 'high' ? 'low' : 'high'))}>{quality === 'high' ? 'High quality' : 'Fast'}</button>
      </div>
    </div>
  );
}
