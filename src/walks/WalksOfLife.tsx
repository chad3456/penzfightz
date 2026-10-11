/**
 * Walks of Life — a gallery of American scenes drawn in code, in ligne
 * claire: a public library, a Brooklyn brownstone, the night shift, a
 * campus quad, a field trip, a laundromat, a California pier and a Friday
 * night football game. Every person in every plate has a line about who
 * they are; hover or tap to meet them.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PLATES as WALKS, type Plate, type Who } from './plates';

const RES = 2;
type View = { k: 'wall' } | { k: 'plate'; i: number };

/** What a gallery is: its plates, its words, and what its hotspots are called. */
export interface GalleryConfig { plates: Plate[]; title: string; sub: string; heading: string; intro: string; prefix: string; noun: string; markLabel: string; listLabel: string; hint: string }

/* ───────── painting, cached ───────── */

let fontsReady: Promise<void> | null = null;
function loadFonts() {
  if (!fontsReady) {
    fontsReady = (async () => {
      if (!document.querySelector('link[data-wl-fonts]')) { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = '/fonts-sacred/fonts.css'; l.dataset.wlFonts = '1'; document.head.appendChild(l); }
      await Promise.all(['600 40px Cinzel', 'italic 30px "Cormorant Garamond"', '400 30px "Cormorant Garamond"'].map((f) => document.fonts.load(f).catch(() => [])));
    })();
  }
  return fontsReady;
}
const big = new Map<string, { c: HTMLCanvasElement; who: Who[] }>();
const small = new Map<string, HTMLCanvasElement>();
function paintAt(p: Plate, k: number) {
  const c = document.createElement('canvas'); c.width = Math.round(p.w * k); c.height = Math.round(p.h * k);
  const g = c.getContext('2d')!; g.scale(k, k); const who: Who[] = []; p.paint(g, who); return { c, who };
}
function getBig(p: Plate) { let v = big.get(p.key); if (!v) { v = paintAt(p, RES); big.set(p.key, v); } return v; }
function getSmall(p: Plate) { let v = small.get(p.key); if (!v) { v = paintAt(p, 600 / p.w).c; small.set(p.key, v); } return v; }

function usePainted<T>(make: () => T, deps: unknown[]) {
  const [v, set] = useState<T | null>(null);
  useEffect(() => { let live = true; set(null); loadFonts().then(() => new Promise((r) => setTimeout(r, 20))).then(() => { if (live) set(make()); }); return () => { live = false; }; // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return v;
}

/* ───────── the wall ───────── */

function Thumb({ p, onOpen }: { p: Plate; onOpen: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const img = usePainted(() => getSmall(p), [p.key]);
  useEffect(() => { const c = ref.current; if (!c || !img) return; c.width = img.width; c.height = img.height; c.getContext('2d')!.drawImage(img, 0, 0); }, [img]);
  return (
    <figure className="wl-piece">
      <button className="wl-frame" onClick={onOpen} aria-label={`Open ${p.title}`} style={{ aspectRatio: `${p.w} / ${p.h}` }}>
        <canvas ref={ref} />
        {!img && <span className="wl-wait">drawing…</span>}
      </button>
      <figcaption>
        <strong>{p.title}</strong>
        <span className="wl-place">{p.place}</span>
        <span className="wl-blurb">{p.blurb}</span>
      </figcaption>
    </figure>
  );
}

function Wall({ go, cfg }: { go: (v: View) => void; cfg: GalleryConfig }) {
  const PLATES = cfg.plates;
  return (
    <div className="wl-wall">
      <header className="wl-intro">
        <h2>{cfg.heading}</h2>
        <p>{cfg.intro}</p>
      </header>
      <div className="wl-grid">
        {PLATES.map((p, i) => <Thumb key={p.key} p={p} onOpen={() => go({ k: 'plate', i })} />)}
      </div>
    </div>
  );
}

/* ───────── the viewer ───────── */

function Viewer({ i, go, cfg }: { i: number; go: (v: View) => void; cfg: GalleryConfig }) {
  const PLATES = cfg.plates;
  const p = PLATES[i];
  const painted = usePainted(() => getBig(p), [p.key]);
  const box = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState({ w: 800, h: 600 });
  const [cam, setCam] = useState({ z: 0, x: 0, y: 0 });
  const [sel, setSel] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [marks, setMarks] = useState(false);
  const [list, setList] = useState(false);
  const fit = useMemo(() => Math.min(size.w / p.w, size.h / p.h), [size, p]);
  const who = painted?.who ?? [];

  useEffect(() => { const el = box.current; if (!el) return; const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight })); ro.observe(el); setSize({ w: el.clientWidth, h: el.clientHeight }); return () => ro.disconnect(); }, []);
  const reset = useCallback(() => setCam({ z: fit, x: (size.w - p.w * fit) / 2, y: (size.h - p.h * fit) / 2 }), [fit, size, p]);
  useEffect(() => { reset(); setSel(null); }, [p.key, size.w, size.h]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { const c = cv.current; if (!c || !painted) return; c.width = painted.c.width; c.height = painted.c.height; c.getContext('2d')!.drawImage(painted.c, 0, 0); }, [painted]);

  const clampCam = useCallback((z: number, x: number, y: number) => {
    const zz = Math.max(fit, Math.min(fit * 5, z));
    const w = p.w * zz, h = p.h * zz;
    const cx = w <= size.w ? (size.w - w) / 2 : Math.min(0, Math.max(size.w - w, x));
    const cy = h <= size.h ? (size.h - h) / 2 : Math.min(0, Math.max(size.h - h, y));
    return { z: zz, x: cx, y: cy };
  }, [fit, size, p]);
  const zoomAt = useCallback((f: number, px: number, py: number) => setCam((c) => { const z = c.z * f; const nz = clampCam(z, 0, 0).z; const k = nz / c.z; return clampCam(nz, px - (px - c.x) * k, py - (py - c.y) * k); }), [clampCam]);
  const flyTo = useCallback((w: Who) => { const z = Math.max(fit * 2.6, Math.min(fit * 5, fit * 3)); setCam(clampCam(z, size.w / 2 - w.x * z, size.h / 2 - w.y * z)); }, [fit, size, clampCam]);

  // wheel, drag and pinch
  useEffect(() => {
    const el = box.current; if (!el) return;
    const onWheel = (e: WheelEvent) => { e.preventDefault(); const r = el.getBoundingClientRect(); zoomAt(Math.exp(-e.deltaY * 0.0015), e.clientX - r.left, e.clientY - r.top); };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [zoomAt]);
  const ptrs = useRef(new Map<number, { x: number; y: number }>());
  const moved = useRef(0);
  const onDown = (e: React.PointerEvent) => { (e.target as Element).setPointerCapture?.(e.pointerId); ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY }); moved.current = 0; };
  const onMove = (e: React.PointerEvent) => {
    const m = ptrs.current; const prev = m.get(e.pointerId); if (!prev) return;
    const r = box.current!.getBoundingClientRect();
    if (m.size === 1) { const dx = e.clientX - prev.x, dy = e.clientY - prev.y; moved.current += Math.abs(dx) + Math.abs(dy); setCam((c) => clampCam(c.z, c.x + dx, c.y + dy)); }
    else if (m.size === 2) { const [a, b] = [...m.values()]; const other = a === prev ? b : a; const d0 = Math.hypot(prev.x - other.x, prev.y - other.y), d1 = Math.hypot(e.clientX - other.x, e.clientY - other.y); if (d0 > 0) zoomAt(d1 / d0, (e.clientX + other.x) / 2 - r.left, (e.clientY + other.y) / 2 - r.top); moved.current += 10; }
    m.set(e.pointerId, { x: e.clientX, y: e.clientY });
  };
  const onUp = (e: React.PointerEvent) => { ptrs.current.delete(e.pointerId); };

  // keys
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { if (sel !== null) setSel(null); else go({ k: 'wall' }); }
      if (e.key === 'ArrowRight') go({ k: 'plate', i: (i + 1) % PLATES.length });
      if (e.key === 'ArrowLeft') go({ k: 'plate', i: (i + PLATES.length - 1) % PLATES.length });
      if (e.key === '+' || e.key === '=') zoomAt(1.3, size.w / 2, size.h / 2);
      if (e.key === '-') zoomAt(1 / 1.3, size.w / 2, size.h / 2);
    };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, [i, go, sel, zoomAt, size]);

  const download = () => { if (!painted) return; painted.c.toBlob((b) => { if (!b) return; const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `${cfg.prefix}-${p.key}.png`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); }, 'image/png'); };
  const shown = sel ?? hover;

  return (
    <div className="wl-viewer">
      <div className="wl-bar">
        <button onClick={() => go({ k: 'wall' })}>← All plates</button>
        <div className="wl-name"><strong>{p.title}</strong><span>{p.place} · {who.length} {cfg.noun}</span></div>
        <div className="wl-tools">
          <button onClick={() => go({ k: 'plate', i: (i + PLATES.length - 1) % PLATES.length })} aria-label="Previous plate">‹</button>
          <span className="wl-count">{i + 1} / {PLATES.length}</span>
          <button onClick={() => go({ k: 'plate', i: (i + 1) % PLATES.length })} aria-label="Next plate">›</button>
          <button onClick={() => zoomAt(1 / 1.4, size.w / 2, size.h / 2)} aria-label="Zoom out">−</button>
          <button onClick={() => zoomAt(1.4, size.w / 2, size.h / 2)} aria-label="Zoom in">+</button>
          <button onClick={reset}>Fit</button>
          <button className={marks ? 'on' : ''} onClick={() => setMarks((m) => !m)} aria-pressed={marks}>{cfg.markLabel}</button>
          <button className={list ? 'on' : ''} onClick={() => setList((m) => !m)} aria-pressed={list}>{cfg.listLabel}</button>
          <button onClick={download} disabled={!painted}>Download</button>
        </div>
      </div>
      <div className="wl-main">
        <div className="wl-stage" ref={box} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onClick={() => { if (moved.current < 6) setSel(null); }}>
          <div className="wl-layer" style={{ width: p.w, height: p.h, transform: `translate(${cam.x}px, ${cam.y}px) scale(${cam.z})` }}>
            <canvas ref={cv} style={{ width: p.w, height: p.h }} />
            {who.map((w, k) => (
              <button key={k} className={`wl-spot${marks ? ' marked' : ''}${shown === k ? ' on' : ''}`} style={{ left: w.x - w.r, top: w.y - w.r, width: w.r * 2, height: w.r * 2, ['--z' as string]: String(cam.z) }}
                aria-label={w.name}
                onPointerEnter={(e) => { if (e.pointerType === 'mouse') setHover(k); }} onPointerLeave={() => setHover(null)}
                onClick={(e) => { e.stopPropagation(); if (moved.current < 6) setSel(k === sel ? null : k); }} />
            ))}
          </div>
          {!painted && <div className="wl-wait big">drawing {p.title}…</div>}
          {shown !== null && who[shown] && (
            <aside className="wl-card" role="status">
              <strong>{who[shown].name}</strong>
              <p>{who[shown].line}</p>
            </aside>
          )}
          <p className="wl-hint">{cfg.hint}</p>
        </div>
        {list && (
          <ol className="wl-list">
            {who.map((w, k) => <li key={k}><button className={sel === k ? 'on' : ''} onClick={() => { setSel(k); flyTo(w); }}>{w.name}</button></li>)}
          </ol>
        )}
      </div>
    </div>
  );
}

/* ───────── the room ───────── */

export function Gallery({ cfg, onExit }: { cfg: GalleryConfig; onExit: () => void }) {
  const PLATES = cfg.plates;
  const [view, setView] = useState<View>(() => { const k = new URLSearchParams(location.search).get('plate'); const i = PLATES.findIndex((p) => p.key === k); return i >= 0 ? { k: 'plate', i } : { k: 'wall' }; });
  const go = useCallback((v: View) => { setView(v); window.scrollTo(0, 0); }, []);
  useEffect(() => { loadFonts(); }, []);
  return (
    <div className={`wl${view.k === 'plate' ? ' wl--view' : ''}`}>
      <header className="wl-top">
        <button className="wl-exit" onClick={onExit}>← Exit</button>
        <div className="wl-title"><span>{cfg.title}</span><em>{cfg.sub}</em></div>
      </header>
      {view.k === 'wall' ? <Wall go={go} cfg={cfg} /> : <Viewer i={view.i} go={go} cfg={cfg} />}
    </div>
  );
}

const WALKS_CFG: GalleryConfig = {
  plates: WALKS, title: 'Walks of Life', sub: 'American scenes in ink and flat colour', heading: 'Walks of Life',
  intro: 'Eight scenes of American life, drawn line by line in code, in the clean-ink, flat-colour manner of editorial illustration. Everyone in them has a story: open a plate, then hover over or tap anyone to meet them.',
  prefix: 'walks-of-life', noun: 'people', markLabel: 'Mark people', listLabel: 'Who’s here', hint: 'Drag to look around · scroll or pinch to zoom · hover or tap anyone',
};

export default function WalksOfLife({ onExit }: { onExit: () => void }) {
  return <Gallery cfg={WALKS_CFG} onExit={onExit} />;
}
