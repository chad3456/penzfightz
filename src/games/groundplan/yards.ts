import * as THREE from 'three';
import type { Block } from './blocks';
import type { Zone } from './buildings';
import type { Terrain } from './terrain';

/**
 * What is inside a block, behind the buildings.
 *
 * Lots only line the frontages — that is what a lot is — so a big block has a
 * hole in the middle of it, and left alone that hole is countryside showing
 * through the city. Real blocks have yards, car parks, service lanes and the
 * odd tree back there, and from the air the difference between "mown, walked
 * on, parked in" and "a field" is most of what tells you a place is inhabited.
 *
 * So the interior gets a surface of its own, and a park block gets the same
 * surface with the dial turned all the way to green and a few hundred trees
 * standing in it.
 */

const INSET = 5.5;

export class Ground {
  readonly group = new THREE.Group();
  private mesh: THREE.Mesh | null = null;
  private trees: THREE.InstancedMesh | null = null;
  readonly material: THREE.MeshStandardMaterial;
  private treeMaterial: THREE.MeshStandardMaterial;

  constructor(private terrain: Terrain) {
    this.material = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95 });
    this.material.onBeforeCompile = (s) => {
      s.vertexShader = s.vertexShader
        .replace('#include <common>', '#include <common>\nattribute float aPark;\nvarying float vPark;\nvarying vec3 vW;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvPark = aPark;\nvW = position;');
      s.fragmentShader = s.fragmentShader
        .replace('#include <common>', `#include <common>
varying float vPark;
varying vec3 vW;
float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vn(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y);
}`)
        .replace('#include <color_fragment>', `#include <color_fragment>
{
  float n = vn(vW.xz * 0.09) * 0.6 + vn(vW.xz * 0.31) * 0.3;
  // A yard is gravel and hard standing with grass where nobody drives; a park
  // is the same field with the gravel taken out of it.
  vec3 gravel = mix(vec3(0.36, 0.35, 0.335), vec3(0.47, 0.46, 0.44), n);
  vec3 grass = mix(vec3(0.28, 0.36, 0.20), vec3(0.40, 0.47, 0.26), n);
  float green = mix(smoothstep(0.42, 0.62, n), 1.0, vPark);
  vec3 col = mix(gravel, grass, green);
  // Bays painted on the hard standing, and only there.
  float bay = step(0.86, fract(vW.x * 0.4)) * step(0.5, fract(vW.z * 0.09));
  col = mix(col, col * 1.5, bay * (1.0 - green) * 0.35);
  diffuseColor.rgb *= col;
}`);
    };

    this.treeMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, flatShading: true });
  }

  build(blocks: Block[], zoneAt: (x: number, z: number) => Zone | null) {
    this.clear();
    const pos: number[] = [];
    const park: number[] = [];
    const idx: number[] = [];
    const seeds: { x: number; z: number; park: number }[] = [];

    for (const b of blocks) {
      const ring = shrink(b.ring, INSET);
      if (ring.length < 3) continue;
      const isPark = zoneAt(centre(ring).x, centre(ring).z) === 'park' ? 1 : 0;
      const flat = ring.map((p) => new THREE.Vector2(p.x, p.z));
      let faces: number[][];
      try {
        faces = THREE.ShapeUtils.triangulateShape(flat, []);
      } catch {
        continue;
      }
      const base = pos.length / 3;
      for (const p of ring) {
        pos.push(p.x, this.terrain.height(p.x, p.z) + 0.06, p.z);
        park.push(isPark);
      }
      // The winding that comes back is the contour's, and the contour is the
      // block ring, which faces down. Same reversal as the roads.
      for (const f of faces) idx.push(base + f[0], base + f[2], base + f[1]);

      // Trees: thick in a park, an occasional survivor in a yard.
      const want = isPark ? Math.round(b.area / 260) : Math.round(b.area / 2600);
      scatter(ring, want, (x, z) => {
        if (this.terrain.height(x, z) > 0.6) seeds.push({ x, z, park: isPark });
      });
    }

    if (idx.length) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      geo.setAttribute('aPark', new THREE.Float32BufferAttribute(park, 1));
      geo.setIndex(idx);
      geo.computeVertexNormals();
      geo.computeBoundingSphere();
      this.mesh = new THREE.Mesh(geo, this.material);
      this.mesh.receiveShadow = true;
      this.group.add(this.mesh);
    }

    if (seeds.length) this.buildTrees(seeds);
  }

  private buildTrees(seeds: { x: number; z: number; park: number }[]) {
    const g = treeGeometry();
    const inst = new THREE.InstancedMesh(g, this.treeMaterial, seeds.length);
    inst.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(seeds.length * 3), 3);
    const o = new THREE.Object3D();
    const c = new THREE.Color();
    seeds.forEach((s, i) => {
      const k = 0.7 + Math.random() * 0.75 + s.park * 0.15;
      o.position.set(s.x, this.terrain.height(s.x, s.z), s.z);
      o.scale.set(k, k * (0.85 + Math.random() * 0.5), k);
      o.rotation.set(0, Math.random() * 3.14, 0);
      o.updateMatrix();
      inst.setMatrixAt(i, o.matrix);
      c.setHSL(0.24 + Math.random() * 0.07, 0.34 + Math.random() * 0.2, 0.19 + Math.random() * 0.12);
      inst.setColorAt(i, c);
    });
    inst.castShadow = true;
    inst.instanceMatrix.needsUpdate = true;
    this.trees = inst;
    this.group.add(inst);
  }

  clear() {
    if (this.mesh) {
      this.mesh.geometry.dispose();
      this.group.remove(this.mesh);
      this.mesh = null;
    }
    if (this.trees) {
      this.trees.geometry.dispose();
      this.group.remove(this.trees);
      this.trees = null;
    }
  }
}

/** A trunk and two offset blobs, flat shaded, which is enough at this range. */
function treeGeometry(): THREE.BufferGeometry {
  const parts = [
    new THREE.CylinderGeometry(0.16, 0.24, 2.4, 5).translate(0, 1.2, 0),
    new THREE.IcosahedronGeometry(1.9, 0).translate(0, 3.4, 0),
    new THREE.IcosahedronGeometry(1.35, 0).translate(0.6, 4.6, -0.3),
  ];
  const pos: number[] = [];
  const nrm: number[] = [];
  const idx: number[] = [];
  for (const g of parts) {
    const p = g.getAttribute('position');
    const n = g.getAttribute('normal');
    const base = pos.length / 3;
    for (let i = 0; i < p.count; i++) {
      pos.push(p.getX(i), p.getY(i), p.getZ(i));
      nrm.push(n.getX(i), n.getY(i), n.getZ(i));
    }
    const gi = g.getIndex();
    if (gi) for (let i = 0; i < gi.count; i++) idx.push(base + gi.getX(i));
    else for (let i = 0; i < p.count; i++) idx.push(base + i);
    g.dispose();
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
  out.setIndex(idx);
  return out;
}

function centre(ring: { x: number; z: number }[]) {
  let x = 0;
  let z = 0;
  for (const p of ring) {
    x += p.x;
    z += p.z;
  }
  return { x: x / ring.length, z: z / ring.length };
}

/** Pull a ring in towards its own centre. Crude, and enough for a yard. */
function shrink(ring: { x: number; z: number }[], d: number) {
  const c = centre(ring);
  return ring.map((p) => {
    const dx = p.x - c.x;
    const dz = p.z - c.z;
    const l = Math.hypot(dx, dz) || 1;
    const k = Math.max(0, l - d) / l;
    return { x: c.x + dx * k, z: c.z + dz * k };
  });
}

function scatter(ring: { x: number; z: number }[], n: number, put: (x: number, z: number) => void) {
  if (n <= 0) return;
  let x0 = Infinity;
  let x1 = -Infinity;
  let z0 = Infinity;
  let z1 = -Infinity;
  for (const p of ring) {
    x0 = Math.min(x0, p.x);
    x1 = Math.max(x1, p.x);
    z0 = Math.min(z0, p.z);
    z1 = Math.max(z1, p.z);
  }
  for (let i = 0, tries = 0; i < n && tries < n * 14; tries++) {
    const x = x0 + Math.random() * (x1 - x0);
    const z = z0 + Math.random() * (z1 - z0);
    if (!inside(ring, x, z)) continue;
    put(x, z);
    i++;
  }
}

function inside(ring: { x: number; z: number }[], x: number, z: number) {
  let hit = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i];
    const b = ring[j];
    if (a.z > z !== b.z > z && x < ((b.x - a.x) * (z - a.z)) / (b.z - a.z) + a.x) hit = !hit;
  }
  return hit;
}
