/**
 * Things that swim, in ligne claire: each drawn in its own frame facing
 * right, length L pixels nose to tail, then placed with a direction and a
 * slight tilt.
 */
import { type G, INK, inkFill, ellipse, shade, rng, TAU } from './kit';

function frame(g: G, x: number, y: number, L: number, dir: 1 | -1, tilt: number, draw: (k: number) => void, lw: number) {
  g.save(); g.translate(x, y); g.rotate(tilt); g.scale(dir * L / 100, L / 100);
  draw(lw / (L / 100)); g.restore();
}

export function shark(g: G, x: number, y: number, L: number, dir: 1 | -1, lw: number, tilt = 0, col = '#9fb4c4', belly = '#e9eef0') {
  frame(g, x, y, L, dir, tilt, (k) => {
    // far pectoral fin
    g.beginPath(); g.moveTo(14, 4); g.lineTo(2, 20); g.lineTo(22, 8); g.closePath(); inkFill(g, shade(col, -0.2), k);
    // tail
    g.beginPath(); g.moveTo(-36, -1); g.lineTo(-54, -24); g.lineTo(-48, -1); g.lineTo(-52, 14); g.closePath(); inkFill(g, col, k);
    // body
    g.beginPath(); g.moveTo(50, 0); g.bezierCurveTo(46, -9, 30, -11, 10, -11); g.bezierCurveTo(-10, -10, -30, -5, -44, -1); g.bezierCurveTo(-30, 4, -10, 9, 10, 9); g.bezierCurveTo(30, 9, 46, 6, 50, 0); g.closePath(); inkFill(g, col, k);
    g.save(); g.clip(); g.fillStyle = belly; g.beginPath(); g.moveTo(50, 1); g.bezierCurveTo(30, 3, 0, 3, -40, 1); g.lineTo(-40, 20); g.lineTo(50, 20); g.fill(); g.restore();
    g.beginPath(); g.moveTo(50, 0); g.bezierCurveTo(46, -9, 30, -11, 10, -11); g.bezierCurveTo(-10, -10, -30, -5, -44, -1); g.bezierCurveTo(-30, 4, -10, 9, 10, 9); g.bezierCurveTo(30, 9, 46, 6, 50, 0); g.closePath(); g.lineWidth = k; g.strokeStyle = INK; g.stroke();
    // dorsal fin
    g.beginPath(); g.moveTo(14, -10); g.quadraticCurveTo(6, -26, 2, -28); g.quadraticCurveTo(0, -18, -6, -10); g.closePath(); inkFill(g, col, k);
    g.beginPath(); g.moveTo(-28, -5); g.lineTo(-32, -11); g.lineTo(-34, -4); g.closePath(); inkFill(g, col, k * 0.8);
    // near pectoral fin
    g.beginPath(); g.moveTo(22, 5); g.quadraticCurveTo(14, 14, 6, 22); g.quadraticCurveTo(14, 18, 28, 7); g.closePath(); inkFill(g, col, k);
    // gills, eye, mouth
    g.lineWidth = k * 0.8; g.strokeStyle = INK; for (const gx of [26, 28.5, 31]) { g.beginPath(); g.moveTo(gx, -4); g.quadraticCurveTo(gx - 1, 0, gx, 4); g.stroke(); }
    ellipse(g, 40, -3, 1.4, 1.4, 0, INK, 0);
    g.beginPath(); g.moveTo(44, 4); g.quadraticCurveTo(40, 6.5, 35, 5); g.stroke();
  }, lw);
}

export function turtle(g: G, x: number, y: number, L: number, dir: 1 | -1, lw: number, tilt = 0) {
  const shell = '#7a8a4a', skin = '#a8b07a';
  frame(g, x, y, L, dir, tilt, (k) => {
    // far flippers
    g.beginPath(); g.moveTo(12, -6); g.quadraticCurveTo(26, -36, 40, -40); g.quadraticCurveTo(30, -24, 20, -2); g.closePath(); inkFill(g, shade(skin, -0.2), k);
    g.beginPath(); g.moveTo(-20, -4); g.quadraticCurveTo(-34, -16, -42, -14); g.quadraticCurveTo(-34, -6, -24, 2); g.closePath(); inkFill(g, shade(skin, -0.2), k);
    // head
    g.beginPath(); g.ellipse(36, 2, 12, 8, 0.1, 0, TAU); inkFill(g, skin, k);
    ellipse(g, 41, -1, 1.4, 1.4, 0, INK, 0);
    // shell
    g.beginPath(); g.ellipse(0, 0, 30, 20, 0, 0, TAU); inkFill(g, shell, k);
    g.save(); g.beginPath(); g.ellipse(0, 0, 30, 20, 0, 0, TAU); g.clip();
    g.strokeStyle = shade(shell, -0.35); g.lineWidth = k * 0.8; g.fillStyle = shade(shell, 0.12);
    const plates: [number, number][] = [[0, 0], [-15, -6], [15, -6], [-15, 8], [15, 8], [0, -14], [0, 14], [-27, 0], [27, 0]];
    for (const [px, py] of plates) { g.beginPath(); for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; const qx = px + Math.cos(a) * 8, qy = py + Math.sin(a) * 6.5; if (i) g.lineTo(qx, qy); else g.moveTo(qx, qy); } g.closePath(); g.fill(); g.stroke(); }
    g.restore();
    // near flippers
    g.beginPath(); g.moveTo(10, 8); g.quadraticCurveTo(30, 34, 46, 40); g.quadraticCurveTo(34, 22, 22, 4); g.closePath(); inkFill(g, skin, k);
    g.beginPath(); g.moveTo(-18, 10); g.quadraticCurveTo(-32, 24, -40, 26); g.quadraticCurveTo(-30, 14, -24, 6); g.closePath(); inkFill(g, skin, k);
  }, lw);
}

export function manta(g: G, x: number, y: number, L: number, dir: 1 | -1, lw: number, tilt = 0, col = '#3a4a62') {
  frame(g, x, y, L, dir, tilt, (k) => {
    g.beginPath(); g.moveTo(30, 0); g.quadraticCurveTo(10, -12, -6, -50); g.quadraticCurveTo(-8, -20, -24, -4); g.lineTo(-60, 2); g.lineTo(-24, 6); g.quadraticCurveTo(-8, 22, -4, 46); g.quadraticCurveTo(10, 12, 30, 0); g.closePath(); inkFill(g, col, k);
    g.save(); g.clip(); g.fillStyle = shade(col, 0.25); g.beginPath(); g.ellipse(4, 0, 18, 10, 0, 0, TAU); g.fill(); g.restore();
    g.beginPath(); g.moveTo(28, -4); g.quadraticCurveTo(36, -8, 38, -4); g.moveTo(28, 4); g.quadraticCurveTo(36, 8, 38, 4); g.lineWidth = k * 2.6; g.strokeStyle = INK; g.stroke(); g.lineWidth = k * 1.2; g.strokeStyle = col; g.stroke();
    ellipse(g, 24, -5, 1.2, 1.2, 0, '#e9eef0', 0);
  }, lw);
}

export function tang(g: G, x: number, y: number, L: number, dir: 1 | -1, lw: number, tilt = 0, col = '#f2c230') {
  frame(g, x, y, L, dir, tilt, (k) => {
    g.beginPath(); g.moveTo(-28, 0); g.lineTo(-46, -14); g.lineTo(-42, 0); g.lineTo(-46, 14); g.closePath(); inkFill(g, col, k);
    g.beginPath(); g.moveTo(40, 2); g.bezierCurveTo(36, -26, 0, -38, -28, -10); g.lineTo(-30, 0); g.lineTo(-28, 10); g.bezierCurveTo(0, 38, 36, 26, 40, 2); g.closePath(); inkFill(g, col, k);
    g.beginPath(); g.moveTo(12, -20); g.quadraticCurveTo(-6, -36, -22, -14); g.moveTo(12, 22); g.quadraticCurveTo(-6, 36, -22, 14); g.lineWidth = k * 0.7; g.strokeStyle = INK; g.stroke();
    ellipse(g, 26, -6, 3, 3, 0, '#fbfaf5', k * 0.7); ellipse(g, 27, -6, 1.6, 1.6, 0, INK, 0);
    g.beginPath(); g.moveTo(40, 2); g.lineTo(34, 4); g.lineWidth = k * 0.8; g.stroke();
  }, lw);
}

export function grouper(g: G, x: number, y: number, L: number, dir: 1 | -1, lw: number, tilt = 0, col = '#9a8a6a') {
  frame(g, x, y, L, dir, tilt, (k) => {
    g.beginPath(); g.moveTo(-34, 0); g.quadraticCurveTo(-44, -14, -50, -14); g.quadraticCurveTo(-46, 0, -50, 14); g.quadraticCurveTo(-44, 14, -34, 0); inkFill(g, col, k);
    g.beginPath(); g.moveTo(48, 4); g.bezierCurveTo(44, -16, 20, -24, -6, -20); g.bezierCurveTo(-24, -16, -36, -6, -36, 0); g.bezierCurveTo(-36, 8, -20, 18, 0, 18); g.bezierCurveTo(26, 18, 44, 14, 48, 4); g.closePath(); inkFill(g, col, k);
    g.save(); g.clip(); const R = rng(4); g.fillStyle = shade(col, -0.22); for (let i = 0; i < 40; i++) { g.beginPath(); g.arc(-34 + R() * 78, -20 + R() * 38, 1.4 + R() * 1.8, 0, TAU); g.fill(); } g.fillStyle = shade(col, 0.25); g.beginPath(); g.moveTo(48, 6); g.bezierCurveTo(26, 14, 0, 16, -36, 4); g.lineTo(-36, 20); g.lineTo(48, 20); g.fill(); g.restore();
    g.beginPath(); g.moveTo(48, 4); g.bezierCurveTo(44, -16, 20, -24, -6, -20); g.bezierCurveTo(-24, -16, -36, -6, -36, 0); g.bezierCurveTo(-36, 8, -20, 18, 0, 18); g.bezierCurveTo(26, 18, 44, 14, 48, 4); g.closePath(); g.lineWidth = k; g.strokeStyle = INK; g.stroke();
    g.beginPath(); g.moveTo(10, -20); g.quadraticCurveTo(-8, -32, -26, -14); g.closePath(); inkFill(g, shade(col, -0.1), k);
    ellipse(g, 32, -4, 2.6, 2.6, 0, '#fbfaf5', k * 0.6); ellipse(g, 32.6, -4, 1.4, 1.4, 0, INK, 0);
    g.beginPath(); g.moveTo(48, 4); g.quadraticCurveTo(42, 8, 36, 6); g.lineWidth = k * 0.9; g.stroke();
    g.beginPath(); g.moveTo(16, 4); g.quadraticCurveTo(8, 12, 2, 12); g.quadraticCurveTo(8, 6, 16, 4); inkFill(g, shade(col, -0.1), k * 0.8);
  }, lw);
}

export function smallFish(g: G, x: number, y: number, L: number, dir: 1 | -1, lw: number, tilt = 0, col = '#e8c050', stripe?: string) {
  frame(g, x, y, L, dir, tilt, (k) => {
    g.beginPath(); g.moveTo(-26, 0); g.lineTo(-44, -12); g.lineTo(-40, 0); g.lineTo(-44, 12); g.closePath(); inkFill(g, col, k);
    g.beginPath(); g.ellipse(4, 0, 32, 13, 0, 0, TAU); inkFill(g, col, k);
    if (stripe) { g.save(); g.beginPath(); g.ellipse(4, 0, 32, 13, 0, 0, TAU); g.clip(); g.fillStyle = stripe; g.fillRect(-4, -14, 8, 28); g.fillRect(16, -14, 6, 28); g.restore(); g.beginPath(); g.ellipse(4, 0, 32, 13, 0, 0, TAU); g.lineWidth = k; g.strokeStyle = INK; g.stroke(); }
    ellipse(g, 26, -3, 2, 2, 0, INK, 0);
  }, lw);
}

export function bubble(g: G, x: number, y: number, r: number, lw: number) { g.beginPath(); g.arc(x, y, r, 0, TAU); g.lineWidth = lw; g.strokeStyle = 'rgba(230,248,255,0.8)'; g.stroke(); g.beginPath(); g.arc(x - r * 0.35, y - r * 0.35, r * 0.25, 0, TAU); g.fillStyle = 'rgba(255,255,255,0.85)'; g.fill(); }
