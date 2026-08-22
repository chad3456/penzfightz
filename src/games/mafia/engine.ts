/**
 * Mafia.
 *
 * The dormitory game. Everyone shuts their eyes, the mafia picks somebody off,
 * and in the morning the village argues about who did it and hangs whoever
 * sounded guiltiest. Usually the wrong person.
 *
 * Roles are dealt by the host and encrypted to each seat, so nobody can read
 * anybody else's card off the wire — which is the whole game.
 */

export type MafiaRole = 'mafia' | 'doctor' | 'inspector' | 'villager';

export const ROLE_LABEL: Record<MafiaRole, string> = {
  mafia: 'Mafia',
  doctor: 'Doctor',
  inspector: 'Inspector',
  villager: 'Villager',
};

export const ROLE_BRIEF: Record<MafiaRole, string> = {
  mafia: 'Pick someone off each night. In the day, be appalled along with everyone else.',
  doctor: 'Save one person a night. You may save yourself, but not twice running.',
  inspector: 'Check one person a night. You learn whether they are mafia. Prove it without being obvious.',
  villager: 'You have no special power. You have a mouth and a vote, which is more than enough.',
};

export interface MafiaSeat {
  id: string;
  name: string;
  bot: boolean;
}

export type MafiaPhase =
  | 'night' // mafia, doctor, inspector act
  | 'dawn' // reveal what happened
  | 'day' // discuss and accuse
  | 'verdict' // the votes are read
  | 'over';

export interface MafiaPublic {
  seats: MafiaSeat[];
  alive: string[];
  phase: MafiaPhase;
  night: number;
  /** Who was taken, once it is morning. */
  lastVictim: string | null;
  lastSaved: boolean;
  /** Who was hanged, once the vote is read. */
  lastHanged: string | null;
  /** Public tally during the day. */
  votes: Record<string, string>;
  /** Seats that have submitted their night action. */
  nightDone: string[];
  winner: 'village' | 'mafia' | null;
  /** Only filled in when the game is over. */
  revealed: Record<string, MafiaRole> | null;
  log: string[];
}

export interface MafiaPrivate {
  role: MafiaRole;
  /** Mafia see each other. */
  partners: string[];
  /** What the inspector has learned so far. */
  findings: { id: string; mafia: boolean }[];
}

export type MafiaAction =
  | { type: 'kill'; targetId: string }
  | { type: 'save'; targetId: string }
  | { type: 'check'; targetId: string }
  | { type: 'vote'; targetId: string }
  | { type: 'ready' };

export interface MafiaState {
  pub: MafiaPublic;
  roles: Record<string, MafiaRole>;
  findings: Record<string, { id: string; mafia: boolean }[]>;
  /** This night's submissions. */
  kill: string | null;
  save: string | null;
  check: string | null;
  lastSave: string | null;
}

function shuffle<T>(a: T[]): T[] {
  const out = [...a];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** How many mafia for a table this size — the usual roughly-a-quarter rule. */
export function mafiaCount(n: number): number {
  if (n <= 5) return 1;
  if (n <= 8) return 2;
  if (n <= 11) return 3;
  return 4;
}

export function deal(seats: MafiaSeat[]): MafiaState {
  const n = seats.length;
  const roles: MafiaRole[] = [];
  for (let i = 0; i < mafiaCount(n); i++) roles.push('mafia');
  roles.push('doctor');
  if (n >= 5) roles.push('inspector');
  while (roles.length < n) roles.push('villager');

  const order = shuffle(seats);
  const assigned = shuffle(roles);
  const map: Record<string, MafiaRole> = {};
  order.forEach((s, i) => {
    map[s.id] = assigned[i];
  });

  return {
    roles: map,
    findings: Object.fromEntries(seats.map((s) => [s.id, []])),
    kill: null,
    save: null,
    check: null,
    lastSave: null,
    pub: {
      seats,
      alive: seats.map((s) => s.id),
      phase: 'night',
      night: 1,
      lastVictim: null,
      lastSaved: false,
      lastHanged: null,
      votes: {},
      nightDone: [],
      winner: null,
      revealed: null,
      log: ['Night falls. Everybody shut your eyes.'],
    },
  };
}

export function livingRole(state: MafiaState, role: MafiaRole): string[] {
  return state.pub.alive.filter((id) => state.roles[id] === role);
}

export function nameOf(pub: MafiaPublic, id: string | null): string {
  if (!id) return '—';
  return pub.seats.find((s) => s.id === id)?.name ?? '—';
}

function checkWin(state: MafiaState): 'village' | 'mafia' | null {
  const mafia = state.pub.alive.filter((id) => state.roles[id] === 'mafia').length;
  const rest = state.pub.alive.length - mafia;
  if (mafia === 0) return 'village';
  // Once they equal the rest, the village can no longer out-vote them.
  if (mafia >= rest) return 'mafia';
  return null;
}

/** Everyone who needed to act at night has acted. */
export function nightComplete(state: MafiaState): boolean {
  const needKill = livingRole(state, 'mafia').length > 0;
  const needSave = livingRole(state, 'doctor').length > 0;
  const needCheck = livingRole(state, 'inspector').length > 0;
  return (
    (!needKill || state.kill !== null) &&
    (!needSave || state.save !== null) &&
    (!needCheck || state.check !== null)
  );
}

/** Resolve the night and step into morning. */
export function resolveNight(state: MafiaState): MafiaState {
  const next: MafiaState = {
    ...state,
    pub: { ...state.pub, log: [...state.pub.log] },
    findings: { ...state.findings },
  };
  const p = next.pub;

  // The inspector learns something whether or not anybody dies.
  if (next.check) {
    for (const id of livingRole(state, 'inspector')) {
      next.findings[id] = [
        ...(next.findings[id] ?? []),
        { id: next.check, mafia: state.roles[next.check] === 'mafia' },
      ];
    }
  }

  const saved = next.kill !== null && next.kill === next.save;
  const victim = saved ? null : next.kill;

  if (victim) {
    p.alive = p.alive.filter((id) => id !== victim);
    p.log.push(`${nameOf(p, victim)} did not make it through the night.`);
  } else if (saved) {
    p.log.push('Somebody was attacked, and somebody else got there first.');
  } else {
    p.log.push('A quiet night, somehow.');
  }

  p.lastVictim = victim;
  p.lastSaved = saved;
  p.phase = 'dawn';
  p.votes = {};
  p.nightDone = [];

  next.lastSave = next.save;
  next.kill = null;
  next.save = null;
  next.check = null;

  const winner = checkWin(next);
  if (winner) {
    p.winner = winner;
    p.phase = 'over';
    p.revealed = { ...state.roles };
    p.log.push(winner === 'village' ? 'The village is clean.' : 'The mafia have the run of the place.');
  }
  return next;
}

export function openDay(state: MafiaState): MafiaState {
  return {
    ...state,
    pub: {
      ...state.pub,
      phase: 'day',
      votes: {},
      log: [...state.pub.log, 'Morning. Argue.'],
    },
  };
}

/** Everyone alive has voted. */
export function voteComplete(state: MafiaState): boolean {
  return state.pub.alive.every((id) => state.pub.votes[id] !== undefined);
}

export function resolveVote(state: MafiaState): MafiaState {
  const next: MafiaState = { ...state, pub: { ...state.pub, log: [...state.pub.log] } };
  const p = next.pub;

  const tally: Record<string, number> = {};
  for (const target of Object.values(p.votes)) tally[target] = (tally[target] ?? 0) + 1;

  const ranked = Object.entries(tally).sort((a, b) => b[1] - a[1]);
  const top = ranked[0];
  const tie = ranked.length > 1 && ranked[1][1] === top?.[1];

  if (!top || tie) {
    p.lastHanged = null;
    p.log.push(tie ? 'The vote splits. Nobody hangs today.' : 'No vote. Nobody hangs.');
  } else {
    const hanged = top[0];
    p.alive = p.alive.filter((id) => id !== hanged);
    p.lastHanged = hanged;
    p.log.push(
      `${nameOf(p, hanged)} was hanged, and was ${
        state.roles[hanged] === 'mafia' ? 'mafia after all' : 'not mafia'
      }.`,
    );
  }

  p.phase = 'verdict';

  const winner = checkWin(next);
  if (winner) {
    p.winner = winner;
    p.phase = 'over';
    p.revealed = { ...state.roles };
    p.log.push(winner === 'village' ? 'The village is clean.' : 'The mafia win.');
  }
  return next;
}

export function nextNight(state: MafiaState): MafiaState {
  return {
    ...state,
    kill: null,
    save: null,
    check: null,
    pub: {
      ...state.pub,
      phase: 'night',
      night: state.pub.night + 1,
      votes: {},
      nightDone: [],
      lastVictim: null,
      lastSaved: false,
      lastHanged: null,
      log: [...state.pub.log, 'Night falls again.'],
    },
  };
}

/** Apply one action from one seat. Illegal ones are dropped. */
export function apply(state: MafiaState, from: string, action: MafiaAction): MafiaState | null {
  const p = state.pub;
  if (p.phase === 'over') return null;
  if (!p.alive.includes(from)) return null;

  const target = 'targetId' in action ? action.targetId : null;
  if (target && !p.alive.includes(target)) return null;

  if (p.phase === 'night') {
    const role = state.roles[from];
    const next = { ...state, pub: { ...p, nightDone: [...p.nightDone] } };

    if (action.type === 'kill' && role === 'mafia') {
      if (state.roles[target!] === 'mafia') return null; // they do not eat their own
      next.kill = target;
    } else if (action.type === 'save' && role === 'doctor') {
      if (target === state.lastSave) return null; // no saving the same person twice running
      next.save = target;
    } else if (action.type === 'check' && role === 'inspector') {
      if (target === from) return null;
      next.check = target;
    } else {
      return null;
    }
    if (!next.pub.nightDone.includes(from)) next.pub.nightDone.push(from);
    return next;
  }

  if (p.phase === 'day' && action.type === 'vote' && target) {
    return { ...state, pub: { ...p, votes: { ...p.votes, [from]: target } } };
  }

  return null;
}

// ---------------------------------------------------------------- bots

/**
 * A computer villager is a plausible idiot, which is roughly right.
 *
 * The mafia avoid each other, the doctor covers somebody who looks useful, and
 * the inspector checks people it has not checked. In the day everyone votes
 * with a bias toward whoever the inspector has publicly doubted — which, since
 * bots do not talk, comes out as a mild random preference.
 */
export function botNight(state: MafiaState, seatId: string): MafiaAction | null {
  const role = state.roles[seatId];
  const alive = state.pub.alive;
  const others = alive.filter((id) => id !== seatId);

  if (role === 'mafia') {
    const targets = others.filter((id) => state.roles[id] !== 'mafia');
    if (!targets.length) return null;
    return { type: 'kill', targetId: targets[Math.floor(Math.random() * targets.length)] };
  }
  if (role === 'doctor') {
    const targets = alive.filter((id) => id !== state.lastSave);
    if (!targets.length) return null;
    return { type: 'save', targetId: targets[Math.floor(Math.random() * targets.length)] };
  }
  if (role === 'inspector') {
    const seen = new Set((state.findings[seatId] ?? []).map((f) => f.id));
    const fresh = others.filter((id) => !seen.has(id));
    const pool = fresh.length ? fresh : others;
    if (!pool.length) return null;
    return { type: 'check', targetId: pool[Math.floor(Math.random() * pool.length)] };
  }
  return null;
}

export function botVote(state: MafiaState, seatId: string): MafiaAction | null {
  const alive = state.pub.alive.filter((id) => id !== seatId);
  if (!alive.length) return null;
  const role = state.roles[seatId];

  // The mafia steer away from each other; everyone else guesses.
  const pool =
    role === 'mafia' ? alive.filter((id) => state.roles[id] !== 'mafia') : alive;
  const from = pool.length ? pool : alive;

  // An inspector that has found somebody votes for them.
  if (role === 'inspector') {
    const known = (state.findings[seatId] ?? []).find(
      (f) => f.mafia && state.pub.alive.includes(f.id),
    );
    if (known) return { type: 'vote', targetId: known.id };
  }

  return { type: 'vote', targetId: from[Math.floor(Math.random() * from.length)] };
}
