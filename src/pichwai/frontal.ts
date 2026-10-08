/**
 * The deity, frontal. Pichwai hangings are made to hang behind the image of
 * Shrinathji, who looks straight out at you; these figures do the same. One
 * drawing makes four-armed Vishnu, Krishna with the flute in the bent
 * tribhanga stance, Shrinathji with his arm raised, Lakshmi on her lotus and
 * Narasimha — the arms, the hands, the crown and the colours change, the
 * long lotus eyes that hold your gaze do not.
 *
 * Drawn at s = 1 the figure stands 480 units tall, its feet at (x, y).
 */
import { C, type G, circle, ellipse, fs, line, stroke2, glory, lotus, rng, floretP, stripeP, dotsP, star4, curl, lerp, clamp } from '../chalisa/kit';
import { shade } from '../chalisa/figures';

export type Hold = 'chakra' | 'conch' | 'mace' | 'lotus' | 'flute' | 'abhaya' | 'varada' | 'bow' | 'arrow' | 'sword' | 'shield' | 'pot' | 'coins' | 'book' | 'mala' | 'axe' | 'plough' | 'fist' | 'raised' | 'none' | 'lotusBud' | 'noose' | 'goad' | 'trident' | 'flame' | 'vajra';

export interface Deity {
  skin: string;
  crown?: 'kirita' | 'peacock' | 'lakshmi' | 'mane' | 'small' | 'jata' | 'none';
  /** Hands, from his right outward: lower right, lower left, then upper right, upper left, and so on. */
  hands: Hold[];
  stance?: 'stand' | 'tribhanga' | 'sit' | 'shrinathji';
  cloth?: string; clothFg?: string; border?: string;
  /** A sari instead of a dhoti. */
  sari?: boolean;
  garland?: boolean;
  face?: 'lotus' | 'lion' | 'gentle';
  eyes?: 'open' | 'closed' | 'half';
  /** Extra heads either side, for the cosmic form. */
  heads?: number;
  glow?: number;
  /** Paint stars and galaxies inside the body (Vishvarupa). */
  cosmos?: number;
  alpha?: number;
  /** Pedestal under the feet. */
  base?: 'lotus' | 'none';
  /** Draw only from the waist up (for Matsya and Kurma, whose lower half is the animal). */
  upperOnly?: boolean;
}

const ink = C.ink;

/* ───────── held things ───────── */

export function holdItem(g: G, k: Hold, x: number, y: number, s: number, t: number, ang = 0, side = 1) {
  g.save(); g.translate(x, y); g.rotate(ang); g.scale(s, s);
  switch (k) {
    case 'chakra': {
      // Sudarshana: a spinning discus fringed with flame, held on one finger
      g.save(); g.translate(0, -34); g.rotate(t * 2.4);
      for (let i = 0; i < 16; i++) { g.save(); g.rotate((i / 16) * Math.PI * 2); g.beginPath(); g.moveTo(-6, -28); g.quadraticCurveTo(0, -46 - (i % 2) * 6, 6, -28); fs(g, i % 2 ? C.fire : C.fire2, null); g.restore(); }
      circle(g, 0, 0, 28, C.gold, ink, 2.4); circle(g, 0, 0, 20, C.vermilion, ink, 1.6);
      for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; line(g, [[Math.cos(a) * 6, Math.sin(a) * 6], [Math.cos(a) * 19, Math.sin(a) * 19]], C.gold, 2.6); }
      circle(g, 0, 0, 7, C.gold, ink, 1.4); circle(g, 0, 0, 2.6, C.white);
      g.restore();
      line(g, [[0, -6], [0, -10]], C.gold, 3);
      break;
    }
    case 'conch': {
      // Panchajanya: a white conch, spiral at the top, held mouth outward
      g.save(); g.translate(0, -26); g.rotate(-0.5 * side);
      g.beginPath(); g.moveTo(-12, 22); g.bezierCurveTo(-26, 4, -22, -22, -2, -32); g.bezierCurveTo(14, -26, 22, -6, 12, 22); g.quadraticCurveTo(0, 30, -12, 22); fs(g, C.white, ink, 2);
      curl(g, 2, -16, 11, 1.3, 1, 0); g.strokeStyle = ink; g.lineWidth = 1.4; g.stroke();
      for (let i = 0; i < 3; i++) line(g, [[-14 + i * 2, 4 + i * 6], [14 - i * 2, 4 + i * 6]], 'rgba(160,140,120,0.7)', 1.3);
      line(g, [[-8, 24], [8, 24]], C.gold, 3);
      g.restore();
      break;
    }
    case 'mace': {
      // Kaumodaki: the mace, its head resting by the hand
      stroke2(g, [[0, 70], [0, -40]], 8, C.gold, ink, 2, false);
      for (let i = 0; i < 4; i++) line(g, [[-5, 50 - i * 22], [5, 50 - i * 22]], C.vermilion, 3);
      g.beginPath(); g.ellipse(0, -66, 22, 30, 0, 0, Math.PI * 2); fs(g, C.gold, ink, 2.4);
      for (const dx of [-11, 0, 11]) { g.beginPath(); g.ellipse(dx, -66, 4, 27, 0, 0, Math.PI * 2); fs(g, null, shade(C.gold, 0.7), 1.4); }
      line(g, [[-21, -66], [21, -66]], C.vermilion, 4);
      g.beginPath(); g.moveTo(-6, -94); g.quadraticCurveTo(0, -112, 6, -94); fs(g, C.gold, ink, 1.6);
      break;
    }
    case 'lotus': case 'lotusBud': {
      line(g, [[0, 26], [0, -26]], C.green, 3);
      if (k === 'lotus') lotus(g, 0, -26, 0.62, 1, C.pink, C.rani);
      else { g.beginPath(); g.moveTo(0, -24); g.bezierCurveTo(12, -34, 8, -54, 0, -62); g.bezierCurveTo(-8, -54, -12, -34, 0, -24); fs(g, C.pink, ink, 1.6); }
      break;
    }
    case 'flute': {
      // the bansuri, held across the body
      g.save(); g.rotate(side * 0.2);
      g.beginPath(); g.rect(-6 * side, -5, 150 * side, 9); fs(g, '#8a5a2a', ink, 1.6);
      for (let i = 0; i < 6; i++) circle(g, (40 + i * 13) * side, -0.5, 2.2, ink);
      for (const p of [8, 140]) line(g, [[p * side, -6], [p * side, 5]], C.gold, 4);
      g.fillStyle = C.vermilion; g.beginPath(); g.moveTo(144 * side, 4); g.quadraticCurveTo(150 * side, 30, 140 * side, 46); g.quadraticCurveTo(136 * side, 26, 140 * side, 4); g.fill();
      g.restore();
      break;
    }
    case 'bow': {
      g.beginPath(); g.moveTo(0, -130); g.bezierCurveTo(34 * side, -70, 34 * side, 70, 0, 130); fs(g, null, ink, 9); g.beginPath(); g.moveTo(0, -130); g.bezierCurveTo(34 * side, -70, 34 * side, 70, 0, 130); fs(g, null, C.gold, 5);
      line(g, [[0, -130], [-4 * side, 0], [0, 130]], C.cream, 1.4);
      break;
    }
    case 'arrow': { line(g, [[0, 50], [0, -90]], C.brown, 3); g.beginPath(); g.moveTo(0, -104); g.lineTo(5, -88); g.lineTo(-5, -88); fs(g, C.gold, ink, 1.2); for (const sd of [-1, 1]) line(g, [[0, 40], [sd * 7, 54]], C.vermilion, 2.4); break; }
    case 'sword': { line(g, [[0, 14], [0, -96]], ink, 9); line(g, [[0, 14], [0, -96]], '#dfe4e8', 5); line(g, [[-12, 6], [12, 6]], C.gold, 5); circle(g, 0, 18, 5, C.gold, ink, 1.2); break; }
    case 'shield': { circle(g, 0, -10, 26, C.maroon, ink, 2.4); circle(g, 0, -10, 18, null, C.gold, 2.4); for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + 0.78; circle(g, Math.cos(a) * 12, -10 + Math.sin(a) * 12, 3, C.gold); } break; }
    case 'pot': { g.beginPath(); g.moveTo(-16, -22); g.bezierCurveTo(-32, -6, -26, 22, 0, 22); g.bezierCurveTo(26, 22, 32, -6, 16, -22); g.closePath(); fs(g, C.gold, ink, 2); line(g, [[-20, -4], [20, -4]], C.vermilion, 3); for (let i = 0; i < 5; i++) circle(g, -10 + i * 5, -26 - (i % 2) * 4, 4, C.gold, ink, 1); break; }
    case 'coins': {
      // Lakshmi's open hand, gold pouring from it
      for (let i = 0; i < 9; i++) { const ph = ((t * 0.8 + i * 0.11) % 1); g.globalAlpha = 1 - ph * 0.8; circle(g, Math.sin(i * 2.1) * 10 + ph * 14 * side, 12 + ph * 140, 6, C.gold, ink, 1.2); g.globalAlpha = 1; }
      break;
    }
    case 'book': { g.beginPath(); g.rect(-30, -14, 60, 18); fs(g, '#e7c98c', ink, 1.8); line(g, [[-30, -5], [30, -5]], C.brown, 1); line(g, [[-12, -14], [-12, 4]], C.vermilion, 2); line(g, [[12, -14], [12, 4]], C.vermilion, 2); break; }
    case 'mala': { for (let i = 0; i < 18; i++) { const a = (i / 18) * Math.PI * 2; circle(g, Math.sin(a) * 11, 22 + Math.cos(a) * 20, 2.8, i ? C.brown : C.gold, ink, 0.6); } break; }
    case 'axe': { line(g, [[0, 60], [0, -70]], ink, 8); line(g, [[0, 60], [0, -70]], C.brown, 4); g.beginPath(); g.moveTo(0, -70); g.quadraticCurveTo(36 * side, -78, 40 * side, -48); g.quadraticCurveTo(24 * side, -46, 0, -42); g.closePath(); fs(g, '#dfe4e8', ink, 2); break; }
    case 'plough': { line(g, [[0, 70], [0, -60]], ink, 8); line(g, [[0, 70], [0, -60]], C.brown, 4); g.beginPath(); g.moveTo(0, -60); g.lineTo(-24 * side, -40); g.lineTo(-30 * side, -60); g.closePath(); fs(g, '#c9cfd4', ink, 2); break; }
    case 'noose': { g.beginPath(); g.ellipse(0, 10, 14, 22, 0, 0, 7); fs(g, null, C.brown, 3); break; }
    case 'goad': { line(g, [[0, 40], [0, -60]], C.gold, 4); g.beginPath(); g.moveTo(0, -60); g.quadraticCurveTo(16 * side, -64, 12 * side, -44); fs(g, null, '#c9cfd4', 4); break; }
    case 'trident': { line(g, [[0, 60], [0, -110]], '#c9cfd4', 4); g.beginPath(); g.moveTo(-18, -90); g.quadraticCurveTo(-16, -114, -20, -126); g.moveTo(18, -90); g.quadraticCurveTo(16, -114, 20, -126); g.moveTo(-18, -90); g.quadraticCurveTo(0, -80, 18, -90); g.moveTo(0, -90); g.lineTo(0, -134); fs(g, null, '#c9cfd4', 4); break; }
    case 'flame': { flameSmall(g, 0, -10, 1, t); break; }
    case 'vajra': { for (const sg of [-1, 1]) { g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(14, sg * 20, 0, sg * 44); g.quadraticCurveTo(-14, sg * 20, 0, 0); fs(g, C.gold, ink, 1.6); } circle(g, 0, 0, 7, C.gold, ink, 1.4); break; }
    default: break;
  }
  g.restore();
}
function flameSmall(g: G, x: number, y: number, s: number, t: number) {
  const f = 1 + Math.sin(t * 9 + x) * 0.08;
  g.save(); g.translate(x, y); g.scale(s, s * f);
  for (const [h, w, c] of [[60, 24, C.vermilion], [44, 17, C.fire], [26, 9, C.fire2]] as [number, number, string][]) { g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(w, -h * 0.25, w * 0.6, -h * 0.7, 0, -h); g.bezierCurveTo(-w * 0.6, -h * 0.7, -w, -h * 0.25, 0, 0); g.fillStyle = c; g.fill(); }
  g.restore();
}

/* ───────── the hand itself ───────── */
function hand(g: G, x: number, y: number, ang: number, skin: string, mudra: Hold) {
  g.save(); g.translate(x, y); g.rotate(ang);
  if (mudra === 'abhaya' || mudra === 'varada') {
    // open palm with fingers, a red dot of alta in the centre
    const up = mudra === 'abhaya' ? -1 : 1;
    g.beginPath(); g.moveTo(-10, 0);
    for (let i = 0; i < 4; i++) { const fx = -8 + i * 5.4; g.lineTo(fx - 2, up * (10 + (i === 1 || i === 2 ? 22 : 17))); g.quadraticCurveTo(fx + 0.8, up * (14 + (i === 1 || i === 2 ? 24 : 19)), fx + 2.6, up * (10 + (i === 1 || i === 2 ? 22 : 17))); }
    g.lineTo(11, up * 4); g.quadraticCurveTo(18, up * 2, 17, -up * 6); g.quadraticCurveTo(10, -up * 6, 8, 0); g.closePath();
    fs(g, skin, ink, 1.8);
    circle(g, 0, up * 8, 3.4, C.vermilion);
  } else {
    ellipse(g, 0, 0, 10, 8.5, 0, skin, ink, 1.8);
    line(g, [[-6, -2], [6, -3]], shade(skin, 0.7), 1.2);
  }
  g.restore();
}

/* ───────── arms ───────── */
interface ArmSpec { sx: number; sy: number; ex: number; ey: number; hx: number; hy: number; hold: Hold; side: number; front: boolean }

function arm(g: G, d: Deity, a: ArmSpec, t: number, s: number) {
  const skin = d.skin;
  const w0 = 23, w1 = 18;
  g.lineCap = 'round'; g.lineJoin = 'round';
  const seg2 = (x0: number, y0: number, x1: number, y1: number, w: number, col: string) => { g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); };
  seg2(a.sx, a.sy, a.ex, a.ey, w0 + 5, ink); seg2(a.ex, a.ey, a.hx, a.hy, w1 + 5, ink);
  seg2(a.sx, a.sy, a.ex, a.ey, w0, skin); seg2(a.ex, a.ey, a.hx, a.hy, w1, skin);
  // armlet with a jewel, bangles at the wrist
  const mx = lerp(a.sx, a.ex, 0.45), my = lerp(a.sy, a.ey, 0.45), ux = a.ex - a.sx, uy = a.ey - a.sy, L = Math.hypot(ux, uy) || 1;
  line(g, [[mx - (uy / L) * 10, my + (ux / L) * 10], [mx + (uy / L) * 10, my - (ux / L) * 10]], C.gold, 5);
  circle(g, mx, my, 3.4, C.vermilion, ink, 1);
  const vx = a.hx - a.ex, vy = a.hy - a.ey, M = Math.hypot(vx, vy) || 1, bx = a.hx - (vx / M) * 8, by = a.hy - (vy / M) * 8;
  for (const k of [0, 5]) line(g, [[bx - (vy / M) * 8 - (vx / M) * k, by + (vx / M) * 8 - (vy / M) * k], [bx + (vy / M) * 8 - (vx / M) * k, by - (vx / M) * 8 - (vy / M) * k]], k ? C.vermilion : C.gold, 3.2);
  const ang = Math.atan2(vy, vx) - Math.PI / 2;
  const mudra = a.hold === 'abhaya' || a.hold === 'varada';
  if (!mudra && a.hold !== 'none' && a.hold !== 'fist' && a.hold !== 'raised') {
    // items sit upright in the hand regardless of the forearm's angle
    const up = a.hold === 'flute' ? 0 : 0;
    holdItem(g, a.hold, a.hx, a.hy, 1, t, up, a.side);
  }
  hand(g, a.hx, a.hy, mudra ? (a.hold === 'abhaya' ? 0 : Math.PI * 0) : ang, skin, a.hold);
  void s; void d;
}

/* ───────── the face ───────── */
function face(g: G, d: Deity, x: number, y: number, t: number, sc = 1) {
  g.save(); g.translate(x, y); g.scale(sc, sc);
  const skin = d.skin;
  const lion = d.face === 'lion';
  // hair falling behind the face to the shoulders
  if (!lion) {
    for (const sd of [-1, 1]) {
      g.beginPath(); g.moveTo(sd * 36, -26); g.bezierCurveTo(sd * 58, 0, sd * 60, 34, sd * 54, 62); g.quadraticCurveTo(sd * 44, 70, sd * 34, 58); g.bezierCurveTo(sd * 40, 30, sd * 36, 6, sd * 28, -18); g.closePath(); fs(g, '#16101e', ink, 2);
      for (let i = 0; i < 3; i++) { curl(g, sd * (48 + (i % 2) * 4), 14 + i * 18, 6, 1.1, sd, 0); g.strokeStyle = '#3b3048'; g.lineWidth = 2; g.stroke(); }
    }
  } else {
    // the lion's mane in curling locks
    for (let i = 0; i < 22; i++) { const a = (i / 22) * Math.PI * 2, r = 64 + (i % 2) * 10; g.beginPath(); g.ellipse(Math.cos(a) * r * 0.8, Math.sin(a) * r * 0.9 + 4, 18, 26, a + Math.PI / 2, 0, 7); fs(g, i % 2 ? C.marigold : C.saffron, ink, 1.6); curl(g, Math.cos(a) * r * 0.8, Math.sin(a) * r * 0.9 + 4, 8, 1.2, 1, a); g.strokeStyle = shade(C.saffron, 0.6); g.lineWidth = 1.6; g.stroke(); }
  }
  // neck
  g.beginPath(); g.rect(-13, 30, 26, 32); fs(g, skin, null);
  line(g, [[-13, 34], [-13, 60]], ink, 2); line(g, [[13, 34], [13, 60]], ink, 2);
  // the face: an oval, full at the cheeks, a round chin
  g.beginPath(); g.moveTo(0, -48); g.bezierCurveTo(34, -48, 42, -16, 40, 6); g.bezierCurveTo(38, 30, 22, 46, 0, 48); g.bezierCurveTo(-22, 46, -38, 30, -40, 6); g.bezierCurveTo(-42, -16, -34, -48, 0, -48); g.closePath();
  fs(g, skin, ink, 2.4);
  // ears with makara earrings
  for (const sd of [-1, 1]) {
    ellipse(g, sd * 41, 2, 7, 12, 0, shade(skin, 0.86), ink, 1.8);
    g.save(); g.translate(sd * 44, 18 + Math.sin(t * 2 + sd) * 1.5); g.scale(sd, 1);
    g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(14, 6, 16, 22, 6, 32); g.bezierCurveTo(10, 22, 2, 12, -4, 14); g.quadraticCurveTo(-6, 6, 0, 0); fs(g, C.gold, ink, 1.6);
    circle(g, 7, 12, 2.6, C.vermilion); circle(g, 6, 34, 4, C.white, ink, 1); circle(g, 2, 42, 3, C.vermilion, ink, 0.8);
    g.restore();
  }
  // brows
  for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(sd * 5, -18); g.quadraticCurveTo(sd * 18, -27, sd * 34, -18); g.quadraticCurveTo(sd * 18, -23, sd * 5, -16); fs(g, ink, ink, 1.4); }
  // the long lotus eyes, reaching toward the temples
  const blink = d.eyes === 'closed' || (Math.sin(t * 0.7 + x * 0.01) > 0.992);
  const half = d.eyes === 'half';
  for (const sd of [-1, 1]) {
    g.save(); g.translate(sd * 18, -6); g.scale(sd, 1);
    if (blink) { g.beginPath(); g.moveTo(-12, 0); g.quadraticCurveTo(2, 6, 22, -2); fs(g, null, ink, 2.6); line(g, [[22, -2], [30, -6]], ink, 2.2); }
    else {
      const h = half ? 4 : 8;
      g.beginPath(); g.moveTo(-12, 1); g.quadraticCurveTo(0, -h - 2, 18, -h * 0.6); g.quadraticCurveTo(26, -4, 32, -7); g.quadraticCurveTo(22, 2, 16, 4); g.quadraticCurveTo(2, h * 0.9, -12, 1); g.closePath();
      fs(g, C.white, ink, 2.2);
      g.save(); g.clip();
      circle(g, 1, -1 + (half ? 2 : 0), 6.6, ink); circle(g, 3, -3, 1.8, C.white);
      g.restore();
      // kajal sweeping out past the eye
      line(g, [[18, -h * 0.6 - 0.5], [26, -4], [34, -9]], ink, 2);
    }
    g.restore();
  }
  // nose, mouth, cheeks
  if (!lion) {
    g.beginPath(); g.moveTo(-2, -12); g.quadraticCurveTo(-4, 6, -7, 12); g.quadraticCurveTo(0, 16, 7, 12); fs(g, null, shade(skin, 0.6), 1.8);
    g.beginPath(); g.moveTo(-11, 24); g.quadraticCurveTo(0, 31, 11, 24); g.quadraticCurveTo(0, 27, -11, 24); fs(g, C.vermilion, shade(C.vermilion, 0.7), 1.2);
    g.globalAlpha = 0.2; circle(g, -24, 16, 8, C.rani); circle(g, 24, 16, 8, C.rani); g.globalAlpha = 1;
  } else {
    // a lion's muzzle, open, fangs showing
    g.beginPath(); g.moveTo(-18, 6); g.bezierCurveTo(-22, 22, -12, 40, 0, 40); g.bezierCurveTo(12, 40, 22, 22, 18, 6); g.closePath(); fs(g, shade(skin, 1.15), ink, 2);
    ellipse(g, 0, 8, 9, 6, 0, ink); g.beginPath(); g.moveTo(-12, 26); g.quadraticCurveTo(0, 40, 12, 26); g.quadraticCurveTo(0, 30, -12, 26); fs(g, C.maroon, ink, 1.6);
    for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(sd * 8, 26); g.lineTo(sd * 6, 34); g.lineTo(sd * 4, 27); fs(g, C.white, ink, 1); }
    for (const sd of [-1, 1]) for (let i = 0; i < 3; i++) line(g, [[sd * 14, 14 + i * 4], [sd * 34, 10 + i * 6]], ink, 1);
  }
  // tilak: the white U of Vishnu's devotees with a red line rising from the brow
  if (!lion) {
    g.beginPath(); g.moveTo(-7, -14); g.quadraticCurveTo(-8, -34, -6, -44); g.lineTo(-2, -44); g.quadraticCurveTo(-3, -30, 0, -18); g.quadraticCurveTo(3, -30, 2, -44); g.lineTo(6, -44); g.quadraticCurveTo(8, -34, 7, -14); g.quadraticCurveTo(0, -8, -7, -14); fs(g, C.white, null);
    line(g, [[0, -18], [0, -42]], C.vermilion, 3);
  } else line(g, [[0, -20], [0, -40]], C.vermilion, 4);
  g.restore();
}

/* ───────── crowns ───────── */
function crown(g: G, d: Deity, x: number, y: number, t: number, sc = 1) {
  g.save(); g.translate(x, y); g.scale(sc, sc);
  const k = d.crown ?? 'kirita';
  if (k === 'kirita') {
    // a tall jewelled crown, banded, narrowing to a finial
    g.beginPath(); g.moveTo(-40, -34); g.lineTo(-34, -96); g.quadraticCurveTo(-26, -118, -12, -126); g.lineTo(12, -126); g.quadraticCurveTo(26, -118, 34, -96); g.lineTo(40, -34); g.quadraticCurveTo(0, -42, -40, -34); g.closePath();
    fs(g, C.gold, ink, 2.6);
    for (let i = 0; i < 4; i++) { const yy = -46 - i * 20; line(g, [[-38 + i * 1.4, yy], [38 - i * 1.4, yy]], C.vermilion, 3.4); for (let k2 = 0; k2 < 7; k2++) circle(g, -30 + k2 * 10 + i * 0.4, yy - 8, 2.2, k2 % 2 ? C.white : C.teal); }
    // the front jewel and side flares
    g.beginPath(); g.moveTo(0, -112); g.quadraticCurveTo(14, -96, 0, -80); g.quadraticCurveTo(-14, -96, 0, -112); fs(g, C.vermilion, ink, 1.6); circle(g, 0, -96, 3, C.white);
    for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(sd * 40, -38); g.quadraticCurveTo(sd * 62, -52, sd * 58, -78); g.quadraticCurveTo(sd * 50, -60, sd * 38, -58); fs(g, C.gold, ink, 2); }
    ellipse(g, 0, -134, 7, 11, 0, C.vermilion, ink, 1.6); circle(g, 0, -146, 4, C.gold, ink, 1.2);
    // a band of pearls across the forehead
    for (let i = 0; i < 11; i++) circle(g, -35 + i * 7, -32, 3, C.white, ink, 0.8);
  } else if (k === 'peacock' || k === 'small') {
    g.beginPath(); g.moveTo(-38, -32); g.lineTo(-30, -66); g.quadraticCurveTo(0, -84, 30, -66); g.lineTo(38, -32); g.quadraticCurveTo(0, -40, -38, -32); g.closePath(); fs(g, C.gold, ink, 2.4);
    line(g, [[-36, -44], [36, -44]], C.vermilion, 3.4);
    for (let i = 0; i < 9; i++) circle(g, -28 + i * 7, -54, 2.2, i % 2 ? C.white : C.teal);
    for (let i = 0; i < 11; i++) circle(g, -35 + i * 7, -32, 3, C.white, ink, 0.8);
    if (k === 'peacock') {
      // the morpankh, tilted, swaying a little
      g.save(); g.translate(14, -70); g.rotate(0.35 + Math.sin(t * 1.1) * 0.05);
      line(g, [[0, 0], [0, -96]], '#4f6b2a', 2.4);
      for (let i = 0; i < 18; i++) { const yy = -12 - i * 5; line(g, [[0, yy], [-16 + i * 0.4, yy - 10]], '#3f8a4a', 1.4); line(g, [[0, yy], [16 - i * 0.4, yy - 10]], '#3f8a4a', 1.4); }
      ellipse(g, 0, -92, 15, 22, 0, '#2c7a5a', ink, 1.6); ellipse(g, 0, -90, 10, 15, 0, C.gold, null); ellipse(g, 0, -88, 6.5, 9, 0, '#1d4fa0', null); ellipse(g, 0, -87, 3.2, 4.6, 0, ink, null);
      g.restore();
    }
  } else if (k === 'lakshmi') {
    g.beginPath(); g.moveTo(-36, -30); g.lineTo(-28, -70); g.lineTo(-14, -60); g.lineTo(0, -88); g.lineTo(14, -60); g.lineTo(28, -70); g.lineTo(36, -30); g.quadraticCurveTo(0, -38, -36, -30); g.closePath(); fs(g, C.gold, ink, 2.4);
    for (const xx of [-28, 0, 28]) circle(g, xx, xx ? -66 : -82, 4, C.vermilion, ink, 1);
    line(g, [[-34, -40], [34, -40]], C.vermilion, 3);
    for (let i = 0; i < 11; i++) circle(g, -35 + i * 7, -30, 3, C.white, ink, 0.8);
  } else if (k === 'jata') {
    g.beginPath(); g.moveTo(-34, -30); g.bezierCurveTo(-40, -80, -10, -112, 0, -112); g.bezierCurveTo(10, -112, 40, -80, 34, -30); g.closePath(); fs(g, '#2a2236', ink, 2);
    for (let i = 0; i < 4; i++) line(g, [[-30 + i * 3, -44 - i * 16], [30 - i * 3, -44 - i * 16]], 'rgba(255,255,255,0.25)', 2);
    line(g, [[-34, -36], [34, -36]], C.gold, 4);
  }
  g.restore();
}

/* ───────── body ───────── */

/** Where the stance puts the hips, chest and head, so the S-curve bends the whole figure. */
function frame(stance: Deity['stance']) {
  if (stance === 'tribhanga') return { hip: 14, chest: -8, head: 10, tilt: 0.09 };
  return { hip: 0, chest: 0, head: 0, tilt: 0 };
}

export function deity(g: G, x: number, y: number, s: number, t: number, d: Deity) {
  const st = d.stance ?? 'stand';
  const F = frame(st);
  const sit = st === 'sit';
  g.save();
  if (d.alpha !== undefined) g.globalAlpha = d.alpha;
  g.translate(x, y); g.scale(s, s);
  const breathe = Math.sin(t * 1.3) * 1.2;

  // glow and the radiance behind
  if (d.glow) {
    const r = g.createRadialGradient(0, -300, 20, 0, -300, 360); r.addColorStop(0, `rgba(255,222,120,${0.6 * d.glow})`); r.addColorStop(1, 'rgba(255,222,120,0)');
    g.fillStyle = r; g.fillRect(-400, -700, 800, 800);
  }

  const by = sit ? 120 : 0; // a seated figure sits lower in its frame
  const shY = -300 + by + breathe, waistY = -190 + by, hipX = F.hip, chX = F.chest;
  const headX = F.head, headY = -362 + by + breathe;

  // pedestal lotus
  if ((d.base ?? 'lotus') === 'lotus' && !d.upperOnly) {
    for (let i = 0; i < 13; i++) { const a = -Math.PI + (i / 12) * Math.PI; g.save(); g.translate(Math.cos(a) * 84, 8 + Math.sin(a) * 10); g.rotate(a + Math.PI / 2); g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(14, -10, 10, -34, 0, -40); g.bezierCurveTo(-10, -34, -14, -10, 0, 0); fs(g, i % 2 ? C.pink : C.rani, ink, 1.8); g.restore(); }
    ellipse(g, 0, 8, 96, 16, 0, C.gold, ink, 2.4);
  }

  // extra arms (behind) and the cosmic heads
  const H = d.hands;
  const upper: ArmSpec[] = [];
  const nUpper = Math.max(0, Math.floor((H.length - 2) / 2));
  for (let k = 0; k < nUpper; k++) {
    // the extra arms open in a fan: the first pair raised, the rest spreading
    // outward and down like the rays behind the image
    const u = nUpper === 1 ? 0 : k / (nUpper - 1);
    const th = nUpper === 1 ? 0.42 : lerp(0.22, 2.0, u);
    for (const sd of [-1, 1]) {
      const hold = H[2 + k * 2 + (sd > 0 ? 1 : 0)];
      const sx = chX + sd * 50, sy = shY + 18 + k * 2;
      const L1 = nUpper === 1 ? 70 : 74 + u * 10, L2 = nUpper === 1 ? 72 : 70;
      const ex = sx + sd * Math.sin(th) * L1, ey = sy - Math.cos(th) * L1;
      const th2 = th + (nUpper === 1 ? -0.3 : 0.18);
      const hx = ex + sd * Math.sin(th2) * L2, hy = ey - Math.cos(th2) * L2;
      upper.push({ sx, sy, ex, ey, hx, hy, hold, side: sd, front: false });
    }
  }
  for (const a of upper) arm(g, d, a, t, s);
  if (d.heads && d.heads > 0) {
    // the other faces crowd round the central one in a crescent, smaller as they go
    const n = d.heads * 2;
    for (let i = 0; i < n; i++) {
      const u = n === 1 ? 0.5 : i / (n - 1), a = lerp(-2.55, -0.59, u);
      const hx = headX + Math.cos(a) * 118, hy = headY - 26 + Math.sin(a) * 92;
      const sc = 0.62 + 0.12 * Math.sin(u * Math.PI);
      crown(g, { ...d, crown: i % 2 ? 'kirita' : 'small' }, hx, hy - 4, t, sc);
      face(g, { ...d, eyes: i % 3 === 0 ? 'half' : 'open' }, hx, hy, t + i, sc);
    }
  }

  // legs and the dhoti
  const cloth = d.cloth ?? C.gold, fg = d.clothFg ?? C.marigold, border = d.border ?? C.vermilion;
  if (d.upperOnly) { /* the animal below stands in for the legs */ }
  else if (!sit) {
    // feet on the lotus
    for (const sd of [-1, 1]) {
      const fx = hipX * 0.3 + sd * (st === 'tribhanga' && sd > 0 ? 34 : 22);
      g.beginPath(); g.moveTo(fx - 14, -4); g.quadraticCurveTo(fx, -22, fx + 14, -4); g.quadraticCurveTo(fx + sd * 20, 4, fx + sd * 18, 6); g.lineTo(fx - 14, 6); g.closePath(); fs(g, d.skin, ink, 2);
      circle(g, fx, -2, 3, C.vermilion);
      line(g, [[fx - 12, -14], [fx + 12, -14]], C.gold, 3.4);
      for (let i = 0; i < 5; i++) circle(g, fx - 10 + i * 5, -10, 1.8, C.white);
    }
    if (st === 'tribhanga') {
      // one leg crossed over the other, as he leans on it to play
      stroke2(g, [[hipX + 18, waistY + 70], [hipX - 4, -70], [-10, -18]], 26, d.skin, ink, 2.4, true);
    }
    // the pitambara: a full skirt of yellow silk, pleats in front, border at the hem
    const top = waistY, hem = -26;
    g.beginPath(); g.moveTo(hipX - 44, top); g.bezierCurveTo(hipX - 54, top + 60, -60, hem - 50, -64, hem); g.quadraticCurveTo(0, hem + 14, 64, hem); g.bezierCurveTo(60, hem - 50, hipX + 54, top + 60, hipX + 44, top); g.closePath();
    fs(g, floretP(g, cloth, fg, 22), ink, 2.6);
    line(g, [[-64, hem - 2], [0, hem + 10], [64, hem - 2]], border, 7, true);
    // the front pleats, swaying
    const sw = Math.sin(t * 1.6) * 3;
    g.beginPath(); g.moveTo(hipX - 10, top + 8); g.lineTo(hipX + 12, top + 8); g.quadraticCurveTo(hipX + 18 + sw, top + 90, 14 + sw, hem + 6); g.lineTo(-12 + sw, hem + 6); g.quadraticCurveTo(hipX - 14 + sw, top + 90, hipX - 10, top + 8); g.closePath();
    fs(g, stripeP(g, shade(cloth, 1.08), fg, 9, 3), ink, 2);
    line(g, [[-12 + sw, hem + 4], [14 + sw, hem + 4]], border, 5);
  } else {
    // seated cross-legged on the lotus
    g.beginPath(); g.moveTo(-50, waistY - 6); g.bezierCurveTo(-120, waistY + 4, -136, waistY + 70, -96, waistY + 84); g.lineTo(96, waistY + 84); g.bezierCurveTo(136, waistY + 70, 120, waistY + 4, 50, waistY - 6); g.closePath();
    fs(g, floretP(g, cloth, fg, 22), ink, 2.6);
    line(g, [[-104, waistY + 80], [104, waistY + 80]], border, 6);
    for (const sd of [-1, 1]) { ellipse(g, sd * 34, waistY + 54, 18, 9, sd * 0.3, d.skin, ink, 2); circle(g, sd * 34, waistY + 54, 3.4, C.vermilion); }
  }

  // the waist sash and its tassels
  g.beginPath(); g.moveTo(hipX - 46, waistY - 8); g.quadraticCurveTo(hipX, waistY + 4, hipX + 46, waistY - 8); g.lineTo(hipX + 44, waistY + 10); g.quadraticCurveTo(hipX, waistY + 20, hipX - 44, waistY + 10); g.closePath();
  fs(g, d.sari ? C.rani : C.vermilion, ink, 2);
  for (let i = 0; i < 9; i++) circle(g, hipX - 38 + i * 9.5, waistY + 10 + Math.sin(i) * 2, 2.4, C.gold);

  // torso
  g.save(); g.translate(chX, 0); g.rotate(F.tilt * 0.3);
  g.beginPath(); g.moveTo(-38, waistY - 4); g.bezierCurveTo(-46, waistY - 50, -70, shY + 34, -78, shY + 8); g.quadraticCurveTo(-70, shY - 14, -16, shY - 16); g.lineTo(16, shY - 16); g.quadraticCurveTo(70, shY - 14, 78, shY + 8); g.bezierCurveTo(70, shY + 34, 46, waistY - 50, 38, waistY - 4); g.closePath();
  fs(g, d.skin, ink, 2.6);
  if (d.cosmos) cosmosIn(g, d.cosmos, t, waistY, shY);
  if (d.sari) {
    g.save(); g.clip();
    g.fillStyle = C.vermilion; g.fillRect(-80, shY - 20, 160, 70);
    g.restore();
    g.beginPath(); g.moveTo(-70, shY + 4); g.bezierCurveTo(-20, shY + 30, 30, waistY - 60, 40, waistY - 2); g.lineTo(22, waistY - 2); g.bezierCurveTo(10, waistY - 70, -30, shY + 40, -70, shY + 26); g.closePath();
    fs(g, floretP(g, cloth, fg, 20), ink, 2);
  } else {
    // chest line, the navel, the Srivatsa curl on the chest
    line(g, [[-40, shY + 40], [-20, shY + 52], [0, shY + 46], [20, shY + 52], [40, shY + 40]], shade(d.skin, 0.72), 2, true);
    circle(g, 0, waistY - 26, 2.6, shade(d.skin, 0.6));
    curl(g, 26, shY + 36, 6, 1.2, 1, 0); g.strokeStyle = C.gold; g.lineWidth = 2; g.stroke();
    // the sacred thread
    line(g, [[-52, shY - 2], [-8, shY + 60], [30, waistY - 6]], C.cream, 2.6, true);
  }
  // necklaces, the Kaustubha jewel
  for (let r = 0; r < 3; r++) {
    const yy = shY + 10 + r * 14;
    g.beginPath(); g.moveTo(-30 - r * 4, shY - 10); g.quadraticCurveTo(0, yy + 30, 30 + r * 4, shY - 10); fs(g, null, r === 1 ? C.white : C.gold, r === 1 ? 4 : 3.4);
  }
  g.beginPath(); g.moveTo(0, shY + 46); g.lineTo(12, shY + 60); g.lineTo(0, shY + 76); g.lineTo(-12, shY + 60); g.closePath(); fs(g, C.vermilion, C.gold, 3);
  circle(g, 0, shY + 60, 3.4, C.white);
  g.restore();

  // the vanamala: forest flowers from the shoulders to the knees
  if (d.garland !== false) {
    const low = sit ? waistY + 30 : -100;
    for (const sd of [-1, 1]) {
      const pts: number[][] = [[chX + sd * 30, shY - 6], [chX + sd * 52, shY + 70], [hipX + sd * 48, waistY + 30], [sd * 34, low], [sd * 4, low + 22]];
      for (let i = 0; i < 26; i++) {
        const u = i / 25, k = Math.min(pts.length - 2, Math.floor(u * (pts.length - 1))), tt = u * (pts.length - 1) - k;
        const px = lerp(pts[k][0], pts[k + 1][0], tt), py = lerp(pts[k][1], pts[k + 1][1], tt) + Math.sin(t * 1.4 + i * 0.3) * 1.5;
        circle(g, px, py, 5.5, [C.marigold, C.white, C.rani, C.leaf][i % 4], ink, 1);
      }
    }
  }

  // the two main arms (front), shaped by the stance and what they hold
  const lowerR = H[0] ?? 'none', lowerL = H[1] ?? 'none';
  const shL = chX - 66, shR = chX + 66;
  const mainArm = (sd: number, hold: Hold): ArmSpec => {
    const sx = sd < 0 ? shL : shR, sy = shY + 8;
    if (hold === 'flute') {
      // both hands lifted to the flute held across to his right
      return sd < 0 ? { sx, sy, ex: sx - 26, ey: sy + 64, hx: chX - 4, hy: headY + 44, hold: 'flute', side: -1, front: true }
        : { sx, sy, ex: sx + 22, ey: sy + 60, hx: chX - 64, hy: headY + 84, hold: 'none', side: 1, front: true };
    }
    if (hold === 'raised') return { sx, sy, ex: sx + sd * 30, ey: sy - 60, hx: sx + sd * 26, hy: sy - 140, hold: 'abhaya', side: sd, front: true };
    if (hold === 'fist') return { sx, sy, ex: sx + sd * 26, ey: sy + 70, hx: sx + sd * 4, hy: waistY - 4, hold: 'fist', side: sd, front: true };
    if (hold === 'abhaya') return { sx, sy, ex: sx + sd * 30, ey: sy + 76, hx: sx + sd * 22, hy: sy + 40, hold, side: sd, front: true };
    if (hold === 'mace') return { sx, sy, ex: sx + sd * 34, ey: sy + 70, hx: sx + sd * 52, hy: waistY + 30, hold, side: sd, front: true };
    if (hold === 'varada' || hold === 'coins') return { sx, sy, ex: sx + sd * 34, ey: sy + 72, hx: sx + sd * 48, hy: waistY + 20, hold, side: sd, front: true };
    return { sx, sy, ex: sx + sd * 34, ey: sy + 74, hx: sx + sd * 40, hy: sy + 36, hold, side: sd, front: true };
  };
  const AR = mainArm(-1, lowerR), AL = mainArm(1, lowerL);
  if (lowerR === 'flute') { arm(g, d, AL, t, s); arm(g, d, AR, t, s); }
  else { arm(g, d, AR, t, s); arm(g, d, AL, t, s); }

  // head and crown
  face(g, d, headX, headY, t);
  if (d.face !== 'lion') crown(g, d, headX, headY - 4, t);
  else crown(g, { ...d, crown: 'small' }, headX, headY - 14, t, 0.9);
  g.restore();
}

/** Stars, a spiral of nebula, a sun and a moon, painted inside a torso already set as the clip. */
function cosmosIn(g: G, amt: number, t: number, waistY: number, shY: number) {
  g.save(); g.clip();
  g.globalAlpha *= clamp(amt);
  const gr = g.createLinearGradient(0, shY - 20, 0, waistY); gr.addColorStop(0, '#0a1036'); gr.addColorStop(1, '#2b1752'); g.fillStyle = gr; g.fillRect(-90, shY - 30, 180, waistY - shY + 40);
  const R = rng(17);
  for (let i = 0; i < 60; i++) { const x = (R() - 0.5) * 140, y = shY + R() * (waistY - shY); g.fillStyle = `rgba(255,240,190,${0.4 + 0.6 * Math.abs(Math.sin(t * 2 + i))})`; star4(g, x, y, 1.6 + R() * 3); }
  g.save(); g.translate(0, (shY + waistY) / 2); g.rotate(t * 0.15);
  for (let a = 0; a < 2; a++) { g.beginPath(); for (let i = 0; i < 60; i++) { const th = i * 0.18 + a * Math.PI, r = i * 0.9; g.lineTo(Math.cos(th) * r, Math.sin(th) * r * 0.6); } g.strokeStyle = 'rgba(205,189,240,0.55)'; g.lineWidth = 3; g.stroke(); }
  g.restore();
  circle(g, -30, shY + 40, 10, C.fire2); circle(g, 32, shY + 46, 8, C.cream);
  g.restore();
}

/** The radiant oval behind an image: rays, a ring of petals and a halo. */
export function aureole(g: G, x: number, y: number, s: number, t: number, cols = [C.gold, C.cream]) {
  g.save(); g.translate(x, y); g.scale(s, s);
  glory(g, 0, 0, 150, 280, t, 40, cols);
  circle(g, 0, 0, 152, null, C.vermilion, 5);
  for (let i = 0; i < 32; i++) { const a = (i / 32) * Math.PI * 2; circle(g, Math.cos(a) * 160, Math.sin(a) * 160, 5, C.cream, ink, 1); }
  g.restore();
}

export { dotsP };
