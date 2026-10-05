/**
 * What the story calls up over the canal: the Goddess of Fancy's golden warp,
 * the dreamer's dreams drawn in light, the palazzo, dreams falling like
 * yellow leaves; Nastenka's history as silhouette cameos in oval frames, the
 * way portraits were cut in the 1840s; the letters, written in a pen hand as
 * you read; and, in the morning, the dreamer's room with rain on the glass.
 */

import { Pad } from '../effects/flat/pad';
import { NASTENKA, DREAMER, write } from '../effects/whitenights/hand';
import type { Frame } from './painter';
import { INK, HAT } from './figures';

const GOLD = 'rgba(255,214,140,';
const clamp = (v: number, a = 0, b = 1) => (v < a ? a : v > b ? b : v);

function rng(seed: number) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

type ToScreen = (wx: number, wy: number) => [number, number];

export const LETTERS: Record<string, { hand: 'n' | 'd'; lines: string[]; sign?: string }> = {
  'letter:hers': {
    hand: 'n',
    lines: ['I am writing to you. Forgive me my impatience; but I have been happy for a whole year in hope; am I to blame for being unable to endure a day of doubt now? Now that you have come, perhaps you have changed your mind. If so, this letter is to tell you that I do not repine, nor blame you.'],
  },
  'letter:last': {
    hand: 'n',
    lines: ['Oh, forgive me, forgive me! I beg you on my knees to forgive me! I deceived you and myself. It was a dream, a mirage. . . . My heart aches for you to-day; forgive me, forgive me!', 'We shall meet, you will come to us, you will not leave us, you will be for ever a friend, a brother to me.'],
    sign: 'Nastenka',
  },
};

export class Visions {
  private W = 1; private H = 1;
  private cache = new Map<string, HTMLCanvasElement>();
  private leaves: { x: number; y: number; v: number; r: number; s: number }[] = [];

  resize(w: number, h: number) {
    if (Math.abs(w - this.W) > 2 || Math.abs(h - this.H) > 2) this.cache.clear();
    this.W = w; this.H = h;
    const r = rng(4);
    this.leaves = Array.from({ length: 46 }, () => ({ x: r(), y: r(), v: 0.5 + r(), r: r() * 6.28, s: 0.7 + r() * 0.7 }));
  }

  draw(g: CanvasRenderingContext2D, f: Frame, t: number, dpr: number, to: ToScreen) {
    for (const { v, a } of f.visions) {
      if (a < 0.005) continue;
      g.save();
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.globalAlpha = a;
      if (v === 'threads') this.threads(g, f, t, to);
      else if (v === 'dreams') this.dreams(g, t);
      else if (v === 'palazzo') this.palazzo(g, t);
      else if (v === 'falling') this.falling(g, f, t, to);
      else if (v.startsWith('cameo:')) this.cameo(g, v, t);
      else if (v === 'letter:rosina') this.rosina(g, t);
      else if (v.startsWith('letter:')) this.letter(g, v, f, t);
      else if (v.startsWith('room')) this.room(g, v, f, t, a);
      g.restore();
    }
  }

  /* ---------- where things sit: right of the text on wide screens, top on phones ---------- */

  private get portrait() { return this.W / this.H < 0.9; }
  private stage() {
    const p = this.portrait;
    const cx = p ? this.W * 0.5 : this.W * 0.66;
    const cy = p ? this.H * 0.3 : this.H * 0.4;
    const size = p ? Math.min(this.W * 0.86, this.H * 0.44) : Math.min(this.W * 0.42, this.H * 0.66);
    return { cx, cy, size };
  }

  /* ---------- the golden warp ---------- */

  private threads(g: CanvasRenderingContext2D, f: Frame, t: number, to: ToScreen) {
    const [hx, hy] = to(8560 - 30, 548);
    g.globalCompositeOperation = 'lighter';
    g.lineCap = 'round';
    for (let k = 0; k < 18; k++) {
      const u = k / 17;
      const ex = this.W * (0.08 + u * 0.92) + Math.sin(t * 0.3 + k) * 20;
      const ey = this.H * (0.04 + Math.sin(u * Math.PI) * 0.05);
      const c1x = hx + (ex - hx) * 0.2 + Math.sin(t * 0.7 + k * 1.3) * 60, c1y = hy - this.H * 0.25;
      const c2x = ex + Math.sin(t * 0.5 + k) * 80, c2y = ey + this.H * 0.25;
      const prog = clamp(f.hold * 1.6 - u * 0.4 + 0.2);
      if (prog <= 0) continue;
      g.setLineDash([]);
      g.strokeStyle = GOLD + '0.07)'; g.lineWidth = 7;
      this.bez(g, hx, hy, c1x, c1y, c2x, c2y, ex, ey, prog);
      g.strokeStyle = GOLD + '0.45)'; g.lineWidth = 1.1;
      this.bez(g, hx, hy, c1x, c1y, c2x, c2y, ex, ey, prog);
      // glints running up the threads
      g.setLineDash([2, 60]); g.lineDashOffset = -t * 60 - k * 17;
      g.strokeStyle = 'rgba(255,248,220,0.9)'; g.lineWidth = 2;
      this.bez(g, hx, hy, c1x, c1y, c2x, c2y, ex, ey, prog);
    }
    g.setLineDash([]);
    // the weft: a shuttle crossing the warp near the top, leaving pattern behind it
    const rows = 5;
    for (let r = 0; r < rows; r++) {
      const y = this.H * (0.08 + r * 0.035);
      const wave = (k: number) => y + Math.sin(k * 0.05 + t * 1.2 + r) * 6;
      const len = clamp(f.hold * 1.8 - r * 0.25) * this.W;
      g.strokeStyle = GOLD + `${0.25 - r * 0.03})`; g.lineWidth = 1.4;
      g.beginPath();
      for (let x = 0; x <= len; x += 8) { if (x === 0) g.moveTo(x, wave(x)); else g.lineTo(x, wave(x)); }
      g.stroke();
    }
  }

  private bez(g: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, upto: number) {
    g.beginPath();
    g.moveTo(x0, y0);
    const n = 40;
    for (let i = 1; i <= n * upto; i++) {
      const u = i / n, v = 1 - u;
      g.lineTo(v * v * v * x0 + 3 * v * v * u * x1 + 3 * v * u * u * x2 + u * u * u * x3, v * v * v * y0 + 3 * v * v * u * y1 + 3 * v * u * u * y2 + u * u * u * y3);
    }
    g.stroke();
  }

  /* ---------- dreams drawn in light ---------- */

  private glowStroke(g: CanvasRenderingContext2D, path: () => void, w = 1.4) {
    g.strokeStyle = GOLD + '0.12)'; g.lineWidth = w * 6; path(); g.stroke();
    g.strokeStyle = GOLD + '0.3)'; g.lineWidth = w * 2.4; path(); g.stroke();
    g.strokeStyle = 'rgba(255,244,214,0.95)'; g.lineWidth = w; path(); g.stroke();
  }

  private dreams(g: CanvasRenderingContext2D, t: number) {
    g.globalCompositeOperation = 'lighter';
    g.lineCap = 'round'; g.lineJoin = 'round';
    const p = this.portrait;
    const items: [number, number, number, (g: CanvasRenderingContext2D) => void][] = p
      ? [[0.25, 0.1, 0.16, laurel], [0.72, 0.1, 0.16, gondola], [0.28, 0.26, 0.17, knight], [0.72, 0.27, 0.17, barge], [0.5, 0.42, 0.16, kolomna]]
      : [[0.46, 0.14, 0.11, laurel], [0.66, 0.11, 0.12, gondola], [0.86, 0.17, 0.12, knight], [0.55, 0.36, 0.12, barge], [0.78, 0.38, 0.12, kolomna]];
    items.forEach(([x, y, s, fn], i) => {
      const size = s * Math.max(this.W, this.H) * (p ? 1.1 : 1);
      const fl = Math.sin(t * 0.6 + i * 1.7) * 6;
      const tw = 0.75 + 0.25 * Math.sin(t * 1.1 + i);
      g.save();
      g.globalAlpha *= tw;
      g.translate(this.W * x, this.H * y + fl);
      g.scale(size / 100, size / 100);
      fn(g);
      // the glowing outlines: strokes were built as paths on g; draw them with a glow
      g.restore();
    });
    function stroke3(gg: CanvasRenderingContext2D, build: () => void, w = 1.2) {
      gg.strokeStyle = GOLD + '0.12)'; gg.lineWidth = w * 6; gg.beginPath(); build(); gg.stroke();
      gg.strokeStyle = GOLD + '0.35)'; gg.lineWidth = w * 2.4; gg.beginPath(); build(); gg.stroke();
      gg.strokeStyle = 'rgba(255,246,222,0.95)'; gg.lineWidth = w; gg.beginPath(); build(); gg.stroke();
    }
    // each little picture, in a 100-unit box centred on the origin
    function laurel(gg: CanvasRenderingContext2D) {
      // the poet, first unrecognized, then crowned with laurels
      stroke3(gg, () => {
        gg.arc(0, 0, 38, Math.PI * 0.62, Math.PI * 2.38);
        for (let k = 0; k < 14; k++) {
          const a = Math.PI * 0.68 + (k / 13) * Math.PI * 1.64;
          const x = Math.cos(a) * 38, y = Math.sin(a) * 38;
          const o = k % 2 ? 1 : -1;
          gg.moveTo(x, y); gg.quadraticCurveTo(x + Math.cos(a + o) * 10, y + Math.sin(a + o) * 10, x + Math.cos(a + o * 0.6) * 16, y + Math.sin(a + o * 0.6) * 16);
        }
        gg.moveTo(-6, 40); gg.quadraticCurveTo(0, 48, 6, 40);
      });
    }
    function gondola(gg: CanvasRenderingContext2D) {
      stroke3(gg, () => {
        gg.moveTo(-48, 10); gg.quadraticCurveTo(0, 26, 46, 6); gg.lineTo(52, -14); gg.moveTo(-48, 10); gg.lineTo(-54, -4);
        gg.moveTo(30, 6); gg.lineTo(34, -30); gg.moveTo(34, -30); gg.lineTo(14, 24);
        gg.moveTo(-60, 30); gg.quadraticCurveTo(0, 36, 60, 30);
        gg.moveTo(-60, -20); gg.quadraticCurveTo(-30, -56, 0, -20); gg.quadraticCurveTo(30, -56, 60, -20);
      });
    }
    function knight(gg: CanvasRenderingContext2D) {
      stroke3(gg, () => {
        gg.moveTo(-40, 10); gg.quadraticCurveTo(-10, -2, 24, 8); gg.quadraticCurveTo(36, -12, 44, -24); gg.lineTo(50, -18);
        gg.moveTo(-34, 10); gg.lineTo(-40, 40); gg.moveTo(-20, 12); gg.lineTo(-16, 40); gg.moveTo(14, 10); gg.lineTo(8, 40); gg.moveTo(22, 10); gg.lineTo(30, 38);
        gg.moveTo(-40, 10); gg.quadraticCurveTo(-54, 14, -52, 30);
        gg.moveTo(-6, 0); gg.lineTo(-4, -32); gg.arc(-4, -38, 6, Math.PI / 2, Math.PI * 2.5);
        gg.moveTo(-4, -26); gg.lineTo(30, -60);
        gg.moveTo(-14, -30); gg.lineTo(-24, -8);
      });
    }
    function barge(gg: CanvasRenderingContext2D) {
      // Cleopatra and her lovers
      stroke3(gg, () => {
        gg.moveTo(-56, 6); gg.quadraticCurveTo(0, 26, 56, 6); gg.quadraticCurveTo(62, -8, 66, -16);
        gg.moveTo(-56, 6); gg.quadraticCurveTo(-62, -8, -66, -16);
        gg.moveTo(0, 12); gg.lineTo(0, -50); gg.moveTo(-28, -44); gg.quadraticCurveTo(0, -20, 28, -44); gg.moveTo(-28, -44); gg.lineTo(28, -44);
        for (let k = -3; k <= 3; k++) { gg.moveTo(k * 12, 14); gg.lineTo(k * 12 - 10, 34); }
      });
    }
    function kolomna(gg: CanvasRenderingContext2D) {
      // a little house in Kolomna, a lamp in the window, and beside one a dear creature
      stroke3(gg, () => {
        gg.rect(-40, -16, 80, 50);
        gg.moveTo(-48, -14); gg.lineTo(0, -48); gg.lineTo(48, -14);
        gg.rect(-26, -2, 18, 18); gg.rect(10, -2, 18, 18);
        gg.moveTo(-6, 34); gg.lineTo(-6, 14); gg.lineTo(6, 14); gg.lineTo(6, 34);
        gg.moveTo(24, -36); gg.lineTo(24, -52); gg.lineTo(32, -52); gg.lineTo(32, -30);
      });
      gg.fillStyle = 'rgba(255,200,120,0.55)';
      gg.fillRect(-25, -1, 16, 16); gg.fillRect(11, -1, 16, 16);
    }
  }

  private palazzo(g: CanvasRenderingContext2D, t: number) {
    const { cx, cy, size } = this.stage();
    const s = size / 100;
    g.globalCompositeOperation = 'lighter';
    g.lineCap = 'round'; g.lineJoin = 'round';
    g.save();
    g.translate(cx, cy - size * 0.05);
    g.scale(s, s);
    // a sea of lights
    const halo = g.createRadialGradient(0, 0, 4, 0, 0, 80);
    halo.addColorStop(0, 'rgba(255,200,130,0.35)'); halo.addColorStop(1, 'rgba(255,200,130,0)');
    g.fillStyle = halo; g.fillRect(-90, -90, 180, 180);
    const lineSet = () => {
      g.rect(-60, -40, 120, 70);
      g.moveTo(-64, -40); g.lineTo(64, -40); g.moveTo(-64, -44); g.lineTo(64, -44);
      for (let k = -2; k <= 2; k++) {
        const x = k * 22;
        g.moveTo(x - 8, -6); g.lineTo(x - 8, -28); g.arc(x, -28, 8, Math.PI, 0); g.lineTo(x + 8, -6);
        g.moveTo(x - 8, 26); g.lineTo(x - 8, 8); g.arc(x, 8, 8, Math.PI, 0); g.lineTo(x + 8, 26);
      }
      // the balcony
      g.moveTo(-30, 0); g.lineTo(30, 0); g.moveTo(-30, -6); g.lineTo(30, -6);
      for (let k = -28; k <= 28; k += 6) { g.moveTo(k, -6); g.lineTo(k, 0); }
      g.moveTo(-70, 30); g.lineTo(70, 30);
    };
    this.glowStroke(g, () => { g.beginPath(); lineSet(); }, 0.6);
    // windows full of light
    for (let k = -2; k <= 2; k++) for (const y of [-30, 6]) {
      g.fillStyle = `rgba(255,190,110,${0.3 + 0.15 * Math.sin(t * 2 + k * 2 + y)})`;
      g.fillRect(k * 22 - 7, y, 14, 18);
    }
    // garlands of myrtle and roses along the balcony
    for (let k = 0; k < 12; k++) {
      const x = -30 + k * 5.4, y = -2 + Math.sin(k * 0.8) * 2 + 3;
      g.fillStyle = k % 3 === 0 ? 'rgba(255,140,150,0.8)' : 'rgba(170,230,160,0.5)';
      g.beginPath(); g.arc(x, y, 1.4, 0, Math.PI * 2); g.fill();
    }
    g.restore();
    // the two on the balcony, in silhouette against the light: she has taken off her mask
    g.save();
    g.globalCompositeOperation = 'source-over';
    g.translate(cx, cy - size * 0.05 - 6 * s);
    g.scale(s * 0.33, s * 0.33);
    g.fillStyle = 'rgba(30,20,40,0.9)';
    g.beginPath(); g.ellipse(-6, -50, 5, 6, 0, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.ellipse(6, -48, 4.6, 5.4, 0, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.moveTo(-12, -42); g.lineTo(-2, -42); g.lineTo(2, 0); g.lineTo(-14, 0); g.fill();
    g.beginPath(); g.moveTo(2, -40); g.lineTo(10, -40); g.bezierCurveTo(14, -24, 22, -6, 22, 0); g.lineTo(0, 0); g.fill();
    g.strokeStyle = 'rgba(255,230,180,0.9)'; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(14, -36); g.quadraticCurveTo(22, -44, 26, -38); g.stroke();
    g.restore();
  }

  private falling(g: CanvasRenderingContext2D, f: Frame, t: number, to: ToScreen) {
    const [, wy] = to(0, 660);
    for (const l of this.leaves) {
      const span = Math.max(40, wy + 20);
      const y = ((l.y * span + t * 26 * l.v) % span);
      const x = l.x * this.W + Math.sin(t * 0.9 * l.v + l.r) * 40;
      const a = Math.min(1, (wy - y) / 30);
      if (a <= 0) continue;
      g.save();
      g.globalAlpha *= a * 0.9;
      g.translate(x, y);
      g.rotate(t * l.v + l.r);
      g.scale(l.s, l.s * (0.4 + 0.6 * Math.abs(Math.sin(t * 1.3 * l.v + l.r))));
      const gr = g.createLinearGradient(-8, 0, 8, 0);
      gr.addColorStop(0, '#d7962e'); gr.addColorStop(0.5, '#f3cf68'); gr.addColorStop(1, '#c47f22');
      g.fillStyle = gr;
      g.beginPath(); g.moveTo(-9, 0); g.quadraticCurveTo(0, -7, 9, 0); g.quadraticCurveTo(0, 7, -9, 0); g.fill();
      g.strokeStyle = 'rgba(120,70,20,0.5)'; g.lineWidth = 0.6; g.beginPath(); g.moveTo(-8, 0); g.lineTo(8, 0); g.stroke();
      g.restore();
    }
    void f;
  }

  /* ---------- Nastenka's history, in cut silhouettes ---------- */

  private cameo(g: CanvasRenderingContext2D, v: string, t: number) {
    const { cx, cy, size } = this.stage();
    const c = this.cameoCanvas(v);
    const h = size * 1.12, w = h * (c.width / c.height);
    const fl = Math.sin(t * 0.5) * 4;
    g.save();
    g.shadowColor = 'rgba(20,10,10,0.45)'; g.shadowBlur = 30; g.shadowOffsetY = 10;
    g.drawImage(c, cx - w / 2, cy - h / 2 + fl, w, h);
    g.restore();
  }

  private cameoCanvas(v: string) {
    const hit = this.cache.get(v);
    if (hit) return hit;
    const c = document.createElement('canvas');
    c.width = 520; c.height = 640;
    const g = c.getContext('2d')!;
    const cx = 260, cy = 300, rx = 210, ry = 268;
    // the gilt frame
    const fr = g.createLinearGradient(0, 0, 520, 640);
    fr.addColorStop(0, '#8a6424'); fr.addColorStop(0.3, '#f1d58a'); fr.addColorStop(0.55, '#a77b30'); fr.addColorStop(0.8, '#f6dd98'); fr.addColorStop(1, '#7d5a20');
    g.fillStyle = fr;
    g.beginPath(); g.ellipse(cx, cy, rx + 24, ry + 24, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(90,60,20,0.6)'; g.lineWidth = 2;
    for (let k = 0; k < 60; k++) { const a = (k / 60) * Math.PI * 2; g.beginPath(); g.arc(cx + Math.cos(a) * (rx + 12), cy + Math.sin(a) * (ry + 12), 4, 0, Math.PI * 2); g.stroke(); }
    g.fillStyle = '#6b4c1c';
    g.beginPath(); g.ellipse(cx, cy, rx + 4, ry + 4, 0, 0, Math.PI * 2); g.fill();
    // cream paper
    const paper = g.createRadialGradient(cx, cy - 40, 20, cx, cy, ry);
    paper.addColorStop(0, '#f8f0dc'); paper.addColorStop(1, '#e5d6b6');
    g.fillStyle = paper;
    g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); g.fill();
    g.save();
    g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); g.clip();
    g.fillStyle = INK; g.strokeStyle = INK; g.lineCap = 'round'; g.lineJoin = 'round';
    g.translate(cx, cy + 40);
    // some of the little scenes want to fill more of the oval
    const zoom: Record<string, [number, number]> = { 'cameo:pinned': [1.3, -20], 'cameo:books': [1.15, -10], 'cameo:promise': [1.45, -30], 'cameo:bundle': [1.05, 10] };
    const [zs, zy] = zoom[v] ?? [1, 0];
    g.translate(0, zy); g.scale(zs, zs);
    SCENES[v]?.(g);
    g.restore();
    // a little bow on top of the frame
    g.fillStyle = '#c9a24c';
    g.beginPath(); g.ellipse(cx - 18, 18, 18, 9, -0.4, 0, Math.PI * 2); g.ellipse(cx + 18, 18, 18, 9, 0.4, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(cx, 20, 7, 0, Math.PI * 2); g.fill();
    this.cache.set(v, c);
    return c;
  }

  /* ---------- letters ---------- */

  private rosina(g: CanvasRenderingContext2D, t: number) {
    const { cx, cy, size } = this.stage();
    const w = size * 0.95, h = w * 0.62;
    const c = this.cache.get('rosina') ?? this.makeRosina();
    g.save();
    g.translate(cx, cy + Math.sin(t * 0.6) * 4);
    g.rotate(-0.06);
    g.shadowColor = 'rgba(20,10,10,0.4)'; g.shadowBlur = 24; g.shadowOffsetY = 8;
    g.drawImage(c, -w / 2, -h / 2, w, h);
    g.restore();
  }

  private makeRosina() {
    const c = document.createElement('canvas'); c.width = 900; c.height = 560;
    const g = c.getContext('2d')!;
    this.paper(g, 900, 560);
    // the envelope's folds
    g.strokeStyle = 'rgba(120,95,60,0.35)'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(0, 0); g.lineTo(450, 300); g.lineTo(900, 0); g.moveTo(0, 560); g.lineTo(380, 300); g.moveTo(900, 560); g.lineTo(520, 300); g.stroke();
    const pad = new Pad(g, 900, 560, 31);
    write(pad, 'Rosina', [0.5, 0.84], NASTENKA, { size: 0.07, width: 0.8, align: 'centre', seed: 5 });
    // the seal
    const sg = g.createRadialGradient(440, 290, 4, 450, 300, 46);
    sg.addColorStop(0, '#d2473a'); sg.addColorStop(1, '#7d1c16');
    g.fillStyle = sg;
    g.beginPath();
    for (let k = 0; k < 20; k++) { const a = (k / 20) * Math.PI * 2; const r = 40 + (k % 2) * 5; g.lineTo(450 + Math.cos(a) * r, 300 + Math.sin(a) * r); }
    g.fill();
    g.fillStyle = 'rgba(255,200,180,0.35)';
    g.font = 'italic 34px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('N', 450, 302);
    this.cache.set('rosina', c);
    return c;
  }

  private paper(g: CanvasRenderingContext2D, w: number, h: number) {
    const p = g.createLinearGradient(0, 0, w, h);
    p.addColorStop(0, '#f7efdc'); p.addColorStop(1, '#e8dbbf');
    g.fillStyle = p; g.fillRect(0, 0, w, h);
    const r = rng(9);
    for (let i = 0; i < 1600; i++) { g.fillStyle = `rgba(120,95,60,${r() * 0.05})`; g.fillRect(r() * w, r() * h, 1 + r() * 2, 1); }
    const edge = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.7);
    edge.addColorStop(0, 'rgba(150,110,60,0)'); edge.addColorStop(1, 'rgba(150,110,60,0.25)');
    g.fillStyle = edge; g.fillRect(0, 0, w, h);
  }

  /** A letter written line by line as you read (the writing is clipped open with the reading). */
  private letter(g: CanvasRenderingContext2D, v: string, f: Frame, t: number) {
    const L = LETTERS[v];
    if (!L) return;
    const key = 'L' + v;
    let c = this.cache.get(key);
    if (!c) {
      c = document.createElement('canvas'); c.width = 820; c.height = 1060;
      const lg = c.getContext('2d')!;
      this.paper(lg, 820, 1060);
      const pad = new Pad(lg, 820, 1060, 17);
      let y = 0.1;
      for (const para of L.lines) y = write(pad, para, [0.1, y], L.hand === 'n' ? NASTENKA : DREAMER, { size: 0.034, width: 0.8, seed: 3 + y * 100 }) + 0.06;
      if (L.sign) write(pad, L.sign, [0.5, Math.min(0.9, y + 0.02)], NASTENKA, { size: 0.06, width: 0.5, seed: 8 });
      this.cache.set(key, c);
    }
    const inRoom = v === 'letter:last';
    const p = this.portrait;
    const h = p ? this.H * 0.5 : this.H * 0.8;
    const w = h * (c.width / c.height);
    const cx = p ? this.W * 0.5 : this.W * (inRoom ? 0.68 : 0.66);
    const cy = p ? this.H * 0.3 : this.H * 0.5;
    if (inRoom) this.room(g, 'room', f, t, 1);
    g.save();
    g.translate(cx, cy + Math.sin(t * 0.5) * 3);
    g.rotate(0.03);
    g.shadowColor = 'rgba(20,10,10,0.45)'; g.shadowBlur = 28; g.shadowOffsetY = 10;
    g.fillStyle = '#efe4cc';
    g.fillRect(-w / 2, -h / 2, w, h);
    g.shadowColor = 'transparent';
    // reveal the writing as the passage is read
    const reveal = clamp(0.3 + f.hold * 1.0);
    g.drawImage(c, 0, 0, c.width, c.height * reveal, -w / 2, -h / 2, w, h * reveal);
    g.fillStyle = '#efe4cc';
    g.restore();
  }

  /* ---------- the dreamer's room ---------- */

  private room(g: CanvasRenderingContext2D, v: string, f: Frame, t: number, a: number) {
    const W = this.W, H = this.H;
    const old = v === 'room:old', clear = v === 'room:clear';
    // grimy green walls
    const wall = g.createLinearGradient(0, 0, 0, H);
    wall.addColorStop(0, old ? '#38402f' : '#3f4a36'); wall.addColorStop(1, old ? '#20241b' : '#262d20');
    g.fillStyle = wall; g.fillRect(0, 0, W, H);
    const p = this.portrait;
    const ww = p ? W * 0.8 : W * 0.34, wh = p ? H * 0.42 : H * 0.62;
    const wx = p ? W * 0.5 - ww / 2 : W * 0.66 - ww / 2, wy = p ? H * 0.06 : H * 0.14;
    // outside: the house opposite, with its columns, in the rain
    g.save();
    g.beginPath(); g.rect(wx, wy, ww, wh); g.clip();
    const sky = g.createLinearGradient(0, wy, 0, wy + wh);
    if (clear) { sky.addColorStop(0, '#9fb4d8'); sky.addColorStop(1, '#f6dcc0'); }
    else { sky.addColorStop(0, '#7b8189'); sky.addColorStop(1, '#a7a9a7'); }
    g.fillStyle = sky; g.fillRect(wx, wy, ww, wh);
    // the house opposite: two storeys of yellow stucco with white columns, across a wet street
    const hy = wy + wh * 0.36;
    const yellow = old ? '#b39b58' : clear ? '#f0cf62' : '#d6b95c';
    const trim = old ? '#a39a8a' : '#efe7d6';
    g.fillStyle = old ? '#4c4a46' : '#5d6168';
    g.beginPath(); g.moveTo(wx - 10, hy - 4); g.lineTo(wx + ww * 0.1, hy - wh * 0.12); g.lineTo(wx + ww * 0.9, hy - wh * 0.12); g.lineTo(wx + ww + 10, hy - 4); g.fill();
    for (const cx of [0.22, 0.7]) g.fillRect(wx + ww * cx, hy - wh * 0.2, ww * 0.04, wh * 0.1);
    g.fillStyle = yellow; g.fillRect(wx - 10, hy, ww + 20, wh);
    g.fillStyle = trim; g.fillRect(wx - 10, hy - 4, ww + 20, wh * 0.035); g.fillRect(wx - 10, hy + wh * 0.3, ww + 20, wh * 0.02);
    const bays = 6;
    for (let k = 0; k < bays; k++) {
      const x = wx + ww * ((k + 0.5) / bays);
      for (const [y, hh] of [[hy + wh * 0.08, wh * 0.16], [hy + wh * 0.38, wh * 0.18]] as const) {
        g.fillStyle = trim; g.fillRect(x - ww * 0.04, y - 3, ww * 0.08, hh + 6);
        g.fillStyle = old ? '#35322c' : clear ? '#5b6680' : '#454956';
        g.fillRect(x - ww * 0.03, y, ww * 0.06, hh);
        g.fillStyle = trim; g.fillRect(x - 0.8, y, 1.6, hh);
      }
    }
    for (let k = 0; k <= bays; k++) {
      const x = wx + ww * (k / bays);
      const cg = g.createLinearGradient(x - ww * 0.016, 0, x + ww * 0.016, 0);
      cg.addColorStop(0, old ? '#8c8474' : '#d8cfbd'); cg.addColorStop(0.5, trim); cg.addColorStop(1, old ? '#7d7565' : '#cfc5b0');
      g.fillStyle = cg; g.fillRect(x - ww * 0.016, hy + wh * 0.04, ww * 0.032, wh * 0.26);
      if (old) {
        // stucco peeling off the columns
        g.fillStyle = '#7d6f52';
        const r = rng(k + 3);
        for (let q = 0; q < 3; q++) g.fillRect(x - ww * 0.016 + r() * ww * 0.02, hy + wh * (0.06 + r() * 0.2), ww * 0.012 + 2, 4 + r() * 10);
      }
    }
    // the wet street in front, catching the light
    const st = g.createLinearGradient(0, hy + wh * 0.62, 0, wy + wh);
    st.addColorStop(0, old ? '#4a4740' : '#6b6c6c'); st.addColorStop(1, old ? '#2f2d29' : '#4a4c4f');
    g.fillStyle = st; g.fillRect(wx - 10, hy + wh * 0.6, ww + 20, wh);
    g.fillStyle = 'rgba(230,220,160,0.18)'; g.fillRect(wx - 10, hy + wh * 0.62, ww + 20, 3);
    if (old) {
      // cracks and soot on the cornice
      g.strokeStyle = 'rgba(40,30,20,0.6)'; g.lineWidth = 1;
      const r = rng(5);
      for (let k = 0; k < 7; k++) { let x = wx + r() * ww, y = hy; g.beginPath(); g.moveTo(x, y); for (let q = 0; q < 5; q++) { x += (r() - 0.5) * 14; y += 6 + r() * 8; g.lineTo(x, y); } g.stroke(); }
      g.fillStyle = 'rgba(30,25,20,0.3)'; g.fillRect(wx - 10, hy - 4, ww + 20, 14);
    }
    if (clear) {
      // "the sunbeams suddenly peeping out from the clouds"
      g.globalCompositeOperation = 'lighter';
      const sb = g.createLinearGradient(wx, wy, wx + ww, wy + wh);
      sb.addColorStop(0, 'rgba(255,230,180,0.35)'); sb.addColorStop(1, 'rgba(255,230,180,0)');
      g.fillStyle = sb; g.fillRect(wx, wy, ww, wh);
      g.globalCompositeOperation = 'source-over';
    }
    g.restore();
    // rain on the glass: beads, and runs that wander down
    if (!clear) {
      const r = rng(21);
      for (let i = 0; i < 90; i++) {
        const x = wx + r() * ww, y0 = wy + r() * wh, sp = 0.3 + r() * 1.2;
        const run = r() < 0.3;
        const y = run ? wy + ((y0 - wy + t * 40 * sp) % wh) : y0;
        g.fillStyle = 'rgba(230,236,240,0.35)';
        g.beginPath(); g.ellipse(x, y, 1.6 + r() * 2, 2 + r() * 2.6, 0, 0, Math.PI * 2); g.fill();
        g.fillStyle = 'rgba(255,255,255,0.5)';
        g.beginPath(); g.arc(x - 0.6, y - 0.8, 0.7, 0, Math.PI * 2); g.fill();
        if (run) { g.strokeStyle = 'rgba(220,228,234,0.18)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.sin(y * 0.1) * 2, y - 30 - r() * 40); g.stroke(); }
      }
    }
    // the window frame, mullions, sill
    g.fillStyle = '#2a2620';
    const fw = Math.max(8, ww * 0.03);
    g.fillRect(wx - fw, wy - fw, ww + fw * 2, fw); g.fillRect(wx - fw, wy + wh, ww + fw * 2, fw * 1.6);
    g.fillRect(wx - fw, wy - fw, fw, wh + fw * 2); g.fillRect(wx + ww, wy - fw, fw, wh + fw * 2);
    g.fillRect(wx + ww / 2 - fw / 3, wy, fw * 0.66, wh); g.fillRect(wx, wy + wh * 0.42, ww, fw * 0.66);
    g.fillStyle = '#4a4034'; g.fillRect(wx - fw * 2.5, wy + wh + fw * 1.6, ww + fw * 5, fw * 1.4);
    // the table under the window, with a guttered candle; the chair he jumped up from
    g.fillStyle = '#1b1a14';
    const ty = wy + wh + fw * 3.4;
    g.fillRect(wx - ww * 0.15, ty, ww * 0.7, H * 0.02);
    g.fillRect(wx - ww * 0.12, ty, H * 0.012, H - ty); g.fillRect(wx + ww * 0.5, ty, H * 0.012, H - ty);
    g.fillRect(wx + ww * 0.12, ty - H * 0.05, H * 0.012, H * 0.05);
    g.fillStyle = '#e8dfc8'; g.fillRect(wx + ww * 0.02, ty - H * 0.006, ww * 0.16, H * 0.006);
    g.fillStyle = '#1b1a14';
    g.fillRect(wx + ww * 0.62, ty - H * 0.12, H * 0.012, H - ty + H * 0.12); g.fillRect(wx + ww * 0.62, ty + H * 0.04, ww * 0.2, H * 0.014); g.fillRect(wx + ww * 0.8, ty + H * 0.04, H * 0.012, H);
    // light from the window across the room
    g.save();
    g.globalCompositeOperation = 'lighter';
    const lg = g.createRadialGradient(wx + ww / 2, wy + wh / 2, ww * 0.3, wx + ww / 2, wy + wh / 2, Math.max(W, H) * 0.7);
    lg.addColorStop(0, clear ? 'rgba(255,220,170,0.18)' : 'rgba(170,180,190,0.1)'); lg.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = lg; g.fillRect(0, 0, W, H);
    g.restore();
    // the spider's web Matrona encouraged, thicker than ever when everything seems to have aged
    const web = old ? 1.5 : clear ? 0.6 : 1;
    g.save();
    g.strokeStyle = `rgba(220,220,210,${0.22 * web})`; g.lineWidth = 0.8;
    const ox = W - 4, oy = 4, R = Math.min(W, H) * 0.22 * web;
    for (let k = 0; k <= 7; k++) { const an = Math.PI / 2 + (k / 7) * (Math.PI / 2); g.beginPath(); g.moveTo(ox, oy); g.lineTo(ox + Math.cos(an) * R, oy + Math.sin(an) * R); g.stroke(); }
    for (let q = 1; q < 7; q++) {
      g.beginPath();
      for (let k = 0; k <= 7; k++) { const an = Math.PI / 2 + (k / 7) * (Math.PI / 2); const rr = (R * q) / 7 * (0.92 + Math.sin(k + q) * 0.06); const x = ox + Math.cos(an) * rr, y = oy + Math.sin(an) * rr; if (k === 0) g.moveTo(x, y); else g.lineTo(x, y); }
      g.stroke();
    }
    g.restore();
    // the dark of the room around the edges
    const vg = g.createRadialGradient(W * 0.6, H * 0.45, Math.min(W, H) * 0.3, W * 0.6, H * 0.45, Math.max(W, H) * 0.8);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, old ? 'rgba(5,6,4,0.7)' : 'rgba(5,6,4,0.5)');
    g.fillStyle = vg; g.fillRect(0, 0, W, H);
    void a; void f;
  }
}

/* ---------- the cameo scenes, in a frame of about 420 × 536, origin a little below centre ---------- */

function seated(g: CanvasRenderingContext2D, x: number, face: 1 | -1, opts: { cap?: boolean; hat?: boolean; bun?: boolean; scale?: number; knit?: boolean }) {
  const s = opts.scale ?? 1;
  g.save(); g.translate(x, 0); g.scale(face * s, s);
  // chair
  g.fillRect(-34, -60, 8, 120); g.fillRect(-34, -4, 60, 8); g.fillRect(16, 0, 6, 60); g.fillRect(-34, 50, 8, 10);
  // skirt
  g.beginPath(); g.moveTo(-18, -40); g.bezierCurveTo(-24, 0, -26, 30, -26, 60); g.lineTo(46, 60); g.bezierCurveTo(44, 30, 36, 6, 26, -6); g.lineTo(-10, -10); g.fill();
  // body and head
  g.beginPath(); g.moveTo(-18, -40); g.quadraticCurveTo(-22, -90, -6, -104); g.lineTo(8, -104); g.quadraticCurveTo(10, -70, 4, -40); g.fill();
  g.beginPath(); g.ellipse(2, -122, 14, 16, 0, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.moveTo(14, -128); g.lineTo(22, -118); g.lineTo(14, -114); g.fill();
  if (opts.cap) { g.beginPath(); g.ellipse(-2, -130, 18, 12, -0.3, 0, Math.PI * 2); g.fill(); g.beginPath(); g.moveTo(-14, -124); g.quadraticCurveTo(-24, -100, -18, -96); g.lineTo(-12, -110); g.fill(); }
  if (opts.bun) { g.beginPath(); g.arc(-12, -122, 8, 0, Math.PI * 2); g.fill(); }
  // arms forward to the lap
  g.lineWidth = 9;
  g.beginPath(); g.moveTo(0, -92); g.quadraticCurveTo(10, -60, 30, -50); g.stroke();
  if (opts.knit) {
    g.lineWidth = 2.5;
    g.beginPath(); g.moveTo(24, -64); g.lineTo(52, -40); g.moveTo(28, -42); g.lineTo(54, -62); g.stroke();
    g.beginPath(); g.ellipse(38, -50, 8, 6, 0.3, 0, Math.PI * 2); g.fill();
  }
  g.restore();
}

function stand(g: CanvasRenderingContext2D, x: number, y: number, face: 1 | -1, kind: 'girl' | 'man', s = 1, extra?: (g: CanvasRenderingContext2D) => void) {
  g.save(); g.translate(x, y); g.scale(face * s, s);
  if (kind === 'girl') {
    g.beginPath(); g.moveTo(-8, -84); g.bezierCurveTo(-18, -50, -34, -16, -34, 0); g.lineTo(34, 0); g.bezierCurveTo(30, -20, 18, -50, 8, -84); g.fill();
    g.beginPath(); g.moveTo(-8, -84); g.lineTo(-10, -126); g.lineTo(10, -126); g.lineTo(8, -84); g.fill();
    g.beginPath(); g.ellipse(0, -142, 12, 14, 0, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.moveTo(10, -146); g.lineTo(17, -138); g.lineTo(10, -134); g.fill();
    g.beginPath(); g.arc(-12, -140, 7, 0, Math.PI * 2); g.fill();
  } else {
    g.lineWidth = 12; g.lineCap = 'round';
    g.beginPath(); g.moveTo(-6, -70); g.lineTo(-8, -2); g.moveTo(6, -70); g.lineTo(8, -2); g.stroke();
    g.beginPath(); g.moveTo(-16, -150); g.lineTo(16, -150); g.lineTo(22, -60); g.lineTo(-20, -60); g.fill();
    g.beginPath(); g.ellipse(2, -168, 12, 14, 0, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.moveTo(12, -172); g.lineTo(20, -164); g.lineTo(12, -160); g.fill();
  }
  extra?.(g);
  g.restore();
}

const SCENES: Record<string, (g: CanvasRenderingContext2D) => void> = {
  'cameo:pinned': (g) => {
    // grandmother, blind, knitting; Nastenka beside her, their dresses pinned together
    g.fillRect(-200, 60, 400, 6);
    seated(g, -70, 1, { cap: true, knit: true });
    seated(g, 80, -1, { bun: true, scale: 0.92 });
    g.strokeStyle = HAT; g.lineWidth = 3;
    g.beginPath(); g.moveTo(-36, 30); g.quadraticCurveTo(4, 46, 44, 30); g.stroke();
    g.fillStyle = '#f6e2a0'; g.beginPath(); g.arc(4, 41, 4, 0, Math.PI * 2); g.fill();
  },
  'cameo:house': (g) => {
    // a little wooden house with three windows, and a lit window in the upper storey
    g.fillRect(-150, -40, 300, 104);
    g.beginPath(); g.moveTo(-170, -36); g.lineTo(0, -120); g.lineTo(170, -36); g.fill();
    g.fillRect(-40, -150, 80, 70);
    g.beginPath(); g.moveTo(-52, -146); g.lineTo(0, -190); g.lineTo(52, -146); g.fill();
    g.fillStyle = '#f2e6c4';
    for (const x of [-100, 0, 100]) g.fillRect(x - 18, -14, 36, 44);
    g.fillStyle = '#ffd48a'; g.fillRect(-16, -132, 32, 38);
    g.fillStyle = INK;
    for (const x of [-100, 0, 100]) { g.fillRect(x - 1.5, -14, 3, 44); g.fillRect(x - 18, 6, 36, 3); }
    // the new lodger at his window
    g.beginPath(); g.ellipse(0, -114, 7, 8, 0, 0, Math.PI * 2); g.fill(); g.fillRect(-8, -106, 16, 12);
    g.fillRect(-220, 60, 440, 6);
  },
  'cameo:books': (g) => {
    // by candlelight, Walter Scott; grandmother asleep in her chair
    seated(g, 90, -1, { cap: true, scale: 0.9 });
    seated(g, -70, 1, { bun: true });
    // book in her hands, a stack on the table
    g.fillRect(-50, -66, 34, 6);
    g.fillRect(-170, -20, 70, 80); g.fillRect(-180, -24, 90, 6);
    for (let k = 0; k < 4; k++) g.fillRect(-170 + k * 3, -44 - k * 10, 56 - k * 4, 9);
    g.fillRect(-120, -100, 5, 40);
    g.fillStyle = '#ffcf7a'; g.beginPath(); g.ellipse(-117.5, -108, 4, 8, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = INK; g.fillRect(-200, 60, 400, 6);
  },
  'cameo:opera': (g) => {
    // a box at the opera: the stage below with Rosina at her balcony
    g.fillRect(-210, -230, 420, 30);
    for (let k = 0; k < 6; k++) { g.beginPath(); g.moveTo(-210 + k * 70, -200); g.quadraticCurveTo(-175 + k * 70, -160, -140 + k * 70, -200); g.fill(); }
    g.fillRect(-210, -200, 26, 260); g.fillRect(184, -200, 26, 260);
    g.fillStyle = '#ffe1a8'; g.globalAlpha = 0.5; g.fillRect(-184, -200, 368, 150); g.globalAlpha = 1; g.fillStyle = INK;
    // Rosina, singing
    g.fillRect(40, -120, 80, 6); g.fillRect(44, -114, 4, 30); g.fillRect(112, -114, 4, 30);
    stand(g, 80, -120, -1, 'girl', 0.55);
    // the box: curved balustrade, three heads
    g.beginPath(); g.moveTo(-200, -20); g.quadraticCurveTo(0, 20, 200, -20); g.lineTo(200, 70); g.lineTo(-200, 70); g.fill();
    for (const [x, kind] of [[-110, 'cap'], [-10, 'girl'], [90, 'man']] as const) {
      g.beginPath(); g.ellipse(x, -40, 16, 19, 0, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.moveTo(x - 26, -18); g.lineTo(x + 26, -18); g.lineTo(x + 30, 10); g.lineTo(x - 30, 10); g.fill();
      if (kind === 'cap') { g.beginPath(); g.ellipse(x - 2, -50, 22, 14, 0, 0, Math.PI * 2); g.fill(); }
      if (kind === 'girl') { g.beginPath(); g.arc(x - 14, -40, 8, 0, Math.PI * 2); g.fill(); }
    }
    g.strokeStyle = '#f2e6c4'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(-200, 0); g.quadraticCurveTo(0, 40, 200, 0); g.stroke();
  },
  'cameo:stairs': (g) => {
    // the staircase: he bows and goes down; she stands in the middle of the stairs, red as a cherry
    g.beginPath(); g.moveTo(-220, 70);
    for (let k = 0; k < 10; k++) { g.lineTo(-220 + k * 44, 70 - k * 26); g.lineTo(-176 + k * 44, 70 - k * 26); }
    g.lineTo(240, 70); g.fill();
    g.strokeStyle = INK; g.lineWidth = 4;
    g.beginPath(); g.moveTo(-200, -30); g.lineTo(220, -270); g.stroke();
    for (let k = 0; k < 10; k++) { g.lineWidth = 2; g.beginPath(); g.moveTo(-196 + k * 44, -32 - k * 25); g.lineTo(-196 + k * 44, 44 - k * 26); g.stroke(); }
    stand(g, 50, -44 - 6, -1, 'girl', 0.75, (gg) => { gg.fillStyle = '#c4423a'; gg.beginPath(); gg.ellipse(4, -142, 8, 8, 0, 0, Math.PI * 2); gg.globalAlpha = 0.55; gg.fill(); gg.globalAlpha = 1; });
    g.save(); g.translate(-130, 16); g.rotate(-0.3); stand(g, 0, 0, 1, 'man', 0.72); g.restore();
  },
  'cameo:bundle': (g) => {
    // at night with her parcel on the stairs, a line of light under his door
    g.beginPath(); g.moveTo(-220, 70);
    for (let k = 0; k < 10; k++) { g.lineTo(-220 + k * 44, 70 - k * 26); g.lineTo(-176 + k * 44, 70 - k * 26); }
    g.lineTo(240, 70); g.fill();
    g.fillRect(120, -320, 90, 140);
    g.fillStyle = '#ffd48a'; g.fillRect(122, -184, 86, 4); g.fillStyle = INK;
    stand(g, 0, -116, 1, 'girl', 0.78, (gg) => { gg.beginPath(); gg.ellipse(22, -76, 18, 13, 0.3, 0, Math.PI * 2); gg.fill(); gg.fillRect(14, -98, 4, 22); });
    g.fillStyle = '#ffcf7a'; g.beginPath(); g.arc(-60, -40, 3, 0, Math.PI * 2); g.fill();
  },
  'cameo:promise': (g) => {
    // a year ago, at ten o'clock, on this seat by this railing
    g.fillRect(-220, 10, 440, 60);
    g.fillRect(-220, -10, 440, 4); g.fillRect(-220, 6, 440, 3);
    for (let x = -220; x < 220; x += 26) g.fillRect(x, -10, 3, 20);
    g.fillRect(-90, -50, 180, 7); g.fillRect(-80, -43, 6, 50); g.fillRect(74, -43, 6, 50);
    seated(g, -36, 1, { scale: 0.5 });
    g.save(); g.translate(36, 0); g.scale(-0.5, 0.5);
    g.fillRect(-34, -60, 8, 120);
    g.beginPath(); g.moveTo(-18, -40); g.quadraticCurveTo(-22, -90, -6, -104); g.lineTo(8, -104); g.quadraticCurveTo(10, -70, 4, -40); g.fill();
    g.beginPath(); g.ellipse(2, -122, 14, 16, 0, 0, Math.PI * 2); g.fill();
    g.fillRect(-14, -150, 30, 26); g.fillRect(-22, -128, 46, 5);
    g.lineWidth = 12; g.beginPath(); g.moveTo(-2, -40); g.lineTo(30, -36); g.lineTo(30, 0); g.stroke();
    g.restore();
    g.fillRect(150, -200, 5, 210);
    g.fillStyle = '#ffd48a'; g.beginPath(); g.arc(152, -206, 9, 0, Math.PI * 2); g.fill();
    g.fillStyle = INK;
  },
};
