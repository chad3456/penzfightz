import { Sheet, SheetHeader } from './Sheet';
import { PenSvg } from './PenSvg';
import { getPen } from '../game/pens';
import type { Opponent } from '../game/ai';

/**
 * The team sheet, filled in before the first flick.
 *
 * Both pens, their habits side by side, and what is actually at stake. Reading
 * this is how you decide whether to swap pens before you start.
 */

export function MatchSheet({
  mode,
  format,
  myName,
  myPen,
  theirName,
  theirPen,
  opponent,
  seriesNote,
  onStart,
  onHowTo,
  onSwapPen,
  onCancel,
}: {
  mode: 'practice' | 'friend' | 'ranked';
  format: number;
  myName: string;
  myPen: string;
  theirName: string;
  theirPen: string;
  opponent?: Opponent | null;
  seriesNote?: string;
  onStart: () => void;
  onHowTo: () => void;
  onSwapPen: () => void;
  onCancel: () => void;
}) {
  const mine = getPen(myPen);
  const theirs = getPen(theirPen);
  const stakes = mode !== 'practice';

  return (
    <Sheet seed={11}>
      <SheetHeader title="Pen Fight" subtitle={seriesNote ?? `Best of ${format}`} />

      <div className="versus">
        <div>
          <div className="versus__name">{myName}</div>
        </div>
        <div className="versus__vs">vs</div>
        <div>
          <div className="versus__name">{theirName}</div>
        </div>
      </div>

      <div className="versus" style={{ marginTop: 4 }}>
        <div className="versus__pen">
          <PenSvg pen={mine} />
        </div>
        <div />
        <div className="versus__pen">
          <PenSvg pen={theirs} flip />
        </div>
      </div>

      <div className="versus" style={{ marginTop: 0 }}>
        <div className="versus__meta">{mine.name}</div>
        <div />
        <div className="versus__meta">{theirs.name}</div>
      </div>

      <div className="rule--thin" />

      <div className="sheet-row">
        <div className="sheet-row__left">{mine.weightLabel}</div>
        <div className="sheet-row__label">weight</div>
        <div className="sheet-row__right">{theirs.weightLabel}</div>
      </div>
      <div className="sheet-row">
        <div className="sheet-row__left">{mine.woodLabel}</div>
        <div className="sheet-row__label">on wood</div>
        <div className="sheet-row__right">{theirs.woodLabel}</div>
      </div>
      <div className="sheet-row">
        <div className="sheet-row__left">{mine.habitLabel}</div>
        <div className="sheet-row__label">habit</div>
        <div className="sheet-row__right">{theirs.habitLabel}</div>
      </div>

      {opponent && (
        <>
          <div className="rule--thin" />
          <p className="lede handwritten" style={{ fontSize: 16 }}>
            {opponent.blurb}
          </p>
        </>
      )}

      <div className="rule--thin" />

      <div className="stat-line">
        <span>{stakes ? 'Take their pen' : 'Practice win'}</span>
        <span className="stat-line__value stat-line__value--plus">
          +{stakes ? 20 : 4}
        </span>
      </div>
      <div className="stat-line">
        <span>{stakes ? 'Lose, and the pen goes with them' : 'Nothing at stake here'}</span>
        <span className="stat-line__value stat-line__value--minus">
          {stakes ? '−10' : '0'}
        </span>
      </div>
      {stakes && (
        <div className="muted">
          Your reserve pens stay in the tin. Only the one in your hand is on the desk.
        </div>
      )}

      <div className="mt-lg">
        <button className="btn btn--primary" onClick={onStart}>
          Start
        </button>
        <button className="btn btn--ghost" onClick={onHowTo}>
          How to play
        </button>
        <div className="btn-row" style={{ marginTop: 4 }}>
          <button className="btn btn--small" style={{ flex: 1 }} onClick={onSwapPen}>
            Swap pen
          </button>
          <button className="btn btn--small" style={{ flex: 1 }} onClick={onCancel}>
            Back
          </button>
        </div>
      </div>
    </Sheet>
  );
}
