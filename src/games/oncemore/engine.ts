import { CARDS, HAND_SIZE, OPENING, type CardId } from './cards';
import { LIFE, SCENES, type Choice, type Scene } from './scenes';

/**
 * The rules.
 *
 * Small enough to state in full, which is the test any rule set for a game
 * about morality should have to pass.
 *
 * 1. You hold four cards. A choice is offered only if the card it costs is in
 *    your hand. Every scene has one choice that costs nothing, so you are never
 *    stuck — but the free choice is almost always the passive one, and passivity
 *    has consequences like everything else.
 * 2. Making a choice spends its card and puts back whatever the doing of it
 *    teaches you. Habits deepen. That is the entire progression system.
 * 3. Guilt is a card with no use. It cannot pay for anything. It sits in your
 *    hand occupying one of four slots, which means a guilty person is a person
 *    with fewer options — not as a metaphor, as a rule.
 * 4. Confession removes every Guilt in the deck and costs you all the standing
 *    those acts bought, plus a little more. It is available whenever you are
 *    holding one.
 * 5. At the end you are asked whether you would live it again, unchanged,
 *    innumerable times. That question is not scored. It is the game.
 */

export interface Entry {
  scene: string;
  title: string;
  label: string;
  outcome: string;
  d: string;
  n: string;
  card?: CardId;
}

export interface Run {
  seed: number;
  order: number[];
  at: number;
  deck: CardId[];
  hand: CardId[];
  discard: CardId[];
  standing: number;
  ledger: Entry[];
  confessions: number;
  /** Set once the recurrence has been answered. */
  again?: boolean;
  regret?: number;
}

const rng = (seed: number) => {
  let a = (seed ^ 0x9e3779b9) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

function shuffle<T>(list: T[], r: () => number): T[] {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * A life cannot dead-end.
 *
 * Checked here rather than trusted, because the failure is silent: a scene
 * where every choice costs a card you might not hold would simply present four
 * dead options and no way forward, and it would only happen to the unlucky.
 */
export function audit(): string[] {
  const bad: string[] = [];
  for (const s of SCENES) if (!s.choices.some((c) => !c.needs)) bad.push(s.id);
  return bad;
}

export function start(seed: number): Run {
  const r = rng(seed);
  const run: Run = {
    seed,
    order: shuffle(SCENES.map((_, i) => i), r).slice(0, LIFE),
    at: 0,
    deck: shuffle(OPENING, r),
    hand: [],
    discard: [],
    standing: 0,
    ledger: [],
    confessions: 0,
  };
  return deal(run, r);
}

function deal(run: Run, r: () => number): Run {
  const deck = run.deck.slice();
  const hand = run.hand.slice();
  let discard = run.discard.slice();
  while (hand.length < HAND_SIZE) {
    if (!deck.length) {
      if (!discard.length) break;
      deck.push(...shuffle(discard, r));
      discard = [];
    }
    hand.push(deck.pop() as CardId);
  }
  return { ...run, deck, hand, discard };
}

export const scene = (run: Run): Scene => SCENES[run.order[Math.min(run.at, LIFE - 1)]];

export const playable = (run: Run, c: Choice) => !c.needs || run.hand.includes(c.needs);

/** Guilt anywhere in the deck, which is the only place it can be. */
export const weight = (run: Run) =>
  [...run.deck, ...run.hand, ...run.discard].filter((c) => c === 'guilt').length;

export function census(run: Run): { id: CardId; n: number }[] {
  const all = [...run.deck, ...run.hand, ...run.discard];
  const counts = new Map<CardId, number>();
  for (const c of all) counts.set(c, (counts.get(c) ?? 0) + 1);
  return [...counts.entries()]
    .map(([id, n]) => ({ id, n }))
    .sort((a, b) => b.n - a.n || CARDS[a.id].name.localeCompare(CARDS[b.id].name));
}

export function choose(run: Run, c: Choice): Run {
  const r = rng(run.seed + run.at * 7919 + 13);
  const hand = run.hand.slice();
  const discard = run.discard.slice();

  if (c.needs) {
    const i = hand.indexOf(c.needs);
    if (i < 0) return run;
    hand.splice(i, 1);
    discard.push(c.needs);
  }
  // What the doing of it teaches you, and what it leaves on you.
  for (const g of c.gain ?? []) discard.push(g);
  for (let i = 0; i < (c.guilt ?? 0); i++) discard.push('guilt');

  const sc = scene(run);
  const next: Run = {
    ...run,
    hand,
    discard,
    standing: run.standing + (c.standing ?? 0),
    at: run.at + 1,
    ledger: [
      ...run.ledger,
      { scene: sc.id, title: sc.title, label: c.label, outcome: c.outcome, d: c.d, n: c.n, card: c.needs },
    ],
  };
  return deal(next, r);
}

/**
 * Confession.
 *
 * It clears the deck of guilt and it costs you everything the guilty acts
 * bought — plus one, so that it is never merely a good trade. Both men are
 * unusually close together here and it is worth knowing why they are not
 * agreeing: for Dostoevsky this is the way back into the human race, and for
 * Nietzsche it is a debt being discharged in the currency of suffering, which
 * is exactly the mechanism he spent the second essay taking apart.
 */
export function confess(run: Run): Run {
  const r = rng(run.seed + run.at * 104729 + 7);
  const drop = (list: CardId[]) => list.filter((c) => c !== 'guilt');
  const paid = weight(run);
  if (!paid) return run;
  const next: Run = {
    ...run,
    deck: drop(run.deck),
    hand: drop(run.hand),
    discard: [...drop(run.discard), 'confession'],
    standing: run.standing - paid - 1,
    confessions: run.confessions + 1,
  };
  return deal(next, r);
}

export const over = (run: Run) => run.at >= LIFE;
