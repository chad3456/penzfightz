import * as THREE from 'three';
import { clamp, fbm, rng, vnoise } from './pond';

/**
 * Everything painted for the garden: pebbles, grass, soil, lily pads, leaves,
 * blossoms and paper. All drawn on canvases at load; no image files.
 */

function canvas(w: number, h: number) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  return { cv, ctx: cv.getContext('2d')! };
}
function tex(cv: HTMLCanvasElement, srgb = true, repeat = true) {
  const t = new THREE.CanvasTexture(cv);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) { t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.RepeatWrapping; }
  t.anisotropy = 8;
  return t;
}

/** River pebbles in silt, tileable. */
export function pebbleTexture(seed = 3) {
  const S = 512;
  const { cv, ctx } = canvas(S, S);
  const r = rng(seed);
  // silt with mottling
  const img = ctx.createImageData(S, S);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const n = fbm(x / 40, y / 40, 3) * 0.6 + vnoise(x / 6, y / 6) * 0.4;
    const k = (y * S + x) * 4;
    img.data[k] = 92 + n * 40; img.data[k + 1] = 84 + n * 36; img.data[k + 2] = 66 + n * 28; img.data[k + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const tones = ['#8d8a82', '#a49a88', '#6f6a62', '#b8ae9a', '#7d6b55', '#9c8f7b', '#c9c2b4', '#5c5853', '#8a7660', '#b39b7a'];
  for (let i = 0; i < 520; i++) {
    const x = r() * S, y = r() * S;
    const rad = 5 + r() ** 2 * 22, e = 0.6 + r() * 0.4, rot = r() * Math.PI;
    const col = tones[Math.floor(r() * tones.length)];
    for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) {
      const cx = x + ox, cy = y + oy;
      if (cx < -40 || cx > S + 40 || cy < -40 || cy > S + 40) continue;
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); ctx.scale(1, e);
      // contact shadow, body, then a soft top light
      ctx.fillStyle = 'rgba(30,25,18,0.45)'; ctx.beginPath(); ctx.arc(1.5, 2.5, rad * 1.05, 0, Math.PI * 2); ctx.fill();
      const g = ctx.createRadialGradient(-rad * 0.35, -rad * 0.4, rad * 0.1, 0, 0, rad);
      g.addColorStop(0, shade(col, 1.25)); g.addColorStop(0.65, col); g.addColorStop(1, shade(col, 0.7));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, rad, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  }
  return tex(cv);
}

function shade(hex: string, k: number) {
  const v = parseInt(hex.slice(1), 16);
  const c = [(v >> 16) & 255, (v >> 8) & 255, v & 255].map((x) => Math.round(clamp(x * k, 0, 255)));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

/** Short lawn grass and moss, tileable. */
export function grassTexture(seed = 5) {
  const S = 512;
  const { cv, ctx } = canvas(S, S);
  const r = rng(seed);
  const img = ctx.createImageData(S, S);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const n = fbm(x / 60, y / 60, 3), m = vnoise(x / 4, y / 4);
    const k = (y * S + x) * 4;
    img.data[k] = 52 + n * 40 + m * 14; img.data[k + 1] = 82 + n * 50 + m * 18; img.data[k + 2] = 34 + n * 18; img.data[k + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  ctx.lineCap = 'round';
  for (let i = 0; i < 9000; i++) {
    const x = r() * S, y = r() * S, a = r() * Math.PI * 2, l = 3 + r() * 7;
    const g = 70 + r() * 90;
    ctx.strokeStyle = `rgba(${g * 0.55 + r() * 30},${g + 20},${g * 0.35},${0.35 + r() * 0.4})`;
    ctx.lineWidth = 0.8 + r();
    for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) {
      if (x + ox < -12 || x + ox > S + 12 || y + oy < -12 || y + oy > S + 12) continue;
      ctx.beginPath(); ctx.moveTo(x + ox, y + oy); ctx.lineTo(x + ox + Math.cos(a) * l, y + oy + Math.sin(a) * l); ctx.stroke();
    }
  }
  return tex(cv);
}

/** Dark garden soil with grit and a few fallen needles. */
export function soilTexture(seed = 8) {
  const S = 256;
  const { cv, ctx } = canvas(S, S);
  const r = rng(seed);
  const img = ctx.createImageData(S, S);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const n = fbm(x / 30, y / 30, 3), m = vnoise(x / 2.5, y / 2.5);
    const k = (y * S + x) * 4;
    img.data[k] = 64 + n * 34 + m * 16; img.data[k + 1] = 50 + n * 26 + m * 12; img.data[k + 2] = 36 + n * 18 + m * 8; img.data[k + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  for (let i = 0; i < 400; i++) {
    const x = r() * S, y = r() * S;
    ctx.fillStyle = `rgba(${150 + r() * 60},${140 + r() * 50},${120 + r() * 40},${0.4 + r() * 0.4})`;
    ctx.beginPath(); ctx.arc(x, y, 0.6 + r() * 1.6, 0, Math.PI * 2); ctx.fill();
  }
  return tex(cv);
}

/** Lily pad: waxy green with radial veins, a touch of red-bronze at the rim. */
export function lilyTexture() {
  const S = 256;
  const { cv, ctx } = canvas(S, S);
  const img = ctx.createImageData(S, S);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const dx = (x - S / 2) / (S / 2), dy = (y - S / 2) / (S / 2);
    const rr = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
    const vein = Math.pow(Math.abs(Math.sin(a * 13 + rr * 2.5)), 30) * clamp(rr * 3, 0, 1) * 0.5;
    const n = fbm(x / 25, y / 25, 3);
    let R = 46 + n * 30, G = 98 + n * 40, B = 36 + n * 14;
    const rim = clamp((rr - 0.86) / 0.14, 0, 1);
    R += rim * 60; G -= rim * 22; B += rim * 6;
    R += vein * 50; G += vein * 60; B += vein * 30;
    const k = (y * S + x) * 4;
    img.data[k] = clamp(R, 0, 255); img.data[k + 1] = clamp(G, 0, 255); img.data[k + 2] = clamp(B, 0, 255); img.data[k + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return tex(cv, true, false);
}

/**
 * Leaf atlas, four cells across: maple (red), maple (amber), ginkgo, cherry leaf.
 * Colour + alpha; uv.x picks the cell.
 */
export function leafAtlas() {
  const C = 128;
  const { cv, ctx } = canvas(C * 4, C);
  const r = rng(21);
  const draw = (i: number, path: (c: CanvasRenderingContext2D) => void, fill: string, vein: string) => {
    ctx.save(); ctx.translate(i * C + C / 2, C / 2);
    ctx.beginPath(); path(ctx); ctx.closePath();
    const g = ctx.createRadialGradient(0, 10, 4, 0, 0, C * 0.55);
    g.addColorStop(0, shade(fill, 1.15)); g.addColorStop(1, shade(fill, 0.78));
    ctx.fillStyle = g; ctx.fill();
    ctx.clip();
    ctx.strokeStyle = vein; ctx.lineWidth = 1.2;
    for (let k = 0; k < 7; k++) { const a = -Math.PI / 2 + (k - 3) * 0.48; ctx.beginPath(); ctx.moveTo(0, 22); ctx.lineTo(Math.cos(a) * 60, 22 + Math.sin(a) * 60); ctx.stroke(); }
    // speckle of age
    for (let k = 0; k < 40; k++) { ctx.fillStyle = `rgba(60,30,10,${r() * 0.18})`; ctx.beginPath(); ctx.arc((r() - 0.5) * C, (r() - 0.5) * C, r() * 3, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  };
  const maple = (c: CanvasRenderingContext2D) => {
    // seven pointed lobes with toothed edges
    const lobes = 7;
    for (let k = 0; k <= lobes * 2; k++) {
      const a = -Math.PI / 2 + (k / (lobes * 2)) * Math.PI * 2 * 0.86 - Math.PI * 0.86 + Math.PI / 2 * 0;
      const rr = k % 2 === 0 ? 56 - Math.abs(k - lobes) * 3 : 20;
      const x = Math.cos(a - Math.PI * 0.07) * rr, y = Math.sin(a - Math.PI * 0.07) * rr + 10;
      if (k === 0) c.moveTo(x, y); else c.lineTo(x, y);
    }
    c.lineTo(2, 30); c.lineTo(1, 60); c.lineTo(-1, 60); c.lineTo(-2, 30);
  };
  const ginkgo = (c: CanvasRenderingContext2D) => {
    c.moveTo(0, 50);
    c.quadraticCurveTo(-58, -6, -48, -38);
    c.quadraticCurveTo(-22, -54, -3, -40); c.lineTo(0, -28); c.lineTo(3, -40);
    c.quadraticCurveTo(22, -54, 48, -38);
    c.quadraticCurveTo(58, -6, 0, 50);
  };
  const cherry = (c: CanvasRenderingContext2D) => {
    c.moveTo(0, 60); c.quadraticCurveTo(-40, 10, 0, -60); c.quadraticCurveTo(40, 10, 0, 60);
  };
  draw(0, maple, '#b8261a', 'rgba(255,190,150,0.35)');
  draw(1, maple, '#d9781c', 'rgba(255,220,160,0.35)');
  draw(2, ginkgo, '#e6bd2c', 'rgba(255,240,180,0.3)');
  draw(3, cherry, '#8d9a2c', 'rgba(230,240,170,0.35)');
  const t = tex(cv, true, false);
  return t;
}

/** A single cherry petal with its notch, and a five-petal blossom cluster for the canopy. */
export function petalTexture() {
  const S = 64;
  const { cv, ctx } = canvas(S, S);
  ctx.translate(S / 2, S / 2);
  ctx.beginPath();
  ctx.moveTo(0, 28); ctx.bezierCurveTo(-26, 8, -20, -24, -6, -26); ctx.lineTo(0, -18); ctx.lineTo(6, -26); ctx.bezierCurveTo(20, -24, 26, 8, 0, 28);
  const g = ctx.createRadialGradient(0, 18, 2, 0, 0, 30);
  g.addColorStop(0, '#f6a9bf'); g.addColorStop(0.5, '#fcd9e3'); g.addColorStop(1, '#fff3f6');
  ctx.fillStyle = g; ctx.fill();
  return tex(cv, true, false);
}

export function blossomTexture(seed = 4) {
  const S = 256;
  const { cv, ctx } = canvas(S, S);
  const r = rng(seed);
  // a clutch of blossoms with a few young leaves between them
  for (let i = 0; i < 6; i++) {
    const x = 50 + r() * 156, y = 50 + r() * 156;
    ctx.save(); ctx.translate(x, y); ctx.rotate(r() * 6.28);
    ctx.fillStyle = 'rgba(94,120,48,0.9)';
    ctx.beginPath(); ctx.ellipse(30, 0, 26, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  for (let i = 0; i < 9; i++) {
    const x = 40 + r() * 176, y = 40 + r() * 176, R = 22 + r() * 14, rot = r() * 6.28;
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    for (let p = 0; p < 5; p++) {
      ctx.save(); ctx.rotate((p / 5) * Math.PI * 2);
      const g = ctx.createRadialGradient(0, -R * 0.2, 1, 0, -R * 0.55, R * 0.6);
      g.addColorStop(0, '#f7b3c6'); g.addColorStop(1, '#fff0f4');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(-R * 0.55, -R * 0.35, -R * 0.4, -R, -R * 0.08, -R * 0.98); ctx.lineTo(0, -R * 0.85); ctx.lineTo(R * 0.08, -R * 0.98); ctx.bezierCurveTo(R * 0.4, -R, R * 0.55, -R * 0.35, 0, 0); ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = '#c2405a'; ctx.beginPath(); ctx.arc(0, 0, R * 0.14, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f2d36a';
    for (let s = 0; s < 10; s++) { const a = s * 0.63; ctx.beginPath(); ctx.arc(Math.cos(a) * R * 0.25, Math.sin(a) * R * 0.25, 1.6, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  }
  return tex(cv, true, false);
}

/** Japanese-maple foliage card: a few red-orange leaves overlapping. */
export function mapleCardTexture(seed = 9) {
  const S = 256;
  const { cv, ctx } = canvas(S, S);
  const r = rng(seed);
  for (let i = 0; i < 7; i++) {
    const x = 50 + r() * 156, y = 50 + r() * 156, R = 30 + r() * 18;
    const hue = ['#a3161b', '#c22b18', '#d9531a', '#8e1420', '#b8371c'][Math.floor(r() * 5)];
    ctx.save(); ctx.translate(x, y); ctx.rotate(r() * 6.28);
    ctx.beginPath();
    for (let k = 0; k <= 14; k++) {
      const a = (k / 14) * Math.PI * 2;
      const rr = k % 2 === 0 ? R : R * 0.42;
      const px = Math.cos(a) * rr, py = Math.sin(a) * rr;
      if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    const g = ctx.createRadialGradient(0, 0, 2, 0, 0, R);
    g.addColorStop(0, shade(hue, 1.2)); g.addColorStop(1, shade(hue, 0.8));
    ctx.fillStyle = g; ctx.fill();
    ctx.restore();
  }
  return tex(cv, true, false);
}

/** Plain leaf card for shrubs and the canopy's under-layer. */
export function foliageTexture(seed = 12, palette = ['#2f5a24', '#3e6e2a', '#4a7d30', '#27491d']) {
  const S = 256;
  const { cv, ctx } = canvas(S, S);
  const r = rng(seed);
  for (let i = 0; i < 18; i++) {
    const x = 40 + r() * 176, y = 40 + r() * 176;
    ctx.save(); ctx.translate(x, y); ctx.rotate(r() * 6.28);
    const col = palette[Math.floor(r() * palette.length)];
    const g = ctx.createLinearGradient(-30, 0, 30, 0);
    g.addColorStop(0, shade(col, 0.8)); g.addColorStop(0.5, shade(col, 1.25)); g.addColorStop(1, shade(col, 0.85));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(0, 0, 30 + r() * 10, 10 + r() * 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(200,230,150,0.25)'; ctx.beginPath(); ctx.moveTo(-28, 0); ctx.lineTo(28, 0); ctx.stroke();
    ctx.restore();
  }
  return tex(cv, true, false);
}

/** Paper for the boats: four colours down the atlas, with fibres and fold creases. */
export function paperTexture() {
  const W = 128, H = 256;
  const { cv, ctx } = canvas(W, H);
  const cols = ['#f4efe2', '#e7eef5', '#f2d8a7', '#e3b8b1'];
  const r = rng(31);
  cols.forEach((c, i) => {
    ctx.fillStyle = c; ctx.fillRect(0, i * 64, W, 64);
    for (let k = 0; k < 220; k++) { ctx.fillStyle = `rgba(120,100,70,${r() * 0.06})`; ctx.fillRect(r() * W, i * 64 + r() * 64, 1 + r() * 6, 1); }
    ctx.strokeStyle = 'rgba(90,80,60,0.12)'; ctx.beginPath(); ctx.moveTo(W / 2, i * 64); ctx.lineTo(W / 2, i * 64 + 64); ctx.stroke();
  });
  return tex(cv, true, false);
}

/** Granite with feldspar speckle for lanterns and slabs. */
export function graniteTexture(seed = 41) {
  const S = 256;
  const { cv, ctx } = canvas(S, S);
  const r = rng(seed);
  const img = ctx.createImageData(S, S);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const n = fbm(x / 20, y / 20, 3) * 0.5 + vnoise(x / 1.5, y / 1.5) * 0.5;
    const k = (y * S + x) * 4;
    const v = 118 + n * 70;
    img.data[k] = v; img.data[k + 1] = v * 0.98; img.data[k + 2] = v * 0.93; img.data[k + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  for (let i = 0; i < 900; i++) { const g = r() < 0.5 ? 40 : 220; ctx.fillStyle = `rgba(${g},${g},${g},${0.3 + r() * 0.3})`; ctx.fillRect(r() * S, r() * S, 1 + r() * 2, 1 + r() * 2); }
  return tex(cv);
}

/** Bark: vertical fissures. */
export function barkTexture(seed = 51) {
  const W = 128, H = 256;
  const { cv, ctx } = canvas(W, H);
  const img = ctx.createImageData(W, H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const n = fbm(x / 6 + seed, y / 40, 4);
    const f = Math.pow(Math.abs(Math.sin(x / W * Math.PI * 9 + fbm(x / 20, y / 25, 3) * 6)), 0.4);
    const v = 40 + n * 50 * f + 20 * f;
    const k = (y * W + x) * 4;
    img.data[k] = v * 1.05; img.data[k + 1] = v * 0.9; img.data[k + 2] = v * 0.8; img.data[k + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return tex(cv);
}

/** Soft round sprite for spray, fireflies and glows. */
export function dotTexture() {
  const S = 64;
  const { cv, ctx } = canvas(S, S);
  const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,0.6)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
  return tex(cv, false, false);
}
