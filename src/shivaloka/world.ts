import * as THREE from 'three';
import { LAND_RINGS, RANGES, RIVERS, toWorld } from './geo';
import { Ink } from './ink';
import { toon } from './ink';
import type { Input } from './input';
import type { Kind, Site } from './types';

/**
 * The map you walk across: the subcontinent as a paper relief on a wash of
 * sea, the ranges as inked peaks with snow on the high ones, the great rivers,
 * a scatter of forest — and every site as a marker: a linga with a pillar of
 * light for the Jyotirlingas, a linga for the other Shiva shrines, a red
 * pennant for the Shakti Peethas, a peacock feather for Krishna's places.
 *
 * You are a pilgrim with a staff; walk with the keys or the stick, or tap a
 * marker to walk there. At sea you are rowed across in a small boat.
 */

const LAND_Y = 0.22;
const PAPER = '#efe5cf';

function pointInRing(x: number, z: number, ring: [number, number][]) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, zi] = ring[i]!;
    const [xj, zj] = ring[j]!;
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}

function featherTexture() {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 128;
  const g = c.getContext('2d')!;
  g.strokeStyle = '#6a5a2a'; g.lineWidth = 3; g.beginPath(); g.moveTo(32, 128); g.lineTo(32, 20); g.stroke();
  g.strokeStyle = '#2f8a4a'; g.lineWidth = 2;
  for (let y = 30; y < 120; y += 4) { const w = 26 * Math.sin(((y - 20) / 100) * Math.PI); g.beginPath(); g.moveTo(32, y); g.lineTo(32 - w, y - 6); g.moveTo(32, y); g.lineTo(32 + w, y - 6); g.stroke(); }
  for (const [c2, r] of [['#6a4a1a', 16], ['#1f9a5a', 13], ['#c8b24a', 10], ['#1a6fb0', 7], ['#123a8a', 4]] as [string, number][]) { g.fillStyle = c2; g.beginPath(); g.ellipse(32, 34, r * 0.8, r, 0, 0, 6.28); g.fill(); }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export class World {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(38, 1, 0.1, 300);
  pilgrim = new THREE.Group();
  private boat: THREE.Object3D;
  private walkPhase = 0;
  private markers = new Map<string, THREE.Group>();
  private pickables: THREE.Object3D[] = [];
  private landRings: [number, number][][];
  private target: THREE.Vector3 | null = null;
  private targetSite: Site | null = null;
  private ray = new THREE.Raycaster();
  zoomH = 11;
  near: Site | null = null;
  private filter = new Set<Kind>(['jyotirlinga', 'linga', 'shakti', 'krishna']);
  private pillars: THREE.Mesh[] = [];
  private w = 1;
  private h = 1;
  private facing = 0;

  constructor(private ink: Ink, private input: Input, private sites: Site[], done: Set<string>, start?: [number, number]) {
    const s = this.scene;
    s.background = new THREE.Color(PAPER);
    s.add(new THREE.HemisphereLight('#fff6e6', '#9a8a70', 1.6));
    const sun = new THREE.DirectionalLight('#fff1d8', 1.6);
    sun.position.set(-8, 14, 6);
    s.add(sun);
    // the sea: a wash
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), toon('#b9cdcf'));
    sea.rotation.x = -Math.PI / 2;
    sea.position.set(0, 0, 0);
    s.add(sea);
    // the land
    this.landRings = LAND_RINGS.map((r) => r.map(([lon, lat]) => toWorld(lon, lat)));
    const landMat = toon('#e2d3ae');
    for (const ring of this.landRings) {
      const shape = new THREE.Shape(ring.map(([x, z]) => new THREE.Vector2(x, -z)));
      const g = new THREE.ExtrudeGeometry(shape, { depth: LAND_Y, bevelEnabled: false });
      g.rotateX(-Math.PI / 2);
      s.add(new THREE.Mesh(g, landMat));
    }
    // the land goes on past the edge of the map: north, and west and east of it
    const [xw, zn] = toWorld(60, 38);
    const [xe] = toWorld(100, 38);
    const [, zw] = toWorld(60, 25.4);
    const [, ze] = toWorld(100, 16.5);
    const beyond = (x0: number, x1: number, z0: number, z1: number) => {
      const b = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, LAND_Y, z1 - z0), landMat);
      b.position.set((x0 + x1) / 2, LAND_Y / 2, (z0 + z1) / 2);
      s.add(b);
    };
    beyond(-90, 90, zn - 60, zn + 0.02);
    beyond(-90, xw + 0.02, zn, zw);
    beyond(xe - 0.02, 90, zn, ze);
    this.addRelief(sites);
    this.addRivers();
    this.addMarkers(sites, done);
    // the pilgrim
    const saffron = toon('#e08a2e');
    const body = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.34, 10), saffron);
    body.position.y = 0.17;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 10), toon('#8a5a3a'));
    head.position.y = 0.39;
    const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.5, 5), toon('#5a3a1a'));
    staff.position.set(0.1, 0.25, 0.02);
    const pack = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), toon('#b8541e'));
    pack.position.set(0, 0.24, 0.08);
    this.pilgrim.add(body, head, staff, pack);
    this.boat = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.06, 0.14), toon('#6a4a2a'));
    this.boat.position.y = 0.02;
    this.boat.visible = false;
    this.pilgrim.add(this.boat);
    const [sx, sz] = start ?? toWorld(83.0, 25.3);
    this.pilgrim.position.set(sx, LAND_Y, sz);
    s.add(this.pilgrim);
  }

  private onLand(x: number, z: number) {
    for (const r of this.landRings) if (pointInRing(x, z, r)) return true;
    return false;
  }

  private addRelief(sites: Site[]) {
    const R = (() => { let s = 7; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
    const siteXZ = sites.map((s) => toWorld(s.lon, s.lat));
    const clear = (x: number, z: number, d: number) => siteXZ.every(([sx, sz]) => Math.hypot(sx - x, sz - z) > d);
    const peaks: [number, number, number, boolean][] = [];
    for (const r of RANGES) {
      const pts = r.pts.map(([lon, lat]) => toWorld(lon, lat));
      for (let i = 0; i < pts.length - 1; i++) {
        const [ax, az] = pts[i]!;
        const [bx, bz] = pts[i + 1]!;
        const n = Math.ceil(Math.hypot(bx - ax, bz - az) / 0.22);
        for (let k = 0; k < n; k++) {
          const t = k / n;
          for (let m = 0; m < 3; m++) {
            const x = ax + (bx - ax) * t + (R() - 0.5) * r.spread;
            const z = az + (bz - az) * t + (R() - 0.5) * r.spread;
            if (!clear(x, z, 0.32)) continue;
            peaks.push([x, z, r.h * (0.45 + R() * 0.6), r.snow]);
          }
        }
      }
    }
    const cone = new THREE.ConeGeometry(0.34, 1, 5);
    cone.translate(0, 0.5, 0);
    const mm = new THREE.InstancedMesh(cone, toon('#c8b48c'), peaks.length);
    const snowCone = new THREE.ConeGeometry(0.34, 1, 5);
    snowCone.translate(0, 0.5, 0);
    const snowy = peaks.filter((p) => p[3] && p[2] > 0.9);
    const sm = new THREE.InstancedMesh(snowCone, toon('#f7f4ee'), snowy.length);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    peaks.forEach(([x, z, hh], i) => {
      q.setFromEuler(new THREE.Euler(0, R() * 6, 0));
      m.compose(new THREE.Vector3(x, LAND_Y, z), q, new THREE.Vector3(1 + hh * 0.5, hh, 1 + hh * 0.5));
      mm.setMatrixAt(i, m);
    });
    snowy.forEach(([x, z, hh], i) => {
      const k = 0.42;
      q.setFromEuler(new THREE.Euler(0, R() * 6, 0));
      m.compose(new THREE.Vector3(x, LAND_Y + hh * (1 - k) + 0.01, z), q, new THREE.Vector3((1 + hh * 0.5) * k * 1.03, hh * k, (1 + hh * 0.5) * k * 1.03));
      sm.setMatrixAt(i, m);
    });
    this.scene.add(mm, sm);
    // forest: a scatter of small trees over the land, thickest in the south and east
    const trees: [number, number, number][] = [];
    for (let i = 0; i < 2200 && trees.length < 700; i++) {
      const lon = 68 + R() * 29;
      const lat = 7 + R() * 25;
      const [x, z] = toWorld(lon, lat);
      const wet = (lat < 22 ? 0.8 : 0.3) + (lon > 84 ? 0.4 : 0) - (lon < 75 && lat > 22 ? 0.6 : 0);
      if (R() > wet || !this.onLand(x, z) || !clear(x, z, 0.25)) continue;
      if (peaks.some(([px, pz]) => Math.abs(px - x) < 0.25 && Math.abs(pz - z) < 0.25)) continue;
      trees.push([x, z, 0.12 + R() * 0.1]);
    }
    const tg = new THREE.ConeGeometry(0.07, 1, 6);
    tg.translate(0, 0.5, 0);
    const tm = new THREE.InstancedMesh(tg, toon('#7d9a6a'), trees.length);
    trees.forEach(([x, z, hh], i) => { m.compose(new THREE.Vector3(x, LAND_Y, z), new THREE.Quaternion(), new THREE.Vector3(1, hh, 1)); tm.setMatrixAt(i, m); });
    this.scene.add(tm);
  }

  private addRivers() {
    const mat = toon('#5d8fa3');
    for (const r of RIVERS) {
      const pts = r.pts.map(([lon, lat]) => { const [x, z] = toWorld(lon, lat); return new THREE.Vector3(x, LAND_Y + 0.005, z); });
      const curve = new THREE.CatmullRomCurve3(pts);
      const g = new THREE.TubeGeometry(curve, pts.length * 12, 0.045, 5, false);
      g.scale(1, 0.25, 1);
      g.translate(0, LAND_Y * 0.75 + 0.01, 0);
      this.scene.add(new THREE.Mesh(g, mat));
    }
  }

  private addMarkers(sites: Site[], done: Set<string>) {
    const stone = toon('#3a3634');
    const stoneLight = toon('#77716a');
    const base = toon('#57524c');
    const red = toon('#c8332a');
    const gold = toon('#e6b54a', '#e6b54a', 0.5);
    const feather = new THREE.SpriteMaterial({ map: featherTexture(), alphaTest: 0.4 });
    const pillarMat = new THREE.MeshBasicMaterial({ color: '#ffd889', transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending });
    for (const site of sites) {
      const g = new THREE.Group();
      const [x, z] = toWorld(site.lon, site.lat);
      g.position.set(x, LAND_Y, z);
      if (site.kind === 'jyotirlinga' || site.kind === 'linga') {
        const big = site.kind === 'jyotirlinga';
        const yoni = new THREE.Mesh(new THREE.CylinderGeometry(big ? 0.14 : 0.1, big ? 0.15 : 0.11, 0.05, 16), base);
        yoni.position.y = 0.025;
        const spout = new THREE.Mesh(new THREE.BoxGeometry(big ? 0.12 : 0.09, 0.03, 0.05), base);
        spout.position.set(big ? 0.16 : 0.12, 0.035, 0);
        const shaft = new THREE.Mesh(new THREE.CylinderGeometry(big ? 0.055 : 0.04, big ? 0.06 : 0.045, big ? 0.14 : 0.1, 16), big ? stone : stoneLight);
        shaft.position.y = big ? 0.12 : 0.1;
        const top = new THREE.Mesh(new THREE.SphereGeometry(big ? 0.055 : 0.04, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), big ? stone : stoneLight);
        top.position.y = big ? 0.19 : 0.15;
        g.add(yoni, spout, shaft, top);
        if (big) {
          const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 1.6, 12, 1, true), pillarMat);
          pillar.position.y = 1.0;
          g.add(pillar);
          this.pillars.push(pillar);
        }
      } else if (site.kind === 'shakti') {
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.34, 5), toon('#5a3a1a'));
        pole.position.y = 0.17;
        const fg = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0.34, 0), new THREE.Vector3(0.18, 0.29, 0), new THREE.Vector3(0, 0.23, 0)]);
        fg.computeVertexNormals();
        const flag = new THREE.Mesh(fg, red);
        (flag.material as THREE.Material).side = THREE.DoubleSide;
        const shrine = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.12, 4), red);
        shrine.position.set(-0.06, 0.06, 0);
        g.add(pole, flag, shrine);
      } else {
        const sp = new THREE.Sprite(feather);
        sp.scale.set(0.16, 0.32, 1);
        sp.position.y = 0.2;
        g.add(sp);
      }
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.018, 6, 28), gold);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.012;
      ring.visible = done.has(site.id);
      ring.name = 'done';
      g.add(ring);
      // an invisible target, larger than the marker, for fingers
      const hit = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.5, 8), new THREE.MeshBasicMaterial({ visible: false }));
      hit.position.y = 0.25;
      hit.userData.site = site;
      g.add(hit);
      this.pickables.push(hit);
      g.userData.site = site;
      this.markers.set(site.id, g);
      this.scene.add(g);
    }
  }

  setDone(done: Set<string>) {
    for (const [id, g] of this.markers) { const r = g.getObjectByName('done'); if (r) r.visible = done.has(id); }
  }

  setFilter(kinds: Set<Kind>) {
    this.filter = kinds;
    for (const g of this.markers.values()) g.visible = kinds.has((g.userData.site as Site).kind);
  }

  resize(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  zoom(f: number) { this.zoomH = Math.max(3.5, Math.min(34, this.zoomH * f)); }

  walkTo(site: Site) {
    const [x, z] = toWorld(site.lon, site.lat);
    this.target = new THREE.Vector3(x, LAND_Y, z);
    this.targetSite = site;
  }

  /** Jump straight to a site (from the diary). */
  jumpTo(site: Site) {
    const [x, z] = toWorld(site.lon, site.lat);
    this.pilgrim.position.set(x + 0.18, LAND_Y, z + 0.18);
    this.target = null;
  }

  private pick(cx: number, cy: number) {
    const ndc = new THREE.Vector2((cx / this.w) * 2 - 1, -(cy / this.h) * 2 + 1);
    this.ray.setFromCamera(ndc, this.camera);
    const hits = this.ray.intersectObjects(this.pickables.filter((p) => p.parent!.visible), false);
    return hits.length ? (hits[0]!.object.userData.site as Site) : null;
  }
  hoverAt(cx: number, cy: number) { return this.pick(cx, cy); }
  clickAt(cx: number, cy: number) {
    const s = this.pick(cx, cy);
    if (s) { this.walkTo(s); return s; }
    // else walk to the spot on the map
    const ndc = new THREE.Vector2((cx / this.w) * 2 - 1, -(cy / this.h) * 2 + 1);
    this.ray.setFromCamera(ndc, this.camera);
    const p = new THREE.Vector3();
    if (this.ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), -LAND_Y), p)) { this.target = p; this.targetSite = null; }
    return null;
  }

  screenOf(site: Site) {
    const [x, z] = toWorld(site.lon, site.lat);
    const v = new THREE.Vector3(x, LAND_Y + 0.45, z).project(this.camera);
    return { x: ((v.x + 1) / 2) * this.w, y: ((1 - v.y) / 2) * this.h, visible: v.z < 1 && Math.abs(v.x) < 1.1 && Math.abs(v.y) < 1.1 };
  }

  update(dt: number, t: number) {
    const mv = this.input.move;
    const p = this.pilgrim.position;
    let vx = mv.x;
    let vz = -mv.y;
    if (Math.hypot(vx, vz) > 0.05) this.target = null;
    else if (this.target) {
      const dx = this.target.x - p.x;
      const dz = this.target.z - p.z;
      const d = Math.hypot(dx, dz);
      if (d < 0.08) { this.target = null; vx = vz = 0; }
      else { vx = dx / d; vz = dz / d; }
    }
    const moving = Math.hypot(vx, vz) > 0.05;
    const speed = 2.6 * (this.zoomH > 16 ? 2 : 1);
    if (moving) {
      p.x += vx * speed * dt;
      p.z += vz * speed * dt;
      p.x = Math.max(-18, Math.min(18, p.x));
      p.z = Math.max(-17, Math.min(19, p.z));
      this.facing = Math.atan2(vx, vz);
      this.walkPhase += dt * 12;
    }
    const land = this.onLand(p.x, p.z);
    this.boat.visible = !land;
    p.y = land ? LAND_Y : 0.02;
    this.pilgrim.rotation.y += (this.facing - this.pilgrim.rotation.y) * Math.min(1, dt * 10);
    this.pilgrim.children[0]!.position.y = 0.17 + (moving ? Math.abs(Math.sin(this.walkPhase)) * 0.03 : 0);
    // the nearest site
    let best: Site | null = null;
    let bd = 0.42;
    for (const s of this.sites) {
      if (!this.filter.has(s.kind)) continue;
      const [x, z] = toWorld(s.lon, s.lat);
      const d = Math.hypot(x - p.x, z - p.z);
      if (d < bd) { bd = d; best = s; }
    }
    if (this.targetSite && best === this.targetSite && !this.target) this.targetSite = null;
    this.near = best;
    // markers grow as you zoom out, so they can still be seen
    const k = Math.max(0.9, Math.min(3, this.zoomH / 9));
    for (const g of this.markers.values()) g.scale.setScalar(k);
    for (const pl of this.pillars) (pl.material as THREE.MeshBasicMaterial).opacity = 0.4 + 0.2 * Math.sin(t * 2 + pl.id);
    // camera
    const ch = this.zoomH;
    const want = new THREE.Vector3(p.x, ch, p.z + ch * 0.62);
    this.camera.position.lerp(want, Math.min(1, dt * 4));
    this.camera.lookAt(p.x, 0, p.z - ch * 0.05);
    this.ink.look({ paper: PAPER, ink: '#2a2320', fogNear: ch * 1.4, fogFar: ch * 4.5, line: 0.9, frame: 0.025 });
    return this.near;
  }

  render(t: number) { this.ink.render(this.scene, this.camera, t); }

  dispose() {
    this.scene.traverse((o) => { const m = o as THREE.Mesh; if (m.geometry) m.geometry.dispose(); });
  }
}
