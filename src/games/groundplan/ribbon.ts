import * as THREE from 'three';
import type { Roads } from './roads';
import type { Terrain } from './terrain';

/**
 * The roads, as geometry.
 *
 * A road network drawn as a quad per segment looks like a road network drawn
 * as a quad per segment: the junctions are a pile of overlapping rectangles
 * fighting for the same depth, and the eye reads the fight before it reads the
 * city. Two decisions fix that.
 *
 * **Segments stop short of their nodes and a junction fills the gap.** Every
 * incident road is trimmed back by the same distance, and the junction is the
 * convex hull of the trimmed corners. For four equal roads meeting at right
 * angles that hull is exactly the square you would draw by hand, corners
 * included — which a disc of the same radius would have missed.
 *
 * **The cross-section is real.** Kerbs are 17 cm of vertical face, not a
 * painted line, so a low sun puts a shadow along every street and the pavement
 * reads as a separate surface at a separate height. It costs two extra
 * triangles per span and it is most of the reason the ground looks built.
 *
 * Everything painted on the surface — lane markings, crossings, paving joints,
 * the pools of light under the lamps at night — is done in the fragment shader
 * from a coordinate in metres along and across the road. In metres, because a
 * dashed line normalised to the length of its segment gets longer on longer
 * roads, and nothing says "generated" quite so loudly.
 */

const PAVE = 4.2;
const KERB = 0.17;
const LIFT = 0.13;
const STEP = 9;
/** Lamp spacing in metres, shared by the posts and the light pools. */
export const LAMP = 26;

type Sink = {
  pos: number[];
  road: number[];
  meta: number[];
};

export class RoadMesh {
  readonly group = new THREE.Group();
  readonly material: THREE.MeshStandardMaterial;
  readonly lampMaterial: THREE.MeshStandardMaterial;
  private uniforms = {
    uNight: { value: 0 },
    uTime: { value: 0 },
    uWet: { value: 0.18 },
  };
  private mesh: THREE.Mesh | null = null;
  private lamps: THREE.InstancedMesh | null = null;

  constructor(private terrain: Terrain) {
    this.material = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.82, metalness: 0.02 });
    this.material.onBeforeCompile = (s) => {
      Object.assign(s.uniforms, this.uniforms);
      s.vertexShader = s.vertexShader
        .replace('#include <common>', `#include <common>
attribute vec3 aRoad;
attribute vec3 aMeta;
varying vec3 vRoad;
varying vec3 vMeta;`)
        .replace('#include <begin_vertex>', `#include <begin_vertex>
vRoad = aRoad;
vMeta = aMeta;`);

      s.fragmentShader = s.fragmentShader
        .replace('#include <common>', `#include <common>
uniform float uNight;
uniform float uTime;
uniform float uWet;
varying vec3 vRoad;
varying vec3 vMeta;

/** Lamplight on the road, handed forward to the emissive chunk — see the same
 * trick, and the same reason, in the buildings. */
vec3 gGlow;

float h21(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}
float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x),
             mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y);
}
/** A line of half-width w metres centred on x, antialiased by the derivative. */
float band(float x, float w) {
  float d = abs(x) - w;
  return 1.0 - smoothstep(0.0, fwidth(x) + 0.02, d);
}`)
        .replace('#include <color_fragment>', `#include <color_fragment>
{
  float u = vRoad.x;
  float v = vRoad.y;
  float hw = max(vRoad.z, 0.001);
  float len = vMeta.x;
  float avenue = vMeta.y;
  float part = vMeta.z;

  float grit = vnoise(vec2(u, v) * 1.7) * 0.5 + vnoise(vec2(u, v) * 7.0) * 0.28;
  vec3 col;
  gGlow = vec3(0.0);

  if (part > 1.5) {
    // Pavement. Slabs every 1.15 m, a darker course against the kerb, and the
    // grain of a poured surface rather than a flat swatch.
    vec3 slab = mix(vec3(0.60, 0.596, 0.578), vec3(0.66, 0.652, 0.632), grit);
    float joint = max(band(fract(u / 1.15) - 0.5, 0.02), band(fract((abs(v) - hw) / 1.15) - 0.5, 0.02));
    col = slab * (1.0 - joint * 0.22);
    col *= 1.0 - smoothstep(1.4, 0.0, abs(v) - hw) * 0.10;
  } else if (part > 0.5) {
    // The kerb face: paler than the pavement above it, and dirtier at its foot.
    col = mix(vec3(0.52, 0.515, 0.5), vec3(0.72, 0.715, 0.70), grit);
  } else {
    // Asphalt. Wheel tracks polish two strips per lane, which is the single
    // cheapest cue that a road has been used.
    float lanes = avenue > 0.5 ? 4.0 : 2.0;
    float laneW = hw * 2.0 / lanes;
    float inLane = abs(fract(v / laneW + 0.5) - 0.5) * laneW;
    float track = smoothstep(0.9, 0.25, abs(inLane - laneW * 0.30));
    col = mix(vec3(0.113, 0.116, 0.126), vec3(0.168, 0.170, 0.180), grit);
    col = mix(col, col * 1.22, track * 0.55);
    // A seam down the middle of each lane pair, and tar patches.
    col *= 1.0 - band(inLane - laneW * 0.5, 0.05) * 0.25;
    col *= 1.0 - smoothstep(0.55, 0.85, vnoise(vec2(u, v) * 0.09)) * 0.18;

    if (part < -0.5) {
      // Junction: no lane lines, but the box gets scuffed more than the road.
      col *= 0.97 + grit * 0.05;
    } else {
      float paint = 0.0;
      float edge = band(abs(v) - (hw - 0.7), 0.09);
      paint = max(paint, edge);
      if (avenue > 0.5) {
        // Двойная: two solid lines and the strip of tarmac between them.
        paint = max(paint, band(abs(v) - 0.42, 0.09));
      } else {
        float dash = step(0.42, fract(u / 9.0));
        paint = max(paint, band(v, 0.09) * dash);
      }
      // Crossings, three metres in from each end.
      float endD = min(u, len - u);
      float zebra = step(1.6, endD) * step(endD, 4.4) * step(0.5, fract((v + hw) / 1.1));
      paint = max(paint, zebra * step(abs(v), hw - 0.35));
      vec3 white = vec3(0.80, 0.79, 0.74) * (0.75 + grit * 0.5);
      col = mix(col, white, paint * 0.92);
    }

    // Night: a pool of lamplight every LAMP metres, on both shoulders.
    float lamp = 26.0;
    float su = abs(fract(u / lamp) - 0.5) * lamp;
    float across = abs(v) - hw * 0.62;
    float pool = exp(-su * su * 0.05) * exp(-across * across * 0.055);
    gGlow = vec3(1.0, 0.80, 0.52) * pool * uNight * 0.16;
    // Wet sheen after dark, which is mostly what sells a night city.
    col *= 1.0 - uNight * uWet * 0.35;
  }

  diffuseColor.rgb *= col;
}`)
        .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
roughnessFactor = vMeta.z > 0.5 ? 0.94 : mix(0.74, 0.42, uNight * uWet);`)
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
totalEmissiveRadiance += gGlow;`);
    };

    this.lampMaterial = new THREE.MeshStandardMaterial({ color: 0x2f3439, roughness: 0.6, metalness: 0.35 });
    this.lampMaterial.onBeforeCompile = (s) => {
      Object.assign(s.uniforms, this.uniforms);
      s.vertexShader = s.vertexShader
        .replace('#include <common>', '#include <common>\nattribute float aGlow;\nvarying float vGlow;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvGlow = aGlow;');
      s.fragmentShader = s.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform float uNight;\nvarying float vGlow;')
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
totalEmissiveRadiance += vec3(1.0, 0.78, 0.46) * vGlow * uNight * 3.4;`);
    };
  }

  setNight(n: number, t: number) {
    this.uniforms.uNight.value = n;
    this.uniforms.uTime.value = t;
  }

  // ------------------------------------------------------------------ build

  build(roads: Roads) {
    this.clear();
    const out: Sink = { pos: [], road: [], meta: [] };
    const lamps: { x: number; z: number; rot: number }[] = [];

    // How far back each node pulls its roads. One distance per node, shared by
    // every incident segment, so the junction hull closes.
    const trim = new Map<number, number>();
    for (const n of roads.nodes.values()) {
      let h = 0;
      for (const id of n.links) h = Math.max(h, roads.segments.get(id)?.half ?? 0);
      // Where do the outer edges of two roads meeting at angle t actually
      // cross? At h / tan(t/2) from the node. Four roads at right angles give
      // exactly h, which is the intersection square you would draw by hand;
      // a narrow fork gives a long taper, so it is capped before it runs away.
      let far = h;
      const bs = n.links.map((id) => roads.bearing(n.id, id)).sort((a, b) => a - b);
      for (let i = 0; i < bs.length && bs.length > 1; i++) {
        const d = Math.abs(bs[(i + 1) % bs.length] - bs[i]);
        const a = Math.min(d, Math.PI * 2 - d);
        far = Math.max(far, h / Math.max(0.42, Math.tan(a / 2)));
      }
      trim.set(n.id, n.links.length > 1 ? Math.min(far, h * 2.4) : 0);
    }

    for (const s of roads.segments.values()) {
      const a = roads.nodes.get(s.a);
      const b = roads.nodes.get(s.b);
      if (!a || !b) continue;
      const dx = b.x - a.x;
      const dz = b.z - a.z;
      const full = Math.hypot(dx, dz);
      const ux = dx / full;
      const uz = dz / full;
      const t0 = Math.min(trim.get(a.id) ?? 0, full * 0.42);
      const t1 = Math.min(trim.get(b.id) ?? 0, full * 0.42);
      const len = full - t0 - t1;
      if (len < 3) continue;
      const x0 = a.x + ux * t0;
      const z0 = a.z + uz * t0;
      this.ribbon(out, x0, z0, ux, uz, len, s.half, s.kind === 'avenue' ? 1 : 0);

      for (let d = LAMP * 0.5, k = 0; d < len; d += LAMP, k++) {
        const side = k % 2 === 0 ? 1 : -1;
        const off = s.half + 1.4;
        lamps.push({
          x: x0 + ux * d - uz * off * side,
          z: z0 + uz * d + ux * off * side,
          rot: Math.atan2(uz, ux) + (side > 0 ? Math.PI / 2 : -Math.PI / 2),
        });
      }
    }

    for (const n of roads.nodes.values()) {
      if (n.links.length < 2) continue;
      const t = trim.get(n.id) ?? 0;
      const pts: [number, number][] = [];
      for (const id of n.links) {
        const s = roads.segments.get(id);
        const o = s && roads.nodes.get(s.a === n.id ? s.b : s.a);
        if (!s || !o) continue;
        const l = Math.hypot(o.x - n.x, o.z - n.z) || 1;
        const ux = (o.x - n.x) / l;
        const uz = (o.z - n.z) / l;
        pts.push([n.x + ux * t - uz * s.half, n.z + uz * t + ux * s.half]);
        pts.push([n.x + ux * t + uz * s.half, n.z + uz * t - ux * s.half]);
      }
      const hull = convex(pts);
      if (hull.length >= 3) this.fan(out, n.x, n.z, hull);
    }

    if (!out.pos.length) return;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(out.pos, 3));
    geo.setAttribute('aRoad', new THREE.Float32BufferAttribute(out.road, 3));
    geo.setAttribute('aMeta', new THREE.Float32BufferAttribute(out.meta, 3));
    geo.computeVertexNormals();
    geo.computeBoundingSphere();
    this.mesh = new THREE.Mesh(geo, this.material);
    this.mesh.receiveShadow = true;
    this.mesh.renderOrder = 1;
    this.group.add(this.mesh);

    if (lamps.length) this.buildLamps(lamps);
  }

  /** One straight run: six points across, a step every STEP metres along. */
  private ribbon(out: Sink, x0: number, z0: number, ux: number, uz: number, len: number, half: number, avenue: number) {
    const px = -uz;
    const pz = ux;
    const cross: [number, number, number][] = [
      [-(half + PAVE), KERB, 2],
      [-(half + 0.02), KERB, 1],
      [-half, 0, 0],
      [half, 0, 0],
      [half + 0.02, KERB, 1],
      [half + PAVE, KERB, 2],
    ];
    const steps = Math.max(1, Math.round(len / STEP));
    const at = (u: number, k: number) => {
      const [v, dy] = cross[k];
      const x = x0 + ux * u + px * v;
      const z = z0 + uz * u + pz * v;
      return { x, y: this.terrain.height(x, z) + LIFT + dy, z, v };
    };
    for (let i = 0; i < steps; i++) {
      const ua = (i / steps) * len;
      const ub = ((i + 1) / steps) * len;
      for (let k = 0; k < cross.length - 1; k++) {
        const part = Math.max(cross[k][2], cross[k + 1][2]);
        const q = [at(ua, k), at(ub, k), at(ub, k + 1), at(ua, k + 1)];
        const us = [ua, ub, ub, ua];
        // Reversed on purpose. Walking along the road and then across it winds
        // clockwise seen from above, which faces every surface at the ground.
        const tri = [0, 2, 1, 0, 3, 2];
        for (const t of tri) {
          const p = q[t];
          out.pos.push(p.x, p.y, p.z);
          out.road.push(us[t], p.v, half);
          out.meta.push(len, avenue, part);
        }
      }
    }
  }

  /** A junction, as a triangle fan over its hull. */
  private fan(out: Sink, cx: number, cz: number, hull: [number, number][]) {
    const h = (x: number, z: number) => this.terrain.height(x, z) + LIFT;
    // Same reversal as the ribbon: the hull comes back counter-clockwise in
    // x/z, which is clockwise looking down, so the fan is wound backwards.
    for (let i = 1; i < hull.length - 1; i++) {
      const tri: [number, number][] = [hull[0], hull[i + 1], hull[i]];
      for (const [x, z] of tri) {
        out.pos.push(x, h(x, z), z);
        out.road.push(Math.hypot(x - cx, z - cz), 0, 1);
        out.meta.push(1, 0, -1);
      }
    }
  }

  private buildLamps(list: { x: number; z: number; rot: number }[]) {
    const parts: THREE.BufferGeometry[] = [];
    const post = new THREE.CylinderGeometry(0.11, 0.15, 5.6, 6);
    post.translate(0, 2.8, 0);
    const arm = new THREE.BoxGeometry(1.5, 0.12, 0.12);
    arm.translate(0.72, 5.5, 0);
    const head = new THREE.BoxGeometry(0.78, 0.2, 0.34);
    head.translate(1.3, 5.36, 0);
    parts.push(post, arm, head);
    const glow = [0, 0, 1];
    const merged = mergeWithFlag(parts, glow);
    const inst = new THREE.InstancedMesh(merged, this.lampMaterial, list.length);
    const o = new THREE.Object3D();
    list.forEach((l, i) => {
      o.position.set(l.x, this.terrain.height(l.x, l.z), l.z);
      o.rotation.set(0, l.rot, 0);
      o.updateMatrix();
      inst.setMatrixAt(i, o.matrix);
    });
    inst.castShadow = true;
    inst.instanceMatrix.needsUpdate = true;
    this.lamps = inst;
    this.group.add(inst);
  }

  clear() {
    if (this.mesh) {
      this.mesh.geometry.dispose();
      this.group.remove(this.mesh);
      this.mesh = null;
    }
    if (this.lamps) {
      this.lamps.geometry.dispose();
      this.group.remove(this.lamps);
      this.lamps = null;
    }
  }
}

/** Merge a few geometries and tag each with a per-vertex flag. */
function mergeWithFlag(list: THREE.BufferGeometry[], flags: number[]): THREE.BufferGeometry {
  const pos: number[] = [];
  const nrm: number[] = [];
  const flag: number[] = [];
  const idx: number[] = [];
  list.forEach((g, gi) => {
    const p = g.getAttribute('position');
    const n = g.getAttribute('normal');
    const base = pos.length / 3;
    for (let i = 0; i < p.count; i++) {
      pos.push(p.getX(i), p.getY(i), p.getZ(i));
      nrm.push(n.getX(i), n.getY(i), n.getZ(i));
      flag.push(flags[gi]);
    }
    const gid = g.getIndex();
    if (gid) for (let i = 0; i < gid.count; i++) idx.push(base + gid.getX(i));
    else for (let i = 0; i < p.count; i++) idx.push(base + i);
    g.dispose();
  });
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
  out.setAttribute('aGlow', new THREE.Float32BufferAttribute(flag, 1));
  out.setIndex(idx);
  return out;
}

/** Andrew's monotone chain. Counter-clockwise, no collinear points. */
function convex(pts: [number, number][]): [number, number][] {
  if (pts.length < 3) return [];
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cr = (o: [number, number], a: [number, number], b: [number, number]) =>
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: [number, number][] = [];
  for (const q of p) {
    while (lower.length >= 2 && cr(lower[lower.length - 2], lower[lower.length - 1], q) <= 0) lower.pop();
    lower.push(q);
  }
  const upper: [number, number][] = [];
  for (let i = p.length - 1; i >= 0; i--) {
    const q = p[i];
    while (upper.length >= 2 && cr(upper[upper.length - 2], upper[upper.length - 1], q) <= 0) upper.pop();
    upper.push(q);
  }
  lower.pop();
  upper.pop();
  return lower.concat(upper);
}
