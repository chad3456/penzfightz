import {
  BISHOP, BLACK, KING, KNIGHT, PAWN, QUEEN, ROOK, WHITE,
  inCheck, legalMoves, makeMove, pieceColour, pieceType,
  type Colour, type Move, type PieceType, type Position,
} from './rules';

/**
 * An opponent, at three strengths.
 *
 * Negamax with alpha-beta, ordered captures first, and an evaluation that is
 * material plus a table of where each kind of piece prefers to stand. It is
 * not strong and does not need to be; what it has to be is *not silly* — it
 * must take free pieces, avoid giving them away in one move, and push its
 * pawns towards the middle rather than shuffling a rook.
 */

const VALUE: Record<PieceType, number> = {
  [PAWN]: 100,
  [KNIGHT]: 320,
  [BISHOP]: 335,
  [ROOK]: 500,
  [QUEEN]: 950,
  [KING]: 20000,
};

/**
 * Where a piece would rather be, in centipawns, written from White's side and
 * read from a1. Black's are the same tables flipped, which is why the lookup
 * mirrors the rank rather than keeping a second copy.
 */
const TABLES: Record<PieceType, number[]> = {
  [PAWN]: [
     0,  0,  0,  0,  0,  0,  0,  0,
     5, 10, 10,-20,-20, 10, 10,  5,
     5, -5,-10,  0,  0,-10, -5,  5,
     0,  0,  0, 20, 20,  0,  0,  0,
     5,  5, 10, 25, 25, 10,  5,  5,
    10, 10, 20, 30, 30, 20, 10, 10,
    50, 50, 50, 50, 50, 50, 50, 50,
     0,  0,  0,  0,  0,  0,  0,  0,
  ],
  [KNIGHT]: [
    -50,-40,-30,-30,-30,-30,-40,-50,
    -40,-20,  0,  5,  5,  0,-20,-40,
    -30,  5, 10, 15, 15, 10,  5,-30,
    -30,  0, 15, 20, 20, 15,  0,-30,
    -30,  5, 15, 20, 20, 15,  5,-30,
    -30,  0, 10, 15, 15, 10,  0,-30,
    -40,-20,  0,  0,  0,  0,-20,-40,
    -50,-40,-30,-30,-30,-30,-40,-50,
  ],
  [BISHOP]: [
    -20,-10,-10,-10,-10,-10,-10,-20,
    -10,  5,  0,  0,  0,  0,  5,-10,
    -10, 10, 10, 10, 10, 10, 10,-10,
    -10,  0, 10, 10, 10, 10,  0,-10,
    -10,  5,  5, 10, 10,  5,  5,-10,
    -10,  0,  5, 10, 10,  5,  0,-10,
    -10,  0,  0,  0,  0,  0,  0,-10,
    -20,-10,-10,-10,-10,-10,-10,-20,
  ],
  [ROOK]: [
     0,  0,  5, 10, 10,  5,  0,  0,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
     5, 10, 10, 10, 10, 10, 10,  5,
     0,  0,  0,  0,  0,  0,  0,  0,
  ],
  [QUEEN]: [
    -20,-10,-10, -5, -5,-10,-10,-20,
    -10,  0,  5,  0,  0,  0,  0,-10,
    -10,  5,  5,  5,  5,  5,  0,-10,
      0,  0,  5,  5,  5,  5,  0, -5,
     -5,  0,  5,  5,  5,  5,  0, -5,
    -10,  0,  5,  5,  5,  5,  0,-10,
    -10,  0,  0,  0,  0,  0,  0,-10,
    -20,-10,-10, -5, -5,-10,-10,-20,
  ],
  [KING]: [
     20, 30, 10,  0,  0, 10, 30, 20,
     20, 20,  0,  0,  0,  0, 20, 20,
    -10,-20,-20,-20,-20,-20,-20,-10,
    -20,-30,-30,-40,-40,-30,-30,-20,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
  ],
};

const MATE = 100000;

/** Positive means good for the side to move. */
function evaluate(p: Position): number {
  let score = 0;
  for (let i = 0; i < 64; i++) {
    const piece = p.board[i];
    if (!piece) continue;
    const t = pieceType(piece);
    const c = pieceColour(piece);
    // The tables are written from White's point of view, so Black reads them
    // from the mirrored rank.
    const at = c === WHITE ? i : (7 - (i >> 3)) * 8 + (i & 7);
    const worth = VALUE[t] + TABLES[t][at];
    score += c === WHITE ? worth : -worth;
  }
  return p.turn === WHITE ? score : -score;
}

/** Most valuable victim, least valuable attacker: enough ordering to prune well. */
function order(p: Position, moves: Move[]): Move[] {
  return moves
    .map((m) => {
      let s = 0;
      if (m.captured) s = VALUE[pieceType(m.captured)] * 10 - VALUE[pieceType(p.board[m.from])];
      if (m.promo) s += VALUE[m.promo];
      return { m, s };
    })
    .sort((a, b) => b.s - a.s)
    .map((x) => x.m);
}

function negamax(p: Position, depth: number, alpha: number, beta: number, ply: number): number {
  const moves = legalMoves(p);
  if (moves.length === 0) {
    // Mate scores count the distance, so it prefers a mate in one to a mate in
    // three and does not shuffle about having already seen a forced win.
    return inCheck(p) ? -MATE + ply : 0;
  }
  if (depth <= 0) return evaluate(p);

  let best = -Infinity;
  for (const m of order(p, moves)) {
    const score = -negamax(makeMove(p, m), depth - 1, -beta, -alpha, ply + 1);
    if (score > best) best = score;
    if (best > alpha) alpha = best;
    if (alpha >= beta) break;
  }
  return best;
}

export type Level = 'gentle' | 'steady' | 'sharp';
const DEPTH: Record<Level, number> = { gentle: 1, steady: 2, sharp: 3 };

/**
 * The move it would like to play.
 *
 * A little noise on equal moves, so two games in a row are not the same game.
 * At the gentle setting the noise is big enough to make it miss things, which
 * is what makes it gentle.
 */
export function chooseMove(p: Position, level: Level): Move | null {
  const moves = legalMoves(p);
  if (moves.length === 0) return null;

  const depth = DEPTH[level];
  const jitter = level === 'gentle' ? 55 : level === 'steady' ? 14 : 4;

  // Every root move gets a *full* window. Narrowing alpha at the root as the
  // search goes is faster, but then a move that fails low comes back with a
  // bound rather than a value — and ranking bounds against each other, jittered,
  // picks moves for reasons that are not in the position. The inner nodes still
  // prune among themselves, so this costs a little and means something.
  let best: Move | null = null;
  let bestScore = -Infinity;
  for (const m of order(p, moves)) {
    const raw = -negamax(makeMove(p, m), depth - 1, -Infinity, Infinity, 1);
    const score = raw + Math.random() * jitter;
    if (score > bestScore) {
      bestScore = score;
      best = m;
    }
  }
  return best;
}

export const sideName = (c: Colour) => (c === BLACK ? 'Black' : 'White');
