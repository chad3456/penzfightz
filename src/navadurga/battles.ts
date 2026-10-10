/**
 * Six battles of the Devi Mahatmya, told so that you take part. Each is a
 * short run of steps; each step has a few lines of the story and one thing
 * to do — tap, drag, hold, choose — and the picture answers.
 *
 *   1. Madhu and Kaitabha   (chapter 1)   — wake the sleeping Vishnu
 *   2. Mahishasura          (chapters 2–3) — gather the gods' light, arm her, meet every shape he takes
 *   3. Dhumralochana        (chapter 6)   — one syllable, हुं
 *   4. Chanda and Munda     (chapter 7)   — Kali springs from her brow
 *   5. Raktabija            (chapter 8)   — catch every drop before it lands
 *   6. Shumbha and Nishumbha (chapters 9–10) — “I am alone here; who else is there?”
 *
 * Figures are painted once into sprites per pose and moved about; the
 * backgrounds are painted once per battle.
 */
import { type G, type Pt, type Ink, INKS, rng, lerp, clamp, ease, out, TAU, paper, pen, shape, hatch, arcPts, blob, curve, patternedRays, lineSun, scaleSea, crescent, label } from './ink';
import { devi, mount, asura, buffalo, elephantForm, sleepingVishnu, brahma, holdThing, matrikaMount, ashes, type Devi, type Hold } from './figures';

export const BW = 1600, BH = 900;

/* ───────── input and sprites ───────── */

export interface Input { x: number; y: number; down: boolean; pressed: boolean; released: boolean; sx: number; sy: number }
export interface Ctx { g: G; t: number; dt: number; T: number; inp: Input; ink: Ink; pick?: number }

const cache = new Map<string, HTMLCanvasElement>();
/** Paint once into an offscreen sprite; (ax, ay) is where the drawing's origin sits. */
export function sprite(key: string, w: number, h: number, ax: number, ay: number, draw: (g: G) => void) {
  let c = cache.get(key);
  if (!c) { c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d')!; g.translate(ax, ay); draw(g); cache.set(key, c); (c as HTMLCanvasElement & { ax: number; ay: number }).ax = ax; (c as HTMLCanvasElement & { ay: number }).ay = ay; }
  return c as HTMLCanvasElement & { ax: number; ay: number };
}
export function put(g: G, c: HTMLCanvasElement & { ax: number; ay: number }, x: number, y: number, s = 1, o: { alpha?: number; rot?: number; flip?: boolean } = {}) {
  g.save(); g.translate(x, y); if (o.rot) g.rotate(o.rot); g.scale(o.flip ? -s : s, s); if (o.alpha !== undefined) g.globalAlpha *= o.alpha;
  g.drawImage(c, -c.ax, -c.ay); g.restore();
}
export const clearSprites = () => cache.clear();

const DURGA = (ink: Ink, hands: Hold[], extra: Partial<Devi> = {}): Devi => ({ ink, skin: '#f0b080', sari: '#c2422a', sari2: '#f7d98a', blouse: '#2f6a5a', hands, crown: 'mukut', moon: false, mood: 'calm', seed: 11, bands: ['lines', 'beads', 'chevron', 'wave', 'diamonds'], ...extra });
const KALI = (ink: Ink, extra: Partial<Devi> = {}): Devi => ({ ink: { ...ink, dark: '#05050f' }, skin: '#22203a', sari: '#14121e', sari2: '#e85a3a', blouse: '#22203a', hands: ['skull', 'noose', 'sword', 'hook'], crown: 'wild', mood: 'fierce', tongue: true, garland: 'skulls', seed: 21, bands: ['lines', 'dots', 'zig'], ...extra });

function deviSprite(key: string, d: Devi) { return sprite(key, 900, 820, 450, 780, (g) => devi(g, d)); }
function lionSprite(ink: Ink, roar = 0) { return sprite(`lion-${ink.paper}-${roar}`, 560, 340, 280, 320, (g) => mount(g, 'lion', ink, 0, 3, { roar })); }
function asuraSprite(key: string, ink: Ink, a: Partial<Parameters<typeof asura>[1]> = {}) { return sprite(key, 520, 720, 260, 690, (g) => asura(g, { ink, ...a })); }

const hit = (inp: Input, x: number, y: number, r: number) => Math.hypot(inp.x - x, inp.y - y) < r;
/** Hit-test where the pointer went down, not where it has moved to since. */
const hitAt = (inp: Input, x: number, y: number, r: number) => Math.hypot(inp.sx - x, inp.sy - y) < r;
const glowAt = (g: G, x: number, y: number, r: number, a = 0.6, col = '255,220,120') => { const gr = g.createRadialGradient(x, y, 2, x, y, r); gr.addColorStop(0, `rgba(${col},${a})`); gr.addColorStop(1, `rgba(${col},0)`); g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r); };
/** A pulsing ring to show where to tap or drag. */
export function cue(g: G, x: number, y: number, t: number, r = 46, col = '#ffffff') { const k = (t * 0.9) % 1; g.save(); g.strokeStyle = col; g.globalAlpha = 1 - k; g.lineWidth = 4; g.setLineDash([8, 8]); g.beginPath(); g.arc(x, y, r + k * 24, 0, TAU); g.stroke(); g.restore(); }

/* ───────── the story machinery ───────── */

export interface Step<S = Record<string, number>> {
  /** The story, as told here. */
  text: string;
  /** What to do. */
  hint: string;
  /** Choices to offer as buttons, if this step is a choice. */
  choices?: string[];
  init: () => S;
  /** Draw a frame and say whether the step is done. */
  frame: (c: Ctx, s: S) => boolean;
}
export interface Battle {
  key: string; title: string; dev: string; source: string; form: string; foe: string;
  ink: Ink;
  bg: (g: G) => void;
  steps: Step<any>[]; // eslint-disable-line @typescript-eslint/no-explicit-any
  summary: string;
}

const bgCache = new Map<string, HTMLCanvasElement>();
export function background(b: Battle) {
  let c = bgCache.get(b.key);
  if (!c) { c = document.createElement('canvas'); c.width = BW; c.height = BH; b.bg(c.getContext('2d')!); bgCache.set(b.key, c); }
  return c;
}

/* ───────── shared grounds ───────── */

function battleGround(g: G, ink: Ink, seed: number, sun = true) {
  paper(g, BW, BH, ink, seed);
  if (sun) { patternedRays(g, 800, 620, 230, 1300, 28, ink, seed + 1); lineSun(g, 800, 620, 230, ink, seed); }
  g.fillStyle = ink.paper2; g.fillRect(0, 620, BW, 280);
  hatch(g, [[0, 620], [BW, 620], [BW, BH], [0, BH]], 'rule', { color: ink.ink, gap: 10, w: 0.8, angle: 0, alpha: 0.55, seed });
  pen(g, [[0, 620], [BW, 620]], ink.dark, 2, rng(seed), 1);
}

/* ═════════ 1. Madhu and Kaitabha ═════════ */

const mk: Battle = {
  key: 'madhu', title: 'Madhu and Kaitabha', dev: 'मधुकैटभवधः', source: 'Devi Mahatmya, chapter 1', form: 'Yoganidra, the sleep of Vishnu — Mahakali', foe: 'two demons born from the wax of Vishnu’s ears',
  summary: 'At the end of an age, with the worlds under water, Brahma calls on the goddess who holds Vishnu in sleep.',
  ink: INKS.teal,
  bg: (g) => {
    const k = INKS.teal; paper(g, BW, BH, { ...k, paper: '#16304a', paper2: '#122840', light: '#2a4a6a' }, 31);
    const R = rng(3); for (let i = 0; i < 160; i++) { g.fillStyle = '#f4e8c8'; g.globalAlpha = 0.2 + R() * 0.6; g.beginPath(); g.arc(R() * BW, R() * 500, R() * 1.8, 0, TAU); g.fill(); } g.globalAlpha = 1;
    for (let i = 0; i < 8; i++) crescent(g, 120 + i * 190, 80 + (i % 2) * 30, 18, 1 + i, '#f4e8c8', i);
    scaleSea(g, 0, 560, BW, BH, { ...k, ink: '#8ac0c0', red: '#f4e8c8', accent: '#cfe8e0' }, undefined, 4);
  },
  steps: [
    {
      text: 'The worlds have dissolved into one ocean. Vishnu lies asleep on the serpent Shesha. From the wax of his ears two demons are born, Madhu and Kaitabha, huge and terrible, and they turn on Brahma, who sits on the lotus that grows from Vishnu’s navel.',
      hint: 'Tap Brahma three times: he sings to the goddess who holds Vishnu in sleep.',
      init: () => ({ taps: 0, flash: 0 }),
      frame: (c, s) => {
        const { g, T, inp } = c;
        put(g, sprite('mk-vishnu', 760, 420, 380, 360, (gg) => sleepingVishnu(gg, mk.ink)), 820, 620, 1.0);
        pen(g, curve([[860, 520], [880, 420], [860, 330]], 6), '#3f8a5a', 5, rng(1), 0.5);
        put(g, sprite('mk-brahma', 420, 380, 210, 340, (gg) => brahma(gg, mk.ink, 0, 1)), 860, 340, 0.75);
        for (const [x, sd] of [[420, 1], [1280, -1]] as [number, number][]) put(g, asuraSprite('mk-demon', mk.ink, { skin: '#3a5a8a', horns: true, seed: 3 }), x + Math.sin(T * 1.4 + sd) * 10, 660, 0.85, { flip: sd < 0 });
        if (inp.pressed && hitAt(inp, 860, 280, 110)) { s.taps++; s.flash = 1; }
        s.flash = Math.max(0, s.flash - c.dt * 1.5);
        const lines = ['त्वं स्वाहा त्वं स्वधा', 'त्वं हि वषट्कारः स्वरात्मिका', 'सुधा त्वमक्षरे नित्ये'];
        for (let i = 0; i < s.taps && i < 3; i++) label(g, lines[i], 860, 110 + i * 46, 32, '#f4e8c8', 'center', true);
        if (s.flash > 0) glowAt(g, 860, 280, 160, s.flash * 0.7);
        if (s.taps < 3) cue(g, 860, 280, T, 70, '#f4e8c8');
        return s.taps >= 3;
      },
    },
    {
      text: 'Praised, the goddess Yoganidra — Vishnu’s own sleep, the great illusion — comes out of his eyes, his mouth, his nostrils, his arms, his heart and his breast, and stands before Brahma. And the Lord of the world wakes.',
      hint: 'Drag the dark sleep up out of Vishnu.',
      init: () => ({ y: 0, grab: 0 }),
      frame: (c, s) => {
        const { g, T, inp } = c;
        const awake = s.y > 0.95 ? 1 : 0;
        put(g, sprite(`mk-vishnu-${awake}`, 760, 420, 380, 360, (gg) => sleepingVishnu(gg, mk.ink, 0, awake)), 820, 620, 1.0);
        put(g, sprite('mk-brahma', 420, 380, 210, 340, (gg) => brahma(gg, mk.ink, 0, 1)), 860, 340, 0.75);
        const sy = lerp(470, 140, s.y);
        if (inp.down && (s.grab || hit(inp, 600, sy, 100))) { s.grab = 1; s.y = clamp((470 - inp.y) / 330); }
        if (!inp.down) s.grab = 0;
        // the sleep, a dark goddess shape made of mist
        g.save(); g.globalAlpha = 0.35 + 0.5 * s.y;
        put(g, deviSprite('mk-yoganidra', KALI(mk.ink, { crown: 'veil', mood: 'calm', tongue: false, garland: 'none', hands: ['abhaya', 'varada', 'sword', 'trident'], sari: '#0e1830', skin: '#2a3a6a' })), 600, sy + 160, 0.42);
        g.restore();
        for (let i = 0; i < 18; i++) { const u = (T * 0.4 + i / 18) % 1; g.globalAlpha = (1 - u) * 0.35 * (1 - s.y); g.fillStyle = '#0e1830'; g.beginPath(); g.arc(lerp(580, 600, u) + Math.sin(i + T) * 20, lerp(470, sy, u), 20 + u * 30, 0, TAU); g.fill(); }
        g.globalAlpha = 1;
        if (s.y < 0.95) cue(g, 600, sy, T, 60, '#f4e8c8');
        else glowAt(g, 580, 470, 180, 0.6);
        return s.y >= 0.95;
      },
    },
    {
      text: 'Vishnu fights them with his bare arms for five thousand years. Then, deluded by the Great Illusion and proud of their strength, the demons say to him: “We are pleased with you. Ask us for a boon.”',
      hint: 'Choose what Vishnu asks for.',
      choices: ['“Give me your strength.”', '“Let Brahma go in peace.”', '“That you be slain by me, here and now.”'],
      init: () => ({ ok: 0, wrong: 0, wt: 0 }),
      frame: (c, s) => {
        const { g, T } = c;
        put(g, sprite('mk-vishnu-1', 760, 420, 380, 360, (gg) => sleepingVishnu(gg, mk.ink, 0, 1)), 820, 620, 1.0);
        for (const [x, sd] of [[520, 1], [1180, -1]] as [number, number][]) put(g, asuraSprite('mk-demon', mk.ink, { skin: '#3a5a8a', horns: true, seed: 3 }), x + Math.sin(T * 3 + sd) * 18, 600, 0.75, { flip: sd < 0 });
        if (c.pick !== undefined) { if (c.pick === 2) s.ok = 1; else { s.wrong = 1; s.wt = 2; } }
        s.wt = Math.max(0, s.wt - c.dt);
        if (s.wrong && s.wt > 0) label(g, 'That is not what the Lord asks. Try again.', 800, 140, 34, '#f4e8c8');
        if (s.ok) label(g, '“We grant it — but kill us where the earth is not covered by water.”', 800, 140, 34, '#f4e8c8');
        return !!s.ok;
      },
    },
    {
      text: 'Everything was water. So the Lord laid them across his own thighs — the only dry ground there was — and with his discus cut off their heads.',
      hint: 'Drag each demon onto Vishnu’s thighs.',
      init: () => ({ a: 0, b: 0, ax: 300, ay: 560, bx: 1300, by: 560, held: -1, cut: 0 }),
      frame: (c, s) => {
        const { g, T, inp } = c;
        put(g, sprite('mk-vishnu-1', 760, 420, 380, 360, (gg) => sleepingVishnu(gg, mk.ink, 0, 1)), 820, 620, 1.0);
        const lap = [880, 470];
        if (inp.pressed) { if (!s.a && hitAt(inp, s.ax, s.ay - 120, 120)) s.held = 0; else if (!s.b && hitAt(inp, s.bx, s.by - 120, 120)) s.held = 1; }
        if (inp.down && s.held === 0) { s.ax = inp.x; s.ay = inp.y + 120; }
        if (inp.down && s.held === 1) { s.bx = inp.x; s.by = inp.y + 120; }
        if (inp.released) { if (s.held === 0 && Math.hypot(s.ax - lap[0], s.ay - 120 - lap[1]) < 160) s.a = 1; if (s.held === 1 && Math.hypot(s.bx - lap[0], s.by - 120 - lap[1]) < 160) s.b = 1; s.held = -1; }
        const draw = (done: number, x: number, y: number, i: number) => { if (done) { put(g, asuraSprite('mk-demon-fall', mk.ink, { skin: '#3a5a8a', horns: true, seed: 3, fall: 1 }), lap[0] - 60 + i * 120, lap[1] + 30, 0.4); } else put(g, asuraSprite('mk-demon', mk.ink, { skin: '#3a5a8a', horns: true, seed: 3 }), x, y, 0.55, { flip: i === 1 }); };
        draw(s.a, s.ax, s.ay, 0); draw(s.b, s.bx, s.by, 1);
        if (!s.a) cue(g, s.ax, s.ay - 160, T); else if (!s.b) cue(g, s.bx, s.by - 160, T);
        if (s.a && s.b) { s.cut += c.dt; const k = clamp(s.cut / 1.2); g.save(); g.translate(lerp(1300, 900, k), lerp(200, 420, k)); g.rotate(T * 10); holdThing(g, 'chakra', mk.ink, rng(1), 1.6, true); g.restore(); if (k >= 1) glowAt(g, 880, 440, 260, 0.6); }
        return s.cut > 1.6;
      },
    },
  ],
};

/* ═════════ 2. Mahishasura ═════════ */

const GODS: [string, string, string][] = [['Brahma', 'ब्रह्मा', '#e8a060'], ['Vishnu', 'विष्णुः', '#3f6fd0'], ['Shiva', 'शिवः', '#bcd0e0'], ['Indra', 'इन्द्रः', '#f2b52a'], ['Agni', 'अग्निः', '#e8502a'], ['Yama', 'यमः', '#3d6b55'], ['Varuna', 'वरुणः', '#2e8a9a'], ['Surya', 'सूर्यः', '#f2a23a']];
const ARMS: [Hold, string][] = [['trident', 'Shiva’s trident'], ['chakra', 'Vishnu’s discus'], ['conch', 'Varuna’s conch'], ['spear', 'Agni’s spear'], ['vajra', 'Indra’s thunderbolt'], ['bow', 'Vayu’s bow'], ['sword', 'the sword of Time'], ['bell', 'Airavata’s bell']];
const FORMS = ['buffalo', 'lion', 'man', 'elephant', 'buffalo'] as const;
const ANSWER: Hold[] = ['noose', 'sword', 'arrow', 'sword', 'trident'];
const ANSWER_TEXT = ['She throws her noose over the buffalo — and he becomes a lion.', 'She cuts off the lion’s head — and a man stands there, sword in hand.', 'She shoots the man full of arrows — and he becomes a great elephant.', 'She cuts off the elephant’s trunk with her sword — and he is the buffalo again, shaking the worlds.', ''];

const mahisha: Battle = {
  key: 'mahisha', title: 'Mahishasura', dev: 'महिषासुरवधः', source: 'Devi Mahatmya, chapters 2–3', form: 'Mahishasuramardini — Durga made of every god’s light', foe: 'the buffalo demon who drove the gods from heaven',
  summary: 'Driven out of heaven, the gods’ anger becomes light, and the light becomes a woman.',
  ink: INKS.ochre,
  bg: (g) => battleGround(g, INKS.ochre, 41),
  steps: [
    {
      text: 'Mahisha, the buffalo demon, has beaten the gods and taken heaven for himself. When Brahma, Vishnu and Shiva hear of it, their faces burn with anger, and from their anger — and from the bodies of all the other gods — a great light streams out.',
      hint: 'Tap each god to send out his light.',
      init: () => ({ lit: 0, k: 0 }),
      frame: (c, s) => {
        const { g, T, inp } = c;
        GODS.forEach(([, d, col], i) => {
          const x = 140 + i * 190, y = 760, on = (s.lit >> i) & 1;
          put(g, deviSprite(`god-${i}`, DURGA(mahisha.ink, ['abhaya', 'varada'], { skin: col, sari: '#f7d98a', sari2: mahisha.ink.red, crown: i === 2 ? 'jata' : 'mukut', mood: 'calm', garland: 'none', seed: 40 + i, blouse: col })), x, y, 0.3);
          label(g, d, x, 800, 22, mahisha.ink.dark, 'center', true);
          if (inp.pressed && hitAt(inp, x, y - 100, 80)) s.lit |= 1 << i;
          if (on) { g.save(); g.globalAlpha = 0.55; g.strokeStyle = '#fff3c0'; g.lineWidth = 10; g.beginPath(); g.moveTo(x, y - 160); g.quadraticCurveTo((x + 800) / 2, 200, 800, 300); g.stroke(); g.restore(); }
          else cue(g, x, y - 100, T + i * 0.2, 50);
        });
        const n = [...Array(8).keys()].filter((i) => (s.lit >> i) & 1).length;
        glowAt(g, 800, 300, 60 + n * 30, 0.4 + n * 0.06);
        if (n === 8) { s.k += c.dt; g.save(); g.globalAlpha = clamp(s.k / 1.5); put(g, deviSprite('mahisha-durga-0', DURGA(mahisha.ink, ['abhaya', 'varada', 'none', 'none', 'none', 'none', 'none', 'none'])), 800, 560, 0.5); g.restore(); }
        return s.k > 1.6;
      },
    },
    {
      text: 'The light becomes a woman, her face from Shiva’s light, her arms from Vishnu’s, her feet from Brahma’s. Then each god gives her a weapon drawn from his own: Shiva his trident, Vishnu his discus, Varuna his conch, Agni a spear, Indra his thunderbolt, Vayu a bow; the mountain Himavat gives her a lion to ride.',
      hint: 'Drag each weapon into her hands.',
      init: () => ({ got: 0, held: -1, hx: 0, hy: 0 }),
      frame: (c, s) => {
        const { g, T, inp } = c;
        const have: Hold[] = ['abhaya', 'varada', ...ARMS.map(([h], i) => ((s.got >> i) & 1 ? h : 'none'))];
        put(g, lionSprite(mahisha.ink), 890, 850, 0.98);
        put(g, deviSprite(`mahisha-durga-${s.got}`, DURGA(mahisha.ink, have)), 800, 760, 0.6);
        ARMS.forEach(([h, name], i) => {
          if ((s.got >> i) & 1) return;
          const tx = i < 4 ? 120 + (i % 2) * 140 : 1340 + (i % 2) * 140, ty = 300 + Math.floor((i % 4) / 2) * 260;
          const held = s.held === i, x = held ? inp.x : tx, y = held ? inp.y : ty;
          g.save(); g.translate(x, y); holdThing(g, h, mahisha.ink, rng(i), 1.0, true); g.restore();
          if (!held) { label(g, name, tx, ty + 90, 20, mahisha.ink.dark); cue(g, tx, ty - 30, T + i * 0.1, 50); }
          if (inp.pressed && hitAt(inp, tx, ty - 30, 70)) s.held = i;
        });
        if (inp.released && s.held >= 0) { if (Math.hypot(inp.x - 800, inp.y - 520) < 280) s.got |= 1 << s.held; s.held = -1; }
        return s.got === 255;
      },
    },
    {
      text: 'She laughs aloud, again and again, and the sky and the earth shake. Mahisha comes at her in a rage. He changes his shape whenever she meets him — and every time she meets the new shape as well.',
      hint: 'He takes a new shape each time. Choose how she meets it.',
      choices: ['Noose', 'Sword', 'Arrows', 'Trident'],
      init: () => ({ form: 0, msg: 0, flash: 0, wrong: 0 }),
      frame: (c, s) => {
        const { g, T } = c;
        const full: Hold[] = ['abhaya', 'varada', 'trident', 'chakra', 'conch', 'spear', 'vajra', 'bow', 'sword', 'bell'];
        put(g, lionSprite(mahisha.ink, 1), 510, 850, 0.98);
        put(g, deviSprite('mahisha-durga-full', DURGA(mahisha.ink, full)), 420, 760, 0.6);
        const f = FORMS[Math.min(4, s.form)], bob = Math.sin(T * 3) * 6;
        g.save(); g.translate(1150, 840 + bob);
        if (f === 'buffalo') put(g, sprite('buf', 820, 520, 420, 470, (gg) => buffalo(gg, mahisha.ink, 0, { charge: 1 })), 0, 0, 0.8);
        else if (f === 'lion') put(g, lionSprite(mahisha.ink, 1), 0, 0, 0.8, { flip: true });
        else if (f === 'man') put(g, asuraSprite('mahisha-man', mahisha.ink, { horns: true, skin: '#2e2a34', seed: 5 }), 0, 0, 0.75);
        else put(g, sprite('eleph', 760, 420, 380, 400, (gg) => elephantForm(gg, mahisha.ink, 0)), 0, 0, 0.8);
        g.restore();
        if (c.pick !== undefined && s.form < 4) {
          const want = ANSWER[s.form], chosen = (['noose', 'sword', 'arrow', 'trident'] as Hold[])[c.pick];
          if (chosen === want) { s.msg = s.form + 1; s.form++; s.flash = 1; s.wrong = 0; } else { s.wrong = 2; }
        }
        s.flash = Math.max(0, s.flash - c.dt * 1.4); s.wrong = Math.max(0, s.wrong - c.dt);
        if (s.flash > 0) glowAt(g, 1150, 640, 300, s.flash * 0.7, '255,250,220');
        if (s.msg) label(g, ANSWER_TEXT[s.msg - 1], 800, 120, 32, mahisha.ink.dark);
        if (s.wrong > 0) label(g, 'He bellows and shakes it off. Try another.', 800, 170, 30, mahisha.ink.red);
        return s.form >= 4;
      },
    },
    {
      text: 'She drinks from her cup and laughs, red-eyed. Then she leaps onto the buffalo, presses its neck down with her foot and strikes with her spear. Half of him struggles out of the buffalo’s mouth — and with her great sword she cuts off his head. The gods sing her praise and flowers fall from the sky.',
      hint: 'Tap to leap, then tap again to strike.',
      init: () => ({ leap: 0, strike: 0, k: 0 }),
      frame: (c, s) => {
        const { g, T, inp } = c;
        if (inp.pressed) { if (!s.leap) s.leap = 1; else if (!s.strike && s.k > 0.9) s.strike = 1; }
        if (s.leap) s.k = Math.min(1, s.k + c.dt * 1.2);
        const x = lerp(420, 1040, ease(s.k)), y = lerp(760, 560, ease(s.k)) - Math.sin(s.k * Math.PI) * 180;
        put(g, sprite('buf-down', 820, 520, 420, 470, (gg) => buffalo(gg, mahisha.ink, 0, { charge: 0 })), 1150, 860, 0.8, { rot: s.strike ? 0.08 : 0 });
        if (!s.leap) put(g, lionSprite(mahisha.ink, 1), 510, 850, 0.98);
        put(g, deviSprite(`mahisha-durga-strike-${s.strike}`, DURGA(mahisha.ink, ['abhaya', 'trident', 'sword', 'chakra', 'conch', 'spear', 'vajra', 'bow', 'bell', 'none'], { strike: s.strike ? { i: 1, a: 0.3 } : undefined, mood: 'fierce' })), x, y, 0.6);
        if (s.strike) {
          put(g, asuraSprite('mahisha-fall', mahisha.ink, { horns: true, skin: '#2e2a34', seed: 5, fall: 1 }), 1300, 760, 0.55);
          const R = rng(5); for (let i = 0; i < 30; i++) { const ph = (T * 0.2 + R()) % 1; g.fillStyle = [mahisha.ink.red, '#f2a23a', '#f7d98a'][i % 3]; g.beginPath(); g.ellipse(R() * BW, ph * BH, 6, 3, R() * 3, 0, TAU); g.fill(); }
        }
        if (!s.leap) cue(g, 420, 520, T, 80); else if (!s.strike && s.k > 0.9) cue(g, 1150, 640, T, 90);
        return s.strike === 1;
      },
    },
  ],
};

/* ═════════ 3. Dhumralochana ═════════ */

const dhumra: Battle = {
  key: 'dhumra', title: 'Dhumralochana', dev: 'धूम्रलोचनवधः', source: 'Devi Mahatmya, chapter 6', form: 'Ambika, the beautiful one on the Himalaya', foe: '“Smoke-eyes”, sent to drag her by the hair',
  summary: 'Shumbha wants her for his wife. She answers with one sound.',
  ink: INKS.ballpoint,
  bg: (g) => {
    const k = INKS.ballpoint; paper(g, BW, BH, k, 51);
    hatch(g, [[0, 0], [BW, 0], [BW, BH], [0, BH]], 'cross', { color: k.ink, gap: 6, w: 0.5, alpha: 0.4, seed: 2 });
    for (let i = 0; i < 6; i++) { const cx = 100 + i * 300, h = 260 + (i % 3) * 80; shape(g, [[cx - 260, 640], [cx, 640 - h], [cx + 260, 640]], { fill: k.light, hatch: 'lines', h: { color: k.ink, gap: 3.6, w: 0.7, angle: -0.8 }, line: k.dark, seed: i }); shape(g, [[cx - 60, 640 - h * 0.8], [cx, 640 - h], [cx + 60, 640 - h * 0.8]], { fill: '#fff', seed: i }); }
    g.fillStyle = k.paper2; g.fillRect(0, 640, BW, 260); hatch(g, [[0, 640], [BW, 640], [BW, BH], [0, BH]], 'lines', { color: k.red, gap: 6, w: 0.7, angle: 0, seed: 3 });
  },
  steps: [
    {
      text: 'The demon kings Shumbha and Nishumbha hear of a woman of unearthly beauty on the Himalaya and send a messenger: come and be our queen. She answers that she has vowed to marry only one who defeats her in battle. Furious, Shumbha sends his general Dhumralochana — “Smoke-eyes” — with sixty thousand: “Drag her here by the hair.”',
      hint: 'Press and hold the sound हुं. Let go to loose it.',
      init: () => ({ charge: 0, fired: 0, k: 0 }),
      frame: (c, s) => {
        const { g, T, inp } = c;
        put(g, lionSprite(dhumra.ink), 490, 850, 0.98);
        put(g, deviSprite('dhumra-ambika', DURGA(dhumra.ink, ['abhaya', 'varada', 'trident', 'chakra', 'sword', 'conch', 'bow', 'bell'], { sari: '#2234a8', sari2: '#f6d2b8', blouse: '#c8442a', mood: s.charge > 0.5 ? 'fierce' : 'calm' })), 400, 760, 0.6);
        const bx = 400, by = 300;
        if (!s.fired) {
          if (inp.down && hit(inp, bx, by + 10, 140)) s.charge = Math.min(1, s.charge + c.dt * 0.7);
          else if (s.charge > 0.25 && inp.released) s.fired = 1;
          else if (!inp.down) s.charge = Math.max(0, s.charge - c.dt * 0.3);
          g.save(); g.fillStyle = 'rgba(34,52,168,0.85)'; g.beginPath(); g.arc(bx, by, 70 + s.charge * 30, 0, TAU); g.fill(); g.restore();
          for (let i = 0; i < 4; i++) { g.strokeStyle = '#f6d2b8'; g.globalAlpha = s.charge; g.lineWidth = 2; g.beginPath(); g.arc(bx, by, 80 + i * 20 + s.charge * 30 + Math.sin(T * 10 + i) * 3, 0, TAU); g.stroke(); } g.globalAlpha = 1;
          label(g, 'हुं', bx, by + 4, 80, '#fff', 'center', true);
          cue(g, bx, by, T, 100, '#fff');
        } else s.k += c.dt;
        const gone = clamp(s.k / 1.4);
        if (gone < 1) put(g, asuraSprite('dhumra', dhumra.ink, { skin: '#6a6a7a', horns: false, seed: 7, tint: '#2a2a3a' }), 1200 - (1 - s.charge) * 0, 760, 0.7, { alpha: 1 - gone });
        for (let i = 0; i < 12; i++) { const x = 1300 + (i % 4) * 80, y = 680 + Math.floor(i / 4) * 60; put(g, asuraSprite('dhumra-soldier', dhumra.ink, { skin: '#7a6a8a', crown: false, seed: 8, hold: ['spear', 'shield'] }), x, y, 0.28, { alpha: 1 - gone * 0.6 }); }
        if (s.fired) { g.save(); g.strokeStyle = '#2234a8'; for (let i = 0; i < 6; i++) { const ph = clamp(s.k * 1.5 - i * 0.08); g.globalAlpha = 1 - ph; g.lineWidth = 6; g.beginPath(); g.arc(400, 300, 60 + ph * 900, -0.4, 0.4); g.stroke(); } g.restore(); ashes(g, 1200, 520, gone, T, dhumra.ink); }
        if (gone >= 1) label(g, 'With that one sound she burns him to ash.', 800, 120, 34, dhumra.ink.dark);
        return s.k > 2;
      },
    },
  ],
};

/* ═════════ 4. Chanda and Munda ═════════ */

const chanda: Battle = {
  key: 'chanda', title: 'Chanda and Munda', dev: 'चण्डमुण्डवधः', source: 'Devi Mahatmya, chapter 7', form: 'Kali, who springs from her brow — Chamunda', foe: 'Shumbha’s two generals, with their army',
  summary: 'Her face grows dark with anger, and from her forehead Kali springs out.',
  ink: INKS.rust,
  bg: (g) => battleGround(g, INKS.rust, 61, true),
  steps: [
    {
      text: 'Chanda and Munda come up the mountain with their army, bows drawn, swords out. When she sees them, the goddess grows angry and her face turns dark as ink — and from the frown on her forehead springs Kali: skin black, a garland of skulls, a tiger-skin, a gaping mouth and lolling tongue, sword and noose in hand.',
      hint: 'Drag down across her brow to darken it.',
      init: () => ({ frown: 0, k: 0 }),
      frame: (c, s) => {
        const { g, T, inp } = c;
        put(g, lionSprite(chanda.ink), 610, 860, 0.98);
        put(g, deviSprite(`chanda-ambika-${s.frown > 0.5 ? 1 : 0}`, DURGA(chanda.ink, ['abhaya', 'varada', 'trident', 'chakra', 'sword', 'conch'], { mood: s.frown > 0.5 ? 'fierce' : 'calm', sari: '#f3a24a', sari2: '#7a1a14', blouse: '#2a5a5a' })), 520, 770, 0.6);
        const browX = 520, browY = 770 - 0.6 * 520;
        if (inp.down && Math.abs(inp.x - browX) < 120 && inp.y > browY - 80 && inp.y < browY + 120 && s.frown < 1) s.frown = Math.min(1, s.frown + c.dt * 0.9);
        if (s.frown < 1) { cue(g, browX, browY, T, 40); g.save(); g.globalAlpha = s.frown * 0.6; g.fillStyle = '#1a0a0a'; g.beginPath(); g.arc(browX, browY + 20, 60, 0, TAU); g.fill(); g.restore(); }
        else s.k += c.dt;
        const k = clamp(s.k / 1.6);
        if (s.frown >= 1) { const x = lerp(browX, 980, ease(k)), y = lerp(browY + 60, 790, ease(k)); g.save(); g.globalAlpha = Math.min(1, k * 2); put(g, deviSprite('kali', KALI(chanda.ink)), x, y, lerp(0.1, 0.62, k)); g.restore(); glowAt(g, browX, browY, 120 * (1 - k), 0.8, '255,120,80'); }
        for (let i = 0; i < 2; i++) put(g, asuraSprite(`chanda-${i}`, chanda.ink, { skin: i ? '#5a4a3a' : '#3a4a5a', horns: !!i, seed: 60 + i }), 1300 + i * 160, 780, 0.6);
        return k >= 1;
      },
    },
    {
      text: 'Kali falls on the army. She seizes elephants with their riders and bells and throws them into her mouth; she grinds chariots and horses in her teeth. Chanda covers her with a rain of arrows and hurls thousands of discs at her — and they vanish into her mouth like suns sinking into a cloud.',
      hint: 'Tap the flying discs before they reach her.',
      init: () => ({ discs: [] as { x: number; y: number; vx: number; vy: number; eaten: number }[], next: 0, eaten: 0 }),
      frame: (c, s) => {
        const { g, T, inp, dt } = c;
        put(g, deviSprite('kali', KALI(chanda.ink)), 520, 790, 0.62);
        put(g, asuraSprite('chanda-0', chanda.ink, { skin: '#3a4a5a', seed: 60 }), 1340, 780, 0.6);
        s.next -= dt;
        if (s.next <= 0 && s.eaten < 8) { s.discs.push({ x: 1300, y: 420 + Math.random() * 200, vx: -260 - Math.random() * 120, vy: (Math.random() - 0.5) * 80, eaten: 0 }); s.next = 0.9; }
        for (const d of s.discs) {
          if (d.eaten) continue;
          d.x += d.vx * dt; d.y += d.vy * dt;
          if (inp.pressed && hitAt(inp, d.x, d.y, 60)) { d.eaten = 1; s.eaten++; }
          if (d.x < 620) { d.eaten = 1; s.eaten++; }
          g.save(); g.translate(d.x, d.y); g.rotate(T * 8); holdThing(g, 'chakra', chanda.ink, rng(1), 1.1, true); g.restore();
        }
        label(g, `${s.eaten} / 8`, 1460, 120, 34, chanda.ink.light);
        return s.eaten >= 8;
      },
    },
    {
      text: 'Then Kali seizes Chanda by the hair and cuts off his head, and Munda’s too, and brings the two heads to the goddess. “Because you have brought me Chanda and Munda,” the goddess says, “you will be known in the world as Chamunda.”',
      hint: 'Tap Chanda, then Munda.',
      init: () => ({ a: 0, b: 0 }),
      frame: (c, s) => {
        const { g, T, inp } = c;
        put(g, deviSprite('kali', KALI(chanda.ink)), 760, 790, 0.62);
        put(g, lionSprite(chanda.ink), 370, 860, 0.78);
        put(g, deviSprite('chanda-ambika-1', DURGA(chanda.ink, ['abhaya', 'varada', 'trident', 'chakra', 'sword', 'conch'], { mood: 'fierce', sari: '#f3a24a', sari2: '#7a1a14', blouse: '#2a5a5a' })), 280, 780, 0.48);
        for (let i = 0; i < 2; i++) {
          const x = 1200 + i * 200, done = i ? s.b : s.a;
          if (inp.pressed && hitAt(inp, x, 560, 120) && (i === 0 || s.a)) { if (i) s.b = 1; else s.a = 1; }
          put(g, asuraSprite(`chanda-${i}-${done}`, chanda.ink, { skin: i ? '#5a4a3a' : '#3a4a5a', horns: !!i, seed: 60 + i, fall: done }), x, 780, 0.6);
          if (!done && (i === 0 || s.a)) cue(g, x, 560, T, 80);
        }
        if (s.a && s.b) label(g, 'चामुण्डा', 800, 140, 64, chanda.ink.light, 'center', true);
        return !!(s.a && s.b);
      },
    },
  ],
};

/* ═════════ 5. Raktabija ═════════ */

const MATRIKAS: [string, string, string][] = [['Brahmani', 'ब्राह्मी', 'swan'], ['Maheshvari', 'माहेश्वरी', 'bull'], ['Kaumari', 'कौमारी', 'peacock'], ['Vaishnavi', 'वैष्णवी', 'eagle'], ['Varahi', 'वाराही', 'boar'], ['Narasimhi', 'नारसिंही', 'lion'], ['Aindri', 'ऐन्द्री', 'elephant']];

const rakta: Battle = {
  key: 'rakta', title: 'Raktabija', dev: 'रक्तबीजवधः', source: 'Devi Mahatmya, chapter 8', form: 'Chandika with Chamunda and the Mothers', foe: 'the demon whose every drop of blood becomes another of him',
  summary: 'Every drop of his blood that touches the ground stands up as another Raktabija.',
  ink: INKS.night,
  bg: (g) => {
    const k = INKS.night; paper(g, BW, BH, k, 71);
    hatch(g, [[0, 0], [BW, 0], [BW, BH], [0, BH]], 'cross', { color: '#2a2e6a', gap: 6, w: 0.6, seed: 3 });
    for (let i = 0; i < 12; i++) crescent(g, 70 + i * 135, 70 + Math.sin(i) * 20, 20, i * 0.5, '#fbf2e2', i);
    g.fillStyle = '#2a1a2a'; g.fillRect(0, 700, BW, 200); hatch(g, [[0, 700], [BW, 700], [BW, BH], [0, BH]], 'wave', { color: '#7a2a2a', gap: 10, w: 1, seed: 4 });
  },
  steps: [
    {
      text: 'As the battle grows, the Mothers come to fight beside the goddess, each the power of a god in that god’s form and on that god’s mount: Brahmani on a swan, Maheshvari on a bull, Kaumari on a peacock, Vaishnavi on Garuda, Varahi with a boar’s face, Narasimhi a lioness, Aindri on an elephant.',
      hint: 'Tap each Mother to bring her into the field.',
      init: () => ({ on: 0 }),
      frame: (c, s) => {
        const { g, T, inp } = c;
        put(g, lionSprite(rakta.ink), 890, 870, 0.91);
        put(g, deviSprite('rakta-chandika', DURGA({ ...rakta.ink, dark: '#0b0c24' }, ['abhaya', 'varada', 'trident', 'sword', 'chakra', 'conch'], { sari: '#c8442a', mood: 'fierce' })), 800, 780, 0.55);
        MATRIKAS.forEach(([, d, m], i) => {
          const [x, y] = ([[150, 560], [330, 360], [560, 280], [1040, 280], [1270, 360], [1450, 560], [800, 200]] as Pt[])[i], on = (s.on >> i) & 1;
          if (inp.pressed && hitAt(inp, x, y - 80, 80)) s.on |= 1 << i;
          g.save(); g.globalAlpha = on ? 1 : 0.35;
          g.save(); g.translate(x, y + 20); matrikaMount(g, m, rakta.ink); g.restore();
          put(g, deviSprite(`matrika-${i}`, DURGA({ ...rakta.ink, dark: '#0b0c24' }, ['abhaya', (['book', 'trident', 'spear', 'chakra', 'mace', 'sword', 'vajra'] as Hold[])[i]], { sari: ['#f4ead2', '#bcd0e0', '#d89a2a', '#f2b52a', '#5a4a5a', '#e8902c', '#c8442a'][i], garland: 'none', seed: 70 + i })), x, y, 0.22);
          label(g, d, x, y + 40, 20, '#f2e2b8', 'center', true);
          g.restore();
          if (!on) cue(g, x, y - 80, T + i * 0.1, 50, '#f2e2b8');
        });
        return s.on === 127;
      },
    },
    {
      text: 'Then Raktabija strides into the field. Whenever a drop of his blood falls to the earth, another demon of his size and strength rises from it. The goddess tells Chamunda: “Open your mouth wide, and drink every drop before it touches the ground.”',
      hint: 'Tap Raktabija to strike. Drag Chamunda below to catch the drops.',
      init: () => ({ hits: 0, drops: [] as { x: number; y: number; vx: number; vy: number; dead: number }[], clones: [] as { x: number; life: number }[], kx: 800, caught: 0 }),
      frame: (c, s) => {
        const { g, T, inp, dt } = c;
        const rx = 1150;
        // the demon and his doubles
        s.clones.forEach((cl: { x: number; life: number }) => { cl.life -= dt * (s.hits >= 9 ? 1.5 : 0.08); });
        s.clones = s.clones.filter((cl: { life: number }) => cl.life > 0);
        s.clones.forEach((cl: { x: number; life: number }, i: number) => put(g, asuraSprite('rakta-clone', rakta.ink, { skin: '#8a2a2a', horns: true, seed: 81 + (i % 2) }), cl.x, 700, 0.42, { alpha: Math.min(1, cl.life) }));
        if (s.hits < 9) put(g, asuraSprite('rakta', rakta.ink, { skin: '#a8302a', horns: true, seed: 81 }), rx + Math.sin(T * 2) * 10, 700, 0.62);
        else put(g, asuraSprite('rakta-fall', rakta.ink, { skin: '#a8302a', horns: true, seed: 81, fall: 1 }), rx, 700, 0.62);
        // the goddess strikes from the left
        put(g, lionSprite(rakta.ink), 450, 870, 0.81);
        put(g, deviSprite('rakta-chandika', DURGA({ ...rakta.ink, dark: '#0b0c24' }, ['abhaya', 'varada', 'trident', 'sword', 'chakra', 'conch'], { sari: '#c8442a', mood: 'fierce' })), 360, 780, 0.5);
        if (inp.pressed && hitAt(inp, rx, 520, 140) && s.hits < 9) {
          s.hits++;
          for (let i = 0; i < 4; i++) s.drops.push({ x: rx + (Math.random() - 0.5) * 60, y: 480, vx: (Math.random() - 0.5) * 520, vy: -200 - Math.random() * 200, dead: 0 });
          g.save(); g.strokeStyle = '#fff'; g.lineWidth = 6; g.beginPath(); g.moveTo(rx - 120, 420); g.lineTo(rx + 80, 560); g.stroke(); g.restore();
        }
        // Chamunda, mouth open, follows a drag along the ground
        if (inp.down && inp.y > 600) s.kx = clamp(inp.x, 200, 1500);
        const kx = s.kx, ky = 740;
        put(g, deviSprite('kali-catch', KALI(rakta.ink, { hands: ['skull', 'noose', 'sword', 'hook'] })), kx, ky + 160, 0.45);
        const mouthY = ky + 160 - 0.45 * 466, catchR = 120;
        for (const d of s.drops) {
          if (d.dead) continue;
          d.vy += 600 * dt; d.x += d.vx * dt; d.y += d.vy * dt;
          if (Math.hypot(d.x - kx, d.y - mouthY) < catchR && d.vy > 0) { d.dead = 1; s.caught++; continue; }
          if (d.y > 720) { d.dead = 1; s.clones.push({ x: d.x, life: 2.5 }); continue; }
          g.fillStyle = '#d0202a'; g.beginPath(); g.ellipse(d.x, d.y, 7, 10, 0, 0, TAU); g.fill();
        }
        s.drops = s.drops.filter((d: { dead: number }) => !d.dead);
        if (s.hits < 9) cue(g, rx, 520, T, 90, '#f2e2b8');
        label(g, `strikes ${s.hits}/9 · drops caught ${s.caught} · doubles ${s.clones.length}`, 800, 80, 28, '#f2e2b8');
        return s.hits >= 9 && s.drops.length === 0 && s.clones.length === 0;
      },
    },
  ],
};

/* ═════════ 6. Shumbha and Nishumbha ═════════ */

const shumbha: Battle = {
  key: 'shumbha', title: 'Shumbha and Nishumbha', dev: 'शुम्भनिशुम्भवधः', source: 'Devi Mahatmya, chapters 9–10', form: 'the One Goddess, who takes back every power into herself', foe: 'the demon kings who wanted her for a queen',
  summary: '“I am alone here in the world. Who else is there besides me?”',
  ink: INKS.crayon,
  bg: (g) => {
    const k = INKS.crayon; paper(g, BW, BH, k, 91);
    const R = rng(4);
    for (let i = 0; i < 18; i++) { const x = (i % 6) * 280 + 140, y = Math.floor(i / 6) * 300 + 150; g.save(); g.translate(x, y); g.rotate((R() - 0.5) * 0.1); g.fillStyle = k.light; g.fillRect(-130, -130, 260, 260); g.strokeStyle = [k.red, k.ink, k.ink2][i % 3]; g.lineWidth = 2; for (let y2 = -110; y2 < 120; y2 += 18) { g.beginPath(); for (let x2 = -120; x2 < 120; x2 += 4) g.lineTo(x2, y2 + Math.sin(x2 * 0.12 + i) * 5); g.stroke(); } g.restore(); }
  },
  steps: [
    {
      text: 'Nishumbha falls first, struck by her trident. Then Shumbha, mad with grief and rage, mocks her: “You are proud of strength that is not your own. You fight leaning on others.” And the goddess answers: “I am alone here in the world. Who else is there besides me? See, wicked one — these are only my own powers, going back into me.”',
      hint: 'Drag each of the Mothers into the goddess.',
      init: () => ({ took: 0, held: -1 }),
      frame: (c, s) => {
        const { g, T, inp } = c;
        put(g, lionSprite(shumbha.ink), 890, 870, 0.94);
        put(g, deviSprite('shumbha-devi', DURGA(shumbha.ink, ['abhaya', 'varada', 'trident', 'sword', 'chakra', 'conch', 'bow', 'bell'], { sari: shumbha.ink.red })), 800, 780, 0.58);
        MATRIKAS.forEach(([, d, m], i) => {
          if ((s.took >> i) & 1) return;
          const a = Math.PI + (i / 6) * Math.PI, hx = 800 + Math.cos(a) * 560, hy = 520 + Math.sin(a) * 380;
          const held = s.held === i, x = held ? inp.x : hx, y = held ? inp.y + 80 : hy;
          g.save(); g.translate(x, y + 20); matrikaMount(g, m, shumbha.ink); g.restore();
          put(g, deviSprite(`matrika-c-${i}`, DURGA(shumbha.ink, ['abhaya', 'none'], { sari: ['#f4ead2', '#bcd0e0', '#d89a2a', '#f2b52a', '#5a4a5a', '#e8902c', '#c8442a'][i], garland: 'none', seed: 70 + i })), x, y, 0.2);
          if (!held) { label(g, d, hx, hy + 40, 20, shumbha.ink.dark, 'center', true); cue(g, hx, hy - 60, T + i * 0.1, 46, shumbha.ink.ink); }
          if (inp.pressed && hitAt(inp, hx, hy - 60, 70)) s.held = i;
        });
        if (inp.released && s.held >= 0) { if (Math.hypot(inp.x - 800, inp.y - 520) < 240) s.took |= 1 << s.held; s.held = -1; }
        put(g, asuraSprite('shumbha', shumbha.ink, { skin: '#4a3a6a', seed: 95, tint: '#2f4fb4' }), 1420, 800, 0.55);
        if (s.took === 127) label(g, 'एकैवाहं जगत्यत्र द्वितीया का ममापरा', 800, 110, 40, shumbha.ink.red, 'center', true);
        return s.took === 127;
      },
    },
    {
      text: 'Alone, they fight with every weapon, and then hand to hand. Shumbha seizes her and flies up into the sky; she fights him there too, without anything to stand on. At last she whirls him round and hurls him to the earth, and as he rushes at her again she pierces his heart with her trident. The rivers run clear again, the winds blow gently, and the gods sing.',
      hint: 'Drag her up after him into the sky; then flick down to throw him.',
      init: () => ({ up: 0, thrown: 0, k: 0, grab: 0 }),
      frame: (c, s) => {
        const { g, T, inp } = c;
        if (inp.down && !s.thrown) { s.grab = 1; s.up = clamp((700 - inp.y) / 500); }
        if (inp.released && s.grab && s.up > 0.7) s.thrown = 1;
        if (!inp.down) s.grab = 0;
        if (s.thrown) s.k += c.dt;
        const y = lerp(780, 380, s.up);
        put(g, deviSprite(`shumbha-devi-${s.thrown}`, DURGA(shumbha.ink, ['abhaya', 'trident', 'sword', 'chakra', 'conch', 'bow', 'bell', 'none'], { sari: shumbha.ink.red, mood: 'fierce', strike: s.thrown ? { i: 1, a: 0.4 } : undefined })), 700, y, 0.55);
        const fk = clamp(s.k / 1.2);
        const sx = 1050, sy = s.thrown ? lerp(y - 100, 800, ease(fk)) : y - 160 + Math.sin(T * 3) * 20;
        put(g, asuraSprite(`shumbha-${fk >= 1 ? 1 : 0}`, shumbha.ink, { skin: '#4a3a6a', seed: 95, tint: '#2f4fb4', fall: fk >= 1 ? 1 : 0 }), sx, sy, 0.55, { rot: s.thrown ? fk * 2 : 0 });
        if (!s.thrown) cue(g, 700, y - 300, T, 70, shumbha.ink.ink);
        if (fk >= 1) { const R = rng(9); for (let i = 0; i < 40; i++) { const ph = (T * 0.2 + R()) % 1; g.fillStyle = [shumbha.ink.red, shumbha.ink.accent, '#f6b6c8'][i % 3]; g.beginPath(); g.ellipse(R() * BW, ph * BH, 7, 3.5, R() * 3, 0, TAU); g.fill(); } label(g, 'जय जय हे महिषासुरमर्दिनि', 800, 110, 40, shumbha.ink.red, 'center', true); }
        return s.k > 2.5;
      },
    },
  ],
};

export const BATTLES: Battle[] = [mk, mahisha, dhumra, chanda, rakta, shumbha];
export { out, blob, arcPts, crescent };
export type { Pt };
