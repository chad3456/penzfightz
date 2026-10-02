import { useEffect, useMemo, useRef, useState } from 'react';
import { BASICS, IDEAS, POINT_LABEL, TAGS, type Idea, type Tag } from './ideas';
import { Mock, Painting, SIZE, type Photos, type Which } from './Mock';

/**
 * HEIRLOOM WALL.
 *
 * Twenty-eight buildable ways to hang three ancestral Nathdwara paintings in
 * a living room, each drawn to scale on a wall, and each with a brief you
 * can hand to a carpenter. Load your own photos and every mockup uses them;
 * the photos never leave the browser tab.
 */

const WHO: { id: Which; name: string; note: string }[] = [
  { id: 'ac', name: 'The acharya', note: 'faces right → hang on the left' },
  { id: 'sh', name: 'Shrinathji', note: 'faces you → the centre' },
  { id: 'kr', name: 'Krishna with the garland', note: 'faces left → hang on the right' },
];

const rupees = (k: number) => (k >= 100 ? `₹${(k / 100).toFixed(k % 100 ? 1 : 0)}L` : `₹${k}k`);
const LEVEL = ['', 'A carpenter, a week', 'A workshop + site visits', 'Specialist artisans'];

function useFonts() {
  useEffect(() => {
    const ls = ['/fonts-sacred/fonts.css', '/fonts-guitar/fonts.css'].map((href) => {
      const l = document.createElement('link');
      l.rel = 'stylesheet'; l.href = href;
      document.head.appendChild(l);
      return l;
    });
    return () => ls.forEach((l) => l.remove());
  }, []);
}

export function HeirloomWall({ onExit }: { onExit: () => void }) {
  useFonts();
  const [photos, setPhotos] = useState<Photos>({});
  const [ev, setEv] = useState(false);
  const [dims, setDims] = useState(false);
  const [filter, setFilter] = useState<Tag | 'all'>('all');
  const [budget, setBudget] = useState(500);
  const [open, setOpen] = useState<Idea | null>(null);
  const [stars, setStars] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('dw-stars') || '[]'); } catch { return []; }
  });
  useEffect(() => { try { localStorage.setItem('dw-stars', JSON.stringify(stars)); } catch { /* private mode */ } }, [stars]);
  const toggleStar = (id: string) => setStars((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const shown = useMemo(() => IDEAS.filter((i) => (filter === 'all' || i.tags.includes(filter)) && i.cost[0] <= budget), [filter, budget]);
  const rootRef = useRef<HTMLDivElement>(null);

  const load = (w: Which, f: File | undefined) => {
    if (!f) return;
    setPhotos((p) => { if (p[w]) URL.revokeObjectURL(p[w]!); return { ...p, [w]: URL.createObjectURL(f) }; });
  };
  useEffect(() => () => Object.values(photos).forEach((u) => u && URL.revokeObjectURL(u)), []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null);
      const i = IDEAS.indexOf(open);
      if (e.key === 'ArrowRight') setOpen(IDEAS[(i + 1) % IDEAS.length]);
      if (e.key === 'ArrowLeft') setOpen(IDEAS[(i - 1 + IDEAS.length) % IDEAS.length]);
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open]);

  return (
    <div className={`dw-root ${open ? 'dw-root--modal' : ''}`} ref={rootRef}>
      <header className="dw-top">
        <button className="dw-ghost" onClick={onExit}>← Shelf</button>
        <span className="dw-brand">Heirloom Wall</span>
        <span className="dw-top-r">{stars.length > 0 && <button className="dw-ghost" onClick={() => document.getElementById('dw-short')?.scrollIntoView({ behavior: 'smooth' })}>★ {stars.length} shortlisted</button>}</span>
      </header>

      <section className="dw-hero">
        <div className="dw-hero-text">
          <p className="dw-kicker">Three paintings from the old house · 28 ways to hang them</p>
          <h1 className="dw-h1">Heirloom Wall</h1>
          <p className="dw-lede">
            Three Nathdwara paintings signed <span lang="hi">अमृतलाल शर्मा नाथद्वारा</span>, with raised gold work and kundan stones. Below are
            twenty-eight ways to give them a wall in a new living room. Each one is drawn to scale and written as a brief: what to build, who
            builds it, how it hangs, how it is lit, how the paintings stay safe, and roughly what it costs.
          </p>
          <p className="dw-note">Add your own photos and every drawing uses them. The photos stay in this browser tab and are never uploaded.</p>
        </div>
        <div className="dw-trio">
          {WHO.map((w) => (
            <label key={w.id} className={`dw-slot dw-slot--${w.id}`}>
              <Painting which={w.id} photo={photos[w.id]} />
              <span className="dw-slot-name">{w.name}</span>
              <span className="dw-slot-note">{w.note}</span>
              <span className="dw-slot-btn">{photos[w.id] ? 'Replace photo' : 'Use my photo'}</span>
              <input type="file" accept="image/*" onChange={(e) => load(w.id, e.target.files?.[0])} />
            </label>
          ))}
        </div>
      </section>

      <section className="dw-gaze">
        <svg viewBox="0 0 600 120" className="dw-gaze-svg" aria-hidden>
          <path d="M150 60 C 210 20, 250 20, 285 48" className="dw-gaze-arrow" />
          <path d="M450 60 C 390 20, 350 20, 315 48" className="dw-gaze-arrow" />
          <circle cx="300" cy="60" r="16" className="dw-gaze-dot" />
          <text x="110" y="100" textAnchor="middle">acharya ▸</text>
          <text x="300" y="100" textAnchor="middle">Shrinathji</text>
          <text x="490" y="100" textAnchor="middle">◂ Krishna</text>
        </svg>
        <p>
          <b>The one rule in every drawing.</b> The acharya looks right and Krishna looks left, holding out his lotus garland. Put them either side of
          Shrinathji and both look in toward the centre, the way devotees face the image at darshan. Swap them and they look away from each other.
        </p>
      </section>

      <div className="dw-ideas">
      <section className="dw-controls" aria-label="View options">
        <div className="dw-seg">
          <button className={!ev ? 'on' : ''} onClick={() => setEv(false)}>☀ Day</button>
          <button className={ev ? 'on' : ''} onClick={() => setEv(true)}>◐ Evening light</button>
        </div>
        <label className="dw-check"><input type="checkbox" checked={dims} onChange={(e) => setDims(e.target.checked)} /> Dimensions</label>
        <div className="dw-chips">
          <button className={filter === 'all' ? 'on' : ''} onClick={() => setFilter('all')}>All {IDEAS.length}</button>
          {TAGS.map((t) => <button key={t.id} className={filter === t.id ? 'on' : ''} onClick={() => setFilter(t.id)}>{t.label}</button>)}
        </div>
        <label className="dw-range">
          <span>Starting cost up to <b>{budget >= 500 ? 'any' : rupees(budget)}</b></span>
          <input type="range" min={10} max={500} step={10} value={budget} onChange={(e) => setBudget(+e.target.value)} />
        </label>
      </section>

      <section className="dw-grid" aria-live="polite">
        {shown.map((idea) => (
          <article key={idea.id} className="dw-card">
            <button className="dw-card-hit" onClick={() => setOpen(idea)} aria-label={`Open ${idea.title}`}>
              <Mock id={idea.id} ev={ev} photos={photos} dims={dims} label={idea.title} />
            </button>
            <div className="dw-card-body">
              <div className="dw-card-head">
                <span className="dw-num">{String(IDEAS.indexOf(idea) + 1).padStart(2, '0')}</span>
                <h3>{idea.title}</h3>
                <button className={`dw-star ${stars.includes(idea.id) ? 'on' : ''}`} onClick={() => toggleStar(idea.id)} aria-label="Shortlist">{stars.includes(idea.id) ? '★' : '☆'}</button>
              </div>
              <p>{idea.hook}</p>
              <div className="dw-meta">
                <span>{rupees(idea.cost[0])}–{rupees(idea.cost[1])}</span>
                <span>{idea.weeks}</span>
                <span>{'●'.repeat(idea.level)}{'○'.repeat(3 - idea.level)} {LEVEL[idea.level]}</span>
              </div>
              <button className="dw-more" onClick={() => setOpen(idea)}>Read the brief →</button>
            </div>
          </article>
        ))}
        {shown.length === 0 && <p className="dw-empty">Nothing matches. Raise the budget or clear the filter.</p>}
      </section>
      </div>

      <section className="dw-basics">
        <h2 className="dw-h2">Before anything goes on the wall</h2>
        <div className="dw-basics-grid">
          {BASICS.map((b, i) => <div key={i} className="dw-basic"><h4>{b.title}</h4><p>{b.body}</p></div>)}
        </div>
      </section>

      <Planner photos={photos} />

      {stars.length > 0 && (
        <section className="dw-short" id="dw-short">
          <h2 className="dw-h2">Your shortlist</h2>
          <p className="dw-sub">Print this page section and hand it to the people quoting. Each brief prints on its own page.</p>
          <button className="dw-btn" onClick={() => window.print()}>Print the briefs</button>
          {IDEAS.filter((i) => stars.includes(i.id)).map((i) => <Brief key={i.id} idea={i} ev={ev} photos={photos} print />)}
        </section>
      )}

      <footer className="dw-foot">
        <p>
          Costs are rough 2026 ballparks for an Indian metro city and change a lot with city, size and maker; get three quotes. Painting sizes are
          assumed (45 × 65 cm, Shrinathji 50 × 68 cm): measure yours and use the planner. For loose kundan stones or flaking paint, ask a paper conservator
          before reframing.
        </p>
      </footer>

      {open && (
        <div className="dw-modal" role="dialog" aria-modal="true" aria-label={open.title} onClick={(e) => { if (e.target === e.currentTarget) setOpen(null); }}>
          <div className="dw-sheet">
            <div className="dw-sheet-bar">
              <button className="dw-ghost" onClick={() => setOpen(IDEAS[(IDEAS.indexOf(open) - 1 + IDEAS.length) % IDEAS.length])}>←</button>
              <span>{IDEAS.indexOf(open) + 1} / {IDEAS.length}</span>
              <button className="dw-ghost" onClick={() => setOpen(IDEAS[(IDEAS.indexOf(open) + 1) % IDEAS.length])}>→</button>
              <span className="dw-sheet-sp" />
              <button className={`dw-star ${stars.includes(open.id) ? 'on' : ''}`} onClick={() => toggleStar(open.id)}>{stars.includes(open.id) ? '★ Shortlisted' : '☆ Shortlist'}</button>
              <button className="dw-ghost" onClick={() => setOpen(null)} aria-label="Close">✕</button>
            </div>
            <Brief idea={open} ev={ev} photos={photos} onEv={setEv} dims={dims} onDims={setDims} />
          </div>
        </div>
      )}
    </div>
  );
}

function Brief({ idea, ev, photos, onEv, dims, onDims, print }: { idea: Idea; ev: boolean; photos: Photos; onEv?: (v: boolean) => void; dims?: boolean; onDims?: (v: boolean) => void; print?: boolean }) {
  return (
    <article className={`dw-brief ${print ? 'dw-brief--print' : ''}`}>
      <div className="dw-brief-art">
        <Mock id={idea.id} ev={ev} photos={photos} dims={dims ?? true} label={idea.title} />
        {onEv && (
          <div className="dw-brief-tools">
            <div className="dw-seg">
              <button className={!ev ? 'on' : ''} onClick={() => onEv(false)}>☀ Day</button>
              <button className={ev ? 'on' : ''} onClick={() => onEv(true)}>◐ Evening</button>
            </div>
            {onDims && <label className="dw-check"><input type="checkbox" checked={!!dims} onChange={(e) => onDims(e.target.checked)} /> Dimensions</label>}
          </div>
        )}
      </div>
      <div className="dw-brief-text">
        <p className="dw-kicker">Idea {String(IDEAS.indexOf(idea) + 1).padStart(2, '0')} · {idea.tags.map((t) => TAGS.find((x) => x.id === t)?.label).join(' · ')}</p>
        <h2 className="dw-h2">{idea.title}</h2>
        <p className="dw-brief-hook">{idea.hook}</p>
        <div className="dw-facts">
          <div><span>Ballpark</span><b>{rupees(idea.cost[0])}–{rupees(idea.cost[1])}</b></div>
          <div><span>Time</span><b>{idea.weeks}</b></div>
          <div><span>Wall needed</span><b>{idea.wall ? `${idea.wall} cm+` : 'freestanding'}</b></div>
          <div><span>Skill</span><b>{LEVEL[idea.level]}</b></div>
        </div>
        <ol className="dw-points">
          {idea.points.map((p, i) => (
            <li key={i}><span className="dw-pk">{POINT_LABEL[p.k]}</span><span>{p.v}</span></li>
          ))}
        </ol>
      </div>
    </article>
  );
}

/* ───────────── planner: where exactly to drill ───────────── */

function Planner({ photos }: { photos: Photos }) {
  const [wall, setWall] = useState(360);
  const [sofa, setSofa] = useState(220);
  const [sofaH, setSofaH] = useState(85);
  const [centre, setCentre] = useState(150);
  const [gap, setGap] = useState(8);
  const [frame, setFrame] = useState(4);
  const [drop, setDrop] = useState(8);
  const [size, setSize] = useState<Record<Which, [number, number]>>({ ac: [...SIZE.ac], sh: [...SIZE.sh], kr: [...SIZE.kr] });

  const outer = (w: Which): [number, number] => [size[w][0] + 2 * frame, size[w][1] + 2 * frame];
  const total = outer('ac')[0] + outer('sh')[0] + outer('kr')[0] + 2 * gap;
  const left0 = (wall - total) / 2;
  const pos = (['ac', 'sh', 'kr'] as Which[]).reduce<{ w: Which; x: number; top: number; bottom: number; hook: number; ow: number; oh: number }[]>((acc, w) => {
    const [ow, oh] = outer(w);
    const x = acc.length ? acc[acc.length - 1].x + acc[acc.length - 1].ow + gap : left0;
    const top = centre + oh / 2;
    acc.push({ w, x, top, bottom: centre - oh / 2, hook: top - drop, ow, oh });
    return acc;
  }, []);
  const lowest = Math.min(...pos.map((p) => p.bottom));
  const warn: string[] = [];
  if (lowest - sofaH < 18) warn.push(`Only ${Math.round(lowest - sofaH)} cm between sofa back and frames. Raise the centre to about ${Math.ceil(sofaH + 22 + Math.max(...pos.map((p) => p.oh)) / 2)} cm.`);
  if (total > sofa * 0.8) warn.push(`The group (${Math.round(total)} cm) is ${Math.round((total / sofa) * 100)}% of the sofa width. 60–75% usually looks settled; reduce gaps or frame width.`);
  if (total < sofa * 0.5) warn.push(`The group is only ${Math.round((total / sofa) * 100)}% of the sofa width. Wider gaps, deeper frames or a backdrop (ideas 2, 5, 11) will hold the wall better.`);
  if (left0 < 20) warn.push('The group is nearly as wide as the wall. Check light switches and corners.');

  const S = 1000 / Math.max(wall, 200), H = 290 * S;
  const X = (cmv: number) => cmv * S, Y = (cmv: number) => H - cmv * S;
  const num = (v: number, set: (n: number) => void, min: number, max: number, label: string, unit = 'cm') => (
    <label className="dw-field"><span>{label}</span><span className="dw-field-in"><input type="number" value={v} min={min} max={max} onChange={(e) => set(Math.max(min, Math.min(max, +e.target.value || 0)))} /> {unit}</span></label>
  );

  return (
    <section className="dw-planner">
      <h2 className="dw-h2">Planner: where to drill</h2>
      <p className="dw-sub">Enter your wall, sofa and the paintings' real sizes (on their mounts). The drawing and the drill points update as you type. Measurements are from the left corner and from the finished floor.</p>
      <div className="dw-plan">
        <div className="dw-plan-in">
          {num(wall, setWall, 150, 800, 'Wall width')}
          {num(sofa, setSofa, 0, 400, 'Sofa width')}
          {num(sofaH, setSofaH, 0, 120, 'Sofa back height')}
          {num(centre, setCentre, 110, 190, 'Centre line height')}
          {num(gap, setGap, 0, 60, 'Gap between frames')}
          {num(frame, setFrame, 0, 20, 'Frame width (each side)')}
          {num(drop, setDrop, 0, 30, 'Hanger below frame top')}
          {(['ac', 'sh', 'kr'] as Which[]).map((w) => (
            <div key={w} className="dw-field dw-field--pair">
              <span>{WHO.find((x) => x.id === w)!.name} (w × h)</span>
              <span className="dw-field-in">
                <input type="number" value={size[w][0]} min={10} max={200} onChange={(e) => setSize((s) => ({ ...s, [w]: [+e.target.value || 10, s[w][1]] }))} /> ×
                <input type="number" value={size[w][1]} min={10} max={200} onChange={(e) => setSize((s) => ({ ...s, [w]: [s[w][0], +e.target.value || 10] }))} /> cm
              </span>
            </div>
          ))}
        </div>
        <div className="dw-plan-out">
          <svg viewBox={`-20 -30 ${X(wall) + 40} ${H + 60}`} className="dw-plan-svg">
            <rect x="0" y="0" width={X(wall)} height={H} className="dw-p-wall" />
            {sofa > 0 && <rect x={X((wall - sofa) / 2)} y={Y(sofaH)} width={X(sofa)} height={X(sofaH)} rx="6" className="dw-p-sofa" />}
            <line x1="0" x2={X(wall)} y1={Y(centre)} y2={Y(centre)} className="dw-p-centre" />
            <text x={X(wall) - 4} y={Y(centre) - 5} textAnchor="end" className="dw-p-t">centre {centre} cm</text>
            {pos.map((p) => (
              <g key={p.w}>
                <rect x={X(p.x)} y={Y(p.top)} width={X(p.ow)} height={X(p.oh)} className="dw-p-frame" />
                <svg x={X(p.x + frame)} y={Y(p.top - frame)} width={X(size[p.w][0])} height={X(size[p.w][1])} viewBox={`0 0 100 ${p.w === 'sh' ? 136 : 144}`} preserveAspectRatio="none">
                  {photos[p.w] ? <image href={photos[p.w]} width="100" height={p.w === 'sh' ? 136 : 144} preserveAspectRatio="xMidYMid slice" /> : <rect width="100" height="144" className="dw-p-art" />}
                </svg>
                <circle cx={X(p.x + p.ow * 0.25)} cy={Y(p.hook)} r="5" className="dw-p-hook" />
                <circle cx={X(p.x + p.ow * 0.75)} cy={Y(p.hook)} r="5" className="dw-p-hook" />
              </g>
            ))}
            <line x1="0" x2={X(wall)} y1={H} y2={H} className="dw-p-floor" />
          </svg>
          <table className="dw-plan-table">
            <thead><tr><th>Painting</th><th>Left edge</th><th>Top edge</th><th>Two hooks at</th><th>Hook height</th></tr></thead>
            <tbody>
              {pos.map((p) => (
                <tr key={p.w}>
                  <td>{WHO.find((x) => x.id === p.w)!.name}</td>
                  <td>{p.x.toFixed(1)} cm</td>
                  <td>{p.top.toFixed(1)} cm</td>
                  <td>{(p.x + p.ow * 0.25).toFixed(1)} & {(p.x + p.ow * 0.75).toFixed(1)} cm</td>
                  <td>{p.hook.toFixed(1)} cm</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="dw-sub">Group width {total.toFixed(0)} cm{sofa > 0 ? ` (${Math.round((total / sofa) * 100)}% of the sofa)` : ''}. Two hooks per painting at a quarter in from each side stop it tilting. Measure the hanger drop on the back of each frame: string or D-ring taut, to the top edge.</p>
          {warn.map((w, i) => <p key={i} className="dw-warn">⚠ {w}</p>)}
        </div>
      </div>
    </section>
  );
}
