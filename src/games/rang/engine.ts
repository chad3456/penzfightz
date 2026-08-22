/**
 * Rang — the colour-and-number card game.
 *
 * This is the game everybody has played and nobody agrees on the name of. It
 * is not the branded American deck; it is the rules as they travelled, which
 * are old and unowned. Four colours numbered nought to nine, a handful of
 * cards that make the next player suffer, and wilds.
 *
 * House rules baked in, because these were the ones we played:
 *  - Draw one and you may play it immediately if it happens to fit.
 *  - Stacking is on: a Draw Two answers a Draw Two, and the pile keeps growing
 *    until somebody cannot answer and eats the lot.
 *  - You must call "one card" on the turn you get down to one, or the table
 *    makes you take two. The computer will call you out.
 */

export type Colour = 'red' | 'green' | 'blue' | 'yellow';
export type CardKind = 'number' | 'skip' | 'reverse' | 'draw2' | 'wild' | 'wild4';

export interface Card {
  id: string;
  kind: CardKind;
  /** Null on a wild until somebody names one. */
  colour: Colour | null;
  /** Only on number cards. */
  value: number | null;
}

export const COLOURS: Colour[] = ['red', 'green', 'blue', 'yellow'];

export const COLOUR_HEX: Record<Colour, string> = {
  red: '#c8392f',
  green: '#1d8a4e',
  blue: '#2060c0',
  yellow: '#e0a92c',
};

export const COLOUR_NAME: Record<Colour, string> = {
  red: 'Laal',
  green: 'Hara',
  blue: 'Neela',
  yellow: 'Peela',
};

export function cardLabel(c: Card): string {
  switch (c.kind) {
    case 'number':
      return String(c.value);
    case 'skip':
      return 'Skip';
    case 'reverse':
      return 'Turn';
    case 'draw2':
      return '+2';
    case 'wild':
      return 'Rang';
    case 'wild4':
      return '+4';
  }
}

/** Points the winner collects from what everyone else is left holding. */
export function cardPoints(c: Card): number {
  if (c.kind === 'number') return c.value ?? 0;
  if (c.kind === 'wild' || c.kind === 'wild4') return 50;
  return 20;
}

let seq = 0;
const mk = (kind: CardKind, colour: Colour | null, value: number | null): Card => ({
  id: `c${seq++}`,
  kind,
  colour,
  value,
});

export function buildDeck(): Card[] {
  const deck: Card[] = [];
  for (const colour of COLOURS) {
    deck.push(mk('number', colour, 0));
    for (let v = 1; v <= 9; v++) {
      deck.push(mk('number', colour, v));
      deck.push(mk('number', colour, v));
    }
    for (const kind of ['skip', 'reverse', 'draw2'] as CardKind[]) {
      deck.push(mk(kind, colour, null));
      deck.push(mk(kind, colour, null));
    }
  }
  for (let i = 0; i < 4; i++) {
    deck.push(mk('wild', null, null));
    deck.push(mk('wild4', null, null));
  }
  return deck;
}

export function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------------------------------------------------------------- state

export interface RangSeat {
  id: string;
  name: string;
  bot: boolean;
}

/** What everybody can see. */
export interface RangPublic {
  seats: RangSeat[];
  /** Index into seats. */
  turn: number;
  /** +1 or -1. */
  direction: 1 | -1;
  top: Card | null;
  /** The colour in force — a wild sets this without changing the card. */
  active: Colour | null;
  counts: Record<string, number>;
  /** How many cards the next player must eat if they cannot answer. */
  pending: number;
  /** Seats that have called their last card. */
  called: string[];
  drawPile: number;
  scores: Record<string, number>;
  lastEvent: string | null;
  winnerId: string | null;
  phase: 'playing' | 'over';
  round: number;
}

/** Your cards, and nobody else's. */
export interface RangPrivate {
  hand: Card[];
}

export type RangAction =
  | { type: 'play'; cardId: string; colour?: Colour }
  | { type: 'draw' }
  | { type: 'pass' }
  | { type: 'call' };

/** The host's complete view. */
export interface RangState {
  pub: RangPublic;
  hands: Record<string, Card[]>;
  draw: Card[];
  discard: Card[];
  /** Set after a draw so the drawn card, and only that one, may still be played. */
  drewThisTurn: string | null;
}

// ---------------------------------------------------------------- rules

export function playable(card: Card, top: Card | null, active: Colour | null, pending: number): boolean {
  // Mid-stack, only another draw card keeps the pile moving.
  if (pending > 0) {
    if (top?.kind === 'draw2') return card.kind === 'draw2' || card.kind === 'wild4';
    if (top?.kind === 'wild4') return card.kind === 'wild4';
  }
  if (card.kind === 'wild' || card.kind === 'wild4') return true;
  if (!top) return true;
  if (card.colour === active) return true;
  if (top.kind === 'number' && card.kind === 'number' && card.value === top.value) return true;
  if (top.kind !== 'number' && card.kind === top.kind) return true;
  return false;
}

export function hasPlayable(hand: Card[], pub: RangPublic): boolean {
  return hand.some((c) => playable(c, pub.top, pub.active, pub.pending));
}

function nextIndex(pub: RangPublic, step = 1): number {
  const n = pub.seats.length;
  return (pub.turn + pub.direction * step + n * 2) % n;
}

/** Draw n cards, reshuffling the discard back in when the pile runs dry. */
function take(state: RangState, n: number): Card[] {
  const out: Card[] = [];
  for (let i = 0; i < n; i++) {
    if (!state.draw.length) {
      // Keep the top card face up, shuffle everything under it back in.
      const top = state.discard.pop();
      state.draw = shuffle(state.discard).map((c) =>
        c.kind === 'wild' || c.kind === 'wild4' ? { ...c, colour: null } : c,
      );
      state.discard = top ? [top] : [];
      if (!state.draw.length) break; // genuinely nothing left; a rare stalemate
    }
    const card = state.draw.pop();
    if (card) out.push(card);
  }
  return out;
}

export function startRound(
  seats: RangSeat[],
  round: number,
  scores: Record<string, number>,
): RangState {
  const draw = shuffle(buildDeck());
  const hands: Record<string, Card[]> = {};
  for (const s of seats) hands[s.id] = draw.splice(0, 7);

  // Turn one up to start the pile. A wild4 on top would be unfair, so bury it.
  let first = draw.pop()!;
  while (first.kind === 'wild4') {
    draw.unshift(first);
    first = draw.pop()!;
  }
  const active: Colour | null =
    first.kind === 'wild' ? COLOURS[Math.floor(Math.random() * 4)] : first.colour;

  const state: RangState = {
    hands,
    draw,
    discard: [first],
    drewThisTurn: null,
    pub: {
      seats,
      turn: 0,
      direction: 1,
      top: first,
      active,
      counts: Object.fromEntries(seats.map((s) => [s.id, 7])),
      pending: first.kind === 'draw2' ? 2 : 0,
      called: [],
      drawPile: draw.length,
      scores,
      lastEvent: `${cardLabel(first)} turned up.`,
      winnerId: null,
      phase: 'playing',
      round,
    },
  };
  return state;
}

function sync(state: RangState) {
  for (const s of state.pub.seats) state.pub.counts[s.id] = state.hands[s.id]?.length ?? 0;
  state.pub.drawPile = state.draw.length;
  state.pub.top = state.discard[state.discard.length - 1] ?? null;
}

/** Score the round: the winner banks what everybody else is still holding. */
function finish(state: RangState, winnerId: string) {
  let pot = 0;
  for (const s of state.pub.seats) {
    if (s.id === winnerId) continue;
    for (const c of state.hands[s.id] ?? []) pot += cardPoints(c);
  }
  state.pub.scores = {
    ...state.pub.scores,
    [winnerId]: (state.pub.scores[winnerId] ?? 0) + pot,
  };
  state.pub.winnerId = winnerId;
  state.pub.phase = 'over';
  state.pub.lastEvent = `${nameOf(state.pub, winnerId)} went out and takes ${pot}.`;
}

export function nameOf(pub: RangPublic, id: string): string {
  return pub.seats.find((s) => s.id === id)?.name ?? '—';
}

export function currentSeat(pub: RangPublic): RangSeat {
  return pub.seats[pub.turn];
}

/**
 * Apply one action. Returns the new state, or null when the action was not
 * legal — the host simply ignores those rather than arguing.
 */
export function apply(state: RangState, from: string, action: RangAction): RangState | null {
  const pub = state.pub;
  if (pub.phase !== 'playing') return null;

  // Calling your last card is the one thing you may do out of turn.
  if (action.type === 'call') {
    if ((state.hands[from]?.length ?? 0) > 2) return null;
    if (pub.called.includes(from)) return null;
    return {
      ...state,
      pub: { ...pub, called: [...pub.called, from], lastEvent: `${nameOf(pub, from)}: one card!` },
    };
  }

  if (currentSeat(pub).id !== from) return null;
  const hand = state.hands[from] ?? [];

  // ---- play a card ----
  if (action.type === 'play') {
    const idx = hand.findIndex((c) => c.id === action.cardId);
    if (idx < 0) return null;
    const card = hand[idx];
    if (!playable(card, pub.top, pub.active, pub.pending)) return null;
    // After drawing you may only play the card you just drew.
    if (state.drewThisTurn && card.id !== state.drewThisTurn) return null;

    const next: RangState = {
      ...state,
      hands: { ...state.hands, [from]: hand.filter((_, i) => i !== idx) },
      discard: [...state.discard, { ...card, colour: card.colour }],
      draw: [...state.draw],
      drewThisTurn: null,
      pub: { ...pub, called: [...pub.called] },
    };
    const np = next.pub;

    // Colour in force
    if (card.kind === 'wild' || card.kind === 'wild4') {
      np.active = action.colour ?? COLOURS[Math.floor(Math.random() * 4)];
    } else {
      np.active = card.colour;
    }

    // Failing to call before your last card costs you two.
    const left = next.hands[from].length;
    if (left === 1 && !np.called.includes(from)) {
      const penalty = take(next, 2);
      next.hands[from] = [...next.hands[from], ...penalty];
      np.lastEvent = `${nameOf(np, from)} forgot to call. Two more.`;
    } else if (left === 0) {
      sync(next);
      finish(next, from);
      return next;
    } else {
      np.lastEvent = `${nameOf(np, from)} played ${cardLabel(card)}.`;
    }
    np.called = np.called.filter((id) => id !== from || next.hands[from].length === 1);

    // Effects
    let step = 1;
    if (card.kind === 'reverse') {
      if (np.seats.length === 2) {
        step = 2; // heads-up: a reverse is just a skip
      } else {
        np.direction = (np.direction * -1) as 1 | -1;
      }
    }
    if (card.kind === 'skip') step = 2;
    if (card.kind === 'draw2') np.pending += 2;
    if (card.kind === 'wild4') np.pending += 4;

    np.turn = nextIndex(np, step);
    sync(next);
    return next;
  }

  // ---- draw ----
  if (action.type === 'draw') {
    const next: RangState = {
      ...state,
      hands: { ...state.hands },
      draw: [...state.draw],
      discard: [...state.discard],
      pub: { ...pub, called: [...pub.called] },
    };
    const np = next.pub;

    if (np.pending > 0) {
      // Eating the stack. Your turn ends with it.
      const eaten = take(next, np.pending);
      next.hands[from] = [...(next.hands[from] ?? []), ...eaten];
      np.lastEvent = `${nameOf(np, from)} eats ${np.pending}.`;
      np.pending = 0;
      np.turn = nextIndex(np, 1);
      next.drewThisTurn = null;
      sync(next);
      return next;
    }

    if (state.drewThisTurn) return null; // one card per turn
    const [card] = take(next, 1);
    if (!card) {
      np.turn = nextIndex(np, 1);
      sync(next);
      return next;
    }
    next.hands[from] = [...(next.hands[from] ?? []), card];
    next.drewThisTurn = card.id;
    np.lastEvent = `${nameOf(np, from)} drew.`;
    np.called = np.called.filter((id) => id !== from);
    sync(next);
    return next;
  }

  // ---- pass, only legal right after a draw ----
  if (action.type === 'pass') {
    if (!state.drewThisTurn) return null;
    const next: RangState = { ...state, drewThisTurn: null, pub: { ...pub } };
    next.pub.turn = nextIndex(next.pub, 1);
    next.pub.lastEvent = `${nameOf(next.pub, from)} passed.`;
    sync(next);
    return next;
  }

  return null;
}

// ---------------------------------------------------------------- the bots

/**
 * How a classmate plays.
 *
 * Dump the expensive cards first, keep a wild in reserve for when you are
 * stuck, and pick the colour you hold most of. It is not deep, but it is what
 * everybody actually did.
 */
export function botMove(state: RangState, seatId: string): RangAction {
  const hand = state.hands[seatId] ?? [];
  const pub = state.pub;
  const legal = hand.filter((c) => playable(c, pub.top, pub.active, pub.pending));

  if (!legal.length) return { type: 'draw' };

  const rank = (c: Card) => {
    if (c.kind === 'wild4') return 0; // only when nothing else fits
    if (c.kind === 'wild') return 1;
    if (c.kind === 'draw2') return 5;
    if (c.kind === 'skip') return 4;
    if (c.kind === 'reverse') return 3;
    return 2 + (c.value ?? 0) / 20;
  };

  // Under a stack, answering is nearly always right.
  const pick = pub.pending > 0
    ? legal[0]
    : [...legal].sort((a, b) => rank(b) - rank(a))[0];

  if (pick.kind === 'wild' || pick.kind === 'wild4') {
    const tally: Record<Colour, number> = { red: 0, green: 0, blue: 0, yellow: 0 };
    for (const c of hand) if (c.colour) tally[c.colour] += 1;
    const colour = COLOURS.reduce((best, c) => (tally[c] > tally[best] ? c : best), COLOURS[0]);
    return { type: 'play', cardId: pick.id, colour };
  }
  return { type: 'play', cardId: pick.id };
}

/** Bots remember to call, most of the time. */
export function botShouldCall(state: RangState, seatId: string): boolean {
  return (state.hands[seatId]?.length ?? 0) === 2 && Math.random() < 0.85;
}
