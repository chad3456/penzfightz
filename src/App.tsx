import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GameCanvas } from './three/GameCanvas';
import type { NetPenState, ShotRecord } from './three/Arena';
import { useMatch, other, type Side, type RallyResult } from './game/store';
import { snapshot, bodies as debugBodies } from './game/snapshot';
import { OPPONENTS, planShot, thinkTime, type Opponent } from './game/ai';
import { getPen, PENS, STARTER_PENS } from './game/pens';
import { api, type PlayerRow, type Rival } from './lib/api';
import { playerId, playerName, setPlayerName, suggestName, setLocalOwned } from './lib/identity';
import { audio, sfx } from './lib/audio';
import { joinDesk, deskLink, deskCodeFromUrl, clearDeskFromUrl, type NetLink, type NetMessage } from './game/net';

import { Home } from './ui/Home';
import { Leaderboard } from './ui/Leaderboard';
import { PenBox } from './ui/PenBox';
import { HowToPlay } from './ui/HowToPlay';
import { MatchSheet } from './ui/MatchSheet';
import { ResultSheet } from './ui/ResultSheet';
import { FriendDesk } from './ui/FriendDesk';
import { HUD } from './ui/HUD';
import { Sheet, SheetHeader } from './ui/Sheet';

/**
 * The whole game, assembled.
 *
 * The 3D desk is mounted once and never torn down — menus float above it on
 * paper, so the classroom is always there behind whatever you are reading. That
 * is deliberate: you should never feel like you left the room.
 */

type Screen =
  | 'boot'
  | 'home'
  | 'howto'
  | 'ranking'
  | 'penbox'
  | 'friend'
  | 'prematch'
  | 'match'
  | 'result'
  | 'name';

interface Outcome {
  won: boolean;
  myScore: number;
  theirScore: number;
  capturedPen: string | null;
  lostPen: string | null;
  pointsDelta: number;
  rank: number | null;
  classSize: number;
  gapToRival: number | null;
  rivalName: string | null;
}

export default function App() {
  // ---------------------------------------------------------------- identity
  const [player, setPlayer] = useState<PlayerRow | null>(null);
  const [rank, setRank] = useState<number | null>(null);
  const [classSize, setClassSize] = useState(0);
  const [screen, setScreen] = useState<Screen>('boot');
  const [muted, setMuted] = useState(false);

  // ---------------------------------------------------------------- match ctx
  const [mode, setMode] = useState<'practice' | 'friend' | 'ranked'>('practice');
  const [format, setFormat] = useState(5);
  const [opponent, setOpponent] = useState<Opponent | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [justWon, setJustWon] = useState<string | null>(null);
  const rallies = useRef<boolean[]>([]);
  const shotLog = useRef<ShotRecord[]>([]);

  // ---------------------------------------------------------------- net ctx
  const [deskMode, setDeskMode] = useState<'choose' | 'hosting' | 'joining'>('choose');
  const [deskCode, setDeskCode] = useState<string | null>(null);
  const [deskBusy, setDeskBusy] = useState(false);
  const [deskError, setDeskError] = useState<string | null>(null);
  const [challenge, setChallenge] = useState<Rival | null>(null);
  const [linked, setLinked] = useState(false);
  const link = useRef<NetLink | null>(null);
  const netState = useRef<NetPenState | null>(null);

  const store = useMatch;

  // ---------------------------------------------------------------- boot
  useEffect(() => {
    let alive = true;
    void (async () => {
      const p = await api.ensurePlayer();
      if (!alive) return;
      setPlayer(p);
      const card = await api.myCard();
      if (!alive) return;
      if (card) {
        setRank(card.rank);
        setClassSize(card.class_size);
      }

      // Arrived on somebody's link? Go straight to their desk.
      const code = deskCodeFromUrl();
      if (code && api.online) {
        setDeskCode(code);
        setDeskMode('joining');
        setScreen('friend');
        void joinExisting(code, p.current_pen);
      } else {
        setScreen('home');
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * A hook for driving the game from the console or an automated run.
   *
   * Only mounted in dev or behind `?debug`, so a normal player's page has no
   * such handle. It is a convenience for testing the physics and the match
   * state machine without a hand on the mouse — it grants nothing the UI does
   * not already allow, since practice matches are simulated client-side anyway.
   */
  useEffect(() => {
    const wanted =
      import.meta.env.DEV || new URLSearchParams(window.location.search).has('debug');
    if (!wanted) return;
    (window as unknown as Record<string, unknown>).__penfight = {
      store,
      state: () => store.getState(),
      screen: () => screen,
      pens: () => JSON.parse(JSON.stringify(snapshot)),
      /** Park a pen somewhere specific — calibration and repro only. */
      place: (side: Side, x: number, z: number) => {
        const b = debugBodies[side];
        if (!b) return;
        b.setTranslation({ x, y: 0.775, z }, true);
        b.setLinvel({ x: 0, y: 0, z: 0 }, true);
        b.setAngvel({ x: 0, y: 0, z: 0 }, true);
      },
      bodyInfo: () => ({
        host: debugBodies.host
          ? { mass: debugBodies.host.mass(), v: debugBodies.host.linvel() }
          : null,
        guest: debugBodies.guest
          ? { mass: debugBodies.guest.mass(), v: debugBodies.guest.linvel() }
          : null,
      }),
      /** Flick the active side's pen: angle in degrees, 0 = straight ahead. */
      flick: (power = 0.8, angleDeg = 0, strike = 0) => {
        const st = store.getState();
        const away = st.turn === 'host' ? -1 : 1;
        const a = (angleDeg * Math.PI) / 180;
        st.fire({
          side: st.turn,
          dx: Math.sin(a) * away,
          dz: Math.cos(a) * away,
          power,
          strike,
        });
      },
    };
    return () => {
      delete (window as unknown as Record<string, unknown>).__penfight;
    };
  }, [store, screen]);

  // Audio needs a gesture. Take the first one, whatever it is.
  useEffect(() => {
    const go = () => void audio.unlock();
    window.addEventListener('pointerdown', go, { once: true });
    window.addEventListener('keydown', go, { once: true });
    return () => {
      window.removeEventListener('pointerdown', go);
      window.removeEventListener('keydown', go);
    };
  }, []);

  useEffect(() => {
    audio.setMuted(muted);
  }, [muted]);

  const refreshMe = useCallback(async () => {
    const card = await api.myCard();
    if (!card) return null;
    setPlayer(card.player);
    setRank(card.rank);
    setClassSize(card.class_size);
    return card;
  }, []);

  // ================================================================ practice

  const startPractice = useCallback(() => {
    if (!player) return;
    // Pick an opponent near your level so the first game is not a slaughter.
    const tier = Math.min(OPPONENTS.length - 1, Math.floor((player.points ?? 0) / 220));
    const pool = OPPONENTS.slice(0, Math.max(2, tier + 2));
    const opp = pool[Math.floor(Math.random() * pool.length)];
    setOpponent(opp);
    setMode('practice');
    rallies.current = [];
    shotLog.current = [];
    store.getState().setupMatch({
      mode: 'practice',
      format,
      mySide: 'host',
      isAuthority: true,
      names: { host: player.handle, guest: opp.name },
      pens: { host: player.current_pen, guest: opp.penId },
      first: Math.random() < 0.5 ? 'host' : 'guest',
    });
    setScreen('prematch');
  }, [player, format, store]);

  // The opponent takes their flick once the desk is quiet and it is their turn.
  const livePhase = useMatch((s) => s.phase);
  const liveTurn = useMatch((s) => s.turn);

  useEffect(() => {
    if (screen !== 'match' || mode !== 'practice' || !opponent) return;
    if (livePhase !== 'ready' || liveTurn !== 'guest') return;

    const t = setTimeout(() => {
      const now = store.getState();
      // The board can change while they are thinking; check again before firing.
      if (now.phase !== 'ready' || now.turn !== 'guest') return;
      now.fire({ side: 'guest', ...planShot('guest', opponent, now.pens.guest) });
    }, thinkTime(opponent));

    return () => clearTimeout(t);
  }, [screen, mode, opponent, livePhase, liveTurn, store]);

  // ================================================================ friend

  const openFriend = useCallback(() => {
    setDeskMode('choose');
    setDeskCode(null);
    setDeskError(null);
    setChallenge(null);
    setScreen('friend');
  }, []);

  const teardownLink = useCallback(() => {
    link.current?.leave();
    link.current = null;
    netState.current = null;
    setLinked(false);
  }, []);

  /** Wire up the realtime channel for a desk, whichever side we are. */
  const attachLink = useCallback(
    (code: string, side: Side) => {
      teardownLink();
      link.current = joinDesk(code, {
        onMessage: (msg) => handleNet(msg, side),
        onPeerJoin: () => setLinked(true),
        onPeerLeave: () => {
          setLinked(false);
          if (store.getState().phase !== 'menu') {
            store.getState().setToast('Your friend left the desk.');
          }
        },
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [teardownLink],
  );

  const hostDesk = useCallback(
    async (opts?: { challenge?: Rival | null }) => {
      if (!player) return;
      setDeskBusy(true);
      setDeskError(null);
      const room = await api.createRoom({
        pen: player.current_pen,
        format,
        challenge: Boolean(opts?.challenge),
      });
      setDeskBusy(false);
      if (!room) {
        setDeskError('Could not set up a desk. Check your connection.');
        return;
      }
      setDeskCode(room.code);
      setDeskMode('hosting');
      setMode(opts?.challenge ? 'ranked' : 'friend');
      setChallenge(opts?.challenge ?? null);
      setScreen('friend');
      attachLink(room.code, 'host');
    },
    [player, format, attachLink],
  );

  const joinExisting = useCallback(
    async (code: string, pen: string) => {
      setDeskBusy(true);
      setDeskError(null);
      const { room, error } = await api.joinRoom(code, pen);
      setDeskBusy(false);
      if (error || !room) {
        setDeskError(error ?? 'Could not sit down.');
        setDeskMode('choose');
        clearDeskFromUrl();
        return;
      }
      clearDeskFromUrl();
      setDeskCode(room.code);
      setMode(room.challenge ? 'ranked' : 'friend');
      setFormat(room.format);

      const iAmHost = room.host_id === playerId();
      const side: Side = iAmHost ? 'host' : 'guest';

      rallies.current = [];
      shotLog.current = [];
      store.getState().setupMatch({
        mode: room.challenge ? 'ranked' : 'friend',
        format: room.format,
        mySide: side,
        isAuthority: iAmHost,
        names: { host: room.host_name, guest: room.guest_name ?? playerName() },
        pens: {
          host: room.host_pen,
          guest: room.guest_pen ?? pen,
        },
        first: 'host',
      });

      attachLink(room.code, side);
      setDeskMode('hosting');
      // Announce ourselves; the host answers with a `start`.
      setTimeout(() => {
        link.current?.send({
          type: 'hello',
          side,
          name: playerName(),
          pen,
          format: room.format,
        });
      }, 400);
      setScreen('prematch');
    },
    [attachLink, store],
  );

  /** Host: somebody sat down, so deal the match. */
  const dealMatch = useCallback(
    (guestName: string, guestPen: string) => {
      if (!player) return;
      const first: Side = Math.random() < 0.5 ? 'host' : 'guest';
      rallies.current = [];
      shotLog.current = [];
      store.getState().setupMatch({
        mode: mode === 'ranked' ? 'ranked' : 'friend',
        format,
        mySide: 'host',
        isAuthority: true,
        names: { host: player.handle, guest: guestName },
        pens: { host: player.current_pen, guest: guestPen },
        first,
      });
      link.current?.send({
        type: 'start',
        format,
        hostName: player.handle,
        guestName,
        hostPen: player.current_pen,
        guestPen,
        first,
      });
      setScreen('match');
    },
    [player, format, mode, store],
  );

  // ---------------------------------------------------------------- net in
  const handleNet = useCallback(
    (msg: NetMessage, side: Side) => {
      const st = store.getState();

      switch (msg.type) {
        case 'hello':
          setLinked(true);
          if (side === 'host' && msg.side === 'guest') {
            dealMatch(msg.name, msg.pen);
          }
          break;

        case 'start':
          if (side === 'guest') {
            setLinked(true);
            setFormat(msg.format);
            rallies.current = [];
            st.setupMatch({
              mode: mode === 'ranked' ? 'ranked' : 'friend',
              format: msg.format,
              mySide: 'guest',
              isAuthority: false,
              names: { host: msg.hostName, guest: msg.guestName },
              pens: { host: msg.hostPen, guest: msg.guestPen },
              first: msg.first,
            });
            setScreen('match');
          }
          break;

        case 'shot':
          // Only the host acts on a shot; it owns the simulation.
          if (side === 'host' && msg.side === 'guest') {
            st.fire({ side: 'guest', dx: msg.dx, dz: msg.dz, power: msg.power, strike: msg.strike });
          }
          break;

        case 'sync':
          if (side === 'guest') {
            netState.current = msg.state;
            // Converge on the host's view of the match without stamping on a
            // draw the player is in the middle of.
            const patch: Partial<ReturnType<typeof store.getState>> = {
              turn: msg.turn,
              score: msg.score,
            };
            if (st.phase !== 'aiming' && st.phase !== 'point' && st.phase !== 'over') {
              patch.phase = msg.live ? 'live' : 'ready';
            }
            store.setState(patch);
          }
          break;

        case 'rally':
          if (side === 'guest') {
            store.setState({
              score: msg.score,
              lastResult: {
                scoringSide: msg.scoringSide,
                reason: msg.reason as RallyResult['reason'],
                fellSide: msg.fellSide,
              },
              phase: msg.winner ? 'over' : 'point',
              winner: msg.winner,
              turn: msg.turn,
              rally: msg.rally,
            });
            sfx.point(msg.scoringSide === 'guest');
          }
          break;

        case 'rematch':
          if (side === 'guest') {
            setScreen('match');
          }
          break;

        case 'bye':
          setLinked(false);
          store.getState().setToast('Your friend left the desk.');
          break;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dealMatch, mode, store],
  );

  // ---------------------------------------------------------------- net out
  const onNetSync = useCallback(
    (state: NetPenState) => {
      const st = store.getState();
      link.current?.send({
        type: 'sync',
        state,
        turn: st.turn,
        score: st.score,
        rally: st.rally,
        live: st.phase === 'live',
      });
    },
    [store],
  );

  const onShotFired = useCallback(
    (shot: { dx: number; dz: number; power: number; strike: number }) => {
      const st = store.getState();
      if (st.isAuthority) return; // host applies its own shots directly
      link.current?.send({ type: 'shot', side: st.mySide, ...shot });
    },
    [store],
  );

  // ================================================================ rallies

  const finishMatch = useCallback(
    async (winner: Side) => {
      const st = store.getState();
      const iWon = winner === st.mySide;
      const myPen = st.pens[st.mySide];
      const theirPen = st.pens[other(st.mySide)];
      const stakes = st.mode !== 'practice';

      sfx.matchEnd(iWon);

      let captured: string | null = null;
      let lost: string | null = null;
      if (stakes) {
        if (iWon) captured = theirPen;
        else lost = myPen;
      }

      // Only the authority writes, so a two-player match is booked once.
      let points = st.mode === 'practice' ? (iWon ? 4 : 0) : iWon ? 20 : -10;
      if (st.isAuthority) {
        const res = await api.recordMatch({
          mode: st.mode === 'practice' ? 'practice' : mode === 'ranked' ? 'ranked' : 'friend',
          format: st.format,
          hostId: playerId(),
          guestId: st.mode === 'practice' ? null : (guestIdRef.current ?? null),
          hostName: st.names.host,
          guestName: st.names.guest,
          hostPen: st.pens.host,
          guestPen: st.pens.guest,
          hostScore: st.score.host,
          guestScore: st.score.guest,
          winnerSide: winner,
          shots: shotLog.current.length,
          durationMs: Date.now() - st.startedAt,
        });
        if (res?.match_id) {
          void api.logShots(
            res.match_id,
            shotLog.current.map((s, i) => ({
              turn: i + 1,
              side: s.side,
              power: Number(s.power.toFixed(3)),
              angle: Number(s.angle.toFixed(3)),
              outcome: s.outcome,
            })),
          );
        }
        if (res) points = iWon ? res.points : -10;
      }

      const card = await refreshMe();
      const rival = await api.rivalAbove();

      if (captured) {
        setJustWon(captured);
        // Keep the local mirror honest even when offline.
        const owned = new Set([...(card?.player.owned_pens ?? STARTER_PENS), captured]);
        setLocalOwned([...owned]);
      }

      setOutcome({
        won: iWon,
        myScore: st.score[st.mySide],
        theirScore: st.score[other(st.mySide)],
        capturedPen: captured,
        lostPen: lost,
        pointsDelta: iWon ? Math.abs(points) : -Math.abs(points),
        rank: card?.rank ?? null,
        classSize: card?.class_size ?? 0,
        gapToRival: rival ? Math.max(0, (rival.my_rank ?? 0) - rival.rank - 1) : null,
        rivalName: rival?.handle ?? null,
      });
      setScreen('result');
    },
    [mode, refreshMe, store],
  );

  const guestIdRef = useRef<string | null>(null);

  const onRally = useCallback(
    (result: RallyResult, shot: ShotRecord) => {
      const st = store.getState();
      shotLog.current.push(shot);
      rallies.current.push(result.scoringSide === st.mySide);
      st.resolveRally(result);

      const after = store.getState();

      // Tell the guest what happened on the authoritative desk.
      if (st.isAuthority && st.mode !== 'practice') {
        link.current?.send({
          type: 'rally',
          score: after.score,
          turn: other(result.scoringSide),
          rally: after.rally,
          scoringSide: result.scoringSide,
          reason: result.reason,
          fellSide: result.fellSide,
          winner: after.winner,
        });
      }

      audio.duck(0.5, 1.4);

      if (after.winner) {
        setTimeout(() => void finishMatch(after.winner!), 1500);
      } else {
        setTimeout(() => {
          if (store.getState().phase === 'point') store.getState().nextRally();
        }, 1600);
      }
    },
    [finishMatch, store],
  );

  // ================================================================ actions

  const quitMatch = useCallback(() => {
    link.current?.send({ type: 'bye', side: store.getState().mySide });
    teardownLink();
    if (deskCode) void api.closeRoom(deskCode);
    setDeskCode(null);
    store.getState().quitMatch();
    setScreen('home');
  }, [deskCode, store, teardownLink]);

  const rematch = useCallback(() => {
    if (mode === 'practice') {
      startPractice();
      return;
    }
    // Two-player: the host re-deals with whatever pens are now in hand.
    if (store.getState().isAuthority) {
      const st = store.getState();
      link.current?.send({ type: 'rematch' });
      rallies.current = [];
      shotLog.current = [];
      store.getState().setupMatch({
        mode: st.mode,
        format,
        mySide: 'host',
        isAuthority: true,
        names: st.names,
        pens: { host: player?.current_pen ?? st.pens.host, guest: st.pens.guest },
        first: Math.random() < 0.5 ? 'host' : 'guest',
      });
      setScreen('match');
    } else {
      store.getState().setToast('Waiting for the host to deal again…');
    }
  }, [mode, startPractice, format, player, store]);

  const pickPen = useCallback(
    async (penId: string) => {
      sfx.chalk();
      const updated = await api.choosePen(penId);
      setPlayer((prev) => updated ?? (prev ? { ...prev, current_pen: penId } : prev));
      if (screen === 'penbox') setJustWon(null);
    },
    [screen],
  );

  const share = useCallback(async () => {
    const st = store.getState();
    const text = outcome
      ? outcome.won
        ? `I just won ${getPen(outcome.capturedPen ?? st.pens[other(st.mySide)]).name} off ${st.names[other(st.mySide)]} at Pen Fight.`
        : `Lost a pen at Pen Fight. Come take one off me.`
      : 'Pen fight? Back bench, right now.';
    const url = deskCode ? deskLink(deskCode) : window.location.origin;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Pen Fight', text, url });
      } else {
        await navigator.clipboard.writeText(`${text} ${url}`);
        store.getState().setToast('Copied.');
        setTimeout(() => store.getState().setToast(null), 1600);
      }
    } catch {
      /* dismissed */
    }
  }, [outcome, deskCode, store]);

  // ---------------------------------------------------------------- unmount
  useEffect(() => () => teardownLink(), [teardownLink]);

  const owned = useMemo(() => {
    const base = player?.owned_pens?.length ? player.owned_pens : STARTER_PENS;
    // Anything cheap enough for your points is also in the tin.
    const affordable = PENS.filter((p) => p.unlockPoints > 0 && (player?.points ?? 0) >= p.unlockPoints).map(
      (p) => p.id,
    );
    return [...new Set([...base, ...affordable])];
  }, [player]);

  const connection: 'solo' | 'linked' | 'waiting' =
    mode === 'practice' ? 'solo' : linked ? 'linked' : 'waiting';

  // ================================================================ render

  if (screen === 'boot' || !player) {
    return (
      <div className="loader">
        <div>
          <div style={{ fontSize: 22, letterSpacing: '0.2em', marginBottom: 16 }}>PEN FIGHT</div>
          <div className="loader__bar">
            <span />
          </div>
          <div style={{ marginTop: 16, opacity: 0.6 }}>setting up the desk</div>
        </div>
      </div>
    );
  }

  const st = store.getState();
  const showHud = screen === 'match';

  return (
    <>
      <div className="stage">
        <GameCanvas
          onRally={onRally}
          onShotFired={onShotFired}
          netStateRef={netState}
          onNetSync={st.isAuthority && mode !== 'practice' ? onNetSync : undefined}
        />
      </div>
      <div className="vignette" />

      {showHud && (
        <HUD
          onQuit={quitMatch}
          onPenBox={() => setScreen('penbox')}
          muted={muted}
          onToggleMute={() => setMuted((m) => !m)}
          connection={connection}
        />
      )}

      {screen === 'home' && (
        <div className="overlay overlay--scroll">
          <Home
            playerName={player.handle}
            penId={player.current_pen}
            points={player.points}
            rank={rank}
            classSize={classSize}
            onPractice={startPractice}
            onFriend={openFriend}
            onRanked={(rival) => {
              setChallenge(rival);
              void hostDesk({ challenge: rival });
            }}
            onPenBox={() => setScreen('penbox')}
            onRanking={() => setScreen('ranking')}
            onHowTo={() => setScreen('howto')}
            onRename={() => setScreen('name')}
          />
        </div>
      )}

      {screen === 'name' && (
        <div className="overlay">
          <NameSheet
            current={player.handle}
            onSave={async (name) => {
              setPlayerName(name);
              const updated = await api.rename(name);
              setPlayer((p) => updated ?? (p ? { ...p, handle: name } : p));
              setScreen('home');
            }}
            onCancel={() => setScreen('home')}
          />
        </div>
      )}

      {screen === 'howto' && (
        <div className="overlay overlay--scroll">
          <HowToPlay onBack={() => setScreen(st.phase === 'menu' ? 'home' : 'prematch')} />
        </div>
      )}

      {screen === 'ranking' && (
        <div className="overlay overlay--scroll">
          <Leaderboard onBack={() => setScreen('home')} />
        </div>
      )}

      {screen === 'penbox' && (
        <div className="overlay overlay--scroll">
          <PenBox
            owned={owned}
            current={player.current_pen}
            points={player.points}
            justWon={justWon}
            onPick={pickPen}
            onClose={() => {
              setJustWon(null);
              setScreen(st.phase === 'menu' ? 'home' : st.phase === 'over' ? 'result' : 'match');
            }}
            onShare={share}
            onRanking={() => setScreen('ranking')}
          />
        </div>
      )}

      {screen === 'friend' && (
        <div className="overlay overlay--scroll">
          <FriendDesk
            mode={deskMode}
            code={deskCode}
            format={format}
            waiting={deskBusy || !linked}
            error={deskError}
            challengeName={challenge?.handle ?? null}
            onCreate={() => void hostDesk()}
            onJoin={(code) => void joinExisting(code, player.current_pen)}
            onFormat={setFormat}
            onCancel={quitMatch}
          />
        </div>
      )}

      {screen === 'prematch' && (
        <div className="overlay overlay--scroll">
          {st.isAuthority ? (
            <MatchSheet
              mode={mode}
              format={st.format}
              myName={st.names[st.mySide]}
              myPen={st.pens[st.mySide]}
              theirName={st.names[other(st.mySide)]}
              theirPen={st.pens[other(st.mySide)]}
              opponent={mode === 'practice' ? opponent : null}
              seriesNote={
                mode === 'practice'
                  ? `Practice · best of ${st.format}`
                  : `${mode === 'ranked' ? 'Challenge' : 'Two players'} · best of ${st.format}`
              }
              onStart={() => {
                sfx.bell();
                setScreen('match');
              }}
              onHowTo={() => setScreen('howto')}
              onSwapPen={() => setScreen('penbox')}
              onCancel={quitMatch}
            />
          ) : (
            <Sheet seed={13}>
              <SheetHeader subtitle="Two players" />
              <h2 className="title center">You are at the desk</h2>
              <p className="lede">
                Waiting for {st.names.host} to deal<span className="waiting-dots" />
              </p>
              <div className="rule--thin" />
              <button className="btn btn--ghost" onClick={quitMatch}>
                Leave the desk
              </button>
            </Sheet>
          )}
        </div>
      )}

      {screen === 'result' && outcome && (
        <div className="overlay overlay--scroll">
          <ResultSheet
            won={outcome.won}
            myName={st.names[st.mySide]}
            theirName={st.names[other(st.mySide)]}
            myScore={outcome.myScore}
            theirScore={outcome.theirScore}
            format={st.format}
            rallies={rallies.current}
            capturedPen={outcome.capturedPen}
            lostPen={outcome.lostPen}
            pointsDelta={outcome.pointsDelta}
            rank={outcome.rank}
            classSize={outcome.classSize}
            gapToRival={outcome.gapToRival}
            rivalName={outcome.rivalName}
            onRematch={rematch}
            onPenBox={() => setScreen('penbox')}
            onShare={share}
            onHome={quitMatch}
          />
        </div>
      )}
    </>
  );
}

// ------------------------------------------------------------------ name

function NameSheet({
  current,
  onSave,
  onCancel,
}: {
  current: string;
  onSave: (name: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(current);

  return (
    <Sheet seed={5} width="narrow">
      <SheetHeader subtitle="Roll call" />
      <h2 className="title center">What do they call you?</h2>
      <div className="field">
        <label className="field__label" htmlFor="handle">
          Your name in this class
        </label>
        <input
          id="handle"
          className="field__input"
          value={name}
          maxLength={18}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && name.trim() && onSave(name)}
          autoComplete="off"
        />
        <div className="field__hint">
          Up to 18 letters. It goes on the board if you win.
        </div>
      </div>
      <button className="btn btn--small" onClick={() => setName(suggestName())}>
        Give me one
      </button>
      <div className="mt">
        <button className="btn btn--primary" disabled={!name.trim()} onClick={() => onSave(name)}>
          That&rsquo;s me
        </button>
        <button className="btn btn--ghost" onClick={onCancel}>
          Never mind
        </button>
      </div>
    </Sheet>
  );
}

