import * as THREE from 'three';
import { clamp, fbm, mix, permutation, ridge, smoothstep } from './noise';

/**
 * The ground.
 *
 * One height field, generated once, and then used by everything: the mesh that
 * is drawn, the query the road tool uses to know where the cursor is, the depth
 * the water shader reads to decide how blue it is, and the slope test that
 * refuses to let a block be zoned on a cliff. Every one of those has to agree,
 * which is why the field is a plain `Float32Array` in JavaScript and the shader
 * reads it back out of a texture rather than recomputing it.
 *
 * ### The shape
 *
 * A drowned river valley with a peninsula in it — the shape San Francisco Bay
 * and Sydney Harbour and Halifax all have — because a coastline is the single
 * cheapest way to make a generated landscape look like somewhere. A city on a
 * plain has no reason to be anywhere; a city on a headland is explained.
 *
 * Four layers, and each does one job:
 *
 * - **fbm** for the large shape, so no two ridges are the same length.
 * - **a domain-warped half-plane** for the coast, so the shoreline wanders
 *   instead of running straight, and bays and spits fall out of the warp
 *   rather than being placed.
 * - **ridged noise** for the hills at the back, because `(1-|n|)²` creases
 *   where the field crosses zero and a range of creases reads as erosion,
 *   where plain fbm reads as a duvet.
 * - **a flattened shelf** in the middle, because a builder that hands you a
 *   site you cannot build on is a landscape generator wearing a game's hat.
 */

export const WORLD = 2400;
/** Samples across the field. The mesh uses the same grid. */
export const RES = 256;
export const STEP = WORLD / RES;
export const SEA = 0;

export class Terrain {
  readonly field: Float32Array;
  readonly texture: THREE.DataTexture;
  readonly mesh: THREE.Mesh;
  readonly seed: number;

  constructor(seed: number) {
    this.seed = seed;
    const p = permutation(seed);
    const q = permutation(seed ^ 0x5bf03635);
    const n = RES + 1;
    this.field = new Float32Array(n * n);

    for (let j = 0; j <= RES; j++) {
      for (let i = 0; i <= RES; i++) {
        const x = -WORLD / 2 + i * STEP;
        const z = -WORLD / 2 + j * STEP;
        this.field[j * n + i] = shape(p, q, x, z);
      }
    }

    // The shader reads the same numbers the simulation does. Float and nearest
    // are core in WebGL2; the bilinear is done by hand in the water shader, so
    // that no driver's idea of filtering can put the shoreline somewhere the
    // road tool disagrees with.
    this.texture = new THREE.DataTexture(this.field, n, n, THREE.RedFormat, THREE.FloatType);
    this.texture.needsUpdate = true;
    this.texture.minFilter = THREE.NearestFilter;
    this.texture.magFilter = THREE.NearestFilter;
    this.texture.wrapS = THREE.ClampToEdgeWrapping;
    this.texture.wrapT = THREE.ClampToEdgeWrapping;

    this.mesh = this.build();
  }

  /** Bilinear, in world units. The one function everything else asks. */
  height(x: number, z: number): number {
    const n = RES + 1;
    const fx = clamp((x + WORLD / 2) / STEP, 0, RES - 1e-4);
    const fz = clamp((z + WORLD / 2) / STEP, 0, RES - 1e-4);
    const i = Math.floor(fx);
    const j = Math.floor(fz);
    const tx = fx - i;
    const tz = fz - j;
    const a = this.field[j * n + i];
    const b = this.field[j * n + i + 1];
    const c = this.field[(j + 1) * n + i];
    const d = this.field[(j + 1) * n + i + 1];
    return mix(mix(a, b, tx), mix(c, d, tx), tz);
  }

  /** Central difference, one cell either side. */
  slope(x: number, z: number): number {
    const d = STEP;
    const dx = (this.height(x + d, z) - this.height(x - d, z)) / (2 * d);
    const dz = (this.height(x, z + d) - this.height(x, z - d)) / (2 * d);
    return Math.hypot(dx, dz);
  }

  buildable(x: number, z: number): boolean {
    return this.height(x, z) > SEA + 1.2 && this.slope(x, z) < 0.34;
  }

  private build(): THREE.Mesh {
    const n = RES + 1;
    const geo = new THREE.PlaneGeometry(WORLD, WORLD, RES, RES);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const slope = new Float32Array(n * n);

    for (let j = 0; j <= RES; j++) {
      for (let i = 0; i <= RES; i++) {
        const k = j * n + i;
        pos.setY(k, this.field[k]);
      }
    }
    // Slope from the field rather than from the normals, because the normals
    // get smoothed and the rock line wants the raw gradient.
    for (let j = 0; j <= RES; j++) {
      for (let i = 0; i <= RES; i++) {
        const x = -WORLD / 2 + i * STEP;
        const z = -WORLD / 2 + j * STEP;
        slope[j * n + i] = this.slope(x, z);
      }
    }
    geo.setAttribute('aSlope', new THREE.BufferAttribute(slope, 1));
    pos.needsUpdate = true;
    geo.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({ roughness: 0.96, metalness: 0 });
    mat.onBeforeCompile = (sh) => {
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nattribute float aSlope;\nvarying float vSlope;\nvarying vec3 vWorld;')
        .replace(
          '#include <begin_vertex>',
          '#include <begin_vertex>\nvSlope = aSlope;\nvWorld = (modelMatrix * vec4(position, 1.0)).xyz;',
        );
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>
varying float vSlope;
varying vec3 vWorld;

float h21(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
float vnoise(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1,0)), f.x), mix(h21(i + vec2(0,1)), h21(i + vec2(1,1)), f.x), f.y);
}
float fbm2(vec2 p) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { s += vnoise(p) * a; p *= 2.03; a *= 0.5; }
  return s;
}`)
        .replace(
          '#include <map_fragment>',
          `#include <map_fragment>
{
  // Two scales of breakup. The coarse one decides which of the bands you are
  // in; the fine one is grain, so that a hillside is never one colour across
  // a hundred metres, which is the single thing that gives away a heightmap.
  float coarse = fbm2(vWorld.xz * 0.0032);
  float fine = fbm2(vWorld.xz * 0.045);
  float h = vWorld.y;

  vec3 sand  = vec3(0.78, 0.71, 0.55);
  vec3 grass = mix(vec3(0.36, 0.44, 0.26), vec3(0.44, 0.50, 0.28), coarse);
  vec3 dry   = mix(vec3(0.56, 0.54, 0.34), vec3(0.62, 0.58, 0.38), fine);
  vec3 rock  = mix(vec3(0.44, 0.42, 0.40), vec3(0.56, 0.53, 0.49), fine);

  // Beach: a band above the waterline whose width follows the coarse noise,
  // so the shore is wide in the bays and thin on the headlands.
  float beach = 1.0 - smoothstep(0.6, 5.5 + coarse * 7.0, h);
  vec3 col = mix(grass, dry, smoothstep(0.35, 0.75, coarse + fine * 0.25));
  col = mix(col, rock, smoothstep(0.22, 0.44, vSlope + fine * 0.06));
  col = mix(col, sand, beach);
  // Underwater ground is darker and loses its grain.
  col = mix(col * 0.55 + vec3(0.02, 0.05, 0.06), col, smoothstep(-3.0, 0.4, h));
  col *= 0.93 + fine * 0.16;
  diffuseColor.rgb *= col;
}`,
        );
    };

    const mesh = new THREE.Mesh(geo, mat);
    mesh.receiveShadow = true;
    // The hills shadow themselves, which is most of what makes a landform read
    // as a landform rather than as a coloured height map.
    mesh.castShadow = true;
    mesh.matrixAutoUpdate = false;
    mesh.updateMatrix();
    return mesh;
  }
}

/** The shape, in one function, so the field and any preview agree exactly. */
function shape(p: Uint8Array, q: Uint8Array, x: number, z: number): number {
  const big = fbm(p, x * 0.00058, z * 0.00058, { octaves: 5 });
  const warp = fbm(q, x * 0.0013 + 11, z * 0.0013 + 7, { octaves: 3 });
  const fine = fbm(p, x * 0.0034 - 5, z * 0.0034 + 9, { octaves: 3 });

  // The ocean is to the south-west. A warped half-plane rather than a line, so
  // the shore wanders and the coves are a consequence of the warp instead of
  // being placed one at a time.
  const ocean = x * 0.86 + z * 0.5 + warp * 470 + big * 240 + 560;

  // And a bay bitten out of the land, with its own warped rim. The peninsula
  // between the two is the whole reason the site is worth building on: it is
  // the shape San Francisco and Sydney and Halifax all have, and a city on it
  // is explained by it.
  const bx = x - 540;
  const bz = z + 300;
  const bay = Math.hypot(bx, bz * 1.22) - (430 + warp * 190 + big * 90);

  // Signed distance to the water, positive inland. `min` of the two is a hard
  // union; softening it by a fraction of the smaller keeps the headland from
  // coming to a razor point where the two boundaries meet.
  const k = 220;
  const hardest = Math.min(ocean, bay);
  const other = Math.max(ocean, bay);
  const blend = smoothstep(0, 1, clamp((other - hardest) / k, 0, 1));
  const sd = hardest - (1 - blend) * k * 0.28;

  const land = smoothstep(-340, 380, sd);

  // Hills at the back, and only at the back: ridged noise creases where the
  // field crosses zero, and a range of creases reads as erosion where plain
  // fbm reads as a duvet.
  const inland = smoothstep(140, 1050, sd);
  const hills = ridge(q, x * 0.00105 + 3, z * 0.00105 - 2, 4) * inland;

  // The sea floor shelves away instead of dropping off a wall.
  const shelf = -46 + smoothstep(-1400, 0, sd) * 44;
  let h = mix(shelf, 4 + big * 30 + fine * 8, land) + hills * 300 * land;

  // The shelf the city gets. Graded rather than flattened — the noise is cut to
  // a fifth, so streets still have a fall on them and the ground still reads —
  // and the mask is a plain radius, because anything that also keyed on height
  // put a step in the terrain exactly at the waterline.
  const d = Math.hypot(x + 40, z - 40);
  const flat = smoothstep(560, 190, d) * land;
  const graded = 14 + big * 9 + fine * 3 + hills * 30;
  h = mix(h, graded, flat * 0.86);

  // Sink the land back into the sea before the field runs out, or the world
  // ends in a cliff face where the mesh does — which is the one artefact an
  // aerial view cannot help looking straight at.
  const edge = smoothstep(1180, 940, Math.max(Math.abs(x), Math.abs(z)));
  h = mix(shelf - 8, h, edge);

  return h;
}
