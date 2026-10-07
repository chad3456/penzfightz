/**
 * The art kit. Everything in Jellynoor is modelled here out of four rounded
 * primitives, painted per vertex so a whole cottage or cow is a single mesh
 * with a single wobble, and built with its feet at y = 0 so it can be dropped
 * straight onto the hillside.
 *
 * Nothing is sharp. A jelly world has no hard edges, so even the tin roofs
 * and the weighing scale are swollen a little, as though they had been turned
 * out of a mould an hour ago and had not quite finished settling.
 */
import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { JELLY } from './jelly';

/* ───────── primitives ───────── */

/** A box with every edge rounded: the workhorse of the whole village. */
export function roundBox(w: number, h: number, d: number, r = 0.12, seg = 3): THREE.BufferGeometry {
  const rr = Math.min(r, w / 2 - 1e-3, h / 2 - 1e-3, d / 2 - 1e-3);
  const g = new THREE.BoxGeometry(w, h, d, seg, seg, seg);
  const p = g.attributes.position as THREE.BufferAttribute;
  const a = w / 2 - rr, b = h / 2 - rr, c = d / 2 - rr;
  const v = new THREE.Vector3(), core = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    core.set(THREE.MathUtils.clamp(v.x, -a, a), THREE.MathUtils.clamp(v.y, -b, b), THREE.MathUtils.clamp(v.z, -c, c));
    const dir = v.clone().sub(core);
    if (dir.lengthSq() < 1e-9) continue;
    dir.normalize().multiplyScalar(rr).add(core);
    p.setXYZ(i, dir.x, dir.y, dir.z);
  }
  // the six faces arrive as separate vertices; weld them or every rounded
  // edge shows a crease where the faces meet
  const welded = mergeVertices(g, 1e-4);
  welded.computeVertexNormals();
  g.dispose();
  return welded;
}

/** A lumpy ball. The lump keeps it from looking like computer graphics. */
export function blob(rx: number, ry = rx, rz = rx, detail = 2, lump = 0): THREE.BufferGeometry {
  const seg = [[6, 4], [8, 6], [14, 10], [20, 14]][Math.min(3, Math.max(0, detail))];
  const g = new THREE.SphereGeometry(1, seg[0], seg[1]);
  const p = g.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    let k = 1;
    if (lump) k += (Math.sin(v.x * 4.1 + 1.3) * Math.sin(v.y * 3.7) * Math.sin(v.z * 4.6 + 0.6)) * lump;
    p.setXYZ(i, v.x * rx * k, v.y * ry * k, v.z * rz * k);
  }
  g.computeVertexNormals();
  return g;
}

/** A sausage along y, rounded at both ends. */
export function capsule(r: number, len: number, seg = 10): THREE.BufferGeometry {
  const g = new THREE.CapsuleGeometry(r, Math.max(0.001, len), 3, seg);
  return g;
}

/** A cylinder, optionally with its rim softened. */
export function cyl(rTop: number, rBot: number, h: number, seg = 14, soft = 0): THREE.BufferGeometry {
  if (!soft) return new THREE.CylinderGeometry(rTop, rBot, h, seg);
  const parts = [
    new THREE.CylinderGeometry(rTop, rBot, h - soft * 2, seg),
    blob(rTop, soft, rTop, 2).translate(0, h / 2 - soft, 0),
    blob(rBot, soft, rBot, 2).translate(0, -h / 2 + soft, 0),
  ].map((g) => (g.index ? g.toNonIndexed() : g));
  return mergeGeometries(parts)!;
}

export function cone(r: number, h: number, seg = 14): THREE.BufferGeometry {
  return new THREE.ConeGeometry(r, h, seg);
}

/** A flat disc lying in the xz plane. */
export function disc(r: number, seg = 18): THREE.BufferGeometry {
  return new THREE.CircleGeometry(r, seg).rotateX(-Math.PI / 2);
}

/* ───────── painting and assembly ───────── */

export interface Place {
  pos?: [number, number, number];
  rot?: [number, number, number];
  scale?: number | [number, number, number];
  /** 0 is lit by the sun only; 1 glows on its own, for windows and lamps. */
  emit?: number;
}

const C = new THREE.Color();

/** Collects painted parts and welds them into one mesh. */
export class Kit {
  private parts: THREE.BufferGeometry[] = [];

  add(geo: THREE.BufferGeometry, colour: string, p: Place = {}): this {
    const g = geo.index ? geo.toNonIndexed() : geo.clone();
    if (p.scale !== undefined) {
      const s = typeof p.scale === 'number' ? [p.scale, p.scale, p.scale] : p.scale;
      g.scale(s[0], s[1], s[2]);
    }
    if (p.rot) { g.rotateX(p.rot[0]); g.rotateY(p.rot[1]); g.rotateZ(p.rot[2]); }
    if (p.pos) g.translate(p.pos[0], p.pos[1], p.pos[2]);
    const n = g.attributes.position.count;
    const col = new Float32Array(n * 3);
    const emit = new Float32Array(n);
    C.set(colour).convertSRGBToLinear();
    for (let i = 0; i < n; i++) { col[i * 3] = C.r; col[i * 3 + 1] = C.g; col[i * 3 + 2] = C.b; emit[i] = p.emit ?? 0; }
    g.setAttribute('aCol', new THREE.BufferAttribute(col, 3));
    g.setAttribute('aEmit', new THREE.BufferAttribute(emit, 1));
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'aCol', 'aEmit'].includes(k)) g.deleteAttribute(k);
    this.parts.push(g);
    return this;
  }

  /** Same shape, mirrored across x: for the second arm, the second leg, the pair of windows. */
  pair(geo: THREE.BufferGeometry, colour: string, p: Place & { pos: [number, number, number] }): this {
    this.add(geo, colour, p);
    return this.add(geo, colour, { ...p, pos: [-p.pos[0], p.pos[1], p.pos[2]] });
  }

  build(): THREE.BufferGeometry {
    const g = mergeGeometries(this.parts)!;
    g.computeBoundingBox();
    this.parts = [];
    return g;
  }
}

export const kit = () => new Kit();

/** Give a plain geometry the colour attributes the jelly shader wants. */
export function paint(geo: THREE.BufferGeometry, colour: string, emit = 0): THREE.BufferGeometry {
  return kit().add(geo, colour, { emit }).build();
}

const rnd = (seed: { s: number }) => { seed.s = (seed.s * 16807) % 2147483647; return (seed.s - 1) / 2147483646; };

/* ───────── the tea ───────── */

/**
 * A tea bush: a low cushion of leaf, flat on top the way a plucking table is
 * kept. One geometry for every bush in the garden; age rides on the instance
 * scale and health on the instance tint.
 */
export function teaBush(): THREE.BufferGeometry {
  const k = kit();
  // A whole garden of these is on screen at once, so a bush is five pieces: a
  // domed cushion for the plucking table, a darker skirt where the frame is in
  // shade, and three lumps of newer leaf standing proud on top.
  k.add(blob(0.5, 0.26, 0.48, 0, 0.3), JELLY.leafDeep, { pos: [0, 0.2, 0] });
  k.add(blob(0.48, 0.4, 0.46, 1, 0.26), JELLY.leaf, { pos: [0, 0.38, 0] });
  k.add(blob(0.26, 0.2, 0.24, 0, 0.35), JELLY.leaf, { pos: [-0.17, 0.56, 0.12] });
  k.add(blob(0.24, 0.19, 0.22, 0, 0.35), JELLY.leafNew, { pos: [0.18, 0.58, -0.1] });
  k.add(blob(0.2, 0.17, 0.2, 0, 0.35), JELLY.leafNew, { pos: [0.02, 0.6, 0.2] });
  return k.build();
}

export function budTuft(): THREE.BufferGeometry {
  const k = kit();
  const s = { s: 97 };
  for (let i = 0; i < 4; i++) {
    const a = rnd(s) * Math.PI * 2, r = rnd(s) * 0.32;
    const x = Math.cos(a) * r, z = Math.sin(a) * r, y = 0.6 + rnd(s) * 0.06;
    k.add(blob(0.05, 0.022, 0.032, 0), JELLY.leafNew, { pos: [x + 0.04, y + 0.05, z], rot: [0, rnd(s) * 3, 0.35] });
    k.add(blob(0.024, 0.055, 0.024, 0), JELLY.lemon, { pos: [x, y + 0.09, z] });
  }
  return k.build();
}

/** A sapling in its nursery bag, for carrying out to an empty plot. */
export function sapling(): THREE.BufferGeometry {
  const k = kit();
  k.add(cyl(0.11, 0.09, 0.16, 10), JELLY.coal, { pos: [0, 0.08, 0] });
  k.add(capsule(0.02, 0.22, 6), JELLY.woodDark, { pos: [0, 0.28, 0] });
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    k.add(blob(0.07, 0.025, 0.045, 1), JELLY.sapling, { pos: [Math.cos(a) * 0.06, 0.3 + i * 0.022, Math.sin(a) * 0.06], rot: [0, -a, 0.4] });
  }
  k.add(blob(0.03, 0.06, 0.03, 1), JELLY.leafNew, { pos: [0, 0.42, 0] });
  return k.build();
}

export function weedTuft(): THREE.BufferGeometry {
  const k = kit();
  const s = { s: 53 };
  for (let i = 0; i < 4; i++) {
    const a = rnd(s) * 6.283, l = 0.14 + rnd(s) * 0.12;
    k.add(capsule(0.012, l, 4), i % 3 === 0 ? JELLY.mango : JELLY.grassDry,
      { pos: [Math.cos(a) * 0.05, l / 2 + 0.02, Math.sin(a) * 0.05], rot: [Math.sin(a) * 0.5, 0, Math.cos(a) * 0.5] });
  }
  return k.build();
}

/* ───────── the trees of a hill station ───────── */

/** The planted conifers that line every tea estate road. */
export function pine(h = 6): THREE.BufferGeometry {
  const k = kit();
  k.add(cyl(0.08, 0.14, h * 0.4, 7), '#7e6a55', { pos: [0, h * 0.2, 0] });
  const tiers = 4;
  for (let i = 0; i < tiers; i++) {
    const t = i / (tiers - 1);
    const r = (1 - t) * h * 0.21 + 0.18;
    const y = h * 0.28 + t * h * 0.66;
    k.add(blob(r, r * 0.72, r, 1, 0.3), i % 2 ? JELLY.leafDeep : JELLY.leaf, { pos: [0, y, 0] });
  }
  k.add(blob(0.16, 0.3, 0.16, 2, 0.2), JELLY.leafDeep, { pos: [0, h * 1.0, 0] });
  return k.build();
}

/** The broad, mossy evergreens of a shola: round canopies on a leaning trunk. */
export function sholaTree(h = 5): THREE.BufferGeometry {
  const k = kit();
  const s = { s: 7 };
  k.add(cyl(0.1, 0.2, h * 0.55, 8, 0.05), '#8a7260', { pos: [0, h * 0.27, 0], rot: [0, 0, 0.06] });
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * 6.283;
    k.add(cyl(0.045, 0.085, h * 0.3, 5), '#8a7260', { pos: [Math.cos(a) * 0.2, h * 0.6, Math.sin(a) * 0.2], rot: [Math.cos(a) * 0.5, 0, -Math.sin(a) * 0.5] });
  }
  for (let i = 0; i < 6; i++) {
    const a = rnd(s) * 6.283, r = rnd(s) * 0.7;
    const br = 0.55 + rnd(s) * 0.4;
    k.add(blob(br, br * 0.8, br, 1, 0.3), i % 2 ? JELLY.leaf : '#3fa05a',
      { pos: [Math.cos(a) * r, h * 0.78 + rnd(s) * 0.5, Math.sin(a) * r] });
  }
  return k.build();
}

/** Silver oak, the shade tree the tea is grown under. */
export function shadeTree(h = 7): THREE.BufferGeometry {
  const k = kit();
  k.add(cyl(0.11, 0.2, h * 0.62, 7, 0.04), '#9c8a78', { pos: [0, h * 0.31, 0] });
  const s = { s: 29 };
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * 6.283 + 0.4;
    k.add(cyl(0.05, 0.09, h * 0.26, 5), '#9c8a78', { pos: [Math.cos(a) * 0.26, h * 0.68, Math.sin(a) * 0.26], rot: [Math.cos(a) * 0.6, 0, -Math.sin(a) * 0.6] });
  }
  for (let i = 0; i < 5; i++) {
    const a = rnd(s) * 6.283, r = 0.3 + rnd(s) * 0.6;
    k.add(blob(0.66, 0.46, 0.66, 1, 0.3), i % 2 ? JELLY.mint : JELLY.leaf, { pos: [Math.cos(a) * r, h * 0.8 + rnd(s) * 0.5, Math.sin(a) * r] });
  }
  return k.build();
}

export function rock(r = 0.6): THREE.BufferGeometry {
  return paint(blob(r, r * 0.68, r * 0.85, 2, 0.35).translate(0, r * 0.5, 0), JELLY.rock);
}

export function flower(colour: string): THREE.BufferGeometry {
  const k = kit();
  k.add(cyl(0.012, 0.014, 0.17, 4), JELLY.leaf, { pos: [0, 0.09, 0] });
  k.add(blob(0.085, 0.03, 0.085, 0, 0.4), colour, { pos: [0, 0.19, 0] });
  k.add(blob(0.028, 0.025, 0.028, 0), JELLY.lemon, { pos: [0, 0.21, 0] });
  return k.build();
}

/* ───────── the village ───────── */

/** A hill cottage: plastered walls, a corrugated roof, a door and two lit windows. */
export function cottage(w = 4, d = 3.4, wall: string = JELLY.cream, roof: string = JELLY.tin): THREE.BufferGeometry {
  const k = kit();
  const h = 2.3, rise = 0.85, over = 0.26;
  k.add(roundBox(w + 0.34, 0.26, d + 0.34, 0.1, 2), JELLY.rock, { pos: [0, 0.12, 0] });
  k.add(roundBox(w, h, d, 0.16, 3), wall, { pos: [0, h / 2 + 0.2, 0] });
  const half = d / 2 + over;

  // The ridge runs along x, so the triangular gable walls close the two ends
  // at x = +/- w/2. A stack of narrowing slabs stands in for the triangle,
  // and the roof overhangs far enough to hide the steps.
  for (const sgn of [1, -1]) {
    const steps = 7;
    for (let i = 0; i < steps; i++) {
      const t = i / steps, t2 = (i + 1) / steps;
      // the slab's top sits at t2 of the rise, so its depth has to stay inside
      // where the roof plane is at that height, or the steps show through
      const depth = 2 * half * Math.max(0.04, 1 - t2 - 0.16);
      k.add(roundBox(0.22, rise / steps + 0.04, depth, 0.05, 1), wall,
        { pos: [sgn * (w / 2 - 0.14), h + 0.18 + (t + t2) / 2 * rise, 0] });
    }
  }

  // two leaves of corrugated tin, with ribs and a capping along the ridge
  const rl = Math.hypot(half, rise);
  const pitch = Math.atan2(rise, half);
  for (const sgn of [1, -1]) {
    const cz = sgn * half / 2, cy = h + 0.2 + rise / 2;
    k.add(roundBox(w + over * 2, 0.11, rl, 0.05, 2), roof, { pos: [0, cy, cz], rot: [sgn * pitch, 0, 0] });
    for (let i = -4; i <= 4; i++)
      k.add(roundBox(0.055, 0.055, rl, 0.02, 1), roof, { pos: [i * ((w + over * 2) / 9.5), cy + 0.06, cz], rot: [sgn * pitch, 0, 0] });
  }
  k.add(roundBox(w + over * 2 + 0.06, 0.11, 0.16, 0.05, 2), roof, { pos: [0, h + rise + 0.26, 0] });

  // the front: a door with a brass knob, two shuttered windows, a step
  k.add(roundBox(0.82, 1.42, 0.14, 0.06, 2), JELLY.woodDark, { pos: [0, 0.92, d / 2 + 0.01] });
  k.add(roundBox(0.9, 0.1, 0.18, 0.04, 1), roof, { pos: [0, 1.68, d / 2 + 0.04] });
  k.add(blob(0.05, 0.05, 0.05, 1), JELLY.mango, { pos: [0.3, 0.95, d / 2 + 0.08] });
  k.pair(roundBox(0.74, 0.7, 0.08, 0.04, 2), JELLY.white, { pos: [w / 2 - 0.82, 1.62, d / 2 - 0.02] });
  k.pair(roundBox(0.6, 0.56, 0.14, 0.05, 2), JELLY.sky, { pos: [w / 2 - 0.82, 1.62, d / 2 + 0.01], emit: 0.9 });
  k.pair(roundBox(0.1, 0.62, 0.06, 0.02, 1), JELLY.leaf, { pos: [w / 2 - 0.44, 1.62, d / 2 + 0.06] });
  k.add(roundBox(1.3, 0.2, 0.56, 0.08, 2), JELLY.rock, { pos: [0, 0.1, d / 2 + 0.38] });
  k.add(cyl(0.17, 0.21, 0.66, 8, 0.05), JELLY.brick, { pos: [w / 2 - 0.7, h + rise + 0.3, -0.5] });
  k.add(cyl(0.21, 0.19, 0.08, 8), JELLY.coal, { pos: [w / 2 - 0.7, h + rise + 0.66, -0.5] });
  return k.build();
}

/** The chai stall: a counter, a canopy, a kettle and a row of glasses. */
export function chaiStall(): THREE.BufferGeometry {
  const k = kit();
  k.add(roundBox(2.6, 1.0, 1.0, 0.1, 2), JELLY.tinRust, { pos: [0, 0.5, 0] });
  k.add(roundBox(2.9, 0.14, 1.2, 0.07, 2), JELLY.wood, { pos: [0, 1.06, 0] });
  for (const x of [-1.25, 1.25]) for (const z of [-0.45, 0.45])
    k.add(cyl(0.05, 0.05, 2.1, 6), JELLY.woodDark, { pos: [x, 1.05, z] });
  k.add(roundBox(3.3, 0.1, 1.7, 0.05, 2), JELLY.marigold, { pos: [0, 2.14, 0], rot: [0.08, 0, 0] });
  for (let i = -4; i <= 4; i++) k.add(blob(0.08, 0.1, 0.03, 1), i % 2 ? JELLY.berry : JELLY.lemon, { pos: [i * 0.36, 2.0, 0.86] });
  // the stove, the pot of boiling chai, the glasses
  k.add(cyl(0.26, 0.3, 0.3, 10, 0.05), JELLY.coal, { pos: [-0.8, 1.26, 0] });
  k.add(cyl(0.3, 0.26, 0.3, 12, 0.06), JELLY.rock, { pos: [-0.8, 1.55, 0] });
  k.add(blob(0.27, 0.05, 0.27, 2), JELLY.chai, { pos: [-0.8, 1.67, 0] });
  k.add(cyl(0.2, 0.22, 0.26, 10, 0.05), JELLY.tin, { pos: [0.2, 1.26, 0] });
  k.add(capsule(0.03, 0.2, 5), JELLY.tin, { pos: [0.42, 1.3, 0], rot: [0, 0, -1.1] });
  for (let i = 0; i < 5; i++) k.add(cyl(0.05, 0.04, 0.13, 8), JELLY.white, { pos: [0.75 + (i % 3) * 0.16, 1.2, -0.2 + Math.floor(i / 3) * 0.26] });
  k.add(roundBox(1.0, 0.4, 0.06, 0.05, 2), JELLY.white, { pos: [0.9, 1.75, -0.45] });
  return k.build();
}

/**
 * An open-sided shed on posts. The withering loft, the rolling room and the
 * cow shed are all the same bones in different sizes.
 */
export function shed(w = 6, d = 4, h = 2.4, roof: string = JELLY.tin, back = true): THREE.BufferGeometry {
  const k = kit();
  for (const x of [-w / 2 + 0.2, w / 2 - 0.2]) for (const z of [-d / 2 + 0.2, d / 2 - 0.2])
    k.add(cyl(0.1, 0.12, h, 7), JELLY.woodDark, { pos: [x, h / 2, z] });
  k.add(cyl(0.1, 0.12, h, 7), JELLY.woodDark, { pos: [0, h / 2, -d / 2 + 0.2] });
  if (back) k.add(roundBox(w, h * 0.92, 0.18, 0.08, 2), JELLY.wood, { pos: [0, h * 0.46, -d / 2 + 0.1] });
  const tilt = 0.17;
  k.add(roundBox(w + 0.7, 0.14, d + 0.8, 0.07, 2), roof, { pos: [0, h + 0.3, 0.1], rot: [tilt, 0, 0] });
  for (let i = -4; i <= 4; i++) k.add(roundBox(0.06, 0.06, d + 0.8, 0.02, 1), roof, { pos: [i * (w / 9), h + 0.37, 0.1], rot: [tilt, 0, 0] });
  k.add(roundBox(w, 0.16, d, 0.07, 2), JELLY.rock, { pos: [0, 0.08, 0] });
  return k.build();
}

/** The long wire-mesh troughs the plucked leaf is spread on to wilt overnight. */
export function witherTrough(): THREE.BufferGeometry {
  const k = kit();
  k.add(roundBox(3.2, 0.1, 1.1, 0.05, 2), JELLY.wood, { pos: [0, 0.74, 0] });
  for (const x of [-1.4, 1.4]) for (const z of [-0.45, 0.45]) k.add(cyl(0.05, 0.06, 0.74, 6), JELLY.woodDark, { pos: [x, 0.37, z] });
  for (const z of [-0.55, 0.55]) k.add(roundBox(3.3, 0.22, 0.07, 0.03, 2), JELLY.wood, { pos: [0, 0.9, z] });
  for (const x of [-1.6, 1.6]) k.add(roundBox(0.07, 0.22, 1.1, 0.03, 2), JELLY.wood, { pos: [x, 0.9, 0] });
  return k.build();
}

/** The leaf heaped in a trough, shown once something has been spread on it. */
export function leafHeap(): THREE.BufferGeometry {
  const k = kit();
  const s = { s: 41 };
  for (let i = 0; i < 16; i++) {
    const x = (rnd(s) - 0.5) * 2.9, z = (rnd(s) - 0.5) * 0.85;
    k.add(blob(0.17, 0.06, 0.14, 1, 0.3), i % 3 ? JELLY.leaf : JELLY.leafNew, { pos: [x, 0.83 + rnd(s) * 0.04, z] });
  }
  return k.build();
}

/** The rolling table: a slatted top and a crank that bruises the leaf. */
export function rollTable(): THREE.BufferGeometry {
  const k = kit();
  k.add(cyl(1.0, 1.0, 0.18, 20, 0.05), JELLY.tin, { pos: [0, 0.88, 0] });
  for (let i = 0; i < 6; i++) k.add(roundBox(0.12, 0.08, 1.7, 0.03, 1), JELLY.rock, { pos: [0, 0.98, 0], rot: [0, (i / 6) * Math.PI, 0] });
  for (let i = 0; i < 4; i++) { const a = (i / 4) * 6.283 + 0.7; k.add(cyl(0.07, 0.08, 0.88, 6), JELLY.woodDark, { pos: [Math.cos(a) * 0.7, 0.44, Math.sin(a) * 0.7] }); }
  k.add(cyl(0.09, 0.09, 0.5, 8), JELLY.coal, { pos: [0, 1.25, 0] });
  k.add(roundBox(0.6, 0.08, 0.08, 0.03, 1), JELLY.coal, { pos: [0.3, 1.48, 0] });
  k.add(capsule(0.06, 0.16, 6), JELLY.berry, { pos: [0.58, 1.42, 0] });
  return k.build();
}

/** The weighing scale at the muster shed, where the day's basket is settled. */
export function weighScale(): THREE.BufferGeometry {
  const k = kit();
  k.add(roundBox(1.1, 0.2, 1.1, 0.08, 2), JELLY.woodDark, { pos: [0, 0.1, 0] });
  k.add(cyl(0.08, 0.1, 1.9, 8), JELLY.rock, { pos: [0, 1.05, 0] });
  k.add(roundBox(1.7, 0.08, 0.08, 0.03, 1), JELLY.rock, { pos: [0, 1.98, 0] });
  k.add(cyl(0.44, 0.4, 0.1, 16, 0.03), JELLY.tin, { pos: [-0.72, 1.5, 0] });
  for (let i = 0; i < 3; i++) { const a = (i / 3) * 6.283; k.add(capsule(0.012, 0.44, 4), JELLY.rock, { pos: [-0.72 + Math.cos(a) * 0.3, 1.74, Math.sin(a) * 0.3], rot: [Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5] }); }
  k.add(cyl(0.2, 0.22, 0.3, 12, 0.05), JELLY.coal, { pos: [0.72, 1.76, 0] });
  k.add(roundBox(0.5, 0.62, 0.12, 0.05, 2), JELLY.white, { pos: [0, 1.3, 0.12], emit: 0.12 });
  return k.build();
}

/** The water tank on its legs, with a tap under it. */
export function waterTank(): THREE.BufferGeometry {
  const k = kit();
  k.add(cyl(0.95, 0.95, 1.5, 18, 0.1), JELLY.tin, { pos: [0, 1.7, 0] });
  k.add(cyl(1.0, 1.0, 0.12, 18, 0.04), JELLY.tinRust, { pos: [0, 2.5, 0] });
  for (let i = 0; i < 4; i++) { const a = (i / 4) * 6.283 + 0.78; k.add(cyl(0.07, 0.08, 1.0, 6), JELLY.rock, { pos: [Math.cos(a) * 0.72, 0.5, Math.sin(a) * 0.72], rot: [Math.cos(a) * 0.08, 0, -Math.sin(a) * 0.08] }); }
  k.add(capsule(0.05, 0.3, 6), JELLY.mango, { pos: [0, 0.75, 0.9], rot: [0.5, 0, 0] });
  k.add(blob(0.09, 0.09, 0.09, 1), JELLY.berry, { pos: [0, 0.92, 0.82] });
  return k.build();
}

/** A hill shrine, scarcely bigger than a cupboard, with a bell to ring at dawn. */
export function shrine(): THREE.BufferGeometry {
  const k = kit();
  k.add(roundBox(2.0, 0.34, 2.0, 0.1, 2), JELLY.white, { pos: [0, 0.17, 0] });
  k.add(roundBox(1.5, 1.4, 1.4, 0.14, 2), JELLY.white, { pos: [0, 1.04, 0] });
  k.add(roundBox(1.7, 0.18, 1.6, 0.07, 2), JELLY.berry, { pos: [0, 1.8, 0] });
  // the gopuram: tiers rising straight off the top, each a little smaller
  for (let i = 0; i < 5; i++) {
    const t = i / 5;
    k.add(roundBox(1.4 - t * 1.0, 0.26, 1.3 - t * 0.95, 0.07, 2), i % 2 ? JELLY.marigold : JELLY.berry,
      { pos: [0, 2.0 + i * 0.27, 0] });
  }
  k.add(blob(0.17, 0.16, 0.17, 2), JELLY.mango, { pos: [0, 3.42, 0] });
  k.add(blob(0.07, 0.17, 0.07, 1), JELLY.mango, { pos: [0, 3.6, 0] });
  // the doorway, the lamp inside it, and a garland over the lintel
  k.add(roundBox(0.72, 1.0, 0.12, 0.05, 2), JELLY.coal, { pos: [0, 0.82, 0.68] });
  k.add(blob(0.2, 0.26, 0.13, 2), JELLY.marigold, { pos: [0, 0.9, 0.64], emit: 1 });
  for (let i = 0; i < 7; i++)
    k.add(blob(0.075, 0.075, 0.05, 1), i % 2 ? JELLY.marigold : JELLY.rose,
      { pos: [-0.42 + i * 0.14, 1.36 - Math.sin((i / 6) * Math.PI) * 0.1, 0.72] });
  // the bell, hung from its own little arch in front
  for (const x of [-0.78, 0.78]) k.add(cyl(0.07, 0.09, 1.9, 7), JELLY.woodDark, { pos: [x, 0.95, 1.5] });
  k.add(roundBox(1.9, 0.13, 0.13, 0.05, 2), JELLY.woodDark, { pos: [0, 1.96, 1.5] });
  k.add(capsule(0.02, 0.2, 5), JELLY.coal, { pos: [0, 1.82, 1.5] });
  k.add(cyl(0.17, 0.26, 0.36, 12, 0.06), JELLY.mango, { pos: [0, 1.52, 1.5] });
  k.add(blob(0.07, 0.1, 0.07, 1), JELLY.mango, { pos: [0, 1.3, 1.5] });
  return k.build();
}

export function fence(len = 2): THREE.BufferGeometry {
  const k = kit();
  k.add(cyl(0.055, 0.07, 1.0, 6), JELLY.woodDark, { pos: [-len / 2, 0.5, 0] });
  k.add(cyl(0.055, 0.07, 1.0, 6), JELLY.woodDark, { pos: [len / 2, 0.5, 0] });
  for (const y of [0.42, 0.78]) k.add(roundBox(len, 0.07, 0.07, 0.03, 1), JELLY.wood, { pos: [0, y, 0] });
  return k.build();
}

export function lantern(): THREE.BufferGeometry {
  const k = kit();
  k.add(cyl(0.05, 0.07, 2.2, 7), JELLY.coal, { pos: [0, 1.1, 0] });
  k.add(roundBox(0.3, 0.1, 0.3, 0.04, 2), JELLY.coal, { pos: [0, 2.26, 0] });
  k.add(blob(0.17, 0.2, 0.17, 2), JELLY.lemon, { pos: [0, 2.05, 0], emit: 1 });
  k.add(cone(0.26, 0.24, 10).rotateX(Math.PI), JELLY.tinRust, { pos: [0, 2.3, 0] });
  return k.build();
}

export function signboard(): THREE.BufferGeometry {
  const k = kit();
  for (const x of [-0.5, 0.5]) k.add(cyl(0.06, 0.07, 1.5, 6), JELLY.woodDark, { pos: [x, 0.75, 0] });
  k.add(roundBox(1.5, 0.7, 0.1, 0.06, 2), JELLY.mint, { pos: [0, 1.5, 0] });
  k.add(roundBox(1.2, 0.1, 0.04, 0.02, 1), JELLY.coal, { pos: [0, 1.62, 0.06] });
  k.add(roundBox(0.9, 0.08, 0.04, 0.02, 1), JELLY.coal, { pos: [-0.1, 1.44, 0.06] });
  return k.build();
}

/* ───────── the things you carry and use ───────── */

/** The plucking basket, worn on the back with a band round the head. */
export function basket(): THREE.BufferGeometry {
  const k = kit();
  k.add(cyl(0.34, 0.22, 0.56, 14, 0.05), JELLY.wood, { pos: [0, 0.3, 0] });
  for (let i = 0; i < 3; i++) k.add(cyl(0.33 - i * 0.02, 0.33 - i * 0.02, 0.05, 14), JELLY.woodDark, { pos: [0, 0.14 + i * 0.17, 0] });
  k.add(cyl(0.35, 0.35, 0.06, 14, 0.02), JELLY.woodDark, { pos: [0, 0.58, 0] });
  return k.build();
}

/** What is in the basket, scaled by how full it is. */
export function basketLeaf(): THREE.BufferGeometry {
  const k = kit();
  const s = { s: 23 };
  for (let i = 0; i < 9; i++) {
    const a = rnd(s) * 6.283, r = rnd(s) * 0.22;
    k.add(blob(0.11, 0.05, 0.09, 1, 0.3), i % 2 ? JELLY.leaf : JELLY.leafNew, { pos: [Math.cos(a) * r, 0.56 + rnd(s) * 0.06, Math.sin(a) * r] });
  }
  return k.build();
}

export function wateringCan(): THREE.BufferGeometry {
  const k = kit();
  k.add(cyl(0.2, 0.22, 0.34, 12, 0.05), JELLY.tinRust, { pos: [0, 0.17, 0] });
  k.add(capsule(0.035, 0.34, 6), JELLY.tinRust, { pos: [0.26, 0.26, 0], rot: [0, 0, -0.75] });
  k.add(cone(0.1, 0.12, 8), JELLY.tinRust, { pos: [0.44, 0.38, 0], rot: [0, 0, -1.4] });
  k.add(capsule(0.03, 0.2, 5), JELLY.tinRust, { pos: [-0.2, 0.4, 0], rot: [0, 0, 0.3] });
  return k.build();
}

export function shears(): THREE.BufferGeometry {
  const k = kit();
  for (const sgn of [1, -1]) {
    k.add(roundBox(0.06, 0.4, 0.02, 0.01, 1), JELLY.tin, { pos: [sgn * 0.03, 0.42, 0], rot: [0, 0, sgn * 0.12] });
    k.add(roundBox(0.05, 0.3, 0.05, 0.02, 1), JELLY.berry, { pos: [sgn * 0.08, 0.12, 0], rot: [0, 0, sgn * 0.25] });
  }
  k.add(blob(0.04, 0.04, 0.05, 1), JELLY.coal, { pos: [0, 0.26, 0] });
  return k.build();
}

export function broom(): THREE.BufferGeometry {
  const k = kit();
  k.add(capsule(0.032, 1.1, 6), JELLY.wood, { pos: [0, 0.75, 0] });
  const s = { s: 13 };
  for (let i = 0; i < 12; i++) { const a = rnd(s) * 6.283, r = rnd(s) * 0.11; k.add(capsule(0.012, 0.3, 4), JELLY.grassDry, { pos: [Math.cos(a) * r, 0.16, Math.sin(a) * r], rot: [Math.sin(a) * 0.3, 0, -Math.cos(a) * 0.3] }); }
  k.add(cyl(0.11, 0.09, 0.08, 10), JELLY.berry, { pos: [0, 0.32, 0] });
  return k.build();
}

export function pot(): THREE.BufferGeometry {
  const k = kit();
  k.add(blob(0.25, 0.24, 0.25, 2), JELLY.tinRust, { pos: [0, 0.24, 0] });
  k.add(cyl(0.13, 0.16, 0.12, 12, 0.03), JELLY.tinRust, { pos: [0, 0.46, 0] });
  k.add(cyl(0.16, 0.16, 0.04, 12), JELLY.mango, { pos: [0, 0.52, 0] });
  return k.build();
}

export function log(len = 0.8): THREE.BufferGeometry {
  const k = kit();
  k.add(cyl(0.13, 0.14, len, 10, 0.03), JELLY.wood, { pos: [0, 0, 0], rot: [0, 0, Math.PI / 2] });
  k.add(cyl(0.1, 0.1, 0.03, 10), JELLY.cream, { pos: [len / 2, 0, 0], rot: [0, 0, Math.PI / 2] });
  k.add(cyl(0.1, 0.1, 0.03, 10), JELLY.cream, { pos: [-len / 2, 0, 0], rot: [0, 0, Math.PI / 2] });
  return k.build();
}

export function choppingBlock(): THREE.BufferGeometry {
  const k = kit();
  k.add(cyl(0.44, 0.48, 0.6, 14, 0.06), JELLY.woodDark, { pos: [0, 0.3, 0] });
  k.add(roundBox(0.1, 0.22, 0.04, 0.02, 1), JELLY.tin, { pos: [0.1, 0.72, 0], rot: [0, 0, 0.5] });
  k.add(capsule(0.03, 0.4, 5), JELLY.wood, { pos: [-0.06, 0.78, 0], rot: [0, 0, 1.0] });
  return k.build();
}

/** Washing pegged out on a line, bellying in the breeze. */
export function washing(colour: string): THREE.BufferGeometry {
  const k = kit();
  k.add(roundBox(0.46, 0.6, 0.05, 0.05, 2), colour, { pos: [0, -0.34, 0] });
  k.add(roundBox(0.16, 0.26, 0.05, 0.04, 1), colour, { pos: [0.3, -0.26, 0], rot: [0, 0, -0.4] });
  k.add(roundBox(0.16, 0.26, 0.05, 0.04, 1), colour, { pos: [-0.3, -0.26, 0], rot: [0, 0, 0.4] });
  return k.build();
}

export function teaChest(): THREE.BufferGeometry {
  const k = kit();
  k.add(roundBox(0.7, 0.62, 0.7, 0.06, 2), JELLY.wood, { pos: [0, 0.31, 0] });
  k.add(roundBox(0.74, 0.07, 0.74, 0.03, 2), JELLY.tin, { pos: [0, 0.62, 0] });
  for (const z of [-0.36, 0.36]) k.add(roundBox(0.5, 0.3, 0.03, 0.02, 1), JELLY.coal, { pos: [0, 0.34, z] });
  return k.build();
}

/* ───────── the people ───────── */

export interface Look { skin: string; cloth: string; cloth2: string; hair: string }

export const LOOKS: Look[] = [
  { skin: '#e8a877', cloth: JELLY.berry, cloth2: JELLY.marigold, hair: '#3b2a33' },
  { skin: '#d79262', cloth: JELLY.plum, cloth2: JELLY.lemon, hair: '#2f2430' },
  { skin: '#f0b98a', cloth: JELLY.mint, cloth2: JELLY.rose, hair: '#4a3340' },
  { skin: '#c57f52', cloth: JELLY.sky, cloth2: JELLY.white, hair: '#241c28' },
  { skin: '#e8a877', cloth: JELLY.orange, cloth2: JELLY.mint, hair: '#3b2a33' },
  { skin: '#d79262', cloth: JELLY.lemon, cloth2: JELLY.berry, hair: '#2f2430' },
];

export interface FigureParts {
  torso: THREE.BufferGeometry;
  head: THREE.BufferGeometry;
  arm: THREE.BufferGeometry;
  leg: THREE.BufferGeometry;
}

/**
 * A jelly villager, in pieces so the arms and legs can swing. Short, round
 * and top-heavy, which is what makes the walk wobble.
 */
export function figure(look: Look, shawl = true): FigureParts {
  const torso = kit()
    .add(blob(0.3, 0.36, 0.24, 3, 0.1), look.cloth, { pos: [0, 0.36, 0] })
    .add(blob(0.31, 0.12, 0.26, 2), look.cloth2, { pos: [0, 0.08, 0] })
    .add(shawl ? blob(0.33, 0.2, 0.27, 2, 0.15) : blob(0.26, 0.1, 0.22, 2), shawl ? look.cloth2 : look.cloth, { pos: [0, 0.6, 0] })
    .build();
  const head = kit()
    .add(blob(0.25, 0.27, 0.24, 3, 0.07), look.skin, { pos: [0, 0, 0] })
    .add(blob(0.26, 0.17, 0.25, 2, 0.1), look.hair, { pos: [0, 0.12, -0.02] })
    .add(blob(0.09, 0.1, 0.09, 2), look.hair, { pos: [0, 0.02, -0.22] })
    .pair(blob(0.045, 0.055, 0.03, 2), '#241a22', { pos: [0.1, 0.02, 0.21] })
    .pair(blob(0.016, 0.018, 0.012, 1), '#ffffff', { pos: [0.115, 0.045, 0.235] })
    .add(blob(0.05, 0.03, 0.03, 2), JELLY.rose, { pos: [0, -0.1, 0.21] })
    .pair(blob(0.05, 0.04, 0.02, 2), '#f08098', { pos: [0.17, -0.05, 0.18] })
    .build();
  const arm = kit().add(capsule(0.072, 0.3, 7), look.cloth, { pos: [0, -0.2, 0] })
    .add(blob(0.082, 0.08, 0.082, 2), look.skin, { pos: [0, -0.39, 0] }).build();
  const leg = kit().add(capsule(0.085, 0.22, 7), look.cloth2, { pos: [0, -0.16, 0] })
    .add(blob(0.1, 0.07, 0.13, 2), look.skin, { pos: [0, -0.31, 0.03] }).build();
  return { torso, head, arm, leg };
}

/* ───────── the animals ───────── */

export function cow(): { body: THREE.BufferGeometry; head: THREE.BufferGeometry; leg: THREE.BufferGeometry } {
  const hide = JELLY.cream, patch = '#b98a5e';
  const body = kit()
    .add(blob(0.54, 0.46, 0.82, 3, 0.1), hide, { pos: [0, 0, 0] })
    .add(blob(0.2, 0.17, 0.22, 2, 0.2), patch, { pos: [0.3, 0.2, 0.2] })
    .add(blob(0.17, 0.14, 0.2, 2, 0.2), patch, { pos: [-0.34, 0.05, -0.3] })
    .add(blob(0.16, 0.13, 0.16, 2), '#f6c9d4', { pos: [0, -0.4, -0.2] })
    .add(capsule(0.035, 0.4, 5), hide, { pos: [0, 0.1, -0.85], rot: [0.4, 0, 0] })
    .add(blob(0.07, 0.09, 0.07, 2), JELLY.coal, { pos: [0, -0.14, -1.0] })
    .add(cyl(0.12, 0.14, 0.3, 8), hide, { pos: [0, 0.22, 0.72], rot: [0.5, 0, 0] })
    .build();
  const head = kit()
    .add(blob(0.26, 0.26, 0.34, 3, 0.1), hide, { pos: [0, 0, 0] })
    .add(blob(0.17, 0.15, 0.16, 2), '#f0b3c0', { pos: [0, -0.06, 0.3] })
    .pair(blob(0.035, 0.03, 0.03, 1), JELLY.coal, { pos: [0.07, -0.02, 0.42] })
    .pair(blob(0.07, 0.09, 0.05, 2), '#241a22', { pos: [0.16, 0.11, 0.2] })
    .pair(blob(0.03, 0.03, 0.02, 1), '#ffffff', { pos: [0.175, 0.14, 0.235] })
    .pair(blob(0.13, 0.07, 0.06, 2), hide, { pos: [0.27, 0.14, -0.02], rot: [0, 0, -0.3] })
    .pair(capsule(0.045, 0.1, 5), JELLY.cream, { pos: [0.14, 0.3, 0.02], rot: [0, 0, -0.45] })
    .build();
  const leg = kit().add(capsule(0.085, 0.34, 6), hide, { pos: [0, -0.22, 0] })
    .add(blob(0.1, 0.08, 0.11, 2), JELLY.coal, { pos: [0, -0.42, 0.02] }).build();
  return { body, head, leg };
}

export function chicken(): THREE.BufferGeometry {
  const k = kit();
  k.add(blob(0.15, 0.16, 0.19, 2, 0.1), JELLY.white, { pos: [0, 0.22, 0] });
  k.add(blob(0.1, 0.11, 0.1, 2), JELLY.white, { pos: [0, 0.4, 0.09] });
  k.add(blob(0.035, 0.03, 0.055, 1), JELLY.mango, { pos: [0, 0.39, 0.19] });
  k.add(blob(0.04, 0.055, 0.02, 1), JELLY.berry, { pos: [0, 0.49, 0.08] });
  k.pair(blob(0.018, 0.018, 0.012, 1), JELLY.coal, { pos: [0.06, 0.43, 0.15] });
  k.add(blob(0.06, 0.1, 0.03, 2), JELLY.white, { pos: [0, 0.3, -0.18], rot: [0.5, 0, 0] });
  k.pair(capsule(0.016, 0.1, 4), JELLY.mango, { pos: [0.06, 0.07, 0] });
  return k.build();
}

export function dog(): THREE.BufferGeometry {
  const k = kit();
  k.add(blob(0.17, 0.17, 0.3, 2, 0.1), JELLY.mango, { pos: [0, 0.34, 0] });
  k.add(blob(0.15, 0.14, 0.17, 2), JELLY.mango, { pos: [0, 0.46, 0.3] });
  k.add(blob(0.07, 0.06, 0.08, 2), JELLY.coal, { pos: [0, 0.42, 0.43] });
  k.pair(blob(0.05, 0.09, 0.03, 2), JELLY.orange, { pos: [0.1, 0.58, 0.28], rot: [0, 0, 0.2] });
  k.pair(blob(0.025, 0.028, 0.016, 1), JELLY.coal, { pos: [0.07, 0.5, 0.41] });
  k.add(capsule(0.028, 0.22, 5), JELLY.mango, { pos: [0, 0.46, -0.3], rot: [-0.7, 0, 0] });
  for (const z of [0.16, -0.18]) k.pair(capsule(0.045, 0.2, 5), JELLY.mango, { pos: [0.11, 0.16, z] });
  return k.build();
}

/* ───────── scenery bits ───────── */

/** A step cut into the hillside, laid in runs up the terraces. */
export function stepStone(w = 1.4): THREE.BufferGeometry {
  return paint(roundBox(w, 0.22, 0.6, 0.07, 2).translate(0, 0.11, 0), JELLY.rock);
}

export function cloudPuff(): THREE.BufferGeometry {
  const k = kit();
  const s = { s: 77 };
  for (let i = 0; i < 7; i++) {
    const a = rnd(s) * 6.283, r = rnd(s) * 2.4;
    k.add(blob(1.3 + rnd(s), 0.75, 1.1 + rnd(s) * 0.6, 1, 0.2), '#ffffff', { pos: [Math.cos(a) * r, rnd(s) * 0.5, Math.sin(a) * r * 0.5] });
  }
  return k.build();
}

/** The painted sign over the estate gate. */
export function gateArch(): THREE.BufferGeometry {
  const k = kit();
  for (const x of [-2.6, 2.6]) {
    k.add(cyl(0.18, 0.24, 3.4, 10, 0.06), JELLY.white, { pos: [x, 1.7, 0] });
    k.add(roundBox(0.7, 0.3, 0.7, 0.1, 2), JELLY.berry, { pos: [x, 3.5, 0] });
  }
  k.add(roundBox(6.0, 0.34, 0.3, 0.12, 2), JELLY.berry, { pos: [0, 3.9, 0] });
  k.add(roundBox(5.0, 0.7, 0.16, 0.08, 2), JELLY.marigold, { pos: [0, 3.45, 0.1] });
  for (let i = 0; i < 9; i++) k.add(blob(0.09, 0.09, 0.05, 1), i % 2 ? JELLY.leafNew : JELLY.white, { pos: [-2 + i * 0.5, 3.45, 0.2] });
  return k.build();
}
