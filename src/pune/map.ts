import { RC, type City } from './data';
import type { Route } from './routing';

/**
 * The map: a raster of the whole city painted once (water, green, the
 * footprint of every building), with the roads drawn as vectors on top so the
 * minimap stays sharp at any zoom.
 */

export interface Blip { x: number; z: number; kind: 'mission' | 'target' | 'police' | 'waypoint' | 'shop' | 'garage' | 'patya' | 'food' | 'player' | 'car' | 'home'; label?: string; color?: string }

const M_PER_PX = 4;

const ROAD_STYLE: Record<number, [string, number]> = {
  [RC.motorway]: ['#f2b84b', 2.2], [RC.trunk]: ['#f2b84b', 2.0], [RC.primary]: ['#f5d27a', 1.6], [RC.secondary]: ['#e8e2cf', 1.35],
  [RC.tertiary]: ['#d9d4c4', 1.1], [RC.residential]: ['#b9b5a8', 0.8], [RC.living]: ['#b9b5a8', 0.7], [RC.unclassified]: ['#b9b5a8', 0.8],
  [RC.unknown]: ['#a9a598', 0.7], [RC.service]: ['#8f8b80', 0.5], [RC.track]: ['#8a7d66', 0.5],
};

export class MapView {
  raster: HTMLCanvasElement;
  W: number; H: number; hx: number; hz: number;
  constructor(public city: City) {
    [this.hx, this.hz] = city.meta.half;
    this.W = Math.ceil((2 * this.hx) / M_PER_PX); this.H = Math.ceil((2 * this.hz) / M_PER_PX);
    this.raster = document.createElement('canvas');
    this.raster.width = this.W; this.raster.height = this.H;
    this.paint();
  }
  private px(x: number) { return (x + this.hx) / M_PER_PX; }
  private pz(z: number) { return (z + this.hz) / M_PER_PX; }

  private paint() {
    const g = this.raster.getContext('2d')!;
    g.fillStyle = '#20262b'; g.fillRect(0, 0, this.W, this.H);
    // ground (land use) from the baked texture, dimmed and cooled
    g.globalAlpha = 0.35; g.drawImage(this.city.ground, 0, 0, this.W, this.H); g.globalAlpha = 1;
    g.fillStyle = 'rgba(25,32,38,0.55)'; g.fillRect(0, 0, this.W, this.H);
    // water
    g.fillStyle = '#3d6f8e';
    const poly = (flat: number[], holes: number[][]) => {
      g.beginPath();
      for (const r of [flat, ...holes]) { for (let i = 0; i < r.length; i += 2) { const x = this.px(r[i] / 2), y = this.pz(r[i + 1] / 2); if (i) g.lineTo(x, y); else g.moveTo(x, y); } g.closePath(); }
      g.fill('evenodd');
    };
    for (const [o, h] of this.city.water.rivers) poly(o, h);
    for (const p of this.city.water.ponds) for (const [o, h] of p.rings) poly(o, h);
    // buildings
    g.fillStyle = '#3a4148';
    for (const b of this.city.buildings.list) {
      const r = b.ring;
      g.beginPath();
      for (let i = 0; i < r.length; i += 2) { const x = this.px(r[i]), y = this.pz(r[i + 1]); if (i) g.lineTo(x, y); else g.moveTo(x, y); }
      g.closePath(); g.fill();
    }
    // the small roads go into the raster; the big ones are drawn live
    g.lineCap = 'round'; g.lineJoin = 'round';
    for (const p of this.city.roads.pieces) {
      if (p.cls < RC.residential || p.cls > RC.track) continue;
      const st = ROAD_STYLE[p.cls]; if (!st) continue;
      g.strokeStyle = st[0]; g.lineWidth = Math.max(0.8, p.w / M_PER_PX);
      g.beginPath();
      for (let k = 0; k < p.n; k++) { const x = this.px(p.x[k]), y = this.pz(p.z[k]); if (k) g.lineTo(x, y); else g.moveTo(x, y); }
      g.stroke();
    }
    for (const p of this.city.roads.pieces) {
      if (p.cls !== RC.rail && p.cls !== RC.metro) continue;
      g.strokeStyle = p.cls === RC.metro ? (p.pf.some((f) => f & 2) ? 'rgba(160,90,200,0.4)' : '#a865c9') : '#6b6b6b';
      g.lineWidth = p.cls === RC.metro ? 2 : 1.2;
      g.setLineDash(p.cls === RC.rail ? [3, 2] : []);
      g.beginPath();
      for (let k = 0; k < p.n; k++) { const x = this.px(p.x[k]), y = this.pz(p.z[k]); if (k) g.lineTo(x, y); else g.moveTo(x, y); }
      g.stroke();
    }
    g.setLineDash([]);
  }

  private bigRoads(g: CanvasRenderingContext2D, x0: number, z0: number, x1: number, z1: number, scale: number, minW: number) {
    g.lineCap = 'round'; g.lineJoin = 'round';
    const cand = new Set(this.city.roads.grid.query((x0 + x1) / 2, (z0 + z1) / 2, Math.max(x1 - x0, z1 - z0) / 2 + 60));
    const order = [RC.tertiary, RC.secondary, RC.primary, RC.trunk, RC.motorway];
    for (const cls of order) {
      const st = ROAD_STYLE[cls];
      g.strokeStyle = st[0];
      g.beginPath();
      for (const p of cand) {
        if (p.cls !== cls) continue;
        for (let k = 0; k < p.n; k++) { const X = p.x[k], Z = p.z[k]; if (k) g.lineTo(X, Z); else g.moveTo(X, Z); }
      }
      g.lineWidth = (minW * st[1]) / Math.max(1e-6, scale);
      g.stroke();
    }
  }

  /** The rotating minimap. yaw: camera heading (0 = looking toward +z). */
  drawMini(g: CanvasRenderingContext2D, w: number, h: number, px: number, pz: number, yaw: number, mPerPx: number, route: Route | null, blips: Blip[], dpr: number) {
    g.save();
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, h);
    g.beginPath(); g.arc(w / 2, h / 2, w / 2 - 1, 0, Math.PI * 2); g.clip();
    g.fillStyle = '#20262b'; g.fillRect(0, 0, w, h);
    const s = 1 / mPerPx;
    g.translate(w / 2, h / 2 + h * 0.12);
    // world → screen: rotate so that the camera's forward is up
    g.rotate(Math.PI + yaw);
    g.scale(s, s);
    g.translate(-px, -pz);
    g.imageSmoothingEnabled = true;
    const R = (Math.max(w, h) * mPerPx);
    const sx = (px - R + this.hx) / M_PER_PX, sz = (pz - R + this.hz) / M_PER_PX, sw = (2 * R) / M_PER_PX;
    g.drawImage(this.raster, sx, sz, sw, sw, px - R, pz - R, 2 * R, 2 * R);
    this.bigRoads(g, px - R, pz - R, px + R, pz + R, s, 2.2);
    if (route) this.drawRoute(g, route, s, 4);
    for (const b of blips) {
      const d = Math.hypot(b.x - px, b.z - pz);
      let bx = b.x, bz = b.z;
      const lim = (Math.min(w, h) / 2 - 10) * mPerPx;
      if (d > lim && (b.kind === 'mission' || b.kind === 'target' || b.kind === 'waypoint' || b.kind === 'home')) { bx = px + ((b.x - px) / d) * lim; bz = pz + ((b.z - pz) / d) * lim; }
      else if (d > lim * 1.1) continue;
      this.blip(g, bx, bz, b, mPerPx, -(Math.PI + yaw));
    }
    g.restore();
    // the player arrow and north
    g.save();
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.translate(w / 2, h / 2 + h * 0.12);
    g.fillStyle = '#fff'; g.strokeStyle = '#111'; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(0, -8); g.lineTo(6, 6); g.lineTo(0, 3); g.lineTo(-6, 6); g.closePath(); g.fill(); g.stroke();
    g.restore();
    g.save();
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const na = Math.PI + yaw; // direction of north (−z) on screen
    const nx = w / 2 + Math.sin(na) * (w / 2 - 11);
    const ny = h / 2 - Math.cos(na) * (w / 2 - 11);
    g.fillStyle = '#c1121f'; g.beginPath(); g.arc(nx, ny, 8, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#fff'; g.font = '700 10px "IBM Plex Mono", monospace'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('N', nx, ny + 0.5);
    g.restore();
  }

  private drawRoute(g: CanvasRenderingContext2D, r: Route, s: number, px: number) {
    g.strokeStyle = '#b64cff'; g.lineWidth = px / s; g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath();
    for (let i = 0; i < r.pts.length; i += 2) { if (i) g.lineTo(r.pts[i], r.pts[i + 1]); else g.moveTo(r.pts[i], r.pts[i + 1]); }
    g.stroke();
  }

  private blip(g: CanvasRenderingContext2D, x: number, z: number, b: Blip, mPerPx: number, unrotate: number) {
    const r = 7 * mPerPx;
    g.save(); g.translate(x, z); g.rotate(unrotate); g.scale(mPerPx, mPerPx);
    const col = b.color ?? { mission: '#ffd23f', target: '#ff3b3b', police: '#3b7bff', waypoint: '#b64cff', shop: '#3ddc97', garage: '#ff9f1c', patya: '#ffffff', food: '#ff7b00', player: '#fff', car: '#9ad1ff', home: '#ffd23f' }[b.kind];
    g.fillStyle = col; g.strokeStyle = '#111'; g.lineWidth = 1.5;
    if (b.kind === 'police') { g.beginPath(); g.arc(0, 0, 4.5, 0, Math.PI * 2); g.fill(); g.stroke(); }
    else if (b.kind === 'patya') { g.fillRect(-4, -3, 8, 6); g.strokeRect(-4, -3, 8, 6); }
    else {
      g.beginPath(); g.arc(0, 0, 7, 0, Math.PI * 2); g.fill(); g.stroke();
      g.fillStyle = '#111'; g.font = '700 9px "IBM Plex Mono", monospace'; g.textAlign = 'center'; g.textBaseline = 'middle';
      const ch = { mission: '!', target: '×', waypoint: '◆', shop: '₹', garage: '⚙', food: 'V', home: 'H', car: 'c', player: '', police: '', patya: '' }[b.kind] ?? '';
      g.fillText(ch, 0, 0.5);
    }
    g.restore();
    void r;
  }

  /** The full-screen map: north up, pan and zoom. */
  drawBig(g: CanvasRenderingContext2D, w: number, h: number, cx: number, cz: number, mPerPx: number, route: Route | null, blips: Blip[], player: { x: number; z: number; yaw: number }, dpr: number) {
    g.save();
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = '#161b1f'; g.fillRect(0, 0, w, h);
    const s = 1 / mPerPx;
    g.translate(w / 2, h / 2); g.scale(s, s); g.translate(-cx, -cz);
    g.imageSmoothingEnabled = mPerPx > 2;
    g.drawImage(this.raster, -this.hx, -this.hz, 2 * this.hx, 2 * this.hz);
    const x0 = cx - (w / 2) * mPerPx, x1 = cx + (w / 2) * mPerPx, z0 = cz - (h / 2) * mPerPx, z1 = cz + (h / 2) * mPerPx;
    if (mPerPx < 9) this.bigRoads(g, x0, z0, x1, z1, s, 1.6);
    else {
      // zoomed out: just the arterials, straight from the data
      g.lineCap = 'round';
      for (const p of this.city.roads.pieces) {
        if (p.cls > RC.secondary) continue;
        g.strokeStyle = ROAD_STYLE[p.cls]?.[0] ?? '#ccc'; g.lineWidth = (p.cls <= RC.primary ? 2.4 : 1.6) * mPerPx;
        g.beginPath(); for (let k = 0; k < p.n; k++) { if (k) g.lineTo(p.x[k], p.z[k]); else g.moveTo(p.x[k], p.z[k]); } g.stroke();
      }
    }
    if (route) this.drawRoute(g, route, s, 4);
    // place names
    g.textAlign = 'center'; g.textBaseline = 'middle';
    const fs = 12 * mPerPx;
    g.font = `600 ${fs}px "Fraunces", Georgia, serif`;
    for (const hd of this.city.meta.hoods) {
      if (hd.k === 'neighborhood' && mPerPx > 3) continue;
      if (hd.x < x0 || hd.x > x1 || hd.z < z0 || hd.z > z1) continue;
      g.fillStyle = 'rgba(255,255,255,0.55)'; g.fillText(hd.name.toUpperCase(), hd.x, hd.z);
    }
    g.font = `600 ${fs * 0.85}px "IBM Plex Mono", monospace`;
    for (const l of this.city.meta.landmarks) {
      if (l.x < x0 || l.x > x1 || l.z < z0 || l.z > z1) continue;
      g.fillStyle = '#ffd23f'; g.beginPath(); g.arc(l.x, l.z, 3.5 * mPerPx, 0, Math.PI * 2); g.fill();
      if (mPerPx < 6) { g.fillStyle = 'rgba(255,230,160,0.95)'; g.fillText(l.name, l.x, l.z - 11 * mPerPx); }
    }
    for (const b of blips) this.blip(g, b.x, b.z, b, mPerPx * 1.2, 0);
    // player
    g.save(); g.translate(player.x, player.z); g.rotate(-player.yaw + Math.PI); g.scale(mPerPx * 1.3, mPerPx * 1.3);
    g.fillStyle = '#fff'; g.strokeStyle = '#111'; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(0, -9); g.lineTo(7, 7); g.lineTo(0, 3); g.lineTo(-7, 7); g.closePath(); g.fill(); g.stroke();
    g.restore();
    g.restore();
  }
}
