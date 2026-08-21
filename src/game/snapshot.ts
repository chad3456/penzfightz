import type { Side } from './store';

/**
 * A plain mutable mirror of where the pens actually are.
 *
 * The AI and the HUD both want to read the board every frame without holding a
 * Rapier handle or forcing a React render, so `Arena` writes here once per
 * frame and everyone else reads.
 */
export interface PenSnapshot {
  x: number;
  y: number;
  z: number;
  /** Heading of the barrel on the table plane, radians. */
  yaw: number;
  speed: number;
}

export const snapshot: Record<Side, PenSnapshot> = {
  host: { x: 0, y: 0, z: 0, yaw: 0, speed: 0 },
  guest: { x: 0, y: 0, z: 0, yaw: 0, speed: 0 },
};

/**
 * The live Rapier handles, for the dev-gated debug probe only.
 *
 * Reading mass and velocity straight off the body is the only way to tell a
 * physics problem from a bookkeeping one, and guessing between the two costs
 * far more than this tiny registry does.
 */
interface DebugBody {
  mass(): number;
  linvel(): { x: number; y: number; z: number };
  setTranslation(t: { x: number; y: number; z: number }, wake: boolean): void;
  setLinvel(v: { x: number; y: number; z: number }, wake: boolean): void;
  setAngvel(v: { x: number; y: number; z: number }, wake: boolean): void;
}

export const bodies: Record<Side, DebugBody | null> = {
  host: null,
  guest: null,
};
