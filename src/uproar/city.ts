/**
 * UPROAR — the city.
 *
 * A grid of blocks and streets, seven districts, each with a plaza and a
 * landmark at its heart, City Hall in the middle, a harbour to the east.
 * Everything is generated from a seed: the lots, the heights, the colours.
 */

export const BLOCK = 18;
export const ROAD = 8;
export const CELL = BLOCK + ROAD;
export const COLS = 7;
export const ROWS = 5;
export const W = COLS * CELL + ROAD;
export const D = ROWS * CELL + ROAD;
export const SIDEWALK = 1.6;

export type DistrictId = 'oldtown' | 'market' | 'finance' | 'campus' | 'arts' | 'docks' | 'hall';

export interface District {
  id: DistrictId;
  name: string;
  tag: string;
  need: number;            // followers needed to occupy its plaza
  plaza: [number, number]; // col, row
  hue: string;             // the district's own colour
  heights: [number, number];
  palette: string[];
  landmark: 'clock' | 'fountain' | 'cube' | 'library' | 'sculpture' | 'crane' | 'dome';
}

export const DISTRICTS: District[] = [
  { id: 'oldtown', name: 'Old Town', tag: 'cobbles, cafés and a clock that is always wrong', need: 15, plaza: [1, 1], hue: '#ffb03a', heights: [6, 13], palette: ['#e8b98f', '#d98f6f', '#f0d3a8', '#c77b62', '#e6c7a0'], landmark: 'clock' },
  { id: 'market', name: 'Market', tag: 'stalls, pigeons and loud opinions', need: 30, plaza: [3, 0], hue: '#ff5d3a', heights: [7, 16], palette: ['#f2c14e', '#e98a5d', '#f4dfb4', '#d9a15a', '#ecb07b'], landmark: 'fountain' },
  { id: 'campus', name: 'Campus', tag: 'libraries, lawns and a thousand petitions', need: 40, plaza: [0, 3], hue: '#34d6a8', heights: [8, 18], palette: ['#b7654c', '#c9876a', '#a55a45', '#d9b39a', '#8f4f3f'], landmark: 'library' },
  { id: 'arts', name: 'Arts Quarter', tag: 'murals, studios and nobody awake before noon', need: 50, plaza: [3, 3], hue: '#b46cff', heights: [6, 20], palette: ['#7fd1c7', '#f28fb1', '#f6d365', '#9aa6ff', '#ffb38a'], landmark: 'sculpture' },
  { id: 'docks', name: 'The Docks', tag: 'cranes, fish and very strong tea', need: 45, plaza: [6, 4], hue: '#35b6ff', heights: [6, 11], palette: ['#8a9aa8', '#6f7f8c', '#b0a38c', '#9c8570', '#7a8d7a'], landmark: 'crane' },
  { id: 'finance', name: 'Financial District', tag: 'glass towers that would prefer you went home', need: 70, plaza: [5, 1], hue: '#ffe13a', heights: [20, 58], palette: ['#a9c4d8', '#8fb0c6', '#c9d6df', '#6f8fa6', '#b4c7c9'], landmark: 'cube' },
  { id: 'hall', name: 'City Hall', tag: 'where the city is ruled from, for now', need: 160, plaza: [3, 2], hue: '#ff2e88', heights: [0, 0], palette: ['#f1ece2'], landmark: 'dome' },
];
export const DISTRICT_BY_ID = Object.fromEntries(DISTRICTS.map((d) => [d.id, d])) as Record<DistrictId, District>;

/** Which district each block belongs to, row by row. */
const MAP: DistrictId[][] = [
  ['oldtown', 'oldtown', 'market', 'market', 'market', 'finance', 'finance'],
  ['oldtown', 'oldtown', 'market', 'market', 'market', 'finance', 'finance'],
  ['campus', 'campus', 'arts', 'hall', 'arts', 'finance', 'finance'],
  ['campus', 'campus', 'arts', 'arts', 'arts', 'docks', 'docks'],
  ['campus', 'campus', 'arts', 'arts', 'arts', 'docks', 'docks'],
];
export const districtAt = (c: number, r: number): DistrictId => MAP[Math.max(0, Math.min(ROWS - 1, r))]![Math.max(0, Math.min(COLS - 1, c))]!;

/** Centre of block (c, r). */
export function blockCenter(c: number, r: number): [number, number] {
  return [-W / 2 + ROAD + c * CELL + BLOCK / 2, -D / 2 + ROAD + r * CELL + BLOCK / 2];
}
/** Street intersection (i, j), i in 0..COLS, j in 0..ROWS. */
export function node(i: number, j: number): [number, number] {
  return [-W / 2 + ROAD / 2 + i * CELL, -D / 2 + ROAD / 2 + j * CELL];
}
/** The block a point is in (or null on a street). */
export function blockOf(x: number, z: number): [number, number] | null {
  const lx = x + W / 2 - ROAD, lz = z + D / 2 - ROAD;
  const c = Math.floor(lx / CELL), r = Math.floor(lz / CELL);
  if (c < 0 || r < 0 || c >= COLS || r >= ROWS) return null;
  const ox = lx - c * CELL, oz = lz - r * CELL;
  if (ox > BLOCK || oz > BLOCK) return null;
  return [c, r];
}
export function districtOfPoint(x: number, z: number): DistrictId {
  const lx = x + W / 2 - ROAD / 2, lz = z + D / 2 - ROAD / 2;
  return districtAt(Math.floor(lx / CELL), Math.floor(lz / CELL));
}
export const isPlaza = (c: number, r: number) => DISTRICTS.some((d) => d.plaza[0] === c && d.plaza[1] === r);
/** Parks: open, walkable, with trees. */
export const PARKS: [number, number][] = [[1, 3], [0, 1], [4, 4]];
export const isPark = (c: number, r: number) => PARKS.some(([a, b]) => a === c && b === r);
export const isOpen = (c: number, r: number) => isPlaza(c, r) || isPark(c, r);

export interface Building {
  id: number;
  x: number; z: number; w: number; d: number; h: number;
  district: DistrictId;
  color: string;
  glass: boolean;
  roof: 'flat' | 'gable';
  block: [number, number];
}

function rng(seed: number) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

export function buildCity() {
  const R = rng(4242);
  const buildings: Building[] = [];
  let id = 0;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (isOpen(c, r)) continue;
      const dist = DISTRICT_BY_ID[districtAt(c, r)];
      const [cx, cz] = blockCenter(c, r);
      const inner = BLOCK - SIDEWALK * 2;
      // cut the block into lots: 2×2, 3×2, or one big tower
      const tall = dist.id === 'finance';
      const nx = tall ? (R() < 0.5 ? 1 : 2) : R() < 0.5 ? 2 : 3;
      const nz = tall ? (R() < 0.5 ? 1 : 2) : 2;
      const lw = inner / nx, ld = inner / nz;
      for (let i = 0; i < nx; i++) {
        for (let k = 0; k < nz; k++) {
          const gap = 0.5;
          const w = lw - gap, d = ld - gap;
          const x = cx - inner / 2 + lw * (i + 0.5), z = cz - inner / 2 + ld * (k + 0.5);
          const [h0, h1] = dist.heights;
          const h = h0 + Math.pow(R(), tall ? 0.8 : 1.4) * (h1 - h0);
          buildings.push({
            id: id++, x, z, w: w * (0.86 + R() * 0.14), d: d * (0.86 + R() * 0.14), h,
            district: dist.id, color: dist.palette[Math.floor(R() * dist.palette.length)]!,
            glass: tall || (dist.id === 'arts' && R() < 0.15), roof: dist.id === 'oldtown' || (dist.id === 'campus' && R() < 0.5) ? 'gable' : 'flat', block: [c, r],
          });
        }
      }
    }
  }
  return { buildings };
}

/** Rectangles you cannot walk through: every built block, less its pavement. */
export function solidBlocks() {
  const out: { x0: number; z0: number; x1: number; z1: number }[] = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    if (isOpen(c, r)) continue;
    const [cx, cz] = blockCenter(c, r);
    const h = BLOCK / 2 - SIDEWALK;
    out.push({ x0: cx - h, z0: cz - h, x1: cx + h, z1: cz + h });
  }
  // City Hall itself sits on the back half of its plaza
  const [hx, hz] = blockCenter(3, 2);
  out.push({ x0: hx - 6, z0: hz - 8.5, x1: hx + 6, z1: hz - 2.5 });
  return out;
}
