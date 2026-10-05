import { useEffect, useRef, useState, type ReactNode } from 'react';
import { VARIETIES, type Variety } from './koi';
import { PondWorld, type FishInfo, type TimeOfDay, type Tool } from './world';

/**
 * THE KOI POND: a garden pond you can put your hand in. The water is a live
 * ripple simulation that refracts the pebble floor and reflects the garden;
 * the koi are ten real varieties with minds of their own. Touch the water,
 * toss stones, feed them, float leaves, lily pads, paper boats and lanterns,
 * add koi, call up rain or a breeze, and watch it go from day to dusk to night.
 */

const TOOLS: { id: Tool; label: string; hint: string; icon: ReactNode }[] = [
  { id: 'hand', label: 'Touch', hint: 'Drag through the water to make ripples. The koi will come to see. Tap a koi to meet it.', icon: <path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11m0-5.5V4a1.5 1.5 0 0 1 3 0v7m0-5.5a1.5 1.5 0 0 1 3 0V12m0-4.5a1.5 1.5 0 0 1 3 0V15a7 7 0 0 1-7 7h-1a7 7 0 0 1-5.6-2.8L4 16.5a1.6 1.6 0 0 1 2.4-2.1L8 16" /> },
  { id: 'stone', label: 'Stone', hint: 'Tap the water to toss a stone in. Watch the koi scatter.', icon: <path d="M5 15c0-4 3-8 8-8 4 0 6 3 6 6s-2 6-7 6c-4 0-7-1-7-4Z" /> },
  { id: 'food', label: 'Feed', hint: 'Tap to scatter a handful of floating food. The koi will rise to it.', icon: <><circle cx="8" cy="9" r="1.6" /><circle cx="13" cy="7" r="1.6" /><circle cx="16" cy="12" r="1.6" /><circle cx="10" cy="14" r="1.6" /><circle cx="14" cy="17" r="1.6" /></> },
  { id: 'leaf', label: 'Leaves', hint: 'Tap to let maple, ginkgo and cherry leaves fall on the water.', icon: <path d="M5 19c0-8 5-14 14-14 0 9-6 14-14 14Zm0 0 8-8" /> },
  { id: 'lily', label: 'Lily pad', hint: 'Tap to float a lily pad. Some of them flower.', icon: <path d="M12 12 19 6.5A8 8 0 1 1 13.5 4.2Z" /> },
  { id: 'boat', label: 'Boat', hint: 'Tap to set a paper boat on the water. The breeze will take it.', icon: <path d="M3 14h18l-3 5H6Zm9-11v11M12 4l6 9h-6" /> },
  { id: 'lantern', label: 'Lantern', hint: 'Tap to float a paper lantern. They glow after dark.', icon: <path d="M7 19h10M8 19V9h8v10M8 9l4-4 4 4M10 12h4" /> },
  { id: 'koi', label: 'Add koi', hint: 'Pick a variety, then tap the water to release a new koi.', icon: <path d="M3 12c3-4 8-5 12-3l3-3v4l3 2-3 2v4l-3-3c-4 2-9 1-12-3Zm11-1h.01" /> },
];

const TIMES: { id: TimeOfDay; label: string }[] = [{ id: 'day', label: 'Day' }, { id: 'dusk', label: 'Dusk' }, { id: 'night', label: 'Night' }];

function Icon({ children }: { children: ReactNode }) {
  return <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>;
}

export function KoiPond({ onExit }: { onExit: () => void }) {
  const cvRef = useRef<HTMLCanvasElement>(null);
  const worldRef = useRef<PondWorld | null>(null);
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState('');
  const [tool, setTool] = useState<Tool>('hand');
  const [rain, setRain] = useState(false);
  const [breeze, setBreeze] = useState(false);
  const [tod, setTod] = useState<TimeOfDay>('day');
  const [sound, setSound] = useState(false);
  const [fish, setFish] = useState<FishInfo | null>(null);
  const [count, setCount] = useState(0);
  const [pick, setPick] = useState<{ variety: Variety | 'random'; butterfly: boolean }>({ variety: 'random', butterfly: false });
  const [quality] = useState<'high' | 'low'>(() => {
    const q = new URLSearchParams(location.search).get('kq');
    if (q === 'low' || q === 'high') return q;
    return window.matchMedia('(max-width: 700px)').matches ? 'low' : 'high';
  });
  const coarse = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;

  useEffect(() => {
    const ls = ['/fonts-guitar/fonts.css'].map((href) => { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; document.head.appendChild(l); return l; });
    return () => ls.forEach((l) => l.remove());
  }, []);

  useEffect(() => {
    const cv = cvRef.current!;
    let raf = 0, alive = true, world: PondWorld | null = null;
    const touches = new Set<number>();
    const ndc = (e: PointerEvent) => { const r = cv.getBoundingClientRect(); return [((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1] as const; };
    const down = (e: PointerEvent) => {
      if (!world) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (e.pointerType === 'touch') { touches.add(e.pointerId); if (touches.size > 1) { world.pointerUp(); return; } }
      const [x, y] = ndc(e);
      world.pointerDown(x, y);
    };
    const move = (e: PointerEvent) => { if (!world || touches.size > 1) return; const [x, y] = ndc(e); world.pointerMove(x, y); };
    const up = (e: PointerEvent) => { touches.delete(e.pointerId); world?.pointerUp(); };
    const start = window.setTimeout(() => {
      const t0 = performance.now();
      try { world = new PondWorld(cv, quality); } catch (e) { setErr(String((e as Error).message || e)); return; }
      console.info('koi: built in', Math.round(performance.now() - t0), 'ms');
      worldRef.current = world;
      world.onFish = setFish;
      world.onCount = () => setCount(world!.koi.length);
      setCount(world.koi.length);
      setTod(world.tod);
      const fit = () => world!.setSize(cv.clientWidth, cv.clientHeight, Math.min(window.devicePixelRatio || 1, quality === 'high' ? 1.5 : 1.25));
      fit();
      window.addEventListener('resize', fit);
      cv.addEventListener('pointerdown', down);
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
      window.addEventListener('pointercancel', up);
      let last = performance.now();
      const loop = (now: number) => {
        if (!alive) return;
        const dt = (now - last) / 1000; last = now;
        world!.update(dt);
        world!.render();
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
      (window as unknown as { __koi?: unknown }).__koi = {
        world,
        stop: () => { alive = false; cancelAnimationFrame(raf); },
        step: (n: number, dt = 1 / 30) => { for (let i = 0; i < n; i++) world!.update(dt); world!.render(); },
      };
      (world as unknown as { _cleanup: () => void })._cleanup = () => window.removeEventListener('resize', fit);
      setReady(true);
    }, 60);
    return () => {
      alive = false; window.clearTimeout(start); cancelAnimationFrame(raf);
      cv.removeEventListener('pointerdown', down);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      const w = worldRef.current as unknown as { _cleanup?: () => void } | null;
      w?._cleanup?.();
      worldRef.current?.dispose(); worldRef.current = null;
    };
  }, [quality]);

  useEffect(() => { if (worldRef.current) worldRef.current.tool = tool; }, [tool, ready]);
  useEffect(() => { if (worldRef.current) worldRef.current.koiPick = pick; }, [pick, ready]);
  useEffect(() => { worldRef.current?.setRain(rain); }, [rain, ready]);
  useEffect(() => { worldRef.current?.setBreeze(breeze); }, [breeze, ready]);

  const w = worldRef.current;
  const hint = TOOLS.find((t) => t.id === tool)!.hint;
  const nav = coarse ? 'Two fingers to turn and zoom' : 'Right-drag to turn · scroll to zoom';
  const toggleSound = () => {
    if (!w) return;
    if (sound) { w.audio.stop(); setSound(false); } else { w.audio.start(); setSound(true); }
  };
  const photo = () => {
    if (!w) return;
    const url = w.snapshot();
    const a = document.createElement('a');
    a.href = url; a.download = `koi-pond-${Date.now()}.png`; a.click();
  };
  const variety = fish ? VARIETIES.find((v) => v.id === fish.variety)! : null;

  return (
    <div className={`kp-root ${tod === 'night' ? 'kp-root--night' : ''}`}>
      <canvas ref={cvRef} className={`kp-canvas kp-canvas--${tool}`} />
      {!ready && !err && <div className="kp-load"><span className="kp-load-ring" />Filling the pond…</div>}
      {err && <div className="kp-load">This device couldn't start the 3D renderer: {err}</div>}
      <header className="kp-top">
        <button className="kp-btn kp-btn--ghost" onClick={onExit}>← Shelf</button>
        <div className="kp-title"><b>The Koi Pond</b><span>{count} koi · {nav}</span></div>
      </header>
      {ready && <div className="kp-hint" key={tool}>{hint}</div>}

      {fish && variety && (
        <aside className="kp-fish" role="dialog" aria-label={`${fish.name}, ${variety.name}`}>
          <button className="kp-x" onClick={() => setFish(null)} aria-label="Close">×</button>
          <div className="kp-fish-sw">{variety.swatch.map((c) => <i key={c} style={{ background: c }} />)}</div>
          <b>{fish.name}</b>
          <span>{variety.name}{fish.butterfly ? ' · butterfly fins' : ''}</span>
          <p>{variety.note[0].toUpperCase() + variety.note.slice(1)}. About {Math.round(fish.length * 100)} cm long.</p>
          <button className="kp-btn kp-btn--small" onClick={() => { w?.releaseKoi(fish.id); setFish(null); }}>Release into the stream</button>
        </aside>
      )}

      {tool === 'koi' && ready && (
        <div className="kp-tray" role="listbox" aria-label="Koi variety">
          <button className={pick.variety === 'random' ? 'on' : ''} onClick={() => setPick((p) => ({ ...p, variety: 'random' }))}><span className="kp-sw kp-sw--any" />Surprise me</button>
          {VARIETIES.map((v) => (
            <button key={v.id} className={pick.variety === v.id ? 'on' : ''} onClick={() => setPick((p) => ({ ...p, variety: v.id }))} title={v.note}>
              <span className="kp-sw">{v.swatch.map((c) => <i key={c} style={{ background: c }} />)}</span>{v.name}
            </button>
          ))}
          <label className="kp-check"><input type="checkbox" checked={pick.butterfly} onChange={(e) => setPick((p) => ({ ...p, butterfly: e.target.checked }))} />Butterfly fins</label>
        </div>
      )}

      <nav className="kp-bar" aria-label="Pond tools">
        <div className="kp-tools">
          {TOOLS.map((t) => (
            <button key={t.id} className={`kp-tool ${tool === t.id ? 'on' : ''}`} onClick={() => setTool(t.id)} aria-pressed={tool === t.id}>
              <Icon>{t.icon}</Icon><span>{t.label}</span>
            </button>
          ))}
        </div>
        <div className="kp-sep" />
        <div className="kp-tools">
          <button className={`kp-tool ${rain ? 'on' : ''}`} onClick={() => setRain((v) => !v)} aria-pressed={rain}>
            <Icon><path d="M7 15a4 4 0 0 1 .5-8A5.5 5.5 0 0 1 18 8a3.5 3.5 0 0 1 0 7Zm1 3-1 2m5-2-1 2m5-2-1 2" /></Icon><span>Rain</span>
          </button>
          <button className={`kp-tool ${breeze ? 'on' : ''}`} onClick={() => setBreeze((v) => !v)} aria-pressed={breeze}>
            <Icon><path d="M3 9h11a3 3 0 1 0-3-3M3 13h15a3 3 0 1 1-3 3M3 17h7" /></Icon><span>Breeze</span>
          </button>
          <div className="kp-seg" role="radiogroup" aria-label="Time of day">
            {TIMES.map((t) => <button key={t.id} role="radio" aria-checked={tod === t.id} className={tod === t.id ? 'on' : ''} onClick={() => { setTod(t.id); w?.setTime(t.id); }}>{t.label}</button>)}
          </div>
          <button className={`kp-tool ${sound ? 'on' : ''}`} onClick={toggleSound} aria-pressed={sound}>
            <Icon>{sound ? <path d="M4 10v4h4l5 4V6L8 10Zm12-1a4 4 0 0 1 0 6m2.5-8.5a7.5 7.5 0 0 1 0 11" /> : <path d="M4 10v4h4l5 4V6L8 10Zm12 0 4 4m0-4-4 4" />}</Icon><span>Sound</span>
          </button>
          <button className="kp-tool" onClick={photo}><Icon><path d="M4 8h3l2-2h6l2 2h3v11H4Z" /><circle cx="12" cy="13" r="3.5" /></Icon><span>Photo</span></button>
          <button className="kp-tool" onClick={() => w?.clearPond()} title="Clear what you've added, keep the koi and lilies"><Icon><path d="M4 7h16M9 7V4h6v3m-8 0 1 13h8l1-13" /></Icon><span>Tidy</span></button>
          <button className="kp-tool" onClick={() => w?.resetCamera(true)}><Icon><path d="M4 12a8 8 0 1 0 2.3-5.6M4 4v4h4" /></Icon><span>View</span></button>
        </div>
      </nav>
    </div>
  );
}
