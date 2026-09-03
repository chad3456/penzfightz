import * as THREE from 'three';
import type { Lot } from './blocks';
import type { Terrain } from './terrain';

/**
 * The buildings.
 *
 * The fidelity in an aerial city shot does not come from the massing. It comes
 * from **facades** — floor lines, mullions, glass that is darker than the wall,
 * a ground floor that is not like the floors above it, and at night a grid of
 * windows where some are on and some are not. Modelled as geometry that is tens
 * of millions of triangles. Drawn in the fragment shader it is free, and it is
 * the same picture.
 *
 * So every building here is a small stack of boxes, all of them merged into one
 * geometry with one material, and everything you actually look at is done in
 * the shader from four per-vertex attributes: the size of the box the fragment
 * is on, its position within that box in metres, whether the face is a wall or
 * a roof, and a seed.
 *
 * ### Why metres and not UVs
 *
 * The facade UV is *in metres*, not normalised. A floor is 3.4 m everywhere, a
 * window bay is 2.7 m everywhere, and a tower and a corner shop therefore have
 * windows of the same size. Normalised UVs give every building the same number
 * of floors, which is the single most obvious tell in a procedural city and is
 * visible from any distance at all.
 */

export type Zone = 'res' | 'com' | 'ind' | 'off' | 'park';

export interface Box {
  x: number;
  y: number;
  z: number;
  w: number;
  h: number;
  d: number;
  rot: number;
  /** Plain concrete: a balcony slab, a parapet, a lift overrun. No windows. */
  plain?: boolean;
}

export interface Massing {
  /** Boxes, in world space, already rotated to the lot's facing. */
  boxes: Box[];
  floors: number;
  height: number;
  /** 0 plant, 1 mast, 2 roof light, 3 water tank, 4 hoarding, 5 dish. */
  props: { x: number; y: number; z: number; s: number; kind: number; rot?: number }[];
}

const FLOOR = 3.4;

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
 * How tall a thing gets, given what it is and where it is.
 *
 * Density falls off from the centre, and the fall-off is what produces a
 * skyline instead of a slab: towers downtown, mid-rise around them, houses at
 * the edge. It is the one rule every real city obeys and the one most
 * generated cities forget.
 */
export function massing(lot: Lot, zone: Zone, demand: number, seed: number): Massing | null {
  if (zone === 'park') return null;
  const r = rng(seed ^ (lot.id * 2654435761));
  const central = Math.max(0, 1 - lot.central / 760);
  const pressure = Math.min(1, central * 0.85 + demand * 0.5) * (0.6 + r() * 0.55);

  // How much of the lot the building covers across its frontage. Shops and
  // offices build to both boundaries — that is what a high street is, an
  // unbroken wall of frontage — while houses leave a gap between them.
  const fill = zone === 'com' || zone === 'off' ? 0.99 : zone === 'ind' ? 0.94 : 0.80 + r() * 0.13;
  const w = Math.max(9, lot.width * fill);
  const d = Math.max(9, lot.depth * (0.72 + r() * 0.2));
  const boxes: Massing['boxes'] = [];
  const props: Massing['props'] = [];

  let floors: number;
  if (zone === 'ind') floors = 1 + Math.floor(r() * 2);
  // Residential height is skewed hard rather than spread evenly: a real city
  // is mostly two and three storeys with a few towers in it, not a smooth ramp
  // from one to twenty.
  else if (zone === 'res') floors = Math.max(1, Math.round(1 + Math.pow(pressure, 2.6) * 24 + r() * 2));
  else if (zone === 'com') floors = Math.max(1, Math.round(1 + Math.pow(pressure, 1.7) * 12 + r() * 2));
  else floors = Math.max(2, Math.round(3 + pressure * pressure * 40 + r() * 4));

  const rot = lot.facing;
  const push = (dy: number, sw: number, sd: number, h: number, plain = false) => {
    boxes.push({ x: lot.x, y: dy, z: lot.z, w: sw, d: sd, h, rot, plain });
  };
  // Everything that projects from the front does so along the lot's facing,
  // which is why the balcony maths is one line: the frontage is +d/2 away
  // along the facing, always, whatever direction that happens to be.
  const fx = Math.cos(rot);
  const fz = Math.sin(rot);
  const front = (dy: number, out: number, sw: number, sd: number, h: number, plain = true) => {
    boxes.push({
      x: lot.x + fx * out,
      y: dy,
      z: lot.z + fz * out,
      w: sw,
      d: sd,
      h,
      rot,
      plain,
    });
  };

  if (zone === 'ind') {
    const h = floors * 5.2;
    push(0, w * 1.02, d * 0.95, h);
    // A row of roof lights along the shed, which is what an industrial roof is.
    for (let i = 0; i < 4; i++) props.push({ x: lot.x, y: h, z: lot.z, s: 1, kind: 2 });
  } else if (floors <= 2 && zone !== 'off') {
    // The low, dense fabric: two floors, a flat roof, and a tank on it. These
    // are most of the buildings in the city and they are what keeps the
    // skyline from being made entirely of towers.
    const h = floors * 3.0;
    push(0, w, d, h);
    push(h, w, d, 0.4, true);
    props.push({ x: lot.x + (r() - 0.4) * w * 0.4, y: h + 0.4, z: lot.z + (r() - 0.4) * d * 0.4, s: 0.9 + r() * 0.4, kind: 3 });
  } else if (floors <= 6) {
    // The walk-up: a continuous access balcony along the front of every floor,
    // with a parapet on it. It is the single most recognisable thing about a
    // street of this kind and it is four boxes a floor.
    const h = floors * FLOOR;
    push(0, w, d, h);
    const out = d / 2 + 0.85;
    for (let i = 1; i < floors; i++) {
      front(i * FLOOR, out * 0.5 - 0.1, w * 0.94, 1.7, 0.22);
      front(i * FLOOR + 0.22, out * 0.5 + 0.32, w * 0.94, 0.14, 0.86);
    }
    push(h, w, d, 0.5, true);
    props.push({ x: lot.x, y: h + 0.5, z: lot.z, s: 1.0 + r() * 0.5, kind: 3 });
    if (r() < 0.4) props.push({ x: lot.x + w * 0.2, y: h + 0.5, z: lot.z - d * 0.2, s: 0.8, kind: 0 });
  } else {
    // Setbacks. Three stacked boxes at most, each stepped in, because a tower
    // that is one extruded rectangle reads as a bar of soap from any angle.
    const steps = floors > 26 ? 3 : floors > 12 ? 2 : 1;
    let y = 0;
    let sw = w;
    let sd = d;
    let left = floors;
    for (let i = 0; i < steps; i++) {
      const take = i === steps - 1 ? left : Math.max(2, Math.round(left * (0.42 + r() * 0.2)));
      const h = take * FLOOR;
      push(y, sw, sd, h);
      // Residential towers get projecting balconies; offices do not, which is
      // most of what separates the two at a distance.
      if (zone === 'res') {
        const cols = Math.max(1, Math.round(sw / 6.5));
        for (let f = 1; f < take; f++) {
          for (let k = 0; k < cols; k++) {
            const off = (k - (cols - 1) / 2) * (sw / cols);
            boxes.push({
              x: lot.x + fx * (sd / 2 + 0.55) - fz * off,
              y: y + f * FLOOR,
              z: lot.z + fz * (sd / 2 + 0.55) + fx * off,
              w: sw / cols - 1.0,
              h: 0.2,
              d: 1.3,
              rot,
              plain: true,
            });
            boxes.push({
              x: lot.x + fx * (sd / 2 + 1.12) - fz * off,
              y: y + f * FLOOR + 0.2,
              z: lot.z + fz * (sd / 2 + 1.12) + fx * off,
              w: sw / cols - 1.0,
              h: 0.9,
              d: 0.12,
              rot,
              plain: true,
            });
          }
        }
      }
      y += h;
      left -= take;
      sw *= 0.74 + r() * 0.12;
      sd *= 0.74 + r() * 0.12;
    }
    // A crown: plant, mast, or a small penthouse — and the tanks and dishes
    // that cover every flat roof in the city.
    push(y, sw * 0.94, sd * 0.94, 0.6, true);
    if (floors > 14) {
      push(y + 0.6, sw * 0.5, sd * 0.5, FLOOR * 1.6);
      props.push({ x: lot.x, y: y + 0.6 + FLOOR * 1.6, z: lot.z, s: floors > 30 ? 2.4 : 1.5, kind: 1 });
    }
    props.push({ x: lot.x - sw * 0.22, y: y + 0.6, z: lot.z + sd * 0.2, s: 1.1 + r() * 0.6, kind: 3 });
    if (r() < 0.5) props.push({ x: lot.x + sw * 0.24, y: y + 0.6, z: lot.z - sd * 0.18, s: 0.9, kind: 5 });
  }

  const height = boxes.reduce((m, b) => Math.max(m, b.y + b.h), 0);
  // Rooftop plant on anything flat and big enough to want it.
  if (zone !== 'ind' && floors >= 3) {
    const n = 1 + Math.floor(r() * 3);
    for (let i = 0; i < n; i++) {
      props.push({
        x: lot.x + (r() - 0.5) * w * 0.5,
        y: height,
        z: lot.z + (r() - 0.5) * d * 0.5,
        s: 0.8 + r() * 0.9,
        kind: 0,
      });
    }
  }
  // A hoarding, on the roof of a shop or a low block on a good corner. They
  // are everywhere, they are enormous, and from the air they are half the
  // colour in the picture.
  if ((zone === 'com' || (zone === 'res' && floors <= 6)) && r() < 0.34) {
    props.push({ x: lot.x, y: height, z: lot.z, s: Math.min(w * 0.42, 5.5), kind: 4, rot });
  }
  return { boxes, floors, height, props };
}

// --------------------------------------------------------------------- mesh

const ZONE_ID: Record<Zone, number> = { res: 0, com: 1, ind: 2, off: 3, park: 4 };

/** Side of a build chunk, in metres. */
export const CHUNK = 260;

interface Chunk {
  mesh: THREE.Mesh | null;
  props: THREE.InstancedMesh[];
  /** Cheap content hash, so an unchanged chunk is not rebuilt. */
  sig: number;
}

export class Buildings {
  readonly group = new THREE.Group();
  readonly material: THREE.MeshStandardMaterial;
  /** Rooftop clutter beyond this many metres is not drawn at all. */
  propRange = 700;

  private chunks = new Map<number, Chunk>();
  private focus = new THREE.Vector3();
  private uniforms = {
    uNight: { value: 0 },
    uTime: { value: 0 },
  };

  constructor(private terrain: Terrain) {
    this.material = new THREE.MeshStandardMaterial({ roughness: 0.72, metalness: 0.06 });
    this.material.onBeforeCompile = (sh) => {
      sh.uniforms.uNight = this.uniforms.uNight;
      sh.uniforms.uTime = this.uniforms.uTime;
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', `#include <common>
attribute vec3 aSize;
attribute vec3 aLocal;
attribute float aFace;
attribute float aSeed;
attribute float aZone;
varying vec3 vSize; varying vec3 vLocal; varying float vFace; varying float vSeed; varying float vZone;`)
        .replace('#include <begin_vertex>', `#include <begin_vertex>
vSize = aSize; vLocal = aLocal; vFace = aFace; vSeed = aSeed; vZone = aZone;`);

      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>
uniform float uNight;
uniform float uTime;
varying vec3 vSize; varying vec3 vLocal; varying float vFace; varying float vSeed; varying float vZone;

/**
 * Light the building makes, as opposed to light that falls on it.
 *
 * Filled in with the walls and read again at the emissive chunk further down
 * main(). It has to travel that way: a lit window added to the albedo is a
 * window that goes out when the sun does, which is the one time of day it is
 * supposed to be on.
 */
vec3 gGlow;

float h11(float p) { return fract(sin(p * 127.1) * 43758.5453); }
float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

/**
 * The wall.
 *
 * Three materials per use rather than one tinted one, because what makes a
 * street of generated buildings look generated is not that the colours are
 * wrong, it is that they are all the same colour at slightly different
 * brightnesses. A real terrace is brick next to render next to painted stone,
 * and those are different hues, not different exposures of one hue.
 */
vec3 wallColour(float zone, float seed) {
  float pick = h11(seed * 3.1 + zone);
  float tone = h11(seed * 12.9 + 4.0);

  // Homes: London stock brick, warm render, and a pale painted terrace.
  vec3 res = mix(vec3(0.42, 0.26, 0.20), vec3(0.55, 0.36, 0.27), tone);
  res = mix(res, mix(vec3(0.72, 0.62, 0.48), vec3(0.84, 0.76, 0.62), tone), step(0.36, pick));
  res = mix(res, mix(vec3(0.80, 0.79, 0.75), vec3(0.90, 0.88, 0.83), tone), step(0.72, pick));

  // Shops: render, stone, and the odd sheet of dark cladding.
  vec3 com = mix(vec3(0.76, 0.72, 0.64), vec3(0.88, 0.85, 0.79), tone);
  com = mix(com, mix(vec3(0.62, 0.60, 0.57), vec3(0.74, 0.72, 0.68), tone), step(0.42, pick));
  com = mix(com, mix(vec3(0.31, 0.30, 0.31), vec3(0.42, 0.41, 0.40), tone), step(0.84, pick));

  // Works: profiled steel, mostly, in the colours it comes in.
  vec3 ind = mix(vec3(0.55, 0.56, 0.55), vec3(0.68, 0.68, 0.65), tone);
  ind = mix(ind, mix(vec3(0.36, 0.44, 0.48), vec3(0.46, 0.55, 0.58), tone), step(0.45, pick));
  ind = mix(ind, mix(vec3(0.60, 0.46, 0.32), vec3(0.70, 0.56, 0.40), tone), step(0.82, pick));

  // Offices: curtain wall, spandrel panel, and pale stone.
  vec3 off = mix(vec3(0.19, 0.24, 0.29), vec3(0.28, 0.35, 0.41), tone);
  off = mix(off, mix(vec3(0.40, 0.45, 0.50), vec3(0.54, 0.58, 0.62), tone), step(0.40, pick));
  off = mix(off, mix(vec3(0.72, 0.70, 0.66), vec3(0.84, 0.82, 0.78), tone), step(0.78, pick));

  vec3 c = res;
  c = mix(c, com, step(0.5, zone) * step(zone, 1.5));
  c = mix(c, ind, step(1.5, zone) * step(zone, 2.5));
  c = mix(c, off, step(2.5, zone));
  return c;
}

/** Felt, gravel, standing seam, or tile on a small house. */
vec3 roofColour(float zone, float seed, float grit, float small) {
  float pick = h11(seed * 7.7 + 1.0);
  vec3 felt = mix(vec3(0.115, 0.118, 0.125), vec3(0.19, 0.19, 0.195), grit);
  vec3 gravel = mix(vec3(0.30, 0.29, 0.275), vec3(0.42, 0.41, 0.385), grit);
  vec3 seam = mix(vec3(0.30, 0.33, 0.35), vec3(0.41, 0.44, 0.46), grit);
  vec3 tile = mix(vec3(0.38, 0.21, 0.16), vec3(0.52, 0.31, 0.22), grit);
  vec3 c = felt;
  c = mix(c, gravel, step(0.34, pick));
  c = mix(c, seam, step(0.70, pick));
  // Only a small house gets tiles, and only where houses are the use.
  c = mix(c, tile, step(0.55, small) * step(zone, 0.5) * step(0.30, pick));
  return c;
}`)
        .replace('#include <map_fragment>', `#include <map_fragment>
{
  gGlow = vec3(0.0);
  vec3 base = wallColour(vZone, vSeed);
  if (vFace > 1.5) {
    // Plain concrete: balcony slabs, parapets, lift overruns. No windows, a
    // little dirt, and a weathering streak down whatever faces the weather.
    float grime = h21(floor(vLocal.xy * 0.7) + vSeed) * 0.18;
    vec3 slab = mix(vec3(0.60, 0.585, 0.555), vec3(0.72, 0.705, 0.675), h11(vSeed * 6.1));
    diffuseColor.rgb *= slab * (1.0 - grime);
  } else if (vFace > 0.5) {
    // Roof: felt and gravel, with a parapet edge picked out by how close the
    // fragment is to the outside of the box.
    float edge = min(min(vLocal.x, vSize.x - vLocal.x), min(vLocal.z, vSize.z - vLocal.z));
    float grit = h21(floor(vLocal.xz * 1.6) + vSeed) * 0.6 + h21(floor(vLocal.xz * 0.34) + vSeed) * 0.4;
    float small = 1.0 - smoothstep(8.0, 22.0, vSize.y);
    vec3 roof = roofColour(vZone, vSeed, grit, small);
    // Membrane seams every 1.1 m, and the puddle stains that collect between
    // them. Two lines of shader; most of what a roof looks like from above.
    float seam = 1.0 - smoothstep(0.0, 0.09, abs(fract(vLocal.x / 1.1) - 0.5) - 0.46);
    roof *= 1.0 - seam * 0.10;
    roof *= 0.90 + 0.2 * smoothstep(0.35, 0.65, h21(floor(vLocal.xz * 0.22) + vSeed * 3.0));
    // The parapet: the wall carries on past the roof, so the outer band of the
    // roof plane is the same material as the wall, not the roof.
    roof = mix(base * 0.94, roof, smoothstep(0.4, 1.3, edge));
    diffuseColor.rgb *= roof;
    // A red obstruction light on anything tall enough to need one.
    gGlow = vec3(1.0, 0.12, 0.06) * step(60.0, vSize.y) * uNight
          * step(0.86, h21(floor(vLocal.xz * 0.5) + vSeed));
  } else {
    // A wall, in metres. Floors are 3.4 everywhere and bays 2.7 everywhere, so
    // a tower and a corner shop have the same size of window — which is the
    // thing normalised UVs get wrong and which is visible from any distance.
    float u = vLocal.x;
    float v = vLocal.y;
    float floors = 3.4;
    float bay = 2.7;
    float fi = floor(v / floors);
    float bi = floor(u / bay);
    vec2 cell = vec2(fract(u / bay), fract(v / floors));

    float ground = step(v, floors * 1.02);
    // Window aperture: wider and taller on the ground floor, where a shop is.
    vec2 pane = mix(vec2(0.30, 0.30), vec2(0.40, 0.34), ground);
    vec2 d = abs(cell - vec2(0.5, 0.52)) - pane;
    float win = 1.0 - step(0.0, max(d.x, d.y));

    // Industrial gets bands rather than a grid.
    win = mix(win, 1.0 - step(0.0, abs(cell.y - 0.55) - 0.16), step(1.5, vZone) * step(vZone, 2.5));

    vec3 glass = mix(vec3(0.13, 0.16, 0.19), vec3(0.20, 0.27, 0.33), h11(vSeed * 2.3));
    vec3 col = mix(base, glass, win * 0.92);

    // Floor line and mullion, a shade darker, one pixel wide in metres.
    float line = (1.0 - smoothstep(0.0, 0.06, abs(cell.y - 0.02)))
               + (1.0 - smoothstep(0.0, 0.08, abs(cell.x - 0.02)));
    col *= 1.0 - clamp(line, 0.0, 1.0) * 0.16;

    // Vertical shading: bases are grubbier, tops catch more sky.
    col *= 0.86 + 0.2 * smoothstep(0.0, vSize.y, v);

    // Night. Occupancy is a hash of the floor and the bay, so the same windows
    // stay on, and a slow term turns a few over so the city is not a photo.
    float lit = step(0.52, h21(vec2(bi, fi) + vSeed * 17.0));
    lit *= step(0.35, fract(h21(vec2(fi, bi) * 1.7 + vSeed) + uTime * 0.008));
    lit = max(lit, ground * 0.55);
    vec3 lamp = mix(vec3(1.0, 0.86, 0.62), vec3(0.86, 0.92, 1.0), h11(vSeed * 4.7));
    col = mix(col, col * 0.55, uNight * 0.5);
    gGlow = lamp * win * lit * uNight * 0.6;
    // A trace of the wall's own colour, so a dark building still has a shape
    // at night instead of being a hole with dots in it.
    gGlow += col * uNight * 0.075;
    diffuseColor.rgb *= col;
  }
}`)
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
totalEmissiveRadiance += gGlow;`);
    };
  }

  setNight(n: number, t: number) {
    this.uniforms.uNight.value = n;
    this.uniforms.uTime.value = t;
  }

  /**
   * Rebuild, by chunk.
   *
   * One merged mesh for the whole city is the right call at a hundred
   * buildings and the wrong one at five thousand, for two separate reasons.
   * It can never be frustum-culled — a single geometry spanning two kilometres
   * is always partly on screen, so every triangle in the city is submitted
   * every frame even when you are looking at one street. And every addition
   * rebuilds all of it, so the cost of placing one more building grows with
   * how many there already are.
   *
   * Chunked, both go away: the renderer culls whole districts behind you, and
   * adding a building rebuilds the quarter-kilometre square it stands in.
   * Chunks whose contents did not change are not touched at all, which is
   * what the signature is for.
   */
  build(items: { lot: Lot; zone: Zone; m: Massing }[]) {
    const byChunk = new Map<number, { lot: Lot; zone: Zone; m: Massing }[]>();
    for (const it of items) {
      const k = chunkKey(it.lot.x, it.lot.z);
      const list = byChunk.get(k);
      if (list) list.push(it);
      else byChunk.set(k, [it]);
    }

    // Anything that lost every building it had.
    for (const [k, c] of this.chunks) {
      if (!byChunk.has(k)) {
        this.dropChunk(c);
        this.chunks.delete(k);
      }
    }

    for (const [k, list] of byChunk) {
      let sig = list.length * 2654435761;
      for (const it of list) sig = (sig ^ (it.lot.id * 2246822519 + it.m.floors)) >>> 0;
      const had = this.chunks.get(k);
      if (had && had.sig === sig) continue;
      if (had) this.dropChunk(had);
      this.chunks.set(k, this.buildChunk(list, sig));
    }
  }

  /** Where the camera is looking, for the clutter cull. */
  setFocus(p: THREE.Vector3, distance: number) {
    this.focus.copy(p);
    this.propRange = THREE.MathUtils.clamp(distance * 1.1 + 300, 340, 1400);
    const r2 = this.propRange * this.propRange;
    for (const c of this.chunks.values()) {
      if (!c.props.length) continue;
      const b = c.mesh?.geometry.boundingSphere;
      const d = b ? (b.center.x - p.x) ** 2 + (b.center.z - p.z) ** 2 : 0;
      const on = d < r2;
      for (const m of c.props) m.visible = on;
    }
  }

  private buildChunk(items: { lot: Lot; zone: Zone; m: Massing }[], sig: number): Chunk {
    const chunk: Chunk = { mesh: null, props: [], sig };
    const pos: number[] = [];
    const nrm: number[] = [];
    const size: number[] = [];
    const local: number[] = [];
    const face: number[] = [];
    const seed: number[] = [];
    const zone: number[] = [];
    const idx: number[] = [];

    for (const { lot, zone: z, m } of items) {
      const ground = this.terrain.height(lot.x, lot.z);
      const s = (lot.id * 0.618033) % 1;
      for (const b of m.boxes) box(b, ground, s, ZONE_ID[z], { pos, nrm, size, local, face, seed, zone, idx });
    }

    if (pos.length) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      geo.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
      geo.setAttribute('aSize', new THREE.Float32BufferAttribute(size, 3));
      geo.setAttribute('aLocal', new THREE.Float32BufferAttribute(local, 3));
      geo.setAttribute('aFace', new THREE.Float32BufferAttribute(face, 1));
      geo.setAttribute('aSeed', new THREE.Float32BufferAttribute(seed, 1));
      geo.setAttribute('aZone', new THREE.Float32BufferAttribute(zone, 1));
      geo.setIndex(idx);
      geo.computeBoundingSphere();
      const mesh = new THREE.Mesh(geo, this.material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      chunk.mesh = mesh;
      this.group.add(mesh);
    }

    // The roofscape.
    //
    // Nothing sells an aerial view of this city like what is on top of the
    // buildings: a water tank on every roof, a satellite dish beside it, a
    // hoarding the size of the building it stands on. It is a handful of
    // instanced meshes per chunk and it is worth more than another ten
    // thousand triangles of massing would be.
    const byKind = new Map<number, { p: Massing['props'][number]; lot: Lot }[]>();
    for (const item of items) {
      for (const p of item.m.props) {
        const list = byKind.get(p.kind) ?? [];
        list.push({ p, lot: item.lot });
        byKind.set(p.kind, list);
      }
    }

    const o = new THREE.Object3D();
    const col = new THREE.Color();
    for (const [kind, list] of byKind) {
      if (!list.length) continue;
      const { geometry, material, colours } = propKind(kind, this.uniforms);
      const inst = new THREE.InstancedMesh(geometry, material, list.length);
      if (colours) inst.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(list.length * 3), 3);
      list.forEach(({ p, lot }, i) => {
        const y = this.terrain.height(lot.x, lot.z) + p.y;
        o.position.set(p.x, y, p.z);
        o.rotation.set(0, p.rot ?? (i * 0.7) % Math.PI, 0);
        o.scale.setScalar(p.s);
        o.updateMatrix();
        inst.setMatrixAt(i, o.matrix);
        if (colours && inst.instanceColor) {
          const c = colours[(i * 7 + kind * 3) % colours.length];
          col.set(c);
          inst.instanceColor.setXYZ(i, col.r, col.g, col.b);
        }
      });
      inst.castShadow = true;
      inst.instanceMatrix.needsUpdate = true;
      if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
      chunk.props.push(inst);
      this.group.add(inst);
    }
    return chunk;
  }

  private dropChunk(c: Chunk) {
    if (c.mesh) {
      c.mesh.geometry.dispose();
      this.group.remove(c.mesh);
    }
    for (const p of c.props) {
      p.geometry.dispose();
      (p.material as THREE.Material).dispose();
      this.group.remove(p);
    }
  }

  clear() {
    for (const c of this.chunks.values()) this.dropChunk(c);
    this.chunks.clear();
  }

  /** Chunks currently standing, for the readout. */
  get chunkCount() {
    return this.chunks.size;
  }
}

function chunkKey(x: number, z: number) {
  return ((Math.floor(x / CHUNK) + 512) << 10) | (Math.floor(z / CHUNK) + 512);
}

interface Sink {
  pos: number[]; nrm: number[]; size: number[]; local: number[];
  face: number[]; seed: number[]; zone: number[]; idx: number[];
}

/** One box, with per-face local coordinates in metres. */
function box(
  b: Box,
  ground: number, s: number, z: number, out: Sink,
) {
  // 0 wall, 1 roof, 2 plain concrete. The roof of a plain box is plain too.
  const wallFace = b.plain ? 2 : 0;
  const roofFace = b.plain ? 2 : 1;
  const c = Math.cos(b.rot);
  const sn = Math.sin(b.rot);
  const hw = b.w / 2;
  const hd = b.d / 2;
  const y0 = ground + b.y;

  // side faces: [normal, u axis, corner offsets]
  const faces: [number[], number[], number[]][] = [
    [[0, 0, 1], [1, 0, 0], [-hw, 0, hd]],
    [[0, 0, -1], [-1, 0, 0], [hw, 0, -hd]],
    [[1, 0, 0], [0, 0, -1], [hw, 0, hd]],
    [[-1, 0, 0], [0, 0, 1], [-hw, 0, -hd]],
  ];

  const put = (lx: number, ly: number, lz: number, n: number[], u: number, v: number, face: number, sx: number, sy: number, sz: number) => {
    out.pos.push(b.x + lx * c - lz * sn, y0 + ly, b.z + lx * sn + lz * c);
    out.nrm.push(n[0] * c - n[2] * sn, n[1], n[0] * sn + n[2] * c);
    out.local.push(u, v, face === 1 ? v : 0);
    out.size.push(sx, sy, sz);
    out.face.push(face);
    out.seed.push(s);
    out.zone.push(z);
  };

  for (const [n, ua, corner] of faces) {
    const len = Math.abs(ua[0]) ? b.w : b.d;
    const base = out.pos.length / 3;
    for (let i = 0; i < 4; i++) {
      const along = i === 1 || i === 2 ? len : 0;
      const up = i >= 2 ? b.h : 0;
      put(corner[0] + ua[0] * along, up, corner[2] + ua[2] * along, n, along, up, wallFace, len, b.h, 0);
    }
    out.idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }

  // roof
  const base = out.pos.length / 3;
  const rc: [number, number][] = [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]];
  rc.forEach(([lx, lz]) => put(lx, b.h, lz, [0, 1, 0], lx + hw, lz + hd, roofFace, b.w, b.h, b.d));
  out.idx.push(base, base + 2, base + 1, base, base + 3, base + 2);
}

/**
 * One geometry and one material per kind of thing on a roof.
 *
 * Six draw calls for the entire roofscape of the entire city, and each of them
 * is a shape you would recognise on its own: a tank is a tank because it stands
 * on legs, a dish is a dish because it is a section of a sphere on an arm.
 */
function propKind(kind: number, uniforms: { uNight: { value: number } }) {
  const merge = (list: [THREE.BufferGeometry, number][]) => {
    const pos: number[] = [];
    const nrm: number[] = [];
    const idx: number[] = [];
    for (const [g] of list) {
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
  };

  switch (kind) {
    case 3: {
      // Water tank: a tapered drum on four short legs, which is the shape and
      // the reason you can tell one from an air-conditioning unit at 400 m.
      const drum = new THREE.CylinderGeometry(0.72, 0.62, 1.15, 12);
      drum.translate(0, 1.0, 0);
      const lid = new THREE.CylinderGeometry(0.30, 0.34, 0.14, 10);
      lid.translate(0.18, 1.62, 0);
      const legs: [THREE.BufferGeometry, number][] = [[drum, 0], [lid, 0]];
      for (const [lx, lz] of [[0.5, 0.5], [-0.5, 0.5], [0.5, -0.5], [-0.5, -0.5]]) {
        const leg = new THREE.BoxGeometry(0.09, 0.46, 0.09);
        leg.translate(lx, 0.23, lz);
        legs.push([leg, 0]);
      }
      return {
        geometry: merge(legs),
        material: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.72 }),
        colours: ['#14181a', '#1b2a34', '#123024', '#2a2622', '#0f1c2a'],
      };
    }
    case 4: {
      // Hoarding: a panel on a frame, and at night it is the brightest thing
      // for a block in every direction.
      const panel = new THREE.BoxGeometry(2.0, 1.15, 0.09);
      panel.translate(0, 2.2, 0);
      const parts: [THREE.BufferGeometry, number][] = [[panel, 0]];
      for (const lx of [-0.72, 0.72]) {
        const leg = new THREE.BoxGeometry(0.11, 1.7, 0.11);
        leg.translate(lx, 0.85, 0);
        parts.push([leg, 0]);
      }
      const brace = new THREE.BoxGeometry(1.7, 0.09, 0.09);
      brace.translate(0, 1.5, 0);
      parts.push([brace, 0]);
      const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 });
      mat.onBeforeCompile = (sh) => {
        sh.uniforms.uNight = uniforms.uNight;
        sh.vertexShader = sh.vertexShader
          .replace('#include <common>', '#include <common>\nvarying vec3 vLocalPos;')
          .replace('#include <begin_vertex>', '#include <begin_vertex>\nvLocalPos = position;');
        sh.fragmentShader = sh.fragmentShader
          .replace('#include <common>', '#include <common>\nuniform float uNight;\nvarying vec3 vLocalPos;')
          .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
// The panel is lit and the frame is not, which is the difference between a
// hoarding at night and a glowing lollipop.
totalEmissiveRadiance += diffuseColor.rgb * uNight * 2.1 * step(1.62, vLocalPos.y);`);
      };
      return {
        geometry: merge(parts),
        material: mat,
        colours: ['#d8452f', '#1f6fd0', '#e8a020', '#159457', '#c22f6e', '#f0e6d2'],
      };
    }
    case 5: {
      const dish = new THREE.SphereGeometry(0.52, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.42);
      dish.rotateX(2.3);
      dish.translate(0, 0.9, 0);
      const arm = new THREE.BoxGeometry(0.07, 0.9, 0.07);
      arm.translate(0, 0.45, 0);
      return {
        geometry: merge([[dish, 0], [arm, 0]]),
        material: new THREE.MeshStandardMaterial({ color: 0xd7d3c8, roughness: 0.66, side: THREE.DoubleSide }),
        colours: null,
      };
    }
    case 1: {
      const mast = new THREE.CylinderGeometry(0.06, 0.16, 5.4, 6);
      mast.translate(0, 2.7, 0);
      const light = new THREE.SphereGeometry(0.14, 8, 6);
      light.translate(0, 5.5, 0);
      return {
        geometry: merge([[mast, 0], [light, 0]]),
        material: new THREE.MeshStandardMaterial({ color: 0x8c8f92, roughness: 0.5, metalness: 0.6 }),
        colours: null,
      };
    }
    case 2: {
      const light = new THREE.BoxGeometry(3.4, 0.5, 1.2);
      light.translate(0, 0.25, 0);
      return {
        geometry: merge([[light, 0]]),
        material: new THREE.MeshStandardMaterial({ color: 0xb9c6cc, roughness: 0.4 }),
        colours: null,
      };
    }
    default: {
      const plant = new THREE.BoxGeometry(1.5, 0.95, 1.5);
      plant.translate(0, 0.48, 0);
      const vent = new THREE.CylinderGeometry(0.4, 0.4, 0.24, 10);
      vent.translate(0, 1.05, 0);
      return {
        geometry: merge([[plant, 0], [vent, 0]]),
        material: new THREE.MeshStandardMaterial({ color: 0x9a9a97, roughness: 0.86 }),
        colours: null,
      };
    }
  }
}
