import { glow, rng, stipple } from '../paint';
import { spadePath } from './art';
import type { Mark } from './story';

/**
 * The bronze spade itself, big: what is under the crust, and the marks that
 * three centuries have cut into it — a character, two initials, the angular
 * script of another world, and a bright place rubbed clean.
 */

export type Under = 'gold' | 'old';

/** The metal under the patina, with whatever marks it carries. */
export function drawMetal(g: CanvasRenderingContext2D, W: number, H: number, under: Under, marks: Set<Mark>, seed = 3) {
  const R = rng(seed);
  const s = Math.min(W, H) * 0.9, cx = W / 2, cy = H / 2 + s * 0.03;
  const p = spadePath(cx, cy, s);
  g.save();
  g.fillStyle = under === 'gold' ? '#d9a93a' : '#6b5238';
  g.fill(p, 'evenodd');
  g.clip(p, 'evenodd');
  const gr = g.createLinearGradient(cx - s / 2, cy - s / 2, cx + s / 2, cy + s / 2);
  if (under === 'gold') { gr.addColorStop(0, 'rgba(255,240,170,0.9)'); gr.addColorStop(0.5, 'rgba(230,180,70,0.2)'); gr.addColorStop(1, 'rgba(150,100,30,0.5)'); }
  else { gr.addColorStop(0, 'rgba(150,120,90,0.6)'); gr.addColorStop(1, 'rgba(40,30,20,0.6)'); }
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  stipple(g, 0, 0, W, H, under === 'gold' ? 'rgba(255,250,210,0.5)' : 'rgba(40,30,20,0.5)', 20, R, Math.max(1, s * 0.006));
  g.restore();
  g.strokeStyle = under === 'gold' ? '#8a6420' : '#3a2a1a'; g.lineWidth = Math.max(1.5, s * 0.008); g.stroke(p);
  drawMarks(g, cx, cy, s, marks, under === 'gold' ? 'rgba(90,60,20,0.85)' : 'rgba(220,200,160,0.8)');
}

/** The marks, scratched in: 字 (the father's reading), F·C, the first people's hooks, and the gleam. */
export function drawMarks(g: CanvasRenderingContext2D, cx: number, cy: number, s: number, marks: Set<Mark>, ink: string) {
  g.save();
  g.strokeStyle = ink; g.lineCap = 'round'; g.lineJoin = 'round';
  g.lineWidth = Math.max(1.2, s * 0.012);
  const line = (pts: [number, number][]) => { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(cx + x * s, cy + y * s) : g.moveTo(cx + x * s, cy + y * s))); g.stroke(); };
  if (marks.has('zi')) {
    // 字, cut small on the left of the blade
    const o: [number, number] = [-0.22, 0.12], k = 0.2;
    const L = (pts: [number, number][]) => line(pts.map(([x, y]) => [o[0] + x * k, o[1] + y * k] as [number, number]));
    L([[0, -0.5], [0.04, -0.4]]); L([[-0.45, -0.25], [-0.45, -0.12]]); L([[-0.45, -0.25], [0.45, -0.25], [0.4, -0.12]]);
    L([[-0.25, -0.05], [0.25, -0.05], [0, 0.1]]); L([[0, 0.1], [0, 0.5], [-0.1, 0.44]]); L([[-0.42, 0.22], [0.42, 0.22]]);
  }
  if (marks.has('initials')) {
    // F and C, scratched with a beach stone
    const o: [number, number] = [0.14, 0.1], k = 0.1;
    const L = (pts: [number, number][]) => line(pts.map(([x, y]) => [o[0] + x * k, o[1] + y * k] as [number, number]));
    L([[0, -0.6], [0, 0.6]]); L([[0, -0.6], [0.5, -0.6]]); L([[0, -0.05], [0.4, -0.05]]);
    g.beginPath(); g.arc(cx + (o[0] + 1.2 * k) * s, cy + o[1] * s, 0.6 * k * s, Math.PI * 0.3, Math.PI * 1.7); g.stroke();
  }
  if (marks.has('alien')) {
    // the first people's script: straight strokes meeting at sharp and obtuse angles
    const o: [number, number] = [0, 0.4], k = 0.12;
    const L = (pts: [number, number][]) => line(pts.map(([x, y]) => [o[0] + x * k, o[1] + y * k] as [number, number]));
    L([[-1, 0.3], [-0.5, -0.4], [0, 0.3], [0.5, -0.4], [1, 0.3]]); L([[-0.5, -0.4], [-0.2, -0.9]]); L([[0.5, -0.4], [0.9, -0.7], [0.7, -1]]);
  }
  if (marks.has('gleam')) {
    // the place the steam blasted clean, shaped like a little person
    glow(g, cx + 0.02 * s, cy - 0.1 * s, s * 0.12, '#fff6c0', 0.9);
    g.fillStyle = '#fff3b8';
    g.beginPath(); g.arc(cx + 0.02 * s, cy - 0.17 * s, s * 0.022, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.moveTo(cx - 0.01 * s, cy - 0.14 * s); g.lineTo(cx + 0.05 * s, cy - 0.14 * s); g.lineTo(cx + 0.06 * s, cy - 0.06 * s); g.lineTo(cx - 0.02 * s, cy - 0.06 * s); g.closePath(); g.fill();
  }
  g.restore();
}

/** The green crust over it all; a rubbing canvas erases this. */
export function drawPatina(g: CanvasRenderingContext2D, W: number, H: number, seed = 5) {
  const R = rng(seed);
  const s = Math.min(W, H) * 0.9, cx = W / 2, cy = H / 2 + s * 0.03;
  const p = spadePath(cx, cy, s);
  g.save();
  g.fillStyle = '#5f8a73'; g.fill(p, 'evenodd');
  g.clip(p, 'evenodd');
  stipple(g, 0, 0, W, H, '#3f6b58', 60, R, Math.max(1, s * 0.01));
  stipple(g, 0, 0, W, H, '#9cc2a4', 45, R, Math.max(1, s * 0.01));
  stipple(g, 0, 0, W, H, '#c4dcc0', 10, R, Math.max(1, s * 0.016));
  g.restore();
}

/** The little coin in the corner of the screen, with every mark so far. */
export function drawInventory(c: HTMLCanvasElement, marks: Set<Mark>) {
  const g = c.getContext('2d')!;
  g.clearRect(0, 0, c.width, c.height);
  drawPatina(g, c.width, c.height);
  const s = Math.min(c.width, c.height) * 0.9;
  drawMarks(g, c.width / 2, c.height / 2 + s * 0.03, s, marks, 'rgba(250,236,190,0.95)');
}
