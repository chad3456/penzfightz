import { burstsOf, doodleOf, type Analysis, type AuraEvent, type FrameState, type Plan } from './plan';

export const OUT_W = 1080;
export const OUT_H = 1920;

let fontsReady: Promise<void> | null = null;
export function loadFonts() {
  fontsReady ||= (async () => {
    const base = (import.meta.env.BASE_URL || '/') + 'fonts-aura/';
    for (const [fam, file] of [['AuraAnton', 'Anton-Regular.ttf'], ['AuraBebas', 'BebasNeue-Regular.ttf'], ['AuraHand', 'Caveat.woff2']]) {
      try { const f = new FontFace(fam, `url(${base}${file})`); await f.load(); document.fonts.add(f); } catch { /* fall back to system fonts */ }
    }
  })();
  return fontsReady;
}

function rand(seed: number) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

let emberSprite: HTMLCanvasElement | null = null;
function sprite() {
  if (emberSprite) return emberSprite;
  const c = document.createElement('canvas'); c.width = c.height = 48;
  const g = c.getContext('2d')!;
  const gr = g.createRadialGradient(24, 24, 0, 24, 24, 24);
  gr.addColorStop(0, 'rgba(255,240,200,1)'); gr.addColorStop(0.25, 'rgba(255,160,60,0.9)'); gr.addColorStop(1, 'rgba(255,80,0,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 48, 48);
  return (emberSprite = c);
}

function embers(g: CanvasRenderingContext2D, t: number) {
  const r = rand(3), sp = sprite();
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let k = 0; k < 140; k++) {
    const x0 = r() * OUT_W, y0 = r() * OUT_H, speed = 60 + r() * 180, ph = r() * 6.28, sz = 8 + r() * 22;
    const y = (((y0 - t * speed) % (OUT_H + 60)) + OUT_H + 60) % (OUT_H + 60) - 30;
    const x = x0 + Math.sin(t * 1.7 + ph) * 30;
    g.globalAlpha = 0.45 + 0.55 * Math.abs(Math.sin(t * 9 + ph));
    g.drawImage(sp, x - sz / 2, y - sz / 2, sz, sz);
  }
  g.restore();
}

function lightning(g: CanvasRenderingContext2D, st: FrameState) {
  if (st.pulse < 0.15) return;
  const r = rand(st.beatIndex * 97 + 5);
  const tx = OUT_W / 2, ty = OUT_H * 0.42;
  g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round'; g.lineJoin = 'round';
  for (let b = 0; b < 2; b++) {
    let x = (0.1 + r() * 0.8) * OUT_W, y = 0;
    const ex = tx + (r() - 0.5) * 420, ey = ty + (r() - 0.5) * 300;
    const pts: [number, number][] = [[x, y]];
    for (let s = 1; s <= 12; s++) { const f = s / 12; pts.push([x + (ex - x) * f + (r() - 0.5) * 110, y + (ey - y) * f + (r() - 0.5) * 30]); }
    for (const [w, a, blur] of [[16, 0.35, 40], [6, 0.9, 16], [2.5, 1, 0]] as const) {
      g.strokeStyle = `rgba(200,225,255,${a * st.pulse})`; g.lineWidth = w; g.shadowColor = 'rgba(120,170,255,1)'; g.shadowBlur = blur;
      g.beginPath(); pts.forEach(([px, py], i) => (i ? g.lineTo(px, py) : g.moveTo(px, py))); g.stroke();
    }
    x = 0; y = 0;
  }
  g.restore();
}

function fitText(g: CanvasRenderingContext2D, lines: string[], size: number, family: string, maxW: number) {
  g.font = `${size}px ${family}`;
  const w = Math.max(...lines.map((l) => g.measureText(l).width));
  return w > maxW ? Math.floor(size * maxW / w) : size;
}

function glowText(g: CanvasRenderingContext2D, text: string, cx: number, cy: number, size: number, family: string, fill: string, glow: string, stroke = 0) {
  const lines = text.split('\n');
  const lh = size * 1.02;
  g.font = `${size}px ${family}`;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  const y0 = cy - (lh * (lines.length - 1)) / 2;
  g.save();
  g.shadowColor = glow;
  for (const blur of [size * 0.5, size * 0.2]) {
    g.shadowBlur = blur; g.fillStyle = glow;
    lines.forEach((l, i) => g.fillText(l, cx, y0 + i * lh));
  }
  g.restore();
  if (stroke) { g.lineWidth = stroke; g.strokeStyle = 'rgba(0,0,0,0.85)'; lines.forEach((l, i) => g.strokeText(l, cx, y0 + i * lh)); }
  g.fillStyle = fill;
  lines.forEach((l, i) => g.fillText(l, cx, y0 + i * lh));
}

function caption(g: CanvasRenderingContext2D, e: AuraEvent, t: number, st: FrameState, frameNo: number) {
  const lt = t - e.t;
  const fade = Math.min(1, lt / 0.06) * Math.min(1, (e.dur - lt) / 0.2);
  const style = e.style ?? 'impact';
  g.save();
  g.globalAlpha = Math.max(0, fade);
  if (style === 'impact') {
    const lines = e.text.split('\n');
    const base = fitText(g, lines, e.size ?? 210, 'AuraAnton, Impact, sans-serif', OUT_W * 0.86);
    const sc = 1.3 - 0.3 * Math.min(1, lt / 0.12) + 0.03 * st.pulse;
    const r = rand(frameNo);
    const jx = lt < 0.25 ? (r() - 0.5) * 12 : 0, jy = lt < 0.25 ? (r() - 0.5) * 12 : 0;
    g.translate(OUT_W / 2 + jx, OUT_H * (e.y ?? 0.5) + jy); g.scale(sc, sc);
    glowText(g, e.text, 0, 0, base, 'AuraAnton, Impact, sans-serif', '#ffffff', e.glow ?? '#ff28b4', 6);
  } else if (style === 'aura') {
    const base = fitText(g, [e.text], e.size ?? 140, 'AuraAnton, Impact, sans-serif', OUT_W * 0.86);
    g.globalAlpha = Math.max(0, Math.min(1, lt * 6) * Math.min(1, (e.dur - lt) / 0.4));
    glowText(g, e.text, OUT_W / 2, OUT_H * (e.y ?? 0.62) - lt * 120, base, 'AuraAnton, Impact, sans-serif', '#d6ffd2', e.glow ?? '#3cff78', 4);
  } else {
    const base = fitText(g, [e.text], e.size ?? 96, 'AuraBebas, sans-serif', OUT_W * 0.9);
    glowText(g, e.text, OUT_W / 2, OUT_H * (e.y ?? 0.82), base, 'AuraBebas, sans-serif', '#ffffff', 'rgba(0,0,0,0.9)', 0);
  }
  g.restore();
}

function meter(g: CanvasRenderingContext2D, t: number, total: number, pulse: number) {
  const lvl = Math.min(1, Math.pow(t / total, 0.8) * 1.08);
  const x0 = 90, y0 = 150, bw = OUT_W - 180, bh = 32;
  g.save();
  g.fillStyle = 'rgba(10,10,12,0.85)'; g.fillRect(x0 - 5, y0 - 5, bw + 10, bh + 10);
  const gr = g.createLinearGradient(x0, 0, x0 + bw, 0);
  gr.addColorStop(0, '#ff33c0'); gr.addColorStop(1, '#66ff4d');
  g.shadowColor = '#ff5ad0'; g.shadowBlur = 18 + 30 * pulse;
  g.fillStyle = gr; g.fillRect(x0, y0, bw * lvl, bh);
  g.shadowBlur = 0;
  g.font = '68px AuraBebas, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  g.shadowColor = '#ff28b4'; g.shadowBlur = 20;
  g.fillStyle = '#fff';
  g.fillText(`AURA  ${lvl >= 1 ? 'MAX' : Math.floor(lvl * 9999).toLocaleString('en-US')}`, OUT_W / 2, y0 - 24);
  g.restore();
}


// ---------- free-hand doodles ----------
// where a point of the source picture lands on the output canvas (mirrors the shaders' framing + the beat zoom)
function projector(st: FrameState) {
  const p = st.params;
  const sa = p.srcW / p.srcH, oa = OUT_W / OUT_H;
  return (u: number, v: number): [number, number] => {
    let ou = u, ov = v;
    if (p.mode === 1 && oa / sa < 1) { const bh = oa / sa; ov = 0.5 - bh / 2 + v * bh; }
    else if (sa > oa) { const cw = oa / sa; const x0 = Math.min(Math.max(p.cropX - cw / 2, 0), 1 - cw); ou = (u - x0) / cw; }
    else { const ch = sa / oa; ov = (v - (0.5 - ch / 2)) / ch; }
    const zu = (ou - p.center[0] + p.shift[0] / 720) * p.zoom + p.center[0];
    const zv = (ov - p.center[1] + p.shift[1] / 1280) * p.zoom + p.center[1];
    return [zu * OUT_W, (1 - zv) * OUT_H];
  };
}

// the person's outline: rays cast from the centre of the mask
function outline(st: FrameState) {
  const p = st.params, m = p.mask, w = p.maskW, h = p.maskH;
  const proj = projector(st);
  if (!m || !w) {
    const pts: [number, number][] = [];
    for (let k = 0; k < 48; k++) { const a = (k / 48) * Math.PI * 2; pts.push([OUT_W / 2 + Math.cos(a) * OUT_W * 0.3, OUT_H * 0.5 + Math.sin(a) * OUT_H * 0.28]); }
    return { pts, top: [OUT_W / 2, OUT_H * 0.22] as [number, number], box: [OUT_W * 0.2, OUT_H * 0.22, OUT_W * 0.8, OUT_H * 0.78] };
  }
  let sx = 0, sy = 0, n = 0;
  for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) if (m[y * w + x] > 128) { sx += x; sy += y; n++; }
  if (n < 20) return null;
  const cx = sx / n, cy = sy / n, R = Math.hypot(w, h);
  const pts: [number, number][] = [];
  let top: [number, number] = [0, Infinity];
  for (let k = 0; k < 72; k++) {
    const a = (k / 72) * Math.PI * 2, dx = Math.cos(a), dy = Math.sin(a);
    let last = 0;
    for (let r = 2; r < R; r += 2) {
      const x = Math.round(cx + dx * r), y = Math.round(cy + dy * r);
      if (x < 0 || y < 0 || x >= w || y >= h) break;
      if (m[y * w + x] > 128) last = r;
    }
    const q = proj((cx + dx * last + 0.5) / w, (cy + dy * last + 0.5) / h);
    pts.push(q);
    if (q[1] < top[1]) top = q;
  }
  const sm = pts.map((_, i) => { const a = pts[(i + 71) % 72], b = pts[i], c = pts[(i + 1) % 72]; return [(a[0] + b[0] * 2 + c[0]) / 4, (a[1] + b[1] * 2 + c[1]) / 4] as [number, number]; });
  const xs = sm.map((q) => q[0]), ys = sm.map((q) => q[1]);
  return { pts: sm, top, box: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)] };
}

type Pen = { line: string; fill: string; accent: string; glow: string | null; width: number };
const PENS: Record<'ink' | 'neon' | 'chalk', (tint: string) => Pen> = {
  ink: () => ({ line: '#14183d', fill: '#ffd23f', accent: '#ff4f9a', glow: null, width: 7 }),
  neon: (tint) => ({ line: '#ffffff', fill: 'rgba(0,0,0,0)', accent: tint, glow: tint, width: 6 }),
  chalk: (tint) => ({ line: tint, fill: 'rgba(0,0,0,0)', accent: '#ffd6e8', glow: null, width: 7 }),
};

function wobble(g: CanvasRenderingContext2D, pts: [number, number][], r: () => number, j: number, closed = false) {
  g.beginPath();
  pts.forEach(([x, y], i) => { const px = x + (r() - 0.5) * j, py = y + (r() - 0.5) * j; if (i) g.lineTo(px, py); else g.moveTo(px, py); });
  if (closed) g.closePath();
}
function strokeIt(g: CanvasRenderingContext2D, pen: Pen, draw: () => void, w = pen.width, color = pen.line) {
  g.save();
  g.lineCap = 'round'; g.lineJoin = 'round';
  if (pen.glow) { g.shadowColor = color === pen.line ? pen.glow : color; g.shadowBlur = 26; g.strokeStyle = color === pen.line ? pen.glow : color; g.lineWidth = w * 2.2; draw(); g.stroke(); g.shadowBlur = 10; }
  g.strokeStyle = color; g.lineWidth = w; draw(); g.stroke();
  g.restore();
}
function starPts(cx: number, cy: number, R: number, rot = 0): [number, number][] {
  return Array.from({ length: 10 }, (_, i) => { const a = rot - Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? R * 0.45 : R; return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr] as [number, number]; });
}
function heartPts(cx: number, cy: number, s: number): [number, number][] {
  return Array.from({ length: 28 }, (_, i) => { const t = (i / 28) * Math.PI * 2; return [cx + s * 16 * Math.sin(t) ** 3 / 16, cy - s * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 16] as [number, number]; });
}

function doodles(g: CanvasRenderingContext2D, st: FrameState, kind: 'ink' | 'neon' | 'chalk', t: number) {
  const o = outline(st);
  if (!o) return;
  const tint = '#' + st.params.tint.map((v) => Math.round(v * 255).toString(16).padStart(2, '0')).join('');
  const pen = PENS[kind](tint);
  const boil = Math.floor(t * 10);
  const r = rand(boil * 31 + 7);
  const [x0, y0, x1, y1] = o.box;
  const bw = Math.max(120, x1 - x0), cxp = (x0 + x1) / 2;
  const pop = 1 + 0.08 * st.pulse;
  // scribbled outline, drawn twice like a quick sketch
  const ring = o.pts.map(([x, y]) => [cxp + (x - cxp) * 1.06, y + (y < (y0 + y1) / 2 ? -14 : 8)] as [number, number]);
  strokeIt(g, pen, () => wobble(g, ring, r, 10, true));
  strokeIt(g, pen, () => wobble(g, ring, r, 16, true), pen.width * 0.5);
  // crown above the head
  const [hx, hy] = o.top;
  const cw = Math.min(260, Math.max(120, bw * 0.38)) * pop, ch = cw * 0.55, cy = Math.max(ch + 210, hy - 30);
  const crown: [number, number][] = [[hx - cw / 2, cy], [hx - cw / 2, cy - ch * 0.75], [hx - cw / 4, cy - ch * 0.35], [hx, cy - ch], [hx + cw / 4, cy - ch * 0.35], [hx + cw / 2, cy - ch * 0.75], [hx + cw / 2, cy]];
  g.save(); g.fillStyle = pen.fill; wobble(g, crown, r, 5, true); g.fill(); g.restore();
  strokeIt(g, pen, () => wobble(g, crown, r, 6, true));
  // stars and sparkles either side of the head, hearts lower down
  const side = (k: number) => (k % 2 ? x1 + 70 : x0 - 70);
  for (let k = 0; k < 3; k++) {
    const sx = Math.min(OUT_W - 60, Math.max(60, side(k))), sy = hy + 40 + k * 170;
    const R = (34 + 10 * Math.sin(t * 3 + k)) * pop;
    strokeIt(g, pen, () => wobble(g, starPts(sx, sy, R, boil * 0.1 + k), r, 4, true), pen.width * 0.8, k === 1 ? pen.accent : pen.line);
  }
  for (let k = 0; k < 2; k++) {
    const sx = k ? Math.min(OUT_W - 70, x1 + 40) : Math.max(70, x0 - 40), sy = Math.min(OUT_H - 380, y1 - 120 - k * 90);
    strokeIt(g, pen, () => wobble(g, heartPts(sx, sy, 1.9 * pop), r, 4, true), pen.width * 0.8, pen.accent);
  }
  for (let k = 0; k < 4; k++) { // sparkles
    const a = (k / 4) * Math.PI * 2 + 0.6, sx = hx + Math.cos(a) * cw * 0.9, sy = hy - ch * 0.4 + Math.sin(a) * ch * 0.9, L = 16 + 8 * st.pulse;
    strokeIt(g, pen, () => { g.beginPath(); g.moveTo(sx - L, sy); g.lineTo(sx + L, sy); g.moveTo(sx, sy - L); g.lineTo(sx, sy + L); }, pen.width * 0.6);
  }
  // motion lines and an arrow with a word
  for (let k = 0; k < 3; k++) {
    const yy = (y0 + y1) / 2 + (k - 1) * 60, xx = x0 - 30;
    strokeIt(g, pen, () => wobble(g, [[xx - 90 + k * 12, yy], [xx - 20, yy]], r, 5), pen.width * 0.6);
  }
  const ax = Math.min(OUT_W - 120, x1 + 150), ay = Math.min(OUT_H - 330, (y0 + y1) / 2 + 160);
  strokeIt(g, pen, () => wobble(g, [[ax, ay], [ax - 40, ay - 50], [x1 + 10, (y0 + y1) / 2 + 30]], r, 5), pen.width * 0.8);
  strokeIt(g, pen, () => wobble(g, [[x1 + 40, (y0 + y1) / 2 + 20], [x1 + 10, (y0 + y1) / 2 + 30], [x1 + 30, (y0 + y1) / 2 + 60]], r, 3), pen.width * 0.8);
  g.save();
  g.translate(ax + 10, ay + 46); g.rotate(-0.12 + (r() - 0.5) * 0.04);
  g.font = '86px AuraHand, cursive'; g.textAlign = 'center';
  if (pen.glow) { g.shadowColor = pen.glow; g.shadowBlur = 24; }
  g.fillStyle = pen.accent; g.fillText('aura', 0, 0);
  g.restore();
}

// ---------- comic sound effects on the beat ----------
const SFX = ['POW!', 'BAM!', 'ZAP!', 'WHAM!', 'BOOM!', 'KAPOW!', 'CRACK!', 'SMASH!'];
function burst(g: CanvasRenderingContext2D, st: FrameState, a: Analysis, t: number) {
  const d = [...a.downbeats].reverse().find((x) => x <= t);
  if (d === undefined || t - d > 0.55 || d < st.seg.t0) return;
  const k = a.downbeats.indexOf(d), lt = t - d;
  const r = rand(k * 13 + 5);
  const left = st.params.cropX > 0.5 ? 0.3 : 0.7;
  const cx = OUT_W * (left + (r() - 0.5) * 0.12), cy = OUT_H * (0.3 + r() * 0.12);
  const sc = Math.min(1, lt / 0.08) * (1.15 - 0.15 * Math.min(1, lt / 0.2));
  g.save(); g.translate(cx, cy); g.rotate((r() - 0.5) * 0.4); g.scale(sc, sc);
  const pts: [number, number][] = Array.from({ length: 22 }, (_, i) => { const a2 = (i / 22) * Math.PI * 2, rr = i % 2 ? 150 + r() * 30 : 250 + r() * 60; return [Math.cos(a2) * rr * 1.25, Math.sin(a2) * rr * 0.8]; });
  g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath();
  g.fillStyle = '#ffe14d'; g.fill(); g.lineWidth = 12; g.strokeStyle = '#111'; g.lineJoin = 'miter'; g.stroke();
  g.font = '150px AuraAnton, Impact, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineWidth = 16; g.strokeStyle = '#111'; g.strokeText(SFX[k % SFX.length], 0, 6);
  g.fillStyle = '#e3262f'; g.fillText(SFX[k % SFX.length], 0, 6);
  g.restore();
}

// everything drawn on top of the graded picture
export function drawOverlays(g: CanvasRenderingContext2D, plan: Plan, a: Analysis, st: FrameState, t: number, frameNo: number) {
  if (st.seg.look === 'embers') embers(g, t);
  if (st.seg.look === 'storm') lightning(g, st);
  const dk = doodleOf(st.seg);
  if (dk !== 'off' && !st.freeze) doodles(g, st, dk, t);
  if (burstsOf(st.seg) && !st.freeze) burst(g, st, a, t);
  if (st.freeze && st.freeze.text) {
    const lt = st.freezeT;
    g.save();
    const sc = Math.min(1, 0.4 + lt * 5);
    g.translate(OUT_W / 2, OUT_H * 0.8 - 45 * Math.min(1, lt * 4)); g.scale(sc, sc);
    const size = fitText(g, [st.freeze.text], 180, 'AuraAnton, Impact, sans-serif', OUT_W * 0.86);
    glowText(g, st.freeze.text, 0, 0, size, 'AuraAnton, Impact, sans-serif', '#ffffff', '#50ff78', 6);
    g.restore();
  }
  for (const e of plan.events) if (e.kind === 'text' && t >= e.t && t < e.t + e.dur) caption(g, e, t, st, frameNo);
  if (plan.meter) meter(g, t, a.duration, st.pulse);
}
