/**
 * The painter: composes one frame of the panorama for a given scene state.
 *
 * Three canvases: `sky` (gradient, glow, stars, moon, clouds, the far city),
 * `mid` (buildings, ground, people, railing, lights), and the visible canvas,
 * which gets sky + mid above the waterline and then a rippled mirror of both
 * below it.
 */

import { drawFigure, INK } from './figures';
import { BEATS, type Fig, type Scene, type Sky, type Who } from './story';
import { COUNTRY_END, FACADE_BASE, PAVE, WATER, WORLD_W, buildWorld, groundY, rng, type Building, type Far, type World } from './world';
import { Visions } from './visions';

type RGB = [number, number, number];
const hex = (h: string): RGB => { const v = parseInt(h.slice(1), 16); return [(v >> 16) & 255, (v >> 8) & 255, v & 255]; };
const mixc = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const css = (c: RGB, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (v: number, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
const smooth = (t: number) => t * t * (3 - 2 * t);

/** Light for each kind of sky: zenith, middle, horizon, horizon glow, grade over the city, water. */
type Palette = { top: RGB; mid: RGB; hor: RGB; glow: RGB; glowA: number; grade: RGB; gradeA: number; water: RGB; deep: RGB; cloud: RGB; win: number };
const PAL: Record<Sky, Palette> = {
  white: { top: hex('#4f5d8f'), mid: hex('#a3aed2'), hor: hex('#f0d6cc'), glow: hex('#ffcf9e'), glowA: 0.55, grade: hex('#5a5296'), gradeA: 0.26, water: hex('#7e88ad'), deep: hex('#2e3556'), cloud: hex('#e8c9cf'), win: 1 },
  starry: { top: hex('#1f2654'), mid: hex('#5d6497'), hor: hex('#e2bcb6'), glow: hex('#ffc59a'), glowA: 0.45, grade: hex('#2f2f74'), gradeA: 0.4, water: hex('#4f5784'), deep: hex('#181d3a'), cloud: hex('#b49cb7'), win: 1 },
  day: { top: hex('#7a9fcd'), mid: hex('#c3d5e8'), hor: hex('#f6eedf'), glow: hex('#fff2cf'), glowA: 0.3, grade: hex('#ffffff'), gradeA: 0, water: hex('#8eaabf'), deep: hex('#3f5a6d'), cloud: hex('#ffffff'), win: 0 },
  golden: { top: hex('#7d93c4'), mid: hex('#e7c7a8'), hor: hex('#ffd49a'), glow: hex('#ffb56a'), glowA: 0.6, grade: hex('#ff9f5a'), gradeA: 0.14, water: hex('#a99aa5'), deep: hex('#4b4560'), cloud: hex('#ffe0c0'), win: 0.2 },
  rain: { top: hex('#4f5762'), mid: hex('#7f8891'), hor: hex('#a7adb0'), glow: hex('#c9c6bf'), glowA: 0.2, grade: hex('#3d4855'), gradeA: 0.36, water: hex('#5f6a74'), deep: hex('#262e36'), cloud: hex('#9ca3a9'), win: 0.8 },
  dawn: { top: hex('#7f95cb'), mid: hex('#e3bfcb'), hor: hex('#ffdcbc'), glow: hex('#ffc89a'), glowA: 0.7, grade: hex('#ff9fa0'), gradeA: 0.12, water: hex('#a99cb6'), deep: hex('#47405f'), cloud: hex('#ffd6d0'), win: 0.5 },
  dream: { top: hex('#120f2c'), mid: hex('#3b2d63'), hor: hex('#b4799a'), glow: hex('#ffb37a'), glowA: 0.5, grade: hex('#1d1450'), gradeA: 0.5, water: hex('#3a3260'), deep: hex('#0d0b20'), cloud: hex('#6c4f87'), win: 1.3 },
  memory: { top: hex('#5d4c46'), mid: hex('#a68a75'), hor: hex('#e2c6a3'), glow: hex('#ffd7a0'), glowA: 0.4, grade: hex('#6b4a32'), gradeA: 0.42, water: hex('#7a6658'), deep: hex('#2c221d'), cloud: hex('#d2b59a'), win: 1 },
  grey: { top: hex('#5f666f'), mid: hex('#8f959b'), hor: hex('#bdbab3'), glow: hex('#d6d1c6'), glowA: 0.15, grade: hex('#4c545c'), gradeA: 0.3, water: hex('#68707a'), deep: hex('#2a3037'), cloud: hex('#a8adb2'), win: 0.4 },
  clear: { top: hex('#1d2a62'), mid: hex('#4f6aa5'), hor: hex('#c7c3d6'), glow: hex('#ffe0b8'), glowA: 0.35, grade: hex('#26306e'), gradeA: 0.38, water: hex('#4d5f92'), deep: hex('#141a3a'), cloud: hex('#e9d28a'), win: 1 },
};

function mixPal(a: Palette, b: Palette, t: number): Palette {
  return {
    top: mixc(a.top, b.top, t), mid: mixc(a.mid, b.mid, t), hor: mixc(a.hor, b.hor, t), glow: mixc(a.glow, b.glow, t), glowA: lerp(a.glowA, b.glowA, t),
    grade: mixc(a.grade, b.grade, t), gradeA: lerp(a.gradeA, b.gradeA, t), water: mixc(a.water, b.water, t), deep: mixc(a.deep, b.deep, t),
    cloud: mixc(a.cloud, b.cloud, t), win: lerp(a.win, b.win, t),
  };
}

/** The interpolated state the painter works from. */
export type Frame = {
  cam: number; zoom: number; cy: number; pal: Palette;
  rain: number; stars: number; lamps: number; windows: number; fluff: number; moon: number;
  carts: number; barge: number; paint: number; bell: number; notes: number;
  figs: { who: Who; x: number; pose: Fig['pose']; face: 1 | -1; a: number; walk: number }[];
  visions: { v: string; a: number }[];
  /** 0..1 progress through the current beat's hold, for things that build up while you read. */
  hold: number;
  beat: number;
};

const WHO: Who[] = ['dreamer', 'nastenka', 'gent', 'lodger', 'passer'];

/** Where the story is at scroll position b (beats, fractional). */
export function frameAt(b: number): Frame {
  const n = BEATS.length;
  const i = clamp(Math.floor(b), 0, n - 1);
  const f = clamp(b - i, 0, 1);
  // read first, then move: hold for the first part of each beat, transition in the rest
  const tr = smooth(clamp((f - 0.5) / 0.5));
  const hold = clamp(f / 0.5);
  const A = BEATS[i].scene, B = BEATS[Math.min(n - 1, i + 1)].scene;
  const camA = A.cam + (A.camDx ?? 0) * hold, camB = B.cam;
  const num = (k: keyof Scene, d = 0) => lerp((A[k] as number) ?? d, (B[k] as number) ?? d, tr);
  const zA = A.zoom ?? 1, zB = B.zoom ?? 1;
  const cyDef = (z: number) => lerp(500, 590, clamp((z - 1) / 1.6));
  const figs: Frame['figs'] = [];
  for (const who of WHO) {
    const fa = A.figs?.[who], fb = B.figs?.[who];
    if (!fa && !fb) continue;
    const xa = fa ? fa.x + (fa.dx ?? 0) * hold : 0;
    const xb = fb ? fb.x : 0;
    let x: number, a: number, pose: Fig['pose'], face: 1 | -1;
    if (fa && fb) {
      x = lerp(xa, xb, tr);
      a = lerp(fa.a ?? 1, fb.a ?? 1, tr);
      const moving = Math.abs(xb - xa) > 30 && tr > 0.02 && tr < 0.98;
      pose = moving ? 'walk' : tr < 0.5 ? fa.pose : fb.pose;
      face = moving ? (xb > xa ? 1 : -1) : (tr < 0.5 ? fa.face ?? 1 : fb.face ?? 1);
      if (moving && Math.abs(xb - xa) > 260) pose = fa.pose === 'run' || fb.pose === 'run' ? 'run' : 'walk';
    } else if (fa) {
      x = xa; a = (fa.a ?? 1) * (1 - tr); pose = fa.pose; face = fa.face ?? 1;
    } else {
      x = xb; a = (fb!.a ?? 1) * tr; pose = fb!.pose; face = fb!.face ?? 1;
    }
    figs.push({ who, x, pose, face, a, walk: x * 0.085 });
  }
  const visions: Frame['visions'] = [];
  const va = A.vision ?? 'none', vb = B.vision ?? 'none';
  if (va === vb) { if (va !== 'none') visions.push({ v: va, a: 1 }); }
  else {
    if (va !== 'none') visions.push({ v: va, a: 1 - tr });
    if (vb !== 'none') visions.push({ v: vb, a: tr });
  }
  const zoom = lerp(zA, zB, tr);
  return {
    cam: lerp(camA, camB, tr), zoom,
    cy: lerp(A.cy ?? cyDef(zA), B.cy ?? cyDef(zB), tr),
    pal: mixPal(PAL[A.sky], PAL[B.sky], tr),
    rain: num('rain'), stars: num('stars'), lamps: num('lamps'), windows: num('windows'), fluff: num('fluff'), moon: num('moon'),
    carts: num('carts'), barge: num('barge'), paint: num('paint'), bell: num('bell'), notes: num('notes'),
    figs, visions, hold, beat: i + (f > 0.75 ? 1 : 0),
  };
}

export class Painter {
  readonly cv: HTMLCanvasElement;
  private g: CanvasRenderingContext2D;
  private sky = document.createElement('canvas');
  private mid = document.createElement('canvas');
  private sg: CanvasRenderingContext2D;
  private mg: CanvasRenderingContext2D;
  private world: World = buildWorld();
  private stain: CanvasPattern;
  private glowSprite: HTMLCanvasElement;
  private cloud: HTMLCanvasElement;
  private stars: { x: number; y: number; r: number; p: number }[] = [];
  private fluffP: { x: number; y: number; s: number; p: number }[] = [];
  private rainP: { x: number; y: number; l: number }[] = [];
  private ringsP: { x: number; y: number; t: number }[] = [];
  readonly visions: Visions;
  W = 1; H = 1; dpr = 1;
  /** Screen x of the focus, as a fraction of width: the text sits on the left on wide screens. */
  focusX = 0.62;
  focusY = 0.5;


  constructor(cv: HTMLCanvasElement) {
    this.cv = cv;
    this.g = cv.getContext('2d')!;
    this.sg = this.sky.getContext('2d')!;
    this.mg = this.mid.getContext('2d')!;
    this.stain = this.makeStain();
    this.glowSprite = this.makeGlow();
    this.cloud = this.makeCloud();
    const r = rng(7);
    for (let i = 0; i < 260; i++) this.stars.push({ x: r(), y: r() * r(), r: 0.4 + r() * r() * 1.6, p: r() * 6.28 });
    for (let i = 0; i < 70; i++) this.fluffP.push({ x: r(), y: r(), s: 0.6 + r() * 1.4, p: r() * 6.28 });
    for (let i = 0; i < 360; i++) this.rainP.push({ x: r(), y: r(), l: 0.6 + r() * 0.8 });
    this.visions = new Visions();
  }

  resize(w: number, h: number, dpr: number) {
    this.W = w; this.H = h; this.dpr = dpr;
    for (const c of [this.cv, this.sky, this.mid]) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
    const portrait = w / h < 0.9;
    this.focusX = portrait ? 0.5 : w > 1100 ? 0.64 : 0.6;
    this.focusY = portrait ? 0.36 : 0.5;
    this.visions.resize(w, h);
  }

  /* ---------- small assets ---------- */

  private makeStain() {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const g = c.getContext('2d')!;
    const r = rng(3);
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, 256, 256);
    // damp blooms and streaks, the way stucco weathers
    for (let i = 0; i < 70; i++) {
      const x = r() * 256, y = r() * 256, rad = 8 + r() * 40;
      const gr = g.createRadialGradient(x, y, 0, x, y, rad);
      const a = 0.05 + r() * 0.1;
      gr.addColorStop(0, `rgba(120,105,95,${a})`); gr.addColorStop(1, 'rgba(120,105,95,0)');
      g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
    for (let i = 0; i < 60; i++) {
      g.fillStyle = `rgba(110,100,95,${0.03 + r() * 0.05})`;
      g.fillRect(r() * 256, r() * 256, 1 + r() * 2, 20 + r() * 80);
    }
    for (let i = 0; i < 2500; i++) { g.fillStyle = `rgba(90,80,70,${r() * 0.06})`; g.fillRect(r() * 256, r() * 256, 1, 1); }
    return this.g.createPattern(c, 'repeat')!;
  }

  private makeGlow() {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d')!;
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(255,214,150,1)'); gr.addColorStop(0.15, 'rgba(255,196,120,0.6)'); gr.addColorStop(0.5, 'rgba(255,170,90,0.14)'); gr.addColorStop(1, 'rgba(255,160,80,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    return c;
  }

  private cloudTint = '';
  private cloudTinted = document.createElement('canvas');
  /** The cloud strip recoloured for the hour (cached until the colour changes noticeably). */
  private tintedCloud(c: RGB) {
    const key = c.map((v) => Math.round(v / 6)).join(',');
    if (key !== this.cloudTint) {
      this.cloudTint = key;
      const o = this.cloudTinted;
      o.width = this.cloud.width; o.height = this.cloud.height;
      const g = o.getContext('2d')!;
      g.drawImage(this.cloud, 0, 0);
      g.globalCompositeOperation = 'source-in';
      g.fillStyle = css(c); g.fillRect(0, 0, o.width, o.height);
    }
    return this.cloudTinted;
  }

  private makeCloud() {
    // long soft streaks of cloud, painted with many translucent ellipses
    const c = document.createElement('canvas'); c.width = 1600; c.height = 260;
    const g = c.getContext('2d')!;
    const r = rng(11);
    for (let i = 0; i < 70; i++) {
      const x = r() * 1600, y = 40 + r() * 170, w = 120 + r() * 380, h = 10 + r() * 34;
      const gr = g.createRadialGradient(x, y, 0, x, y, w / 2);
      gr.addColorStop(0, `rgba(255,255,255,${0.18 + r() * 0.2})`); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.save(); g.translate(x, y); g.scale(1, h / w); g.translate(-x, -y);
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, w / 2, 0, Math.PI * 2); g.fill();
      g.restore();
    }
    return c;
  }

  /* ---------- transforms ---------- */

  /** World to screen (CSS px) for the near layer. */
  private setWorld(g: CanvasRenderingContext2D, f: Frame, parallax = 1) {
    const s = (this.H / 1000) * f.zoom;
    const ox = this.W * this.focusX - f.cam * s * parallax;
    const oy = this.H * this.focusY - f.cy * s;
    g.setTransform(s * this.dpr, 0, 0, s * this.dpr, ox * this.dpr, oy * this.dpr);
    return { s, ox, oy };
  }

  private visibleX(f: Frame) {
    const s = (this.H / 1000) * f.zoom;
    const left = f.cam - (this.W * this.focusX) / s;
    const right = f.cam + (this.W * (1 - this.focusX)) / s;
    return [left - 60, right + 60] as const;
  }

  /* ---------- frame ---------- */

  draw(f: Frame, t: number) {
    const { g, sg, mg } = this;
    if (this.W / this.H < 0.9) {
      // a phone shows a narrow slice: keep the people in it
      let sx = 0, sw = 0;
      // Nastenka is who the eye looks for, so she counts for more
      for (const fg of f.figs) { const k = fg.a * (fg.who === 'nastenka' ? 3 : 1); sx += fg.x * k; sw += k; }
      f = { ...f, zoom: f.zoom * 0.82 };
      if (sw > 0.2) f.cam = f.cam + (sx / sw - f.cam) * 0.85;
    }
    const dpr = this.dpr;
    const P = f.pal;
    // ---- sky
    sg.setTransform(1, 0, 0, 1, 0, 0);
    const T = this.setWorld(sg, f);
    const horY = T.oy + 560 * T.s; // screen y of the horizon
    sg.setTransform(dpr, 0, 0, dpr, 0, 0);
    const grad = sg.createLinearGradient(0, Math.min(0, horY - this.H), 0, horY);
    grad.addColorStop(0, css(P.top)); grad.addColorStop(0.55, css(P.mid)); grad.addColorStop(1, css(P.hor));
    sg.fillStyle = grad; sg.fillRect(0, 0, this.W, this.H);
    // the northern glow: in a white night the sun is only just below the horizon
    const gx = this.W * 0.5 + Math.sin(f.cam * 0.0003) * this.W * 0.2;
    const glow = sg.createRadialGradient(gx, horY, 0, gx, horY, this.W * 0.75);
    glow.addColorStop(0, css(P.glow, P.glowA)); glow.addColorStop(0.45, css(P.glow, P.glowA * 0.35)); glow.addColorStop(1, css(P.glow, 0));
    sg.fillStyle = glow; sg.fillRect(0, 0, this.W, this.H);
    if (f.stars > 0.01) {
      for (const st of this.stars) {
        const tw = 0.6 + 0.4 * Math.sin(t * 1.7 + st.p * 3);
        const y = st.y * Math.max(10, horY - 60);
        sg.fillStyle = `rgba(255,250,240,${f.stars * tw * (1 - st.y * 0.7) * 0.9})`;
        sg.beginPath(); sg.arc(((st.x * 1.3 - f.cam * 0.00002) % 1 + 1) % 1 * this.W, y, st.r, 0, Math.PI * 2); sg.fill();
      }
    }
    if (f.moon > 0.01) this.drawMoon(sg, f, horY, t);
    // clouds, drifting slowly
    sg.save();
    sg.globalAlpha = 0.6 + f.rain * 0.35;
    const cloud = this.tintedCloud(P.cloud);
    const cw = cloud.width, ch = cloud.height;
    const off = ((t * 6 + f.cam * 0.06) % cw + cw) % cw;
    const scale = this.H / 900;
    const cy = horY - ch * 1.3 * scale;
    for (let k = -1; k < 3; k++) sg.drawImage(cloud, k * cw * scale - off * scale, cy, cw * scale, ch * scale);
    sg.restore();
    // far city
    this.drawFar(sg, f, t);
    // ---- mid layer
    mg.setTransform(1, 0, 0, 1, 0, 0);
    mg.clearRect(0, 0, this.mid.width, this.mid.height);
    this.setWorld(mg, f);
    const [x0, x1] = this.visibleX(f);
    this.drawCountry(mg, f, x0, x1, t);
    this.drawBarrier(mg, x0, x1);
    this.drawGaps(mg, f, x0, x1);
    for (const b of this.world.buildings) if (b.x + b.w > x0 && b.x < x1) this.drawBuilding(mg, b, f);
    this.drawGround(mg, x0, x1);
    this.drawBench(mg);
    if (f.carts > 0.01) this.drawCarts(mg, f, t, x0, x1);
    // grade the city to the light of the hour
    mg.save();
    mg.setTransform(1, 0, 0, 1, 0, 0);
    mg.globalCompositeOperation = 'source-atop';
    mg.fillStyle = css(P.grade, P.gradeA);
    mg.fillRect(0, 0, this.mid.width, this.mid.height);
    mg.restore();
    this.setWorld(mg, f);
    this.drawLights(mg, f, x0, x1, t);
    for (const fg of f.figs) {
      if (fg.x < x0 - 80 || fg.x > x1 + 80) continue;
      drawFigure(mg, fg.who, fg.pose, fg.x, groundY(fg.x), fg.face, fg.walk, t + fg.x * 0.01, fg.a);
    }
    this.drawRailing(mg, f, x0, x1);
    // ---- compose above the water (the sky canvas becomes the whole upper picture)
    sg.setTransform(1, 0, 0, 1, 0, 0);
    sg.drawImage(this.mid, 0, 0);
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.drawImage(this.sky, 0, 0);
    this.drawWater(f, t);
    this.drawBarge(f, t);
    this.drawWeather(f, t);
    this.visions.draw(g, f, t, dpr, (wx, wy) => this.toScreen(f, wx, wy));
  }

  toScreen(f: Frame, wx: number, wy: number): [number, number] {
    const s = (this.H / 1000) * f.zoom;
    return [this.W * this.focusX + (wx - f.cam) * s, this.H * this.focusY + (wy - f.cy) * s];
  }

  /* ---------- the sky's furniture ---------- */

  private drawMoon(g: CanvasRenderingContext2D, f: Frame, horY: number, t: number) {
    const mx = this.W * 0.78, my = Math.max(60, horY * 0.32);
    const r = Math.min(this.W, this.H) * 0.035;
    g.save();
    g.globalAlpha = f.moon;
    const halo = g.createRadialGradient(mx, my, r, mx, my, r * 6);
    halo.addColorStop(0, 'rgba(255,245,215,0.35)'); halo.addColorStop(1, 'rgba(255,245,215,0)');
    g.fillStyle = halo; g.fillRect(mx - r * 6, my - r * 6, r * 12, r * 12);
    g.fillStyle = '#fff7e2';
    g.beginPath(); g.arc(mx, my, r, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(200,190,170,0.35)';
    g.beginPath(); g.arc(mx - r * 0.3, my - r * 0.2, r * 0.25, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(mx + r * 0.35, my + r * 0.3, r * 0.18, 0, Math.PI * 2); g.fill();
    // "that yellow cloud is covering it now, look, look! No, it has passed by."
    const cxp = mx + ((t * 9) % (r * 14)) - r * 7;
    const cl = g.createRadialGradient(cxp, my + r * 0.2, 0, cxp, my + r * 0.2, r * 3);
    cl.addColorStop(0, 'rgba(236,206,120,0.75)'); cl.addColorStop(1, 'rgba(236,206,120,0)');
    g.save(); g.translate(cxp, my); g.scale(1, 0.35); g.translate(-cxp, -my);
    g.fillStyle = cl; g.beginPath(); g.arc(cxp, my + r * 0.2, r * 3, 0, Math.PI * 2); g.fill();
    g.restore();
    g.restore();
  }

  private drawFar(g: CanvasRenderingContext2D, f: Frame, t: number) {
    const P = f.pal;
    const s = (this.H / 1000) * Math.sqrt(f.zoom);
    const px = 0.4;
    const baseY = this.H * this.focusY + (560 - f.cy) * (this.H / 1000) * f.zoom;
    const haze = mixc(P.hor, P.mid, 0.5);
    const far = mixc(haze, hex('#3a3550'), 0.28);
    g.save();
    g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    const toX = (at: number) => this.W * this.focusX + (at - f.cam) * px * s;
    for (const o of this.world.far) {
      const x = toX(o.at);
      if (x < -o.w * s * 2 || x > this.W + o.w * s * 2) continue;
      this.drawFarItem(g, o, x, baseY, s, o.kind === 'hills' ? mixc(haze, hex('#5d7562'), 0.35) : far, t);
    }
    g.restore();
  }

  private drawFarItem(g: CanvasRenderingContext2D, o: Far, x: number, y: number, s: number, col: RGB, t: number) {
    g.fillStyle = css(col);
    const w = o.w * s, h = o.h * s;
    switch (o.kind) {
      case 'hills': {
        g.beginPath(); g.moveTo(x - w, y + 4);
        for (let k = 0; k <= 16; k++) { const u = k / 16; g.lineTo(x - w + u * w * 2, y - h * Math.sin(u * Math.PI) * (0.8 + 0.2 * Math.sin(u * 9 + o.seed))); }
        g.lineTo(x + w, y + 4); g.fill();
        break;
      }
      case 'roofs': {
        const r = rng(o.seed);
        let xx = x - w / 2;
        while (xx < x + w / 2) {
          const bw = (40 + r() * 70) * s, bh = h * (0.6 + r() * 0.5);
          g.fillRect(xx, y - bh, bw + 1, bh + 4);
          if (r() < 0.3) g.fillRect(xx + bw * 0.3, y - bh - 8 * s, 4 * s, 8 * s);
          xx += bw;
        }
        break;
      }
      case 'dome': {
        // a great gilded dome on a colonnaded drum, with four belfries
        g.fillRect(x - w * 0.6, y - h * 0.32, w * 1.2, h * 0.32 + 4);
        g.fillRect(x - w * 0.34, y - h * 0.52, w * 0.68, h * 0.22);
        for (let k = -1; k <= 1; k += 2) { g.fillRect(x + k * w * 0.48 - w * 0.06, y - h * 0.5, w * 0.12, h * 0.2); g.beginPath(); g.arc(x + k * w * 0.48, y - h * 0.5, w * 0.06, Math.PI, 0); g.fill(); }
        const gold = g.createLinearGradient(x - w * 0.3, 0, x + w * 0.3, 0);
        gold.addColorStop(0, 'rgba(170,130,60,0.95)'); gold.addColorStop(0.4, 'rgba(250,215,130,0.95)'); gold.addColorStop(1, 'rgba(150,110,50,0.95)');
        g.fillStyle = gold;
        g.beginPath(); g.ellipse(x, y - h * 0.52, w * 0.3, h * 0.3, 0, Math.PI, 0); g.fill();
        g.fillRect(x - w * 0.05, y - h * 0.9, w * 0.1, h * 0.1);
        g.beginPath(); g.ellipse(x, y - h * 0.9, w * 0.05, h * 0.05, 0, Math.PI, 0); g.fill();
        g.fillRect(x - 1, y - h, 2, h * 0.1);
        break;
      }
      case 'spireTall': {
        g.fillRect(x - w * 0.6, y - h * 0.22, w * 1.2, h * 0.22 + 4);
        g.fillRect(x - w * 0.4, y - h * 0.34, w * 0.8, h * 0.12);
        const gold = g.createLinearGradient(x - w * 0.2, 0, x + w * 0.2, 0);
        gold.addColorStop(0, 'rgba(170,130,60,0.95)'); gold.addColorStop(0.5, 'rgba(255,225,140,1)'); gold.addColorStop(1, 'rgba(150,110,50,0.95)');
        g.fillStyle = gold;
        g.beginPath(); g.moveTo(x - w * 0.22, y - h * 0.34); g.lineTo(x, y - h); g.lineTo(x + w * 0.22, y - h * 0.34); g.fill();
        // a glint that travels up the needle
        g.fillStyle = `rgba(255,250,220,${0.4 + 0.3 * Math.sin(t * 0.8 + o.seed)})`;
        g.fillRect(x - 0.8, y - h * (0.5 + 0.3 * Math.sin(t * 0.3 + o.seed)), 1.6, h * 0.08);
        break;
      }
      case 'cupola': {
        g.fillRect(x - w * 0.5, y - h * 0.45, w, h * 0.45 + 4);
        g.beginPath(); g.ellipse(x, y - h * 0.45, w * 0.38, h * 0.3, 0, Math.PI, 0); g.fill();
        g.fillRect(x - 1.2, y - h, 2.4, h * 0.26);
        g.fillRect(x - w * 0.12, y - h * 0.9, w * 0.24, 2);
        break;
      }
      case 'tower': {
        g.fillRect(x - w * 0.5, y - h * 0.6, w, h * 0.6 + 4);
        g.fillRect(x - w * 0.36, y - h * 0.8, w * 0.72, h * 0.2);
        g.beginPath(); g.moveTo(x - w * 0.36, y - h * 0.8); g.lineTo(x, y - h); g.lineTo(x + w * 0.36, y - h * 0.8); g.fill();
        // the clock face
        g.fillStyle = 'rgba(255,240,210,0.6)';
        g.beginPath(); g.arc(x, y - h * 0.7, w * 0.18, 0, Math.PI * 2); g.fill();
        break;
      }
    }
  }

  /* ---------- the countryside ---------- */

  private drawCountry(g: CanvasRenderingContext2D, f: Frame, x0: number, x1: number, t: number) {
    if (x0 > COUNTRY_END + 400) return;
    const R = Math.min(x1, COUNTRY_END + 380);
    // meadow, rising and falling gently, with the road along the river
    const meadow = g.createLinearGradient(0, 540, 0, PAVE);
    meadow.addColorStop(0, '#9fbf78'); meadow.addColorStop(1, '#7ea35c');
    g.fillStyle = meadow;
    g.beginPath(); g.moveTo(x0, PAVE);
    for (let x = x0; x <= R; x += 40) g.lineTo(x, 566 + Math.sin(x * 0.004) * 14 + Math.sin(x * 0.011) * 6);
    g.lineTo(R, PAVE); g.fill();
    // a field of rye in stripes behind
    g.fillStyle = 'rgba(214,200,120,0.5)';
    for (let x = Math.max(x0, 0); x < Math.min(R, COUNTRY_END - 200); x += 260) {
      g.beginPath(); g.moveTo(x, 572); g.lineTo(x + 200, 568); g.lineTo(x + 230, 580); g.lineTo(x + 10, 583); g.fill();
    }
    // the road
    g.fillStyle = '#c9b38c';
    g.fillRect(x0, PAVE - 12, R - x0, 14);
    // dacha
    const d = this.world.dacha.x;
    if (d + 200 > x0 && d - 200 < x1) this.drawDacha(g, d);
    for (const tr of this.world.trees) if (tr.x > x0 - 100 && tr.x < x1 + 100) this.drawTree(g, tr, t, f);
    // flowers in the grass
    const r = rng(5);
    for (let i = 0; i < 400; i++) {
      const x = r() * COUNTRY_END, y = 585 + r() * 25;
      if (x < x0 || x > R) continue;
      g.fillStyle = ['#ffffff', '#f6e27a', '#e9a0c0', '#b8a8ec'][Math.floor(r() * 4)];
      g.beginPath(); g.arc(x, y, 1.4 + r() * 1.4, 0, Math.PI * 2); g.fill();
    }
    // grassy bank into the river
    const bank = g.createLinearGradient(0, PAVE, 0, WATER);
    bank.addColorStop(0, '#6f8f4e'); bank.addColorStop(1, '#4f6a3c');
    g.fillStyle = bank;
    g.beginPath(); g.moveTo(x0, PAVE);
    for (let x = x0; x <= R; x += 30) g.lineTo(x, WATER + 1 + Math.sin(x * 0.05) * 1.5);
    g.lineTo(R, PAVE); g.fill();
    // reeds
    g.strokeStyle = '#4d6a39'; g.lineWidth = 1.2;
    for (let i = 0; i < 160; i++) {
      const x = r() * COUNTRY_END; if (x < x0 || x > R) continue;
      const h = 14 + r() * 22, sw = Math.sin(t * 1.4 + x) * 2;
      g.beginPath(); g.moveTo(x, WATER); g.quadraticCurveTo(x + sw * 0.5, WATER - h * 0.6, x + sw, WATER - h); g.stroke();
    }
  }

  private drawDacha(g: CanvasRenderingContext2D, x: number) {
    // a wooden summer house, painted pale blue, with a carved balcony
    g.fillStyle = '#9fb7cf';
    g.fillRect(x - 110, 470, 220, 132);
    g.fillStyle = '#7c95ae';
    for (let y = 476; y < 600; y += 9) g.fillRect(x - 110, y, 220, 1.4);
    g.fillStyle = '#6d5a4d';
    g.beginPath(); g.moveTo(x - 130, 472); g.lineTo(x, 400); g.lineTo(x + 130, 472); g.fill();
    g.fillStyle = '#f2ece0';
    g.beginPath(); g.moveTo(x - 40, 462); g.lineTo(x, 432); g.lineTo(x + 40, 462); g.closePath(); g.fill();
    g.fillStyle = '#3f4a5c'; g.fillRect(x - 10, 440, 20, 20);
    for (const wx of [-80, -30, 30, 80]) {
      g.fillStyle = '#f2ece0'; g.fillRect(wx + x - 15, 500, 30, 44);
      g.fillStyle = '#3f4a5c'; g.fillRect(wx + x - 11, 504, 22, 36);
      g.fillStyle = '#f2ece0'; g.fillRect(wx + x - 1, 504, 2, 36); g.fillRect(wx + x - 11, 520, 22, 2);
      // carved frill over each window
      g.beginPath(); g.moveTo(wx + x - 18, 500); g.quadraticCurveTo(wx + x, 486, wx + x + 18, 500); g.fill();
    }
    // the balcony and fence
    g.fillStyle = '#f2ece0';
    g.fillRect(x - 70, 466, 140, 4);
    for (let k = 0; k < 15; k++) g.fillRect(x - 68 + k * 10, 452, 2, 14);
    g.fillRect(x - 70, 450, 140, 3);
    for (let k = -200; k < 200; k += 9) { if (Math.abs(k) < 115) continue; g.fillRect(x + k, 580, 3, 22); }
    g.fillRect(x - 200, 586, 85, 2); g.fillRect(x + 115, 586, 85, 2);
  }

  private drawTree(g: CanvasRenderingContext2D, tr: { x: number; h: number; kind: string; seed: number }, t: number, f: Frame) {
    const r = rng(tr.seed);
    const base = 590 + r() * 14;
    const sway = Math.sin(t * 0.9 + tr.seed) * 2;
    if (tr.kind === 'birch') {
      // white trunk with black marks, a light veil of new leaves
      g.fillStyle = '#efece4';
      g.beginPath(); g.moveTo(tr.x - 4, base); g.lineTo(tr.x - 1.5 + sway, base - tr.h); g.lineTo(tr.x + 1.5 + sway, base - tr.h); g.lineTo(tr.x + 4, base); g.fill();
      g.fillStyle = '#3a3633';
      for (let k = 0; k < 8; k++) { const y = base - r() * tr.h * 0.8; g.fillRect(tr.x - 3, y, 3 + r() * 3, 1.6); }
      for (let k = 0; k < 26; k++) {
        const a = r() * Math.PI * 2, d = r() * tr.h * 0.28;
        const x = tr.x + sway + Math.cos(a) * d * 0.9, y = base - tr.h * 0.7 + Math.sin(a) * d * 0.9;
        g.fillStyle = `rgba(${130 + r() * 50},${170 + r() * 40},${90 + r() * 30},0.45)`;
        g.beginPath(); g.ellipse(x, y, 10 + r() * 14, 7 + r() * 9, r(), 0, Math.PI * 2); g.fill();
      }
    } else {
      g.fillStyle = '#5a4a3e';
      g.beginPath(); g.moveTo(tr.x - 5, base); g.lineTo(tr.x - 2 + sway * 0.5, base - tr.h * 0.5); g.lineTo(tr.x + 2 + sway * 0.5, base - tr.h * 0.5); g.lineTo(tr.x + 5, base); g.fill();
      const blossom = tr.kind === 'blossom';
      for (let k = 0; k < 30; k++) {
        const a = r() * Math.PI * 2, d = r() * tr.h * 0.3;
        const x = tr.x + sway + Math.cos(a) * d, y = base - tr.h * 0.62 + Math.sin(a) * d * 0.7;
        g.fillStyle = blossom ? `rgba(255,${235 + r() * 20},${240 + r() * 15},0.55)` : `rgba(${90 + r() * 40},${140 + r() * 40},${70 + r() * 30},0.5)`;
        g.beginPath(); g.ellipse(x, y, 12 + r() * 14, 9 + r() * 10, r(), 0, Math.PI * 2); g.fill();
      }
    }
    void f;
  }

  private drawBarrier(g: CanvasRenderingContext2D, x0: number, x1: number) {
    const x = this.world.barrier.x;
    if (x + 260 < x0 || x - 260 > x1) return;
    // two stone pylons with columns, an entablature, and the striped barrier pole
    g.fillStyle = '#e8d8b0';
    for (const k of [-1, 1]) {
      g.fillRect(x + k * 120 - 40, 430, 80, 172);
      g.fillStyle = '#f6efe0';
      for (const c of [-26, -8, 8, 26]) g.fillRect(x + k * 120 + c - 4, 440, 8, 150);
      g.fillRect(x + k * 120 - 46, 424, 92, 10);
      g.fillRect(x + k * 120 - 44, 594, 88, 8);
      g.beginPath(); g.moveTo(x + k * 120 - 46, 424); g.lineTo(x + k * 120, 396); g.lineTo(x + k * 120 + 46, 424); g.fill();
      g.fillStyle = '#e8d8b0';
    }
    // the striped sentry box
    const sx = x + 200;
    for (let k = 0; k < 8; k++) { g.fillStyle = k % 2 ? '#1f1b27' : '#f2eee6'; g.fillRect(sx - 14, 530 + k * 9, 28, 9); }
    g.fillStyle = '#c96b2c'; g.beginPath(); g.moveTo(sx - 18, 530); g.lineTo(sx, 512); g.lineTo(sx + 18, 530); g.fill();
    // the pole, raised: the dreamer passes straight through
    g.save(); g.translate(x - 70, 560); g.rotate(-1.1);
    for (let k = 0; k < 10; k++) { g.fillStyle = k % 2 ? '#1f1b27' : '#f2eee6'; g.fillRect(k * 14, -3, 14, 6); }
    g.restore();
  }

  /* ---------- the city ---------- */

  private drawBuilding(g: CanvasRenderingContext2D, b: Building, f: Frame) {
    const r = rng(b.seed);
    const FH = b.style === 'portico' && b.friend ? 66 : 58;
    const ground = 66;
    const top = FACADE_BASE - ground - (b.floors - 1) * FH;
    let color = b.color;
    if (b.friend) {
      // light pink, being painted canary yellow from the left
      color = '#efc1c3';
    }
    g.fillStyle = color;
    g.fillRect(b.x, top, b.w, FACADE_BASE - top);
    if (b.friend && f.paint > 0) {
      g.fillStyle = '#efd25a';
      g.fillRect(b.x, top, b.w * f.paint, FACADE_BASE - top);
    }
    // weathering
    g.save();
    g.globalCompositeOperation = 'multiply';
    g.fillStyle = this.stain;
    g.globalAlpha = 0.8;
    g.fillRect(b.x, top, b.w, FACADE_BASE - top);
    g.restore();
    // the roof: a low metal slope and chimneys
    g.fillStyle = b.roof;
    g.beginPath(); g.moveTo(b.x - 2, top); g.lineTo(b.x + 8, top - 16); g.lineTo(b.x + b.w - 8, top - 16); g.lineTo(b.x + b.w + 2, top); g.fill();
    for (let k = 0; k < 2; k++) { const cx = b.x + 20 + r() * (b.w - 40); g.fillRect(cx, top - 30, 9, 16); }
    // cornice, string courses
    g.fillStyle = b.trim;
    g.fillRect(b.x - 3, top - 2, b.w + 6, 7);
    g.fillStyle = 'rgba(40,30,30,0.18)'; g.fillRect(b.x - 3, top + 5, b.w + 6, 4);
    g.fillStyle = b.trim;
    g.fillRect(b.x, FACADE_BASE - ground - 3, b.w, 5);
    // ground-floor rustication
    if (b.style === 'rusticated' || b.style === 'portico') {
      g.fillStyle = 'rgba(60,40,30,0.13)';
      for (let y = FACADE_BASE - ground + 8; y < FACADE_BASE; y += 9) g.fillRect(b.x, y, b.w, 1.3);
    }
    if (b.attic) {
      g.fillStyle = color;
      g.fillRect(b.x + b.w * 0.3, top - 24, b.w * 0.4, 24);
      g.fillStyle = b.trim;
      g.beginPath(); g.moveTo(b.x + b.w * 0.27, top - 22); g.lineTo(b.x + b.w * 0.5, top - 44); g.lineTo(b.x + b.w * 0.73, top - 22); g.closePath(); g.fill();
      g.fillStyle = color;
      g.beginPath(); g.moveTo(b.x + b.w * 0.33, top - 24); g.lineTo(b.x + b.w * 0.5, top - 38); g.lineTo(b.x + b.w * 0.67, top - 24); g.closePath(); g.fill();
    }
    // windows, bay by bay
    const bw = b.w / b.bays;
    const win = mixc(hex('#39405a'), f.pal.top, 0.25);
    for (let fl = 0; fl < b.floors; fl++) {
      const isGround = fl === 0;
      const y0 = isGround ? FACADE_BASE - ground + 12 : FACADE_BASE - ground - fl * FH + 12;
      const wh = isGround ? 40 : fl === 1 ? 38 : 32;
      const ww = Math.min(24, bw * 0.48);
      for (let k = 0; k < b.bays; k++) {
        const cx = b.x + bw * (k + 0.5);
        if (isGround && b.style !== 'small' && k === Math.floor(b.bays / 2)) {
          // the door, under an arch
          g.fillStyle = b.trim; g.fillRect(cx - 17, y0 - 6, 34, FACADE_BASE - y0 + 6);
          g.fillStyle = '#4a3a33'; g.fillRect(cx - 13, y0, 26, FACADE_BASE - y0);
          g.beginPath(); g.arc(cx, y0, 13, Math.PI, 0); g.fill();
          continue;
        }
        g.fillStyle = b.trim;
        g.fillRect(cx - ww / 2 - 3, y0 - 3, ww + 6, wh + 6);
        if (fl === 1 && !isGround) {
          // pediments over the piano nobile
          g.beginPath(); g.moveTo(cx - ww / 2 - 5, y0 - 4); g.lineTo(cx, y0 - 13); g.lineTo(cx + ww / 2 + 5, y0 - 4); g.fill();
        }
        const glass = g.createLinearGradient(0, y0, 0, y0 + wh);
        glass.addColorStop(0, css(mixc(win, f.pal.hor, 0.35))); glass.addColorStop(1, css(win));
        g.fillStyle = glass;
        if (isGround) { g.fillRect(cx - ww / 2, y0 + 4, ww, wh - 4); g.beginPath(); g.arc(cx, y0 + 4, ww / 2, Math.PI, 0); g.fill(); }
        else g.fillRect(cx - ww / 2, y0, ww, wh);
        g.fillStyle = b.trim;
        g.fillRect(cx - 0.8, y0, 1.6, wh);
        g.fillRect(cx - ww / 2, y0 + wh * 0.38, ww, 1.6);
        if (b.balcony && fl === 1 && Math.abs(k - (b.bays - 1) / 2) < 1.6) {
          g.fillStyle = '#2a2730';
          g.fillRect(cx - ww / 2 - 6, y0 + wh + 2, ww + 12, 3);
          for (let q = 0; q < 6; q++) g.fillRect(cx - ww / 2 - 5 + q * ((ww + 10) / 5), y0 + wh - 10, 1.2, 12);
          g.fillRect(cx - ww / 2 - 6, y0 + wh - 11, ww + 12, 1.6);
        }
      }
    }
    if (b.style === 'pilasters' || b.style === 'portico') {
      g.fillStyle = b.trim;
      const yTop = top + 6, yBot = FACADE_BASE - ground - 3;
      if (b.style === 'portico') {
        // four columns and a pediment across the middle
        const pw = Math.min(b.w * 0.6, 200), px = b.x + (b.w - pw) / 2;
        for (let k = 0; k < 4; k++) {
          const cx = px + (pw * k) / 3;
          const cg = g.createLinearGradient(cx - 6, 0, cx + 6, 0);
          cg.addColorStop(0, 'rgba(220,210,195,1)'); cg.addColorStop(0.5, b.trim); cg.addColorStop(1, 'rgba(200,190,175,1)');
          g.fillStyle = cg;
          g.fillRect(cx - 5.5, yTop + 18, 11, yBot - yTop - 18);
        }
        g.fillStyle = b.trim;
        g.fillRect(px - 10, yTop + 12, pw + 20, 7);
        g.beginPath(); g.moveTo(px - 12, yTop + 13); g.lineTo(px + pw / 2, yTop - 18); g.lineTo(px + pw + 12, yTop + 13); g.closePath(); g.fill();
        g.fillStyle = b.friend ? (f.paint > 0.5 ? '#efd25a' : color) : color;
        g.beginPath(); g.moveTo(px + 6, yTop + 10); g.lineTo(px + pw / 2, yTop - 10); g.lineTo(px + pw - 6, yTop + 10); g.closePath(); g.fill();
      } else {
        for (let k = 0; k <= b.bays; k++) g.fillRect(b.x + bw * k - 3, yTop, 6, yBot - yTop);
      }
    }
    // a soft shadow where the façade meets the pavement, and down the party wall
    const sh = g.createLinearGradient(0, FACADE_BASE - 40, 0, FACADE_BASE);
    sh.addColorStop(0, 'rgba(30,20,30,0)'); sh.addColorStop(1, 'rgba(30,20,30,0.22)');
    g.fillStyle = sh; g.fillRect(b.x, FACADE_BASE - 40, b.w, 40);
    g.fillStyle = 'rgba(30,20,40,0.12)'; g.fillRect(b.x + b.w - 4, top, 4, FACADE_BASE - top);
    if (b.friend && f.paint > 0.01 && f.paint < 0.995) {
      // the painters' scaffold and a man on it
      const sx = b.x + b.w * f.paint;
      g.fillStyle = '#6a5440';
      g.fillRect(sx - 30, top + 10, 3, FACADE_BASE - top - 10); g.fillRect(sx + 26, top + 10, 3, FACADE_BASE - top - 10);
      for (let y = top + 40; y < FACADE_BASE; y += 50) g.fillRect(sx - 32, y, 64, 3);
    }
  }

  private drawGaps(g: CanvasRenderingContext2D, f: Frame, x0: number, x1: number) {
    for (const gp of this.world.gaps) {
      if (gp.x + gp.w < x0 || gp.x > x1) continue;
      if (gp.kind === 'bridge') {
        // a side canal recedes between the houses
        const m = gp.x + gp.w / 2;
        const haze = mixc(f.pal.hor, f.pal.mid, 0.4);
        g.fillStyle = css(mixc(haze, hex('#7c7086'), 0.35));
        g.fillRect(gp.x, 470, gp.w * 0.32, 130); g.fillRect(gp.x + gp.w * 0.68, 480, gp.w * 0.32, 120);
        g.fillStyle = css(mixc(haze, hex('#7c7086'), 0.2));
        g.fillRect(gp.x + gp.w * 0.32, 520, gp.w * 0.12, 80); g.fillRect(gp.x + gp.w * 0.56, 525, gp.w * 0.12, 75);
        g.fillStyle = css(mixc(f.pal.water, f.pal.hor, 0.3));
        g.beginPath(); g.moveTo(gp.x, 600); g.lineTo(m - 12, 560); g.lineTo(m + 12, 560); g.lineTo(gp.x + gp.w, 600); g.fill();
        // the bridge: a granite arch under a humped deck
        g.fillStyle = '#8f8a8a';
        g.beginPath();
        g.moveTo(gp.x - 40, PAVE + 4);
        for (let x = gp.x - 40; x <= gp.x + gp.w + 40; x += 10) g.lineTo(x, groundY(x) + 2);
        g.lineTo(gp.x + gp.w + 40, WATER); g.lineTo(gp.x - 40, WATER); g.closePath(); g.fill();
        g.fillStyle = css(mixc(f.pal.water, hex('#1e2233'), 0.55));
        g.beginPath(); g.moveTo(gp.x + 10, WATER); g.ellipse(m, WATER, gp.w / 2 - 10, 46, 0, Math.PI, 0); g.fill();
        g.strokeStyle = 'rgba(240,235,225,0.45)'; g.lineWidth = 2;
        g.beginPath(); g.ellipse(m, WATER, gp.w / 2 - 6, 50, 0, Math.PI, 0); g.stroke();
      } else {
        // Nastenka's side street: a narrow lane going back into the night, one lamp deep in it
        const m = gp.x + gp.w / 2, vy = 540;
        const wallL = css(mixc(f.pal.deep, hex('#6a5a70'), 0.45)), wallR = css(mixc(f.pal.deep, hex('#7d6c7e'), 0.55));
        // the houses either side, receding to a point down the lane
        g.fillStyle = wallL;
        g.beginPath(); g.moveTo(gp.x, 330); g.lineTo(m - 8, 470); g.lineTo(m - 8, 556); g.lineTo(gp.x, FACADE_BASE); g.fill();
        g.fillStyle = wallR;
        g.beginPath(); g.moveTo(gp.x + gp.w, 330); g.lineTo(m + 8, 470); g.lineTo(m + 8, 556); g.lineTo(gp.x + gp.w, FACADE_BASE); g.fill();
        // the strip of pale sky over it
        g.fillStyle = css(mixc(f.pal.hor, f.pal.mid, 0.4));
        g.beginPath(); g.moveTo(gp.x + 2, 330); g.lineTo(m - 8, 470); g.lineTo(m + 8, 470); g.lineTo(gp.x + gp.w - 2, 330); g.fill();
        // cobbles running away
        g.fillStyle = css(mixc(f.pal.deep, hex('#8a8088'), 0.35));
        g.beginPath(); g.moveTo(gp.x, FACADE_BASE); g.lineTo(m - 8, 556); g.lineTo(m + 8, 556); g.lineTo(gp.x + gp.w, FACADE_BASE); g.fill();
        // windows getting smaller towards the end, a few of them lit
        for (let k = 0; k < 5; k++) {
          const u = k / 5, y = lerp(350, 490, u), hh = lerp(26, 6, u), dx = lerp(gp.w / 2 - 10, 12, u);
          for (const sgn of [-1, 1]) {
            g.fillStyle = (k + (sgn > 0 ? 1 : 0)) % 3 === 0 ? `rgba(255,200,120,${0.4 + 0.5 * f.windows})` : 'rgba(30,25,40,0.45)';
            g.fillRect(m + sgn * dx - (sgn > 0 ? 0 : hh * 0.5), y, hh * 0.5, hh);
          }
        }
        g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.5 + 0.5 * f.lamps;
        g.drawImage(this.glowSprite, m - 22, vy - 30, 44, 44);
        g.restore();
        void vy;
      }
    }
  }

  private drawGround(g: CanvasRenderingContext2D, x0: number, x1: number) {
    const L = Math.max(x0, COUNTRY_END - 40), R = x1;
    if (R <= L) return;
    // pavement
    const pv = g.createLinearGradient(0, FACADE_BASE, 0, PAVE + 4);
    pv.addColorStop(0, '#9c958f'); pv.addColorStop(1, '#bdb4aa');
    g.fillStyle = pv;
    g.beginPath(); g.moveTo(L, FACADE_BASE);
    for (let x = L; x <= R; x += 12) g.lineTo(x, Math.min(FACADE_BASE, groundY(x) - 10));
    for (let x = R; x >= L; x -= 12) g.lineTo(x, groundY(x) + 4);
    g.closePath(); g.fill();
    // granite embankment wall, pinkish, in big blocks
    const wall = g.createLinearGradient(0, PAVE, 0, WATER);
    wall.addColorStop(0, '#a7918c'); wall.addColorStop(1, '#6c5c5c');
    g.fillStyle = wall;
    g.beginPath(); g.moveTo(L, PAVE + 4);
    for (let x = L; x <= R; x += 12) g.lineTo(x, Math.max(PAVE + 4, groundY(x) + 4));
    g.lineTo(R, WATER + 2); g.lineTo(L, WATER + 2); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(40,30,35,0.25)'; g.lineWidth = 1;
    const bx0 = Math.floor(L / 70) * 70;
    for (let x = bx0; x < R; x += 70) {
      const gp = this.world.gaps.find((q) => q.kind === 'bridge' && x > q.x - 40 && x < q.x + q.w + 40);
      if (gp) continue;
      g.beginPath(); g.moveTo(x, PAVE + 6); g.lineTo(x, PAVE + 26); g.moveTo(x + 35, PAVE + 26); g.lineTo(x + 35, WATER); g.stroke();
    }
    g.beginPath(); g.moveTo(L, PAVE + 26); g.lineTo(R, PAVE + 26); g.stroke();
    g.fillStyle = '#c8bcb2'; g.fillRect(L, PAVE + 2, R - L, 3);
    // a wet dark line where the water laps
    g.fillStyle = 'rgba(30,30,40,0.35)'; g.fillRect(L, WATER - 6, R - L, 7);
  }

  private drawBench(g: CanvasRenderingContext2D) {
    const x = this.world.seat.x;
    g.fillStyle = '#4a3b33';
    g.fillRect(x - 62, 581, 124, 5);
    g.fillRect(x - 62, 552, 124, 4); g.fillRect(x - 62, 561, 124, 4);
    g.fillStyle = '#26222b';
    for (const k of [-54, 52]) { g.fillRect(x + k, 552, 3.5, 60); g.fillRect(x + k - 5, 608, 13, 4); }
  }

  private drawCarts(g: CanvasRenderingContext2D, f: Frame, t: number, x0: number, x1: number) {
    // waggons heaped with furniture, trundling towards the summer villas
    const span = 2600, base = COUNTRY_END + 200;
    for (let i = 0; i < 6; i++) {
      const x = base + ((((i * 437 + 300) - t * 24) % span) + span) % span;
      if (x < x0 - 200 || x > x1 + 200) continue;
      g.save();
      g.globalAlpha = f.carts;
      g.translate(x, PAVE);
      g.fillStyle = INK;
      // horse
      const step = Math.sin(t * 4 + i) * 3;
      g.beginPath(); g.ellipse(-70, -40, 22, 11, 0, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.moveTo(-88, -46); g.lineTo(-100, -66); g.lineTo(-108, -62); g.lineTo(-96, -40); g.fill();
      g.lineWidth = 3.5; g.strokeStyle = INK; g.lineCap = 'round';
      for (const [lx, ph] of [[-84, 0], [-78, 1], [-60, 2], [-54, 3]] as const) { g.beginPath(); g.moveTo(lx, -34); g.lineTo(lx + Math.sin(t * 4 + ph * 1.6 + i) * 5, 0); g.stroke(); }
      g.lineWidth = 2; g.beginPath(); g.moveTo(-50, -42); g.lineTo(-20, -30); g.stroke();
      // waggon and wheels
      g.fillRect(-25, -34, 90, 10);
      for (const wx of [-10, 50]) { g.lineWidth = 2.4; g.beginPath(); g.arc(wx, -14, 14, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.arc(wx, -14, 2.5, 0, Math.PI * 2); g.fill(); }
      // the mountain of furniture: a sofa, a table upside down, chairs, a clock, and the cook on top
      g.fillRect(-20, -58, 70, 24);
      g.fillRect(-24, -66, 10, 32); g.fillRect(44, -66, 10, 32);
      g.fillRect(-5, -72, 40, 5);
      for (const lx of [-3, 13, 26, 33]) g.fillRect(lx, -92, 2.5, 20);
      g.fillRect(40, -96, 12, 30);
      g.beginPath(); g.arc(46, -100, 6, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.arc(14, -98, 6, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.moveTo(6, -92); g.quadraticCurveTo(14, -78, 24, -92); g.lineTo(26, -74); g.lineTo(4, -74); g.fill();
      // the waggoner walking lazily beside it with the reins
      g.translate(-30 + step * 0.3, 0);
      g.beginPath(); g.ellipse(0, -60, 4.5, 5, 0, 0, Math.PI * 2); g.fill();
      g.fillRect(-5, -55, 10, 30);
      g.lineWidth = 3.5; g.beginPath(); g.moveTo(-2, -26); g.lineTo(-4 + step, 0); g.moveTo(2, -26); g.lineTo(4 - step, 0); g.stroke();
      g.restore();
    }
  }

  private drawLights(g: CanvasRenderingContext2D, f: Frame, x0: number, x1: number, t: number) {
    const win = f.windows * f.pal.win;
    if (win > 0.02) {
      // lamplight in a scattering of windows
      g.save();
      g.globalCompositeOperation = 'lighter';
      for (const b of this.world.buildings) {
        if (b.x + b.w < x0 || b.x > x1) continue;
        const r = rng(b.seed + 9);
        const bw = b.w / b.bays;
        for (let fl = 0; fl < b.floors; fl++) for (let k = 0; k < b.bays; k++) {
          if (r() > 0.28) continue;
          const cx = b.x + bw * (k + 0.5);
          const y0 = fl === 0 ? FACADE_BASE - 66 + 16 : FACADE_BASE - 66 - fl * 58 + 12;
          const wh = fl === 0 ? 36 : fl === 1 ? 38 : 32;
          const ww = Math.min(24, bw * 0.48);
          const flick = 0.85 + 0.15 * Math.sin(t * 2 + k * 3 + fl);
          g.fillStyle = `rgba(255,190,110,${0.55 * win * flick})`;
          g.fillRect(cx - ww / 2, y0, ww, wh);
          g.globalAlpha = 0.5 * win;
          g.drawImage(this.glowSprite, cx - 40, y0 + wh / 2 - 40, 80, 80);
          g.globalAlpha = 1;
        }
      }
      g.restore();
    }
    // street lamps
    for (const l of this.world.lamps) {
      if (l.x < x0 - 60 || l.x > x1 + 60) continue;
      const by = groundY(l.x) - 2;
      g.fillStyle = '#25222c';
      g.fillRect(l.x - 1.6, by - 82, 3.2, 82);
      g.fillRect(l.x - 5, by - 6, 10, 6);
      if (l.ornate) { g.beginPath(); g.arc(l.x, by - 44, 4, 0, Math.PI * 2); g.fill(); }
      g.beginPath(); g.moveTo(l.x - 7, by - 84); g.lineTo(l.x + 7, by - 84); g.lineTo(l.x + 5, by - 100); g.lineTo(l.x - 5, by - 100); g.fill();
      g.beginPath(); g.moveTo(l.x - 8, by - 100); g.lineTo(l.x, by - 108); g.lineTo(l.x + 8, by - 100); g.fill();
      if (f.lamps > 0.01) {
        const flick = 0.9 + 0.1 * Math.sin(t * 7 + l.x);
        g.fillStyle = `rgba(255,220,150,${0.95 * f.lamps})`;
        g.fillRect(l.x - 4, by - 98, 8, 13);
        g.save();
        g.globalCompositeOperation = 'lighter';
        g.globalAlpha = 0.85 * f.lamps * flick;
        g.drawImage(this.glowSprite, l.x - 70, by - 162, 140, 140);
        g.globalAlpha = 0.25 * f.lamps;
        g.drawImage(this.glowSprite, l.x - 160, by - 250, 320, 320);
        g.restore();
      }
    }
  }

  private drawRailing(g: CanvasRenderingContext2D, f: Frame, x0: number, x1: number) {
    const L = Math.max(x0, COUNTRY_END + 20), R = x1;
    if (R <= L) return;
    g.strokeStyle = '#26232d'; g.fillStyle = '#26232d';
    const top = (x: number) => groundY(x) - 52;
    g.lineWidth = 2.6;
    g.beginPath(); g.moveTo(L, top(L));
    for (let x = L; x <= R; x += 10) g.lineTo(x, top(x));
    g.stroke();
    g.lineWidth = 1.4;
    g.beginPath(); g.moveTo(L, top(L) + 42);
    for (let x = L; x <= R; x += 10) g.lineTo(x, top(x) + 42);
    g.stroke();
    // cast-iron panels: a ring in each bay, with bars either side
    const start = Math.floor(L / 34) * 34;
    for (let x = start; x < R; x += 34) {
      const y = top(x);
      g.fillRect(x - 1.8, y - 2, 3.6, 56);
      g.lineWidth = 1.1;
      g.beginPath(); g.arc(x + 17, y + 20, 9, 0, Math.PI * 2); g.stroke();
      g.beginPath(); g.moveTo(x + 5, y + 3); g.lineTo(x + 5, y + 40); g.moveTo(x + 29, y + 3); g.lineTo(x + 29, y + 40); g.stroke();
      if (x % 340 === 0) { g.fillRect(x - 5, y - 6, 10, 60); g.beginPath(); g.arc(x, y - 8, 4, 0, Math.PI * 2); g.fill(); }
    }
    void f;
  }

  /* ---------- water ---------- */

  private drawWater(f: Frame, t: number) {
    const g = this.g, dpr = this.dpr;
    const [, wy] = this.toScreen(f, 0, WATER);
    const top = Math.max(0, Math.floor(wy * dpr));
    const Hp = this.cv.height, Wp = this.cv.width;
    if (top >= Hp) return;
    const P = f.pal;
    // the base colour of the water, deeper towards us
    const wg = g.createLinearGradient(0, top, 0, Hp);
    wg.addColorStop(0, css(P.water)); wg.addColorStop(1, css(P.deep));
    g.fillStyle = wg; g.fillRect(0, top, Wp, Hp - top);
    // the mirror: rows from above the line, rippled
    const step = Math.max(2, Math.round(2 * dpr));
    const amp = (1.6 + f.rain * 2.5) * dpr * Math.sqrt(f.zoom);
    g.save();
    for (let y = top; y < Hp; y += step) {
      const d = (y - top) / Math.max(1, Hp - top);
      const src = top - (y - top) * 1.02 - 1;
      if (src < 0) break;
      const dx = Math.sin(y * 0.09 / dpr + t * 1.7) * amp * (0.4 + d * 1.6) + Math.sin(y * 0.023 / dpr - t * 0.8) * amp * 1.5;
      g.globalAlpha = 0.78 - d * 0.42;
      g.drawImage(this.sky, 0, src, Wp, step, dx, y, Wp, step);
    }
    g.restore();
    // a veil of the water's own colour, more of it with depth
    const veil = g.createLinearGradient(0, top, 0, Hp);
    veil.addColorStop(0, css(P.water, 0.18)); veil.addColorStop(1, css(P.deep, 0.55));
    g.fillStyle = veil; g.fillRect(0, top, Wp, Hp - top);
    // lamp light running down the water in broken streaks
    if (f.lamps > 0.02) {
      g.save();
      g.globalCompositeOperation = 'lighter';
      for (const l of this.world.lamps) {
        const [sx] = this.toScreen(f, l.x, 0);
        if (sx < -40 || sx > this.W + 40) continue;
        for (let y = top; y < Hp; y += step * 2) {
          const d = (y - top) / Math.max(1, Hp - top);
          const w = (3 + d * 10) * dpr * Math.sqrt(f.zoom);
          const wob = Math.sin(y * 0.15 / dpr + t * 2.3 + l.x) * w * 1.4;
          const a = f.lamps * 0.32 * (1 - d) * (0.5 + 0.5 * Math.sin(y * 0.35 / dpr - t * 3 + l.x));
          if (a <= 0.01) continue;
          g.fillStyle = `rgba(255,205,130,${a})`;
          g.fillRect(sx * dpr + wob - w / 2, y, w, step * 1.5);
        }
      }
      g.restore();
    }
    // sky glints on the swell
    g.save();
    g.globalCompositeOperation = 'lighter';
    const r = rng(Math.floor(t * 2));
    for (let i = 0; i < 26; i++) {
      const y = top + Math.pow(r(), 1.6) * (Hp - top);
      const x = r() * Wp;
      g.fillStyle = css(P.hor, 0.1 + r() * 0.12);
      g.fillRect(x, y, (14 + r() * 50) * dpr, 1.2 * dpr);
    }
    g.restore();
  }

  private drawBarge(f: Frame, t: number) {
    if (f.barge < 0.01) return;
    const g = this.g;
    this.setWorld(g, f);
    const span = 2400, base = 2900;
    for (let i = 0; i < 2; i++) {
      const x = base + ((((i * 1200 + 800) - t * 14) % span) + span) % span;
      const y = WATER + 50 + i * 30;
      const bob = Math.sin(t * 1.3 + i) * 1.5;
      g.save();
      g.globalAlpha = f.barge;
      g.translate(x, y + bob);
      g.fillStyle = '#2a2430';
      g.beginPath(); g.moveTo(-90, -10); g.lineTo(90, -10); g.lineTo(76, 6); g.lineTo(-80, 6); g.closePath(); g.fill();
      // furniture on deck: a wardrobe, a sofa, a sack, a birdcage
      g.fillRect(-60, -46, 26, 36); g.fillRect(-28, -28, 46, 18); g.fillRect(-30, -36, 8, 26); g.fillRect(10, -36, 8, 26);
      g.beginPath(); g.ellipse(36, -20, 14, 10, 0, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#2a2430'; g.lineWidth = 1.2; g.beginPath(); g.arc(62, -26, 7, Math.PI, 0); g.stroke(); g.fillRect(55, -26, 14, 2);
      // the boatman with his pole
      g.beginPath(); g.ellipse(76, -46, 4, 4.5, 0, 0, Math.PI * 2); g.fill(); g.fillRect(72, -42, 8, 32);
      g.lineWidth = 2; g.beginPath(); g.moveTo(84, -50); g.lineTo(64, 30); g.stroke();
      // its reflection, short and broken
      g.globalAlpha = f.barge * 0.25;
      g.scale(1, -0.6); g.translate(0, -16);
      g.fillRect(-80, -6, 156, 12);
      g.restore();
    }
    g.setTransform(1, 0, 0, 1, 0, 0);
  }

  /* ---------- weather and air ---------- */

  private drawWeather(f: Frame, t: number) {
    const g = this.g, dpr = this.dpr;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const [, wy] = this.toScreen(f, 0, WATER);
    if (f.fluff > 0.01) {
      // poplar fluff drifting through the June air
      for (const p of this.fluffP) {
        const x = ((p.x * this.W + t * 14 * p.s + Math.sin(t * 0.7 + p.p) * 30) % (this.W + 40) + this.W + 40) % (this.W + 40) - 20;
        const y = ((p.y * this.H - t * 4 * p.s + Math.sin(t * 0.5 + p.p * 2) * 20) % this.H + this.H) % this.H;
        g.fillStyle = `rgba(255,252,245,${0.55 * f.fluff})`;
        g.beginPath(); g.arc(x, y, 1.3 * p.s, 0, Math.PI * 2); g.fill();
        g.fillStyle = `rgba(255,252,245,${0.18 * f.fluff})`;
        g.beginPath(); g.arc(x, y, 3.4 * p.s, 0, Math.PI * 2); g.fill();
      }
    }
    if (f.rain > 0.01) {
      g.strokeStyle = `rgba(220,228,236,${0.35 * f.rain})`;
      g.lineWidth = 1;
      g.beginPath();
      for (const p of this.rainP) {
        const x = (p.x * this.W + t * 60) % this.W;
        const y = ((p.y * this.H + t * 900 * p.l) % (this.H + 40)) - 20;
        g.moveTo(x, y); g.lineTo(x - 3, y + 16 * p.l);
      }
      g.stroke();
      // rings on the water
      if (Math.random() < 0.9) this.ringsP.push({ x: Math.random() * this.W, y: wy + Math.pow(Math.random(), 0.7) * (this.H - wy), t });
      this.ringsP = this.ringsP.filter((q) => t - q.t < 1.1);
      g.strokeStyle = `rgba(230,236,240,${0.3 * f.rain})`;
      for (const q of this.ringsP) {
        const a = (t - q.t) / 1.1, d = (q.y - wy) / Math.max(1, this.H - wy);
        g.globalAlpha = 1 - a;
        g.beginPath(); g.ellipse(q.x, q.y, (2 + a * 14) * (0.6 + d), (0.8 + a * 3) * (0.6 + d), 0, 0, Math.PI * 2); g.stroke();
      }
      g.globalAlpha = 1;
    }
    if (f.bell > 0.01) {
      // the eleven strokes from the distant tower, as rings in the air
      const s = (this.H / 1000) * Math.sqrt(f.zoom);
      const tx = this.W * this.focusX + (this.world.tower.at - f.cam) * 0.4 * s;
      const baseY = this.H * this.focusY + (560 - f.cy) * (this.H / 1000) * f.zoom;
      const ty = baseY - 230 * s * 0.7;
      g.strokeStyle = 'rgba(255,240,215,0.6)';
      for (let k = 0; k < 4; k++) {
        const a = ((t * 0.5 + k / 4) % 1);
        g.globalAlpha = f.bell * (1 - a) * 0.7;
        g.lineWidth = 1.5;
        g.beginPath(); g.arc(tx, ty, 10 + a * 180, 0, Math.PI * 2); g.stroke();
      }
      g.globalAlpha = 1;
    }
    if (f.notes > 0.01) {
      // "Rosina!" — notes rising off the seat
      const [sx, sy] = this.toScreen(f, this.world.seat.x, 560);
      g.fillStyle = 'rgba(255,236,190,0.9)';
      g.strokeStyle = 'rgba(255,236,190,0.9)';
      for (let k = 0; k < 9; k++) {
        const a = ((t * 0.18 + k / 9) % 1);
        const x = sx + Math.sin(a * 6 + k) * 40 + (k - 4) * 14, y = sy - a * this.H * 0.4;
        g.globalAlpha = f.notes * Math.sin(a * Math.PI);
        g.beginPath(); g.ellipse(x, y, 5, 3.6, -0.4, 0, Math.PI * 2); g.fill();
        g.lineWidth = 1.4; g.beginPath(); g.moveTo(x + 4.4, y - 1); g.lineTo(x + 4.4, y - 18); g.lineTo(x + 10, y - 13); g.stroke();
      }
      g.globalAlpha = 1;
    }
  }

  get worldW() { return WORLD_W; }
}
