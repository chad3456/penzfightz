import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import Lenis from 'lenis';
import { Stage } from '../stage';
import { Sound, Voice } from '../audio';
import { SCENES } from './scenes';
import { BEATS, ERAS, type Beat, type Mark } from './story';
import { ChoiceGate, HoldGate, RubGate, TraceGate, type Sfx } from './Gates';
import { drawInventory, drawMetal } from './coin';

/**
 * Ghost Days, played. Scrolling runs the story the way the story runs its
 * function: down the call stack from 2313 to 1989 to 1905, and back up.
 * The camera flies through painted dioramas; the narrator speaks in cards;
 * at the gates the scroll stops until you rub, hold or trace.
 */

const BEDS = ['nova', 'dance', 'hk', 'sea', 'nova', 'nova'] as const;
const MARK_NOTES: Record<Mark, string> = {
  patina: 'green patina, three thousand years thick',
  zi: '字 · a father\'s reading, carved in Hong Kong, 1905',
  initials: 'F · C · scratched with a stone on a Connecticut beach, 1989',
  alien: 'the hooks of a dead people\'s script, Nova Pacifica',
  gleam: 'a bright place, shaped like a little person: rubbed clean, new',
};

const starts: number[] = [];
{ let a = 0; for (const b of BEATS) { starts.push(a); a += b.len; } starts.push(a); }
const TOTAL = starts[starts.length - 1]!;
const isGate = (b: Beat) => b.kind === 'rub' || b.kind === 'hold' || b.kind === 'trace' || b.kind === 'choice';

function beatAt(pos: number) {
  let i = 0;
  while (i < BEATS.length - 1 && pos >= starts[i + 1]!) i++;
  return i;
}

export function GhostDays({ onExit }: { onExit: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const invRef = useRef<HTMLCanvasElement>(null);
  const stackRef = useRef<HTMLOListElement>(null);
  const endCoinRef = useRef<HTMLCanvasElement>(null);
  const [beatIdx, setBeatIdx] = useState(0);
  const [scene, setScene] = useState(0);
  const [gate, setGate] = useState(-1);
  const [marks, setMarks] = useState<Set<Mark>>(() => new Set());
  const [choices, setChoices] = useState<Record<string, number>>({});
  const [ready, setReady] = useState(false);
  const [sound, setSound] = useState(true);
  const [voiceOn, setVoiceOn] = useState(false);
  const [showMarks, setShowMarks] = useState(false);
  const solved = useRef(new Set<number>());
  const lenisRef = useRef<Lenis | null>(null);
  const stageRef = useRef<Stage | null>(null);
  const soundRef = useRef<Sound | null>(null);
  const voiceRef = useRef<Voice | null>(null);
  const gateRef = useRef(-1);
  gateRef.current = gate;

  const low = useMemo(() => new URLSearchParams(location.search).has('low') || Math.min(innerWidth, innerHeight) < 600 || (navigator.hardwareConcurrency ?? 8) <= 4, []);

  // the sacred fonts are shared across the shelf; this piece uses Cormorant and Cinzel from it
  useEffect(() => {
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = '/fonts-sacred/fonts.css';
    document.head.appendChild(l);
    return () => l.remove();
  }, []);

  const sfx: Sfx = useMemo(() => ({
    scrape: (k) => soundRef.current?.scrape(k),
    chime: (f) => soundRef.current?.chime(f),
    breath: (on) => soundRef.current?.breath(on),
    thud: () => soundRef.current?.thud(),
  }), []);

  /* ───────────── the engine ───────────── */
  useEffect(() => {
    const canvas = canvasRef.current!, wrapper = wrapRef.current!, content = contentRef.current!;
    const stage = new Stage(canvas, low);
    stageRef.current = stage;
    const sound = new Sound();
    soundRef.current = sound;
    voiceRef.current = new Voice();
    const size = () => stage.resize(innerWidth, innerHeight);
    size();
    addEventListener('resize', size);
    // the wheel is caught over the whole page, not only the (invisible) scroll layer, so no card or panel swallows it
    const lenis = new Lenis({ wrapper, content, eventsTarget: rootRef.current!, lerp: 0.1, wheelMultiplier: 1, touchMultiplier: 1.4 });
    lenisRef.current = lenis;

    // paint the first scene before showing anything, the next ones when there is time
    let alive = true;
    requestAnimationFrame(() => {
      stage.build(SCENES[0]!);
      if (alive) setReady(true);
    });

    // paint the next scene's cards one at a time, in the gaps between frames
    const ric = (window as unknown as { requestIdleCallback?: (f: () => void, o?: object) => number }).requestIdleCallback;
    const later = ric ? (f: () => void) => ric(f, { timeout: 1200 }) : (f: () => void) => setTimeout(f, 150);
    const pumpSoon = () => later(() => { if (alive && stage.pump()) pumpSoon(); });

    let raf = 0;
    let lastBeat = -1, lastScene = -1, lastOp = -1, lastTop = -1, lastBar = -1;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      lenis.raf(now);
      const vh = wrapper.clientHeight;
      let pos = lenis.scroll / vh;
      // a gate holds the scroll until it is passed
      for (let g = 0; g < BEATS.length; g++) {
        if (!isGate(BEATS[g]!) || solved.current.has(g)) continue;
        const lim = starts[g]! + BEATS[g]!.len * 0.45;
        if (pos > lim) {
          lenis.scrollTo(lim * vh, { immediate: true, force: true });
          pos = lim;
          lenis.stop();
          if (gateRef.current !== g) { gateRef.current = g; setGate(g); }
        }
        break;
      }
      const i = beatAt(pos);
      const b = BEATS[i]!;
      const t = Math.max(0, Math.min(1, (pos - starts[i]!) / b.len));
      const u = b.u[0] + (b.u[1] - b.u[0]) * t;
      const s = b.scene;
      if (i !== lastBeat) { lastBeat = i; setBeatIdx(i); }
      if (s !== lastScene) {
        lastScene = s;
        setScene(s);
        sound.setBed(BEDS[s]!);
        // keep neighbours painted, let the rest go
        const keep = [s - 1, s, s + 1].filter((k) => k >= 0 && k < SCENES.length).map((k) => SCENES[k]!.id);
        stage.keep(keep);
        const next = SCENES[s + 1];
        if (next && !stage.isBuilt(next.id)) { stage.build(next, true); pumpSoon(); }
      }
      // fades at scene edges: gold as we fall into the coin, paper as we come back
      let fade = 0, col = SCENES[s]!.paper;
      if (s > 0 && u < 0.05) { fade = 1 - u / 0.05; col = ERAS[s - 1]!.fade; }
      if (s < SCENES.length - 1 && u > 0.95) { fade = (u - 0.95) / 0.05; col = ERAS[s]!.fade; }
      stage.render(SCENES[s]!, u, now / 1000, fade, col);
      // the narrator's card breathes in and out over its beat
      // (only touch the styles when they change, so the page is not re-composited every frame)
      const op = b.kind === 'text' ? Math.max(0, Math.min(1, t / 0.12, (1 - t) / 0.12)) : 0;
      const top = i === 0 ? Math.max(0, 1 - t * 1.4) : 0;
      const bar = pos / TOTAL;
      if (textRef.current && Math.abs(op - lastOp) > 0.004) { lastOp = op; textRef.current.style.opacity = op.toFixed(3); }
      if (titleRef.current && Math.abs(top - lastTop) > 0.004) { lastTop = top; titleRef.current.style.opacity = top.toFixed(3); titleRef.current.style.visibility = top > 0 ? 'visible' : 'hidden'; }
      if (barRef.current && Math.abs(bar - lastBar) > 0.0005) { lastBar = bar; barRef.current.style.transform = `scaleY(${bar.toFixed(4)})`; }
    };
    raf = requestAnimationFrame(loop);

    const key = (e: KeyboardEvent) => {
      if (gateRef.current >= 0) return;
      const vh = wrapper.clientHeight;
      if (['ArrowDown', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); lenis.scrollTo(lenis.scroll + vh * 0.9); }
      if (['ArrowUp', 'PageUp'].includes(e.key)) { e.preventDefault(); lenis.scrollTo(lenis.scroll - vh * 0.9); }
      if (e.key === 'Escape') onExit();
    };
    addEventListener('keydown', key);
    const wake = () => { if (!sound.muted) sound.start(); };
    addEventListener('pointerdown', wake, { once: true });
    addEventListener('wheel', wake, { once: true, passive: true });
    addEventListener('keydown', wake, { once: true });
    if (import.meta.env.DEV) (window as unknown as Record<string, unknown>).__ghostdays = { lenis, stage, starts, kinds: BEATS.map((b) => b.kind), solve: (g: number) => { solved.current.add(g); gateRef.current = -1; setGate(-1); } };

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      removeEventListener('resize', size);
      removeEventListener('keydown', key);
      removeEventListener('pointerdown', wake);
      removeEventListener('wheel', wake);
      removeEventListener('keydown', wake);
      lenis.destroy();
      stage.dispose();
      sound.dispose();
      voiceRef.current?.stop();
    };
  }, [low, onExit]);

  const beat = BEATS[beatIdx]!;

  // narrator: words arrive one after another; the voice reads them if wanted
  useEffect(() => {
    if (beat.kind === 'text') {
      const words = textRef.current?.querySelectorAll('.hg-w');
      if (words?.length) gsap.fromTo(words, { opacity: 0, y: 8, filter: 'blur(4px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.6, stagger: 0.022, ease: 'power2.out' });
      if (beat.tone !== 'code') voiceRef.current?.say(beat.text);
      if (beat.gives && !marks.has(beat.gives)) setMarks((m) => new Set(m).add(beat.gives!));
    }
  }, [beatIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  // the call stack: frames pushed and popped
  useEffect(() => {
    const items = stackRef.current?.querySelectorAll('li');
    if (items?.length) gsap.fromTo(items[items.length - 1]!, { opacity: 0, x: -12 }, { opacity: 1, x: 0, duration: 0.6, ease: 'power2.out' });
  }, [scene]);

  useEffect(() => { if (invRef.current) drawInventory(invRef.current, marks); }, [marks]);
  useEffect(() => {
    if (beat.kind === 'end' && endCoinRef.current) {
      const c = endCoinRef.current; const g = c.getContext('2d')!;
      g.clearRect(0, 0, c.width, c.height);
      drawMetal(g, c.width, c.height, 'gold', new Set<Mark>(['zi', 'initials', 'alien', 'gleam']));
    }
  }, [beat.kind]);

  const passGate = useCallback((g: number, choice?: number) => {
    const b = BEATS[g]!;
    solved.current.add(g);
    if ((b.kind === 'rub' || b.kind === 'trace') && b.gives) setMarks((m) => new Set(m).add(b.gives!));
    if (b.kind === 'choice' && choice !== undefined) setChoices((c) => ({ ...c, [b.key]: choice }));
    setGate(-1);
    gateRef.current = -1;
    const lenis = lenisRef.current!;
    lenis.start();
    lenis.scrollTo((starts[g]! + b.len) * wrapRef.current!.clientHeight + 2, { duration: 1.8 });
  }, []);

  const restart = () => {
    solved.current.clear();
    setMarks(new Set());
    setChoices({});
    setGate(-1);
    lenisRef.current?.start();
    lenisRef.current?.scrollTo(0, { immediate: true, force: true });
  };

  const toggleSound = () => { const m = sound; setSound(!m); soundRef.current?.setMuted(m); if (!m) soundRef.current?.start(); };
  const toggleVoice = () => { const v = !voiceOn; setVoiceOn(v); if (voiceRef.current) { voiceRef.current.on = v; if (!v) voiceRef.current.stop(); else if (beat.kind === 'text') voiceRef.current.say(beat.text); } };

  const era = ERAS[scene]!;
  const gb = gate >= 0 ? BEATS[gate]! : null;
  const endB = beat.kind === 'end';

  return (
    <div ref={rootRef} className={`hg-root hg-scene-${SCENES[scene]!.id} ${gb ? 'hg-gated' : ''}`}>
      <canvas ref={canvasRef} className="hg-canvas" />
      <div className="hg-scroll" ref={wrapRef}>
        <div ref={contentRef} style={{ height: `calc(${TOTAL * 100}vh + 100vh)` }} />
      </div>

      {!ready && <div className="hg-loading"><span>mixing the washes…</span></div>}

      <div className="hg-title" ref={titleRef}>
        <p className="hg-kicker">The Hidden Girl and Other Stories · I</p>
        <h1>Ghost Days</h1>
        <p className="hg-sub">A story that runs like a recursive function: to reach its end it has to go back to its beginning, and then come home again.</p>
        <p className="hg-scrollhint"><span>scroll to run</span> <code>(fib 3)</code></p>
      </div>

      <header className="hg-top">
        <button className="hg-icon" onClick={onExit} aria-label="Back to the stories">←</button>
        <ol className="hg-stack" ref={stackRef} aria-label="Call stack">
          {era.stack.map((f, k) => (
            <li key={f} style={{ paddingLeft: k * 12 }}>
              <code>{f}</code>
              {k === era.stack.length - 1 && <span>{era.place} · {era.year}</span>}
            </li>
          ))}
        </ol>
        <div className="hg-tools">
          <button className={`hg-icon ${voiceOn ? 'on' : ''}`} onClick={toggleVoice} aria-label="Narrator voice" title="Narrator voice">❝</button>
          <button className={`hg-icon ${sound ? 'on' : ''}`} onClick={toggleSound} aria-label="Sound" title="Sound">{sound ? '♪' : '–'}</button>
        </div>
      </header>

      <div className="hg-bar"><i ref={barRef} /></div>

      <div className={`hg-card hg-card--${beat.kind === 'text' ? beat.tone ?? 'narrator' : 'none'}`} ref={textRef} aria-live="polite">
        {beat.kind === 'text' && (
          beat.tone === 'code'
            ? <><pre className="hg-code">{beat.text.split(/(\s+)/).map((w, k) => <span key={k} className="hg-w">{w}</span>)}</pre>{beat.cite && <p className="hg-cite">{beat.cite}</p>}</>
            : <><p>{beat.text.split(' ').map((w, k) => <span key={k} className="hg-w">{w} </span>)}</p>{beat.cite && <p className="hg-cite">— {beat.cite}</p>}</>
        )}
      </div>

      {!gb && !endB && ready && (
        <button
          className="hg-next"
          aria-label="Next"
          onClick={() => { soundRef.current?.start(); const vh = wrapRef.current!.clientHeight; lenisRef.current?.scrollTo((starts[beatIdx + 1] ?? TOTAL) * vh + 2, { duration: 1.6 }); }}
        >{beatIdx === 0 ? 'begin' : 'next'} <span>↓</span></button>
      )}

      {marks.size > 0 && (
        <button className="hg-inv" onClick={() => setShowMarks((v) => !v)} aria-label="The spade and its marks">
          <canvas ref={invRef} width={120} height={120} />
          {showMarks && (
            <ul className="hg-marks">
              <li className="hg-marks-head">The spade</li>
              {[...marks].map((m) => <li key={m}>{MARK_NOTES[m]}</li>)}
            </ul>
          )}
        </button>
      )}

      {gb && (
        <div className="hg-gate-wrap">
          {gb.kind === 'rub' && <RubGate key={gate} beat={gb} marks={marks} sfx={sfx} onDone={() => passGate(gate)} />}
          {gb.kind === 'hold' && <HoldGate key={gate} beat={gb} marks={marks} sfx={sfx} onDone={() => passGate(gate)} />}
          {gb.kind === 'trace' && <TraceGate key={gate} beat={gb} marks={marks} sfx={sfx} onDone={() => passGate(gate)} />}
          {gb.kind === 'choice' && <ChoiceGate key={gate} beat={gb} marks={marks} sfx={sfx} onDone={(c) => passGate(gate, c)} />}
          <button className="hg-skip" onClick={() => passGate(gate, gb.kind === 'choice' ? 0 : undefined)}>skip</button>
        </div>
      )}

      {endB && (
        <div className="hg-end">
          <canvas ref={endCoinRef} width={320} height={320} />
          <div className="hg-end-text">
            <p className="hg-kicker">(fib 3) → 3</p>
            <h2>The spade, as she carries it home</h2>
            <ul className="hg-end-marks">
              <li><b>字</b><span>a father's reading, cut in 1905: the extra curve between the world and the word</span></li>
              <li><b>F · C</b><span>two teenagers in 1989: a story chosen over a family's</span></li>
              <li><b>⟨⟩</b><span>the hooks of a people whose sun was dying: <i>keep us</i></span></li>
              <li><b>✦</b><span>a bright place rubbed clean, shaped like a little person: someone new</span></li>
            </ul>
            {choices.authentic !== undefined && <p className="hg-echo">{(BEATS.find((b) => b.kind === 'choice' && b.key === 'authentic') as Extract<Beat, { kind: 'choice' }>).notes[choices.authentic]!}</p>}
            {choices.keep !== undefined && <p className="hg-echo">{(BEATS.find((b) => b.kind === 'choice' && b.key === 'keep') as Extract<Beat, { kind: 'choice' }>).notes[choices.keep]!}</p>}
            <p className="hg-close">Every generation is a call that waits on the one before. The past does not stay behind us. It is the crust on the coin in our hand, and the bright place where we rubbed it clean.</p>
            <p className="hg-credit">After <i>Ghost Days</i> by Ken Liu (first published 2013), collected in <i>The Hidden Girl and Other Stories</i> (2020). This is a retelling and a reading in our own words; the story itself is far better. Read it.</p>
            <div className="hg-row">
              <button className="hg-btn" onClick={restart}>Run it again</button>
              <button className="hg-btn hg-btn--go" onClick={onExit}>Back to the stories</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
