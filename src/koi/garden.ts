import * as THREE from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { POND_GLSL, clamp, fbm, groundHeight, pondSDF, rng, smoothstep } from './pond';
import { CAUSTIC_APPLY, CAUSTIC_PARS, causticUniforms } from './caustics';
import { barkTexture, blossomTexture, dotTexture, foliageTexture, graniteTexture, grassTexture, mapleCardTexture, pebbleTexture, soilTexture } from './textures';

/**
 * The garden around the water: banks of grass and moss, a pebble shore,
 * granite rocks with wet waterlines, irises in the shallows, ferns, azaleas,
 * a cherry in bloom and a Japanese maple, two stone lanterns and a bamboo
 * spout that keeps a little water falling into the pond.
 */

export const wind = {
  uWind: { value: new THREE.Vector2(0.15, 0.05) },
  uWTime: { value: 0 },
};

const WIND_PARS = /* glsl */ `
uniform vec2 uWind; uniform float uWTime;
vec3 windSway(vec3 p, vec3 root, float bend){
  float ph = dot(root.xz, vec2(0.7, 0.4));
  float gust = 0.6 + 0.4 * sin(uWTime * 0.7 + ph * 0.3);
  float s = sin(uWTime * 2.1 + ph) * 0.5 + sin(uWTime * 3.3 + ph * 1.7) * 0.25;
  vec2 w = uWind * gust * (1.0 + s);
  return p + vec3(w.x, 0.0, w.y) * bend;
}`;

/** Adds a world-position varying, optional caustics and an optional wet waterline. */
export function pondify<M extends THREE.Material>(m: M, opts: { caustic?: boolean; wet?: boolean; key: string }) {
  const prev = m.onBeforeCompile;
  m.onBeforeCompile = (sh, r) => {
    prev?.call(m, sh, r);
    Object.assign(sh.uniforms, causticUniforms);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vPW;')
      .replace('#include <project_vertex>', `#include <project_vertex>
      { vec4 kw = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
        kw = instanceMatrix * kw;
        #endif
        vPW = (modelMatrix * kw).xyz; }`);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>\nvarying vec3 vPW;\n${CAUSTIC_PARS}`);
    if (opts.wet) {
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <color_fragment>', `#include <color_fragment>
        { float wet = smoothstep(0.12, 0.0, vPW.y) ;
          diffuseColor.rgb *= mix(1.0, 0.55, wet);
          float algae = smoothstep(0.0, -0.08, vPW.y);
          diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.55, 0.62, 0.38), algae * 0.8); }`)
        .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        roughnessFactor = mix(roughnessFactor, 0.35, smoothstep(0.1, 0.0, vPW.y) * step(-0.05, vPW.y));`);
    }
    if (opts.caustic !== false) sh.fragmentShader = sh.fragmentShader.replace('#include <lights_fragment_end>', `#include <lights_fragment_end>\n${CAUSTIC_APPLY('vPW')}`);
  };
  const prevKey = m.customProgramCacheKey.bind(m);
  m.customProgramCacheKey = () => `${prevKey()}|pond-${opts.key}`;
  return m;
}

/* ---------- ground ---------- */

export const GROUND = { w: 34, d: 26 };

export function makeTerrain(low: boolean) {
  const segX = low ? 170 : 300, segZ = low ? 130 : 230;
  const g = new THREE.PlaneGeometry(GROUND.w, GROUND.d, segX, segZ);
  g.rotateX(-Math.PI / 2);
  const p = g.getAttribute('position') as THREE.BufferAttribute;
  const mixA = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i);
    p.setY(i, groundHeight(x, z));
    mixA[i * 3] = fbm(x * 0.4 + 11, z * 0.4 - 4, 3); // moss vs grass / algae
    mixA[i * 3 + 1] = fbm(x * 1.3 - 2, z * 1.3 + 9, 2); // fine variation
    // shade under the two trees: more moss, less lawn
    mixA[i * 3 + 2] = clamp(Math.exp(-((x + 8.4) ** 2 + (z + 4.2) ** 2) / 16) + Math.exp(-((x - 8.6) ** 2 + (z + 3.9) ** 2) / 14), 0, 1);
  }
  g.setAttribute('aMix', new THREE.BufferAttribute(mixA, 3));
  g.computeVertexNormals();
  const tPeb = pebbleTexture(), tGrass = grassTexture(), tSoil = soilTexture();
  const m = new THREE.MeshStandardMaterial({ roughness: 0.92, metalness: 0 });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.tPeb = { value: tPeb }; sh.uniforms.tGrass = { value: tGrass }; sh.uniforms.tSoil = { value: tSoil };
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec3 aMix; varying vec3 vMix;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvMix = aMix;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>\nuniform sampler2D tPeb; uniform sampler2D tGrass; uniform sampler2D tSoil; varying vec3 vMix;\n${POND_GLSL}`)
      .replace('#include <map_fragment>', `
      {
        vec2 xz = vPW.xz;
        float d = pondSDF(xz);
        vec3 peb = texture2D(tPeb, xz * 0.42).rgb;
        vec3 pebF = texture2D(tPeb, xz * 0.95 + 0.37).rgb;
        vec3 grass = texture2D(tGrass, xz * 0.32).rgb * 1.05;
        vec3 grassF = texture2D(tGrass, xz * 1.1 + 0.5).rgb;
        vec3 soil = texture2D(tSoil, xz * 0.55).rgb;
        grass = mix(grass, grassF, 0.35);
        vec3 moss = grass * vec3(0.78, 1.0, 0.55) + vec3(0.02, 0.03, 0.0);
        vec3 lawn = mix(grass, moss, smoothstep(0.35, 0.75, vMix.x + vMix.z * 0.5));
        lawn *= 0.85 + 0.3 * vMix.y;
        // pond floor: pebbles under a skin of silt and algae, darker towards the middle
        // a koi pond floor is dark on purpose: it makes the koi glow
        vec3 algae = vec3(0.1, 0.13, 0.06);
        vec3 floorC = mix(mix(peb, pebF, 0.4) * 0.62, algae, smoothstep(0.25, 0.7, vMix.x) * 0.75);
        floorC = mix(floorC, vec3(0.085, 0.09, 0.06), smoothstep(-0.6, -3.0, d) * 0.7);
        // shore: clean wet pebbles, then damp soil, then moss and lawn
        vec3 shore = mix(peb, pebF, 0.5) * 0.92;
        vec3 c = floorC;
        c = mix(c, shore, smoothstep(-0.45, -0.1, d));
        c = mix(c, soil, smoothstep(0.35, 0.7, d + (vMix.y - 0.5) * 0.4) * 0.8);
        c = mix(c, lawn, smoothstep(0.6, 1.3, d + (vMix.y - 0.5) * 0.5));
        diffuseColor.rgb = c;
      }`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
      { float d = pondSDF(vPW.xz); roughnessFactor = mix(0.45, 0.95, smoothstep(-0.05, 0.6, d)); }`);
  };
  m.customProgramCacheKey = () => 'koi-terrain';
  pondify(m, { caustic: true, key: 'terrain' });
  const mesh = new THREE.Mesh(g, m);
  mesh.receiveShadow = true;
  // the lawn running on past the modelled ground, into the haze
  const far = new THREE.RingGeometry(12.4, 170, 72, 1);
  far.rotateX(-Math.PI / 2);
  const farMesh = new THREE.Mesh(far, m);
  farMesh.position.y = 0.1;
  farMesh.receiveShadow = true;
  mesh.add(farMesh);
  return mesh;
}

/* ---------- rocks ---------- */

function rockGeometry(seed: number, flat: number) {
  const g0 = new THREE.IcosahedronGeometry(1, 5);
  g0.deleteAttribute('normal'); g0.deleteAttribute('uv');
  const g = mergeVertices(g0);
  const p = g.getAttribute('position') as THREE.BufferAttribute;
  const col = new Float32Array(p.count * 3);
  const r = rng(seed);
  const ox = r() * 50, oz = r() * 50;
  const v = new THREE.Vector3();
  // first displace
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i).normalize();
    const n1 = fbm(v.x * 1.3 + ox, v.y * 1.3 + v.z * 0.7 + oz, 4);
    const n2 = fbm(v.x * 4 + oz, v.z * 4 + v.y * 2 + ox, 3);
    // a few flat facets, as if split along the grain
    const facet = Math.max(0, v.dot(new THREE.Vector3(0.3, 0.9, 0.2).normalize()) - 0.7) * 0.6;
    const n3 = fbm(v.x * 9 + ox, v.z * 9 - v.y * 5 + oz, 2);
    // ridged detail: weathered granite has edges, not lumps
    const ridge = 1 - Math.abs(fbm(v.x * 2.6 - oz, v.y * 2.6 + v.z * 1.3 + ox, 3) * 2 - 1);
    let rr = 0.8 + n1 * 0.5 + n2 * 0.12 + n3 * 0.035 + ridge * 0.07 - facet;
    let y = v.y * rr * flat;
    if (y < -0.25 * flat) y = -0.25 * flat + (y + 0.25 * flat) * 0.3;
    p.setXYZ(i, v.x * rr, y, v.z * rr);
  }
  g.computeVertexNormals();
  const nrm = g.getAttribute('normal') as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const n = fbm(x * 3 + ox, z * 3 + y * 2 + oz, 3);
    const speck = fbm(x * 18, z * 18 + y * 9, 2);
    const warm = fbm(x * 0.8 + oz, z * 0.8 - ox, 2);
    const c = new THREE.Color().setRGB(0.15 + n * 0.1 + warm * 0.04, 0.145 + n * 0.095 + warm * 0.02, 0.135 + n * 0.085);
    c.multiplyScalar(0.8 + speck * 0.45);
    // pale lichen rosettes
    if (fbm(x * 5 + 3, z * 5 - y * 3, 2) > 0.64) c.lerp(new THREE.Color(0.36, 0.37, 0.28), 0.45);
    // moss on the tops and in the hollows facing up
    const up = nrm.getY(i);
    const moss = smoothstep(0.35, 0.8, up) * smoothstep(0.4, 0.6, fbm(x * 2.2 + oz, z * 2.2 + ox, 3));
    c.lerp(new THREE.Color(0.07, 0.13, 0.025).multiplyScalar(0.8 + speck * 0.5), moss * 0.9);
    col.set([c.r, c.g, c.b], i * 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}

export type Obstacle = { x: number; z: number; r: number };

export function makeRocks(low: boolean) {
  const group = new THREE.Group();
  const variants = Array.from({ length: low ? 4 : 7 }, (_, i) => rockGeometry(100 + i * 17, 0.55 + (i % 3) * 0.12));
  const mat = pondify(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.88 }), { caustic: true, wet: true, key: 'rock' });
  const r = rng(77);
  type Placed = { x: number; z: number; s: number; v: number; rot: number; sy: number; y: number };
  const placed: Placed[] = [];
  const obstacles: Obstacle[] = [];
  const free = (x: number, z: number, s: number) => placed.every((q) => Math.hypot(q.x - x, q.z - z) > (q.s + s) * 0.8);
  // ring the pond, leaving a few gaps for the pebble beach
  for (let a = 0, n = 0; n < 400 && placed.length < 46; n++) {
    a = r() * Math.PI * 2;
    const beach = Math.cos(a - 1.9) > 0.86 || Math.cos(a + 2.4) > 0.9;
    if (beach) continue;
    // walk the angle to the waterline
    let x = Math.cos(a) * 6, z = Math.sin(a) * 4;
    for (let k = 0; k < 20; k++) { const d = pondSDF(x, z); x += Math.cos(a) * -d * 0.7; z += Math.sin(a) * -d * 0.7; }
    const s = 0.28 + r() ** 1.5 * 0.65;
    const off = s * (0.25 + r() * 0.5);
    x += Math.cos(a) * off; z += Math.sin(a) * off * 1.1;
    if (!free(x, z, s)) continue;
    const y = Math.min(groundHeight(x, z), 0.15) - s * 0.15;
    placed.push({ x, z, s, v: Math.floor(r() * variants.length), rot: r() * 6.28, sy: 0.75 + r() * 0.5, y });
  }
  // two boulders out in the water, and a flat viewing stone jutting over it
  const extra: Placed[] = [
    { x: 2.6, z: -1.6, s: 0.62, v: 1, rot: 0.4, sy: 0.9, y: -0.35 },
    { x: 3.25, z: -1.05, s: 0.36, v: 2, rot: 2.1, sy: 0.8, y: -0.2 },
    { x: -2.9, z: 1.4, s: 0.45, v: 0, rot: 1.2, sy: 0.85, y: -0.35 },
    { x: 0.6, z: 4.25, s: 0.95, v: 3 % variants.length, rot: 0.1, sy: 0.42, y: 0.0 },
  ];
  placed.push(...extra);
  for (const e of extra.slice(0, 3)) obstacles.push({ x: e.x, z: e.z, r: e.s * 0.9 });
  const byV = new Map<number, Placed[]>();
  for (const q of placed) { if (!byV.has(q.v)) byV.set(q.v, []); byV.get(q.v)!.push(q); }
  const m4 = new THREE.Matrix4(), qt = new THREE.Quaternion(), sc = new THREE.Vector3();
  for (const [v, list] of byV) {
    const im = new THREE.InstancedMesh(variants[v], mat, list.length);
    list.forEach((q, i) => {
      qt.setFromEuler(new THREE.Euler((r() - 0.5) * 0.25, q.rot, (r() - 0.5) * 0.25));
      sc.set(q.s * (0.9 + r() * 0.3), q.s * q.sy, q.s * (0.9 + r() * 0.3));
      m4.compose(new THREE.Vector3(q.x, q.y, q.z), qt, sc);
      im.setMatrixAt(i, m4);
    });
    im.castShadow = true; im.receiveShadow = true;
    group.add(im);
  }
  // stepping stones up from the front-left of the lawn
  const stepMat = pondify(new THREE.MeshStandardMaterial({ map: graniteTexture(), roughness: 0.8, color: 0xc8c2b6 }), { caustic: false, key: 'slab' });
  const steps = [[-4.9, 6.9], [-4.3, 6.1], [-3.9, 5.25], [-3.3, 4.75]];
  steps.forEach(([x, z], i) => {
    const g = new THREE.CylinderGeometry(0.36 + (i % 2) * 0.06, 0.4, 0.12, 18, 1);
    const p = g.getAttribute('position') as THREE.BufferAttribute;
    for (let k = 0; k < p.count; k++) { const a = Math.atan2(p.getZ(k), p.getX(k)); const s = 1 + 0.12 * Math.sin(a * 3 + i) + 0.06 * Math.sin(a * 5 + i * 2); p.setX(k, p.getX(k) * s); p.setZ(k, p.getZ(k) * s * 0.8); }
    g.computeVertexNormals();
    const mesh = new THREE.Mesh(g, stepMat);
    mesh.position.set(x, groundHeight(x, z) + 0.02, z);
    mesh.rotation.y = i * 0.7;
    mesh.castShadow = true; mesh.receiveShadow = true;
    group.add(mesh);
  });
  return { group, obstacles, rocks: placed };
}

/* ---------- grass, irises, ferns, shrubs ---------- */

function tuftGeometry(blades: number, h: number, seed: number) {
  const r = rng(seed);
  const pos: number[] = [], col: number[] = [], idx: number[] = [];
  for (let b = 0; b < blades; b++) {
    const a = r() * Math.PI * 2, lean = 0.2 + r() * 0.5, hh = h * (0.6 + r() * 0.6), w = 0.012 + r() * 0.008;
    const base = pos.length / 3;
    const dx = Math.cos(a), dz = Math.sin(a);
    for (let k = 0; k <= 3; k++) {
      const t = k / 3;
      const x = dx * lean * hh * t * t + (r() - 0.5) * 0.02, z = dz * lean * hh * t * t, y = hh * t;
      const ww = w * (1 - t * 0.9);
      pos.push(x - dz * ww, y, z + dx * ww, x + dz * ww, y, z - dx * ww);
      const c = 0.6 + t * 0.55;
      col.push(0.07 * c, 0.15 * c, 0.03 * c, 0.085 * c, 0.17 * c, 0.035 * c);
    }
    for (let k = 0; k < 3; k++) { const i0 = base + k * 2; idx.push(i0, i0 + 1, i0 + 2, i0 + 1, i0 + 3, i0 + 2); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  // lawn trick: light every blade as if it faced the sky, so tufts don't read as dark stars
  g.setAttribute('normal', new THREE.Float32BufferAttribute(new Array(pos.length / 3).fill(0).flatMap(() => [0, 1, 0]), 3));
  return g;
}

function swayMaterial(m: THREE.MeshStandardMaterial, key: string, height = 1, skyNormal = false) {
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, wind);
    // thin blades: light both faces as if they faced the sky
    if (skyNormal) sh.fragmentShader = sh.fragmentShader.replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\nnormal = normalize((viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz);');
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>\n${WIND_PARS}`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
      { vec3 root = vec3(0.0);
        #ifdef USE_INSTANCING
        root = instanceMatrix[3].xyz;
        #endif
        float bend = pow(max(0.0, position.y) / ${height.toFixed(2)}, 1.6) * 0.6;
        transformed = windSway(transformed, root, bend); }`);
  };
  m.customProgramCacheKey = () => `koi-sway-${key}-${skyNormal ? 1 : 0}`;
  return m;
}

export function makePlants(low: boolean, rocks: { x: number; z: number; s: number }[]) {
  const group = new THREE.Group();
  const r = rng(91);
  const nearRock = (x: number, z: number) => rocks.some((q) => Math.hypot(q.x - x, q.z - z) < q.s * 0.9);
  // lawn tufts
  const tuft = tuftGeometry(9, 0.16, 3);
  const grassMat = swayMaterial(new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.85 }), 'grass', 0.16, true);
  const N = low ? 2200 : 6000;
  const tufts = new THREE.InstancedMesh(tuft, grassMat, N);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3();
  let n = 0;
  for (let k = 0; k < N * 6 && n < N; k++) {
    const x = (r() - 0.5) * 30, z = (r() - 0.5) * 22;
    const d = pondSDF(x, z);
    if (d < 0.35 || nearRock(x, z)) continue;
    if (Math.hypot(x + 4.1, z - 5.7) < 1.2) continue; // the stepping stones
    if (r() > smoothstep(0.3, 1.4, d)) continue;
    const sc = 0.55 + r() * 0.6 + 0.5 * smoothstep(0.5, 1.2, d) * (d < 1.4 ? 1 : 0);
    q.setFromEuler(new THREE.Euler(0, r() * 6.28, 0)); s.set(sc, sc * (0.8 + r() * 0.5), sc);
    m4.compose(p.set(x, groundHeight(x, z) - 0.01, z), q, s);
    tufts.setMatrixAt(n++, m4);
  }
  tufts.count = n;
  tufts.receiveShadow = true;
  group.add(tufts);

  // irises and sedges along the margin, some standing in the shallows
  const leafGeo = (() => {
    const pos: number[] = [], col: number[] = [], idx: number[] = [];
    const rr = rng(5);
    for (let b = 0; b < 14; b++) {
      const a = rr() * Math.PI * 2, hh = 0.55 + rr() * 0.45, lean = 0.12 + rr() * 0.25, w = 0.022 + rr() * 0.012;
      const dx = Math.cos(a), dz = Math.sin(a), base = pos.length / 3;
      for (let k = 0; k <= 5; k++) {
        const t = k / 5, x = dx * (0.03 + lean * hh * t * t), z = dz * (0.03 + lean * hh * t * t), y = hh * t;
        const ww = w * Math.sin(Math.PI * (0.15 + t * 0.85)) + 0.002;
        pos.push(x - dz * ww, y, z + dx * ww, x + dz * ww, y, z - dx * ww);
        const c = 0.45 + t * 0.55;
        col.push(0.2 * c, 0.4 * c, 0.16 * c, 0.24 * c, 0.44 * c, 0.18 * c);
      }
      for (let k = 0; k < 5; k++) { const i0 = base + k * 2; idx.push(i0, i0 + 1, i0 + 2, i0 + 1, i0 + 3, i0 + 2); }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.setIndex(idx); g.computeVertexNormals();
    return g;
  })();
  const irisMat = swayMaterial(new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.7 }), 'iris', 1, true);
  const irisSpots: [number, number][] = [];
  for (let k = 0; k < 400 && irisSpots.length < 14; k++) {
    const a = r() * Math.PI * 2;
    let x = Math.cos(a) * 6, z = Math.sin(a) * 4;
    for (let j = 0; j < 20; j++) { const d = pondSDF(x, z); x -= Math.cos(a) * d * 0.7; z -= Math.sin(a) * d * 0.7; }
    if (z > 2.5 && Math.abs(x) < 3) continue; // keep the front open
    x += Math.cos(a) * (r() - 0.6) * 0.5; z += Math.sin(a) * (r() - 0.6) * 0.5;
    if (nearRock(x, z) || irisSpots.some(([a2, b2]) => Math.hypot(a2 - x, b2 - z) < 1.4)) continue;
    irisSpots.push([x, z]);
  }
  const irises = new THREE.InstancedMesh(leafGeo, irisMat, irisSpots.length * 2);
  let ii = 0;
  const flowers: THREE.Vector3[] = [];
  for (const [x, z] of irisSpots) for (let c = 0; c < 2; c++) {
    const xx = x + (r() - 0.5) * 0.35, zz = z + (r() - 0.5) * 0.35;
    const sc = 0.8 + r() * 0.5;
    q.setFromEuler(new THREE.Euler(0, r() * 6.28, 0)); s.set(sc, sc, sc);
    m4.compose(p.set(xx, Math.max(-0.4, groundHeight(xx, zz)), zz), q, s);
    irises.setMatrixAt(ii++, m4);
    if (r() < 0.55) flowers.push(new THREE.Vector3(xx + (r() - 0.5) * 0.1, 0.75 * sc, zz + (r() - 0.5) * 0.1));
  }
  irises.castShadow = true; irises.receiveShadow = true;
  group.add(irises);
  // iris flowers: three falls and three standards in violet
  const flowerGeo = (() => {
    const parts: THREE.BufferGeometry[] = [];
    for (let k = 0; k < 6; k++) {
      const pg = new THREE.SphereGeometry(0.05, 8, 6);
      pg.scale(1, 0.25, 0.45);
      const up = k % 2 === 0;
      pg.translate(0.045, up ? 0.03 : -0.005, 0);
      pg.rotateZ(up ? 0.9 : -0.5);
      pg.rotateY((k / 6) * Math.PI * 2);
      parts.push(pg);
    }
    const stem = new THREE.CylinderGeometry(0.004, 0.005, 0.75, 4); stem.translate(0, -0.375, 0);
    return mergeSimple([...parts, stem]);
  })();
  const flowerMat = swayMaterial(new THREE.MeshStandardMaterial({ color: 0x5b3fa8, roughness: 0.55, emissive: 0x150a2a }), 'irisflower', 1);
  const fl = new THREE.InstancedMesh(flowerGeo, flowerMat, flowers.length);
  flowers.forEach((f, i) => { m4.compose(p.copy(f).setY(f.y + Math.max(-0.4, groundHeight(f.x, f.z))), q.identity(), s.set(1, 1, 1)); fl.setMatrixAt(i, m4); });
  group.add(fl);

  // shrubs: azaleas in flower and a couple of dark evergreen mounds, built as clusters of leaf cards
  const shrubs: { x: number; z: number; r: number; h: number; bloom: string | null }[] = [
    { x: -8.2, z: 2.6, r: 1.1, h: 0.8, bloom: '#d6337a' },
    { x: -7.2, z: 4.0, r: 0.8, h: 0.6, bloom: '#f06aa0' },
    { x: 8.4, z: 2.2, r: 1.0, h: 0.75, bloom: '#e04870' },
    { x: 7.6, z: -6.4, r: 1.0, h: 0.8, bloom: null },
    { x: -2.2, z: -6.6, r: 1.2, h: 0.85, bloom: null },
    { x: 3.2, z: -6.9, r: 0.9, h: 0.7, bloom: '#f2f0ea' },
    { x: 9.6, z: 4.8, r: 0.9, h: 0.65, bloom: null },
  ];
  const card = new THREE.PlaneGeometry(0.3, 0.3);
  const leafTex = foliageTexture(12);
  const leafMat = swayMaterial(new THREE.MeshStandardMaterial({ map: leafTex, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.7 }), 'shrubleaf', 1.5);
  const bloomTex = foliageTexture(13, ['#ffffff', '#f4f0f0', '#ffe9ef']);
  const bloomMat = swayMaterial(new THREE.MeshStandardMaterial({ map: bloomTex, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.6 }), 'shrubbloom', 1.5);
  const leafCount = shrubs.reduce((a, b) => a + Math.round(b.r * b.r * (low ? 120 : 260)), 0);
  const bloomCount = shrubs.reduce((a, b) => a + (b.bloom ? Math.round(b.r * b.r * (low ? 50 : 110)) : 0), 0);
  const leaves = new THREE.InstancedMesh(card, leafMat, leafCount);
  const blooms = new THREE.InstancedMesh(card, bloomMat, Math.max(1, bloomCount));
  const depthL = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: leafTex, alphaTest: 0.5 });
  leaves.customDepthMaterial = depthL;
  let li = 0, bi = 0;
  const col = new THREE.Color();
  for (const sh of shrubs) {
    const gy = groundHeight(sh.x, sh.z);
    const nl = Math.round(sh.r * sh.r * (low ? 120 : 260)), nb = sh.bloom ? Math.round(sh.r * sh.r * (low ? 50 : 110)) : 0;
    const place = (im: THREE.InstancedMesh, i: number, outer: boolean) => {
      // points in a squashed dome, more of them near the skin
      const u = r() * Math.PI * 2, v = Math.acos(r() * 0.95), rad = (outer ? 0.92 + r() * 0.1 : 0.6 + r() * 0.4);
      const x = sh.x + Math.cos(u) * Math.sin(v) * sh.r * rad, z = sh.z + Math.sin(u) * Math.sin(v) * sh.r * rad;
      const y = gy + Math.cos(v) * sh.h * rad + 0.08;
      q.setFromEuler(new THREE.Euler(-Math.PI / 2 + (r() - 0.5) * 1.2, r() * 6.28, (r() - 0.5) * 1.2, 'YXZ'));
      const sc = 0.8 + r() * 0.6;
      m4.compose(p.set(x, y, z), q, s.set(sc, sc, sc));
      im.setMatrixAt(i, m4);
      return y;
    };
    for (let k = 0; k < nl; k++) { place(leaves, li, false); col.setHSL(0.27 + r() * 0.05, 0.45, 0.6 + r() * 0.35); leaves.setColorAt(li++, col); }
    for (let k = 0; k < nb; k++) { place(blooms, bi, true); col.set(sh.bloom!).offsetHSL(0, 0, (r() - 0.5) * 0.08); blooms.setColorAt(bi++, col); }
  }
  leaves.castShadow = true; leaves.receiveShadow = true; blooms.receiveShadow = true;
  blooms.count = bi;
  group.add(leaves, blooms);

  // ferns in the shade under the trees
  const frond = (() => {
    const pos: number[] = [], col: number[] = [], idx: number[] = [];
    const L = 0.6, segs = 10;
    for (let k = 0; k <= segs; k++) {
      const t = k / segs, x = t * L, y = Math.sin(t * Math.PI * 0.9) * 0.22 - t * t * 0.1;
      const w = 0.11 * Math.sin(Math.PI * Math.min(1, t * 1.1 + 0.05));
      // pinnae as a zigzag edge
      const zz = w * (k % 2 === 0 ? 1 : 0.7);
      pos.push(x, y, -zz, x, y + 0.01, 0, x, y, zz);
      const c = 0.5 + t * 0.4;
      col.push(0.15 * c, 0.36 * c, 0.1 * c, 0.2 * c, 0.42 * c, 0.12 * c, 0.15 * c, 0.36 * c, 0.1 * c);
    }
    for (let k = 0; k < segs; k++) { const a = k * 3; idx.push(a, a + 3, a + 1, a + 1, a + 3, a + 4, a + 1, a + 4, a + 2, a + 2, a + 4, a + 5); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.setIndex(idx); g.computeVertexNormals();
    return g;
  })();
  const fernMat = swayMaterial(new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.75 }), 'fern', 0.3, true);
  const fernSpots = [[-9.9, -2.6], [-8.0, -5.6], [-6.9, -6.1], [8.6, -2.3], [10.1, -3.1], [6.4, -6.2], [-10.5, 1.0]];
  const ferns = new THREE.InstancedMesh(frond, fernMat, fernSpots.length * 9);
  let fi = 0;
  for (const [x, z] of fernSpots) for (let k = 0; k < 9; k++) {
    const a = (k / 9) * Math.PI * 2 + r() * 0.4;
    q.setFromEuler(new THREE.Euler(0, a, 0)); const sc = 0.8 + r() * 0.5;
    m4.compose(p.set(x, groundHeight(x, z), z), q, s.set(sc, sc, sc));
    ferns.setMatrixAt(fi++, m4);
  }
  ferns.castShadow = true; ferns.receiveShadow = true;
  group.add(ferns);
  return group;
}

export function mergeSimple(gs: THREE.BufferGeometry[]) {
  const pos: number[] = [], nor: number[] = [], idx: number[] = [];
  let off = 0;
  for (const g0 of gs) {
    const g = g0.index ? g0 : g0;
    const p = g.getAttribute('position'), n = g.getAttribute('normal');
    for (let i = 0; i < p.count; i++) { pos.push(p.getX(i), p.getY(i), p.getZ(i)); nor.push(n.getX(i), n.getY(i), n.getZ(i)); }
    const ix = g.getIndex();
    if (ix) for (let i = 0; i < ix.count; i++) idx.push(ix.getX(i) + off); else for (let i = 0; i < p.count; i++) idx.push(i + off);
    off += p.count;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setIndex(idx);
  return g;
}

/* ---------- trees ---------- */

type Branch = { a: THREE.Vector3; b: THREE.Vector3; r0: number; r1: number; depth: number };

function growTree(seed: number, root: THREE.Vector3, lean: THREE.Vector3, trunkH: number, spread: number) {
  const r = rng(seed);
  const out: Branch[] = [];
  const tips: THREE.Vector3[] = [];
  const grow = (from: THREE.Vector3, dir: THREE.Vector3, len: number, rad: number, depth: number) => {
    const to = from.clone().addScaledVector(dir, len);
    // a little droop and wander per segment
    to.y -= depth > 1 ? len * 0.08 * depth : 0;
    out.push({ a: from.clone(), b: to, r0: rad, r1: rad * 0.72, depth });
    if (depth >= 4 || rad < 0.02) { tips.push(to); return; }
    const kids = depth === 0 ? 4 : 2 + (r() < 0.5 ? 1 : 0);
    for (let k = 0; k < kids; k++) {
      const az = (k / kids) * Math.PI * 2 + r() * 1.2;
      const d = dir.clone().multiplyScalar(0.6)
        .add(new THREE.Vector3(Math.cos(az), 0, Math.sin(az)).multiplyScalar(spread * (0.7 + r() * 0.6)))
        .add(lean.clone().multiplyScalar(0.35))
        .add(new THREE.Vector3(0, depth < 1 ? 0.7 : depth < 2 ? 0.35 : 0.05, 0)).normalize();
      grow(to, d, len * (depth === 0 ? 0.62 : 0.72) * (0.85 + r() * 0.3), rad * 0.62, depth + 1);
    }
    if (depth >= 2) tips.push(to);
  };
  grow(root.clone(), new THREE.Vector3(0, 1, 0).addScaledVector(lean, 0.25).normalize(), trunkH, 0.2, 0);
  return { branches: out, tips };
}

function branchesGeometry(bs: Branch[]) {
  const parts: THREE.BufferGeometry[] = [];
  for (const b of bs) {
    const len = b.a.distanceTo(b.b);
    const g = new THREE.CylinderGeometry(b.r1, b.r0, len * 1.04, b.depth < 2 ? 10 : 6, 1);
    // uv.y along the length so the bark streaks follow the wood
    g.translate(0, len / 2, 0);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.b.clone().sub(b.a).normalize());
    g.applyQuaternion(q); g.translate(b.a.x, b.a.y, b.a.z);
    parts.push(g);
  }
  // keep uvs for the bark
  const pos: number[] = [], nor: number[] = [], uv: number[] = [], idx: number[] = [];
  let off = 0;
  for (const g of parts) {
    const p = g.getAttribute('position'), n = g.getAttribute('normal'), u = g.getAttribute('uv');
    for (let i = 0; i < p.count; i++) { pos.push(p.getX(i), p.getY(i), p.getZ(i)); nor.push(n.getX(i), n.getY(i), n.getZ(i)); uv.push(u.getX(i) * 2, u.getY(i) * 2); }
    const ix = g.getIndex()!;
    for (let i = 0; i < ix.count; i++) idx.push(ix.getX(i) + off);
    off += p.count;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}

export type Tree = { group: THREE.Group; canopy: THREE.Vector3[]; kind: 'cherry' | 'maple' };

export function makeTrees(low: boolean) {
  const bark = barkTexture();
  const barkMat = new THREE.MeshStandardMaterial({ map: bark, color: 0xd2c2b6, roughness: 0.9 });
  const trees: Tree[] = [];
  const defs = [
    { kind: 'cherry' as const, root: new THREE.Vector3(-8.1, groundHeight(-8.1, -4.6), -4.6), lean: new THREE.Vector3(0.8, 0, 0.4), h: 2.0, spread: 1.15, seed: 4, cards: low ? 1500 : 3600, size: 0.55 },
    { kind: 'maple' as const, root: new THREE.Vector3(8.4, groundHeight(8.4, -4.2), -4.2), lean: new THREE.Vector3(-0.8, 0, 0.35), h: 1.6, spread: 1.25, seed: 9, cards: low ? 1300 : 3000, size: 0.5 },
  ];
  for (const d of defs) {
    const group = new THREE.Group();
    const { branches, tips } = growTree(d.seed, d.root, d.lean, d.h, d.spread);
    const wood = new THREE.Mesh(branchesGeometry(branches), barkMat);
    wood.castShadow = true; wood.receiveShadow = true;
    group.add(wood);
    const tex = d.kind === 'cherry' ? blossomTexture(d.seed) : mapleCardTexture(d.seed);
    const mat = swayMaterial(new THREE.MeshStandardMaterial({ map: tex, alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.65 }), `canopy-${d.kind}`, 6, true);
    // canopy wind uses height from the card's own origin, so bend by a constant amount instead
    mat.onBeforeCompile = ((orig) => (sh: THREE.WebGLProgramParametersWithUniforms, rr: THREE.WebGLRenderer) => {
      orig.call(mat, sh, rr);
      sh.vertexShader = sh.vertexShader.replace('float bend = pow(max(0.0, position.y) / 6.00, 1.6) * 0.6;', 'float bend = 0.35;');
    })(mat.onBeforeCompile);
    const card = new THREE.PlaneGeometry(d.size, d.size);
    const im = new THREE.InstancedMesh(card, mat, d.cards);
    im.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: tex, alphaTest: 0.45 });
    const r = rng(d.seed + 1);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3();
    const canopy: THREE.Vector3[] = [];
    const col = new THREE.Color();
    // each branch tip carries a rounded clump of foliage; cards face every way so it has volume
    const clumpR = d.kind === 'cherry' ? 0.85 : 0.75;
    for (let i = 0; i < d.cards; i++) {
      const t = tips[Math.floor(r() * tips.length)];
      const u = r() * Math.PI * 2, v = Math.acos(2 * r() - 1), rad = Math.pow(r(), 0.45) * clumpR;
      p.set(t.x + Math.cos(u) * Math.sin(v) * rad, t.y + Math.cos(v) * rad * (d.kind === 'cherry' ? 0.75 : 0.5) + 0.12, t.z + Math.sin(u) * Math.sin(v) * rad);
      q.setFromEuler(new THREE.Euler(-Math.PI / 2 + (r() - 0.5) * 2.2, r() * 6.28, (r() - 0.5) * 2.2, 'YXZ'));
      const sc = 0.75 + r() * 0.5;
      m4.compose(p, q, s.set(sc, sc, sc));
      im.setMatrixAt(i, m4);
      if (d.kind === 'cherry') col.setRGB(1, 0.93 + r() * 0.07, 0.95 + r() * 0.05); else col.setHSL(0.0 + r() * 0.04, 0.7, 0.75 + r() * 0.25);
      // the inside of a clump sits in its own shade
      col.multiplyScalar(0.62 + 0.38 * (rad / clumpR));
      im.setColorAt(i, col);
      canopy.push(p.clone());
    }
    im.castShadow = true; im.receiveShadow = true;
    group.add(im);
    trees.push({ group, canopy, kind: d.kind });
  }
  return trees;
}

/* ---------- stone lanterns ---------- */

export function makeLantern(x: number, z: number, rot: number) {
  const g = new THREE.Group();
  const gran = graniteTexture(43);
  const m = pondify(new THREE.MeshStandardMaterial({ map: gran, color: 0xb9b4aa, roughness: 0.85 }), { caustic: false, key: 'lantern' });
  const add = (geo: THREE.BufferGeometry, y: number, mat: THREE.Material = m) => { const mesh = new THREE.Mesh(geo, mat); mesh.position.y = y; mesh.castShadow = true; mesh.receiveShadow = true; g.add(mesh); return mesh; };
  // a yukimi (snow-viewing) lantern: low legs, a light box, a wide roof to catch snow
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI * 2;
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.42, 8), m);
    leg.position.set(Math.cos(a) * 0.22, 0.21, Math.sin(a) * 0.22);
    leg.rotation.z = Math.cos(a) * 0.18; leg.rotation.x = -Math.sin(a) * 0.18;
    leg.castShadow = true; g.add(leg);
  }
  add(new THREE.CylinderGeometry(0.3, 0.3, 0.07, 6), 0.45);
  const glow = new THREE.MeshStandardMaterial({ color: 0x2a2018, emissive: 0xffb257, emissiveIntensity: 0, roughness: 1 });
  const box = add(new THREE.CylinderGeometry(0.17, 0.17, 0.22, 6), 0.6, glow);
  box.castShadow = false;
  // hexagonal frame around the light box
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2 + Math.PI / 6;
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.24, 0.05), m);
    post.position.set(Math.cos(a) * 0.19, 0.6, Math.sin(a) * 0.19); g.add(post);
  }
  const roof = new THREE.CylinderGeometry(0.06, 0.62, 0.2, 6, 1);
  const rp = roof.getAttribute('position') as THREE.BufferAttribute;
  for (let i = 0; i < rp.count; i++) if (rp.getY(i) < 0) rp.setY(i, rp.getY(i) + 0.035); // upturned eaves
  roof.computeVertexNormals();
  add(roof, 0.82);
  add(new THREE.CylinderGeometry(0.1, 0.14, 0.06, 6), 0.95);
  add(new THREE.SphereGeometry(0.075, 12, 8), 1.02).scale.y = 1.25;
  g.position.set(x, groundHeight(x, z), z);
  g.rotation.y = rot;
  const light = new THREE.PointLight(0xffb257, 0, 7, 1.5);
  light.position.set(0, 0.6, 0);
  g.add(light);
  // the warm haze around the lit window, which is what you see from above
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTexture(), color: 0xffb35c, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  halo.position.set(0, 0.62, 0);
  halo.scale.setScalar(1.5);
  g.add(halo);
  return { group: g, glow, light, halo };
}

/* ---------- bamboo spout ---------- */

export function makeSpout() {
  const g = new THREE.Group();
  const bambooMat = new THREE.MeshStandardMaterial({ color: 0x9a9a4a, roughness: 0.45 });
  const nodeMat = new THREE.MeshStandardMaterial({ color: 0x77722f, roughness: 0.5 });
  // the spout pipe, resting on a post, angled down to the water
  const L = 1.5;
  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, L, 14, 1, true), bambooMat);
  pipe.rotation.z = Math.PI / 2 - 0.18;
  pipe.position.set(-L / 2 * Math.cos(0.18), L / 2 * Math.sin(0.18), 0);
  pipe.castShadow = true;
  g.add(pipe);
  for (let k = 1; k < 4; k++) {
    const n = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.008, 6, 14), nodeMat);
    const t = k / 4;
    n.position.set(-L * t * Math.cos(0.18), L * t * Math.sin(0.18), 0);
    n.rotation.y = Math.PI / 2; n.rotation.x = 0.18;
    g.add(n);
  }
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.95, 12), bambooMat);
  post.position.set(-L * 0.8, 0.0, 0); post.castShadow = true;
  g.add(post);
  // the falling water: a thin ribbon that streams
  const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(0.02, -0.01, 0), new THREE.Vector3(0.14, -0.04, 0), new THREE.Vector3(0.2, -0.42, 0));
  const streamGeo = new THREE.TubeGeometry(curve, 16, 0.016, 8, false);
  const streamMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { uTime: { value: 0 } },
    vertexShader: 'varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ vUv = uv; vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position,1.0); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
    fragmentShader: `uniform float uTime; varying vec2 vUv; varying vec3 vN; varying vec3 vV;
      float h(float x){ return fract(sin(x * 91.7) * 4375.5); }
      void main(){
        float s = vUv.x * 14.0 - uTime * 9.0;
        float streak = 0.55 + 0.45 * sin(s + sin(vUv.y * 6.283 * 3.0) * 1.5);
        float rim = pow(1.0 - abs(dot(vN, vV)), 1.5);
        vec3 c = mix(vec3(0.75, 0.86, 0.9), vec3(1.0), streak * 0.6);
        gl_FragColor = vec4(c * 1.15, (0.25 + 0.55 * rim) * (0.6 + 0.4 * streak));
      }`,
  });
  const stream = new THREE.Mesh(streamGeo, streamMat);
  g.add(stream);
  return { group: g, streamMat, mouth: new THREE.Vector3(0.2, -0.42, 0) };
}
