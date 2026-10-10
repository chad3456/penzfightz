/**
 * “Maa Durga’s Valour” — a one-minute vertical reel (1080 × 1920, 30 fps)
 * made from the Navadurga gallery’s own pictures and music: the hatched
 * pen-and-ink goddess, her lion, Mahisha and his shapes, Smoke-eyes, Kali,
 * Raktabija, the Mothers, and the nine portraits — cut on the beat of a
 * synthesised dhaak at 120 bpm.
 *
 * Every frame is a pure function of its time, and the score is rendered
 * offline from the same instruments as the music room, so the file and the
 * page are the same film. See scripts/render-durga-reel.mjs.
 */
import { type G, type Ink, INKS, rng, lerp, clamp, ease, out, TAU, paper, patternedRays, lineSun, crescent, hatch, pen } from './ink';
import { devi, mount, asura, buffalo, elephantForm, matrikaMount, ashes, holdThing, type Devi, type Hold } from './figures';
import { sprite, put } from './battles';
import { PORTRAITS, paintPortrait } from './portraits';
import { Utsav } from './music';

export const W = 1080, H = 1920, DURATION = 60, FPS = 30;
const BEAT = 0.5;

/* ───────── sprites ───────── */

type Spr = ReturnType<typeof sprite>;
const DURGA = (ink: Ink, hands: Hold[], extra: Partial<Devi> = {}): Devi => ({ ink, skin: '#f0b080', sari: '#c2422a', sari2: '#f7d98a', blouse: '#2f6a5a', hands, crown: 'mukut', mood: 'calm', seed: 11, bands: ['lines', 'beads', 'chevron', 'wave', 'diamonds'], ...extra });
const FULL: Hold[] = ['abhaya', 'varada', 'trident', 'chakra', 'conch', 'spear', 'vajra', 'bow', 'sword', 'bell'];
const dS = (key: string, d: Devi): Spr => sprite(`reel-${key}`, 900, 820, 450, 780, (g) => devi(g, d));
const lionS = (ink: Ink, roar = 0): Spr => sprite(`reel-lion-${ink.paper}-${roar}`, 560, 340, 280, 320, (g) => mount(g, 'lion', ink, 0, 3, { roar }));
const asS = (key: string, ink: Ink, a: Partial<Parameters<typeof asura>[1]> = {}): Spr => sprite(`reel-as-${key}`, 520, 720, 260, 690, (g) => asura(g, { ink, ...a }));
const bufS = (ink: Ink, charge = 1): Spr => sprite(`reel-buf-${ink.paper}-${charge}`, 820, 520, 420, 470, (g) => buffalo(g, ink, 0, { charge }));
const eleS = (ink: Ink): Spr => sprite(`reel-ele-${ink.paper}`, 760, 420, 380, 400, (g) => elephantForm(g, ink, 0));
const KALI = (ink: Ink): Devi => ({ ink: { ...ink, dark: '#05050f' }, skin: '#22203a', sari: '#14121e', sari2: '#e85a3a', blouse: '#22203a', hands: ['skull', 'noose', 'sword', 'hook'], crown: 'wild', mood: 'fierce', tongue: true, garland: 'skulls', seed: 21, bands: ['lines', 'dots', 'zig'] });

/** A paper ground with a ring of patterned rays, rotated slowly about (cx, cy). */
function ground(g: G, ink: Ink, t: number, cx = W / 2, cy = 820, spin = 0.02, sun = true) {
  g.drawImage(sprite(`reel-paper-${ink.paper}`, W, H, 0, 0, (gg) => paper(gg, W, H, ink, 5)), 0, 0);
  const rays = sprite(`reel-rays-${ink.paper}`, 2600, 2600, 1300, 1300, (gg) => patternedRays(gg, 0, 0, 230, 1300, 36, ink, 17, 0, TAU));
  put(g, rays, cx, cy, 1, { rot: t * spin });
  if (sun) g.drawImage(sprite(`reel-sun-${ink.paper}`, 520, 520, 260, 260, (gg) => lineSun(gg, 0, 0, 230, ink, 4, true)), cx - 260, cy - 260);
}

/* ───────── type ───────── */

const SANS = '"Liberation Sans", "Arial Black", Arial, "Helvetica Neue", sans-serif';
const DEVF = '"Tiro Devanagari Sanskrit", "Noto Serif Devanagari", serif';
const TITLE = '"Cinzel", "Trajan Pro", Georgia, serif';

/**
 * A caption that arrives a word at a time with a pop. Words in *stars* are
 * set in a red box. Wraps to `maxW`.
 */
function caption(g: G, text: string, x: number, y: number, lt: number, o: { size?: number; maxW?: number; color?: string; per?: number; fade?: number } = {}) {
  const size = o.size ?? 66, maxW = o.maxW ?? 900, per = o.per ?? 0.09;
  g.font = `bold ${size}px ${SANS}`;
  const words = text.split(' ');
  const lines: { w: string; hi: boolean; width: number }[][] = [[]];
  let lw = 0;
  for (const raw of words) {
    const hi = raw.startsWith('*'), w = raw.replace(/\*/g, ''), width = g.measureText(w + ' ').width;
    if (lw + width > maxW && lines[lines.length - 1].length) { lines.push([]); lw = 0; }
    lines[lines.length - 1].push({ w, hi, width }); lw += width;
  }
  let k = 0;
  const fade = o.fade ?? 1;
  lines.forEach((ln, li) => {
    const total = ln.reduce((a, b) => a + b.width, 0);
    let cx = x - total / 2;
    for (const wd of ln) {
      const a = clamp((lt - k * per) / 0.14);
      if (a > 0) {
        const sc = 1 + 0.35 * (1 - out(a)), yy = y + li * size * 1.18;
        g.save(); g.globalAlpha = a * fade; g.translate(cx + wd.width / 2, yy); g.scale(sc, sc);
        g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `bold ${size}px ${SANS}`;
        const tw = g.measureText(wd.w).width;
        if (wd.hi) { g.fillStyle = '#c8282a'; g.fillRect(-tw / 2 - 12, -size * 0.62, tw + 24, size * 1.2); }
        g.lineJoin = 'round'; g.lineWidth = 12; g.strokeStyle = '#1a0c08'; if (!wd.hi) g.strokeText(wd.w, 0, 2);
        g.fillStyle = wd.hi ? '#fff' : (o.color ?? '#fff8ec'); g.fillText(wd.w, 0, 0);
        g.restore();
      }
      cx += wd.width; k++;
    }
  });
}

/** A word stamped on: big, then settling, with a little shake. */
function stamp(g: G, s: string, x: number, y: number, size: number, lt: number, o: { dev?: boolean; color?: string; stroke?: string; title?: boolean } = {}) {
  const a = clamp(lt / 0.18); if (a <= 0) return;
  const sc = 1 + 0.8 * (1 - out(a)), sh = (1 - a) * 10;
  g.save(); g.translate(x + Math.sin(lt * 90) * sh, y); g.scale(sc, sc); g.globalAlpha = a;
  g.font = o.dev ? `${size}px ${DEVF}` : o.title ? `700 ${size}px ${TITLE}` : `bold ${size}px ${SANS}`;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineJoin = 'round'; g.lineWidth = size * 0.16; g.strokeStyle = o.stroke ?? '#1a0c08'; g.strokeText(s, 0, 0);
  g.fillStyle = o.color ?? '#f7d98a'; g.fillText(s, 0, 0);
  g.restore();
}

function small(g: G, s: string, x: number, y: number, size: number, color = '#fff8ec', a = 1) {
  g.save(); g.globalAlpha = a; g.font = `700 ${size}px ${TITLE}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineWidth = 8; g.lineJoin = 'round'; g.strokeStyle = '#1a0c08'; g.strokeText(s, x, y); g.fillStyle = color; g.fillText(s, x, y); g.restore();
}

const glow = (g: G, x: number, y: number, r: number, a: number, col = '255,226,140') => { const gr = g.createRadialGradient(x, y, 2, x, y, r); gr.addColorStop(0, `rgba(${col},${a})`); gr.addColorStop(1, `rgba(${col},0)`); g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r); };
function petals(g: G, t: number, n = 60, seed = 3) { const R = rng(seed); for (let i = 0; i < n; i++) { const x = R() * W, sp = 180 + R() * 240, y = ((t * sp + R() * H) % (H + 100)) - 50, a = t * (1 + R() * 2) + R() * 6; g.save(); g.translate(x + Math.sin(t * 2 + i) * 30, y); g.rotate(a); g.fillStyle = ['#f2a23a', '#d0402a', '#f7d98a', '#f08aa8'][i % 4]; g.beginPath(); g.ellipse(0, 0, 13, 6, 0, 0, TAU); g.fill(); g.restore(); } }
function speedLines(g: G, t: number, cx: number, cy: number, a: number) { const R = rng(Math.floor(t * 20)); g.save(); g.globalAlpha = a; g.strokeStyle = '#fff8ec'; for (let i = 0; i < 40; i++) { const ang = R() * TAU, r0 = 420 + R() * 200, r1 = r0 + 300 + R() * 600; g.lineWidth = 2 + R() * 5; g.beginPath(); g.moveTo(cx + Math.cos(ang) * r0, cy + Math.sin(ang) * r0); g.lineTo(cx + Math.cos(ang) * r1, cy + Math.sin(ang) * r1); g.stroke(); } g.restore(); }
function weapon(g: G, k: Hold, x: number, y: number, s: number, ink: Ink, rot = 0) { g.save(); g.translate(x, y); g.rotate(rot); holdThing(g, k, ink, rng(1), s, true); g.restore(); }

/* ───────── the shots ───────── */

interface Shot { t0: number; t1: number; draw: (g: G, lt: number, d: number, t: number) => void }

const OCH = INKS.ochre, RUST = INKS.rust, NIGHT = INKS.night, BALL = INKS.ballpoint, CRAY = INKS.crayon;
const GODS: [string, string][] = [['Brahma', '#e8a060'], ['Vishnu', '#3f6fd0'], ['Shiva', '#bcd0e0'], ['Indra', '#f2b52a'], ['Agni', '#e8502a'], ['Yama', '#3d6b55'], ['Varuna', '#2e8a9a'], ['Surya', '#f2a23a']];
const ARMS: [Hold, string][] = [['trident', 'SHIVA · TRIDENT'], ['chakra', 'VISHNU · DISCUS'], ['conch', 'VARUNA · CONCH'], ['spear', 'AGNI · SPEAR'], ['vajra', 'INDRA · THUNDERBOLT'], ['bow', 'VAYU · BOW'], ['sword', 'KALA · SWORD'], ['bell', 'AIRAVATA · BELL']];
const SHAPES: [string, Hold, string][] = [['BUFFALO', 'noose', 'NOOSE'], ['LION', 'sword', 'SWORD'], ['WARRIOR', 'arrow', 'ARROWS'], ['ELEPHANT', 'sword', 'SWORD'], ['BUFFALO', 'trident', 'TRIDENT']];

const SHOTS: Shot[] = [
  // 0 — hook: the buffalo in the dark
  { t0: 0, t1: 1.5, draw: (g, lt) => {
    g.fillStyle = '#0b0a14'; g.fillRect(0, 0, W, H);
    g.save(); g.globalAlpha = 0.55 + 0.45 * lt / 1.5; put(g, bufS(NIGHT, 1), W / 2 + 120, 1360, 1.9 + lt * 0.12, { alpha: 0.9 }); g.restore();
    glow(g, W / 2 - 160, 1180, 120, 0.4 + 0.3 * Math.sin(lt * 20), '230,40,40');
    caption(g, 'No god could *defeat* him.', W / 2, 520, lt, { size: 78 });
  } },
  // 1 — so they made her
  { t0: 1.5, t1: 3, draw: (g, lt) => {
    ground(g, RUST, lt, W / 2, 900, 0.3);
    const z = lerp(3.2, 2.6, ease(clamp(lt / 1.5)));
    put(g, dS('face-calm', DURGA(RUST, FULL)), W / 2, 900 + 500 * z - 40, z);
    caption(g, 'So they made *HER.*', W / 2, 380, lt, { size: 92 });
  } },
  // 2 — Mahishasura takes heaven
  { t0: 3, t1: 6, draw: (g, lt) => {
    ground(g, OCH, lt, W / 2, 760);
    g.fillStyle = OCH.paper2; g.fillRect(0, 1180, W, 740); hatch(g, [[0, 1180], [W, 1180], [W, H], [0, H]], 'rule', { color: OCH.ink, gap: 12, w: 0.8, angle: 0, alpha: 0.5 });
    const x = lerp(1500, 420, ease(clamp(lt / 2.6)));
    put(g, bufS(OCH, 1), x + Math.sin(lt * 30) * 4, 1580, 1.6);
    for (let i = 0; i < 12; i++) { const ph = (lt * 1.4 + i / 12) % 1; g.globalAlpha = (1 - ph) * 0.5; g.fillStyle = '#d8b88a'; g.beginPath(); g.arc(x + 360 + ph * 260 + (i % 3) * 30, 1420 - ph * 80, 30 + ph * 50, 0, TAU); g.fill(); } g.globalAlpha = 1;
    caption(g, 'Mahishasura, the *buffalo demon,*', W / 2, 330, lt, { size: 60, maxW: 980 });
    caption(g, 'drove the gods out of heaven.', W / 2, 430, lt - 1.4, { size: 60, maxW: 980 });
  } },
  // 3 — their fury became light
  { t0: 6, t1: 9, draw: (g, lt) => {
    g.drawImage(sprite('reel-paper-night', W, H, 0, 0, (gg) => { paper(gg, W, H, NIGHT, 6); hatch(gg, [[0, 0], [W, 0], [W, H], [0, H]], 'cross', { color: '#2a2e6a', gap: 7, w: 0.6 }); }), 0, 0);
    const n = Math.min(8, Math.floor(lt / 0.3) + 1);
    GODS.forEach(([, col], i) => {
      const x = 150 + (i % 4) * 260, y = 1340 + Math.floor(i / 4) * 400, on = i < n;
      put(g, dS(`god-${i}`, DURGA(NIGHT, ['abhaya', 'varada'], { skin: col, sari: '#f7d98a', sari2: '#c8442a', crown: i === 2 ? 'jata' : 'mukut', garland: 'none', seed: 40 + i, blouse: col })), x, y, 0.5, { alpha: on ? 1 : 0.3 });
      if (on) { g.save(); g.globalAlpha = 0.6; g.strokeStyle = '#fff3c0'; g.lineWidth = 14; g.beginPath(); g.moveTo(x, y - 300); g.quadraticCurveTo((x + W / 2) / 2, 900, W / 2, 760); g.stroke(); g.restore(); }
    });
    glow(g, W / 2, 760, 120 + n * 45, 0.5 + n * 0.05);
    caption(g, 'Their fury became *light.*', W / 2, 330, lt, { size: 80 });
  } },
  // 4 — the light became Durga
  { t0: 9, t1: 11, draw: (g, lt) => {
    ground(g, OCH, lt + 9, W / 2, 760, 0.06);
    glow(g, W / 2, 760, 700, 0.5 * (1 - clamp(lt / 1.2)), '255,250,230');
    const z = lerp(1.45, 1.25, ease(clamp(lt / 2)));
    put(g, lionS(OCH, 0), W / 2 + 70, 1620, 1.75);
    put(g, dS('durga-bare', DURGA(OCH, ['abhaya', 'varada', 'none', 'none', 'none', 'none', 'none', 'none', 'none', 'none'])), W / 2, 1460, z);
    stamp(g, 'दुर्गा', W / 2, 330, 200, lt - 0.3, { dev: true });
    small(g, 'DURGA · SHE WHO CANNOT BE REACHED', W / 2, 480, 40, '#fff8ec', clamp((lt - 0.8) * 3));
  } },
  // 5 — every god armed her
  { t0: 11, t1: 15, draw: (g, lt) => {
    ground(g, OCH, lt + 11, W / 2, 760, 0.06);
    const got = Math.min(8, Math.floor(lt / 0.5));
    const hands: Hold[] = ['abhaya', 'varada', ...ARMS.map(([h], i) => (i < got ? h : 'none'))];
    put(g, lionS(OCH, 0), W / 2 + 70, 1620, 1.75);
    put(g, dS(`durga-arm-${got}`, DURGA(OCH, hands)), W / 2, 1460, 1.25);
    if (got < 8) {
      const k = (lt % 0.5) / 0.5, [h, name] = ARMS[got], side = got % 2 ? 1 : -1;
      const wx = lerp(W / 2 + side * 640, W / 2 + side * 200, ease(k)), wy = lerp(1700, 900, ease(k));
      glow(g, wx, wy, 220, 0.7, '255,246,210'); weapon(g, h, wx, wy, 3.4 * (1.3 - 0.3 * k), OCH, (1 - k) * 6 * side);
      small(g, name, W / 2, 470, 46, '#fff8ec', 1);
    }
    if (got >= 1) glow(g, W / 2, 940, 300, 0.25 * (1 - (lt % 0.5) / 0.5));
    caption(g, 'Every god *armed* her.', W / 2, 330, lt, { size: 84 });
  } },
  // 6 — and the mountain gave her a lion
  { t0: 15, t1: 17, draw: (g, lt) => {
    ground(g, RUST, lt + 15, W / 2, 900, 0.08);
    const z = lerp(2.1, 1.7, ease(clamp(lt / 2)));
    put(g, lionS(RUST, 1), W / 2 + 80, 1500 + Math.sin(lt * 40) * (lt < 0.6 ? 6 : 0), z);
    speedLines(g, lt, W / 2 + 300, 1200, clamp(1 - lt) * 0.5);
    caption(g, 'The mountain gave her a *lion.*', W / 2, 360, lt, { size: 80 });
  } },
  // 7 — he changed his shape; she met every one
  { t0: 17, t1: 24, draw: (g, lt) => {
    const r = Math.min(4, Math.floor(lt / 1.4)), k = (lt % 1.4) / 1.4;
    ground(g, r % 2 ? RUST : OCH, lt + 17, W / 2, 700, 0.1);
    const [shape, h, word] = SHAPES[r];
    // her, above
    put(g, lionS(r % 2 ? RUST : OCH, 1), W / 2 + 90, 1060, 1.0);
    put(g, dS('durga-full', DURGA(OCH, FULL)), W / 2 - 30, 990, 0.82);
    // him, below, shaking
    const sx = W / 2 + Math.sin(lt * 40) * (k < 0.25 ? 10 : 2), sy = 1640;
    g.save(); g.fillStyle = 'rgba(20,10,10,0.35)'; g.fillRect(0, 1180, W, 740); g.restore();
    if (shape === 'BUFFALO') put(g, bufS(OCH, 1), sx, sy + 40, 1.15);
    else if (shape === 'LION') put(g, lionS(OCH, 1), sx, sy + 20, 1.35, { flip: true });
    else if (shape === 'WARRIOR') put(g, asS('mahisha-man', OCH, { horns: true, skin: '#2e2a34', seed: 5 }), sx, sy + 120, 1.0);
    else put(g, eleS(OCH), sx, sy + 40, 1.25);
    // her answer flies down
    if (k > 0.35) { const u = clamp((k - 0.35) / 0.25); weapon(g, h, lerp(W / 2 - 200, sx, ease(u)), lerp(900, sy - 200, ease(u)), 1.8, OCH, u * 4); if (u >= 1) glow(g, sx, sy - 200, 360, 0.6 * (1 - (k - 0.6) / 0.4), '255,250,230'); }
    stamp(g, shape, W / 2, 1270, 72, k * 1.4);
    if (k > 0.35) stamp(g, `→ ${word}`, W / 2, 1360, 64, (k - 0.35) * 1.4, { color: '#fff' });
    caption(g, 'He changed his shape.', W / 2, 250, lt, { size: 66 });
    caption(g, '*She met every one.*', W / 2, 340, lt - 0.6, { size: 66 });
  } },
  // 8 — Mahishasuramardini
  { t0: 24, t1: 28, draw: (g, lt) => {
    ground(g, RUST, lt + 24, W / 2, 1000, 0.15);
    const k = clamp(lt / 1.5);
    put(g, bufS(RUST, 0), W / 2 + 60, 1700, 1.25, { rot: lt > 1.5 ? 0.06 : 0 });
    const x = lerp(260, W / 2 - 40, ease(k)), y = lerp(1100, 1350, ease(k)) - Math.sin(k * Math.PI) * 400;
    put(g, dS(`durga-strike-${lt > 1.5 ? 1 : 0}`, DURGA(RUST, ['abhaya', 'trident', 'sword', 'chakra', 'conch', 'spear', 'vajra', 'bow', 'bell', 'none'], { mood: 'fierce', strike: lt > 1.5 ? { i: 1, a: 0.3 } : undefined })), x, y, 1.0);
    if (lt < 1.5) speedLines(g, lt, x, y - 400, 0.5);
    if (lt > 1.5) { put(g, asS('mahisha-fall', RUST, { horns: true, skin: '#2e2a34', seed: 5, fall: 1 }), W / 2 + 230, 1700, 0.8); petals(g, lt - 1.5, 70); }
    stamp(g, 'महिषासुरमर्दिनी', W / 2, 330, 104, lt - 1.8, { dev: true });
    small(g, 'SLAYER OF MAHISHASURA', W / 2, 470, 42, '#fff8ec', clamp((lt - 2.2) * 3));
  } },
  // 9 — Smoke-eyes comes
  { t0: 28, t1: 31, draw: (g, lt) => {
    ground(g, BALL, lt + 28, W / 2, 800, 0.03, false);
    for (let i = 0; i < 9; i++) put(g, asS('soldier', BALL, { skin: '#7a6a8a', crown: false, seed: 8, hold: ['spear', 'shield'] }), 160 + (i % 3) * 380 + Math.floor(i / 3) * 40, 1350 + Math.floor(i / 3) * 170 + Math.sin(lt * 6 + i) * 6, 0.42);
    put(g, asS('dhumra', BALL, { skin: '#6a6a7a', seed: 7, tint: '#2a2a3a' }), W / 2, 1880 - lt * 30, 1.2);
    for (let i = 0; i < 14; i++) { const ph = (lt * 0.5 + i / 14) % 1; g.globalAlpha = (1 - ph) * 0.35; g.fillStyle = '#4a4450'; g.beginPath(); g.arc(W / 2 + Math.sin(i * 2 + lt) * 120, 1000 - ph * 300, 40 + ph * 60, 0, TAU); g.fill(); } g.globalAlpha = 1;
    caption(g, 'Then came *Smoke-eyes,*', W / 2, 320, lt);
    caption(g, 'to drag her by the hair.', W / 2, 510, lt - 1.2);
  } },
  // 10 — one syllable
  { t0: 31, t1: 34, draw: (g, lt) => {
    ground(g, BALL, lt + 31, W / 2, 900, 0.05, false);
    put(g, dS('durga-hum', DURGA(BALL, FULL, { sari: '#2234a8', sari2: '#f6d2b8', blouse: '#c8442a', mood: lt > 1 ? 'fierce' : 'calm' })), W / 2, 1300, 0.8);
    const gone = clamp((lt - 1.1) / 1.4);
    if (gone < 1) put(g, asS('dhumra', BALL, { skin: '#6a6a7a', seed: 7, tint: '#2a2a3a' }), W / 2, 1880, 1.0, { alpha: 1 - gone });
    if (lt > 1) { g.save(); g.strokeStyle = '#2234a8'; for (let i = 0; i < 7; i++) { const ph = clamp((lt - 1) * 1.2 - i * 0.07); g.globalAlpha = 1 - ph; g.lineWidth = 14; g.beginPath(); g.arc(W / 2, 760, 80 + ph * 1400, 0, TAU); g.stroke(); } g.restore(); ashes(g, W / 2, 1500, gone, lt, BALL); }
    if (lt < 1) caption(g, 'She answered with *one sound.*', W / 2, 360, lt, { size: 76 });
    stamp(g, 'हुं', W / 2, 380, 260, lt - 1.0, { dev: true, color: '#fff', stroke: '#2234a8' });
  } },
  // 11 — Kali springs from her frown
  { t0: 34, t1: 37, draw: (g, lt) => {
    ground(g, RUST, lt + 34, W / 2, 800, 0.12);
    const k = clamp((lt - 1.5) / 0.8);
    if (k < 1) { const z = 2.4; put(g, dS(`face-${lt > 0.8 ? 'fierce' : 'calm'}`, DURGA(RUST, FULL, { mood: lt > 0.8 ? 'fierce' : 'calm' })), W / 2, 820 + 500 * z - 40, z, { alpha: 1 - k }); g.save(); g.globalAlpha = clamp(lt / 1.4) * 0.55 * (1 - k); g.fillStyle = '#1a0a0a'; g.fillRect(0, 0, W, H); g.restore(); }
    if (lt > 1.5) { put(g, dS('kali', KALI(RUST)), W / 2, 1720, lerp(0.3, 1.35, out(k))); speedLines(g, lt, W / 2, 1000, (1 - k) * 0.7); }
    if (lt < 1.5) caption(g, 'Her face grew *dark* with anger…', W / 2, 330, lt);
    else caption(g, 'and from her frown sprang *KALI.*', W / 2, 330, lt - 1.5, { size: 74 });
  } },
  // 12 — she swallowed their weapons whole
  { t0: 37, t1: 40, draw: (g, lt) => {
    ground(g, RUST, lt + 37, W / 2, 900, 0.12);
    put(g, dS('kali', KALI(RUST)), W / 2, 1760, 1.2);
    for (let i = 0; i < 10; i++) { const ph = (lt * 0.9 + i / 10) % 1, side = i % 2 ? 1 : -1; const x = lerp(W / 2 + side * 700, W / 2, ease(ph)), y = lerp(500 + (i % 5) * 120, 1040, ease(ph)); g.save(); g.globalAlpha = 1 - ph * 0.3; weapon(g, 'chakra', x, y, 1.3 * (1 - ph * 0.6), RUST, lt * 9); g.restore(); }
    caption(g, 'She swallowed their *weapons* whole.', W / 2, 330, lt);
    stamp(g, 'चामुण्डा', W / 2, 560, 130, lt - 1.8, { dev: true });
  } },
  // 13 — Raktabija multiplies
  { t0: 40, t1: 43, draw: (g, lt) => {
    ground(g, NIGHT, lt + 40, W / 2, 900, 0.04, false);
    for (let i = 0; i < 9; i++) crescent(g, 90 + i * 115, 130 + Math.sin(i) * 20, 22, i * 0.5, '#fbf2e2', i);
    const n = Math.min(32, Math.pow(2, Math.floor(lt / 0.5)));
    const R = rng(4);
    for (let i = 0; i < n; i++) { const x = 120 + R() * (W - 240), y = 1000 + R() * 820, s = 0.22 + R() * 0.16; put(g, asS('rakta', NIGHT, { skin: '#a8302a', horns: true, seed: 81 }), x, y, s); }
    for (let i = 0; i < 20; i++) { const ph = (lt * 1.2 + i / 20) % 1; g.fillStyle = '#d0202a'; g.beginPath(); g.ellipse(W / 2 + Math.sin(i * 3) * 400 * ph, 800 + ph * 900, 9, 13, 0, 0, TAU); g.fill(); }
    caption(g, 'Every drop of his blood became *another demon.*', W / 2, 330, lt, { size: 70 });
    small(g, `× ${n}`, W / 2, 760, 90, '#f2e2b8', 1);
  } },
  // 14 — not one drop touched the ground
  { t0: 43, t1: 46, draw: (g, lt) => {
    ground(g, NIGHT, lt + 43, W / 2, 900, 0.04, false);
    put(g, asS('rakta', NIGHT, { skin: '#a8302a', horns: true, seed: 81, fall: clamp((lt - 2) * 2) }), W / 2 + 240, 1100, 0.9);
    put(g, dS('kali', KALI(NIGHT)), W / 2 - 120, 2050, 1.2);
    const mx = W / 2 - 120, my = 2050 - 1.2 * 466;
    for (let i = 0; i < 14; i++) { const ph = (lt * 1.1 + i / 14) % 1; const x = lerp(W / 2 + 240 + Math.sin(i * 2) * 200, mx, ph), y = lerp(760, my, ph) - Math.sin(ph * Math.PI) * 260; g.fillStyle = '#d0202a'; g.beginPath(); g.ellipse(x, y, 10, 14, 0, 0, TAU); g.fill(); }
    caption(g, 'Not one drop *touched the ground.*', W / 2, 330, lt, { size: 76 });
  } },
  // 15 — who else is there besides me
  { t0: 46, t1: 51, draw: (g, lt) => {
    ground(g, CRAY, lt + 46, W / 2, 900, 0.08);
    const n = Math.min(7, Math.floor(lt / 0.5));
    put(g, lionS(CRAY, 0), W / 2 + 110, 1560, 1.35);
    put(g, dS('durga-one', DURGA(CRAY, FULL, { sari: CRAY.red })), W / 2, 1460, 1.0);
    for (let i = 0; i < 7; i++) {
      if (i < n) continue;
      const a = -Math.PI / 2 + (i / 7) * TAU + lt * 0.3, r = i === n ? lerp(420, 0, (lt % 0.5) / 0.5) : 420;
      const x = W / 2 + Math.cos(a) * r, y = 1050 + Math.sin(a) * r * 0.9;
      g.save(); g.translate(x, y + 20); matrikaMount(g, ['swan', 'bull', 'peacock', 'eagle', 'boar', 'lion', 'elephant'][i], CRAY); g.restore();
      put(g, dS(`matrika-${i}`, DURGA(CRAY, ['abhaya', 'none'], { sari: ['#f4ead2', '#bcd0e0', '#d89a2a', '#f2b52a', '#5a4a5a', '#e8902c', '#c8442a'][i], garland: 'none', seed: 70 + i })), x, y, 0.32);
    }
    glow(g, W / 2, 1000, 260 + n * 30, 0.15 + n * 0.04);
    caption(g, '“Who else is there *besides me?*”', W / 2, 300, lt, { size: 74 });
    if (lt > 3.2) { g.save(); g.globalAlpha = clamp((lt - 3.2) * 2); g.font = `56px ${DEVF}`; g.textAlign = 'center'; g.lineWidth = 9; g.strokeStyle = '#fbf4e0'; g.strokeText('एकैवाहं जगत्यत्र द्वितीया का ममापरा', W / 2, 500); g.fillStyle = '#c8282a'; g.fillText('एकैवाहं जगत्यत्र द्वितीया का ममापरा', W / 2, 500); g.restore(); }
  } },
  // 16 — nine forms
  { t0: 51, t1: 55.5, draw: (g, lt) => {
    const i = Math.min(8, Math.floor(lt / 0.5)), k = (lt % 0.5) / 0.5, p = PORTRAITS[i];
    const img = portrait(i), cw = H / 1.25;
    g.drawImage(img, (W - cw) / 2, 0, cw, H); g.fillStyle = 'rgba(26,12,8,0.72)'; g.fillRect(0, 0, W, H);
    const z = 1.12 + 0.06 * k, w = W * z, h = w * 1.25;
    g.drawImage(img, (W - w) / 2, (H - h) / 2 - 40, w, h);
    g.save(); g.fillStyle = 'rgba(15,8,5,0.6)'; g.fillRect(0, 1270, W, 270); g.restore();
    stamp(g, p.dev, W / 2, 1360, 110, k * 0.5, { dev: true });
    small(g, `NIGHT ${p.night} · ${p.name.toUpperCase()}`, W / 2, 1480, 44, '#f7d98a', 1);
    small(g, 'NINE NIGHTS · NINE FORMS', W / 2, 270, 44, '#fff8ec', 1);
  } },
  // 17 — the closing mantra
  { t0: 55.5, t1: 60, draw: (g, lt) => {
    ground(g, OCH, lt + 55, W / 2, 820, 0.05);
    put(g, lionS(OCH, 1), W / 2 + 70, 1620, 1.75);
    put(g, dS('durga-full', DURGA(OCH, FULL)), W / 2, 1460, 1.25);
    petals(g, lt + 3, 40, 9);
    const lines = ['या देवी सर्वभूतेषु', 'शक्तिरूपेण संस्थिता', 'नमस्तस्यै नमो नमः'];
    lines.forEach((s, i) => { g.save(); g.globalAlpha = clamp((lt - i * 0.5) * 3); g.font = `72px ${DEVF}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 12; g.lineJoin = 'round'; g.strokeStyle = '#2e1a10'; g.strokeText(s, W / 2, 260 + i * 100); g.fillStyle = '#fff4d8'; g.fillText(s, W / 2, 260 + i * 100); g.restore(); });
    small(g, 'To the goddess who dwells in every being as power', W / 2, 590, 36, '#fff8ec', clamp((lt - 1.6) * 3));
    stamp(g, 'JAI MAA DURGA', W / 2, 1420, 90, lt - 2.2, { title: true });
    small(g, 'SHUBH NAVARATRI', W / 2, 1520, 46, '#fff8ec', clamp((lt - 2.8) * 3));
  } },
];

/** Moments that land: a white flash and a shake. */
const HITS = [1.5, 3, 9, 17, 18.4, 19.8, 21.2, 22.6, 25.5, 32, 35.5, 40, 43, 46, 51, 55.5];
/** Moments drawn as an inverted “impact frame” for two frames. */
const IMPACT = [1.5, 9, 25.5, 32, 35.5];

const portraits: HTMLCanvasElement[] = [];
function portrait(i: number) { if (!portraits[i]) portraits[i] = paintPortrait(PORTRAITS[i]); return portraits[i]; }

let grain: HTMLCanvasElement | null = null;
function grainLayer() {
  if (grain) return grain;
  grain = document.createElement('canvas'); grain.width = 360; grain.height = 640; const g = grain.getContext('2d')!; const R = rng(5);
  for (let i = 0; i < 9000; i++) { g.fillStyle = R() > 0.5 ? 'rgba(255,250,235,0.06)' : 'rgba(30,15,5,0.07)'; g.fillRect(R() * 360, R() * 640, 1.2, 1.2); }
  return grain;
}

export function frame(g: G, t: number) {
  const shot = SHOTS.find((s) => t >= s.t0 && t < s.t1) ?? SHOTS[SHOTS.length - 1];
  const lt = t - shot.t0;
  g.save();
  // the shake after a hit
  const hit = HITS.filter((h) => t >= h && t - h < 0.35).pop();
  if (hit !== undefined) { const k = 1 - (t - hit) / 0.35; g.translate(Math.sin(t * 97) * 18 * k, Math.cos(t * 83) * 18 * k); g.translate(W / 2, H / 2); g.scale(1 + 0.03 * k, 1 + 0.03 * k); g.translate(-W / 2, -H / 2); }
  shot.draw(g, lt, shot.t1 - shot.t0, t);
  g.restore();
  if (hit !== undefined && t - hit < 0.1) { g.fillStyle = `rgba(255,250,235,${0.7 * (1 - (t - hit) / 0.1)})`; g.fillRect(0, 0, W, H); }
  if (IMPACT.some((h) => t >= h && t - h < 2 / FPS)) { g.save(); g.globalCompositeOperation = 'difference'; g.fillStyle = '#fff'; g.fillRect(0, 0, W, H); g.restore(); }
  // paper grain and a soft vignette over everything
  g.save(); g.globalAlpha = 0.9; const gl = grainLayer(); for (let y = 0; y < H; y += 640) for (let x = 0; x < W; x += 360) g.drawImage(gl, x, y); g.restore();
  const vg = g.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.75); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(10,5,0,0.45)'); g.fillStyle = vg; g.fillRect(0, 0, W, H);
  // a fade at the very start and end, so it loops cleanly
  const f = Math.min(clamp(t / 0.15), clamp((DURATION - t) / 0.35));
  if (f < 1) { g.fillStyle = `rgba(11,10,20,${1 - f})`; g.fillRect(0, 0, W, H); }
  void pen;
}

/** Paint everything that is slow to paint, before the first frame. */
export async function warm() {
  for (let i = 0; i < 9; i++) { portrait(i); await new Promise((r) => setTimeout(r, 0)); }
  for (const t of [0.5, 2, 4, 7, 10, 13, 16, 18, 19.5, 21, 22.5, 23.5, 25, 27, 29, 32.5, 35, 36, 38, 41, 44, 48, 53, 57]) { const c = document.createElement('canvas'); c.width = W; c.height = H; frame(c.getContext('2d')!, t); await new Promise((r) => setTimeout(r, 0)); }
}

/* ───────── the score ───────── */

/** Cuts land on the downbeat: the dhaak changes with the story. */
const SECTIONS: [number, number, 'garba' | 'dhaak' | 'dhunuchi' | 'silence'][] = [
  [0, 1.5, 'silence'], [1.5, 17, 'dhaak'], [17, 28, 'dhunuchi'], [28, 31, 'dhaak'], [31, 32, 'silence'], [32, 40, 'dhunuchi'], [40, 46, 'dhaak'], [46, 51, 'dhunuchi'], [51, 55.5, 'garba'], [55.5, 60, 'silence'],
];

export async function synth(sr = 48000) {
  const ctx = new OfflineAudioContext(2, Math.ceil(DURATION * sr), sr);
  const u = new Utsav();
  u.use(ctx);
  u.fixedBpm = 120;
  for (const [t0, t1, mode] of SECTIONS) { if (mode === 'silence') continue; u.cue(mode, t0); u.fill(t1 - 0.01); }
  // the opening: a riser into the drop, and the conch
  u.conch(0.05);
  riser(ctx, 0.2, 1.5);
  for (const h of HITS) { u.bass(h, 1.6); u.gong(h, 0.7); }
  // the syllable: a low chord that swells and bursts
  hum(ctx, 32);
  riser(ctx, 31, 32);
  // the close: conch, gong, ulu, and a held drone
  u.conch(55.5); u.gong(55.5, 1.2); u.ulu(56.4); u.ulu(57.9);
  for (let k = 0; k < 8; k++) u.slap(55.5 + k * 0.5, 0.5);
  const buf = await ctx.startRendering();
  const L = buf.getChannelData(0), R = buf.getChannelData(1);
  // louder for a phone speaker: lift it, and let a soft clip round the drum peaks off
  const lift = 2.2, top = Math.tanh(lift);
  for (let i = 0; i < L.length; i++) { L[i] = (0.94 * Math.tanh(L[i] * lift)) / top; R[i] = (0.94 * Math.tanh(R[i] * lift)) / top; }
  // fade the last half second
  const n = Math.floor(0.5 * sr); for (let i = 0; i < n; i++) { const k = 1 - i / n, j = L.length - n + i; L[j] *= k; R[j] *= k; }
  return { L, R, sr };
}

function riser(ctx: BaseAudioContext, t0: number, t1: number) {
  const len = Math.ceil((t1 - t0) * ctx.sampleRate), b = ctx.createBuffer(1, len, ctx.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const s = ctx.createBufferSource(); s.buffer = b;
  const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 2; f.frequency.setValueAtTime(300, t0); f.frequency.exponentialRampToValueAtTime(6000, t1);
  const g = ctx.createGain(); g.gain.setValueAtTime(0.001, t0); g.gain.exponentialRampToValueAtTime(0.18, t1 - 0.02); g.gain.linearRampToValueAtTime(0, t1);
  s.connect(f).connect(g).connect(ctx.destination); s.start(t0);
}
function hum(ctx: BaseAudioContext, t: number) {
  const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.3, t + 0.05); g.gain.exponentialRampToValueAtTime(0.001, t + 2.4);
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(2400, t); lp.frequency.exponentialRampToValueAtTime(200, t + 2);
  for (const f of [55, 82.5, 110, 165]) { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.connect(lp); o.start(t); o.stop(t + 2.5); }
  lp.connect(g).connect(ctx.destination);
}

/** 16-bit stereo WAV. */
export function wavBytes(L: Float32Array, R: Float32Array, sr: number) {
  const n = L.length, b = new ArrayBuffer(44 + n * 4), v = new DataView(b);
  const w = (o: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  w(0, 'RIFF'); v.setUint32(4, 36 + n * 4, true); w(8, 'WAVE'); w(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 2, true);
  v.setUint32(24, sr, true); v.setUint32(28, sr * 4, true); v.setUint16(32, 4, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, n * 4, true);
  let o = 44; for (let i = 0; i < n; i++) { v.setInt16(o, Math.max(-1, Math.min(1, L[i])) * 0x7fff, true); v.setInt16(o + 2, Math.max(-1, Math.min(1, R[i])) * 0x7fff, true); o += 4; }
  return new Uint8Array(b);
}

export { BEAT };
