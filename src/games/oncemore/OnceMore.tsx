import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CARDS, HAND_SIZE, type CardId } from './cards';
import { LIFE, type Choice } from './scenes';
import { audit, census, choose, confess, over, playable, scene, start, weight, type Run } from './engine';
import { read } from './endings';
import { GERMAN, RUSSIAN, drawFace } from './faces';
import type { Person } from '../../effects/book/portrait';
import { sfx } from '../../lib/audio';

/**
 * Once More.
 *
 * A game about morality that refuses to have a morality meter, because the
 * meter is the thing being argued about. What it has instead is a deck.
 *
 * You start with eight cards and no character. Every choice spends one and puts
 * back whatever the doing of it teaches, so after ten scenes the deck is a
 * record of what you repeatedly did — and, because a choice is only offered if
 * its card is in your hand, it is also the list of what you are still able to
 * do. That is the *Genealogy of Morals* as a rule rather than as a summary: a
 * morality is the residue of a history, and it closes doors as it opens them.
 *
 * Guilt is the one card that cannot be played. It occupies a slot in a hand of
 * four and does nothing, so a person carrying it has fewer options — not as an
 * image, as a mechanic. The only thing that removes it is Confession, which
 * costs every bit of standing the guilty acts bought, and a little more, so it
 * is never merely a good trade. That is *Crime and Punishment* compressed into
 * a rule, and it is simultaneously Nietzsche's account of guilt as a debt being
 * paid in the currency of suffering. The two men are describing the same
 * machine and disagreeing about whether to be grateful for it.
 *
 * At the end the game does not score you. It asks the question from *The Gay
 * Science*: this life, in the same order, innumerable times more — do you want
 * it again? Nothing hangs on the answer except the only thing that could.
 */

type Phase = 'intro' | 'scene' | 'after' | 'recur' | 'regret' | 'reading';

function Face({ who, size = 64 }: { who: Person; size?: number }) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const c = document.createElement('canvas');
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = size * dpr;
    c.height = size * dpr;
    c.style.width = `${size}px`;
    c.style.height = `${size}px`;
    const g = c.getContext('2d');
    if (g) {
      g.scale(dpr, dpr);
      drawFace(g, who, size);
    }
    el.replaceChildren(c);
  }, [who, size]);
  // React renders nothing inside; the canvas is put there by hand.
  return <div className="once__face" ref={host} />;
}

function Chip({ id, dim }: { id: CardId; dim?: boolean }) {
  const c = CARDS[id];
  return (
    <span className={`once__chip once__chip--${c.suit}${dim ? ' once__chip--dim' : ''}`} title={c.gloss}>
      {c.name}
    </span>
  );
}

export function OnceMore({ onExit }: { onExit: () => void }) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [run, setRun] = useState<Run>(() => start(Date.now() & 0xffff));
  const [last, setLast] = useState<Choice | null>(null);

  // A scene where every option costs a card you might not hold would present
  // four dead ends to whoever was unlucky. Checked at mount, in the open.
  const broken = useMemo(audit, []);

  const begin = useCallback(() => {
    sfx.paper();
    setRun(start((Date.now() & 0xffff) ^ Math.floor(Math.random() * 65535)));
    setLast(null);
    setPhase('scene');
  }, []);

  const take = (c: Choice) => {
    sfx.tick();
    setLast(c);
    setRun((r) => choose(r, c));
    setPhase('after');
  };

  const onward = () => {
    sfx.tick();
    setPhase(over(run) ? 'recur' : 'scene');
  };

  const sc = scene(run);
  const g = weight(run);
  const deck = census(run);
  const reading = phase === 'reading' ? read(run) : null;

  return (
    <div className="once">
      <div className="once__bar">
        <div>
          <div className="once__eyebrow">
            {phase === 'intro'
              ? 'a game about morality with no morality meter'
              : phase === 'recur' || phase === 'regret'
                ? 'the life is over · nothing below is scored'
                : phase === 'reading'
                  ? 'the deck you finished with'
                  : `scene ${Math.min(run.at + 1, LIFE)} of ${LIFE} · standing ${run.standing >= 0 ? '+' : ''}${run.standing} · weight ${g}`}
          </div>
          <h1 className="once__title">Once More</h1>
        </div>
        <div className="once__actions">
          {phase !== 'intro' && (
            <button className="stage__spec" onClick={begin}>
              New life
            </button>
          )}
          <button className="stage__back" onClick={onExit}>
            ← Shelf
          </button>
        </div>
      </div>

      {broken.length > 0 && (
        <div className="once__alarm">
          Scenes with no free choice, which could dead-end a life: {broken.join(', ')}
        </div>
      )}

      {phase === 'intro' && (
        <div className="once__intro">
          <div className="once__pair">
            {[RUSSIAN, GERMAN].map((p) => (
              <figure key={p.name} className="once__who">
                <Face who={p} size={132} />
                <figcaption>
                  <b>{p.name}</b>
                  <span>{p.note}</span>
                </figcaption>
              </figure>
            ))}
          </div>
          <div className="once__rules">
            <p>
              Ten situations out of their books — not the plots, the positions. You will not be
              scored, and there is no meter. There is a <b>deck</b>.
            </p>
            <ol>
              <li>
                You hold {HAND_SIZE} cards. A choice is offered only if the card it costs is in your
                hand.
              </li>
              <li>
                Making a choice spends its card and puts back what the doing of it teaches. Habits
                deepen. That is the whole progression.
              </li>
              <li>
                <b>Guilt cannot be played.</b> It takes one of the {HAND_SIZE} and does nothing,
                so a guilty person is a person with fewer options.
              </li>
              <li>
                Confession clears it and costs everything those acts bought, plus a little. Never
                merely a good trade.
              </li>
              <li>At the end you are asked whether you would live it again. Nothing hangs on it.</li>
            </ol>
            <p className="once__note">
              Both voices are this game’s own rendering of the argument, written from the passage
              named under each scene — not quotations. The Russian is public domain; his English is
              somebody’s copyrighted work, and so is the good Nietzsche. A paraphrase you can argue
              with beats a quotation you can only admire.
            </p>
            <button className="once__go" onClick={begin}>
              Begin a life
            </button>
          </div>
        </div>
      )}

      {phase === 'scene' && (
        <div className="once__table">
          <div className="once__scene">
            <h2>{sc.title}</h2>
            <p className="once__setting">{sc.setting}</p>
            <p className="once__after">{sc.after}</p>
            <div className="once__choices">
              {sc.choices.map((c) => {
                const can = playable(run, c);
                return (
                  <button
                    key={c.id}
                    className={`once__choice${can ? '' : ' once__choice--out'}`}
                    disabled={!can}
                    onClick={() => take(c)}
                  >
                    <span className="once__label">{c.label}</span>
                    <span className="once__cost">
                      {c.needs ? <Chip id={c.needs} dim={!can} /> : <em>costs nothing</em>}
                      {!can && <span className="once__notin">not in you — not today</span>}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <aside className="once__aside">
            <div className="once__hand">
              <div className="once__handname">your hand</div>
              <div className="once__cards">
                {run.hand.map((c, i) => (
                  <div key={`${c}${i}`} className={`once__card once__card--${CARDS[c].suit}`}>
                    <b>{CARDS[c].name}</b>
                    <span>{CARDS[c].gloss}</span>
                  </div>
                ))}
              </div>
              {g > 0 && (
                <button className="once__confess" onClick={() => { sfx.paper(); setRun(confess(run)); }}>
                  Confess · clears {g} · costs {g + 1} standing
                </button>
              )}
            </div>

            <div className="once__deck">
              <div className="once__handname">what you are made of</div>
              {deck.map(({ id, n }) => (
                <div key={id} className="once__row">
                  <Chip id={id} />
                  <span className="once__bars">
                    {Array.from({ length: n }, (_, i) => (
                      <i key={i} className={`once__pip once__pip--${CARDS[id].suit}`} />
                    ))}
                  </span>
                </div>
              ))}
            </div>
          </aside>
        </div>
      )}

      {phase === 'after' && last && (
        <div className="once__after-panel">
          <p className="once__outcome">{last.outcome}</p>
          <div className="once__voices">
            {[
              { who: RUSSIAN, line: last.d },
              { who: GERMAN, line: last.n },
            ].map(({ who, line }) => (
              <div key={who.name} className="once__voice">
                <Face who={who} size={72} />
                <div>
                  <div className="once__voicename">{who.name.split(' ')[1]}</div>
                  <p>{line}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="once__go" onClick={onward}>
            {over(run) ? 'That was the life' : 'Next'}
          </button>
        </div>
      )}

      {phase === 'recur' && (
        <div className="once__recur">
          <h2>The heaviest weight</h2>
          <p className="once__setting">
            Suppose a demon crept after you one night and said: this life as you have now lived it
            you will have to live once more and innumerable times more, in the same order, with
            nothing new in it — every pain and every joy and everything unspeakably small, all in the
            same succession.
          </p>
          <ol className="once__ledger">
            {run.ledger.map((e, i) => (
              <li key={i}>
                <b>{e.title}.</b> {e.label}
              </li>
            ))}
          </ol>
          <p className="once__setting">
            <b>Do you want it again?</b>
          </p>
          <div className="once__buttons">
            <button
              className="once__go"
              onClick={() => {
                sfx.paper();
                setRun((r) => ({ ...r, again: true }));
                setPhase('reading');
              }}
            >
              Again, and innumerable times more
            </button>
            <button
              className="once__go once__go--quiet"
              onClick={() => {
                sfx.tick();
                setRun((r) => ({ ...r, again: false }));
                setPhase('regret');
              }}
            >
              No — not this one
            </button>
          </div>
        </div>
      )}

      {phase === 'regret' && (
        <div className="once__recur">
          <h2>Then which one?</h2>
          <p className="once__setting">
            Pick the one you would take back. It is the only question in the game that finds out
            what you actually think, because it is the only one with nothing riding on it.
          </p>
          <div className="once__pick">
            {run.ledger.map((e, i) => (
              <button
                key={i}
                className="once__choice"
                onClick={() => {
                  sfx.tick();
                  setRun((r) => ({ ...r, regret: i }));
                  setPhase('reading');
                }}
              >
                <span className="once__label">{e.title}</span>
                <span className="once__cost">{e.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === 'reading' && reading && (
        <div className="once__reading">
          <h2>{reading.name}</h2>
          <p className="once__setting">{reading.verdict}</p>
          {run.again === false && run.regret !== undefined && (
            <p className="once__setting">
              You would take back <b>{run.ledger[run.regret].title}</b>. Everything after it was
              built on it, so you are asking for a different person to have finished the life — which
              is the answer Nietzsche says the question is designed to produce in almost everybody,
              and the one Dostoevsky thinks is the beginning of being able to say anything true.
            </p>
          )}
          <div className="once__voices">
            {[
              { who: RUSSIAN, line: reading.d },
              { who: GERMAN, line: reading.n },
            ].map(({ who, line }) => (
              <div key={who.name} className="once__voice">
                <Face who={who} size={72} />
                <div>
                  <div className="once__voicename">{who.name.split(' ')[1]}</div>
                  <p>{line}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="once__deck once__deck--wide">
            <div className="once__handname">
              standing {run.standing >= 0 ? '+' : ''}{run.standing} · weight {g} ·{' '}
              {run.confessions ? `${run.confessions} confession${run.confessions > 1 ? 's' : ''}` : 'never confessed'}
            </div>
            {deck.map(({ id, n }) => (
              <div key={id} className="once__row">
                <Chip id={id} />
                <span className="once__bars">
                  {Array.from({ length: n }, (_, i) => (
                    <i key={i} className={`once__pip once__pip--${CARDS[id].suit}`} />
                  ))}
                </span>
              </div>
            ))}
          </div>
          <button className="once__go" onClick={begin}>
            Another life
          </button>
        </div>
      )}
    </div>
  );
}
