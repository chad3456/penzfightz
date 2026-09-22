import { useCallback, useEffect, useRef, useState } from 'react';
import { World } from './world';
import { TERMS } from './plan';
import { sfx } from '../lib/audio';

/**
 * HALLOWDENE — the page.
 *
 * A time track across the bottom and a castle above it. Moving along the track
 * moves you through the building as well as through the year, because each term
 * is a *place* as much as a moment: the crossing is on the water, the hall is
 * inside, the stairs are up the shaft, the last of it is from the top of the
 * clock tower with the whole thing finally small enough to see at once.
 */

export function Castle({ onExit, startTerm = 0 }: { onExit: () => void; startTerm?: number }) {
  const host = useRef<HTMLDivElement>(null);
  const world = useRef<World | null>(null);
  const [term, setTerm] = useState(startTerm);
  const [bricks, setBricks] = useState(0);
  const [fps, setFps] = useState(0);
  const [ready, setReady] = useState(false);
  // The clock does not start if you arrived here asking for a particular
  // place: walking away from what somebody just asked to see is rude.
  const [auto, setAuto] = useState(startTerm === 0);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    el.replaceChildren(canvas);

    // A software rasteriser will not carry a 2048 shadow map and forty
    // thousand shadow-casting instances; ask, rather than assume.
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
    const dbg = gl && (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
    const name = dbg ? String((gl as WebGLRenderingContext).getParameter((dbg as { UNMASKED_RENDERER_WEBGL: number }).UNMASKED_RENDERER_WEBGL)) : '';
    const low = /swiftshader|llvmpipe|software/i.test(name);

    const w = new World(canvas, { quality: low ? 'low' : 'high', term: startTerm });
    world.current = w;
    // Left in deliberately: every camera in TERMS was placed by driving
    // the page and reading `__hallowdene.camera.position` back out, and the
    // next person to move one will want to do the same.
    (window as unknown as { __hallowdene?: World }).__hallowdene = w;
    setBricks(w.bricks);
    setReady(true);

    const fit = () => w.resize(el.clientWidth, el.clientHeight);
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);

    // ── pointer: drag to swing, wheel to move in
    let down = false;
    let lx = 0;
    let ly = 0;
    const onDown = (e: PointerEvent) => { down = true; lx = e.clientX; ly = e.clientY; canvas.setPointerCapture(e.pointerId); };
    const onMove = (e: PointerEvent) => {
      if (!down) return;
      w.drag(e.clientX - lx, e.clientY - ly);
      lx = e.clientX;
      ly = e.clientY;
    };
    const onUp = (e: PointerEvent) => { down = false; canvas.releasePointerCapture(e.pointerId); };
    const onWheel = (e: WheelEvent) => { e.preventDefault(); w.zoom(-e.deltaY); };
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });

    let raf = 0;
    let last = performance.now();
    let acc = 0;
    let frames = 0;
    /*
      Two clocks, not one.

      The clamp is there so a tab that has been in the background for a minute
      does not come back and teleport the snow. But the clamped figure is the
      wrong thing to move the camera with: on a machine rendering at one frame
      a second it advances the crossfade by a twentieth of a second per frame,
      and a four-second flight between two terms takes eighty. The transitions
      get the real elapsed time — clamped much more loosely — and so does the
      frame counter, which was otherwise reporting a confident twenty on a
      page that was visibly managing one.
    */
    const tick = () => {
      const now = performance.now();
      const raw = (now - last) / 1000;
      const dt = Math.min(0.05, raw);
      last = now;
      w.step(dt, Math.min(0.5, raw));
      acc += raw;
      frames++;
      if (acc > 0.75) { setFps(Math.round(frames / acc)); acc = 0; frames = 0; }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('wheel', onWheel);
      w.dispose();
      world.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const go = useCallback((i: number) => {
    const n = Math.max(0, Math.min(TERMS.length - 1, i));
    setTerm(n);
    world.current?.setTerm(n);
    sfx.paper();
  }, []);

  // The track walks itself unless you take hold of it.
  useEffect(() => {
    if (!auto || !ready) return;
    const id = window.setInterval(() => {
      setTerm((t) => {
        const n = (t + 1) % TERMS.length;
        world.current?.setTerm(n);
        return n;
      });
    }, 13000);
    return () => window.clearInterval(id);
  }, [auto, ready]);

  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') { setAuto(false); go(term + 1); }
      if (e.key === 'ArrowLeft') { setAuto(false); go(term - 1); }
      if (e.key === 'Escape') onExit();
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, [go, onExit, term]);

  const here = TERMS[term]!;

  return (
    <div className="cst">
      <div className="cst__view" ref={host} />

      <header className="cst__top">
        <div>
          <p className="cst__kicker">a school for the magically inclined · built in bricks</p>
          <h1 className="cst__title">Hallowdene</h1>
        </div>
        <button className="cst__exit" onClick={onExit}>← back to the shelf</button>
      </header>

      <div className="cst__card">
        <p className="cst__where">{here.name}</p>
        <p className="cst__note">{here.note}</p>
      </div>

      <div className="cst__hud">
        <span>{bricks.toLocaleString()} bricks</span>
        <span>{fps} fps</span>
        <span className="cst__hint">drag to look · wheel to move in · ← → for terms</span>
      </div>

      <div className="cst__track">
        <button
          className={`cst__auto${auto ? ' is-on' : ''}`}
          onClick={() => setAuto((a) => !a)}
          aria-label={auto ? 'stop the clock' : 'start the clock'}
        >
          {auto ? '▮▮' : '▶'}
        </button>
        <ol className="cst__terms">
          {TERMS.map((t, i) => (
            <li key={t.id}>
              <button
                className={`cst__term${i === term ? ' is-on' : ''}${i < term ? ' is-past' : ''}`}
                onClick={() => { setAuto(false); go(i); }}
              >
                <i />
                <span>{t.name.split(' · ')[0]}</span>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
