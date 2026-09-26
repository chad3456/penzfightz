import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { BOUTS, NAMES, type Bout } from './bouts';
import { makeRenderer, Stage } from './stage';
import type { Who } from './mascot';

/**
 * NaMo vs RaGa — the page.
 *
 * A shelf of a hundred collectible dioramas, each rendered once into a
 * thumbnail as the page loads. Open one and it comes alive: the two of them
 * go at it, the lines pop up over their heads in turn, and a stamp says who
 * won the round. Arrows step through them; Play all runs the lot.
 */

const THUMB = 360;
type Filter = 'all' | 'm' | 'r' | 'other';

function winnerLabel(w: Bout['win']) {
  if (w === 'm' || w === 'r') return `${NAMES[w]} wins`;
  if (w === 'Draw') return 'Draw';
  return `Winner: ${w}`;
}

/** How long each line stays up: long enough to read, not so long it drags. */
function timings(b: Bout) {
  const out: number[] = [];
  let t = 0.6;
  for (const [, l] of b.lines) {
    out.push(t);
    t += 1.3 + l.length * 0.045;
  }
  out.push(t);
  return out;
}

class Blips {
  ctx: AudioContext | null = null;
  on = true;
  play(who: Who) {
    if (!this.on) return;
    this.ctx ||= new AudioContext();
    const c = this.ctx;
    const t = c.currentTime;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = 'square';
    const f = who === 'm' ? 220 : 330;
    for (let i = 0; i < 4; i++) o.frequency.setValueAtTime(f * (1 + ((i * 7) % 5) * 0.12), t + i * 0.06);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.05, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.26);
    const lp = c.createBiquadFilter();
    lp.frequency.value = 1400;
    o.connect(lp).connect(g).connect(c.destination);
    o.start(t);
    o.stop(t + 0.3);
  }
  stamp() {
    if (!this.on || !this.ctx) return;
    const c = this.ctx;
    const t = c.currentTime;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(90, t);
    o.frequency.exponentialRampToValueAtTime(40, t + 0.2);
    g.gain.setValueAtTime(0.25, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    o.connect(g).connect(c.destination);
    o.start(t);
    o.stop(t + 0.35);
  }
}

export function Banter({ onExit }: { onExit: () => void }) {
  const [thumbs, setThumbs] = useState<(string | null)[]>(() => BOUTS.map(() => null));
  const [filter, setFilter] = useState<Filter>('all');
  const [open, setOpen] = useState<number | null>(null);
  const [playAll, setPlayAll] = useState(false);
  const [sound, setSound] = useState(true);
  const blips = useRef(new Blips());
  useEffect(() => { blips.current.on = sound; }, [sound]);

  // the thumbnails: one offscreen renderer, a few dioramas a frame
  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = THUMB;
    const r = makeRenderer(canvas, true);
    r.setPixelRatio(1);
    r.setSize(THUMB, THUMB, false);
    const stage = new Stage();
    let i = 0;
    let raf = 0;
    let dead = false;
    const out: (string | null)[] = BOUTS.map(() => null);
    const step = () => {
      if (dead) return;
      const t0 = performance.now();
      let changed = false;
      while (i < BOUTS.length && performance.now() - t0 < 24) {
        const d = stage.show(BOUTS[i]!);
        d.update(0.9 + (i % 5) * 0.23);
        stage.yaw = 0;
        stage.frame(1);
        r.render(stage.scene, stage.camera);
        out[i] = canvas.toDataURL('image/jpeg', 0.86);
        i++;
        changed = true;
      }
      if (changed) setThumbs(out.slice());
      if (i < BOUTS.length) raf = requestAnimationFrame(step);
      else r.dispose();
    };
    raf = requestAnimationFrame(step);
    return () => { dead = true; cancelAnimationFrame(raf); r.dispose(); };
  }, []);

  const list = useMemo(() => BOUTS.filter((b) => filter === 'all' || (filter === 'other' ? b.win !== 'm' && b.win !== 'r' : b.win === filter)), [filter]);
  const tally = useMemo(() => ({ m: BOUTS.filter((b) => b.win === 'm').length, r: BOUTS.filter((b) => b.win === 'r').length }), []);
  const ready = thumbs.every(Boolean);

  const poster = useCallback(async () => {
    const cols = 10;
    const cell = 220;
    const head = 190;
    const c = document.createElement('canvas');
    c.width = cols * cell;
    c.height = head + Math.ceil(BOUTS.length / cols) * (cell + 34);
    const g = c.getContext('2d')!;
    g.fillStyle = '#fbe3c0';
    g.fillRect(0, 0, c.width, c.height);
    g.fillStyle = '#2a1a10';
    g.textAlign = 'center';
    g.font = '900 italic 92px Futura, "Avenir Next", "Arial Black", sans-serif';
    g.fillText('NaMo vs RaGa', c.width / 2, 110);
    g.font = '700 30px Futura, "Avenir Next", Arial, sans-serif';
    g.fillText(`100 rounds of banter · NaMo ${tally.m} · RaGa ${tally.r} · everybody else ${100 - tally.m - tally.r} · satire, all lines invented`, c.width / 2, 160);
    const imgs = await Promise.all(thumbs.map((src) => new Promise<HTMLImageElement>((res) => { const im = new Image(); im.onload = () => res(im); im.src = src!; })));
    imgs.forEach((im, i) => {
      const x = (i % cols) * cell;
      const y = head + Math.floor(i / cols) * (cell + 34);
      g.drawImage(im, x + 6, y + 6, cell - 12, cell - 12);
      g.font = '700 17px Futura, "Avenir Next", Arial, sans-serif';
      let label = `${i + 1}. ${BOUTS[i]!.title}`;
      while (g.measureText(label).width > cell - 14) label = label.slice(0, -2) + '…';
      g.fillText(label, x + cell / 2, y + cell + 18);
    });
    c.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'namo-vs-raga-100-rounds.png';
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    }, 'image/png');
  }, [thumbs, tally]);

  useEffect(() => {
    if (open != null) return;
    const on = (e: KeyboardEvent) => { if (e.key === 'Escape') onExit(); };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, [open, onExit]);

  return (
    <div className="nb">
      <header className="nb__head">
        <button className="nb__back" onClick={onExit}>← back to the shelf</button>
        <p className="nb__kicker">a hundred rounds of banter · all in good fun</p>
        <h1 className="nb__title">NaMo <span>vs</span> RaGa</h1>
        <p className="nb__sub">Kurta versus T-shirt: two vinyl-toy caricatures going at it over chai, cricket, kites, selfies, yatras, yoga and the odd pillow. Tap a round to watch it.</p>
        <div className="nb__score">
          <div className="nb__side nb__side--m"><b>{tally.m}</b><span>NaMo wins</span></div>
          <div className="nb__side nb__side--o"><b>{100 - tally.m - tally.r}</b><span>draws &amp; everybody else</span></div>
          <div className="nb__side nb__side--r"><b>{tally.r}</b><span>RaGa wins</span></div>
        </div>
        <div className="nb__bar">
          {(['all', 'm', 'r', 'other'] as Filter[]).map((f) => (
            <button key={f} className={filter === f ? 'is-on' : ''} onClick={() => setFilter(f)}>
              {f === 'all' ? 'All 100' : f === 'other' ? 'Draws & others' : `${NAMES[f]} wins`}
            </button>
          ))}
          <span className="nb__gap" />
          <button className="nb__play" onClick={() => { setPlayAll(true); setOpen(list[0]?.n ?? 1); }}>▶ Play all</button>
          <button onClick={poster} disabled={!ready}>{ready ? '⤓ Save poster' : `drawing ${thumbs.filter(Boolean).length}/100…`}</button>
        </div>
      </header>
      <main className="nb__grid">
        {list.map((b) => (
          <button key={b.n} className="nb-card" onClick={() => { setPlayAll(false); setOpen(b.n); }}>
            <div className="nb-card__img">
              {thumbs[b.n - 1] ? <img src={thumbs[b.n - 1]!} alt={`Round ${b.n}: ${b.title}`} loading="lazy" /> : <span className="nb-card__wait">{b.n}</span>}
              <i className={`nb-card__win nb-card__win--${b.win === 'm' || b.win === 'r' ? b.win : 'o'}`}>{b.win === 'm' || b.win === 'r' ? NAMES[b.win] : b.win === 'Draw' ? 'Draw' : '★'}</i>
            </div>
            <p className="nb-card__n">Round {b.n}</p>
            <h3 className="nb-card__t">{b.title}</h3>
            <p className="nb-card__q">“{b.lines[0]![1]}”</p>
          </button>
        ))}
      </main>
      <footer className="nb__foot">
        Satire. These are cartoon mascots, not likenesses, and every line is invented for them — neither man said any of it. Both get teased, both land their jabs, and the rounds are split evenly. No party symbols, no nicknames, nothing sharper than a pillow.
      </footer>
      {open != null && (
        <Viewer
          n={open}
          playAll={playAll}
          blips={blips.current}
          sound={sound}
          setSound={setSound}
          order={list.map((b) => b.n)}
          onGo={setOpen}
          onClose={() => { setOpen(null); setPlayAll(false); }}
          onPlayAll={setPlayAll}
        />
      )}
    </div>
  );
}

function Viewer({ n, order, playAll, blips, sound, setSound, onGo, onClose, onPlayAll }: {
  n: number; order: number[]; playAll: boolean; blips: Blips; sound: boolean; setSound: (v: boolean) => void;
  onGo: (n: number) => void; onClose: () => void; onPlayAll: (v: boolean) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const bub = useRef<Record<Who, HTMLDivElement | null>>({ m: null, r: null });
  const engine = useRef<{ stage: Stage; renderer: THREE.WebGLRenderer; start: number; yaw: number } | null>(null);
  const bout = BOUTS[n - 1]!;
  const [line, setLine] = useState(-1);
  const [done, setDone] = useState(false);
  const idx = order.indexOf(n);
  const go = useCallback((d: number) => {
    const k = order[(idx + d + order.length) % order.length];
    if (k != null) onGo(k);
  }, [idx, order, onGo]);

  // the renderer lives as long as the viewer is open
  useEffect(() => {
    const el = host.current!;
    const canvas = document.createElement('canvas');
    canvas.className = 'nb-view__canvas';
    el.prepend(canvas);
    const renderer = makeRenderer(canvas);
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    const stage = new Stage();
    engine.current = { stage, renderer, start: performance.now(), yaw: 0 };
    (window as unknown as { __banter?: unknown }).__banter = engine.current;
    const fit = () => renderer.setSize(el.clientWidth, el.clientHeight, false);
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    let drag: { x: number; moved: boolean } | null = null;
    const down = (e: PointerEvent) => { drag = { x: e.clientX, moved: false }; canvas.setPointerCapture(e.pointerId); };
    const move = (e: PointerEvent) => {
      if (!drag || !engine.current) return;
      const dx = e.clientX - drag.x;
      if (Math.abs(dx) > 4) drag.moved = true;
      engine.current.yaw = Math.max(-1.1, Math.min(1.1, engine.current.yaw - dx * 0.006));
      drag.x = e.clientX;
    };
    const up = () => { drag = null; };
    canvas.addEventListener('pointerdown', down);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    return () => { ro.disconnect(); renderer.dispose(); canvas.remove(); engine.current = null; };
  }, []);

  // a new round: rebuild, restart the clock
  useEffect(() => {
    const e = engine.current;
    if (!e) return;
    e.stage.show(bout);
    e.start = performance.now();
    setLine(-1);
    setDone(false);
  }, [bout]);

  // the animation loop
  useEffect(() => {
    const times = timings(bout);
    let raf = 0;
    let shown = -1;
    let stamped = false;
    const v = new THREE.Vector3();
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const e = engine.current;
      const el = host.current;
      if (!e || !e.stage.current || !el) return;
      const t = (performance.now() - e.start) / 1000;
      let li = -1;
      for (let i = 0; i < bout.lines.length; i++) if (t >= times[i]!) li = i;
      if (li !== shown) {
        shown = li;
        setLine(li);
        if (li >= 0) blips.play(bout.lines[li]![0]);
      }
      if (!stamped && t >= times[bout.lines.length]!) {
        stamped = true;
        setDone(true);
        blips.stamp();
      }
      const speaking = li >= 0 && t < times[li + 1]! - 0.3 ? bout.lines[li]![0] : undefined;
      const d = e.stage.current;
      d.update(t, speaking);
      const w = el.clientWidth;
      const h = el.clientHeight;
      e.stage.yaw = e.yaw + Math.sin(t * 0.35) * 0.1;
      e.stage.frame(w / Math.max(1, h));
      e.renderer.render(e.stage.scene, e.stage.camera);
      // the bubbles ride above their heads, and stack if they would overlap
      const box: Record<Who, { x: number; cx: number; cy: number; bw: number; bh: number } | null> = { m: null, r: null };
      for (const who of ['m', 'r'] as Who[]) {
        const b = bub.current[who];
        if (!b) continue;
        const mm = who === 'm' ? d.m : d.r;
        mm.head.getWorldPosition(v);
        v.y += 1.25;
        v.project(e.stage.camera);
        const x = (v.x * 0.5 + 0.5) * w;
        const y = (-v.y * 0.5 + 0.5) * h;
        const bw = b.offsetWidth;
        const bh = b.offsetHeight;
        box[who] = { x, bw, bh, cx: Math.max(10, Math.min(w - bw - 10, x - bw / 2)), cy: Math.max(70, Math.min(h - bh - 90, y - bh)) };
      }
      const bm = box.m;
      const br = box.r;
      if (bm && br && bm.cx < br.cx + br.bw && br.cx < bm.cx + bm.bw && bm.cy < br.cy + br.bh && br.cy < bm.cy + bm.bh) br.cy = bm.cy + bm.bh + 16;
      for (const who of ['m', 'r'] as Who[]) {
        const b = bub.current[who];
        const q = box[who];
        if (!b || !q) continue;
        b.style.transform = `translate(${q.cx}px, ${q.cy}px)`;
        b.style.setProperty('--tail', `${Math.max(18, Math.min(q.bw - 18, q.x - q.cx))}px`);
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [bout, blips]);

  // play all: move on a beat after the stamp
  useEffect(() => {
    if (!playAll || !done) return;
    const id = setTimeout(() => go(1), 2200);
    return () => clearTimeout(id);
  }, [playAll, done, go]);

  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === ' ') { e.preventDefault(); onPlayAll(!playAll); }
      if (e.key === 'r' || e.key === 'R') { if (engine.current) engine.current.start = performance.now(); setDone(false); setLine(-1); }
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, [go, onClose, onPlayAll, playAll]);

  // the latest line for each of them
  const last: Record<Who, string | null> = { m: null, r: null };
  let lastWho: Who | null = null;
  for (let i = 0; i <= line; i++) { const [w, l] = bout.lines[i]!; last[w] = l; lastWho = w; }
  const win = bout.win;

  return (
    <div className="nb-view" ref={host} role="dialog" aria-label={`Round ${bout.n}: ${bout.title}`}>
      {(['m', 'r'] as Who[]).map((w) => (
        <div
          key={w}
          ref={(el) => { bub.current[w] = el; }}
          className={`nb-bub nb-bub--${w} ${last[w] ? 'is-on' : ''} ${lastWho === w ? 'is-now' : ''}`}
        >
          <b>{NAMES[w]}</b>
          <span key={last[w] || ''}>{last[w]}</span>
        </div>
      ))}
      <header className="nb-view__top">
        <div>
          <p className="nb-view__n">Round {bout.n} of 100</p>
          <h2 className="nb-view__t">{bout.title}</h2>
        </div>
        <button className="nb-view__x" onClick={onClose} aria-label="close">✕</button>
      </header>
      {done && (
        <div className={`nb-stamp nb-stamp--${win === 'm' || win === 'r' ? win : 'o'}`} key={bout.n}>
          {winnerLabel(win)}
        </div>
      )}
      <footer className="nb-view__bar">
        <button onClick={() => go(-1)} aria-label="previous round">◀</button>
        <button onClick={() => { if (engine.current) engine.current.start = performance.now(); setDone(false); setLine(-1); }}>↺ again</button>
        <button className={playAll ? 'is-on' : ''} onClick={() => onPlayAll(!playAll)}>{playAll ? '❚❚ pause' : '▶ play all'}</button>
        <button onClick={() => setSound(!sound)} aria-label={sound ? 'mute' : 'sound on'}>{sound ? '🔊' : '🔇'}</button>
        <button onClick={() => go(1)} aria-label="next round">▶</button>
      </footer>
    </div>
  );
}
