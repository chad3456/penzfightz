import * as THREE from 'three';
import { BT, DRIVABLE, RC, type Building, type City, type Piece } from './data';
import { BUILDING_FS, BUILDING_VS, LIGHT_GLSL, ROAD_FS, ROAD_VS, U, simpleMaterial } from './shaders';

/**
 * The city's geometry, built tile by tile around the player from the baked
 * map: the ground, the Mula and the Mutha, every road and flyover, every
 * building footprint, the trees, the street lamps, the shop boards and the
 * black water tanks on the roofs.
 */

export const TILE = 256;

const hash = (n: number) => { n = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b); n ^= n >>> 13; n = Math.imul(n, 0xc2b2ae35); n ^= n >>> 16; return (n >>> 0) / 4294967296; };

// ------------------------------------------------------------------ palettes (display colours)
const PAL: Record<number, [number, number, number][]> = {
  [BT.house]: [[0.86, 0.82, 0.72], [0.92, 0.86, 0.62], [0.88, 0.74, 0.62], [0.74, 0.82, 0.86], [0.8, 0.86, 0.74], [0.9, 0.9, 0.86], [0.86, 0.7, 0.72]],
  [BT.apartment]: [[0.88, 0.86, 0.8], [0.9, 0.85, 0.7], [0.92, 0.86, 0.62], [0.9, 0.76, 0.62], [0.86, 0.74, 0.74], [0.72, 0.8, 0.86], [0.74, 0.84, 0.76], [0.74, 0.73, 0.7], [0.94, 0.92, 0.88], [0.82, 0.62, 0.48]],
  [BT.wada]: [[0.84, 0.78, 0.64], [0.78, 0.64, 0.46], [0.62, 0.72, 0.82], [0.88, 0.84, 0.74], [0.72, 0.52, 0.4], [0.86, 0.8, 0.56]],
  [BT.colonial]: [[0.42, 0.4, 0.38], [0.48, 0.45, 0.42], [0.86, 0.8, 0.64], [0.8, 0.72, 0.56]],
  [BT.temple]: [[0.95, 0.93, 0.88], [0.94, 0.7, 0.36], [0.9, 0.86, 0.78]],
  [BT.shed]: [[0.6, 0.62, 0.64], [0.5, 0.58, 0.68], [0.66, 0.6, 0.52], [0.72, 0.72, 0.7]],
  [BT.campus]: [[0.44, 0.42, 0.4], [0.86, 0.8, 0.66], [0.82, 0.62, 0.48], [0.9, 0.88, 0.82]],
  [BT.tower]: [[0.9, 0.9, 0.88], [0.66, 0.72, 0.76], [0.84, 0.8, 0.72], [0.76, 0.7, 0.62], [0.94, 0.94, 0.92]],
  [BT.vasti]: [[0.62, 0.46, 0.38], [0.42, 0.56, 0.76], [0.62, 0.62, 0.62], [0.74, 0.7, 0.62], [0.5, 0.66, 0.6], [0.8, 0.5, 0.4]],
  [BT.commercial]: [[0.9, 0.9, 0.88], [0.86, 0.82, 0.74], [0.7, 0.74, 0.78], [0.86, 0.66, 0.5], [0.94, 0.9, 0.76]],
  [BT.bungalow]: [[0.94, 0.92, 0.86], [0.92, 0.86, 0.7], [0.84, 0.6, 0.46], [0.9, 0.8, 0.66]],
};

// ------------------------------------------------------------------ shared materials
export function makeMaterials(ground: HTMLImageElement) {
  const building = new THREE.ShaderMaterial({ uniforms: U, vertexShader: BUILDING_VS, fragmentShader: BUILDING_FS });
  const road = new THREE.ShaderMaterial({
    uniforms: U, vertexShader: ROAD_VS, fragmentShader: ROAD_FS,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4,
  });
  const gtex = new THREE.Texture(ground);
  gtex.colorSpace = THREE.NoColorSpace; gtex.anisotropy = 4; gtex.needsUpdate = true;
  gtex.generateMipmaps = true; gtex.minFilter = THREE.LinearMipmapLinearFilter;
  const terrain = new THREE.ShaderMaterial({
    uniforms: { ...U, uMap: { value: gtex } },
    vertexShader: /* glsl */ `
      varying vec2 vUv; varying vec3 vW; varying vec3 vN;
      void main(){ vUv = uv; vN = normal; vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */ `
      ${LIGHT_GLSL}
      uniform sampler2D uMap; varying vec2 vUv; varying vec3 vW; varying vec3 vN;
      void main(){
        vec3 c = texture2D(uMap, vUv).rgb;
        float d = vnoise(vW.xz * 0.35) * 0.6 + vnoise(vW.xz * 1.7) * 0.4;
        c *= 0.82 + 0.3 * d;
        // litter-and-dust speckle up close
        c = mix(c, c * vec3(1.1, 1.05, 0.95), step(0.93, hash12(floor(vW.xz * 3.0))) * 0.5);
        vec3 lit = shade(c, normalize(vN), 1.0);
        gl_FragColor = vec4(fogged(lit, vW), 1.0);
        #include <colorspace_fragment>
      }`,
  });
  const water = new THREE.ShaderMaterial({
    uniforms: U, transparent: false,
    vertexShader: /* glsl */ `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */ `
      ${LIGHT_GLSL}
      varying vec3 vW;
      void main(){
        vec2 p = vW.xz;
        float t = uTime;
        vec2 g = vec2(vnoise(p * 0.25 + vec2(t * 0.15, 0.0)) - vnoise(p * 0.25 + vec2(0.0, t * 0.12)),
                      vnoise(p * 0.6 - vec2(t * 0.2, t * 0.05)) - 0.5) * 0.25;
        g += (vec2(vnoise(p * 3.0 + t), vnoise(p * 3.0 - t)) - 0.5) * 0.08 * (1.0 + uRain * 3.0);
        vec3 n = normalize(vec3(g.x, 1.0, g.y));
        vec3 V = normalize(uCam - vW);
        float fres = pow(1.0 - max(dot(n, V), 0.0), 4.0);
        // the Mula-Mutha is murky green-brown
        vec3 deep = vec3(0.24, 0.3, 0.24);
        vec3 col = L(deep) * (L(uSky) * 0.6 + L(uSunCol) * 0.3);
        col = mix(col, L(uSky) * 0.85, 0.15 + 0.6 * fres);
        // rafts of water hyacinth drifting on it
        float hy = smoothstep(0.62, 0.7, vnoise(p * 0.045 + vec2(t * 0.004, 0.0)) * 0.7 + vnoise(p * 0.3) * 0.3);
        vec3 leaf = L(vec3(0.3, 0.45, 0.2)) * (0.6 + 0.6 * vnoise(p * 2.0));
        leaf = shade(vec3(0.3, 0.45, 0.2) * (0.7 + 0.5 * vnoise(p * 2.0)), vec3(0.0, 1.0, 0.0), 1.0);
        vec3 H = normalize(V + uSunDir);
        float spec = pow(max(dot(n, H), 0.0), 120.0) * (1.0 - uNight);
        col += L(uSunCol) * spec * 1.5;
        col = mix(col, leaf, hy * 0.92);
        col *= 1.0 - 0.6 * uNight;
        gl_FragColor = vec4(fogged(col, vW), 1.0);
        #include <colorspace_fragment>
      }`,
  });
  const concrete = simpleMaterial({ side: THREE.DoubleSide });
  const plain = simpleMaterial();
  const lamp = simpleMaterial({ emit: 0 });
  const signTex = makeSignAtlas();
  const sign = new THREE.ShaderMaterial({
    uniforms: { ...U, uMap: { value: signTex } },
    vertexShader: /* glsl */ `varying vec2 vUv; varying vec3 vW; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */ `
      ${LIGHT_GLSL}
      uniform sampler2D uMap; varying vec2 vUv; varying vec3 vW;
      void main(){
        vec3 c = texture2D(uMap, vUv).rgb;
        vec3 lit = L(c) * (L(uSky) * 0.5 + L(uSunCol) * 0.6) * (1.0 - 0.75 * uNight) + L(c) * uNight * 0.9;
        gl_FragColor = vec4(fogged(lit, vW), 1.0);
        #include <colorspace_fragment>
      }`,
    side: THREE.DoubleSide,
  });
  const glow = new THREE.ShaderMaterial({
    uniforms: { ...U, uScale: { value: 400 }, uGlow: { value: 0 } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      attribute vec3 aCol; attribute float aSize; uniform float uScale; varying vec3 vC;
      void main(){ vC = aCol; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = clamp(uScale * aSize / -mv.z, 0.0, 160.0); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: /* glsl */ `
      uniform float uGlow; varying vec3 vC;
      void main(){ float d = length(gl_PointCoord - 0.5) * 2.0; float a = pow(max(0.0, 1.0 - d), 2.2); gl_FragColor = vec4(vC * a * uGlow, 1.0); }`,
  });
  return { building, road, terrain, water, concrete, plain, lamp, sign, signTex, glow };
}
export type Materials = ReturnType<typeof makeMaterials>;

// ------------------------------------------------------------------ shop boards
/** What Pune's ground floors say. Generic trades, no real shop names. */
export const SIGN_TEXTS: [string, string, string][] = [
  // [text, background, ink]
  ['अमृततुल्य चहा', '#f2c94c', '#7a1d10'], ['मिठाई भांडार', '#d7263d', '#fff6d6'], ['मेडिकल स्टोअर्स', '#1b7f4a', '#ffffff'],
  ['ज्वेलर्स', '#6b1d5c', '#ffd56b'], ['किराणा माल', '#2b59c3', '#ffffff'], ['XEROX', '#ffffff', '#1d3557'],
  ['मिसळ हाऊस', '#c1121f', '#ffe8a3'], ['वडापाव सेंटर', '#ff9f1c', '#3a0ca3'], ['सायकल मार्ट', '#0b6e4f', '#f6f7eb'],
  ['कापड दुकान', '#7b2cbf', '#ffffff'], ['बेकरी', '#8d5524', '#fff3e0'], ['जनरल स्टोअर्स', '#118ab2', '#ffffff'],
  ['MOBILE SHOP', '#ef233c', '#ffffff'], ['TAILORS', '#264653', '#e9c46a'], ['CLASSES · 10th & 12th', '#ffffff', '#c1121f'],
  ['SWEET MART', '#f4a261', '#3d0c02'], ['CHEMIST', '#2a9d8f', '#ffffff'], ['भेळ · पाणीपुरी', '#ffd60a', '#9d0208'],
  ['पुस्तके', '#3d405b', '#f4f1de'], ['हॉटेल', '#e63946', '#f1faee'], ['स्टेशनरी', '#457b9d', '#ffffff'],
  ['IRANI CAFE', '#f1faee', '#1d3557'], ['COLD DRINKS', '#e63946', '#ffffff'], ['भांडी', '#9c6644', '#ffffff'],
  ['ऑप्टिकल्स', '#003049', '#fcbf49'], ['FOOTWEAR', '#000000', '#ffd166'], ['डॉक्टर', '#ffffff', '#2b2d42'],
  ['ELECTRICALS', '#ffb703', '#023047'], ['पान शॉप', '#2d6a4f', '#d8f3dc'], ['साडी सेंटर', '#9d0208', '#ffba08'],
  ['HARDWARE', '#495057', '#ffffff'], ['डेअरी', '#caf0f8', '#03045e'], ['ढोल ताशा', '#370617', '#ffba08'],
  ['GARAGE', '#212529', '#f8f9fa'], ['फुले हार', '#ff006e', '#ffffff'], ['LAUNDRY', '#48cae4', '#03045e'],
  ['BANK', '#023e8a', '#ffffff'], ['ATM', '#e85d04', '#ffffff'], ['PHOTO STUDIO', '#000000', '#ffffff'],
  ['मंगल कार्यालय', '#f48c06', '#6a040f'], ['चष्मा घर', '#5a189a', '#ffffff'], ['आयुर्वेदिक', '#606c38', '#fefae0'],
  ['सोने चांदी', '#ffd60a', '#540b0e'], ['पेढे', '#ffe5b4', '#7f4f24'], ['उपहारगृह', '#bc4749', '#f2e8cf'],
  ['CYBER CAFE', '#14213d', '#fca311'], ['FURNITURE', '#7f5539', '#ede0d4'], ['TOURS & TRAVELS', '#0077b6', '#ffffff'],
];

function makeSignAtlas() {
  const cv = document.createElement('canvas');
  cv.width = 1024; cv.height = 1024;
  const g = cv.getContext('2d')!;
  const rows = 16, cols = 4, w = cv.width / cols, h = cv.height / rows;
  SIGN_TEXTS.forEach(([text, bg, ink], i) => {
    if (i >= rows * cols) return;
    const x = (i % cols) * w, y = Math.floor(i / cols) * h;
    g.fillStyle = bg; g.fillRect(x, y, w, h);
    g.strokeStyle = ink; g.lineWidth = 3; g.strokeRect(x + 5, y + 5, w - 10, h - 10);
    g.fillStyle = ink;
    const dev = /[ऀ-ॿ]/.test(text);
    let size = dev ? 34 : 30;
    g.font = `700 ${size}px ${dev ? '"Noto Serif Devanagari", "Noto Sans Devanagari", serif' : '"IBM Plex Mono", monospace'}`;
    while (g.measureText(text).width > w - 24 && size > 12) { size -= 2; g.font = `700 ${size}px ${dev ? '"Noto Serif Devanagari", serif' : '"IBM Plex Mono", monospace'}`; }
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text, x + w / 2, y + h / 2 + 2);
  });
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.NoColorSpace; t.anisotropy = 4;
  return t;
}

// ------------------------------------------------------------------ terrain + water
export function buildTerrain(city: City, mats: Materials) {
  const T = city.terrain;
  const geo = new THREE.BufferGeometry();
  const nx = T.nx, nz = T.nz;
  const pos = new Float32Array(nx * nz * 3), uv = new Float32Array(nx * nz * 2);
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const k = j * nx + i;
    pos[k * 3] = -T.hx + i * T.grid; pos[k * 3 + 1] = T.h[k] - 0.05; pos[k * 3 + 2] = -T.hz + j * T.grid;
    uv[k * 2] = i / (nx - 1); uv[k * 2 + 1] = 1 - j / (nz - 1);
  }
  const idx = new Uint32Array((nx - 1) * (nz - 1) * 6);
  let o = 0;
  for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) {
    const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1;
    idx[o++] = a; idx[o++] = c; idx[o++] = b; idx[o++] = b; idx[o++] = c; idx[o++] = d;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geo.setIndex(new THREE.BufferAttribute(idx, 1));
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, mats.terrain);
  m.frustumCulled = false;
  // a skirt of plain land beyond the map edge, so the world does not end in a cliff
  const skirt = new THREE.Mesh(new THREE.RingGeometry(Math.hypot(T.hx, T.hz) * 0.98, 30000, 64, 1).rotateX(-Math.PI / 2), simpleMaterial());
  const sc = new Float32Array(skirt.geometry.attributes.position.count * 3);
  for (let i = 0; i < sc.length; i += 3) { sc[i] = 0.6; sc[i + 1] = 0.55; sc[i + 2] = 0.42; }
  skirt.geometry.setAttribute('color', new THREE.BufferAttribute(sc, 3));
  skirt.position.y = 2;
  const g = new THREE.Group();
  g.add(m, skirt);
  return g;
}

export function buildWater(city: City, mats: Materials) {
  const T = city.terrain;
  const pos: number[] = [], idx: number[] = [];
  const addPoly = (outer: number[], holes: number[][], level?: number) => {
    const contour = [] as THREE.Vector2[];
    for (let i = 0; i < outer.length; i += 2) contour.push(new THREE.Vector2(outer[i] / 2, outer[i + 1] / 2));
    const hs = holes.map((h) => { const a: THREE.Vector2[] = []; for (let i = 0; i < h.length; i += 2) a.push(new THREE.Vector2(h[i] / 2, h[i + 1] / 2)); return a; });
    const faces = THREE.ShapeUtils.triangulateShape(contour, hs);
    const all = contour.concat(...hs);
    const base = pos.length / 3;
    for (const v of all) {
      let y = level ?? T.water(v.x, v.y);
      if (!isFinite(y)) y = T.height(v.x, v.y) + 1.5;
      pos.push(v.x, y, v.y);
    }
    for (const f of faces) idx.push(base + f[0], base + f[2], base + f[1]);
  };
  // subdivide long river edges so the level can follow the river downhill
  for (const [outer, holes] of city.water.rivers) addPoly(densify(outer, 24), holes.map((h) => densify(h, 24)));
  for (const p of city.water.ponds) for (const [outer, holes] of p.rings) {
    let mn = Infinity;
    for (let i = 0; i < outer.length; i += 2) mn = Math.min(mn, T.height(outer[i] / 2, outer[i + 1] / 2));
    addPoly(outer, holes, mn + 1.0);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  // make sure the triangles face up
  const p = geo.attributes.position.array as Float32Array;
  const ix = geo.index!.array as Uint32Array | Uint16Array;
  for (let i = 0; i < ix.length; i += 3) {
    const a = ix[i] * 3, b = ix[i + 1] * 3, c = ix[i + 2] * 3;
    const ux = p[b] - p[a], uz = p[b + 2] - p[a + 2], vx = p[c] - p[a], vz = p[c + 2] - p[a + 2];
    if (uz * vx - ux * vz < 0) { const t = ix[i + 1]; ix[i + 1] = ix[i + 2]; ix[i + 2] = t; }
  }
  const m = new THREE.Mesh(geo, mats.water);
  m.frustumCulled = false;
  return m;
}

function densify(flat: number[], step: number) {
  const out: number[] = [];
  const n = flat.length / 2;
  for (let i = 0; i < n; i++) {
    const ax = flat[i * 2], az = flat[i * 2 + 1], bx = flat[((i + 1) % n) * 2], bz = flat[((i + 1) % n) * 2 + 1];
    const L = Math.hypot(bx - ax, bz - az) / 2;
    const k = Math.max(1, Math.ceil(L / step));
    for (let j = 0; j < k; j++) out.push(ax + ((bx - ax) * j) / k, az + ((bz - az) * j) / k);
  }
  return out;
}

// ------------------------------------------------------------------ geometry buffers
export class Buf {
  pos: number[] = []; nor: number[] = []; uv: number[] = []; col: number[] = []; info: number[] = []; idx: number[] = []; road: number[] = [];
  v(x: number, y: number, z: number, nx: number, ny: number, nz: number, u: number, w: number) {
    this.pos.push(x, y, z); this.nor.push(nx, ny, nz); this.uv.push(u, w);
    return this.pos.length / 3 - 1;
  }
  geo(extra?: (g: THREE.BufferGeometry) => void) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    if (this.col.length) g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    if (this.info.length) g.setAttribute('aInfo', new THREE.Float32BufferAttribute(this.info, 4));
    if (this.road.length) g.setAttribute('aRoad', new THREE.Float32BufferAttribute(this.road, 2));
    g.setIndex(this.pos.length / 3 > 65535 ? new THREE.Uint32BufferAttribute(this.idx, 1) : new THREE.Uint16BufferAttribute(this.idx, 1));
    extra?.(g);
    g.computeBoundingSphere();
    return g;
  }
  get empty() { return this.idx.length === 0; }
}

/** Box helper for the plain/concrete buffers. */
export function box(b: Buf, cx: number, cy: number, cz: number, sx: number, sy: number, sz: number, c: [number, number, number], rot = 0) {
  const cs = Math.cos(rot), sn = Math.sin(rot);
  const P = (x: number, y: number, z: number) => [cx + x * cs - z * sn, cy + y, cz + x * sn + z * cs];
  const faces: [number[], number[][]][] = [
    [[0, 1, 0], [[-1, 1, -1], [-1, 1, 1], [1, 1, 1], [1, 1, -1]]],
    [[1, 0, 0], [[1, -1, -1], [1, 1, -1], [1, 1, 1], [1, -1, 1]]],
    [[-1, 0, 0], [[-1, -1, 1], [-1, 1, 1], [-1, 1, -1], [-1, -1, -1]]],
    [[0, 0, 1], [[1, -1, 1], [1, 1, 1], [-1, 1, 1], [-1, -1, 1]]],
    [[0, 0, -1], [[-1, -1, -1], [-1, 1, -1], [1, 1, -1], [1, -1, -1]]],
  ];
  for (const [n, vs] of faces) {
    const nx = n[0] * cs - n[2] * sn, nz = n[0] * sn + n[2] * cs;
    const i0 = b.pos.length / 3;
    for (const v of vs) { const p = P((v[0] * sx) / 2, (v[1] * sy) / 2, (v[2] * sz) / 2); b.v(p[0], p[1], p[2], nx, n[1], nz, 0, 0); b.col.push(...c); }
    b.idx.push(i0, i0 + 1, i0 + 2, i0, i0 + 2, i0 + 3);
  }
}

export function cyl(b: Buf, x: number, y0: number, z: number, r: number, h: number, c: [number, number, number], seg = 6) {
  const i0 = b.pos.length / 3;
  for (let i = 0; i <= seg; i++) {
    const a = (i / seg) * Math.PI * 2, cx = Math.cos(a), sz = Math.sin(a);
    b.v(x + cx * r, y0, z + sz * r, cx, 0, sz, 0, 0); b.col.push(...c);
    b.v(x + cx * r, y0 + h, z + sz * r, cx, 0, sz, 0, 0); b.col.push(...c);
  }
  for (let i = 0; i < seg; i++) { const a = i0 + i * 2; b.idx.push(a, a + 1, a + 3, a, a + 3, a + 2); }
  const top = b.v(x, y0 + h, z, 0, 1, 0, 0, 0); b.col.push(...c);
  for (let i = 0; i < seg; i++) { const a = i0 + i * 2 + 1; b.idx.push(top, a + 2, a); }
}

// ------------------------------------------------------------------ the tile index
export interface TileIndex { pieces: Map<number, Piece[]>; buildings: Map<number, Building[]>; trees: Map<number, number[]>; nx: number; nz: number }

export function tileKey(ix: number, iz: number) { return ix * 1000 + iz; }

export function indexTiles(city: City): TileIndex {
  const [HX, HZ] = city.meta.half;
  const nx = Math.ceil((2 * HX) / TILE), nz = Math.ceil((2 * HZ) / TILE);
  const T = (x: number, z: number) => tileKey(Math.floor((x + HX) / TILE), Math.floor((z + HZ) / TILE));
  const pieces = new Map<number, Piece[]>(), buildings = new Map<number, Building[]>(), trees = new Map<number, number[]>();
  const push = <V,>(m: Map<number, V[]>, k: number, v: V) => { let a = m.get(k); if (!a) m.set(k, (a = [])); a.push(v); };
  for (const p of city.roads.pieces) { const m = p.n >> 1; push(pieces, T(p.x[m], p.z[m]), p); }
  for (const b of city.buildings.list) push(buildings, T(b.cx, b.cz), b);
  for (let i = 0; i < city.trees.x.length; i++) push(trees, T(city.trees.x[i], city.trees.z[i]), i);
  return { pieces, buildings, trees, nx, nz };
}

// ------------------------------------------------------------------ build one tile
export interface Exclusion { x: number; z: number; r: number }

export function buildTile(city: City, idx: TileIndex, mats: Materials, ix: number, iz: number, excl: Exclusion[], detail: number) {
  const key = tileKey(ix, iz);
  const group = new THREE.Group();
  group.name = 'tile' + key;
  const T = city.terrain;

  // ---- roads
  const rb = new Buf(), cb = new Buf();
  for (const p of idx.pieces.get(key) ?? []) {
    if (p.cls === RC.metro) { buildMetro(p, cb, T); continue; }
    if (p.n < 2) continue;
    if (p.flags & 8 && !p.elevated) { /* underpass: drawn at grade */ }
    roadRibbon(p, rb, cb, T);
  }
  if (!rb.empty) { const m = new THREE.Mesh(rb.geo(), mats.road); m.renderOrder = 1; group.add(m); }

  // ---- buildings
  const bb = new Buf();
  const tanks: number[] = [];
  const signs = new Buf();
  for (const b of idx.buildings.get(key) ?? []) {
    let skip = false;
    for (const e of excl) if ((b.cx - e.x) ** 2 + (b.cz - e.z) ** 2 < e.r * e.r) { skip = true; break; }
    if (skip) continue;
    buildBuilding(b, bb, tanks, signs, detail);
  }
  if (!bb.empty) group.add(new THREE.Mesh(bb.geo(), mats.building));
  if (!signs.empty) group.add(new THREE.Mesh(signs.geo(), mats.sign));
  if (tanks.length) {
    const g = tankGeo();
    const im = new THREE.InstancedMesh(g, mats.plain, tanks.length / 4);
    const m4 = new THREE.Matrix4();
    for (let i = 0; i < tanks.length / 4; i++) { m4.makeScale(tanks[i * 4 + 3], tanks[i * 4 + 3], tanks[i * 4 + 3]).setPosition(tanks[i * 4], tanks[i * 4 + 1], tanks[i * 4 + 2]); im.setMatrixAt(i, m4); }
    im.computeBoundingSphere();
    group.add(im);
  }

  // ---- trees
  const tl = idx.trees.get(key);
  if (tl && tl.length) group.add(...buildTrees(city, tl, mats, excl));

  // ---- lamps along the busy roads
  const lb = new Buf(), lh = new Buf();
  const glow: number[] = [];
  for (const p of idx.pieces.get(key) ?? []) {
    if (p.cls > RC.tertiary || p.n < 2) continue;
    const step = 34;
    for (let s = 10 + (p.i % 3) * 7; s < p.len - 4; s += step) {
      const q = city.roads.pointAt(p, s, { x: 0, z: 0, y: 0, dx: 0, dz: 0 });
      const side = ((s / step) | 0) % 2 ? 1 : -1;
      const off = p.w / 2 + 0.6;
      const x = q.x - q.dz * off * side, z = q.z + q.dx * off * side;
      const y0 = p.elevated ? q.y : T.height(x, z);
      cyl(lb, x, y0, z, 0.09, 8.2, [0.42, 0.44, 0.45], 5);
      const ax = x + q.dz * side * 1.6, az = z - q.dx * side * 1.6;
      box(lb, (x + ax) / 2, y0 + 8.1, (z + az) / 2, 0.08, 0.08, 1.7, [0.42, 0.44, 0.45], Math.atan2(q.dx * side, q.dz * side) + Math.PI / 2);
      box(lh, ax, y0 + 7.95, az, 0.5, 0.18, 0.28, [1.0, 0.86, 0.55]);
      glow.push(ax, y0 + 7.75, az);
    }
  }
  if (!lb.empty) group.add(new THREE.Mesh(lb.geo(), mats.concrete));
  if (!lh.empty) { const m = new THREE.Mesh(lh.geo(), mats.lamp); m.name = 'lamps'; group.add(m); }
  if (glow.length) group.add(glowPoints(glow, [1.0, 0.72, 0.4], 9, mats));
  if (!cb.empty) group.add(new THREE.Mesh(cb.geo(), mats.concrete));
  return group;
}

/** Soft additive light dots: street lamps, headlights, temple bulbs. */
export function glowPoints(pos: number[], col: [number, number, number], size: number, mats: Materials) {
  const g = new THREE.BufferGeometry();
  const n = pos.length / 3;
  const c = new Float32Array(n * 3), s = new Float32Array(n);
  for (let i = 0; i < n; i++) { c[i * 3] = col[0]; c[i * 3 + 1] = col[1]; c[i * 3 + 2] = col[2]; s[i] = size; }
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aCol', new THREE.BufferAttribute(c, 3));
  g.setAttribute('aSize', new THREE.BufferAttribute(s, 1));
  g.computeBoundingSphere();
  const p = new THREE.Points(g, mats.glow);
  p.name = 'glow';
  return p;
}

const tankGeoCache: { g?: THREE.BufferGeometry } = {};
function tankGeo() {
  if (tankGeoCache.g) return tankGeoCache.g;
  const b = new Buf();
  cyl(b, 0, 0, 0, 0.55, 1.1, [0.1, 0.1, 0.1], 8);
  box(b, 0, -0.1, 0, 1.3, 0.2, 1.3, [0.5, 0.5, 0.48]);
  return (tankGeoCache.g = b.geo());
}

function roadRibbon(p: Piece, rb: Buf, cb: Buf, T: City['terrain']) {
  const w = p.w, n = p.n;
  // foot overbridges and their stairs would need real stairs; leave them out
  if (p.elevated && p.cls >= RC.footway && p.cls <= RC.cycleway) return;
  const rank = p.cls === RC.rail ? 0 : p.cls >= RC.footway ? 0.5 : 6 - Math.min(5, p.cls);
  const lift = 0.07 + rank * 0.012;
  const i0 = rb.pos.length / 3;
  const L: number[] = [], R: number[] = [];
  for (let k = 0; k < n; k++) {
    const a = Math.max(0, k - 1), c = Math.min(n - 1, k + 1);
    let dx = p.x[c] - p.x[a], dz = p.z[c] - p.z[a];
    const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
    const px = -dz * w * 0.5, pz = dx * w * 0.5;
    const y = p.y[k] + lift;
    const gl = p.elevated ? y : Math.max(y, T.height(p.x[k] + px, p.z[k] + pz) + lift);
    const gr = p.elevated ? y : Math.max(y, T.height(p.x[k] - px, p.z[k] - pz) + lift);
    rb.v(p.x[k] + px, gl, p.z[k] + pz, 0, 1, 0, 0, p.s[k]);
    rb.v(p.x[k] - px, gr, p.z[k] - pz, 0, 1, 0, 1, p.s[k]);
    rb.road.push(p.cls, w, p.cls, w);
    L.push(p.x[k] + px, gl, p.z[k] + pz); R.push(p.x[k] - px, gr, p.z[k] - pz);
  }
  for (let k = 0; k < n - 1; k++) { const a = i0 + k * 2; rb.idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  if (!p.elevated) return;
  // deck sides, parapets, pillars
  const grey: [number, number, number] = [0.62, 0.6, 0.57], dark: [number, number, number] = [0.5, 0.49, 0.47];
  for (const side of [L, R]) {
    const sgn = side === L ? 1 : -1;
    for (let k = 0; k < n - 1; k++) {
      const x0 = side[k * 3], y0 = side[k * 3 + 1], z0 = side[k * 3 + 2], x1 = side[k * 3 + 3], y1 = side[k * 3 + 4], z1 = side[k * 3 + 5];
      const g0 = T.height(x0, z0), g1 = T.height(x1, z1);
      if (y0 - g0 < 0.8 && y1 - g1 < 0.8) continue;
      const dx = x1 - x0, dz = z1 - z0, l = Math.hypot(dx, dz) || 1;
      const nx = (-dz / l) * sgn, nz = (dx / l) * sgn;
      const q0 = cb.pos.length / 3;
      // girder face (down 1.4 m) and a parapet (up 0.9 m)
      cb.v(x0, y0 - 1.4, z0, nx, 0, nz, 0, 0); cb.v(x1, y1 - 1.4, z1, nx, 0, nz, 0, 0); cb.v(x1, y1 + 0.9, z1, nx, 0, nz, 0, 0); cb.v(x0, y0 + 0.9, z0, nx, 0, nz, 0, 0);
      cb.col.push(...dark, ...dark, ...grey, ...grey);
      if (sgn > 0) cb.idx.push(q0, q0 + 2, q0 + 1, q0, q0 + 3, q0 + 2); else cb.idx.push(q0, q0 + 1, q0 + 2, q0, q0 + 2, q0 + 3);
      // inner face of the parapet
      const q1 = cb.pos.length / 3;
      cb.v(x0, y0, z0, -nx, 0, -nz, 0, 0); cb.v(x1, y1, z1, -nx, 0, -nz, 0, 0); cb.v(x1, y1 + 0.9, z1, -nx, 0, -nz, 0, 0); cb.v(x0, y0 + 0.9, z0, -nx, 0, -nz, 0, 0);
      cb.col.push(...grey, ...grey, ...grey, ...grey);
      if (sgn > 0) cb.idx.push(q1, q1 + 1, q1 + 2, q1, q1 + 2, q1 + 3); else cb.idx.push(q1, q1 + 2, q1 + 1, q1, q1 + 3, q1 + 2);
    }
  }
  // underside
  const u0 = cb.pos.length / 3;
  for (let k = 0; k < n; k++) {
    cb.v(L[k * 3], L[k * 3 + 1] - 1.4, L[k * 3 + 2], 0, -1, 0, 0, 0); cb.v(R[k * 3], R[k * 3 + 1] - 1.4, R[k * 3 + 2], 0, -1, 0, 0, 0);
    cb.col.push(...dark, ...dark);
  }
  for (let k = 0; k < n - 1; k++) { const a = u0 + k * 2; cb.idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  // pillars every ~30 m where the deck is well up
  for (let s = 15; s < p.len; s += 30) {
    const q = { x: 0, z: 0, y: 0, dx: 0, dz: 0 };
    rbPoint(p, s, q);
    const g = Math.min(T.height(q.x, q.z), isFinite(T.water(q.x, q.z)) ? T.water(q.x, q.z) - 2 : Infinity);
    if (q.y - g < 3) continue;
    const ang = Math.atan2(q.dz, q.dx);
    box(cb, q.x, g + (q.y - 1.4 - g) / 2, q.z, 1.5, q.y - 1.4 - g, Math.min(p.w * 0.55, 5), grey, -ang);
  }
}

function rbPoint(p: Piece, s: number, out: { x: number; z: number; y: number; dx: number; dz: number }) {
  let k = 0;
  while (k < p.n - 2 && p.s[k + 1] < s) k++;
  const L = p.s[k + 1] - p.s[k] || 1e-6, t = Math.min(1, Math.max(0, (s - p.s[k]) / L));
  out.x = p.x[k] + (p.x[k + 1] - p.x[k]) * t; out.z = p.z[k] + (p.z[k + 1] - p.z[k]) * t; out.y = p.y[k] + (p.y[k + 1] - p.y[k]) * t;
  out.dx = (p.x[k + 1] - p.x[k]) / L; out.dz = (p.z[k + 1] - p.z[k]) / L;
}

/** Pune Metro: a U-girder on single piers, and nothing where it runs underground. */
function buildMetro(p: Piece, cb: Buf, T: City['terrain']) {
  const grey: [number, number, number] = [0.78, 0.77, 0.74], dark: [number, number, number] = [0.6, 0.59, 0.57];
  const w = 4.6;
  for (let k = 0; k < p.n - 1; k++) {
    if (p.pf[k] & 2 || p.pf[k + 1] & 2) continue;
    const x0 = p.x[k], z0 = p.z[k], x1 = p.x[k + 1], z1 = p.z[k + 1];
    const y0 = p.y[k], y1 = p.y[k + 1];
    if (y0 - T.height(x0, z0) < 4 || y1 - T.height(x1, z1) < 4) continue;
    const dx = x1 - x0, dz = z1 - z0, l = Math.hypot(dx, dz) || 1, nx = -dz / l, nz = dx / l;
    for (const sg of [1, -1]) {
      const ox = nx * w * sg, oz = nz * w * sg;
      const q = cb.pos.length / 3;
      cb.v(x0 + ox, y0 - 1.8, z0 + oz, nx * sg, 0, nz * sg, 0, 0); cb.v(x1 + ox, y1 - 1.8, z1 + oz, nx * sg, 0, nz * sg, 0, 0);
      cb.v(x1 + ox, y1 + 1.4, z1 + oz, nx * sg, 0, nz * sg, 0, 0); cb.v(x0 + ox, y0 + 1.4, z0 + oz, nx * sg, 0, nz * sg, 0, 0);
      cb.col.push(...dark, ...dark, ...grey, ...grey);
      if (sg > 0) cb.idx.push(q, q + 2, q + 1, q, q + 3, q + 2); else cb.idx.push(q, q + 1, q + 2, q, q + 2, q + 3);
    }
    const q = cb.pos.length / 3;
    cb.v(x0 + nx * w, y0 - 1.8, z0 + nz * w, 0, -1, 0, 0, 0); cb.v(x0 - nx * w, y0 - 1.8, z0 - nz * w, 0, -1, 0, 0, 0);
    cb.v(x1 + nx * w, y1 - 1.8, z1 + nz * w, 0, -1, 0, 0, 0); cb.v(x1 - nx * w, y1 - 1.8, z1 - nz * w, 0, -1, 0, 0, 0);
    cb.col.push(...dark, ...dark, ...dark, ...dark);
    cb.idx.push(q, q + 1, q + 2, q + 1, q + 3, q + 2);
    // track bed on top
    const t = cb.pos.length / 3;
    cb.v(x0 + nx * w, y0 - 0.2, z0 + nz * w, 0, 1, 0, 0, 0); cb.v(x0 - nx * w, y0 - 0.2, z0 - nz * w, 0, 1, 0, 0, 0);
    cb.v(x1 + nx * w, y1 - 0.2, z1 + nz * w, 0, 1, 0, 0, 0); cb.v(x1 - nx * w, y1 - 0.2, z1 - nz * w, 0, 1, 0, 0, 0);
    cb.col.push(0.45, 0.43, 0.4, 0.45, 0.43, 0.4, 0.45, 0.43, 0.4, 0.45, 0.43, 0.4);
    cb.idx.push(t, t + 2, t + 1, t + 1, t + 2, t + 3);
  }
  const q = { x: 0, z: 0, y: 0, dx: 0, dz: 0 };
  for (let s = 14; s < p.len; s += 28) {
    rbPoint(p, s, q);
    const g = T.height(q.x, q.z);
    if (q.y - g < 5) continue;
    const pk = Math.min(p.n - 1, Math.max(0, p.s.findIndex((v) => v >= s)));
    if (p.pf[pk] & 2) continue;
    const ang = -Math.atan2(q.dz, q.dx);
    cyl(cb, q.x, g, q.z, 1.0, q.y - 1.8 - g - 1.2, grey, 8);
    box(cb, q.x, q.y - 2.4, q.z, 2.2, 1.2, 8.6, grey, ang);
  }
}

// ------------------------------------------------------------------ buildings
function convex(ring: Float32Array) {
  const n = ring.length / 2;
  let sign = 0;
  for (let i = 0; i < n; i++) {
    const ax = ring[i * 2], az = ring[i * 2 + 1], bx = ring[((i + 1) % n) * 2], bz = ring[((i + 1) % n) * 2 + 1], cx = ring[((i + 2) % n) * 2], cz = ring[((i + 2) % n) * 2 + 1];
    const cr = (bx - ax) * (cz - bz) - (bz - az) * (cx - bx);
    if (Math.abs(cr) < 1e-6) continue;
    const s = Math.sign(cr);
    if (sign && s !== sign) return false;
    sign = s;
  }
  return true;
}

function buildBuilding(b: Building, out: Buf, tanks: number[], signs: Buf, detail: number) {
  const ring = b.ring, n = ring.length / 2;
  const seed = hash(b.i * 7 + 3);
  const pal = PAL[b.t] ?? PAL[BT.apartment];
  const c = pal[Math.floor(hash(b.i) * pal.length)];
  const y0 = b.base - 0.8, top = b.base + b.h;
  let u = 0;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const x0 = ring[i * 2], z0 = ring[i * 2 + 1], x1 = ring[j * 2], z1 = ring[j * 2 + 1];
    const ex = x1 - x0, ez = z1 - z0, l = Math.hypot(ex, ez);
    if (l < 0.05) continue;
    const nx = ez / l, nz = -ex / l;
    const front = b.front === i ? 1 : 0;
    const v0 = out.pos.length / 3;
    out.v(x0, y0, z0, nx, 0, nz, u, -0.8); out.v(x1, y0, z1, nx, 0, nz, u + l, -0.8);
    out.v(x1, top, z1, nx, 0, nz, u + l, b.h); out.v(x0, top, z0, nx, 0, nz, u, b.h);
    for (let k = 0; k < 4; k++) { out.col.push(c[0], c[1], c[2]); out.info.push(b.t, seed, front, 0); }
    out.idx.push(v0, v0 + 2, v0 + 1, v0, v0 + 3, v0 + 2);
    u += l;
    if (front && detail > 0 && l > 3 && b.h > 5) {
      // a shop board above the shutters
      const sl = Math.min(l - 0.8, 7.5), cxm = (x0 + x1) / 2, czm = (z0 + z1) / 2;
      const hx = (ex / l) * sl * 0.5, hz = (ez / l) * sl * 0.5;
      const sy0 = b.base + 3.45, sy1 = b.base + 4.35;
      const k = Math.floor(hash(b.i * 13 + 1) * SIGN_TEXTS.length);
      const col = k % 4, row = Math.floor(k / 4);
      const u0 = col / 4 + 0.004, u1 = (col + 1) / 4 - 0.004, w0 = 1 - (row + 1) / 16 + 0.002, w1 = 1 - row / 16 - 0.002;
      const ox = nx * 0.14, oz = nz * 0.14;
      const s0 = signs.pos.length / 3;
      // seen from the street, +e runs to the viewer's left: map the text right to left along it
      signs.v(cxm - hx + ox, sy0, czm - hz + oz, nx, 0, nz, u1, w0); signs.v(cxm + hx + ox, sy0, czm + hz + oz, nx, 0, nz, u0, w0);
      signs.v(cxm + hx + ox, sy1, czm + hz + oz, nx, 0, nz, u0, w1); signs.v(cxm - hx + ox, sy1, czm - hz + oz, nx, 0, nz, u1, w1);
      signs.idx.push(s0, s0 + 2, s0 + 1, s0, s0 + 3, s0 + 2);
    }
  }
  // roof
  const pitched = (b.t === BT.wada || b.t === BT.colonial || b.t === BT.bungalow || b.t === BT.vasti) && n <= 8 && convex(ring) && hash(b.i * 5) < (b.t === BT.vasti ? 0.2 : 0.75);
  if (pitched) {
    let cx = 0, cz = 0;
    for (let i = 0; i < n; i++) { cx += ring[i * 2]; cz += ring[i * 2 + 1]; }
    cx /= n; cz /= n;
    let rmin = Infinity;
    for (let i = 0; i < n; i++) rmin = Math.min(rmin, Math.hypot(ring[i * 2] - cx, ring[i * 2 + 1] - cz));
    const rise = Math.min(3.2, Math.max(1, rmin * 0.55));
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const ax = ring[i * 2], az = ring[i * 2 + 1], bx = ring[j * 2], bz = ring[j * 2 + 1];
      // face normal
      const e1 = [bx - ax, 0, bz - az], e2 = [cx - ax, rise, cz - az];
      let nx = e1[1] * e2[2] - e1[2] * e2[1], ny = e1[2] * e2[0] - e1[0] * e2[2], nz = e1[0] * e2[1] - e1[1] * e2[0];
      const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
      const flip = ny < 0;
      if (flip) { nx = -nx; ny = -ny; nz = -nz; }
      const v0 = out.pos.length / 3;
      const el = Math.hypot(bx - ax, bz - az);
      out.v(ax, top, az, nx, ny, nz, 0, 0); out.v(bx, top, bz, nx, ny, nz, el, 0); out.v(cx, top + rise, cz, nx, ny, nz, el / 2, rise * 1.2);
      for (let k = 0; k < 3; k++) { out.col.push(0.55, 0.26, 0.18); out.info.push(b.t, seed, 0, 2); }
      if (flip) out.idx.push(v0, v0 + 1, v0 + 2); else out.idx.push(v0, v0 + 2, v0 + 1);
    }
  } else {
    const contour: THREE.Vector2[] = [];
    for (let i = 0; i < n; i++) contour.push(new THREE.Vector2(ring[i * 2], ring[i * 2 + 1]));
    const faces = THREE.ShapeUtils.triangulateShape(contour, []);
    const v0 = out.pos.length / 3;
    const rc = b.t === BT.vasti ? [0.55, 0.58, 0.6] : [c[0] * 0.75, c[1] * 0.73, c[2] * 0.7];
    for (let i = 0; i < n; i++) { out.v(ring[i * 2], top, ring[i * 2 + 1], 0, 1, 0, 0, 0); out.col.push(rc[0], rc[1], rc[2]); out.info.push(b.t, seed, 0, 1); }
    for (const f of faces) {
      const ax = ring[f[0] * 2], az = ring[f[0] * 2 + 1], bx = ring[f[1] * 2], bz = ring[f[1] * 2 + 1], cx = ring[f[2] * 2], cz = ring[f[2] * 2 + 1];
      const cr = (bx - ax) * (cz - az) - (bz - az) * (cx - ax);
      if (cr > 0) out.idx.push(v0 + f[0], v0 + f[2], v0 + f[1]); else out.idx.push(v0 + f[0], v0 + f[1], v0 + f[2]);
    }
    // black water tanks on the flat roofs of houses and flats
    if ((b.t === BT.apartment || b.t === BT.house || b.t === BT.tower || b.t === BT.wada || b.t === BT.commercial) && detail > 0) {
      const k = hash(b.i * 11 + 5);
      if (k < 0.75) {
        let cx = 0, cz = 0;
        for (let i = 0; i < n; i++) { cx += ring[i * 2]; cz += ring[i * 2 + 1]; }
        cx /= n; cz /= n;
        const cnt = b.h > 14 ? 1 + Math.floor(k * 4) : 1;
        for (let t = 0; t < cnt; t++) {
          const a = hash(b.i * 17 + t) * Math.PI * 2, rr = Math.min(b.r * 0.35, 3) * hash(b.i * 19 + t);
          tanks.push(cx + Math.cos(a) * rr, top + 0.2, cz + Math.sin(a) * rr, 0.8 + hash(b.i + t) * 0.6);
        }
      }
    }
  }
}

// ------------------------------------------------------------------ trees
const treeGeo: THREE.BufferGeometry[] = [];
function canopy(kind: number) {
  if (treeGeo[kind]) return treeGeo[kind];
  const b = new Buf();
  const leaf: [number, number, number][] = [[0.3, 0.42, 0.2], [0.24, 0.36, 0.18], [0.34, 0.44, 0.2], [0.22, 0.34, 0.18], [0.46, 0.46, 0.26]];
  const c = leaf[kind];
  const trunk: [number, number, number] = [0.32, 0.26, 0.2];
  const blob = (x: number, y: number, z: number, r: number, sy: number, col: [number, number, number]) => {
    const ico = new THREE.IcosahedronGeometry(r, 1);
    const p = ico.attributes.position, nn = ico.attributes.normal;
    const i0 = b.pos.length / 3;
    for (let i = 0; i < p.count; i++) {
      const j = 0.85 + 0.3 * hash(i * 31 + kind * 7 + Math.round(x * 10));
      b.v(x + p.getX(i) * j, y + p.getY(i) * sy * j, z + p.getZ(i) * j, nn.getX(i), nn.getY(i), nn.getZ(i), 0, 0);
      const sh = 0.8 + 0.35 * (p.getY(i) / r * 0.5 + 0.5);
      b.col.push(col[0] * sh, col[1] * sh, col[2] * sh);
    }
    const ix = ico.index;
    if (ix) for (let i = 0; i < ix.count; i++) b.idx.push(i0 + ix.getX(i));
    else for (let i = 0; i < p.count; i++) b.idx.push(i0 + i);
  };
  if (kind === 0) { // rain tree: a wide umbrella
    cyl(b, 0, 0, 0, 0.35, 5, trunk, 5);
    blob(0, 6.5, 0, 4.2, 0.45, c); blob(2.4, 6, 1, 2.6, 0.5, c); blob(-2.2, 6.2, -1.2, 2.8, 0.5, c);
  } else if (kind === 1) { // banyan / peepal: big and dense
    cyl(b, 0, 0, 0, 0.6, 4.5, trunk, 6);
    blob(0, 7, 0, 4.6, 0.75, c); blob(2.8, 6, 1.5, 3, 0.7, c); blob(-2.6, 6.4, -1, 3.2, 0.7, c);
  } else if (kind === 2) { // gulmohar: flat crown, some flowering
    cyl(b, 0, 0, 0, 0.28, 4, trunk, 5);
    blob(0, 5.2, 0, 3.4, 0.42, c); blob(1.5, 5.6, 0.5, 1.6, 0.5, [0.85, 0.32, 0.16]);
  } else if (kind === 3) { // ashoka (mast tree): tall, narrow, along compound walls
    cyl(b, 0, 0, 0, 0.18, 2, trunk, 5);
    blob(0, 6, 0, 1.4, 4.2, c);
  } else { // hill scrub
    blob(0, 0.9, 0, 1.4, 0.7, c);
  }
  return (treeGeo[kind] = b.geo());
}

function buildTrees(city: City, list: number[], mats: Materials, excl: Exclusion[]) {
  const T = city.terrain, tr = city.trees;
  const byKind: number[][] = [[], [], [], [], []];
  for (const i of list) {
    let skip = false;
    for (const e of excl) if ((tr.x[i] - e.x) ** 2 + (tr.z[i] - e.z) ** 2 < (e.r * 0.8) ** 2) { skip = true; break; }
    if (!skip) byKind[Math.min(4, tr.kind[i])].push(i);
  }
  const out: THREE.Object3D[] = [];
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), col = new THREE.Color();
  byKind.forEach((ids, kind) => {
    if (!ids.length) return;
    const im = new THREE.InstancedMesh(canopy(kind), mats.plain, ids.length);
    ids.forEach((i, n) => {
      const sc = 0.55 + (tr.scale[i] / 255) * 0.75;
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), hash(i) * 6.28);
      s.set(sc, sc * (0.85 + hash(i + 1) * 0.3), sc);
      p.set(tr.x[i], T.height(tr.x[i], tr.z[i]) - 0.2, tr.z[i]);
      m4.compose(p, q, s);
      im.setMatrixAt(n, m4);
      const v = 0.82 + hash(i * 3) * 0.3;
      col.setRGB(v, v * (0.95 + hash(i * 5) * 0.1), v * 0.92, THREE.LinearSRGBColorSpace);
      im.setColorAt(n, col);
    });
    im.computeBoundingSphere();
    out.push(im);
  });
  return out;
}

export { DRIVABLE };
