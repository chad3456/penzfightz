import { useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react';
import { geoEqualEarth, geoPath, type GeoProjection } from 'd3-geo';
import { feature } from 'topojson-client';
import type { Feature, FeatureCollection, Geometry } from 'geojson';
import type { GeometryCollection, Topology } from 'topojson-specification';
import worldUrl from 'world-atlas/countries-110m.json?url';
import { CostLab, DrawLab, Insights, Lab, QuizLab, ShipsLab } from './Labs';
import { METRO_INSIGHTS, PORT_INSIGHTS, ROAD_INSIGHTS } from './deep';
import {
  CHINA_URBAN_RAIL, CN_EXPRESSWAY, CN_EXP_CHECKED, CPPI_2023, EARTH_KM, INDIA_METRO, IN_EXPRESSWAY, IN_NH, METROS, PORTS, SOURCES, US_INTERSTATE, fmt,
  type Nation, type Port,
} from './data';

/**
 * The Great Build: a scrolling story about twenty years of ports, metros and
 * expressways. Each chapter pins one graphic while its steps scroll past; the
 * graphic re-draws itself for the step in the middle of the screen.
 */

const NATION: Record<Nation, { label: string; cls: string }> = {
  CN: { label: 'China', cls: 'cn' }, US: { label: 'United States', cls: 'us' }, IN: { label: 'India', cls: 'in' }, other: { label: 'Elsewhere', cls: 'ot' },
};

/* ───────────── plumbing ───────────── */

function useSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [s, setS] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const ro = new ResizeObserver(() => setS({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el); setS({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);
  return [ref, s] as const;
}

/** Which step card is crossing the middle of the scroller. */
function useActiveStep(root: RefObject<HTMLElement | null>, box: RefObject<HTMLElement | null>) {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const el = box.current; if (!el) return;
    const io = new IntersectionObserver((es) => {
      for (const e of es) if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.i));
    }, { root: root.current, rootMargin: '-48% 0px -48% 0px' });
    el.querySelectorAll('.gb-step').forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [root, box]);
  return active;
}

/** Counts up to a number the first time it is on screen. */
function Count({ to, dur = 1600, suffix = '', decimals = 0 }: { to: number; dur?: number; suffix?: string; decimals?: number }) {
  const [v, setV] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e?.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const tick = (t: number) => { const k = Math.min(1, (t - t0) / dur); setV(to * (1 - Math.pow(1 - k, 3))); if (k < 1) raf = requestAnimationFrame(tick); };
      raf = requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [to, dur]);
  return <span ref={ref}>{v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}</span>;
}

function useWorld() {
  const [w, setW] = useState<Feature<Geometry>[] | null>(null);
  useEffect(() => {
    let live = true;
    void fetch(worldUrl).then((r) => r.json()).then((j: unknown) => {
      const topo = j as Topology<{ countries: GeometryCollection }>;
      const fc = feature(topo, topo.objects.countries) as FeatureCollection<Geometry>;
      if (live) setW(fc.features.filter((f) => f.id !== '010'));
    });
    return () => { live = false; };
  }, []);
  return w;
}

function Chapter({ root, n, kicker, title, steps, graphic }: { root: RefObject<HTMLElement | null>; n: string; kicker: string; title: ReactNode; steps: ReactNode[]; graphic: (step: number, w: number, h: number) => ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const active = useActiveStep(root, box);
  const [gref, size] = useSize<HTMLDivElement>();
  return (
    <section className="gb-chapter" ref={box}>
      <header className="gb-ch-head">
        <span className="gb-ch-n">{n}</span>
        <p className="gb-kicker">{kicker}</p>
        <h2 className="gb-ch-title">{title}</h2>
      </header>
      <div className="gb-scrolly">
        <div className="gb-sticky">
          <div className="gb-graphic" ref={gref}>{size.w > 0 && graphic(active, size.w, size.h)}</div>
          <div className="gb-dots" aria-hidden>{steps.map((_, i) => <i key={i} className={i === active ? 'is-on' : ''} />)}</div>
        </div>
        <div className="gb-steps">
          {steps.map((s, i) => <div key={i} className={`gb-step ${i === active ? 'is-on' : ''}`} data-i={i}><div className="gb-card">{s}</div></div>)}
        </div>
      </div>
    </section>
  );
}

const Hollow = () => <span className="gb-unchecked" title="From the standard series; not re-checked for this page">○</span>;

/* ───────────── the page ───────────── */

export function GreatBuild({ onExit }: { onExit: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = '/fonts-airstrip/fonts.css';
    document.head.appendChild(l);
    return () => l.remove();
  }, []);
  useEffect(() => {
    const el = root.current; if (!el) return;
    const on = () => setProgress(el.scrollTop / Math.max(1, el.scrollHeight - el.clientHeight));
    el.addEventListener('scroll', on, { passive: true });
    return () => el.removeEventListener('scroll', on);
  }, []);
  const world = useWorld();
  const addedCn = CN_EXPRESSWAY[CN_EXPRESSWAY.length - 1]![1] - CN_EXPRESSWAY[0]![1];

  return (
    <div className="gb-root" ref={root}>
      <div className="gb-progress" style={{ transform: `scaleX(${progress})` }} />
      <nav className="gb-top">
        <button className="gb-back" onClick={onExit}>← Shelf</button>
        <span className="gb-top-t">The Great Build</span>
        <span className="gb-top-ch">
          <a href="#gb-ports" onClick={(e) => { e.preventDefault(); document.getElementById('gb-ports')?.scrollIntoView({ behavior: 'smooth' }); }}>Ports</a>
          <a href="#gb-metro" onClick={(e) => { e.preventDefault(); document.getElementById('gb-metro')?.scrollIntoView({ behavior: 'smooth' }); }}>Metros</a>
          <a href="#gb-roads" onClick={(e) => { e.preventDefault(); document.getElementById('gb-roads')?.scrollIntoView({ behavior: 'smooth' }); }}>Expressways</a>
        </span>
      </nav>

      <header className="gb-hero">
        <p className="gb-kicker">A visual story · 2004 → 2024</p>
        <h1 className="gb-h1">The Great <span>Build</span></h1>
        <p className="gb-lede">
          In twenty years, a handful of countries rebuilt how the world moves: the ports its boxes pass through, the subways under its cities,
          the motorways between them. Here is where the building happened, and how fast.
        </p>
        <HeroScene />
        <div className="gb-hero-tiles">
          <div className="gb-hero-tile"><b><Count to={51.5} decimals={1} suffix=" M" /></b><span>containers (TEU) through Shanghai in 2024, up from 14.6 M in 2004</span></div>
          <div className="gb-hero-tile"><b><Count to={CHINA_URBAN_RAIL.km24} suffix=" km" /></b><span>of urban rail in {CHINA_URBAN_RAIL.cities} Chinese cities at the end of 2024</span></div>
          <div className="gb-hero-tile"><b>+<Count to={addedCn} suffix=" km" /></b><span>of Chinese expressway since 2004, enough to go round the Earth {(addedCn / EARTH_KM).toFixed(1)} times</span></div>
        </div>
        <p className="gb-scrollcue">Scroll <span aria-hidden>↓</span></p>
      </header>

      <div id="gb-ports">
        <Chapter
          root={root} n="01" kicker="Ports" title={<>The box moved <em>east</em></>}
          steps={[
            <><h3>2004</h3><p>The busiest container port on Earth was <b>Hong Kong</b>: about <b>22 million TEU</b>, one twenty-foot box each. Singapore was a close second, and <b>Shanghai</b> third at 14.6 million.</p><p className="gb-note">Circle area ∝ containers handled that year.</p></>,
            <><h3>2024</h3><p>Every port grew, but not equally. <b>Shanghai</b> now handles <b>51.5 million TEU</b>, three and a half times its 2004 figure, and more than any port has ever handled.</p><p><b>Ningbo-Zhoushan</b> went from 4 million to 39 million.</p></>,
            <><h3>Six of the ten busiest</h3><p>…are in <span className="gb-k gb-k--cn">mainland China</span>: Shanghai, Ningbo-Zhoushan, Shenzhen, Qingdao, Guangzhou and Tianjin. Singapore, Busan, Jebel Ali and Port Klang complete the ten.</p><p>The busiest US port, <span className="gb-k gb-k--us">Los Angeles</span>, handles about a fifth of Shanghai&rsquo;s volume.</p></>,
            <><h3>One went the other way</h3><p><b>Hong Kong</b> is the only big port here that shrank: from 22 million TEU to <b>13.7 million</b> in 2024, its lowest since 1996. Its trade now leaves from Shenzhen and Guangzhou, a few kilometres upriver.</p></>,
            <><h3>Biggest isn&rsquo;t best</h3><p>The World Bank&rsquo;s Container Port Performance Index ranks ports by how fast they turn ships around. In 2023 the top five were <b>Yangshan</b> (Shanghai&rsquo;s deep-water terminal), <b>Salalah</b> in Oman, <b>Cartagena</b> in Colombia, <b>Tanger Med</b> in Morocco and <b>Tanjung Pelepas</b> in Malaysia.</p><p>Only one of the five is also among the busiest.</p></>,
          ]}
          graphic={(step, w, h) => <PortsGraphic step={step} w={w} h={h} world={world} />}
        />
      </div>
      <Lab n="01+" title="Wider, not longer" sub="The record ship of each era, drawn to scale. Scrub through the years, then open the cards for what the headline numbers leave out.">
        <ShipsLab />
        <Insights items={PORT_INSIGHTS} />
      </Lab>

      <div id="gb-metro">
        <Chapter
          root={root} n="02" kicker="Metros" title={<>Eighteen new lines in <em>a year</em></>}
          steps={[
            <><h3>2004</h3><p><span className="gb-k gb-k--cn">Beijing</span> had four subway lines and <b>114 km</b> of track. <span className="gb-k gb-k--us">New York</span> and London each had about 400 km, most of it dug before 1940.</p><p className="gb-note">Each dot is a station every 50 km of line.</p></>,
            <><h3>2024</h3><p>Beijing&rsquo;s subway is now <b>909 km</b> long, the longest metro in the world, eight times what it was.</p><p>New York added <b>5 km</b> in the same twenty years: the 7 line to Hudson Yards and three stations of the Second Avenue Subway. London added 3.</p></>,
            <><h3>Brand-new metros</h3><p><span className="gb-k gb-k--in">Delhi</span> opened its first line in 2002; it now runs <b>374 km</b>. <b>Dubai</b> opened in 2009, and <b>Riyadh</b> opened six driverless lines, <b>176 km</b>, in a few months from December 2024.</p></>,
            <><h3>Every square is 50 km</h3><p>Across <b>{CHINA_URBAN_RAIL.cities} Chinese cities</b>, urban rail reached <b>{fmt(CHINA_URBAN_RAIL.km24)} km</b> at the end of 2024. In 2024 alone, 18 new lines and {fmt(CHINA_URBAN_RAIL.added24)} km opened.</p><p><span className="gb-k gb-k--in">India</span> tripled its metros in a decade, from {INDIA_METRO.km14} km in 2014 to about {fmt(INDIA_METRO.km25)} km. That already makes it the third-largest network after China and the US.</p></>,
          ]}
          graphic={(step, w, h) => <MetroGraphic step={step} w={w} h={h} />}
        />
      </div>
      <Lab n="02+" title="What does a kilometre buy?" sub="Pick a budget. Each line shows how much metro it buys at that city's cost per kilometre; each dot is a station every 2 km.">
        <CostLab />
        <Insights items={METRO_INSIGHTS} />
      </Lab>

      <div id="gb-roads">
        <Chapter
          root={root} n="03" kicker="Expressways" title={<>Round the world, <em>four times</em></>}
          steps={[
            <><h3>2004</h3><p><span className="gb-k gb-k--cn">China</span> had <b>34,300 km</b> of expressway. The <span className="gb-k gb-k--us">US Interstate</span> system, finished in the 1990s, had about <b>75,000 km</b>.</p></>,
            <><h3>2011</h3><p>China passed the Interstate. Since 2004 it has added an average of <b>7,800 km a year</b>: a whole Interstate system&rsquo;s worth in under ten years.</p></>,
            <><h3>2024</h3><p><b>190,700 km</b>, about half of all the expressway on Earth. The Interstate grew by a few thousand kilometres over the same twenty years.</p></>,
            <><h3>{(addedCn / EARTH_KM).toFixed(1)} times round the planet</h3><p>The <b>{fmt(addedCn)} km</b> China added since 2004, laid end to end, would wrap round the equator {(addedCn / EARTH_KM).toFixed(1)} times.</p></>,
            <><h3>India is next</h3><p><span className="gb-k gb-k--in">India</span> had under 200 km of access-controlled expressway in 2004. It had <b>{fmt(IN_EXPRESSWAY[1]![1])} km</b> by 2026, with another 11,000 km under construction.</p><p>Its national highways grew from {fmt(IN_NH.km14)} km in 2014 to {fmt(IN_NH.km24)} km in 2024, though about 50,000 km of that was existing state roads renamed as national highways (see the small print below).</p></>,
          ]}
          graphic={(step, w, h) => <RoadGraphic step={step} w={w} h={h} />}
        />
      </div>
      <Lab n="03+" title="Draw it before you see it" sub="Draw your guess of the curve first, then compare it with the real one. The gap between the two is the point of the chapter.">
        <DrawLab />
        <Insights items={ROAD_INSIGHTS} />
      </Lab>
      <Lab n="??" title="Guess first" sub="Four numbers from the research behind this story. Slide to your guess, lock it in, see how far off you were.">
        <QuizLab />
      </Lab>

      <section className="gb-outro">
        <h2 className="gb-ch-title">The ledger</h2>
        <p className="gb-lede">Every number in the story, where it comes from, and how sure we are of it. <Hollow /> marks a figure from a standard series (port tables, the Ministry of Transport bulletins, FHWA) that was not re-checked for this page.</p>
        <Ledger />
        <h3 className="gb-h3">Sources</h3>
        <ol className="gb-srcs">{SOURCES.map((s) => <li key={s.id}><a href={s.url} target="_blank" rel="noreferrer">{s.title}</a></li>)}</ol>
        <p className="gb-foot">A TEU is a twenty-foot equivalent unit, one standard small container. Metro lengths are route length. Chinese &ldquo;urban rail&rdquo; includes light rail and a few tram and maglev lines. Expressways are access-controlled, divided motorways. Map: Natural Earth via world-atlas.</p>
      </section>
    </div>
  );
}

/* ───────────── hero scene ───────────── */

function HeroScene() {
  const road = 'M-20 190 C 120 190, 180 120, 320 120 S 520 170, 640 150 S 820 90, 940 110';
  const metro = 'M-20 70 H 260 L 300 40 H 560 L 600 70 H 940';
  return (
    <svg className="gb-scene" viewBox="0 0 920 230" preserveAspectRatio="xMidYMid slice" role="img" aria-label="A port crane, a metro line and an expressway">
      {/* sea and the crane */}
      <rect x="690" y="200" width="240" height="40" className="gb-sea" />
      <g className="gb-crane" transform="translate(760 40)">
        <path d="M0 160 V20 M40 160 V20 M-6 20 H130 M40 20 L 90 0 M0 60 H40 M0 110 H40" />
        <g className="gb-hook"><line x1="110" y1="20" x2="110" y2="80" /><rect x="96" y="80" width="28" height="14" className="gb-box gb-box--cn" /></g>
      </g>
      <g transform="translate(700 176)">
        <path d="M0 24 H200 L186 40 H14 Z" className="gb-ship" />
        {[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={20 + i * 27} y={i % 2 ? 4 : 10} width="24" height={i % 2 ? 20 : 14} className={`gb-box ${i % 3 === 0 ? 'gb-box--cn' : i % 3 === 1 ? 'gb-box--us' : 'gb-box--in'}`} />)}
      </g>
      {/* metro */}
      <path d={metro} className="gb-metro-line" />
      {[40, 150, 260, 380, 480, 560, 690, 800].map((x, i) => <circle key={i} cx={x} cy={x > 300 && x < 560 ? 40 : 70} r="5" className="gb-station" />)}
      <g className="gb-train"><rect x="-44" y="-7" width="44" height="14" rx="5" /><animateMotion dur="7s" repeatCount="indefinite" path={metro} /></g>
      {/* expressway */}
      <path d={road} className="gb-road" />
      <path d={road} className="gb-road-mark" />
      {[0, 1.3, 2.6, 3.9, 5.2].map((d, i) => <circle key={i} r="3.5" className={`gb-car gb-car--${i % 3}`}><animateMotion dur="6.5s" begin={`${-d}s`} repeatCount="indefinite" path={road} /></circle>)}
    </svg>
  );
}

/* ───────────── chapter 1: ports ───────────── */

const clampN = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

/** Push overlapping circles apart, with a spring back to where they belong. */
function relax<T extends { x: number; y: number; ax: number; ay: number; r: number }>(nodes: T[], w: number, h: number): T[] {
  for (let it = 0; it < 240; it++) {
    for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i]!, b = nodes[j]!;
      const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 0.01, min = a.r + b.r + 2;
      if (d < min) { const k = (min - d) / d / 2; a.x -= dx * k; a.y -= dy * k; b.x += dx * k; b.y += dy * k; }
    }
    for (const n of nodes) { n.x += (n.ax - n.x) * 0.02; n.y += (n.ay - n.y) * 0.02; n.x = clampN(n.x, n.r + 2, w - n.r - 2); n.y = clampN(n.y, n.r + 2, h - n.r - 2); }
  }
  return nodes;
}

const label = (p: Port) => (p.name.length > 9 ? p.short ?? p.name : p.name);
const fits = (p: Port, r: number) => label(p).length * 6.6 < 2 * r - 6 && r >= 17;

function PortsGraphic({ step, w, h, world }: { step: number; w: number; h: number; world: Feature<Geometry>[] | null }) {
  const [hover, setHover] = useState<{ p: Port; x: number; y: number } | null>(null);
  const proj = useMemo<GeoProjection>(() => {
    // centred east of Greenwich so the crowded East Asian coast has room on the right
    const p = geoEqualEarth().rotate([-48, 0]);
    // tall, narrow screens: frame Europe to Japan, where nearly all the ports are
    const box: [number, number][] = w / h < 1 ? [[-5, -8], [145, -8], [-5, 55], [145, 55]] : [[-126, -10], [168, -10], [-126, 57], [168, 57]];
    p.fitExtent([[16, 16], [w - 16, h - 40]], { type: 'MultiPoint', coordinates: box });
    return p;
  }, [w, h]);
  const land = useMemo(() => (world ? geoPath(proj)({ type: 'FeatureCollection', features: world } as FeatureCollection) ?? '' : ''), [world, proj]);
  const year = step === 0 ? 't04' : 't24';
  const k = Math.min(w, h * 1.6) / 1000 * 6.2;
  const nodes = useMemo(() => {
    const ns = PORTS.map((p) => { const [x, y] = proj([p.lon, p.lat]) ?? [0, 0]; return { p, x, y, ax: x, ay: y, r: Math.sqrt(p[year]) * k }; });
    return relax(ns.sort((a, b) => b.r - a.r), w, h);
  }, [proj, year, k, w, h]);
  const slope = step === 3;
  const cppi = step === 4;
  const colour = step >= 2;
  const focus = step === 0 ? new Set(['hongkong', 'singapore', 'shanghai']) : step === 1 ? new Set(['shanghai', 'ningbo']) : step === 3 ? new Set(['hongkong']) : null;

  return (
    <div className="gb-fig">
      <svg width={w} height={h} className="gb-svg" role="img" aria-label="Container ports sized by containers handled">
        <g className={`gb-layer ${slope ? 'is-off' : ''}`}>
          <path d={land} className="gb-land" />
          {nodes.map(({ p, x, y, ax, ay, r }) => {
            const on = focus?.has(p.id);
            const dim = cppi || (focus && !on && step < 2);
            return (
              <g key={p.id} className={`gb-port ${dim ? 'is-dim' : ''}`} onPointerEnter={() => setHover({ p, x, y })} onPointerLeave={() => setHover(null)}>
                {Math.hypot(x - ax, y - ay) > r * 0.6 && <><line x1={ax} y1={ay} x2={x} y2={y} className="gb-leader" /><circle cx={ax} cy={ay} r="2" className="gb-anchor" /></>}
                <g className="gb-move" style={{ transform: `translate(${x}px, ${y}px)` }}>
                  <circle r="1" className={`gb-bubble gb-f--${colour ? NATION[p.nation].cls : 'ot'} ${on ? 'is-on' : ''}`} style={{ transform: `scale(${r})` }} />
                  {fits(p, r) && !dim && <text className="gb-bub-t" y={-2} textAnchor="middle">{label(p)}</text>}
                  {fits(p, r) && !dim && <text className="gb-bub-v" y={12} textAnchor="middle">{p[year].toFixed(1)}M</text>}
                  {!fits(p, r) && on && (() => {
                    const t = `${p.name} ${p[year].toFixed(1)}M`, flip = x + r + t.length * 7.9 > w - 24;
                    return <text className="gb-lab" x={flip ? -r - 6 : r + 6} y={4} textAnchor={flip ? 'end' : 'start'}>{t}</text>;
                  })()}
                </g>
              </g>
            );
          })}
          {cppi && CPPI_2023.map((c) => {
            const [x, y] = proj([c.lon, c.lat]) ?? [0, 0];
            const left = x > w * 0.7;
            return (
              <g key={c.rank} transform={`translate(${x} ${y})`} className="gb-cppi">
                <circle r="13" /><text y="4.5" textAnchor="middle" className="gb-cppi-n">{c.rank}</text>
                <text x={left ? -19 : 19} y={-2} textAnchor={left ? 'end' : 'start'} className="gb-lab">{c.name}</text>
                <text x={left ? -19 : 19} y={12} textAnchor={left ? 'end' : 'start'} className="gb-lab gb-lab--s">{c.country}</text>
              </g>
            );
          })}
        </g>
        <g className={`gb-layer ${slope ? '' : 'is-off'}`}><PortSlope w={w} h={h} /></g>
      </svg>
      {!slope && !cppi && (
        <div className="gb-legend">
          <span className="gb-leg-y">{step === 0 ? '2004' : '2024'}</span>
          {colour && <><span className="gb-k gb-k--cn">mainland China</span><span className="gb-k gb-k--us">USA</span><span className="gb-k gb-k--ot">elsewhere</span></>}
        </div>
      )}
      {cppi && <div className="gb-legend"><span className="gb-leg-y">CPPI 2023</span><span>ranked by ship turnaround, not size</span></div>}
      {hover && !slope && (
        <div className="gb-tip" style={{ left: Math.min(hover.x + 14, w - 220), top: Math.max(8, hover.y - 70) }}>
          <b>{hover.p.name}</b><span>{hover.p.country}</span>
          <span>2004: {hover.p.t04.toFixed(1)} M TEU {!hover.p.ok04 && <Hollow />}</span>
          <span>2024: {hover.p.t24.toFixed(1)} M TEU {!hover.p.ok24 && <Hollow />}</span>
        </div>
      )}
    </div>
  );
}

function PortSlope({ w, h }: { w: number; h: number }) {
  const pad = { l: Math.min(150, w * 0.28), r: Math.min(170, w * 0.32), t: 40, b: 36 };
  const x0 = pad.l, x1 = w - pad.r;
  const y = (v: number) => h - pad.b - (v / 55) * (h - pad.t - pad.b);
  // spread right-hand labels so none overlap
  const right = [...PORTS].sort((a, b) => b.t24 - a.t24).map((p) => ({ p, y: y(p.t24) }));
  for (let i = 1; i < right.length; i++) right[i]!.y = Math.max(right[i]!.y, right[i - 1]!.y + 13);
  const left = PORTS.filter((p) => p.t04 >= 11).sort((a, b) => b.t04 - a.t04).map((p) => ({ p, y: y(p.t04) }));
  for (let i = 1; i < left.length; i++) left[i]!.y = Math.max(left[i]!.y, left[i - 1]!.y + 13);
  return (
    <g>
      {[0, 10, 20, 30, 40, 50].map((v) => <g key={v}><line x1={x0} x2={x1} y1={y(v)} y2={y(v)} className="gb-grid" /><text x={x0 - 8} y={y(v) + 4} textAnchor="end" className="gb-axis">{v}M</text></g>)}
      <text x={x0} y={pad.t - 16} textAnchor="middle" className="gb-axis gb-axis--y">2004</text>
      <text x={x1} y={pad.t - 16} textAnchor="middle" className="gb-axis gb-axis--y">2024</text>
      {PORTS.map((p) => {
        const hk = p.id === 'hongkong';
        return (
          <g key={p.id} className={hk ? 'gb-slope-hk' : 'gb-slope'}>
            <line x1={x0} x2={x1} y1={y(p.t04)} y2={y(p.t24)} className={`gb-s gb-s--${NATION[p.nation].cls}`} />
            <circle cx={x0} cy={y(p.t04)} r={hk ? 5 : 3.5} className={`gb-sdot gb-f--${NATION[p.nation].cls}`} />
            <circle cx={x1} cy={y(p.t24)} r={hk ? 5 : 3.5} className={`gb-sdot gb-f--${NATION[p.nation].cls}`} />
          </g>
        );
      })}
      {right.map(({ p, y: ly }) => <text key={p.id} x={x1 + 10} y={ly + 4} className={`gb-lab gb-lab--s ${p.id === 'hongkong' ? 'is-hk' : ''}`}>{p.name} {p.t24.toFixed(1)}</text>)}
      {left.map(({ p, y: ly }) => <text key={p.id} x={x0 - 44} y={ly + 4} textAnchor="end" className={`gb-lab gb-lab--s ${p.id === 'hongkong' ? 'is-hk' : ''}`}>{p.name} {p.t04.toFixed(1)}</text>)}
    </g>
  );
}

/* ───────────── chapter 2: metros ───────────── */

function MetroGraphic({ step, w, h }: { step: number; w: number; h: number }) {
  if (step === 3) return <MetroWaffle w={w} h={h} />;
  const rows = METROS.filter((m) => (step < 2 ? ['beijing', 'newyork', 'london'].includes(m.id) : true));
  const labelW = Math.min(120, w * 0.24), valW = 70;
  const x = (km: number) => labelW + (km / 950) * (w - labelW - valW);
  const rowH = Math.min(62, (h - 60) / Math.max(3, rows.length));
  const top = (h - rowH * rows.length) / 2;
  const grown = step >= 1;
  return (
    <svg width={w} height={h} className="gb-svg" role="img" aria-label="Metro length by city, 2004 and 2024">
      {[0, 250, 500, 750].map((v) => <g key={v}><line x1={x(v)} x2={x(v)} y1={top - 10} y2={top + rowH * rows.length} className="gb-grid" /><text x={x(v)} y={top + rowH * rows.length + 18} textAnchor="middle" className="gb-axis">{v} km</text></g>)}
      {rows.map((m, i) => {
        const cy = top + i * rowH + rowH / 2;
        const now = grown ? m.km24 : m.km04;
        const cls = NATION[m.nation].cls;
        const stations = Array.from({ length: Math.floor(m.km24 / 50) + 1 }, (_, k) => k * 50).filter((s) => grown || s <= m.km04);
        return (
          <g key={m.id} className="gb-mrow">
            <text x={labelW - 12} y={cy + 5} textAnchor="end" className="gb-mcity">{m.city}</text>
            <line x1={x(0)} x2={x(950)} y1={cy} y2={cy} className="gb-mghost" />
            {m.km04 > 0 && <rect x={x(0)} y={cy - 4} width={x(m.km04) - x(0)} height="8" rx="4" className="gb-mold" />}
            {m.km24 > m.km04 && <rect x={x(m.km04)} y={cy - 4} width={Math.max(8, x(m.km24) - x(m.km04))} height="8" rx="4" className={`gb-mnew gb-f--${cls}`} style={{ transform: `scaleX(${grown ? 1 : 0})` }} />}
            {stations.map((s) => <circle key={s} cx={x(s)} cy={cy} r="3.4" className={`gb-mstop ${s > m.km04 ? 'is-new' : ''}`} style={{ transitionDelay: `${s > m.km04 ? 400 + ((s - m.km04) / 950) * 900 : 0}ms` }} />)}
            <text x={x(now) + 12} y={cy + 5} className="gb-val">{fmt(now)} km{!(grown ? m.ok24 : m.ok04) && <tspan className="gb-unchecked-t"> ○</tspan>}</text>
            {grown && m.km24 - m.km04 >= 1 && <text x={x(now) + 12} y={cy + 20} className="gb-axis">+{fmt(m.km24 - m.km04)}</text>}
          </g>
        );
      })}
      <g transform={`translate(${labelW} ${top - 26})`} className="gb-mkey">
        <rect x="0" y="-4" width="26" height="8" rx="4" className="gb-mold" /><text x="32" y="4" className="gb-axis">{grown ? 'in 2004' : '2004'}</text>
        {grown && <><rect x="96" y="-4" width="26" height="8" rx="4" className="gb-mnew gb-f--ot" /><text x="128" y="4" className="gb-axis">added by 2024</text></>}
      </g>
    </svg>
  );
}

function MetroWaffle({ w, h }: { w: number; h: number }) {
  const groups = [
    { label: 'China, urban rail 2024', km: CHINA_URBAN_RAIL.km24, cls: 'cn' },
    { label: 'India, metro 2025', km: INDIA_METRO.km25, cls: 'in' },
    { label: 'New York + London today', km: 801, cls: 'ot' },
  ];
  const cols = Math.max(12, Math.floor((w - 20) / 17));
  const cell = Math.min(15, (w - 20) / cols - 2);
  const total = groups.reduce((a, g) => a + Math.ceil(Math.round(g.km / 50) / cols) * (cell + 2) + 44, 0);
  let yy = Math.max(34, (h - total) / 2 + 24);
  return (
    <svg width={w} height={h} className="gb-svg" role="img" aria-label="Waffle chart: each square is 50 km">
      {groups.map((g) => {
        const n = Math.round(g.km / 50);
        const rows = Math.ceil(n / cols);
        const y0 = yy;
        yy += rows * (cell + 2) + 44;
        return (
          <g key={g.label}>
            <text x={10} y={y0 - 10} className="gb-lab">{g.label}: <tspan className="gb-val">{fmt(Math.round(g.km))} km</tspan></text>
            {Array.from({ length: n }, (_, i) => <rect key={i} x={10 + (i % cols) * (cell + 2)} y={y0 + Math.floor(i / cols) * (cell + 2)} width={cell} height={cell} rx="2" className={`gb-waf gb-f--${g.cls}`} style={{ animationDelay: `${Math.min(i, 220) * 6}ms` }} />)}
          </g>
        );
      })}
      <text x={10} y={Math.min(h - 8, yy)} className="gb-axis">■ = 50 km of line</text>
    </svg>
  );
}

/* ───────────── chapter 3: expressways ───────────── */

function RoadGraphic({ step, w, h }: { step: number; w: number; h: number }) {
  if (step === 3) return <Earth w={w} h={h} />;
  const pad = { l: w < 500 ? 44 : 64, r: Math.min(120, Math.max(86, w * 0.2)), t: 30, b: 44 };
  const X = (yr: number) => pad.l + ((yr - 2004) / 22) * (w - pad.l - pad.r);
  const Y = (km: number) => h - pad.b - (km / 200000) * (h - pad.t - pad.b);
  const upto = step === 0 ? 2004 : step === 1 ? 2011 : 2024;
  const cn = CN_EXPRESSWAY.filter(([yr]) => yr <= upto);
  const cnPath = cn.map(([yr, km], i) => `${i ? 'L' : 'M'}${X(yr)} ${Y(km)}`).join('');
  const last = cn[cn.length - 1]!;
  const india = step === 4;
  return (
    <svg width={w} height={h} className="gb-svg" role="img" aria-label="Expressway length, China, US Interstate and India">
      {[0, 50000, 100000, 150000, 200000].map((v) => <g key={v}><line x1={pad.l} x2={w - pad.r} y1={Y(v)} y2={Y(v)} className="gb-grid" /><text x={pad.l - 8} y={Y(v) + 4} textAnchor="end" className="gb-axis">{v ? `${v / 1000}k` : '0'}</text></g>)}
      {[2004, 2010, 2016, 2022, 2026].map((yr) => <text key={yr} x={X(yr)} y={h - pad.b + 20} textAnchor="middle" className="gb-axis">{yr}</text>)}
      <text x={pad.l - 8} y={pad.t - 12} textAnchor="end" className="gb-axis">km</text>
      {/* US Interstate: two known points */}
      <line x1={X(US_INTERSTATE[0]![0])} x2={X(US_INTERSTATE[1]![0])} y1={Y(US_INTERSTATE[0]![1])} y2={Y(US_INTERSTATE[1]![1])} className={`gb-line gb-st--us ${india ? 'is-dim' : ''}`} />
      {US_INTERSTATE.map(([yr, km], i) => <circle key={yr} cx={X(yr)} cy={Y(km)} r="4.5" className={`gb-pt gb-f--us ${i ? 'is-hollow' : ''} ${india ? 'is-dim' : ''}`} />)}
      <text x={X(2023) + 10} y={Y(US_INTERSTATE[1]![1]) - 3} className="gb-lab gb-lab--s">US Interstate<tspan x={X(2023) + 10} dy="14">≈{fmt(US_INTERSTATE[1]![1])}</tspan></text>
      {/* China */}
      <path d={cnPath} className={`gb-line gb-line--big gb-st--cn ${india ? 'is-dim' : ''}`} />
      {cn.map(([yr, km]) => <circle key={yr} cx={X(yr)} cy={Y(km)} r={CN_EXP_CHECKED.has(yr) ? 4.5 : 2.6} className={`gb-pt gb-f--cn ${CN_EXP_CHECKED.has(yr) ? '' : 'is-small'} ${india ? 'is-dim' : ''}`} />)}
      <text x={X(last[0]) + 10} y={Y(last[1]) - 3} className="gb-lab">China<tspan x={X(last[0]) + 10} dy="15">{fmt(last[1])}</tspan></text>
      {step >= 1 && (
        <g className="gb-callout" transform={`translate(${X(2011)} ${Y(80000)})`}>
          <circle r="9" className="gb-cross" />
          <line x1="0" y1="-9" x2="0" y2="-46" className="gb-leader" />
          <text y="-52" textAnchor="middle" className="gb-lab gb-lab--s">2011: passes the Interstate</text>
        </g>
      )}
      {/* India */}
      {(step === 0 || india) && <>
        <line x1={X(2004)} x2={X(2026)} y1={Y(IN_EXPRESSWAY[0]![1])} y2={Y(IN_EXPRESSWAY[1]![1])} className={`gb-line gb-st--in ${india ? '' : 'is-faint'}`} />
        {IN_EXPRESSWAY.map(([yr, km]) => <circle key={yr} cx={X(yr)} cy={Y(km)} r="4.5" className="gb-pt gb-f--in" />)}
        <text x={X(2026) + 10} y={Y(IN_EXPRESSWAY[1]![1]) + 2} className="gb-lab gb-lab--s">India<tspan x={X(2026) + 10} dy="14">{fmt(IN_EXPRESSWAY[1]![1])}</tspan></text>
      </>}
      {india && (
        <g transform={`translate(${Math.max(pad.l + 8, X(2011))} ${Y(66000)})`} className="gb-inset">
          <rect width="230" height="74" rx="10" />
          <text x="14" y="24" className="gb-lab gb-lab--s">India&rsquo;s national highways</text>
          <text x="14" y="50" className="gb-val">{fmt(IN_NH.km14)} → {fmt(IN_NH.km24)} km</text>
          <text x="14" y="66" className="gb-axis">2014 → 2024, +60%</text>
        </g>
      )}
      <g transform={`translate(${pad.l} ${h - 8})`} className="gb-axis"><text>{w < 500 ? '● checked · • bulletin · ○ not re-checked' : '● checked figure · small dots: yearly bulletin figures · ○ not re-checked'}</text></g>
    </svg>
  );
}

function Earth({ w, h }: { w: number; h: number }) {
  const added = CN_EXPRESSWAY[CN_EXPRESSWAY.length - 1]![1] - CN_EXPRESSWAY[0]![1];
  const laps = added / EARTH_KM;
  const R = Math.min(w, h) * 0.26, cx = w / 2, cy = h / 2 + 6;
  // a spiral that goes round `laps` times, a little further out each lap
  const pts: string[] = [];
  const N = 600;
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * laps * Math.PI * 2 - Math.PI / 2;
    const r = R + 10 + (i / N) * laps * 11;
    pts.push(`${i ? 'L' : 'M'}${(cx + Math.cos(a) * r).toFixed(1)} ${(cy + Math.sin(a) * r).toFixed(1)}`);
  }
  return (
    <svg width={w} height={h} className="gb-svg" role="img" aria-label={`China's new expressway would circle the Earth ${laps.toFixed(1)} times`}>
      <circle cx={cx} cy={cy} r={R} className="gb-earth" />
      {[-0.5, 0, 0.5].map((k) => <ellipse key={k} cx={cx} cy={cy} rx={R * (1 - Math.abs(k) * 0.9)} ry={R} className="gb-earth-l" transform={`rotate(${k * 30} ${cx} ${cy})`} />)}
      <line x1={cx - R} x2={cx + R} y1={cy} y2={cy} className="gb-earth-l" />
      <path d={pts.join('')} className="gb-spiral gb-st--cn" pathLength={1} />
      <text x={cx} y={cy - 6} textAnchor="middle" className="gb-earth-n">{laps.toFixed(1)}×</text>
      <text x={cx} y={cy + 16} textAnchor="middle" className="gb-axis">the equator ({fmt(EARTH_KM)} km)</text>
    </svg>
  );
}

/* ───────────── the ledger ───────────── */

function Ledger() {
  return (
    <div className="gb-ledger">
      <table>
        <caption>Container ports, million TEU</caption>
        <thead><tr><th>Port</th><th className="num">2004</th><th className="num">2024</th><th className="num">Change</th></tr></thead>
        <tbody>{[...PORTS].sort((a, b) => b.t24 - a.t24).map((p) => (
          <tr key={p.id}><td><i className={`gb-sw gb-f--${NATION[p.nation].cls}`} />{p.name}</td><td className="num">{p.t04.toFixed(1)}{!p.ok04 && <Hollow />}</td><td className="num">{p.t24.toFixed(1)}{!p.ok24 && <Hollow />}</td><td className="num">{p.t24 >= p.t04 ? '+' : ''}{Math.round((p.t24 / p.t04 - 1) * 100)}%</td></tr>
        ))}</tbody>
      </table>
      <table>
        <caption>Metro route length, km</caption>
        <thead><tr><th>City</th><th className="num">2004</th><th className="num">2024</th></tr></thead>
        <tbody>{METROS.map((m) => <tr key={m.id}><td><i className={`gb-sw gb-f--${NATION[m.nation].cls}`} />{m.city}</td><td className="num">{fmt(m.km04)}{!m.ok04 && <Hollow />}</td><td className="num">{fmt(m.km24)}{!m.ok24 && <Hollow />}</td></tr>)}
          <tr><td><i className="gb-sw gb-f--cn" />China, all urban rail</td><td className="num">—</td><td className="num">{fmt(CHINA_URBAN_RAIL.km24)}</td></tr>
          <tr><td><i className="gb-sw gb-f--in" />India, all metros</td><td className="num">{INDIA_METRO.km14} (2014)</td><td className="num">≈{fmt(INDIA_METRO.km25)} (2025)</td></tr>
        </tbody>
      </table>
      <table>
        <caption>Expressways, km</caption>
        <thead><tr><th>Network</th><th className="num">2004</th><th className="num">Latest</th></tr></thead>
        <tbody>
          <tr><td><i className="gb-sw gb-f--cn" />China expressways</td><td className="num">{fmt(CN_EXPRESSWAY[0]![1])}</td><td className="num">{fmt(CN_EXPRESSWAY[CN_EXPRESSWAY.length - 1]![1])} (2024)</td></tr>
          <tr><td><i className="gb-sw gb-f--us" />US Interstate</td><td className="num">{fmt(US_INTERSTATE[0]![1])}</td><td className="num">≈{fmt(US_INTERSTATE[1]![1])} (2023)<Hollow /></td></tr>
          <tr><td><i className="gb-sw gb-f--in" />India expressways</td><td className="num">≈{fmt(IN_EXPRESSWAY[0]![1])}</td><td className="num">{fmt(IN_EXPRESSWAY[1]![1])} (2026)</td></tr>
        </tbody>
      </table>
    </div>
  );
}
