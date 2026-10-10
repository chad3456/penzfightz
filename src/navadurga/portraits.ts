/**
 * The nine portraits of the Navadurga, one for each night of Navaratri,
 * each drawn in its own manner of pen, ballpoint, crayon or chalk. A
 * portrait is painted once into a 1000 × 1250 canvas and kept; a light layer
 * of motion (a lamp's flicker, the bell's sound, sparks) is drawn over it
 * live.
 */
import { type G, type Pt, type Ink, INKS, rng, lerp, TAU, paper, pen, shape, hatch, arcPts, blob, curve, patternedRays, lineSun, scaleSea, fan, crescent, crayon, scrap, roof, label, toPath } from './ink';
import { devi, mount, holdThing, buffalo, type Devi, type Mount } from './figures';

export const PWID = 1000, PHEI = 1250;

export interface Portrait {
  key: string;
  night: number;
  dev: string;
  name: string;
  /** What the name means. */
  gloss: string;
  manner: string;
  ink: Ink;
  holds: string;
  rides: string;
  mantra: string;
  story: string[];
  paint: (g: G) => void;
  live?: (g: G, t: number) => void;
}

/* ───────── shared pieces ───────── */

function mountains(g: G, y: number, ink: Ink, seed: number, snow = true) {
  const R = rng(seed);
  for (let i = 0; i < 7; i++) {
    const cx = -60 + i * 190 + R() * 60, h = 160 + R() * 160, w = 190 + R() * 120;
    const pts: Pt[] = [[cx - w, y], [cx - w * 0.3, y - h * 0.7], [cx, y - h], [cx + w * 0.35, y - h * 0.6], [cx + w, y]];
    shape(g, pts, { fill: ink.ink2, hatch: 'lines', h: { color: ink.dark, gap: 3.6, w: 0.8, angle: -0.9 + R() * 0.3, seed: i }, line: ink.dark, seed: i });
    if (snow) shape(g, [[cx - w * 0.22, y - h * 0.78], [cx, y - h], [cx + w * 0.2, y - h * 0.8], [cx + w * 0.05, y - h * 0.72], [cx - w * 0.08, y - h * 0.8]], { fill: ink.light, hatch: 'dots', h: { color: ink.ink2, gap: 8, w: 0.8 }, seed: i });
  }
}

/** The quilted band of moons along the foot of a picture: nine nights, waxing. */
function moonQuilt(g: G, y: number, h: number, ink: Ink, bg: string, dark: string, seed = 2) {
  g.fillStyle = dark; g.fillRect(0, y, PWID, h);
  const n = 5, cw = PWID / n;
  for (let i = 0; i < n * 2; i++) {
    const col = i % n, row = Math.floor(i / n), x = col * cw, yy = y + row * (h / 2);
    const cell: Pt[] = [[x + 5, yy + 5], [x + cw - 5, yy + 5], [x + cw - 5, yy + h / 2 - 5], [x + 5, yy + h / 2 - 5]];
    shape(g, cell, { fill: bg, hatch: 'cross', h: { color: dark, gap: 4, w: 0.7, seed: seed + i, angle: 0.6 + i }, line: ink.dark, seed: i });
    const k = i;
    if (k < 9) { const r = h * 0.17; g.save(); g.globalAlpha = 0.35; g.fillStyle = '#f2d8c0'; g.beginPath(); g.arc(x + cw / 2, yy + h / 4, r, 0, TAU); g.fill(); g.restore(); crescent(g, x + cw / 2, yy + h / 4, r, Math.PI * 0.5 - (k / 8) * Math.PI * 0.9, '#fbf2e2', k); }
  }
}

/** Place the goddess: standing at (x, y) at scale s, or riding a mount whose feet are at y. */
function placeDevi(g: G, d: Devi, x: number, y: number, s: number, ride?: { m: Mount; mx: number; ms: number; flip?: boolean; roar?: number }) {
  if (ride) {
    g.save(); g.translate(ride.mx, y); g.scale(ride.flip ? -ride.ms : ride.ms, ride.ms);
    const seat = mount(g, ride.m, d.ink, d.t ?? 0, 3, { roar: ride.roar });
    g.restore();
    const sx = ride.mx + (ride.flip ? -seat[0] : seat[0]) * ride.ms, sy = y + seat[1] * ride.ms;
    g.save(); g.translate(sx, sy + 110 * s); g.scale(s, s); devi(g, { ...d, seat: 'ride' }); g.restore();
  } else { g.save(); g.translate(x, y); g.scale(s, s); devi(g, d); g.restore(); }
}

/* ───────── the nine ───────── */

const SKIN = '#f0b080';

export const PORTRAITS: Portrait[] = [
  {
    key: 'shailaputri', night: 1, dev: 'शैलपुत्री', name: 'Shailaputri', gloss: 'daughter of the mountain', manner: 'pen and ink on ochre, a sunrise of patterned rays',
    ink: INKS.ochre, holds: 'a trident and a lotus; a crescent moon on her brow', rides: 'Nandi, the white bull', mantra: 'ॐ देवी शैलपुत्र्यै नमः',
    story: [
      'The first night belongs to the daughter of Himavan, king of the mountains. In her life before this one she was Sati, daughter of Daksha, who gave up her body in the fire of her father’s sacrifice when he insulted her husband, Shiva.',
      'She was born again to the mountain, grew up as Parvati, and came back to Shiva. She is the goddess at the beginning — rooted, steady as rock — and her festival begins with the sowing of barley and the setting up of the pot.',
    ],
    paint: (g) => {
      const k = INKS.ochre; paper(g, PWID, PHEI, k, 11);
      patternedRays(g, 500, 760, 260, 1200, 24, k, 21);
      lineSun(g, 500, 760, 260, k, 4);
      mountains(g, 760, k, 3);
      scaleSea(g, 0, 760, PWID, 960, k, { cx: 500, w: 240 }, 5);
      roof(g, -30, 720, 300, 240, k, 7, 1);
      g.save(); g.translate(720, 960); g.scale(0.62, 0.62); mount(g, 'bull', k, 0, 5); g.restore();
      placeDevi(g, { ink: k, skin: SKIN, sari: '#c2422a', sari2: '#f7d98a', blouse: '#3f6a5a', hands: ['trident', 'lotus'], moon: true, crown: 'mukut', seed: 1, bands: ['lines', 'dots', 'chevron', 'wave', 'beads'] }, 470, 960, 1.05);
      moonQuilt(g, 990, 260, k, '#8a3424', '#5a1a14', 3);
    },
  },
  {
    key: 'brahmacharini', night: 2, dev: 'ब्रह्मचारिणी', name: 'Brahmacharini', gloss: 'she who walks the path of austerity', manner: 'blue and red ballpoint, a sky of fans',
    ink: INKS.ballpoint, holds: 'a rosary of beads and a water-pot', rides: 'nothing — she walks barefoot', mantra: 'ॐ देवी ब्रह्मचारिण्यै नमः',
    story: [
      'To win Shiva, Parvati went into the forest and practised austerity for years: first living on fruit and roots, then on fallen leaves, then on nothing at all — so the gods named her Aparna, she who would not take even a leaf.',
      'She is drawn walking, barefoot and in white, a rosary in one hand and a water-pot in the other: the will that keeps going when nothing else is left.',
    ],
    paint: (g) => {
      const k = INKS.ballpoint; paper(g, PWID, PHEI, k, 12);
      hatch(g, [[0, 0], [PWID, 0], [PWID, PHEI], [0, PHEI]], 'cross', { color: k.ink, gap: 5, w: 0.6, alpha: 0.55, seed: 2 });
      // a moon, crosshatched, and rings of fans round the light behind her
      shape(g, arcPts(170, 190, 110, 110, 0, TAU, 50), { fill: k.light, hatch: 'cross', h: { color: k.ink, gap: 4, w: 0.6 }, seed: 3 });
      crescent(g, 170, 190, 112, 2.2, k.light, 4);
      for (let ring = 0; ring < 7; ring++) { const r = 250 + ring * 70, n = 10 + ring * 4; for (let i = 0; i < n; i++) { const a = Math.PI * 1.02 + (i / (n - 1)) * Math.PI * 0.96; fan(g, 500 + Math.cos(a) * r, 760 + Math.sin(a) * r * 0.95, 22 + ring * 2, a + Math.PI / 2, ring < 3 ? k.red : k.ink, k.red, ring * 50 + i); } }
      shape(g, [...arcPts(500, 760, 230, 230, Math.PI, TAU, 50)], { fill: k.light, hatch: 'lines', h: { color: k.red, gap: 4, w: 0.7, angle: 0 }, seed: 5 });
      for (let i = 0; i < 14; i++) { const a = Math.PI + (i / 13) * Math.PI; pen(g, [[500, 760], [500 + Math.cos(a) * 230, 760 + Math.sin(a) * 230]], k.red, 1, rng(i), 0.6); }
      // the sea
      for (let y = 770; y < 1250; y += 6) pen(g, [[0, y], [PWID, y]], y > 900 ? k.ink : k.red, 0.8, rng(y), 1.6);
      // the ascetic's hut on the right, in blue brick
      shape(g, [[790, 800], [790, 660], [950, 660], [950, 800]], { fill: k.ink, hatch: 'stitch', h: { color: k.light, gap: 7, w: 0.8 }, line: k.dark, seed: 6 });
      shape(g, [[770, 670], [870, 590], [970, 670]], { fill: k.ink2, hatch: 'lines', h: { color: k.light, gap: 4, w: 0.7, angle: 1.2 }, line: k.dark, seed: 7 });
      g.fillStyle = k.light; g.fillRect(850, 720, 30, 80);
      placeDevi(g, { ink: k, skin: '#f2c7a0', sari: '#fbf4ec', sari2: k.ink, blouse: '#fbf4ec', hands: ['mala', 'pot'], crown: 'jata', mood: 'calm', seed: 2, garland: 'none', bands: ['stitch', 'lines', 'dots', 'wave'] }, 500, 1180, 1.12);
    },
  },
  {
    key: 'chandraghanta', night: 3, dev: 'चन्द्रघण्टा', name: 'Chandraghanta', gloss: 'she who wears the moon as a bell', manner: 'crayon on taped scraps of paper',
    ink: INKS.crayon, holds: 'ten arms: trident, mace, sword, water-pot, lotus, arrow, bow, rosary, and the gestures of blessing and fearlessness', rides: 'a tiger', mantra: 'ॐ देवी चन्द्रघण्टायै नमः',
    story: [
      'When Parvati married Shiva she wore a half-moon on her forehead shaped like a temple bell. Its ringing, it is said, sends demons and evil spirits running — so on the third night she is drawn ten-armed on a tiger, ready, the bell sounding.',
      'She is fierce for the sake of those who come to her, and calm to them: warrior and bride in one picture.',
    ],
    paint: (g) => {
      const k = INKS.crayon; paper(g, PWID, PHEI, k, 13);
      const R = rng(9), pats: ((gg: G, i: number) => void)[] = [
        (gg, i) => { gg.strokeStyle = [k.red, k.ink, k.ink2][i % 3]; gg.lineWidth = 2; for (let y = -70; y < 80; y += 16) { gg.beginPath(); for (let x = -110; x < 110; x += 4) gg.lineTo(x, y + Math.sin(x * 0.15 + i) * 5); gg.stroke(); } },
        (gg, i) => { for (let y = -60; y < 70; y += 34) for (let x = -100; x < 110; x += 46) { gg.strokeStyle = k.ink2; gg.lineWidth = 2; gg.beginPath(); gg.moveTo(x, y - 14); gg.lineTo(x + 12, y); gg.lineTo(x, y + 14); gg.lineTo(x - 12, y); gg.closePath(); gg.stroke(); gg.fillStyle = k.red; gg.beginPath(); gg.arc(x + 23, y, 7, 0, TAU); gg.fill(); } void i; },
        (gg, i) => { for (let x = -110; x < 120; x += 16) { gg.strokeStyle = i % 2 ? k.red : k.ink; gg.lineWidth = 2; gg.beginPath(); gg.moveTo(x, -80); gg.lineTo(x + 30, 80); gg.stroke(); } },
        (gg, i) => { for (let r = 0; r < 4; r++) for (let x = -110; x < 120; x += 26) { gg.strokeStyle = [k.ink2, k.ink][(r + i) % 2]; gg.lineWidth = 2; gg.beginPath(); gg.arc(x + (r % 2) * 13, -40 + r * 28, 12, Math.PI, TAU); gg.stroke(); } },
        (gg) => { for (let i = 0; i < 9; i++) { const a = Math.PI + (i / 8) * Math.PI; gg.strokeStyle = i % 2 ? k.red : k.ink; gg.lineWidth = 2; gg.beginPath(); gg.moveTo(0, 50); gg.lineTo(Math.cos(a) * 110, 50 + Math.sin(a) * 110); gg.stroke(); } gg.fillStyle = k.red; gg.beginPath(); gg.arc(0, 50, 26, Math.PI, TAU); gg.fill(); },
        (gg, i) => { for (let y = -60; y < 70; y += 24) { gg.strokeStyle = k.ink2; gg.lineWidth = 2; gg.beginPath(); for (let x = -110, z = 0; x < 110; x += 12, z++) gg.lineTo(x, y + (z % 2 ? 9 : -9)); gg.stroke(); gg.fillStyle = k.red; for (let x = -100; x < 110; x += 40) { gg.beginPath(); gg.arc(x + i, y + 12, 3, 0, TAU); gg.fill(); } } },
      ];
      for (let row = 0; row < 7; row++) for (let col = 0; col < 5; col++) { const i = row * 5 + col; scrap(g, 100 + col * 200 + (R() - 0.5) * 30, 90 + row * 180 + (R() - 0.5) * 30, 210 + R() * 30, 170 + R() * 20, (R() - 0.5) * 0.12, k, i, (gg) => pats[(i * 7 + row) % pats.length](gg, i)); }
      // the deep blue crayon field in the middle, and the house of the goddess
      const field: Pt[] = blob([[150, 250], [500, 170], [850, 240], [880, 640], [840, 1040], [500, 1090], [140, 1030], [110, 640]], 6);
      g.fillStyle = '#2f4fb4'; g.fill(toPath(field)); crayon(g, field, '#1f3a9a', { density: 1.4, w: 2.4, seed: 4 }); crayon(g, field, '#4a6ad0', { density: 0.6, w: 1.8, angle: -0.6, seed: 5 });
      g.fillStyle = '#e8b13a'; g.fillRect(690, 260, 90, 90); crayon(g, [[690, 260], [780, 260], [780, 350], [690, 350]], '#c98a1a', { density: 1.5 }); g.strokeStyle = k.red; g.lineWidth = 4; g.beginPath(); g.moveTo(735, 260); g.lineTo(735, 350); g.moveTo(690, 305); g.lineTo(780, 305); g.stroke();
      placeDevi(g, { ink: { ...k, dark: '#2a1a2a' }, skin: '#f2b78a', sari: k.red, sari2: '#f7d98a', blouse: '#2f8a4a', hands: ['abhaya', 'varada', 'trident', 'mace', 'sword', 'pot', 'lotus', 'arrow', 'bow', 'mala'], crown: 'bell', moon: true, mood: 'calm', seed: 3, bands: ['zig', 'dots', 'diamonds', 'wave', 'chevron'] }, 0, 1000, 0.8, { m: 'tiger', mx: 480, ms: 1.2 });
    },
    live: (g, t) => { for (let i = 0; i < 4; i++) { const ph = (t * 0.5 + i / 4) % 1; g.globalAlpha = (1 - ph) * 0.6; g.strokeStyle = '#fbf4e0'; g.lineWidth = 3 - ph * 2; g.beginPath(); g.arc(470, 300, 40 + ph * 280, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); } g.globalAlpha = 1; },
  },
  {
    key: 'kushmanda', night: 4, dev: 'कूष्माण्डा', name: 'Kushmanda', gloss: 'she of the warm cosmic egg', manner: 'gold ink on night paper, a universe hatching',
    ink: INKS.night, holds: 'eight arms: water-pot, bow, arrow, lotus, a pot of nectar, discus, mace and rosary', rides: 'a lion', mantra: 'ॐ देवी कूष्माण्डायै नमः',
    story: [
      'Before there was anything there was darkness. Then she smiled, and the universe — the cosmic egg, the brahmanda — came into being out of that smile. Her name joins ku, a little, ushma, warmth, and anda, the egg.',
      'She is said to live in the core of the sun, the only one who can, and to give it its light. She has eight arms, and so is also called Ashtabhuja.',
    ],
    paint: (g) => {
      const k = INKS.night; paper(g, PWID, PHEI, k, 14);
      const R = rng(4); for (let i = 0; i < 220; i++) { g.fillStyle = R() > 0.85 ? k.accent : k.ink; g.globalAlpha = 0.4 + R() * 0.6; g.beginPath(); g.arc(R() * PWID, R() * PHEI, 0.6 + R() * 1.6, 0, TAU); g.fill(); } g.globalAlpha = 1;
      patternedRays(g, 500, 520, 300, 1100, 30, { ...k, ink: k.accent, ink2: '#8a6a2a', dark: '#5a3a10', red: k.red }, 31, 0, TAU);
      // the egg
      const egg = blob([[500, 180], [700, 330], [720, 600], [500, 780], [280, 600], [300, 330]], 8);
      shape(g, egg, { fill: '#f0a63a', hatch: 'lines', h: { color: k.red, gap: 5, w: 1, angle: 0 }, line: k.light, lw: 2.4, seed: 5 });
      for (let i = 0; i < 4; i++) pen(g, blob([[500, 180 - i * 8], [700 + i * 8, 330], [720 + i * 8, 600], [500, 780 + i * 8], [280 - i * 8, 600], [300 - i * 8, 330]], 8), i % 2 ? k.red : k.accent, 1.4, rng(i), 0.8, true);
      // little worlds, already spinning out of it
      for (let i = 0; i < 9; i++) { const a = (i / 9) * TAU + 0.3, r = 360 + (i % 3) * 60; g.save(); g.translate(500 + Math.cos(a) * r, 520 + Math.sin(a) * r * 0.9); shape(g, arcPts(0, 0, 18 + (i % 3) * 6, 18 + (i % 3) * 6, 0, TAU, 20), { fill: [k.red, '#3f8a9a', '#3f8a4a', k.accent][i % 4], hatch: 'lines', h: { color: k.dark, gap: 4, w: 0.6 }, line: k.light, seed: i }); g.restore(); }
      placeDevi(g, { ink: { ...k, dark: '#1a1020', accent: '#f0b23a' }, skin: '#f2b07a', sari: '#e8722c', sari2: '#f7d98a', blouse: '#c8442a', hands: ['pot', 'lotus', 'bow', 'arrow', 'kalash', 'chakra', 'mace', 'mala'], crown: 'mukut', mood: 'smile', seed: 4, bands: ['beads', 'wave', 'diamonds', 'lines', 'dots'] }, 0, 1180, 0.66, { m: 'lion', mx: 480, ms: 1.05 });
    },
    live: (g, t) => { g.save(); g.globalAlpha = 0.25 + 0.15 * Math.sin(t * 1.5); const gr = g.createRadialGradient(500, 480, 20, 500, 480, 300); gr.addColorStop(0, 'rgba(255,220,120,0.9)'); gr.addColorStop(1, 'rgba(255,220,120,0)'); g.fillStyle = gr; g.fillRect(200, 180, 600, 600); g.restore(); },
  },
  {
    key: 'skandamata', night: 5, dev: 'स्कन्दमाता', name: 'Skandamata', gloss: 'mother of Skanda', manner: 'teal pen, a lotus pond in fish-scale water',
    ink: INKS.teal, holds: 'lotuses in two hands, a blessing in the third, and her son Skanda on her lap', rides: 'a lion; she sits on a lotus', mantra: 'ॐ देवी स्कन्दमातायै नमः',
    story: [
      'Skanda — Kartikeya, Murugan — was born to lead the gods’ army against the demon Taraka. On the fifth night his mother is drawn holding him on her lap, seated on a lotus, with lotuses in her hands.',
      'She is the goddess as mother: to worship her, it is said, is to worship the child in her arms as well.',
    ],
    paint: (g) => {
      const k = INKS.teal; paper(g, PWID, PHEI, k, 15);
      patternedRays(g, 500, 640, 250, 1000, 22, { ...k, red: '#d89a2a' }, 41);
      shape(g, arcPts(500, 640, 250, 250, 0, TAU, 60), { fill: '#f4e8c8', hatch: 'scales', h: { color: k.ink2, gap: 14, w: 0.9 }, line: k.ink, seed: 6 });
      scaleSea(g, 0, 860, PWID, PHEI, { ...k, red: '#2e7a6a', accent: '#5aa08a' }, { cx: 500, w: 260 }, 7);
      const R = rng(8);
      for (let i = 0; i < 14; i++) { const x = R() * PWID, y = 900 + R() * 330; shape(g, arcPts(x, y, 46, 16, 0.3, TAU - 0.3, 18).concat([[x, y]] as Pt[]), { fill: '#3f8a5a', hatch: 'lines', h: { color: k.dark, gap: 4, w: 0.6 }, line: k.dark, seed: i }); }
      // the peacock, Skanda's own mount, at the side
      g.save(); g.translate(150, 880);
      for (let i = 0; i < 11; i++) { const a = Math.PI * 1.05 + (i / 10) * Math.PI * 0.9; shape(g, [[0, -60], [Math.cos(a) * 180, -60 + Math.sin(a) * 180], [Math.cos(a + 0.12) * 180, -60 + Math.sin(a + 0.12) * 180]], { fill: '#2f8a6a', hatch: 'lines', h: { color: k.dark, gap: 4, w: 0.5, angle: a }, seed: i }); g.fillStyle = '#d89a2a'; g.beginPath(); g.arc(Math.cos(a + 0.06) * 160, -60 + Math.sin(a + 0.06) * 160, 10, 0, TAU); g.fill(); g.fillStyle = '#1f3a8a'; g.beginPath(); g.arc(Math.cos(a + 0.06) * 160, -60 + Math.sin(a + 0.06) * 160, 5, 0, TAU); g.fill(); }
      shape(g, blob([[-30, 0], [0, -70], [20, -120], [34, -110], [20, -60], [30, 0]], 5), { fill: '#1f6a8a', hatch: 'scales', h: { color: '#3fae6a', gap: 8, w: 0.8 }, line: k.dark, seed: 9 });
      g.restore();
      g.save(); g.translate(560, 1010); g.scale(1.3, 1.3); mount(g, 'lotus', k, 0, 3); g.restore();
      placeDevi(g, { ink: k, skin: SKIN, sari: '#d89a2a', sari2: '#f4e8c8', blouse: '#c8442a', hands: ['abhaya', 'lotus', 'lotus', 'varada'], crown: 'mukut', mood: 'smile', child: true, seat: 'lotus', seed: 5, bands: ['scales', 'dots', 'wave'] }, 560, 1060, 0.95);
    },
  },
  {
    key: 'katyayani', night: 6, dev: 'कात्यायनी', name: 'Katyayani', gloss: 'daughter of the sage Katya', manner: 'cream ink on rust, a hermitage and a fleeing buffalo',
    ink: INKS.rust, holds: 'a sword and a lotus, and the gestures of blessing and fearlessness', rides: 'a lion', mantra: 'ॐ देवी कात्यायन्यै नमः',
    story: [
      'The sage Katyayana prayed for the goddess to be born as his daughter, and she appeared in his hermitage: so she is Katyayani. In this form she rode out to fight Mahishasura, the buffalo demon whom no man or god could kill.',
      'In the Bhagavata Purana the young women of Vraja keep a month-long vow to Katyayani, bathing in the Yamuna at dawn and praying for Krishna as their husband.',
    ],
    paint: (g) => {
      const k = INKS.rust; paper(g, PWID, PHEI, k, 16);
      lineSun(g, 760, 300, 150, { ...k, red: '#f7c86a', accent: '#fbead2', light: '#c8583a' }, 9, true);
      patternedRays(g, 760, 300, 160, 900, 26, { ...k, ink: '#f3dcc0', ink2: '#6a1a14', dark: '#3a120c' }, 51, 0, TAU);
      // the hermitage hut
      shape(g, [[60, 760], [60, 600], [260, 600], [260, 760]], { fill: '#c8743a', hatch: 'stitch', h: { color: k.dark, gap: 7, w: 0.8 }, line: k.dark, seed: 1 });
      shape(g, [[30, 610], [160, 500], [290, 610]], { fill: '#e8b85a', hatch: 'lines', h: { color: k.dark, gap: 4, w: 0.7, angle: 1.2 }, line: k.dark, seed: 2 });
      // the field
      hatch(g, [[0, 760], [PWID, 760], [PWID, PHEI], [0, PHEI]], 'rule', { color: '#f3dcc0', gap: 9, w: 0.8, angle: 0, alpha: 0.7, seed: 3 });
      g.save(); g.translate(860, 820); g.scale(0.5, 0.5); buffalo(g, k, 0, { charge: 0.6 }); g.restore();
      placeDevi(g, { ink: { ...k, dark: '#2a0c08', accent: '#f3a24a', light: '#fbead2' }, skin: '#f2b07a', sari: '#f3a24a', sari2: '#7a1a14', blouse: '#2a5a5a', hands: ['abhaya', 'varada', 'sword', 'lotus'], crown: 'mukut', mood: 'calm', seed: 6, bands: ['chevron', 'beads', 'wave', 'diamonds'] }, 0, 1170, 0.74, { m: 'lion', mx: 440, ms: 1.15, roar: 0.8 });
    },
  },
  {
    key: 'kalaratri', night: 7, dev: 'कालरात्रि', name: 'Kalaratri', gloss: 'the night of time', manner: 'chalk and white ink on indigo',
    ink: INKS.night, holds: 'a cleaver and a hook, and the gestures of blessing and fearlessness', rides: 'a donkey', mantra: 'ॐ देवी कालरात्र्यै नमः',
    story: [
      'The seventh is the darkest form: skin black as the night, hair loose and wild, three eyes like the full moon, a necklace that flashes like lightning, flame breathing from her nostrils. She rides a donkey.',
      'She is terrible to the forces of darkness and kind to those who come to her, so she is also called Shubhankari — she who does good.',
    ],
    paint: (g) => {
      const k = INKS.night; paper(g, PWID, PHEI, k, 17);
      hatch(g, [[0, 0], [PWID, 0], [PWID, PHEI], [0, PHEI]], 'cross', { color: '#2a2e6a', gap: 5, w: 0.7, seed: 4 });
      for (let i = 0; i < 9; i++) crescent(g, 110 + i * 100, 120 + Math.sin(i * 1.3) * 30, 26, Math.PI * 0.4 + i * 0.35, '#fbf2e2', i);
      const R = rng(7); for (let i = 0; i < 160; i++) { g.fillStyle = k.ink; g.globalAlpha = 0.3 + R() * 0.7; g.beginPath(); g.arc(R() * PWID, 200 + R() * 700, R() * 1.8, 0, TAU); g.fill(); } g.globalAlpha = 1;
      // lightning
      pen(g, [[820, 200], [780, 330], [830, 330], [770, 480]], k.accent, 4, rng(2), 1);
      hatch(g, [[0, 1000], [PWID, 960], [PWID, PHEI], [0, PHEI]], 'wave', { color: '#4a4e8a', gap: 12, w: 1.2, seed: 5 });
      placeDevi(g, { ink: { ...k, dark: '#05050f', accent: '#e8b23a', light: '#fff4d8' }, skin: '#22203a', sari: '#14121e', sari2: '#e85a3a', blouse: '#22203a', hands: ['abhaya', 'varada', 'cleaver', 'hook'], crown: 'wild', mood: 'fierce', tongue: true, garland: 'skulls', seed: 7, bands: ['lines', 'dots', 'zig', 'beads'] }, 0, 1180, 1.0, { m: 'donkey', mx: 520, ms: 1.45 });
    },
    live: (g, t) => { for (let i = 0; i < 2; i++) { const sx = i ? 1 : -1; for (let k = 0; k < 6; k++) { const ph = (t * 1.6 + k / 6) % 1; g.globalAlpha = (1 - ph) * 0.8; g.fillStyle = k % 2 ? '#e85a3a' : '#ffd65a'; g.beginPath(); g.arc(510 + sx * (6 + ph * 40), 260 + ph * 30, 4 + ph * 10, 0, TAU); g.fill(); } } g.globalAlpha = 1; },
  },
  {
    key: 'mahagauri', night: 8, dev: 'महागौरी', name: 'Mahagauri', gloss: 'the great white one', manner: 'grey pencil and gold on white',
    ink: INKS.white, holds: 'a trident and a small drum, and the gestures of blessing and fearlessness', rides: 'a white bull', mantra: 'ॐ देवी महागौर्यै नमः',
    story: [
      'After her long penance her body was dark with dust and sun. Shiva, pleased, washed her with the waters of the Ganga, and she shone white as the moon, as jasmine, as a conch: Mahagauri.',
      'She is dressed in white and rides a white bull. On the eighth day many households honour young girls as the goddess herself.',
    ],
    paint: (g) => {
      const k = INKS.white; paper(g, PWID, PHEI, k, 18);
      patternedRays(g, 500, 620, 230, 1100, 28, { ...k, red: k.accent }, 61, 0, TAU);
      shape(g, arcPts(500, 620, 230, 230, 0, TAU, 60), { fill: '#ffffff', hatch: 'dots', h: { color: k.accent, gap: 12, w: 1 }, line: k.accent, lw: 2.4, seed: 2 });
      // the Ganga pouring over her
      for (let i = 0; i < 9; i++) pen(g, curve([[440 + i * 14, 0], [450 + i * 12, 120], [470 + i * 8, 220]], 5), '#8ab0d0', 1.6, rng(i), 1.2);
      // jasmine
      const R = rng(5); for (let i = 0; i < 40; i++) { const x = R() * PWID, y = 900 + R() * 320; for (let p = 0; p < 5; p++) { const a = (p / 5) * TAU; g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(x + Math.cos(a) * 6, y + Math.sin(a) * 6, 5, 3, a, 0, TAU); g.fill(); g.strokeStyle = k.ink2; g.lineWidth = 0.6; g.stroke(); } g.fillStyle = k.accent; g.beginPath(); g.arc(x, y, 2, 0, TAU); g.fill(); }
      g.save(); g.translate(720, 1010); g.scale(0.62, 0.62); mount(g, 'bull', k, 0, 7); g.restore();
      placeDevi(g, { ink: k, skin: '#f8f0e6', sari: '#ffffff', sari2: '#c9a03a', blouse: '#f4efe4', hands: ['abhaya', 'varada', 'trident', 'damru'], crown: 'mukut', mood: 'calm', seed: 8, bands: ['dots', 'lines', 'beads', 'stitch'] }, 440, 1090, 1.0);
    },
  },
  {
    key: 'siddhidatri', night: 9, dev: 'सिद्धिदात्री', name: 'Siddhidatri', gloss: 'giver of perfection', manner: 'every manner at once: pen, ballpoint, crayon and chalk',
    ink: INKS.ochre, holds: 'a discus, a conch, a mace and a lotus', rides: 'a lion; she sits on a lotus', mantra: 'ॐ देवी सिद्धिदात्र्यै नमः',
    story: [
      'The last night belongs to the giver of the siddhis, the perfections that sages strive for. It is told that Shiva himself received them by her grace, and that half his body became hers — Ardhanarishvara, the lord who is half woman.',
      'She sits on a lotus, four-armed, while gods, sages and seekers come to her. With her the nine nights are complete, and on the tenth day, Vijayadashami, comes victory.',
    ],
    paint: (g) => {
      const k = INKS.ochre; paper(g, PWID, PHEI, k, 19);
      // nine wedges, one in the manner of each night
      const inks = [INKS.ochre, INKS.ballpoint, INKS.crayon, INKS.night, INKS.teal, INKS.rust, INKS.night, INKS.white, INKS.ochre];
      inks.forEach((ik, i) => {
        const a0 = Math.PI + (i / 9) * Math.PI, a1 = Math.PI + ((i + 1) / 9) * Math.PI, r = 1100;
        const w: Pt[] = [[500, 700], [500 + Math.cos(a0) * r, 700 + Math.sin(a0) * r], [500 + Math.cos(a1) * r, 700 + Math.sin(a1) * r]];
        shape(g, w, { fill: ik.paper });
        if (i === 1) for (let j = 0; j < 14; j++) { const a = lerp(a0, a1, (j % 4 + 0.5) / 4), rr = 320 + Math.floor(j / 4) * 110; g.save(); g.clip(toPath(w)); fan(g, 500 + Math.cos(a) * rr, 700 + Math.sin(a) * rr, 24, a + Math.PI / 2, ik.ink, ik.red, j); g.restore(); }
        else if (i === 2) crayon(g, w, ik.ink, { density: 0.8, seed: i });
        else if (i === 3 || i === 6) { hatch(g, w, 'dots', { color: ik.ink, gap: 18, w: 1, seed: i }); g.save(); g.clip(toPath(w)); crescent(g, 500 + Math.cos((a0 + a1) / 2) * 520, 700 + Math.sin((a0 + a1) / 2) * 520, 30, 1, '#fbf2e2', i); g.restore(); }
        else hatch(g, w, (['lines', 'wave', 'chevron', 'scales', 'beads', 'rule'] as const)[i % 6], { color: ik.ink, gap: 9, w: 0.9, angle: (a0 + a1) / 2, seed: i, color2: ik.red });
        pen(g, [w[0], w[1]], k.dark, 1.2, rng(i), 0.8);
      });
      lineSun(g, 500, 700, 280, k, 6);
      // devotees and sages at her feet
      g.fillStyle = k.ink2; g.fillRect(0, 960, PWID, 290);
      hatch(g, [[0, 960], [PWID, 960], [PWID, PHEI], [0, PHEI]], 'scales', { color: k.light, gap: 14, w: 0.9, seed: 8 });
      g.save(); g.translate(500, 1010); g.scale(1.4, 1.4); mount(g, 'lotus', k, 0, 5); g.restore();
      placeDevi(g, { ink: k, skin: SKIN, sari: '#c2422a', sari2: '#f7d98a', blouse: '#3f6a8a', hands: ['lotus', 'mace', 'chakra', 'conch'], crown: 'mukut', mood: 'smile', seat: 'lotus', seed: 9, bands: ['beads', 'chevron', 'wave', 'diamonds'] }, 500, 1060, 1.0);
      for (const [x, sx] of [[110, 1], [250, 1], [750, -1], [890, -1]] as [number, number][]) { g.save(); g.translate(x, 1230); g.scale(0.32 * sx, 0.32); devi(g, { ink: k, skin: '#d8955f', sari: '#fbf2e2', sari2: k.red, blouse: '#d8955f', hands: ['abhaya', 'abhaya'], crown: 'jata', mood: 'calm', garland: 'none', seed: x }); g.restore(); }
    },
  },
];

export function paintPortrait(p: Portrait): HTMLCanvasElement {
  const cv = document.createElement('canvas'); cv.width = PWID; cv.height = PHEI;
  const g = cv.getContext('2d')!;
  p.paint(g);
  // signature and frame rule
  label(g, `${p.night}`, 950, 1220, 26, p.ink.dark, 'right');
  return cv;
}

export { holdThing, label, curve, blob };
