import { Sheet, SheetHeader } from './Sheet';
import { PenSvg } from './PenSvg';
import { getPen } from '../game/pens';
import { ordinal } from './Home';

/**
 * The moment the pen changes hands.
 *
 * A pen fight had no scoreboard, but it did have this: somebody's name crossed
 * out on the barrel and yours written in. That is what this card is.
 */

export function ResultSheet({
  won,
  myName,
  theirName,
  myScore,
  theirScore,
  format,
  rallies,
  capturedPen,
  lostPen,
  pointsDelta,
  rank,
  classSize,
  gapToRival,
  rivalName,
  onRematch,
  onPenBox,
  onShare,
  onHome,
}: {
  won: boolean;
  myName: string;
  theirName: string;
  myScore: number;
  theirScore: number;
  format: number;
  /** true = I took that rally. */
  rallies: boolean[];
  capturedPen?: string | null;
  lostPen?: string | null;
  pointsDelta: number;
  rank: number | null;
  classSize: number;
  gapToRival?: number | null;
  rivalName?: string | null;
  onRematch: () => void;
  onPenBox: () => void;
  onShare: () => void;
  onHome: () => void;
}) {
  const pen = capturedPen ? getPen(capturedPen) : lostPen ? getPen(lostPen) : null;

  return (
    <Sheet seed={23}>
      <SheetHeader />

      {pen && (
        <div style={{ height: 34, margin: '4px 0 14px' }}>
          <PenSvg pen={pen} />
        </div>
      )}

      <h1 className="title center">
        {capturedPen ? (
          <>
            {theirName}&rsquo;s {pen?.name.split(' ').slice(-1)[0]}
            <br />
            is yours.
          </>
        ) : lostPen ? (
          <>
            You lost the
            <br />
            {pen?.name}.
          </>
        ) : won ? (
          <>You took it.</>
        ) : (
          <>They took it.</>
        )}
      </h1>

      <div className="rule--thin" />

      <div className="stat-line">
        <span>{won ? 'Previous owner' : 'Now held by'}</span>
        <span className="stat-line__value">{theirName}</span>
      </div>
      <div className="stat-line">
        <span>Won</span>
        <span className="stat-line__value">
          {myScore} · {theirScore}
        </span>
      </div>
      <div className="stat-line">
        <span>Format</span>
        <span className="stat-line__value">Best of {format}</span>
      </div>

      {pen && (
        <div className="center mt">
          <span className="strike">{won ? theirName : myName}</span>
          <span style={{ margin: '0 12px', color: 'var(--ink-faint)' }}>→</span>
          <span className="circled versus__name" style={{ display: 'inline-block' }}>
            {won ? myName : theirName}
          </span>
        </div>
      )}

      <div className="tally">
        {rallies.map((mine, i) => (
          <div
            key={i}
            className={`tally__box tally__box--${mine ? 'win' : 'loss'}`}
            title={mine ? 'you took this one' : 'they took this one'}
          >
            {mine ? '✓' : '✗'}
          </div>
        ))}
      </div>

      <div className="center versus__name" style={{ fontSize: 15 }}>
        {pointsDelta >= 0 ? '+' : '−'}
        {Math.abs(pointsDelta)} points
      </div>

      {rank !== null && (
        <>
          <div className="rule--thin" />
          {gapToRival != null && gapToRival > 0 && rivalName ? (
            <p className="lede">
              {gapToRival} {gapToRival === 1 ? 'kid' : 'kids'} between you and{' '}
              <span style={{ color: 'var(--red)' }}>{rivalName}</span>
            </p>
          ) : null}
          <p className="lede" style={{ marginTop: 6 }}>
            <b style={{ color: 'var(--ink)' }}>{ordinal(rank)}</b> in the class of{' '}
            {classSize}
          </p>
        </>
      )}

      <div className="mt-lg">
        <button className="btn btn--primary" onClick={onRematch}>
          Play the next match
        </button>
        <div className="btn-row" style={{ marginTop: 12 }}>
          <button className="btn btn--small" style={{ flex: 1 }} onClick={onPenBox}>
            Pen box
          </button>
          <button className="btn btn--small" style={{ flex: 1 }} onClick={onShare}>
            Share
          </button>
        </div>
        <button className="btn btn--ghost" onClick={onHome}>
          Back to the desk
        </button>
      </div>
    </Sheet>
  );
}
