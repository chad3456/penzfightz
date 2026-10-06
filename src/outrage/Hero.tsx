/**
 * The opening: a night crowd of a thousand heads. As the reader scrolls, the
 * heads lift out of the street and settle into the glowing outline and feed
 * of a phone: the street became a screen.
 */
import { useEffect, useRef, useState, type RefObject } from 'react';

type RGB = [number, number, number];
const PALE: RGB = [214, 209, 199];
const DIM: RGB = [120, 116, 108];
const ORANGE: RGB = [235, 104, 52];
const BLUE: RGB = [74, 150, 236];
const AMBER: RGB = [237, 161, 0];

interface Dot {
  cx: number; cy: number; cr: number; cc: RGB; depth: number; phase: number;
  px: number; py: number; pr: number; pc: RGB; delay: number;
}

export function Hero({ scroller }: { scroller: RefObject<HTMLDivElement | null> }) {
  const wrap = useRef<HTMLDivElement>(null);
  const cvs = useRef<HTMLCanvasElement>(null);
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const canvas = cvs.current!, box = wrap.current!, sc = scroller.current!;
    const ctx = canvas.getContext('2d')!;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let W = 0, H = 0, dpr = 1, dots: Dot[] = [], raf = 0, lastStage = -1;
    let seed = 7;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

    function build() {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      seed = 7;
      const narrow = W < 720;
      const N = narrow ? 1000 : 1400;
      // phone geometry
      const ph = narrow ? Math.min(H * 0.44, 380) : Math.min(H * 0.7, 600), pw = ph * 0.5;
      const pcx = narrow ? W / 2 : W * 0.7, pcy = narrow ? H * 0.655 : H * 0.53;
      const x0 = pcx - pw / 2, y0 = pcy - ph / 2, rad = pw * 0.14;
      const targets: { x: number; y: number; r: number; c: RGB }[] = [];
      // outline: walk the rounded rectangle
      const per = 2 * (pw + ph);
      const nOut = Math.round(N * 0.3);
      for (let i = 0; i < nOut; i++) {
        let s = (i / nOut) * per, x: number, y: number;
        if (s < pw) { x = x0 + s; y = y0; } else if ((s -= pw) < ph) { x = x0 + pw; y = y0 + s; } else if ((s -= ph) < pw) { x = x0 + pw - s; y = y0 + ph; } else { s -= pw; x = x0; y = y0 + ph - s; }
        // pull corners in to round them
        const cxk = Math.min(Math.max(x, x0 + rad), x0 + pw - rad), cyk = Math.min(Math.max(y, y0 + rad), y0 + ph - rad);
        const dx = x - cxk, dy = y - cyk, dl = Math.hypot(dx, dy);
        if (dl > rad) { x = cxk + (dx / dl) * rad; y = cyk + (dy / dl) * rad; }
        targets.push({ x, y, r: 1.5, c: PALE });
      }
      // the feed: a status bar, then posts with an avatar, a name, lines of text and a reaction strip
      const inset = pw * 0.08, sx = x0 + inset, sw = pw - 2 * inset;
      const feed: { x: number; y: number; r: number; c: RGB }[] = [];
      const line = (xa: number, xb: number, y: number, r: number, c: RGB, gap = 4.6) => { for (let x = xa; x <= xb; x += gap) feed.push({ x, y, r, c }); };
      line(pcx - pw * 0.12, pcx + pw * 0.12, y0 + ph * 0.03, 1.6, DIM, 4);
      line(sx, sx + 22, y0 + ph * 0.065, 1.2, PALE, 4);
      line(sx + sw - 18, sx + sw, y0 + ph * 0.065, 1.4, PALE, 3.5);
      let py = y0 + ph * 0.11;
      const kinds = ['calm', 'hot', 'calm', 'cool', 'calm', 'hot'];
      for (let p = 0; p < kinds.length; p++) {
        const kind = kinds[p];
        const col = kind === 'hot' ? ORANGE : kind === 'cool' ? BLUE : DIM;
        const txt = kind === 'calm' ? DIM : col;
        const big = kind !== 'calm';
        const need = big ? 100 : 46;
        if (py + need * (ph / 640) > y0 + ph * 0.96) break;
        const k = ph / 640;
        feed.push({ x: sx + 6, y: py + 6, r: 5.2, c: big ? col : PALE });
        line(sx + 18, sx + 18 + sw * 0.32, py + 2, 1.5, PALE);
        const lines = big ? 2 : 2;
        for (let l = 0; l < lines; l++) line(sx + 18, sx + (l === lines - 1 ? sw * 0.62 : sw), py + 11 + l * 8 * k, 1.25, txt);
        let yy = py + 11 + lines * 8 * k + 4;
        if (big) {
          // an image card made of dots
          for (let r = 0; r < 5; r++) line(sx + 18, sx + sw, yy + r * 7 * k, 1.9, col, 6);
          yy += 5 * 7 * k + 2;
        }
        yy += 4;
        const reacts = big ? 14 : 3;
        for (let q = 0; q < reacts; q++) feed.push({ x: sx + 18 + q * 6.3, y: yy, r: 2, c: big ? col : DIM });
        if (big) for (let q = 0; q < 7; q++) feed.push({ x: sx + sw - q * 6.3, y: yy, r: 2, c: AMBER });
        py = yy + 14 * k;
      }
      line(pcx - pw * 0.16, pcx + pw * 0.16, y0 + ph * 0.975, 1.8, PALE, 4);
      const nIn = N - nOut;
      if (feed.length > nIn) { const step = feed.length / nIn; for (let i = 0; i < nIn; i++) targets.push(feed[Math.floor(i * step)]); }
      else { for (let i = 0; i < nIn; i++) targets.push(feed[i % feed.length]); }
      // the crowd: heads in perspective below a horizon
      dots = targets.slice(0, N).map((t, i) => {
        const depth = Math.pow(rnd(), 0.75);
        const hy = H * (narrow ? 0.5 : 0.46) + depth * H * 0.52;
        const tone = rnd();
        return {
          cx: rnd() * W, cy: hy, cr: 0.8 + depth * 3.4, depth, phase: rnd() * Math.PI * 2,
          cc: tone < 0.05 ? ORANGE : tone < 0.09 ? BLUE : PALE,
          px: t.x + (rnd() - 0.5) * 0.6, py: t.y, pr: t.r, pc: t.c, delay: (i % 97) / 97,
        };
      });
    }

    const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    function frame(time: number) {
      raf = requestAnimationFrame(frame);
      const span = Math.max(1, box.offsetHeight - sc.clientHeight);
      const prog = Math.min(1, Math.max(0, (sc.scrollTop - box.offsetTop) / span));
      if (sc.scrollTop > box.offsetTop + box.offsetHeight) return;
      const st = prog < 0.38 ? 0 : prog < 0.72 ? 1 : 2;
      if (st !== lastStage) { lastStage = st; setStage(st); }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const tt = reduce ? 0 : time / 1000;
      for (const d of dots) {
        const local = Math.min(1, Math.max(0, (prog * 1.5 - d.delay * 0.5)));
        const k = ease(local);
        const bob = Math.sin(tt * 1.6 + d.phase) * d.depth * 1.6 * (1 - k);
        const x = d.cx + (d.px - d.cx) * k;
        const y = d.cy + bob + (d.py - d.cy) * k;
        const r = d.cr + (d.pr - d.cr) * k;
        const c0 = d.cc, c1 = d.pc;
        const a = (0.35 + d.depth * 0.65) * (1 - k) + k;
        ctx.fillStyle = `rgba(${c0[0] + (c1[0] - c0[0]) * k | 0},${c0[1] + (c1[1] - c0[1]) * k | 0},${c0[2] + (c1[2] - c0[2]) * k | 0},${a})`;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      }
    }
    build();
    raf = requestAnimationFrame(frame);
    const ro = new ResizeObserver(build); ro.observe(canvas);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [scroller]);

  const captions = [
    'A crowd used to need a street, a cause and a long walk.',
    'Then the street moved into a pocket.',
    'Now it needs a phone, a villain and a share button.',
  ];
  return (
    <header ref={wrap} className="oe-hero">
      <div className="oe-hero__stick">
        <canvas ref={cvs} className="oe-hero__cvs" aria-hidden />
        <div className="oe-hero__shade" />
        <div className="oe-hero__copy">
          <div className="oe-kicker oe-kicker--dark">A visual essay · India and the world · 2016–2026</div>
          <h1 className="oe-hero__title">The Outrage<br />Dividend</h1>
          <p className="oe-hero__dek">
            How the street became a screen, protest became a business model, and anger became the cheapest fuel in public life. Told
            in numbers, with India at the centre, including the numbers that cut against the story.
          </p>
        </div>
        <p className="oe-hero__cap" aria-live="polite">{captions[stage]}</p>
        <div className={`oe-hero__cue${stage > 0 ? ' is-gone' : ''}`}>Scroll ↓</div>
      </div>
    </header>
  );
}
