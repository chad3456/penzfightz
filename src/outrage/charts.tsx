/**
 * Small hand-built SVG charts for the essay. Each one measures its own width
 * so text stays at true pixel size on a phone, draws thin marks with 4px
 * rounded data-ends, and shows a tooltip on hover or tap.
 */
import { createContext, useContext, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { KIND, SRC, type Bill, type Incident, type Kind, type Pt } from './data';

export const INK = '#0b0b0b';
export const INK2 = '#52514e';
export const MUTED = '#8a8883';
export const GRID = '#e6e5e1';

export const fmtIN = (v: number) => v.toLocaleString('en-IN', { maximumFractionDigits: 2 });

/* ───────── tooltip ───────── */
type TipFn = { show: (e: { clientX: number; clientY: number }, node: ReactNode) => void; hide: () => void };
export const TipCtx = createContext<TipFn>({ show: () => {}, hide: () => {} });
export const useTip = () => useContext(TipCtx);

export function TipLayer({ tip }: { tip: { x: number; y: number; node: ReactNode } | null }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: 0, top: 0 });
  useLayoutEffect(() => {
    if (!tip || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    let left = tip.x + 14, top = tip.y - r.height - 12;
    if (left + r.width > window.innerWidth - 8) left = tip.x - r.width - 14;
    if (left < 8) left = 8;
    if (top < 56) top = tip.y + 18;
    setPos({ left, top });
  }, [tip]);
  if (!tip) return null;
  return <div ref={ref} className="oe-tip" style={pos} role="status">{tip.node}</div>;
}

/* ───────── helpers ───────── */
export function useWidth<T extends HTMLElement>(init = 640) {
  const ref = useRef<T>(null);
  const [w, setW] = useState(init);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setW(Math.max(240, Math.round(el.clientWidth)));
    const ro = new ResizeObserver(([e]) => setW(Math.max(240, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

export function niceMax(max: number) {
  const p = 10 ** Math.floor(Math.log10(max || 1));
  for (const s of [1, 2, 2.5, 5, 10]) { const step = s * p; if (max / step <= 4) return { max: Math.ceil(max / step) * step, step }; }
  return { max, step: max / 4 };
}

/** A bar with a 4px rounded top, anchored square to the baseline. */
export function barPath(x: number, y: number, w: number, h: number, r = 4) {
  if (h <= 0) return '';
  const rr = Math.min(r, w / 2, h);
  return `M${x},${y + h}V${y + rr}Q${x},${y} ${x + rr},${y}H${x + w - rr}Q${x + w},${y} ${x + w},${y + rr}V${y + h}Z`;
}
/** Horizontal bar, rounded at its right end. */
export function hbarPath(x: number, y: number, w: number, h: number, r = 4) {
  if (w <= 0) return '';
  const rr = Math.min(r, h / 2, w);
  return `M${x},${y}H${x + w - rr}Q${x + w},${y} ${x + w},${y + rr}V${y + h - rr}Q${x + w},${y + h} ${x + w - rr},${y + h}H${x}Z`;
}

export function Legend({ kinds }: { kinds: Kind[] }) {
  return (
    <div className="oe-legend" aria-label="Legend">
      {kinds.map((k) => <span key={k}><i style={{ background: KIND[k].color }} />{KIND[k].label}</span>)}
    </div>
  );
}

export interface TableSpec { cols: string[]; rows: (string | number)[][] }
export function DataTable({ cols, rows }: TableSpec) {
  return (
    <div className="oe-tablewrap">
      <table className="oe-table">
        <thead><tr>{cols.map((c) => <th key={c}>{c}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{typeof c === 'number' ? fmtIN(c) : c}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

export function Figure({ n, title, sub, legend, table, source, children, wide }: {
  n: string; title: string; sub?: ReactNode; legend?: Kind[]; table?: TableSpec; source?: string[]; children: ReactNode; wide?: boolean;
}) {
  const [asTable, setAsTable] = useState(false);
  return (
    <figure className={`oe-fig oe-reveal${wide ? ' oe-fig--wide' : ''}`}>
      <div className="oe-fig__head">
        <div>
          <div className="oe-fig__n">Fig. {n}</div>
          <h3 className="oe-fig__title">{title}</h3>
          {sub && <p className="oe-fig__sub">{sub}</p>}
        </div>
        {table && <button className="oe-fig__tbtn" onClick={() => setAsTable((v) => !v)} aria-pressed={asTable}>{asTable ? 'Chart' : 'Table'}</button>}
      </div>
      {legend && legend.length > 1 && <Legend kinds={legend} />}
      {asTable && table ? <DataTable {...table} /> : children}
      {source && (
        <figcaption className="oe-fig__src">
          Source: {source.map((id, i) => <span key={id}>{i > 0 && '; '}<a href={SRC[id].url} target="_blank" rel="noreferrer">{SRC[id].title}</a></span>)}
        </figcaption>
      )}
    </figure>
  );
}

/* ───────── vertical bars over years ───────── */
export function Bars({ data, years, color, fmt = fmtIN, h = 220, unit, label, mark = [] }: {
  data: Pt[]; years?: number[]; color: string; fmt?: (v: number) => string; h?: number; unit: string; label: string; mark?: number[];
}) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const tip = useTip();
  const xs = years ?? data.map((d) => d.x);
  const by = new Map(data.map((d) => [d.x, d]));
  const { max, step } = niceMax(Math.max(...data.map((d) => d.v)));
  const m = { l: 46, r: 6, t: 20, b: 24 };
  const iw = w - m.l - m.r, ih = h - m.t - m.b;
  const band = iw / xs.length, bw = Math.max(6, Math.min(34, band * 0.62));
  const y = (v: number) => m.t + ih - (v / max) * ih;
  const ticks: number[] = []; for (let v = 0; v <= max + 1e-9; v += step) ticks.push(v);
  const last = data[data.length - 1];
  const peak = data.reduce((a, b) => (b.v > a.v ? b : a), data[0]);
  const labelled = new Set([last.x, peak.x, ...mark]);
  const short = w < 420;
  return (
    <div ref={ref} className="oe-chart">
      <svg width={w} height={h} role="img" aria-label={label}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={m.l} x2={w - m.r} y1={y(t)} y2={y(t)} stroke={t === 0 ? '#b9b7b1' : GRID} strokeWidth={1} />
            <text x={m.l - 6} y={y(t) + 4} textAnchor="end" className="oe-ax">{t >= 10000 ? `${fmtIN(t / 1000)}k` : fmtIN(t)}</text>
          </g>
        ))}
        {xs.map((x, i) => {
          const d = by.get(x);
          const cx = m.l + band * i + band / 2;
          return (
            <g key={x}>
              {(!short || i % 2 === 0 || i === xs.length - 1) && (
                <text x={cx} y={h - 6} textAnchor="middle" className="oe-ax">{short ? `’${String(x).slice(2)}` : x}</text>
              )}
              {d ? (
                <>
                  <path d={barPath(cx - bw / 2, y(d.v), bw, m.t + ih - y(d.v))} fill={color} className="oe-bar" style={{ transitionDelay: `${i * 45}ms` }} />
                  {labelled.has(x) && <text x={cx} y={y(d.v) - 6} textAnchor="middle" className="oe-val">{fmt(d.v)}</text>}
                  <rect x={m.l + band * i} y={m.t} width={band} height={ih + 4} fill="transparent"
                    onPointerMove={(e) => tip.show(e, <><b>{x}</b><span>{fmt(d.v)} {unit}</span>{d.note && <em>{d.note}</em>}</>)}
                    onPointerLeave={tip.hide} />
                </>
              ) : (
                <text x={cx} y={m.t + ih - 6} textAnchor="middle" className="oe-na">n/a</text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ───────── horizontal bars: the bill ───────── */
export function HBars({ rows }: { rows: Bill[] }) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const tip = useTip();
  const max = Math.max(...rows.map((r) => r.v));
  const rowH = 46, barH = 14, valW = 86;
  const h = rows.length * rowH + 4;
  const iw = w - valW;
  return (
    <div ref={ref} className="oe-chart">
      <svg width={w} height={h} role="img" aria-label="Costs in rupees crore, by event">
        {rows.map((r, i) => {
          const y0 = i * rowH;
          const bw = Math.max(3, (r.v / max) * iw);
          return (
            <g key={r.label} onPointerMove={(e) => tip.show(e, <><b>{r.label}</b><span>₹{fmtIN(r.v)} crore</span><em>{r.note}</em></>)} onPointerLeave={tip.hide}>
              <rect x={0} y={y0} width={w} height={rowH} fill="transparent" />
              <text x={0} y={y0 + 15} className="oe-lab">{r.label}</text>
              <path d={hbarPath(0, y0 + 22, bw, barH)} fill={KIND[r.kind].color} className="oe-hbar" style={{ transitionDelay: `${i * 70}ms` }} />
              <text x={bw + 8} y={y0 + 33} className="oe-val">₹{fmtIN(r.v)} cr</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ───────── flashpoints timeline ───────── */
const AT: Record<string, number> = {
  jat: 2016.13, lynch: 2018.45, caa: 2019.96, delhi: 2020.15, farm: 2020.9, agni: 2022.46, manipur: 2023.34,
  us: 2020.4, lanka: 2022.3, bd: 2024.55, kenya: 2024.47, nepal: 2025.69,
};
const SHORT: Record<string, string> = {
  jat: 'Jat stir', lynch: 'Lynchings', caa: 'Shaheen Bagh', delhi: 'Delhi riots', farm: 'Farm stir', agni: 'Agnipath', manipur: 'Manipur',
  us: 'US 2020', lanka: 'Sri Lanka', bd: 'Bangladesh', kenya: 'Kenya', nepal: 'Nepal',
};
export function Timeline({ items, onPick }: { items: Incident[]; onPick?: (id: string) => void }) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const tip = useTip();
  const lanes: ('India' | 'World')[] = ['India', 'World'];
  const laneH = 118, top = 8, h = top + lanes.length * laneH + 26;
  const m = { l: w < 480 ? 8 : 58, r: 14 };
  const x0 = 2016, x1 = 2026;
  const x = (v: number) => m.l + ((v - x0) / (x1 - x0)) * (w - m.l - m.r);
  const r = (d?: number) => (d ? 5 + Math.sqrt(d) * (w < 520 ? 0.42 : 0.62) : 6);
  return (
    <div ref={ref} className="oe-chart">
      <svg width={w} height={h} role="img" aria-label="Flashpoints by year, India and the world">
        {Array.from({ length: x1 - x0 + 1 }, (_, i) => x0 + i).map((yr) => (
          <g key={yr}>
            <line x1={x(yr)} x2={x(yr)} y1={top} y2={h - 22} stroke={GRID} />
            {(w > 480 || yr % 2 === 0) && yr < x1 && <text x={x(yr + 0.5)} y={h - 6} textAnchor="middle" className="oe-ax">{w > 480 ? yr : `’${String(yr).slice(2)}`}</text>}
          </g>
        ))}
        {lanes.map((lane, li) => {
          const cy = top + li * laneH + laneH / 2;
          const inLane = items.filter((d) => d.region === lane).sort((a, b) => AT[a.id] - AT[b.id]);
          return (
            <g key={lane}>
              <line x1={m.l} x2={w - m.r} y1={cy} y2={cy} stroke="#cfcdc7" />
              {w >= 480 && <text x={0} y={cy + 4} className="oe-lane">{lane}</text>}
              {w < 480 && <text x={m.l} y={top + li * laneH + 12} className="oe-lane">{lane}</text>}
              {(() => {
                // place each label in the first free slot: above, below, then a row further out
                const used: [number, number, number][] = [];
                return inLane.map((d) => {
                  const cx = x(AT[d.id]), half = SHORT[d.id].length * 3.3 + 4;
                  const slot = [0, 1, 2, 3].find((k) => !used.some(([s, a, b]) => s === k && cx + half > a && cx - half < b)) ?? 0;
                  used.push([slot, cx - half, cx + half]);
                  return { d, slot };
                }).sort((a, b) => (b.d.deaths ?? 0) - (a.d.deaths ?? 0));
              })().map(({ d, slot }) => {
                const cx = x(AT[d.id]);
                const rr = r(d.deaths);
                const up = slot % 2 === 0;
                const off = slot >= 2 ? 22 : 0;
                const col = KIND[d.kind].color;
                return (
                  <g key={d.id} className="oe-tl-dot" onClick={() => onPick?.(d.id)}
                    onPointerMove={(e) => tip.show(e, <><b>{d.name} · {d.year}{d.end ? `–${String(d.end).slice(2)}` : ''}</b><span>{d.place}</span>
                      <span>{d.deaths ? `${fmtIN(d.deaths)} dead` : 'deaths: no reliable count'}</span>{d.cost && <span>{d.cost}</span>}<em>{KIND[d.kind].label}</em></>)}
                    onPointerLeave={tip.hide}>
                    {d.end && <line x1={cx} x2={x(d.end + 0.6)} y1={cy} y2={cy} stroke={col} strokeWidth={2} strokeLinecap="round" opacity={0.55} />}
                    <circle cx={cx} cy={cy} r={rr + 2} fill="#fcfcfb" />
                    <circle cx={cx} cy={cy} r={rr} fill={d.deaths ? col : '#fcfcfb'} stroke={col} strokeWidth={d.deaths ? 0 : 2} fillOpacity={d.deaths ? 0.9 : 1} />
                    <circle cx={cx} cy={cy} r={Math.max(rr, 14)} fill="transparent" />
                    {off > 0 && <line x1={cx} x2={cx} y1={up ? cy - rr : cy + rr} y2={up ? cy - rr - 24 : cy + rr + 24} stroke="#cfcdc7" />}
                    <text x={cx} y={up ? cy - rr - 8 - off : cy + rr + 16 + off} textAnchor="middle" className="oe-tl-lab">{SHORT[d.id]}</text>
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ───────── sparkline for KPI tiles ───────── */
export function Spark({ data, color }: { data: Pt[]; color: string }) {
  const w = 120, h = 34, p = 4;
  const vs = data.map((d) => d.v);
  const lo = Math.min(...vs), hi = Math.max(...vs);
  const pts = data.map((d, i) => [p + (i / Math.max(1, data.length - 1)) * (w - 2 * p), h - p - ((d.v - lo) / (hi - lo || 1)) * (h - 2 * p)]);
  const last = pts[pts.length - 1];
  return (
    <svg width={w} height={h} className="oe-spark" aria-hidden>
      <polyline points={pts.map((q) => q.join(',')).join(' ')} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={last[0]} cy={last[1]} r={3.5} fill={color} stroke="#fcfcfb" strokeWidth={2} />
    </svg>
  );
}

