import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

/**
 * A parts kit for building vehicles out of geometry rather than out of boxes.
 *
 * The problem with a procedural vehicle is not that a box is the wrong shape —
 * it is that a box has no silhouette. An auto rickshaw is recognisable from two
 * hundred metres away at a glance, and everything that makes it recognisable is
 * in its *profile*: the nose that drops to the single front wheel, the peak over
 * the windscreen, the long curve of the hood falling to a vertical back. So the
 * bodies here are two-dimensional profiles extruded across the vehicle with a
 * bevel, which is how you draw that silhouette once and get a solid.
 *
 * Everything a vehicle is made of goes into one merged, indexed geometry with a
 * per-vertex **role**, and one material resolves roles to colours in the shader.
 * That way a hundred rickshaws are one draw call, each with its own body colour
 * and its own canopy colour, and the glass is still glass.
 */

export const ROLE = {
  body: 0,
  /** Second per-instance colour: the canopy, the roof, the tarpaulin. */
  canopy: 1,
  trim: 2,
  glass: 3,
  tyre: 4,
  chrome: 5,
  lampFront: 6,
  lampRear: 7,
  seat: 8,
  amber: 9,
} as const;

/**
 * A role is just a number.
 *
 * The table above is the *vehicle* kit's palette; the city next door has its
 * own with roads and kerbs and awnings in it, and both go through this same
 * builder. Widening the type is what lets a second kit share the plumbing
 * without pretending its awnings are a kind of windscreen.
 */
export type Role = number;

export interface Parts {
  pos: number[];
  nrm: number[];
  role: number[];
  idx: number[];
}

export function parts(): Parts {
  return { pos: [], nrm: [], role: [], idx: [] };
}

/** Add one geometry to the pile, tagged with a role, then throw it away. */
export function add(out: Parts, g: THREE.BufferGeometry, role: Role) {
  const p = g.getAttribute('position');
  const n = g.getAttribute('normal');
  const base = out.pos.length / 3;
  for (let i = 0; i < p.count; i++) {
    out.pos.push(p.getX(i), p.getY(i), p.getZ(i));
    out.nrm.push(n ? n.getX(i) : 0, n ? n.getY(i) : 1, n ? n.getZ(i) : 0);
    out.role.push(role);
  }
  const gi = g.getIndex();
  if (gi) for (let i = 0; i < gi.count; i++) out.idx.push(base + gi.getX(i));
  else for (let i = 0; i < p.count; i++) out.idx.push(base + i);
  g.dispose();
}

export function finish(out: Parts): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(out.pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(out.nrm, 3));
  geo.setAttribute('aRole', new THREE.Float32BufferAttribute(out.role, 1));
  geo.setIndex(out.idx);
  geo.computeBoundingSphere();
  return geo;
}

// ------------------------------------------------------------------- shapes

/**
 * A body from a side profile.
 *
 * The profile is drawn in the vehicle's own x (along) / y (up) plane and then
 * extruded across its width, so `[0, 0]` is the middle of the back axle at
 * ground level and the shape you type is the shape you see from the kerb.
 */
export function profile(pts: [number, number][], width: number, bevel = 0.06): THREE.BufferGeometry {
  const s = new THREE.Shape();
  s.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1]);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, {
    depth: width - bevel * 2,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 2,
    curveSegments: 8,
  });
  // Extrude builds along +z from the profile plane, so the profile's x already
  // runs along the vehicle and its y is already up. It only needs centring.
  g.translate(0, 0, -(width - bevel * 2) / 2);
  g.computeVertexNormals();
  return g;
}

/** The same, but with the corners rounded off before extruding. */
export function smoothProfile(pts: [number, number][], width: number, radius = 0.18, bevel = 0.05) {
  return profile(round(pts, radius), width, bevel);
}

/** Chamfer every corner of a closed polyline into a small arc. */
export function round(pts: [number, number][], r: number): [number, number][] {
  const n = pts.length;
  const out: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = pts[(i - 1 + n) % n];
    const b = pts[i];
    const c = pts[(i + 1) % n];
    const v1 = norm(a[0] - b[0], a[1] - b[1]);
    const v2 = norm(c[0] - b[0], c[1] - b[1]);
    const d1 = Math.min(r, Math.hypot(a[0] - b[0], a[1] - b[1]) * 0.45);
    const d2 = Math.min(r, Math.hypot(c[0] - b[0], c[1] - b[1]) * 0.45);
    const p1: [number, number] = [b[0] + v1[0] * d1, b[1] + v1[1] * d1];
    const p2: [number, number] = [b[0] + v2[0] * d2, b[1] + v2[1] * d2];
    out.push(p1);
    for (let k = 1; k < 4; k++) {
      const t = k / 4;
      // Quadratic through the corner: cheap, and indistinguishable from an arc
      // at the size a corner actually is.
      const x = (1 - t) * (1 - t) * p1[0] + 2 * (1 - t) * t * b[0] + t * t * p2[0];
      const y = (1 - t) * (1 - t) * p1[1] + 2 * (1 - t) * t * b[1] + t * t * p2[1];
      out.push([x, y]);
    }
    out.push(p2);
  }
  return out;
}

function norm(x: number, y: number): [number, number] {
  const l = Math.hypot(x, y) || 1;
  return [x / l, y / l];
}

/**
 * A shell: a curve given a thickness.
 *
 * A canopy, a roof, a mudguard — anything whose section is a band rather than a
 * solid. Writing the band as one closed contour by hand looks fine on paper and
 * triangulates as a filled blob the moment the corner rounding pushes an inner
 * point past an outer one. Offsetting the curve by its own normal cannot do
 * that, because the two sides never meet.
 */
export function shell(curve: [number, number][], thickness: number, width: number, bevel = 0.03) {
  const inner: [number, number][] = [];
  for (let i = 0; i < curve.length; i++) {
    const a = curve[Math.max(0, i - 1)];
    const b = curve[Math.min(curve.length - 1, i + 1)];
    const [nx, ny] = norm(-(b[1] - a[1]), b[0] - a[0]);
    inner.push([curve[i][0] + nx * thickness, curve[i][1] + ny * thickness]);
  }
  return profile([...curve, ...inner.reverse()], width, bevel);
}

export function box(w: number, h: number, d: number, r = 0.04): THREE.BufferGeometry {
  return new RoundedBoxGeometry(w, h, d, 2, Math.min(r, Math.min(w, h, d) * 0.49));
}

/** A wheel: tyre, sidewall and a hub, lying in the x/y plane facing across z. */
export function wheel(radius: number, width: number, out: Parts, x: number, y: number, z: number, spin = 0) {
  const t = new THREE.CylinderGeometry(radius, radius, width, 16, 1);
  t.rotateZ(Math.PI / 2);
  t.rotateX(spin);
  t.translate(x, y, z);
  add(out, t, ROLE.tyre);
  const hub = new THREE.CylinderGeometry(radius * 0.46, radius * 0.46, width * 1.06, 12, 1);
  hub.rotateZ(Math.PI / 2);
  hub.translate(x, y, z);
  add(out, hub, ROLE.chrome);
}

/** A tube through a list of points — frames, roll bars, skids, handlebars. */
export function tube(points: [number, number, number][], r: number, seg = 20): THREE.BufferGeometry {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(p[0], p[1], p[2])));
  return new THREE.TubeGeometry(curve, seg, r, 7, false);
}

/** A solid of revolution from a half-section: tanks, domes, fuselages. */
export function lathe(section: [number, number][], seg = 18): THREE.BufferGeometry {
  return new THREE.LatheGeometry(section.map((p) => new THREE.Vector2(p[0], p[1])), seg);
}

/** Mirror a geometry across the vehicle's centre line and keep both. */
export function pair(out: Parts, g: THREE.BufferGeometry, role: Role, z: number) {
  const a = g.clone();
  a.translate(0, 0, z);
  add(out, a, role);
  const b = g.clone();
  b.scale(1, 1, -1);
  b.translate(0, 0, -z);
  // A negative scale turns every triangle inside out, so the winding has to be
  // put back or the mirrored half is invisible from the side you look at it.
  flip(b);
  add(out, b, role);
  g.dispose();
}

/** Reverse triangle winding, for a geometry that has been mirrored. */
export function flip(g: THREE.BufferGeometry) {
  const i = g.getIndex();
  if (i) {
    for (let k = 0; k < i.count; k += 3) {
      const t = i.getX(k + 1);
      i.setX(k + 1, i.getX(k + 2));
      i.setX(k + 2, t);
    }
    i.needsUpdate = true;
  }
  const n = g.getAttribute('normal');
  if (n) {
    for (let k = 0; k < n.count; k++) n.setXYZ(k, -n.getX(k), -n.getY(k), -n.getZ(k));
    n.needsUpdate = true;
  }
}
