import * as THREE from 'three';

/**
 * The room the jelly is lit by, and the tray it lands on.
 */

export const GROUND = '#efedee';
/** Radius of the playable circle, in die-widths. */
export const TRAY_R = 3.9;
export const WALL_H = 6;

/**
 * A room built for soft highlights.
 *
 * Three.js ships `RoomEnvironment`, and against it a flat die face pointing at
 * one of its light panels mirrors the whole panel and prints as a white square
 * with the pips lost inside it. Jelly wants the opposite: light sources large
 * in solid angle and close to the same brightness as the walls, so the
 * highlight is broad and soft and never clips.
 */
function roomScene(): THREE.Scene {
  const scene = new THREE.Scene();

  const shell = new THREE.Mesh(
    new THREE.BoxGeometry(26, 16, 26),
    new THREE.MeshBasicMaterial({ side: THREE.BackSide }),
  );
  (shell.material as THREE.MeshBasicMaterial).color.setRGB(0.66, 0.65, 0.66);
  scene.add(shell);

  const panel = (w: number, h: number, rgb: [number, number, number], pos: [number, number, number], look: [number, number, number]) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial());
    (m.material as THREE.MeshBasicMaterial).color.setRGB(rgb[0], rgb[1], rgb[2]);
    m.position.set(...pos);
    m.lookAt(...look);
    scene.add(m);
  };

  // A wide, dim ceiling rather than a bright small one.
  panel(20, 20, [2.6, 2.55, 2.5], [0, 7.4, 0], [0, 0, 0]);
  // Two small bright ones on top of it. Without something in the environment
  // that varies, a refracting body has nothing to refract and comes out as a
  // flat coloured cube — the glints are what make it read as a solid lump of
  // something rather than as paint.
  panel(3.4, 3.4, [7.5, 7.4, 7.2], [-2.6, 6.6, 2.2], [0, 0, 0]);
  panel(2.2, 2.2, [5.5, 5.4, 5.6], [3.4, 6.2, -1.6], [0, 0, 0]);
  // Fills, to give the sides of a die something to pick up.
  panel(14, 9, [1.5, 1.5, 1.62], [-9, 2, 3], [0, 1, 0]);
  panel(14, 9, [1.15, 1.12, 1.1], [9, 2, -2], [0, 1, 0]);
  panel(18, 10, [1.32, 1.3, 1.3], [0, 1.5, 10], [0, 1, 0]);
  // Bounce off the table, which is what stops the underside going black.
  panel(20, 20, [0.95, 0.94, 0.94], [0, -3.4, 0], [0, 1, 0]);

  return scene;
}

/** Built once per renderer; the PMREM pass is not cheap and never changes. */
export function makeEnvironment(renderer: THREE.WebGLRenderer): THREE.Texture {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const scene = roomScene();
  const tex = pmrem.fromScene(scene, 0.05).texture;
  pmrem.dispose();
  scene.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.geometry) m.geometry.dispose();
    if (m.material) (m.material as THREE.Material).dispose();
  });
  return tex;
}

/** The area the floor texture is drawn for. */
export const FLOOR_SPAN = TRAY_R * 3.4;
/** The plane itself, which has to reach past the edge of any frame. */
export const GROUND_SPAN = 90;

/**
 * The floor and the tray, in one texture.
 *
 * Painted together rather than stacked as two planes: a translucent tray laid
 * over an opaque floor either z-fights or has to be offset, and once it is
 * offset the dice shadows land on the floor *under* the tray and come out
 * muddied. One opaque plane receives the shadows and carries the whole design.
 *
 * The tray is a gradient with no edge anywhere on it, because an edge reads as
 * a plate sitting on a table and what is wanted is a table that is slightly
 * dished.
 */
export function makeFloorTexture(rim: string): THREE.CanvasTexture {
  const S = 1024;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const g = c.getContext('2d')!;
  const mid = S / 2;
  /** The tray's radius in texture pixels. */
  const R = (S * TRAY_R) / FLOOR_SPAN;

  g.fillStyle = GROUND;
  g.fillRect(0, 0, S, S);

  const soft = g.createRadialGradient(mid, mid, R * 0.1, mid, mid, R);
  soft.addColorStop(0, 'rgba(255,255,255,0.62)');
  soft.addColorStop(0.62, 'rgba(255,255,255,0.42)');
  soft.addColorStop(0.94, 'rgba(255,255,255,0.12)');
  soft.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = soft;
  g.beginPath();
  g.arc(mid, mid, R, 0, Math.PI * 2);
  g.fill();

  g.strokeStyle = rim;
  g.lineWidth = Math.max(1.2, S * 0.0022);
  g.beginPath();
  g.arc(mid, mid, R * 0.985, 0, Math.PI * 2);
  g.stroke();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/**
 * The wall, as a ring of flat pieces.
 *
 * Rapier has no hollow cylinder, and a die that leaves the tray is gone for
 * good — it falls past the camera and the roll never resolves. Sixteen
 * segments is enough that nothing squeezes between two of them.
 */
export const WALL_SEGMENTS = 16;

export function wallPieces(): { pos: [number, number, number]; rot: [number, number, number]; half: [number, number, number] }[] {
  const out = [];
  const seg = (Math.PI * 2) / WALL_SEGMENTS;
  // Long enough to overlap its neighbours, so there is no gap at the joins.
  const halfWidth = Math.tan(seg / 2) * TRAY_R * 1.25;
  for (let i = 0; i < WALL_SEGMENTS; i++) {
    const a = i * seg;
    out.push({
      pos: [Math.cos(a) * TRAY_R, WALL_H / 2 - 1, Math.sin(a) * TRAY_R] as [number, number, number],
      rot: [0, -a, 0] as [number, number, number],
      half: [0.25, WALL_H / 2, halfWidth] as [number, number, number],
    });
  }
  return out;
}
