import { useEffect, useMemo, useRef, useState } from 'react';
import { drawMetal, drawPatina, type Under } from './coin';
import type { Beat, Mark } from './story';

/**
 * The three ways the player touches the story:
 *
 *  RUB   — scrape a crust away to see what is under it (the patina, the forgery);
 *  HOLD  — press and hold to lift a mask and hear what went unsaid;
 *  TRACE — draw a stroke to add a mark (the twist between 宇 and 字, two
 *          initials in bronze, a crown of twelve branches).
 *
 * And between the calls, a choice that the ending remembers.
 */

export interface Sfx { scrape(k: number): void; chime(f?: number): void; breath(on: boolean): void; thud(): void }

type GateProps<K extends Beat['kind']> = { beat: Extract<Beat, { kind: K }>; marks: Set<Mark>; sfx: Sfx; onDone: (choice?: number) => void };

function Continue({ onClick, label = 'Continue' }: { onClick: () => void; label?: string }) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);
  return <button ref={ref} className="hg-btn hg-btn--go" onClick={onClick}>{label} ↓</button>;
}

/* ─────────────── rub ─────────────── */

function RubCoin({ under, marks, onProgress, sfx }: { under: Under; marks: Set<Mark>; onProgress: (f: number) => void; sfx: Sfx }) {
  const base = useRef<HTMLCanvasElement>(null);
  const crust = useRef<HTMLCanvasElement>(null);
  const total = useRef(0);
  const down = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const moves = useRef(0);
  const S = 360;
  useEffect(() => {
    const b = base.current!.getContext('2d')!, c = crust.current!.getContext('2d', { willReadFrequently: true })!;
    drawMetal(b, S, S, under, marks);
    drawPatina(c, S, S, under === 'gold' ? 5 : 9);
    const d = c.getImageData(0, 0, S, S).data;
    let n = 0; for (let i = 3; i < d.length; i += 16) if (d[i]! > 10) n++;
    total.current = n;
  }, [under, marks]);
  const measure = () => {
    const d = crust.current!.getContext('2d', { willReadFrequently: true })!.getImageData(0, 0, S, S).data;
    let n = 0; for (let i = 3; i < d.length; i += 16) if (d[i]! > 10) n++;
    onProgress(1 - n / Math.max(1, total.current));
  };
  const rub = (e: React.PointerEvent) => {
    if (!down.current) return;
    const r = crust.current!.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * S, y = ((e.clientY - r.top) / r.height) * S;
    const g = crust.current!.getContext('2d')!;
    g.globalCompositeOperation = 'destination-out';
    g.lineCap = 'round'; g.lineWidth = S * 0.11;
    g.beginPath();
    const p = last.current ?? { x, y };
    g.moveTo(p.x, p.y); g.lineTo(x, y); g.stroke();
    // a ragged edge: specks left behind
    g.globalCompositeOperation = 'source-over';
    last.current = { x, y };
    const sp = Math.hypot(x - p.x, y - p.y);
    sfx.scrape(Math.min(1, sp / 30));
    if (++moves.current % 6 === 0) measure();
  };
  return (
    <div className="hg-coin">
      <canvas ref={base} width={S} height={S} />
      <canvas
        ref={crust}
        width={S}
        height={S}
        className="hg-crust"
        onPointerDown={(e) => { down.current = true; last.current = null; (e.target as HTMLElement).setPointerCapture(e.pointerId); rub(e); }}
        onPointerMove={rub}
        onPointerUp={() => { down.current = false; last.current = null; measure(); }}
        onPointerCancel={() => { down.current = false; }}
      />
    </div>
  );
}

export function RubGate({ beat, marks, sfx, onDone }: GateProps<'rub'>) {
  const [prog, setProg] = useState(() => beat.coins.map(() => 0));
  // the marks under the crust are the ones the coin will carry by 2313, even before you know them
  const shown = useMemo(() => (beat.coins.length === 1 ? new Set<Mark>(['zi', 'initials']) : new Set<Mark>()), [beat]);
  const done = prog.every((p) => p > 0.45);
  const said = useRef(false);
  useEffect(() => { if (done && !said.current) { said.current = true; sfx.chime(880); } }, [done, sfx]);
  return (
    <div className="hg-gate hg-gate--rub">
      <p className="hg-gate-kind">rub</p>
      <p className="hg-prompt">{beat.prompt}</p>
      <div className="hg-coins">
        {beat.coins.map((u, i) => (
          <div key={i} className="hg-coin-wrap">
            <RubCoin under={u} marks={shown} sfx={sfx} onProgress={(f) => setProg((p) => p.map((v, j) => (j === i ? Math.max(v, f) : v)))} />
            <span className="hg-meter"><i style={{ width: `${Math.min(1, prog[i]! / 0.45) * 100}%` }} /></span>
          </div>
        ))}
      </div>
      {done ? <><p className="hg-done">{beat.done}</p><Continue onClick={() => onDone()} /></> : <p className="hg-hint">Drag across the coin{beat.coins.length > 1 ? 's' : ''}.</p>}
      {void marks}
    </div>
  );
}

/* ─────────────── hold ─────────────── */

export function HoldGate({ beat, sfx, onDone }: GateProps<'hold'>) {
  const [i, setI] = useState(0);
  const [held, setHeld] = useState(0);
  const [open, setOpen] = useState(false);
  const holding = useRef(false);
  const raf = useRef(0);
  const line = beat.lines[i]!;
  const heldRef = useRef(0);
  const openRef = useRef(false);
  useEffect(() => {
    let lastT = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - lastT) / 1000); lastT = now;
      if (!openRef.current) {
        const h = heldRef.current;
        const n = holding.current ? Math.min(1, h + dt / 1.1) : Math.max(0, h - dt * 1.5);
        if (n !== h) { heldRef.current = n; setHeld(n); }
        if (n >= 1) { openRef.current = true; setOpen(true); sfx.breath(false); sfx.chime(520); }
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [sfx]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.code === 'Space' && !e.repeat) { e.preventDefault(); holding.current = e.type === 'keydown'; sfx.breath(holding.current); } };
    addEventListener('keydown', k); addEventListener('keyup', k);
    return () => { removeEventListener('keydown', k); removeEventListener('keyup', k); };
  }, [sfx]);
  const next = () => {
    if (i + 1 < beat.lines.length) { setI(i + 1); openRef.current = false; heldRef.current = 0; holding.current = false; setOpen(false); setHeld(0); }
    else onDone();
  };
  const press = (on: boolean) => { holding.current = on; sfx.breath(on && !open); };
  return (
    <div className="hg-gate hg-gate--hold">
      <p className="hg-gate-kind">hold · {i + 1} of {beat.lines.length}</p>
      <p className="hg-who">{line.who}</p>
      <div className={`hg-mask ${open ? 'open' : ''}`} style={{ '--lift': held } as React.CSSProperties}>
        <p className="hg-said">“{line.said}”</p>
        <p className="hg-unsaid">{line.unsaid}</p>
      </div>
      {open ? (
        <>
          {line.reply && <p className="hg-reply">{line.reply}</p>}
          <Continue onClick={next} label={i + 1 < beat.lines.length ? 'Next' : 'Continue'} />
        </>
      ) : (
        <button
          className="hg-hold"
          onPointerDown={(e) => { e.preventDefault(); press(true); }}
          onPointerUp={() => press(false)}
          onPointerLeave={() => press(false)}
          onPointerCancel={() => press(false)}
          onContextMenu={(e) => e.preventDefault()}
        >
          <svg viewBox="0 0 44 44"><circle cx="22" cy="22" r="19" className="bg" /><circle cx="22" cy="22" r="19" className="fg" style={{ strokeDashoffset: 119.4 * (1 - held) }} /></svg>
          <span>{beat.prompt}</span>
        </button>
      )}
    </div>
  );
}

/* ─────────────── trace ─────────────── */

interface Glyph { ink: string[]; guide: string; before?: string; tol: number; need: number; label?: [string, string]; bg?: 'coin' | 'head' }

const SPADE_SVG = 'M45,14 L55,14 L56,34 Q70,34 76,37 L74,86 L60,86 Q50,72 40,86 L26,86 L24,37 Q30,34 44,34 Z';

const GLYPHS: Record<'zi' | 'initials' | 'crown', Glyph> = {
  zi: {
    ink: ['M50,10 L53,19', 'M20,26 L20,36', 'M20,26 L80,26 L75,35', 'M50,56 L50,90 L42,85', 'M22,70 L78,70'],
    before: 'M32,47 L68,47',
    guide: 'M31,46 L67,46 L50,57',
    tol: 7, need: 0.85,
    label: ['宇 · the universe', '字 · writing'],
  },
  initials: {
    ink: [],
    guide: 'M42,46 L42,72 M42,46 L53,46 M42,58 L50,58 M70,50 Q62,44 58,52 Q56,62 62,68 Q68,72 72,66',
    tol: 6, need: 0.85, bg: 'coin',
  },
  crown: {
    ink: [],
    guide: Array.from({ length: 12 }, (_, i) => {
      const a = (-160 + (i / 11) * 140) * (Math.PI / 180);
      const x0 = 50 + Math.cos(a) * 12, y0 = 62 + Math.sin(a) * 12;
      const x1 = 50 + Math.cos(a) * 30, y1 = 62 + Math.sin(a) * 30;
      const xc = 50 + Math.cos(a + 0.25) * 22, yc = 62 + Math.sin(a + 0.25) * 22;
      return `M${x0.toFixed(1)},${y0.toFixed(1)} Q${xc.toFixed(1)},${yc.toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)}`;
    }).join(' '),
    tol: 6, need: 0.75, bg: 'head',
  },
};

export function TraceGate({ beat, sfx, onDone }: GateProps<'trace'>) {
  const G = GLYPHS[beat.glyph];
  const svg = useRef<SVGSVGElement>(null);
  const guideRef = useRef<SVGPathElement>(null);
  const pts = useRef<{ x: number; y: number; hit: boolean }[]>([]);
  const [strokes, setStrokes] = useState<string[]>([]);
  const cur = useRef<string>('');
  const [prog, setProg] = useState(0);
  const [done, setDone] = useState(false);
  useEffect(() => {
    const p = guideRef.current!;
    const L = p.getTotalLength();
    const n = Math.max(20, Math.round(L / 1.6));
    pts.current = Array.from({ length: n }, (_, i) => { const q = p.getPointAtLength((i / (n - 1)) * L); return { x: q.x, y: q.y, hit: false }; });
  }, [G]);
  const at = (e: React.PointerEvent) => {
    const r = svg.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 };
  };
  const down = useRef(false);
  const move = (e: React.PointerEvent) => {
    if (!down.current || done) return;
    const { x, y } = at(e);
    cur.current += `${cur.current ? ' L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`;
    setStrokes((s) => [...s.slice(0, -1), cur.current]);
    let newHit = 0;
    for (const p of pts.current) if (!p.hit && Math.hypot(p.x - x, p.y - y) < G.tol) { p.hit = true; newHit++; }
    if (newHit) {
      const f = pts.current.filter((p) => p.hit).length / pts.current.length;
      setProg(f);
      sfx.scrape(0.35);
      if (f >= G.need && !done) { setDone(true); sfx.chime(beat.glyph === 'crown' ? 1046 : 784); }
    }
  };
  return (
    <div className="hg-gate hg-gate--trace">
      <p className="hg-gate-kind">trace</p>
      <p className="hg-prompt">{beat.prompt}</p>
      <div className="hg-trace-row">
        {G.label && <span className="hg-glyph-label">{G.label[0]}</span>}
        <svg
          ref={svg}
          viewBox="0 0 100 100"
          className={`hg-trace ${done ? 'done' : ''}`}
          onPointerDown={(e) => { down.current = true; cur.current = ''; setStrokes((s) => [...s, '']); (e.target as Element).setPointerCapture?.(e.pointerId); move(e); }}
          onPointerMove={move}
          onPointerUp={() => { down.current = false; }}
          onPointerCancel={() => { down.current = false; }}
        >
          {G.bg === 'coin' && <path d={SPADE_SVG} className="hg-trace-coin" />}
          {G.bg === 'coin' && <text x="25" y="64" className="hg-trace-old">字</text>}
          {G.bg === 'head' && (<><circle cx="50" cy="62" r="11" className="hg-trace-head" /><path d="M36,100 Q38,78 50,76 Q62,78 64,100" className="hg-trace-head" /></>)}
          {G.ink.map((d) => <path key={d} d={d} className="hg-trace-ink" />)}
          {G.before && !done && <path d={G.before} className="hg-trace-before" />}
          <path ref={guideRef} d={G.guide} className={done ? 'hg-trace-ink' : 'hg-trace-guide'} />
          {!done && strokes.map((d, i) => <path key={i} d={d} className="hg-trace-mine" />)}
        </svg>
        {G.label && <span className="hg-glyph-label">{done ? G.label[1] : '？'}</span>}
      </div>
      <span className="hg-meter"><i style={{ width: `${Math.min(1, prog / G.need) * 100}%` }} /></span>
      {done ? <><p className="hg-done">{beat.done}</p><Continue onClick={() => onDone()} /></> : <p className="hg-hint">Follow the dotted line with a finger or the mouse.</p>}
    </div>
  );
}

/* ─────────────── choice ─────────────── */

export function ChoiceGate({ beat, sfx, onDone }: GateProps<'choice'>) {
  const [pick, setPick] = useState<number | null>(null);
  return (
    <div className="hg-gate hg-gate--choice">
      <p className="hg-gate-kind">choose</p>
      <p className="hg-prompt hg-prompt--big">{beat.q}</p>
      <div className="hg-choices">
        {beat.a.map((a, i) => (
          <button key={a} className={`hg-btn hg-choice ${pick === i ? 'on' : ''}`} disabled={pick !== null} onClick={() => { setPick(i); sfx.chime(i ? 659 : 587); }}>{a}</button>
        ))}
      </div>
      {pick !== null && <><p className="hg-done">{beat.notes[pick]}</p><Continue onClick={() => onDone(pick)} /></>}
    </div>
  );
}
