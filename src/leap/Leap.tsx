import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { bakeClip, exportableCopy, type PoseName } from './hanuman';
import { CAPTIONS, END, FINALE, MARKS, PLACES, RING, type Caption } from './story';
import { G, resetGame, rigRef, World, type CamMode } from './World';

/**
 * THE LEAP TO LANKA.
 *
 * An interactive 3D flight across the ocean as Hanuman, from Mount Mahendra
 * to the Ashoka grove: watch it as a film, or fly it yourself, growing and
 * shrinking to get past Surasa and Simhika. The model is original and drawn
 * in two-tone print shading; it exports as a rigged, animated .glb for
 * Unity or Blender.
 */

class Wind {
  ctx: AudioContext | null = null; gain: GainNode | null = null; filt: BiquadFilterNode | null = null; on = false;
  start() {
    if (this.ctx) { void this.ctx.resume(); return; }
    const C = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!C) return;
    const c = new C(), len = c.sampleRate * 2, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    let b = 0;
    for (let i = 0; i < len; i++) { b = 0.97 * b + 0.03 * (Math.random() * 2 - 1); d[i] = b * 3; }
    const s = c.createBufferSource(); s.buffer = buf; s.loop = true;
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 500; f.Q.value = 0.7;
    const g = c.createGain(); g.gain.value = 0;
    s.connect(f).connect(g).connect(c.destination); s.start();
    // a low drone under the wind
    [110, 164.8, 220].forEach((fr, i) => { const o = c.createOscillator(), og = c.createGain(); o.frequency.value = fr; o.type = 'sine'; og.gain.value = 0.012 / (i + 1); o.connect(og).connect(c.destination); o.start(); });
    this.ctx = c; this.gain = g; this.filt = f;
  }
  set(speed: number) {
    if (!this.ctx || !this.gain || !this.filt) return;
    const t = this.ctx.currentTime, v = this.on ? Math.min(0.5, speed / 220) : 0;
    this.gain.gain.setTargetAtTime(v, t, 0.3);
    this.filt.frequency.setTargetAtTime(300 + speed * 6, t, 0.3);
  }
  mute(m: boolean) { this.on = !m; if (this.ctx) { if (m) void this.ctx.suspend(); else void this.ctx.resume(); } }
}

export function Leap({ onExit }: { onExit: () => void }) {
  const [phase, setPhase] = useState<'start' | 'play' | 'finale' | 'inspect'>('start');
  const [ipose, setIpose] = useState<PoseName>('stand');
  const [hud, setHud] = useState({ d: 0, size: 3, speed: 0, mode: G.mode as string });
  const [cap, setCap] = useState<Caption | null>(null);
  const [toast, setToast] = useState('');
  const [cam, setCam] = useState<CamMode>('cine');
  const [muted, setMuted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [ring, setRing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const wind = useRef(new Wind());
  const lastCap = useRef(-2);

  useEffect(() => {
    const ls = ['/fonts-sacred/fonts.css', '/fonts-guitar/fonts.css'].map((href) => { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; document.head.appendChild(l); return l; });
    return () => ls.forEach((l) => l.remove());
  }, []);

  // HUD + captions at 10 Hz
  useEffect(() => {
    const id = setInterval(() => {
      setHud({ d: G.d, size: G.size, speed: G.speed, mode: G.mode });
      wind.current.set(G.mode === 'finale' || G.paused ? 0 : G.speed + G.boost * 60);
      const c = [...CAPTIONS].reverse().find((x) => G.d >= x.d);
      const idx = c ? CAPTIONS.indexOf(c) : -1;
      if (idx !== lastCap.current && G.mode !== 'finale') { lastCap.current = idx; setCap(c ?? null); }
    }, 100);
    return () => clearInterval(id);
  }, []);

  const flash = useCallback((t: string) => { setToast(t); window.setTimeout(() => setToast((x) => (x === t ? '' : x)), 4200); }, []);
  const onEvent = useCallback((e: string) => {
    if (e === 'finale') { setPhase('finale'); setCap(FINALE); }
    if (e === 'mainaka') flash('Mainaka rises to give you rest. You touch it and fly on.');
    if (e === 'surasaWin') flash('Tiny as a thumb, you dart through Surasa\'s mouth. She blesses you.');
    if (e === 'surasaBig') flash('Surasa simply opens wider. Shrink (Q) next time to slip through.');
    if (e === 'surasaMiss') flash('You went round Surasa. In the story, Hanuman flew straight through her mouth.');
    if (e === 'simhika') flash('Simhika has caught your shadow! Shrink (Q) and boost (Space) to tear free.');
    if (e === 'simhikaFreed') flash('You tear free of Simhika.');
    if (e === 'landing') flash('Lanka. The flight lands you in the Ashoka grove.');
  }, [flash]);

  const start = (mode: 'story' | 'free') => {
    resetGame('intro');
    if (mode === 'free') G.events.add('free');
    G.cam = mode === 'free' ? 'chase' : 'cine';
    setCam(G.cam); setPhase('play'); setRing(false); setPaused(false); lastCap.current = -2; setCap(CAPTIONS[0]);
    wind.current.start(); wind.current.mute(muted);
  };

  // keyboard
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      G.keys.add(k);
      if (k === 'c') { const order: CamMode[] = ['cine', 'chase', 'orbit']; const n = order[(order.indexOf(G.cam) + 1) % 3]; G.cam = n; setCam(n); }
      if (k === 'p') { G.paused = !G.paused; setPaused(G.paused); }
      if (k === 'f' && G.mode === 'story') { G.mode = 'free'; G.cam = 'chase'; setCam('chase'); flash('You have the controls.'); }
      if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(k)) e.preventDefault();
    };
    const up = (e: KeyboardEvent) => G.keys.delete(e.key.length === 1 ? e.key.toLowerCase() : e.key);
    window.addEventListener('keydown', down); window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); G.keys.clear(); };
  }, [flash]);

  // mouse / touch steering in free flight: position relative to the centre of the screen
  const steer = (e: React.PointerEvent) => {
    if (G.mode !== 'free' || G.cam === 'orbit') return;
    if (e.pointerType === 'mouse' || e.buttons) {
      const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
      G.steer.x = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width - 0.5) * 2.6));
      G.steer.y = Math.max(-1, Math.min(1, -((e.clientY - r.top) / r.height - 0.5) * 2.6));
      if (Math.abs(G.steer.x) < 0.12) G.steer.x = 0;
      if (Math.abs(G.steer.y) < 0.12) G.steer.y = 0;
    }
  };

  const exportGlb = async () => {
    const rig = rigRef.current; if (!rig) return;
    setExporting(true);
    try {
      const { GLTFExporter } = await import('three/examples/jsm/exporters/GLTFExporter.js');
      const copy = exportableCopy(rig);
      const fake = { ...rig, root: copy, j: {} as Record<string, THREE.Object3D>, chains: {} as Record<string, THREE.Object3D[]> };
      copy.traverse((o) => { if (rig.j[o.name]) fake.j[o.name] = o; });
      for (const [k, arr] of Object.entries(rig.chains)) fake.chains[k] = arr.map((n) => copy.getObjectByName(n.name)!);
      const clips = [bakeClip(fake, 'Fly', 'fly', 2), bakeClip(fake, 'FlyBoost', 'fly', 2, 30, 1), bakeClip(fake, 'Idle', 'stand', 4), bakeClip(fake, 'Crouch', 'crouch', 2), bakeClip(fake, 'Leap', 'leap', 1)];
      const glb = await new GLTFExporter().parseAsync(copy, { binary: true, animations: clips }) as ArrayBuffer;
      const url = URL.createObjectURL(new Blob([glb], { type: 'model/gltf-binary' }));
      const a = document.createElement('a'); a.href = url; a.download = 'Hanuman.glb'; a.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 2000);
      (window as unknown as { __lastGlb?: ArrayBuffer }).__lastGlb = glb;
    } finally { setExporting(false); }
  };

  const inspect = (camera?: unknown) => {
    void camera;
    resetGame('inspect'); G.inspectPose = 'stand'; G.paused = false; setIpose('stand'); setPhase('inspect'); setCap(null);
  };
  const yoj = Math.min(100, (hud.d / END) * 100);
  const toggleMute = () => { const m = !muted; setMuted(m); wind.current.mute(m); };

  return (
    <div className="lp-root">
      <div className="lp-stage" onPointerMove={steer} onPointerDown={steer} onPointerUp={(e) => { if (e.pointerType !== 'mouse') G.steer = { x: 0, y: 0 }; }}>
        <Canvas dpr={[1, 1.75]} camera={{ position: [40, 175, 80], fov: 50, near: 0.3, far: 9000 }} gl={{ antialias: true, preserveDrawingBuffer: true }}>
          <World onEvent={onEvent} />
          {cam === 'orbit' && phase !== 'inspect' && <OrbitControls makeDefault target={[G.x, G.y, -G.d]} enablePan={false} minDistance={4} maxDistance={400} />}
          {phase === 'inspect' && <OrbitControls makeDefault target={[0, PLACES.mahendra.h + 2.6, PLACES.mahendra.z]} enablePan={false} minDistance={4} maxDistance={40} maxPolarAngle={Math.PI * 0.62} />}
        </Canvas>
        <div className="lp-grain" />
      </div>

      <header className="lp-top">
        <button className="lp-btn lp-btn--ghost" onClick={onExit}>← Shelf</button>
        <div className="lp-title"><b>The Leap to Lanka</b><span>Hanuman crosses the ocean</span></div>
        {phase !== 'start' && phase !== 'inspect' && (
          <div className="lp-yoj"><span className="lp-yoj-n">{yoj.toFixed(0)}</span><span className="lp-yoj-of">/ 100 yojanas</span></div>
        )}
      </header>

      {phase !== 'start' && phase !== 'inspect' && (
        <div className="lp-track" aria-hidden>
          <div className="lp-track-fill" style={{ width: `${yoj}%` }} />
          {MARKS.map((m) => <span key={m.label} className="lp-track-mark" style={{ left: `${(m.d / END) * 100}%` }}>{m.label}</span>)}
          <span className="lp-track-head" style={{ left: `${yoj}%` }} />
        </div>
      )}

      {phase === 'play' && cap && (
        <div className="lp-cap" key={cap.title}>
          <h2>{cap.title}</h2>
          <p>{cap.body}</p>
        </div>
      )}
      {toast && <div className="lp-toast">{toast}</div>}

      {phase === 'play' && (
        <div className="lp-ctrl">
          <div className="lp-seg">
            {(['cine', 'chase', 'orbit'] as CamMode[]).map((c) => <button key={c} className={cam === c ? 'on' : ''} onClick={() => { G.cam = c; setCam(c); }}>{c === 'cine' ? 'Cinematic' : c === 'chase' ? 'Chase' : 'Orbit'}</button>)}
          </div>
          {hud.mode === 'story' && <button className="lp-btn" onClick={() => { G.mode = 'free'; G.cam = 'chase'; setCam('chase'); flash('You have the controls: steer with the mouse or WASD, Space to boost, Q / E to shrink and grow.'); }}>Take the controls</button>}
          {hud.mode === 'free' && (
            <>
              <button className="lp-btn lp-btn--ghost" onPointerDown={() => { G.grow = -1; }} onPointerUp={() => { G.grow = 0; }} onPointerLeave={() => { G.grow = 0; }}>Shrink</button>
              <button className="lp-btn lp-btn--ghost" onPointerDown={() => { G.grow = 1; }} onPointerUp={() => { G.grow = 0; }} onPointerLeave={() => { G.grow = 0; }}>Grow</button>
              <button className="lp-btn lp-btn--ghost" onPointerDown={() => { G.boost = 1; }} onPointerUp={() => { G.boost = 0; }} onPointerLeave={() => { G.boost = 0; }}>Boost</button>
            </>
          )}
          <button className="lp-btn lp-btn--ghost" onClick={() => { G.paused = !G.paused; setPaused(G.paused); }}>{paused ? '▶' : '❚❚'}</button>
          <button className="lp-btn lp-btn--ghost" onClick={toggleMute} aria-label="Sound">{muted ? '🔈' : '🔊'}</button>
          <span className="lp-stat">size ×{hud.size.toFixed(1)} · {Math.round(hud.speed)} u/s</span>
        </div>
      )}

      {phase === 'start' && (
        <div className="lp-start">
          <p className="lp-kicker">Sundara Kanda · after Valmiki</p>
          <h1>The Leap to Lanka</h1>
          <p className="lp-lede">A hundred yojanas of ocean, a golden mountain rising from the sea, a serpent whose mouth grows as fast as you do, a demon who catches shadows, and at the far shore, in a grove of ashoka trees, Sita.</p>
          <div className="lp-start-btns">
            <button className="lp-btn lp-btn--big" onClick={() => start('story')}>Watch the leap</button>
            <button className="lp-btn lp-btn--big lp-btn--ghost" onClick={() => start('free')}>Fly it yourself</button>
          </div>
          <button className="lp-link" onClick={inspect}>Inspect the 3D model →</button>
          <p className="lp-keys">Mouse or WASD to steer · Space to boost · Q / E shrink and grow · C camera · P pause · drag to look around in Orbit</p>
        </div>
      )}

      {phase === 'inspect' && (
        <div className="lp-ctrl">
          <button className="lp-btn" onClick={() => { setPhase('start'); resetGame('intro'); G.mode = 'intro'; G.paused = true; }}>← Back</button>
          <div className="lp-seg">
            {(['stand', 'fly', 'crouch', 'leap', 'offer'] as PoseName[]).map((p) => <button key={p} className={ipose === p ? 'on' : ''} onClick={() => { G.inspectPose = p; setIpose(p); }}>{p[0].toUpperCase() + p.slice(1)}</button>)}
          </div>
          <div className="lp-seg">
            {(['front', 'side', 'back', 'three'] as const).map((v) => <button key={v} onClick={() => { G.view = v; }}>{v === 'three' ? '¾' : v[0].toUpperCase() + v.slice(1)}</button>)}
          </div>
          <span className="lp-stat">drag to orbit · scroll to zoom</span>
        </div>
      )}

      {phase === 'finale' && (
        <div className="lp-final">
          <h2>{ring ? RING.title : FINALE.title}</h2>
          <p>{ring ? RING.body : FINALE.body}</p>
          <div className="lp-start-btns">
            {!ring && <button className="lp-btn" onClick={() => { G.ring = true; setRing(true); }}>Give Rama's ring</button>}
            <button className="lp-btn lp-btn--ghost" onClick={() => start('story')}>Watch again</button>
            <button className="lp-btn lp-btn--ghost" onClick={() => start('free')}>Fly it yourself</button>
          </div>
        </div>
      )}

      <div className="lp-dl">
        <button className="lp-btn lp-btn--ghost" onClick={exportGlb} disabled={exporting} title="Rigged model with Fly, FlyBoost, Idle, Crouch and Leap clips">{exporting ? 'Exporting…' : 'Download model (.glb)'}</button>
      </div>
      <span className="lp-sr" aria-live="polite">{PLACES && ''}</span>
    </div>
  );
}
