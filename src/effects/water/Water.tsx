import { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Droplets, type DropletSettings } from './Droplets';
import { Pool, type PoolSettings } from './Pool';
import { sfx } from '../../lib/audio';

/**
 * Surface Tension: a bench, rather than a gallery.
 *
 * The other four effects each make a thousand of something. This one makes two
 * things and lets you take them apart, because that is what the work actually
 * is — a shader is not a picture, it is an argument about how light behaves,
 * and the only way to see the argument is to move the numbers and watch what
 * they do.
 *
 * So every control here is a *term in an equation* rather than a style preset.
 * Film thickness is nanometres and it moves the interference bands. Wave speed
 * is the constant in the wave equation and it has a stability limit. Nothing
 * is labelled "intensity".
 *
 * Two experiments, and they are the two halves of the same subject. Water at a
 * scale where surface tension wins and it pulls itself into beads; and water at
 * a scale where gravity wins and it lies flat and carries waves.
 */

type Which = 'drops' | 'pool';

const DEFAULT_DROPS: DropletSettings = {
  count: 24,
  goo: 1.0,
  film: 320,
  speed: 1,
  bands: 4,
  faces: 4,
  grain: 0.07,
};
const DEFAULT_POOL: PoolSettings = {
  amp: 0.09,
  caustic: 85,
  refract: 0.055,
  rain: true,
  damping: 0.996,
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
        {value >= 100 ? Math.round(value) : value.toFixed(step < 0.01 ? 3 : 2)}
        {unit ?? ''}
      </span>
    </label>
  );
}

export function Water({ onExit }: { onExit: () => void }) {
  const [which, setWhich] = useState<Which>('drops');
  const [drops, setDrops] = useState(DEFAULT_DROPS);
  const [pool, setPool] = useState(DEFAULT_POOL);

  return (
    <div className="bench">
      <div className="bench__bar">
        <div>
          <div className="bench__eyebrow">
            two experiments · every control is a term in the equation
          </div>
          <h1 className="bench__title">Surface Tension</h1>
        </div>
        <div className="bench__actions">
          <button
            className="stage__spec"
            onClick={() => {
              sfx.paper();
              setDrops(DEFAULT_DROPS);
              setPool(DEFAULT_POOL);
            }}
          >
            Reset
          </button>
          <button className="stage__back" onClick={onExit}>
            ← Shelf
          </button>
        </div>
      </div>

      <div className="bench__tabs">
        {(['drops', 'pool'] as Which[]).map((k) => (
          <button
            key={k}
            className={`bench__tab${which === k ? ' bench__tab--on' : ''}`}
            onClick={() => {
              sfx.tick();
              setWhich(k);
            }}
          >
            {k === 'drops' ? 'Iridescent droplets' : 'The pool'}
          </button>
        ))}
      </div>

      <p className="bench__lede">
        {which === 'drops'
          ? 'Nothing here draws a droplet. Every bead adds a field that falls off as one over distance squared, and the droplet is wherever the sum crosses a threshold — so two of them near each other merge, neck and run together with no code aware that it happened. The colour is real thin-film interference: the path difference through the film is worked out and evaluated at 650, 545 and 470 nanometres, and then used to index a painted palette rather than emitted as a spectrum, so the physics still decides which colour a bead is and the answer is always a colour somebody chose. Everything on top of that is illustration — the light is quantised into a handful of steps, the highlight is a dot with an edge, the shadow is offset and flat, and there is grain over the lot. Move the pointer to push them about; hold to gather them.'
          : 'A height field with the wave equation on it, a tiled box, and two draw passes a frame — you cannot refract what you have not drawn yet, so the pool is rendered without its water first and the surface reads that back, bent by its own normal. The bright net on the floor is not a texture: caustics are the reciprocal of how much a beam of sunlight spread out on the way down, which to first order is the Laplacian of the surface. Move over the water to trail ripples, tap for a splash, and drag to move round it.'}
      </p>

      <div className="bench__stage">
        <Canvas
          key={which}
          dpr={[1, 1.6]}
          gl={{ antialias: true, powerPreference: 'high-performance' }}
          camera={
            which === 'pool'
              ? { position: [0, 3.4, 7.6], fov: 44, near: 0.1, far: 120 }
              : { position: [0, 0, 1], fov: 50, near: 0.1, far: 10 }
          }
          orthographic={false}
        >
          {which === 'drops' ? <Droplets settings={drops} /> : <Pool settings={pool} />}
        </Canvas>
      </div>

      <div className="bench__desk">
        {which === 'drops' ? (
          <>
            <Knob
              label="droplets"
              value={drops.count}
              min={2}
              max={40}
              step={1}
              onChange={(v) => setDrops((s) => ({ ...s, count: v }))}
            />
            <Knob
              label="threshold"
              value={drops.goo}
              min={0.4}
              max={2.4}
              step={0.02}
              onChange={(v) => setDrops((s) => ({ ...s, goo: v }))}
            />
            <Knob
              label="film"
              value={drops.film}
              min={120}
              max={1200}
              step={5}
              unit=" nm"
              onChange={(v) => setDrops((s) => ({ ...s, film: v }))}
            />
            <Knob
              label="drift"
              value={drops.speed}
              min={0}
              max={3}
              step={0.05}
              unit="×"
              onChange={(v) => setDrops((s) => ({ ...s, speed: v }))}
            />
            <Knob
              label="shading"
              value={drops.bands}
              min={2}
              max={40}
              step={1}
              unit=" steps"
              onChange={(v) => setDrops((s) => ({ ...s, bands: v }))}
            />
            <Knob
              label="faces"
              value={drops.faces}
              min={0}
              max={8}
              step={1}
              onChange={(v) => setDrops((s) => ({ ...s, faces: v }))}
            />
            <Knob
              label="grain"
              value={drops.grain}
              min={0}
              max={0.2}
              step={0.005}
              onChange={(v) => setDrops((s) => ({ ...s, grain: v }))}
            />
            <div className="bench__note">
              threshold is the level set the surface is drawn at — turn it down and the beads swell
              until the whole field is one sheet. film is the thickness of the interference layer,
              and every band you can count is one wavelength of path difference. shading is the
              number of steps the light is cut into: at forty it is a render, at four it is a
              drawing, and nothing else about the maths changes.
            </div>
          </>
        ) : (
          <>
            <Knob
              label="wave height"
              value={pool.amp}
              min={0}
              max={0.4}
              step={0.005}
              unit=" m"
              onChange={(v) => setPool((s) => ({ ...s, amp: v }))}
            />
            <Knob
              label="caustics"
              value={pool.caustic}
              min={0}
              max={140}
              step={1}
              onChange={(v) => setPool((s) => ({ ...s, caustic: v }))}
            />
            <Knob
              label="refraction"
              value={pool.refract}
              min={0}
              max={0.16}
              step={0.002}
              onChange={(v) => setPool((s) => ({ ...s, refract: v }))}
            />
            <Knob
              label="damping"
              value={pool.damping}
              min={0.97}
              max={1}
              step={0.001}
              onChange={(v) => setPool((s) => ({ ...s, damping: v }))}
            />
            <label className="bench__toggle">
              <input
                type="checkbox"
                checked={pool.rain}
                onChange={(e) => setPool((s) => ({ ...s, rain: e.target.checked }))}
              />
              <span>rain</span>
            </label>
            <div className="bench__note">
              damping is the only thing stopping the pool ringing forever; at 1.000 no energy ever
              leaves and the surface fills up with standing waves. refraction at zero shows you
              where the tiles really are.
            </div>
          </>
        )}
      </div>
    </div>
  );
}
