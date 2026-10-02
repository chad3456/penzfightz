import { useId, type ReactNode } from 'react';

/**
 * Wall elevations for each Heirloom Wall idea, drawn to scale in SVG.
 * 1 unit = 0.35 cm; the floor is at y = 740; the wall shown is 4.2 m wide
 * and 2.6 m tall. Paintings are either the user's own photos (kept in the
 * browser) or stand-ins drawn here.
 */

export type Which = 'ac' | 'sh' | 'kr';
export type Photos = Partial<Record<Which, string>>;
type R = { x: number; y: number; w: number; h: number };
type Light = { x: number; y: number; rx: number; ry: number; k?: number; cone?: boolean };
type C = { u: string; ev: boolean; photos: Photos };

export const K = 1 / 0.35;
export const FLOOR = 740;
export const CX = 600;
const cm = (v: number) => v * K;
const yAt = (h: number) => FLOOR - h * K;

export const SIZE: Record<Which, [number, number]> = { ac: [45, 65], sh: [50, 68], kr: [45, 65] };

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function trio(o: { gap?: number; centre?: number; lift?: number; cx?: number; sizes?: Record<Which, [number, number]> } = {}) {
  const s = o.sizes ?? SIZE;
  const gap = cm(o.gap ?? 8), cy = yAt(o.centre ?? 150), cx = o.cx ?? CX;
  const W = (k: Which) => cm(s[k][0]), H = (k: Which) => cm(s[k][1]);
  const sh: R = { x: cx - W('sh') / 2, y: cy - H('sh') / 2 - cm(o.lift ?? 0), w: W('sh'), h: H('sh') };
  const ac: R = { x: sh.x - gap - W('ac'), y: cy - H('ac') / 2, w: W('ac'), h: H('ac') };
  const kr: R = { x: sh.x + sh.w + gap, y: cy - H('kr') / 2, w: W('kr'), h: H('kr') };
  return { ac, sh, kr };
}
const centreOf = (r: R) => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 });
const spot = (r: R, k = 1, cone = true): Light => ({ x: r.x + r.w / 2, y: r.y + r.h * 0.48, rx: r.w * 0.78, ry: r.h * 0.66, k, cone });

/* ───────────── the paintings (stand-ins) ───────────── */

function KundanBorder({ x, y, w, h, t, fill = '#c9a13b' }: { x: number; y: number; w: number; h: number; t: number; fill?: string }) {
  return (
    <g>
      <path d={`M${x} ${y}h${w}v${h}h${-w}Z M${x + t} ${y + t}v${h - 2 * t}h${w - 2 * t}v${-(h - 2 * t)}Z`} fill={fill} />
      <rect x={x + t * 0.3} y={y + t * 0.3} width={w - t * 0.6} height={h - t * 0.6} fill="none" stroke="#fbf1cf" strokeWidth={t * 0.22} strokeDasharray={`0.01 ${t * 0.42}`} strokeLinecap="round" />
      <rect x={x + t * 0.7} y={y + t * 0.7} width={w - t * 1.4} height={h - t * 1.4} fill="none" stroke="#fff6dc" strokeWidth={t * 0.18} strokeDasharray={`0.01 ${t * 0.36}`} strokeLinecap="round" opacity="0.85" />
    </g>
  );
}

function Lotus({ x, y, s = 1, c = '#e98fb3' }: { x: number; y: number; s?: number; c?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0 0 C-2 -3 -1.5 -7 0 -9 C1.5 -7 2 -3 0 0Z" fill={c} />
      <path d="M0 0 C-3 -1 -6 -4 -6 -7 C-3 -6 -1 -3 0 0Z" fill={c} opacity="0.85" />
      <path d="M0 0 C3 -1 6 -4 6 -7 C3 -6 1 -3 0 0Z" fill={c} opacity="0.85" />
    </g>
  );
}

function StandIn({ which }: { which: Which }) {
  if (which === 'sh') {
    return (
      <g>
        <rect width="100" height="136" fill="#b5674b" />
        <rect x="3" y="3" width="94" height="130" fill="none" stroke="#4189dc" strokeWidth="1.6" />
        <rect x="7" y="7" width="86" height="122" fill="#121212" />
        <rect x="9" y="9" width="82" height="118" fill="none" stroke="#d6aa45" strokeWidth="4" strokeDasharray="4.2 3" />
        <KundanBorder x={16} y={16} w={68} h={104} t={5} />
        <rect x="21" y="21" width="58" height="94" fill="#2337a8" />
        <path d="M30 34 C34 22 50 20 54 30 L46 40Z" fill="#d9b04d" />
        <path d="M58 52 C64 46 68 36 70 30 L74 32 C72 42 66 52 60 58Z" fill="#d6ab3e" />
        <path d="M38 78 L30 92 L40 100 L44 82Z M62 78 L70 92 L60 100 L56 82Z" fill="#d1a33a" />
        <ellipse cx="50" cy="78" rx="12" ry="26" fill="#d6ab3e" />
        <ellipse cx="50" cy="78" rx="12" ry="26" fill="none" stroke="#fff3cf" strokeWidth="1.1" strokeDasharray="0.01 2.4" strokeLinecap="round" />
        <path d="M38 62 C36 80 40 98 50 104 C60 98 64 80 62 62" fill="none" stroke="#2f7d4a" strokeWidth="2" strokeDasharray="1.5 1.2" />
        <ellipse cx="50" cy="48" rx="7.5" ry="9" fill="#1c2232" />
        <circle cx="47.5" cy="46" r="1" fill="#f2f2f2" /><circle cx="52.5" cy="46" r="1" fill="#f2f2f2" />
        <path d="M43 40 C46 34 54 34 57 40Z" fill="#d6ab3e" />
        <Lotus x={28} y={58} s={1.5} /><Lotus x={32} y={46} s={1.1} /><Lotus x={66} y={70} s={0.9} c="#e46d8c" />
        <rect x="21" y="106" width="58" height="9" fill="#f2efe8" />
        <rect x="30" y="102" width="3" height="10" fill="#d6ab3e" /><rect x="67" y="102" width="3" height="10" fill="#d6ab3e" /><rect x="44" y="104" width="12" height="6" fill="#d6ab3e" />
      </g>
    );
  }
  if (which === 'ac') {
    return (
      <g>
        <rect width="100" height="144" fill="#b5674b" />
        <rect x="3" y="3" width="94" height="138" fill="none" stroke="#4189dc" strokeWidth="1.6" />
        <KundanBorder x={7} y={7} w={86} h={130} t={6} />
        <rect x="13" y="13" width="74" height="118" fill="#2c6a39" />
        <circle cx="22" cy="24" r="9" fill="#3f8a44" /><circle cx="36" cy="18" r="8" fill="#4e9a48" /><circle cx="70" cy="22" r="10" fill="#3f8a44" /><circle cx="82" cy="34" r="7" fill="#5aa04c" />
        <rect x="54" y="62" width="33" height="14" fill="#7e8a85" rx="5" />
        <path d="M66 70 h10 v44 h-12Z" fill="#d9efe9" /><path d="M68 74 v38 M72 74 v38" stroke="#9fcfc6" strokeWidth="0.8" />
        <rect x="13" y="112" width="74" height="19" fill="#2a8486" />
        <circle cx="48" cy="40" r="11.5" fill="#70c79e" stroke="#d6ab3e" strokeWidth="2.6" />
        <path d="M42 36 C40 46 40 60 37 72 L44 70 C45 58 46 46 47 40Z" fill="#1b1714" />
        <path d="M40 56 C44 50 54 50 58 56 L62 112 L34 112Z" fill="#f2efe6" />
        <path d="M58 56 L70 66 L68 69 L56 62Z" fill="#e8c39d" />
        <circle cx="49" cy="42" r="6" fill="#e8c39d" />
        <path d="M54.5 42 L57 44 L54.5 45Z" fill="#e8c39d" />
        <path d="M46 34 C48 31 52 31 54 34 C52 33 48 33 46 34Z" fill="#1b1714" />
        <path d="M49 35.5 l1.5 2.5 l-3 0Z" fill="#f0b21f" />
        <rect x="37" y="72" width="8" height="11" rx="1" fill="#a52f6c" stroke="#d6ab3e" strokeWidth="1" />
        <path d="M70 66 L76 60" stroke="#3c7a3a" strokeWidth="0.8" /><Lotus x={76} y={61} s={0.8} />
        <Lotus x={22} y={120} s={1} /><Lotus x={34} y={122} s={0.9} /><Lotus x={66} y={121} s={1} /><Lotus x={78} y={122} s={0.8} />
      </g>
    );
  }
  return (
    <g>
      <rect width="100" height="144" fill="#b5674b" />
      <rect x="3" y="3" width="94" height="138" fill="none" stroke="#4189dc" strokeWidth="1.6" />
      <KundanBorder x={7} y={7} w={86} h={130} t={6} />
      <rect x="13" y="13" width="74" height="118" fill="#3a8c88" />
      <rect x="13" y="13" width="74" height="38" fill="#86c9c2" />
      <circle cx="68" cy="22" r="11" fill="#2f7a3f" /><circle cx="82" cy="34" r="9" fill="#3f8a44" /><circle cx="56" cy="16" r="7" fill="#2f7a3f" />
      <path d="M16 70 h10 v38 h-10Z" fill="#dff1ef" />
      <rect x="13" y="108" width="74" height="23" fill="#2c7a4a" />
      <rect x="13" y="122" width="74" height="9" fill="#2a8486" />
      <circle cx="54" cy="40" r="12" fill="#7fd0b6" stroke="#d6ab3e" strokeWidth="3.5" />
      <path d="M50 26 C56 20 64 22 66 30 L58 36 L48 34Z" fill="#d6ab3e" />
      <circle cx="54" cy="42" r="6.5" fill="#4a7fd2" />
      <path d="M47.8 41 L45.5 43 L48 44Z" fill="#4a7fd2" />
      <path d="M47 54 C50 50 60 50 63 54 L66 66 L44 66Z" fill="#4a7fd2" />
      <path d="M44 64 L66 64 L76 104 L34 104Z" fill="#c64836" />
      <path d="M41 76 h28 M38 86 h34 M36 96 h38" stroke="#e1b24a" strokeWidth="2.6" />
      <path d="M38 91 h34" stroke="#2f8a4f" strokeWidth="1.6" />
      <path d="M46 56 L36 40 L32 30" stroke="#4a7fd2" strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M31 30 C29 50 28 66 33 80" stroke="#ea8aa6" strokeWidth="2" strokeDasharray="2 1.3" fill="none" />
      <path d="M33 30 C38 50 40 64 38 80" stroke="#ea8aa6" strokeWidth="2" strokeDasharray="2 1.3" fill="none" />
      <path d="M50 104 v10 M58 104 v10" stroke="#4a7fd2" strokeWidth="3" />
      <Lotus x={72} y={70} s={1.4} /><Lotus x={22} y={120} s={0.9} /><Lotus x={40} y={121} s={0.9} /><Lotus x={78} y={120} s={1} />
    </g>
  );
}

/** One painting, with optional frame. */
function Art({ c, which, r, frame, ft = 0, shadow = true, glass = true }: { c: C; which: Which; r: R; frame?: string; ft?: number; shadow?: boolean; glass?: boolean }) {
  const photo = c.photos[which];
  const vbH = which === 'sh' ? 136 : 144;
  const t = cm(ft);
  return (
    <g>
      {shadow && <rect x={r.x - t} y={r.y - t} width={r.w + 2 * t} height={r.h + 2 * t} fill="#000" opacity="0.28" filter={`url(#${c.u}-sh)`} />}
      {frame && t > 0 && <path d={`M${r.x - t} ${r.y - t}h${r.w + 2 * t}v${r.h + 2 * t}h${-(r.w + 2 * t)}Z M${r.x} ${r.y}v${r.h}h${r.w}v${-r.h}Z`} fill={frame} fillRule="evenodd" />}
      {photo ? (
        <image href={photo} x={r.x} y={r.y} width={r.w} height={r.h} preserveAspectRatio="xMidYMid slice" />
      ) : (
        <svg x={r.x} y={r.y} width={r.w} height={r.h} viewBox={`0 0 100 ${vbH}`} preserveAspectRatio="none"><StandIn which={which} /></svg>
      )}
      {glass && <rect x={r.x} y={r.y} width={r.w} height={r.h} fill={`url(#${c.u}-glass)`} />}
      {frame && t > 0 && <rect x={r.x} y={r.y} width={r.w} height={r.h} fill="none" stroke="#000" strokeOpacity="0.35" strokeWidth="1.5" />}
    </g>
  );
}

function Trio({ c, t, frame, ft, shadow }: { c: C; t: Record<Which, R>; frame?: string; ft?: number; shadow?: boolean }) {
  return (
    <g>
      {(['ac', 'sh', 'kr'] as Which[]).map((w) => <Art key={w} c={c} which={w} r={t[w]} frame={frame} ft={ft} shadow={shadow} />)}
    </g>
  );
}

/* ───────────── room furniture ───────────── */

function Sofa({ fabric = '#cbb99d', w = 230 }: { fabric?: string; w?: number }) {
  const sw = cm(w), sx = CX - sw / 2;
  return (
    <g>
      <ellipse cx={CX} cy={FLOOR + 4} rx={sw * 0.52} ry="9" fill="#000" opacity="0.18" />
      <rect x={sx + cm(9)} y={yAt(86)} width={sw - cm(18)} height={cm(46)} rx="14" fill={fabric} />
      <rect x={sx + cm(9)} y={yAt(86)} width={sw - cm(18)} height={cm(46)} rx="14" fill="#000" opacity="0.06" />
      <rect x={sx} y={yAt(64)} width={cm(16)} height={cm(48)} rx="12" fill={fabric} />
      <rect x={sx + sw - cm(16)} y={yAt(64)} width={cm(16)} height={cm(48)} rx="12" fill={fabric} />
      <rect x={sx + cm(14)} y={yAt(47)} width={(sw - cm(28)) / 2 - 2} height={cm(19)} rx="8" fill={fabric} />
      <rect x={CX + 2} y={yAt(47)} width={(sw - cm(28)) / 2 - 2} height={cm(19)} rx="8" fill={fabric} />
      <rect x={sx + cm(4)} y={yAt(30)} width={sw - cm(8)} height={cm(16)} rx="6" fill={fabric} />
      <rect x={sx + cm(4)} y={yAt(30)} width={sw - cm(8)} height={cm(16)} rx="6" fill="#000" opacity="0.12" />
      <rect x={sx + cm(10)} y={yAt(14)} width={cm(4)} height={cm(14)} fill="#3a2a1e" />
      <rect x={sx + sw - cm(14)} y={yAt(14)} width={cm(4)} height={cm(14)} fill="#3a2a1e" />
      <rect x={sx + cm(22)} y={yAt(72)} width={cm(38)} height={cm(36)} rx="9" fill="#2b3a7a" transform={`rotate(-8 ${sx + cm(41)} ${yAt(54)})`} />
      <rect x={sx + sw - cm(60)} y={yAt(72)} width={cm(38)} height={cm(36)} rx="9" fill="#b0532e" transform={`rotate(8 ${sx + sw - cm(41)} ${yAt(54)})`} />
      <rect x={sx + sw - cm(96)} y={yAt(66)} width={cm(30)} height={cm(28)} rx="7" fill="#d8a63b" transform={`rotate(4 ${sx + sw - cm(81)} ${yAt(52)})`} />
    </g>
  );
}

function Console({ w = 150, top = 78, wood = '#4a3222' }: { w?: number; top?: number; wood?: string }) {
  const sw = cm(w), sx = CX - sw / 2;
  return (
    <g>
      <ellipse cx={CX} cy={FLOOR + 3} rx={sw * 0.5} ry="6" fill="#000" opacity="0.15" />
      <rect x={sx} y={yAt(top)} width={sw} height={cm(5)} fill={wood} />
      <rect x={sx + cm(4)} y={yAt(top - 5)} width={sw - cm(8)} height={cm(16)} fill={wood} opacity="0.9" />
      <path d={`M${sx + cm(8)} ${yAt(top - 21)} L${sx + cm(11)} ${FLOOR} L${sx + cm(14)} ${FLOOR} L${sx + cm(13)} ${yAt(top - 21)}Z`} fill={wood} />
      <path d={`M${sx + sw - cm(8)} ${yAt(top - 21)} L${sx + sw - cm(11)} ${FLOOR} L${sx + sw - cm(14)} ${FLOOR} L${sx + sw - cm(13)} ${yAt(top - 21)}Z`} fill={wood} />
      <rect x={CX - cm(6)} y={yAt(top - 13)} width={cm(12)} height={cm(2)} rx="2" fill="#c9a04a" />
      <path d={`M${sx + cm(18)} ${yAt(top)} q${cm(13)} ${-cm(10)} ${cm(26)} 0Z`} fill="#b8892f" />
      <ellipse cx={sx + cm(31)} cy={yAt(top + 1)} rx={cm(13)} ry={cm(1.6)} fill="#e7c15d" />
      <circle cx={sx + cm(27)} cy={yAt(top + 1.5)} r={cm(2)} fill="#f08a2c" /><circle cx={sx + cm(33)} cy={yAt(top + 1.5)} r={cm(2)} fill="#f5c53b" />
      <rect x={sx + sw - cm(30)} y={yAt(top + 22)} width={cm(9)} height={cm(22)} rx="8" fill="#6c7b5b" />
      <path d={`M${sx + sw - cm(26)} ${yAt(top + 22)} c-10 -30 -30 -40 -40 -44 M${sx + sw - cm(25)} ${yAt(top + 22)} c4 -34 20 -48 34 -54 M${sx + sw - cm(25.5)} ${yAt(top + 22)} c-2 -40 -4 -56 -2 -70`} stroke="#4c7a3d" strokeWidth="5" fill="none" strokeLinecap="round" />
    </g>
  );
}

function Bench({ w = 180, wood = '#5a3a24', cushion = '#8e2a33' }: { w?: number; wood?: string; cushion?: string }) {
  const sw = cm(w), sx = CX - sw / 2;
  return (
    <g>
      <ellipse cx={CX} cy={FLOOR + 3} rx={sw * 0.5} ry="6" fill="#000" opacity="0.15" />
      <rect x={sx} y={yAt(44)} width={sw} height={cm(8)} rx="4" fill={cushion} />
      <rect x={sx} y={yAt(36)} width={sw} height={cm(6)} fill={wood} />
      {[0, 1, 2, 3].map((i) => <rect key={i} x={sx + cm(4) + i * (sw - cm(12)) / 3} y={yAt(30)} width={cm(4)} height={cm(30)} fill={wood} />)}
    </g>
  );
}

function Plant({ x }: { x: number }) {
  return (
    <g>
      <ellipse cx={x} cy={FLOOR + 2} rx={cm(18)} ry="5" fill="#000" opacity="0.15" />
      <path d={`M${x - cm(14)} ${yAt(42)} L${x + cm(14)} ${yAt(42)} L${x + cm(10)} ${FLOOR} L${x - cm(10)} ${FLOOR}Z`} fill="#b06a42" />
      {[-60, -35, -15, 5, 25, 48, 70].map((a, i) => {
        const len = cm(70 + (i % 3) * 22), rad = ((a - 90) * Math.PI) / 180;
        const ex = x + Math.cos(rad) * len, ey = yAt(42) + Math.sin(rad) * len;
        return <path key={i} d={`M${x} ${yAt(42)} Q${x + Math.cos(rad) * len * 0.3} ${yAt(42) + Math.sin(rad) * len * 0.7} ${ex} ${ey}`} stroke="#3f6b35" strokeWidth={cm(3.2)} fill="none" strokeLinecap="round" />;
      })}
    </g>
  );
}

function Person({ x }: { x: number }) {
  const h = cm(170), top = FLOOR - h, s = h / 170;
  return (
    <g opacity="0.12">
      <circle cx={x} cy={top + 11 * s} r={10.5 * s} fill="#222" />
      <path d={`M${x - 20 * s} ${top + 28 * s} Q${x} ${top + 22 * s} ${x + 20 * s} ${top + 28 * s} L${x + 24 * s} ${top + 92 * s} L${x + 15 * s} ${top + 94 * s} L${x + 13 * s} ${FLOOR} L${x + 2 * s} ${FLOOR} L${x} ${top + 100 * s} L${x - 2 * s} ${FLOOR} L${x - 13 * s} ${FLOOR} L${x - 15 * s} ${top + 94 * s} L${x - 24 * s} ${top + 92 * s}Z`} fill="#222" />
    </g>
  );
}

/* ───────────── motifs ───────────── */

function Cow({ x, y, s = 1, fill = '#d4a537', flip = false }: { x: number; y: number; s?: number; fill?: string; flip?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s}) translate(-21 -12)`}>
      <path d="M4 9 C4 6 7 5 10 5 L24 5 C25 3 27 3 28 4 L31 4 C32 2 34 2 35 3 L34 5 C37 5 40 7 40 10 C40 12 38 12 37 12 L34 12 C33 14 31 15 29 15 L29 22 L27 22 L26 16 L13 16 L12 22 L10 22 L9 15 C6 14 4 12 4 9 Z M4 9 C1 11 1 16 2 19" fill={fill} stroke={fill} strokeWidth="0.6" />
    </g>
  );
}

function Kalash({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-9 0 C-12 -8 -8 -14 0 -14 C8 -14 12 -8 9 0Z" fill="#d6ab3e" />
      <rect x="-5" y="-18" width="10" height="4" fill="#c4962f" />
      <path d="M0 -18 C-8 -22 -12 -20 -14 -16 M0 -18 C8 -22 12 -20 14 -16" stroke="#3f7a3a" strokeWidth="2.4" fill="none" />
      <circle cx="0" cy="-23" r="5" fill="#a6763b" />
    </g>
  );
}

/** A cusped (multifoil) pointed arch over a rectangle. */
function archPath(x: number, top: number, w: number, bottom: number, head: number, cusps = 7, inward = true) {
  const spring = top + head;
  const pts: [number, number][] = [];
  for (let i = 0; i <= cusps; i++) {
    const t = i / cusps;
    // two quadratic halves meeting at a slight point
    const half = t < 0.5 ? t * 2 : (t - 0.5) * 2;
    let px: number, py: number;
    if (t <= 0.5) {
      const a = [x, spring], b = [x + w * 0.04, top + head * 0.05], e = [x + w / 2, top];
      px = (1 - half) ** 2 * a[0] + 2 * (1 - half) * half * b[0] + half ** 2 * e[0];
      py = (1 - half) ** 2 * a[1] + 2 * (1 - half) * half * b[1] + half ** 2 * e[1];
    } else {
      const a = [x + w / 2, top], b = [x + w * 0.96, top + head * 0.05], e = [x + w, spring];
      px = (1 - half) ** 2 * a[0] + 2 * (1 - half) * half * b[0] + half ** 2 * e[0];
      py = (1 - half) ** 2 * a[1] + 2 * (1 - half) * half * b[1] + half ** 2 * e[1];
    }
    pts.push([px, py]);
  }
  let d = `M${x} ${bottom} L${x} ${spring}`;
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i];
    const r = Math.hypot(bx - ax, by - ay) * 0.62;
    d += inward ? ` A${r} ${r} 0 0 1 ${bx} ${by}` : ` L${bx} ${by}`;
  }
  return d + ` L${x + w} ${bottom} Z`;
}

function MarigoldToran({ x1, x2, y, sag = 18 }: { x1: number; x2: number; y: number; sag?: number }) {
  const n = Math.round((x2 - x1) / 9);
  return (
    <g>
      {Array.from({ length: n + 1 }, (_, i) => {
        const t = i / n, px = x1 + (x2 - x1) * t, py = y + Math.sin(t * Math.PI) * sag;
        return <circle key={i} cx={px} cy={py} r="4.6" fill={i % 3 === 0 ? '#f5c53b' : '#f08a2c'} />;
      })}
      {Array.from({ length: 7 }, (_, i) => {
        const t = (i + 0.5) / 7, px = x1 + (x2 - x1) * t, py = y + Math.sin(t * Math.PI) * sag;
        return <path key={i} d={`M${px - 5} ${py + 3} L${px + 5} ${py + 3} L${px} ${py + 22}Z`} fill="#3f7a3a" />;
      })}
    </g>
  );
}

/* ───────────── the mockups ───────────── */

type Mockup = {
  wall: string;
  floor?: string;
  lights: (t: Record<Which, R>) => Light[];
  furn?: 'sofa' | 'console' | 'bench' | 'none';
  person?: boolean;
  plant?: number;
  t?: Parameters<typeof trio>[0];
  draw: (c: C, t: Record<Which, R>) => ReactNode;
  front?: (c: C, t: Record<Which, R>) => ReactNode;
};

function ledgeRects() {
  const lw = cm(62), gap = cm(8), tot = 3 * lw + 2 * gap;
  return ([['ac', 125], ['sh', 141], ['kr', 125]] as [Which, number][]).map(([k, h], i) => {
    const lx = CX - tot / 2 + i * (lw + gap), ly = yAt(h);
    const [aw, ah] = SIZE[k];
    return { k, lx, ly, lw, art: { x: lx + (lw - cm(aw)) / 2, y: ly - cm(ah) - cm(1), w: cm(aw), h: cm(ah) } as R };
  });
}

const wallsAll = (t: Record<Which, R>, k = 1) => [spot(t.ac, k), spot(t.sh, k), spot(t.kr, k)];

export const MOCKS: Record<string, Mockup> = {
  jharokha: {
    wall: '#ece3d3', t: { gap: 26, lift: 5 },
    lights: (t) => wallsAll(t),
    draw: (c, t) => {
      const L = t.ac.x - cm(26), Rr = t.kr.x + t.kr.w + cm(26);
      return (
        <g>
          <rect x={L + 8} y={yAt(250) + 8} width={Rr - L} height={yAt(78) - yAt(250)} fill="#000" opacity="0.18" filter={`url(#${c.u}-sh)`} />
          <rect x={L} y={yAt(250)} width={Rr - L} height={yAt(78) - yAt(250)} fill="#28306a" />
          <rect x={L} y={yAt(78) - 6} width={Rr - L} height="6" fill="#1a2050" />
          {(['ac', 'sh', 'kr'] as Which[]).map((w) => {
            const r = t[w], m = cm(8), x = r.x - m, ww = r.w + 2 * m, head = ww * 0.42, top = r.y - head - cm(2), bot = r.y + r.h + m;
            const fr = cm(6.5);
            return (
              <g key={w}>
                <path d={archPath(x - fr, top - fr, ww + 2 * fr, bot + fr, head + fr * 0.4)} fill="#6b4426" />
                <path d={archPath(x - fr, top - fr, ww + 2 * fr, bot + fr, head + fr * 0.4)} fill="none" stroke="#c9a04a" strokeWidth="2" />
                <path d={archPath(x, top, ww, bot, head)} fill="#161a3f" />
                <path d={archPath(x, top, ww, bot, head)} fill="none" stroke="#d6ab3e" strokeWidth="2.2" />
                <rect x={x - fr - cm(5)} y={top - fr - cm(9)} width={ww + 2 * fr + cm(10)} height={cm(4.5)} fill="#5a381f" />
                <rect x={x - fr - cm(5)} y={top - fr - cm(9)} width={ww + 2 * fr + cm(10)} height="3" fill="#c9a04a" />
                <path d={`M${x - fr} ${top - fr - cm(4.5)} l${cm(4)} 0 l${-cm(4)} ${cm(9)}Z M${x + ww + fr} ${top - fr - cm(4.5)} l${-cm(4)} 0 l${cm(4)} ${cm(9)}Z`} fill="#5a381f" />
                <Kalash x={x + ww / 2} y={top - fr - cm(9)} s={0.9} />
                <rect x={x - fr - cm(2)} y={bot + fr} width={ww + 2 * fr + cm(4)} height={cm(3.5)} fill="#5a381f" />
                <Art c={c} which={w} r={r} />
              </g>
            );
          })}
        </g>
      );
    },
  },

  pichwai: {
    wall: '#efe8dc', t: { gap: 12, centre: 155 },
    lights: (t) => [{ x: CX, y: yAt(155), rx: cm(150), ry: cm(95), k: 0.75, cone: true }, ...wallsAll(t, 0.6)],
    draw: (c, t) => {
      const x = CX - cm(120), y = yAt(238), w = cm(240), h = cm(160), b = cm(9);
      const rows: ReactNode[] = [];
      const r = rng(7);
      for (let yy = y + b + cm(10); yy < y + h - b; yy += cm(16)) {
        for (let xx = x + b + cm(10) + ((yy / cm(16)) % 2) * cm(9); xx < x + w - b - cm(5); xx += cm(18)) {
          const flower = r() < 0.45;
          rows.push(flower ? <Lotus key={`${xx}-${yy}`} x={xx} y={yy + 10} s={2.2} /> : <ellipse key={`${xx}-${yy}`} cx={xx} cy={yy} rx={cm(6)} ry={cm(3.2)} fill={r() < 0.5 ? '#2f7d4a' : '#3d8f55'} />);
        }
      }
      return (
        <g>
          <rect x={x + 8} y={y + 10} width={w} height={h} fill="#000" opacity="0.25" filter={`url(#${c.u}-sh)`} />
          <rect x={x} y={y} width={w} height={h} fill="#9a2a2a" />
          <rect x={x + 4} y={y + 4} width={w - 8} height={h - 8} fill="none" stroke="#e1b24a" strokeWidth="4" strokeDasharray="10 6" />
          <rect x={x + b} y={y + b} width={w - 2 * b} height={h - 2 * b} fill="#1b2a6b" />
          <rect x={x + b} y={y + h - b - cm(48)} width={w - 2 * b} height={cm(48)} fill="#1e5a6b" opacity="0.55" />
          {rows}
          {Array.from({ length: 22 }, (_, i) => <path key={i} d={`M${x + 10 + i * (w - 20) / 21} ${y + h} l0 ${cm(6)}`} stroke="#e1b24a" strokeWidth="3" />)}
          <Trio c={c} t={t} frame="#1b1410" ft={1.5} />
        </g>
      );
    },
  },

  shutters: {
    wall: '#e9e1d2', furn: 'console', t: { gap: 10, centre: 152 },
    lights: (t) => [{ x: CX, y: yAt(160), rx: cm(130), ry: cm(60), k: 0.9, cone: false }, ...wallsAll(t, 0.5)],
    draw: (c, t) => {
      const x = CX - cm(115), y = yAt(200), w = cm(230), h = yAt(102) - y, leaf = cm(57);
      const Leaf = ({ lx, mirror }: { lx: number; mirror: boolean }) => (
        <g>
          <rect x={lx} y={y - cm(2)} width={leaf} height={h + cm(4)} fill="#6a4226" />
          <rect x={lx} y={y - cm(2)} width={leaf} height={h + cm(4)} fill="none" stroke="#3a2414" strokeWidth="3" />
          {[0, 1, 2].map((i) => <rect key={i} x={lx + cm(6)} y={y + cm(4) + i * (h - cm(4)) / 3} width={leaf - cm(12)} height={(h - cm(4)) / 3 - cm(5)} fill="#7a4e2c" stroke="#4a2c18" strokeWidth="2" />)}
          {Array.from({ length: 4 }, (_, i) => Array.from({ length: 6 }, (_, j) => <circle key={`${i}-${j}`} cx={lx + cm(4) + i * (leaf - cm(8)) / 3} cy={y + j * h / 5} r="3.2" fill="#d6ab3e" />))}
          <circle cx={mirror ? lx + cm(6) : lx + leaf - cm(6)} cy={y + h / 2} r={cm(4)} fill="none" stroke="#d6ab3e" strokeWidth="3" />
        </g>
      );
      return (
        <g>
          <Leaf lx={x - leaf - cm(4)} mirror={false} />
          <Leaf lx={x + w + cm(4)} mirror />
          <rect x={x - cm(5)} y={y - cm(5)} width={w + cm(10)} height={h + cm(10)} fill="#55351d" />
          <rect x={x} y={y} width={w} height={h} fill="#232a5c" />
          <rect x={x} y={y} width={w} height={h} fill={`url(#${c.u}-recess)`} />
          <Trio c={c} t={t} frame="#3a2414" ft={1.2} />
          <rect x={x - cm(8)} y={y - cm(10)} width={w + cm(16)} height={cm(5)} fill="#4a2c18" />
          <Kalash x={CX} y={y - cm(10)} />
        </g>
      );
    },
  },

  torana: {
    wall: '#ede5d8', furn: 'console',
    lights: (t) => [...wallsAll(t), { x: CX - cm(119), y: yAt(110), rx: cm(18), ry: cm(110), k: 0.5 }, { x: CX + cm(119), y: yAt(110), rx: cm(18), ry: cm(110), k: 0.5 }],
    draw: (c, t) => {
      const stone = '#d9a38c', dark = '#b97f69';
      const Pillar = ({ px }: { px: number }) => (
        <g>
          <rect x={px} y={yAt(200)} width={cm(24)} height={FLOOR - yAt(200)} fill={stone} />
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <rect key={i} x={px} y={yAt(12 + i * 25)} width={cm(24)} height={cm(i % 2 ? 3 : 6)} fill={dark} />)}
          {[0, 1, 2, 3].map((i) => <path key={i} d={`M${px + cm(4)} ${yAt(30 + i * 50)} q${cm(8)} ${-cm(14)} ${cm(16)} 0 q${-cm(8)} ${cm(14)} ${-cm(16)} 0Z`} fill={dark} opacity="0.75" />)}
          <rect x={px - cm(3)} y={yAt(200) - cm(6)} width={cm(30)} height={cm(6)} fill={dark} />
          <rect x={px - cm(3)} y={FLOOR - cm(10)} width={cm(30)} height={cm(10)} fill={dark} />
        </g>
      );
      const L = CX - cm(130), Rr = CX + cm(106);
      return (
        <g>
          <rect x={L + cm(24)} y={yAt(205)} width={Rr - L - cm(24)} height={FLOOR - yAt(205)} fill="#f3ece0" />
          <Trio c={c} t={t} frame="#5a381f" ft={1.5} />
          <path d={archPath(L + cm(24), yAt(206), Rr - L - cm(24), yAt(180), cm(24), 9)} fill="none" />
          <path d={`M${L} ${yAt(232)} H${Rr + cm(24)} V${yAt(200)} H${L}Z`} fill={stone} />
          <path d={`${archPath(L + cm(24), yAt(200), Rr - L - cm(24), yAt(176), cm(20), 11)}`} fill="#f3ece0" />
          <path d={`M${L + cm(24)} ${yAt(200)} H${Rr} V${yAt(176)} H${L + cm(24)}Z`} fill={stone} />
          <path d={archPath(L + cm(24), yAt(200), Rr - L - cm(24), yAt(176) + 1, cm(20), 11)} fill="#f3ece0" />
          {Array.from({ length: 18 }, (_, i) => <rect key={i} x={L + cm(6) + i * cm(14.6)} y={yAt(229)} width={cm(8)} height={cm(9)} fill={dark} />)}
          <rect x={L} y={yAt(214)} width={Rr - L + cm(24)} height={cm(3)} fill={dark} />
          <Pillar px={L} /><Pillar px={Rr} />
          <Kalash x={CX} y={yAt(232)} s={1.6} />
          <Kalash x={L + cm(12)} y={yAt(232)} s={1} /><Kalash x={Rr + cm(12)} y={yAt(232)} s={1} />
        </g>
      );
    },
  },

  thikri: {
    wall: '#e7dfd2',
    lights: () => [{ x: CX, y: yAt(150), rx: cm(140), ry: cm(80), k: 0.85, cone: true }],
    draw: (c, t) => {
      const x = CX - cm(118), y = yAt(218), w = cm(236), h = cm(134), cx = CX, cy = yAt(150);
      const r = rng(11), bits: ReactNode[] = [];
      for (let a = 0; a < 72; a++) {
        const ang = (a / 72) * Math.PI * 2;
        for (let d = cm(30); d < cm(160); d += cm(4.2)) {
          const px = cx + Math.cos(ang) * d, py = cy + Math.sin(ang) * d * 0.62;
          if (px < x + 6 || px > x + w - 6 || py < y + 6 || py > y + h - 6) continue;
          const fade = 1 - d / cm(160);
          if (r() > fade + 0.25) continue;
          const tone = ['#e9eef1', '#c8d1d8', '#f8fafb', '#aab5bd'][Math.floor(r() * 4)];
          bits.push(<rect key={`${a}-${d}`} x={px - 4} y={py - 3} width={7 + r() * 3} height={5 + r() * 2} fill={tone} transform={`rotate(${(ang * 180) / Math.PI} ${px} ${py})`} opacity={0.65 + fade * 0.35} />);
          if (c.ev && r() < 0.12 * fade + 0.02) bits.push(<circle key={`g${a}-${d}`} cx={px} cy={py} r={2 + r() * 2.5} fill="#fff4cf" style={{ mixBlendMode: 'screen' }} />);
        }
      }
      return (
        <g>
          <rect x={x + 8} y={y + 8} width={w} height={h} fill="#000" opacity="0.2" filter={`url(#${c.u}-sh)`} />
          <rect x={x} y={y} width={w} height={h} fill="#d8cdb9" />
          <defs><clipPath id={`${c.u}-pan`}><rect x={x} y={y} width={w} height={h} /></clipPath></defs>
          <g clipPath={`url(#${c.u}-pan)`}>
            {Array.from({ length: 36 }, (_, i) => { const a = (i / 36) * Math.PI * 2; return <line key={i} x1={cx} y1={cy} x2={cx + Math.cos(a) * cm(200)} y2={cy + Math.sin(a) * cm(200) * 0.62} stroke="#c9a04a" strokeWidth="1.6" opacity="0.8" />; })}
            {bits}
          </g>
          <rect x={x} y={y} width={w} height={h} fill="none" stroke="#c9a04a" strokeWidth="5" />
          <Trio c={c} t={t} frame="#c9a04a" ft={1.5} />
        </g>
      );
    },
  },

  molela: {
    wall: '#efe7da', t: { centre: 160 },
    lights: (t) => [...wallsAll(t, 0.8), { x: CX, y: yAt(100), rx: cm(170), ry: cm(14), k: 0.6 }],
    draw: (c, t) => {
      const plaque = (px: number, py: number, k: number) => (
        <g key={`${px}-${py}`}>
          <rect x={px + 3} y={py + 4} width={cm(19)} height={cm(19)} fill="#000" opacity="0.18" rx="3" />
          <rect x={px} y={py} width={cm(19)} height={cm(19)} rx="3" fill="#b4623e" />
          <rect x={px + 5} y={py + 5} width={cm(19) - 10} height={cm(19) - 10} rx="2" fill="#c27348" />
          {k % 3 === 0 && <Cow x={px + cm(9.5)} y={py + cm(9.5)} s={1.15} fill="#8f4428" flip={px > CX} />}
          {k % 3 === 1 && <g><path d={`M${px + cm(9.5)} ${py + cm(15)} C${px + cm(3)} ${py + cm(10)} ${px + cm(5)} ${py + cm(3)} ${px + cm(9.5)} ${py + cm(5)} C${px + cm(14)} ${py + cm(3)} ${px + cm(16)} ${py + cm(10)} ${px + cm(9.5)} ${py + cm(15)}Z`} fill="#8f4428" /><circle cx={px + cm(9.5)} cy={py + cm(7)} r="4" fill="#d58b5e" /></g>}
          {k % 3 === 2 && <Lotus x={px + cm(9.5)} y={py + cm(14)} s={3.4} c="#8f4428" />}
        </g>
      );
      const lows: ReactNode[] = [], highs: ReactNode[] = [];
      for (let i = 0; i < 11; i++) { const px = CX - cm(11 * 22) / 2 + i * cm(22) + cm(1.5); lows.push(plaque(px, yAt(112), i)); if (i % 2 === 0) highs.push(plaque(px, yAt(232), i + 1)); }
      return <g>{highs}{lows}<Trio c={c} t={t} frame="#3a2414" ft={2} /></g>;
    },
  },

  repousse: {
    wall: '#b9c2ad', t: { gap: 26 },
    lights: (t) => wallsAll(t),
    draw: (c, t) => (
      <g>
        <defs>
          <pattern id={`${c.u}-bump`} width="11" height="11" patternUnits="userSpaceOnUse">
            <circle cx="5.5" cy="5.5" r="3.2" fill="#f5dc8a" /><circle cx="4.5" cy="4.5" r="1.4" fill="#fff6d0" />
          </pattern>
        </defs>
        {(['ac', 'sh', 'kr'] as Which[]).map((w) => {
          const r = t[w], f = cm(10);
          const ring = `M${r.x - f} ${r.y - f}h${r.w + 2 * f}v${r.h + 2 * f}h${-(r.w + 2 * f)}Z M${r.x} ${r.y}v${r.h}h${r.w}v${-r.h}Z`;
          return (
            <g key={w}>
              <rect x={r.x - f + 6} y={r.y - f + 8} width={r.w + 2 * f} height={r.h + 2 * f} fill="#000" opacity="0.3" filter={`url(#${c.u}-sh)`} />
              <path d={ring} fill={`url(#${c.u}-brass)`} fillRule="evenodd" />
              <path d={ring} fill={`url(#${c.u}-bump)`} fillRule="evenodd" opacity="0.45" />
              <rect x={r.x - f + 4} y={r.y - f + 4} width={r.w + 2 * f - 8} height={r.h + 2 * f - 8} fill="none" stroke="#7a5a1f" strokeWidth="2" />
              {w === 'sh' && [0, 1, 2, 3, 4].map((i) => <Cow key={i} x={r.x + r.w * (0.1 + i * 0.2)} y={r.y + r.h + f / 2} s={0.75} fill="#8a6420" />)}
              {w !== 'sh' && [0, 1, 2, 3].map((i) => <Lotus key={i} x={r.x - f / 2} y={r.y + r.h * (0.2 + i * 0.22)} s={1.5} c="#8a6420" />)}
              {w !== 'sh' && [0, 1, 2, 3].map((i) => <Lotus key={`r${i}`} x={r.x + r.w + f / 2} y={r.y + r.h * (0.2 + i * 0.22)} s={1.5} c="#8a6420" />)}
              <Art c={c} which={w} r={r} shadow={false} />
            </g>
          );
        })}
      </g>
    ),
  },

  kamal: {
    wall: '#efe7da',
    lights: (t) => [...wallsAll(t, 0.9), { x: CX, y: yAt(55), rx: cm(240), ry: cm(60), k: 0.55 }],
    draw: (c, t) => {
      const top = yAt(108), r = rng(3), items: ReactNode[] = [];
      for (let i = 0; i < 70; i++) {
        const x = r() * 1200, y = top + 18 + r() * (FLOOR - top - 30);
        items.push(r() < 0.6 ? <ellipse key={i} cx={x} cy={y} rx={cm(7 + r() * 5)} ry={cm(3 + r() * 1.5)} fill={r() < 0.5 ? '#2f7d4a' : '#418f53'} /> : <Lotus key={i} x={x} y={y} s={2.2 + r() * 1.4} />);
      }
      for (let i = 0; i < 6; i++) { const x = 80 + r() * 1040, y = top + 50 + r() * 140; items.push(<path key={`f${i}`} d={`M${x} ${y} q12 -7 24 0 q-12 7 -24 0Z M${x + 24} ${y} l8 -5 l0 10Z`} fill="#e89c4a" opacity="0.85" />); }
      return (
        <g>
          <rect x="0" y={top} width="1200" height={FLOOR - top} fill={`url(#${c.u}-pond)`} />
          {Array.from({ length: 9 }, (_, i) => <path key={i} d={`M0 ${top + 30 + i * 28} q75 -8 150 0 t150 0 t150 0 t150 0 t150 0 t150 0 t150 0 t150 0`} stroke="#bfe6e4" strokeWidth="1.4" fill="none" opacity="0.35" />)}
          {items}
          <path d={`M${CX + cm(150)} ${top + 30} l-2 -40 m2 40 l14 -6`} stroke="#f2efe6" strokeWidth="3" />
          <ellipse cx={CX + cm(150) + 8} cy={top + 10} rx="14" ry="7" fill="#f2efe6" />
          <Trio c={c} t={t} frame="#c9a04a" ft={1.6} />
        </g>
      );
    },
  },

  araish: {
    wall: '#efe9de', t: { gap: 22, lift: 4 },
    lights: (t) => wallsAll(t, 0.95),
    draw: (c, t) => (
      <g>
        <rect x="0" y="0" width="1200" height={FLOOR} fill={`url(#${c.u}-sheen)`} />
        {(['ac', 'sh', 'kr'] as Which[]).map((w) => {
          const r = t[w], m = cm(6), x = r.x - m, ww = r.w + 2 * m, head = ww * 0.5, top = r.y - head - cm(3), bot = r.y + r.h + m;
          return (
            <g key={w}>
              <path d={archPath(x - 3, top - 3, ww + 6, bot + 4, head + 2, 16, false)} fill="#fffaf0" />
              <path d={archPath(x, top, ww, bot, head, 16, false)} fill="#c8cee4" />
              <path d={archPath(x, top, ww, bot, head, 16, false)} fill={`url(#${c.u}-recess)`} />
              <rect x={x} y={bot - 5} width={ww} height="5" fill="#a9b0cc" />
              <circle cx={x + ww / 2} cy={top + cm(6)} r="3.5" fill="#fff4d6" />
              <Art c={c} which={w} r={r} frame="#2b2116" ft={1} />
            </g>
          );
        })}
      </g>
    ),
  },

  door: {
    wall: '#e6dccb', furn: 'bench', person: true,
    t: { gap: 14, centre: 150 },
    lights: (t) => [...wallsAll(t, 0.9), { x: CX, y: yAt(110), rx: cm(130), ry: cm(130), k: 0.4 }],
    draw: (c, t) => {
      const x = CX - cm(100), w = cm(200), top = yAt(225), teak = '#6b4426';
      const studs: ReactNode[] = [];
      for (let i = 0; i < 9; i++) for (let j = 0; j < 12; j++) studs.push(<circle key={`${i}-${j}`} cx={x + cm(10) + i * (w - cm(20)) / 8} cy={top + cm(12) + j * (FLOOR - top - cm(20)) / 11} r="3.4" fill="#cfa648" />);
      return (
        <g>
          <ellipse cx={CX} cy={FLOOR + 3} rx={w * 0.55} ry="8" fill="#000" opacity="0.22" />
          <rect x={x - cm(10)} y={top - cm(22)} width={w + cm(20)} height={FLOOR - top + cm(22)} fill="#4f311a" />
          <rect x={x - cm(10)} y={top - cm(22)} width={w + cm(20)} height={cm(14)} fill="#5f3c20" />
          {Array.from({ length: 12 }, (_, i) => <path key={i} d={`M${x - cm(6) + i * (w + cm(12)) / 11} ${top - cm(10)} q${cm(4)} ${-cm(8)} ${cm(8)} 0`} stroke="#cfa648" strokeWidth="2" fill="none" />)}
          <rect x={x} y={top} width={w / 2 - 2} height={FLOOR - top} fill={teak} />
          <rect x={x + w / 2 + 2} y={top} width={w / 2 - 2} height={FLOOR - top} fill={teak} />
          {[0, 1].map((s) => [0, 1].map((k) => <rect key={`${s}${k}`} x={x + s * (w / 2) + cm(8)} y={top + cm(10) + k * cm(105)} width={w / 2 - cm(16)} height={cm(95)} fill="#7a4e2c" stroke="#3a2414" strokeWidth="2" />))}
          {studs}
          <rect x={CX - cm(5)} y={top} width={cm(10)} height={FLOOR - top} fill="#5a381f" />
          <circle cx={CX - cm(9)} cy={yAt(110)} r={cm(5)} fill="none" stroke="#d6ab3e" strokeWidth="3.5" />
          <circle cx={CX + cm(9)} cy={yAt(110)} r={cm(5)} fill="none" stroke="#d6ab3e" strokeWidth="3.5" />
          {(['ac', 'kr'] as Which[]).map((w2) => <g key={w2}><rect x={t[w2].x - cm(4)} y={t[w2].y - cm(4)} width={t[w2].w + cm(8)} height={t[w2].h + cm(8)} fill="#2a1a0e" /><Art c={c} which={w2} r={t[w2]} shadow={false} /></g>)}
          <path d={archPath(t.sh.x - cm(9), t.sh.y - cm(24), t.sh.w + cm(18), t.sh.y + t.sh.h + cm(8), cm(18), 7)} fill="#4a2c18" stroke="#d6ab3e" strokeWidth="2.5" />
          <Art c={c} which="sh" r={t.sh} shadow={false} />
        </g>
      );
    },
  },

  jaali: {
    wall: '#e3ddd2',
    lights: (t) => [{ x: CX, y: yAt(150), rx: cm(140), ry: cm(80), k: 0.8 }, ...wallsAll(t, 0.7)],
    draw: (c, t) => {
      const x = CX - cm(122), y = yAt(212), w = cm(244), h = cm(122);
      const glow = c.ev ? '#ffcf86' : '#d8d1c3';
      return (
        <g>
          <defs>
            <pattern id={`${c.u}-jaali`} width="34" height="34" patternUnits="userSpaceOnUse">
              <rect width="34" height="34" fill="#141417" />
              <path d="M17 4 L21 13 L30 17 L21 21 L17 30 L13 21 L4 17 L13 13Z" fill={glow} />
              <circle cx="0" cy="0" r="3.4" fill={glow} /><circle cx="34" cy="0" r="3.4" fill={glow} /><circle cx="0" cy="34" r="3.4" fill={glow} /><circle cx="34" cy="34" r="3.4" fill={glow} />
            </pattern>
          </defs>
          <rect x={x + 10} y={y + 12} width={w} height={h} fill="#000" opacity="0.3" filter={`url(#${c.u}-sh)`} />
          <rect x={x} y={y} width={w} height={h} fill={`url(#${c.u}-jaali)`} />
          {c.ev && <rect x={x} y={y} width={w} height={h} fill="#ffb460" opacity="0.18" style={{ mixBlendMode: 'screen' }} />}
          <rect x={x} y={y} width={w} height={h} fill="none" stroke="#141417" strokeWidth="10" />
          {(['ac', 'sh', 'kr'] as Which[]).map((k) => <rect key={k} x={t[k].x - cm(5)} y={t[k].y - cm(5)} width={t[k].w + cm(10)} height={t[k].h + cm(10)} fill="#141417" />)}
          <Trio c={c} t={t} frame="#0e0e10" ft={1.2} />
        </g>
      );
    },
  },

  chhatri: {
    wall: '#ede4d4', furn: 'none', plant: 1090,
    t: { gap: 40, centre: 135 },
    lights: (t) => [...wallsAll(t, 0.8), { x: CX, y: yAt(140), rx: cm(60), ry: cm(80), k: 0.9 }],
    draw: (c, t) => {
      const w = cm(92), x = CX - w / 2, base = yAt(80), cap = yAt(188);
      return (
        <g>
          <rect x={x + 8} y={cap + 8} width={w} height={base - cap} fill="#000" opacity="0.22" filter={`url(#${c.u}-sh)`} />
          <rect x={x} y={cap} width={w} height={base - cap} fill="#3a1f18" />
          <path d={`M${x - cm(6)} ${cap} C${x - cm(4)} ${cap - cm(42)} ${x + w + cm(4)} ${cap - cm(42)} ${x + w + cm(6)} ${cap}Z`} fill="#8a2a22" />
          <path d={`M${x - cm(6)} ${cap} C${x - cm(4)} ${cap - cm(42)} ${x + w + cm(4)} ${cap - cm(42)} ${x + w + cm(6)} ${cap}Z`} fill="none" stroke="#d6ab3e" strokeWidth="3" />
          {[1, 2, 3, 4, 5].map((i) => <path key={i} d={`M${CX} ${cap - cm(33)} L${x - cm(6) + i * (w + cm(12)) / 6} ${cap}`} stroke="#d6ab3e" strokeWidth="1.5" opacity="0.7" />)}
          <Kalash x={CX} y={cap - cm(32)} s={1.3} />
          <rect x={x - cm(8)} y={cap} width={w + cm(16)} height={cm(6)} fill="#6b4426" />
          <path d={`M${x - cm(8)} ${cap + cm(6)} ${Array.from({ length: 10 }, () => `q${(w + cm(16)) / 20} ${cm(5)} ${(w + cm(16)) / 10} 0`).join(' ')}`} fill="#6b4426" />
          <rect x={x - cm(4)} y={cap + cm(6)} width={cm(10)} height={base - cap - cm(6)} fill="#6b4426" />
          <rect x={x + w - cm(6)} y={cap + cm(6)} width={cm(10)} height={base - cap - cm(6)} fill="#6b4426" />
          {[0, 1, 2, 3].map((i) => <g key={i}><rect x={x - cm(4)} y={cap + cm(18) + i * cm(24)} width={cm(10)} height={cm(3)} fill="#d6ab3e" /><rect x={x + w - cm(6)} y={cap + cm(18) + i * cm(24)} width={cm(10)} height={cm(3)} fill="#d6ab3e" /></g>)}
          <rect x={x - cm(10)} y={base} width={w + cm(20)} height={cm(5)} fill="#5a381f" />
          <path d={`M${x} ${base + cm(5)} h${w} l${-cm(10)} ${cm(12)} h${-(w - cm(20))}Z`} fill="#4a2c18" />
          <path d={`M${CX - cm(16)} ${base} q${cm(16)} ${-cm(9)} ${cm(32)} 0Z`} fill="#b8892f" />
          <Art c={c} which="sh" r={t.sh} shadow={false} />
          <Art c={c} which="ac" r={t.ac} frame="#6b4426" ft={2.5} />
          <Art c={c} which="kr" r={t.kr} frame="#6b4426" ft={2.5} />
        </g>
      );
    },
  },

  hindola: {
    wall: '#e9e1d3', furn: 'none',
    t: { gap: 46, centre: 150 },
    lights: (t) => [...wallsAll(t, 0.7), { ...spot(t.sh, 1), y: centreOf(t.sh).y }],
    draw: (c, t) => {
      const px = cm(64), top = yAt(206), sh = { ...t.sh, y: yAt(140) - t.sh.h / 2 };
      const Post = ({ x }: { x: number }) => (
        <g>
          <rect x={x - cm(4)} y={top} width={cm(8)} height={FLOOR - top - cm(8)} fill="#a7342a" />
          {Array.from({ length: 9 }, (_, i) => <rect key={i} x={x - cm(4.5)} y={top + cm(10) + i * cm(21)} width={cm(9)} height={cm(4)} fill={i % 2 ? '#2f7a4f' : '#e2b13f'} />)}
          <circle cx={x} cy={top - cm(6)} r={cm(5)} fill="#2f7a4f" />
          <path d={`M${x + cm(2)} ${top - cm(9)} l${cm(6)} ${cm(1)} l${-cm(5)} ${cm(3)}Z`} fill="#e2b13f" />
          <rect x={x - cm(20)} y={FLOOR - cm(8)} width={cm(40)} height={cm(8)} rx="4" fill="#7a2620" />
        </g>
      );
      return (
        <g>
          <Art c={c} which="ac" r={t.ac} frame="#6b4426" ft={2} />
          <Art c={c} which="kr" r={t.kr} frame="#6b4426" ft={2} />
          <ellipse cx={CX} cy={FLOOR + 6} rx={cm(80)} ry="12" fill="#000" opacity="0.2" />
          <Post x={CX - px} /><Post x={CX + px} />
          <rect x={CX - px - cm(8)} y={top - cm(2)} width={2 * px + cm(16)} height={cm(7)} rx="5" fill="#a7342a" />
          <rect x={CX - px - cm(8)} y={top + cm(1)} width={2 * px + cm(16)} height={cm(2)} fill="#e2b13f" />
          {[sh.x + sh.w * 0.15, sh.x + sh.w * 0.85].map((x, i) => <line key={i} x1={x} y1={top + cm(5)} x2={x} y2={sh.y} stroke="#d6ab3e" strokeWidth="3" strokeDasharray="5 3" />)}
          <Art c={c} which="sh" r={sh} frame="#7a2620" ft={2.2} />
          <MarigoldToran x1={CX - px + cm(6)} x2={CX + px - cm(6)} y={top + cm(7)} sag={cm(6)} />
        </g>
      );
    },
  },

  pillar: {
    wall: '#e5ddd0', furn: 'none', plant: 1090,
    lights: () => [{ x: CX, y: yAt(150), rx: cm(50), ry: cm(60), k: 1, cone: true }],
    draw: (c) => {
      const fw = cm(70), sw = cm(30), x = CX - fw / 2, top = yAt(205);
      const sh: R = { x: CX - cm(25), y: yAt(150) - cm(34), w: cm(50), h: cm(68) };
      return (
        <g>
          <line x1={CX - cm(165)} y1="0" x2={CX - cm(165)} y2={yAt(200)} stroke="#6b5a48" strokeWidth="2" />
          <path d={`M${CX - cm(185)} ${yAt(184)} L${CX - cm(145)} ${yAt(184)} L${CX - cm(157)} ${yAt(200)} L${CX - cm(173)} ${yAt(200)}Z`} fill="#c9a04a" />
          <ellipse cx={CX + sw / 2} cy={FLOOR + 6} rx={cm(62)} ry="12" fill="#000" opacity="0.25" />
          <path d={`M${x + fw} ${top} l${sw} ${-cm(8)} v${FLOOR - top} l${-sw} ${cm(8)}Z`} fill="#3b2617" />
          <rect x={x} y={top} width={fw} height={FLOOR - top} fill="#5a3a24" />
          <path d={`M${x} ${top} l${sw} ${-cm(8)} h${fw} l${-sw} ${cm(8)}Z`} fill="#7a5134" />
          <rect x={x} y={top} width={fw} height={cm(4)} fill="#c9a04a" />
          <rect x={x} y={FLOOR - cm(10)} width={fw} height={cm(10)} fill="#3a2414" />
          <g transform={`translate(${x + fw} ${0}) skewY(-15)`}>
            <rect x={cm(6)} y={yAt(150) - cm(30) + cm(8) * 1.3} width={sw - cm(12)} height={cm(60)} fill="#2a8486" opacity="0.6" />
          </g>
          <Art c={c} which="sh" r={sh} frame="#2a1a0e" ft={1.5} />
          <path d={`M${CX - cm(46)} ${FLOOR - cm(16)} A${cm(48)} ${cm(8)} 0 0 0 ${CX + cm(46)} ${FLOOR - cm(16)}`} fill="none" stroke="#c9a04a" strokeWidth="3" strokeDasharray="7 6" />
          <path d={`M${CX + cm(46)} ${FLOOR - cm(16)} l-10 -10 m10 10 l-14 4`} stroke="#c9a04a" strokeWidth="3" fill="none" />
        </g>
      );
    },
  },

  seasonal: {
    wall: '#ebe3d4', furn: 'none',
    lights: () => [{ x: CX, y: yAt(152), rx: cm(55), ry: cm(62), k: 1, cone: true }],
    draw: (c) => {
      const n = { x: CX - cm(38), y: yAt(150) - cm(48), w: cm(76), h: cm(96) };
      const sh: R = { x: CX - cm(25), y: yAt(150) - cm(34), w: cm(50), h: cm(68) };
      const chest = { x: CX - cm(58), y: yAt(76), w: cm(116), h: cm(68) };
      return (
        <g>
          <rect x={n.x - cm(4)} y={n.y - cm(4)} width={n.w + cm(8)} height={n.h + cm(8)} fill="#5a381f" />
          <rect x={n.x} y={n.y} width={n.w} height={n.h} fill="#2a2f5e" />
          <rect x={n.x} y={n.y} width={n.w} height={n.h} fill={`url(#${c.u}-recess)`} />
          <Art c={c} which="sh" r={sh} frame="#d6ab3e" ft={1.2} />
          <rect x={n.x - cm(10)} y={n.y - cm(12)} width={n.w + cm(20)} height={cm(2)} rx="2" fill="#d6ab3e" />
          <MarigoldToran x1={n.x - cm(8)} x2={n.x + n.w + cm(8)} y={n.y - cm(10)} sag={cm(5)} />
          <ellipse cx={CX} cy={FLOOR + 3} rx={chest.w * 0.55} ry="7" fill="#000" opacity="0.18" />
          <rect x={chest.x} y={chest.y} width={chest.w} height={chest.h} fill="#c8a57c" />
          <rect x={chest.x - cm(2)} y={chest.y - cm(3)} width={chest.w + cm(4)} height={cm(3)} fill="#b38e64" />
          {[0, 1, 2].map((i) => <g key={i}><rect x={chest.x + cm(4)} y={chest.y + cm(4) + i * cm(19)} width={chest.w - cm(8)} height={cm(16)} fill="#d6b68c" stroke="#a7825a" strokeWidth="2" /><rect x={CX - cm(8)} y={chest.y + cm(10) + i * cm(19)} width={cm(16)} height={cm(2.5)} rx="2" fill="#a6763b" /></g>)}
          <rect x={chest.x + cm(4)} y={chest.y + cm(4) - cm(3)} width={chest.w - cm(8)} height={cm(3)} fill="#c9a04a" opacity="0.9" />
          <rect x={chest.x + cm(1)} y={FLOOR - cm(6)} width={chest.w - cm(2)} height={cm(6)} fill="#8a6a46" />
        </g>
      );
    },
  },

  vitrine: {
    wall: '#e1dccf', t: { gap: 12 },
    lights: () => [{ x: CX, y: yAt(152), rx: cm(130), ry: cm(60), k: 1 }],
    draw: (c, t) => {
      const x = CX - cm(112), y = yAt(150) - cm(48), w = cm(224), h = cm(96);
      return (
        <g>
          <rect x={x + 10} y={y + 14} width={w} height={h} fill="#000" opacity="0.3" filter={`url(#${c.u}-sh)`} />
          <rect x={x - cm(2)} y={y - cm(2)} width={w + cm(4)} height={h + cm(4)} fill="#6d5640" />
          <rect x={x} y={y} width={w} height={h} fill="#2b2e52" />
          <rect x={x} y={y} width={w} height={h} fill={`url(#${c.u}-recess)`} />
          <Trio c={c} t={t} frame="#d6ab3e" ft={0.8} shadow={false} />
          <rect x={x} y={y} width={w} height={h} fill={`url(#${c.u}-glass2)`} />
          <rect x={x} y={y} width={w} height={cm(3)} fill={c.ev ? '#ffe2a8' : '#8a7458'} opacity="0.9" />
          <rect x={x - cm(2)} y={y + h + cm(2)} width={w + cm(4)} height={cm(6)} fill="#5a4634" />
          <rect x={CX - cm(10)} y={y + h + cm(4)} width={cm(20)} height={cm(1.5)} fill="#c9a04a" />
        </g>
      );
    },
  },

  peacock: {
    wall: '#e8e2d6', t: { gap: 18, centre: 152 },
    lights: (t) => [...wallsAll(t, 0.85), { x: CX, y: yAt(150), rx: cm(150), ry: cm(80), k: 0.5 }],
    draw: (c, t) => {
      const bx = CX, by = yAt(112), feathers: ReactNode[] = [];
      const n = 31;
      for (let i = 0; i < n; i++) {
        const a = Math.PI + (i / (n - 1)) * Math.PI, len = cm(118 + (i % 2) * 12);
        const ex = bx + Math.cos(a) * len, ey = by + Math.sin(a) * len * 0.92;
        feathers.push(
          <g key={i}>
            <line x1={bx} y1={by} x2={ex} y2={ey} stroke="#a8812e" strokeWidth="2.4" />
            <ellipse cx={ex} cy={ey} rx={cm(7)} ry={cm(9.5)} fill="#9a7a2e" transform={`rotate(${(a * 180) / Math.PI + 90} ${ex} ${ey})`} />
            <ellipse cx={ex} cy={ey} rx={cm(4.5)} ry={cm(6)} fill={c.ev ? '#3ad1c0' : '#1f8a86'} transform={`rotate(${(a * 180) / Math.PI + 90} ${ex} ${ey})`} />
            <circle cx={ex} cy={ey} r={cm(2.4)} fill={c.ev ? '#4aa0ff' : '#1f3f8f'} />
          </g>,
        );
      }
      return (
        <g>
          <g opacity="0.95">{feathers}</g>
          <path d={`M${bx - cm(14)} ${by + cm(4)} C${bx - cm(10)} ${by - cm(14)} ${bx + cm(10)} ${by - cm(14)} ${bx + cm(14)} ${by + cm(4)} C${bx + cm(6)} ${by + cm(12)} ${bx - cm(6)} ${by + cm(12)} ${bx - cm(14)} ${by + cm(4)}Z`} fill="#1f4f9f" />
          <path d={`M${bx + cm(6)} ${by - cm(4)} C${bx + cm(16)} ${by - cm(12)} ${bx + cm(14)} ${by - cm(24)} ${bx + cm(18)} ${by - cm(28)}`} stroke="#1f4f9f" strokeWidth={cm(5)} fill="none" strokeLinecap="round" />
          <circle cx={bx + cm(19)} cy={by - cm(29)} r={cm(3.6)} fill="#1f4f9f" />
          <path d={`M${bx + cm(22)} ${by - cm(29)} l${cm(4)} ${cm(1)} l${-cm(4)} ${cm(1.5)}Z`} fill="#d6ab3e" />
          {[0, 1, 2].map((i) => <line key={i} x1={bx + cm(18)} y1={by - cm(32)} x2={bx + cm(14 + i * 3)} y2={by - cm(39)} stroke="#1f4f9f" strokeWidth="2" />)}
          <Trio c={c} t={t} frame="#a8812e" ft={1.6} />
        </g>
      );
    },
  },

  gau: {
    wall: '#ede5d6', t: { centre: 165 },
    lights: (t) => [...wallsAll(t, 0.85), { x: CX, y: yAt(103), rx: cm(240), ry: cm(14), k: 0.7 }],
    draw: (c, t) => {
      const top = yAt(116), bh = cm(26), cows: ReactNode[] = [];
      for (let i = 0; i < 16; i++) { const x = 30 + i * 74; if (Math.abs(x - CX) < 30) continue; cows.push(<Cow key={i} x={x} y={top + bh / 2 + 2} s={1.7} flip={x > CX} />); }
      return (
        <g>
          <rect x="0" y={top} width="1200" height={bh} fill="#232b62" />
          <rect x="0" y={top} width="1200" height="4" fill="#d6ab3e" /><rect x="0" y={top + bh - 4} width="1200" height="4" fill="#d6ab3e" />
          {cows}
          <Lotus x={CX} y={top + bh / 2 + 12} s={3} c="#d6ab3e" />
          <Trio c={c} t={t} frame="#d6ab3e" ft={1.5} />
        </g>
      );
    },
  },

  memory: {
    wall: '#e9e3d8', t: { gap: 6 },
    lights: (t) => [{ x: CX, y: yAt(150), rx: cm(170), ry: cm(80), k: 0.8, cone: true }, ...wallsAll(t, 0.4)],
    draw: (c, t) => {
      const L = t.ac.x, Rr = t.kr.x + t.kr.w, T = t.sh.y, B = t.ac.y + t.ac.h, g = cm(6);
      const box = (x: number, y: number, w: number, h: number, kind: string, k: number) => (
        <g key={k}>
          <rect x={x + 3} y={y + 4} width={w} height={h} fill="#000" opacity="0.25" filter={`url(#${c.u}-sh)`} />
          <rect x={x} y={y} width={w} height={h} fill={k % 2 ? '#1c1a18' : '#b8892f'} />
          <rect x={x + 4} y={y + 4} width={w - 8} height={h - 8} fill="#f4efe4" />
          {kind === 'house' && <g><rect x={x + 12} y={y + 12} width={w - 24} height={h - 24} fill="#b9a27e" /><path d={`M${x + 18} ${y + h * 0.55} L${x + w / 2} ${y + h * 0.28} L${x + w - 18} ${y + h * 0.55}Z`} fill="#6f5a40" /><rect x={x + 22} y={y + h * 0.55} width={w - 44} height={h * 0.3} fill="#8a7252" /><rect x={x + w / 2 - 5} y={y + h * 0.65} width="10" height={h * 0.2} fill="#4a3a28" /></g>}
          {kind === 'key' && <g><rect x={x + 8} y={y + 8} width={w - 16} height={h - 16} fill="#d9d0bd" /><circle cx={x + w * 0.32} cy={y + h / 2} r={h * 0.14} fill="none" stroke="#5a4634" strokeWidth="4" /><path d={`M${x + w * 0.42} ${y + h / 2} H${x + w * 0.8} m-8 0 v8 m-8 -8 v6`} stroke="#5a4634" strokeWidth="4" fill="none" /></g>}
          {kind === 'sign' && <text x={x + w / 2} y={y + h / 2 + 5} textAnchor="middle" fontSize="13" fill="#5a2a1a" style={{ fontFamily: "'Noto Serif Devanagari', serif" }}>अमृतलाल शर्मा नाथद्वारा</text>}
          {kind === 'note' && <g>{[0, 1, 2, 3].map((i) => <line key={i} x1={x + 12} x2={x + w - 12 - (i === 3 ? 20 : 0)} y1={y + 18 + i * 11} y2={y + 18 + i * 11} stroke="#5a4634" strokeWidth="1.5" opacity="0.6" />)}</g>}
          {kind === 'knocker' && <g><rect x={x + 8} y={y + 8} width={w - 16} height={h - 16} fill="#3b2a1e" /><circle cx={x + w / 2} cy={y + h / 2 + 4} r={w * 0.22} fill="none" stroke="#d6ab3e" strokeWidth="5" /><circle cx={x + w / 2} cy={y + h * 0.28} r="5" fill="#d6ab3e" /></g>}
        </g>
      );
      return (
        <g>
          {box(L - g - cm(32), T, cm(32), cm(26), 'house', 1)}
          {box(L - g - cm(26), T + cm(26) + g, cm(26), cm(30), 'key', 2)}
          {box(L - g - cm(36), T + cm(56) + 2 * g, cm(36), cm(22), 'house', 3)}
          {box(Rr + g, T, cm(38), cm(24), 'house', 4)}
          {box(Rr + g, T + cm(24) + g, cm(28), cm(28), 'knocker', 5)}
          {box(Rr + g, T + cm(52) + 2 * g, cm(36), cm(24), 'note', 6)}
          {box(CX - cm(45), B + g + cm(2), cm(90), cm(14), 'sign', 7)}
          {box(L, T - g - cm(22), cm(28), cm(22), 'house', 8)}
          {box(Rr - cm(30), T - g - cm(20), cm(30), cm(20), 'house', 9)}
          <Trio c={c} t={t} frame="#1c1a18" ft={1.4} />
        </g>
      );
    },
  },

  single: {
    wall: '#e6e0d4', t: { gap: 8 },
    lights: () => [{ x: CX, y: yAt(150), rx: cm(130), ry: cm(66), k: 1, cone: true }],
    draw: (c, t) => {
      const m = cm(12), f = cm(5), x = t.ac.x - m, y = t.sh.y - m, w = t.kr.x + t.kr.w - t.ac.x + 2 * m, h = t.sh.h + 2 * m;
      return (
        <g>
          <rect x={x - f + 10} y={y - f + 14} width={w + 2 * f} height={h + 2 * f} fill="#000" opacity="0.3" filter={`url(#${c.u}-sh)`} />
          <rect x={x - f} y={y - f} width={w + 2 * f} height={h + 2 * f} fill={`url(#${c.u}-gold)`} />
          <rect x={x} y={y} width={w} height={h} fill="#26306b" />
          <rect x={x} y={y} width={w} height={h} fill={`url(#${c.u}-silk)`} />
          {(['ac', 'sh', 'kr'] as Which[]).map((k) => (
            <g key={k}>
              <rect x={t[k].x - cm(3)} y={t[k].y - cm(3)} width={t[k].w + cm(6)} height={t[k].h + cm(6)} fill="none" stroke="#d6ab3e" strokeWidth="3" strokeDasharray="0.01 7" strokeLinecap="round" />
              <rect x={t[k].x - cm(1.2)} y={t[k].y - cm(1.2)} width={t[k].w + cm(2.4)} height={t[k].h + cm(2.4)} fill="none" stroke="#d6ab3e" strokeWidth="1.6" />
              <Art c={c} which={k} r={t[k]} shadow={false} glass={false} />
            </g>
          ))}
          <rect x={x} y={y} width={w} height={h} fill={`url(#${c.u}-glass)`} />
        </g>
      );
    },
  },

  kota: {
    wall: '#8f989c',
    lights: (t) => [...wallsAll(t, 0.9), { x: CX, y: yAt(250), rx: cm(240), ry: cm(30), k: 0.4 }],
    draw: (c, t) => {
      const r = rng(5), slabs: ReactNode[] = [], s = cm(60);
      for (let y = FLOOR; y > -s; y -= s) for (let x = 0; x < 1200; x += s) slabs.push(<rect key={`${x}-${y}`} x={x + 1} y={y - s + 1} width={s - 2} height={s - 2} fill={['#8d969a', '#98a1a4', '#858e93', '#929b9e'][Math.floor(r() * 4)]} />);
      return (
        <g>
          <rect x="0" y="0" width="1200" height={FLOOR} fill="#6f777b" />
          {slabs}
          {(['ac', 'sh', 'kr'] as Which[]).map((k) => (
            <g key={k}>
              <Art c={c} which={k} r={t[k]} frame="#b8892f" ft={0.9} />
              {[[0, 0], [1, 0], [0, 1], [1, 1]].map(([i, j]) => <circle key={`${i}${j}`} cx={t[k].x + cm(4) + i * (t[k].w - cm(8))} cy={t[k].y + cm(4) + j * (t[k].h - cm(8))} r={cm(1.6)} fill="#e2c068" stroke="#8a6420" strokeWidth="1.2" />)}
            </g>
          ))}
        </g>
      );
    },
  },

  bluepottery: {
    wall: '#ece7de', t: { gap: 10 },
    lights: (t) => wallsAll(t, 0.95),
    draw: (c, t) => {
      const ts = cm(10), x = CX - cm(115), y = yAt(215), cols = 23, rows = 12, tiles: ReactNode[] = [];
      for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
        const border = i < 3 || j < 3 || i >= cols - 3 || j >= rows - 3;
        const px = x + i * ts, py = y + j * ts;
        tiles.push(
          <g key={`${i}-${j}`}>
            <rect x={px + 0.6} y={py + 0.6} width={ts - 1.2} height={ts - 1.2} fill={border ? '#f2f5f8' : '#f7f6f2'} />
            {border && ((i + j) % 2 ? <g><circle cx={px + ts / 2} cy={py + ts / 2} r={ts * 0.3} fill="#1d3f9a" /><circle cx={px + ts / 2} cy={py + ts / 2} r={ts * 0.12} fill="#4fb6c9" /></g> : <path d={`M${px + ts / 2} ${py + 3} Q${px + ts - 3} ${py + ts / 2} ${px + ts / 2} ${py + ts - 3} Q${px + 3} ${py + ts / 2} ${px + ts / 2} ${py + 3}Z`} fill="#2f6fc0" />)}
            {!border && <circle cx={px + ts / 2} cy={py + ts / 2} r="2" fill="#9cc6dc" />}
          </g>,
        );
      }
      return <g><rect x={x - 3} y={y - 3} width={cols * ts + 6} height={rows * ts + 6} fill="#d0d6dc" />{tiles}<Trio c={c} t={t} frame="#1d3f9a" ft={1.4} /></g>;
    },
  },

  pietra: {
    wall: '#5d2a2e', t: { gap: 26 },
    lights: (t) => wallsAll(t),
    draw: (c, t) => (
      <g>
        {(['ac', 'sh', 'kr'] as Which[]).map((k) => {
          const r = t[k], f = cm(10), rr = rng(k.length * 13 + 3);
          const flowers: ReactNode[] = [];
          const path = `M${r.x - f / 2} ${r.y - f / 2} H${r.x + r.w + f / 2} V${r.y + r.h + f / 2} H${r.x - f / 2}Z`;
          const per = 2 * (r.w + r.h + 2 * f);
          for (let i = 0; i < 22; i++) {
            let d = (i / 22) * per, px: number, py: number;
            const W = r.w + f, H = r.h + f;
            if (d < W) { px = r.x - f / 2 + d; py = r.y - f / 2; } else if ((d -= W) < H) { px = r.x + r.w + f / 2; py = r.y - f / 2 + d; } else if ((d -= H) < W) { px = r.x + r.w + f / 2 - d; py = r.y + r.h + f / 2; } else { d -= W; px = r.x - f / 2; py = r.y + r.h + f / 2 - d; }
            const col = ['#c0392b', '#2e7d4f', '#2a4fa0', '#e08a2a'][Math.floor(rr() * 4)];
            flowers.push(<g key={i}><circle cx={px} cy={py} r="4.6" fill={col} /><ellipse cx={px + 6} cy={py - 3} rx="4" ry="1.8" fill="#2e7d4f" /></g>);
          }
          return (
            <g key={k}>
              <rect x={r.x - f + 6} y={r.y - f + 10} width={r.w + 2 * f} height={r.h + 2 * f} fill="#000" opacity="0.4" filter={`url(#${c.u}-sh)`} />
              <rect x={r.x - f} y={r.y - f} width={r.w + 2 * f} height={r.h + 2 * f} fill={`url(#${c.u}-marble)`} />
              <path d={path} fill="none" stroke="#2e7d4f" strokeWidth="1.8" strokeDasharray="10 4" opacity="0.8" />
              {flowers}
              <Art c={c} which={k} r={r} shadow={false} />
            </g>
          );
        })}
      </g>
    ),
  },

  screen: {
    wall: '#e4ddd1', furn: 'none', plant: 1090, person: false,
    lights: () => [{ x: CX, y: yAt(140), rx: cm(130), ry: cm(110), k: 0.85 }],
    draw: (c) => {
      const pw = cm(60), ph = cm(190), top = FLOOR - ph - cm(4);
      const centre: R = { x: CX - pw / 2, y: top, w: pw, h: ph };
      const panel = (x: number, w: number, which: Which, skew: number, shade: number) => {
        const art: R = { x: x + (w - cm(42) * (w / pw)) / 2, y: yAt(150) - cm(32), w: cm(42) * (w / pw), h: cm(61) };
        return (
          <g transform={`translate(${x} ${top}) skewY(${skew}) translate(${-x} ${-top})`}>
            <rect x={x} y={top} width={w} height={ph} fill="#6b4426" />
            <rect x={x} y={top} width={w} height={ph} fill="#000" opacity={shade} />
            <rect x={x + cm(4) * (w / pw)} y={top + cm(5)} width={w - cm(8) * (w / pw)} height={cm(30)} fill={`url(#${c.u}-lattice)`} />
            <rect x={x + cm(4) * (w / pw)} y={yAt(42)} width={w - cm(8) * (w / pw)} height={cm(30)} fill={`url(#${c.u}-lattice)`} />
            <Art c={c} which={which} r={art} frame="#3a2414" ft={1.2} shadow={false} />
          </g>
        );
      };
      return (
        <g>
          <defs>
            <pattern id={`${c.u}-lattice`} width="14" height="14" patternUnits="userSpaceOnUse">
              <rect width="14" height="14" fill="#3a2414" /><path d="M7 1 L13 7 L7 13 L1 7Z" fill="#e4ddd1" opacity="0.65" />
            </pattern>
          </defs>
          <ellipse cx={CX} cy={FLOOR + 5} rx={cm(110)} ry="10" fill="#000" opacity="0.22" />
          {panel(centre.x - cm(48), cm(48), 'ac', 10, 0.18)}
          {panel(centre.x + pw, cm(48), 'kr', -10, 0.18)}
          {panel(centre.x, pw, 'sh', 0, 0)}
        </g>
      );
    },
  },

  canopy: {
    wall: '#ece4d7', t: { gap: 10 },
    lights: (t) => [...wallsAll(t, 0.8), { x: CX, y: yAt(215), rx: cm(130), ry: cm(20), k: 0.6 }],
    draw: (c, t) => {
      const x = CX - cm(125), w = cm(250), top = yAt(240), vb = yAt(222), red = '#8e1f2a';
      const sc = 12, sw = w / sc;
      let scallop = `M${x} ${top} H${x + w} V${vb}`;
      for (let i = sc; i > 0; i--) scallop += ` Q${x + (i - 0.5) * sw} ${vb + cm(8)} ${x + (i - 1) * sw} ${vb}`;
      scallop += 'Z';
      const drape = (side: number) => {
        const ex = side < 0 ? x : x + w, inner = ex - side * cm(22), tie = yAt(118);
        return (
          <g>
            <path d={`M${ex} ${vb} L${inner} ${vb} C${inner + side * cm(2)} ${tie - cm(30)} ${ex - side * cm(4)} ${tie - cm(4)} ${ex - side * cm(3)} ${tie} C${ex - side * cm(10)} ${tie + cm(30)} ${inner + side * cm(4)} ${FLOOR - cm(30)} ${inner + side * cm(6)} ${FLOOR} L${ex + side * cm(2)} ${FLOOR}Z`} fill={red} />
            <path d={`M${ex - side * cm(12)} ${vb} C${ex - side * cm(10)} ${tie - cm(40)} ${ex - side * cm(6)} ${tie - cm(10)} ${ex - side * cm(4)} ${tie}`} stroke="#000" strokeOpacity="0.2" strokeWidth="5" fill="none" />
            <ellipse cx={ex - side * cm(4)} cy={tie} rx={cm(4)} ry={cm(2.5)} fill="#d6ab3e" />
            <line x1={ex - side * cm(4)} y1={tie} x2={ex - side * cm(2)} y2={tie + cm(18)} stroke="#d6ab3e" strokeWidth="3" />
          </g>
        );
      };
      return (
        <g>
          <Trio c={c} t={t} frame="#d6ab3e" ft={1.4} />
          {drape(-1)}{drape(1)}
          <path d={scallop} fill={red} />
          <rect x={x} y={top + cm(4)} width={w} height={cm(3)} fill="#d6ab3e" />
          <rect x={x} y={top + cm(10)} width={w} height="3" fill="#d6ab3e" opacity="0.8" />
          {Array.from({ length: sc + 1 }, (_, i) => <g key={i}><line x1={x + i * sw} y1={vb} x2={x + i * sw} y2={vb + cm(9)} stroke="#d6ab3e" strokeWidth="2" /><circle cx={x + i * sw} cy={vb + cm(10)} r="4" fill="#d6ab3e" /></g>)}
          <rect x={x - cm(6)} y={top - 4} width={w + cm(12)} height="6" rx="3" fill="#b8892f" />
          <circle cx={x - cm(6)} cy={top - 1} r="7" fill="#d6ab3e" /><circle cx={x + w + cm(6)} cy={top - 1} r="7" fill="#d6ab3e" />
        </g>
      );
    },
  },

  ledges: {
    wall: '#e8e1d5',
    lights: () => ledgeRects().map(({ art }) => spot(art, 0.9)),
    draw: (c) => {
      const out: ReactNode[] = [];
      ledgeRects().forEach(({ k, lx, ly, lw, art }) => {
        out.push(
          <g key={k}>
            <Art c={c} which={k} r={art} frame="#2b1d12" ft={1.2} />
            <rect x={lx} y={ly - cm(1)} width={lw} height={cm(4)} fill="#5a3a24" />
            <rect x={lx} y={ly - cm(3)} width={lw} height={cm(2)} fill="#c9a04a" />
            <rect x={lx} y={ly + cm(3)} width={lw} height="3" fill="#000" opacity="0.25" />
            {c.ev && <rect x={lx + 4} y={ly + cm(3)} width={lw - 8} height="3" fill="#ffe0a0" />}
          </g>,
        );
      });
      return <g>{out}</g>;
    },
  },

  halo: {
    wall: '#dfe0dc', t: { gap: 10 },
    lights: (t) => (['ac', 'sh', 'kr'] as Which[]).map((k) => ({ x: centreOf(t[k]).x, y: centreOf(t[k]).y, rx: t[k].w * 0.95, ry: t[k].h * 0.78, k: 1, cone: false })),
    draw: (c, t) => (
      <g>
        {(['ac', 'sh', 'kr'] as Which[]).map((k) => {
          const r = t[k], f = cm(3);
          return (
            <g key={k}>
              {c.ev && <rect x={r.x - f - 22} y={r.y - f - 22} width={r.w + 2 * f + 44} height={r.h + 2 * f + 44} rx="30" fill="#ffc777" opacity="0.85" filter={`url(#${c.u}-blur)`} style={{ mixBlendMode: 'screen' }} />}
              <rect x={r.x - f + 18} y={r.y - f + 24} width={r.w + 2 * f} height={r.h + 2 * f} fill="#000" opacity={c.ev ? 0 : 0.28} filter={`url(#${c.u}-sh)`} />
              <Art c={c} which={k} r={r} frame="#141414" ft={3} shadow={false} />
            </g>
          );
        })}
      </g>
    ),
  },

  echo: {
    wall: '#ede6d8', furn: 'console', t: { cx: 690, gap: 8 },
    lights: (t) => [{ x: 160, y: yAt(150), rx: cm(60), ry: cm(80), k: 0.25 }, ...wallsAll(t, 0.9)],
    draw: (c, t) => {
      const wx = 50, wy = yAt(225), ww = cm(70), wh = cm(140);
      return (
        <g>
          <rect x={wx - 8} y={wy - 8} width={ww + 16} height={wh + 16} fill="#f8f4ec" />
          <rect x={wx} y={wy} width={ww} height={wh} fill={c.ev ? '#1b2440' : '#bcd8ee'} />
          <line x1={wx + ww / 2} y1={wy} x2={wx + ww / 2} y2={wy + wh} stroke="#f8f4ec" strokeWidth="6" />
          <line x1={wx} y1={wy + wh / 2} x2={wx + ww} y2={wy + wh / 2} stroke="#f8f4ec" strokeWidth="6" />
          <rect x={wx - 14} y={wy + wh + 6} width={ww + 28} height="10" fill="#e6dfd2" />
          {!c.ev && <path d={`M${wx + ww} ${wy} L${t.kr.x + t.kr.w + 40} ${wy + 80} L${t.kr.x + t.kr.w + 40} ${wy + wh + 260} L${wx + ww} ${wy + wh}Z`} fill="#fff3cc" opacity="0.35" style={{ mixBlendMode: 'screen' }} />}
          <Trio c={c} t={t} frame="#b8892f" ft={1.2} />
          <rect x={t.kr.x + t.kr.w + cm(6)} y={t.kr.y + t.kr.h - cm(12)} width={cm(12)} height={cm(8)} fill="#f8f4ec" stroke="#cfc6b6" />
          <line x1={t.kr.x + t.kr.w + cm(8)} x2={t.kr.x + t.kr.w + cm(16)} y1={t.kr.y + t.kr.h - cm(9)} y2={t.kr.y + t.kr.h - cm(9)} stroke="#7a7266" strokeWidth="1.5" />
          <line x1={t.kr.x + t.kr.w + cm(8)} x2={t.kr.x + t.kr.w + cm(14)} y1={t.kr.y + t.kr.h - cm(7)} y2={t.kr.y + t.kr.h - cm(7)} stroke="#7a7266" strokeWidth="1.5" />
        </g>
      );
    },
  },
};

/* ───────────── the frame around every mockup ───────────── */

export function Mock({ id, ev, photos, dims, label }: { id: string; ev: boolean; photos: Photos; dims?: boolean; label?: string }) {
  const raw = useId();
  const u = 'dw' + raw.replace(/[^a-zA-Z0-9]/g, '');
  const m = MOCKS[id];
  if (!m) return null;
  const t = trio(m.t);
  const c: C = { u, ev, photos };
  const lights = m.lights(t);
  const furn = m.furn ?? 'sofa';
  const g = { L: t.ac.x, R: t.kr.x + t.kr.w, T: Math.min(t.ac.y, t.sh.y, t.kr.y), B: Math.max(t.ac.y + t.ac.h, t.sh.y + t.sh.h, t.kr.y + t.kr.h) };
  const centre = (g.T + g.B) / 2;
  return (
    <svg viewBox="0 0 1200 800" className="dw-mock" role="img" aria-label={label ?? id}>
      <defs>
        <filter id={`${u}-sh`} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="7" /></filter>
        <filter id={`${u}-blur`} filterUnits="userSpaceOnUse" x="-200" y="-200" width="1600" height="1200"><feGaussianBlur stdDeviation="34" /></filter>
        <linearGradient id={`${u}-glass`} x1="0" y1="0" x2="1" y2="1"><stop offset="0.35" stopColor="#fff" stopOpacity="0" /><stop offset="0.5" stopColor="#fff" stopOpacity="0.13" /><stop offset="0.62" stopColor="#fff" stopOpacity="0" /></linearGradient>
        <linearGradient id={`${u}-glass2`} x1="0" y1="0" x2="1" y2="0.6"><stop offset="0.1" stopColor="#fff" stopOpacity="0" /><stop offset="0.28" stopColor="#fff" stopOpacity="0.14" /><stop offset="0.34" stopColor="#fff" stopOpacity="0" /><stop offset="0.7" stopColor="#fff" stopOpacity="0" /><stop offset="0.76" stopColor="#fff" stopOpacity="0.1" /><stop offset="0.8" stopColor="#fff" stopOpacity="0" /></linearGradient>
        <linearGradient id={`${u}-recess`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#000" stopOpacity="0.45" /><stop offset="0.25" stopColor="#000" stopOpacity="0.08" /><stop offset="1" stopColor="#000" stopOpacity="0" /></linearGradient>
        <linearGradient id={`${u}-brass`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#8a6420" /><stop offset="0.3" stopColor="#e9c96f" /><stop offset="0.55" stopColor="#a8782a" /><stop offset="0.8" stopColor="#f0d27a" /><stop offset="1" stopColor="#8a6420" /></linearGradient>
        <linearGradient id={`${u}-gold`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#9a7024" /><stop offset="0.4" stopColor="#f2d47e" /><stop offset="0.7" stopColor="#b88a30" /><stop offset="1" stopColor="#e8c56a" /></linearGradient>
        <linearGradient id={`${u}-silk`} x1="0" y1="0" x2="1" y2="0.3"><stop offset="0" stopColor="#fff" stopOpacity="0.08" /><stop offset="0.5" stopColor="#fff" stopOpacity="0" /><stop offset="1" stopColor="#fff" stopOpacity="0.1" /></linearGradient>
        <linearGradient id={`${u}-marble`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f6f3ee" /><stop offset="0.5" stopColor="#e6e1d8" /><stop offset="1" stopColor="#f3efe8" /></linearGradient>
        <linearGradient id={`${u}-pond`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2b8a8a" /><stop offset="1" stopColor="#14505a" /></linearGradient>
        <linearGradient id={`${u}-sheen`} x1="0" y1="0" x2="1" y2="0.4"><stop offset="0.2" stopColor="#fff" stopOpacity="0" /><stop offset="0.45" stopColor="#fff" stopOpacity="0.35" /><stop offset="0.6" stopColor="#fff" stopOpacity="0" /></linearGradient>
        <radialGradient id={`${u}-wall`} cx="0.5" cy="0.35" r="0.75"><stop offset="0" stopColor="#fff" stopOpacity="0.16" /><stop offset="1" stopColor="#000" stopOpacity="0.1" /></radialGradient>
        <radialGradient id={`${u}-warm`}><stop offset="0" stopColor="#ffc46e" stopOpacity="0.55" /><stop offset="1" stopColor="#ffc46e" stopOpacity="0" /></radialGradient>
        <linearGradient id={`${u}-cone`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffe2a6" stopOpacity="0.32" /><stop offset="1" stopColor="#ffe2a6" stopOpacity="0" /></linearGradient>
        <mask id={`${u}-dark`} maskUnits="userSpaceOnUse" x="0" y="0" width="1200" height="800">
          <rect width="1200" height="800" fill="#fff" />
          <g filter={`url(#${u}-blur)`}>{lights.map((l, i) => <ellipse key={i} cx={l.x} cy={l.y} rx={l.rx} ry={l.ry} fill="#000" opacity={l.k ?? 1} />)}</g>
        </mask>
      </defs>

      <rect width="1200" height={FLOOR} fill={m.wall} />
      <rect width="1200" height={FLOOR} fill={`url(#${u}-wall)`} />
      <rect y={FLOOR} width="1200" height={800 - FLOOR} fill={m.floor ?? '#a98863'} />
      {Array.from({ length: 4 }, (_, i) => <line key={i} x1="0" x2="1200" y1={FLOOR + 10 + i * 14} y2={FLOOR + 10 + i * 14} stroke="#000" strokeOpacity="0.08" />)}
      <rect y={FLOOR - cm(8)} width="1200" height={cm(8)} fill="#f6f1e8" />
      <rect y={FLOOR - cm(8)} width="1200" height={cm(8)} fill="#000" opacity="0.06" />

      {m.draw(c, t)}
      {m.plant && <Plant x={m.plant} />}
      {m.person !== false && furn !== 'none' && <Person x={1125} />}
      {m.person && furn === 'none' && <Person x={110} />}
      {furn === 'sofa' && <Sofa />}
      {furn === 'console' && <Console />}
      {furn === 'bench' && <Bench />}
      {m.front?.(c, t)}

      {ev && (
        <g>
          <rect width="1200" height="800" fill="#0a0c18" opacity="0.7" mask={`url(#${u}-dark)`} />
          <g style={{ mixBlendMode: 'screen' }}>
            {lights.filter((l) => l.cone).map((l, i) => <path key={`c${i}`} d={`M${l.x - 14} 0 L${l.x + 14} 0 L${l.x + l.rx * 0.8} ${l.y + l.ry * 0.5} L${l.x - l.rx * 0.8} ${l.y + l.ry * 0.5}Z`} fill={`url(#${u}-cone)`} />)}
            {lights.map((l, i) => <ellipse key={i} cx={l.x} cy={l.y} rx={l.rx * 0.9} ry={l.ry * 0.9} fill={`url(#${u}-warm)`} opacity={0.3 * (l.k ?? 1)} />)}
          </g>
        </g>
      )}

      {dims && (
        <g className="dw-dims" fontSize="15" fill="#c2410c" stroke="none">
          <line x1={g.L} x2={g.R} y1={g.T - 26} y2={g.T - 26} stroke="#c2410c" strokeWidth="1.5" />
          <line x1={g.L} x2={g.L} y1={g.T - 34} y2={g.T - 18} stroke="#c2410c" strokeWidth="1.5" />
          <line x1={g.R} x2={g.R} y1={g.T - 34} y2={g.T - 18} stroke="#c2410c" strokeWidth="1.5" />
          <text x={(g.L + g.R) / 2} y={g.T - 33} textAnchor="middle" style={{ paintOrder: 'stroke' }} stroke="#fff" strokeWidth="4">{Math.round((g.R - g.L) / K)} cm</text>
          <line x1="40" x2="40" y1={FLOOR} y2={centre} stroke="#c2410c" strokeWidth="1.5" strokeDasharray="6 4" />
          <line x1="32" x2={g.L - 10} y1={centre} y2={centre} stroke="#c2410c" strokeWidth="1" strokeDasharray="3 5" />
          <text x="48" y={(FLOOR + centre) / 2} style={{ paintOrder: 'stroke' }} stroke="#fff" strokeWidth="4">{Math.round((FLOOR - centre) / K)} cm to centre</text>
        </g>
      )}
    </svg>
  );
}

/** A single painting stand-in, for the hero. */
export function Painting({ which, photo }: { which: Which; photo?: string }) {
  const vbH = which === 'sh' ? 136 : 144;
  return (
    <svg viewBox={`0 0 100 ${vbH}`} className="dw-painting" role="img" aria-label={which}>
      {photo ? <image href={photo} width="100" height={vbH} preserveAspectRatio="xMidYMid slice" /> : <StandIn which={which} />}
    </svg>
  );
}
