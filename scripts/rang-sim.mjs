#!/usr/bin/env node
/**
 * Play a few thousand games of Rang against itself and check the rules hold.
 *
 * A browser run proves the screen works; it does not prove the deck does. One
 * round only touches a handful of the rules, and the interesting ones — a
 * stacked draw that nobody can answer, the reshuffle when the pile runs dry,
 * the penalty for not calling your last card — turn up once in fifty games.
 *
 *   node scripts/rang-sim.mjs [games]
 */
import {
  startRound,
  apply,
  botMove,
  botShouldCall,
  playable,
  currentSeat,
  buildDeck,
} from '../src/games/rang/engine.ts';

const GAMES = Number(process.argv[2] ?? 2000);
const DECK_SIZE = buildDeck().length;

const seats = [
  { id: 'a', name: 'A', bot: true },
  { id: 'b', name: 'B', bot: true },
  { id: 'c', name: 'C', bot: true },
  { id: 'd', name: 'D', bot: true },
];

const fail = (msg, ctx) => {
  console.error('FAIL:', msg, ctx ? JSON.stringify(ctx).slice(0, 300) : '');
  process.exit(1);
};

/** Every card ever printed is in exactly one place. */
function countCards(st) {
  const inHands = Object.values(st.hands).reduce((n, h) => n + h.length, 0);
  return inHands + st.draw.length + st.discard.length;
}

const stats = {
  finished: 0, stalled: 0, turns: 0, draws: 0, plays: 0,
  wilds: 0, stacks: 0, reshuffles: 0, penalties: 0, firstTurn: {},
  winners: {}, maxTurns: 0,
};

for (let g = 0; g < GAMES; g++) {
  let st = startRound(seats, 1, Object.fromEntries(seats.map((s) => [s.id, 0])));

  if (countCards(st) !== DECK_SIZE) fail('deal lost cards', { have: countCards(st) });
  for (const s of seats) {
    if (st.hands[s.id].length !== 7) fail('bad deal size', st.pub.counts);
  }
  stats.firstTurn[st.pub.turn] = (stats.firstTurn[st.pub.turn] ?? 0) + 1;

  let guard = 0;
  let lastDraw = st.draw.length;

  while (st.pub.phase === 'playing' && guard++ < 1200) {
    const seat = currentSeat(st.pub);
    const before = st.hands[seat.id].length;

    if (botShouldCall(st, seat.id)) {
      const called = apply(st, seat.id, { type: 'call' });
      if (called) st = called;
    }

    const move = botMove(st, seat.id);
    if (st.pub.pending > 0) stats.stacks++;

    let next = apply(st, seat.id, move);
    if (!next) {
      // A rejected move must have been illegal; drawing is always available.
      if (move.type === 'play') {
        const card = st.hands[seat.id].find((c) => c.id === move.cardId);
        if (card && playable(card, st.pub.top, st.pub.active, st.pub.pending)) {
          fail('legal play rejected', { card, top: st.pub.top, active: st.pub.active });
        }
      }
      next = apply(st, seat.id, { type: 'draw' });
      if (!next) fail('draw rejected with no alternative', st.pub);
    }

    if (move.type === 'play') stats.plays++;
    if (move.type === 'draw') stats.draws++;
    if (move.type === 'play' && (move.colour !== undefined)) stats.wilds++;

    st = next;
    stats.turns++;

    if (st.draw.length > lastDraw) stats.reshuffles++;
    lastDraw = st.draw.length;

    // A drawn card leaves the turn open; take it or pass, like the UI does.
    if (st.pub.drewThisTurn && currentSeat(st.pub).id === seat.id) {
      const drawn = st.hands[seat.id].find((c) => c.id === st.pub.drewThisTurn);
      const canPlay =
        drawn && playable(drawn, st.pub.top, st.pub.active, st.pub.pending);
      const after = canPlay
        ? apply(st, seat.id, botMove(st, seat.id))
        : apply(st, seat.id, { type: 'pass' });
      if (!after) fail('could neither play nor pass after drawing', st.pub);
      st = after;
    }

    if (/forgot to call/i.test(st.pub.lastEvent ?? '')) stats.penalties++;

    // invariants, every single turn
    if (countCards(st) !== DECK_SIZE) {
      fail('cards appeared or vanished', { have: countCards(st), turn: stats.turns });
    }
    if (st.pub.active === null && st.pub.top) fail('no colour in force', st.pub.top);
    for (const s of seats) {
      if (st.pub.counts[s.id] !== st.hands[s.id].length) fail('counts out of sync', st.pub.counts);
      if (st.hands[s.id].length < 0) fail('negative hand', st.pub.counts);
    }
    const t = st.pub.turn;
    if (!Number.isInteger(t) || t < 0 || t >= seats.length) fail('turn out of range', { t });
  }

  stats.maxTurns = Math.max(stats.maxTurns, guard);
  if (st.pub.phase === 'over') {
    stats.finished++;
    const w = st.pub.winnerId;
    if (!w) fail('finished with no winner');
    if (st.hands[w].length !== 0) fail('winner still holding cards', st.pub.counts);
    if ((st.pub.scores[w] ?? 0) <= 0) fail('winner scored nothing', st.pub.scores);
    stats.winners[w] = (stats.winners[w] ?? 0) + 1;
  } else {
    stats.stalled++;
  }
}

const pct = (n) => ((n / GAMES) * 100).toFixed(1) + '%';
console.log(`${GAMES} games, deck of ${DECK_SIZE}`);
console.log(`  finished            ${stats.finished} (${pct(stats.finished)})`);
console.log(`  stalled             ${stats.stalled}`);
console.log(`  turns               ${stats.turns} total, longest game ${stats.maxTurns}`);
console.log(`  plays / draws       ${stats.plays} / ${stats.draws}`);
console.log(`  wilds coloured      ${stats.wilds}`);
console.log(`  stacked draw turns  ${stats.stacks}`);
console.log(`  deck reshuffles     ${stats.reshuffles}`);
console.log(`  no-call penalties   ${stats.penalties}`);
console.log(`  first turn spread   ${JSON.stringify(stats.firstTurn)}`);
console.log(`  wins by seat        ${JSON.stringify(stats.winners)}`);

if (stats.stalled > GAMES * 0.02) fail('too many games stalled', { stalled: stats.stalled });
if (Object.keys(stats.firstTurn).length < seats.length) fail('deal is not random', stats.firstTurn);
console.log('\nall invariants held.');
