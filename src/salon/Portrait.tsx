import { useId } from 'react';
import type { Look, Thinker } from './cast';

/**
 * A small engraved bust, drawn from a thinker's recipe: head, hair, beard,
 * hat or turban, coat and collar, with a hatch texture over it all so the
 * whole cast looks like plates from the same old book.
 */

const darker = (hex: string, k = 0.25) => {
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number) => Math.max(0, Math.round(v * (1 - k)));
  return `rgb(${f(n >> 16)}, ${f((n >> 8) & 255)}, ${f(n & 255)})`;
};

function Hair({ l, back }: { l: Look; back: boolean }) {
  const c = l.hairColor, s = darker(c, 0.35);
  const curls = (cx: number, cy: number, r: number, from: number, to: number, n: number, rr: number) =>
    Array.from({ length: n }, (_, i) => { const a = (from + ((to - from) * i) / (n - 1)) * (Math.PI / 180); return <circle key={i} cx={cx + Math.cos(a) * r} cy={cy + Math.sin(a) * r} r={rr} fill={c} stroke={s} strokeWidth="0.6" />; });
  if (back) {
    switch (l.hair) {
      case 'long': return <path d="M31 42 Q29 18 50 17 Q71 18 69 42 L71 70 Q66 74 62 66 L61 46 L39 46 L38 66 Q34 74 29 70 Z" fill={c} stroke={s} strokeWidth="0.7" />;
      case 'bigwig': return <g>{curls(50, 44, 24, 170, 370, 16, 7.5)}{curls(50, 60, 22, 140, 220, 4, 7)}{curls(50, 60, 22, 320, 400, 4, 7)}</g>;
      case 'ringlets': return <g>{[0, 1, 2, 3].map((i) => <g key={i}><circle cx={31 - i * 0.5} cy={46 + i * 6} r="3.6" fill={c} stroke={s} strokeWidth="0.6" /><circle cx={69 + i * 0.5} cy={46 + i * 6} r="3.6" fill={c} stroke={s} strokeWidth="0.6" /></g>)}</g>;
      case 'wig': return <path d="M44 60 Q50 72 56 60 L54 74 Q50 78 46 74 Z" fill={c} stroke={s} strokeWidth="0.6" />;
      case 'curly': return null;
      default: return null;
    }
  }
  switch (l.hair) {
    case 'bald': return <g><ellipse cx="34" cy="44" rx="3.2" ry="6" fill={c} /><ellipse cx="66" cy="44" rx="3.2" ry="6" fill={c} /></g>;
    case 'short': return <path d="M33 41 Q33 21 50 20 Q67 21 67 41 Q61 29 50 29 Q39 29 33 41 Z" fill={c} stroke={s} strokeWidth="0.7" />;
    case 'side': return <path d="M33 43 Q31 21 50 20 Q69 21 67 41 Q63 28 47 29.5 Q38 31 33 43 Z" fill={c} stroke={s} strokeWidth="0.7" />;
    case 'slick': return <g><path d="M33 41 Q32 19 52 19 Q69 21 67 38 Q60 26 49 26.5 Q39 28 33 41 Z" fill={c} stroke={s} strokeWidth="0.7" /><path d="M40 25 Q50 21 60 24" stroke="#fff" strokeOpacity="0.35" strokeWidth="1" fill="none" /></g>;
    case 'curly': return <g>{curls(50, 40, 18, 185, 355, 11, 5.2)}</g>;
    case 'long': return <path d="M33 41 Q33 21 50 20 Q67 21 67 41 Q60 30 50 30 Q40 30 33 41 Z" fill={c} stroke={s} strokeWidth="0.7" />;
    case 'wig': return <g><path d="M32 42 Q32 20 50 19.5 Q68 20 68 42 Q62 29 50 29 Q38 29 32 42 Z" fill={c} stroke={s} strokeWidth="0.7" />{[44, 50].map((y) => <g key={y}><ellipse cx="31" cy={y} rx="4.5" ry="2.8" fill={c} stroke={s} strokeWidth="0.6" /><ellipse cx="69" cy={y} rx="4.5" ry="2.8" fill={c} stroke={s} strokeWidth="0.6" /></g>)}</g>;
    case 'bigwig': return <path d="M33 40 Q34 23 50 22 Q66 23 67 40 Q60 31 50 31 Q40 31 33 40 Z" fill={c} stroke={s} strokeWidth="0.7" />;
    case 'ringlets': return <g><path d="M33 44 Q31 21 50 20 Q69 21 67 44 Q62 30 51 28 L50 33 L49 28 Q38 30 33 44 Z" fill={c} stroke={s} strokeWidth="0.7" /><circle cx="50" cy="19" r="5" fill={c} stroke={s} strokeWidth="0.6" /></g>;
    case 'center': return <path d="M32 50 Q29 20 50 20 Q71 20 68 50 Q66 40 64 34 Q58 27 50.5 28.5 L50 32 L49.5 28.5 Q42 27 36 34 Q34 40 32 50 Z" fill={c} stroke={s} strokeWidth="0.7" />;
    default: return null;
  }
}

function Beard({ l }: { l: Look }) {
  if (!l.beard) return null;
  const c = l.beardColor ?? l.hairColor, s = darker(c, 0.35);
  switch (l.beard) {
    case 'full': return <path d="M34 47 Q35 67 50 70 Q65 67 66 47 Q62 58 56 58 Q50 55.5 44 58 Q38 58 34 47 Z" fill={c} stroke={s} strokeWidth="0.6" />;
    case 'long': return <path d="M34 47 Q34 74 50 84 Q66 74 66 47 Q62 58 56 58 Q50 55.5 44 58 Q38 58 34 47 Z" fill={c} stroke={s} strokeWidth="0.6" />;
    case 'goatee': return <g><path d="M43 55 Q50 52 57 55 Q50 54.5 43 55 Z" fill={c} stroke={s} strokeWidth="1.2" /><path d="M47 60 Q50 68 53 60 Z" fill={c} stroke={s} strokeWidth="0.6" /></g>;
    case 'mustache': return <path d="M43 55 Q50 51.5 57 55 Q50 54 43 55 Z" fill={c} stroke={s} strokeWidth="1.4" />;
    case 'sideburns': return <g><path d="M33.5 40 L33 56 Q36 60 38 56 L37 42 Z" fill={c} /><path d="M66.5 40 L67 56 Q64 60 62 56 L63 42 Z" fill={c} /></g>;
  }
}

function Dress({ l }: { l: Look }) {
  const c = l.dressColor, s = darker(c, 0.3);
  const shoulders = 'M10 100 C 12 79, 28 70, 50 70 C 72 70, 88 79, 90 100 Z';
  return (
    <g>
      <path d={shoulders} fill={c} stroke={s} strokeWidth="0.8" />
      {l.dress === 'toga' && <path d="M26 74 Q48 84 70 100 M20 82 Q40 88 56 100" stroke={s} strokeWidth="1.1" fill="none" />}
      {l.dress === 'robe' && <path d="M24 75 Q46 80 62 100 M74 76 Q60 84 54 100" stroke={s} strokeWidth="1.2" fill="none" />}
      {l.dress === 'trench' && <g><path d="M36 71 L44 88 L50 74 L56 88 L64 71" fill={darker(c, 0.12)} stroke={s} strokeWidth="0.8" /><path d="M33 70 L40 62 L45 70 M67 70 L60 62 L55 70" fill={c} stroke={s} strokeWidth="0.8" /></g>}
      {(l.dress === 'coat' || l.dress === 'tweed') && <path d="M38 71 L46 92 L50 76 L54 92 L62 71" fill={darker(c, 0.15)} stroke={s} strokeWidth="0.8" />}
      {l.dress === 'tweed' && <path d="M18 88 L82 88 M22 80 L78 80" stroke={s} strokeOpacity="0.4" strokeWidth="0.6" strokeDasharray="1.5 1.5" />}
      {l.dress === 'gown' && <path d="M36 72 Q50 84 64 72" fill={l.skin} stroke={s} strokeWidth="0.8" />}
      {l.collar === 'cravat' && <path d="M44 67 Q50 75 56 67 L55 73 Q50 82 45 73 Z" fill="#f5f2ea" stroke="#bdb6a6" strokeWidth="0.6" />}
      {l.collar === 'fichu' && <path d="M34 72 Q50 90 66 72 Q60 82 50 84 Q40 82 34 72 Z" fill="#f5f2ea" stroke="#bdb6a6" strokeWidth="0.6" />}
      {l.collar === 'tie' && <g><path d="M45 69 L50 80 L55 69 Z" fill="#f5f2ea" /><path d="M49 72 L51 72 L52.5 86 L50 90 L47.5 86 Z" fill="#5a2a2a" /></g>}
      {l.collar === 'band' && <path d="M35 70 L65 70 L61 79 L39 79 Z" fill="#f5f2ea" stroke="#bdb6a6" strokeWidth="0.6" />}
      {l.extra === 'flower' && <g transform="translate(66 84)"><circle r="3" fill="#7cc46a" /><circle r="1.4" cx="1" cy="-1" fill="#a9df8f" /></g>}
    </g>
  );
}

export function Portrait({ t, size = 48, speaking = false, cracked = 0, className = '' }: { t: Thinker; size?: number; speaking?: boolean; cracked?: number; className?: string }) {
  const uid = useId().replace(/:/g, '');
  const l = t.look;
  const skinS = darker(l.skin, 0.28);
  return (
    <svg className={`sa-portrait ${speaking ? 'is-speaking' : ''} ${className}`} viewBox="0 0 100 100" width={size} height={size} role="img" aria-label={t.name}>
      <defs>
        <clipPath id={`c${uid}`}><circle cx="50" cy="50" r="49" /></clipPath>
        <pattern id={`h${uid}`} width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><line x1="0" y1="0" x2="0" y2="3" stroke="#000" strokeWidth="0.55" /></pattern>
        <radialGradient id={`g${uid}`} cx="0.35" cy="0.3" r="0.9"><stop offset="0" stopColor="#fff" stopOpacity="0.55" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient>
      </defs>
      <g clipPath={`url(#c${uid})`}>
        <rect width="100" height="100" fill={t.tint} />
        <rect width="100" height="100" fill={`url(#g${uid})`} />
        <Hair l={l} back />
        <rect x="43" y="56" width="14" height="16" rx="3" fill={l.skin} stroke={skinS} strokeWidth="0.6" />
        <Dress l={l} />
        <ellipse cx="50" cy="44" rx="16.5" ry="20.5" fill={l.skin} stroke={skinS} strokeWidth="0.8" />
        <ellipse cx="33.5" cy="46" rx="2.6" ry="4" fill={l.skin} stroke={skinS} strokeWidth="0.6" />
        <ellipse cx="66.5" cy="46" rx="2.6" ry="4" fill={l.skin} stroke={skinS} strokeWidth="0.6" />
        {/* the face */}
        <path d="M40 38.5 Q43.5 36.5 46.5 38.5 M53.5 38.5 Q56.5 36.5 60 38.5" stroke={darker(l.hairColor === '#ecebe6' || l.hairColor === '#ecebe4' || l.hairColor === '#e8e4dc' || l.hairColor === '#d8d2c6' ? '#9a8f84' : l.hairColor, 0.1)} strokeWidth="1.3" fill="none" strokeLinecap="round" />
        <ellipse cx="43.5" cy="43" rx="1.7" ry="1.9" fill="#1e1712" />
        <ellipse cx="56.5" cy="43" rx="1.7" ry="1.9" fill="#1e1712" />
        <path d="M50 44 Q48.2 50 48.5 51.5 Q50 52.6 51.8 51.6" stroke={skinS} strokeWidth="1" fill="none" strokeLinecap="round" />
        <ellipse className="sa-mouth" cx="50" cy="57" rx="3.6" ry="0.9" fill="#6e3b33" />
        <Hair l={l} back={false} />
        <Beard l={l} />
        {l.head === 'turban' && (
          <g>
            <path d="M31 41 Q29 17 50 15 Q71 17 69 41 Q61 31 50 32 Q39 31 31 41 Z" fill={l.headColor} stroke={darker(l.headColor ?? '#e2862f', 0.3)} strokeWidth="0.8" />
            <path d="M33 34 Q50 22 67 33 M34 28 Q50 18 66 27" stroke={darker(l.headColor ?? '#e2862f', 0.3)} strokeWidth="1" fill="none" />
          </g>
        )}
        {l.head === 'hat' && (
          <g fill={l.headColor} stroke={darker(l.headColor ?? '#333', 0.3)} strokeWidth="0.8">
            <path d="M36 27 L38 10 Q50 6 62 10 L64 27 Z" />
            <ellipse cx="50" cy="27" rx="22" ry="4" />
          </g>
        )}
        {l.extra === 'cigarette' && (
          <g>
            <line x1="54" y1="58" x2="64" y2="61" stroke="#f3efe6" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="64.4" cy="61.1" r="1" fill="#ff7b39" />
            <path className="sa-smoke" d="M65 59 Q63 53 67 49 Q70 45 67 40" stroke="#fff" strokeOpacity="0.55" strokeWidth="1.1" fill="none" />
          </g>
        )}
        <rect width="100" height="100" fill={`url(#h${uid})`} opacity="0.09" />
        {cracked > 0 && (
          <g className="sa-pcrack" stroke="#fff" strokeWidth="1.2" fill="none" strokeLinecap="round">
            <path d="M70 12 L60 30 L66 38 L54 58" />
            {cracked > 1 && <path d="M20 70 L34 62 L38 74 L50 70" />}
            {cracked > 2 && <path d="M80 72 L70 66 L72 54" />}
          </g>
        )}
      </g>
      <circle cx="50" cy="50" r="49" fill="none" stroke="rgba(0,0,0,0.18)" strokeWidth="1.5" />
    </svg>
  );
}
