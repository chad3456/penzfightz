/**
 * Furniture and things for the isometric plates, in centimetres. Every
 * function draws at once; scenes decide the order (see Scene in kit.ts).
 */
import { type G, type Iso, type Pt, C, INK, box, plane, onPlane, inkFill, rng, pick, shade, ellipse, ln, line, withPlane, TAU, mix } from './kit';

export type Face = '+x' | '+y' | '-x' | '-y';
const BOOKS = [C.red, C.navy, C.mustard, C.teal, C.cream, C.brick, C.forest, C.wine, C.ochre, C.denim, C.olive, C.bone, C.plum, C.orange, C.slate, C.rose];

/** A plain table: top slab and four legs. */
export function table(g: G, I: Iso, x: number, y: number, w: number, d: number, h: number, top: string, lw: number, o: { leg?: string; slab?: number; apron?: boolean } = {}) {
  const leg = o.leg ?? shade(top, -0.25), t = o.slab ?? 4, L = 5;
  for (const [lx, ly] of [[x + 3, y + 3], [x + w - L - 3, y + 3], [x + 3, y + d - L - 3], [x + w - L - 3, y + d - L - 3]]) box(g, I, lx, ly, 0, L, L, h - t, { top: leg, left: leg, right: shade(leg, -0.12), lw });
  if (o.apron) box(g, I, x + 4, y + 4, h - t - 9, w - 8, d - 8, 9, { top: top, left: shade(top, -0.18), right: shade(top, -0.26), lw });
  box(g, I, x, y, h - t, w, d, t, { top, left: shade(top, -0.18), right: shade(top, -0.28), lw });
}

/** A chair; `face` is the way someone sitting on it looks. Seat at 45. */
export function chair(g: G, I: Iso, x: number, y: number, face: Face, col: string, lw: number, part: 'all' | 'seat' | 'back' = 'all') {
  const W = 42, S = 45;
  const x0 = x - W / 2, y0 = y - W / 2;
  const leg = shade(col, -0.2);
  const drawBack = () => {
    if (face === '+y') box(g, I, x0, y0, S, W, 4, 42, { top: col, left: col, right: shade(col, -0.15), lw });
    if (face === '-y') box(g, I, x0, y0 + W - 4, S, W, 4, 42, { top: col, left: col, right: shade(col, -0.15), lw });
    if (face === '+x') box(g, I, x0, y0, S, 4, W, 42, { top: col, left: shade(col, -0.1), right: col, lw });
    if (face === '-x') box(g, I, x0 + W - 4, y0, S, 4, W, 42, { top: col, left: shade(col, -0.1), right: col, lw });
  };
  const behind = face === '+y' || face === '+x';
  if (part !== 'seat' && behind) drawBack();
  if (part !== 'back') {
    for (const [lx, ly] of [[x0 + 2, y0 + 2], [x0 + W - 6, y0 + 2], [x0 + 2, y0 + W - 6], [x0 + W - 6, y0 + W - 6]]) box(g, I, lx, ly, 0, 4, 4, S - 4, { top: leg, left: leg, right: shade(leg, -0.12), lw });
    box(g, I, x0, y0, S - 4, W, W, 4, { top: col, left: shade(col, -0.15), right: shade(col, -0.25), lw });
  }
  if (part !== 'seat' && !behind) drawBack();
}

/** A bookcase against a wall; its open face looks along `face` (+x or +y). */
export function bookcase(g: G, I: Iso, x: number, y: number, len: number, h: number, face: '+x' | '+y', lw: number, seed = 1, o: { wood?: string; rows?: number; depth?: number; gaps?: number } = {}) {
  const wood = o.wood ?? C.wood, dp = o.depth ?? 32, rows = o.rows ?? Math.max(2, Math.round(h / 38)), R = rng(seed);
  const W = face === '+x' ? dp : len, Dd = face === '+x' ? len : dp;
  box(g, I, x, y, 0, W, Dd, h, { top: shade(wood, 0.1), left: shade(wood, -0.08), right: shade(wood, -0.22), lw });
  // the front, as a plane
  const pl = face === '+x' ? 'x' : 'y', c = face === '+x' ? x + W : y + Dd, u0 = face === '+x' ? y : x;
  const inner = shade(wood, -0.5);
  const rowH = (h - 14) / rows;
  for (let r = 0; r < rows; r++) {
    const z0 = 8 + r * rowH, z1 = z0 + rowH - 4;
    plane(g, I, pl, c, (gg) => gg.rect(u0 + 4, z0, len - 8, z1 - z0), inner, lw * 0.8);
    // books
    let u = u0 + 5;
    while (u < u0 + len - 7) {
      const bw = 2.5 + R() * 4, bh = (z1 - z0) * (0.62 + R() * 0.34);
      if (R() < (o.gaps ?? 0.05)) { u += bw * 2.5; continue; }
      const lean = R() < 0.06;
      const col = pick(R, BOOKS);
      if (u + bw > u0 + len - 6) break;
      plane(g, I, pl, c, (gg) => { if (lean) { gg.moveTo(u, z0); gg.lineTo(u + bw, z0); gg.lineTo(u + bw + bh * 0.35, z0 + bh); gg.lineTo(u + bh * 0.35, z0 + bh); gg.closePath(); } else gg.rect(u, z0, bw, bh); }, col, lw * 0.55);
      if (R() < 0.35 && bh > 18) plane(g, I, pl, c, (gg) => gg.rect(u + 0.6, z0 + bh * 0.7, bw - 1.2, 1.4), shade(col, 0.35), 0);
      u += bw + (lean ? bh * 0.35 : 0.2);
    }
    // the shelf board
    plane(g, I, pl, c, (gg) => gg.rect(u0 + 2, z0 - 3, len - 4, 3), shade(wood, 0.05), lw * 0.8);
  }
  plane(g, I, pl, c, (gg) => { gg.rect(u0, 0, len, h); gg.rect(u0 + 4, 5, len - 8, h - 10); }, null, lw);
}

/** A banker's lamp on a surface at height z. */
export function bankerLamp(g: G, I: Iso, x: number, y: number, z: number, lw: number, lit = true) {
  box(g, I, x - 6, y - 4, z, 12, 8, 2, { top: C.ochre, left: shade(C.ochre, -0.2), right: shade(C.ochre, -0.3), lw });
  const [bx, by] = I.p(x, y, z + 2), [tx, ty] = I.p(x, y, z + 30);
  ln(g, bx, by, tx, ty, lw * 2.2); ln(g, bx, by, tx, ty, lw * 0.9, C.ochre);
  if (lit) { g.save(); const gr = g.createRadialGradient(tx, ty + 18 * I.s, 2, tx, ty + 18 * I.s, 70 * I.s); gr.addColorStop(0, 'rgba(255,236,170,0.55)'); gr.addColorStop(1, 'rgba(255,236,170,0)'); g.fillStyle = gr; g.fillRect(tx - 80 * I.s, ty - 40 * I.s, 160 * I.s, 140 * I.s); g.restore(); }
  const sh: Pt[] = [I.p(x - 14, y, z + 26), I.p(x - 10, y, z + 33), I.p(x + 10, y, z + 33), I.p(x + 14, y, z + 26)];
  g.beginPath(); g.moveTo(sh[0][0], sh[0][1]); g.lineTo(sh[1][0], sh[1][1]); g.lineTo(sh[2][0], sh[2][1]); g.lineTo(sh[3][0], sh[3][1]);
  g.quadraticCurveTo((sh[0][0] + sh[3][0]) / 2, sh[3][1] + 4 * I.s, sh[0][0], sh[0][1]); inkFill(g, C.forest, lw);
  ln(g, sh[1][0] + 2, sh[1][1] + 2 * I.s, sh[2][0] - 2, sh[2][1] + 2 * I.s, lw * 0.6, shade(C.forest, 0.4));
}

/** An open book lying on a surface. */
export function openBook(g: G, I: Iso, x: number, y: number, z: number, lw: number, along: 'x' | 'y' = 'x', col = C.white) {
  if (along === 'x') {
    plane(g, I, 'z', z, (gg) => { gg.moveTo(x - 14, y - 10); gg.lineTo(x, y - 9); gg.lineTo(x, y + 9); gg.lineTo(x - 14, y + 10); gg.closePath(); }, col, lw * 0.8);
    plane(g, I, 'z', z, (gg) => { gg.moveTo(x, y - 9); gg.lineTo(x + 14, y - 10); gg.lineTo(x + 14, y + 10); gg.lineTo(x, y + 9); gg.closePath(); }, shade(col, -0.06), lw * 0.8);
    for (let i = 0; i < 4; i++) { const yy = y - 6 + i * 3.6; onPlane(g, I, 'z', z, (gg) => { gg.moveTo(x - 12, yy); gg.lineTo(x - 2, yy); gg.moveTo(x + 2, yy); gg.lineTo(x + 12, yy); }); g.strokeStyle = 'rgba(31,26,23,0.35)'; g.lineWidth = lw * 0.5; g.stroke(); }
  } else {
    plane(g, I, 'z', z, (gg) => { gg.moveTo(x - 10, y - 14); gg.lineTo(x + 10, y - 14); gg.lineTo(x + 9, y); gg.lineTo(x - 9, y); gg.closePath(); }, col, lw * 0.8);
    plane(g, I, 'z', z, (gg) => { gg.moveTo(x - 9, y); gg.lineTo(x + 9, y); gg.lineTo(x + 10, y + 14); gg.lineTo(x - 10, y + 14); gg.closePath(); }, shade(col, -0.06), lw * 0.8);
  }
}
/** A stack of closed books. */
export function bookStack(g: G, I: Iso, x: number, y: number, z: number, n: number, lw: number, seed = 1) {
  const R = rng(seed); let zz = z;
  for (let i = 0; i < n; i++) { const w = 18 + R() * 6, d = 13 + R() * 4, t = 3 + R() * 2, ox = (R() - 0.5) * 3; const col = pick(R, BOOKS); box(g, I, x - w / 2 + ox, y - d / 2, zz, w, d, t, { top: col, left: C.cream, right: shade(col, -0.15), lw: lw * 0.7 }); zz += t; }
  return zz;
}
/** A laptop, screen toward −y or −x (so the user sits on the far side and we see the lid's back) or facing the viewer. */
export function laptop(g: G, I: Iso, x: number, y: number, z: number, lw: number, screenTo: Face = '+y', body = C.ash, glow = C.ice) {
  box(g, I, x - 16, y - 11, z, 32, 22, 1.6, { top: body, left: shade(body, -0.2), right: shade(body, -0.3), lw: lw * 0.8 });
  // the lid, standing at the far edge from the user
  if (screenTo === '+y') plane(g, I, 'y', y - 11, (gg) => gg.rect(x - 16, z + 1.6, 32, 21), glow, lw * 0.8);
  else if (screenTo === '-y') plane(g, I, 'y', y + 11, (gg) => gg.rect(x - 16, z + 1.6, 32, 21), body, lw * 0.8);
  else if (screenTo === '+x') plane(g, I, 'x', x - 16, (gg) => gg.rect(y - 11, z + 1.6, 22, 21), glow, lw * 0.8);
  else plane(g, I, 'x', x + 16, (gg) => gg.rect(y - 11, z + 1.6, 22, 21), body, lw * 0.8);
}
/** A monitor on a stand; the screen faces `face`. */
export function monitor(g: G, I: Iso, x: number, y: number, z: number, lw: number, face: Face, screen: (g: G, u0: number, v0: number) => void, body = C.char) {
  box(g, I, x - 8, y - 6, z, 16, 12, 2, { top: body, left: shade(body, -0.2), right: shade(body, -0.3), lw: lw * 0.8 });
  box(g, I, x - 2, y - 2, z + 2, 4, 4, 14, { top: body, left: body, right: shade(body, -0.2), lw: lw * 0.8 });
  const W = 52, H = 32, z0 = z + 14;
  if (face === '+y' || face === '-y') {
    box(g, I, x - W / 2, y - 2, z0, W, 4, H, { top: body, left: body, right: shade(body, -0.2), lw: lw * 0.8 });
    if (face === '+y') { onPlane(g, I, 'y', y + 2, (gg) => gg.rect(x - W / 2 + 2.5, z0 + 2.5, W - 5, H - 5)); g.save(); g.clip(); withPlane(g, I, 'y', y + 2, (gg) => screen(gg, x - W / 2 + 2.5, z0 + 2.5)); g.restore(); onPlane(g, I, 'y', y + 2, (gg) => gg.rect(x - W / 2 + 2.5, z0 + 2.5, W - 5, H - 5)); inkFill(g, null, lw * 0.7); }
  } else {
    box(g, I, x - 2, y - W / 2, z0, 4, W, H, { top: body, left: shade(body, -0.1), right: body, lw: lw * 0.8 });
    if (face === '+x') { onPlane(g, I, 'x', x + 2, (gg) => gg.rect(y - W / 2 + 2.5, z0 + 2.5, W - 5, H - 5)); g.save(); g.clip(); withPlane(g, I, 'x', x + 2, (gg) => screen(gg, y - W / 2 + 2.5, z0 + 2.5)); g.restore(); onPlane(g, I, 'x', x + 2, (gg) => gg.rect(y - W / 2 + 2.5, z0 + 2.5, W - 5, H - 5)); inkFill(g, null, lw * 0.7); }
  }
}
/** A potted plant: a pot and a bush of leaves. */
export function plant(g: G, I: Iso, x: number, y: number, z: number, h: number, lw: number, pot = C.brick, seed = 1, kind: 'bush' | 'palm' | 'fern' = 'bush') {
  const r = h * 0.22;
  box(g, I, x - r, y - r, z, r * 2, r * 2, h * 0.3, { top: shade(pot, -0.35), left: pot, right: shade(pot, -0.15), lw });
  const [cx, cy] = I.p(x, y, z + h * 0.3), R = rng(seed), sz = h * I.zs;
  const leaves = kind === 'palm' ? 9 : 14;
  for (let i = 0; i < leaves; i++) {
    const a = -Math.PI / 2 + (R() - 0.5) * (kind === 'palm' ? 2.6 : 2.2), L = sz * (0.4 + R() * 0.5);
    const ex = cx + Math.cos(a) * L * 0.9, ey = cy + Math.sin(a) * L;
    const col = R() < 0.5 ? C.green : R() < 0.5 ? C.forest : C.grass;
    g.beginPath(); g.moveTo(cx, cy);
    const wv = kind === 'palm' ? 0.18 : 0.32;
    g.quadraticCurveTo(cx + Math.cos(a - wv) * L * 0.7, cy + Math.sin(a - wv) * L * 0.7, ex, ey);
    g.quadraticCurveTo(cx + Math.cos(a + wv) * L * 0.7, cy + Math.sin(a + wv) * L * 0.7, cx, cy);
    inkFill(g, col, lw * 0.8);
  }
}
/** A rug on the floor: an ellipse or a rectangle with a border. */
export function rug(g: G, I: Iso, x: number, y: number, w: number, d: number, col: string, border: string, lw: number, round = false) {
  plane(g, I, 'z', 0, (gg) => { if (round) gg.ellipse(x, y, w / 2, d / 2, 0, 0, TAU); else gg.rect(x, y, w, d); }, col, lw);
  onPlane(g, I, 'z', 0, (gg) => { if (round) gg.ellipse(x, y, w / 2 - 14, d / 2 - 14, 0, 0, TAU); else gg.rect(x + 12, y + 12, w - 24, d - 24); });
  g.strokeStyle = border; g.lineWidth = lw * 2.4; g.stroke();
}
/** A beanbag. */
export function beanbag(g: G, I: Iso, x: number, y: number, col: string, lw: number) {
  const [cx, cy] = I.p(x, y, 0), s = I.s;
  g.beginPath(); g.ellipse(cx, cy - 14 * s, 38 * s, 26 * s, 0, 0, TAU); inkFill(g, col, lw);
  g.beginPath(); g.ellipse(cx - 4 * s, cy - 24 * s, 22 * s, 11 * s, -0.2, 0, Math.PI); g.lineWidth = lw * 0.7; g.strokeStyle = INK; g.stroke();
}
/** A book cart on wheels. */
export function bookCart(g: G, I: Iso, x: number, y: number, lw: number, seed = 3) {
  const col = C.slate;
  for (const [wx, wy] of [[x + 4, y + 4], [x + 76, y + 4], [x + 4, y + 36], [x + 76, y + 36]]) { const [px, py] = I.p(wx, wy, 4); ellipse(g, px, py, 4 * I.s, 4 * I.s, 0, C.char, lw * 0.7); }
  for (const z of [10, 50, 90]) box(g, I, x, y, z, 84, 42, 3, { top: shade(col, 0.2), left: col, right: shade(col, -0.2), lw });
  const R = rng(seed);
  for (const z of [53, 93]) { let u = x + 4; while (u < x + 78) { const bw = 3 + R() * 4, bh = 18 + R() * 9; box(g, I, u, y + 10, z, bw, 22, bh, { top: C.cream, left: pick(R, BOOKS), right: pick(R, BOOKS), lw: lw * 0.5 }); u += bw + 0.3; } }
  for (const [px, py] of [[x, y + 42], [x + 84, y + 42], [x + 84, y]]) { const a = I.p(px, py, 10), b = I.p(px, py, 96); ln(g, a[0], a[1], b[0], b[1], lw * 1.2); }
}
/** A tall arched window on the wall x = 0 or y = 0, from u to u + w. */
export function archWindow(g: G, I: Iso, wall: 'x' | 'y', c: number, u: number, z: number, w: number, h: number, lw: number, glass = '#bfe0e8', frame = C.white) {
  const arch = (gg: G, inset: number) => { const r = w / 2 - inset; gg.moveTo(u + inset, z + inset); gg.lineTo(u + w - inset, z + inset); gg.lineTo(u + w - inset, z + h - w / 2); gg.arc(u + w / 2, z + h - w / 2, r, 0, Math.PI, false); gg.closePath(); };
  plane(g, I, wall, c, (gg) => arch(gg, 0), frame, lw);
  plane(g, I, wall, c, (gg) => arch(gg, 6), glass, lw * 0.8);
  // light streaks
  onPlane(g, I, wall, c, (gg) => { gg.moveTo(u + w * 0.25, z + 10); gg.lineTo(u + w * 0.55, z + h * 0.62); gg.moveTo(u + w * 0.42, z + 10); gg.lineTo(u + w * 0.7, z + h * 0.5); });
  g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = lw * 2; g.stroke();
  // mullions
  onPlane(g, I, wall, c, (gg) => { gg.moveTo(u + w / 2, z + 6); gg.lineTo(u + w / 2, z + h - 6); for (let k = 1; k < 4; k++) { const zz = z + (h - w / 2) * (k / 4); gg.moveTo(u + 6, zz); gg.lineTo(u + w - 6, zz); } });
  g.strokeStyle = frame; g.lineWidth = lw * 2.2; g.stroke(); g.strokeStyle = INK; g.lineWidth = lw * 0.6; g.stroke();
}
/** A wall clock. */
export function wallClock(g: G, I: Iso, wall: 'x' | 'y', c: number, u: number, z: number, r: number, lw: number, t = 10.1) {
  plane(g, I, wall, c, (gg) => gg.ellipse(u, z, r, r, 0, 0, TAU), C.ochre, lw);
  plane(g, I, wall, c, (gg) => gg.ellipse(u, z, r * 0.84, r * 0.84, 0, 0, TAU), C.white, lw * 0.8);
  const hA = (t / 12) * TAU, mA = ((t % 1) * TAU);
  onPlane(g, I, wall, c, (gg) => { gg.moveTo(u, z); gg.lineTo(u + Math.sin(hA) * r * 0.45 * (wall === 'x' ? -1 : 1), z + Math.cos(hA) * r * 0.45); gg.moveTo(u, z); gg.lineTo(u + Math.sin(mA) * r * 0.7 * (wall === 'x' ? -1 : 1), z + Math.cos(mA) * r * 0.7); });
  g.strokeStyle = INK; g.lineWidth = lw * 1.3; g.stroke();
}
/** Words painted flat on a wall (reads correctly on either back wall). */
export function wallText(g: G, I: Iso, wall: 'x' | 'y', c: number, u: number, z: number, text: string, size: number, font: string, col = INK) {
  withPlane(g, I, wall, c, (gg) => {
    gg.translate(u, z); gg.scale(wall === 'x' ? -1 : 1, -1);
    const m = /^((?:italic |bold |\d00 )*)(.*)$/.exec(font)!; gg.font = `${m[1]}${size}px ${m[2]}`; gg.fillStyle = col; gg.textAlign = 'center'; gg.textBaseline = 'middle'; gg.fillText(text, 0, 0);
  });
}
/** A floor of square tiles in two colours, with fine joints. */
export function tiles(g: G, I: Iso, x: number, y: number, w: number, d: number, size: number, a: string, b: string | null, lw: number, joint = 'rgba(31,26,23,0.25)') {
  plane(g, I, 'z', 0, (gg) => gg.rect(x, y, w, d), a, 0);
  if (b) { onPlane(g, I, 'z', 0, (gg) => { for (let i = 0; i * size < w; i++) for (let j = 0; j * size < d; j++) if ((i + j) % 2) gg.rect(x + i * size, y + j * size, Math.min(size, w - i * size), Math.min(size, d - j * size)); }); g.fillStyle = b; g.fill(); }
  onPlane(g, I, 'z', 0, (gg) => { for (let i = 0; i <= w / size; i++) { gg.moveTo(x + i * size, y); gg.lineTo(x + i * size, y + d); } for (let j = 0; j <= d / size; j++) { gg.moveTo(x, y + j * size); gg.lineTo(x + w, y + j * size); } });
  g.strokeStyle = joint; g.lineWidth = lw * 0.6; g.stroke();
}
/** Floorboards running along x. */
export function boards(g: G, I: Iso, x: number, y: number, w: number, d: number, plank: number, col: string, lw: number, seed = 2) {
  plane(g, I, 'z', 0, (gg) => gg.rect(x, y, w, d), col, 0);
  const R = rng(seed);
  onPlane(g, I, 'z', 0, (gg) => { for (let j = 0; j <= d / plank; j++) { gg.moveTo(x, y + j * plank); gg.lineTo(x + w, y + j * plank); let u = x + R() * 140; while (u < x + w) { gg.moveTo(u, y + j * plank); gg.lineTo(u, y + Math.min(d, (j + 1) * plank)); u += 120 + R() * 120; } } });
  g.strokeStyle = shade(col, -0.3); g.lineWidth = lw * 0.6; g.stroke();
}
/** A soft flat shadow on the floor under a box footprint. */
export function floorShadow(g: G, I: Iso, x: number, y: number, w: number, d: number, off = 10, col = 'rgba(40,24,10,0.13)') {
  onPlane(g, I, 'z', 0, (gg) => gg.rect(x + off * 0.4, y + off, w, d)); g.fillStyle = col; g.fill();
}
export { mix, line };

/**
 * A dog in profile, standing on (x, y) in screen space, `dir` 1 facing right.
 * s is pixels per centimetre of height; a lab is about 60 cm at the shoulder.
 */
export function dog(g: G, x: number, y: number, s: number, dir: 1 | -1, col: string, lw: number, o: { harness?: string; sit?: boolean; tail?: number; ear?: string } = {}) {
  g.save(); g.translate(x, y); g.scale(dir * s, s);
  const k = lw / s, dark = o.ear ?? shade(col, -0.25);
  const leg = (lx: number, back: boolean) => { g.beginPath(); g.roundRect(lx - 3.4, o.sit ? -34 : -30, 6.8, o.sit ? 34 : 30, 3); inkFill(g, back ? shade(col, -0.12) : col, k); };
  if (!o.sit) { leg(-18, true); leg(22, true); }
  // tail
  g.beginPath(); g.moveTo(o.sit ? -24 : -34, o.sit ? -8 : -50); g.quadraticCurveTo(o.sit ? -40 : -50, o.sit ? -6 : -60 - (o.tail ?? 8), o.sit ? -46 : -54, o.sit ? -4 : -44 - (o.tail ?? 8)); g.lineWidth = 5 + 2 * k; g.strokeStyle = INK; g.lineCap = 'round'; g.stroke(); g.lineWidth = 5; g.strokeStyle = col; g.stroke();
  // body
  g.beginPath();
  if (o.sit) g.ellipse(-6, -24, 24, 20, -0.5, 0, TAU); else g.ellipse(-2, -46, 36, 15, 0, 0, TAU);
  inkFill(g, col, k);
  if (!o.sit) { leg(-26, false); leg(14, false); } else { leg(16, false); g.beginPath(); g.ellipse(-14, -6, 16, 7, 0, 0, TAU); inkFill(g, col, k); }
  // neck and head
  const hx = o.sit ? 14 : 30, hy = o.sit ? -58 : -66;
  g.beginPath(); g.moveTo(hx - 14, hy + 24); g.lineTo(hx - 4, hy + 2); g.lineTo(hx + 8, hy + 6); g.lineTo(hx + 4, hy + 28); g.closePath(); inkFill(g, col, k);
  g.beginPath(); g.ellipse(hx, hy, 11, 10, 0, 0, TAU); inkFill(g, col, k);
  g.beginPath(); g.roundRect(hx + 4, hy - 1, 15, 9, 4); inkFill(g, col, k);
  ellipse(g, hx + 18, hy + 1, 2.6, 2.2, 0, INK, 0);
  ellipse(g, hx + 3, hy - 3, 1.5, 1.7, 0, INK, 0);
  g.beginPath(); g.ellipse(hx - 5, hy + 2, 5, 9, 0.3, 0, TAU); inkFill(g, dark, k);
  if (o.harness) {
    g.beginPath(); g.moveTo(hx - 12, hy + 16); g.lineTo(hx - 2, hy + 20); g.lineWidth = 4; g.strokeStyle = o.harness; g.stroke();
    if (!o.sit) { g.beginPath(); g.roundRect(-10, -60, 22, 26, 3); inkFill(g, o.harness, k); g.beginPath(); g.moveTo(-6, -60); g.lineTo(-14, -86); g.lineTo(6, -86); g.lineTo(2, -60); g.lineWidth = 3; g.strokeStyle = INK; g.stroke(); }
  }
  g.restore();
}

/** A tree: a trunk and a crown of overlapping round clumps, with a flat shadow. */
export function isoTree(g: G, I: Iso, x: number, y: number, h: number, r: number, lw: number, seed = 1, o: { leaf?: string; leaf2?: string; trunk?: string } = {}) {
  const R = rng(seed), leaf = o.leaf ?? '#5f9a4a', leaf2 = o.leaf2 ?? '#4a8040', trunk = o.trunk ?? '#7a5236';
  const [bx, by] = I.p(x, y, 0), [tx, ty] = I.p(x, y, h * 0.62);
  g.beginPath(); g.moveTo(bx - 9 * I.s * 1.6, by); g.quadraticCurveTo(bx - 6 * I.s * 1.6, (by + ty) / 2, tx - 5 * I.s, ty); g.lineTo(tx + 5 * I.s, ty); g.quadraticCurveTo(bx + 6 * I.s * 1.6, (by + ty) / 2, bx + 9 * I.s * 1.6, by); g.closePath(); inkFill(g, trunk, lw);
  const [cx, cy] = I.p(x, y, h * 0.78), rp = r * I.s;
  const clumps: [number, number, number][] = [];
  for (let i = 0; i < 9; i++) { const a = (i / 9) * TAU + R() * 0.4, d = rp * (0.45 + R() * 0.3); clumps.push([cx + Math.cos(a) * d * 1.05, cy + Math.sin(a) * d * 0.72 - rp * 0.05, rp * (0.42 + R() * 0.18)]); }
  clumps.push([cx, cy - rp * 0.25, rp * 0.6]);
  clumps.sort((a, b) => a[1] - b[1]);
  // a single silhouette, then a darker underside, then highlight clumps
  g.beginPath(); for (const [px, py, pr] of clumps) { g.moveTo(px + pr, py); g.arc(px, py, pr, 0, TAU); } g.lineWidth = lw * 2; g.strokeStyle = INK; g.stroke();
  g.fillStyle = leaf; g.fill();
  g.save(); g.beginPath(); for (const [px, py, pr] of clumps) { g.moveTo(px + pr, py); g.arc(px, py, pr, 0, TAU); } g.clip();
  g.fillStyle = leaf2; for (const [px, py, pr] of clumps) { g.beginPath(); g.arc(px + pr * 0.25, py + pr * 0.35, pr * 0.85, 0, TAU); g.fill(); }
  g.fillStyle = leaf; for (const [px, py, pr] of clumps) { g.beginPath(); g.arc(px - pr * 0.12, py - pr * 0.15, pr * 0.72, 0, TAU); g.fill(); }
  g.strokeStyle = 'rgba(31,26,23,0.55)'; g.lineWidth = lw * 0.6; for (const [px, py, pr] of clumps) { g.beginPath(); g.arc(px - pr * 0.12, py - pr * 0.15, pr * 0.72, Math.PI * 0.1, Math.PI * 0.9); g.stroke(); }
  g.restore();
}
/** A flat iso shadow for a tree, cast toward +x+y a little. */
export function treeShadow(g: G, I: Iso, x: number, y: number, r: number, col = 'rgba(30,60,20,0.28)') {
  onPlane(g, I, 'z', 0, (gg) => gg.ellipse(x + r * 0.35, y + r * 0.55, r * 0.95, r * 0.8, 0, 0, TAU)); g.fillStyle = col; g.fill();
}
/** A park bench along x or y. */
export function bench(g: G, I: Iso, x: number, y: number, along: 'x' | 'y', lw: number, wood = '#b9824e') {
  const L = 150;
  if (along === 'x') { for (const lx of [x + 8, x + L - 14]) box(g, I, lx, y, 0, 6, 40, 42, { top: C.char, left: C.char, right: C.black, lw }); box(g, I, x, y, 42, L, 42, 5, { top: wood, left: shade(wood, -0.2), right: shade(wood, -0.3), lw }); box(g, I, x, y - 2, 47, L, 5, 38, { top: wood, left: shade(wood, -0.1), right: shade(wood, -0.25), lw }); }
  else { for (const ly of [y + 8, y + L - 14]) box(g, I, x, ly, 0, 40, 6, 42, { top: C.char, left: C.char, right: C.black, lw }); box(g, I, x, y, 42, 42, L, 5, { top: wood, left: shade(wood, -0.2), right: shade(wood, -0.3), lw }); box(g, I, x - 2, y, 47, 5, L, 38, { top: wood, left: shade(wood, -0.25), right: shade(wood, -0.1), lw }); }
}
