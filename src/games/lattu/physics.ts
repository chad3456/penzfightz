import type { Beast, Quirk } from './beasts';

/**
 * Two tops in a dish.
 *
 * This is a hand-written fixed-step simulation rather than a rigid-body engine,
 * for one reason: a real spinning top is a gyroscope, and the whole character of
 * the game is in the gyroscopic behaviour. Hand a physics engine two cylinders
 * and a bowl and you get two cylinders rolling into a bowl. What you want is the
 * thing everybody remembers — a top that races round the rim while it is turning
 * hard, drifts inward as it tires, and spirals into the middle to die.
 *
 * ## The one idea that makes it read
 *
 * The dish pulls a top toward the centre. A *spinning* top does not fall in; it
 * **precesses** — the pull comes out ninety degrees from where you would expect,
 * so the top circles instead of dropping. Modelled here in polar terms: the
 * spin drives a **tangential** speed, and Cartesian integration of that
 * tangential motion throws the top outward exactly as fast as the bowl pulls it
 * in. The two balance at a radius of `want·sqrt(R/BOWL)` — so a top turning hard
 * rides the outer wall, and as its spin runs down the orbit it can hold shrinks,
 * and it spirals into the middle to die. Nothing is scripted; the spiral is the
 * equilibrium moving.
 *
 * Two attempts came before this. Rotating the velocity by a fixed rate curls the
 * path into loops far tighter than the dish, so both tops sank to the centre in
 * a second and ground there for the rest of the round — measured, 80-90% of
 * every round spent inside the middle fifth of the dish and *zero* ring-outs in
 * eight hundred rounds. Adding a sideways force proportional to spin instead
 * accelerates the top forever.
 *
 * ## Why the tops find each other
 *
 * Two tops orbiting the same way at the same radius never meet — they were
 * launched from opposite sides and they stay opposite. So the radius a top holds
 * is **its own**: attack beasts ride a tight inner orbit, stamina beasts ride the
 * wall, and the player's launch shifts theirs further either way. Their paths
 * cross because they are different paths. It also means two rim-riders grind out
 * a long stamina round while two attackers hammer each other in the middle,
 * which is the right fight in both cases and is not special-cased anywhere.
 *
 * ## Spin against spin
 *
 * Every collision resolves twice: once along the contact normal, which is the
 * shove, and once along the tangent, which is the *grind*. The tangent term
 * compares the two rims' surface speeds. Two same-spin tops have rims travelling
 * the same way where they touch, so they slip past each other and lose very
 * little. Two **opposite-spin** tops have rims tearing against each other at the
 * sum of both speeds, which is why a left-spin top costs you half your spin to
 * touch. That is not a special case in the code; it falls out of subtracting two
 * signed numbers.
 *
 * ## Determinism
 *
 * Nothing here calls `Math.random`. The step is fixed, the only randomness comes
 * from a seeded generator, and a round is entirely determined by two launches
 * and a seed — which means a networked match needs to send two launches and a
 * seed, not sixty positions a second.
 */

// --------------------------------------------------------------- the numbers

export const DISH = {
  /** Radius of the playing surface, in dish units. Everything scales off this. */
  radius: 1,
  /**
   * Radius of a top.
   *
   * A sixth of the dish, which is roughly what a real top is in a real dish.
   * The first pass had it at half that and the two of them read as buttons in a
   * dinner plate — and, more to the point, they hardly ever touched.
   */
  top: 0.14,
} as const;

const STEP = 1 / 120;

/** How hard the bowl pulls a top toward the middle, per unit of radius. */
const BOWL = 4.6;
/**
 * Tangential speed a top drives itself round at, at full spin.
 *
 * Everything about where a top sits comes off this: the balance radius is
 * `want·sqrt(R/BOWL)`, which at 2.45 puts a fresh stamina type hard against the
 * wall and a top down to a third of its spin already in the middle. It has to
 * reach the wall — a top that never touches the rim can never be thrown over
 * it, and the first tuning pass had exactly zero outward rim speed in eight
 * hundred rounds.
 */
const ORBIT = 2.05;
/** How quickly a top settles back into its own orbit after being knocked off it. */
const DRIVE = 2.6;
/**
 * The widest orbit a top can hold on its own.
 *
 * The balance radius is `want·sqrt(R/BOWL)`, so this is the value that puts it
 * at 95% of the dish: close enough to the wall to be in danger, never touching
 * it unaided.
 */
const WANT_CAP = 0.95 * Math.sqrt(4.6);
/** Velocity lost to the floor, per second. Only the radial part; the orbit is driven. */
const DRAG = 0.5;
/** Spin the fastest possible rip puts into a top. */
const SPIN_MAX = 165;
/** Spin lost per second at rest, before the stamina stat is applied. */
const SPIN_DECAY = 4.6;
/**
 * Extra spin lost per second, per unit of ground speed.
 *
 * Almost nothing, and that is the point. Once orbiting is the normal state, a
 * meaningful value taxes exactly the rim-riding stamina tops it should reward —
 * they hold the fastest orbit of anybody. At 0.12 the tight track still beat the
 * wide one 100-0 in every mirror that never came to contact, purely on the
 * speeding fine. What the wide track actually costs you is that you cannot reach
 * anybody; what the tight track costs you is living where the attacker lives.
 * Those are the two prices, and neither of them belongs here.
 */
const SLIDE_DECAY = 0.05;
/** Bounce off the rim. */
const RIM_BOUNCE = 0.62;
/** Outward speed at the rim that gets you thrown out of the dish. */
const ESCAPE = 2.2;
/** Restitution between two tops. */
const REST = 0.74;
/** How much rim-speed mismatch turns into a sideways kick. */
const GRIND = 0.0042;
/** How much rim-speed mismatch costs in spin. */
const GRIND_SPIN = 0.052;
/** Seconds a called beast stays out. */
const CALL_TIME = 2.2;
/** Seconds before a beast may be called at all. */
const CALL_ARM = 3;
/** How fast a called beast crosses the dish at the other top. */
const CHARGE = 3.3;
/** How quickly it gets up to that speed. */
const CHARGE_DRIVE = 4.6;
/** Spin the call costs, all at once, when it ends. */
const CALL_COST = 9;
/** A round is not allowed to outlast anybody's patience. */
export const ROUND_SECONDS = 45;

// ---------------------------------------------------------------- the shapes

export interface Launch {
  /**
   * Which track to take, 0..1. Zero dives at the middle and starts the
   * argument immediately; one hugs the wall and waits. This is the only
   * decision in the game that lasts the whole round.
   */
  track: number;
  /** 0..1. Spin and entry speed both come off this. */
  power: number;
}

export interface Fighter {
  beast: Beast;
  quirk: Quirk;
  /** Which side of the dish they launch from. */
  side: 0 | 1;
}

export interface Top {
  x: number;
  y: number;
  /** The track this top was launched onto, 0..1. Biases the orbit it holds. */
  track: number;
  /** How hard it was ripped, 0..1. Biases how fast it goes round. */
  pace: number;
  vx: number;
  vy: number;
  /** Signed angular velocity. The sign is the spin direction. */
  spin: number;
  /** Accumulated rotation, for drawing. */
  angle: number;
  /** How far it is leaning over, 0..1. Rises as the spin runs out. */
  wobble: number;
  out: boolean;
  dead: boolean;
  /** Seconds of beast left, or 0. */
  calling: number;
  /** Whether the one call has been spent. */
  spent: boolean;
  /** Set for one step after a hard contact, for the renderer. */
  struck: number;
}

export interface Spark {
  x: number;
  y: number;
  /** 0..1 */
  power: number;
  /** Seconds left. */
  life: number;
  ink: string;
}

export type Finish = 'ring-out' | 'spin-out' | 'timeout' | 'draw';

export interface Outcome {
  /** 0, 1, or null for a draw. */
  winner: 0 | 1 | null;
  finish: Finish;
  /** 2 for a ring-out, 1 for anything else decisive, 0 for a draw. */
  points: number;
  at: number;
}

export interface Bout {
  tops: [Top, Top];
  fighters: [Fighter, Fighter];
  t: number;
  sparks: Spark[];
  outcome: Outcome | null;
  /** Camera shake, 0..1, decaying. */
  shake: number;
  /** Seeded, so a bout replays identically anywhere. */
  rand: () => number;
}

// -------------------------------------------------------------------- setup

/** Deterministic PRNG. A bout must replay the same on both machines. */
function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const has = (q: Quirk, want: Quirk) => (q === want ? 1 : 0);

export function startBout(
  fighters: [Fighter, Fighter],
  launches: [Launch, Launch],
  seed: number,
): Bout {
  const rand = mulberry(seed);
  const tops = [0, 1].map((i) => {
    const f = fighters[i as 0 | 1];
    const l = launches[i as 0 | 1];
    // Launched from opposite edges, a little inside the rim.
    const at = i === 0 ? Math.PI * 0.5 : -Math.PI * 0.5;
    const r = DISH.radius - DISH.top * 1.4;
    const x = Math.cos(at) * r;
    const y = Math.sin(at) * r;

    // Spin: the rip, plus whatever the blader's arm is worth, less what a
    // heavy top costs to get going.
    const power = l.power;
    const spinMag =
      SPIN_MAX * (0.52 + power * 0.48) * (1 + has(f.quirk, 'power') * 0.1) *
      (1 - f.beast.weight * 0.1);

    // Entry: fired inward, swung round toward the wall by however wide a track
    // was asked for, and always *with* the spin so a wide launch drops straight
    // into its orbit instead of fighting itself.
    let track = l.track;
    if (f.quirk === 'wild') track = Math.min(1, track * 1.1 + 0.12);
    if (f.quirk === 'dive') track *= 0.62;
    // Always leaned at least a little, and never fired hard. Entering dead at
    // the centre at full speed put the two launches into a head-on at better
    // than three metres a second, which ejected somebody outright: a fifth of
    // all measured rounds were over inside three seconds, before a viewer had
    // finished reading the names.
    const inward = Math.atan2(-y, -x);
    const dir = inward + (0.32 + track * 1.08) * f.beast.spin;
    const speed = (0.4 + power * 0.5) * (1 - f.beast.weight * 0.22);

    return {
      x, y,
      track,
      pace: power,
      vx: Math.cos(dir) * speed,
      vy: Math.sin(dir) * speed,
      spin: spinMag * f.beast.spin,
      angle: rand() * Math.PI * 2,
      wobble: 0,
      out: false,
      dead: false,
      calling: 0,
      spent: false,
      struck: 0,
    } satisfies Top;
  }) as [Top, Top];

  return { tops, fighters, t: 0, sparks: [], outcome: null, shake: 0, rand };
}

// ----------------------------------------------------------------- the step

const mass = (b: Beast) => 0.6 + b.weight * 0.9;
const spinNorm = (t: Top) => Math.min(1, Math.abs(t.spin) / SPIN_MAX);

/** Call the beast. Returns whether it took. */
export function callBeast(bout: Bout, which: 0 | 1): boolean {
  const top = bout.tops[which];
  const f = bout.fighters[which];
  const arm = CALL_ARM * (f.quirk === 'rally' ? 0.55 : 1);
  if (top.spent || top.out || top.dead || bout.t < arm) return false;
  top.spent = true;
  top.calling = CALL_TIME * (f.quirk === 'rally' ? 1.45 : 1);
  bout.shake = Math.min(1, bout.shake + 0.5);
  return true;
}

/** Whether the call is available yet, for the HUD. */
export function callReady(bout: Bout, which: 0 | 1): boolean {
  const f = bout.fighters[which];
  const arm = CALL_ARM * (f.quirk === 'rally' ? 0.55 : 1);
  return !bout.tops[which].spent && bout.t >= arm && !bout.outcome;
}

function stepOne(bout: Bout, i: 0 | 1, dt: number) {
  const top = bout.tops[i];
  const f = bout.fighters[i];
  if (top.out || top.dead) return;

  const r = Math.max(0.02, Math.hypot(top.x, top.y));
  const nx = top.x / r;
  const ny = top.y / r;
  // Tangential unit vector, taken in the top's own spin direction so "forward"
  // always means the way this top actually goes round.
  const dir = Math.sign(top.spin) || 1;
  const tx = -ny * dir;
  const ty = nx * dir;

  let vr = top.vx * nx + top.vy * ny;
  let vt = top.vx * tx + top.vy * ty;

  // --- the bowl: a pull toward the middle, growing with the slope
  vr -= BOWL * Math.min(1.25, r / DISH.radius) * dt;
  // --- friction, on the radial part only; the orbit is driven, not coasting
  vr *= Math.exp(-DRAG * dt);

  // --- precession: the spin drives the top round its own track.
  //
  // Which track is the beast's, not the dish's: an attacker cuts a tight inner
  // circle and a stamina type rides the wall, which is what makes their paths
  // cross at all. See the note at the top of the file.
  const b = f.beast;
  const lane = 0.8 + b.stamina * 0.32 - b.attack * 0.28 + (top.track - 0.5) * 0.34;
  // Pace: how fast it goes *round*, as opposed to how far out it sits.
  //
  // These have to be separate numbers. Drive the tangential speed by the lane
  // alone and the angular rate comes out `ORBIT·spin/sqrt(R/BOWL)` with the
  // lane cancelling exactly — every top in the game circles at the same rate,
  // and two launched from opposite sides stay opposite for the whole round.
  // Measured, that was a defence type and a stamina type never touching each
  // other once in thirty seconds. Weight breaks the tie: light tops lap heavy
  // ones, their paths cross, and there is a fight.
  const pace = (1.16 - b.weight * 0.42 + b.attack * 0.26) * (0.94 + top.pace * 0.12);
  // Capped so no top can orbit itself out of the dish. Nobody rings themselves
  // out; somebody has to hit you. It also stops the wide track being a trap —
  // before the cap, riding the wall meant scraping it, which cost spin every
  // second and made the widest launch strictly worse than the tightest in every
  // matchup that never came to contact.
  const want = Math.min(WANT_CAP, ORBIT * spinNorm(top) * lane * pace);
  vt += (want - vt) * (1 - Math.exp(-DRIVE * dt));

  top.vx = nx * vr + tx * vt;
  top.vy = ny * vr + ty * vt;

  // --- a called beast abandons its orbit and goes straight at the other top.
  //
  // It has to *replace* the orbit drive, not add to it. Layering a homing force
  // on top of a drive that is busy steering the top back round its own track
  // meant the beast reached its target in 21 of 144 matchups — so calling was
  // measurably worse than not calling, which is not what a finishing move is
  // for.
  if (top.calling > 0) {
    const o = bout.tops[i === 0 ? 1 : 0];
    if (!o.out && !o.dead) {
      const dx = o.x - top.x;
      const dy = o.y - top.y;
      const d = Math.hypot(dx, dy) || 1e-6;
      const k = 1 - Math.exp(-CHARGE_DRIVE * dt);
      top.vx += ((dx / d) * CHARGE - top.vx) * k;
      top.vy += ((dy / d) * CHARGE - top.vy) * k;
    }
  }

  // --- the call runs down
  if (top.calling > 0) {
    top.calling -= dt;
    if (top.calling <= 0) {
      top.calling = 0;
      // The bill for it, paid at the end rather than the start, so the call is
      // always worth making and never free.
      top.spin -= Math.sign(top.spin) * CALL_COST;
    }
  }

  top.x += top.vx * dt;
  top.y += top.vy * dt;

  // --- spin runs down: a base rate set by stamina, plus a price for moving
  const speed = Math.hypot(top.vx, top.vy);
  const endure = f.quirk === 'endure' ? 0.88 : 1;
  // The stamina spread is deliberately narrower than the stat suggests. At
  // (1.55 - stamina) a stamina beast outlived an attack beast by 2.3 to 1, which
  // is more than enough time to simply wait the attacker out — measured, the
  // stamina archetype won 69% and the attack archetype 34%. At 1.77 to 1 an
  // attacker still has to finish quickly, but it gets the chances to.
  const loss = (SPIN_DECAY * (1.35 - f.beast.stamina * 0.7) + SLIDE_DECAY * speed) * endure;
  const mag = Math.max(0, Math.abs(top.spin) - loss * dt);
  top.spin = mag * Math.sign(top.spin || 1);

  // A top does not stop dead; it leans further and further over first.
  top.wobble = Math.max(0, 1 - Math.abs(top.spin) / (SPIN_MAX * 0.34));
  top.angle += top.spin * dt;
  if (top.struck > 0) top.struck = Math.max(0, top.struck - dt);

  // --- the rim
  const rr = Math.hypot(top.x, top.y);
  if (rr > DISH.radius) {
    const ux = top.x / rr;
    const uy = top.y / rr;
    const out = top.vx * ux + top.vy * uy;
    if (out > ESCAPE) {
      top.out = true;
      bout.shake = 1;
      return;
    }
    top.x = ux * DISH.radius;
    top.y = uy * DISH.radius;
    top.vx -= (1 + RIM_BOUNCE) * out * ux;
    top.vy -= (1 + RIM_BOUNCE) * out * uy;
    // Scraping the wall costs spin.
    top.spin -= Math.sign(top.spin) * Math.min(Math.abs(top.spin), Math.abs(out) * 1.6);
  }

  if (Math.abs(top.spin) <= 0.5) {
    top.spin = 0;
    top.dead = true;
  }
}

function collide(bout: Bout, dt: number) {
  const [a, b] = bout.tops;
  if (a.out || a.dead || b.out || b.dead) return;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dist = Math.hypot(dx, dy);
  const min = DISH.top * 2;
  if (dist >= min || dist < 1e-6) return;

  const nx = dx / dist;
  const ny = dy / dist;
  const tx = -ny;
  const ty = nx;

  // Push them apart so the next step does not start inside each other.
  const push = (min - dist) / 2 + 1e-4;
  a.x -= nx * push;
  a.y -= ny * push;
  b.x += nx * push;
  b.y += ny * push;

  const fa = bout.fighters[0].beast;
  const fb = bout.fighters[1].beast;
  const ma = mass(fa);
  const mb = mass(fb);

  // --- the shove, along the normal
  const rvn = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
  if (rvn < 0) {
    const j = (-(1 + REST) * rvn) / (1 / ma + 1 / mb);
    // A called beast hits like something twice its size.
    const callA = a.calling > 0 ? 2.1 : 1;
    const callB = b.calling > 0 ? 2.1 : 1;
    const biteA = bout.fighters[0].quirk === 'bite' ? 1.2 : 1;
    const biteB = bout.fighters[1].quirk === 'bite' ? 1.2 : 1;
    // A called beast is braced as well as armed. Without this the call was
    // measurably *worse* than not calling — 37% against 50% over every pairing
    // — because homing drove you into a collision that threw you as hard as it
    // threw them, and then charged you thirteen spin for the privilege.
    const guardA = (bout.fighters[0].quirk === 'guard' ? 0.8 : 1) * (a.calling > 0 ? 0.45 : 1);
    const guardB = (bout.fighters[1].quirk === 'guard' ? 0.8 : 1) * (b.calling > 0 ? 0.45 : 1);
    // What you take is the other's attack over your own defence. It does not
    // conserve momentum and it is not meant to: an attack top putting a defence
    // top into the wall while barely moving itself is the entire fantasy.
    const takeA = ((1 + fb.attack * 1.7 * callB * biteB) / (1 + fa.defence * 0.95)) * guardA;
    const takeB = ((1 + fa.attack * 1.7 * callA * biteA) / (1 + fb.defence * 0.95)) * guardB;
    a.vx -= nx * (j / ma) * takeA;
    a.vy -= ny * (j / ma) * takeA;
    b.vx += nx * (j / mb) * takeB;
    b.vy += ny * (j / mb) * takeB;

    const force = Math.min(1, Math.abs(rvn) / 3.4);
    bout.shake = Math.min(1, bout.shake + force * 0.75);
    a.struck = 0.14;
    b.struck = 0.14;
    bout.sparks.push({
      x: a.x + nx * DISH.top,
      y: a.y + ny * DISH.top,
      power: force,
      life: 0.3 + force * 0.35,
      ink: (a.calling > 0 ? fa : b.calling > 0 ? fb : force > 0.5 ? fa : fb).ink,
    });
    if (bout.sparks.length > 40) bout.sparks.splice(0, bout.sparks.length - 40);
  }

  // --- the grind, along the tangent
  //
  // Surface speed of each rim where they touch. Same-spin tops slide past one
  // another; opposite-spin tops tear at the sum of both. No special case.
  const rimA = a.spin * DISH.top;
  const rimB = b.spin * DISH.top;
  const slip = rimA - rimB;
  const kick = slip * GRIND;
  a.vx -= tx * kick * (1 / ma);
  a.vy -= ty * kick * (1 / ma);
  b.vx += tx * kick * (1 / mb);
  b.vy += ty * kick * (1 / mb);

  const bite = Math.abs(slip) * GRIND_SPIN;
  const costA = (bite / (1 + fa.defence)) * (a.calling > 0 ? 0.55 : 1);
  const costB = (bite / (1 + fb.defence)) * (b.calling > 0 ? 0.55 : 1);
  a.spin -= Math.sign(a.spin) * Math.min(Math.abs(a.spin), costA);
  b.spin -= Math.sign(b.spin) * Math.min(Math.abs(b.spin), costB);
  void dt;
}

function judge(bout: Bout) {
  const [a, b] = bout.tops;
  const at = bout.t;
  if (a.out && b.out) bout.outcome = { winner: null, finish: 'ring-out', points: 0, at };
  else if (a.out) bout.outcome = { winner: 1, finish: 'ring-out', points: 2, at };
  else if (b.out) bout.outcome = { winner: 0, finish: 'ring-out', points: 2, at };
  else if (a.dead && b.dead) bout.outcome = { winner: null, finish: 'spin-out', points: 0, at };
  else if (a.dead) bout.outcome = { winner: 1, finish: 'spin-out', points: 1, at };
  else if (b.dead) bout.outcome = { winner: 0, finish: 'spin-out', points: 1, at };
  else if (bout.t >= ROUND_SECONDS) {
    // Nobody could finish it, so the one still turning hardest takes it.
    const da = Math.abs(a.spin);
    const db = Math.abs(b.spin);
    if (Math.abs(da - db) < 1) bout.outcome = { winner: null, finish: 'draw', points: 0, at };
    else bout.outcome = { winner: da > db ? 0 : 1, finish: 'timeout', points: 1, at };
  }
}

/**
 * Advance the bout by real time, in fixed steps.
 *
 * Fixed steps because the result has to be the same on a 60 Hz laptop and a
 * 144 Hz monitor — and, in a friend match, on both of them at once.
 */
export function advance(bout: Bout, seconds: number): Bout {
  if (bout.outcome) return bout;
  // A tab that has been in the background for a minute must not simulate a
  // minute of physics in one frame.
  let left = Math.min(seconds, 0.25);
  while (left > 1e-9 && !bout.outcome) {
    const dt = Math.min(STEP, left);
    left -= dt;
    bout.t += dt;
    stepOne(bout, 0, dt);
    stepOne(bout, 1, dt);
    collide(bout, dt);
    judge(bout);
  }
  bout.shake = Math.max(0, bout.shake - seconds * 2.6);
  for (const s of bout.sparks) s.life -= seconds;
  bout.sparks = bout.sparks.filter((s) => s.life > 0);
  return bout;
}

/** Spin left, 0..1, for the bars in the HUD. */
export const spinLeft = (t: Top): number => Math.min(1, Math.abs(t.spin) / SPIN_MAX);
