/**
 * The panorama: one long side-on view of Petersburg along the water, laid out
 * once from a seed. Left to right: the countryside beyond the city gate, the
 * gate itself, the streets along the Fontanka, then the canal embankment with
 * a bridge over a side canal, Nastenka's lane and the seat.
 *
 * Everything here is data; painter.ts draws it.
 */

import { P } from './story';

export const WATER = 660;
export const PAVE = 612;
export const FACADE_BASE = 600;
export const WORLD_W = 12000;
export const COUNTRY_END = 2560;
export const STREETS_START = 2880;

export function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Building = {
  x: number;
  w: number;
  floors: number;
  color: string;
  trim: string;
  roof: string;
  style: 'plain' | 'pilasters' | 'portico' | 'rusticated' | 'small';
  bays: number;
  balcony: boolean;
  attic: boolean;
  seed: number;
  /** The little house the dreamer loves, which is being painted yellow. */
  friend?: boolean;
};

/** Petersburg's stucco colours: ochre, straw, salmon, celadon, powder blue, rose, cream. */
const STUCCO = ['#e2bd72', '#ecd07e', '#e3a68b', '#b5c9a2', '#a8bdd0', '#e5b4b0', '#eadbbd', '#d5bf98', '#c2b4d2', '#d9c37c'];
const ROOFS = ['#5e6b60', '#6a5a50', '#56626e', '#7a5848'];

export type Gap = { x: number; w: number; kind: 'bridge' | 'lane' };
export type Lamp = { x: number; y: number; ornate: boolean };
export type Tree = { x: number; h: number; kind: 'birch' | 'blossom' | 'lime'; seed: number };

export type Far = { at: number; kind: 'dome' | 'spire' | 'spireTall' | 'cupola' | 'roofs' | 'hills' | 'tower'; w: number; h: number; seed: number };

export type World = {
  buildings: Building[];
  gaps: Gap[];
  lamps: Lamp[];
  trees: Tree[];
  far: Far[];
  dacha: { x: number };
  barrier: { x: number };
  seat: { x: number };
  tower: { at: number };
};

export function buildWorld(): World {
  const r = rng(1848);
  const buildings: Building[] = [];
  const gaps: Gap[] = [
    { x: P.BRIDGE - 150, w: 300, kind: 'bridge' },
    { x: P.LANE - 60, w: 120, kind: 'lane' },
  ];
  let x = STREETS_START + 120;
  while (x < WORLD_W) {
    const gap = gaps.find((g) => x + 60 > g.x && x < g.x + g.w);
    if (gap) { x = gap.x + gap.w; continue; }
    let w = 200 + Math.floor(r() * 5) * 44;
    const next = gaps.find((g) => g.x > x);
    if (next && x + w > next.x) w = next.x - x;
    if (w < 90) { x += w; continue; }
    const friend = x <= P.YELLOW && x + w > P.YELLOW;
    if (friend) {
      // a small two-storey house of its own, with columns
      const fx = P.YELLOW - 120;
      if (fx - x > 90) buildings.push(mk(x, fx - x, r));
      buildings.push({ x: fx, w: 240, floors: 2, color: '#efc1c3', trim: '#f8f1ea', roof: '#6a5a50', style: 'portico', bays: 3, balcony: false, attic: true, seed: 77, friend: true });
      x = fx + 240;
      continue;
    }
    buildings.push(mk(x, w, r));
    x += w;
  }
  const lamps: Lamp[] = [];
  for (let lx = STREETS_START + 200; lx < WORLD_W; lx += 330) {
    if (gaps.some((g) => lx > g.x - 30 && lx < g.x + g.w + 30)) continue;
    lamps.push({ x: lx, y: 0, ornate: lx > P.CANAL });
  }
  lamps.push({ x: P.BRIDGE - 170, y: 0, ornate: true }, { x: P.BRIDGE + 170, y: 0, ornate: true });
  const trees: Tree[] = [];
  for (let tx = 120; tx < COUNTRY_END - 60; tx += 70 + r() * 120) {
    if (Math.abs(tx - 900) < 230) continue; // the dacha
    const k = r();
    trees.push({ x: tx, h: 150 + r() * 130, kind: k < 0.55 ? 'birch' : k < 0.8 ? 'blossom' : 'lime', seed: Math.floor(r() * 1e6) });
  }
  // the far city, in its own slow-moving layer (positions are panorama x where it sits centred)
  const far: Far[] = [];
  for (let fx = STREETS_START - 200; fx < WORLD_W + 1500; fx += 160 + r() * 200) far.push({ at: fx, kind: 'roofs', w: 220 + r() * 200, h: 60 + r() * 50, seed: Math.floor(r() * 1e6) });
  far.push(
    { at: 5600, kind: 'spireTall', w: 60, h: 330, seed: 1 }, // an Admiralty-like needle
    { at: 8300, kind: 'dome', w: 260, h: 300, seed: 2 }, // a great gilded dome
    { at: 10700, kind: 'spireTall', w: 50, h: 380, seed: 3 }, // a fortress-cathedral spire
    { at: 4300, kind: 'cupola', w: 110, h: 190, seed: 4 },
    { at: 7300, kind: 'cupola', w: 90, h: 170, seed: 5 },
    { at: 9500, kind: 'tower', w: 70, h: 230, seed: 6 }, // the bell that strikes eleven
    { at: 11400, kind: 'cupola', w: 120, h: 200, seed: 7 },
  );
  for (let fx = -400; fx < COUNTRY_END + 400; fx += 260 + r() * 240) far.push({ at: fx, kind: 'hills', w: 600 + r() * 500, h: 50 + r() * 60, seed: Math.floor(r() * 1e6) });
  return { buildings, gaps, lamps, trees, far, dacha: { x: P.DACHA }, barrier: { x: P.BARRIER }, seat: { x: P.SEAT }, tower: { at: 9500 } };
}

function mk(x: number, w: number, r: () => number): Building {
  const floors = 3 + Math.floor(r() * 3);
  const styleR = r();
  const style = w < 170 ? 'plain' : styleR < 0.3 ? 'pilasters' : styleR < 0.45 ? 'portico' : styleR < 0.7 ? 'rusticated' : 'plain';
  const bays = Math.max(2, Math.round(w / 48));
  return {
    x, w, floors,
    color: STUCCO[Math.floor(r() * STUCCO.length)],
    trim: r() < 0.85 ? '#f6f0e4' : '#e9dcc4',
    roof: ROOFS[Math.floor(r() * ROOFS.length)],
    style, bays,
    balcony: r() < 0.4,
    attic: r() < 0.3,
    seed: Math.floor(r() * 1e6),
  };
}

/** The pavement rises over the bridge. */
export function groundY(x: number) {
  const b = P.BRIDGE;
  const d = Math.abs(x - b);
  if (d > 190) return PAVE;
  const t = 1 - d / 190;
  return PAVE - 16 * Math.sin((t * Math.PI) / 2);
}
