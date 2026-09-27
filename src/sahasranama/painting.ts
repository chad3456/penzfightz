/**
 * The paintings the cosmos is made of.
 *
 * Each plate is an original composition painted at load time on a canvas, in
 * the manner of contemporary devotional painting: big swirling brush-stroke
 * skies in saffron, rose and lilac, deep-blue skin, gold ornament, faceted
 * lotuses. Nothing is traced from anyone's picture. The faces are the Krishna
 * busts rendered for the Gita films (Lee Perry-Smith's head scan, CC BY 3.0),
 * set into the compositions and pushed towards paint; everything else — the
 * serpent hoods, the fan of arms and what they hold, the drapery, the chariot,
 * the feathers, the lotus facets, the skies — is laid down here, stroke by
 * stroke, with a seeded hand so the same plate comes out the same every time.
 *
 * Alongside the colour, every mark is also drawn into a depth canvas in flat
 * grey, so that when the plate is turned into particles each one knows how far
 * forward it sits: sky at the back, hoods and arms behind the body, the face in
 * front.
 */

export type PlateName = 'faces' | 'arrows' | 'lotus' | 'vishvarupa' | 'portrait';

export interface Plate {
  w: number;
  h: number;
  rgba: Uint8ClampedArray;
  depth: Uint8ClampedArray; // one byte a pixel, 0 = far, 255 = near
}

export const PLATE_W = 1000;
export const PLATE_H = 1250;

type RGB = [number, number, number];
type Pt = [number, number];

function rnd(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const hex = (h: string): RGB => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const css = (c: RGB, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = url;
  });
}

/** A canvas and its depth twin, and a hand to paint on them. */
class Easel {
  cv = document.createElement('canvas');
  dv = document.createElement('canvas');
  c: CanvasRenderingContext2D;
  d: CanvasRenderingContext2D;
  depth = 0;
  R: () => number;
  constructor(public w: number, public h: number, seed: number) {
    this.cv.width = this.dv.width = w;
    this.cv.height = this.dv.height = h;
    this.c = this.cv.getContext('2d', { willReadFrequently: true })!;
    this.d = this.dv.getContext('2d', { willReadFrequently: true })!;
    this.d.fillStyle = '#000';
    this.d.fillRect(0, 0, w, h);
    this.R = rnd(seed);
  }

  z(v: number) {
    this.depth = Math.max(0, Math.min(255, v | 0));
    return this;
  }

  jitter(c: RGB, amt = 14): RGB {
    const k = (this.R() - 0.5) * 2 * amt;
    return [c[0] + k + (this.R() - 0.5) * amt * 0.6, c[1] + k + (this.R() - 0.5) * amt * 0.6, c[2] + k + (this.R() - 0.5) * amt * 0.6];
  }

  /** Mirror a shape into the depth canvas. */
  private depthPath(draw: (g: CanvasRenderingContext2D) => void) {
    const g = this.d;
    g.save();
    g.fillStyle = g.strokeStyle = `rgb(${this.depth},${this.depth},${this.depth})`;
    draw(g);
    g.restore();
  }

  /**
   * A loaded brush dragged along a path: a few bristles side by side, each a
   * shade off, the whole thing thinning at the ends.
   */
  stroke(pts: Pt[], width: number, color: RGB, alpha = 0.9, o: { taper?: number; bristles?: number; jit?: number; depth?: boolean } = {}) {
    const n = pts.length;
    if (n < 2) return;
    const taper = o.taper ?? 1;
    const B = o.bristles ?? Math.max(2, Math.min(6, Math.round(width / 7)));
    const g = this.c;
    g.save();
    g.lineCap = 'round';
    g.lineJoin = 'round';
    // normals
    const nx: number[] = [];
    const ny: number[] = [];
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(0, i - 1)]!;
      const b = pts[Math.min(n - 1, i + 1)]!;
      const dx = b[0] - a[0];
      const dy = b[1] - a[1];
      const l = Math.hypot(dx, dy) || 1;
      nx.push(-dy / l);
      ny.push(dx / l);
    }
    const wAt = (i: number) => {
      const t = i / (n - 1);
      const prof = Math.sin(Math.min(1, 0.15 + t * 0.95) * Math.PI);
      return width * (1 - taper + taper * Math.max(0.25, prof));
    };
    for (let b = 0; b < B; b++) {
      const off = B === 1 ? 0 : (b / (B - 1) - 0.5) * 0.72;
      g.strokeStyle = css(this.jitter(color, o.jit ?? 12), alpha * (0.75 + this.R() * 0.25));
      for (let i = 0; i < n - 1; i++) {
        const w0 = wAt(i);
        g.lineWidth = Math.max(1, (w0 / B) * 1.7);
        g.beginPath();
        g.moveTo(pts[i]![0] + nx[i]! * off * w0, pts[i]![1] + ny[i]! * off * w0);
        g.lineTo(pts[i + 1]![0] + nx[i + 1]! * off * wAt(i + 1), pts[i + 1]![1] + ny[i + 1]! * off * wAt(i + 1));
        g.stroke();
      }
    }
    g.restore();
    if (o.depth !== false) {
      this.depthPath((d) => {
        d.lineCap = 'round';
        d.lineJoin = 'round';
        for (let i = 0; i < n - 1; i++) {
          d.lineWidth = wAt(i) * 0.9;
          d.beginPath();
          d.moveTo(pts[i]![0], pts[i]![1]);
          d.lineTo(pts[i + 1]![0], pts[i + 1]![1]);
          d.stroke();
        }
      });
    }
  }

  poly(pts: Pt[], color: RGB, alpha = 1) {
    const g = this.c;
    g.fillStyle = css(color, alpha);
    g.beginPath();
    pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])));
    g.closePath();
    g.fill();
    this.depthPath((d) => {
      d.beginPath();
      pts.forEach((p, i) => (i ? d.lineTo(p[0], p[1]) : d.moveTo(p[0], p[1])));
      d.closePath();
      d.fill();
    });
  }

  ellipse(x: number, y: number, rx: number, ry: number, rot: number, color: RGB, alpha = 1, line = 0) {
    const g = this.c;
    g.beginPath();
    g.ellipse(x, y, Math.max(0.5, rx), Math.max(0.5, ry), rot, 0, Math.PI * 2);
    if (line) {
      g.lineWidth = line;
      g.strokeStyle = css(color, alpha);
      g.stroke();
    } else {
      g.fillStyle = css(color, alpha);
      g.fill();
    }
    this.depthPath((d) => {
      d.beginPath();
      d.ellipse(x, y, Math.max(0.5, rx), Math.max(0.5, ry), rot, 0, Math.PI * 2);
      if (line) {
        d.lineWidth = line;
        d.stroke();
      } else d.fill();
    });
  }

  glow(x: number, y: number, r: number, color: RGB, alpha: number) {
    const g = this.c;
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, css(color, alpha));
    gr.addColorStop(1, css(color, 0));
    g.fillStyle = gr;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  }

  /** Set a picture into the plate, pushed towards paint by a filter, and its silhouette into the depth. */
  image(img: CanvasImageSource, x: number, y: number, w: number, h: number, filter = 'none', rot = 0, o: { fadeBottom?: number; fadeRight?: number; paint?: number } = {}) {
    // lay the picture on its own sheet first, so it can be painted over and faded
    const s = document.createElement('canvas');
    s.width = this.w;
    s.height = this.h;
    const sg = s.getContext('2d', { willReadFrequently: true })!;
    sg.save();
    sg.translate(x + w / 2, y + h / 2);
    sg.rotate(rot);
    sg.filter = filter;
    sg.drawImage(img, -w / 2, -h / 2, w, h);
    sg.restore();
    // brushwork over it: short strokes in its own colours, lighter and darker,
    // following no model but the hand — kept inside the silhouette
    const n = Math.round((o.paint ?? 1) * (w * h) / 900);
    if (n > 0) {
      const x0 = Math.max(0, Math.floor(x));
      const y0 = Math.max(0, Math.floor(y));
      const x1 = Math.min(this.w, Math.ceil(x + w));
      const y1 = Math.min(this.h, Math.ceil(y + h));
      if (x1 > x0 && y1 > y0) {
        const px = sg.getImageData(x0, y0, x1 - x0, y1 - y0);
        sg.save();
        sg.globalCompositeOperation = 'source-atop';
        sg.lineCap = 'round';
        for (let k = 0; k < n; k++) {
          const u = Math.floor(this.R() * (x1 - x0));
          const v = Math.floor(this.R() * (y1 - y0));
          const i = (v * (x1 - x0) + u) * 4;
          if (px.data[i + 3]! < 200) continue;
          const lift = (this.R() - 0.45) * 60;
          const c: RGB = [px.data[i]! + lift, px.data[i + 1]! + lift, px.data[i + 2]! + lift * 1.2];
          const a = this.R() * Math.PI;
          const L = 6 + this.R() * 16;
          sg.strokeStyle = css(c, 0.5);
          sg.lineWidth = 2 + this.R() * 5;
          sg.beginPath();
          sg.moveTo(x0 + u - Math.cos(a) * L, y0 + v - Math.sin(a) * L);
          sg.quadraticCurveTo(x0 + u, y0 + v + (this.R() - 0.5) * 6, x0 + u + Math.cos(a) * L, y0 + v + Math.sin(a) * L);
          sg.stroke();
        }
        sg.restore();
      }
    }
    // let the hard edges of the render dissolve
    sg.save();
    sg.globalCompositeOperation = 'destination-out';
    if (o.fadeBottom) {
      const gb = sg.createLinearGradient(0, y + h * (1 - o.fadeBottom), 0, y + h);
      gb.addColorStop(0, 'rgba(0,0,0,0)');
      gb.addColorStop(1, 'rgba(0,0,0,1)');
      sg.fillStyle = gb;
      sg.fillRect(0, y + h * (1 - o.fadeBottom), this.w, h * o.fadeBottom + 2);
    }
    if (o.fadeRight) {
      const gr = sg.createLinearGradient(x + w * (1 - o.fadeRight), 0, x + w, 0);
      gr.addColorStop(0, 'rgba(0,0,0,0)');
      gr.addColorStop(1, 'rgba(0,0,0,1)');
      sg.fillStyle = gr;
      sg.fillRect(x + w * (1 - o.fadeRight), 0, w * o.fadeRight + 2, this.h);
    }
    sg.restore();
    this.c.drawImage(s, 0, 0);
    const t = document.createElement('canvas');
    t.width = this.w;
    t.height = this.h;
    const tg = t.getContext('2d')!;
    tg.drawImage(s, 0, 0);
    tg.globalCompositeOperation = 'source-in';
    tg.fillStyle = `rgb(${this.depth},${this.depth},${this.depth})`;
    tg.fillRect(0, 0, this.w, this.h);
    this.d.drawImage(t, 0, 0);
  }

  /**
   * A sky of brush strokes turning about a centre: every stroke follows the
   * swirl, takes its colour from how far out it starts, and the big wet ones go
   * down before the small bright ones.
   */
  swirl(cx: number, cy: number, pal: RGB[], n: number, o: { minW?: number; maxW?: number; spiral?: number; len?: number; alpha?: number; reach?: number; squash?: number } = {}) {
    const minW = o.minW ?? 8;
    const maxW = o.maxW ?? 44;
    const reach = o.reach ?? Math.hypot(this.w, this.h) * 0.6;
    const squash = o.squash ?? 1;
    const marks: { pts: Pt[]; w: number; c: RGB }[] = [];
    for (let k = 0; k < n; k++) {
      let x = this.R() * (this.w + 200) - 100;
      let y = this.R() * (this.h + 200) - 100;
      const r0 = Math.hypot(x - cx, (y - cy) / squash);
      const u = Math.min(0.999, r0 / reach + (this.R() - 0.5) * 0.18);
      const pi = Math.max(0, Math.min(pal.length - 1.001, u * (pal.length - 1)));
      const c = mix(pal[Math.floor(pi)]!, pal[Math.ceil(pi)]!, pi - Math.floor(pi));
      const w = minW + Math.pow(this.R(), 1.6) * (maxW - minW) * (0.6 + u * 0.6);
      const L = (o.len ?? 170) * (0.5 + this.R());
      const pts: Pt[] = [[x, y]];
      const steps = 9;
      for (let s = 0; s < steps; s++) {
        const a = Math.atan2((y - cy) / squash, x - cx) + Math.PI / 2 + (o.spiral ?? 0.25);
        x += (Math.cos(a) * L) / steps;
        y += (Math.sin(a) * L * squash) / steps;
        pts.push([x, y]);
      }
      marks.push({ pts, w, c });
    }
    marks.sort((a, b) => b.w - a.w);
    for (const m of marks) this.stroke(m.pts, m.w, m.c, o.alpha ?? 0.85, { taper: 0.8 });
  }

  plate(): Plate {
    const rgba = this.c.getImageData(0, 0, this.w, this.h).data;
    const dd = this.d.getImageData(0, 0, this.w, this.h).data;
    const depth = new Uint8ClampedArray(this.w * this.h);
    for (let i = 0; i < depth.length; i++) depth[i] = dd[i * 4]!;
    return { w: this.w, h: this.h, rgba, depth };
  }
}

/* ────────────────────────────────────────────────────── recurring pieces */

/** One arm: tapering from the shoulder, gold at the armlet and the wrist, with something in its hand. */
function arm(e: Easel, sx: number, sy: number, ang: number, len: number, bend: number, skin: RGB, width: number, o: { dots?: boolean; hold?: string; gold?: RGB } = {}) {
  const pts: Pt[] = [];
  let a = ang;
  let x = sx;
  let y = sy;
  const n = 12;
  for (let i = 0; i <= n; i++) {
    pts.push([x, y]);
    a += bend / n;
    x += (Math.cos(a) * len) / n;
    y += (Math.sin(a) * len) / n;
  }
  const gold = o.gold ?? hex('#e8b64a');
  const dark = mix(skin, [10, 20, 60], 0.45);
  // shadow side, body, light side
  e.stroke(pts, width * 1.08, dark, 0.95, { taper: 0.45 });
  e.stroke(pts, width * 0.82, skin, 0.95, { taper: 0.45 });
  e.stroke(pts.map((p) => [p[0] - 3, p[1] - 4] as Pt), width * 0.28, mix(skin, [255, 255, 255], 0.35), 0.7, { taper: 0.6, depth: false });
  const at = (t: number): [number, number, number] => {
    const f = t * n;
    const i = Math.min(n - 1, Math.floor(f));
    const u = f - i;
    const p = pts[i]!;
    const q = pts[i + 1]!;
    return [p[0] + (q[0] - p[0]) * u, p[1] + (q[1] - p[1]) * u, Math.atan2(q[1] - p[1], q[0] - p[0])];
  };
  const wid = (t: number) => width * (1 - 0.45 + 0.45 * Math.max(0.25, Math.sin(Math.min(1, 0.15 + t * 0.95) * Math.PI)));
  // the armlet and the bracelets
  for (const [t, th] of [[0.3, 16], [0.84, 8], [0.9, 8]] as [number, number][]) {
    const [bx, by, ba] = at(t);
    const w = wid(t) * 0.52;
    const px = -Math.sin(ba);
    const py = Math.cos(ba);
    e.stroke([[bx - px * w, by - py * w], [bx + px * w, by + py * w]], th, gold, 1, { taper: 0.1, bristles: 2 });
  }
  if (o.dots) {
    for (let t = 0.36; t < 0.8; t += 0.035) {
      const [bx, by, ba] = at(t);
      const w = wid(t) * 0.15;
      e.ellipse(bx - Math.sin(ba) * w, by + Math.cos(ba) * w, 2.6, 2.6, 0, [250, 250, 255], 0.95);
    }
    for (let t = 0.4; t < 0.78; t += 0.09) {
      const [bx, by, ba] = at(t);
      e.stroke([[bx - Math.cos(ba) * 7, by - Math.sin(ba) * 7], [bx + Math.cos(ba) * 7, by + Math.sin(ba) * 7]].map((p) => [p[0] + Math.sin(ba) * wid(t) * 0.22, p[1] - Math.cos(ba) * wid(t) * 0.22] as Pt), 5, gold, 1, { bristles: 1, taper: 0 });
    }
  }
  const [hx, hy, ha] = at(1);
  e.ellipse(hx, hy, width * 0.42, width * 0.3, ha, skin, 1);
  if (o.hold) hold(e, o.hold, hx + Math.cos(ha) * width * 0.4, hy + Math.sin(ha) * width * 0.4, ha, width);
  return [hx, hy, ha] as const;
}

/** What the hands hold: the discus, the conch, the mace, the lotus, the bow, the sword. */
function hold(e: Easel, what: string, x: number, y: number, a: number, s: number) {
  const gold = hex('#f0c24e');
  const deep = hex('#b07a1a');
  const k = s / 40;
  if (what === 'chakra') {
    e.glow(x, y, 70 * k, [255, 220, 140], 0.6);
    e.ellipse(x, y, 34 * k, 34 * k, 0, deep, 1, 9 * k);
    e.ellipse(x, y, 28 * k, 28 * k, 0, gold, 1, 5 * k);
    for (let i = 0; i < 12; i++) {
      const t = (i / 12) * Math.PI * 2;
      e.stroke([[x + Math.cos(t) * 8 * k, y + Math.sin(t) * 8 * k], [x + Math.cos(t) * 30 * k, y + Math.sin(t) * 30 * k]], 3 * k, gold, 1, { bristles: 1, taper: 0 });
      e.ellipse(x + Math.cos(t) * 40 * k, y + Math.sin(t) * 40 * k, 5 * k, 3 * k, t, gold, 1);
    }
    e.ellipse(x, y, 8 * k, 8 * k, 0, [255, 244, 210], 1);
  } else if (what === 'conch') {
    e.ellipse(x, y, 30 * k, 19 * k, a, [248, 244, 236], 1);
    for (let i = 0; i < 3; i++) e.ellipse(x - Math.cos(a) * i * 8 * k, y - Math.sin(a) * i * 8 * k, (24 - i * 6) * k, (14 - i * 3) * k, a, [214, 200, 186], 1, 2.5 * k);
    e.ellipse(x + Math.cos(a) * 26 * k, y + Math.sin(a) * 26 * k, 8 * k, 6 * k, a, [240, 200, 190], 1);
  } else if (what === 'gada') {
    const ex = x + Math.cos(a) * 120 * k;
    const ey = y + Math.sin(a) * 120 * k;
    e.stroke([[x - Math.cos(a) * 20 * k, y - Math.sin(a) * 20 * k], [ex, ey]], 9 * k, deep, 1, { taper: 0, bristles: 2 });
    e.ellipse(ex, ey, 30 * k, 30 * k, 0, gold, 1);
    e.ellipse(ex - 8 * k, ey - 9 * k, 10 * k, 8 * k, 0, [255, 240, 190], 0.9);
  } else if (what === 'padma') {
    for (let i = 0; i < 7; i++) {
      const t = -Math.PI / 2 + (i - 3) * 0.38;
      e.ellipse(x + Math.cos(t) * 18 * k, y + Math.sin(t) * 18 * k, 22 * k, 10 * k, t, i % 2 ? hex('#f07aa8') : hex('#e04a86'), 1);
    }
    e.ellipse(x, y - 4 * k, 9 * k, 7 * k, 0, gold, 1);
  } else if (what === 'bow') {
    const pts: Pt[] = [];
    for (let i = 0; i <= 14; i++) {
      const t = (i / 14 - 0.5) * 2.2;
      pts.push([x + Math.cos(a + Math.PI / 2) * t * 70 * k + Math.cos(a) * Math.cos(t) * 30 * k, y + Math.sin(a + Math.PI / 2) * t * 70 * k + Math.sin(a) * Math.cos(t) * 30 * k]);
    }
    e.stroke(pts, 8 * k, [120, 60, 30], 1, { taper: 0.6, bristles: 2 });
    e.stroke([pts[0]!, pts[pts.length - 1]!], 1.6 * k, [250, 240, 220], 1, { bristles: 1, taper: 0 });
  } else if (what === 'sword') {
    const ex = x + Math.cos(a) * 160 * k;
    const ey = y + Math.sin(a) * 160 * k;
    e.stroke([[x, y], [ex, ey]], 10 * k, [214, 222, 236], 1, { taper: 0.5, bristles: 2 });
    e.stroke([[x - Math.sin(a) * 20 * k, y + Math.cos(a) * 20 * k], [x + Math.sin(a) * 20 * k, y - Math.cos(a) * 20 * k]], 7 * k, gold, 1, { taper: 0, bristles: 1 });
  }
}

/** A cobra's hood, fanned out behind the Lord: saffron outside, pale scales down its throat, two eyes. */
function hood(e: Easel, x: number, y: number, a: number, len: number, wid: number) {
  const outer = hex('#e2743a');
  const light = hex('#f5a765');
  const belly = hex('#f8e4c4');
  const ax = Math.cos(a);
  const ay = Math.sin(a);
  const px = -ay;
  const py = ax;
  const shape = (s: number, wmul: number): Pt[] => {
    const L: Pt[] = [];
    const Rr: Pt[] = [];
    for (let i = 0; i <= 16; i++) {
      const t = i / 16;
      const w = wid * wmul * Math.sin(Math.pow(t, 0.7) * Math.PI) * (1 - 0.35 * t);
      const cx = x + ax * len * t * s;
      const cy = y + ay * len * t * s;
      L.push([cx + px * w, cy + py * w]);
      Rr.unshift([cx - px * w, cy - py * w]);
    }
    return [...L, ...Rr];
  };
  e.poly(shape(1, 1.06), mix(outer, [90, 30, 10], 0.35));
  e.poly(shape(1, 0.98), outer);
  // strokes along the hood
  for (let k = 0; k < 7; k++) {
    const side = (k / 6 - 0.5) * 1.5;
    const pts: Pt[] = [];
    for (let i = 2; i <= 14; i++) {
      const t = i / 16;
      const w = wid * side * 0.55 * Math.sin(Math.pow(t, 0.7) * Math.PI) * (1 - 0.35 * t);
      pts.push([x + ax * len * t + px * w, y + ay * len * t + py * w]);
    }
    e.stroke(pts, 9, light, 0.55, { depth: false });
  }
  // the pale throat, in chevrons
  for (let i = 3; i < 13; i++) {
    const t = i / 16;
    const w = wid * 0.32 * Math.sin(Math.pow(t, 0.7) * Math.PI);
    const cx = x + ax * len * t;
    const cy = y + ay * len * t;
    e.stroke([[cx + px * w - ax * 8, cy + py * w - ay * 8], [cx + ax * 6, cy + ay * 6], [cx - px * w - ax * 8, cy - py * w - ay * 8]], 7, belly, 0.95, { taper: 0.3, bristles: 2, depth: false });
  }
  const ex = x + ax * len * 0.86;
  const ey = y + ay * len * 0.86;
  e.ellipse(ex + px * wid * 0.22, ey + py * wid * 0.22, 5, 4, a, [60, 20, 10], 1);
  e.ellipse(ex - px * wid * 0.22, ey - py * wid * 0.22, 5, 4, a, [60, 20, 10], 1);
}

/** A peacock feather: a stem, a fringe of barbs, and the eye in its rings. */
function feather(e: Easel, x: number, y: number, a: number, len: number) {
  const ax = Math.cos(a);
  const ay = Math.sin(a);
  const ex = x + ax * len;
  const ey = y + ay * len;
  e.stroke([[x, y], [ex, ey]], 4, [200, 170, 90], 1, { bristles: 1, taper: 0.4 });
  for (let i = 0; i < 40; i++) {
    const t = 0.25 + (i / 40) * 0.75;
    const bx = x + ax * len * t;
    const by = y + ay * len * t;
    for (const s of [-1, 1]) {
      const ba = a + s * (0.9 - t * 0.4);
      const bl = 22 + t * 30;
      e.stroke([[bx, by], [bx + Math.cos(ba) * bl, by + Math.sin(ba) * bl]], 3, mix(hex('#2f8a4a'), hex('#b9c24a'), e.R()), 0.7, { bristles: 1, taper: 0.8, depth: false });
    }
  }
  const rings: [string, number][] = [['#6a4a1a', 34], ['#1f9a5a', 28], ['#c8b24a', 22], ['#1a6fb0', 17], ['#123a8a', 11]];
  for (const [c, r] of rings) e.ellipse(ex, ey, r, r * 1.3, a + Math.PI / 2, hex(c), 1);
}

/** Ink figure: the charioteer's chariot, very small, on a far hill. */
function chariot(e: Easel, x: number, y: number, s: number) {
  const ink: RGB = [40, 14, 10];
  e.ellipse(x, y, 20 * s, 20 * s, 0, ink, 1, 4 * s);
  for (let i = 0; i < 8; i++) {
    const t = (i / 8) * Math.PI * 2;
    e.stroke([[x, y], [x + Math.cos(t) * 20 * s, y + Math.sin(t) * 20 * s]], 2 * s, ink, 1, { bristles: 1, taper: 0 });
  }
  e.poly([[x - 30 * s, y - 14 * s], [x + 40 * s, y - 14 * s], [x + 30 * s, y - 40 * s], [x - 26 * s, y - 40 * s]], ink);
  e.stroke([[x - 20 * s, y - 40 * s], [x - 22 * s, y - 110 * s]], 3 * s, ink, 1, { bristles: 1, taper: 0 });
  e.poly([[x - 22 * s, y - 110 * s], [x + 8 * s, y - 100 * s], [x - 22 * s, y - 92 * s]], [200, 60, 30]);
  // the archer, kneeling, bow at his side
  e.ellipse(x + 8 * s, y - 56 * s, 7 * s, 8 * s, 0, ink, 1);
  e.poly([[x - 4 * s, y - 48 * s], [x + 20 * s, y - 48 * s], [x + 16 * s, y - 38 * s], [x, y - 38 * s]], ink);
  e.stroke([[x + 26 * s, y - 80 * s], [x + 34 * s, y - 56 * s], [x + 26 * s, y - 32 * s]], 2.5 * s, ink, 1, { bristles: 1, taper: 0.2 });
  // two horses
  for (const hx of [x + 60 * s, x + 78 * s]) {
    e.ellipse(hx, y - 20 * s, 16 * s, 8 * s, 0, ink, 1);
    e.stroke([[hx + 10 * s, y - 24 * s], [hx + 22 * s, y - 42 * s]], 6 * s, ink, 1, { bristles: 1, taper: 0.2 });
    for (const lx of [-10, -4, 6, 12]) e.stroke([[hx + lx * s, y - 16 * s], [hx + lx * s + 2 * s, y + 4 * s]], 2.5 * s, ink, 1, { bristles: 1, taper: 0 });
  }
}

/* ────────────────────────────────────────────────────── the plates */

interface Busts {
  face: HTMLImageElement;
  hero: HTMLImageElement;
  side: HTMLImageElement;
}

const W = PLATE_W;
const H = PLATE_H;

/** 00 — A fan of faces: the one face, and the same face again and again behind it, on a turning mandala. */
function paintFaces(b: Busts): Plate {
  const e = new Easel(W, H, 101);
  const bg = e.c;
  bg.fillStyle = '#6b4a2e';
  bg.fillRect(0, 0, W, H);
  e.z(10).swirl(500, 420, ['#f3c27a', '#d48a4a', '#9a5a36', '#5a3622', '#2e1c14'].map(hex), 900, { maxW: 40, spiral: 0.05, len: 140, alpha: 0.9 });
  // the mandala: dotted rings
  for (let r = 120; r < 700; r += 46) {
    const n = Math.floor((r * Math.PI * 2) / 26);
    for (let i = 0; i < n; i++) {
      const t = (i / n) * Math.PI * 2;
      e.z(20).ellipse(500 + Math.cos(t) * r, 420 + Math.sin(t) * r, 5, 3, t, r % 92 ? hex('#f6d49a') : hex('#c9803e'), 0.55);
    }
  }
  const skin = hex('#2f78e0');
  // arms first: seven each side, fanning from the shoulders
  const holds = ['chakra', 'conch', 'gada', 'padma', 'bow', 'sword', 'chakra'];
  for (const side of [-1, 1]) {
    for (let i = 6; i >= 0; i--) {
      const ang = side > 0 ? -0.55 + i * 0.26 : Math.PI + 0.55 - i * 0.26;
      e.z(60 + i * 4);
      arm(e, 500 + side * 150, 700, ang, 430 - i * 14, side * 0.12, mix(skin, [255, 255, 255], i * 0.03), 56 - i * 2, { dots: true, hold: holds[(i + (side > 0 ? 0 : 3)) % holds.length] });
    }
  }
  // the torso
  e.z(110);
  e.poly([[330, 640], [670, 640], [640, 1250], [360, 1250]], mix(skin, [0, 0, 30], 0.2));
  for (let k = 0; k < 90; k++) {
    const x = 340 + e.R() * 320;
    const y = 650 + e.R() * 580;
    e.stroke([[x, y], [x + (e.R() - 0.5) * 30, y + 40 + e.R() * 60]], 14 + e.R() * 16, mix(skin, [255, 255, 255], e.R() * 0.3), 0.6, { depth: false });
  }
  // a lotus flourish on the chest
  e.z(130);
  for (let i = 0; i < 9; i++) {
    const t = -Math.PI / 2 + (i - 4) * 0.33;
    e.ellipse(500 + Math.cos(t) * 40, 760 + Math.sin(t) * 40, 42, 11, t, i % 2 ? hex('#ff5a9a') : hex('#d8286e'), 0.95);
  }
  e.ellipse(500, 770, 16, 12, 0, hex('#ffd36a'), 1);
  for (const s of [-1, 1]) e.stroke([[500 + s * 60, 740], [500 + s * 120, 720], [500 + s * 150, 690]], 12, hex('#f0b43a'), 0.95, { taper: 0.7 });
  // the cavity where the child plays: a gold arch, a warm light, a flute and a feather
  e.z(140);
  e.poly([[400, 1250], [400, 960], [500, 880], [600, 960], [600, 1250]], [30, 16, 20]);
  e.glow(500, 1080, 150, [255, 200, 110], 0.8);
  e.stroke([[400, 1250], [400, 960], [500, 880], [600, 960], [600, 1250]], 12, hex('#f0c24e'), 1, { taper: 0 });
  for (let x = 420; x <= 580; x += 16) e.stroke([[x, 950 + Math.abs(x - 500) * 0.6], [x, 1010 + Math.abs(x - 500) * 0.4]], 3, [250, 240, 230], 0.9, { bristles: 1, taper: 0.3 });
  e.stroke([[430, 1150], [590, 1070]], 11, [110, 60, 30], 1, { taper: 0.1, bristles: 2 });
  feather(e, 505, 1180, -Math.PI / 2 - 0.25, 150);
  // the faces: the outermost first, each nearer one over it
  const fw = 300;
  const fh = (fw * b.face.height) / b.face.width;
  for (let i = 4; i >= 1; i--) {
    for (const side of [-1, 1]) {
      const s = Math.pow(0.84, i);
      const x = 500 + side * (130 + 95 * (i - 1)) - (fw * s) / 2;
      const y = 350 + 28 * i - (fh * s) / 2;
      e.z(150 + (4 - i) * 12).image(b.face, x, y, fw * s, fh * s, `saturate(1.25) brightness(${1.35 - i * 0.07}) contrast(1.05)`, side * 0.1 * i, { fadeBottom: 0.3 });
    }
  }
  e.z(230).image(b.face, 500 - fw / 2, 330 - fh / 2, fw, fh, 'saturate(1.25) brightness(1.4) contrast(1.05)', 0, { fadeBottom: 0.25 });
  return e.plate();
}

/** 01 — The bed of arrows at sundown: a low sun, a purple field, the old warrior laid on his arrows. */
function paintArrows(): Plate {
  const e = new Easel(W, H, 202);
  const g = e.c;
  const sky = g.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#3a2a6a');
  sky.addColorStop(0.45, '#d8587a');
  sky.addColorStop(0.62, '#f6a45a');
  sky.addColorStop(1, '#3a1a2a');
  g.fillStyle = sky;
  g.fillRect(0, 0, W, H);
  e.z(5).swirl(520, 640, ['#fff1c8', '#ffc478', '#f58a5a', '#d4507a', '#8a4a9a', '#3a2a6a'].map(hex), 1100, { maxW: 36, spiral: 0.02, squash: 0.45, len: 200, alpha: 0.85 });
  e.glow(520, 660, 260, [255, 230, 160], 0.9);
  e.z(15).ellipse(520, 660, 90, 90, 0, hex('#fff3cf'), 1);
  // the field
  e.z(40).poly([[0, 820], [260, 790], [600, 810], [1000, 780], [1000, 1250], [0, 1250]], hex('#4a1f35'));
  for (let k = 0; k < 500; k++) {
    const x = e.R() * W;
    const y = 800 + Math.pow(e.R(), 0.8) * 450;
    e.stroke([[x, y], [x + 40 + e.R() * 70, y + (e.R() - 0.5) * 8]], 6 + e.R() * 14, mix(hex('#7a2f4a'), hex('#2a0f1f'), (y - 800) / 450 + (e.R() - 0.5) * 0.3), 0.7, { depth: false });
  }
  // the arrows, a thicket, the old man held up on them
  const bx0 = 200;
  const bx1 = 820;
  for (let k = 0; k < 420; k++) {
    const x = bx0 + e.R() * (bx1 - bx0);
    const base = 1010 + e.R() * 40;
    const top = 900 + Math.sin(((x - bx0) / (bx1 - bx0)) * Math.PI) * -20 + e.R() * 30;
    const lean = (e.R() - 0.5) * 60;
    e.z(90 + e.R() * 30).stroke([[x, base], [x + lean, top]], 3, [30, 12, 16], 0.95, { bristles: 1, taper: 0 });
    if (e.R() < 0.5) e.ellipse(x + lean, top, 3, 7, Math.atan2(top - base, lean) + Math.PI / 2, hex('#f0c24e'), 1);
    if (e.R() < 0.4) e.stroke([[x + lean * 0.1, base - 6], [x + lean * 0.1 - 6, base - 22]], 4, [240, 230, 220], 0.9, { bristles: 1, taper: 0.4 });
  }
  // Bhishma: white robe, white beard, a hand raised in blessing
  e.z(160);
  e.poly([[260, 905], [760, 895], [790, 925], [240, 935]], hex('#f4efe6'));
  for (let k = 0; k < 40; k++) {
    const x = 270 + e.R() * 480;
    e.stroke([[x, 900 + e.R() * 10], [x + 30, 912 + e.R() * 12]], 8, mix(hex('#fffaf0'), hex('#c9c2d8'), e.R()), 0.7, { depth: false });
  }
  e.ellipse(215, 895, 32, 28, 0, hex('#c98a5a'), 1);
  e.stroke([[190, 912], [210, 950], [240, 930]], 22, hex('#f8f6f2'), 1, { taper: 0.4 });
  e.stroke([[200, 872], [230, 860], [250, 880]], 14, hex('#f8f6f2'), 1, { taper: 0.4 });
  e.stroke([[320, 900], [340, 840], [350, 790]], 16, hex('#c98a5a'), 1, { taper: 0.3 });
  e.ellipse(352, 780, 12, 16, 0, hex('#c98a5a'), 1);
  // the watchers, small, dark against the sky: the brothers, and one in yellow
  for (let i = 0; i < 6; i++) {
    const x = 610 + i * 55;
    const y = 870 - (i === 3 ? 12 : 0);
    const c: RGB = i === 3 ? hex('#f0c24e') : [30, 14, 22];
    e.z(120).ellipse(x, y - 60, 11, 13, 0, i === 3 ? hex('#2f6fd6') : [30, 14, 22], 1);
    e.poly([[x - 14, y - 46], [x + 14, y - 46], [x + 20, y + 20], [x - 20, y + 20]], c);
  }
  return e.plate();
}

/** 02 — Lotus and fire: a sky that burns in circles, a great faceted lotus, the blue Lord leaning in. */
function paintLotus(b: Busts): Plate {
  const e = new Easel(W, H, 303);
  const g = e.c;
  g.fillStyle = '#7a1a2a';
  g.fillRect(0, 0, W, H);
  e.z(5).swirl(420, 430, ['#fff0d0', '#ffc88a', '#ff8a4a', '#f0402a', '#b01a3a', '#5a1030'].map(hex), 1400, { maxW: 52, minW: 12, spiral: 0.12, len: 150, alpha: 0.92 });
  e.glow(420, 430, 220, [255, 240, 210], 0.85);
  // a cool pool of light where the Lord's hand reaches
  e.z(12).swirl(300, 620, ['#e8fbff', '#9fe2ff', '#4aa8f0', '#2a5ab8'].map(hex), 260, { maxW: 30, spiral: 0.3, len: 90, reach: 260, alpha: 0.7 });
  // the Lord, three-quarter, from the right
  const sw = 560;
  const sh = (sw * b.side.height) / b.side.width;
  e.z(140).image(b.side, 470, 60, sw, sh, 'saturate(1.3) brightness(1.4) hue-rotate(-8deg) contrast(1.05)', 0, { fadeBottom: 0.35, fadeRight: 0.12 });
  // the lotus: three rings of petals, each petal cut into facets
  const cx = 470;
  const cy = 1060;
  const pal = ['#7a1a6a', '#b0226e', '#e0407a', '#f27aa8', '#ffc2d8'].map(hex);
  const rings: [number, number, number, number, number][] = [
    [9, 360, 110, 0.0, 170],
    [8, 280, 95, 0.2, 190],
    [7, 190, 80, 0.1, 210],
  ];
  for (const [np, len, wd, off, z] of rings) {
    for (let i = 0; i < np; i++) {
      const a = -Math.PI / 2 + ((i + off) / np - 0.5) * Math.PI * 1.25;
      const ax = Math.cos(a);
      const ay = Math.sin(a) * 0.72;
      const px = -Math.sin(a);
      const py = Math.cos(a) * 0.72;
      const tip: Pt = [cx + ax * len, cy + ay * len];
      const mid: Pt = [cx + ax * len * 0.45, cy + ay * len * 0.45];
      const l: Pt = [mid[0] + px * wd, mid[1] + py * wd];
      const r: Pt = [mid[0] - px * wd, mid[1] - py * wd];
      const base: Pt = [cx + ax * 20, cy + ay * 20];
      e.z(z);
      const shade = Math.max(0, Math.min(3, 1 + Math.round(ax * 1.5)));
      e.poly([base, l, tip], pal[shade]!);
      e.poly([base, r, tip], pal[Math.min(4, shade + 1)]!);
      e.poly([mid, [(l[0] + tip[0]) / 2, (l[1] + tip[1]) / 2], tip], pal[Math.max(0, shade - 1)]!, 0.8);
      e.stroke([base, tip], 3, pal[4]!, 0.7, { bristles: 1, taper: 0.5, depth: false });
    }
  }
  e.z(230).ellipse(cx, cy - 30, 70, 38, 0, hex('#f0c24e'), 1);
  for (let i = 0; i < 40; i++) e.ellipse(cx + (e.R() - 0.5) * 110, cy - 40 + (e.R() - 0.5) * 40, 4, 4, 0, hex('#fff2b0'), 1);
  return e.plate();
}

/** 04 — The Universal Form over Kurukshetra: hoods, arms, the red scarf, and a chariot very far below. */
function paintVishvarupa(b: Busts): Plate {
  const e = new Easel(W, H, 404);
  const g = e.c;
  const sky = g.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#f6e0d0');
  sky.addColorStop(0.6, '#e8b0a8');
  sky.addColorStop(1, '#8a3a3a');
  g.fillStyle = sky;
  g.fillRect(0, 0, W, H);
  e.z(5).swirl(500, 330, ['#ffffff', '#fff1dc', '#f8d0a8', '#f0a070', '#e0707a', '#a88ac8', '#6a4a8a'].map(hex), 1500, { maxW: 46, spiral: 0.18, len: 190, alpha: 0.8 });
  e.glow(500, 330, 380, [255, 255, 250], 0.95);
  // the serpent's coils and hoods, a canopy
  e.z(40);
  for (let k = 0; k < 3; k++) {
    const pts: Pt[] = [];
    for (let i = 0; i <= 30; i++) {
      const t = i / 30;
      const a = Math.PI * (1.05 + t * 0.9);
      pts.push([500 + Math.cos(a) * (360 - k * 30), 520 + Math.sin(a) * (300 - k * 30) + t * 20]);
    }
    e.stroke(pts, 70 - k * 10, mix(hex('#d86a30'), hex('#f5b070'), k * 0.4), 0.95);
  }
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI / 2 + (i - 3) * 0.33;
    e.z(50 + (3 - Math.abs(i - 3)) * 4);
    hood(e, 500 + Math.cos(a) * 250, 470 + Math.sin(a) * 200, a, 190, 72);
  }
  // twelve arms, six a side, each with something in its hand
  const holds = ['chakra', 'sword', 'bow', 'conch', 'gada', 'padma'];
  const skin = hex('#8a9ae0');
  for (const side of [-1, 1]) {
    for (let i = 0; i < 6; i++) {
      const ang = side > 0 ? -0.95 + i * 0.36 : Math.PI + 0.95 - i * 0.36;
      e.z(80 + i * 3);
      arm(e, 500 + side * 120, 610, ang, 330 - Math.abs(i - 2.5) * 12, side * (i < 3 ? -0.25 : 0.25), mix(skin, [255, 255, 255], 0.15 + i * 0.03), 44, { hold: holds[(i + (side > 0 ? 0 : 2)) % holds.length], gold: hex('#f0c24e') });
    }
  }
  // the garment: pleats of gold falling and flaring
  e.z(120);
  for (let k = 0; k < 160; k++) {
    const t = e.R();
    const x0 = 500 + (t - 0.5) * 230;
    const x1 = 500 + (t - 0.5) * 520;
    const c = mix(hex('#fff1c4'), hex('#e0a030'), e.R());
    e.stroke([[x0, 790], [x0 + (x1 - x0) * 0.5 + (e.R() - 0.5) * 20, 960], [x1, 1150]], 12 + e.R() * 14, c, 0.75);
  }
  // the bust
  const hw = 600;
  const hh = (hw * b.hero.height) / b.hero.width;
  e.z(200).image(b.hero, 500 - hw / 2, 330 - hh * 0.385, hw, hh, 'saturate(1.2) brightness(1.45) contrast(1.02)', 0, { fadeBottom: 0.22 });
  e.glow(500, 250, 200, [255, 250, 240], 0.35);
  // the red scarf, flying
  e.z(215);
  const wave = (x0: number, y0: number, x1: number, y1: number, amp: number, ph: number): Pt[] => {
    const pts: Pt[] = [];
    for (let i = 0; i <= 24; i++) {
      const t = i / 24;
      pts.push([x0 + (x1 - x0) * t + Math.sin(t * 7 + ph) * amp * t, y0 + (y1 - y0) * t + Math.cos(t * 5 + ph) * amp * 0.4]);
    }
    return pts;
  };
  for (let k = 0; k < 14; k++) {
    const ph = e.R() * 1.2;
    const dx = (e.R() - 0.5) * 50;
    e.stroke(wave(385 + dx, 560, 300 + dx, 1250, 70, ph), 18 + e.R() * 26, mix(hex('#ff4a22'), hex('#c8102a'), e.R()), 0.35, { taper: 0.5 });
    e.stroke(wave(625 + dx, 560, 1060 + dx, 1000, 60, ph + 2), 16 + e.R() * 22, mix(hex('#ff5a2a'), hex('#d01a1a'), e.R()), 0.33, { taper: 0.6 });
  }
  // the hill, and the chariot on it
  e.z(30).poly([[0, 1060], [400, 1100], [1000, 1010], [1000, 1250], [0, 1250]], hex('#7a2a1c'));
  for (let k = 0; k < 400; k++) {
    const x = e.R() * W;
    const y = 1040 + e.R() * 210;
    e.stroke([[x, y], [x + 50 + e.R() * 60, y - 6 + e.R() * 12]], 6 + e.R() * 12, mix(hex('#c0452a'), hex('#3a1210'), e.R()), 0.7, { depth: false });
  }
  e.z(60);
  chariot(e, 190, 1130, 1.1);
  return e.plate();
}

/** 06 — Portrait: the Lord in the round, a wheel of peacock feathers behind him, a saffron sun. */
function paintPortrait(b: Busts): Plate {
  const e = new Easel(W, H, 606);
  const g = e.c;
  g.fillStyle = '#f7c98a';
  g.fillRect(0, 0, W, H);
  e.z(5).swirl(500, 420, ['#fffbe8', '#ffe2a0', '#ffb86a', '#f28a6a', '#e0608a', '#9a5ab0'].map(hex), 1300, { maxW: 44, spiral: -0.1, len: 170, alpha: 0.85 });
  e.glow(500, 420, 330, [255, 250, 225], 0.95);
  for (let i = 0; i < 15; i++) {
    const a = -Math.PI / 2 + (i - 7) * 0.2;
    e.z(40 + (7 - Math.abs(i - 7)) * 3);
    feather(e, 500 + Math.cos(a) * 60, 560 + Math.sin(a) * 60, a, 400 + (i % 2) * 40);
  }
  const hw = 640;
  const hh = (hw * b.hero.height) / b.hero.width;
  e.z(200).image(b.hero, 500 - hw / 2, 420 - hh * 0.385, hw, hh, 'saturate(1.25) brightness(1.4) contrast(1.05)', 0, { fadeBottom: 0.2 });
  // a garland of marigolds across the bottom
  e.z(230);
  for (let i = 0; i < 60; i++) {
    const t = i / 59;
    const x = 150 + t * 700;
    const y = 1080 + Math.sin(t * Math.PI) * 90;
    e.ellipse(x, y, 16, 14, 0, i % 3 ? hex('#ff9a1a') : hex('#ffd02a'), 1);
    e.ellipse(x, y, 6, 5, 0, hex('#c05a0a'), 1);
  }
  return e.plate();
}

/** Paint every plate, yielding between them so the page stays alive. */
export async function paintPlates(base: string, onPlate: (name: PlateName, p: Plate) => void) {
  const [face, hero, side] = await Promise.all([
    loadImage(base + 'gita-epic/img/k_face.webp'),
    loadImage(base + 'gita-epic/img/k_hero.webp'),
    loadImage(base + 'gita-epic/img/k_34.webp'),
  ]);
  const b: Busts = { face, hero, side };
  const jobs: [PlateName, () => Plate][] = [
    ['faces', () => paintFaces(b)],
    ['vishvarupa', () => paintVishvarupa(b)],
    ['lotus', () => paintLotus(b)],
    ['arrows', () => paintArrows()],
    ['portrait', () => paintPortrait(b)],
  ];
  for (const [name, job] of jobs) {
    await new Promise((r) => setTimeout(r, 0));
    onPlate(name, job());
  }
}

/** For looking at the plates on their own. */
export function plateToCanvas(p: Plate, which: 'rgba' | 'depth' = 'rgba') {
  const c = document.createElement('canvas');
  c.width = p.w;
  c.height = p.h;
  const g = c.getContext('2d')!;
  const im = g.createImageData(p.w, p.h);
  if (which === 'rgba') im.data.set(p.rgba);
  else for (let i = 0; i < p.depth.length; i++) { im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = p.depth[i]!; im.data[i * 4 + 3] = 255; }
  g.putImageData(im, 0, 0);
  return c;
}
