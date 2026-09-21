import { box, curve, doodle, loop, pen, ring, rng, scrawl, type Pt } from './doodle';
import { LINE } from './paper';
import {
  C, arrow, card, figure, flame, hill, hut, moon, palace, palm, sky, track, tree, water,
} from './props';

/**
 * The Ramayana, drawn along one very long page.
 *
 * Twenty scenes, left to right, in the order they happen. The film does not cut
 * between them — it travels, because the middle of this story is a journey and
 * the page can simply *be* the journey. Ayodhya is at the start of the book and
 * Lanka is a long way into it, and getting from one to the other takes the
 * camera as long as it takes.
 *
 * ── On drawing him ───────────────────────────────────────────────────────
 *
 * The earlier film left him out entirely, which was right for a film with no
 * story in it. This one is his life from a fire in a hall to a road lit with
 * lamps, and a life needs somebody living it. So he is drawn — as a doodle, in
 * a school exercise book, two dots and a line for a face, the way the whole
 * world here is drawn. That register is the point: it is plainly a child's
 * retelling and not a devotional image, and it makes no claim to be a likeness
 * of anybody.
 *
 * As before: scenes, not doctrine. The beats most tellings share, nothing
 * invented for effect, and nothing settled that the tradition leaves open.
 */

export interface Scene {
  id: string;
  /** Where the middle of the scene sits on the page. */
  at: number;
  /** How wide it is, for culling. */
  w: number;
  /** Where the camera should look, vertically, while it is here. */
  eye?: number;
  title: string;
  draw: (g: CanvasRenderingContext2D, t: number) => void;
}

const GAP = 1900;
const G = 0; // the ground
const B = (i: number) => i * GAP;

/** Everything flickers a little; nothing jitters. */
const flick = (t: number, speed: number, k = 1) => 1 + Math.sin(t * speed) * 0.09 * k;

function ground(g: CanvasRenderingContext2D, x0: number, x1: number, colour = C.kraft, depth = LINE * 3.4) {
  const top: Pt[] = [];
  for (let x = x0; x <= x1; x += LINE * 2) top.push([x, G + Math.sin(x / 160) * LINE * 0.12]);
  doodle(g, [...top, [x1, G + depth], [x0, G + depth]], Math.round(x0), colour,
    { w: 3, slop: 4, shadow: false });
}

function crowd(
  g: CanvasRenderingContext2D, x0: number, n: number, spread: number, seed: number,
  opts: Partial<Parameters<typeof figure>[1]> = {},
) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    figure(g, {
      x: x0 + (i / Math.max(1, n - 1)) * spread + (r() - 0.5) * 40,
      y: G - r() * LINE * 0.4,
      h: LINE * (2.6 + r() * 0.7),
      robe: [C.blue, C.green, C.purple, C.teal, C.pink][i % 5],
      face: i % 2 ? 1 : -1,
      seed: seed + i * 13,
      ...opts,
    });
  }
}

export const SCENES: Scene[] = [
  // ─────────────────────────────────────────────── 1 · a fire, and no heir
  {
    id: 'fire', at: B(0), w: 1700, title: 'A king with no son',
    draw: (g, t) => {
      ground(g, B(0) - 900, B(0) + 900);
      sky(g, B(0), 5, false, t); // SKY
      palace(g, B(0) - 420, G, 620, 3);
      flame(g, B(0) + 150, G - LINE * 0.2, LINE * 1.5 * flick(t, 5.1), 7);
      figure(g, { x: B(0) + 20, y: G, hat: 'crown', robe: C.gold, face: 1, arms: 'out', seed: 11 });
      figure(g, { x: B(0) + 330, y: G, hat: 'sage', robe: C.white, face: -1, holds: 'staff', seed: 13 });
      for (const [i, x] of [-190, -110, -30].entries()) {
        figure(g, { x: B(0) + x, y: G - LINE * 0.3, h: LINE * 3, hat: 'veil',
          robe: [C.pink, C.teal, C.purple][i]!, face: 1, seed: 17 + i });
      }
      card(g, B(0) - 330, -LINE * 12.6, 640, [
        'He has three queens, four palaces', 'and nobody to leave it to.',
        'So he pays for a fire, and out of', 'the fire comes a bowl to share.',
      ], 21, '#f0e6cf', 'Bala Kanda');
    },
  },

  // ───────────────────────────────────────────────────── 2 · four boys
  {
    id: 'boys', at: B(1), w: 1700, title: 'Four boys, one of them everybody’s',
    draw: (g, t) => {
      ground(g, B(1) - 900, B(1) + 900);
      sky(g, B(1), 42, false, t); // SKY
      hut(g, B(1) - 620, G, 420, 31);
      tree(g, B(1) + 520, G, LINE * 7, 33);
      tree(g, B(1) + 700, G, LINE * 5.4, 35, C.leaf);
      const bob = Math.sin(t * 2.2) * 3;
      for (const [i, x] of [-160, -40, 80, 200].entries()) {
        figure(g, {
          x: B(1) + x, y: G + (i === 3 ? bob : 0), h: LINE * 2.1,
          robe: [C.blue, C.yellow, C.green, C.red][i]!, face: 1, seed: 41 + i,
          arms: i === 3 ? 'up' : 'down',
        });
      }
      figure(g, { x: B(1) + 380, y: G, hat: 'veil', robe: C.purple, face: -1, seed: 49 });
      card(g, B(1) - 330, -LINE * 12.6, 640, [
        'Rama. Bharata. Lakshmana.', 'Shatrughna. The youngest will', 'not sleep unless he can see the',
        'eldest, and nobody explains it.',
      ], 51);
    },
  },

  // ────────────────────────────────────────────────────────── 3 · the bow
  {
    id: 'bow', at: B(2), w: 1700, title: 'The bow nobody can lift',
    draw: (g, t) => {
      ground(g, B(2) - 900, B(2) + 900, C.stone);
      sky(g, B(2), 79, false, t); // SKY
      palace(g, B(2) + 420, G, 560, 61, C.teal);
      // The bow, on a stand, far too big.
      const bx = B(2) - 260;
      doodle(g, box(bx - 230, G - LINE * 1.1, 470, LINE * 0.9), 63, C.bark, { w: 3, slop: 3 });
      const stave: Pt[] = [
        [bx - 190, G - LINE * 1.3], [bx - 40, G - LINE * 4.2], [bx + 190, G - LINE * 1.3],
      ];
      pen(g, curve(stave, 10), 65, { w: 11, passes: 2 });
      pen(g, [[bx - 190, G - LINE * 1.3], [bx + 190, G - LINE * 1.3]], 67, { w: 3.4, passes: 1, overshoot: 0 });
      figure(g, { x: bx + 330, y: G, hat: 'crown', robe: C.gold, face: -1, seed: 69, arms: 'out' });
      figure(g, { x: bx - 330, y: G, h: LINE * 2.3, hat: 'veil', robe: C.pink, face: 1, seed: 71, arms: 'one' });
      // And a crack running through it, because this is the moment it breaks.
      const k = Math.max(0, Math.sin(t * 0.8));
      pen(g, [[bx - 40, G - LINE * 4.2], [bx - 20, G - LINE * 3.2], [bx - 60, G - LINE * 2.2]], 73,
        { w: 3 + k * 2, passes: 1, colour: 'rgba(200,70,50,0.8)', overshoot: 0 });
      card(g, B(2) - 330, -LINE * 12.6, 640, [
        'Janaka keeps a bow nobody can', 'move. One afternoon his small',
        'daughter shifts it aside to get', 'at a ball, and he decides on the',
        'spot who she will marry.',
      ], 75);
    },
  },

  // ────────────────────────────────────────────────────── 4 · the wedding
  {
    id: 'wedding', at: B(3), w: 1700, title: 'Four at once',
    draw: (g, t) => {
      ground(g, B(3) - 900, B(3) + 900, C.pink);
      sky(g, B(3), 116, false, t); // SKY
      for (let i = 0; i < 5; i++) {
        pen(g, [[B(3) - 700 + i * 350, -LINE * 9], [B(3) - 560 + i * 350, -LINE * 8.2],
          [B(3) - 420 + i * 350, -LINE * 9]], 83 + i, { w: 3, passes: 1, colour: C.gold, overshoot: 0 });
      }
      flame(g, B(3), G - LINE * 0.2, LINE * 1.2 * flick(t, 6.3), 87);
      for (let i = 0; i < 4; i++) {
        const x = B(3) - 520 + i * 350;
        figure(g, { x, y: G, hat: 'crown', robe: [C.blue, C.green, C.yellow, C.teal][i]!, face: 1, seed: 91 + i });
        figure(g, { x: x + 95, y: G - LINE * 0.2, h: LINE * 3, hat: 'veil',
          robe: [C.pink, C.purple, C.red, C.gold][i]!, face: -1, seed: 95 + i });
      }
      card(g, B(3) - 330, -LINE * 12.6, 640, [
        'The bow is strung and broken.', 'Four brothers marry four sisters',
        'on one afternoon, and for a', 'while the whole thing is simply', 'happy.',
      ], 99);
    },
  },

  // ─────────────────────────────────────────────────── 5 · the small room
  {
    id: 'room', at: B(4), w: 1700, eye: -LINE * 3, title: 'Two boons, saved up',
    draw: (g, t) => {
      ground(g, B(4) - 900, B(4) + 900, '#6b5f7a');
      sky(g, B(4), 153, true, t); // SKY
      moon(g, B(4) - 520, -LINE * 12, LINE * 1.5, 101);
      const r = rng(103);
      for (let i = 0; i < 26; i++) {
        const sx = B(4) - 800 + r() * 1600;
        const sy = -LINE * (8 + r() * 6);
        pen(g, [[sx - 5, sy], [sx + 5, sy]], 105 + i, { w: 2, passes: 1, colour: '#e8dfc0', overshoot: 0 });
        pen(g, [[sx, sy - 5], [sx, sy + 5]], 135 + i, { w: 2, passes: 1, colour: '#e8dfc0', overshoot: 0 });
      }
      // One lit room, drawn as a box of light on the dark.
      doodle(g, box(B(4) - 130, G - LINE * 6.6, 620, LINE * 6.6), 141, '#e4d5a8', { w: 3.4, slop: 3 });
      flame(g, B(4) + 400, G - LINE * 0.4, LINE * 0.62 * flick(t, 7.7), 143);
      figure(g, { x: B(4) + 60, y: G - LINE * 0.2, hat: 'veil', robe: C.red, face: 1, seed: 145, sit: true });
      figure(g, { x: B(4) + 250, y: G - LINE * 0.2, h: LINE * 2.9, robe: '#6f6357', hair: '#59504a',
        face: -1, seed: 147, arms: 'out' });
      card(g, B(4) - 330, -LINE * 12.6, 640, [
        'Manthara invents nothing. She', 'says true things in an order that',
        'makes a good woman frightened,', 'and then she waits.',
      ], 149, '#e9dcc0', 'Ayodhya Kanda');
    },
  },

  // ─────────────────────────────────────────────────── 6 · the throne room
  {
    id: 'throne', at: B(5), w: 1700, title: 'The word he cannot say',
    draw: (g, t) => {
      ground(g, B(5) - 900, B(5) + 900, C.pink);
      sky(g, B(5), 190, false, t); // SKY
      palace(g, B(5) - 780, G, 700, 151, C.gold);
      for (const x of [-420, -180, 60, 300]) {
        doodle(g, box(B(5) + x, G - LINE * 8.5, LINE * 0.9, LINE * 8.5), 153 + x, C.stone, { w: 3, slop: 3 });
      }
      figure(g, { x: B(5) - 300, y: G, hat: 'crown', robe: C.gold, face: 1, seed: 161, sit: true, arms: 'down' });
      figure(g, { x: B(5) - 60, y: G, hat: 'veil', robe: C.red, face: -1, seed: 163, arms: 'out' });
      figure(g, { x: B(5) + 220, y: G, robe: C.blue, face: -1, seed: 165, holds: 'bow' });
      crowd(g, B(5) + 420, 5, 420, 167, { h: LINE * 2.5 });
      card(g, B(5) - 330, -LINE * 12.6, 640, [
        'The coronation goes to Bharata.', 'Rama goes to the forest for',
        'fourteen years. The king has', 'promised. The king says nothing', 'at all.',
      ], 171);
    },
  },

  // ───────────────────────────────────────────────────────── 7 · the gate
  {
    id: 'gate', at: B(6), w: 1900, title: 'The city follows them out',
    draw: (g, t) => {
      ground(g, B(6) - 950, B(6) + 950);
      sky(g, B(6), 227, false, t); // SKY
      // The gate, and the road beginning.
      doodle(g, box(B(6) - 640, G - LINE * 9, LINE * 1.3, LINE * 9), 181, C.rust, { w: 3.4, slop: 3 });
      doodle(g, box(B(6) - 320, G - LINE * 9, LINE * 1.3, LINE * 9), 183, C.rust, { w: 3.4, slop: 3 });
      doodle(g, box(B(6) - 660, G - LINE * 10.4, LINE * 11.2, LINE * 1.4), 185, C.gold, { w: 3.4, slop: 3 });
      track(g, [[B(6) + 40, G - LINE * 0.6], [B(6) + 500, G - LINE * 1.2], [B(6) + 950, G - LINE * 0.8]], 187);
      crowd(g, B(6) - 900, 9, 560, 189, { h: LINE * 2.5, face: 1 });
      figure(g, { x: B(6) + 200, y: G - LINE * 0.6, robe: C.blue, face: 1, seed: 191, holds: 'bow' });
      figure(g, { x: B(6) + 320, y: G - LINE * 0.7, h: LINE * 3, hat: 'veil', robe: C.pink, face: 1, seed: 193 });
      figure(g, { x: B(6) + 440, y: G - LINE * 0.8, robe: C.green, face: 1, seed: 195, hat: 'knot' });
      card(g, B(6) - 330, -LINE * 12.6, 640, [
        'Ayodhya walks with them as far', 'as the river and will not turn',
        'back. So the three of them get up', 'in the dark and go on without', 'waking anybody.',
      ], 197);
    },
  },

  // ──────────────────────────────────────────────────────── 8 · the river
  {
    id: 'river', at: B(7), w: 1900, eye: LINE * 1.5, title: 'A boatman with nothing to give',
    draw: (g, t) => {
      ground(g, B(7) - 950, B(7) - 200);
      sky(g, B(7), 264, false, t); // SKY
      ground(g, B(7) + 420, B(7) + 950);
      water(g, B(7) - 210, B(7) + 430, G - LINE * 0.4, LINE * 4.2, 201);
      // The boat, rocking.
      const rock = Math.sin(t * 1.3) * 0.035;
      g.save();
      g.translate(B(7) + 110, G - LINE * 0.8);
      g.rotate(rock);
      doodle(g, loop([[-160, -LINE * 0.9], [160, -LINE * 0.9], [120, LINE * 0.7], [-120, LINE * 0.7]], 5),
        203, C.bark, { w: 3.4, slop: 3 });
      g.restore();
      tree(g, B(7) - 700, G, LINE * 7.5, 205);
      hut(g, B(7) + 620, G, 340, 207);
      flame(g, B(7) + 830, G - LINE * 0.2, LINE * 0.9 * flick(t, 6.8), 209);
      figure(g, { x: B(7) - 520, y: G, robe: C.blue, face: 1, seed: 211 });
      figure(g, { x: B(7) - 420, y: G, h: LINE * 3, hat: 'veil', robe: C.pink, face: 1, seed: 213 });
      figure(g, { x: B(7) + 700, y: G, robe: C.brown, face: -1, seed: 215, holds: 'staff' });
      card(g, B(7) - 330, -LINE * 12.6, 640, [
        'Guha owns a crossing, a fire and', 'somewhere to put your head, and',
        'gives all three to the heir of', 'Ayodhya. Then lies awake all', 'night guarding them.',
      ], 217);
    },
  },

  // ─────────────────────────────────────────────────────── 9 · the sandals
  {
    id: 'sandals', at: B(8), w: 1700, title: 'A pair of sandals on a throne',
    draw: (g, t) => {
      ground(g, B(8) - 900, B(8) + 900);
      sky(g, B(8), 301, false, t); // SKY
      hill(g, B(8) - 860, G, 700, LINE * 7, 221, '#9fae94');
      for (const x of [-560, -300, 480, 700]) tree(g, B(8) + x, G, LINE * (6 + (x % 3)), 223 + x);
      // The little throne, and what is on it.
      doodle(g, box(B(8) + 40, G - LINE * 2.4, LINE * 4, LINE * 2.4), 231, C.gold, { w: 3, slop: 3 });
      for (const s of [0, 1]) {
        doodle(g, loop(ring(B(8) + 70 + s * 48, G - LINE * 2.8, LINE * 0.62, 9, 1.5, 233 + s), 6),
          235 + s, C.bark, { w: 2.6, slop: 2 });
      }
      figure(g, { x: B(8) - 180, y: G, hat: 'crown', robe: C.purple, face: 1, seed: 237, sit: true, arms: 'out' });
      figure(g, { x: B(8) + 300, y: G, robe: C.blue, face: -1, seed: 239 });
      figure(g, { x: B(8) + 420, y: G, hat: 'knot', robe: C.green, face: -1, seed: 241 });
      card(g, B(8) - 330, -LINE * 12.6, 640, [
        'Bharata walks into the forest with', 'an army to bring his brother home',
        'and is refused. He takes the', 'sandals instead and rules from', 'behind them.',
      ], 243);
    },
  },

  // ──────────────────────────────────────────────────── 10 · ten good years
  {
    id: 'panchavati', at: B(9), w: 1900, title: 'Ten years, and almost nothing recorded',
    draw: (g, t) => {
      ground(g, B(9) - 950, B(9) + 950, '#a8bd86');
      sky(g, B(9), 338, false, t); // SKY
      for (const x of [-880, -700, -520, 560, 740, 900]) tree(g, B(9) + x, G, LINE * (6.5 + (x % 4) * 0.4), 251 + x);
      hut(g, B(9) - 260, G, 460, 253);
      // Somebody sweeping, somebody sitting, a deer that is only a deer.
      figure(g, { x: B(9) + 170, y: G, hat: 'knot', robe: C.green, face: -1, seed: 255, holds: 'staff' });
      figure(g, { x: B(9) + 330, y: G, h: LINE * 3, hat: 'veil', robe: C.pink, face: -1, seed: 257, sit: true });
      figure(g, { x: B(9) + 440, y: G, robe: C.blue, face: -1, seed: 259, sit: true });
      const step = Math.sin(t * 1.6) * 8;
      deer(g, B(9) - 620 + step, G, LINE * 2.4, 261, C.brown);
      card(g, B(9) - 330, -LINE * 12.6, 640, [
        'Ten years pass here and the poem', 'records almost none of it, which',
        'in a story this long is how you', 'say that people were happy.',
      ], 263, '#f0e6cf', 'Aranya Kanda');
    },
  },

  // ──────────────────────────────────────────────────── 11 · the golden deer
  {
    id: 'deer', at: B(10), w: 1700, title: 'One lovely thing, the wrong colour',
    draw: (g, t) => {
      ground(g, B(10) - 900, B(10) + 900, '#a8bd86');
      sky(g, B(10), 375, false, t); // SKY
      for (const x of [-820, -640, 620, 820]) tree(g, B(10) + x, G, LINE * 6.8, 271 + x);
      hut(g, B(10) - 420, G, 400, 273);
      const bound = Math.sin(t * 2.4) * LINE * 0.5;
      deer(g, B(10) + 300, G - Math.abs(bound), LINE * 3.1, 275, C.gold, true);
      figure(g, { x: B(10) - 40, y: G, h: LINE * 3.1, hat: 'veil', robe: C.pink, face: 1, seed: 277, arms: 'one' });
      figure(g, { x: B(10) - 200, y: G, robe: C.blue, face: 1, seed: 279, holds: 'bow' });
      card(g, B(10) - 330, -LINE * 12.6, 640, [
        'It is the wrong colour for a deer', 'and it is too beautiful, and she',
        'asks for it anyway — because she', 'has lived in a hut for ten years', 'and wanted one lovely thing.',
      ], 281);
    },
  },

  // ───────────────────────────────────────────────────────── 12 · the line
  {
    id: 'line', at: B(11), w: 1900, title: 'A line drawn across a doorway',
    draw: (g, t) => {
      ground(g, B(11) - 950, B(11) + 950, '#9db07c');
      sky(g, B(11), 412, false, t); // SKY
      for (const x of [-880, -700, 760, 920]) tree(g, B(11) + x, G, LINE * 6.4, 291 + x);
      hut(g, B(11) - 540, G, 460, 293);
      // The line: three colours on top of each other so it burns.
      const k = flick(t, 4.2, 2);
      for (const [i, col] of [C.rust, C.gold, '#fff3c4'].entries()) {
        pen(g, [[B(11) - 180, G - LINE * 0.3], [B(11) + 180, G - LINE * 0.3]], 295 + i,
          { w: (14 - i * 4) * k, passes: 1, colour: col, overshoot: 0 });
      }
      figure(g, { x: B(11) - 340, y: G - LINE * 0.4, h: LINE * 3.1, hat: 'veil', robe: C.pink, face: 1, seed: 297 });
      figure(g, { x: B(11) + 340, y: G, hat: 'knot', robe: C.green, face: 1, seed: 299, arms: 'out' });
      // And the chariot, up in the corner, which is what the line was for.
      chariot(g, B(11) + 640, -LINE * 9.5, LINE * 3.4, 301, t);
      card(g, B(11) - 330, -LINE * 12.6, 640, [
        'A cry for help in Rama’s voice.', 'Lakshmana knows it is a trick and',
        'is accused of wanting his brother', 'dead — so he draws a line, says do',
        'not cross it, and goes.',
      ], 303);
    },
  },

  // ─────────────────────────────────────────────────────── 13 · the bird
  {
    id: 'jatayu', at: B(12), w: 1700, eye: LINE * 1, title: 'An old bird, too old for this',
    draw: (g, t) => {
      ground(g, B(12) - 900, B(12) + 900, C.kraft);
      sky(g, B(12), 449, false, t); // SKY
      track(g, [[B(12) - 900, G - LINE * 1.1], [B(12), G - LINE * 1.6], [B(12) + 900, G - LINE * 1]], 311);
      // Feathers, scattered along the road.
      const r = rng(313);
      for (let i = 0; i < 16; i++) {
        const fx = B(12) - 500 + r() * 900;
        const fy = G - LINE * (0.2 + r() * 1.6);
        pen(g, [[fx, fy], [fx + 26, fy - 9]], 315 + i, { w: 3, passes: 1, colour: '#6b5b45', overshoot: 0 });
      }
      bird(g, B(12) + 80, G - LINE * 0.6, LINE * 4.4, 317);
      figure(g, { x: B(12) - 240, y: G, robe: C.blue, face: 1, seed: 319, sit: true, arms: 'out' });
      figure(g, { x: B(12) - 400, y: G, hat: 'knot', robe: C.green, face: 1, seed: 321 });
      card(g, B(12) - 330, -LINE * 12.6, 640, [
        'Jatayu goes up against a chariot', 'for a woman he has no duty to,',
        'and is still alive when Rama', 'finds him — long enough to say', 'which way they went.',
      ], 323);
    },
  },

  // ─────────────────────────────────────────────────── 14 · the monkeys
  {
    id: 'kishkindha', at: B(13), w: 1900, title: 'A king in hiding, and a helper',
    draw: (g, t) => {
      ground(g, B(13) - 950, B(13) + 950, '#a49b84');
      sky(g, B(13), 486, false, t); // SKY
      hill(g, B(13) - 900, G, 900, LINE * 11, 331, '#8d9280');
      hill(g, B(13) + 200, G, 760, LINE * 8, 333, '#9aa08c');
      // A cave mouth in the first hill.
      doodle(g, loop([[B(13) - 560, G], [B(13) - 540, G - LINE * 3], [B(13) - 420, G - LINE * 3.6],
        [B(13) - 320, G - LINE * 2.8], [B(13) - 300, G]], 7), 335, '#4c4a42', { w: 3.4, slop: 3 });
      figure(g, { x: B(13) - 100, y: G, hat: 'monkey', robe: C.rust, skin: '#c98f5e', face: 1, seed: 337, tail: true });
      figure(g, { x: B(13) + 60, y: G, hat: 'monkey', robe: C.gold, skin: '#d7a05f', face: -1, seed: 339, tail: true, holds: 'club' });
      figure(g, { x: B(13) + 320, y: G, robe: C.blue, face: -1, seed: 341, holds: 'bow' });
      figure(g, { x: B(13) + 440, y: G, hat: 'knot', robe: C.green, face: -1, seed: 343 });
      crowd(g, B(13) + 600, 4, 300, 345, { h: LINE * 2.4, hat: 'monkey', skin: '#c98f5e', tail: true });
      card(g, B(13) - 330, -LINE * 12.6, 640, [
        'A king thrown out by his brother,', 'living on the one hill his brother',
        'cannot climb. An alliance made in', 'an afternoon by two people who', 'have both lost everything.',
      ], 347, '#f0e6cf', 'Kishkindha Kanda');
    },
  },

  // ───────────────────────────────────────────────────────── 15 · the leap
  {
    id: 'leap', at: B(14), w: 2100, eye: -LINE * 2, title: 'The most famous jump in the language',
    draw: (g, t) => {
      ground(g, B(14) - 1050, B(14) - 200, '#9aa08c');
      sky(g, B(14), 523, false, t); // SKY
      hill(g, B(14) - 1000, G, 700, LINE * 9, 351, '#8d9280');
      palm(g, B(14) - 420, G, LINE * 7.5, 352);
      palm(g, B(14) - 300, G, LINE * 6, 354);
      water(g, B(14) - 220, B(14) + 1050, G - LINE * 0.6, LINE * 5, 353);
      // Him, mid-air, getting bigger as he goes.
      const k = (Math.sin(t * 0.55) + 1) / 2;
      const fx = B(14) - 120 + k * 760;
      const fy = G - LINE * (3.5 + Math.sin(k * Math.PI) * 5.5);
      figure(g, { x: fx, y: fy, h: LINE * (3 + k * 1.8), hat: 'monkey', robe: C.gold,
        skin: '#d7a05f', face: 1, seed: 355, tail: true, arms: 'up' });
      const r = rng(357);
      for (let i = 0; i < 9; i++) {
        const sx = fx - 90 - i * 60;
        const sy = fy + LINE * (0.6 + r() * 1.4) + i * LINE * 0.5;
        pen(g, [[sx, sy], [sx - 34, sy + 8]], 359 + i, { w: 3, passes: 1, colour: 'rgba(210,170,80,0.75)', overshoot: 0 });
      }
      crowd(g, B(14) - 860, 5, 340, 361, { h: LINE * 2.3, hat: 'monkey', skin: '#c98f5e', tail: true, face: 1 });
      card(g, B(14) - 330, -LINE * 12.6, 640, [
        'He can cross a hundred leagues of', 'sea and has forgotten it. He has',
        'to be reminded what he is by', 'somebody standing next to him —', 'and then the cliff looks small.',
      ], 363, '#f0e6cf', 'Sundara Kanda');
    },
  },

  // ──────────────────────────────────────────────────────── 16 · the grove
  {
    id: 'grove', at: B(15), w: 1900, title: 'Ten months under a tree',
    draw: (g, t) => {
      ground(g, B(15) - 950, B(15) + 950, '#93a97a');
      sky(g, B(15), 560, false, t); // SKY
      for (const x of [-880, -720, -560, 560, 720, 880]) tree(g, B(15) + x, G, LINE * 7.2, 371 + x, C.leaf);
      tree(g, B(15) + 120, G, LINE * 10, 373, C.green);
      figure(g, { x: B(15) + 60, y: G, h: LINE * 3.1, hat: 'veil', robe: C.pink, face: -1, seed: 375, sit: true });
      // The ring, dropped into her lap, the size it actually is.
      const shine = flick(t, 3.4, 1.6);
      doodle(g, loop(ring(B(15) + 128, G - LINE * 1.1, LINE * 0.22 * shine, 9, 1, 377), 6), 379, C.gold,
        { w: 2.4, slop: 1, shadow: false });
      for (const x of [-420, -260, 300, 460]) {
        figure(g, { x: B(15) + x, y: G, h: LINE * 2.7, hat: 'helm', robe: '#6e6a7d',
          face: x < 0 ? 1 : -1, seed: 381 + x, holds: 'staff' });
      }
      card(g, B(15) - 330, -LINE * 12.6, 640, [
        'Guarded, and asked once a month', 'to reconsider, and refusing every',
        'time. Then a monkey drops a ring', 'into her lap and she has to decide', 'whether to believe it.',
      ], 383);
    },
  },

  // ──────────────────────────────────────────────────── 17 · Lanka burning
  {
    id: 'burning', at: B(16), w: 1900, title: 'The one page having a wonderful time',
    draw: (g, t) => {
      ground(g, B(16) - 950, B(16) + 950, '#8a6a55');
      sky(g, B(16), 597, false, t); // SKY
      for (let i = 0; i < 6; i++) {
        const x = B(16) - 840 + i * 300;
        const h = LINE * (5 + (i % 3) * 1.6);
        doodle(g, box(x, G - h, 230, h), 391 + i, i % 2 ? C.rust : C.kraft, { w: 3.4, slop: 3 });
        flame(g, x + 115, G - h, LINE * (1 + (i % 3) * 0.3) * flick(t, 5 + i, 1.6), 397 + i);
      }
      figure(g, { x: B(16) + 560, y: G - LINE * 6.6, hat: 'monkey', robe: C.gold, skin: '#d7a05f',
        face: -1, seed: 401, arms: 'up' });
      // The tail, alight, going off the end of the roof.
      const tail: Pt[] = [
        [B(16) + 600, G - LINE * 6.2], [B(16) + 700, G - LINE * 5.4], [B(16) + 780, G - LINE * 4.2],
      ];
      pen(g, tail, 403, { w: 5, passes: 1 });
      flame(g, B(16) + 790, G - LINE * 4.2, LINE * 0.9 * flick(t, 8.2, 1.8), 405);
      card(g, B(16) - 330, -LINE * 12.6, 640, [
        'Caught, and sentenced to have his', 'tail set alight. He lets them do',
        'it — and then walks the length of', 'the city with it.',
      ], 407);
    },
  },

  // ────────────────────────────────────────────────────── 18 · the causeway
  {
    id: 'bridge', at: B(17), w: 2100, eye: LINE * 1.5, title: 'Stones on the water',
    draw: (g, t) => {
      ground(g, B(17) - 1050, B(17) - 600, '#9aa08c');
      sky(g, B(17), 634, false, t); // SKY
      water(g, B(17) - 620, B(17) + 1050, G - LINE * 0.6, LINE * 5.4, 411);
      for (let i = 0; i < 12; i++) {
        const k = i / 11;
        const x = B(17) - 520 + k * 1500;
        const y = G - LINE * (0.9 + Math.sin(k * 3 + t * 0.4) * 0.12);
        const s = LINE * (1.5 - k * 0.55);
        doodle(g, loop(ring(x, y, s, 9, 0.66, 413 + i), 6), 415 + i, i % 2 ? C.stone : '#c9a98a',
          { w: 3, slop: 3 });
        scrawl(g, ['ra', 'ma', 'ra', 'ma'][i % 4]!, x - s * 0.4, y + s * 0.2, s * 0.7, 417 + i, 'rgba(70,60,48,0.6)');
      }
      crowd(g, B(17) - 1000, 6, 420, 419, { h: LINE * 2.4, hat: 'monkey', skin: '#c98f5e', tail: true, face: 1, arms: 'up' });
      card(g, B(17) - 330, -LINE * 12.6, 640, [
        'An army of bears and monkeys', 'builds a road across the sea. In',
        'the tellings people love best the', 'stones float, because each one has', 'a name written on it.',
      ], 421, '#f0e6cf', 'Yuddha Kanda');
    },
  },

  // ──────────────────────────────────────────────────────── 19 · the war
  {
    id: 'war', at: B(18), w: 2300, title: 'It goes on for a very long time',
    draw: (g, t) => {
      ground(g, B(18) - 1150, B(18) + 1150, '#a08b74');
      sky(g, B(18), 671, false, t); // SKY
      for (let i = 0; i < 5; i++) {
        doodle(g, box(B(18) + 300 + i * 190, G - LINE * (7 + (i % 2) * 2), 150, LINE * (7 + (i % 2) * 2)),
          431 + i, '#8d7a6a', { w: 3, slop: 3 });
      }
      // Two lines of figures, and the space between them.
      crowd(g, B(18) - 1080, 8, 620, 441, { h: LINE * 2.5, hat: 'monkey', skin: '#c98f5e', tail: true, face: 1, arms: 'up' });
      crowd(g, B(18) + 20, 5, 300, 443, { h: LINE * 2.5, hat: 'helm', robe: '#6e6a7d', face: -1, arms: 'out' });
      figure(g, { x: B(18) - 320, y: G, robe: C.blue, face: 1, seed: 445, holds: 'bow', h: LINE * 3.8 });
      // Ten heads, which is the whole of how this one is drawn.
      figure(g, { x: B(18) + 380, y: G, robe: '#4c4560', face: -1, seed: 447, heads: 9,
        h: LINE * 4.4, arms: 'out', hat: 'crown' });
      const k = (t * 0.7) % 1;
      arrow(g, B(18) - 200 + k * 700, G - LINE * 4.5 - Math.sin(k * Math.PI) * LINE * 2, LINE * 1.8, 0.12, 449);
      card(g, B(18) - 330, -LINE * 12.6, 640, [
        'Almost everybody in it dies.', 'Ravana is not a fool and not a',
        'monster: he is a scholar and a', 'king who could not be talked out', 'of one thing.',
      ], 451);
    },
  },

  // ─────────────────────────────────────────────────────── 20 · the lamps
  {
    id: 'lamps', at: B(19), w: 2100, title: 'On the day they said they would',
    draw: (g, t) => {
      ground(g, B(19) - 1050, B(19) + 1050, '#6b5f7a');
      sky(g, B(19), 708, true, t); // SKY
      moon(g, B(19) + 700, -LINE * 13, LINE * 1.6, 461);
      for (let i = 0; i < 7; i++) {
        const x = B(19) - 960 + i * 300;
        const h = LINE * (5.5 + (i % 3) * 1.4);
        doodle(g, box(x, G - h, 220, h), 463 + i, i % 2 ? C.pink : C.kraft, { w: 3.4, slop: 3 });
        doodle(g, box(x + 70, G - h * 0.62, 80, h * 0.3), 471 + i, C.gold, { w: 2.4, slop: 2, shadow: false });
        flame(g, x + 110, G - h - LINE * 0.1, LINE * 0.5 * flick(t, 6 + i, 1.4), 479 + i);
      }
      for (let i = 0; i < 10; i++) {
        flame(g, B(19) - 800 + i * 190, G - LINE * 0.1, LINE * 0.42 * flick(t, 7 + i * 0.6, 1.5), 491 + i);
      }
      figure(g, { x: B(19) + 180, y: G - LINE * 0.2, hat: 'crown', robe: C.blue, face: 1, seed: 501 });
      figure(g, { x: B(19) + 300, y: G - LINE * 0.2, h: LINE * 3.1, hat: 'veil', robe: C.pink, face: 1, seed: 503 });
      figure(g, { x: B(19) + 420, y: G - LINE * 0.2, hat: 'knot', robe: C.green, face: 1, seed: 505 });
      card(g, B(19) - 330, -LINE * 12.6, 640, [
        'The city has counted every one of', 'those days. It puts a lamp in',
        'every window so that the road in', 'is lit the whole way.',
      ], 507);
    },
  },
];

// ─────────────────────────────────────────────────── a few bigger doodles

function deer(
  g: CanvasRenderingContext2D, x: number, y: number, h: number, seed: number,
  colour: string, golden = false,
) {
  const body: Pt[] = [
    [x - h * 0.5, y - h * 0.5], [x - h * 0.2, y - h * 0.72], [x + h * 0.25, y - h * 0.7],
    [x + h * 0.5, y - h * 0.52], [x + h * 0.44, y - h * 0.3], [x - h * 0.44, y - h * 0.32],
  ];
  doodle(g, loop(body, 7), seed, colour, { w: h * 0.05, slop: h * 0.03 });
  const neck: Pt[] = [
    [x + h * 0.38, y - h * 0.66], [x + h * 0.62, y - h * 1.0], [x + h * 0.78, y - h * 1.02],
    [x + h * 0.58, y - h * 0.62],
  ];
  doodle(g, loop(neck, 6), seed + 3, colour, { w: h * 0.045, slop: 2, shadow: false });
  doodle(g, loop([[x + h * 0.62, y - h * 1.04], [x + h * 0.95, y - h * 1.14],
    [x + h * 1.0, y - h * 0.98], [x + h * 0.66, y - h * 0.92]], 6), seed + 5, colour,
    { w: h * 0.04, slop: 2, shadow: false });
  for (const s of [0, 1]) {
    pen(g, [[x + h * (0.68 + s * 0.08), y - h * 1.1], [x + h * (0.66 + s * 0.1), y - h * 1.45],
      [x + h * (0.82 + s * 0.1), y - h * 1.62]], seed + 7 + s, { w: h * 0.035, passes: 1 });
    pen(g, [[x + h * (0.67 + s * 0.09), y - h * 1.3], [x + h * (0.48 + s * 0.09), y - h * 1.44]],
      seed + 11 + s, { w: h * 0.03, passes: 1 });
  }
  for (const [i, u] of [-0.36, -0.2, 0.2, 0.36].entries()) {
    pen(g, [[x + h * u, y - h * 0.34], [x + h * (u + (i % 2 ? 0.05 : -0.04)), y]], seed + 15 + i,
      { w: h * 0.04, passes: 1 });
  }
  g.save();
  g.fillStyle = '#2b2b2f';
  g.beginPath();
  g.arc(x + h * 0.84, y - h * 1.06, h * 0.035, 0, Math.PI * 2);
  g.fill();
  g.restore();
  if (golden) {
    const r = rng(seed + 21);
    for (let i = 0; i < 10; i++) {
      const sx = x + (r() - 0.5) * h * 1.6;
      const sy = y - h * (0.3 + r() * 1.1);
      pen(g, [[sx - 8, sy], [sx + 8, sy]], seed + 30 + i, { w: 2.4, passes: 1, colour: '#f2d97a', overshoot: 0 });
      pen(g, [[sx, sy - 8], [sx, sy + 8]], seed + 40 + i, { w: 2.4, passes: 1, colour: '#f2d97a', overshoot: 0 });
    }
  }
}

function bird(g: CanvasRenderingContext2D, x: number, y: number, h: number, seed: number) {
  const body: Pt[] = [
    [x - h * 0.6, y - h * 0.1], [x - h * 0.3, y - h * 0.42], [x + h * 0.3, y - h * 0.4],
    [x + h * 0.55, y - h * 0.16], [x + h * 0.2, y + h * 0.02], [x - h * 0.4, y + h * 0.02],
  ];
  doodle(g, loop(body, 7), seed, '#8a6a4e', { w: h * 0.04, slop: h * 0.02 });
  // A wing, out flat on the road.
  doodle(g, loop([[x - h * 0.2, y - h * 0.34], [x - h * 0.9, y - h * 0.2],
    [x - h * 0.95, y - h * 0.06], [x - h * 0.2, y - h * 0.12]], 6), seed + 3, '#6f543d',
    { w: h * 0.03, slop: 2, shadow: false });
  doodle(g, loop(ring(x + h * 0.6, y - h * 0.38, h * 0.16, 9, 1, seed), 6), seed + 5, '#8a6a4e',
    { w: h * 0.035, slop: 2, shadow: false });
  pen(g, [[x + h * 0.74, y - h * 0.38], [x + h * 0.94, y - h * 0.33], [x + h * 0.74, y - h * 0.3]],
    seed + 7, { w: h * 0.03, passes: 1, close: true, overshoot: 0 });
  g.save();
  g.fillStyle = '#2b2b2f';
  g.beginPath();
  g.arc(x + h * 0.64, y - h * 0.42, h * 0.03, 0, Math.PI * 2);
  g.fill();
  g.restore();
}

function chariot(g: CanvasRenderingContext2D, x: number, y: number, h: number, seed: number, t: number) {
  const drift = Math.sin(t * 0.9) * 6;
  doodle(g, box(x - h * 0.9, y + drift, h * 1.8, h * 0.8), seed, '#4c4560', { w: h * 0.05, slop: 3 });
  for (const s of [-1, 1]) {
    doodle(g, loop(ring(x + s * h * 0.6, y + h * 0.9 + drift, h * 0.3, 10, 1, seed + s), 7), seed + 3 + s,
      '#3a3448', { w: h * 0.04, slop: 2, shadow: false });
  }
  figure(g, { x, y: y + drift, h: h * 1.5, robe: '#4c4560', hat: 'crown', heads: 5, face: -1, seed: seed + 9, arms: 'out' });
  const r = rng(seed + 11);
  for (let i = 0; i < 7; i++) {
    const cx = x - h * (1.2 + i * 0.4);
    const cy = y + h * (0.3 + r() * 0.8) + drift;
    pen(g, [[cx, cy], [cx - h * 0.35, cy + h * 0.06]], seed + 20 + i,
      { w: 3, passes: 1, colour: 'rgba(76,69,96,0.55)', overshoot: 0 });
  }
}
