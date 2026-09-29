import * as THREE from 'three';
import { TOOL_BY_ID, WORLD, type Citizen, type Sim, type ToolId } from './sim';

/**
 * Airstrip One, drawn: a square of Victory Square paving seen from above,
 * little white round-headed citizens with ink outlines and soft shadows, the
 * four Ministries as enormous white terraced pyramids shaded in pencil
 * hatching, and Big Brother on a hoarding whose eyes follow your hand.
 */

const PAPER = '#cfcec4';
const INK = '#161616';
const HEAD = new THREE.Color('#f5f0e2');
const OVERALLS = new THREE.Color('#7d98bf');
const PROLE = new THREE.Color('#a8957c');
const YELLOW = new THREE.Color('#f2cf3a');
const FEAR = new THREE.Color('#b9c1cc');
const FEAR_HEAD = new THREE.Color('#e2e5ea');
const CHILD = new THREE.Color('#c8312a');
const GREY = new THREE.Color('#9a9a96');
const AGENT = new THREE.Color('#2e2c2a');
const AGENT_HEAD = new THREE.Color('#c8312a');

/** Paper white where lit, pencil hatching where not, one or two layers deep. */
function hatchMaterial(base = '#f7f6f1') {
  return new THREE.ShaderMaterial({
    uniforms: { uBase: { value: new THREE.Color(base) }, uLight: { value: new THREE.Vector3(-0.5, 0.8, 0.35).normalize() } },
    vertexShader: /* glsl */ `
      varying vec3 vN; varying vec3 vW;
      void main() { vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uBase; uniform vec3 uLight; varying vec3 vN; varying vec3 vW;
      float h(vec2 p, float a, float w) { float c = cos(a), s = sin(a); float v = fract((c * p.x + s * p.y) / 7.0); return smoothstep(w, w - 0.12, abs(v - 0.5) * 2.0 - (1.0 - w)); }
      float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
      void main() {
        float l = max(0.0, dot(normalize(vN), uLight));
        vec2 p = gl_FragCoord.xy + (hash(floor(gl_FragCoord.xy / 3.0)) - 0.5) * 1.4;
        float ink = 0.0;
        if (l < 0.55) ink = max(ink, h(p, 0.9, 0.16));
        if (l < 0.25) ink = max(ink, h(p, -0.7, 0.14));
        ink *= 0.55 + 0.45 * hash(floor(p / 5.0));
        gl_FragColor = vec4(mix(uBase, vec3(0.2), ink * 0.75), 1.0);
      }`,
  });
}
const OUTLINE = new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide });

function withOutline(g: THREE.BufferGeometry, mat: THREE.Material, k = 1.04) {
  const grp = new THREE.Group();
  grp.add(new THREE.Mesh(g, mat));
  const o = new THREE.Mesh(g, OUTLINE);
  o.scale.setScalar(k);
  grp.add(o);
  return grp;
}

function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d')!);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** Big Brother, drawn in line: heavy black moustache, ruggedly handsome, forty-five or so. */
export function drawBigBrother(g: CanvasRenderingContext2D, W: number, H: number, eyes = true) {
  g.fillStyle = '#f7f6f1'; g.fillRect(0, 0, W, H);
  g.strokeStyle = INK; g.lineWidth = W * 0.012; g.lineCap = 'round'; g.lineJoin = 'round';
  const cx = W / 2, cy = H * 0.45, r = W * 0.26;
  // shoulders, collar
  g.beginPath(); g.moveTo(W * 0.08, H); g.quadraticCurveTo(W * 0.14, H * 0.74, cx - r * 0.7, H * 0.72); g.lineTo(cx + r * 0.7, H * 0.72); g.quadraticCurveTo(W * 0.86, H * 0.74, W * 0.92, H); g.stroke();
  g.beginPath(); g.moveTo(cx - r * 0.45, H * 0.72); g.lineTo(cx, H * 0.86); g.lineTo(cx + r * 0.45, H * 0.72); g.stroke();
  // head
  g.beginPath(); g.ellipse(cx, cy, r * 0.82, r, 0, 0, Math.PI * 2); g.stroke();
  // hair
  g.fillStyle = INK; g.beginPath(); g.ellipse(cx, cy - r * 0.62, r * 0.84, r * 0.45, 0, Math.PI * 1.02, Math.PI * 1.98); g.fill();
  // brows
  g.lineWidth = W * 0.016;
  g.beginPath(); g.moveTo(cx - r * 0.55, cy - r * 0.22); g.lineTo(cx - r * 0.12, cy - r * 0.18); g.stroke();
  g.beginPath(); g.moveTo(cx + r * 0.55, cy - r * 0.22); g.lineTo(cx + r * 0.12, cy - r * 0.18); g.stroke();
  // nose
  g.lineWidth = W * 0.01;
  g.beginPath(); g.moveTo(cx, cy - r * 0.1); g.lineTo(cx - r * 0.08, cy + r * 0.28); g.lineTo(cx + r * 0.06, cy + r * 0.3); g.stroke();
  // the moustache
  g.beginPath(); g.moveTo(cx - r * 0.45, cy + r * 0.5); g.quadraticCurveTo(cx - r * 0.2, cy + r * 0.3, cx, cy + r * 0.4); g.quadraticCurveTo(cx + r * 0.2, cy + r * 0.3, cx + r * 0.45, cy + r * 0.5); g.quadraticCurveTo(cx, cy + r * 0.56, cx - r * 0.45, cy + r * 0.5); g.fill();
  if (eyes) { g.beginPath(); g.arc(cx - r * 0.32, cy - r * 0.02, r * 0.07, 0, Math.PI * 2); g.fill(); g.beginPath(); g.arc(cx + r * 0.32, cy - r * 0.02, r * 0.07, 0, Math.PI * 2); g.fill(); }
  // hatching down one side of the face
  g.lineWidth = W * 0.004;
  for (let k = 0; k < 14; k++) { const x = cx + r * 0.45 + k * r * 0.03; g.beginPath(); g.moveTo(x, cy - r * 0.3 + k * r * 0.03); g.lineTo(x + r * 0.08, cy + r * 0.5); g.stroke(); }
}

/** Goldstein, for the Hate: a lean face, a wisp of white hair, a small goatee. */
export function drawGoldstein(g: CanvasRenderingContext2D, W: number, H: number) {
  g.fillStyle = '#f7f6f1'; g.fillRect(0, 0, W, H);
  g.strokeStyle = INK; g.lineWidth = W * 0.02; g.lineCap = 'round';
  const cx = W / 2, cy = H * 0.5, r = W * 0.28;
  g.beginPath(); g.ellipse(cx, cy, r * 0.7, r, 0, 0, Math.PI * 2); g.stroke();
  g.beginPath(); g.moveTo(cx - r * 0.7, cy - r * 0.5); g.quadraticCurveTo(cx - r, cy - r * 1.1, cx - r * 0.2, cy - r * 1.05); g.stroke();
  g.beginPath(); g.moveTo(cx + r * 0.7, cy - r * 0.5); g.quadraticCurveTo(cx + r, cy - r * 1.1, cx + r * 0.2, cy - r * 1.05); g.stroke();
  g.fillStyle = INK; g.beginPath(); g.moveTo(cx - r * 0.18, cy + r * 0.8); g.lineTo(cx, cy + r * 1.35); g.lineTo(cx + r * 0.18, cy + r * 0.8); g.fill();
  g.beginPath(); g.arc(cx - r * 0.28, cy - r * 0.1, r * 0.08, 0, Math.PI * 2); g.fill(); g.beginPath(); g.arc(cx + r * 0.28, cy - r * 0.1, r * 0.08, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.ellipse(cx - r * 0.28, cy - r * 0.1, r * 0.18, r * 0.14, 0, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.ellipse(cx + r * 0.28, cy - r * 0.1, r * 0.18, r * 0.14, 0, 0, Math.PI * 2); g.stroke();
  g.fillStyle = '#c8312a'; g.font = `700 ${W * 0.1}px Oswald, sans-serif`; g.textAlign = 'center'; g.fillText('GOLDSTEIN', cx, H * 0.95);
}


export class World {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(30, 1, 1, 400);
  renderer: THREE.WebGLRenderer;
  private n: number;
  private bodies: THREE.InstancedMesh;
  private heads: THREE.InstancedMesh;
  private bodyOut: THREE.InstancedMesh;
  private headOut: THREE.InstancedMesh;
  private caps: THREE.InstancedMesh;
  private shadows: THREE.InstancedMesh;
  private coins: THREE.InstancedMesh;
  private m = new THREE.Matrix4();
  private q = new THREE.Quaternion();
  private v = new THREE.Vector3();
  private s = new THREE.Vector3();
  private bbEyes: THREE.Mesh[] = [];
  private bbFace = new THREE.Vector3();
  private builtIds = new Set<number>();
  private effectObjs = new Map<number, THREE.Object3D>();
  private vans = new Map<number, THREE.Object3D>();
  private ghost: THREE.Group;
  private ghostRing: THREE.Mesh;
  private ray = new THREE.Raycaster();
  private ground: THREE.Mesh;
  private ministries: THREE.Vector3[] = [];
  private w = 1;
  private h = 1;
  pointer = new THREE.Vector2(0, 0);

  constructor(canvas: HTMLCanvasElement, maxCitizens = 260) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    this.renderer.setClearColor(PAPER);
    this.n = maxCitizens;
    const s = this.scene;
    s.add(new THREE.HemisphereLight('#ffffff', '#d8d6cf', 2.2));
    const sun = new THREE.DirectionalLight('#ffffff', 1.1); sun.position.set(-10, 20, 8); s.add(sun);

    // the paving of Victory Square
    const gt = canvasTex(2048, 1244, (g) => {
      g.fillStyle = '#dedcd2'; g.fillRect(0, 0, 2048, 1244);
      for (let i = 0; i < 120000; i++) { g.fillStyle = `rgba(40,40,30,${Math.random() * 0.05})`; g.fillRect(Math.random() * 2048, Math.random() * 1244, 2, 2); }
      g.strokeStyle = 'rgba(40,40,30,0.12)'; g.lineWidth = 2;
      for (let x = 0; x <= 2048; x += 2048 / 28) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 1244); g.stroke(); }
      for (let y = 0; y <= 1244; y += 1244 / 17) { g.beginPath(); g.moveTo(0, y); g.lineTo(2048, y); g.stroke(); }
      g.strokeStyle = 'rgba(0,0,0,0.12)'; g.lineWidth = 5; g.strokeRect(40, 40, 2048 - 80, 1244 - 80);
    });
    this.ground = new THREE.Mesh(new THREE.PlaneGeometry(WORLD.w + 4, WORLD.d + 4), new THREE.MeshBasicMaterial({ map: gt }));
    this.ground.rotation.x = -Math.PI / 2;
    s.add(this.ground);
    const outer = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshBasicMaterial({ color: '#c9c8be' }));
    outer.rotation.x = -Math.PI / 2; outer.position.y = -0.02; s.add(outer);

    // Victory Mansions and the rest of London, around the square
    const hatch = hatchMaterial();
    const blocks: [number, number, number, number, number][] = [];
    // a row behind the square (leaving a gap for Big Brother) and down both sides; nothing in front, where you stand
    for (let x = -WORLD.w / 2 - 4; x < WORLD.w / 2 + 6; x += 6.5) if (Math.abs(x) > 9) blocks.push([x, -WORLD.d / 2 - 5, 5.5, 4 + ((x * 7) % 4 + 4) % 4, 5]);
    for (let z = -WORLD.d / 2 + 2; z < WORLD.d / 2 - 4; z += 6.5) { blocks.push([-WORLD.w / 2 - 5, z, 5, 3 + ((z * 5) % 3 + 3) % 3, 5.5]); blocks.push([WORLD.w / 2 + 5, z, 5, 3 + ((z * 3) % 3 + 3) % 3, 5.5]); }
    const posterTex = canvasTex(256, 330, (g) => { drawBigBrother(g, 256, 256); g.fillStyle = INK; g.fillRect(0, 256, 256, 74); g.fillStyle = '#f7f6f1'; g.font = '700 30px Oswald, sans-serif'; g.textAlign = 'center'; g.fillText('BIG BROTHER', 128, 290); g.fillText('IS WATCHING YOU', 128, 322); });
    const posterMat = new THREE.MeshBasicMaterial({ map: posterTex });
    blocks.forEach(([x, z, w, h, d], i) => {
      const b = withOutline(new THREE.BoxGeometry(w, h, d), hatch, 1.02);
      b.position.set(x, h / 2, z);
      s.add(b);
      if (i % 2 === 0 && h > 3) {
        const pst = new THREE.Mesh(new THREE.PlaneGeometry(2, 2.6), posterMat);
        const side = Math.abs(z) > WORLD.d / 2 ? 'ns' : 'ew';
        if (side === 'ns') { pst.position.set(x, h * 0.55, z + (z < 0 ? d / 2 + 0.03 : -d / 2 - 0.03)); if (z > 0) pst.rotation.y = Math.PI; }
        else { pst.position.set(x + (x < 0 ? w / 2 + 0.03 : -w / 2 - 0.03), h * 0.55, z); pst.rotation.y = x < 0 ? Math.PI / 2 : -Math.PI / 2; }
        s.add(pst);
      }
    });
    // the four Ministries: terrace upon terrace of white concrete
    const corners: [number, number, string][] = [[-22, -WORLD.d / 2 - 22, 'MINITRUE'], [22, -WORLD.d / 2 - 22, 'MINIPLENTY'], [-46, -WORLD.d / 2 - 12, 'MINILUV'], [46, -WORLD.d / 2 - 12, 'MINIPAX']];
    for (const [x, z, label] of corners) {
      const grp = new THREE.Group();
      for (let k = 0; k < 6; k++) {
        const w = 18 - k * 2.8, h = 3.2;
        const t = withOutline(new THREE.BoxGeometry(w, h, w), hatch, 1.015);
        t.position.y = h / 2 + k * h; grp.add(t);
      }
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(9, 1.6), new THREE.MeshBasicMaterial({ map: canvasTex(512, 90, (g) => { g.fillStyle = '#f7f6f1'; g.fillRect(0, 0, 512, 90); g.fillStyle = INK; g.font = '700 58px Oswald, sans-serif'; g.textAlign = 'center'; g.fillText(label, 256, 66); }) }));
      sign.position.set(0, 1.6, 9.05); grp.add(sign);
      grp.position.set(x, 0, z);
      s.add(grp);
      this.ministries.push(new THREE.Vector3(x, 16, z));
    }
    // Big Brother, watching, on a hoarding at the head of the square
    const bbTex = canvasTex(1024, 1200, (g) => {
      drawBigBrother(g, 1024, 1024, false);
      g.fillStyle = INK; g.fillRect(0, 1024, 1024, 176);
      g.fillStyle = '#f7f6f1'; g.font = '700 76px Oswald, sans-serif'; g.textAlign = 'center';
      g.fillText('BIG BROTHER IS', 512, 1098); g.fillText('WATCHING YOU', 512, 1178);
      g.strokeStyle = INK; g.lineWidth = 14; g.strokeRect(7, 7, 1010, 1186);
    });
    const bb = new THREE.Mesh(new THREE.PlaneGeometry(12, 14), new THREE.MeshBasicMaterial({ map: bbTex }));
    bb.position.set(0, 7.6, -WORLD.d / 2 - 6);
    bb.rotation.x = -0.32;
    s.add(bb);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(12.6, 14.6, 0.4), OUTLINE);
    frame.position.copy(bb.position).add(new THREE.Vector3(0, 0, -0.25)); frame.rotation.copy(bb.rotation); s.add(frame);
    for (const px of [-4.5, 4.5]) { const leg = withOutline(new THREE.BoxGeometry(0.5, 3.4, 0.5), hatch); leg.position.set(px, 1.7, -WORLD.d / 2 - 5); s.add(leg); }
    // his eyes, which follow you
    for (const ex of [-0.32, 0.32]) {
      const eye = new THREE.Mesh(new THREE.CircleGeometry(0.36, 20), new THREE.MeshBasicMaterial({ color: INK }));
      bb.add(eye);
      eye.position.set(ex * 12 * 0.26 * 1.0, 14 * (0.5 - 0.45 * (1024 / 1200)) + 0.35, 0.02);
      eye.userData.base = eye.position.clone();
      this.bbEyes.push(eye);
    }
    bb.updateMatrixWorld();
    this.bbFace.set(0, 10, -WORLD.d / 2 - 7);

    // the citizens, all at once
    const bodyG = new THREE.CapsuleGeometry(0.32, 0.36, 4, 12); bodyG.translate(0, 0.6, 0);
    const headG = new THREE.SphereGeometry(0.42, 20, 14); headG.translate(0, 1.42, 0);
    const capG = new THREE.SphereGeometry(0.44, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.42); capG.translate(0, 1.47, 0.02);
    const toon = new THREE.MeshToonMaterial({ color: '#ffffff', gradientMap: (() => { const t = new THREE.DataTexture(new Uint8Array([185, 185, 185, 255, 255, 255, 255, 255]), 2, 1); t.needsUpdate = true; return t; })() });
    this.bodies = new THREE.InstancedMesh(bodyG, toon, this.n);
    this.heads = new THREE.InstancedMesh(headG, toon, this.n);
    this.bodyOut = new THREE.InstancedMesh(bodyG, OUTLINE, this.n);
    this.headOut = new THREE.InstancedMesh(headG, OUTLINE, this.n);
    this.caps = new THREE.InstancedMesh(capG, new THREE.MeshBasicMaterial({ color: '#3a3936' }), this.n);
    const shTex = canvasTex(64, 64, (g) => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(0,0,0,0.28)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); });
    const shG = new THREE.PlaneGeometry(1.3, 0.9); shG.rotateX(-Math.PI / 2);
    this.shadows = new THREE.InstancedMesh(shG, new THREE.MeshBasicMaterial({ map: shTex, transparent: true, depthWrite: false }), this.n);
    for (const im of [this.bodies, this.heads, this.bodyOut, this.headOut, this.caps, this.shadows]) { im.frustumCulled = false; im.count = 0; s.add(im); }
    for (let i = 0; i < this.n; i++) { this.bodies.setColorAt(i, OVERALLS); this.heads.setColorAt(i, HEAD); }
    // tribute, flying up to the Ministries
    const coinG = new THREE.CylinderGeometry(0.16, 0.16, 0.04, 14); coinG.rotateX(Math.PI / 2);
    this.coins = new THREE.InstancedMesh(coinG, new THREE.MeshBasicMaterial({ color: '#fdfcf6' }), 240);
    this.coins.frustumCulled = false; this.coins.count = 0; s.add(this.coins);
    const coinOut = new THREE.InstancedMesh(coinG, OUTLINE, 240); coinOut.frustumCulled = false; coinOut.count = 0; s.add(coinOut);
    this.coins.userData.out = coinOut;
    // the placing ghost
    this.ghost = new THREE.Group();
    this.ghostRing = new THREE.Mesh(new THREE.RingGeometry(0.96, 1, 64), new THREE.MeshBasicMaterial({ color: INK, transparent: true, opacity: 0.55 }));
    this.ghostRing.rotation.x = -Math.PI / 2; this.ghostRing.position.y = 0.03;
    this.ghost.add(this.ghostRing);
    this.ghost.visible = false;
    s.add(this.ghost);
    this.hl = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 72), new THREE.MeshBasicMaterial({ color: '#c8312a', transparent: true, opacity: 0.9, depthTest: false }));
    this.hl.rotation.x = -Math.PI / 2; this.hl.position.y = 0.05; this.hl.visible = false; this.hl.renderOrder = 10;
    s.add(this.hl);
  }

  private hl: THREE.Mesh;
  /** Point at a spot on the square (or stop pointing). */
  setHighlight(x: number | null, z = 0, r = 3) {
    if (x === null) { this.hl.visible = false; return; }
    this.hl.visible = true; this.hl.position.x = x; this.hl.position.z = z; this.hl.userData.r = r;
  }

  resize(w: number, h: number) {
    this.w = w; this.h = h;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // fit the square: further back on a tall screen
    const portrait = w < h;
    this.camera.fov = portrait ? 46 : 32;
    const dist = portrait ? 74 : Math.max(58, 58 * (1.6 / (w / h)));
    // low enough that the citizens read as people standing up, high enough to see the whole square
    this.camera.position.set(0, dist * 0.62, dist * 0.78);
    this.camera.lookAt(0, 0, portrait ? -3 : -2.5);
    this.camera.updateProjectionMatrix();
  }

  /** Where on the ground the pointer is. */
  groundAt(cx: number, cy: number) {
    this.ray.setFromCamera(new THREE.Vector2((cx / this.w) * 2 - 1, -(cy / this.h) * 2 + 1), this.camera);
    const p = new THREE.Vector3();
    return this.ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), p) ? p : null;
  }

  /** The citizen under the pointer, if any: nearest on screen, within a finger's width. */
  citizenAt(sim: Sim, cx: number, cy: number) {
    let best: Citizen | null = null, bd = Math.max(26, this.h * 0.035);
    for (const c of sim.citizens) {
      if (!c.alive || c.vanish > 0 || c.kind === 'child') continue;
      const p = this.screenOf(c.x, 1, c.z);
      const d = Math.hypot(p.x - cx, p.y - cy) - (c.thinking ? 8 : 0);
      if (d < bd) { bd = d; best = c; }
    }
    return best;
  }

  screenOf(x: number, y: number, z: number) {
    const v = this.v.set(x, y, z).project(this.camera);
    return { x: ((v.x + 1) / 2) * this.w, y: ((1 - v.y) / 2) * this.h, on: v.z < 1 };
  }

  setGhost(tool: ToolId | null, at: THREE.Vector3 | null) {
    if (!tool || !at) { this.ghost.visible = false; return; }
    const r = TOOL_BY_ID[tool].radius || 1.4;
    this.ghost.visible = true;
    this.ghost.position.set(at.x, 0, at.z);
    this.ghostRing.scale.setScalar(r);
  }

  private building(tool: ToolId) {
    const hatch = hatchMaterial();
    const g = new THREE.Group();
    if (tool === 'telescreen') {
      const pole = withOutline(new THREE.CylinderGeometry(0.1, 0.12, 3.2, 8), hatch); pole.position.y = 1.6; g.add(pole);
      const box = withOutline(new THREE.BoxGeometry(1.8, 1.2, 0.3), hatch, 1.05); box.position.set(0, 3.5, 0); g.add(box);
      const face = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.95), new THREE.MeshBasicMaterial({ map: canvasTex(256, 160, (c) => { c.fillStyle = '#e9ede9'; c.fillRect(0, 0, 256, 160); c.strokeStyle = INK; c.lineWidth = 8; c.beginPath(); c.ellipse(128, 80, 70, 36, 0, 0, Math.PI * 2); c.stroke(); c.fillStyle = INK; c.beginPath(); c.arc(128, 80, 22, 0, Math.PI * 2); c.fill(); }) }));
      face.position.set(0, 3.5, 0.17); face.rotation.x = -0.35; g.add(face);
      const ring = new THREE.Mesh(new THREE.RingGeometry(TOOL_BY_ID.telescreen.radius - 0.06, TOOL_BY_ID.telescreen.radius, 72), new THREE.MeshBasicMaterial({ color: INK, transparent: true, opacity: 0.18 }));
      ring.rotation.x = -Math.PI / 2; ring.position.y = 0.02; g.add(ring);
    } else if (tool === 'minitrue') {
      for (let k = 0; k < 3; k++) { const t = withOutline(new THREE.BoxGeometry(2.4 - k * 0.7, 0.55, 2.4 - k * 0.7), hatch, 1.04); t.position.y = 0.28 + k * 0.55; g.add(t); }
      const tube = withOutline(new THREE.CylinderGeometry(0.14, 0.14, 1.2, 8), hatch); tube.position.set(0.9, 0.6, 0.9); g.add(tube);
    } else if (tool === 'newspeak') {
      const plinth = withOutline(new THREE.CylinderGeometry(0.7, 0.8, 1, 16), hatch); plinth.position.y = 0.5; g.add(plinth);
      const book = withOutline(new THREE.BoxGeometry(1.1, 0.25, 0.8), new THREE.MeshToonMaterial({ color: '#c8312a' })); book.position.y = 1.15; book.rotation.y = 0.4; g.add(book);
    } else if (tool === 'spies') {
      const flag = withOutline(new THREE.CylinderGeometry(0.05, 0.05, 2.4, 6), hatch); flag.position.y = 1.2; g.add(flag);
      const cloth = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.55), new THREE.MeshBasicMaterial({ color: '#c8312a', side: THREE.DoubleSide })); cloth.position.set(0.47, 2.1, 0); g.add(cloth);
    }
    return g;
  }

  private effect(tool: ToolId, r: number) {
    const g = new THREE.Group();
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.92, 1, 64), new THREE.MeshBasicMaterial({ color: tool === 'rally' || tool === 'hate' ? '#c8312a' : INK, transparent: true, opacity: 0.5 }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.04; ring.scale.setScalar(r); ring.name = 'ring';
    g.add(ring);
    const tex = canvasTex(256, 256, (c) => {
      c.fillStyle = '#f7f6f1'; c.fillRect(0, 0, 256, 256);
      c.strokeStyle = INK; c.lineWidth = 10; c.strokeRect(5, 5, 246, 246);
      if (tool === 'hate' || tool === 'rally') drawGoldstein(c, 256, 256);
      else if (tool === 'gin') { c.lineWidth = 9; c.beginPath(); c.moveTo(108, 40); c.lineTo(148, 40); c.lineTo(148, 90); c.quadraticCurveTo(190, 110, 190, 150); c.lineTo(190, 220); c.lineTo(66, 220); c.lineTo(66, 150); c.quadraticCurveTo(66, 110, 108, 90); c.closePath(); c.stroke(); c.fillStyle = INK; c.font = '700 40px Oswald, sans-serif'; c.textAlign = 'center'; c.fillText('GIN', 128, 180); }
      else if (tool === 'lottery') { c.fillStyle = INK; c.font = '700 44px Oswald, sans-serif'; c.textAlign = 'center'; c.fillText('LOTTERY', 128, 70); c.font = '700 60px Oswald, sans-serif'; c.fillText('7 · 19 · 42', 128, 160); c.fillStyle = '#c8312a'; c.fillText('?', 128, 225); }
    });
    const board = new THREE.Mesh(new THREE.PlaneGeometry(tool === 'rally' ? 4 : 2.6, tool === 'rally' ? 4 : 2.6), new THREE.MeshBasicMaterial({ map: tex }));
    board.position.y = tool === 'rally' ? 4.6 : 3.2; board.rotation.x = -0.4; board.name = 'board';
    g.add(board);
    const post = withOutline(new THREE.CylinderGeometry(0.08, 0.08, board.position.y, 6), hatchMaterial()); post.position.y = board.position.y / 2; g.add(post);
    if (tool === 'rally') for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; const f = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 2.4), new THREE.MeshBasicMaterial({ color: '#c8312a', side: THREE.DoubleSide })); f.position.set(Math.cos(a) * r * 0.8, 1.6, Math.sin(a) * r * 0.8); f.lookAt(0, 1.6, 0); g.add(f); }
    return g;
  }

  private van() {
    const g = new THREE.Group();
    const black = new THREE.MeshToonMaterial({ color: '#232323' });
    const body = withOutline(new THREE.BoxGeometry(1.6, 1.3, 3), black); body.position.y = 0.95; g.add(body);
    const cab = withOutline(new THREE.BoxGeometry(1.5, 0.9, 1), black); cab.position.set(0, 0.75, 1.9); g.add(cab);
    for (const [x, z] of [[-0.8, -0.9], [0.8, -0.9], [-0.8, 1.6], [0.8, 1.6]] as [number, number][]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.2, 12), new THREE.MeshBasicMaterial({ color: INK })); w.rotation.z = Math.PI / 2; w.position.set(x, 0.3, z); g.add(w); }
    return g;
  }

  /** Bring the picture up to date with the simulation. */
  sync(sim: Sim, t: number) {
    // buildings: add any new ones
    for (const b of sim.buildings) {
      if (this.builtIds.has(b.id)) continue;
      this.builtIds.add(b.id);
      const o = this.building(b.tool);
      o.position.set(b.x, 0, b.z);
      o.userData.born = t;
      o.name = 'bld';
      this.scene.add(o);
    }
    this.scene.children.forEach((o) => { if (o.name === 'bld') { const k = Math.min(1, (t - o.userData.born) * 3); o.scale.setScalar(0.3 + 0.7 * (1 - Math.pow(1 - k, 3))); } });
    // effects
    const live = new Set(sim.effects.map((e) => e.id));
    for (const e of sim.effects) {
      let o = this.effectObjs.get(e.id);
      if (!o) { o = this.effect(e.tool, e.r); o.position.set(e.x, 0, e.z); this.scene.add(o); this.effectObjs.set(e.id, o); }
      const ring = o.getObjectByName('ring') as THREE.Mesh;
      const k = (e.t % 1.2) / 1.2;
      ring.scale.setScalar(e.r * (0.6 + 0.4 * k));
      (ring.material as THREE.MeshBasicMaterial).opacity = 0.5 * (1 - k) * (1 - e.t / e.life);
      const board = o.getObjectByName('board')!;
      board.position.y += Math.sin(t * 3) * 0.004;
      o.scale.setScalar(Math.min(1, e.t * 4) * Math.min(1, (e.life - e.t) * 2));
    }
    for (const [id, o] of this.effectObjs) if (!live.has(id)) { this.scene.remove(o); this.effectObjs.delete(id); }
    // citizens
    let i = 0;
    for (const c of sim.citizens) {
      if (!c.alive || i >= this.n) continue;
      const vanishK = c.vanish > 0 ? Math.max(0, Math.min(1, (c.vanish - 0.2) / 1.2)) : 1;
      const child = c.kind === 'child';
      const sc = (child ? 0.7 : 1) * vanishK;
      const moving = !c.thinking && c.vanish <= 0;
      const bob = moving ? Math.abs(Math.sin(c.walk)) * 0.08 : 0;
      const jump = c.distracted > 0 && (c.distraction === 'hate' || c.distraction === 'rally') ? Math.abs(Math.sin(t * 9 + c.id)) * 0.25 : 0;
      this.q.setFromAxisAngle(this.v.set(0, 1, 0), c.face);
      this.m.compose(this.s.set(c.x, bob + jump, c.z), this.q, this.v.set(sc, sc, sc));
      this.bodies.setMatrixAt(i, this.m);
      // the head: tipped back and up when thinking
      const up = c.thinking ? 0.12 : 0;
      const headM = new THREE.Matrix4().compose(this.s.set(c.x, bob + jump + up * sc, c.z - (c.thinking ? 0.06 : 0)), this.q, this.v.set(sc, sc, sc));
      this.heads.setMatrixAt(i, headM);
      const k = 1.1;
      this.bodyOut.setMatrixAt(i, this.m.clone().multiply(new THREE.Matrix4().makeTranslation(0, 0.6, 0)).multiply(new THREE.Matrix4().makeScale(k, 1.07, k)).multiply(new THREE.Matrix4().makeTranslation(0, -0.6, 0)));
      this.headOut.setMatrixAt(i, headM.clone().multiply(new THREE.Matrix4().makeTranslation(0, 1.42, 0)).multiply(new THREE.Matrix4().makeScale(1.09, 1.09, 1.09)).multiply(new THREE.Matrix4().makeTranslation(0, -1.42, 0)));
      const capped = c.kind === 'prole' || c.special === 'winston';
      this.caps.setMatrixAt(i, capped ? headM : new THREE.Matrix4().makeScale(0, 0, 0));
      this.m.compose(this.s.set(c.x + 0.25, 0.02, c.z + 0.2), new THREE.Quaternion(), this.v.set(sc, 1, sc));
      this.shadows.setMatrixAt(i, this.m);
      const shown = c.agent && c.revealed > 0;
      const body = c.vanish > 0 ? GREY : shown ? AGENT : c.thinking ? YELLOW : c.fear > 0 ? FEAR : child ? CHILD : c.special === 'julia' ? CHILD : c.kind === 'prole' ? PROLE : OVERALLS;
      const head = c.vanish > 0 ? GREY : shown ? AGENT_HEAD : c.thinking ? YELLOW : c.fear > 0 ? FEAR_HEAD : HEAD;
      this.bodies.setColorAt(i, body);
      this.heads.setColorAt(i, head);
      i++;
    }
    for (const im of [this.bodies, this.heads, this.bodyOut, this.headOut, this.caps, this.shadows]) { im.count = i; im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; }
    // vans for arrests
    const taking = new Set<number>();
    for (const c of sim.citizens) {
      if (!c.alive || c.vanish <= 0) continue;
      taking.add(c.id);
      let v = this.vans.get(c.id);
      if (!v) { v = this.van(); this.scene.add(v); this.vans.set(c.id, v); v.userData.from = new THREE.Vector3(c.x < 0 ? -WORLD.w / 2 - 4 : WORLD.w / 2 + 4, 0, c.z + 3); }
      const p = 1 - c.vanish / 2.4;
      const from = v.userData.from as THREE.Vector3;
      const at = new THREE.Vector3(c.x + 1.2, 0, c.z);
      const k = p < 0.4 ? p / 0.4 : p < 0.7 ? 1 : 1 - (p - 0.7) / 0.3;
      v.position.lerpVectors(from, at, 1 - Math.pow(1 - k, 2));
      v.lookAt(at.x + (p < 0.7 ? 0 : from.x - at.x), 0, at.z);
    }
    for (const [id, v] of this.vans) if (!taking.has(id)) { this.scene.remove(v); this.vans.delete(id); }
    // tribute flying up to the Ministries
    let j = 0;
    const out = this.coins.userData.out as THREE.InstancedMesh;
    for (const p of sim.paid) {
      if (j >= 240) break;
      const target = this.ministries.reduce((a, b) => (Math.hypot(b.x - p.x, b.z - p.z) < Math.hypot(a.x - p.x, a.z - p.z) ? b : a));
      const k = p.t / 1.4;
      const x = p.x + (target.x - p.x) * k * k, z = p.z + (target.z - p.z) * k * k, y = 1.9 + Math.sin(k * Math.PI) * 5 + k * k * (target.y - 2);
      this.q.setFromEuler(new THREE.Euler(t * 5 + j, t * 3, 0));
      this.m.compose(this.s.set(x, y, z), this.q, this.v.set(1, 1, 1));
      this.coins.setMatrixAt(j, this.m);
      out.setMatrixAt(j, this.m.clone().multiply(new THREE.Matrix4().makeScale(1.25, 1.25, 1.6)));
      j++;
    }
    this.coins.count = j; out.count = j;
    this.coins.instanceMatrix.needsUpdate = true; out.instanceMatrix.needsUpdate = true;
    if (this.hl.visible) { const r = (this.hl.userData.r as number) * (1 + 0.08 * Math.sin(t * 5)); this.hl.scale.setScalar(r); }
    // Big Brother's eyes follow the pointer
    for (const e of this.bbEyes) {
      const b = e.userData.base as THREE.Vector3;
      e.position.set(b.x + this.pointer.x * 0.18, b.y + this.pointer.y * 0.12, b.z);
    }
  }

  render() { this.renderer.render(this.scene, this.camera); }

  dispose() { this.renderer.dispose(); }
}
