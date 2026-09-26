import * as THREE from 'three';
import { basic, G, group, lam, put, type V3 } from './kit';

/**
 * The two mascots: vinyl-toy caricatures, head as big as the body.
 *
 * NaMo: white hair swept back, a trimmed white beard, rimless glasses, a
 * half-sleeved kurta and a sleeveless jacket over it. RaGa: dark hair
 * greying at the sides, a salt-and-pepper beard, a white T-shirt. Neither is
 * a likeness; each is the silhouette a cartoonist would draw.
 *
 * Both are the same rig — hips, a torso that leans and turns, a head that
 * nods, arms with a shoulder, a twist and an elbow, legs with a knee — so any
 * pose works on either. Faces are swapped, not sculpted: eyes that squash,
 * brows that tilt, one of eight mouths, and the odd drop of sweat.
 */

export type Who = 'm' | 'r';
export type Face = 'smile' | 'grin' | 'laugh' | 'smug' | 'shock' | 'angry' | 'wink' | 'cry' | 'sleepy' | 'determined' | 'worried' | 'love' | 'calm';
export type Hat = 'pagdi' | 'topi' | 'helmet' | 'astro' | 'chef' | 'cap' | 'hardhat' | 'cowboy' | 'headband' | 'wool' | 'sunhat';
export type Acc = 'shades' | 'scarf' | 'shawl' | 'gloves' | 'apron' | 'belt' | 'medal' | 'cape' | 'garland' | 'armband';

export interface Look { outfit?: number; hat?: Hat; acc?: Acc[] }

/** [forward, out, elbow, twist] for arms; [forward, out, knee] for legs. */
export interface Joints {
  la: number[];
  ra: number[];
  ll: number[];
  rl: number[];
  lean: number;
  turn: number;
  sway: number;
  nod: number;
  tilt: number;
  yaw: number;
  y: number;
  pitch: number;
}

const SKIN = { m: '#d49a70', r: '#dcaa84' };
const R = 0.46;

/** Kurta, jacket, trousers, sleeves-long? */
const OUTFITS: Record<Who, { top: string; vest?: string; legs: string; shoes: string; long?: boolean; tee?: boolean }[]> = {
  m: [
    { top: '#f0892a', vest: '#efe6d2', legs: '#f2efe7', shoes: '#6a4228' },
    { top: '#f3f0e8', vest: '#2f4a7a', legs: '#f2efe7', shoes: '#6a4228' },
    { top: '#efe2c4', vest: '#7a2438', legs: '#f2efe7', shoes: '#6a4228' },
    { top: '#9cc6e6', vest: '#4a4a52', legs: '#f2efe7', shoes: '#3a2a1e' },
    { top: '#f3f0e8', vest: '#e8872b', legs: '#f2efe7', shoes: '#6a4228' },
    { top: '#26335a', vest: '#26335a', legs: '#26335a', shoes: '#1a1410', long: true }, // the suit
    { top: '#e8872b', legs: '#e8872b', shoes: '#c98a52', long: true }, // saffron robe
    { top: '#f3f0e8', vest: '#3f7a4a', legs: '#f2efe7', shoes: '#6a4228' },
  ],
  r: [
    { top: '#f7f7f4', legs: '#3b4250', shoes: '#eeeeee', tee: true },
    { top: '#f5f3ec', legs: '#f5f3ec', shoes: '#6a4228', long: true },
    { top: '#c8231e', legs: '#3b4250', shoes: '#2a2420', tee: true }, // the porter's red shirt
    { top: '#f7f7f4', legs: '#f7f7f4', shoes: '#f0e0c8', long: true }, // aikido gi
    { top: '#2a2a30', legs: '#3b4250', shoes: '#eeeeee', long: true, tee: true }, // bomber
    { top: '#7fb2d8', legs: '#3b4250', shoes: '#eeeeee', tee: true },
  ],
};

type Mouth = 'smile' | 'frown' | 'grin' | 'open' | 'o' | 'laugh' | 'flat' | 'smirk';
const FACES: Record<Face, { eyes: [number, number]; brow: number; browY: number; mouth: Mouth; extras: ('sweat' | 'tears' | 'blush' | 'anger' | 'zzz')[] }> = {
  smile: { eyes: [1, 1], brow: 0, browY: 0, mouth: 'smile', extras: [] },
  grin: { eyes: [0.85, 0.85], brow: -0.12, browY: 0.02, mouth: 'grin', extras: [] },
  laugh: { eyes: [0.15, 0.15], brow: -0.2, browY: 0.03, mouth: 'laugh', extras: ['blush'] },
  smug: { eyes: [0.45, 0.45], brow: 0.12, browY: -0.01, mouth: 'smirk', extras: [] },
  shock: { eyes: [1.5, 1.5], brow: -0.45, browY: 0.06, mouth: 'open', extras: ['sweat'] },
  angry: { eyes: [0.8, 0.8], brow: 0.5, browY: -0.02, mouth: 'frown', extras: ['anger'] },
  wink: { eyes: [1, 0.1], brow: -0.1, browY: 0.02, mouth: 'grin', extras: ['blush'] },
  cry: { eyes: [0.3, 0.3], brow: -0.4, browY: 0.03, mouth: 'open', extras: ['tears'] },
  sleepy: { eyes: [0.08, 0.08], brow: 0, browY: -0.02, mouth: 'o', extras: ['zzz'] },
  determined: { eyes: [0.7, 0.7], brow: 0.32, browY: -0.02, mouth: 'flat', extras: [] },
  worried: { eyes: [1.1, 1.1], brow: -0.38, browY: 0.03, mouth: 'frown', extras: ['sweat'] },
  love: { eyes: [1, 1], brow: -0.15, browY: 0.02, mouth: 'smile', extras: ['blush'] },
  calm: { eyes: [0.08, 0.08], brow: -0.05, browY: 0, mouth: 'smile', extras: [] },
};

interface Arm { sh: THREE.Group; tw: THREE.Group; el: THREE.Group; hand: THREE.Group; side: number }
interface Leg { hip: THREE.Group; knee: THREE.Group; side: number }

let zTex: THREE.Texture | null = null;
function zzzTexture() {
  if (zTex) return zTex;
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const g = c.getContext('2d')!;
  g.fillStyle = '#ffffff';
  g.strokeStyle = '#2a1a4a';
  g.lineWidth = 8;
  g.font = '900 54px Futura, Arial Black, sans-serif';
  for (const [t, x, y, s] of [['z', 22, 108, 0.7], ['Z', 60, 72, 1], ['Z', 92, 36, 1.2]] as const) {
    g.save();
    g.translate(x, y);
    g.scale(s, s);
    g.strokeText(t, 0, 0);
    g.fillText(t, 0, 0);
    g.restore();
  }
  zTex = new THREE.CanvasTexture(c);
  zTex.colorSpace = THREE.SRGBColorSpace;
  return zTex;
}

let vestGeo: THREE.BufferGeometry | null = null;
let capeGeo: THREE.BufferGeometry | null = null;

export class Mascot {
  root = new THREE.Group();
  upper: THREE.Group;
  head: THREE.Group;
  arms: [Arm, Arm];
  legs: [Leg, Leg];
  private eyes: THREE.Mesh[] = [];
  private brows: THREE.Mesh[] = [];
  private mouths = new Map<Mouth, THREE.Object3D>();
  private extras = new Map<string, THREE.Object3D>();
  face: Face = 'smile';

  constructor(public who: Who, look: Look = {}) {
    const o = OUTFITS[who][Math.min(look.outfit ?? 0, OUTFITS[who].length - 1)]!;
    const skin = lam(SKIN[who], false);
    const cloth = lam(o.top, false);
    const legsM = lam(o.legs, false);
    const shoes = lam(o.shoes);
    const acc = new Set(look.acc || []);
    if (who === 'r') this.root.scale.setScalar(1.04);

    /* legs, planted on the root so the body can lean over them */
    this.legs = [1, -1].map((side) => {
      const hip = group(this.root, [side * 0.17, 0.56, 0]);
      put(hip, G.cap(0.125, 0.1), legsM, [0, -0.12, 0]);
      const knee = group(hip, [0, -0.24, 0]);
      put(knee, G.cap(0.115, 0.1), legsM, [0, -0.1, 0]);
      put(knee, G.box(0.22, 0.12, 0.34), shoes, [0, -0.25, 0.07]);
      if (who === 'r' && o.tee) put(knee, G.box(0.23, 0.035, 0.35), lam('#b8b8b8'), [0, -0.305, 0.07]);
      return { hip, knee, side };
    }) as [Leg, Leg];

    /* the upper body pivots at the hips */
    this.upper = group(this.root, [0, 0.56, 0]);
    const U = group(this.upper, [0, -0.56, 0]);
    if (who === 'm' || !o.tee) {
      // a kurta: long, flared, a mandarin collar and a placket
      put(U, G.cyl(0.34, who === 'm' ? 0.46 : 0.42, 0.8, 16), cloth, [0, 0.92, 0]);
      put(U, G.cyl(0.15, 0.16, 0.08, 14), cloth, [0, 1.34, 0]);
      for (let i = 0; i < 3; i++) put(U, G.sph(0.022, 6, 5), lam('#c9a24a'), [0, 1.24 - i * 0.1, 0.345 + i * 0.012]);
      if (o.vest) {
        vestGeo ||= new THREE.CylinderGeometry(0.37, 0.44, 0.62, 18, 1, true, 0.42, Math.PI * 2 - 0.84);
        const v = put(U, vestGeo, lam(o.vest, false), [0, 1.0, 0]);
        (v.material as THREE.Material).side = THREE.DoubleSide;
        put(U, G.box(0.13, 0.03, 0.02), lam(o.vest), [0.22, 0.95, 0.4], [0, 0.5, 0]);
        if (o.vest === o.top) put(U, G.box(0.08, 0.26, 0.03), lam('#b0182a'), [0, 1.12, 0.37], [-0.2, 0, 0]); // the suit's tie
      }
    } else {
      // a T-shirt over trousers
      put(U, G.cyl(0.37, 0.35, 0.6, 16), cloth, [0, 1.02, 0]);
      put(U, G.cyl(0.35, 0.36, 0.24, 16), legsM, [0, 0.64, 0]);
      put(U, G.tor(0.14, 0.025, Math.PI * 2, 14), lam(o.top === '#2a2a30' ? '#f7f7f4' : o.top), [0, 1.31, 0.02], [Math.PI / 2 - 0.2, 0, 0]);
      if (o.top === '#2a2a30') put(U, G.box(0.2, 0.5, 0.02), lam('#f7f7f4'), [0, 1.03, 0.36]);
      if (o.top === '#c8231e') put(U, G.cyl(0.09, 0.09, 0.02, 12), lam('#d8b44a'), [-0.2, 1.12, 0.35], [Math.PI / 2, 0, 0]);
    }
    put(U, G.cyl(0.13, 0.14, 0.14, 10), skin, [0, 1.4, 0]);
    if (acc.has('belt')) put(U, G.tor(0.36, 0.05, Math.PI * 2, 18), lam('#1a1a1a'), [0, 0.78, 0], [Math.PI / 2, 0, 0]);
    if (acc.has('apron')) put(U, G.box(0.5, 0.62, 0.02), lam('#ffffff'), [0, 0.92, 0.42], [-0.12, 0, 0]);
    if (acc.has('scarf')) {
      put(U, G.tor(0.2, 0.08, Math.PI * 2, 14), lam('#d8342a'), [0, 1.36, 0], [Math.PI / 2, 0, 0]);
      put(U, G.box(0.14, 0.4, 0.06), lam('#d8342a'), [0.12, 1.12, 0.33], [0.1, 0, 0.1]);
    }
    if (acc.has('shawl')) put(U, G.cyl(0.4, 0.5, 0.36, 16, true), lam('#8a5a3a', false), [0, 1.16, 0]);
    if (acc.has('medal')) {
      put(U, G.tor(0.2, 0.02, Math.PI, 12), lam('#2a6ad8'), [0, 1.3, 0.2], [0.4, 0, Math.PI]);
      put(U, G.cyl(0.09, 0.09, 0.03, 14), lam('#f4c430'), [0, 1.06, 0.4], [Math.PI / 2 - 0.2, 0, 0]);
    }
    if (acc.has('garland')) {
      for (let i = 0; i < 16; i++) {
        const a = (i / 15) * Math.PI;
        put(U, G.sph(0.06, 6, 5), lam(i % 2 ? '#ff9a1a' : '#ffd23f'), [Math.cos(a) * 0.3, 1.32 - Math.sin(a) * 0.36, 0.3 + Math.sin(a) * 0.08]);
      }
    }
    if (acc.has('cape')) {
      capeGeo ||= new THREE.PlaneGeometry(0.9, 1.0);
      const c = put(U, capeGeo, lam('#d8242a'), [0, 0.86, -0.42], [0.12, 0, 0]);
      (c.material as THREE.Material).side = THREE.DoubleSide;
    }
    if (acc.has('armband')) put(U, G.cyl(0.14, 0.14, 0.08, 12), lam('#d8b44a'), [0.44, 1.12, 0], [0, 0, 0.1]);

    /* arms: shoulder, twist, elbow, hand */
    this.arms = [1, -1].map((side) => {
      const sh = group(U, [side * 0.43, 1.22, 0]);
      const tw = group(sh);
      const sleeve = lam(o.top, false);
      put(tw, G.cyl(0.125, 0.135, 0.24, 12), sleeve, [0, -0.1, 0]);
      put(tw, G.cap(0.088, 0.1), o.long ? sleeve : skin, [0, -0.2, 0]);
      const el = group(tw, [0, -0.28, 0]);
      put(el, G.cap(0.083, 0.13), o.long ? sleeve : skin, [0, -0.1, 0]);
      if (acc.has('gloves')) put(el, G.sph(0.17, 10, 8), lam('#d8242a'), [0, -0.3, 0.02], [0, 0, 0], [1, 1.05, 1.15]);
      else put(el, G.sph(0.105, 10, 8), skin, [0, -0.26, 0]);
      const hand = group(el, [0, -0.3, 0], [Math.PI / 2, 0, 0]);
      return { sh, tw, el, hand, side };
    }) as [Arm, Arm];

    /* the head */
    this.head = group(U, [0, 1.44, 0]);
    const H = group(this.head, [0, 0.42, 0]);
    put(H, G.sph(R, 22, 16), skin, [0, 0, 0], [0, 0, 0], [1, 0.97, 0.95]);
    for (const s of [1, -1]) put(H, G.sph(0.09, 8, 6), skin, [s * 0.45, -0.02, -0.02], [0, 0, 0], [0.5, 1, 0.8]);
    put(H, G.sph(0.065, 10, 8), lam(who === 'm' ? '#c48660' : '#cf9a74', false), [0, -0.04, 0.45], [0, 0, 0], [1, 0.9, 0.8]);
    if (who === 'm') {
      const white = lam('#f4f2ee', false);
      const hair = put(H, G.shell(R * 1.04, 0, Math.PI * 0.44), white, [0, 0.02, -0.03], [-0.5, 0, 0]);
      hair.scale.set(1.02, 1, 1.02);
      put(H, G.shell(R * 1.03, Math.PI * 0.5, Math.PI), white, [0, -0.02, 0.02], [0, 0, 0], [1.02, 1.1, 1.06]);
      for (const s of [1, -1]) put(H, G.sph(0.12, 8, 6), white, [s * 0.4, 0.04, -0.02], [0, 0, 0], [0.45, 1.1, 1]);
      put(H, G.cap(0.042, 0.16), white, [0, -0.13, 0.44], [0, 0, Math.PI / 2]);
      // rimless glasses: thin gold rims, a bridge, arms back to the ears
      const gold = lam('#b8963e');
      for (const s of [1, -1]) {
        put(H, G.tor(0.1, 0.012, Math.PI * 2, 18), gold, [s * 0.16, 0.06, 0.45], [0, s * 0.18, 0], [1.2, 0.9, 1]);
        put(H, G.box(0.012, 0.012, 0.36), gold, [s * 0.29, 0.08, 0.26], [0, s * 0.25, 0]);
      }
      put(H, G.box(0.08, 0.014, 0.014), gold, [0, 0.08, 0.465]);
    } else {
      const dark = lam('#2b2622', false);
      const grey = lam('#8a8580', false);
      put(H, G.shell(R * 1.05, 0, Math.PI * 0.46), dark, [0, 0.02, -0.02], [-0.32, 0, 0]);
      put(H, G.sph(0.22, 12, 8), dark, [0.06, 0.38, 0.14], [0.2, 0, -0.2], [1.6, 0.55, 1.1]);
      for (const s of [1, -1]) put(H, G.sph(0.14, 10, 8), grey, [s * 0.39, 0.1, -0.04], [0, 0, 0], [0.4, 0.85, 1]);
      // a short salt-and-pepper beard, close to the jaw
      put(H, G.shell(R * 1.015, Math.PI * 0.6, Math.PI), lam('#8c8680', false), [0, -0.01, 0.012], [0, 0, 0], [1.0, 1.0, 1.02]);
      put(H, G.cap(0.026, 0.13), lam('#6e6863', false), [0, -0.13, 0.445], [0, 0, Math.PI / 2]);
    }

    // eyes, brows, mouths
    const browM = lam(who === 'm' ? '#e2ddd4' : '#2a2420');
    for (const s of [1, -1]) {
      const e = put(H, G.sph(0.054, 10, 8), lam('#1a1410'), [s * 0.16, 0.05, 0.435], [0, 0, 0], [1, 1, 0.5]);
      put(e, G.sph(0.018, 6, 4), basic('#ffffff'), [0.015, 0.02, 0.04]);
      this.eyes.push(e);
      this.brows.push(put(H, G.box(0.15, 0.04, 0.03), browM, [s * 0.16, 0.2, 0.425]));
    }
    const M = group(H, [0, -0.22, 0.43], [-0.35, 0, 0]);
    const ink = lam('#3a1410');
    const mk = (k: Mouth, build: (g: THREE.Group) => void) => {
      const g = group(M);
      build(g);
      g.visible = false;
      this.mouths.set(k, g);
    };
    mk('smile', (g) => put(g, G.tor(0.1, 0.022, Math.PI, 12), ink, [0, 0.03, 0.02], [0, 0, Math.PI]));
    mk('frown', (g) => put(g, G.tor(0.08, 0.022, Math.PI, 12), ink, [0, -0.04, 0.02]));
    mk('smirk', (g) => put(g, G.tor(0.09, 0.022, Math.PI * 0.7, 12), ink, [0.03, 0.02, 0.02], [0, 0, Math.PI * 1.15]));
    mk('flat', (g) => put(g, G.box(0.14, 0.03, 0.02), ink, [0, 0, 0.02]));
    mk('o', (g) => put(g, G.sph(0.04, 8, 6), ink, [0, 0, 0.01], [0, 0, 0], [1, 1.2, 0.4]));
    mk('open', (g) => put(g, G.sph(0.075, 10, 8), ink, [0, -0.01, 0.01], [0, 0, 0], [1, 1.3, 0.4]));
    mk('grin', (g) => {
      put(g, G.disc(0.13, 16, Math.PI, Math.PI), ink, [0, 0.04, 0.03]);
      put(g, G.box(0.22, 0.04, 0.01), lam('#ffffff'), [0, 0.02, 0.035]);
    });
    mk('laugh', (g) => {
      put(g, G.disc(0.15, 16, Math.PI, Math.PI), ink, [0, 0.05, 0.03], [0, 0, 0], [1, 1.3, 1]);
      put(g, G.sph(0.06, 8, 6), lam('#e0506a'), [0, -0.11, 0.03], [0, 0, 0], [1.2, 0.6, 0.3]);
      put(g, G.box(0.24, 0.04, 0.01), lam('#ffffff'), [0, 0.03, 0.035]);
    });
    // extras
    const ex = (k: string, build: (g: THREE.Group) => void) => {
      const g = group(H);
      build(g);
      g.visible = false;
      this.extras.set(k, g);
    };
    ex('sweat', (g) => put(g, G.sph(0.06, 8, 6), lam('#7ad0ff'), [0.36, 0.26, 0.26], [0, 0, 0.3], [0.8, 1.3, 0.6]));
    ex('tears', (g) => { for (const s of [1, -1]) put(g, G.cap(0.03, 0.14), lam('#7ad0ff'), [s * 0.17, -0.07, 0.44]); });
    ex('blush', (g) => { for (const s of [1, -1]) put(g, G.disc(0.07, 14), basic('#ff7a8a', 0.6), [s * 0.27, -0.06, 0.39], [0, s * 0.55, 0]); });
    ex('anger', (g) => {
      const red = lam('#e0202a');
      for (let i = 0; i < 4; i++) put(g, G.box(0.1, 0.03, 0.03), red, [0.26 + Math.cos((i * Math.PI) / 2) * 0.05, 0.34 + Math.sin((i * Math.PI) / 2) * 0.05, 0.3], [0, 0.5, (i * Math.PI) / 2]);
    });
    ex('zzz', (g) => {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: zzzTexture(), transparent: true, depthWrite: false }));
      sp.position.set(0.45, 0.6, 0);
      sp.scale.setScalar(0.6);
      g.add(sp);
    });
    if (acc.has('shades')) {
      for (const s of [1, -1]) put(H, G.box(0.18, 0.1, 0.03), lam('#141414'), [s * 0.16, 0.06, 0.47]);
      put(H, G.box(0.1, 0.02, 0.02), lam('#141414'), [0, 0.09, 0.47]);
    }
    if (look.hat) this.hat(H, look.hat);
    this.setFace('smile');
  }

  private hat(H: THREE.Group, h: Hat) {
    switch (h) {
      case 'pagdi': {
        const cols = ['#e8392a', '#f5b700', '#e8392a', '#ff7a1a'];
        cols.forEach((c, i) => put(H, G.tor(0.36 - i * 0.05, 0.1, Math.PI * 2, 18), lam(c), [0, 0.22 + i * 0.08, -0.02], [Math.PI / 2 - 0.25, 0, 0]));
        put(H, G.sph(0.3, 14, 10), lam('#e8392a'), [0, 0.42, -0.06], [0, 0, 0], [1, 0.55, 1]);
        put(H, G.box(0.16, 0.7, 0.04), lam('#f5b700'), [0.08, -0.12, -0.46], [0.15, 0, 0.1]);
        break;
      }
      case 'topi': {
        // the boat-shaped cap: a squashed four-sided pyramid, long side to side
        const g = group(H, [0, 0.5, 0.02], [-0.18, 0, 0]);
        g.scale.set(1.3, 1, 0.66);
        put(g, G.cone(0.42, 0.34, 4), lam('#fbfbf6'), [0, 0, 0], [0, Math.PI / 4, 0]);
        put(g, G.box(0.6, 0.06, 0.62), lam('#eeeee6'), [0, -0.16, 0]);
        break;
      }
      case 'helmet':
        put(H, G.shell(R * 1.14, 0, Math.PI * 0.55), lam('#d8242a'), [0, 0.02, 0]);
        put(H, G.box(0.6, 0.14, 0.1), lam('#222a3a'), [0, 0.18, 0.46]);
        break;
      case 'astro': {
        const glass = new THREE.MeshLambertMaterial({ color: '#bfe6ff', transparent: true, opacity: 0.28, depthWrite: false });
        put(H, G.sph(R * 1.32, 20, 14), glass, [0, 0, 0.02]);
        put(H, G.tor(0.42, 0.08, Math.PI * 2, 18), lam('#f0f0f0'), [0, -0.55, 0], [Math.PI / 2, 0, 0]);
        break;
      }
      case 'chef':
        put(H, G.cyl(0.3, 0.28, 0.3, 14), lam('#ffffff'), [0, 0.5, 0]);
        put(H, G.sph(0.34, 12, 8), lam('#ffffff'), [0, 0.72, 0], [0, 0, 0], [1, 0.6, 1]);
        break;
      case 'cap':
        put(H, G.shell(R * 1.08, 0, Math.PI * 0.42), lam('#1a4aa8'), [0, 0.04, 0]);
        put(H, G.box(0.46, 0.03, 0.3), lam('#1a4aa8'), [0, 0.22, 0.5], [0.15, 0, 0]);
        break;
      case 'hardhat':
        put(H, G.shell(R * 1.1, 0, Math.PI * 0.46), lam('#ffc81a'), [0, 0.06, 0]);
        put(H, G.cyl(0.6, 0.6, 0.03, 18), lam('#ffc81a'), [0, 0.16, 0.04]);
        break;
      case 'cowboy':
        put(H, G.cyl(0.72, 0.72, 0.05, 18), lam('#6b4a2e'), [0, 0.3, 0]);
        put(H, G.cyl(0.3, 0.36, 0.34, 12), lam('#6b4a2e'), [0, 0.5, 0]);
        break;
      case 'headband':
        put(H, G.tor(0.45, 0.04, Math.PI * 2, 20), lam('#e0202a'), [0, 0.2, 0], [Math.PI / 2 - 0.15, 0, 0]);
        break;
      case 'wool':
        put(H, G.shell(R * 1.08, 0, Math.PI * 0.45), lam('#2a8a5a'), [0, 0.06, 0]);
        put(H, G.tor(0.46, 0.06, Math.PI * 2, 18), lam('#f4f0e6'), [0, 0.2, 0], [Math.PI / 2, 0, 0]);
        put(H, G.sph(0.1, 8, 6), lam('#f4f0e6'), [0, 0.56, 0]);
        break;
      case 'sunhat':
        put(H, G.cyl(0.7, 0.72, 0.04, 20), lam('#e8cf8a'), [0, 0.26, 0], [-0.15, 0, 0]);
        put(H, G.shell(R * 1.02, 0, Math.PI * 0.4), lam('#e8cf8a'), [0, 0.1, 0]);
        put(H, G.tor(0.34, 0.04, Math.PI * 2, 16), lam('#e0502a'), [0, 0.28, -0.02], [Math.PI / 2 - 0.15, 0, 0]);
        break;
    }
  }

  setFace(f: Face) {
    this.face = f;
    const d = FACES[f];
    this.eyes.forEach((e, i) => e.scale.set(1, d.eyes[i]!, 0.5));
    this.brows.forEach((b, i) => {
      const s = i === 0 ? 1 : -1;
      b.rotation.z = -s * d.brow;
      b.position.y = 0.2 + d.browY + (f === 'smug' && i === 0 ? 0.04 : 0);
    });
    for (const [k, m] of this.mouths) m.visible = k === d.mouth;
    for (const [k, m] of this.extras) m.visible = (d.extras as string[]).includes(k);
  }

  private blinking = false;
  blink(on: boolean) {
    if (on === this.blinking) return;
    this.blinking = on;
    const d = FACES[this.face];
    this.eyes.forEach((e, i) => e.scale.set(1, on ? Math.min(0.08, d.eyes[i]!) : d.eyes[i]!, 0.5));
  }

  /** Something in a hand: 0 = left, 1 = right. The thing's +y points out of the fist. */
  hold(obj: THREE.Object3D, hand: 0 | 1 = 1) {
    this.arms[hand].hand.add(obj);
  }

  pose(j: Joints) {
    for (const [i, a] of this.arms.entries()) {
      const v = i === 0 ? j.la : j.ra;
      a.sh.rotation.set(-(v[0] || 0), 0, a.side * (v[1] || 0));
      a.tw.rotation.y = a.side * (v[3] || 0);
      a.el.rotation.x = -(v[2] || 0);
    }
    for (const [i, l] of this.legs.entries()) {
      const v = i === 0 ? j.ll : j.rl;
      l.hip.rotation.set(-(v[0] || 0), 0, l.side * (v[1] || 0));
      l.knee.rotation.x = v[2] || 0;
    }
    this.upper.rotation.set(j.lean, j.turn, j.sway);
    this.head.rotation.set(j.nod, j.yaw, j.tilt);
    this.root.position.y = j.y;
    this.root.rotation.x = j.pitch;
  }
}

export function place(m: Mascot, p: V3) {
  m.root.position.set(p[0], 0, p[1]);
  m.root.rotation.y = p[2];
}
