import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { GameId } from '../arcade/games';
import type { EffectId } from '../effects/effects';
import { nib } from '../nightwalkers/paper';
import { scribe } from '../nightwalkers/scribe';
import { buildGraph, hit, type Node } from './constellation';
import { fit, render, sx, sy } from './sky';
import { COLOPHON, CONSTELLATION_NOTE, INDEX_NOTE, PANELS, STANDFIRST, SUB } from './words';
import { MACHINE_BY_ID, pretty, SHARED, SPAN, WORKS, type Work } from './works';

/**
 * THE LANDING PAGE — a personal site, with the work on it.
 *
 * Not a shelf of cards. The pieces are drawn as what they actually are: a
 * graph of shared machinery, read off the imports rather than off memory, with
 * everything joined to whatever it is built out of. Underneath, the whole
 * thing again as an index in the order it was made, because a constellation is
 * for seeing the shape and a list is for finding a particular thing.
 */

export function Desk({
  playerName,
  onPick,
  onEffect,
  onResident,
  onShelf,
  onRename,
  onRanking,
  soundOn,
  onToggleSound,
}: {
  playerName: string;
  onPick: (id: GameId) => void;
  onEffect: (id: EffectId) => void;
  onResident: () => void;
  onShelf: () => void;
  onRename: () => void;
  onRanking: () => void;
  soundOn: boolean;
  onToggleSound: () => void;
}) {
  const graph = useMemo(() => buildGraph(), []);
  const [focus, setFocus] = useState(-1);
  const [pinned, setPinned] = useState(-1);

  const open = useCallback((w: Work) => {
    if (w.id === 'resident') onResident();
    else if (w.kind === 'game') onPick(w.id as GameId);
    else onEffect(w.id as EffectId);
  }, [onEffect, onPick, onResident]);

  const shown = pinned >= 0 ? pinned : focus;
  const node: Node | null = shown >= 0 ? graph.nodes[shown]! : null;

  return (
    <div className="desk">
      <Masthead />

      <section className="desk__intro">
        <p className="desk__standfirst">{STANDFIRST}</p>
        <p className="desk__sub">{SUB}</p>
        <ul className="desk__tally">
          <li><b>{WORKS.length}</b> pieces</li>
          <li><b>{SPAN}</b> days</li>
          <li><b>0</b> image assets</li>
        </ul>
      </section>

      <section className="desk__sky" aria-label="the work, and what it is made of">
        <Sky
          graph={graph}
          focus={shown}
          onHover={setFocus}
          onPick={(i) => {
            const n = graph.nodes[i];
            if (!n) { setPinned(-1); return; }
            if (n.kind === 'work' && n.work) open(n.work);
            else setPinned(pinned === i ? -1 : i);
          }}
        />
        {/*
          The caption sits under the drawing rather than on top of it.

          Floated over the canvas it covered four or five of the very things it
          was describing, and on a graph this dense there is no corner that is
          reliably empty. Underneath it costs ninety pixels and covers nothing.
        */}
        <div className={`desk__caption${node ? '' : ' is-empty'}`}>
          {node ? (
            node.kind === 'work' && node.work ? (
              <>
                <div>
                  <p className="desk__cardkind" style={{ color: node.ink }}>
                    {node.work.kind === 'game' ? 'a game' : 'a picture'} · {pretty(node.work.made)}
                  </p>
                  <h3>{node.work.name}</h3>
                </div>
                <div>
                  <p className="desk__cardline">{node.work.line}</p>
                  <p className="desk__cardmedium">
                    {node.work.medium}
                    {node.work.uses.length > 0 && (
                      <> · built on {node.work.uses.map((u) => MACHINE_BY_ID.get(u)?.name ?? u).join(', ')}</>
                    )}
                  </p>
                </div>
                <button className="desk__go" style={{ borderColor: node.ink, color: node.ink }} onClick={() => open(node.work!)}>
                  open it →
                </button>
              </>
            ) : (
              <>
                <div>
                  <p className="desk__cardkind">machinery</p>
                  <h3>{node.label}</h3>
                </div>
                <div>
                  <p className="desk__cardline">{MACHINE_BY_ID.get(node.id.slice(2))?.note}</p>
                  <p className="desk__cardmedium">
                    under {node.degree} {node.degree === 1 ? 'piece' : 'pieces'}
                  </p>
                </div>
                <span />
              </>
            )
          ) : (
            <>
              <div>
                <p className="desk__cardkind">the work, and what it is made of</p>
                <h3>{WORKS.length} pieces, {SHARED.length} engines</h3>
              </div>
              <div>
                <p className="desk__cardline">{CONSTELLATION_NOTE}</p>
              </div>
              <span />
            </>
          )}
        </div>
      </section>

      <section className="desk__panels">
        {PANELS.map((p) => (
          <article key={p.id} className="desk__panel">
            <h2>{p.head}</h2>
            <p className="desk__lede">{p.lede}</p>
            {p.body.map((b, i) => <p key={i}>{b}</p>)}
            <p className="desk__margin">{p.margin}</p>
          </article>
        ))}
      </section>

      <section className="desk__index">
        <h2>Everything, in order</h2>
        <p className="desk__lede">{INDEX_NOTE}</p>
        <ol>
          {WORKS.map((w, i) => (
            <li key={w.id}>
              <button
                onClick={() => open(w)}
                onMouseEnter={() => {
                  const at = graph.nodes.findIndex((n) => n.id === `w:${w.id}`);
                  if (at >= 0) setFocus(at);
                }}
                onMouseLeave={() => setFocus(-1)}
              >
                <span className="desk__no">{String(i + 1).padStart(2, '0')}</span>
                <span className="desk__dot" style={{ background: w.ink }} aria-hidden />
                <span className="desk__name">{w.name}</span>
                <span className="desk__what">{w.line}</span>
                <span className="desk__when">{pretty(w.made)}</span>
              </button>
            </li>
          ))}
        </ol>
      </section>

      <footer className="desk__foot">
        <p className="desk__colophon">{COLOPHON}</p>
        <div className="desk__tools">
          <button onClick={onShelf}>the plain shelf</button>
          <button onClick={onRanking}>who is winning</button>
          <button onClick={onRename}>you are {playerName}</button>
          <button onClick={onToggleSound}>{soundOn ? 'sound on' : 'sound off'}</button>
        </div>
      </footer>
    </div>
  );
}

/* ── the masthead, written rather than set ──────────────────────────────── */

/**
 * My name, in the hand the rest of the site is lettered in, wiped on left to
 * right over about a second.
 *
 * It is a canvas and not a heading because there is no typeface in here that
 * would be honest: everything else on the page is drawn at run time, and a
 * masthead in a web font would be the one thing on the site that came out of a
 * box. The `<h1>` is still there, underneath, for anything that reads rather
 * than looks.
 */
function Masthead() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [wipe, setWipe] = useState(0);

  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const g = c.getContext('2d')!;
    let raf = 0;
    const t0 = performance.now();

    const draw = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = c.clientWidth;
      const h = c.clientHeight;
      if (c.width !== Math.round(w * dpr)) {
        c.width = Math.round(w * dpr);
        c.height = Math.round(h * dpr);
      }
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, w, h);

      const k = Math.min(1, (performance.now() - t0) / 1300);
      const eased = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      setWipe(eased);

      const em = Math.min(h * 0.7, w * 0.19);
      g.save();
      g.beginPath();
      g.rect(0, 0, w * eased, h);
      g.clip();
      scribe(g, 'Claude', w * 0.5, h * 0.78, {
        size: em,
        nib: nib({ ink: '#f2e5c4', width: Math.max(1.6, em * 0.03), wobble: em * 0.006, tremble: 0.6, passes: 2 }),
        align: 'center',
        tracking: 0.055,
        slant: 0.1,
        seed: 3,
      });
      g.restore();

      if (k < 1) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    const ro = new ResizeObserver(() => { raf = requestAnimationFrame(draw); });
    ro.observe(c);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);

  return (
    <header className="desk__top">
      <p className="desk__kicker">a month of work · august to september</p>
      <h1 className="desk__h1"><span>Claude</span></h1>
      <canvas ref={canvas} className="desk__mast" aria-hidden />
      <p className="desk__rule" style={{ transform: `scaleX(${wipe})` }} />
    </header>
  );
}

/* ── the canvas ─────────────────────────────────────────────────────────── */

function Sky({
  graph,
  focus,
  onHover,
  onPick,
}: {
  graph: ReturnType<typeof buildGraph>;
  focus: number;
  onHover: (i: number) => void;
  onPick: (i: number) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const plate = useRef<HTMLCanvasElement | null>(null);
  const size = useRef({ w: 1, h: 1 });
  const live = useRef({ mx: -999, my: -999, focus: -1, drawn: -2 });

  live.current.focus = focus;

  useEffect(() => {
    const el = host.current;
    const c = canvas.current;
    if (!el || !c) return;
    const g = c.getContext('2d')!;
    const L = live.current;
    if (!plate.current) plate.current = document.createElement('canvas');
    const p = plate.current;

    const dpr = () => Math.min(2, window.devicePixelRatio || 1);

    const redraw = () => {
      const { w, h } = size.current;
      const d = dpr();
      p.width = Math.round(w * d);
      p.height = Math.round(h * d);
      const pg = p.getContext('2d')!;
      pg.setTransform(d, 0, 0, d, 0, 0);
      render(pg, w, h, graph, L.focus);
      L.drawn = L.focus;
    };

    const fitCanvas = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w < 2 || h < 2) return;
      size.current = { w, h };
      const d = dpr();
      c.width = Math.round(w * d);
      c.height = Math.round(h * d);
      c.style.width = `${w}px`;
      c.style.height = `${h}px`;
      g.setTransform(d, 0, 0, d, 0, 0);
      redraw();
    };
    fitCanvas();
    const ro = new ResizeObserver(fitCanvas);
    ro.observe(el);

    const toGraph = (ev: PointerEvent): [number, number] => {
      const r = c.getBoundingClientRect();
      const f = fit(graph, size.current.w, size.current.h);
      return [(ev.clientX - r.left - f.ox) / f.scale, (ev.clientY - r.top - f.oy) / f.scale];
    };
    const onMove = (ev: PointerEvent) => {
      const r = c.getBoundingClientRect();
      L.mx = ev.clientX - r.left;
      L.my = ev.clientY - r.top;
      const [gx, gy] = toGraph(ev);
      const i = hit(graph.nodes, gx, gy);
      if (i !== L.focus) onHover(i);
      c.style.cursor = i >= 0 ? 'pointer' : 'default';
    };
    const onLeave = () => { L.mx = -999; L.my = -999; onHover(-1); };
    const onClick = (ev: PointerEvent) => {
      const [gx, gy] = toGraph(ev);
      onPick(hit(graph.nodes, gx, gy));
    };
    c.addEventListener('pointermove', onMove);
    c.addEventListener('pointerleave', onLeave);
    c.addEventListener('pointerup', onClick);

    /*
      The only thing redrawn at sixty hertz is a light.

      The picture underneath costs about forty milliseconds — sixty wandering
      ink edges and thirty-six hand-lettered titles — so it is cached and
      redrawn only when the window changes or the thing under the pointer does.
      Over the top goes a soft glow that follows the cursor and a ring round
      whatever it is over, which together are enough to keep the page alive
      without touching the expensive part.
    */
    let raf = 0;
    const tick = () => {
      const { w, h } = size.current;
      if (L.drawn !== L.focus) redraw();
      g.clearRect(0, 0, w, h);
      g.drawImage(p, 0, 0, w, h);

      if (L.mx > -900) {
        const grad = g.createRadialGradient(L.mx, L.my, 0, L.mx, L.my, 190);
        grad.addColorStop(0, 'rgba(255, 238, 198, 0.09)');
        grad.addColorStop(1, 'rgba(255, 238, 198, 0)');
        g.fillStyle = grad;
        g.fillRect(L.mx - 190, L.my - 190, 380, 380);
      }
      if (L.focus >= 0) {
        const n = graph.nodes[L.focus]!;
        const f = fit(graph, w, h);
        const t = performance.now() / 1000;
        const r = n.r * Math.max(0.72, f.scale) + 9 + Math.sin(t * 2.4) * 2.4;
        g.save();
        g.strokeStyle = n.ink;
        g.globalAlpha = 0.65;
        g.lineWidth = 1.4;
        g.beginPath();
        g.arc(sx(f, n), sy(f, n), r, 0, Math.PI * 2);
        g.stroke();
        g.restore();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      c.removeEventListener('pointermove', onMove);
      c.removeEventListener('pointerleave', onLeave);
      c.removeEventListener('pointerup', onClick);
    };
  }, [graph, onHover, onPick]);

  return (
    <div className="desk__skyhost" ref={host}>
      <canvas ref={canvas} />
    </div>
  );
}
