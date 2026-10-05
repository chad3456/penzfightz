import * as THREE from 'three';
import { LIGHT_GLSL, U } from './shaders';

/**
 * People: one instanced mesh per body shape, animated in the vertex shader.
 * Each instance carries its own clothes and skin colours and a pose:
 * walking, standing, riding (seated with hands forward) or knocked flat.
 * One draw call for a whole crowd.
 */

export const enum Pose { walk = 0, stand = 1, fallen = 2, ride = 3, wave = 4, run = 5 }

// part ids: 0 torso (shirt), 1 left leg, 2 right leg, 3 left arm, 4 right arm, 5 head, 6 skirt (static, pants colour)
// colour slots: 0 shirt, 1 pants/saree, 2 skin, 3 hair, 4 shoes, 5 helmet/cap

function bodyGeo(kind: 'man' | 'woman') {
  const pos: number[] = [], nor: number[] = [], part: number[] = [], slot: number[] = [], idx: number[] = [];
  const add = (cx: number, cy: number, cz: number, sx: number, sy: number, sz: number, p: number, s: number, taper = 1) => {
    const faces: [number[], number[][]][] = [
      [[0, 1, 0], [[-1, 1, -1], [-1, 1, 1], [1, 1, 1], [1, 1, -1]]],
      [[0, -1, 0], [[-1, -1, 1], [-1, -1, -1], [1, -1, -1], [1, -1, 1]]],
      [[1, 0, 0], [[1, -1, -1], [1, 1, -1], [1, 1, 1], [1, -1, 1]]],
      [[-1, 0, 0], [[-1, -1, 1], [-1, 1, 1], [-1, 1, -1], [-1, -1, -1]]],
      [[0, 0, 1], [[1, -1, 1], [1, 1, 1], [-1, 1, 1], [-1, -1, 1]]],
      [[0, 0, -1], [[-1, -1, -1], [-1, 1, -1], [1, 1, -1], [1, -1, -1]]],
    ];
    for (const [n, vs] of faces) {
      const i0 = pos.length / 3;
      for (const v of vs) {
        const tt = v[1] > 0 ? taper : 1;
        pos.push(cx + (v[0] * sx * tt) / 2, cy + (v[1] * sy) / 2, cz + (v[2] * sz * tt) / 2);
        nor.push(n[0], n[1], n[2]); part.push(p); slot.push(s);
      }
      idx.push(i0, i0 + 1, i0 + 2, i0, i0 + 2, i0 + 3);
    }
  };
  // head, hair, neck
  add(0, 1.66, 0, 0.2, 0.24, 0.22, 5, 2);
  add(0, 1.79, -0.01, 0.22, 0.06, 0.24, 5, 3);
  add(0, 1.72, -0.07, 0.21, 0.14, 0.08, 5, 3);
  add(0, 1.52, 0, 0.09, 0.06, 0.09, 5, 2);
  if (kind === 'man') {
    add(0, 1.2, 0, 0.42, 0.6, 0.24, 0, 0);
    add(0, 0.92, 0, 0.4, 0.08, 0.23, 0, 1);
    add(-0.1, 0.46, 0, 0.16, 0.84, 0.18, 1, 1); add(0.1, 0.46, 0, 0.16, 0.84, 0.18, 2, 1);
    add(-0.1, 0.04, 0.04, 0.15, 0.08, 0.26, 1, 4); add(0.1, 0.04, 0.04, 0.15, 0.08, 0.26, 2, 4);
  } else {
    add(0, 1.24, 0, 0.36, 0.52, 0.22, 0, 0);
    // the saree (or a long kurta): a flared skirt from the waist, and the pallu over one shoulder
    add(0, 0.52, 0, 0.5, 0.96, 0.34, 6, 1, 0.68);
    add(0.12, 1.25, 0.005, 0.12, 0.56, 0.235, 0, 1);
    add(-0.08, 0.04, 0.04, 0.12, 0.08, 0.22, 1, 4); add(0.08, 0.04, 0.04, 0.12, 0.08, 0.22, 2, 4);
    add(0, 1.6, -0.14, 0.1, 0.1, 0.08, 5, 3); // a bun
  }
  const aw = kind === 'man' ? 0.29 : 0.25;
  add(-aw, 1.2, 0, 0.12, 0.56, 0.13, 3, 0); add(aw, 1.2, 0, 0.12, 0.56, 0.13, 4, 0);
  add(-aw, 0.88, 0.0, 0.1, 0.12, 0.1, 3, 2); add(aw, 0.88, 0.0, 0.1, 0.12, 0.1, 4, 2);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('aPart', new THREE.Float32BufferAttribute(part, 1));
  g.setAttribute('aSlot', new THREE.Float32BufferAttribute(slot, 1));
  g.setIndex(idx);
  return g;
}

const VS = /* glsl */ `
attribute float aPart; attribute float aSlot;
attribute vec3 iC0; attribute vec3 iC1; attribute vec3 iC2; attribute vec4 iAnim; // phase, amp, pose, helmet(0/1)
varying vec3 vCol; varying vec3 vN; varying vec3 vW;
mat3 rx(float a){ float c = cos(a), s = sin(a); return mat3(1.,0.,0., 0.,c,s, 0.,-s,c); }
void main(){
  vec3 p = position; vec3 n = normal;
  float ph = iAnim.x, amp = iAnim.y, pose = iAnim.z;
  float legA = 0.0, armA = 0.0, kneeLift = 0.0;
  if (pose < 0.5 || (pose > 4.5)) { legA = sin(ph) * amp; armA = -sin(ph) * amp * 0.8; }
  else if (pose > 2.5 && pose < 3.5) { legA = -1.45; armA = -1.15; }
  else if (pose > 3.5 && pose < 4.5) { armA = 0.0; }
  if (aPart > 0.5 && aPart < 2.5) {
    float a = aPart < 1.5 ? legA : -legA;
    if (pose > 2.5 && pose < 3.5) a = legA;
    vec3 piv = vec3(0.0, 0.9, 0.0);
    p = rx(a) * (p - piv) + piv; n = rx(a) * n;
    if (pose > 2.5 && pose < 3.5) { // shins hang down from the knee
      float kneeZ = 0.0;
      if (p.z > 0.38) { p.y -= (p.z - 0.38) ; p.z = 0.38 + (p.z - 0.38) * 0.1; }
    }
  } else if (aPart > 2.5 && aPart < 4.5) {
    float a = aPart < 3.5 ? armA : -armA;
    if (pose > 2.5 && pose < 3.5) a = armA;
    if (pose > 3.5 && pose < 4.5 && aPart > 3.5) a = -2.6 + sin(ph * 3.0) * 0.4;
    vec3 piv = vec3(0.0, 1.47, 0.0);
    p = rx(a) * (p - piv) + piv; n = rx(a) * n;
  }
  if (pose > 2.5 && pose < 3.5) { p.y -= 0.42; if (aPart > 5.5) { p.y += 0.2; p.z += 0.18; } }
  if (pose > 1.5 && pose < 2.5) { // flat on the ground, face up
    mat3 r = rx(-1.5);
    p = r * p; n = r * n; p.y += 0.14; p.z += 0.0;
  }
  vec3 c = aSlot < 0.5 ? iC0 : aSlot < 1.5 ? iC1 : aSlot < 2.5 ? iC2 : aSlot < 3.5 ? vec3(0.08, 0.07, 0.07) : vec3(0.15, 0.12, 0.1);
  if (aSlot > 2.5 && aSlot < 3.5 && iAnim.w > 0.5) c = vec3(0.9, 0.12, 0.1) * iAnim.w * 0.5 + vec3(0.1) * (1.0 - iAnim.w * 0.5);
  vCol = c;
  vec4 w = modelMatrix * instanceMatrix * vec4(p, 1.0);
  vW = w.xyz; vN = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * n);
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

const FS = /* glsl */ `
${LIGHT_GLSL}
varying vec3 vCol; varying vec3 vN; varying vec3 vW;
void main(){
  vec3 lit = shade(vCol, normalize(vN), 1.0);
  gl_FragColor = vec4(fogged(lit, vW), 1.0);
  #include <colorspace_fragment>
}`;

const SHIRTS = ['#f1f1ec', '#9fc5e8', '#2f4f7f', '#c0392b', '#f6d55c', '#3caea3', '#8e7cc3', '#e8e2d0', '#6d8b74', '#d4a373', '#1f1f1f', '#ef8354', '#7fb3d5', '#ffffff', '#b5838d'];
const PANTS = ['#2b2d42', '#3d405b', '#5c4d3c', '#1f2a44', '#6b705c', '#14213d', '#4a4e69', '#ddd8c4'];
const SAREES = ['#c1121f', '#ff9f1c', '#2a9d8f', '#7b2cbf', '#e76f51', '#e9c46a', '#0077b6', '#d81159', '#2d6a4f', '#f72585', '#ffd60a', '#6a4c93', '#118ab2'];
const SKINS = ['#8d5524', '#a0673f', '#b5794e', '#c68642', '#7a4a2a', '#d0a07a', '#9b6a45'];

export interface Look { kind: 'man' | 'woman'; c0: THREE.Color; c1: THREE.Color; c2: THREE.Color }

function col(hex: string) { const c = new THREE.Color(); c.setStyle(hex, THREE.LinearSRGBColorSpace); return c; }
export function randomLook(r: () => number, kind?: 'man' | 'woman'): Look {
  const k = kind ?? (r() < 0.6 ? 'man' : 'woman');
  const pick = (a: string[]) => a[Math.floor(r() * a.length)];
  return { kind: k, c0: col(k === 'man' ? pick(SHIRTS) : pick(SAREES.concat(SHIRTS.slice(0, 5)))), c1: col(k === 'man' ? pick(PANTS) : pick(SAREES)), c2: col(pick(SKINS)) };
}

export class Crowd {
  meshes: Record<'man' | 'woman', THREE.InstancedMesh>;
  attrs: Record<'man' | 'woman', { c0: THREE.InstancedBufferAttribute; c1: THREE.InstancedBufferAttribute; c2: THREE.InstancedBufferAttribute; anim: THREE.InstancedBufferAttribute }>;
  used = { man: 0, woman: 0 };
  constructor(public cap: number) {
    const mat = new THREE.ShaderMaterial({ uniforms: U, vertexShader: VS, fragmentShader: FS });
    const mk = (kind: 'man' | 'woman') => {
      const g = bodyGeo(kind);
      const c0 = new THREE.InstancedBufferAttribute(new Float32Array(cap * 3), 3), c1 = new THREE.InstancedBufferAttribute(new Float32Array(cap * 3), 3);
      const c2 = new THREE.InstancedBufferAttribute(new Float32Array(cap * 3), 3), anim = new THREE.InstancedBufferAttribute(new Float32Array(cap * 4), 4);
      for (const a of [c0, c1, c2, anim]) a.setUsage(THREE.DynamicDrawUsage);
      g.setAttribute('iC0', c0); g.setAttribute('iC1', c1); g.setAttribute('iC2', c2); g.setAttribute('iAnim', anim);
      const m = new THREE.InstancedMesh(g, mat, cap);
      m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      m.frustumCulled = false;
      m.count = 0;
      return { m, a: { c0, c1, c2, anim } };
    };
    const man = mk('man'), woman = mk('woman');
    this.meshes = { man: man.m, woman: woman.m };
    this.attrs = { man: man.a, woman: woman.a };
  }
  begin() { this.used.man = 0; this.used.woman = 0; }
  private m4 = new THREE.Matrix4(); private q = new THREE.Quaternion(); private e = new THREE.Euler(); private s = new THREE.Vector3(1, 1, 1); private p = new THREE.Vector3();
  /** Draw one person this frame. yaw: facing direction (0 = +z). */
  draw(look: Look, x: number, y: number, z: number, yaw: number, pose: Pose, phase: number, amp = 0.6, helmet = 0, pitch = 0, scale = 1) {
    const k = look.kind, i = this.used[k];
    if (i >= this.cap) return;
    this.used[k]++;
    this.e.set(pitch, yaw, 0, 'YXZ'); this.q.setFromEuler(this.e);
    this.p.set(x, y, z); this.s.setScalar(scale);
    this.m4.compose(this.p, this.q, this.s);
    const m = this.meshes[k], a = this.attrs[k];
    m.setMatrixAt(i, this.m4);
    a.c0.setXYZ(i, look.c0.r, look.c0.g, look.c0.b); a.c1.setXYZ(i, look.c1.r, look.c1.g, look.c1.b); a.c2.setXYZ(i, look.c2.r, look.c2.g, look.c2.b);
    a.anim.setXYZW(i, phase, amp, pose, helmet);
  }
  end() {
    for (const k of ['man', 'woman'] as const) {
      const m = this.meshes[k], a = this.attrs[k];
      m.count = this.used[k];
      m.instanceMatrix.needsUpdate = true;
      a.c0.needsUpdate = a.c1.needsUpdate = a.c2.needsUpdate = a.anim.needsUpdate = true;
    }
  }
}
