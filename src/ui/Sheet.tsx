import { useMemo, type ReactNode } from 'react';
import { BrandMark } from './PenSvg';

/**
 * A page torn out of an exercise book.
 *
 * The tear is generated, not drawn: a seeded zigzag along the top and bottom
 * edges as a clip-path, so no two sheets in the app rip the same way and none
 * of it costs an image request.
 */

function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function tornClip(seed: number, teeth = 30, depth = 7): string {
  const rnd = mulberry(seed);
  const pts: string[] = [];

  // top edge, left to right
  for (let i = 0; i <= teeth; i++) {
    const x = ((i / teeth) * 100).toFixed(2);
    const y = i % 2 === 0 ? (rnd() * depth * 0.5).toFixed(1) : (depth * (0.55 + rnd() * 0.45)).toFixed(1);
    pts.push(`${x}% ${y}px`);
  }
  // bottom edge, right to left
  for (let i = teeth; i >= 0; i--) {
    const x = ((i / teeth) * 100).toFixed(2);
    const d = i % 2 === 0 ? (rnd() * depth * 0.5).toFixed(1) : (depth * (0.55 + rnd() * 0.45)).toFixed(1);
    pts.push(`${x}% calc(100% - ${d}px)`);
  }

  return `polygon(${pts.join(', ')})`;
}

export function Sheet({
  children,
  seed = 7,
  width = 'default',
  torn = true,
  className = '',
}: {
  children: ReactNode;
  seed?: number;
  width?: 'default' | 'narrow' | 'wide';
  torn?: boolean;
  className?: string;
}) {
  const clip = useMemo(() => (torn ? tornClip(seed) : undefined), [seed, torn]);
  const widthClass =
    width === 'narrow' ? ' paper--narrow' : width === 'wide' ? ' paper--wide' : '';

  return (
    <div
      className={`paper${widthClass} ${className}`}
      style={clip ? { clipPath: clip } : undefined}
    >
      {children}
    </div>
  );
}

export function SheetHeader({ subtitle }: { subtitle?: string }) {
  return (
    <>
      <div className="brand">
        <BrandMark className="brand__mark" />
        <span className="brand__word">Pen Fight</span>
      </div>
      <div className="rule" />
      {subtitle && <div className="eyebrow">{subtitle}</div>}
    </>
  );
}

/** A chalkboard panel, for anything that is a score rather than a form. */
export function Slate({ children }: { children: ReactNode }) {
  return <div className="slate">{children}</div>;
}
