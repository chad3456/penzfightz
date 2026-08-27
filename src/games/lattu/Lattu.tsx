import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BEASTS, BEAST_BY_ID, BLADERS, BLADER_BY_ID, LADDER, QUIRK_TEXT, WILD,
  type Beast, type Blader,
} from './beasts';
import { planLaunch, shouldCall, type Plan } from './ai';
import {
  ROUND_SECONDS, callBeast, callReady, spinLeft, startBout,
  type Bout, type Fighter, type Launch,
} from './physics';
import { Arena } from './Arena';
import { sigilCanvas } from './sigil';
import {
  beatenBladers, chosenBeast, chosenBlader, markBeaten, ownedBeasts,
  setChosenBeast, setChosenBlader, takeBeast,
} from '../../lib/identity';
import { sfx } from '../../lib/audio';

/**
 * Lattu.
 *
 * Two tops in a dish. Throw the other one out and you take two points; outlast
 * it and you take one; first to four takes the match, and the beast off the
 * back of whoever you beat.
 *
 * The round has exactly two decisions in it and they are both made *before*
 * anything moves — which track to launch onto, and how hard to rip — plus one
 * during, which is when to call the beast. That is not a simplification; it is
 * what the game is. Once the string is out of your hand you are a spectator,
 * and the whole tension of a real match is watching a decision you already made
 * turn out to have been right or wrong.
 *
 * It also happens to make a friend match trivial to keep in sync: a round is
 * two launches and a seed.
 */

type Screen = 'home' | 'roster' | 'case' | 'opponent' | 'p2pick' | 'launch' | 'battle' | 'over';
type Mode = 'ladder' | 'hotseat';

/**
 * Points needed to take the match.
 *
 * Five rather than four, because a ring-out is worth two and at four a match
 * could be over in two rounds — which measured out at exactly that, twice in a
 * row. Five forces a third round into any match that is not a total mismatch.
 */
const TARGET = 5;

// ------------------------------------------------------------------ the mark

function Sigil({ beast, size = 64 }: { beast: Beast; size?: number }) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = host.current;
    if (!h) return;
    const c = sigilCanvas(beast, size * 2);
    c.style.width = `${size}px`;
    c.style.height = `${size}px`;
    c.style.display = 'block';
    h.appendChild(c);
    return () => c.remove();
  }, [beast, size]);
  return <div ref={host} className="lattu__sigil" />;
}

function Bars({ beast }: { beast: Beast }) {
  const rows: [string, number][] = [
    ['attack', beast.attack],
    ['defence', beast.defence],
    ['stamina', beast.stamina],
    ['weight', beast.weight],
  ];
  return (
    <ul className="lattu__bars">
      {rows.map(([k, v]) => (
        <li key={k}>
          <span>{k}</span>
          <i>
            <b style={{ width: `${Math.round(v * 100)}%`, background: beast.ink }} />
          </i>
        </li>
      ))}
    </ul>
  );
}

// --------------------------------------------------------------- the launcher

/**
 * The rip.
 *
 * One sweeping marker, stopped twice. First sweep picks the track — inside for
 * a fight, outside to wait — and the second is the meter you rip against, which
 * is the same power bar every arcade game has had since the eighties because it
 * is the only control that is genuinely tense with one button.
 */
function Ripper({
  label,
  ink,
  onDone,
  keyName,
}: {
  label: string;
  ink: string;
  onDone: (l: Launch) => void;
  /** Which key rips, for the two-player case. */
  keyName: 'Space' | 'Enter';
}) {
  const [stage, setStage] = useState<0 | 1>(0);
  const [value, setValue] = useState(0);
  const track = useRef(0.5);
  const raw = useRef(0);
  const stageRef = useRef<0 | 1>(0);

  useEffect(() => {
    let alive = true;
    let last = performance.now();
    const tick = (now: number) => {
      if (!alive) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      // The two sweeps run at different speeds on purpose: the track is a
      // considered choice and the rip is a reflex.
      raw.current += dt * (stageRef.current === 0 ? 0.85 : 1.75);
      const t = raw.current % 2;
      setValue(t > 1 ? 2 - t : t);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    return () => {
      alive = false;
    };
  }, []);

  const lock = useCallback(() => {
    sfx.tick();
    if (stageRef.current === 0) {
      track.current = value;
      stageRef.current = 1;
      raw.current = 0;
      setStage(1);
    } else {
      sfx.flick(value);
      onDone({ track: track.current, power: Math.max(0.12, value) });
    }
  }, [onDone, value]);

  useEffect(() => {
    const want = keyName === 'Space' ? 'Space' : 'Enter';
    const on = (e: KeyboardEvent) => {
      if (e.code !== want) return;
      e.preventDefault();
      lock();
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, [lock, keyName]);

  const pct = Math.round(value * 100);
  return (
    <div className="lattu__rip">
      <div className="lattu__ripwho" style={{ color: ink }}>{label}</div>
      <div className="lattu__ripstage">
        {stage === 0 ? 'pick your track' : 'rip it'}
      </div>
      <div className={`lattu__meter lattu__meter--${stage === 0 ? 'track' : 'power'}`}>
        <span style={{ left: `${pct}%`, background: ink }} />
        {stage === 0 && (
          <>
            <em className="lattu__meterend lattu__meterend--l">inside</em>
            <em className="lattu__meterend lattu__meterend--r">outside</em>
          </>
        )}
      </div>
      <div className="lattu__ripnote">
        {stage === 0
          ? 'Inside is the middle of the dish, where the hitting happens. Outside is the wall, out of reach.'
          : 'More spin lasts longer and hits harder. Nobody stops it at the top every time.'}
      </div>
      <button className="btn btn--big" onClick={lock} style={{ background: ink }}>
        {stage === 0 ? 'Set the track' : 'LET IT RIP'} <small>({keyName === 'Space' ? 'space' : 'enter'})</small>
      </button>
    </div>
  );
}

// ------------------------------------------------------------------- the game

interface Corner {
  blader: Blader;
  beast: Beast;
  human: boolean;
}

interface Score {
  a: number;
  b: number;
  round: number;
  /** What happened last round, for the strip under the dish. */
  last: string | null;
}

export function Lattu({ onExit }: { onExit: () => void }) {
  const [screen, setScreen] = useState<Screen>('home');
  const [mode, setMode] = useState<Mode>('ladder');
  const [owned, setOwned] = useState<string[]>(() => ownedBeasts());
  const [beaten, setBeaten] = useState<string[]>(() => beatenBladers());
  const [myBlader, setMyBlader] = useState<string>(() => chosenBlader() ?? 'tejas');
  const [myBeast, setMyBeast] = useState<string>(() => chosenBeast() ?? 'vaayu');

  // First time through, the blader you pick hands you the beast they carry.
  useEffect(() => {
    if (owned.length) return;
    const b = BLADER_BY_ID[myBlader]?.beast ?? 'vaayu';
    takeBeast(b);
    setChosenBlader(myBlader);
    setChosenBeast(b);
    setOwned([b]);
    setMyBeast(b);
  }, [owned.length, myBlader]);

  const [corners, setCorners] = useState<[Corner, Corner] | null>(null);
  const [score, setScore] = useState<Score>({ a: 0, b: 0, round: 1, last: null });
  const [locked, setLocked] = useState<(Launch | null)[]>([null, null]);
  const [running, setRunning] = useState(false);
  const [hud, setHud] = useState({ a: 1, b: 1, t: 0, callA: false, callB: false });
  const [won, setWon] = useState<{ mine: boolean; prize: Beast | null } | null>(null);

  const bout = useRef<Bout | null>(null);
  const plan = useRef<Plan | null>(null);
  const seed = useRef(1);

  // ------------------------------------------------------------- starting up
  const begin = useCallback(
    (them: Blader, theirBeast: Beast, human: boolean) => {
      const mine = BLADER_BY_ID[myBlader];
      setCorners([
        { blader: mine, beast: BEAST_BY_ID[myBeast], human: true },
        { blader: them, beast: theirBeast, human },
      ]);
      setScore({ a: 0, b: 0, round: 1, last: null });
      setLocked([null, null]);
      setWon(null);
      bout.current = null;
      seed.current = (Math.random() * 1e9) | 0;
      setScreen('launch');
    },
    [myBlader, myBeast],
  );

  // ------------------------------------------------------------ the launches
  const onLock = useCallback(
    (which: 0 | 1, l: Launch) => {
      setLocked((prev) => {
        const next = [...prev];
        next[which] = l;
        return next;
      });
    },
    [],
  );

  // Once both are in, build the bout and start it.
  useEffect(() => {
    if (screen !== 'launch' || !corners) return;
    const [me, them] = corners;
    let mine = locked[0];
    let theirs = locked[1];
    if (!mine) return;
    if (!them.human && !theirs) {
      const p = planLaunch(them.beast, me.beast, them.blader, Math.random);
      plan.current = p;
      theirs = p.launch;
    } else if (them.human) {
      plan.current = null;
    }
    if (!theirs) return;

    const fighters: [Fighter, Fighter] = [
      { beast: me.beast, quirk: me.blader.quirk, side: 0 },
      { beast: them.beast, quirk: them.blader.quirk, side: 1 },
    ];
    bout.current = startBout(fighters, [mine, theirs], seed.current + score.round);
    sfx.clack(0.8);
    setRunning(true);
    setScreen('battle');
  }, [screen, locked, corners, score.round]);

  // -------------------------------------------------------------- the round
  const onTick = useCallback((b: Bout) => {
    // Throttled by the fact that these are four numbers; React can afford it,
    // and the alternative is a HUD that lags the dish it is describing.
    const a = spinLeft(b.tops[0]);
    const bb = spinLeft(b.tops[1]);
    setHud((h) => {
      const callA = callReady(b, 0);
      const callB = callReady(b, 1);
      if (
        Math.abs(h.a - a) < 0.004 && Math.abs(h.b - bb) < 0.004 &&
        Math.abs(h.t - b.t) < 0.1 && h.callA === callA && h.callB === callB
      ) return h;
      return { a, b: bb, t: b.t, callA, callB };
    });
    // The computer decides whether to call, every frame, on the same terms a
    // person does: is the other top close enough to be worth crossing to.
    if (plan.current && shouldCall(b, 1, plan.current)) {
      if (callBeast(b, 1)) sfx.bell();
    }
  }, []);

  const onFinish = useCallback(
    (b: Bout) => {
      setRunning(false);
      const o = b.outcome!;
      sfx.clatter();
      setScore((s) => {
        const a = s.a + (o.winner === 0 ? o.points : 0);
        const bb = s.b + (o.winner === 1 ? o.points : 0);
        const who = o.winner === null ? 'Nobody' : o.winner === 0 ? 'You' : 'They';
        const how =
          o.finish === 'ring-out' ? 'out of the dish' :
          o.finish === 'spin-out' ? 'still turning' :
          o.finish === 'timeout' ? 'ahead on spin at the bell' : 'a dead heat';
        return { a, b: bb, round: s.round + 1, last: `${who} — ${how} · ${o.points || 0}` };
      });
    },
    [],
  );

  // Match over?
  useEffect(() => {
    if (screen !== 'battle' || running || !corners) return;
    if (!bout.current?.outcome) return;
    if (score.a < TARGET && score.b < TARGET) return;
    const mine = score.a >= TARGET;
    let prize: Beast | null = null;
    if (mine && !corners[1].human) {
      const b = corners[1].beast;
      if (!owned.includes(b.id)) {
        takeBeast(b.id);
        setOwned(ownedBeasts());
        prize = b;
      }
      markBeaten(corners[1].blader.id);
      setBeaten(beatenBladers());
    }
    setWon({ mine, prize });
    sfx[mine ? 'good' : 'bad']();
    setScreen('over');
  }, [screen, running, score, corners, owned]);

  const nextRound = useCallback(() => {
    setLocked([null, null]);
    bout.current = null;
    plan.current = null;
    setScreen('launch');
  }, []);

  // ------------------------------------------------------------ calling keys
  useEffect(() => {
    if (screen !== 'battle') return;
    const on = (e: KeyboardEvent) => {
      const b = bout.current;
      if (!b || !corners) return;
      if (e.code === 'Space') {
        e.preventDefault();
        if (callBeast(b, 0)) sfx.bell();
      }
      if (e.code === 'Enter' && corners[1].human) {
        e.preventDefault();
        if (callBeast(b, 1)) sfx.bell();
      }
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, [screen, corners]);

  const myBeastObj = BEAST_BY_ID[myBeast] ?? BEASTS[0];
  const myBladerObj = BLADER_BY_ID[myBlader] ?? BLADERS[0];
  const wildOpen = beaten.length >= BLADERS.length;
  const ladder = useMemo(
    () => [...LADDER, ...(wildOpen ? WILD.filter((w) => !beaten.includes(w.id)).slice(0, 1) : [])],
    [wildOpen, beaten],
  );

  // ------------------------------------------------------------------ render
  const arena =
    corners && (screen === 'battle' || screen === 'launch' || screen === 'over') ? (
      <Arena
        bout={bout}
        beasts={[corners[0].beast, corners[1].beast]}
        running={running}
        onTick={onTick}
        onFinish={onFinish}
      />
    ) : null;

  return (
    <div className="lattu">
      <div className="lattu__bar">
        <div>
          <div className="lattu__eyebrow">two tops, one dish</div>
          <h1 className="lattu__title">Lattu</h1>
        </div>
        <div className="lattu__actions">
          {screen !== 'home' && screen !== 'battle' && (
            <button className="stage__spec" onClick={() => setScreen('home')}>← Back</button>
          )}
          <button className="stage__back" onClick={onExit}>← Shelf</button>
        </div>
      </div>

      <div className="lattu__stage">
        {arena}

        {screen === 'home' && (
          <div className="lattu__sheet">
            <p className="lattu__lede">
              Two tops go into the dish and one comes out. Throw theirs over the rim and
              that is two points; simply outlast it and that is one. First to {TARGET} takes
              the match — and the beast off the back of whoever you beat.
            </p>
            <div className="lattu__me">
              <Sigil beast={myBeastObj} size={92} />
              <div>
                <div className="lattu__meline" style={{ color: myBladerObj.ink }}>
                  {myBladerObj.name} · “{myBladerObj.handle}”
                </div>
                <div className="lattu__mebeast">{myBeastObj.name}, {myBeastObj.form}</div>
                <div className="lattu__quirk">{QUIRK_TEXT[myBladerObj.quirk]}</div>
              </div>
              <Bars beast={myBeastObj} />
            </div>
            <div className="lattu__choices">
              <button className="btn btn--big" onClick={() => { setMode('ladder'); setScreen('opponent'); }}>
                Play the ladder
              </button>
              <button className="btn btn--big" onClick={() => { setMode('hotseat'); setScreen('p2pick'); }}>
                Two players, one keyboard
              </button>
              <button className="btn" onClick={() => setScreen('roster')}>Change blader &amp; beast</button>
              <button className="btn" onClick={() => setScreen('case')}>
                The case ({owned.length}/{BEASTS.length})
              </button>
            </div>
          </div>
        )}

        {screen === 'roster' && (
          <div className="lattu__sheet lattu__sheet--wide">
            <h2 className="lattu__h2">Who are you?</h2>
            <div className="lattu__grid">
              {BLADERS.map((b) => (
                <button
                  key={b.id}
                  className={`lattu__card${b.id === myBlader ? ' lattu__card--on' : ''}`}
                  style={{ ['--ink' as string]: b.ink }}
                  onClick={() => { sfx.tick(); setMyBlader(b.id); setChosenBlader(b.id); }}
                >
                  <div className="lattu__cardname">{b.name}</div>
                  <div className="lattu__cardhandle">“{b.handle}” · {b.home}</div>
                  <div className="lattu__cardline">{b.line}</div>
                  <div className="lattu__cardquirk">{QUIRK_TEXT[b.quirk]}</div>
                </button>
              ))}
            </div>
            <h2 className="lattu__h2">What are you spinning?</h2>
            <div className="lattu__grid">
              {BEASTS.filter((b) => owned.includes(b.id)).map((b) => (
                <button
                  key={b.id}
                  className={`lattu__card lattu__card--beast${b.id === myBeast ? ' lattu__card--on' : ''}`}
                  style={{ ['--ink' as string]: b.ink }}
                  onClick={() => { sfx.tick(); setMyBeast(b.id); setChosenBeast(b.id); }}
                >
                  <Sigil beast={b} size={68} />
                  <div className="lattu__cardname">{b.name}</div>
                  <div className="lattu__cardhandle">{b.form} · {b.spin === 1 ? 'right-spin' : 'left-spin'}</div>
                  <Bars beast={b} />
                </button>
              ))}
            </div>
          </div>
        )}

        {screen === 'case' && (
          <div className="lattu__sheet lattu__sheet--wide">
            <h2 className="lattu__h2">The case · {owned.length} of {BEASTS.length}</h2>
            <div className="lattu__grid">
              {BEASTS.map((b) => {
                const have = owned.includes(b.id);
                return (
                  <div
                    key={b.id}
                    className={`lattu__card lattu__card--beast${have ? '' : ' lattu__card--empty'}`}
                    style={{ ['--ink' as string]: b.ink }}
                  >
                    {have ? <Sigil beast={b} size={68} /> : <div className="lattu__slot">?</div>}
                    <div className="lattu__cardname">{have ? b.name : 'not yet'}</div>
                    {have && (
                      <>
                        <div className="lattu__cardhandle">
                          {b.form} · {b.spin === 1 ? 'right-spin' : 'left-spin'}{b.rare ? ' · rare' : ''}
                        </div>
                        <div className="lattu__cardline">{b.note}</div>
                        <Bars beast={b} />
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {screen === 'opponent' && (
          <div className="lattu__sheet lattu__sheet--wide">
            <h2 className="lattu__h2">Who is in the dish?</h2>
            <div className="lattu__grid">
              {ladder.map((b) => {
                const done = beaten.includes(b.id);
                const beast = BEAST_BY_ID[b.beast];
                return (
                  <button
                    key={b.id}
                    className={`lattu__card${done ? ' lattu__card--done' : ''}`}
                    style={{ ['--ink' as string]: b.ink }}
                    onClick={() => { sfx.tick(); begin(b, beast, false); }}
                  >
                    <div className="lattu__cardname">
                      {b.name}{done ? ' ✓' : ''}
                    </div>
                    <div className="lattu__cardhandle">“{b.handle}” · carries {beast.name}</div>
                    <div className="lattu__cardline">{b.line}</div>
                    <Bars beast={beast} />
                  </button>
                );
              })}
            </div>
            {!wildOpen && (
              <p className="lattu__foot">
                Beat all eight and somebody else turns up.
              </p>
            )}
          </div>
        )}

        {screen === 'p2pick' && (
          <div className="lattu__sheet lattu__sheet--wide">
            <h2 className="lattu__h2">Second player — pick yours</h2>
            <p className="lattu__lede">
              You rip with <b>enter</b>; they rip with <b>space</b>. Same keys call the
              beast once the round is running.
            </p>
            <div className="lattu__grid">
              {BLADERS.map((b) => (
                <button
                  key={b.id}
                  className="lattu__card"
                  style={{ ['--ink' as string]: b.ink }}
                  onClick={() => { sfx.tick(); begin(b, BEAST_BY_ID[b.beast], true); }}
                >
                  <div className="lattu__cardname">{b.name}</div>
                  <div className="lattu__cardhandle">“{b.handle}” · carries {BEAST_BY_ID[b.beast].name}</div>
                  <div className="lattu__cardquirk">{QUIRK_TEXT[b.quirk]}</div>
                  <Bars beast={BEAST_BY_ID[b.beast]} />
                </button>
              ))}
            </div>
          </div>
        )}

        {screen === 'launch' && corners && (
          <div className="lattu__overlay">
            <div className="lattu__score">
              round {score.round} · {corners[0].beast.name} {score.a} — {score.b} {corners[1].beast.name}
              {score.last ? ` · last: ${score.last}` : ''}
            </div>
            {!locked[0] ? (
              <Ripper
                label={`${corners[0].blader.name} — ${corners[0].beast.name}`}
                ink={corners[0].beast.ink}
                keyName={corners[1].human ? 'Space' : 'Space'}
                onDone={(l) => onLock(0, l)}
              />
            ) : corners[1].human ? (
              <Ripper
                label={`${corners[1].blader.name} — ${corners[1].beast.name}`}
                ink={corners[1].beast.ink}
                keyName="Enter"
                onDone={(l) => onLock(1, l)}
              />
            ) : (
              <div className="lattu__rip"><div className="lattu__ripstage">they are winding up…</div></div>
            )}
          </div>
        )}

        {screen === 'battle' && corners && (
          <div className="lattu__hud">
            <div className="lattu__side">
              <div className="lattu__sidename" style={{ color: corners[0].beast.ink }}>
                {corners[0].beast.name}
              </div>
              <div className="lattu__spin">
                <b style={{ width: `${Math.round(hud.a * 100)}%`, background: corners[0].beast.ink }} />
              </div>
              <button
                className="lattu__call"
                disabled={!hud.callA}
                style={{ borderColor: corners[0].beast.ink, color: corners[0].beast.ink }}
                onClick={() => bout.current && callBeast(bout.current, 0) && sfx.bell()}
              >
                {hud.callA ? 'CALL IT (space)' : bout.current?.tops[0].spent ? 'called' : 'not yet'}
              </button>
            </div>

            <div className="lattu__middle">
              <div className="lattu__scoreline">
                {score.a} — {score.b}
              </div>
              <div className="lattu__clock">
                {Math.max(0, ROUND_SECONDS - hud.t).toFixed(1)}s
              </div>
              {!running && bout.current?.outcome && (
                <button className="btn btn--big" onClick={nextRound}>Next round</button>
              )}
            </div>

            <div className="lattu__side lattu__side--right">
              <div className="lattu__sidename" style={{ color: corners[1].beast.ink }}>
                {corners[1].beast.name}
              </div>
              <div className="lattu__spin lattu__spin--right">
                <b style={{ width: `${Math.round(hud.b * 100)}%`, background: corners[1].beast.ink }} />
              </div>
              {corners[1].human ? (
                <button
                  className="lattu__call"
                  disabled={!hud.callB}
                  style={{ borderColor: corners[1].beast.ink, color: corners[1].beast.ink }}
                  onClick={() => bout.current && callBeast(bout.current, 1) && sfx.bell()}
                >
                  {hud.callB ? 'CALL IT (enter)' : bout.current?.tops[1].spent ? 'called' : 'not yet'}
                </button>
              ) : (
                <div className="lattu__cpu">{corners[1].blader.name}</div>
              )}
            </div>
          </div>
        )}

        {screen === 'over' && won && corners && (
          <div className="lattu__sheet lattu__sheet--result">
            <h2 className="lattu__h2">{won.mine ? 'You took it.' : 'They took it.'}</h2>
            <div className="lattu__final">
              {corners[0].beast.name} {score.a} — {score.b} {corners[1].beast.name}
            </div>
            {won.prize ? (
              <div className="lattu__prize" style={{ ['--ink' as string]: won.prize.ink }}>
                <Sigil beast={won.prize} size={104} />
                <div>
                  <div className="lattu__cardname">{won.prize.name} is yours</div>
                  <div className="lattu__cardhandle">{won.prize.form}</div>
                  <div className="lattu__cardline">{won.prize.note}</div>
                </div>
              </div>
            ) : (
              <p className="lattu__lede">
                {won.mine
                  ? corners[1].human
                    ? 'Nothing changes hands in a friendly. Go again.'
                    : 'You already had that one.'
                  : 'Nothing lost — they only take the round, not the tin. Go again.'}
              </p>
            )}
            <div className="lattu__choices">
              <button className="btn btn--big" onClick={() => begin(corners[1].blader, corners[1].beast, corners[1].human)}>
                Again
              </button>
              <button className="btn" onClick={() => setScreen(mode === 'ladder' ? 'opponent' : 'p2pick')}>
                Somebody else
              </button>
              <button className="btn" onClick={() => setScreen('home')}>Done</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
