import { blob, fillStipple, figure, glow, hexagon, rgba, shade, stipple, type Ctx, type Rng } from '../paint';

/**
 * The things in "Ghost Days" that are drawn more than once: the bronze spade
 * coin (bubi) that passes down three centuries, the six-legged people of
 * Nova Pacifica, a sheet ghost, a paper car, a lantern.
 */

/** The outline of a Zhou spade coin: socket and hole above, shoulders, and a blade with two feet. */
export function spadePath(cx: number, cy: number, s: number) {
  const p = new Path2D();
  const w = s * 0.5, top = cy - s * 0.62, sh = cy - s * 0.18, bot = cy + s * 0.55;
  p.moveTo(cx - s * 0.1, top);
  p.lineTo(cx + s * 0.1, top);
  p.lineTo(cx + s * 0.12, sh - s * 0.06);
  p.quadraticCurveTo(cx + w * 0.7, sh - s * 0.04, cx + w, sh);
  p.lineTo(cx + w * 0.92, bot);
  p.lineTo(cx + w * 0.22, bot);
  p.quadraticCurveTo(cx, cy + s * 0.22, cx - w * 0.22, bot);
  p.lineTo(cx - w * 0.92, bot);
  p.lineTo(cx - w, sh);
  p.quadraticCurveTo(cx - w * 0.7, sh - s * 0.04, cx - s * 0.12, sh - s * 0.06);
  p.closePath();
  // the hole through the socket
  p.moveTo(cx + s * 0.035, top + s * 0.1);
  p.arc(cx, top + s * 0.1, s * 0.035, 0, Math.PI * 2, true);
  return p;
}

/** The coin, crusted in green patina, maybe with a bright place worn through. */
export function spade(g: Ctx, cx: number, cy: number, s: number, R: Rng, o: { rot?: number; gleam?: number; marks?: boolean } = {}) {
  g.save();
  g.translate(cx, cy);
  g.rotate(o.rot ?? 0);
  const p = spadePath(0, 0, s);
  g.shadowColor = 'rgba(40,50,40,0.25)'; g.shadowBlur = s * 0.08; g.shadowOffsetY = s * 0.03;
  g.fillStyle = '#5f8a73'; g.fill(p, 'evenodd');
  g.shadowColor = 'transparent';
  g.save(); g.clip(p, 'evenodd');
  stipple(g, -s, -s, s * 2, s * 2, '#3f6b58', 40, R, Math.max(1, s * 0.012));
  stipple(g, -s, -s, s * 2, s * 2, '#9cc2a4', 30, R, Math.max(1, s * 0.012));
  if (o.gleam) {
    const gr = g.createRadialGradient(s * 0.18, s * 0.2, 0, s * 0.18, s * 0.2, s * 0.35 * o.gleam);
    gr.addColorStop(0, '#fff2b0'); gr.addColorStop(0.4, '#e3b848'); gr.addColorStop(1, 'rgba(200,150,40,0)');
    g.fillStyle = gr; g.fillRect(-s, -s, s * 2, s * 2);
  }
  g.restore();
  g.strokeStyle = '#34503f'; g.lineWidth = Math.max(1, s * 0.015); g.stroke(p);
  g.restore();
}

/**
 * One of the first people of Nova Pacifica: a low body on six legs, and a
 * head of twelve tentacles, each tipped with a black eye.
 */
export function alien(g: Ctx, x: number, y: number, h: number, R: Rng, o: { gaze?: boolean; color?: string; small?: boolean; facing?: 1 | -1; alpha?: number } = {}) {
  const col = o.color ?? ['#cfd8e8', '#d8cfe6', '#c9e2dc', '#e6dccb'][Math.floor(R() * 4)]!;
  const f = o.facing ?? 1;
  g.save();
  g.globalAlpha = o.alpha ?? 1;
  g.translate(x, y); g.scale(f, 1);
  const u = h / 100;
  g.lineCap = 'round';
  // legs
  g.strokeStyle = shade(col, -0.3); g.lineWidth = 3.2 * u;
  for (let i = 0; i < 6; i++) {
    const lx = (-26 + i * 10.5) * u;
    g.beginPath(); g.moveTo(lx, -34 * u); g.quadraticCurveTo(lx + (i % 2 ? 6 : -6) * u, -18 * u, lx + (i % 2 ? 3 : -3) * u, 0); g.stroke();
  }
  // body
  const body = blob(0, -40 * u, 30 * u, R, 0.06, 20);
  g.save(); g.scale(1, 0.45); g.translate(0, -40 * u * (1 / 0.45 - 1));
  fillStipple(g, body, col, R, [-34 * u, -80 * u, 68 * u, 60 * u], 0.8);
  g.restore();
  // iridescence
  for (let i = 0; i < 30; i++) { g.fillStyle = ['#ffffff', '#bfe3e8', '#f0d6f4', '#f4e7b8'][i % 4]!; g.fillRect((R() - 0.5) * 50 * u, (-46 + R() * 12) * u, 1.6 * u, 1.2 * u); }
  // head and tentacles
  const hx = 22 * u, hy = -52 * u;
  g.fillStyle = shade(col, -0.05); g.beginPath(); g.arc(hx, hy, 7 * u, 0, Math.PI * 2); g.fill();
  for (let i = 0; i < 12; i++) {
    const spread = o.gaze ? 1.1 : 2.4;
    const a = (o.gaze ? -Math.PI / 2 - 0.35 : -0.4) + (i / 11 - 0.5) * spread;
    const len = (o.gaze ? 30 : 20) * u * (0.8 + R() * 0.4);
    const ex = hx + Math.cos(a) * len, ey = hy + Math.sin(a) * len;
    g.strokeStyle = shade(col, -0.18); g.lineWidth = 1.8 * u;
    g.beginPath(); g.moveTo(hx, hy); g.quadraticCurveTo(hx + Math.cos(a + 0.4) * len * 0.6, hy + Math.sin(a + 0.4) * len * 0.6, ex, ey); g.stroke();
    g.fillStyle = '#1f1c22'; g.beginPath(); g.arc(ex, ey, 1.9 * u, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#ffffff'; g.fillRect(ex - 0.6 * u, ey - 0.9 * u, 0.7 * u, 0.7 * u);
  }
  g.restore();
}

/** A child under a sheet, with two holes. */
export function sheetGhost(g: Ctx, x: number, y: number, h: number) {
  g.save(); g.translate(x, y);
  const p = new Path2D();
  p.moveTo(-h * 0.2, 0);
  p.quadraticCurveTo(-h * 0.26, -h * 0.8, 0, -h);
  p.quadraticCurveTo(h * 0.26, -h * 0.8, h * 0.2, 0);
  for (let i = 0; i <= 5; i++) p.lineTo(h * 0.2 - (i / 5) * h * 0.4, i % 2 ? -h * 0.05 : 0);
  p.closePath();
  g.fillStyle = '#fbfaf6'; g.fill(p);
  g.strokeStyle = '#c9c4ba'; g.lineWidth = Math.max(1, h * 0.02); g.stroke(p);
  g.fillStyle = '#3a3430';
  g.beginPath(); g.ellipse(-h * 0.06, -h * 0.72, h * 0.025, h * 0.04, 0, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.ellipse(h * 0.06, -h * 0.72, h * 0.025, h * 0.04, 0, 0, Math.PI * 2); g.fill();
  g.restore();
}

/** A red paper lantern, lit. */
export function lantern(g: Ctx, x: number, y: number, r: number) {
  glow(g, x, y, r * 3.2, '#ffb070', 0.35);
  g.fillStyle = '#d8534a';
  g.beginPath(); g.ellipse(x, y, r, r * 1.2, 0, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#a8322c'; g.lineWidth = Math.max(0.6, r * 0.08);
  for (let i = -2; i <= 2; i++) { g.beginPath(); g.ellipse(x, y, Math.abs(i) * r * 0.3 + 0.1, r * 1.2, 0, 0, Math.PI * 2); g.stroke(); }
  g.fillStyle = '#e9c54a'; g.fillRect(x - r * 0.4, y - r * 1.35, r * 0.8, r * 0.25); g.fillRect(x - r * 0.4, y + r * 1.1, r * 0.8, r * 0.25);
}

/** A paper effigy of a motor car, for the ancestors. */
export function paperCar(g: Ctx, x: number, y: number, w: number, R: Rng) {
  const h = w * 0.42;
  const body = new Path2D();
  body.moveTo(x, y); body.lineTo(x + w, y); body.lineTo(x + w * 0.96, y - h * 0.5); body.lineTo(x + w * 0.7, y - h * 0.55);
  body.lineTo(x + w * 0.62, y - h); body.lineTo(x + w * 0.3, y - h); body.lineTo(x + w * 0.22, y - h * 0.55); body.lineTo(x + w * 0.02, y - h * 0.5); body.closePath();
  fillStipple(g, body, '#d06a5a', R, [x, y - h, w, h], 0.7);
  g.fillStyle = '#f2e7c9'; g.fillRect(x + w * 0.34, y - h * 0.9, w * 0.25, h * 0.3);
  for (const wx of [0.22, 0.78]) { g.fillStyle = '#3a3430'; g.beginPath(); g.arc(x + w * wx, y, h * 0.2, 0, Math.PI * 2); g.fill(); g.fillStyle = '#e9c54a'; g.beginPath(); g.arc(x + w * wx, y, h * 0.08, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = '#e9c54a'; g.beginPath(); g.arc(x + w * 0.97, y - h * 0.32, h * 0.08, 0, Math.PI * 2); g.fill();
}

/** A burning brazier of paper offerings. */
export function brazier(g: Ctx, x: number, y: number, s: number, R: Rng) {
  glow(g, x, y - s * 0.6, s * 2.6, '#ff9a50', 0.45);
  g.fillStyle = '#6b4a36'; g.beginPath(); g.moveTo(x - s * 0.5, y - s * 0.4); g.lineTo(x + s * 0.5, y - s * 0.4); g.lineTo(x + s * 0.35, y); g.lineTo(x - s * 0.35, y); g.closePath(); g.fill();
  for (let i = 0; i < 9; i++) {
    const fx = x + (R() - 0.5) * s * 0.7, fh = s * (0.4 + R() * 0.6);
    const p = new Path2D(); p.moveTo(fx - s * 0.1, y - s * 0.4); p.quadraticCurveTo(fx, y - s * 0.4 - fh * 1.2, fx + s * 0.1, y - s * 0.4); p.closePath();
    g.fillStyle = ['#f3b24a', '#ec7a3c', '#f7d270'][i % 3]!; g.fill(p);
  }
}

/** Cloth signs with angular script, strung across a street. */
export function alienSign(g: Ctx, x: number, y: number, w: number, h: number, R: Rng, col = '#e9dfcf') {
  g.fillStyle = col; g.fillRect(x, y, w, h);
  g.strokeStyle = shade(col, -0.45); g.lineWidth = Math.max(0.8, h * 0.06);
  let cx = x + h * 0.3;
  while (cx < x + w - h * 0.5) {
    g.beginPath();
    let px = cx, py = y + h * (0.25 + R() * 0.5);
    g.moveTo(px, py);
    for (let k = 0; k < 3; k++) { const a = (Math.floor(R() * 6) / 6) * Math.PI * 2; px += Math.cos(a) * h * 0.25; py = Math.min(y + h * 0.85, Math.max(y + h * 0.15, py + Math.sin(a) * h * 0.25)); g.lineTo(px, py); }
    g.stroke();
    cx += h * 0.55;
  }
}

/** A hexagonal alien tower: a tall prism lit on two faces, with slot windows. */
export function hexTower(g: Ctx, x: number, base: number, w: number, h: number, R: Rng, col: string, lit = '#f6e3b0') {
  g.fillStyle = shade(col, 0.08); g.fillRect(x - w / 2, base - h, w / 2, h);
  g.fillStyle = shade(col, -0.12); g.fillRect(x, base - h, w / 2, h);
  g.fillStyle = shade(col, 0.2);
  g.beginPath(); g.moveTo(x - w / 2, base - h); g.lineTo(x - w / 4, base - h - w * 0.12); g.lineTo(x + w / 4, base - h - w * 0.12); g.lineTo(x + w / 2, base - h); g.closePath(); g.fill();
  g.save(); g.beginPath(); g.rect(x - w / 2, base - h, w, h); g.clip();
  stipple(g, x - w / 2, base - h, w, h, shade(col, -0.2), 6, R);
  for (let yy = base - h + w * 0.3; yy < base - w * 0.2; yy += w * 0.28) {
    for (const side of [-1, 1]) if (R() < 0.7) { g.fillStyle = R() < 0.35 ? lit : shade(col, -0.3); g.fillRect(x + side * w * 0.25 - w * 0.08, yy, w * 0.16, w * 0.08); }
  }
  g.restore();
}

/** A soft round mask: the card fades out towards its edges. */
export function vignette(g: Ctx, W: number, H: number, inner = 0.35, outer = 0.5) {
  g.globalCompositeOperation = 'destination-in';
  const gr = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * inner, W / 2, H / 2, Math.max(W, H) * outer);
  gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = 'source-over';
}

/** Fade the top of a card to nothing, so it sits into the one behind. */
export function fadeTop(g: Ctx, W: number, H: number, from: number, to: number) {
  g.globalCompositeOperation = 'destination-in';
  const gr = g.createLinearGradient(0, H * from, 0, H * to);
  gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,1)');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = 'source-over';
}

export { figure, glow, hexagon, rgba };
