import { useEffect, useState } from 'react';
import { Sheet, SheetHeader } from '../ui/Sheet';
import { GAMES, type GameId } from './games';
import { api, type Counters } from '../lib/api';
import { sfx } from '../lib/audio';

/**
 * The shelf.
 *
 * Everything on this site is a game somebody actually played — at a desk, on a
 * bus, or in a dormitory after lights out. The hub is a page torn out of a
 * notebook with the list written on it, because that is how these got passed
 * around in the first place.
 */

const nf = new Intl.NumberFormat('en-IN');

function Counter({ value, label }: { value: number; label: string }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (value <= 0) {
      setShown(0);
      return;
    }
    const t0 = performance.now();
    let raf = 0;
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / 900);
      setShown(Math.round(value * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return (
    <div className="counter">
      <div className="counter__value">{nf.format(shown)}</div>
      <div className="counter__label">{label}</div>
    </div>
  );
}

export function Arcade({
  playerName,
  onPick,
  onRename,
  onRanking,
  soundOn,
  onToggleSound,
}: {
  playerName: string;
  onPick: (id: GameId) => void;
  onRename: () => void;
  onRanking: () => void;
  soundOn: boolean;
  onToggleSound: () => void;
}) {
  const [counters, setCounters] = useState<Counters | null>(null);

  useEffect(() => {
    let alive = true;
    void api.counters().then((c) => alive && setCounters(c));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <Sheet seed={3}>
      <SheetHeader subtitle="games we used to play" />

      <h1 className="title center">The back bench</h1>
      <p className="lede">
        Four games from the last row of an Indian classroom, and the bus home.
        Play the computer, or send someone a link and play them.
      </p>

      <div className="rule--thin" />

      <div className="versus" style={{ gridTemplateColumns: '1fr auto', marginBottom: 8 }}>
        <div>
          <div className="eyebrow" style={{ textAlign: 'left' }}>
            Playing as
          </div>
          <div className="versus__name" style={{ textAlign: 'left', fontSize: 19 }}>
            {playerName}
          </div>
        </div>
        <div className="btn-row">
          <button className="chip" onClick={onRename}>
            Change
          </button>
          <button
            className={`chip${soundOn ? ' chip--on' : ''}`}
            onClick={onToggleSound}
            aria-pressed={soundOn}
            title={soundOn ? 'Sound is on' : 'Sound is off'}
          >
            {soundOn ? '♪ Sound on' : '♪ Sound off'}
          </button>
        </div>
      </div>

      <div className="shelf">
        {GAMES.map((g) => (
          <button
            key={g.id}
            className="shelf__card"
            style={{ ['--card-ink' as string]: g.ink, ['--card-wash' as string]: g.wash }}
            onClick={() => {
              sfx.tick();
              onPick(g.id);
            }}
          >
            <span className="shelf__head">
              <span className="shelf__name">{g.name}</span>
              <span className="shelf__seats">
                {g.seats.min === g.seats.max
                  ? `${g.seats.max} players`
                  : `${g.seats.min}–${g.seats.max} players`}
              </span>
            </span>
            <span className="shelf__tag">{g.tagline}</span>
            {g.alsoKnownAs && (
              <span className="shelf__aka">you probably call it {g.alsoKnownAs}</span>
            )}
            <span className="shelf__foot">
              <span className="shelf__era">{g.era}</span>
              <span className="shelf__modes">
                {g.practice && <span className="shelf__pill">vs computer</span>}
                {g.online && <span className="shelf__pill">with friends</span>}
              </span>
            </span>
          </button>
        ))}
      </div>

      <div className="rule--thin" />

      <div className="eyebrow">Everything played here so far</div>
      <div className="counters">
        <Counter value={counters?.total_matches ?? 0} label="games played" />
        <Counter value={counters?.unique_users ?? 0} label="kids in class" />
        <Counter value={counters?.practice_matches ?? 0} label="vs computer" />
        <Counter value={counters?.friend_matches ?? 0} label="with friends" />
      </div>
      {counters && counters.live_rooms > 0 && (
        <div className="muted center" style={{ marginTop: 8 }}>
          {counters.live_rooms} room{counters.live_rooms === 1 ? '' : 's'} open right now
          {counters.matches_today > 0 && ` · ${nf.format(counters.matches_today)} played today`}
        </div>
      )}
      {!api.online && (
        <div className="field__error center">
          No backend configured — you can still play the computer, but nothing is
          recorded and friend rooms are off.
        </div>
      )}

      <button className="btn btn--small mt" onClick={onRanking}>
        Class ranking
      </button>
    </Sheet>
  );
}
