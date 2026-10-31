/**
 * Twelve-Point Compass — a twelve-axis political values test, a directory of
 * leaders placed on the same axes from their records, and comparisons.
 */
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AXES, AXIS, CHOICES, FAMILIES, GROUPS, QUESTIONS, band, decode, encode, score, similarity, toVec, type Answers, type GroupId } from './model';
import { CHECKED, ERAS, LEADERS, type Era, type Leader, type Region } from './leaders';

type View = 'home' | 'test' | 'results' | 'leaders' | 'leader' | 'compare' | 'axes' | 'method' | 'history';
type Saved = { at: number; code: string };
type Pick = { kind: 'you' } | { kind: 'leader'; id: string } | { kind: 'family'; id: string };

const GROUP_HUE: Record<GroupId, string> = { economy: 'var(--tp-econ)', state: 'var(--tp-state)', society: 'var(--tp-society)', world: 'var(--tp-world)' };
const REGIONS: Region[] = ['Americas', 'Europe', 'Asia', 'Middle East', 'Africa', 'Oceania'];
const LEADER_BY_ID = Object.fromEntries(LEADERS.map((l) => [l.id, l]));

const store = {
  get<T>(k: string, d: T): T { try { const v = localStorage.getItem(k); return v == null ? d : (JSON.parse(v) as T); } catch { return d; } },
  set(k: string, v: unknown) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage blocked: the page still works */ } },
};

function vecOf(p: Pick, you: (number | null)[] | null): (number | null)[] | null {
  if (p.kind === 'you') return you;
  if (p.kind === 'leader') return LEADER_BY_ID[p.id]?.v ?? null;
  return FAMILIES.find((f) => f.id === p.id)?.v ?? null;
}
function nameOf(p: Pick) {
  if (p.kind === 'you') return 'You';
  if (p.kind === 'leader') return LEADER_BY_ID[p.id]?.name ?? '?';
  return FAMILIES.find((f) => f.id === p.id)?.name ?? '?';
}
const pickKey = (p: Pick) => (p.kind === 'you' ? 'you' : `${p.kind}:${p.id}`);
const parsePick = (s: string): Pick => (s === 'you' ? { kind: 'you' } : s.startsWith('leader:') ? { kind: 'leader', id: s.slice(7) } : { kind: 'family', id: s.slice(7) });

/* ------------------------------------------------------------------ pieces */

function AxisBar({ axis, marks }: { axis: (typeof AXES)[number]; marks: { v: number | null; label: string; kind: 'you' | 'them' | 'other' }[] }) {
  return (
    <div className="tp-bar">
      <div className="tp-bar__ends"><span>{axis.low}</span><b>{axis.name}</b><span>{axis.high}</span></div>
      <div className="tp-bar__track" style={{ ['--hue' as string]: GROUP_HUE[axis.group] }}>
        <i className="tp-bar__mid" />
        {marks.map((m, i) => m.v == null ? null : (
          <span key={i} className={`tp-bar__mark tp-bar__mark--${m.kind}`} style={{ left: `${m.v}%` }} title={`${m.label}: ${m.v} (${band(m.v, axis)})`} />
        ))}
      </div>
    </div>
  );
}

function Strip({ v }: { v: (number | null)[] }) {
  return (
    <div className="tp-strip" aria-hidden="true">
      {AXES.map((a, i) => (
        <i key={a.id} style={{ ['--x' as string]: v[i] == null ? '50%' : `${v[i]}%`, ['--hue' as string]: GROUP_HUE[a.group] }} />
      ))}
    </div>
  );
}

function Radar({ series }: { series: { v: (number | null)[]; cls: string }[] }) {
  const n = AXES.length, R = 120, cx = 170, cy = 160;
  const pt = (i: number, r: number) => [cx + Math.sin((i / n) * 2 * Math.PI) * r, cy - Math.cos((i / n) * 2 * Math.PI) * r];
  return (
    <svg className="tp-radar" viewBox="0 0 340 320" role="img" aria-label="Shape of the result on all twelve axes">
      {[0.25, 0.5, 0.75, 1].map((k) => (
        <polygon key={k} points={AXES.map((_, i) => pt(i, R * k).join(',')).join(' ')} className="tp-radar__ring" />
      ))}
      {AXES.map((a, i) => {
        const [x, y] = pt(i, R), [lx, ly] = pt(i, R + 22);
        return (
          <g key={a.id}>
            <line x1={cx} y1={cy} x2={x} y2={y} className="tp-radar__spoke" />
            <text x={lx} y={ly + 4} textAnchor={Math.abs(lx - cx) < 8 ? 'middle' : lx > cx ? 'start' : 'end'} className="tp-radar__label">{a.high}</text>
          </g>
        );
      })}
      {series.map((s, k) => (
        <polygon key={k} className={s.cls} points={s.v.map((x, i) => pt(i, R * ((x ?? 50) / 100)).join(',')).join(' ')} />
      ))}
    </svg>
  );
}

function LeaderCard({ l, you, onOpen }: { l: Leader; you: (number | null)[] | null; onOpen: () => void }) {
  return (
    <button className="tp-lcard" onClick={onOpen}>
      <span className="tp-lcard__top">
        <span className="tp-lcard__name">{l.name}</span>
        {you && <span className="tp-lcard__pct">{similarity(you, l.v)}%</span>}
      </span>
      <span className="tp-lcard__role">{l.role}</span>
      <span className="tp-lcard__meta">{l.country} · {l.years}</span>
      <Strip v={l.v} />
    </button>
  );
}

/* ------------------------------------------------------------------ page */

export default function Compass({ onExit }: { onExit: () => void }) {
  const [view, setView] = useState<View>('home');
  const [answers, setAnswers] = useState<Answers>(() => store.get('tpc-progress', { answers: {} as Answers, idx: 0 }).answers);
  const [idx, setIdx] = useState<number>(() => store.get('tpc-progress', { answers: {}, idx: 0 }).idx);
  const [history, setHistory] = useState<Saved[]>(() => store.get('tpc-history', [] as Saved[]));
  const [shown, setShown] = useState<(number | null)[] | null>(() => { const h = store.get('tpc-history', [] as Saved[]); return h.length ? decode(h[h.length - 1].code) : null; });
  const [leaderId, setLeaderId] = useState<string>('');
  const [q, setQ] = useState('');
  const [region, setRegion] = useState<Region | ''>('');
  const [era, setEra] = useState<Era | ''>('');
  const [sortBy, setSortBy] = useState<'match' | 'name'>('match');
  const [cmpA, setCmpA] = useState<Pick>({ kind: 'you' });
  const [cmpB, setCmpB] = useState<Pick>({ kind: 'leader', id: 'lula' });
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => { store.set('tpc-progress', { answers, idx }); }, [answers, idx]);
  useEffect(() => { store.set('tpc-history', history); }, [history]);
  useEffect(() => { window.scrollTo(0, 0); setMsg(''); }, [view, leaderId]);

  const you = shown;
  const answered = Object.keys(answers).length;

  const finish = useCallback((a: Answers) => {
    const v = toVec(score(a));
    setShown(v);
    setHistory((h) => [...h, { at: Date.now(), code: encode(v) }].slice(-40));
    setView('results');
  }, []);

  const answer = useCallback((value: number | null) => {
    const qn = QUESTIONS[idx];
    const next = { ...answers, [qn.id]: value };
    setAnswers(next);
    if (idx + 1 >= QUESTIONS.length) finish(next);
    else setIdx(idx + 1);
  }, [answers, idx, finish]);

  useEffect(() => {
    if (view !== 'test') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
      const map: Record<string, number | null> = { '1': 2, '2': 1, '3': 0, '4': -1, '5': -2, '0': null };
      if (e.key in map) answer(map[e.key]);
      else if (e.key === 'Backspace' || e.key === 'ArrowLeft') setIdx((i) => Math.max(0, i - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [view, answer]);

  const start = (fresh: boolean) => {
    if (fresh) { setAnswers({}); setIdx(0); }
    setView('test');
  };
  const openLeader = (id: string) => { setLeaderId(id); setView('leader'); };

  const ranked = useMemo(() => (you ? LEADERS.map((l) => ({ l, s: similarity(you, l.v) })).sort((a, b) => b.s - a.s) : []), [you]);
  const families = useMemo(() => (you ? FAMILIES.map((f) => ({ f, s: similarity(you, f.v) })).sort((a, b) => b.s - a.s) : []), [you]);

  const copy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); setMsg('Copied.'); } catch { setMsg('Copy the code above by hand.'); }
  };

  const nav: [View, string][] = [['home', 'Start'], ['test', 'Test'], ['results', 'My result'], ['leaders', 'Leaders'], ['compare', 'Compare'], ['axes', 'The axes'], ['method', 'Method'], ['history', 'History']];

  /* ---------------- views ---------------- */
  let body: ReactNode;
  if (view === 'home') {
    body = (
      <section className="tp-home">
        <div className="tp-hero">
          <p className="tp-kicker">72 statements · 12 axes · {LEADERS.length} leaders</p>
          <h1 className="tp-title">Twelve-Point Compass</h1>
          <p className="tp-lede">Most political tests squeeze you onto two lines, left and right, liberal and authoritarian. This one asks about twelve separate questions people actually disagree on, then shows which leaders, past and present, made choices in office closest to yours.</p>
          <div className="tp-actions">
            <button className="tp-btn tp-btn--ink" onClick={() => start(answered === 0 || answered >= QUESTIONS.length)}>{answered > 0 && answered < QUESTIONS.length ? `Resume at question ${idx + 1}` : 'Take the test'}</button>
            {answered > 0 && answered < QUESTIONS.length && <button className="tp-btn" onClick={() => start(true)}>Start again</button>}
            <button className="tp-btn" onClick={() => setView('leaders')}>Browse leaders</button>
          </div>
          <p className="tp-fine">About ten minutes. Answers stay in this browser; nothing is sent anywhere.</p>
        </div>
        <div className="tp-groups">
          {GROUPS.map((g) => (
            <div key={g.id} className="tp-group" style={{ ['--hue' as string]: GROUP_HUE[g.id] }}>
              <h2>{g.name}</h2>
              <p className="tp-fine">{g.note}</p>
              <ul>{AXES.filter((a) => a.group === g.id).map((a) => <li key={a.id}><b>{a.name}</b> {a.low} ↔ {a.high}</li>)}</ul>
            </div>
          ))}
        </div>
      </section>
    );
  } else if (view === 'test') {
    const qn = QUESTIONS[Math.min(idx, QUESTIONS.length - 1)];
    const ax = AXIS[qn.axis];
    const g = GROUPS.find((x) => x.id === ax.group)!;
    const cur = answers[qn.id];
    body = (
      <section className="tp-test">
        <div className="tp-progress" role="progressbar" aria-valuemin={0} aria-valuemax={QUESTIONS.length} aria-valuenow={idx}><i style={{ width: `${(idx / QUESTIONS.length) * 100}%` }} /></div>
        <p className="tp-kicker" style={{ color: GROUP_HUE[ax.group] }}>{g.name} · question {idx + 1} of {QUESTIONS.length}</p>
        <h2 className="tp-statement">{qn.text}</h2>
        <div className="tp-choices">
          {CHOICES.map((c, i) => (
            <button key={c.v} className={`tp-choice${cur === c.v ? ' is-on' : ''}`} onClick={() => answer(c.v)}><kbd>{i + 1}</kbd>{c.label}</button>
          ))}
          <button className={`tp-choice tp-choice--skip${cur === null ? ' is-on' : ''}`} onClick={() => answer(null)}><kbd>0</kbd>Not sure / skip</button>
        </div>
        <div className="tp-actions">
          <button className="tp-btn" disabled={idx === 0} onClick={() => setIdx(idx - 1)}>← Back</button>
          {answered >= 24 && <button className="tp-btn" onClick={() => finish(answers)}>See results so far</button>}
        </div>
        <p className="tp-fine">Keys: 1 strongly agree … 5 strongly disagree, 0 skip, ← back.</p>
      </section>
    );
  } else if (view === 'results') {
    if (!you) {
      body = <section className="tp-empty"><p>No result yet.</p><button className="tp-btn tp-btn--ink" onClick={() => start(true)}>Take the test</button></section>;
    } else {
      const top = families[0];
      body = (
        <section className="tp-results">
          <div className="tp-res-head">
            <div>
              <p className="tp-kicker">Your nearest family of thought</p>
              <h1 className="tp-title tp-title--sm">{top.f.name}</h1>
              <p className="tp-lede">{top.f.note} Next closest: {families[1].f.name} ({families[1].s}%), {families[2].f.name} ({families[2].s}%).</p>
            </div>
            <Radar series={[{ v: you, cls: 'tp-radar__you' }]} />
          </div>
          <div className="tp-axes-grid">
            {GROUPS.map((g) => (
              <div key={g.id} className="tp-axgroup">
                <h2 style={{ color: GROUP_HUE[g.id] }}>{g.name}</h2>
                {AXES.filter((a) => a.group === g.id).map((a) => {
                  const v = you[AXES.indexOf(a)];
                  return (
                    <div key={a.id}>
                      <AxisBar axis={a} marks={[{ v, label: 'You', kind: 'you' }]} />
                      <p className="tp-band">{v == null ? 'Skipped' : `${band(v, a)} · ${v}`}</p>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <h2 className="tp-h2">Leaders whose records are closest to your answers</h2>
          <div className="tp-lgrid">{ranked.slice(0, 8).map(({ l }) => <LeaderCard key={l.id} l={l} you={you} onOpen={() => openLeader(l.id)} />)}</div>
          <h2 className="tp-h2">Furthest from you</h2>
          <div className="tp-lgrid">{ranked.slice(-4).reverse().map(({ l }) => <LeaderCard key={l.id} l={l} you={you} onOpen={() => openLeader(l.id)} />)}</div>
          <div className="tp-share">
            <p className="tp-kicker">Your result code</p>
            <code>{encode(you)}</code>
            <div className="tp-actions">
              <button className="tp-btn" onClick={() => copy(encode(you))}>Copy code</button>
              <button className="tp-btn" onClick={() => { setCmpA({ kind: 'you' }); setView('compare'); }}>Compare with a leader</button>
              <button className="tp-btn" onClick={() => start(true)}>Retake</button>
            </div>
            <p className="tp-fine" aria-live="polite">{msg || 'Paste a code under History to see a saved or shared result.'}</p>
          </div>
        </section>
      );
    }
  } else if (view === 'leaders') {
    const text = q.trim().toLowerCase();
    let list = LEADERS.filter((l) => (!region || l.region === region) && (!era || l.era === era) && (!text || `${l.name} ${l.country} ${l.role}`.toLowerCase().includes(text)));
    list = sortBy === 'match' && you ? list.slice().sort((a, b) => similarity(you, b.v) - similarity(you, a.v)) : list.slice().sort((a, b) => a.name.localeCompare(b.name));
    body = (
      <section className="tp-leaders">
        <h1 className="tp-title tp-title--sm">Leaders</h1>
        <p className="tp-lede">{LEADERS.length} heads of state and government, opposition leaders and historical figures, placed on the same twelve axes from what they did in power. Offices checked on {CHECKED}.</p>
        <div className="tp-filters">
          <input id="tp-search" className="tp-input" type="search" placeholder="Search name or country" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search leaders" />
          <select id="tp-region" className="tp-input" value={region} onChange={(e) => setRegion(e.target.value as Region | '')} aria-label="Region">
            <option value="">All regions</option>{REGIONS.map((r) => <option key={r}>{r}</option>)}
          </select>
          <div className="tp-chips" role="group" aria-label="Era">
            <button aria-pressed={!era} onClick={() => setEra('')}>All</button>
            {ERAS.map((e) => <button key={e.id} aria-pressed={era === e.id} onClick={() => setEra(e.id)}>{e.name}</button>)}
          </div>
          {you && <div className="tp-chips" role="group" aria-label="Sort">
            <button aria-pressed={sortBy === 'match'} onClick={() => setSortBy('match')}>Closest to me</button>
            <button aria-pressed={sortBy === 'name'} onClick={() => setSortBy('name')}>A–Z</button>
          </div>}
        </div>
        <p className="tp-fine">{list.length} shown. Each strip shows the twelve axes in order, Ownership to Planet; a taller bar sits further towards the axis’s second pole.</p>
        <div className="tp-lgrid">{list.map((l) => <LeaderCard key={l.id} l={l} you={you} onOpen={() => openLeader(l.id)} />)}</div>
      </section>
    );
  } else if (view === 'leader') {
    const l = LEADER_BY_ID[leaderId];
    if (!l) body = <section className="tp-empty"><p>Leader not found.</p></section>;
    else {
      const sorted = l.record.slice().sort((a, b) => (a.y === '—' ? 1 : b.y === '—' ? -1 : a.y.localeCompare(b.y)));
      body = (
        <section className="tp-profile">
          <button className="tp-link" onClick={() => setView('leaders')}>← All leaders</button>
          <div className="tp-res-head">
            <div>
              <p className="tp-kicker">{l.country} · {ERAS.find((e) => e.id === l.era)?.name}</p>
              <h1 className="tp-title tp-title--sm">{l.name}</h1>
              <p className="tp-role">{l.role} · {l.years}</p>
              <p className="tp-lede">{l.summary}</p>
              <p className="tp-fine"><span className={`tp-conf tp-conf--${l.confidence}`}>{l.confidence === 'high' ? 'Long record' : l.confidence === 'medium' ? 'Moderate record' : 'Short record'}</span> {l.note ?? ''}</p>
              {you && <p className="tp-match">{similarity(you, l.v)}% similar to your answers</p>}
              <div className="tp-actions">
                <button className="tp-btn" onClick={() => { setCmpA(you ? { kind: 'you' } : { kind: 'family', id: 'socdem' }); setCmpB({ kind: 'leader', id: l.id }); setView('compare'); }}>Compare</button>
                <a className="tp-btn" href={`https://en.wikipedia.org/wiki/${l.wiki}`} target="_blank" rel="noopener noreferrer">Background on Wikipedia ↗</a>
              </div>
            </div>
            <Radar series={[...(you ? [{ v: you, cls: 'tp-radar__you' }] : []), { v: l.v, cls: 'tp-radar__them' }]} />
          </div>
          <p className="tp-legend">{you && <><span className="tp-dot tp-dot--you" />You</>}<span className="tp-dot tp-dot--them" />{l.name}</p>
          <div className="tp-axes-grid">
            {GROUPS.map((g) => (
              <div key={g.id} className="tp-axgroup">
                <h2 style={{ color: GROUP_HUE[g.id] }}>{g.name}</h2>
                {AXES.filter((a) => a.group === g.id).map((a) => {
                  const i = AXES.indexOf(a), ev = l.record.filter((r) => r.ax.includes(a.id));
                  return (
                    <div key={a.id}>
                      <AxisBar axis={a} marks={[...(you ? [{ v: you[i], label: 'You', kind: 'you' as const }] : []), { v: l.v[i], label: l.name, kind: 'them' }]} />
                      <p className="tp-band">{band(l.v[i], a)} · {l.v[i]}</p>
                      {ev.length > 0 && <ul className="tp-ev">{ev.map((r, k) => <li key={k}><b>{r.y}</b> {r.t}</li>)}</ul>}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <h2 className="tp-h2">Record</h2>
          <ol className="tp-timeline">{sorted.map((r, k) => <li key={k}><b>{r.y}</b><span>{r.t}{r.ax.length > 0 && <em> · {r.ax.map((x) => AXIS[x].name).join(', ')}</em>}</span></li>)}</ol>
        </section>
      );
    }
  } else if (view === 'compare') {
    const va = vecOf(cmpA, you), vb = vecOf(cmpB, you);
    const options = (
      <>
        {you && <option value="you">You</option>}
        <optgroup label="Leaders">{LEADERS.slice().sort((a, b) => a.name.localeCompare(b.name)).map((l) => <option key={l.id} value={`leader:${l.id}`}>{l.name}</option>)}</optgroup>
        <optgroup label="Families of thought">{FAMILIES.map((f) => <option key={f.id} value={`family:${f.id}`}>{f.name}</option>)}</optgroup>
      </>
    );
    body = (
      <section className="tp-compare">
        <h1 className="tp-title tp-title--sm">Compare</h1>
        <div className="tp-filters">
          <label className="tp-pick"><span className="tp-dot tp-dot--you" /> <select id="tp-cmp-a" className="tp-input" value={pickKey(cmpA)} onChange={(e) => setCmpA(parsePick(e.target.value))}>{options}</select></label>
          <label className="tp-pick"><span className="tp-dot tp-dot--them" /> <select id="tp-cmp-b" className="tp-input" value={pickKey(cmpB)} onChange={(e) => setCmpB(parsePick(e.target.value))}>{options}</select></label>
        </div>
        {va && vb ? (
          <>
            <p className="tp-match">{nameOf(cmpA)} and {nameOf(cmpB)}: {similarity(va, vb.map((x) => x ?? 50))}% similar</p>
            <div className="tp-res-head tp-res-head--center"><Radar series={[{ v: va, cls: 'tp-radar__you' }, { v: vb, cls: 'tp-radar__them' }]} /></div>
            <p className="tp-legend"><span className="tp-dot tp-dot--you" />{nameOf(cmpA)}<span className="tp-dot tp-dot--them" />{nameOf(cmpB)}</p>
            <div className="tp-axes-grid">
              {GROUPS.map((g) => (
                <div key={g.id} className="tp-axgroup">
                  <h2 style={{ color: GROUP_HUE[g.id] }}>{g.name}</h2>
                  {AXES.filter((a) => a.group === g.id).map((a) => {
                    const i = AXES.indexOf(a), x = va[i], y = vb[i];
                    return (
                      <div key={a.id}>
                        <AxisBar axis={a} marks={[{ v: x, label: nameOf(cmpA), kind: 'you' }, { v: y, label: nameOf(cmpB), kind: 'them' }]} />
                        <p className="tp-band">{x == null || y == null ? '—' : Math.abs(x - y) <= 10 ? 'Close' : `${Math.abs(x - y)} points apart`}</p>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </>
        ) : <p className="tp-lede">Take the test to compare yourself, or pick two leaders.</p>}
      </section>
    );
  } else if (view === 'axes') {
    body = (
      <section className="tp-axespage">
        <h1 className="tp-title tp-title--sm">The twelve axes</h1>
        <p className="tp-lede">Each axis is scored from 0 at its first pole to 100 at its second. Neither end is the good one. The leaders listed are the three placed furthest towards each pole.</p>
        {GROUPS.map((g) => (
          <div key={g.id} className="tp-axdef-group">
            <h2 style={{ color: GROUP_HUE[g.id] }}>{g.name}</h2>
            {AXES.filter((a) => a.group === g.id).map((a) => {
              const i = AXES.indexOf(a), byV = LEADERS.slice().sort((x, y) => x.v[i] - y.v[i]);
              return (
                <article key={a.id} className="tp-axdef">
                  <h3>{a.name}: {a.question}</h3>
                  <div className="tp-axdef__poles">
                    <div><b>{a.low}</b><p>{a.lowNote}</p><p className="tp-fine">e.g. {byV.slice(0, 3).map((l) => l.name).join(', ')}</p></div>
                    <div><b>{a.high}</b><p>{a.highNote}</p><p className="tp-fine">e.g. {byV.slice(-3).reverse().map((l) => l.name).join(', ')}</p></div>
                  </div>
                </article>
              );
            })}
          </div>
        ))}
      </section>
    );
  } else if (view === 'method') {
    body = (
      <section className="tp-method tp-prose">
        <h1 className="tp-title tp-title--sm">Method</h1>
        <h2>The test</h2>
        <p>There are 72 statements, six on each axis. Three of the six point towards each pole, so agreeing with everything lands you in the middle rather than at one end. Answers count from −2 (strongly disagree) to +2 (strongly agree). An axis’s score is 50 plus 50 times the average answer, flipped where a statement points to the first pole. Skipped statements are left out, and an axis you skip entirely is left blank.</p>
        <h2>Matching</h2>
        <p>Similarity is 100 minus 1.25 times the root-mean-square distance between two sets of scores, over the axes both have. Two identical results score 100%. Results at opposite ends of every axis score 0%.</p>
        <h2>How leaders were placed</h2>
        <p>Each leader is placed from what they did with power: laws signed, programmes launched, wars fought, institutions built or dismantled. Speeches and campaign promises count only where there is no record yet. The events behind each placement are listed on the leader’s page, under the axes they inform. Placements are editorial judgements on a shared scale, made to be argued with. They are not precise measurements, and two careful people could place someone a few points differently.</p>
        <p>Each profile is marked by how much record it rests on. A long record means decades or several terms of documented decisions. A short record means a leader new to office, placed mostly from their platform and party.</p>
        <h2>Who is included</h2>
        <p>The list covers the heads of the largest economies and most populous countries, leaders who took office through 2026’s elections, influential recent leaders, opposition and movement leaders, and figures from the twentieth century, including dictators, so the scale has its full range. It is not every head of state in the world. Offices were checked against news reports on {CHECKED}. Israel’s October 2026 election and Sweden’s government formation were still unresolved then.</p>
        <h2>Neutrality</h2>
        <p>Every axis is described by what people at each end want, in their own terms. Questions are balanced so that half of them point each way on every axis. Families of thought are positioned at typical points of each tradition. Nothing on this page says which answers are better.</p>
        <h2>Privacy</h2>
        <p>Your answers and saved results are kept in this browser only. Result codes contain only your twelve scores.</p>
        <p className="tp-fine">The model, questions, profiles and wording are original to this site.</p>
      </section>
    );
  } else {
    body = (
      <section className="tp-history">
        <h1 className="tp-title tp-title--sm">History</h1>
        <p className="tp-lede">Results saved in this browser, newest first. Open one to make it your current result.</p>
        <div className="tp-filters">
          <input id="tp-code" className="tp-input" placeholder="Paste a result code (c1…)" value={code} onChange={(e) => setCode(e.target.value)} aria-label="Result code" />
          <button className="tp-btn" onClick={() => { const v = decode(code); if (!v) { setMsg('That code is not valid. It starts with c1 and has 24 more characters.'); return; } setShown(v); setHistory((h) => [...h, { at: Date.now(), code: encode(v) }]); setCode(''); setView('results'); }}>Open code</button>
        </div>
        <p className="tp-fine" aria-live="polite">{msg}</p>
        {history.length === 0 ? <p className="tp-fine">No saved results yet. Finish the test and it appears here.</p> : (
          <ol className="tp-hist">
            {history.slice().reverse().map((h) => {
              const v = decode(h.code);
              const fam = v ? FAMILIES.map((f) => ({ f, s: similarity(v, f.v) })).sort((a, b) => b.s - a.s)[0] : null;
              return (
                <li key={h.at}>
                  <span>{new Date(h.at).toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  <b>{fam?.f.name ?? '—'}</b>
                  {v && <Strip v={v} />}
                  <span className="tp-actions">
                    <button className="tp-btn" onClick={() => { if (v) { setShown(v); setView('results'); } }}>Open</button>
                    <button className="tp-btn" onClick={() => setHistory((all) => all.filter((x) => x.at !== h.at))}>Delete</button>
                  </span>
                </li>
              );
            })}
          </ol>
        )}
      </section>
    );
  }

  return (
    <div className="tp">
      <header className="tp-bar-top">
        <button className="tp-link" onClick={onExit}>← Shelf</button>
        <span className="tp-brand">Twelve-Point Compass</span>
        <nav className="tp-nav" aria-label="Compass">
          {nav.map(([v, label]) => (
            <button key={v} aria-current={view === v || (view === 'leader' && v === 'leaders') ? 'page' : undefined} onClick={() => (v === 'test' ? start(answered >= QUESTIONS.length) : setView(v))}>{label}</button>
          ))}
        </nav>
      </header>
      <main className="tp-main">{body}</main>
    </div>
  );
}

