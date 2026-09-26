import * as THREE from 'three';

/**
 * The cars: chunky, toy-like, big wheels, bright. Built from boxes and
 * cylinders so they read from above at a glance — the silhouette of the
 * player's hot rod, the two-tone cruisers, and the low blue interceptor
 * with its long light bar are all different shapes, not just colours.
 *
 * The driver is one function. Swap it for a different model and nothing
 * else changes.
 */

const lam = (c: string, e?: string) => new THREE.MeshLambertMaterial({ color: c, flatShading: true, emissive: e || '#000000' });
const glowTex = (() => {
  let t: THREE.Texture | null = null;
  return () => {
    if (t) return t;
    const c = document.createElement('canvas');
    c.width = 64;
    c.height = 64;
    const g = c.getContext('2d')!;
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,1)');
    gr.addColorStop(0.3, 'rgba(255,255,255,0.6)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, 64, 64);
    t = new THREE.CanvasTexture(c);
    return t;
  };
})();

export interface CarRig {
  root: THREE.Group;
  body: THREE.Group;
  wheels: THREE.Object3D[];
  sirens: { mesh: THREE.Mesh; glow: THREE.Sprite; color: 'red' | 'blue' }[];
  smoke: THREE.Vector3;
  shadow: THREE.Mesh;
}

function wheel(r: number, w: number) {
  const g = new THREE.Group();
  const tyre = new THREE.Mesh(new THREE.CylinderGeometry(r, r, w, 12), lam('#23201e'));
  tyre.rotation.z = Math.PI / 2;
  g.add(tyre);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.45, r * 0.45, w + 0.02, 8), lam('#d8d2c8'));
  hub.rotation.z = Math.PI / 2;
  g.add(hub);
  return g;
}

function blobShadow(w: number, l: number) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, l), new THREE.MeshBasicMaterial({ map: glowTex(), color: '#000000', transparent: true, opacity: 0.4, depthWrite: false }));
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.04;
  return m;
}

function rig(): CarRig {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  return { root, body, wheels: [], sirens: [], smoke: new THREE.Vector3(0, 1.2, -1.4), shadow: blobShadow(3.4, 5) };
}

export type Driver = 'boss' | 'outlaw';

/**
 * The driver, seen mostly from above: a white-haired, white-bearded boss in
 * a saffron kurta and a sleeveless jacket, with round glasses — or a desert
 * outlaw in a hat and bandana. A caricature, kept to one function.
 */
function driver(kind: Driver) {
  const g = new THREE.Group();
  const skin = lam('#d9a57c');
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.42, 0.8, 10), lam(kind === 'boss' ? '#f2a03c' : '#6a4a8a'));
  torso.position.y = 0.4;
  g.add(torso);
  if (kind === 'boss') {
    const vest = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.44, 0.62, 10, 1, true, -2.2, 4.4), lam('#f4f0e6'));
    vest.position.y = 0.42;
    g.add(vest);
  }
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 14, 12), skin);
  head.position.y = 1.05;
  g.add(head);
  if (kind === 'boss') {
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.31, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.45), lam('#f4f4f2'));
    hair.position.y = 1.08;
    hair.rotation.x = -0.25;
    g.add(hair);
    const beard = new THREE.Mesh(new THREE.SphereGeometry(0.27, 12, 10, 0, Math.PI * 2, Math.PI * 0.45, Math.PI * 0.55), lam('#f4f4f2'));
    beard.position.set(0, 0.98, 0.07);
    g.add(beard);
    for (const s of [-1, 1]) {
      const lens = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.018, 6, 14), lam('#2a2a2a'));
      lens.position.set(s * 0.11, 1.1, 0.27);
      g.add(lens);
    }
  } else {
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.06, 16), lam('#6b4a2e'));
    brim.position.y = 1.25;
    g.add(brim);
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.3, 0.32, 12), lam('#6b4a2e'));
    crown.position.y = 1.42;
    g.add(crown);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.31, 0.2, 12, 1, true), lam('#d8342a'));
    band.position.set(0, 0.95, 0.02);
    g.add(band);
  }
  // arms out to the wheel
  for (const s of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.5, 3, 6), skin);
    arm.position.set(s * 0.32, 0.7, 0.35);
    arm.rotation.x = 1.2;
    g.add(arm);
  }
  return g;
}

/** The player's hot rod: open top, fat rear tyres, flame-orange, chrome pipes. */
export function playerCar(who: Driver): CarRig {
  const r = rig();
  const paint = lam('#ff7a1a');
  const dark = lam('#2a2a36');
  const chrome = lam('#e8e4dc');
  const base = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.7, 4.2), paint);
  base.position.y = 0.75;
  r.body.add(base);
  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.5, 1.6), paint);
  hood.position.set(0, 1.25, 1.1);
  r.body.add(hood);
  const grille = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.5, 0.2), chrome);
  grille.position.set(0, 0.95, 2.15);
  r.body.add(grille);
  // a yellow flash down the middle so it reads from any angle
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 4.22), lam('#ffe14a'));
  stripe.position.set(0, 1.12, 0);
  r.body.add(stripe);
  const seat = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.6, 0.4), dark);
  seat.position.set(0, 1.3, -0.9);
  r.body.add(seat);
  const d = driver(who);
  d.position.set(0, 0.95, -0.55);
  r.body.add(d);
  for (const s of [-1, 1]) {
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 1.4, 8), chrome);
    pipe.rotation.x = Math.PI / 2;
    pipe.position.set(s * 1.12, 0.7, -0.6);
    r.body.add(pipe);
  }
  for (const [x, z, rad, w] of [[-1.15, 1.35, 0.5, 0.45], [1.15, 1.35, 0.5, 0.45], [-1.2, -1.35, 0.62, 0.62], [1.2, -1.35, 0.62, 0.62]] as const) {
    const wh = wheel(rad, w);
    wh.position.set(x, rad, z);
    r.root.add(wh);
    r.wheels.push(wh);
  }
  r.smoke.set(0, 1.2, -2.1);
  r.root.add(r.shadow);
  return r;
}

function lightBar(r: CarRig, width: number, y: number, z: number) {
  const bar = new THREE.Mesh(new THREE.BoxGeometry(width, 0.18, 0.4), lam('#222'));
  bar.position.set(0, y, z);
  r.body.add(bar);
  for (const [s, color] of [[-1, 'red'], [1, 'blue']] as const) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(width / 2 - 0.08, 0.26, 0.42), new THREE.MeshBasicMaterial({ color: color === 'red' ? '#ff2a2a' : '#2a6aff' }));
    m.position.set((s * width) / 4, y + 0.05, z);
    r.body.add(m);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: color === 'red' ? '#ff3a2a' : '#3a7aff', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    glow.position.set((s * width) / 4, y + 0.3, z);
    glow.scale.set(3.2, 3.2, 1);
    r.body.add(glow);
    r.sirens.push({ mesh: m, glow, color });
  }
}

/** A cruiser: black and white, a proper roof, a light bar. */
export function policeCar(): CarRig {
  const r = rig();
  const white = lam('#f4f4f0');
  const black = lam('#1e2230');
  const base = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.75, 4.3), black);
  base.position.y = 0.75;
  r.body.add(base);
  const doors = new THREE.Mesh(new THREE.BoxGeometry(2.14, 0.55, 1.9), white);
  doors.position.set(0, 0.8, -0.1);
  r.body.add(doors);
  const cab = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.7, 2), white);
  cab.position.set(0, 1.45, -0.3);
  r.body.add(cab);
  const glass = new THREE.Mesh(new THREE.BoxGeometry(1.82, 0.45, 1.6), lam('#5a7a90'));
  glass.position.set(0, 1.45, -0.3);
  r.body.add(glass);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.12, 1.7), white);
  roof.position.set(0, 1.85, -0.3);
  r.body.add(roof);
  const bumper = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.35, 0.3), lam('#3a3a3a'));
  bumper.position.set(0, 0.55, 2.2);
  r.body.add(bumper);
  lightBar(r, 1.5, 2.0, -0.3);
  for (const [x, z] of [[-1.1, 1.4], [1.1, 1.4], [-1.1, -1.4], [1.1, -1.4]] as const) {
    const wh = wheel(0.5, 0.45);
    wh.position.set(x, 0.5, z);
    r.root.add(wh);
    r.wheels.push(wh);
  }
  r.smoke.set(0, 1.4, 1.4);
  r.root.add(r.shadow);
  return r;
}

/** The interceptor: low, long, dark blue, a neon stripe and a light bar the width of the car. */
export function interceptorCar(): CarRig {
  const r = rig();
  const navy = lam('#1c2a5a');
  const neon = lam('#2ae0ff', '#0a6a88');
  const base = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.6, 4.6), navy);
  base.position.y = 0.6;
  r.body.add(base);
  const nose = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.3, 1.2), navy);
  nose.position.set(0, 0.85, 1.6);
  nose.rotation.x = 0.18;
  r.body.add(nose);
  const cab = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.5, 1.8), lam('#3a4a6a'));
  cab.position.set(0, 1.15, -0.4);
  r.body.add(cab);
  for (const s of [-1, 1]) {
    const st = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.14, 4.4), neon);
    st.position.set(s * 1.02, 0.75, 0);
    r.body.add(st);
  }
  const spoiler = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.1, 0.5), navy);
  spoiler.position.set(0, 1.35, -2.1);
  r.body.add(spoiler);
  lightBar(r, 1.9, 1.5, -0.4);
  for (const [x, z] of [[-1.05, 1.5], [1.05, 1.5], [-1.05, -1.5], [1.05, -1.5]] as const) {
    const wh = wheel(0.45, 0.4);
    wh.position.set(x, 0.45, z);
    r.root.add(wh);
    r.wheels.push(wh);
  }
  r.smoke.set(0, 1.2, 1.2);
  r.root.add(r.shadow);
  return r;
}

/** Flash the sirens: red and blue in turns, faster when `urgent`. */
export function flashSirens(r: CarRig, t: number, phase: number, on = true) {
  const k = Math.floor(t * 7 + phase) % 2;
  for (const s of r.sirens) {
    const lit = on && ((s.color === 'red') === (k === 0));
    (s.mesh.material as THREE.MeshBasicMaterial).color.set(s.color === 'red' ? (lit ? '#ff3a2a' : '#5a1010') : (lit ? '#3a7aff' : '#10205a'));
    s.glow.visible = lit;
  }
}
