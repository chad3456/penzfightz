/**
 * What every plate shares: the plate record, the people in it (each with a
 * line about who they are, found by hovering in the gallery), and placing
 * people in an isometric scene.
 */
import { type G, type Iso, type Scene, type Pt } from './kit';
import { person, type Look, type Pose, type Joints, type Fig } from './people';
import { type Face } from './props';

export interface Who { x: number; y: number; r: number; name: string; line: string }
export interface Plate {
  key: string; title: string; place: string; blurb: string; w: number; h: number;
  /** paint the plate at 1:1 and record who is where */
  paint: (g: G, who: Who[]) => void;
}

/** Turn and back-view for someone looking along a world direction. */
export function facing(f: Face, turn = 0.55): { turn: number; back: boolean } {
  if (f === '+x') return { turn, back: false };
  if (f === '+y') return { turn: -turn, back: false };
  if (f === '-x') return { turn: -turn, back: true };
  return { turn, back: true };
}

export interface IP {
  look: Look; pose: Pose; face: Face; turn?: number; lw?: number; who?: [string, string];
  hold?: Fig['hold']; over?: Fig['over']; mood?: Fig['face']; eyes?: Fig['eyes']; depth?: number; rot?: number; scale?: number;
}
/** Put a person on the floor (or a seat at height z) of an isometric scene. */
export function ip(sc: Scene, I: Iso, who: Who[], x: number, y: number, z: number, o: IP) {
  const fz = facing(o.face, o.turn ?? 0.55);
  const [px, py] = I.p(x, y, z);
  const s = I.zs * 1.74 * (o.scale ?? 1);
  sc.add(o.depth ?? I.depth(x, y, z), () => {
    const J: Joints = person(sc.g!, { x: px, y: py, s, turn: fz.turn, back: fz.back, look: o.look, pose: o.pose, lw: o.lw, hold: o.hold, over: o.over, face: o.mood, eyes: o.eyes, rot: o.rot, anchor: o.pose.sit ? 'seat' : 'feet' });
    if (o.who) who.push({ x: J.H[0], y: (J.H[1] + J.P[1]) / 2, r: Math.max(26, s * 34), name: o.who[0], line: o.who[1] });
  });
}
export type { Pt };
