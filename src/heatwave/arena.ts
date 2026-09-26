import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { Box, Circle, Shape } from './physics';

/**
 * The arena: one hand-made desert, 110 m by 150 m — taller than wide, for a
 * phone held upright.
 *
 * Solid things are circles and rotated boxes. Mesas and rocks for the cops to
 * hit; a little town in the middle with lanes between the buildings to thread;
 * wrecked cars; fences and cacti that break; red barrels that go up and take
 * anything near them; two ramps. The gaps are all wide enough to take at full
 * speed, because the fun is in who else fits through them.
 */

export const W = 110;
export const D = 150;

export interface Prop {
  shape: Shape;
  mesh: THREE.Object3D;
  /** breakable props go down when hit hard enough; barrels explode */
  kind: 'solid' | 'break' | 'barrel';
  alive: boolean;
  respawn: number;
}
export interface Ramp { x: number; z: number; a: number; w: number; l: number }

function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const lam = (c: string) => new THREE.MeshLambertMaterial({ color: c, flatShading: true });
const M = {
  sand: lam('#e9b877'),
  rock: lam('#c8703f'),
  rockDark: lam('#9c4f2c'),
  rockTop: lam('#dd8b4e'),
  cactus: lam('#4f9a45'),
  cactusDark: lam('#3c7a36'),
  wood: lam('#9a6a3e'),
  woodDark: lam('#6e4526'),
  wall: lam('#f1d6a4'),
  wall2: lam('#e7b98a'),
  roof: lam('#b84a32'),
  roof2: lam('#5a7a8a'),
  rust: lam('#b0673a'),
  rust2: lam('#7fa0a8'),
  tyre: lam('#2a2622'),
  barrel: lam('#e23a2a'),
  barrelBand: lam('#f5d24a'),
  ramp: lam('#d8a262'),
  glass: lam('#3d5968'),
};

export class Arena {
  group = new THREE.Group();
  shapes: Shape[] = [];
  props: Prop[] = [];
  ramps: Ramp[] = [];
  skidCanvas: HTMLCanvasElement;
  skidCtx: CanvasRenderingContext2D;
  skidTex: THREE.CanvasTexture;
  private skidDirty = false;

  constructor() {
    this.ground();
    // the skid layer: a transparent canvas laid over the sand
    this.skidCanvas = document.createElement('canvas');
    this.skidCanvas.width = 1024;
    this.skidCanvas.height = 1400;
    this.skidCtx = this.skidCanvas.getContext('2d')!;
    this.skidTex = new THREE.CanvasTexture(this.skidCanvas);
    const skid = new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshBasicMaterial({ map: this.skidTex, transparent: true, depthWrite: false }));
    skid.rotation.x = -Math.PI / 2;
    skid.position.y = 0.02;
    skid.renderOrder = 1;
    this.group.add(skid);
    this.walls();
    this.layout();
    this.bake();
  }

  /**
   * Everything that never moves, merged into one mesh per material: a few
   * dozen draw calls for the whole arena instead of several hundred, which
   * is most of what keeps a phone at sixty.
   */
  private bake() {
    this.group.updateMatrixWorld(true);
    const moving = new Set<THREE.Object3D>();
    for (const p of this.props) p.mesh.traverse((o) => moving.add(o));
    const byMat = new Map<THREE.Material, THREE.BufferGeometry[]>();
    const done: THREE.Mesh[] = [];
    this.group.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh || (m as unknown as THREE.InstancedMesh).isInstancedMesh || moving.has(m) || Array.isArray(m.material)) return;
      const mat = m.material as THREE.MeshLambertMaterial;
      if (mat.map || mat.transparent) return;
      const g = (m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone()).applyMatrix4(m.matrixWorld);
      for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k);
      if (!byMat.has(mat)) byMat.set(mat, []);
      byMat.get(mat)!.push(g);
      done.push(m);
    });
    for (const m of done) m.removeFromParent();
    for (const [mat, list] of byMat) {
      const merged = mergeGeometries(list);
      list.forEach((g) => g.dispose());
      if (merged) this.group.add(new THREE.Mesh(merged, mat));
    }
  }

  /** Draw a mark into the skid layer, in world coordinates. */
  mark(x0: number, z0: number, x1: number, z1: number, w: number, color: string) {
    const g = this.skidCtx;
    const sx = this.skidCanvas.width / W;
    const sz = this.skidCanvas.height / D;
    g.strokeStyle = color;
    g.lineWidth = w * sx;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo((x0 + W / 2) * sx, (z0 + D / 2) * sz);
    g.lineTo((x1 + W / 2) * sx, (z1 + D / 2) * sz);
    g.stroke();
    this.skidDirty = true;
  }
  scorch(x: number, z: number, r: number) {
    const g = this.skidCtx;
    const sx = this.skidCanvas.width / W;
    const sz = this.skidCanvas.height / D;
    const gr = g.createRadialGradient((x + W / 2) * sx, (z + D / 2) * sz, 0, (x + W / 2) * sx, (z + D / 2) * sz, r * sx);
    gr.addColorStop(0, 'rgba(40,24,14,0.7)');
    gr.addColorStop(1, 'rgba(40,24,14,0)');
    g.fillStyle = gr;
    g.fillRect((x + W / 2 - r) * sx, (z + D / 2 - r) * sz, 2 * r * sx, 2 * r * sz);
    this.skidDirty = true;
  }
  /** Old marks fade; the texture is re-uploaded a few times a second, not every frame. */
  private fadeT = 0;
  private upT = 0;
  tick(dt: number) {
    this.fadeT += dt;
    this.upT += dt;
    if (this.fadeT > 1.5) {
      this.fadeT = 0;
      const g = this.skidCtx;
      g.globalCompositeOperation = 'destination-out';
      g.fillStyle = 'rgba(0,0,0,0.05)';
      g.fillRect(0, 0, this.skidCanvas.width, this.skidCanvas.height);
      g.globalCompositeOperation = 'source-over';
      this.skidDirty = true;
    }
    if (this.skidDirty && this.upT > 0.1) {
      this.skidTex.needsUpdate = true;
      this.skidDirty = false;
      this.upT = 0;
    }
  }
  clearMarks() {
    this.skidCtx.clearRect(0, 0, this.skidCanvas.width, this.skidCanvas.height);
    this.skidTex.needsUpdate = true;
  }

  private ground() {
    // sand, with darker washes and the pale tracks of old roads, painted once
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 700;
    const g = c.getContext('2d')!;
    g.fillStyle = '#eab878';
    g.fillRect(0, 0, 512, 700);
    const r = mulberry(4);
    for (let i = 0; i < 40; i++) {
      const x = r() * 512;
      const y = r() * 700;
      const rad = 30 + r() * 90;
      const gr = g.createRadialGradient(x, y, 0, x, y, rad);
      gr.addColorStop(0, r() < 0.5 ? 'rgba(214,150,92,0.5)' : 'rgba(250,210,150,0.5)');
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr;
      g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
    g.strokeStyle = 'rgba(255,230,190,0.55)';
    g.lineWidth = 26;
    g.beginPath();
    g.moveTo(256, 0);
    g.bezierCurveTo(220, 250, 300, 450, 256, 700);
    g.moveTo(0, 350);
    g.bezierCurveTo(150, 330, 360, 380, 512, 350);
    g.stroke();
    for (let i = 0; i < 1400; i++) {
      g.fillStyle = r() < 0.5 ? 'rgba(160,100,60,0.25)' : 'rgba(255,240,210,0.3)';
      g.fillRect(r() * 512, r() * 700, 2, 2);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(W + 80, D + 80), new THREE.MeshLambertMaterial({ map: tex }));
    floor.rotation.x = -Math.PI / 2;
    this.group.add(floor);
    // scattered pebbles for texture, one instanced mesh
    const peb = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(0.25, 0), M.rockDark, 260);
    const m = new THREE.Matrix4();
    for (let i = 0; i < 260; i++) {
      const s = 0.5 + r() * 1.6;
      m.compose(new THREE.Vector3((r() - 0.5) * W, 0.05, (r() - 0.5) * D), new THREE.Quaternion().setFromEuler(new THREE.Euler(r(), r() * 6, r())), new THREE.Vector3(s, s * 0.6, s));
      peb.setMatrixAt(i, m);
    }
    this.group.add(peb);
  }

  private add(shape: Shape, mesh: THREE.Object3D, kind: Prop['kind'] = 'solid') {
    this.shapes.push(shape);
    this.group.add(mesh);
    if (kind !== 'solid') this.props.push({ shape, mesh, kind, alive: true, respawn: 0 });
  }

  /** The canyon walls all round: stacked slabs of red rock. */
  private walls() {
    const r = mulberry(9);
    const T = 6;
    const edges: [number, number, number, number][] = [
      [0, -D / 2 - T / 2, W + 2 * T, T], [0, D / 2 + T / 2, W + 2 * T, T],
      [-W / 2 - T / 2, 0, T, D], [W / 2 + T / 2, 0, T, D],
    ];
    for (const [x, z, w, d] of edges) {
      this.shapes.push({ kind: 'box', x, z, hw: w / 2, hd: d / 2, a: 0 });
      const long = Math.max(w, d);
      for (let s = -long / 2; s < long / 2; s += 5 + r() * 3) {
        const h = 5 + r() * 6;
        const sz = 6 + r() * 5;
        const slab = new THREE.Mesh(new THREE.BoxGeometry(w > d ? sz : T + r() * 3, h, w > d ? T + r() * 3 : sz), r() < 0.5 ? M.rock : M.rockDark);
        slab.position.set(w > d ? x + s : x, h / 2, w > d ? z : z + s);
        slab.rotation.y = (r() - 0.5) * 0.2;
        this.group.add(slab);
        const cap = new THREE.Mesh(new THREE.BoxGeometry(slab.geometry.parameters.width * 1.05, 0.8, slab.geometry.parameters.depth * 1.05), M.rockTop);
        cap.position.set(slab.position.x, h, slab.position.z);
        cap.rotation.y = slab.rotation.y;
        this.group.add(cap);
      }
    }
  }

  private mesa(x: number, z: number, rad: number, h: number, seed: number) {
    const r = mulberry(seed);
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    const layers = 3;
    for (let i = 0; i < layers; i++) {
      const rr = rad * (1 - i * 0.12);
      const m = new THREE.Mesh(new THREE.CylinderGeometry(rr * 0.92, rr, h / layers, 9), i % 2 ? M.rockDark : M.rock);
      m.position.y = (i + 0.5) * (h / layers);
      m.rotation.y = r() * 3;
      g.add(m);
    }
    const top = new THREE.Mesh(new THREE.CylinderGeometry(rad * 0.66, rad * 0.7, 0.6, 9), M.rockTop);
    top.position.y = h;
    g.add(top);
    this.add({ kind: 'circle', x, z, r: rad }, g);
  }

  private rock(x: number, z: number, rad: number, seed: number) {
    const r = mulberry(seed);
    const m = new THREE.Mesh(new THREE.DodecahedronGeometry(rad, 0), r() < 0.5 ? M.rock : M.rockDark);
    m.position.set(x, rad * 0.55, z);
    m.scale.set(1, 0.75 + r() * 0.4, 1);
    m.rotation.set(r(), r() * 6, r());
    this.add({ kind: 'circle', x, z, r: rad * 0.95 }, m);
  }

  private cactus(x: number, z: number, seed: number) {
    const r = mulberry(seed);
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    const h = 2.4 + r() * 1.6;
    const trunk = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, h, 3, 8), M.cactus);
    trunk.position.y = h / 2 + 0.4;
    g.add(trunk);
    for (const s of [-1, 1]) {
      if (r() < 0.25) continue;
      const ah = 0.8 + r() * 1.1;
      const y = h * (0.35 + r() * 0.3);
      const out = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.6, 3, 6), M.cactusDark);
      out.rotation.z = Math.PI / 2;
      out.position.set(s * 0.65, y, 0);
      g.add(out);
      const up = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, ah, 3, 6), M.cactus);
      up.position.set(s * 1.0, y + ah / 2 + 0.1, 0);
      g.add(up);
    }
    g.rotation.y = r() * 6;
    this.add({ kind: 'circle', x, z, r: 0.7 }, g, 'break');
  }

  private building(x: number, z: number, w: number, d: number, a: number, style: number) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = a;
    const h = 4.5 + (style % 2) * 1.5;
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), style % 2 ? M.wall : M.wall2);
    body.position.y = h / 2;
    g.add(body);
    // a false front, the way a frontier main street has them
    const front = new THREE.Mesh(new THREE.BoxGeometry(w * 0.9, 2.2, 0.4), style % 2 ? M.wall2 : M.wall);
    front.position.set(0, h + 0.9, d / 2 - 0.1);
    g.add(front);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(w + 0.6, 0.4, d + 0.6), style % 3 ? M.roof : M.roof2);
    roof.position.y = h + 0.2;
    g.add(roof);
    const porch = new THREE.Mesh(new THREE.BoxGeometry(w, 0.2, 2), M.wood);
    porch.position.set(0, 3, d / 2 + 1);
    g.add(porch);
    for (const px of [-w / 2 + 0.3, w / 2 - 0.3]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.25, 3, 0.25), M.woodDark);
      post.position.set(px, 1.5, d / 2 + 1.8);
      g.add(post);
    }
    for (const wx of [-w / 4, w / 4]) {
      const win = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 0.1), M.glass);
      win.position.set(wx, 2.2, d / 2 + 0.03);
      g.add(win);
    }
    this.add({ kind: 'box', x, z, hw: w / 2, hd: d / 2 + 0.4, a }, g);
  }

  private wreck(x: number, z: number, a: number, seed: number) {
    const r = mulberry(seed);
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = a;
    const col = r() < 0.5 ? M.rust : M.rust2;
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1, 4.4), col);
    body.position.y = 0.7;
    body.rotation.z = (r() - 0.5) * 0.15;
    g.add(body);
    const cab = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.8, 2), col);
    cab.position.set(0, 1.55, -0.3);
    g.add(cab);
    for (const [wx, wz] of [[-1.1, 1.4], [1.1, 1.4], [-1.1, -1.4]]) {
      const t = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.4, 10), M.tyre);
      t.rotation.z = Math.PI / 2;
      t.position.set(wx, 0.5, wz);
      g.add(t);
    }
    this.add({ kind: 'box', x, z, hw: 1.15, hd: 2.25, a }, g);
  }

  private fence(x0: number, z0: number, x1: number, z1: number) {
    const n = Math.max(1, Math.round(Math.hypot(x1 - x0, z1 - z0) / 3));
    const a = Math.atan2(x1 - x0, z1 - z0);
    for (let i = 0; i < n; i++) {
      const u = (i + 0.5) / n;
      const x = x0 + (x1 - x0) * u;
      const z = z0 + (z1 - z0) * u;
      const g = new THREE.Group();
      g.position.set(x, 0, z);
      g.rotation.y = a;
      for (const pz of [-1.4, 1.4]) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.5, 0.22), M.woodDark);
        post.position.set(0, 0.75, pz);
        g.add(post);
      }
      for (const y of [0.5, 1.1]) {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.2, 3), M.wood);
        rail.position.set(0, y, 0);
        g.add(rail);
      }
      this.add({ kind: 'box', x, z, hw: 0.2, hd: 1.5, a }, g, 'break');
    }
  }

  private barrel(x: number, z: number) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 1.4, 12), M.barrel);
    b.position.y = 0.7;
    g.add(b);
    for (const y of [0.35, 1.05]) {
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.12, 12), M.barrelBand);
      band.position.y = y;
      g.add(band);
    }
    this.add({ kind: 'circle', x, z, r: 0.75 }, g, 'barrel');
  }

  private ramp(x: number, z: number, a: number) {
    const w = 6;
    const l = 7;
    const shape = new THREE.Shape();
    shape.moveTo(-l / 2, 0);
    shape.lineTo(l / 2, 0);
    shape.lineTo(l / 2, 1.6);
    shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, { depth: w, bevelEnabled: false });
    geo.translate(0, 0, -w / 2);
    geo.rotateY(-Math.PI / 2);
    const m = new THREE.Mesh(geo, M.ramp);
    m.position.set(x, 0, z);
    m.rotation.y = a;
    this.group.add(m);
    for (const s of [-1, 1]) {
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.05, l), M.barrel);
      stripe.position.set(s * (w / 2 - 0.3), 0.05, 0);
      stripe.rotation.x = -Math.atan2(1.6, l);
      const holder = new THREE.Group();
      holder.position.set(x, 0.8, z);
      holder.rotation.y = a;
      holder.add(stripe);
      this.group.add(holder);
    }
    this.ramps.push({ x, z, a, w, l });
  }

  /** The hand-made part. */
  private layout() {
    // mesas: the big things to bait cops into
    this.mesa(-32, -48, 9, 9, 1);
    this.mesa(34, -30, 7.5, 8, 2);
    this.mesa(-30, 42, 8, 8.5, 3);
    this.mesa(30, 52, 9.5, 10, 4);
    this.mesa(2, -62, 6, 7, 5);
    // rocks in ones and twos
    const rocks: [number, number, number][] = [
      [-8, -38, 2.4], [14, -46, 2], [44, -58, 2.6], [-46, -20, 2.2], [46, 4, 2.8], [-44, 12, 2.4],
      [10, 34, 2.2], [-12, 58, 2.6], [46, 34, 2], [-4, 66, 2], [20, 64, 1.8], [-40, -64, 2.4], [0, -16, 1.6],
    ];
    rocks.forEach(([x, z, r], i) => this.rock(x, z, r, 20 + i));
    // the town in the middle: two rows of buildings with a main street and alleys
    this.building(-14, -4, 9, 7, 0, 1);
    this.building(-14, 12, 8, 7, 0, 2);
    this.building(14, -6, 8, 7, Math.PI, 3);
    this.building(15, 10, 9, 7, Math.PI, 4);
    this.building(-2, 26, 7, 6, Math.PI / 2, 5);
    // wrecks
    this.wreck(-24, -26, 0.6, 1);
    this.wreck(24, 22, -0.9, 2);
    this.wreck(-38, 60, 1.4, 3);
    this.wreck(40, -46, 0.3, 4);
    this.wreck(6, 48, 2.1, 5);
    // fences
    this.fence(-40, -4, -28, -4);
    this.fence(28, 4, 42, 4);
    this.fence(-10, -54, 4, -48);
    this.fence(-20, 30, -20, 40);
    // cacti
    const cacti: [number, number][] = [[-50, -60], [-26, -60], [22, -60], [50, -40], [-50, 32], [50, 18], [-22, 64], [38, 66], [-4, -28], [26, -16], [-30, 18], [8, 58], [-52, -38], [24, 38], [-36, 28], [48, -12]];
    cacti.forEach(([x, z], i) => this.cactus(x, z, 40 + i));
    // barrels: the loaded guns of the arena, placed where cops bunch up
    const barrels: [number, number][] = [[-4, 4], [4, 18], [-20, -36], [22, -40], [-18, 50], [36, 42], [-44, -2], [44, -18]];
    barrels.forEach(([x, z]) => this.barrel(x, z));
    // two ramps, down the long axis
    this.ramp(0, -38, Math.PI);
    this.ramp(0, 42, 0);
  }

  /** Put broken things back, a while after they broke. */
  respawn(dt: number, clear: (x: number, z: number) => boolean) {
    for (const p of this.props) {
      if (p.alive) continue;
      p.respawn -= dt;
      if (p.respawn <= 0 && clear(p.shape.x, p.shape.z)) {
        p.alive = true;
        p.mesh.visible = true;
        p.mesh.scale.setScalar(1);
        if (!this.shapes.includes(p.shape)) this.shapes.push(p.shape);
      }
    }
  }
  breakProp(p: Prop) {
    p.alive = false;
    p.mesh.visible = false;
    p.respawn = p.kind === 'barrel' ? 14 : 20;
    const i = this.shapes.indexOf(p.shape);
    if (i >= 0) this.shapes.splice(i, 1);
  }
  resetProps() {
    for (const p of this.props) {
      p.alive = true;
      p.mesh.visible = true;
      if (!this.shapes.includes(p.shape)) this.shapes.push(p.shape);
    }
  }
}

export type { Box, Circle };
