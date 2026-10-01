import { useEffect, useMemo, useRef, useState } from 'react';
import { CN_EXPRESSWAY, US_INTERSTATE, fmt } from './data';
import { AVG_SHIP_TEU_2025, COSTS, KIND_LABEL, QUIZ, SHIPS, SHIP_LENGTH_M, type Insight, type Quiz, type Ref } from './deep';

/**
 * The Great Build's "go deeper" labs: hands-on pieces between the chapters.
 * - Ships: scrub through record ships and watch them grow wider, not longer.
 * - Costs: set a budget and see how much metro it buys in each city.
 * - Draw it: draw China's expressway curve, then see the real one.
 * - Guess first: four quick guesses, revealed with sources.
 * - Insight cards: the small print behind the headline numbers.
 */

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el); setW(el.clientWidth);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

const RefLinks = ({ refs }: { refs: Ref[] }) => (
  <p className="gx-refs">{refs.map((r, i) => <a key={i} href={r.url} target="_blank" rel="noreferrer">{r.title}{r.via ? ` (via ${r.via})` : ''}</a>)}</p>
);

export function Lab({ n, title, sub, children }: { n: string; title: string; sub: string; children: React.ReactNode }) {
  return (
    <section className="gx-lab">
      <header className="gx-head"><span className="gx-n">{n}</span><div><p className="gx-kick">Go deeper</p><h3 className="gx-title">{title}</h3><p className="gx-sub">{sub}</p></div></header>
      {children}
    </section>
  );
}

export function Insights({ items }: { items: Insight[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="gx-cards">
      {items.map((it, i) => (
        <article key={i} className={`gx-card gx-card--${it.kind} ${open === i ? 'is-open' : ''}`}>
          <button className="gx-card-btn" onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i}>
            <span className="gx-tag">{KIND_LABEL[it.kind]}</span>
            {it.stat && <b className="gx-stat">{it.stat}</b>}
            {it.statLabel && <span className="gx-statl">{it.statLabel}</span>}
            <span className="gx-card-t">{it.title}</span>
            <span className="gx-more">{open === i ? 'Less −' : 'Read +'}</span>
          </button>
          {open === i && <div className="gx-card-body"><p>{it.body}</p><RefLinks refs={it.refs} /></div>}
        </article>
      ))}
    </div>
  );
}

/* ───────────── ships ───────────── */

export function ShipsLab() {
  const [i, setI] = useState(SHIPS.length - 1);
  const [ref, w] = useWidth<HTMLDivElement>();
  const s = SHIPS[i]!;
  const H = 170, pad = 20;
  const pxPerM = (w - pad * 2) / 420;
  const L = SHIP_LENGTH_M * pxPerM;
  const boxes = Math.round(s.teu / 500);
  const avgBoxes = Math.round(AVG_SHIP_TEU_2025 / 500);
  const maxBeam = 62;
  const narrow = w < 560;
  const beamW = narrow ? w - pad * 2 - 90 : Math.min(w * 0.42, 260);
  const grid = narrow ? { x: pad, y: 230 } : { x: beamW + pad + 120, y: 150 };
  const svgH = narrow ? H + 230 : H + 150;
  return (
    <div className="gx-ships" ref={ref}>
      <div className="gx-ship-ctl">
        <input type="range" min={0} max={SHIPS.length - 1} step={1} value={i} onChange={(e) => setI(+e.target.value)} aria-label="Ship" />
        <div className="gx-ticks">{SHIPS.map((x, k) => <button key={k} className={k === i ? 'is-on' : ''} onClick={() => setI(k)}>{x.year}</button>)}</div>
      </div>
      {w > 0 && (
        <svg width={w} height={svgH} role="img" aria-label={`${s.name}: ${s.teu} TEU`}>
          {/* side view: always 400 m */}
          <text x={pad} y={16} className="gx-axl">Side view: length</text>
          <g transform={`translate(${pad} 30)`}>
            <path d={`M0 30 L${L - 30} 30 L${L} 8 L${L} 50 L${L - 24} 70 L14 70 Z`} className="gx-hull" />
            {Array.from({ length: 40 }, (_, k) => { const h = 4 + (s.teu / 24346) * 24; return <rect key={k} x={30 + k * ((L - 80) / 40)} y={30 - h} width={(L - 80) / 40 - 1.5} height={h} className={`gx-stack gx-stack--${k % 4}`} />; })}
            <line x1={0} x2={L} y1={86} y2={86} className="gx-dim" /><text x={L / 2} y={100} textAnchor="middle" className="gx-axl">{SHIP_LENGTH_M} m: the same for every record ship since 2006</text>
          </g>
          {/* front view: width grows */}
          <text x={pad} y={150} className="gx-axl">Front view: width</text>
          <g transform={`translate(${pad} 160)`}>
            {SHIPS.map((x, k) => <rect key={k} x={0} y={k * 0} width={(x.beam / maxBeam) * beamW} height={4} rx={2} className={`gx-beam ${k === i ? 'is-on' : ''}`} transform={`translate(0 ${k * 9})`} />)}
            <text x={beamW + 10} y={i * 9 + 6} className="gx-val">{s.beam} m wide</text>
          </g>
          {/* capacity grid: one square = 500 TEU */}
          <g transform={`translate(${grid.x} ${grid.y})`}>
            <text x={0} y={0} className="gx-axl">Capacity: ■ = 500 TEU</text>
            {Array.from({ length: boxes }, (_, k) => <rect key={k} x={(k % 10) * 13} y={10 + Math.floor(k / 10) * 13} width={11} height={11} rx={2} className={`gx-box ${k < avgBoxes ? 'is-avg' : ''}`} style={{ animationDelay: `${k * 12}ms` }} />)}
          </g>
        </svg>
      )}
      <p className="gx-readout"><b>{s.year} · {s.name}</b>: {fmt(s.teu)} TEU{!s.checked && <span className="gx-unchecked" title="Not re-checked against a primary source"> ○</span>}. {s.note} <span className="gx-muted">The darker squares are an average container ship today, about {fmt(AVG_SHIP_TEU_2025)} TEU (BIMCO).</span></p>
    </div>
  );
}

/* ───────────── costs ───────────── */

const BUDGETS = [1, 2, 5, 10, 20, 50];
export function CostLab() {
  const [b, setB] = useState(3);
  const budget = BUDGETS[b]! * 1000; // $ million
  const rows = useMemo(() => COSTS.map((c) => ({ ...c, km: budget / c.usdM })), [budget]);
  const max = Math.max(...rows.map((r) => r.km));
  const [ref, w] = useWidth<HTMLDivElement>();
  const labelW = Math.min(170, w * 0.36);
  return (
    <div className="gx-cost" ref={ref}>
      <div className="gx-budget">
        <span>Your budget</span>
        <div className="gx-seg">{BUDGETS.map((v, k) => <button key={v} className={k === b ? 'is-on' : ''} onClick={() => setB(k)}>${v} bn</button>)}</div>
      </div>
      <div className="gx-rows">
        {rows.map((r) => {
          const len = ((w - labelW - 90) * r.km) / max;
          const stations = Math.max(1, Math.floor(r.km / 2));
          return (
            <div key={r.id} className={`gx-row ${r.id === 'world' ? 'is-world' : ''}`}>
              <div className="gx-row-l" style={{ width: labelW }}><b>{r.place}</b><span>{r.project}</span></div>
              <div className="gx-track">
                <span className={`gx-line gx-f--${r.nation === 'other' ? 'ot' : r.nation.toLowerCase()}`} style={{ width: Math.max(4, len) }}>
                  {len > 40 && Array.from({ length: Math.min(30, stations) }, (_, k) => <i key={k} style={{ left: `${((k + 0.5) / Math.min(30, stations)) * 100}%` }} />)}
                </span>
                <span className="gx-km">{r.km >= 10 ? fmt(Math.round(r.km)) : r.km.toFixed(1)} km</span>
              </div>
              <span className="gx-per" title={r.basis}>${fmt(r.usdM)} m/km</span>
            </div>
          );
        })}
      </div>
      <p className="gx-muted">Bases differ: most rows are Transit Costs Project figures in PPP-adjusted dollars; Paris is the official budget divided by 200 km. Read the ratios, not the decimals. Sources: <a href="https://transitcosts.com/transit-costs-study-final-report/" target="_blank" rel="noreferrer">Transit Costs Project (NYU Marron Institute)</a>; <a href="https://infrastructuredeliverymodels.gihub.org/case-studies/grand-paris-express/" target="_blank" rel="noreferrer">G20 Global Infrastructure Hub</a>.</p>
    </div>
  );
}

/* ───────────── draw it ───────────── */

export function DrawLab() {
  const [ref, w] = useWidth<HTMLDivElement>();
  const years = CN_EXPRESSWAY.map(([y]) => y);
  const first = CN_EXPRESSWAY[0]!;
  const [guess, setGuess] = useState<Record<number, number>>({ [first[0]]: first[1] });
  const [revealed, setRevealed] = useState(false);
  const [hover, setHover] = useState<number | null>(null);
  const drawing = useRef(false);
  const svg = useRef<SVGSVGElement>(null);
  const H = 320, pad = { l: 56, r: 24, t: 20, b: 34 };
  const X = (y: number) => pad.l + ((y - 2004) / 20) * (w - pad.l - pad.r);
  const Y = (km: number) => H - pad.b - (km / 220000) * (H - pad.t - pad.b);
  const invX = (px: number) => Math.round(2004 + ((px - pad.l) / (w - pad.l - pad.r)) * 20);
  const invY = (py: number) => Math.max(0, Math.min(220000, ((H - pad.b - py) / (H - pad.t - pad.b)) * 220000));
  const drawnTo = Math.max(...Object.keys(guess).map(Number));
  const complete = drawnTo >= 2024;

  const at = (e: React.PointerEvent) => {
    const r = svg.current!.getBoundingClientRect();
    const yr = Math.max(2005, Math.min(2024, invX(e.clientX - r.left)));
    const km = invY(e.clientY - r.top);
    setGuess((g) => {
      const n = { ...g };
      const last = Math.max(...Object.keys(n).map(Number).filter((k) => k < yr), 2004);
      // fill any years skipped by a fast stroke
      for (let k = last + 1; k <= yr; k++) n[k] = n[last]! + ((km - n[last]!) * (k - last)) / (yr - last || 1);
      n[yr] = km;
      return n;
    });
  };
  const err = useMemo(() => {
    if (!complete) return null;
    const diffs = CN_EXPRESSWAY.slice(1).map(([y, km]) => Math.abs((guess[y] ?? 0) - km) / km);
    return diffs.reduce((a, b) => a + b, 0) / diffs.length;
  }, [guess, complete]);
  const verdict = err === null ? '' : err < 0.08 ? 'Uncanny. You knew.' : err < 0.2 ? 'Close.' : (guess[2024] ?? 0) < 190700 ? 'Too low. The real curve kept climbing.' : 'Too high. You expected even more than happened.';
  const path = (pts: [number, number][]) => pts.map(([y, km], i) => `${i ? 'L' : 'M'}${X(y)} ${Y(km)}`).join('');
  const gpts = years.filter((y) => guess[y] !== undefined).map((y) => [y, guess[y]!] as [number, number]);

  return (
    <div className="gx-draw" ref={ref}>
      <p className="gx-draw-q">China had <b>34,300 km</b> of expressway in 2004. <b>Draw</b> how you think it grew to 2024 (drag across the chart), then reveal.</p>
      {w > 0 && (
        <svg ref={svg} width={w} height={H} className={`gx-draw-svg ${revealed ? 'is-revealed' : ''}`} role="img" aria-label="Draw your guess of China's expressway growth"
          onPointerDown={(e) => { if (revealed) return; drawing.current = true; (e.target as Element).setPointerCapture?.(e.pointerId); at(e); }}
          onPointerMove={(e) => { if (drawing.current && !revealed) at(e); else if (revealed) { const r = svg.current!.getBoundingClientRect(); const yr = invX(e.clientX - r.left); setHover(yr >= 2004 && yr <= 2024 ? yr : null); } }}
          onPointerUp={() => { drawing.current = false; }}
          onPointerLeave={() => { drawing.current = false; setHover(null); }}>
          {[0, 50000, 100000, 150000, 200000].map((v) => <g key={v}><line x1={pad.l} x2={w - pad.r} y1={Y(v)} y2={Y(v)} className="gx-grid" /><text x={pad.l - 8} y={Y(v) + 4} textAnchor="end" className="gx-axl">{v ? `${v / 1000}k` : '0'}</text></g>)}
          {[2004, 2008, 2012, 2016, 2020, 2024].map((y) => <text key={y} x={X(y)} y={H - 10} textAnchor="middle" className="gx-axl">{y}</text>)}
          {!revealed && !complete && <rect x={X(drawnTo)} y={pad.t} width={w - pad.r - X(drawnTo)} height={H - pad.t - pad.b} className="gx-draw-zone" />}
          {!revealed && <text x={(X(drawnTo) + w - pad.r) / 2} y={pad.t + 26} textAnchor="middle" className="gx-axl gx-draw-hint">{complete ? 'Done? Reveal below.' : 'draw here ✎'}</text>}
          {/* reference: the US Interstate */}
          <line x1={X(2004)} x2={X(2023)} y1={Y(US_INTERSTATE[0]![1])} y2={Y(US_INTERSTATE[1]![1])} className="gx-ref" />
          <text x={X(2023) - 4} y={Y(US_INTERSTATE[1]![1]) - 6} textAnchor="end" className="gx-axl">US Interstate</text>
          <path d={path(gpts)} className="gx-guess" />
          {gpts.length > 0 && <circle cx={X(gpts[gpts.length - 1]![0])} cy={Y(gpts[gpts.length - 1]![1])} r="5" className="gx-guess-dot" />}
          {revealed && <path d={path(CN_EXPRESSWAY)} className="gx-actual" pathLength={1} />}
          {revealed && <text x={X(2024) - 6} y={Y(190700) - 10} textAnchor="end" className="gx-val">China 190,700</text>}
          {revealed && hover !== null && (() => {
            const a = CN_EXPRESSWAY.find(([y]) => y === hover)?.[1], g = guess[hover];
            return (
              <g>
                <line x1={X(hover)} x2={X(hover)} y1={pad.t} y2={H - pad.b} className="gx-cross" />
                {a !== undefined && <circle cx={X(hover)} cy={Y(a)} r="5" className="gx-actual-dot" />}
                <g transform={`translate(${Math.min(X(hover) + 10, w - 170)} ${pad.t + 8})`}>
                  <rect width="160" height="54" rx="8" className="gx-tipbox" />
                  <text x="10" y="18" className="gx-tipt">{hover}</text>
                  <text x="10" y="34" className="gx-tipt">Actual: {a !== undefined ? fmt(a) : '—'} km</text>
                  <text x="10" y="48" className="gx-tipt">You: {g !== undefined ? fmt(Math.round(g)) : '—'} km</text>
                </g>
              </g>
            );
          })()}
        </svg>
      )}
      <div className="gx-draw-actions">
        <span className="gx-key"><i className="gx-sw gx-sw--guess" />Your guess</span>
        <span className="gx-key"><i className="gx-sw gx-sw--actual" />Actual (Ministry of Transport)</span>
        {!revealed ? (
          <>
            <button className="gx-btn" disabled={!complete} onClick={() => setRevealed(true)}>{complete ? 'Reveal the real curve' : `Draw to 2024 (${2024 - drawnTo} years left)`}</button>
            <button className="gx-btn gx-btn--ghost" onClick={() => setGuess({ [first[0]]: first[1] })}>Clear</button>
          </>
        ) : (
          <>
            <span className="gx-verdict"><b>{verdict}</b> Average miss: {Math.round((err ?? 0) * 100)}%.</span>
            <button className="gx-btn gx-btn--ghost" onClick={() => { setRevealed(false); setGuess({ [first[0]]: first[1] }); }}>Draw again</button>
          </>
        )}
      </div>
    </div>
  );
}

/* ───────────── guess first ───────────── */

function QuizCard({ q }: { q: Quiz }) {
  const toT = (v: number) => (q.log ? Math.log(v / q.min) / Math.log(q.max / q.min) : (v - q.min) / (q.max - q.min));
  const fromT = (t: number) => (q.log ? q.min * Math.pow(q.max / q.min, t) : q.min + t * (q.max - q.min));
  const [t, setT] = useState(0.5);
  const [locked, setLocked] = useState(false);
  const v = fromT(t);
  const ratio = v / q.answer;
  const off = q.min < 0 ? `${Math.abs(v - q.answer).toFixed(0)} points ${v > q.answer ? 'high' : 'low'}` : ratio >= 1 ? `${ratio.toFixed(1)}× too high` : `${(1 / ratio).toFixed(1)}× too low`;
  const close = Math.abs(toT(v) - toT(q.answer)) < 0.06;
  return (
    <article className={`gx-quiz ${locked ? 'is-locked' : ''}`}>
      <p className="gx-quiz-q">{q.q}</p>
      <div className="gx-quiz-scale">
        <input type="range" min={0} max={1} step={0.001} value={t} disabled={locked} onChange={(e) => setT(+e.target.value)} aria-label="Your guess" />
        {locked && <span className="gx-quiz-ans" style={{ left: `${toT(q.answer) * 100}%` }} title="The answer" />}
      </div>
      <div className="gx-quiz-row">
        <b className="gx-quiz-v">{q.fmt(v)}</b>
        {!locked ? <button className="gx-btn" onClick={() => setLocked(true)}>Lock in</button> : <span className={`gx-quiz-res ${close ? 'is-close' : ''}`}>{close ? 'Spot on.' : `You were ${off}.`}</span>}
      </div>
      {locked && <p className="gx-quiz-reveal">{q.reveal} <a href={q.ref.url} target="_blank" rel="noreferrer">{q.ref.title}</a></p>}
    </article>
  );
}

export function QuizLab() {
  return <div className="gx-quizzes">{QUIZ.map((q) => <QuizCard key={q.id} q={q} />)}</div>;
}
