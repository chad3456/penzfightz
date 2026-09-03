import * as THREE from 'three';
import type { Roads, Segment } from './roads';
import type { Terrain } from './terrain';

/**
 * Cars.
 *
 * They run on the road graph rather than on a path baked at build time, which
 * matters for one reason: the graph is edited live. A car halfway down a street
 * that has just been bulldozed has to end up somewhere sensible, and the only
 * cheap way to guarantee that is to keep every car's position as (segment,
 * distance along) and re-seat the ones whose segment vanished.
 *
 * There is no queueing model, no traffic light, no lane change. At the
 * distances this camera works at, what reads as traffic is *density and
 * direction*: two streams flowing opposite ways at slightly different speeds,
 * thinning out at the edge of town. Simulating a car-following model would be
 * invisible and would cost the frame.
 */

interface Car {
  seg: number;
  dir: 1 | -1;
  /** Metres travelled along the segment, from whichever end `dir` starts at. */
  t: number;
  speed: number;
  lane: number;
  big: number;
}

const MAX = 900;

export class Traffic {
  readonly mesh: THREE.InstancedMesh;
  private cars: Car[] = [];
  private uniforms = { uNight: { value: 0 } };
  private o = new THREE.Object3D();
  private colour = new THREE.Color();
  private roads: Roads | null = null;
  private live = 0;

  constructor(private terrain: Terrain) {
    const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.42, metalness: 0.25 });
    mat.onBeforeCompile = (s) => {
      Object.assign(s.uniforms, this.uniforms);
      s.vertexShader = s.vertexShader
        .replace('#include <common>', '#include <common>\nattribute float aPart;\nvarying float vPart;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvPart = aPart;');
      s.fragmentShader = s.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform float uNight;\nvarying float vPart;')
        .replace('#include <color_fragment>', `#include <color_fragment>
if (vPart > 0.5 && vPart < 1.5) diffuseColor.rgb = vec3(0.055, 0.062, 0.075);
if (vPart > 1.5) diffuseColor.rgb = vec3(0.7);`)
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
if (vPart > 1.5) {
  vec3 lamp = vPart > 2.5 ? vec3(1.0, 0.10, 0.06) : vec3(1.0, 0.95, 0.86);
  totalEmissiveRadiance += lamp * (0.25 + uNight * 3.0);
}`);
    };

    this.mesh = new THREE.InstancedMesh(carGeometry(), mat, MAX);
    this.mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(MAX * 3), 3);
    this.mesh.castShadow = true;
    this.mesh.frustumCulled = false;
    this.mesh.count = 0;
  }

  setNight(n: number) {
    this.uniforms.uNight.value = n;
  }

  /** Reseed the fleet for the current graph. Called after every road edit. */
  populate(roads: Roads, wanted: number) {
    this.roads = roads;
    const segs = [...roads.segments.values()];
    if (!segs.length) {
      this.live = 0;
      this.mesh.count = 0;
      this.cars = [];
      return;
    }
    const want = Math.min(MAX, wanted);
    this.cars = this.cars.filter((c) => roads.segments.has(c.seg));
    while (this.cars.length > want) this.cars.pop();
    while (this.cars.length < want) {
      const s = segs[(Math.random() * segs.length) | 0];
      this.cars.push(this.seat(s));
    }
    this.live = this.cars.length;
    this.mesh.count = this.live;
    this.cars.forEach((_, i) => {
      const hue = Math.random();
      // Real traffic is mostly grey, white and black with a few loud ones.
      if (hue < 0.62) this.colour.setHSL(0.09 + Math.random() * 0.02, 0.03, 0.18 + Math.random() * 0.66);
      else this.colour.setHSL(Math.random(), 0.5, 0.42);
      this.mesh.setColorAt(i, this.colour);
    });
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }

  private seat(s: Segment): Car {
    const dir = Math.random() < 0.5 ? 1 : -1;
    return {
      seg: s.id,
      dir,
      t: Math.random() * this.length(s),
      speed: 9 + Math.random() * 7 + (s.kind === 'avenue' ? 4 : 0),
      lane: s.half * (s.kind === 'avenue' ? (Math.random() < 0.5 ? 0.28 : 0.72) : 0.5),
      big: Math.random() < 0.12 ? 1 : 0,
    };
  }

  private length(s: Segment) {
    const r = this.roads;
    const a = r?.nodes.get(s.a);
    const b = r?.nodes.get(s.b);
    return a && b ? Math.hypot(b.x - a.x, b.z - a.z) : 1;
  }

  update(dt: number) {
    const roads = this.roads;
    if (!roads || !this.live) return;

    for (let i = 0; i < this.live; i++) {
      const c = this.cars[i];
      let s = roads.segments.get(c.seg);
      if (!s) {
        // The road under this car was bulldozed. Put it somewhere real.
        const all = [...roads.segments.values()];
        if (!all.length) return;
        Object.assign(c, this.seat(all[(Math.random() * all.length) | 0]));
        s = roads.segments.get(c.seg);
      }
      if (!s) continue;
      let len = this.length(s);
      c.t += c.speed * dt;

      if (c.t > len) {
        // Arrived. Leave by another road, preferring the straightest turn, and
        // only double back at a dead end.
        const at = c.dir === 1 ? s.b : s.a;
        const node = roads.nodes.get(at);
        const here = roads.bearing(at, s.id);
        const from = s.id;
        let pick = from;
        if (node && node.links.length > 1) {
          const outs = node.links.filter((l) => l !== from);
          const w = outs.map((l) => {
            const d = Math.abs(angle(roads.bearing(at, l) - (here + Math.PI)));
            return Math.exp(-d * d * 1.6) + 0.12;
          });
          let r = Math.random() * w.reduce((a, b) => a + b, 0);
          pick = outs[0];
          for (let k = 0; k < outs.length; k++) {
            r -= w[k];
            if (r <= 0) { pick = outs[k]; break; }
          }
        }
        const ns = roads.segments.get(pick);
        if (ns) {
          c.t -= len;
          c.seg = ns.id;
          c.dir = ns.a === at ? 1 : -1;
          c.lane = ns.half * (ns.kind === 'avenue' ? (c.lane > s.half * 0.5 ? 0.72 : 0.28) : 0.5);
          s = ns;
          len = this.length(ns);
        } else {
          c.t = 0;
        }
      }

      const a = roads.nodes.get(c.dir === 1 ? s.a : s.b);
      const b = roads.nodes.get(c.dir === 1 ? s.b : s.a);
      if (!a || !b) continue;
      const ux = (b.x - a.x) / len;
      const uz = (b.z - a.z) / len;
      // Keep right. Which side "right" is does not matter to the picture, only
      // that the two streams end up on opposite sides of the centre line.
      const off = c.lane;
      const x = a.x + ux * c.t + uz * off;
      const z = a.z + uz * c.t - ux * off;
      this.o.position.set(x, this.terrain.height(x, z) + 0.28, z);
      this.o.rotation.set(0, Math.atan2(ux, uz), 0);
      this.o.scale.set(1, 1 + c.big * 0.55, 1 + c.big * 0.9);
      this.o.updateMatrix();
      this.mesh.setMatrixAt(i, this.o.matrix);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}

function angle(a: number) {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

/** Body, cabin and two light bars, merged, with a part id per vertex. */
function carGeometry(): THREE.BufferGeometry {
  const parts: [THREE.BufferGeometry, number][] = [];
  const body = new THREE.BoxGeometry(1.82, 0.86, 4.3);
  body.translate(0, 0.43, 0);
  parts.push([body, 0]);
  const cabin = new THREE.BoxGeometry(1.62, 0.62, 2.15);
  cabin.translate(0, 1.16, -0.2);
  parts.push([cabin, 1]);
  const front = new THREE.BoxGeometry(1.5, 0.16, 0.1);
  front.translate(0, 0.5, 2.16);
  parts.push([front, 2]);
  const rear = new THREE.BoxGeometry(1.5, 0.16, 0.1);
  rear.translate(0, 0.5, -2.16);
  parts.push([rear, 3]);

  const pos: number[] = [];
  const nrm: number[] = [];
  const part: number[] = [];
  const idx: number[] = [];
  for (const [g, p] of parts) {
    const gp = g.getAttribute('position');
    const gn = g.getAttribute('normal');
    const base = pos.length / 3;
    for (let i = 0; i < gp.count; i++) {
      pos.push(gp.getX(i), gp.getY(i), gp.getZ(i));
      nrm.push(gn.getX(i), gn.getY(i), gn.getZ(i));
      part.push(p);
    }
    const gi = g.getIndex()!;
    for (let i = 0; i < gi.count; i++) idx.push(base + gi.getX(i));
    g.dispose();
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
  out.setAttribute('aPart', new THREE.Float32BufferAttribute(part, 1));
  out.setIndex(idx);
  return out;
}
