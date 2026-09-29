import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { World } from './scene';
import {
  LOSE_FRACTION, LOSE_HOLD, TOOLS, TOOL_BY_ID, applyTool, cost, createSim, hasBuilding, markSuspect, planPct, plantAgent, rank, resolveEvent, spawnKnot, step,
  type GameEvent, type Sim, type ToolId,
} from './sim';
import { IlloCafe, IlloDiary, IlloDistract, IlloLost, IlloNote, IlloPolice, IlloQuota, IlloRation, IlloRoom101, IlloWar, IlloWatchers, IlloYear, ToolIcon } from './art';

/**
 * Airstrip One — a game after George Orwell's Nineteen Eighty-Four.
 *
 * You are the Party's administrator for Victory Square. The Induction walks
 * you through a first shift for real — set the quota, break up a knot of
 * thinkers, put up a telescreen, take a man away, catch a Brotherhood agent —
 * and then the year begins: Directives from the Inner Party, agents in the
 * crowd, and the calendar's events, until Room 101 and December.
 *
 * The look is Party paperwork on a telescreen: typewritten memos with
 * rubber stamps, consoles with scanlines, propaganda type.
 */

type Phase = 'title' | 'induction' | 'play' | 'room101' | 'end';
const MONTHS = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
const SLOGANS = ['WAR IS PEACE', 'FREEDOM IS SLAVERY', 'IGNORANCE IS STRENGTH'];

/* ───────────── sound ───────────── */
class Sfx {
  ctx: AudioContext | null = null;
  on = true;
  private noise: AudioBuffer | null = null;
  start() {
    if (this.ctx) { void this.ctx.resume(); return; }
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.noise = this.ctx.createBuffer(1, this.ctx.sampleRate, this.ctx.sampleRate);
    const d = this.noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  private tone(f: number, dur: number, type: OscillatorType = 'sine', vol = 0.08, slide = 0, delay = 0) {
    const c = this.ctx; if (!c || !this.on) return;
    const t0 = c.currentTime + delay;
    const o = c.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t0); if (slide) o.frequency.exponentialRampToValueAtTime(f * slide, t0 + dur);
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(c.destination); o.start(t0); o.stop(t0 + dur + 0.05);
  }
  private hiss(dur: number, freq: number, vol: number) {
    const c = this.ctx; if (!c || !this.on || !this.noise) return;
    const s = c.createBufferSource(); s.buffer = this.noise; s.loop = true;
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 0.8;
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, c.currentTime); g.gain.exponentialRampToValueAtTime(vol, c.currentTime + 0.15); g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
    s.connect(f).connect(g).connect(c.destination); s.start(); s.stop(c.currentTime + dur + 0.1);
  }
  whistle() { this.tone(1680, 0.9, 'sine', 0.06); this.tone(1680, 0.5, 'sine', 0.045, 0, 0.95); }
  click() { this.tone(660, 0.07, 'triangle', 0.05); }
  type() { this.hiss(0.03, 3000, 0.04); }
  coin() { this.tone(1320 + Math.random() * 200, 0.12, 'triangle', 0.02); }
  roar() { this.hiss(1.6, 500, 0.12); this.tone(110, 1.2, 'sawtooth', 0.02, 0.8); }
  place() { this.tone(220, 0.2, 'square', 0.035, 0.6); this.tone(440, 0.15, 'triangle', 0.035); }
  van() { this.tone(70, 1.4, 'sawtooth', 0.03, 1.3); this.hiss(1, 200, 0.05); }
  bad() { this.tone(180, 0.4, 'square', 0.045, 0.7); }
  stamp() { this.tone(90, 0.12, 'square', 0.08, 0.5); this.hiss(0.08, 900, 0.1); }
  medal() { [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.35, 'triangle', 0.06, 0, i * 0.09)); }
}

/* ───────────── paperwork ───────────── */

function Memo({ no, from, title, stamp, illo, children, actions, docked, wide }: {
  no?: string; from?: string; title: string; stamp?: string; illo?: React.ReactNode; children?: React.ReactNode; actions?: React.ReactNode; docked?: boolean; wide?: boolean;
}) {
  const inner = (
    <div className={`as-memo ${wide ? 'as-memo--wide' : ''} ${docked ? 'as-memo--docked' : ''}`} role="dialog" aria-label={title}>
      <div className="as-memo-head"><span>{from ?? 'MINISTRY OF LOVE'}</span><span>{no ?? 'MEMO'}</span></div>
      {illo && <div className="as-photo">{illo}<i className="as-clip" aria-hidden /></div>}
      <h2 className="as-memo-title">{title}</h2>
      <div className="as-memo-body">{children}</div>
      {actions && <div className="as-actions">{actions}</div>}
      {stamp && <b className="as-stamp">{stamp}</b>}
    </div>
  );
  return docked ? inner : <div className="as-overlay">{inner}</div>;
}

function Btn({ children, onClick, red, small, coach }: { children: React.ReactNode; onClick: () => void; red?: boolean; small?: boolean; coach?: string }) {
  return <button className={`as-btn ${red ? 'as-btn--red' : ''} ${small ? 'as-btn--small' : ''}`} onClick={onClick} data-coach={coach}>{children}</button>;
}

function QuotaLever({ sim, onChange }: { sim: Sim; onChange: (q: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = (e: React.PointerEvent) => {
    if (e.buttons === 0 && e.type === 'pointermove') return;
    const r = ref.current!.getBoundingClientRect();
    onChange(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)));
  };
  const over = sim.quota > sim.tolerance;
  return (
    <div className="as-lever" data-coach="quota">
      <span className="as-lever-l">QUOTA</span>
      <div
        className="as-lever-slot"
        ref={ref}
        onPointerDown={(e) => { (e.target as HTMLElement).setPointerCapture(e.pointerId); drag(e); }}
        onPointerMove={drag}
        role="slider"
        aria-label="Work quota"
        aria-valuenow={Math.round(sim.quota * 100)}
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'ArrowRight') onChange(Math.min(1, sim.quota + 0.05)); if (e.key === 'ArrowLeft') onChange(Math.max(0, sim.quota - 0.05)); }}
      >
        <i className="as-lever-danger" style={{ left: `${sim.tolerance * 100}%` }} />
        <i className={`as-lever-fill ${over ? 'over' : ''}`} style={{ width: `${sim.quota * 100}%` }} />
        <b className="as-lever-line" style={{ left: `${sim.tolerance * 100}%` }} />
        <em className="as-lever-knob" style={{ left: `${sim.quota * 100}%` }} />
      </div>
      <span className={`as-lever-v ${over ? 'over' : ''}`}>{Math.round(sim.quota * 100)}%</span>
    </div>
  );
}

/* ───────────── the Induction ───────────── */

interface Step { title: string; stamp?: string; body: React.ReactNode; coach?: string; button?: string }

const STEPS: Step[] = [
  { title: 'WELCOME, COMRADE ADMINISTRATOR', stamp: 'INDUCTION', body: <>You have been given Victory Square. Everything they make comes to the Party, and nothing they think should. This is your first shift. It is a short one, and it is being watched.</>, button: 'BEGIN THE SHIFT' },
  { title: 'THEIR WORK IS OUR WEALTH', stamp: 'STEP 1', coach: 'quota', body: <>Drag the <b>QUOTA</b> lever up to the <b className="red">red line</b>. The higher the quota, the more they make. Past the line, they begin to think.</> },
  { title: 'YELLOW MEANS THINKING', stamp: 'STEP 2', coach: 'tool-hate', body: <>Somebody is thinking, and it is spreading. A thinker stops working and looks up. Choose the <b>TWO MINUTES HATE</b> (key 1) and drop it on the <b className="red">ringed knot</b>.</> },
  { title: 'DISTRACTIONS WEAR OFF', stamp: 'STEP 3', coach: 'tool-telescreen', body: <>Telescreens do not. Put one up (key 5) where the crowd is thickest. Under its eye, thinking fades.</> },
  { title: 'AN EXAMPLE', stamp: 'STEP 4', coach: 'tool-police', body: <>This one has written something down, and nothing will distract him. Choose the <b>THOUGHT POLICE</b> (key 9) and click him. Watch the bystanders: they freeze, and afraid people work badly. Take an innocent, and they will talk.</> },
  { title: 'NOT EVERY ENEMY LOOKS UP', stamp: 'STEP 5', coach: 'tool-police', body: <>A Brotherhood agent looks like everyone else and whispers doubt as he passes. Under a <b>telescreen</b>, or near a <b>Junior Spy</b>, he shows up <b className="red">black, with a red head</b>. There is one under your telescreen now. Take him.</> },
  { title: 'YOUR YEAR', stamp: 'APPROVED', coach: 'meter', body: <>Twelve months, four minutes. Watch the <b>THINKING</b> meter: if half the square thinks at once for long enough, you have lost them. The Inner Party will send <b>Directives</b>; meet them for medals. And the calendar will bring trouble of its own.</>, button: 'BEGIN 1984' },
];

/* ───────────── the game ───────────── */

export function Airstrip({ onExit }: { onExit: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bubblesRef = useRef<HTMLDivElement>(null);
  const popsRef = useRef<HTMLDivElement>(null);
  const coachRef = useRef<HTMLDivElement>(null);
  const simRef = useRef<Sim>(createSim('demo'));
  const worldRef = useRef<World | null>(null);
  const sfx = useMemo(() => new Sfx(), []);
  const [phase, setPhase] = useState<Phase>('title');
  const [stepI, setStepI] = useState(0);
  const [, setTick] = useState(0);
  const [tool, setTool] = useState<ToolId | null>(null);
  const [event, setEvent] = useState<GameEvent | null>(null);
  const [room, setRoom] = useState({ stage: 0, tries: 0, said: '' });
  const [toast, setToast] = useState<{ text: string; t: number } | null>(null);
  const [report, setReport] = useState<{ i: number; t: number } | null>(null);
  const [paused, setPaused] = useState(false);
  const [answer, setAnswer] = useState('');
  const [answered, setAnswered] = useState<string | null>(null);
  const [sound, setSound] = useState(true);
  const [ticker, setTicker] = useState(0);
  const phaseRef = useRef(phase); phaseRef.current = phase;
  const pausedRef = useRef(paused); pausedRef.current = paused;
  const toolRef = useRef(tool); toolRef.current = tool;
  const stepRef = useRef(stepI); stepRef.current = stepI;
  const props = useRef<{ knot: number[]; suspect: number; agent: number; screen: { x: number; z: number } | null }>({ knot: [], suspect: -1, agent: -1, screen: null });
  const sim = simRef.current;

  useEffect(() => {
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = '/fonts-airstrip/fonts.css';
    document.head.appendChild(l);
    return () => l.remove();
  }, []);

  const say = useCallback((text: string) => setToast({ text, t: performance.now() }), []);

  /* the Induction: set each step up, and notice when it is done */
  const setupStep = useCallback((i: number) => {
    const s = simRef.current, w = worldRef.current;
    w?.setHighlight(null);
    if (i === 2) { props.current.knot = spawnKnot(s, 8, 3, 6); w?.setHighlight(8, 3, 3.2); }
    if (i === 3) { s.credits = Math.max(s.credits, 200); w?.setHighlight(-6, 1, 7); }
    if (i === 4) { s.credits = Math.max(s.credits, 150); props.current.suspect = markSuspect(s, 3, -5); w?.setHighlight(3, -5, 1.6); }
    if (i === 5) {
      s.credits = Math.max(s.credits, 150);
      const scr = s.buildings.find((b) => b.tool === 'telescreen');
      const at = scr ? { x: scr.x + 2.2, z: scr.z + 1 } : { x: -4, z: 2 };
      props.current.agent = plantAgent(s, at.x, at.z);
      const a = s.citizens.find((c) => c.id === props.current.agent)!;
      a.pinned = true;
      if (!scr) a.revealed = 99;
      w?.setHighlight(at.x, at.z, 1.8);
    }
  }, []);
  const stepDone = useCallback((i: number, s: Sim) => {
    if (i === 1) return s.quota >= s.tolerance - 0.02;
    if (i === 2) return props.current.knot.every((id) => { const c = s.citizens.find((o) => o.id === id); return !c || !c.thinking; });
    if (i === 3) return hasBuilding(s, 'telescreen');
    if (i === 4) return s.citizens.some((c) => c.id === props.current.suspect && (c.vanish > 0 || !c.alive));
    if (i === 5) return s.stats.agents > 0;
    return false;
  }, []);
  const nextStep = useCallback(() => {
    const i = stepRef.current + 1;
    if (i >= STEPS.length) return;
    sfx.stamp();
    setStepI(i);
    setupStep(i);
    setTool(null);
  }, [setupStep, sfx]);

  /* the loop */
  useEffect(() => {
    const canvas = canvasRef.current!;
    const world = new World(canvas);
    worldRef.current = world;
    const size = () => world.resize(innerWidth, innerHeight);
    size();
    addEventListener('resize', size);
    let raf = 0, last = performance.now(), hudT = 0, lastPaid = 0, doneAt = 0, lastReports = 0, lastPops = 0;
    let shownEvent: GameEvent | null = null;
    const bubbles: HTMLDivElement[] = [];
    const pops = new Map<number, HTMLDivElement>();
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      const s = simRef.current;
      const ph = phaseRef.current;
      if ((ph === 'play' || ph === 'induction') && !pausedRef.current) {
        step(s, dt);
        if (s.paid.length > lastPaid && Math.random() < 0.15) sfx.coin();
        lastPaid = s.paid.length;
      } else if (ph === 'title') step(s, dt);
      if (ph === 'induction') {
        const i = stepRef.current;
        if (stepDone(i, s)) { if (!doneAt) doneAt = now; else if (now - doneAt > 1100) { doneAt = 0; nextStep(); } }
        else doneAt = 0;
      }
      if (ph === 'play' && s.pendingEvent && shownEvent !== s.pendingEvent) { shownEvent = s.pendingEvent; setEvent(s.pendingEvent); sfx.whistle(); }
      if (ph === 'play' && s.over && phaseRef.current === 'play') { setPhase('end'); if (s.over === 'lost') sfx.bad(); else sfx.medal(); }
      if (s.reports.length > lastReports) { lastReports = s.reports.length; setReport({ i: lastReports - 1, t: now }); sfx.type(); }
      if (s.pops.length && s.pops[s.pops.length - 1]!.id !== lastPops) {
        const p = s.pops[s.pops.length - 1]!; lastPops = p.id;
        if (p.kind === 'good' && p.text.startsWith('DIRECTIVE')) sfx.medal();
        else if (p.kind === 'bad') sfx.bad();
      }
      world.sync(s, now / 1000);
      world.render();
      // speech bubbles and markers over heads
      const host = bubblesRef.current;
      if (host) {
        let k = 0;
        const put = (text: string, x: number, z: number, cls: string, alpha: number) => {
          const p = world.screenOf(x, 2.35, z);
          if (!p.on) return;
          let el = bubbles[k];
          if (!el) { el = document.createElement('div'); host.appendChild(el); bubbles[k] = el; }
          if (el.textContent !== text) el.textContent = text;
          if (el.className !== cls) el.className = cls;
          el.style.transform = `translate(${p.x.toFixed(0)}px, ${p.y.toFixed(0)}px) translate(-50%, -100%)`;
          el.style.opacity = String(alpha);
          el.style.display = '';
          k++;
        };
        for (const c of s.citizens) {
          if (!c.alive || c.vanish > 0 || k >= 22) continue;
          if (c.suspect) put('THE DIARY', c.x, c.z, 'as-mark', 1);
          else if (c.agent && c.revealed > 0) put('BROTHERHOOD', c.x, c.z, 'as-mark', 1);
          else if (c.special === 'winston' && ph === 'play') put('WINSTON', c.x, c.z, 'as-mark as-mark--w', 1);
          else if (c.wordT > 0 && c.word) put(c.word, c.x, c.z, `as-bubble ${c.thinking ? 'think' : ''} ${c.agent ? 'whisper' : ''}`, Math.min(1, c.wordT * 2));
        }
        for (let j = k; j < bubbles.length; j++) bubbles[j]!.style.display = 'none';
      }
      // floating numbers and cries
      const ph2 = popsRef.current;
      if (ph2) {
        const live = new Set<number>();
        for (const p of s.pops) {
          live.add(p.id);
          let el = pops.get(p.id);
          if (!el) { el = document.createElement('div'); el.className = `as-pop as-pop--${p.kind}`; el.textContent = p.text; ph2.appendChild(el); pops.set(p.id, el); }
          const q = world.screenOf(p.x, 3 + p.t * 1.6, p.z);
          el.style.transform = `translate(${q.x.toFixed(0)}px, ${q.y.toFixed(0)}px) translate(-50%, -50%) scale(${Math.min(1, p.t * 6)})`;
          el.style.opacity = String(Math.min(1, (2.2 - p.t) * 1.5));
        }
        for (const [id, el] of pops) if (!live.has(id)) { el.remove(); pops.delete(id); }
      }
      // the Induction's pointing hand
      const coach = coachRef.current;
      if (coach) {
        const key = ph === 'induction' ? STEPS[stepRef.current]?.coach : undefined;
        const el = key ? document.querySelector(`[data-coach="${key}"]`) : null;
        document.querySelectorAll('.as-coached').forEach((x) => { if (x !== el) x.classList.remove('as-coached'); });
        if (el) {
          el.classList.add('as-coached');
          const r = el.getBoundingClientRect();
          coach.style.display = '';
          coach.style.transform = `translate(${(r.left + r.width / 2).toFixed(0)}px, ${(r.top - 8 + Math.sin(now / 180) * 5).toFixed(0)}px)`;
        } else coach.style.display = 'none';
      }
      if (now - hudT > 150) { hudT = now; setTick((x) => x + 1); }
    };
    raf = requestAnimationFrame(loop);
    const tick = setInterval(() => setTicker((x) => x + 1), 6000);
    if (import.meta.env.DEV) (window as unknown as Record<string, unknown>).__airstrip = { sim: () => simRef.current, world };
    return () => { cancelAnimationFrame(raf); clearInterval(tick); removeEventListener('resize', size); world.dispose(); };
  }, [sfx, stepDone, nextStep]);

  /* keys */
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      const ph = phaseRef.current;
      if ((ph !== 'play' && ph !== 'induction') || event) return;
      const t = TOOLS.find((x) => x.key === e.key);
      if (t) { setTool((cur) => (cur === t.id ? null : t.id)); sfx.click(); }
      if (e.key === 'Escape') setTool(null);
      if (e.key === ' ' && ph === 'play') { e.preventDefault(); setPaused((p) => !p); }
      if (e.key === 'ArrowUp' || e.key === '+' || e.key === '=') simRef.current.quota = Math.min(1, simRef.current.quota + 0.05);
      if (e.key === 'ArrowDown' || e.key === '-') simRef.current.quota = Math.max(0, simRef.current.quota - 0.05);
    };
    addEventListener('keydown', k);
    return () => removeEventListener('keydown', k);
  }, [event, sfx]);

  /* aim and use tools */
  const onMove = (e: React.PointerEvent) => {
    const w = worldRef.current; if (!w) return;
    w.pointer.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
    const t = toolRef.current;
    w.setGhost(t, t ? w.groundAt(e.clientX, e.clientY) : null);
  };
  const onClick = (e: React.PointerEvent) => {
    sfx.start();
    const w = worldRef.current; const t = toolRef.current;
    if (!w || !t || (phase !== 'play' && phase !== 'induction') || event) return;
    const g = w.groundAt(e.clientX, e.clientY);
    if (!g) return;
    const target = t === 'police' ? w.citizenAt(sim, e.clientX, e.clientY) ?? undefined : undefined;
    const why = applyTool(sim, t, g.x, g.z, target);
    if (why) { say(why); sfx.bad(); return; }
    const def = TOOL_BY_ID[t];
    if (def.kind === 'distract') { if (t === 'hate' || t === 'rally') sfx.roar(); else sfx.place(); }
    else if (def.kind === 'build') sfx.place();
    else sfx.van();
    if (def.kind === 'build' || def.kind === 'police') setTool(null);
  };

  const induct = () => { sfx.start(); sfx.stamp(); simRef.current = createSim('induction'); simRef.current.quota = 0.2; setPhase('induction'); setStepI(0); };
  const startYear = () => {
    sfx.start(); sfx.stamp();
    worldRef.current?.setHighlight(null);
    simRef.current = createSim('year');
    setEvent(null); setTool(null); setRoom({ stage: 0, tries: 0, said: '' }); setAnswer(''); setAnswered(null); setPaused(false); setReport(null);
    setPhase('play');
  };
  const closeEvent = (choice: 'ok' | 'rewrite' | 'lie' | 'truth') => {
    const e = event; if (!e) return;
    sfx.stamp();
    resolveEvent(sim, choice);
    setEvent(null);
    if (e.id === 'room101') { setPhase('room101'); setRoom({ stage: 0, tries: 0, said: '' }); }
  };

  /* ───────────── what to show ───────────── */
  const inGame = phase === 'play' || phase === 'room101' || phase === 'end' || phase === 'induction';
  const month = Math.min(11, Math.floor(sim.month));
  const alive = sim.citizens.filter((c) => c.alive && c.kind !== 'child').length;
  const plan = planPct(sim);
  const danger = sim.thinkingFrac >= LOSE_FRACTION && phase === 'play';
  const d = sim.directive;
  const rk = rank(sim);
  const tickerLines = [
    ...SLOGANS,
    `PRODUCTION OF BOOTS AT ${Math.round(plan * 100)}% OF THE PLAN`,
    `THE CHOCOLATE RATION HAS BEEN RAISED TO ${sim.rationBoost > 0 ? '20' : '25'} GRAMMES`,
    `OCEANIA IS WINNING THE WAR`,
    `${sim.vanished} CITIZENS HAVE NEVER EXISTED`,
    'THE TELESCREEN RECEIVES AND TRANSMITS SIMULTANEOUSLY',
    'THOUGHTCRIME DOES NOT ENTAIL DEATH: THOUGHTCRIME IS DEATH',
  ];
  const rep = report && performance.now() - report.t < 3600 ? sim.reports[report.i] : null;

  return (
    <div className={`as-root ${tool ? 'as-aiming' : ''} as-phase-${phase}`}>
      <canvas ref={canvasRef} className="as-canvas" onPointerMove={onMove} onPointerDown={onClick} onContextMenu={(e) => { e.preventDefault(); setTool(null); }} />
      <div className="as-bubbles" ref={bubblesRef} aria-hidden />
      <div className="as-pops" ref={popsRef} aria-hidden />
      <div className="as-scan" aria-hidden />
      <div className="as-coach" ref={coachRef} aria-hidden>▼</div>

      {phase === 'title' && (
        <div className="as-overlay as-overlay--title">
          <div className="as-poster">
            <div className="as-poster-face"><IlloQuota /></div>
            <div className="as-poster-text">
              <p className="as-kicker">A GAME AFTER GEORGE ORWELL'S NINETEEN EIGHTY-FOUR</p>
              <h1>AIRSTRIP<br />ONE</h1>
              <p className="as-slogans">{SLOGANS.map((s) => <span key={s}>{s}</span>)}</p>
              <p className="as-lede">You run Victory Square for the Party. Keep them working. Keep their heads down. It is only for a year.</p>
              <div className="as-actions as-actions--left"><Btn red onClick={induct}>BEGIN INDUCTION</Btn><Btn onClick={startYear}>SKIP TO 1984</Btn></div>
            </div>
          </div>
        </div>
      )}

      {inGame && (
        <>
          <header className="as-hud">
            <div className="as-tv as-cal">
              <span className="as-tv-l">{phase === 'induction' ? 'INDUCTION' : 'OCEANIA'}</span>
              <b>{phase === 'induction' ? 'FIRST SHIFT' : <>{MONTHS[month]} <span className="as-yr">1984</span></>}</b>
              <i className="as-cal-bar"><em style={{ width: `${phase === 'induction' ? (stepI / (STEPS.length - 1)) * 100 : (sim.month / 12) * 100}%` }} /></i>
            </div>
            <div className="as-tv as-ticker" aria-live="off"><span key={ticker}>{tickerLines[ticker % tickerLines.length]}</span></div>
            <div className="as-tv as-money">
              <span className="as-tv-l">TREASURY</span>
              <b>${Math.floor(sim.credits)}</b>
              {phase !== 'induction' && <small>PLAN {Math.round(plan * 100)}% · {sim.stats.medals}★</small>}
            </div>
            <div className={`as-tv as-think ${danger ? 'danger' : ''}`} data-coach="meter">
              <span className="as-tv-l">THINKING</span>
              <b>{Math.round(sim.thinkingFrac * 100)}%</b>
              <i className="as-think-bar"><em style={{ width: `${Math.min(100, sim.thinkingFrac * 100)}%` }} /><u style={{ left: `${LOSE_FRACTION * 100}%` }} /></i>
              {danger && <small>THEY ARE LOOKING UP · {Math.max(0, Math.ceil(LOSE_HOLD - sim.loseT))}</small>}
            </div>
            <div className="as-hud-btns">
              {phase === 'play' && <button className="as-knob" onClick={() => setPaused((p) => !p)} aria-label={paused ? 'Resume' : 'Pause'}>{paused ? '▶' : '❚❚'}</button>}
              <button className="as-knob" onClick={() => { const s2 = !sound; setSound(s2); sfx.on = s2; }} aria-label="Sound">{sound ? '♪' : '–'}</button>
              <button className="as-knob" onClick={onExit} aria-label="Leave">×</button>
            </div>
          </header>

          {phase === 'play' && d && (
            <aside className={`as-directive as-directive--${d.state}`}>
              <span className="as-directive-h">INNER PARTY DIRECTIVE</span>
              <b>{d.title}</b>
              <p>{d.text}</p>
              <i className="as-directive-bar"><em style={{ width: `${Math.min(1, d.prog) * 100}%` }} /></i>
              <small>{d.state === 'active' ? `${Math.max(0, Math.ceil(d.limit - d.t))}s · reward $${d.reward} + ★` : d.state === 'done' ? 'MET · MEDAL AWARDED' : 'FAILED · THE PARTY IS DISPLEASED'}</small>
              {d.state !== 'active' && <b className="as-stamp as-stamp--small">{d.state === 'done' ? 'MET' : 'FAILED'}</b>}
            </aside>
          )}

          {(phase === 'play' || phase === 'induction') && (
            <footer className="as-dock">
              <div className="as-tv as-dock-q"><QuotaLever sim={sim} onChange={(q) => { sim.quota = q; }} /></div>
              <div className="as-tv as-tools" role="toolbar" aria-label="Tools">
                {TOOLS.map((t) => {
                  const c = cost(sim, t);
                  return (
                    <button key={t.id} data-coach={`tool-${t.id}`} className={`as-tool ${tool === t.id ? 'on' : ''} ${sim.credits < c ? 'poor' : ''} as-tool--${t.kind}`} onClick={() => { sfx.start(); sfx.click(); setTool(tool === t.id ? null : t.id); }} title={`${t.name} — ${t.blurb}`}>
                      <ToolIcon id={t.id} /><i>{t.key}</i><small>${c}</small>
                    </button>
                  );
                })}
              </div>
              {tool && <p className="as-aimhint"><b>{TOOL_BY_ID[tool].name}</b> · {TOOL_BY_ID[tool].blurb} <em>{TOOL_BY_ID[tool].kind === 'police' ? 'Click someone.' : 'Click the square.'} Esc to cancel.</em></p>}
            </footer>
          )}
          {paused && phase === 'play' && !event && <div className="as-paused">TRANSMISSION PAUSED</div>}
          {sim.hateWeekT > 0 && phase === 'play' && <div className="as-flag">HATE WEEK · distractions half price</div>}
          {sim.displeasureT > 0 && phase === 'play' && <div className="as-flag as-flag--dark">THE INNER PARTY IS WATCHING YOU · the crowd bears less</div>}
          {sim.rewriteT > 0 && phase === 'play' && <div className="as-flag as-flag--warn">THE RECORDS ARE WRONG · {Math.ceil(sim.rewriteT)}s <button onClick={() => { const price = hasBuilding(sim, 'minitrue') ? 0 : 60; if (sim.credits >= price) { sim.credits -= price; sim.rewriteT = 0; say('History corrected. It was always so.'); sfx.stamp(); } else say('Not enough in the treasury.'); }}>rewrite · ${hasBuilding(sim, 'minitrue') ? 0 : 60}</button></div>}
          {toast && performance.now() - toast.t < 2600 && <div className="as-toast">{toast.text}</div>}
          {rep && phase === 'play' && (
            <div className="as-report">
              <span>{MONTHS[rep.month]} · MONTHLY RETURN</span>
              <b>PLAN {Math.round(rep.plan * 100)}%</b>
              <small>{Math.round(rep.thinking * 100)}% thinking · {rep.arrests} taken · {rep.medals}★</small>
            </div>
          )}
        </>
      )}

      {phase === 'induction' && (
        <Memo
          docked
          no={`INDUCTION ${stepI + 1}/${STEPS.length}`}
          from="FROM THE OFFICE OF O'BRIEN"
          title={STEPS[stepI]!.title}
          stamp={STEPS[stepI]!.stamp}
          actions={STEPS[stepI]!.button ? <><Btn red onClick={() => { if (stepI === STEPS.length - 1) startYear(); else nextStep(); }}>{STEPS[stepI]!.button}</Btn>{stepI === 0 && <Btn small onClick={startYear}>SKIP</Btn>}</> : <span className="as-waiting">{stepDone(stepI, sim) ? '✓ DONE' : 'waiting for you…'}</span>}
        >{STEPS[stepI]!.body}</Memo>
      )}

      {event && phase === 'play' && (
        <Memo
          no={`${MONTHS[Math.min(11, Math.floor(event.month))]} 1984`}
          from={event.id === 'war' ? 'MINISTRY OF TRUTH · RECORDS' : event.id === 'room101' ? 'MINISTRY OF LOVE' : event.id === 'ration' ? 'MINISTRY OF PLENTY' : 'THOUGHT POLICE · BULLETIN'}
          title={event.title}
          stamp={event.kind === 'room101' ? 'ROOM 101' : event.kind === 'rewrite' ? 'URGENT' : 'NOTED'}
          illo={event.id === 'room101' ? <IlloRoom101 /> : event.id === 'war' ? <IlloWar /> : event.id === 'hateweek' ? <IlloDistract /> : event.id === 'ration' ? <IlloRation /> : event.id === 'diary' ? <IlloDiary /> : event.id === 'julia' ? <IlloNote /> : <IlloYear />}
          actions={
            event.kind === 'rewrite' ? <><Btn onClick={() => closeEvent('ok')}>LEAVE IT</Btn><Btn red onClick={() => closeEvent('rewrite')}>REWRITE · ${hasBuilding(sim, 'minitrue') ? 0 : 60}</Btn></>
              : event.kind === 'ration' ? <><Btn onClick={() => closeEvent('truth')}>ANNOUNCE THE CUT</Btn><Btn red onClick={() => closeEvent('lie')}>"RAISED TO 20g"</Btn></>
                : <Btn red onClick={() => closeEvent('ok')}>{event.kind === 'room101' ? 'TAKE HIM' : 'UNDERSTOOD'}</Btn>
          }
        >{event.body}</Memo>
      )}

      {phase === 'room101' && room.stage === 0 && (
        <Memo
          from="MINISTRY OF LOVE"
          no="ROOM 101"
          title="HOW MANY FINGERS?"
          stamp="ROOM 101"
          illo={<IlloRoom101 />}
          actions={<>
            <Btn onClick={() => setRoom((r) => ({ stage: r.tries >= 2 ? 1 : 0, tries: r.tries + 1, said: 'four' }))}>FOUR</Btn>
            <Btn red onClick={() => setRoom((r) => ({ stage: 1, tries: r.tries + 1, said: 'five' }))}>FIVE</Btn>
          </>}
        >
          {room.tries === 0 && <>O'Brien holds up his left hand, the thumb hidden, four fingers extended. He asks it gently, the way a doctor would. You answer for Winston.</>}
          {room.tries === 1 && <>"Four," he says. The needle on the dial by the bed moves. O'Brien looks almost sorry. "How many?"</>}
          {room.tries >= 2 && <>"Four. Four! What else can I say?" The needle moves again. "You are a slow learner, Winston. How many?"</>}
        </Memo>
      )}
      {phase === 'room101' && room.stage === 1 && (
        <Memo
          from="LATER"
          no="THE CHESTNUT TREE CAFÉ"
          title="THE STRUGGLE IS OVER"
          illo={<IlloCafe />}
          actions={<Btn red onClick={() => { setPhase('play'); sfx.click(); }}>FINISH THE YEAR</Btn>}
        >
          {room.said === 'five' ? <>"Five." And for a moment it is true: he sees five. </> : <>In the end he says whatever he is told, and after a while it stops being a lie. </>}
          Months later he sits alone with a glass of gin under the telescreen. The war news is good. He looks up at the enormous face and loves it. There is nothing left in him to think with.
        </Memo>
      )}

      {phase === 'end' && sim.over === 'won' && (
        <Memo
          wide
          from="MINISTRY OF LOVE · PERSONNEL"
          no="DECEMBER 31, 1984"
          title="THEY NEVER LOOKED UP"
          stamp={rk.title}
          illo={<IlloYear month="DECEMBER" />}
          actions={<><Btn onClick={onExit}>LEAVE</Btn><Btn red onClick={startYear}>ANOTHER YEAR</Btn></>}
        >
          <ul className="as-stats">
            <li><b>{Math.round(plan * 100)}%</b> of the Plan</li>
            <li><b>{sim.stats.medals}★</b> directives met</li>
            <li><b>{sim.stats.agents}</b> agents caught</li>
            <li><b>{sim.vanished}</b> unpersons</li>
            <li><b>×{sim.stats.bestCombo}</b> best Hate</li>
            <li><b>{alive}</b> still working</li>
          </ul>
          <p className="as-rank">Grade: <b>{rk.title}</b> ({rk.score}). {rk.line}</p>
          <p>You kept a whole city working and looking down for a year. Nobody had to be convinced of anything: they only had to be kept busy, afraid and entertained, and never all free at the same moment.</p>
          {!answered ? (
            <form className="as-final" onSubmit={(e) => { e.preventDefault(); setAnswered(answer.trim()); }}>
              <label>One last question. <b>2 + 2 =</b></label>
              <input value={answer} onChange={(e) => setAnswer(e.target.value)} inputMode="numeric" maxLength={6} autoFocus aria-label="Two plus two" />
              <button className="as-btn as-btn--red as-btn--small" type="submit">ANSWER</button>
            </form>
          ) : (
            <p className="as-verdict">{answered === '4' ? 'Four. Hold on to that one. Now put the phone down, and look up.' : answered === '5' ? 'Doubleplusgood. The Party thanks you. (It is four. It was always four.)' : `"${answered}". Whatever the Party says. (It is four. Look up.)`}</p>
          )}
        </Memo>
      )}
      {phase === 'end' && sim.over === 'lost' && (
        <Memo
          wide
          from="THOUGHT POLICE · INCIDENT REPORT"
          no={`${MONTHS[month]} 1984`}
          title="THEY LOOKED UP"
          stamp="INCIDENT"
          illo={<IlloLost />}
          actions={<><Btn onClick={onExit}>LEAVE</Btn><Btn red onClick={startYear}>TRY AGAIN</Btn></>}
        >
          <p>Half the square stopped at once and thought about it, and the telescreens could not arrest them all. It turns out that if there was hope, it was in them the whole time.</p>
          <ul className="as-stats"><li><b>{Math.round(plan * 100)}%</b> of the Plan</li><li><b>{sim.stats.medals}★</b> directives</li><li><b>{sim.vanished}</b> unpersons</li><li><b>{Math.round(sim.thinkingFrac * 100)}%</b> thinking</li></ul>
          <p className="as-verdict">(You lost. They won. Which side were you hoping for?)</p>
        </Memo>
      )}

      <p className="as-credit">After <i>Nineteen Eighty-Four</i> by George Orwell (1949). The words here are ours.</p>
      {void [IlloWatchers, IlloPolice]}
    </div>
  );
}
