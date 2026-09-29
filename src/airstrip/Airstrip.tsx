import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { World } from './scene';
import { EVENTS, LOSE_FRACTION, LOSE_HOLD, TOOLS, TOOL_BY_ID, cost, createSim, resolveEvent, step, applyTool, type GameEvent, type Sim, type ToolId } from './sim';
import { IlloCafe, IlloDiary, IlloDistract, IlloLost, IlloNote, IlloPolice, IlloQuota, IlloRation, IlloRoom101, IlloWar, IlloWatchers, IlloYear, ToolIcon } from './art';

/**
 * Airstrip One — a game after George Orwell's Nineteen Eighty-Four.
 *
 * You are the Party. Set the quota, give them someone to hate, put up
 * telescreens, send the van — and keep their heads down until the year is
 * out. Everything is made in code: the square in three.js, the cards in SVG,
 * the sound in WebAudio. The text is ours; the novel is Orwell's (1949).
 */

type Phase = 'title' | 'tutorial' | 'play' | 'room101' | 'end';
const MONTHS = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
const SLOGANS = ['WAR IS PEACE', 'FREEDOM IS SLAVERY', 'IGNORANCE IS STRENGTH'];

/* ───────────── a little sound ───────────── */
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
  private tone(f: number, dur: number, type: OscillatorType = 'sine', vol = 0.08, slide = 0) {
    const c = this.ctx; if (!c || !this.on) return;
    const o = c.createOscillator(); o.type = type; o.frequency.value = f; if (slide) o.frequency.exponentialRampToValueAtTime(f * slide, c.currentTime + dur);
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, c.currentTime); g.gain.exponentialRampToValueAtTime(vol, c.currentTime + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
    o.connect(g).connect(c.destination); o.start(); o.stop(c.currentTime + dur + 0.05);
  }
  private hiss(dur: number, freq: number, vol: number) {
    const c = this.ctx; if (!c || !this.on || !this.noise) return;
    const s = c.createBufferSource(); s.buffer = this.noise; s.loop = true;
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 0.8;
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, c.currentTime); g.gain.exponentialRampToValueAtTime(vol, c.currentTime + 0.15); g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
    s.connect(f).connect(g).connect(c.destination); s.start(); s.stop(c.currentTime + dur + 0.1);
  }
  whistle() { this.tone(1680, 0.9, 'sine', 0.07); setTimeout(() => this.tone(1680, 0.5, 'sine', 0.05), 950); }
  click() { this.tone(660, 0.08, 'triangle', 0.06); }
  coin() { this.tone(1320 + Math.random() * 200, 0.12, 'triangle', 0.025); }
  roar() { this.hiss(1.6, 500, 0.12); this.tone(110, 1.2, 'sawtooth', 0.02, 0.8); }
  place() { this.tone(220, 0.2, 'square', 0.04, 0.6); this.tone(440, 0.15, 'triangle', 0.04); }
  van() { this.tone(70, 1.4, 'sawtooth', 0.03, 1.3); this.hiss(1, 200, 0.05); }
  bad() { this.tone(180, 0.4, 'square', 0.05, 0.7); }
}

/* ───────────── pieces of UI ───────────── */

function Card({ step, title, children, illo, actions, wide }: { step?: string; title: string; children?: React.ReactNode; illo?: React.ReactNode; actions: React.ReactNode; wide?: boolean }) {
  return (
    <div className="as-overlay">
      <div className={`as-card ${wide ? 'as-card--wide' : ''}`} role="dialog" aria-label={title}>
        {illo && <div className="as-illo-wrap">{illo}</div>}
        {step && <p className="as-step">{step}</p>}
        <h2 className="as-title">{title}</h2>
        <div className="as-body">{children}</div>
        <div className="as-actions">{actions}</div>
      </div>
    </div>
  );
}

function Btn({ children, onClick, dark, small }: { children: React.ReactNode; onClick: () => void; dark?: boolean; small?: boolean }) {
  return <button className={`as-btn ${dark ? 'as-btn--dark' : ''} ${small ? 'as-btn--small' : ''}`} onClick={onClick}>{children}</button>;
}

function Badges({ ids }: { ids: ToolId[] }) {
  return (
    <div className="as-badges">
      {ids.map((id) => { const t = TOOL_BY_ID[id]; return <span key={id} className="as-badge" title={`${t.name} · $${t.cost}`}><ToolIcon id={id} /><i>{t.key}</i></span>; })}
    </div>
  );
}

function QuotaBar({ sim, onChange, big }: { sim: Sim; onChange: (q: number) => void; big?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = (e: React.PointerEvent) => {
    if (e.buttons === 0 && e.type === 'pointermove') return;
    const r = ref.current!.getBoundingClientRect();
    onChange(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)));
  };
  const over = sim.quota > sim.tolerance;
  return (
    <div className={`as-quota ${big ? 'as-quota--big' : ''}`}>
      <span className="as-quota-v">{Math.round(sim.quota * 100)}%</span>
      <div
        className="as-quota-track"
        ref={ref}
        onPointerDown={(e) => { (e.target as HTMLElement).setPointerCapture(e.pointerId); drag(e); }}
        onPointerMove={drag}
        role="slider"
        aria-label="Work quota"
        aria-valuenow={Math.round(sim.quota * 100)}
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'ArrowRight') onChange(Math.min(1, sim.quota + 0.05)); if (e.key === 'ArrowLeft') onChange(Math.max(0, sim.quota - 0.05)); }}
      >
        <i className={`as-quota-fill ${over ? 'over' : ''}`} style={{ width: `${sim.quota * 100}%` }} />
        <b className="as-quota-line" style={{ left: `${sim.tolerance * 100}%` }} />
      </div>
      <button className="as-round" onClick={() => onChange(Math.min(1, sim.quota + 0.05))} aria-label="Raise the quota">+</button>
    </div>
  );
}

/* ───────────── the game ───────────── */

export function Airstrip({ onExit }: { onExit: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bubblesRef = useRef<HTMLDivElement>(null);
  const simRef = useRef<Sim>(createSim());
  const worldRef = useRef<World | null>(null);
  const sfx = useMemo(() => new Sfx(), []);
  const [phase, setPhase] = useState<Phase>('title');
  const [tut, setTut] = useState(0);
  const [, setTick] = useState(0);
  const [tool, setTool] = useState<ToolId | null>(null);
  const [event, setEvent] = useState<GameEvent | null>(null);
  const [room, setRoom] = useState({ stage: 0, tries: 0, said: '' });
  const [toast, setToast] = useState<{ text: string; t: number } | null>(null);
  const [paused, setPaused] = useState(false);
  const [answer, setAnswer] = useState('');
  const [answered, setAnswered] = useState<string | null>(null);
  const [sound, setSound] = useState(true);
  const phaseRef = useRef(phase); phaseRef.current = phase;
  const pausedRef = useRef(paused); pausedRef.current = paused;
  const toolRef = useRef(tool); toolRef.current = tool;
  const sim = simRef.current;

  useEffect(() => {
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = '/fonts-airstrip/fonts.css';
    document.head.appendChild(l);
    return () => l.remove();
  }, []);

  const say = useCallback((text: string) => setToast({ text, t: performance.now() }), []);

  /* the loop */
  useEffect(() => {
    const canvas = canvasRef.current!;
    const world = new World(canvas);
    worldRef.current = world;
    const size = () => world.resize(innerWidth, innerHeight);
    size();
    addEventListener('resize', size);
    let raf = 0, last = performance.now(), hudT = 0, lastPaid = 0;
    let shownEvent: GameEvent | null = null;
    const pool: HTMLDivElement[] = [];
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      const s = simRef.current;
      const ph = phaseRef.current;
      if (ph === 'play' && !pausedRef.current) {
        step(s, dt);
        if (s.paid.length > lastPaid && Math.random() < 0.2) sfx.coin();
        lastPaid = s.paid.length;
      } else if (ph === 'title' || ph === 'tutorial') step(s, dt, true);
      // an event from the calendar: show its card (once)
      if (ph === 'play' && s.pendingEvent && shownEvent !== s.pendingEvent) { shownEvent = s.pendingEvent; setEvent(s.pendingEvent); sfx.whistle(); }
      if (ph === 'play' && s.over && phaseRef.current === 'play') { setPhase('end'); if (s.over === 'lost') sfx.bad(); }
      world.sync(s, now / 1000);
      world.render();
      // speech bubbles over heads
      const host = bubblesRef.current;
      if (host) {
        let k = 0;
        for (const c of s.citizens) {
          if (!c.alive || c.wordT <= 0 || !c.word || k >= 18) continue;
          const p = world.screenOf(c.x, 2.2, c.z);
          if (!p.on) continue;
          let el = pool[k];
          if (!el) { el = document.createElement('div'); el.className = 'as-bubble'; host.appendChild(el); pool[k] = el; }
          if (el.textContent !== c.word) el.textContent = c.word;
          el.style.transform = `translate(${p.x.toFixed(0)}px, ${p.y.toFixed(0)}px) translate(-50%, -100%)`;
          el.style.opacity = String(Math.min(1, c.wordT * 2));
          el.style.display = '';
          el.classList.toggle('think', c.thinking);
          k++;
        }
        for (let j = k; j < pool.length; j++) pool[j]!.style.display = 'none';
      }
      if (now - hudT > 150) { hudT = now; setTick((x) => x + 1); }
    };
    raf = requestAnimationFrame(loop);
    if (import.meta.env.DEV) (window as unknown as Record<string, unknown>).__airstrip = { sim: () => simRef.current, world };
    return () => { cancelAnimationFrame(raf); removeEventListener('resize', size); world.dispose(); };
  }, [sfx]);

  /* keys */
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (phaseRef.current !== 'play' || event) return;
      const t = TOOLS.find((x) => x.key === e.key);
      if (t) { setTool((cur) => (cur === t.id ? null : t.id)); sfx.click(); }
      if (e.key === 'Escape') setTool(null);
      if (e.key === ' ') { e.preventDefault(); setPaused((p) => !p); }
      if (e.key === 'ArrowUp' || e.key === '+' || e.key === '=') simRef.current.quota = Math.min(1, simRef.current.quota + 0.05);
      if (e.key === 'ArrowDown' || e.key === '-') simRef.current.quota = Math.max(0, simRef.current.quota - 0.05);
    };
    addEventListener('keydown', k);
    return () => removeEventListener('keydown', k);
  }, [event, sfx]);

  /* the square: aim and use tools */
  const onMove = (e: React.PointerEvent) => {
    const w = worldRef.current; if (!w) return;
    w.pointer.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
    const t = toolRef.current;
    w.setGhost(t, t ? w.groundAt(e.clientX, e.clientY) : null);
  };
  const onClick = (e: React.PointerEvent) => {
    sfx.start();
    const w = worldRef.current; const t = toolRef.current;
    if (!w || !t || phase !== 'play' || event) return;
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

  const begin = () => { sfx.start(); setPhase('tutorial'); setTut(0); };
  const play = () => { sfx.start(); setPhase('play'); setTool(null); };
  const restart = () => {
    simRef.current = createSim();
    setEvent(null); setTool(null); setRoom({ stage: 0, tries: 0, said: '' }); setAnswer(''); setAnswered(null); setPaused(false);
    setPhase('play');
  };
  const closeEvent = (choice: 'ok' | 'rewrite' | 'lie' | 'truth') => {
    const e = event; if (!e) return;
    resolveEvent(sim, choice);
    setEvent(null);
    if (e.id === 'room101') { setPhase('room101'); setRoom({ stage: 0, tries: 0, said: '' }); sfx.whistle(); }
    if (e.id === 'war' && choice === 'rewrite' && sim.rewriteT <= 0) say('History corrected. It was always Eastasia.');
  };

  /* ───────────── render ───────────── */
  const month = Math.min(11, Math.floor(sim.month));
  const alive = sim.citizens.filter((c) => c.alive && c.kind !== 'child').length;
  const plan = sim.target > 0 ? sim.produced / sim.target : 1;
  const danger = sim.thinkingFrac >= LOSE_FRACTION;
  const tuts = [
    { title: 'THEY WORK FOR THE PARTY', illo: <IlloQuota />, body: <>Every citizen hands over what they make. Push the quota and they make more, but past the red line they start to think, and a citizen who is thinking has stopped working. The yellow ones are thinking. It is catching.</>, extra: <QuotaBar sim={sim} big onChange={(q) => { sim.quota = q; setTick((x) => x + 1); }} /> },
    { title: 'GIVE THEM SOMEONE TO HATE', illo: <IlloDistract />, body: <>Drop one on a knot of yellow and the heads go back down: the Two Minutes Hate, Victory Gin, the Lottery, a Hate Week rally. Cheap, and they wear off. They hold the line; they do not win the year.</>, extra: <Badges ids={['hate', 'gin', 'lottery', 'rally']} /> },
    { title: 'SOME KEEP WATCHING FOR YOU', illo: <IlloWatchers />, body: <>These cost more, and stay. A telescreen slows the thinking around it. Junior Spies follow thinkers and report them for free. The Records Desk makes arrests leave no rumours and fixes history. Every Newspeak Dictionary leaves fewer words to think with.</>, extra: <Badges ids={['telescreen', 'spies', 'minitrue', 'newspeak']} /> },
    { title: 'THE THOUGHT POLICE', illo: <IlloPolice />, body: <>Choose them, then click a thinker, and a van takes them away. They were never there. Everyone who saw it is afraid, and afraid people work slowly. Without a Records Desk, the rumours spread.</>, extra: <Badges ids={['police']} /> },
    { title: 'IT IS 1984', illo: <IlloYear month="JANUARY" />, body: <>Keep their heads down until December. If half the square is thinking at once for long enough, you have lost them. The year will not go quietly: a man is about to buy a diary.</>, extra: null },
  ];

  return (
    <div className={`as-root ${tool ? 'as-aiming' : ''}`}>
      <canvas ref={canvasRef} className="as-canvas" onPointerMove={onMove} onPointerDown={onClick} onContextMenu={(e) => { e.preventDefault(); setTool(null); }} />
      <div className="as-bubbles" ref={bubblesRef} aria-hidden />

      {phase === 'title' && (
        <div className="as-overlay as-overlay--title">
          <div className="as-titlecard">
            <p className="as-kicker">a game after George Orwell's <i>Nineteen Eighty-Four</i></p>
            <h1>AIRSTRIP ONE</h1>
            <p className="as-slogans">{SLOGANS.map((s) => <span key={s}>{s}</span>)}</p>
            <p className="as-lede">You are the Party. Keep them working. Keep their heads down. It is only for a year.</p>
            <div className="as-actions"><Btn dark onClick={begin}>BEGIN</Btn><Btn onClick={onExit}>LEAVE</Btn></div>
          </div>
        </div>
      )}

      {phase === 'tutorial' && (
        <Card
          step={`${tut + 1} OF 5`}
          title={tuts[tut]!.title}
          illo={<>{tuts[tut]!.illo}{tuts[tut]!.extra && <div className="as-illo-extra">{tuts[tut]!.extra}</div>}</>}
          actions={<><Btn onClick={play}>SKIP</Btn><Btn dark onClick={() => { sfx.click(); if (tut < 4) setTut(tut + 1); else play(); }}>{tut < 4 ? 'NEXT' : 'START THE YEAR'}</Btn></>}
        >{tuts[tut]!.body}</Card>
      )}

      {(phase === 'play' || phase === 'room101' || phase === 'end') && (
        <>
          <header className="as-hud">
            <div className="as-panel as-cal">
              <b>{MONTHS[month]}</b><span>1984</span>
              <i className="as-cal-bar"><em style={{ width: `${(sim.month / 12) * 100}%` }} /></i>
            </div>
            <div className="as-panel as-money">
              <b>${Math.floor(sim.credits)}</b>
              <span>PLAN {Math.round(plan * 100)}%</span>
            </div>
            <div className={`as-panel as-think ${danger ? 'danger' : ''}`}>
              <span>THINKING</span>
              <b>{Math.round(sim.thinkingFrac * 100)}%</b>
              <i className="as-think-bar"><em style={{ width: `${Math.min(100, sim.thinkingFrac * 100)}%` }} /><u style={{ left: `${LOSE_FRACTION * 100}%` }} /></i>
              {danger && <small>they are looking up · {Math.max(0, Math.ceil(LOSE_HOLD - sim.loseT))}</small>}
            </div>
            <div className="as-hud-btns">
              <button className="as-round" onClick={() => setPaused((p) => !p)} aria-label={paused ? 'Resume' : 'Pause'}>{paused ? '▶' : '❚❚'}</button>
              <button className="as-round" onClick={() => { const s = !sound; setSound(s); sfx.on = s; }} aria-label="Sound">{sound ? '♪' : '–'}</button>
              <button className="as-round" onClick={onExit} aria-label="Leave">×</button>
            </div>
          </header>

          {phase === 'play' && (
            <footer className="as-dock">
              <div className="as-panel as-dock-q"><span className="as-dock-l">QUOTA</span><QuotaBar sim={sim} onChange={(q) => { sim.quota = q; }} /></div>
              <div className="as-panel as-tools" role="toolbar" aria-label="Tools">
                {TOOLS.map((t) => {
                  const c = cost(sim, t);
                  return (
                    <button key={t.id} className={`as-tool ${tool === t.id ? 'on' : ''} ${sim.credits < c ? 'poor' : ''} as-tool--${t.kind}`} onClick={() => { sfx.start(); sfx.click(); setTool(tool === t.id ? null : t.id); }} title={`${t.name} — ${t.blurb}`}>
                      <ToolIcon id={t.id} /><i>{t.key}</i><small>${c}</small>
                    </button>
                  );
                })}
              </div>
              {tool && <p className="as-aimhint"><b>{TOOL_BY_ID[tool].name}</b> · {TOOL_BY_ID[tool].blurb} {TOOL_BY_ID[tool].kind === 'police' ? 'Click a thinker.' : 'Click the square.'} <em>Esc to cancel</em></p>}
            </footer>
          )}
          {paused && phase === 'play' && !event && <div className="as-paused">PAUSED</div>}
          {sim.hateWeekT > 0 && phase === 'play' && <div className="as-flag">HATE WEEK · distractions half price</div>}
          {sim.rewriteT > 0 && phase === 'play' && <div className="as-flag as-flag--warn">THE RECORDS ARE WRONG · {Math.ceil(sim.rewriteT)}s <button onClick={() => { const price = sim.buildings.some((b) => b.tool === 'minitrue') ? 0 : 60; if (sim.credits >= price) { sim.credits -= price; sim.rewriteT = 0; say('History corrected.'); } else say('Not enough in the treasury.'); }}>rewrite · ${sim.buildings.some((b) => b.tool === 'minitrue') ? 0 : 60}</button></div>}
          {toast && performance.now() - toast.t < 2600 && <div className="as-toast">{toast.text}</div>}
        </>
      )}

      {event && phase === 'play' && (
        <Card
          step={`${MONTHS[Math.min(11, Math.floor(event.month))]} 1984`}
          title={event.title}
          illo={event.id === 'room101' ? <IlloRoom101 /> : event.id === 'war' ? <IlloWar /> : event.id === 'hateweek' ? <IlloDistract /> : event.id === 'ration' ? <IlloRation /> : event.id === 'diary' ? <IlloDiary /> : event.id === 'julia' ? <IlloNote /> : <IlloYear />}
          actions={
            event.kind === 'rewrite' ? <><Btn onClick={() => closeEvent('ok')}>LEAVE IT</Btn><Btn dark onClick={() => closeEvent('rewrite')}>REWRITE · ${sim.buildings.some((b) => b.tool === 'minitrue') ? 0 : 60}</Btn></>
              : event.kind === 'ration' ? <><Btn onClick={() => closeEvent('truth')}>ANNOUNCE THE CUT</Btn><Btn dark onClick={() => closeEvent('lie')}>"RAISED TO 20g"</Btn></>
                : <Btn dark onClick={() => closeEvent('ok')}>{event.kind === 'room101' ? 'TAKE HIM' : 'UNDERSTOOD'}</Btn>
          }
        >{event.body}</Card>
      )}

      {phase === 'room101' && room.stage === 0 && (
        <Card
          step="ROOM 101"
          title="HOW MANY FINGERS?"
          illo={<IlloRoom101 />}
          actions={<>
            <Btn onClick={() => setRoom((r) => ({ stage: r.tries >= 2 ? 1 : 0, tries: r.tries + 1, said: 'four' }))}>FOUR</Btn>
            <Btn dark onClick={() => setRoom((r) => ({ stage: 1, tries: r.tries + 1, said: 'five' }))}>FIVE</Btn>
          </>}
        >
          {room.tries === 0 && <>O'Brien holds up his left hand, the thumb hidden, four fingers extended. He asks it gently, the way a doctor would. You answer for Winston.</>}
          {room.tries === 1 && <>"Four," he says. The needle on the dial by the bed moves. O'Brien looks almost sorry. "How many?"</>}
          {room.tries >= 2 && <>"Four. Four! What else can I say?" The needle moves again. "You are a slow learner, Winston. How many?"</>}
        </Card>
      )}
      {phase === 'room101' && room.stage === 1 && (
        <Card
          step="LATER"
          title="THE CHESTNUT TREE CAFÉ"
          illo={<IlloCafe />}
          actions={<Btn dark onClick={() => { setPhase('play'); sfx.click(); }}>FINISH THE YEAR</Btn>}
        >
          {room.said === 'five' ? <>"Five." And for a moment, it is true: he sees five. </> : <>In the end he says whatever he is told, and after a while it stops being a lie. </>}
          Months later he sits alone with a glass of gin under the telescreen. The war news is good. He looks up at the enormous face, and the struggle is over: he loves Big Brother now. There is nothing left in him to think with.
        </Card>
      )}

      {phase === 'end' && sim.over === 'won' && (
        <Card
          wide
          step="DECEMBER 31, 1984"
          title="THEY NEVER LOOKED UP"
          illo={<IlloYear month="DECEMBER" />}
          actions={<><Btn onClick={onExit}>LEAVE</Btn><Btn dark onClick={restart}>AGAIN</Btn></>}
        >
          <ul className="as-stats">
            <li><b>{Math.round(plan * 100)}%</b> of the Plan</li>
            <li><b>{sim.vanished}</b> unpersons</li>
            <li><b>{alive}</b> still working</li>
            <li><b>{sim.buildings.filter((b) => b.tool === 'telescreen').length}</b> telescreens</li>
          </ul>
          <p>You kept a whole city working and looking down for a year. Nobody had to be convinced of anything: they only had to be kept busy, afraid and entertained, and never all at the same moment free.</p>
          {!answered ? (
            <form className="as-final" onSubmit={(e) => { e.preventDefault(); setAnswered(answer.trim()); }}>
              <label>One last thing. <b>2 + 2 =</b></label>
              <input value={answer} onChange={(e) => setAnswer(e.target.value)} inputMode="numeric" maxLength={6} autoFocus aria-label="Two plus two" />
              <button className="as-btn as-btn--dark as-btn--small" type="submit">ANSWER</button>
            </form>
          ) : (
            <p className="as-verdict">{answered === '4' ? 'Four. Hold on to that one. Now put the phone down, and look up.' : answered === '5' ? 'Doubleplusgood. The Party thanks you. (It is four. It was always four.)' : `"${answered}". Whatever the Party says. (It is four. Look up.)`}</p>
          )}
        </Card>
      )}
      {phase === 'end' && sim.over === 'lost' && (
        <Card
          wide
          step={`${MONTHS[month]} 1984`}
          title="THEY LOOKED UP"
          illo={<IlloLost />}
          actions={<><Btn onClick={onExit}>LEAVE</Btn><Btn dark onClick={restart}>TRY AGAIN</Btn></>}
        >
          <p>Half the square stopped at once and thought about it, and the telescreens could not arrest them all. It turns out that if there was hope, it was in them the whole time.</p>
          <ul className="as-stats"><li><b>{Math.round(plan * 100)}%</b> of the Plan</li><li><b>{sim.vanished}</b> unpersons</li><li><b>{Math.round(sim.thinkingFrac * 100)}%</b> thinking</li></ul>
          <p className="as-verdict">(You lost. They won. Which side were you hoping for?)</p>
        </Card>
      )}

      <p className="as-credit">After <i>Nineteen Eighty-Four</i> by George Orwell (1949). The words here are ours.</p>
      {void EVENTS}
    </div>
  );
}
