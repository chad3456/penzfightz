import type { Upgrades } from './taxi';
import { PLACES, type PlaceId } from './places';

/**
 * The books.
 *
 * What you own, what you have earned, and which cities that has opened. Kept in
 * `localStorage` because a shift is fifteen minutes and losing a garage to a
 * refresh would be the only genuinely unfair thing in the game.
 */

export interface Save {
  money: number;
  /** Lifetime, which is what unlocks cities — spending should not lock you out. */
  earned: number;
  upgrades: Upgrades;
  /** Best rating and best takings per city. */
  best: Partial<Record<PlaceId, { stars: number; money: number; fares: number }>>;
}

const KEY = 'backbench.meter.v1';

export const BLANK: Save = {
  money: 0,
  earned: 0,
  upgrades: { engine: 0, tyres: 0, brakes: 0, springs: 0, bar: 0, horn: 0 },
  best: {},
};

export function load(): Save {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...BLANK, upgrades: { ...BLANK.upgrades }, best: {} };
    const v = JSON.parse(raw) as Save;
    return {
      money: v.money ?? 0,
      earned: v.earned ?? 0,
      upgrades: { ...BLANK.upgrades, ...(v.upgrades ?? {}) },
      best: v.best ?? {},
    };
  } catch {
    return { ...BLANK, upgrades: { ...BLANK.upgrades }, best: {} };
  }
}

export function save(s: Save) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // A private window, or storage turned off. The shift still works; it just
    // will not be there tomorrow.
  }
}

export type Part = keyof Upgrades;

export interface PartDef {
  id: Part;
  name: string;
  /** What it does, in the terms the player will feel it in. */
  note: string;
  /** Per level, in rupees. */
  cost: number[];
  /** What the readout says at each level. */
  reads: (n: number) => string;
}

export const PARTS: PartDef[] = [
  {
    id: 'engine',
    name: 'Engine',
    note: 'Pulls harder and runs further before the drag catches it.',
    cost: [420, 780, 1500, 2900],
    reads: (n) => `${(31 + n * 4.2).toFixed(0)} m/s · ${(9.2 + n * 2.4).toFixed(1)} m/s²`,
  },
  {
    id: 'tyres',
    name: 'Tyres',
    note: 'How much cornering the road will take before the tail comes round.',
    cost: [380, 720, 1400, 2700],
    reads: (n) => `${(8.4 + n * 1.5).toFixed(1)} m/s² of grip`,
  },
  {
    id: 'brakes',
    name: 'Brakes',
    note: 'The difference between a shortcut and a wall.',
    cost: [340, 640, 1250, 2400],
    reads: (n) => `${(15 + n * 4.4).toFixed(0)} m/s² stopping`,
  },
  {
    id: 'springs',
    name: 'Springs',
    note: 'How much of what you do reaches the back seat. This is the rating.',
    cost: [460, 860, 1650, 3100],
    reads: (n) => `${Math.round(n * 13)}% softer on the passenger`,
  },
  {
    id: 'bar',
    name: 'Bull bar',
    note: 'Flattening a stall stops counting as an event.',
    cost: [300, 580, 1100, 2100],
    reads: (n) => `${Math.round(n * 16)}% less upset per thing hit`,
  },
  {
    id: 'horn',
    name: 'Horn',
    note: 'Clears what is in front of you. It is Delhi; it is not optional.',
    cost: [260, 500, 960, 1850],
    reads: (n) => `${(9 + n * 6).toFixed(0)} m of persuasion`,
  },
];

export const MAX_LEVEL = 4;

export function priceOf(p: PartDef, level: number): number | null {
  return level >= MAX_LEVEL ? null : p.cost[level];
}

export function unlocked(s: Save, id: PlaceId): boolean {
  const place = PLACES.find((p) => p.id === id);
  return !!place && s.earned >= place.unlock;
}

/** What the next city costs, for the line under the map picker. */
export function nextLocked(s: Save) {
  return PLACES.find((p) => s.earned < p.unlock) ?? null;
}
