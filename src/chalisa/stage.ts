/**
 * Shared staging for the scenes: the beat a scene is given each frame, and
 * the set pieces several scenes reuse — the shrine arch, the floor band, the
 * page border, the heart-lotus.
 */
import { C, type G, PW, PH, archPath, fs, circle, line, star4, swirlP, zigP, floretP, lotus, clamp, seg, glory } from './kit';
import { type Fig, HANUMAN } from './figures';
import type { Verse } from './text';

export interface Beat {
  t: number;      // seconds since the verse began
  d: number;      // verse length, seconds
  p: number;      // 0 → 1 across the verse
  c: number[];    // progress through each charan (0 before, 1 after)
  ci: number;     // the charan being sung, or −1 before the first
  w: number;      // index of the word being sung within that charan (−1 between)
  v: Verse;
}
export type Scene = (g: G, b: Beat) => void;

export const H = (o: Partial<Fig> = {}): Fig => ({ ...HANUMAN, x: 0, y: 0, s: 1, ...o });
export const F = (look: object, o: Partial<Fig>): Fig => ({ ...(look as Fig), x: 0, y: 0, s: 1, ...o });

/** Stage time inside a charan: 0 at its start, 1 at its end, with a lead-in. */
export const at = (b: Beat, i: number, lead = 0) => clamp(b.c[i] + lead);
/** Progress across the gap before charan i begins (useful for anticipation). */
export const pre = (b: Beat, i: number, secs = 1) => i === 0 ? clamp(b.t / secs) : clamp(b.c[i - 1] * 1.0);

/** A cusped-arch shrine: patterned border, inner field, garlands. */
export function shrine(g: G, x: number, y: number, w: number, h: number, inner: string | CanvasPattern = C.blush, t = 0) {
  archPath(g, x, y, w + 70, h + 50, 6); fs(g, C.gold, C.ink, 3);
  archPath(g, x, y, w + 46, h + 32, 6); fs(g, C.vermilion, C.ink, 2);
  archPath(g, x, y, w + 26, h + 16, 6); fs(g, floretP(g, C.gold, C.vermilion, 22), C.ink, 2);
  archPath(g, x, y, w, h, 6); fs(g, inner, C.ink, 3);
  // finial
  g.beginPath(); g.moveTo(x - 16, y - h - 34); g.quadraticCurveTo(x, y - h - 80, x + 16, y - h - 34); fs(g, C.gold, C.ink, 2);
  circle(g, x, y - h - 70, 7, C.vermilion, C.ink, 1.5);
  void t;
}
/** A floor band across the bottom: patterned, with a scalloped top edge. */
export function floor(g: G, y: number, col = C.maroon, fg = 'rgba(255,170,190,0.55)') {
  g.fillStyle = zigP(g, col, fg, 26); g.fillRect(-400, y, PW + 800, PH - y + 400);
  g.strokeStyle = C.ink; g.lineWidth = 3; g.beginPath(); g.moveTo(-400, y); g.lineTo(PW + 400, y); g.stroke();
}
/** Pillars either side of a shrine. */
export function pillar(g: G, x: number, y: number, h: number, w = 34) {
  g.beginPath(); g.rect(x - w / 2, y - h, w, h); fs(g, floretP(g, C.gold, C.vermilion, 18), C.ink, 2.4);
  g.beginPath(); g.rect(x - w / 2 - 8, y - h - 14, w + 16, 16); fs(g, C.vermilion, C.ink, 2);
  g.beginPath(); g.rect(x - w / 2 - 8, y - 16, w + 16, 16); fs(g, C.vermilion, C.ink, 2);
  lotus(g, x, y - h - 14, 0.5, 1, C.pink, C.rani);
}
/** The night ground used by many scenes, filling the page. */
export function night(g: G) { g.fillStyle = swirlP(g); g.fillRect(-600, -600, PW + 1200, PH + 1200); }
/** A heart-lotus: a glowing lotus inside a chest, opened by `o`. */
export function heartLotus(g: G, x: number, y: number, r: number, o: number, t: number) {
  g.save(); g.globalAlpha = o;
  glory(g, x, y, r * 0.6, r * 1.2, t, 20, [C.gold, C.cream]);
  circle(g, x, y, r * 0.75, C.blush, C.ink, 2);
  lotus(g, x, y + r * 0.45, r / 60, o, C.pink, C.rani);
  g.restore();
}
/** Little motion lines (speed). */
export function speed(g: G, x: number, y: number, len: number, n: number, t: number, col = 'rgba(255,255,255,0.8)') {
  for (let i = 0; i < n; i++) { const yy = y + (i - n / 2) * 18, ph = ((t * 3 + i * 0.37) % 1); g.globalAlpha = 1 - ph; line(g, [[x - ph * len * 0.4, yy], [x - len - ph * len * 0.4, yy]], col, 3); }
  g.globalAlpha = 1;
}
export function twinkle(g: G, x: number, y: number, s: number, t: number, col = C.fire2) { g.fillStyle = col; g.globalAlpha = 0.5 + 0.5 * Math.sin(t * 6 + x); star4(g, x, y, s); g.globalAlpha = 1; }
export const ease01 = seg;
export { PW, PH };
