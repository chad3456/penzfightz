import * as THREE from 'three';
import { Ink, toon } from './ink';
import type { Input } from './input';
import { buildDeity, buildNandi, buildTemple, type Temple } from './temples';
import type { Biome, Site, Task } from './types';

/**
 * One site, as a level: the land of its biome, its temple, its deity, and the
 * task that earns the darshan — lamps to light in order, offerings to gather,
 * water to carry, a climb that the altitude makes hard, a demon to hold off,
 * bells to ring in time, something to carry without letting it tip, or the
 * priest's questions. Difficulty (1–5) sets the counts, the clocks, the thin
 * air and the demon's strength.
 *
 * Every temple can also be watched rising in a time-lapse, plinth to finial,
 * over the beats of its history.
 */

export type Status = 'intro' | 'play' | 'quiz' | 'won' | 'lost' | 'lapse';

export interface Hud {
  status: Status;
  title: string;
  detail: string;
  progress: [number, number];
  label: string;
  hearts?: [number, number];
  foe?: [number, number];
  stamina?: number;
  tilt?: number;
  timeLeft?: number;
  rhythm?: { pos: number; zone: [number, number]; near: boolean } | null;
  message?: string;
  prompt?: string;
  beat?: { when: string; what: string; i: number; n: number } | null;
}

interface Look { ground: string; paper: string; fog: [number, number]; tree: 'palm' | 'pine' | 'round' | 'none'; trees: number; water: 'river' | 'sea' | 'island' | 'tank' | 'none'; far: 'snow' | 'hills' | 'none' }
const LOOKS: Record<Biome, Look> = {
  coast: { ground: '#e3d3a5', paper: '#f1e8d2', fog: [35, 110], tree: 'palm', trees: 26, water: 'sea', far: 'none' },
  river: { ground: '#b7c08b', paper: '#eee8d2', fog: [35, 110], tree: 'round', trees: 24, water: 'river', far: 'none' },
  snow: { ground: '#d3d9dc', paper: '#eeece6', fog: [25, 95], tree: 'pine', trees: 34, water: 'none', far: 'snow' },
  hills: { ground: '#b3b889', paper: '#eee8d2', fog: [30, 105], tree: 'round', trees: 30, water: 'tank', far: 'hills' },
  forest: { ground: '#8ea56f', paper: '#e9e8d4', fog: [22, 85], tree: 'round', trees: 70, water: 'tank', far: 'hills' },
  city: { ground: '#cbbfa8', paper: '#f0e7d4', fog: [35, 110], tree: 'round', trees: 10, water: 'tank', far: 'none' },
  island: { ground: '#e3d3a5', paper: '#eee9d6', fog: [35, 110], tree: 'palm', trees: 20, water: 'island', far: 'none' },
  plains: { ground: '#c8c38d', paper: '#f1e9d2', fog: [40, 120], tree: 'round', trees: 18, water: 'tank', far: 'none' },
  desert: { ground: '#e0c490', paper: '#f3e7cc', fog: [40, 120], tree: 'none', trees: 0, water: 'none', far: 'hills' },
};

const TEMPLE_Z = -8;
const START = new THREE.Vector3(0, 0, 21);

function rnd(seed: number) { let s = seed >>> 0 || 1; return () => ((s = (s * 16807) % 2147483647) / 2147483647); }
const hashId = (id: string) => { let h = 7; for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };

/* a little sound: bells and chimes, synthesised */
let actx: AudioContext | null = null;
function chime(freq = 880, dur = 1.2, gain = 0.08) {
  try {
    actx ||= new AudioContext();
    const c = actx; const t = c.currentTime;
    for (const [m, g] of [[1, 1], [2.76, 0.4], [5.4, 0.18]] as [number, number][]) {
      const o = c.createOscillator(); const a = c.createGain();
      o.frequency.value = freq * m; o.type = 'sine';
      a.gain.setValueAtTime(0.0001, t); a.gain.exponentialRampToValueAtTime(gain * g, t + 0.01); a.gain.exponentialRampToValueAtTime(0.0001, t + dur / m ** 0.3);
      o.connect(a).connect(c.destination); o.start(t); o.stop(t + dur);
    }
  } catch { /* no sound, no matter */ }
}

export class Level {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(50, 1, 0.1, 400);
  status: Status = 'intro';
  private before: Status = 'intro';
  private player = new THREE.Group();
  private body!: THREE.Object3D;
  private trishul!: THREE.Object3D;
  private carried = new THREE.Group();
  private temple: Temple;
  private templeRoot = new THREE.Group();
  private shrine = new THREE.Vector3();
  private solids: { x: number; z: number; w: number; d: number }[] = [];
  private task: Task;
  private diff: number;
  private look: Look;
  private R: () => number;
  private t = 0;
  private walk = 0;
  private facing = Math.PI;
  private heightAt: (x: number, z: number) => number = () => 0;
  // task state
  private count: number;
  private done = 0;
  private timeLeft = 0;
  private items: THREE.Object3D[] = [];
  private sources: THREE.Vector3[] = [];
  private holding = 0;
  private lamps: { o: THREE.Group; lit: boolean }[] = [];
  private stamina = 1;
  private shelters: THREE.Vector3[] = [];
  private hearts = 5;
  private maxHearts = 5;
  private foe: THREE.Group | null = null;
  private foeHp = 0;
  private foeWind = 0;
  private foeCool = 0;
  private foeStun = 0;
  private atkCool = 0;
  private atkAnim = 0;
  private hurt = 0;
  private rhythm = 0;
  private misses = 0;
  private bell: THREE.Object3D | null = null;
  private bellSwing = 0;
  private tilt = 0;
  private tiltV = 0;
  private quizRight = 0;
  private quizAsked = 0;
  private message = '';
  private burst: THREE.Mesh | null = null;
  // time-lapse
  private lapseT = 0;
  private lapseDur = 10;
  private lapseMeshes: { m: THREE.Object3D; o: number; s: THREE.Vector3 }[] = [];
  private pillar: THREE.Mesh | null = null;

  constructor(private ink: Ink, private input: Input, public site: Site) {
    this.task = site.task;
    this.diff = site.difficulty;
    this.look = LOOKS[site.biome];
    this.R = rnd(hashId(site.id));
    this.count = site.task.count ?? 1;
    this.scene.background = new THREE.Color(this.look.paper);
    this.scene.add(new THREE.HemisphereLight('#fff6e8', '#8f8068', 1.5));
    const sun = new THREE.DirectionalLight('#fff0d8', 1.7);
    sun.position.set(-10, 18, 8);
    this.scene.add(sun);
    this.temple = buildTemple(site);
    this.buildLand();
    this.buildTemple();
    this.buildPlayer();
    this.setupTask();
    this.placePlayer(START.clone());
    this.camera.position.set(0, 7, START.z + 10);
  }

  /* ─────────────────────────── the land ─────────────────────────── */
  private buildLand() {
    const L = this.look;
    const trek = this.task.kind === 'trek';
    const maxH = trek ? 3 + this.diff * 2.2 : 0;
    if (trek) {
      const f = (z: number) => { const t = Math.max(0, Math.min(1, (20 - z) / 30)); return t * t * (3 - 2 * t); };
      this.heightAt = (x, z) => maxH * f(z) * (1 - Math.min(1, Math.abs(x - Math.sin(z * 0.22) * 4) / 40) * 0.4);
    }
    const n = trek ? 90 : 2;
    const g = new THREE.PlaneGeometry(90, 90, n, n);
    g.rotateX(-Math.PI / 2);
    if (trek) { const pos = g.attributes.position!; for (let i = 0; i < pos.count; i++) pos.setY(i, this.heightAt(pos.getX(i), pos.getZ(i))); g.computeVertexNormals(); }
    const ground = new THREE.Mesh(g, toon(L.ground));
    if (L.water === 'island') {
      const isl = new THREE.Mesh(new THREE.CircleGeometry(27, 48), toon(L.ground));
      isl.rotation.x = -Math.PI / 2; isl.position.y = 0.01; this.scene.add(isl);
      const sea = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), toon('#7ea8b6'));
      sea.rotation.x = -Math.PI / 2; sea.position.y = -0.05; this.scene.add(sea);
      for (let i = 0; i < 40; i++) { const a = (i / 40) * Math.PI * 2; this.sources.push(new THREE.Vector3(Math.cos(a) * 25.5, 0, Math.sin(a) * 25.5)); }
    } else this.scene.add(ground);
    if (trek) {
      // the path, and shelters along it
      const path = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(Array.from({ length: 30 }, (_, i) => { const z = 20 - i * 1.1; const x = Math.sin(z * 0.22) * 4; return new THREE.Vector3(x, this.heightAt(x, z) + 0.05, z); })), 120, 0.7, 4, false), toon('#b9a88a'));
      path.scale.y = 0.2;
      path.position.y = 0.05;
      this.scene.add(path);
      // boulders and moraine on the slope, so the climb reads
      const rockG = new THREE.DodecahedronGeometry(1, 0);
      const Rk = this.R;
      for (let i = 0; i < 70; i++) {
        const z = 22 - Rk() * 44, x = (Rk() - 0.5) * 60;
        if (Math.abs(x - Math.sin(z * 0.22) * 4) < 3) continue;
        const s = 0.3 + Rk() * Rk() * 1.8;
        const r = new THREE.Mesh(rockG, toon(Rk() < 0.5 ? '#7d7b78' : '#96918a'));
        r.scale.set(s * (1 + Rk()), s * 0.7, s);
        r.rotation.set(Rk() * 3, Rk() * 3, Rk() * 3);
        r.position.set(x, this.heightAt(x, z) + s * 0.2, z);
        this.scene.add(r);
        if (s > 1) this.solids.push({ x, z, w: s * 1.6, d: s * 1.6 });
      }
    }
    const R = this.R;
    // water
    if (L.water === 'river') {
      const w = new THREE.Mesh(new THREE.PlaneGeometry(120, 7), toon('#6f9fb4'));
      w.rotation.x = -Math.PI / 2; w.position.set(0, 0.03, 13); this.scene.add(w);
      for (let i = 0; i < 6; i++) { const st = new THREE.Mesh(new THREE.BoxGeometry(14, 0.25, 0.9), toon('#c9b48e')); st.position.set(0, 0.12 + i * 0.12, 9.1 - i * 0.9); this.scene.add(st); }
      for (let x = -9; x <= 9; x += 3) this.sources.push(new THREE.Vector3(x, 0, 10.2));
      const bridge = new THREE.Mesh(new THREE.BoxGeometry(3, 0.3, 8), toon('#8a6a4a')); bridge.position.set(0, 0.2, 13); this.scene.add(bridge);
    } else if (L.water === 'sea') {
      const sea = new THREE.Mesh(new THREE.PlaneGeometry(80, 200), toon('#7ea8b6'));
      sea.rotation.x = -Math.PI / 2; sea.position.set(56, 0.03, 0); this.scene.add(sea);
      for (let z = -12; z <= 18; z += 4) this.sources.push(new THREE.Vector3(15, 0, z));
    } else if (L.water === 'tank' || (this.task.kind === 'water' && L.water === 'none')) {
      const tk = new THREE.Group(); tk.position.set(-12, 0, 8);
      for (let i = 0; i < 4; i++) { const s = 7 - i * 1.2; const st = new THREE.Mesh(new THREE.BoxGeometry(s, 0.2, s), toon(i % 2 ? '#bfae90' : '#a99a80')); st.position.y = -i * 0.2; tk.add(st); }
      const wt = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6), toon('#5f95ab')); wt.rotation.x = -Math.PI / 2; wt.position.y = 0.05; tk.add(wt);
      this.scene.add(tk);
      for (const [dx, dz] of [[-3.8, 0], [3.8, 0], [0, -3.8], [0, 3.8]]) this.sources.push(new THREE.Vector3(-12 + dx!, 0, 8 + dz!));
      this.solids.push({ x: -12, z: 8, w: 5.2, d: 5.2 });
    }
    // the far distance
    if (L.far !== 'none') {
      for (let i = 0; i < 18; i++) {
        const a = (i / 18) * Math.PI * 2 + R() * 0.3;
        const d = 55 + R() * 25;
        const h = L.far === 'snow' ? 22 + R() * 24 : 8 + R() * 10;
        const m = new THREE.Mesh(new THREE.ConeGeometry(h * 0.9, h, 5), toon(L.far === 'snow' ? '#a7a6a4' : '#9fa47e'));
        m.position.set(Math.cos(a) * d, h / 2 - 1, Math.sin(a) * d);
        this.scene.add(m);
        if (L.far === 'snow') { const c = new THREE.Mesh(new THREE.ConeGeometry(h * 0.42, h * 0.46, 5), toon('#f6f5f1')); c.position.set(m.position.x, h - 1 - h * 0.23, m.position.z); this.scene.add(c); }
      }
    }
    // trees, houses, dunes
    const treeAt = (x: number, z: number, s: number) => {
      const y = this.heightAt(x, z);
      const grp = new THREE.Group(); grp.position.set(x, y, z); grp.scale.setScalar(s);
      if (L.tree === 'palm') {
        const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 4, 6), toon('#8a6a4a')); tr.position.y = 2; tr.rotation.z = 0.15; grp.add(tr);
        for (let k = 0; k < 6; k++) { const lf = new THREE.Mesh(new THREE.ConeGeometry(0.3, 2.4, 4), toon('#5d8a4f')); lf.position.set(Math.cos(k) * 0.9 + 0.3, 3.9, Math.sin(k) * 0.9); lf.rotation.set(Math.sin(k) * 1.2, 0, Math.cos(k) * 1.2 + 1.2); grp.add(lf); }
      } else if (L.tree === 'pine') {
        const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 1, 5), toon('#5a4030')); tr.position.y = 0.5; grp.add(tr);
        for (let k = 0; k < 3; k++) { const c = new THREE.Mesh(new THREE.ConeGeometry(1.1 - k * 0.3, 1.6, 7), toon('#3f5a48')); c.position.y = 1.4 + k * 0.9; grp.add(c); }
      } else if (L.tree === 'round') {
        const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, 2, 6), toon('#6a4e36')); tr.position.y = 1; grp.add(tr);
        const c = new THREE.Mesh(new THREE.IcosahedronGeometry(1.4, 0), toon(R() < 0.5 ? '#6f9056' : '#86a064')); c.position.y = 2.8; grp.add(c);
      }
      this.scene.add(grp);
    };
    for (let i = 0; i < L.trees; i++) {
      const a = R() * Math.PI * 2; const d = 16 + R() * 26;
      const x = Math.cos(a) * d, z = Math.sin(a) * d;
      if (L.water === 'sea' && x > 13) continue;
      if (L.water === 'river' && z > 8 && z < 18) continue;
      if (L.water === 'island' && d > 25) continue;
      if (Math.abs(x) < 3 && z > 0) continue;
      if (z > 15 && Math.abs(x) < 17) continue; // keep the camera's side of the field open
      treeAt(x, z, 0.8 + R() * 0.6);
      this.solids.push({ x, z, w: 0.6, d: 0.6 });
    }
    if (this.site.biome === 'city') {
      const cols = ['#e2c9a0', '#d9a878', '#c7b8a0', '#e8d9bd', '#b98a6a'];
      for (let i = 0; i < 22; i++) {
        const a = (i / 22) * Math.PI * 2; const d = 26 + R() * 6;
        if (Math.sin(a) * d > 8) continue; // none behind the pilgrim, where the camera is
        const w = 4 + R() * 3, hh = 3 + R() * 5, dd = 4 + R() * 2;
        const hs = new THREE.Mesh(new THREE.BoxGeometry(w, hh, dd), toon(cols[i % cols.length]!));
        hs.position.set(Math.cos(a) * d, hh / 2, Math.sin(a) * d); hs.rotation.y = -a; this.scene.add(hs);
        const rf = new THREE.Mesh(new THREE.BoxGeometry(w + 0.3, 0.3, dd + 0.3), toon('#8a5a3a')); rf.position.set(hs.position.x, hh, hs.position.z); rf.rotation.y = -a; this.scene.add(rf);
      }
    }
    if (this.site.biome === 'desert') for (let i = 0; i < 14; i++) { const a = R() * Math.PI * 2, d = 22 + R() * 30; const dn = new THREE.Mesh(new THREE.SphereGeometry(6 + R() * 6, 12, 8), toon('#d9b981')); dn.scale.y = 0.25; dn.position.set(Math.cos(a) * d, 0, Math.sin(a) * d); this.scene.add(dn); }
    if (this.site.biome === 'plains') for (let i = 0; i < 8; i++) { const f = new THREE.Mesh(new THREE.PlaneGeometry(8, 5), toon(i % 2 ? '#d7c97a' : '#a9b86a')); f.rotation.x = -Math.PI / 2; f.position.set(-30 + (i % 4) * 9, 0.02, 20 + Math.floor(i / 4) * 6 - 36); this.scene.add(f); }
  }

  private buildTemple() {
    const T = this.temple;
    const y0 = this.heightAt(0, TEMPLE_Z);
    this.templeRoot.position.set(0, y0, TEMPLE_Z);
    this.templeRoot.add(T.group);
    this.scene.add(this.templeRoot);
    this.shrine.copy(T.shrine).add(this.templeRoot.position);
    const deity = buildDeity(this.site, this.site.kind === 'jyotirlinga');
    deity.position.copy(this.shrine);
    this.scene.add(deity);
    if (this.site.kind === 'jyotirlinga' || this.site.kind === 'linga') {
      const nandi = buildNandi();
      nandi.position.set(0, y0, this.shrine.z + 5.5);
      this.scene.add(nandi);
      this.solids.push({ x: 0, z: this.shrine.z + 5.5, w: 1.8, d: 2.2 });
    }
    // solid parts: the sanctum and hall, roughly
    const s = this.site.style;
    if (s === 'cave') this.solids.push({ x: 0, z: TEMPLE_Z - 5, w: 20, d: 12 });
    else if (s === 'natural') this.solids.push({ x: 0, z: TEMPLE_Z + (this.site.id === 'kurukshetra' ? -3 : 1), w: this.site.id === 'kurukshetra' ? 3 : 3.2, d: 3 });
    else if (s === 'modern') this.solids.push({ x: 0, z: TEMPLE_Z - 2, w: 10.4, d: 10.4 });
    else {
      this.solids.push({ x: 0, z: TEMPLE_Z - 3, w: 5.4, d: 5.4 }, { x: 0, z: TEMPLE_Z + 1.4, w: 6.2, d: 4.8 });
      if (s === 'dravida' || s === 'rock') {
        this.solids.push({ x: -2.4, z: TEMPLE_Z + 11, w: 2.6, d: 3.2 }, { x: 2.4, z: TEMPLE_Z + 11, w: 2.6, d: 3.2 }, { x: 0, z: TEMPLE_Z - 11, w: 26, d: 0.8 }, { x: -13, z: TEMPLE_Z, w: 0.8, d: 22 }, { x: 13, z: TEMPLE_Z, w: 0.8, d: 22 }, { x: -8.5, z: TEMPLE_Z + 11, w: 9, d: 0.8 }, { x: 8.5, z: TEMPLE_Z + 11, w: 9, d: 0.8 });
      }
      if (s === 'rock') this.solids.push({ x: 0, z: TEMPLE_Z - 14, w: 30, d: 3 }, { x: -15, z: TEMPLE_Z - 3, w: 3, d: 24 }, { x: 15, z: TEMPLE_Z - 3, w: 3, d: 24 });
    }
  }

  private buildPlayer() {
    const saffron = toon('#e08a2e');
    const skin = toon('#8a5a3a');
    const body = new THREE.Group();
    const torso = new THREE.Mesh(new THREE.ConeGeometry(0.45, 1.3, 10), saffron); torso.position.y = 0.75; body.add(torso);
    const cloth = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.46, 0.5, 10), toon('#f0e6d2')); cloth.position.y = 0.25; body.add(cloth);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 10), skin); head.position.y = 1.58; body.add(head);
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), toon('#2a2220')); hair.position.set(0, 1.78, 0.02); hair.scale.set(0.8, 0.6, 0.8); body.add(hair);
    const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2, 5), toon('#5a3a1a')); staff.position.set(0.42, 1.0, 0); body.add(staff);
    this.body = body;
    this.player.add(body);
    // the trishul, for the demon
    const tri = new THREE.Group();
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 2.2, 6), toon('#6a6a6a')); tri.add(shaft);
    for (const x of [-0.18, 0, 0.18]) { const p = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.4, 5), toon('#c9c9c9')); p.position.set(x, 1.25 + (x === 0 ? 0.1 : 0), 0); tri.add(p); }
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.05, 0.05), toon('#c9c9c9')); bar.position.y = 1.08; tri.add(bar);
    tri.position.set(0.45, 1.1, -0.2);
    tri.visible = false;
    this.trishul = tri;
    this.player.add(tri);
    this.carried.position.set(0, 1.9, -0.35);
    this.player.add(this.carried);
    this.scene.add(this.player);
  }

  /* ─────────────────────────── the task ─────────────────────────── */
  private itemMesh(kind: string) {
    const g = new THREE.Group();
    const add = (geom: THREE.BufferGeometry, c: string, x: number, y: number, z: number, e?: string) => { const m = new THREE.Mesh(geom, toon(c, e, 0.35)); m.position.set(x, y, z); g.add(m); return m; };
    switch (kind) {
      case 'jasmine': for (const [x, z] of [[0, 0], [0.15, 0.08], [-0.12, 0.1]]) add(new THREE.SphereGeometry(0.12, 8, 6), '#fbfaf4', x!, 0.4, z!, '#ffffff'); break;
      case 'lotus': add(new THREE.CircleGeometry(0.45, 12), '#4f7a4a', 0, 0.06, 0).rotation.x = -Math.PI / 2; for (let k = 0; k < 6; k++) { const p = add(new THREE.ConeGeometry(0.1, 0.4, 4), '#ee8fb0', Math.cos(k) * 0.12, 0.25, Math.sin(k) * 0.12); p.rotation.set(Math.sin(k) * 0.5, 0, Math.cos(k) * 0.5); } break;
      case 'bilva': case 'tulsi': for (const a of [0, 2.1, 4.2]) { const l = add(new THREE.SphereGeometry(0.16, 8, 6), '#3f7a3f', Math.cos(a) * 0.14, 0.35, Math.sin(a) * 0.14); l.scale.set(0.6, 0.25, 1); l.rotation.y = a; } break;
      case 'clay': add(new THREE.SphereGeometry(0.22, 10, 8), '#8a5a3a', 0, 0.3, 0); break;
      case 'hibiscus': add(new THREE.ConeGeometry(0.22, 0.3, 5), '#d42a2a', 0, 0.35, 0).rotation.x = Math.PI; add(new THREE.SphereGeometry(0.05, 6, 4), '#f2c14e', 0, 0.42, 0); break;
      case 'butter': add(new THREE.SphereGeometry(0.24, 10, 8), '#a9573a', 0, 0.3, 0); add(new THREE.SphereGeometry(0.16, 10, 8), '#fbf6e4', 0, 0.5, 0); break;
      case 'sweet': add(new THREE.SphereGeometry(0.16, 10, 8), '#f2b73a', 0, 0.3, 0); add(new THREE.SphereGeometry(0.13, 10, 8), '#f2b73a', 0.18, 0.28, 0.05); break;
      default: add(new THREE.SphereGeometry(0.2, 10, 8), '#f29a1a', 0, 0.35, 0, '#ffb347'); break;
    }
    const ring = add(new THREE.TorusGeometry(0.5, 0.03, 6, 20), '#f2d27a', 0, 0.04, 0, '#f2d27a');
    ring.rotation.x = Math.PI / 2;
    return g;
  }

  private freeSpot(minD: number, maxD: number) {
    const R = this.R;
    for (let tries = 0; tries < 60; tries++) {
      const a = R() * Math.PI * 2; const d = minD + R() * (maxD - minD);
      const x = Math.cos(a) * d, z = TEMPLE_Z + 4 + Math.sin(a) * d;
      if (Math.abs(x) > 30 || z > 28 || z < -28) continue;
      if (this.blocked(x, z, 1.2)) continue;
      if (this.look.water === 'sea' && x > 13) continue;
      if (this.look.water === 'river' && z > 9 && z < 17) continue;
      if (this.look.water === 'island' && Math.hypot(x, z) > 23) continue;
      return new THREE.Vector3(x, this.heightAt(x, z), z);
    }
    return new THREE.Vector3(0, 0, 14);
  }

  private setupTask() {
    const k = this.task.kind;
    const d = this.diff;
    const slow = 1.25 - d * 0.08;
    if (k === 'offer') {
      for (let i = 0; i < this.count; i++) { const p = this.freeSpot(7, 24); const m = this.itemMesh(this.task.item ?? 'flower'); m.position.copy(p); this.scene.add(m); this.items.push(m); }
      this.timeLeft = 45 + this.count * 7 * slow;
    } else if (k === 'water') {
      for (const s of this.sources) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.05, 6, 24), toon('#dff1f6', '#bfe8f5', 0.4)); r.rotation.x = Math.PI / 2; r.position.set(s.x, this.heightAt(s.x, s.z) + 0.08, s.z); r.userData.ripple = true; this.scene.add(r); this.items.push(r); }
      const pot = this.itemMesh('pot'); pot.children.forEach((c) => (c.visible = false));
      const brass = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 8), toon('#c99a3a')); const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.2, 10), toon('#c99a3a')); neck.position.y = 0.3;
      this.carried.add(brass, neck); this.carried.visible = false;
      this.timeLeft = 50 + this.count * 12 * slow;
    } else if (k === 'lamps') {
      const n = this.count;
      for (let i = 0; i < n; i++) {
        const a = -Math.PI / 2 + (i / n) * Math.PI * 1.9;
        const r = 9 + (i % 2) * 1.8 + i * 0.25;
        const x = Math.cos(a) * r, z = this.shrine.z + 2 + Math.sin(a) * r;
        const lx = this.blocked(x, z, 0.8) ? x * 1.3 : x;
        const o = new THREE.Group(); o.position.set(lx, this.heightAt(lx, z), z);
        const diya = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.12, 0.12, 10), toon('#b5652e')); diya.position.y = 0.3;
        const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.12, 0.3, 8), toon('#8a6a3a')); stand.position.y = 0.12;
        const flame = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.24, 8), toon('#ffb347', '#ff9a2a', 1.2)); flame.position.y = 0.48; flame.visible = false; flame.name = 'flame';
        const halo = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.035, 6, 24), toon('#f2d27a', '#f2d27a', 0.8)); halo.rotation.x = Math.PI / 2; halo.position.y = 0.04; halo.name = 'halo'; halo.visible = false;
        o.add(diya, stand, flame, halo);
        this.scene.add(o);
        this.lamps.push({ o, lit: false });
      }
      this.timeLeft = 30 + n * 5.5 * slow;
    } else if (k === 'trek') {
      const n = this.count;
      for (let i = 1; i <= n; i++) {
        const z = 20 - (i / (n + 1)) * 26; const x = Math.sin(z * 0.22) * 4 + 2.4;
        const y = this.heightAt(x, z);
        const hut = new THREE.Group(); hut.position.set(x, y, z);
        const w = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.2, 1.4), toon('#b89a78')); w.position.y = 0.6;
        const rf = new THREE.Mesh(new THREE.ConeGeometry(1.4, 0.9, 4), toon('#7a5a3a')); rf.position.y = 1.65; rf.rotation.y = Math.PI / 4;
        hut.add(w, rf);
        this.scene.add(hut);
        this.shelters.push(new THREE.Vector3(x, y, z));
      }
      this.stamina = 1;
    } else if (k === 'demon') {
      this.maxHearts = this.hearts = 6 - Math.ceil(d / 2);
      this.foeHp = this.count;
      this.foe = this.buildFoe();
      this.foe.position.set(0, 0, this.shrine.z + 7);
      this.scene.add(this.foe);
      this.trishul.visible = true;
      this.body.children[4]!.visible = false;
    } else if (k === 'bells') {
      const arch = new THREE.Group(); arch.position.set(3.2, this.shrine.y, this.shrine.z + 1.5);
      for (const x of [-0.8, 0.8]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 2.6, 6), toon('#6a4a2a')); p.position.set(x, 1.3, 0); arch.add(p); }
      const bar = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.12, 0.12), toon('#6a4a2a')); bar.position.y = 2.6; arch.add(bar);
      const bell = new THREE.Group(); bell.position.y = 2.55;
      const b = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.42, 0.6, 14, 1, true), new THREE.MeshToonMaterial({ color: '#c99a3a', side: THREE.DoubleSide })); b.position.y = -0.4; bell.add(b);
      const tongue = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), toon('#8a6a2a')); tongue.position.y = -0.62; bell.add(tongue);
      arch.add(bell);
      this.bell = bell;
      this.scene.add(arch);
      this.solids.push({ x: 3.2, z: this.shrine.z + 1.5, w: 2, d: 0.4 });
    } else if (k === 'carry') {
      const l = new THREE.Group();
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.36, 0.14, 16), toon('#4a4642'));
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.16, 0.42, 16), toon('#2f2c2a')); shaft.position.y = 0.28;
      const top = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), toon('#2f2c2a')); top.position.y = 0.49;
      l.add(base, shaft, top);
      this.carried.add(l);
      this.carried.position.set(0, 1.75, -0.45);
    }
  }

  private buildFoe() {
    const g = new THREE.Group();
    const ink = toon('#2a2226');
    const add = (geom: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number, sx = 1, sy = 1, sz = 1) => { const me = new THREE.Mesh(geom, m); me.position.set(x, y, z); me.scale.set(sx, sy, sz); g.add(me); return me; };
    add(new THREE.SphereGeometry(1, 14, 10), ink, 0, 1.9, 0, 1.1, 1.3, 0.9);
    add(new THREE.SphereGeometry(0.62, 14, 10), ink, 0, 3.45, 0.05);
    for (const s of [-1, 1]) {
      const horn = add(new THREE.ConeGeometry(0.16, 0.9, 6), toon('#d9cfbf'), s * 0.45, 4.1, 0); horn.rotation.z = -s * 0.5;
      add(new THREE.SphereGeometry(0.1, 8, 6), toon('#ff3a1a', '#ff2a0a', 1.4), s * 0.22, 3.55, 0.55);
      const arm = add(new THREE.CylinderGeometry(0.22, 0.28, 1.8, 8), ink, s * 1.35, 2.2, 0.1); arm.rotation.z = s * 0.5;
      const leg = add(new THREE.CylinderGeometry(0.3, 0.34, 1.2, 8), ink, s * 0.5, 0.6, 0); void leg;
    }
    const mace = add(new THREE.SphereGeometry(0.42, 10, 8), toon('#6a6a6a'), 2.0, 1.4, 0.4);
    mace.name = 'mace';
    g.userData.mat = ink;
    return g;
  }

  /* ─────────────────────────── moving about ─────────────────────────── */
  private blocked(x: number, z: number, r: number) {
    for (const s of this.solids) if (Math.abs(x - s.x) < s.w / 2 + r && Math.abs(z - s.z) < s.d / 2 + r) return true;
    return false;
  }

  private placePlayer(p: THREE.Vector3) {
    this.player.position.set(p.x, this.groundY(p.x, p.z), p.z);
  }

  private groundY(x: number, z: number) {
    let y = this.heightAt(x, z);
    // walk up onto the temple plinth
    const T = this.templeRoot.position;
    if (this.site.style !== 'cave' && this.site.style !== 'natural' && Math.abs(x) < 6 && z > T.z - 7 && z < T.z + 5.4) y = Math.max(y, T.y + this.temple.shrine.y);
    return y;
  }

  private moveBy(dx: number, dz: number) {
    const p = this.player.position;
    const r = 0.45;
    let nx = p.x + dx, nz = p.z + dz;
    for (const s of this.solids) {
      const hx = s.w / 2 + r, hz = s.d / 2 + r;
      const ox = hx - Math.abs(nx - s.x), oz = hz - Math.abs(nz - s.z);
      if (ox > 0 && oz > 0) { if (ox < oz) nx += Math.sign(nx - s.x || 1) * ox; else nz += Math.sign(nz - s.z || 1) * oz; }
    }
    if (this.look.water === 'island') { const d = Math.hypot(nx, nz); if (d > 26) { nx *= 26 / d; nz *= 26 / d; } }
    if (this.look.water === 'sea') nx = Math.min(nx, 16.5);
    nx = Math.max(-34, Math.min(34, nx));
    nz = Math.max(-30, Math.min(30, nz));
    p.x = nx; p.z = nz;
    p.y = this.groundY(nx, nz);
  }

  /* ─────────────────────────── the loop ─────────────────────────── */
  begin() {
    if (this.status === 'intro' || this.status === 'lost') this.status = 'play';
    if (this.task.kind === 'quiz') this.message = 'Walk to the shrine to meet the priest.';
  }

  retry() {
    const s = this.site;
    const fresh = new Level(this.ink, this.input, s);
    return fresh;
  }

  resize(w: number, h: number) { this.camera.aspect = w / h; this.camera.fov = w < h ? 64 : 50; this.camera.updateProjectionMatrix(); }

  update(dt: number, t: number, action: boolean) {
    this.t = t;
    if (this.status === 'lapse') return this.updateLapse(dt);
    const play = this.status === 'play';
    const mv = this.input.move;
    let speed = 5.2;
    const k = this.task.kind;
    if (k === 'trek') speed *= this.stamina > 0.02 ? 1 : 0.25;
    if (k === 'carry') speed = 3.4;
    let vx = mv.x, vz = -mv.y;
    if (k === 'carry' && play) vx = 0;
    if (this.hurt > 0) { this.hurt -= dt; }
    if ((play || this.status === 'intro' || this.status === 'won') && Math.hypot(vx, vz) > 0.05 && this.status !== 'intro') {
      const y0 = this.player.position.y;
      this.moveBy(vx * speed * dt, vz * speed * dt);
      this.facing = Math.atan2(vx, vz);
      this.walk += dt * 11;
      if (k === 'trek' && play) {
        const climb = Math.max(0, this.player.position.y - y0);
        this.stamina = Math.max(0, this.stamina - dt * (0.018 + this.diff * 0.012) - climb * (0.05 + this.diff * 0.02));
      }
    } else if (k === 'trek' && play) {
      const nearHut = this.shelters.some((s) => s.distanceTo(this.player.position) < 3);
      this.stamina = Math.min(1, this.stamina + dt * (nearHut ? 0.45 : 0.07));
    }
    this.player.rotation.y += ((this.facing - this.player.rotation.y + Math.PI * 3) % (Math.PI * 2) - Math.PI) * Math.min(1, dt * 12);
    this.body.position.y = Math.abs(Math.sin(this.walk)) * 0.06;
    // the camera follows from behind and above
    const p = this.player.position;
    const camH = k === 'trek' ? 7 : 6;
    const want = new THREE.Vector3(p.x * 0.85, p.y + camH, p.z + 9.5);
    this.camera.position.lerp(want, Math.min(1, dt * 3));
    const ahead = k === 'trek' ? Math.max(p.y + 1.4, this.heightAt(p.x, p.z - 7) + 1) : p.y + 1.4;
    this.camera.lookAt(p.x * 0.9, ahead, p.z - 4);
    // things that move by themselves
    for (const it of this.items) { if (it.userData.ripple) { const s = 1 + ((t * 0.8 + it.position.x) % 1) * 0.6; it.scale.set(s, s, 1); } else { it.rotation.y += dt; it.position.y = this.heightAt(it.position.x, it.position.z) + Math.sin(t * 2 + it.position.x) * 0.08; } }
    for (const l of this.lamps) { const f = l.o.getObjectByName('flame'); if (f && f.visible) f.scale.y = 1 + Math.sin(t * 17 + l.o.position.x) * 0.15; }
    if (this.bell) { this.bellSwing *= Math.pow(0.1, dt); this.bell.rotation.z = Math.sin(t * 9) * this.bellSwing; }
    if (this.burst) { this.burst.scale.multiplyScalar(1 + dt * 2.5); (this.burst.material as THREE.MeshBasicMaterial).opacity *= Math.pow(0.2, dt); }
    if (!play) return;
    if (this.timeLeft > 0 && (k === 'offer' || k === 'water' || k === 'lamps')) {
      this.timeLeft -= dt;
      if (this.timeLeft <= 0) return this.lose(k === 'lamps' ? 'The lamps were not lit in time.' : 'The darshan time is over.');
    }
    const nearShrine = p.distanceTo(this.shrine) < 2.9;
    if (k === 'offer') {
      for (let i = this.items.length - 1; i >= 0; i--) {
        const it = this.items[i]!;
        if (it.position.distanceTo(p) < 1.5) { this.scene.remove(it); this.items.splice(i, 1); this.holding++; chime(1320, 0.4, 0.04); }
      }
      if (nearShrine && this.holding > 0) { this.done += this.holding; this.holding = 0; chime(660, 1.2); }
      if (this.done >= this.count) this.win();
    } else if (k === 'water') {
      if (!this.holding && this.sources.some((s) => Math.hypot(s.x - p.x, s.z - p.z) < 2.0)) { this.holding = 1; this.carried.visible = true; chime(990, 0.5, 0.04); }
      if (this.holding && nearShrine) { this.holding = 0; this.carried.visible = false; this.done++; chime(660, 1.2); if (this.done >= this.count) this.win(); }
    } else if (k === 'lamps') {
      const next = this.lamps.find((l) => !l.lit);
      for (const l of this.lamps) { const h = l.o.getObjectByName('halo'); if (h) h.visible = l === next; }
      if (next && next.o.position.distanceTo(p) < 1.6) {
        next.lit = true; next.o.getObjectByName('flame')!.visible = true; this.done++;
        chime(880 + this.done * 30, 0.9, 0.05);
        if (this.done >= this.count) this.win();
      }
    } else if (k === 'trek') {
      this.done = this.shelters.filter((s) => s.z >= p.z).length;
      if (p.distanceTo(this.shrine) < 3.2) this.win();
    } else if (k === 'demon') this.updateDemon(dt, action);
    else if (k === 'bells') {
      this.rhythm = (this.rhythm + dt * (0.55 + this.diff * 0.12)) % 2;
      const near = this.bell ? p.distanceTo(this.bell.getWorldPosition(new THREE.Vector3()).setY(p.y)) < 3.6 : false;
      if (action && near) {
        const pos = this.rhythmPos();
        const [a, b] = this.zone();
        this.bellSwing = 0.5;
        if (pos >= a && pos <= b) { this.done++; chime(740, 1.6, 0.09); if (this.done >= this.count) this.win(); }
        else { this.misses++; chime(420, 0.3, 0.03); if (this.misses > 7 - this.diff) this.lose('The rhythm slipped. Listen, and try again.'); }
      }
    } else if (k === 'carry') {
      this.tiltV += (Math.sin(t * 1.3 + this.R() * 0.2) * 0.9 + (this.R() - 0.5) * 3) * dt * (0.35 + this.diff * 0.16);
      if (Math.hypot(mv.y, 0) > 0.05) this.tiltV += Math.sin(t * 7) * dt * (0.2 + this.diff * 0.08);
      this.tiltV -= mv.x * dt * 2.6;
      this.tiltV *= Math.pow(0.55, dt);
      this.tilt += this.tiltV * dt * 2;
      this.carried.rotation.z = this.tilt * 0.7;
      this.done = Math.round(Math.max(0, Math.min(1, (START.z - p.z) / (START.z - this.shrine.z))) * 100);
      if (Math.abs(this.tilt) > 1) return this.lose('It touched the ground — and there it stays. Try again.');
      if (nearShrine) { this.done = 100; this.win(); }
    } else if (k === 'quiz') {
      if (nearShrine) { this.status = 'quiz'; this.message = ''; }
    }
  }

  private rhythmPos() { const r = this.rhythm; return r < 1 ? r : 2 - r; }
  private zone(): [number, number] { const w = 0.24 - this.diff * 0.03; return [0.5 - w / 2, 0.5 + w / 2]; }

  private updateDemon(dt: number, action: boolean) {
    const f = this.foe!;
    const p = this.player.position;
    this.atkCool -= dt; this.foeCool -= dt; this.foeStun -= dt;
    this.atkAnim = Math.max(0, this.atkAnim - dt);
    this.trishul.position.z = -0.2 - (this.atkAnim > 0 ? Math.sin((this.atkAnim / 0.25) * Math.PI) * 0.9 : 0);
    this.trishul.rotation.x = this.atkAnim > 0 ? -1.2 : -0.1;
    const dx = p.x - f.position.x, dz = p.z - f.position.z;
    const d = Math.hypot(dx, dz);
    f.rotation.y = Math.atan2(dx, dz);
    if (this.foeStun <= 0 && this.foeWind <= 0 && d > 1.9) {
      const sp = (2.2 + this.diff * 0.35) * dt;
      f.position.x += (dx / d) * sp; f.position.z += (dz / d) * sp;
    }
    f.position.y = Math.abs(Math.sin(this.t * 4)) * 0.15;
    // the demon winds up, then strikes
    const mat = f.userData.mat as THREE.MeshToonMaterial;
    if (this.foeWind > 0) {
      this.foeWind -= dt;
      mat.color.set(this.foeWind > 0 ? '#6a1a1a' : '#2a2226');
      if (this.foeWind <= 0) {
        this.foeCool = 1.3 - this.diff * 0.1;
        if (d < 2.6 && this.hurt <= 0) {
          this.hearts--; this.hurt = 0.8; chime(160, 0.5, 0.08);
          this.moveBy((dx / d) * 2.5, (dz / d) * 2.5);
          if (this.hearts <= 0) return this.lose(`${this.task.foe ?? 'The demon'} was too strong this time.`);
        }
      }
    } else if (this.foeCool <= 0 && this.foeStun <= 0 && d < 2.2) this.foeWind = 0.75 - this.diff * 0.07;
    // the pilgrim strikes with the trishul
    if (action && this.atkCool <= 0) {
      this.atkCool = 0.42; this.atkAnim = 0.25;
      if (d < 3.0) {
        this.foeHp--; this.foeStun = 0.5; this.foeWind = 0; mat.color.set('#2a2226');
        f.position.x -= (dx / d) * 2.2; f.position.z -= (dz / d) * 2.2;
        chime(520, 0.5, 0.06);
        if (this.foeHp <= 0) { this.scene.remove(f); this.win(); }
      }
    }
  }

  answerQuiz(right: boolean) {
    this.quizAsked++;
    if (right) this.quizRight++;
    this.done = this.quizRight;
    const n = this.site.quiz?.length ?? 3;
    if (this.quizAsked >= n) { if (this.quizRight >= Math.ceil(n * 0.66)) this.win(); else this.lose('Not quite. Read the story in the diary and try again.'); }
  }

  private win() {
    if (this.status === 'won') return;
    this.status = 'won';
    chime(523, 2.4, 0.1); setTimeout(() => chime(784, 2.4, 0.08), 180);
    const m = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), new THREE.MeshBasicMaterial({ color: '#ffe3a0', transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending }));
    m.position.copy(this.shrine).add(new THREE.Vector3(0, 1, 0));
    this.scene.add(m);
    this.burst = m;
  }
  private lose(msg: string) { this.status = 'lost'; this.message = msg; }

  /* ─────────────────────────── the time-lapse ─────────────────────────── */
  startLapse() {
    if (this.status === 'lapse') return;
    this.before = this.status;
    this.status = 'lapse';
    this.lapseT = 0;
    const beats = this.site.timeline?.length ?? 2;
    this.lapseDur = Math.max(9, beats * 2.6);
    this.lapseMeshes = [];
    let lo = Infinity, hi = -Infinity;
    this.temple.group.traverse((o) => { if ((o as THREE.Mesh).isMesh) { const y = o.userData.order ?? o.position.y; lo = Math.min(lo, y); hi = Math.max(hi, y); } });
    this.temple.group.traverse((o) => { if ((o as THREE.Mesh).isMesh) this.lapseMeshes.push({ m: o, o: ((o.userData.order ?? o.position.y) - lo) / Math.max(0.01, hi - lo), s: o.scale.clone() }); });
    for (const x of this.lapseMeshes) x.m.scale.set(0.0001, 0.0001, 0.0001);
    if (this.site.kind === 'jyotirlinga' || this.site.kind === 'linga') {
      this.pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.9, 60, 20, 1, true), new THREE.MeshBasicMaterial({ color: '#ffd889', transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
      this.pillar.position.copy(this.shrine).add(new THREE.Vector3(0, 30, 0));
      this.scene.add(this.pillar);
    }
  }

  private updateLapse(dt: number) {
    this.lapseT += dt;
    const u = Math.min(1, this.lapseT / this.lapseDur);
    const build = Math.max(0, (u - 0.12) / 0.8);
    for (const x of this.lapseMeshes) {
      const k = Math.max(0, Math.min(1, (build * 1.1 - x.o) / 0.1));
      const e = k * k * (3 - 2 * k);
      x.m.scale.set(x.s.x * Math.max(0.0001, e), x.s.y * Math.max(0.0001, e), x.s.z * Math.max(0.0001, e));
    }
    if (this.pillar) { const m = this.pillar.material as THREE.MeshBasicMaterial; m.opacity = u < 0.15 ? 0.8 : Math.max(0, 0.8 - (u - 0.15) * 4); this.pillar.scale.x = this.pillar.scale.z = 1 + Math.sin(this.lapseT * 3) * 0.08; }
    // the camera circles
    const a = 0.6 + u * Math.PI * 1.3;
    const T = this.templeRoot.position;
    const r = 24 + this.temple.top * 0.4;
    this.camera.position.set(T.x + Math.sin(a) * r, T.y + 6 + this.temple.top * 0.35, T.z + Math.cos(a) * r);
    this.camera.lookAt(T.x, T.y + this.temple.top * 0.4, T.z);
    if (u >= 1 && this.lapseT > this.lapseDur + 1.2) this.endLapse();
  }

  endLapse() {
    if (this.status !== 'lapse') return;
    for (const x of this.lapseMeshes) x.m.scale.copy(x.s);
    if (this.pillar) { this.scene.remove(this.pillar); this.pillar = null; }
    this.status = this.before;
  }

  hud(): Hud {
    const k = this.task.kind;
    const base: Hud = { status: this.status, title: this.task.title, detail: this.task.detail, progress: [this.done, this.count], label: '', message: this.message };
    if (k === 'offer') { base.label = `Offered ${this.done} of ${this.count}${this.holding ? ` · carrying ${this.holding}` : ''}`; base.timeLeft = this.timeLeft; }
    if (k === 'water') { base.label = `Pots carried ${this.done} of ${this.count}${this.holding ? ' · take it to the shrine' : ' · fetch water'}`; base.timeLeft = this.timeLeft; }
    if (k === 'lamps') { base.label = `Lamps lit ${this.done} of ${this.count} · the next one glows`; base.timeLeft = this.timeLeft; }
    if (k === 'trek') { base.label = `Shelters passed ${this.done} of ${this.count}`; base.stamina = this.stamina; if (this.stamina < 0.05) base.prompt = 'Out of breath. Stand still, or rest at a shelter.'; }
    if (k === 'demon') { base.label = `${this.task.foe}`; base.hearts = [this.hearts, this.maxHearts]; base.foe = [Math.max(0, this.foeHp), this.count]; base.progress = [this.count - this.foeHp, this.count]; base.prompt = 'Strike with Space or ✦ when he is close — step away when he glows red.'; }
    if (k === 'bells') { const p = this.player.position; const near = this.bell ? p.distanceTo(this.bell.getWorldPosition(new THREE.Vector3()).setY(p.y)) < 3.6 : false; base.rhythm = { pos: this.rhythmPos(), zone: this.zone(), near }; base.label = `Rung in time ${this.done} of ${this.count}`; if (!near) base.prompt = 'Go to the bell beside the shrine.'; }
    if (k === 'carry') { base.tilt = this.tilt; base.progress = [this.done, 100]; base.label = 'Keep it level: steer with ← → while you walk forward'; }
    if (k === 'quiz') { base.progress = [this.quizRight, this.site.quiz?.length ?? 3]; base.label = 'Answer the priest'; }
    if (this.status === 'lapse') {
      const tl = this.site.timeline ?? [];
      const u = Math.min(0.999, this.lapseT / this.lapseDur);
      const i = Math.floor(u * tl.length);
      base.beat = tl.length ? { when: tl[i]![0], what: tl[i]![1], i, n: tl.length } : null;
    }
    return base;
  }

  render(t: number) {
    this.ink.look({ paper: this.look.paper, ink: '#241f1d', fogNear: this.look.fog[0], fogFar: this.look.fog[1], line: 1, frame: 0.03 });
    this.ink.render(this.scene, this.camera, t);
  }

  dispose() {
    this.scene.traverse((o) => { const m = o as THREE.Mesh; if (m.geometry && !m.userData.shared) m.geometry.dispose(); });
  }
}
