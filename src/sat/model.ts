/**
 * A 3D model of the satellite as designed: the bus wrapped in gold MLI or
 * covered in cells, the arrays (body, folding, fixed, sun-tracking or
 * roll-out), radiators, antennas, star-tracker baffles, thrusters and the
 * payload. Everything that deploys is hinged, so the model can unfold.
 *
 * Body axes: +Z points at the Earth (nadir), ±Y carry the solar wings,
 * −X is the aft face with the engines.
 */
import * as THREE from 'three';
import type { Comp } from './catalog';

function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, repeat = false) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d')!);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  return t;
}

let MATS: Record<string, THREE.Material> | null = null;
function mats() {
  if (MATS) return MATS;
  const cells = canvasTex(256, 256, (g) => {
    g.fillStyle = '#c9ccd2'; g.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
      const gr = g.createLinearGradient(x * 64, y * 64, x * 64 + 64, y * 64 + 64);
      gr.addColorStop(0, '#1d2a5c'); gr.addColorStop(0.5, '#2c3f86'); gr.addColorStop(1, '#16214a');
      g.fillStyle = gr; g.fillRect(x * 64 + 3, y * 64 + 3, 58, 58);
      g.strokeStyle = 'rgba(200,210,230,0.35)'; g.lineWidth = 0.8;
      for (let k = 1; k < 6; k++) { g.beginPath(); g.moveTo(x * 64 + 3, y * 64 + 3 + k * 10); g.lineTo(x * 64 + 61, y * 64 + 3 + k * 10); g.stroke(); }
    }
  }, true);
  const mli = canvasTex(256, 256, (g) => {
    const gr = g.createLinearGradient(0, 0, 256, 256);
    gr.addColorStop(0, '#b8862a'); gr.addColorStop(0.5, '#f4d27a'); gr.addColorStop(1, '#a87522');
    g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
    // crinkles in the foil
    for (let i = 0; i < 260; i++) {
      const x = Math.random() * 256, y = Math.random() * 256;
      g.strokeStyle = `rgba(${Math.random() < 0.5 ? '255,240,190' : '90,55,10'},${0.15 + Math.random() * 0.3})`;
      g.lineWidth = 0.6 + Math.random();
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + (Math.random() - 0.5) * 40, y + (Math.random() - 0.5) * 40); g.stroke();
    }
    g.strokeStyle = 'rgba(80,50,10,0.5)'; g.lineWidth = 2;
    g.strokeRect(1, 1, 254, 254);
  }, true);
  MATS = {
    cells: new THREE.MeshStandardMaterial({ map: cells, roughness: 0.35, metalness: 0.4 }),
    back: new THREE.MeshStandardMaterial({ color: 0x3a3d44, roughness: 0.7 }),
    mli: new THREE.MeshStandardMaterial({ map: mli, roughness: 0.32, metalness: 0.85 }),
    alu: new THREE.MeshStandardMaterial({ color: 0xb9bdc4, roughness: 0.45, metalness: 0.8 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x202228, roughness: 0.6, metalness: 0.3 }),
    white: new THREE.MeshStandardMaterial({ color: 0xf2f2ee, roughness: 0.55 }),
    rad: new THREE.MeshStandardMaterial({ color: 0xe9eef2, roughness: 0.15, metalness: 0.6 }),
    glass: new THREE.MeshStandardMaterial({ color: 0x0b1424, roughness: 0.05, metalness: 0.9 }),
    copper: new THREE.MeshStandardMaterial({ color: 0xb06a3a, roughness: 0.4, metalness: 0.8 }),
    nozzle: new THREE.MeshStandardMaterial({ color: 0x55585e, roughness: 0.35, metalness: 0.9, side: THREE.DoubleSide }),
    blanket: new THREE.MeshStandardMaterial({ map: cells, roughness: 0.35, metalness: 0.3, side: THREE.DoubleSide }),
    kapton: new THREE.MeshStandardMaterial({ color: 0xc8892e, roughness: 0.5, metalness: 0.4 }),
  };
  return MATS;
}

export type SatModel = {
  group: THREE.Group;
  /** deploy: 0 stowed → 1 deployed; sun: direction of the Sun in body axes */
  update: (deploy: number, sunBody: THREE.Vector3, t: number) => void;
  size: number;
};

export function buildSatellite(parts: Comp[], radiatorM2: number): SatModel {
  const M = mats();
  const g = new THREE.Group();
  const bus = parts.find((c) => c.slot === 'bus');
  const [sx, sy, sz] = bus?.size ?? [0.1, 0.1, 0.34];
  // long axis along X so arrays sit on the sides; scale so the body reads well
  const L = Math.max(sx, sy, sz);
  const dims = new THREE.Vector3(sz, sx, sy).multiplyScalar(1 / L); // x = length, y, z
  const has = (id: string) => parts.some((c) => c.id === id);
  const slot = (s: string) => parts.filter((c) => c.slot === s);
  const mli = parts.some((c) => c.mli);
  const solar = slot('solar')[0];
  const cube = (bus?.busClass ?? 0) <= 2;
  const bodyMats: THREE.Material[] = [];
  for (let i = 0; i < 6; i++) bodyMats.push(cube ? (solar && (solar.mount === 'body' || solar.id === 'sol-cdep') ? M.cells : M.alu) : mli ? M.mli : M.white);
  const body = new THREE.Mesh(new THREE.BoxGeometry(dims.x, dims.y, dims.z), bodyMats);
  g.add(body);
  if (cube) {
    // the rails on each corner
    for (const y of [-1, 1]) for (const z of [-1, 1]) {
      const r = new THREE.Mesh(new THREE.BoxGeometry(dims.x * 1.04, 0.05, 0.05), M.alu);
      r.position.set(0, (y * dims.y) / 2, (z * dims.z) / 2); g.add(r);
    }
  }
  // radiators on the ±Z... no: on the anti-Sun ±X ends for small, ±Y faces for big buses
  if (radiatorM2 > 0) {
    const frac = Math.min(0.9, Math.sqrt(radiatorM2) / 6 + 0.25);
    for (const s of [-1, 1]) {
      const rp = new THREE.Mesh(new THREE.BoxGeometry(dims.x * frac, 0.01, dims.z * 0.8), M.rad);
      rp.position.set(0, s * (dims.y / 2 + 0.006), 0);
      g.add(rp);
    }
  }
  const hinges: { pivot: THREE.Object3D; axis: 'x' | 'y' | 'z'; from: number; to: number }[] = [];
  const drives: THREE.Object3D[] = [];
  // ---------- solar ----------
  if (solar && solar.mount !== 'body') {
    const wingSets: { side: number; w: number; len: number; panels: number; roll?: boolean }[] = [];
    if (solar.id === 'sol-cdep') { wingSets.push({ side: 1, w: dims.x * 0.95, len: dims.z * 1, panels: 1 }, { side: -1, w: dims.x * 0.95, len: dims.z * 1, panels: 1 }); }
    else if (solar.id === 'sol-wing') { wingSets.push({ side: 1, w: dims.x * 0.8, len: 1.6, panels: 2 }, { side: -1, w: dims.x * 0.8, len: 1.6, panels: 2 }); }
    else if (solar.id === 'sol-track') { wingSets.push({ side: 1, w: dims.x * 0.75, len: 2.6, panels: 3 }, { side: -1, w: dims.x * 0.75, len: 2.6, panels: 3 }); }
    else if (solar.id === 'sol-track-l') { wingSets.push({ side: 1, w: dims.x * 0.9, len: 5.5, panels: 6 }); }
    else if (solar.id === 'sol-roll') { wingSets.push({ side: 1, w: dims.x * 1.1, len: 6.5, panels: 1, roll: true }, { side: -1, w: dims.x * 1.1, len: 6.5, panels: 1, roll: true }); }
    for (const ws of wingSets) {
      const drive = new THREE.Group();
      drive.position.set(0, ws.side * dims.y / 2, 0);
      g.add(drive);
      if (solar.mount === 'track') drives.push(drive);
      // yoke
      const yoke = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.25, 6), M.alu);
      yoke.rotation.x = Math.PI / 2; yoke.position.y = ws.side * 0.12;
      if (!cube) drive.add(yoke);
      let parent: THREE.Object3D = drive;
      const pl = ws.len / ws.panels;
      for (let k = 0; k < ws.panels; k++) {
        const hinge = new THREE.Group();
        hinge.position.y = k === 0 ? ws.side * (cube ? 0 : 0.24) : ws.side * pl;
        parent.add(hinge);
        const panel = ws.roll
          ? new THREE.Mesh(new THREE.BoxGeometry(ws.w, pl, 0.004), M.blanket)
          : new THREE.Mesh(new THREE.BoxGeometry(ws.w, pl, 0.02), [M.back, M.back, M.back, M.back, M.cells, M.back]);
        panel.position.y = ws.side * pl / 2;
        hinge.add(panel);
        if (ws.roll) {
          for (const bx of [-1, 1]) { const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, pl, 6), M.alu); boom.position.set(bx * ws.w / 2, ws.side * pl / 2, 0); hinge.add(boom); }
        }
        // stowed: folded flat against the body (cubesat panels) or concertina'd
        hinges.push({ pivot: hinge, axis: 'x', from: cube ? ws.side * Math.PI / 2 : (k === 0 ? ws.side * Math.PI / 2 : (k % 2 ? -1 : 1) * Math.PI * 0.98 * ws.side), to: 0 });
        if (ws.roll) hinges.push({ pivot: panel, axis: 'y', from: 0.02, to: 1 });
        parent = hinge;
      }
    }
  }
  // ---------- antennas and payloads ----------
  const nadir = dims.z / 2;
  const zenith = -dims.z / 2;
  const addAt = (m: THREE.Object3D, x: number, y: number, z: number) => { m.position.set(x, y, z); g.add(m); return m; };
  if (has('com-uhf')) {
    for (let k = 0; k < 4; k++) {
      const hinge = new THREE.Group();
      hinge.position.set(dims.x / 2, (k < 2 ? -1 : 1) * dims.y * 0.3, (k % 2 ? -1 : 1) * dims.z * 0.3);
      const whip = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.6, 0.012), M.alu);
      whip.position.y = (k < 2 ? -1 : 1) * 0.3;
      hinge.add(whip); g.add(hinge);
      hinges.push({ pivot: hinge, axis: 'z', from: (k < 2 ? 1 : -1) * Math.PI / 2, to: (k < 2 ? -1 : 1) * 0.2 });
    }
  }
  if (has('com-s')) for (const s of [-1, 1]) addAt(new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.01), M.copper), s * dims.x * 0.25, 0, nadir + 0.006);
  if (has('com-x-cs')) addAt(new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.012), M.copper), dims.x * 0.3, dims.y * 0.2, nadir + 0.007);
  const dish = (r: number, x: number, y: number, z: number, faceZ: number) => {
    const d = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 8, 0, Math.PI * 2, 0, 0.55), M.white);
    d.rotation.x = faceZ > 0 ? Math.PI / 2 : -Math.PI / 2;
    addAt(d, x, y, z);
    const feed = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, r * 0.7, 6), M.dark);
    feed.rotation.x = Math.PI / 2; addAt(feed, x, y, z + faceZ * r * 0.3);
    return d;
  };
  if (has('com-x')) { const horn = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.25, 12, 1, true), M.nozzle); horn.rotation.x = -Math.PI / 2; addAt(horn, -dims.x * 0.3, -dims.y * 0.2, nadir + 0.15); }
  if (has('com-ka')) dish(0.18, -dims.x * 0.3, dims.y * 0.25, nadir + 0.05, 1);
  if (has('com-opt')) { const t = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.25, 16), M.dark); t.rotation.x = Math.PI / 2; addAt(t, dims.x * 0.35, 0, zenith - 0.12); }
  if (has('com-dsn')) dish(0.2, dims.x * 0.4, 0, nadir + 0.05, 1);
  for (const p of slot('payload')) {
    if (p.id === 'pl-cam' || p.id === 'pl-cam-cs' || p.id === 'pl-hires') {
      const r = p.id === 'pl-hires' ? 0.35 : p.id === 'pl-cam' ? 0.2 : 0.3;
      const tube = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.4, 24, 1, true), mli ? M.mli : M.dark);
      tube.rotation.x = Math.PI / 2; addAt(tube, dims.x * 0.1, 0, nadir + 0.2);
      const lens = new THREE.Mesh(new THREE.CircleGeometry(r * 0.92, 24), M.glass); addAt(lens, dims.x * 0.1, 0, nadir + 0.12);
    }
    if (p.id === 'pl-bb') { const a = new THREE.Mesh(new THREE.BoxGeometry(dims.x * 0.8, dims.y * 0.8, 0.04), M.dark); addAt(a, 0, 0, nadir + 0.03); for (let k = 0; k < 3; k++) { const pa = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 0.03), M.white); addAt(pa, (k - 1) * dims.x * 0.28, dims.y * 0.2, nadir + 0.06); } }
    if (p.id === 'pl-isl') for (const s of [-1, 1]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.12, 12), M.dark); l.rotation.z = Math.PI / 2; addAt(l, s * (dims.x / 2 + 0.06), 0, zenith * 0.4); }
    if (p.id === 'pl-geo') { for (const s of [-1, 1]) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.9, 32, 10, 0, Math.PI * 2, 0, 0.5), M.white); d.rotation.y = s * Math.PI / 2; d.rotation.z = 0.3; addAt(d, s * (dims.x / 2 + 0.55), 0, nadir * 0.2); } }
    if (p.id === 'pl-nav') { const a = new THREE.Group(); for (let k = 0; k < 12; k++) { const hx = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.25, 8), M.white); const an = (k / 12) * Math.PI * 2; hx.rotation.x = Math.PI / 2; hx.position.set(Math.cos(an) * 0.32, Math.sin(an) * 0.32, 0); a.add(hx); } a.position.set(0, 0, nadir + 0.13); g.add(a); }
    if (p.id === 'pl-tel' || p.id === 'pl-tel-s') {
      const r = p.id === 'pl-tel' ? 0.42 : 0.28;
      const tube = new THREE.Mesh(new THREE.CylinderGeometry(r, r, dims.x * 1.1, 32, 1, true), M.alu);
      tube.rotation.z = Math.PI / 2; addAt(tube, dims.x * 0.75, 0, 0);
      const door = new THREE.Group(); door.position.set(dims.x * 1.3, 0, -r);
      const lid = new THREE.Mesh(new THREE.CircleGeometry(r, 24), M.alu); lid.rotation.y = Math.PI / 2; lid.position.z = r; door.add(lid);
      g.add(door);
      hinges.push({ pivot: door, axis: 'y', from: 0, to: -1.6 });
    }
    if (p.id === 'pl-iot' || p.id === 'pl-sci-cs') addAt(new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 0.03), M.kapton), -dims.x * 0.3, 0, nadir + 0.016);
  }
  // star trackers: small boxes with baffle cones, looking away from the Earth
  for (const s of slot('sensor')) {
    if (s.id === 'sen-st' || s.id === 'sen-st-nano') {
      const n = s.id === 'sen-st' ? 2 : 1;
      for (let k = 0; k < n; k++) {
        const b = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.16, 12, 1, true), M.dark);
        b.rotation.x = Math.PI / 2 + (k ? 0.5 : -0.3);
        addAt(b, -dims.x * 0.25 + k * 0.2, (k ? 1 : -1) * dims.y * 0.2, zenith - 0.07);
      }
    }
    if (s.id === 'sen-earth') addAt(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.08, 10), M.dark), dims.x * 0.35, -dims.y * 0.3, nadir + 0.04);
    if (s.id === 'sen-gnss') addAt(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.02, 12), M.white), -dims.x * 0.35, dims.y * 0.3, zenith - 0.01).rotation.x = Math.PI / 2;
  }
  // engines on the aft face
  const prop = slot('propulsion')[0];
  const nozzle = (r: number, len: number, y: number, z: number) => { const n = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.35, r, len, 16, 1, true), M.nozzle); n.rotation.z = Math.PI / 2; addAt(n, -dims.x / 2 - len / 2, y, z); };
  if (prop?.prop === 'biprop') nozzle(0.18, 0.45, 0, 0);
  if (prop?.prop === 'mono' || prop?.prop === 'cold') for (const y of [-1, 1]) for (const z of [-1, 1]) nozzle(0.035, 0.08, y * dims.y * 0.35, z * dims.z * 0.35);
  if (prop?.prop === 'hall' || prop?.prop === 'ion') for (const y of [-1, 1]) { const d = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.1, 0.06, 20), M.dark); d.rotation.z = Math.PI / 2; addAt(d, -dims.x / 2 - 0.03, y * dims.y * 0.25, 0); }
  const glow = prop && prop.prop !== 'none' ? new THREE.Mesh(new THREE.ConeGeometry(prop.prop === 'hall' || prop.prop === 'ion' ? 0.08 : 0.12, 0.9, 12, 1, true), new THREE.MeshBasicMaterial({ color: prop.prop === 'hall' || prop.prop === 'ion' ? 0x7aa8ff : 0xffc27a, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })) : null;
  if (glow) { glow.rotation.z = Math.PI / 2; addAt(glow, -dims.x / 2 - 0.55, 0, 0); }

  const bbox = new THREE.Box3().setFromObject(g);
  const size = bbox.getSize(new THREE.Vector3()).length();
  const tmp = new THREE.Vector3();
  return {
    group: g,
    size,
    update(deploy, sunBody, t) {
      for (const h of hinges) {
        const k = THREE.MathUtils.smoothstep(deploy, 0, 1);
        if (h.axis === 'y' && h.from < 1 && h.to === 1) { h.pivot.scale.y = THREE.MathUtils.lerp(h.from, h.to, k); continue; }
        h.pivot.rotation[h.axis] = THREE.MathUtils.lerp(h.from, h.to, k);
      }
      // sun-tracking wings turn about their own axis (Y) to face the Sun
      tmp.copy(sunBody);
      const ang = Math.atan2(tmp.x, tmp.z);
      for (const d of drives) d.rotation.y = deploy > 0.99 ? ang : 0;
      if (glow) (glow.material as THREE.MeshBasicMaterial).opacity = (g.userData.firing ?? 0) * (0.5 + 0.2 * Math.sin(t * 40));
    },
  };
}
