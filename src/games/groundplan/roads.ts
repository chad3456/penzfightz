import type { Terrain } from './terrain';

/**
 * The road network, as a planar graph.
 *
 * Everything downstream comes out of this one structure. Blocks are its faces,
 * lots are subdivisions of those faces, buildings stand on the lots and face
 * the edge they were cut from, and traffic runs on the edges. Get the graph
 * right and the city is a consequence; get it wrong and every later system
 * needs a special case.
 *
 * Two decisions do most of the work.
 *
 * **Nodes are shared, always.** A new segment that ends within snapping
 * distance of an existing node uses that node rather than making a second one
 * on top of it. Two coincident nodes look identical and break face-finding
 * silently, which is the worst kind of broken: the city simply refuses to grow
 * in one block and there is nothing on screen to say why.
 *
 * **Crossing segments are split.** Laying a road across another inserts a node
 * in both. Without it the graph is not planar, the faces are wrong, and you get
 * a block that wraps around the outside of the city.
 */

export interface Node {
  id: number;
  x: number;
  z: number;
  /** Segment ids, kept sorted by bearing so face traversal can pick the next. */
  links: number[];
}

export interface Segment {
  id: number;
  a: number;
  b: number;
  /** Half-width in metres, so a "20 m road" is 10 either side of the centre. */
  half: number;
  kind: 'street' | 'avenue';
}

const SNAP = 14;
const MIN_LEN = 22;

export class Roads {
  nodes = new Map<number, Node>();
  segments = new Map<number, Segment>();
  private nextNode = 1;
  private nextSeg = 1;
  /** Bumped whenever the graph changes, so meshes and blocks know to rebuild. */
  version = 0;

  constructor(readonly terrain: Terrain) {}

  // ------------------------------------------------------------------ query

  nodeAt(x: number, z: number, r = SNAP): Node | null {
    let best: Node | null = null;
    let bd = r * r;
    for (const n of this.nodes.values()) {
      const d = (n.x - x) ** 2 + (n.z - z) ** 2;
      if (d < bd) {
        bd = d;
        best = n;
      }
    }
    return best;
  }

  /** Closest point on any segment, for snapping a road end onto a road side. */
  splitAt(x: number, z: number, r = SNAP): { seg: Segment; t: number; x: number; z: number } | null {
    let best: { seg: Segment; t: number; x: number; z: number } | null = null;
    let bd = r * r;
    for (const s of this.segments.values()) {
      const a = this.nodes.get(s.a);
      const b = this.nodes.get(s.b);
      if (!a || !b) continue;
      const dx = b.x - a.x;
      const dz = b.z - a.z;
      const len2 = dx * dx + dz * dz || 1;
      let t = ((x - a.x) * dx + (z - a.z) * dz) / len2;
      t = Math.max(0.08, Math.min(0.92, t));
      const px = a.x + dx * t;
      const pz = a.z + dz * t;
      const d = (px - x) ** 2 + (pz - z) ** 2;
      if (d < bd) {
        bd = d;
        best = { seg: s, t, x: px, z: pz };
      }
    }
    return best;
  }

  // ------------------------------------------------------------------ build

  private addNode(x: number, z: number): Node {
    const n: Node = { id: this.nextNode++, x, z, links: [] };
    this.nodes.set(n.id, n);
    return n;
  }

  /** Snap to a node, else split a segment, else make a node. */
  private anchor(x: number, z: number): Node {
    const hit = this.nodeAt(x, z);
    if (hit) return hit;
    const cut = this.splitAt(x, z);
    if (cut) return this.split(cut.seg, cut.x, cut.z);
    return this.addNode(x, z);
  }

  private split(s: Segment, x: number, z: number): Node {
    const mid = this.addNode(x, z);
    const b = s.b;
    this.unlink(s);
    this.segments.delete(s.id);
    this.link({ id: this.nextSeg++, a: s.a, b: mid.id, half: s.half, kind: s.kind });
    this.link({ id: this.nextSeg++, a: mid.id, b, half: s.half, kind: s.kind });
    return mid;
  }

  private link(s: Segment) {
    this.segments.set(s.id, s);
    this.nodes.get(s.a)?.links.push(s.id);
    this.nodes.get(s.b)?.links.push(s.id);
  }

  private unlink(s: Segment) {
    for (const id of [s.a, s.b]) {
      const n = this.nodes.get(id);
      if (n) n.links = n.links.filter((l) => l !== s.id);
    }
  }

  /**
   * Lay one road, splitting anything it crosses.
   *
   * Returns false when it was refused, so the tool can say why rather than
   * quietly doing nothing — a builder that ignores half your drags without
   * comment is a builder people stop trusting after four minutes.
   */
  lay(ax: number, az: number, bx: number, bz: number, kind: Segment['kind'] = 'street'): boolean {
    if (Math.hypot(bx - ax, bz - az) < MIN_LEN) return false;
    const half = kind === 'avenue' ? 11 : 7;

    const a = this.anchor(ax, az);
    const b = this.anchor(bx, bz);
    if (a.id === b.id) return false;
    if (a.links.some((l) => {
      const s = this.segments.get(l);
      return s && (s.a === b.id || s.b === b.id);
    })) return false;

    // Every crossing becomes a node, in order along the new road, so the graph
    // stays planar and the faces stay findable.
    const cuts: { t: number; x: number; z: number; seg: Segment }[] = [];
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    for (const s of [...this.segments.values()]) {
      if (s.a === a.id || s.b === a.id || s.a === b.id || s.b === b.id) continue;
      const p = this.nodes.get(s.a);
      const q = this.nodes.get(s.b);
      if (!p || !q) continue;
      const hit = cross(a.x, a.z, b.x, b.z, p.x, p.z, q.x, q.z);
      if (hit) cuts.push({ ...hit, seg: s });
    }
    cuts.sort((m, n) => m.t - n.t);

    let from = a;
    for (const c of cuts) {
      if (!this.segments.has(c.seg.id)) continue;
      const mid = this.split(c.seg, c.x, c.z);
      if (mid.id !== from.id) this.link({ id: this.nextSeg++, a: from.id, b: mid.id, half, kind });
      from = mid;
    }
    if (from.id !== b.id) this.link({ id: this.nextSeg++, a: from.id, b: b.id, half, kind });

    this.version++;
    void dx;
    void dz;
    return true;
  }

  remove(segId: number) {
    const s = this.segments.get(segId);
    if (!s) return;
    this.unlink(s);
    this.segments.delete(segId);
    for (const id of [s.a, s.b]) {
      const n = this.nodes.get(id);
      if (n && !n.links.length) this.nodes.delete(id);
    }
    this.version++;
  }

  /** Bearing of a segment leaving a node. Face traversal is built on this. */
  bearing(nodeId: number, segId: number): number {
    const s = this.segments.get(segId);
    const n = this.nodes.get(nodeId);
    if (!s || !n) return 0;
    const o = this.nodes.get(s.a === nodeId ? s.b : s.a);
    if (!o) return 0;
    return Math.atan2(o.z - n.z, o.x - n.x);
  }

  /** Ground height along a road, sampled so it sits on the terrain. */
  heightAt(x: number, z: number) {
    return this.terrain.height(x, z) + 0.18;
  }
}

function cross(
  ax: number, az: number, bx: number, bz: number,
  cx: number, cz: number, dx: number, dz: number,
): { t: number; x: number; z: number } | null {
  const r1 = bx - ax;
  const r2 = bz - az;
  const s1 = dx - cx;
  const s2 = dz - cz;
  const den = r1 * s2 - r2 * s1;
  if (Math.abs(den) < 1e-9) return null;
  const t = ((cx - ax) * s2 - (cz - az) * s1) / den;
  const u = ((cx - ax) * r2 - (cz - az) * r1) / den;
  if (t <= 0.02 || t >= 0.98 || u <= 0.06 || u >= 0.94) return null;
  return { t, x: ax + r1 * t, z: az + r2 * t };
}
