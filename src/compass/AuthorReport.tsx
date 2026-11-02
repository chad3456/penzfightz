/**
 * A detailed, interactive report on one country seen through all 52 author lenses:
 * radars, rankings, a criterion-by-criterion deep dive with a written verdict,
 * a scatter of any two lenses, kinship with authors and the country's leaders.
 */
import { useMemo, useState } from 'react';
import { AXES, band as axisBand } from './model';
import { COUNTRIES } from './countries';
import { LEADERS } from './leaders';
import { INDICATORS, SOC_AXES, SOC_VEC, valueOf } from './social';
import { AUTHORS, band, countryOnly, kinship, lensScore, srcLabel, type Author, type Criterion } from './authors';

const COUNTRY_BY_ID = Object.fromEntries(COUNTRIES.map((c) => [c.id, c]));
const AUTHOR_BY_ID = Object.fromEntries(AUTHORS.map((a) => [a.id, a]));
const IND = Object.fromEntries(INDICATORS.map((i) => [i.id, i]));
const WARN = AUTHORS.filter((a) => a.lens.kind === 'nightmare');
const IDEAL = AUTHORS.filter((a) => a.lens.kind === 'ideal');

/** Traditions used to group the ideals on one radar. */
export const TRADITIONS: { id: string; name: string; ids: string[] }[] = [
  { id: 'liberty', name: 'Liberty and law', ids: ['mill', 'locke', 'berlin', 'popper', 'havel', 'voltaire', 'montesquieu', 'tocqueville'] },
  { id: 'markets', name: 'Free markets', ids: ['smith', 'rand', 'nozick'] },
  { id: 'equality', name: 'Equality and welfare', ids: ['rawls', 'keynes', 'marx', 'kropotkin', 'dickens', 'hugo', 'steinbeck', 'ambedkar'] },
  { id: 'women', name: 'Women’s freedom', ids: ['wollstonecraft', 'beauvoir'] },
  { id: 'order', name: 'Order and sovereignty', ids: ['hobbes', 'machiavelli', 'plato', 'hanfeizi', 'chanakya', 'fanon', 'ibnkhaldun'] },
  { id: 'virtue', name: 'Virtue and good rule', ids: ['confucius', 'mencius', 'thiruvalluvar', 'aristotle', 'rousseau', 'burke'] },
  { id: 'peace', name: 'Non-violence and nature', ids: ['tolstoy', 'gandhi', 'thoreau', 'carson', 'tagore', 'mozi', 'laozi'] },
];

const SCORES: Record<string, Record<string, number | null>> = Object.fromEntries(COUNTRIES.map((c) => [c.id, Object.fromEntries(AUTHORS.map((a) => [a.id, lensScore(a.lens, { v: c.v, cid: c.id }).v]))]));
const avg = (xs: (number | null)[]) => { const v = xs.filter((x): x is number => x != null); return v.length ? Math.round(v.reduce((s, x) => s + x, 0) / v.length) : null; };
const WORLD: Record<string, number | null> = Object.fromEntries(AUTHORS.map((a) => [a.id, avg(COUNTRIES.map((c) => SCORES[c.id][a.id]))]));
const tradScore = (cid: string, t: (typeof TRADITIONS)[number]) => avg(t.ids.map((id) => SCORES[cid][id]));
const tradWorld = (t: (typeof TRADITIONS)[number]) => avg(t.ids.map((id) => WORLD[id]));

const C_THIS = 'var(--tp-them)', C_PEER = 'var(--tp-world)', C_WORLD = 'var(--ink-soft)';

/* ------------------------------------------------------------- charts */
function Radar({ labels, series, onLabel, active, size = 360 }: { labels: string[]; series: { v: (number | null)[]; color: string; dashed?: boolean; name: string }[]; onLabel?: (i: number) => void; active?: number; size?: number }) {
  const n = labels.length, R = size * 0.33, cx = size / 2, cy = size / 2;
  const pt = (i: number, r: number) => [cx + Math.sin((i / n) * 2 * Math.PI) * r, cy - Math.cos((i / n) * 2 * Math.PI) * r];
  return (
    <svg className="tp-radar tp-radar--big" viewBox={`-70 -10 ${size + 140} ${size + 20}`} role="img" aria-label={`Radar of ${labels.join(', ')}`}>
      {[0.25, 0.5, 0.75, 1].map((k) => <polygon key={k} points={labels.map((_, i) => pt(i, R * k).join(',')).join(' ')} className="tp-radar__ring" />)}
      {[25, 50, 75].map((k) => <text key={k} x={cx + 3} y={cy - R * (k / 100) - 2} className="tp-radar__tick">{k}</text>)}
      {labels.map((lab, i) => {
        const [x, y] = pt(i, R), [lx, ly] = pt(i, R + 16);
        return (
          <g key={lab + i} onClick={() => onLabel?.(i)} style={{ cursor: onLabel ? 'pointer' : 'default' }}>
            <line x1={cx} y1={cy} x2={x} y2={y} className="tp-radar__spoke" />
            <text x={lx} y={ly + 4} textAnchor={Math.abs(lx - cx) < 8 ? 'middle' : lx > cx ? 'start' : 'end'} className={`tp-radar__label${active === i ? ' is-active' : ''}`}>{lab}</text>
          </g>
        );
      })}
      {series.map((s, k) => (
        <g key={k}>
          <polygon points={s.v.map((x, i) => pt(i, R * ((x ?? 0) / 100)).join(',')).join(' ')}
            style={{ fill: s.dashed ? 'none' : `color-mix(in srgb, ${s.color} 14%, transparent)`, stroke: s.color }} strokeWidth={s.dashed ? 1.5 : 2.2} strokeLinejoin="round" strokeDasharray={s.dashed ? '5 4' : undefined} />
          {s.v.map((x, i) => x == null ? null : (
            <circle key={i} cx={pt(i, R * (x / 100))[0]} cy={pt(i, R * (x / 100))[1]} r={onLabel ? 5 : 3} style={{ fill: s.color, cursor: onLabel ? 'pointer' : 'default' }} onClick={() => onLabel?.(i)}>
              <title>{`${s.name} · ${labels[i]}: ${x}`}</title>
            </circle>
          ))}
        </g>
      ))}
    </svg>
  );
}

function Legend({ items }: { items: { name: string; color: string; dashed?: boolean }[] }) {
  return <p className="tp-legend">{items.map((it) => <span key={it.name} className="tp-legend__item"><span className={`tp-swatch${it.dashed ? ' tp-swatch--dash' : ''}`} style={{ ['--c' as string]: it.color }} />{it.name}</span>)}</p>;
}

/** Horizontal bar with markers for the world average and a peer country. */
function DotBar({ v, world, peer }: { v: number | null; world: number | null; peer?: number | null }) {
  return (
    <span className="tp-dotbar">
      <i className="tp-dotbar__fill" style={{ width: `${v ?? 0}%` }} />
      {world != null && <b className="tp-dotbar__world" style={{ left: `${world}%` }} title={`World average ${world}`} />}
      {peer != null && <b className="tp-dotbar__peer" style={{ left: `${peer}%` }} title={`Peer ${peer}`} />}
    </span>
  );
}

function LensScatter({ ax, ay, cid, peer, onPick }: { ax: Author; ay: Author; cid: string; peer: string; onPick: (id: string) => void }) {
  const [hover, setHover] = useState<string | null>(null);
  const W = 560, H = 420, P = 46;
  const sx = (x: number) => P + (x / 100) * (W - 2 * P), sy = (y: number) => H - P - (y / 100) * (H - 2 * P);
  const pts = COUNTRIES.map((c) => ({ c, x: SCORES[c.id][ax.id], y: SCORES[c.id][ay.id] })).filter((p) => p.x != null && p.y != null) as { c: (typeof COUNTRIES)[number]; x: number; y: number }[];
  const h = pts.find((p) => p.c.id === hover);
  return (
    <svg className="tp-scatter" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${ax.lens.name} against ${ay.lens.name}`}>
      <rect x={P} y={P} width={W - 2 * P} height={H - 2 * P} className="tp-scatter__frame" />
      <line x1={W / 2} x2={W / 2} y1={P} y2={H - P} className="tp-scatter__mid" />
      <line x1={P} x2={W - P} y1={H / 2} y2={H / 2} className="tp-scatter__mid" />
      <text x={W / 2} y={H - 10} textAnchor="middle" className="tp-scatter__axis">{ax.lens.name} ({ax.name}) →</text>
      <text x={14} y={H / 2} textAnchor="middle" className="tp-scatter__axis" transform={`rotate(-90 14 ${H / 2})`}>{ay.lens.name} ({ay.name}) →</text>
      {pts.map((p) => {
        const me = p.c.id === cid, pe = p.c.id === peer;
        return (
          <g key={p.c.id} onMouseEnter={() => setHover(p.c.id)} onMouseLeave={() => setHover(null)} onClick={() => onPick(p.c.id)} style={{ cursor: 'pointer' }}>
            <circle cx={sx(p.x)} cy={sy(p.y)} r={me || pe ? 8 : 5} style={{ fill: me ? C_THIS : pe ? C_PEER : 'color-mix(in srgb, var(--ink) 35%, transparent)' }} className="tp-scatter__dot" />
            {(me || pe || hover === p.c.id) && <text x={sx(p.x) + 10} y={sy(p.y) + 4} className="tp-scatter__label tp-scatter__label--strong">{p.c.name}</text>}
            <circle cx={sx(p.x)} cy={sy(p.y)} r={12} fill="transparent" />
          </g>
        );
      })}
      {h && <text x={W - P} y={P - 10} textAnchor="end" className="tp-scatter__axis">{h.c.name}: {h.x}, {h.y}</text>}
    </svg>
  );
}

/* ------------------------------------------------------------- reading a criterion */
function describe(c: Criterion, cid: string): string {
  const [kind, id] = c.src.split(':');
  const country = COUNTRY_BY_ID[cid];
  if (kind === 'ind') { const ind = IND[id]; const v = ind ? valueOf(ind, cid) : undefined; return `${ind?.name ?? id}: ${v?.label ?? 'unknown'}`; }
  if (kind === 'soc') { const i = SOC_AXES.findIndex((a) => a.id === id); return `${SOC_AXES[i].name} (Social Atlas) ${SOC_VEC[cid][i] ?? '—'}/100`; }
  if (kind === 'ax' || kind === 'near') { const i = AXES.findIndex((a) => a.id === id); const v = country.v[i]; return `${AXES[i].name}: ${axisBand(v, AXES[i])} (${v})`; }
  if (c.src === 'calc:moderation') return 'Average distance from the middle of the twelve axes';
  return srcLabel(c.src);
}
function noteFor(c: Criterion, cid: string) {
  const [kind, id] = c.src.split(':');
  return kind === 'ind' ? IND[id]?.notes[cid] : undefined;
}

function verdict(a: Author, cid: string) {
  const r = lensScore(a.lens, { v: COUNTRY_BY_ID[cid].v, cid });
  if (r.v == null) return null;
  const name = COUNTRY_BY_ID[cid].name;
  const parts = r.parts.filter((p) => p.x != null) as { c: Criterion; x: number }[];
  const up = parts.filter((p) => p.x >= 60).sort((p, q) => q.c.w * q.x - p.c.w * p.x).slice(0, 3);
  const down = parts.filter((p) => p.x <= 40).sort((p, q) => p.c.w * p.x - q.c.w * q.x).slice(0, 3);
  const rank = COUNTRIES.map((c) => SCORES[c.id][a.id]).filter((x): x is number => x != null).sort((x, y) => y - x).indexOf(r.v) + 1;
  const total = COUNTRIES.filter((c) => SCORES[c.id][a.id] != null).length;
  const w = WORLD[a.id] ?? 50;
  const rel = r.v > w + 8 ? 'well above' : r.v > w + 2 ? 'above' : r.v < w - 8 ? 'well below' : r.v < w - 2 ? 'below' : 'close to';
  const lead = `Through ${a.name}’s eyes, ${name} scores ${r.v} on the ${a.lens.name} — “${band(r.v, a.lens.kind).toLowerCase()}” — ranking ${rank} of ${total} countries and ${rel} the average of ${w}.`;
  const push = up.length ? `${a.lens.kind === 'nightmare' ? 'Bringing it closer to the nightmare' : 'Bringing it closer to the ideal'}: ${up.map((p) => describe(p.c, cid).toLowerCase()).join('; ')}.` : '';
  const hold = down.length ? `${a.lens.kind === 'nightmare' ? 'Keeping it away' : 'Holding it back'}: ${down.map((p) => describe(p.c, cid).toLowerCase()).join('; ')}.` : '';
  return { r, lead, push, hold, rank, total };
}

/* ------------------------------------------------------------- report */
export default function AuthorReport({ cid, setCid, onAuthor, onLeader, onCountry }: { cid: string; setCid: (id: string) => void; onAuthor: (id: string) => void; onLeader: (id: string) => void; onCountry: (id: string) => void }) {
  const c = COUNTRY_BY_ID[cid] ?? COUNTRIES[0];
  const [peer, setPeer] = useState(c.id === 'us' ? 'cn' : 'us');
  const [focus, setFocus] = useState('orwell');
  const [sx, setSx] = useState('orwell'), [sy, setSy] = useState('huxley');
  const [kin, setKin] = useState<string[]>(() => AUTHORS.map((a) => ({ a, s: kinship(a, c.v) })).sort((x, y) => y.s - x.s).slice(0, 2).map((x) => x.a.id));
  const [sortBy, setSortBy] = useState<'score' | 'gap'>('score');
  const peerId = peer === c.id ? (c.id === 'us' ? 'cn' : 'us') : peer;
  const peerC = COUNTRY_BY_ID[peerId];

  const mine = SCORES[c.id], theirs = peerC ? SCORES[peerC.id] : null;
  const warnAvg = avg(WARN.map((a) => mine[a.id])), idealAvg = avg(IDEAL.map((a) => mine[a.id]));
  const worstWarn = WARN.map((a) => ({ a, v: mine[a.id] })).filter((x) => x.v != null).sort((x, y) => y.v! - x.v!)[0];
  const bestIdeal = IDEAL.map((a) => ({ a, v: mine[a.id] })).filter((x) => x.v != null).sort((x, y) => y.v! - x.v!)[0];
  const kindred = useMemo(() => AUTHORS.map((a) => ({ a, s: kinship(a, c.v) })).sort((x, y) => y.s - x.s), [c.id]);
  const leaders = LEADERS.filter((l) => COUNTRIES.find((x) => x.name === l.country || x.alt?.includes(l.country))?.id === c.id);
  const fa = AUTHOR_BY_ID[focus];
  const fv = verdict(fa, c.id);
  const dist = COUNTRIES.map((x) => ({ x, v: SCORES[x.id][fa.id] })).filter((p) => p.v != null) as { x: (typeof COUNTRIES)[number]; v: number }[];
  const rows = AUTHORS.map((a) => ({ a, v: mine[a.id], w: WORLD[a.id], p: theirs?.[a.id] ?? null }))
    .filter((r) => r.v != null)
    .sort((x, y) => (sortBy === 'score' ? y.v! - x.v! : Math.abs(y.v! - (y.w ?? 50)) - Math.abs(x.v! - (x.w ?? 50))));
  const dataGaps = AUTHORS.flatMap((a) => lensScore(a.lens, { v: c.v, cid: c.id }).parts.filter((p) => p.x == null && countryOnly(p.c.src)).map((p) => `${a.lens.name}: ${srcLabel(p.c.src)}`));

  return (
    <section className="tp-report">
      <div className="tp-report__head">
        <div>
          <p className="tp-kicker">Country report · Through Their Eyes</p>
          <h1 className="tp-title tp-title--sm">{c.name}</h1>
          <p className="tp-role">{c.system}</p>
        </div>
        <div className="tp-filters">
          <label className="tp-pick">Country <select id="tp-rep-c" className="tp-input" value={c.id} onChange={(e) => setCid(e.target.value)}>{COUNTRIES.slice().sort((x, y) => x.name.localeCompare(y.name)).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
          <label className="tp-pick">Compare with <select id="tp-rep-p" className="tp-input" value={peerId} onChange={(e) => setPeer(e.target.value)}>{COUNTRIES.filter((x) => x.id !== c.id).sort((x, y) => x.name.localeCompare(y.name)).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
        </div>
      </div>

      <div className="tp-kpis">
        <div className="tp-kpi"><span className="tp-kpi__label">Average warning score</span><b className="tp-kpi__v" style={{ color: C_THIS }}>{warnAvg ?? '—'}</b><span className="tp-fine">across {WARN.length} dystopias · world {avg(WARN.map((a) => WORLD[a.id]))}</span></div>
        <div className="tp-kpi"><span className="tp-kpi__label">Average ideal score</span><b className="tp-kpi__v" style={{ color: 'var(--tp-society)' }}>{idealAvg ?? '—'}</b><span className="tp-fine">across {IDEAL.length} ideals · world {avg(IDEAL.map((a) => WORLD[a.id]))}</span></div>
        {worstWarn && <button className="tp-kpi" onClick={() => setFocus(worstWarn.a.id)}><span className="tp-kpi__label">Closest nightmare</span><b className="tp-kpi__v tp-kpi__v--sm">{worstWarn.a.lens.name}</b><span className="tp-fine">{worstWarn.a.name} · {worstWarn.v}</span></button>}
        {bestIdeal && <button className="tp-kpi" onClick={() => setFocus(bestIdeal.a.id)}><span className="tp-kpi__label">Closest ideal</span><b className="tp-kpi__v tp-kpi__v--sm">{bestIdeal.a.lens.name}</b><span className="tp-fine">{bestIdeal.a.name} · {bestIdeal.v}</span></button>}
        <button className="tp-kpi" onClick={() => onAuthor(kindred[0].a.id)}><span className="tp-kpi__label">Kindred author</span><b className="tp-kpi__v tp-kpi__v--sm">{kindred[0].a.name}</b><span className="tp-fine">{kindred[0].s}% similar on the twelve axes</span></button>
      </div>

      <div className="tp-report__grid">
        <article className="tp-chartcard">
          <h2>The warnings</h2>
          <p className="tp-fine">How close {c.name} comes to each dystopia; further out is closer to the nightmare. Click a spoke to open it below.</p>
          <Radar labels={WARN.map((a) => a.lens.name.replace(' Index', ''))} active={WARN.findIndex((a) => a.id === focus)} onLabel={(i) => setFocus(WARN[i].id)}
            series={[{ name: 'World average', v: WARN.map((a) => WORLD[a.id]), color: C_WORLD, dashed: true }, ...(peerC ? [{ name: peerC.name, v: WARN.map((a) => theirs![a.id]), color: C_PEER, dashed: true }] : []), { name: c.name, v: WARN.map((a) => mine[a.id]), color: C_THIS }]} />
          <Legend items={[{ name: c.name, color: C_THIS }, ...(peerC ? [{ name: peerC.name, color: C_PEER, dashed: true }] : []), { name: 'World average', color: C_WORLD, dashed: true }]} />
        </article>
        <article className="tp-chartcard">
          <h2>The ideals, by tradition</h2>
          <p className="tp-fine">Average of the ideal lenses in each tradition; further out is closer to the ideal.</p>
          <Radar labels={TRADITIONS.map((t) => t.name)}
            series={[{ name: 'World average', v: TRADITIONS.map(tradWorld), color: C_WORLD, dashed: true }, ...(peerC ? [{ name: peerC.name, v: TRADITIONS.map((t) => tradScore(peerC.id, t)), color: C_PEER, dashed: true }] : []), { name: c.name, v: TRADITIONS.map((t) => tradScore(c.id, t)), color: 'var(--tp-society)' }]} />
          <Legend items={[{ name: c.name, color: 'var(--tp-society)' }, ...(peerC ? [{ name: peerC.name, color: C_PEER, dashed: true }] : []), { name: 'World average', color: C_WORLD, dashed: true }]} />
          <ul className="tp-tradlist">{TRADITIONS.map((t) => <li key={t.id}><b>{t.name}</b> {tradScore(c.id, t) ?? '—'} <span className="tp-fine">({t.ids.map((id) => AUTHOR_BY_ID[id].name.replace(/ \(.*\)$/, '')).join(', ')})</span></li>)}</ul>
        </article>
      </div>

      <article className="tp-chartcard">
        <div className="tp-report__bar">
          <h2>Deep dive: {fa.lens.name}</h2>
          <select id="tp-rep-f" className="tp-input" value={focus} onChange={(e) => setFocus(e.target.value)} aria-label="Lens">
            <optgroup label="Warnings">{WARN.map((a) => <option key={a.id} value={a.id}>{a.lens.name} — {a.name}</option>)}</optgroup>
            <optgroup label="Ideals">{IDEAL.map((a) => <option key={a.id} value={a.id}>{a.lens.name} — {a.name}</option>)}</optgroup>
          </select>
        </div>
        <p className="tp-fine">{fa.lens.question} <button className="tp-inline" onClick={() => onAuthor(fa.id)}>About {fa.name} →</button></p>
        {fv ? (
          <>
            <div className="tp-verdict" style={{ ['--k' as string]: fa.lens.kind === 'nightmare' ? 'var(--tp-them)' : 'var(--tp-society)' }}>
              <b className="tp-verdict__score">{fv.r.v}</b>
              <div><p>{fv.lead}</p>{fv.push && <p>{fv.push}</p>}{fv.hold && <p>{fv.hold}</p>}</div>
            </div>
            <h3 className="tp-h3">Criterion by criterion</h3>
            <div className="tp-crit">
              {fv.r.parts.map((p, i) => (
                <div key={i} className="tp-crit__row">
                  <span className="tp-crit__why">{p.c.why}<em> weight {p.c.w}</em></span>
                  <span className="tp-crit__bar"><i style={{ width: `${p.x ?? 0}%`, background: p.x == null ? 'transparent' : fa.lens.kind === 'nightmare' ? 'var(--tp-them)' : 'var(--tp-society)' }} /></span>
                  <b className="tp-crit__v">{p.x ?? '—'}</b>
                  <span className="tp-crit__data">{p.x == null ? `${srcLabel(p.c.src)}: no data` : describe(p.c, c.id)}{noteFor(p.c, c.id) ? ` — ${noteFor(p.c, c.id)}` : ''}</span>
                </div>
              ))}
            </div>
            <p className="tp-fine">Each bar is that criterion’s 0–100 contribution towards {fa.lens.kind === 'nightmare' ? 'the nightmare' : 'the ideal'}; the score is their weighted mean.</p>
            <h3 className="tp-h3">Where {c.name} sits among {dist.length} countries</h3>
            <div className="tp-strip1d">
              {dist.map(({ x, v }) => <button key={x.id} className={`tp-strip1d__dot${x.id === c.id ? ' is-me' : x.id === peerId ? ' is-peer' : ''}`} style={{ left: `${v}%` }} title={`${x.name}: ${v}`} onClick={() => setCid(x.id)} />)}
              {WORLD[fa.id] != null && <i className="tp-strip1d__avg" style={{ left: `${WORLD[fa.id]}%` }} title={`Average ${WORLD[fa.id]}`} />}
            </div>
            <div className="tp-strip1d__ends"><span>0 · {fa.lens.kind === 'nightmare' ? 'nothing like it' : 'its opposite'}</span><span>Rank {fv.rank} of {fv.total}</span><span>100 · {fa.lens.top}</span></div>
          </>
        ) : <p className="tp-fine">Not enough data to score {c.name} on this lens.</p>}
      </article>

      <article className="tp-chartcard">
        <div className="tp-report__bar">
          <h2>All {AUTHORS.length} lenses</h2>
          <div className="tp-chips" role="group" aria-label="Sort"><button aria-pressed={sortBy === 'score'} onClick={() => setSortBy('score')}>By score</button><button aria-pressed={sortBy === 'gap'} onClick={() => setSortBy('gap')}>Most unusual</button></div>
        </div>
        <Legend items={[{ name: `${c.name} (red: warning, green: ideal)`, color: C_THIS }, { name: 'World average', color: C_WORLD }, ...(peerC ? [{ name: peerC.name, color: C_PEER }] : [])]} />
        <div className="tp-allrows">
          {rows.map(({ a, v, w, p }) => (
            <button key={a.id} className={`tp-allrow tp-allrow--${a.lens.kind}${a.id === focus ? ' is-on' : ''}`} onClick={() => setFocus(a.id)}>
              <span className="tp-allrow__name">{a.lens.name}<em>{a.name}</em></span>
              <DotBar v={v} world={w} peer={p} />
              <b>{v}</b>
              <span className="tp-allrow__gap">{w != null && v != null ? `${v - w > 0 ? '+' : ''}${v - w} vs avg` : ''}</span>
            </button>
          ))}
        </div>
      </article>

      <article className="tp-chartcard">
        <h2>Two lenses at once</h2>
        <div className="tp-filters">
          <label className="tp-pick">Across <select id="tp-rep-x" className="tp-input" value={sx} onChange={(e) => setSx(e.target.value)}>{AUTHORS.map((a) => <option key={a.id} value={a.id}>{a.lens.name}</option>)}</select></label>
          <label className="tp-pick">Up <select id="tp-rep-y" className="tp-input" value={sy} onChange={(e) => setSy(e.target.value)}>{AUTHORS.map((a) => <option key={a.id} value={a.id}>{a.lens.name}</option>)}</select></label>
        </div>
        <LensScatter ax={AUTHOR_BY_ID[sx]} ay={AUTHOR_BY_ID[sy]} cid={c.id} peer={peerId} onPick={setCid} />
        <p className="tp-fine">Every country, placed by both lenses. {c.name} is red{peerC ? `, ${peerC.name} blue` : ''}; click any dot to switch the report.</p>
      </article>

      <div className="tp-report__grid">
        <article className="tp-chartcard">
          <h2>Kindred authors</h2>
          <p className="tp-fine">Whose own politics are closest to {c.name}’s laws, on the twelve Compass axes. Pick up to two to overlay.</p>
          <Radar labels={AXES.map((x) => x.high)} size={320}
            series={[...kin.map((id, k) => ({ name: AUTHOR_BY_ID[id].name, v: AUTHOR_BY_ID[id].v, color: k ? 'var(--tp-econ)' : C_PEER, dashed: true })), { name: c.name, v: c.v, color: C_THIS }]} />
          <Legend items={[{ name: c.name, color: C_THIS }, ...kin.map((id, k) => ({ name: AUTHOR_BY_ID[id].name, color: k ? 'var(--tp-econ)' : C_PEER, dashed: true }))]} />
          <div className="tp-filters">
            {[0, 1].map((k) => (
              <select key={k} id={`tp-rep-k${k}`} className="tp-input" value={kin[k] ?? ''} onChange={(e) => setKin((cur) => { const n = cur.slice(); n[k] = e.target.value; return n.filter(Boolean); })} aria-label={`Author ${k + 1}`}>
                {k > 0 && <option value="">(none)</option>}
                {kindred.map(({ a, s }) => <option key={a.id} value={a.id}>{a.name} · {s}%</option>)}
              </select>
            ))}
          </div>
        </article>
        <article className="tp-chartcard">
          <h2>Closest and furthest in thought</h2>
          <ol className="tp-kinlist">{kindred.slice(0, 6).map(({ a, s }) => <li key={a.id}><button className="tp-inline" onClick={() => onAuthor(a.id)}>{a.name}</button> <b>{s}%</b><span className="tp-fine"> {a.idea}</span></li>)}</ol>
          <p className="tp-kicker">Furthest</p>
          <ol className="tp-kinlist">{kindred.slice(-3).reverse().map(({ a, s }) => <li key={a.id}><button className="tp-inline" onClick={() => onAuthor(a.id)}>{a.name}</button> <b>{s}%</b></li>)}</ol>
        </article>
      </div>

      {leaders.length > 0 && (
        <article className="tp-chartcard">
          <h2>{c.name}’s leaders through the same lens</h2>
          <p className="tp-fine">{fa.lens.name}, scored on each leader’s twelve-axis placement (the legal criteria apply only to the country). Change the lens in the deep dive above.</p>
          {lensScore(fa.lens, { v: c.v }).v == null ? <p className="tp-fine">This lens rests mostly on laws, so it does not apply to individual leaders.</p> : (
            <div className="tp-hbars">
              {leaders.map((l) => ({ l, v: lensScore(fa.lens, { v: l.v }).v, k: AUTHORS.map((a) => ({ a, s: kinship(a, l.v) })).sort((x, y) => y.s - x.s)[0] })).sort((x, y) => (y.v ?? 0) - (x.v ?? 0)).slice(0, 24).map(({ l, v, k }) => (
                <div key={l.id} className="tp-hbar">
                  <span className="tp-hbar__label"><button className="tp-inline" onClick={() => onLeader(l.id)}>{l.name}</button></span>
                  <span className="tp-hbar__track"><i style={{ width: `${v ?? 0}%`, background: fa.lens.kind === 'nightmare' ? 'var(--tp-them)' : 'var(--tp-society)' }} /></span>
                  <span className="tp-hbar__v">{v ?? '—'}</span>
                  <span className="tp-hbar__note">{l.years} · kindred author: {k.a.name} ({k.s}%)</span>
                </div>
              ))}
            </div>
          )}
        </article>
      )}

      <article className="tp-chartcard">
        <h2>About the data</h2>
        <p className="tp-fine">Scores combine {c.name}’s placement on the twelve Compass axes, its Social Atlas scores and its laws. {dataGaps.length ? `${dataGaps.length} legal criteria have no data for ${c.name} and are left out of the lenses they belong to:` : `Every legal criterion has data for ${c.name}.`}</p>
        {dataGaps.length > 0 && <ul className="tp-gaps">{dataGaps.map((g) => <li key={g}>{g}</li>)}</ul>}
        <p className="tp-fine">Lenses are interpretations of each author’s work; see each author’s page for how the lens is built. <button className="tp-inline" onClick={() => onCountry(c.id)}>Open {c.name}’s full country profile →</button></p>
      </article>
    </section>
  );
}
