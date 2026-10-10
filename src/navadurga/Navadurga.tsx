/**
 * नवदुर्गा — Nine Nights of the Goddess. A small gallery in pen, ballpoint,
 * crayon and chalk: the nine forms of Durga, one for each night of
 * Navaratri, hung on a wall with their labels; six rooms where you take part
 * in her battles from the Devi Mahatmya; and a music room for the nine
 * nights — garba, dandiya, dhaak and dhunuchi, synthesised as you listen —
 * with a listening list of Gujarati garba and Bengali Pujo songs.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PORTRAITS, PWID, PHEI, paintPortrait, type Portrait } from './portraits';
import { BATTLES, BW, BH, background, type Battle, type Input } from './battles';
import { Utsav, NIGHTS, songLink, type Mode } from './music';
import { danceFrame, DW, DH } from './dance';

type View = { k: 'wall' } | { k: 'portrait'; i: number } | { k: 'battles' } | { k: 'battle'; i: number } | { k: 'nights'; night?: number };

/* ───────── painted portraits, cached ───────── */

const painted = new Map<string, HTMLCanvasElement>();
const waiting = new Set<() => void>();
let queue: Portrait[] = [];
function paintNext() {
  const p = queue.shift();
  if (!p) return;
  if (!painted.has(p.key)) painted.set(p.key, paintPortrait(p));
  waiting.forEach((f) => f());
  setTimeout(paintNext, 16);
}
function requestPaint(ps: Portrait[]) { const fresh = ps.filter((p) => !painted.has(p.key) && !queue.includes(p)); if (!fresh.length) return; const idle = queue.length === 0; queue.push(...fresh); if (idle) setTimeout(paintNext, 30); }
function usePainted() { const [, set] = useState(0); useEffect(() => { const f = () => set((n) => n + 1); waiting.add(f); return () => { waiting.delete(f); }; }, []); }

function Thumb({ p, onClick }: { p: Portrait; onClick: () => void }) {
  usePainted();
  const ref = useRef<HTMLCanvasElement>(null);
  const img = painted.get(p.key);
  useEffect(() => { const c = ref.current; if (!c || !img) return; const g = c.getContext('2d')!; g.drawImage(img, 0, 0, c.width, c.height); }, [img]);
  return (
    <button className="nd-frame" onClick={onClick} aria-label={`Night ${p.night}: ${p.name}, ${p.gloss}`}>
      <span className="nd-frame-in"><canvas ref={ref} width={400} height={500} />{!img && <span className="nd-wait">painting…</span>}</span>
    </button>
  );
}

/* ───────── the wall ───────── */

function Wall({ go }: { go: (v: View) => void }) {
  useEffect(() => { requestPaint(PORTRAITS); }, []);
  return (
    <div className="nd-wall">
      <header className="nd-intro">
        <h2><span className="dev">नवदुर्गा</span> The Nine Forms</h2>
        <p>One goddess, nine nights, nine forms — from the daughter of the mountain on the first night to the giver of every perfection on the ninth. Each is drawn in its own manner. Step up to a painting to read its label.</p>
      </header>
      <div className="nd-hang">
        {PORTRAITS.map((p, i) => (
          <figure key={p.key} className="nd-piece">
            <Thumb p={p} onClick={() => go({ k: 'portrait', i })} />
            <figcaption className="nd-plaque">
              <span className="nd-night">Night {p.night}</span>
              <span className="dev">{p.dev}</span>
              <b>{p.name}</b>
              <i>{p.gloss}</i>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}

/* ───────── the viewing room ───────── */

function Viewer({ i, go }: { i: number; go: (v: View) => void }) {
  const p = PORTRAITS[i];
  usePainted();
  const ref = useRef<HTMLCanvasElement>(null);
  const tilt = useRef({ x: 0, y: 0 });
  useEffect(() => { requestPaint([p, PORTRAITS[(i + 1) % 9], PORTRAITS[(i + 8) % 9]]); }, [p, i]);
  useEffect(() => {
    const c = ref.current!; const g = c.getContext('2d')!; let raf = 0; const t0 = performance.now();
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const img = painted.get(p.key); g.setTransform(1, 0, 0, 1, 0, 0);
      if (!img) { g.fillStyle = '#e9e1d2'; g.fillRect(0, 0, PWID, PHEI); return; }
      g.drawImage(img, 0, 0);
      const t = (performance.now() - t0) / 1000;
      p.live?.(g, t);
      // a sheen of gallery light that follows the pointer
      const { x, y } = tilt.current; const gr = g.createRadialGradient(500 + x * 400, 400 + y * 400, 20, 500 + x * 400, 400 + y * 400, 700);
      gr.addColorStop(0, 'rgba(255,250,235,0.10)'); gr.addColorStop(1, 'rgba(255,250,235,0)'); g.fillStyle = gr; g.fillRect(0, 0, PWID, PHEI);
    };
    raf = requestAnimationFrame(loop); return () => cancelAnimationFrame(raf);
  }, [p]);
  useEffect(() => {
    const kd = (e: KeyboardEvent) => { if (e.key === 'ArrowRight') go({ k: 'portrait', i: (i + 1) % 9 }); else if (e.key === 'ArrowLeft') go({ k: 'portrait', i: (i + 8) % 9 }); else if (e.key === 'Escape') go({ k: 'wall' }); };
    window.addEventListener('keydown', kd); return () => window.removeEventListener('keydown', kd);
  }, [i, go]);
  return (
    <div className="nd-room">
      <div className="nd-room-art" onPointerMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); tilt.current = { x: (e.clientX - r.left) / r.width - 0.5, y: (e.clientY - r.top) / r.height - 0.5 }; }}>
        <span className="nd-frame-in big"><canvas ref={ref} width={PWID} height={PHEI} role="img" aria-label={`${p.name}, painted in ${p.manner}`} /></span>
      </div>
      <aside className="nd-label">
        <div className="nd-label-top"><span className="nd-night">Night {p.night} of nine</span><button className="nd-x" onClick={() => go({ k: 'wall' })} aria-label="Back to the wall">✕</button></div>
        <h2><span className="dev">{p.dev}</span>{p.name}</h2>
        <p className="nd-gloss">{p.gloss}</p>
        {p.story.map((s, k) => <p key={k}>{s}</p>)}
        <dl>
          <dt>Holds</dt><dd>{p.holds}</dd>
          <dt>Rides</dt><dd>{p.rides}</dd>
          <dt>Mantra</dt><dd className="dev">{p.mantra}</dd>
          <dt>Medium</dt><dd><i>{p.manner}</i></dd>
        </dl>
        <div className="nd-label-nav">
          <button onClick={() => go({ k: 'portrait', i: (i + 8) % 9 })}>← {PORTRAITS[(i + 8) % 9].name}</button>
          <button onClick={() => go({ k: 'nights', night: p.night })}>♪ Night {p.night} music</button>
          <button onClick={() => go({ k: 'portrait', i: (i + 1) % 9 })}>{PORTRAITS[(i + 1) % 9].name} →</button>
        </div>
      </aside>
    </div>
  );
}

/* ───────── the battle rooms ───────── */

function BattleList({ go }: { go: (v: View) => void }) {
  return (
    <div className="nd-wall">
      <header className="nd-intro">
        <h2><span className="dev">देवीमाहात्म्य</span> Her Battles</h2>
        <p>Six stories from the Devi Mahatmya, the goddess’s own scripture, in which you take part: wake the sleeping Vishnu, gather the gods’ light, loose a single syllable, draw Kali out of a frown, catch every drop of Raktabija’s blood before it lands.</p>
      </header>
      <div className="nd-battles">
        {BATTLES.map((b, i) => <BattleCard key={b.key} b={b} onClick={() => go({ k: 'battle', i })} />)}
      </div>
    </div>
  );
}
function BattleCard({ b, onClick }: { b: Battle; onClick: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => { const id = setTimeout(() => { const c = ref.current; if (!c) return; c.getContext('2d')!.drawImage(background(b), 0, 0, c.width, c.height); }, 40); return () => clearTimeout(id); }, [b]);
  return (
    <button className="nd-bcard" onClick={onClick}>
      <canvas ref={ref} width={480} height={270} />
      <span className="dev">{b.dev}</span>
      <b>{b.title}</b>
      <i>{b.summary}</i>
      <small>{b.source}</small>
    </button>
  );
}

function BattleRoom({ i, go }: { i: number; go: (v: View) => void }) {
  const b = BATTLES[i];
  const [si, setSi] = useState(0);
  const [done, setDone] = useState(false);
  const [run, setRun] = useState(0);
  const ref = useRef<HTMLCanvasElement>(null);
  const st = b.steps[si];
  const state = useRef(st.init());
  const pick = useRef<number | undefined>(undefined);
  const inp = useRef<Input>({ x: -999, y: -999, down: false, pressed: false, released: false, sx: 0, sy: 0 });
  useEffect(() => { state.current = b.steps[si].init(); setDone(false); }, [b, si, run]);
  useEffect(() => {
    const c = ref.current!, g = c.getContext('2d')!; let raf = 0, last = performance.now(), t = 0, T = 0, fin = false;
    const bg = background(b);
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt; T += dt;
      g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(bg, 0, 0);
      let r = false;
      try { r = b.steps[si].frame({ g, t, dt, T, inp: inp.current, ink: b.ink, pick: pick.current }, state.current as never); } catch (e) { console.error(e); }
      pick.current = undefined; inp.current.pressed = false; inp.current.released = false;
      if (r && !fin) { fin = true; setDone(true); }
    };
    raf = requestAnimationFrame(loop); return () => cancelAnimationFrame(raf);
  }, [b, si, run]);
  const pos = (e: React.PointerEvent) => { const r = ref.current!.getBoundingClientRect(); return { x: ((e.clientX - r.left) / r.width) * BW, y: ((e.clientY - r.top) / r.height) * BH }; };
  const last = si === b.steps.length - 1;
  return (
    <div className="nd-battle">
      <div className="nd-stage">
        <canvas ref={ref} width={BW} height={BH} className="nd-bcanvas" role="img" aria-label={`${b.title}: ${st.hint}`}
          onPointerDown={(e) => { (e.target as HTMLElement).setPointerCapture(e.pointerId); const p = pos(e); Object.assign(inp.current, { ...p, sx: p.x, sy: p.y, down: true, pressed: true }); }}
          onPointerMove={(e) => { Object.assign(inp.current, pos(e)); }}
          onPointerUp={(e) => { Object.assign(inp.current, { ...pos(e), down: false, released: true }); }}
          onPointerCancel={() => { inp.current.down = false; inp.current.released = true; }} />
      </div>
      <section className="nd-tell">
        <div className="nd-tell-head">
          <button className="nd-x" onClick={() => go({ k: 'battles' })} aria-label="Back to the battles">←</button>
          <div><span className="dev">{b.dev}</span> <b>{b.title}</b> <small>· {b.source} · {b.form}</small></div>
          <div className="nd-dots">{b.steps.map((_, k) => <i key={k} className={k < si ? 'past' : k === si ? 'now' : ''} />)}</div>
        </div>
        <p className="nd-story">{st.text}</p>
        <p className="nd-hint">{done ? (last ? 'The battle is won.' : 'Done — on to the next part.') : `▸ ${st.hint}`}</p>
        {st.choices && !done && <div className="nd-choices">{st.choices.map((c, k) => <button key={k} onClick={() => { pick.current = k; }}>{c}</button>)}</div>}
        <div className="nd-tell-nav">
          <button onClick={() => setRun((r) => r + 1)}>↺ Again</button>
          {done && !last && <button className="go" onClick={() => setSi(si + 1)}>Next →</button>}
          {done && last && <button className="go" onClick={() => go({ k: 'battle', i: (i + 1) % BATTLES.length })}>Next battle: {BATTLES[(i + 1) % BATTLES.length].title} →</button>}
          {!done && <button className="skip" onClick={() => (last ? go({ k: 'battle', i: (i + 1) % BATTLES.length }) : setSi(si + 1))}>Skip</button>}
        </div>
      </section>
    </div>
  );
}

/* ───────── the music room and the nine nights ───────── */

const MODES: [Mode, string, string][] = [['garba', 'Garba', 'ગરબા'], ['dandiya', 'Dandiya Raas', 'દાંડિયા રાસ'], ['dhaak', 'Dhaak', 'ঢাক'], ['dhunuchi', 'Dhunuchi Naach', 'ধুনুচি নাচ']];

function Nights({ night }: { night?: number }) {
  const utsav = useMemo(() => new Utsav(), []);
  const [mode, setMode] = useState<Mode>(night && night >= 6 ? 'dhaak' : 'garba');
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const ref = useRef<HTMLCanvasElement>(null);
  const list = useRef<HTMLDivElement>(null);
  useEffect(() => () => utsav.close(), [utsav]);
  useEffect(() => { utsav.speed = speed; }, [speed, utsav]);
  useEffect(() => { if (night) list.current?.querySelector(`[data-night="${night}"]`)?.scrollIntoView({ block: 'nearest' }); }, [night]);
  useEffect(() => {
    const c = ref.current!, g = c.getContext('2d')!; let raf = 0; const t0 = performance.now();
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const now = utsav.playing ? utsav.now() : (performance.now() - t0) / 1000;
      const beat = utsav.playing ? utsav.beat() : now * 0.6;
      danceFrame(g, utsav.mode, beat, now, utsav.hits, utsav.heat);
    };
    raf = requestAnimationFrame(loop); return () => cancelAnimationFrame(raf);
  }, [utsav]);
  const toggle = async () => { if (utsav.playing) { utsav.stop(); setPlaying(false); } else { await utsav.start(mode); setPlaying(true); } };
  const choose = async (m: Mode) => { setMode(m); utsav.setMode(m); if (!utsav.playing) { await utsav.start(m); setPlaying(true); } };
  return (
    <div className="nd-nights">
      <div className="nd-music">
        <div className="nd-stage"><canvas ref={ref} width={DW} height={DH} className="nd-dcanvas" role="img" aria-label={`${mode} dancers`} onPointerDown={() => utsav.tap()} /></div>
        <div className="nd-mixer">
          <button className="nd-play" onClick={toggle}>{playing ? '❚❚ Pause' : '▶ Play'}</button>
          {MODES.map(([m, en, d]) => <button key={m} className={mode === m ? 'on' : ''} onClick={() => choose(m)}><span className="dev">{d}</span> {en}</button>)}
          <button onClick={() => utsav.tap()} disabled={!playing}>{mode === 'garba' ? '👏 Clap' : mode === 'dandiya' ? 'Strike sticks' : 'Beat the dhaak'}</button>
          {(mode === 'dhaak' || mode === 'dhunuchi') && <><button onClick={() => utsav.tap('conch')} disabled={!playing}>Conch</button><button onClick={() => utsav.tap('ulu')} disabled={!playing}>Ulu</button></>}
          <label className="nd-speed">Speed <input type="range" min={0.7} max={1.3} step={0.05} value={speed} onChange={(e) => setSpeed(+e.target.value)} /></label>
        </div>
        <p className="nd-note">The rhythms here are original and synthesised as you listen: the dhol, claps and manjira of the garba (which quickens as it goes, the way a circle does over a night), dandiya sticks, the Bengali dhaak and kansar gong, conch and ulu. Tap the picture to join in.</p>
      </div>
      <div className="nd-playlist" ref={list}>
        <h2><span className="dev">नौ रातें</span> A listening list for the nine nights</h2>
        <p className="nd-note">Gujarati garba for every night, and from Shashthi the songs of the Bengali Pujo, with the Mahalaya dawn broadcast before it all begins. Each link opens a search on YouTube; the recordings belong to their makers.</p>
        {NIGHTS.map((n) => {
          const p = typeof n.n === 'number' ? PORTRAITS[n.n - 1] : undefined;
          return (
            <section key={String(n.n)} data-night={String(n.n)} className={`nd-night-row ${night === n.n ? 'here' : ''}`}>
              <h3>{p && <span className="dev">{p.dev}</span>} {n.label}</h3>
              <ul>
                {n.songs.map((s) => (
                  <li key={s.title}>
                    <a href={songLink(s)} target="_blank" rel="noopener noreferrer"><b>{s.title}</b>{s.dev && <span className="nd-script"> {s.dev}</span>}</a>
                    <span className={`nd-lang ${s.lang === 'Bengali' ? 'bn' : 'gu'}`}>{s.lang}</span>
                    <span className="nd-who">{s.who}</span>
                    <span className="nd-songnote">{s.note}</span>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}

/* ───────── the gallery ───────── */

export default function Navadurga({ onExit }: { onExit: () => void }) {
  const [view, setView] = useState<View>({ k: 'wall' });
  useEffect(() => { const ls = ['/fonts-sacred/fonts.css'].map((href) => { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; document.head.appendChild(l); return l; }); return () => ls.forEach((l) => l.remove()); }, []);
  const go = useCallback((v: View) => { setView(v); document.querySelector('.nd-body')?.scrollTo({ top: 0 }); }, []);
  const tab = view.k === 'wall' || view.k === 'portrait' ? 'wall' : view.k === 'nights' ? 'nights' : 'battles';
  return (
    <div className="nd">
      <header className="nd-top">
        <button className="nd-exit" onClick={onExit} aria-label="Exit">← Exit</button>
        <div className="nd-title"><span className="dev">नवदुर्गा</span><span>Nine Nights of the Goddess</span></div>
        <nav className="nd-tabs" aria-label="Rooms">
          <button className={tab === 'wall' ? 'on' : ''} onClick={() => go({ k: 'wall' })}>The Nine Forms</button>
          <button className={tab === 'battles' ? 'on' : ''} onClick={() => go({ k: 'battles' })}>Her Battles</button>
          <button className={tab === 'nights' ? 'on' : ''} onClick={() => go({ k: 'nights' })}>Nine Nights · Music</button>
        </nav>
      </header>
      <main className="nd-body">
        {view.k === 'wall' && <Wall go={go} />}
        {view.k === 'portrait' && <Viewer i={view.i} go={go} />}
        {view.k === 'battles' && <BattleList go={go} />}
        {view.k === 'battle' && <BattleRoom key={view.i} i={view.i} go={go} />}
        {view.k === 'nights' && <Nights night={view.night} />}
      </main>
    </div>
  );
}
