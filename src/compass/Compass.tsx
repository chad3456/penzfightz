/**
 * Twelve-Point Compass — two political tests (the original twelve-axis
 * Compass and 8values), leaders, countries and families of thought placed
 * on the same axes, charts, and comparisons of up to four at a time.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AXES, AXIS, CHOICES, FAMILIES, GROUPS, QUESTIONS, band, decode, encode, score, similarity, toVec, type Answers, type GroupId } from './model';
import { CHECKED, ERAS, LEADERS, type Era, type Leader, type Region } from './leaders';
import { ABORTION_LABEL, CONSCRIPTION_LABEL, COUNTRIES, COUNTRY_BY_NAME, DEATH_LABEL, SAMESEX_LABEL, WORLD_MILEX, type Country } from './countries';
import { EV_AXES, EV_CHOICES, EV_IDEOLOGIES, EV_QUESTIONS_LIST, evDecode, evEncode, evIdeology, evLabel, evScore, evSimilarity, project12, type EVAnswers, type EVVec } from './eightvalues';
import { ALL_TRIVIA, TRIVIA } from './trivia';
import Society, { CountrySocial, LeaderSocial } from './Society';
import { SOC_AXES, SOC_VEC } from './social';

type View = 'home' | 'test' | 'results' | 'leaders' | 'leader' | 'countries' | 'country' | 'ideologies' | 'charts' | 'society' | 'compare' | 'axes' | 'method' | 'history';
type TestId = 'c12' | 'ev';
type Saved = { at: number; code: string };

const GROUP_HUE: Record<GroupId, string> = { economy: 'var(--tp-econ)', state: 'var(--tp-state)', society: 'var(--tp-society)', world: 'var(--tp-world)' };
const EV_HUE = ['var(--tp-econ)', 'var(--tp-world)', 'var(--tp-state)', 'var(--tp-society)'];
const SERIES = ['var(--tp-you)', 'var(--tp-them)', 'var(--tp-society)', 'var(--tp-econ)'];
const REGIONS: Region[] = ['Americas', 'Europe', 'Asia', 'Middle East', 'Africa', 'Oceania'];
const LEADER_BY_ID = Object.fromEntries(LEADERS.map((l) => [l.id, l]));
const COUNTRY_BY_ID = Object.fromEntries(COUNTRIES.map((c) => [c.id, c]));
const FAMILY_BY_ID = Object.fromEntries(FAMILIES.map((f) => [f.id, f]));

const store = {
  get<T>(k: string, d: T): T { try { const v = localStorage.getItem(k); return v == null ? d : (JSON.parse(v) as T); } catch { return d; } },
  set(k: string, v: unknown) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage blocked: the page still works */ } },
};

const nearestFamilies = (v: (number | null)[]) => FAMILIES.map((f) => ({ f, s: similarity(v, f.v) })).sort((a, b) => b.s - a.s);
const familyOfCountry = (c: Country) => nearestFamilies(c.v)[0].f;

/* ------------------------------------------------------------- entities */
interface Ent { key: string; kind: 'you12' | 'you8' | 'leader' | 'country' | 'family' | 'ev'; name: string; sub: string; v12: (number | null)[] | null; v8: EVVec }
function entities(you12: (number | null)[] | null, you8: EVVec | null): Ent[] {
  const out: Ent[] = [];
  if (you12) out.push({ key: 'you12', kind: 'you12', name: 'You (Compass)', sub: 'Your Twelve-Point Compass result', v12: you12, v8: project12(you12) });
  if (you8) out.push({ key: 'you8', kind: 'you8', name: 'You (8values)', sub: 'Your 8values result', v12: null, v8: you8 });
  for (const l of LEADERS) out.push({ key: `l:${l.id}`, kind: 'leader', name: l.name, sub: `${l.country} · ${l.years}`, v12: l.v, v8: project12(l.v) });
  for (const c of COUNTRIES) out.push({ key: `c:${c.id}`, kind: 'country', name: c.name, sub: c.system, v12: c.v, v8: project12(c.v) });
  for (const f of FAMILIES) out.push({ key: `f:${f.id}`, kind: 'family', name: f.name, sub: 'Family of thought', v12: f.v, v8: project12(f.v) });
  for (const i of EV_IDEOLOGIES) out.push({ key: `e:${i.name}`, kind: 'ev', name: i.name, sub: '8values ideology', v12: null, v8: [i.stats.econ, i.stats.dipl, i.stats.govt, i.stats.scty] });
  return out;
}

/* ------------------------------------------------------------------ pieces */
function AxisBar({ name, low, high, hue, marks }: { name: string; low: string; high: string; hue: string; marks: { v: number | null; label: string; color: string; ring?: boolean }[] }) {
  return (
    <div className="tp-bar">
      <div className="tp-bar__ends"><span>{low}</span><b>{name}</b><span>{high}</span></div>
      <div className="tp-bar__track" style={{ ['--hue' as string]: hue }}>
        <i className="tp-bar__mid" />
        {marks.map((m, i) => m.v == null ? null : (
          <span key={i} className={`tp-bar__mark${m.ring ? ' tp-bar__mark--ring' : ''}`} style={{ left: `${m.v}%`, ['--c' as string]: m.color }} title={`${m.label}: ${Math.round(m.v)}`} />
        ))}
      </div>
    </div>
  );
}

function Strip({ v }: { v: (number | null)[] }) {
  return (
    <div className="tp-strip" aria-hidden="true">
      {AXES.map((a, i) => <i key={a.id} style={{ ['--x' as string]: v[i] == null ? '50%' : `${v[i]}%`, ['--hue' as string]: GROUP_HUE[a.group] }} />)}
    </div>
  );
}

function Radar({ labels, series }: { labels: string[]; series: { v: (number | null)[]; color: string; dashed?: boolean }[] }) {
  const n = labels.length, R = 120, cx = 170, cy = 160;
  const pt = (i: number, r: number) => [cx + Math.sin((i / n) * 2 * Math.PI) * r, cy - Math.cos((i / n) * 2 * Math.PI) * r];
  return (
    <svg className="tp-radar" viewBox="-36 0 412 320" role="img" aria-label="Shape of the result across the axes">
      {[0.25, 0.5, 0.75, 1].map((k) => <polygon key={k} points={labels.map((_, i) => pt(i, R * k).join(',')).join(' ')} className="tp-radar__ring" />)}
      {labels.map((lab, i) => {
        const [x, y] = pt(i, R), [lx, ly] = pt(i, R + 22);
        return (
          <g key={lab + i}>
            <line x1={cx} y1={cy} x2={x} y2={y} className="tp-radar__spoke" />
            <text x={lx} y={ly + 4} textAnchor={Math.abs(lx - cx) < 8 ? 'middle' : lx > cx ? 'start' : 'end'} className="tp-radar__label">{lab}</text>
          </g>
        );
      })}
      {series.map((s, k) => (
        <polygon key={k} points={s.v.map((x, i) => pt(i, R * ((x ?? 50) / 100)).join(',')).join(' ')}
          style={{ fill: `color-mix(in srgb, ${s.color} 14%, transparent)`, stroke: s.color }} strokeWidth={2} strokeLinejoin="round" strokeDasharray={s.dashed ? '5 3' : undefined} />
      ))}
    </svg>
  );
}

function Tag({ fam, school }: { fam: string; school?: string }) {
  const f = FAMILY_BY_ID[fam];
  return <span className="tp-tag" title={f?.note}>{f?.name ?? fam}{school ? <em> · {school}</em> : null}</span>;
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
      <Tag fam={l.fam} school={l.school} />
      <Strip v={l.v} />
    </button>
  );
}

function CountryCard({ c, you, onOpen }: { c: Country; you: (number | null)[] | null; onOpen: () => void }) {
  const f = familyOfCountry(c);
  return (
    <button className="tp-lcard" onClick={onOpen}>
      <span className="tp-lcard__top"><span className="tp-lcard__name">{c.name}</span>{you && <span className="tp-lcard__pct">{similarity(you, c.v)}%</span>}</span>
      <span className="tp-lcard__role">{c.system}</span>
      <span className="tp-tag">Closest: {f.name}</span>
      <Strip v={c.v} />
    </button>
  );
}

/* ---------------------------------------------------------------- charts */
function Scatter({ points, xLabel, yLabel, onPick }: { points: { key: string; label: string; short: string; x: number; y: number; color: string }[]; xLabel: [string, string]; yLabel: [string, string]; onPick?: (key: string) => void }) {
  const [hover, setHover] = useState<string | null>(null);
  const W = 560, H = 440, P = 44;
  const sx = (x: number) => P + (x / 100) * (W - 2 * P), sy = (y: number) => H - P - (y / 100) * (H - 2 * P);
  const h = points.find((p) => p.key === hover);
  return (
    <svg className="tp-scatter" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Scatter of ${xLabel.join(' to ')} against ${yLabel.join(' to ')}`}>
      <rect x={P} y={P} width={W - 2 * P} height={H - 2 * P} className="tp-scatter__frame" />
      <line x1={W / 2} x2={W / 2} y1={P} y2={H - P} className="tp-scatter__mid" />
      <line x1={P} x2={W - P} y1={H / 2} y2={H / 2} className="tp-scatter__mid" />
      <text x={P} y={H - P + 20} className="tp-scatter__axis">← {xLabel[0]}</text>
      <text x={W - P} y={H - P + 20} textAnchor="end" className="tp-scatter__axis">{xLabel[1]} →</text>
      <text x={P - 10} y={H - P} textAnchor="start" className="tp-scatter__axis" transform={`rotate(-90 ${P - 10} ${H - P})`}>← {yLabel[0]}</text>
      <text x={P - 10} y={P} textAnchor="end" className="tp-scatter__axis" transform={`rotate(-90 ${P - 10} ${P})`}>{yLabel[1]} →</text>
      {points.map((p) => (
        <g key={p.key} onMouseEnter={() => setHover(p.key)} onMouseLeave={() => setHover(null)} onClick={() => onPick?.(p.key)} style={{ cursor: onPick ? 'pointer' : 'default' }}>
          <circle cx={sx(p.x)} cy={sy(p.y)} r={hover === p.key ? 7 : 5} style={{ fill: p.color }} className="tp-scatter__dot" />
          <text x={sx(p.x) + 7} y={sy(p.y) + 3} className="tp-scatter__label">{p.short}</text>
          <circle cx={sx(p.x)} cy={sy(p.y)} r={12} fill="transparent" />
        </g>
      ))}
      {h && (
        <g pointerEvents="none">
          <rect x={Math.min(sx(h.x) + 10, W - 190)} y={Math.max(sy(h.y) - 40, 4)} width={180} height={34} rx={6} className="tp-scatter__tip" />
          <text x={Math.min(sx(h.x) + 18, W - 182)} y={Math.max(sy(h.y) - 19, 25)} className="tp-scatter__tiptext">{h.label} · {Math.round(h.x)}, {Math.round(h.y)}</text>
        </g>
      )}
    </svg>
  );
}

function HBars({ items, max = 100, unit = '', refLine }: { items: { label: string; v: number; note?: string; color?: string; href?: string }[]; max?: number; unit?: string; refLine?: { v: number; label: string } }) {
  return (
    <div className="tp-hbars">
      {items.map((it) => (
        <div key={it.label} className="tp-hbar">
          <span className="tp-hbar__label">{it.href ? <a href={it.href} target="_blank" rel="noopener noreferrer">{it.label}</a> : it.label}</span>
          <span className="tp-hbar__track">
            <i style={{ width: `${Math.min(100, (it.v / max) * 100)}%`, background: it.color ?? 'var(--ink)' }} />
            {refLine && <b className="tp-hbar__ref" style={{ left: `${(refLine.v / max) * 100}%` }} title={refLine.label} />}
          </span>
          <span className="tp-hbar__v">{it.v}{unit}</span>
          {it.note && <span className="tp-hbar__note">{it.note}</span>}
        </div>
      ))}
      {refLine && <p className="tp-fine"><span className="tp-refkey" /> {refLine.label}: {refLine.v}{unit}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ page */
export default function Compass({ onExit }: { onExit: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<View>('home');
  const [test, setTest] = useState<TestId>(() => store.get('tpc-test', 'c12' as TestId));
  const [answers, setAnswers] = useState<Answers>(() => store.get('tpc-progress', { answers: {} as Answers, idx: 0 }).answers);
  const [idx, setIdx] = useState<number>(() => store.get('tpc-progress', { answers: {}, idx: 0 }).idx);
  const [evAnswers, setEvAnswers] = useState<EVAnswers>(() => store.get('tpc-ev-progress', { answers: {} as EVAnswers, idx: 0 }).answers);
  const [evIdx, setEvIdx] = useState<number>(() => store.get('tpc-ev-progress', { answers: {}, idx: 0 }).idx);
  const [history, setHistory] = useState<Saved[]>(() => store.get('tpc-history', [] as Saved[]));
  const [you, setYou] = useState<(number | null)[] | null>(() => { const h = store.get('tpc-history', [] as Saved[]).filter((x) => x.code.startsWith('c1')); return h.length ? decode(h[h.length - 1].code) : null; });
  const [you8, setYou8] = useState<EVVec | null>(() => { const h = store.get('tpc-history', [] as Saved[]).filter((x) => x.code.startsWith('e1')); return h.length ? evDecode(h[h.length - 1].code) : null; });
  const [resultOf, setResultOf] = useState<TestId>('c12');
  const [leaderId, setLeaderId] = useState('');
  const [countryId, setCountryId] = useState('');
  const [q, setQ] = useState('');
  const [region, setRegion] = useState<Region | ''>('');
  const [era, setEra] = useState<Era | ''>('');
  const [famFilter, setFamFilter] = useState('');
  const [sortBy, setSortBy] = useState<'match' | 'name'>('match');
  const [cmp, setCmp] = useState<string[]>(['you12', 'l:lula']);
  const [cmpAxes, setCmpAxes] = useState<'12' | '8'>('12');
  const [scX, setScX] = useState('values'), [scY, setScY] = useState('power'), [scSet, setScSet] = useState<'countries' | 'current' | 'families'>('countries');
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => { store.set('tpc-progress', { answers, idx }); }, [answers, idx]);
  useEffect(() => { store.set('tpc-ev-progress', { answers: evAnswers, idx: evIdx }); }, [evAnswers, evIdx]);
  useEffect(() => { store.set('tpc-history', history); }, [history]);
  useEffect(() => { store.set('tpc-test', test); }, [test]);
  const toTop = () => root.current?.scrollTo({ top: 0 });
  useEffect(() => { toTop(); setMsg(''); }, [view, leaderId, countryId]);

  const total = test === 'c12' ? QUESTIONS.length : EV_QUESTIONS_LIST.length;
  const curIdx = test === 'c12' ? idx : evIdx;
  const answered = test === 'c12' ? Object.keys(answers).length : Object.keys(evAnswers).length;
  const ents = useMemo(() => entities(you, you8), [you, you8]);
  const entByKey = useMemo(() => Object.fromEntries(ents.map((e) => [e.key, e])), [ents]);

  const finish12 = useCallback((a: Answers) => {
    const v = toVec(score(a));
    setYou(v); setResultOf('c12');
    setHistory((h) => [...h, { at: Date.now(), code: encode(v) }].slice(-60));
    setView('results');
  }, []);
  const finishEv = useCallback((a: EVAnswers) => {
    const v = evScore(a);
    setYou8(v); setResultOf('ev');
    setHistory((h) => [...h, { at: Date.now(), code: evEncode(v) }].slice(-60));
    setView('results');
  }, []);

  const answer = useCallback((value: number | null) => {
    if (test === 'c12') {
      const qn = QUESTIONS[idx];
      const next = { ...answers, [qn.id]: value };
      setAnswers(next);
      if (idx + 1 >= QUESTIONS.length) finish12(next); else setIdx(idx + 1);
    } else {
      const qn = EV_QUESTIONS_LIST[evIdx];
      const next = { ...evAnswers, [qn.id]: value ?? 0 };
      setEvAnswers(next);
      if (evIdx + 1 >= EV_QUESTIONS_LIST.length) finishEv(next); else setEvIdx(evIdx + 1);
    }
    toTop();
  }, [test, idx, evIdx, answers, evAnswers, finish12, finishEv]);
  const back = () => (test === 'c12' ? setIdx((i) => Math.max(0, i - 1)) : setEvIdx((i) => Math.max(0, i - 1)));

  useEffect(() => {
    if (view !== 'test') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
      const map: Record<string, number | null> = test === 'c12' ? { '1': 2, '2': 1, '3': 0, '4': -1, '5': -2, '0': null } : { '1': 1, '2': 0.5, '3': 0, '4': -0.5, '5': -1 };
      if (e.key in map) answer(map[e.key]);
      else if (e.key === 'Backspace' || e.key === 'ArrowLeft') back();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const start = (t: TestId, fresh: boolean) => {
    setTest(t);
    if (fresh) { if (t === 'c12') { setAnswers({}); setIdx(0); } else { setEvAnswers({}); setEvIdx(0); } }
    setView('test');
  };
  const openLeader = (id: string) => { setLeaderId(id); setView('leader'); };
  const openCountry = (id: string) => { setCountryId(id); setView('country'); };
  const compareWith = (keys: string[]) => { setCmp(keys.slice(0, 4)); setView('compare'); };
  const copy = async (text: string) => { try { await navigator.clipboard.writeText(text); setMsg('Copied.'); } catch { setMsg('Copy the code above by hand.'); } };

  const nav: [View, string][] = [['home', 'Start'], ['test', 'Test'], ['results', 'My result'], ['leaders', 'Leaders'], ['countries', 'Countries'], ['ideologies', 'Ideologies'], ['society', 'Society'], ['charts', 'Charts'], ['compare', 'Compare'], ['axes', 'Axes'], ['method', 'Method'], ['history', 'History']];

  let body: ReactNode;
  /* ---------------- home ---------------- */
  if (view === 'home') {
    const inProg12 = Object.keys(answers).length > 0 && Object.keys(answers).length < QUESTIONS.length;
    const inProgEv = Object.keys(evAnswers).length > 0 && Object.keys(evAnswers).length < EV_QUESTIONS_LIST.length;
    body = (
      <section className="tp-home">
        <div className="tp-hero">
          <p className="tp-kicker">2 tests · {LEADERS.length} leaders and public figures · {COUNTRIES.length} countries · {FAMILIES.length} families of thought</p>
          <h1 className="tp-title">Twelve-Point Compass</h1>
          <p className="tp-lede">Find where you stand, get a tag for your politics, and see which leaders and countries share it. Every question explains what it means and shows a real country on each side of it.</p>
        </div>
        <div className="tp-tests">
          <article className="tp-testcard">
            <p className="tp-kicker">Original · 72 statements · 12 axes</p>
            <h2>Twelve-Point Compass</h2>
            <p>Twelve separate questions in four groups: economy, state, society and world. Each statement comes with a plain explanation and a real country on each side.</p>
            <div className="tp-actions">
              <button className="tp-btn tp-btn--ink" onClick={() => start('c12', !inProg12)}>{inProg12 ? `Resume at ${idx + 1}` : 'Take this test'}</button>
              {inProg12 && <button className="tp-btn" onClick={() => start('c12', true)}>Start again</button>}
            </div>
          </article>
          <article className="tp-testcard">
            <p className="tp-kicker">8values · 70 statements · 4 axes</p>
            <h2>8values</h2>
            <p>The classic open-source test: Equality vs Markets, Nation vs World, Liberty vs Authority, Tradition vs Progress, matched to 52 ideologies. Used under its MIT licence.</p>
            <div className="tp-actions">
              <button className="tp-btn tp-btn--ink" onClick={() => start('ev', !inProgEv)}>{inProgEv ? `Resume at ${evIdx + 1}` : 'Take this test'}</button>
              {inProgEv && <button className="tp-btn" onClick={() => start('ev', true)}>Start again</button>}
            </div>
          </article>
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
        <p className="tp-fine">Answers stay in this browser. Nothing is sent anywhere.</p>
      </section>
    );
  /* ---------------- test ---------------- */
  } else if (view === 'test') {
    if (test === 'c12') {
      const qn = QUESTIONS[Math.min(idx, QUESTIONS.length - 1)];
      const ax = AXIS[qn.axis], g = GROUPS.find((x) => x.id === ax.group)!;
      const cur = answers[qn.id];
      const trivia = TRIVIA[qn.axis][idx % TRIVIA[qn.axis].length];
      body = (
        <section className="tp-test">
          <div className="tp-progress" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={curIdx}><i style={{ width: `${(curIdx / total) * 100}%` }} /></div>
          <p className="tp-kicker" style={{ color: GROUP_HUE[ax.group] }}>{g.name} · {ax.name}: {ax.low} ↔ {ax.high} · {idx + 1} of {QUESTIONS.length}</p>
          <h2 className="tp-statement">{qn.text}</h2>
          <div className="tp-testgrid">
            <div className="tp-choices">
              {CHOICES.map((c, i) => <button key={c.v} className={`tp-choice${cur === c.v ? ' is-on' : ''}`} onClick={() => answer(c.v)}><kbd>{i + 1}</kbd>{c.label}</button>)}
              <button className={`tp-choice tp-choice--skip${cur === null ? ' is-on' : ''}`} onClick={() => answer(null)}><kbd>0</kbd>Not sure / skip</button>
              <div className="tp-actions">
                <button className="tp-btn" disabled={idx === 0} onClick={back}>← Back</button>
                {answered >= 24 && <button className="tp-btn" onClick={() => finish12(answers)}>See results so far</button>}
              </div>
            </div>
            <aside className="tp-cues" aria-label="What this statement means">
              <div className="tp-cue"><p className="tp-kicker">What it means</p><p>{qn.cue}</p></div>
              <div className="tp-cue tp-cue--agree"><p className="tp-kicker">If you agree, it looks like</p><p>{qn.agree}</p></div>
              <div className="tp-cue tp-cue--disagree"><p className="tp-kicker">If you disagree, it looks like</p><p>{qn.disagree}</p></div>
              <div className="tp-cue tp-cue--trivia"><p className="tp-kicker">Did you know?</p><p>{trivia}</p></div>
            </aside>
          </div>
          <p className="tp-fine">Keys: 1 strongly agree … 5 strongly disagree, 0 skip, ← back. Examples show real laws for illustration; they are not endorsements.</p>
        </section>
      );
    } else {
      const qn = EV_QUESTIONS_LIST[Math.min(evIdx, EV_QUESTIONS_LIST.length - 1)];
      const cur = evAnswers[qn.id];
      const moves = EV_AXES.filter((a) => qn.effect[a.id] !== 0).map((a) => `${a.name}: agreeing leans ${qn.effect[a.id] > 0 ? a.high : a.low}`);
      body = (
        <section className="tp-test">
          <div className="tp-progress" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={curIdx}><i style={{ width: `${(curIdx / total) * 100}%` }} /></div>
          <p className="tp-kicker">8values · {evIdx + 1} of {EV_QUESTIONS_LIST.length}</p>
          <h2 className="tp-statement">{qn.text}</h2>
          <div className="tp-testgrid">
            <div className="tp-choices">
              {EV_CHOICES.map((c, i) => <button key={c.v} className={`tp-choice${cur === c.v ? ' is-on' : ''}`} onClick={() => answer(c.v)}><kbd>{i + 1}</kbd>{c.label}</button>)}
              <div className="tp-actions">
                <button className="tp-btn" disabled={evIdx === 0} onClick={back}>← Back</button>
                {Object.keys(evAnswers).length >= 20 && <button className="tp-btn" onClick={() => finishEv(evAnswers)}>See results so far</button>}
              </div>
            </div>
            <aside className="tp-cues">
              <div className="tp-cue"><p className="tp-kicker">What this statement measures</p>{moves.map((m) => <p key={m}>{m}.</p>)}</div>
              <div className="tp-cue tp-cue--trivia"><p className="tp-kicker">Did you know?</p><p>{ALL_TRIVIA[evIdx % ALL_TRIVIA.length]}</p></div>
            </aside>
          </div>
          <p className="tp-fine">Statements and scoring are the original 8values test (MIT licence). Unanswered questions count as neutral, as in the original.</p>
        </section>
      );
    }
  /* ---------------- results ---------------- */
  } else if (view === 'results') {
    const show = resultOf === 'ev' && you8 ? 'ev' : you ? 'c12' : you8 ? 'ev' : null;
    if (!show) body = <section className="tp-empty"><p>No result yet.</p><button className="tp-btn tp-btn--ink" onClick={() => start('c12', true)}>Take a test</button></section>;
    else {
      const switcher = you && you8 && (
        <div className="tp-chips" role="group" aria-label="Which result">
          <button aria-pressed={show === 'c12'} onClick={() => setResultOf('c12')}>Compass result</button>
          <button aria-pressed={show === 'ev'} onClick={() => setResultOf('ev')}>8values result</button>
        </div>
      );
      if (show === 'c12' && you) {
        const fams = nearestFamilies(you), tag = fams[0].f;
        const sharers = LEADERS.filter((l) => l.fam === tag.id).map((l) => ({ l, s: similarity(you, l.v) })).sort((a, b) => b.s - a.s);
        const ranked = LEADERS.map((l) => ({ l, s: similarity(you, l.v) })).sort((a, b) => b.s - a.s);
        const cRanked = COUNTRIES.map((c) => ({ c, s: similarity(you, c.v) })).sort((a, b) => b.s - a.s);
        const evp = project12(you);
        body = (
          <section className="tp-results">
            {switcher}
            <div className="tp-res-head">
              <div>
                <p className="tp-kicker">Your tag</p>
                <h1 className="tp-title tp-title--sm">{tag.name}</h1>
                <p className="tp-lede">{tag.note}</p>
                <p className="tp-fine">Also close: {fams[1].f.name} ({fams[1].s}%), {fams[2].f.name} ({fams[2].s}%). On 8values axes you project to <b>{evIdeology(evp).name}</b>.</p>
              </div>
              <Radar labels={AXES.map((a) => a.high)} series={[{ v: you, color: 'var(--tp-you)' }]} />
            </div>
            <div className="tp-share-with">
              <h2 className="tp-h2">You share the “{tag.name}” tag with</h2>
              {sharers.length ? <div className="tp-lgrid">{sharers.map(({ l }) => <LeaderCard key={l.id} l={l} you={you} onOpen={() => openLeader(l.id)} />)}</div>
                : <p className="tp-fine">No leader in the directory carries this tag. Your closest records are below.</p>}
            </div>
            <div className="tp-axes-grid">
              {GROUPS.map((g) => (
                <div key={g.id} className="tp-axgroup">
                  <h2 style={{ color: GROUP_HUE[g.id] }}>{g.name}</h2>
                  {AXES.filter((a) => a.group === g.id).map((a) => {
                    const v = you[AXES.indexOf(a)];
                    return (
                      <div key={a.id}>
                        <AxisBar name={a.name} low={a.low} high={a.high} hue={GROUP_HUE[a.group]} marks={[{ v, label: 'You', color: 'var(--tp-you)' }]} />
                        <p className="tp-band">{v == null ? 'Skipped' : `${band(v, a)} · ${v}`}</p>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
            <h2 className="tp-h2">Closest records of any tag</h2>
            <div className="tp-lgrid">{ranked.slice(0, 8).map(({ l }) => <LeaderCard key={l.id} l={l} you={you} onOpen={() => openLeader(l.id)} />)}</div>
            <h2 className="tp-h2">Countries whose laws are closest to your answers</h2>
            <div className="tp-lgrid">{cRanked.slice(0, 4).map(({ c }) => <CountryCard key={c.id} c={c} you={you} onOpen={() => openCountry(c.id)} />)}</div>
            <h2 className="tp-h2">Furthest from you</h2>
            <div className="tp-lgrid">{ranked.slice(-4).reverse().map(({ l }) => <LeaderCard key={l.id} l={l} you={you} onOpen={() => openLeader(l.id)} />)}</div>
            <div className="tp-share">
              <p className="tp-kicker">Your result code</p>
              <code>{encode(you)}</code>
              <div className="tp-actions">
                <button className="tp-btn" onClick={() => copy(encode(you))}>Copy code</button>
                <button className="tp-btn" onClick={() => compareWith(['you12', `l:${ranked[0].l.id}`, `c:${cRanked[0].c.id}`])}>Compare</button>
                <button className="tp-btn" onClick={() => start('c12', true)}>Retake</button>
              </div>
              <p className="tp-fine" aria-live="polite">{msg || 'Paste a code under History to open a saved or shared result.'}</p>
            </div>
          </section>
        );
      } else if (you8) {
        const ide = evIdeology(you8);
        const ranked = LEADERS.map((l) => ({ l, s: evSimilarity(you8, project12(l.v)) })).sort((a, b) => b.s - a.s);
        const cRanked = COUNTRIES.map((c) => ({ c, s: evSimilarity(you8, project12(c.v)) })).sort((a, b) => b.s - a.s);
        const famRanked = FAMILIES.map((f) => ({ f, s: evSimilarity(you8, project12(f.v)) })).sort((a, b) => b.s - a.s);
        const sharers = LEADERS.filter((l) => l.fam === famRanked[0].f.id);
        body = (
          <section className="tp-results">
            {switcher}
            <div className="tp-res-head">
              <div>
                <p className="tp-kicker">Your 8values match</p>
                <h1 className="tp-title tp-title--sm">{ide.name}</h1>
                <p className="tp-lede">{EV_AXES.map((a, i) => `${evLabel(you8[i], a)} ${a.name.toLowerCase()}`).join(' · ')}</p>
                <p className="tp-fine">Your tag among this site’s families: <b>{famRanked[0].f.name}</b>.</p>
              </div>
              <Radar labels={EV_AXES.map((a) => a.high)} series={[{ v: you8, color: 'var(--tp-you)' }]} />
            </div>
            <div className="tp-axes-grid">
              {EV_AXES.map((a, i) => (
                <div key={a.id}>
                  <AxisBar name={a.name} low={a.high} high={a.low} hue={EV_HUE[i]} marks={[{ v: 100 - you8[i], label: 'You', color: 'var(--tp-you)' }]} />
                  <p className="tp-band">{evLabel(you8[i], a)} · {a.high} {you8[i]}% / {a.low} {Math.round((100 - you8[i]) * 10) / 10}%</p>
                </div>
              ))}
            </div>
            <h2 className="tp-h2">You share the “{famRanked[0].f.name}” tag with</h2>
            <div className="tp-lgrid">{sharers.map((l) => <LeaderCard key={l.id} l={l} you={null} onOpen={() => openLeader(l.id)} />)}</div>
            <h2 className="tp-h2">Closest leaders on these four axes</h2>
            <p className="tp-fine">Leaders and countries are placed on 8values axes by projecting their twelve-axis placements.</p>
            <div className="tp-lgrid">{ranked.slice(0, 8).map(({ l, s }) => <div key={l.id} className="tp-mini"><LeaderCard l={l} you={null} onOpen={() => openLeader(l.id)} /><span className="tp-lcard__pct">{s}%</span></div>)}</div>
            <h2 className="tp-h2">Closest countries</h2>
            <div className="tp-lgrid">{cRanked.slice(0, 4).map(({ c, s }) => <div key={c.id} className="tp-mini"><CountryCard c={c} you={null} onOpen={() => openCountry(c.id)} /><span className="tp-lcard__pct">{s}%</span></div>)}</div>
            <div className="tp-share">
              <p className="tp-kicker">Your result code</p>
              <code>{evEncode(you8)}</code>
              <div className="tp-actions">
                <button className="tp-btn" onClick={() => copy(evEncode(you8))}>Copy code</button>
                <button className="tp-btn" onClick={() => { setCmpAxes('8'); compareWith(['you8', `e:${ide.name}`, `l:${ranked[0].l.id}`]); }}>Compare</button>
                <button className="tp-btn" onClick={() => start('ev', true)}>Retake</button>
              </div>
              <p className="tp-fine" aria-live="polite">{msg}</p>
            </div>
          </section>
        );
      }
    }
  /* ---------------- leaders ---------------- */
  } else if (view === 'leaders') {
    const text = q.trim().toLowerCase();
    let list = LEADERS.filter((l) => (!region || l.region === region) && (!era || l.era === era) && (!famFilter || l.fam === famFilter) && (!text || `${l.name} ${l.country} ${l.role} ${l.school}`.toLowerCase().includes(text)));
    list = sortBy === 'match' && you ? list.slice().sort((a, b) => similarity(you, b.v) - similarity(you, a.v)) : list.slice().sort((a, b) => a.name.localeCompare(b.name));
    body = (
      <section className="tp-leaders">
        <h1 className="tp-title tp-title--sm">Leaders and public figures</h1>
        <p className="tp-lede">{LEADERS.length} people placed from their records, each tagged with a family of thought and the school they are known by. Offices checked on {CHECKED}.</p>
        <div className="tp-filters">
          <input id="tp-search" className="tp-input" type="search" placeholder="Search name, country or school" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search leaders" />
          <select id="tp-region" className="tp-input" value={region} onChange={(e) => setRegion(e.target.value as Region | '')} aria-label="Region">
            <option value="">All regions</option>{REGIONS.map((r) => <option key={r}>{r}</option>)}
          </select>
          <select id="tp-fam" className="tp-input" value={famFilter} onChange={(e) => setFamFilter(e.target.value)} aria-label="Tag">
            <option value="">All tags</option>{FAMILIES.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </div>
        <div className="tp-filters">
          <div className="tp-chips" role="group" aria-label="Era">
            <button aria-pressed={!era} onClick={() => setEra('')}>All</button>
            {ERAS.map((e) => <button key={e.id} aria-pressed={era === e.id} onClick={() => setEra(e.id)}>{e.name}</button>)}
          </div>
          {you && <div className="tp-chips" role="group" aria-label="Sort"><button aria-pressed={sortBy === 'match'} onClick={() => setSortBy('match')}>Closest to me</button><button aria-pressed={sortBy === 'name'} onClick={() => setSortBy('name')}>A–Z</button></div>}
        </div>
        <p className="tp-fine">{list.length} shown. Strips show the twelve axes in order, Ownership to Planet; a taller bar sits further towards the second pole.</p>
        <div className="tp-lgrid">{list.map((l) => <LeaderCard key={l.id} l={l} you={you} onOpen={() => openLeader(l.id)} />)}</div>
      </section>
    );
  } else if (view === 'leader') {
    const l = LEADER_BY_ID[leaderId];
    if (!l) body = <section className="tp-empty"><p>Not found.</p></section>;
    else {
      const sorted = l.record.slice().sort((a, b) => (a.y === '—' ? 1 : b.y === '—' ? -1 : a.y.localeCompare(b.y)));
      const country = COUNTRY_BY_NAME[l.country];
      const sameTag = LEADERS.filter((x) => x.fam === l.fam && x.id !== l.id);
      body = (
        <section className="tp-profile">
          <button className="tp-link" onClick={() => setView('leaders')}>← All leaders</button>
          <div className="tp-res-head">
            <div>
              <p className="tp-kicker">{l.country} · {ERAS.find((e) => e.id === l.era)?.name}</p>
              <h1 className="tp-title tp-title--sm">{l.name}</h1>
              <p className="tp-role">{l.role} · {l.years}</p>
              <p><Tag fam={l.fam} school={l.school} /></p>
              <p className="tp-lede">{l.summary}</p>
              <p className="tp-fine"><span className={`tp-conf tp-conf--${l.confidence}`}>{l.confidence === 'high' ? 'Long record' : l.confidence === 'medium' ? 'Moderate record' : 'Short record'}</span> {l.note ?? ''}</p>
              {you && <p className="tp-match">{similarity(you, l.v)}% similar to your answers</p>}
              <div className="tp-actions">
                <button className="tp-btn" onClick={() => compareWith([you ? 'you12' : `f:${l.fam}`, `l:${l.id}`, ...(country ? [`c:${country.id}`] : [])])}>Compare</button>
                {country && <button className="tp-btn" onClick={() => openCountry(country.id)}>{country.name}’s laws</button>}
                <a className="tp-btn" href={`https://en.wikipedia.org/wiki/${l.wiki}`} target="_blank" rel="noopener noreferrer">Wikipedia ↗</a>
              </div>
            </div>
            <Radar labels={AXES.map((a) => a.high)} series={[...(you ? [{ v: you, color: 'var(--tp-you)' }] : []), { v: l.v, color: 'var(--tp-them)', dashed: true }]} />
          </div>
          <p className="tp-legend">{you && <><span className="tp-dot" style={{ ['--c' as string]: 'var(--tp-you)' }} />You</>}<span className="tp-dot tp-dot--ring" style={{ ['--c' as string]: 'var(--tp-them)' }} />{l.name}</p>
          <div className="tp-axes-grid">
            {GROUPS.map((g) => (
              <div key={g.id} className="tp-axgroup">
                <h2 style={{ color: GROUP_HUE[g.id] }}>{g.name}</h2>
                {AXES.filter((a) => a.group === g.id).map((a) => {
                  const i = AXES.indexOf(a), ev = l.record.filter((r) => r.ax.includes(a.id));
                  return (
                    <div key={a.id}>
                      <AxisBar name={a.name} low={a.low} high={a.high} hue={GROUP_HUE[a.group]} marks={[...(you ? [{ v: you[i], label: 'You', color: 'var(--tp-you)' }] : []), { v: l.v[i], label: l.name, color: 'var(--tp-them)', ring: true }]} />
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
          <LeaderSocial lid={l.id} />
          {sameTag.length > 0 && <><h2 className="tp-h2">Also tagged {FAMILY_BY_ID[l.fam]?.name}</h2><div className="tp-lgrid">{sameTag.map((x) => <LeaderCard key={x.id} l={x} you={you} onOpen={() => openLeader(x.id)} />)}</div></>}
        </section>
      );
    }
  /* ---------------- countries ---------------- */
  } else if (view === 'countries') {
    const text = q.trim().toLowerCase();
    let list = COUNTRIES.filter((c) => (!region || c.region === region) && (!text || c.name.toLowerCase().includes(text)));
    list = sortBy === 'match' && you ? list.slice().sort((a, b) => similarity(you, b.v) - similarity(you, a.v)) : list.slice().sort((a, b) => a.name.localeCompare(b.name));
    body = (
      <section className="tp-leaders">
        <h1 className="tp-title tp-title--sm">Countries</h1>
        <p className="tp-lede">{COUNTRIES.length} countries placed from the laws and policies in force, with the laws behind each placement. Each country’s data is also available as JSON under /compass-data/countries/.</p>
        <div className="tp-filters">
          <input id="tp-csearch" className="tp-input" type="search" placeholder="Search countries" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search countries" />
          <select id="tp-cregion" className="tp-input" value={region} onChange={(e) => setRegion(e.target.value as Region | '')} aria-label="Region"><option value="">All regions</option>{REGIONS.map((r) => <option key={r}>{r}</option>)}</select>
          {you && <div className="tp-chips" role="group" aria-label="Sort"><button aria-pressed={sortBy === 'match'} onClick={() => setSortBy('match')}>Closest to me</button><button aria-pressed={sortBy === 'name'} onClick={() => setSortBy('name')}>A–Z</button></div>}
        </div>
        <div className="tp-lgrid">{list.map((c) => <CountryCard key={c.id} c={c} you={you} onOpen={() => openCountry(c.id)} />)}</div>
      </section>
    );
  } else if (view === 'country') {
    const c = COUNTRY_BY_ID[countryId];
    if (!c) body = <section className="tp-empty"><p>Not found.</p></section>;
    else {
      const leaders = LEADERS.filter((l) => COUNTRY_BY_NAME[l.country] === c);
      const fams = nearestFamilies(c.v);
      const f = c.facts;
      body = (
        <section className="tp-profile">
          <button className="tp-link" onClick={() => setView('countries')}>← All countries</button>
          <div className="tp-res-head">
            <div>
              <p className="tp-kicker">{c.region}</p>
              <h1 className="tp-title tp-title--sm">{c.name}</h1>
              <p className="tp-role">{c.system}</p>
              <p><span className="tp-tag">Closest family: {fams[0].f.name}</span></p>
              {you && <p className="tp-match">{similarity(you, c.v)}% similar to your answers</p>}
              <div className="tp-actions">
                <button className="tp-btn" onClick={() => compareWith([you ? 'you12' : `f:${fams[0].f.id}`, `c:${c.id}`, ...leaders.filter((l) => l.era === 'current').slice(0, 1).map((l) => `l:${l.id}`)])}>Compare</button>
                <a className="tp-btn" href={`/compass-data/countries/${c.id}.json`} target="_blank" rel="noopener noreferrer">JSON ↗</a>
              </div>
            </div>
            <Radar labels={AXES.map((a) => a.high)} series={[...(you ? [{ v: you, color: 'var(--tp-you)' }] : []), { v: c.v, color: 'var(--tp-them)', dashed: true }]} />
          </div>
          <table className="tp-facts">
            <tbody>
              <tr><th>Same-sex couples</th><td>{SAMESEX_LABEL[f.samesex]}{f.samesexYear ? ` (${f.samesexYear})` : ''}</td></tr>
              <tr><th>Death penalty</th><td>{DEATH_LABEL[f.death]}</td></tr>
              <tr><th>Military service</th><td>{CONSCRIPTION_LABEL[f.conscription]}</td></tr>
              <tr><th>Abortion</th><td>{ABORTION_LABEL[f.abortion]}</td></tr>
              <tr><th>Religion and state</th><td>{f.religion}</td></tr>
              <tr><th>Nuclear weapons</th><td>{f.nuclear === 'yes' ? 'Yes' : f.nuclear === 'undeclared' ? 'Undeclared, widely believed' : 'No'}</td></tr>
              <tr><th>Alliances</th><td>{[f.nato && 'NATO', f.eu && 'European Union'].filter(Boolean).join(', ') || 'Neither NATO nor EU'}</td></tr>
              {c.milex && <tr><th>Military spending</th><td>{c.milex.v}% of GDP ({c.milex.year}) · <a href={c.milex.url} target="_blank" rel="noopener noreferrer">{c.milex.source}</a></td></tr>}
              {c.dating && <tr><th>Online dating</th><td>{c.dating.label}: {c.dating.v}% ({c.dating.year}) · <a href={c.dating.url} target="_blank" rel="noopener noreferrer">{c.dating.source}</a></td></tr>}
            </tbody>
          </table>
          {f.note && <p className="tp-fine">{f.note}</p>}
          <CountrySocial cid={c.id} />
          <h2 className="tp-h2">On the twelve Compass axes</h2>
          <div className="tp-axes-grid">
            {GROUPS.map((g) => (
              <div key={g.id} className="tp-axgroup">
                <h2 style={{ color: GROUP_HUE[g.id] }}>{g.name}</h2>
                {AXES.filter((a) => a.group === g.id).map((a) => {
                  const i = AXES.indexOf(a), ev = c.laws.filter((r) => r.ax.includes(a.id));
                  return (
                    <div key={a.id}>
                      <AxisBar name={a.name} low={a.low} high={a.high} hue={GROUP_HUE[a.group]} marks={[...(you ? [{ v: you[i], label: 'You', color: 'var(--tp-you)' }] : []), { v: c.v[i], label: c.name, color: 'var(--tp-them)', ring: true }]} />
                      <p className="tp-band">{band(c.v[i], a)} · {c.v[i]}</p>
                      {ev.length > 0 && <ul className="tp-ev">{ev.map((r, k) => <li key={k}><b>{r.y}</b> {r.t}</li>)}</ul>}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          {leaders.length > 0 && <><h2 className="tp-h2">Leaders from {c.name}</h2><div className="tp-lgrid">{leaders.map((l) => <LeaderCard key={l.id} l={l} you={you} onOpen={() => openLeader(l.id)} />)}</div></>}
        </section>
      );
    }
  /* ---------------- ideologies ---------------- */
  } else if (view === 'ideologies') {
    body = (
      <section className="tp-leaders">
        <h1 className="tp-title tp-title--sm">Families of thought</h1>
        <p className="tp-lede">The {FAMILIES.length} tags used on this site, who carries each one, and which countries’ laws sit closest. Each is also available as JSON under /compass-data/ideologies/.</p>
        <div className="tp-famgrid">
          {FAMILIES.map((f) => {
            const members = LEADERS.filter((l) => l.fam === f.id);
            const near = COUNTRIES.map((c) => ({ c, s: similarity(f.v, c.v) })).sort((a, b) => b.s - a.s).slice(0, 3);
            return (
              <article key={f.id} className="tp-fam">
                <h2>{f.name}</h2>
                <p>{f.note}</p>
                <Strip v={f.v} />
                <p className="tp-fine"><b>Tagged:</b> {members.length ? members.map((l, i) => <span key={l.id}>{i ? ', ' : ''}<button className="tp-inline" onClick={() => openLeader(l.id)}>{l.name}</button></span>) : 'no one in the directory'}</p>
                <p className="tp-fine"><b>Closest countries:</b> {near.map(({ c }, i) => <span key={c.id}>{i ? ', ' : ''}<button className="tp-inline" onClick={() => openCountry(c.id)}>{c.name}</button></span>)}</p>
                <div className="tp-actions">
                  <button className="tp-btn" onClick={() => compareWith([you ? 'you12' : `f:${f.id}`, `f:${f.id}`, ...members.slice(0, 2).map((l) => `l:${l.id}`)].filter((x, i, a) => a.indexOf(x) === i))}>Compare</button>
                  <a className="tp-btn" href={`/compass-data/ideologies/${f.id}.json`} target="_blank" rel="noopener noreferrer">JSON ↗</a>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    );
  /* ---------------- society ---------------- */
  } else if (view === 'society') {
    body = <Society onCountry={openCountry} onLeader={openLeader} />;
  /* ---------------- charts ---------------- */
  } else if (view === 'charts') {
    const axisOpts = [...AXES.map((a) => ({ id: a.id, name: `${a.name} (${a.low} → ${a.high})`, ends: [a.low, a.high] as [string, string] })), ...EV_AXES.map((a) => ({ id: `ev:${a.id}`, name: `8values ${a.name} (${a.high} → ${a.low})`, ends: [a.high, a.low] as [string, string] })), ...SOC_AXES.map((a) => ({ id: `soc:${a.id}`, name: `Social: ${a.name} (${a.low} → ${a.high}), countries only`, ends: [a.low, a.high] as [string, string] }))];
    const getV = (v12: number[], id: string, key = '') => { if (id.startsWith('soc:')) { const i = SOC_AXES.findIndex((a) => `soc:${a.id}` === id); return key.startsWith('c:') ? SOC_VEC[key.slice(2)][i] ?? 50 : NaN; } if (id.startsWith('ev:')) { const i = EV_AXES.findIndex((a) => `ev:${a.id}` === id); return 100 - project12(v12)[i]; } return v12[AXES.findIndex((a) => a.id === id)]; };
    const setPts = scSet === 'countries' ? COUNTRIES.map((c) => ({ key: `c:${c.id}`, label: c.name, short: c.id.toUpperCase(), v: c.v, color: `var(--tp-r-${c.region.replace(' ', '')})` }))
      : scSet === 'current' ? LEADERS.filter((l) => l.era === 'current').map((l) => ({ key: `l:${l.id}`, label: l.name, short: l.name.split(' ').slice(-1)[0], v: l.v, color: `var(--tp-r-${l.region.replace(' ', '')})` }))
      : FAMILIES.map((f) => ({ key: `f:${f.id}`, label: f.name, short: f.name.split(' ')[0], v: f.v, color: 'var(--ink)' }));
    const pts = setPts.map((p) => ({ ...p, x: getV(p.v, scX, p.key), y: getV(p.v, scY, p.key) })).filter((p) => !Number.isNaN(p.x) && !Number.isNaN(p.y));
    if (you && scSet !== 'families' && !scX.startsWith('soc:') && !scY.startsWith('soc:')) pts.push({ key: 'you12', label: 'You', short: 'YOU', v: you.map((x) => x ?? 50), color: 'var(--tp-you)', x: getV(you.map((x) => x ?? 50), scX), y: getV(you.map((x) => x ?? 50), scY) });
    const xo = axisOpts.find((a) => a.id === scX)!, yo = axisOpts.find((a) => a.id === scY)!;
    const milex = COUNTRIES.filter((c) => c.milex).sort((a, b) => b.milex!.v - a.milex!.v);
    const dating = COUNTRIES.filter((c) => c.dating);
    const nat = COUNTRIES.slice().sort((a, b) => b.v[8] - a.v[8]);
    const force = COUNTRIES.slice().sort((a, b) => b.v[10] - a.v[10]);
    const ssCounts = (['marriage', 'unions', 'none', 'criminal'] as const).map((k) => ({ k, list: COUNTRIES.filter((c) => c.facts.samesex === k) }));
    body = (
      <section className="tp-charts">
        <h1 className="tp-title tp-title--sm">Charts</h1>
        <p className="tp-lede">Where countries and leaders stand, axis against axis, and the laws that put them there. Placements are editorial; legal facts and sourced figures are marked.</p>

        <article className="tp-chartcard">
          <h2>Any axis against any axis</h2>
          <div className="tp-filters">
            <label className="tp-pick">Across <select id="tp-scx" className="tp-input" value={scX} onChange={(e) => setScX(e.target.value)}>{axisOpts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
            <label className="tp-pick">Up <select id="tp-scy" className="tp-input" value={scY} onChange={(e) => setScY(e.target.value)}>{axisOpts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
            <div className="tp-chips" role="group" aria-label="Show"><button aria-pressed={scSet === 'countries'} onClick={() => setScSet('countries')}>Countries</button><button aria-pressed={scSet === 'current'} onClick={() => setScSet('current')}>Leaders in office</button><button aria-pressed={scSet === 'families'} onClick={() => setScSet('families')}>Families</button></div>
          </div>
          <Scatter points={pts} xLabel={xo.ends} yLabel={yo.ends} onPick={(k) => { if (k.startsWith('c:')) openCountry(k.slice(2)); else if (k.startsWith('l:')) openLeader(k.slice(2)); }} />
          <p className="tp-legend">{REGIONS.map((r) => <span key={r} className="tp-legend__item"><span className="tp-dot" style={{ ['--c' as string]: `var(--tp-r-${r.replace(' ', '')})` }} />{r}</span>)}{you && <span className="tp-legend__item"><span className="tp-dot" style={{ ['--c' as string]: 'var(--tp-you)' }} />You</span>}</p>
        </article>

        <article className="tp-chartcard">
          <h2>Military: spending, service and weapons</h2>
          <p className="tp-fine">Military spending as a share of GDP, 2024, only where the figure was confirmed. The line marks the world level.</p>
          <HBars items={milex.map((c) => ({ label: c.name, v: c.milex!.v, color: c.milex!.status === 'Confirmed in source' ? 'var(--tp-them)' : 'var(--ink-soft)', note: c.milex!.status, href: c.milex!.url }))} max={35} unit="%" refLine={{ v: WORLD_MILEX.v, label: 'World, share of world GDP (SIPRI)' }} />
          <p className="tp-fine">Placement on the Force axis (restraint → force), every country:</p>
          <HBars items={force.map((c) => ({ label: c.name, v: c.v[10], color: 'var(--tp-world)', note: ['Conscription: ' + CONSCRIPTION_LABEL[c.facts.conscription].toLowerCase(), c.facts.nuclear !== 'no' ? 'nuclear' : '', c.facts.nato ? 'NATO' : ''].filter(Boolean).join(' · ') }))} />
        </article>

        <article className="tp-chartcard">
          <h2>Nationalism: who belongs</h2>
          <p className="tp-fine">Placement on the Belonging axis (cosmopolitan → national), from immigration, citizenship and integration law. Hover a name for the laws on its country page.</p>
          <HBars items={nat.map((c) => ({ label: c.name, v: c.v[8], color: 'var(--tp-society)', note: c.laws.filter((l) => l.ax.includes('nation')).map((l) => `${l.y}: ${l.t}`)[0] }))} />
        </article>

        <article className="tp-chartcard">
          <h2>Online dating and the freedom to date</h2>
          <p className="tp-fine">How many couples meet online, where surveys exist. Each survey counts a different group, named under the bar.</p>
          <HBars items={dating.map((c) => ({ label: c.name, v: c.dating!.v, color: 'var(--tp-econ)', note: `${c.dating!.label}, ${c.dating!.year} · ${c.dating!.status}`, href: c.dating!.url }))} max={50} unit="%" />
          <p className="tp-fine">Who you may date: the legal status of same-sex couples in these {COUNTRIES.length} countries.</p>
          <div className="tp-ssgrid">
            {ssCounts.map(({ k, list }) => (
              <div key={k} className={`tp-ss tp-ss--${k}`}>
                <h3>{SAMESEX_LABEL[k]} <span>{list.length}</span></h3>
                <p>{list.map((c) => c.name + (c.facts.samesexYear ? ` (${c.facts.samesexYear})` : '')).join(', ')}</p>
              </div>
            ))}
          </div>
          <p className="tp-fine">More on online dating in The Dating Ledger, also on the Effects shelf.</p>
        </article>

        <article className="tp-chartcard">
          <h2>Laws side by side</h2>
          <div className="tp-tablebox">
            <table className="tp-matrix">
              <thead><tr><th>Country</th><th>Same-sex couples</th><th>Death penalty</th><th>Military service</th><th>Abortion</th><th>Nuclear</th><th>NATO / EU</th></tr></thead>
              <tbody>
                {COUNTRIES.slice().sort((a, b) => a.name.localeCompare(b.name)).map((c) => (
                  <tr key={c.id}>
                    <th><button className="tp-inline" onClick={() => openCountry(c.id)}>{c.name}</button></th>
                    <td className={`tp-m tp-m--${c.facts.samesex}`}>{SAMESEX_LABEL[c.facts.samesex]}</td>
                    <td className={`tp-m tp-m--d${c.facts.death}`}>{DEATH_LABEL[c.facts.death]}</td>
                    <td>{CONSCRIPTION_LABEL[c.facts.conscription]}</td>
                    <td>{ABORTION_LABEL[c.facts.abortion]}</td>
                    <td>{c.facts.nuclear === 'yes' ? 'Yes' : c.facts.nuclear === 'undeclared' ? 'Undeclared' : '—'}</td>
                    <td>{[c.facts.nato && 'NATO', c.facts.eu && 'EU'].filter(Boolean).join(', ') || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    );
  /* ---------------- compare ---------------- */
  } else if (view === 'compare') {
    const chosen = cmp.map((k) => entByKey[k]).filter(Boolean) as Ent[];
    const use12 = cmpAxes === '12' && chosen.every((e) => e.v12);
    const groups: [string, Ent[]][] = [['You', ents.filter((e) => e.kind === 'you12' || e.kind === 'you8')], ['Leaders and public figures', ents.filter((e) => e.kind === 'leader')], ['Countries', ents.filter((e) => e.kind === 'country')], ['Families of thought', ents.filter((e) => e.kind === 'family')], ['8values ideologies', ents.filter((e) => e.kind === 'ev')]];
    const setAt = (i: number, key: string) => setCmp((c) => { const n = c.slice(); if (key) n[i] = key; else n.splice(i, 1); return n.filter(Boolean); });
    const sim = (a: Ent, b: Ent) => (use12 ? similarity(a.v12!, b.v12!.map((x) => x ?? 50)) : evSimilarity(a.v8, b.v8));
    body = (
      <section className="tp-compare">
        <h1 className="tp-title tp-title--sm">Compare</h1>
        <p className="tp-lede">Pick up to four: yourself, leaders, public figures, countries, families of thought or 8values ideologies. Anything with a twelve-axis placement can also be shown on the four 8values axes.</p>
        <div className="tp-filters">
          {[0, 1, 2, 3].map((i) => (
            <label key={i} className="tp-pick">
              <span className="tp-dot" style={{ ['--c' as string]: SERIES[i] }} />
              <select id={`tp-cmp-${i}`} className="tp-input" value={cmp[i] ?? ''} onChange={(e) => setAt(i, e.target.value)}>
                <option value="">{i < 2 ? 'Choose…' : '(none)'}</option>
                {groups.map(([g, list]) => list.length ? <optgroup key={g} label={g}>{list.map((e) => <option key={e.key} value={e.key}>{e.name}</option>)}</optgroup> : null)}
              </select>
            </label>
          ))}
        </div>
        <div className="tp-chips" role="group" aria-label="Axes">
          <button aria-pressed={cmpAxes === '12'} onClick={() => setCmpAxes('12')}>Twelve Compass axes</button>
          <button aria-pressed={cmpAxes === '8'} onClick={() => setCmpAxes('8')}>Four 8values axes</button>
        </div>
        {cmpAxes === '12' && !use12 && chosen.length > 0 && <p className="tp-fine">An 8values result or ideology has no twelve-axis placement, so this comparison is shown on the four 8values axes.</p>}
        {chosen.length >= 2 ? (
          <>
            <div className="tp-simgrid">
              {chosen.slice(1).map((e) => <p key={e.key} className="tp-match">{chosen[0].name} ↔ {e.name}: {sim(chosen[0], e)}% similar</p>)}
            </div>
            <div className="tp-res-head tp-res-head--center">
              <Radar labels={use12 ? AXES.map((a) => a.high) : EV_AXES.map((a) => a.high)} series={chosen.map((e, i) => ({ v: use12 ? e.v12! : e.v8, color: SERIES[i], dashed: i > 0 }))} />
            </div>
            <p className="tp-legend">{chosen.map((e, i) => <span key={e.key} className="tp-legend__item"><span className="tp-dot" style={{ ['--c' as string]: SERIES[i] }} />{e.name}</span>)}</p>
            <div className="tp-axes-grid">
              {use12 ? AXES.map((a, ai) => (
                <div key={a.id}>
                  <AxisBar name={a.name} low={a.low} high={a.high} hue={GROUP_HUE[a.group]} marks={chosen.map((e, i) => ({ v: e.v12![ai], label: e.name, color: SERIES[i], ring: i > 0 }))} />
                </div>
              )) : EV_AXES.map((a, ai) => (
                <div key={a.id}>
                  <AxisBar name={a.name} low={a.high} high={a.low} hue={EV_HUE[ai]} marks={chosen.map((e, i) => ({ v: 100 - e.v8[ai], label: e.name, color: SERIES[i], ring: i > 0 }))} />
                  <p className="tp-band">{chosen.map((e) => `${e.name}: ${evLabel(e.v8[ai], a)}`).join(' · ')}</p>
                </div>
              ))}
            </div>
          </>
        ) : <p className="tp-lede">Choose at least two.</p>}
      </section>
    );
  /* ---------------- axes ---------------- */
  } else if (view === 'axes') {
    body = (
      <section className="tp-axespage">
        <h1 className="tp-title tp-title--sm">The axes</h1>
        <p className="tp-lede">The twelve Compass axes run from 0 at the first pole to 100 at the second. Neither end is the good one. The examples are the leaders and countries placed furthest towards each pole.</p>
        {GROUPS.map((g) => (
          <div key={g.id} className="tp-axdef-group">
            <h2 style={{ color: GROUP_HUE[g.id] }}>{g.name}</h2>
            {AXES.filter((a) => a.group === g.id).map((a) => {
              const i = AXES.indexOf(a), byV = LEADERS.slice().sort((x, y) => x.v[i] - y.v[i]), byC = COUNTRIES.slice().sort((x, y) => x.v[i] - y.v[i]);
              return (
                <article key={a.id} className="tp-axdef">
                  <h3>{a.name}: {a.question}</h3>
                  <div className="tp-axdef__poles">
                    <div><b>{a.low}</b><p>{a.lowNote}</p><p className="tp-fine">Leaders: {byV.slice(0, 3).map((l) => l.name).join(', ')}. Countries: {byC.slice(0, 3).map((c) => c.name).join(', ')}.</p></div>
                    <div><b>{a.high}</b><p>{a.highNote}</p><p className="tp-fine">Leaders: {byV.slice(-3).reverse().map((l) => l.name).join(', ')}. Countries: {byC.slice(-3).reverse().map((c) => c.name).join(', ')}.</p></div>
                  </div>
                </article>
              );
            })}
          </div>
        ))}
        <h2 className="tp-h2">The 8values axes</h2>
        {EV_AXES.map((a) => <article key={a.id} className="tp-axdef"><h3>{a.name}: {a.high} vs {a.low}</h3><p className="tp-fine">Labels from most {a.high.toLowerCase()} to most {a.low.toLowerCase()}: {a.labels.join(', ')}.</p></article>)}
      </section>
    );
  /* ---------------- method ---------------- */
  } else if (view === 'method') {
    body = (
      <section className="tp-method tp-prose">
        <h1 className="tp-title tp-title--sm">Method</h1>
        <h2>The Twelve-Point Compass</h2>
        <p>72 statements, six on each axis, three pointing towards each pole, so agreeing with everything lands you in the middle. Answers count from −2 to +2; an axis scores 50 plus 50 times the average answer, flipped where a statement points to the first pole. Skipped statements are left out. Every statement has a plain-language explanation and a real country example for each answer. The examples illustrate what each side looks like in law; they are not endorsements.</p>
        <h2>8values</h2>
        <p>The 70 statements, the scoring (100 × (max + score) ÷ (2 × max) per axis), the label bands and the 52 ideologies with their matching weights are the original 8values test, used under its MIT licence. Copyright © 2020 8values.</p>
        <h2>Tags and sharing a tag</h2>
        <p>Your tag is the family of thought nearest your result. Each leader carries an editorial tag: the family of thought their politics belongs to and the school it is known by, such as Thatcherism or Chavismo. “You share the tag with” lists everyone carrying your tag; “closest records” lists the nearest placements of any tag.</p>
        <h2>Leaders, public figures and countries</h2>
        <p>Leaders are placed from what they did with power: laws, programmes, wars, institutions. Public figures are placed from documented political actions and statements, and are marked as such. Countries are placed from the laws and policies in force, not from public opinion. The events and laws behind each placement are listed under the axes they inform. Placements are judgements on a shared scale, made to be argued with.</p>
        <h2>Projection onto 8values axes</h2>
        <p>Anything placed on the twelve axes can be shown on 8values’ four: Equality from ownership, redistribution and trade; World from belonging, sovereignty and force; Liberty from liberty, power and centralism; Progress from morality, faith and ecology. This is an approximation, labelled wherever it is used.</p>
        <h2>Figures and sources</h2>
        <p>Legal facts (same-sex couples, the death penalty, military service, abortion, nuclear weapons, alliances) reflect the law as checked in late 2026. Military spending is shown only where SIPRI’s figure was confirmed; online-dating shares come from the surveys used in The Dating Ledger. Offices were checked against news reports on {CHECKED}; Israel’s October 2026 election and Sweden’s government formation were unresolved then.</p>
        <h2>Social Atlas</h2>
        <p>A second set of twelve axes measures how each country’s laws treat private and social life: marriage, family, private life, sexual violence, LGBTQ+ people, women, religion, pluralism, speech, punishment, online dating and personal choices. Each axis averages legal indicators whose answers score from 0 (most restrictive or punitive) to 100 (freest or best protected); some indicators, such as the maximum penalty for rape or bans on communist or Nazi symbols, are shown as facts and not scored, because more punishment or more bans is not simply better or worse. Unknown answers are left blank and the number of known indicators is shown beside each score. Indicators marked “check” are ones where sources disagree or the law is changing. Laws affecting Muslims are listed as laws; the atlas does not label any country or person Islamophobic. Leaders’ records on social questions are given only where a documented act shows them.</p>
        <h2>Data</h2>
        <p>Every country and family of thought is published as JSON: <a href="/compass-data/index.json" target="_blank" rel="noopener noreferrer">/compass-data/index.json</a> lists the files.</p>
        <h2>Privacy</h2>
        <p>Answers and results stay in this browser. Result codes contain only your scores.</p>
      </section>
    );
  /* ---------------- history ---------------- */
  } else {
    body = (
      <section className="tp-history">
        <h1 className="tp-title tp-title--sm">History</h1>
        <p className="tp-lede">Results saved in this browser, newest first. Codes starting c1 are Compass results; e1 are 8values results.</p>
        <div className="tp-filters">
          <input id="tp-code" className="tp-input" placeholder="Paste a result code (c1… or e1…)" value={code} onChange={(e) => setCode(e.target.value)} aria-label="Result code" />
          <button className="tp-btn" onClick={() => {
            const c12 = decode(code), e8 = evDecode(code);
            if (c12) { setYou(c12); setResultOf('c12'); setHistory((h) => [...h, { at: Date.now(), code: encode(c12) }]); setCode(''); setView('results'); }
            else if (e8) { setYou8(e8); setResultOf('ev'); setHistory((h) => [...h, { at: Date.now(), code: evEncode(e8) }]); setCode(''); setView('results'); }
            else setMsg('That code is not valid. Compass codes start with c1, 8values codes with e1.');
          }}>Open code</button>
        </div>
        <p className="tp-fine" aria-live="polite">{msg}</p>
        {history.length === 0 ? <p className="tp-fine">No saved results yet.</p> : (
          <ol className="tp-hist">
            {history.slice().reverse().map((h) => {
              const v = decode(h.code), e = evDecode(h.code);
              const label = v ? nearestFamilies(v)[0].f.name : e ? evIdeology(e).name : '—';
              return (
                <li key={h.at}>
                  <span>{new Date(h.at).toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  <b>{v ? 'Compass' : '8values'} · {label}</b>
                  {v ? <Strip v={v} /> : <span className="tp-fine">{e && EV_AXES.map((a, i) => `${a.high} ${e[i]}`).join(' · ')}</span>}
                  <span className="tp-actions">
                    <button className="tp-btn" onClick={() => { if (v) { setYou(v); setResultOf('c12'); } else if (e) { setYou8(e); setResultOf('ev'); } setView('results'); }}>Open</button>
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
    <div className="tp" ref={root}>
      <header className="tp-bar-top">
        <button className="tp-link" onClick={onExit}>← Shelf</button>
        <span className="tp-brand">Twelve-Point Compass</span>
        <nav className="tp-nav" aria-label="Compass">
          {nav.map(([v, label]) => (
            <button key={v} aria-current={view === v || (view === 'leader' && v === 'leaders') || (view === 'country' && v === 'countries') ? 'page' : undefined}
              onClick={() => (v === 'test' ? setView(Object.keys(test === 'c12' ? answers : evAnswers).length >= total ? 'home' : 'test') : setView(v))}>{label}</button>
          ))}
        </nav>
      </header>
      <main className="tp-main">{body}</main>
    </div>
  );
}
