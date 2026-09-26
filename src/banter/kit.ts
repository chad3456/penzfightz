import * as THREE from 'three';

/**
 * The toy box: cached materials and geometries, and a one-line way to put a
 * shape somewhere. A hundred dioramas are built from the same few dozen
 * geometries and a palette's worth of materials, so building one is cheap.
 */

const mats = new Map<string, THREE.Material>();
export function lam(color: string, flat = true): THREE.MeshLambertMaterial {
  const k = color + (flat ? 'f' : 's');
  let m = mats.get(k) as THREE.MeshLambertMaterial | undefined;
  if (!m) {
    m = new THREE.MeshLambertMaterial({ color, flatShading: flat });
    mats.set(k, m);
  }
  return m;
}
export function basic(color: string, opacity = 1): THREE.MeshBasicMaterial {
  const k = 'b' + color + opacity;
  let m = mats.get(k) as THREE.MeshBasicMaterial | undefined;
  if (!m) {
    m = new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity, depthWrite: opacity >= 1 });
    mats.set(k, m);
  }
  return m;
}

const geos = new Map<string, THREE.BufferGeometry>();
function cached(k: string, make: () => THREE.BufferGeometry) {
  let g = geos.get(k);
  if (!g) {
    g = make();
    geos.set(k, g);
  }
  return g;
}
export const G = {
  box: (w: number, h: number, d: number) => cached(`b${w},${h},${d}`, () => new THREE.BoxGeometry(w, h, d)),
  cyl: (rt: number, rb: number, h: number, n = 12, open = false) => cached(`c${rt},${rb},${h},${n},${open}`, () => new THREE.CylinderGeometry(rt, rb, h, n, 1, open)),
  sph: (r: number, w = 14, h = 10) => cached(`s${r},${w},${h}`, () => new THREE.SphereGeometry(r, w, h)),
  cap: (r: number, l: number) => cached(`k${r},${l}`, () => new THREE.CapsuleGeometry(r, l, 4, 10)),
  tor: (r: number, t: number, arc = Math.PI * 2, n = 16) => cached(`t${r},${t},${arc},${n}`, () => new THREE.TorusGeometry(r, t, 6, n, arc)),
  cone: (r: number, h: number, n = 10) => cached(`o${r},${h},${n}`, () => new THREE.ConeGeometry(r, h, n)),
  disc: (r: number, n = 20, start = 0, len = Math.PI * 2) => cached(`d${r},${n},${start},${len}`, () => new THREE.CircleGeometry(r, n, start, len)),
  plane: (w: number, h: number) => cached(`p${w},${h}`, () => new THREE.PlaneGeometry(w, h)),
  dodec: (r: number) => cached(`e${r}`, () => new THREE.DodecahedronGeometry(r, 0)),
  /** A slice of a sphere between two polar angles — hair, beards, caps. */
  shell: (r: number, from: number, to: number, w = 18) => cached(`h${r},${from},${to},${w}`, () => new THREE.SphereGeometry(r, w, 10, 0, Math.PI * 2, from, to - from)),
};

export type V3 = [number, number, number];

/** Add a mesh to a parent at a place, with a rotation and a scale. */
export function put(parent: THREE.Object3D, geo: THREE.BufferGeometry, mat: THREE.Material, p: V3 = [0, 0, 0], r: V3 = [0, 0, 0], s: number | V3 = 1) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(...p);
  m.rotation.set(...r);
  if (typeof s === 'number') m.scale.setScalar(s);
  else m.scale.set(...s);
  m.castShadow = true;
  parent.add(m);
  return m;
}

export function group(parent: THREE.Object3D, p: V3 = [0, 0, 0], r: V3 = [0, 0, 0]) {
  const g = new THREE.Group();
  g.position.set(...p);
  g.rotation.set(...r);
  parent.add(g);
  return g;
}

/** Words on a board: a canvas texture, cached by its text and colours. */
const texts = new Map<string, THREE.MeshBasicMaterial>();
export function textMat(text: string, bg: string, fg: string, w = 512, h = 256, font = 'Futura, "Avenir Next", "Arial Black", sans-serif') {
  const k = `${text}|${bg}|${fg}|${w}|${h}`;
  let m = texts.get(k);
  if (m) return m;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d')!;
  g.fillStyle = bg;
  g.fillRect(0, 0, w, h);
  g.fillStyle = fg;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  const lines = text.split('\n');
  let size = h / (lines.length + 0.6);
  g.font = `900 ${size}px ${font}`;
  const widest = Math.max(...lines.map((l) => g.measureText(l).width));
  if (widest > w * 0.9) size *= (w * 0.9) / widest;
  g.font = `900 ${size}px ${font}`;
  lines.forEach((l, i) => g.fillText(l, w / 2, h / 2 + (i - (lines.length - 1) / 2) * size * 1.05));
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  m = new THREE.MeshBasicMaterial({ map: t });
  texts.set(k, m);
  return m;
}

/** A tiny seeded random, so every diorama comes out the same every time. */
export function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
