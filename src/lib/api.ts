import { db, hasBackend } from './supabase';
import { playerId, playerName, localPen, localOwned, setLocalOwned, setLocalPen } from './identity';
import { DEFAULT_PEN_ID, STARTER_PENS } from '../game/pens';

/**
 * Everything the app asks of the server.
 *
 * Two rules here. First, no call ever throws at the UI: a dead network means
 * you fall back to what localStorage remembers and keep playing. Second, every
 * write is an rpc — the tables are select-only for the browser.
 */

export interface PlayerRow {
  id: string;
  handle: string;
  points: number;
  wins: number;
  losses: number;
  matches_played: number;
  practice_matches: number;
  friend_matches: number;
  pens_won: number;
  pens_lost: number;
  best_streak: number;
  streak: number;
  current_pen: string;
  owned_pens: string[];
}

export interface RankRow {
  rank: number;
  id: string;
  handle: string;
  points: number;
  wins: number;
  losses: number;
  matches_played: number;
  pens_won: number;
  best_streak: number;
  current_pen: string;
}

export interface Rival {
  rank: number;
  id: string;
  handle: string;
  points: number;
  wins: number;
  current_pen: string;
  my_rank: number;
  class_size: number;
}

export interface Counters {
  total_matches: number;
  practice_matches: number;
  friend_matches: number;
  ranked_matches: number;
  unique_users: number;
  total_shots: number;
  pens_captured: number;
  pens_knocked_off: number;
  live_rooms: number;
  matches_today: number;
}

export interface RoomRow {
  code: string;
  host_id: string | null;
  host_name: string;
  host_pen: string;
  guest_id: string | null;
  guest_name: string | null;
  guest_pen: string | null;
  format: number;
  status: 'waiting' | 'playing' | 'finished' | 'expired';
  challenge: boolean;
}

const ZERO_COUNTERS: Counters = {
  total_matches: 0,
  practice_matches: 0,
  friend_matches: 0,
  ranked_matches: 0,
  unique_users: 0,
  total_shots: 0,
  pens_captured: 0,
  pens_knocked_off: 0,
  live_rooms: 0,
  matches_today: 0,
};

/**
 * A network that is simply not there must not take the game down with it.
 *
 * supabase-js reports most problems as `{ error }`, but a blocked or offline
 * network rejects the underlying fetch outright. Everything below funnels
 * through here so a dead connection degrades to local play instead of a white
 * screen on boot.
 */
async function safe<T>(label: string, run: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await run();
  } catch (err) {
    console.warn(`[penfight] ${label} unreachable, playing local`, err);
    return fallback;
  }
}

/** A player object built purely from localStorage, for offline play. */
function offlinePlayer(): PlayerRow {
  return {
    id: playerId(),
    handle: playerName(),
    points: 0,
    wins: 0,
    losses: 0,
    matches_played: 0,
    practice_matches: 0,
    friend_matches: 0,
    pens_won: 0,
    pens_lost: 0,
    best_streak: 0,
    streak: 0,
    current_pen: localPen() ?? DEFAULT_PEN_ID,
    owned_pens: localOwned() ?? [...STARTER_PENS],
  };
}

export const api = {
  get online() {
    return hasBackend;
  },

  /** Register (or touch) this browser's player row. */
  async ensurePlayer(): Promise<PlayerRow> {
    const sb = db;
    if (!sb) return offlinePlayer();
    return safe('ensure_player', async () => {
      const { data, error } = await sb.rpc('ensure_player', {
        p_id: playerId(),
        p_handle: playerName(),
      });
      if (error || !data) return offlinePlayer();
      const row = data as PlayerRow;
      // Mirror the server's view locally so a later offline load is not a reset.
      setLocalPen(row.current_pen);
      setLocalOwned(row.owned_pens ?? STARTER_PENS);
      return row;
    }, offlinePlayer());
  },

  async rename(handle: string): Promise<PlayerRow | null> {
    const sb = db;
    if (!sb) return null;
    return safe('rename_player', async () => {
      const { data } = await sb.rpc('rename_player', { p_id: playerId(), p_handle: handle });
      return (data as PlayerRow) ?? null;
    }, null);
  },

  async choosePen(penId: string): Promise<PlayerRow | null> {
    setLocalPen(penId);
    const sb = db;
    if (!sb) return null;
    return safe('set_current_pen', async () => {
      const { data } = await sb.rpc('set_current_pen', { p_id: playerId(), p_pen: penId });
      return (data as PlayerRow) ?? null;
    }, null);
  },

  async counters(): Promise<Counters> {
    const sb = db;
    if (!sb) return ZERO_COUNTERS;
    return safe('platform_counters', async () => {
      const { data, error } = await sb.rpc('platform_counters');
      if (error || !data) return ZERO_COUNTERS;
      return { ...ZERO_COUNTERS, ...(data as Partial<Counters>) };
    }, ZERO_COUNTERS);
  },

  async top(limit = 10): Promise<RankRow[]> {
    const sb = db;
    if (!sb) return [];
    return safe('top_players', async () => {
      const { data, error } = await sb.rpc('top_players', { p_limit: limit });
      if (error || !data) return [];
      return data as RankRow[];
    }, []);
  },

  async rivalAbove(): Promise<Rival | null> {
    const sb = db;
    if (!sb) return null;
    return safe('rival_above', async () => {
      const { data, error } = await sb.rpc('rival_above', { p_id: playerId() });
      if (error || !data) return null;
      const rows = data as Rival[];
      return rows.length ? rows[0] : null;
    }, null);
  },

  async myCard(): Promise<{ player: PlayerRow; rank: number | null; class_size: number } | null> {
    const local = { player: offlinePlayer(), rank: null, class_size: 0 };
    const sb = db;
    if (!sb) return local;
    return safe('player_card', async () => {
      const { data } = await sb.rpc('player_card', { p_id: playerId() });
      return (data as { player: PlayerRow; rank: number | null; class_size: number } | null) ?? local;
    }, local);
  },

  /**
   * Book a finished match. Returns what changed — most importantly whether a
   * pen actually changed hands.
   */
  async recordMatch(m: {
    mode: 'practice' | 'friend' | 'ranked';
    format: number;
    hostId: string | null;
    guestId: string | null;
    hostName: string;
    guestName: string;
    hostPen: string;
    guestPen: string;
    hostScore: number;
    guestScore: number;
    winnerSide: 'host' | 'guest';
    shots: number;
    durationMs: number;
  }): Promise<{ match_id: string; pen_captured: string | null; points: number } | null> {
    const sb = db;
    if (!sb) return null;
    return safe('record_match', async () => {
      const { data, error } = await sb.rpc('record_match', {
        p_mode: m.mode,
        p_format: m.format,
        p_host_id: m.hostId,
        p_guest_id: m.guestId,
        p_host_name: m.hostName,
        p_guest_name: m.guestName,
        p_host_pen: m.hostPen,
        p_guest_pen: m.guestPen,
        p_host_score: m.hostScore,
        p_guest_score: m.guestScore,
        p_winner_side: m.winnerSide,
        p_shots: m.shots,
        p_duration_ms: m.durationMs,
      });
      if (error) {
        console.warn('[penfight] record_match rejected', error.message);
        return null;
      }
      return data as { match_id: string; pen_captured: string | null; points: number };
    }, null);
  },

  async logShots(
    matchId: string,
    shots: { turn: number; side: string; power: number; angle: number; outcome: string }[],
  ) {
    const sb = db;
    if (!sb || !shots.length) return;
    await safe('log_shots', async () => {
      await sb.rpc('log_shots', { p_match_id: matchId, p_shots: shots });
      return null;
    }, null);
  },

  // ---------------- rooms ----------------

  async createRoom(opts: {
    pen: string;
    format: number;
    challenge?: boolean;
  }): Promise<RoomRow | null> {
    const sb = db;
    if (!sb) return null;
    return safe('create_room', async () => {
      const { data, error } = await sb.rpc('create_room', {
        p_host_id: playerId(),
        p_host_name: playerName(),
        p_host_pen: opts.pen,
        p_format: opts.format,
        p_challenge: opts.challenge ?? false,
      });
      if (error) return null;
      return data as RoomRow;
    }, null);
  },

  async joinRoom(
    code: string,
    pen: string,
  ): Promise<{ room: RoomRow | null; error: string | null }> {
    const sb = db;
    if (!sb) return { room: null, error: 'No connection to the classroom.' };
    return safe(
      'join_room',
      async () => {
        const { data, error } = await sb.rpc('join_room', {
          p_code: code.trim().toUpperCase(),
          p_guest_id: playerId(),
          p_guest_name: playerName(),
          p_guest_pen: pen,
        });
        if (error) {
          const msg =
            error.code === 'P0002'
              ? 'No desk with that code.'
              : error.code === 'P0003'
                ? 'That link has gone cold.'
                : error.code === 'P0004'
                  ? 'Somebody else already took that desk.'
                  : error.message;
          return { room: null, error: msg };
        }
        return { room: data as RoomRow, error: null };
      },
      { room: null, error: 'Could not reach the desk.' },
    );
  },

  async getRoom(code: string): Promise<RoomRow | null> {
    const sb = db;
    if (!sb) return null;
    return safe('get_room', async () => {
      const { data } = await sb
        .from('rooms')
        .select('*')
        .eq('code', code.trim().toUpperCase())
        .maybeSingle();
      return (data as RoomRow) ?? null;
    }, null);
  },

  async closeRoom(code: string) {
    const sb = db;
    if (!sb) return;
    await safe('close_room', async () => {
      await sb.rpc('close_room', { p_code: code });
      return null;
    }, null);
  },
};
