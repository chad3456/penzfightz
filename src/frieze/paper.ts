/**
 * The page everything is drawn on.
 *
 * Ruled feint, a red margin, and the grain of cheap exercise-book paper. It is
 * not a backdrop — it is the thing the whole film is about being *on*. Every
 * doodle in the story casts a small shadow onto it, which is the single detail
 * that makes a drawing read as a thing lying on a page rather than a picture
 * of a thing.
 */

export const PAPER = '#f4f2ea';
export const RULE = 'rgba(96, 132, 176, 0.42)';
export const MARGIN = 'rgba(206, 92, 92, 0.5)';
export const INK = '#2b2b2f';

/** Height of one ruled line, in world pixels. Everything else is a multiple. */
export const LINE = 34;
/** Width of one sheet, so the red margins recur like pages. */
export const SHEET = 2400;

let grain: HTMLCanvasElement | null = null;

function grainTile(): HTMLCanvasElement {
  if (grain) return grain;
  const c = document.createElement('canvas');
  c.width = 200;
  c.height = 200;
  const g = c.getContext('2d');
  if (!g) return c;
  const d = g.createImageData(200, 200);
  for (let i = 0; i < 200 * 200; i++) {
    // Paper is fibres, not noise: mostly pale with the occasional darker fleck.
    const base = 236 + Math.random() * 18;
    const fleck = Math.random() < 0.012 ? -30 - Math.random() * 30 : 0;
    const v = Math.max(0, Math.min(255, base + fleck));
    d.data[i * 4] = v;
    d.data[i * 4 + 1] = v - 1;
    d.data[i * 4 + 2] = v - 5;
    d.data[i * 4 + 3] = 255;
  }
  g.putImageData(d, 0, 0);
  grain = c;
  return c;
}

/**
 * Rule the visible part of the page.
 *
 * Drawn in world coordinates and clipped by the camera, so the lines stay put
 * as the film travels along the frieze rather than sliding with it — which is
 * what tells the eye it is one very long page and not a series of pictures.
 */
export function rulePaper(
  g: CanvasRenderingContext2D,
  x0: number, y0: number, w: number, h: number,
) {
  g.fillStyle = PAPER;
  g.fillRect(x0, y0, w, h);

  g.lineWidth = 1.1;
  g.strokeStyle = RULE;
  const first = Math.floor(y0 / LINE) * LINE;
  g.beginPath();
  for (let y = first; y < y0 + h + LINE; y += LINE) {
    g.moveTo(x0, y);
    g.lineTo(x0 + w, y);
  }
  g.stroke();

  g.lineWidth = 1.6;
  g.strokeStyle = MARGIN;
  const firstSheet = Math.floor(x0 / SHEET) * SHEET;
  g.beginPath();
  for (let x = firstSheet; x < x0 + w + SHEET; x += SHEET) {
    // Two rules at the margin, the way an exercise book prints them.
    g.moveTo(x + SHEET * 0.055, y0);
    g.lineTo(x + SHEET * 0.055, y0 + h);
    g.moveTo(x + SHEET * 0.062, y0);
    g.lineTo(x + SHEET * 0.062, y0 + h);
  }
  g.stroke();
}

/** Paper grain over the top of everything, in screen space. */
export function grainOver(g: CanvasRenderingContext2D, w: number, h: number, alpha = 0.5) {
  const tile = grainTile();
  g.save();
  g.globalCompositeOperation = 'multiply';
  g.globalAlpha = alpha;
  for (let y = 0; y < h; y += tile.height) {
    for (let x = 0; x < w; x += tile.width) g.drawImage(tile, x, y);
  }
  g.restore();
}

let waxTile: HTMLCanvasElement | null = null;

/**
 * Wax over the whole frame.
 *
 * Crayon grain belongs to the page rather than to each stroke, so it goes on
 * once at the end instead of being clipped into every one of the two hundred
 * doodles a frame contains.
 */
export function waxOver(g: CanvasRenderingContext2D, w: number, h: number, alpha = 0.3) {
  if (!waxTile) {
    const c = document.createElement('canvas');
    c.width = 180;
    c.height = 180;
    const t = c.getContext('2d');
    if (t) {
      t.fillStyle = '#fff';
      t.fillRect(0, 0, 180, 180);
      for (let i = 0; i < 1400; i++) {
        const x = Math.random() * 180;
        const y = Math.random() * 180;
        const len = 4 + Math.random() * 20;
        t.strokeStyle = `rgba(0,0,0,${0.03 + Math.random() * 0.07})`;
        t.lineWidth = 0.6 + Math.random() * 1.6;
        t.beginPath();
        t.moveTo(x, y);
        t.lineTo(x + len * 0.94, y + len * 0.2);
        t.stroke();
      }
    }
    waxTile = c;
  }
  g.save();
  g.globalCompositeOperation = 'multiply';
  g.globalAlpha = alpha;
  for (let y = 0; y < h; y += waxTile.height) {
    for (let x = 0; x < w; x += waxTile.width) g.drawImage(waxTile, x, y);
  }
  g.restore();
}

/** The soft darkening at the corners of a lens, kept very light here. */
export function vignette(g: CanvasRenderingContext2D, w: number, h: number, strength = 0.3) {
  const grad = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.32, w / 2, h / 2, Math.max(w, h) * 0.72);
  grad.addColorStop(0, 'rgba(40, 34, 24, 0)');
  grad.addColorStop(1, `rgba(40, 34, 24, ${strength})`);
  g.fillStyle = grad;
  g.fillRect(0, 0, w, h);
}
