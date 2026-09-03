import * as THREE from 'three';
import type { Roads, Segment } from './roads';
import type { Terrain } from './terrain';
import { fleet, fleetMaterial, livery, type VehicleKind } from './vehicles';

/**
 * Traffic.
 *
 * Vehicles run on the road graph rather than on a path baked at build time,
 * because the graph is edited live: a rickshaw halfway down a street that has
 * just been bulldozed has to end up somewhere sensible, and the only cheap way
 * to guarantee that is to keep every position as (segment, metres along) and
 * re-seat whatever lost its road.
 *
 * ### What is actually drawn
 *
 * One instanced mesh per kind, and each frame the visible members of each kind
 * are **compacted into the front of their pool** — nearest first, up to a
 * budget. The alternative, drawing every vehicle in the city and letting the
 * GPU cull, means a full-detail rickshaw's worth of vertex work for every one
 * of a thousand vehicles including the ones eight hundred metres behind the
 * camera. Compaction costs a matrix and two colours per drawn instance per
 * frame and puts a hard ceiling on the frame.
 *
 * There is no car-following model and no traffic light. At the distances this
 * camera works at, what reads as traffic is density and direction: two streams
 * flowing opposite ways at slightly different speeds. Simulating a queue would
 * be invisible and would cost the frame.
 */

interface Car {
  kind: VehicleKind;
  seg: number;
  dir: 1 | -1;
  /** Metres travelled along the segment, from whichever end `dir` starts at. */
  t: number;
  speed: number;
  cruise: number;
  lane: number;
  body: THREE.Color;
  tint: THREE.Color;
  /** Smoothed heading, so a turn at a junction is not a snap. */
  yaw: number;
  lean: number;
}

const POOL = 320;

export class Traffic {
  readonly group = new THREE.Group();
  readonly material: THREE.MeshStandardMaterial;
  /** How far from the camera target vehicles are drawn at all. */
  cull = 620;
  budget = 260;
  /** How many were actually drawn last frame, for the readout. */
  drawn = 0;

  private uNight = { value: 0 };
  private pools = new Map<VehicleKind, { mesh: THREE.InstancedMesh; cars: Car[] }>();
  private cars: Car[] = [];
  private roads: Roads | null = null;
  private o = new THREE.Object3D();
  private focus = new THREE.Vector3();

  constructor(private terrain: Terrain) {
    this.material = fleetMaterial(this.uNight, true);
    const specs = fleet();
    for (const kind of Object.keys(specs) as VehicleKind[]) {
      const mesh = new THREE.InstancedMesh(specs[kind].geometry, this.material, POOL);
      mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(POOL * 3), 3);
      mesh.geometry.setAttribute('aTint', new THREE.InstancedBufferAttribute(new Float32Array(POOL * 3), 3));
      mesh.castShadow = true;
      mesh.frustumCulled = false;
      mesh.count = 0;
      this.pools.set(kind, { mesh, cars: [] });
      this.group.add(mesh);
    }
  }

  setNight(n: number) {
    this.uNight.value = n;
  }

  /** Where the camera is looking; vehicles are drawn outward from here. */
  setFocus(p: THREE.Vector3, distance: number) {
    this.focus.copy(p);
    this.cull = THREE.MathUtils.clamp(distance * 0.62 + 220, 260, 900);
  }

  // ------------------------------------------------------------------ fleet

  /** Reseed for the current graph. Called after every road edit. */
  populate(roads: Roads, wanted: number) {
    this.roads = roads;
    const segs = [...roads.segments.values()];
    if (!segs.length) {
      this.cars = [];
      for (const p of this.pools.values()) {
        p.cars = [];
        p.mesh.count = 0;
      }
      return;
    }
    const want = Math.min(POOL * this.pools.size, wanted);
    this.cars = this.cars.filter((c) => roads.segments.has(c.seg));
    while (this.cars.length > want) this.cars.pop();
    while (this.cars.length < want) {
      const s = segs[(Math.random() * segs.length) | 0];
      const kind = pick();
      const c = this.seat(s, kind);
      if (c) this.cars.push(c);
      else break;
    }
    for (const p of this.pools.values()) p.cars = [];
    for (const c of this.cars) {
      const p = this.pools.get(c.kind);
      if (p && p.cars.length < POOL) p.cars.push(c);
    }
  }

  private seat(s: Segment, kind: VehicleKind): Car | null {
    const spec = fleet()[kind];
    const dir = Math.random() < 0.5 ? 1 : -1;
    const [body, tint] = livery(kind, Math.random);
    const lanes = s.kind === 'avenue' ? 2 : 1;
    const l = (Math.floor(Math.random() * lanes) + 0.5) / lanes;
    return {
      kind,
      seg: s.id,
      dir,
      t: Math.random() * this.length(s),
      speed: 0,
      cruise: spec.topSpeed * (0.62 + Math.random() * 0.34),
      lane: s.half * l,
      body,
      tint,
      yaw: 0,
      lean: 0,
    };
  }

  private length(s: Segment) {
    const r = this.roads;
    const a = r?.nodes.get(s.a);
    const b = r?.nodes.get(s.b);
    return a && b ? Math.hypot(b.x - a.x, b.z - a.z) : 1;
  }

  // ----------------------------------------------------------------- frame

  update(dt: number) {
    const roads = this.roads;
    if (!roads) return;
    const cull2 = this.cull * this.cull;
    let drawn = 0;

    for (const [, pool] of this.pools) {
      let n = 0;
      const colour = pool.mesh.instanceColor;
      const tint = pool.mesh.geometry.getAttribute('aTint') as THREE.InstancedBufferAttribute;

      for (const c of pool.cars) {
        const at = this.step(c, roads, dt);
        if (!at) continue;
        const d = (at.x - this.focus.x) ** 2 + (at.z - this.focus.z) ** 2;
        if (d > cull2 || n >= POOL || drawn >= this.budget) continue;

        this.o.position.set(at.x, this.terrain.height(at.x, at.z) + 0.02, at.z);
        this.o.rotation.set(at.pitch, c.yaw, c.lean);
        this.o.scale.setScalar(1);
        this.o.updateMatrix();
        pool.mesh.setMatrixAt(n, this.o.matrix);
        if (colour) colour.setXYZ(n, c.body.r, c.body.g, c.body.b);
        tint.setXYZ(n, c.tint.r, c.tint.g, c.tint.b);
        n++;
        drawn++;
      }

      pool.mesh.count = n;
      pool.mesh.instanceMatrix.needsUpdate = true;
      if (colour) colour.needsUpdate = true;
      tint.needsUpdate = true;
    }
    this.drawn = drawn;
  }

  /** Advance one vehicle and return where it now is, or null if it is lost. */
  private step(c: Car, roads: Roads, dt: number) {
    let s = roads.segments.get(c.seg);
    if (!s) {
      const all = [...roads.segments.values()];
      if (!all.length) return null;
      const re = this.seat(all[(Math.random() * all.length) | 0], c.kind);
      if (!re) return null;
      Object.assign(c, { seg: re.seg, dir: re.dir, t: re.t, lane: re.lane });
      s = roads.segments.get(c.seg);
    }
    if (!s) return null;

    let len = this.length(s);
    // Ease up to cruise rather than teleporting to it, so a vehicle that has
    // just turned out of a junction is visibly slower than one on a straight.
    c.speed += (c.cruise - c.speed) * Math.min(1, dt * 0.9);
    c.t += c.speed * dt;

    if (c.t > len) {
      const at = c.dir === 1 ? s.b : s.a;
      const node = roads.nodes.get(at);
      const here = roads.bearing(at, s.id);
      const from = s.id;
      let take = from;
      if (node && node.links.length > 1) {
        const outs = node.links.filter((l) => l !== from);
        const w = outs.map((l) => {
          const d = Math.abs(wrap(roads.bearing(at, l) - (here + Math.PI)));
          return Math.exp(-d * d * 1.6) + 0.12;
        });
        let r = Math.random() * w.reduce((a, b) => a + b, 0);
        take = outs[0];
        for (let k = 0; k < outs.length; k++) {
          r -= w[k];
          if (r <= 0) {
            take = outs[k];
            break;
          }
        }
      }
      const ns = roads.segments.get(take);
      if (ns) {
        c.t -= len;
        c.seg = ns.id;
        c.dir = ns.a === at ? 1 : -1;
        const lanes = ns.kind === 'avenue' ? 2 : 1;
        c.lane = ns.half * ((Math.min(lanes - 1, Math.floor((c.lane / s.half) * lanes)) + 0.5) / lanes);
        c.speed *= 0.55;
        s = ns;
        len = this.length(ns);
      } else {
        c.t = 0;
      }
    }

    const a = roads.nodes.get(c.dir === 1 ? s.a : s.b);
    const b = roads.nodes.get(c.dir === 1 ? s.b : s.a);
    if (!a || !b) return null;
    const ux = (b.x - a.x) / len;
    const uz = (b.z - a.z) / len;
    const x = a.x + ux * c.t + uz * c.lane;
    const z = a.z + uz * c.t - ux * c.lane;

    // Heading eases towards the segment's, which turns a snap at a junction
    // into a turn — the one bit of animation that makes traffic look driven.
    const want = Math.atan2(ux, uz) - Math.PI / 2;
    const d = wrap(want - c.yaw);
    const turn = Math.min(1, dt * 4.5);
    c.yaw += d * turn;
    // Three-wheelers and two-wheelers lean into that turn. Nothing else does.
    const wants = c.kind === 'auto' || c.kind === 'scooter' ? -d * 1.6 : 0;
    c.lean += (THREE.MathUtils.clamp(wants, -0.34, 0.34) - c.lean) * Math.min(1, dt * 5);

    // Pitch with the slope, sampled a metre either side of where it is.
    const ah = this.terrain.height(x + ux, z + uz);
    const bh = this.terrain.height(x - ux, z - uz);
    return { x, z, pitch: -Math.atan2(ah - bh, 2) };
  }
}

function wrap(a: number) {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

/** Draw a kind out of the mix, by share. */
function pick(): VehicleKind {
  const specs = fleet();
  const kinds = Object.keys(specs) as VehicleKind[];
  let r = Math.random() * kinds.reduce((a, k) => a + specs[k].share, 0);
  for (const k of kinds) {
    r -= specs[k].share;
    if (r <= 0) return k;
  }
  return 'car';
}
