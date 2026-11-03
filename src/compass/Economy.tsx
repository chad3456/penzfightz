/** Economic inequality and income: country blocks and charts, from SWIID 9.92 and World Bank data. */
import { useMemo, useState } from 'react';
import { COUNTRIES } from './countries';
import { AXES, band as axisBand } from './model';
import { ECON, SWIID_CITE, SWIID_URL, WB_CITE, corr, fmtPop, fmtUSD, giniBand, redistUncertain } from './economy';

const COUNTRY_BY_ID = Object.fromEntries(COUNTRIES.map((c) => [c.id, c]));
const WITH_GINI = COUNTRIES.filter((c) => ECON[c.id]?.gini);
const SERIES = ['var(--tp-them)', 'var(--tp-world)', 'var(--tp-society)', 'var(--tp-econ)', 'var(--tp-state)', 'var(--muted)'];
const median = (xs: number[]) => { const s = xs.slice().sort((a, b) => a - b); return s.length ? (s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : 0; };
const MED_GINI = median(WITH_GINI.map((c) => ECON[c.id].gini!.v));
const MED_GDP = median(COUNTRIES.filter((c) => ECON[c.id]?.gdppc).map((c) => ECON[c.id].gdppc!.v));
const rankOf = (cid: string, key: 'gini' | 'giniMkt' | 'redist' | 'gdppc', desc = true) => {
  const list = COUNTRIES.filter((c) => ECON[c.id]?.[key]).sort((a, b) => (desc ? ECON[b.id][key]!.v - ECON[a.id][key]!.v : ECON[a.id][key]!.v - ECON[b.id][key]!.v));
  return { rank: list.findIndex((c) => c.id === cid) + 1, of: list.length };
};

export function Sources() {
  return <p className="tp-fine tp-cite">Inequality: <a href={SWIID_URL} target="_blank" rel="noopener noreferrer">SWIID</a> — {SWIID_CITE} Income and population: {WB_CITE}</p>;
}

/* ------------------------------------------------------------- line chart */
interface Line { name: string; color: string; pts: [number, number][]; dashed?: boolean }
export function LineChart({ lines, yLabel, fmt = (v: number) => String(v), yMin, yMax, log }: { lines: Line[]; yLabel: string; fmt?: (v: number) => string; yMin?: number; yMax?: number; log?: boolean }) {
  const [hx, setHx] = useState<number | null>(null);
  const W = 620, H = 300, PL = 52, PR = 16, PT = 14, PB = 34;
  const all = lines.flatMap((l) => l.pts);
  if (!all.length) return <p className="tp-fine">No data.</p>;
  const x0 = Math.min(...all.map((p) => p[0])), x1 = Math.max(...all.map((p) => p[0]));
  const tf = (v: number) => (log ? Math.log10(Math.max(1, v)) : v);
  const ys = all.map((p) => tf(p[1]));
  const y0 = yMin != null ? tf(yMin) : Math.min(...ys) - (log ? 0.1 : 2), y1 = yMax != null ? tf(yMax) : Math.max(...ys) + (log ? 0.1 : 2);
  const sx = (x: number) => PL + ((x - x0) / Math.max(1, x1 - x0)) * (W - PL - PR);
  const sy = (y: number) => PT + (1 - (tf(y) - y0) / (y1 - y0)) * (H - PT - PB);
  const ticksY = log ? [100, 300, 1000, 3000, 10000, 30000, 100000].filter((v) => tf(v) >= y0 && tf(v) <= y1) : Array.from({ length: 5 }, (_, i) => y0 + ((y1 - y0) * i) / 4);
  const ticksX = Array.from(new Set([x0, ...[1985, 1990, 1995, 2000, 2005, 2010, 2015, 2020, 2025].filter((y) => y > x0 && y < x1), x1]));
  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect(); const px = ((e.clientX - r.left) / r.width) * W;
    const yr = Math.round(x0 + ((px - PL) / (W - PL - PR)) * (x1 - x0)); setHx(Math.max(x0, Math.min(x1, yr)));
  };
  return (
    <div className="tp-linechart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={yLabel} onMouseMove={onMove} onMouseLeave={() => setHx(null)}>
        {ticksY.map((t) => <g key={t}><line x1={PL} x2={W - PR} y1={sy(log ? t : t)} y2={sy(log ? t : t)} className="tp-lc__grid" /><text x={PL - 8} y={sy(t) + 4} textAnchor="end" className="tp-lc__tick">{fmt(log ? t : Math.round(t))}</text></g>)}
        {ticksX.map((t) => <text key={t} x={sx(t)} y={H - 12} textAnchor="middle" className="tp-lc__tick">{t}</text>)}
        <text x={12} y={PT + 4} className="tp-lc__tick">{yLabel}</text>
        {lines.map((l) => <polyline key={l.name} points={l.pts.map(([x, y]) => `${sx(x)},${sy(y)}`).join(' ')} fill="none" stroke={l.color} strokeWidth={l.dashed ? 1.6 : 2.4} strokeDasharray={l.dashed ? '5 4' : undefined} strokeLinejoin="round" />)}
        {hx != null && <line x1={sx(hx)} x2={sx(hx)} y1={PT} y2={H - PB} className="tp-lc__cross" />}
        {hx != null && lines.map((l) => { const p = l.pts.find((q) => q[0] === hx); return p ? <circle key={l.name} cx={sx(p[0])} cy={sy(p[1])} r={4} fill={l.color} /> : null; })}
      </svg>
      <div className="tp-lc__legend">
        {lines.map((l) => { const p = hx != null ? l.pts.find((q) => q[0] === hx) : l.pts[l.pts.length - 1]; return <span key={l.name}><i className={`tp-swatch${l.dashed ? ' tp-swatch--dash' : ''}`} style={{ ['--c' as string]: l.color }} />{l.name}{p ? <b> {fmt(p[1])}{hx == null ? ` (${p[0]})` : ''}</b> : null}</span>; })}
        {hx != null && <span className="tp-fine">{hx}</span>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- country block */
export function CountryEconomy({ cid }: { cid: string }) {
  const c = COUNTRY_BY_ID[cid], e = ECON[cid];
  const [peers, setPeers] = useState<string[]>(() => [cid === 'us' ? 'se' : 'us']);
  const [showMkt, setShowMkt] = useState(true);
  if (!e?.gini && !e?.gdppc) return (
    <div className="tp-socblock"><h2 className="tp-h2">Economy and inequality</h2><p className="tp-fine">Neither SWIID nor the World Bank publishes inequality or income figures for {c.name}.</p></div>
  );
  const g = e.gini, gm = e.giniMkt, rd = e.redist;
  const gr = rankOf(cid, 'gini'), pr = rankOf(cid, 'gdppc');
  const wel = c.v[AXES.findIndex((a) => a.id === 'welfare')];
  const lines = [
    { name: `${c.name}, after taxes`, color: SERIES[0], pts: e.trend },
    ...(showMkt && e.trendMkt.length ? [{ name: `${c.name}, before taxes`, color: SERIES[0], pts: e.trendMkt, dashed: true }] : []),
    ...peers.filter((p) => p !== cid && ECON[p]?.trend.length).map((p, i) => ({ name: COUNTRY_BY_ID[p].name, color: SERIES[i + 1], pts: ECON[p].trend })),
  ];
  const first = e.trend[0], last = e.trend[e.trend.length - 1];
  const change = first && last ? Math.round((last[1] - first[1]) * 10) / 10 : null;
  return (
    <div className="tp-socblock">
      <h2 className="tp-h2">Economy and inequality</h2>
      <div className="tp-kpis">
        {g && <div className="tp-kpi"><span className="tp-kpi__label">Inequality after taxes</span><b className="tp-kpi__v">{g.v}</b><span className="tp-fine">Gini {g.year} · {giniBand(g.v)} · {gr.rank === 1 ? 'most unequal' : `${gr.rank} of ${gr.of} (1 = most unequal)`}{g.se ? ` · ±${g.se}` : ''}</span></div>}
        {gm && <div className="tp-kpi"><span className="tp-kpi__label">Before taxes and transfers</span><b className="tp-kpi__v">{gm.v}</b><span className="tp-fine">Market-income Gini {gm.year}</span></div>}
        {rd && <div className="tp-kpi"><span className="tp-kpi__label">Redistribution</span><b className="tp-kpi__v">{rd.v}%</b><span className="tp-fine">{redistUncertain(e) ? 'Uncertain estimate · ' : ''}how much taxes and transfers cut inequality</span></div>}
        {e.gdppc && <div className="tp-kpi"><span className="tp-kpi__label">GDP per person</span><b className="tp-kpi__v">{fmtUSD(e.gdppc.v)}</b><span className="tp-fine">current US$, {e.gdppc.year} · {pr.rank} of {pr.of} · median {fmtUSD(Math.round(MED_GDP))}</span></div>}
        {e.pop && <div className="tp-kpi"><span className="tp-kpi__label">Population</span><b className="tp-kpi__v">{fmtPop(e.pop.v)}</b><span className="tp-fine">{e.pop.year}</span></div>}
      </div>
      {g && (
        <p className="tp-lede tp-econ-note">
          {c.name}’s income inequality after taxes is {g.v > MED_GINI + 2 ? 'above' : g.v < MED_GINI - 2 ? 'below' : 'close to'} the median of these {WITH_GINI.length} countries ({MED_GINI.toFixed(1)}).
          {gm && rd ? ` Taxes and transfers ${rd.v > 0 ? `cut market inequality from ${gm.v} to ${g.v}, a ${rd.v}% reduction` : `do not measurably reduce it (${rd.v}%)`}.` : ''}
          {change != null ? ` Since ${first[0]}, inequality has ${Math.abs(change) < 1 ? 'barely changed' : change > 0 ? `risen by ${change} points` : `fallen by ${-change} points`}.` : ''}
          {` On the Compass, its laws place it “${axisBand(wel, AXES[1]).toLowerCase()}” on Redistribution (${wel}).`}
        </p>
      )}
      {e.trend.length > 1 && (
        <article className="tp-chartcard">
          <div className="tp-report__bar">
            <h2>Inequality over time</h2>
            <div className="tp-filters">
              <label className="tp-pick">Compare <select id="tp-eco-peer" className="tp-input" value={peers[0] ?? ''} onChange={(ev) => setPeers((p) => [ev.target.value, ...p.slice(1)].filter(Boolean))}><option value="">(none)</option>{WITH_GINI.filter((x) => x.id !== cid).sort((a, b) => a.name.localeCompare(b.name)).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
              <label className="tp-pick">and <select id="tp-eco-peer2" className="tp-input" value={peers[1] ?? ''} onChange={(ev) => setPeers((p) => [p[0], ev.target.value].filter(Boolean))}><option value="">(none)</option>{WITH_GINI.filter((x) => x.id !== cid).sort((a, b) => a.name.localeCompare(b.name)).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
              <label className="tp-check"><input type="checkbox" checked={showMkt} onChange={(ev) => setShowMkt(ev.target.checked)} /> Before taxes</label>
            </div>
          </div>
          <LineChart lines={lines} yLabel="Gini (0–100)" fmt={(v) => v.toFixed(1)} />
          <p className="tp-fine">Gini index: 0 means everyone has the same income, 100 means one household has it all. The gap between the dashed (before taxes and transfers) and solid line is what the state redistributes. Hover to read any year.</p>
        </article>
      )}
      {e.gdppcTrend.length > 1 && (
        <article className="tp-chartcard">
          <h2>Income per person</h2>
          <LineChart log lines={[{ name: c.name, color: SERIES[0], pts: e.gdppcTrend }, ...peers.filter((p) => ECON[p]?.gdppcTrend.length).map((p, i) => ({ name: COUNTRY_BY_ID[p].name, color: SERIES[i + 1], pts: ECON[p].gdppcTrend }))]} yLabel="GDP per person, current US$ (log scale)" fmt={(v) => fmtUSD(Math.round(v))} />
          <p className="tp-fine">Log scale, so equal heights mean equal percentage growth. Current dollars include inflation and exchange-rate swings.</p>
        </article>
      )}
      <Sources />
    </div>
  );
}

/* ------------------------------------------------------------- charts page */
function Dumbbell({ onPick }: { onPick: (cid: string) => void }) {
  const [sort, setSort] = useState<'gini' | 'redist' | 'mkt'>('gini');
  const rows = WITH_GINI.slice().sort((a, b) => {
    const ea = ECON[a.id], eb = ECON[b.id];
    if (sort === 'redist') return (eb.redist?.v ?? -99) - (ea.redist?.v ?? -99);
    if (sort === 'mkt') return (eb.giniMkt?.v ?? 0) - (ea.giniMkt?.v ?? 0);
    return eb.gini!.v - ea.gini!.v;
  });
  const sx = (g: number) => ((g - 20) / 55) * 100;
  return (
    <>
      <div className="tp-chips" role="group" aria-label="Sort"><button aria-pressed={sort === 'gini'} onClick={() => setSort('gini')}>After taxes</button><button aria-pressed={sort === 'mkt'} onClick={() => setSort('mkt')}>Before taxes</button><button aria-pressed={sort === 'redist'} onClick={() => setSort('redist')}>Most redistribution</button></div>
      <div className="tp-dumbbell">
        <div className="tp-dumbbell__scale"><span /><span className="tp-dumbbell__ticks">{[20, 30, 40, 50, 60, 70].map((t) => <i key={t} style={{ left: `${sx(t)}%` }}>{t}</i>)}</span><span /></div>
        {rows.map((c) => {
          const e = ECON[c.id], a = e.giniMkt?.v, b = e.gini!.v;
          return (
            <button key={c.id} className="tp-dumbbell__row" onClick={() => onPick(c.id)} title={`${c.name}: before ${a ?? '—'}, after ${b}${e.redist ? `, redistribution ${e.redist.v}%` : ''}`}>
              <span className="tp-dumbbell__name">{c.name}</span>
              <span className="tp-dumbbell__track">
                {a != null && <i className="tp-dumbbell__bar" style={{ left: `${Math.min(sx(a), sx(b))}%`, width: `${Math.abs(sx(a) - sx(b))}%` }} />}
                {a != null && <b className="tp-dumbbell__mkt" style={{ left: `${sx(a)}%` }} />}
                <b className="tp-dumbbell__disp" style={{ left: `${sx(b)}%` }} />
              </span>
              <span className="tp-dumbbell__v">{b}{e.redist ? <em> {e.redist.v > 0 ? '−' : '+'}{Math.abs(e.redist.v)}%{redistUncertain(e) ? '?' : ''}</em> : null}</span>
            </button>
          );
        })}
      </div>
      <p className="tp-legend"><span className="tp-legend__item"><span className="tp-dot tp-dot--ring" style={{ ['--c' as string]: 'var(--muted)' }} />Before taxes and transfers</span><span className="tp-legend__item"><span className="tp-dot" style={{ ['--c' as string]: 'var(--tp-them)' }} />After</span><span className="tp-legend__item">% = relative redistribution · ? = uncertain estimate</span></p>
    </>
  );
}

function Trends() {
  const [picked, setPicked] = useState<string[]>(['us', 'se', 'cn', 'in', 'br']);
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length >= 6 ? [...p.slice(1), id] : [...p, id]));
  return (
    <>
      <LineChart lines={picked.map((id, i) => ({ name: COUNTRY_BY_ID[id].name, color: SERIES[i % SERIES.length], pts: ECON[id].trend }))} yLabel="Gini after taxes" fmt={(v) => v.toFixed(1)} />
      <div className="tp-chips tp-chips--wrap" role="group" aria-label="Countries">{WITH_GINI.slice().sort((a, b) => a.name.localeCompare(b.name)).map((c) => <button key={c.id} aria-pressed={picked.includes(c.id)} onClick={() => toggle(c.id)}>{c.name}</button>)}</div>
      <p className="tp-fine">Pick up to six countries. Hover the chart to read a year.</p>
    </>
  );
}

function XY({ pts, xLabel, yLabel, xLog, onPick, xFmt, yFmt }: { pts: { id: string; x: number; y: number; color: string }[]; xLabel: string; yLabel: string; xLog?: boolean; onPick: (cid: string) => void; xFmt: (v: number) => string; yFmt: (v: number) => string }) {
  const [hover, setHover] = useState<string | null>(null);
  const W = 600, H = 400, P = 50;
  const tx = (v: number) => (xLog ? Math.log10(v) : v);
  const xs = pts.map((p) => tx(p.x)), ys = pts.map((p) => p.y);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys) - 2, y1 = Math.max(...ys) + 2;
  const sx = (v: number) => P + ((tx(v) - x0) / (x1 - x0)) * (W - 2 * P), sy = (v: number) => H - P - ((v - y0) / (y1 - y0)) * (H - 2 * P);
  const r = corr(xs, ys);
  const h = pts.find((p) => p.id === hover);
  return (
    <>
      <svg className="tp-scatter" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${xLabel} against ${yLabel}`}>
        <rect x={P} y={P} width={W - 2 * P} height={H - 2 * P} className="tp-scatter__frame" />
        <text x={W / 2} y={H - 12} textAnchor="middle" className="tp-scatter__axis">{xLabel} →</text>
        <text x={14} y={H / 2} textAnchor="middle" className="tp-scatter__axis" transform={`rotate(-90 14 ${H / 2})`}>{yLabel} →</text>
        {pts.map((p) => (
          <g key={p.id} onMouseEnter={() => setHover(p.id)} onMouseLeave={() => setHover(null)} onClick={() => onPick(p.id)} style={{ cursor: 'pointer' }}>
            <circle cx={sx(p.x)} cy={sy(p.y)} r={hover === p.id ? 8 : 5.5} style={{ fill: p.color }} className="tp-scatter__dot" />
            <text x={sx(p.x) + 8} y={sy(p.y) + 3} className="tp-scatter__label">{p.id.toUpperCase()}</text>
            <circle cx={sx(p.x)} cy={sy(p.y)} r={12} fill="transparent" />
          </g>
        ))}
      </svg>
      <p className="tp-fine">{h ? `${COUNTRY_BY_ID[h.id].name}: ${xFmt(h.x)}, ${yFmt(h.y)}. ` : 'Hover a dot for its values; click to open the country. '}{r != null ? `Correlation across these countries: r = ${r.toFixed(2)} (${Math.abs(r) < 0.2 ? 'almost none' : Math.abs(r) < 0.4 ? 'weak' : Math.abs(r) < 0.6 ? 'moderate' : 'strong'}${r < 0 ? ', negative' : ''}).` : ''}</p>
    </>
  );
}

export function EconomyCharts({ onPick }: { onPick: (cid: string) => void }) {
  const gdpPts = useMemo(() => WITH_GINI.filter((c) => ECON[c.id].gdppc).map((c) => ({ id: c.id, x: ECON[c.id].gdppc!.v, y: ECON[c.id].gini!.v, color: `var(--tp-r-${c.region.replace(' ', '')})` })), []);
  const wi = AXES.findIndex((a) => a.id === 'welfare');
  const redPts = useMemo(() => WITH_GINI.filter((c) => ECON[c.id].redist && !redistUncertain(ECON[c.id])).map((c) => ({ id: c.id, x: c.v[wi], y: ECON[c.id].redist!.v, color: `var(--tp-r-${c.region.replace(' ', '')})` })), [wi]);
  const most = WITH_GINI.slice().sort((a, b) => ECON[b.id].gini!.v - ECON[a.id].gini!.v);
  return (
    <>
      <article className="tp-chartcard">
        <h2>Economic inequality: before and after the state steps in</h2>
        <p className="tp-fine">Each row runs from inequality of market income (wages, profits, rents: the hollow dot) to inequality after taxes and cash transfers (the solid dot). The longer the bar, the more the state redistributes. Most unequal here: {most.slice(0, 3).map((c) => `${c.name} (${ECON[c.id].gini!.v})`).join(', ')}. Most equal: {most.slice(-3).reverse().map((c) => `${c.name} (${ECON[c.id].gini!.v})`).join(', ')}.</p>
        <Dumbbell onPick={onPick} />
      </article>
      <article className="tp-chartcard">
        <h2>Inequality since 1980</h2>
        <p className="tp-fine">Gini index of disposable income. Inequality rose in much of the West and in China after 1980, and fell in parts of Latin America after 2000.</p>
        <Trends />
      </article>
      <article className="tp-chartcard">
        <h2>Are richer countries more equal?</h2>
        <p className="tp-fine">GDP per person (log scale) against inequality after taxes, coloured by region. Rich countries span a wide range: income alone does not decide how evenly it is shared.</p>
        <XY pts={gdpPts} xLabel="GDP per person, current US$ (log)" yLabel="Gini after taxes" xLog onPick={onPick} xFmt={(v) => fmtUSD(v)} yFmt={(v) => `Gini ${v}`} />
      </article>
      <article className="tp-chartcard">
        <h2>Do the Compass placements match the data?</h2>
        <p className="tp-fine">Each country’s editorial placement on the Redistribution axis (from its laws) against SWIID’s measured redistribution. Points near a rising line mean the placement and the measurement agree. Countries with uncertain estimates are left out.</p>
        <XY pts={redPts} xLabel="Compass placement: Redistribution (self-reliance → welfare)" yLabel="Measured redistribution, %" onPick={onPick} xFmt={(v) => `placement ${v}`} yFmt={(v) => `${v}% redistribution`} />
      </article>
      <Sources />
    </>
  );
}
