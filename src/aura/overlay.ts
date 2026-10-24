import type { Analysis, AuraEvent, FrameState, Plan } from './plan';

export const OUT_W = 1080;
export const OUT_H = 1920;

let fontsReady: Promise<void> | null = null;
export function loadFonts() {
  fontsReady ||= (async () => {
    const base = (import.meta.env.BASE_URL || '/') + 'fonts-aura/';
    for (const [fam, file] of [['AuraAnton', 'Anton-Regular.ttf'], ['AuraBebas', 'BebasNeue-Regular.ttf']]) {
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

// everything drawn on top of the graded picture
export function drawOverlays(g: CanvasRenderingContext2D, plan: Plan, a: Analysis, st: FrameState, t: number, frameNo: number) {
  if (st.seg.look === 'embers') embers(g, t);
  if (st.seg.look === 'storm') lightning(g, st);
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
