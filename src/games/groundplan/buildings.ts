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

export interface Massing {
  /** Boxes, in world space, already rotated to the lot's facing. */
  boxes: { x: number; y: number; z: number; w: number; h: number; d: number; rot: number }[];
  floors: number;
  height: number;
  props: { x: number; y: number; z: number; s: number; kind: number }[];
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
  else if (zone === 'res') floors = Math.max(1, Math.round(1 + pressure * pressure * 16 + r() * 2));
  else if (zone === 'com') floors = Math.max(1, Math.round(2 + pressure * 9 + r() * 2));
  else floors = Math.max(2, Math.round(3 + pressure * pressure * 40 + r() * 4));

  const rot = lot.facing;
  const push = (dy: number, sw: number, sd: number, h: number) => {
    boxes.push({ x: lot.x, y: dy, z: lot.z, w: sw, d: sd, h, rot });
  };

  if (zone === 'ind') {
    const h = floors * 5.2;
    push(0, w * 1.02, d * 0.95, h);
    // A row of roof lights along the shed, which is what an industrial roof is.
    for (let i = 0; i < 4; i++) props.push({ x: lot.x, y: h, z: lot.z, s: 1, kind: 2 });
  } else if (floors <= 4) {
    const h = floors * FLOOR;
    push(0, w, d, h);
    if (r() < 0.55) push(h, w * 0.62, d * 0.6, FLOOR * (r() < 0.5 ? 1 : 2));
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
      y += h;
      left -= take;
      sw *= 0.74 + r() * 0.12;
      sd *= 0.74 + r() * 0.12;
    }
    // A crown: plant, mast, or a small penthouse.
    if (floors > 14) {
      push(y, sw * 0.5, sd * 0.5, FLOOR * 1.6);
      props.push({ x: lot.x, y: y + FLOOR * 1.6, z: lot.z, s: floors > 30 ? 2.4 : 1.5, kind: 1 });
    }
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
  return { boxes, floors, height, props };
}

// --------------------------------------------------------------------- mesh

const ZONE_ID: Record<Zone, number> = { res: 0, com: 1, ind: 2, off: 3, park: 4 };

export class Buildings {
  readonly group = new THREE.Group();
  readonly material: THREE.MeshStandardMaterial;
  private mesh: THREE.Mesh | null = null;
  private props: THREE.InstancedMesh | null = null;
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
  if (vFace > 0.5) {
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

  /** Rebuild the whole set. Cheap enough that partial updates are not worth it. */
  build(items: { lot: Lot; zone: Zone; m: Massing }[]) {
    this.clear();
    if (!items.length) return;

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

    this.mesh = new THREE.Mesh(geo, this.material);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.group.add(this.mesh);

    // Rooftop plant, as one instanced box. Nothing sells an aerial view of a
    // city like the clutter on the roofs, and nothing is cheaper.
    const all = items.flatMap((i) => i.m.props.map((p) => ({ p, lot: i.lot })));
    if (all.length) {
      const g = new THREE.BoxGeometry(1, 1, 1);
      const mat = new THREE.MeshStandardMaterial({ color: 0x9a9a97, roughness: 0.86 });
      const inst = new THREE.InstancedMesh(g, mat, all.length);
      const o = new THREE.Object3D();
      all.forEach(({ p, lot }, i) => {
        const y = this.terrain.height(lot.x, lot.z) + p.y;
        o.position.set(p.x, y + p.s * 0.5, p.z);
        o.scale.set(p.s * (p.kind === 1 ? 0.3 : 1.6), p.s * (p.kind === 1 ? 5 : 1), p.s * (p.kind === 1 ? 0.3 : 1.6));
        o.rotation.y = (i * 0.7) % Math.PI;
        o.updateMatrix();
        inst.setMatrixAt(i, o.matrix);
      });
      inst.castShadow = true;
      inst.instanceMatrix.needsUpdate = true;
      this.props = inst;
      this.group.add(inst);
    }
  }

  clear() {
    if (this.mesh) {
      this.mesh.geometry.dispose();
      this.group.remove(this.mesh);
      this.mesh = null;
    }
    if (this.props) {
      this.props.geometry.dispose();
      (this.props.material as THREE.Material).dispose();
      this.group.remove(this.props);
      this.props = null;
    }
  }
}

interface Sink {
  pos: number[]; nrm: number[]; size: number[]; local: number[];
  face: number[]; seed: number[]; zone: number[]; idx: number[];
}

/** One box, with per-face local coordinates in metres. */
function box(
  b: { x: number; y: number; z: number; w: number; h: number; d: number; rot: number },
  ground: number, s: number, z: number, out: Sink,
) {
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

  const put = (lx: number, ly: number, lz: number, n: number[], u: number, v: number, isRoof: number, sx: number, sy: number, sz: number) => {
    out.pos.push(b.x + lx * c - lz * sn, y0 + ly, b.z + lx * sn + lz * c);
    out.nrm.push(n[0] * c - n[2] * sn, n[1], n[0] * sn + n[2] * c);
    out.local.push(u, v, isRoof ? v : 0);
    out.size.push(sx, sy, sz);
    out.face.push(isRoof);
    out.seed.push(s);
    out.zone.push(z);
  };

  for (const [n, ua, corner] of faces) {
    const len = Math.abs(ua[0]) ? b.w : b.d;
    const base = out.pos.length / 3;
    for (let i = 0; i < 4; i++) {
      const along = i === 1 || i === 2 ? len : 0;
      const up = i >= 2 ? b.h : 0;
      put(corner[0] + ua[0] * along, up, corner[2] + ua[2] * along, n, along, up, 0, len, b.h, 0);
    }
    out.idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }

  // roof
  const base = out.pos.length / 3;
  const rc: [number, number][] = [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]];
  rc.forEach(([lx, lz]) => put(lx, b.h, lz, [0, 1, 0], lx + hw, lz + hd, 1, b.w, b.h, b.d));
  out.idx.push(base, base + 2, base + 1, base, base + 3, base + 2);
}
