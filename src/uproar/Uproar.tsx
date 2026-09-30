import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject, type ReactNode } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { Scene, type Bridge } from './World';
import { ABILITIES, OBJECTIVES, act, carPos, createSim, crowdSize, hallOpen, stars, type Ability, type Sim } from './sim';
import { BLOCK, COLS, D, DISTRICTS, DISTRICT_BY_ID, ROWS, W, blockCenter, isOpen, isPark, type DistrictId } from './city';
import { Sound } from './audio';

/**
 * UPROAR — a cartoon of people power, in three.js.
 *
 * This file is the game around the scene: the title poster, the keys and
 * taps, the heads-up display, the speech bubbles and labels that float over
 * the city, and the end.
 */

const detectLow = () => {
  const q = new URLSearchParams(window.location.search);
  if (q.has('low')) return true;
  if (q.has('high')) return false;
  return window.matchMedia('(pointer: coarse)').matches || (navigator.hardwareConcurrency || 8) <= 4;
};

const KEYS: Record<string, Ability> = { ' ': 'chant', q: 'party', e: 'mural', r: 'balls', f: 'holi', g: 'umbrella', c: 'pizza' };

/* ───────────── little drawn icons, one per ability ───────────── */
function Icon({ id }: { id: Ability | 'crowd' | 'heat' | 'life' }) {
  const p = { fill: 'none', stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (id) {
    case 'chant': return <svg viewBox="0 0 32 32"><path {...p} d="M5 13v6h5l11 6V7L10 13z" /><path {...p} d="M25 11c2 2 2 8 0 10M28 8c4 4 4 12 0 16" /></svg>;
    case 'party': return <svg viewBox="0 0 32 32"><rect {...p} x="8" y="4" width="16" height="24" rx="3" /><circle {...p} cx="16" cy="19" r="5" /><circle cx="16" cy="10" r="2.2" fill="currentColor" /></svg>;
    case 'mural': return <svg viewBox="0 0 32 32"><path {...p} d="M20 4l8 8-12 12-8-8z" /><path {...p} d="M8 16l-4 12 12-4" /><circle cx="24" cy="26" r="2.5" fill="currentColor" /></svg>;
    case 'balls': return <svg viewBox="0 0 32 32"><circle {...p} cx="16" cy="16" r="12" /><path {...p} d="M16 4c-6 6-6 18 0 24M16 4c6 6 6 18 0 24M4 16h24" /></svg>;
    case 'holi': return <svg viewBox="0 0 32 32"><path {...p} d="M8 22a6 6 0 010-12 8 8 0 0115-2 6 6 0 011 12z" /><path {...p} d="M10 26l2-3M16 28l1-4M22 26l-1-3" /></svg>;
    case 'umbrella': return <svg viewBox="0 0 32 32"><path {...p} d="M4 16a12 12 0 0124 0z" /><path {...p} d="M16 16v9a3 3 0 01-6 0" /></svg>;
    case 'pizza': return <svg viewBox="0 0 32 32"><path {...p} d="M5 8c7-4 15-4 22 0L16 29z" /><circle cx="14" cy="13" r="1.8" fill="currentColor" /><circle cx="19" cy="17" r="1.8" fill="currentColor" /><circle cx="15" cy="21" r="1.5" fill="currentColor" /></svg>;
    case 'crowd': return <svg viewBox="0 0 32 32"><circle {...p} cx="10" cy="11" r="4" /><circle {...p} cx="22" cy="11" r="4" /><path {...p} d="M3 27c0-5 3-8 7-8s7 3 7 8M15 27c0-5 3-8 7-8s7 3 7 8" /></svg>;
    case 'heat': return <svg viewBox="0 0 32 32"><path d="M8 24h16v4H8zM11 24v-8a5 5 0 0110 0v8z" fill="currentColor" /></svg>;
    case 'life': return <svg viewBox="0 0 32 32"><path d="M5 13v6h5l11 6V7L10 13z" fill="currentColor" /></svg>;
  }
}

/* ───────────── what the HUD shows, sampled a few times a second ───────────── */
interface Snap {
  crowd: number; buzz: number; heat: number; stars: number; trending: number; lives: number; step: number; hour: number;
  cool: Record<Ability, number>; districts: { id: DistrictId; occupy: number; captured: boolean }[]; hall: boolean; caught: number; umbrellas: number; cannon: boolean;
}
const snap = (s: Sim): Snap => ({
  crowd: crowdSize(s), buzz: s.buzz, heat: s.heat, stars: stars(s), trending: s.trending, lives: s.leader.lives, step: s.step, hour: s.hour,
  cool: { ...s.cool }, districts: DISTRICTS.map((d) => ({ id: d.id, occupy: s.districts[d.id].occupy, captured: s.districts[d.id].captured })), hall: hallOpen(s), caught: s.leader.caught,
  umbrellas: s.umbrellas, cannon: s.cannon.alive,
});

/** Where the current objective wants you to go, if anywhere. */
function objectiveTarget(s: Sim): DistrictId | null {
  if (s.step === 4) return 'oldtown';
  if (s.step < 6) return null;
  if (hallOpen(s)) return 'hall';
  let best: DistrictId | null = null, bd = 1e9;
  for (const d of DISTRICTS) {
    if (d.id === 'hall' || s.districts[d.id].captured) continue;
    const [x, z] = blockCenter(...d.plaza);
    const dist = Math.hypot(x - s.leader.x, z - s.leader.z) + d.need * 1.5;
    if (dist < bd) { bd = dist; best = d.id; }
  }
  return best;
}

const clock = (h: number) => { const x = ((h % 24) + 24) % 24; return `${String(Math.floor(x)).padStart(2, '0')}:${String(Math.floor((x % 1) * 60 / 15) * 15).padStart(2, '0')}`; };

/* ───────────── the minimap ───────────── */
function drawMap(cv: HTMLCanvasElement, s: Sim, target: DistrictId | null, t: number) {
  const g = cv.getContext('2d'); if (!g) return;
  const k = cv.width / W;
  const X = (x: number) => (x + W / 2) * k, Z = (z: number) => (z + D / 2) * k;
  g.fillStyle = '#2a2342'; g.fillRect(0, 0, cv.width, cv.height);
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const [cx, cz] = blockCenter(c, r);
    const d = DISTRICTS.find((x) => x.plaza[0] === c && x.plaza[1] === r);
    const st = d ? s.districts[d.id] : null;
    g.fillStyle = isPark(c, r) ? '#4e8a4a' : d ? (st!.captured ? '#ff2e88' : d.hue) : '#4a4265';
    g.globalAlpha = d && !st!.captured ? 0.55 + 0.25 * Math.sin(t * 4) * (target === d.id ? 1 : 0) : 1;
    g.fillRect(X(cx - BLOCK / 2), Z(cz - BLOCK / 2), BLOCK * k, BLOCK * k);
    g.globalAlpha = 1;
    if (!isOpen(c, r)) { g.fillStyle = 'rgba(255,255,255,0.06)'; g.fillRect(X(cx - BLOCK / 2) + 2, Z(cz - BLOCK / 2) + 2, BLOCK * k - 4, BLOCK * k - 4); }
  }
  for (const a of s.agents) {
    if (a.gone) continue;
    if (a.role === 'follower') { g.fillStyle = '#e6ff3a'; g.fillRect(X(a.x) - 0.8, Z(a.z) - 0.8, 1.6, 1.6); }
    else if (a.role === 'police') { g.fillStyle = '#35b6ff'; g.fillRect(X(a.x) - 1.2, Z(a.z) - 1.2, 2.4, 2.4); }
  }
  if (s.cannon.alive) { g.fillStyle = '#ffffff'; g.fillRect(X(s.cannon.x) - 2.5, Z(s.cannon.z) - 2.5, 5, 5); }
  const L = s.leader;
  g.strokeStyle = '#fff'; g.lineWidth = 2; g.fillStyle = '#ff2e88';
  g.beginPath(); g.arc(X(L.x), Z(L.z), 3.6 + Math.sin(t * 6), 0, Math.PI * 2); g.fill(); g.stroke();
}

/* ───────────── the game ───────────── */

export function Uproar({ onExit }: { onExit: () => void }) {
  const [phase, setPhase] = useState<'title' | 'play' | 'won' | 'lost'>('title');
  const [paused, setPaused] = useState(false);
  const [low, setLow] = useState(detectLow);
  const [run, setRun] = useState(0);
  const [muted, setMuted] = useState(false);
  const [help, setHelp] = useState(false);
  const [toast, setToast] = useState<{ text: string; kind: string; id: number } | null>(null);
  const [final, setFinal] = useState<Sim['stats'] & { t: number } | null>(null);
  const bridge = useRef<Bridge>({ sim: createSim(), input: { mx: 0, mz: 0 }, zoom: 38, started: false, paused: false, low });
  const sound = useRef<Sound | null>(null);
  if (!sound.current) sound.current = new Sound();
  const overlay = useRef<HTMLDivElement>(null);
  const phaseRef = useRef(phase); phaseRef.current = phase;
  bridge.current.low = low;
  bridge.current.paused = paused || help;

  useEffect(() => {
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = '/fonts-uproar/fonts.css';
    document.head.appendChild(l);
    const snd = sound.current;
    return () => { l.remove(); snd?.stop(); };
  }, []);
  useEffect(() => { sound.current?.setMuted(muted); }, [muted]);
  useEffect(() => { if (import.meta.env.DEV) (window as unknown as Record<string, unknown>).__uproar = { bridge: bridge.current }; }, []);

  const say = useCallback((text: string, kind = 'info') => setToast({ text, kind, id: performance.now() }), []);
  useEffect(() => { if (!toast) return; const h = window.setTimeout(() => setToast(null), toast.kind === 'big' ? 4200 : 3000); return () => window.clearTimeout(h); }, [toast]);

  const fire = useCallback((id: Ability) => {
    const b = bridge.current, s = b.sim;
    if (!b.started || b.paused || s.over) return;
    if (s.cool[id] > 0) { if (id !== 'chant') sound.current?.sfx('no'); return; }
    const msg = act(s, id);
    if (msg) { say(msg, 'warn'); sound.current?.sfx('no'); return; }
    sound.current?.sfx(id === 'chant' ? 'chant' : id);
  }, [say]);

  const start = useCallback(() => {
    const b = bridge.current;
    b.started = true;
    b.sim.hour = 9.5; b.sim.t = 0;
    sound.current?.start();
    setPhase('play');
  }, []);
  const restart = useCallback(() => {
    const b = bridge.current;
    b.sim = createSim(); b.sim.hour = 9.5; b.started = true; b.input.mx = 0; b.input.mz = 0;
    setFinal(null); setPaused(false); setRun((r) => r + 1); setPhase('play');
    sound.current?.start();
  }, []);

  /* the keyboard */
  useEffect(() => {
    const down = new Set<string>();
    const sync = () => {
      const i = bridge.current.input;
      i.mx = (down.has('d') || down.has('arrowright') ? 1 : 0) - (down.has('a') || down.has('arrowleft') ? 1 : 0);
      i.mz = (down.has('s') || down.has('arrowdown') ? 1 : 0) - (down.has('w') || down.has('arrowup') ? 1 : 0);
    };
    const kd = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (phaseRef.current === 'title') { if (k === 'enter' || k === ' ') { e.preventDefault(); start(); } return; }
      if (phaseRef.current !== 'play') return;
      if (k === 'escape' || k === 'p') { setPaused((p) => !p); setHelp(false); return; }
      if (k === 'm') { setMuted((m) => !m); return; }
      if (k === 'h' || k === '?') { setHelp((h) => !h); return; }
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) { e.preventDefault(); down.add(k); sync(); return; }
      if (k === '-' || k === '_') bridge.current.zoom = Math.min(80, bridge.current.zoom + 4);
      if (k === '=' || k === '+') bridge.current.zoom = Math.max(16, bridge.current.zoom - 4);
      const a = KEYS[k];
      if (a) { e.preventDefault(); fire(a); }
    };
    const ku = (e: KeyboardEvent) => { down.delete(e.key.toLowerCase()); sync(); };
    const blur = () => { down.clear(); sync(); };
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku); window.addEventListener('blur', blur);
    return () => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); window.removeEventListener('blur', blur); };
  }, [fire, start]);

  /* the mouse wheel and two fingers zoom */
  const wrap = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = wrap.current; if (!el) return;
    const wheel = (e: WheelEvent) => { e.preventDefault(); bridge.current.zoom = Math.max(16, Math.min(80, bridge.current.zoom + e.deltaY * 0.03)); };
    let pinch = 0, z0 = 0;
    const dist = (e: TouchEvent) => Math.hypot(e.touches[0]!.clientX - e.touches[1]!.clientX, e.touches[0]!.clientY - e.touches[1]!.clientY);
    const ts = (e: TouchEvent) => { if (e.touches.length === 2) { pinch = dist(e); z0 = bridge.current.zoom; } };
    const tm = (e: TouchEvent) => { if (e.touches.length === 2 && pinch) { e.preventDefault(); bridge.current.zoom = Math.max(16, Math.min(80, z0 * (pinch / dist(e)))); } };
    const te = () => { pinch = 0; };
    el.addEventListener('wheel', wheel, { passive: false });
    el.addEventListener('touchstart', ts, { passive: true }); el.addEventListener('touchmove', tm, { passive: false }); el.addEventListener('touchend', te);
    return () => { el.removeEventListener('wheel', wheel); el.removeEventListener('touchstart', ts); el.removeEventListener('touchmove', tm); el.removeEventListener('touchend', te); };
  }, []);

  /* click or tap a street to walk there */
  bridge.current.walkTo = (x, z) => {
    const b = bridge.current;
    if (!b.started || b.paused || b.sim.over) return;
    b.sim.leader.tx = x; b.sim.leader.tz = z;
  };

  /* the floating layer: bubbles, pops, labels, the objective pointer, drawn every frame */
  useEffect(() => {
    const root = overlay.current; if (!root) return;
    const make = (n: number, cls: string) => Array.from({ length: n }, () => { const d = document.createElement('div'); d.className = cls; d.style.display = 'none'; root.appendChild(d); return d; });
    const bubbles = make(16, 'up-bubble'), pops = make(14, 'up-pop'), honks = make(6, 'up-honk'), labels = make(DISTRICTS.length, 'up-label');
    const [arrow] = make(1, 'up-arrow'), [dest] = make(1, 'up-dest'), [grab] = make(1, 'up-grab');
    grab!.textContent = 'GRABBED! STAY WITH YOUR CROWD';
    const v = new THREE.Vector3();
    const set = (el: HTMLElement, text: string) => { if (el.textContent !== text) el.textContent = text; };
    const place = (el: HTMLElement, x: number, y: number, extra = '') => { el.style.display = ''; el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -100%)${extra}`; };
    const project = (cam: THREE.Camera, w: number, h: number, x: number, y: number, z: number) => {
      v.set(x, y, z).project(cam);
      return { x: (v.x + 1) / 2 * w, y: (1 - v.y) / 2 * h, on: v.z < 1 && v.x > -1.1 && v.x < 1.1 && v.y > -1.1 && v.y < 1.1 };
    };
    bridge.current.onFrame = (cam, w, h) => {
      const b = bridge.current, s = b.sim, L = s.leader;
      const live = b.started && !s.over;
      root.style.visibility = live ? 'visible' : 'hidden';
      if (!live) return;
      // speech
      let bi = 0;
      for (const a of s.agents) {
        if (bi >= bubbles.length) break;
        if (a.gone || a.wordT <= 0 || Math.abs(a.x - L.x) > 40 || Math.abs(a.z - L.z) > 34) continue;
        const p = project(cam, w, h, a.x, 2.7, a.z);
        if (!p.on) continue;
        const el = bubbles[bi++]!;
        set(el, a.word);
        el.dataset.role = a.role;
        el.style.opacity = String(Math.min(1, a.wordT * 2));
        place(el, p.x, p.y);
      }
      for (; bi < bubbles.length; bi++) bubbles[bi]!.style.display = 'none';
      // pops
      let pi = 0;
      const placed: { x: number; y: number }[] = [];
      for (let qi = s.pops.length - 1; qi >= 0; qi--) {
        const q = s.pops[qi]!;
        if (pi >= pops.length) break;
        const p = project(cam, w, h, q.x, 3.2 + q.t * 2.2, q.z);
        if (!p.on) continue;
        // two things said in the same place: the older one moves up
        while (placed.some((o) => Math.abs(o.x - p.x) < 150 && Math.abs(o.y - p.y) < 30)) p.y -= 32;
        placed.push({ x: p.x, y: p.y });
        const el = pops[pi++]!;
        set(el, q.text); el.dataset.kind = q.kind;
        el.style.opacity = String(Math.min(1, (2.2 - q.t) * 2));
        place(el, p.x, p.y, ` scale(${(1 + Math.max(0, 0.25 - q.t) * 2).toFixed(2)})`);
      }
      for (; pi < pops.length; pi++) pops[pi]!.style.display = 'none';
      // car horns
      let hi = 0;
      for (const c of s.cars) {
        if (hi >= honks.length || c.honk <= 0) continue;
        const [x, z] = carPos(c);
        if (Math.abs(x - L.x) > 40 || Math.abs(z - L.z) > 34) continue;
        const p = project(cam, w, h, x, 2.2, z);
        if (!p.on) continue;
        const el = honks[hi++]!; set(el, 'HONK'); place(el, p.x, p.y, ` rotate(${(Math.sin(c.id) * 12).toFixed(0)}deg)`);
      }
      for (; hi < honks.length; hi++) honks[hi]!.style.display = 'none';
      // district labels over the plazas
      const target = objectiveTarget(s);
      DISTRICTS.forEach((d, i) => {
        const el = labels[i]!;
        const [x, z] = blockCenter(...d.plaza);
        const st = s.districts[d.id];
        const far = Math.hypot(x - L.x, z - L.z) > 75;
        const p = project(cam, w, h, x, d.id === 'hall' ? 17 : 13, z);
        if (!p.on || far) { el.style.display = 'none'; return; }
        const locked = d.id === 'hall' && !hallOpen(s);
        const text = st.captured ? `${d.name} · OURS` : locked ? `${d.name} · take 5 districts first` : st.occupy > 0 ? `${d.name} · ${Math.round(st.occupy * 100)}%` : `${d.name} · bring ${d.need}`;
        set(el, text);
        el.dataset.state = st.captured ? 'ours' : locked ? 'locked' : target === d.id ? 'target' : '';
        el.style.setProperty('--hue', d.hue);
        place(el, p.x, p.y);
      });
      // the objective, pointed at from the edge of the screen when it is off it
      if (target) {
        const [x, z] = blockCenter(...DISTRICT_BY_ID[target].plaza);
        const p = project(cam, w, h, x, 0, z);
        const inside = p.on && p.x > 40 && p.x < w - 40 && p.y > 90 && p.y < h - 120;
        if (inside) arrow!.style.display = 'none';
        else {
          const cx = w / 2, cy = h / 2;
          let dx = p.x - cx, dy = p.y - cy;
          if (!p.on) { const q = project(cam, w, h, L.x + (x - L.x) * 0.05, 0, L.z + (z - L.z) * 0.05); dx = q.x - cx; dy = q.y - cy; }
          const ang = Math.atan2(dy, dx);
          const rx = w / 2 - 44, ry = h / 2 - 110;
          const k = Math.min(rx / Math.abs(Math.cos(ang) || 1e-3), ry / Math.abs(Math.sin(ang) || 1e-3));
          arrow!.style.display = '';
          arrow!.style.transform = `translate3d(${(cx + Math.cos(ang) * k).toFixed(1)}px, ${(cy + Math.sin(ang) * k).toFixed(1)}px, 0) translate(-50%, -50%) rotate(${ang}rad)`;
          arrow!.style.setProperty('--hue', DISTRICT_BY_ID[target].hue);
        }
      } else arrow!.style.display = 'none';
      // where you clicked
      if (L.tx !== null && L.tz !== null) { const p = project(cam, w, h, L.tx, 0, L.tz); if (p.on) { dest!.style.display = ''; dest!.style.transform = `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0) translate(-50%, -50%) scaleY(0.5)`; } else dest!.style.display = 'none'; }
      else dest!.style.display = 'none';
      // being grabbed
      if (L.caught > 0) { const p = project(cam, w, h, L.x, 3.4, L.z); place(grab!, p.x, p.y); grab!.style.setProperty('--k', String(Math.min(1, L.caught / 1.1))); }
      else grab!.style.display = 'none';
    };
    return () => { bridge.current.onFrame = undefined; root.innerHTML = ''; };
  }, [run]);

  /* the game ends */
  const onOver = useCallback((how: 'won' | 'lost') => {
    const s = bridge.current.sim;
    setFinal({ ...s.stats, t: s.t });
    window.setTimeout(() => setPhase(how), how === 'won' ? 4500 : 1600);
  }, []);

  const scene = useMemo(() => <Scene key={run} bridge={bridge} />, [run, low]);

  return (
    <div className="up-root" ref={wrap}>
      <Canvas
        className="up-canvas"
        shadows
        dpr={low ? [1, 1.25] : [1, 1.75]}
        camera={{ fov: 35, near: 0.5, far: 900, position: [120, 95, 120] }}
        gl={{ antialias: false, powerPreference: 'high-performance', stencil: false }}
      >
        {scene}
      </Canvas>
      <div className="up-overlay" ref={overlay} />

      {phase === 'play' && (
        <Hud
          bridge={bridge}
          sound={sound}
          fire={fire}
          say={say}
          onOver={onOver}
          muted={muted}
          onMute={() => setMuted((m) => !m)}
          onPause={() => setPaused(true)}
          onHelp={() => setHelp(true)}
          onExit={onExit}
        />
      )}
      {toast && phase === 'play' && <div key={toast.id} className={`up-toast up-toast--${toast.kind}`}>{toast.text}</div>}

      {phase === 'title' && <Title onStart={start} onExit={onExit} low={low} setLow={setLow} />}
      {phase === 'play' && (paused || help) && (
        <Sheet title={help ? 'HOW TO RUN A CITY' : 'PAUSED'}>
          <Controls />
          <div className="up-row">
            <button className="up-btn up-btn--go" onClick={() => { setPaused(false); setHelp(false); }}>BACK TO THE STREETS</button>
            {!help && <button className="up-btn" onClick={restart}>START OVER</button>}
            {!help && <button className="up-btn" onClick={onExit}>LEAVE</button>}
          </div>
        </Sheet>
      )}
      {(phase === 'won' || phase === 'lost') && final && (
        <Sheet title={phase === 'won' ? 'THE CITY IS OURS' : 'SHUT DOWN'} big>
          <p className="up-lede">
            {phase === 'won'
              ? 'City Hall is full of people who have never been inside it before. Someone has found the mayor’s biscuits. Tomorrow there will be meetings about bus lanes, benches and the clock. Tonight there are fireworks.'
              : 'Taken home for the third time, with a stern word and a leaflet. The streets go quiet. But a lot of people remember the day the city danced.'}
          </p>
          <div className="up-stats">
            <Stat n={final.maxCrowd} l="biggest crowd" />
            <Stat n={final.captured} l="districts taken" />
            <Stat n={final.parties} l="street parties" />
            <Stat n={final.murals} l="murals" />
            <Stat n={final.balls} l="beach balls" />
            <Stat n={final.overwhelmed} l="officers outnumbered" />
            <Stat n={final.honks} l="honks" />
            <Stat n={`${Math.floor(final.t / 60)}:${String(Math.floor(final.t % 60)).padStart(2, '0')}`} l="time" />
          </div>
          <div className="up-row">
            <button className="up-btn up-btn--go" onClick={restart}>{phase === 'won' ? 'AGAIN, LOUDER' : 'TRY AGAIN'}</button>
            <button className="up-btn" onClick={onExit}>LEAVE</button>
          </div>
        </Sheet>
      )}
    </div>
  );
}

const Stat = ({ n, l }: { n: number | string; l: string }) => <div className="up-stat"><b>{n}</b><span>{l}</span></div>;

function Sheet({ title, children, big }: { title: string; children: ReactNode; big?: boolean }) {
  return (
    <div className="up-sheet-wrap">
      <div className={`up-sheet ${big ? 'up-sheet--big' : ''}`}>
        <h2 className="up-sheet-h">{title}</h2>
        {children}
      </div>
    </div>
  );
}

function Controls() {
  return (
    <div className="up-controls">
      <div><kbd>click</kbd> a street, or <kbd>W A S D</kbd>, to walk. The crowd follows your path.</div>
      <div><kbd>wheel</kbd> or pinch to zoom. <kbd>P</kbd> pause, <kbd>M</kbd> mute.</div>
      {ABILITIES.map((a) => (
        <div key={a.id} className="up-ctl"><span className="up-ctl-i"><Icon id={a.id} /></span><kbd>{a.key}</kbd> <b>{a.name}</b>{a.cost ? <em> · {a.cost} buzz</em> : null} — {a.blurb}</div>
      ))}
      <div className="up-ctl-note">Police pick off stragglers: anyone with fewer than five friends around. Keep the crowd tight. Nine or more around one officer and they back off. Heat cools when you are out of sight.</div>
    </div>
  );
}

/* ───────────── the title ───────────── */

function Title({ onStart, onExit, low, setLow }: { onStart: () => void; onExit: () => void; low: boolean; setLow: (l: boolean) => void }) {
  return (
    <div className="up-title">
      <div className="up-title-top">
        <button className="up-knob" onClick={onExit} aria-label="Leave">×</button>
      </div>
      <div className="up-title-card">
        <div className="up-kicker">a game of people power</div>
        <h1 className="up-logo" aria-label="Uproar">
          {'UPROAR'.split('').map((c, i) => <span key={i} style={{ animationDelay: `${i * 0.07}s` }}>{c}</span>)}
        </h1>
        <p className="up-tag">One megaphone. One city. Make it yours.</p>
        <div className="up-cards">
          <div className="up-card up-card--a"><b>GATHER</b><span>Chant as you walk. Throw street parties, bounce beach balls, paint murals. People join.</span></div>
          <div className="up-card up-card--b"><b>OCCUPY</b><span>Fill a district's plaza with enough of you and hold it. Take five districts.</span></div>
          <div className="up-card up-card--c"><b>OUTWIT</b><span>Stay big: police pick off stragglers. Distract them with pizza. Vanish in colour.</span></div>
        </div>
        <div className="up-row">
          <button className="up-btn up-btn--go up-btn--xl" onClick={onStart}>START THE UPROAR</button>
        </div>
        <div className="up-row up-row--small">
          <span>Graphics</span>
          <button className={`up-seg ${!low ? 'is-on' : ''}`} onClick={() => setLow(false)}>FULL</button>
          <button className={`up-seg ${low ? 'is-on' : ''}`} onClick={() => setLow(true)}>LIGHT</button>
        </div>
        <p className="up-fine">A cartoon. Nobody gets hurt: the worst the police do is take you home, and the worst you do is throw a party. Sound on.</p>
      </div>
    </div>
  );
}

/* ───────────── the heads-up display ───────────── */

function Hud({ bridge, sound, fire, say, onOver, muted, onMute, onPause, onHelp, onExit }: {
  bridge: MutableRefObject<Bridge>; sound: MutableRefObject<Sound | null>; fire: (a: Ability) => void; say: (t: string, k?: string) => void; onOver: (h: 'won' | 'lost') => void;
  muted: boolean; onMute: () => void; onPause: () => void; onHelp: () => void; onExit: () => void;
}) {
  const [sn, setSn] = useState<Snap>(() => snap(bridge.current.sim));
  const [objOpen, setObjOpen] = useState(true);
  const map = useRef<HTMLCanvasElement>(null);
  const seen = useRef({ event: '', pop: 0, step: -1, hall: false, over: false, honk: 0, crowd: 0 });
  useEffect(() => {
    const tick = () => {
      const b = bridge.current, s = b.sim, snd = sound.current;
      setSn(snap(s));
      const seenR = seen.current;
      const t = performance.now() / 1000;
      if (map.current) drawMap(map.current, s, objectiveTarget(s), t);
      if (snd) { snd.mood.crowd = crowdSize(s); snd.mood.heat = s.heat; snd.mood.party = s.parties.length > 0; snd.mood.on = !b.paused && !s.over; }
      // things that happened since the last look
      if (s.lastEvent !== seenR.event) {
        const e = s.lastEvent; seenR.event = e;
        if (e === 'police') say('The police have noticed. They pick off stragglers: keep your crowd tight.', 'warn');
        else if (e === 'cannon') say('WATER CANNON! Umbrellas up (G), or split and lose them.', 'bad');
        else if (e === 'caught') { say(s.leader.lives > 0 ? `Arrested! Half the crowd went home. ${s.leader.lives} ${s.leader.lives === 1 ? 'chance' : 'chances'} left.` : 'Arrested for the last time.', 'bad'); snd?.sfx('bad'); }
        else if (e.startsWith('captured:')) {
          const id = e.slice(9) as DistrictId;
          const n = DISTRICTS.filter((d) => d.id !== 'hall' && s.districts[d.id].captured).length;
          say(id === 'hall' ? 'CITY HALL IS OURS!' : `${DISTRICT_BY_ID[id].name.toUpperCase()} IS OURS! ${n} of 5`, 'big');
          snd?.sfx('capture');
        }
        s.lastEvent = seenR.event = '';
      }
      if (!seenR.hall && hallOpen(s) && !s.districts.hall.captured) { seenR.hall = true; say('City Hall’s doors are open. Bring 160 people.', 'big'); }
      for (const p of s.pops) {
        if (p.id <= seenR.pop) continue;
        seenR.pop = p.id;
        if (p.kind === 'bad' && p.text === 'DETAINED') snd?.sfx('bad');
        else if (p.text.startsWith('+')) snd?.sfx('join');
      }
      const honking = s.cars.some((c) => { if (c.honk < 1.05) return false; const [x, z] = carPos(c); return Math.hypot(x - s.leader.x, z - s.leader.z) < 40; });
      if (honking && t - seenR.honk > 0.6) { seenR.honk = t; snd?.sfx('honk'); }
      if (s.over && !seenR.over) { seenR.over = true; onOver(s.over); }
    };
    tick();
    const h = window.setInterval(tick, 120);
    return () => window.clearInterval(h);
  }, [bridge, sound, say, onOver]);

  const obj = OBJECTIVES[sn.step]!;
  const taken = sn.districts.filter((d) => d.id !== 'hall' && d.captured).length;
  const isNight = (() => { const x = ((sn.hour % 24) + 24) % 24; return x >= 19 || x < 6; })();
  return (
    <div className="up-hud">
      <div className="up-hud-tl">
        <div className="up-crowd"><Icon id="crowd" /><b>{sn.crowd}</b><span>with you</span></div>
        <div className="up-meter up-meter--buzz" title="Buzz: spent on abilities, earned by a bigger crowd and trending">
          <span>BUZZ</span><i style={{ width: `${sn.buzz}%` }} /><em>{Math.floor(sn.buzz)}</em>
        </div>
        <div className="up-meter up-meter--trend" title="Trending: the city is talking about you. Chanting works better.">
          <span>#TRENDING</span><i style={{ width: `${sn.trending * 100}%` }} /><em>{Math.round(sn.trending * 100)}%</em>
        </div>
        <div className="up-clock">{isNight ? '☾' : '☀'} {clock(sn.hour)} · {sn.hall ? (sn.districts.find((d) => d.id === 'hall')!.captured ? 'CITY HALL IS OURS' : 'CITY HALL IS OPEN') : `${taken}/5 districts`}</div>
      </div>

      <div className="up-hud-tr">
        <div className="up-heat" title="Heat: how hard the police are looking">
          {[0, 1, 2, 3, 4].map((i) => <span key={i} className={i < sn.stars ? 'is-on' : ''}><Icon id="heat" /></span>)}
        </div>
        <div className="up-lives" title="Chances left">
          {[0, 1, 2].map((i) => <span key={i} className={i < sn.lives ? 'is-on' : ''}><Icon id="life" /></span>)}
        </div>
        <div className="up-knobs">
          <button className="up-knob" onClick={onHelp} aria-label="How to play">?</button>
          <button className="up-knob" onClick={onMute} aria-label={muted ? 'Sound on' : 'Mute'}>{muted ? '♪̸' : '♪'}</button>
          <button className="up-knob" onClick={onPause} aria-label="Pause">❚❚</button>
          <button className="up-knob" onClick={onExit} aria-label="Leave">×</button>
        </div>
      </div>

      <button className={`up-obj ${objOpen ? '' : 'is-closed'}`} onClick={() => setObjOpen((o) => !o)}>
        <span className="up-obj-n">{sn.step < OBJECTIVES.length - 1 ? `${sn.step + 1}/${OBJECTIVES.length}` : 'GOAL'}</span>
        <b>{obj.title}</b>
        {objOpen && <span className="up-obj-t">{obj.text}</span>}
      </button>

      <div className="up-districts">
        {DISTRICTS.map((d) => {
          const st = sn.districts.find((x) => x.id === d.id)!;
          const locked = d.id === 'hall' && !sn.hall;
          return (
            <div key={d.id} className={`up-dist ${st.captured ? 'is-ours' : ''} ${locked ? 'is-locked' : ''}`} style={{ ['--hue' as string]: d.hue }}>
              <i />
              <span>{d.name}</span>
              <em>{st.captured ? 'OURS' : locked ? '🔒' : st.occupy > 0 ? `${Math.round(st.occupy * 100)}%` : d.need}</em>
              {!st.captured && st.occupy > 0 && <u style={{ width: `${st.occupy * 100}%` }} />}
            </div>
          );
        })}
      </div>

      <canvas className="up-map" ref={map} width={190} height={138} />

      {sn.cannon && sn.umbrellas <= 0 && <div className="up-alert">WATER CANNON · press G</div>}

      <div className="up-bar">
        {ABILITIES.map((a) => {
          const cd = sn.cool[a.id] / a.cool;
          const poor = sn.buzz < a.cost;
          return (
            <button
              key={a.id}
              className={`up-ab up-ab--${a.id} ${poor ? 'is-poor' : ''} ${cd > 0 ? 'is-cool' : ''}`}
              style={{ ['--cd' as string]: cd }}
              onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); fire(a.id); }}
              title={`${a.name} (${a.key}) — ${a.blurb}`}
            >
              <span className="up-ab-i"><Icon id={a.id} /></span>
              <span className="up-ab-n">{a.name}</span>
              <span className="up-ab-k">{a.key === 'SPACE' ? '␣' : a.key}</span>
              {a.cost > 0 && <span className="up-ab-c">{a.cost}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
