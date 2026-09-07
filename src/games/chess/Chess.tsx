import { useCallback, useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { Board, type Man } from './Board';
import { SIDES } from './look';
import { chooseMove, sideName, type Level } from './ai';
import {
  BLACK, KING, PAWN, QUEEN, WHITE,
  kingSquare, key, legalMoves, makeMove, outcome, pieceColour, pieceType, start, toSan,
  type Colour, type Move, type PieceType, type Position,
} from './rules';
import { sfx } from '../../lib/audio';

/**
 * Jelly chess.
 *
 * The rules are the whole rules — castling, en passant, promotion, the
 * fifty-move rule, dead positions and threefold repetition — and they were
 * checked by counting: the move generator produces the published node counts
 * for the six standard test positions to four ply, which is the only way to
 * know that a chess program is right rather than plausible.
 */

const GLYPH: Record<PieceType, [string, string]> = {
  1: ['♙', '♟'], 2: ['♘', '♞'], 3: ['♗', '♝'], 4: ['♖', '♜'], 5: ['♕', '♛'], 6: ['♔', '♚'],
};

interface Snapshot {
  pos: Position;
  men: Man[];
  san: string;
  last: { from: number; to: number } | null;
}

function menFromPosition(p: Position): Man[] {
  const men: Man[] = [];
  let id = 0;
  for (let i = 0; i < 64; i++) {
    const piece = p.board[i];
    if (!piece) continue;
    men.push({ id: id++, type: pieceType(piece), colour: pieceColour(piece), at: i, taken: false });
  }
  return men;
}

/**
 * Move the men to match a move on the board.
 *
 * The men are tracked separately from the position because a piece needs an
 * identity that survives the move — without one there is nothing to animate,
 * only a board that looks different from one frame to the next.
 */
function applyToMen(men: Man[], m: Move, mover: Colour): Man[] {
  const capturedSquare = m.enPassant ? m.to + (mover === WHITE ? -8 : 8) : m.to;
  return men.map((man) => {
    if (man.taken) return man;
    if (man.at === capturedSquare && man.at !== m.from) return { ...man, taken: true };
    if (man.at === m.from) return { ...man, at: m.to, type: m.promo ?? man.type };
    if (m.castle) {
      const home = mover === WHITE ? 0 : 56;
      const [rookFrom, rookTo] = m.castle === 'k' ? [home + 7, home + 5] : [home, home + 3];
      if (man.at === rookFrom) return { ...man, at: rookTo };
    }
    return man;
  });
}

export type Opponent = 'human' | Level;

const OPPONENTS: { id: Opponent; name: string }[] = [
  { id: 'human', name: 'Two players' },
  { id: 'gentle', name: 'Gentle' },
  { id: 'steady', name: 'Steady' },
  { id: 'sharp', name: 'Sharp' },
];

export function Chess({ onExit }: { onExit: () => void }) {
  const [pos, setPos] = useState<Position>(start);
  const [men, setMen] = useState<Man[]>(() => menFromPosition(start()));
  const [past, setPast] = useState<Snapshot[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [opponent, setOpponent] = useState<Opponent>('steady');
  const [last, setLast] = useState<{ from: number; to: number } | null>(null);
  const [pending, setPending] = useState<{ from: number; to: number } | null>(null);
  const [thinking, setThinking] = useState(false);

  /** Positions seen, for the repetition rule. */
  const seen = useMemo(() => past.map((s) => key(s.pos)).concat(key(pos)), [past, pos]);
  const state = useMemo(() => outcome(pos, seen), [pos, seen]);
  const moves = useMemo(() => (state.over ? [] : legalMoves(pos)), [pos, state.over]);

  // Deduplicated, because a pawn reaching the last rank has four moves to the
  // same square — which is four discs stacked on it and four React children
  // with the same key.
  const targets = useMemo(
    () =>
      selected === null
        ? []
        : [...new Set(moves.filter((m) => m.from === selected).map((m) => m.to))],
    [moves, selected],
  );

  /** Whose turn it is to be clicked on. The computer's men are not yours. */
  const yours = opponent === 'human' || pos.turn === WHITE;
  const alarm = !state.over && state.check ? kingSquare(pos.board, pos.turn) : null;

  const play = useCallback(
    (m: Move) => {
      const mover = pos.turn;
      const san = toSan(pos, m);
      setPast((h) => [...h, { pos, men, san, last }]);
      setMen((old) => applyToMen(old, m, mover));
      setPos(makeMove(pos, m));
      setLast({ from: m.from, to: m.to });
      setSelected(null);
      sfx.tick();
    },
    [pos, men, last],
  );

  const pick = useCallback(
    (sq: number) => {
      if (state.over || pending || thinking || !yours) return;
      const here = pos.board[sq];

      // Clicking one of your own is always a new selection, so a change of mind
      // never has to go through an empty square first.
      if (here && pieceColour(here) === pos.turn) {
        setSelected(sq === selected ? null : sq);
        return;
      }
      if (selected === null) return;

      const options = moves.filter((m) => m.from === selected && m.to === sq);
      if (options.length === 0) {
        setSelected(null);
        return;
      }
      // A pawn reaching the far rank has four moves to the same square, so the
      // choice has to be asked for rather than assumed.
      if (options.length > 1 && options[0].promo) {
        setPending({ from: selected, to: sq });
        return;
      }
      play(options[0]);
    },
    [state.over, pending, thinking, yours, pos, selected, moves, play],
  );

  const promote = useCallback(
    (t: PieceType) => {
      if (!pending) return;
      const m = moves.find((x) => x.from === pending.from && x.to === pending.to && x.promo === t);
      setPending(null);
      if (m) play(m);
    },
    [pending, moves, play],
  );

  // The computer's turn. Deliberately late, so the piece that was just moved
  // has landed and the board has been looked at before anything else happens.
  useEffect(() => {
    if (opponent === 'human' || pos.turn !== BLACK || state.over || pending) return;
    setThinking(true);
    const t = setTimeout(() => {
      const m = chooseMove(pos, opponent);
      setThinking(false);
      if (m) play(m);
    }, 420);
    return () => {
      clearTimeout(t);
      setThinking(false);
    };
  }, [opponent, pos, state.over, pending, play]);

  /** Back to the last position that was yours to move. */
  const undo = useCallback(() => {
    setPast((h) => {
      if (!h.length) return h;
      let i = h.length - 1;
      if (opponent !== 'human') {
        while (i > 0 && h[i].pos.turn !== WHITE) i--;
      }
      const snap = h[i];
      setPos(snap.pos);
      setMen(snap.men);
      setLast(snap.last);
      setSelected(null);
      setPending(null);
      return h.slice(0, i);
    });
    sfx.paper();
  }, [opponent]);

  const reset = useCallback(() => {
    const p = start();
    setPos(p);
    setMen(menFromPosition(p));
    setPast([]);
    setSelected(null);
    setLast(null);
    setPending(null);
    sfx.paper();
  }, []);

  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (pending) setPending(null);
        else if (selected !== null) setSelected(null);
        else onExit();
      }
      if (e.key === 'f') setFlipped((v) => !v);
      if (e.key === 'u') undo();
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, [onExit, pending, selected, undo]);

  const taken = useMemo(() => {
    const out: Record<Colour, PieceType[]> = { 0: [], 1: [] };
    for (const m of men) if (m.taken) out[m.colour].push(m.type);
    for (const c of [WHITE, BLACK] as Colour[]) out[c].sort((a, b) => b - a);
    return out;
  }, [men]);

  const pairs = useMemo(() => {
    const sans = past.map((s) => s.san);
    const rows: { n: number; w: string; b: string }[] = [];
    for (let i = 0; i < sans.length; i += 2) {
      rows.push({ n: i / 2 + 1, w: sans[i], b: sans[i + 1] ?? '' });
    }
    return rows;
  }, [past]);

  const status = state.over
    ? state.result === 'checkmate'
      ? `${sideName(state.winner!)} wins by checkmate`
      : state.result === 'stalemate'
        ? 'Stalemate — a draw'
        : state.result === 'fifty'
          ? 'Draw by the fifty-move rule'
          : state.result === 'material'
            ? 'Draw — neither side can mate'
            : 'Draw by repetition'
    : thinking
      ? 'Thinking…'
      : `${sideName(pos.turn)} to move${state.check ? ' — check' : ''}`;

  return (
    <div className="chess">
      <div className="chess__stage">
        <Canvas
          shadows
          dpr={[1, 1.75]}
          camera={{ position: [0, 10, 10], fov: 30, near: 0.5, far: 90 }}
          gl={{ antialias: true, alpha: false }}
          onCreated={({ gl }) => {
            gl.toneMapping = THREE.NeutralToneMapping;
            gl.toneMappingExposure = 1;
            gl.shadowMap.type = THREE.PCFSoftShadowMap;
          }}
        >
          <Board
            men={men}
            flipped={flipped}
            selected={selected}
            targets={targets}
            alarm={alarm}
            last={last}
            onPick={pick}
          />
        </Canvas>
      </div>

      <div className="chess__title glass">
        <div className="chess__eyebrow">lemon · blackcurrant · one set</div>
        <h1>Set in Jelly</h1>
      </div>

      <div className="chess__exit">
        <button className="glass glass--btn" onClick={onExit}>← Shelf</button>
      </div>

      <div className="chess__status glass">
        <div className={`chess__turn${state.over ? ' is-over' : ''}`}>{status}</div>
        <div className="chess__trays">
          {([WHITE, BLACK] as Colour[]).map((c) => (
            <div key={c} className="chess__tray">
              <span className="chess__side" style={{ ['--sw' as string]: SIDES[c].swatch }} />
              <span className="chess__glyphs">
                {taken[c].length ? taken[c].map((t, i) => <span key={i}>{GLYPH[t][c]}</span>) : <em>—</em>}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="chess__moves glass">
        <div className="chess__label">Moves</div>
        <ol className="chess__list">
          {pairs.length === 0 && <li className="chess__empty">Nothing yet.</li>}
          {pairs.map((r) => (
            <li key={r.n}>
              <span className="chess__no">{r.n}.</span>
              <span>{r.w}</span>
              <span>{r.b}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="chess__controls glass">
        <div className="chess__opponents">
          {OPPONENTS.map((o) => (
            <button
              key={o.id}
              className={`chess__opp${o.id === opponent ? ' is-on' : ''}`}
              aria-pressed={o.id === opponent}
              onClick={() => {
                sfx.tick();
                setOpponent(o.id);
              }}
            >
              {o.name}
            </button>
          ))}
        </div>
        <div className="chess__buttons">
          <button className="chess__btn" onClick={reset}>New game</button>
          <button className="chess__btn" onClick={undo} disabled={!past.length}>Take back</button>
          <button className="chess__btn" onClick={() => { sfx.tick(); setFlipped((v) => !v); }}>Turn the board</button>
        </div>
      </div>

      {pending && (
        <div className="chess__ask" onClick={() => setPending(null)}>
          <div className="glass chess__askinner" onClick={(e) => e.stopPropagation()}>
            <div className="chess__label">It reaches the end. What does it become?</div>
            <div className="chess__promos">
              {([QUEEN, 4, 3, 2] as PieceType[]).map((t) => (
                <button key={t} className="chess__promo" onClick={() => promote(t)}>
                  <span style={{ color: SIDES[pos.turn].swatch }}>{GLYPH[t][pos.turn]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="chess__hint">
        Click a piece, then a square. <kbd>F</kbd> turns the board, <kbd>U</kbd> takes a move back.
      </div>
    </div>
  );
}

export { PAWN, KING };
