import { useEffect, useRef, useState } from 'react';
import { makePen, letter, line, measure, wrap } from './pen';
import { Frame, bird, cloud, flying, house, moon, owl, portal, stamp, star, witch, cat, broom } from './art';
import { ABOUT, CLASSIFIEDS, COVER_LINES, HOROSCOPES, SPREADS, type Spread } from './content';

/**
 * WITCHWORLD WEEKLY — THE EARTH ISSUE, 2026. A magazine and the portfolio of
 * its correspondent, Hazel Mothwick, drawn throughout with one wobbly pen.
 * Fly her broom across Earth, land at ten very strange modern things, collect
 * the stamps, read the issue, and post a card home by owl.
 */

type View = 'cover' | 'fly' | 'issue' | 'about' | 'post';
const PAPER = '#fdfcf8';
const WORLD_W = 9200;

/** A word or two in Hazel's hand, for buttons and labels. */
function Hand({ text, size = 18, seed = 1 }: { text: string; size?: number; seed?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current!;
    const d = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.ceil(measure(text, size) + size * 0.8), h = Math.ceil(size * 1.6);
    cv.width = w * d; cv.height = h * d; cv.style.width = w + 'px'; cv.style.height = h + 'px';
    const g = cv.getContext('2d')!; g.scale(d, d);
    const pen = makePen(g); pen.width = Math.max(1.4, size * 0.09); pen.wobble = 0.8;
    letter(pen, text, size * 0.35, size * 0.3, { size, seed });
  }, [text, size, seed]);
  return <canvas ref={ref} aria-hidden="true" className="ww-hand" />;
}

export function Witchworld({ onExit }: { onExit: () => void }) {
  const cvRef = useRef<HTMLCanvasElement>(null);
  const [view, setView] = useState<View>('cover');
  const [open, setOpen] = useState<Spread | null>(null);
  const [page, setPage] = useState(0);
  const [got, setGot] = useState<Set<string>>(() => { try { return new Set(JSON.parse(localStorage.getItem('witchworld-stamps') || '[]')); } catch { return new Set(); } });
  const [still, setStill] = useState(false);
  const [card, setCard] = useState('Dear Mum,\nEarth is strange. They talk to plants and not to each other. Parsnip has eaten a receipt.\nLove, H.');
  const [sent, setSent] = useState(0);
  const [near, setNear] = useState<Spread | null>(null);
  const state = useRef({ x: 300, y: 300, vx: 0, vy: 0, camX: 0, t: 0, poked: new Set<string>(), keys: new Set<string>(), aim: null as null | { x: number; y: number }, near: null as Spread | null, sentT: 0 });
  const hits = useRef<{ x: number; y: number; w: number; h: number; act: () => void }[]>([]);
  const viewRef = useRef(view); viewRef.current = view;
  const openRef = useRef(open); openRef.current = open;
  const pageRef = useRef(page); pageRef.current = page;
  const gotRef = useRef(got); gotRef.current = got;
  const stillRef = useRef(still); stillRef.current = still;
  const cardRef = useRef(card); cardRef.current = card;
  const sentRef = useRef(sent); sentRef.current = sent;

  useEffect(() => { try { localStorage.setItem('witchworld-stamps', JSON.stringify([...got])); } catch { /* ignore */ } }, [got]);

  const collect = (s: Spread) => setGot((g) => (g.has(s.id) ? g : new Set([...g, s.id])));
  const openSpread = (s: Spread) => { setOpen(s); collect(s); };

  // the issue's pages: cover, contents, the spreads, horoscopes, classifieds, back cover
  const PAGES = ['cover', 'contents', ...SPREADS.map((s) => s.id), 'stars', 'classifieds', 'back'];

  useEffect(() => {
    const cv = cvRef.current!;
    const g = cv.getContext('2d')!;
    const pen = makePen(g);
    let raf = 0, last = performance.now(), boilT = 0;
    let W = 0, H = 0, D = 1;
    const fit = () => { D = Math.min(2, window.devicePixelRatio || 1); W = cv.clientWidth; H = cv.clientHeight; cv.width = Math.round(W * D); cv.height = Math.round(H * D); };
    fit();
    window.addEventListener('resize', fit);
    const S = state.current;

    const hit = (x: number, y: number, w: number, h: number, act: () => void) => hits.current.push({ x, y, w, h, act });

    // ------------------------------------------------------------ the spread
    const drawSpread = (s: Spread, x0: number, y0: number, w: number, h: number, t: number) => {
      const narrow = w < 700;
      g.fillStyle = '#fffefb'; g.fillRect(x0, y0, w, h);
      line(pen, [[x0, y0], [x0 + w, y0], [x0 + w, y0 + h], [x0, y0 + h]], 900, { close: true });
      const pw = narrow ? w : w / 2;
      if (!narrow) line(pen, [[x0 + pw, y0 + 10], [x0 + pw, y0 + h - 10]], 901, { w: 1.2 });
      // picture
      const ph = narrow ? h * 0.46 : h;
      const sc = Math.min(pw / 620, ph / 470);
      const poked = S.poked.has(s.id);
      s.scene(new Frame(pen, x0 + pw / 2, y0 + ph * 0.86, sc, 0, 1, 7), t, poked);
      line(pen, [[x0 + pw * 0.08, y0 + ph * 0.86], [x0 + pw * 0.92, y0 + ph * 0.86]], 902, { w: 1.4 });
      hit(x0, y0, pw, ph, () => { if (S.poked.has(s.id)) S.poked.delete(s.id); else S.poked.add(s.id); });
      // words
      const tx = narrow ? x0 + 18 : x0 + pw + pw * 0.08, tw = narrow ? w - 36 : pw * 0.84;
      let ty = narrow ? y0 + ph + 8 : y0 + h * 0.08;
      const room = (narrow ? h - ph : h) - 30;
      // fit the text to the page
      let k = Math.min(1.25, Math.max(0.55, Math.min(w, 1100) / 900));
      for (let i = 0; i < 12; i++) {
        const need = 14 * k * 1.5 + wrap(s.title, 34 * k, tw).length * 34 * k * 1.25 + wrap(s.caption, 17 * k, tw).length * 17 * k * 1.5 + wrap(s.body, 12.5 * k, tw).length * 12.5 * k * 1.55 + 70 * k;
        if (need <= room) break;
        k *= 0.92;
      }
      pen.width = 1.6;
      ty += letter(pen, s.kicker, tx, ty, { size: 12 * k, seed: 3 }) + 4 * k;
      pen.width = 2.6;
      ty += letter(pen, s.title, tx, ty, { size: 34 * k, maxWidth: tw, seed: 5, lineGap: 1.25 }) + 8 * k;
      pen.width = 2.0;
      ty += letter(pen, s.caption, tx, ty, { size: 17 * k, maxWidth: tw, seed: 7, lineGap: 1.5 }) + 12 * k;
      pen.width = 1.4;
      ty += letter(pen, s.body, tx, ty, { size: 12.5 * k, maxWidth: tw, seed: 9, lineGap: 1.55, jitter: 0.07 }) + 10 * k;
      pen.width = 1.3;
      letter(pen, s.poke, tx, Math.min(ty, y0 + h - 30 * k), { size: 11 * k, maxWidth: tw * 0.75, seed: 11 });
      pen.width = 2.2;
      // the stamp, stuck in the corner
      stamp(new Frame(pen, x0 + w - 50 * k, y0 + h - 56 * k, Math.max(0.5, k * 0.9), 0.12, 1, 66), s.stamp, 1, t);
      const pn = PAGES.indexOf(s.id) * 2 + 2;
      letter(pen, String(pn), x0 + 14, y0 + h - 22, { size: 11, seed: 2 }); if (!narrow) letter(pen, String(pn + 1), x0 + w - 30, y0 + h - 22, { size: 11, seed: 3 });
    };

    // ------------------------------------------------------------ views
    const cover = (x0: number, y0: number, w: number, h: number, t: number, mini = false) => {
      const k = Math.min(w / 900, h / 1100) * (mini ? 1 : 1);
      g.fillStyle = '#fffefb'; g.fillRect(x0, y0, w, h);
      line(pen, [[x0, y0], [x0 + w, y0], [x0 + w, y0 + h], [x0, y0 + h]], 800, { close: true });
      pen.width = Math.max(2, 4.5 * k);
      letter(pen, 'WITCHWORLD', x0 + w / 2, y0 + 40 * k, { size: 92 * k, align: 'center', seed: 21, spacing: 0.16 });
      pen.width = Math.max(1.6, 2.6 * k);
      letter(pen, 'WEEKLY · THE EARTH ISSUE · 2026 · PRICE: ONE TOAD', x0 + w / 2, y0 + 180 * k, { size: 17 * k, align: 'center', seed: 22 });
      pen.width = Math.max(1.8, 2.6 * k);
      witch(new Frame(pen, x0 + w / 2, y0 + h * 0.9, 2.4 * k, 0, 1, 31), 'arms-up', t, 'grin');
      cat(new Frame(pen, x0 + w * 0.82, y0 + h * 0.86, 1.4 * k, 0, -1, 32), t, 'sit');
      // cover lines placed clear of her hat, her arms and the cat
      const spots: [number, number][] = [[0.05, 0.27], [0.7, 0.27], [0.05, 0.6], [0.72, 0.6], [0.05, 0.72]];
      COVER_LINES.forEach((c, i) => {
        const cx = x0 + w * spots[i][0], cy = y0 + h * spots[i][1];
        pen.width = Math.max(1.4, 2 * k);
        letter(pen, c, cx, cy, { size: 19 * k, maxWidth: w * 0.24, seed: 40 + i });
      });
      pen.width = Math.max(1.4, 1.8 * k);
      letter(pen, 'EXCLUSIVE: PARSNIP SPEAKS (HE WILL NOT)', x0 + w * 0.06, y0 + h * 0.93, { size: 14 * k, seed: 51, maxWidth: w * 0.6 });
      for (let i = 0; i < 18; i++) line(pen, [[x0 + w * 0.8 + i * 4 * k, y0 + h * 0.93], [x0 + w * 0.8 + i * 4 * k, y0 + h * 0.97]], 860 + i, { w: i % 3 ? 1 : 2.2 });
      pen.width = 2.2;
    };

    const textPage = (x0: number, y0: number, w: number, h: number, title: string, items: [string, string][], seed: number) => {
      g.fillStyle = '#fffefb'; g.fillRect(x0, y0, w, h);
      line(pen, [[x0, y0], [x0 + w, y0], [x0 + w, y0 + h], [x0, y0 + h]], 700 + seed, { close: true });
      const k = Math.min(1.2, Math.max(0.6, w / 900));
      pen.width = 2.8;
      let y = y0 + 30 * k;
      y += letter(pen, title, x0 + w / 2, y, { size: 40 * k, align: 'center', seed }) + 10 * k;
      const cols = w > 760 ? 2 : 1, cw = (w - 60) / cols;
      let col = 0, yy = y;
      items.forEach(([a, b], i) => {
        const x = x0 + 30 + col * cw;
        pen.width = 2.2; yy += letter(pen, a, x, yy, { size: 17 * k, seed: seed + i * 2, maxWidth: cw - 30 });
        pen.width = 1.5; yy += letter(pen, b, x, yy, { size: 12.5 * k, seed: seed + i * 2 + 1, maxWidth: cw - 30 }) + 10 * k;
        if (cols === 2 && i === Math.ceil(items.length / 2) - 1) { col = 1; yy = y; }
      });
      pen.width = 2.2;
    };

    const contents = (x0: number, y0: number, w: number, h: number) => {
      g.fillStyle = '#fffefb'; g.fillRect(x0, y0, w, h);
      line(pen, [[x0, y0], [x0 + w, y0], [x0 + w, y0 + h], [x0, y0 + h]], 690, { close: true });
      const k = Math.min(1.2, Math.max(0.6, w / 900));
      pen.width = 2.8;
      letter(pen, 'IN THIS ISSUE', x0 + w / 2, y0 + 26 * k, { size: 40 * k, align: 'center', seed: 61 });
      const rowH = Math.min(46 * k, (h - 140 * k) / (SPREADS.length + 3));
      const list: [string, number, string][] = [...SPREADS.map((s, i) => [s.title, (i + 2) * 2 + 2, s.id] as [string, number, string]), ['What the stars say', 24, 'stars'], ['Classifieds', 26, 'classifieds'], ['About our correspondent', 28, 'back']];
      list.forEach(([t, p, id], i) => {
        const y = y0 + 100 * k + i * rowH;
        pen.width = 1.9;
        letter(pen, String(p), x0 + 30, y, { size: 16 * k, seed: 70 + i });
        letter(pen, t, x0 + 90 * k, y, { size: 16 * k, seed: 80 + i, maxWidth: w - 140 * k });
        line(pen, [[x0 + 90 * k, y + rowH * 0.8], [x0 + w - 40, y + rowH * 0.8]], 300 + i, { w: 0.8 });
        hit(x0, y - 4, w, rowH, () => setPage(PAGES.indexOf(id)));
      });
      pen.width = 2.2;
    };

    const backCover = (x0: number, y0: number, w: number, h: number, t: number) => {
      g.fillStyle = '#fffefb'; g.fillRect(x0, y0, w, h);
      line(pen, [[x0, y0], [x0 + w, y0], [x0 + w, y0 + h], [x0, y0 + h]], 680, { close: true });
      const k = Math.min(1.2, Math.max(0.55, w / 900));
      pen.width = 2.8;
      letter(pen, 'OUR CORRESPONDENT', x0 + 30, y0 + 26 * k, { size: 34 * k, seed: 91, maxWidth: w - 60 });
      pen.width = 1.7;
      const tw = w > 760 ? w * 0.52 : w - 60;
      letter(pen, ABOUT, x0 + 30, y0 + 100 * k, { size: 14 * k, maxWidth: tw, seed: 92, lineGap: 1.6 });
      pen.width = 2.2;
      const wx = w > 760 ? x0 + w * 0.78 : x0 + w * 0.7, wy = y0 + h * 0.95;
      witch(new Frame(pen, wx, wy, 1.4 * k, 0, -1, 93), 'write', t, 'grin');
      cat(new Frame(pen, wx - 140 * k, wy, 0.9 * k, 0, 1, 94), t, 'loaf');
    };

    // ------------------------------------------------------------ the flight
    const fly = (t: number, dt: number) => {
      const groundY = H * 0.78;
      // controls
      const K = S.keys;
      let ax = (K.has('right') ? 1 : 0) - (K.has('left') ? 1 : 0), ay = (K.has('down') ? 1 : 0) - (K.has('up') ? 1 : 0);
      if (S.aim) { const dx = S.aim.x + S.camX - S.x, dy = S.aim.y - S.y; const d = Math.hypot(dx, dy); if (d > 20) { ax = dx / d; ay = dy / d; } }
      S.vx += ax * 900 * dt; S.vy += ay * 900 * dt;
      S.vx *= 1 - Math.min(1, dt * 2.2); S.vy *= 1 - Math.min(1, dt * 3);
      S.vy += Math.sin(t * 2) * 6 * dt; // she bobs
      S.x = Math.max(120, Math.min(WORLD_W - 120, S.x + S.vx * dt));
      S.y = Math.max(H * 0.14, Math.min(groundY - 70, S.y + S.vy * dt));
      const camT = Math.max(0, Math.min(WORLD_W - W, S.x - W * 0.38));
      S.camX += (camT - S.camX) * Math.min(1, dt * 4);
      const cx = S.camX;
      // the sky gets darker as you go east, and turns to night at the end
      const dusk = Math.max(0, Math.min(1, (S.x - 6000) / 2500));
      if (dusk > 0) { g.fillStyle = `rgba(20,20,30,${dusk * 0.06})`; g.fillRect(0, 0, W, H); }
      // far skyline (thin lines, slow parallax)
      pen.width = 1.1;
      for (let i = 0; i < 40; i++) {
        const bx = i * 260 - cx * 0.4;
        if (bx < -200 || bx > W + 200) continue;
        house(new Frame(pen, bx, groundY - 20, 0.7 + ((i * 37) % 10) / 20, 0, 1, 500 + i), 90 + ((i * 53) % 60), 120 + ((i * 71) % 180), 500 + i);
      }
      pen.width = 1.6;
      for (let i = 0; i < 16; i++) { const bx = ((i * 700 + t * 12) % (WORLD_W + 400)) - cx * 0.6; if (bx > -150 && bx < W + 50) cloud(new Frame(pen, bx, H * (0.12 + ((i * 29) % 30) / 100), 0.9 + (i % 3) * 0.3, 0, 1, 600 + i), 1); }
      for (let i = 0; i < 6; i++) { const bx = ((i * 900 - t * 40) % WORLD_W + WORLD_W) % WORLD_W - cx; if (bx > -20 && bx < W + 20) bird(new Frame(pen, bx, H * 0.2 + (i % 3) * 30, 1, 0, 1, 650 + i), t, i + 1); }
      if (dusk > 0.2) { moon(new Frame(pen, W * 0.82, H * 0.16, 1, 0, 1, 690)); for (let i = 0; i < 12; i++) star(new Frame(pen, (i * 173) % W, (i * 97) % (H * 0.4) + 20, 0.6, 0, 1, 700 + i), 1, 6); }
      // the ground
      pen.width = 2.2;
      line(pen, [[-20, groundY], [W + 20, groundY]], 950);
      for (let i = 0; i < 60; i++) { const gx = i * 160 - (cx % 160); line(pen, [[gx, groundY + 4], [gx + 6, groundY - 6]], 960 + ((i + Math.floor(cx / 160)) % 40), { w: 1.2 }); }
      // where she came in
      const px = 160 - cx;
      if (px > -200) { portal(new Frame(pen, px, groundY - 160, 1, 0, 1, 980), t); letter(pen, 'WITCHWORLD →', px - 70, groundY + 30, { size: 14, seed: 981 }); }
      // the stations
      let nearest: Spread | null = null;
      SPREADS.forEach((s, i) => {
        const sx = s.x - cx;
        if (sx < -400 || sx > W + 400) return;
        const sc = Math.min(0.75, H / 900);
        s.scene(new Frame(pen, sx, groundY, sc, 0, 1, 100 + i), t, S.poked.has(s.id));
        // the signpost
        line(pen, [[sx + 230 * sc, groundY], [sx + 230 * sc, groundY - 250 * sc]], 1100 + i);
        const tw = Math.min(260, measure(s.title, 14) + 30);
        line(pen, [[sx + 230 * sc - 10, groundY - 250 * sc - 50], [sx + 230 * sc + tw, groundY - 250 * sc - 50], [sx + 230 * sc + tw + 18, groundY - 250 * sc - 25], [sx + 230 * sc + tw, groundY - 250 * sc], [sx + 230 * sc - 10, groundY - 250 * sc]], 1200 + i, { close: true, fill: '#fffefb' });
        pen.width = 1.7;
        letter(pen, `${i + 1}. ${s.title}`, sx + 230 * sc, groundY - 250 * sc - 40, { size: 13, seed: 1300 + i, maxWidth: tw - 10 });
        pen.width = 2.2;
        if (gotRef.current.has(s.id)) stamp(new Frame(pen, sx + 230 * sc + tw - 10, groundY - 250 * sc - 70, 0.45, 0.2, 1, 1400 + i), s.stamp, 1, t);
        hit(sx - 260 * sc, groundY - 420 * sc, 520 * sc + tw, 440 * sc, () => openSpread(s));
        if (Math.abs(s.x - S.x) < 220) nearest = s;
      });
      // the post office at the end
      const po = 8900 - cx;
      if (po > -300 && po < W + 300) {
        house(new Frame(pen, po, groundY, 1, 0, 1, 1500), 180, 160, 1500);
        line(pen, [[po - 100, groundY - 160], [po, groundY - 230], [po + 100, groundY - 160]], 1501);
        letter(pen, 'POST OFFICE', po, groundY - 210, { size: 16, align: 'center', seed: 1502 });
        owl(new Frame(pen, po + 70, groundY - 160, 0.7, 0, 1, 1503), t, false);
        hit(po - 100, groundY - 240, 200, 240, () => setView('post'));
        if (Math.abs(8900 - S.x) < 220) nearest = { id: 'post', title: 'Post a card home' } as Spread;
      }
      // Hazel
      const tilt = Math.max(-0.35, Math.min(0.35, S.vy * 0.0012 + Math.sin(t * 2) * 0.03));
      const face = S.vx < -30 ? -1 : 1;
      const hz = new Frame(pen, S.x - cx, S.y, Math.min(1, H / 820), 0, face, 2000);
      flying(hz, t, tilt * face);
      // speed lines
      if (Math.abs(S.vx) > 120) for (let i = 0; i < 3; i++) line(pen, [[S.x - cx - face * (120 + i * 18), S.y - 20 + i * 14], [S.x - cx - face * (170 + i * 18 + Math.abs(S.vx) * 0.1), S.y - 20 + i * 14]], 2100 + i, { w: 1.4 });
      if (nearest !== S.near) { S.near = nearest; setNear(nearest); }
      // the passport
      pen.width = 1.6;
      letter(pen, `STAMPS ${gotRef.current.size}/10`, W - 150, 74, { size: 14, seed: 2200 });
      pen.width = 2.2;
    };

    // ------------------------------------------------------------ the postcard
    const post = (t: number, dt: number) => {
      // leave room under the card for the writing box
      const narrow = W < 700;
      const k = narrow ? Math.min(W / 560, 0.8) : Math.min(W / 1000, (H - 250) / 560, 1.2);
      const cw = narrow ? W - 20 : 900 * k, ch = narrow ? H - 104 - 230 : 560 * k, x0 = (W - cw) / 2, y0 = narrow ? 104 : 64;
      S.sentT = sentRef.current ? S.sentT + dt : 0;
      const fly = S.sentT > 0 ? Math.min(1, S.sentT / 3) : 0;
      const ox = fly * (W + cw), oy = -fly * fly * H * 0.6;
      g.save(); g.translate(ox, oy); g.rotate(fly * -0.2);
      g.fillStyle = '#fffefb'; g.fillRect(x0, y0, cw, ch);
      line(pen, [[x0, y0], [x0 + cw, y0], [x0 + cw, y0 + ch], [x0, y0 + ch]], 3000, { close: true });
      if (narrow) {
        // a phone-sized card: the picture on top, the writing underneath
        line(pen, [[x0 + 14, y0 + ch * 0.42], [x0 + cw - 14, y0 + ch * 0.42]], 3001, { w: 1.2 });
        witch(new Frame(pen, x0 + cw * 0.3, y0 + ch * 0.41, ch * 0.0011, 0, 1, 3002), 'wave', t, 'grin');
        pen.width = 1.6;
        letter(pen, 'GREETINGS FROM EARTH!', x0 + 12, y0 + 12, { size: 15, seed: 3004, maxWidth: cw * 0.5 });
        pen.width = 1.7;
        letter(pen, cardRef.current || '…', x0 + 14, y0 + ch * 0.46, { size: 13, maxWidth: cw - 30, seed: 3005, lineGap: 1.5 });
        letter(pen, 'TO: MRS. MOTHWICK, 3 CROOKED LANE, WITCHWORLD', x0 + 14, y0 + ch - 34, { size: 10, seed: 3020, maxWidth: cw - 30 });
        stamp(new Frame(pen, x0 + cw - 44, y0 + 50, 0.75, 0.1, 1, 3030), 'plant', 1, t);
      } else {
      line(pen, [[x0 + cw * 0.52, y0 + 30 * k], [x0 + cw * 0.52, y0 + ch - 30 * k]], 3001, { w: 1.2 });
      witch(new Frame(pen, x0 + cw * 0.26, y0 + ch * 0.95, 1.45 * k, 0, 1, 3002), 'wave', t, 'grin');
      broom(new Frame(pen, x0 + cw * 0.12, y0 + ch * 0.92, 0.6 * k, -0.15, 1, 3003), t);
      pen.width = 1.6;
      letter(pen, 'GREETINGS FROM EARTH!', x0 + cw * 0.04, y0 + 24 * k, { size: 20 * k, seed: 3004 });
      // the message, in her hand, as you type it
      pen.width = 1.8;
      letter(pen, cardRef.current || '…', x0 + cw * 0.56, y0 + 110 * k, { size: 14 * k, maxWidth: cw * 0.4, seed: 3005, lineGap: 1.55 });
      for (let i = 0; i < 3; i++) line(pen, [[x0 + cw * 0.58, y0 + ch * (0.76 + i * 0.07)], [x0 + cw * 0.95, y0 + ch * (0.76 + i * 0.07)]], 3010 + i, { w: 0.9 });
      letter(pen, 'MRS. MOTHWICK\n3 CROOKED LANE\nWITCHWORLD', x0 + cw * 0.6, y0 + ch * 0.72, { size: 12 * k, seed: 3020, lineGap: 1.75 });
      stamp(new Frame(pen, x0 + cw - 50 * k, y0 + 55 * k, 0.9 * k, 0.1, 1, 3030), 'plant', 1, t);
      }
      g.restore();
      if (fly > 0) owl(new Frame(pen, x0 + cw * 0.5 + ox, y0 - 20 + oy, 1.2 * k, 0, 1, 3040), t, true);
      if (sentRef.current && S.sentT > 3) {
        pen.width = 2.2;
        letter(pen, 'SENT. REGINALD WILL BE THERE BY TUESDAY. HE MAY BITE.', W / 2, H * 0.4, { size: Math.min(26, W / 30), align: 'center', seed: 3050, maxWidth: W * 0.8 });
      }
    };

    // ------------------------------------------------------------ loop
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      S.t += dt;
      boilT += dt;
      if (!stillRef.current && boilT > 0.14) { boilT = 0; pen.boil = (pen.boil + 1) % 3; }
      g.setTransform(D, 0, 0, D, 0, 0);
      g.fillStyle = PAPER; g.fillRect(0, 0, W, H);
      hits.current = [];
      pen.width = 2.2; pen.wobble = 1.4;
      const t = S.t, v = viewRef.current, sp = openRef.current;
      const mx = W < 700 ? 10 : 40, top = W < 700 ? 104 : 64; // the nav wraps to two rows on phones
      if (sp) {
        g.fillStyle = 'rgba(253,252,248,0.94)'; g.fillRect(0, 0, W, H);
        const w = Math.min(W - mx * 2, 1300), h = Math.min(H - top - 20, W < 700 ? H - top - 20 : w * 0.62);
        drawSpread(sp, (W - w) / 2, top, w, h, t);
      } else if (v === 'cover') {
        const h = Math.min(H - top - 52, (W - 20) * 1.25), w = h / 1.25;
        cover((W - w) / 2, top, w, h, t);
        hit((W - w) / 2, top, w, h, () => setView('fly'));
      } else if (v === 'fly') fly(t, dt);
      else if (v === 'issue') {
        const p = PAGES[pageRef.current];
        const w = Math.min(W - mx * 2, 1300), h = Math.min(H - top - 70, W < 700 ? H - top - 70 : w * 0.62);
        const x0 = (W - w) / 2;
        if (p === 'cover') { const ch = h, cw = Math.min(w, ch / 1.25); cover((W - cw) / 2, top, cw, ch, t); }
        else if (p === 'contents') contents(x0, top, w, h);
        else if (p === 'stars') textPage(x0, top, w, h, 'WHAT THE STARS SAY', HOROSCOPES, 400);
        else if (p === 'classifieds') textPage(x0, top, w, h, 'CLASSIFIEDS', CLASSIFIEDS.map((c) => { const [a, ...b] = c.split(':'); return [a + ':', b.join(':').trim()] as [string, string]; }), 500);
        else if (p === 'back') backCover(x0, top, w, h, t);
        else { const s = SPREADS.find((q) => q.id === p)!; drawSpread(s, x0, top, w, h, t); if (!gotRef.current.has(s.id)) collect(s); }
      } else if (v === 'about') {
        const w = Math.min(W - mx * 2, 1200);
        const x0 = (W - w) / 2;
        const k = Math.min(1.1, Math.max(0.55, w / 1000));
        pen.width = 2.8;
        letter(pen, 'HAZEL MOTHWICK', x0, top + 10, { size: 40 * k, seed: 4000 });
        pen.width = 1.6;
        letter(pen, 'FIELD CORRESPONDENT & ILLUSTRATOR · WITCHWORLD WEEKLY', x0, top + 70 * k, { size: 13 * k, seed: 4001, maxWidth: w });
        // the portfolio: every dispatch as a thumbnail
        const cols = W < 700 ? 2 : 5, gap = 14, cw = (w - gap * (cols - 1)) / cols, ch = cw * 0.8;
        SPREADS.forEach((s, i) => {
          const cx = x0 + (i % cols) * (cw + gap), cy = top + 110 * k + Math.floor(i / cols) * (ch + 46 * k);
          g.fillStyle = '#fffefb'; g.fillRect(cx, cy, cw, ch);
          line(pen, [[cx, cy], [cx + cw, cy], [cx + cw, cy + ch], [cx, cy + ch]], 4100 + i, { close: true, w: 1.4 });
          pen.width = 1.6;
          s.scene(new Frame(pen, cx + cw / 2, cy + ch * 0.9, cw / 640, 0, 1, 4200 + i), t, false);
          letter(pen, s.title, cx, cy + ch + 8, { size: Math.max(10, 12 * k), seed: 4300 + i, maxWidth: cw });
          pen.width = 2.2;
          hit(cx, cy, cw, ch + 30, () => openSpread(s));
        });
        const rows = Math.ceil(SPREADS.length / cols);
        const ay = top + 110 * k + rows * (ch + 46 * k) + 10;
        pen.width = 1.6;
        letter(pen, ABOUT, x0, ay, { size: 13 * k, maxWidth: Math.min(w, 760), seed: 4400, lineGap: 1.6 });
        pen.width = 2.2;
      } else if (v === 'post') post(t, dt);
    };
    raf = requestAnimationFrame(frame);

    // ------------------------------------------------------------ input
    const KM: Record<string, string> = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down' };
    const kd = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'TEXTAREA') return;
      if (openRef.current) {
        if (e.code === 'Escape') setOpen(null);
        if (e.code === 'ArrowRight' || e.code === 'ArrowLeft') { const i = SPREADS.indexOf(openRef.current); const n = SPREADS[(i + (e.code === 'ArrowRight' ? 1 : SPREADS.length - 1)) % SPREADS.length]; openSpread(n); }
        return;
      }
      if (viewRef.current === 'issue') {
        if (e.code === 'ArrowRight') setPage((p) => Math.min(PAGES.length - 1, p + 1));
        if (e.code === 'ArrowLeft') setPage((p) => Math.max(0, p - 1));
        return;
      }
      if (viewRef.current === 'fly') {
        const k = KM[e.code]; if (k) { S.keys.add(k); e.preventDefault(); }
        if ((e.code === 'Space' || e.code === 'Enter') && S.near) { e.preventDefault(); if (S.near.id === 'post') setView('post'); else openSpread(S.near); }
      }
    };
    const ku = (e: KeyboardEvent) => { const k = KM[e.code]; if (k) S.keys.delete(k); };
    let downAt: { x: number; y: number; t: number } | null = null;
    const pd = (e: PointerEvent) => {
      const r = cv.getBoundingClientRect(); const x = e.clientX - r.left, y = e.clientY - r.top;
      downAt = { x, y, t: performance.now() };
      if (viewRef.current === 'fly' && !openRef.current) S.aim = { x, y };
    };
    const pm = (e: PointerEvent) => { if (!S.aim) return; const r = cv.getBoundingClientRect(); S.aim = { x: e.clientX - r.left, y: e.clientY - r.top }; };
    const pu = (e: PointerEvent) => {
      S.aim = null;
      const r = cv.getBoundingClientRect(); const x = e.clientX - r.left, y = e.clientY - r.top;
      if (!downAt || Math.hypot(x - downAt.x, y - downAt.y) > 8 || performance.now() - downAt.t > 350) { downAt = null; return; }
      downAt = null;
      for (let i = hits.current.length - 1; i >= 0; i--) { const h = hits.current[i]; if (x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h) { h.act(); return; } }
    };
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
    cv.addEventListener('pointerdown', pd); window.addEventListener('pointermove', pm); window.addEventListener('pointerup', pu);
    (window as unknown as { __witch: unknown }).__witch = { state: S, setView, openSpread, setPage };
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', fit); window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku);
      cv.removeEventListener('pointerdown', pd); window.removeEventListener('pointermove', pm); window.removeEventListener('pointerup', pu);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const NAV: [View, string][] = [['cover', 'Cover'], ['fly', 'Fly'], ['issue', 'Read the issue'], ['about', 'Portfolio'], ['post', 'Post an owl']];
  const download = () => {
    const cv = cvRef.current; if (!cv) return;
    const a = document.createElement('a'); a.download = 'postcard-from-earth.png'; a.href = cv.toDataURL('image/png'); a.click();
  };

  return (
    <div className="ww">
      <canvas ref={cvRef} className="ww-canvas" role="img" aria-label={open ? `${open.title}. ${open.caption} ${open.body}` : 'Witchworld Weekly, the Earth issue, drawn by hand.'} />
      <nav className="ww-nav">
        {NAV.map(([v, label], i) => (
          <button key={v} className={view === v && !open ? 'on' : ''} onClick={() => { setOpen(null); setView(v); if (v === 'post') setSent(0); }} aria-label={label}>
            <Hand text={label} size={15} seed={i + 1} />
          </button>
        ))}
        <span className="ww-gap" />
        <button onClick={() => setStill(!still)} aria-label={still ? 'Let the lines wobble' : 'Hold the lines still'}><Hand text={still ? 'Wobble' : 'Still'} size={13} seed={9} /></button>
        <button onClick={onExit} aria-label="Back"><Hand text="Exit" size={13} seed={10} /></button>
      </nav>

      {open && (
        <div className="ww-bar">
          <button onClick={() => { const i = SPREADS.indexOf(open); openSpread(SPREADS[(i + SPREADS.length - 1) % SPREADS.length]); }} aria-label="Previous"><Hand text="← Prev" size={14} seed={21} /></button>
          <button onClick={() => setOpen(null)} aria-label="Close"><Hand text="Close ×" size={14} seed={22} /></button>
          <button onClick={() => { const i = SPREADS.indexOf(open); openSpread(SPREADS[(i + 1) % SPREADS.length]); }} aria-label="Next"><Hand text="Next →" size={14} seed={23} /></button>
        </div>
      )}
      {!open && view === 'issue' && (
        <div className="ww-bar">
          <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} aria-label="Previous page"><Hand text="← Turn back" size={14} seed={24} /></button>
          <span className="ww-pg"><Hand text={`${page + 1} / ${PAGES.length}`} size={13} seed={25} /></span>
          <button onClick={() => setPage(Math.min(PAGES.length - 1, page + 1))} disabled={page === PAGES.length - 1} aria-label="Next page"><Hand text="Turn over →" size={14} seed={26} /></button>
        </div>
      )}
      {!open && view === 'fly' && (
        <div className="ww-hint">
          {near ? <button className="ww-go" onClick={() => (near.id === 'post' ? setView('post') : openSpread(near))}><Hand text={near.id === 'post' ? 'Space · post a card home' : `Space · read “${near.title}”`} size={15} seed={31} /></button>
            : <Hand text="Arrows or WASD to fly · or hold and drag · land at the signs" size={13} seed={32} />}
        </div>
      )}
      {!open && view === 'cover' && <div className="ww-hint"><Hand text="Tap the cover to fly to Earth" size={14} seed={33} /></div>}
      {!open && view === 'post' && (
        <div className="ww-post">
          <label htmlFor="ww-msg"><Hand text="Write your card" size={14} seed={41} /></label>
          <textarea id="ww-msg" value={card} maxLength={220} rows={4} onChange={(e) => { setCard(e.target.value); setSent(0); }} />
          <div className="ww-row">
            <button onClick={() => { setSent(1); state.current.sentT = 0.0001; }} aria-label="Send by owl"><Hand text="Send by owl" size={15} seed={42} /></button>
            <button onClick={download} aria-label="Save the postcard"><Hand text="Save card" size={15} seed={43} /></button>
          </div>
        </div>
      )}
    </div>
  );
}
