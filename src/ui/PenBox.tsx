import { PenSvg } from './PenSvg';
import { PENS, TIER_NAMES, getPen } from '../game/pens';
import { sfx } from '../lib/audio';

/**
 * The Camlin box.
 *
 * Every kid had one: a pressed-steel geometry box, navy enamel going chalky at
 * the corners, a lid that never quite shut flat and rattled all the way home.
 * It held the compass and the divider, and — far more importantly — the pens
 * you had won off other people.
 *
 * The good ones do not lie in the tray with the rest. A Trimax or a Hero goes
 * in the lid rack at the top, on display, which is exactly where they went.
 */

const nf = new Intl.NumberFormat('en-IN');

/** Tier 4 and up are trophies, not stock. */
const isFancy = (tier: number) => tier >= 4;

function PenRow({
  penId,
  owned,
  active,
  points,
  onPick,
}: {
  penId: string;
  owned: boolean;
  active: boolean;
  points: number;
  onPick: (id: string) => void;
}) {
  const pen = getPen(penId);
  return (
    <button
      className={`slot${active ? ' slot--active' : ''}${owned ? '' : ' slot--locked'}`}
      onClick={() => {
        if (!owned) return;
        sfx.tick();
        onPick(pen.id);
      }}
      disabled={!owned}
      aria-pressed={active}
    >
      <span className="slot__art">
        <PenSvg pen={pen} />
      </span>
      <span className="slot__body">
        <span className="slot__name">{pen.name}</span>
        <span className="slot__meta">
          {owned
            ? `${pen.weightLabel} · ${pen.woodLabel} on wood · ${pen.habitLabel}`
            : pen.blurb}
        </span>
      </span>
      {active ? (
        <span className="slot__lock">In hand</span>
      ) : owned ? (
        <span className="slot__tier">{TIER_NAMES[pen.tier]}</span>
      ) : (
        <span className="slot__lock">
          {pen.unlockPoints > points ? `${nf.format(pen.unlockPoints)} pts` : 'win it'}
        </span>
      )}
    </button>
  );
}

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
  justWon?: string | null;
  onPick: (penId: string) => void;
  onClose: () => void;
  onShare?: () => void;
  onRanking?: () => void;
}) {
  const has = (id: string) => owned.includes(id);
  const wonPen = justWon ? getPen(justWon) : null;

  const fancy = PENS.filter((p) => isFancy(p.tier));
  const everyday = PENS.filter((p) => !isFancy(p.tier));
  const fancyOwned = fancy.filter((p) => has(p.id)).length;

  return (
    <div className="camlin">
      {/* ------------------------------------------------ the lid ---- */}
      <div className="camlin__lid">
        <div className="camlin__hinge" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>

        <div className="camlin__badge">
          <div className="camlin__brand">Camlin</div>
          <div className="camlin__sub">Geometry Box · No. 3</div>
        </div>

        {/* the display rack: fancy pens only */}
        <div className="camlin__rack">
          <div className="camlin__rack-label">
            The good ones
            <span>
              {fancyOwned} / {fancy.length}
            </span>
          </div>
          <div className="camlin__rack-slots">
            {fancy.map((pen) => {
              const unlocked = has(pen.id);
              const active = pen.id === current;
              return (
                <button
                  key={pen.id}
                  className={`trophy${active ? ' trophy--active' : ''}${
                    unlocked ? '' : ' trophy--empty'
                  }`}
                  onClick={() => {
                    if (!unlocked) return;
                    sfx.tick();
                    onPick(pen.id);
                  }}
                  disabled={!unlocked}
                  title={unlocked ? pen.name : `${pen.name} — not yours yet`}
                  aria-pressed={active}
                >
                  <span className="trophy__clip" aria-hidden="true" />
                  <span className="trophy__art">
                    <PenSvg pen={pen} />
                  </span>
                  <span className="trophy__name">{unlocked ? pen.name : '— empty —'}</span>
                  {active && <span className="trophy__flag">In hand</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------ the tray ---- */}
      <div className="camlin__tray">
        {wonPen && (
          <div className="pen-card" style={{ marginBottom: 12 }}>
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

        <div className="camlin__tray-label">Everything else</div>
        <div className="camlin__wells">
          {everyday.map((pen) => (
            <PenRow
              key={pen.id}
              penId={pen.id}
              owned={has(pen.id)}
              active={pen.id === current}
              points={points}
              onPick={onPick}
            />
          ))}
        </div>

        <div className="camlin__note">
          {owned.length} of {PENS.length} in the box. Beat someone holding a pen and
          it is yours — or earn the points and buy one from the shop outside the gate.
        </div>
      </div>

      {/* ------------------------------------------------ actions ---- */}
      <div className="camlin__actions">
        <button
          className="camlin__btn"
          onClick={() => {
            sfx.tick();
            onClose();
          }}
        >
          Shut the box
        </button>
        <div className="btn-row">
          {onShare && (
            <button className="camlin__btn camlin__btn--dark" style={{ flex: 1 }} onClick={onShare}>
              Share
            </button>
          )}
          {onRanking && (
            <button
              className="camlin__btn camlin__btn--dark"
              style={{ flex: 1 }}
              onClick={onRanking}
            >
              Ranking
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
