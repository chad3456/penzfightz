import * as THREE from 'three';
import { RC, hoodAt, fromLatLon, type City } from './data';
import { TILE, buildTerrain, buildTile, buildWater, glowPoints, indexTiles, makeMaterials, tileKey, type Exclusion, type TileIndex } from './city';
import { buildLandmarks } from './landmarks';
import { U, simpleMaterial } from './shaders';
import { Crowd, Pose, randomLook, type Look } from './people';
import { Traffic, Car, type Mats, type Ped } from './traffic';
import { Police } from './police';
import { Sound, STATIONS, type StationId } from './audio';
import { MapView, type Blip } from './map';
import { route, progress, type Route } from './routing';
import { MISSIONS, Missions, type Mission, type Pt, type WorldAPI } from './missions';
import { SPECS, type VType } from './vehicles';

/**
 * Pune 411 — the running game: the city streamed in tiles around you, you
 * on foot or on anything with wheels, traffic, people, the police, missions
 * and side jobs, the clock, the weather, the sound and the camera.
 */

export interface Hud {
  money: number; health: number; stars: number; searching: boolean; speed: number; vehicle: string; vehicleMr: string;
  area: string; road: string; clock: string; objective: string; timer: number | null;
  subtitle: { who: string; text: string; mr?: string } | null; prompt: string; toast: string; radio: string; radioSub: string;
  mission: string; onFoot: boolean; patya: number; helmet: boolean; busted: string; mapOpen: boolean; night: boolean; rain: boolean;
  missionCard: { title: string; ok: boolean; text: string } | null; fps: number;
}

export interface Save { money: number; done: string[]; patya: number[]; helmet: boolean; x?: number; z?: number; hour?: number }

const PATYA: [string, string][] = [
  ['दुपारी १ ते ४ दुकान बंद राहील.', 'The shop will stay closed from 1 to 4 in the afternoon.'],
  ['येथे गाडी लावू नये. लावल्यास हवा सोडण्यात येईल.', 'Do not park here. If you do, the air will be let out of your tyres.'],
  ['आमची कोठेही शाखा नाही.', 'We have no branch anywhere.'],
  ['पत्ता विचारू नये. आम्हालाही माहीत नाही.', 'Do not ask us for addresses. We don\'t know either.'],
  ['उधारी बंद. उधारी मागून अपमान करून घेऊ नये.', 'No credit. Do not get yourself insulted by asking for it.'],
  ['बेल एकदाच वाजवा. आम्ही बहिरे नाही.', 'Ring the bell once. We are not deaf.'],
  ['कृपया शांतता राखा. येथे लोक विचार करतात.', 'Please keep quiet. People think here.'],
  ['चप्पल बाहेर काढा. चोरीला गेल्यास आम्ही जबाबदार नाही.', 'Leave your chappals outside. We are not responsible if they are stolen.'],
  ['सुट्टे पैसे आणा. येथे बँक नाही.', 'Bring change. This is not a bank.'],
  ['पार्किंग फक्त मालकासाठी. बाकीच्यांनी स्वप्नात लावावी.', 'Parking for the owner only. Everyone else may park in their dreams.'],
  ['पाणी स्वतः घ्यावे.', 'Get your water yourself.'],
  ['येथे थुंकल्यास ५०० रु. दंड. थुंकण्याचा विचार केल्यास २५० रु.', '₹500 fine for spitting here. ₹250 for thinking about it.'],
  ['मोबाईलवर बोलत दुकानात येऊ नये.', 'Do not walk into the shop talking on your phone.'],
  ['घासाघीस करू नये. भाव ठरलेले आहेत.', 'No haggling. The prices are fixed.'],
  ['कुत्र्यापासून सावधान. कुत्रा नसला तरी.', 'Beware of the dog. Even if there is no dog.'],
  ['हॉर्न वाजवू नये. आम्ही झोपलो आहोत.', 'Do not honk. We are sleeping.'],
  ['सल्ला मोफत मिळणार नाही.', 'Advice is not free here.'],
  ['रविवारी दुकान बंद. सोमवारी मूड पाहून.', 'Closed on Sunday. Monday depends on the mood.'],
  ['फक्त कामाचे बोला.', 'Talk about work only.'],
  ['येथे बसून गप्पा मारू नये. हे बाकडे आमचे आहे.', 'Do not sit here and chat. This bench is ours.'],
];
const PATYA_HOODS = ['Shaniwar Peth', 'Sadashiv Peth', 'Narayan Peth', 'Kasba Peth', 'Shukrawar Peth', 'Budhwar Peth', 'Raviwar Peth', 'Guruwar Peth', 'Somwar Peth', 'Mangalwar Peth', 'Deccan Gymkhana', 'Erandwane', 'Shivajinagar', 'Model Colony', 'Camp', 'Koregaon Park', 'Navi Peth', 'Ganesh Peth', 'Rasta Peth', 'Prabhat Road'];
const FOOD: [string, number, number][] = [
  ['FC Road', 18.5240, 73.8412], ['JM Road', 18.5196, 73.8478], ['Swargate', 18.5008, 73.8592], ['Pune Station', 18.5280, 73.8745],
  ['Camp', 18.5155, 73.8786], ['Deccan', 18.5160, 73.8425], ['Kasba Peth', 18.5215, 73.8590], ['Koregaon Park', 18.5370, 73.8920],
  ['Sadashiv Peth', 18.5102, 73.8490], ['Yerawada', 18.5530, 73.8880],
];
const GARAGES: [string, number, number][] = [['Shukrawar Peth', 18.5090, 73.8560], ['Yerawada', 18.5545, 73.8862], ['Erandwane', 18.5080, 73.8320]];
const MAMA: [string, number, number][] = [
  ['Swargate chowk', 18.5013, 73.8634], ['Deccan corner', 18.5168, 73.8432], ['Shivajinagar', 18.5299, 73.8477],
  ['Balgandharva chowk', 18.5216, 73.8481], ['Camp', 18.5165, 73.8781], ['Sancheti chowk', 18.5306, 73.8526], ['Bund Garden', 18.5390, 73.8807],
];

const keyMap: Record<string, string> = { KeyW: 'up', ArrowUp: 'up', KeyS: 'down', ArrowDown: 'down', KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right', Space: 'space', ShiftLeft: 'shift', ShiftRight: 'shift' };

export class PuneWorld implements WorldAPI {
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  camera: THREE.PerspectiveCamera;
  mats: Mats;
  idx: TileIndex;
  tiles = new Map<number, THREE.Group>();
  excl: Exclusion[] = [];
  crowd: Crowd; traffic: Traffic; police: Police; sound = new Sound(); map: MapView; missions: Missions;
  sky: THREE.Mesh;
  vehLights: THREE.Points;
  markerObjs = new Map<string, THREE.Mesh>();
  markerGeo = new THREE.CylinderGeometry(1, 1, 1, 24, 1, true);
  markerMat: THREE.ShaderMaterial;
  props: THREE.Group = new THREE.Group();

  // player
  p = { x: 0, z: 0, y: 0, yaw: 0, vx: 0, vz: 0, vy: 0, health: 100, money: 200, phase: 0, car: null as Car | null, fall: 0, stamina: 1, swim: false };
  look: Look;
  helmet = false;
  keys = new Set<string>();
  touch = { x: 0, y: 0, gas: 0, brake: 0, active: false };
  camYaw = 0; camPitch = 0.28; camDist = 1; camUser = 0; camMode = 0;
  camPos = new THREE.Vector3(); camLook = new THREE.Vector3();
  hour = 17.3; daySpeed = 1 / 60;
  rain = false; rainAmt = 0; rainObj: THREE.LineSegments | null = null;
  t = 0;
  quality: 'high' | 'low';
  viewDist: number;
  routeObj: Route | null = null; routeTarget: Pt | null = null; routeT = 0; routeIdx = 0;
  waypoint: Pt | null = null;
  objectiveText = ''; timerVal: number | null = null;
  subs: { who: string; text: string; mr?: string; t: number }[] = [];
  toastText = ''; toastT = 0;
  busted = ''; bustedT = 0;
  card: Hud['missionCard'] = null; cardT = 0;
  passengerLook: Look | null = null;
  target: Car | null = null;
  patyaGot = new Set<number>();
  patyaPts: { x: number; z: number; y: number; i: number; obj: THREE.Object3D }[] = [];
  foodPts: Pt[] = []; garagePts: Pt[] = []; mamaPts: (Pt & { look: Look; t: number; yaw: number })[] = []; shopPt: Pt = { x: 0, z: 0 };
  foodCool = 0; mamaCool = 0;
  missionStarts: { m: Mission; at: Pt }[] = [];
  station: StationId = 'off';
  hudCb: (h: Hud) => void = () => {};
  miniCanvas: HTMLCanvasElement | null = null;
  bigCanvas: HTMLCanvasElement | null = null;
  mapOpen = false; mapCx = 0; mapCz = 0; mapScale = 6;
  paused = false;
  fpsAcc = 0; fpsN = 0; fps = 60;
  private hudT = 0; private miniT = 0;
  private amb = 0;
  disposed = false;

  constructor(public canvas: HTMLCanvasElement, public city: City, quality: 'high' | 'low', save: Save | null) {
    this.quality = quality;
    this.viewDist = quality === 'high' ? 1300 : 750;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: quality === 'high', powerPreference: 'high-performance' });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.camera = new THREE.PerspectiveCamera(62, 1, 0.3, 6000);
    const base = makeMaterials(city.ground);
    const brakeOn = simpleMaterial({ emit: 1.6 }), brakeOff = simpleMaterial({ emit: 0.15 });
    this.mats = { ...base, brakeOn, brakeOff };
    this.idx = indexTiles(city);

    // the ground, the rivers, the sky
    this.scene.add(buildTerrain(city, this.mats));
    this.scene.add(buildWater(city, this.mats));
    this.sky = this.makeSky();
    this.scene.add(this.sky);
    const lm = buildLandmarks(city, this.mats);
    this.scene.add(lm.group);
    this.excl = lm.excl;
    if (lm.lights.length) this.scene.add(glowPoints(lm.lights.flatMap((v) => [v.x, v.y, v.z]), [1, 0.7, 0.4], 14, this.mats));

    this.crowd = new Crowd(quality === 'high' ? 260 : 140);
    this.scene.add(this.crowd.meshes.man, this.crowd.meshes.woman);
    this.traffic = new Traffic(city, this.scene, this.mats, this.crowd, quality);
    this.traffic.onHonk = (x, z, k) => { const d = Math.hypot(x - this.p.x, z - this.p.z); this.sound.horn(k, d, Math.max(-1, Math.min(1, ((x - this.p.x) * Math.cos(this.camYaw) - (z - this.p.z) * Math.sin(this.camYaw)) / 60)) * -1); };
    this.traffic.onShout = (ped, why) => this.shout(ped, why);
    this.police = new Police(city, this.traffic);
    this.map = new MapView(city);
    this.missions = new Missions(this);
    this.missions.onEnd = (m, ok, text) => { this.card = { title: m.title, ok, text }; this.cardT = 5; this.saveGame(); };

    // vehicle head/tail lights
    const vl = new THREE.BufferGeometry();
    const N = 600;
    vl.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
    vl.setAttribute('aCol', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
    vl.setAttribute('aSize', new THREE.BufferAttribute(new Float32Array(N), 1));
    this.vehLights = new THREE.Points(vl, this.mats.glow);
    this.vehLights.frustumCulled = false;
    this.scene.add(this.vehLights);

    this.markerMat = new THREE.ShaderMaterial({
      uniforms: { uCol: { value: new THREE.Color('#ffd23f') }, uTime: U.uTime },
      transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `uniform vec3 uCol; uniform float uTime; varying vec2 vUv; void main(){ float a = pow(1.0 - vUv.y, 1.6) * (0.55 + 0.25 * sin(uTime * 4.0 + vUv.y * 10.0)); gl_FragColor = vec4(uCol * a, 1.0); }`,
    });

    this.look = { kind: 'man', c0: new THREE.Color().setRGB(0.18, 0.36, 0.62, THREE.LinearSRGBColorSpace), c1: new THREE.Color().setRGB(0.13, 0.17, 0.28, THREE.LinearSRGBColorSpace), c2: new THREE.Color().setRGB(0.6, 0.4, 0.26, THREE.LinearSRGBColorSpace) };
    this.scene.add(this.props);
    this.placeSideJobs();
    this.missionStarts = MISSIONS.map((m) => ({ m, at: this.spot(m.at[0], m.at[1], false) }));

    // start: outside Pune station, evening, unless there is a save
    const st = this.spot(18.5287, 73.8738, true);
    this.p.x = save?.x ?? st.x; this.p.z = save?.z ?? st.z;
    this.p.y = city.terrain.height(this.p.x, this.p.z);
    if (save) {
      this.p.money = save.money; this.helmet = save.helmet;
      for (const id of save.done) this.missions.done.add(id);
      for (const i of save.patya) this.patyaGot.add(i);
      if (save.hour !== undefined) this.hour = save.hour;
      this.patyaPts = this.patyaPts.filter((q) => { if (this.patyaGot.has(q.i)) { this.props.remove(q.obj); return false; } return true; });
    }
    this.camYaw = this.p.yaw;
    this.camPos.set(this.p.x, this.p.y + 3, this.p.z - 6);
    this.mapCx = this.p.x; this.mapCz = this.p.z;
  }

  // ---------------------------------------------------------------- setup helpers
  spot(lat: number, lon: number, road = true): Pt {
    const p = fromLatLon(this.city.meta, lat, lon);
    if (!road) return p;
    const h = this.city.roads.nearest(p.x, p.z, 80, (q) => q.cls <= RC.unknown && !q.elevated);
    return h ? { x: h.x, z: h.z } : p;
  }

  private makeSky() {
    const m = new THREE.ShaderMaterial({
      uniforms: U, side: THREE.BackSide, depthWrite: false,
      vertexShader: `varying vec3 vD; void main(){ vD = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uSunDir; uniform vec3 uSunCol; uniform vec3 uSky; uniform vec3 uFog; uniform float uNight; uniform float uRain;
        varying vec3 vD;
        float h(vec3 p){ return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453); }
        void main(){
          vec3 d = normalize(vD);
          float up = clamp(d.y, 0.0, 1.0);
          vec3 col = mix(uFog, uSky, pow(up, 0.55));
          float s = max(dot(d, uSunDir), 0.0);
          col += uSunCol * (pow(s, 600.0) * 3.0 + pow(s, 12.0) * 0.25) * (1.0 - uNight) * (1.0 - uRain * 0.8);
          // stars, and the moon behind the haze
          vec3 q = floor(d * 380.0);
          float st = step(0.9975, h(q)) * uNight * smoothstep(0.05, 0.4, d.y) * (1.0 - uRain);
          col += vec3(st);
          float m = max(dot(d, normalize(vec3(-0.4, 0.5, -0.6))), 0.0);
          col += vec3(0.9, 0.9, 0.8) * pow(m, 900.0) * 2.0 * uNight;
          col = mix(col, vec3(0.42, 0.44, 0.47) * (1.0 - 0.75 * uNight), uRain * 0.7);
          gl_FragColor = vec4(col, 1.0);
          #include <colorspace_fragment>
        }`,
    });
    const s = new THREE.Mesh(new THREE.SphereGeometry(5000, 32, 16), m);
    s.frustumCulled = false; s.renderOrder = -1;
    return s;
  }

  private placeSideJobs() {
    const R = this.city.roads;
    // Puneri patya
    const hoods = this.city.meta.hoods;
    PATYA.forEach((pt, i) => {
      const hd = hoods.find((h) => h.name === PATYA_HOODS[i]) ?? hoods[i % hoods.length];
      const off = ((i * 37) % 7) * 18 - 54;
      const h = R.nearest(hd.x + off, hd.z - off * 0.6, 120, (p) => p.cls >= RC.tertiary && p.cls <= RC.unknown && !p.elevated && p.w >= 4);
      if (!h) return;
      const dx = h.p.x[Math.min(h.k + 1, h.p.n - 1)] - h.p.x[h.k], dz = h.p.z[Math.min(h.k + 1, h.p.n - 1)] - h.p.z[h.k];
      const l = Math.hypot(dx, dz) || 1;
      const side = i % 2 ? 1 : -1;
      const x = h.x + (dz / l) * (h.p.w / 2 + 1.2) * side, z = h.z - (dx / l) * (h.p.w / 2 + 1.2) * side;
      const y = this.city.terrain.height(x, z);
      const obj = this.patyaBoard(pt[0], Math.atan2(dx, dz) + (side > 0 ? -Math.PI / 2 : Math.PI / 2));
      obj.position.set(x, y, z);
      this.props.add(obj);
      this.patyaPts.push({ x, z, y, i, obj });
    });
    // vada pav carts, garages, the helmet shop, the traffic mamas
    for (const [, la, lo] of FOOD) { const s = this.spot(la, lo, false); const q = this.kerb(s); this.foodPts.push(q); this.props.add(this.cart(q)); }
    for (const [, la, lo] of GARAGES) { const s = this.spot(la, lo, true); this.garagePts.push(s); this.props.add(this.garageSign(s)); }
    this.shopPt = this.kerb(this.spot(18.5139, 73.8540, false));
    this.props.add(this.helmetStall(this.shopPt));
    for (const [, la, lo] of MAMA) {
      const s = this.kerb(this.spot(la, lo, false));
      this.mamaPts.push({ ...s, look: { kind: 'man', c0: new THREE.Color().setRGB(0.9, 0.9, 0.88, THREE.LinearSRGBColorSpace), c1: new THREE.Color().setRGB(0.42, 0.34, 0.22, THREE.LinearSRGBColorSpace), c2: new THREE.Color().setRGB(0.45, 0.3, 0.2, THREE.LinearSRGBColorSpace) }, t: 0, yaw: Math.random() * 6 });
    }
  }
  /** A point on the kerb of the road nearest to s. */
  private kerb(s: Pt): Pt {
    const h = this.city.roads.nearest(s.x, s.z, 60, (p) => p.cls <= RC.unknown && !p.elevated);
    if (!h) return s;
    const k = Math.min(h.k + 1, h.p.n - 1), dx = h.p.x[k] - h.p.x[h.k], dz = h.p.z[k] - h.p.z[h.k], l = Math.hypot(dx, dz) || 1;
    const side = h.side >= 0 ? 1 : -1;
    return { x: h.x - (dz / l) * (h.p.w / 2 + 1.6) * side, z: h.z + (dx / l) * (h.p.w / 2 + 1.6) * side };
  }
  private propMesh(build: (add: (x: number, y: number, z: number, sx: number, sy: number, sz: number, c: [number, number, number]) => void) => void) {
    const pos: number[] = [], nor: number[] = [], col: number[] = [], idx: number[] = [];
    const add = (cx: number, cy: number, cz: number, sx: number, sy: number, sz: number, c: [number, number, number]) => {
      const g = new THREE.BoxGeometry(sx, sy, sz).translate(cx, cy, cz).toNonIndexed();
      const p = g.attributes.position, n = g.attributes.normal, b = pos.length / 3;
      for (let i = 0; i < p.count; i++) { pos.push(p.getX(i), p.getY(i), p.getZ(i)); nor.push(n.getX(i), n.getY(i), n.getZ(i)); col.push(...c); idx.push(b + i); }
    };
    build(add);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx);
    return new THREE.Mesh(g, this.mats.plain);
  }
  private patyaBoard(text: string, yaw: number) {
    const g = new THREE.Group();
    g.add(this.propMesh((add) => { add(-0.6, 0.9, 0, 0.06, 1.8, 0.06, [0.3, 0.3, 0.3]); add(0.6, 0.9, 0, 0.06, 1.8, 0.06, [0.3, 0.3, 0.3]); }));
    const cv = document.createElement('canvas'); cv.width = 512; cv.height = 256;
    const c = cv.getContext('2d')!;
    c.fillStyle = '#fbfaf3'; c.fillRect(0, 0, 512, 256); c.strokeStyle = '#1a1a1a'; c.lineWidth = 8; c.strokeRect(8, 8, 496, 240);
    c.fillStyle = '#c1121f'; c.font = '700 26px "Noto Serif Devanagari", serif'; c.textAlign = 'center'; c.fillText('सूचना', 256, 48);
    c.fillStyle = '#111'; c.font = '700 30px "Noto Serif Devanagari", serif';
    const words = text.split(' '); let line = '', y = 100;
    for (const w of words) { const t = line ? line + ' ' + w : w; if (c.measureText(t).width > 460) { c.fillText(line, 256, y); line = w; y += 44; } else line = t; }
    c.fillText(line, 256, y);
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
    const board = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.75), new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide, fog: false }));
    board.position.y = 1.55;
    g.add(board);
    g.rotation.y = yaw;
    return g;
  }
  private cart(p: Pt) {
    const y = this.city.terrain.height(p.x, p.z);
    const m = this.propMesh((add) => {
      add(0, 0.85, 0, 1.6, 0.12, 0.8, [0.75, 0.55, 0.3]); add(0, 0.45, 0, 1.5, 0.7, 0.7, [0.2, 0.45, 0.65]);
      add(0, 1.6, 0, 0.05, 1.5, 0.05, [0.3, 0.3, 0.3]); add(0, 2.35, 0, 2.2, 0.08, 2.2, [0.9, 0.25, 0.15]);
      add(-0.4, 1.0, 0, 0.5, 0.2, 0.5, [0.25, 0.25, 0.25]); add(0.4, 1.0, 0.1, 0.4, 0.12, 0.3, [0.85, 0.65, 0.3]);
    });
    m.position.set(p.x, y, p.z);
    return m;
  }
  private garageSign(p: Pt) {
    const y = this.city.terrain.height(p.x, p.z);
    const m = this.propMesh((add) => { add(-3, 2.2, 0, 0.2, 4.4, 0.2, [0.35, 0.35, 0.35]); add(3, 2.2, 0, 0.2, 4.4, 0.2, [0.35, 0.35, 0.35]); add(0, 4.4, 0, 6.6, 0.9, 0.2, [0.95, 0.6, 0.1]); });
    m.position.set(p.x, y, p.z);
    return m;
  }
  private helmetStall(p: Pt) {
    const y = this.city.terrain.height(p.x, p.z);
    const m = this.propMesh((add) => {
      add(0, 0.5, 0, 1.8, 1.0, 0.9, [0.3, 0.3, 0.32]);
      const cols: [number, number, number][] = [[0.9, 0.1, 0.1], [0.1, 0.1, 0.1], [0.95, 0.95, 0.95], [0.1, 0.3, 0.8], [0.95, 0.8, 0.1]];
      cols.forEach((c, i) => add(-0.7 + i * 0.35, 1.15, 0, 0.3, 0.28, 0.3, c));
      add(0, 2.2, 0, 2.4, 0.08, 1.6, [0.1, 0.4, 0.7]); add(-1, 1.1, 0.6, 0.05, 2.2, 0.05, [0.3, 0.3, 0.3]); add(1, 1.1, 0.6, 0.05, 2.2, 0.05, [0.3, 0.3, 0.3]);
    });
    m.position.set(p.x, y, p.z);
    return m;
  }

  // ---------------------------------------------------------------- WorldAPI
  player() {
    const c = this.p.car;
    return { x: c ? c.body.x : this.p.x, z: c ? c.body.z : this.p.z, y: c ? c.body.y : this.p.y, onFoot: !c, car: c, health: this.p.health, speed: c ? Math.abs(c.body.speed) : Math.hypot(this.p.vx, this.p.vz) };
  }
  spawnCar(type: VType, at: Pt, yaw = 0) {
    const c = this.traffic.makeCar(type, Math.floor(Math.random() * 12));
    const h = this.city.roads.nearest(at.x, at.z, 10);
    c.body.place(at.x, at.z, h && h.p.elevated ? h.y : this.city.terrain.height(at.x, at.z), yaw);
    c.parked = true; c.mission = 'mission';
    c.sync(this.mats);
    return c;
  }
  removeCar(c: Car) { if (this.p.car !== c) this.traffic.remove(c); }
  route(to: Pt | null) { this.routeTarget = to; this.routeObj = null; this.routeT = 0; this.routeIdx = 0; }
  objective(text: string) { this.objectiveText = text; }
  say(who: string, text: string, mr?: string, dur = 5) { this.subs.push({ who, text, mr, t: dur }); if (this.subs.length > 3) this.subs.shift(); }
  money(delta: number, why?: string) { this.p.money = Math.max(0, this.p.money + delta); if (why) this.toast(`${delta >= 0 ? '+' : '−'}₹${Math.abs(delta).toLocaleString('en-IN')}  ${why}`); if (delta > 0) this.sound.coin(); }
  setStars(n: number) { this.police.setStars(n); }
  stars() { return this.police.stars; }
  setHour(h: number) { this.hour = h; }
  getHour() { return this.hour; }
  marker(id: string, at: Pt | null, r = 4, color = '#ffd23f') {
    let m = this.markerObjs.get(id);
    if (!at) { if (m) { this.scene.remove(m); this.markerObjs.delete(id); } return; }
    if (!m) {
      const mat = this.markerMat.clone(); mat.uniforms.uTime = U.uTime;
      m = new THREE.Mesh(this.markerGeo, mat); m.renderOrder = 5;
      this.scene.add(m); this.markerObjs.set(id, m);
    }
    (m.material as THREE.ShaderMaterial).uniforms.uCol.value.set(color);
    m.userData.at = at; m.userData.r = r;
    this.placeMarker(m);
  }
  private placeMarker(m: THREE.Mesh) {
    const at = m.userData.at as Pt & { y?: number }, r = m.userData.r as number;
    const y = at.y !== undefined ? at.y : this.city.roads.surface(at.x, at.z, this.city.terrain.height(at.x, at.z) + 1, this.city.terrain.height(at.x, at.z)).y;
    m.position.set(at.x, y + 1.5, at.z); m.scale.set(r, 3, r);
  }
  timer(sec: number | null) { this.timerVal = sec; }
  sfx(k: 'pass' | 'fail' | 'coin' | 'bell') { this.sound[k](); }
  radio(id: StationId) { this.station = id; this.sound.setStation(id); }
  passenger(look: Look | null) { this.passengerLook = look; }
  stepTarget(c: Car | null) { this.target = c; }
  toast(t: string) { this.toastText = t; this.toastT = 4; }

  private shout(ped: Ped, why: 'hit' | 'jacked') {
    const lines: [string, string][] = why === 'jacked'
      ? [['आमची गाडी! चोर, चोर!', 'My bike! Thief, thief!'], ['अरे, ही काय दादागिरी?', 'Hey, what is this bullying?']]
      : [['अरे, दिसत नाही का?', 'Hey, can\'t you see?'], ['गाडी नीट चालव!', 'Drive properly!'], ['शहाणा आहेस का?', 'Think you\'re too smart?'], ['पोलीस बोलवू का?', 'Shall I call the police?'], ['हॉर्न वाजवायचा, धडक नाही!', 'You honk, you don\'t hit!']];
    const [mr, en] = lines[Math.floor(Math.random() * lines.length)];
    if (Math.hypot(ped.x - this.p.x, ped.z - this.p.z) < 40 || this.p.car) this.say('Passer-by', en, mr, 3);
  }

  // ---------------------------------------------------------------- input
  keyDown(code: string) {
    const k = keyMap[code]; if (k) this.keys.add(k);
    this.sound.start();
    if (code === 'KeyF' || code === 'Enter') this.toggleCar();
    if (code === 'KeyH') this.horn();
    if (code === 'KeyR') this.nextStation();
    if (code === 'KeyE') this.interact();
    if (code === 'KeyC') this.camMode = (this.camMode + 1) % 3;
    if (code === 'KeyM') this.toggleMap();
    if (code === 'KeyT') this.toggleRain();
  }
  keyUp(code: string) { const k = keyMap[code]; if (k) this.keys.delete(k); }
  dragCamera(dx: number, dy: number) { this.camYaw -= dx * 0.006; this.camPitch = Math.max(-0.1, Math.min(1.2, this.camPitch + dy * 0.004)); this.camUser = 2.2; }
  horn() { const c = this.p.car; this.sound.playerHorn(c ? (c.spec.two ? 0 : c.type === 'bus' || c.type === 'tempo' ? 2 : 1) : 0); }
  nextStation() { const i = STATIONS.findIndex((s) => s.id === this.station); this.radio(STATIONS[(i + 1) % STATIONS.length].id); }
  toggleMap() { this.mapOpen = !this.mapOpen; if (this.mapOpen) { const p = this.player(); this.mapCx = p.x; this.mapCz = p.z; } }
  toggleRain() { this.rain = !this.rain; this.toast(this.rain ? 'The monsoon arrives.' : 'The rain stops. The potholes remain.'); }
  setWaypoint(x: number, z: number) { this.waypoint = { x, z }; if (!this.missions.active) this.route(this.waypoint); }
  clearWaypoint() { this.waypoint = null; if (!this.missions.active) this.route(null); }

  interact() {
    const p = this.player();
    // start a mission
    if (!this.missions.active) {
      for (const s of this.missionStarts) {
        if (this.missions.done.has(s.m.id) || (s.m.needs && this.missions.done.size < s.m.needs)) continue;
        if (Math.hypot(s.at.x - p.x, s.at.z - p.z) < 9) {
          if (s.m.night && this.hour > 4.5 && this.hour < 20.5) { this.toast('Come back after dark. (Or press T for… no, that is rain. Just wait.)'); return; }
          if (this.police.stars > 0) { this.toast('Lose the police first.'); return; }
          this.missions.start(s.m); this.waypoint = null; return;
        }
      }
    }
    if (p.onFoot && Math.hypot(this.shopPt.x - p.x, this.shopPt.z - p.z) < 4) {
      if (this.helmet) this.toast('You already have a helmet. Wear it.');
      else if (this.p.money >= 350) { this.helmet = true; this.money(-350, 'ISI-marked helmet. The mama will be pleased.'); }
      else this.toast('A helmet is ₹350. You are short.');
    }
  }

  toggleCar() {
    const P = this.p;
    if (P.car) {
      const c = P.car, b = c.body;
      if (Math.abs(b.speed) > 6) { this.toast('Slow down to get off.'); return; }
      const lx = Math.cos(b.yaw), lz = -Math.sin(b.yaw);
      const off = c.spec.wid / 2 + 0.7;
      P.x = b.x + lx * off; P.z = b.z + lz * off; P.y = b.y; P.yaw = b.yaw; P.vx = P.vz = 0;
      if (this.city.buildings.inside(P.x, P.z)) { P.x = b.x - lx * off; P.z = b.z - lz * off; }
      c.parked = true; c.driver = null; c.input = { throttle: 0, brake: 1, steer: 0, handbrake: true };
      P.car = null;
      this.sound.engine('none', 0, 0);
      return;
    }
    // nearest vehicle we can get into
    let best: Car | null = null, bd = 3.2;
    for (const c of this.traffic.cars) {
      if (c.mission === 'thief') continue;
      const d = Math.hypot(c.body.x - P.x, c.body.z - P.z) - c.spec.len / 2 + 0.5;
      if (d < bd) { bd = d; best = c; }
    }
    if (!best) return;
    const c = best;
    if (c.ai && c.driver) {
      // out you get
      const b = c.body;
      const ped: Ped = { look: c.driver, x: b.x + Math.cos(b.yaw) * 1.5, z: b.z - Math.sin(b.yaw) * 1.5, y: b.y, yaw: b.yaw, piece: c.ai.piece, fwd: c.ai.fwd, s: c.ai.s, side: 4, v: 4.2, state: 'flee', t: 0, phase: 0, shout: 3, id: c.id + 100000 };
      this.traffic.peds.push(ped);
      this.shout(ped, 'jacked');
      if (c.pillion) this.traffic.peds.push({ ...ped, look: c.pillion, x: ped.x + 0.8, id: ped.id + 1 });
      this.police.crime(c.police ? 2 : 1);
    } else if (c.police) this.police.crime(2);
    c.ai = null; c.parked = false; c.driver = this.look; c.pillion = null; c.siren = false;
    if (c.mission === 'police') { const u = this.police.units.find((u) => u.car === c); if (u) this.police.units.splice(this.police.units.indexOf(u), 1); c.mission = ''; }
    c.input = { throttle: 0, brake: 0, steer: 0, handbrake: false };
    P.car = c;
    this.camYaw = c.body.yaw;
    if (c.spec.two && !this.helmet && Math.random() < 0.15) this.toast('No helmet? The traffic mama at the next chowk will have something to say.');
  }

  // ---------------------------------------------------------------- per frame
  setSize(w: number, h: number, dpr: number) {
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
    this.mats.glow.uniforms.uScale.value = h * dpr * 0.9;
  }

  frame(dtReal: number) {
    if (this.disposed) return;
    const dt = Math.min(dtReal, 1 / 20);
    this.fpsAcc += dtReal; this.fpsN++;
    if (this.fpsAcc > 1) { this.fps = Math.round(this.fpsN / this.fpsAcc); this.fpsAcc = 0; this.fpsN = 0; }
    if (!this.paused && !this.mapOpen) this.step(dt);
    else if (this.mapOpen) this.drawBigMap();
    this.render();
    this.hudT -= dtReal;
    if (this.hudT <= 0) { this.hudT = 0.1; this.hudCb(this.hud()); }
  }

  private step(dt: number) {
    this.t += dt;
    U.uTime.value = this.t;
    this.hour = (this.hour + dt * this.daySpeed) % 24;
    const P = this.p;

    // the player
    if (this.busted) {
      this.bustedT -= dt;
      if (this.bustedT <= 0) this.respawn();
    } else if (P.car) this.drive(dt); else this.walk(dt);

    // everyone else with a physics body: police, mission vehicles, abandoned ones rolling to a stop
    for (const c of this.traffic.cars) {
      if (c === P.car || c.ai) continue;
      if (c.parked) {
        if (Math.hypot(c.body.vx, c.body.vz) > 0.1) { c.input = { throttle: 0, brake: 1, steer: 0, handbrake: true }; c.body.step(dt, c.input, this.city, this.t); c.sync(this.mats); }
        continue;
      }
      if (c.mission === 'police' || c.mission === 'thief' || c.mission === 'mission') { c.body.step(dt, c.input, this.city, this.t); c.sync(this.mats); }
    }
    this.collideCars();

    const pl = this.player();
    const obstacles: { x: number; z: number; len: number; wid: number; id: number }[] = [];
    for (const c of this.traffic.cars) if (Math.hypot(c.body.x - pl.x, c.body.z - pl.z) < 320) obstacles.push({ x: c.body.x, z: c.body.z, len: c.spec.len, wid: c.spec.wid, id: c.id });
    if (!P.car) obstacles.push({ x: P.x, z: P.z, len: 0.6, wid: 0.6, id: -1 });
    for (const pd of this.traffic.peds) obstacles.push({ x: pd.x, z: pd.z, len: 0.6, wid: 0.6, id: -2 });
    this.traffic.updateAI(dt, obstacles);
    const threats: { x: number; z: number; vx: number; vz: number; r: number; player: boolean; id: number }[] = [];
    for (const c of this.traffic.cars) if (Math.hypot(c.body.x - pl.x, c.body.z - pl.z) < 150) threats.push({ x: c.body.x, z: c.body.z, vx: c.body.vx, vz: c.body.vz, r: Math.max(0.5, c.spec.wid / 2 + (c.spec.len > 3 ? 0.6 : 0)), player: c === P.car, id: c.id });
    this.traffic.lastPedHit = null;
    this.traffic.updatePeds(dt, threats);
    const hitPed = this.traffic.lastPedHit as { speed: number } | null;
    if (hitPed && hitPed.speed > 5) { this.police.crime(1); this.sound.thud(); }

    // the police
    const res = this.police.update(dt, pl.x, pl.z, !P.car, pl.speed);
    if (res === 'busted' && !this.busted) this.bust();

    // missions, side jobs
    this.missions.update(dt);
    this.sideJobs(dt);

    // keep the crowd and the traffic stocked around us
    if (Math.floor(this.t * 2) !== Math.floor((this.t - dt) * 2)) {
      const keep = new Set<Car>(); if (P.car) keep.add(P.car);
      for (const u of this.police.units) keep.add(u.car);
      this.traffic.upkeep(pl.x, pl.z, keep);
    }
    this.stream(pl.x, pl.z);

    // route
    if (this.routeTarget) {
      this.routeT -= dt;
      if (!this.routeObj || this.routeT <= 0) {
        this.routeObj = route(this.city, pl.x, pl.z, this.routeTarget.x, this.routeTarget.z, !!P.car);
        this.routeT = 4; this.routeIdx = 0;
      } else {
        const pr = progress(this.routeObj, pl.x, pl.z, this.routeIdx);
        this.routeIdx = pr.i;
        if (pr.d > 40) this.routeT = Math.min(this.routeT, 0.5);
      }
    }
    if (this.waypoint && !this.missions.active && Math.hypot(this.waypoint.x - pl.x, this.waypoint.z - pl.z) < 15) { this.clearWaypoint(); this.toast('You have arrived.'); }

    this.subs.forEach((s) => (s.t -= dt));
    this.subs = this.subs.filter((s) => s.t > 0);
    this.toastT -= dt; this.cardT -= dt;
    if (this.cardT <= 0) this.card = null;

    this.daylight(dt);
    this.updateCamera(dt);
    this.drawPeople();
    this.updateLights();
    this.audio(dt);
    for (const m of this.markerObjs.values()) this.placeMarker(m);
    if (this.miniCanvas) { this.miniT -= dt; if (this.miniT <= 0) { this.miniT = 1 / 30; this.drawMini(); } }
  }

  private walk(dt: number) {
    const P = this.p, K = this.keys, T = this.city.terrain;
    let ix = (K.has('left') ? 1 : 0) - (K.has('right') ? 1 : 0) + this.touch.x * -1;
    let iz = (K.has('up') ? 1 : 0) - (K.has('down') ? 1 : 0) + this.touch.y * -1;
    const mag = Math.hypot(ix, iz);
    if (mag > 1) { ix /= mag; iz /= mag; }
    const sprint = K.has('shift') && P.stamina > 0.05;
    const speed = (P.swim ? 1.3 : sprint ? 6.8 : 4.2) * Math.min(1, mag);
    // camera-relative: forward = where the camera looks
    const fx = Math.sin(this.camYaw), fz = Math.cos(this.camYaw), lx = Math.cos(this.camYaw), lz = -Math.sin(this.camYaw);
    const tx = (fx * iz + lx * ix) * speed, tz = (fz * iz + lz * ix) * speed;
    if (P.fall > 0) { P.fall -= dt; P.vx *= 0.9; P.vz *= 0.9; }
    else { P.vx += (tx - P.vx) * Math.min(1, dt * 10); P.vz += (tz - P.vz) * Math.min(1, dt * 10); }
    P.stamina = Math.max(0, Math.min(1, P.stamina + (sprint && mag > 0.1 ? -dt * 0.12 : dt * 0.2)));
    P.x += P.vx * dt; P.z += P.vz * dt;
    const sp = Math.hypot(P.vx, P.vz);
    if (sp > 0.3) { const want = Math.atan2(P.vx, P.vz); let d = want - P.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); P.yaw += d * Math.min(1, dt * 12); }
    P.phase += sp * dt * 3.3;
    // walls and vehicles
    const o = { x: 0, z: 0, nx: 0, nz: 0 };
    if (this.city.buildings.collide(P.x, P.z, 0.35, P.y + 0.3, o)) { P.x = o.x; P.z = o.z; }
    for (const c of this.traffic.cars) {
      const b = c.body;
      if (Math.abs(b.x - P.x) > 8 || Math.abs(b.z - P.z) > 8) continue;
      for (const [cx, cz, r] of b.circles()) {
        const dx = P.x - cx, dz = P.z - cz, d = Math.hypot(dx, dz), m = r + 0.35;
        if (d < m && d > 1e-4) {
          const sp2 = Math.hypot(b.vx, b.vz);
          if (sp2 > 4 && P.fall <= 0) { P.fall = 2; P.health -= sp2 * 4; P.vx = b.vx * 0.8; P.vz = b.vz * 0.8; this.sound.thud(); }
          P.x = cx + (dx / d) * m; P.z = cz + (dz / d) * m;
        }
      }
    }
    if (!T.inside(P.x, P.z, 4)) { P.x = Math.max(-T.hx + 4, Math.min(T.hx - 4, P.x)); P.z = Math.max(-T.hz + 4, Math.min(T.hz - 4, P.z)); }
    const ground = T.height(P.x, P.z);
    const surf = this.city.roads.surface(P.x, P.z, P.y, ground).y;
    if (K.has('space') && P.y <= surf + 0.05 && !P.swim) P.vy = 4.6;
    P.vy -= 9.8 * dt; P.y += P.vy * dt;
    if (P.y < surf) { if (P.vy < -9) P.health -= (-P.vy - 8) * 8; P.y = surf; P.vy = 0; }
    const wl = T.water(P.x, P.z);
    P.swim = isFinite(wl) && P.y < wl - 0.9;
    if (P.swim) { P.y = wl - 1.0; P.vy = 0; }
    if (P.health <= 0) this.wasted();
  }

  private drive(dt: number) {
    const P = this.p, c = P.car!, K = this.keys;
    const inp = c.input;
    const fwd = (K.has('up') ? 1 : 0) + this.touch.gas, back = (K.has('down') ? 1 : 0) + this.touch.brake;
    inp.throttle = Math.min(1, fwd); inp.brake = Math.min(1, back);
    inp.steer = Math.max(-1, Math.min(1, (K.has('left') ? 1 : 0) - (K.has('right') ? 1 : 0) - this.touch.x));
    inp.handbrake = K.has('space');
    c.braking = inp.brake > 0 && c.body.speed > 0.5;
    const before = c.body.health;
    c.body.wet = this.rainAmt;
    c.body.step(dt, inp, this.city, this.t);
    if (c.body.health < before - 2) { this.sound.crash(before - c.body.health); }
    c.sync(this.mats);
    P.x = c.body.x; P.z = c.body.z; P.y = c.body.y; P.yaw = c.body.yaw;
    if (c.spec.two && before - c.body.health > 6) P.health -= (before - c.body.health) * 0.5;
    if (c.body.health <= 0 && c.spec.two) {
      // thrown off
      this.toggleCarForce();
      P.fall = 2; P.health -= 15;
    }
    if (c.body.sunk) { this.toggleCarForce(); this.toast('Into the Mula-Mutha. That water is not for swimming.'); }
    if (P.health <= 0) this.wasted();
  }
  private toggleCarForce() {
    const c = this.p.car; if (!c) return;
    const b = c.body;
    this.p.x = b.x + Math.cos(b.yaw) * 1.4; this.p.z = b.z - Math.sin(b.yaw) * 1.4; this.p.y = b.y + 0.5; this.p.vx = b.vx * 0.5; this.p.vz = b.vz * 0.5;
    c.parked = true; c.driver = null; this.p.car = null;
    this.sound.engine('none', 0, 0);
  }

  private collideCars() {
    const cars = this.traffic.cars;
    const P = this.p;
    for (const a of cars) {
      if (a.ai && a !== P.car) continue; // kinematic traffic is handled from the other side
      for (const b of cars) {
        if (a === b) continue;
        if (Math.abs(a.body.x - b.body.x) > 14 || Math.abs(a.body.z - b.body.z) > 14) continue;
        if (Math.abs(a.body.y - b.body.y) > 3) continue;
        for (const [ax, az, ar] of a.body.circles()) for (const [bx, bz, br] of b.body.circles()) {
          const dx = ax - bx, dz = az - bz, d = Math.hypot(dx, dz), m = ar + br;
          if (d >= m || d < 1e-4) continue;
          const nx = dx / d, nz = dz / d, pen = m - d;
          const ma = a.spec.mass, mb = b.ai || b.parked ? b.spec.mass * (b.parked ? 1.5 : 3) : b.spec.mass;
          const wa = mb / (ma + mb), wb = ma / (ma + mb);
          a.body.x += nx * pen * wa; a.body.z += nz * pen * wa;
          const rv = (a.body.vx - b.body.vx) * nx + (a.body.vz - b.body.vz) * nz;
          if (rv < 0) {
            const j = -1.3 * rv;
            a.body.vx += nx * j * wa; a.body.vz += nz * j * wa;
            if (!b.ai) { b.body.vx -= nx * j * wb; b.body.vz -= nz * j * wb; b.body.x -= nx * pen * wb; b.body.z -= nz * pen * wb; if (b.parked) b.sync(this.mats); }
            const hit = -rv;
            if (hit > 3) {
              a.body.health -= hit * (a.spec.two ? 2.2 : 1.1) * (b.spec.mass / (a.spec.mass + b.spec.mass)) * 1.4;
              b.body.health -= hit * 1.5 * (a.spec.mass / (a.spec.mass + b.spec.mass)) * 2;
              if (a === P.car && t2(this) - a.body.lastHit > 0.4) {
                a.body.lastHit = this.t; this.sound.crash(hit);
                if (b.police) this.police.crime(1);
                else if (hit > 9 && b.ai) this.police.crime(0.5);
              }
              if (b.ai) { b.ai.v = 0; b.ai.blockedT = 2; b.ai.honkT = 0; }
            }
          }
        }
      }
    }
    function t2(w: PuneWorld) { return w.t; }
  }

  private bust() {
    const fine = 500 * Math.max(1, this.police.stars);
    this.busted = `BUSTED`; this.bustedT = 3.5;
    this.missions.abort('Busted.');
    this.money(-Math.min(this.p.money, fine), 'Fine paid at Faraskhana Police Station');
    this.sound.fail();
    this.respawnAt = 'faraskhana';
  }
  private wasted() {
    if (this.busted) return;
    this.busted = 'WASTED'; this.bustedT = 3.5;
    this.missions.abort('Wasted.');
    this.money(-Math.min(this.p.money, 1000), 'Bill at Sassoon General Hospital');
    this.sound.fail();
    this.respawnAt = 'sassoon';
  }
  respawnAt: 'faraskhana' | 'sassoon' = 'sassoon';
  private respawn() {
    const l = this.city.meta.landmarks.find((q) => q.key === this.respawnAt)!;
    const s = this.kerb({ x: l.x, z: l.z });
    if (this.p.car) this.toggleCarForce();
    this.p.x = s.x; this.p.z = s.z; this.p.y = this.city.terrain.height(s.x, s.z); this.p.vx = this.p.vz = 0;
    this.p.health = 100; this.p.fall = 0;
    this.police.clear();
    this.busted = '';
    this.say('', this.respawnAt === 'sassoon' ? 'Discharged from Sassoon General Hospital. The doctor says: "Wear a helmet."' : 'Released from Faraskhana Police Station. The inspector knows your Aaji.', undefined, 5);
  }

  private sideJobs(dt: number) {
    const pl = this.player();
    // patya
    for (const q of this.patyaPts) {
      if (Math.hypot(q.x - pl.x, q.z - pl.z) < 4.5) {
        this.patyaGot.add(q.i); this.props.remove(q.obj);
        const [mr, en] = PATYA[q.i];
        this.say(`Puneri Patya ${this.patyaGot.size}/20`, en, mr, 7);
        this.money(100 + (this.patyaGot.size === 20 ? 5000 : 0), this.patyaGot.size === 20 ? 'All twenty! You are now an honorary Punekar.' : 'Puneri patya found');
        this.saveGame();
      }
    }
    this.patyaPts = this.patyaPts.filter((q) => !this.patyaGot.has(q.i));
    // vada pav
    this.foodCool -= dt;
    if (this.foodCool <= 0 && !this.p.car) for (const f of this.foodPts) {
      if (Math.hypot(f.x - pl.x, f.z - pl.z) < 2.8 && this.p.health < 100) {
        if (this.p.money >= 20) { this.p.health = Math.min(100, this.p.health + 40); this.money(-20, 'Vada pav, extra chutney. Health restored.'); }
        else this.toast('A vada pav is ₹20. Even here.');
        this.foodCool = 6;
      }
    }
    // garages
    if (this.p.car) for (const g of this.garagePts) {
      if (Math.hypot(g.x - pl.x, g.z - pl.z) < 6 && pl.speed < 3) {
        const seen = this.police.units.some((u) => Math.hypot(u.car.body.x - pl.x, u.car.body.z - pl.z) < 70);
        if (seen) { if (this.toastT < 0) this.toast('Not with the police watching!'); continue; }
        if (this.p.car.body.health < 99 || this.police.stars > 0) {
          if (this.p.money < 300) { if (this.toastT < 0) this.toast('Repair and repaint: ₹300.'); continue; }
          this.p.car.body.health = 100; this.police.clear();
          const variant = Math.floor(Math.random() * 12);
          const c = this.p.car;
          this.scene.remove(c.mesh.group);
          const fresh = new Car(c.type, variant, this.mats);
          c.mesh = fresh.mesh; this.scene.add(c.mesh.group);
          this.money(-300, 'Repaired and repainted. "New colour, new number plate, no questions."');
        }
      }
    }
    // the traffic mama checks helmets
    this.mamaCool -= dt;
    const c = this.p.car;
    if (c && c.spec.two && !this.helmet && this.mamaCool <= 0) {
      for (const m of this.mamaPts) if (Math.hypot(m.x - pl.x, m.z - pl.z) < 14) {
        this.money(-Math.min(this.p.money, 500), 'Fine: riding without a helmet');
        this.say('Traffic mama', 'Helmet kuthe aahe? Five hundred rupees. Next time, wear it.', 'हेल्मेट कुठे आहे?', 4);
        this.mamaCool = 45;
        break;
      }
    }
  }

  // ---------------------------------------------------------------- the world around you
  private stream(px: number, pz: number) {
    const [HX, HZ] = this.city.meta.half;
    const R = this.viewDist + 120;
    const cx = Math.floor((px + HX) / TILE), cz = Math.floor((pz + HZ) / TILE);
    const rt = Math.ceil(R / TILE);
    const want = new Set<number>();
    const order: [number, number, number][] = [];
    for (let ix = cx - rt; ix <= cx + rt; ix++) for (let iz = cz - rt; iz <= cz + rt; iz++) {
      if (ix < 0 || iz < 0 || ix >= this.idx.nx || iz >= this.idx.nz) continue;
      const tx = ix * TILE - HX + TILE / 2, tz = iz * TILE - HZ + TILE / 2;
      const d = Math.hypot(tx - px, tz - pz);
      if (d > R + TILE * 0.7) continue;
      const k = tileKey(ix, iz);
      want.add(k);
      if (!this.tiles.has(k)) order.push([d, ix, iz]);
    }
    for (const [k, g] of this.tiles) {
      if (want.has(k)) continue;
      const ix = Math.floor(k / 1000), iz = k % 1000;
      const tx = ix * TILE - HX + TILE / 2, tz = iz * TILE - HZ + TILE / 2;
      if (Math.hypot(tx - px, tz - pz) > R + TILE * 1.6) { this.scene.remove(g); disposeGroup(g); this.tiles.delete(k); }
    }
    order.sort((a, b) => a[0] - b[0]);
    let budget = this.quality === 'high' ? 2 : 1;
    const t0 = performance.now();
    for (const [, ix, iz] of order) {
      if (budget-- <= 0 || performance.now() - t0 > 14) break;
      const g = buildTile(this.city, this.idx, this.mats, ix, iz, this.excl, 1);
      this.scene.add(g); this.tiles.set(tileKey(ix, iz), g);
    }
  }
  /** Build every tile near a point now (used while loading). */
  warm(px: number, pz: number, onTile?: (f: number) => void) {
    const [HX, HZ] = this.city.meta.half;
    const R = Math.min(this.viewDist, 600);
    const list: [number, number, number][] = [];
    for (let ix = 0; ix < this.idx.nx; ix++) for (let iz = 0; iz < this.idx.nz; iz++) {
      const tx = ix * TILE - HX + TILE / 2, tz = iz * TILE - HZ + TILE / 2;
      const d = Math.hypot(tx - px, tz - pz);
      if (d < R) list.push([d, ix, iz]);
    }
    list.sort((a, b) => a[0] - b[0]);
    let i = 0;
    for (const [, ix, iz] of list) {
      const k = tileKey(ix, iz);
      if (!this.tiles.has(k)) { const g = buildTile(this.city, this.idx, this.mats, ix, iz, this.excl, 1); this.scene.add(g); this.tiles.set(k, g); }
      onTile?.(++i / list.length);
    }
  }

  private daylight(dt: number) {
    const h = this.hour;
    // sun: rises in the east (+x), crosses a little south of overhead (+z), sets in the west
    const a = ((h - 6) / 12) * Math.PI;
    const el = Math.sin(a);
    const sd = U.uSunDir.value.set(Math.cos(a), Math.max(-0.3, el) * 0.95, 0.28).normalize();
    void sd;
    const day = THREE.MathUtils.smoothstep(el, -0.08, 0.25);
    const gold = Math.max(0, 1 - Math.abs(el - 0.08) / 0.22) * (el > -0.1 ? 1 : 0);
    const night = 1 - THREE.MathUtils.smoothstep(el, -0.2, 0.02);
    this.rainAmt += ((this.rain ? 1 : 0) - this.rainAmt) * Math.min(1, dt * 0.5);
    const r = this.rainAmt;
    const mix = (a: THREE.Color, b: THREE.Color, t: number) => a.clone().lerp(b, t);
    const skyDay = new THREE.Color(0.52, 0.66, 0.84), skyGold = new THREE.Color(0.62, 0.6, 0.62), skyNight = new THREE.Color(0.05, 0.07, 0.13);
    const fogDay = new THREE.Color(0.8, 0.78, 0.72), fogGold = new THREE.Color(0.95, 0.68, 0.45), fogNight = new THREE.Color(0.1, 0.11, 0.15);
    const sunDay = new THREE.Color(1, 0.94, 0.84), sunGold = new THREE.Color(1, 0.62, 0.32);
    let sky = mix(skyNight, skyDay, day), fog = mix(fogNight, fogDay, day);
    sky = mix(sky, skyGold, gold * 0.6); fog = mix(fog, fogGold, gold * 0.75);
    const sun = mix(sunDay, sunGold, gold).multiplyScalar(day * (1 - r * 0.6));
    sky = mix(sky, new THREE.Color(0.45, 0.48, 0.52).multiplyScalar(1 - night * 0.75), r * 0.7);
    fog = mix(fog, new THREE.Color(0.55, 0.57, 0.6).multiplyScalar(1 - night * 0.75), r * 0.8);
    U.uSky.value.copy(sky); U.uFog.value.copy(fog); U.uSunCol.value.copy(sun);
    U.uGround.value.set(0.42, 0.36, 0.28).multiplyScalar(0.25 + 0.75 * day).lerp(new THREE.Color(0.1, 0.1, 0.14), night * 0.6);
    U.uNight.value = night;
    U.uRain.value = r;
    U.uSiesta.value = h >= 13 && h < 16 ? 1 : 0;
    const vd = this.viewDist * (1 - r * 0.45) * (1 - night * 0.25);
    U.uFogNear.value = vd * 0.18; U.uFogFar.value = vd;
    this.camera.far = vd + 600; this.camera.updateProjectionMatrix();
    this.mats.lamp.uniforms.uEmit.value = night * 2.2;
    this.mats.glow.uniforms.uGlow.value = Math.max(night, r * 0.4) * 0.9;
    this.mats.brakeOff.uniforms.uEmit.value = 0.1 + night * 0.4;
    // rain streaks
    if (r > 0.02) {
      if (!this.rainObj) this.rainObj = this.makeRain();
      this.rainObj.visible = true;
      (this.rainObj.material as THREE.LineBasicMaterial).opacity = r * 0.35;
      this.rainObj.position.copy(this.camPos);
      this.rainObj.position.y -= (this.t * 22) % 8;
    } else if (this.rainObj) this.rainObj.visible = false;
  }
  private makeRain() {
    const n = 2400, pos = new Float32Array(n * 6);
    for (let i = 0; i < n; i++) {
      const x = (Math.random() - 0.5) * 50, y = (Math.random() - 0.5) * 30 + 8, z = (Math.random() - 0.5) * 50;
      pos.set([x, y, z, x + 0.05, y - 0.7, z + 0.03], i * 6);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const l = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0xaab4c0, transparent: true, opacity: 0.3, depthWrite: false }));
    l.frustumCulled = false;
    this.scene.add(l);
    return l;
  }

  private updateCamera(dt: number) {
    const P = this.p, c = P.car;
    const tx = c ? c.body.x : P.x, tz = c ? c.body.z : P.z, ty = c ? c.body.y : P.y;
    this.camUser -= dt;
    if (c && this.camUser <= 0 && Math.abs(c.body.speed) > 1.5) {
      let target = c.body.yaw; if (c.body.speed < -1) target += Math.PI;
      let d = target - this.camYaw; d = Math.atan2(Math.sin(d), Math.cos(d));
      this.camYaw += d * Math.min(1, dt * 2.5);
    }
    if (!c && this.camUser <= 0 && Math.hypot(P.vx, P.vz) > 1) {
      let d = P.yaw - this.camYaw; d = Math.atan2(Math.sin(d), Math.cos(d));
      this.camYaw += d * Math.min(1, dt * 1.2);
    }
    const sz = c ? c.spec.len : 0;
    const far = [1, 1.6, 0.6][this.camMode];
    const dist = (c ? 4.2 + sz * 0.9 + Math.min(4, Math.abs(c.body.speed) * 0.12) : 4.2) * far;
    const hgt = (c ? 1.6 + c.spec.height * 0.6 : 1.7) * far;
    const pitch = this.camPitch;
    const fx = Math.sin(this.camYaw), fz = Math.cos(this.camYaw);
    const look = new THREE.Vector3(tx, ty + (c ? c.spec.height * 0.6 : 1.5), tz);
    const want = new THREE.Vector3(tx - fx * dist * Math.cos(pitch), ty + hgt + dist * Math.sin(pitch) * 0.6, tz - fz * dist * Math.cos(pitch));
    // don't let the camera go inside a building or under the ground
    for (let k = 1; k <= 8; k++) {
      const t = k / 8;
      const x = look.x + (want.x - look.x) * t, z = look.z + (want.z - look.z) * t, y = look.y + (want.y - look.y) * t;
      const b = this.city.buildings.inside(x, z);
      if (b && y < b.base + b.h) { want.set(look.x + (want.x - look.x) * (t - 0.12), look.y + (want.y - look.y) * (t - 0.12) + 0.6, look.z + (want.z - look.z) * (t - 0.12)); break; }
    }
    const gy = this.city.terrain.height(want.x, want.z) + 0.6;
    if (want.y < gy) want.y = gy;
    this.camPos.lerp(want, Math.min(1, dt * (c ? 7 : 9)));
    this.camLook.lerp(look, Math.min(1, dt * 12));
    if (this.camPos.distanceTo(want) > 40) { this.camPos.copy(want); this.camLook.copy(look); }
    this.camera.position.copy(this.camPos);
    this.camera.lookAt(this.camLook);
    U.uCam.value.copy(this.camPos);
    this.sky.position.copy(this.camPos);
  }

  private drawPeople() {
    const P = this.p;
    this.crowd.begin();
    if (!P.car && !this.busted) {
      const sp = Math.hypot(P.vx, P.vz);
      const pose = P.fall > 0 ? Pose.fallen : P.swim ? Pose.walk : sp > 5.5 ? Pose.run : sp > 0.3 ? Pose.walk : Pose.stand;
      this.crowd.draw(this.look, P.x, P.y + (P.swim ? 0.2 : 0), P.z, P.yaw, pose, P.phase, pose === Pose.run ? 0.95 : 0.65);
    } else if (P.car) {
      const c = P.car, b = c.body, s = c.spec, fx = Math.sin(b.yaw), fz = Math.cos(b.yaw);
      if (s.two) {
        const sx = -Math.cos(b.yaw) * Math.sin(b.roll) * 0.6, sz = Math.sin(b.yaw) * Math.sin(b.roll) * 0.6;
        this.crowd.draw(this.look, b.x - fx * 0.15 - sx, b.y + s.seat - 0.15, b.z - fz * 0.15 - sz, b.yaw, Pose.ride, 0, 0, this.helmet ? 1 : 0);
        if (this.passengerLook) this.crowd.draw(this.passengerLook, b.x - fx * 0.55 - sx, b.y + s.seat - 0.12, b.z - fz * 0.55 - sz, b.yaw, Pose.ride, 0, 0);
      } else if (c.type === 'auto') {
        this.crowd.draw(this.look, b.x + fx * 0.45, b.y + 0.25, b.z + fz * 0.45, b.yaw, Pose.ride, 0, 0);
        if (this.passengerLook) this.crowd.draw(this.passengerLook, b.x - fx * 0.6, b.y + 0.25, b.z - fz * 0.6, b.yaw, Pose.ride, 0, 0);
      }
    }
    this.traffic.drawPeople(this.t);
    for (const m of this.mamaPts) {
      if (Math.hypot(m.x - P.x, m.z - P.z) > 200) continue;
      m.t += 0.016;
      this.crowd.draw(m.look, m.x, this.city.terrain.height(m.x, m.z), m.z, m.yaw + Math.sin(m.t * 0.3) * 0.8, Pose.wave, m.t, 0.4);
    }
    // a passenger waiting for Meter Down
    const wv = this.missions.run?.data['waving'] as Pt | undefined;
    if (wv) this.crowd.draw(randomLookStable, wv.x, this.city.terrain.height(wv.x, wv.z), wv.z, this.t, Pose.wave, this.t * 2, 0.4);
    // vendors
    for (const f of this.foodPts) if (Math.hypot(f.x - P.x, f.z - P.z) < 150) this.crowd.draw(vendorLook, f.x + 0.9, this.city.terrain.height(f.x, f.z), f.z, -Math.PI / 2, Pose.stand, 0, 0);
    this.crowd.end();
  }

  private updateLights() {
    const g = this.vehLights.geometry;
    const pos = g.attributes.position.array as Float32Array, col = g.attributes.aCol.array as Float32Array, siz = g.attributes.aSize.array as Float32Array;
    let n = 0;
    const N = pos.length / 3;
    const pl = this.player();
    const put = (x: number, y: number, z: number, r: number, gg: number, b: number, s: number) => { if (n >= N) return; pos[n * 3] = x; pos[n * 3 + 1] = y; pos[n * 3 + 2] = z; col[n * 3] = r; col[n * 3 + 1] = gg; col[n * 3 + 2] = b; siz[n] = s; n++; };
    for (const c of this.traffic.cars) {
      const b = c.body;
      if (Math.hypot(b.x - pl.x, b.z - pl.z) > 400 || (c.parked && !c.siren)) continue;
      const s = c.spec, fx = Math.sin(b.yaw), fz = Math.cos(b.yaw), lx = Math.cos(b.yaw), lz = -Math.sin(b.yaw);
      const hy = b.y + (s.two ? 0.95 : s.height * 0.42);
      if (s.two) put(b.x + fx * s.len * 0.5, hy, b.z + fz * s.len * 0.5, 1, 0.95, 0.8, 5);
      else for (const sg of [-1, 1]) put(b.x + fx * s.len * 0.5 + lx * sg * s.wid * 0.33, hy, b.z + fz * s.len * 0.5 + lz * sg * s.wid * 0.33, 1, 0.95, 0.8, 5);
      const br = c.braking ? 1 : 0.35;
      if (!s.two) for (const sg of [-1, 1]) put(b.x - fx * s.len * 0.5 + lx * sg * s.wid * 0.38, hy, b.z - fz * s.len * 0.5 + lz * sg * s.wid * 0.38, br, 0.06 * br, 0.04 * br, c.braking ? 4 : 2.5);
      if (c.police && (c.siren || this.police.stars > 0)) {
        const on = Math.floor(this.t * 6) % 2;
        put(b.x - lx * 0.3, b.y + s.height + 0.2, b.z - lz * 0.3, on ? 2 : 0.1, 0.1, 0.1, 12);
        put(b.x + lx * 0.3, b.y + s.height + 0.2, b.z + lz * 0.3, 0.1, 0.25, on ? 0.1 : 2, 12);
      }
    }
    g.setDrawRange(0, n);
    g.attributes.position.needsUpdate = true; g.attributes.aCol.needsUpdate = true; g.attributes.aSize.needsUpdate = true;
  }

  private audio(dt: number) {
    const s = this.sound;
    if (!s.ctx) return;
    const c = this.p.car;
    if (c) s.engine(c.spec.two ? 'two' : c.type === 'auto' ? 'auto' : c.type === 'bus' || c.type === 'tempo' ? 'bus' : 'car', c.body.rpm, c.input.throttle);
    else s.engine('none', 0, 0);
    let near = 0;
    for (const u of this.police.units) near = Math.max(near, 1 - Math.hypot(u.car.body.x - this.p.x, u.car.body.z - this.p.z) / 250);
    s.sirenOn(this.police.stars > 0 && near > 0, near);
    const pl = this.player();
    let busy = 0;
    for (const cc of this.traffic.cars) if (Math.hypot(cc.body.x - pl.x, cc.body.z - pl.z) < 80) busy++;
    s.cityHum(Math.min(1, busy / 25) * (1 - U.uNight.value * 0.5));
    this.amb -= dt;
    if (this.amb <= 0) {
      this.amb = 2 + Math.random() * 5;
      if (U.uNight.value < 0.5) s.crow(); else s.cricket();
      for (const l of this.city.meta.landmarks) if (['dagdusheth', 'kasba', 'omkareshwar', 'tulshibaug', 'parvati', 'chaturshringi'].includes(l.key) && Math.hypot(l.x - pl.x, l.z - pl.z) < 60) { s.bell(); break; }
    }
  }

  private render() {
    this.renderer.render(this.scene, this.camera);
  }

  // ---------------------------------------------------------------- the map and the HUD
  blips(): Blip[] {
    const out: Blip[] = [];
    if (!this.missions.active) for (const s of this.missionStarts) {
      if (this.missions.done.has(s.m.id) || (s.m.needs && this.missions.done.size < s.m.needs)) continue;
      out.push({ ...s.at, kind: 'mission', label: s.m.title });
    }
    for (const m of this.markerObjs.values()) { const at = m.userData.at as Pt; out.push({ x: at.x, z: at.z, kind: 'waypoint', color: '#' + (m.material as THREE.ShaderMaterial).uniforms.uCol.value.getHexString() }); }
    if (this.target) out.push({ x: this.target.body.x, z: this.target.body.z, kind: 'target' });
    for (const u of this.police.units) out.push({ x: u.car.body.x, z: u.car.body.z, kind: 'police' });
    if (this.waypoint) out.push({ ...this.waypoint, kind: 'waypoint' });
    for (const f of this.foodPts) out.push({ ...f, kind: 'food' });
    for (const g of this.garagePts) out.push({ ...g, kind: 'garage' });
    out.push({ ...this.shopPt, kind: 'shop' });
    return out;
  }
  private drawMini() {
    const cv = this.miniCanvas!;
    const g = cv.getContext('2d'); if (!g) return;
    const dpr = cv.width / (cv.clientWidth || cv.width);
    const pl = this.player();
    const sp = pl.speed;
    this.map.drawMini(g, cv.clientWidth || 180, cv.clientHeight || 180, pl.x, pl.z, this.camYaw, 1.0 + Math.min(1.6, sp * 0.05), this.routeObj, this.blips(), dpr);
  }
  drawBigMap() {
    const cv = this.bigCanvas; if (!cv) return;
    const g = cv.getContext('2d'); if (!g) return;
    const dpr = cv.width / (cv.clientWidth || cv.width);
    const pl = this.player();
    this.map.drawBig(g, cv.clientWidth, cv.clientHeight, this.mapCx, this.mapCz, this.mapScale, this.routeObj, this.blips(), { x: pl.x, z: pl.z, yaw: this.p.car ? this.p.car.body.yaw : this.p.yaw }, dpr);
  }
  mapToWorld(sx: number, sy: number) {
    const cv = this.bigCanvas!;
    return { x: this.mapCx + (sx - cv.clientWidth / 2) * this.mapScale, z: this.mapCz + (sy - cv.clientHeight / 2) * this.mapScale };
  }

  hud(): Hud {
    const P = this.p, c = P.car, pl = this.player();
    const hood = hoodAt(this.city.meta, pl.x, pl.z);
    const rh = this.city.roads.nearest(pl.x, pl.z, 25, (p) => p.name !== 0xffff);
    const road = rh ? this.city.meta.names[rh.p.name] ?? '' : '';
    const hh = Math.floor(this.hour), mm = Math.floor((this.hour - hh) * 60);
    const st = STATIONS.find((s) => s.id === this.station)!;
    let prompt = '';
    if (!P.car) {
      for (const cc of this.traffic.cars) {
        const d = Math.hypot(cc.body.x - P.x, cc.body.z - P.z) - cc.spec.len / 2 + 0.5;
        if (d < 3.2 && cc.mission !== 'thief') { prompt = `F — ${cc.ai && cc.driver ? 'take' : 'get on'} the ${cc.spec.label.toLowerCase()}`; break; }
      }
      if (Math.hypot(this.shopPt.x - P.x, this.shopPt.z - P.z) < 4 && !this.helmet) prompt = 'E — buy a helmet (₹350)';
    }
    if (!this.missions.active) for (const s of this.missionStarts) {
      if (this.missions.done.has(s.m.id) || (s.m.needs && this.missions.done.size < s.m.needs)) continue;
      if (Math.hypot(s.at.x - pl.x, s.at.z - pl.z) < 9) { prompt = `E — start “${s.m.title}” (${s.m.mr})`; break; }
    }
    const sub = this.subs.length ? this.subs[this.subs.length - 1] : null;
    return {
      money: P.money, health: Math.max(0, P.health), stars: this.police.stars, searching: this.police.searching,
      speed: c ? Math.round(Math.abs(c.body.speed) * 3.6) : 0, vehicle: c ? c.spec.label : '', vehicleMr: c ? SPECS[c.type].marathi : '',
      area: hood, road, clock: `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`,
      objective: this.objectiveText, timer: this.timerVal, subtitle: sub ? { who: sub.who, text: sub.text, mr: sub.mr } : null,
      prompt, toast: this.toastT > 0 ? this.toastText : '', radio: st.name, radioSub: st.sub, mission: this.missions.active?.title ?? '',
      onFoot: !c, patya: this.patyaGot.size, helmet: this.helmet, busted: this.busted, mapOpen: this.mapOpen,
      night: U.uNight.value > 0.5, rain: this.rain, missionCard: this.card, fps: this.fps,
    };
  }

  saveGame() {
    const s: Save = { money: this.p.money, done: [...this.missions.done], patya: [...this.patyaGot], helmet: this.helmet, x: this.p.x, z: this.p.z, hour: this.hour };
    try { localStorage.setItem('pune411-v1', JSON.stringify(s)); } catch { /* private mode */ }
  }

  dispose() {
    this.disposed = true;
    this.sound.stop();
    for (const g of this.tiles.values()) disposeGroup(g);
    this.renderer.dispose();
  }
}

const vendorLook: Look = randomLook(() => 0.31, 'man');
const randomLookStable: Look = randomLook(() => 0.77, 'woman');

function disposeGroup(g: THREE.Object3D) {
  g.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.geometry && !(m as unknown as THREE.InstancedMesh).isInstancedMesh) m.geometry.dispose();
    if ((m as unknown as THREE.InstancedMesh).isInstancedMesh) (m as unknown as THREE.InstancedMesh).dispose();
  });
}
