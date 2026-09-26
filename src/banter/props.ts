import * as THREE from 'three';
import { basic, G, group, lam, put, textMat } from './kit';

/**
 * Everything they hold and everything they stand among, as toys: a few
 * boxes and cylinders each, bright, chunky, readable at thumbnail size.
 *
 * Held things are built pointing up out of the fist (+y), with the grip at
 * the origin. Floor things stand on y = 0 and face +z, towards the camera.
 */

export interface PropOpts { text?: string; color?: string; alt?: string }
type Make = (o: PropOpts) => THREE.Object3D;

const g0 = () => new THREE.Group();
const C = {
  wood: '#8a5a32', woodL: '#b8834e', metal: '#b8bcc4', dark: '#2a2a30', white: '#f6f4ee', red: '#d8342a', saffron: '#f08a2a',
  green: '#3f9a4a', leaf: '#4fae4a', blue: '#2a6ad8', gold: '#f2c230', clay: '#b8683a', navy: '#1e2e5a', cream: '#f2e6c8',
};

function tricolour(parent: THREE.Object3D, w: number, h: number, p: [number, number, number]) {
  const f = group(parent, p);
  put(f, G.box(w, h / 3, 0.02), lam('#ff9933'), [0, h / 3, 0]);
  put(f, G.box(w, h / 3, 0.02), lam('#ffffff'), [0, 0, 0]);
  put(f, G.box(w, h / 3, 0.02), lam('#138808'), [0, -h / 3, 0]);
  put(f, G.tor(h * 0.11, h * 0.015, Math.PI * 2, 16), lam('#000080'), [0, 0, 0.02]);
  return f;
}

function board(parent: THREE.Object3D, text: string, w: number, h: number, p: [number, number, number], bg = '#fff6e0', fg = '#2a1a10') {
  const b = group(parent, p);
  put(b, G.box(w + 0.06, h + 0.06, 0.05), lam(C.wood), [0, 0, -0.03]);
  const face = new THREE.Mesh(G.plane(w, h), textMat(text, bg, fg, 512, Math.round((512 * h) / w)));
  face.position.z = 0.001;
  b.add(face);
  return b;
}

function wheel(parent: THREE.Object3D, r: number, w: number, p: [number, number, number]) {
  put(parent, G.cyl(r, r, w, 14), lam('#23201e'), p, [0, 0, Math.PI / 2]);
  put(parent, G.cyl(r * 0.45, r * 0.45, w + 0.02, 8), lam('#d8d2c8'), p, [0, 0, Math.PI / 2]);
}

export const HELD: Record<string, Make> = {
  chai: () => { const g = g0(); put(g, G.cyl(0.09, 0.065, 0.16, 10), lam(C.clay), [0, 0.1, 0]); put(g, G.disc(0.082, 12), lam('#a8582a'), [0, 0.181, 0], [-Math.PI / 2, 0, 0]); return g; },
  coffee: () => { const g = g0(); put(g, G.cyl(0.085, 0.08, 0.18, 12), lam(C.white), [0, 0.1, 0]); put(g, G.tor(0.05, 0.015, Math.PI * 2, 10), lam(C.white), [0.1, 0.1, 0]); put(g, G.disc(0.075, 12), lam('#5a3218'), [0, 0.191, 0], [-Math.PI / 2, 0, 0]); return g; },
  kettle: () => { const g = g0(); put(g, G.tor(0.1, 0.015, Math.PI, 10), lam(C.metal), [0, -0.04, 0], [0, 0, Math.PI]); put(g, G.sph(0.17, 12, 8), lam(C.metal), [0, -0.25, 0], [0, 0, 0], [1, 0.8, 1]); put(g, G.cyl(0.025, 0.04, 0.22, 8), lam(C.metal), [0, -0.22, 0.18], [0.9, 0, 0]); return g; },
  mic: () => { const g = g0(); put(g, G.cyl(0.035, 0.03, 0.3, 8), lam(C.dark), [0, 0.1, 0]); put(g, G.sph(0.07, 10, 8), lam('#8a8e98'), [0, 0.28, 0]); return g; },
  megaphone: () => { const g = g0(); put(g, G.cyl(0.03, 0.03, 0.14, 8), lam(C.dark), [0, 0.05, 0]); put(g, G.cyl(0.18, 0.06, 0.34, 12, true), lam('#f2f2f2'), [0, 0.2, 0.12], [-1.2, 0, 0]); put(g, G.tor(0.18, 0.02, Math.PI * 2, 14), lam(C.red), [0, 0.26, 0.28], [0.35, 0, 0]); return g; },
  phone: () => { const g = g0(); put(g, G.box(0.14, 0.26, 0.02), lam('#1a1a1e'), [0, 0.12, 0]); put(g, G.plane(0.12, 0.22), basic('#6ad0ff'), [0, 0.12, 0.012]); return g; },
  selfie: () => { const g = g0(); put(g, G.cyl(0.015, 0.015, 0.6, 6), lam(C.dark), [0, 0.3, 0]); put(g, G.box(0.14, 0.26, 0.02), lam('#1a1a1e'), [0, 0.66, 0], [0.3, Math.PI, 0]); return g; },
  bat: () => { const g = g0(); put(g, G.cyl(0.03, 0.03, 0.3, 8), lam('#2a2a2a'), [0, 0.05, 0]); put(g, G.box(0.14, 0.62, 0.05), lam('#e8cf8a'), [0, 0.5, 0.02]); return g; },
  ball: (o) => { const g = g0(); put(g, G.sph(0.1, 12, 8), lam(o.color || '#c8202a'), [0, 0.1, 0]); return g; },
  reel: () => { const g = g0(); put(g, G.cyl(0.1, 0.1, 0.16, 10), lam('#f5b700'), [0, 0.06, 0], [0, 0, Math.PI / 2]); put(g, G.cyl(0.13, 0.13, 0.02, 10), lam(C.red), [0.08, 0.06, 0], [0, 0, Math.PI / 2]); put(g, G.cyl(0.13, 0.13, 0.02, 10), lam(C.red), [-0.08, 0.06, 0], [0, 0, Math.PI / 2]); return g; },
  pillow: (o) => { const g = g0(); put(g, G.sph(0.3, 12, 8), lam(o.color || '#f4f0ff', false), [0, 0.3, 0], [0, 0, 0], [0.75, 1, 0.3]); put(g, G.box(0.46, 0.05, 0.19), lam('#e87a9a'), [0, 0.3, 0]); return g; },
  balloon: (o) => { const g = g0(); put(g, G.sph(0.15, 12, 10), lam(o.color || '#3ab8ff', false), [0, 0.17, 0], [0, 0, 0], [1, 1.15, 1]); put(g, G.cone(0.04, 0.06, 6), lam(o.color || '#3ab8ff'), [0, 0.02, 0], [Math.PI, 0, 0]); return g; },
  laddoo: () => { const g = g0(); put(g, G.cyl(0.26, 0.2, 0.04, 16), lam('#d8b44a'), [0, 0.04, 0]); for (const [x, y, z] of [[0, 0.12, 0], [-0.1, 0.1, 0.07], [0.1, 0.1, 0.07], [-0.1, 0.1, -0.07], [0.1, 0.1, -0.07], [0, 0.2, 0]]) put(g, G.sph(0.07, 8, 6), lam('#ffa81a'), [x!, y!, z!]); return g; },
  broom: () => { const g = g0(); put(g, G.cyl(0.03, 0.03, 0.5, 8), lam(C.red), [0, -0.05, 0]); put(g, G.cone(0.16, 0.55, 10), lam('#d8b86a'), [0, -0.55, 0], [Math.PI, 0, 0]); return g; },
  flag: () => { const g = g0(); put(g, G.cyl(0.02, 0.02, 0.9, 6), lam(C.woodL), [0, 0.35, 0]); tricolour(g, 0.5, 0.33, [0.26, 0.62, 0]); return g; },
  book: (o) => { const g = g0(); put(g, G.box(0.26, 0.34, 0.07), lam(o.color || '#c8231e'), [0, 0.14, 0]); put(g, G.box(0.2, 0.03, 0.075), lam(C.gold), [0, 0.2, 0]); return g; },
  // held high, above the head, like a real protest sign
  placard: (o) => { const g = g0(); put(g, G.cyl(0.02, 0.02, 1.3, 6), lam(C.woodL), [0, 0.5, 0]); board(g, o.text || '!', 0.7, 0.44, [0, 1.22, 0.03], o.color || '#fff6e0'); return g; },
  trophy: () => { const g = g0(); put(g, G.cyl(0.08, 0.1, 0.06, 10), lam('#5a3a1e'), [0, 0.03, 0]); put(g, G.cyl(0.02, 0.02, 0.12, 6), lam(C.gold), [0, 0.12, 0]); put(g, G.cyl(0.14, 0.05, 0.2, 12), lam(C.gold), [0, 0.28, 0]); for (const s of [1, -1]) put(g, G.tor(0.06, 0.015, Math.PI * 2, 10), lam(C.gold), [s * 0.15, 0.3, 0]); return g; },
  umbrella: (o) => { const g = g0(); put(g, G.cyl(0.015, 0.015, 1.3, 6), lam(C.dark), [0, 0.5, 0]); put(g, G.cone(0.75, 0.3, 10), lam(o.color || '#2a2a38'), [0, 1.18, 0]); return g; },
  snowball: () => { const g = g0(); put(g, G.dodec(0.12), lam('#ffffff'), [0, 0.12, 0]); return g; },
  dumbbell: () => { const g = g0(); put(g, G.cyl(0.025, 0.025, 0.4, 6), lam(C.metal), [0, 0.05, 0], [0, 0, Math.PI / 2]); for (const s of [1, -1]) put(g, G.cyl(0.1, 0.1, 0.08, 10), lam(C.dark), [s * 0.18, 0.05, 0], [0, 0, Math.PI / 2]); return g; },
  ladle: () => { const g = g0(); put(g, G.cyl(0.018, 0.018, 0.55, 6), lam(C.metal), [0, -0.1, 0]); put(g, G.sph(0.08, 10, 6), lam(C.metal), [0, -0.4, 0.02], [0, 0, 0], [1, 0.6, 1]); return g; },
  roller: (o) => { const g = g0(); put(g, G.cyl(0.02, 0.02, 0.4, 6), lam(C.wood), [0, 0.2, 0]); put(g, G.cyl(0.07, 0.07, 0.3, 10), lam(o.color || C.saffron), [0, 0.46, 0], [0, 0, Math.PI / 2]); return g; },
  globe: () => { const g = g0(); put(g, G.sph(0.22, 14, 10), lam('#3a8ae8', false), [0, 0.24, 0]); for (const [x, y, z] of [[0.1, 0.3, 0.16], [-0.12, 0.18, 0.15], [0.05, 0.1, -0.18]]) put(g, G.sph(0.08, 6, 4), lam(C.green), [x!, y!, z!], [0, 0, 0], [1, 0.6, 0.6]); return g; },
  scroll: () => { const g = g0(); put(g, G.cyl(0.05, 0.05, 0.5, 8), lam(C.cream), [0, 0.05, 0], [0, 0, Math.PI / 2]); const p = put(g, G.plane(0.46, 1.4), textMat('POINT 1\nPOINT 2\nPOINT 3\n...\nPOINT 206', '#fffaf0', '#7a6a58', 256, 780), [0, -0.1, 0.62], [-Math.PI / 2 + 0.25, 0, 0]); (p.material as THREE.Material).side = THREE.DoubleSide; return g; },
  clock: () => { const g = g0(); put(g, G.cyl(0.16, 0.16, 0.08, 16), lam(C.red), [0, 0.2, 0], [Math.PI / 2, 0, 0]); put(g, G.disc(0.13, 16), textMat('4:00', '#fff', '#111', 128, 128), [0, 0.2, 0.041]); for (const s of [1, -1]) put(g, G.sph(0.05, 8, 6), lam(C.gold), [s * 0.1, 0.36, 0]); return g; },
  icecream: () => { const g = g0(); put(g, G.cone(0.07, 0.22, 10), lam('#d89a52'), [0, 0.1, 0], [Math.PI, 0, 0]); put(g, G.sph(0.09, 10, 8), lam('#ffb8d0'), [0, 0.25, 0]); return g; },
  mango: () => { const g = g0(); put(g, G.sph(0.11, 10, 8), lam('#ffb81a', false), [0, 0.12, 0], [0, 0, 0.4], [0.85, 1.15, 0.85]); put(g, G.sph(0.04, 6, 4), lam(C.leaf), [0.05, 0.24, 0], [0, 0, 0], [1.5, 0.4, 0.8]); return g; },
  jalebi: () => { const g = g0(); put(g, G.cyl(0.26, 0.2, 0.04, 16), lam(C.white), [0, 0.04, 0]); for (const [x, z, r] of [[0, 0, 0.1], [-0.1, 0.05, 0.08], [0.1, 0.04, 0.07]]) put(g, G.tor(r!, 0.025, Math.PI * 2, 14), lam('#ff9a1a'), [x!, 0.09, z!], [Math.PI / 2, 0, 0]); return g; },
  sapling: () => { const g = g0(); put(g, G.cyl(0.12, 0.09, 0.16, 10), lam(C.clay), [0, 0.08, 0]); put(g, G.cyl(0.015, 0.015, 0.24, 6), lam(C.wood), [0, 0.26, 0]); for (let i = 0; i < 4; i++) put(g, G.sph(0.07, 6, 4), lam(C.leaf), [Math.cos(i * 1.6) * 0.07, 0.34 + i * 0.03, Math.sin(i * 1.6) * 0.07], [0, 0, 0], [1.3, 0.5, 0.8]); return g; },
  wrench: () => { const g = g0(); put(g, G.box(0.05, 0.4, 0.03), lam(C.metal), [0, 0.15, 0]); put(g, G.tor(0.06, 0.02, Math.PI * 1.5, 10), lam(C.metal), [0, 0.37, 0]); return g; },
  racket: () => { const g = g0(); put(g, G.cyl(0.02, 0.02, 0.3, 6), lam(C.dark), [0, 0.12, 0]); put(g, G.tor(0.13, 0.015, Math.PI * 2, 14), lam(C.red), [0, 0.4, 0], [0, 0, 0], [0.8, 1.1, 1]); put(g, G.disc(0.13, 14), basic('#ffffff', 0.35), [0, 0.4, 0], [0, 0, 0], [0.8, 1.1, 1]); return g; },
  dandiya: () => { const g = g0(); put(g, G.cyl(0.025, 0.025, 0.5, 6), lam('#e8392a'), [0, 0.2, 0]); put(g, G.cyl(0.028, 0.028, 0.08, 6), lam(C.gold), [0, 0.3, 0]); return g; },
  stick: () => { const g = g0(); put(g, G.cyl(0.02, 0.025, 0.4, 6), lam(C.woodL), [0, 0.18, 0.05], [0.5, 0, 0]); return g; },
  plane: () => { const g = g0(); const m = put(g, G.cone(0.14, 0.4, 3), lam(C.white), [0, 0.2, 0], [0, 0, 0], [1, 1, 0.2]); m.rotation.y = Math.PI / 2; return g; },
  cylinder: () => { const g = g0(); put(g, G.cap(0.16, 0.36), lam(C.red), [0, -0.35, 0]); put(g, G.cyl(0.05, 0.05, 0.1, 8), lam(C.metal), [0, -0.05, 0]); return g; },
  suitcase: () => { const g = g0(); put(g, G.box(0.7, 0.44, 0.22), lam('#6a4228'), [0, 0.26, 0]); put(g, G.box(0.72, 0.05, 0.24), lam(C.gold), [0, 0.3, 0]); return g; },
  ballot: () => { const g = g0(); put(g, G.box(0.24, 0.3, 0.01), lam('#fffbe8'), [0, 0.16, 0]); put(g, G.box(0.06, 0.06, 0.012), lam('#2a4ad8'), [0.05, 0.2, 0]); return g; },
  diya: () => { const g = g0(); put(g, G.sph(0.08, 10, 6), lam(C.clay), [0, 0.06, 0], [0, 0, 0], [1.2, 0.5, 1]); put(g, G.cone(0.03, 0.09, 6), basic('#ffd84a'), [0, 0.13, 0]); return g; },
  wand: () => { const g = g0(); put(g, G.cyl(0.02, 0.02, 0.45, 6), lam('#1a1a1a'), [0, 0.2, 0]); put(g, G.cyl(0.022, 0.022, 0.06, 6), lam('#ffffff'), [0, 0.42, 0]); return g; },
  surfboard: () => { const g = g0(); put(g, G.sph(0.4, 10, 6), lam('#ff5a8a'), [0, 0.2, 0], [0, 0, 0], [0.35, 1.2, 0.06]); return g; },
  gun: () => { const g = g0(); put(g, G.box(0.1, 0.24, 0.2), lam('#3ab8ff'), [0, 0.1, 0.05]); put(g, G.cyl(0.03, 0.03, 0.3, 8), lam('#ffd23f'), [0, 0.2, 0.2], [Math.PI / 2, 0, 0]); return g; },
  paint: (o) => { const g = g0(); put(g, G.cyl(0.12, 0.1, 0.18, 12), lam(C.metal), [0, -0.15, 0]); put(g, G.disc(0.11, 12), lam(o.color || '#e83a8a'), [0, -0.059, 0], [-Math.PI / 2, 0, 0]); put(g, G.tor(0.1, 0.01, Math.PI, 8), lam(C.dark), [0, -0.03, 0]); return g; },
  puri: () => { const g = g0(); put(g, G.cyl(0.24, 0.18, 0.04, 16), lam('#3a9a4a'), [0, 0.04, 0]); for (let i = 0; i < 5; i++) put(g, G.sph(0.06, 8, 6), lam('#e8b86a'), [Math.cos(i * 1.25) * 0.12, 0.1, Math.sin(i * 1.25) * 0.12]); return g; },
  camera: () => { const g = g0(); put(g, G.box(0.3, 0.2, 0.14), lam(C.dark), [0, 0.12, 0]); put(g, G.cyl(0.07, 0.07, 0.12, 10), lam('#4a4a52'), [0, 0.12, 0.12], [Math.PI / 2, 0, 0]); return g; },
  rose: () => { const g = g0(); put(g, G.cyl(0.01, 0.01, 0.35, 5), lam(C.green), [0, 0.15, 0]); put(g, G.sph(0.06, 8, 6), lam('#e0203a'), [0, 0.34, 0]); return g; },
  pen: () => { const g = g0(); put(g, G.cyl(0.018, 0.018, 0.26, 6), lam(C.blue), [0, 0.1, 0]); return g; },
  wrenchkey: () => { const g = g0(); put(g, G.box(0.05, 0.36, 0.04), lam(C.metal), [0, 0.14, 0]); return g; },
};

export const FLOOR: Record<string, Make> = {
  stall: (o) => {
    const g = g0();
    put(g, G.box(1.5, 0.8, 0.6), lam(o.color || '#2f6a9a'), [0, 0.4, 0]);
    put(g, G.box(1.6, 0.06, 0.7), lam(C.woodL), [0, 0.83, 0]);
    for (const x of [-0.75, 0.75]) put(g, G.cyl(0.04, 0.04, 1.2, 6), lam(C.wood), [x, 1.4, -0.25]);
    for (let i = 0; i < 6; i++) put(g, G.box(0.28, 0.05, 0.9), lam(i % 2 ? '#ffffff' : o.alt || C.red), [-0.7 + i * 0.28, 2.0, 0.05], [0.3, 0, 0]);
    board(g, o.text || 'CHAI', 1.2, 0.32, [0, 0.45, 0.31], '#fff3c8', '#8a1a10');
    put(g, G.cyl(0.14, 0.14, 0.26, 10), lam(C.metal), [0.45, 0.99, 0]);
    for (let i = 0; i < 3; i++) put(g, G.cyl(0.05, 0.04, 0.09, 8), lam(C.clay), [-0.4 + i * 0.14, 0.9, 0.1]);
    return g;
  },
  podium: (o) => { const g = g0(); put(g, G.box(0.8, 1.05, 0.5), lam(o.color || '#6a3a1e'), [0, 0.52, 0]); put(g, G.box(0.9, 0.06, 0.6), lam(C.woodL), [0, 1.07, 0], [-0.15, 0, 0]); board(g, o.text || 'SPEECH', 0.64, 0.34, [0, 0.62, 0.26], '#fff3c8', '#2a1a10'); put(g, G.cyl(0.015, 0.015, 0.4, 6), lam(C.dark), [0.2, 1.25, 0.1], [0.4, 0, 0]); put(g, G.sph(0.05, 8, 6), lam(C.dark), [0.2, 1.43, 0.18]); return g; },
  table: (o) => { const g = g0(); put(g, G.box(1.0, 0.07, 0.7), lam(o.color || C.woodL), [0, 0.8, 0]); for (const [x, z] of [[-0.42, -0.28], [0.42, -0.28], [-0.42, 0.28], [0.42, 0.28]]) put(g, G.box(0.07, 0.8, 0.07), lam(C.wood), [x!, 0.4, z!]); return g; },
  chess: () => {
    const g = FLOOR.table!({});
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const x = c.getContext('2d')!;
    for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { x.fillStyle = (i + j) % 2 ? '#3a2a1e' : '#f2e6c8'; x.fillRect(i * 16, j * 16, 16, 16); }
    const t = new THREE.CanvasTexture(c);
    t.magFilter = THREE.NearestFilter;
    t.colorSpace = THREE.SRGBColorSpace;
    put(g, G.plane(0.6, 0.6), new THREE.MeshBasicMaterial({ map: t }), [0, 0.84, 0], [-Math.PI / 2, 0, 0]);
    for (let i = 0; i < 6; i++) {
      const w = i % 2 === 0;
      const p = group(g, [-0.22 + (i % 3) * 0.2, 0.84, w ? 0.18 : -0.18]);
      put(p, G.cyl(0.03, 0.05, 0.12, 8), lam(w ? '#f6f2e8' : '#1a1a1a'), [0, 0.06, 0]);
      put(p, G.sph(0.035, 8, 6), lam(w ? '#f6f2e8' : '#1a1a1a'), [0, 0.15, 0]);
    }
    return g;
  },
  stumps: () => { const g = g0(); for (const x of [-0.12, 0, 0.12]) put(g, G.cyl(0.025, 0.025, 0.72, 6), lam('#f2e6c8'), [x, 0.36, 0]); put(g, G.box(0.3, 0.03, 0.03), lam('#e8cf8a'), [0, 0.73, 0]); return g; },
  mat: (o) => { const g = g0(); put(g, G.box(0.8, 0.03, 1.6), lam(o.color || '#8a4ad8'), [0, 0.015, 0]); return g; },
  dhol: () => { const g = g0(); put(g, G.cyl(0.3, 0.3, 0.6, 14), lam('#c8231e'), [0, 0.5, 0], [0, 0, Math.PI / 2]); for (const s of [1, -1]) put(g, G.cyl(0.31, 0.31, 0.04, 14), lam(C.cream), [s * 0.3, 0.5, 0], [0, 0, Math.PI / 2]); for (let i = 0; i < 6; i++) put(g, G.box(0.6, 0.015, 0.015), lam(C.gold), [0, 0.5 + Math.sin(i) * 0.29, Math.cos(i) * 0.29]); put(g, G.cyl(0.03, 0.03, 0.25, 6), lam(C.wood), [0, 0.12, 0]); return g; },
  kart: (o) => { const g = g0(); put(g, G.box(0.9, 0.22, 1.5), lam(o.color || '#ff7a1a'), [0, 0.3, 0]); put(g, G.box(0.7, 0.32, 0.4), lam(C.dark), [0, 0.5, -0.35]); for (const [x, z, r] of [[-0.5, 0.5, 0.2], [0.5, 0.5, 0.2], [-0.52, -0.5, 0.26], [0.52, -0.5, 0.26]]) wheel(g, r!, 0.18, [x!, r!, z!]); put(g, G.cyl(0.02, 0.02, 0.3, 6), lam(C.dark), [0, 0.52, 0.3], [0.8, 0, 0]); put(g, G.tor(0.12, 0.02, Math.PI * 2, 12), lam(C.dark), [0, 0.64, 0.2], [0.8, 0, 0]); if (o.text) board(g, o.text, 0.5, 0.2, [0, 0.35, 0.76], '#ffffff', '#111'); return g; },
  bike: () => { const g = g0(); wheel(g, 0.34, 0.12, [0, 0.34, 0.6]); wheel(g, 0.34, 0.14, [0, 0.34, -0.6]); put(g, G.box(0.28, 0.3, 0.9), lam('#2a2a30'), [0, 0.62, 0]); put(g, G.sph(0.24, 10, 8), lam('#c8231e'), [0, 0.82, 0.18], [0, 0, 0], [0.9, 0.6, 1.3]); put(g, G.box(0.26, 0.08, 0.5), lam('#1a1a1a'), [0, 0.82, -0.3]); put(g, G.cyl(0.02, 0.02, 0.8, 6), lam(C.metal), [0, 1.02, 0.55], [0, 0, Math.PI / 2]); put(g, G.cyl(0.03, 0.03, 0.6, 6), lam(C.metal), [0, 0.7, 0.58], [0.3, 0, 0]); put(g, G.sph(0.09, 8, 6), lam('#ffe88a'), [0, 0.92, 0.72]); return g; },
  auto: () => { const g = g0(); put(g, G.box(1.2, 0.5, 1.8), lam('#2a8a3a'), [0, 0.55, 0]); put(g, G.box(1.24, 0.08, 1.9), lam('#ffd21a'), [0, 1.55, -0.05]); put(g, G.cyl(0.64, 0.64, 1.9, 12, true), lam('#1a1a1a'), [0, 1.2, -0.05], [Math.PI / 2, 0, 0], [1, 1, 0.55]); for (const x of [-0.58, 0.58]) put(g, G.box(0.05, 0.75, 0.05), lam('#1a1a1a'), [x, 1.15, 0.85]); put(g, G.box(1.16, 0.6, 0.04), basic('#bfe6ff', 0.4), [0, 1.15, 0.88], [0.15, 0, 0]); wheel(g, 0.24, 0.14, [0, 0.24, 1.0]); wheel(g, 0.24, 0.14, [-0.6, 0.24, -0.55]); wheel(g, 0.24, 0.14, [0.6, 0.24, -0.55]); put(g, G.sph(0.08, 8, 6), lam('#ffe88a'), [0, 0.7, 0.92]); return g; },
  tractor: () => { const g = g0(); put(g, G.box(0.9, 0.6, 1.6), lam('#c8231e'), [0, 0.8, 0.2]); put(g, G.box(0.8, 0.7, 0.7), lam('#c8231e'), [0, 1.4, -0.3]); wheel(g, 0.6, 0.3, [-0.6, 0.6, -0.4]); wheel(g, 0.6, 0.3, [0.6, 0.6, -0.4]); wheel(g, 0.32, 0.2, [-0.5, 0.32, 0.8]); wheel(g, 0.32, 0.2, [0.5, 0.32, 0.8]); put(g, G.cyl(0.05, 0.05, 0.6, 6), lam(C.dark), [0.3, 1.4, 0.8]); return g; },
  snowman: () => { const g = g0(); put(g, G.sph(0.42, 12, 10), lam('#ffffff', false), [0, 0.4, 0]); put(g, G.sph(0.3, 12, 10), lam('#ffffff', false), [0, 0.98, 0]); put(g, G.sph(0.22, 12, 10), lam('#ffffff', false), [0, 1.42, 0]); put(g, G.cone(0.04, 0.22, 8), lam('#ff7a1a'), [0, 1.42, 0.3], [Math.PI / 2, 0, 0]); for (const s of [1, -1]) put(g, G.sph(0.03, 6, 4), lam('#111'), [s * 0.08, 1.5, 0.19]); put(g, G.tor(0.22, 0.06, Math.PI * 2, 14), lam(C.red), [0, 1.24, 0], [Math.PI / 2, 0, 0]); return g; },
  tree: (o) => { const g = g0(); put(g, G.cyl(0.1, 0.14, 1.2, 8), lam(C.wood), [0, 0.6, 0]); put(g, G.dodec(0.7), lam(o.color || C.leaf), [0, 1.55, 0]); put(g, G.dodec(0.45), lam(o.color || '#6ac85a'), [0.35, 1.9, 0.2]); return g; },
  palm: () => { const g = g0(); for (let i = 0; i < 6; i++) put(g, G.cyl(0.1, 0.12, 0.35, 8), lam(i % 2 ? '#a87a4a' : '#8a5a32'), [i * 0.04, 0.18 + i * 0.33, 0], [0, 0, -0.12]); for (let i = 0; i < 6; i++) put(g, G.box(0.18, 0.03, 1.0), lam(C.leaf), [0.24 + Math.sin(i) * 0.3, 2.05, Math.cos(i) * 0.3], [-0.4, (i / 6) * Math.PI * 2, 0]); return g; },
  cactus: () => { const g = g0(); const m = lam('#4f9a45'); put(g, G.cap(0.18, 1.0), m, [0, 0.66, 0]); put(g, G.cap(0.1, 0.35), m, [0.28, 0.8, 0]); put(g, G.cap(0.1, 0.3), m, [-0.28, 0.95, 0]); return g; },
  rock: (o) => { const g = g0(); put(g, G.dodec(0.5), lam(o.color || '#c8703f'), [0, 0.3, 0], [0.4, 0.7, 0], [1, 0.7, 1]); return g; },
  pine: () => { const g = g0(); put(g, G.cyl(0.08, 0.1, 0.4, 6), lam(C.wood), [0, 0.2, 0]); for (let i = 0; i < 3; i++) put(g, G.cone(0.6 - i * 0.15, 0.7, 8), lam(i % 2 ? '#2a7a4a' : '#236a40'), [0, 0.6 + i * 0.42, 0]); put(g, G.cone(0.25, 0.25, 8), lam('#ffffff'), [0, 1.62, 0]); return g; },
  // seats are toy height: a sitting mascot's thighs rest at 0.2
  bench: () => { const g = g0(); put(g, G.box(1.9, 0.07, 0.6), lam(C.woodL), [0, 0.165, -0.1]); put(g, G.box(1.9, 0.5, 0.06), lam(C.woodL), [0, 0.55, -0.42], [-0.1, 0, 0]); for (const x of [-0.85, 0.85]) put(g, G.box(0.08, 0.2, 0.5), lam(C.dark), [x, 0.1, -0.1]); return g; },
  chair: (o) => { const g = g0(); put(g, G.box(0.66, 0.07, 0.6), lam(o.color || '#c8231e'), [0, 0.165, -0.1]); put(g, G.box(0.66, 0.8, 0.08), lam(o.color || '#c8231e'), [0, 0.55, -0.4]); for (const [x, z] of [[-0.28, -0.36], [0.28, -0.36], [-0.28, 0.16], [0.28, 0.16]]) put(g, G.cyl(0.03, 0.03, 0.14, 6), lam(C.gold), [x!, 0.07, z!]); return g; },
  charpai: () => { const g = g0(); put(g, G.box(1.1, 0.06, 2.0), lam('#e8cf8a'), [0, 0.2, 0]); for (const [x, z] of [[-0.52, -0.95], [0.52, -0.95], [-0.52, 0.95], [0.52, 0.95]]) put(g, G.cyl(0.05, 0.04, 0.2, 6), lam(C.wood), [x!, 0.1, z!]); return g; },
  tv: (o) => { const g = g0(); put(g, G.box(1.6, 1.0, 0.1), lam(C.dark), [0, 1.3, 0]); put(g, G.plane(1.46, 0.86), textMat(o.text || 'BREAKING', o.color || '#1a3a8a', '#ffffff', 512, 300), [0, 1.3, 0.052]); put(g, G.cyl(0.04, 0.04, 0.8, 6), lam(C.dark), [0, 0.4, 0]); put(g, G.cyl(0.3, 0.3, 0.04, 12), lam(C.dark), [0, 0.02, 0]); return g; },
  desk: (o) => { const g = g0(); put(g, G.box(1.4, 0.7, 0.6), lam(o.color || '#2a3a6a'), [0, 0.35, 0]); put(g, G.box(1.5, 0.05, 0.7), lam('#e8e4dc'), [0, 0.72, 0]); if (o.text) board(g, o.text, 1.0, 0.26, [0, 0.38, 0.31], '#e8e4dc', '#1a2a5a'); return g; },
  laptop: () => { const g = g0(); put(g, G.box(0.5, 0.03, 0.34), lam('#b8bcc4'), [0, 0.015, 0]); put(g, G.box(0.5, 0.34, 0.02), lam('#b8bcc4'), [0, 0.18, -0.17], [-0.2, 0, 0]); put(g, G.plane(0.44, 0.28), basic('#6ad0ff'), [0, 0.18, -0.155], [-0.2, 0, 0]); return g; },
  rocket: () => { const g = g0(); put(g, G.cyl(0.3, 0.3, 1.8, 14), lam('#f4f4f2'), [0, 1.2, 0]); put(g, G.cone(0.3, 0.6, 14), lam('#f08a2a'), [0, 2.4, 0]); for (let i = 0; i < 3; i++) put(g, G.box(0.04, 0.5, 0.4), lam('#138808'), [Math.cos((i * Math.PI * 2) / 3) * 0.32, 0.4, Math.sin((i * Math.PI * 2) / 3) * 0.32], [0, -(i * Math.PI * 2) / 3, 0]); put(g, G.cyl(0.2, 0.26, 0.3, 10), lam(C.dark), [0, 0.15, 0]); tricolour(g, 0.36, 0.24, [0, 1.4, 0.31]); return g; },
  cake: () => { const g = g0(); put(g, G.cyl(0.5, 0.5, 0.35, 18), lam('#ffd0e0', false), [0, 0.95, 0]); put(g, G.cyl(0.36, 0.36, 0.3, 18), lam('#fff4f8', false), [0, 1.28, 0]); for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; put(g, G.cyl(0.02, 0.02, 0.18, 6), lam('#6ad0ff'), [Math.cos(a) * 0.22, 1.52, Math.sin(a) * 0.22]); put(g, G.cone(0.025, 0.06, 6), basic('#ffd84a'), [Math.cos(a) * 0.22, 1.64, Math.sin(a) * 0.22]); } const t = FLOOR.table!({ color: '#ffffff' }); g.add(t); return g; },
  stove: () => { const g = g0(); put(g, G.box(0.9, 0.7, 0.6), lam('#6a6a72'), [0, 0.35, 0]); for (let i = 0; i < 5; i++) put(g, G.cone(0.08, 0.2, 6), basic(i % 2 ? '#ffb81a' : '#ff5a1a'), [-0.12 + i * 0.06, 0.8, (i % 2) * 0.05]); put(g, G.cyl(0.32, 0.26, 0.36, 14), lam('#3a3a3a'), [0, 0.98, 0]); put(g, G.disc(0.3, 14), lam('#c8702a'), [0, 1.15, 0], [-Math.PI / 2, 0, 0]); return g; },
  net: () => { const g = g0(); for (const x of [-1.6, 1.6]) put(g, G.cyl(0.04, 0.04, 1.5, 6), lam(C.metal), [x, 0.75, 0]); const n = put(g, G.plane(3.2, 0.6), basic('#ffffff', 0.45), [0, 1.2, 0]); (n.material as THREE.Material).side = THREE.DoubleSide; put(g, G.box(3.2, 0.05, 0.03), lam('#ffffff'), [0, 1.5, 0]); return g; },
  goal: () => { const g = g0(); for (const x of [-1.1, 1.1]) put(g, G.cyl(0.05, 0.05, 1.2, 6), lam('#ffffff'), [x, 0.6, 0]); put(g, G.cyl(0.05, 0.05, 2.25, 6), lam('#ffffff'), [0, 1.2, 0], [0, 0, Math.PI / 2]); const n = put(g, G.plane(2.2, 1.2), basic('#ffffff', 0.3), [0, 0.6, -0.4], [0.3, 0, 0]); (n.material as THREE.Material).side = THREE.DoubleSide; return g; },
  ropes: () => { const g = g0(); for (const [x, z] of [[-2.2, -1.4], [2.2, -1.4], [-2.2, 1.4], [2.2, 1.4]]) put(g, G.cyl(0.06, 0.06, 1.2, 8), lam(C.red), [x!, 0.6, z!]); for (const y of [0.55, 0.95]) { put(g, G.cyl(0.02, 0.02, 4.4, 6), lam('#ffffff'), [0, y, -1.4], [0, 0, Math.PI / 2]); for (const x of [-2.2, 2.2]) put(g, G.cyl(0.02, 0.02, 2.8, 6), lam('#ffffff'), [x, y, 0], [Math.PI / 2, 0, 0]); } return g; },
  ballotbox: () => { const g = g0(); put(g, G.box(0.6, 0.5, 0.5), lam('#8a8e98'), [0, 1.06, 0]); put(g, G.box(0.25, 0.02, 0.04), lam(C.dark), [0, 1.32, 0]); board(g, 'VOTE', 0.4, 0.16, [0, 1.06, 0.26], '#ffffff', '#1a2a8a'); const t = FLOOR.table!({ color: '#e8e4dc' }); g.add(t); return g; },
  snakes: () => {
    const g = g0();
    const c = document.createElement('canvas');
    c.width = c.height = 400;
    const x = c.getContext('2d')!;
    for (let i = 0; i < 10; i++) for (let j = 0; j < 10; j++) { x.fillStyle = ['#ffd23f', '#ff8a5a', '#8ad0ff', '#9ae07a'][(i + j) % 4]!; x.fillRect(i * 40, j * 40, 40, 40); }
    x.fillStyle = '#2a1a10';
    x.font = 'bold 14px sans-serif';
    for (let n = 1; n <= 100; n++) { const r = Math.floor((n - 1) / 10); const cI = r % 2 ? 9 - ((n - 1) % 10) : (n - 1) % 10; x.fillText(String(n), cI * 40 + 4, 400 - r * 40 - 26); }
    x.strokeStyle = '#8a5a32'; x.lineWidth = 8;
    x.beginPath(); x.moveTo(60, 360); x.lineTo(140, 120); x.moveTo(80, 370); x.lineTo(160, 130); x.stroke();
    x.strokeStyle = '#2a8a3a'; x.lineWidth = 12; x.lineCap = 'round';
    x.beginPath(); x.moveTo(300, 40); x.bezierCurveTo(200, 120, 360, 200, 260, 330); x.stroke();
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    put(g, G.plane(2.2, 2.2), new THREE.MeshBasicMaterial({ map: t }), [0, 0.015, 0], [-Math.PI / 2, 0, 0]);
    put(g, G.box(0.25, 0.25, 0.25), lam('#ffffff'), [0.7, 0.14, 0.9], [0.3, 0.5, 0]);
    return g;
  },
  blocks: () => { const g = g0(); const cols = ['#ff5a5a', '#ffd23f', '#3ab8ff', '#7ae05a', '#b88aff']; for (let i = 0; i < 9; i++) put(g, G.box(0.26, 0.26, 0.26), lam(cols[i % 5]!), [(i % 3) * 0.28 - 0.28 + (Math.floor(i / 3) % 2) * 0.12, 0.13 + Math.floor(i / 3) * 0.27, 0], [0, i * 0.3, 0]); return g; },
  train: () => {
    const g = g0();
    for (const z of [-0.4, 0.4]) put(g, G.box(4.4, 0.04, 0.08), lam(C.metal), [0, 0.04, z]);
    const eng = group(g, [0.9, 0, 0]);
    put(eng, G.box(1.6, 0.8, 0.9), lam('#f4f4f2'), [0, 0.6, 0]);
    put(eng, G.box(1.62, 0.18, 0.92), lam('#1a4aa8'), [0, 0.45, 0]);
    put(eng, G.sph(0.46, 12, 8), lam('#f4f4f2'), [0.8, 0.62, 0], [0, 0, 0], [1.2, 0.85, 1]);
    put(eng, G.box(0.3, 0.3, 0.8), basic('#1a2a4a'), [1.1, 0.8, 0], [0, 0, -0.5]);
    const coach = group(g, [-0.9, 0, 0]);
    put(coach, G.box(1.6, 0.8, 0.9), lam('#f4f4f2'), [0, 0.6, 0]);
    put(coach, G.box(1.62, 0.18, 0.92), lam('#1a4aa8'), [0, 0.45, 0]);
    for (let i = 0; i < 4; i++) put(coach, G.box(0.25, 0.2, 0.92), basic('#1a2a4a'), [-0.55 + i * 0.37, 0.75, 0]);
    return g;
  },
  boat: () => { const g = g0(); put(g, G.cyl(0.5, 0.3, 2.2, 10, false), lam('#2a6ad8'), [0, 0.3, 0], [Math.PI / 2, 0, 0], [1, 1, 0.5]); put(g, G.box(0.8, 0.06, 1.8), lam(C.woodL), [0, 0.48, 0]); put(g, G.cyl(0.03, 0.03, 1.6, 6), lam(C.wood), [0, 1.2, -0.2]); put(g, G.cone(0.6, 1.2, 3), lam('#f6f4ee'), [0.3, 1.3, -0.2], [0, 0, 0], [1, 1, 0.05]); return g; },
  tripod: () => { const g = g0(); for (let i = 0; i < 3; i++) put(g, G.cyl(0.02, 0.02, 1.3, 5), lam(C.dark), [Math.cos(i * 2.1) * 0.2, 0.62, Math.sin(i * 2.1) * 0.2], [Math.sin(i * 2.1) * 0.3, 0, -Math.cos(i * 2.1) * 0.3]); const cam = HELD.camera!({}); cam.position.y = 1.22; g.add(cam); return g; },
  mirror: () => { const g = g0(); put(g, G.box(0.9, 1.6, 0.06), lam(C.gold), [0, 1.0, 0]); put(g, G.plane(0.78, 1.46), new THREE.MeshLambertMaterial({ color: '#cfe8f6', emissive: '#4a6a80' }), [0, 1.0, 0.032]); put(g, G.box(0.5, 0.2, 0.3), lam(C.gold), [0, 0.1, 0]); return g; },
  flagpole: () => { const g = g0(); put(g, G.cyl(0.04, 0.05, 3.0, 8), lam('#e8e4dc'), [0, 1.5, 0]); put(g, G.sph(0.07, 8, 6), lam(C.gold), [0, 3.02, 0]); tricolour(g, 1.0, 0.66, [0.52, 2.6, 0]); put(g, G.cyl(0.3, 0.36, 0.2, 10), lam('#e8e4dc'), [0, 0.1, 0]); return g; },
  diyas: () => { const g = g0(); for (let i = 0; i < 7; i++) { const d = HELD.diya!({}); d.position.set(-1.2 + i * 0.4, 0, Math.sin(i) * 0.1); g.add(d); } return g; },
  sandcastle: () => { const g = g0(); const s = lam('#e8c88a'); put(g, G.box(1.1, 0.4, 0.8), s, [0, 0.2, 0]); for (const [x, z] of [[-0.5, -0.35], [0.5, -0.35], [-0.5, 0.35], [0.5, 0.35]]) { put(g, G.cyl(0.14, 0.16, 0.7, 8), s, [x!, 0.35, z!]); put(g, G.cone(0.16, 0.2, 8), s, [x!, 0.8, z!]); } put(g, G.cyl(0.26, 0.3, 0.4, 10), s, [0, 0.6, 0]); put(g, G.cyl(0.01, 0.01, 0.4, 5), lam(C.wood), [0, 1.0, 0]); put(g, G.box(0.2, 0.12, 0.01), lam(C.saffron), [0.1, 1.14, 0]); return g; },
  bridge: () => { const g = g0(); const s = lam('#e8c88a'); put(g, G.box(1.6, 0.12, 0.4), s, [0, 0.4, 0]); for (const x of [-0.6, 0, 0.6]) put(g, G.cyl(0.08, 0.1, 0.4, 8), s, [x, 0.2, 0]); put(g, G.cyl(0.01, 0.01, 0.4, 5), lam(C.wood), [0.7, 0.66, 0]); put(g, G.box(0.2, 0.12, 0.01), lam('#3ab8ff'), [0.8, 0.8, 0]); return g; },
  solar: () => { const g = g0(); put(g, G.box(1.4, 0.05, 0.9), lam('#1a2a6a'), [0, 0.8, 0], [-0.5, 0, 0]); for (let i = 1; i < 4; i++) put(g, G.box(0.02, 0.06, 0.9), lam('#b8bcc4'), [-0.7 + i * 0.35, 0.81, 0], [-0.5, 0, 0]); put(g, G.cyl(0.04, 0.04, 0.8, 6), lam(C.metal), [0, 0.4, 0]); return g; },
  wall: (o) => { const g = g0(); put(g, G.box(1.4, 1.4, 0.2), lam(o.color || C.saffron), [-0.7, 0.7, 0]); put(g, G.box(1.4, 1.4, 0.2), lam(o.alt || '#3a8ae8'), [0.7, 0.7, 0]); put(g, G.box(0.2, 1.4, 0.21), lam('#3a9a4a'), [0, 0.7, 0]); return g; },
  bush: () => { const g = g0(); put(g, G.dodec(0.45), lam('#3f9a4a'), [0, 0.35, 0]); put(g, G.dodec(0.35), lam('#4fae4a'), [0.35, 0.3, 0.1]); put(g, G.dodec(0.3), lam('#4fae4a'), [-0.35, 0.28, 0.05]); return g; },
  banner: (o) => { const g = g0(); for (const x of [-1.3, 1.3]) put(g, G.cyl(0.04, 0.04, 2.6, 6), lam(C.wood), [x, 1.3, 0]); board(g, o.text || '!', 2.5, 0.6, [0, 2.2, 0], o.color || '#fff3c8', o.alt || '#8a1a10'); return g; },
  sign: (o) => { const g = g0(); put(g, G.cyl(0.04, 0.04, 1.6, 6), lam(C.metal), [0, 0.8, 0]); board(g, o.text || '→', 0.9, 0.4, [0, 1.5, 0.05], o.color || '#1a6a3a', o.alt || '#ffffff'); return g; },
  mud: () => { const g = g0(); put(g, G.cyl(1.7, 1.7, 0.05, 20), lam('#6a4a2a'), [0, 0.02, 0]); return g; },
  sled: () => { const g = g0(); put(g, G.box(0.7, 0.08, 1.3), lam(C.red), [0, 0.2, 0]); for (const x of [-0.3, 0.3]) put(g, G.box(0.04, 0.04, 1.5), lam(C.metal), [x, 0.05, 0.05]); return g; },
  hoop: () => { const g = g0(); put(g, G.cyl(0.05, 0.05, 2.4, 6), lam(C.metal), [0, 1.2, 0]); put(g, G.box(1.0, 0.7, 0.05), lam('#ffffff'), [0, 2.5, 0]); put(g, G.tor(0.22, 0.02, Math.PI * 2, 14), lam('#ff5a1a'), [0, 2.25, 0.25], [Math.PI / 2, 0, 0]); return g; },
  target: () => { const g = g0(); ['#ffffff', '#1a1a1a', '#2a6ad8', '#d8242a', '#ffd23f'].forEach((c, i) => put(g, G.cyl(0.6 - i * 0.12, 0.6 - i * 0.12, 0.05 + i * 0.01, 20), lam(c), [0, 1.1, 0], [Math.PI / 2, 0, 0])); for (const x of [-0.3, 0.3]) put(g, G.cyl(0.03, 0.03, 1.2, 5), lam(C.wood), [x, 0.5, -0.1], [0.15, 0, 0]); return g; },
  crate: (o) => { const g = g0(); put(g, G.box(0.6, 0.5, 0.5), lam(o.color || C.woodL), [0, 0.25, 0]); return g; },
  gascyl: () => { const g = g0(); put(g, G.cap(0.24, 0.5), lam(C.red), [0, 0.5, 0]); put(g, G.cyl(0.08, 0.08, 0.12, 8), lam(C.metal), [0, 1.0, 0]); return g; },
  moon: () => { const g = g0(); put(g, G.sph(1.0, 20, 14), lam('#d8d4cc', false), [0, 0, 0]); for (const [x, y, z, r] of [[0.4, 0.3, 0.8, 0.2], [-0.3, -0.2, 0.9, 0.15], [0.1, -0.5, 0.8, 0.12]]) put(g, G.sph(r!, 8, 6), lam('#b8b4ac'), [x!, y!, z!]); return g; },
  earth: () => { const g = g0(); put(g, G.sph(0.5, 18, 12), lam('#3a8ae8', false), [0, 0, 0]); for (const [x, y, z] of [[0.2, 0.2, 0.4], [-0.25, -0.05, 0.42], [0.05, -0.3, 0.38]]) put(g, G.sph(0.16, 6, 4), lam(C.green), [x!, y!, z!], [0, 0, 0], [1, 0.6, 0.5]); return g; },
  kite: (o) => { const g = g0(); put(g, G.box(0.6, 0.6, 0.02), lam(o.color || '#e8392a'), [0, 0, 0], [0, 0, Math.PI / 4]); put(g, G.box(0.02, 0.82, 0.03), lam(C.wood), [0, 0, 0.02]); put(g, G.cone(0.1, 0.2, 3), lam(o.alt || '#ffd23f'), [0, -0.5, 0], [Math.PI, 0, 0]); return g; },
  cloud: () => { const g = g0(); const m = lam('#8a94a8', false); for (const [x, y, r] of [[0, 0, 0.5], [0.5, -0.1, 0.4], [-0.5, -0.1, 0.4], [0.2, 0.25, 0.35]]) put(g, G.sph(r!, 10, 8), m, [x!, y!, 0]); return g; },
  lamp: () => { const g = g0(); put(g, G.cyl(0.05, 0.06, 2.4, 6), lam(C.dark), [0, 1.2, 0]); put(g, G.box(0.5, 0.05, 0.05), lam(C.dark), [0.22, 2.38, 0]); put(g, G.sph(0.12, 8, 6), basic('#fff0b0'), [0.42, 2.3, 0]); return g; },
  column: () => { const g = g0(); put(g, G.cyl(0.24, 0.26, 2.6, 12), lam('#e8dcc4'), [0, 1.3, 0]); put(g, G.box(0.66, 0.16, 0.66), lam('#e8dcc4'), [0, 2.66, 0]); put(g, G.box(0.66, 0.16, 0.66), lam('#e8dcc4'), [0, 0.08, 0]); return g; },
  wheel: () => { const g = g0(); put(g, G.tor(1.1, 0.05, Math.PI * 2, 24), lam('#ff5a8a'), [0, 1.6, 0]); for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; put(g, G.cyl(0.02, 0.02, 1.1, 5), lam('#ffd23f'), [Math.cos(a) * 0.55, 1.6 + Math.sin(a) * 0.55, 0], [0, 0, a + Math.PI / 2]); put(g, G.box(0.24, 0.2, 0.24), lam(['#3ab8ff', '#7ae05a', '#ffd23f', '#ff5a5a'][i % 4]!), [Math.cos(a) * 1.1, 1.5 + Math.sin(a) * 1.1, 0]); } for (const s of [1, -1]) put(g, G.cyl(0.05, 0.05, 1.8, 6), lam(C.metal), [s * 0.45, 0.8, 0], [0, 0, s * 0.25]); return g; },
  confetti: () => { const g = g0(); const cols = ['#ff5a5a', '#ffd23f', '#3ab8ff', '#7ae05a', '#b88aff', '#ff9a1a']; for (let i = 0; i < 40; i++) put(g, G.box(0.08, 0.02, 0.05), basic(cols[i % 6]!), [Math.sin(i * 12.9) * 2.4, 1.2 + ((i * 0.37) % 2.6), Math.cos(i * 7.3) * 1.5], [i, i * 2, i * 3]); return g; },
  toyplane: () => { const g = g0(); put(g, G.cap(0.18, 0.9), lam('#f4f4f2'), [0, 0, 0], [0, 0, Math.PI / 2]); put(g, G.box(0.3, 0.03, 1.4), lam('#1a4aa8'), [0, 0, 0]); put(g, G.box(0.2, 0.3, 0.03), lam('#e8392a'), [-0.5, 0.18, 0]); return g; },
  fireworks: () => { const g = g0(); const cols = ['#ffd23f', '#ff5a8a', '#6ad0ff']; for (let k = 0; k < 3; k++) for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; put(g, G.box(0.25, 0.03, 0.03), basic(cols[k]!), [(k - 1) * 1.6 + Math.cos(a) * 0.3, 3.2 + (k % 2) * 0.4 + Math.sin(a) * 0.3, -1], [0, 0, a]); } return g; },
};
