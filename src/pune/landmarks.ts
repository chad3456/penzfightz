import * as THREE from 'three';
import { Buf, box, cyl, type Exclusion, type Materials } from './city';
import { DRIVABLE, type Building, type City, type Landmark } from './data';

/**
 * Pune's landmarks, modelled by hand and set down where the map says they
 * are, turned the way their real footprints are turned. They are simplified,
 * original models: proportions and silhouettes from public descriptions,
 * not copies of anyone's 3D assets.
 */

type C3 = [number, number, number];
const STONE: C3 = [0.5, 0.43, 0.37], BRICK: C3 = [0.6, 0.42, 0.32], BASALT: C3 = [0.36, 0.34, 0.33], CREAM: C3 = [0.92, 0.88, 0.78];
const WHITE: C3 = [0.95, 0.94, 0.9], GOLD: C3 = [0.9, 0.7, 0.32], SAFFRON: C3 = [0.95, 0.5, 0.12], DARK: C3 = [0.12, 0.1, 0.09], LAWN: C3 = [0.36, 0.5, 0.24];

export interface Built { group: THREE.Group; excl: Exclusion[]; colliders: Building[]; lights: THREE.Vector3[] }

/** Local frame for a landmark: origin at its centre, x along its first edge. */
class Frame {
  cs: number; sn: number;
  constructor(public x: number, public z: number, public y: number, public rot: number) { this.cs = Math.cos(rot); this.sn = Math.sin(rot); }
  p(lx: number, lz: number) { return [this.x + lx * this.cs - lz * this.sn, this.z + lx * this.sn + lz * this.cs] as const; }
  box(b: Buf, lx: number, y: number, lz: number, sx: number, sy: number, sz: number, c: C3, r = 0) {
    const [x, z] = this.p(lx, lz); box(b, x, this.y + y + sy / 2, z, sx, sy, sz, c, this.rot + r);
  }
  cyl(b: Buf, lx: number, y: number, lz: number, r: number, h: number, c: C3, seg = 8) {
    const [x, z] = this.p(lx, lz); cyl(b, x, this.y + y, z, r, h, c, seg);
  }
  ring(lx: number, lz: number, sx: number, sz: number) {
    const out = new Float32Array(8);
    const cs = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
    cs.forEach(([a, c], i) => { const [x, z] = this.p(lx + (a * sx) / 2, lz + (c * sz) / 2); out[i * 2] = x; out[i * 2 + 1] = z; });
    return out;
  }
}

function collider(f: Frame, lx: number, lz: number, sx: number, sz: number, h: number, list: Building[]) {
  const ring = f.ring(lx, lz, sx, sz);
  let cx = 0, cz = 0;
  for (let i = 0; i < 4; i++) { cx += ring[i * 2]; cz += ring[i * 2 + 1]; }
  list.push({ i: -1, ring, t: 0, h, front: 255, cx: cx / 4, cz: cz / 4, r: Math.hypot(sx, sz) / 2, base: f.y - 1 });
}

/** Which local direction (±x, ±z) faces the nearest drivable street, or north. */
function facing(city: City, f: Frame, prefer?: 'north'): [number, number] {
  let tx = 0, tz = -1;
  if (prefer !== 'north') {
    const h = city.roads.nearest(f.x, f.z, 120, (p) => DRIVABLE(p.cls) && p.cls <= 5);
    if (h) { tx = h.x - f.x; tz = h.z - f.z; }
  }
  // world → local
  const lx = tx * f.cs + tz * f.sn, lz = -tx * f.sn + tz * f.cs;
  return Math.abs(lx) > Math.abs(lz) ? [Math.sign(lx), 0] : [0, Math.sign(lz)];
}

/** A Maratha-style shikhara: stacked, tapering tiers and a kalash on top. */
function shikhara(b: Buf, f: Frame, lx: number, y: number, lz: number, base: number, height: number, c: C3, top: C3 = GOLD) {
  const tiers = Math.max(4, Math.round(height / 1.6));
  for (let i = 0; i < tiers; i++) {
    const t = i / tiers;
    const w = base * (1 - t * 0.82);
    const h = height / tiers;
    f.box(b, lx, y + i * h, lz, w, h * 0.92, w, c, Math.PI / 4 * (i % 2) * 0.0);
    // little ribs make it read as a temple spire, not a stepped pyramid
    if (i % 2 === 0) { f.box(b, lx, y + i * h + h * 0.3, lz, w * 1.08, h * 0.25, w * 0.4, c); f.box(b, lx, y + i * h + h * 0.3, lz, w * 0.4, h * 0.25, w * 1.08, c); }
  }
  f.cyl(b, lx, y + height, lz, base * 0.14, base * 0.12, top, 8);
  f.cyl(b, lx, y + height + base * 0.12, lz, base * 0.06, base * 0.22, top, 6);
  // the saffron flag
  f.box(b, lx, y + height + base * 0.3, lz, 0.05, base * 0.5, 0.05, DARK);
  f.box(b, lx + base * 0.18, y + height + base * 0.65, lz, base * 0.35, base * 0.18, 0.04, SAFFRON);
}

function temple(b: Buf, f: Frame, size: number, wall: C3, spire: C3, front: [number, number]) {
  f.box(b, 0, -0.5, 0, size * 1.3, 1.4, size * 1.3, STONE);
  f.box(b, 0, 0.9, 0, size, size * 0.55, size, wall);
  // a mandap (porch) toward the street
  const [fx, fz] = front;
  f.box(b, fx * size * 0.75, 0.9, fz * size * 0.75, fx ? size * 0.5 : size * 0.7, size * 0.38, fz ? size * 0.5 : size * 0.7, wall);
  f.box(b, fx * size * 0.75, 0.9 + size * 0.38, fz * size * 0.75, fx ? size * 0.6 : size * 0.8, 0.3, fz ? size * 0.6 : size * 0.8, spire);
  shikhara(b, f, 0, 0.9 + size * 0.55, 0, size * 0.85, size * 1.5, spire);
}

export function buildLandmarks(city: City, mats: Materials): Built {
  const group = new THREE.Group();
  const excl: Exclusion[] = [];
  const colliders: Building[] = [];
  const lights: THREE.Vector3[] = [];
  const b = new Buf(), glow = new Buf();
  const L = new Map(city.meta.landmarks.map((l) => [l.key, l]));
  const T = city.terrain;
  const frame = (l: Landmark, rot?: number) => new Frame(l.x, l.z, T.height(l.x, l.z), rot ?? l.rot ?? 0);

  // ---------------- Shaniwar Wada
  const sw = L.get('shaniwarwada');
  if (sw) {
    const f = frame(sw);
    const W = (sw.w ?? 170) - 4, D = (sw.d ?? 155) - 4, H = 11, th = 3.2;
    // which local side faces north: the Delhi Darwaza is there
    const [gx, gz] = facing(city, f, 'north');
    const sides: { cx: number; cz: number; len: number; alongX: boolean; nx: number; nz: number }[] = [
      { cx: 0, cz: -D / 2, len: W, alongX: true, nx: 0, nz: -1 }, { cx: 0, cz: D / 2, len: W, alongX: true, nx: 0, nz: 1 },
      { cx: -W / 2, cz: 0, len: D, alongX: false, nx: -1, nz: 0 }, { cx: W / 2, cz: 0, len: D, alongX: false, nx: 1, nz: 0 },
    ];
    for (const s of sides) {
      const gate = s.nx === gx && s.nz === gz;
      const segs = gate ? [[-s.len / 2, -11], [11, s.len / 2]] : [[-s.len / 2, s.len / 2]];
      for (const [a, c] of segs) {
        const mid = (a + c) / 2, len = c - a;
        const lx = s.alongX ? mid : s.cx, lz = s.alongX ? s.cz : mid;
        const sx = s.alongX ? len : th, sz = s.alongX ? th : len;
        f.box(b, lx, -1, lz, sx, 5, sz, STONE);
        f.box(b, lx, 4, lz, sx, H - 4, sz, BRICK);
        collider(f, lx, lz, sx, sz, H, colliders);
        // merlons
        for (let t = a + 1.2; t < c - 0.6; t += 2.4) {
          const mx = s.alongX ? t : s.cx + s.nx * th * 0.35, mz = s.alongX ? s.cz + s.nz * th * 0.35 : t;
          f.box(b, mx, H, mz, s.alongX ? 1.2 : 0.8, 1.1, s.alongX ? 0.8 : 1.2, BRICK);
        }
      }
      if (gate) {
        // the Delhi Darwaza: a tall gatehouse, studded doors, a pavilion above
        const gxp = s.alongX ? 0 : s.cx, gzp = s.alongX ? s.cz : 0;
        const ox = s.nx * 1.5, oz = s.nz * 1.5;
        // two piers and a lintel, with a passage tall enough for an elephant and its howdah
        for (const sg of [-1, 1]) {
          const px = gxp + (s.alongX ? sg * 7 : 0), pz = gzp + (s.alongX ? 0 : sg * 7);
          f.box(b, px, -1, pz, s.alongX ? 8 : 9, 20, s.alongX ? 9 : 8, BRICK);
          f.box(b, px, -1, pz, s.alongX ? 8.4 : 9.4, 6, s.alongX ? 9.4 : 8.4, STONE);
          collider(f, px, pz, s.alongX ? 8 : 9, s.alongX ? 9 : 8, 20, colliders);
          // the doors stand open against the passage walls, spikes outward
          const dx = gxp + (s.alongX ? sg * 2.8 : ox * 1.6), dz = gzp + (s.alongX ? oz * 1.6 : sg * 2.8);
          f.box(b, dx, 0, dz, s.alongX ? 0.4 : 5.5, 10, s.alongX ? 5.5 : 0.4, [0.3, 0.2, 0.12]);
          for (let r = 0; r < 6; r++) for (let q = 0; q < 4; q++) {
            const along = -2 + q * 1.3;
            f.box(b, dx + (s.alongX ? -sg * 0.3 : along), 1.5 + r * 1.4, dz + (s.alongX ? along : -sg * 0.3), 0.25, 0.25, 0.25, [0.72, 0.7, 0.64]);
          }
        }
        f.box(b, gxp, 10, gzp, s.alongX ? 22 : 9, 9, s.alongX ? 9 : 22, BRICK);
        f.box(b, gxp + ox * 3.05, 8.5, gzp + oz * 3.05, s.alongX ? 7 : 0.4, 1.5, s.alongX ? 0.4 : 7, STONE);
        f.box(b, gxp, 19, gzp, s.alongX ? 12 : 6, 4, s.alongX ? 6 : 12, CREAM);
        f.box(b, gxp, 23, gzp, s.alongX ? 13 : 7, 0.6, s.alongX ? 7 : 13, BRICK);
        // gate bastions
        for (const sg of [-1, 1]) {
          const bx = s.alongX ? sg * 15 : s.cx, bz = s.alongX ? s.cz : sg * 15;
          f.cyl(b, bx, -1, bz, 6.5, 18, BRICK, 10);
          f.cyl(b, bx, -1, bz, 6.8, 6, STONE, 10);
          const [wx, wz] = f.p(bx, bz); lights.push(new THREE.Vector3(wx, f.y + 18.5, wz));
        }
      }
    }
    // corner bastions and the mid-wall ones (nine in all)
    const bast: [number, number][] = [[-W / 2, -D / 2], [W / 2, -D / 2], [W / 2, D / 2], [-W / 2, D / 2]];
    for (const s of sides) if (!(s.nx === gx && s.nz === gz)) bast.push([s.alongX ? 0 : s.cx, s.alongX ? s.cz : 0]);
    for (const [bx, bz] of bast) {
      f.cyl(b, bx, -1, bz, 7.5, 15, BRICK, 10);
      f.cyl(b, bx, -1, bz, 7.8, 6, STONE, 10);
      for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; f.box(b, bx + Math.cos(a) * 7, 15, bz + Math.sin(a) * 7, 1.2, 1.1, 1.2, BRICK); }
      const [x, z] = f.p(bx, bz);
      colliders.push({ i: -1, ring: circleRing(x, z, 7.6), t: 0, h: 15, front: 255, cx: x, cz: z, r: 7.6, base: f.y - 1 });
    }
    // inside: lawns, the plinths of the burnt palace, and the lotus fountain
    f.box(b, 0, -0.85, 0, W - 8, 1, D - 8, LAWN);
    const plinths: [number, number, number, number][] = [[-30, -20, 40, 26], [25, -18, 34, 30], [-28, 30, 46, 22], [30, 32, 30, 24], [0, 0, 18, 18]];
    for (const [px, pz, sx, sz] of plinths) {
      f.box(b, px, -0.4, pz, sx, 1.0, sz, BASALT);
      f.box(b, px, -0.2, pz, sx - 2, 1.0, sz - 2, [0.5, 0.46, 0.42]);
    }
    for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; f.box(b, Math.cos(a) * 4.5, 0.6, Math.sin(a) * 4.5, 2.4, 0.5, 1.2, [0.85, 0.82, 0.78], -a); }
    f.cyl(b, 0, 0.6, 0, 3.4, 0.5, [0.35, 0.5, 0.55], 16);
    excl.push({ x: sw.x, z: sw.z, r: Math.max(W, D) * 0.55 });
  }

  // ---------------- Dagdusheth Halwai Ganpati
  const dg = L.get('dagdusheth');
  if (dg) {
    const f = frame(dg);
    const fr = facing(city, f);
    f.box(b, 0, -0.6, 0, 19, 1.4, 19, WHITE);
    f.box(b, 0, 0.8, 0, 14, 8, 14, WHITE);
    f.box(b, 0, 8.8, 0, 15, 0.8, 15, GOLD);
    // the open, columned front where the crowd stands
    for (let i = -2; i <= 2; i++) {
      const along = i * 3;
      const lx = fr[0] ? fr[0] * 8.6 : along, lz = fr[1] ? fr[1] * 8.6 : along;
      f.cyl(b, lx, 0.8, lz, 0.45, 7.6, WHITE, 8);
      f.box(b, lx, 7.4, lz, 1.4, 0.6, 1.4, GOLD);
    }
    f.box(b, fr[0] * 6.9, 1.2, fr[1] * 6.9, fr[0] ? 0.4 : 6, 5.5, fr[1] ? 0.4 : 6, [0.95, 0.62, 0.2]);
    shikhara(b, f, 0, 9.6, 0, 10, 14, WHITE, GOLD);
    for (const [a, c] of [[-6, -6], [6, -6], [6, 6], [-6, 6]]) shikhara(b, f, a, 9.6, c, 2.6, 4.4, WHITE, GOLD);
    // strings of lights, lit every evening
    for (let i = 0; i < 40; i++) {
      const t = i / 40, a = t * Math.PI * 2;
      const [x, z] = f.p(Math.cos(a) * 9.8, Math.sin(a) * 9.8);
      box(glow, x, f.y + 9.2 + Math.sin(t * 40) * 0.1, z, 0.25, 0.25, 0.25, [1, 0.8, 0.4]);
    }
    for (let i = 0; i < 24; i++) { const h = 9.6 + (i / 24) * 14, w = 5 * (1 - i / 24 * 0.82); for (const sg of [-1, 1]) { const [x, z] = f.p(sg * w, 0); box(glow, x, f.y + h, z, 0.22, 0.22, 0.22, [1, 0.85, 0.5]); } }
    collider(f, 0, 0, 15, 15, 12, colliders);
    excl.push({ x: dg.x, z: dg.z, r: 11 });
  }

  // ---------------- Pune Railway Station
  const st = L.get('station');
  if (st) {
    const f = frame(st);
    const W = (st.w ?? 150) - 2, D = (st.d ?? 20) - 2;
    const fr = facing(city, f);
    f.box(b, 0, -0.6, 0, W, 12.6, D, [0.88, 0.8, 0.62]);
    f.box(b, 0, 12, 0, W + 1, 0.8, D + 1, [0.72, 0.6, 0.45]);
    // arched bays on the street side
    const side = fr[1] || 1;
    for (let x = -W / 2 + 4; x < W / 2 - 3; x += 5) {
      f.box(b, x, 1.2, (side * D) / 2 + side * 0.05, 2.6, 4.2, 0.3, [0.2, 0.18, 0.16]);
      f.box(b, x, 6.8, (side * D) / 2 + side * 0.05, 2.0, 3.0, 0.3, [0.25, 0.27, 0.3]);
    }
    // portico and the clock tower
    f.box(b, 0, -0.6, (side * D) / 2 + side * 5, 26, 7, 10, [0.86, 0.78, 0.6]);
    f.box(b, 0, 6.4, (side * D) / 2 + side * 5, 27, 0.8, 11, [0.72, 0.6, 0.45]);
    f.box(b, 0, -0.6, 0, 9, 30, 9, [0.88, 0.8, 0.62]);
    f.box(b, 0, 29.4, 0, 10, 1, 10, [0.72, 0.6, 0.45]);
    for (let i = 0; i < 4; i++) f.box(b, 0, 30.4 + i * 1.6, 0, 7.5 - i * 1.7, 1.6, 7.5 - i * 1.7, [0.62, 0.3, 0.22]);
    for (const [cx, cz] of [[0, 4.6], [0, -4.6], [4.6, 0], [-4.6, 0]]) {
      f.box(b, cx, 23, cz, cx ? 0.2 : 3.4, 3.4, cz ? 0.2 : 3.4, [0.96, 0.94, 0.86]);
      const [x, z] = f.p(cx * 1.04, cz * 1.04); box(glow, x, f.y + 24.7, z, 0.5, 0.5, 0.5, [1, 0.95, 0.8]);
    }
    collider(f, 0, 0, W, D, 13, colliders);
    collider(f, 0, (side * D) / 2 + side * 5, 26, 10, 7, colliders);
    excl.push({ x: st.x, z: st.z, r: 18 });
  }

  // ---------------- Aga Khan Palace
  const ak = L.get('agakhan');
  if (ak) {
    const f = frame(ak);
    const W = (ak.w ?? 82) - 1, D = (ak.d ?? 24) - 1;
    f.box(b, 0, -0.8, 0, W + 10, 1.6, D + 10, [0.8, 0.76, 0.68]);
    f.box(b, 0, 0.8, 0, W, 13, D, [0.94, 0.9, 0.8]);
    f.box(b, 0, 13.8, 0, W + 1.2, 0.9, D + 1.2, [0.84, 0.78, 0.66]);
    // two storeys of arcades on all four sides
    for (const fl of [0, 1]) {
      const y = 1.6 + fl * 6.2;
      for (const sg of [-1, 1]) {
        for (let x = -W / 2 + 3; x <= W / 2 - 3; x += 4.2) f.box(b, x, y, sg * (D / 2 + 0.05), 2.6, 4.2, 0.3, [0.3, 0.27, 0.24]);
        for (let z = -D / 2 + 3; z <= D / 2 - 3; z += 4.2) f.box(b, sg * (W / 2 + 0.05), y, z, 0.3, 4.2, 2.6, [0.3, 0.27, 0.24]);
      }
    }
    // the central block rises a storey higher
    f.box(b, 0, 14.6, 0, 22, 6, D - 4, [0.94, 0.9, 0.8]);
    f.box(b, 0, 20.6, 0, 23, 0.8, D - 3, [0.84, 0.78, 0.66]);
    for (const sg of [-1, 1]) for (let x = -9; x <= 9; x += 4.5) f.box(b, x, 15.6, sg * ((D - 4) / 2 + 0.05), 2.4, 3.6, 0.3, [0.3, 0.27, 0.24]);
    collider(f, 0, 0, W, D, 21, colliders);
    // gardens
    f.box(b, 0, -0.95, 0, W + 70, 0.4, D + 90, LAWN);
    excl.push({ x: ak.x, z: ak.z, r: 48 });
  }

  // ---------------- Parvati: temple on the hill and the steps up
  const pv = L.get('parvati');
  if (pv) {
    const f = frame(pv, 0.2);
    f.box(b, 0, -2, 0, 46, 5, 40, BASALT);
    collider(f, 0, -20, 46, 1.5, 3, colliders); collider(f, 0, 20, 46, 1.5, 3, colliders); collider(f, -23, 0, 1.5, 40, 3, colliders);
    f.box(b, 0, 3, 0, 44, 0.4, 38, [0.6, 0.56, 0.5]);
    const g2 = new Frame(f.x, f.z, f.y + 3, 0.2);
    temple(b, g2, 9, BASALT, [0.82, 0.78, 0.7], [1, 0]);
    for (const [a, c] of [[-14, -11], [-14, 11], [14, -12]]) { const g3 = new Frame(...g2.p(a, c), g2.y, 0.2); temple(b, g3, 4, BASALT, [0.82, 0.78, 0.7], [1, 0]); }
    collider(f, 0, 0, 12, 12, 20, colliders);
    excl.push({ x: pv.x, z: pv.z, r: 32 });
    // the stone stairway from the paytha
    const foot = { x: pv.x + 200, z: pv.z - 105 };
    const fromM = city.meta;
    const px = (73.85012 - fromM.origin[0]) * fromM.kx, pz = -(18.4985 - fromM.origin[1]) * fromM.kz;
    foot.x = px; foot.z = pz;
    const [ex, ez] = f.p(26, 0);
    const n = 70;
    for (let i = 0; i < n; i++) {
      const t0 = i / n, t1 = (i + 1) / n;
      const x0 = foot.x + (ex - foot.x) * t0, z0 = foot.z + (ez - foot.z) * t0;
      const x1 = foot.x + (ex - foot.x) * t1, z1 = foot.z + (ez - foot.z) * t1;
      const y0 = T.height(x0, z0) + 0.1 + (f.y + 3 - T.height(ex, ez)) * Math.pow(t0, 4);
      const ang = Math.atan2(z1 - z0, x1 - x0);
      box(b, (x0 + x1) / 2, y0, (z0 + z1) / 2, Math.hypot(x1 - x0, z1 - z0) + 0.2, 0.5, 6, [0.42, 0.4, 0.37], ang);
    }
  }

  // ---------------- smaller temples
  const small: [string, number, C3, C3][] = [
    ['kasba', 6, [0.92, 0.88, 0.8], [0.95, 0.55, 0.2]],
    ['omkareshwar', 8, BASALT, [0.9, 0.88, 0.82]],
    ['tulshibaug', 7, [0.9, 0.86, 0.78], [0.86, 0.84, 0.8]],
    ['chaturshringi', 6, [0.95, 0.9, 0.8], [0.9, 0.5, 0.3]],
  ];
  for (const [key, size, wall, spire] of small) {
    const l = L.get(key);
    if (!l) continue;
    const f = frame(l, 0);
    temple(b, f, size, wall, spire, facing(city, f));
    collider(f, 0, 0, size * 1.3, size * 1.3, size * 2, colliders);
    excl.push({ x: l.x, z: l.z, r: size * 1.2 });
  }
  // Saras Baug: the Ganesh temple on its island
  const sb = L.get('sarasbaug');
  if (sb) {
    const f = frame(sb, 0);
    f.box(b, 0, -1.5, 0, 24, 2, 24, [0.5, 0.56, 0.36]);
    temple(b, new Frame(f.x, f.z, f.y + 0.5, 0), 5, WHITE, WHITE, [1, 0]);
    excl.push({ x: sb.x, z: sb.z, r: 14 });
  }

  const mesh = new THREE.Mesh(b.geo(), mats.plain);
  mesh.frustumCulled = true;
  group.add(mesh);
  if (!glow.empty) { const g = new THREE.Mesh(glow.geo(), mats.lamp); g.name = 'lamps'; group.add(g); }
  for (const c of colliders) city.buildings.grid.add(c.cx - c.r, c.cz - c.r, c.cx + c.r, c.cz + c.r, c);
  return { group, excl, colliders, lights };
}

function circleRing(x: number, z: number, r: number) {
  const out = new Float32Array(16);
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; out[i * 2] = x + Math.cos(a) * r; out[i * 2 + 1] = z + Math.sin(a) * r; }
  return out;
}
