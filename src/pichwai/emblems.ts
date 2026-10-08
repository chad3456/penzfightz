/**
 * Small painted emblems for the names of the thousand and for the vibhūtis
 * of the Gita — the sun, the moon, fire, the ocean, a mountain, an eye, the
 * weapons, a cow, a feather — each drawn in the flat, outlined manner of the
 * rest of the pichwai, centred on (x, y), about 100 units across at s = 1.
 * And the Lord reclining on Shesha on the ocean of milk.
 */
import { C, type G, circle, ellipse, fs, line, smooth, rng, lotus, sunDisc, flame, glory, curl, star4, dotsP, lerp } from '../chalisa/kit';
import { draw, shesha, type Fig } from '../chalisa/figures';
import { holdItem } from './frontal';

const ink = C.ink;

export type EmblemKey =
  | 'sun' | 'moon' | 'fire' | 'ocean' | 'mountain' | 'eye' | 'lotus' | 'chakra' | 'conch' | 'mace' | 'bow' | 'sword' | 'arrow'
  | 'cow' | 'feather' | 'serpent' | 'tree' | 'star' | 'om' | 'book' | 'crown' | 'foot' | 'lion' | 'boar' | 'fish' | 'tortoise'
  | 'wind' | 'earth' | 'heart' | 'flute' | 'pot' | 'rain' | 'cosmos' | 'wheel' | 'lamp' | 'mala' | 'thread' | 'gem' | 'hands' | 'bird';

/** Pick an emblem from a name and its meaning. */
const RULES: [EmblemKey, RegExp][] = [
  ['sun', /\bsun\b|sūrya|\bravi|bhānu|\bsavit|ādity|\bradian|\bsplend|\blight|\bbright|\blustr|\bshin/i],
  ['moon', /\bmoon|\bsoma|\bcandr|\bcool/i],
  ['fire', /\bfire|\bagni|\bflame|\bburn|\bheat|\btejas/i],
  ['ocean', /\bocean|\bsea|\bwater|\briver|sāgar|\bsamudr|\bflood|\bmilk/i],
  ['mountain', /\bmountain|\bhill|\bmeru|\bsteady|\bfirm|\bunmov|\bimmov/i],
  ['eye', /\beye|\bseer|\bsees|\bwitness|\bwatch|\bsight/i],
  ['chakra', /\bdiscus|\bcakr|sudarśan/i],
  ['conch', /\bconch|śaṅkh/i],
  ['mace', /\bmace|gad[āī]/i],
  ['bow', /bow\b|śārṅg|\barcher|\bdhanv/i],
  ['sword', /\bsword|\bnandak|\bweapon|\bdestroy|\bslay|\bkill|\benem|\bdemon/i],
  ['cow', /\bcow|go(pa|\bpati|vind)|\bcattle|\bherd/i],
  ['feather', /garuḍ|suparṇ|\bfeather|\bwing|\bbird/i],
  ['serpent', /\bserpent|\bsnake|śeṣ|\bananta|nāga|\bbhujag/i],
  ['lotus', /\blotus|\bpadma|\bkamal|puṇḍarīk|śrī\b|lakṣm|\bbeaut|\bfortune|\bprosper/i],
  ['tree', /\btree|vṛkṣ|aśvatth|\bnyagrodh|\budumbar|\bforest/i],
  ['foot', /\bstep|\bstride|\btrivikram|\bfoot|\bfeet|\bmeasur|vāman/i],
  ['lion', /\blion|siṃh|nṛsiṃh|nārasiṃh/i],
  ['boar', /\bboar|varāh/i],
  ['fish', /\bfish|\bmatsy/i],
  ['tortoise', /\btortoise|kūrm/i],
  ['wind', /\bwind|vāyu|\bbreath|prāṇ|\bair/i],
  ['earth', /\bearth|\bworld|bhū|dharaṇ|\bsupport|\bsustain|\bbear/i],
  ['book', /\bveda|\bscripture|\bword|\bspeech|vāc|\bknowledge|\bwise|\bwisdom|\blearn|\bteach/i],
  ['crown', /\bking|\blord|\bmaster|\bruler|īśvar|īś\b|īśa|\bsovereign|\bchief|\bsupreme/i],
  ['heart', /\blove|\bdear|\bbhakt|\bdevot|\bcompass|\bkind|\bmercy|\bgrace|\bfriend|\bheart/i],
  ['flute', /\bflute|veṇu|muralī/i],
  ['pot', /\bnectar|amṛt|\bambrosia|\bwealth|\btreasure|\bnidhi/i],
  ['rain', /\brain|\bcloud|\bmegh|\bparjany/i],
  ['cosmos', /\buniverse|\bcosmos|\ball-pervad|\bpervad|\binfinite|\bendless|\bvast|\bform of all|\beverything|\bwhole/i],
  ['wheel', /\btime|kāla|\byear|\bseason|\bage|\byug/i],
  ['lamp', /\blamp|dīp|\billumin/i],
  ['mala', /\byog|\bascet|\baustere|\btapas|\bmuni|\bmedit|\bsilent/i],
  ['thread', /\bsacrifice|yajñ|\boffering|\britual/i],
  ['gem', /\bjewel|\bgem|\bkaustubh|maṇi|\bprecious|\bgold/i],
  ['hands', /\bprotect|\brefuge|\bshelter|\bguard|\bsave|\bdeliver|\bfree|\bliberat/i],
  ['om', /om\b|oṃkār|praṇav|\bsyllable|\bbrahman|\bself|ātman|\bsoul|\bbeing|\bexistence|\btruth|sat\b/i],
  ['star', /\bstar|nakṣatr|\bgraha|\bheaven|\bsky|\bdhruv/i],
];
export function emblemFor(name: string, meaning: string, n = 0): EmblemKey {
  const s = `${name} ${meaning}`;
  for (const [k, re] of RULES) if (re.test(s)) return k;
  return (['om', 'lotus', 'star', 'lamp', 'gem', 'heart'] as EmblemKey[])[n % 6];
}

/** Draw an emblem in a round cartouche. */
export function emblem(g: G, k: EmblemKey, x: number, y: number, s: number, t: number, ring = true) {
  g.save(); g.translate(x, y); g.scale(s, s);
  if (ring) {
    circle(g, 0, 0, 56, dotsP(g, C.cream, 'rgba(214,58,40,0.18)', 10, 1.6), C.gold, 6);
    circle(g, 0, 0, 59, null, ink, 1.6);
  }
  switch (k) {
    case 'sun': sunDisc(g, 0, 0, 30, t, true); break;
    case 'moon': circle(g, 0, 0, 40, '#1c2a63'); circle(g, -4, 0, 28, C.cream); circle(g, 8, -6, 25, '#1c2a63'); g.fillStyle = C.white; star4(g, 22, 18, 4); break;
    case 'fire': flame(g, 0, 32, 0.55, t, 2); break;
    case 'ocean': for (let i = 0; i < 4; i++) { const yy = -20 + i * 14; g.beginPath(); for (let xx = -40; xx <= 40; xx += 4) g.lineTo(xx, yy + Math.sin(xx * 0.18 + t * 2 + i) * 4); g.strokeStyle = [C.blue, C.teal, C.sky, C.navy2][i]; g.lineWidth = 5; g.stroke(); } break;
    case 'mountain': g.beginPath(); g.moveTo(-44, 30); g.lineTo(-10, -32); g.lineTo(6, -8); g.lineTo(18, -24); g.lineTo(44, 30); g.closePath(); fs(g, C.stone, ink, 2); g.beginPath(); g.moveTo(-18, -18); g.lineTo(-10, -32); g.lineTo(-2, -18); g.closePath(); fs(g, C.white, null); break;
    case 'eye': g.beginPath(); g.moveTo(-42, 0); g.quadraticCurveTo(0, -34, 42, 0); g.quadraticCurveTo(0, 34, -42, 0); fs(g, C.white, ink, 2.4); circle(g, 0, 0, 14, C.blue, ink, 1.6); circle(g, 0, 0, 6, ink); circle(g, 4, -4, 2.5, C.white); break;
    case 'lotus': lotus(g, 0, 20, 1.15, 1, C.pink, C.rani); break;
    case 'chakra': holdItem(g, 'chakra', 0, 30, 0.85, t); break;
    case 'conch': holdItem(g, 'conch', 0, 34, 1.3, t); break;
    case 'mace': g.rotate(0.6); holdItem(g, 'mace', 0, 14, 0.5, t); break;
    case 'bow': g.rotate(0.5); holdItem(g, 'bow', -10, 0, 0.42, t); break;
    case 'sword': g.rotate(0.6); holdItem(g, 'sword', 0, 30, 0.62, t); break;
    case 'arrow': g.rotate(0.8); holdItem(g, 'arrow', 0, 22, 0.58, t); break;
    case 'cow': {
      ellipse(g, 0, 4, 34, 18, 0, C.white, ink, 2); circle(g, 34, -8, 11, C.white, ink, 2);
      line(g, [[28, -18], [24, -28]], C.gold, 3); line(g, [[38, -18], [42, -28]], C.gold, 3);
      for (const lx of [-22, -10, 14, 24]) line(g, [[lx, 18], [lx, 34]], ink, 3);
      circle(g, -6, 2, 8, '#d9a46a'); line(g, [[-34, 0], [-42, 18]], ink, 2);
      break;
    }
    case 'feather': case 'bird': {
      g.rotate(-0.5); smooth(g, [[0, 40], [-16, 0], [-6, -38], [0, -44], [6, -38], [16, 0]]); fs(g, C.peacock, ink, 2);
      ellipse(g, 0, -20, 10, 13, 0, C.gold, null); circle(g, 0, -20, 6, C.blue); line(g, [[0, 40], [0, -30]], ink, 1.4); break;
    }
    case 'serpent': {
      g.beginPath(); g.ellipse(0, -6, 26, 30, 0, 0, Math.PI * 2); fs(g, C.peacock, ink, 2);
      g.beginPath(); g.ellipse(0, -2, 14, 20, 0, 0, Math.PI * 2); fs(g, C.lime, null);
      circle(g, -6, -14, 3, C.white); circle(g, 6, -14, 3, C.white);
      line(g, [[-30, 34], [-10, 22], [10, 36], [30, 24]], C.teal, 8, true); break;
    }
    case 'tree': {
      line(g, [[0, 40], [0, 0]], C.brown, 7);
      for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * 0.4; ellipse(g, Math.cos(a) * 22, -8 + Math.sin(a) * 22, 16, 11, a, i % 2 ? C.leaf : C.green, ink, 1.4); }
      break;
    }
    case 'star': g.fillStyle = C.gold; star4(g, 0, 0, 34); g.fillStyle = C.white; star4(g, 0, 0, 12); for (let i = 0; i < 4; i++) { g.fillStyle = C.cream; star4(g, Math.cos(i * 1.57 + 0.78) * 32, Math.sin(i * 1.57 + 0.78) * 32, 5); } break;
    case 'om': g.save(); g.font = '64px "Tiro Devanagari Sanskrit", "Noto Serif Devanagari", serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = C.vermilion; g.fillText('ॐ', 0, 6); g.restore(); break;
    case 'book': g.beginPath(); g.rect(-40, -16, 80, 32); fs(g, C.marigold, ink, 2); for (let i = 0; i < 3; i++) line(g, [[-32, -6 + i * 8], [32, -6 + i * 8]], C.maroon, 1.4); line(g, [[-14, -16], [-14, 16]], C.vermilion, 3); line(g, [[14, -16], [14, 16]], C.vermilion, 3); break;
    case 'crown': g.beginPath(); g.moveTo(-34, 24); g.lineTo(-34, -6); g.lineTo(-18, 6); g.lineTo(0, -34); g.lineTo(18, 6); g.lineTo(34, -6); g.lineTo(34, 24); g.closePath(); fs(g, C.gold, ink, 2.2); circle(g, 0, 8, 6, C.vermilion, ink, 1); circle(g, -20, 14, 4, C.green); circle(g, 20, 14, 4, C.green); break;
    case 'foot': {
      g.beginPath(); g.ellipse(0, 6, 20, 34, 0, 0, Math.PI * 2); fs(g, '#f3b7a0', ink, 2);
      for (let i = 0; i < 5; i++) circle(g, -14 + i * 7, -32 + Math.abs(i - 1.5) * 2, 4.5 - Math.abs(i - 1) * 0.5, '#f3b7a0', ink, 1.2);
      circle(g, 0, 8, 7, null, C.vermilion, 2); curl(g, 0, 8, 5, 1, 1); g.strokeStyle = C.vermilion; g.stroke(); break;
    }
    case 'lion': circle(g, 0, 0, 36, C.saffron, ink, 2); for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2; ellipse(g, Math.cos(a) * 34, Math.sin(a) * 34, 9, 6, a, C.marigold, ink, 1); } circle(g, 0, 4, 22, '#f2b04a', ink, 1.6); circle(g, -8, -2, 3, ink); circle(g, 8, -2, 3, ink); ellipse(g, 0, 10, 6, 4, 0, C.maroon); break;
    case 'boar': g.beginPath(); g.moveTo(-36, 18); g.bezierCurveTo(-40, -20, 10, -30, 36, 0); g.quadraticCurveTo(40, 14, 28, 18); g.closePath(); fs(g, '#4a5a8a', ink, 2); g.beginPath(); g.moveTo(24, 16); g.quadraticCurveTo(36, 22, 40, 6); fs(g, C.cream, ink, 1.2); circle(g, 6, -6, 3, C.white); break;
    case 'fish': g.beginPath(); g.moveTo(-36, 0); g.quadraticCurveTo(0, -30, 30, 0); g.quadraticCurveTo(0, 30, -36, 0); g.closePath(); fs(g, dotsP(g, C.marigold, 'rgba(255,255,255,0.5)', 9, 2), ink, 2); g.beginPath(); g.moveTo(26, 0); g.lineTo(44, -16); g.lineTo(44, 16); g.closePath(); fs(g, C.marigold, ink, 2); circle(g, -22, -4, 3, ink); break;
    case 'tortoise': g.beginPath(); g.ellipse(0, 6, 36, 24, 0, Math.PI, 0); g.closePath(); fs(g, '#6d8a3a', ink, 2); for (let i = -1; i <= 1; i++) circle(g, i * 16, -6, 7, null, 'rgba(255,240,180,0.7)', 1.6); ellipse(g, 42, 2, 10, 7, 0, '#7a9a52', ink, 1.4); break;
    case 'wind': for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(-40, -16 + i * 16); g.bezierCurveTo(-10, -26 + i * 16, 10, -6 + i * 16, 30, -16 + i * 16); g.strokeStyle = [C.sky, C.white, C.lav][i]; g.lineWidth = 5; g.stroke(); curl(g, 30, -22 + i * 16, 6, 1.1, -1); g.stroke(); } break;
    case 'earth': circle(g, 0, 0, 34, C.blue, ink, 2); for (const [ex, ey, er] of [[-12, -8, 12], [12, 10, 10], [10, -16, 6]]) ellipse(g, ex, ey, er, er * 0.7, 0.4, C.leaf, null); break;
    case 'heart': g.beginPath(); g.moveTo(0, 30); g.bezierCurveTo(-50, -4, -24, -42, 0, -16); g.bezierCurveTo(24, -42, 50, -4, 0, 30); fs(g, C.rani, ink, 2.2); break;
    case 'flute': g.rotate(-0.4); holdItem(g, 'flute', -44, 0, 0.6, t); break;
    case 'pot': g.beginPath(); g.moveTo(-14, -30); g.lineTo(14, -30); g.quadraticCurveTo(10, -18, 24, -8); g.quadraticCurveTo(40, 20, 0, 34); g.quadraticCurveTo(-40, 20, -24, -8); g.quadraticCurveTo(-10, -18, -14, -30); fs(g, C.gold, ink, 2); line(g, [[-24, 0], [24, 0]], C.vermilion, 3); for (let i = 0; i < 3; i++) ellipse(g, -8 + i * 8, -36, 6, 10, (i - 1) * 0.4, C.green, ink, 1); break;
    case 'rain': for (let i = 0; i < 3; i++) circle(g, -20 + i * 20, -14 + Math.abs(i - 1) * 6, 18, '#5a6aa8', ink, 1.6); for (let i = 0; i < 6; i++) { const ph = (t * 1.5 + i / 6) % 1; line(g, [[-24 + i * 10, 6 + ph * 30], [-26 + i * 10, 14 + ph * 30]], C.sky, 2.4); } break;
    case 'cosmos': { circle(g, 0, 0, 40, '#0b1034'); const R = rng(7); for (let i = 0; i < 30; i++) { const a = R() * 6.28, r = R() * 36; g.fillStyle = [C.white, C.gold, C.sky][i % 3]; star4(g, Math.cos(a + t * 0.2) * r, Math.sin(a + t * 0.2) * r, 1.5 + R() * 2.5); } curl(g, 0, 0, 28, 2, 1, t * 0.3); g.strokeStyle = 'rgba(205,189,240,0.7)'; g.lineWidth = 2; g.stroke(); break; }
    case 'wheel': { circle(g, 0, 0, 36, null, C.maroon, 6); circle(g, 0, 0, 8, C.gold, ink, 1.6); for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2 + t * 0.3; line(g, [[Math.cos(a) * 8, Math.sin(a) * 8], [Math.cos(a) * 34, Math.sin(a) * 34]], C.brown, 2.4); } break; }
    case 'lamp': { g.beginPath(); g.moveTo(-30, 10); g.quadraticCurveTo(0, 36, 30, 10); g.lineTo(-30, 10); fs(g, C.gold, ink, 2); flame(g, 0, 10, 0.32, t, 1); break; }
    case 'mala': for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; circle(g, Math.cos(a) * 30, Math.sin(a) * 34, 4.5, '#8a4a24', ink, 1); } circle(g, 0, 38, 7, C.vermilion, ink, 1); break;
    case 'thread': { g.beginPath(); g.moveTo(-34, 24); g.lineTo(34, 24); g.lineTo(24, 8); g.lineTo(-24, 8); g.closePath(); fs(g, C.brown, ink, 2); flame(g, 0, 8, 0.38, t, 3); break; }
    case 'gem': { g.beginPath(); g.moveTo(0, -30); g.lineTo(26, -6); g.lineTo(0, 30); g.lineTo(-26, -6); g.closePath(); fs(g, C.vermilion, ink, 2); g.beginPath(); g.moveTo(0, -30); g.lineTo(10, -6); g.lineTo(0, 30); g.lineTo(-10, -6); g.closePath(); fs(g, 'rgba(255,255,255,0.35)', null); line(g, [[-26, -6], [26, -6]], ink, 1.2); break; }
    case 'hands': { // the abhaya hand
      g.beginPath(); g.moveTo(-18, 30); g.lineTo(-20, -6); for (let i = 0; i < 4; i++) { const fx = -18 + i * 11; g.lineTo(fx, -30 + Math.abs(i - 1.5) * 4); g.lineTo(fx + 8, -30 + Math.abs(i - 1.5) * 4); } g.lineTo(22, -2); g.lineTo(28, -10); g.lineTo(30, 0); g.lineTo(18, 30); g.closePath(); fs(g, '#5a7fd8', ink, 2);
      circle(g, 0, 6, 6, C.vermilion); break;
    }
  }
  g.restore();
}

/**
 * Anantaśayana: the Lord asleep on the coils of Shesha in the ocean of milk,
 * Lakshmi at his feet, a lotus rising from his navel with Brahma on it.
 * The figure lies along x, head to the left, centre at (x, y).
 */
export function reclining(g: G, x: number, y: number, s: number, t: number, o: { brahma?: number; lakshmi?: boolean; wake?: number } = {}) {
  g.save(); g.translate(x, y); g.scale(s, s);
  // the hood canopy over the head, its neck hidden behind the coils of the bed
  g.save(); g.beginPath(); g.rect(-700, -700, 1400, 730); g.clip(); g.translate(-250, 40); shesha(g, 0, 40, 0.8, t, 7); g.restore();
  for (let i = 3; i >= 0; i--) { g.beginPath(); g.ellipse(10, 34 + i * 20, 300 - i * 16, 24, 0, 0, Math.PI * 2); fs(g, dotsP(g, C.teal, 'rgba(255,255,255,0.35)', 18, 3), ink, 3); }
  // the tail curling up at the far end
  line(g, [[300, 40], [336, 10], [326, -24], [300, -30]], C.teal, 16, true);
  // the Lord, lying on his side: a profile figure turned to lie flat
  const look: Fig = { head: 'man', skin: '#3f6fd0', hair: '#15101e', hairStyle: 'long', crown: 'mukut', crownCol: C.gold, dhoti: C.gold, dhotiFg: C.marigold, border: C.vermilion, scarf: C.vermilion, scarfFg: C.gold, janeu: true, garland: true, tilak: 'ram', x: 0, y: 0, s: 1.05, t,
    pose: { fa: [0.25, 0.5], ba: [2.7, 2.2], fl: [0.04, 0.06], bl: [0.22, 0.4], head: -0.15 }, eye: (o.wake ?? 0) > 0.5 ? 'open' : 'closed', mouth: 'smile', glow: 0.6 };
  g.save(); g.translate(-60, 14); g.rotate(-Math.PI / 2 + 0.32);
  draw(g, look);
  g.restore();
  // a lotus stalk from the navel, Brahma seated on it
  const br = o.brahma ?? 0;
  if (br > 0) {
    const top = lerp(-10, -210, br);
    line(g, [[-30, -10], [-10, (top - 10) / 2], [-40, top]], C.green, 5, true);
    if (br > 0.6) {
      g.save(); g.globalAlpha = (br - 0.6) / 0.4;
      lotus(g, -40, top, 1.0, 1, C.pink, C.rani);
      draw(g, { head: 'sage', skin: '#e79a5a', beard: C.white, hair: C.white, hairStyle: 'bun', crown: 'mukut', dhoti: C.vermilion, dhotiFg: C.gold, border: C.gold, scarf: C.gold, janeu: true, tilak: 'ram', x: -40, y: top - 30, s: 0.38, t, pose: { legs: 'lotus', namaste: true } } as Fig);
      g.restore();
    }
  }
  // Lakshmi at his feet
  if (o.lakshmi !== false) draw(g, { head: 'woman', skin: '#f2b48a', hair: '#15101e', hairStyle: 'braid', crown: 'tiara', top: C.rani, skirt: C.rani, skirtFg: C.gold, veil: C.gold, tilak: 'dot', x: 250, y: 6, s: 0.62, face: -1, t, pose: { legs: 'lotus', fa: [1.2, 1.6], ba: [1.0, 1.4] } } as Fig);
  g.restore();
}

/** A row of the Lord's emblems orbiting, for the closing names (the bearer of every weapon). */
export function weaponWheel(g: G, x: number, y: number, r: number, t: number, s = 1) {
  const ks: EmblemKey[] = ['chakra', 'conch', 'mace', 'bow', 'sword', 'lotus'];
  ks.forEach((k, i) => { const a = t * 0.25 + (i / ks.length) * Math.PI * 2; emblem(g, k, x + Math.cos(a) * r, y + Math.sin(a) * r * 0.8, s, t); });
}

export { glory };
