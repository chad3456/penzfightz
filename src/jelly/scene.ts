/**
 * Building Jellynoor: the ground, the water, the rows of tea, the village and
 * the woods around it. Everything static is put together once here; world.ts
 * then runs it.
 */
import * as THREE from 'three';
import { JELLY, JigBank, blobShadowMaterial, jellyMaterial, setBounds, skyDome, U, Wobbler, type JellyMaterial } from './jelly';
import {
  chaiStall, choppingBlock, cottage, fence, flower, gateArch, lantern, leafHeap, log, pine,
  roundBox, rollTable, sapling, shadeTree, shed, sholaTree, shrine, signboard, stepStone, teaBush, budTuft,
  teaChest, waterTank, washing, weedTuft, weighScale, witherTrough, kit, rock, cyl, blob,
} from './make';
import {
  heightAt, layOutGarden, PATH, pathDist, POND, scatter, slopeAt, streamDist, STREAM, teaMask,
  VILLAGE, villageMask, WORLD, mulberry, forestMask,
} from './land';
import { makeBush, type Estate, type Spot, type SpotKind } from './chores';

export type Quality = 'high' | 'low';

/* ───────── a thing in the village that can be made to wobble ───────── */

export interface Prop {
  mesh: THREE.Mesh;
  wob: Wobbler;
  x: number; z: number;
  r: number;
}

export function addProp(
  parent: THREE.Object3D, geo: THREE.BufferGeometry, x: number, z: number,
  opts: { rotY?: number; scale?: number; wind?: number; gloss?: number; stiff?: number; y?: number } = {},
): Prop {
  const mat = jellyMaterial({
    vcol: true, colour: '#ffffff', gloss: opts.gloss ?? 0.8, thick: 0.75, rim: 0.36, wrap: 0.7, wind: opts.wind ?? 0,
  });
  setBounds(mat, geo);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, opts.y ?? heightAt(x, z), z);
  mesh.rotation.y = opts.rotY ?? 0;
  if (opts.scale) mesh.scale.setScalar(opts.scale);
  parent.add(mesh);
  geo.computeBoundingSphere();
  return { mesh, wob: new Wobbler(mat, opts.stiff ?? 110, 6.5), x, z, r: (geo.boundingSphere?.radius ?? 2) * (opts.scale ?? 1) };
}

/* ───────── the ground ───────── */

const GRASS = new THREE.Color('#6fc45f');
const GRASS_DRY = new THREE.Color('#a8c558');
const EARTH = new THREE.Color('#c08a5c');
const EARTH_DEEP = new THREE.Color('#9d6742');
const ROCKC = new THREE.Color('#a8b6c6');
const SAND = new THREE.Color('#e3cf9c');
const TEAFLOOR = new THREE.Color('#8a9a4a');

/**
 * The hillside. Height from the land function, colour from height, steepness
 * and what is growing on it, so the terraces read as benches of worked earth
 * with grass on the risers and pebbles along the stream.
 */
export function buildTerrain(q: Quality): THREE.Mesh {
  const size = WORLD * 2 + 56;
  const seg = q === 'high' ? 232 : 148;
  const geo = new THREE.PlaneGeometry(size, size, seg, seg).rotateX(-Math.PI / 2);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const n = pos.count;
  const col = new Float32Array(n * 3);
  const emit = new Float32Array(n);
  const c = new THREE.Color();

  for (let i = 0; i < n; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const h = heightAt(x, z);
    pos.setY(i, h);

    const sl = slopeAt(x, z);
    const tea = teaMask(x, z);
    const vil = villageMask(x, z);
    const sd = streamDist(x, z);
    const pd = Math.hypot(x - POND.x, z - POND.z);

    c.copy(GRASS);
    // the worked floor between the tea rows
    if (tea > 0.3) c.lerp(TEAFLOOR, tea * 0.55);
    // risers and steep ground show their earth
    c.lerp(EARTH, Math.min(1, sl * 1.7));
    if (sl > 0.5) c.lerp(EARTH_DEEP, (sl - 0.5) * 1.4);
    // the village is trodden bare
    if (vil > 0.2) c.lerp(new THREE.Color('#cfae7e'), vil * 0.55);
    if (pathDist(x, z) < 2.6) c.lerp(EARTH_DEEP, 0.55 * (1 - pathDist(x, z) / 2.6));
    // pebbles along the water, sand at the pond
    if (sd < 5) c.lerp(ROCKC, (1 - sd / 5) * 0.65);
    if (pd < POND.r * 1.6) c.lerp(SAND, (1 - pd / (POND.r * 1.6)) * 0.7);
    // high ground goes dry and pale
    if (h > 22) c.lerp(GRASS_DRY, Math.min(0.6, (h - 22) / 22));
    // a little variation so it is not a flat field of colour
    const v = 0.93 + 0.14 * (Math.sin(x * 0.7) * Math.sin(z * 0.63) * 0.5 + 0.5);
    c.multiplyScalar(v).convertSRGBToLinear();

    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    emit[i] = 0;
  }
  geo.setAttribute('aCol', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('aEmit', new THREE.BufferAttribute(emit, 1));
  geo.deleteAttribute('uv');
  geo.computeVertexNormals();

  const mat = jellyMaterial({ vcol: true, colour: '#ffffff', gloss: 0.12, thick: 0.35, rim: 0.1, wrap: 0.85 });
  (mat.uniforms.uBounds.value as THREE.Vector2).set(0, 1);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  return mesh;
}

/* ───────── water ───────── */

export function waterMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: U.uTime, uSunDir: U.uSunDir, uSunCol: U.uSunCol, uSkyCol: U.uSkyCol,
      uFogCol: U.uFogCol, uFogNear: U.uFogNear, uFogFar: U.uFogFar,
      uShallow: { value: new THREE.Color('#8fe6f2') },
      uDeep: { value: new THREE.Color('#2f9fc9') },
    },
    vertexShader: /* glsl */ `
      uniform float uTime;
      varying vec3 vW;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        vec3 p = position;
        p.y += sin(p.x * 1.6 + uTime * 2.4) * 0.035 + sin(p.z * 2.1 - uTime * 1.7) * 0.03;
        vec4 wp = modelMatrix * vec4(p, 1.0);
        vW = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform vec3 uSunDir, uSunCol, uSkyCol, uFogCol, uShallow, uDeep;
      uniform float uFogNear, uFogFar;
      varying vec3 vW;
      varying vec2 vUv;
      void main() {
        // a couple of crossing ripples stand in for a normal map
        float r = sin(vW.x * 2.6 + uTime * 2.0) * sin(vW.z * 3.1 - uTime * 1.5);
        vec3 N = normalize(vec3(r * 0.22, 1.0, r * 0.18));
        vec3 V = normalize(cameraPosition - vW);
        vec3 L = normalize(uSunDir);
        float fres = pow(1.0 - max(dot(N, V), 0.0), 2.6);
        vec3 col = mix(uDeep, uShallow, 0.35 + 0.4 * r);
        col = mix(col, uSkyCol, fres * 0.75);
        vec3 H = normalize(L + V);
        col += uSunCol * pow(max(dot(N, H), 0.0), 120.0) * 1.1;
        float d = length(vW - cameraPosition);
        col = mix(col, uFogCol, smoothstep(uFogNear, uFogFar, d));
        gl_FragColor = vec4(col, 0.86);
        #include <colorspace_fragment>
      }
    `,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
}

/** The pond below the village and the stream that feeds it. */
export function buildWater(parent: THREE.Object3D): THREE.Mesh[] {
  const mat = waterMaterial();
  const out: THREE.Mesh[] = [];

  const pond = new THREE.Mesh(new THREE.CircleGeometry(POND.r * 1.35, 40, 0, Math.PI * 2).rotateX(-Math.PI / 2), mat);
  pond.position.set(POND.x, heightAt(POND.x, POND.z) + 0.55, POND.z);
  parent.add(pond); out.push(pond);

  // the stream as a ribbon of quads following its course down the hill
  const verts: number[] = [], uvs: number[] = [], idx: number[] = [];
  const W = 1.15;
  for (let i = 0; i < STREAM.length; i++) {
    const [x, z] = STREAM[i];
    const [px, pz] = STREAM[Math.max(0, i - 1)];
    const [nx2, nz2] = STREAM[Math.min(STREAM.length - 1, i + 1)];
    const dx = nx2 - px, dz = nz2 - pz;
    const l = Math.hypot(dx, dz) || 1;
    const sx = -dz / l * W, sz = dx / l * W;
    const y = heightAt(x, z) + 0.2;
    verts.push(x - sx, y, z - sz, x + sx, y, z + sz);
    uvs.push(0, i / STREAM.length, 1, i / STREAM.length);
    if (i < STREAM.length - 1) {
      const a = i * 2;
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  sg.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  sg.setIndex(idx);
  sg.computeVertexNormals();
  const stream = new THREE.Mesh(sg, mat);
  parent.add(stream); out.push(stream);
  return out;
}

/* ───────── the garden ───────── */

export interface Garden {
  bushes: THREE.InstancedMesh;
  buds: THREE.InstancedMesh;
  weeds: THREE.InstancedMesh;
  jig: JigBank;
  /** Rewrite one bush's matrix and tint after its state changes. */
  refresh: (i: number) => void;
  refreshAll: () => void;
  /** Pack the sprigs and weeds into the front of their buffers and draw only those. */
  repack: () => void;
}

const dummy = new THREE.Object3D();
const tint = new THREE.Color();

/**
 * Every bush on the estate in three instanced meshes: the bush itself, the
 * pale sprig that shows a flush is ready, and the weeds that creep in when
 * nobody has been down the row.
 */
export function buildGarden(parent: THREE.Object3D, estate: Estate, q: Quality): Garden {
  const spots = layOutGarden(q === 'high' ? 2000 : 760);
  const rng = mulberry(4242);
  estate.bushes = spots.map((s) => makeBush(s.x, s.z, s.y, s.row, rng() > 0.16, 0.45 + rng() * 0.55));
  const n = estate.bushes.length;

  const bgeo = teaBush();
  const bmat = jellyMaterial({ vcol: true, colour: '#ffffff', gloss: 0.62, thick: 0.95, rim: 0.4, wrap: 0.8, instanced: true, wind: 0.55 });
  setBounds(bmat, bgeo);
  const jig = new JigBank(bgeo, n, 150, 7);
  const bushes = new THREE.InstancedMesh(bgeo, bmat, n);
  bushes.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(n * 3).fill(1), 3);
  bushes.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  bushes.frustumCulled = false;
  parent.add(bushes);

  const budGeo = budTuft();
  const budMat = jellyMaterial({ vcol: true, colour: '#ffffff', gloss: 0.9, thick: 1.1, rim: 0.55, wrap: 0.9, instanced: true, wind: 0.9 });
  setBounds(budMat, budGeo);
  new JigBank(budGeo, n, 150, 7);
  const buds = new THREE.InstancedMesh(budGeo, budMat, n);
  buds.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  buds.frustumCulled = false;
  parent.add(buds);

  const wGeo = weedTuft();
  const wMat = jellyMaterial({ vcol: true, colour: '#ffffff', gloss: 0.6, thick: 0.9, rim: 0.35, instanced: true, wind: 1.1 });
  setBounds(wMat, wGeo);
  new JigBank(wGeo, n, 150, 7);
  const weeds = new THREE.InstancedMesh(wGeo, wMat, n);
  weeds.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  weeds.frustumCulled = false;
  parent.add(weeds);

  const spin = estate.bushes.map(() => rng() * Math.PI * 2);
  const fat = estate.bushes.map(() => 0.9 + rng() * 0.25);

  const refresh = (i: number) => {
    const b = estate.bushes[i];
    const s = b.planted ? (0.42 + b.age * 0.85) * fat[i] * (1 + b.bushy * 0.18) : 0.0001;
    dummy.position.set(b.x, b.y, b.z);
    dummy.rotation.set(0, spin[i], 0);
    dummy.scale.set(s, s * (1 + b.bushy * 0.25), s);
    dummy.updateMatrix();
    bushes.setMatrixAt(i, dummy.matrix);

    // colour says how the bush is doing: yellow when dry, grey under weeds
    tint.setRGB(1, 1, 1);
    if (b.planted) {
      const dry = 1 - b.water;
      tint.setRGB(1 + dry * 0.35, 1 - dry * 0.12, 1 - dry * 0.45);
      tint.offsetHSL(0, -b.weeds * 0.25, -b.weeds * 0.06);
      if (b.age < 0.5) tint.offsetHSL(0.02, 0.08, 0.06);
    }
    bushes.setColorAt(i, tint);
  };

  /**
   * Only a few bushes are in flush or under weeds at any moment, so rather
   * than keep a thousand instances scaled down to nothing, write the live
   * ones into the front of the buffer and draw just that many.
   */
  const repack = () => {
    let nb = 0, nw = 0;
    for (let i = 0; i < n; i++) {
      const b = estate.bushes[i];
      if (!b.planted) continue;
      const s = (0.42 + b.age * 0.85) * fat[i];
      if (b.flush >= 1) {
        dummy.position.set(b.x, b.y, b.z);
        dummy.rotation.set(0, spin[i], 0);
        dummy.scale.set(s, s, s);
        dummy.updateMatrix();
        buds.setMatrixAt(nb++, dummy.matrix);
      }
      if (b.weeds > 0.45) {
        const w = 0.6 + b.weeds * 0.85;
        dummy.position.set(b.x + 0.4, b.y, b.z + 0.24);
        dummy.rotation.set(0, spin[i] * 1.7, 0);
        dummy.scale.set(w, w, w);
        dummy.updateMatrix();
        weeds.setMatrixAt(nw++, dummy.matrix);
      }
    }
    buds.count = nb;
    weeds.count = nw;
    buds.instanceMatrix.needsUpdate = true;
    weeds.instanceMatrix.needsUpdate = true;
  };

  const refreshAll = () => {
    for (let i = 0; i < n; i++) refresh(i);
    bushes.instanceMatrix.needsUpdate = true;
    if (bushes.instanceColor) bushes.instanceColor.needsUpdate = true;
    repack();
  };
  refreshAll();

  return { bushes, buds, weeds, jig, refresh, refreshAll, repack };
}

/* ───────── instanced scenery ───────── */

function scatterMesh(
  parent: THREE.Object3D, geo: THREE.BufferGeometry, places: [number, number][],
  o: { wind?: number; scale?: [number, number]; gloss?: number; seed?: number } = {},
): THREE.InstancedMesh | null {
  if (!places.length) return null;
  const mat = jellyMaterial({ vcol: true, colour: '#ffffff', gloss: o.gloss ?? 0.65, thick: 0.9, rim: 0.36, wrap: 0.78, instanced: true, wind: o.wind ?? 0 });
  setBounds(mat, geo);
  new JigBank(geo, places.length, 140, 7);
  const m = new THREE.InstancedMesh(geo, mat, places.length);
  const rng = mulberry(o.seed ?? 99);
  const [lo, hi] = o.scale ?? [0.9, 1.2];
  for (let i = 0; i < places.length; i++) {
    const [x, z] = places[i];
    const s = lo + rng() * (hi - lo);
    dummy.position.set(x, heightAt(x, z) - 0.1, z);
    dummy.rotation.set(0, rng() * 6.283, 0);
    dummy.scale.set(s, s * (0.9 + rng() * 0.25), s);
    dummy.updateMatrix();
    m.setMatrixAt(i, dummy.matrix);
  }
  m.frustumCulled = false;
  parent.add(m);
  return m;
}

/** The trees, rocks and flowers that make it a hill station and not a lawn. */
export function buildNature(parent: THREE.Object3D, q: Quality) {
  const far = (x: number, z: number) => Math.hypot(x - VILLAGE.x, z - VILLAGE.z) > VILLAGE.r * 0.72;
  const open = (x: number, z: number) =>
    Math.abs(x) < WORLD && Math.abs(z) < WORLD && far(x, z) && pathDist(x, z) > 3.5 && streamDist(x, z) > 3 && slopeAt(x, z) < 0.65;

  const k = q === 'high' ? 1 : 0.6;

  // conifers along the estate roads and over the ridge
  scatterMesh(parent, pine(6), scatter(Math.round(64 * k), 11, (x, z) => open(x, z) && (forestMask(x, z) > 0.4 || (teaMask(x, z) < 0.3 && z < 20))), { wind: 0.3, scale: [0.8, 1.5], seed: 1 });
  // the shola in the fold of the hill
  scatterMesh(parent, sholaTree(5), scatter(Math.round(46 * k), 22, (x, z) => open(x, z) && forestMask(x, z) > 0.5), { wind: 0.35, scale: [0.85, 1.4], seed: 2 });
  // silver oak standing over the tea, which is how it is really grown
  scatterMesh(parent, shadeTree(7), scatter(Math.round(30 * k), 33, (x, z) => open(x, z) && teaMask(x, z) > 0.8), { wind: 0.4, scale: [0.9, 1.3], seed: 3 });
  scatterMesh(parent, rock(0.7), scatter(Math.round(44 * k), 44, (x, z) => Math.abs(x) < WORLD && Math.abs(z) < WORLD && far(x, z) && (slopeAt(x, z) > 0.3 || streamDist(x, z) < 6)), { scale: [0.6, 1.8], gloss: 0.5, seed: 4 });
  for (const [col, seed] of [[JELLY.rose, 55], [JELLY.marigold, 66], [JELLY.plum, 77]] as [string, number][]) {
    scatterMesh(parent, flower(col), scatter(Math.round(34 * k), seed, (x, z) => Math.abs(x) < WORLD && Math.abs(z) < WORLD && slopeAt(x, z) < 0.4 && (villageMask(x, z) > 0.1 || streamDist(x, z) < 8 || pathDist(x, z) < 6)), { wind: 1.2, scale: [0.8, 1.5], seed });
  }
}

/* ───────── the village ───────── */

export interface Village {
  props: Prop[];
  byId: Map<string, Prop>;
  /** Things that are only shown once some work has been done. */
  show: (id: string, on: boolean) => void;
  lamps: { spot: Spot; mesh: THREE.Mesh; mat: JellyMaterial }[];
  washing: THREE.Object3D[];
  chests: THREE.Object3D[];
  heaps: THREE.Object3D[];
}

function spot(estate: Estate, id: string, kind: SpotKind, x: number, z: number, r = 2.4): Spot {
  const s: Spot = { id, kind, x, z, y: heightAt(x, z), r };
  estate.spots.push(s);
  return s;
}

/**
 * The village on its bench: three cottages, the factory sheds, the stall, the
 * cow, the shrine, and all the small places where a chore happens.
 */
export function buildVillage(parent: THREE.Object3D, estate: Estate): Village {
  const props: Prop[] = [];
  const byId = new Map<string, Prop>();
  const P = (id: string, geo: THREE.BufferGeometry, x: number, z: number, o: Parameters<typeof addProp>[4] = {}) => {
    const p = addProp(parent, geo, x, z, o);
    props.push(p); byId.set(id, p);
    return p;
  };

  // ── homes ──
  P('house1', cottage(4.4, 3.6, JELLY.cream, JELLY.tin), -15, 44, { rotY: 0.25 });
  P('house2', cottage(4.0, 3.2, '#ffd7c2', JELLY.tinRust), -21, 31, { rotY: 1.1 });
  P('house3', cottage(4.6, 3.4, '#e8f0d8', JELLY.tin), 15, 46, { rotY: -0.35 });

  // ── the factory end ──
  P('witherShed', shed(11, 6, 2.8), -11, 16, { rotY: 0.08 });
  P('trough1', witherTrough(), -14, 15.2, { rotY: 0.08 });
  P('trough2', witherTrough(), -8, 15.2, { rotY: 0.08 });
  P('roller', rollTable(), -11, 18.4);
  P('muster', shed(7, 4.6, 2.6, JELLY.tinRust), 3, 20, { rotY: -0.1 });
  P('scale', weighScale(), 3, 19.4, { rotY: -0.1 });
  const chests: THREE.Object3D[] = [];
  for (let i = 0; i < 6; i++) {
    const p = P(`chest${i}`, teaChest(), 6.4 + (i % 3) * 0.85, 21.6 + Math.floor(i / 3) * 0.85, { rotY: i * 0.3, y: heightAt(6.4, 21.6) });
    p.mesh.visible = false;
    chests.push(p.mesh);
  }

  // ── the stall, the shrine and the cow ──
  P('stall', chaiStall(), 6, 37, { rotY: Math.PI + 0.2 });
  P('shrine', shrine(), 21, 34, { rotY: -0.6 });
  P('cowshed', shed(5.5, 4, 2.4, JELLY.tinRust), 19, 21, { rotY: 0.5 });
  P('tank', waterTank(), 11, 28, {});
  P('block', choppingBlock(), 23, 42, {});
  const woodY = heightAt(25.4, 43.6);
  for (let i = 0; i < 9; i++) {
    const row = Math.floor(i / 3), col = i % 3;
    P(`log${i}`, log(0.9), 25.4 + (row % 2) * 0.12, 43.6 + (col - 1) * 0.3,
      { rotY: 0.2, y: woodY + 0.14 + row * 0.26 });
  }
  P('gate', gateArch(), 0, 58, {});
  P('sign', signboard(), -4, 55, { rotY: 0.3 });

  // the nursery bed, the tool rack
  const nurse = kit();
  nurse.add(roundBox(4.2, 0.35, 2.2, 0.1, 2), JELLY.woodDark, { pos: [0, 0.17, 0] });
  nurse.add(roundBox(3.9, 0.2, 1.9, 0.08, 2), JELLY.earthDeep, { pos: [0, 0.34, 0] });
  const nurseGeo = nurse.build();
  P('nursery', nurseGeo, -4, 26, { rotY: 0.1 });
  for (let i = 0; i < 10; i++) P(`sap${i}`, sapling(), -5.6 + (i % 5) * 0.8, 25.4 + Math.floor(i / 5) * 0.9, { y: heightAt(-4, 26) + 0.44, scale: 0.9 });

  const rack = kit();
  rack.add(roundBox(0.2, 1.9, 0.2, 0.07, 2), JELLY.woodDark, { pos: [-1.1, 0.95, 0] });
  rack.add(roundBox(0.2, 1.9, 0.2, 0.07, 2), JELLY.woodDark, { pos: [1.1, 0.95, 0] });
  rack.add(roundBox(2.5, 0.16, 0.18, 0.06, 2), JELLY.wood, { pos: [0, 1.8, 0] });
  const rackGeo = rack.build();
  P('rack', rackGeo, -7, 23.5, { rotY: 0.4 });

  // ── the washing line ──
  const washing: THREE.Object3D[] = [];
  const lineGeo = kit()
    .add(cyl(0.06, 0.08, 2.2, 7), JELLY.woodDark, { pos: [-2.4, 1.1, 0] })
    .add(cyl(0.06, 0.08, 2.2, 7), JELLY.woodDark, { pos: [2.4, 1.1, 0] })
    .add(roundBox(4.9, 0.05, 0.05, 0.02, 1), JELLY.cream, { pos: [0, 2.14, 0] })
    .build();
  P('line', lineGeo, -24, 38, { rotY: 0.5 });
  const lineY = heightAt(-24, 38);
  const cols = [JELLY.rose, JELLY.sky, JELLY.lemon, JELLY.mint];
  for (let i = 0; i < 4; i++) {
    const t = (i - 1.5) * 1.1;
    const p = P(`wash${i}`, washing_(cols[i]), -24 + Math.cos(0.5) * t, 38 + Math.sin(0.5) * t, { rotY: 0.5, y: lineY + 2.1 });
    p.mesh.visible = false;
    washing.push(p.mesh);
  }

  // ── leaf in the troughs, shown once it has been spread ──
  const heaps: THREE.Object3D[] = [];
  for (const [i, x] of ([-14, -8] as number[]).entries()) {
    const p = P(`heap${i}`, leafHeap(), x, 15.2, { rotY: 0.08 });
    p.mesh.visible = false;
    heaps.push(p.mesh);
  }

  // ── fences along the yard edge ──
  for (let i = 0; i < 9; i++) {
    const a = -0.9 + i * 0.22;
    const x = VILLAGE.x + Math.cos(a) * 29, z = VILLAGE.z + Math.sin(a) * 29;
    P(`fence${i}`, fence(2.4), x, z, { rotY: -a + Math.PI / 2 });
  }

  // ── steps up the path into the garden ──
  for (let i = 0; i < PATH.length - 1; i++) {
    const [ax, az] = PATH[i], [bx, bz] = PATH[i + 1];
    const n = 7;
    for (let j = 0; j < n; j++) {
      const t = j / n;
      const x = ax + (bx - ax) * t, z = az + (bz - az) * t;
      if (slopeAt(x, z) < 0.16) continue;
      P(`step${i}_${j}`, stepStone(1.6), x, z, { rotY: Math.atan2(bx - ax, bz - az) });
    }
  }

  // ── lamps along the path and round the yard ──
  const lamps: Village['lamps'] = [];
  const lampAt: [number, number][] = [[-5, 50], [5, 43], [-9, 34], [10, 32], [-5, 21], [17, 39], [-19, 40], [-9, 8], [-18, -10]];
  lampAt.forEach(([x, z], i) => {
    const p = P(`lamp${i}`, lantern(), x, z, { stiff: 90 });
    const s = spot(estate, `lamp${i}`, 'lantern', x, z, 2.0);
    lamps.push({ spot: s, mesh: p.mesh, mat: p.mesh.material as JellyMaterial });
    (p.mesh.material as JellyMaterial).uniforms.uEmit.value = 0;
  });

  // ── the places where chores happen ──
  spot(estate, 'nursery', 'nursery', -4, 26, 3.0);
  spot(estate, 'rack', 'toolrack', -7, 23.5, 2.6);
  spot(estate, 'tap', 'tap', 11, 29.6, 2.6);
  spot(estate, 'weigh', 'weigh', 3, 19.4, 3.0);
  spot(estate, 'wither', 'wither', -11, 14.4, 3.4);
  spot(estate, 'roll', 'roll', -11, 18.4, 2.8);
  spot(estate, 'dry', 'dry', -7.5, 18.6, 2.4);
  spot(estate, 'pack', 'pack', 6.6, 21.8, 2.8);
  spot(estate, 'cow', 'cow', 19, 22.6, 3.0);
  spot(estate, 'coop', 'coop', 16, 50, 3.0);
  spot(estate, 'chai', 'chai', 5, 38.6, 2.4);
  spot(estate, 'serve', 'serve', 7.6, 35.6, 2.4);
  spot(estate, 'shop', 'shop', 8.6, 38.4, 2.2);
  spot(estate, 'chop', 'chop', 23, 42, 2.4);
  spot(estate, 'woodpile', 'woodpile', 25.4, 43.6, 2.4);
  spot(estate, 'line', 'line', -24, 38, 3.0);
  spot(estate, 'bell', 'bell', 21, 36.2, 2.4);
  spot(estate, 'bed', 'bed', -15, 46.4, 2.6);
  spot(estate, 'spring', 'spring', 0, 17, 3.0);
  spot(estate, 'sweep1', 'sweep', 0, 32, 2.6);
  spot(estate, 'sweep2', 'sweep', -10, 40, 2.6);
  spot(estate, 'sweep3', 'sweep', 12, 42, 2.6);

  // the drier, a squat brick thing beside the roller
  P('drier', kit()
    .add(roundBox(2.0, 1.6, 1.4, 0.12, 2), JELLY.brick, { pos: [0, 0.8, 0] })
    .add(cyl(0.22, 0.26, 1.4, 9, 0.05), JELLY.coal, { pos: [0.7, 2.2, 0] })
    .add(roundBox(1.2, 0.7, 0.1, 0.05, 2), JELLY.coal, { pos: [0, 0.6, 0.72] })
    .add(blob(0.44, 0.26, 0.1, 2), JELLY.orange, { pos: [0, 0.5, 0.74], emit: 0.8 })
    .build(), -7.5, 18.6, { rotY: -0.3 });

  // the hen coop
  P('coop', kit()
    .add(roundBox(2.2, 1.2, 1.6, 0.12, 2), JELLY.wood, { pos: [0, 0.6, 0] })
    .add(roundBox(2.5, 0.12, 1.9, 0.06, 2), JELLY.tinRust, { pos: [0, 1.3, 0], rot: [0.2, 0, 0] })
    .add(cyl(0.34, 0.34, 0.1, 12), JELLY.coal, { pos: [0, 0.6, 0.82], rot: [Math.PI / 2, 0, 0] })
    .build(), 16, 50, { rotY: 0.4 });

  const show = (id: string, on: boolean) => { const p = byId.get(id); if (p) p.mesh.visible = on; };
  return { props, byId, show, lamps, washing, chests, heaps };
}

// a tiny alias so the import list reads straight
function washing_(colour: string) { return washing(colour); }

/* ───────── sky, ridges and cloud ───────── */

/** The blue ranges behind the estate, flattened by haze: the view people come for. */
export function buildRidges(parent: THREE.Object3D) {
  const layers = [
    { d: 420, h: 95, c: '#8fb3cc', seed: 5 },
    { d: 620, h: 130, c: '#a8c3d6', seed: 6 },
    { d: 880, h: 175, c: '#c2d6e2', seed: 7 },
  ];
  for (const L of layers) {
    const rng = mulberry(L.seed);
    const verts: number[] = [], idx: number[] = [];
    const n = 90;
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2;
      const x = Math.cos(a) * L.d, z = Math.sin(a) * L.d;
      const peak = L.h * (0.42 + 0.58 * (0.5 + 0.5 * Math.sin(a * 3.1 + L.seed) * Math.sin(a * 7.3 + 1.2)) + rng() * 0.12);
      verts.push(x, -40, z, x, peak, z);
      if (i < n) { const b = i * 2; idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    g.setIndex(idx);
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: L.c, side: THREE.DoubleSide, fog: false, depthWrite: false }));
    m.renderOrder = -900;
    m.frustumCulled = false;
    parent.add(m);
  }
}

export { skyDome, blobShadowMaterial };
