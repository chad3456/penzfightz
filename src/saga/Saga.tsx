/**
 * Ramayana: a scroll-down, anime-styled descent through seven chapters.
 * Scroll drives the parallax (each chapter exposes its progress as --p);
 * every chapter also has one thing to do with your hands: break the bow,
 * unmask the deer, charge the leap, float the stones, find the navel,
 * release the lanterns. All artwork is drawn here in SVG.
 */
import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent as RPE, type ReactNode } from 'react';
import './saga.css';

const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const css = (o: Record<string, string | number>) => o as CSSProperties;
const par = (y: number, x = 0) => css({ transform: `translate(calc(var(--p) * ${x}px), calc(var(--p) * ${y}px))` });
const rnd = (i: number, s = 1) => { const x = Math.sin(i * 127.1 * s + 311.7) * 43758.5453; return x - Math.floor(x); };

const CHAPTERS = [
  { kanji: '序', jp: 'ラーマーヤナ', kanda: '', title: 'Ramayana' },
  { kanji: '弓', jp: '第一章', kanda: 'बालकाण्ड', title: 'The Bow of Shiva' },
  { kanji: '森', jp: '第二章', kanda: 'अयोध्याकाण्ड', title: 'Fourteen Years' },
  { kanji: '鹿', jp: '第三章', kanda: 'अरण्यकाण्ड', title: 'The Golden Deer' },
  { kanji: '跳', jp: '第四章', kanda: 'सुन्दरकाण्ड', title: 'The Leap' },
  { kanji: '橋', jp: '第五章', kanda: 'युद्धकाण्ड', title: 'The Bridge of Stones' },
  { kanji: '戦', jp: '第六章', kanda: 'युद्धकाण्ड', title: 'Ten Heads' },
  { kanji: '灯', jp: '終章', kanda: 'उत्तरकाण्ड', title: 'The Lamps' },
];

function Chapter({ i, a, b, pt, children, text, hint, tall = 220, onMove }: { i: number; a: string; b: string; pt: boolean; children: ReactNode; text: ReactNode; hint?: string; tall?: number; onMove?: (e: RPE<HTMLElement>) => void }) {
  const c = CHAPTERS[i];
  return (
    <section className="rm-ch" data-i={i} style={css({ '--a': a, '--b': b, height: `${tall}vh` })} onPointerMove={onMove}>
      <div className="rm-stage">
        <svg className="rm-art" viewBox={pt ? '400 0 800 900' : '0 0 1600 900'} preserveAspectRatio={pt ? 'xMidYMid meet' : 'xMidYMid slice'}>
          <rect x="-3000" y="-3000" width="7600" height="3002" fill={a} />
          <rect x="-3000" y="898" width="7600" height="3000" fill={b} />
          {children}
        </svg>
        {i > 0 && (
          <>
            <div className="rm-vert" aria-hidden="true"><b>{c.kanji}</b><span>{c.jp}</span></div>
            <div className="rm-card">
              <p className="rm-kanda">{c.kanda} · {String(i).padStart(2, '0')}</p>
              <h2>{c.title}</h2>
              <div className="rm-text">{text}</div>
              {hint && <p className="rm-hint">{hint}</p>}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

/** A cel-shaded silhouette: head, robe, optional crown and bow. */
function Fig({ x, y, s = 1, fill, crown, bow, hair }: { x: number; y: number; s?: number; fill: string; crown?: boolean; bow?: boolean; hair?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {hair && <path d="M-16 -118 q-14 40 -6 78 h12 z" fill={fill} />}
      <circle cx="0" cy="-120" r="17" fill={fill} />
      {crown && <path d="M-14 -134 l5 -22 l9 12 l9 -12 l5 22 z" fill="#f6c453" />}
      <path d="M-16 -100 q16 -10 32 0 l12 100 h-56 z" fill={fill} />
      {bow && <><path d="M26 -150 q46 60 0 130" fill="none" stroke="#f6c453" strokeWidth="5" strokeLinecap="round" /><line x1="26" y1="-150" x2="26" y2="-20" stroke="#fff7" strokeWidth="1.5" /></>}
    </g>
  );
}

const Sky = ({ id, stops }: { id: string; stops: [number, string][] }) => (
  <>
    <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1">{stops.map(([o, c]) => <stop key={o} offset={o} stopColor={c} />)}</linearGradient></defs>
    <rect x="-3000" y="0" width="7600" height="900" fill={`url(#${id})`} />
  </>
);
const Trees = ({ n, y, h, fill, seed, k }: { n: number; y: number; h: number; fill: string; seed: number; k: number }) => (
  <g style={par(k)}>
    {Array.from({ length: n }, (_, i) => { const x = -200 + (i / n) * 2000 + rnd(i, seed) * 60, hh = h * (0.7 + rnd(i + 9, seed) * 0.6); return <g key={i}><rect x={x - 7} y={y - hh * 0.4} width="14" height={hh * 0.4 + 300} fill={fill} /><path d={`M${x} ${y - hh} l${hh * 0.32} ${hh * 0.62} h${-hh * 0.64} z`} fill={fill} /><path d={`M${x} ${y - hh * 0.75} l${hh * 0.4} ${hh * 0.7} h${-hh * 0.8} z`} fill={fill} /></g>; })}
  </g>
);

/* ------------------------------------------------------------------ 0 */
function Opening({ pt }: { pt: boolean }) {
  return (
    <Chapter i={0} a="#1b1140" b="#f6a57a" pt={pt} tall={180} text={null}>
      <Sky id="s0" stops={[[0, '#1b1140'], [0.45, '#7a2f73'], [0.75, '#f0637a'], [1, '#f6a57a']]} />
      <g style={par(-120)}>{Array.from({ length: 70 }, (_, i) => <circle key={i} cx={rnd(i) * 2200 - 300} cy={rnd(i, 2) * 420} r={rnd(i, 3) * 2 + 0.6} fill="#fff" opacity={0.3 + rnd(i, 4) * 0.7} className="rm-twinkle" style={{ animationDelay: `${rnd(i, 5) * 4}s` }} />)}</g>
      <g style={par(160)}><circle cx="800" cy="520" r="230" fill="#ffd9a0" /><circle cx="800" cy="520" r="290" fill="#ffd9a0" opacity=".18" /><circle cx="800" cy="520" r="360" fill="#ffd9a0" opacity=".08" /></g>
      <path d="M-400 900 L-400 640 L120 420 L420 620 L700 380 L980 640 L1240 440 L1700 660 L2000 520 L2000 900 Z" fill="#5b2a6e" style={par(60)} />
      <path d="M-400 900 L-400 740 L200 560 L520 720 L860 540 L1180 730 L1500 580 L2000 740 L2000 900 Z" fill="#3a1b55" style={par(20)} />
      <g fill="#fff" opacity=".85">
        {[[380, 300, 1], [1180, 240, 1.2], [700, 190, 0.8]].map(([x, y, s], i) => <g key={i} style={par(0, i % 2 ? 700 : -700)}><g transform={`translate(${x} ${y}) scale(${s})`}><ellipse rx="170" ry="36" /><ellipse cx="-70" cy="-22" rx="80" ry="34" /><ellipse cx="60" cy="-30" rx="100" ry="44" /></g></g>)}
      </g>
      <foreignObject x="400" y="210" width="800" height="520" style={css({ opacity: 'calc(1 - var(--p) * 2.2)', transform: 'translateY(calc(var(--p) * -160px))' })}>
        <div className="rm-title">
          <p className="rm-title__jp">ラーマーヤナ</p>
          <h1>RAMAYANA</h1>
          <p className="rm-title__sub">रामायण · the journey of Rama, in seven descents</p>
          <p className="rm-title__cue">Scroll down <i>↓</i></p>
        </div>
      </foreignObject>
    </Chapter>
  );
}

/* ------------------------------------------------------------------ 1 */
function Bow({ pt }: { pt: boolean }) {
  const [pull, setPull] = useState(0);
  const [snapped, setSnapped] = useState(false);
  const start = useRef<number | null>(null);
  const down = (e: RPE<SVGCircleElement>) => { if (snapped) return; e.currentTarget.setPointerCapture(e.pointerId); start.current = e.clientX - pull * 170; };
  const move = (e: RPE<SVGCircleElement>) => { if (start.current == null || snapped) return; const v = clamp((e.clientX - start.current) / 170); setPull(v); if (v >= 1) { setSnapped(true); start.current = null; } };
  const up = () => { start.current = null; if (!snapped) setPull(0); };
  const bx = 760 - pull * 90;
  return (
    <Chapter i={1} a="#2a1a4a" b="#3b1d2e" pt={pt} hint={snapped ? undefined : 'Drag the glowing string to the right.'}
      text={snapped ? <p><b>The bow breaks like thunder.</b> Sita places the garland on Rama. Mithila erupts; two kingdoms are joined.</p> : <p>In Mithila, King Janaka sets a test for his daughter Sita’s hand: string the great bow of Shiva. Kings arrive, strain, and cannot even lift it. Then a prince of Ayodhya steps forward.</p>}>
      <Sky id="s1" stops={[[0, '#2a1a4a'], [0.6, '#7d3a5c'], [1, '#3b1d2e']]} />
      <g style={par(-40)} fill="#1c1030">{[440, 620, 980, 1160].map((x) => <g key={x}><rect x={x - 28} y="80" width="56" height="700" /><rect x={x - 44} y="60" width="88" height="34" /></g>)}<path d="M380 80 Q800 -60 1220 80 v-200 h-840z" /></g>
      <rect x="-3000" y="760" width="7600" height="140" fill="#3b1d2e" /><path d="M300 760 h1000 l160 140 h-1320z" fill="#5a2a44" />
      <g className={snapped ? 'rm-flash' : ''}><rect x="-3000" y="-3000" width="7600" height="6900" fill="#fff" opacity="0" /></g>
      <g className={snapped ? 'rm-shake' : ''}>
        {!snapped ? (
          <>
            <path d={`M800 190 Q${bx - 240} 450 800 710`} fill="none" stroke="#f6c453" strokeWidth="22" strokeLinecap="round" />
            <path d={`M800 190 Q${bx - 240} 450 800 710`} fill="none" stroke="#8a4b12" strokeWidth="6" strokeLinecap="round" strokeDasharray="4 40" />
            <path d={`M800 190 L${800 + pull * 200} 450 L800 710`} fill="none" stroke="#bff" strokeWidth="3" className="rm-glow" />
            <circle cx={800 + pull * 200} cy="450" r="26" className="rm-handle" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} />
          </>
        ) : (
          <>
            <path d="M800 190 Q560 330 640 450" fill="none" stroke="#f6c453" strokeWidth="22" strokeLinecap="round" className="rm-half rm-half--a" />
            <path d="M640 450 Q560 580 800 710" fill="none" stroke="#f6c453" strokeWidth="22" strokeLinecap="round" className="rm-half rm-half--b" />
            {Array.from({ length: 26 }, (_, i) => <line key={i} x1="700" y1="450" x2={700 + Math.cos(i * 0.242) * 900} y2={450 + Math.sin(i * 0.242) * 900} stroke="#fff" strokeWidth={1 + rnd(i) * 3} className="rm-burst" />)}
          </>
        )}
        <Fig x={980} y={770} s={1.5} fill="#11081f" crown bow={false} />
        {snapped && <Fig x={1080} y={770} s={1.35} fill="#d94f70" hair />}
      </g>
    </Chapter>
  );
}

/* ------------------------------------------------------------------ 2 */
function Forest({ pt }: { pt: boolean }) {
  const move = useCallback((e: RPE<HTMLElement>) => { const r = e.currentTarget.getBoundingClientRect(); e.currentTarget.style.setProperty('--mx', String((e.clientX / r.width) * 2 - 1)); e.currentTarget.style.setProperty('--my', String((e.clientY / window.innerHeight) * 2 - 1)); }, []);
  return (
    <Chapter i={2} a="#06232e" b="#04141a" pt={pt} onMove={move} hint="Move through the dark: the fireflies follow you. Scroll to count the years."
      text={<p>On the eve of his crowning, a promise made long ago by his father sends Rama into the forest for fourteen years. He goes without anger. Sita will not stay behind, and neither will his brother Lakshmana.</p>}>
      <Sky id="s2" stops={[[0, '#06232e'], [0.55, '#0f4a4f'], [1, '#04141a']]} />
      <g style={par(90)}><circle cx="1050" cy="230" r="120" fill="#e9fff1" /><circle cx="1050" cy="230" r="170" fill="#e9fff1" opacity=".12" /></g>
      <Trees n={16} y={700} h={380} fill="#0c3b3f" seed={1} k={-30} />
      <Trees n={12} y={780} h={520} fill="#082a2e" seed={2} k={-80} />
      <rect x="-3000" y="800" width="7600" height="100" fill="#04141a" />
      <g style={css({ transform: 'translateX(calc(var(--p) * 420px - 210px))' })}><Fig x={720} y={812} s={0.95} fill="#02090c" bow /><Fig x={800} y={812} s={0.85} fill="#02090c" hair /><Fig x={880} y={812} s={0.95} fill="#02090c" bow /></g>
      <Trees n={7} y={900} h={760} fill="#020d10" seed={3} k={-170} />
      <g>{Array.from({ length: 30 }, (_, i) => <circle key={i} cx={420 + rnd(i) * 760} cy={200 + rnd(i, 2) * 560} r={2.5 + rnd(i, 3) * 3} fill="#e8ff8a" className="rm-fly" style={css({ animationDelay: `${rnd(i, 4) * 3}s`, transform: `translate(calc(var(--mx, 0) * ${40 + rnd(i, 5) * 160}px), calc(var(--my, 0) * ${30 + rnd(i, 6) * 120}px))` })} />)}</g>
      <g transform="translate(456 96)">{Array.from({ length: 14 }, (_, i) => <g key={i} transform={`translate(${i * 50} 0)`}><circle r="15" fill="none" stroke="#e9fff1" strokeOpacity=".35" strokeWidth="1.5" /><circle r="15" fill="#e9fff1" style={css({ opacity: `clamp(0, calc(var(--p) * 15.5 - ${i}), 1)` })} /></g>)}</g>
    </Chapter>
  );
}

/* ------------------------------------------------------------------ 3 */
function Deer({ pt }: { pt: boolean }) {
  const [seen, setSeen] = useState(false);
  return (
    <Chapter i={3} a="#3a1640" b="#170a1c" pt={pt} hint={seen ? 'Keep scrolling: the line is drawn, and a shadow rises.' : 'Tap the golden deer.'}
      text={seen ? <p><b>It was never a deer.</b> It is Maricha, a demon in disguise, sent to lure Rama away. Lakshmana draws a line of protection around the hut and leaves. When Sita steps across it to give alms, Ravana, king of Lanka, carries her off.</p> : <p>In the thirteenth year a deer of living gold wanders past the hut at Panchavati. Sita has never seen anything so beautiful. Rama takes his bow and follows it into the trees.</p>}>
      <Sky id="s3" stops={[[0, '#3a1640'], [0.5, '#a33b5e'], [0.8, '#f08a5d'], [1, '#170a1c']]} />
      <g style={css({ transform: 'translateY(calc((1 - var(--p)) * 720px))' })} fill="#0a0410">
        <path d="M920 900 L950 520 Q1030 430 1110 520 L1140 900z" />
        {Array.from({ length: 10 }, (_, i) => { const t = (i - 4.5) / 4.5, x = 1030 + t * 180, y = 420 + t * t * 90; return <g key={i}><circle cx={x} cy={y} r="27" /><path d={`M${x - 16} ${y - 20} l6 -22 l10 12 l10 -12 l6 22z`} /><circle cx={x - 8} cy={y} r="3" fill="#ff3b3b" /><circle cx={x + 8} cy={y} r="3" fill="#ff3b3b" /></g>; })}
      </g>
      <Trees n={10} y={760} h={460} fill="#1f0d26" seed={5} k={-60} />
      <rect x="-3000" y="780" width="7600" height="120" fill="#170a1c" />
      <g fill="#0f0613"><path d="M470 780 v-90 l80 -70 l80 70 v90z" /><rect x="530" y="730" width="34" height="50" fill="#f6c453" opacity=".8" /></g>
      <Fig x={600} y={790} s={0.8} fill="#d94f70" hair />
      <ellipse cx="560" cy="800" rx="170" ry="26" fill="none" stroke="#7df9ff" strokeWidth="4" pathLength={1} strokeDasharray="1" className="rm-glow" style={css({ strokeDashoffset: 'clamp(0, calc(1 - var(--p) * 1.7), 1)' })} />
      <g transform="translate(900 700)" onClick={() => setSeen(true)} style={{ cursor: 'pointer' }} className={seen ? 'rm-glitch' : 'rm-bob'}>
        <circle r="120" fill={seen ? '#ff3b3b' : '#f6c453'} opacity=".14" />
        {seen ? (
          <g fill="#0a0410"><path d="M-60 80 Q-90 -40 0 -70 Q90 -40 60 80z" /><path d="M-50 -40 l-30 -70 l44 44z M50 -40 l30 -70 l-44 44z" /><path d="M-30 -10 l22 8 l-22 8z M30 -10 l-22 8 l22 8z" fill="#ff3b3b" /><path d="M-26 40 h52 l-8 14 l-9 -10 l-9 10 l-9 -10 l-9 10z" fill="#fff" /></g>
        ) : (
          <g fill="#f6c453" stroke="#fff3c4" strokeWidth="2"><ellipse cx="0" cy="10" rx="64" ry="28" /><path d="M46 0 l26 -62 l16 6 l-16 70z" /><ellipse cx="86" cy="-64" rx="20" ry="13" /><path d="M-44 28 l-6 62 M-20 34 l0 58 M26 34 l4 58 M48 28 l10 62" fill="none" strokeWidth="7" stroke="#f6c453" strokeLinecap="round" /><path d="M80 -76 l-8 -40 l-14 -6 m14 6 l12 -16 M94 -74 l12 -38 l16 -4 m-16 4 l-6 -18" fill="none" strokeWidth="4" stroke="#fff3c4" strokeLinecap="round" /><circle cx="92" cy="-66" r="2.5" fill="#170a1c" stroke="none" />{[0, 1, 2, 3, 4].map((i) => <circle key={i} cx={-30 + i * 16} cy={4 + (i % 2) * 8} r="3" fill="#fff" stroke="none" />)}</g>
        )}
      </g>
    </Chapter>
  );
}

/* ------------------------------------------------------------------ 4 */
function Leap({ pt }: { pt: boolean }) {
  const [charge, setCharge] = useState(0);
  const [phase, setPhase] = useState<'wait' | 'air' | 'land'>('wait');
  const timer = useRef<number | null>(null);
  const stop = () => { if (timer.current) { clearInterval(timer.current); timer.current = null; } };
  const hold = () => { if (phase !== 'wait' || timer.current) return; timer.current = window.setInterval(() => setCharge((c) => { const n = c + 0.03; if (n >= 1) { stop(); setPhase('air'); window.setTimeout(() => setPhase('land'), 1900); return 1; } return n; }), 30); };
  const release = () => { stop(); if (phase === 'wait') setCharge(0); };
  useEffect(() => stop, []);
  return (
    <Chapter i={4} a="#0b2a5c" b="#06183a" pt={pt} hint={phase === 'wait' ? 'Press and hold Hanuman until he is ready.' : undefined}
      text={phase === 'land' ? <p><b>He lands in Lanka.</b> Hanuman finds Sita in the Ashoka grove and gives her Rama’s ring. Caught, his tail is set alight; he leaps from roof to roof and the golden city burns.</p> : <p>The search reaches the southern shore. Lanka lies a hundred yojanas across the sea. Hanuman, son of the wind, had forgotten his own strength, until Jambavan reminded him. He grows as tall as a mountain.</p>}>
      <Sky id="s4" stops={[[0, '#0b2a5c'], [0.5, '#3f7fc4'], [0.72, '#9fd8f0'], [1, '#06183a']]} />
      <g style={par(60)} fill="#fff" opacity=".9">{[[560, 190, 1], [1000, 130, 1.3], [1300, 260, 0.8], [200, 240, 1]].map(([x, y, s], i) => <g key={i} transform={`translate(${x} ${y}) scale(${s})`}><ellipse rx="150" ry="30" /><ellipse cx="-50" cy="-24" rx="70" ry="36" /><ellipse cx="50" cy="-34" rx="90" ry="48" /></g>)}</g>
      <g fill="#1d1230" transform="translate(-90 0)"><path d="M1040 660 l30 -110 l40 20 l20 -70 l50 30 l30 -40 l60 170z" />{phase === 'land' && [1080, 1130, 1180, 1220].map((x, i) => <path key={x} d={`M${x} ${610 - i * 12} q-18 -40 0 -70 q18 30 0 70z`} fill="#ff8a2a" className="rm-flame" style={{ animationDelay: `${i * 0.13}s` }} />)}</g>
      {[0, 1, 2].map((k) => <path key={k} d={`M-400 ${660 + k * 60} ${Array.from({ length: 30 }, () => `q40 ${k % 2 ? 22 : -22} 80 0`).join(' ')} V900 H-400z`} fill={['#2b6cb0', '#1e4f8f', '#12356b'][k]} className="rm-wave" style={{ animationDelay: `${-k * 1.3}s` }} />)}
      <path d="M-400 900 V640 H420 l90 60 l-30 200z" fill="#101a33" />
      <g className={phase === 'air' ? 'rm-leap-x' : ''} style={phase === 'land' ? { transform: 'translateX(560px)' } : undefined}>
        <g className={phase === 'air' ? 'rm-leap-y' : ''}>
          <g transform={`translate(470 640) scale(${phase === 'wait' ? 1 + charge * 0.7 : 1.2})`} onPointerDown={hold} onPointerUp={release} onPointerLeave={release} onPointerCancel={release} style={{ cursor: 'pointer', touchAction: 'none' }}>
            <circle cy="-70" r="130" fill="#ffb347" opacity={0.08 + charge * 0.25} />
            <path d="M-20 -30 q-70 -10 -60 -80 q4 -30 30 -24" fill="none" stroke="#e8743b" strokeWidth="10" strokeLinecap="round" />
            <path d="M-22 0 q-6 -70 22 -86 q28 16 22 86z" fill="#e8743b" /><circle cy="-104" r="20" fill="#e8743b" /><path d="M-12 -120 l4 -16 l8 9 l8 -9 l4 16z" fill="#f6c453" />
            <path d="M22 -70 l40 -34" stroke="#f6c453" strokeWidth="7" strokeLinecap="round" /><circle cx="68" cy="-110" r="13" fill="#f6c453" />
            {phase === 'wait' && <circle cy="-70" r="96" fill="none" stroke="#fff" strokeWidth="5" pathLength={1} strokeDasharray={`${charge} 1`} transform="rotate(-90 0 -70)" />}
          </g>
        </g>
      </g>
      {phase === 'air' && Array.from({ length: 16 }, (_, i) => <line key={i} x1="-200" x2="1800" y1={120 + i * 40} y2={120 + i * 40} stroke="#fff" strokeWidth={1 + rnd(i) * 3} className="rm-speed" style={{ animationDelay: `${rnd(i, 2) * 0.5}s` }} />)}
    </Chapter>
  );
}

/* ------------------------------------------------------------------ 5 */
function Bridge({ pt }: { pt: boolean }) {
  const N = 8;
  const [n, setN] = useState(0);
  return (
    <Chapter i={5} a="#123a5a" b="#071a2c" pt={pt} hint={n < N ? `Tap the sea to set a stone (${n}/${N}).` : undefined}
      text={n >= N ? <p><b>The sea is crossed.</b> In five days the bridge reaches Lanka, and the army of bears and monkeys walks over the water behind Rama.</p> : <p>An ocean lies between Rama and Sita. The vanara army hauls rocks and whole hills to the shore. The builders Nala and Nila write Rama’s name on each stone, and the stones do not sink.</p>}>
      <Sky id="s5" stops={[[0, '#123a5a'], [0.5, '#e0965a'], [0.66, '#f7d08a'], [1, '#071a2c']]} />
      <g style={par(80)}><circle cx="800" cy="560" r="150" fill="#fff3c4" /></g>
      <path d="M1010 620 l40 -80 l50 30 l40 -60 l70 110z" fill="#1d1230" />
      <g onClick={() => setN((v) => Math.min(N, v + 1))} style={{ cursor: n < N ? 'pointer' : 'default' }}>
        {[0, 1, 2].map((k) => <path key={k} d={`M-400 ${620 + k * 70} ${Array.from({ length: 30 }, () => `q40 ${k % 2 ? 20 : -20} 80 0`).join(' ')} V900 H-400z`} fill={['#1f6f8f', '#15506e', '#0b3350'][k]} className="rm-wave" style={{ animationDelay: `${-k * 1.1}s` }} />)}
      </g>
      <path d="M-400 900 V600 H440 l60 50 l-20 250z" fill="#0d1626" /><path d="M2000 900 V620 H1160 l-50 40 l20 240z" fill="#0d1626" />
      <rect x="400" y="520" width="800" height="380" fill="transparent" onClick={() => setN((v) => Math.min(N, v + 1))} style={{ cursor: n < N ? 'pointer' : 'default' }} />
      {Array.from({ length: n }, (_, i) => (
        <g key={i} transform={`translate(${500 + i * 86} 640)`}><g className="rm-drop"><g className="rm-float" style={{ animationDelay: `${i * 0.3}s` }}><rect x="-40" y="-20" width="80" height="44" rx="16" fill="#8a8f9c" stroke="#d6d9e0" strokeWidth="2" /><text y="12" textAnchor="middle" className="rm-ram">राम</text></g></g></g>
      ))}
      {n >= N && <g className="rm-march">{Array.from({ length: 9 }, (_, i) => <g key={i} transform={`translate(${-i * 46} 0)`}><circle cx="430" cy="588" r="9" fill="#e8743b" /><path d="M422 598 h16 l4 22 h-24z" fill="#e8743b" /></g>)}<Fig x={480} y={622} s={0.55} fill="#11081f" crown bow /></g>}
    </Chapter>
  );
}

/* ------------------------------------------------------------------ 6 */
function Battle({ pt }: { pt: boolean }) {
  const [down, setDown] = useState<boolean[]>(() => Array(10).fill(false));
  const [strikes, setStrikes] = useState(0);
  const [shot, setShot] = useState<{ k: number; x: number; y: number } | null>(null);
  const [fallen, setFallen] = useState(false);
  const heads = Array.from({ length: 10 }, (_, i) => { const t = (i - 4.5) / 4.5; return { x: 950 + t * 200, y: 300 + t * t * 80 }; });
  const strike = (i: number) => { if (fallen || down[i]) return; setDown((d) => d.map((v, j) => (j === i ? true : v))); setStrikes((s) => s + 1); setShot({ k: Date.now(), ...heads[i] }); window.setTimeout(() => setDown((d) => d.map((v, j) => (j === i ? false : v))), 1300); };
  const hintOn = strikes >= 3 && !fallen;
  return (
    <Chapter i={6} a="#3d0a12" b="#12040a" pt={pt} hint={fallen ? undefined : hintOn ? 'Vibhishana whispers: “The nectar is in his navel.”' : 'Tap Ravana’s heads.'}
      text={fallen ? <p><b>Ravana falls.</b> The ten-headed king, master of the Vedas and undone by his pride, lies on the field. Rama orders him the funeral rites of a great king. Sita is free.</p> : <p>For days the armies meet before the gates of Lanka. Rama cuts off Ravana’s heads, and each one grows back. In later tellings it is Ravana’s own brother Vibhishana who reveals the secret.</p>}>
      <Sky id="s6" stops={[[0, '#3d0a12'], [0.5, '#b3261e'], [0.8, '#f08a2a'], [1, '#12040a']]} />
      <g className="rm-spin" style={css({ transformOrigin: '800px 450px' })}>{Array.from({ length: 40 }, (_, i) => <path key={i} d={`M800 450 L${800 + Math.cos(i * 0.157) * 1900} ${450 + Math.sin(i * 0.157) * 1900} L${800 + Math.cos(i * 0.157 + 0.03 + rnd(i) * 0.05) * 1900} ${450 + Math.sin(i * 0.157 + 0.03 + rnd(i) * 0.05) * 1900}z`} fill="#fff" opacity={0.05 + rnd(i, 2) * 0.1} />)}</g>
      <rect x="-3000" y="790" width="7600" height="110" fill="#12040a" />
      <g className={fallen ? 'rm-fall' : ''} style={css({ transformOrigin: '950px 800px' })}>
        <path d="M820 800 L860 420 Q950 340 1040 420 L1080 800z" fill="#12040a" />
        <path d="M860 470 l-110 90 l20 22 l100 -60z M1040 470 l110 90 l-20 22 l-100 -60z" fill="#12040a" />
        {heads.map((h, i) => (
          <g key={i} onClick={() => strike(i)} style={{ cursor: 'pointer', opacity: down[i] ? 0 : 1, transition: 'opacity .25s' }}>
            <circle cx={h.x} cy={h.y} r="34" fill="transparent" /><circle cx={h.x} cy={h.y} r="27" fill="#12040a" stroke="#f08a2a" strokeWidth="2" /><path d={`M${h.x - 16} ${h.y - 20} l6 -24 l10 13 l10 -13 l6 24z`} fill="#f6c453" /><path d={`M${h.x - 13} ${h.y - 3} l10 4 l-10 4z M${h.x + 13} ${h.y - 3} l-10 4 l10 4z`} fill="#ff3b3b" />
          </g>
        ))}
        <circle cx="950" cy="610" r={hintOn ? 22 : 8} fill={hintOn ? '#fff3c4' : '#3d0a12'} className={hintOn ? 'rm-pulse' : ''} onClick={() => { if (hintOn) { setShot({ k: Date.now(), x: 950, y: 610 }); setFallen(true); } }} style={{ cursor: hintOn ? 'pointer' : 'default' }} />
      </g>
      <Fig x={500} y={800} s={1.1} fill="#0a0410" crown bow />
      {shot && <line key={shot.k} x1="530" y1="700" x2={shot.x} y2={shot.y} stroke="#fff3c4" strokeWidth="5" strokeLinecap="round" className="rm-arrow" />}
      {fallen && <g className="rm-flash"><rect x="-3000" y="-3000" width="7600" height="6900" fill="#fff" opacity="0" /></g>}
    </Chapter>
  );
}

/* ------------------------------------------------------------------ 7 */
function Lamps({ pt, onTop }: { pt: boolean; onTop: () => void }) {
  const [lanterns, setLanterns] = useState<{ k: number; x: number; y: number }[]>([]);
  const tap = (e: RPE<SVGRectElement>) => { const svg = e.currentTarget.ownerSVGElement!; const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; const q = p.matrixTransform(svg.getScreenCTM()!.inverse()); setLanterns((l) => [...l.slice(-40), { k: Date.now() + Math.random(), x: q.x, y: q.y }]); };
  return (
    <Chapter i={7} a="#070b24" b="#0a0616" pt={pt} hint="Tap the sky to release a lantern."
      text={<><p>The fourteen years end. Rama, Sita and Lakshmana fly home in the Pushpaka chariot. It is a moonless night, so the people of Ayodhya set a lamp in every doorway to guide them in.</p><p>The lamps have been lit every year since. <button className="rm-top" onClick={onTop}>Return to the sky ↑</button></p></>}>
      <Sky id="s7" stops={[[0, '#070b24'], [0.6, '#1c1648'], [0.85, '#4a2060'], [1, '#0a0616']]} />
      <g style={par(-60)}>{Array.from({ length: 80 }, (_, i) => <circle key={i} cx={rnd(i) * 2200 - 300} cy={rnd(i, 2) * 520} r={rnd(i, 3) * 1.8 + 0.5} fill="#fff" className="rm-twinkle" style={{ animationDelay: `${rnd(i, 5) * 4}s` }} />)}</g>
      <rect x="-3000" y="0" width="7600" height="900" fill="transparent" onPointerDown={tap} style={{ cursor: 'pointer' }} />
      {lanterns.map((l) => <g key={l.k} transform={`translate(${l.x} ${l.y})`} pointerEvents="none"><g className="rm-lantern"><path d="M-14 -22 h28 l6 34 h-40z" fill="#ffb347" /><circle r="34" fill="#ffb347" opacity=".25" /><rect x="-6" y="12" width="12" height="5" fill="#7a3b12" /></g></g>)}
      <g fill="#0a0616" pointerEvents="none">
        <path d="M380 800 V560 h60 v-70 q50 -90 100 0 v70 h80 V440 q90 -150 180 0 v120 h80 v-70 q50 -90 100 0 v70 h60 v240z" /><path d="M-3000 900 V760 h7600 v140z" />
        {[470, 800, 1130].map((x) => <path key={x} d={`M${x} ${x === 800 ? 330 : 440} v-50 l22 10 l-22 10`} stroke="#f6c453" strokeWidth="3" fill="#f6c453" />)}
      </g>
      <g pointerEvents="none">{Array.from({ length: 44 }, (_, i) => { const row = i % 4, x = 410 + ((i * 53) % 780), y = 770 + row * 34 - (row === 0 ? 216 : 0), yy = row === 0 ? 556 : y; return <g key={i} transform={`translate(${x} ${yy})`} style={css({ opacity: `clamp(0.08, calc(var(--p) * 60 - ${i}), 1)` })}><path d="M-9 0 q9 9 18 0z" fill="#b5651d" /><path d="M0 -2 q-6 -10 0 -19 q6 9 0 19z" fill="#ffd166" className="rm-flame" style={{ animationDelay: `${rnd(i) * 0.8}s` }} /><circle cy="-8" r="15" fill="#ffd166" opacity=".22" /></g>; })}</g>
    </Chapter>
  );
}

/* ------------------------------------------------------------------ page */
export default function Saga() {
  const root = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [pt, setPt] = useState(() => typeof window !== 'undefined' && window.innerWidth / window.innerHeight < 0.9);
  useEffect(() => {
    const el = root.current!; let raf = 0;
    const update = () => {
      raf = 0; const vh = window.innerHeight; let cur = 0;
      el.querySelectorAll<HTMLElement>('.rm-ch').forEach((s, i) => { const r = s.getBoundingClientRect(); s.style.setProperty('--p', clamp(-r.top / Math.max(1, r.height - vh)).toFixed(4)); if (r.top < vh * 0.5) cur = i; });
      setActive(cur); el.style.setProperty('--all', clamp(el.scrollTop / Math.max(1, el.scrollHeight - vh)).toFixed(4));
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(update); };
    const rs = () => { setPt(window.innerWidth / window.innerHeight < 0.9); on(); };
    el.addEventListener('scroll', on, { passive: true }); window.addEventListener('resize', rs); update();
    return () => { el.removeEventListener('scroll', on); window.removeEventListener('resize', rs); if (raf) cancelAnimationFrame(raf); };
  }, []);
  const go = (i: number) => { const s = root.current?.querySelectorAll<HTMLElement>('.rm-ch')[i]; if (s) root.current!.scrollTo({ top: s.offsetTop + (i ? window.innerHeight * 0.25 : 0), behavior: 'smooth' }); };
  return (
    <div className="rm" ref={root}>
      <div className="rm-petals" aria-hidden="true">{Array.from({ length: 16 }, (_, i) => <i key={i} style={css({ left: `${rnd(i) * 100}%`, animationDuration: `${9 + rnd(i, 2) * 9}s`, animationDelay: `${-rnd(i, 3) * 18}s`, '--s': 0.6 + rnd(i, 4) })} />)}</div>
      <nav className="rm-rail" aria-label="Chapters">
        {CHAPTERS.map((c, i) => <button key={i} aria-current={active === i ? 'step' : undefined} onClick={() => go(i)} title={c.title}><b>{c.kanji}</b></button>)}
      </nav>
      <div className="rm-bar" aria-hidden="true" />
      <Opening pt={pt} /><Bow pt={pt} /><Forest pt={pt} /><Deer pt={pt} /><Leap pt={pt} /><Bridge pt={pt} /><Battle pt={pt} /><Lamps pt={pt} onTop={() => go(0)} />
    </div>
  );
}
