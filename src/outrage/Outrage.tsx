/**
 * The Outrage Dividend: a visual data essay on the protest, riot and grift
 * economies in India and the world. Every figure is in ./data.ts with its
 * source; the charts are in ./charts.tsx; the opening animation in ./Hero.tsx.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  BILL, CYBER_COMPLAINTS, CYBER_LOSS, INCIDENTS, KIND, KIND_ORDER, QUOTES, RIOTS, SHUTDOWNS_IN, SHUTDOWNS_VIOLENCE,
  SHUTDOWNS_WORLD, SOURCES, SRC, type Incident, type Kind,
} from './data';
import { Bars, Figure, HBars, Legend, Spark, Timeline, TipCtx, TipLayer, fmtIN } from './charts';
import { Hero } from './Hero';

const YEARS = Array.from({ length: 10 }, (_, i) => 2016 + i);

function Cite({ id, children }: { id: string; children?: ReactNode }) {
  const s = SRC[id];
  return <a className="oe-cite" href={s.url} target="_blank" rel="noreferrer" title={s.title}>{children ?? '↗'}</a>;
}

function Quote({ q, tone = 'ink' }: { q: keyof typeof QUOTES; tone?: 'ink' | 'riot' | 'grift' | 'protest' }) {
  const d = QUOTES[q];
  return (
    <blockquote className={`oe-quote oe-quote--${tone} oe-reveal`}>
      <p>{d.text}</p>
      <footer><b>{d.who}</b> · <cite>{d.work}</cite>{d.note && <small>{d.note}</small>}</footer>
    </blockquote>
  );
}

function Chapter({ n, id, title, kicker, children }: { n: string; id: string; title: string; kicker: string; children: ReactNode }) {
  return (
    <section className="oe-ch" id={`oe-${id}`} data-ch={n}>
      <div className="oe-ch__head oe-reveal">
        <div className="oe-ch__n">{n}</div>
        <div>
          <div className="oe-kicker">{kicker}</div>
          <h2 className="oe-ch__title">{title}</h2>
        </div>
      </div>
      {children}
    </section>
  );
}

function Stat({ big, label, src, kind }: { big: string; label: ReactNode; src?: string; kind?: Kind }) {
  return (
    <div className="oe-stat oe-reveal">
      {kind && <i className="oe-stat__dot" style={{ background: KIND[kind].color }} />}
      <div className="oe-stat__big">{big}</div>
      <div className="oe-stat__lab">{label}{src && <> <Cite id={src} /></>}</div>
    </div>
  );
}

/* ───────── chapter 2: the price of a word ───────── */
const OUT = ['They', 'the elites', 'their cronies', 'the other side'];
const MORAL = ['Shameful', 'betrayed', 'evil', 'Outrage'];
function WordPrice() {
  const [o, setO] = useState(0);
  const [m, setM] = useState(0);
  const mult = Math.pow(1.67, o) * Math.pow(1.2, m);
  const og = (i: number) => <mark className="oe-w oe-w--out">{OUT[i]}</mark>;
  const mo = (i: number) => <mark className="oe-w oe-w--moral">{MORAL[i]}</mark>;
  const post = (
    <>
      {m >= 1 && <>{mo(0)}. </>}
      {o >= 1 ? og(0) : 'The council'} {m >= 2 ? <>{o >= 1 ? 'have' : 'has'} {mo(1)} us with</> : o >= 1 ? 'have passed' : 'has passed'} a new land policy
      {o >= 2 && <>, written for {og(1)}</>}{o >= 3 && <> and {og(2)}</>}{m >= 3 && <> — pure {mo(2)}</>}.
      {o >= 4 && <> And {og(3)} wants you silent.</>}{m >= 4 && <> {mo(3)}!</>}
    </>
  );
  const shares = Math.round(100 * mult);
  const maxShares = Math.round(100 * Math.pow(1.67, 4) * Math.pow(1.2, 4));
  const Step = ({ v, set, max, label, cls }: { v: number; set: (n: number) => void; max: number; label: string; cls: string }) => (
    <div className="oe-step">
      <span className={`oe-step__lab ${cls}`}>{label}</span>
      <button onClick={() => set(Math.max(0, v - 1))} disabled={v === 0} aria-label={`Fewer ${label}`}>−</button>
      <b aria-live="polite">{v}</b>
      <button onClick={() => set(Math.min(max, v + 1))} disabled={v === max} aria-label={`More ${label}`}>+</button>
    </div>
  );
  return (
    <figure className="oe-fig oe-reveal oe-wp">
      <div className="oe-fig__head"><div>
        <div className="oe-fig__n">Fig. 2 · interactive</div>
        <h3 className="oe-fig__title">Write a post, watch its price fall</h3>
        <p className="oe-fig__sub">Add words about an out-group or moral-emotional words, and see how much further the same news would travel.</p>
      </div></div>
      <div className="oe-wp__grid">
        <div>
          <div className="oe-wp__phone">
            <div className="oe-wp__who"><i />@civic_update · now</div>
            <p className="oe-wp__post">{post}</p>
            <div className="oe-wp__react">♡ {fmtIN(shares)} shares</div>
          </div>
          <div className="oe-wp__ctl">
            <Step v={o} set={setO} max={4} label="out-group words" cls="oe-w--out" />
            <Step v={m} set={setM} max={4} label="moral-emotional words" cls="oe-w--moral" />
          </div>
        </div>
        <div className="oe-wp__out">
          <div className="oe-wp__mult">×{mult.toFixed(mult < 10 ? 2 : 1)}</div>
          <div className="oe-wp__note">expected sharing compared with the calm version</div>
          <div className="oe-wp__bars">
            <div className="oe-wp__row"><span>Calm post</span><div><i style={{ width: `${(100 / maxShares) * 100}%` }} /></div><b>100</b></div>
            <div className="oe-wp__row"><span>Your post</span><div><i className="hot" style={{ width: `${(shares / maxShares) * 100}%` }} /></div><b>{fmtIN(shares)}</b></div>
          </div>
          <p className="oe-wp__fine">
            Each out-group word: odds of sharing ×1.67 (Rathje et al., 2.7 million posts) <a className="oe-cite" href={SRC.rathje.url} target="_blank" rel="noreferrer">↗</a>.
            Each moral-emotional word: retweets ×1.2 (Brady et al.) <a className="oe-cite" href={SRC.brady.url} target="_blank" rel="noreferrer">↗</a>.
            Multiplying them is an illustration, not a forecast: the studies measured averages on US Twitter and Facebook.
          </p>
        </div>
      </div>
    </figure>
  );
}

/* ───────── chapter 8: the tracker ───────── */
type Region = 'India' | 'World' | 'All';
type SortKey = 'year' | 'name' | 'deaths' | 'kind';
function Tracker() {
  const [region, setRegion] = useState<Region>('India');
  const [kinds, setKinds] = useState<Set<Kind>>(new Set(['protest', 'riot', 'state']));
  const [sort, setSort] = useState<{ k: SortKey; dir: 1 | -1 }>({ k: 'year', dir: -1 });
  const [open, setOpen] = useState<string | null>(null);
  const toggle = (k: Kind) => setKinds((s) => { const n = new Set(s); if (n.has(k)) n.delete(k); else n.add(k); return n; });
  const rows = useMemo(() => {
    const r = INCIDENTS.filter((d) => (region === 'All' || d.region === region) && kinds.has(d.kind));
    const key = (d: Incident) => (sort.k === 'year' ? d.year : sort.k === 'deaths' ? d.deaths ?? -1 : sort.k === 'kind' ? KIND_ORDER.indexOf(d.kind) : d.name);
    return [...r].sort((a, b) => (key(a) > key(b) ? 1 : key(a) < key(b) ? -1 : 0) * sort.dir);
  }, [region, kinds, sort]);
  const th = (k: SortKey, label: string) => (
    <th aria-sort={sort.k === k ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'}>
      <button onClick={() => setSort((s) => ({ k, dir: s.k === k ? ((-s.dir) as 1 | -1) : k === 'name' ? 1 : -1 }))}>
        {label}{sort.k === k ? (sort.dir === 1 ? ' ▲' : ' ▼') : ''}
      </button>
    </th>
  );
  const india = region !== 'World';
  const tiles = india
    ? [
        { big: fmtIN(37816), lab: 'rioting cases, 2022 · −39% since 2016', spark: RIOTS, kind: 'riot' as Kind, src: 'ncrb' },
        { big: '65', lab: 'internet shutdowns, 2025 · most of any democracy', spark: SHUTDOWNS_IN, kind: 'state' as Kind, src: 'an25' },
        { big: '22.68 lakh', lab: 'cyber-fraud complaints, 2024', spark: CYBER_COMPLAINTS, kind: 'grift' as Kind, src: 'i4c' },
        { big: '491M', lab: 'social media user identities', kind: 'protest' as Kind, src: 'dr' },
      ]
    : [
        { big: '313', lab: 'internet shutdowns worldwide, 2025 · a record', spark: SHUTDOWNS_WORLD, kind: 'state' as Kind, src: 'an25' },
        { big: '133', lab: 'shutdowns alongside violence, 2022 · up from 75 in 2019', spark: SHUTDOWNS_VIOLENCE, kind: 'riot' as Kind, src: 'an22' },
        { big: '160+', lab: 'significant anti-government protests, 2024', kind: 'protest' as Kind, src: 'carnegie' },
        { big: '$19.1T', lab: 'economic impact of violence, 2023 · 13.5% of world GDP', kind: 'riot' as Kind, src: 'gpi' },
      ];
  const tlItems = INCIDENTS.filter((d) => kinds.has(d.kind));
  return (
    <div className="oe-dash oe-reveal" id="oe-tracker-board">
      <div className="oe-dash__bar">
        <div className="oe-seg" role="tablist" aria-label="Region">
          {(['India', 'World', 'All'] as Region[]).map((r) => (
            <button key={r} role="tab" aria-selected={region === r} className={region === r ? 'on' : ''} onClick={() => setRegion(r)}>{r}</button>
          ))}
        </div>
        <div className="oe-chips" aria-label="Filter by type">
          {(['protest', 'riot'] as Kind[]).map((k) => (
            <button key={k} className={`oe-chip${kinds.has(k) ? ' on' : ''}`} aria-pressed={kinds.has(k)} onClick={() => toggle(k)}>
              <i style={{ background: KIND[k].color }} />{KIND[k].label}
            </button>
          ))}
        </div>
      </div>
      <div className="oe-kpis">
        {tiles.map((t) => (
          <div key={t.lab} className="oe-kpi">
            <div className="oe-kpi__top"><i style={{ background: KIND[t.kind].color }} /><span>{KIND[t.kind].label}</span></div>
            <div className="oe-kpi__big">{t.big}</div>
            <div className="oe-kpi__lab">{t.lab} <Cite id={t.src} /></div>
            {t.spark && <Spark data={t.spark} color={KIND[t.kind].color} />}
          </div>
        ))}
      </div>
      <div className="oe-dash__grid">
        <Figure n="8a" title={india ? 'Internet shutdowns ordered in India' : 'Internet shutdowns worldwide'}
          sub={india ? 'Per year. The state’s answer to unrest, and to exams, elections and rumour.' : 'Per year, the years checked against Access Now’s reports.'}
          source={india ? ['an23', 'an24', 'an25'] : ['an22', 'an24', 'an25']}
          table={{ cols: ['Year', 'Shutdowns'], rows: (india ? SHUTDOWNS_IN : SHUTDOWNS_WORLD).map((d) => [d.x, d.v]) }}>
          <Bars key={region} data={india ? SHUTDOWNS_IN : SHUTDOWNS_WORLD} color={KIND.state.color} unit="shutdowns" label="Internet shutdowns per year" h={200} />
        </Figure>
        <Figure n="8b" title="Flashpoints" sub="Dot area by deaths; a hollow ring means no reliable count. Tap one to open it in the ledger."
          legend={KIND_ORDER.filter((k) => k !== 'grift' && k !== 'state' && kinds.has(k))}>
          <Timeline items={tlItems} onPick={(id) => { setOpen(id); const it = INCIDENTS.find((d) => d.id === id); if (it && region !== 'All' && it.region !== region) setRegion('All'); }} />
        </Figure>
      </div>
      <div className="oe-ledger">
        <div className="oe-ledger__head"><h3 className="oe-fig__title">The ledger</h3><span>{rows.length} events · sort by any column · tap a row for detail</span></div>
        <div className="oe-tablewrap">
          <table className="oe-table oe-table--ledger">
            <thead><tr>{th('year', 'Year')}{th('name', 'Event')}<th className="oe-c-place">Place</th>{th('kind', 'Type')}{th('deaths', 'Deaths')}<th className="oe-c-cost">Measured cost</th></tr></thead>
            <tbody>
              {rows.map((d) => (
                <FragmentRow key={d.id} d={d} open={open === d.id} onToggle={() => setOpen(open === d.id ? null : d.id)} />
              ))}
              {rows.length === 0 && <tr><td colSpan={6} className="oe-empty">Nothing matches. Turn a type back on.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
function FragmentRow({ d, open, onToggle }: { d: Incident; open: boolean; onToggle: () => void }) {
  return (
    <>
      <tr className={`oe-row${open ? ' is-open' : ''}`} onClick={onToggle} tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); } }}>
        <td className="num">{d.year}{d.end ? `–${String(d.end).slice(2)}` : ''}</td>
        <td><b>{d.name}</b></td>
        <td className="oe-c-place">{d.place}</td>
        <td><span className="oe-tag"><i style={{ background: KIND[d.kind].color }} />{KIND[d.kind].label}</span></td>
        <td className="num oe-c-deaths" data-l="Deaths ">{d.deaths ? fmtIN(d.deaths) : '—'}</td>
        <td className="oe-c-cost">{d.cost ?? '—'}</td>
      </tr>
      {open && (
        <tr className="oe-row__detail"><td colSpan={6}>
          <p><b>Trigger:</b> {d.trigger}. {d.detail}</p>
          {d.deathsNote && <p><b>Deaths:</b> {d.deathsNote}.</p>}
          <p className="oe-row__src">{d.src.map((s) => <a key={s} href={SRC[s].url} target="_blank" rel="noreferrer">{SRC[s].title} ↗</a>)}</p>
        </td></tr>
      )}
    </>
  );
}

/* ───────── the essay ───────── */
const TOC = [
  ['street', '01', 'Street & screen'], ['word', '02', 'Price of a word'], ['protest', '03', 'Protest economy'], ['riot', '04', 'Riot paradox'],
  ['world', '05', 'The neighbourhood'], ['grift', '06', 'Grift economy'], ['words', '07', 'Men of words'], ['tracker', '08', 'Tracker'],
  ['nots', '09', 'What it doesn’t say'], ['sources', '10', 'Sources'],
] as const;

export function Outrage({ onExit }: { onExit: () => void }) {
  const scroller = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<{ x: number; y: number; node: ReactNode } | null>(null);
  const [prog, setProg] = useState(0);
  const [cur, setCur] = useState('');
  const [toc, setToc] = useState(false);
  const [solid, setSolid] = useState(false);
  const tipApi = useMemo(() => ({ show: (e: { clientX: number; clientY: number }, node: ReactNode) => setTip({ x: e.clientX, y: e.clientY, node }), hide: () => setTip(null) }), []);

  useEffect(() => {
    const links = ['/fonts-guitar/fonts.css', '/fonts-airstrip/fonts.css'].map((href) => {
      const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; document.head.appendChild(l); return l;
    });
    return () => links.forEach((l) => l.remove());
  }, []);

  useEffect(() => {
    const root = scroller.current!;
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { root, rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
    const watch = () => root.querySelectorAll('.oe-reveal:not(.is-in)').forEach((el) => io.observe(el));
    watch();
    const mo = new MutationObserver(watch); mo.observe(root, { childList: true, subtree: true });
    return () => { io.disconnect(); mo.disconnect(); };
  }, []);

  const onScroll = useCallback(() => {
    const el = scroller.current!;
    setProg(el.scrollTop / Math.max(1, el.scrollHeight - el.clientHeight));
    let c = '';
    el.querySelectorAll<HTMLElement>('.oe-ch').forEach((s) => { if (s.offsetTop - el.clientHeight * 0.4 <= el.scrollTop) c = s.id.slice(3); });
    setCur(c);
    const hero = el.querySelector<HTMLElement>('.oe-hero');
    setSolid(!!hero && el.scrollTop > hero.offsetHeight - 60);
    setTip(null);
  }, []);

  const go = (id: string) => { setToc(false); const el = scroller.current!.querySelector<HTMLElement>(`#oe-${id}`); el && scroller.current!.scrollTo({ top: el.offsetTop - 52, behavior: 'smooth' }); };
  useEffect(() => { const k = (e: KeyboardEvent) => { if (e.key === 'Escape') { if (toc) setToc(false); else onExit(); } }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [onExit, toc]);

  const curLabel = TOC.find((t) => t[0] === cur);
  return (
    <TipCtx.Provider value={tipApi}>
      <div className="oe" ref={scroller} onScroll={onScroll}>
        <nav className={`oe-top${solid ? ' is-solid' : ''}`}>
          <button className="oe-top__back" onClick={onExit}>← Shelf</button>
          <button className="oe-top__toc" onClick={() => setToc((v) => !v)} aria-expanded={toc}>
            <span className="oe-top__name">The Outrage Dividend</span>
            {curLabel && <span className="oe-top__cur">{curLabel[1]} · {curLabel[2]}</span>}
            <span aria-hidden>☰</span>
          </button>
          <button className="oe-top__jump" onClick={() => go('tracker')}>Tracker</button>
          <i className="oe-top__prog" style={{ transform: `scaleX(${prog})` }} />
          {toc && (
            <ol className="oe-toc">
              {TOC.map(([id, n, t]) => <li key={id}><button className={cur === id ? 'on' : ''} onClick={() => go(id)}><span>{n}</span>{t}</button></li>)}
            </ol>
          )}
        </nav>

        <Hero scroller={scroller} />

        <main className="oe-body">
          <p className="oe-lede oe-reveal">
            <span className="oe-drop">E</span>very era gets the unrest its technology allows. Ours is cheap to start, expensive to stop and easy to sell.
            This essay follows three economies that grew up around public anger in India and beyond. The <b className="k-protest">protest economy</b>,
            where disruption is the most reliable way to be heard and someone else pays for it. The <b className="k-riot">riot economy</b>, where a
            flashpoint is filmed, forwarded and fought over long after the fires are out. And the <b className="k-grift">grift economy</b>, where
            urgency and outrage are turned into clicks, donations and fraud. A fourth character runs through all three: the{' '}
            <b className="k-state">state</b>, with its own favourite tool, the off switch.
          </p>
          <Legend kinds={KIND_ORDER} />

          <Chapter n="01" id="street" kicker="Article 19 and the phone" title="The street and the screen">
            <div className="oe-prose oe-reveal">
              <p>
                Article 19 of the Constitution gives every citizen the right to assemble <i>“peaceably and without arms”</i>. The two qualifiers
                hold the whole idea: dissent is a right, and its form is a duty. For most of India’s history a protest had to be built by hand,
                with unions, cadres, buses and posters. It took weeks to fill a maidan.
              </p>
              <p>
                The phone cut that to an evening. India now has about 491 million social media user identities <Cite id="dr" />, and in 2024 ACLED
                recorded more protest and riot events in India than in any other country <Cite id="acled" />. Most of them were peaceful. That is
                the first fact to remember, and the first one a feed forgets.
              </p>
            </div>
            <div className="oe-stats">
              <Stat big="491M" label="social media user identities in India" src="dr" kind="protest" />
              <Stat big="#1" label="most protest and riot events of any country, 2024 (ACLED)" src="acled" kind="protest" />
              <Stat big="771" label="internet shutdowns ordered in India, 2016–2023" src="an23" kind="state" />
            </div>
          </Chapter>

          <Chapter n="02" id="word" kicker="The attention market" title="The price of a word">
            <div className="oe-prose oe-reveal">
              <p>
                Platforms do not sell outrage. They sell attention, and outrage is the cheapest way to buy it. Two large studies put a price on it.
                Brady and colleagues found that each moral-emotional word in a tweet (<i>shameful</i>, <i>evil</i>, <i>betrayal</i>) raised its
                retweets by about a fifth <Cite id="brady" />. Rathje, Van Bavel and van der Linden went further: across 2.7 million posts, each word
                about the political <i>other side</i> raised the odds of a share by 67%. It was the strongest predictor they measured <Cite id="rathje" />.
              </p>
              <p>Try it. The news below doesn’t change. Only the words around it do.</p>
            </div>
            <WordPrice />
            <Quote q="devil" tone="riot" />
            <div className="oe-prose oe-reveal">
              <p>
                Eric Hoffer wrote that in 1951, seventy years before the algorithm, but it reads like a description of how one works. A cause
                spreads fastest when it comes with an enemy. The feed gives everyone an enemy every morning, made to measure.
              </p>
            </div>
          </Chapter>

          <Chapter n="03" id="protest" kicker="Disruption as leverage" title="The protest economy">
            <div className="oe-prose oe-reveal">
              <p>
                A protest economy is not a conspiracy. It is what you get when disruption becomes the surest way to be heard and its cost falls on
                someone who never joined. A long agitation needs logistics: food, tents, transport, lawyers, a stage, and above all a feed. The bill
                goes to the commuter, the trucker, the daily-wage worker, the patient in an ambulance on a blocked highway.
              </p>
              <p>
                The farmers’ agitation of 2020–21 is the clearest case, and it cuts both ways. It camped at Delhi’s borders for a year. Industry
                bodies put the loss at ₹3,000–3,500 crore a day <Cite id="assocham" />. Those are estimates from lobbies with their own interests, but
                the measured items are just as large. NHAI lost ₹2,731 crore in tolls <Cite id="nhai" />, and blockades cost Punjab’s railways ₹2,220
                crore <Cite id="rail" />. Then, in November 2021, the three laws were repealed. Disruption worked. That is the dividend, and why it
                is copied.
              </p>
            </div>
            <div className="oe-stats">
              <Stat big="₹3,500 cr" label="a day: ASSOCHAM’s estimate of the farm agitation’s cost (upper end)" src="assocham" kind="protest" />
              <Stat big="₹70,000 cr" label="PHDCCI’s estimate of the loss in Q3 FY21" src="phd" kind="protest" />
              <Stat big="~100 days" label="Shaheen Bagh’s occupation of a Delhi arterial road" src="sc" kind="protest" />
            </div>
            <Quote q="court" tone="protest" />
            <div className="oe-prose oe-reveal">
              <p>
                The Supreme Court did not ban protest in the Shaheen Bagh case. It said that the right to dissent and other people’s right to move
                have to be balanced, and that a public road cannot be held hostage <i>indefinitely</i>. That is the line this essay draws too: between
                protest as a voice and protest as a toll booth.
              </p>
            </div>
            <Figure n="3" title="Who pays the bill" sub="Measured or estimated costs, ₹ crore. Different methods; not to be added up." legend={KIND_ORDER} source={['i4c', 'jat', 'top10', 'nhai', 'rail']}
              table={{ cols: ['Item', '₹ crore', 'Type', 'Note'], rows: BILL.map((b) => [b.label, b.v, KIND[b.kind].label, b.note]) }}>
              <HBars rows={BILL} />
            </Figure>
          </Chapter>

          <Chapter n="04" id="riot" kicker="Fewer riots, bigger fires" title="The riot paradox">
            <div className="oe-prose oe-reveal">
              <p>
                Here the data argues with the headlines. Rioting cases registered under the NCRB fell by 39% between 2016 and 2022, from 61,974 to
                37,816 <Cite id="ncrb" />. Some of that is under-recording, which critics of the NCRB have documented. But the flashpoints that
                do happen are bigger, more filmed and more organised. In 2016 the Jat quota stir burnt across Haryana and killed about thirty
                people. In 2020 the Delhi riots killed 53. In 2022 at least four trains were set on fire over Agnipath. From 2023, Manipur.
              </p>
              <p>
                The modern riot has a second life online. The video outlives the fire, gets cut to fit each side’s story, and becomes the trigger
                for the next one. The state’s answer is the off switch. India ordered more internet shutdowns than any other country every year
                from 2018 to 2023 <Cite id="an23" />. A shutdown silences the rumour and the witness alike.
              </p>
            </div>
            <div className="oe-multi">
              <Figure n="4a" title="Rioting cases, all India" sub="Registered by the NCRB. The national 2023 total was not yet in our sources." source={['ncrb']}
                table={{ cols: ['Year', 'Cases'], rows: RIOTS.map((d) => [d.x, d.v]) }}>
                <Bars data={RIOTS} years={YEARS} color={KIND.riot.color} unit="cases" label="Rioting cases per year" h={210} />
              </Figure>
              <Figure n="4b" title="Internet shutdowns, India" sub="Ordered by the state. Same years, its own scale." source={['an23', 'an24', 'an25']}
                table={{ cols: ['Year', 'Shutdowns'], rows: SHUTDOWNS_IN.map((d) => [d.x, d.v]) }}>
                <Bars data={SHUTDOWNS_IN} years={YEARS} color={KIND.state.color} unit="shutdowns" label="Internet shutdowns per year" h={210} />
              </Figure>
            </div>
            <div className="oe-stats">
              <Stat big="53" label="dead in the Delhi riots, Feb 2020; 747 vehicles and 468 shops damaged" src="delhi" kind="riot" />
              <Stat big="258+" label="killed in Manipur by the government’s count; 60,000 displaced, 4,786 houses burnt" src="manipur" kind="riot" />
              <Stat big="$585M" label="estimated cost of India’s shutdowns in 2023, over 7,812 hours" src="top10" kind="state" />
            </div>
            <Quote q="lebon" tone="riot" />
          </Chapter>

          <Chapter n="05" id="world" kicker="Sri Lanka · Bangladesh · Nepal · and beyond" title="The neighbourhood is on fire">
            <div className="oe-prose oe-reveal">
              <p>
                In four years three of India’s neighbours saw governments fall to the street. In 2022 Sri Lanka’s crowds took over the presidential
                house and the president fled. In 2024 Bangladesh’s quota protests ended Sheikh Hasina’s rule in five weeks. The UN counted about
                1,400 dead, most of them killed by security forces <Cite id="ohchr" />. In September 2025 Nepal banned 26 social platforms. Within two
                days Parliament and Singha Durbar were burning, 76 people were dead and the prime minister had resigned <Cite id="nepal" />.
              </p>
              <p>
                The pattern is global. A study of 2,809 protests in 101 countries found that the number of protests a year roughly tripled between
                2006 and 2020 <Cite id="ortiz" />. Carnegie’s tracker logged more than 160 significant anti-government protests in 2024 <Cite id="carnegie" />.
                In 2020 the US unrest became the first civil disorder to cost insurers more than a billion dollars <Cite id="ins" />. And governments
                learned India’s habit: in 2025 the world ordered a record 313 internet shutdowns <Cite id="an25" />.
              </p>
            </div>
            <div className="oe-multi">
              <Figure n="5a" title="Internet shutdowns worldwide" sub="Per year. 2025 was the most yet, across 52 countries." source={['an22', 'an24', 'an25']}
                table={{ cols: ['Year', 'Shutdowns'], rows: SHUTDOWNS_WORLD.map((d) => [d.x, d.v]) }}>
                <Bars data={SHUTDOWNS_WORLD} color={KIND.state.color} unit="shutdowns" label="Shutdowns worldwide" h={200} />
              </Figure>
              <Figure n="5b" title="Shutdowns alongside violence" sub="Shutdowns worldwide that came with violence, per year." source={['an22']}
                table={{ cols: ['Year', 'Shutdowns with violence'], rows: SHUTDOWNS_VIOLENCE.map((d) => [d.x, d.v]) }}>
                <Bars data={SHUTDOWNS_VIOLENCE} color={KIND.riot.color} unit="shutdowns with violence" label="Shutdowns alongside violence" h={200} />
              </Figure>
            </div>
            <div className="oe-stats">
              <Stat big="$19.1T" label="economic impact of violence worldwide in 2023, 13.5% of world GDP; India ranked 116th for peace" src="gpi" kind="riot" />
              <Stat big="~3×" label="growth in protests per year, 2006–2020" src="ortiz" kind="protest" />
              <Stat big="1,400" label="dead in Bangladesh, 2024; 12–13% were children" src="ohchr" kind="state" />
            </div>
          </Chapter>

          <Chapter n="06" id="grift" kicker="Cause, campaign, racket" title="The grift economy">
            <Quote q="racket" tone="grift" />
            <div className="oe-prose oe-reveal">
              <p>
                Hoffer saw the arc decades before crowdfunding: a movement turns into a racket once the cause becomes a living. The grift economy is
                that arc running at the speed of a phone. It isn’t one thing. It is the outrage influencer paid by the view, the fundraiser no one
                audits, the forward that ends in a payment link. And above all it is fraud, which uses the same engine as rage: urgency, fear, an
                enemy and a button that says <i>act now</i>.
              </p>
              <p>
                The only part we can measure well is the last. In 2024 Indians reported losing ₹22,846 crore to cyber fraud, about three times the
                year before. Complaints passed 22 lakh <Cite id="i4c" />. The “digital arrest” scam, where a fake officer on video accuses you of a
                crime, is outrage turned inward: fear of the state, sold back to you.
              </p>
            </div>
            <div className="oe-multi">
              <Figure n="6a" title="Money reported lost to cyber fraud" sub="₹ crore per year, reported to I4C." source={['i4c']}
                table={{ cols: ['Year', '₹ crore'], rows: CYBER_LOSS.map((d) => [d.x, d.v]) }}>
                <Bars data={CYBER_LOSS} color={KIND.grift.color} unit="₹ crore" label="Cyber fraud losses" h={200} fmt={(v) => `₹${fmtIN(v)}`} />
              </Figure>
              <Figure n="6b" title="Cyber-fraud complaints" sub="Lakh per year, National Cybercrime Reporting Portal." source={['i4c']}
                table={{ cols: ['Year', 'Lakh complaints'], rows: CYBER_COMPLAINTS.map((d) => [d.x, d.v]) }}>
                <Bars data={CYBER_COMPLAINTS} color={KIND.grift.color} unit="lakh complaints" label="Cyber fraud complaints" h={200} />
              </Figure>
            </div>
            <div className="oe-prose oe-reveal">
              <p>
                The attention market is also a political one. In January–May 2024, parties spent more than ₹290 crore on Google ads alone. The BJP
                spent over ₹100 crore and the Congress about ₹46 crore, and digital spending ran to more than ten times the 2019 level <Cite id="ads" />.
                Meanwhile the state has cancelled the foreign-funding (FCRA) licences of more than 16,000 NGOs since 2015 <Cite id="fcra" />. The
                government calls it stopping the misuse of foreign money; critics call it squeezing dissent. Both readings can be partly true.
                Crowdfunding platforms say fraud is under 0.1% of campaigns, a figure no one has audited independently <Cite id="gfm" />.
              </p>
            </div>
            <div className="oe-stats">
              <Stat big="₹290 cr+" label="political ads on Google, Jan–May 2024" src="ads" kind="grift" />
              <Stat big="16,000+" label="FCRA licences cancelled, 2015–24" src="fcra" kind="state" />
              <Stat big="×3" label="rise in reported cyber-fraud losses, 2023 → 2024" src="i4c" kind="grift" />
            </div>
          </Chapter>

          <Chapter n="07" id="words" kicker="Hoffer · Nietzsche · Dostoevsky · Ambedkar" title="The men of words">
            <div className="oe-prose oe-reveal">
              <p>
                Every mass movement, Hoffer argued, is prepared by “men of words with a grievance”: the people who discredit the existing order
                long before anyone takes to the street. He was not sneering at thought. He was naming a temptation.
              </p>
            </div>
            <Quote q="words" />
            <div className="oe-prose oe-reveal">
              <p>
                The temptation is to treat disorder as proof of sincerity. On campuses and in columns, more often on the left in India as elsewhere,
                the burnt bus becomes “the language of the unheard”. That phrase is borrowed from Martin Luther King, who in the same speech called
                riots self-defeating. Anarchy wears the costume of justice, and whoever questions the costume is told they oppose justice itself.
              </p>
              <p>
                Nietzsche had a word for the engine underneath: <i>ressentiment</i>. Grievance stops being a complaint to fix and becomes an identity
                to keep, and the more wounded the claim, the higher the moral standing.
              </p>
            </div>
            <Quote q="ressent" tone="riot" />
            <div className="oe-prose oe-reveal">
              <p>
                Dostoevsky saw where it ends. <i>Demons</i> grew out of the Nechayev affair of 1869, in which a revolutionary cell murdered one of its
                own members. It is still the sharpest novel about intellectuals who fall in love with destruction. Its theorist Shigalyov sets out to
                design perfect freedom and arrives at its opposite. And the Underground Man shows the personal version: spite kept as a kind of
                dignity.
              </p>
            </div>
            <div className="oe-pair">
              <Quote q="shigalyov" tone="riot" />
              <Quote q="sick" />
            </div>
            <div className="oe-prose oe-reveal">
              <p>
                India had its own answer, from the two men who led some of the largest mass movements in history. In 1922 a crowd at Chauri Chaura
                burnt a police station with more than twenty policemen inside. Gandhi called off the whole non-cooperation movement at its height,
                because a cause that burns people has already been lost. And on the eve of the Republic, Ambedkar gave the warning that still
                defines the line:
              </p>
            </div>
            <Quote q="ambedkar" tone="protest" />
            <aside className="oe-balance oe-reveal">
              <h4>None of this belongs to one side</h4>
              <p>
                The WhatsApp lynchings of 2018 had no ideology except rumour <Cite id="lynch" />. The biggest digital ad budget of 2024 was the
                ruling party’s <Cite id="ads" />. IT cells of every colour farm the same rage, and shutdowns are ordered by governments of every
                party. Anarchy dressed as justice is a style, not a party, and so is hatred dressed as patriotism.
              </p>
            </aside>
          </Chapter>

          <Chapter n="08" id="tracker" kicker="Dashboard" title="The unrest tracker">
            <div className="oe-prose oe-reveal">
              <p>
                Everything above in one place. Switch between India and the world, filter by type, sort the ledger and open any event for its
                sources. Deaths are the lowest official or UN count; a dash means no reliable count, not zero.
              </p>
            </div>
            <Tracker />
          </Chapter>

          <Chapter n="09" id="nots" kicker="The honest part" title="What the data does not say">
            <div className="oe-nots">
              {[
                ['Most protest is peaceful.', 'ACLED counts India first for events, but most are demonstrations without violence, and more than half are in the North.', 'acled'],
                ['Riots are falling, not rising.', 'Registered rioting cases fell 39% from 2016 to 2022. The fires are fewer; their footage is bigger. Under-recording is a fair worry.', 'ncrb'],
                ['The state does much of the killing.', 'In Bangladesh 2024 the UN found most deaths were caused by security forces, not protesters.', 'ohchr'],
                ['The off switch is a choice.', 'Shutdowns are ordered by governments, and in 2025 India still ordered more than any other democracy.', 'an25'],
                ['Disruption sometimes wins on merit.', 'The farm laws were repealed. A protest that wins is not grift; it is politics. The question is who pays and for how long.', 'nhai'],
                ['No one publishes the books.', 'No public dataset shows how Indian movements are funded. “Grift” here means measured fraud and attention spending, not a claim about any one movement.', 'fcra'],
              ].map(([h, p, s], i) => (
                <div key={h} className="oe-not oe-reveal" style={{ transitionDelay: `${(i % 3) * 80}ms` }}>
                  <div className="oe-not__n">{String(i + 1).padStart(2, '0')}</div>
                  <h4>{h}</h4>
                  <p>{p} <Cite id={s} /></p>
                </div>
              ))}
            </div>
            <Quote q="faith" />
            <div className="oe-prose oe-reveal oe-close">
              <p>
                The outrage dividend is paid to whoever can turn other people’s anger into attention, money or power. It is paid by everyone else.
                The cure isn’t silence, and it isn’t the off switch. It is slowness: checking before forwarding, asking who pays, and defending the
                right to protest by refusing to let it become a business.
              </p>
            </div>
          </Chapter>

          <Chapter n="10" id="sources" kicker="Every number, where it came from" title="Sources">
            <ol className="oe-sources">
              {SOURCES.map((s) => <li key={s.id}><a href={s.url} target="_blank" rel="noreferrer">{s.title}</a></li>)}
            </ol>
            <p className="oe-method">
              Method: figures are as published. Where sources disagree the lower figure is used and the range is noted. Dollar figures are
              converted at the year’s average rate and marked ≈. Interactive multipliers are illustrations of published averages, not forecasts.
              Quotations are from the public-domain texts of Le Bon, Dostoevsky (tr. Garnett) and Ambedkar’s Constituent Assembly speech, and
              short extracts from Hoffer, Nietzsche and the Supreme Court’s judgment.
            </p>
          </Chapter>
        </main>
        <footer className="oe-foot">The Outrage Dividend · a visual essay · charts drawn in code</footer>
      </div>
      <TipLayer tip={tip} />
    </TipCtx.Provider>
  );
}
