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
  apply,
  resolveNight,
  resolveVote,
  openDay,
  nextNight,
  nightComplete,
  voteComplete,
  botNight,
  botVote,
  nameOf,
  mafiaCount,
  ROLE_LABEL,
  ROLE_BRIEF,
  type MafiaState,
  type MafiaPublic,
  type MafiaPrivate,
  type MafiaAction,
  type MafiaSeat,
} from './engine';

const GAME = GAME_BY_ID.mafia;
const BOT_NAMES = ['Chintu', 'Pinky', 'Guddu', 'Bittu', 'Sonu', 'Dolly', 'Rinku', 'Babli'];

type Screen = 'entry' | 'lobby' | 'playing';

export function Mafia({ onExit }: { onExit: () => void }) {
  const [screen, setScreen] = useState<Screen>('entry');
  const [code, setCode] = useState<string | null>(null);
  const [asHost, setAsHost] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Mafia is a game about reading people, so playing the computer is a poor
  // substitute — but it is the only way to learn the shape of it before you
  // inflict a first game on your friends, and it works with no backend at all.
  const [offline, setOffline] = useState(false);

  const me = playerId();
  const game = useRef<MafiaState | null>(null);
  const seatsRef = useRef<Seat[]>([]);
  const recorded = useRef(false);

  const [localPub, setLocalPub] = useState<MafiaPublic | null>(null);
  const [localPriv, setLocalPriv] = useState<MafiaPrivate | null>(null);

  const pushRef = useRef<
    ((pub: MafiaPublic, secrets: Record<string, MafiaPrivate>) => void) | null
  >(null);

  const publishState = useCallback(
    (state: MafiaState) => {
      game.current = state;
      const mafiaIds = state.pub.seats
        .filter((s) => state.roles[s.id] === 'mafia')
        .map((s) => s.id);
      const secrets: Record<string, MafiaPrivate> = {};
      for (const s of state.pub.seats) {
        const role = state.roles[s.id];
        secrets[s.id] = {
          role,
          partners: role === 'mafia' ? mafiaIds.filter((id) => id !== s.id) : [],
          findings: state.findings[s.id] ?? [],
        };
      }
      setLocalPub(state.pub);
      setLocalPriv(secrets[me] ?? null);
      pushRef.current?.(state.pub, secrets);
    },
    [me],
  );

  const onAction = useCallback(
    (from: string, action: MafiaAction) => {
      const state = game.current;
      if (!state) return;
      const next = apply(state, from, action);
      if (!next) return;
      if (action.type === 'vote') sfx.vote();
      publishState(next);
    },
    [publishState],
  );

  const onSeatJoin = useCallback((seat: Seat) => {
    if (seatsRef.current.length >= GAME.seats.max) return;
    seatsRef.current = [...seatsRef.current, seat];
    roomRef.current?.setSeats(seatsRef.current);
  }, []);

  const room = useRoom<MafiaPublic, MafiaPrivate, MafiaAction>({
    game: 'mafia',
    code: offline ? null : code,
    asHost,
    onAction,
    onSeatJoin,
  });
  const roomRef = useRef(room);
  roomRef.current = room;
  pushRef.current = (pub, secrets) => room.publish(pub, secrets);

  const pub = offline ? localPub : (room.pub ?? localPub);
  const priv = offline ? localPriv : (room.priv ?? (asHost ? localPriv : null));

  useEffect(() => {
    if (!offline) seatsRef.current = room.seats;
  }, [room.seats, offline]);

  // ---------------------------------------------------------------- start
  const hostRoom = useCallback(async () => {
    setBusy(true);
    setError(null);
    const created = await api.createRoom({
      pen: 'reynolds045',
      format: 1,
      game: 'mafia',
      maxSeats: GAME.seats.max,
    });
    setBusy(false);
    if (!created) {
      setError('Could not open a room.');
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
      const { room: r, error: err } = await api.joinRoom(entered, 'reynolds045', 'mafia');
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

  const startPractice = useCallback(() => {
    setOffline(true);
    setAsHost(true);
    const seats: Seat[] = [
      { id: me, name: playerName(), bot: false, online: true },
      ...BOT_NAMES.slice(0, 6).map((n, i) => ({
        id: `bot-${i}`,
        name: n,
        bot: true,
        online: true,
      })),
    ];
    seatsRef.current = seats;
    recorded.current = false;
    sfx.nightfall();
    publishState(deal(seats.map((x) => ({ id: x.id, name: x.name, bot: x.bot }))));
    setScreen('playing');
  }, [me, publishState]);

  const startGame = useCallback(() => {
    const seats: MafiaSeat[] = seatsRef.current.map((s) => ({
      id: s.id,
      name: s.name,
      bot: s.bot,
    }));
    recorded.current = false;
    sfx.nightfall();
    publishState(deal(seats));
    setScreen('playing');
  }, [publishState]);

  useEffect(() => {
    if (!offline && !asHost && room.pub && screen !== 'playing') setScreen('playing');
  }, [offline, asHost, room.pub, screen]);

  // ---------------------------------------------------------------- host loop
  const isRunner = offline || asHost;

  // Bots act at night.
  useEffect(() => {
    if (!pub || !isRunner || pub.phase !== 'night') return;
    const state = game.current;
    if (!state) return;
    const pending = pub.alive.filter(
      (id) => pub.seats.find((s) => s.id === id)?.bot && !pub.nightDone.includes(id),
    );
    if (!pending.length) return;

    const t = setTimeout(() => {
      const now = game.current;
      if (!now || now.pub.phase !== 'night') return;
      for (const id of pending) {
        const move = botNight(now, id);
        if (move) onAction(id, move);
        else if (!now.pub.nightDone.includes(id)) {
          // A bot villager has nothing to do; mark it done so the night can end.
          now.pub.nightDone.push(id);
        }
      }
      publishState({ ...game.current! });
    }, 900 + Math.random() * 700);
    return () => clearTimeout(t);
  }, [pub, isRunner, onAction, publishState]);

  // Night ends once everyone with a job has done it.
  useEffect(() => {
    if (!pub || !isRunner || pub.phase !== 'night') return;
    const state = game.current;
    if (!state || !nightComplete(state)) return;
    const t = setTimeout(() => {
      const now = game.current;
      if (!now || now.pub.phase !== 'night') return;
      sfx.daybreak();
      publishState(resolveNight(now));
    }, 700);
    return () => clearTimeout(t);
  }, [pub, isRunner, publishState]);

  // Dawn is a beat, then the arguing starts.
  useEffect(() => {
    if (!pub || !isRunner || pub.phase !== 'dawn') return;
    const t = setTimeout(() => {
      const now = game.current;
      if (!now || now.pub.phase !== 'dawn') return;
      publishState(openDay(now));
    }, 3200);
    return () => clearTimeout(t);
  }, [pub, isRunner, publishState]);

  // Bots vote during the day.
  useEffect(() => {
    if (!pub || !isRunner || pub.phase !== 'day') return;
    const pending = pub.alive.filter(
      (id) => pub.seats.find((s) => s.id === id)?.bot && pub.votes[id] === undefined,
    );
    if (!pending.length) return;
    const t = setTimeout(() => {
      const now = game.current;
      if (!now || now.pub.phase !== 'day') return;
      const one = pending[0];
      const move = botVote(now, one);
      if (move) onAction(one, move);
    }, 1100 + Math.random() * 1400);
    return () => clearTimeout(t);
  }, [pub, isRunner, onAction]);

  // Votes in, read the verdict.
  useEffect(() => {
    if (!pub || !isRunner || pub.phase !== 'day') return;
    const state = game.current;
    if (!state || !voteComplete(state)) return;
    const t = setTimeout(() => {
      const now = game.current;
      if (!now || now.pub.phase !== 'day') return;
      publishState(resolveVote(now));
    }, 800);
    return () => clearTimeout(t);
  }, [pub, isRunner, publishState]);

  // Verdict read, back to night.
  useEffect(() => {
    if (!pub || !isRunner || pub.phase !== 'verdict') return;
    const t = setTimeout(() => {
      const now = game.current;
      if (!now || now.pub.phase !== 'verdict') return;
      sfx.nightfall();
      publishState(nextNight(now));
    }, 3800);
    return () => clearTimeout(t);
  }, [pub, isRunner, publishState]);

  // ---------------------------------------------------------------- record
  useEffect(() => {
    if (!pub || pub.phase !== 'over' || recorded.current || !isRunner) return;
    recorded.current = true;
    const revealed = pub.revealed ?? {};
    const won = (id: string) =>
      pub.winner === 'mafia' ? revealed[id] === 'mafia' : revealed[id] !== 'mafia';
    sfx.matchEnd(won(me));
    const ranked = [...pub.seats].sort((a, b) => Number(won(b.id)) - Number(won(a.id)));
    void api.recordGame({
      game: 'mafia',
      mode: offline ? 'practice' : 'friend',
      rounds: pub.night,
      participants: ranked.map((s) => ({
        id: s.bot ? null : s.id,
        name: s.name,
        score: won(s.id) ? 1 : 0,
        place: won(s.id) ? 1 : 2,
      })),
    });
  }, [pub, isRunner, me, offline]);

  const act = useCallback(
    (action: MafiaAction, secret = false) => {
      if (isRunner) onAction(me, action);
      else room.send(action, { secret });
    },
    [isRunner, me, onAction, room],
  );

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
    const n = room.seats.length || seatsRef.current.length;
    return (
      <Lobby
        game={GAME}
        code={code ?? '?????'}
        seats={room.seats.length ? room.seats : seatsRef.current}
        isHost={asHost}
        me={me}
        minSeats={GAME.seats.min}
        canStart={n >= GAME.seats.min}
        note={
          n >= GAME.seats.min
            ? `${mafiaCount(n)} mafia, a doctor${n >= 5 ? ', an inspector' : ''}, and the rest villagers.`
            : 'Four at the very least. Seven or eight is where it gets good.'
        }
        onAddBot={asHost ? addBot : undefined}
        onStart={startGame}
        onLeave={() => {
          room.leave();
          onExit();
        }}
      />
    );
  }

  if (!pub) {
    return (
      <Sheet seed={61}>
        <SheetHeader title="Mafia" subtitle={GAME.name} />
        <p className="lede waiting-dots">Dealing the roles</p>
      </Sheet>
    );
  }

  const alive = pub.alive.includes(me);
  const role = priv?.role;
  const others = pub.alive.filter((id) => id !== me);
  const iVoted = pub.votes[me];
  const iActed = pub.nightDone.includes(me);
  const night = pub.phase === 'night';

  const nightPrompt =
    role === 'mafia'
      ? 'Choose someone.'
      : role === 'doctor'
        ? 'Who are you covering tonight?'
        : role === 'inspector'
          ? 'Who are you checking?'
          : 'You have no night. Sit tight.';

  const nightAction = (targetId: string): MafiaAction | null =>
    role === 'mafia'
      ? { type: 'kill', targetId }
      : role === 'doctor'
        ? { type: 'save', targetId }
        : role === 'inspector'
          ? { type: 'check', targetId }
          : null;

  const canTargetAtNight = (id: string) => {
    if (role === 'mafia') return !priv?.partners.includes(id) && id !== me;
    if (role === 'inspector') return id !== me;
    return true; // the doctor may cover anyone, themselves included
  };

  const chapter =
    pub.phase === 'night'
      ? `Night ${pub.night}`
      : pub.phase === 'dawn'
        ? `Morning of day ${pub.night}`
        : pub.phase === 'over'
          ? 'The whole story'
          : `Day ${pub.night}`;

  return (
    <Sheet seed={61} className={night ? 'night' : undefined}>
      <SheetHeader title="Mafia" subtitle={chapter} />

      {pub.phase === 'over' ? (
        <>
          <h1 className="title center">
            {pub.winner === 'mafia' ? 'The mafia win.' : 'The village wins.'}
          </h1>
          <div className="rule--thin" />
          <ul className="seat-list">
            {pub.seats.map((s) => {
              const r = pub.revealed?.[s.id];
              return (
                <li key={s.id} className={`seat${s.id === me ? ' seat--me' : ''}`}>
                  <span className="seat__num">{pub.alive.includes(s.id) ? '·' : '✗'}</span>
                  <span className="seat__name">{s.name}</span>
                  <span className={`seat__state${r === 'mafia' ? ' seat__state--bad' : ''}`}>
                    {r ? ROLE_LABEL[r] : '—'}
                  </span>
                </li>
              );
            })}
          </ul>
          <div className="mt-lg">
            {(asHost || offline) && (
              <button
                className="btn btn--primary"
                onClick={offline ? startPractice : startGame}
              >
                Deal again
              </button>
            )}
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
          {/* your card */}
          {role && (
            <div className="role-card">
              <div className="eyebrow">Your card</div>
              <div className={`role-card__name role-card__name--${role}`}>
                {ROLE_LABEL[role]}
              </div>
              <div className="muted center">{ROLE_BRIEF[role]}</div>
              {priv?.partners.length ? (
                <div className="role-card__partners">
                  With you: {priv.partners.map((id) => nameOf(pub, id)).join(', ')}
                </div>
              ) : null}
              {priv?.findings.length ? (
                <div className="role-card__partners">
                  {priv.findings.map((f) => (
                    <span key={f.id}>
                      {nameOf(pub, f.id)} — {f.mafia ? 'mafia' : 'clean'}
                      {'  '}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          )}

          <div className="rule--thin" />

          {!alive && (
            <p className="lede">
              You are out. You can watch, but you cannot talk and you cannot vote.
            </p>
          )}

          {night && alive && (
            <>
              <div className="eyebrow">{iActed ? 'Waiting for the others…' : nightPrompt}</div>
              {!iActed && role !== 'villager' && (
                <div className="target-grid">
                  {pub.alive
                    .filter((id) => canTargetAtNight(id))
                    .map((id) => (
                      <button
                        key={id}
                        className="target"
                        onClick={() => {
                          const a = nightAction(id);
                          if (a) act(a, true);
                        }}
                      >
                        {nameOf(pub, id)}
                      </button>
                    ))}
                </div>
              )}
              {role === 'villager' && (
                <p className="lede">Nothing for you to do until it gets light.</p>
              )}
            </>
          )}

          {pub.phase === 'dawn' && (
            <>
              <h2 className="title center">
                {pub.lastVictim
                  ? `${nameOf(pub, pub.lastVictim)} is gone.`
                  : pub.lastSaved
                    ? 'Somebody got lucky.'
                    : 'Nothing happened.'}
              </h2>
              <p className="lede">
                {pub.lastSaved
                  ? 'The doctor was in the right place.'
                  : pub.lastVictim
                    ? 'Nobody saw anything, obviously.'
                    : 'Which is its own kind of suspicious.'}
              </p>
            </>
          )}

          {pub.phase === 'day' && (
            <>
              <div className="eyebrow">
                {alive ? (iVoted ? 'Vote cast. Waiting…' : 'Who hangs?') : 'The living are voting'}
              </div>
              <div className="target-grid">
                {others.map((id) => {
                  const count = Object.values(pub.votes).filter((v) => v === id).length;
                  return (
                    <button
                      key={id}
                      className={`target${iVoted === id ? ' target--on' : ''}`}
                      disabled={!alive || !!iVoted}
                      onClick={() => act({ type: 'vote', targetId: id })}
                    >
                      {nameOf(pub, id)}
                      {count > 0 && <b className="target__count">{count}</b>}
                    </button>
                  );
                })}
              </div>
              <div className="muted center mt">
                {Object.keys(pub.votes).length} of {pub.alive.length} have voted.
              </div>
            </>
          )}

          {pub.phase === 'verdict' && (
            <>
              <h2 className="title center">
                {pub.lastHanged ? `${nameOf(pub, pub.lastHanged)} hangs.` : 'Nobody hangs.'}
              </h2>
              <p className="lede">{pub.log[pub.log.length - 1]}</p>
            </>
          )}

          <div className="rule--thin" />
          <div className="eyebrow">The village</div>
          <ul className="seat-list">
            {pub.seats.map((s) => (
              <li
                key={s.id}
                className={`seat${s.id === me ? ' seat--me' : ''}${
                  pub.alive.includes(s.id) ? '' : ' seat--gone'
                }`}
              >
                <span className="seat__num">{pub.alive.includes(s.id) ? '·' : '✗'}</span>
                <span className="seat__name">{s.name}</span>
                <span className="seat__state">
                  {pub.alive.includes(s.id) ? (s.bot ? 'computer' : 'alive') : 'out'}
                </span>
              </li>
            ))}
          </ul>

          <div className="log">
            {pub.log.slice(-4).map((line, i) => (
              <div key={i} className="log__line">
                {line}
              </div>
            ))}
          </div>

          <button
            className="btn btn--ghost"
            onClick={() => {
              room.leave();
              onExit();
            }}
          >
            Leave the game
          </button>
        </>
      )}
    </Sheet>
  );
}
