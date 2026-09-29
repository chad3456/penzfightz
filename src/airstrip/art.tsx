import type { ReactNode } from 'react';
import type { ToolId } from './sim';

/**
 * The card illustrations and tool icons, in one line: round heads, dot eyes,
 * bodies like beans, a steady black stroke, cream paper, and red kept for
 * the Party alone.
 */

const S = { stroke: '#161616', strokeWidth: 3, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: '#fbfaf5' };
const RED = '#c8312a';
const YEL = '#f2d44a';

/** A citizen. (x, y) is where the feet are; s is the scale. */
export function Person({ x, y, s = 1, look = 'ahead', arms = 'down', fill = '#fbfaf5', eyes = true, cap = false, scarf = false, dotted = false, flip = false }: {
  x: number; y: number; s?: number; look?: 'ahead' | 'up' | 'down'; arms?: 'down' | 'up' | 'phone' | 'point'; fill?: string; eyes?: boolean; cap?: boolean; scarf?: boolean; dotted?: boolean; flip?: boolean;
}) {
  const d = dotted ? { strokeDasharray: '3 5' } : {};
  const hy = look === 'up' ? -62 : look === 'down' ? -54 : -58;
  const hx = look === 'down' ? 3 : 0;
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`} {...S} {...d}>
      <path d="M-13 0 C-17 -18 -17 -34 -9 -40 C-4 -44 4 -44 9 -40 C17 -34 17 -18 13 0 Z" fill={fill} />
      <path d="M-6 0 L-6 -10 M6 0 L6 -10" fill="none" />
      {arms === 'up' && <path d="M-11 -34 L-20 -54 M11 -34 L20 -54" fill="none" />}
      {arms === 'point' && <path d="M11 -32 L28 -40" fill="none" />}
      {arms === 'phone' && <><path d="M-9 -30 L-2 -26 M9 -30 L2 -26" fill="none" /><rect x="-4" y="-30" width="8" height="10" rx="1.5" fill="#161616" /></>}
      <circle cx={hx} cy={hy} r="13" fill={fill} />
      {cap && <path d={`M${hx - 13} ${hy - 4} Q${hx} ${hy - 20} ${hx + 13} ${hy - 4} L${hx + 17} ${hy - 3} Z`} fill="#3a3936" />}
      {scarf && <path d="M-9 -38 L9 -38 L4 -30 Z" fill={RED} />}
      {eyes && look !== 'up' && <><circle cx={hx - 4} cy={hy + 1} r="1.6" fill="#161616" stroke="none" /><circle cx={hx + 4} cy={hy + 1} r="1.6" fill="#161616" stroke="none" /></>}
      {eyes && look === 'up' && <><circle cx={hx - 4} cy={hy - 4} r="1.6" fill="#161616" stroke="none" /><circle cx={hx + 4} cy={hy - 4} r="1.6" fill="#161616" stroke="none" /></>}
    </g>
  );
}

function BigBrother({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} {...S}>
      <rect x="-70" y="-90" width="140" height="170" rx="6" fill="#fbfaf5" />
      <path d="M-58 80 Q-54 44 -26 38 L26 38 Q54 44 58 80" fill="#fbfaf5" />
      <ellipse cx="0" cy="-8" rx="32" ry="40" fill="#fbfaf5" />
      <path d="M-33 -22 Q-30 -58 0 -54 Q30 -58 33 -22 Q20 -40 0 -38 Q-20 -40 -33 -22 Z" fill="#161616" />
      <path d="M-20 -14 L-6 -12 M20 -14 L6 -12" />
      <circle cx="-12" cy="-5" r="2.6" fill="#161616" /><circle cx="12" cy="-5" r="2.6" fill="#161616" />
      <path d="M0 -8 L-3 8 L3 9" fill="none" />
      <path d="M-15 16 Q-7 8 0 13 Q7 8 15 16 Q0 20 -15 16 Z" fill="#161616" />
      <rect x="-70" y="62" width="140" height="18" fill="#161616" />
    </g>
  );
}

function Van({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} {...S}>
      <path d="M-60 0 L-60 -46 L20 -46 L20 0 Z" fill="#2a2a2a" />
      <path d="M20 0 L20 -34 L44 -34 L56 -18 L56 0 Z" fill="#2a2a2a" />
      <path d="M26 -30 L42 -30 L50 -19 L26 -19 Z" fill="#fbfaf5" />
      <circle cx="-40" cy="2" r="9" fill="#fbfaf5" /><circle cx="36" cy="2" r="9" fill="#fbfaf5" />
    </g>
  );
}

function Screen({ x, y, s = 1, children }: { x: number; y: number; s?: number; children?: ReactNode }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} {...S}>
      <rect x="-40" y="-30" width="80" height="56" rx="6" fill="#fbfaf5" />
      <rect x="-32" y="-23" width="64" height="42" rx="3" fill="#e9ede9" />
      {children}
    </g>
  );
}

function Eye({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${s})`} {...S}><ellipse cx="0" cy="0" rx="18" ry="9" fill="#fbfaf5" /><circle cx="0" cy="0" r="5" fill="#161616" /></g>;
}

function Frame({ children }: { children: ReactNode }) {
  return <svg viewBox="0 0 440 260" className="as-illo" role="img">{children}</svg>;
}

/* ───────────── the five cards ───────────── */

export function IlloQuota() {
  const people = [70, 110, 150, 290, 330, 370, 95, 135, 305, 345];
  return (
    <Frame>
      <BigBrother x={220} y={105} s={0.95} />
      {people.map((x, i) => {
        const y = i < 6 ? 236 : 208;
        return <Person key={i} x={x} y={y} s={0.9} look={i === 4 ? 'up' : 'down'} arms={i % 3 === 0 ? 'up' : 'down'} fill={i === 4 ? YEL : undefined} cap={i % 4 === 1} />;
      })}
      {[[84, 150], [122, 128], [300, 140], [352, 118], [180, 190], [262, 176]].map(([x, y], i) => (
        <g key={i} {...S}><ellipse cx={x} cy={y} rx="6" ry="4" fill="#fbfaf5" /><path d={`M${x} ${y + 10} l0 8`} strokeDasharray="2 3" /></g>
      ))}
      <ellipse cx="196" cy="150" rx="6" ry="4" fill={RED} stroke="#161616" strokeWidth="2.5" />
    </Frame>
  );
}

export function IlloDistract() {
  return (
    <Frame>
      <Screen x={220} y={62} s={1.3}><path d="M-8 -6 A10 12 0 1 0 8 -6 A10 12 0 1 0 -8 -6" fill="none" /><path d="M-4 8 L0 18 L4 8 Z" fill="#161616" /><circle cx="-4" cy="-3" r="1.5" fill="#161616" /><circle cx="4" cy="-3" r="1.5" fill="#161616" /></Screen>
      <path d="M220 104 L220 118" {...S} />
      {Array.from({ length: 12 }, (_, i) => {
        const row = i < 6 ? 0 : 1;
        const x = 70 + (i % 6) * 60 + (row ? 30 : 0);
        return <Person key={i} x={x} y={row ? 246 : 206} s={0.95} look="up" arms="up" eyes />;
      })}
      <text x="66" y="130" className="as-shout">HATE!</text>
      <text x="318" y="126" className="as-shout">HATE!</text>
    </Frame>
  );
}

export function IlloWatchers() {
  return (
    <Frame>
      <g {...S}><path d="M90 240 L90 110" /><rect x="52" y="70" width="76" height="52" rx="6" fill="#fbfaf5" /></g>
      <Eye x={90} y={96} s={1} />
      <path d="M220 240 L220 150 M200 240 L240 240" {...S} />
      <g {...S}><path d="M190 150 L250 150 L240 128 L200 128 Z" fill="#fbfaf5" /><path d="M200 128 L240 128 L230 108 L210 108 Z" fill="#fbfaf5" /><path d="M210 108 L230 108 L220 90 Z" fill="#fbfaf5" /></g>
      <g {...S}><rect x="310" y="200" width="70" height="40" fill="#fbfaf5" /><path d="M318 190 L372 190 L380 200 L310 200 Z" fill={RED} /></g>
      <Person x={150} y={240} s={0.8} scarf arms="point" />
      <Person x={270} y={240} s={0.8} scarf arms="point" flip />
      <Person x={210} y={250} s={0.9} look="up" fill={YEL} />
    </Frame>
  );
}

export function IlloPolice() {
  return (
    <Frame>
      <Van x={140} y={232} s={1.2} />
      <Person x={300} y={236} s={1.1} dotted eyes={false} />
      <Person x={362} y={236} s={0.9} look="down" fill="#d6dbe4" />
      <Person x={250} y={236} s={0.9} look="down" fill="#d6dbe4" flip />
      <text x="286" y="150" className="as-shout" style={{ fill: '#8a8a8a' }}>?</text>
    </Frame>
  );
}

export function IlloYear({ month = 'APRIL' }: { month?: string }) {
  return (
    <Frame>
      <g {...S}><rect x="140" y="34" width="160" height="150" rx="8" fill="#fbfaf5" /><rect x="140" y="34" width="160" height="36" rx="8" fill={RED} /></g>
      <text x="220" y="60" textAnchor="middle" className="as-cal-m">{month}</text>
      <text x="220" y="140" textAnchor="middle" className="as-cal-y">1984</text>
      <text x="220" y="170" textAnchor="middle" className="as-cal-s">WAR IS PEACE</text>
      {[60, 100, 340, 380].map((x, i) => <Person key={x} x={x} y={244} s={0.9} look="down" arms="phone" cap={i === 1} />)}
      <Person x={220} y={250} s={0.95} look="up" fill={YEL} />
    </Frame>
  );
}

export function IlloLost() {
  return (
    <Frame>
      <BigBrother x={220} y={96} s={0.8} />
      {Array.from({ length: 11 }, (_, i) => <Person key={i} x={40 + i * 36} y={i % 2 ? 250 : 222} s={0.9} look="up" fill={YEL} />)}
    </Frame>
  );
}

export function IlloRoom101() {
  return (
    <Frame>
      <g {...S}><path d="M150 240 L150 160 L210 160 L210 240 M140 200 L220 200" fill="none" /><rect x="236" y="120" width="44" height="80" rx="4" fill="#fbfaf5" /><circle cx="258" cy="148" r="14" fill="#fbfaf5" /><path d="M258 148 L266 140" /></g>
      <Person x={180} y={200} s={1} look="ahead" />
      {/* four fingers, held up */}
      <g {...S} transform="translate(350 170)"><path d="M-22 60 L-22 10 Q-22 0 -14 0 L14 0 Q22 0 22 10 L22 60 Z" fill="#fbfaf5" />{[-16, -5, 6, 17].map((x) => <rect key={x} x={x - 4} y={-40} width="9" height="44" rx="4.5" fill="#fbfaf5" />)}<path d="M-22 22 Q-38 16 -34 4" fill="#fbfaf5" /></g>
    </Frame>
  );
}

export function IlloCafe() {
  return (
    <Frame>
      <BigBrother x={330} y={100} s={0.7} />
      <g {...S}><path d="M60 180 L200 180 M80 180 L80 240 M180 180 L180 240" fill="none" /><path d="M150 160 L160 180 L140 180 Z" fill="#fbfaf5" /><rect x="100" y="160" width="12" height="20" fill="#fbfaf5" /></g>
      <Person x={230} y={244} s={1.05} look="up" />
      <text x="228" y="150" className="as-shout" style={{ fill: RED }}>♥</text>
    </Frame>
  );
}

/* ───────────── tool icons ───────────── */

export function ToolIcon({ id }: { id: ToolId }) {
  const inner = (() => {
    switch (id) {
      case 'hate': return <><rect x="8" y="12" width="32" height="24" rx="3" fill="#fbfaf5" /><circle cx="24" cy="22" r="6" fill="none" /><path d="M22 29 L24 33 L26 29" fill="#161616" /></>;
      case 'gin': return <path d="M20 8 L28 8 L28 16 Q36 20 36 27 L36 40 L12 40 L12 27 Q12 20 20 16 Z" fill="#fbfaf5" />;
      case 'lottery': return <><rect x="8" y="14" width="32" height="22" rx="3" fill="#fbfaf5" /><path d="M14 22 L34 22 M14 28 L28 28" /></>;
      case 'rally': return <><path d="M14 40 L14 8 M34 40 L34 8" /><path d="M14 10 L28 14 L14 18 Z M34 10 L20 14 L34 18 Z" fill={RED} /></>;
      case 'telescreen': return <><path d="M24 40 L24 26" /><rect x="8" y="8" width="32" height="20" rx="3" fill="#fbfaf5" /><ellipse cx="24" cy="18" rx="8" ry="4.5" fill="#fbfaf5" /><circle cx="24" cy="18" r="2.5" fill="#161616" /></>;
      case 'spies': return <><circle cx="24" cy="16" r="7" fill="#fbfaf5" /><path d="M14 40 Q14 26 24 25 Q34 26 34 40 Z" fill="#fbfaf5" /><path d="M19 26 L29 26 L24 32 Z" fill={RED} /></>;
      case 'minitrue': return <path d="M8 40 L40 40 L34 30 L30 30 L27 20 L21 20 L18 30 L14 30 Z" fill="#fbfaf5" />;
      case 'newspeak': return <><rect x="10" y="12" width="28" height="26" rx="2" fill={RED} /><path d="M14 12 L14 38" /></>;
      case 'police': return <><path d="M8 34 L8 18 L30 18 L30 34 Z M30 34 L30 22 L38 22 L42 28 L42 34 Z" fill="#2a2a2a" /><circle cx="15" cy="36" r="3.5" fill="#fbfaf5" /><circle cx="35" cy="36" r="3.5" fill="#fbfaf5" /></>;
    }
  })();
  return <svg viewBox="0 0 48 48" className="as-ticon" aria-hidden><g {...S} strokeWidth={2.6}>{inner}</g></svg>;
}

export function IlloDiary() {
  return (
    <Frame>
      <g {...S}><path d="M60 60 L60 240 M60 60 L150 60 L150 240" fill="none" strokeDasharray="6 6" /><rect x="300" y="50" width="96" height="66" rx="8" fill="#fbfaf5" /></g>
      <Eye x={348} y={83} s={1.2} />
      <path d="M330 116 L240 200" {...S} strokeDasharray="3 7" />
      <g {...S}><path d="M150 200 L260 200 L260 214 L150 214 Z" fill="#fbfaf5" /><path d="M170 178 L230 178 L240 198 L160 198 Z" fill="#fbfaf5" /><path d="M200 178 L200 198" /></g>
      <Person x={120} y={244} s={1.05} look="down" arms="point" fill={YEL} />
      <text x="176" y="194" className="as-scrawl">DOWN WITH</text>
    </Frame>
  );
}

export function IlloNote() {
  return (
    <Frame>
      <Person x={150} y={240} s={1.05} look="ahead" fill={YEL} />
      <Person x={290} y={240} s={1.05} look="ahead" flip fill="#fbfaf5" />
      <path d="M270 200 L276 202 M268 207 L262 204" {...S} stroke={RED} strokeWidth="6" />
      <g {...S} transform="translate(220 120) rotate(-8)"><rect x="-44" y="-28" width="88" height="56" rx="4" fill="#fbfaf5" /></g>
      <text x="220" y="128" textAnchor="middle" className="as-scrawl" transform="rotate(-8 220 120)">I love you.</text>
    </Frame>
  );
}

export function IlloRation() {
  return (
    <Frame>
      <g {...S}><rect x="90" y="80" width="110" height="130" rx="6" fill="#6b4a36" /><rect x="250" y="112" width="110" height="98" rx="6" fill="#6b4a36" /></g>
      {[0, 1, 2].map((r) => [0, 1].map((c) => <rect key={`${r}${c}`} x={100 + c * 48} y={90 + r * 40} width="42" height="34" rx="3" fill="none" stroke="#fbfaf5" strokeWidth="2" />))}
      {[0, 1].map((r) => [0, 1].map((c) => <rect key={`b${r}${c}`} x={260 + c * 48} y={122 + r * 40} width="42" height="34" rx="3" fill="none" stroke="#fbfaf5" strokeWidth="2" />))}
      <text x="145" y="236" textAnchor="middle" className="as-cal-s" style={{ fill: '#161616', fontSize: 18 }}>30g</text>
      <text x="305" y="236" textAnchor="middle" className="as-cal-s" style={{ fill: RED, fontSize: 18 }}>20g ↑ ?</text>
      <path d="M212 150 L238 150 M230 142 L238 150 L230 158" {...S} />
    </Frame>
  );
}

export function IlloWar() {
  return (
    <Frame>
      <g {...S}><rect x="80" y="40" width="130" height="170" rx="4" fill="#fbfaf5" /><rect x="236" y="40" width="130" height="170" rx="4" fill="#fbfaf5" /></g>
      <text x="145" y="110" textAnchor="middle" className="as-cal-s" style={{ fill: '#161616', fontSize: 15 }}>DEATH TO</text>
      <text x="145" y="138" textAnchor="middle" className="as-cal-s" style={{ fill: RED, fontSize: 17 }}>EURASIA</text>
      <path d="M92 60 L198 196 M198 60 L92 196" {...S} stroke={RED} strokeWidth="5" />
      <text x="301" y="110" textAnchor="middle" className="as-cal-s" style={{ fill: '#161616', fontSize: 15 }}>DEATH TO</text>
      <text x="301" y="138" textAnchor="middle" className="as-cal-s" style={{ fill: RED, fontSize: 17 }}>EASTASIA</text>
      <Person x={228} y={250} s={0.9} look="up" arms="point" />
    </Frame>
  );
}
