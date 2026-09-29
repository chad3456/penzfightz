import * as THREE from 'three';
import { toon } from './ink';
import type { Site } from './types';

/**
 * Temples, built from simple solids and told apart by their silhouettes —
 * which is how the ink sees them. Every piece carries a build order (its
 * height, roughly), so the time-lapse can raise the temple from its plinth to
 * its finial.
 *
 * Each builder puts the sanctum at the origin facing +z: the shrine — the
 * linga, the goddess, Krishna — stands just outside the door at `shrine`.
 */

export interface Temple {
  group: THREE.Group;
  /** Where the deity stands, in the temple's frame. */
  shrine: THREE.Vector3;
  /** Keep the pilgrim out of this radius round the origin, except the door lane. */
  radius: number;
  /** Height of the top, for the camera. */
  top: number;
}

type P = { g: THREE.Group };
const geomCache = new Map<string, THREE.BufferGeometry>();
function geo(key: string, make: () => THREE.BufferGeometry) { let g = geomCache.get(key); if (!g) { g = make(); geomCache.set(key, g); } return g; }

function put(p: P, g: THREE.BufferGeometry, color: string, x: number, y: number, z: number, ry = 0) {
  const m = new THREE.Mesh(g, toon(color));
  m.position.set(x, y, z);
  m.rotation.y = ry;
  m.userData.order = y;
  p.g.add(m);
  return m;
}
const box = (p: P, w: number, h: number, d: number, c: string, x: number, y: number, z: number, ry = 0) => put(p, geo(`b${w},${h},${d}`, () => new THREE.BoxGeometry(w, h, d)), c, x, y + h / 2, z, ry);
const cyl = (p: P, rt: number, rb: number, h: number, c: string, x: number, y: number, z: number, seg = 16) => put(p, geo(`c${rt},${rb},${h},${seg}`, () => new THREE.CylinderGeometry(rt, rb, h, seg)), c, x, y + h / 2, z);
const cone = (p: P, r: number, h: number, c: string, x: number, y: number, z: number, seg = 4, ry = Math.PI / 4) => put(p, geo(`k${r},${h},${seg}`, () => new THREE.ConeGeometry(r, h, seg)), c, x, y + h / 2, z, ry);
const ball = (p: P, r: number, c: string, x: number, y: number, z: number) => put(p, geo(`s${r}`, () => new THREE.SphereGeometry(r, 14, 10)), c, x, y, z);

/** A curved Nagara tower: a lathe, square or many-sided. */
function shikhara(p: P, base: number, h: number, c: string, x: number, y: number, z: number, sides = 8, bulge = 0.22) {
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= 14; i++) {
    const t = i / 14;
    const r = base * (1 - t * 0.78) * (1 + bulge * Math.sin(t * Math.PI) * (1 - t)) ;
    pts.push(new THREE.Vector2(Math.max(0.05, r), t * h));
  }
  const g = geo(`sh${base},${h},${sides},${bulge}`, () => new THREE.LatheGeometry(pts, sides));
  const m = put(p, g, c, x, y, z, Math.PI / sides);
  m.userData.order = y + h * 0.3;
  // the amalaka and the kalasha
  const a = cyl(p, base * 0.34, base * 0.34, h * 0.05, c, x, y + h * 0.97, z, 20);
  a.scale.set(1, 1, 1);
  ball(p, base * 0.12, '#d9a93e', x, y + h * 1.06, z);
  cone(p, base * 0.07, h * 0.1, '#d9a93e', x, y + h * 1.1, z, 8, 0);
  return m;
}
function flag(p: P, x: number, y: number, z: number, color = '#d6451f') {
  cyl(p, 0.03, 0.03, 1.4, '#5a3a1a', x, y, z, 5);
  const f = new THREE.Mesh(geo('flag', () => new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 1.4, 0), new THREE.Vector3(0.9, 1.15, 0), new THREE.Vector3(0, 0.9, 0)])), new THREE.MeshToonMaterial({ color, side: THREE.DoubleSide }));
  f.position.set(x, y, z);
  f.userData.order = y + 1.2;
  f.userData.flag = true;
  p.g.add(f);
}
function steps(p: P, w: number, h: number, zFront: number, c: string) {
  const n = Math.max(2, Math.round(h / 0.22));
  for (let i = 0; i < n; i++) box(p, w, (h * (n - i)) / n, 0.35, c, 0, 0, zFront + i * 0.35 + 0.17);
}
function pillars(p: P, xs: number[], z: number, y: number, h: number, c: string) { for (const x of xs) cyl(p, 0.18, 0.2, h, c, x, y, z, 8); }

/* ────────────────────────────── the styles ────────────────────────────── */

function nagara(p: P, stone: string, accent: string, dark = false): Temple {
  const plinthH = 1.0;
  box(p, 12, plinthH, 12, stone, 0, 0, -1);
  steps(p, 4, plinthH, 5, stone);
  box(p, 4.2, 3.6, 4.2, stone, 0, plinthH, -3);
  shikhara(p, 2.4, 8, dark ? '#4a4540' : accent, 0, plinthH + 3.6, -3, dark ? 12 : 8, dark ? 0.1 : 0.22);
  for (const [sx, sz] of [[-2.3, -1.2], [2.3, -1.2], [-2.3, -4.8], [2.3, -4.8]]) shikhara(p, 0.9, 3, dark ? '#4a4540' : accent, sx!, plinthH + 3.6, sz!, 8, 0.2);
  // the hall
  box(p, 5.4, 3.0, 4.4, stone, 0, plinthH, 1.2);
  cone(p, 4.3, 2.4, accent, 0, plinthH + 3.0, 1.2);
  ball(p, 0.3, '#d9a93e', 0, plinthH + 5.5, 1.2);
  pillars(p, [-2.3, -0.9, 0.9, 2.3], 3.6, plinthH, 2.9, stone);
  box(p, 5.6, 0.25, 0.6, stone, 0, plinthH + 2.9, 3.6);
  flag(p, 0, plinthH + 3.6 + 8.9, -3);
  return { group: p.g, shrine: new THREE.Vector3(0, plinthH, 3.9), radius: 6.4, top: plinthH + 13 };
}

function dravida(p: P, stone: string, paint: string): Temple {
  const plinthH = 0.7;
  box(p, 13, plinthH, 13, stone, 0, 0, -1);
  steps(p, 4, plinthH, 5.5, stone);
  box(p, 4.8, 3.2, 4.8, stone, 0, plinthH, -3);
  let y = plinthH + 3.2;
  for (let i = 0; i < 4; i++) {
    const w = 4.6 - i * 0.85;
    box(p, w, 1.0, w, i % 2 ? stone : paint, 0, y, -3);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(p, 0.35, 0.45, 0.35, paint, (sx * w) / 2 - sx * 0.2, y + 1.0, -3 + (sz * w) / 2 - sz * 0.2);
    y += 1.0;
  }
  const dome = put(p, geo('stupi', () => new THREE.SphereGeometry(1.0, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2)), paint, 0, y, -3);
  dome.scale.set(1, 1.1, 1);
  cone(p, 0.18, 0.9, '#d9a93e', 0, y + 1.0, -3, 8, 0);
  box(p, 6, 2.8, 5, stone, 0, plinthH, 1.6);
  box(p, 6.4, 0.3, 5.4, paint, 0, plinthH + 2.8, 1.6);
  pillars(p, [-2.5, -0.9, 0.9, 2.5], 4.1, plinthH, 2.8, stone);
  // the gopuram, at the gate in front
  const gz = 11;
  box(p, 2.4, 3.6, 3, stone, -2.4, 0, gz);
  box(p, 2.4, 3.6, 3, stone, 2.4, 0, gz);
  box(p, 7.2, 1.0, 3, stone, 0, 3.6, gz);
  let gy = 4.6;
  for (let i = 0; i < 6; i++) {
    const w = 7 - i * 0.8;
    box(p, w, 1.05, 2.6 - i * 0.2, i % 2 ? paint : '#e9dcc3', 0, gy, gz);
    gy += 1.05;
  }
  const vault = put(p, geo('vault', () => new THREE.CylinderGeometry(0.9, 0.9, 2.4, 12, 1, false, 0, Math.PI)), paint, 0, gy, gz);
  vault.rotation.z = Math.PI / 2;
  vault.rotation.y = Math.PI / 2;
  for (const x of [-0.8, 0, 0.8]) cone(p, 0.12, 0.7, '#d9a93e', x, gy + 0.8, gz, 8, 0);
  // the enclosure wall
  box(p, 26, 1.6, 0.6, stone, 0, 0, -11);
  for (const sx of [-1, 1]) box(p, 0.6, 1.6, 22, stone, sx * 13, 0, 0);
  for (const sx of [-1, 1]) box(p, 9, 1.6, 0.6, stone, sx * 8.5, 0, gz);
  return { group: p.g, shrine: new THREE.Vector3(0, plinthH, 4.4), radius: 6.6, top: gy + 2 };
}

function himalayan(p: P): Temple {
  const stone = '#8e8b86';
  box(p, 11, 0.6, 12, '#a7a39c', 0, 0, -1);
  steps(p, 3.5, 0.6, 5, '#a7a39c');
  box(p, 5.2, 5.2, 6.4, stone, 0, 0.6, -2.4);
  cone(p, 4.4, 4.6, '#6d6a66', 0, 5.8, -2.4);
  cone(p, 3.2, 3.4, '#f4f2ee', 0, 7.2, -2.4);
  cyl(p, 0.3, 0.45, 0.9, '#d9a93e', 0, 10.2, -2.4, 8);
  box(p, 4.4, 3.2, 3.2, stone, 0, 0.6, 2.3);
  cone(p, 3.4, 2.0, '#6d6a66', 0, 3.8, 2.3);
  // a great boulder behind, as at Kedarnath
  const rock = put(p, geo('boulder', () => new THREE.DodecahedronGeometry(2.6, 0)), '#7a7671', 0, 2.2, -10);
  rock.scale.set(1.5, 0.9, 1.1);
  flag(p, 1.8, 10.2, -2.4, '#e6b54a');
  return { group: p.g, shrine: new THREE.Vector3(0, 0.6, 4.3), radius: 6, top: 11 };
}

function kalinga(p: P): Temple {
  const stone = '#b98a64';
  box(p, 12, 0.8, 13, '#c9a07a', 0, 0, -1);
  steps(p, 4, 0.8, 5.5, '#c9a07a');
  box(p, 4.6, 3.2, 4.6, stone, 0, 0.8, -3.2);
  shikhara(p, 2.9, 10, stone, 0, 4.0, -3.2, 4, 0.12);
  // the stepped hall, a pidha deul
  box(p, 5.2, 3.0, 5.2, stone, 0, 0.8, 1.8);
  let y = 3.8;
  for (let i = 0; i < 5; i++) { box(p, 5.4 - i * 0.9, 0.5, 5.4 - i * 0.9, i % 2 ? '#a57a58' : stone, 0, y, 1.8); y += 0.62; }
  put(p, geo('bell', () => new THREE.SphereGeometry(0.8, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2)), stone, 0, y, 1.8);
  cone(p, 0.15, 0.7, '#d9a93e', 0, y + 0.7, 1.8, 8, 0);
  flag(p, 0, 14.6, -3.2);
  return { group: p.g, shrine: new THREE.Vector3(0, 0.8, 4.8), radius: 6.4, top: 15 };
}

function cave(p: P, icy: boolean): Temple {
  const rock = icy ? '#9c9a98' : '#8a7a68';
  const m = put(p, geo('cave-rock', () => new THREE.IcosahedronGeometry(7, 1)), rock, 0, 2, -5);
  m.scale.set(1.6, 1.0, 1.0);
  const m2 = put(p, geo('cave-rock2', () => new THREE.DodecahedronGeometry(4, 0)), rock, -6, 1, -3);
  m2.scale.set(1, 0.8, 1.2);
  const m3 = put(p, geo('cave-rock2', () => new THREE.DodecahedronGeometry(4, 0)), rock, 6.5, 1.5, -4);
  m3.scale.set(1.1, 0.9, 1);
  if (icy) { const s = put(p, geo('cave-snow', () => new THREE.IcosahedronGeometry(7.1, 1)), '#f5f3ef', 0, 3.2, -5.2); s.scale.set(1.5, 0.6, 0.95); }
  // the mouth
  const mouth = put(p, geo('mouth', () => new THREE.CircleGeometry(2.6, 20, 0, Math.PI)), '#1d1a18', 0, 0.05, 1.45);
  mouth.userData.order = 0.5;
  box(p, 6, 0.3, 4, '#9a8c7c', 0, 0, 2.8);
  return { group: p.g, shrine: new THREE.Vector3(0, 0.3, 2.4), radius: 7.5, top: 9 };
}

function rockCut(p: P): Temple {
  const basalt = '#5b5550';
  // the pit walls
  box(p, 30, 7, 3, '#6d665f', 0, 0, -14);
  for (const sx of [-1, 1]) box(p, 3, 7, 24, '#6d665f', sx * 15, 0, -3);
  const t = dravida(p, basalt, '#6d655d');
  return t;
}

function pagoda(p: P, roofColor: string): Temple {
  box(p, 11, 0.7, 11, '#b7a58a', 0, 0, -1);
  steps(p, 3.6, 0.7, 4.5, '#b7a58a');
  box(p, 5, 3.4, 5, '#a8563b', 0, 0.7, -1.5);
  cone(p, 5.6, 1.8, roofColor, 0, 4.1, -1.5);
  box(p, 3.4, 1.6, 3.4, '#a8563b', 0, 5.9, -1.5);
  cone(p, 3.8, 1.5, roofColor, 0, 7.5, -1.5);
  cyl(p, 0.15, 0.45, 1.6, '#e6b54a', 0, 9.0, -1.5, 8);
  ball(p, 0.3, '#e6b54a', 0, 10.8, -1.5);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) cyl(p, 0.12, 0.12, 3.4, '#6a3a22', sx * 2.3, 0.7, -1.5 + sz * 2.3, 6);
  return { group: p.g, shrine: new THREE.Vector3(0, 0.7, 1.9), radius: 5.2, top: 11 };
}

function bengal(p: P): Temple {
  const terra = '#b4603a';
  box(p, 10, 0.8, 10, '#c98a62', 0, 0, -1);
  steps(p, 3.4, 0.8, 4, '#c98a62');
  box(p, 5.4, 3.6, 5.4, terra, 0, 0.8, -1);
  // the curved chala roof, and a smaller one above: aat-chala
  const r1 = put(p, geo('chala', () => { const g = new THREE.ConeGeometry(4.4, 2.4, 4, 1); g.scale(1, 1, 1); return g; }), terra, 0, 5.6, -1, Math.PI / 4);
  r1.scale.set(1, 1, 1);
  box(p, 3, 1.6, 3, terra, 0, 5.6, -1);
  const r2 = put(p, geo('chala2', () => new THREE.ConeGeometry(2.6, 1.8, 4, 1)), terra, 0, 8.1, -1, Math.PI / 4);
  void r2;
  cone(p, 0.18, 1.0, '#e6b54a', 0, 9.0, -1, 8, 0);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) cone(p, 0.5, 1.4, terra, sx * 2.4, 5.6, -1 + sz * 2.4, 8, 0);
  box(p, 3.6, 2.2, 0.2, '#6a2e1a', 0, 0.8, 1.72);
  return { group: p.g, shrine: new THREE.Vector3(0, 0.8, 2.6), radius: 5, top: 10 };
}

function kerala(p: P): Temple {
  box(p, 12, 0.6, 12, '#c9bba2', 0, 0, -1);
  cyl(p, 3, 3, 3, '#efe7d6', 0, 0.6, -2, 20);
  cyl(p, 3.05, 3.05, 1.0, '#7a4a2a', 0, 3.6, -2, 20);
  cone(p, 4.6, 3.4, '#7a8f7e', 0, 4.6, -2, 20, 0);
  cone(p, 0.25, 1.1, '#e6b54a', 0, 7.9, -2, 8, 0);
  // the lamp tower
  for (let i = 0; i < 9; i++) cyl(p, 0.7 - i * 0.05, 0.75 - i * 0.05, 0.12, '#b08a4a', 3.6, 0.6 + i * 0.5, 4, 12);
  cyl(p, 0.12, 0.12, 4.6, '#8a6a3a', 3.6, 0.6, 4, 8);
  box(p, 5.4, 2.4, 3.6, '#efe7d6', 0, 0.6, 2.4);
  cone(p, 4.3, 1.8, '#7a8f7e', 0, 3.0, 2.4);
  return { group: p.g, shrine: new THREE.Vector3(0, 0.6, 4.6), radius: 5.6, top: 9 };
}

function haveli(p: P): Temple {
  const wall = '#f0d9b5';
  box(p, 13, 0.6, 11, '#d8c09a', 0, 0, -1);
  steps(p, 4, 0.6, 4.5, '#d8c09a');
  box(p, 10, 3.6, 7, wall, 0, 0.6, -1);
  box(p, 10.4, 0.3, 7.4, '#c48a4a', 0, 4.2, -1);
  box(p, 7, 2.4, 5, wall, 0, 4.5, -1.6);
  box(p, 7.4, 0.3, 5.4, '#c48a4a', 0, 6.9, -1.6);
  for (const x of [-3.5, -1.2, 1.2, 3.5]) box(p, 1.2, 2.2, 0.15, '#7a2e22', x, 0.9, 2.55);
  for (const [sx, sz] of [[-4.4, 1.8], [4.4, 1.8], [-4.4, -3.8], [4.4, -3.8]]) {
    for (const [dx, dz] of [[-0.4, -0.4], [0.4, -0.4], [-0.4, 0.4], [0.4, 0.4]]) cyl(p, 0.06, 0.06, 1.0, wall, sx! + dx!, 4.5, sz! + dz!, 5);
    const d = put(p, geo('chhatri', () => new THREE.SphereGeometry(0.75, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2)), '#f4e6c8', sx!, 5.5, sz!);
    void d;
  }
  const dome = put(p, geo('haveli-dome', () => new THREE.SphereGeometry(1.8, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2)), '#f4e6c8', 0, 7.2, -1.6);
  void dome;
  cone(p, 0.2, 1.0, '#e6b54a', 0, 9.0, -1.6, 8, 0);
  flag(p, 0, 9.2, -1.6, '#e8702a');
  return { group: p.g, shrine: new THREE.Vector3(0, 0.6, 3.4), radius: 6.5, top: 10 };
}

function modern(p: P): Temple {
  box(p, 14, 1.0, 14, '#c9c2b6', 0, 0, -1);
  cyl(p, 5, 5.2, 0.8, '#6f6a64', 0, 1.0, -2, 32);
  cyl(p, 2.6, 2.9, 9, '#4a4744', 0, 1.8, -2, 32);
  put(p, geo('linga-top', () => new THREE.SphereGeometry(2.6, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2)), '#4a4744', 0, 10.8, -2);
  return { group: p.g, shrine: new THREE.Vector3(0, 1.0, 4.2), radius: 5.6, top: 14 };
}

function natural(p: P, id: string): Temple {
  if (id === 'kurukshetra') {
    // the banyan of the Gita
    cyl(p, 1.2, 1.6, 4, '#6a4a2e', 0, 0, -3, 10);
    for (const [x, y, z, r] of [[0, 6, -3, 4.2], [-3.5, 5, -1.5, 3], [3.5, 5.2, -2, 3.2], [0, 5, 0.5, 3]] as number[][]) ball(p, r!, '#5f7a4a', x!, y!, z!);
    for (let i = 0; i < 8; i++) cyl(p, 0.08, 0.08, 4.5, '#6a4a2e', Math.cos(i) * 3.6, 0, -3 + Math.sin(i) * 3.2, 5);
    box(p, 7, 0.4, 5, '#c9b89a', 0, 0, 2.5);
    return { group: p.g, shrine: new THREE.Vector3(0, 0.4, 3.2), radius: 3, top: 10 };
  }
  // Kailash, or the lake below it: a great four-sided peak, a cairn with prayer flags
  const peak = put(p, geo('kailash', () => new THREE.ConeGeometry(18, 22, 4)), '#8d8984', 0, 11, -40, Math.PI / 4);
  void peak;
  put(p, geo('kailash-snow', () => new THREE.ConeGeometry(12.5, 15, 4)), '#f6f4f0', 0, 14.6, -39.4, Math.PI / 4);
  if (id === 'manasa-kailash') { const lake = put(p, geo('lake', () => new THREE.CircleGeometry(12, 32)), '#4f86a6', 0, 0.05, -14); lake.rotation.x = -Math.PI / 2; }
  box(p, 3, 0.6, 3, '#9c948a', 0, 0, 1);
  cone(p, 1.2, 1.6, '#8d857a', 0, 0.6, 1, 6, 0);
  const cols = ['#2e6fb0', '#f4f2ee', '#c8332a', '#3a8a4a', '#e6b54a'];
  for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; box(p, 0.35, 0.25, 0.02, cols[i % 5]!, Math.cos(a) * 1.8, 2.0 + Math.sin(i) * 0.2, 1 + Math.sin(a) * 1.8, -a); }
  return { group: p.g, shrine: new THREE.Vector3(0, 0.6, 2.8), radius: 2.4, top: 12 };
}

export function buildTemple(site: Site): Temple {
  const p: P = { g: new THREE.Group() };
  switch (site.style) {
    case 'nagara': return nagara(p, '#c9b28e', '#b89a72');
    case 'hemadpanti': return nagara(p, '#6b655e', '#57524c', true);
    case 'dravida': return dravida(p, '#b9a88c', '#d9a860');
    case 'himalayan': return himalayan(p);
    case 'kalinga': return kalinga(p);
    case 'cave': return cave(p, site.biome === 'snow');
    case 'rock': return rockCut(p);
    case 'pagoda': return pagoda(p, '#d9a93e');
    case 'bengal': return bengal(p);
    case 'kerala': return kerala(p);
    case 'haveli': return haveli(p);
    case 'modern': return modern(p);
    case 'natural': return natural(p, site.id);
  }
}

/** The deity at the shrine: a linga for Shiva, the goddess for Shakti, Krishna's flute and feather. */
export function buildDeity(site: Site, glow: boolean) {
  const g = new THREE.Group();
  const add = (geom: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number) => { const me = new THREE.Mesh(geom, m); me.position.set(x, y, z); g.add(me); return me; };
  if (site.kind === 'jyotirlinga' || site.kind === 'linga') {
    const icy = site.id === 'amarnath';
    const stone = icy ? new THREE.MeshToonMaterial({ color: '#e8f3fb', emissive: '#bfe3ff', emissiveIntensity: 0.3 }) : toon('#2f2c2a', glow ? '#6b5a2a' : undefined, 0.3);
    const base = toon(icy ? '#cfd8de' : '#4a4642');
    add(new THREE.CylinderGeometry(0.75, 0.8, 0.28, 24), base, 0, 0.14, 0);
    add(new THREE.BoxGeometry(0.7, 0.16, 0.34), base, 0, 0.2, 0.85);
    add(new THREE.CylinderGeometry(0.3, 0.32, 0.7, 24), stone, 0, 0.63, 0);
    add(new THREE.SphereGeometry(0.3, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), stone, 0, 0.98, 0);
    // three lines of ash, and a bilva leaf
    const ash = toon('#f4f0e6');
    for (const y of [0.62, 0.7, 0.78]) { const b = add(new THREE.BoxGeometry(0.4, 0.02, 0.02), ash, 0, y, 0.3); b.rotation.y = 0; }
    add(new THREE.SphereGeometry(0.08, 8, 6), toon('#3f7a3f'), 0.12, 1.12, 0.1).scale.set(1, 0.3, 1.6);
  } else if (site.kind === 'shakti') {
    const red = toon('#b3261e');
    add(new THREE.CylinderGeometry(0.5, 0.55, 0.3, 16), toon('#6b3a22'), 0, 0.15, 0);
    add(new THREE.ConeGeometry(0.42, 1.1, 16), red, 0, 0.85, 0);
    add(new THREE.SphereGeometry(0.28, 16, 12), toon('#1f1a18'), 0, 1.45, 0);
    add(new THREE.CylinderGeometry(0.22, 0.3, 0.26, 8), toon('#e6b54a', '#e6b54a', 0.3), 0, 1.72, 0);
    for (const x of [-0.12, 0.12]) add(new THREE.SphereGeometry(0.05, 8, 6), toon('#f4f0e6'), x, 1.5, 0.24);
    add(new THREE.TorusGeometry(0.42, 0.06, 6, 20), toon('#d62a2a'), 0, 1.1, 0).rotation.x = Math.PI / 2;
    const tri = add(new THREE.CylinderGeometry(0.02, 0.02, 1.9, 5), toon('#8a8a8a'), 0.7, 0.95, 0);
    void tri;
    for (const x of [-0.12, 0, 0.12]) add(new THREE.ConeGeometry(0.04, 0.22, 5), toon('#8a8a8a'), 0.7 + x, 1.98, 0);
  } else {
    add(new THREE.CylinderGeometry(0.55, 0.6, 0.9, 12), toon('#e9dcc3'), 0, 0.45, 0);
    const flute = add(new THREE.CylinderGeometry(0.035, 0.035, 1.1, 8), toon('#8a5a2a'), 0, 1.05, 0);
    flute.rotation.z = 1.25;
    add(new THREE.SphereGeometry(0.2, 12, 8), toon('#f2ead8'), 0.3, 1.0, 0.2);
    const stem = add(new THREE.CylinderGeometry(0.015, 0.015, 1.0, 5), toon('#6a5a2a'), -0.25, 1.4, 0);
    stem.rotation.z = -0.25;
    for (const [c, r] of [['#1f9a5a', 0.17], ['#c8b24a', 0.12], ['#1a6fb0', 0.08], ['#123a8a', 0.045]] as [string, number][]) { const e = add(new THREE.SphereGeometry(r, 12, 8), toon(c), -0.38, 1.88, 0); e.scale.set(0.8, 1.2, 0.3); }
  }
  return g;
}

/** Shiva's bull, facing the shrine. */
export function buildNandi() {
  const g = new THREE.Group();
  const w = toon('#e9e4da');
  const add = (geom: THREE.BufferGeometry, x: number, y: number, z: number, sx = 1, sy = 1, sz = 1) => { const m = new THREE.Mesh(geom, w); m.position.set(x, y, z); m.scale.set(sx, sy, sz); g.add(m); return m; };
  add(new THREE.CylinderGeometry(0.9, 0.95, 0.3, 16), 0, 0.15, 0);
  add(new THREE.SphereGeometry(0.6, 16, 12), 0, 0.75, 0, 1, 0.75, 1.6);
  add(new THREE.SphereGeometry(0.4, 16, 12), 0, 1.2, -0.45, 1, 0.9, 1);
  add(new THREE.SphereGeometry(0.3, 14, 10), 0, 1.25, -1.0, 0.9, 1, 1.2);
  for (const sx of [-1, 1]) { const h = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.3, 6), toon('#8a7a6a')); h.position.set(sx * 0.18, 1.55, -0.95); h.rotation.z = -sx * 0.4; g.add(h); }
  const bell = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), toon('#d9a93e'));
  bell.position.set(0, 0.95, -1.05);
  g.add(bell);
  return g;
}
