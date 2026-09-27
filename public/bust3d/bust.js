/**
 * Bust — Krishna and Arjuna as lit 3D busts, for stills and short moves.
 *
 * The head is Lee Perry-Smith's "Infinite" 3D head scan (Creative Commons
 * Attribution 3.0, via the three.js examples): a real face, eyes closed, with
 * its colour, normal and specular maps. Everything else is made here: the
 * skin re-toned (Krishna's the blue of a rain cloud, Arjuna's bronze), a gold
 * mukut with a lotus front and a peacock feather, a kirita for Arjuna,
 * kundalas, a tilak projected onto the brow, necklaces, the Kaustubha jewel,
 * a vaijayanti garland and a yellow silk drape — all placed by casting rays
 * onto the scan so they sit on its surface.
 *
 * window.BUST.render({ who, cam, light, w, h }) → a data URL (transparent PNG/WebP).
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { DecalGeometry } from 'three/addons/geometries/DecalGeometry.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const pmrem = new THREE.PMREMGenerator(renderer);
const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

const tl = new THREE.TextureLoader();
const loadTex = (u, srgb) => new Promise((res) => tl.load(u, (t) => { t.flipY = false; if (srgb) t.colorSpace = THREE.SRGBColorSpace; res(t); }));

/* ── textures made here ─────────────────────────────────────────────── */

function canvasTex(w, h, draw, srgb = true) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/** Re-tone the scan's colour map: keep its light and shade, change its hue. */
function retone(img, dark, light, keep = 0.12, gamma = 1) {
  const c = document.createElement('canvas');
  c.width = img.width;
  c.height = img.height;
  const g = c.getContext('2d');
  g.drawImage(img, 0, 0);
  const d = g.getImageData(0, 0, c.width, c.height);
  const p = d.data;
  for (let i = 0; i < p.length; i += 4) {
    const r = p[i] / 255;
    const gg = p[i + 1] / 255;
    const b = p[i + 2] / 255;
    const L = Math.pow(0.3 * r + 0.59 * gg + 0.11 * b, gamma);
    const red = Math.max(0, r - (gg + b) / 2); // lips, flush
    for (let k = 0; k < 3; k++) {
      const base = dark[k] + (light[k] - dark[k]) * L;
      const orig = [r, gg, b][k];
      p[i + k] = Math.min(255, (base * (1 - keep) + orig * keep) * 255 + (k === 0 ? red * 60 : k === 2 ? red * 40 : 0));
    }
  }
  g.putImageData(d, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.flipY = false;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

const featherTex = canvasTex(256, 768, (g, w, h) => {
  g.clearRect(0, 0, w, h);
  // barbs: fine lines from the quill, green-gold turning blue near the eye
  for (let i = 0; i < 520; i++) {
    const y = h * 0.98 - (i / 520) * h * 0.9;
    const u = 1 - y / h;
    const len = 30 + u * 95;
    for (const s of [-1, 1]) {
      g.strokeStyle = `hsla(${95 + u * 60 + Math.random() * 20},${60 + u * 20}%,${28 + Math.random() * 18}%,0.55)`;
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(w / 2, y);
      g.quadraticCurveTo(w / 2 + s * len * 0.5, y - len * 0.2, w / 2 + s * len, y - len * (0.35 + Math.random() * 0.2));
      g.stroke();
    }
  }
  // the eye
  const cx = w / 2;
  const cy = h * 0.18;
  for (const [rx, ry, col] of [[118, 150, 'rgba(90,140,40,0.9)'], [96, 124, 'rgba(210,160,40,0.95)'], [78, 100, 'rgba(30,150,140,0.95)'], [56, 74, 'rgba(20,70,160,1)'], [30, 42, 'rgba(10,20,60,1)']]) {
    g.fillStyle = col;
    g.beginPath();
    g.ellipse(cx, cy + (150 - ry) * 0.25, rx, ry, 0, 0, Math.PI * 2);
    g.fill();
  }
  g.strokeStyle = 'rgba(240,220,160,0.9)';
  g.lineWidth = 4;
  g.beginPath();
  g.moveTo(cx, h);
  g.lineTo(cx, cy + 60);
  g.stroke();
});

const tilakTex = canvasTex(256, 384, (g, w, h) => {
  g.clearRect(0, 0, w, h);
  g.lineCap = 'round';
  g.strokeStyle = 'rgba(255,244,210,0.95)';
  g.lineWidth = 26;
  g.beginPath();
  g.moveTo(w * 0.3, h * 0.08);
  g.lineTo(w * 0.33, h * 0.72);
  g.quadraticCurveTo(w * 0.5, h * 0.95, w * 0.67, h * 0.72);
  g.lineTo(w * 0.7, h * 0.08);
  g.stroke();
  g.strokeStyle = 'rgba(230,30,20,1)';
  g.lineWidth = 16;
  g.beginPath();
  g.moveTo(w * 0.5, h * 0.12);
  g.lineTo(w * 0.5, h * 0.7);
  g.stroke();
});

const strandTex = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#808080';
  g.fillRect(0, 0, w, h);
  for (let i = 0; i < 400; i++) {
    const x = Math.random() * w;
    g.strokeStyle = `rgba(${Math.random() < 0.5 ? 255 : 0},${Math.random() < 0.5 ? 255 : 0},255,0.25)`;
    g.lineWidth = 1 + Math.random();
    g.beginPath();
    g.moveTo(x, 0);
    g.lineTo(x + (Math.random() - 0.5) * 10, h);
    g.stroke();
  }
}, false);
strandTex.wrapS = strandTex.wrapT = THREE.RepeatWrapping;

/** Hair cards: a strip of many fine strands, soft at the edges. */
const cardTex = canvasTex(256, 1024, (g, w, h) => {
  g.clearRect(0, 0, w, h);
  for (let i = 0; i < 380; i++) {
    const x0 = Math.random() * w;
    const edge = Math.min(x0, w - x0) / (w / 2);
    const a = edge < 0.25 ? 0.2 : 0.35 + edge * 0.6;
    const l = 0.03 + Math.random() * 0.12;
    g.strokeStyle = `rgba(${10 + l * 120},${12 + l * 130},${20 + l * 200},${a})`;
    g.lineWidth = 1 + Math.random() * 1.6;
    g.beginPath();
    g.moveTo(x0, 0);
    const wav = 4 + Math.random() * 10;
    for (let y = 0; y <= h; y += 16) g.lineTo(x0 + Math.sin(y * 0.012 + i) * wav + (y / h) * (Math.random() - 0.5) * 30 * edge, y);
    g.stroke();
  }
});

/* ── materials ─────────────────────────────────────────────────────── */

const gold = new THREE.MeshPhysicalMaterial({ color: '#f2b64a', metalness: 1, roughness: 0.28, envMap: envTex, envMapIntensity: 1.3, clearcoat: 0.3 });
const goldDark = new THREE.MeshPhysicalMaterial({ color: '#c8862a', metalness: 1, roughness: 0.4, envMap: envTex, envMapIntensity: 1.0 });
const bronze = new THREE.MeshPhysicalMaterial({ color: '#b87a3a', metalness: 1, roughness: 0.35, envMap: envTex, envMapIntensity: 1.1 });
const gem = (c) => new THREE.MeshPhysicalMaterial({ color: c, metalness: 0, roughness: 0.05, transmission: 0.3, thickness: 0.4, ior: 1.7, envMap: envTex, envMapIntensity: 2.2, clearcoat: 1, emissive: c, emissiveIntensity: 0.25 });
const ruby = gem('#d1102a');
const emerald = gem('#0e9a5a');
const pearl = new THREE.MeshPhysicalMaterial({ color: '#f4efe4', roughness: 0.25, sheen: 1, sheenColor: '#ffe9d0', envMap: envTex, envMapIntensity: 1.2, clearcoat: 0.6 });
const hairMat = new THREE.MeshPhysicalMaterial({ color: '#07080d', roughness: 0.38, metalness: 0, normalMap: strandTex, normalScale: new THREE.Vector2(0.25, 0.25), sheen: 1, sheenRoughness: 0.35, sheenColor: '#3a4f8a', envMap: envTex, envMapIntensity: 0.6 });
const silk = new THREE.MeshPhysicalMaterial({ color: '#f2b21e', roughness: 0.38, sheen: 1, sheenColor: '#fff0a0', sheenRoughness: 0.3, side: THREE.DoubleSide, envMap: envTex, envMapIntensity: 0.7 });
const flowerMats = { marigold: new THREE.MeshStandardMaterial({ color: '#ff8a0a', roughness: 0.7 }), rose: new THREE.MeshStandardMaterial({ color: '#c8102e', roughness: 0.6 }), jasmine: new THREE.MeshStandardMaterial({ color: '#fbf7ee', roughness: 0.6 }), tulsi: new THREE.MeshStandardMaterial({ color: '#2f6b2a', roughness: 0.7 }) };

/* ── the scene ─────────────────────────────────────────────────────── */

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(24, 9 / 16, 0.1, 200);
const lights = {
  key: new THREE.SpotLight('#fff3e2', 900, 60, 0.3, 0.8, 2),
  rimL: new THREE.DirectionalLight('#6fb4ff', 3),
  rimR: new THREE.DirectionalLight('#8fd0ff', 3),
  fill: new THREE.DirectionalLight('#3050c0', 0.6),
  under: new THREE.PointLight('#ff8a30', 0, 30, 2),
  amb: new THREE.AmbientLight('#1a2450', 0.4),
};
lights.key.castShadow = true;
lights.key.shadow.mapSize.set(2048, 2048);
lights.key.shadow.bias = -0.0004;
scene.add(lights.key, lights.key.target, lights.rimL, lights.rimR, lights.fill, lights.under, lights.amb);

const figures = {};
let head = null;
const ray = new THREE.Raycaster();

/** A point on the bust's surface, found by a ray from in front; returns point and normal. */
function onSurface(x, y, fromZ = 12, dir = V(0, 0, -1)) {
  ray.set(V(x, y, fromZ), dir);
  const hit = ray.intersectObject(head, false)[0];
  if (!hit) return null;
  const n = hit.face.normal.clone().transformDirection(head.matrixWorld);
  return { p: hit.point.clone(), n };
}

function tubeAlong(points, r, mat, closed = false) {
  const curve = new THREE.CatmullRomCurve3(points, closed, 'catmullrom', 0.5);
  return new THREE.Mesh(new THREE.TubeGeometry(curve, Math.max(24, points.length * 8), r, 10, closed), mat);
}

/** A strip following surface points, lifted off the skin: for the silk. */
function surfaceStrip(path, width, lift, mat) {
  const pos = [];
  const idx = [];
  const pts = path.map(([x, y]) => onSurface(x, y)).filter(Boolean);
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)].p;
    const b = pts[Math.min(pts.length - 1, i + 1)].p;
    const t = b.clone().sub(a).normalize();
    const n = pts[i].n;
    const side = new THREE.Vector3().crossVectors(t, n).normalize();
    const c = pts[i].p.clone().addScaledVector(n, lift);
    const wob = 1 + 0.12 * Math.sin(i * 0.35);
    for (const s of [-1, 1]) {
      const q = c.clone().addScaledVector(side, (s * width * wob) / 2).addScaledVector(n, 0.04 * Math.sin(i * 0.6 + s));
      pos.push(q.x, q.y, q.z);
    }
    if (i > 0) { const k = i * 2; idx.push(k - 2, k - 1, k, k - 1, k + 1, k); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return new THREE.Mesh(g, mat);
}

function hairCards(group, seed, count = 70) {
  let s = seed;
  const R = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  const mat = new THREE.MeshPhysicalMaterial({ map: cardTex, color: '#2a2e3a', transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, roughness: 0.55, sheen: 0.4, sheenColor: '#28345a', sheenRoughness: 0.5, envMap: envTex, envMapIntensity: 0.25, depthWrite: true });
  for (let i = 0; i < count; i++) {
    const side = i % 2 ? 1 : -1;
    const front = i < 10;
    const ang = front ? side * (0.36 + R() * 0.1) * Math.PI : side * (0.42 + R() * 0.55) * Math.PI;
    const x0 = Math.sin(ang) * 1.5;
    const z0 = 0.1 + Math.cos(ang) * 1.9;
    const y0 = 2.75 + R() * 0.3;
    const len = front ? 3.2 + R() * 1.2 : 3.8 + R() * 2.0;
    const flare = 0.4 + R() * 0.9;
    const ph = R() * 6;
    const N = 16;
    const pos = [];
    const uv = [];
    const idx = [];
    const width = 0.22 + R() * 0.2;
    for (let k = 0; k <= N; k++) {
      const t = k / N;
      const out = 1 + flare * Math.pow(t, 1.3) * 0.55;
      const cx = x0 * out + Math.sin(t * 3 + ph) * 0.12;
      const cy = y0 - len * t;
      const cz = z0 * (1 - t * (front ? 0.1 : 0.3)) - t * (front ? -0.1 : 0.35);
      // the card lies along the head's surface: its width runs round the head
      const tx = Math.cos(ang);
      const tz = -Math.sin(ang);
      const wk = width * (1 - t * 0.45);
      for (const e of [-1, 1]) {
        pos.push(cx + tx * wk * e * 0.5, cy, cz + tz * wk * e * 0.5);
        uv.push((e + 1) / 2, t);
      }
      if (k > 0) { const b = k * 2; idx.push(b - 2, b - 1, b, b - 1, b + 1, b); }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = true;
    group.add(m);
  }
}

function hairLocks(group, seed, count = 90) {
  let s = seed;
  const R = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  for (let i = 0; i < count; i++) {
    // start around the back and sides of the head, under the crown band
    const ang = (0.42 + R() * 1.16) * Math.PI * (R() < 0.5 ? 1 : -1); // measured from the face (+z)
    const r0 = 1.0 + R() * 0.08;
    const x0 = Math.sin(ang) * r0 * 1.45;
    const z0 = 0.1 + Math.cos(ang) * r0 * 1.85;
    const y0 = 2.3 + R() * 0.5;
    const flare = 0.5 + R() * 1.3;
    const len = 3.4 + R() * 2.4;
    const ph = R() * 6;
    const pts = [];
    for (let k = 0; k <= 10; k++) {
      const t = k / 10;
      const out = 1 + flare * Math.pow(t, 1.2) * 0.5;
      pts.push(V(x0 * out + Math.sin(t * 3.2 + ph) * 0.1, y0 - len * t, z0 * (1 - t * 0.3) + Math.cos(t * 2.6 + ph) * 0.08 - t * 0.35));
    }
    const m = tubeAlong(pts, 0.045 + R() * 0.05, hairMat);
    m.castShadow = true;
    group.add(m);
  }
  // a cap of hair over the scalp, under the crown
  const cap = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32, 0, Math.PI * 2, 0, Math.PI * 0.62), hairMat);
  cap.scale.set(1.44, 1.62, 1.86);
  cap.position.set(0, 2.3, 0.02);
  cap.rotation.x = -0.35;
  group.add(cap);
}

function mukut() {
  const g = new THREE.Group();
  // a row of pearls and rubies along the rim of the crown
  for (let i = 0; i < 44; i++) {
    const a = (i / 44) * Math.PI * 2;
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 10), i % 5 === 0 ? ruby : pearl);
    b.position.set(Math.sin(a) * 1.33, 3.08, 0.02 + Math.cos(a) * 1.72);
    g.add(b);
  }
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1, 0.06, 12, 96), goldDark);
  rim.rotation.x = Math.PI / 2;
  rim.scale.set(1.3, 1.68, 1);
  rim.position.set(0, 3.0, 0.02);
  g.add(rim);
  // the body: a lathe that flares and then rises to a point
  const prof = [[1.0, 0], [1.06, 0.25], [1.02, 0.55], [0.86, 0.95], [0.66, 1.35], [0.5, 1.7], [0.34, 2.0], [0.2, 2.2], [0.12, 2.36], [0.02, 2.5]].map(([r, y]) => new THREE.Vector2(r, y));
  const body = new THREE.Mesh(new THREE.LatheGeometry(prof, 64), gold);
  body.scale.set(1.3, 1, 1.68);
  body.position.set(0, 3.0, 0.02);
  g.add(body);
  for (const [y, r] of [[3.55, 0.98], [4.05, 0.78], [4.5, 0.56]]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.045, 10, 80), goldDark);
    ring.rotation.x = Math.PI / 2;
    ring.scale.set(1.4, 1.72, 1);
    ring.position.set(0, y, 0.02);
    g.add(ring);
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const petal = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 10), gold);
      petal.scale.set(0.7, 1.6, 0.5);
      petal.position.set(Math.sin(a) * r * 1.43, y + 0.13, 0.02 + Math.cos(a) * r * 1.75);
      petal.lookAt(petal.position.clone().multiplyScalar(2).setY(y + 0.13));
      g.add(petal);
    }
  }
  // the front ornament: a lotus plate with jewels
  const sh = new THREE.Shape();
  sh.moveTo(0, -0.1);
  sh.bezierCurveTo(0.55, 0.2, 0.75, 0.9, 0, 1.55);
  sh.bezierCurveTo(-0.75, 0.9, -0.55, 0.2, 0, -0.1);
  const plate = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.08, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.05, bevelSegments: 3 }), gold);
  plate.position.set(0, 3.0, 1.78);
  plate.rotation.x = -0.28;
  g.add(plate);
  const big = new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 18), ruby);
  big.position.set(0, 3.62, 1.95);
  g.add(big);
  const setting = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.04, 10, 40), goldDark);
  setting.position.copy(big.position);
  setting.rotation.x = -0.28;
  g.add(setting);
  for (const [x, y] of [[-0.3, 3.3], [0.3, 3.3], [0, 4.15]]) {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 12), emerald);
    e.position.set(x, y, 1.88 - (y - 3) * 0.3);
    g.add(e);
  }
  const fin = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 12), pearl);
  fin.position.set(0, 5.62, 0.02);
  g.add(fin);
  // the peacock feather, tucked in behind, leaning back and to the side
  const f = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 3.9), new THREE.MeshStandardMaterial({ map: featherTex, transparent: true, alphaTest: 0.05, side: THREE.DoubleSide, roughness: 0.4, metalness: 0.2, emissive: '#0a3a30', emissiveIntensity: 0.4 }));
  f.position.set(0.95, 5.0, -0.5);
  f.rotation.set(-0.25, 0.4, -0.38);
  g.add(f);
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  g.scale.set(1.08, 1.05, 1.02);
  g.position.set(0, -0.5, -0.04);
  return g;
}

function kirita() {
  const g = new THREE.Group();
  const band = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.45, 64, 1, true), gold);
  band.scale.set(1.32, 1, 1.88);
  band.position.set(0, 2.78, 0.08);
  g.add(band);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2), bronze);
  dome.scale.set(1.45, 1.75, 1.9);
  dome.position.set(0, 2.98, 0.05);
  g.add(dome);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const pts = [];
    for (let k = 0; k <= 10; k++) { const t = (k / 10) * (Math.PI / 2); pts.push(V(Math.sin(a) * Math.cos(t) * 1.47, 2.98 + Math.sin(t) * 1.77, 0.05 + Math.cos(a) * Math.cos(t) * 1.92)); }
    g.add(tubeAlong(pts, 0.04, gold));
  }
  const spike = new THREE.Mesh(new THREE.ConeGeometry(0.12, 1.5, 16), gold);
  spike.position.set(0, 5.4, 0.05);
  g.add(spike);
  const jewel = new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 18), ruby);
  jewel.position.set(0, 3.5, 1.88);
  g.add(jewel);
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  g.scale.set(1.06, 1.05, 1.04);
  g.position.set(0, -0.5, -0.02);
  return g;
}

/** A ring hugging the body at height y, found by rays cast in towards the axis. */
function ringOnSurface(y, lift, n = 48) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const dir = V(Math.sin(a), 0, Math.cos(a));
    ray.set(V(0, y, 0).addScaledVector(dir, 8), dir.clone().negate());
    const hit = ray.intersectObject(head, false)[0];
    if (hit) pts.push(hit.point.clone().addScaledVector(dir, lift));
  }
  return pts;
}

function ornaments(group, o) {
  // a broad collar at the throat
  for (let k = 0; k < 6; k++) {
    const pts = ringOnSurface(-0.72 - k * 0.1, 0.06 + k * 0.012);
    if (pts.length > 20) group.add(tubeAlong(pts, 0.055, k % 2 ? goldDark : gold, true));
  }
  const beadsRing = ringOnSurface(-1.36, 0.1, 40);
  for (const q of beadsRing) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 10), o.stone === 'emerald' ? emerald : ruby); b.position.copy(q); group.add(b); }
  // kundalas
  for (const s of [-1, 1]) {
    const e = onSurface(s * 1.6, 0.7, 0.1, V(-s, 0, 0)) || { p: V(s * 1.5, 0.7, 0.1) };
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.06, 14, 48), gold);
    ring.position.copy(e.p).add(V(s * 0.1, -0.42, 0.05));
    ring.rotation.y = Math.PI / 2;
    group.add(ring);
    const drop = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 12), o.stone === 'emerald' ? emerald : ruby);
    drop.position.copy(ring.position).add(V(0, -0.36, 0));
    group.add(drop);
  }
  // necklaces: gold chains that lie on the chest
  for (const [depth, beads] of [[0.7, false], [1.35, true]]) {
    const pts = [];
    for (let k = 0; k <= 16; k++) {
      const t = k / 16;
      const x = -1.25 - depth * 0.3 + t * (2.5 + depth * 0.6);
      const y = -1.35 - Math.sin(t * Math.PI) * depth;
      const hit = onSurface(x, y);
      if (hit) pts.push(hit.p.addScaledVector(hit.n, 0.05));
    }
    if (pts.length > 3) {
      group.add(tubeAlong(pts, 0.035, gold));
      if (beads) {
        const curve = new THREE.CatmullRomCurve3(pts);
        for (let i = 0; i <= 30; i++) {
          const b = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 10), i % 2 ? pearl : gold);
          b.position.copy(curve.getPoint(i / 30));
          group.add(b);
        }
      }
    }
  }
  const k = onSurface(0, -2.85);
  if (k) {
    const jewel = new THREE.Mesh(new THREE.SphereGeometry(0.22, 24, 18), o.stone === 'emerald' ? emerald : ruby);
    jewel.scale.set(1, 1.2, 0.7);
    jewel.position.copy(k.p).addScaledVector(k.n, 0.15);
    group.add(jewel);
    const set = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.05, 12, 40), gold);
    set.position.copy(jewel.position);
    set.lookAt(jewel.position.clone().add(k.n));
    group.add(set);
  }
}

function garland(group) {
  const kinds = ['marigold', 'marigold', 'rose', 'jasmine', 'tulsi'];
  for (let i = 0; i <= 60; i++) {
    const t = i / 60;
    const x = -3.0 + t * 6.0;
    const y = -1.75 - Math.pow(Math.sin(t * Math.PI), 0.7) * 2.15;
    const hit = onSurface(x, y);
    if (!hit) continue;
    const kind = kinds[i % kinds.length];
    const c = hit.p.addScaledVector(hit.n, 0.16);
    if (kind === 'tulsi') {
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), flowerMats.tulsi);
      leaf.scale.set(1.3, 0.5, 0.4);
      leaf.position.copy(c);
      leaf.rotation.z = i;
      group.add(leaf);
      continue;
    }
    const r = kind === 'jasmine' ? 0.08 : 0.17;
    const core = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 12), flowerMats[kind]);
    core.position.copy(c);
    group.add(core);
    if (kind !== 'jasmine') {
      for (let p = 0; p < 9; p++) {
        const a = (p / 9) * Math.PI * 2;
        const pet = new THREE.Mesh(new THREE.SphereGeometry(r * 0.45, 8, 6), flowerMats[kind]);
        pet.position.copy(c).add(V(Math.cos(a) * r * 0.75, Math.sin(a) * r * 0.75, 0.02));
        group.add(pet);
      }
    }
  }
}

function tilak(group) {
  const pos = V(0, 2.18, 2.0);
  const hit = onSurface(0, 2.18);
  const p = hit ? hit.p : pos;
  const geo = new DecalGeometry(head, p, new THREE.Euler(0, 0, 0), V(0.46, 0.8, 1.2));
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tilakTex, transparent: true, depthTest: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, roughness: 0.6, emissive: '#402010', emissiveIntensity: 0.3 }));
  group.add(m);
}

function moustache(group) {
  for (const s of [-1, 1]) {
    const pts = [];
    for (let k = 0; k <= 8; k++) {
      const t = k / 8;
      const hit = onSurface(s * (0.04 + t * 0.62), 0.86 - t * 0.2 + Math.sin(t * Math.PI) * 0.05);
      if (hit) pts.push(hit.p.addScaledVector(hit.n, 0.04));
    }
    if (pts.length > 3) group.add(tubeAlong(pts, 0.06, hairMat));
  }
}

function armour(group) {
  for (let r = 0; r < 9; r++) {
    for (let c = -12; c <= 12; c++) {
      const x = c * 0.3 + (r % 2) * 0.15;
      const y = -1.9 - r * 0.26;
      const hit = onSurface(x, y);
      if (!hit) continue;
      const sc = new THREE.Mesh(new THREE.SphereGeometry(0.17, 14, 10), r % 2 ? bronze : goldDark);
      sc.position.copy(hit.p).addScaledVector(hit.n, 0.03);
      sc.lookAt(sc.position.clone().add(hit.n));
      sc.scale.set(1, 0.85, 0.3);
      group.add(sc);
    }
  }
}

async function build() {
  const [gltf, col, nrm] = await Promise.all([
    new Promise((res) => new GLTFLoader().load('assets/LeePerrySmith.glb', res)),
    new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.src = 'assets/Map-COL.jpg'; }),
    loadTex('assets/Infinite-Level_02_Tangent_SmoothUV.jpg', false),
  ]);
  const base = gltf.scene.children[0];
  const geo = base.geometry;
  const mkSkin = (map, sheen) => new THREE.MeshPhysicalMaterial({ map, normalMap: nrm, normalScale: new THREE.Vector2(1, 1), roughness: 0.5, sheen: 0.5, sheenColor: sheen, sheenRoughness: 0.5, clearcoat: 0.1, envMap: envTex, envMapIntensity: 0.1 });
  const skins = {
    krishna: mkSkin(retone(col, [0.01, 0.025, 0.12], [0.2, 0.36, 0.9], 0.04, 1.1), '#6f9cff'),
    arjuna: mkSkin(retone(col, [0.2, 0.09, 0.03], [0.92, 0.64, 0.4], 0.25, 0.95), '#ffd0a0'),
  };
  for (const who of ['krishna', 'arjuna']) {
    const g = new THREE.Group();
    head = new THREE.Mesh(geo, skins[who]);
    head.castShadow = true;
    head.receiveShadow = true;
    g.add(head);
    g.updateMatrixWorld(true);
    hairLocks(g, who === 'krishna' ? 7 : 19, who === 'krishna' ? 90 : 60);
    hairCards(g, who === 'krishna' ? 5 : 13, who === 'krishna' ? 110 : 80);
    if (who === 'krishna') {
      g.add(mukut());
      tilak(g);
      ornaments(g, {});
      garland(g);
      g.add(surfaceStrip(Array.from({ length: 60 }, (_, i) => [-3.5 + i * 0.085, -1.85 - i * 0.04]), 0.95, 0.18, silk));
    } else {
      g.add(kirita());
      moustache(g);
      armour(g);
      ornaments(g, { stone: 'emerald' });
    }
    g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    g.visible = false;
    scene.add(g);
    figures[who] = g;
  }
}

/**
 * Render one shot.
 * cam: { az, el, dist, ty, fov, roll } — orbit angles in degrees around the head (0 = straight on)
 * light: { key:[az,el,intensity,color], rim:[intensity,color], fill, under:[intensity,color], exposure }
 */
function render(o) {
  const w = o.w || 1080;
  const h = o.h || 1920;
  renderer.setSize(w, h, false);
  for (const k in figures) figures[k].visible = k === o.who;
  const c = { az: 0, el: 0, dist: 16, ty: 1.2, fov: 24, roll: 0, ...(o.cam || {}) };
  const az = (c.az * Math.PI) / 180;
  const el = (c.el * Math.PI) / 180;
  const target = V(c.tx || 0, c.ty, 0.2);
  camera.fov = c.fov;
  camera.aspect = w / h;
  camera.position.set(target.x + Math.sin(az) * Math.cos(el) * c.dist, target.y + Math.sin(el) * c.dist, target.z + Math.cos(az) * Math.cos(el) * c.dist);
  camera.up.set(Math.sin((c.roll * Math.PI) / 180), Math.cos((c.roll * Math.PI) / 180), 0);
  camera.lookAt(target);
  camera.updateProjectionMatrix();
  const L = { key: [-35, 38, 900, '#fff3e2'], rimL: [3, '#6fb4ff'], rimR: [3, '#8fd0ff'], fill: [0.6, '#3050c0'], under: [0, '#ff8a30'], amb: 0.4, exposure: 1, ...(o.light || {}) };
  const kaz = (L.key[0] * Math.PI) / 180;
  const kel = (L.key[1] * Math.PI) / 180;
  lights.key.position.set(Math.sin(kaz) * Math.cos(kel) * 22, 1.5 + Math.sin(kel) * 22, Math.cos(kaz) * Math.cos(kel) * 22);
  lights.key.target.position.set(0, 1.2, 0);
  lights.key.intensity = L.key[2];
  lights.key.color.set(L.key[3]);
  lights.rimL.position.set(-8, 5, -9);
  lights.rimL.intensity = L.rimL[0];
  lights.rimL.color.set(L.rimL[1]);
  lights.rimR.position.set(9, 3, -8);
  lights.rimR.intensity = L.rimR[0];
  lights.rimR.color.set(L.rimR[1]);
  lights.fill.position.set(6, -2, 10);
  lights.fill.intensity = L.fill[0];
  lights.fill.color.set(L.fill[1]);
  lights.under.position.set(0, -6, 6);
  lights.under.intensity = L.under[0];
  lights.under.color.set(L.under[1]);
  lights.amb.intensity = L.amb;
  renderer.toneMappingExposure = L.exposure;
  renderer.setClearColor(0x000000, 0);
  renderer.render(scene, camera);
  return renderer.domElement.toDataURL(o.format || 'image/png', 0.92);
}

window.BUST = { render, ready: build().then(() => true) };
window.BUST.ready.then(() => { window.__done = true; });
