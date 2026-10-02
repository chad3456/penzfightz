import type { MosaicData } from './build';
import { H, PALETTE, SILVER, W } from './scene';

/**
 * Draws tesserae. Each tile is a cached Path2D; stone and glass tiles are
 * baked into a 2 px/unit bed canvas as they are laid, gold and silver are
 * redrawn every frame because their colour depends on where the light is.
 */

export const BS = 2; // bed canvas px per unit
const LX = -0.6, LY = -0.8; // fixed key light for bevels, from the upper left

function hexRgb(h: string) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }
const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));

export type Light = { x: number; y: number; h: number };

export class Tiles {
  d: MosaicData;
  path: Path2D[] = [];
  hi: Path2D[] = [];
  lo: Path2D[] = [];
  fill: string[] = [];
  lite: string[] = [];
  dark: string[] = [];
  size: number[] = [];
  grain: CanvasPattern | null = null;
  speck: [number, number, number, string][] = [];
  bed: HTMLCanvasElement;
  bctx: CanvasRenderingContext2D;
  metals: number[] = [];

  constructor(d: MosaicData) {
    this.d = d;
    for (let i = 0; i < d.n; i++) {
      const s = d.start[i], e = d.start[i + 1];
      const p = new Path2D(), hi = new Path2D(), lo = new Path2D();
      const cx = d.cx[i], cy = d.cy[i];
      for (let v = s; v < e; v++) {
        const x = d.verts[v * 2], y = d.verts[v * 2 + 1];
        if (v === s) p.moveTo(x, y); else p.lineTo(x, y);
        const w = v + 1 < e ? v + 1 : s;
        const x2 = d.verts[w * 2], y2 = d.verts[w * 2 + 1];
        let nx = y2 - y, ny = -(x2 - x);
        const L = Math.hypot(nx, ny) || 1;
        nx /= L; ny /= L;
        const mx = (x + x2) / 2, my = (y + y2) / 2;
        if ((mx - cx) * nx + (my - cy) * ny < 0) { nx = -nx; ny = -ny; }
        const dot = nx * LX + ny * LY;
        const ix = (px: number, py: number) => [px + (cx - px) * 0.08, py + (cy - py) * 0.08];
        const [ax, ay] = ix(x, y), [bx, by] = ix(x2, y2);
        if (dot > 0.25) { hi.moveTo(ax, ay); hi.lineTo(bx, by); } else if (dot < -0.25) { lo.moveTo(ax, ay); lo.lineTo(bx, by); }
      }
      p.closePath();
      this.path.push(p); this.hi.push(hi); this.lo.push(lo);
      let a2 = 0;
      for (let v = s; v < e; v++) { const w = v + 1 < e ? v + 1 : s; a2 += d.verts[v * 2] * d.verts[w * 2 + 1] - d.verts[w * 2] * d.verts[v * 2 + 1]; }
      this.size.push(Math.sqrt(Math.abs(a2) / 2) / 2);
      if (d.metal[i]) { this.fill.push(''); this.lite.push(''); this.dark.push(''); this.metals.push(i); }
      else {
        const [r, g, b] = hexRgb(PALETTE[d.col[i]].hex), k = 1 + d.shade[i];
        const rgb = (m: number, add: number) => `rgb(${clamp(r * m + add)},${clamp(g * m + add)},${clamp(b * m + add)})`;
        this.fill.push(rgb(k, 0)); this.lite.push(rgb(k * 1.06, 16)); this.dark.push(rgb(k * 0.84, 0));
      }
      const a = (i * 2654435761) % 1000 / 1000, b2 = (i * 40503) % 997 / 997;
      this.speck.push([cx + (a - 0.5) * 4, cy + (b2 - 0.5) * 4, 0.35 + a * 0.4, a > 0.5 ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.22)']);
    }
    this.bed = document.createElement('canvas');
    this.bed.width = W * BS; this.bed.height = H * BS;
    this.bctx = this.bed.getContext('2d')!;
    this.resetBed();
  }

  /** Mortar, its grain, and the red-ochre sinopia. */
  resetBed() {
    const c = this.bctx, d = this.d;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.fillStyle = '#b4aa99';
    c.fillRect(0, 0, this.bed.width, this.bed.height);
    const n = document.createElement('canvas');
    n.width = n.height = 160;
    const nc = n.getContext('2d')!;
    const img = nc.createImageData(160, 160);
    let seed = 99;
    for (let i = 0; i < img.data.length; i += 4) {
      seed = (seed * 16807) % 2147483647;
      const v = seed % 255;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = v > 200 || v < 40 ? 60 : 18;
    }
    nc.putImageData(img, 0, 0);
    const coarse = c.createPattern(n, 'repeat')!;
    coarse.setTransform(new DOMMatrix().scale(3.2));
    c.globalAlpha = 0.7; c.fillStyle = coarse; c.fillRect(0, 0, this.bed.width, this.bed.height);
    c.globalAlpha = 0.45; c.fillStyle = c.createPattern(n, 'repeat')!; c.fillRect(0, 0, this.bed.width, this.bed.height);
    c.globalAlpha = 1;
    if (!this.grain) {
      const gcv = document.createElement('canvas'); gcv.width = gcv.height = 96;
      const gc = gcv.getContext('2d')!, gi = gc.createImageData(96, 96);
      let sd = 7;
      for (let i = 0; i < gi.data.length; i += 4) { sd = (sd * 16807) % 2147483647; const v = sd % 2 ? 255 : 0; gi.data[i] = gi.data[i + 1] = gi.data[i + 2] = v; gi.data[i + 3] = (sd >> 3) % 34; }
      gc.putImageData(gi, 0, 0);
      this.grain = c.createPattern(gcv, 'repeat');
      this.grain?.setTransform(new DOMMatrix().scale(0.06));
    }
    const s = document.createElement('canvas');
    s.width = d.sw; s.height = d.sh;
    const sc = s.getContext('2d')!;
    const si = sc.createImageData(d.sw, d.sh);
    for (let i = 0; i < d.sinopia.length; i++) { si.data[i * 4] = 150; si.data[i * 4 + 1] = 66; si.data[i * 4 + 2] = 38; si.data[i * 4 + 3] = d.sinopia[i] * 0.55; }
    sc.putImageData(si, 0, 0);
    c.imageSmoothingEnabled = true;
    c.drawImage(s, 0, 0, this.bed.width, this.bed.height);
  }

  /** A stone or glass tile, in panel units on a context already scaled. */
  drawStone(c: CanvasRenderingContext2D, i: number, detail: boolean, grain = false) {
    const p = this.path[i], d = this.d, cx = d.cx[i], cy = d.cy[i], r = this.size[i];
    c.fillStyle = 'rgba(30,22,14,0.3)';
    c.save(); c.translate(0.4, 0.55); c.fill(p); c.restore();
    const g = c.createLinearGradient(cx + LX * r, cy + LY * r, cx - LX * r, cy - LY * r);
    g.addColorStop(0, this.lite[i]); g.addColorStop(0.45, this.fill[i]); g.addColorStop(1, this.dark[i]);
    c.fillStyle = g;
    c.fill(p);
    c.lineWidth = 0.45;
    c.strokeStyle = 'rgba(255,255,255,0.14)'; c.stroke(this.hi[i]);
    c.strokeStyle = 'rgba(0,0,0,0.16)'; c.stroke(this.lo[i]);
    const mat = PALETTE[d.col[i]].mat;
    if (mat === 'smalti') {
      const h = c.createRadialGradient(cx + LX * r * 0.45, cy + LY * r * 0.45, 0, cx + LX * r * 0.45, cy + LY * r * 0.45, r * 0.7);
      h.addColorStop(0, 'rgba(255,255,255,0.28)'); h.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = h; c.fill(p);
    } else if (detail) {
      const [x, y, rr, col] = this.speck[i];
      c.fillStyle = col; c.beginPath(); c.arc(x, y, rr * 0.5, 0, Math.PI * 2); c.fill();
    }
    if (grain && this.grain) { c.save(); c.clip(p); c.fillStyle = this.grain; c.fill(p); c.restore(); }
  }

  metalColor(i: number, L: Light, bias = 0) {
    const d = this.d;
    let nx = d.tilt[i * 2], ny = d.tilt[i * 2 + 1], nz = 1;
    const nl = Math.hypot(nx, ny, nz); nx /= nl; ny /= nl; nz /= nl;
    let lx = L.x - d.cx[i], ly = L.y - d.cy[i], lz = L.h;
    const ll = Math.hypot(lx, ly, lz); lx /= ll; ly /= ll; lz /= ll;
    let hx = lx, hy = ly, hz = lz + 1;
    const hl = Math.hypot(hx, hy, hz); hx /= hl; hy /= hl; hz /= hl;
    const spec = Math.pow(Math.max(0, nx * hx + ny * hy + nz * hz), 90);
    const diff = Math.max(0, nx * lx + ny * ly + nz * lz);
    const I = 0.4 + 0.45 * diff * diff + 1.9 * spec + d.shade[i] + bias;
    const silver = d.metal[i] === SILVER;
    const dark = silver ? [86, 88, 92] : [96, 64, 20], mid = silver ? [196, 198, 200] : [214, 164, 56], hot = silver ? [250, 252, 255] : [255, 238, 176];
    let r: number, g: number, b: number;
    if (I < 1) { r = dark[0] + (mid[0] - dark[0]) * I; g = dark[1] + (mid[1] - dark[1]) * I; b = dark[2] + (mid[2] - dark[2]) * I; }
    else { const t = Math.min(1, I - 1); r = mid[0] + (hot[0] - mid[0]) * t; g = mid[1] + (hot[1] - mid[1]) * t; b = mid[2] + (hot[2] - mid[2]) * t; }
    return `rgb(${r | 0},${g | 0},${b | 0})`;
  }

  drawMetal(c: CanvasRenderingContext2D, i: number, L: Light) {
    const p = this.path[i], d = this.d, cx = d.cx[i], cy = d.cy[i], r = this.size[i];
    c.fillStyle = 'rgba(30,22,14,0.32)';
    c.save(); c.translate(0.4, 0.55); c.fill(p); c.restore();
    let lx = L.x - cx, ly = L.y - cy;
    const ll = Math.hypot(lx, ly) || 1; lx /= ll; ly /= ll;
    const g = c.createLinearGradient(cx - lx * r, cy - ly * r, cx + lx * r, cy + ly * r);
    g.addColorStop(0, this.metalColor(i, L, -0.22)); g.addColorStop(0.55, this.metalColor(i, L)); g.addColorStop(1, this.metalColor(i, L, 0.3));
    c.fillStyle = g;
    c.fill(p);
    c.lineWidth = 0.45;
    c.strokeStyle = 'rgba(255,250,220,0.3)'; c.stroke(this.hi[i]);
    c.strokeStyle = 'rgba(40,24,0,0.3)'; c.stroke(this.lo[i]);
  }

  bake(i: number) {
    if (this.d.metal[i]) {
      // the bed under gold: dark setting so the metal layer sits on something
      this.bctx.setTransform(BS, 0, 0, BS, 0, 0);
      this.bctx.fillStyle = 'rgba(40,28,10,0.5)';
      this.bctx.fill(this.path[i]);
      return;
    }
    this.bctx.setTransform(BS, 0, 0, BS, 0, 0);
    this.drawStone(this.bctx, i, true);
  }
}
