import { useEffect, useState } from 'react';
import { useMatch, other } from '../game/store';
import { getPen } from '../game/pens';

/**
 * What you can see while the pens are on the desk.
 *
 * Score at the top, whose turn it is by which half is inked in, and a power
 * meter that only exists while you are actually drawing back. Everything else
 * stays out of the way — the desk is the interface.
 */

const REASON_TEXT: Record<string, string> = {
  knockout: 'Off the desk',
  self_out: 'Your own pen. Off the desk.',
  double_out: 'Both of them. Off the desk.',
};

export function HUD({
  onQuit,
  onPenBox,
  muted,
  onToggleMute,
  connection,
}: {
  onQuit: () => void;
  onPenBox: () => void;
  muted: boolean;
  onToggleMute: () => void;
  connection?: 'solo' | 'linked' | 'waiting';
}) {
  const phase = useMatch((s) => s.phase);
  const turn = useMatch((s) => s.turn);
  const mySide = useMatch((s) => s.mySide);
  const score = useMatch((s) => s.score);
  const names = useMatch((s) => s.names);
  const pens = useMatch((s) => s.pens);
  const format = useMatch((s) => s.format);
  const aim = useMatch((s) => s.aim);
  const lastResult = useMatch((s) => s.lastResult);
  const mode = useMatch((s) => s.mode);

  const theirSide = other(mySide);
  const myTurn = turn === mySide;
  const target = Math.floor(format / 2) + 1;

  // The big stamped word that flashes after a rally.
  const [flash, setFlash] = useState<string | null>(null);
  useEffect(() => {
    if (phase !== 'point' || !lastResult) return;
    const mine = lastResult.scoringSide === mySide;
    setFlash(mine ? 'Off the desk!' : lastResult.reason === 'self_out' ? 'Your own pen!' : 'They got you');
    const t = setTimeout(() => setFlash(null), 1300);
    return () => clearTimeout(t);
  }, [phase, lastResult, mySide]);

  const powerPct = Math.round((aim?.power ?? 0) * 100);
  const powerColor = `hsl(${Math.round(120 - (aim?.power ?? 0) * 120)} 78% 54%)`;

  let prompt: string | null = null;
  let promptWait = false;
  if (phase === 'ready') {
    if (myTurn) prompt = 'Press your pen and pull back';
    else {
      promptWait = true;
      prompt = mode === 'practice' ? `${names[theirSide]} is thinking…` : `${names[theirSide]}'s turn`;
    }
  } else if (phase === 'live') {
    promptWait = true;
    prompt = null;
  }

  return (
    <div className="hud">
      <div className="hud__top">
        <div className={`hud__side${turn === mySide ? ' hud__side--active' : ''}`}>
          <span className="hud__score">{score[mySide]}</span>
          <span className="hud__name">{names[mySide]}</span>
        </div>
        <div className="hud__mid">
          Best of {format}
          <br />
          first to {target}
        </div>
        <div className={`hud__side${turn === theirSide ? ' hud__side--active' : ''}`}>
          <span className="hud__name">{names[theirSide]}</span>
          <span className="hud__score">{score[theirSide]}</span>
        </div>
      </div>

      <div className="hud__corner-tl">
        <button className="chip" onClick={onQuit}>
          Leave
        </button>
      </div>

      <div className="hud__corner-tr">
        {connection === 'waiting' && <span className="chip">Reconnecting…</span>}
        {connection === 'linked' && <span className="chip chip--on">Linked</span>}
        <button className="chip" onClick={onPenBox} title="Pen box">
          Pens
        </button>
        <button
          className="chip"
          onClick={onToggleMute}
          aria-label={muted ? 'Unmute' : 'Mute'}
          title={muted ? 'Unmute' : 'Mute'}
        >
          {muted ? '♪̸' : '♪'}
        </button>
      </div>

      {prompt && (
        <div className={`hud__prompt${promptWait ? ' hud__prompt--wait' : ''}`}>{prompt}</div>
      )}

      {phase === 'aiming' && aim && (
        <div className="hud__meter">
          <div className="hud__meter-track">
            <div
              className="hud__meter-fill"
              style={{ width: `${powerPct}%`, background: powerColor }}
            />
          </div>
          <div className="hud__meter-read">
            <span>power {powerPct}%</span>
            <span>
              {Math.abs(aim.strike) < 0.2
                ? 'clean push'
                : aim.strike > 0
                  ? 'cap end · spin'
                  : 'nib end · spin'}
            </span>
          </div>
        </div>
      )}

      <div className="hud__pen-tag">
        <span style={{ fontWeight: 800 }}>{getPen(pens[mySide]).name}</span>
        <span style={{ opacity: 0.6 }}>· best of {format}</span>
        {lastResult && phase === 'point' && (
          <span style={{ opacity: 0.75 }}>· {REASON_TEXT[lastResult.reason]}</span>
        )}
      </div>

      {flash && <div className="hud__toast">{flash}</div>}
    </div>
  );
}
