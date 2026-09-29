import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Ink } from './ink';
import { Input } from './input';
import { Level, type Hud } from './level';
import { DAKSHA, KINDS, SITES, SITE_BY_ID } from './sites';
import type { Kind, Site } from './types';
import { World } from './world';

/**
 * Shiva Loka — a pilgrim's map of India in ink and wash.
 *
 * Walk the map to any of the twelve Jyotirlingas, the famous Shivalingas, the
 * fifty-one Shakti Peethas and the places of Krishna; step inside and each
 * one is a level with its own task, set on the land it stands on, built from
 * its story. The diary keeps every story, retold with its source, the history
 * of the temple as a time-lapse, and a mark for each darshan earned.
 */

type Mode = 'title' | 'map' | 'level';

const KIND_INK: Record<Kind, string> = { jyotirlinga: '#c8901c', linga: '#3e5a78', shakti: '#b8322a', krishna: '#1d6f8a' };
const KIND_ONE: Record<Kind, string> = { jyotirlinga: 'Jyotirlinga', linga: 'Shivalinga', shakti: 'Shakti Peetha', krishna: 'Krishna' };
const TASK_VERB: Record<string, string> = {
  lamps: 'Light the lamps', offer: 'Bring offerings', water: 'Carry water', trek: 'The climb',
  demon: 'Face the demon', bells: 'Ring the bells', carry: 'Carry it level', quiz: 'Answer the priest',
};
const STORE = 'shivaloka.v1';

interface Saved { done: string[]; at?: [number, number] }
function load(): Saved {
  try { const s = JSON.parse(localStorage.getItem(STORE) ?? 'null'); if (s && Array.isArray(s.done)) return s; } catch { /* private window */ }
  return { done: [] };
}
function save(s: Saved) { try { localStorage.setItem(STORE, JSON.stringify(s)); } catch { /* ignore */ } }

/** The state or country, from a place line: 'Rudraprayag, Uttarakhand (3,583 m)' → 'Uttarakhand'. */
const region = (place: string) => place.replace(/\s*\([^)]*\)/g, '').split(',').slice(-1)[0]!.trim();

function Dots({ n, of = 5 }: { n: number; of?: number }) {
  return (
    <span className="sl-dots" aria-label={`difficulty ${n} of ${of}`}>
      {Array.from({ length: of }, (_, i) => <i key={i} className={i < n ? 'on' : ''} />)}
    </span>
  );
}

function Bar({ v, className = '' }: { v: number; className?: string }) {
  return <span className={`sl-bar ${className}`}><i style={{ width: `${Math.max(0, Math.min(1, v)) * 100}%` }} /></span>;
}

export function ShivaLoka({ onExit }: { onExit: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const tagRef = useRef<HTMLDivElement>(null);
  const saved = useMemo(load, []);
  const [done, setDone] = useState<Set<string>>(() => new Set(saved.done));
  const [mode, setMode] = useState<Mode>('title');
  const [near, setNear] = useState<Site | null>(null);
  const [hover, setHover] = useState<{ s: Site; x: number; y: number } | null>(null);
  const [kinds, setKinds] = useState<Set<Kind>>(() => new Set(KINDS.map((k) => k.id)));
  const [diary, setDiary] = useState<{ open: boolean; tab: Kind; site: Site | null }>({ open: false, tab: 'jyotirlinga', site: null });
  const [hud, setHud] = useState<Hud | null>(null);
  const [levelSite, setLevelSite] = useState<Site | null>(null);
  const [quizI, setQuizI] = useState(0);
  const [quizPick, setQuizPick] = useState<number | null>(null);
  const [touch] = useState(() => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches);
  const [help, setHelp] = useState(false);

  const worldRef = useRef<World | null>(null);
  const levelRef = useRef<Level | null>(null);
  const inputRef = useRef<Input | null>(null);
  const inkRef = useRef<Ink | null>(null);
  const modeRef = useRef<Mode>('title');
  const diaryOpenRef = useRef(false);
  const doneRef = useRef(done);
  modeRef.current = mode;
  diaryOpenRef.current = diary.open;
  doneRef.current = done;

  // fonts: the sacred set lives in public/, shared with the films
  useEffect(() => {
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = '/fonts-sacred/fonts.css';
    document.head.appendChild(l);
    return () => l.remove();
  }, []);

  /* ───────────── the engine: one renderer, the map, and a level when inside one ───────────── */
  useEffect(() => {
    const canvas = canvasRef.current!;
    const stage = stageRef.current!;
    const low = new URLSearchParams(location.search).has('low') || Math.min(innerWidth, innerHeight) < 560;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
    const pr = Math.min(devicePixelRatio || 1, low ? 1.25 : 1.75);
    renderer.setPixelRatio(pr);
    const ink = new Ink(renderer);
    const input = new Input();
    const world = new World(ink, input, SITES, doneRef.current, saved.at);
    inkRef.current = ink;
    if (import.meta.env.DEV) (window as unknown as Record<string, unknown>).__shivaloka = { level: () => levelRef.current, world };
    inputRef.current = input;
    worldRef.current = world;

    const size = () => {
      const w = stage.clientWidth, h = stage.clientHeight;
      renderer.setSize(w, h, false);
      ink.setSize(w, h, pr);
      world.resize(w, h);
      levelRef.current?.resize(w, h);
    };
    size();
    const ro = new ResizeObserver(size);
    ro.observe(stage);
    // a deep link straight into a level: ?site=somnath (&lapse for its time-lapse)
    const q = new URLSearchParams(location.search);
    const deep = SITE_BY_ID[q.get('site') ?? ''];
    if (deep) enterRef.current(deep, q.has('lapse'));

    let raf = 0;
    let last = performance.now();
    let lastHud = 0;
    let lastNear: Site | null = null;
    let lastSave = 0;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = now / 1000;
      const { action } = input.poll();
      const lv = levelRef.current;
      if (lv) {
        if (action && lv.status === 'intro') lv.begin();
        lv.update(dt, t, action);
        lv.render(t);
        if (now - lastHud > 66) { lastHud = now; setHud(lv.hud()); }
        return;
      }
      if (diaryOpenRef.current && modeRef.current === 'map') { world.render(t); return; }
      if (modeRef.current !== 'map') { input.move.x = 0; input.move.y = 0; }
      const n = modeRef.current === 'map' ? world.update(dt, t) : (world.update(dt, t), null);
      if (n !== lastNear) { lastNear = n; setNear(n); }
      if (n && tagRef.current) {
        const p = world.screenOf(n);
        tagRef.current.style.transform = `translate(${p.x}px, ${p.y}px)`;
      }
      if (action && n && modeRef.current === 'map') enterRef.current(n);
      world.render(t);
      if (now - lastSave > 3000) {
        lastSave = now;
        const p = world.pilgrim.position;
        save({ done: [...doneRef.current], at: [p.x, p.z] });
      }
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      const p = world.pilgrim.position;
      save({ done: [...doneRef.current], at: [p.x, p.z] });
      levelRef.current?.dispose();
      levelRef.current = null;
      world.dispose();
      input.dispose();
      ink.dispose();
      renderer.dispose();
    };
  }, [saved]);

  useEffect(() => { worldRef.current?.setDone(done); save({ done: [...done], at: worldRef.current ? [worldRef.current.pilgrim.position.x, worldRef.current.pilgrim.position.z] : saved.at }); }, [done, saved]);
  useEffect(() => { worldRef.current?.setFilter(kinds); }, [kinds]);

  /* ───────────── going in and out of levels ───────────── */
  const enter = useCallback((s: Site, lapse = false) => {
    const ink = inkRef.current, input = inputRef.current, stage = stageRef.current;
    if (!ink || !input || !stage) return;
    levelRef.current?.dispose();
    // coming back out, the pilgrim stands at this shrine on the map
    const w = worldRef.current;
    if (w && w.near !== s) w.jumpTo(s);
    const lv = new Level(ink, input, s);
    lv.resize(stage.clientWidth, stage.clientHeight);
    if (lapse) lv.startLapse();
    levelRef.current = lv;
    setLevelSite(s);
    setHud(lv.hud());
    setQuizI(0);
    setQuizPick(null);
    setDiary((d) => ({ ...d, open: false }));
    setMode('level');
  }, []);
  const enterRef = useRef(enter);
  enterRef.current = enter;

  const leave = useCallback(() => {
    levelRef.current?.dispose();
    levelRef.current = null;
    setLevelSite(null);
    setHud(null);
    setMode('map');
  }, []);

  const retry = useCallback(() => {
    const lv = levelRef.current;
    if (!lv) return;
    const fresh = lv.retry();
    lv.dispose();
    const st = stageRef.current!;
    fresh.resize(st.clientWidth, st.clientHeight);
    fresh.begin();
    levelRef.current = fresh;
    setQuizI(0);
    setQuizPick(null);
    setHud(fresh.hud());
  }, []);

  // a darshan earned is written in the diary
  useEffect(() => {
    if (hud?.status === 'won' && levelSite && !done.has(levelSite.id)) setDone((d) => new Set(d).add(levelSite.id));
  }, [hud?.status, levelSite, done]);

  const answer = (i: number) => {
    const lv = levelRef.current, s = levelSite;
    if (!lv || !s?.quiz || quizPick !== null) return;
    const q = s.quiz[quizI]!;
    setQuizPick(i);
    setTimeout(() => {
      lv.answerQuiz(i === q[2]);
      setQuizPick(null);
      setQuizI((n) => n + 1);
      setHud(lv.hud());
    }, 1100);
  };

  /* ───────────── the map: pointer, wheel, pinch ───────────── */
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef(0);
  const downAt = useRef<{ x: number; y: number; t: number } | null>(null);
  const onPointerDown = (e: React.PointerEvent) => {
    if (mode !== 'map') return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 1) downAt.current = { x: e.clientX, y: e.clientY, t: performance.now() };
    if (pointers.current.size === 2) { const [a, b] = [...pointers.current.values()]; pinch.current = Math.hypot(a!.x - b!.x, a!.y - b!.y); downAt.current = null; }
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (mode !== 'map' || !worldRef.current) return;
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    if (pointers.current.has(e.pointerId)) pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      const d = Math.hypot(a!.x - b!.x, a!.y - b!.y);
      if (pinch.current > 0) worldRef.current.zoom(pinch.current / d);
      pinch.current = d;
      return;
    }
    if (e.pointerType === 'mouse') {
      const s = worldRef.current.hoverAt(e.clientX - r.left, e.clientY - r.top);
      setHover(s ? { s, x: e.clientX - r.left, y: e.clientY - r.top } : null);
    }
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const d = downAt.current;
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = 0;
    if (mode !== 'map' || !d || !worldRef.current) return;
    downAt.current = null;
    if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 12 || performance.now() - d.t > 600) return;
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    worldRef.current.clickAt(e.clientX - r.left, e.clientY - r.top);
  };
  useEffect(() => {
    const st = stageRef.current;
    if (!st) return;
    const wheel = (e: WheelEvent) => { if (modeRef.current !== 'map') return; e.preventDefault(); worldRef.current?.zoom(Math.exp(e.deltaY * 0.0012)); };
    st.addEventListener('wheel', wheel, { passive: false });
    return () => st.removeEventListener('wheel', wheel);
  }, []);

  // keys that belong to the page rather than the pilgrim
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (diary.open) setDiary((d) => ({ ...d, open: false }));
        else if (levelRef.current?.status === 'lapse') levelRef.current.endLapse();
        else if (mode === 'level') leave();
      }
      if ((e.key === 'j' || e.key === 'J') && mode === 'map') setDiary((d) => ({ ...d, open: !d.open }));
      if (e.key === '+' || e.key === '=') worldRef.current?.zoom(0.85);
      if (e.key === '-' || e.key === '_') worldRef.current?.zoom(1.18);
    };
    addEventListener('keydown', k);
    return () => removeEventListener('keydown', k);
  }, [diary.open, mode, leave]);

  /* ───────────── the thumb stick ───────────── */
  const stickRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const stickId = useRef<number | null>(null);
  const stickMove = (e: React.PointerEvent) => {
    if (stickId.current !== e.pointerId || !stickRef.current || !inputRef.current) return;
    const r = stickRef.current.getBoundingClientRect();
    const R = r.width / 2;
    let x = (e.clientX - r.left - R) / R, y = (e.clientY - r.top - R) / R;
    const l = Math.hypot(x, y);
    if (l > 1) { x /= l; y /= l; }
    inputRef.current.stick.x = Math.abs(x) < 0.12 ? 0 : x;
    inputRef.current.stick.y = Math.abs(y) < 0.12 ? 0 : -y;
    if (knobRef.current) knobRef.current.style.transform = `translate(${x * R * 0.55}px, ${y * R * 0.55}px)`;
  };
  const stickEnd = (e: React.PointerEvent) => {
    if (stickId.current !== e.pointerId) return;
    stickId.current = null;
    if (inputRef.current) { inputRef.current.stick.x = 0; inputRef.current.stick.y = 0; }
    if (knobRef.current) knobRef.current.style.transform = '';
  };

  /* ───────────── the diary ───────────── */
  const openDiary = (s?: Site | null, tab?: Kind) =>
    setDiary({ open: true, tab: tab ?? s?.kind ?? diary.tab, site: s ?? null });
  const tabSites = useMemo(() => SITES.filter((s) => s.kind === diary.tab), [diary.tab]);
  const count = (k?: Kind) => SITES.filter((s) => (!k || s.kind === k) && done.has(s.id)).length;
  const total = (k?: Kind) => SITES.filter((s) => !k || s.kind === k).length;

  const goThere = (s: Site) => {
    const w = worldRef.current;
    if (!w) return;
    if (!kinds.has(s.kind)) setKinds((k) => new Set(k).add(s.kind));
    w.jumpTo(s);
    if (w.zoomH > 14) w.zoomH = 11;
    setDiary((d) => ({ ...d, open: false }));
    if (mode !== 'map') { if (levelRef.current) leave(); setMode('map'); }
  };

  const status = hud?.status;
  const quiz = levelSite?.quiz;
  const q = quiz && status === 'quiz' && quizI < quiz.length ? quiz[quizI] : null;

  return (
    <div className={`sl-root sl-${mode}`}>
      <div
        className="sl-stage"
        ref={stageRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={() => setHover(null)}
      >
        <canvas ref={canvasRef} className="sl-canvas" />
        {mode === 'map' && near && (
          <div className="sl-tag" ref={tagRef} style={{ '--k': KIND_INK[near.kind] } as React.CSSProperties}>
            <span>{near.name}</span>
          </div>
        )}
        {mode === 'map' && hover && hover.s !== near && (
          <div className="sl-hover" style={{ left: hover.x, top: hover.y, '--k': KIND_INK[hover.s.kind] } as React.CSSProperties}>
            <b>{hover.s.name}</b>
            <small>{KIND_ONE[hover.s.kind]} · {region(hover.s.place)}</small>
            <Dots n={hover.s.difficulty} />
            {done.has(hover.s.id) && <em>✓ darshan</em>}
          </div>
        )}
      </div>

      {/* ───────── title ───────── */}
      {mode === 'title' && (
        <div className="sl-title">
          <div className="sl-title-card">
            <p className="sl-sa">शिवलोक</p>
            <h1>Shiva Loka</h1>
            <p className="sl-sub">A pilgrim's map of India in ink and wash — the twelve Jyotirlingas, the great Shivalingas, the fifty-one Shakti Peethas, and the places of Krishna.</p>
            <p className="sl-sub2">Walk to a shrine, step in, and earn the darshan. Every place has its story, retold from the Puranas with the source, and its temple rising again in a time-lapse.</p>
            <div className="sl-row">
              <button className="sl-btn sl-btn--main" onClick={() => setMode('map')}>{done.size ? 'Continue the yatra' : 'Begin the yatra'}</button>
              <button className="sl-btn" onClick={() => { setMode('map'); openDiary(null, 'jyotirlinga'); }}>Open the diary</button>
            </div>
            <p className="sl-keys">{touch ? 'Thumb stick to walk · ✦ to act · tap the map to walk there · pinch to zoom' : 'WASD / arrows to walk · Space to act · click the map to walk there · wheel to zoom · J for the diary'}</p>
            <p className="sl-count">{done.size} of {SITES.length} darshans</p>
          </div>
        </div>
      )}

      {/* ───────── the map chrome ───────── */}
      {mode === 'map' && (
        <>
          <header className="sl-top">
            <button className="sl-icon" onClick={onExit} aria-label="Back to the shelf">←</button>
            <div className="sl-brand"><b>Shiva Loka</b><span>{done.size} / {SITES.length} darshans</span></div>
            <button className="sl-btn sl-btn--small" onClick={() => openDiary(near)}>Diary</button>
            <button className="sl-icon" onClick={() => setHelp((h) => !h)} aria-label="How to play">?</button>
          </header>
          <nav className="sl-kinds" aria-label="Show on the map">
            {KINDS.map((k) => (
              <button
                key={k.id}
                className={kinds.has(k.id) ? 'on' : ''}
                style={{ '--k': KIND_INK[k.id] } as React.CSSProperties}
                onClick={() => setKinds((s) => { const n = new Set(s); if (n.has(k.id)) { if (n.size > 1) n.delete(k.id); } else n.add(k.id); return n; })}
              >
                <i />{k.name} <small>{count(k.id)}/{total(k.id)}</small>
              </button>
            ))}
          </nav>
          <div className="sl-zoom">
            <button className="sl-icon" onClick={() => worldRef.current?.zoom(0.8)} aria-label="Zoom in">+</button>
            <button className="sl-icon" onClick={() => worldRef.current?.zoom(1.25)} aria-label="Zoom out">−</button>
          </div>
          {help && (
            <div className="sl-help" onClick={() => setHelp(false)}>
              <p><b>Walk</b> with {touch ? 'the thumb stick' : 'WASD or the arrows'}, or {touch ? 'tap' : 'click'} anywhere to walk there. Over the sea you take a boat.</p>
              <p><b>Near a shrine</b>, its card opens: <b>Enter</b> ({touch ? '✦' : 'Space'}) to play its level. Each has a difficulty from one to five dots.</p>
              <p><b>Gold</b> pillars are Jyotirlingas, <b>slate</b> lingas are Shivalingas, <b>red</b> pennants are Shakti Peethas, <b>peacock</b> feathers are Krishna's places. A gold ring marks a darshan earned.</p>
            </div>
          )}
          {near && !diary.open && (
            <div className="sl-near" style={{ '--k': KIND_INK[near.kind] } as React.CSSProperties}>
              <div className="sl-near-head">
                <span className="sl-kind">{KIND_ONE[near.kind]}</span>
                {done.has(near.id) && <span className="sl-done">✓ darshan</span>}
              </div>
              <h2>{near.name} {near.sa && <span className="sl-dev">{near.sa}</span>}</h2>
              <p className="sl-place">{near.place}</p>
              <p className="sl-task"><Dots n={near.difficulty} /> <b>{near.task.title}</b> — {TASK_VERB[near.task.kind]}</p>
              <div className="sl-row">
                <button className="sl-btn sl-btn--main" onClick={() => enter(near)}>Enter {touch ? '' : <kbd>Space</kbd>}</button>
                <button className="sl-btn" onClick={() => openDiary(near)}>Read the story</button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ───────── inside a level ───────── */}
      {mode === 'level' && levelSite && hud && (
        <>
          <header className="sl-top sl-top--level">
            <button className="sl-icon" onClick={leave} aria-label="Back to the map">←</button>
            <div className="sl-brand"><b>{levelSite.name}</b><span>{hud.title}</span></div>
            {status !== 'lapse' && <button className="sl-btn sl-btn--small" onClick={() => { levelRef.current?.startLapse(); }}>Time-lapse</button>}
          </header>

          {(status === 'play' || status === 'quiz') && (
            <div className="sl-hud" style={{ '--k': KIND_INK[levelSite.kind] } as React.CSSProperties}>
              <div className="sl-hud-row">
                <Bar v={hud.progress[1] ? hud.progress[0] / hud.progress[1] : 0} className="sl-bar--brush" />
                {hud.timeLeft !== undefined && hud.timeLeft > 0 && <span className={`sl-time ${hud.timeLeft < 10 ? 'low' : ''}`}>{Math.ceil(hud.timeLeft)}s</span>}
              </div>
              <p className="sl-label">{touch ? hud.label.replace('← →', 'the stick') : hud.label}</p>
              {hud.hearts && (
                <p className="sl-hearts">
                  {Array.from({ length: hud.hearts[1] }, (_, i) => <i key={i} className={i < hud.hearts![0] ? 'on' : ''}>❤</i>)}
                  {hud.foe && <span className="sl-foe">{levelSite.task.foe} <Bar v={hud.foe[0] / hud.foe[1]} className="sl-bar--foe" /></span>}
                </p>
              )}
              {hud.stamina !== undefined && <p className="sl-meter">Breath <Bar v={hud.stamina} className={hud.stamina < 0.25 ? 'sl-bar--low' : ''} /></p>}
              {hud.rhythm && (
                <div className={`sl-rhythm ${hud.rhythm.near ? '' : 'far'}`}>
                  <span className="zone" style={{ left: `${hud.rhythm.zone[0] * 100}%`, width: `${(hud.rhythm.zone[1] - hud.rhythm.zone[0]) * 100}%` }} />
                  <span className="dot" style={{ left: `${hud.rhythm.pos * 100}%` }} />
                </div>
              )}
              {hud.tilt !== undefined && (
                <div className="sl-tilt"><span style={{ transform: `rotate(${hud.tilt * 40}deg)` }} /><em style={{ left: `${50 + hud.tilt * 45}%` }} /></div>
              )}
              {hud.prompt && <p className="sl-prompt">{hud.prompt}</p>}
              {hud.message && <p className="sl-prompt">{hud.message}</p>}
            </div>
          )}

          {status === 'intro' && (
            <div className="sl-card sl-card--intro" style={{ '--k': KIND_INK[levelSite.kind] } as React.CSSProperties}>
              <span className="sl-kind">{KIND_ONE[levelSite.kind]} · {levelSite.place}</span>
              <h2>{levelSite.name} {levelSite.sa && <span className="sl-dev">{levelSite.sa}</span>}</h2>
              <p className="sl-task"><Dots n={levelSite.difficulty} /> <b>{levelSite.task.title}</b></p>
              <p>{levelSite.task.detail}</p>
              <p className="sl-keys">{levelHelp(levelSite, touch)}</p>
              <div className="sl-row">
                <button className="sl-btn sl-btn--main" onClick={() => levelRef.current?.begin()}>Begin {touch ? '' : <kbd>Space</kbd>}</button>
                <button className="sl-btn" onClick={() => levelRef.current?.startLapse()}>Watch it rise</button>
                <button className="sl-btn" onClick={() => openDiary(levelSite)}>Story</button>
              </div>
            </div>
          )}

          {status === 'quiz' && q && (
            <div className="sl-card sl-card--quiz">
              <span className="sl-kind">The priest asks · {quizI + 1} of {quiz!.length}</span>
              <h3>{q[0]}</h3>
              <div className="sl-answers">
                {q[1].map((a, i) => (
                  <button
                    key={a}
                    className={`sl-btn ${quizPick !== null && i === q[2] ? 'right' : ''} ${quizPick === i && i !== q[2] ? 'wrong' : ''}`}
                    onClick={() => answer(i)}
                  >{a}</button>
                ))}
              </div>
            </div>
          )}

          {status === 'won' && (
            <div className="sl-card sl-card--won" style={{ '--k': KIND_INK[levelSite.kind] } as React.CSSProperties}>
              <span className="sl-kind">Darshan · {levelSite.name}</span>
              <h2>{levelSite.sa ?? levelSite.name}</h2>
              <p className="sl-story">{levelSite.story}</p>
              <p className="sl-source">— {levelSite.source}</p>
              <div className="sl-row">
                <button className="sl-btn sl-btn--main" onClick={() => levelRef.current?.startLapse()}>Watch the temple rise</button>
                <button className="sl-btn" onClick={leave}>Back to the map</button>
              </div>
            </div>
          )}

          {status === 'lost' && (
            <div className="sl-card sl-card--lost">
              <span className="sl-kind">{levelSite.name}</span>
              <h3>{hud.message || 'Not this time.'}</h3>
              <div className="sl-row">
                <button className="sl-btn sl-btn--main" onClick={retry}>Try again</button>
                <button className="sl-btn" onClick={() => openDiary(levelSite)}>Read the story</button>
                <button className="sl-btn" onClick={leave}>Back to the map</button>
              </div>
            </div>
          )}

          {status === 'lapse' && (
            <div className="sl-lapse">
              {hud.beat ? (
                <div className="sl-beat" key={hud.beat.i}>
                  <span className="sl-when">{hud.beat.when}</span>
                  <p>{hud.beat.what}</p>
                  <span className="sl-pips">{Array.from({ length: hud.beat.n }, (_, i) => <i key={i} className={i <= hud.beat!.i ? 'on' : ''} />)}</span>
                </div>
              ) : <div className="sl-beat"><p>{levelSite.name} rises.</p></div>}
              <button className="sl-btn sl-btn--small" onClick={() => levelRef.current?.endLapse()}>Skip</button>
            </div>
          )}

          {touch && status === 'play' && (
            <div className="sl-pad">
              <div
                className="sl-stick"
                ref={stickRef}
                onPointerDown={(e) => { stickId.current = e.pointerId; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); stickMove(e); }}
                onPointerMove={stickMove}
                onPointerUp={stickEnd}
                onPointerCancel={stickEnd}
              ><div className="sl-knob" ref={knobRef} /></div>
              <button className="sl-act" onPointerDown={(e) => { e.preventDefault(); inputRef.current?.press(); }} aria-label="Act">✦</button>
            </div>
          )}
        </>
      )}

      {touch && mode === 'map' && !diary.open && (
        <div className="sl-pad sl-pad--map">
          <div
            className="sl-stick"
            ref={stickRef}
            onPointerDown={(e) => { stickId.current = e.pointerId; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); stickMove(e); }}
            onPointerMove={stickMove}
            onPointerUp={stickEnd}
            onPointerCancel={stickEnd}
          ><div className="sl-knob" ref={knobRef} /></div>
        </div>
      )}

      {/* ───────── the diary ───────── */}
      {diary.open && (
        <div className="sl-diary" role="dialog" aria-label="The diary of shrines">
          <div className="sl-diary-book">
            <aside className={`sl-diary-index ${diary.site ? 'has-page' : ''}`}>
              <div className="sl-diary-head">
                <b>The Diary</b>
                <span>{done.size} of {SITES.length} darshans</span>
                <button className="sl-icon" onClick={() => setDiary((d) => ({ ...d, open: false }))} aria-label="Close the diary">×</button>
              </div>
              <div className="sl-tabs" role="tablist">
                {KINDS.map((k) => (
                  <button key={k.id} role="tab" aria-selected={diary.tab === k.id} className={diary.tab === k.id ? 'on' : ''} style={{ '--k': KIND_INK[k.id] } as React.CSSProperties} onClick={() => setDiary((d) => ({ ...d, tab: k.id, site: null }))}>
                    {k.name}<small>{count(k.id)}/{total(k.id)}</small>
                  </button>
                ))}
              </div>
              <p className="sl-tab-blurb">{KINDS.find((k) => k.id === diary.tab)!.blurb}</p>
              <ol className="sl-list">
                {tabSites.map((s) => (
                  <li key={s.id}>
                    <button className={diary.site === s ? 'on' : ''} onClick={() => setDiary((d) => ({ ...d, site: s }))}>
                      <span className="n">{s.name}</span>
                      <span className="p">{region(s.place)}</span>
                      <Dots n={s.difficulty} />
                      {done.has(s.id) ? <span className="tick">✓</span> : <span className="tick" />}
                    </button>
                  </li>
                ))}
              </ol>
            </aside>
            <article className="sl-page" style={{ '--k': KIND_INK[diary.site?.kind ?? diary.tab] } as React.CSSProperties}>
              {diary.site ? <Page s={diary.site} done={done.has(diary.site.id)} onBack={() => setDiary((d) => ({ ...d, site: null }))} onGo={() => goThere(diary.site!)} onPlay={() => enter(diary.site!)} onLapse={() => enter(diary.site!, true)} /> : (
                <div className="sl-page-empty">
                  <p className="sl-sa">{KINDS.find((k) => k.id === diary.tab)!.sa}</p>
                  <h2>{KINDS.find((k) => k.id === diary.tab)!.name}</h2>
                  {diary.tab === 'shakti' && <p className="sl-story">{DAKSHA}</p>}
                  {diary.tab === 'jyotirlinga' && <p className="sl-story">Brahma and Vishnu quarrelled over which of them was greater, and between them a pillar of fire split the worlds. Brahma flew up as a swan to find its top and Vishnu dug down as a boar to find its root; neither found an end. Shiva stepped out of the pillar. The places where that light is worshipped as a linga are the Jyotirlingas. <span className="sl-source">— Shiva Purana, Vidyeshvara Samhita 5–9; the twelve are named in Koti Rudra Samhita 1</span></p>}
                  {diary.tab === 'linga' && <p className="sl-story">The linga is Shiva without form: no face, no limbs, a column with no beginning or end, set in the yoni that is Shakti. Here are the mountain of Kailash, the ice linga of Amarnath, the five lingas of the five elements, the five Kedars of the Himalaya where the Pandavas chased Shiva as a bull, and the rock-cut and royal temples.</p>}
                  {diary.tab === 'krishna' && <p className="sl-story">From the prison in Mathura to Gokul across the flooded Yamuna, the childhood in Vrindavan and Govardhan, Dwarka on the sea, the field of Kurukshetra where he spoke the Gita, and Bhalka where he left the world — and the images worshipped since: Shrinathji, Jagannath, Udupi, Guruvayur, Vithoba.</p>}
                  <p className="sl-hint">Choose a place from the list.</p>
                </div>
              )}
            </article>
          </div>
        </div>
      )}
    </div>
  );
}

function Page({ s, done, onBack, onGo, onPlay, onLapse }: { s: Site; done: boolean; onBack: () => void; onGo: () => void; onPlay: () => void; onLapse: () => void }) {
  return (
    <div className="sl-page-body">
      <button className="sl-back" onClick={onBack}>← list</button>
      <span className="sl-kind">{KIND_ONE[s.kind]}{done ? ' · ✓ darshan' : ''}</span>
      <h2>{s.name} {s.sa && <span className="sl-dev">{s.sa}</span>}</h2>
      <p className="sl-place">{s.place} · {s.lat.toFixed(2)}°N {s.lon.toFixed(2)}°E</p>
      {s.peetha && (
        <dl className="sl-peetha">
          <div><dt>What fell</dt><dd>{s.peetha.part}</dd></div>
          <div><dt>The goddess</dt><dd>{s.peetha.shakti}</dd></div>
          <div><dt>Her Bhairava</dt><dd>{s.peetha.bhairava}</dd></div>
        </dl>
      )}
      <p className="sl-story">{s.story}</p>
      <p className="sl-source">— {s.source}</p>
      {s.timeline && s.timeline.length > 0 && (
        <>
          <h4>How it rose</h4>
          <ol className="sl-timeline">
            {s.timeline.map(([w, what]) => <li key={w + what}><b>{w}</b><span>{what}</span></li>)}
          </ol>
        </>
      )}
      <h4>The level</h4>
      <p className="sl-task"><Dots n={s.difficulty} /> <b>{s.task.title}</b> — {s.task.detail}</p>
      <div className="sl-row">
        <button className="sl-btn sl-btn--main" onClick={onPlay}>Play</button>
        <button className="sl-btn" onClick={onGo}>Go there on the map</button>
        <button className="sl-btn" onClick={onLapse}>Time-lapse</button>
      </div>
    </div>
  );
}

function levelHelp(s: Site, touch: boolean) {
  const act = touch ? '✦' : 'Space';
  const walk = touch ? 'the stick' : 'WASD';
  switch (s.task.kind) {
    case 'lamps': return `Walk with ${walk} to each lamp in turn — the next one glows. Mind the time.`;
    case 'offer': return `Walk over the offerings to pick them up, then take them to the shrine.`;
    case 'water': return `Fill a pot at the water, then carry it to the linga. One pot at a time.`;
    case 'trek': return `Climbing drains your breath. Stand still, or rest at a shelter, to get it back.`;
    case 'demon': return `Press ${act} to strike with the trishul when he is close. When he glows red, step back.`;
    case 'bells': return `Stand by the bell and press ${act} as the mark passes through the gold.`;
    case 'carry': return `Walk forward with ${walk}; steer left and right to keep it from tipping.`;
    case 'quiz': return `Walk to the shrine. The priest will ask about the story.`;
  }
}
