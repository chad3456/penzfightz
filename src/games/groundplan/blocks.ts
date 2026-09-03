import type { Roads } from './roads';

/**
 * Blocks and lots.
 *
 * A city block is a **face of the road graph** — the region enclosed by roads
 * with no road crossing it — and once you have the faces, everything a builder
 * needs falls out: a lot is a slice of a face, a building stands on a lot and
 * faces the edge the slice was cut from, and land value is a property of the
 * face rather than of a grid square.
 *
 * ### Finding the faces
 *
 * The standard planar-graph traversal, and it is worth stating because it is
 * short and every part of it is load-bearing. Walk every directed half-edge
 * once. At each node you arrive at, take the **next edge clockwise** from the
 * one you came in on. Keep going until you are back where you started. That
 * walk always traces one face, and doing it for every half-edge traces every
 * face exactly once.
 *
 * One of the faces it finds is the outside of the whole city, traced the wrong
 * way round. It is thrown away by its signed area, which comes out negative
 * where every real block comes out positive.
 *
 * ### Cutting the lots
 *
 * Inset the block by the pavement width, then walk its boundary and cut lots of
 * a fixed depth and a roughly fixed width along each edge. Buildings therefore
 * face the road automatically, which is the property that makes a generated
 * city read as a city instead of as a heap: real buildings address a street,
 * and a building placed by a grid does not.
 */

export interface Lot {
  id: number;
  /** Centre, in world units. */
  x: number;
  z: number;
  /** Along the frontage, and back from it. */
  width: number;
  depth: number;
  /** Bearing of the outward normal — the way the front door points. */
  facing: number;
  /** Which block it belongs to. */
  block: number;
  /** Distance from the block's road frontage to the middle of the city. */
  central: number;
}

export interface Block {
  id: number;
  ring: { x: number; z: number }[];
  area: number;
  lots: Lot[];
}

const PAVEMENT = 4.5;
const DEPTH = 26;
const WIDTH = 21;

export function findBlocks(roads: Roads): Block[] {
  // Half-edges, keyed "seg:from".
  const seen = new Set<string>();
  const out: Block[] = [];
  let id = 1;

  // Links sorted by bearing once, so "next clockwise" is an index step.
  const order = new Map<number, number[]>();
  for (const n of roads.nodes.values()) {
    order.set(
      n.id,
      [...n.links].sort((a, b) => roads.bearing(n.id, a) - roads.bearing(n.id, b)),
    );
  }

  for (const s of roads.segments.values()) {
    for (const from of [s.a, s.b]) {
      const key = `${s.id}:${from}`;
      if (seen.has(key)) continue;

      const ring: { x: number; z: number }[] = [];
      let seg = s;
      let at = from;
      let guard = 0;
      let ok = true;

      while (guard++ < 4096) {
        seen.add(`${seg.id}:${at}`);
        const node = roads.nodes.get(at);
        if (!node) { ok = false; break; }
        ring.push({ x: node.x, z: node.z });

        const to = seg.a === at ? seg.b : seg.a;
        const links = order.get(to);
        if (!links || !links.length) { ok = false; break; }
        // Arrive at `to`; the edge we came along, seen from there, is the
        // reference. One step *backwards* through the bearing-sorted list is
        // the next edge clockwise, which is the turn that traces a face.
        const i = links.indexOf(seg.id);
        if (i < 0) { ok = false; break; }
        const next = links[(i - 1 + links.length) % links.length];
        const ns = roads.segments.get(next);
        if (!ns) { ok = false; break; }
        if (next === s.id && to === from) break;
        seg = ns;
        at = to;
      }

      if (!ok || ring.length < 3) continue;
      const a = signedArea(ring);
      // Interior faces come out positive under the next-clockwise rule; the
      // outer boundary of each connected component is the same walk taken the
      // other way round, and comes out negative. Worked through on a triangle
      // rather than guessed, because both signs look plausible on paper and
      // only one of them builds a city instead of a ring around it.
      if (a <= 0 || a < 900) continue;
      out.push({ id: id++, ring, area: a, lots: [] });
    }
  }
  return out;
}

export function cutLots(block: Block, roads: Roads, nextId: () => number): Lot[] {
  // The face traversal can hand back either winding depending on which
  // half-edge it happened to start from, and "inwards" is the opposite
  // direction in each. Take the sign from the ring itself rather than
  // assuming one, because getting it wrong does not fail loudly: it offsets
  // every lot outwards into the road and the city looks merely *wrong*.
  const s = Math.sign(signedArea(block.ring)) || 1;
  const ring = inset(block.ring, PAVEMENT, s);
  if (ring.length < 3) return [];
  const lots: Lot[] = [];
  const n = ring.length;

  for (let i = 0; i < n; i++) {
    const a = ring[i];
    const b = ring[(i + 1) % n];
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const len = Math.hypot(dx, dz);
    if (len < WIDTH * 0.8) continue;

    // Inward normal, and the front door looks the other way.
    const nx = (-dz / len) * s;
    const nz = (dx / len) * s;
    const facing = Math.atan2(-nz, -nx);

    const count = Math.max(1, Math.round(len / WIDTH));
    const w = len / count;
    for (let k = 0; k < count; k++) {
      const t = (k + 0.5) / count;
      const px = a.x + dx * t + nx * (DEPTH / 2);
      const pz = a.z + dz * t + nz * (DEPTH / 2);
      if (!roads.terrain.buildable(px, pz)) continue;
      // Corner plots are shallower, which is what stops a small block from
      // producing lots that overlap in its middle.
      const depth = Math.min(DEPTH, Math.sqrt(block.area) * 0.42);
      lots.push({
        id: nextId(),
        x: px,
        z: pz,
        width: w,
        depth,
        facing,
        block: block.id,
        central: Math.hypot(px + 40, pz - 40),
      });
    }
  }
  return lots;
}

function signedArea(ring: { x: number; z: number }[]): number {
  let s = 0;
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i];
    const b = ring[(i + 1) % ring.length];
    s += a.x * b.z - b.x * a.z;
  }
  return s / 2;
}

/**
 * Push every edge inwards by `d` and re-intersect.
 *
 * Not a general polygon offset — it does not handle the self-intersections a
 * deep inset produces on a thin block. It does not have to: the caller throws
 * away any lot whose centre is not buildable, and a block too thin to hold a
 * lot produces none.
 */
function inset(ring: { x: number; z: number }[], d: number, sign: number): { x: number; z: number }[] {
  const n = ring.length;
  const out: { x: number; z: number }[] = [];
  for (let i = 0; i < n; i++) {
    const p = ring[(i - 1 + n) % n];
    const c = ring[i];
    const q = ring[(i + 1) % n];
    const n1 = normal(p, c, d * sign);
    const n2 = normal(c, q, d * sign);
    const bx = n1.x + n2.x;
    const bz = n1.z + n2.z;
    const l = Math.hypot(bx, bz);
    if (l < 1e-4) {
      out.push({ x: c.x + n1.x, z: c.z + n1.z });
      continue;
    }
    // Lengthen along the bisector by 1/cos(half-angle), so the inset corner
    // lands where the two offset edges actually meet.
    const cosHalf = Math.max(0.25, l / 2 / Math.abs(d));
    out.push({ x: c.x + (bx / l) * (d / cosHalf), z: c.z + (bz / l) * (d / cosHalf) });
  }
  return out;
}

function normal(a: { x: number; z: number }, b: { x: number; z: number }, d: number) {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const l = Math.hypot(dx, dz) || 1;
  return { x: (-dz / l) * d, z: (dx / l) * d };
}
