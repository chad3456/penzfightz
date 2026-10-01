import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CAST, yearLabel, type Thinker } from './cast';
import { BADGES, COMING, EPISODES, EXCUSES, type Badge, type Choice, type Episode, type Msg } from './episodes';
import { Portrait } from './Portrait';

/**
 * GLASS HOUSES · The Salon.
 *
 * A group chat with the dead. You moderate: ask, press, or throw a stone
 * (a documented fact about the thinker's own life). Every message carries a
 * badge saying whether it is on the record, attributed, paraphrased or
 * imagined. Contradictions crack the panes of each thinker's glass house;
 * tensions fog them. At the end you judge them, and then yourself.
 */

type Mark = { who: string; kind: 'crack' | 'strain'; note: string };
type Shown = Msg & { key: number; at: number };

/* ───────────── sound: a pop for messages, glass for cracks ───────────── */
class Sfx {
  ctx: AudioContext | null = null;
  on = true;
  private ensure() {
    if (!this.on) return null;
    if (!this.ctx) { const C = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext; if (!C) return null; this.ctx = new C(); }
    void this.ctx.resume();
    return this.ctx;
  }
  pop(mine = false) {
    const c = this.ensure(); if (!c) return;
    const t = c.currentTime, o = c.createOscillator(), g = c.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(mine ? 660 : 520, t); o.frequency.exponentialRampToValueAtTime(mine ? 880 : 700, t + 0.06);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.06, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
    o.connect(g).connect(c.destination); o.start(t); o.stop(t + 0.16);
  }
  crack() {
    const c = this.ensure(); if (!c) return;
    const t = c.currentTime, len = c.sampleRate * 0.5, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3) * (Math.random() < 0.02 ? 3 : 1);
    const s = c.createBufferSource(); s.buffer = buf;
    const f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 2400;
    const g = c.createGain(); g.gain.value = 0.22;
    s.connect(f).connect(g).connect(c.destination); s.start(t);
    [3100, 4200, 5300].forEach((fr, i) => { const o = c.createOscillator(), og = c.createGain(); o.frequency.value = fr; og.gain.setValueAtTime(0.03, t + i * 0.04); og.gain.exponentialRampToValueAtTime(0.0001, t + 0.4 + i * 0.05); o.connect(og).connect(c.destination); o.start(t + i * 0.04); o.stop(t + 0.6); });
  }
  whoosh() {
    const c = this.ensure(); if (!c) return;
    const t = c.currentTime, len = c.sampleRate * 0.35, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.sin((i / len) * Math.PI);
    const s = c.createBufferSource(); s.buffer = buf;
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.setValueAtTime(400, t); f.frequency.exponentialRampToValueAtTime(1800, t + 0.35);
    const g = c.createGain(); g.gain.value = 0.12;
    s.connect(f).connect(g).connect(c.destination); s.start(t);
  }
}

/* ───────────── the glass house drawing ───────────── */

function GlassHouse({ marks, size = 64, flash = false }: { marks: Mark[]; size?: number; flash?: boolean }) {
  const panes = [[18, 40], [52, 40], [18, 68], [52, 68]];
  const cracks = marks.filter((m) => m.kind === 'crack');
  const strains = marks.filter((m) => m.kind === 'strain');
  return (
    <svg className={`sa-house ${flash ? 'is-flash' : ''}`} viewBox="0 0 100 100" width={size} height={size} aria-label={`${cracks.length} cracked, ${strains.length} fogged`}>
      <path d="M8 36 L50 8 L92 36 Z" className="sa-house-roof" />
      <rect x="10" y="34" width="80" height="62" rx="3" className="sa-house-wall" />
      {panes.map(([x, y], i) => {
        const crack = i < cracks.length, fog = !crack && i < cracks.length + strains.length;
        return (
          <g key={i}>
            <rect x={x} y={y} width="30" height="24" rx="2" className="sa-pane" />
            <path d={`M${x + 3} ${y + 20} L${x + 12} ${y + 4}`} className="sa-glint" />
            {fog && <rect x={x} y={y} width="30" height="24" rx="2" className="sa-fog" />}
            {crack && <path className="sa-crackline" d={`M${x + 15} ${y + 12} L${x + 4} ${y + 3} M${x + 15} ${y + 12} L${x + 27} ${y + 6} M${x + 15} ${y + 12} L${x + 22} ${y + 23} M${x + 15} ${y + 12} L${x + 6} ${y + 20} M${x + 15} ${y + 12} L${x + 13} ${y + 1}`} />}
          </g>
        );
      })}
    </svg>
  );
}

/* ───────────── the page ───────────── */

export function Salon({ onExit }: { onExit: () => void }) {
  const [view, setView] = useState<{ kind: 'hub' } | { kind: 'chat'; ep: Episode; run: number } | { kind: 'verdict'; ep: Episode; marks: Mark[]; excuses: { who: string; excuse: string }[] }>({ kind: 'hub' });
  const sfx = useRef(new Sfx());
  const [muted, setMuted] = useState(false);
  useEffect(() => { sfx.current.on = !muted; }, [muted]);
  useEffect(() => {
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = '/fonts-guitar/fonts.css';
    document.head.appendChild(l);
    return () => l.remove();
  }, []);
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => { rootRef.current?.scrollTo({ top: 0 }); }, [view.kind]);

  return (
    <div className="sa-root" ref={rootRef}>
      {view.kind === 'hub' && <Hub onExit={onExit} onOpen={(ep) => setView({ kind: 'chat', ep, run: Date.now() })} />}
      {view.kind === 'chat' && (
        <Chat key={view.run} ep={view.ep} sfx={sfx.current} muted={muted} setMuted={setMuted}
          onBack={() => setView({ kind: 'hub' })}
          onJudge={(marks, excuses) => setView({ kind: 'verdict', ep: view.ep, marks, excuses })} />
      )}
      {view.kind === 'verdict' && (
        <Verdict ep={view.ep} marks={view.marks} excuses={view.excuses}
          onReplay={() => setView({ kind: 'chat', ep: view.ep, run: Date.now() })}
          onBack={() => setView({ kind: 'hub' })} />
      )}
    </div>
  );
}

/* ───────────── the hub ───────────── */

function Hub({ onExit, onOpen }: { onExit: () => void; onOpen: (ep: Episode) => void }) {
  const all = useMemo(() => Object.values(CAST), []);
  return (
    <div className="sa-hub">
      <header className="sa-hub-top">
        <button className="sa-ghost" onClick={onExit}>← Shelf</button>
        <span className="sa-brand">GLASS HOUSES</span>
      </header>
      <section className="sa-hero">
        <div className="sa-hero-text">
          <p className="sa-kicker">The Salon · a group chat with the dead</p>
          <h1 className="sa-h1">They wrote the rules.<br /><em>Then they lived.</em></h1>
          <p className="sa-lede">
            Fourteen philosophers, scientists and writers are added to group chats about questions they never faced: equal rights,
            same-sex marriage, machine minds. You moderate. Ask, press, or throw a stone: a documented fact from their own life. Every crack
            in a glass house is sourced.
          </p>
          <div className="sa-legend">
            {(Object.keys(BADGES) as Badge[]).map((b) => <span key={b} className={`sa-badge sa-badge--${b}`} title={BADGES[b].help}>{BADGES[b].icon} {BADGES[b].label}</span>)}
          </div>
        </div>
        <PhonePreview />
      </section>

      <div className="sa-marquee" aria-hidden>
        <div className="sa-marquee-row">{[...all, ...all].map((t, i) => <span key={i} className="sa-mq"><Portrait t={t} size={54} /><b>{t.short}</b><i>{t.dates}</i></span>)}</div>
      </div>

      <section className="sa-eps">
        <h2 className="sa-h2">Tonight&rsquo;s salons</h2>
        <div className="sa-ep-grid">
          {EPISODES.map((ep) => (
            <button key={ep.id} className="sa-ep" style={{ ['--hue' as string]: ep.hue }} onClick={() => onOpen(ep)}>
              <div className="sa-ep-cast">{ep.cast.map((id, i) => <span key={id} style={{ zIndex: 10 - i }}><Portrait t={CAST[id]!} size={58} /></span>)}</div>
              <h3>{ep.title}</h3>
              <p className="sa-ep-q">{ep.question}</p>
              <p className="sa-ep-b">{ep.blurb}</p>
              <span className="sa-ep-go">Open the chat →</span>
            </button>
          ))}
          {COMING.map((c) => (
            <div key={c.title} className="sa-ep is-soon">
              <h3>{c.title}</h3>
              <p className="sa-ep-q">{c.question}</p>
              <p className="sa-ep-b">{c.cast.join(' · ')}</p>
              <span className="sa-ep-go">Coming soon</span>
            </div>
          ))}
        </div>
      </section>

      <section className="sa-how">
        <div><h3>🪨 Stones</h3><p>A stone is a documented fact about the thinker&rsquo;s own life, set against what they wrote. Rousseau&rsquo;s book on raising children; Rousseau&rsquo;s five children at the foundling hospital.</p></div>
        <div><h3>🏠 Cracks and fog</h3><p><b>Cracked pane:</b> what they did contradicts what they preached. <b>Fogged pane:</b> a tension inside their own ideas, or a compromise their era forced on them. You decide which matters.</p></div>
        <div><h3>✦ Honest fiction</h3><p>The dead don&rsquo;t chat. Lines marked ✦ are our imagining, extrapolated from their writing. 📜 lines are their own words, with sources. Where a famous story is unreliable, we say so and leave it out.</p></div>
      </section>
      <footer className="sa-foot">A companion to <b>Glass Houses</b>, a game about the distance between what we say and what we do. Quotations are from public-domain translations, or are very short quotations for commentary.</footer>
    </div>
  );
}

function PhonePreview() {
  const lines: { who: string; text: string }[] = [
    { who: 'aristotle', text: 'Males have more teeth than females in the case of men, sheep, goats, and swine.' },
    { who: 'mill', text: 'You could have asked Mrs Aristotle to open her mouth while you counted.' },
    { who: 'aristotle', text: 'Pythias. My wife was called Pythias. I concede the point.' },
  ];
  const [n, setN] = useState(0);
  useEffect(() => { const h = window.setInterval(() => setN((k) => (k + 1) % (lines.length + 2)), 1700); return () => window.clearInterval(h); }, [lines.length]);
  return (
    <div className="sa-phone" aria-hidden>
      <div className="sa-phone-top"><span className="sa-phone-av"><Portrait t={CAST.aristotle!} size={26} /></span><b>Equal rights?</b><i>5 members</i></div>
      <div className="sa-phone-body sa-wall">
        {lines.slice(0, Math.min(n, lines.length)).map((l, i) => {
          const t = CAST[l.who]!;
          return (
            <div key={i} className="sa-row sa-in">
              <Portrait t={t} size={26} />
              <div className="sa-bubble"><b style={{ color: t.tint }}>{t.short}</b>{l.text}</div>
            </div>
          );
        })}
        {n < lines.length && <div className="sa-row"><Portrait t={CAST[lines[n]!.who]!} size={26} /><div className="sa-bubble sa-typing"><i /><i /><i /></div></div>}
      </div>
    </div>
  );
}

/* ───────────── the chat ───────────── */

function Chat({ ep, sfx, muted, setMuted, onBack, onJudge }: { ep: Episode; sfx: Sfx; muted: boolean; setMuted: (m: boolean) => void; onBack: () => void; onJudge: (m: Mark[], ex: { who: string; excuse: string }[]) => void }) {
  const [shown, setShown] = useState<Shown[]>([]);
  const [typing, setTyping] = useState<string | null>(null);
  const [nodeId, setNodeId] = useState(ep.start);
  const [visited] = useState(() => new Set<string>());
  const [taken] = useState(() => new Set<string>());
  const [queue, setQueue] = useState<Msg[]>([]);
  const [marks, setMarks] = useState<Mark[]>([]);
  const [flash, setFlash] = useState<string | null>(null);
  const [toast, setToast] = useState<Mark | null>(null);
  const [drawer, setDrawer] = useState<Shown | null>(null);
  const [fast, setFast] = useState(false);
  const [side, setSide] = useState(false);
  const [stone, setStone] = useState<{ x0: number; y0: number; x1: number; y1: number; key: number } | null>(null);
  const keyRef = useRef(0);
  const scroller = useRef<HTMLDivElement>(null);
  const houseRefs = useRef<Record<string, HTMLElement | null>>({});
  const node = ep.nodes[nodeId]!;

  // entering a node: queue its messages the first time
  useEffect(() => {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    setQueue((q) => [...q, ...node.msgs]);
  }, [nodeId, node, visited]);

  // play the queue: typing… then the message
  useEffect(() => {
    if (!queue.length) { setTyping(null); return; }
    const m = queue[0]!;
    const speaker = m.who !== 'you' && m.who !== 'system';
    const wait = (m.who === 'you' ? 250 : m.who === 'system' ? 500 : Math.min(2300, 550 + m.text.length * 16)) * (fast ? 0.3 : 1);
    if (speaker) setTyping(m.who);
    const h = window.setTimeout(() => {
      setTyping(null);
      setShown((s) => [...s, { ...m, key: keyRef.current++, at: Date.now() }]);
      setQueue((q) => q.slice(1));
      sfx.pop(m.who === 'you');
      if (m.mark) {
        const mk = m.mark;
        setMarks((ms) => [...ms, mk]);
        window.setTimeout(() => { sfx.crack(); setFlash(mk.who); setToast(mk); window.setTimeout(() => setFlash(null), 900); }, 250);
      }
    }, wait);
    return () => window.clearTimeout(h);
  }, [queue, fast, sfx]);

  useEffect(() => { if (!toast) return; const h = window.setTimeout(() => setToast(null), 4200); return () => window.clearTimeout(h); }, [toast]);
  useEffect(() => { scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' }); }, [shown.length, typing]);

  const idle = queue.length === 0 && typing === null;
  const choices = idle ? (node.choices ?? []).filter((c) => !taken.has(`${nodeId}>${c.to}`)) : [];
  const skip = () => { // reveal the rest of this node at once
    if (!queue.length) return;
    const rest = queue;
    setQueue([]); setTyping(null);
    setShown((s) => [...s, ...rest.map((m) => ({ ...m, key: keyRef.current++, at: Date.now() }))]);
    const newMarks = rest.filter((m) => m.mark).map((m) => m.mark!);
    if (newMarks.length) { setMarks((ms) => [...ms, ...newMarks]); sfx.crack(); setToast(newMarks[newMarks.length - 1]!); }
  };

  const choose = useCallback((c: Choice, ev: React.MouseEvent) => {
    taken.add(`${nodeId}>${c.to}`);
    if (c.kind === 'stone' && c.target) {
      const from = (ev.currentTarget as HTMLElement).getBoundingClientRect();
      const tgt = houseRefs.current[c.target] ?? document.querySelector(`[data-member="${c.target}"]`);
      const to = tgt?.getBoundingClientRect();
      if (to) { sfx.whoosh(); setStone({ x0: from.left + 20, y0: from.top, x1: to.left + to.width / 2, y1: to.top + to.height / 2, key: Date.now() }); window.setTimeout(() => setStone(null), 700); }
    }
    setNodeId(c.to);
  }, [nodeId, taken, sfx]);

  const goOnward = () => { if (node.onward) setNodeId(node.onward.to); };
  const marksOf = (id: string) => marks.filter((m) => m.who === id);
  const excuses = shown.filter((m) => m.excuse).map((m) => ({ who: m.who, excuse: m.excuse! }));
  const lastSeen = ep.cast.map((id) => CAST[id]!).map((t) => yearLabel(t.died));

  return (
    <div className="sa-chat" style={{ ['--hue' as string]: ep.hue }}>
      <header className="sa-chat-head">
        <button className="sa-ghost" onClick={onBack} aria-label="Back to the salon">←</button>
        <div className="sa-head-av">{ep.cast.slice(0, 3).map((id) => <Portrait key={id} t={CAST[id]!} size={34} />)}</div>
        <button className="sa-head-t" onClick={() => setSide((s) => !s)}>
          <b>{ep.group}</b>
          <span>{typing ? <em>{CAST[typing]!.short} is typing…</em> : <>{ep.cast.map((id) => CAST[id]!.short).join(', ')} · last seen {lastSeen[0]}–{lastSeen[lastSeen.length - 1]}</>}</span>
        </button>
        <div className="sa-head-tools">
          <button className={`sa-tool ${fast ? 'is-on' : ''}`} onClick={() => setFast((f) => !f)} title="Speed up typing">⏩</button>
          <button className="sa-tool" onClick={() => setMuted(!muted)} title={muted ? 'Sound on' : 'Mute'}>{muted ? '🔇' : '🔊'}</button>
          <button className="sa-tool sa-tool--houses" onClick={() => setSide((s) => !s)} title="Glass houses">🏠</button>
        </div>
      </header>

      <div className="sa-strip" aria-label="Members">
        {ep.cast.map((id) => {
          const t = CAST[id]!, n = marksOf(id).length;
          return <span key={id} data-member={id} className={`sa-strip-m ${flash === id ? 'is-flash' : ''}`}><Portrait t={t} size={38} cracked={marksOf(id).filter((m) => m.kind === 'crack').length} speaking={typing === id} />{n > 0 && <i>{n}</i>}</span>;
        })}
      </div>

      <div className="sa-body">
        <div className="sa-scroll sa-wall" ref={scroller} onClick={skip}>
          <div className="sa-q-card"><span>Tonight&rsquo;s question</span>{ep.question}</div>
          {shown.map((m, i) => <Bubble key={m.key} m={m} prev={shown[i - 1]} all={shown} onBadge={() => setDrawer(m)} />)}
          {typing && <div className="sa-row sa-in"><Portrait t={CAST[typing]!} size={34} speaking /><div className="sa-bubble sa-typing"><i /><i /><i /></div></div>}
          <div className="sa-spacer" />
        </div>
        <aside className={`sa-side ${side ? 'is-open' : ''}`}>
          <h4>Glass houses</h4>
          {ep.cast.map((id) => {
            const t = CAST[id]!, ms = marksOf(id);
            return (
              <div key={id} className={`sa-member ${flash === id ? 'is-flash' : ''}`} ref={(el) => { houseRefs.current[id] = el; }}>
                <div className="sa-member-top">
                  <Portrait t={t} size={40} speaking={typing === id} />
                  <div><b>{t.name}</b><span>{t.dates} · {t.from}</span></div>
                  <GlassHouse marks={ms} size={44} flash={flash === id} />
                </div>
                <p className="sa-face">“{t.face}”</p>
                {ms.map((mk, k) => <p key={k} className={`sa-mk sa-mk--${mk.kind}`}>{mk.kind === 'crack' ? '⚡ Crack' : '🌫 Fog'}: {mk.note}</p>)}
              </div>
            );
          })}
          <button className="sa-side-close" onClick={() => setSide(false)}>Close</button>
        </aside>
      </div>

      <footer className="sa-composer">
        {!idle && <button className="sa-skip" onClick={skip}>Skip ahead ›</button>}
        {idle && !node.end && (
          <div className="sa-choices">
            {choices.map((c) => (
              <button key={c.to} className={`sa-choice sa-choice--${c.kind}`} onClick={(e) => choose(c, e)}>
                <span className="sa-choice-k">{c.kind === 'stone' ? '🪨 Throw a stone' : c.kind === 'press' ? '🔎 Press' : '💬 Ask'}</span>
                {c.label}
              </button>
            ))}
            {node.onward && <button className="sa-choice sa-choice--on" onClick={goOnward}>{node.onward.label} →</button>}
          </div>
        )}
        {idle && node.end && <button className="sa-judge" onClick={() => onJudge(marks, excuses)}>Judge the glass houses →</button>}
        <div className="sa-input"><span>Only the cards may speak tonight</span><i>➤</i></div>
      </footer>

      {stone && <div key={stone.key} className="sa-stone" style={{ ['--x0' as string]: `${stone.x0}px`, ['--y0' as string]: `${stone.y0}px`, ['--x1' as string]: `${stone.x1}px`, ['--y1' as string]: `${stone.y1}px` }}>🪨</div>}
      {toast && (
        <div className={`sa-toast sa-toast--${toast.kind}`} role="status">
          <GlassHouse marks={[toast]} size={40} />
          <div><b>{toast.kind === 'crack' ? `A crack in ${CAST[toast.who]!.short}’s house` : `${CAST[toast.who]!.short}’s glass fogs`}</b><span>{toast.note}</span></div>
        </div>
      )}
      {drawer && <SourceDrawer m={drawer} onClose={() => setDrawer(null)} />}
    </div>
  );
}

function Bubble({ m, prev, all, onBadge }: { m: Shown; prev?: Shown; all: Shown[]; onBadge: () => void }) {
  if (m.who === 'system' && !m.badge) return <div className="sa-sys">{m.text}</div>;
  if (m.who === 'system') {
    return (
      <div className="sa-evidence">
        <button className="sa-badge sa-badge--fact" onClick={(e) => { e.stopPropagation(); onBadge(); }}>{BADGES.fact.icon} {BADGES.fact.label}{m.src ? ` · ${m.src}` : ''}</button>
        <p>{m.text}</p>
      </div>
    );
  }
  const mine = m.who === 'you';
  const t = mine ? null : CAST[m.who]!;
  const grouped = prev && prev.who === m.who;
  const quoted = m.re ? all.find((x) => x.id === m.re) : null;
  return (
    <div className={`sa-row ${mine ? 'sa-out' : 'sa-in'} ${grouped ? 'is-grouped' : ''}`}>
      {!mine && (grouped ? <span className="sa-av-gap" /> : <Portrait t={t!} size={34} />)}
      <div className={`sa-bubble ${m.badge === 'imagined' ? 'is-imagined' : ''} ${m.badge === 'record' ? 'is-record' : ''}`}>
        {!mine && !grouped && <b className="sa-name" style={{ ['--tint' as string]: t!.tint }}>{t!.short} <i>{t!.dates}</i></b>}
        {quoted && <span className="sa-quote"><b className="sa-name" style={{ ['--tint' as string]: quoted.who === 'you' ? 'currentColor' : CAST[quoted.who]?.tint }}>{quoted.who === 'you' ? 'You' : CAST[quoted.who]?.short}</b>{quoted.text.length > 90 ? `${quoted.text.slice(0, 90)}…` : quoted.text}</span>}
        <span className="sa-text">{m.text}</span>
        <span className="sa-meta">
          {m.badge && <button className={`sa-badge sa-badge--${m.badge}`} onClick={(e) => { e.stopPropagation(); onBadge(); }}>{BADGES[m.badge].icon} {BADGES[m.badge].label}</button>}
          {m.excuse && <span className="sa-excuse" title={EXCUSES[m.excuse]}>Excuse: {m.excuse}</span>}
          <time>{mine ? 'now' : ''}{mine && ' ✓✓'}</time>
        </span>
        {m.react && <span className="sa-reacts">{m.react.map(([who, e], i) => <span key={i} title={CAST[who]?.short} style={{ animationDelay: `${0.4 + i * 0.25}s` }}>{e}</span>)}</span>}
      </div>
    </div>
  );
}

function SourceDrawer({ m, onClose }: { m: Shown; onClose: () => void }) {
  const b = m.badge ? BADGES[m.badge] : null;
  const t = CAST[m.who];
  return (
    <div className="sa-drawer-wrap" onClick={onClose}>
      <div className="sa-drawer" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Source">
        <div className="sa-drawer-h">{t && <Portrait t={t} size={44} />}<div><b>{t ? t.name : 'Narrator'}</b><span>{t ? `${t.dates} · ${t.from}` : 'documented fact'}</span></div><button className="sa-ghost" onClick={onClose}>×</button></div>
        {b && <p className={`sa-badge sa-badge--${m.badge}`}>{b.icon} {b.label}</p>}
        <blockquote>{m.text}</blockquote>
        {b && <p className="sa-drawer-help">{b.help}</p>}
        {m.src && <p className="sa-drawer-src"><b>Source:</b> {m.src}</p>}
        {m.excuse && <p className="sa-drawer-src"><b>Excuse used:</b> {m.excuse}. {EXCUSES[m.excuse]} <i>(after Albert Bandura&rsquo;s mechanisms of moral disengagement)</i></p>}
      </div>
    </div>
  );
}

/* ───────────── the verdict ───────────── */

const VOTES = [
  { id: 'consistent', label: 'Consistent', icon: '🏛' },
  { id: 'era', label: 'Of their time', icon: '⏳' },
  { id: 'hypocrite', label: 'Hypocrite', icon: '🪨' },
] as const;

function Verdict({ ep, marks, excuses, onReplay, onBack }: { ep: Episode; marks: Mark[]; excuses: { who: string; excuse: string }[]; onReplay: () => void; onBack: () => void }) {
  const [votes, setVotes] = useState<Record<string, string>>({});
  const done = ep.cast.every((id) => votes[id]);
  const storeKey = `salon-mirror-${ep.id}`;
  const [mine, setMine] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem(storeKey) ?? '["","",""]'); } catch { return ['', '', '']; } });
  const save = (i: number, v: string) => { const n = [...mine]; n[i] = v; setMine(n); try { localStorage.setItem(storeKey, JSON.stringify(n)); } catch { /* private mode */ } };
  const unseen = ep.cast.filter((id) => !marks.some((m) => m.who === id));
  return (
    <div className="sa-verdict" style={{ ['--hue' as string]: ep.hue }}>
      <header className="sa-v-head">
        <button className="sa-ghost" onClick={onBack}>← The salon</button>
        <p className="sa-kicker">{ep.title} · the verdict</p>
        <h1 className="sa-h1 sa-h1--s">Who held up?</h1>
        <p className="sa-lede">Each house below shows what you uncovered. {unseen.length > 0 && <>You didn&rsquo;t throw at everyone; replay to find {unseen.map((id) => CAST[id]!.short).join(', ')}&rsquo;s cracks.</>}</p>
      </header>
      <div className="sa-v-grid">
        {ep.cast.map((id) => {
          const t: Thinker = CAST[id]!, ms = marks.filter((m) => m.who === id), ex = excuses.filter((e) => e.who === id);
          return (
            <article key={id} className="sa-v-card">
              <div className="sa-v-top">
                <Portrait t={t} size={84} cracked={ms.filter((m) => m.kind === 'crack').length} />
                <GlassHouse marks={ms} size={76} />
              </div>
              <h3>{t.name}</h3>
              <p className="sa-v-dates">{t.dates} · {t.from}</p>
              <p className="sa-face">“{t.face}”</p>
              {ms.length === 0 && <p className="sa-muted">No cracks found this time.</p>}
              {ms.map((m, k) => <p key={k} className={`sa-mk sa-mk--${m.kind}`}>{m.kind === 'crack' ? '⚡ Crack' : '🌫 Fog'}: {m.note}</p>)}
              {ex.map((e, k) => <p key={k} className="sa-v-ex" title={EXCUSES[e.excuse]}>Reached for: <b>{e.excuse}</b></p>)}
              <div className="sa-votes" role="radiogroup" aria-label={`Your verdict on ${t.short}`}>
                {VOTES.map((v) => <button key={v.id} role="radio" aria-checked={votes[id] === v.id} className={votes[id] === v.id ? 'is-on' : ''} onClick={() => setVotes((s) => ({ ...s, [id]: v.id }))}>{v.icon} {v.label}</button>)}
              </div>
            </article>
          );
        })}
      </div>

      {done && (
        <section className="sa-mirror">
          <h2 className="sa-h2">Now, your glass house</h2>
          <p className="sa-lede">
            You judged {ep.cast.length} people by the standards of 2026. In two hundred years, someone will do the same to you.
            Answer privately; this stays on your device and is never sent anywhere.
          </p>
          {[
            'Which of your current views do you think 2226 will find embarrassing?',
            'Where does what you say you value differ from what you actually do?',
            'Which excuse did you recognise from your own life?',
          ].map((q, i) => (
            <label key={i} className="sa-mirror-q"><span>{q}</span><textarea value={mine[i] ?? ''} onChange={(e) => save(i, e.target.value)} rows={2} placeholder="Only you will see this." /></label>
          ))}
          <div className="sa-v-tally">
            {VOTES.map((v) => <span key={v.id}>{v.icon} {v.label}: <b>{ep.cast.filter((id) => votes[id] === v.id).length}</b></span>)}
          </div>
        </section>
      )}

      <section className="sa-sources">
        <h2 className="sa-h2">Sources for this salon</h2>
        <ul>{ep.sources.map((s, i) => <li key={i}>{s}</li>)}</ul>
        <p className="sa-muted">✦ Imagined lines are dramatisation: extrapolated from what each person wrote, never presented as their words.</p>
      </section>
      <div className="sa-v-actions">
        <button className="sa-btn" onClick={onReplay}>Replay with different questions</button>
        <button className="sa-btn sa-btn--ghost" onClick={onBack}>Choose another salon</button>
      </div>
    </div>
  );
}
