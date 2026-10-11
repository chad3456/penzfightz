/**
 * The editorial furniture every model plate shares: a title panel with the
 * model's one-sentence definition and where it comes from, numbered badges
 * placed on the drawing, and a key that names each number. Each badge is
 * also a hotspot in the gallery, carrying a fuller explanation.
 */
import { type G, INK, inkFill, ln, SERIF, rng } from '../walks/kit';
import { type Who } from '../walks/stage';

export const W = 2400, H = 1600;
export const CINZEL = `"Cinzel", ${SERIF}`;

/** Set text in lines no wider than maxW; returns the y below the last line. */
export function wrap(g: G, text: string, x: number, y: number, maxW: number, lh: number, draw = true) {
  const words = text.split(' '); let line = '', yy = y;
  for (const w of words) {
    const t = line ? line + ' ' + w : w;
    if (g.measureText(t).width > maxW && line) { if (draw) g.fillText(line, x, yy); line = w; yy += lh; } else line = t;
  }
  if (line) { if (draw) g.fillText(line, x, yy); yy += lh; }
  return yy;
}

export interface Note { n: number; title: string; line: string }

/** A numbered badge at (x, y); registers its hotspot. */
export function badge(g: G, who: Who[], x: number, y: number, note: Note, fill = '#d9493f', ink = INK, r = 24) {
  g.beginPath(); g.arc(x + 3, y + 3, r, 0, Math.PI * 2); g.fillStyle = ink; g.fill();
  g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); inkFill(g, fill, 2.6, ink);
  g.fillStyle = '#fbfaf5'; g.font = `700 ${Math.round(r * 1.15)}px ${CINZEL}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(note.n), x, y + 1);
  g.textBaseline = 'alphabetic'; g.textAlign = 'left';
  who.push({ x, y, r: r + 14, name: `${note.n} · ${note.title}`, line: note.line });
}
/** A badge with a thin leader line to the thing it names. */
export function pin(g: G, who: Who[], x: number, y: number, tx: number, ty: number, note: Note, fill?: string, ink = INK) {
  ln(g, x, y, tx, ty, 2, ink); g.beginPath(); g.arc(tx, ty, 4, 0, Math.PI * 2); g.fillStyle = ink; g.fill();
  badge(g, who, x, y, note, fill, ink);
}

export interface Panel { x: number; y: number; w: number; title: string; def: string; credit: string; paper?: string; ink?: string; accent?: string }
/** The title panel: name, definition, credit. Returns its bottom. */
export function titlePanel(g: G, p: Panel) {
  const paper = p.paper ?? '#fbf6e6', ink = p.ink ?? INK, pad = 30;
  g.font = `italic 30px ${SERIF}`; const defH = wrap(g, p.def, 0, 0, p.w - pad * 2, 38, false);
  g.font = `600 19px ${CINZEL}`; const crH = wrap(g, p.credit.toUpperCase(), 0, 0, p.w - pad * 2, 26, false);
  const h = pad + 64 + 14 + defH + 14 + crH + pad - 30;
  g.beginPath(); g.rect(p.x + 7, p.y + 7, p.w, h); g.fillStyle = ink; g.fill();
  g.beginPath(); g.rect(p.x, p.y, p.w, h); inkFill(g, paper, 2.6, ink);
  g.fillStyle = ink; g.textAlign = 'left'; g.textBaseline = 'alphabetic';
  g.font = `600 58px ${CINZEL}`; g.fillText(p.title, p.x + pad, p.y + pad + 48);
  g.font = `italic 30px ${SERIF}`; let y = wrap(g, p.def, p.x + pad, p.y + pad + 64 + 26, p.w - pad * 2, 38);
  g.fillStyle = p.accent ?? '#a9302a'; g.font = `600 19px ${CINZEL}`; y = wrap(g, p.credit.toUpperCase(), p.x + pad, y + 10, p.w - pad * 2, 26);
  return p.y + h;
}

/** The key: each number and its short name, with a one-line gloss. */
export function keyPanel(g: G, x: number, y: number, w: number, notes: (Note & { gloss: string })[], o: { paper?: string; ink?: string; fill?: string | ((n: number) => string); cols?: number } = {}) {
  const paper = o.paper ?? '#fbf6e6', ink = o.ink ?? INK, cols = o.cols ?? 1, pad = 24, cw = (w - pad * 2) / cols;
  // measure
  const rows: number[] = [];
  g.font = `italic 22px ${SERIF}`;
  notes.forEach((n, i) => { const hgt = 34 + (wrap(g, n.gloss, 0, 0, cw - 64, 27, false)); const r = Math.floor(i / cols); rows[r] = Math.max(rows[r] ?? 0, hgt); });
  const h = pad * 2 + rows.reduce((a, b) => a + b + 10, 0) - 10;
  g.beginPath(); g.rect(x + 7, y + 7, w, h); g.fillStyle = ink; g.fill();
  g.beginPath(); g.rect(x, y, w, h); inkFill(g, paper, 2.6, ink);
  let yy = y + pad;
  rows.forEach((rh, r) => {
    for (let c = 0; c < cols; c++) {
      const n = notes[r * cols + c]; if (!n) continue;
      const xx = x + pad + c * cw, f = typeof o.fill === 'function' ? o.fill(n.n) : o.fill ?? '#d9493f';
      g.beginPath(); g.arc(xx + 20, yy + 18, 18, 0, Math.PI * 2); inkFill(g, f, 2.2, ink);
      g.fillStyle = '#fbfaf5'; g.font = `700 20px ${CINZEL}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(n.n), xx + 20, yy + 19); g.textBaseline = 'alphabetic'; g.textAlign = 'left';
      g.fillStyle = ink; g.font = `600 24px ${CINZEL}`; g.fillText(n.title, xx + 50, yy + 26);
      g.font = `italic 22px ${SERIF}`; wrap(g, n.gloss, xx + 50, yy + 54, cw - 64, 27);
    }
    yy += rh + 10;
  });
  return y + h;
}

/** A speech or thought bubble with text, tail pointing to (tx, ty). */
export function bubble(g: G, x: number, y: number, w: number, text: string, tx: number, ty: number, o: { thought?: boolean; size?: number; fill?: string; ink?: string } = {}) {
  const size = o.size ?? 24, ink = o.ink ?? INK; g.font = `italic ${size}px ${SERIF}`;
  const lines = wrap(g, text, 0, 0, w - 36, size * 1.25, false);
  const h = lines + 22;
  if (o.thought) { for (let k = 0; k < 3; k++) { const t = (k + 1) / 4; const r = 4 + k * 3; g.beginPath(); g.arc(tx + (x + w / 2 - tx) * t * 0.8, ty + (y + h - ty) * t * 0.8, r, 0, Math.PI * 2); inkFill(g, o.fill ?? '#fbfaf5', 2, ink); } }
  g.beginPath(); g.roundRect(x, y, w, h, o.thought ? h / 2.4 : 14);
  if (!o.thought) { const cx = Math.max(x + 30, Math.min(x + w - 30, tx)); const below = ty > y + h; if (below) { g.moveTo(cx - 14, y + h); g.lineTo(tx, ty); g.lineTo(cx + 14, y + h); } else { g.moveTo(cx - 14, y); g.lineTo(tx, ty); g.lineTo(cx + 14, y); } }
  inkFill(g, o.fill ?? '#fbfaf5', 2.4, ink);
  if (!o.thought) { const cx = Math.max(x + 30, Math.min(x + w - 30, tx)); g.fillStyle = o.fill ?? '#fbfaf5'; g.fillRect(cx - 13, ty > y + h ? y + h - 3 : y, 26, 4); }
  g.fillStyle = ink; g.textAlign = 'left'; g.font = `italic ${size}px ${SERIF}`; wrap(g, text, x + 18, y + size + 6, w - 36, size * 1.25);
}

/** Paper with a soft grain and a few fibres. */
export function paperBg(g: G, col: string, seed = 1) {
  g.fillStyle = col; g.fillRect(0, 0, W, H);
  const R = rng(seed); g.fillStyle = 'rgba(31,26,23,0.035)'; for (let i = 0; i < 3000; i++) g.fillRect(R() * W, R() * H, 2, 2);
}
