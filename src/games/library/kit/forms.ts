import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * Soft geometry.
 *
 * Nothing in this world has a sharp edge. A diorama that reads as *painted*
 * rather than as *modelled* is almost entirely a matter of silhouette: every
 * form is a lump with a rounded top, and the light does the rest. So the kit
 * is a handful of primitives with the corners taken off, plus a noise
 * displacement that makes two calls to the same function produce two different
 * rocks.
 */

// ------------------------------------------------------------------- randoms

export function rng(seed: number): () => number {
  let a = (seed ^ 0x9e3779b9) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Value noise on the sphere, summed over three octaves.
 *
 * Cheap, deterministic and — the part that matters — *continuous*, so a
 * displaced sphere stays closed. Perlin would be prettier and this is being
 * used at a scale where nobody can tell.
 */
function lumps(seed: number) {
  const r = rng(seed);
  const dirs: THREE.Vector3[] = [];
  const amps: number[] = [];
  const freqs: number[] = [];
  for (let i = 0; i < 9; i++) {
    dirs.push(new THREE.Vector3(r() * 2 - 1, r() * 2 - 1, r() * 2 - 1).normalize());
    amps.push(1 / (1 + i * 0.55));
    freqs.push(1.1 + i * 0.85);
  }
  return (v: THREE.Vector3) => {
    let s = 0;
    let w = 0;
    for (let i = 0; i < dirs.length; i++) {
      s += Math.sin(v.dot(dirs[i]) * freqs[i] * Math.PI + i) * amps[i];
      w += amps[i];
    }
    return s / w;
  };
}

/**
 * Weld parts into one solid.
 *
 * The re-indexing at the end is not tidiness, it is the entire look. Merging
 * produces a non-indexed geometry, and `computeVertexNormals` on a non-indexed
 * geometry can only give every triangle its own normal — which is flat shading,
 * and turns a soft painted boulder into a low-poly one. `mergeVertices` welds
 * the coincident corners back together so a normal can be shared between the
 * faces that meet there, and the rock goes smooth.
 */
export function weld(parts: THREE.BufferGeometry[], smooth = true): THREE.BufferGeometry {
  const flat = parts.map((g) => (g.index ? g.toNonIndexed() : g));
  const merged = mergeGeometries(flat, false);
  if (!merged) throw new Error('library: could not merge geometry');
  parts.forEach((g, i) => {
    if (flat[i] !== g) flat[i].dispose();
    g.dispose();
  });
  if (!smooth) {
    merged.computeVertexNormals();
    return merged;
  }
  const sealed = mergeVertices(merged, 1e-4);
  merged.dispose();
  sealed.computeVertexNormals();
  return sealed;
}

/** Smooth an already-built geometry in place, for the same reason. */
export function smooth(g: THREE.BufferGeometry): THREE.BufferGeometry {
  const sealed = mergeVertices(g, 1e-4);
  g.dispose();
  sealed.computeVertexNormals();
  return sealed;
}

// --------------------------------------------------------------------- rocks

export interface RockOptions {
  /** Overall size, before `squash`. */
  size?: number;
  /** How far the surface wanders. 0 is a ball, 0.4 is a boulder. */
  rough?: number;
  /** Height against width. Below 1 is a pebble, above is a standing stone. */
  squash?: number;
  detail?: number;
  /** Flatten the bottom so it sits on the ground rather than floating on it. */
  seat?: boolean;
}

/**
 * A rock.
 *
 * An icosphere pushed about by the noise, then flattened underneath. The seat
 * is what makes a field of these look placed rather than scattered: a sphere
 * resting on a plane touches it at one point and reads as a balloon.
 */
export function rock(seed: number, o: RockOptions = {}): THREE.BufferGeometry {
  const size = o.size ?? 1;
  const rough = o.rough ?? 0.26;
  const squash = o.squash ?? 0.82;
  const g = new THREE.IcosahedronGeometry(size, o.detail ?? 3);
  const noise = lumps(seed);
  const pos = g.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const n = v.clone().normalize();
    const k = 1 + noise(n.clone().multiplyScalar(1.7)) * rough;
    v.copy(n).multiplyScalar(size * k);
    v.y *= squash;
    if (o.seat !== false) {
      // Everything below the waist is pulled towards the base plane, so the
      // rock sits in the ground instead of on it.
      const floor = -size * squash * 0.55;
      if (v.y < floor) v.y = floor + (v.y - floor) * 0.16;
    }
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  return smooth(g);
}

/**
 * A cluster: several rocks leaning on each other.
 *
 * One rock is a rock. Three overlapping is a formation, and the overlap is
 * what hides the fact that they are spheres.
 */
export function outcrop(seed: number, count = 4, spread = 1.1, size = 1): THREE.BufferGeometry {
  const r = rng(seed);
  const parts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < count; i++) {
    const s = size * (0.55 + r() * 0.7);
    const g = rock(seed + i * 977, { size: s, rough: 0.2 + r() * 0.18, squash: 0.7 + r() * 0.4 });
    const a = (i / count) * Math.PI * 2 + r();
    const d = i === 0 ? 0 : spread * size * (0.4 + r() * 0.7);
    g.translate(Math.cos(a) * d, s * 0.42 * (0.4 + r() * 0.5), Math.sin(a) * d);
    parts.push(g);
  }
  return weld(parts);
}

/**
 * The ground a scene stands on, and — the part that matters — a function that
 * says how high it is anywhere.
 *
 * Scattering nine hundred tufts of grass across a displaced surface needs the
 * height at each of nine hundred points. Raycasting for each is slow and
 * eyeballing a constant buries half of them under the hill, so the surface is
 * built *from* a height function and hands the same function back. Everything
 * that stands on the ground — grass, flowers, a chair, a person — asks it.
 */
export interface Ground {
  geometry: THREE.BufferGeometry;
  radius: number;
  /** Surface height at a point. Clamped to the rim beyond the edge. */
  heightAt: (x: number, z: number) => number;
  /** True inside the walkable area. */
  inside: (x: number, z: number, margin?: number) => boolean;
}

export interface GroundOptions {
  radius?: number;
  thickness?: number;
  /** How much the middle is dished, or domed if negative. */
  dish?: number;
  /** How high the rim curls up. */
  lip?: number;
  /** Amplitude of the wandering. */
  bumps?: number;
  rings?: number;
  segments?: number;
  /** Square rather than round — a floor, a plinth, a page. */
  square?: boolean;
}

export function ground(seed: number, o: GroundOptions = {}): Ground {
  const R = o.radius ?? 6;
  const thickness = o.thickness ?? 2.2;
  const dish = o.dish ?? 0.35;
  const lip = o.lip ?? 0.5;
  const bumps = o.bumps ?? 0.3;
  const rings = o.rings ?? 22;
  const segments = o.segments ?? 56;
  const noise = lumps(seed);
  const scratch = new THREE.Vector3();

  const heightAt = (x: number, z: number): number => {
    const d = Math.min(1, Math.hypot(x, z) / R);
    const n = noise(scratch.set(x / R, 0.4, z / R).normalize().multiplyScalar(1 + d));
    return -dish * (1 - d * d) + lip * d * d * d + n * bumps;
  };
  const inside = (x: number, z: number, margin = 0) =>
    o.square
      ? Math.abs(x) < R - margin && Math.abs(z) < R - margin
      : Math.hypot(x, z) < R - margin;

  const top: number[] = [];
  const index: number[] = [];
  const at = (ring: number, seg: number) => ring * (segments + 1) + seg;

  for (let ri = 0; ri <= rings; ri++) {
    const t = ri / rings;
    for (let si = 0; si <= segments; si++) {
      const a2 = (si / segments) * Math.PI * 2;
      let x: number;
      let z: number;
      if (o.square) {
        // A rounded square, so a floor still has soft corners.
        const c = Math.cos(a2);
        const sn = Math.sin(a2);
        const k = Math.pow(Math.abs(c) ** 4 + Math.abs(sn) ** 4, -0.25);
        x = c * k * R * t;
        z = sn * k * R * t;
      } else {
        x = Math.cos(a2) * R * t;
        z = Math.sin(a2) * R * t;
      }
      top.push(x, heightAt(x, z), z);
    }
  }
  for (let ri = 0; ri < rings; ri++) {
    for (let si = 0; si < segments; si++) {
      const a2 = at(ri, si);
      const b2 = at(ri + 1, si);
      const c2 = at(ri + 1, si + 1);
      const d2 = at(ri, si + 1);
      index.push(a2, b2, c2, a2, c2, d2);
    }
  }

  // The skirt and the underside, so the ground is a solid lump rather than a
  // sheet you can see the back of when the camera dips.
  const base = top.length / 3;
  for (let si = 0; si <= segments; si++) {
    const k = at(rings, si) * 3;
    top.push(top[k] * 0.78, top[k + 1] - thickness, top[k + 2] * 0.78);
  }
  for (let si = 0; si < segments; si++) {
    const a2 = at(rings, si);
    const d2 = at(rings, si + 1);
    index.push(a2, base + si, base + si + 1, a2, base + si + 1, d2);
  }
  const navel = top.length / 3;
  top.push(0, top[at(rings, 0) * 3 + 1] - thickness * 1.25, 0);
  for (let si = 0; si < segments; si++) index.push(base + si, navel, base + si + 1);

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(top, 3));
  g.setIndex(index);
  g.computeVertexNormals();

  return { geometry: g, radius: R, heightAt, inside };
}

// -------------------------------------------------------------------- solids

/** A box with the edges taken off, which is every built thing in this kit. */
export function block(w: number, h: number, d: number, radius = 0.06): THREE.BufferGeometry {
  return new RoundedBoxGeometry(w, h, d, 2, Math.min(radius, Math.min(w, h, d) * 0.49));
}

/** A soft cylinder — a column, a trunk, a chimney, a candle. */
export function column(
  rTop: number,
  rBottom: number,
  h: number,
  segments = 18,
  cap = true,
): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [new THREE.CylinderGeometry(rTop, rBottom, h, segments, 1, true)];
  if (cap) {
    const top = new THREE.SphereGeometry(rTop, segments, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    top.translate(0, h / 2, 0);
    const bot = new THREE.SphereGeometry(rBottom, segments, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
    bot.translate(0, -h / 2, 0);
    parts.push(top, bot);
  }
  return weld(parts);
}

/** A blob — a bush, a cloud, a heap. */
export function blob(seed: number, size = 1, count = 5, squash = 0.8): THREE.BufferGeometry {
  const r = rng(seed);
  const parts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < count; i++) {
    const s = size * (0.5 + r() * 0.6);
    const g = new THREE.IcosahedronGeometry(s, 2);
    g.scale(1, squash, 1);
    const a = (i / count) * Math.PI * 2 + r() * 0.9;
    const d = i === 0 ? 0 : size * (0.35 + r() * 0.55);
    g.translate(Math.cos(a) * d, size * squash * (r() - 0.2) * 0.5, Math.sin(a) * d);
    parts.push(g);
  }
  return weld(parts);
}

/** A plank: long, thin, and rounded so it catches a highlight along its edge. */
export const plank = (l: number, w: number, t: number) => block(l, t, w, Math.min(t, w) * 0.42);

/**
 * A path of tiles laid along a curve.
 *
 * Each tile is turned to face along the path and jittered, because a path made
 * of tiles at the same angle reads as a texture rather than as stones somebody
 * put down.
 */
export function paving(
  seed: number,
  curve: THREE.Curve<THREE.Vector3>,
  count: number,
  width = 0.5,
  tile = 0.34,
): THREE.BufferGeometry {
  const r = rng(seed);
  const parts: THREE.BufferGeometry[] = [];
  const up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < count; i++) {
    const t = (i + 0.5) / count;
    const p = curve.getPoint(t);
    const tan = curve.getTangent(t).normalize();
    const side = new THREE.Vector3().crossVectors(up, tan).normalize();
    for (const lane of [-1, 1]) {
      const g = block(tile * (0.8 + r() * 0.4), 0.09, tile * (0.8 + r() * 0.4), 0.035);
      const m = new THREE.Matrix4().makeRotationY(Math.atan2(tan.x, tan.z) + (r() - 0.5) * 0.5);
      m.setPosition(
        p.x + side.x * lane * width * 0.5 * (0.7 + r() * 0.5),
        p.y + (r() - 0.5) * 0.02,
        p.z + side.z * lane * width * 0.5 * (0.7 + r() * 0.5),
      );
      g.applyMatrix4(m);
      parts.push(g);
    }
  }
  return weld(parts);
}

// ---------------------------------------------------------------- scattering

export interface Scattered {
  geometry: THREE.BufferGeometry;
  matrices: THREE.Matrix4[];
}

/**
 * Grass, flowers, pebbles: many copies of one small thing.
 *
 * Returned as transforms rather than as a merged geometry so the caller can put
 * them in an `InstancedMesh` — a thousand tufts of grass is one draw and the
 * whole reason the scenes can afford to be dense.
 */
export function scatter(
  seed: number,
  count: number,
  place: (r: () => number, i: number) => { at: THREE.Vector3; scale?: number; turn?: number; lean?: number } | null,
): THREE.Matrix4[] {
  const r = rng(seed);
  const out: THREE.Matrix4[] = [];
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const s = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    const spot = place(r, i);
    if (!spot) continue;
    const k = spot.scale ?? 1;
    e.set((spot.lean ?? 0) * (r() - 0.5), spot.turn ?? r() * Math.PI * 2, (spot.lean ?? 0) * (r() - 0.5));
    q.setFromEuler(e);
    s.set(k, k, k);
    out.push(new THREE.Matrix4().compose(spot.at, q, s));
  }
  return out;
}

/** A single blade cluster: three tapered fins, which is enough at this size. */
export function tuft(height = 0.42, width = 0.09): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 3; i++) {
    const g = new THREE.ConeGeometry(width * (1 - i * 0.15), height * (1 - i * 0.18), 4, 2);
    g.translate(0, height * (1 - i * 0.18) * 0.5, 0);
    g.rotateZ((i - 1) * 0.34);
    g.rotateY((i / 3) * Math.PI * 2);
    g.translate((i - 1) * width * 0.5, 0, (i - 1) * width * 0.4);
    parts.push(g);
  }
  return weld(parts);
}

/** A five-petal flower head on a stalk. */
export function bloom(size = 0.09): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 5; i++) {
    const p = new THREE.SphereGeometry(size * 0.55, 7, 5);
    p.scale(1, 0.42, 1.35);
    const a = (i / 5) * Math.PI * 2;
    p.translate(Math.cos(a) * size * 0.7, 0, Math.sin(a) * size * 0.7);
    parts.push(p);
  }
  const mid = new THREE.SphereGeometry(size * 0.42, 8, 6);
  mid.scale(1, 0.7, 1);
  parts.push(mid);
  const g = weld(parts);
  g.translate(0, size * 0.3, 0);
  return g;
}
