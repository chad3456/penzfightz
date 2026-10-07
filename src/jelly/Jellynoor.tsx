/**
 * JELLYNOOR — a hill station set in jelly.
 *
 * A small tea estate up in the hills where the ground, the bushes, the cow,
 * the roofs and the people are all made of the same wobbling stuff. You plant
 * out the empty plots, water and weed and prune, pluck two leaves and a bud
 * when a flush is standing proud of the table, carry the basket down to the
 * scale, and follow the leaf through withering, rolling, firing and packing.
 * In between there is a cow to milk, hens to feed, chai to brew, firewood to
 * split, washing to hang, a yard to sweep and lamps to light at dusk. The
 * villagers do the same round beside you all day.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { JellyWorld, type Hud } from './world';
import type { Quality } from './scene';
import { UPGRADES } from './chores';

type Phase = 'title' | 'play';

const TOOL_LABEL: Record<string, string> = {
  hand: 'bare hands', basket: 'basket', can: 'watering can', shears: 'shears',
  broom: 'broom', sapling: 'sapling', pot: 'milk pot', axe: 'axe',
};

/** The thumbstick on a phone: drag inside the ring to walk. */
function Stick({ onMove }: { onMove: (x: number, y: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const id = useRef(-1);

  const set = (e: React.PointerEvent) => {
    const el = ref.current!;
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    let dx = (e.clientX - cx) / (r.width / 2), dy = (e.clientY - cy) / (r.height / 2);
    const l = Math.hypot(dx, dy);
    if (l > 1) { dx /= l; dy /= l; }
    setKnob({ x: dx, y: dy });
    onMove(dx, -dy);
  };
  return (
    <div
      ref={ref}
      className="jl-stick"
      onPointerDown={(e) => { id.current = e.pointerId; (e.target as Element).setPointerCapture(e.pointerId); set(e); }}
      onPointerMove={(e) => { if (e.pointerId === id.current) set(e); }}
      onPointerUp={(e) => { if (e.pointerId === id.current) { id.current = -1; setKnob({ x: 0, y: 0 }); onMove(0, 0); } }}
      onPointerCancel={() => { id.current = -1; setKnob({ x: 0, y: 0 }); onMove(0, 0); }}
      aria-label="Walk"
    >
      <i style={{ transform: `translate(${knob.x * 26}px, ${knob.y * 26}px)` }} />
    </div>
  );
}

function Gauge({ v, max, label, tone }: { v: number; max: number; label: string; tone: string }) {
  const p = Math.max(0, Math.min(1, v / max));
  return (
    <div className="jl-gauge" title={`${label}: ${v.toFixed(1)} of ${max}`}>
      <div className="jl-gauge__bar"><i style={{ width: `${p * 100}%`, background: tone }} /></div>
      <span>{label} <b>{v < 10 ? v.toFixed(1) : Math.round(v)}</b>{max !== 1 && <em>/{max}</em>}</span>
    </div>
  );
}

export function Jellynoor({ onExit }: { onExit: () => void }) {
  const cv = useRef<HTMLCanvasElement>(null);
  const world = useRef<JellyWorld | null>(null);
  const [phase, setPhase] = useState<Phase>('title');
  const [hud, setHud] = useState<Hud | null>(null);
  const [help, setHelp] = useState(false);
  const [muted, setMuted] = useState(false);
  const [shop, setShop] = useState(false);
  const coarse = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;
  const [quality] = useState<Quality>(() => {
    const q = new URLSearchParams(location.search).get('jq');
    if (q === 'low' || q === 'high') return q;
    return window.matchMedia('(max-width: 820px), (pointer: coarse)').matches ? 'low' : 'high';
  });

  useEffect(() => {
    const ls = ['/fonts-airstrip/fonts.css', '/fonts-guitar/fonts.css'].map((href) => {
      const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; document.head.appendChild(l); return l;
    });
    return () => ls.forEach((l) => l.remove());
  }, []);

  const start = useCallback(() => {
    if (world.current || !cv.current) return;
    const w = new JellyWorld(cv.current, quality);
    w.onHud = setHud;
    world.current = w;
    (window as unknown as { __jelly?: unknown }).__jelly = w;
    setPhase('play');
  }, [quality]);

  useEffect(() => () => { world.current?.dispose(); world.current = null; }, []);

  useEffect(() => {
    const onResize = () => world.current?.resize();
    window.addEventListener('resize', onResize);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { if (help || shop) { setHelp(false); setShop(false); } else onExit(); }
      if (e.code === 'KeyH') setHelp((v) => !v);
      if (e.code === 'KeyM') setMuted((v) => { world.current?.sound.setMuted(!v); return !v; });
    };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('resize', onResize); window.removeEventListener('keydown', onKey); };
  }, [onExit, help, shop]);

  useEffect(() => { if (hud?.atShop && !shop) setShop(true); }, [hud?.atShop, shop]);

  const w = world.current;
  const f = hud?.factory;

  return (
    <div className="jl">
      <canvas ref={cv} className="jl-cv" />

      {phase === 'title' && (
        <div className="jl-title">
          <div className="jl-title__card">
            <div className="jl-kicker">A wobbling hill station</div>
            <h1>Jellynoor</h1>
            <p className="jl-dek">
              A tea estate up in the hills where the ground, the bushes, the cow, the tin roofs and everyone who lives
              there are made of the same soft stuff. Plant out the empty plots, water and weed and prune, pluck two
              leaves and a bud, and carry the basket down to the scale. Then there is the cow to milk, the hens to feed,
              chai to put on, wood to split, washing to hang and the lamps to light before the valley goes dark.
            </p>
            <ul className="jl-chores">
              <li>Plant · water · weed · prune · pluck</li>
              <li>Weigh · wither · roll · fire · pack</li>
              <li>Milk · feed · brew · chop · hang · sweep · light</li>
            </ul>
            <button className="jl-go" onClick={start}>Walk up the path</button>
            <div className="jl-keys">
              {coarse ? 'Thumbstick to walk, drag to look, the big button to work.' : 'WASD to walk · drag to look · hold E to work · Space to hop · H for help'}
            </div>
            <button className="jl-back" onClick={onExit}>← Shelf</button>
          </div>
        </div>
      )}

      {phase === 'play' && hud && (
        <>
          <div className="jl-top">
            <button className="jl-btn jl-btn--ghost" onClick={onExit} aria-label="Back to the shelf"><span className="jl-wide">← Shelf</span><span className="jl-narrow" aria-hidden>←</span></button>
            <div className="jl-clock">
              <b>Day {hud.day}</b>
              <span>{hud.clock}</span>
              <em>{hud.raining ? 'rain over the ridge' : hud.part}</em>
            </div>
            <div className="jl-right">
              <div className="jl-coins" title="Coins">◉ {hud.coins}</div>
              <button className="jl-btn jl-btn--ghost" onClick={() => setMuted((v) => { world.current?.sound.setMuted(!v); return !v; })} aria-pressed={muted} aria-label={muted ? 'Turn sound on' : 'Turn sound off'}>
                <span className="jl-wide">{muted ? 'Sound off' : 'Sound on'}</span><span className="jl-narrow" aria-hidden>{muted ? '🔇' : '🔊'}</span>
              </button>
              <button className="jl-btn jl-btn--ghost" onClick={() => setHelp((v) => !v)} aria-label="Help"><span className="jl-wide">Help</span><span className="jl-narrow" aria-hidden>?</span></button>
            </div>
          </div>

          <div className="jl-side">
            <Gauge v={hud.leaf} max={hud.leafMax} label="Basket" tone="#7fdc63" />
            {hud.can > 0.01 && <Gauge v={hud.can} max={1} label="Can" tone="#5ccbe8" />}
            {hud.milk > 0.01 && <Gauge v={hud.milk} max={1} label="Milk" tone="#fff0d8" />}
            {hud.saplings > 0 && <div className="jl-chip">{hud.saplings} sapling{hud.saplings > 1 ? 's' : ''}</div>}
            {hud.wood > 0 && <div className="jl-chip">{hud.wood} logs</div>}
            <div className="jl-chip jl-chip--tool">In hand: {TOOL_LABEL[hud.tool] ?? hud.tool}</div>

            {f && (f.green + f.withered + f.rolled + f.dried > 0.4 || f.chests > 0) && (
              <div className="jl-fac">
                <div className="jl-fac__h">The leaf</div>
                {([['green', 'green'], ['withered', 'withered'], ['rolled', 'rolled'], ['dried', 'made tea']] as [keyof typeof f, string][]).map(([k, label]) => (
                  (f[k] as number) > 0.05 && <div key={label} className="jl-fac__row"><span>{label}</span><b>{(f[k] as number).toFixed(1)} kg</b></div>
                ))}
                {f.chests > 0 && <div className="jl-fac__row jl-fac__row--good"><span>chests</span><b>{f.chests}</b></div>}
              </div>
            )}

            {hud.todo.length > 0 && (
              <div className="jl-todo">
                <div className="jl-fac__h">Wants doing</div>
                {hud.todo.map((t) => <div key={t}>· {t}</div>)}
              </div>
            )}
          </div>

          <div className="jl-toasts">
            {hud.toasts.map((t, i) => <div key={t + i} className="jl-toast">{t}</div>)}
          </div>

          {hud.prompt && (
            <div className={`jl-prompt${hud.prompt.blocked ? ' is-blocked' : ''}`}>
              <div className="jl-prompt__ring" style={{ ['--p' as string]: hud.progress }}>
                <span>{coarse ? '✓' : 'E'}</span>
              </div>
              <div>
                <b>{hud.prompt.label}</b>
                <em>{hud.prompt.blocked ?? hud.prompt.hint}</em>
              </div>
            </div>
          )}

          {hud.sleeping && <div className="jl-sleep" />}

          {coarse && (
            <div className="jl-touch">
              <Stick onMove={(x, y) => world.current?.setMove(x, y)} />
              <div className="jl-touch__r">
                <button
                  className="jl-act"
                  onPointerDown={() => world.current?.setAction(true)}
                  onPointerUp={() => world.current?.setAction(false)}
                  onPointerLeave={() => world.current?.setAction(false)}
                  aria-label="Do the job"
                >Work</button>
                <button className="jl-hop" onClick={() => world.current?.jump()} aria-label="Hop">Hop</button>
              </div>
            </div>
          )}

          {shop && (
            <div className="jl-sheet" role="dialog" aria-label="Estate store">
              <div className="jl-sheet__card">
                <h2>The estate store</h2>
                <p className="jl-sheet__sub">You have <b>{hud.coins}</b> coins.</p>
                {UPGRADES.map((u) => {
                  const bought = w?.estate.upgrades.find((x) => x.id === u.id)?.bought;
                  return (
                    <div key={u.id} className="jl-buy">
                      <div><b>{u.name}</b><em>{u.note}</em></div>
                      <button disabled={bought || hud.coins < u.cost} onClick={() => world.current?.buy(u.id)}>
                        {bought ? 'Yours' : `${u.cost} ◉`}
                      </button>
                    </div>
                  );
                })}
                <button className="jl-go jl-go--small" onClick={() => setShop(false)}>Back to work</button>
              </div>
            </div>
          )}

          {help && (
            <div className="jl-sheet" role="dialog" aria-label="How Jellynoor works">
              <div className="jl-sheet__card">
                <h2>How the day goes</h2>
                <div className="jl-help">
                  <div>
                    <h3>Getting about</h3>
                    <p>{coarse ? 'Thumbstick to walk, drag the screen to look round, Work to do whatever you are standing by, Hop to bounce.' : 'WASD or the arrows to walk, Shift to run, drag to look round, Q to change the camera, Space to hop. Hold E to do whatever you are standing by.'}</p>
                    <p>Hopping and landing shakes everything near you, which is half the fun and occasionally useful.</p>
                  </div>
                  <div>
                    <h3>The tea</h3>
                    <p>Empty plots take a sapling from the nursery. After that a bush wants water when it goes pale, weeding when the grass creeps in, and pruning when it grows above the table.</p>
                    <p>A pale sprig standing proud means a flush is ready. Pluck it, and the morning leaf is worth the most. When the basket is full, take it to the scale at the muster shed.</p>
                  </div>
                  <div>
                    <h3>The shed</h3>
                    <p>Green leaf is spread on the troughs to wither, rolled on the table, fired in the drier and packed into chests at twelve kilos a chest.</p>
                  </div>
                  <div>
                    <h3>Everything else</h3>
                    <p>Milk the cow, feed the hens, put the chai on and serve it, split and stack firewood, hang the washing, sweep the yard, ring the bell at dawn and light the lamps at dusk. Turn in after dark to start the next day.</p>
                  </div>
                </div>
                <button className="jl-go jl-go--small" onClick={() => setHelp(false)}>Back to work</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
