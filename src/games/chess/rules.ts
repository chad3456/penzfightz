/**
 * Chess, the whole of it.
 *
 * Board as a flat 64, `a1` at 0 and `h8` at 63, so `file = i & 7` and
 * `rank = i >> 3`. Sliding pieces walk offsets and stop at the edge, and the
 * edge is detected by watching the *file* rather than by masking the index —
 * a rook on h4 stepping +1 lands on a5 and would otherwise carry on happily
 * along the next rank.
 *
 * Move generation is pseudo-legal and then filtered by playing the move and
 * asking whether the mover is in check. That is the slow way and it is also
 * the way that cannot be wrong about pins, discovered checks, or a king
 * castling through a square that only becomes attacked once the rook has left.
 */

export type Colour = 0 | 1;
export const WHITE: Colour = 0;
export const BLACK: Colour = 1;

export const PAWN = 1;
export const KNIGHT = 2;
export const BISHOP = 3;
export const ROOK = 4;
export const QUEEN = 5;
export const KING = 6;

export type PieceType = 1 | 2 | 3 | 4 | 5 | 6;

/** `type | colour << 3`. Zero is an empty square. */
export type Piece = number;
export const pieceType = (p: Piece): PieceType => (p & 7) as PieceType;
export const pieceColour = (p: Piece): Colour => ((p >> 3) & 1) as Colour;
export const make = (t: PieceType, c: Colour): Piece => t | (c << 3);

export const CASTLE_WK = 1;
export const CASTLE_WQ = 2;
export const CASTLE_BK = 4;
export const CASTLE_BQ = 8;

export interface Move {
  from: number;
  to: number;
  /** What a pawn became, if it reached the far rank. */
  promo?: PieceType;
  /** Set on the two-square pawn opening, so the next side can take en passant. */
  double?: boolean;
  /** The captured pawn is not on the square being moved to. */
  enPassant?: boolean;
  /** 'k' or 'q'. The rook moves too. */
  castle?: 'k' | 'q';
  /** What was taken, for the captured-pieces tray and for undo. */
  captured?: Piece;
}

export interface Position {
  board: Int8Array;
  turn: Colour;
  castling: number;
  /** The square a pawn may be captured *on*, or −1. */
  ep: number;
  halfmove: number;
  fullmove: number;
}

export const file = (i: number) => i & 7;
export const rank = (i: number) => i >> 3;
export const square = (f: number, r: number) => r * 8 + f;

const NAMES = 'abcdefgh';
export const squareName = (i: number) => `${NAMES[file(i)]}${rank(i) + 1}`;

// ------------------------------------------------------------------- setting up

const FEN_START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

const FEN_PIECES: Record<string, Piece> = {
  P: make(PAWN, WHITE), N: make(KNIGHT, WHITE), B: make(BISHOP, WHITE),
  R: make(ROOK, WHITE), Q: make(QUEEN, WHITE), K: make(KING, WHITE),
  p: make(PAWN, BLACK), n: make(KNIGHT, BLACK), b: make(BISHOP, BLACK),
  r: make(ROOK, BLACK), q: make(QUEEN, BLACK), k: make(KING, BLACK),
};

export function fromFen(fen = FEN_START): Position {
  const [place, side, castle, ep, half, full] = fen.trim().split(/\s+/);
  const board = new Int8Array(64);
  let i = 56;
  for (const ch of place) {
    if (ch === '/') {
      i -= 16;
    } else if (ch >= '1' && ch <= '8') {
      i += Number(ch);
    } else {
      board[i++] = FEN_PIECES[ch] ?? 0;
    }
  }
  let castling = 0;
  if (castle?.includes('K')) castling |= CASTLE_WK;
  if (castle?.includes('Q')) castling |= CASTLE_WQ;
  if (castle?.includes('k')) castling |= CASTLE_BK;
  if (castle?.includes('q')) castling |= CASTLE_BQ;
  return {
    board,
    turn: side === 'b' ? BLACK : WHITE,
    castling,
    ep: ep && ep !== '-' ? square(NAMES.indexOf(ep[0]), Number(ep[1]) - 1) : -1,
    halfmove: Number(half ?? 0),
    fullmove: Number(full ?? 1),
  };
}

export function start(): Position {
  return fromFen();
}

export function clone(p: Position): Position {
  return { ...p, board: Int8Array.from(p.board) };
}

/**
 * Enough of the position to say "this has happened before".
 *
 * Placement, side, castling rights and the en-passant square — the same four
 * things the repetition rule names, and nothing else. Move counters must stay
 * out of it or no position ever repeats.
 */
export function key(p: Position): string {
  return `${p.board.join(',')}|${p.turn}|${p.castling}|${p.ep}`;
}

// ------------------------------------------------------------------- attacks

const KNIGHT_JUMPS = [
  [1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2],
];
const KING_STEPS = [
  [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1],
];
const ROOK_RAYS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const BISHOP_RAYS = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
const QUEEN_RAYS = [...ROOK_RAYS, ...BISHOP_RAYS];

const onBoard = (f: number, r: number) => f >= 0 && f < 8 && r >= 0 && r < 8;

/** Is `sq` attacked by anything of colour `by`? */
export function isAttacked(board: Int8Array, sq: number, by: Colour): boolean {
  const f = file(sq);
  const r = rank(sq);

  // Pawns attack forwards, so look backwards from the square.
  const back = by === WHITE ? -1 : 1;
  for (const df of [-1, 1]) {
    const nf = f + df;
    const nr = r + back;
    if (!onBoard(nf, nr)) continue;
    const p = board[square(nf, nr)];
    if (p && pieceColour(p) === by && pieceType(p) === PAWN) return true;
  }

  for (const [df, dr] of KNIGHT_JUMPS) {
    const nf = f + df;
    const nr = r + dr;
    if (!onBoard(nf, nr)) continue;
    const p = board[square(nf, nr)];
    if (p && pieceColour(p) === by && pieceType(p) === KNIGHT) return true;
  }

  for (const [df, dr] of KING_STEPS) {
    const nf = f + df;
    const nr = r + dr;
    if (!onBoard(nf, nr)) continue;
    const p = board[square(nf, nr)];
    if (p && pieceColour(p) === by && pieceType(p) === KING) return true;
  }

  for (const [df, dr] of QUEEN_RAYS) {
    const diagonal = df !== 0 && dr !== 0;
    let nf = f + df;
    let nr = r + dr;
    while (onBoard(nf, nr)) {
      const p = board[square(nf, nr)];
      if (p) {
        if (pieceColour(p) === by) {
          const t = pieceType(p);
          if (t === QUEEN || (diagonal ? t === BISHOP : t === ROOK)) return true;
        }
        break;
      }
      nf += df;
      nr += dr;
    }
  }

  return false;
}

export function kingSquare(board: Int8Array, c: Colour): number {
  const want = make(KING, c);
  for (let i = 0; i < 64; i++) if (board[i] === want) return i;
  return -1;
}

export function inCheck(p: Position, c: Colour = p.turn): boolean {
  const k = kingSquare(p.board, c);
  return k >= 0 && isAttacked(p.board, k, (1 - c) as Colour);
}

// ---------------------------------------------------------------- move making

/** Rights are lost when the king or a rook leaves — or when a rook is taken. */
const CORNER_RIGHT: Record<number, number> = {
  0: CASTLE_WQ,
  7: CASTLE_WK,
  56: CASTLE_BQ,
  63: CASTLE_BK,
};

export function makeMove(p: Position, m: Move): Position {
  const n = clone(p);
  const b = n.board;
  const moving = b[m.from];
  const c = pieceColour(moving);
  const t = pieceType(moving);

  const capturedSquare = m.enPassant ? m.to + (c === WHITE ? -8 : 8) : m.to;
  const captured = b[capturedSquare];

  b[capturedSquare] = 0;
  b[m.from] = 0;
  b[m.to] = m.promo ? make(m.promo, c) : moving;

  if (m.castle) {
    const home = c === WHITE ? 0 : 56;
    const [rookFrom, rookTo] = m.castle === 'k' ? [home + 7, home + 5] : [home, home + 3];
    b[rookTo] = b[rookFrom];
    b[rookFrom] = 0;
  }

  if (t === KING) n.castling &= c === WHITE ? ~(CASTLE_WK | CASTLE_WQ) : ~(CASTLE_BK | CASTLE_BQ);
  if (CORNER_RIGHT[m.from]) n.castling &= ~CORNER_RIGHT[m.from];
  if (CORNER_RIGHT[m.to]) n.castling &= ~CORNER_RIGHT[m.to];

  n.ep = m.double ? (m.from + m.to) / 2 : -1;
  n.halfmove = t === PAWN || captured ? 0 : p.halfmove + 1;
  if (c === BLACK) n.fullmove = p.fullmove + 1;
  n.turn = (1 - c) as Colour;
  return n;
}

// ------------------------------------------------------------ move generation

const PROMOTIONS: PieceType[] = [QUEEN, ROOK, BISHOP, KNIGHT];

function pawnMoves(p: Position, from: number, c: Colour, out: Move[]) {
  const b = p.board;
  const f = file(from);
  const r = rank(from);
  const dir = c === WHITE ? 1 : -1;
  const last = c === WHITE ? 7 : 0;
  const home = c === WHITE ? 1 : 6;

  const one = square(f, r + dir);
  if (onBoard(f, r + dir) && !b[one]) {
    if (r + dir === last) {
      for (const promo of PROMOTIONS) out.push({ from, to: one, promo });
    } else {
      out.push({ from, to: one });
      const two = square(f, r + dir * 2);
      if (r === home && !b[two]) out.push({ from, to: two, double: true });
    }
  }

  for (const df of [-1, 1]) {
    const nf = f + df;
    const nr = r + dir;
    if (!onBoard(nf, nr)) continue;
    const to = square(nf, nr);
    const target = b[to];
    if (target && pieceColour(target) !== c) {
      if (nr === last) {
        for (const promo of PROMOTIONS) out.push({ from, to, promo, captured: target });
      } else {
        out.push({ from, to, captured: target });
      }
    } else if (!target && to === p.ep) {
      out.push({ from, to, enPassant: true, captured: make(PAWN, (1 - c) as Colour) });
    }
  }
}

function stepMoves(p: Position, from: number, c: Colour, steps: number[][], out: Move[]) {
  const f = file(from);
  const r = rank(from);
  for (const [df, dr] of steps) {
    const nf = f + df;
    const nr = r + dr;
    if (!onBoard(nf, nr)) continue;
    const to = square(nf, nr);
    const target = p.board[to];
    if (target && pieceColour(target) === c) continue;
    out.push(target ? { from, to, captured: target } : { from, to });
  }
}

function rayMoves(p: Position, from: number, c: Colour, rays: number[][], out: Move[]) {
  const f = file(from);
  const r = rank(from);
  for (const [df, dr] of rays) {
    let nf = f + df;
    let nr = r + dr;
    while (onBoard(nf, nr)) {
      const to = square(nf, nr);
      const target = p.board[to];
      if (target) {
        if (pieceColour(target) !== c) out.push({ from, to, captured: target });
        break;
      }
      out.push({ from, to });
      nf += df;
      nr += dr;
    }
  }
}

function castleMoves(p: Position, c: Colour, out: Move[]) {
  const home = c === WHITE ? 0 : 56;
  const king = home + 4;
  if (p.board[king] !== make(KING, c)) return;
  const them = (1 - c) as Colour;
  if (isAttacked(p.board, king, them)) return;

  const kingSide = c === WHITE ? CASTLE_WK : CASTLE_BK;
  const queenSide = c === WHITE ? CASTLE_WQ : CASTLE_BQ;

  if (p.castling & kingSide && !p.board[home + 5] && !p.board[home + 6]) {
    // The square it passes over has to be safe as well as the one it lands on.
    if (!isAttacked(p.board, home + 5, them) && !isAttacked(p.board, home + 6, them)) {
      out.push({ from: king, to: home + 6, castle: 'k' });
    }
  }
  if (p.castling & queenSide && !p.board[home + 1] && !p.board[home + 2] && !p.board[home + 3]) {
    // b1 may be attacked — only the king's own two squares matter.
    if (!isAttacked(p.board, home + 3, them) && !isAttacked(p.board, home + 2, them)) {
      out.push({ from: king, to: home + 2, castle: 'q' });
    }
  }
}

/** Everything the side to move could play if the king were allowed to be taken. */
export function pseudoMoves(p: Position): Move[] {
  const out: Move[] = [];
  const c = p.turn;
  for (let i = 0; i < 64; i++) {
    const piece = p.board[i];
    if (!piece || pieceColour(piece) !== c) continue;
    switch (pieceType(piece)) {
      case PAWN: pawnMoves(p, i, c, out); break;
      case KNIGHT: stepMoves(p, i, c, KNIGHT_JUMPS, out); break;
      case BISHOP: rayMoves(p, i, c, BISHOP_RAYS, out); break;
      case ROOK: rayMoves(p, i, c, ROOK_RAYS, out); break;
      case QUEEN: rayMoves(p, i, c, QUEEN_RAYS, out); break;
      case KING: stepMoves(p, i, c, KING_STEPS, out); break;
    }
  }
  castleMoves(p, c, out);
  return out;
}

/** The legal ones: play each, and throw away any that leave your own king en prise. */
export function legalMoves(p: Position): Move[] {
  const c = p.turn;
  return pseudoMoves(p).filter((m) => !inCheck(makeMove(p, m), c));
}

export function movesFrom(p: Position, from: number): Move[] {
  return legalMoves(p).filter((m) => m.from === from);
}

// ------------------------------------------------------------------- outcomes

export type Outcome =
  | { over: false; check: boolean }
  | { over: true; result: 'checkmate' | 'stalemate' | 'fifty' | 'material' | 'repetition'; winner: Colour | null };

/**
 * Two knights and a lone king can in principle mate; they cannot force it, and
 * neither can anything smaller. The drawn material list is the standard one:
 * king alone, king and a minor piece, and king and bishop against king and
 * bishop of the same colour square.
 */
function deadPosition(board: Int8Array): boolean {
  const minors: { type: PieceType; light: boolean }[] = [];
  for (let i = 0; i < 64; i++) {
    const p = board[i];
    if (!p) continue;
    const t = pieceType(p);
    if (t === KING) continue;
    if (t === PAWN || t === ROOK || t === QUEEN) return false;
    minors.push({ type: t, light: ((file(i) + rank(i)) & 1) === 1 });
  }
  if (minors.length <= 1) return true;
  if (minors.length === 2 && minors.every((m) => m.type === BISHOP)) {
    return minors[0].light === minors[1].light;
  }
  return false;
}

export function outcome(p: Position, history: string[] = []): Outcome {
  const check = inCheck(p);
  if (legalMoves(p).length === 0) {
    if (check) return { over: true, result: 'checkmate', winner: (1 - p.turn) as Colour };
    return { over: true, result: 'stalemate', winner: null };
  }
  if (p.halfmove >= 100) return { over: true, result: 'fifty', winner: null };
  if (deadPosition(p.board)) return { over: true, result: 'material', winner: null };
  const k = key(p);
  if (history.filter((h) => h === k).length >= 3) {
    return { over: true, result: 'repetition', winner: null };
  }
  return { over: false, check };
}

// ------------------------------------------------------------------ notation

const LETTER: Record<PieceType, string> = { 1: '', 2: 'N', 3: 'B', 4: 'R', 5: 'Q', 6: 'K' };

/**
 * Standard algebraic, disambiguated the way the rules ask for it: by file if
 * that is enough, then by rank, then by both.
 */
export function toSan(p: Position, m: Move): string {
  const piece = p.board[m.from];
  const t = pieceType(piece);
  if (m.castle) return m.castle === 'k' ? 'O-O' : 'O-O-O';

  let s = LETTER[t];
  if (t === PAWN) {
    if (m.captured) s += NAMES[file(m.from)];
  } else {
    const rivals = legalMoves(p).filter(
      (o) => o.to === m.to && o.from !== m.from && pieceType(p.board[o.from]) === t,
    );
    if (rivals.length) {
      const sameFile = rivals.some((o) => file(o.from) === file(m.from));
      const sameRank = rivals.some((o) => rank(o.from) === rank(m.from));
      if (!sameFile) s += NAMES[file(m.from)];
      else if (!sameRank) s += String(rank(m.from) + 1);
      else s += squareName(m.from);
    }
  }
  if (m.captured) s += 'x';
  s += squareName(m.to);
  if (m.promo) s += `=${LETTER[m.promo]}`;

  const after = makeMove(p, m);
  if (inCheck(after)) s += legalMoves(after).length === 0 ? '#' : '+';
  return s;
}

/** Move counting, for testing the generator against known numbers. */
export function perft(p: Position, depth: number): number {
  if (depth === 0) return 1;
  const list = legalMoves(p);
  if (depth === 1) return list.length;
  let total = 0;
  for (const m of list) total += perft(makeMove(p, m), depth - 1);
  return total;
}
