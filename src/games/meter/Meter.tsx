import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Shift, SHIFT, type Readout, type Result } from './stage';
import { PLACES, PLACE_BY_ID, type Place, type PlaceId } from './places';
import { load, MAX_LEVEL, nextLocked, PARTS, priceOf, save, unlocked, type Save } from './garage';
import { sfx } from '../../lib/audio';

/**
 * Meter Down.
 *
 * A shift is four minutes on the clock and every fare you finish buys some of
 * it back, so a good driver never sees the end of one. What you are actually
 * playing for is the rating: the money buys the car, and the *stars* buy the
 * rest of the country.
 *
 * The game itself is not React. `Shift` owns the canvas, the scene and the
 * loop, and reports a flat object once a frame; this file turns that into a
 * heads-up display and otherwise stays out of the way.
 */

type Screen = 'garage' | 'driving' | 'over';

export function Meter({ onExit }: { onExit: () => void }) {
  const [book, setBook] = useState<Save>(() => load());
  const [screen, setScreen] = useState<Screen>('garage');
  const [where, setWhere] = useState<PlaceId>('marine');
  const [hud, setHud] = useState<Readout | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const shift = useRef<Shift | null>(null);
  const keys = useRef(new Set<string>());

  const place = PLACE_BY_ID[where];
  const open = useMemo(() => PLACES.filter((p) => unlocked(book, p.id)), [book]);
  const locked = nextLocked(book);

  useEffect(() => {
    save(book);
  }, [book]);

  // Keys. Held rather than pressed, so `keydown` and `keyup` maintain a set and
  // the loop reads it — anything else gives you a car that stops steering while
  // you are also braking.
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
      keys.current.add(e.key.toLowerCase());
    };
    const up = (e: KeyboardEvent) => keys.current.delete(e.key.toLowerCase());
    const blur = () => keys.current.clear();
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
    };
  }, []);

  const finish = useCallback(
    (r: Result) => {
      setResult(r);
      setScreen('over');
      setBook((b) => {
        const prev = b.best[where];
        return {
          ...b,
          money: b.money + r.money,
          earned: b.earned + r.money,
          best: {
            ...b.best,
            [where]: {
              stars: Math.max(prev?.stars ?? 0, r.stars),
              money: Math.max(prev?.money ?? 0, r.money),
              fares: Math.max(prev?.fares ?? 0, r.fares),
            },
          },
        };
      });
    },
    [where],
  );

  useEffect(() => {
    if (screen !== 'driving' || !canvas.current) return;
    const s = new Shift({
      canvas: canvas.current,
      place,
      upgrades: book.upgrades,
      seed: Math.floor(Math.random() * 1e6),
      onFrame: setHud,
      onEnd: finish,
    });
    shift.current = s;
    const size = () => {
      const el = canvas.current;
      if (el) s.resize(el.clientWidth, el.clientHeight);
    };
    size();
    window.addEventListener('resize', size);
    let raf = 0;
    const pump = () => {
      raf = requestAnimationFrame(pump);
      const k = keys.current;
      const has = (...names: string[]) => names.some((n) => k.has(n));
      s.controls = {
        throttle: has('arrowup', 'w') ? 1 : 0,
        brake: has('arrowdown', 's') ? 1 : 0,
        steer: (has('arrowright', 'd') ? 1 : 0) - (has('arrowleft', 'a') ? 1 : 0),
        hand: has(' ', 'shift'),
        horn: has('h'),
      };
    };
    pump();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', size);
      s.dispose();
      shift.current = null;
    };
    // The shift is built once per drive; changing the car mid-shift is the one
    // thing this should not react to.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  const buy = (id: (typeof PARTS)[number]['id']) => {
    const part = PARTS.find((p) => p.id === id);
    if (!part) return;
    const level = book.upgrades[id];
    const price = priceOf(part, level);
    if (price === null || book.money < price) {
      sfx.tick();
      return;
    }
    sfx.paper();
    setBook((b) => ({ ...b, money: b.money - price, upgrades: { ...b.upgrades, [id]: level + 1 } }));
  };

  if (screen === 'garage' || screen === 'over') {
    return (
      <Garage
        book={book}
        place={place}
        open={open}
        locked={locked}
        result={screen === 'over' ? result : null}
        onPick={setWhere}
        onBuy={buy}
        onDrive={() => {
          sfx.paper();
          setResult(null);
          setHud(null);
          setScreen('driving');
        }}
        onExit={onExit}
      />
    );
  }

  return (
    <div className="meter">
      <canvas ref={canvas} className="meter__canvas" />
      {hud && <Hud r={hud} place={place} />}
      <div className="meter__keys glass">
        <span>↑ ↓ drive</span>
        <span>← → steer</span>
        <span>space handbrake</span>
        <span>H horn</span>
      </div>
      <button
        className="glass glass--btn meter__quit"
        onClick={() => {
          if (hud) finish({ money: hud.money, fares: hud.fares, stars: hud.stars, smashed: hud.smashed });
        }}
      >
        End shift
      </button>
    </div>
  );
}

const clock = (s: number) => `${Math.floor(Math.max(0, s) / 60)}:${String(Math.floor(Math.max(0, s) % 60)).padStart(2, '0')}`;

/**
 * The heads-up display.
 *
 * Four things, and they are in the four places a driver's eye already goes: the
 * clock top centre, the money top right, the passenger bottom left, and the
 * direction of the next stop as an arrow that lives on the edge of the screen
 * rather than a minimap — a minimap is something you read, and there is no time
 * in this game to read anything.
 */
function Hud({ r, place }: { r: Readout; place: Place }) {
  const tight = r.carrying && r.fareClock < 10;
  return (
    <>
      <div className="meter__top">
        <div className={'glass meter__clock' + (r.clock < 30 ? ' meter__clock--out' : '')}>
          <div className="meter__clocknum">{clock(r.clock)}</div>
          <div className="meter__label">shift</div>
        </div>
        <div className="glass meter__take">
          <div className="meter__takenum">₹{r.money.toLocaleString('en-IN')}</div>
          <div className="meter__label">
            {r.fares} fare{r.fares === 1 ? '' : 's'} · {r.stars.toFixed(1)}★
            {r.streak > 1 ? ` · ${r.streak} in a row` : ''}
          </div>
        </div>
        <div className="glass meter__place">
          <div className="meter__placename">{place.name}</div>
          <div className="meter__label">{r.smashed} flattened</div>
        </div>
      </div>

      <div className="meter__arrow" style={{ transform: `rotate(${r.bearing}rad)` }}>
        <svg viewBox="0 0 60 60" width="60" height="60" aria-hidden>
          <path d="M30 4 L46 40 L30 32 L14 40 Z" fill={r.carrying ? '#ffc247' : '#7fd6a0'} opacity="0.92" />
        </svg>
      </div>
      <div className="meter__dist">{Math.round(r.to)} m</div>

      <div className={'glass meter__fare' + (tight ? ' meter__fare--tight' : '')}>
        <div className="meter__who">{r.carrying ? r.who : 'pick up ' + r.who}</div>
        <div className="meter__want">{r.want}</div>
        {r.carrying && (
          <>
            <div className="meter__bar">
              <span style={{ width: `${Math.max(0, Math.min(1, r.fareClock / 60)) * 100}%` }} />
            </div>
            <div className="meter__comfortrow">
              <div className="meter__comfort">
                <span style={{ width: `${r.comfort * 100}%` }} />
              </div>
              <div className="meter__label">
                {clock(r.fareClock)} · {'★'.repeat(Math.round(r.comfort * 5)).padEnd(5, '·')}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="meter__dash glass">
        <div className="meter__speed">{Math.round(r.speed)}</div>
        <div className="meter__label">km/h</div>
        {r.slip > 2.2 && <div className="meter__slide">sliding</div>}
      </div>

      {r.flash && <div className="glass meter__flash">{r.flash}</div>}
    </>
  );
}

function Garage({
  book,
  place,
  open,
  locked,
  result,
  onPick,
  onBuy,
  onDrive,
  onExit,
}: {
  book: Save;
  place: Place;
  open: Place[];
  locked: Place | null;
  result: Result | null;
  onPick: (id: PlaceId) => void;
  onBuy: (id: (typeof PARTS)[number]['id']) => void;
  onDrive: () => void;
  onExit: () => void;
}) {
  return (
    <div className="meter meter--garage">
      <div className="meter__sheet">
        <div className="meter__head">
          <div>
            <div className="ink__eyebrow">black and yellow · four cities · one clock</div>
            <h1 className="ink__title">Meter Down</h1>
          </div>
          <div className="meter__purse">
            <div className="meter__takenum">₹{book.money.toLocaleString('en-IN')}</div>
            <div className="meter__label">₹{book.earned.toLocaleString('en-IN')} earned</div>
          </div>
        </div>

        {result && (
          <div className="glass meter__result">
            <div className="meter__resulthead">Shift over</div>
            <div className="meter__resultrow">
              <span>₹{result.money.toLocaleString('en-IN')}</span>
              <span>
                {result.fares} fare{result.fares === 1 ? '' : 's'}
              </span>
              <span>{result.stars.toFixed(2)}★ average</span>
              <span>
                {result.smashed} thing{result.smashed === 1 ? '' : 's'} flattened
              </span>
            </div>
          </div>
        )}

        <div className="meter__cols">
          <section className="meter__col">
            <h2 className="meter__h2">Where</h2>
            <div className="meter__places">
              {PLACES.map((p) => {
                const has = open.some((o) => o.id === p.id);
                const best = book.best[p.id];
                return (
                  <button
                    key={p.id}
                    className={
                      'meter__placecard' +
                      (place.id === p.id ? ' meter__placecard--on' : '') +
                      (has ? '' : ' meter__placecard--locked')
                    }
                    disabled={!has}
                    onClick={() => onPick(p.id)}
                  >
                    <div className="meter__placetitle">{p.name}</div>
                    <div className="meter__placewhere">{p.where}</div>
                    <div className="meter__placeblurb">{p.blurb}</div>
                    <div className="meter__label">
                      {has
                        ? best
                          ? `best ₹${best.money.toLocaleString('en-IN')} · ${best.stars.toFixed(1)}★`
                          : 'not driven yet'
                        : `opens at ₹${p.unlock.toLocaleString('en-IN')} earned`}
                      {has ? ` · ×${p.purse.toFixed(2)} fares` : ''}
                    </div>
                  </button>
                );
              })}
            </div>
            {locked && (
              <p className="meter__note">
                ₹{(locked.unlock - book.earned).toLocaleString('en-IN')} more earned and {locked.name}{' '}
                opens. Earnings count for this whether you spend them or not.
              </p>
            )}
          </section>

          <section className="meter__col">
            <h2 className="meter__h2">The car</h2>
            <div className="meter__parts">
              {PARTS.map((part) => {
                const level = book.upgrades[part.id];
                const price = priceOf(part, level);
                const can = price !== null && book.money >= price;
                return (
                  <div key={part.id} className="meter__part">
                    <div className="meter__partname">
                      {part.name}
                      <span className="meter__pips">
                        {Array.from({ length: MAX_LEVEL }, (_, i) => (
                          <i key={i} className={i < level ? 'on' : ''} />
                        ))}
                      </span>
                    </div>
                    <div className="meter__partnote">{part.note}</div>
                    <div className="meter__partfoot">
                      <span className="meter__label">{part.reads(level)}</span>
                      <button
                        className={'meter__buy' + (can ? '' : ' meter__buy--no')}
                        disabled={!can}
                        onClick={() => onBuy(part.id)}
                      >
                        {price === null ? 'full' : `₹${price.toLocaleString('en-IN')}`}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <div className="meter__go">
          <button className="glass glass--btn meter__drive" onClick={onDrive}>
            Drive {place.name} · {Math.round(SHIFT / 60)} minutes on the clock
          </button>
          <button className="glass glass--btn" onClick={onExit}>
            ← Shelf
          </button>
        </div>
        <p className="meter__note">
          Every fare you finish puts time back on the shift, so a clean run never ends. The money
          buys the car; the stars buy the rest of the country. Nothing you flatten costs you
          anything except the opinion of whoever is in the back.
        </p>
      </div>
    </div>
  );
}
