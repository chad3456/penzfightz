import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { buildMaze, canStep, type Cell } from './maze';
import { stampPath } from '../bookstall/rosette';
import { Rosette } from '../bookstall/Rosette';
import { QUOTES, STALL, type Quote } from '../bookstall/quotes';
import { sfx } from '../../lib/audio';

/**
 * The back of the bill.
 *
 * Job presses printed a maze on the reverse of handbills to keep a child quiet
 * while the adults talked. Walk this one and you collect, in order, the letters
 * of a word that has been cut out of a line of Dostoevsky. Reach the end and
 * the stall prints you the line with the word put back.
 *
 * Everything is stamped rather than drawn, in the same hand as the flower.
 */

const SIZE = 9;
const KEY_KEY = 'backbench.maze.solved';

/** The word the line turns on: its longest, most particular one. */
function keyWord(q: Quote): string {
  const words = q.text
    .replace(/[^A-Za-z' ]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 5 && w.length <= 9 && !/'/.test(w));
  if (!words.length) return 'DOSTOEVSKY'.slice(0, 7);
  words.sort((a, b) => b.length - a.length || a.localeCompare(b));
  return words[0].toUpperCase();
}

function pickQuote(n: number): Quote {
  // Only lines with a word worth hiding, and cited ones first — the bill at the
  // end of a maze ought to be one we can point to a chapter for.
  const good = QUOTES.filter((q) => keyWord(q).length >= 5);
  const cited = good.filter((q) => q.ref);
  const pool = cited.length > 8 ? cited : good;
  return pool[n % pool.length];
}

export function Maze({ onExit }: { onExit: () => void }) {
  const [round, setRound] = useState(() => Math.floor(Math.random() * 997));
  const quote = useMemo(() => pickQuote(round), [round]);
  const answer = useMemo(() => keyWord(quote), [quote]);
  const maze = useMemo(
    () => buildMaze(`${quote.id}:${round}`, SIZE, answer),
    [quote.id, round, answer],
  );

  const [at, setAt] = useState<[number, number]>([0, 0]);
  const [got, setGot] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const [solved, setSolved] = useState<number>(() => {
    try {
      return Number(localStorage.getItem(KEY_KEY) ?? '0') || 0;
    } catch {
      return 0;
    }
  });

  const paper = useRef<HTMLCanvasElement | null>(null);
  const ink = useRef<HTMLCanvasElement | null>(null);
  const box = 34;
  const pad = 16;
  const px = box * SIZE + pad * 2;

  // ------------------------------------------------------- draw the maze once
  useEffect(() => {
    const c = paper.current;
    if (!c) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = px * dpr;
    c.height = px * dpr;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, px, px);
    ctx.fillStyle = '#2f323a';

    let travelled = 0;
    const at2 = (x: number, y: number): [number, number] => [pad + x * box, pad + y * box];
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const cell = maze.cells[y][x];
        const walls: [keyof Cell, [number, number], [number, number]][] = [
          ['n', at2(x, y), at2(x + 1, y)],
          ['w', at2(x, y), at2(x, y + 1)],
        ];
        if (x === SIZE - 1) walls.push(['e', at2(x + 1, y), at2(x + 1, y + 1)]);
        if (y === SIZE - 1) walls.push(['s', at2(x, y + 1), at2(x + 1, y + 1)]);
        for (const [d, a, b] of walls) {
          if (!cell[d]) continue;
          // The way in and the way out are the two gaps in the border.
          if (d === 'n' && x === 0 && y === 0) continue;
          if (d === 's' && x === SIZE - 1 && y === SIZE - 1) continue;
          travelled = stampPath(ctx, [a, b], {
            weight: 1.5,
            starve: 0.22,
            seed: `${quote.id}:${x},${y},${d}`,
            travelled,
          });
        }
      }
    }
  }, [maze, px, quote.id]);

  // ------------------------------------------------------------- draw progress
  useEffect(() => {
    const c = ink.current;
    if (!c) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = px * dpr;
    c.height = px * dpr;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, px, px);

    // Letters still waiting to be picked up.
    ctx.font = '600 13px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    maze.letters.forEach((l, i) => {
      if (i < got.length) return;
      ctx.fillStyle = 'rgba(60, 64, 74, 0.34)';
      ctx.fillText(l.ch, pad + l.at[0] * box + box / 2, pad + l.at[1] * box + box / 2);
    });

    // Where you are.
    const cx = pad + at[0] * box + box / 2;
    const cy = pad + at[1] * box + box / 2;
    ctx.fillStyle = '#8a2b2b';
    ctx.beginPath();
    ctx.arc(cx, cy, 5.5, 0, Math.PI * 2);
    ctx.fill();
  }, [at, got.length, maze, px]);

  // -------------------------------------------------------------------- moving
  const move = useCallback(
    (d: keyof Cell) => {
      if (done) return;
      setAt(([x, y]) => {
        if (!canStep(maze, x, y, d)) {
          return [x, y];
        }
        const nx = x + (d === 'e' ? 1 : d === 'w' ? -1 : 0);
        const ny = y + (d === 's' ? 1 : d === 'n' ? -1 : 0);
        setGot((g) => {
          const next = maze.letters[g.length];
          if (next && next.at[0] === nx && next.at[1] === ny) {
            sfx.tick();
            return [...g, next.ch];
          }
          return g;
        });
        if (nx === SIZE - 1 && ny === SIZE - 1) {
          setDone(true);
          sfx.printer();
          setSolved((s) => {
            const n = s + 1;
            try {
              localStorage.setItem(KEY_KEY, String(n));
            } catch {
              /* private window */
            }
            return n;
          });
        }
        return [nx, ny];
      });
    },
    [maze, done],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const d = (
        { ArrowUp: 'n', ArrowRight: 'e', ArrowDown: 's', ArrowLeft: 'w', w: 'n', d: 'e', s: 's', a: 'w' } as Record<
          string,
          keyof Cell
        >
      )[e.key];
      if (!d) return;
      e.preventDefault();
      move(d);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [move]);

  /** Tapping a neighbouring square steps into it, for anyone without a keyboard. */
  const tap = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const r = e.currentTarget.getBoundingClientRect();
      const gx = Math.floor(((e.clientX - r.left) / r.width) * px - pad) / box;
      const gy = Math.floor(((e.clientY - r.top) / r.height) * px - pad) / box;
      const dx = Math.floor(gx) - at[0];
      const dy = Math.floor(gy) - at[1];
      if (Math.abs(dx) + Math.abs(dy) !== 1) return;
      move(dx === 1 ? 'e' : dx === -1 ? 'w' : dy === 1 ? 's' : 'n');
    },
    [at, move, px],
  );

  const again = useCallback(() => {
    setRound((n) => n + 1 + Math.floor(Math.random() * 5));
    setAt([0, 0]);
    setGot([]);
    setDone(false);
    sfx.paper();
  }, []);

  const blanked = useMemo(
    () => quote.text.replace(new RegExp(`\\b${answer}\\b`, 'i'), '—'.repeat(6)),
    [quote.text, answer],
  );

  return (
    <div className="stall">
      <div className="stall__sign">
        <div className="stall__signname">THE BACK OF THE BILL</div>
        <div className="stall__signsub">
          A word has been cut out of a line. Walk the only road through and pick it up.
        </div>
      </div>

      {!done ? (
        <>
          <div className="maze__riddle">&ldquo;{blanked}&rdquo;</div>

          <div className="maze__board" onPointerDown={tap} style={{ width: px, height: px }}>
            <canvas ref={paper} style={{ width: px, height: px }} />
            <canvas ref={ink} style={{ width: px, height: px }} />
          </div>

          <div className="maze__slots">
            {answer.split('').map((ch, i) => (
              <span key={i} className={`maze__slot${i < got.length ? ' maze__slot--on' : ''}`}>
                {i < got.length ? ch : ''}
              </span>
            ))}
          </div>
          <div className="maze__hint">
            arrow keys, or tap the square next to you · {got.length} of {answer.length} letters
          </div>
        </>
      ) : (
        <div className="rcpt-slot">
          <div className="rcpt">
            <div className="rcpt__head">
              <div className="rcpt__shop">{STALL.name}</div>
              <div className="rcpt__sub">{STALL.line2}</div>
              <div className="rcpt__sub">PUZZLE COUNTER · NO PRIZE</div>
            </div>
            <div className="rcpt__rule" />
            <pre className="rcpt__line">{`ANSWER   ${answer}`}</pre>
            <pre className="rcpt__line rcpt__line--faint">{`MAZE     ${SIZE} x ${SIZE}`}</pre>
            <div className="rcpt__rule rcpt__rule--dash" />

            <blockquote className="rcpt__quote">
              <span className="rcpt__mark">&ldquo;</span>
              {quote.text}
              <span className="rcpt__mark">&rdquo;</span>
            </blockquote>
            <div className="rcpt__attr">
              — {quote.work}, {quote.year}
              {quote.ref && (
                <>
                  <br />
                  <span className="rcpt__ref">{quote.ref}</span>
                </>
              )}
            </div>

            <div className="rcpt__stamp">
              <Rosette seed={`${quote.id}:maze`} size={104} />
            </div>

            <div className="rcpt__foot">
              <div>MAZES SOLVED — {solved}</div>
              <div className="rcpt__thanks">COME BACK FOR ANOTHER</div>
            </div>
          </div>
        </div>
      )}

      <div className="stall__counter">
        {done && (
          <button className="stall__start" onClick={again}>
            Another maze
          </button>
        )}
        <div className="btn-row">
          {!done && (
            <button className="btn btn--small" style={{ flex: 1 }} onClick={again}>
              Different maze
            </button>
          )}
        </div>
        <button className="btn btn--ghost" onClick={onExit}>
          Back to the shelf
        </button>
      </div>
    </div>
  );
}
