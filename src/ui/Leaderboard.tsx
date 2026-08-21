import { useEffect, useState } from 'react';
import { Slate } from './Sheet';
import { api, type RankRow } from '../lib/api';
import { getPen } from '../game/pens';
import { playerId } from '../lib/identity';
import { ordinal } from './Home';

/**
 * Top of the class.
 *
 * Ten names, in chalk, the way the monitor wrote them on the board every Friday.
 * If you are further down than tenth your own row is pinned underneath so you
 * can see the gap you are closing.
 */

const nf = new Intl.NumberFormat('en-IN');

export function Leaderboard({ onBack }: { onBack: () => void }) {
  const [rows, setRows] = useState<RankRow[] | null>(null);
  const [mine, setMine] = useState<{ rank: number | null; classSize: number } | null>(null);
  const me = playerId();

  useEffect(() => {
    let alive = true;
    void api.top(10).then((r) => alive && setRows(r));
    void api.myCard().then((c) => {
      if (!alive || !c) return;
      setMine({ rank: c.rank, classSize: c.class_size });
    });
    return () => {
      alive = false;
    };
  }, []);

  const inTopTen = rows?.some((r) => r.id === me) ?? false;

  return (
    <Slate>
      <div className="slate__title">Class Ranking</div>
      <div className="slate__sub">
        {mine?.classSize
          ? `${nf.format(mine.classSize)} kids have played a match`
          : 'top ten, by points'}
      </div>

      <div className="rank-row rank-row--head">
        <div className="rank-row__pos">#</div>
        <div>Name</div>
        <div className="rank-row__num">Won</div>
        <div className="rank-row__num">Pts</div>
      </div>

      {rows === null && <div className="slate__sub waiting-dots" style={{ padding: 20 }}>Reading the board</div>}

      {rows?.length === 0 && (
        <div className="slate__sub" style={{ padding: '24px 8px', lineHeight: 1.7 }}>
          Nobody has won a match yet.
          <br />
          Be the first name on this board.
        </div>
      )}

      {rows?.map((r) => (
        <div key={r.id} className={`rank-row${r.id === me ? ' rank-row--me' : ''}`}>
          <div className={`rank-row__pos rank-row__pos--${r.rank}`}>{r.rank}</div>
          <div className="rank-row__name">
            {r.handle}
            {r.id === me && <span style={{ opacity: 0.55 }}> — you</span>}
            <div className="rank-row__pen">
              {getPen(r.current_pen).name}
              {r.pens_won > 0 && ` · ${r.pens_won} pen${r.pens_won === 1 ? '' : 's'} taken`}
            </div>
          </div>
          <div className="rank-row__num rank-row__num--hide-sm">{r.wins}</div>
          <div className="rank-row__num">{nf.format(r.points)}</div>
        </div>
      ))}

      {rows && rows.length > 0 && !inTopTen && mine?.rank && (
        <>
          <div className="slate__rule" />
          <div className="rank-row rank-row--me">
            <div className="rank-row__pos">{mine.rank}</div>
            <div className="rank-row__name">
              You
              <div className="rank-row__pen">
                {mine.rank - 10} to climb before you are on the board
              </div>
            </div>
            <div className="rank-row__num rank-row__num--hide-sm" />
            <div className="rank-row__num" />
          </div>
        </>
      )}

      {rows && rows.length > 0 && !mine?.rank && (
        <>
          <div className="slate__rule" />
          <div className="slate__sub" style={{ margin: 0 }}>
            You are not on the board yet. Win one two-player match and you are in.
          </div>
        </>
      )}

      {mine?.rank && mine.rank > 1 && (
        <div className="slate__sub" style={{ marginTop: 14, marginBottom: 0 }}>
          You sit {ordinal(mine.rank)}. Only the kid directly above you can be challenged.
        </div>
      )}

      <div className="slate__rule" />
      <button
        className="btn btn--small"
        style={{ borderColor: 'var(--chalk-faint)', color: 'var(--chalk)', boxShadow: 'none' }}
        onClick={onBack}
      >
        Back to the desk
      </button>
    </Slate>
  );
}
