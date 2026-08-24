/**
 * The maze on the back of the bill.
 *
 * Job presses printed puzzles on the reverse of handbills and packet inserts —
 * a maze, a word square, something to keep a child quiet while the adults
 * talked. This is that, with a line of Dostoevsky at the end of it instead of a
 * prize coupon.
 *
 * The maze is carved by recursive backtracking from a seed, so a given bill
 * always has the same maze and the same answer. The solution is found once at
 * build time and the letters of the answer are dropped along it, which means
 * the only way to collect them in order is to walk the true path.
 */

export interface Cell {
  /** Walls, clockwise from the top. */
  n: boolean;
  e: boolean;
  s: boolean;
  w: boolean;
}

export interface Maze {
  size: number;
  cells: Cell[][];
  /** Cell indices, entrance first, exit last. */
  path: [number, number][];
  /** One letter per stop, in path order. */
  letters: { at: [number, number]; ch: string }[];
  answer: string;
}

function rng(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const OPP = { n: 's', e: 'w', s: 'n', w: 'e' } as const;
const STEP: Record<keyof Cell, [number, number]> = {
  n: [0, -1],
  e: [1, 0],
  s: [0, 1],
  w: [-1, 0],
};

/**
 * Carve a perfect maze — one route between any two cells, no loops — then read
 * off the route from the top-left to the bottom-right.
 */
export function buildMaze(seed: string, size: number, answer: string): Maze {
  const r = rng(`maze:${seed}`);
  const cells: Cell[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => ({ n: true, e: true, s: true, w: true })),
  );
  const seen = Array.from({ length: size }, () => new Array(size).fill(false));

  const stack: [number, number][] = [[0, 0]];
  seen[0][0] = true;
  while (stack.length) {
    const [x, y] = stack[stack.length - 1];
    const open = (Object.keys(STEP) as (keyof Cell)[]).filter((d) => {
      const nx = x + STEP[d][0];
      const ny = y + STEP[d][1];
      return nx >= 0 && ny >= 0 && nx < size && ny < size && !seen[ny][nx];
    });
    if (!open.length) {
      stack.pop();
      continue;
    }
    const d = open[Math.floor(r() * open.length)];
    const nx = x + STEP[d][0];
    const ny = y + STEP[d][1];
    cells[y][x][d] = false;
    cells[ny][nx][OPP[d]] = false;
    seen[ny][nx] = true;
    stack.push([nx, ny]);
  }

  // A perfect maze has exactly one route, so a depth-first walk finds it.
  const goal: [number, number] = [size - 1, size - 1];
  const came = new Map<string, [number, number]>();
  const done = new Set<string>(['0,0']);
  const queue: [number, number][] = [[0, 0]];
  while (queue.length) {
    const [x, y] = queue.shift()!;
    if (x === goal[0] && y === goal[1]) break;
    for (const d of Object.keys(STEP) as (keyof Cell)[]) {
      if (cells[y][x][d]) continue;
      const nx = x + STEP[d][0];
      const ny = y + STEP[d][1];
      const k = `${nx},${ny}`;
      if (done.has(k)) continue;
      done.add(k);
      came.set(k, [x, y]);
      queue.push([nx, ny]);
    }
  }
  const path: [number, number][] = [];
  for (let c: [number, number] | undefined = goal; c; c = came.get(`${c[0]},${c[1]}`)) {
    path.unshift(c);
    if (c[0] === 0 && c[1] === 0) break;
  }

  // Space the letters evenly down the route, never on the entrance itself.
  const chars = answer.replace(/[^A-Za-z]/g, '').toUpperCase().split('');
  const letters = chars.map((ch, i) => ({
    at: path[Math.min(path.length - 1, Math.round(((i + 1) / chars.length) * (path.length - 1)))],
    ch,
  }));

  return { size, cells, path, letters, answer };
}

/** Can you step from one cell to its neighbour? */
export function canStep(m: Maze, x: number, y: number, d: keyof Cell): boolean {
  if (x < 0 || y < 0 || x >= m.size || y >= m.size) return false;
  return !m.cells[y][x][d];
}
