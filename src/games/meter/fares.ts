import * as THREE from 'three';
import type { World } from './world';

/**
 * The passengers.
 *
 * A fare is a pair of junctions, a clock, and somebody in the back seat with an
 * opinion about how you are driving. The opinion is the game: the money is
 * decided by the clock, and the *rating* — which is what unlocks the rest of
 * the map — is decided by whether they arrived in a state to recommend you.
 *
 * Comfort starts full and is spent. Every hard thing you do takes some of it,
 * and the springs upgrade decides how much reaches the back seat.
 */

export interface Passenger {
  name: string;
  /** Shown when they get in. */
  want: string;
  /** How much more than usual they mind being thrown about. */
  nerve: number;
  /** How much they mind being late. */
  hurry: number;
  /** What they say when it has gone well, and when it has not. */
  glad: string;
  cross: string;
}

const PEOPLE: Passenger[] = [
  {
    name: 'a clerk with a folder',
    want: 'The office. And I am already late, so.',
    nerve: 1.15,
    hurry: 1.4,
    glad: 'Well driven. I shall say so if anybody asks.',
    cross: 'I have lost two buttons and a form. Thank you.',
  },
  {
    name: 'a woman with a cake box',
    want: 'Carefully, please. It has writing on it.',
    nerve: 1.9,
    hurry: 0.6,
    glad: 'Not one letter smudged. Genuinely, thank you.',
    cross: 'It now says happy birt.',
    },
  {
    name: 'a boy going to an exam',
    want: 'Fast. Please. I will pay the fast amount.',
    nerve: 0.6,
    hurry: 1.9,
    glad: 'You are a legend and I will name a theorem after you.',
    cross: 'It started nine minutes ago. It is fine. It is fine.',
  },
  {
    name: 'an aunt with three bags',
    want: 'The station, and no cleverness on the way.',
    nerve: 1.7,
    hurry: 0.9,
    glad: 'Now that is how it is done. Take the change.',
    cross: 'I shall be telling your mother about this.',
  },
  {
    name: 'a man asleep already',
    want: 'Anywhere. Wake me at the end.',
    nerve: 0.4,
    hurry: 0.5,
    glad: 'Best sleep I have had all week.',
    cross: 'I woke up on the floor. Twice.',
  },
  {
    name: 'a bride’s brother',
    want: 'The hall, and we are the ones holding the garlands.',
    nerve: 1.2,
    hurry: 1.7,
    glad: 'You have saved a wedding. That is on your record now.',
    cross: 'They started without us. They actually started.',
  },
  {
    name: 'a doctor between wards',
    want: 'The hospital gate, and mind the speed bumps.',
    nerve: 1.3,
    hurry: 1.6,
    glad: 'Steady hands. I notice these things.',
    cross: 'I am a doctor and I would like to lie down.',
  },
  {
    name: 'a film crew runner',
    want: 'The unit, and go through anything you like.',
    nerve: 0.3,
    hurry: 1.5,
    glad: 'That was cinema. That was actual cinema.',
    cross: 'We can use this. Somehow we can use this.',
  },
  {
    name: 'a fish seller with a crate',
    want: 'The market, before this gets any more interesting.',
    nerve: 1.0,
    hurry: 1.2,
    glad: 'Still on ice. Still worth something. Good man.',
    cross: 'Everything in this car now smells of the sea.',
  },
  {
    name: 'a schoolteacher',
    want: 'The gate before the second bell, if you would.',
    nerve: 1.45,
    hurry: 1.3,
    glad: 'Punctual and civilised. Rare combination.',
    cross: 'I have marked you. It was not a high mark.',
  },
  {
    name: 'two students sharing',
    want: 'The far side of town and we are splitting it.',
    nerve: 0.7,
    hurry: 1.0,
    glad: 'Ten out of ten, would be flung about again.',
    cross: 'He was sick. Not me. Him.',
  },
  {
    name: 'a grandmother',
    want: 'My son’s house. Slowly. I have all evening.',
    nerve: 2.1,
    hurry: 0.35,
    glad: 'You drive like my husband did. That is a compliment.',
    cross: 'I have been in an accident and it was you.',
  },
];

export interface Fare {
  from: THREE.Vector2;
  to: THREE.Vector2;
  who: Passenger;
  /** Metres by road, which here is the L1 distance. */
  distance: number;
  /** Seconds allowed. */
  clock: number;
  /** What it pays before the tip. */
  base: number;
  comfort: number;
}

/**
 * Pick a fare.
 *
 * The drop-off is chosen at a distance from the pickup rather than at random,
 * because a random pair of junctions on a square map is usually a short hop and
 * occasionally a trek, and neither is a game. `reach` grows as the shift goes
 * on, so the fares get longer as the clock gets tighter.
 */
export function nextFare(world: World, from: THREE.Vector2, reach: number, r: () => number): Fare {
  const place = world.place;
  const nodes = world.nodes;
  const want = Math.max(place.pitch * 2.2, world.half * reach);
  let best: THREE.Vector2 | null = null;
  let bestScore = Infinity;
  for (let i = 0; i < 34; i++) {
    const n = nodes[Math.floor(r() * nodes.length) % nodes.length];
    const d = Math.abs(n.x - from.x) + Math.abs(n.y - from.y);
    const score = Math.abs(d - want);
    if (score < bestScore) {
      bestScore = score;
      best = n;
    }
  }
  const to = best ?? nodes[0];
  const distance = Math.abs(to.x - from.x) + Math.abs(to.y - from.y);
  const who = PEOPLE[Math.floor(r() * PEOPLE.length) % PEOPLE.length];
  // The clock assumes an average that is well under the top speed, because a
  // fare you can make by holding the throttle down is not a route, it is a
  // corridor. This average forces at least some cutting through.
  const pace = 15.5 / place.pressure;
  return {
    from: from.clone(),
    to,
    who,
    distance,
    clock: Math.max(22, distance / pace + 9),
    base: Math.round((26 + distance * 0.42) * place.purse),
    comfort: 1,
  };
}

/** What one starting junction should be: near the middle, so the first fare is fair. */
export function firstNode(world: World, r: () => number) {
  const mid = world.nodes.filter((n) => Math.abs(n.x) < world.half * 0.5 && Math.abs(n.y) < world.half * 0.5);
  const list = mid.length ? mid : world.nodes;
  return list[Math.floor(r() * list.length) % list.length];
}

export interface Comfort {
  /** Softens everything by this much. */
  springs: number;
  /** Smashing things costs less with a bull bar on. */
  armour: number;
}

/**
 * What the back seat notices.
 *
 * Four things, and they are weighted the way a passenger would weight them: a
 * wall is much worse than a bollard, sustained cornering is worse than one
 * flick, and being airborne is the worst of all because it is the only one they
 * cannot pretend they did not notice.
 */
export function spend(fare: Fare, who: Passenger, c: Comfort, e: {
  wall: number;
  prop: number;
  lateral: number;
  air: number;
  dt: number;
}) {
  const soft = c.springs * who.nerve;
  let cost = 0;
  cost += e.wall * 0.19 * soft;
  cost += e.prop * 0.035 * Math.max(0.15, 1 - c.armour) * soft;
  // Cornering only counts past the point where it stops feeling like driving
  // and starts feeling like being driven.
  cost += Math.max(0, e.lateral - 6.5) * 0.028 * e.dt * soft;
  cost += e.air * 0.5 * soft * e.dt;
  fare.comfort = Math.max(0, fare.comfort - cost);
}

/** Stars, out of five, and never a half. */
export function stars(comfort: number, late: number, who: Passenger): number {
  const punish = Math.max(0, late) * 0.055 * who.hurry;
  return Math.max(0, Math.min(5, Math.round((comfort - punish) * 5)));
}

/** The fare, plus what is left of the clock, plus what they thought of you. */
export function payout(fare: Fare, left: number, star: number, streak: number) {
  const speed = Math.round(fare.base * 0.55 * Math.min(1, left / Math.max(1, fare.clock * 0.5)));
  const tip = Math.round(fare.base * 0.3 * (star / 5) * (1 + streak * 0.14));
  return { base: fare.base, speed, tip, total: fare.base + speed + tip };
}

export { PEOPLE };
