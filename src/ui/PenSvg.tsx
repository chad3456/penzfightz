import { useMemo } from 'react';
import type { PenSpec } from '../game/pens';

/**
 * The same pen, flat.
 *
 * Menus need a pen you can read at a glance — in the tin, on the team sheet, in
 * a result card — and a 3D canvas per row would be absurd. This draws the same
 * anatomy as `PenModel` in SVG, from the same spec, so the pen in the box is
 * recognisably the pen on the desk.
 */

const VW = 220;
const VH = 30;

export function PenSvg({
  pen,
  flip = false,
  className,
}: {
  pen: PenSpec;
  /** Nib pointing left instead of right. */
  flip?: boolean;
  className?: string;
}) {
  const g = useMemo(() => {
    // Scale the real pen so the longest in the roster fills the frame.
    const scale = (pen.length / 0.152) * 0.97;
    const len = VW * scale;
    const x0 = (VW - len) / 2;
    const r = (pen.radius / 0.0061) * 6.4; // barrel half-height in view units
    const cy = VH / 2;

    const nib = len * 0.045;
    const cone = len * 0.07;
    const grip = pen.hasGrip ? len * 0.17 : len * 0.1;
    const cap = len * 0.3;
    const barrel = len - nib - cone - grip - cap * 0.42;

    // measured from the nib end, which sits at x0 + len
    const xNibEnd = x0 + len;
    const xConeEnd = xNibEnd - nib;
    const xGripEnd = xConeEnd - cone;
    const xBarrelEnd = xGripEnd - grip;
    const xCapStart = x0;

    const gripR = pen.hasGrip ? r * 1.16 : r * 0.94;
    const capR = r * 1.1;

    return {
      r,
      cy,
      capR,
      gripR,
      xNibEnd,
      xConeEnd,
      xGripEnd,
      xBarrelEnd,
      xCapStart,
      nib,
      cone,
      grip,
      barrel,
      cap,
      len,
      x0,
    };
  }, [pen]);

  const opacity = pen.transparent ? 0.78 : 1;
  const id = `pen-${pen.id}`;

  return (
    <svg
      viewBox={`0 0 ${VW} ${VH}`}
      className={className}
      role="img"
      aria-label={pen.name}
      style={flip ? { transform: 'scaleX(-1)' } : undefined}
    >
      <defs>
        <linearGradient id={`${id}-body`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={pen.bodyColor} stopOpacity={0.72} />
          <stop offset="38%" stopColor={pen.bodyColor} />
          <stop offset="100%" stopColor="#000" stopOpacity={0.34} />
        </linearGradient>
        <linearGradient id={`${id}-cap`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={pen.capColor} stopOpacity={0.75} />
          <stop offset="40%" stopColor={pen.capColor} />
          <stop offset="100%" stopColor="#000" stopOpacity={0.4} />
        </linearGradient>
        <linearGradient id={`${id}-metal`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e8eaee" />
          <stop offset="50%" stopColor="#a8acb4" />
          <stop offset="100%" stopColor="#6e7178" />
        </linearGradient>
      </defs>

      {/* nib */}
      <path
        d={`M ${g.xNibEnd} ${g.cy} L ${g.xConeEnd} ${g.cy - g.r * 0.42} L ${g.xConeEnd} ${g.cy + g.r * 0.42} Z`}
        fill={`url(#${id}-metal)`}
      />
      {/* cone into the grip */}
      <path
        d={`M ${g.xConeEnd} ${g.cy - g.r * 0.42} L ${g.xGripEnd} ${g.cy - g.gripR} L ${g.xGripEnd} ${g.cy + g.gripR} L ${g.xConeEnd} ${g.cy + g.r * 0.42} Z`}
        fill={pen.inkColor}
      />
      {/* grip */}
      <rect
        x={g.xBarrelEnd}
        y={g.cy - g.gripR}
        width={g.grip}
        height={g.gripR * 2}
        rx={g.gripR * 0.35}
        fill={pen.hasGrip ? pen.gripColor : `url(#${id}-body)`}
      />
      {pen.hasGrip && (
        <g opacity={0.35}>
          {Array.from({ length: 5 }).map((_, i) => (
            <rect
              key={i}
              x={g.xBarrelEnd + g.grip * (0.16 + i * 0.17)}
              y={g.cy - g.gripR * 0.82}
              width={1.4}
              height={g.gripR * 1.64}
              fill="#000"
            />
          ))}
        </g>
      )}
      {/* barrel */}
      <rect
        x={g.xCapStart + g.cap * 0.58}
        y={g.cy - g.r}
        width={g.xBarrelEnd - (g.xCapStart + g.cap * 0.58)}
        height={g.r * 2}
        rx={pen.barrelStyle === 'hex' ? 0.6 : g.r * 0.5}
        fill={`url(#${id}-body)`}
        opacity={opacity}
      />
      {/* printed bands */}
      <rect
        x={g.xBarrelEnd - g.barrel * 0.36}
        y={g.cy - g.r * 1.02}
        width={g.barrel * 0.1}
        height={g.r * 2.04}
        fill={pen.accentColor}
        opacity={0.9}
      />
      <rect
        x={g.xBarrelEnd - g.barrel * 0.52}
        y={g.cy - g.r * 1.02}
        width={g.barrel * 0.035}
        height={g.r * 2.04}
        fill={pen.accentColor}
        opacity={0.6}
      />
      {/* the brand, printed tiny down the barrel like the real thing */}
      <text
        x={g.xBarrelEnd - g.barrel * 0.62}
        y={g.cy + g.r * 0.42}
        textAnchor="end"
        fontSize={Math.max(4.4, g.r * 0.92)}
        fontFamily="'Arial Narrow', Arial, sans-serif"
        fontWeight={700}
        letterSpacing="0.4"
        fill={pen.accentColor}
        opacity={0.92}
      >
        {pen.brand.toUpperCase()}
      </text>

      {/* posted cap */}
      <rect
        x={g.xCapStart}
        y={g.cy - g.capR}
        width={g.cap}
        height={g.capR * 2}
        rx={g.capR * 0.9}
        fill={`url(#${id}-cap)`}
      />
      {/* clip */}
      {pen.hasClip && (
        <rect
          x={g.xCapStart + g.cap * 0.2}
          y={g.cy - g.capR - 1.9}
          width={g.cap * 0.62}
          height={2.6}
          rx={1.3}
          fill={pen.capColor}
        />
      )}
      {/* top highlight so it reads as a cylinder */}
      <rect
        x={g.xCapStart + 1}
        y={g.cy - g.r * 0.72}
        width={g.len - 2}
        height={g.r * 0.34}
        rx={g.r * 0.17}
        fill="#fff"
        opacity={0.2}
      />
    </svg>
  );
}

/**
 * The logo: one pen still on the desk, one going over the edge.
 *
 * The desk is drawn thinner and dimmer than the pens so the eye reads the
 * three shapes in the right order — surface, winner, loser — instead of seeing
 * one long blue bracket.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 96 44" className={className} aria-hidden="true">
      {/* the desk edge, and the drop past it */}
      <path
        d="M3 27 H57 V41"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
        fill="none"
        opacity="0.45"
      />
      {/* the pen that held its ground */}
      <g fill="currentColor">
        <rect x="8" y="19" width="34" height="4.6" rx="2.3" />
        <rect x="11" y="17.4" width="9" height="1.8" rx="0.9" />
        <path d="M42 19 L50 21.3 L42 23.6 Z" />
      </g>
      {/* the pen that did not */}
      <g fill="#c0392b" transform="rotate(42 74 22)">
        <rect x="55" y="19.4" width="30" height="4.6" rx="2.3" />
        <rect x="58" y="17.8" width="8" height="1.8" rx="0.9" />
        <path d="M85 19.4 L93 21.7 L85 24 Z" />
      </g>
    </svg>
  );
}
