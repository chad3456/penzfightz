/**
 * The 3D stage every topic is drawn on: a dark, softly lit studio with
 * reflections from light panels (no image files), bloom on anything that
 * glows, a vignette, and a camera that frames the model on arrival and
 * flies to a part when it is chosen.
 */
import { Suspense, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer, OrbitControls } from '@react-three/drei';
import { Bloom, EffectComposer, ToneMapping, Vignette } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import * as THREE from 'three';
import { Ctx, type SceneCtx } from './stage';

function Backdrop({ bg }: { bg: string }) {
  const { scene } = useThree();
  useEffect(() => {
    const c = document.createElement('canvas'); c.width = 512; c.height = 512;
    const g = c.getContext('2d')!; const base = new THREE.Color(bg);
    const hi = base.clone().offsetHSL(0, 0.02, 0.07), lo = base.clone().offsetHSL(0, -0.05, -0.06);
    const grd = g.createRadialGradient(256, 210, 10, 256, 256, 400);
    grd.addColorStop(0, '#' + hi.getHexString()); grd.addColorStop(0.55, '#' + base.getHexString()); grd.addColorStop(1, '#' + lo.getHexString());
    g.fillStyle = grd; g.fillRect(0, 0, 512, 512);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; scene.background = t;
    return () => { t.dispose(); };
  }, [bg, scene]);
  return null;
}

type OC = { target: THREE.Vector3; update: () => void; addEventListener: (e: string, f: () => void) => void; removeEventListener: (e: string, f: () => void) => void; autoRotate: boolean };

/** Frames the model when it arrives and flies to the chosen part. */
function Rig({ model, view, sel, anchors, spin, reset }: { model: React.RefObject<THREE.Group | null>; view: [number, number, number]; sel: string | null; anchors: Map<string, THREE.Object3D>; spin: boolean; reset: number }) {
  const { camera, controls, size } = useThree() as unknown as { camera: THREE.PerspectiveCamera; controls: OC | null; size: { width: number; height: number } };
  const home = useRef<{ pos: THREE.Vector3; tgt: THREE.Vector3; r: number } | null>(null);
  const goal = useRef<{ pos: THREE.Vector3; tgt: THREE.Vector3 } | null>(null);
  const frames = useRef(0);
  useEffect(() => { home.current = null; frames.current = 0; }, [model, view, reset]);
  useEffect(() => {
    if (!controls) return; const stop = () => { goal.current = null; };
    controls.addEventListener('start', stop); return () => controls.removeEventListener('start', stop);
  }, [controls]);
  // fly to the selected part (or back home)
  useEffect(() => {
    if (!home.current) return;
    if (!sel) { goal.current = { pos: home.current.pos.clone(), tgt: home.current.tgt.clone() }; return; }
    const a = anchors.get(sel); if (!a) return;
    const p = a.getWorldPosition(new THREE.Vector3());
    const dir = camera.position.clone().sub(controls?.target ?? new THREE.Vector3()).normalize();
    const d = Math.max(home.current.r * 1.25, camera.position.distanceTo(p) * 0.55);
    goal.current = { pos: p.clone().addScaledVector(dir, d), tgt: p.clone().lerp(home.current.tgt, 0.35) };
  }, [sel, anchors, camera, controls]);
  useFrame((_, dt) => {
    if (!controls) return;
    controls.autoRotate = spin && !sel;
    if (!home.current && model.current && ++frames.current > 2) {
      const box = new THREE.Box3().setFromObject(model.current);
      if (box.isEmpty()) return;
      const s = box.getBoundingSphere(new THREE.Sphere());
      const aspect = size.width / Math.max(1, size.height), fov = (camera.fov * Math.PI) / 180;
      const fit = s.radius / Math.sin(Math.min(fov, 2 * Math.atan(Math.tan(fov / 2) * aspect)) / 2);
      const dir = new THREE.Vector3(...view).normalize();
      home.current = { pos: s.center.clone().addScaledVector(dir, fit * 1.04), tgt: s.center.clone(), r: s.radius };
      camera.near = s.radius / 100; camera.far = s.radius * 60; camera.updateProjectionMatrix();
      camera.position.copy(home.current.pos); controls.target.copy(s.center); controls.update();
      (window as unknown as { ready?: boolean }).ready = true;
    }
    const g = goal.current; if (!g) return;
    const k = 1 - Math.exp(-dt * 3.2);
    camera.position.lerp(g.pos, k); controls.target.lerp(g.tgt, k); controls.update();
    if (camera.position.distanceTo(g.pos) < 0.002 && controls.target.distanceTo(g.tgt) < 0.002) goal.current = null;
  });
  return null;
}

export function Stage3D({ ctx, children, bg = '#0c1626', view = [0.35, 0.22, 1], spin, reset, glow = 0.55 }: { ctx: SceneCtx; children: ReactNode; bg?: string; view?: [number, number, number]; spin: boolean; reset: number; glow?: number }) {
  const model = useRef<THREE.Group>(null);
  const v = useMemo(() => view, [view]);
  return (
    <Canvas dpr={[1, 2]} camera={{ fov: 38, position: [0, 0, 8] }} gl={{ antialias: false, powerPreference: 'high-performance', preserveDrawingBuffer: true }} onPointerMissed={() => ctx.setSel(null)}>
      <Backdrop bg={bg} />
      <hemisphereLight args={['#dfe9ff', '#2a1c1c', 0.55]} />
      <directionalLight position={[4, 6, 5]} intensity={2.1} color="#fff4e6" />
      <directionalLight position={[-6, -2, -4]} intensity={1.1} color="#8fb8ff" />
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={3} position={[0, 4, 3]} scale={[8, 3, 1]} color="#ffffff" />
        <Lightformer form="rect" intensity={1.6} position={[-5, 0, -2]} rotation-y={Math.PI / 2} scale={[6, 4, 1]} color="#9fc4ff" />
        <Lightformer form="rect" intensity={1.4} position={[5, -1, 1]} rotation-y={-Math.PI / 2} scale={[6, 4, 1]} color="#ffd2b0" />
        <Lightformer form="ring" intensity={2} position={[0, -5, 2]} scale={4} color="#ff9d8a" />
      </Environment>
      <Ctx.Provider value={ctx}>
        <Suspense fallback={null}>
          <group ref={model}>{children}</group>
        </Suspense>
      </Ctx.Provider>
      <OrbitControls makeDefault enableDamping dampingFactor={0.08} autoRotateSpeed={0.6} minDistance={0.05} maxDistance={400} />
      <Rig model={model} view={v} sel={ctx.sel} anchors={ctx.anchors} spin={spin} reset={reset} />
      <EffectComposer multisampling={4} enableNormalPass={false}>
        <Bloom mipmapBlur luminanceThreshold={0.82} luminanceSmoothing={0.2} intensity={glow} />
        <Vignette offset={0.3} darkness={0.6} />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>
    </Canvas>
  );
}
