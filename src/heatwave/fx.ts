import * as THREE from 'three';

/**
 * Effects, all pooled: nothing is created or destroyed during a run.
 *
 * Soft particles — dust, drift smoke, fire, explosion smoke, sparks — are two
 * point clouds with a small shader (one normal, one additive), each a fixed
 * ring of slots that are simply overwritten oldest-first. Debris is one
 * instanced mesh of chunky pieces with their own tumbling physics. Screen
 * shake is trauma that decays; the popups are pooled DOM nodes.
 */

const VERT = `
  attribute float aSize; attribute float aAlpha; attribute vec3 aColor;
  varying float vAlpha; varying vec3 vColor;
  uniform float uScale;
  void main() {
    vAlpha = aAlpha; vColor = aColor;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * uScale / -mv.z;
    gl_Position = projectionMatrix * mv;
  }`;
const FRAG = `
  varying float vAlpha; varying vec3 vColor;
  void main() {
    vec2 p = gl_PointCoord - 0.5;
    float d = length(p);
    if (d > 0.5) discard;
    float a = vAlpha * smoothstep(0.5, 0.15, d);
    gl_FragColor = vec4(vColor, a);
  }`;

interface Spec {
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  life: number; size: number; grow: number;
  color: THREE.Color; alpha: number;
  drag?: number; gravity?: number;
}

class Cloud {
  points: THREE.Points;
  private n: number;
  private next = 0;
  private pos: Float32Array;
  private size: Float32Array;
  private alpha: Float32Array;
  private col: Float32Array;
  private vel: Float32Array;
  private life: Float32Array;
  private max: Float32Array;
  private grow: Float32Array;
  private a0: Float32Array;
  private drag: Float32Array;
  private grav: Float32Array;
  uniforms = { uScale: { value: 600 } };

  constructor(n: number, additive: boolean) {
    this.n = n;
    this.pos = new Float32Array(n * 3);
    this.size = new Float32Array(n);
    this.alpha = new Float32Array(n);
    this.col = new Float32Array(n * 3);
    this.vel = new Float32Array(n * 3);
    this.life = new Float32Array(n);
    this.max = new Float32Array(n).fill(1);
    this.grow = new Float32Array(n);
    this.a0 = new Float32Array(n);
    this.drag = new Float32Array(n);
    this.grav = new Float32Array(n);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    g.setAttribute('aSize', new THREE.BufferAttribute(this.size, 1));
    g.setAttribute('aAlpha', new THREE.BufferAttribute(this.alpha, 1));
    g.setAttribute('aColor', new THREE.BufferAttribute(this.col, 3));
    this.points = new THREE.Points(g, new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader: FRAG, uniforms: this.uniforms,
      transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    }));
    this.points.frustumCulled = false;
  }

  emit(s: Spec) {
    const i = this.next;
    this.next = (this.next + 1) % this.n;
    this.pos[i * 3] = s.x; this.pos[i * 3 + 1] = s.y; this.pos[i * 3 + 2] = s.z;
    this.vel[i * 3] = s.vx; this.vel[i * 3 + 1] = s.vy; this.vel[i * 3 + 2] = s.vz;
    this.life[i] = s.life; this.max[i] = s.life;
    this.size[i] = s.size; this.grow[i] = s.grow;
    this.a0[i] = s.alpha; this.alpha[i] = s.alpha;
    this.col[i * 3] = s.color.r; this.col[i * 3 + 1] = s.color.g; this.col[i * 3 + 2] = s.color.b;
    this.drag[i] = s.drag ?? 1.5; this.grav[i] = s.gravity ?? 0;
  }

  update(dt: number) {
    for (let i = 0; i < this.n; i++) {
      if (this.life[i] <= 0) { this.alpha[i] = 0; continue; }
      this.life[i] -= dt;
      const k = Math.exp(-this.drag[i] * dt);
      this.vel[i * 3] *= k; this.vel[i * 3 + 1] = this.vel[i * 3 + 1] * k - this.grav[i] * dt; this.vel[i * 3 + 2] *= k;
      this.pos[i * 3] += this.vel[i * 3] * dt;
      this.pos[i * 3 + 1] = Math.max(0.05, this.pos[i * 3 + 1] + this.vel[i * 3 + 1] * dt);
      this.pos[i * 3 + 2] += this.vel[i * 3 + 2] * dt;
      this.size[i] += this.grow[i] * dt;
      const u = Math.max(0, this.life[i] / this.max[i]);
      this.alpha[i] = this.a0[i] * Math.min(1, u * 1.6);
    }
    const g = this.points.geometry;
    g.attributes.position!.needsUpdate = true;
    g.attributes.aSize!.needsUpdate = true;
    g.attributes.aAlpha!.needsUpdate = true;
    g.attributes.aColor!.needsUpdate = true;
  }

  clear() { this.life.fill(0); this.alpha.fill(0); }
}

/** Chunky pieces that fly, tumble, bounce once or twice, and shrink away. */
class Debris {
  mesh: THREE.InstancedMesh;
  private n: number;
  private next = 0;
  private p: Float32Array;
  private v: Float32Array;
  private r: Float32Array;
  private w: Float32Array;
  private life: Float32Array;
  private s: Float32Array;
  private m = new THREE.Matrix4();
  private q = new THREE.Quaternion();
  private e = new THREE.Euler();
  private vs = new THREE.Vector3();
  private vp = new THREE.Vector3();

  constructor(n: number) {
    this.n = n;
    this.mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial({ flatShading: true }), n);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled = false;
    for (let i = 0; i < n; i++) this.mesh.setColorAt(i, new THREE.Color('#ffffff'));
    this.p = new Float32Array(n * 3);
    this.v = new Float32Array(n * 3);
    this.r = new Float32Array(n * 3);
    this.w = new Float32Array(n * 3);
    this.life = new Float32Array(n);
    this.s = new Float32Array(n);
    this.mesh.count = n;
    for (let i = 0; i < n; i++) { this.m.makeScale(0, 0, 0); this.mesh.setMatrixAt(i, this.m); }
  }

  burst(x: number, y: number, z: number, count: number, speed: number, colors: string[], size = 0.45) {
    for (let k = 0; k < count; k++) {
      const i = this.next;
      this.next = (this.next + 1) % this.n;
      const a = Math.random() * Math.PI * 2;
      const up = 0.4 + Math.random() * 0.9;
      const sp = speed * (0.4 + Math.random() * 0.8);
      this.p.set([x, y, z], i * 3);
      this.v.set([Math.cos(a) * sp, up * speed * 0.8, Math.sin(a) * sp], i * 3);
      this.r.set([Math.random() * 6, Math.random() * 6, Math.random() * 6], i * 3);
      this.w.set([(Math.random() - 0.5) * 18, (Math.random() - 0.5) * 18, (Math.random() - 0.5) * 18], i * 3);
      this.life[i] = 1.6 + Math.random() * 1.2;
      this.s[i] = size * (0.5 + Math.random());
      this.mesh.setColorAt(i, new THREE.Color(colors[k % colors.length]));
    }
    this.mesh.instanceColor!.needsUpdate = true;
  }

  update(dt: number) {
    for (let i = 0; i < this.n; i++) {
      if (this.life[i] <= 0) continue;
      this.life[i] -= dt;
      const o = i * 3;
      this.v[o + 1]! -= 30 * dt;
      for (let k = 0; k < 3; k++) { this.p[o + k]! += this.v[o + k]! * dt; this.r[o + k]! += this.w[o + k]! * dt; }
      if (this.p[o + 1]! < this.s[i]! * 0.5) {
        this.p[o + 1] = this.s[i]! * 0.5;
        this.v[o + 1] = -this.v[o + 1]! * 0.35;
        this.v[o]! *= 0.6;
        this.v[o + 2]! *= 0.6;
        for (let k = 0; k < 3; k++) this.w[o + k]! *= 0.5;
      }
      const sc = this.s[i]! * Math.min(1, this.life[i]! / 0.5);
      this.e.set(this.r[o]!, this.r[o + 1]!, this.r[o + 2]!);
      this.q.setFromEuler(this.e);
      this.vp.set(this.p[o]!, this.p[o + 1]!, this.p[o + 2]!);
      this.vs.set(sc, sc * 0.7, sc * 1.2);
      this.m.compose(this.vp, this.q, this.vs);
      this.mesh.setMatrixAt(i, this.m);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  clear() {
    this.life.fill(0);
    for (let i = 0; i < this.n; i++) { this.m.makeScale(0, 0, 0); this.mesh.setMatrixAt(i, this.m); }
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}

const C = (s: string) => new THREE.Color(s);
const DUST = C('#e8c898');
const SMOKE = C('#8a8078');
const DARK = C('#3a3430');
const FIRE = C('#ff8a2a');
const FIRE2 = C('#ffd24a');
const SPARK = C('#fff2b0');
const TYRE = C('#d0c8c0');

export class FX {
  soft = new Cloud(700, false);
  glow = new Cloud(400, true);
  debris = new Debris(160);
  trauma = 0;
  zoomKick = 0;

  constructor(scene: THREE.Scene) {
    scene.add(this.soft.points, this.glow.points, this.debris.mesh);
  }

  setScale(px: number) {
    this.soft.uniforms.uScale.value = px;
    this.glow.uniforms.uScale.value = px;
  }

  dust(x: number, z: number, vx: number, vz: number, amt = 1) {
    this.soft.emit({ x: x + (Math.random() - 0.5), y: 0.3, z: z + (Math.random() - 0.5), vx: -vx * 0.1 + (Math.random() - 0.5) * 2, vy: 1 + Math.random(), vz: -vz * 0.1 + (Math.random() - 0.5) * 2, life: 0.9 + Math.random() * 0.6, size: 1.2 * amt, grow: 2.4, color: DUST, alpha: 0.45 * amt });
  }
  drift(x: number, z: number) {
    this.soft.emit({ x, y: 0.4, z, vx: (Math.random() - 0.5) * 2, vy: 1.4, vz: (Math.random() - 0.5) * 2, life: 1.1, size: 1.4, grow: 3.2, color: TYRE, alpha: 0.55 });
  }
  sparks(x: number, y: number, z: number, n: number, speed: number) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = speed * (0.4 + Math.random());
      this.glow.emit({ x, y, z, vx: Math.cos(a) * s, vy: 2 + Math.random() * 6, vz: Math.sin(a) * s, life: 0.25 + Math.random() * 0.3, size: 0.35, grow: -0.4, color: SPARK, alpha: 1, drag: 2.5, gravity: 18 });
    }
  }
  damageSmoke(x: number, y: number, z: number, heavy: boolean) {
    this.soft.emit({ x, y, z, vx: (Math.random() - 0.5), vy: 2.5, vz: (Math.random() - 0.5), life: 1.4, size: heavy ? 1.4 : 0.9, grow: 2.6, color: heavy ? DARK : SMOKE, alpha: heavy ? 0.7 : 0.45, drag: 0.8 });
  }
  explosion(x: number, z: number, big = 1) {
    for (let i = 0; i < 26 * big; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 4 + Math.random() * 9;
      this.glow.emit({ x, y: 1, z, vx: Math.cos(a) * s, vy: 2 + Math.random() * 7, vz: Math.sin(a) * s, life: 0.4 + Math.random() * 0.4, size: 2.2 + Math.random() * 2, grow: 3, color: Math.random() < 0.5 ? FIRE : FIRE2, alpha: 0.95, drag: 3 });
    }
    for (let i = 0; i < 18 * big; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 2 + Math.random() * 5;
      this.soft.emit({ x, y: 1.5, z, vx: Math.cos(a) * s, vy: 3 + Math.random() * 5, vz: Math.sin(a) * s, life: 1.4 + Math.random() * 1.2, size: 2.5, grow: 4, color: DARK, alpha: 0.75, drag: 1.4 });
    }
    this.sparks(x, 1, z, 24 * big, 14);
  }
  shake(amount: number) { this.trauma = Math.min(1, this.trauma + amount); }

  update(dt: number) {
    this.soft.update(dt);
    this.glow.update(dt);
    this.debris.update(dt);
    this.trauma = Math.max(0, this.trauma - dt * 1.8);
    this.zoomKick = Math.max(0, this.zoomKick - dt * 2.5);
  }

  clear() {
    this.soft.clear();
    this.glow.clear();
    this.debris.clear();
    this.trauma = 0;
    this.zoomKick = 0;
  }
}

/** Score popups: a pool of DOM nodes, reused. */
export class Popups {
  private pool: HTMLDivElement[] = [];
  private next = 0;
  private recent: { x: number; y: number; t: number }[] = [];
  constructor(private host: HTMLElement) {
    for (let i = 0; i < 10; i++) {
      const d = document.createElement('div');
      d.className = 'hw-pop';
      host.appendChild(d);
      this.pool.push(d);
    }
  }
  show(title: string, points: number | null, kind: 'smash' | 'combo' | 'near' | 'drift' | 'wanted' | 'bad', sx: number, sy: number) {
    const d = this.pool[this.next]!;
    this.next = (this.next + 1) % this.pool.length;
    d.className = `hw-pop hw-pop--${kind}`;
    d.innerHTML = `<b>${title}</b>${points != null ? `<span>+${points.toLocaleString('en-US')}</span>` : ''}`;
    const x = Math.max(120, Math.min(this.host.clientWidth - 120, sx));
    let y = Math.max(110, Math.min(this.host.clientHeight - 140, sy));
    // stack rather than pile: step down past anything still showing near here
    const now = performance.now();
    this.recent = this.recent.filter((r) => now - r.t < 700);
    for (let i = 0; i < 6 && this.recent.some((r) => Math.abs(r.x - x) < 150 && Math.abs(r.y - y) < 44); i++) y += 46;
    this.recent.push({ x, y, t: now });
    d.style.left = `${x}px`;
    d.style.top = `${y}px`;
    // restart the animation
    d.style.animation = 'none';
    void d.offsetWidth;
    d.style.animation = '';
  }
}
