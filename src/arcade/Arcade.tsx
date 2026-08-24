import { useEffect, useState } from 'react';
import { Sheet, SheetHeader } from '../ui/Sheet';
import { GAMES, type GameId } from './games';
import { EFFECTS, type EffectId } from '../effects/effects';
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

type Tab = 'games' | 'effects';

export function Arcade({
  playerName,
  onPick,
  onEffect,
  onRename,
  onRanking,
  soundOn,
  onToggleSound,
}: {
  playerName: string;
  onPick: (id: GameId) => void;
  onEffect: (id: EffectId) => void;
  onRename: () => void;
  onRanking: () => void;
  soundOn: boolean;
  onToggleSound: () => void;
}) {
  const [counters, setCounters] = useState<Counters | null>(null);
  const [tab, setTab] = useState<Tab>('games');

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
        {tab === 'games'
          ? 'Games from the last row of an Indian classroom, the bus home, and the pavement outside. Play the computer, or send someone a link.'
          : 'Not games — the moving parts. Each one is a single idea, measured off a reference and written down, with its numbers on the card.'}
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

      <div className="tabs" role="tablist">
        {(['games', 'effects'] as Tab[]).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            className={`tabs__tab${tab === t ? ' tabs__tab--on' : ''}`}
            onClick={() => {
              sfx.tick();
              setTab(t);
            }}
          >
            {t === 'games' ? 'Games' : 'Effects'}
          </button>
        ))}
      </div>

      {tab === 'effects' && (
        <div className="shelf">
          {EFFECTS.map((e) => (
            <button
              key={e.id}
              className="shelf__card"
              style={{ ['--card-ink' as string]: e.ink, ['--card-wash' as string]: e.wash }}
              onClick={() => {
                sfx.tick();
                onEffect(e.id);
              }}
            >
              <span className="shelf__head">
                <span className="shelf__name">{e.name}</span>
                <span className="shelf__seats">canvas</span>
              </span>
              <span className="shelf__tag">{e.tagline}</span>
              <span className="shelf__foot">
                <span className="shelf__modes">
                  {e.spec.map((sp) => (
                    <span className="shelf__pill" key={sp}>
                      {sp}
                    </span>
                  ))}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}

      <div className="shelf" style={{ display: tab === 'games' ? undefined : 'none' }}>
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
                  ? `${g.seats.max} player${g.seats.max === 1 ? '' : 's'}`
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
                {g.solo && <span className="shelf__pill">just you</span>}
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
