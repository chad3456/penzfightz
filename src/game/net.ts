import type { RealtimeChannel } from '@supabase/supabase-js';
import { db } from '../lib/supabase';
import { playerId } from '../lib/identity';
import type { NetPenState } from '../three/Arena';
import type { Side } from './store';

/**
 * Two browsers, one desk.
 *
 * Rapier is not bit-for-bit identical across machines, so the host owns the
 * simulation outright and streams pen transforms at 20Hz. The guest sends only
 * intent — "I flicked at this angle with this power" — and watches the result.
 * That makes the host's screen the truth, which is exactly how it worked when
 * one kid owned the desk.
 */

export type NetMessage =
  | { type: 'hello'; side: Side; name: string; pen: string; format: number }
  | {
      type: 'start';
      format: number;
      hostName: string;
      guestName: string;
      hostPen: string;
      guestPen: string;
      first: Side;
    }
  | { type: 'shot'; side: Side; dx: number; dz: number; power: number; strike: number }
  /**
   * The host's heartbeat. Carries the pen transforms *and* the authoritative
   * turn and score, so a guest that misses a message still converges instead of
   * sitting there believing it is somebody else's turn.
   */
  | {
      type: 'sync';
      state: NetPenState;
      turn: Side;
      score: { host: number; guest: number };
      rally: number;
      live: boolean;
    }
  | {
      type: 'rally';
      score: { host: number; guest: number };
      turn: Side;
      rally: number;
      scoringSide: Side;
      reason: string;
      fellSide: Side;
      winner: Side | null;
    }
  | { type: 'rematch' }
  | { type: 'bye'; side: Side };

export interface NetHandlers {
  onMessage: (msg: NetMessage) => void;
  onPeerJoin?: () => void;
  onPeerLeave?: () => void;
}

export interface NetLink {
  send: (msg: NetMessage) => void;
  leave: () => void;
  readonly peers: number;
}

const DEAD_LINK: NetLink = {
  send: () => {},
  leave: () => {},
  peers: 0,
};

export function joinDesk(code: string, handlers: NetHandlers): NetLink {
  if (!db) return DEAD_LINK;

  let channel: RealtimeChannel | null = null;
  let peers = 0;

  channel = db.channel(`desk:${code.toUpperCase()}`, {
    config: {
      broadcast: { self: false, ack: false },
      presence: { key: playerId() },
    },
  });

  channel
    .on('broadcast', { event: 'pf' }, ({ payload }) => {
      handlers.onMessage(payload as NetMessage);
    })
    .on('presence', { event: 'sync' }, () => {
      const next = Object.keys(channel!.presenceState()).length;
      if (next > peers) handlers.onPeerJoin?.();
      if (next < peers) handlers.onPeerLeave?.();
      peers = next;
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        void channel!.track({ id: playerId(), at: Date.now() });
      }
    });

  return {
    send(msg) {
      void channel?.send({ type: 'broadcast', event: 'pf', payload: msg });
    },
    leave() {
      void channel?.untrack();
      void db!.removeChannel(channel!);
      channel = null;
    },
    get peers() {
      return peers;
    },
  };
}

/** Build a link a friend can open. Kept short enough to read out loud. */
export function deskLink(code: string): string {
  const base = `${window.location.origin}${window.location.pathname}`.replace(/\/$/, '');
  return `${base}?desk=${code.toUpperCase()}`;
}

export function deskCodeFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('desk');
  return code ? code.trim().toUpperCase() : null;
}

export function clearDeskFromUrl() {
  const url = new URL(window.location.href);
  url.searchParams.delete('desk');
  window.history.replaceState({}, '', url.toString());
}
