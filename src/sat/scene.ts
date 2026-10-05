/**
 * The 3D view: the Earth (Natural Earth coastlines, day/night lighting and
 * an atmosphere rim), the Sun, stars, the orbit and ground track, ground
 * stations and their contact lines, the rocket on ascent, and your
 * satellite: close up on the bench, following it in orbit, or as a dot on
 * the whole orbit.
 *
 * Frames: one Earth radius = 1 unit. ECI (x, y, z) maps to three.js as
 * (x, z, −y), so north is up.
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { Comp } from './catalog';
import { buildSatellite, type SatModel } from './model';
import { loadEarth, type EarthMaps } from './earth';
import { RE, deg, eci, subPoint, type V3 } from './physics';
import { STATIONS } from './missions';

export type View = 'bench' | 'follow' | 'orbit';

const toThree = (p: V3, s = 1 / RE) => new THREE.Vector3(p[0] * s, p[2] * s, -p[1] * s);
const latLon = (lat: number, lon: number, r = 1) => {
  const la = lat * deg, lo = lon * deg;
  // Earth-fixed: Greenwich on +x, east towards −z (see toThree)
  return new THREE.Vector3(r * Math.cos(la) * Math.cos(lo), r * Math.sin(la), -r * Math.cos(la) * Math.sin(lo));
};

export class Scene3D {
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(40, 1, 0.001, 2000);
  controls: OrbitControls;
  view: View = 'bench';
  earth = new THREE.Group();
  earthMesh: THREE.Mesh;
  maps: EarthMaps | null = null;
  sun = new THREE.DirectionalLight(0xffffff, 2.6);
  sat = new THREE.Group();
  model: SatModel | null = null;
  orbitLine: THREE.Line;
  track: THREE.Line;
  stationDots = new THREE.Group();
  contactLines = new THREE.Group();
  rocket = new THREE.Group();
  trail: THREE.Line;
  siteDot: THREE.Mesh;
  private benchSpin = 0;
  private benchKey = new THREE.DirectionalLight(0xfff4e6, 2.2);
  private benchFill = new THREE.HemisphereLight(0x9fc4ff, 0x302820, 0.9);
  private lastView: View = 'bench';

  constructor(cv: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, preserveDrawingBuffer: false });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.controls = new OrbitControls(this.camera, cv);
    this.controls.enableDamping = true;
    this.controls.enablePan = false;
    this.scene.background = new THREE.Color(0x02040a);
    // stars
    const sg = new THREE.BufferGeometry();
    const sp: number[] = [], sc: number[] = [];
    for (let i = 0; i < 4000; i++) {
      const v = new THREE.Vector3().randomDirection().multiplyScalar(400);
      sp.push(v.x, v.y, v.z);
      const b = 0.5 + Math.random() * 0.5;
      sc.push(b, b, b * (0.9 + Math.random() * 0.2));
    }
    sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
    sg.setAttribute('color', new THREE.Float32BufferAttribute(sc, 3));
    this.scene.add(new THREE.Points(sg, new THREE.PointsMaterial({ size: 1.2, sizeAttenuation: false, vertexColors: true })));
    // light
    this.scene.add(this.sun, new THREE.AmbientLight(0x404a60, 0.35));
    // a studio key and fill for the bench view, carried with the camera
    this.benchKey.position.set(1.5, 2, 3);
    this.camera.add(this.benchKey, this.benchFill);
    this.scene.add(this.camera);
    // the Earth
    this.earthMesh = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 64), new THREE.MeshStandardMaterial({ color: 0x24507a, roughness: 0.85, metalness: 0 }));
    this.earth.add(this.earthMesh);
    const atmo = new THREE.Mesh(new THREE.SphereGeometry(1.025, 64, 48), new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.BackSide, blending: THREE.AdditiveBlending,
      uniforms: { uSun: { value: new THREE.Vector3(1, 0, 0) } },
      vertexShader: 'varying vec3 vN; varying vec3 vW; void main(){ vN = normalize(mat3(modelMatrix) * normal); vW = (modelMatrix * vec4(position,1.0)).xyz; gl_Position = projectionMatrix * viewMatrix * vec4(vW,1.0); }',
      fragmentShader: 'uniform vec3 uSun; varying vec3 vN; varying vec3 vW; void main(){ vec3 V = normalize(cameraPosition - vW); float rim = pow(1.0 - abs(dot(vN, V)), 3.0); float day = clamp(dot(-vN, uSun) * 0.7 + 0.45, 0.0, 1.0); gl_FragColor = vec4(vec3(0.35, 0.6, 1.0) * rim * day * 1.6, rim * day); }',
    }));
    atmo.name = 'atmo';
    this.scene.add(atmo);
    this.scene.add(this.earth);
    loadEarth().then((m) => {
      this.maps = m;
      const t = new THREE.CanvasTexture(m.day);
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 8;
      (this.earthMesh.material as THREE.MeshStandardMaterial).map = t;
      (this.earthMesh.material as THREE.MeshStandardMaterial).color.set(0xffffff);
      (this.earthMesh.material as THREE.MeshStandardMaterial).needsUpdate = true;
    });
    // ground stations
    for (const st of STATIONS) {
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 6), new THREE.MeshBasicMaterial({ color: 0x9fe2ff }));
      dot.position.copy(latLon(st.lat, st.lon, 1.002));
      dot.userData.id = st.id;
      this.stationDots.add(dot);
    }
    this.earth.add(this.stationDots);
    this.siteDot = new THREE.Mesh(new THREE.SphereGeometry(0.015, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffb35c }));
    this.earth.add(this.siteDot);
    this.scene.add(this.contactLines);
    // orbit and ground track
    this.orbitLine = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0x7fd4ff, transparent: true, opacity: 0.55 }));
    this.scene.add(this.orbitLine);
    this.track = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineDashedMaterial({ color: 0xffd27a, transparent: true, opacity: 0.8, dashSize: 0.02, gapSize: 0.012 }));
    this.earth.add(this.track);
    this.scene.add(this.sat);
    // the rocket
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 6, 16), new THREE.MeshStandardMaterial({ color: 0xf2f2f2, roughness: 0.5 }));
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.4, 16), new THREE.MeshStandardMaterial({ color: 0xf2f2f2, roughness: 0.5 }));
    nose.position.y = 3.7;
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.6, 4, 12, 1, true), new THREE.MeshBasicMaterial({ color: 0xffb35c, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false }));
    flame.rotation.x = Math.PI; flame.position.y = -5; flame.name = 'flame';
    this.rocket.add(body, nose, flame);
    this.rocket.scale.setScalar(0.008);
    this.rocket.visible = false;
    this.scene.add(this.rocket);
    this.trail = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xffd9a0, transparent: true, opacity: 0.9 }));
    this.earth.add(this.trail);
    this.setView('bench');
  }

  resize(w: number, h: number, dpr: number) {
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / Math.max(1, h);
    this.camera.updateProjectionMatrix();
  }

  setDesign(parts: Comp[], radiator: number) {
    if (this.model) this.sat.remove(this.model.group);
    this.model = buildSatellite(parts, radiator);
    this.sat.add(this.model.group);
    this.applyScale();
  }

  private applyScale() {
    if (!this.model) return;
    const s = this.view === 'bench' ? 2.4 / this.model.size : this.view === 'follow' ? 0.03 / this.model.size : 0.06 / this.model.size;
    this.model.group.scale.setScalar(s);
  }

  setView(v: View) {
    this.view = v;
    this.applyScale();
    const showWorld = v !== 'bench';
    this.benchKey.visible = !showWorld; this.benchFill.visible = !showWorld;
    this.earth.visible = showWorld;
    this.scene.getObjectByName('atmo')!.visible = showWorld;
    this.orbitLine.visible = showWorld; this.contactLines.visible = showWorld;
    if (v === 'bench') { this.controls.minDistance = 1.5; this.controls.maxDistance = 12; this.camera.position.set(2.6, 1.3, 3.0); this.controls.target.set(0, 0, 0); this.sat.position.set(0, 0, 0); }
    if (v === 'orbit') { this.controls.minDistance = 1.3; this.controls.maxDistance = 30; }
    if (v === 'follow') { this.controls.minDistance = 0.03; this.controls.maxDistance = 2; }
  }

  /** Draw the orbit and the coming ground track. */
  setOrbit(o: { alt: number; inc: number; raan: number; u: number; gmst: number; perigee?: number; apogee?: number }) {
    const pts: THREE.Vector3[] = [];
    const ell = o.perigee && o.apogee && o.apogee > o.perigee + 50;
    for (let k = 0; k <= 256; k++) {
      const u = (k / 256) * Math.PI * 2;
      let h = o.alt;
      if (ell) { const rp = RE + o.perigee!, ra = RE + o.apogee!, a = (rp + ra) / 2, e = (ra - rp) / (ra + rp); h = (a * (1 - e * e)) / (1 + e * Math.cos(u)) - RE; }
      pts.push(toThree(eci(h, o.inc * deg, o.raan, u)));
    }
    this.orbitLine.geometry.dispose();
    this.orbitLine.geometry = new THREE.BufferGeometry().setFromPoints(pts);
    // ground track for the next 1.5 orbits, in Earth-fixed coordinates
    const tr: THREE.Vector3[] = [];
    const r = RE + o.alt;
    const n = Math.sqrt(398600.4418 / r ** 3);
    const P = (2 * Math.PI) / n;
    let prevLon = 999;
    for (let k = 0; k <= 400; k++) {
      const dt = (k / 400) * P * 1.5;
      const p = eci(o.alt, o.inc * deg, o.raan, o.u + n * dt);
      const g = subPoint(p, o.gmst + (2 * Math.PI / 86164) * dt);
      if (Math.abs(g.lon - prevLon) > 180) tr.push(new THREE.Vector3(NaN, NaN, NaN));
      prevLon = g.lon;
      tr.push(latLon(g.lat, g.lon, 1.003));
    }
    this.track.geometry.dispose();
    this.track.geometry = new THREE.BufferGeometry().setFromPoints(tr.filter((v) => !isNaN(v.x)));
    this.track.computeLineDistances();
  }

  setSite(lat: number, lon: number) { this.siteDot.position.copy(latLon(lat, lon, 1.003)); }

  setStations(ids: string[]) {
    for (const d of this.stationDots.children) {
      const on = ids.includes(d.userData.id);
      ((d as THREE.Mesh).material as THREE.MeshBasicMaterial).color.set(on ? 0x9fe2ff : 0x3d5566);
      d.scale.setScalar(on ? 1 : 0.6);
    }
  }

  /** Per-frame state for operations. */
  update(o: {
    t: number; dt: number; gmst: number; sun: V3; pos: V3 | null; deploy: number; tumbling: boolean; firing: number;
    inView: string[]; launch?: { lat: number; lon: number; alt: number; trail: { lat: number; lon: number; alt: number }[]; flame: number } | null;
  }) {
    const sunV = toThree(o.sun, 1).normalize();
    this.sun.position.copy(sunV.clone().multiplyScalar(50));
    ((this.scene.getObjectByName('atmo') as THREE.Mesh).material as THREE.ShaderMaterial).uniforms.uSun.value.copy(sunV.clone().negate());
    this.earth.rotation.y = o.gmst;
    // satellite
    if (this.view === 'bench' || !o.pos) {
      this.sat.position.set(0, 0, 0);
      this.benchSpin += o.dt * 0.25;
      this.sat.quaternion.setFromEuler(new THREE.Euler(0.35, this.benchSpin, 0));
      this.model?.update(o.deploy, new THREE.Vector3(0, 0, 1).applyQuaternion(this.sat.quaternion.clone().invert()), o.t);
    } else {
      const p = toThree(o.pos);
      this.sat.position.copy(p);
      // nadir pointing: body +Z at the Earth, +X along the velocity
      const z = p.clone().negate().normalize();
      const x = new THREE.Vector3(0, 1, 0).cross(z).normalize();
      if (x.lengthSq() < 0.1) x.set(1, 0, 0);
      const y = z.clone().cross(x).normalize();
      const m = new THREE.Matrix4().makeBasis(x, y, z);
      this.sat.quaternion.setFromRotationMatrix(m);
      if (o.tumbling) this.sat.quaternion.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(o.t * 0.7, o.t * 0.45, o.t * 0.3)));
      const sunBody = sunV.clone().applyQuaternion(this.sat.quaternion.clone().invert());
      this.model?.update(o.deploy, sunBody, o.t);
      if (this.model) this.model.group.userData.firing = o.firing;
    }
    // contact lines from stations in view
    while (this.contactLines.children.length) { const c = this.contactLines.children.pop()! as THREE.Line; c.geometry.dispose(); }
    if (o.pos && this.view !== 'bench') {
      for (const id of o.inView) {
        const dot = this.stationDots.children.find((d) => d.userData.id === id);
        if (!dot) continue;
        const a = dot.getWorldPosition(new THREE.Vector3());
        const g = new THREE.BufferGeometry().setFromPoints([a, toThree(o.pos)]);
        this.contactLines.add(new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0x9fe2ff, transparent: true, opacity: 0.7 })));
      }
    }
    // the rocket
    if (o.launch) {
      this.rocket.visible = true;
      const L = o.launch;
      const pos = latLon(L.lat, L.lon, 1 + L.alt / RE).applyAxisAngle(new THREE.Vector3(0, 1, 0), o.gmst);
      const ahead = L.trail.length > 1 ? latLon(L.trail[L.trail.length - 1].lat, L.trail[L.trail.length - 1].lon, 1 + L.trail[L.trail.length - 1].alt / RE).applyAxisAngle(new THREE.Vector3(0, 1, 0), o.gmst) : pos.clone().multiplyScalar(1.01);
      this.rocket.position.copy(pos);
      const dir = pos.clone().sub(ahead);
      if (dir.lengthSq() < 1e-12) dir.copy(pos).normalize();
      this.rocket.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
      const fl = this.rocket.getObjectByName('flame') as THREE.Mesh;
      fl.visible = L.flame > 0;
      fl.scale.setScalar(0.8 + 0.3 * Math.sin(o.t * 30));
      this.trail.visible = true;
      const pts = L.trail.map((q) => latLon(q.lat, q.lon, 1 + q.alt / RE));
      this.trail.geometry.dispose();
      this.trail.geometry = new THREE.BufferGeometry().setFromPoints(pts);
    } else {
      this.rocket.visible = false;
      this.trail.visible = false;
    }
    // camera
    if (this.view === 'follow' && o.pos) {
      const p = this.sat.position;
      if (this.lastView !== 'follow') {
        // just above and behind the satellite, looking down past it at the Earth
        const up = p.clone().normalize();
        const side = new THREE.Vector3(0, 1, 0).cross(up).normalize();
        this.camera.position.copy(p).add(up.multiplyScalar(0.035)).add(side.multiplyScalar(0.05));
        this.controls.target.copy(p);
      }
      const delta = p.clone().sub(this.controls.target);
      this.controls.target.copy(p);
      this.camera.position.add(delta);
    } else if (this.view === 'orbit' && this.lastView !== 'orbit') {
      const r = o.pos ? toThree(o.pos).length() : 1.1;
      this.controls.target.set(0, 0, 0);
      const d = Math.max(3.2, r * 2.6);
      this.camera.position.set(d * 0.55, d * 0.45, d * 0.75);
    } else if (this.view === 'orbit' && o.launch) {
      const p = this.rocket.position;
      this.controls.target.lerp(p.clone().multiplyScalar(0.6), 0.05);
    }
    this.lastView = this.view;
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  /** Point the orbit camera at a spot (used to frame the launch site). */
  lookAtSite(lat: number, lon: number, gmst: number, dist = 2.6) {
    const p = latLon(lat, lon, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), gmst);
    this.controls.target.copy(p.clone().multiplyScalar(0.5));
    this.camera.position.copy(p.clone().multiplyScalar(dist)).add(new THREE.Vector3(0, 0.6, 0));
    this.lastView = 'orbit';
  }

  dispose() { this.controls.dispose(); this.renderer.dispose(); }
}
