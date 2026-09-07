import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { Table, type Handle } from './Table';
import { FLAVOURS } from './flavours';
import { sfx } from '../../lib/audio';

/**
 * Wobble.
 *
 * Five jelly dice on a dished table. The material is the point: a transmissive
 * body deep enough to carry its colour by absorption, pips sunk just under the
 * surface so the far ones show through the near ones, and a piece of fruit set
 * in the middle like a sweet.
 *
 * The other half is that jelly does not land like a bone die. Every impact
 * flattens it along the direction it was travelling and a soft damped spring
 * lets it back out over about a second, and you can poke one, or take hold of
 * one and pull it until it stretches.
 */

const MAX_DICE = 6;

export function Wobble({ onExit }: { onExit: () => void }) {
  const [count, setCount] = useState(5);
  const [flavourId, setFlavourId] = useState(FLAVOURS[0].id);
  const [values, setValues] = useState<number[] | null>(null);
  const [rolling, setRolling] = useState(false);

  const flavour = useMemo(() => FLAVOURS.find((f) => f.id === flavourId) ?? FLAVOURS[0], [flavourId]);
  const handle = useRef<Handle>({ roll: () => {} });

  const roll = useCallback(() => {
    sfx.tick();
    handle.current.roll();
  }, []);

  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        roll();
      }
      if (e.key === 'Escape') onExit();
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, [roll, onExit]);

  const onRolling = useCallback(() => {
    setRolling(true);
    setValues(null);
  }, []);

  const onSettled = useCallback((v: number[]) => {
    setRolling(false);
    setValues(v);
    sfx.paper();
  }, []);

  // Landings are frequent and the loud ones are rare; a threshold keeps the
  // table from sounding like a drum kit.
  const lastClack = useRef(0);
  const onClack = useCallback((force: number) => {
    const now = performance.now();
    if (force < 2.4 || now - lastClack.current < 90) return;
    lastClack.current = now;
    sfx.tick();
  }, []);

  const total = values?.reduce((a, b) => a + b, 0) ?? null;

  return (
    <div className="wobble">
      <div className="wobble__stage">
        <Canvas
          shadows
          dpr={[1, 1.75]}
          camera={{ position: [0, 7.4, 7.2], fov: 30, near: 0.5, far: 60 }}
          gl={{ antialias: true, alpha: false }}
          onCreated={({ gl }) => {
            // ACES is a film curve and it desaturates as it rolls off, which
            // turns a vivid pink jelly into a salmon one. Khronos PBR Neutral
            // is built for exactly this — a lit object against a pale ground,
            // where the colour is meant to survive.
            gl.toneMapping = THREE.NeutralToneMapping;
            gl.toneMappingExposure = 1.0;
            gl.shadowMap.type = THREE.PCFSoftShadowMap;
          }}
        >
          <Physics gravity={[0, -18, 0]} timeStep={1 / 120} interpolate>
            <Table
              count={count}
              flavour={flavour}
              handle={handle}
              onRolling={onRolling}
              onSettled={onSettled}
              onClack={onClack}
            />
          </Physics>
        </Canvas>
      </div>

      <div className="wobble__title glass">
        <div className="wobble__eyebrow">six flavours · one loaded spring</div>
        <h1>Wobble</h1>
      </div>

      <div className="wobble__exit">
        <button className="glass glass--btn" onClick={onExit}>
          ← Shelf
        </button>
      </div>

      <div className="wobble__flavours glass">
        <div className="wobble__flavourname">{flavour.name}</div>
        <div className="wobble__swatches">
          {FLAVOURS.map((f) => (
            <button
              key={f.id}
              className={`wobble__swatch${f.id === flavourId ? ' is-on' : ''}`}
              style={{ ['--sw' as string]: f.swatch }}
              aria-label={f.name}
              aria-pressed={f.id === flavourId}
              onClick={() => {
                sfx.tick();
                setFlavourId(f.id);
              }}
            />
          ))}
        </div>
      </div>

      <div className="wobble__controls">
        <div className="wobble__count glass">
          {Array.from({ length: MAX_DICE }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              className={`wobble__num${n === count ? ' is-on' : ''}`}
              aria-pressed={n === count}
              onClick={() => {
                sfx.tick();
                setCount(n);
                setValues(null);
              }}
            >
              {n}
            </button>
          ))}
        </div>
        <button className="wobble__roll" onClick={roll}>
          <span className="wobble__rollpip" aria-hidden="true" />
          Roll the dice
          <span className="wobble__rollarrow" aria-hidden="true">
            ↗
          </span>
        </button>
        <div className="wobble__hint">Tap a die to poke it, or drag to pull it. Space rolls.</div>
      </div>

      <div className="wobble__score glass">
        <div className="wobble__scorelabel">{rolling ? 'A little suspense…' : values ? 'On the table' : 'Nothing yet'}</div>
        <div className="wobble__cells">
          {Array.from({ length: count }, (_, i) => (
            <span key={i} className={`wobble__cell${values ? ' is-read' : ''}`}>
              {values ? values[i] : '·'}
            </span>
          ))}
          <span className="wobble__eq">=</span>
          <span className={`wobble__total${values ? ' is-read' : ''}`}>{total ?? '···'}</span>
        </div>
      </div>
    </div>
  );
}
