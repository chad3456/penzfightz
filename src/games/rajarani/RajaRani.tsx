import { useCallback, useEffect, useRef, useState } from 'react';
import { Sheet, SheetHeader } from '../../ui/Sheet';
import { RoomEntry, Lobby } from '../../arcade/Lobby';
import { useRoom, type Seat } from '../../arcade/room';
import { GAME_BY_ID } from '../../arcade/games';
import { playerId, playerName } from '../../lib/identity';
import { sfx } from '../../lib/audio';
import { api } from '../../lib/api';
import {
  deal,
  resolve,
  botAccusation,
  emptyScores,
  ROLE_LABEL,
  ROLE_NOTE,
  ROLE_POINTS,
  type RRState,
  type RRPublic,
  type RRPrivate,
  type RRAction,
  type RRSeat,
  type Role,
} from './engine';

/**
 * Raja Rani Chor Police, at a bench.
 *
 * The host does all the folding: it deals the chits, keeps the roles, and
 * encrypts each one to the seat it belongs to. Nobody — not even by reading
 * the network traffic — sees a chit that is not theirs.
 */

const GAME = GAME_BY_ID.rajarani;
const ROUNDS = 5;
const BOT_NAMES = ['Chintu', 'Pinky', 'Guddu', 'Bittu', 'Sonu', 'Dolly'];

type Screen = 'entry' | 'lobby' | 'playing';

function Chit({
  role,
  facedown,
  small,
}: {
  role?: Role;
  facedown?: boolean;
  small?: boolean;
}) {
  return (
    <div className={`chit${facedown ? ' chit--down' : ''}${small ? ' chit--small' : ''}`}>
      {facedown || !role ? (
        <span className="chit__back" aria-hidden="true" />
      ) : (
        <>
          <span className="chit__role">{ROLE_LABEL[role]}</span>
          <span className="chit__points">{ROLE_POINTS[role]}</span>
        </>
      )}
    </div>
  );
}

export function RajaRani({ onExit }: { onExit: () => void }) {
  const [screen, setScreen] = useState<Screen>('entry');
  const [code, setCode] = useState<string | null>(null);
  const [asHost, setAsHost] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);

  const me = playerId();

  // The host's authoritative game, including every chit.
  const game = useRef<RRState | null>(null);
  const seatsRef = useRef<Seat[]>([]);
  const recorded = useRef(false);

  const [localPub, setLocalPub] = useState<RRPublic | null>(null);
  const [localPriv, setLocalPriv] = useState<RRPrivate | null>(null);

  // ---------------------------------------------------------------- publish
  const pushRef = useRef<
    ((pub: RRPublic, secrets: Record<string, RRPrivate>) => void) | null
  >(null);

  const publishState = useCallback((state: RRState) => {
    game.current = state;
    const secrets: Record<string, RRPrivate> = {};
    for (const [id, role] of Object.entries(state.roles)) {
      secrets[id] = { role, round: state.pub.round };
    }
    setLocalPub(state.pub);
    setLocalPriv(secrets[me] ?? null);
    pushRef.current?.(state.pub, secrets);
  }, [me]);

  // ---------------------------------------------------------------- actions
  const applyAccusation = useCallback(
    (from: string, targetId: string) => {
      const state = game.current;
      if (!state || state.pub.phase !== 'guessing') return;
      if (from !== state.pub.policeId) return; // only the Police points
      if (!state.pub.seats.some((s) => s.id === targetId)) return;
      sfx.vote();
      publishState(resolve(state, targetId));
    },
    [publishState],
  );

  const nextRound = useCallback(() => {
    const state = game.current;
    if (!state || state.pub.phase !== 'reveal') return;
    sfx.paper();
    publishState(
      deal(state.pub.seats, state.pub.round + 1, state.pub.rounds, state.pub.scores),
    );
  }, [publishState]);

  const onAction = useCallback(
    (from: string, action: RRAction) => {
      if (action.type === 'accuse') applyAccusation(from, action.targetId);
      if (action.type === 'next') nextRound();
    },
    [applyAccusation, nextRound],
  );

  const onSeatJoin = useCallback((seat: Seat) => {
    if (seatsRef.current.length >= GAME.seats.max) return;
    seatsRef.current = [...seatsRef.current, seat];
    roomRef.current?.setSeats(seatsRef.current);
  }, []);

  const room = useRoom<RRPublic, RRPrivate, RRAction>({
    game: 'rajarani',
    code: offline ? null : code,
    asHost,
    onAction,
    onSeatJoin,
  });
  const roomRef = useRef(room);
  roomRef.current = room;
  pushRef.current = (pub, secrets) => room.publish(pub, secrets);

  // Offline practice keeps its own state; online reads the room.
  const pub = offline ? localPub : (room.pub ?? localPub);
  const priv = offline ? localPriv : (room.priv ?? (asHost ? localPriv : null));

  useEffect(() => {
    if (!offline) seatsRef.current = room.seats;
  }, [room.seats, offline]);

  // ---------------------------------------------------------------- start
  const startPractice = useCallback(() => {
    setOffline(true);
    setAsHost(true);
    const seats: RRSeat[] = [
      { id: me, name: playerName(), bot: false },
      ...BOT_NAMES.slice(0, 3).map((n, i) => ({ id: `bot-${i}`, name: n, bot: true })),
    ];
    seatsRef.current = seats.map((s) => ({ ...s, online: true }));
    recorded.current = false;
    sfx.paper();
    publishState(deal(seats, 1, ROUNDS, emptyScores(seats)));
    setScreen('playing');
  }, [me, publishState]);

  const hostRoom = useCallback(async () => {
    setBusy(true);
    setError(null);
    const created = await api.createRoom({ pen: 'reynolds045', format: ROUNDS, game: 'rajarani' });
    setBusy(false);
    if (!created) {
      setError('Could not open a room. Check your connection.');
      return;
    }
    setAsHost(true);
    setCode(created.code);
    seatsRef.current = [{ id: me, name: playerName(), bot: false, online: true }];
    setScreen('lobby');
  }, [me]);

  const joinRoom = useCallback(
    async (entered: string) => {
      setBusy(true);
      setError(null);
      const { room: r, error: err } = await api.joinRoom(entered, 'reynolds045', 'rajarani');
      setBusy(false);
      if (err || !r) {
        setError(err ?? 'Could not join.');
        return;
      }
      setAsHost(r.host_id === me);
      setCode(r.code);
      setScreen('lobby');
    },
    [me],
  );

  const addBot = useCallback(() => {
    const n = seatsRef.current.filter((s) => s.bot).length;
    if (seatsRef.current.length >= GAME.seats.max) return;
    seatsRef.current = [
      ...seatsRef.current,
      { id: `bot-${n}`, name: BOT_NAMES[n % BOT_NAMES.length], bot: true, online: true },
    ];
    room.setSeats(seatsRef.current);
  }, [room]);

  const startOnline = useCallback(() => {
    const seats: RRSeat[] = seatsRef.current.map((s) => ({
      id: s.id,
      name: s.name,
      bot: s.bot,
    }));
    recorded.current = false;
    sfx.paper();
    publishState(deal(seats, 1, ROUNDS, emptyScores(seats)));
    setScreen('playing');
  }, [publishState]);

  // Guests follow the host into the game.
  useEffect(() => {
    if (!offline && !asHost && room.pub && screen !== 'playing') setScreen('playing');
  }, [offline, asHost, room.pub, screen]);

  // ---------------------------------------------------------------- bots
  useEffect(() => {
    if (!pub || !(offline || asHost)) return;
    if (pub.phase !== 'guessing' || !pub.policeId) return;
    const police = pub.seats.find((s) => s.id === pub.policeId);
    if (!police?.bot) return;

    const t = setTimeout(() => {
      const state = game.current;
      if (!state || state.pub.phase !== 'guessing') return;
      applyAccusation(pub.policeId!, botAccusation(pub, pub.policeId!));
    }, 1400 + Math.random() * 1600);
    return () => clearTimeout(t);
  }, [pub, offline, asHost, applyAccusation]);

  // Auto-advance after a reveal so nobody has to press anything in practice.
  useEffect(() => {
    if (!pub || !(offline || asHost)) return;
    if (pub.phase !== 'reveal') return;
    const t = setTimeout(nextRound, 4200);
    return () => clearTimeout(t);
  }, [pub, offline, asHost, nextRound]);

  // ---------------------------------------------------------------- record
  useEffect(() => {
    if (!pub || pub.phase !== 'over' || recorded.current) return;
    if (!(offline || asHost)) return;
    recorded.current = true;
    const ranked = [...pub.seats].sort(
      (a, b) => (pub.scores[b.id] ?? 0) - (pub.scores[a.id] ?? 0),
    );
    void api.recordGame({
      game: 'rajarani',
      mode: offline ? 'practice' : 'friend',
      rounds: pub.rounds,
      participants: ranked.map((s, i) => ({
        id: s.bot ? null : s.id,
        name: s.name,
        score: pub.scores[s.id] ?? 0,
        place: i + 1,
      })),
    });
  }, [pub, offline, asHost]);

  // ---------------------------------------------------------------- render
  if (screen === 'entry') {
    return (
      <RoomEntry
        game={GAME}
        busy={busy}
        error={error ?? room.error}
        onHost={() => void hostRoom()}
        onJoin={(c) => void joinRoom(c)}
        onPractice={startPractice}
        onBack={onExit}
      />
    );
  }

  if (screen === 'lobby') {
    return (
      <Lobby
        game={GAME}
        code={code ?? '?????'}
        seats={room.seats.length ? room.seats : seatsRef.current}
        isHost={asHost}
        me={me}
        minSeats={GAME.seats.min}
        canStart={(room.seats.length || seatsRef.current.length) >= GAME.seats.min}
        note="Four is the proper game. Fewer and we drop the Raja, then the Rani."
        onAddBot={asHost ? addBot : undefined}
        onStart={startOnline}
        onLeave={() => {
          room.leave();
          onExit();
        }}
      />
    );
  }

  if (!pub) {
    return (
      <Sheet seed={41}>
        <SheetHeader title="Raja Rani" subtitle={GAME.name} />
        <p className="lede waiting-dots">Folding the chits</p>
      </Sheet>
    );
  }

  const iAmPolice = pub.policeId === me;
  const revealed = pub.revealed;
  const myRole = priv?.role ?? revealed?.[me];

  return (
    <Sheet seed={41}>
      <SheetHeader title="Raja Rani" subtitle={`Round ${pub.round} of ${pub.rounds}`} />

      {pub.phase === 'over' ? (
        <>
          <h1 className="title center">
            {pub.winnerId === me ? 'You win the bench.' : `${pub.seats.find((s) => s.id === pub.winnerId)?.name ?? '—'} wins.`}
          </h1>
          <div className="rule--thin" />
          <ul className="seat-list">
            {[...pub.seats]
              .sort((a, b) => (pub.scores[b.id] ?? 0) - (pub.scores[a.id] ?? 0))
              .map((s, i) => (
                <li key={s.id} className={`seat${s.id === me ? ' seat--me' : ''}`}>
                  <span className="seat__num">{i + 1}</span>
                  <span className="seat__name">{s.name}</span>
                  <span className="seat__state">{pub.scores[s.id] ?? 0}</span>
                </li>
              ))}
          </ul>
          <div className="mt-lg">
            <button className="btn btn--primary" onClick={offline ? startPractice : startOnline}>
              Play again
            </button>
            <button
              className="btn btn--ghost"
              onClick={() => {
                room.leave();
                onExit();
              }}
            >
              Back to the shelf
            </button>
          </div>
        </>
      ) : (
        <>
          {/* your chit */}
          <div className="center">
            <div className="eyebrow">Your chit</div>
            <div className="chit-hand">
              <Chit role={myRole} facedown={!myRole} />
            </div>
            {myRole && <p className="lede" style={{ marginTop: 4 }}>{ROLE_NOTE[myRole]}</p>}
          </div>

          <div className="rule--thin" />

          {pub.phase === 'guessing' && iAmPolice && (
            <>
              <div className="eyebrow">Point at the Chor</div>
              <div className="suspects">
                {pub.seats
                  .filter((s) => s.id !== me)
                  .map((s) => (
                    <button
                      key={s.id}
                      className="suspect"
                      onClick={() => room.send({ type: 'accuse', targetId: s.id })}
                    >
                      <Chit facedown small />
                      <span className="suspect__name">{s.name}</span>
                    </button>
                  ))}
              </div>
            </>
          )}

          {pub.phase === 'guessing' && !iAmPolice && (
            <p className="lede">
              {pub.seats.find((s) => s.id === pub.policeId)?.name ?? 'The Police'} is deciding
              <span className="waiting-dots" />
              <br />
              <span className="muted">
                {myRole === 'chor' ? 'Look bored. Look extremely bored.' : 'Say nothing helpful.'}
              </span>
            </p>
          )}

          {pub.phase === 'reveal' && revealed && (
            <>
              <h2 className="title center">
                {pub.correct ? 'Caught.' : 'Wrong one.'}
              </h2>
              <p className="lede">
                {pub.seats.find((s) => s.id === pub.policeId)?.name} pointed at{' '}
                <b>{pub.seats.find((s) => s.id === pub.accusedId)?.name}</b>
                {pub.correct
                  ? ' — and that was the Chor.'
                  : `, but the Chor was ${
                      pub.seats.find((s) => revealed[s.id] === 'chor')?.name
                    }.`}
              </p>
              <div className="reveal-row">
                {pub.seats.map((s) => (
                  <div key={s.id} className="reveal">
                    <Chit role={revealed[s.id]} small />
                    <span className="reveal__name">{s.name}</span>
                    <span className="reveal__delta">
                      {(pub.delta?.[s.id] ?? 0) > 0 ? `+${pub.delta![s.id]}` : '—'}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="rule--thin" />
          <div className="eyebrow">Score</div>
          <ul className="seat-list">
            {[...pub.seats]
              .sort((a, b) => (pub.scores[b.id] ?? 0) - (pub.scores[a.id] ?? 0))
              .map((s) => (
                <li key={s.id} className={`seat${s.id === me ? ' seat--me' : ''}`}>
                  <span className="seat__num">{s.id === pub.policeId ? '★' : '·'}</span>
                  <span className="seat__name">{s.name}</span>
                  <span className="seat__state">{pub.scores[s.id] ?? 0}</span>
                </li>
              ))}
          </ul>

          <button
            className="btn btn--ghost"
            onClick={() => {
              room.leave();
              onExit();
            }}
          >
            Leave the bench
          </button>
        </>
      )}
    </Sheet>
  );
}
