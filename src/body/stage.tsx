/**
 * The scene context every engine reads: which part is selected, the stage
 * (as a smoothed float for animation), the slider values, and a registry of
 * anchors so the camera can fly to a part and a numbered marker can sit on it.
 */
import { createContext, useContext, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { type Part } from './types';

export interface SceneCtx {
  sel: string | null; setSel: (id: string | null) => void;
  stage: number; stages: number;
  /** smoothed stage, read in useFrame */
  st: { current: number };
  ctl: Record<string, number>;
  parts: Part[]; labels: boolean;
  anchors: Map<string, THREE.Object3D>;
  playing: boolean;
}
export const Ctx = createContext<SceneCtx | null>(null);
export const useScene = () => useContext(Ctx)!;
/** a slider value with a default */
export const useCtl = (id: string, def: number) => { const c = useScene().ctl[id]; return c ?? def; };

/** A named point on the model. If the topic lists a part with this id, a numbered marker appears here; it fades when it turns to the far side. */
export function Anchor({ id, position = [0, 0, 0] as [number, number, number], inner = false }: { id: string; position?: [number, number, number]; inner?: boolean }) {
  const S = useScene();
  const ref = useRef<THREE.Group | null>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const idx = S.parts.findIndex((p) => p.id === id);
  const reg = (g: THREE.Group | null) => { ref.current = g; if (g) S.anchors.set(id, g); };
  const w = useMemo(() => new THREE.Vector3(), []), v = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera }) => {
    const g = ref.current, b = btn.current; if (!g || !b) return;
    g.getWorldPosition(w); let o = 1;
    if (!inner && w.length() > 0.05) { v.copy(camera.position).sub(w).normalize(); const d = v.dot(w.clone().normalize()); o = d < -0.1 ? 0.28 : d < 0.15 ? 0.6 : 1; }
    if (S.sel === id) o = 1;
    b.style.opacity = String(o);
  });
  if (idx < 0) return <group ref={reg} position={position} />;
  const on = S.sel === id;
  return (
    <group ref={reg} position={position}>
      {S.labels && (
        <Html center zIndexRange={[20, 0]} style={{ pointerEvents: 'auto' }}>
          <button ref={btn} className={`ba-pin${on ? ' on' : ''}`} onClick={(e) => { e.stopPropagation(); S.setSel(on ? null : id); }} aria-label={S.parts[idx].label}>
            <span>{idx + 1}</span>{on && <em>{S.parts[idx].label}</em>}
          </button>
        </Html>
      )}
    </group>
  );
}

/** A material that glows when its part is selected (and pulses gently). */
export function useHi(id: string | string[], color: string, o: { rough?: number; metal?: number; clear?: number; opacity?: number; trans?: number; sheen?: number; emissive?: string; ei?: number; side?: THREE.Side; flat?: boolean; vc?: boolean } = {}) {
  const S = useScene();
  const ids = Array.isArray(id) ? id : [id];
  const m = useMemo(() => new THREE.MeshPhysicalMaterial({ color, roughness: o.rough ?? 0.45, metalness: o.metal ?? 0, clearcoat: o.clear ?? 0.35, clearcoatRoughness: 0.3, sheen: o.sheen ?? 0, sheenColor: new THREE.Color(color).offsetHSL(0, -0.1, 0.25), transmission: o.trans ?? 0, thickness: 0.6, transparent: (o.opacity ?? 1) < 1, opacity: o.opacity ?? 1, depthWrite: (o.opacity ?? 1) >= 1, emissive: new THREE.Color(o.emissive ?? color), emissiveIntensity: o.ei ?? 0, side: o.side ?? THREE.FrontSide, flatShading: !!o.flat, vertexColors: !!o.vc }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [color, o.opacity, o.rough, o.metal, o.trans, o.emissive, o.side, o.flat, o.vc]);
  const base = o.ei ?? 0, cur = useRef(base);
  useFrame(({ clock }) => {
    const on = S.sel !== null && ids.includes(S.sel), dim = S.sel !== null && !on;
    const target = on ? 0.55 + 0.25 * Math.sin(clock.elapsedTime * 4) : base;
    cur.current += (target - cur.current) * 0.15; m.emissiveIntensity = cur.current;
    const op = (o.opacity ?? 1) * (dim ? 0.55 : 1);
    if (Math.abs(m.opacity - op) > 0.01) { m.opacity += (op - m.opacity) * 0.15; m.transparent = m.opacity < 0.999; }
  });
  return m;
}

export type { Part };
