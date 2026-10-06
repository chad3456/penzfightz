import type { Scene } from './chapters';

/**
 * Twenty living pictures, one per chapter, each drawn from the image the
 * chapter keeps returning to. Canvas 2D, a night-indigo ground, saffron
 * gold and ivory light. Each responds to the pointer a little — the world
 * moves; the witness does not.
 */

export interface Ptr { x: number; y: number; on: boolean; down: boolean }
export interface Painter { draw(g: CanvasRenderingContext2D, w: number, h: number, t: number, p: Ptr): void }

const GOLD = '232,176,74', IVORY = '243,234,216', VERM = '194,65,43', TEAL = '70,150,160', INDIGO = '11,13,26';
const rnd = (s: number) => { let x = s >>> 0; return () => { x = (x * 1664525 + 1013904223) >>> 0; return x / 4294967296; }; };

function bg(g: CanvasRenderingContext2D, w: number, h: number, top = '#0b0d1a', bottom = '#151a33') {
  const gr = g.createLinearGradient(0, 0, 0, h);
  gr.addColorStop(0, top); gr.addColorStop(1, bottom);
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
}
function glow(g: CanvasRenderingContext2D, x: number, y: number, r: number, rgb: string, a = 1) {
  const gr = g.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(0.35, `rgba(${rgb},${a * 0.35})`); gr.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
}
function text(g: CanvasRenderingContext2D, s: string, x: number, y: number, size: number, rgb: string, a: number) {
  g.font = `${size}px "Noto Serif Devanagari", serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = `rgba(${rgb},${a})`; g.fillText(s, x, y);
}

export function makeScene(kind: Scene): Painter {
  const R = rnd(kind.length * 7919 + kind.charCodeAt(0));
  switch (kind) {
    // 1 · five elements circle a point that never moves
    case 'witness': {
      const parts = Array.from({ length: 260 }, (_, i) => ({ e: i % 5, a: R() * Math.PI * 2, r: 0.18 + R() * 0.32, s: (R() - 0.5) * 0.3 + (i % 2 ? 0.12 : -0.1), z: R() }));
      const col = ['150,110,70', TEAL, '230,110,50', '200,210,220', '170,150,230'];
      return { draw(g, w, h, t, p) {
        bg(g, w, h);
        const cx = w / 2, cy = h / 2, m = Math.min(w, h);
        for (const q of parts) {
          q.a += q.s * 0.01;
          let x = cx + Math.cos(q.a) * q.r * m, y = cy + Math.sin(q.a) * q.r * m * 0.7;
          if (p.on) { const dx = x - p.x * w, dy = y - p.y * h, d = Math.hypot(dx, dy); if (d < m * 0.15) { x += (dx / d) * (m * 0.15 - d) * 0.6; y += (dy / d) * (m * 0.15 - d) * 0.6; } }
          g.fillStyle = `rgba(${col[q.e]},${0.35 + q.z * 0.5})`;
          if (q.e === 0) g.fillRect(x, y, 2.4, 2.4);
          else if (q.e === 1) { g.beginPath(); g.arc(x, y, 1.6 + q.z * 2, 0, 7); g.fill(); }
          else if (q.e === 2) { glow(g, x, y, 5, col[2], 0.5); }
          else if (q.e === 3) { g.fillRect(x - 5, y, 10, 1); }
          else { g.fillRect(x, y, 1.2, 1.2); }
        }
        glow(g, cx, cy, m * 0.12, IVORY, 0.55 + 0.05 * Math.sin(t));
        g.fillStyle = `rgb(${IVORY})`; g.beginPath(); g.arc(cx, cy, 3, 0, 7); g.fill();
      } };
    }
    // 2 · one ocean; waves rise and fall
    case 'ocean': return { draw(g, w, h, t, p) {
      bg(g, w, h, '#0b0d1a', '#0f2230');
      for (let row = 0; row < 26; row++) {
        const y0 = h * 0.38 + row * h * 0.024, amp = 4 + row * 1.1;
        g.beginPath();
        for (let x = 0; x <= w; x += 6) {
          const pull = p.on ? Math.exp(-((x - p.x * w) ** 2) / (w * w * 0.01)) * 22 : 0;
          const y = y0 + Math.sin(x * 0.012 + t * 0.8 + row * 0.6) * amp + Math.sin(x * 0.031 - t * 1.3 + row) * amp * 0.4 - pull * (1 - row / 26);
          x === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
        }
        g.strokeStyle = `rgba(${row < 4 ? IVORY : TEAL},${0.12 + row * 0.02})`; g.lineWidth = 1 + row * 0.05; g.stroke();
      }
      text(g, 'अहो', w / 2, h * 0.22, Math.min(w, h) * 0.13, GOLD, 0.25 + 0.2 * Math.sin(t * 0.7));
    } };
    // 3 · a glint in mother-of-pearl that looks like silver
    case 'pearl': return { draw(g, w, h, t, p) {
      bg(g, w, h);
      const cx = w / 2, cy = h * 0.58, m = Math.min(w, h) * 0.32;
      const near = p.on ? Math.hypot(p.x * w - cx, p.y * h - cy) < m * 1.3 : false;
      for (let i = 0; i < 14; i++) {
        const a = Math.PI + (i / 13) * Math.PI;
        g.beginPath(); g.moveTo(cx, cy + m * 0.25);
        g.quadraticCurveTo(cx + Math.cos(a) * m * 0.7, cy + Math.sin(a) * m * 0.7, cx + Math.cos(a) * m, cy + Math.sin(a) * m * 0.9);
        const hue = (i * 25 + t * 20) % 360;
        g.strokeStyle = near ? `hsla(${hue},40%,75%,0.55)` : `rgba(210,215,225,${0.35 + 0.2 * Math.sin(t + i)})`;
        g.lineWidth = 2; g.stroke();
      }
      g.beginPath(); g.ellipse(cx, cy + m * 0.25, m, m * 0.12, 0, 0, Math.PI); g.strokeStyle = `rgba(${IVORY},0.4)`; g.stroke();
      if (!near) { glow(g, cx + m * 0.2, cy - m * 0.35, m * 0.35, '220,225,235', 0.6); text(g, 'रजत?', cx + m * 0.2, cy - m * 0.9, m * 0.22, IVORY, 0.5); }
      else text(g, 'शुक्ति', cx, cy - m * 0.9, m * 0.22, GOLD, 0.7);
    } };
    // 4 · smoke rises; the sky is not touched
    case 'smoke': {
      const puffs: { x: number; y: number; r: number; a: number }[] = [];
      return { draw(g, w, h, t, p) {
        bg(g, w, h, '#0d1430', '#1a2448');
        for (let i = 0; i < 120; i++) { const r2 = rnd(i * 31)(); g.fillStyle = `rgba(${IVORY},${0.25 + 0.5 * r2})`; g.fillRect(rnd(i)() * w, rnd(i + 999)() * h * 0.7, 1.3, 1.3); }
        if (R() < 0.5) puffs.push({ x: w * 0.5 + (R() - 0.5) * 20 + (p.on ? (p.x - 0.5) * w * 0.3 : 0), y: h * 0.95, r: 8, a: 0.35 });
        for (const q of puffs) { q.y -= 0.9; q.x += Math.sin(q.y * 0.02 + t) * 0.6; q.r += 0.25; q.a *= 0.994; g.fillStyle = `rgba(150,150,160,${q.a * 0.25})`; g.beginPath(); g.arc(q.x, q.y, q.r, 0, 7); g.fill(); }
        while (puffs.length && puffs[0].a < 0.02) puffs.shift();
        while (puffs.length > 220) puffs.shift();
      } };
    }
    // 5 · bubbles from the sea, back into it
    case 'bubble': {
      const bs = Array.from({ length: 50 }, () => ({ x: R(), y: R(), r: 3 + R() * 14, s: 0.3 + R() * 0.8 }));
      return { draw(g, w, h, t, p) {
        bg(g, w, h, '#0a1a24', '#0b0d1a');
        for (const b of bs) {
          b.y -= b.s * 0.0025; if (b.y < 0.05) { b.y = 1; b.x = R(); }
          const x = b.x * w + Math.sin(t + b.r) * 6, y = b.y * h;
          const fade = Math.min(1, (b.y - 0.05) * 5);
          g.strokeStyle = `rgba(${IVORY},${0.5 * fade})`; g.lineWidth = 1.2; g.beginPath(); g.arc(x, y, b.r * (p.on && Math.hypot(x - p.x * w, y - p.y * h) < 60 ? 0.3 : 1), 0, 7); g.stroke();
          g.fillStyle = `rgba(${IVORY},${0.5 * fade})`; g.beginPath(); g.arc(x - b.r * 0.35, y - b.r * 0.35, b.r * 0.15, 0, 7); g.fill();
        }
        g.fillStyle = `rgba(${TEAL},0.18)`; g.fillRect(0, h * 0.05, w, 2);
      } };
    }
    // 6 · pots are made and broken; space stays
    case 'pots': {
      const pots = Array.from({ length: 7 }, (_, i) => ({ x: (i + 0.5) / 7, life: R() * 6 }));
      return { draw(g, w, h, _t, p) {
        bg(g, w, h, '#0b0d1a', '#12162a');
        for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(${IVORY},0.35)`; g.fillRect(rnd(i * 13)() * w, rnd(i * 17)() * h, 1, 1); }
        for (const q of pots) {
          q.life += 0.008; if (q.life > 6) q.life = 0;
          const x = q.x * w, y = h * 0.62, s = Math.min(w / 9, h / 4);
          const broken = q.life > 4.5 || (p.down && Math.abs(p.x * w - x) < s * 0.6);
          const a = Math.min(1, q.life) * (broken ? Math.max(0, 1 - (q.life - 4.5)) : 1);
          g.strokeStyle = `rgba(${GOLD},${a * 0.8})`; g.lineWidth = 1.6;
          g.beginPath();
          if (!broken) { g.moveTo(x - s * 0.2, y - s * 0.6); g.bezierCurveTo(x - s * 0.7, y - s * 0.3, x - s * 0.55, y + s * 0.5, x, y + s * 0.5); g.bezierCurveTo(x + s * 0.55, y + s * 0.5, x + s * 0.7, y - s * 0.3, x + s * 0.2, y - s * 0.6); }
          else for (let k = 0; k < 5; k++) { const ox = (k - 2) * s * 0.25 * (q.life - 4), oy = s * 0.5 + Math.abs(k - 2) * 4; g.moveTo(x + ox - 6, y + oy); g.lineTo(x + ox + 6, y + oy - 4); }
          g.stroke();
        }
      } };
    }
    // 7 · a boat on a boundless ocean, drifting on its own wind
    case 'boat': return { draw(g, w, h, t, p) {
      bg(g, w, h, '#0b0d1a', '#102534');
      const hy = h * 0.6;
      for (let k = 0; k < 40; k++) { const y = hy + k * 6; g.strokeStyle = `rgba(${TEAL},${0.05 + k * 0.006})`; g.beginPath(); for (let x = 0; x <= w; x += 10) { const yy = y + Math.sin(x * 0.01 + t * 0.6 + k) * 2; x ? g.lineTo(x, yy) : g.moveTo(x, yy); } g.stroke(); }
      const bx = w * 0.5 + Math.sin(t * 0.13) * w * 0.3 + (p.on ? (p.x - 0.5) * 30 : 0), by = hy - 4 + Math.sin(t * 0.9) * 3;
      g.save(); g.translate(bx, by); g.rotate(Math.sin(t * 0.8) * 0.05);
      g.strokeStyle = `rgba(${GOLD},0.9)`; g.lineWidth = 1.6;
      g.beginPath(); g.moveTo(-34, 0); g.quadraticCurveTo(0, 14, 34, 0); g.lineTo(-34, 0); g.stroke();
      g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -42); g.lineTo(22, -10); g.lineTo(0, -10); g.stroke();
      g.restore();
      glow(g, w * 0.82, h * 0.18, 60, IVORY, 0.35);
    } };
    // 8 · every wanting a knot; when the pointer rests, they untie
    case 'knots': {
      let tension = 0, last = { x: 0, y: 0 };
      return { draw(g, w, h, t, p) {
        bg(g, w, h);
        const moving = p.on && Math.hypot(p.x - last.x, p.y - last.y) > 0.002;
        last = { x: p.x, y: p.y };
        tension += ((moving ? 1 : 0) - tension) * 0.03;
        for (let i = 0; i < 9; i++) {
          const y0 = h * (0.15 + i * 0.09);
          g.beginPath();
          for (let x = 0; x <= w; x += 4) {
            const kx = (x / w - (0.2 + (i % 3) * 0.3)) * 18;
            const loop = Math.exp(-kx * kx) * tension;
            const y = y0 + Math.sin(x * 0.02 + t + i) * 4 + Math.sin(kx * 3) * 18 * loop;
            const xx = x + Math.cos(kx * 3) * 14 * loop;
            x ? g.lineTo(xx, y) : g.moveTo(xx, y);
          }
          g.strokeStyle = `rgba(${i % 2 ? GOLD : VERM},${0.35 + 0.3 * tension})`; g.lineWidth = 1.5; g.stroke();
        }
        text(g, tension > 0.5 ? 'बन्धः' : 'मुक्तिः', w / 2, h * 0.93, Math.min(w, h) * 0.06, IVORY, 0.5);
      } };
    }
    // 9 · pairs of opposites, drifting and fading
    case 'pairs': {
      const P = [['कृत', 'अकृत'], ['सुख', 'दुःख'], ['लाभ', 'हानि'], ['मान', 'अपमान'], ['जय', 'पराजय'], ['राग', 'द्वेष'], ['आशा', 'निराशा']];
      return { draw(g, w, h, t, p) {
        bg(g, w, h);
        P.forEach(([a, b], i) => {
          const ph = (t * 0.08 + i / P.length) % 1;
          const y = h * (1 - ph), al = Math.sin(ph * Math.PI) * 0.8;
          const sep = w * 0.18 * (1 - ph) + 20 + (p.on ? Math.abs(p.y * h - y) < 40 ? 60 : 0 : 0);
          text(g, a, w / 2 - sep, y, 22, GOLD, al); text(g, b, w / 2 + sep, y, 22, IVORY, al);
          g.strokeStyle = `rgba(${IVORY},${al * 0.25})`; g.beginPath(); g.moveTo(w / 2 - sep + 30, y); g.lineTo(w / 2 + sep - 30, y); g.stroke();
        });
      } };
    }
    // 10 · a city of cloud, lasting three or five days
    case 'mirage': return { draw(g, w, h, t, p) {
      bg(g, w, h, '#1a1230', '#0b0d1a');
      const life = (Math.sin(t * 0.25) + 1) / 2;
      for (let i = 0; i < 18; i++) {
        const bw = w / 22, bh = h * (0.12 + rnd(i * 7)() * 0.3), x = w * 0.08 + i * w * 0.048, y = h * 0.62 - bh;
        const a = life * (0.2 + 0.5 * rnd(i)()) * (p.on && Math.abs(p.x * w - x) < 60 ? 0.2 : 1);
        g.strokeStyle = `rgba(${GOLD},${a})`; g.strokeRect(x, y, bw, bh);
        if (i % 3 === 0) { g.beginPath(); g.arc(x + bw / 2, y, bw / 2, Math.PI, 0); g.stroke(); }
      }
      text(g, '३ · ५', w / 2, h * 0.82, 20, IVORY, 0.4);
    } };
    // 11 · a light that needs nothing to shine on
    case 'light': return { draw(g, w, h, t, p) {
      bg(g, w, h, '#0b0d1a', '#0b0d1a');
      const cx = p.on ? w * (0.5 + (p.x - 0.5) * 0.1) : w / 2, cy = h / 2;
      for (let i = 0; i < 48; i++) {
        const a = (i / 48) * Math.PI * 2 + t * 0.05, L = Math.min(w, h) * (0.3 + 0.15 * Math.sin(t * 0.6 + i * 1.7));
        const gr = g.createLinearGradient(cx, cy, cx + Math.cos(a) * L, cy + Math.sin(a) * L);
        gr.addColorStop(0, `rgba(${GOLD},0.35)`); gr.addColorStop(1, `rgba(${GOLD},0)`);
        g.strokeStyle = gr; g.lineWidth = 1.2; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * L, cy + Math.sin(a) * L); g.stroke();
      }
      glow(g, cx, cy, Math.min(w, h) * 0.18, IVORY, 0.7);
    } };
    // 12 · body, speech, thought dissolve in that order
    case 'layers': return { draw(g, w, h, t, p) {
      bg(g, w, h);
      const cx = w / 2, cy = h / 2, m = Math.min(w, h);
      const ph = (t * 0.06) % 1.4;
      const labels = ['काय', 'वाक्', 'चिन्ता'];
      labels.forEach((lb, i) => {
        const r = m * (0.38 - i * 0.1), fade = Math.max(0, Math.min(1, 1 - (ph - i * 0.3) * 3));
        g.strokeStyle = `rgba(${[VERM, GOLD, IVORY][i]},${0.6 * fade})`; g.lineWidth = 2;
        g.setLineDash([4 + i * 3, 6]); g.beginPath(); g.arc(cx, cy, r + (p.on ? 3 * Math.sin(t * 3 + i) : 0), 0, 7); g.stroke(); g.setLineDash([]);
        text(g, lb, cx, cy - r - 12, 15, IVORY, 0.6 * fade);
      });
      glow(g, cx, cy, m * 0.08, IVORY, 0.6);
    } };
    // 13 · a leaf riding a stream
    case 'leaf': return { draw(g, w, h, t, p) {
      bg(g, w, h, '#0b0d1a', '#0e1f26');
      for (let k = 0; k < 22; k++) { g.strokeStyle = `rgba(${TEAL},0.12)`; g.beginPath(); for (let x = 0; x <= w; x += 8) { const y = h * 0.3 + k * h * 0.025 + Math.sin(x * 0.015 - t * 1.2 + k) * 4; x ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); }
      const lx = ((t * 40) % (w + 80)) - 40, ly = h * 0.55 + Math.sin(t * 1.3) * 8 + (p.on ? (p.y - 0.5) * 20 : 0);
      g.save(); g.translate(lx, ly); g.rotate(Math.sin(t) * 0.3);
      g.fillStyle = `rgba(${GOLD},0.85)`; g.beginPath(); g.ellipse(0, 0, 16, 6, 0, 0, 7); g.fill();
      g.strokeStyle = `rgba(${INDIGO},0.8)`; g.beginPath(); g.moveTo(-14, 0); g.lineTo(16, 0); g.stroke();
      g.restore();
      text(g, 'यथासुखम्', w / 2, h * 0.15, 20, IVORY, 0.45);
    } };
    // 14 · the moon in still water
    case 'moon': return { draw(g, w, h, t, p) {
      bg(g, w, h, '#06070f', '#0b0d1a');
      const mx = w * 0.5, my = h * 0.28, r = Math.min(w, h) * 0.08;
      glow(g, mx, my, r * 4, IVORY, 0.3); g.fillStyle = `rgba(${IVORY},0.92)`; g.beginPath(); g.arc(mx, my, r, 0, 7); g.fill();
      g.fillStyle = 'rgba(8,10,20,1)'; g.fillRect(0, h * 0.62, w, h);
      const ripple = p.on ? 6 : 1;
      for (let i = 0; i < 18; i++) { const y = h * 0.66 + i * 7, ww = r * (2.2 - i * 0.06) + Math.sin(t * 2 + i) * ripple; g.fillStyle = `rgba(${IVORY},${0.5 - i * 0.025})`; g.fillRect(mx - ww / 2 + Math.sin(t + i) * ripple, y, ww, 2); }
    } };
    // 15 · a rope at dusk: a snake until the light reaches it
    case 'rope': return { draw(g, w, h, t, p) {
      bg(g, w, h, '#07080f', '#0b0d1a');
      const lit = p.on ? Math.max(0, 1 - Math.hypot(p.x - 0.5, p.y - 0.62) * 2.2) : 0;
      if (p.on) glow(g, p.x * w, p.y * h, Math.min(w, h) * 0.3, GOLD, 0.25);
      g.lineWidth = 7; g.lineCap = 'round';
      g.beginPath();
      for (let i = 0; i <= 120; i++) {
        const u = i / 120, x = w * (0.2 + u * 0.6), wig = (1 - lit) * Math.sin(u * 14 - t * 2.2) * 14;
        const y = h * 0.62 + Math.sin(u * 5) * 18 + wig;
        i ? g.lineTo(x, y) : g.moveTo(x, y);
      }
      g.strokeStyle = lit > 0.4 ? `rgba(190,160,110,0.9)` : `rgba(80,120,70,0.85)`; g.stroke();
      if (lit > 0.4) for (let i = 0; i < 30; i++) { const x = w * (0.2 + (i / 30) * 0.6); g.strokeStyle = 'rgba(120,95,60,0.8)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x, h * 0.62 + Math.sin((i / 30) * 5) * 18 - 4); g.lineTo(x + 5, h * 0.62 + Math.sin((i / 30) * 5) * 18 + 4); g.stroke(); }
      text(g, lit > 0.4 ? 'रज्जु' : 'सर्प?', w / 2, h * 0.3, 24, IVORY, 0.55);
      g.lineCap = 'butt';
    } };
    // 16 · letters of scripture written, then wiped away
    case 'forget': {
      const words = ['वेद', 'उपनिषद्', 'सूत्र', 'शास्त्र', 'पुराण', 'स्मृति', 'भाष्य', 'टीका', 'गीता', 'मत'];
      return { draw(g, w, h, t, p) {
        bg(g, w, h, '#0e0f18', '#0b0d1a');
        words.forEach((wd, i) => {
          const ph = (t * 0.1 + i * 0.1) % 1;
          const a = ph < 0.5 ? ph * 2 : (1 - ph) * 2;
          text(g, wd, w * (0.15 + ((i * 37) % 70) / 100), h * (0.15 + ((i * 53) % 70) / 100), 18 + (i % 3) * 6, GOLD, a * (p.on ? 0.3 : 0.7));
        });
        text(g, 'सर्वविस्मरणात्', w / 2, h * 0.5, Math.min(w, h) * 0.06, IVORY, 0.12 + 0.1 * Math.sin(t * 0.5));
      } };
    }
    // 17 · one flame in a great dark
    case 'flame': return { draw(g, w, h, t, p) {
      bg(g, w, h, '#050609', '#0b0d1a');
      const fx = w / 2, fy = h * 0.62, s = Math.min(w, h) * 0.06;
      glow(g, fx, fy - s, s * 8, GOLD, 0.35);
      const lean = p.on ? (p.x - 0.5) * 0.4 : 0;
      g.fillStyle = `rgba(${GOLD},0.95)`;
      g.beginPath(); g.moveTo(fx, fy); g.quadraticCurveTo(fx - s * 0.7, fy - s * 0.8, fx + Math.sin(t * 7) * 2 + lean * s * 3, fy - s * 2.2); g.quadraticCurveTo(fx + s * 0.7, fy - s * 0.8, fx, fy); g.fill();
      g.fillStyle = `rgba(${IVORY},0.95)`; g.beginPath(); g.ellipse(fx, fy - s * 0.5, s * 0.18, s * 0.45, 0, 0, 7); g.fill();
      g.fillStyle = `rgba(${GOLD},0.5)`; g.fillRect(fx - s * 0.8, fy, s * 1.6, s * 0.25);
    } };
    // 18 · a dry leaf on the wind of old impressions; the sun crosses the day
    case 'dryleaf': {
      const leaves = Array.from({ length: 24 }, () => ({ x: R(), y: R(), r: R() * 6, s: 0.5 + R() }));
      return { draw(g, w, h, t, p) {
        const day = (Math.sin(t * 0.05) + 1) / 2;
        bg(g, w, h, day > 0.5 ? '#1a1630' : '#0b0d1a', '#151a33');
        const sx = w * (0.1 + 0.8 * ((t * 0.01) % 1)), sy = h * 0.5 - Math.sin(((t * 0.01) % 1) * Math.PI) * h * 0.35;
        glow(g, sx, sy, 70, GOLD, 0.45);
        for (const L of leaves) {
          L.x += 0.0012 * L.s + (p.on ? (p.x - 0.5) * 0.002 : 0); L.y += Math.sin(t * L.s + L.r) * 0.0015 + 0.0006;
          if (L.x > 1.05) L.x = -0.05; if (L.y > 1.05) L.y = -0.05; if (L.y < -0.05) L.y = 1;
          g.save(); g.translate(L.x * w, L.y * h); g.rotate(t * L.s + L.r);
          g.strokeStyle = `rgba(${GOLD},0.6)`; g.fillStyle = `rgba(150,105,55,0.55)`;
          g.beginPath(); g.ellipse(0, 0, 9, 4, 0, 0, 7); g.fill(); g.stroke();
          g.restore();
        }
      } };
    }
    // 19 · "kva?" — questions rise and dissolve
    case 'kva': {
      const words = ['धर्म', 'काम', 'अर्थ', 'द्वैत', 'अद्वैत', 'भूत', 'भविष्य', 'वर्तमान', 'स्वप्न', 'जागरण', 'दूर', 'समीप', 'मृत्यु', 'जीवन'];
      return { draw(g, w, h, t, p) {
        bg(g, w, h);
        words.forEach((wd, i) => {
          const ph = (t * 0.07 + i / words.length) % 1;
          const x = w * (0.12 + ((i * 41) % 76) / 100), y = h * (0.95 - ph * 0.9);
          const a = Math.sin(ph * Math.PI) * (p.on && Math.hypot(p.x * w - x, p.y * h - y) < 80 ? 0.15 : 0.8);
          text(g, 'क्व ' + wd + '?', x, y, 18, i % 2 ? GOLD : IVORY, a);
        });
      } };
    }
    // 20 · the page empties: a last point, then not even that
    case 'nothing': return { draw(g, w, h, t, p) {
      bg(g, w, h, '#0b0d1a', '#0b0d1a');
      const cyc = (t * 0.05) % 1;
      const a = cyc < 0.7 ? 1 - cyc / 0.7 : 0;
      for (let i = 0; i < 200 * a; i++) { const r = rnd(i * 97); g.fillStyle = `rgba(${IVORY},${0.4 * a})`; g.fillRect(r() * w, r() * h, 1.2, 1.2); }
      if (cyc < 0.85) { g.fillStyle = `rgba(${IVORY},${cyc < 0.7 ? 0.9 : (0.85 - cyc) / 0.15})`; g.beginPath(); g.arc(w / 2, h / 2, 2, 0, 7); g.fill(); }
      if (p.on) text(g, 'किंचिन्नोत्तिष्ठते मम', w / 2, h * 0.85, 16, GOLD, 0.25);
    } };
  }
  return { draw(g, w, h) { bg(g, w, h); } };
}
