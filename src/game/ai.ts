import { snapshot } from './snapshot';
import { getPen } from './pens';
import { HALF_W, HALF_D, FULL_POWER_TRAVEL } from './table';
import type { Side } from './store';

/**
 * The kid on the other side of the desk.
 *
 * The shot is planned the way a decent player actually plans it: pick the edge
 * you want their pen to go over, work backwards to the contact point, aim
 * through it, then scale the power to the distance. Everything that makes an
 * opponent beatable is layered on top as error — a nervous player's aim wobbles
 * and an over-eager one hits far too hard, which is exactly how it went in
 * class.
 */

export interface Opponent {
  id: string;
  name: string;
  penId: string;
  blurb: string;
  /** 0 loose .. 1 surgical. */
  accuracy: number;
  /** 0 taps it .. 1 tries to send it into the corridor. */
  aggression: number;
  /** How well they avoid taking their own pen over the edge. */
  caution: number;
  /** Seconds of "thinking" before the flick. */
  tempo: [number, number];
}

export const OPPONENTS: Opponent[] = [
  {
    id: 'bunty',
    name: 'Bunty',
    penId: 'reynolds045',
    blurb: 'back bench, same as you. plays fast and aims rough.',
    accuracy: 0.42,
    aggression: 0.75,
    caution: 0.25,
    tempo: [0.6, 1.2],
  },
  {
    id: 'chintu',
    name: 'Chintu',
    penId: 'cello_gripper',
    blurb: 'front bench. takes forever, then taps it perfectly.',
    accuracy: 0.58,
    aggression: 0.35,
    caution: 0.7,
    tempo: [1.4, 2.4],
  },
  {
    id: 'guddu',
    name: 'Guddu',
    penId: 'natraj_621',
    blurb: 'lost eleven pens this term. still bets his last one.',
    accuracy: 0.3,
    aggression: 0.95,
    caution: 0.1,
    tempo: [0.4, 0.8],
  },
  {
    id: 'pinky',
    name: 'Pinky',
    penId: 'linc_ocean',
    blurb: 'row three. quietly undefeated since the monsoon.',
    accuracy: 0.68,
    aggression: 0.5,
    caution: 0.6,
    tempo: [0.9, 1.7],
  },
  {
    id: 'rinku',
    name: 'Rinku',
    penId: 'pilot_v5',
    blurb: 'class monitor. plays only when sir steps out.',
    accuracy: 0.74,
    aggression: 0.6,
    caution: 0.65,
    tempo: [0.8, 1.5],
  },
  {
    id: 'sameer',
    name: 'Sameer',
    penId: 'addgel_chetak',
    blurb: 'brought a Chetak from the city. thinks he cannot lose.',
    accuracy: 0.8,
    aggression: 0.7,
    caution: 0.55,
    tempo: [0.7, 1.3],
  },
  {
    id: 'the_senior',
    name: 'The Senior',
    penId: 'reynolds_trimax',
    blurb: 'has a Trimax and a reputation. nobody has taken either.',
    accuracy: 0.92,
    aggression: 0.72,
    caution: 0.8,
    tempo: [1.0, 1.8],
  },
];

export const OPPONENT_BY_ID = Object.fromEntries(OPPONENTS.map((o) => [o.id, o]));

export interface PlannedShot {
  dx: number;
  dz: number;
  power: number;
  strike: number;
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

/** Gaussian-ish jitter without the tails that produce absurd shots. */
function jitter(scale: number) {
  return ((Math.random() + Math.random() + Math.random()) / 1.5 - 1) * scale;
}

/**
 * Which edge is the cheapest place to put their pen?
 * Nearest edge wins, but the far edge (behind them) is worth a small bonus
 * because a pen sent that way has the whole desk to slow down on — no, it does
 * not: it has the *least* desk. That is exactly why it is worth the bonus.
 */
function bestEdgeTarget(tx: number, tz: number, side: Side) {
  const candidates = [
    { x: HALF_W + 0.1, z: tz, d: HALF_W - tx },
    { x: -HALF_W - 0.1, z: tz, d: HALF_W + tx },
    { x: tx, z: HALF_D + 0.1, d: HALF_D - tz },
    { x: tx, z: -HALF_D - 0.1, d: HALF_D + tz },
  ];
  // Prefer pushing them away from us: sending a pen back over our own edge
  // means it travels across the whole desk and usually stops short.
  const awaySign = side === 'guest' ? 1 : -1;
  for (const c of candidates) {
    if (Math.sign(c.z - tz) === awaySign && c.x === tx) c.d *= 0.62;
  }
  candidates.sort((a, b) => a.d - b.d);
  return candidates[0];
}

export function planShot(side: Side, opp: Opponent, penId: string): PlannedShot {
  const me = snapshot[side];
  const them = snapshot[side === 'host' ? 'guest' : 'host'];
  const spec = getPen(penId);

  // 1. Where do we want their pen to end up?
  const edge = bestEdgeTarget(them.x, them.z, side);
  const exitLen = Math.hypot(edge.x - them.x, edge.z - them.z) || 1;
  const ex = (edge.x - them.x) / exitLen;
  const ez = (edge.z - them.z) / exitLen;

  // 2. Back off from their pen along that line to find the contact point.
  const contact = spec.radius + 0.03;
  const gx = them.x - ex * contact;
  const gz = them.z - ez * contact;

  // 3. Aim through it.
  let ax = gx - me.x;
  let az = gz - me.z;
  const dist = Math.hypot(ax, az) || 1;
  ax /= dist;
  az /= dist;

  // 4. Error. A loose player misses by a lot, and misses more from far away.
  const skill = clamp(opp.accuracy, 0, 1);
  const angErr = jitter((1 - skill) * 0.34 * (0.6 + dist));
  const ca = Math.cos(angErr);
  const sa = Math.sin(angErr);
  const dx = ax * ca - az * sa;
  const dz = ax * sa + az * ca;

  // 5. Power. Slide distance goes as power^2, so invert that to get the draw
  //    that just reaches them, then add enough to actually shove — more if this
  //    kid enjoys hitting things, which most of them do.
  const reach = Math.sqrt(clamp(dist, 0.02, FULL_POWER_TRAVEL) / FULL_POWER_TRAVEL);
  const shove = 0.1 + 0.26 * opp.aggression;
  let power = clamp(reach + shove + jitter((1 - skill) * 0.24), 0.14, 1);

  // 6. Do not follow your own pen off the desk. If we are close to an edge and
  //    firing at it, ease off — a cautious player has learned this the hard way.
  const myEdgeGap = Math.min(HALF_W - Math.abs(me.x), HALF_D - Math.abs(me.z));
  const towardMyEdge =
    (Math.abs(me.x) > Math.abs(me.z) ? Math.sign(me.x) * dx : Math.sign(me.z) * dz) > 0.4;
  if (towardMyEdge && myEdgeGap < 0.16) {
    power *= 1 - 0.45 * opp.caution;
  }

  // 7. Strike point. Skilled players hit the middle of the barrel for a clean
  //    push; sloppy ones catch the nib and spin out.
  const strike = jitter((1 - skill) * 0.85);

  power = clamp(power, 0.1, 1);

  return { dx, dz, power, strike: clamp(strike, -0.85, 0.85) };
}

export function thinkTime(opp: Opponent) {
  const [a, b] = opp.tempo;
  return (a + Math.random() * (b - a)) * 1000;
}
