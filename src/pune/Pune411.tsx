import { useEffect, useRef, useState } from 'react';
import { loadCity, type City } from './data';
import { PuneWorld, type Hud, type Save } from './world';
import { MISSIONS } from './missions';

/**
 * PUNE 411 — an open-world game in the real Pune. The streets, buildings,
 * rivers, flyovers and hills come from OpenStreetMap (via Overture Maps) and
 * real elevation data; the landmarks stand where they stand. Drive, ride,
 * walk, run errands, get chased, find all twenty Puneri patya.
 */

type Phase = 'title' | 'loading' | 'play' | 'error';

const fmtMoney = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');

function Stars({ n, blink }: { n: number; blink: boolean }) {
  return (
    <div className={'p4-stars' + (blink ? ' p4-blink' : '')} aria-label={`Wanted level ${n} of 5`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <svg key={i} viewBox="0 0 24 24" width="22" height="22" className={i < n ? 'on' : ''}><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z" /></svg>
      ))}
    </div>
  );
}

export function Pune411({ onExit }: { onExit: () => void }) {
  const cvRef = useRef<HTMLCanvasElement>(null);
  const miniRef = useRef<HTMLCanvasElement>(null);
  const bigRef = useRef<HTMLCanvasElement>(null);
  const worldRef = useRef<PuneWorld | null>(null);
  const cityRef = useRef<City | null>(null);
  const [phase, setPhase] = useState<Phase>('title');
  const [prog, setProg] = useState({ f: 0, label: '' });
  const [err, setErr] = useState('');
  const [hud, setHud] = useState<Hud | null>(null);
  const [paused, setPaused] = useState(false);
  const [help, setHelp] = useState(false);
  const [quality, setQuality] = useState<'high' | 'low'>(() => {
    const q = new URLSearchParams(location.search).get('pq');
    if (q === 'low' || q === 'high') return q;
    return window.matchMedia('(max-width: 760px), (pointer: coarse)').matches ? 'low' : 'high';
  });
  const coarse = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;
  const [save] = useState<Save | null>(() => { try { const s = localStorage.getItem('pune411-v1'); return s ? (JSON.parse(s) as Save) : null; } catch { return null; } });

  useEffect(() => {
    const ls = ['/fonts-guitar/fonts.css', '/fonts-sacred/fonts.css'].map((href) => { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; document.head.appendChild(l); return l; });
    return () => ls.forEach((l) => l.remove());
  }, []);

  const start = async (fresh: boolean) => {
    setPhase('loading');
    try {
      await Promise.all([document.fonts.load('700 30px "Noto Serif Devanagari"'), document.fonts.load('600 20px "Fraunces"'), document.fonts.load('700 20px "IBM Plex Mono"')]).catch(() => undefined);
      const city = cityRef.current ?? (await loadCity((f, label) => setProg({ f: f * 0.7, label })));
      cityRef.current = city;
      setProg({ f: 0.72, label: 'building the city' });
      await new Promise((r) => setTimeout(r, 30));
      const cv = cvRef.current!;
      const s = fresh ? null : save;
      if (fresh) { try { localStorage.removeItem('pune411-v1'); } catch { /* ignore */ } }
      const w = new PuneWorld(cv, city, quality, s);
      worldRef.current = w;
      (window as unknown as { __pune: unknown }).__pune = { world: w, city };
      setProg({ f: 0.8, label: 'laying the streets' });
      await new Promise((r) => setTimeout(r, 30));
      w.warm(w.p.x, w.p.z);
      setProg({ f: 1, label: 'ready' });
      setPhase('play');
      if (fresh || !s) {
        // the first mission starts on arrival at the station
        const m = MISSIONS[0];
        window.setTimeout(() => { if (!w.disposed && !w.missions.done.has(m.id)) w.missions.start(m); }, 1200);
      }
    } catch (e) {
      console.error(e);
      setErr(String((e as Error).message || e));
      setPhase('error');
    }
  };

  // the loop
  useEffect(() => {
    if (phase !== 'play') return;
    const w = worldRef.current!, cv = cvRef.current!;
    let raf = 0, last = performance.now();
    const fit = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, quality === 'high' ? 1.5 : 1);
      w.setSize(cv.clientWidth, cv.clientHeight, dpr);
      for (const c of [miniRef.current, bigRef.current]) if (c) { c.width = Math.round(c.clientWidth * (window.devicePixelRatio || 1)); c.height = Math.round(c.clientHeight * (window.devicePixelRatio || 1)); }
    };
    fit();
    w.miniCanvas = miniRef.current; w.bigCanvas = bigRef.current;
    w.hudCb = setHud;
    window.addEventListener('resize', fit);
    const sizeTo = (c: HTMLCanvasElement | null) => {
      if (!c) return c;
      const d = window.devicePixelRatio || 1, cw = Math.round(c.clientWidth * d), ch = Math.round(c.clientHeight * d);
      if (c.width !== cw || c.height !== ch) { c.width = cw; c.height = ch; }
      return c;
    };
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = (now - last) / 1000; last = now;
      // the HUD canvases come and go with React; hand the world whatever is mounted now
      w.miniCanvas = sizeTo(miniRef.current); w.bigCanvas = sizeTo(bigRef.current);
      w.frame(dt);
    };
    raf = requestAnimationFrame(loop);
    const kd = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      if (e.code === 'Escape' || e.code === 'KeyP') { if (w.mapOpen) w.toggleMap(); else { w.paused = !w.paused; setPaused(w.paused); } e.preventDefault(); return; }
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
      if (e.repeat) return;
      w.keyDown(e.code);
    };
    const ku = (e: KeyboardEvent) => w.keyUp(e.code);
    const blur = () => w.keys.clear();
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku); window.addEventListener('blur', blur);
    // drag to look around
    let drag: { id: number; x: number; y: number } | null = null;
    const pd = (e: PointerEvent) => { if (e.pointerType === 'touch' && e.clientX < window.innerWidth * 0.45) return; drag = { id: e.pointerId, x: e.clientX, y: e.clientY }; w.sound.start(); };
    const pm = (e: PointerEvent) => { if (!drag || drag.id !== e.pointerId) return; w.dragCamera(e.clientX - drag.x, e.clientY - drag.y); drag.x = e.clientX; drag.y = e.clientY; };
    const pu = (e: PointerEvent) => { if (drag && drag.id === e.pointerId) drag = null; };
    cv.addEventListener('pointerdown', pd); window.addEventListener('pointermove', pm); window.addEventListener('pointerup', pu);
    const save = window.setInterval(() => w.saveGame(), 15000);
    return () => {
      cancelAnimationFrame(raf); window.clearInterval(save);
      window.removeEventListener('resize', fit); window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); window.removeEventListener('blur', blur);
      cv.removeEventListener('pointerdown', pd); window.removeEventListener('pointermove', pm); window.removeEventListener('pointerup', pu);
    };
  }, [phase, quality]);

  useEffect(() => () => { worldRef.current?.saveGame(); worldRef.current?.dispose(); worldRef.current = null; }, []);

  // the big map: drag to pan, wheel to zoom, tap to set a waypoint
  useEffect(() => {
    const cv = bigRef.current, w = worldRef.current;
    if (!cv || !w || !hud?.mapOpen) return;
    cv.width = Math.round(cv.clientWidth * (window.devicePixelRatio || 1)); cv.height = Math.round(cv.clientHeight * (window.devicePixelRatio || 1));
    let d: { x: number; y: number; moved: number } | null = null;
    const down = (e: PointerEvent) => { d = { x: e.clientX, y: e.clientY, moved: 0 }; cv.setPointerCapture(e.pointerId); };
    const move = (e: PointerEvent) => { if (!d) return; const dx = e.clientX - d.x, dy = e.clientY - d.y; d.moved += Math.abs(dx) + Math.abs(dy); w.mapCx -= dx * w.mapScale; w.mapCz -= dy * w.mapScale; d.x = e.clientX; d.y = e.clientY; };
    const up = (e: PointerEvent) => {
      if (d && d.moved < 6) { const r = cv.getBoundingClientRect(); const p = w.mapToWorld(e.clientX - r.left, e.clientY - r.top); w.setWaypoint(p.x, p.z); }
      d = null;
    };
    const wheel = (e: WheelEvent) => { e.preventDefault(); w.mapScale = Math.max(0.8, Math.min(16, w.mapScale * (e.deltaY > 0 ? 1.15 : 1 / 1.15))); };
    cv.addEventListener('pointerdown', down); cv.addEventListener('pointermove', move); cv.addEventListener('pointerup', up); cv.addEventListener('wheel', wheel, { passive: false });
    return () => { cv.removeEventListener('pointerdown', down); cv.removeEventListener('pointermove', move); cv.removeEventListener('pointerup', up); cv.removeEventListener('wheel', wheel); };
  }, [hud?.mapOpen]);

  const w = worldRef.current;
  const resume = () => { if (w) { w.paused = false; setPaused(false); } };

  // ---------------------------------------------------------------- touch controls
  const stickRef = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const stick = {
    down: (e: React.PointerEvent) => { (e.target as HTMLElement).setPointerCapture(e.pointerId); stick.move(e); },
    move: (e: React.PointerEvent) => {
      if (!w || !stickRef.current || e.buttons === 0 && e.pointerType !== 'touch') return;
      const r = stickRef.current.getBoundingClientRect();
      let x = (e.clientX - (r.left + r.width / 2)) / (r.width / 2), y = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
      const m = Math.hypot(x, y); if (m > 1) { x /= m; y /= m; }
      setKnob({ x, y });
      w.touch.x = x; w.touch.active = true;
      if (w.p.car) { w.touch.y = 0; } else w.touch.y = y;
    },
    up: () => { setKnob({ x: 0, y: 0 }); if (w) { w.touch.x = 0; w.touch.y = 0; w.touch.active = false; } },
  };
  const hold = (k: 'gas' | 'brake' | 'space' | 'shift') => ({
    onPointerDown: (e: React.PointerEvent) => { e.preventDefault(); w?.sound.start(); if (!w) return; if (k === 'gas' || k === 'brake') w.touch[k] = 1; else w.keys.add(k); },
    onPointerUp: () => { if (!w) return; if (k === 'gas' || k === 'brake') w.touch[k] = 0; else w.keys.delete(k); },
    onPointerLeave: () => { if (!w) return; if (k === 'gas' || k === 'brake') w.touch[k] = 0; else w.keys.delete(k); },
  });

  const h = hud;
  return (
    <div className="p4">
      <canvas ref={cvRef} className="p4-canvas" />

      {phase === 'title' && (
        <div className="p4-title">
          <div className="p4-title-in">
            <p className="p4-kicker">An open-world game in the real city</p>
            <h1>PUNE <span>411</span></h1>
            <p className="p4-mr">पुणे तिथे काय उणे</p>
            <p className="p4-lede">Ten kilometres of real Pune — the peths, Deccan, Shivajinagar, Camp, Koregaon Park, Yerawada — built from map data, street by street and building by building. Ride a scooter down Laxmi Road, take an auto round Swargate, lose the police on the Mula-Mutha bridges, and find all twenty Puneri patya.</p>
            <div className="p4-row">
              {save ? (<><button className="p4-btn p4-primary" onClick={() => start(false)}>Continue</button><button className="p4-btn" onClick={() => start(true)}>New game</button></>) : <button className="p4-btn p4-primary" onClick={() => start(true)}>Play</button>}
              <button className="p4-btn" onClick={() => setHelp(true)}>Controls</button>
              <button className="p4-btn p4-ghost" onClick={() => setQuality(quality === 'high' ? 'low' : 'high')}>Quality: {quality}</button>
              <button className="p4-btn p4-ghost" onClick={onExit}>Back</button>
            </div>
            <p className="p4-fine">Map data © OpenStreetMap contributors, via Overture Maps Foundation · elevation: Terrarium tiles (SRTM). Landmarks modelled by hand; people and stories are made up.</p>
          </div>
        </div>
      )}

      {phase === 'loading' && (
        <div className="p4-title">
          <div className="p4-title-in p4-load">
            <h1>PUNE <span>411</span></h1>
            <div className="p4-bar"><i style={{ width: `${Math.round(prog.f * 100)}%` }} /></div>
            <p className="p4-fine">{prog.label}…</p>
            <p className="p4-tip">Tip: the old city's lanes are one-way. The traffic knows. Now you do too.</p>
          </div>
        </div>
      )}

      {phase === 'error' && (
        <div className="p4-title"><div className="p4-title-in"><h1>Arre.</h1><p className="p4-lede">Something went wrong loading the city: {err}</p><button className="p4-btn" onClick={onExit}>Back</button></div></div>
      )}

      {phase === 'play' && h && (
        <>
          <div className="p4-tr">
            <div className="p4-money">{fmtMoney(h.money)}</div>
            <Stars n={h.stars} blink={h.searching} />
            <div className="p4-clock">{h.clock}{h.rain ? ' · rain' : ''}</div>
          </div>
          <div className="p4-bl">
            <canvas ref={miniRef} className="p4-mini" />
            <div className="p4-health"><i style={{ width: `${h.health}%` }} /></div>
            <div className="p4-area"><b>{h.area}</b>{h.road ? <span>{h.road}</span> : null}</div>
          </div>
          {!h.onFoot && (
            <div className="p4-br">
              <div className="p4-speed"><b>{h.speed}</b><span>km/h</span></div>
              <div className="p4-veh">{h.vehicle} <span>{h.vehicleMr}</span></div>
              <button className="p4-radio" onClick={() => w?.nextStation()}>{h.radio}</button>
            </div>
          )}
          {h.objective && <div className="p4-obj">{h.mission && <small>{h.mission}</small>}{h.objective}{h.timer !== null && <b className={h.timer < 15 ? 'hurry' : ''}>{Math.floor(h.timer / 60)}:{String(Math.floor(h.timer % 60)).padStart(2, '0')}</b>}</div>}
          {h.subtitle && (
            <div className="p4-sub">
              {h.subtitle.mr && <div className="p4-sub-mr">{h.subtitle.mr}</div>}
              <div>{h.subtitle.who && <b>{h.subtitle.who}: </b>}{h.subtitle.text}</div>
            </div>
          )}
          {h.prompt && <div className="p4-prompt">{h.prompt}</div>}
          {h.toast && <div className="p4-toast">{h.toast}</div>}
          {h.missionCard && (
            <div className={'p4-card ' + (h.missionCard.ok ? 'ok' : 'bad')}>
              <small>{h.missionCard.ok ? 'mission passed · मिशन पूर्ण' : 'mission failed'}</small>
              <b>{h.missionCard.title}</b>
              <span>{h.missionCard.text}</span>
            </div>
          )}
          {h.busted && <div className={'p4-busted ' + (h.busted === 'WASTED' ? 'wasted' : '')}>{h.busted}</div>}
          <div className="p4-tl">
            <button className="p4-mini-btn" onClick={() => { if (w) { w.paused = true; setPaused(true); } }} aria-label="Pause">❚❚</button>
            <button className="p4-mini-btn" onClick={() => w?.toggleMap()}>Map</button>
            <span className="p4-patya" title="Puneri patya found">सूचना {h.patya}/20</span>
          </div>

          {coarse && !h.mapOpen && (
            <div className="p4-touch">
              <div className="p4-stick" ref={stickRef} onPointerDown={stick.down} onPointerMove={stick.move} onPointerUp={stick.up} onPointerCancel={stick.up}>
                <i style={{ transform: `translate(${knob.x * 34}px, ${knob.y * 34}px)` }} />
              </div>
              <div className="p4-btns">
                {h.onFoot ? (
                  <>
                    <button {...hold('shift')}>Run</button>
                    <button {...hold('space')}>Jump</button>
                  </>
                ) : (
                  <>
                    <button className="gas" {...hold('gas')}>Gas</button>
                    <button className="brk" {...hold('brake')}>Brake</button>
                    <button {...hold('space')}>Drift</button>
                    <button onPointerDown={() => w?.horn()}>Horn</button>
                  </>
                )}
                <button className="act" onPointerDown={() => w?.toggleCar()}>{h.onFoot ? 'Get in' : 'Get off'}</button>
                <button onPointerDown={() => w?.interact()}>E</button>
              </div>
            </div>
          )}

          {h.mapOpen && (
            <div className="p4-map">
              <canvas ref={bigRef} />
              <div className="p4-map-bar">
                <b>Pune</b><span>Drag to move · scroll to zoom · tap to set a waypoint</span>
                <button className="p4-btn" onClick={() => w?.clearWaypoint()}>Clear waypoint</button>
                <button className="p4-btn p4-primary" onClick={() => w?.toggleMap()}>Close (M)</button>
              </div>
              <div className="p4-legend"><i className="m" />Mission <i className="f" />Vada pav <i className="g" />Garage <i className="s" />Helmet shop <i className="p" />Police</div>
            </div>
          )}

          {paused && (
            <div className="p4-pause">
              <div className="p4-pause-in">
                <h2>Paused <span>थांबा</span></h2>
                <div className="p4-col">
                  <button className="p4-btn p4-primary" onClick={resume}>Resume</button>
                  <button className="p4-btn" onClick={() => { resume(); w?.toggleMap(); }}>Map</button>
                  <button className="p4-btn" onClick={() => w?.toggleRain()}>{h.rain ? 'Stop the rain' : 'Monsoon rain'}</button>
                  <button className="p4-btn" onClick={() => { if (w) w.hour = (w.hour + 3) % 24; }}>Skip 3 hours</button>
                  <button className="p4-btn" onClick={() => w?.nextStation()}>Radio: {h.radio}</button>
                  <button className="p4-btn" onClick={() => w?.missions.abort()} disabled={!h.mission}>Abandon mission</button>
                  <button className="p4-btn" onClick={() => setHelp(true)}>Controls</button>
                  <button className="p4-btn p4-ghost" onClick={() => { w?.saveGame(); onExit(); }}>Save and quit</button>
                </div>
                <div className="p4-list">
                  <h3>Missions</h3>
                  {MISSIONS.map((m) => (
                    <div key={m.id} className={'p4-m' + (w?.missions.done.has(m.id) ? ' done' : '')}>
                      <b>{m.title}</b> <span className="mr">{m.mr}</span>
                      <small>{m.giver} · {m.where}{m.night ? ' · after dark' : ''}{m.needs ? ` · after ${m.needs} missions` : ''}</small>
                    </div>
                  ))}
                  <p className="p4-fine">Yellow “!” on the map: walk or drive into it and press E. Puneri patya found: {h.patya}/20. FPS {h.fps}.</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {help && (
        <div className="p4-pause" onClick={() => setHelp(false)}>
          <div className="p4-pause-in p4-help" onClick={(e) => e.stopPropagation()}>
            <h2>Controls</h2>
            <table><tbody>
              <tr><td>W A S D / arrows</td><td>Walk · drive and steer</td></tr>
              <tr><td>Shift</td><td>Sprint</td></tr>
              <tr><td>Space</td><td>Jump · handbrake drift</td></tr>
              <tr><td>F / Enter</td><td>Get on or off a vehicle (taking an occupied one is a crime)</td></tr>
              <tr><td>E</td><td>Start a mission · buy</td></tr>
              <tr><td>H</td><td>Horn (you will use it a lot)</td></tr>
              <tr><td>R</td><td>Next radio station</td></tr>
              <tr><td>M</td><td>Map — tap to set a waypoint</td></tr>
              <tr><td>C</td><td>Camera distance</td></tr>
              <tr><td>T</td><td>Monsoon rain on/off</td></tr>
              <tr><td>Drag</td><td>Look around</td></tr>
              <tr><td>Esc / P</td><td>Pause</td></tr>
            </tbody></table>
            <p className="p4-fine">Pune keeps left. Wear a helmet on two-wheelers — the traffic mama at the big chowks will fine you ₹500. Vada pav carts heal you. Garages repair and repaint (and make the police forget your face) for ₹300. Shops close from 1 to 4.</p>
            <button className="p4-btn p4-primary" onClick={() => setHelp(false)}>Got it</button>
          </div>
        </div>
      )}
    </div>
  );
}
