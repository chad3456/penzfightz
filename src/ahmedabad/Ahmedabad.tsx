import { useEffect, useRef, useState } from 'react';
import { PLACES, World } from './city';
import { Garba } from './garba';

/**
 * AHMEDABAD, ON A NAVRATRI NIGHT — the page.
 *
 * The city fills the window. Along the bottom, the places worth going to;
 * the camera flies between them, and if nobody touches anything it tours
 * them on its own. Drag to look round, wheel or pinch to come closer. The
 * music is the garba you would hear from where you are standing: loud in
 * the ring, a murmur from across the river.
 */

export function Ahmedabad({ onExit }: { onExit: () => void }) {
  const host = useRef<HTMLDivElement>(null);
  const world = useRef<World | null>(null);
  const garba = useRef<Garba | null>(null);
  const [place, setPlace] = useState(0);
  const [auto, setAuto] = useState(true);
  const [sound, setSound] = useState(false);
  const [stats, setStats] = useState({ dancers: 0, bulbs: 0, buildings: 0 });
  const [fps, setFps] = useState(0);

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
    // ?q=high or ?q=low overrides the guess, for testing either path on any machine
    const forced = new URLSearchParams(window.location.search).get('q');
    const low = forced ? forced === 'low' : /swiftshader|llvmpipe|software/i.test(name) || window.innerWidth < 700;
    const w = new World(canvas, { quality: low ? 'low' : 'high' });
    world.current = w;
    (window as unknown as { __amdavad?: World }).__amdavad = w;
    setStats({ ...w.count });
    const g = new Garba();
    garba.current = g;
    const t0 = performance.now() / 1000;
    w.beatTime = () => (g.playing ? g.time() : performance.now() / 1000 - t0);

    const fit = () => w.resize(el.clientWidth, el.clientHeight);
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);

    // drag to look round, wheel to come closer, pinch on a phone
    const pts = new Map<number, { x: number; y: number }>();
    let pinch = 0;
    const down = (e: PointerEvent) => {
      canvas.setPointerCapture(e.pointerId);
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      setAuto(false);
      if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = Math.hypot(a!.x - b!.x, a!.y - b!.y); }
    };
    const move = (e: PointerEvent) => {
      const p = pts.get(e.pointerId);
      if (!p) return;
      if (pts.size === 2) {
        p.x = e.clientX;
        p.y = e.clientY;
        const [a, b] = [...pts.values()];
        const d = Math.hypot(a!.x - b!.x, a!.y - b!.y);
        if (pinch) w.zoom(pinch / d);
        pinch = d;
        return;
      }
      w.orbit((e.clientX - p.x) * 0.005, (e.clientY - p.y) * 0.004);
      p.x = e.clientX;
      p.y = e.clientY;
    };
    const up = (e: PointerEvent) => { pts.delete(e.pointerId); if (pts.size < 2) pinch = 0; };
    const wheel = (e: WheelEvent) => { e.preventDefault(); setAuto(false); w.zoom(Math.exp(e.deltaY * 0.0012)); };
    canvas.addEventListener('pointerdown', down);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('wheel', wheel, { passive: false });

    let raf = 0;
    let frames = 0;
    let last = performance.now();
    const loop = () => {
      w.frame();
      if (g.playing) g.level(Math.max(0, Math.min(1, 1 - (w.distanceToGarba() - 20) / 380)));
      frames++;
      const now = performance.now();
      if (now - last > 1000) { setFps(Math.round((frames * 1000) / (now - last))); frames = 0; last = now; }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      void g.stop();
      w.dispose();
    };
  }, []);

  // the tour
  useEffect(() => {
    if (!auto) return;
    const id = window.setInterval(() => setPlace((p) => (p + 1) % PLACES.length), 13000);
    return () => window.clearInterval(id);
  }, [auto]);
  useEffect(() => { world.current?.goTo(PLACES[place]!); }, [place]);

  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onExit();
      if (e.key === 'ArrowRight') { setAuto(false); setPlace((p) => (p + 1) % PLACES.length); }
      if (e.key === 'ArrowLeft') { setAuto(false); setPlace((p) => (p + PLACES.length - 1) % PLACES.length); }
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, [onExit]);

  const toggleSound = async () => {
    const g = garba.current;
    if (!g) return;
    if (sound) { await g.stop(); setSound(false); } else { await g.start(); setSound(true); }
  };

  const here = PLACES[place]!;
  return (
    <div className="amd">
      <div className="amd__view" ref={host} />
      <header className="amd__top">
        <div>
          <p className="amd__kicker">nine nights of garba, from the pols of the walled city to the riverfront</p>
          <h1 className="amd__title">Ahmedabad, on a Navratri night</h1>
        </div>
        <div className="amd__tools">
          <button className={`amd__sound${sound ? ' is-on' : ''}`} onClick={toggleSound}>{sound ? '♪ garba on' : '♪ play the garba'}</button>
          <button className="amd__exit" onClick={onExit}>← back to the shelf</button>
        </div>
      </header>
      <section className="amd__here" key={here.id}>
        <h2>{here.name}</h2>
        <p>{here.note}</p>
      </section>
      <nav className="amd__places">
        {PLACES.map((p, i) => (
          <button key={p.id} className={i === place ? 'is-on' : ''} onClick={() => { setAuto(false); setPlace(i); world.current?.goTo(PLACES[i]!); }}>
            {p.name}
          </button>
        ))}
        <button className={`amd__tour${auto ? ' is-on' : ''}`} onClick={() => setAuto((a) => !a)}>{auto ? 'touring' : 'tour'}</button>
      </nav>
      <p className="amd__stats">
        {stats.dancers.toLocaleString('en-IN')} dancers · {stats.bulbs.toLocaleString('en-IN')} bulbs · {stats.buildings.toLocaleString('en-IN')} buildings · {fps} fps · drag to look, wheel to come closer
      </p>
    </div>
  );
}
