import { useState } from 'react';
import { Sheet, SheetHeader } from '../ui/Sheet';
import { roomLink } from './room';
import type { Seat } from './room';
import type { GameDef } from './games';
import { sfx } from '../lib/audio';

/**
 * The bit before any multiplayer game starts: make a room, or join one.
 *
 * Shared by every game on the site, so the way you get a friend into a card
 * game is exactly the way you get them onto a desk.
 */

export function RoomEntry({
  game,
  busy,
  error,
  onHost,
  onJoin,
  onPractice,
  onBack,
}: {
  game: GameDef;
  busy: boolean;
  error: string | null;
  onHost: () => void;
  onJoin: (code: string) => void;
  onPractice?: () => void;
  onBack: () => void;
}) {
  const [code, setCode] = useState('');

  return (
    <Sheet seed={19}>
      <SheetHeader title={game.name} subtitle={game.era} />
      <h1 className="title center">{game.name}</h1>
      <p className="lede">{game.blurb}</p>

      <div className="rule--thin" />

      {game.practice && onPractice && (
        <>
          <button
            className="btn btn--primary"
            onClick={() => {
              sfx.tick();
              onPractice();
            }}
          >
            Practice match
          </button>
          <div className="muted center" style={{ marginTop: 6 }}>
            {game.id === 'rang'
              ? 'Against three classmates the computer plays.'
              : 'Against classmates the computer plays.'}
          </div>
          <div className="rule--thin" />
        </>
      )}

      <button className="btn" onClick={onHost} disabled={busy}>
        {busy ? 'Setting up…' : 'Make a room'}
      </button>
      <div className="muted center" style={{ marginTop: 6 }}>
        {game.seats.min === game.seats.max
          ? `${game.seats.max} players.`
          : `${game.seats.min} to ${game.seats.max} players.`}{' '}
        Send them the link.
      </div>

      <div className="field">
        <label className="field__label" htmlFor="room-code">
          Or join theirs
        </label>
        <input
          id="room-code"
          className="field__input field__input--code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 5))}
          onKeyDown={(e) => e.key === 'Enter' && code.length === 5 && onJoin(code)}
          placeholder="ABCDE"
          autoComplete="off"
          spellCheck={false}
          maxLength={5}
        />
      </div>
      <button className="btn" disabled={code.length !== 5 || busy} onClick={() => onJoin(code)}>
        Join
      </button>

      {error && <div className="field__error center">{error}</div>}

      <button className="btn btn--ghost" onClick={onBack}>
        Back to the shelf
      </button>
    </Sheet>
  );
}

export function Lobby({
  game,
  code,
  seats,
  isHost,
  me,
  minSeats,
  canStart,
  note,
  onAddBot,
  onStart,
  onLeave,
}: {
  game: GameDef;
  code: string;
  seats: Seat[];
  isHost: boolean;
  me: string;
  minSeats: number;
  canStart: boolean;
  note?: string;
  onAddBot?: () => void;
  onStart: () => void;
  onLeave: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const link = roomLink(game.id, code);
    const text = `${game.name}? Room ${code}.`;
    try {
      if (navigator.share) {
        await navigator.share({ title: game.name, text, url: link });
        return;
      }
      await navigator.clipboard.writeText(`${text} ${link}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      /* dismissed */
    }
  };

  return (
    <Sheet seed={29}>
      <SheetHeader title={game.name} subtitle="waiting room" />
      <h2 className="title center">Waiting on the bench</h2>

      <div className="code-plate">
        <div className="code-plate__code">{code}</div>
        <div className="code-plate__hint">read it out, or send the link</div>
      </div>

      <button className="btn btn--primary" onClick={share}>
        {copied ? 'Link copied' : 'Send the link'}
      </button>

      <div className="rule--thin" />

      <div className="eyebrow">
        {seats.length} of {game.seats.max} seats
      </div>
      <ul className="seat-list">
        {seats.map((s, i) => (
          <li key={s.id} className={`seat${s.online ? '' : ' seat--gone'}`}>
            <span className="seat__num">{i + 1}</span>
            <span className="seat__name">
              {s.name}
              {s.id === me && <span className="muted"> — you</span>}
              {i === 0 && <span className="muted"> · dealing</span>}
            </span>
            <span className="seat__state">
              {s.bot ? 'computer' : s.online ? 'here' : 'gone'}
            </span>
          </li>
        ))}
        {Array.from({ length: Math.max(0, minSeats - seats.length) }).map((_, i) => (
          <li key={`empty-${i}`} className="seat seat--empty">
            <span className="seat__num">{seats.length + i + 1}</span>
            <span className="seat__name waiting-dots">waiting</span>
            <span className="seat__state" />
          </li>
        ))}
      </ul>

      {note && <div className="muted center mt">{note}</div>}

      {isHost ? (
        <div className="mt">
          {onAddBot && seats.length < game.seats.max && (
            <button className="btn btn--small" onClick={onAddBot}>
              Add a computer player
            </button>
          )}
          <button
            className="btn btn--primary"
            style={{ marginTop: 10 }}
            disabled={!canStart}
            onClick={() => {
              sfx.bell();
              onStart();
            }}
          >
            {canStart ? 'Start' : `Need ${minSeats} players`}
          </button>
        </div>
      ) : (
        <p className="lede mt">
          Waiting for {seats[0]?.name ?? 'the host'} to start
          <span className="waiting-dots" />
        </p>
      )}

      <button className="btn btn--ghost" onClick={onLeave}>
        Leave the room
      </button>
    </Sheet>
  );
}
