import * as THREE from 'three';
import { Buf, box, cyl, type Materials } from './city';

/**
 * Pune's traffic, built from boxes: the scooters and motorcycles that are
 * most of it, black-and-yellow auto rickshaws, hatchbacks, sedans, SUVs,
 * city buses, tempos, and the police. Original, generic designs — no makes,
 * no logos. Local frame: +z forward, +y up, wheels on y = 0.
 */

export type VType = 'scooter' | 'bike' | 'auto' | 'hatch' | 'sedan' | 'suv' | 'bus' | 'tempo' | 'police' | 'cycle';

export interface Spec {
  label: string; marathi: string; len: number; wid: number; height: number; two: boolean;
  top: number; accel: number; brake: number; turn: number; grip: number; mass: number; hp: number; seat: number; rev: number;
}

export const SPECS: Record<VType, Spec> = {
  cycle:   { label: 'Bicycle', marathi: 'सायकल', len: 1.7, wid: 0.6, height: 1.1, two: true, top: 7, accel: 1.6, brake: 4, turn: 1.4, grip: 6, mass: 90, hp: 40, seat: 0.95, rev: 1 },
  scooter: { label: 'Scooter', marathi: 'स्कूटर', len: 1.8, wid: 0.7, height: 1.15, two: true, top: 22, accel: 3.6, brake: 7, turn: 1.25, grip: 7, mass: 200, hp: 60, seat: 0.75, rev: 1.6 },
  bike:    { label: 'Motorcycle', marathi: 'बाईक', len: 2.0, wid: 0.75, height: 1.1, two: true, top: 28, accel: 4.6, brake: 7.5, turn: 1.1, grip: 7.5, mass: 230, hp: 70, seat: 0.78, rev: 1.9 },
  auto:    { label: 'Auto rickshaw', marathi: 'रिक्षा', len: 2.65, wid: 1.3, height: 1.75, two: false, top: 16, accel: 2.3, brake: 5.5, turn: 0.95, grip: 5, mass: 420, hp: 90, seat: 0.55, rev: 1.3 },
  hatch:   { label: 'Hatchback', marathi: 'कार', len: 3.7, wid: 1.65, height: 1.5, two: false, top: 36, accel: 4.2, brake: 8, turn: 0.75, grip: 7, mass: 950, hp: 120, seat: 0.45, rev: 1.5 },
  sedan:   { label: 'Sedan', marathi: 'कार', len: 4.4, wid: 1.75, height: 1.45, two: false, top: 40, accel: 4.8, brake: 8.5, turn: 0.7, grip: 7.5, mass: 1200, hp: 140, seat: 0.45, rev: 1.4 },
  suv:     { label: 'SUV', marathi: 'एसयूव्ही', len: 4.5, wid: 1.85, height: 1.85, two: false, top: 38, accel: 4.6, brake: 8, turn: 0.68, grip: 7, mass: 1700, hp: 180, seat: 0.7, rev: 1.2 },
  bus:     { label: 'City bus', marathi: 'बस', len: 11.5, wid: 2.55, height: 3.3, two: false, top: 20, accel: 1.6, brake: 4.5, turn: 0.42, grip: 5, mass: 11000, hp: 400, seat: 1.6, rev: 0.8 },
  tempo:   { label: 'Tempo', marathi: 'टेम्पो', len: 4.2, wid: 1.7, height: 2.2, two: false, top: 24, accel: 2.6, brake: 6, turn: 0.62, grip: 6, mass: 1600, hp: 160, seat: 0.75, rev: 1.0 },
  police:  { label: 'Police jeep', marathi: 'पोलीस', len: 4.4, wid: 1.8, height: 1.9, two: false, top: 42, accel: 5.4, brake: 9, turn: 0.72, grip: 8, mass: 1650, hp: 200, seat: 0.7, rev: 1.3 },
};

type C3 = [number, number, number];
const hex = (h: string): C3 => { const n = parseInt(h.slice(1), 16); return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; };
const BODY = {
  scooter: ['#e9ecef', '#c1121f', '#1d3557', '#adb5bd', '#2a9d8f', '#f4a261', '#212529', '#6c757d', '#e5e5e5', '#8d99ae'],
  bike: ['#111111', '#c1121f', '#0b3d91', '#343a40', '#6a040f', '#5a5a5a'],
  car: ['#f8f9fa', '#e9ecef', '#adb5bd', '#6c757d', '#212529', '#9d0208', '#1d3557', '#003566', '#7f5539', '#ced4da', '#b08968', '#e63946'],
};
const BLACK: C3 = [0.07, 0.07, 0.07], GLASS: C3 = [0.16, 0.2, 0.24], TYRE: C3 = [0.06, 0.06, 0.06], CHROME: C3 = [0.7, 0.7, 0.72];
const AUTO_YELLOW: C3 = [0.98, 0.8, 0.1], AUTO_BLACK: C3 = [0.08, 0.08, 0.07];

export interface VModel { body: THREE.BufferGeometry; lamps: THREE.BufferGeometry; brake: THREE.BufferGeometry; color: C3 }

const cache = new Map<string, VModel>();

function wheel(b: Buf, x: number, z: number, r: number, w: number) {
  // a wheel, axle along x: a rounded cross of boxes reads as a disc from the side
  box(b, x, r, z, w, r * 2, r * 1.15, TYRE);
  box(b, x, r, z, w, r * 1.15, r * 2, TYRE);
  box(b, x, r, z, w, r * 1.7, r * 1.7, TYRE);
  box(b, x, r, z, w * 1.05, r * 0.7, r * 0.7, CHROME);
}

export function vehicleModel(t: VType, variant: number): VModel {
  const key = t + ':' + variant;
  const hit = cache.get(key);
  if (hit) return hit;
  const b = new Buf(), l = new Buf(), br = new Buf();
  const S = SPECS[t];
  const pick = (a: string[]) => hex(a[variant % a.length]);
  let color: C3 = [0.5, 0.5, 0.5];
  const head = (x: number, y: number, z: number, s = 0.22) => box(l, x, y, z, s, s * 0.7, 0.08, [1, 0.96, 0.85]);
  const tail = (x: number, y: number, z: number, s = 0.18) => box(br, x, y, z, s, s * 0.6, 0.06, [1, 0.12, 0.08]);
  switch (t) {
    case 'cycle': {
      color = pick(['#111111', '#7f0000', '#0b3d91']);
      wheel(b, 0, 0.6, 0.34, 0.05); wheel(b, 0, -0.6, 0.34, 0.05);
      box(b, 0, 0.62, 0, 0.05, 0.05, 1.1, color, 0); box(b, 0, 0.55, -0.25, 0.05, 0.5, 0.05, color);
      box(b, 0, 0.92, -0.3, 0.16, 0.05, 0.24, BLACK); box(b, 0, 1.0, 0.55, 0.55, 0.04, 0.04, CHROME);
      break;
    }
    case 'scooter': {
      color = pick(BODY.scooter);
      wheel(b, 0, 0.62, 0.26, 0.12); wheel(b, 0, -0.6, 0.26, 0.12);
      box(b, 0, 0.55, -0.42, 0.42, 0.42, 0.85, color);       // rear body
      box(b, 0, 0.8, -0.4, 0.34, 0.1, 0.62, BLACK);           // seat
      box(b, 0, 0.32, 0.12, 0.34, 0.12, 0.6, [0.2, 0.2, 0.2]); // floorboard
      box(b, 0, 0.7, 0.5, 0.42, 0.75, 0.16, color);            // apron
      box(b, 0, 1.1, 0.48, 0.62, 0.08, 0.08, BLACK);           // handlebar
      box(b, 0, 0.62, 0.66, 0.2, 0.18, 0.2, color);            // mudguard
      head(0, 1.02, 0.56, 0.16); tail(0, 0.72, -0.86, 0.16);
      break;
    }
    case 'bike': {
      color = pick(BODY.bike);
      wheel(b, 0, 0.7, 0.32, 0.1); wheel(b, 0, -0.68, 0.32, 0.12);
      box(b, 0, 0.75, 0.15, 0.3, 0.26, 0.55, color);            // tank
      box(b, 0, 0.78, -0.35, 0.28, 0.1, 0.6, BLACK);            // seat
      box(b, 0, 0.45, -0.05, 0.26, 0.26, 0.5, [0.3, 0.3, 0.3]); // engine
      box(b, 0.17, 0.35, -0.45, 0.08, 0.08, 0.7, CHROME);      // exhaust
      box(b, 0, 1.05, 0.5, 0.7, 0.05, 0.05, CHROME);
      box(b, 0, 0.92, 0.58, 0.2, 0.2, 0.14, color);
      head(0, 0.92, 0.66, 0.15); tail(0, 0.8, -0.72, 0.14);
      break;
    }
    case 'auto': {
      color = AUTO_YELLOW;
      wheel(b, 0, 1.0, 0.22, 0.14); wheel(b, -0.55, -0.75, 0.22, 0.14); wheel(b, 0.55, -0.75, 0.22, 0.14);
      box(b, 0, 0.42, -0.2, 1.2, 0.3, 1.9, AUTO_BLACK);        // floor
      box(b, 0, 0.8, -0.72, 1.24, 0.55, 0.85, AUTO_BLACK);     // rear bench box
      box(b, 0, 0.95, 0.85, 0.7, 1.0, 0.25, AUTO_BLACK);       // nose
      box(b, 0, 1.0, 0.92, 0.5, 0.35, 0.12, AUTO_YELLOW);
      box(b, 0, 1.72, -0.15, 1.3, 0.1, 2.1, AUTO_YELLOW);      // canopy roof
      box(b, 0, 1.3, 0.85, 0.95, 0.7, 0.06, GLASS);            // windscreen
      for (const sx of [-1, 1]) {
        box(b, sx * 0.63, 1.3, -0.95, 0.06, 0.8, 0.4, AUTO_YELLOW);  // rear side canvas
        box(b, sx * 0.63, 1.25, 0.82, 0.05, 0.9, 0.05, AUTO_BLACK);  // front posts
      }
      box(b, 0, 1.3, -1.17, 1.24, 0.8, 0.06, AUTO_YELLOW);
      box(b, 0, 1.15, 0.55, 0.7, 0.06, 0.06, BLACK);           // handlebar
      box(b, 0, 0.75, -1.16, 1.0, 0.25, 0.05, [0.95, 0.95, 0.9]); // number plate band
      head(0, 1.05, 1.0, 0.18); tail(-0.45, 0.62, -1.18); tail(0.45, 0.62, -1.18);
      break;
    }
    case 'hatch': case 'sedan': case 'suv': case 'police': case 'tempo': {
      const L = S.len, W = S.wid, H = S.height;
      color = t === 'police' ? [0.96, 0.96, 0.95] : t === 'tempo' ? pick(['#f8f9fa', '#ffd166', '#2a9d8f', '#e9c46a']) : pick(BODY.car);
      const wr = t === 'suv' || t === 'police' ? 0.36 : t === 'tempo' ? 0.34 : 0.3;
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) wheel(b, sx * (W / 2 - 0.12), sz * (L / 2 - 0.75), wr, 0.24);
      if (t === 'tempo') {
        box(b, 0, wr + 0.65, L / 2 - 0.75, W, 1.3, 1.4, color);
        box(b, 0, wr + 1.05, L / 2 - 0.04, W * 0.9, 0.55, 0.06, GLASS);
        box(b, 0, wr + 0.3, -0.7, W, 0.25, L - 1.6, [0.3, 0.3, 0.3]);
        for (const sx of [-1, 1]) box(b, sx * (W / 2), wr + 0.75, -0.7, 0.06, 0.7, L - 1.6, [0.45, 0.35, 0.25]);
        box(b, 0, wr + 0.75, -L / 2 + 0.12, W, 0.7, 0.06, [0.45, 0.35, 0.25]);
        box(b, 0, wr + 0.9, -0.7, W - 0.15, 0.6, L - 1.8, [0.65, 0.55, 0.4]); // sacks in the back
        head(-W / 2 + 0.25, wr + 0.4, L / 2, 0.2); head(W / 2 - 0.25, wr + 0.4, L / 2, 0.2);
        tail(-W / 2 + 0.2, wr + 0.3, -L / 2); tail(W / 2 - 0.2, wr + 0.3, -L / 2);
        break;
      }
      const bodyH = (H - wr) * 0.5, cabH = H - wr - bodyH - 0.1;
      box(b, 0, wr + bodyH / 2 + 0.05, 0, W, bodyH, L, color);
      const cabL = t === 'hatch' ? L * 0.55 : t === 'sedan' ? L * 0.48 : L * 0.62;
      const cabZ = t === 'hatch' ? -L * 0.12 : t === 'sedan' ? -L * 0.04 : -L * 0.1;
      box(b, 0, wr + bodyH + cabH / 2 + 0.05, cabZ, W * 0.9, cabH, cabL, color);
      box(b, 0, wr + bodyH + cabH / 2 + 0.05, cabZ + cabL / 2 + 0.01, W * 0.82, cabH * 0.8, 0.04, GLASS);
      box(b, 0, wr + bodyH + cabH / 2 + 0.05, cabZ - cabL / 2 - 0.01, W * 0.82, cabH * 0.75, 0.04, GLASS);
      for (const sx of [-1, 1]) box(b, sx * W * 0.451, wr + bodyH + cabH / 2 + 0.05, cabZ, 0.04, cabH * 0.75, cabL * 0.9, GLASS);
      box(b, 0, wr + 0.18, L / 2 + 0.02, W * 0.96, 0.18, 0.08, BLACK);
      box(b, 0, wr + 0.18, -L / 2 - 0.02, W * 0.96, 0.18, 0.08, BLACK);
      box(b, 0, wr + 0.42, -L / 2 - 0.03, 0.5, 0.12, 0.02, [0.95, 0.95, 0.9]);
      head(-W / 2 + 0.28, wr + bodyH * 0.75, L / 2 + 0.01, 0.3); head(W / 2 - 0.28, wr + bodyH * 0.75, L / 2 + 0.01, 0.3);
      tail(-W / 2 + 0.22, wr + bodyH * 0.75, -L / 2 - 0.01, 0.26); tail(W / 2 - 0.22, wr + bodyH * 0.75, -L / 2 - 0.01, 0.26);
      if (t === 'suv' || t === 'police') box(b, 0, wr + bodyH + cabH + 0.1, cabZ, W * 0.8, 0.06, cabL * 0.8, BLACK);
      if (t === 'police') {
        for (const sx of [-1, 1]) box(b, sx * (W / 2 + 0.01), wr + bodyH * 0.55, 0, 0.02, 0.16, L * 0.9, [0.1, 0.25, 0.6]);
        box(l, -0.3, wr + bodyH + cabH + 0.22, cabZ, 0.5, 0.16, 0.25, [1, 0.1, 0.1]);
        box(l, 0.3, wr + bodyH + cabH + 0.22, cabZ, 0.5, 0.16, 0.25, [0.15, 0.35, 1]);
      }
      if (t === 'hatch' && variant % 4 === 1) {
        // an Uber-style black-and-yellow plate: half the hatchbacks in town are cabs
        box(b, 0, wr + 0.42, L / 2 + 0.04, 0.5, 0.12, 0.02, [0.95, 0.8, 0.1]);
      }
      break;
    }
    case 'bus': {
      const L = S.len, W = S.wid;
      const livery: C3[] = [hex('#0f7173'), hex('#e76f51'), hex('#2a9d8f'), hex('#3a86ff')];
      color = livery[variant % livery.length];
      for (const sx of [-1, 1]) for (const sz of [-0.32, 0.36]) wheel(b, sx * (W / 2 - 0.2), sz * L, 0.5, 0.3);
      box(b, 0, 0.55 + 0.55, 0, W, 1.1, L, color);
      box(b, 0, 1.65 + 0.55, 0, W, 1.1, L, [0.92, 0.9, 0.84]);
      box(b, 0, 2.75 + 0.3, 0, W, 0.6, L, color);
      for (const sx of [-1, 1]) box(b, sx * (W / 2 + 0.01), 2.2, 0.3, 0.02, 0.9, L - 2.2, GLASS);
      box(b, 0, 2.15, L / 2 + 0.01, W * 0.92, 1.3, 0.04, GLASS);
      box(b, 0, 3.0, L / 2 + 0.02, W * 0.7, 0.32, 0.04, [0.05, 0.05, 0.05]); // destination board (lit)
      box(l, 0, 3.0, L / 2 + 0.04, W * 0.66, 0.24, 0.02, [1, 0.6, 0.1]);
      box(b, W / 2 + 0.01, 1.5, L / 2 - 1.2, 0.03, 2.2, 1.0, [0.2, 0.22, 0.24]); // door
      head(-W / 2 + 0.3, 0.9, L / 2 + 0.01, 0.3); head(W / 2 - 0.3, 0.9, L / 2 + 0.01, 0.3);
      tail(-W / 2 + 0.25, 0.9, -L / 2 - 0.01, 0.3); tail(W / 2 - 0.25, 0.9, -L / 2 - 0.01, 0.3);
      break;
    }
  }
  const m: VModel = { body: b.geo(), lamps: l.empty ? new THREE.BufferGeometry() : l.geo(), brake: br.empty ? new THREE.BufferGeometry() : br.geo(), color };
  cache.set(key, m);
  return m;
}

export class VehicleMesh {
  group = new THREE.Group();
  lamp: THREE.Mesh; brake: THREE.Mesh;
  constructor(public type: VType, public variant: number, mats: Materials & { brakeOn: THREE.ShaderMaterial; brakeOff: THREE.ShaderMaterial }) {
    const m = vehicleModel(type, variant);
    const body = new THREE.Mesh(m.body, mats.plain);
    this.lamp = new THREE.Mesh(m.lamps, mats.lamp);
    this.brake = new THREE.Mesh(m.brake, mats.brakeOff);
    this.group.add(body, this.lamp, this.brake);
    this.group.matrixAutoUpdate = true;
  }
}

/** A random traffic mix that looks like Pune: mostly two-wheelers. */
export function randomType(r: number, cls: number): VType {
  if (cls >= 5) return r < 0.62 ? 'scooter' : r < 0.82 ? 'bike' : r < 0.9 ? 'auto' : r < 0.96 ? 'hatch' : 'cycle';
  if (r < 0.34) return 'scooter';
  if (r < 0.5) return 'bike';
  if (r < 0.64) return 'auto';
  if (r < 0.78) return 'hatch';
  if (r < 0.86) return 'sedan';
  if (r < 0.92) return 'suv';
  if (r < 0.96) return 'tempo';
  if (r < 0.99) return 'bus';
  return 'cycle';
}

export { cyl };
