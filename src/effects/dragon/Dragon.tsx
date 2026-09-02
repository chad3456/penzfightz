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
 */

const DEFAULTS: SceneSettings = {
  vorticity: 26,
  fade: 0.978,
  glow: 0.42,
  phoenixes: 2,
  weight: 1,
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
    <label className="bench__knob">
      <span className="bench__knobname">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <span className="bench__knobval">
        {step >= 1 ? Math.round(value) : value.toFixed(step < 0.01 ? 3 : 2)}
        {unit ?? ''}
      </span>
    </label>
  );
}

export function Dragon({ onExit }: { onExit: () => void }) {
  const [settings, setSettings] = useState(DEFAULTS);
  const stage = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  // The one object both worlds share.
  const handle = useRef<SceneHandle>({
    settings: DEFAULTS,
    pointer: { x: 0.5, y: 0.5, on: false, px: 0.5, py: 0.5 },
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
    mount.className = 'dragon__canvas';
    host.appendChild(mount);
    const s = new p5(makeSketch(size.w, size.h, handle.current), mount);
    return () => {
      s.remove();
      mount.remove();
    };
  }, [size]);

  // ------------------------------------------------------------ the pointer
  const track = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const el = stage.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const p = handle.current.pointer;
    p.x = (e.clientX - r.left) / r.width;
    p.y = (e.clientY - r.top) / r.height;
    if (!p.on) {
      p.px = p.x;
      p.py = p.y;
      p.on = true;
    }
  }, []);

  const release = useCallback(() => {
    handle.current.pointer.on = false;
  }, []);

  return (
    <div className="bench">
      <div className="bench__bar">
        <div>
          <div className="bench__eyebrow">p5 · one fluid solver · nothing is a sprite</div>
          <h1 className="bench__title">Ink and Water</h1>
        </div>
        <div className="bench__actions">
          <button
            className="stage__spec"
            onClick={() => {
              sfx.paper();
              handle.current.reset = true;
              setSettings(DEFAULTS);
            }}
          >
            Clear the water
          </button>
          <button className="stage__back" onClick={onExit}>
            ← Shelf
          </button>
        </div>
      </div>

      <p className="bench__lede">
        The dragon is not drawn on top of the water — it is drawn <em>into</em> it. Every frame it
        prints itself into the same dye texture the solver advects, and shoves the velocity field
        sideways as it swims, so a fold of its own wake will find the tail a second later and take
        it apart. The solver is the real one: advect, add vorticity back where the grid ate it,
        measure divergence, and run eighteen Jacobi passes to find the pressure that removes it.
        That last step is the whole thing. Without pressure the ink just spreads, and spreading is
        what smoke does; with it the water has to get out of the way, which is what makes a stroke
        curl instead of blur. Draw through it with the pointer.
      </p>

      <div
        className="bench__stage dragon__stage"
        ref={stage}
        onPointerMove={track}
        onPointerDown={(e) => {
          track(e);
          sfx.tick();
        }}
        onPointerLeave={release}
        onPointerUp={release}
      />

      <div className="bench__desk">
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
          min={0.97}
          max={1}
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
        <div className="bench__note">
          vorticity confinement puts back the small curl that a grid this coarse loses every step —
          at zero the wake goes soft and syrupy, at sixty it boils. ink life is how much dye
          survives a frame: 0.970 and the creatures leave no trail at all, 1.000 and nothing ever
          leaves, so the frame silts up. ink load is how much pigment is on the brush.
        </div>
      </div>
    </div>
  );
}
