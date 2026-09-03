import * as THREE from 'three';
import type { Terrain } from './terrain';

/**
 * The pointer, in the world.
 *
 * Three parts, and the reason there are three is that an aerial camera makes
 * a flat cursor almost unreadable: a ring drawn on the ground at eight hundred
 * metres is a few pixels of outline against a busy picture, and you lose it the
 * moment you look away.
 *
 * - A **ring** on the ground, which says exactly what the brush covers.
 * - A **column of light** rising from it, which is what you actually track with
 *   your eye while panning, because it is vertical and nothing else is.
 * - A **cone** dropping into it from above, which gives the column a direction
 *   and reads as a thing pointing at a place rather than a thing standing in
 *   one.
 *
 * All three are additive and depth-tested but never depth-written, so they glow
 * through buildings without punching holes in them.
 */

export class Cursor {
  readonly group = new THREE.Group();
  private ring: THREE.Mesh;
  private beam: THREE.Mesh;
  private cone: THREE.Mesh;
  private line: THREE.Mesh;
  private colour = new THREE.Color(0xffc247);
  private u = {
    uColour: { value: new THREE.Color(0xffc247) },
    uTime: { value: 0 },
    uFade: { value: 1 },
  };

  /** The drag strip is coloured by whether the road is legal, so it gets its
   * own uniforms rather than sharing the cursor's. */
  private lineU = {
    uColour: { value: new THREE.Color(0x8effa4) },
    uTime: { value: 0 },
    uFade: { value: 1 },
  };

  constructor(private terrain: Terrain) {
    const glow = (extra: string, own = false, side: THREE.Side = THREE.DoubleSide) =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side,
        uniforms: own ? this.lineU : this.u,
        vertexShader: `
varying vec2 vUv;
varying vec3 vLocal;
void main() {
  vUv = uv;
  vLocal = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`,
        fragmentShader: `
uniform vec3 uColour;
uniform float uTime;
uniform float uFade;
varying vec2 vUv;
varying vec3 vLocal;
void main() {
  float a = 1.0;
${extra}
  gl_FragColor = vec4(uColour, a * uFade);
}`,
      });

    // Ring: a hairline with a pulse travelling round it.
    this.ring = new THREE.Mesh(
      new THREE.RingGeometry(0.9, 1, 72).rotateX(-Math.PI / 2),
      glow('  a = 0.75 + 0.5 * sin(vUv.x * 25.13 - uTime * 3.0);'),
    );

    // Beam: falls off with height and breathes.
    const beam = new THREE.CylinderGeometry(1, 1, 1, 20, 1, true);
    beam.translate(0, 0.5, 0);
    this.beam = new THREE.Mesh(beam, glow(`  a = pow(1.0 - vUv.y, 2.2) * (0.42 + 0.12 * sin(uTime * 4.0));
  a *= 0.55 + 0.45 * abs(sin(vUv.x * 3.1416));`));

    // Cone: brightest at the tip, faint at the mouth, with a rim.
    const cone = new THREE.ConeGeometry(1, 1, 40, 1, true);
    cone.translate(0, 0.5, 0);
    this.cone = new THREE.Mesh(cone, glow(`  float rim = smoothstep(0.0, 0.06, abs(fract(vUv.x * 12.0) - 0.5));
  a = pow(1.0 - vUv.y, 3.0) * 0.30 + (1.0 - rim) * 0.10 * (1.0 - vUv.y);`));

    // The drag preview, a flat strip the width of the road being laid.
    this.line = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2),
      glow(`  float e = min(vUv.x, 1.0 - vUv.x);
  a = (0.16 + 0.5 * step(fract(vUv.y * 18.0 - uTime * 1.5), 0.5)) * smoothstep(0.0, 0.04, e);`, true),
    );
    this.line.visible = false;

    for (const m of [this.ring, this.beam, this.cone, this.line]) {
      m.renderOrder = 6;
      m.frustumCulled = false;
    }
    this.group.add(this.ring, this.beam, this.cone, this.line);
    this.group.visible = false;
  }

  setColour(hex: number) {
    this.colour.setHex(hex);
    this.u.uColour.value.copy(this.colour);
  }

  hide() {
    this.group.visible = false;
  }

  /** Put the cursor at a world point, sized to the brush and the zoom. */
  show(p: THREE.Vector3, radius: number, distance: number) {
    this.group.visible = true;
    const y = this.terrain.height(p.x, p.z);
    const scale = Math.max(0.6, distance / 900);

    this.ring.position.set(p.x, y + 0.5, p.z);
    this.ring.scale.set(radius, 1, radius);

    const h = 120 * scale;
    this.beam.position.set(p.x, y, p.z);
    this.beam.scale.set(Math.max(1.4, radius * 0.10) * scale, h, Math.max(1.4, radius * 0.10) * scale);

    this.cone.position.set(p.x, y, p.z);
    this.cone.scale.set(radius * 0.85 + 12 * scale, h * 1.5, radius * 0.85 + 12 * scale);
  }

  /** The road being dragged, as a strip from a to b. */
  drag(a: THREE.Vector3 | null, b: THREE.Vector3 | null, half: number, ok: boolean) {
    if (!a || !b) {
      this.line.visible = false;
      return;
    }
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const len = Math.hypot(dx, dz);
    if (len < 1) {
      this.line.visible = false;
      return;
    }
    this.line.visible = true;
    this.line.position.set(
      (a.x + b.x) / 2,
      Math.max(this.terrain.height(a.x, a.z), this.terrain.height(b.x, b.z)) + 0.7,
      (a.z + b.z) / 2,
    );
    this.line.rotation.set(0, Math.atan2(dx, dz), 0);
    this.line.scale.set(half * 2, 1, len);
    this.lineU.uColour.value.setHex(ok ? 0x8effa4 : 0xff6a5a);
  }

  update(t: number) {
    this.u.uTime.value = t;
    this.lineU.uTime.value = t;
  }
}
