import { useCallback, useEffect, useRef, useState } from 'react';
import { Sheet, SheetHeader } from '../../ui/Sheet';
import { RoomEntry, Lobby } from '../../arcade/Lobby';
import { useRoom, type Seat } from '../../arcade/room';
import { GAME_BY_ID } from '../../arcade/games';
import { playerId, playerName } from '../../lib/identity';
import { sfx } from '../../lib/audio';
import { api } from '../../lib/api';
import {
  startRound,
  apply,
  botMove,
  botShouldCall,
  playable,
  cardLabel,
  currentSeat,
  nameOf,
  COLOURS,
  COLOUR_HEX,
  COLOUR_NAME,
  type Card,
  type Colour,
  type RangState,
  type RangPublic,
  type RangPrivate,
  type RangAction,
  type RangSeat,
} from './engine';

const GAME = GAME_BY_ID.rang;
const BOT_NAMES = ['Chintu', 'Pinky', 'Guddu', 'Bittu', 'Sonu'];

type Screen = 'entry' | 'lobby' | 'playing';

// ------------------------------------------------------------------ card

function CardFace({
  card,
  onClick,
  disabled,
  small,
  faceDown,
}: {
  card?: Card;
  onClick?: () => void;
  disabled?: boolean;
  small?: boolean;
  faceDown?: boolean;
}) {
  const cls = `card${small ? ' card--small' : ''}${disabled ? ' card--dim' : ''}${
    faceDown ? ' card--back' : ''
  }`;

  if (faceDown || !card) {
    return <div className={cls} aria-hidden="true" />;
  }

  const colour = card.colour ?? null;
  const style = colour
    ? { ['--card-c' as string]: COLOUR_HEX[colour] }
    : { ['--card-c' as string]: '#2b2b30' };

  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      className={cls}
      style={style}
      onClick={onClick}
      disabled={onClick ? disabled : undefined}
      aria-label={`${colour ? COLOUR_NAME[colour] : 'Wild'} ${cardLabel(card)}`}
    >
      <span className="card__corner card__corner--tl">{cardLabel(card)}</span>
      <span className={`card__pip${cardLabel(card).length > 2 ? ' card__pip--word' : ''}`}>
        {card.kind === 'wild' || card.kind === 'wild4' ? (
          <span className="card__rang" aria-hidden="true">
            {COLOURS.map((c) => (
              <i key={c} style={{ background: COLOUR_HEX[c] }} />
            ))}
          </span>
        ) : (
          cardLabel(card)
        )}
      </span>
      <span className="card__corner card__corner--br">{cardLabel(card)}</span>
    </Tag>
  );
}

// ------------------------------------------------------------------ game

export function Rang({ onExit }: { onExit: () => void }) {
  const [screen, setScreen] = useState<Screen>('entry');
  const [code, setCode] = useState<string | null>(null);
  const [asHost, setAsHost] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const [pickColour, setPickColour] = useState<string | null>(null);

  const me = playerId();
  const game = useRef<RangState | null>(null);
  const seatsRef = useRef<Seat[]>([]);
  const recorded = useRef(false);

  const [localPub, setLocalPub] = useState<RangPublic | null>(null);
  const [localPriv, setLocalPriv] = useState<RangPrivate | null>(null);

  const pushRef = useRef<
    ((pub: RangPublic, secrets: Record<string, RangPrivate>) => void) | null
  >(null);

  const publishState = useCallback(
    (state: RangState) => {
      game.current = state;
      const secrets: Record<string, RangPrivate> = {};
      for (const s of state.pub.seats) secrets[s.id] = { hand: state.hands[s.id] ?? [] };
      setLocalPub(state.pub);
      setLocalPriv(secrets[me] ?? null);
      pushRef.current?.(state.pub, secrets);
    },
    [me],
  );

  const onAction = useCallback(
    (from: string, action: RangAction) => {
      const state = game.current;
      if (!state) return;
      const next = apply(state, from, action);
      if (!next) return;
      if (action.type === 'play') sfx.cardPlay();
      if (action.type === 'draw') sfx.cardDraw();
      if (action.type === 'call') sfx.good();
      publishState(next);
    },
    [publishState],
  );

  const onSeatJoin = useCallback((seat: Seat) => {
    if (seatsRef.current.length >= GAME.seats.max) return;
    seatsRef.current = [...seatsRef.current, seat];
    roomRef.current?.setSeats(seatsRef.current);
  }, []);

  const room = useRoom<RangPublic, RangPrivate, RangAction>({
    game: 'rang',
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
  const beginRound = useCallback(
    (seats: RangSeat[], round: number, scores: Record<string, number>) => {
      recorded.current = false;
      sfx.shuffle();
      publishState(startRound(seats, round, scores));
      setScreen('playing');
    },
    [publishState],
  );

  const startPractice = useCallback(() => {
    setOffline(true);
    setAsHost(true);
    const seats: RangSeat[] = [
      { id: me, name: playerName(), bot: false },
      ...BOT_NAMES.slice(0, 3).map((n, i) => ({ id: `bot-${i}`, name: n, bot: true })),
    ];
    seatsRef.current = seats.map((s) => ({ ...s, online: true }));
    beginRound(seats, 1, Object.fromEntries(seats.map((s) => [s.id, 0])));
  }, [me, beginRound]);

  const hostRoom = useCallback(async () => {
    setBusy(true);
    setError(null);
    const created = await api.createRoom({
      pen: 'reynolds045',
      format: 1,
      game: 'rang',
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
      const { room: r, error: err } = await api.joinRoom(entered, 'reynolds045', 'rang');
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
    const seats: RangSeat[] = seatsRef.current.map((s) => ({
      id: s.id,
      name: s.name,
      bot: s.bot,
    }));
    beginRound(seats, 1, Object.fromEntries(seats.map((s) => [s.id, 0])));
  }, [beginRound]);

  useEffect(() => {
    if (!offline && !asHost && room.pub && screen !== 'playing') setScreen('playing');
  }, [offline, asHost, room.pub, screen]);

  // ---------------------------------------------------------------- bots
  useEffect(() => {
    if (!pub || pub.phase !== 'playing' || !(offline || asHost)) return;
    const seat = currentSeat(pub);
    if (!seat?.bot) return;

    const t = setTimeout(() => {
      const state = game.current;
      if (!state || state.pub.phase !== 'playing') return;
      const active = currentSeat(state.pub);
      if (!active?.bot) return;

      if (botShouldCall(state, active.id)) onAction(active.id, { type: 'call' });

      const move = botMove(state, active.id);
      onAction(active.id, move);

      // Having drawn, they take the card if it fits and pass if it does not.
      setTimeout(() => {
        const after = game.current;
        if (!after || after.pub.phase !== 'playing') return;
        if (currentSeat(after.pub).id !== active.id) return;
        const hand = after.hands[active.id] ?? [];
        const drawn = hand.find((c) => c.id === after.pub.drewThisTurn);
        if (drawn && playable(drawn, after.pub.top, after.pub.active, after.pub.pending)) {
          onAction(active.id, botMove(after, active.id));
        } else {
          onAction(active.id, { type: 'pass' });
        }
      }, 700);
    }, 900 + Math.random() * 900);

    return () => clearTimeout(t);
  }, [pub, offline, asHost, onAction]);

  // ---------------------------------------------------------------- record
  useEffect(() => {
    if (!pub || pub.phase !== 'over' || recorded.current) return;
    if (!(offline || asHost)) return;
    recorded.current = true;
    sfx.matchEnd(pub.winnerId === me);
    const ranked = [...pub.seats].sort(
      (a, b) => (pub.scores[b.id] ?? 0) - (pub.scores[a.id] ?? 0),
    );
    void api.recordGame({
      game: 'rang',
      mode: offline ? 'practice' : 'friend',
      rounds: pub.round,
      participants: ranked.map((s, i) => ({
        id: s.bot ? null : s.id,
        name: s.name,
        score: pub.scores[s.id] ?? 0,
        place: i + 1,
      })),
    });
  }, [pub, offline, asHost, me]);

  // ---------------------------------------------------------------- play
  const act = useCallback(
    (action: RangAction) => {
      if (offline || asHost) onAction(me, action);
      else room.send(action);
    },
    [offline, asHost, me, onAction, room],
  );

  const playCard = useCallback(
    (card: Card) => {
      if (card.kind === 'wild' || card.kind === 'wild4') {
        setPickColour(card.id);
        return;
      }
      act({ type: 'play', cardId: card.id });
    },
    [act],
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
    return (
      <Lobby
        game={GAME}
        code={code ?? '?????'}
        seats={room.seats.length ? room.seats : seatsRef.current}
        isHost={asHost}
        me={me}
        minSeats={GAME.seats.min}
        canStart={(room.seats.length || seatsRef.current.length) >= GAME.seats.min}
        note="Two plays fine. Four is the proper game."
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
      <Sheet seed={53}>
        <SheetHeader title="Rang" subtitle={GAME.name} />
        <p className="lede waiting-dots">Dealing</p>
      </Sheet>
    );
  }

  const hand = priv?.hand ?? [];
  const myTurn = currentSeat(pub)?.id === me && pub.phase === 'playing';
  const canPlayAny = hand.some((c) => playable(c, pub.top, pub.active, pub.pending));

  if (pub.phase === 'over') {
    const ranked = [...pub.seats].sort(
      (a, b) => (pub.scores[b.id] ?? 0) - (pub.scores[a.id] ?? 0),
    );
    return (
      <Sheet seed={53}>
        <SheetHeader title="Rang" subtitle={GAME.name} />
        <h1 className="title center">
          {pub.winnerId === me ? 'You went out.' : `${nameOf(pub, pub.winnerId ?? '')} went out.`}
        </h1>
        <div className="rule--thin" />
        <ul className="seat-list">
          {ranked.map((s, i) => (
            <li key={s.id} className={`seat${s.id === me ? ' seat--me' : ''}`}>
              <span className="seat__num">{i + 1}</span>
              <span className="seat__name">{s.name}</span>
              <span className="seat__state">{pub.scores[s.id] ?? 0}</span>
            </li>
          ))}
        </ul>
        <div className="mt-lg">
          {(offline || asHost) && (
            <button
              className="btn btn--primary"
              onClick={() => beginRound(pub.seats, pub.round + 1, pub.scores)}
            >
              Next round
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
      </Sheet>
    );
  }

  return (
    <Sheet seed={53} width="wide">
      <SheetHeader title="Rang" subtitle={`Round ${pub.round}`} />

      {/* other seats */}
      <div className="table-seats">
        {pub.seats
          .filter((s) => s.id !== me)
          .map((s) => {
            const isTurn = currentSeat(pub).id === s.id;
            return (
              <div key={s.id} className={`table-seat${isTurn ? ' table-seat--turn' : ''}`}>
                <span className="table-seat__name">{s.name}</span>
                <span className="table-seat__cards">
                  {Array.from({ length: Math.min(pub.counts[s.id] ?? 0, 8) }).map((_, i) => (
                    <CardFace key={i} faceDown small />
                  ))}
                </span>
                <span className="table-seat__count">
                  {pub.counts[s.id] ?? 0}
                  {pub.called.includes(s.id) && <b className="called"> one!</b>}
                </span>
              </div>
            );
          })}
      </div>

      {/* the pile */}
      <div className="pile">
        <button
          className="pile__deck"
          onClick={() => act({ type: 'draw' })}
          disabled={!myTurn || (!!pub.drewThisTurn && pub.pending === 0)}
          title="Draw"
        >
          <CardFace faceDown />
          <span className="pile__count">{pub.drawPile}</span>
        </button>
        <div className="pile__top">
          <CardFace card={pub.top ?? undefined} />
          {pub.active && (
            <span className="pile__colour" style={{ background: COLOUR_HEX[pub.active] }}>
              {COLOUR_NAME[pub.active]}
            </span>
          )}
        </div>
        <div className="pile__info">
          <div className="pile__dir">{pub.direction === 1 ? '↻' : '↺'}</div>
          {pub.pending > 0 && <div className="pile__pending">+{pub.pending} waiting</div>}
        </div>
      </div>

      {pub.lastEvent && <div className="ticker">{pub.lastEvent}</div>}

      {/* your hand */}
      <div className="eyebrow">
        {myTurn
          ? pub.pending > 0 && !canPlayAny
            ? `Answer it or eat ${pub.pending}`
            : 'Your turn'
          : `${currentSeat(pub).name} is playing…`}
      </div>

      <div className="hand">
        {hand.map((c) => {
          const ok =
            myTurn &&
            playable(c, pub.top, pub.active, pub.pending) &&
            (!pub.drewThisTurn || c.id === pub.drewThisTurn);
          return (
            <CardFace
              key={c.id}
              card={c}
              disabled={!ok}
              onClick={ok ? () => playCard(c) : undefined}
            />
          );
        })}
      </div>

      <div className="btn-row mt">
        <button
          className="btn btn--small"
          style={{ flex: 1 }}
          disabled={hand.length > 2 || pub.called.includes(me)}
          onClick={() => act({ type: 'call' })}
        >
          One card!
        </button>
        {myTurn && pub.drewThisTurn && (
          <button className="btn btn--small" style={{ flex: 1 }} onClick={() => act({ type: 'pass' })}>
            Pass
          </button>
        )}
        <button
          className="btn btn--small"
          style={{ flex: 1 }}
          onClick={() => {
            room.leave();
            onExit();
          }}
        >
          Leave
        </button>
      </div>

      {/* choosing a colour for a wild */}
      {pickColour && (
        <div className="colour-pick">
          <div className="colour-pick__panel">
            <div className="eyebrow">Call the colour</div>
            <div className="colour-pick__row">
              {COLOURS.map((c) => (
                <button
                  key={c}
                  className="colour-pick__swatch"
                  style={{ background: COLOUR_HEX[c] }}
                  onClick={() => {
                    act({ type: 'play', cardId: pickColour, colour: c as Colour });
                    setPickColour(null);
                  }}
                >
                  {COLOUR_NAME[c]}
                </button>
              ))}
            </div>
            <button className="btn btn--ghost" onClick={() => setPickColour(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </Sheet>
  );
}
