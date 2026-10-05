import * as THREE from 'three';
import { clamp, groundHeight, pondSDF, rng, type RippleSim } from './pond';
import type { Obstacle } from './garden';
import { pondify } from './garden';
import { leafAtlas, lilyTexture, paperTexture, petalTexture } from './textures';

/**
 * Everything that floats: lily pads (some flowering), fallen leaves, cherry
 * petals, paper boats, koi food and paper lanterns. They ride the ripple
 * simulation (pushed downhill by its slope, bobbing with its height), drift
 * on the breeze and on a slow pump current, bump into each other and the
 * banks, and lily pads stay loosely tethered to their stems.
 */

export type FloatKind = 'lily' | 'leaf' | 'petal' | 'boat' | 'pellet' | 'lantern';

export type Floater = {
  id: number; kind: FloatKind; x: number; z: number; vx: number; vz: number; a: number; va: number;
  r: number; y: number; scale: number; cell: number; born: number; alive: boolean;
  ax: number; az: number; flower: number; sink: number; tint: THREE.Color; tx: number; tz: number;
  /** height above the surface while still falling (leaves, petals); 0 once afloat */
  air: number; tumble: number;
};

const CAP: Record<FloatKind, number> = { lily: 40, leaf: 180, petal: 360, boat: 14, pellet: 220, lantern: 18 };
const DRAG: Record<FloatKind, number> = { lily: 1.6, leaf: 0.9, petal: 0.8, boat: 0.55, pellet: 1.0, lantern: 0.7 };
const WIND: Record<FloatKind, number> = { lily: 0.03, leaf: 0.35, petal: 0.35, boat: 0.75, pellet: 0.1, lantern: 0.5 };
const SLOPE: Record<FloatKind, number> = { lily: 1.4, leaf: 3.2, petal: 3.4, boat: 2.6, pellet: 3.0, lantern: 2.4 };

function lilyGeometry() {
  // a disc with the characteristic slit to the centre, edges turned up a touch
  const segs = 40, rings = 5, notch = 0.22;
  const pos: number[] = [], uv: number[] = [], idx: number[] = [];
  pos.push(0, 0.012, 0); uv.push(0.5, 0.5);
  for (let i = 1; i <= rings; i++) {
    const rr = i / rings;
    for (let j = 0; j <= segs; j++) {
      const a = notch + (j / segs) * (Math.PI * 2 - notch * 2);
      const wob = 1 + 0.03 * Math.sin(a * 5 + 1) + 0.02 * Math.sin(a * 11);
      const x = Math.cos(a) * rr * wob, z = Math.sin(a) * rr * wob;
      pos.push(x, 0.012 + Math.pow(rr, 6) * 0.045, z); uv.push(0.5 + x * 0.5, 0.5 + z * 0.5);
    }
  }
  for (let j = 0; j < segs; j++) idx.push(0, 1 + j + 1, 1 + j);
  for (let i = 1; i < rings; i++) for (let j = 0; j < segs; j++) {
    const a = 1 + (i - 1) * (segs + 1) + j, b = a + segs + 1;
    idx.push(a, a + 1, b, a + 1, b + 1, b);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}

function lilyFlowerGeometry() {
  // three rings of pointed petals around a golden centre, opening upward
  const pos: number[] = [], col: number[] = [], idx: number[] = [];
  const ring = (n: number, len: number, w: number, lift: number, rot: number) => {
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2 + rot;
      const ca = Math.cos(a), sa = Math.sin(a);
      const base = pos.length / 3;
      for (let s = 0; s <= 4; s++) {
        const t = s / 4;
        const rr = len * t, y = Math.sin(t * Math.PI * 0.5) * lift * len + 0.01;
        const ww = w * Math.sin(Math.PI * Math.min(1, 0.1 + t * 0.95)) * (1 - t * 0.35);
        const cup = ww * 0.3;
        pos.push(ca * rr - sa * ww, y + cup, sa * rr + ca * ww, ca * rr + sa * ww, y + cup, sa * rr - ca * ww);
        const c = 0.82 + t * 0.18;
        col.push(c, c, c, c, c, c);
      }
      for (let s = 0; s < 4; s++) { const i0 = base + s * 2; idx.push(i0, i0 + 2, i0 + 1, i0 + 1, i0 + 2, i0 + 3); }
    }
  };
  ring(8, 1, 0.24, 0.35, 0);
  ring(8, 0.85, 0.22, 0.75, Math.PI / 8);
  ring(6, 0.6, 0.2, 1.3, 0.2);
  // stamens: a small yellow cushion
  const cBase = pos.length / 3;
  pos.push(0, 0.16, 0);
  col.push(-1, -1, -1); // flagged below
  for (let k = 0; k <= 12; k++) { const a = (k / 12) * Math.PI * 2; pos.push(Math.cos(a) * 0.2, 0.1, Math.sin(a) * 0.2); col.push(-1, -1, -1); }
  for (let k = 0; k < 12; k++) idx.push(cBase, cBase + 1 + k + 1, cBase + 1 + k);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  // stamens are yellow regardless of tint: encode as colour > 1 handled by vertex colours
  for (let i = 0; i < col.length; i += 3) if (col[i] < 0) { col[i] = 1.0; col[i + 1] = 0.78; col[i + 2] = 0.2; }
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}

function leafGeometry() {
  // a card with a little curl along its midrib
  const g = new THREE.PlaneGeometry(1, 1, 4, 4);
  g.rotateX(-Math.PI / 2);
  const p = g.getAttribute('position') as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); p.setY(i, 0.008 + x * x * 0.22 + z * z * 0.06); }
  g.computeVertexNormals();
  return g;
}

function boatGeometry() {
  // the folded paper boat: two hull walls meeting at the keel, a triangular sail
  const pos: number[] = [], uv: number[] = [];
  const tri = (a: number[], b: number[], c: number[]) => { pos.push(...a, ...b, ...c); uv.push(a[0] * 0.25 + 0.5, a[1] * 0.4 + 0.3, b[0] * 0.25 + 0.5, b[1] * 0.4 + 0.3, c[0] * 0.25 + 0.5, c[1] * 0.4 + 0.3); };
  for (const s of [1, -1]) {
    const rim = [[-1, 0.32, 0], [-0.55, 0.3, 0.34 * s], [0.55, 0.3, 0.34 * s], [1, 0.32, 0]];
    const keel = [[-0.62, -0.06, 0], [0.62, -0.06, 0]];
    tri(rim[0], rim[1], keel[0]); tri(rim[1], rim[2], keel[0]); tri(rim[2], keel[1], keel[0]); tri(rim[2], rim[3], keel[1]);
    // the sail, two leaves of paper
    tri([-0.55, 0.3, 0.012 * s], [0.55, 0.3, 0.012 * s], [0, 1.05, 0.004 * s]);
  }
  // fold over the bottom so the hull is closed
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  return g;
}

export class Floaters {
  list: Floater[] = [];
  private nextId = 1;
  private r = rng(1234);
  readonly group = new THREE.Group();
  private meshes: Record<string, THREE.InstancedMesh>;
  private lanternGlow: THREE.MeshStandardMaterial;
  private m4 = new THREE.Matrix4();
  private q = new THREE.Quaternion();
  private e = new THREE.Euler();
  private s = new THREE.Vector3();
  private p = new THREE.Vector3();
  time = 0;

  constructor() {
    const lilyMat = pondify(new THREE.MeshStandardMaterial({ map: lilyTexture(), roughness: 0.42, side: THREE.DoubleSide }), { caustic: false, key: 'lily' });
    const flowerMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, side: THREE.DoubleSide, emissive: 0x2a2222, emissiveIntensity: 0.4 });
    const atlas = leafAtlas();
    const leafMat = new THREE.MeshStandardMaterial({ map: atlas, alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.6 });
    leafMat.onBeforeCompile = (sh) => {
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nattribute float aCell;')
        .replace('#include <uv_vertex>', '#include <uv_vertex>\n#ifdef USE_MAP\nvMapUv.x = (vMapUv.x + aCell) * 0.25;\n#endif');
    };
    leafMat.customProgramCacheKey = () => 'koi-leaf-atlas';
    const petalMat = new THREE.MeshStandardMaterial({ map: petalTexture(), alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.6, emissive: 0x331a20, emissiveIntensity: 0.3 });
    const boatMat = new THREE.MeshStandardMaterial({ map: paperTexture(), side: THREE.DoubleSide, roughness: 0.85, flatShading: true, emissive: 0x3a3833 });
    const pelletMat = new THREE.MeshStandardMaterial({ color: 0x8a5a2b, roughness: 0.7 });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x6b4a2b, roughness: 0.8 });
    this.lanternGlow = new THREE.MeshStandardMaterial({ color: 0xf6e7c8, emissive: 0xffa548, emissiveIntensity: 0.25, roughness: 0.9, side: THREE.DoubleSide });

    const leafG = leafGeometry();
    leafG.setAttribute('aCell', new THREE.InstancedBufferAttribute(new Float32Array(CAP.leaf), 1));
    const petalG = new THREE.PlaneGeometry(1, 1); petalG.rotateX(-Math.PI / 2); petalG.translate(0, 0.006, 0);
    const lanternBase = new THREE.BoxGeometry(1, 0.2, 1); lanternBase.translate(0, 0.1, 0);
    const lanternPaper = new THREE.BoxGeometry(0.78, 0.9, 0.78); lanternPaper.translate(0, 0.65, 0);
    const mk = (g: THREE.BufferGeometry, m: THREE.Material, n: number, shadow = true) => {
      const im = new THREE.InstancedMesh(g, m, n);
      im.count = 0; im.castShadow = shadow; im.receiveShadow = true; im.frustumCulled = false;
      this.group.add(im);
      return im;
    };
    this.meshes = {
      lily: mk(lilyGeometry(), lilyMat, CAP.lily),
      flower: mk(lilyFlowerGeometry(), flowerMat, CAP.lily),
      leaf: mk(leafG, leafMat, CAP.leaf),
      petal: mk(petalG, petalMat, CAP.petal, false),
      boat: mk(boatGeometry(), boatMat, CAP.boat),
      pellet: mk(new THREE.SphereGeometry(1, 8, 6), pelletMat, CAP.pellet, false),
      lanternBase: mk(lanternBase, woodMat, CAP.lantern),
      lanternPaper: mk(lanternPaper, this.lanternGlow, CAP.lantern, false),
    };
    for (const k of ['lily', 'flower', 'leaf', 'petal', 'boat'] as const) {
      const im = this.meshes[k];
      im.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(im.instanceMatrix.count * 3), 3);
    }
  }

  setNight(n: number) { this.lanternGlow.emissiveIntensity = 0.25 + n * 3.2; }

  count(kind: FloatKind) { return this.list.reduce((a, f) => a + (f.kind === kind && f.alive ? 1 : 0), 0); }

  add(kind: FloatKind, x: number, z: number, o: Partial<Floater> = {}) {
    const r = this.r;
    // keep under the cap by retiring the oldest of the kind
    const same = this.list.filter((f) => f.kind === kind);
    if (same.length >= CAP[kind]) { const old = same[0]; this.list.splice(this.list.indexOf(old), 1); }
    const size = { lily: 0.28 + r() * 0.2, leaf: 0.09 + r() * 0.05, petal: 0.022 + r() * 0.008, boat: 0.24 + r() * 0.05, pellet: 0.013 + r() * 0.004, lantern: 0.14 }[kind];
    const tint = new THREE.Color(1, 1, 1);
    if (kind === 'lily') tint.setHSL(0.27 + r() * 0.06, 0.25, 0.75 + r() * 0.25);
    if (kind === 'boat') tint.setHSL(r(), 0.3, 0.9 + r() * 0.08);
    if (kind === 'petal') tint.setRGB(1, 0.92 + r() * 0.08, 0.95);
    const f: Floater = {
      id: this.nextId++, kind, x, z, vx: 0, vz: 0, a: r() * Math.PI * 2, va: (r() - 0.5) * 0.4,
      r: kind === 'lily' ? size * 0.95 : kind === 'boat' ? size * 0.75 : kind === 'lantern' ? size * 0.8 : size * 0.5,
      y: 0, scale: size, cell: Math.floor(r() * 4), born: this.time, alive: true, ax: x, az: z, flower: -1, sink: 0, tint, tx: 0, tz: 0, air: 0, tumble: 0,
      ...o,
    };
    if (kind === 'lily' && f.flower < 0 && r() < 0.45) f.flower = Math.floor(r() * 3);
    this.list.push(f);
    return f;
  }

  /** Radial shove from a splash. */
  impulse(x: number, z: number, radius: number, strength: number) {
    for (const f of this.list) {
      const dx = f.x - x, dz = f.z - z, d = Math.hypot(dx, dz);
      if (d > radius || d < 1e-4) continue;
      const k = strength * (1 - d / radius) / (f.kind === 'lily' ? 3 : 1);
      f.vx += (dx / d) * k; f.vz += (dz / d) * k;
      f.va += (this.r() - 0.5) * k * 6;
    }
  }

  /** A hand moving through the water carries whatever it touches. */
  drag(x: number, z: number, vx: number, vz: number, radius: number) {
    for (const f of this.list) {
      if (f.air > 0) continue;
      const d = Math.hypot(f.x - x, f.z - z);
      if (d > radius + f.r) continue;
      const k = (1 - d / (radius + f.r)) * (f.kind === 'lily' ? 0.25 : 0.7);
      f.vx += (vx - f.vx) * k; f.vz += (vz - f.vz) * k;
    }
  }

  remove(id: number) { const f = this.list.find((q) => q.id === id); if (f) f.alive = false; }

  clear(keepLilies = false) { this.list = keepLilies ? this.list.filter((f) => f.kind === 'lily') : []; }

  update(dt: number, sim: RippleSim, windV: THREE.Vector2, obstacles: Obstacle[], current: number, onLand: (f: Floater) => void) {
    this.time += dt;
    const L = this.list;
    for (const f of L) {
      if (!f.alive) continue;
      if (f.air > 0) {
        // falling: flutter down, carried by the wind
        const fall = f.kind === 'petal' ? 0.45 : f.kind === 'leaf' ? 0.75 : 1.4;
        const ph = this.time * (f.kind === 'petal' ? 5 : 3) + f.id;
        f.vx += (windV.x * 1.4 - f.vx) * Math.min(1, dt * 1.5) + Math.cos(ph) * 0.6 * dt;
        f.vz += (windV.y * 1.4 - f.vz) * Math.min(1, dt * 1.5) + Math.sin(ph * 0.8) * 0.6 * dt;
        f.x += f.vx * dt; f.z += f.vz * dt;
        f.air -= fall * (0.75 + 0.5 * Math.abs(Math.sin(ph * 0.5))) * dt;
        f.a += f.va * dt * 3; f.tumble += dt * (f.kind === 'petal' ? 6 : 3);
        const d = pondSDF(f.x, f.z);
        const ground = groundHeight(f.x, f.z);
        if (d > -f.r) {
          if (f.air <= Math.max(0, ground) + 0.01) { f.alive = false; continue; }
        } else if (f.air <= 0) { f.air = 0; f.tumble = 0; f.vx *= 0.3; f.vz *= 0.3; onLand(f); }
        continue;
      }
      if (f.kind === 'pellet' && this.time - f.born > 28) f.sink = Math.min(1, f.sink + dt * 0.15);
      if (f.kind === 'petal' && this.time - f.born > 90) f.sink = Math.min(1, f.sink + dt * 0.05);
      const floating = f.sink < 0.05;
      const [gx, gz] = sim.gradAt(f.x, f.z);
      let fx = 0, fz = 0;
      if (floating) {
        fx -= gx * SLOPE[f.kind]; fz -= gz * SLOPE[f.kind];
        fx += windV.x * WIND[f.kind]; fz += windV.y * WIND[f.kind];
        // a slow circulation from the spout and pump
        const d = pondSDF(f.x, f.z);
        const tx = -f.z / 4.2, tz = f.x / 6.2;
        fx += tx * current * (0.4 + 0.6 * clamp(-d / 2, 0, 1)) * 0.06;
        fz += tz * current * (0.4 + 0.6 * clamp(-d / 2, 0, 1)) * 0.06;
        f.tx = tx; f.tz = tz;
      }
      if (f.kind === 'lily') { fx += (f.ax - f.x) * 0.12; fz += (f.az - f.z) * 0.12; }
      f.vx += fx * dt; f.vz += fz * dt;
      const drag = Math.exp(-dt * (floating ? DRAG[f.kind] : 4));
      f.vx *= drag; f.vz *= drag; f.va *= Math.exp(-dt * 1.2);
      // boats weathervane: turn to sail downwind
      if (f.kind === 'boat' && floating) {
        const sp = Math.hypot(f.vx, f.vz);
        if (sp > 0.01) { let dA = Math.atan2(f.vz, f.vx) - f.a; while (dA > Math.PI) dA -= Math.PI * 2; while (dA < -Math.PI) dA += Math.PI * 2; f.va += dA * dt * 2.5 * Math.min(1, sp * 6); }
      }
      f.x += f.vx * dt; f.z += f.vz * dt; f.a += f.va * dt;
      // banks
      const d = pondSDF(f.x, f.z);
      const lim = -f.r * 0.8 - 0.04;
      if (d > lim) {
        const e = 0.04;
        const nx = pondSDF(f.x + e, f.z) - pondSDF(f.x - e, f.z), nz = pondSDF(f.x, f.z + e) - pondSDF(f.x, f.z - e);
        const nl = Math.hypot(nx, nz) || 1;
        f.x -= (nx / nl) * (d - lim); f.z -= (nz / nl) * (d - lim);
        const vn = (f.vx * nx + f.vz * nz) / nl;
        if (vn > 0) { f.vx -= (nx / nl) * vn * 1.3; f.vz -= (nz / nl) * vn * 1.3; f.va += vn * 2; }
      }
      for (const o of obstacles) {
        const dx = f.x - o.x, dz = f.z - o.z, dd = Math.hypot(dx, dz), m = o.r + f.r;
        if (dd < m && dd > 1e-4) { f.x = o.x + (dx / dd) * m; f.z = o.z + (dz / dd) * m; const vn = (f.vx * dx + f.vz * dz) / dd; if (vn < 0) { f.vx -= (dx / dd) * vn * 1.3; f.vz -= (dz / dd) * vn * 1.3; } }
      }
    }
    // collisions among the bigger pieces, and small ones against the big ones
    const big = L.filter((f) => f.alive && f.air <= 0 && f.sink < 0.05 && (f.kind === 'lily' || f.kind === 'boat' || f.kind === 'lantern' || f.kind === 'leaf'));
    const small = L.filter((f) => f.alive && f.air <= 0 && f.sink < 0.05 && (f.kind === 'petal' || f.kind === 'pellet'));
    for (let i = 0; i < big.length; i++) for (let j = i + 1; j < big.length; j++) this.collide(big[i], big[j]);
    for (const s of small) for (const b of big) if (b.kind !== 'leaf') this.collide(s, b);
    // ride the surface
    for (const f of L) {
      if (!f.alive) continue;
      if (f.air > 0) { f.y = f.air; continue; }
      const h = sim.heightAt(f.x, f.z);
      const floor = groundHeight(f.x, f.z) + 0.02;
      f.y = THREE.MathUtils.lerp(h, floor, f.sink * f.sink);
    }
    this.list = L.filter((f) => f.alive && !(f.sink >= 1 && f.kind === 'petal'));
  }

  private collide(a: Floater, b: Floater) {
    const dx = b.x - a.x, dz = b.z - a.z, d = Math.hypot(dx, dz), m = a.r + b.r;
    if (d >= m || d < 1e-5) return;
    const ma = a.r * a.r * (a.kind === 'lily' ? 4 : 1), mb = b.r * b.r * (b.kind === 'lily' ? 4 : 1);
    const push = (m - d), nx = dx / d, nz = dz / d;
    const wa = mb / (ma + mb), wb = ma / (ma + mb);
    a.x -= nx * push * wa; a.z -= nz * push * wa; b.x += nx * push * wb; b.z += nz * push * wb;
    const rv = (b.vx - a.vx) * nx + (b.vz - a.vz) * nz;
    if (rv < 0) { const j = -rv * 1.2; a.vx -= nx * j * wa; a.vz -= nz * j * wa; b.vx += nx * j * wb; b.vz += nz * j * wb; a.va += (this.r() - 0.5) * j * 3; b.va += (this.r() - 0.5) * j * 3; }
  }

  /** Write instance matrices; called every frame. */
  sync(sim: RippleSim) {
    const counts: Record<string, number> = { lily: 0, flower: 0, leaf: 0, petal: 0, boat: 0, pellet: 0, lanternBase: 0, lanternPaper: 0 };
    const { m4, q, e, s, p } = this;
    const flowerTints = [new THREE.Color(1, 1, 1), new THREE.Color(1, 0.72, 0.82), new THREE.Color(1, 0.9, 0.55)];
    const cellAttr = this.meshes.leaf.geometry.getAttribute('aCell') as THREE.InstancedBufferAttribute;
    for (const f of this.list) {
      const [gx, gz] = f.sink < 0.5 && f.air <= 0 ? sim.gradAt(f.x, f.z) : [0, 0];
      const tiltK = f.kind === 'lily' ? 0.6 : 1;
      e.set(-gz * tiltK * 2 + Math.sin(f.tumble) * 0.9, -f.a, gx * tiltK * 2 + Math.cos(f.tumble * 0.7) * 0.6 * (f.tumble ? 1 : 0), 'YXZ');
      q.setFromEuler(e);
      const put = (key: string, scale: number, yOff = 0, col?: THREE.Color) => {
        const im = this.meshes[key];
        const i = counts[key]++;
        m4.compose(p.set(f.x, f.y + yOff, f.z), q, s.set(scale, scale, scale));
        im.setMatrixAt(i, m4);
        if (col && im.instanceColor) im.setColorAt(i, col);
        return i;
      };
      switch (f.kind) {
        case 'lily':
          put('lily', f.scale, 0, f.tint);
          if (f.flower >= 0) {
            // the flower stands off-centre on the pad
            const fo = 0.2 * f.scale;
            m4.compose(p.set(f.x + Math.cos(f.a + 1.2) * fo, f.y + 0.01, f.z - Math.sin(f.a + 1.2) * fo), q, s.setScalar(f.scale * 0.4));
            const i = counts.flower++;
            this.meshes.flower.setMatrixAt(i, m4);
            this.meshes.flower.setColorAt(i, flowerTints[f.flower]);
          }
          break;
        case 'leaf': { const i = put('leaf', f.scale, 0, f.tint); cellAttr.setX(i, f.cell); break; }
        case 'petal': put('petal', f.scale * 1.6, 0, f.tint); break;
        case 'boat': put('boat', f.scale, 0.005, f.tint); break;
        case 'pellet': put('pellet', f.scale, 0.004); break;
        case 'lantern': put('lanternBase', f.scale * 1.8, -0.01); put('lanternPaper', f.scale * 1.8, -0.01); break;
      }
    }
    for (const k of Object.keys(this.meshes)) {
      const im = this.meshes[k];
      im.count = counts[k];
      im.instanceMatrix.needsUpdate = true;
      if (im.instanceColor) im.instanceColor.needsUpdate = true;
    }
    cellAttr.needsUpdate = true;
  }

  get food() { return this.list.filter((f) => f.kind === 'pellet' && f.alive && f.air <= 0); }
}
