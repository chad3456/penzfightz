import * as THREE from 'three';
import { Roads } from './roads';
import { Buildings, massing, type Massing, type Zone } from './buildings';
import { cutLots, findBlocks, type Block, type Lot } from './blocks';
import { RoadMesh } from './ribbon';
import { Traffic } from './traffic';
import { Ground } from './yards';
import { WORLD, type Terrain } from './terrain';

/**
 * The city: what the road graph implies, plus what the player has painted on
 * top of it.
 *
 * The whole thing is derived. Roads are the only authored state that matters;
 * blocks, lots, and the buildings standing on them are recomputed from the
 * graph whenever it changes. That is a deliberate trade — it means bulldozing a
 * street through the middle of a block re-cuts every lot around it for free,
 * and it means there is exactly one place where the city's shape is decided.
 *
 * The cost is that lot ids are not stable across a rebuild, so buildings cannot
 * be keyed on them. They are keyed on their position, rounded to four metres,
 * which survives a re-cut of the same block and correctly loses the buildings
 * whose ground has been rearranged underneath them.
 */

export const ZRES = 96;
const ZCELL = WORLD / ZRES;
const ZONES: Zone[] = ['res', 'com', 'ind', 'off', 'park'];

export interface Built {
  key: string;
  lot: Lot;
  zone: Zone;
  m: Massing;
  people: number;
  jobs: number;
}

const TINT: Record<Zone, [number, number, number]> = {
  res: [0.36, 0.78, 0.42],
  com: [0.29, 0.62, 0.96],
  ind: [0.95, 0.76, 0.28],
  off: [0.72, 0.44, 0.93],
  park: [0.18, 0.86, 0.62],
};

export class City {
  readonly group = new THREE.Group();
  readonly roads: Roads;
  readonly buildings: Buildings;
  readonly roadMesh: RoadMesh;
  readonly traffic: Traffic;
  readonly ground: Ground;
  readonly overlay: THREE.Mesh;

  blocks: Block[] = [];
  lots: Lot[] = [];
  built = new Map<string, Built>();
  /** Zone per cell, 0 = unzoned, otherwise an index into ZONES plus one. */
  zoning = new Uint8Array(ZRES * ZRES);

  private zoneTex: THREE.DataTexture;
  private zoneData: Uint8Array;
  private lotId = 1;
  private lastVersion = -1;
  private meshDirty = false;
  private groundDirty = false;
  /** Which blocks were parks last time the ground was built. */
  private parkSig = '';
  private free: Lot[] = [];

  constructor(private terrain: Terrain, seed: number) {
    this.roads = new Roads(terrain);
    this.buildings = new Buildings(terrain);
    void seed;
    this.roadMesh = new RoadMesh(terrain);
    this.traffic = new Traffic(terrain);
    this.ground = new Ground(terrain);

    this.zoneData = new Uint8Array(ZRES * ZRES * 4);
    this.zoneTex = new THREE.DataTexture(this.zoneData, ZRES, ZRES, THREE.RGBAFormat);
    this.zoneTex.needsUpdate = true;
    this.zoneTex.minFilter = THREE.NearestFilter;
    this.zoneTex.magFilter = THREE.NearestFilter;

    this.overlay = this.buildOverlay();
    this.group.add(this.ground.group, this.overlay, this.roadMesh.group, this.buildings.group, this.traffic.group);
  }

  // ------------------------------------------------------------------ zoning

  /**
   * The zone painting, drawn on the terrain itself.
   *
   * It shares the terrain's geometry rather than cloning it — a hundred and
   * thirty thousand vertices are not worth duplicating to draw a wash of
   * colour — and reads world x/z straight off the position, which works only
   * because the terrain mesh is built in world units already.
   */
  private buildOverlay(): THREE.Mesh {
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -3,
      uniforms: {
        uZone: { value: this.zoneTex },
        uWorld: { value: WORLD },
        uShow: { value: 0 },
        uCell: { value: ZCELL },
      },
      vertexShader: `
varying vec3 vW;
void main() {
  vW = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`,
      fragmentShader: `
uniform sampler2D uZone;
uniform float uWorld;
uniform float uShow;
uniform float uCell;
varying vec3 vW;
void main() {
  if (uShow < 0.01) discard;
  vec2 uv = vW.xz / uWorld + 0.5;
  vec4 z = texture2D(uZone, uv);
  vec2 g = abs(fract(vW.xz / uCell) - 0.5);
  float grid = smoothstep(0.47, 0.5, max(g.x, g.y)) * 0.25;
  float a = (z.a * 0.42 + grid) * uShow;
  if (a < 0.004) discard;
  gl_FragColor = vec4(z.rgb + grid * 0.6, a);
}`,
    });
    const m = new THREE.Mesh(this.terrain.mesh.geometry, mat);
    m.renderOrder = 2;
    m.frustumCulled = false;
    return m;
  }

  showZones(on: boolean) {
    (this.overlay.material as THREE.ShaderMaterial).uniforms.uShow.value = on ? 1 : 0;
  }

  private cell(x: number, z: number) {
    const i = Math.floor((x + WORLD / 2) / ZCELL);
    const j = Math.floor((z + WORLD / 2) / ZCELL);
    if (i < 0 || j < 0 || i >= ZRES || j >= ZRES) return -1;
    return j * ZRES + i;
  }

  paint(x: number, z: number, radius: number, zone: Zone | null) {
    const v = zone ? ZONES.indexOf(zone) + 1 : 0;
    const r = Math.ceil(radius / ZCELL);
    const ci = Math.floor((x + WORLD / 2) / ZCELL);
    const cj = Math.floor((z + WORLD / 2) / ZCELL);
    let touched = false;
    for (let j = cj - r; j <= cj + r; j++) {
      for (let i = ci - r; i <= ci + r; i++) {
        if (i < 0 || j < 0 || i >= ZRES || j >= ZRES) continue;
        const px = -WORLD / 2 + (i + 0.5) * ZCELL;
        const pz = -WORLD / 2 + (j + 0.5) * ZCELL;
        if (Math.hypot(px - x, pz - z) > radius) continue;
        const k = j * ZRES + i;
        if (this.zoning[k] === v) continue;
        this.zoning[k] = v;
        const t = zone ? TINT[zone] : [0, 0, 0];
        this.zoneData[k * 4] = t[0] * 255;
        this.zoneData[k * 4 + 1] = t[1] * 255;
        this.zoneData[k * 4 + 2] = t[2] * 255;
        this.zoneData[k * 4 + 3] = zone ? 255 : 0;
        touched = true;
      }
    }
    if (touched) {
      this.zoneTex.needsUpdate = true;
      this.reassign();
    }
  }

  zoneAt(x: number, z: number): Zone | null {
    const k = this.cell(x, z);
    if (k < 0) return null;
    const v = this.zoning[k];
    return v ? ZONES[v - 1] : null;
  }

  // ------------------------------------------------------------------ shape

  /** Re-derive blocks and lots. Only when the graph actually moved. */
  syncGraph() {
    if (this.roads.version === this.lastVersion) return false;
    this.lastVersion = this.roads.version;
    this.lotId = 1;
    this.blocks = findBlocks(this.roads);
    this.lots = [];
    for (const b of this.blocks) {
      b.lots = cutLots(b, this.roads, () => this.lotId++);
      this.lots.push(...b.lots);
    }
    this.roadMesh.build(this.roads);
    this.parkSig = '';
    this.groundDirty = true;
    this.traffic.populate(this.roads, Math.min(760, Math.round(this.roads.segments.size * 5)));
    this.reassign();
    return true;
  }

  /**
   * Match the standing buildings to the current lots and zoning.
   *
   * A building survives when a lot still exists roughly where it stands and
   * still wants the same use. Everything else is knocked down, which is the
   * honest outcome: re-zoning a street from houses to warehouses should cost
   * the houses.
   */
  private reassign() {
    // Zoning only reaches the ground through which blocks are parks, and
    // rebuilding it scatters a few thousand trees. So it is rebuilt when that
    // answer changes and not once per frame of a paint stroke.
    const sig = this.blocks.map((b) => (this.zoneAt(mid(b.ring).x, mid(b.ring).z) === 'park' ? 1 : 0)).join('');
    if (sig !== this.parkSig) {
      this.parkSig = sig;
      this.groundDirty = true;
    }
    const alive = new Map<string, Built>();
    this.free = [];
    for (const lot of this.lots) {
      const key = keyOf(lot);
      const zone = this.zoneAt(lot.x, lot.z);
      const had = this.built.get(key);
      if (!zone || zone === 'park') {
        if (had) this.meshDirty = true;
        continue;
      }
      if (had && had.zone === zone) {
        had.lot = lot;
        alive.set(key, had);
      } else {
        if (had) this.meshDirty = true;
        this.free.push(lot);
      }
    }
    if (alive.size !== this.built.size) this.meshDirty = true;
    this.built = alive;
  }

  /**
   * Let a few lots build.
   *
   * Land value first, so a city grows outward from where it is worth being
   * rather than filling in reading order, and with enough randomness that the
   * skyline is not a smooth cone.
   */
  grow(demand: Record<Zone, number>, budget: number) {
    if (!this.free.length || budget <= 0) return;
    const pick: { lot: Lot; zone: Zone; score: number }[] = [];
    for (const lot of this.free) {
      const zone = this.zoneAt(lot.x, lot.z);
      if (!zone || zone === 'park') continue;
      const d = demand[zone];
      if (d <= 0.02) continue;
      const value = 1 / (1 + lot.central / 620);
      pick.push({ lot, zone, score: value * d * (0.45 + Math.random()) });
    }
    pick.sort((a, b) => b.score - a.score);
    pick.length = Math.min(pick.length, budget);

    for (const { lot, zone } of pick) {
      const m = massing(lot, zone, demand[zone], this.terrain.seed + lot.id);
      if (!m) continue;
      const key = keyOf(lot);
      const area = lot.width * lot.depth * m.floors;
      this.built.set(key, {
        key,
        lot,
        zone,
        m,
        // Roughly a flat per person and twenty-five square metres per desk,
        // both generous, both only there to make the numbers move sensibly.
        people: zone === 'res' ? Math.max(1, Math.round(area / 78)) : 0,
        jobs: zone === 'res' ? 0 : Math.max(1, Math.round(area / (zone === 'ind' ? 46 : 26))),
      });
      this.meshDirty = true;
    }
    if (pick.length) this.free = this.free.filter((l) => !this.built.has(keyOf(l)));
  }

  /** Abandon the least valuable buildings of a use nobody wants. */
  abandon(zone: Zone, count: number) {
    const list = [...this.built.values()]
      .filter((b) => b.zone === zone)
      .sort((a, b) => b.lot.central - a.lot.central)
      .slice(0, count);
    for (const b of list) {
      this.built.delete(b.key);
      this.free.push(b.lot);
      this.meshDirty = true;
    }
  }

  /**
   * Is there a building here?
   *
   * A three-metre grid of everything the footprints cover, rebuilt with the
   * mesh. Driving needs an answer to this sixty times a second and cannot pay
   * for a proper broad phase; a hash lookup on a rounded coordinate is exact
   * enough when the thing asking is two metres wide.
   */
  blocked(x: number, z: number): boolean {
    return this.solid.has(cell3(x, z));
  }

  private solid = new Set<number>();

  private rebuildSolid() {
    this.solid.clear();
    for (const b of this.built.values()) {
      for (const box of b.m.boxes) {
        const c = Math.cos(box.rot);
        const s = Math.sin(box.rot);
        const hw = box.w / 2;
        const hd = box.d / 2;
        for (let u = -hw; u <= hw; u += 2.4) {
          for (let v = -hd; v <= hd; v += 2.4) {
            this.solid.add(cell3(box.x + u * c - v * s, box.z + u * s + v * c));
          }
        }
      }
    }
  }

  /** Rebuild the merged building mesh, if anything moved since last time. */
  flush() {
    if (this.groundDirty) {
      // Rebuilt here rather than in paint(), because a paint stroke calls
      // reassign a few dozen times a second and this scatters a few thousand
      // trees.
      this.groundDirty = false;
      this.ground.build(this.blocks, (x, z) => this.zoneAt(x, z));
    }
    if (!this.meshDirty) return;
    this.meshDirty = false;
    this.rebuildSolid();
    this.buildings.build([...this.built.values()].map((b) => ({ lot: b.lot, zone: b.zone, m: b.m })));
  }

  setNight(n: number, t: number) {
    this.buildings.setNight(n, t);
    this.roadMesh.setNight(n, t);
    this.traffic.setNight(n);
  }

  /** A starter grid, so the first thing on screen is a place and not a field. */
  seed(cx: number, cz: number) {
    const A = 108;
    const B = 132;
    for (let i = -2; i <= 2; i++) {
      const kind = i === 0 ? 'avenue' : 'street';
      this.roads.lay(cx + i * A, cz - B * 2, cx + i * A, cz + B * 2, kind);
    }
    for (let j = -2; j <= 2; j++) {
      const kind = j === 0 ? 'avenue' : 'street';
      this.roads.lay(cx - A * 2, cz + j * B, cx + A * 2, cz + j * B, kind);
    }
    this.syncGraph();
    for (let i = -2; i <= 2; i++) {
      for (let j = -2; j <= 2; j++) {
        const x = cx + i * A - A / 2;
        const z = cz + j * B - B / 2;
        const near = Math.abs(i) + Math.abs(j);
        this.paint(x, z, 52, near < 2 ? 'com' : near < 3 ? 'res' : 'ind');
      }
    }
  }
}

/** Key for a three-metre cell, packed into one integer. */
function cell3(x: number, z: number) {
  return ((Math.round(x / 3) + 4096) << 13) | (Math.round(z / 3) + 4096);
}

function mid(ring: { x: number; z: number }[]) {
  let x = 0;
  let z = 0;
  for (const p of ring) {
    x += p.x;
    z += p.z;
  }
  return { x: x / ring.length, z: z / ring.length };
}

function keyOf(lot: Lot) {
  return `${Math.round(lot.x / 4)}:${Math.round(lot.z / 4)}`;
}
