import { PenSvg, BrandMark } from './PenSvg';
import { PENS, TIER_NAMES, getPen } from '../game/pens';

/**
 * The tin.
 *
 * Everybody had one — a geometry box or a sweet tin with foam cut into slots,
 * and you kept your good pens in it so they did not rattle. Pens you have not
 * won yet sit dark in their slot, which is the whole incentive.
 */

const nf = new Intl.NumberFormat('en-IN');

export function PenBox({
  owned,
  current,
  points,
  justWon,
  onPick,
  onClose,
  onShare,
  onRanking,
}: {
  owned: string[];
  current: string;
  points: number;
  /** Pen id that was captured a moment ago, flagged in the box. */
  justWon?: string | null;
  onPick: (penId: string) => void;
  onClose: () => void;
  onShare?: () => void;
  onRanking?: () => void;
}) {
  const has = (id: string) => owned.includes(id);
  const wonPen = justWon ? getPen(justWon) : null;

  return (
    <div className="tin">
      <div className="tin__lid">
        <div className="tin__logo">Pen Fight</div>
        <BrandMark className="tin__logo-mark" />
      </div>

      {wonPen && (
        <div className="pen-card" style={{ marginBottom: 14 }}>
          <div className="pen-card__flag">Just won</div>
          <div style={{ height: 30, marginBottom: 6 }}>
            <PenSvg pen={wonPen} />
          </div>
          <div className="versus__name">{wonPen.name}</div>
          <div className="muted center" style={{ marginTop: 4 }}>
            {wonPen.blurb}
          </div>
        </div>
      )}

      <div className="tin__foam">
        {PENS.map((pen) => {
          const unlocked = has(pen.id);
          const active = pen.id === current;
          return (
            <button
              key={pen.id}
              className={`slot${active ? ' slot--active' : ''}${unlocked ? '' : ' slot--locked'}`}
              onClick={() => unlocked && onPick(pen.id)}
              disabled={!unlocked}
              aria-pressed={active}
            >
              <span className="slot__art">
                <PenSvg pen={pen} />
              </span>
              <span className="slot__body">
                <span className="slot__name">{pen.name}</span>
                <span className="slot__meta">
                  {unlocked
                    ? `${pen.weightLabel} · ${pen.woodLabel} on wood · ${pen.habitLabel}`
                    : pen.blurb}
                </span>
              </span>
              {active ? (
                <span className="slot__lock">In hand</span>
              ) : unlocked ? (
                <span className="slot__tier">{TIER_NAMES[pen.tier]}</span>
              ) : (
                <span className="slot__lock">
                  {pen.unlockPoints > points
                    ? `${nf.format(pen.unlockPoints)} pts`
                    : 'win it'}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="muted center" style={{ color: 'rgba(255,255,255,0.6)', marginTop: 12 }}>
        You have {owned.length} of {PENS.length}. Beat someone holding a pen and it
        is yours — or reach the points to buy one from the shop outside the gate.
      </div>

      <div className="tin__actions">
        <button className="tin__btn" onClick={onClose}>
          Shut the box
        </button>
        <div className="btn-row">
          {onShare && (
            <button className="tin__btn tin__btn--dark" style={{ flex: 1 }} onClick={onShare}>
              Share
            </button>
          )}
          {onRanking && (
            <button className="tin__btn tin__btn--dark" style={{ flex: 1 }} onClick={onRanking}>
              Ranking
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
