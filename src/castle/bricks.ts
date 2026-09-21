import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * A toy-brick vocabulary.
 *
 * The whole castle is built out of studded bricks, and the reason to do it that
 * way rather than modelling walls as boxes is that a *course* reads. A wall
 * made of one long box is a wall in a diagram; a wall made of overlapping
 * bricks in a running bond, with the studs catching the light along the top of
 * every course, is a wall somebody built. It is the same argument as the
 * keylines in the rooms: the construction is the drawing.
 *
 * ── How this stays fast ──────────────────────────────────────────────────
 *
 * A castle is thirty to fifty thousand bricks and none of them can be a draw
 * call. Bricks are bucketed by *size* — there are nine sizes — and each size
 * gets one `InstancedMesh` carrying every brick of that size in the world, with
 * the colour per instance. Nine draw calls for the whole castle.
 *
 * Instancing by size rather than by colour is deliberate: an instance can only
 * be moved, turned and scaled, and scaling a 1×1 brick up to a 4×1 would
 * stretch its studs into ovals. Each size therefore needs its own geometry
 * with its studs in the right places.
 */

/** One stud across, and the height of one brick. Ratios, not millimetres. */
export const STUD = 1;
export const BRICK = 1.2;
const STUD_R = 0.3;
const STUD_H = 0.17;

/** Every brick footprint the castle is allowed to use, longest first. */
export const SIZES: [w: number, d: number][] = [
  [8, 2], [6, 1], [4, 2], [4, 1], [3, 1], [2, 2], [2, 1], [1, 1], [1, 2],
];

export const sizeKey = (w: number, d: number) => `${w}x${d}`;

const geoCache = new Map<string, THREE.BufferGeometry>();

/**
 * The geometry for one brick size: a box with studs on top.
 *
 * Built once per size and shared by every instance of it. The box is inset a
 * hair so that two bricks side by side have a visible seam — without it a wall
 * is a single flat surface again and all the brickwork is wasted.
 */
export function brickGeometry(w: number, d: number): THREE.BufferGeometry {
  const key = sizeKey(w, d);
  const had = geoCache.get(key);
  if (had) return had;

  const gap = 0.045;
  const body = new THREE.BoxGeometry(w * STUD - gap, BRICK - gap * 0.5, d * STUD - gap);
  body.translate(0, BRICK / 2, 0);

  const parts: THREE.BufferGeometry[] = [body];
  const stud = new THREE.CylinderGeometry(STUD_R, STUD_R * 0.98, STUD_H, 10, 1, false);
  for (let i = 0; i < w; i++) {
    for (let j = 0; j < d; j++) {
      const s = stud.clone();
      s.translate(
        (i - (w - 1) / 2) * STUD,
        BRICK + STUD_H / 2 - 0.01,
        (j - (d - 1) / 2) * STUD,
      );
      parts.push(s);
    }
  }
  stud.dispose();

  const merged = mergeGeometries(parts, false);
  for (const p of parts) if (p !== body) p.dispose();
  merged.computeVertexNormals();
  geoCache.set(key, merged);
  return merged;
}

export interface Placement {
  w: number;
  d: number;
  x: number;
  y: number;
  z: number;
  /** Quarter turns about the vertical. */
  turn?: number;
  colour: string;
}

/**
 * The palette.
 *
 * Kept small on purpose. A model in nine colours reads as a *kit*; the same
 * model in forty reads as a render that happens to have studs on it.
 */
export const P = {
  stone: '#9aa0a6',
  stoneDark: '#767c84',
  stoneLight: '#b6bcc2',
  slate: '#55688a',
  slateDark: '#45546f',
  roof: '#8a5148',
  wood: '#7a5433',
  woodDark: '#5a3d26',
  gold: '#e3b45c',
  glass: '#f0d79a',
  green: '#4c7a44',
  greenDark: '#355a30',
  water: '#3b6ea5',
  snow: '#e9eef4',
  earth: '#6a5947',
  banner: '#8d2f3a',
};

/**
 * Collects bricks, then hands back one instanced mesh per size.
 *
 * Nothing is added to the scene until `build()` — which means the whole castle
 * can be described as a list and only becomes geometry once.
 */
export class Bricks {
  private items: Placement[] = [];

  get count() {
    return this.items.length;
  }

  /** Put one brick down. Coordinates are in studs, y in brick courses. */
  put(w: number, d: number, x: number, y: number, z: number, colour: string, turn = 0) {
    this.items.push({ w, d, x, y, z, colour, turn });
  }

  /**
   * A straight run of wall, in a running bond.
   *
   * The bond is the point: each course is offset half a brick from the one
   * below, and the run is filled with the longest brick that fits so the joins
   * never line up. Laid as identical bricks in identical rows it reads as
   * graph paper stood on its end.
   */
  wall(
    x0: number, z0: number, len: number, courses: number, y0: number,
    colour: string, along: 'x' | 'z', depth = 1, jitter = 0,
  ) {
    for (let c = 0; c < courses; c++) {
      const offset = c % 2 === 0 ? 0 : 1;
      let at = -offset;
      while (at < len) {
        const left = Math.min(len - at, len);
        let pick = SIZES.find(([w, dd]) => dd === depth && w <= left && at + w <= len)
          ?? [1, depth] as [number, number];
        if (at < 0) pick = [Math.min(pick[0] + at === 0 ? 1 : pick[0], left), depth];
        const [w] = pick;
        const put = Math.max(1, Math.min(w, len - Math.max(0, at)));
        const start = Math.max(0, at);
        if (start >= len) break;
        const cx = along === 'x' ? x0 + start + put / 2 - 0.5 : x0;
        const cz = along === 'x' ? z0 : z0 + start + put / 2 - 0.5;
        // A brick or two sitting a shade proud, because nothing is laid perfectly.
        const nudge = jitter && (start + c) % 7 === 0 ? 0.06 : 0;
        this.put(
          along === 'x' ? put : depth,
          along === 'x' ? depth : put,
          cx + (along === 'z' ? nudge : 0),
          y0 + c,
          cz + (along === 'x' ? nudge : 0),
          colour,
        );
        at = start + put;
      }
    }
  }

  /** A rectangular room's four walls. */
  box(
    x: number, z: number, w: number, d: number, courses: number, y0: number,
    colour: string, depth = 1,
  ) {
    this.wall(x, z, w, courses, y0, colour, 'x', depth);
    this.wall(x, z + d - 1, w, courses, y0, colour, 'x', depth);
    this.wall(x, z + 1, d - 2, courses, y0, colour, 'z', depth);
    this.wall(x + w - 1, z + 1, d - 2, courses, y0, colour, 'z', depth);
  }

  /**
   * A flat floor, tiled in plates and actually covering the area.
   *
   * The first version stepped `tile` studs in both directions and then laid
   * whichever brick from the size list happened to fit inside that step —
   * which for a tile of six meant a 6×1 brick every six studs in *both*
   * directions, so a sixth of the floor got laid and five sixths was a hole.
   * On the ground that read as loose bricks scattered on a plain, and it was
   * the single worst thing in the model.
   *
   * Now the run advances by the brick it just laid, alternate rows start half
   * a brick over so the joints break, and the last brick in a row is whatever
   * length is needed to reach the edge.
   */
  slab(x: number, z: number, w: number, d: number, y: number, colour: string, tile = 4) {
    for (let j = 0; j < d;) {
      const depth = d - j >= 2 && tile >= 2 ? 2 : 1;
      let i = -((j / 2) % 2 === 0 ? 0 : Math.min(2, tile));
      while (i < w) {
        const start = Math.max(0, i);
        const room = Math.min(tile, w - start);
        if (room <= 0) break;
        const pick = SIZES.find(([a, b]) => b === depth && a <= room)
          ?? ([room, depth] as [number, number]);
        const len = Math.min(pick[0], room);
        this.put(len, depth, x + start + len / 2 - 0.5, y, z + j + depth / 2 - 0.5, colour);
        i = start + len;
      }
      j += depth;
    }
  }

  /**
   * A round tower, approximated in bricks.
   *
   * Each course is a ring of 1×2 bricks laid tangentially and rotated to the
   * angle they sit at, with the ring turned a little further every course so
   * the joints spiral rather than stack — which is both what a real round
   * tower does and what stops a moiré appearing up the side of it.
   */
  tower(cx: number, cz: number, radius: number, courses: number, y0: number, colour: string) {
    const per = Math.max(8, Math.round(radius * 3.4));
    for (let c = 0; c < courses; c++) {
      const twist = (c * Math.PI) / per;
      for (let i = 0; i < per; i++) {
        const a = (i / per) * Math.PI * 2 + twist;
        this.items.push({
          w: 2, d: 1,
          x: cx + Math.cos(a) * radius,
          y: y0 + c,
          z: cz + Math.sin(a) * radius,
          colour,
          turn: -a,
        });
      }
    }
  }

  /** A cone roof: rings of shrinking radius. */
  cone(cx: number, cz: number, radius: number, courses: number, y0: number, colour: string) {
    for (let c = 0; c < courses; c++) {
      const r = radius * (1 - c / courses);
      if (r < 0.6) {
        this.put(1, 1, cx, y0 + c, cz, colour);
        continue;
      }
      const per = Math.max(6, Math.round(r * 3.4));
      for (let i = 0; i < per; i++) {
        const a = (i / per) * Math.PI * 2 + (c * Math.PI) / per;
        this.items.push({
          w: 2, d: 1,
          x: cx + Math.cos(a) * r, y: y0 + c, z: cz + Math.sin(a) * r,
          colour, turn: -a,
        });
      }
    }
  }

  /** A pitched roof over a rectangular hall, stepped in courses. */
  gable(x: number, z: number, w: number, d: number, y0: number, colour: string) {
    /*
      Two studs of inset per course, not one.

      At one stud a hall twenty-six deep gets a roof thirteen courses tall,
      which from outside is not a roof — it is a black dome sitting on the
      building and blotting out everything behind it. Two studs halves the
      pitch and the hall reads as a hall.
    */
    const step = 2;
    for (let c = 0; c * step < d / 2; c++) {
      const inset = c * step;
      if (d - inset * 2 <= 0) break;
      this.wall(x, z + inset, w, 1, y0 + c, colour, 'x');
      this.wall(x, z + d - 1 - inset, w, 1, y0 + c, colour, 'x');
      // Close the ends, or you can see straight down the inside of it.
      this.wall(x, z + inset + 1, d - inset * 2 - 2, 1, y0 + c, colour, 'z');
      this.wall(x + w - 1, z + inset + 1, d - inset * 2 - 2, 1, y0 + c, colour, 'z');
    }
  }

  /** Crenellations along a wall top: brick, gap, brick. */
  crenels(x0: number, z0: number, len: number, y: number, colour: string, along: 'x' | 'z') {
    for (let i = 0; i < len; i += 2) {
      this.put(1, 1, along === 'x' ? x0 + i : x0, y, along === 'x' ? z0 : z0 + i, colour);
    }
  }

  /** A flight of steps. */
  stair(x: number, z: number, w: number, steps: number, y0: number, colour: string, dir: 1 | -1 = 1) {
    for (let s = 0; s < steps; s++) {
      this.slab(x, z + dir * s, w, 1, y0 + s, colour, 4);
      if (s > 0) this.slab(x, z + dir * s, w, 1, y0 + s - 1, colour, 4);
    }
  }

  /**
   * Hand back the meshes.
   *
   * One per size that was actually used, each carrying its own instances and a
   * colour per instance. Shadows on, because a brick model with no shadows has
   * no studs — the whole surface reads flat.
   */
  build(material: THREE.Material): THREE.Group {
    const group = new THREE.Group();
    const buckets = new Map<string, Placement[]>();
    for (const it of this.items) {
      const k = sizeKey(it.w, it.d);
      const b = buckets.get(k);
      if (b) b.push(it);
      else buckets.set(k, [it]);
    }

    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const pos = new THREE.Vector3();
    const one = new THREE.Vector3(1, 1, 1);
    const col = new THREE.Color();

    for (const [key, list] of buckets) {
      const [w, d] = key.split('x').map(Number) as [number, number];
      const mesh = new THREE.InstancedMesh(brickGeometry(w, d), material, list.length);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      for (const [i, it] of list.entries()) {
        pos.set(it.x * STUD, it.y * BRICK, it.z * STUD);
        q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), it.turn ?? 0);
        m.compose(pos, q, one);
        mesh.setMatrixAt(i, m);
        mesh.setColorAt(i, col.set(it.colour));
      }
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.frustumCulled = false;
      group.add(mesh);
    }
    return group;
  }
}
