import { HB, mark, paper, pencil, rng, smooth, type Pt } from '../pencil/graphite';
import { drawShot, type Box } from './stage';
import type { Balloon, Page, Panel } from './script';

/**
 * A page: borders, then panels, then the lettering over the top.
 *
 * Order matters and it is the order a page is actually made in. Art goes under
 * the balloons because a balloon is opaque and covers whatever it lands on, and
 * a balloon placed first would have to be drawn around. Borders go first
 * because everything else is clipped to them.
 *
 * ── Lettering ────────────────────────────────────────────────────────────
 *
 * Upper case, tight, and set on a baseline that wanders by a fraction of a
 * pixel per character. That wander is the whole difference between lettering
 * and typesetting: hand-drawn caps are never quite on the line, and a perfectly
 * straight run of them in a pencil drawing looks like a caption pasted on.
 *
 * Balloons are drawn as a wobbling ellipse rather than a smooth one, and the
 * tail is a filled triangle that starts inside the balloon so no seam shows
 * where the two meet.
 */

const INK = '#23201c';
const PAPER = '#f2f0ea';

export const PAGE_ASPECT = 0.68;

const LETTER = (px: number, weight = 700) =>
  `${weight} ${px}px "Trebuchet MS", "Segoe UI", ui-sans-serif, sans-serif`;

/** Wrap to a width, honouring *emphasis* as a word-level marker. */
function wrap(g: CanvasRenderingContext2D, text: string, max: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w;
    if (g.measureText(test.replace(/\*/g, '')).width > max && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = test;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

/**
 * Draw a run of caps with a wandering baseline.
 *
 * Emphasis is `*like this*`, and it is drawn as a heavier weight rather than an
 * italic: comic lettering has no italic, it has a bolder pen.
 */
function letter(
  g: CanvasRenderingContext2D, text: string, x: number, y: number, size: number,
  seed: number, align: CanvasTextAlign = 'left',
) {
  const r = rng(seed);
  const parts = text.split('*');
  // Measure the whole run first so a centred line is actually centred.
  let total = 0;
  parts.forEach((piece, i) => {
    g.font = LETTER(size, i % 2 ? 800 : 600);
    total += g.measureText(piece).width;
  });
  let cx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;

  parts.forEach((piece, i) => {
    g.font = LETTER(size, i % 2 ? 800 : 600);
    g.textAlign = 'left';
    for (const ch of piece) {
      const w = g.measureText(ch).width;
      g.save();
      g.translate(cx, y + (r() - 0.5) * size * 0.075);
      g.rotate((r() - 0.5) * 0.022);
      g.fillText(ch, 0, 0);
      g.restore();
      cx += w;
    }
  });
}

function balloonShape(cx: number, cy: number, rx: number, ry: number, seed: number): Pt[] {
  const r = rng(seed);
  const pts: Pt[] = [];
  for (let i = 0; i < 22; i++) {
    const a = (i / 22) * Math.PI * 2;
    const k = 1 + (r() - 0.5) * 0.07;
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  pts.push(pts[0]!);
  return smooth(pts, 5);
}

function drawBalloon(g: CanvasRenderingContext2D, b: Balloon, panel: Box, seed: number) {
  const size = Math.max(8.5, Math.min(panel.w, panel.h) * 0.052);
  g.font = LETTER(size);
  const maxW = Math.min(panel.w * 0.62, 260);
  const lines = wrap(g, b.text, maxW);
  const lineH = size * 1.22;
  const textW = Math.max(...lines.map((l) => {
    g.font = LETTER(size);
    return g.measureText(l.replace(/\*/g, '')).width;
  }));
  const cx = panel.x + panel.w * b.at[0];
  const cy = panel.y + panel.h * b.at[1];
  const rx = textW / 2 + size * 1.15;
  const ry = (lines.length * lineH) / 2 + size * 0.95;

  const p = pencil(HB, { press: 0.7, size: 1.6, passes: 2, wobble: 0.5 });
  const shape = balloonShape(cx, cy, rx, ry, seed);

  // The tail first, so its fill is under the balloon's own fill and the join
  // between them never shows as a seam.
  if (b.tail) {
    const tx = panel.x + panel.w * b.tail[0];
    const ty = panel.y + panel.h * b.tail[1];
    const ang = Math.atan2(ty - cy, tx - cx);
    const spread = 0.3;
    const a: Pt = [cx + Math.cos(ang - spread) * rx * 0.92, cy + Math.sin(ang - spread) * ry * 0.92];
    const c: Pt = [cx + Math.cos(ang + spread) * rx * 0.92, cy + Math.sin(ang + spread) * ry * 0.92];
    g.fillStyle = PAPER;
    g.beginPath();
    g.moveTo(a[0], a[1]);
    g.lineTo(tx, ty);
    g.lineTo(c[0], c[1]);
    g.closePath();
    g.fill();
    g.fillStyle = INK;
    mark(g, [a, [tx, ty]], p, seed + 1, { flat: true });
    mark(g, [[tx, ty], c], p, seed + 2, { flat: true });
  }

  g.fillStyle = PAPER;
  g.beginPath();
  g.moveTo(shape[0]![0], shape[0]![1]);
  for (const [x, y] of shape.slice(1)) g.lineTo(x, y);
  g.closePath();
  g.fill();

  g.fillStyle = INK;
  if (b.style === 'think') {
    // A thought is a chain of circles, not a line.
    for (let i = 0; i < 22; i++) {
      const a = (i / 22) * Math.PI * 2;
      const px = cx + Math.cos(a) * rx;
      const py = cy + Math.sin(a) * ry;
      mark(g, balloonShape(px, py, size * 0.3, size * 0.3, seed + i), pencil(p, { passes: 1, press: 0.5 }), seed + 50 + i, { flat: true });
    }
  } else {
    mark(g, shape, p, seed + 3, { flat: true });
  }

  g.fillStyle = INK;
  const top = cy - ((lines.length - 1) * lineH) / 2;
  lines.forEach((l, i) => letter(g, l, cx, top + i * lineH + size * 0.34, size, seed + 10 + i, 'center'));
}

function captionBox(
  g: CanvasRenderingContext2D, text: string, panel: Box, seed: number, atBottom: boolean,
) {
  const size = Math.max(7.5, Math.min(panel.w, panel.h) * 0.044);
  g.font = LETTER(size, 600);
  const pad = size * 0.72;
  const maxW = panel.w - pad * 4;
  const lines = wrap(g, text, maxW);
  const lineH = size * 1.2;
  const boxH = lines.length * lineH + pad * 1.5;
  const x = panel.x + pad * 0.8;
  const y = atBottom ? panel.y + panel.h - boxH - pad * 0.8 : panel.y + pad * 0.8;
  const w = panel.w - pad * 1.6;

  g.fillStyle = PAPER;
  g.fillRect(x, y, w, boxH);
  g.fillStyle = INK;
  const p = pencil(HB, { press: 0.6, size: 1.4, passes: 2, wobble: 0.6 });
  mark(g, [[x, y], [x + w, y], [x + w, y + boxH], [x, y + boxH], [x, y]], p, seed, { flat: true });
  lines.forEach((l, i) => letter(g, l, x + pad, y + pad * 0.9 + i * lineH + size * 0.72, size, seed + 5 + i));
}

function drawPanel(g: CanvasRenderingContext2D, panel: Panel, page: Box, seed: number, gutter: number) {
  const b: Box = {
    x: page.x + panel.at[0] * page.w + gutter / 2,
    y: page.y + panel.at[1] * page.h + gutter / 2,
    w: panel.at[2] * page.w - gutter,
    h: panel.at[3] * page.h - gutter,
  };

  drawShot(g, panel.shot, b, seed);

  // The border last of the art, so nothing bleeds over it.
  const p = pencil(HB, { press: 0.85, size: 2.2, passes: 2, wobble: 0.7 });
  mark(g, [[b.x, b.y], [b.x + b.w, b.y], [b.x + b.w, b.y + b.h], [b.x, b.y + b.h], [b.x, b.y]],
    p, seed + 900, { flat: true });

  if (panel.caption) captionBox(g, panel.caption, b, seed + 910, false);
  if (panel.footer) captionBox(g, panel.footer, b, seed + 920, true);
  for (const [i, bal] of (panel.balloons ?? []).entries()) drawBalloon(g, bal, b, seed + 930 + i * 7);

  if (panel.sfx) {
    g.save();
    g.fillStyle = INK;
    g.globalAlpha = 0.5;
    const size = Math.min(b.w, b.h) * 0.12;
    g.font = `italic 700 ${size}px "Trebuchet MS", ui-sans-serif, sans-serif`;
    g.textAlign = 'right';
    g.fillText(panel.sfx, b.x + b.w - size * 0.5, b.y + b.h - size * 0.4);
    g.restore();
  }
}

export function drawPage(
  g: CanvasRenderingContext2D, page: Page, w: number, h: number, seed = 1,
) {
  paper(g, w, h, seed * 29 + 3);
  g.fillStyle = INK;

  const margin = Math.min(w, h) * 0.045;
  const headroom = h * 0.036;
  const area: Box = {
    x: margin,
    y: margin + headroom,
    w: w - margin * 2,
    h: h - margin * 2 - headroom * 1.6,
  };
  const gutter = Math.max(5, w * 0.016);

  // The page furniture: issue title on the left, page number on the right.
  g.save();
  g.fillStyle = INK;
  g.globalAlpha = 0.5;
  const t = Math.max(7, w * 0.016);
  g.font = LETTER(t, 700);
  g.textAlign = 'left';
  g.fillText(page.title ?? '', margin, margin + t * 0.9);
  g.textAlign = 'right';
  g.fillText(String(page.n), w - margin, h - margin * 0.45);
  g.globalAlpha = 1;
  g.restore();

  for (const [i, panel] of page.panels.entries()) {
    drawPanel(g, panel, area, seed * 101 + i * 13, gutter);
  }
}

/** One page, at a width. */
export function printPage(page: Page, width: number, seed = 1): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = Math.round(width / PAGE_ASPECT);
  const g = canvas.getContext('2d');
  if (g) drawPage(g, page, canvas.width, canvas.height, seed);
  return canvas;
}
