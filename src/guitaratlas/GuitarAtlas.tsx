import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { geoGraticule10, geoNaturalEarth1, geoPath, type GeoProjection } from 'd3-geo';
import { select } from 'd3-selection';
import 'd3-transition';
import { zoom as d3zoom, zoomIdentity, type ZoomBehavior, type ZoomTransform } from 'd3-zoom';
import { feature, mesh } from 'topojson-client';
import type { Feature, FeatureCollection, Geometry, MultiLineString } from 'geojson';
import type { GeometryCollection, Topology } from 'topojson-specification';
import worldUrl from 'world-atlas/countries-50m.json?url';
import { BRANDS, CENTROID, ERAS, EXPORTS_2023, ISO_NUM, KINDS, MEXICO_9202, SITES, SOURCES, WOODS, fmtUnits, type Kind, type Site } from './data';

/**
 * Guitar Atlas: where the world's guitars are made.
 *
 * One map, four layers (factories, exports, tonewood, history), a brand
 * finder, two charts and a table. Every mark has a hover card; every figure
 * cites where it came from.
 */

type Layer = 'factories' | 'exports' | 'wood' | 'history';
type Hover = { x: number; y: number; body: ReactNode } | null;

const SITE_BY_ID = Object.fromEntries(SITES.map((s) => [s.id, s]));
const KIND_LABEL = Object.fromEntries(KINDS.map((k) => [k.id, k])) as Record<Kind, (typeof KINDS)[number]>;
const kindsOf = (s: Site) => [s.kind, ...(s.also ?? [])];

/** A plectrum, centred on 0,0, about r across. */
const pick = (r: number) => `M0 ${r * 1.12}C${-r * 0.4} ${r * 0.72} ${-r * 1.08} ${-r * 0.05} ${-r * 0.98} ${-r * 0.52}C${-r * 0.88} ${-r * 1.08} ${r * 0.88} ${-r * 1.08} ${r * 0.98} ${-r * 0.52}C${r * 1.08} ${-r * 0.05} ${r * 0.4} ${r * 0.72} 0 ${r * 1.12}Z`;
const pickR = (s: Site, ms = 1) => (s.units ? Math.max(8 * Math.max(0.8, ms), (Math.sqrt(s.units) / 72) * ms) : 6.5);
/** Marks shrink on narrow maps so China stays visible under its picks. */
const markScale = (w: number) => Math.min(1, Math.max(0.5, w / 1150));
/** A leaf, for tonewood. */
const leaf = (r: number) => `M0 ${-r}C${r * 0.9} ${-r * 0.5} ${r * 0.8} ${r * 0.5} 0 ${r}C${-r * 0.8} ${r * 0.5} ${-r * 0.9} ${-r * 0.5} 0 ${-r}Z`;
const usdR = (usd: number, ms = 1) => Math.sqrt(usd) * 2.1 * ms;

/* ───────────── labels that keep out of each other's way ───────────── */

interface LabelIn { id: string; x: number; y: number; r: number; text: string; size?: number }
interface LabelOut { x: number; y: number; anchor: 'start' | 'end' | 'middle' }
/** Greedy placement: try right, left, above, below each mark; drop a label rather than overlap. */
function placeLabels(items: LabelIn[], marks: { x: number; y: number; r: number }[], W = 1e9, H = 1e9) {
  const boxes: [number, number, number, number][] = marks.map((m) => [m.x - m.r, m.y - m.r, m.x + m.r, m.y + m.r]);
  const out = new Map<string, LabelOut>();
  for (const it of items) {
    const w = it.text.length * (it.size ?? 12.5) * 0.56, h = (it.size ?? 12.5) * 1.2, g = it.r + 5;
    const tries: [LabelOut, [number, number, number, number]][] = [
      [{ x: it.x + g, y: it.y + 4, anchor: 'start' }, [it.x + g, it.y - h / 2, it.x + g + w, it.y + h / 2]],
      [{ x: it.x - g, y: it.y + 4, anchor: 'end' }, [it.x - g - w, it.y - h / 2, it.x - g, it.y + h / 2]],
      [{ x: it.x, y: it.y - g - 3, anchor: 'middle' }, [it.x - w / 2, it.y - g - h, it.x + w / 2, it.y - g]],
      [{ x: it.x, y: it.y + g + h - 2, anchor: 'middle' }, [it.x - w / 2, it.y + g, it.x + w / 2, it.y + g + h]],
    ];
    for (const [pos, b] of tries) {
      const own = (m: [number, number, number, number]) => Math.abs((m[0] + m[2]) / 2 - it.x) < 0.5 && Math.abs((m[1] + m[3]) / 2 - it.y) < 0.5;
      if (b[0] < 4 || b[1] < 4 || b[2] > W - 4 || b[3] > H - 4) continue;
      if (boxes.some((o) => !own(o) && b[0] < o[2] && b[2] > o[0] && b[1] < o[3] && b[3] > o[1])) continue;
      boxes.push(b); out.set(it.id, pos); break;
    }
  }
  return out;
}

/* ───────────── the world ───────────── */

interface World { countries: Feature<Geometry, { name: string }>[]; borders: MultiLineString }
function useWorld() {
  const [w, setW] = useState<World | null>(null);
  useEffect(() => {
    let live = true;
    void fetch(worldUrl).then((r) => r.json()).then((j: unknown) => {
      const topo = j as Topology<{ countries: GeometryCollection<{ name: string }> }>;
      const fc = feature(topo, topo.objects.countries) as FeatureCollection<Geometry, { name: string }>;
      const countries = fc.features.filter((f) => f.id !== '010'); // no Antarctica
      const borders = mesh(topo, topo.objects.countries, (a, b) => a !== b) as MultiLineString;
      if (live) setW({ countries, borders });
    });
    return () => { live = false; };
  }, []);
  return w;
}

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el); setW(el.clientWidth);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

interface MapApi { focus: (lon: number, lat: number) => void; fit: (pts: [number, number][]) => void; reset: () => void }

/* ───────────── the page ───────────── */

export function GuitarAtlas({ onExit }: { onExit: () => void }) {
  const [layer, setLayer] = useState<Layer>('factories');
  const [kinds, setKinds] = useState<Set<Kind>>(new Set(['electric', 'acoustic', 'classical']));
  const [sel, setSel] = useState<string | null>(null);
  const [brand, setBrand] = useState<string | null>(null);
  const [era, setEra] = useState(0);
  const [table, setTable] = useState(false);
  const mapApi = useRef<MapApi | null>(null);
  const mapBox = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = '/fonts-guitar/fonts.css';
    document.head.appendChild(l);
    return () => l.remove();
  }, []);

  const choose = (id: string | null) => {
    setSel(id);
    const s = id ? SITE_BY_ID[id] : null;
    if (s) mapApi.current?.focus(s.lon, s.lat);
  };
  const showBrand = (id: string | null) => {
    setBrand(id); setLayer('factories'); setSel(null);
    mapBox.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const b = BRANDS.find((x) => x.id === id);
    if (!b) { mapApi.current?.reset(); return; }
    const pts = b.lines.flatMap((l) => l.places.map((p): [number, number] => {
      if (p.site) { const s = SITE_BY_ID[p.site]!; return [s.lon, s.lat]; }
      const c = CENTROID[p.country!]!; return [c[1], c[0]];
    }));
    window.setTimeout(() => mapApi.current?.fit(pts), 350);
  };
  const toggleKind = (k: Kind) => setKinds((cur) => { const n = new Set(cur); if (n.has(k) && n.size > 1) n.delete(k); else n.add(k); return n; });

  const topUnits = useMemo(() => SITES.filter((s) => s.units).sort((a, b) => b.units! - a.units!), []);
  const chinaShare = ((EXPORTS_2023.rows[0]!.usd / EXPORTS_2023.world) * 100).toFixed(1);

  return (
    <div className="ga-root">
      <header className="ga-top">
        <button className="ga-back" onClick={onExit} aria-label="Back to the shelf">← Shelf</button>
        <span className="ga-top-t">Guitar Atlas</span>
      </header>

      <section className="ga-hero">
        <div className="ga-hero-text">
          <p className="ga-kicker">An illustrated atlas · data to 2026</p>
          <h1 className="ga-h1">Where the world&rsquo;s <em>guitars</em> are made</h1>
          <p className="ga-lede">
            From a mountain county in Guizhou that says it builds one guitar in seven, to a Pennsylvania town that has made them since 1839.
            Follow the factories, the money and the wood.
          </p>
        </div>
        <HeroGuitar />
      </section>

      <section className="ga-tiles" aria-label="Headline numbers">
        <Tile big="1 in 7" label="of the world's guitars, by its own count, come from Zheng'an County, Guizhou" src="cd-zhengan-2021" />
        <Tile big={`${chinaShare}%`} label={`of world guitar-type exports by value are Chinese: $${EXPORTS_2023.rows[0]!.usd}M of $${EXPORTS_2023.world}M (2023)`} src="trend-920290" />
        <Tile big="550 a day" label="acoustic guitars out of Taylor's factory in Tecate, Mexico" src="sdbj-taylor" />
        <Tile big="1839" label="the year Martin started building guitars in Nazareth, Pennsylvania" src="general" />
      </section>

      <section className="ga-mapcard" ref={mapBox}>
        <div className="ga-controls">
          <div className="ga-seg" role="tablist" aria-label="Map layer">
            {([['factories', 'Factories'], ['exports', 'Exports'], ['wood', 'Tonewood'], ['history', 'History']] as [Layer, string][]).map(([id, label]) => (
              <button key={id} role="tab" aria-selected={layer === id} className={layer === id ? 'is-on' : ''} onClick={() => { setLayer(id); setSel(null); if (id !== 'factories') setBrand(null); }}>{label}</button>
            ))}
          </div>
          {layer === 'factories' && (
            <div className="ga-chips" aria-label="Guitar type">
              {KINDS.map((k) => (
                <button key={k.id} className={`ga-chip ${kinds.has(k.id) ? 'is-on' : ''}`} onClick={() => toggleKind(k.id)} aria-pressed={kinds.has(k.id)}>
                  <svg viewBox="-10 -10 20 20" className="ga-chip-sw"><path d={pick(8)} style={{ fill: `var(--ga-${k.id[0]})` }} /><text y="3.4" textAnchor="middle">{k.glyph}</text></svg>
                  {k.label}
                </button>
              ))}
            </div>
          )}
          {brand && (
            <button className="ga-chip is-on ga-chip--brand" onClick={() => setBrand(null)}>
              {BRANDS.find((b) => b.id === brand)!.name} <span aria-hidden>×</span>
            </button>
          )}
          <button className="ga-link" onClick={() => setTable((t) => !t)}>{table ? 'Hide table' : 'Show as table'}</button>
        </div>

        <div className="ga-mapwrap">
          <AtlasMap layer={layer} kinds={kinds} sel={sel} brand={brand} era={era} onPick={(id) => choose(id)} api={mapApi} card={sel ? <Detail site={SITE_BY_ID[sel]!} onClose={() => setSel(null)} /> : null} />
        </div>

        {layer === 'history' && (
          <div className="ga-eras">
            <div className="ga-era-track" role="tablist" aria-label="Era">
              {ERAS.map((e, i) => (
                <button key={e.id} role="tab" aria-selected={era === i} className={`ga-era ${era === i ? 'is-on' : ''}`} onClick={() => setEra(i)}>
                  <b>{e.years}</b><span>{e.title}</span>
                </button>
              ))}
            </div>
            <p className="ga-era-text"><b>{ERAS[era]!.title}.</b> {ERAS[era]!.text}</p>
          </div>
        )}

        {table && <SiteTable onPick={(id) => { choose(id); mapBox.current?.scrollIntoView({ behavior: 'smooth' }); }} />}
      </section>

      <section className="ga-two">
        <article className="ga-card">
          <h2 className="ga-h2">Who ships them</h2>
          <p className="ga-sub">Exports of guitars and other plucked string instruments (HS 920290), 2023, US$ million. Electric guitars are counted under a separate code and are not included.</p>
          <ExportBars />
          <p className="ga-foot">Mexico, a major builder for the US market, reports ${MEXICO_9202}M under the wider HS 9202 heading. Much of its output is electric guitars, which are not in this figure. <Cite id="trend-mex-9202" /></p>
        </article>
        <article className="ga-card">
          <h2 className="ga-h2">Guitars a year, where anyone says</h2>
          <p className="ga-sub">Published annual output by place. ≈ marks figures worked out from a daily rate. Most factories don&rsquo;t publish a number.</p>
          <UnitBars rows={topUnits} onPick={(id) => { choose(id); mapBox.current?.scrollIntoView({ behavior: 'smooth' }); }} />
        </article>
      </section>

      <section className="ga-card ga-brands">
        <h2 className="ga-h2">Where is <em>my</em> guitar from?</h2>
        <p className="ga-sub">Most brands build in more than one country. The same logo can come from California, Mexico or Java depending on the price.</p>
        <BrandFinder brand={brand} setBrand={setBrand} onShow={showBrand} onPlace={(id) => { setLayer('factories'); choose(id); mapBox.current?.scrollIntoView({ behavior: 'smooth' }); }} />
      </section>

      <section className="ga-card ga-sources">
        <h2 className="ga-h2">Sources and method</h2>
        <p>
          Unit figures are what companies or local governments have said in public. They are not audited production statistics, and they are
          rounded. Where only a daily rate was given, the yearly figure assumes 250 working days and is marked ≈. Export values are UN Comtrade
          figures for HS 920290 as reported by TrendEconomy. Places without a published figure are drawn as hollow picks. Their size says nothing
          about output. Tonewood routes show where each wood is best known to be used, not every shipment.
        </p>
        <ol className="ga-srclist">
          {SOURCES.filter((s) => s.url).map((s) => (
            <li key={s.id} id={`src-${s.id}`}><a href={s.url} target="_blank" rel="noreferrer">{s.title}</a> <span>({s.year})</span></li>
          ))}
          <li id="src-general">Factory locations for individual brands: the makers&rsquo; own websites and widely documented company histories.</li>
        </ol>
      </section>
      <footer className="ga-end">Map: Natural Earth via world-atlas · Built with d3-geo, d3-zoom and React</footer>
    </div>
  );
}

function Cite({ id }: { id: string }) {
  const n = SOURCES.findIndex((s) => s.id === id) + 1;
  return <a className="ga-cite" href={`#src-${id}`} onClick={(e) => { e.preventDefault(); document.getElementById(`src-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }}>[{n}]</a>;
}

function Tile({ big, label, src }: { big: string; label: string; src: string }) {
  return <div className="ga-tile"><b>{big}</b><span>{label} <Cite id={src} /></span></div>;
}

/* ───────────── the map ───────────── */

function AtlasMap({ layer, kinds, sel, brand, era, onPick, api, card }: {
  layer: Layer; kinds: Set<Kind>; sel: string | null; brand: string | null; era: number; onPick: (id: string | null) => void; card: ReactNode;
  api: React.MutableRefObject<MapApi | null>;
}) {
  const world = useWorld();
  const [box, width] = useWidth<HTMLDivElement>();
  const height = width < 640 ? Math.round(width * 0.72) : Math.round(width * 0.5);
  const svg = useRef<SVGSVGElement>(null);
  const zb = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [t, setT] = useState<ZoomTransform>(zoomIdentity);
  const tRef = useRef(t); tRef.current = t;
  const [coarse] = useState(() => window.matchMedia('(hover: none)').matches);
  const ms = markScale(width);
  const [hover, setHover] = useState<Hover>(null);

  const proj = useMemo<GeoProjection | null>(() => {
    if (!world || !width) return null;
    const p = geoNaturalEarth1();
    p.fitExtent([[6, 10], [width - 6, height - 6]], { type: 'FeatureCollection', features: world.countries } as FeatureCollection);
    return p;
  }, [world, width, height]);

  const paths = useMemo(() => {
    if (!proj || !world) return null;
    const g = geoPath(proj);
    return {
      countries: world.countries.map((c) => ({ id: String(c.id), name: c.properties.name, d: g(c) ?? '' })),
      borders: g(world.borders) ?? '',
      grat: g(geoGraticule10()) ?? '',
      sphere: g({ type: 'Sphere' }) ?? '',
    };
  }, [proj, world]);

  // zoom and pan: drag, ctrl/⌘ + wheel, two fingers; one finger scrolls the page
  useEffect(() => {
    const el = svg.current; if (!el || !width) return;
    let raf = 0, next: ZoomTransform | null = null;
    const z = d3zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 14])
      .translateExtent([[0, 0], [width, height]])
      .filter((e: Event) => {
        if (e.type === 'wheel') return (e as WheelEvent).ctrlKey || (e as WheelEvent).metaKey;
        if (e.type.startsWith('touch')) return (e as TouchEvent).touches.length > 1;
        return !(e as MouseEvent).button;
      })
      .on('zoom', (e) => { next = e.transform; if (!raf) raf = requestAnimationFrame(() => { raf = 0; if (next) setT(next); }); });
    const s = select(el);
    s.call(z);
    s.style('touch-action', 'pan-y');
    s.on('dblclick.zoom', null);
    zb.current = z;
    const go = (cx: number, cy: number, k: number) => s.transition().duration(900).call(z.transform, zoomIdentity.translate(cx, cy).scale(k));
    api.current = {
      // bring a place into view, to the left of the detail card on wide screens
      focus: (lon, lat) => {
        const p = proj?.([lon, lat]); if (!p) return;
        const k = Math.max(tRef.current.k, 3);
        const cx = width >= 640 ? (width - 340) / 2 : width / 2;
        go(cx - p[0] * k, height / 2 - p[1] * k, k);
      },
      fit: (pts) => {
        const ps = pts.map((q) => proj?.(q)).filter(Boolean) as [number, number][];
        if (!ps.length) return;
        const xs = ps.map((q) => q[0]), ys = ps.map((q) => q[1]);
        const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
        const k = Math.max(1, Math.min(5, 0.7 * Math.min(width / Math.max(1, x1 - x0), height / Math.max(1, y1 - y0))));
        go(width / 2 - ((x0 + x1) / 2) * k, height / 2 - ((y0 + y1) / 2) * k, k);
      },
      reset: () => { s.transition().duration(700).call(z.transform, zoomIdentity); },
    };
    return () => { s.on('.zoom', null); cancelAnimationFrame(raf); };
  }, [width, height, proj, api]);

  const at = (lon: number, lat: number): [number, number] => { const p = proj?.([lon, lat]) ?? [0, 0]; return t.apply(p as [number, number]); };
  const zoomBy = (k: number) => { if (svg.current && zb.current) select(svg.current).transition().duration(350).call(zb.current.scaleBy, k); };

  // what is lit
  const brandDef = brand ? BRANDS.find((b) => b.id === brand) : null;
  const brandSites = new Set(brandDef?.lines.flatMap((l) => l.places.map((p) => p.site).filter(Boolean)) as string[] | undefined);
  const brandCountries = new Set(brandDef?.lines.flatMap((l) => l.places.map((p) => p.country ?? SITE_BY_ID[p.site!]?.country)).filter(Boolean).map((c) => ISO_NUM[c!]) as string[] | undefined);
  const eraDef = ERAS[era]!;
  const eraCountries = new Set(eraDef.countries.map((c) => ISO_NUM[c]));
  const exportCountries = new Set(EXPORTS_2023.rows.map((r) => ISO_NUM[r.id]));
  const woodSites = new Set(WOODS.flatMap((w) => w.to));

  const showSite = (s: Site) => {
    if (layer === 'history') return eraDef.sites.includes(s.id);
    if (layer === 'wood') return woodSites.has(s.id);
    if (layer === 'exports') return false;
    return true;
  };
  const dimSite = (s: Site) => layer === 'factories' && ((brandDef && !brandSites.has(s.id)) || !kindsOf(s).some((k) => kinds.has(k)));
  const sites = SITES.filter(showSite).sort((a, b) => pickR(b, ms) - pickR(a, ms));
  const labelled = new Set(layer === 'factories' ? (brandDef ? [...brandSites] : SITES.filter((s) => s.units && s.units >= 1e6).map((s) => s.id)) : layer === 'history' ? eraDef.sites : []);
  if (sel) labelled.add(sel);

  const siteXY = new Map(sites.map((s) => [s.id, { p: at(s.lon, s.lat), r: layer === 'wood' ? 4.5 : pickR(s, ms) }]));
  const siteLabels = placeLabels(
    sites.filter((s) => labelled.has(s.id) && !dimSite(s)).sort((a, b) => (a.id === sel ? -1 : b.id === sel ? 1 : pickR(b, ms) - pickR(a, ms))).map((s) => { const q = siteXY.get(s.id)!; return { id: s.id, x: q.p[0], y: q.p[1], r: q.r, text: s.name.split(',')[0]! }; }),
    [...siteXY.values()].map((q) => ({ x: q.p[0], y: q.p[1], r: q.r })), width, height,
  );
  const woodXY = WOODS.map((w) => ({ w, p: at(w.lon, w.lat) }));
  const woodLabels = placeLabels(woodXY.map(({ w, p }) => ({ id: w.id, x: p[0], y: p[1], r: 9, text: w.name, size: 13 })), [...woodXY.map(({ p }) => ({ x: p[0], y: p[1], r: 9 })), ...(layer === 'wood' ? [...siteXY.values()].map((q) => ({ x: q.p[0], y: q.p[1], r: 5 })) : [])], width, height);
  const expRows = [...EXPORTS_2023.rows].sort((a, b) => b.usd - a.usd).map((r) => { const [x, y] = at(CENTROID[r.id]![1], CENTROID[r.id]![0]); const R = usdR(r.usd, ms); return { r, x, y, R }; });
  const expLabels = placeLabels(expRows.map(({ r, x, y, R }) => ({ id: r.id, x, y, r: R, text: R < 24 ? `${r.name} $${r.usd}M` : r.name })), expRows.map(({ x, y, R }) => ({ x, y, r: R })), width, height);

  const tip = (e: React.PointerEvent, body: ReactNode) => {
    const r = box.current!.getBoundingClientRect();
    setHover({ x: e.clientX - r.left, y: e.clientY - r.top, body });
  };

  return (
    <>
    <div className="ga-map" ref={box} style={{ height: height || 360 }}>
      {!paths && <div className="ga-loading">Unfolding the map…</div>}
      <svg ref={svg} width={width} height={height} className="ga-svg" onClick={(e) => { if (e.target === svg.current) onPick(null); }} role="img" aria-label="World map of guitar making">
        <defs>
          <pattern id="ga-waves" width="26" height="12" patternUnits="userSpaceOnUse" patternTransform={`translate(${t.x % 26} ${t.y % 12})`}>
            <path d="M0 8 Q 6.5 4 13 8 T 26 8" className="ga-wave" />
          </pattern>
          <pattern id="ga-stipple" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform={`scale(${1 / t.k})`}>
            <circle cx="1.5" cy="1.5" r="0.55" className="ga-dot" /><circle cx="5" cy="4.8" r="0.45" className="ga-dot" />
          </pattern>
          <pattern id="ga-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" className="ga-hatchline" />
          </pattern>
        </defs>
        <rect width={width} height={height} className="ga-sea" />
        <rect width={width} height={height} fill="url(#ga-waves)" opacity="0.5" />
        {paths && (
          <g transform={t.toString()}>
            <path d={paths.grat} className="ga-grat" vectorEffect="non-scaling-stroke" />
            {/* a paper-cut shadow under the land */}
            <g transform="translate(1.6 2.2)" className="ga-landshadow">{paths.countries.map((c) => <path key={c.id + c.name} d={c.d} />)}</g>
            {paths.countries.map((c) => {
              const lit = layer === 'history' ? eraCountries.has(c.id) : layer === 'exports' ? exportCountries.has(c.id) : brandDef ? brandCountries.has(c.id) : false;
              return <path key={c.id + c.name} d={c.d} className={`ga-land ${lit ? 'is-lit' : ''}`} vectorEffect="non-scaling-stroke" />;
            })}
            <g style={{ pointerEvents: 'none' }}>{paths.countries.map((c) => <path key={c.id + c.name} d={c.d} fill="url(#ga-stipple)" opacity="0.7" />)}</g>
            {layer === 'history' && <g style={{ pointerEvents: 'none' }}>{paths.countries.filter((c) => eraCountries.has(c.id)).map((c) => <path key={c.id + c.name} d={c.d} fill="url(#ga-hatch)" />)}</g>}
            <path d={paths.borders} className="ga-border" vectorEffect="non-scaling-stroke" />
          </g>
        )}

        {/* exports: bubbles on each exporter */}
        {proj && layer === 'exports' && (
          <g>
            {expRows.map(({ r, x, y, R }) => {
              const lab = expLabels.get(r.id);
              return (
                <g key={r.id} transform={`translate(${x} ${y})`} className="ga-hit"
                  onPointerMove={(e) => tip(e, <><b>{r.name}</b><span>${r.usd}M in 2023 · {Math.round((r.usd / EXPORTS_2023.world) * 100)}% of world</span>{r.note && <em>{r.note}</em>}</>)}
                  onPointerLeave={() => setHover(null)}>
                  <circle r={R} className="ga-usd" />
                  {lab && <text x={lab.x - x} y={lab.y - y} textAnchor={lab.anchor} className="ga-lab">{R < 24 ? `${r.name} $${r.usd}M` : r.name}</text>}
                  {R >= 24 && <text y={4} textAnchor="middle" className="ga-lab ga-lab--in">${r.usd}M</text>}
                </g>
              );
            })}
            {(() => {
              const [x, y] = at(CENTROID.MX![1], CENTROID.MX![0]);
              const R = usdR(MEXICO_9202, ms);
              return (
                <g transform={`translate(${x} ${y})`} className="ga-hit" onPointerMove={(e) => tip(e, <><b>Mexico</b><span>${MEXICO_9202}M (HS 9202, wider heading)</span><em>Most Mexican output is electric guitars (Fender, Ensenada), counted under a different code.</em></>)} onPointerLeave={() => setHover(null)}>
                  <circle r={R} className="ga-usd ga-usd--hollow" />
                  <text y={-R - 6} textAnchor="middle" className="ga-lab">Mexico*</text>
                </g>
              );
            })()}
          </g>
        )}

        {/* tonewood: where it grows, and where it goes */}
        {proj && layer === 'wood' && (
          <g>
            {WOODS.flatMap((w) => w.to.map((to) => {
              const s = SITE_BY_ID[to]!;
              const [x1, y1] = at(w.lon, w.lat), [x2, y2] = at(s.lon, s.lat);
              const mx = (x1 + x2) / 2, my = (y1 + y2) / 2 - Math.hypot(x2 - x1, y2 - y1) * 0.22;
              const d = `M${x1} ${y1}Q${mx} ${my} ${x2} ${y2}`;
              return (
                <g key={w.id + to}>
                  <path d={d} className="ga-route" />
                  <circle r="2.4" className="ga-seed"><animateMotion dur={`${5 + (w.id.length % 4)}s`} repeatCount="indefinite" path={d} /></circle>
                </g>
              );
            }))}
            {woodXY.map(({ w, p: [x, y] }) => {
              const lab = woodLabels.get(w.id);
              return (
                <g key={w.id} transform={`translate(${x} ${y})`} className="ga-hit"
                  onPointerMove={(e) => tip(e, <><b>{w.name}</b><span>{w.part} · {w.region}</span><em>{w.note}</em><span className="ga-tip-to">To: {w.to.map((id) => SITE_BY_ID[id]!.who.split(' (')[0]).filter((v, i, a) => a.indexOf(v) === i).join(', ')}</span></>)}
                  onPointerLeave={() => setHover(null)}>
                  <path d={leaf(9)} className="ga-leaf" transform="rotate(-30)" />
                  <path d="M0 -8 L0 8" transform="rotate(-30)" className="ga-leafvein" />
                  {lab && <text x={lab.x - x} y={lab.y - y} textAnchor={lab.anchor} className="ga-lab ga-lab--wood">{w.name}</text>}
                </g>
              );
            })}
          </g>
        )}

        {/* factories: picks sized by published output */}
        {proj && (
          <g>
            {sites.map((s) => {
              const [x, y] = at(s.lon, s.lat);
              const r = layer === 'wood' ? 4.5 : pickR(s, ms);
              const dim = dimSite(s);
              const on = sel === s.id || brandSites.has(s.id);
              const known = !!s.units && layer !== 'wood';
              return (
                <g key={s.id} transform={`translate(${x} ${y})`} className={`ga-site ${dim ? 'is-dim' : ''} ${on ? 'is-on' : ''}`}
                  onClick={(e) => { e.stopPropagation(); onPick(s.id); }}
                  onPointerMove={(e) => tip(e, <><b>{s.name}</b><span>{s.who}</span><span>{KIND_LABEL[s.kind].label}{s.units ? ` · ${s.approx ? '≈' : ''}${fmtUnits(s.units)} a year` : ' · output not published'}</span></>)}
                  onPointerLeave={() => setHover(null)}>
                  <circle r={Math.max(14, r + 4)} className="ga-hitarea" />
                  {on && <circle r={r + 7} className="ga-ring" />}
                  {layer === 'wood'
                    ? <circle r={r} className="ga-woodsite" />
                    : <path d={pick(r)} className={`ga-pick ga-pick--${s.kind} ${known ? '' : 'is-hollow'}`} />}
                  {known && r >= 11 && <text y={r * 0.22} textAnchor="middle" className="ga-glyph" style={{ fontSize: Math.min(15, r * 0.7) }}>{KIND_LABEL[s.kind].glyph}</text>}
                  {siteLabels.has(s.id) && <text x={siteLabels.get(s.id)!.x - x} y={siteLabels.get(s.id)!.y - y} textAnchor={siteLabels.get(s.id)!.anchor} className="ga-lab">{s.name.split(',')[0]}</text>}
                </g>
              );
            })}
          </g>
        )}
        <Compass x={width - 44} y={height - 46} />
      </svg>

      <div className="ga-zoom">
        <button onClick={() => zoomBy(1.8)} aria-label="Zoom in">+</button>
        <button onClick={() => zoomBy(1 / 1.8)} aria-label="Zoom out">−</button>
        <button onClick={() => api.current?.reset()} aria-label="Whole world">⟲</button>
      </div>
      <div className="ga-hint">{coarse ? 'Pinch or +/− to zoom · tap a pick' : 'Drag to pan · Ctrl/⌘ + scroll to zoom · click a pick'}</div>
      {hover && <div className="ga-tip" style={{ left: Math.min(hover.x + 14, (width || 300) - 230), top: hover.y + 14 }}>{hover.body}</div>}
      {width >= 640 && card}
    </div>
    {width < 640 && card}
    <Legend layer={layer} ms={ms} />
    </>
  );
}

function Compass({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`} className="ga-compass" aria-hidden>
      <circle r="22" /><circle r="16" />
      <path d="M0 -26 L4 0 L0 26 L-4 0 Z" /><path d="M-26 0 L0 3 L26 0 L0 -3 Z" className="ga-compass-2" />
      <text y="-30" textAnchor="middle">N</text>
    </g>
  );
}

/* ───────────── the detail card ───────────── */

function Detail({ site: s, onClose }: { site: Site; onClose: () => void }) {
  const brands = BRANDS.flatMap((b) => b.lines.filter((l) => l.places.some((p) => p.site === s.id)).map((l) => `${b.name} ${l.line}`));
  const woods = WOODS.filter((w) => w.to.includes(s.id));
  return (
    <aside className="ga-detail" aria-label={s.name}>
      <button className="ga-x" onClick={onClose} aria-label="Close">×</button>
      <p className="ga-detail-k">
        {kindsOf(s).map((k) => <span key={k} className="ga-kind"><svg viewBox="-10 -10 20 20"><path d={pick(8)} style={{ fill: `var(--ga-${k[0]})` }} /><text y="3.4" textAnchor="middle">{KIND_LABEL[k].glyph}</text></svg>{KIND_LABEL[k].label}</span>)}
      </p>
      <h3>{s.name}</h3>
      <p className="ga-detail-who">{s.who}{s.since ? ` · since ${s.since}` : ''}</p>
      <div className="ga-detail-n">
        {s.units ? <><b>{s.approx ? '≈' : ''}{fmtUnits(s.units)}</b><span>guitars a year{s.unitsNote ? ` (${s.unitsNote})` : ''}</span></> : <span className="ga-muted">No output figure published.</span>}
      </div>
      <p>{s.note}</p>
      {brands.length > 0 && <><h4>Made here</h4><ul>{brands.map((b) => <li key={b}>{b}</li>)}</ul></>}
      {woods.length > 0 && <><h4>Wood arriving from</h4><ul>{woods.map((w) => <li key={w.id}>{w.name}, {w.region}</li>)}</ul></>}
      <p className="ga-detail-src">Sources: {s.src.map((id) => <Cite key={id} id={id} />)}</p>
    </aside>
  );
}

function Legend({ layer, ms }: { layer: Layer; ms: number }) {
  return (
    <div className="ga-legend">
      {layer === 'factories' && <>
        {[[6e6, '6 M a year'], [1.5e6, '1.5 M'], [1e5, '≤ 0.3 M']].map(([u, l]) => {
          const r = pickR({ units: u } as Site, ms);
          return <span key={l} className="ga-leg"><svg viewBox={`${-r - 2} ${-r * 1.15 - 2} ${2 * r + 4} ${2.3 * r + 4}`} style={{ width: 2 * r + 4, height: 2.3 * r + 4 }}><path d={pick(r)} className="ga-pick ga-pick--acoustic" /></svg>{l}</span>;
        })}
        <span className="ga-leg"><svg viewBox="-9 -9 18 18" style={{ width: 18, height: 18 }}><path d={pick(6.5)} className="ga-pick ga-pick--acoustic is-hollow" /></svg>no figure published</span>
        <span className="ga-leg-note">Pick area ∝ reported guitars a year. Colour and letter = what the place is best known for.</span>
      </>}
      {layer === 'exports' && <span className="ga-leg-note">Circle area ∝ export value, 2023 (HS 920290). Shaded: the five largest exporters. *Mexico uses a wider heading and excludes electric guitars.</span>}
      {layer === 'wood' && <span className="ga-leg-note">Leaves: where each tonewood grows. Routes: the factories it is best known in. Hover a leaf for its story.</span>}
      {layer === 'history' && <span className="ga-leg-note">Hatched: the countries that built most of the world&rsquo;s guitars in each era. Picks: the factories that defined it.</span>}
    </div>
  );
}

/* ───────────── the charts ───────────── */

function ExportBars() {
  const [ref, w] = useWidth<HTMLDivElement>();
  const [hov, setHov] = useState<number | null>(null);
  const rest = EXPORTS_2023.world - EXPORTS_2023.rows.reduce((a, r) => a + r.usd, 0);
  const rows = [...EXPORTS_2023.rows.map((r) => ({ name: r.name, usd: r.usd, note: r.note })), { name: 'Rest of world', usd: rest, note: 'about 100 other exporters' }];
  const L = Math.min(118, w * 0.34), R = 16, bh = 22, gap = 12, top = 6;
  const max = 350, H = top + rows.length * (bh + gap) + 24;
  const x = (v: number) => L + (v / max) * (w - L - R);
  const ticks = [0, 100, 200, 300];
  return (
    <div ref={ref} className="ga-chart">
      {w > 0 && (
        <svg width={w} height={H} role="img" aria-label="Bar chart of guitar exports by country, 2023">
          {ticks.map((v) => <g key={v}><line x1={x(v)} x2={x(v)} y1={top} y2={H - 20} className="ga-gridline" /><text x={x(v)} y={H - 4} textAnchor="middle" className="ga-axis">{v === 0 ? '$0' : `$${v}M`}</text></g>)}
          {rows.map((r, i) => {
            const y = top + i * (bh + gap);
            return (
              <g key={r.name} onPointerEnter={() => setHov(i)} onPointerLeave={() => setHov(null)}>
                <rect x={0} y={y - gap / 2} width={w} height={bh + gap} fill="transparent" />
                <text x={L - 10} y={y + bh / 2 + 4} textAnchor="end" className="ga-axis ga-axis--cat">{r.name}</text>
                <path d={`M${x(0)} ${y}H${x(r.usd) - 4}a4 4 0 0 1 4 4v${bh - 8}a4 4 0 0 1 -4 4H${x(0)}Z`} className={`ga-bar ${i === rows.length - 1 ? 'ga-bar--rest' : ''} ${hov !== null && hov !== i ? 'is-faded' : ''}`} />
                {(i === 0 || i === rows.length - 1 || hov === i) && <text x={x(r.usd) + 6} y={y + bh / 2 + 4} className="ga-val">${r.usd}M{i === 0 ? ` · ${((r.usd / EXPORTS_2023.world) * 100).toFixed(1)}%` : ''}</text>}
              </g>
            );
          })}
        </svg>
      )}
      {hov !== null && rows[hov]!.note && <p className="ga-chart-note">{rows[hov]!.name}: {rows[hov]!.note}</p>}
      <p className="ga-foot">World total ${EXPORTS_2023.world}M. <Cite id="trend-920290" /></p>
    </div>
  );
}

function UnitBars({ rows, onPick }: { rows: Site[]; onPick: (id: string) => void }) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const [hov, setHov] = useState<number | null>(null);
  const L = Math.min(150, w * 0.4), R = 20, bh = 20, gap = 12, top = 6;
  const max = 6_500_000, H = top + rows.length * (bh + gap) + 24;
  const x = (v: number) => L + (v / max) * (w - L - R);
  return (
    <div ref={ref} className="ga-chart">
      <div className="ga-keyrow">{KINDS.map((k) => <span key={k.id} className="ga-kind"><svg viewBox="-10 -10 20 20"><path d={pick(8)} style={{ fill: `var(--ga-${k.id[0]})` }} /><text y="3.4" textAnchor="middle">{k.glyph}</text></svg>{k.label}</span>)}</div>
      {w > 0 && (
        <svg width={w} height={H} role="img" aria-label="Bar chart of published annual guitar output by place">
          {[0, 2e6, 4e6, 6e6].map((v) => <g key={v}><line x1={x(v)} x2={x(v)} y1={top} y2={H - 20} className="ga-gridline" /><text x={x(v)} y={H - 4} textAnchor="middle" className="ga-axis">{v ? `${v / 1e6} M` : '0'}</text></g>)}
          {rows.map((s, i) => {
            const y = top + i * (bh + gap);
            const end = Math.max(x(s.units!), x(0) + 5);
            return (
              <g key={s.id} className="ga-rowhit" onPointerEnter={() => setHov(i)} onPointerLeave={() => setHov(null)} onClick={() => onPick(s.id)}>
                <rect x={0} y={y - gap / 2} width={w} height={bh + gap} fill="transparent" />
                <text x={L - 10} y={y + bh / 2 + 4} textAnchor="end" className="ga-axis ga-axis--cat">{s.name.split(',')[0]}</text>
                <path d={`M${x(0)} ${y}H${end - 4}a4 4 0 0 1 4 4v${bh - 8}a4 4 0 0 1 -4 4H${x(0)}Z`} className={`ga-kbar ga-kbar--${s.kind} ${hov !== null && hov !== i ? 'is-faded' : ''}`} />
                {s.id === 'zhengan' && <><line x1={x(2.4e6)} x2={x(2.4e6)} y1={y - 3} y2={y + bh + 3} className="ga-range" /><text x={x(2.4e6)} y={y - 5} textAnchor="middle" className="ga-axis ga-axis--tiny">2026 report</text></>}
                {(i === 0 || hov === i) && <text x={end + 6} y={y + bh / 2 + 4} className="ga-val">{s.approx ? '≈' : ''}{fmtUnits(s.units!)}</text>}
                {i !== 0 && hov !== i && s.approx && <text x={end + 6} y={y + bh / 2 + 4} className="ga-axis">≈</text>}
              </g>
            );
          })}
        </svg>
      )}
      <p className="ga-chart-note">{hov !== null ? `${rows[hov]!.who}${rows[hov]!.unitsNote ? ` — ${rows[hov]!.unitsNote}` : ''}. Click to find it on the map.` : 'Hover a bar for what the figure covers; click to find it on the map.'}</p>
    </div>
  );
}

/* ───────────── brands, and the table ───────────── */

function BrandFinder({ brand, setBrand, onShow, onPlace }: { brand: string | null; setBrand: (b: string | null) => void; onShow: (b: string) => void; onPlace: (site: string) => void }) {
  const b = BRANDS.find((x) => x.id === brand) ?? null;
  return (
    <div className="ga-bf">
      <div className="ga-bf-list" role="listbox" aria-label="Brand">
        {BRANDS.map((x) => <button key={x.id} role="option" aria-selected={brand === x.id} className={`ga-bf-b ${brand === x.id ? 'is-on' : ''}`} onClick={() => setBrand(brand === x.id ? null : x.id)}>{x.name}</button>)}
      </div>
      <div className="ga-bf-out">
        {!b && <p className="ga-muted">Pick a brand to see where each line is built.</p>}
        {b && (
          <>
            <ol className="ga-bf-lines">
              {b.lines.map((l) => (
                <li key={l.line}>
                  <b>{l.line}</b>
                  <span>{l.places.map((p, i) => <span key={p.label}>{i > 0 && ' · '}{p.site ? <button className="ga-inline" onClick={() => onPlace(p.site!)}>{p.label}</button> : p.label}</span>)}</span>
                </li>
              ))}
            </ol>
            <button className="ga-cta" onClick={() => onShow(b.id)}>Show {b.name} on the map ↑</button>
          </>
        )}
      </div>
    </div>
  );
}

function SiteTable({ onPick }: { onPick: (id: string) => void }) {
  const rows = [...SITES].sort((a, b) => (b.units ?? 0) - (a.units ?? 0) || a.country.localeCompare(b.country));
  return (
    <div className="ga-tablewrap">
      <table className="ga-table">
        <thead><tr><th>Place</th><th>Country</th><th>Who</th><th>Best known for</th><th className="num">Guitars a year</th></tr></thead>
        <tbody>
          {rows.map((s) => (
            <tr key={s.id} onClick={() => onPick(s.id)}>
              <td><button className="ga-inline">{s.name}</button></td><td>{s.country}</td><td>{s.who}</td><td>{KIND_LABEL[s.kind].label}</td>
              <td className="num">{s.units ? `${s.approx ? '≈' : ''}${fmtUnits(s.units)}` : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ───────────── the header illustration ───────────── */

function HeroGuitar() {
  return (
    <svg className="ga-hero-art" viewBox="0 0 420 360" role="img" aria-label="An illustrated acoustic guitar with a map pin">
      <defs>
        <linearGradient id="ga-top" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor="#f1c98c" /><stop offset="1" stopColor="#d99a52" /></linearGradient>
        <linearGradient id="ga-neck" x1="0" x2="1"><stop offset="0" stopColor="#6b3f22" /><stop offset="1" stopColor="#4a2a16" /></linearGradient>
        <pattern id="ga-grain" width="40" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(-38)"><path d="M0 4 Q 10 2 20 4 T 40 4" fill="none" stroke="#b77a3c" strokeWidth="0.7" opacity="0.45" /></pattern>
      </defs>
      <g className="ga-hero-float">
        <g transform="rotate(-38 210 190)">
          {/* body */}
          <path d="M150 170c-34 0-58 26-52 62 4 24 22 34 22 52 0 20-24 30-24 58 0 40 44 62 114 62s114-22 114-62c0-28-24-38-24-58 0-18 18-28 22-52 6-36-18-62-52-62-20 0-32 10-60 10s-40-10-60-10z" transform="translate(-10 -20) scale(0.82)" fill="url(#ga-top)" stroke="#3a2412" strokeWidth="3" />
          <path d="M150 170c-34 0-58 26-52 62 4 24 22 34 22 52 0 20-24 30-24 58 0 40 44 62 114 62s114-22 114-62c0-28-24-38-24-58 0-18 18-28 22-52 6-36-18-62-52-62-20 0-32 10-60 10s-40-10-60-10z" transform="translate(-10 -20) scale(0.82)" fill="url(#ga-grain)" />
          <circle cx="175" cy="238" r="27" fill="#2b1a0e" stroke="#7a4b24" strokeWidth="5" />
          <circle cx="175" cy="238" r="33" fill="none" stroke="#3a2412" strokeWidth="1.2" strokeDasharray="2 3" />
          <rect x="150" y="300" width="50" height="10" rx="3" fill="#3a2412" />
          {/* neck and head */}
          <rect x="164" y="20" width="22" height="210" fill="url(#ga-neck)" stroke="#2a170b" strokeWidth="2" />
          {[40, 66, 90, 112, 132, 150, 166, 180, 193].map((y) => <line key={y} x1="164" x2="186" y1={y} y2={y} stroke="#d8d2c6" strokeWidth="1.4" />)}
          <path d="M160 22 L158 -40 Q175 -52 192 -40 L190 22 Z" fill="#4a2a16" stroke="#2a170b" strokeWidth="2" />
          {[-30, -12, 6].map((y) => <g key={y}><circle cx="152" cy={y} r="5" fill="#e8e2d4" stroke="#2a170b" /><circle cx="198" cy={y} r="5" fill="#e8e2d4" stroke="#2a170b" /></g>)}
          {/* strings */}
          {[0, 1, 2, 3, 4, 5].map((i) => <line key={i} className="ga-string" style={{ animationDelay: `${i * 0.09}s` }} x1={167.5 + i * 3} x2={167.5 + i * 3} y1="-20" y2="305" stroke="#f5f0e6" strokeWidth={1.4 - i * 0.12} />)}
        </g>
      </g>
      {/* a map pin and a little globe of dotted meridians */}
      <g transform="translate(330 70)">
        <circle r="44" className="ga-hero-globe" />
        <ellipse rx="18" ry="44" className="ga-hero-globe-l" /><ellipse rx="36" ry="44" className="ga-hero-globe-l" />
        <line x1="-44" x2="44" className="ga-hero-globe-l" /><path d="M-38 -22H38M-38 22H38" className="ga-hero-globe-l" />
        <path d={pick(16)} transform="translate(8 -8)" className="ga-pick ga-pick--acoustic" />
      </g>
      <g className="ga-notes" aria-hidden>
        <text x="40" y="70">♪</text><text x="86" y="40">♫</text><text x="360" y="200">♩</text>
      </g>
    </svg>
  );
}
