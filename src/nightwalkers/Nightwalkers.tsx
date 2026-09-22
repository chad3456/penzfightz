import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { footprint, INK, INK_PALE, INK_RED, line, nib, type Pt as Px } from './paper';
import { fitScale, Plate, type View } from './plate';
import { WAY_BY_ID, WAYS } from './plan';
import { measure, scribe } from './scribe';
import { Crowd, PRINT_LIFE, type Walker } from './walkers';
import { TERMS } from '../castle/plan';

/**
 * THE NIGHTWALKERS' MAP
 *
 * A survey of Hallowdene on a sheet of parchment that knows who is standing on
 * it. Say the words and the ink arrives; walk about; say the other words and
 * it goes away again.
 *
 * It is **not** a reproduction of anybody's map of anybody's school. The
 * castle is the one the `castle/` effect builds, in the same coordinates; the
 * rooms are named for what they are; the two incantations and the four
 * students whose map this is are ours.
 */

const OPEN_WORDS = 'i am nowhere i am meant to be';
const SHUT_WORDS = 'nothing happened here';

const norm = (s: string) => s.toLowerCase().replace(/[^a-z ]/g, '').replace(/\s+/g, ' ').trim();

/** A ragged disc, for the edge of the ink as it spreads into the paper. */
function seep(cx: number, cy: number, r: number, t: number): Px[] {
  const out: Px[] = [];
  const n = 84;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const w =
      Math.sin(a * 3 + t * 0.4) * 0.06 +
      Math.sin(a * 7 + 1.3) * 0.035 +
      Math.sin(a * 17 + 2.9) * 0.018;
    out.push([cx + Math.cos(a) * r * (1 + w), cy + Math.sin(a) * r * (1 + w)]);
  }
  return out;
}

/**
 * The vantage in the brick model that is nearest a point on the sheet.
 *
 * The two are the same building in the same coordinates, which is what makes
 * this three lines rather than a lookup table somebody has to maintain.
 */
function nearestVantage(x: number, z: number): number {
  let best = 0;
  let bestD = Infinity;
  for (const [i, t] of TERMS.entries()) {
    const d = Math.hypot(t.look[0] - x, t.look[2] - z);
    if (d < bestD) { bestD = d; best = i; }
  }
  return best;
}

export function Nightwalkers({ onExit, onLookAt }: {
  onExit: () => void;
  onLookAt?: (term: number) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const crowd = useMemo(() => new Crowd(), []);
  const plate = useMemo(() => new Plate(), []);

  const [said, setSaid] = useState('');
  const [open, setOpen] = useState(false);
  const [where, setWhere] = useState('the west door');
  const [company, setCompany] = useState<string[]>([]);
  const [found, setFound] = useState<string[]>([]);
  const [fps, setFps] = useState(0);

  // Everything the loop needs that must not re-run the effect when it changes.
  const live = useRef({
    view: { scale: 4, cx: 6, cz: 12, w: 1, h: 1 } as View,
    reveal: 0,
    want: 0,
    origin: [0, 0] as Px,
    dragging: false,
    follow: true,
    keys: new Set<string>(),
  });

  const say = useCallback((text: string) => {
    const t = norm(text);
    if (t === norm(OPEN_WORDS)) {
      live.current.want = 1;
      live.current.origin = [live.current.view.w / 2, live.current.view.h / 2];
      setOpen(true);
      setSaid('');
      return true;
    }
    if (t === norm(SHUT_WORDS)) {
      live.current.want = 0;
      setOpen(false);
      setSaid('');
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    const el = host.current;
    const c = canvas.current;
    if (!el || !c) return;
    const g = c.getContext('2d')!;
    const L = live.current;

    const fit = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = el.clientWidth;
      const h = el.clientHeight;
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
      c.style.width = `${w}px`;
      c.style.height = `${h}px`;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      L.view.w = w;
      L.view.h = h;
      if (L.view.scale < 0.01) L.view.scale = fitScale(w, h);
    };
    // Open on the castle rather than on the whole estate. The estate is two
    // hundred and fifty studs across and most of it is lake; framed to fit,
    // the building — which is the only part anybody is here for — is a
    // thumbnail in the middle of a lot of water.
    L.view.scale = fitScale(el.clientWidth || 1200, el.clientHeight || 800) * 1.45;
    L.view.cx = 2;
    L.view.cz = 16;
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);

    /* ── pointer ───────────────────────────────────────────────────── */
    let down = false;
    let moved = 0;
    let lx = 0;
    let ly = 0;
    const toWorld = (ev: { clientX: number; clientY: number }): Px => {
      const r = c.getBoundingClientRect();
      const x = ev.clientX - r.left;
      const y = ev.clientY - r.top;
      return [
        (x - L.view.w / 2) / L.view.scale + L.view.cx,
        -(y - L.view.h / 2) / L.view.scale + L.view.cz,
      ];
    };
    const onDown = (e: PointerEvent) => {
      down = true;
      moved = 0;
      lx = e.clientX;
      ly = e.clientY;
      c.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!down) return;
      const dx = e.clientX - lx;
      const dy = e.clientY - ly;
      moved += Math.abs(dx) + Math.abs(dy);
      if (moved > 5) {
        L.dragging = true;
        L.follow = false;
        L.view.cx -= dx / L.view.scale;
        L.view.cz += dy / L.view.scale;
      }
      lx = e.clientX;
      ly = e.clientY;
    };
    const onUp = (e: PointerEvent) => {
      // A click that did not drag is an instruction to walk there.
      if (down && moved <= 5 && L.reveal > 0.5) {
        crowd.goTo(toWorld(e));
        L.follow = true;
      }
      down = false;
      L.dragging = false;
      c.releasePointerCapture(e.pointerId);
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const before = toWorld(e);
      const k = Math.exp(-e.deltaY * 0.0016);
      L.view.scale = Math.max(1.5, Math.min(15, L.view.scale * k));
      // Zoom about the pointer, which is the only zoom that does not feel
      // like the map is being taken away from you.
      const after = toWorld(e);
      L.view.cx += before[0] - after[0];
      L.view.cz += before[1] - after[1];
      L.follow = false;
    };
    c.addEventListener('pointerdown', onDown);
    c.addEventListener('pointermove', onMove);
    c.addEventListener('pointerup', onUp);
    c.addEventListener('wheel', onWheel, { passive: false });

    /* ── keys ──────────────────────────────────────────────────────── */
    const KEYS: Record<string, [number, number]> = {
      ArrowUp: [0, 1], ArrowDown: [0, -1], ArrowLeft: [-1, 0], ArrowRight: [1, 0],
      w: [0, 1], s: [0, -1], a: [-1, 0], d: [1, 0],
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onExit(); return; }
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      if (KEYS[e.key]) { e.preventDefault(); L.keys.add(e.key); L.follow = true; }
    };
    const onKeyUp = (e: KeyboardEvent) => L.keys.delete(e.key);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    /* ── the loop ──────────────────────────────────────────────────── */
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    let frames = 0;
    let caption = 0;

    const tick = () => {
      const now = performance.now();
      const raw = (now - last) / 1000;
      const dt = Math.min(0.05, raw);
      last = now;

      // The ink spreads at a fixed rate whatever the frame rate.
      const speed = L.want > L.reveal ? 0.42 : 0.9;
      L.reveal += Math.sign(L.want - L.reveal) * Math.min(Math.abs(L.want - L.reveal), speed * Math.min(0.5, raw));

      if (L.reveal > 0.5) {
        let dx = 0;
        let dz = 0;
        for (const k of L.keys) {
          const v = KEYS[k];
          if (v) { dx += v[0]; dz += v[1]; }
        }
        if (dx || dz) crowd.nudge(dx, dz);
        crowd.step(dt);
      }

      // Carry the view after you, gently, unless it has been taken by hand.
      if (L.follow && !L.dragging) {
        const you = crowd.you.at;
        L.view.cx += (you[0] - L.view.cx) * Math.min(1, dt * 2.4);
        L.view.cz += (you[1] - L.view.cz) * Math.min(1, dt * 2.4);
      }

      plate.ensure(L.view);
      draw(g, L.view, L.reveal, L.origin, crowd, now / 1000, plate);

      acc += raw;
      frames++;
      if (acc > 0.6) { setFps(Math.round(frames / acc)); acc = 0; frames = 0; }

      caption += raw;
      if (caption > 0.25) {
        caption = 0;
        setWhere(crowd.where(crowd.you));
        setCompany(crowd.near(crowd.you, 17).slice(0, 3).map((w) => w.name));
        setFound([...crowd.found].map((id) => WAY_BY_ID.get(id)?.name ?? id));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      c.removeEventListener('pointerdown', onDown);
      c.removeEventListener('pointermove', onMove);
      c.removeEventListener('pointerup', onUp);
      c.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [crowd, plate, onExit]);

  return (
    <div className="nwm">
      <div className="nwm__view" ref={host}>
        <canvas ref={canvas} />
      </div>

      <header className="nwm__top">
        <div>
          <p className="nwm__kicker">a survey of hallowdene · drawn from the inside, at night</p>
          <h1 className="nwm__title">The Nightwalkers&rsquo; Map</h1>
        </div>
        <button className="nwm__exit" onClick={onExit}>← back to the shelf</button>
      </header>

      <div className={`nwm__card${open ? '' : ' is-shut'}`}>
        {open ? (
          <>
            <p className="nwm__where">You are in <b>{where}</b></p>
            <p className="nwm__note">
              {company.length
                ? `Nearby: ${company.join(', ')}.`
                : 'Nobody within earshot.'}
            </p>
            {found.length > 0 && (
              <p className="nwm__found">
                Ways you have found: {found.join(' · ')}
              </p>
            )}
            {onLookAt && (
              <button
                className="nwm__look"
                onClick={() => onLookAt(nearestVantage(crowd.you.at[0], crowd.you.at[1]))}
              >
                look at it from here →
              </button>
            )}
          </>
        ) : (
          <p className="nwm__note">
            The sheet is blank. It has been blank every time anybody has looked at it,
            which is the point.
          </p>
        )}
      </div>

      <form
        className="nwm__say"
        onSubmit={(e) => {
          e.preventDefault();
          if (!say(said)) setSaid('');
        }}
      >
        <input
          value={said}
          onChange={(e) => setSaid(e.target.value)}
          placeholder={open ? 'say the other words' : 'say the words'}
          aria-label="say the words"
          spellCheck={false}
        />
        <button type="submit">say it</button>
        <button
          type="button"
          className="nwm__hint"
          onClick={() => setSaid(open ? SHUT_WORDS : OPEN_WORDS)}
        >
          {open ? 'I have forgotten how to shut it' : 'I have forgotten the words'}
        </button>
      </form>

      <div className="nwm__hud">
        <span>{open ? 'drag to move the sheet · wheel to lean in · click or arrows to walk' : 'say the words'}</span>
        <span>{fps} fps</span>
      </div>
    </div>
  );
}

/* ── one frame ──────────────────────────────────────────────────────────── */

function draw(
  g: CanvasRenderingContext2D,
  v: View,
  reveal: number,
  origin: Px,
  crowd: Crowd,
  t: number,
  plate: Plate,
) {
  const sx = (x: number) => (x - v.cx) * v.scale + v.w / 2;
  const sy = (z: number) => -(z - v.cz) * v.scale + v.h / 2;

  g.clearRect(0, 0, v.w, v.h);
  plate.blitPaper(g, v);
  if (reveal <= 0.001) return;

  /*
    The ink is clipped to a ragged disc that grows out of wherever the words
    were said. Ink spreading into parchment has a hard ragged edge and not a
    soft one, so this is a clip and not a gradient — and a clip costs nothing,
    which matters because it is the only per-frame compositing on the page.
  */
  const full = Math.hypot(v.w, v.h) * 0.62;
  const r = full * reveal;
  g.save();
  if (reveal < 0.999) {
    const edge = seep(origin[0], origin[1], r, t);
    g.beginPath();
    g.moveTo(edge[0]![0], edge[0]![1]);
    for (const [x, y] of edge.slice(1)) g.lineTo(x, y);
    g.closePath();
    g.clip();
  }
  plate.blitInk(g, v);

  // ── the passages you have found, dotted, as they would be added later in a
  // different hand.
  for (const way of WAYS) {
    if (!way.secret || !crowd.found.has(way.id)) continue;
    const pts = way.pts.map(([x, z]) => [sx(x), sy(z)] as Px);
    g.save();
    g.setLineDash([v.scale * 0.9, v.scale * 1.1]);
    g.strokeStyle = INK_RED;
    g.globalAlpha = 0.75;
    g.lineWidth = Math.max(0.8, v.scale * 0.16);
    g.beginPath();
    g.moveTo(pts[0]![0], pts[0]![1]);
    for (const [x, y] of pts.slice(1)) g.lineTo(x, y);
    g.stroke();
    g.restore();
  }

  // ── footprints, oldest first so the fresh ones sit on top
  for (const w of crowd.walkers) {
    const ink = w.you ? INK_RED : INK;
    for (const p of w.prints) {
      const a = (1 - p.age / PRINT_LIFE) ** 1.6 * 0.75;
      footprint(g, sx(p.x), sy(p.z), -p.a, Math.max(2, v.scale * 1.15), a, ink);
    }
  }

  // ── the people themselves: a standing pair of feet, and a name
  const nameNib = nib({ ink: INK, width: Math.max(0.5, Math.min(1.4, v.scale * 0.1)), wobble: Math.min(0.45, v.scale * 0.03), passes: 1 });
  const youNib = nib({ ink: INK_RED, width: Math.max(0.6, Math.min(1.8, v.scale * 0.12)), wobble: Math.min(0.45, v.scale * 0.03), passes: 2 });
  /*
    Names are placed last and they are placed against each other.

    Two dozen of them printed straight onto a plan at this density is a word
    search: in the cloister four people standing together came out as
    WinifredLoomBarnabyMilne. Each one now takes a box, and a box that lands on
    one already taken is lifted a line and tried again — three times, and then
    the name is simply left off, because a name that cannot be read is worse
    than a pair of feet with no name at all.
  */
  const taken: [number, number, number, number][] = [];
  for (const w of crowd.walkers) {
    const x = sx(w.at[0]);
    const y = sy(w.at[1]);
    if (x < -80 || y < -60 || x > v.w + 80 || y > v.h + 60) continue;
    const ink = w.you ? INK_RED : INK;
    const size = Math.max(2.2, v.scale * 1.25);
    // Standing still, the feet are side by side; walking, they are staggered.
    const moving = w.path.length > w.leg;
    const sway = moving ? Math.sin(t * 7 + w.at[0]) * 0.22 : 0;
    for (const side of [-1, 1]) {
      footprint(
        g,
        x + Math.cos(w.heading + Math.PI / 2) * 0.55 * side * v.scale + Math.cos(w.heading) * sway * side * v.scale,
        y - Math.sin(w.heading + Math.PI / 2) * 0.55 * side * v.scale - Math.sin(w.heading) * sway * side * v.scale,
        -w.heading,
        size,
        w.you ? 1 : 0.92,
        ink,
      );
    }
    if (w.you) {
      // A ring, so you can find yourself on a sheet with two dozen names on it.
      const rr = v.scale * 2.6 + Math.sin(t * 2) * v.scale * 0.14;
      g.save();
      g.globalAlpha = 0.5;
      g.strokeStyle = INK_RED;
      g.lineWidth = Math.max(0.7, v.scale * 0.12);
      g.beginPath();
      g.arc(x, y, rr, 0, Math.PI * 2);
      g.stroke();
      g.restore();
    }
    label(g, w, x, y, v.scale, w.you ? youNib : nameNib, taken);
  }
  g.restore();
}

/**
 * A name, on a hairline leader, sitting clear of the feet it belongs to.
 *
 * Leaders matter more than they look as though they should: two dozen names
 * printed straight onto a plan at this density is a word search, and the thing
 * that turns it back into a map is a short line from each name to the pair of
 * feet it is about.
 */
function label(
  g: CanvasRenderingContext2D,
  w: Walker,
  x: number,
  y: number,
  scale: number,
  ink: ReturnType<typeof nib>,
  taken: [number, number, number, number][],
) {
  const em = Math.min(scale * (w.you ? 2.4 : 2.05), w.you ? 26 : 20);
  if (em < 6.5) return;
  const width = measure(w.name, 0.05) * em;
  const over = scale * 1.6 * (w.at[0] > 0 ? 1 : -1);
  const ax = x + over * 0.6;

  let up = scale * 3.2;
  let box: [number, number, number, number] | null = null;
  for (let tries = 0; tries < 3; tries++) {
    const bx = over > 0 ? ax : ax - width;
    const by = y - up - em * 1.1;
    const b: [number, number, number, number] = [bx - 2, by, width + 4, em * 1.15];
    const hits = taken.some((t) =>
      b[0] < t[0] + t[2] && b[0] + b[2] > t[0] && b[1] < t[1] + t[3] && b[1] + b[3] > t[1]);
    if (!hits) { box = b; break; }
    up += em * 1.25;
  }
  // You always get a name, even in a crowd: you are the one being looked for.
  if (!box && !w.you) return;
  if (box) taken.push(box);

  line(g, [[x, y - scale * 1.2], [ax, y - up]], { ...ink, width: ink.width * 0.55, alpha: 0.5 }, w.at[0]);
  scribe(g, w.name, ax, y - up - em * 0.2, {
    size: em,
    nib: ink,
    align: over > 0 ? 'left' : 'right',
    seed: w.name.length * 7 + w.name.charCodeAt(0),
    tracking: 0.05,
  });
  void INK_PALE;
}
