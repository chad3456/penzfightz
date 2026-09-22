/**
 * The hand that labels the map.
 *
 * The letterforms are the ones from `claudddy/hand.ts` — stored as the strokes
 * a hand makes, in the order a hand makes them — but drawn here with the ink
 * nib rather than with graphite, because the graphite engine only knows how to
 * be grey and this map is brown. Same skeleton, different instrument, which is
 * exactly the relationship between a pencil note and a fair copy in ink.
 *
 * Everything is still seeded from the letter's position in the line, so no two
 * 'e's on the sheet are the same 'e'.
 */

import { GLYPHS } from '../claudddy/hand';
import { line, type Nib, type Pt } from './paper';

export interface ScribeOptions {
  /** Height of one em, in pixels. */
  size: number;
  nib: Nib;
  tracking?: number;
  slant?: number;
  waver?: number;
  seed?: number;
  align?: 'left' | 'center' | 'right';
  /** Radians. Rotates the whole line about its anchor. */
  angle?: number;
}

export function measure(text: string, tracking = 0.04): number {
  let w = 0;
  for (const ch of text) w += (GLYPHS[ch] ?? GLYPHS[ch.toLowerCase()] ?? GLYPHS[' ']!).w + tracking;
  return w;
}

/** Write a line of ink. Returns how wide it came out, in pixels. */
export function scribe(
  g: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  o: ScribeOptions,
): number {
  const em = o.size;
  if (em < 3.5) return 0; // below this it is a smudge, and a slow one
  const tracking = o.tracking ?? 0.04;
  const slant = o.slant ?? 0.1;
  const waver = o.waver ?? 0.016;
  const seed = o.seed ?? 1;
  const total = measure(text, tracking) * em;

  g.save();
  g.translate(x, y);
  if (o.angle) g.rotate(o.angle);

  let pen = o.align === 'center' ? -total / 2 : o.align === 'right' ? -total : 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    const gl = GLYPHS[ch] ?? GLYPHS[ch.toLowerCase()] ?? GLYPHS[' ']!;
    const s = seed * 131 + i * 17;
    const dy = (Math.sin(s * 0.7) + Math.sin(s * 1.9) * 0.5) * waver * em;
    const sx = 1 + Math.sin(s * 2.3) * 0.025;
    const sl = slant + Math.sin(s * 3.1) * 0.02;
    for (const [k, stroke] of gl.s.entries()) {
      const path: Pt[] = stroke.map(([ux, uy]) => [
        pen + ux * em * sx + (0.78 - uy) * em * sl,
        (uy - 0.78) * em + dy,
      ]);
      line(g, path, o.nib, s + k * 7);
    }
    pen += (gl.w + tracking) * em * sx;
  }
  g.restore();
  return total;
}
