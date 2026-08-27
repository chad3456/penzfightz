import type { Beast, Blader } from './beasts';
import { DISH, callReady, type Bout, type Launch } from './physics';

/**
 * The computer, ripping.
 *
 * Two decisions, and it is the same two the player gets: which track to launch
 * onto, and how hard. Then one more during the round — when to call.
 *
 * The skill dial is the blader's own grade. It does not make the computer
 * cheat; it makes it *right more often*. A weak blader picks a track more or
 * less at random and rips at whatever comes; a strong one reads the matchup —
 * more stamina than you means it goes wide and waits, more attack means it
 * comes down the middle — and rips near the top of the meter. That is exactly
 * the reasoning a person does, which is the point: losing should feel like
 * being out-thought rather than out-numbered.
 */

export interface Plan {
  launch: Launch;
  /** How the computer will decide to call. */
  call: { mode: 'clock'; at: number } | { mode: 'close'; gap: number; after: number };
}

export function planLaunch(
  me: Beast,
  them: Beast,
  blader: Blader,
  rand: () => number,
): Plan {
  const skill = blader.grade;

  // What the matchup says. Positive means "I outlast them, so go wide and make
  // them come to me"; negative means "I hit harder, so go and find them".
  const patience = me.stamina + me.defence * 0.5 - (them.stamina + them.defence * 0.5);
  const menace = me.attack - them.attack;
  const read = patience * 0.65 - menace * 0.55;
  const ideal = Math.max(0, Math.min(1, 0.5 + read));

  // Skill is how much of that read actually reaches the hands.
  const noise = (1 - skill) * 0.85;
  const track = Math.max(0, Math.min(1, ideal + (rand() - 0.5) * 2 * noise));

  // Power: a strong blader rips near the top, a weak one is all over the meter.
  // Never a clean 1.0 — nobody hits the very top of the meter every time.
  const power = Math.max(0.25, Math.min(1, 0.55 + skill * 0.4 + (rand() - 0.5) * 2 * noise * 0.6));

  // Calling: the weak ones call on a stopwatch, more or less at random. The
  // strong ones wait until the other top is actually within reach, which is
  // when the charge will land instead of crossing an empty dish.
  const call: Plan['call'] =
    skill < 0.45
      ? { mode: 'clock', at: 4 + rand() * 12 }
      : {
          mode: 'close',
          gap: DISH.top * (5 + (1 - skill) * 9),
          // Late enough that the call is not wasted on the opening exchange.
          after: 3.5 + rand() * 3,
        };

  return { launch: { track, power }, call };
}

/** Should the computer call, this frame? */
export function shouldCall(bout: Bout, which: 0 | 1, plan: Plan): boolean {
  if (!callReady(bout, which)) return false;
  if (plan.call.mode === 'clock') return bout.t >= plan.call.at;
  if (bout.t < plan.call.after) return false;
  const me = bout.tops[which];
  const them = bout.tops[which === 0 ? 1 : 0];
  if (them.out || them.dead) return false;
  return Math.hypot(them.x - me.x, them.y - me.y) <= plan.call.gap;
}
