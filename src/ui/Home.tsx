import { useEffect, useState } from 'react';
import { Sheet, SheetHeader } from './Sheet';
import { PenSvg } from './PenSvg';
import { api, type Counters, type Rival } from '../lib/api';
import { getPen } from '../game/pens';

/**
 * The desk you sit down at.
 *
 * Three ways to play, the class totals in chalk-adjacent tabular numbers, and
 * the name of the one kid you are allowed to challenge. Nothing else.
 */

const nf = new Intl.NumberFormat('en-IN');

function Counter({ value, label }: { value: number; label: string }) {
  // Tick up to the real number so the page feels alive on load.
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (value <= 0) {
      setShown(0);
      return;
    }
    const from = 0;
    const dur = 900;
    const t0 = performance.now();
    let raf = 0;
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / dur);
      const eased = 1 - Math.pow(1 - k, 3);
      setShown(Math.round(from + (value - from) * eased));
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

export function Home({
  playerName,
  penId,
  points,
  rank,
  classSize,
  onPractice,
  onFriend,
  onRanked,
  onPenBox,
  onRanking,
  onHowTo,
  onRename,
}: {
  playerName: string;
  penId: string;
  points: number;
  rank: number | null;
  classSize: number;
  onPractice: () => void;
  onFriend: () => void;
  onRanked: (rival: Rival) => void;
  onPenBox: () => void;
  onRanking: () => void;
  onHowTo: () => void;
  onRename: () => void;
}) {
  const [counters, setCounters] = useState<Counters | null>(null);
  const [rival, setRival] = useState<Rival | null>(null);
  const [loadingRival, setLoadingRival] = useState(true);

  useEffect(() => {
    let alive = true;
    void api.counters().then((c) => alive && setCounters(c));
    void api.rivalAbove().then((r) => {
      if (!alive) return;
      setRival(r);
      setLoadingRival(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  const pen = getPen(penId);

  return (
    <Sheet seed={4}>
      <SheetHeader />

      <h1 className="title center">The back-bench classic</h1>
      <p className="lede">
        Flick your pen. Knock theirs off the desk. Whoever loses the pen, loses
        the pen — that was always the rule.
      </p>

      <div className="rule--thin" />

      {/* who you are */}
      <div className="versus" style={{ gridTemplateColumns: '1fr auto', marginBottom: 4 }}>
        <div>
          <div className="eyebrow" style={{ textAlign: 'left' }}>
            Playing as
          </div>
          <div className="versus__name" style={{ textAlign: 'left', fontSize: 19 }}>
            {playerName}
          </div>
          <div style={{ textAlign: 'left' }} className="muted">
            {rank
              ? `${ordinal(rank)} in the class of ${nf.format(classSize)}`
              : 'not on the board yet'}{' '}
            · {nf.format(points)} pts
          </div>
        </div>
        <button className="chip" onClick={onRename}>
          Change
        </button>
      </div>

      <button
        className="slot"
        onClick={onPenBox}
        style={{ marginTop: 12 }}
        aria-label={`Current pen: ${pen.name}. Open the pen box.`}
      >
        <span className="slot__art">
          <PenSvg pen={pen} />
        </span>
        <span className="slot__body">
          <span className="slot__name">{pen.name}</span>
          <span className="slot__meta">
            in your hand · tap to open the box
          </span>
        </span>
      </button>

      <div className="rule--thin" />

      {/* the three ways in */}
      <button className="btn btn--primary" onClick={onPractice}>
        Practice match
      </button>
      <div className="muted center" style={{ marginTop: 6 }}>
        Against a classmate the computer plays. No pen at stake.
      </div>

      <button className="btn" onClick={onFriend} style={{ marginTop: 14 }}>
        Play with a friend
      </button>
      <div className="muted center" style={{ marginTop: 6 }}>
        Two players, one link. Winner keeps the pen.
      </div>

      <button
        className="btn"
        style={{ marginTop: 14 }}
        disabled={!rival || !api.online}
        onClick={() => rival && onRanked(rival)}
      >
        {loadingRival
          ? 'Finding your rival…'
          : rival
            ? `Challenge ${rival.handle}`
            : 'No rival yet'}
      </button>
      <div className="muted center" style={{ marginTop: 6 }}>
        {rival
          ? `${ordinal(rival.rank)} in the class, one rung above you. That is the only ladder there is.`
          : 'Win a match to get on the board, then you can challenge upwards.'}
      </div>

      <div className="rule--thin" />

      {/* the class totals */}
      <div className="eyebrow">Everything played here so far</div>
      <div className="counters">
        <Counter value={counters?.total_matches ?? 0} label="matches total" />
        <Counter value={counters?.unique_users ?? 0} label="kids in class" />
        <Counter value={counters?.practice_matches ?? 0} label="practice" />
        <Counter value={counters?.friend_matches ?? 0} label="two-player" />
        <Counter value={counters?.pens_knocked_off ?? 0} label="pens knocked off" />
        <Counter value={counters?.pens_captured ?? 0} label="pens changed hands" />
      </div>
      {counters && counters.live_rooms > 0 && (
        <div className="muted center" style={{ marginTop: 8 }}>
          {counters.live_rooms} desk{counters.live_rooms === 1 ? '' : 's'} in use right now
          {counters.matches_today > 0 && ` · ${nf.format(counters.matches_today)} played today`}
        </div>
      )}
      {!api.online && (
        <div className="field__error center">
          No backend configured — practice mode only, nothing is being recorded.
        </div>
      )}

      <div className="btn-row mt">
        <button className="btn btn--small" onClick={onRanking}>
          Class ranking
        </button>
        <button className="btn btn--small" onClick={onHowTo}>
          How to play
        </button>
      </div>
    </Sheet>
  );
}

export function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}
