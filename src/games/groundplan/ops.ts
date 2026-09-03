import * as THREE from 'three';
import type { City } from './city';
import type { Terrain } from './terrain';
import type { Roads } from './roads';
import { fleet, fleetMaterial } from './vehicles';

/**
 * Operations: the city with something happening to it.
 *
 * A builder is a sandbox and a sandbox has no stakes, so this is the layer that
 * gives one — a civil emergency with a clock on it, run over exactly the city
 * you built. Every objective is placed from the real thing: rooftops come from
 * standing buildings, sweep points from junctions in the road graph, and the
 * convoy drives a route found by searching that graph. Nothing is scripted
 * against a fixed map, because there is no fixed map.
 *
 * Three operations, and they exist to make you use the three ways of moving:
 *
 * - **Monsoon lift** — people on roofs. Only the helicopter can reach them, and
 *   holding a hover over a roof is the one thing the flight model makes hard.
 * - **Blackout sweep** — junctions to visit after dark. Drivable, and the
 *   searchlight is worth switching on.
 * - **Convoy** — a column that drives the graph from one end of the city to the
 *   other. You have to keep up with it, which means knowing the roads you laid.
 */

export type OpKind = 'lift' | 'sweep' | 'convoy';
export type OpState = 'idle' | 'running' | 'won' | 'lost';

export interface Objective {
  x: number;
  y: number;
  z: number;
  /** Seconds held so far, for the ones that need holding. */
  held: number;
  need: number;
  radius: number;
  done: boolean;
}

export interface Report {
  kind: OpKind | null;
  state: OpState;
  done: number;
  total: number;
  seconds: number;
  message: string;
}

const OP_TIME: Record<OpKind, number> = { lift: 210, sweep: 180, convoy: 260 };

export class Ops {
  readonly group = new THREE.Group();
  kind: OpKind | null = null;
  state: OpState = 'idle';
  seconds = 0;
  message = '';

  private objectives: Objective[] = [];
  private markers: THREE.Object3D[] = [];
  private uTime = { value: 0 };
  private convoy: THREE.InstancedMesh | null = null;
  private path: THREE.Vector3[] = [];
  private convoyAt = 0;
  private convoyLost = 0;
  private o = new THREE.Object3D();
  private uNight = { value: 0 };

  constructor(private terrain: Terrain, private city: City) {}

  // ------------------------------------------------------------------ start

  start(kind: OpKind): boolean {
    this.stop();
    const built = [...this.city.built.values()];
    const nodes = [...this.city.roads.nodes.values()].filter((n) => n.links.length > 2);

    if (kind === 'lift') {
      if (built.length < 6) return this.refuse('nothing built to be stranded on');
      // The tallest roofs, spread out, because six markers on one block is not
      // an operation, it is a queue.
      const spread = pickSpread(built.map((b) => ({ x: b.lot.x, z: b.lot.z, y: b.m.height, w: b.m.height })), 6, 90);
      this.objectives = spread.map((p) => ({
        x: p.x,
        y: this.terrain.height(p.x, p.z) + p.y + 6,
        z: p.z,
        held: 0,
        need: 2.6,
        radius: 15,
        done: false,
      }));
    } else if (kind === 'sweep') {
      if (nodes.length < 5) return this.refuse('lay a few more roads first');
      const spread = pickSpread(nodes.map((n) => ({ x: n.x, z: n.z, y: 0, w: n.links.length })), 7, 120);
      this.objectives = spread.map((p) => ({
        x: p.x,
        y: this.terrain.height(p.x, p.z) + 2,
        z: p.z,
        held: 0,
        need: 0.8,
        radius: 18,
        done: false,
      }));
    } else {
      const route = longestRoute(this.city.roads);
      if (route.length < 4) return this.refuse('the road network is too small for a convoy');
      this.path = route.map((n) => new THREE.Vector3(n.x, this.terrain.height(n.x, n.z), n.z));
      this.buildConvoy();
      this.objectives = [
        {
          x: this.path[this.path.length - 1].x,
          y: this.path[this.path.length - 1].y + 2,
          z: this.path[this.path.length - 1].z,
          held: 0,
          need: 0.5,
          radius: 24,
          done: false,
        },
      ];
      this.convoyAt = 0;
      this.convoyLost = 0;
    }

    this.kind = kind;
    this.state = 'running';
    this.seconds = OP_TIME[kind];
    this.message = OPENING[kind];
    this.buildMarkers();
    return true;
  }

  private refuse(why: string) {
    this.message = why;
    this.state = 'idle';
    this.kind = null;
    return false;
  }

  stop() {
    this.kind = null;
    this.state = 'idle';
    this.objectives = [];
    for (const m of this.markers) {
      for (const c of m.children) (c as THREE.Mesh).geometry.dispose();
      this.group.remove(m);
    }
    this.markers = [];
    this.done = [];
    if (this.convoy) {
      this.convoy.geometry.dispose();
      this.group.remove(this.convoy);
      this.convoy = null;
    }
    this.path = [];
  }

  setNight(n: number) {
    this.uNight.value = n;
  }

  // ----------------------------------------------------------------- pieces

  /** A marker is a ring on the ground, a column, and a diamond that bobs. */
  private buildMarkers() {
    // One material per marker, not per part: cloning a ShaderMaterial clones
    // its uniforms too, so a shared clock stops being shared the moment you
    // do it the obvious way — and every marker needs its own progress anyway.
    const make = (done: { value: number }) =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        uniforms: { uTime: this.uTime, uColour: { value: new THREE.Color(0xffb03a) }, uDone: done },
        vertexShader: `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`,
        fragmentShader: `
uniform float uTime;
uniform vec3 uColour;
uniform float uDone;
varying vec2 vUv;
void main() {
  float a = pow(1.0 - vUv.y, 1.6) * (0.62 + 0.30 * sin(uTime * 3.4 - vUv.y * 9.0));
  vec3 c = mix(uColour, vec3(0.28, 1.0, 0.52), uDone);
  gl_FragColor = vec4(c, a * (0.45 + 0.55 * (1.0 - uDone)));
}`,
      });

    this.done = [];
    for (const ob of this.objectives) {
      const done = { value: 0 };
      this.done.push(done);
      const mat = make(done);
      const g = new THREE.Group();
      const col = new THREE.CylinderGeometry(4.2, 5.6, 150, 16, 1, true);
      col.translate(0, 75, 0);
      const beam = new THREE.Mesh(col, mat);
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(ob.radius * 0.78, ob.radius, 48).rotateX(-Math.PI / 2),
        mat,
      );
      ring.position.y = 0.6;
      const gem = new THREE.Mesh(new THREE.OctahedronGeometry(3.2, 0), mat);
      gem.position.y = 11;
      g.add(beam, ring, gem);
      g.position.set(ob.x, this.terrain.height(ob.x, ob.z), ob.z);
      g.renderOrder = 6;
      this.group.add(g);
      this.markers.push(g);
    }
  }

  private done: { value: number }[] = [];

  /** Five jeeps in a column, as one instanced mesh. */
  private buildConvoy() {
    const spec = fleet().jeep;
    const mat = fleetMaterial(this.uNight, true);
    const inst = new THREE.InstancedMesh(spec.geometry, mat, 5);
    inst.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(15), 3);
    inst.geometry.setAttribute('aTint', new THREE.InstancedBufferAttribute(new Float32Array(15), 3));
    const c = inst.instanceColor;
    const t = inst.geometry.getAttribute('aTint') as THREE.InstancedBufferAttribute;
    for (let i = 0; i < 5; i++) {
      c.setXYZ(i, 0.13, 0.17, 0.12);
      t.setXYZ(i, 0.18, 0.22, 0.15);
    }
    c.needsUpdate = true;
    t.needsUpdate = true;
    inst.castShadow = true;
    inst.frustumCulled = false;
    this.convoy = inst;
    this.group.add(inst);
  }

  // ------------------------------------------------------------------ frame

  update(dt: number, player: THREE.Vector3, mode: 'plan' | 'drive' | 'fly') {
    this.uTime.value += dt;
    if (this.state !== 'running') return;

    this.seconds -= dt;
    if (this.seconds <= 0) {
      this.state = 'lost';
      this.message = 'out of time';
      return;
    }

    if (this.kind === 'convoy') this.driveConvoy(dt, player);

    // Nothing counts while you are looking at the plan; the point of an
    // operation is that somebody has to physically be there.
    const present = mode !== 'plan';
    let done = 0;
    this.objectives.forEach((ob, i) => {
      if (!ob.done && present) {
        const d = Math.hypot(player.x - ob.x, player.z - ob.z);
        const dy = this.kind === 'lift' ? Math.abs(player.y - ob.y) : 0;
        if (d < ob.radius && dy < 26) ob.held += dt;
        else ob.held = Math.max(0, ob.held - dt * 1.6);
        if (ob.held >= ob.need) {
          ob.done = true;
          this.message = this.kind === 'lift' ? 'lifted' : 'checked';
        }
      }
      if (ob.done) done++;
      const m = this.markers[i];
      const d = this.done[i];
      if (d) d.value = ob.done ? 1 : Math.min(0.85, ob.held / ob.need);
      if (m) {
        m.children[2].rotation.y += dt * 1.1;
        m.children[2].position.y = 11 + Math.sin(this.uTime.value * 1.8) * 1.2;
      }
    });

    if (done === this.objectives.length) {
      this.state = 'won';
      this.message = CLOSING[this.kind ?? 'sweep'];
    }
  }

  private driveConvoy(dt: number, player: THREE.Vector3) {
    if (!this.convoy || this.path.length < 2) return;
    this.convoyAt += dt * 11;

    const total = this.pathLength();
    if (this.convoyAt > total) this.convoyAt = total;

    for (let i = 0; i < 5; i++) {
      const at = Math.max(0, this.convoyAt - i * 13);
      const p = this.along(at);
      const q = this.along(at + 1.5);
      this.o.position.set(p.x, this.terrain.height(p.x, p.z) + 0.02, p.z);
      this.o.rotation.set(0, Math.atan2(q.x - p.x, q.z - p.z), 0);
      this.o.updateMatrix();
      this.convoy.setMatrixAt(i, this.o.matrix);
    }
    this.convoy.instanceMatrix.needsUpdate = true;

    // Escort, which is to say: keep up. Drift too far behind for too long and
    // it is over — the timer alone would let you ignore the convoy entirely.
    const head = this.along(this.convoyAt);
    const gap = Math.hypot(player.x - head.x, player.z - head.z);
    if (gap > 130) {
      this.convoyLost += dt;
      this.message = 'falling behind the column';
      if (this.convoyLost > 12) {
        this.state = 'lost';
        this.message = 'the column went on without you';
      }
    } else {
      this.convoyLost = Math.max(0, this.convoyLost - dt);
    }
  }

  private pathLength() {
    let l = 0;
    for (let i = 1; i < this.path.length; i++) l += this.path[i].distanceTo(this.path[i - 1]);
    return l;
  }

  /** A point that far along the route. */
  private along(d: number): THREE.Vector3 {
    let left = Math.max(0, d);
    for (let i = 1; i < this.path.length; i++) {
      const seg = this.path[i].distanceTo(this.path[i - 1]);
      if (left <= seg) return this.path[i - 1].clone().lerp(this.path[i], seg ? left / seg : 0);
      left -= seg;
    }
    return this.path[this.path.length - 1].clone();
  }

  report(): Report {
    return {
      kind: this.kind,
      state: this.state,
      done: this.objectives.filter((o) => o.done).length,
      total: this.objectives.length,
      seconds: Math.max(0, this.seconds),
      message: this.message,
    };
  }
}

const OPENING: Record<OpKind, string> = {
  lift: 'six roofs cut off. Hover over each one and hold it steady.',
  sweep: 'the grid is down. Get eyes on every junction on the list.',
  convoy: 'the column is moving. Stay with it to the far end of the city.',
};

const CLOSING: Record<OpKind, string> = {
  lift: 'everyone off the roofs.',
  sweep: 'every junction accounted for.',
  convoy: 'the column is through.',
};

/**
 * Pick points that are both important and far apart.
 *
 * Greedy: take the best remaining, then discard everything within `apart` of
 * it. Six markers clustered on one block is not an operation.
 */
function pickSpread(
  from: { x: number; z: number; y: number; w: number }[],
  count: number,
  apart: number,
) {
  const pool = [...from].sort((a, b) => b.w - a.w);
  const out: typeof pool = [];
  for (const p of pool) {
    if (out.length >= count) break;
    if (out.every((q) => Math.hypot(q.x - p.x, q.z - p.z) > apart)) out.push(p);
  }
  return out;
}

/**
 * The longest route across the network.
 *
 * Two breadth-first searches: the node furthest from an arbitrary start, then
 * the node furthest from that one. It is the standard trick for the diameter of
 * a tree, it is only approximate on a graph with cycles, and approximate is
 * exactly right here — the convoy wants a long drive, not the longest one.
 */
function longestRoute(roads: Roads) {
  const nodes = [...roads.nodes.values()];
  if (nodes.length < 4) return [];
  const far = (from: number) => {
    const prev = new Map<number, number>();
    const seen = new Set<number>([from]);
    const q = [from];
    let last = from;
    for (let i = 0; i < q.length; i++) {
      const id = q[i];
      last = id;
      const n = roads.nodes.get(id);
      if (!n) continue;
      for (const l of n.links) {
        const s = roads.segments.get(l);
        if (!s) continue;
        const to = s.a === id ? s.b : s.a;
        if (seen.has(to)) continue;
        seen.add(to);
        prev.set(to, id);
        q.push(to);
      }
    }
    return { last, prev };
  };
  const a = far(nodes[0].id);
  const b = far(a.last);
  const route: { x: number; z: number }[] = [];
  let at: number | undefined = b.last;
  while (at !== undefined) {
    const n = roads.nodes.get(at);
    if (n) route.push({ x: n.x, z: n.z });
    at = b.prev.get(at);
  }
  return route.reverse();
}
