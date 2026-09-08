import * as THREE from 'three';
import { PALETTES, painter, type Palette } from './paint';
import { bloom, ground, scatter, tuft, type Ground, type GroundOptions } from './forms';
import { block } from './forms';
import { boards, CATALOGUE, type Prop, type PropName, type Slot } from './props';
import { applyFog, cloudBank, makeRig } from './stage';

/**
 * A scene, written as data.
 *
 * Nothing here builds anything. A scene is a list of names, numbers and
 * positions, which means a story can be *checked* — that every prop it asks
 * for exists, that no scene is empty, that the camera is pointing at the set —
 * without a renderer, a canvas or a browser anywhere near it.
 */

export interface Placement {
  prop: PropName;
  /** Constructor arguments, passed straight through. */
  args?: (number | string | boolean)[];
  /** `[x, z]` sits it on the ground; `[x, y, z]` puts it exactly there. */
  at: [number, number] | [number, number, number];
  turn?: number;
  scale?: number;
  /** Sunk into the ground by this much, so a rock is bedded in rather than on. */
  sink?: number;
  /** If set, the prop can be looked at and this is what the reader is told. */
  look?: string;
}

/**
 * A room, for the scenes that are indoors.
 *
 * Three walls, a floor of boards and a ceiling, built as one thing.
 *
 * This exists because the alternative did not work. An interior written as a
 * ground disc plus one `wall` prop is not an interior: it is a flat standing
 * in a field, and the picture shows sky on three sides of it and the floor
 * ending in mid-air. A room has to enclose, and enclosing is a property of the
 * set rather than of any prop in it, so it belongs here.
 */
export interface RoomSpec {
  w: number;
  d: number;
  h: number;
  wall?: Slot;
  floor?: Slot;
  /** Off for a garret you are looking down into. */
  ceiling?: boolean;
  /** Leave the wall behind the camera open, which it always is. */
  seed?: number;
}

export interface SceneSpec {
  palette: keyof typeof PALETTES;
  /** Outdoors. One of `ground` or `room` — a scene is inside or it is not. */
  ground?: GroundOptions & { slot: Slot };
  room?: RoomSpec;
  /** A skin laid over the ground — turf on rock, a rug on boards. */
  cover?: GroundOptions & { slot: Slot };
  grass?: { count: number; radius: number; inner?: number; slot?: Slot };
  flowers?: { count: number; radius: number; inner?: number; slot?: Slot };
  water?: { y: number; radius: number };
  clouds?: boolean;
  props: Placement[];
  camera: { from: [number, number, number]; look: [number, number, number]; fov?: number };
  /** How far the camera drifts round the set, in radians. Zero is a still. */
  drift?: number;
}

export interface Built {
  root: THREE.Group;
  /** Meshes that can be looked at, with the line each one says. */
  targets: { object: THREE.Object3D; look: string; at: THREE.Vector3 }[];
  palette: Palette;
  ground: Ground;
  dispose: () => void;
}

/**
 * The shell of a room: floor, three walls, and a ceiling if it wants one.
 *
 * The fourth wall is left out, always. It is behind the camera, and building
 * it would only put a slab between the viewer and the set.
 *
 * The floor is real boards rather than a slab, because a plain rectangle at
 * this scale reads as cardboard, and the run of the boards is most of what
 * tells the eye how big the room is.
 */
function roomShell(r: RoomSpec): [Slot, THREE.BufferGeometry][] {
  const wallSlot = r.wall ?? 'stone';
  const floorSlot = r.floor ?? 'timber';
  const t = 0.24;
  const out: [Slot, THREE.BufferGeometry][] = [];

  const seed = r.seed ?? 3;
  const [floorPart] = boards(r.w, r.d, seed);
  out.push([floorSlot, floorPart.geometry]);

  const back = block(r.w + t * 2, r.h, t, 0.03);
  back.translate(0, r.h / 2, -r.d / 2 - t / 2);
  out.push([wallSlot, back]);

  for (const sx of [-1, 1]) {
    const side = block(t, r.h, r.d, 0.03);
    side.translate((sx * (r.w + t)) / 2, r.h / 2, 0);
    out.push([wallSlot, side]);
  }

  if (r.ceiling) {
    const cap = block(r.w + t * 2, t, r.d + t, 0.03);
    cap.translate(0, r.h + t / 2, 0);
    out.push([wallSlot, cap]);
  }

  return out;
}

const AT = (p: Placement, g: Ground, sink: number): THREE.Vector3 =>
  p.at.length === 3
    ? new THREE.Vector3(p.at[0], p.at[1], p.at[2])
    : new THREE.Vector3(p.at[0], g.heightAt(p.at[0], p.at[1]) - sink, p.at[1]);

/**
 * Turn a spec into a scene.
 *
 * Every material comes from the palette by slot, so a chair carved for one
 * story is the right colour in all four. Geometry is built here and disposed
 * on the way out — a reader who works through a story of nine scenes would
 * otherwise leave nine scenes' worth of buffers on the card.
 */
export function build(spec: SceneSpec): Built {
  const palette = PALETTES[spec.palette];
  const paintWith = painter(palette);
  const root = new THREE.Group();
  const owned: { dispose: () => void }[] = [];
  const targets: Built['targets'] = [];

  const mats: Partial<Record<Slot, THREE.Material>> = {};
  const materialFor = (slot: Slot): THREE.Material => {
    const have = mats[slot];
    if (have) return have;
    let m: THREE.Material;
    switch (slot) {
      case 'glow':
        // Pulled well towards white. A lit window painted in the accent at
        // full saturation reads as an orange rectangle cut out of the wall;
        // real light sources clip towards white at their centre, and that one
        // shift is the difference between a lamp and a sticker.
        m = new THREE.MeshBasicMaterial({
          color: new THREE.Color(palette.accent).lerp(new THREE.Color('#fffaf0'), 0.42),
          fog: false,
        });
        break;
      case 'water':
        m = paintWith(palette.water, { roughness: 0.3, rimStrength: 0.34, skyStrength: 0.2 });
        break;
      case 'grass':
        m = paintWith(palette.grass, { rimStrength: 0.12, skyStrength: 0.16 });
        break;
      case 'paper':
        m = paintWith('#efe6d2', { rimStrength: 0.24 });
        break;
      case 'dark':
        m = paintWith(palette.rockDark);
        break;
      case 'ground':
        m = paintWith(palette.ground);
        break;
      default:
        m = paintWith(palette[slot as keyof Palette] as string);
    }
    mats[slot] = m;
    owned.push(m);
    return m;
  };

  // --- the ground, or the room
  let surface: Ground;

  if (spec.room) {
    const r = spec.room;
    const parts = roomShell(r);
    for (const [slot, geometry] of parts) {
      owned.push(geometry);
      const mesh = new THREE.Mesh(geometry, materialFor(slot));
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      root.add(mesh);
    }
    // A room needs its own bounce.
    //
    // The rig's hemisphere light is the sky, and a room has no sky in it: seal
    // four surfaces around a set and every inward-facing wall drops to almost
    // nothing, which the painted material then tints hard towards the palette's
    // cool — so a sunlit workshop comes out navy. What is missing is the light
    // a real room gets off its own walls and floor, so put it back as one soft
    // source at head height in the middle of the room.
    const bounce = new THREE.PointLight(
      new THREE.Color(palette.warm).lerp(new THREE.Color(palette.skyBounce), 0.4),
      9,
      Math.max(r.w, r.d) * 2.6,
      1.15,
    );
    bounce.position.set(0, r.h * 0.62, r.d * 0.1);
    root.add(bounce);

    // A room's floor is flat, and everything standing on it stands at zero.
    surface = {
      geometry: parts[0][1],
      radius: Math.max(r.w, r.d) / 2,
      heightAt: () => 0,
      inside: (x, z, margin = 0) => Math.abs(x) < r.w / 2 - margin && Math.abs(z) < r.d / 2 - margin,
    };
  } else {
    const land = ground(9001, spec.ground ?? {});
    owned.push(land.geometry);
    const floor = new THREE.Mesh(land.geometry, materialFor(spec.ground?.slot ?? 'ground'));
    floor.receiveShadow = true;
    floor.castShadow = true;
    root.add(floor);
    surface = land;
  }

  if (spec.cover) {
    const skin = ground(9001, spec.cover);
    owned.push(skin.geometry);
    const m = new THREE.Mesh(skin.geometry, materialFor(spec.cover.slot));
    m.receiveShadow = true;
    m.castShadow = true;
    root.add(m);
    surface = skin;
  }

  // --- scatter
  if (spec.grass) {
    const g = tuft(0.44, 0.085);
    owned.push(g);
    const inner = spec.grass.inner ?? 0;
    const spots = scatter(4242, spec.grass.count, (r) => {
      const a = r() * Math.PI * 2;
      const d = inner + Math.sqrt(r()) * (spec.grass!.radius - inner);
      const x = Math.cos(a) * d;
      const z = Math.sin(a) * d;
      return { at: new THREE.Vector3(x, surface.heightAt(x, z) - 0.06, z), scale: 0.65 + r() * 0.85, lean: 0.5 };
    });
    if (spots.length) {
      const mesh = new THREE.InstancedMesh(g, materialFor(spec.grass.slot ?? 'grass'), spots.length);
      spots.forEach((m, i) => mesh.setMatrixAt(i, m));
      mesh.instanceMatrix.needsUpdate = true;
      mesh.castShadow = true;
      root.add(mesh);
    }
  }
  if (spec.flowers) {
    const g = bloom(0.1);
    owned.push(g);
    const inner = spec.flowers.inner ?? 0;
    const spots = scatter(777, spec.flowers.count, (r) => {
      const a = r() * Math.PI * 2;
      const d = inner + Math.sqrt(r()) * (spec.flowers!.radius - inner);
      const x = Math.cos(a) * d;
      const z = Math.sin(a) * d;
      return { at: new THREE.Vector3(x, surface.heightAt(x, z) + 0.14, z), scale: 0.7 + r() * 0.8 };
    });
    if (spots.length) {
      const mesh = new THREE.InstancedMesh(g, materialFor(spec.flowers.slot ?? 'paper'), spots.length);
      spots.forEach((m, i) => mesh.setMatrixAt(i, m));
      mesh.instanceMatrix.needsUpdate = true;
      root.add(mesh);
    }
  }

  // --- water
  if (spec.water) {
    const g = new THREE.CircleGeometry(spec.water.radius, 48);
    g.rotateX(-Math.PI / 2);
    owned.push(g);
    const m = new THREE.Mesh(g, materialFor('water'));
    m.position.y = spec.water.y;
    root.add(m);
  }

  // --- props
  for (const p of spec.props) {
    const make = CATALOGUE[p.prop] as (...a: unknown[]) => Prop;
    const parts = make(...((p.args ?? []) as unknown[]));
    const holder = new THREE.Group();
    holder.position.copy(AT(p, surface, p.sink ?? 0));
    holder.rotation.y = p.turn ?? 0;
    const k = p.scale ?? 1;
    holder.scale.set(k, k, k);

    for (const part of parts) {
      owned.push(part.geometry);
      const mesh = new THREE.Mesh(part.geometry, materialFor(part.slot));
      if (part.at) mesh.position.set(part.at[0], part.at[1], part.at[2]);
      if (part.turn) mesh.rotation.y = part.turn;
      if (!part.noShadow) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
      holder.add(mesh);
      // A lit part is a real light as well as a bright surface, or the lamp
      // glows and the room it is standing in stays dark.
      if (part.light) {
        const glow = new THREE.PointLight(new THREE.Color(palette.accent), 4.5, 9, 2);
        glow.position.copy(mesh.position);
        holder.add(glow);
      }
    }
    root.add(holder);
    if (p.look) {
      targets.push({ object: holder, look: p.look, at: holder.position.clone() });
    }
  }

  if (spec.clouds) root.add(cloudBank(palette, 7));

  return {
    root,
    targets,
    palette,
    ground: surface,
    dispose: () => {
      for (const o of owned) o.dispose();
    },
  };
}

/** The lights and the fog for a scene, applied to a scene object. */
export function dress(scene: THREE.Scene, spec: SceneSpec) {
  const palette = PALETTES[spec.palette];
  applyFog(scene, palette);
  const rig = makeRig(palette);
  scene.add(rig.group);
  return rig;
}

/** Everything a spec names has to exist, and be somewhere. */
export function checkScene(spec: SceneSpec, where: string): string[] {
  const bad: string[] = [];
  if (!PALETTES[spec.palette]) bad.push(`${where}: no palette "${spec.palette}"`);
  if (!spec.ground && !spec.room) bad.push(`${where}: has neither ground nor a room — it is standing on nothing`);
  if (spec.ground && spec.room) bad.push(`${where}: has both a ground and a room`);
  if (!spec.props.length && !spec.grass) bad.push(`${where}: nothing in it`);
  for (const p of spec.props) {
    if (!CATALOGUE[p.prop]) bad.push(`${where}: no prop "${p.prop}"`);
    if (!Number.isFinite(p.at[0])) bad.push(`${where}: ${p.prop} is nowhere`);
  }
  const from = new THREE.Vector3(...spec.camera.from);
  const look = new THREE.Vector3(...spec.camera.look);
  if (from.distanceTo(look) < 0.5) bad.push(`${where}: the camera is inside what it is looking at`);
  return bad;
}
