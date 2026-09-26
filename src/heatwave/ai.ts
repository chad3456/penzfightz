import { AI } from './config';
import { rayHit, type Shape, type Vehicle, wrap } from './physics';
import type { CarRig } from './cars';
import { D, W } from './arena';

/**
 * The police: aggressive, predictable, and slightly stupid — on purpose.
 *
 * They do not chase where the player is; they aim at where the player will
 * be, a fraction of a second of the player's velocity ahead, which is what
 * makes them cut corners and commit to lines the player can pull them off.
 * They look ahead with three feelers for the big obvious things — mesas,
 * buildings, rocks — but not for each other, not for fences or cacti, and
 * every so often not at all. They decide a few times a second rather than
 * every frame, so they overshoot. When they wedge themselves into something
 * they back out.
 */

export interface Cop {
  v: Vehicle;
  rig: CarRig;
  kind: 'cop' | 'interceptor';
  hull: number;
  maxHull: number;
  active: boolean;
  dead: boolean;
  deadT: number;
  think: number;
  goal: number;
  blind: boolean;
  stuckT: number;
  reverseT: number;
  lastContact: number;
  near: boolean;
  nearCool: number;
  phase: number;
  smokeT: number;
  px: number[];
}

export function drive(c: Cop, player: Vehicle, level: number, obstacles: Shape[], dt: number) {
  const v = c.v;
  c.think -= dt;
  if (c.reverseT > 0) {
    // backing out of whatever it drove into
    c.reverseT -= dt;
    v.throttle = -0.8;
    // in reverse the nose swings the other way, so steer the other way to point it at the goal
    v.steer = -Math.max(-1, Math.min(1, wrap(c.goal - v.h) * 2));
    return;
  }
  if (c.think <= 0) {
    c.think = AI.reaction * (0.7 + Math.random() * 0.6);
    c.blind = Math.random() < AI.blindness;
    const dx = player.x - v.x;
    const dz = player.z - v.z;
    const dist = Math.hypot(dx, dz);
    const lead = (c.kind === 'interceptor' ? AI.interceptorPrediction : AI.prediction[level - 1]!) * Math.min(1.3, Math.max(0.2, dist / 30));
    const tx = Math.max(-W / 2 + 4, Math.min(W / 2 - 4, player.x + player.vx * lead));
    const tz = Math.max(-D / 2 + 4, Math.min(D / 2 - 4, player.z + player.vz * lead));
    let goal = Math.atan2(tx - v.x, tz - v.z);
    // feelers for the obvious static things
    if (!c.blind) {
      const len = v.speed * AI.feelerTime + 5;
      let push = 0;
      for (const [off, w] of [[0, 1], [0.45, 0.6], [-0.45, 0.6]] as const) {
        const a = v.h + off;
        const fx = Math.sin(a);
        const fz = Math.cos(a);
        let near = Infinity;
        for (const s of obstacles) near = Math.min(near, rayHit(v.x, v.z, fx, fz, len, s));
        if (near < len) {
          const k = (1 - near / len) * w;
          // centre feeler: turn whichever way the goal already leans; side feelers: turn away from that side
          push += off === 0 ? Math.sign(wrap(goal - v.h) || 1) * k : -Math.sign(off) * k;
        }
      }
      goal += push * AI.avoidance;
    }
    c.goal = goal;
  }
  v.aim(c.goal, c.kind === 'interceptor' ? 3 : 2.2);
  // lift off to make a hairpin, otherwise flat out
  const off = Math.abs(wrap(c.goal - v.h));
  v.throttle = off > 2.1 && v.speed > 12 ? 0.25 : 1;
  // wedged: back out
  if (v.speed < 2.5) c.stuckT += dt; else c.stuckT = 0;
  if (c.stuckT > 1.1) {
    c.stuckT = 0;
    c.reverseT = 0.8;
  }
}
