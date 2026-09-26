import * as THREE from 'three';

/**
 * The girl, and her bicycle.
 *
 * A mamachari — the upright city bicycle everybody in Japan rides, step-
 * through frame, basket on the front — with a black cat in the basket. She
 * wears a white sailor blouse and a navy skirt and her hair is in a long
 * ponytail with a red ribbon in it.
 *
 * Her feet stay on the pedals: each leg is two bones solved every frame from
 * the hip to wherever the pedal has got to. The ponytail is a chain of
 * springs that trails behind her and swings out on the bends; the skirt and
 * the ribbon flutter with speed.
 */

const cache = new Map<string, THREE.MeshToonMaterial>();
let gradient: THREE.Texture | null = null;
export function toonGradient() {
  if (!gradient) {
    const data = new Uint8Array([90, 150, 205, 255]);
    const t = new THREE.DataTexture(data, 4, 1, THREE.RedFormat);
    t.minFilter = THREE.NearestFilter;
    t.magFilter = THREE.NearestFilter;
    t.generateMipmaps = false;
    t.needsUpdate = true;
    gradient = t;
  }
  return gradient;
}
function mat(color: string) {
  let m = cache.get(color);
  if (!m) {
    m = new THREE.MeshToonMaterial({ color, gradientMap: toonGradient() });
    cache.set(color, m);
  }
  return m;
}
function mesh(geo: THREE.BufferGeometry, color: string, shadow = true) {
  const m = new THREE.Mesh(geo, mat(color));
  m.castShadow = shadow;
  return m;
}

/** A cylinder from a to b, radius r. */
function limb(r: number, color: string) {
  const g = new THREE.CylinderGeometry(r, r * 0.9, 1, 8);
  g.translate(0, 0.5, 0);
  g.rotateX(Math.PI / 2);
  return mesh(g, color);
}
const Z = new THREE.Vector3();
function aim(m: THREE.Object3D, a: THREE.Vector3, b: THREE.Vector3) {
  m.position.copy(a);
  m.scale.set(1, 1, Math.max(0.001, a.distanceTo(b)));
  Z.copy(b);
  m.lookAt(m.parent ? m.parent.localToWorld(Z.clone()) : Z);
}

const BIKE = '#8fd3c2';
const SKIN = '#f6d6c0';
const HAIR = '#2a1f33';
const BLOUSE = '#f7f5f0';
const NAVY = '#26345e';
const RIBBON = '#d8283a';

export class Girl {
  root = new THREE.Group();
  private bike = new THREE.Group();
  private wheels: THREE.Group[] = [];
  private crank = new THREE.Group();
  private legs: { thigh: THREE.Mesh; shin: THREE.Mesh; shoe: THREE.Mesh; side: number }[] = [];
  private hair: THREE.Mesh[] = [];
  private hairPos: THREE.Vector3[] = [];
  private skirt!: THREE.Mesh;
  private ribbon: THREE.Mesh[] = [];
  private catTail: THREE.Mesh[] = [];
  private catHead!: THREE.Group;
  private body = new THREE.Group();
  lamp: THREE.SpotLight;
  lampGlow: THREE.Mesh;
  private wheelA = 0;

  constructor() {
    this.root.add(this.bike);
    // ── the bicycle
    const tube = (a: [number, number, number], b: [number, number, number], r = 0.022, color = BIKE) => {
      const m = limb(r, color);
      this.bike.add(m);
      aim(m, new THREE.Vector3(...a), new THREE.Vector3(...b));
      return m;
    };
    for (const z of [0.55, -0.55]) {
      const w = new THREE.Group();
      w.position.set(0, 0.33, z);
      const tyre = mesh(new THREE.TorusGeometry(0.325, 0.024, 8, 32), '#2a2a2e');
      tyre.rotation.y = Math.PI / 2;
      w.add(tyre);
      const rim = mesh(new THREE.TorusGeometry(0.3, 0.01, 6, 32), '#c8ccd0', false);
      rim.rotation.y = Math.PI / 2;
      w.add(rim);
      for (let k = 0; k < 12; k++) {
        const sp = mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.6, 3), '#d8dce0', false);
        sp.rotation.x = (k / 12) * Math.PI;
        w.add(sp);
      }
      // mudguard
      const guard = mesh(new THREE.TorusGeometry(0.36, 0.03, 4, 20, Math.PI * 0.7), BIKE);
      guard.rotation.y = Math.PI / 2;
      guard.rotation.x = z > 0 ? -0.2 : Math.PI * 0.35;
      guard.position.copy(w.position);
      this.bike.add(guard);
      this.bike.add(w);
      this.wheels.push(w);
    }
    // the step-through frame: head tube, the low swooping down tube, seat tube, stays
    tube([0, 0.98, -0.43], [0, 0.55, -0.25], 0.028);
    tube([0, 0.55, -0.25], [0, 0.3, 0.05], 0.028);
    tube([0, 0.3, 0.05], [0, 0.9, 0.28], 0.026);
    tube([0, 0.3, 0.05], [0, 0.33, 0.55], 0.018);
    tube([0, 0.9, 0.28], [0, 0.33, 0.55], 0.016);
    tube([0, 0.98, -0.43], [0, 0.33, -0.55], 0.02);
    tube([0, 1.0, -0.43], [0, 1.08, -0.38], 0.02, '#c8ccd0');
    tube([-0.3, 1.08, -0.36], [0.3, 1.08, -0.36], 0.016, '#c8ccd0');
    for (const s of [-1, 1]) tube([s * 0.3, 1.08, -0.36], [s * 0.34, 1.07, -0.3], 0.022, '#3a2a22');
    // the saddle, the rear carrier, the basket
    const saddle = mesh(new THREE.BoxGeometry(0.16, 0.05, 0.26), '#3a2a22');
    saddle.position.set(0, 0.93, 0.3);
    this.bike.add(saddle);
    const carrier = mesh(new THREE.BoxGeometry(0.16, 0.02, 0.36), '#c8ccd0');
    carrier.position.set(0, 0.72, 0.55);
    this.bike.add(carrier);
    const basket = mesh(new THREE.BoxGeometry(0.42, 0.26, 0.32), '#c8a064');
    basket.position.set(0, 1.0, -0.66);
    this.bike.add(basket);
    for (let k = 0; k < 5; k++) {
      const band = mesh(new THREE.BoxGeometry(0.43, 0.012, 0.33), '#a47c46', false);
      band.position.set(0, 0.9 + k * 0.05, -0.66);
      this.bike.add(band);
    }
    // the headlamp, which comes on at dusk
    this.lampGlow = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), new THREE.MeshBasicMaterial({ color: '#fff4d0' }));
    this.lampGlow.position.set(0, 0.84, -0.84);
    this.bike.add(this.lampGlow);
    this.lamp = new THREE.SpotLight('#fff0c8', 0, 40, 0.5, 0.6, 1.4);
    this.lamp.position.copy(this.lampGlow.position);
    this.lamp.target.position.set(0, 0, -12);
    this.bike.add(this.lamp, this.lamp.target);
    // the cranks
    this.crank.position.set(0, 0.3, 0.05);
    this.bike.add(this.crank);
    const ring = mesh(new THREE.TorusGeometry(0.09, 0.012, 6, 20), '#c8ccd0', false);
    ring.rotation.y = Math.PI / 2;
    ring.position.x = 0.06;
    this.crank.add(ring);
    for (const s of [-1, 1]) {
      const arm = mesh(new THREE.BoxGeometry(0.02, 0.17, 0.03), '#c8ccd0', false);
      arm.position.set(s * 0.09, s * 0.085, 0);
      this.crank.add(arm);
    }

    // ── the cat in the basket
    const cat = new THREE.Group();
    cat.position.set(0, 1.12, -0.66);
    this.bike.add(cat);
    const cb = mesh(new THREE.SphereGeometry(0.1, 12, 10), '#1c1a22');
    cb.scale.set(1, 0.8, 1.2);
    cat.add(cb);
    this.catHead = new THREE.Group();
    this.catHead.position.set(0, 0.12, -0.06);
    cat.add(this.catHead);
    this.catHead.add(mesh(new THREE.SphereGeometry(0.075, 12, 10), '#1c1a22'));
    for (const s of [-1, 1]) {
      const ear = mesh(new THREE.ConeGeometry(0.028, 0.06, 4), '#1c1a22');
      ear.position.set(s * 0.042, 0.07, 0);
      ear.rotation.z = -s * 0.25;
      this.catHead.add(ear);
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.013, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffd23a' }));
      eye.position.set(s * 0.027, 0.012, -0.066);
      this.catHead.add(eye);
    }
    const collar = mesh(new THREE.TorusGeometry(0.06, 0.009, 6, 16), RIBBON, false);
    collar.rotation.x = Math.PI / 2;
    collar.position.y = -0.05;
    this.catHead.add(collar);
    let prev: THREE.Object3D = cat;
    for (let k = 0; k < 5; k++) {
      const seg = mesh(new THREE.SphereGeometry(0.018 - k * 0.002, 6, 5), '#1c1a22', false);
      seg.position.set(0, k === 0 ? 0.02 : 0.035, k === 0 ? 0.12 : 0.02);
      prev.add(seg);
      this.catTail.push(seg);
      prev = seg;
    }

    // ── the girl
    this.root.add(this.body);
    this.body.position.set(0, 0.97, 0.3);
    const torso = mesh(new THREE.CapsuleGeometry(0.12, 0.26, 4, 10), BLOUSE);
    torso.position.set(0, 0.27, -0.1);
    torso.rotation.x = -0.45;
    this.body.add(torso);
    // the sailor collar and its red scarf
    const col = mesh(new THREE.BoxGeometry(0.3, 0.02, 0.16), NAVY);
    col.position.set(0, 0.45, -0.1);
    col.rotation.x = -0.9;
    this.body.add(col);
    const scarf = mesh(new THREE.ConeGeometry(0.05, 0.12, 4), RIBBON);
    scarf.position.set(0, 0.36, -0.27);
    scarf.rotation.x = Math.PI + 0.4;
    this.body.add(scarf);
    this.skirt = mesh(new THREE.CylinderGeometry(0.13, 0.31, 0.36, 16, 1, true), NAVY);
    (this.skirt.material as THREE.MeshToonMaterial).side = THREE.DoubleSide;
    this.skirt.position.set(0, 0.0, 0);
    this.body.add(this.skirt);
    // head, hair, and the long ponytail
    const head = new THREE.Group();
    head.position.set(0, 0.56, -0.2);
    this.body.add(head);
    head.add(mesh(new THREE.SphereGeometry(0.105, 16, 12), SKIN));
    const hairCap = mesh(new THREE.SphereGeometry(0.117, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.62), HAIR);
    hairCap.rotation.x = 0.35;
    hairCap.position.set(0, 0.01, 0.012);
    head.add(hairCap);
    const bangs = mesh(new THREE.BoxGeometry(0.19, 0.05, 0.05), HAIR);
    bangs.position.set(0, 0.06, -0.09);
    bangs.rotation.x = 0.3;
    head.add(bangs);
    for (let k = 0; k < 8; k++) {
      const seg = mesh(new THREE.SphereGeometry(0.058 - k * 0.0045, 10, 8), HAIR);
      seg.scale.set(0.85, 1, 1.9);
      this.root.add(seg);
      this.hair.push(seg);
      this.hairPos.push(new THREE.Vector3(0, 1.6 - k * 0.05, 0.4 + k * 0.08));
    }
    for (const s of [-1, 1]) {
      const bow = mesh(new THREE.BoxGeometry(0.1, 0.05, 0.02), RIBBON);
      bow.position.set(s * 0.05, 0.05, 0.11);
      bow.rotation.z = s * 0.4;
      head.add(bow);
      const tail = mesh(new THREE.BoxGeometry(0.03, 0.16, 0.01), RIBBON);
      tail.position.set(s * 0.03, -0.04, 0.13);
      head.add(tail);
      this.ribbon.push(tail);
    }
    // arms to the handlebar
    for (const s of [-1, 1]) {
      const upper = limb(0.035, BLOUSE);
      const fore = limb(0.028, SKIN);
      this.root.add(upper, fore);
      const sh = new THREE.Vector3(s * 0.15, 1.42, 0.12);
      const el = new THREE.Vector3(s * 0.25, 1.22, -0.1);
      const hand = new THREE.Vector3(s * 0.3, 1.09, -0.33);
      aim(upper, sh, el);
      aim(fore, el, hand);
    }
    // legs, solved each frame
    for (const s of [-1, 1]) {
      const thigh = limb(0.05, SKIN);
      const shin = limb(0.04, SKIN);
      const shoe = mesh(new THREE.BoxGeometry(0.07, 0.05, 0.16), '#6a3a24');
      const sock = mesh(new THREE.CylinderGeometry(0.043, 0.043, 0.1, 8), '#ffffff');
      sock.position.set(0, 0.06, 0.02);
      shoe.add(sock);
      this.root.add(thigh, shin, shoe);
      this.legs.push({ thigh, shin, shoe, side: s });
    }
  }

  private k = new THREE.Vector3();
  /**
   * Move everything that moves. `speed` in m/s, `turn` the rate of turning,
   * `wind` how hard the air is pushing back on her.
   */
  update(dt: number, t: number, speed: number, turn: number, slope: number) {
    this.root.updateMatrixWorld(true);
    this.wheelA += (speed * dt) / 0.33;
    for (const w of this.wheels) w.rotation.x = -this.wheelA;
    const crankA = -this.wheelA / 2.4;
    this.crank.rotation.x = crankA;
    // the legs: hip to pedal, knee out in front
    for (const L of this.legs) {
      // the same place the crank arm on that side has got to
      const pedal = new THREE.Vector3(L.side * 0.12, 0.3 + L.side * 0.17 * Math.cos(crankA), 0.05 + L.side * 0.17 * Math.sin(crankA));
      const hip = new THREE.Vector3(L.side * 0.08, 0.95, 0.3);
      const d = hip.distanceTo(pedal);
      const l1 = 0.4;
      const l2 = 0.42;
      const x = Math.min(d, l1 + l2 - 0.001);
      const along = (l1 * l1 - l2 * l2 + x * x) / (2 * x);
      const up = Math.sqrt(Math.max(0, l1 * l1 - along * along));
      const dir = pedal.clone().sub(hip).normalize();
      // bend the knee forward: perpendicular to the leg, in the y–z plane, towards −z
      const perp = new THREE.Vector3(0, dir.z, -dir.y);
      if (perp.z > 0) perp.negate();
      const knee = hip.clone().addScaledVector(dir, along).addScaledVector(perp, up);
      aim(L.thigh, hip, knee);
      aim(L.shin, knee, pedal);
      L.shoe.position.copy(pedal);
      L.shoe.position.z -= 0.03;
      L.shoe.rotation.x = 0.1;
    }
    // her weight: leaning into bends, rising a little on the climbs
    this.root.rotation.z = THREE.MathUtils.lerp(this.root.rotation.z, -turn * 4.5, Math.min(1, dt * 3));
    this.body.rotation.x = THREE.MathUtils.lerp(this.body.rotation.x, -0.08 - Math.max(0, slope) * 1.5 + Math.sin(t * 7) * 0.012 * Math.min(1, speed), Math.min(1, dt * 3));
    this.body.position.y = 0.97 + Math.abs(Math.sin(crankA)) * 0.012 * Math.min(1, speed / 3);
    // skirt and ribbons flutter with the wind of riding
    const wind = Math.min(1, speed / 7);
    this.skirt.rotation.x = 0.18 * wind + Math.sin(t * 13) * 0.03 * wind;
    this.skirt.scale.set(1 + Math.sin(t * 9) * 0.04 * wind, 1, 1 + 0.12 * wind);
    this.ribbon.forEach((r, i) => { r.rotation.x = 0.6 * wind + Math.sin(t * 17 + i) * 0.35 * wind; });
    // the ponytail: each bead follows the one before it, pushed back by the air
    const headW = this.k.set(0, 1.62, 0.2);
    let prev = headW;
    for (let i = 0; i < this.hair.length; i++) {
      const target = prev.clone().add(new THREE.Vector3(
        Math.sin(t * 5 + i * 0.8) * 0.018 * (1 + wind) + turn * 0.9 * i * 0.02,
        -0.05 + 0.025 * wind,
        0.028 + 0.02 * wind,
      ));
      this.hairPos[i]!.lerp(target, Math.min(1, dt * (14 - i)));
      const seg = this.hair[i]!;
      seg.position.copy(this.hairPos[i]!);
      seg.lookAt(this.root.localToWorld(prev.clone()));
      prev = this.hairPos[i]!;
    }
    // the cat looks about
    this.catHead.rotation.y = Math.sin(t * 0.6) * 0.6;
    this.catHead.rotation.x = Math.sin(t * 0.37) * 0.15;
    this.catTail.forEach((s, i) => { s.rotation.x = 0.5 + Math.sin(t * 2 + i * 0.6) * 0.3; });
  }

  setNight(n: number) {
    this.lamp.intensity = n * 9;
    (this.lampGlow.material as THREE.MeshBasicMaterial).color.setScalar(0.5 + n * 1.2);
  }
}
