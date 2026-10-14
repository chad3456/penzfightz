/**
 * Body Atlas — how the human body works, in interactive 3D.
 *
 * A home page of chapters, a list of topics in each, and a viewer where
 * each topic is drawn by one of a set of procedural 3D engines: turn it,
 * zoom in, tap a numbered part to fly to it and read what it does, step
 * through a process, and move sliders that change the model.
 */
import { lazy, useCallback, useEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import * as THREE from 'three';
import { CHAPTERS, CHAPTER } from './chapters';
import { TOPICS } from './topics';
import { REFS } from './refs';
import { Stage3D } from './Scene';
import type { SceneCtx } from './stage';
import type { ChapterId, Topic } from './types';

type EngineProps = { p: Record<string, unknown>; t: Topic };
const L = (f: () => Promise<{ default: ComponentType<never> }>) => lazy(f as () => Promise<{ default: ComponentType<EngineProps> }>);
const ENGINES: Record<string, ReturnType<typeof L>> = {
  virus: L(() => import('./engines/virus')),
  heart: L(() => import('./engines/heart')),
  micro: L(() => import('./engines/micro')),
  brain: L(() => import('./engines/brain')),
  neuron: L(() => import('./engines/neuron')),
  dna: L(() => import('./engines/dna')),
  cell: L(() => import('./engines/cell')),
  lungs: L(() => import('./engines/lungs')),
  vessel: L(() => import('./engines/vessel')),
  body: L(() => import('./engines/body')),
  organ: L(() => import('./engines/organs')),
  senses: L(() => import('./engines/senses')),
  bones: L(() => import('./engines/bones')),
};

type View = { k: 'home' } | { k: 'ch'; id: ChapterId } | { k: 'topic'; id: string };
const BY_ID = new Map(TOPICS.map((t) => [t.id, t]));

function readView(): View {
  const q = new URLSearchParams(location.search);
  const t = q.get('t'); if (t && BY_ID.has(t)) return { k: 'topic', id: t };
  const c = q.get('ch'); if (c && CHAPTER[c as ChapterId]) return { k: 'ch', id: c as ChapterId };
  return { k: 'home' };
}
function writeView(v: View) {
  const q = new URLSearchParams(location.search); q.delete('t'); q.delete('ch');
  if (v.k === 'topic') q.set('t', v.id); if (v.k === 'ch') q.set('ch', v.id);
  const s = q.toString(); history.replaceState(null, '', location.pathname + (s ? '?' + s : '') + location.hash);
}

function useFonts() {
  useEffect(() => {
    if (document.getElementById('ba-fonts')) return;
    const l = document.createElement('link'); l.id = 'ba-fonts'; l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,650&family=Inter:wght@400;500;600&display=swap';
    document.head.appendChild(l);
  }, []);
}

const match = (t: Topic, q: string) => { const h = (t.title + ' ' + t.sub + ' ' + t.body + ' ' + t.parts.map((p) => p.label).join(' ')).toLowerCase(); return q.toLowerCase().split(/\s+/).filter(Boolean).every((w) => h.includes(w)); };

export default function Atlas({ onExit }: { onExit: () => void }) {
  useFonts();
  const [view, setView] = useState<View>(readView);
  const [q, setQ] = useState('');
  const go = useCallback((v: View) => { setView(v); writeView(v); setQ(''); window.scrollTo(0, 0); }, []);
  useEffect(() => { (window as unknown as { __go?: (id: string) => void }).__go = (id: string) => { (window as unknown as { ready?: boolean }).ready = false; go({ k: 'topic', id }); }; }, [go]);
  const hits = useMemo(() => (q.trim().length > 1 ? TOPICS.filter((t) => match(t, q.trim())).slice(0, 60) : null), [q]);
  return (
    <div className={`ba${view.k === 'topic' ? ' ba--topic' : ''}`}>
      <header className="ba-top">
        <button className="ba-exit" onClick={onExit}>← Exit</button>
        <button className="ba-brand" onClick={() => go({ k: 'home' })}><b>Body Atlas</b><em>How the human body works, in 3D</em></button>
        <label className="ba-search">
          <input type="search" placeholder={`Search ${TOPICS.length} topics…`} value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search topics" />
        </label>
      </header>
      {hits ? <Results hits={hits} go={go} q={q} />
        : view.k === 'home' ? <Home go={go} />
          : view.k === 'ch' ? <ChapterPage id={view.id} go={go} />
            : <TopicView key={view.id} t={BY_ID.get(view.id)!} go={go} />}
    </div>
  );
}

function Card({ t, go }: { t: Topic; go: (v: View) => void }) {
  const c = CHAPTER[t.ch];
  return (
    <button className="ba-card" style={{ ['--c' as string]: c.color }} onClick={() => go({ k: 'topic', id: t.id })}>
      <span className="ba-card-ic" aria-hidden>{c.icon}</span>
      <b>{t.title}</b><em>{t.sub}</em>
      <span className="ba-card-meta">{t.parts.length} parts{t.steps ? ` · ${t.steps.length} steps` : ''}{t.controls?.length ? ' · sliders' : ''}</span>
    </button>
  );
}

function Results({ hits, go, q }: { hits: Topic[]; go: (v: View) => void; q: string }) {
  return (
    <main className="ba-page">
      <h2 className="ba-h2">{hits.length ? `${hits.length}${hits.length === 60 ? '+' : ''} topics for “${q.trim()}”` : `Nothing found for “${q.trim()}”`}</h2>
      <div className="ba-cards">{hits.map((t) => <Card key={t.id} t={t} go={go} />)}</div>
    </main>
  );
}

function Home({ go }: { go: (v: View) => void }) {
  const count = (id: ChapterId) => TOPICS.filter((t) => t.ch === id).length;
  const start = BY_ID.get('body-map') ?? TOPICS[0];
  return (
    <main className="ba-page">
      <section className="ba-hero">
        <div>
          <h1>How the human body works</h1>
          <p>{TOPICS.length} interactive 3D models in {CHAPTERS.length} chapters, from the whole body down to a single strand of DNA: the heart and its valves, the brain, blood and blood vessels, the lungs, the immune system, thirty viruses, cancer, and the cell. Turn every model, zoom in, tap a numbered part to fly to it, step through what happens, and move the sliders to change it.</p>
          <p className="ba-note">Written in plain language from the scientific literature, with PubMed links on every topic for reading further. It is for learning, not medical advice.</p>
          {start && <button className="ba-go" onClick={() => go({ k: 'topic', id: start.id })}>Start with {start.title} →</button>}
        </div>
      </section>
      <div className="ba-chapters">
        {CHAPTERS.map((c) => (
          <button key={c.id} className="ba-ch" style={{ ['--c' as string]: c.color }} onClick={() => go({ k: 'ch', id: c.id })}>
            <span className="ba-ch-ic" aria-hidden>{c.icon}</span>
            <b>{c.title}</b><em>{c.blurb}</em>
            <span className="ba-ch-n">{count(c.id)} models</span>
          </button>
        ))}
      </div>
    </main>
  );
}

function ChapterPage({ id, go }: { id: ChapterId; go: (v: View) => void }) {
  const c = CHAPTER[id], list = TOPICS.filter((t) => t.ch === id);
  const i = CHAPTERS.findIndex((x) => x.id === id), next = CHAPTERS[(i + 1) % CHAPTERS.length];
  return (
    <main className="ba-page" style={{ ['--c' as string]: c.color }}>
      <nav className="ba-crumbs"><button onClick={() => go({ k: 'home' })}>All chapters</button></nav>
      <h2 className="ba-chh"><span aria-hidden>{c.icon}</span>{c.title}</h2>
      <p className="ba-chb">{c.blurb}</p>
      <div className="ba-cards">{list.map((t) => <Card key={t.id} t={t} go={go} />)}</div>
      <button className="ba-next" onClick={() => go({ k: 'ch', id: next.id })}>Next chapter: {next.title} →</button>
    </main>
  );
}

function Missing() {
  return <mesh><icosahedronGeometry args={[1, 2]} /><meshStandardMaterial color="#567" wireframe /></mesh>;
}

// Micro scenes on a tissue floor or membrane frame the cells, not the whole floor.
const MICRO_FIT: Record<string, [number, number, number, number]> = { tissue: [0, -0.4, 0, 2.6], membrane: [0, -0.8, 0, 2.8] };

function TopicView({ t, go }: { t: Topic; go: (v: View) => void }) {
  const c = CHAPTER[t.ch];
  const list = useMemo(() => TOPICS.filter((x) => x.ch === t.ch), [t.ch]);
  const idx = list.findIndex((x) => x.id === t.id);
  const [sel, setSel] = useState<string | null>(null);
  const [stage, setStage] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [labels, setLabels] = useState(true);
  const [spin, setSpin] = useState(!t.p?.still);
  const [reset, setReset] = useState(0);
  const [rail, setRail] = useState(false);
  const [ctl, setCtl] = useState<Record<string, number>>(() => Object.fromEntries((t.controls ?? []).map((k) => [k.id, k.value])));
  const st = useRef(0);
  const anchors = useMemo(() => new Map<string, THREE.Object3D>(), []);
  const stages = t.steps?.length ?? 0;
  useEffect(() => { (window as unknown as { __anchors?: () => string[] }).__anchors = () => [...anchors.keys()]; }, [anchors]);
  useEffect(() => {
    if (!playing || !stages) return;
    const h = setInterval(() => setStage((s) => { if (s + 1 >= stages) { setPlaying(false); return s; } return s + 1; }), 3800);
    return () => clearInterval(h);
  }, [playing, stages]);
  const ctx: SceneCtx = { sel, setSel, stage, stages, st, ctl, parts: t.parts, labels, anchors, playing };
  const Eng = ENGINES[t.kind];
  const step = t.steps?.[stage];
  const play = () => { if (stage >= stages - 1) setStage(0); setPlaying((x) => !x); };
  return (
    <main className={`ba-view${rail ? ' rail-open' : ''}`} style={{ ['--c' as string]: c.color }}>
      <aside className="ba-rail" aria-label={`${c.title} topics`}>
        <div className="ba-rail-top">
          <button className="ba-rail-head" onClick={() => go({ k: 'ch', id: c.id })}><span aria-hidden>{c.icon}</span>{c.title}</button>
          <button className="ba-rail-x ba-only-m" aria-label="Close topic list" onClick={() => setRail(false)}>✕</button>
        </div>
        <ol>{list.map((x) => <li key={x.id}><button className={x.id === t.id ? 'on' : ''} onClick={() => { setRail(false); go({ k: 'topic', id: x.id }); }}>{x.title}</button></li>)}</ol>
      </aside>
      {rail && <div className="ba-scrim" onClick={() => setRail(false)} aria-hidden />}
      <section className="ba-stage">
        <Stage3D ctx={ctx} bg={t.bg} view={t.view} spin={spin && !playing} reset={reset} fit={(t.p?.fit as [number, number, number, number] | undefined) ?? MICRO_FIT[t.kind === 'micro' ? t.bg ?? '' : '']}>
          {Eng ? <Eng p={t.p ?? {}} t={t} /> : <Missing />}
        </Stage3D>
        <div className="ba-tools">
          <button onClick={() => setRail((r) => !r)} className="ba-only-m">☰ Topics</button>
          <button aria-pressed={labels} onClick={() => setLabels((x) => !x)}>Labels</button>
          <button aria-pressed={spin} onClick={() => setSpin((x) => !x)}>Turn</button>
          <button onClick={() => { setSel(null); setReset((x) => x + 1); }}>Reset view</button>
        </div>
        {step && (
          <div className="ba-steps" role="group" aria-label="Steps">
            <div className="ba-step-row">
              <button onClick={() => { setPlaying(false); setStage((s) => Math.max(0, s - 1)); }} disabled={stage === 0} aria-label="Previous step">‹</button>
              <button onClick={play} className="ba-play" aria-label={playing ? 'Pause' : 'Play all steps'}>{playing ? '❚❚' : '▶'}</button>
              <button onClick={() => { setPlaying(false); setStage((s) => Math.min(stages - 1, s + 1)); }} disabled={stage === stages - 1} aria-label="Next step">›</button>
              <div className="ba-dots">{t.steps!.map((s, i) => <button key={i} className={i === stage ? 'on' : i < stage ? 'past' : ''} onClick={() => { setPlaying(false); setStage(i); }} aria-label={`Step ${i + 1}: ${s.label}`} />)}</div>
            </div>
            <b>{stage + 1}. {step.label}</b><p>{step.text}</p>
          </div>
        )}
      </section>
      <article className="ba-panel">
        <nav className="ba-crumbs"><button onClick={() => go({ k: 'home' })}>Atlas</button><span>/</span><button onClick={() => go({ k: 'ch', id: c.id })}>{c.title}</button></nav>
        <h1>{t.title}</h1>
        <p className="ba-sub">{t.sub}</p>
        {t.body.split('\n\n').map((para, i) => <p key={i}>{para}</p>)}
        {t.controls && t.controls.length > 0 && (
          <div className="ba-ctls">
            {t.controls.map((k) => (
              <label key={k.id}><span>{k.label}<b>{(ctl[k.id] ?? k.value).toFixed(k.step && k.step < 1 ? (k.step < 0.1 ? 2 : 1) : 0)}{k.unit ?? ''}</b></span>
                <input type="range" min={k.min} max={k.max} step={k.step ?? 1} value={ctl[k.id] ?? k.value} onChange={(e) => setCtl((o) => ({ ...o, [k.id]: +e.target.value }))} />
              </label>
            ))}
          </div>
        )}
        <h2>Parts</h2>
        <ol className="ba-parts">
          {t.parts.map((p, i) => (
            <li key={p.id} className={sel === p.id ? 'on' : ''}>
              <button onClick={() => setSel(sel === p.id ? null : p.id)}><span>{i + 1}</span><b>{p.label}</b></button>
              {sel === p.id && p.text && <p>{p.text}</p>}
            </li>
          ))}
        </ol>
        {t.facts && t.facts.length > 0 && (<><h2>Worth knowing</h2><ul className="ba-facts">{t.facts.map((f, i) => <li key={i}>{f}</li>)}</ul></>)}
        <h2>Read further</h2>
        <ul className="ba-refs">
          {(t.refs ?? []).map((k) => REFS[k]).filter(Boolean).map((r, i) => (
            <li key={i}>{r.cite} {r.pmid && <a href={`https://pubmed.ncbi.nlm.nih.gov/${r.pmid}/`} target="_blank" rel="noreferrer">PubMed {r.pmid}</a>}{!r.pmid && r.url && <a href={r.url} target="_blank" rel="noreferrer">{r.url.includes('doi.org') ? 'DOI' : 'PubMed'}</a>}</li>
          ))}
          <li><a href={`https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(t.q ?? t.title)}`} target="_blank" rel="noreferrer">Search PubMed for “{t.q ?? t.title}”</a></li>
        </ul>
        <p className="ba-disclaim">For learning only, not medical advice. Models are simplified and not to scale unless stated.</p>
        <div className="ba-pager">
          {idx > 0 && <button onClick={() => go({ k: 'topic', id: list[idx - 1].id })}>‹ {list[idx - 1].title}</button>}
          {idx < list.length - 1 && <button onClick={() => go({ k: 'topic', id: list[idx + 1].id })}>{list[idx + 1].title} ›</button>}
        </div>
      </article>
    </main>
  );
}
