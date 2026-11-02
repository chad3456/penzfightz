/** Through Their Eyes: countries and leaders judged by the ideas of 52 authors and philosophers. */
import { useMemo, useState } from 'react';
import { AXES } from './model';
import { COUNTRIES } from './countries';
import { LEADERS, type Leader } from './leaders';
import { AUTHORS, band, countryOnly, kinship, lensScore, srcLabel, type Author } from './authors';

const COUNTRY_BY_ID = Object.fromEntries(COUNTRIES.map((c) => [c.id, c]));
const AUTHOR_BY_ID = Object.fromEntries(AUTHORS.map((a) => [a.id, a]));

function heat(v: number | null, kind: 'nightmare' | 'ideal') {
  if (v == null) return 'transparent';
  const hue = kind === 'nightmare' ? 'var(--tp-them)' : 'var(--tp-society)';
  return `color-mix(in srgb, ${hue} ${Math.round(6 + (v / 100) * 46)}%, transparent)`;
}

function Bars({ rows, kind, onPick }: { rows: { key: string; label: string; v: number | null; note?: string }[]; kind: 'nightmare' | 'ideal'; onPick?: (key: string) => void }) {
  return (
    <div className="tp-hbars">
      {rows.map((r) => (
        <div key={r.key} className="tp-hbar">
          <span className="tp-hbar__label">{onPick ? <button className="tp-inline" onClick={() => onPick(r.key)}>{r.label}</button> : r.label}</span>
          <span className="tp-hbar__track"><i style={{ width: `${r.v ?? 0}%`, background: kind === 'nightmare' ? 'var(--tp-them)' : 'var(--tp-society)' }} /></span>
          <span className="tp-hbar__v">{r.v ?? '—'}</span>
          {r.note && <span className="tp-hbar__note">{r.note}</span>}
        </div>
      ))}
    </div>
  );
}

/** Small block for a country profile: the nightmares it most resembles and the ideals it most realises. */
export function CountryLenses({ cid, onAuthor }: { cid: string; onAuthor: (id: string) => void }) {
  const c = COUNTRY_BY_ID[cid];
  const res = AUTHORS.map((a) => ({ a, r: lensScore(a.lens, { v: c.v, cid }) })).filter((x) => x.r.v != null);
  const night = res.filter((x) => x.a.lens.kind === 'nightmare').sort((x, y) => y.r.v! - x.r.v!).slice(0, 4);
  const ideal = res.filter((x) => x.a.lens.kind === 'ideal').sort((x, y) => y.r.v! - x.r.v!).slice(0, 4);
  return (
    <div className="tp-socblock">
      <h2 className="tp-h2">Through the authors’ eyes</h2>
      <div className="tp-lensduo">
        <div><p className="tp-kicker">Nightmares it most resembles</p><Bars kind="nightmare" rows={night.map(({ a, r }) => ({ key: a.id, label: a.lens.name, v: r.v, note: `${a.name} · ${band(r.v!, 'nightmare')}` }))} onPick={onAuthor} /></div>
        <div><p className="tp-kicker">Ideals it comes closest to</p><Bars kind="ideal" rows={ideal.map(({ a, r }) => ({ key: a.id, label: a.lens.name, v: r.v, note: `${a.name} · ${band(r.v!, 'ideal')}` }))} onPick={onAuthor} /></div>
      </div>
    </div>
  );
}

/** Small block for a leader profile: the authors whose thought is closest. */
export function LeaderAuthors({ l, onAuthor }: { l: Leader; onAuthor: (id: string) => void }) {
  const near = AUTHORS.map((a) => ({ a, s: kinship(a, l.v) })).sort((x, y) => y.s - x.s).slice(0, 4);
  return (
    <div className="tp-socblock">
      <h2 className="tp-h2">Closest authors and philosophers</h2>
      <p className="tp-fine">By distance between {l.name}’s placement and each author’s on the twelve axes.</p>
      <div className="tp-authgrid">{near.map(({ a, s }) => <button key={a.id} className="tp-lcard" onClick={() => onAuthor(a.id)}><span className="tp-lcard__top"><span className="tp-lcard__name">{a.name}</span><span className="tp-lcard__pct">{s}%</span></span><span className="tp-lcard__meta">{a.works.split(',')[0]}</span></button>)}</div>
    </div>
  );
}

export default function Authors({ authorId, setAuthorId, you, onCountry, onLeader }: { authorId: string; setAuthorId: (id: string) => void; you: (number | null)[] | null; onCountry: (id: string) => void; onLeader: (id: string) => void }) {
  const [tab, setTab] = useState<'shelf' | 'matrix'>('shelf');
  const [who, setWho] = useState<'current' | 'all' | 'india'>('current');
  const [kindF, setKindF] = useState<'all' | 'nightmare' | 'ideal'>('all');
  const matrix = useMemo(() => COUNTRIES.map((c) => ({ c, s: AUTHORS.map((a) => lensScore(a.lens, { v: c.v, cid: c.id }).v) })), []);
  const a = AUTHOR_BY_ID[authorId] as Author | undefined;

  if (a) {
    const countries = COUNTRIES.map((c) => ({ c, r: lensScore(a.lens, { v: c.v, cid: c.id }) })).filter((x) => x.r.v != null).sort((x, y) => y.r.v! - x.r.v!);
    const pool = LEADERS.filter((l) => (who === 'current' ? l.era === 'current' : who === 'india' ? l.country === 'India' : true));
    const leaders = pool.map((l) => ({ l, r: lensScore(a.lens, { v: l.v }) })).filter((x) => x.r.v != null).sort((x, y) => y.r.v! - x.r.v!);
    const leaderUsable = a.lens.criteria.filter((c) => !countryOnly(c.src)).length >= 2;
    const kin = LEADERS.map((l) => ({ l, s: kinship(a, l.v) })).sort((x, y) => y.s - x.s);
    const kinC = COUNTRIES.map((c) => ({ c, s: kinship(a, c.v) })).sort((x, y) => y.s - x.s);
    return (
      <section className="tp-profile">
        <button className="tp-link" onClick={() => setAuthorId('')}>← All authors</button>
        <div className="tp-res-head">
          <div>
            <p className="tp-kicker">{a.from} · {a.years}</p>
            <h1 className="tp-title tp-title--sm">{a.name}</h1>
            <p className="tp-role">{a.works}</p>
            <p className="tp-lede">{a.idea}</p>
            {a.quote && <blockquote className="tp-quote">“{a.quote.replace(/\.$/, '')}.”</blockquote>}
            {you && <p className="tp-match">{kinship(a, you)}% similar to your Compass answers</p>}
          </div>
          <div className="tp-lenscard" style={{ ['--k' as string]: a.lens.kind === 'nightmare' ? 'var(--tp-them)' : 'var(--tp-society)' }}>
            <p className="tp-kicker">{a.lens.kind === 'nightmare' ? 'A warning' : 'An ideal'}</p>
            <h2>{a.lens.name}</h2>
            <p>{a.lens.question}</p>
            <p className="tp-fine">100 = {a.lens.top}. 0 = {a.lens.kind === 'nightmare' ? 'nothing like it' : 'its opposite'}.</p>
          </div>
        </div>

        <h2 className="tp-h2">How the lens is built</h2>
        <div className="tp-tablebox">
          <table className="tp-matrix">
            <thead><tr><th>From the work</th><th>Data used</th><th>Direction</th><th>Weight</th></tr></thead>
            <tbody>{a.lens.criteria.map((c, i) => (
              <tr key={i}><td>{c.why}</td><td>{srcLabel(c.src)}{countryOnly(c.src) ? ' (countries only)' : ''}</td><td>{c.dir === 1 ? 'Higher adds' : 'Lower adds'}</td><td>{c.w}</td></tr>
            ))}</tbody>
          </table>
        </div>
        <p className="tp-fine">Each criterion reads a 0–100 value; “lower adds” uses 100 minus the value. The score is the weighted mean of the criteria with data.</p>

        <h2 className="tp-h2">Countries through {a.name.split(' (')[0]}’s eyes</h2>
        <Bars kind={a.lens.kind} onPick={onCountry} rows={countries.map(({ c, r }) => ({ key: c.id, label: c.name, v: r.v, note: `${band(r.v!, a.lens.kind)}${r.used < r.total ? ` · ${r.used} of ${r.total} criteria known` : ''}` }))} />

        <h2 className="tp-h2">Leaders through {a.name.split(' (')[0]}’s eyes</h2>
        <div className="tp-chips" role="group" aria-label="Which leaders">
          <button aria-pressed={who === 'current'} onClick={() => setWho('current')}>In office</button>
          <button aria-pressed={who === 'india'} onClick={() => setWho('india')}>Indian figures</button>
          <button aria-pressed={who === 'all'} onClick={() => setWho('all')}>Everyone</button>
        </div>
        {leaderUsable ? (
          <>
            <p className="tp-fine">Leaders are scored on the twelve-axis criteria only; the legal indicators apply to countries.</p>
            <Bars kind={a.lens.kind} onPick={onLeader} rows={[...leaders.slice(0, 12), ...(leaders.length > 24 ? [] : leaders.slice(12))].map(({ l, r }) => ({ key: l.id, label: l.name, v: r.v, note: `${l.country} · ${band(r.v!, a.lens.kind)}` }))} />
            {leaders.length > 24 && <><p className="tp-kicker">Furthest from it</p><Bars kind={a.lens.kind} onPick={onLeader} rows={leaders.slice(-8).reverse().map(({ l, r }) => ({ key: l.id, label: l.name, v: r.v, note: l.country }))} /></>}
          </>
        ) : <p className="tp-fine">This lens rests on laws, so it applies to countries, not to individual leaders.</p>}

        <h2 className="tp-h2">Whose politics are closest to {a.name.split(' (')[0]}’s own?</h2>
        <p className="tp-fine">Kinship compares the author’s placement on the twelve axes with each leader’s and country’s; it is a different question from the lens above.</p>
        <div className="tp-lensduo">
          <div><p className="tp-kicker">Leaders</p><Bars kind="ideal" onPick={onLeader} rows={kin.slice(0, 8).map(({ l, s }) => ({ key: l.id, label: l.name, v: s, note: l.country }))} /></div>
          <div><p className="tp-kicker">Countries</p><Bars kind="ideal" onPick={onCountry} rows={kinC.slice(0, 8).map(({ c, s }) => ({ key: c.id, label: c.name, v: s }))} /></div>
        </div>
        <p className="tp-fine">Placement on the twelve axes: {AXES.map((x, i) => `${x.name} ${a.v[i]}`).join(' · ')}.</p>
      </section>
    );
  }

  const list = AUTHORS.filter((x) => kindF === 'all' || x.lens.kind === kindF);
  return (
    <section className="tp-charts">
      <div>
        <h1 className="tp-title tp-title--sm">Through Their Eyes</h1>
        <p className="tp-lede">{AUTHORS.length} authors and philosophers, from Chanakya and Confucius to Orwell and Atwood. Each one’s ideas become a lens — a Big Brother Index, a Gilead Index, Arthashastra statecraft — and every country and leader is scored through it. Each author is also placed on the twelve axes, so you can see whose politics are closest to theirs, and to yours.</p>
        <p className="tp-fine">These are interpretations. Every lens shows the criteria it uses, the data behind each one and why it follows from the work.</p>
      </div>
      <div className="tp-chips" role="tablist" aria-label="View">
        <button role="tab" aria-selected={tab === 'shelf'} aria-pressed={tab === 'shelf'} onClick={() => setTab('shelf')}>Authors</button>
        <button role="tab" aria-selected={tab === 'matrix'} aria-pressed={tab === 'matrix'} onClick={() => setTab('matrix')}>Every country, every lens</button>
      </div>
      {tab === 'shelf' ? (
        <>
          <div className="tp-chips" role="group" aria-label="Kind">
            <button aria-pressed={kindF === 'all'} onClick={() => setKindF('all')}>All</button>
            <button aria-pressed={kindF === 'nightmare'} onClick={() => setKindF('nightmare')}>Warnings (dystopias)</button>
            <button aria-pressed={kindF === 'ideal'} onClick={() => setKindF('ideal')}>Ideals</button>
          </div>
          <div className="tp-authgrid">
            {list.map((x) => {
              const top = COUNTRIES.map((c) => ({ c, v: lensScore(x.lens, { v: c.v, cid: c.id }).v })).filter((r) => r.v != null).sort((p, q) => q.v! - p.v!)[0];
              return (
                <button key={x.id} className={`tp-lcard tp-authcard tp-authcard--${x.lens.kind}`} onClick={() => setAuthorId(x.id)}>
                  <span className="tp-lcard__top"><span className="tp-lcard__name">{x.name}</span>{you && <span className="tp-lcard__pct">{kinship(x, you)}%</span>}</span>
                  <span className="tp-lcard__meta">{x.years} · {x.from}</span>
                  <span className="tp-lcard__role">{x.works.split(', ')[0]}</span>
                  <span className="tp-tag">{x.lens.name}</span>
                  {top && <span className="tp-lcard__meta">{x.lens.kind === 'nightmare' ? 'Closest to it' : 'Comes closest'}: {top.c.name} ({top.v})</span>}
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <article className="tp-chartcard">
          <p className="tp-fine">Red columns are warnings (higher = closer to the nightmare); green columns are ideals (higher = closer to the ideal). Click a heading for the lens, a country for its profile.</p>
          <div className="tp-tablebox">
            <table className="tp-heat tp-heat--authors">
              <thead><tr><th>Country</th>{AUTHORS.map((x) => <th key={x.id} title={`${x.name}: ${x.lens.name}`}><button className="tp-inline tp-vert" onClick={() => setAuthorId(x.id)}>{x.lens.name}</button></th>)}</tr></thead>
              <tbody>{matrix.map(({ c, s }) => (
                <tr key={c.id}><th><button className="tp-inline" onClick={() => onCountry(c.id)}>{c.name}</button></th>{s.map((v, i) => <td key={i} style={{ background: heat(v, AUTHORS[i].lens.kind) }}>{v ?? '—'}</td>)}</tr>
              ))}</tbody>
            </table>
          </div>
        </article>
      )}
    </section>
  );
}
