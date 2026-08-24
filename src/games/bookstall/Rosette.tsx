import { useEffect, useRef } from 'react';
import { drawRosette } from './rosette';

/**
 * A printer's flower, stamped onto the bill.
 *
 * Drawn once per seed onto a canvas at device resolution. It is decoration and
 * carries no information, so it is hidden from screen readers rather than
 * described.
 */
export function Rosette({
  seed,
  size = 96,
  ink = '#2f323a',
}: {
  seed: string;
  size?: number;
  ink?: string;
}) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = Math.round(size * dpr);
    c.height = Math.round(size * dpr);
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);
    drawRosette(ctx, size, seed, ink);
  }, [seed, size, ink]);

  return (
    <canvas
      ref={ref}
      className="rcpt__flower"
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  );
}
