/** The Social Atlas pages: twelve social axes for every country, indicator explorer, themes and leaders’ records. */
import { useMemo, useState } from 'react';
import { COUNTRIES } from './countries';
import { LEADERS } from './leaders';
import { INDICATORS, SCORED, SOC_AXES, SOC_AXIS, SOC_TOTAL, SOC_VEC, STANCES, STANCE_TOPICS, countryAxes, valueOf, type Indicator, type SocAxisId } from './social';

const COUNTRY_BY_ID = Object.fromEntries(COUNTRIES.map((c) => [c.id, c]));
const LEADER_BY_ID = Object.fromEntries(LEADERS.map((l) => [l.id, l]));
const SERIES = ['var(--tp-you)', 'var(--tp-them)', 'var(--tp-world)'];

const THEMES: { id: string; name: string; note: string; pick: (i: Indicator) => boolean }[] = [
  { id: 'marriage', name: 'Marriage and relationships', note: 'Who may marry, at what age, and whether the law punishes sex and adultery.', pick: (i) => !!i.theme?.includes('marriage') || i.axis === 'private' },
  { id: 'dating', name: 'Online dating', note: 'Whether dating apps work, whether gay apps are blocked, and whether the law punishes image abuse and deepfakes.', pick: (i) => !!i.theme?.includes('dating') },
  { id: 'rape', name: 'Rape and sexual violence', note: 'Marital rape, consent, escape clauses and the heaviest sentences.', pick: (i) => !!i.theme?.includes('rape') },
  { id: 'lgbt', name: 'LGBTQ+', note: 'From the death penalty to marriage equality.', pick: (i) => !!i.theme?.includes('lgbt') },
  { id: 'muslim', name: 'Laws on Muslim practice and religious minorities', note: 'Concrete laws that restrict how Muslims and other minorities may dress, build, eat, worship or gain citizenship. These are laws, not labels: the page does not call any country or person Islamophobic.', pick: (i) => !!i.theme?.includes('muslim') },
  { id: 'ideology', name: 'Communism and fascism in law', note: 'Who rules as a communist party, which countries ban communist or Nazi parties and symbols, and whether opposition can win.', pick: (i) => !!i.theme?.includes('ideology') },
];

function cellColor(score: number | null | undefined) {
  if (score == null) return 'transparent';
  // diverging: red below 60, neutral at 60, green towards 100
  if (score >= 60) return `color-mix(in srgb, var(--tp-society) ${Math.round(8 + ((score - 60) / 40) * 40)}%, transparent)`;
  return `color-mix(in srgb, var(--tp-them) ${Math.round(8 + ((60 - score) / 60) * 42)}%, transparent)`;
}

export function SocRadar({ series }: { series: { v: (number | null)[]; color: string; dashed?: boolean }[] }) {
  const n = SOC_AXES.length, R = 120, cx = 170, cy = 160;
  const pt = (i: number, r: number) => [cx + Math.sin((i / n) * 2 * Math.PI) * r, cy - Math.cos((i / n) * 2 * Math.PI) * r];
  return (
    <svg className="tp-radar" viewBox="-40 0 420 320" role="img" aria-label="Twelve social axes">
      {[0.25, 0.5, 0.75, 1].map((k) => <polygon key={k} points={SOC_AXES.map((_, i) => pt(i, R * k).join(',')).join(' ')} className="tp-radar__ring" />)}
      {SOC_AXES.map((a, i) => {
        const [x, y] = pt(i, R), [lx, ly] = pt(i, R + 20);
        return (
          <g key={a.id}>
            <line x1={cx} y1={cy} x2={x} y2={y} className="tp-radar__spoke" />
            <text x={lx} y={ly + 4} textAnchor={Math.abs(lx - cx) < 8 ? 'middle' : lx > cx ? 'start' : 'end'} className="tp-radar__label">{a.name}</text>
          </g>
        );
      })}
      {series.map((s, k) => (
        <polygon key={k} points={s.v.map((x, i) => pt(i, R * ((x ?? 0) / 100)).join(',')).join(' ')}
          style={{ fill: `color-mix(in srgb, ${s.color} 13%, transparent)`, stroke: s.color }} strokeWidth={2} strokeLinejoin="round" strokeDasharray={s.dashed ? '5 3' : undefined} />
      ))}
    </svg>
  );
}

function SocBars({ ids }: { ids: string[] }) {
  return (
    <div className="tp-axes-grid">
      {SOC_AXES.map((a, ai) => (
        <div key={a.id} className="tp-bar">
          <div className="tp-bar__ends"><span>{a.low}</span><b>{a.name}</b><span>{a.high}</span></div>
          <div className="tp-bar__track" style={{ ['--hue' as string]: a.hue }}>
            <i className="tp-bar__mid" />
            {ids.map((id, k) => { const v = SOC_VEC[id][ai]; return v == null ? null : <span key={id} className={`tp-bar__mark${k ? ' tp-bar__mark--ring' : ''}`} style={{ left: `${v}%`, ['--c' as string]: SERIES[k] }} title={`${COUNTRY_BY_ID[id].name}: ${v}`} />; })}
          </div>
          <p className="tp-band">{ids.map((id) => `${COUNTRY_BY_ID[id].name} ${SOC_VEC[id][ai] ?? '—'}`).join(' · ')}</p>
        </div>
      ))}
    </div>
  );
}

/** The social-law section shown on a country’s profile. */
export function CountrySocial({ cid }: { cid: string }) {
  const [open, setOpen] = useState<SocAxisId | null>(null);
  const s = countryAxes(cid);
  return (
    <div className="tp-socblock">
      <h2 className="tp-h2">Social Atlas: {COUNTRY_BY_ID[cid].name}’s laws on private and social life</h2>
      <p className="tp-fine">Overall {SOC_TOTAL(cid)} of 100. Each axis averages the scored indicators known for this country; open an axis to see every law behind it.</p>
      <div className="tp-res-head">
        <div className="tp-soclist">
          {SOC_AXES.map((a) => (
            <div key={a.id} className="tp-socrow">
              <button className="tp-socrow__head" aria-expanded={open === a.id} onClick={() => setOpen(open === a.id ? null : a.id)}>
                <span>{a.name}</span>
                <span className="tp-socrow__bar"><i style={{ width: `${s[a.id].v ?? 0}%`, background: a.hue }} /></span>
                <b>{s[a.id].v ?? '—'}</b>
                <em>{s[a.id].known}/{s[a.id].total} known</em>
              </button>
              {open === a.id && (
                <ul className="tp-socinds">
                  {INDICATORS.filter((i) => i.axis === a.id).map((i) => {
                    const v = valueOf(i, cid);
                    return (
                      <li key={i.id}>
                        <span className="tp-socinds__q">{i.name}</span>
                        <span className="tp-socinds__a" style={{ background: cellColor(v?.score) }}>{v ? v.label : 'Unknown'}{v?.score != null ? ` · ${v.score}` : v ? ' · fact' : ''}</span>
                        {i.notes[cid] && <span className="tp-socinds__n">{i.notes[cid]}</span>}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ))}
        </div>
        <SocRadar series={[{ v: SOC_VEC[cid], color: 'var(--tp-them)' }]} />
      </div>
    </div>
  );
}

/** Leader’s social record, shown on a leader’s profile. */
export function LeaderSocial({ lid }: { lid: string }) {
  const st = STANCES[lid];
  if (!st) return null;
  return (
    <div className="tp-socblock">
      <h2 className="tp-h2">Record on social questions</h2>
      <div className="tp-stances">
        {STANCE_TOPICS.filter((t) => st[t.id]).map((t) => {
          const [v, ev] = st[t.id]!;
          return (
            <div key={t.id} className="tp-stance">
              <div className="tp-bar__ends"><span>{t.low}</span><b>{t.name}</b><span>{t.high}</span></div>
              <div className="tp-bar__track" style={{ ['--hue' as string]: 'var(--tp-society)' }}><i className="tp-bar__mid" /><span className="tp-bar__mark tp-bar__mark--ring" style={{ left: `${v}%`, ['--c' as string]: 'var(--tp-them)' }} /></div>
              <p className="tp-fine">{ev}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Society({ onCountry, onLeader }: { onCountry: (id: string) => void; onLeader: (id: string) => void }) {
  const [tab, setTab] = useState<'rank' | 'compare' | 'themes' | 'indicators' | 'leaders'>('rank');
  const [sortAxis, setSortAxis] = useState<SocAxisId | 'total'>('total');
  const [picked, setPicked] = useState<string[]>(['se', 'us', 'ir']);
  const [theme, setTheme] = useState('marriage');
  const [indId, setIndId] = useState('v_marital');
  const [topic, setTopic] = useState<'lgbt' | 'women' | 'religion' | 'speech'>('lgbt');

  const ranked = useMemo(() => COUNTRIES.slice().sort((a, b) => {
    if (sortAxis === 'total') return SOC_TOTAL(b.id) - SOC_TOTAL(a.id);
    const i = SOC_AXES.findIndex((x) => x.id === sortAxis);
    return (SOC_VEC[b.id][i] ?? -1) - (SOC_VEC[a.id][i] ?? -1);
  }), [sortAxis]);
  const scoredCount = SCORED.length;

  let body;
  if (tab === 'rank') {
    body = (
      <>
        <p className="tp-fine">Every country on all twelve axes. Pick an axis to sort by it; click a country for the laws behind each score. Darker green is freer or better protected; red is more restrictive.</p>
        <div className="tp-chips" role="group" aria-label="Sort by">
          <button aria-pressed={sortAxis === 'total'} onClick={() => setSortAxis('total')}>Overall</button>
          {SOC_AXES.map((a) => <button key={a.id} aria-pressed={sortAxis === a.id} onClick={() => setSortAxis(a.id)}>{a.name}</button>)}
        </div>
        <div className="tp-tablebox">
          <table className="tp-heat">
            <thead><tr><th>Country</th><th>All</th>{SOC_AXES.map((a) => <th key={a.id} title={a.question}><span>{a.name}</span></th>)}</tr></thead>
            <tbody>
              {ranked.map((c) => (
                <tr key={c.id}>
                  <th><button className="tp-inline" onClick={() => onCountry(c.id)}>{c.name}</button></th>
                  <td style={{ background: cellColor(SOC_TOTAL(c.id)) }}><b>{SOC_TOTAL(c.id)}</b></td>
                  {SOC_VEC[c.id].map((v, i) => <td key={i} style={{ background: cellColor(v) }}>{v ?? '—'}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  } else if (tab === 'compare') {
    body = (
      <>
        <div className="tp-filters">
          {[0, 1, 2].map((k) => (
            <label key={k} className="tp-pick">
              <span className="tp-dot" style={{ ['--c' as string]: SERIES[k] }} />
              <select id={`tp-soc-${k}`} className="tp-input" value={picked[k] ?? ''} onChange={(e) => setPicked((p) => { const n = p.slice(); n[k] = e.target.value; return n.filter(Boolean); })}>
                <option value="">{k < 1 ? 'Choose…' : '(none)'}</option>
                {COUNTRIES.slice().sort((a, b) => a.name.localeCompare(b.name)).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
          ))}
        </div>
        <div className="tp-res-head tp-res-head--center"><SocRadar series={picked.map((id, k) => ({ v: SOC_VEC[id], color: SERIES[k], dashed: k > 0 }))} /></div>
        <p className="tp-legend">{picked.map((id, k) => <span key={id} className="tp-legend__item"><span className="tp-dot" style={{ ['--c' as string]: SERIES[k] }} />{COUNTRY_BY_ID[id].name} · {SOC_TOTAL(id)}</span>)}</p>
        <SocBars ids={picked} />
        <h2 className="tp-h2">Where they differ</h2>
        <div className="tp-tablebox">
          <table className="tp-matrix">
            <thead><tr><th>Indicator</th>{picked.map((id) => <th key={id}>{COUNTRY_BY_ID[id].name}</th>)}</tr></thead>
            <tbody>
              {INDICATORS.filter((i) => new Set(picked.map((id) => i.data[id])).size > 1).map((i) => (
                <tr key={i.id}>
                  <th>{i.name}<span className="tp-fine"> · {SOC_AXIS[i.axis].name}</span></th>
                  {picked.map((id) => { const v = valueOf(i, id); return <td key={id} style={{ background: cellColor(v?.score) }}>{v?.label ?? 'Unknown'}</td>; })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  } else if (tab === 'themes') {
    const th = THEMES.find((t) => t.id === theme)!;
    const inds = INDICATORS.filter(th.pick);
    body = (
      <>
        <div className="tp-chips" role="group" aria-label="Theme">{THEMES.map((t) => <button key={t.id} aria-pressed={theme === t.id} onClick={() => setTheme(t.id)}>{t.name}</button>)}</div>
        <p className="tp-lede">{th.note}</p>
        <div className="tp-tablebox">
          <table className="tp-matrix tp-matrix--wide">
            <thead><tr><th>Country</th>{inds.map((i) => <th key={i.id} title={i.q}>{i.name}</th>)}</tr></thead>
            <tbody>
              {COUNTRIES.slice().sort((a, b) => a.name.localeCompare(b.name)).map((c) => (
                <tr key={c.id}>
                  <th><button className="tp-inline" onClick={() => onCountry(c.id)}>{c.name}</button></th>
                  {inds.map((i) => { const v = valueOf(i, c.id); return <td key={i.id} style={{ background: cellColor(v?.score) }} title={i.notes[c.id]}>{v?.label ?? '?'}{i.notes[c.id] ? ' *' : ''}</td>; })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="tp-fine">* A note explains this entry; hover it, or open the indicator under Indicators.</p>
      </>
    );
  } else if (tab === 'indicators') {
    const ind = INDICATORS.find((i) => i.id === indId)!;
    body = (
      <>
        <div className="tp-filters">
          <select id="tp-ind" className="tp-input" value={indId} onChange={(e) => setIndId(e.target.value)} aria-label="Indicator">
            {SOC_AXES.map((a) => <optgroup key={a.id} label={a.name}>{INDICATORS.filter((i) => i.axis === a.id).map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}</optgroup>)}
          </select>
        </div>
        <article className="tp-chartcard">
          <p className="tp-kicker">{SOC_AXIS[ind.axis].name} · {ind.values.some((v) => v.score !== null) ? 'scored' : 'shown as a fact, not scored'} · {ind.conf === 'documented' ? 'well documented' : 'check: sources differ or the law is changing'}</p>
          <h2>{ind.q}</h2>
          <p className="tp-fine">Basis: {ind.basis}</p>
          <div className="tp-indgroups">
            {[...ind.values, { code: '?', label: 'Unknown', score: null }].map((v) => {
              const list = COUNTRIES.filter((c) => ind.data[c.id] === v.code);
              if (!list.length) return null;
              return (
                <div key={v.code} className="tp-indgroup" style={{ borderTopColor: v.code === '?' ? 'var(--paper-edge)' : v.score == null ? 'var(--ink-soft)' : cellColor(v.score) }}>
                  <h3>{v.label}{v.score != null ? <span> {v.score}</span> : null} <em>{list.length}</em></h3>
                  <ul>{list.map((c) => <li key={c.id}><button className="tp-inline" onClick={() => onCountry(c.id)}>{c.name}</button>{ind.notes[c.id] && <span className="tp-fine"> — {ind.notes[c.id]}</span>}</li>)}</ul>
                </div>
              );
            })}
          </div>
        </article>
      </>
    );
  } else {
    const ids = Object.keys(STANCES).filter((id) => STANCES[id][topic] && LEADER_BY_ID[id]).sort((a, b) => STANCES[a][topic]![0] - STANCES[b][topic]![0]);
    const t = STANCE_TOPICS.find((x) => x.id === topic)!;
    body = (
      <>
        <p className="tp-fine">Leaders placed only where a clear, documented act shows their record. A placement rests on what they signed, ordered or enforced, quoted beside it.</p>
        <div className="tp-chips" role="group" aria-label="Topic">{STANCE_TOPICS.map((x) => <button key={x.id} aria-pressed={topic === x.id} onClick={() => setTopic(x.id)}>{x.name}</button>)}</div>
        <div className="tp-stancelist">
          {ids.map((id) => {
            const [v, ev] = STANCES[id][topic]!, l = LEADER_BY_ID[id];
            return (
              <div key={id} className="tp-stancerow">
                <button className="tp-inline tp-stancerow__name" onClick={() => onLeader(id)}>{l.name}</button>
                <span className="tp-hbar__track"><i style={{ width: `${v}%`, background: cellColor(v) === 'transparent' ? 'var(--ink)' : `color-mix(in srgb, var(--tp-society) ${v}%, var(--tp-them))` }} /></span>
                <b className="tp-hbar__v">{v}</b>
                <span className="tp-hbar__note">{l.country} · {ev}</span>
              </div>
            );
          })}
        </div>
        <p className="tp-fine">Scale: 0 = {t.low.toLowerCase()} most, 100 = {t.high.toLowerCase()} most.</p>
      </>
    );
  }

  return (
    <section className="tp-charts">
      <div>
        <h1 className="tp-title tp-title--sm">Social Atlas</h1>
        <p className="tp-lede">How {COUNTRIES.length} countries’ laws treat marriage, relationships, sex, rape, LGBTQ+ people, women, religion, political ideology, speech, punishment, online dating and personal choices: twelve axes built from {INDICATORS.length} legal indicators ({scoredCount} scored, {INDICATORS.length - scoredCount} shown as facts).</p>
        <p className="tp-fine">Scores measure the law, not the people. 0 is the most restrictive or punitive answer, 100 the freest or best protected. Unknowns are left blank, never guessed.</p>
      </div>
      <div className="tp-chips" role="tablist" aria-label="Social Atlas">
        {([['rank', 'All countries'], ['compare', 'Compare countries'], ['themes', 'Themes'], ['indicators', 'Indicators'], ['leaders', 'Leaders’ records']] as const).map(([id, name]) => <button key={id} role="tab" aria-selected={tab === id} aria-pressed={tab === id} onClick={() => setTab(id)}>{name}</button>)}
      </div>
      <article className="tp-chartcard">{body}</article>
    </section>
  );
}
