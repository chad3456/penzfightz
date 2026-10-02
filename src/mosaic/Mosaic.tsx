import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { buildMosaic, TOTAL, type MosaicData } from './build';
import { Tiles, type Light } from './render';
import { EYE, H, PALETTE, REGIONS, W, type Region } from './scene';

/**
 * TESSERAE: Ayodhya, laid by hand.
 *
 * A mosaic laid one tessera at a time in the browser, with no image or video
 * model: the cartoon is drawn with canvas paths, cut into exactly 7,446
 * tiles by a weighted centroidal Voronoi tessellation, and each tile is
 * pressed into a mortar bed in turn. It starts with the eye.
 */

const REGION_NAME: Record<Region, string> = {
  eye: 'The eye', sun: 'Sun rays', sky: 'Sky', vimana: 'Pushpaka', himalaya: 'Himavat', temple: 'Temples', city: 'Ayodhya', sarayu: 'Sarayu', kuru: 'Kurukshetra', border: 'Frame',
};

type Caption = { i: number; title: string; body: string };

class Clicker {
  ctx: AudioContext | null = null;
  on = false;
  last = 0;
  click(rate: number) {
    if (!this.on) return;
    const now = performance.now();
    if (now - this.last < Math.max(45, 1000 / Math.min(rate, 22))) return;
    this.last = now;
    if (!this.ctx) { const C = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext; if (!C) return; this.ctx = new C(); }
    const c = this.ctx, t = c.currentTime, len = Math.floor(c.sampleRate * 0.03), buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 6);
    const s = c.createBufferSource(); s.buffer = buf;
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1800 + Math.random() * 2600; f.Q.value = 3;
    const g = c.createGain(); g.gain.value = 0.5;
    s.connect(f).connect(g).connect(c.destination); s.start(t);
  }
}

function schedule(d: MosaicData) {
  const t = new Float64Array(d.n);
  let acc = 0.8;
  for (let i = 0; i < d.n; i++) {
    t[i] = acc;
    let dt: number;
    if (i < 9) dt = 0.42;
    else if (i < d.eyeCount) dt = Math.max(0.035, 0.17 * Math.exp(-(i - 9) / 38));
    else dt = Math.max(1 / 260, 0.075 * Math.exp(-(i - d.eyeCount) / 240));
    if (i === 8) dt += 0.9;
    if (i === 21) dt += 0.7;
    if (i === d.eyeCount - 1) dt += 0.9;
    acc += dt;
  }
  return t;
}

function captions(d: MosaicData): Caption[] {
  const first: Partial<Record<Region, number>> = {};
  let kuru = 0;
  for (let i = 0; i < d.n; i++) { const r = REGIONS[d.region[i]]; if (first[r] === undefined) first[r] = i; if (r === 'kuru') kuru++; }
  let k = 0, kuruMid = d.n;
  for (let i = 0; i < d.n; i++) if (REGIONS[d.region[i]] === 'kuru' && ++k > kuru * 0.6) { kuruMid = i; break; }
  const c: Caption[] = [
    { i: 0, title: 'Tile 1', body: 'A mosaic begins at the point everything else will answer to. This one begins with an eye.' },
    { i: 9, title: 'Nine tiles: the pupil', body: 'Eight tesserae of black glass and one of white marble, the catchlight that makes an eye look back at you.' },
    { i: 22, title: 'A ring of gold', body: 'Gold smalti is gold leaf sealed between two layers of glass. Each piece is set at a slightly different angle, so the gold flickers as the light moves. Move your pointer over the panel to move the lamp.' },
    { i: d.eyeCount, title: 'The eye is the sun', body: 'The Rigveda (1.115.1) calls Surya "the eye of Mitra, of Varuna, of Agni". Ayodhya\'s kings were the Suryavamsha, the solar line of Ikshvaku, and Rama is of that line.' },
  ];
  const add = (r: Region, title: string, body: string) => { if (first[r] !== undefined && first[r]! >= d.eyeCount) c.push({ i: first[r]!, title, body }); };
  add('sky', 'Andamento', 'The sky goes down in courses that curve around the sun. Mosaicists call the flow of the rows andamento. A gradient is faked with bands of a few colours, mixing the two neighbours where the bands meet.');
  add('vimana', 'The Pushpaka vimana', 'The flying chariot that carries Rama, Sita and Lakshmana home to Ayodhya after Lanka. Popular tradition links the lamps of Diwali to that homecoming.');
  add('himalaya', 'Himavat', 'The snow mountains that close Bharatavarsha to the north in the Puranic picture of the world.');
  add('temple', 'Shikhara', 'A Nagara temple tower with its ribbed amalaka and gold kalash. Licence: this style is centuries younger than the epics, so the panel shows Ayodhya the way later Indian art imagined it.');
  add('city', 'Ayodhya', '"The unconquerable." Valmiki (Bala Kanda, sarga 5) gives the city as twelve yojanas long and three wide, with broad, well-laid royal roads, gates, ramparts and moats, founded by Manu on the Sarayu.');
  add('sarayu', 'The Sarayu', 'The river of Kosala. The sun\'s reflection is laid in broken strokes of gold, so it shimmers when the light moves.');
  add('kuru', 'Kurukshetra', '"Then, standing in a great chariot yoked with white horses, Madhava and the son of Pandu blew their divine conches." Bhagavad Gita 1.14.');
  if (kuruMid < d.n) c.push({ i: kuruMid, title: 'The monkey banner', body: 'The Gita (1.20) calls Arjuna kapi-dhvaja, "whose banner bears the monkey": Hanuman rides his flag. The Mahabharata also retells the whole Rama story, the Ramopakhyana in the Vana Parva, so the two epics share this wall.' });
  add('border', 'The frame', 'Three courses: slate, a chequer of terracotta and cream, and a line of gold.');
  return c.sort((a, b) => a.i - b.i);
}

export function Mosaic({ onExit }: { onExit: () => void }) {
  const [data, setData] = useState<MosaicData | null>(null);
  const [err, setErr] = useState('');
  const [laid, setLaid] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [follow, setFollow] = useState(true);
  const [sound, setSound] = useState(false);
  const [panel, setPanel] = useState(true);
  const cvRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const st = useRef({ clock: 0, started: 0, baked: 0, cam: { x: EYE.x, y: EYE.y, s: 10 }, light: { x: 260, y: 160, h: 520 } as Light, pointer: null as null | { x: number; y: number; t: number }, view: { cx: 0, cy: 0, w: 1, h: 1 }, playing: true, speed: 1, follow: true, regionLaid: new Array(REGIONS.length).fill(0) as number[] });
  const tilesRef = useRef<Tiles | null>(null);
  const timesRef = useRef<Float64Array | null>(null);
  const clicker = useRef(new Clicker());

  useEffect(() => { st.current.playing = playing; }, [playing]);
  useEffect(() => { st.current.speed = speed; }, [speed]);
  useEffect(() => { st.current.follow = follow; }, [follow]);
  useEffect(() => { clicker.current.on = sound; }, [sound]);

  useEffect(() => {
    const ls = ['/fonts-sacred/fonts.css', '/fonts-guitar/fonts.css'].map((href) => { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; document.head.appendChild(l); return l; });
    let worker: Worker | null = null, done = false;
    const finish = (d: MosaicData) => { if (done) return; done = true; tilesRef.current = new Tiles(d); timesRef.current = schedule(d); setData(d); };
    try {
      worker = new Worker(new URL('./mosaic.worker.ts', import.meta.url), { type: 'module' });
      worker.onmessage = (e) => finish(e.data as MosaicData);
      worker.onerror = () => { try { finish(buildMosaic()); } catch (x) { setErr(String(x)); } };
      worker.postMessage(0);
    } catch {
      setTimeout(() => { try { finish(buildMosaic()); } catch (x) { setErr(String(x)); } }, 30);
    }
    return () => { done = true; worker?.terminate(); ls.forEach((l) => l.remove()); };
  }, []);

  const caps = useMemo(() => (data ? captions(data) : []), [data]);
  const regionTotals = useMemo(() => { const t = new Array(REGIONS.length).fill(0); if (data) for (let i = 0; i < data.n; i++) t[data.region[i]]++; return t; }, [data]);
  const stats = useMemo(() => {
    if (!data) return { gold: 0, smalti: 0, stone: 0 };
    let gold = 0, smalti = 0, stone = 0;
    for (let i = 0; i < data.n; i++) { if (data.metal[i]) gold++; else if (PALETTE[data.col[i]].mat === 'smalti') smalti++; else stone++; }
    return { gold, smalti, stone };
  }, [data]);

  const fitScale = useCallback(() => {
    const v = st.current.view;
    return Math.min(v.w / W, v.h / H) * 0.96;
  }, []);

  /* the loop */
  useEffect(() => {
    if (!data) return;
    const cv = cvRef.current!, wrap = wrapRef.current!, tiles = tilesRef.current!, times = timesRef.current!;
    const c = cv.getContext('2d')!;
    let raf = 0, last = performance.now(), lastUi = 0, alive = true, crispKey = '';
    const crisp = document.createElement('canvas');
    const s = st.current;
    const viewRect = (vw: number, vh: number) => {
      const pe = panelRef.current, top = 56;
      if (vw > 900 && pe) { const w = vw - pe.offsetWidth - 40; s.view = { cx: w / 2 + 8, cy: top + (vh - top) / 2, w, h: vh - top - 8 }; }
      else if (pe) { const h = vh - pe.offsetHeight - top - 16; s.view = { cx: vw / 2, cy: top + h / 2, w: vw, h }; }
      else s.view = { cx: vw / 2, cy: vh / 2, w: vw, h: vh };
    };
    const resize = () => { const dpr = Math.min(2, window.devicePixelRatio || 1); cv.width = Math.round(wrap.clientWidth * dpr); cv.height = Math.round(wrap.clientHeight * dpr); };
    resize();
    const ro = new ResizeObserver(resize); ro.observe(wrap);
    s.cam.s = Math.min(wrap.clientWidth, wrap.clientHeight) / 70;

    const frame = (now: number) => {
      if (!alive) return;
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (s.playing) s.clock += dt * s.speed;
      const dur = Math.max(0.09, 0.36 / Math.sqrt(s.speed));
      while (s.started < data.n && times[s.started] <= s.clock) s.started++;
      let bakedNow = 0;
      while (s.baked < s.started && s.clock - times[s.baked] >= dur) { tiles.bake(s.baked); s.regionLaid[data.region[s.baked]]++; s.baked++; bakedNow++; }
      if (bakedNow) clicker.current.click(bakedNow / Math.max(dt, 0.001));

      /* camera */
      const vw = wrap.clientWidth, vh = wrap.clientHeight;
      viewRect(vw, vh);
      const V = s.view, fit = Math.min(V.w / W, V.h / H) * 0.96;
      if (s.follow) {
        const front = s.started ? data.key[Math.min(data.n - 1, s.started - 1)] : 6;
        const Rv = Math.max(24, front * 1.12 + 18);
        const target = Math.max(fit, Math.min(V.w, V.h) / (2 * Rv));
        const hw = V.w / (2 * target), hh = V.h / (2 * target);
        const tx = hw * 2 >= W ? W / 2 : Math.max(hw, Math.min(W - hw, EYE.x));
        const ty = hh * 2 >= H ? H / 2 : Math.max(hh, Math.min(H - hh, EYE.y));
        const k = 1 - Math.exp(-dt * 2.6);
        s.cam.s = Math.exp(Math.log(s.cam.s) + (Math.log(target) - Math.log(s.cam.s)) * k);
        s.cam.x += (tx - s.cam.x) * k; s.cam.y += (ty - s.cam.y) * k;
      }
      /* the lamp: candlelight drifting, or the pointer */
      const p = s.pointer;
      if (p && now - p.t < 4000) { s.light.x += (p.x - s.light.x) * 0.25; s.light.y += (p.y - s.light.y) * 0.25; s.light.h = 300; }
      else { const a = now / 5200; s.light.x = W / 2 + Math.cos(a) * 520 + Math.sin(now / 370) * 6; s.light.y = H * 0.45 + Math.sin(a * 0.8) * 560; s.light.h = 560 + Math.sin(now / 230) * 10; }

      /* draw */
      const dpr = cv.width / Math.max(1, vw), sc = s.cam.s * dpr;
      const ox = (V.cx - s.cam.x * s.cam.s) * dpr, oy = (V.cy - s.cam.y * s.cam.s) * dpr;
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.fillStyle = '#100d0a'; c.fillRect(0, 0, cv.width, cv.height);
      c.setTransform(sc, 0, 0, sc, ox, oy);
      c.fillStyle = 'rgba(0,0,0,0.5)'; c.fillRect(8, 12, W, H);
      c.imageSmoothingEnabled = true;
      const u0 = -ox / sc - 14, v0 = -oy / sc - 14, u1 = (cv.width - ox) / sc + 14, v1 = (cv.height - oy) / sc + 14;
      const vis = (i: number) => data.cx[i] > u0 && data.cx[i] < u1 && data.cy[i] > v0 && data.cy[i] < v1;
      if (sc > 2.6) {
        // close up, stone and glass are drawn as vectors; cached until the view or the work changes
        const key = `${ox.toFixed(1)},${oy.toFixed(1)},${sc.toFixed(4)},${s.baked},${cv.width}x${cv.height}`;
        if (key !== crispKey) {
          crispKey = key;
          if (crisp.width !== cv.width || crisp.height !== cv.height) { crisp.width = cv.width; crisp.height = cv.height; }
          const k = crisp.getContext('2d')!;
          k.setTransform(1, 0, 0, 1, 0, 0); k.clearRect(0, 0, crisp.width, crisp.height);
          k.setTransform(sc, 0, 0, sc, ox, oy);
          k.drawImage(tiles.bed, 0, 0, W, H);
          for (let i = 0; i < s.baked; i++) if (!data.metal[i] && vis(i)) tiles.drawStone(k, i, true);
          if (sc > 9 && tiles.grain) { k.fillStyle = tiles.grain; k.fillRect(Math.max(0, u0), Math.max(0, v0), Math.min(W, u1) - Math.max(0, u0), Math.min(H, v1) - Math.max(0, v0)); }
        }
        c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(crisp, 0, 0); c.setTransform(sc, 0, 0, sc, ox, oy);
      } else c.drawImage(tiles.bed, 0, 0, W, H);
      for (const i of tiles.metals) { if (i >= s.baked) break; if (vis(i)) tiles.drawMetal(c, i, s.light); }
      for (let i = s.baked; i < s.started; i++) {
        const q = Math.max(0, Math.min(1, (s.clock - times[i]) / dur)), e = 1 - Math.pow(1 - q, 3), cx = data.cx[i], cy = data.cy[i], k = 1 + 0.55 * (1 - e);
        c.save();
        c.globalAlpha = Math.min(1, q * 4);
        c.translate(cx, cy - (1 - e) * 16); c.scale(k, k); c.translate(-cx, -cy);
        if (data.metal[i]) tiles.drawMetal(c, i, s.light); else tiles.drawStone(c, i, false);
        c.restore();
      }
      const g = c.createRadialGradient(s.light.x, s.light.y, 40, s.light.x, s.light.y, 1100);
      g.addColorStop(0, 'rgba(255,236,200,0.42)'); g.addColorStop(0.5, 'rgba(128,110,90,0.12)'); g.addColorStop(1, 'rgba(0,0,0,0.42)');
      c.globalCompositeOperation = 'soft-light'; c.fillStyle = g; c.fillRect(0, 0, W, H); c.globalCompositeOperation = 'source-over';

      if (now - lastUi > 90) { lastUi = now; setLaid(s.baked); }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { alive = false; cancelAnimationFrame(raf); ro.disconnect(); };
  }, [data]);

  /* pointer: light, pan, zoom */
  useEffect(() => {
    const cv = cvRef.current; if (!cv || !data) return;
    const s = st.current;
    const toUnits = (e: { clientX: number; clientY: number }) => {
      const r = cv.getBoundingClientRect();
      return { x: (e.clientX - r.left - s.view.cx) / s.cam.s + s.cam.x, y: (e.clientY - r.top - s.view.cy) / s.cam.s + s.cam.y };
    };
    const pts = new Map<number, { x: number; y: number }>();
    let pinch = 0;
    const down = (e: PointerEvent) => { cv.setPointerCapture(e.pointerId); pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = Math.hypot(a.x - b.x, a.y - b.y); } };
    const move = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') { const u = toUnits(e); s.pointer = { ...u, t: performance.now() }; }
      const prev = pts.get(e.pointerId);
      if (!prev) return;
      if (pts.size === 1) {
        const dx = e.clientX - prev.x, dy = e.clientY - prev.y;
        if (Math.abs(dx) + Math.abs(dy) > 0) { s.cam.x -= dx / s.cam.s; s.cam.y -= dy / s.cam.s; if (s.follow) setFollow(false); }
      } else if (pts.size === 2) {
        pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
        const [a, b] = [...pts.values()], d = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinch > 0) { s.cam.s = Math.max(fitScale() * 0.6, Math.min(60, s.cam.s * (d / pinch))); if (s.follow) setFollow(false); }
        pinch = d;
        return;
      }
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    };
    const up = (e: PointerEvent) => { pts.delete(e.pointerId); pinch = 0; };
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      const u = toUnits(e), k = Math.exp(-e.deltaY * 0.0015);
      const ns = Math.max(fitScale() * 0.6, Math.min(60, s.cam.s * k));
      s.cam.x = u.x - (u.x - s.cam.x) * (s.cam.s / ns); s.cam.y = u.y - (u.y - s.cam.y) * (s.cam.s / ns); s.cam.s = ns;
      if (s.follow) setFollow(false);
    };
    const dbl = () => { setFollow(false); s.cam.x = W / 2; s.cam.y = H / 2; s.cam.s = fitScale(); };
    const leave = () => { s.pointer = null; };
    cv.addEventListener('pointerdown', down); cv.addEventListener('pointermove', move); cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('pointerleave', leave); cv.addEventListener('wheel', wheel, { passive: false }); cv.addEventListener('dblclick', dbl);
    return () => {
      cv.removeEventListener('pointerdown', down); cv.removeEventListener('pointermove', move); cv.removeEventListener('pointerup', up); cv.removeEventListener('pointercancel', up);
      cv.removeEventListener('pointerleave', leave); cv.removeEventListener('wheel', wheel); cv.removeEventListener('dblclick', dbl);
    };
  }, [data, fitScale]);

  const s = st.current;
  const finishAll = () => {
    const tiles = tilesRef.current, times = timesRef.current; if (!tiles || !times || !data) return;
    for (let i = s.baked; i < data.n; i++) { tiles.bake(i); s.regionLaid[data.region[i]]++; }
    s.baked = s.started = data.n; s.clock = times[data.n - 1] + 1; setLaid(data.n); setFollow(true);
  };
  const replay = () => {
    const tiles = tilesRef.current; if (!tiles) return;
    tiles.resetBed(); s.baked = s.started = 0; s.clock = 0; s.regionLaid.fill(0); s.cam = { x: EYE.x, y: EYE.y, s: s.cam.s }; setLaid(0); setFollow(true); setPlaying(true);
  };
  const zoom = (k: number) => { s.cam.s = Math.max(fitScale() * 0.6, Math.min(60, s.cam.s * k)); setFollow(false); };

  const cap = [...caps].reverse().find((c) => c.i <= laid) ?? caps[0];
  const doneAll = data && laid >= data.n;

  return (
    <div className="mo-root">
      <div className="mo-stage" ref={wrapRef}>
        <canvas ref={cvRef} className="mo-canvas" aria-label="A mosaic of Ayodhya being laid tile by tile" />
        {!data && !err && (
          <div className="mo-load">
            <div className="mo-load-dot" />
            <p>Mixing the mortar and cutting {TOTAL.toLocaleString('en-IN')} tesserae…</p>
          </div>
        )}
        {err && <div className="mo-load"><p>Could not cut the tiles: {err}</p></div>}
      </div>

      <header className="mo-top">
        <button className="mo-btn mo-btn--ghost" onClick={onExit}>← Shelf</button>
        <div className="mo-title"><b>Tesserae</b><span>Ayodhya, laid by hand</span></div>
        <div className="mo-count" aria-live="off">
          <span className="mo-count-n">{laid.toLocaleString('en-IN').padStart(5, '0')}</span>
          <span className="mo-count-of">/ {TOTAL.toLocaleString('en-IN')} tiles</span>
        </div>
      </header>

      {data && (
        <aside ref={panelRef} className={`mo-panel ${panel ? '' : 'mo-panel--min'}`}>
          <button className="mo-panel-tog" onClick={() => setPanel((v) => !v)} aria-label={panel ? 'Hide story' : 'Show story'}>{panel ? '▾' : '▴'}</button>
          {panel && (
            <>
              <p className="mo-cap-k">{doneAll ? 'Finished' : cap.i === 0 ? 'Tile 1' : `From tile ${cap.i.toLocaleString('en-IN')}`}</p>
              <h2 className="mo-cap-t">{doneAll ? `${TOTAL.toLocaleString('en-IN')} tiles` : cap.title}</h2>
              <p className="mo-cap-b">
                {doneAll
                  ? `The last tessera is in: ${stats.gold.toLocaleString('en-IN')} of gold glass, ${stats.smalti.toLocaleString('en-IN')} of coloured glass and ${stats.stone.toLocaleString('en-IN')} of stone, cut and set by code in your browser. Move the light across the gold, zoom in to see the joints, or lay it again.`
                  : cap.body}
              </p>
              <div className="mo-legend">
                {REGIONS.map((r, i) => regionTotals[i] > 0 && (
                  <div key={r} className="mo-leg">
                    <span>{REGION_NAME[r]}</span>
                    <span className="mo-bar"><i style={{ width: `${(100 * Math.min(s.regionLaid[i], regionTotals[i])) / regionTotals[i]}%` }} /></span>
                    <span className="mo-leg-n">{regionTotals[i].toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            </>
          )}
          <div className="mo-ctrls">
            <button className="mo-btn" onClick={() => (doneAll ? replay() : setPlaying((v) => !v))}>{doneAll ? '↺ Lay again' : playing ? '❚❚ Pause' : '▶ Lay'}</button>
            <div className="mo-seg" role="group" aria-label="Speed">
              {[1, 4, 16].map((v) => <button key={v} className={speed === v ? 'on' : ''} onClick={() => setSpeed(v)}>{v}×</button>)}
            </div>
            {!doneAll && <button className="mo-btn mo-btn--ghost" onClick={finishAll}>Finish ⏭</button>}
            <button className={`mo-btn mo-btn--ghost ${follow ? 'on' : ''}`} onClick={() => setFollow(true)} title="Camera follows the work">◎ Follow</button>
            <button className="mo-btn mo-btn--ghost" onClick={() => zoom(1.4)} aria-label="Zoom in">+</button>
            <button className="mo-btn mo-btn--ghost" onClick={() => zoom(1 / 1.4)} aria-label="Zoom out">−</button>
            <button className={`mo-btn mo-btn--ghost ${sound ? 'on' : ''}`} onClick={() => setSound((v) => !v)} aria-label="Sound">{sound ? '🔊' : '🔈'}</button>
          </div>
        </aside>
      )}
    </div>
  );
}
