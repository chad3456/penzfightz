import { useCallback, useEffect, useRef, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { db } from '../lib/supabase';
import { playerId, playerName } from '../lib/identity';
import { makeKeyPair, sharedKey, seal, open, canEncrypt, type Sealed } from './crypto';

/**
 * One room, any game.
 *
 * Every game on this site that seats more than one person runs the same way:
 * one browser is the host and owns the truth, everybody else sends intent and
 * renders what comes back. The host publishes two things each tick — a public
 * state that all seats see, and a private slice per seat, encrypted to that
 * seat (see ./crypto).
 *
 * The generic parameters are the game's own shapes: `Pub` is what everyone can
 * see, `Priv` is what only you can see, `Act` is what you can ask to do.
 */

export interface Seat {
  id: string;
  name: string;
  bot: boolean;
  online: boolean;
}

export type RoomPhase = 'idle' | 'connecting' | 'lobby' | 'playing' | 'closed';

interface Wire<Pub> {
  /** Host announces itself and its key. */
  hello?: { hostId: string; pub: JsonWebKey };
  /** A seat announces itself and its key. */
  join?: { id: string; name: string; pub: JsonWebKey };
  /** Host's snapshot. */
  state?: { v: number; seats: Seat[]; phase: RoomPhase; pub: Pub | null };
  /** Host's per-seat secrets, addressed by seat id. */
  secrets?: Record<string, Sealed>;
  /** A seat asking to do something (plaintext). */
  act?: { from: string; action: unknown };
  /** A seat asking to do something nobody else should see. */
  secretAct?: { from: string; sealed: Sealed };
  /** Host or seat leaving. */
  bye?: { id: string };
}

export interface RoomApi<Pub, Priv, Act> {
  phase: RoomPhase;
  code: string | null;
  isHost: boolean;
  seats: Seat[];
  /** What everyone can see. */
  pub: Pub | null;
  /** What only you can see. */
  priv: Priv | null;
  error: string | null;
  /** Seats currently connected, including bots. */
  me: string;

  /** Host only: publish a new snapshot. */
  publish: (pub: Pub, secrets: Record<string, Priv>, opts?: { phase?: RoomPhase }) => void;
  /** Host only: replace the seat list (adding bots, kicking, etc). */
  setSeats: (seats: Seat[]) => void;
  /** Any seat: ask the host to do something. */
  send: (action: Act, opts?: { secret?: boolean }) => void;
  leave: () => void;
}

export interface RoomOptions<Pub, Act> {
  game: string;
  code: string | null;
  asHost: boolean;
  /** Host only: called when a seat asks to do something. */
  onAction?: (from: string, action: Act) => void;
  /** Host only: called when a new seat arrives. */
  onSeatJoin?: (seat: Seat) => void;
  onSeatLeave?: (id: string) => void;
  /** Guest only: called on every fresh public snapshot. */
  onState?: (pub: Pub | null, phase: RoomPhase) => void;
}

export function useRoom<Pub, Priv, Act>(
  opts: RoomOptions<Pub, Act>,
): RoomApi<Pub, Priv, Act> {
  const { game, code, asHost } = opts;

  const [phase, setPhase] = useState<RoomPhase>(code ? 'connecting' : 'idle');
  const [seats, setSeats] = useState<Seat[]>([]);
  const [pub, setPub] = useState<Pub | null>(null);
  const [priv, setPriv] = useState<Priv | null>(null);
  const [error, setError] = useState<string | null>(null);

  const me = playerId();
  const channel = useRef<RealtimeChannel | null>(null);
  const version = useRef(0);

  // ---- keys ----
  const myKeys = useRef<Awaited<ReturnType<typeof makeKeyPair>>>(null);
  /** host: seat id -> shared key. guest: 'host' -> shared key. */
  const keys = useRef<Map<string, CryptoKey>>(new Map());
  const peerJwk = useRef<Map<string, JsonWebKey>>(new Map());

  // Callbacks change identity every render; keep them in refs.
  const cb = useRef(opts);
  cb.current = opts;

  const seatsRef = useRef<Seat[]>([]);
  seatsRef.current = seats;

  const post = useCallback((msg: Wire<Pub>) => {
    void channel.current?.send({ type: 'broadcast', event: 'rm', payload: msg });
  }, []);

  // ---------------------------------------------------------------- connect
  useEffect(() => {
    if (!code || !db) {
      if (code && !db) setError('No connection to the arcade.');
      return;
    }

    let cancelled = false;
    setPhase('connecting');
    setError(null);
    version.current = 0;
    keys.current.clear();
    peerJwk.current.clear();

    const ch = db.channel(`arcade:${game}:${code.toUpperCase()}`, {
      config: { broadcast: { self: false }, presence: { key: me } },
    });
    channel.current = ch;

    const handle = async (msg: Wire<Pub>) => {
      if (cancelled) return;

      // ---- guest side ----
      if (!asHost) {
        if (msg.hello && myKeys.current) {
          const k = await sharedKey(myKeys.current.privateKey, msg.hello.pub);
          if (k) keys.current.set('host', k);
          // Re-announce so a host that restarted picks us back up.
          post({ join: { id: me, name: playerName(), pub: myKeys.current.publicJwk } });
        }
        if (msg.state) {
          setSeats(msg.state.seats);
          setPub(msg.state.pub);
          setPhase(msg.state.phase);
          cb.current.onState?.(msg.state.pub, msg.state.phase);
        }
        if (msg.secrets) {
          const mine = msg.secrets[me];
          const k = keys.current.get('host');
          if (mine && k) {
            const value = await open<Priv>(k, mine);
            if (value !== null) setPriv(value);
          } else if (!mine) {
            setPriv(null);
          }
        }
      }

      // ---- host side ----
      if (asHost) {
        if (msg.join && myKeys.current) {
          peerJwk.current.set(msg.join.id, msg.join.pub);
          const k = await sharedKey(myKeys.current.privateKey, msg.join.pub);
          if (k) keys.current.set(msg.join.id, k);
          const known = seatsRef.current.some((s) => s.id === msg.join!.id);
          if (!known) {
            cb.current.onSeatJoin?.({
              id: msg.join.id,
              name: msg.join.name,
              bot: false,
              online: true,
            });
          } else {
            // A rejoin: mark them back online and re-send state.
            setSeats((prev) =>
              prev.map((s) => (s.id === msg.join!.id ? { ...s, online: true } : s)),
            );
          }
          // Make sure the newcomer has our key.
          post({ hello: { hostId: me, pub: myKeys.current.publicJwk } });
        }
        if (msg.act) cb.current.onAction?.(msg.act.from, msg.act.action as Act);
        if (msg.secretAct) {
          const k = keys.current.get(msg.secretAct.from);
          if (k) {
            const action = await open<Act>(k, msg.secretAct.sealed);
            if (action !== null) cb.current.onAction?.(msg.secretAct.from, action);
          }
        }
      }

      if (msg.bye) {
        setSeats((prev) => prev.map((s) => (s.id === msg.bye!.id ? { ...s, online: false } : s)));
        cb.current.onSeatLeave?.(msg.bye.id);
      }
    };

    void (async () => {
      myKeys.current = await makeKeyPair();
      if (cancelled) return;

      ch.on('broadcast', { event: 'rm' }, ({ payload }) => void handle(payload as Wire<Pub>))
        .on('presence', { event: 'leave' }, ({ leftPresences }) => {
          for (const p of leftPresences as { id?: string }[]) {
            if (!p.id) continue;
            setSeats((prev) => prev.map((s) => (s.id === p.id ? { ...s, online: false } : s)));
            cb.current.onSeatLeave?.(p.id);
          }
        })
        .subscribe((status) => {
          if (cancelled) return;
          if (status === 'SUBSCRIBED') {
            void ch.track({ id: me, name: playerName() });
            setPhase('lobby');
            if (asHost) {
              post({ hello: { hostId: me, pub: myKeys.current!.publicJwk } });
            } else {
              post({ join: { id: me, name: playerName(), pub: myKeys.current!.publicJwk } });
            }
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            setError('Lost the connection to the room.');
          }
        });
    })();

    return () => {
      cancelled = true;
      post({ bye: { id: me } });
      void ch.untrack();
      void db!.removeChannel(ch);
      channel.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, game, asHost, me, post]);

  // ---------------------------------------------------------------- host api
  const publish = useCallback(
    (nextPub: Pub, secrets: Record<string, Priv>, o?: { phase?: RoomPhase }) => {
      if (!asHost) return;
      version.current += 1;
      const nextPhase = o?.phase ?? 'playing';

      // The host renders from its own state directly.
      setPub(nextPub);
      setPhase(nextPhase);
      if (secrets[me] !== undefined) setPriv(secrets[me]);

      post({
        state: { v: version.current, seats: seatsRef.current, phase: nextPhase, pub: nextPub },
      });

      void (async () => {
        const out: Record<string, Sealed> = {};
        for (const [seatId, value] of Object.entries(secrets)) {
          if (seatId === me) continue; // ours never goes on the wire
          const k = keys.current.get(seatId);
          if (!k) continue;
          const sealed = await seal(k, value);
          if (sealed) out[seatId] = sealed;
        }
        if (Object.keys(out).length) post({ secrets: out });
      })();
    },
    [asHost, me, post],
  );

  const replaceSeats = useCallback(
    (next: Seat[]) => {
      setSeats(next);
      seatsRef.current = next;
      if (asHost) {
        post({ state: { v: version.current, seats: next, phase: 'lobby', pub: null } });
      }
    },
    [asHost, post],
  );

  // ---------------------------------------------------------------- seat api
  const send = useCallback(
    (action: Act, o?: { secret?: boolean }) => {
      if (asHost) {
        // The host does not need the wire to talk to itself.
        cb.current.onAction?.(me, action);
        return;
      }
      if (o?.secret && canEncrypt) {
        const k = keys.current.get('host');
        if (k) {
          void (async () => {
            const sealed = await seal(k, action);
            if (sealed) post({ secretAct: { from: me, sealed } });
          })();
          return;
        }
      }
      post({ act: { from: me, action } });
    },
    [asHost, me, post],
  );

  const leave = useCallback(() => {
    post({ bye: { id: me } });
    setPhase('closed');
  }, [me, post]);

  return {
    phase,
    code,
    isHost: asHost,
    seats,
    pub,
    priv,
    error,
    me,
    publish,
    setSeats: replaceSeats,
    send,
    leave,
  };
}

/** Build the link you send to a friend. */
export function roomLink(game: string, code: string): string {
  const base = `${window.location.origin}${window.location.pathname}`.replace(/\/$/, '');
  return `${base}?g=${game}&room=${code.toUpperCase()}`;
}

export function roomFromUrl(): { game: string; code: string } | null {
  const p = new URLSearchParams(window.location.search);
  const game = p.get('g');
  const code = p.get('room') ?? p.get('desk');
  if (!code) return null;
  return { game: game ?? 'penfight', code: code.trim().toUpperCase() };
}

export function clearRoomFromUrl() {
  const url = new URL(window.location.href);
  url.searchParams.delete('g');
  url.searchParams.delete('room');
  url.searchParams.delete('desk');
  window.history.replaceState({}, '', url.toString());
}
