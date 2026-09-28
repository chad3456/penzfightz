/**
 * The pictures the cosmos is made of.
 *
 * Four of them are paintings the site's owner chose — public-domain
 * photographs of devotional art (see public/sahasranama/art/README.md) — loaded as images and
 * turned into plates: the colour as it is, and a depth layer guessed from the
 * picture itself (brighter, more saturated and more central reads as nearer),
 * so that the strokes stand apart a little when the picture turns.
 *
 * The fifth, the bed of arrows at sundown, is painted here at load time on a
 * canvas, stroke by stroke, with a seeded hand; alongside the colour every mark
 * also goes into a depth canvas in flat grey.
 */

export type PlateName = 'faces' | 'arrows' | 'lotus' | 'vishvarupa' | 'portrait';

/** The shared paintings, by plate, with the file each comes from. */
export const ART: Record<Exclude<PlateName, 'arrows'>, string> = {
  faces: 'sahasranama/art/many-faces.webp',
  lotus: 'sahasranama/art/lingodbhava.webp',
  vishvarupa: 'sahasranama/art/vishvarupa-arjuna.webp',
  portrait: 'sahasranama/art/trimurti.webp',
};

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

const W = PLATE_W;
const H = PLATE_H;

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

/**
 * A painting as a plate. The picture is drawn at a working size (its long side
 * 1200 px) and given a depth layer guessed from itself: a heavily smoothed mix
 * of brightness, saturation and nearness to the centre.
 */
export async function artPlate(url: string): Promise<Plate> {
  const im = await loadImage(url);
  const k = 1200 / Math.max(im.width, im.height);
  const w = Math.round(im.width * k);
  const h = Math.round(im.height * k);
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d', { willReadFrequently: true })!;
  g.drawImage(im, 0, 0, w, h);
  const rgba = g.getImageData(0, 0, w, h).data;
  // the depth, worked out small and smoothed by the browser on the way back up
  const sw = 48;
  const sh = Math.max(8, Math.round((sw * h) / w));
  const s = document.createElement('canvas');
  s.width = sw;
  s.height = sh;
  const sg = s.getContext('2d', { willReadFrequently: true })!;
  sg.drawImage(c, 0, 0, sw, sh);
  const small = sg.getImageData(0, 0, sw, sh);
  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      const i = (y * sw + x) * 4;
      const r = small.data[i]!;
      const gg = small.data[i + 1]!;
      const b = small.data[i + 2]!;
      const lum = (0.3 * r + 0.59 * gg + 0.11 * b) / 255;
      const sat = (Math.max(r, gg, b) - Math.min(r, gg, b)) / 255;
      const cx = x / (sw - 1) - 0.5;
      const cy = y / (sh - 1) - 0.45;
      const centre = Math.max(0, 1 - Math.hypot(cx * 1.3, cy) * 1.6);
      const v = Math.max(0, Math.min(1, 0.4 * lum + 0.25 * sat + 0.45 * centre));
      small.data[i] = small.data[i + 1] = small.data[i + 2] = v * 255;
    }
  }
  sg.putImageData(small, 0, 0);
  const d = document.createElement('canvas');
  d.width = w;
  d.height = h;
  const dg = d.getContext('2d', { willReadFrequently: true })!;
  dg.imageSmoothingQuality = 'high';
  dg.filter = 'blur(12px)';
  dg.drawImage(s, 0, 0, w, h);
  const dd = dg.getImageData(0, 0, w, h).data;
  const depth = new Uint8ClampedArray(w * h);
  for (let i = 0; i < depth.length; i++) depth[i] = dd[i * 4]!;
  return { w, h, rgba, depth };
}

/** The top part of a plate (for the crown of heads in the cosmic body). */
export function cropTop(p: Plate, frac: number): Plate {
  const h = Math.round(p.h * frac);
  return { w: p.w, h, rgba: p.rgba.slice(0, p.w * h * 4), depth: p.depth.slice(0, p.w * h) };
}

/** Load every plate, yielding between them so the page stays alive. */
export async function paintPlates(base: string, onPlate: (name: PlateName, p: Plate) => void) {
  const order: Exclude<PlateName, 'arrows'>[] = ['faces', 'vishvarupa', 'lotus', 'portrait'];
  const pending = order.map((n) => artPlate(base + ART[n]));
  for (let i = 0; i < order.length; i++) {
    const plate = await pending[i]!;
    await new Promise((r) => setTimeout(r, 0));
    onPlate(order[i]!, plate);
    if (i === 1) {
      await new Promise((r) => setTimeout(r, 0));
      onPlate('arrows', paintArrows());
    }
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

