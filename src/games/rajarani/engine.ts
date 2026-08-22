/**
 * Raja Rani Chor Police.
 *
 * Four chits, folded and thrown into the middle of the bench. Everyone grabs
 * one and keeps it hidden. The Police stands up and has to point at the Chor
 * out of the other three — with nothing to go on but a face trying too hard to
 * look innocent.
 *
 * Scoring is the version we played: Raja is worth the most for doing nothing at
 * all, which was always the joke. The Police only banks its points by guessing
 * right; get it wrong and the Chor takes them instead, which is why a good Chor
 * looked delighted either way.
 */

export type Role = 'raja' | 'rani' | 'police' | 'chor';

export const ROLE_ORDER: Role[] = ['raja', 'rani', 'police', 'chor'];

export const ROLE_LABEL: Record<Role, string> = {
  raja: 'Raja',
  rani: 'Rani',
  police: 'Police',
  chor: 'Chor',
};

export const ROLE_NOTE: Record<Role, string> = {
  raja: 'The king. Sits there. Collects the most points. Nobody has ever explained it.',
  rani: 'The queen. Also safe, and quietly worth having.',
  police: 'You have one guess. Find the thief.',
  chor: 'The thief. Say nothing. Look exactly as bored as everyone else.',
};

export const ROLE_POINTS: Record<Role, number> = {
  raja: 1000,
  rani: 800,
  police: 500,
  chor: 0,
};

export interface RRSeat {
  id: string;
  name: string;
  bot: boolean;
}

export type RRPhase =
  | 'dealing' // chits in the air
  | 'guessing' // police is choosing
  | 'reveal' // everything face up
  | 'over';

/** What every seat can see. */
export interface RRPublic {
  round: number;
  rounds: number;
  phase: RRPhase;
  seats: RRSeat[];
  scores: Record<string, number>;
  /** Who is the Police this round — this is public the moment chits are read. */
  policeId: string | null;
  /** Set once the Police has pointed. */
  accusedId: string | null;
  /** Only filled in at reveal. */
  revealed: Record<string, Role> | null;
  /** Points awarded this round, for the scoreboard flash. */
  delta: Record<string, number> | null;
  correct: boolean | null;
  winnerId: string | null;
}

/** What only you can see. */
export interface RRPrivate {
  role: Role;
  round: number;
}

export type RRAction = { type: 'accuse'; targetId: string } | { type: 'next' };

/** The host's full view, including everybody's chit. */
export interface RRState {
  pub: RRPublic;
  roles: Record<string, Role>;
}

function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Deal one round.
 *
 * With fewer than four at the bench we drop the decorative roles first — the
 * game needs a Police and a Chor and nothing else to work, which is how it got
 * played when two people wandered off.
 */
export function deal(seats: RRSeat[], round: number, rounds: number, scores: Record<string, number>): RRState {
  const needed = ROLE_ORDER.slice(0, Math.max(2, Math.min(4, seats.length)));
  // Police and Chor are mandatory; trim from the front (Raja, then Rani).
  const pool = needed.includes('police') && needed.includes('chor')
    ? needed
    : ['police', 'chor', ...needed].slice(0, seats.length);

  const assigned = shuffle(pool).slice(0, seats.length);
  const order = shuffle(seats);
  const roles: Record<string, Role> = {};
  order.forEach((s, i) => {
    roles[s.id] = assigned[i] as Role;
  });

  const policeId = Object.entries(roles).find(([, r]) => r === 'police')?.[0] ?? null;

  return {
    roles,
    pub: {
      round,
      rounds,
      phase: 'guessing',
      seats,
      scores,
      policeId,
      accusedId: null,
      revealed: null,
      delta: null,
      correct: null,
      winnerId: null,
    },
  };
}

/** Apply the Police's accusation and score the round. */
export function resolve(state: RRState, accusedId: string): RRState {
  const { roles, pub } = state;
  const policeId = pub.policeId!;
  const chorId = Object.entries(roles).find(([, r]) => r === 'chor')?.[0] ?? null;
  const correct = accusedId === chorId;

  const delta: Record<string, number> = {};
  for (const seat of pub.seats) {
    const role = roles[seat.id];
    if (role === 'raja' || role === 'rani') {
      // Royalty is paid regardless. That is the point of being royalty.
      delta[seat.id] = ROLE_POINTS[role];
    } else if (role === 'police') {
      delta[seat.id] = correct ? ROLE_POINTS.police : 0;
    } else {
      // The Chor pockets the Police's fee when the Police points at the wrong face.
      delta[seat.id] = correct ? 0 : ROLE_POINTS.police;
    }
  }

  const scores = { ...pub.scores };
  for (const [id, d] of Object.entries(delta)) scores[id] = (scores[id] ?? 0) + d;

  const last = pub.round >= pub.rounds;
  let winnerId: string | null = null;
  if (last) {
    winnerId = Object.entries(scores).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  }

  return {
    roles,
    pub: {
      ...pub,
      phase: last ? 'over' : 'reveal',
      accusedId,
      revealed: { ...roles },
      delta,
      correct,
      scores,
      winnerId,
      policeId,
    },
  };
}

/**
 * Who does a computer Police point at?
 *
 * There is genuinely nothing to read — that is the joke of the game — so it
 * picks at random among the suspects. The only intelligence worth having is
 * not accusing yourself.
 */
export function botAccusation(pub: RRPublic, policeId: string): string {
  const suspects = pub.seats.filter((s) => s.id !== policeId);
  return suspects[Math.floor(Math.random() * suspects.length)].id;
}

export function emptyScores(seats: RRSeat[]): Record<string, number> {
  return Object.fromEntries(seats.map((s) => [s.id, 0]));
}
