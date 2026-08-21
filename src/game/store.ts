import { create } from 'zustand';
import { DEFAULT_PEN_ID } from './pens';

export type Side = 'host' | 'guest';
/**
 * `ranked` is a friend match with a ladder attached — same rules, same stakes,
 * but it was started by challenging the player one rung above you.
 */
export type GameMode = 'practice' | 'friend' | 'ranked';

export type Phase =
  | 'menu' // no match running
  | 'ready' // rally set up, waiting for the active side to draw
  | 'aiming' // pointer is down, drawing back
  | 'live' // impulse applied, pens are moving
  | 'settling' // pens nearly stopped, about to score
  | 'point' // a point just landed, showing the card
  | 'over'; // match finished

export interface Shot {
  side: Side;
  /** Unit direction on the table plane. */
  dx: number;
  dz: number;
  /** 0..1 draw strength. */
  power: number;
  /** -1 (nib) .. +1 (tail): where along the barrel the flick landed. */
  strike: number;
  /** Monotonic id so the physics layer applies each shot exactly once. */
  seq: number;
}

export interface RallyResult {
  scoringSide: Side;
  reason: 'knockout' | 'self_out' | 'double_out';
  /** Which pen actually went over the edge. */
  fellSide: Side;
}

interface MatchState {
  mode: GameMode;
  /** Best of N. Always odd. */
  format: number;
  /** Which side this browser controls. */
  mySide: Side;
  /** True when this client owns the physics simulation. */
  isAuthority: boolean;

  phase: Phase;
  turn: Side;
  score: Record<Side, number>;
  names: Record<Side, string>;
  pens: Record<Side, string>;
  /** Bumped every rally so the scene knows to re-rack the pens. */
  rally: number;

  pendingShot: Shot | null;
  lastShot: Shot | null;
  shotCount: number;
  lastResult: RallyResult | null;
  winner: Side | null;
  startedAt: number;

  /** Live aim readout for the HUD. */
  aim: { power: number; angleDeg: number; strike: number } | null;

  toast: string | null;
}

interface MatchActions {
  setupMatch: (opts: {
    mode: GameMode;
    format?: number;
    mySide?: Side;
    isAuthority?: boolean;
    names?: Partial<Record<Side, string>>;
    pens?: Partial<Record<Side, string>>;
    first?: Side;
  }) => void;
  setAim: (aim: MatchState['aim']) => void;
  fire: (shot: Omit<Shot, 'seq'>) => void;
  consumeShot: () => void;
  resolveRally: (result: RallyResult) => void;
  nextRally: () => void;
  setPhase: (phase: Phase) => void;
  setPen: (side: Side, penId: string) => void;
  setToast: (toast: string | null) => void;
  quitMatch: () => void;
}

export const other = (side: Side): Side => (side === 'host' ? 'guest' : 'host');

const initial: MatchState = {
  mode: 'practice',
  format: 5,
  mySide: 'host',
  isAuthority: true,
  phase: 'menu',
  turn: 'host',
  score: { host: 0, guest: 0 },
  names: { host: 'You', guest: 'Bunty' },
  pens: { host: DEFAULT_PEN_ID, guest: DEFAULT_PEN_ID },
  rally: 0,
  pendingShot: null,
  lastShot: null,
  shotCount: 0,
  lastResult: null,
  winner: null,
  startedAt: 0,
  aim: null,
  toast: null,
};

export const useMatch = create<MatchState & MatchActions>((set, get) => ({
  ...initial,

  setupMatch: (opts) =>
    set((s) => ({
      ...initial,
      mode: opts.mode,
      format: opts.format ?? 5,
      mySide: opts.mySide ?? 'host',
      isAuthority: opts.isAuthority ?? true,
      names: { ...s.names, ...opts.names },
      pens: { ...s.pens, ...opts.pens },
      turn: opts.first ?? 'host',
      phase: 'ready',
      rally: 1,
      startedAt: Date.now(),
    })),

  setAim: (aim) => set({ aim }),

  fire: (shot) => {
    const { phase, shotCount } = get();
    if (phase !== 'ready' && phase !== 'aiming') return;
    const seq = shotCount + 1;
    set({
      pendingShot: { ...shot, seq },
      lastShot: { ...shot, seq },
      shotCount: seq,
      phase: 'live',
      aim: null,
    });
  },

  consumeShot: () => set({ pendingShot: null }),

  resolveRally: (result) => {
    const { score, format } = get();
    const next = { ...score, [result.scoringSide]: score[result.scoringSide] + 1 };
    const target = Math.floor(format / 2) + 1;
    const winner = next[result.scoringSide] >= target ? result.scoringSide : null;
    set({
      score: next,
      lastResult: result,
      phase: winner ? 'over' : 'point',
      winner,
    });
  },

  nextRally: () =>
    set((s) => ({
      // The side that just lost the point takes the first flick. Back-bench rules.
      turn: s.lastResult ? other(s.lastResult.scoringSide) : s.turn,
      phase: 'ready',
      rally: s.rally + 1,
      pendingShot: null,
      aim: null,
    })),

  setPhase: (phase) => set({ phase }),

  setPen: (side, penId) => set((s) => ({ pens: { ...s.pens, [side]: penId } })),

  setToast: (toast) => set({ toast }),

  quitMatch: () => set({ ...initial }),
}));
