import * as THREE from 'three';
import { add, box, finish, parts, profile } from '../groundplan/build';

/**
 * A box with sharp corners, and twelve triangles.
 *
 * The parts kit's `box` is a *rounded* box, which is right for a car and for a
 * crate and catastrophic for a window pane: at two segments it is two hundred
 * triangles apiece, and a city's worth of windows came to nine million of them
 * — about half a frame per second. Anything small enough that you will never
 * see its corners gets this instead.
 */
const slab = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);
import type { Place, PropKind } from './places';

/**
 * The city, generated from four numbers.
 *
 * A grid of blocks with streets between them. That is deliberately the
 * simplest thing that works: an arcade taxi game needs the player to be able to
 * *see* a route across the map at a glance and commit to it at fifty, and a
 * naturalistic road graph — which the city builder next door does properly —
 * is the enemy of that. What varies between the four locations is the pitch of
 * the grid, how much is built on each block, and what is standing in the road.
 *
 * Everything solid is an axis-aligned box, and that is not laziness either: the
 * car checks itself against a few hundred of those every frame, and a box test
 * is four comparisons.
 */

/**
 * What a surface is, which decides what colour it comes out.
 *
 * The parts kit tags every vertex with a role and leaves the colour to the
 * caller, so the same stall geometry is a bright awning in Delhi and a wet grey
 * one in Shimla without being rebuilt.
 */
export const R = {
  road: 0, kerb: 1, paint: 2, wall: 3, trim: 4, park: 5, cloth: 6, goods: 7,
  metal: 8, tyre: 9, sign: 10, glass: 11, glow: 12, clay: 13, green: 14,
  trunk: 15, cone: 16, paint2: 17, window: 18, lit: 19,
} as const;

export interface Solid {
  /** Centre. */
  x: number;
  z: number;
  /** Half-extents. */
  hx: number;
  hz: number;
  /** Ground height at the base, and how tall. */
  y: number;
  h: number;
}

export interface Prop {
  kind: PropKind;
  x: number;
  z: number;
  y: number;
  rot: number;
  scale: number;
  /** Radius for the car to hit. */
  r: number;
  /** Immovable. A lamp post is; a fruit cart is not. */
  fixed: boolean;
  /** Gone. */
  dead: boolean;
  /** Which slot in the instanced mesh it occupies. */
  slot: number;
}

export interface World {
  place: Place;
  /** Half the map's extent in metres. */
  half: number;
  solids: Solid[];
  props: Prop[];
  /** Junction centres, which is where fares start and end. */
  nodes: THREE.Vector2[];
  ground: (x: number, z: number) => number;
  /** Everything static, in one mesh per material. */
  meshes: THREE.Object3D[];
  /** Prop pools, so a smashed one can be pulled out of the instance list. */
  pools: Map<PropKind, THREE.InstancedMesh>;
  dispose: () => void;
}

const rng = (seed: number) => {
  let a = (seed ^ 0x9e3779b9) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/**
 * The lie of the land.
 *
 * Flat everywhere except the hill road, where the whole map tips across its
 * diagonal with a couple of shelves in it — because a hillside town is not a
 * ramp, it is a stack of terraces with the road switching back between them,
 * and the shelves are what make the junctions flat enough to stop on.
 */
function relief(place: Place, half: number) {
  if (place.relief <= 0) return () => 0;
  const drop = 42 * place.relief;
  const step = place.pitch * 2;
  return (x: number, z: number) => {
    const t = (x + z + half * 2) / (half * 4);
    // Terraces: the slope is real, but it flattens near each junction band so
    // the car is not permanently pointing downhill at a stop.
    const shelf = Math.sin((x + z) / step * Math.PI) * 0.12;
    return -(t + shelf) * drop + drop * 0.5;
  };
}

/**
 * A flat piece of surface lying on the ground, corner by corner.
 *
 * Each corner takes its own height from the terrain, so the piece tilts with
 * the hill instead of hovering over it. Two triangles, no sides — whatever is
 * under it is the ground, and the ground is never far enough below to show.
 */
function quad(
  out: ReturnType<typeof parts>,
  role: number,
  corners: [number, number][],
  ground: (x: number, z: number) => number,
  lift: number,
) {
  const g = new THREE.BufferGeometry();
  const pos: number[] = [];
  for (const [x, z] of corners) pos.push(x, ground(x, z) + lift, z);
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  // Wind it so the face points up, whatever order the corners arrived in.
  // Half the streets run the other way round the block and came out wound the
  // other way, so half of them were back-facing and invisible; the ground was
  // wound the same way and the whole map had no floor. Working out the winding
  // per caller is a rule to remember, and this is a rule that cannot be
  // forgotten.
  const ax = pos[3] - pos[0];
  const az = pos[5] - pos[2];
  const bx = pos[6] - pos[0];
  const bz = pos[8] - pos[2];
  g.setIndex(ax * bz - az * bx < 0 ? [0, 1, 2, 0, 2, 3] : [0, 2, 1, 0, 3, 2]);
  g.computeVertexNormals();
  add(out, g, role);
}

/** A building: a stack of one to three boxes, so the skyline is not a comb. */
function tower(
  out: ReturnType<typeof parts>,
  x: number,
  z: number,
  y: number,
  w: number,
  d: number,
  storeys: number,
  r: () => number,
  night: boolean,
) {
  const floor = 3.3;
  let base = y;
  let left = storeys;
  let cw = w;
  let cd = d;
  while (left > 0) {
    const chunk = Math.max(1, Math.min(left, 1 + Math.floor(r() * 4)));
    const h = chunk * floor;
    // Buildings are slabs too. A rounded corner on a nine-metre wall is four
    // hundred triangles nobody will ever be close enough to see, and real
    // masonry has a corner on it anyway.
    const g = slab(cw, h, cd);
    g.translate(x, base + h / 2, z);
    add(out, g, R.wall);
    // Windows. One band per face read as a neon strip; three short lights per
    // face reads as a building with people in it, which is the difference
    // between a skyline and a bar chart with the lights on.
    for (let f = 0; f < chunk; f++) {
      const wy = base + f * floor + floor * 0.6;
      for (const [ax, az, span] of [
        [0, cd / 2 + 0.06, cw],
        [0, -cd / 2 - 0.06, cw],
        [cw / 2 + 0.06, 0, cd],
        [-cw / 2 - 0.06, 0, cd],
      ] as const) {
        const along = Math.abs(ax) > 0.01;
        const n = Math.max(2, Math.round(span / 3.4));
        for (let k = 0; k < n; k++) {
          const off = ((k + 0.5) / n - 0.5) * span * 0.9;
          const ww = (span / n) * 0.55;
          const pane = slab(along ? 0.1 : ww, 0.62, along ? ww : 0.1);
          pane.translate(x + ax + (along ? 0 : off), wy, z + az + (along ? off : 0));
          // Half of them are lit and the other half are people asleep. A city
          // where every window is on reads as an office block on fire.
          add(out, pane, night && r() < 0.42 ? R.lit : R.window);
        }
      }
    }
    // A string course between stacks, which is most of what makes these read
    // as buildings rather than as bar charts.
    const band = slab(cw + 0.5, 0.34, cd + 0.5);
    band.translate(x, base + h, z);
    add(out, band, R.trim);
    base += h;
    left -= chunk;
    cw *= 0.82 + r() * 0.12;
    cd *= 0.82 + r() * 0.12;
  }
  // A parapet, because a flat top with nothing on it reads as unfinished.
  const cap = slab(cw + 0.8, 0.6, cd + 0.8);
  cap.translate(x, base + 0.3, z);
  add(out, cap, R.trim);
}

/** The road surface, kerbs, and the paint down the middle of it. */
function streets(out: ReturnType<typeof parts>, place: Place, half: number, ground: (x: number, z: number) => number) {
  const n = place.grid;
  const hw = place.road / 2;
  for (let i = 0; i <= n; i++) {
    const at = -half + i * place.pitch;
    for (const across of [true, false]) {
      // Roads are laid in short spans so a sloped map does not get one long
      // plank floating over its own hillside.
      const spans = Math.max(4, Math.round((half * 2) / 24));
      for (let s = 0; s < spans; s++) {
        const t0 = -half + ((s + 0) / spans) * half * 2;
        const t1 = -half + ((s + 1) / spans) * half * 2;
        // Along the road, then across it. Every corner samples the ground, so a
        // span on a hillside is a ramp rather than a plank on stilts.
        const at0 = (t: number, off: number): [number, number] => (across ? [t, at + off] : [at + off, t]);
        quad(out, R.road, [at0(t0, -hw), at0(t1, -hw), at0(t1, hw), at0(t0, hw)], ground, 0.06);
        for (const side of [-1, 1]) {
          const a = at + side * (hw + 0.22);
          const b = at + side * (hw + 0.66);
          const k0 = across ? [t0, a] : [a, t0];
          const k1 = across ? [t1, a] : [a, t1];
          const k2 = across ? [t1, b] : [b, t1];
          const k3 = across ? [t0, b] : [b, t0];
          quad(out, R.kerb, [k0 as [number, number], k1 as [number, number], k2 as [number, number], k3 as [number, number]], ground, 0.2);
        }
        if (s % 2 === 0 && place.road > 10) {
          const m0 = at0(t0 + (t1 - t0) * 0.25, -0.12);
          const m1 = at0(t0 + (t1 - t0) * 0.75, -0.12);
          const m2 = at0(t0 + (t1 - t0) * 0.75, 0.12);
          const m3 = at0(t0 + (t1 - t0) * 0.25, 0.12);
          quad(out, R.paint, [m0, m1, m2, m3], ground, 0.08);
        }
      }
    }
  }
}

/**
 * radius, whether it is fixed, height.
 *
 * `fixed` was originally a *speed* — go faster than this and the thing falls
 * over — which sounds right and is a trap: a car at rest is going nought, so
 * every crate within two metres of where you started was a wall, and the first
 * thing the game did when you held the throttle was nothing. Either a thing
 * can be knocked over or it cannot. Lamp posts cannot.
 */
const PROP_R: Record<PropKind, [number, number, number]> = {
  stall: [1.9, 0, 2.4],
  cart: [1.4, 0, 1.3],
  bin: [0.5, 0, 1.0],
  cone: [0.32, 0, 0.7],
  crate: [0.6, 0, 0.9],
  hoarding: [2.6, 1, 5.5],
  palm: [0.5, 1, 8],
  tree: [0.65, 1, 6.5],
  lamp: [0.28, 1, 7],
  shelter: [2.6, 1, 2.7],
  scooter: [0.8, 0, 1.1],
  barrel: [0.52, 0, 1.0],
  chai: [1.1, 0, 1.9],
  pot: [0.45, 0, 0.8],
  melon: [0.9, 0, 0.6],
  sign: [0.3, 1, 2.6],
  bollard: [0.28, 1, 0.9],
  pile: [1.2, 0, 1.1],
};

/**
 * Build a location.
 *
 * Deterministic from the seed, so a fare's pickup and drop-off can be worked
 * out on the same map the player is looking at.
 */
export function build(place: Place, seed: number): World {
  const r = rng(seed);
  const n = place.grid;
  const half = (n * place.pitch) / 2;
  const ground = relief(place, half);
  const solids: Solid[] = [];
  const props: Prop[] = [];
  const nodes: THREE.Vector2[] = [];

  const city = parts();
  // The ground, as one deformed grid.
  //
  // It was a slab per block to begin with, which is fine on the three flat maps
  // and catastrophic on the hill: with forty metres of drop across eight
  // blocks, each slab sat five metres above its neighbour and the map became a
  // staircase of floating plates with the black undersides showing. A ground
  // that varies in height has to be *sampled*, not stepped.
  {
    const cells = n * 4;
    const span = (half * 2) / cells;
    for (let i = 0; i < cells + 2; i++) {
      for (let k = 0; k < cells + 2; k++) {
        const x0 = -half - span + i * span;
        const z0 = -half - span + k * span;
        quad(city, R.park, [
          [x0, z0],
          [x0 + span, z0],
          [x0 + span, z0 + span],
          [x0, z0 + span],
        ], ground, -0.06);
      }
    }
  }
  streets(city, place, half, ground);

  const inner = place.pitch - place.road - 4;
  for (let bx = 0; bx < n; bx++) {
    for (let bz = 0; bz < n; bz++) {
      const cx = -half + (bx + 0.5) * place.pitch;
      const cz = -half + (bz + 0.5) * place.pitch;
      // The sea eats the last row, and the promenade in front of it is the one
      // place on the map with a straight kilometre in it.
      const sea = place.sea && bz === n - 1;
      if (sea) continue;
      const park = !sea && r() < 0.1;
      if (park) {
        const g = slab(inner, 0.16, inner);
        g.translate(cx, ground(cx, cz) + 0.02, cz);
        add(city, g, R.park);
        for (let i = 0; i < 10; i++) {
          const px = cx + (r() - 0.5) * inner * 0.9;
          const pz = cz + (r() - 0.5) * inner * 0.9;
          props.push(makeProp(place.props.includes('palm') ? 'palm' : 'tree', px, pz, ground(px, pz), r));
        }
        continue;
      }
      // Buildings round the edge of the block with a yard in the middle,
      // because a solid slab per block gives a map with no shortcuts in it and
      // shortcuts are the entire game.
      const lots = 2 + Math.floor(r() * 2);
      for (let sx = 0; sx < lots; sx++) {
        for (let sz = 0; sz < lots; sz++) {
          const edge = sx === 0 || sz === 0 || sx === lots - 1 || sz === lots - 1;
          if (!edge && r() > place.density * 0.4) continue;
          if (r() > place.density + 0.12) continue;
          const w = (inner / lots) * (0.82 + r() * 0.16);
          const d = (inner / lots) * (0.82 + r() * 0.16);
          const x = cx + (sx + 0.5 - lots / 2) * (inner / lots);
          const z = cz + (sz + 0.5 - lots / 2) * (inner / lots);
          const st = Math.round(place.storeys[0] + r() * (place.storeys[1] - place.storeys[0]));
          const y = ground(x, z);
          // Sunk a little, so a wall on a slope meets the ground on both sides.
          tower(city, x, z, y - 2.2 * place.relief - 0.3, w, d, st, r, place.night);
          solids.push({ x, z, hx: w / 2, hz: d / 2, y, h: st * 3.3 });
        }
      }
    }
  }

  // Junctions. These are the only places a passenger is ever waiting, so they
  // are collected as the map is built rather than searched for afterwards.
  for (let i = 0; i <= n; i++) {
    for (let k = 0; k <= n; k++) {
      const x = -half + i * place.pitch;
      const z = -half + k * place.pitch;
      if (place.sea && z > half - place.pitch * 0.5) continue;
      nodes.push(new THREE.Vector2(x, z));
    }
  }

  // Street furniture, on the pavements and occasionally not.
  const lanes = n + 1;
  const perLane = Math.round(place.clutter * 14);
  for (let i = 0; i < lanes; i++) {
    const at = -half + i * place.pitch;
    for (const across of [true, false]) {
      for (let k = 0; k < perLane; k++) {
        const t = -half + r() * half * 2;
        const side = (r() < 0.5 ? -1 : 1) * (place.road / 2 + 0.6 + r() * 2.4);
        const x = across ? t : at + side;
        const z = across ? at + side : t;
        if (place.sea && z > half - place.pitch * 0.6) continue;
        const kind = place.props[Math.floor(r() * place.props.length) % place.props.length];
        props.push(makeProp(kind, x, z, ground(x, z), r));
      }
    }
  }

  const meshes: THREE.Object3D[] = [];
  const geo = tint(finish(city), place, seed);
  const mat = lit(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.88, metalness: 0.02 }));
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = false;
  mesh.receiveShadow = true;
  meshes.push(mesh);

  const pools = new Map<PropKind, THREE.InstancedMesh>();
  const byKind = new Map<PropKind, Prop[]>();
  for (const p of props) {
    const list = byKind.get(p.kind) ?? [];
    list.push(p);
    byKind.set(p.kind, list);
  }
  const m4 = new THREE.Matrix4();
  for (const [kind, list] of byKind) {
    const { geometry, material } = propGeometry(kind, place);
    const inst = new THREE.InstancedMesh(geometry, material, list.length);
    inst.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    list.forEach((p, i) => {
      p.slot = i;
      m4.compose(
        new THREE.Vector3(p.x, p.y, p.z),
        new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), p.rot),
        new THREE.Vector3(p.scale, p.scale, p.scale),
      );
      inst.setMatrixAt(i, m4);
    });
    inst.instanceMatrix.needsUpdate = true;
    inst.frustumCulled = false;
    pools.set(kind, inst);
    meshes.push(inst);
  }

  return {
    place,
    half,
    solids,
    props,
    nodes,
    ground,
    meshes,
    pools,
    dispose: () => {
      geo.dispose();
      mat.dispose();
      for (const inst of pools.values()) {
        inst.geometry.dispose();
        (inst.material as THREE.Material).dispose();
      }
    },
  };
}

function makeProp(kind: PropKind, x: number, z: number, y: number, r: () => number): Prop {
  const [rad, fixed] = PROP_R[kind];
  const scale = 0.85 + r() * 0.35;
  return { kind, x, z, y, rot: r() * Math.PI * 2, scale, r: rad * scale, fixed: fixed > 0, dead: false, slot: -1 };
}

export function propHeight(kind: PropKind) {
  return PROP_R[kind][2];
}

/**
 * What each piece of street furniture looks like.
 *
 * Built from the same parts kit as the city next door, so a stall is a frame
 * with a cloth over it rather than a coloured cube. It matters more than it
 * sounds: these are the things the player spends the whole game hitting, and
 * the moment of hitting one has to be legible at forty metres a second.
 */
function propGeometry(kind: PropKind, place: Place): {
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
} {
  const out = parts();
  const put = (g: THREE.BufferGeometry, role: number, x = 0, y = 0, z = 0) => {
    g.translate(x, y, z);
    add(out, g, role);
  };
  switch (kind) {
    case 'stall': {
      for (const sx of [-1, 1])
        for (const sz of [-1, 1]) put(slab(0.12, 2.1, 0.12), R.trim, sx * 1.5, 1.05, sz * 0.9);
      put(slab(3.3, 0.14, 2.0), R.wall, 0, 0.95, 0);
      // The awning: a sagging sheet, made as a profile so it has a curve in it.
      put(
        profile(
          [
            [-1.85, 0],
            [-0.9, 0.28],
            [0, 0.36],
            [0.9, 0.28],
            [1.85, 0],
          ],
          2.4,
          0.02,
        ),
        R.cloth,
        0,
        2.1,
        0,
      );
      for (let i = 0; i < 6; i++)
        put(box(0.34, 0.24, 0.3), R.goods, -1.2 + i * 0.48, 1.14, (i % 2) * 0.5 - 0.25);
      break;
    }
    case 'cart': {
      put(slab(2.4, 0.18, 1.3), R.wall, 0, 0.86, 0);
      put(slab(2.4, 0.5, 0.1), R.trim, 0, 1.12, 0.62);
      put(slab(2.4, 0.5, 0.1), R.trim, 0, 1.12, -0.62);
      for (const sx of [-0.8, 0.8]) {
        const w = new THREE.CylinderGeometry(0.42, 0.42, 0.1, 14);
        w.rotateX(Math.PI / 2);
        put(w, R.tyre, sx, 0.42, 0.66);
        const w2 = w.clone();
        put(w2, R.tyre, sx, 0.42, -0.66);
      }
      put(slab(0.1, 0.1, 1.6), R.trim, 1.3, 0.9, 0);
      break;
    }
    case 'chai': {
      put(slab(1.6, 0.12, 1.0), R.wall, 0, 0.82, 0);
      for (const sx of [-1, 1]) put(slab(0.09, 0.85, 0.09), R.trim, sx * 0.7, 0.42, 0);
      put(new THREE.CylinderGeometry(0.26, 0.3, 0.4, 12), R.metal, -0.3, 1.06, 0);
      put(new THREE.CylinderGeometry(0.16, 0.16, 0.22, 10), R.metal, 0.4, 0.97, 0);
      put(profile([[-0.9, 0], [0, 0.22], [0.9, 0]], 1.3, 0.02), R.cloth, 0, 1.85, 0);
      break;
    }
    case 'bin':
      put(new THREE.CylinderGeometry(0.34, 0.28, 0.9, 12), R.metal, 0, 0.45, 0);
      put(new THREE.CylinderGeometry(0.37, 0.37, 0.08, 12), R.trim, 0, 0.94, 0);
      break;
    case 'barrel':
      put(new THREE.CylinderGeometry(0.32, 0.32, 0.94, 12), R.goods, 0, 0.47, 0);
      put(new THREE.TorusGeometry(0.33, 0.03, 6, 12).rotateX(Math.PI / 2), R.metal, 0, 0.7, 0);
      break;
    case 'cone':
      put(new THREE.ConeGeometry(0.24, 0.62, 10), R.cone, 0, 0.34, 0);
      put(box(0.5, 0.06, 0.5), R.cone, 0, 0.03, 0);
      break;
    case 'crate':
      put(box(0.8, 0.8, 0.8, 0.03), R.goods, 0, 0.4, 0);
      put(slab(0.86, 0.07, 0.07), R.trim, 0, 0.4, 0.4);
      break;
    case 'pile':
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        put(box(0.7, 0.28, 0.5, 0.05), R.goods, Math.cos(a) * 0.3, 0.14 + i * 0.18, Math.sin(a) * 0.3);
      }
      break;
    case 'pot':
      put(new THREE.SphereGeometry(0.32, 12, 8), R.clay, 0, 0.34, 0);
      put(new THREE.CylinderGeometry(0.16, 0.2, 0.16, 10), R.clay, 0, 0.62, 0);
      break;
    case 'melon':
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2;
        put(new THREE.SphereGeometry(0.22, 8, 6), R.green, Math.cos(a) * 0.42, 0.22, Math.sin(a) * 0.42);
      }
      put(new THREE.SphereGeometry(0.24, 8, 6), R.green, 0, 0.5, 0);
      break;
    case 'hoarding': {
      for (const sx of [-1, 1]) put(slab(0.2, 3.2, 0.2), R.metal, sx * 1.9, 1.6, 0);
      put(slab(4.6, 2.4, 0.18), R.sign, 0, 4.2, 0);
      put(slab(4.9, 0.16, 0.3), R.metal, 0, 5.45, 0);
      break;
    }
    case 'sign':
      put(new THREE.CylinderGeometry(0.06, 0.06, 2.4, 8), R.metal, 0, 1.2, 0);
      put(slab(0.9, 0.6, 0.06), R.sign, 0, 2.3, 0);
      break;
    case 'bollard':
      put(new THREE.CylinderGeometry(0.11, 0.13, 0.8, 10), R.metal, 0, 0.4, 0);
      put(new THREE.SphereGeometry(0.13, 8, 6), R.metal, 0, 0.82, 0);
      break;
    case 'lamp': {
      put(new THREE.CylinderGeometry(0.09, 0.14, 6.2, 8), R.metal, 0, 3.1, 0);
      put(profile([[0, 0], [0.5, 0.4], [1.3, 0.5]], 0.14, 0.02), R.metal, 0, 6.2, 0);
      put(slab(0.5, 0.22, 0.3), R.lit, 1.3, 6.6, 0);
      break;
    }
    case 'shelter': {
      for (const sx of [-1, 1]) put(slab(0.14, 2.4, 0.14), R.metal, sx * 2.2, 1.2, -0.7);
      put(slab(4.8, 0.16, 1.7), R.sign, 0, 2.5, 0);
      put(slab(4.6, 1.6, 0.1), R.glass, 0, 1.5, -0.78);
      put(slab(4.2, 0.12, 0.5), R.trim, 0, 0.55, -0.4);
      break;
    }
    case 'scooter': {
      put(box(1.2, 0.36, 0.44, 0.14), R.paint2, 0, 0.6, 0);
      put(box(0.5, 0.16, 0.34, 0.07), R.trim, -0.4, 0.85, 0);
      for (const sx of [-0.6, 0.6]) {
        const w = new THREE.TorusGeometry(0.26, 0.09, 6, 12);
        w.rotateY(Math.PI / 2);
        put(w, R.tyre, sx, 0.28, 0);
      }
      put(slab(0.06, 0.6, 0.5), R.metal, 0.6, 0.9, 0);
      break;
    }
    case 'palm': {
      put(new THREE.CylinderGeometry(0.16, 0.3, 7.4, 8), R.trunk, 0, 3.7, 0);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const frond = profile(
          [
            [0, 0],
            [1.2, 0.5],
            [2.4, 0.3],
            [3.2, -0.5],
          ],
          0.7,
          0.02,
        );
        frond.rotateY(-a);
        put(frond, R.green, Math.cos(a) * 0.2, 7.3, Math.sin(a) * 0.2);
      }
      break;
    }
    case 'tree': {
      put(new THREE.CylinderGeometry(0.2, 0.34, 3.4, 8), R.trunk, 0, 1.7, 0);
      for (let i = 0; i < 4; i++) {
        const s = 1 - i * 0.18;
        put(new THREE.IcosahedronGeometry(1.5 * s, 1), R.green, (i % 2) * 0.4 - 0.2, 3.6 + i * 0.9, (i % 3) * 0.3 - 0.3);
      }
      break;
    }
  }
  return { geometry: tint(finish(out), place, 7), material: propMaterial(place) };
}

/**
 * Roles into colours.
 *
 * The builder leaves an `aRole` index on every vertex; this resolves it once,
 * on the CPU, into a plain vertex colour. A custom shader would do the same job
 * and cost a shader — and a mesh with baked colours is one draw call that any
 * material can render, which matters more than the flexibility does.
 *
 * Walls get a per-building jitter so a street is a street rather than a swatch.
 */
function tint(geo: THREE.BufferGeometry, place: Place, seed: number): THREE.BufferGeometry {
  const role = geo.getAttribute('aRole');
  const pos = geo.getAttribute('position');
  const r = rng(seed ^ 0x2f1d);
  const c = new THREE.Color();
  const out = new Float32Array(role.count * 3);
  const w0 = new THREE.Color(place.wall[0]);
  const w1 = new THREE.Color(place.wall[1]);
  // One hue per building rather than per vertex, keyed off where it stands.
  const shades: number[] = [];
  for (let i = 0; i < 64; i++) shades.push(r());
  const table: Record<number, string> = {
    [R.road]: place.ground,
    [R.kerb]: place.kerb,
    [R.paint]: '#d8cf9e',
    [R.trim]: place.kerb,
    [R.park]: place.id === 'shimla' ? '#7d8a76' : place.id === 'chowk' ? '#7c6c56' : place.id === 'goa' ? '#9b8b6c' : '#5f5f57',
    [R.cloth]: place.id === 'chowk' ? '#c8452f' : '#c9c2ac',
    [R.goods]: '#9a7444',
    [R.metal]: '#6e6f70',
    [R.tyre]: '#232326',
    [R.sign]: '#c4a552',
    [R.glass]: '#8fa6ac',
    [R.glow]: '#ffd9a0',
    [R.clay]: '#a45c3a',
    [R.green]: place.id === 'shimla' ? '#4d6a52' : '#4e7a3c',
    [R.trunk]: '#6a5340',
    [R.cone]: '#d4622c',
    [R.paint2]: '#3f6f86',
    [R.window]: place.night ? '#191b21' : '#39424d',
    [R.lit]: place.night ? '#d8b071' : '#4a525e',
  };
  for (let i = 0; i < role.count; i++) {
    const k = role.getX(i);
    if (k === R.wall) {
      const bucket = Math.abs(Math.round(pos.getX(i) / 7) * 31 + Math.round(pos.getZ(i) / 7) * 17) % 64;
      c.copy(w0).lerp(w1, shades[bucket]);
      // A street painted from two colours mixed along one line is one colour
      // with a slider on it. The hue has to move as well, or a whole city comes
      // out in a single wash of brown.
      c.offsetHSL((shades[(bucket + 13) % 64] - 0.5) * 0.09, (shades[(bucket + 29) % 64] - 0.5) * 0.22, 0);
      // Floor bands: every storey is a shade off the one below it, which is
      // what a row of windows does to a facade seen from a moving car.
      const band = Math.sin(pos.getY(i) * 1.9) * 0.05;
      c.offsetHSL(0, 0, band - shades[(bucket + 7) % 64] * 0.06);
    } else {
      c.set(table[k] ?? '#888888');
    }
    out[i * 3] = c.r;
    out[i * 3 + 1] = c.g;
    out[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(out, 3));
  // Lit windows have to go through emission, not albedo. A window painted
  // bright yellow is bright yellow *multiplied by the light on it*, so it goes
  // out when the sun does — which on a night map is always.
  const glow = new Float32Array(role.count);
  for (let i = 0; i < role.count; i++) glow[i] = role.getX(i) === R.lit ? 1 : 0;
  geo.setAttribute('aGlow', new THREE.Float32BufferAttribute(glow, 1));
  geo.deleteAttribute('aRole');
  return geo;
}

/**
 * Let the `aGlow` attribute add light.
 *
 * Three lines of injected GLSL rather than a second material and a second draw
 * call. `totalEmissiveRadiance` is the one place a standard material will take
 * light that the scene's own lighting does not touch.
 */
function lit(mat: THREE.MeshStandardMaterial) {
  mat.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aGlow;\nvarying float vGlow;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvGlow = aGlow;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vGlow;')
      .replace(
        '#include <emissivemap_fragment>',
        '#include <emissivemap_fragment>\ntotalEmissiveRadiance += vGlow * vec3(1.0, 0.79, 0.48) * 1.15;',
      );
  };
  return mat;
}

function propMaterial(place: Place) {
  return lit(
    new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.82,
      metalness: 0.06,
      emissive: new THREE.Color(place.night ? 0x151313 : 0x000000),
    }),
  );
}
