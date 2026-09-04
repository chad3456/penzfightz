import * as THREE from 'three';
import type { PropKind } from './places';
import { propHeight } from './world';

/**
 * What is left of it.
 *
 * When a prop goes over it is pulled out of its instanced pool and replaced
 * with a handful of pieces that are thrown, spun, bounced once and then swept
 * up. One pool of two hundred pieces serves the whole city and is recycled
 * oldest-first, so a long shift in Chandni Chowk — where you can flatten forty
 * things a minute — costs exactly as much as a short one.
 *
 * Deliberately not a physics engine. A piece is a position, a velocity, a spin
 * and a lifetime, and it never talks to another piece. Nobody has ever looked
 * at the wreckage of a fruit cart and wondered whether the melons were
 * colliding with each other correctly.
 */

const MAX = 220;

interface Piece {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  spin: THREE.Vector3;
  rot: THREE.Euler;
  size: number;
  life: number;
  age: number;
  floor: number;
}

export class Debris {
  readonly mesh: THREE.InstancedMesh;
  private pieces: Piece[] = [];
  private next = 0;
  private m4 = new THREE.Matrix4();
  private q = new THREE.Quaternion();
  private scale = new THREE.Vector3();
  private colour: THREE.InstancedBufferAttribute;

  constructor() {
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, metalness: 0.03 });
    this.mesh = new THREE.InstancedMesh(geo, mat, MAX);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.colour = new THREE.InstancedBufferAttribute(new Float32Array(MAX * 3), 3);
    this.mesh.instanceColor = this.colour;
    this.mesh.frustumCulled = false;
    for (let i = 0; i < MAX; i++) {
      this.pieces.push({
        pos: new THREE.Vector3(),
        vel: new THREE.Vector3(),
        spin: new THREE.Vector3(),
        rot: new THREE.Euler(),
        size: 0,
        life: 0,
        age: 0,
        floor: 0,
      });
    }
  }

  /** Break one prop, thrown away from wherever the car came in. */
  burst(kind: PropKind, at: THREE.Vector3, from: THREE.Vector2, force: number, colour: THREE.Color) {
    const tall = propHeight(kind);
    const n = Math.min(14, 4 + Math.round(force * 9 + tall));
    const dir = new THREE.Vector3(from.x, 0, from.y).normalize();
    for (let i = 0; i < n; i++) {
      const p = this.pieces[this.next];
      this.next = (this.next + 1) % MAX;
      const spread = 1.4;
      p.pos.set(
        at.x + (Math.random() - 0.5) * spread,
        at.y + Math.random() * tall * 0.8 + 0.2,
        at.z + (Math.random() - 0.5) * spread,
      );
      p.floor = at.y;
      p.vel
        .copy(dir)
        .multiplyScalar(3 + force * 13 * Math.random())
        .add(
          new THREE.Vector3(
            (Math.random() - 0.5) * 5,
            2.5 + Math.random() * (5 + force * 7),
            (Math.random() - 0.5) * 5,
          ),
        );
      p.spin.set((Math.random() - 0.5) * 16, (Math.random() - 0.5) * 16, (Math.random() - 0.5) * 16);
      p.rot.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
      p.size = 0.16 + Math.random() * 0.34 * (0.6 + tall * 0.12);
      p.life = 2.4 + Math.random() * 2.2;
      p.age = 0;
      const k = this.pieces.indexOf(p);
      this.colour.setXYZ(k, colour.r, colour.g, colour.b);
    }
    this.colour.needsUpdate = true;
  }

  update(dt: number) {
    for (let i = 0; i < MAX; i++) {
      const p = this.pieces[i];
      if (p.age >= p.life) {
        if (p.size !== 0) {
          p.size = 0;
          this.m4.makeScale(0, 0, 0);
          this.mesh.setMatrixAt(i, this.m4);
        }
        continue;
      }
      p.age += dt;
      p.vel.y -= 24 * dt;
      p.pos.addScaledVector(p.vel, dt);
      if (p.pos.y < p.floor + p.size * 0.5) {
        p.pos.y = p.floor + p.size * 0.5;
        // One bounce, then it lies there. Two bounces looks like a ball.
        p.vel.y = Math.abs(p.vel.y) > 3 ? -p.vel.y * 0.3 : 0;
        p.vel.x *= 0.72;
        p.vel.z *= 0.72;
        p.spin.multiplyScalar(0.5);
      }
      p.rot.x += p.spin.x * dt;
      p.rot.y += p.spin.y * dt;
      p.rot.z += p.spin.z * dt;
      // The last half second is spent shrinking, which reads as being swept up
      // rather than as popping out of existence.
      const left = 1 - p.age / p.life;
      const s = p.size * Math.min(1, left * 3);
      this.q.setFromEuler(p.rot);
      this.scale.set(s, s, s);
      this.m4.compose(p.pos, this.q, this.scale);
      this.mesh.setMatrixAt(i, this.m4);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  dispose() {
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}
