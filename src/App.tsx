import { useCallback, useEffect, useState } from 'react';
import { Arcade } from './arcade/Arcade';
import { Leaderboard } from './ui/Leaderboard';
import { Sheet, SheetHeader } from './ui/Sheet';
import { PenFightGame } from './games/penfight/PenFightGame';
import { RajaRani } from './games/rajarani/RajaRani';
import { Rang } from './games/rang/Rang';
import { Mafia } from './games/mafia/Mafia';
import { BookStall } from './games/bookstall/BookStall';
import { OnceMore } from './games/oncemore/OnceMore';
import { GroundPlan } from './games/groundplan/GroundPlan';
import { Maze } from './games/maze/Maze';
import { DotFieldStage } from './effects/DotFieldStage';
import { RollCall } from './effects/rollcall/RollCall';
import { Lattu } from './games/lattu/Lattu';
import { Crayon } from './effects/crayon/Crayon';
import { Wash } from './effects/wash/Wash';
import { Flat } from './effects/flat/Flat';
import { Water } from './effects/water/Water';
import { Dragon } from './effects/dragon/Dragon';
import { Book } from './effects/book/Book';
import { Epic } from './effects/epic/Epic';
import { Cards } from './effects/cards/Cards';
import type { EffectId } from './effects/effects';
import { isGameId, type GameId } from './arcade/games';
import { roomFromUrl } from './arcade/room';
import { api, type PlayerRow } from './lib/api';
import { playerName, setPlayerName, suggestName } from './lib/identity';
import { audio } from './lib/audio';

/**
 * The shell.
 *
 * Identity, sound and the shelf live here; each game owns everything from its
 * own front page inwards. Landing on a shared link drops you straight into the
 * right game with the room code already in hand.
 */

type Shell = 'boot' | 'shelf' | 'game' | 'effect' | 'ranking' | 'name';

export default function App() {
  const [shell, setShell] = useState<Shell>('boot');
  const [game, setGame] = useState<GameId | null>(null);
  const [effect, setEffect] = useState<EffectId | null>(null);
  const [player, setPlayer] = useState<PlayerRow | null>(null);
  const [name, setName] = useState(playerName());
  const [soundOn, setSoundOn] = useState(true);

  // ---------------------------------------------------------------- boot
  useEffect(() => {
    let alive = true;
    void (async () => {
      const p = await api.ensurePlayer();
      if (!alive) return;
      setPlayer(p);
      setName(p.handle);

      // Arrived on somebody's invite? Go straight there.
      const invite = roomFromUrl();
      if (invite && isGameId(invite.game)) {
        setGame(invite.game);
        setShell('game');
      } else {
        setShell('shelf');
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Browsers will not make a sound until the user has touched something.
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
    audio.setMuted(!soundOn);
  }, [soundOn]);

  const toShelf = useCallback(() => {
    setGame(null);
    setEffect(null);
    setShell('shelf');
  }, []);

  const rename = useCallback(async (next: string) => {
    setPlayerName(next);
    setName(next);
    const updated = await api.rename(next);
    setPlayer((p) => updated ?? (p ? { ...p, handle: next } : p));
  }, []);

  if (shell === 'boot' || !player) {
    return (
      <div className="loader">
        <div>
          <div style={{ fontSize: 22, letterSpacing: '0.2em', marginBottom: 16 }}>
            THE BACK BENCH
          </div>
          <div className="loader__bar">
            <span />
          </div>
          <div style={{ marginTop: 16, opacity: 0.6 }}>setting up the desk</div>
        </div>
      </div>
    );
  }

  // Pen Fight brings its own 3D classroom and full-screen chrome.
  if (shell === 'game' && game === 'penfight') {
    return <PenFightGame onExit={toShelf} onRename={() => setShell('name')} />;
  }

  // Lattu brings a dish and a desk, and wants the whole screen for them.
  if (shell === 'game' && game === 'lattu') {
    return <Lattu onExit={toShelf} />;
  }

  // Effects take the whole screen too — no notebook paper behind them.
  if (shell === 'effect' && effect === 'dotfield') {
    return <DotFieldStage onExit={toShelf} />;
  }
  if (shell === 'effect' && effect === 'rollcall') {
    return <RollCall onExit={toShelf} />;
  }
  if (shell === 'effect' && effect === 'crayon') {
    return <Crayon onExit={toShelf} />;
  }
  if (shell === 'effect' && effect === 'wash') {
    return <Wash onExit={toShelf} />;
  }
  if (shell === 'effect' && effect === 'flat') {
    return <Flat onExit={toShelf} />;
  }
  if (shell === 'effect' && effect === 'water') {
    return <Water onExit={toShelf} />;
  }
  if (shell === 'effect' && effect === 'dragon') {
    return <Dragon onExit={toShelf} />;
  }
  if (shell === 'effect' && effect === 'book') {
    return <Book onExit={toShelf} />;
  }
  if (shell === 'effect' && effect === 'cards') {
    return <Cards onExit={toShelf} />;
  }
  if (shell === 'effect' && effect === 'epic') {
    return <Epic onExit={toShelf} />;
  }

  const inner = () => {
    if (shell === 'ranking') return <Leaderboard onBack={toShelf} />;
    if (shell === 'name') {
      return (
        <NameSheet
          current={name}
          onSave={async (n) => {
            await rename(n);
            setShell(game ? 'game' : 'shelf');
          }}
          onCancel={() => setShell(game ? 'game' : 'shelf')}
        />
      );
    }
    if (shell === 'game' && game === 'rajarani') return <RajaRani onExit={toShelf} />;
    if (shell === 'game' && game === 'rang') return <Rang onExit={toShelf} />;
    if (shell === 'game' && game === 'mafia') return <Mafia onExit={toShelf} />;
    if (shell === 'game' && game === 'bookstall') return <BookStall onExit={toShelf} />;
    if (shell === 'game' && game === 'oncemore') return <OnceMore onExit={toShelf} />;
    if (shell === 'game' && game === 'groundplan') return <GroundPlan onExit={toShelf} />;
    if (shell === 'game' && game === 'maze') return <Maze onExit={toShelf} />;
    return (
      <Arcade
        playerName={name}
        onPick={(id) => {
          setGame(id);
          setShell('game');
        }}
        onEffect={(id) => {
          setEffect(id);
          setShell('effect');
        }}
        onRename={() => setShell('name')}
        onRanking={() => setShell('ranking')}
        soundOn={soundOn}
        onToggleSound={() => setSoundOn((s) => !s)}
      />
    );
  };

  return (
    <>
      <div className="classroom-bg" />
      <div className="vignette" />
      <div className="overlay overlay--scroll">{inner()}</div>
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
  const [value, setValue] = useState(current);

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
          value={value}
          maxLength={18}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && value.trim() && onSave(value)}
          autoComplete="off"
        />
        <div className="field__hint">Up to 18 letters. It goes on the board if you win.</div>
      </div>
      <button className="btn btn--small" onClick={() => setValue(suggestName())}>
        Give me one
      </button>
      <div className="mt">
        <button className="btn btn--primary" disabled={!value.trim()} onClick={() => onSave(value)}>
          That&rsquo;s me
        </button>
        <button className="btn btn--ghost" onClick={onCancel}>
          Never mind
        </button>
      </div>
    </Sheet>
  );
}
