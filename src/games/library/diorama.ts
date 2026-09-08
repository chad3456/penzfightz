import * as THREE from 'three';
import { build, dress, type Built, type SceneSpec } from './kit/scene';
import { makeFilm, type Film, type Rig } from './kit/stage';
import { PALETTES } from './kit/paint';

/**
 * The window the story is read through.
 *
 * Written against three directly rather than through the React renderer,
 * because the whole look lives in a post chain — a depth pass, a bokeh, a
 * grade — and a composer wants to own the frame. React's job here is the page
 * of prose beside it.
 *
 * Three things it has to get right, and they are the three things a reader
 * would notice if it did not:
 *
 * 1. **Changing scene must not leak.** A reading of fifteen nodes builds
 *    fifteen sets. Every one of them is disposed on the way out, geometry and
 *    materials both, or a long story ends as a slideshow.
 * 2. **The camera must move, and must arrive.** Each node names a viewpoint;
 *    the camera eases to it rather than cutting, and drifts slowly around it
 *    while the reader reads, so a still frame is never actually still.
 * 3. **Focus follows the subject.** The bokeh is focused on the distance from
 *    the camera to what it is looking at, re-measured every frame, so the
 *    softness stays where the eye is and does not swim during a move.
 */

const EASE = (t: number) => t * t * (3 - 2 * t);

interface Shot {
  from: THREE.Vector3;
  look: THREE.Vector3;
  fov: number;
  drift: number;
}

const shotOf = (spec: SceneSpec): Shot => ({
  from: new THREE.Vector3(...spec.camera.from),
  look: new THREE.Vector3(...spec.camera.look),
  fov: spec.camera.fov ?? 42,
  drift: spec.drift ?? 0.14,
});

export interface Look {
  /** What the prop says when it is looked at. */
  text: string;
  /** Where on the canvas it was, so the label can be pinned to it. */
  x: number;
  y: number;
}

export class Diorama {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;

  private film: Film | null = null;
  private rig: Rig | null = null;
  private built: Built | null = null;
  private spec: SceneSpec | null = null;

  /** The move between two viewpoints: where from, where to, how far through. */
  private shot: Shot | null = null;
  private prev: Shot | null = null;
  private blend = 1;
  private clock = new THREE.Clock();
  private t = 0;
  private size = new THREE.Vector2(1, 1);

  private hover: { look: string; at: THREE.Vector3 } | null = null;
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2(-2, -2);

  /** Set by the owner to be told what the pointer is over. */
  onLook: ((look: Look | null) => void) | null = null;

  constructor(canvas: HTMLCanvasElement, dpr = 1.5, depthOfField = true) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(dpr, window.devicePixelRatio || 1));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // The painted material tints as it shades, and ACES pulls the colour out of
    // exactly the mid-tones it tints. Neutral keeps the palette.
    this.renderer.toneMapping = THREE.NeutralToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 220);
    this.camera.position.set(0, 4, 10);

    this.wantDof = depthOfField;
  }

  private wantDof: boolean;

  // ------------------------------------------------------------------- scenes

  /**
   * Put a scene on the stage.
   *
   * If there was one already, the camera keeps its current position and eases
   * across to the new viewpoint, so moving through a story is a walk rather
   * than a series of cuts.
   */
  show(spec: SceneSpec, move = true) {
    const next = shotOf(spec);

    if (this.built) {
      this.scene.remove(this.built.root);
      this.built.dispose();
      this.built = null;
    }
    if (this.rig) {
      this.scene.remove(this.rig.group);
      this.rig = null;
    }

    this.spec = spec;
    this.renderer.toneMappingExposure = PALETTES[spec.palette].exposure;
    this.built = build(spec);
    this.scene.add(this.built.root);
    this.rig = dress(this.scene, spec);

    // The key light aims at what the camera is looking at, so the shadows fall
    // across the subject rather than off the side of the set.
    this.rig.key.target.position.copy(next.look);
    this.rig.key.target.updateMatrixWorld();

    this.prev = move && this.shot ? { ...this.shot, from: this.camera.position.clone() } : null;
    this.shot = next;
    this.blend = this.prev ? 0 : 1;
    if (!this.prev) {
      this.camera.position.copy(next.from);
      this.camera.lookAt(next.look);
      this.camera.fov = next.fov;
      this.camera.updateProjectionMatrix();
    }

    // The film is built once and kept; only the grade's two colours change
    // with the palette, and re-making the composer on every node would drop a
    // frame at exactly the moment the reader is looking for the new picture.
    if (!this.film) {
      this.film = makeFilm(this.renderer, this.scene, this.camera, PALETTES[spec.palette], this.wantDof);
      this.film.setSize(this.size.x, this.size.y);
    } else {
      const p = PALETTES[spec.palette];
      this.film.grade.uniforms.uLift.value = new THREE.Color(p.cool).multiplyScalar(0.55);
      this.film.grade.uniforms.uGain.value = new THREE.Color(p.warm);
    }
  }

  /** How many things in this scene can be looked at. */
  get lookables(): number {
    return this.built?.targets.length ?? 0;
  }

  // -------------------------------------------------------------------- input

  point(x: number, y: number) {
    this.pointer.set((x / this.size.x) * 2 - 1, -(y / this.size.y) * 2 + 1);
  }

  leave() {
    this.pointer.set(-2, -2);
  }

  /** What the pointer is over, if anything. Null if it is over the sky. */
  picked(): string | null {
    return this.hover?.look ?? null;
  }

  // -------------------------------------------------------------------- frame

  resize(w: number, h: number) {
    this.size.set(Math.max(1, w), Math.max(1, h));
    this.renderer.setSize(this.size.x, this.size.y, false);
    this.camera.aspect = this.size.x / this.size.y;
    this.camera.updateProjectionMatrix();
    this.film?.setSize(this.size.x, this.size.y);
  }

  frame() {
    const dt = Math.min(this.clock.getDelta(), 0.05);
    this.t += dt;
    const shot = this.shot;
    if (!shot) return;

    // --- the move, and the drift around wherever it lands
    if (this.blend < 1) this.blend = Math.min(1, this.blend + dt * 0.85);
    const k = EASE(this.blend);

    const sway = Math.sin(this.t * 0.19) * shot.drift;
    const rise = Math.sin(this.t * 0.13 + 1.1) * shot.drift * 0.5;

    const target = shot.from.clone().sub(shot.look);
    target.applyAxisAngle(new THREE.Vector3(0, 1, 0), sway);
    target.y += rise;
    target.add(shot.look);

    if (this.prev && this.blend < 1) {
      this.camera.position.lerpVectors(this.prev.from, target, k);
      this.camera.fov = THREE.MathUtils.lerp(this.prev.fov, shot.fov, k);
      this.camera.updateProjectionMatrix();
      const at = this.prev.look.clone().lerp(shot.look, k);
      this.camera.lookAt(at);
    } else {
      // A little inertia even when parked, so the drift never snaps.
      this.camera.position.lerp(target, 1 - Math.pow(0.001, dt));
      this.camera.lookAt(shot.look);
      if (Math.abs(this.camera.fov - shot.fov) > 0.01) {
        this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, shot.fov, 1 - Math.pow(0.01, dt));
        this.camera.updateProjectionMatrix();
      }
    }

    // --- focus on whatever the camera is actually looking at
    if (this.film) {
      const d = this.camera.position.distanceTo(this.hover?.at ?? shot.look);
      this.film.focus(d, 0.0014);
    }

    this.pick();
    if (this.film) this.film.composer.render(dt);
    else this.renderer.render(this.scene, this.camera);
  }

  /**
   * What is under the pointer.
   *
   * Only the props a scene marked `look` are candidates — raycasting the whole
   * set every frame would test nine hundred grass tufts to find a lamp.
   */
  private pick() {
    const built = this.built;
    if (!built || !built.targets.length || this.pointer.x < -1) {
      if (this.hover) {
        this.hover = null;
        this.onLook?.(null);
      }
      return;
    }
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const objects = built.targets.map((t) => t.object);
    const hit = this.raycaster.intersectObjects(objects, true)[0];
    if (!hit) {
      if (this.hover) {
        this.hover = null;
        this.onLook?.(null);
      }
      return;
    }
    // Walk back up to the holder the target list knows about.
    let o: THREE.Object3D | null = hit.object;
    while (o && !objects.includes(o)) o = o.parent;
    const found = built.targets.find((t) => t.object === o);
    if (!found) return;
    if (this.hover?.look === found.look) return;
    this.hover = { look: found.look, at: found.at };

    const p = found.at.clone().project(this.camera);
    this.onLook?.({
      text: found.look,
      x: ((p.x + 1) / 2) * this.size.x,
      y: ((-p.y + 1) / 2) * this.size.y,
    });
  }

  dispose() {
    this.built?.dispose();
    this.film?.dispose();
    this.renderer.dispose();
    this.scene.clear();
    void this.spec;
  }
}
