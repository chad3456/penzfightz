import * as THREE from 'three';
import { G, group, lam, put, textMat } from './kit';
import { Mascot, place, type Who } from './mascot';
import { POSES } from './poses';
import { FLOOR, HELD } from './props';
import type { Bout, Held, Setting, Spot } from './bouts';

/**
 * A round, as a toy on a stand: a round plinth in the colours of where it is
 * happening, a few things from that place behind, the two of them in front
 * with whatever the round needs between them, and a plaque with the number.
 *
 * The same scene and camera serve every round; a diorama is a group swapped
 * in and out, built from cached geometry, so a hundred of them in a row is
 * quick enough to make the thumbnails on the fly.
 */

interface Place { top: string; side: string; sky: [string, string]; decor: Spot[] }
export const SETTINGS: Record<Setting, Place> = {
  street: { top: '#d8c8a8', side: '#8a6a4a', sky: ['#ffd8a8', '#ffb07a'], decor: [['lamp', -2.6, -1.8], ['bush', 2.6, -1.9]] },
  desert: { top: '#eab878', side: '#b87a42', sky: ['#ffe0b0', '#f3a86a'], decor: [['cactus', -2.5, -1.8], ['rock', 2.5, -1.9], ['rock', 2.9, -0.6, 0, { color: '#9c4f2c' }]] },
  snow: { top: '#f4f8ff', side: '#9ab0c8', sky: ['#dff0ff', '#a8c8f0'], decor: [['pine', -2.6, -1.8], ['pine', 2.5, -2.0], ['pine', 2.95, -0.8]] },
  beach: { top: '#f4dca0', side: '#3a8ae8', sky: ['#c8f0ff', '#6ac8f8'], decor: [['palm', -2.6, -1.9], ['umbrellaF', 2.5, -1.8]] },
  stadium: { top: '#5ab84a', side: '#2a6a2a', sky: ['#bfe6ff', '#6aaee8'], decor: [['banner', 0, -2.4, 0, { text: 'INDIA VS INDIA', color: '#1a4aa8', alt: '#ffffff' }]] },
  hall: { top: '#c8a878', side: '#6a4a2a', sky: ['#f8ecd8', '#d8b890'], decor: [['column', -2.6, -1.9], ['column', 2.6, -1.9]] },
  kitchen: { top: '#e8e0d0', side: '#8a8a92', sky: ['#fff4e0', '#f8d8a8'], decor: [['crate', -2.6, -1.8, 0.3], ['crate', 2.7, -1.8, -0.2, { color: '#e8a84a' }]] },
  rooftop: { top: '#c8c0b8', side: '#6a6a72', sky: ['#ffe6a8', '#7ac8f8'], decor: [['crate', -2.6, -1.8, 0, { color: '#4a90d8' }]] },
  space: { top: '#9a968e', side: '#3a3a44', sky: ['#1a1440', '#050510'], decor: [['earth', 2.4, -2.2, 0, {}, 2.8], ['rock', -2.6, -1.8, 0, { color: '#8a867e' }]] },
  river: { top: '#4a9ae8', side: '#1a4a8a', sky: ['#e0f4ff', '#8ad0f8'], decor: [['tree', -2.8, -1.8]] },
  mela: { top: '#e8b878', side: '#a8423a', sky: ['#ffd0e8', '#ff9ab8'], decor: [['wheel', 0, -2.5]] },
  garden: { top: '#7ac85a', side: '#4a7a2a', sky: ['#e8fff0', '#9ae0c8'], decor: [['tree', -2.6, -1.9], ['bush', 2.6, -1.8]] },
  studio: { top: '#3a3a4a', side: '#1a1a24', sky: ['#4a3a8a', '#1a1a3a'], decor: [['tv', 0, -2.4, 0, { text: 'BIG DEBATE\nLIVE', color: '#c8231e' }]] },
  gym: { top: '#6a8ab8', side: '#2a3a5a', sky: ['#f0f0f8', '#c8c8d8'], decor: [['crate', -2.6, -1.8, 0, { color: '#2a2a30' }]] },
  station: { top: '#b8b0a0', side: '#6a5a4a', sky: ['#fff0d0', '#e8b87a'], decor: [['sign', -2.5, -1.9, 0, { text: 'PLATFORM 1', color: '#e8d21a', alt: '#111111' }]] },
  stage: { top: '#8a3a2a', side: '#4a1a14', sky: ['#5a1a4a', '#1a0a24'], decor: [['lamp', -2.7, -1.8], ['lamp', 2.7, -1.8, Math.PI]] },
  road: { top: '#5a5a62', side: '#3a3a40', sky: ['#ffe8c0', '#ffb88a'], decor: [['sign', 2.6, -1.8, 0, { text: 'VIKAS 0 KM', color: '#1a6a3a', alt: '#ffffff' }], ['bush', -2.7, -1.9]] },
  rain: { top: '#6a8a6a', side: '#3a4a3a', sky: ['#a8b8c8', '#6a7a8a'], decor: [['cloud', -1.2, -1.5, 0, {}, 3.6], ['cloud', 1.4, -1.8, 0, {}, 3.9]] },
  night: { top: '#5a4a7a', side: '#2a1a4a', sky: ['#2a2a6a', '#0a0a24'], decor: [['lamp', -2.7, -1.8]] },
  office: { top: '#c8b89a', side: '#6a5a44', sky: ['#f0f4f8', '#c8d8e8'], decor: [['bush', -2.7, -1.9]] },
  farm: { top: '#c8a852', side: '#6a5a2a', sky: ['#fff4c0', '#b8e0f8'], decor: [['tree', 2.7, -1.9]] },
};

function gradient(a: string, b: string) {
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = 256;
  const g = c.getContext('2d')!;
  const gr = g.createLinearGradient(0, 0, 0, 256);
  gr.addColorStop(0, a);
  gr.addColorStop(1, b);
  g.fillStyle = gr;
  g.fillRect(0, 0, 4, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const skies = new Map<string, THREE.Texture>();

function buildFloor(parent: THREE.Object3D, s: Spot) {
  const [kind, x, z, ry = 0, opts = {}, y = 0] = s;
  let o: THREE.Object3D;
  if (kind === 'umbrellaF') {
    o = HELD.umbrella!({ color: '#ff5a5a' });
    o.scale.setScalar(1.6);
  } else {
    const make = FLOOR[kind] || HELD[kind];
    if (!make) throw new Error('no prop ' + kind);
    o = make(opts);
  }
  o.position.set(x, y, z);
  o.rotation.y = ry;
  o.userData.kind = kind;
  o.traverse((c) => { if ((c as THREE.Mesh).isMesh) { c.castShadow = true; c.receiveShadow = true; } });
  parent.add(o);
  return o;
}

function held(h: Held) {
  const [kind, opts] = typeof h === 'string' ? [h, {}] : h;
  const make = HELD[kind];
  if (!make) throw new Error('no held prop ' + kind);
  return make(opts);
}

export class Diorama {
  group = new THREE.Group();
  m: Mascot;
  r: Mascot;
  private flyers: { obj: THREE.Object3D; from: Mascot; to: Mascot; off: number }[] = [];
  private tethers: { mesh: THREE.Mesh; a: () => THREE.Vector3; b: () => THREE.Vector3 }[] = [];
  private spin: THREE.Object3D[] = [];
  private tmpA = new THREE.Vector3();
  private tmpB = new THREE.Vector3();

  constructor(public bout: Bout) {
    const set = SETTINGS[bout.set];
    const g = this.group;
    // the stand
    put(g, G.cyl(3.3, 3.45, 0.5, 40), lam(set.side, false), [0, -0.25, 0]).receiveShadow = true;
    const top = put(g, G.cyl(3.3, 3.3, 0.02, 40), lam(set.top, false), [0, 0.0, 0]);
    top.receiveShadow = true;
    put(g, G.tor(3.32, 0.05, Math.PI * 2, 48), lam('#f2c230'), [0, 0, 0], [Math.PI / 2, 0, 0]);
    const plaque = group(g, [0, 0.2, 2.9], [-0.45, 0, 0]);
    put(plaque, G.box(1.5, 0.34, 0.04), lam('#f2c230'));
    const face = new THREE.Mesh(G.plane(1.42, 0.28), textMat(`ROUND ${bout.n}`, '#2a1a10', '#f2c230', 512, 100));
    face.position.z = 0.021;
    plaque.add(face);
    if (bout.set === 'road') for (let i = -2; i <= 2; i++) put(g, G.box(0.5, 0.01, 0.12), lam('#f4f0e0'), [i * 1.1, 0.015, 1.4]);
    if (bout.set === 'rain') for (let i = 0; i < 30; i++) put(g, G.box(0.015, 0.3, 0.015), lam('#bfe0ff'), [Math.sin(i * 7.1) * 3, 0.8 + ((i * 0.53) % 2.8), Math.cos(i * 3.7) * 2]);
    if (bout.set === 'space' || bout.set === 'night') for (let i = 0; i < 40; i++) put(g, G.sph(0.03, 4, 3), lam('#ffffff'), [Math.sin(i * 12.3) * 6, 3 + ((i * 0.71) % 3), -3 - ((i * 0.37) % 2)]);
    for (const d of [...set.decor, ...(bout.props || [])]) {
      const o = buildFloor(g, d);
      if (d[0] === 'wheel') this.spin.push(o);
    }
    // the two of them
    this.m = new Mascot('m', bout.m.look);
    this.r = new Mascot('r', bout.r.look);
    place(this.m, bout.m.at || [-1.15, 0.2, 0.75]);
    place(this.r, bout.r.at || [1.15, 0.2, -0.75]);
    for (const [who, mm] of [['m', this.m], ['r', this.r]] as const) {
      const side = bout[who];
      mm.setFace(side.face);
      if (side.hold) mm.hold(held(side.hold), 1);
      if (side.holdL) mm.hold(held(side.holdL), 0);
      mm.root.traverse((c) => { if ((c as THREE.Mesh).isMesh) c.castShadow = true; });
      g.add(mm.root);
    }
    // things in flight
    if (bout.fly) {
      const f = bout.fly;
      const pairs: [Mascot, Mascot, number][] = f.from === 'm' ? [[this.m, this.r, 0]] : f.from === 'r' ? [[this.r, this.m, 0]] : [[this.m, this.r, 0], [this.r, this.m, 1]];
      for (const [from, to, off] of pairs) {
        const obj = held(f.prop);
        g.add(obj);
        this.flyers.push({ obj, from, to, off });
      }
    }
    // strings and ropes
    const hand = (mm: Mascot, i: 0 | 1) => () => mm.arms[i].hand.getWorldPosition(new THREE.Vector3());
    if (bout.tether === 'rope') this.tether(hand(this.m, 1), hand(this.r, 1), 0.05, '#c8a060');
    if (bout.tether === 'kites') {
      const kites = g.children.filter((c) => c.userData.kind === 'kite');
      [this.m, this.r].forEach((mm, i) => { const k = kites[i]; if (k) this.tether(hand(mm, 1), () => k.getWorldPosition(new THREE.Vector3()), 0.008, '#ffffff'); });
    }
    this.update(0.8);
  }

  private tether(a: () => THREE.Vector3, b: () => THREE.Vector3, r: number, color: string) {
    const mesh = new THREE.Mesh(G.cyl(r, r, 1, 6), lam(color));
    this.group.add(mesh);
    this.tethers.push({ mesh, a, b });
  }

  /** Time in seconds; `speaking` makes that one talk with their head. */
  update(t: number, speaking?: Who) {
    for (const [who, mm] of [['m', this.m], ['r', this.r]] as const) {
      const side = this.bout[who];
      const lt = t + (side.phase ?? (who === 'm' ? 0 : 0.7));
      const j = POSES[side.pose](lt);
      if (speaking === who) { j.nod += Math.sin(t * 11) * 0.06; j.y += Math.abs(Math.sin(t * 5.5)) * 0.03; }
      mm.pose(j);
      mm.root.position.y += side.lift || 0;
      // blink every few seconds
      mm.blink((lt % 3.3) < 0.1);
    }
    this.group.updateMatrixWorld(true);
    for (const f of this.flyers) {
      // released at the top of each two-second throw, lands 0.9 s later
      const side = this.bout[f.from.who];
      const lt = t + (side.phase ?? (f.from.who === 'm' ? 0 : 0.7)) + f.off;
      const p = (((lt % 2) + 2) % 2) / 2;
      const k = p >= 0.72 ? (p - 0.72) / 0.45 : p < 0.17 ? (p + 0.28) / 0.45 : -1;
      if (k < 0 || k > 1) {
        f.obj.visible = false;
        continue;
      }
      f.obj.visible = true;
      const a = f.from.arms[1].hand.getWorldPosition(this.tmpA);
      const b = f.to.head.getWorldPosition(this.tmpB);
      b.y += 0.5;
      f.obj.position.lerpVectors(a, b, k);
      f.obj.position.y += Math.sin(k * Math.PI) * 1.2;
      f.obj.rotation.set(k * 8, k * 5, 0);
    }
    for (const tt of this.tethers) {
      const a = tt.a();
      const b = tt.b();
      const len = a.distanceTo(b);
      tt.mesh.position.copy(a).add(b).multiplyScalar(0.5);
      tt.mesh.scale.set(1, len, 1);
      tt.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
    }
    for (const s of this.spin) s.rotation.z = t * 0.3;
  }
}

/** The shared scene: lights, a sky, a camera, and a slot for one diorama. */
export class Stage {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(30, 1, 0.5, 60);
  current: Diorama | null = null;
  yaw = 0;
  private sun: THREE.DirectionalLight;

  constructor() {
    const hemi = new THREE.HemisphereLight('#fff4e0', '#b88a6a', 1.7);
    this.sun = new THREE.DirectionalLight('#fff0d8', 2.1);
    this.sun.position.set(-4, 9, 6);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(1024, 1024);
    const sc = this.sun.shadow.camera;
    sc.left = -5; sc.right = 5; sc.top = 5; sc.bottom = -5; sc.near = 1; sc.far = 25;
    this.sun.shadow.bias = -0.0008;
    this.scene.add(hemi, this.sun);
  }

  show(b: Bout) {
    if (this.current) this.scene.remove(this.current.group);
    this.current = new Diorama(b);
    this.scene.add(this.current.group);
    const sky = SETTINGS[b.set].sky;
    const k = sky.join();
    if (!skies.has(k)) skies.set(k, gradient(sky[0], sky[1]));
    this.scene.background = skies.get(k)!;
    return this.current;
  }

  frame(aspect: number) {
    this.camera.aspect = aspect;
    // in portrait, widen the lens and back off until both of them fit across
    this.camera.fov = aspect >= 1 ? 30 : Math.min(52, 30 / aspect ** 0.6);
    const dist = Math.max(8.6, 4.6 / (2 * Math.tan((this.camera.fov * Math.PI) / 360) * aspect));
    this.camera.position.set(Math.sin(this.yaw) * dist, 2.55 + (aspect < 1 ? (dist - 8.6) * 0.18 : 0), Math.cos(this.yaw) * dist);
    this.camera.lookAt(0, 0.9, 0);
    this.camera.updateProjectionMatrix();
  }
}

export function makeRenderer(canvas: HTMLCanvasElement | undefined, preserve = false) {
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: preserve });
  r.outputColorSpace = THREE.SRGBColorSpace;
  r.toneMapping = THREE.NeutralToneMapping;
  r.shadowMap.enabled = true;
  r.shadowMap.type = THREE.PCFShadowMap;
  return r;
}
