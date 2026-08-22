import { useState } from 'react';
import { Sheet, SheetHeader } from './Sheet';
import { deskLink } from '../game/net';

/**
 * Getting a second player onto the desk.
 *
 * One of you makes a desk and reads the code out (or sends the link); the other
 * types it in. Strictly two players — a pen fight with three people was just an
 * argument.
 */

export function FriendDesk({
  mode,
  code,
  format,
  waiting,
  error,
  challengeName,
  onCreate,
  onJoin,
  onFormat,
  onCancel,
}: {
  mode: 'choose' | 'hosting' | 'joining';
  code: string | null;
  format: number;
  waiting: boolean;
  error: string | null;
  challengeName?: string | null;
  onCreate: () => void;
  onJoin: (code: string) => void;
  onFormat: (n: number) => void;
  onCancel: () => void;
}) {
  const [entered, setEntered] = useState('');
  const [copied, setCopied] = useState(false);

  const share = async () => {
    if (!code) return;
    const link = deskLink(code);
    const text = `Pen fight? Desk ${code}. ${link}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Pen Fight', text: `Pen fight? Desk ${code}.`, url: link });
        return;
      }
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      /* the user closed the share sheet; nothing to do */
    }
  };

  if (mode === 'hosting' && code) {
    return (
      <Sheet seed={17}>
        <SheetHeader title="Pen Fight" subtitle={challengeName ? `Challenge · ${challengeName}` : 'Two players'} />
        <h2 className="title center">
          {challengeName ? `Send this to ${challengeName}` : 'Your desk is ready'}
        </h2>

        <div className="code-plate">
          <div className="code-plate__code">{code}</div>
          <div className="code-plate__hint">read this out, or send the link</div>
        </div>

        <button className="btn btn--primary" onClick={share}>
          {copied ? 'Link copied' : 'Send the link'}
        </button>

        <div className="rule--thin" />

        <p className="lede">
          {waiting ? (
            <>
              Waiting for someone to sit down<span className="waiting-dots" />
              <br />
              <span className="muted">
                Keep this open. The match starts the moment they arrive.
              </span>
            </>
          ) : (
            'They are here. Starting…'
          )}
        </p>

        <div className="rule--thin" />
        <div className="eyebrow">Match length</div>
        <div className="pill-row">
          {[3, 5, 7].map((n) => (
            <button
              key={n}
              className={`pill${format === n ? ' pill--on' : ''}`}
              onClick={() => onFormat(n)}
            >
              Best of {n}
            </button>
          ))}
        </div>

        <button className="btn btn--ghost" onClick={onCancel}>
          Leave the desk
        </button>
      </Sheet>
    );
  }

  return (
    <Sheet seed={17}>
      <SheetHeader title="Pen Fight" subtitle="Two players, one desk" />
      <h2 className="title center">Play with a friend</h2>
      <p className="lede">
        Winner keeps the pen. Make a desk and send the code, or type in theirs.
      </p>

      <div className="rule--thin" />

      <div className="eyebrow">Match length</div>
      <div className="pill-row">
        {[3, 5, 7].map((n) => (
          <button
            key={n}
            className={`pill${format === n ? ' pill--on' : ''}`}
            onClick={() => onFormat(n)}
          >
            Best of {n}
          </button>
        ))}
      </div>

      <button className="btn btn--primary" onClick={onCreate} disabled={waiting}>
        {waiting ? 'Setting up…' : 'Make a desk'}
      </button>

      <div className="rule--thin" />

      <div className="field">
        <label className="field__label" htmlFor="desk-code">
          Or join their desk
        </label>
        <input
          id="desk-code"
          className="field__input field__input--code"
          value={entered}
          onChange={(e) => setEntered(e.target.value.toUpperCase().slice(0, 5))}
          placeholder="ABCDE"
          autoComplete="off"
          spellCheck={false}
          maxLength={5}
          inputMode="text"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && entered.length === 5) onJoin(entered);
          }}
        />
        <div className="field__hint">Five letters, from the desk they made.</div>
      </div>

      <button
        className="btn"
        disabled={entered.length !== 5 || waiting}
        onClick={() => onJoin(entered)}
      >
        Sit down
      </button>

      {error && <div className="field__error center">{error}</div>}

      <button className="btn btn--ghost" onClick={onCancel}>
        Back to the desk
      </button>
    </Sheet>
  );
}
