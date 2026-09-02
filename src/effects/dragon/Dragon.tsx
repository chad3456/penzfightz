import { useCallback, useEffect, useRef, useState } from 'react';
import p5 from 'p5';
import { makeSketch, type SceneHandle, type SceneSettings } from './sketch';
import { sfx } from '../../lib/audio';

/**
 * Ink and Water: a dragon and its phoenixes, painted into a fluid.
 *
 * The React side of this is deliberately thin. Everything that matters happens
 * inside one p5 instance — a Navier–Stokes solver running in framebuffers, two
 * creatures that swim through it, and a composite pass that decides what ink on
 * wet silk looks like. React's job is to own the canvas's size, hand the sketch
 * a settings object it can read every frame, and stay out of the way.
 *
 * ### Why the settings live in a ref
 *
 * The sketch reads `handle.settings` sixty times a second. If the settings were
 * props the sketch closed over, every knob would need a remount, and a remount
 * means a new solver, which means the water you were watching is thrown away
 * mid-stroke. Instead there is one mutable handle: React writes into it, p5
 * reads out of it, and only a *resize* is allowed to rebuild anything.
 *
 * ### Why the chrome floats over the water rather than sitting above it
 *
 * The first build put the canvas in a box with a title over it and a row of
 * sliders under it, like the other benches. It was the wrong shape for this
 * one: everything else in the case is a *gallery* of finished things, and this
 * is a body of water you are standing at the edge of. So the canvas is the
 * page, and the controls are glass laid on top of it — dimmed, blurred,
 * dismissible, and never covering the middle where the animals swim.
 */

const DEFAULTS: SceneSettings = {
  vorticity: 26,
  fade: 0.978,
  glow: 0.42,
  phoenixes: 2,
  weight: 1,
  sheen: 0.55,
};

function Knob({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="ink__knob">
      <span className="ink__knobname">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <span className="ink__knobval">
        {step >= 1 ? Math.round(value) : value.toFixed(step < 0.01 ? 3 : 2)}
        {unit ?? ''}
      </span>
    </label>
  );
}

export function Dragon({ onExit }: { onExit: () => void }) {
  const [settings, setSettings] = useState(DEFAULTS);
  const [desk, setDesk] = useState(true);
  const [about, setAbout] = useState(false);
  const stage = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  // The one object both worlds share.
  const handle = useRef<SceneHandle>({
    settings: DEFAULTS,
    pointer: { x: 0.5, y: 0.5, on: false, px: 0.5, py: 0.5, held: 0 },
    bursts: [],
    reset: false,
  });
  handle.current.settings = settings;

  // ------------------------------------------------------------ the canvas
  // Measured, debounced, and rounded to 16px. A drag on the window edge fires
  // hundreds of resize entries; each one would otherwise throw away the solver
  // and start the painting again.
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    let timer = 0;
    const measure = () => {
      const r = el.getBoundingClientRect();
      const w = Math.max(320, Math.round(r.width / 16) * 16);
      const h = Math.max(240, Math.round(r.height / 16) * 16);
      setSize((s) => (s && s.w === w && s.h === h ? s : { w, h }));
    };
    measure();
    const ro = new ResizeObserver(() => {
      window.clearTimeout(timer);
      timer = window.setTimeout(measure, 180);
    });
    ro.observe(el);
    return () => {
      window.clearTimeout(timer);
      ro.disconnect();
    };
  }, []);

  useEffect(() => {
    const host = stage.current;
    if (!host || !size) return;
    // p5 v2 attaches its canvas after `new p5()` returns, so the sketch gets a
    // child of its own to attach into and that child is what gets removed.
    const mount = document.createElement('div');
    mount.className = 'ink__canvas';
    host.appendChild(mount);
    const s = new p5(makeSketch(size.w, size.h, handle.current), mount);
    return () => {
      s.remove();
      mount.remove();
    };
  }, [size]);

  // ------------------------------------------------------------ the pointer
  const at = useCallback((e: { clientX: number; clientY: number }) => {
    const el = stage.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
  }, []);

  const track = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const q = at(e);
      if (!q) return;
      const p = handle.current.pointer;
      p.x = q.x;
      p.y = q.y;
      if (!p.on) {
        p.px = q.x;
        p.py = q.y;
        p.on = true;
      }
    },
    [at],
  );

  // How long the pointer has been down, in seconds, feeding the light under it.
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const p = handle.current.pointer;
      const dt = (now - last) / 1000;
      last = now;
      p.held = p.on && p.held >= 0 ? Math.min(1.6, p.held + dt) : p.held;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const burst = useCallback((x: number, y: number, force: number, ink: boolean) => {
    handle.current.bursts.push({ x, y, force, ink });
  }, []);

  const release = useCallback(() => {
    handle.current.pointer.on = false;
    handle.current.pointer.held = 0;
  }, []);

  // Space drops a stone in the middle; C clears the water. Both are here
  // because the effect is watched more than it is operated, and reaching for
  // the mouse to do one thing to it breaks that.
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.code === 'Space') {
        e.preventDefault();
        burst(0.5, 0.5, 1.6, true);
        sfx.tick();
      }
      if (e.key === 'c' || e.key === 'C') {
        handle.current.reset = true;
        sfx.paper();
      }
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, [burst]);

  return (
    <div className="ink">
      <div
        className="ink__stage"
        ref={stage}
        onPointerMove={track}
        onPointerDown={(e) => {
          track(e);
          const q = at(e);
          if (q) burst(q.x, q.y, e.detail >= 2 ? 2.2 : 1, true);
          sfx.tick();
        }}
        onPointerLeave={release}
        onPointerUp={release}
        onPointerCancel={release}
      />

      <div className="ink__top">
        <div className="glass ink__plate">
          <div className="ink__eyebrow">p5 · one fluid solver · nothing is a sprite</div>
          <h1 className="ink__title">Ink and Water</h1>
        </div>
        <div className="ink__actions">
          <button
            className={`glass glass--btn${about ? ' glass--on' : ''}`}
            onClick={() => {
              sfx.tick();
              // One panel at a time. On a phone they cover each other, and on
              // a desk two of them cover the water, which is the point of the
              // page. Opening one closes the other.
              setAbout((a) => !a);
              setDesk(false);
            }}
          >
            About
          </button>
          <button
            className="glass glass--btn"
            onClick={() => {
              sfx.paper();
              handle.current.reset = true;
              setSettings(DEFAULTS);
            }}
          >
            Clear
          </button>
          <button className="glass glass--btn" onClick={onExit}>
            ← Shelf
          </button>
        </div>
      </div>

      {about && (
        <div className="glass ink__about">
          <p>
            The dragon is not drawn on top of the water — it is drawn <em>into</em> it. Every frame
            it prints itself into the same dye texture the solver advects, and shoves the velocity
            field sideways as it swims, so a fold of its own wake will find the tail a second later
            and take it apart. The solver is the real one: advect, add vorticity back where the grid
            ate it, measure divergence, and run eighteen Jacobi passes to find the pressure that
            removes it. That last step is the whole thing. Without pressure the ink just spreads,
            and spreading is what smoke does; with it the water has to get out of the way, which is
            what makes a stroke curl instead of blur.
          </p>
          <p className="ink__how">
            <strong>Drag</strong> to draw through it · <strong>tap</strong> for a drop ·{' '}
            <strong>double-tap</strong> for a heavy one · <strong>hold</strong> and the animals come
            to your hand · <strong>space</strong> drops one in the middle · <strong>C</strong>{' '}
            clears the water.
          </p>
        </div>
      )}

      <button
        className={`glass glass--btn ink__deskbtn${desk ? ' glass--on' : ''}`}
        onClick={() => {
          sfx.tick();
          setDesk((d) => !d);
          setAbout(false);
        }}
      >
        {desk ? 'Hide controls' : 'Controls'}
      </button>

      {desk && (
        <div className="glass ink__desk">
          <Knob
            label="vorticity"
            value={settings.vorticity}
            min={0}
            max={60}
            step={1}
            onChange={(v) => setSettings((s) => ({ ...s, vorticity: v }))}
          />
          <Knob
            label="ink life"
            value={settings.fade}
            min={0.96}
            max={0.998}
            step={0.001}
            onChange={(v) => setSettings((s) => ({ ...s, fade: v }))}
          />
          <Knob
            label="bloom"
            value={settings.glow}
            min={0}
            max={1.4}
            step={0.02}
            onChange={(v) => setSettings((s) => ({ ...s, glow: v }))}
          />
          <Knob
            label="sheen"
            value={settings.sheen}
            min={0}
            max={1.6}
            step={0.05}
            onChange={(v) => setSettings((s) => ({ ...s, sheen: v }))}
          />
          <Knob
            label="phoenixes"
            value={settings.phoenixes}
            min={0}
            max={3}
            step={1}
            onChange={(v) => setSettings((s) => ({ ...s, phoenixes: v }))}
          />
          <Knob
            label="ink load"
            value={settings.weight}
            min={0.2}
            max={2}
            step={0.05}
            unit="×"
            onChange={(v) => setSettings((s) => ({ ...s, weight: v }))}
          />
          <div className="ink__note">
            vorticity confinement puts back the small curl a grid this coarse loses every step — at
            zero the wake goes soft, at sixty it boils. ink life is how much dye survives a sixtieth
            of a second. sheen is the specular on the film: at zero it is a stain, at one and a half
            it is spilled oil.
          </div>
        </div>
      )}
    </div>
  );
}
