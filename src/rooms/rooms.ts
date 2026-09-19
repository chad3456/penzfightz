import { arch, claude, fire, ground, hill, lamp, person, pot, shelf, table, tree } from './kit';
import { box, glow, panel, patch, room, type View } from './iso';
import type { Ink, Press } from './riso';

/**
 * Twenty-five rooms of the Ramayana, and one rule about the light in them.
 *
 * ── The rule ─────────────────────────────────────────────────────────────
 *
 * Claude is in every room and does nothing in any of them. It sits with
 * whoever in that room is alone — the king who cannot say the word, the woman
 * under the tree, the bird bleeding on the road — and it never speaks to them,
 * never hands them anything, never opens a door. Nothing in the epic happens
 * differently because it is there.
 *
 * That is a deliberate limit and it is the whole idea. Putting a helper into
 * the Ramayana would make it a story about the helper; keeping company is a
 * real thing to do and a different thing from being a character. So each room
 * names who is alone in it, and the light is placed beside that person.
 *
 * ── On the source ────────────────────────────────────────────────────────
 *
 * The Ramayana is scripture to a great many people and a living text in dozens
 * of tellings that disagree with each other. These twenty-five are scenes, not
 * doctrine: the beats most tellings share, written plainly, with nothing
 * invented for effect and nothing settled that the tradition leaves open.
 */

export type Kanda = 'Bala' | 'Ayodhya' | 'Aranya' | 'Kishkindha' | 'Sundara' | 'Yuddha';

export interface Room {
  n: number;
  kanda: Kanda;
  title: string;
  /** The place, as a caption. */
  where: string;
  /** What happens here. */
  line: string;
  /** Who is alone, and why the light is sitting with them. */
  company: string;
  w: number;
  d: number;
  wallH: number;
  build: (p: Press, v: View) => void;
}

// ── small shared pieces ──────────────────────────────────────────────────

const hall = (p: Press, v: View, w: number, d: number, h: number, floor: Ink = 'navy', wall: Ink = 'rose') =>
  room(p, v, w, d, h, floor, wall, 0.52, 0.34);

/** A run of window openings punched along the back-right wall. */
const windows = (p: Press, v: View, from: number, n: number, gap: number, y = 1.4) => {
  for (let i = 0; i < n; i++) {
    panel(p, 'mustard', v, from + i * gap, y, 0.02, 0.55, 0.85, 0.55, 'x');
    panel(p, 'navy', v, from + i * gap, y, 0.015, 0.55, 0.85, 0.2, 'x');
  }
};

/** Pillars down one side, which is what makes an interior a hall. */
const colonnade = (p: Press, v: View, z: number, from: number, n: number, gap: number, h: number) => {
  for (let i = 0; i < n; i++) {
    box(p, 'rose', v, from + i * gap, 0, z, 0.26, h, 0.26, { top: 0.4, left: 0.6, right: 0.8 });
    box(p, 'brick', v, from + i * gap - 0.05, h, z - 0.05, 0.36, 0.16, 0.36, { top: 0.4, left: 0.62, right: 0.8 });
  }
};

const mat = (p: Press, v: View, x: number, z: number, w: number, d: number, ink: Ink = 'teal') =>
  patch(p, ink, v, x, z, w, d, 0.42);

const trees = (p: Press, v: View, spots: [number, number, number][]) => {
  for (const [x, z, h] of spots) tree(p, v, x, z, h);
};

const strew = (p: Press, v: View, ink: Ink, n: number, w: number, d: number, seed = 1) => {
  for (let i = 0; i < n; i++) {
    const x = ((i * 47 + seed * 13) % 97) / 97 * w;
    const z = ((i * 71 + seed * 29) % 89) / 89 * d;
    box(p, ink, v, x, 0, z, 0.18, 0.06, 0.18, { top: 0.4, left: 0.6, right: 0.7 });
  }
};

// ── the rooms ────────────────────────────────────────────────────────────

export const ROOMS: Room[] = [
  {
    n: 1, kanda: 'Bala', title: 'The Fire Hall', where: 'Ayodhya, before any of it',
    line: 'A king with three queens, four palaces and no son pays for a sacrifice, and out of the fire comes a bowl of payasam to divide among them.',
    company: 'Dasharatha, who has been given everything in the correct order and is still standing in a hall at night asking for one more thing.',
    w: 7, d: 6, wallH: 3.2,
    build: (p, v) => {
      hall(p, v, 7, 6, 3.2);
      colonnade(p, v, 0.5, 1, 4, 1.5, 2.8);
      windows(p, v, 1.2, 3, 1.8, 1.5);
      fire(p, v, 3.5, 3.2, 0.9);
      person(p, v, { x: 2.2, z: 3.4, hat: 'crown', ink: 'navy' });
      person(p, v, { x: 4.6, z: 2.4, pose: 'kneel', ink: 'brick' });
      person(p, v, { x: 4.9, z: 4.2, pose: 'kneel', ink: 'brick' });
      pot(p, v, 6.3, 5.2);
      claude(p, v, 1.5, 4.6);
    },
  },
  {
    n: 2, kanda: 'Bala', title: 'The Nursery', where: 'Four boys, one of them everybody’s',
    line: 'Rama, Bharata, Lakshmana and Shatrughna. Lakshmana will not sleep unless he can see Rama, and this is never once explained.',
    company: 'Kaikeyi, watching from the doorway, loving the wrong boy the right amount and not yet knowing what it will cost.',
    w: 6, d: 6, wallH: 2.8,
    build: (p, v) => {
      hall(p, v, 6, 6, 2.8, 'teal', 'rose');
      windows(p, v, 1.4, 2, 2.2, 1.3);
      mat(p, v, 1.6, 1.8, 3, 2.6, 'mustard');
      for (const [x, z] of [[2, 2.2], [2.8, 2.6], [3.6, 2.2], [3.4, 3.4]] as const) {
        person(p, v, { x, z, h: 0.9, pose: 'sit', ink: 'navy' });
      }
      person(p, v, { x: 0.7, z: 4.9, hat: 'veil', ink: 'brick' });
      pot(p, v, 5.4, 1.1);
      lamp(p, v, 2.8, 2.6, 1.9);
      claude(p, v, 1.4, 4.4, 0.52);
    },
  },
  {
    n: 3, kanda: 'Bala', title: 'The Bow', where: 'Mithila, the armoury',
    line: 'Janaka keeps a bow no one can lift. One afternoon his small daughter moves it aside to get at a ball, and he decides on the spot who she will marry.',
    company: 'Janaka, who has just understood something about his own child and has nobody in the room to say it to.',
    w: 6, d: 5, wallH: 3,
    build: (p, v) => {
      hall(p, v, 6, 5, 3, 'navy', 'teal');
      shelf(p, v, 0.4, 0.06, 4.6, 'x', 'brick');
      box(p, 'mustard', v, 2.2, 0.1, 2.4, 2.4, 0.16, 0.3, { top: 0.5, left: 0.7, right: 0.85 });
      person(p, v, { x: 3.4, z: 2.1, h: 0.85, ink: 'rose' });
      person(p, v, { x: 1.4, z: 3.6, hat: 'crown', ink: 'navy' });
      windows(p, v, 0.6, 2, 2, 1.6);
      claude(p, v, 5.1, 3.9);
    },
  },
  {
    n: 4, kanda: 'Bala', title: 'The Pavilion', where: 'The wedding, and four of them at once',
    line: 'The bow is strung and broken. Four brothers marry four sisters on one afternoon and the whole thing is, for a while, simply happy.',
    company: 'Nobody, for once. The light sits at the edge of the mandapa and is not needed.',
    w: 7, d: 7, wallH: 2.4,
    build: (p, v) => {
      hall(p, v, 7, 7, 2.4, 'rose', 'mustard');
      arch(p, v, 2.2, 2.4, 2.8, 2, 'brick');
      fire(p, v, 3.5, 3.4, 0.6);
      for (const [x, z, k] of [[2.6, 3.0, 'crown'], [4.3, 3.0, 'veil'], [2.6, 4.2, 'knot'], [4.3, 4.2, 'veil']] as const) {
        person(p, v, { x, z, hat: k as 'crown', ink: k === 'veil' ? 'brick' : 'navy' });
      }
      for (const [x, z] of [[1.1, 1.6], [5.8, 1.4], [1.3, 5.9], [6.0, 5.6]] as const) person(p, v, { x, z, h: 1.5, ink: 'teal' });
      strew(p, v, 'mustard', 16, 7, 7, 3);
      claude(p, v, 6.3, 6.4, 0.5);
    },
  },
  {
    n: 5, kanda: 'Ayodhya', title: 'The Small Room', where: 'Kaikeyi’s chamber, the night before',
    line: 'Manthara does not invent anything. She only says the true things in an order that makes a good woman afraid, and then waits.',
    company: 'Kaikeyi, being slowly talked out of herself, which is a thing that happens to people in rooms this size.',
    w: 5, d: 5, wallH: 2.8,
    build: (p, v) => {
      hall(p, v, 5, 5, 2.8, 'navy', 'brick');
      mat(p, v, 1.3, 1.4, 2.4, 2.2, 'rose');
      person(p, v, { x: 2.0, z: 2.2, pose: 'sit', hat: 'veil', ink: 'rose' });
      person(p, v, { x: 3.1, z: 2.6, pose: 'sit', h: 1.4, ink: 'navy' });
      lamp(p, v, 2.5, 2.3, 1.8);
      pot(p, v, 4.4, 0.7);
      claude(p, v, 1.0, 4.2, 0.5);
    },
  },
  {
    n: 6, kanda: 'Ayodhya', title: 'The Throne Room', where: 'Two boons, called in',
    line: 'She asks for the coronation to go to Bharata and for Rama to go to the forest for fourteen years. The king has promised. The king says nothing at all.',
    company: 'Dasharatha, who is the most powerful person in the room and cannot make a sound.',
    w: 8, d: 6, wallH: 3.6,
    build: (p, v) => {
      hall(p, v, 8, 6, 3.6, 'rose', 'navy');
      colonnade(p, v, 0.5, 1.2, 5, 1.5, 3.1);
      box(p, 'mustard', v, 5.8, 0, 2.2, 1.3, 0.7, 1.3, { top: 0.45, left: 0.68, right: 0.85 });
      person(p, v, { x: 6.2, z: 2.6, pose: 'sit', hat: 'crown', ink: 'navy' });
      person(p, v, { x: 4.0, z: 3.4, hat: 'veil', ink: 'brick' });
      person(p, v, { x: 2.3, z: 2.0, h: 1.6, ink: 'teal' });
      person(p, v, { x: 2.5, z: 4.4, h: 1.6, ink: 'teal' });
      claude(p, v, 7.2, 5.0);
    },
  },
  {
    n: 7, kanda: 'Ayodhya', title: 'The Ornaments', where: 'Rama’s rooms, the same hour',
    line: 'He takes off the things a prince wears, puts on bark, and does not argue once. Sita refuses to be left. Lakshmana was never going to be asked.',
    company: 'Rama, in the ten minutes between being one thing and being another.',
    w: 5, d: 5, wallH: 2.9,
    build: (p, v) => {
      hall(p, v, 5, 5, 2.9, 'teal', 'rose');
      table(p, v, 2.6, 1.0, 1.6, 0.9, 'brick');
      strew(p, v, 'mustard', 7, 4.4, 2.2, 5);
      person(p, v, { x: 1.7, z: 2.6, ink: 'navy' });
      person(p, v, { x: 2.7, z: 3.6, hat: 'veil', ink: 'brick' });
      person(p, v, { x: 3.7, z: 2.9, hat: 'knot', ink: 'teal' });
      windows(p, v, 0.7, 2, 1.9, 1.5);
      claude(p, v, 0.9, 4.3, 0.5);
    },
  },
  {
    n: 8, kanda: 'Ayodhya', title: 'The Gate', where: 'The road out, and the city on it',
    line: 'Ayodhya follows them to the river and will not turn back, so the three of them get up in the dark and go on without waking anybody.',
    company: 'The city, which has come this far in its night clothes and will have to walk home.',
    w: 8, d: 5, wallH: 1.2,
    build: (p, v) => {
      room(p, v, 8, 5, 1.2, 'mustard', 'brick', 0.34, 0.5);
      arch(p, v, 0.6, 0.4, 2.2, 2.4, 'brick');
      ground(p, v, 'navy', 3.2, 0.4, 4.6, 4.2, 0.3);
      for (let i = 0; i < 14; i++) {
        person(p, v, { x: 1.2 + (i % 5) * 0.5, z: 1.2 + Math.floor(i / 5) * 0.9, h: 1.4, ink: 'teal' });
      }
      person(p, v, { x: 6.4, z: 3.2, ink: 'navy' });
      person(p, v, { x: 6.9, z: 3.8, hat: 'veil', ink: 'brick' });
      person(p, v, { x: 7.3, z: 2.7, hat: 'knot', ink: 'teal' });
      claude(p, v, 4.6, 1.0, 0.5);
    },
  },
  {
    n: 9, kanda: 'Ayodhya', title: 'The Ferry', where: 'Guha’s hut on the Ganga',
    line: 'A boatman of no standing gives the heir to Ayodhya the only things he owns: a crossing, a fire, and somewhere to put his head.',
    company: 'Guha, who lies awake all night guarding three people who do not need guarding, because it is the one thing left he can give.',
    w: 6, d: 6, wallH: 1.6,
    build: (p, v) => {
      room(p, v, 6, 6, 1.6, 'brick', 'teal', 0.4, 0.44);
      ground(p, v, 'teal', 0, 3.6, 6, 2.4, 0.4, true);
      box(p, 'brick', v, 1.6, 0.06, 4.2, 2.6, 0.22, 0.7, { top: 0.55, left: 0.75, right: 0.9 });
      fire(p, v, 3.4, 2.2, 0.6);
      person(p, v, { x: 2.6, z: 1.6, pose: 'lie', ink: 'navy' });
      person(p, v, { x: 3.2, z: 1.1, pose: 'lie', ink: 'brick' });
      person(p, v, { x: 4.4, z: 2.6, pose: 'sit', hat: 'knot', ink: 'teal' });
      person(p, v, { x: 1.2, z: 2.8, ink: 'brick' });
      claude(p, v, 0.9, 1.4, 0.5);
    },
  },
  {
    n: 10, kanda: 'Ayodhya', title: 'The Sandals', where: 'Chitrakuta',
    line: 'Bharata walks into the forest with an army to bring his brother home and is refused. He takes a pair of wooden sandals instead and puts them on the throne.',
    company: 'Bharata, going back to rule a kingdom he never wanted on behalf of a man who will not come.',
    w: 7, d: 6, wallH: 1,
    build: (p, v) => {
      room(p, v, 7, 6, 1, 'teal', 'navy', 0.36, 0.4);
      hill(p, v, 1.4, 0.6, 5, 3);
      trees(p, v, [[0.8, 4.6, 2.4], [6.2, 1.2, 2.6], [5.6, 5.2, 2.2]]);
      box(p, 'mustard', v, 3.1, 0.06, 2.9, 0.5, 0.14, 0.34, { top: 0.4, left: 0.6, right: 0.75 });
      person(p, v, { x: 2.3, z: 2.6, ink: 'navy' });
      person(p, v, { x: 4.2, z: 3.2, pose: 'bow', hat: 'crown', ink: 'brick' });
      for (let i = 0; i < 6; i++) person(p, v, { x: 5.4 + (i % 3) * 0.4, z: 4.2 + Math.floor(i / 3) * 0.5, h: 1.4, ink: 'teal' });
      claude(p, v, 6.4, 2.4, 0.5);
    },
  },
  {
    n: 11, kanda: 'Aranya', title: 'Panchavati', where: 'The hut Lakshmana builds',
    line: 'Ten years pass here and almost nothing is recorded of them, which in a story this long is how you say that people were happy.',
    company: 'Nobody. The light waits outside by the water pot, because this is the last room in the poem where all three of them are fine.',
    w: 7, d: 7, wallH: 1,
    build: (p, v) => {
      room(p, v, 7, 7, 1, 'teal', 'navy', 0.34, 0.36);
      box(p, 'brick', v, 2.4, 0, 1.4, 2.6, 1.5, 2.2, { top: 0.42, left: 0.68, right: 0.86 });
      trees(p, v, [[0.9, 2.2, 2.8], [6.2, 1.6, 2.6], [1.1, 6.0, 2.4], [6.0, 5.8, 3.0]]);
      pot(p, v, 5.3, 3.4);
      fire(p, v, 4.6, 4.6, 0.5);
      person(p, v, { x: 3.4, z: 4.4, pose: 'sit', ink: 'navy' });
      person(p, v, { x: 4.1, z: 5.0, pose: 'sit', hat: 'veil', ink: 'brick' });
      person(p, v, { x: 2.0, z: 4.8, hat: 'knot', ink: 'teal' });
      claude(p, v, 5.9, 2.9, 0.48);
    },
  },
  {
    n: 12, kanda: 'Aranya', title: 'The Doorway', where: 'Shurpanakha asks',
    line: 'Ravana’s sister asks Rama to marry her, is sent to Lakshmana, is sent back, and is finally disfigured for the asking. Everything after this is the consequence.',
    company: 'Shurpanakha, afterwards, on the path — the only person in the poem whose humiliation nobody records the feeling of.',
    w: 6, d: 6, wallH: 1,
    build: (p, v) => {
      room(p, v, 6, 6, 1, 'teal', 'navy', 0.34, 0.36);
      box(p, 'brick', v, 1.6, 0, 1.0, 2.4, 1.5, 2.0, { top: 0.42, left: 0.68, right: 0.86 });
      trees(p, v, [[5.4, 1.4, 2.6], [0.8, 4.9, 2.4], [5.2, 5.4, 2.2]]);
      person(p, v, { x: 2.6, z: 3.3, ink: 'navy' });
      person(p, v, { x: 3.5, z: 3.9, hat: 'knot', ink: 'teal' });
      person(p, v, { x: 4.6, z: 3.0, hat: 'veil', ink: 'rose' });
      claude(p, v, 1.2, 5.3, 0.5);
    },
  },
  {
    n: 13, kanda: 'Aranya', title: 'The Treeline', where: 'A deer made of gold',
    line: 'It is the wrong colour for a deer and it is too beautiful and she asks for it anyway, because she has lived in a hut for ten years and wanted one lovely thing.',
    company: 'Sita, in the moment of asking — which the poem will make her pay for longer than anybody else pays for anything.',
    w: 7, d: 6, wallH: 1,
    build: (p, v) => {
      room(p, v, 7, 6, 1, 'teal', 'navy', 0.33, 0.36);
      trees(p, v, [[0.9, 1.4, 2.8], [1.6, 4.9, 2.6], [6.2, 1.2, 2.4], [5.9, 5.0, 2.8], [3.4, 0.7, 2.2]]);
      box(p, 'brick', v, 0.8, 0, 2.6, 1.8, 1.3, 1.6, { top: 0.42, left: 0.68, right: 0.86 });
      glow(p, 'mustard', v, 5.0, 0, 3.0, 1.6, 0.46);
      box(p, 'mustard', v, 4.85, 0.3, 2.9, 0.5, 0.36, 0.22, { top: 0.35, left: 0.5, right: 0.62 });
      box(p, 'mustard', v, 5.2, 0.62, 2.95, 0.16, 0.24, 0.12, { top: 0.35, left: 0.5, right: 0.6 });
      person(p, v, { x: 3.0, z: 3.3, hat: 'veil', ink: 'brick' });
      person(p, v, { x: 2.2, z: 4.1, ink: 'navy' });
      claude(p, v, 1.5, 5.2, 0.48);
    },
  },
  {
    n: 14, kanda: 'Aranya', title: 'The Line', where: 'Drawn across the doorway',
    line: 'A cry for help in Rama’s voice. Lakshmana knows it is a trick and is accused of wanting his brother dead, so he draws a line, says do not cross it, and goes.',
    company: 'Lakshmana, made to choose between two ways of failing her, walking away from the one he picked.',
    w: 6, d: 6, wallH: 1,
    build: (p, v) => {
      room(p, v, 6, 6, 1, 'teal', 'navy', 0.33, 0.36);
      box(p, 'brick', v, 1.4, 0, 1.2, 2.4, 1.5, 2.0, { top: 0.42, left: 0.68, right: 0.86 });
      patch(p, 'mustard', v, 1.2, 3.4, 2.9, 0.12, 0.85);
      person(p, v, { x: 2.5, z: 2.9, hat: 'veil', ink: 'brick' });
      person(p, v, { x: 4.4, z: 4.6, hat: 'knot', ink: 'teal' });
      person(p, v, { x: 5.2, z: 2.1, pose: 'bow', h: 1.6, ink: 'rose' });
      trees(p, v, [[0.7, 4.8, 2.4], [5.6, 5.3, 2.2]]);
      claude(p, v, 1.0, 5.4, 0.48);
    },
  },
  {
    n: 15, kanda: 'Aranya', title: 'The Road', where: 'Where Jatayu came down',
    line: 'An old vulture, too old for this, goes up against Ravana’s chariot for a woman he has no duty to, and is still alive when Rama finds him, and waits to say which way they went.',
    company: 'Jatayu, holding on for a message — the most useful anyone manages to be in this whole kanda.',
    w: 7, d: 5, wallH: 0.8,
    build: (p, v) => {
      room(p, v, 7, 5, 0.8, 'brick', 'navy', 0.34, 0.36);
      ground(p, v, 'navy', 0, 0, 7, 5, 0.26);
      box(p, 'navy', v, 3.0, 0.06, 2.0, 1.5, 0.3, 1.0, { top: 0.6, left: 0.8, right: 0.9 });
      box(p, 'navy', v, 2.2, 0.1, 1.5, 1.2, 0.12, 0.5, { top: 0.55, left: 0.75, right: 0.85 });
      person(p, v, { x: 4.9, z: 2.6, pose: 'kneel', ink: 'navy' });
      person(p, v, { x: 5.6, z: 3.3, hat: 'knot', ink: 'teal' });
      trees(p, v, [[0.7, 4.3, 2.2], [6.5, 0.7, 2.0]]);
      claude(p, v, 2.1, 3.4, 0.52);
    },
  },
  {
    n: 16, kanda: 'Aranya', title: 'The Empty Hut', where: 'Panchavati, after',
    line: 'He comes back and there is nobody in it. For a long stretch of the poem the most powerful man alive goes from tree to tree asking them where she went.',
    company: 'Rama, who is about to be unbearable for several chapters and has earned it.',
    w: 6, d: 6, wallH: 1,
    build: (p, v) => {
      room(p, v, 6, 6, 1, 'teal', 'navy', 0.3, 0.34);
      box(p, 'brick', v, 1.8, 0, 1.6, 2.4, 1.5, 2.0, { top: 0.4, left: 0.66, right: 0.84 });
      trees(p, v, [[0.8, 4.4, 2.4], [5.4, 1.2, 2.6], [5.2, 5.2, 2.2]]);
      pot(p, v, 4.5, 3.2);
      person(p, v, { x: 3.2, z: 4.2, pose: 'kneel', ink: 'navy' });
      claude(p, v, 2.2, 5.0, 0.52);
    },
  },
  {
    n: 17, kanda: 'Kishkindha', title: 'The Cave Mouth', where: 'Rishyamukha, where Sugriva is hiding',
    line: 'A king thrown out by his own brother, living on a hill his brother is cursed not to climb, keeping a bundle of jewels a woman dropped out of the sky.',
    company: 'Sugriva, who has been frightened for so long that being offered help does not immediately register as help.',
    w: 6, d: 6, wallH: 1.2,
    build: (p, v) => {
      room(p, v, 6, 6, 1.2, 'navy', 'brick', 0.42, 0.5);
      hill(p, v, 1.6, 1.0, 4.4, 3.4);
      box(p, 'navy', v, 3.6, 0, 0.6, 1.8, 1.6, 1.4, { top: 0.6, left: 0.82, right: 0.94 });
      box(p, 'mustard', v, 2.4, 0.06, 3.4, 0.4, 0.12, 0.3, { top: 0.4, left: 0.6, right: 0.72 });
      person(p, v, { x: 3.1, z: 3.2, pose: 'sit', h: 1.5, ink: 'teal' });
      person(p, v, { x: 4.5, z: 4.0, h: 1.4, ink: 'teal' });
      person(p, v, { x: 1.7, z: 4.4, ink: 'navy' });
      claude(p, v, 5.1, 2.0, 0.5);
    },
  },
  {
    n: 18, kanda: 'Kishkindha', title: 'The Hall After', where: 'Kishkindha, Vali down',
    line: 'Rama shoots Vali from cover, which every telling has had to argue about since. Tara, widowed in one afternoon, says the sharpest things anybody says to Rama in the whole poem.',
    company: 'Tara, who is right, and whom the story then requires to be reasonable about it.',
    w: 7, d: 6, wallH: 3,
    build: (p, v) => {
      hall(p, v, 7, 6, 3, 'brick', 'navy');
      colonnade(p, v, 0.5, 1.2, 4, 1.5, 2.5);
      person(p, v, { x: 3.2, z: 3.0, pose: 'lie', h: 1.7, ink: 'navy' });
      person(p, v, { x: 3.0, z: 3.9, pose: 'kneel', hat: 'veil', ink: 'rose' });
      person(p, v, { x: 5.2, z: 2.2, ink: 'navy' });
      person(p, v, { x: 5.6, z: 4.4, h: 1.5, ink: 'teal' });
      claude(p, v, 1.4, 4.6, 0.52);
    },
  },
  {
    n: 19, kanda: 'Kishkindha', title: 'The Southern Cliff', where: 'The search runs out of land',
    line: 'The party sent south reaches the end of the world, finds no Sita, and sits down to starve rather than go back having failed. Then somebody mentions what Hanuman can do.',
    company: 'Angada, who has led them to the edge and cannot think of the next thing, which is its own kind of alone.',
    w: 7, d: 6, wallH: 0.6,
    build: (p, v) => {
      room(p, v, 7, 6, 0.6, 'navy', 'teal', 0.4, 0.4);
      ground(p, v, 'teal', 0, 3.8, 7, 2.2, 0.42, true);
      hill(p, v, 1.2, 1.4, 3, 2.2);
      for (let i = 0; i < 9; i++) {
        person(p, v, { x: 2.4 + (i % 3) * 0.7, z: 1.4 + Math.floor(i / 3) * 0.8, h: 1.4, pose: 'sit', ink: 'teal' });
      }
      person(p, v, { x: 5.6, z: 2.6, h: 1.6, ink: 'navy' });
      claude(p, v, 6.2, 1.1, 0.5);
    },
  },
  {
    n: 20, kanda: 'Sundara', title: 'The Headland', where: 'Before the leap',
    line: 'Hanuman can cross a hundred leagues of sea and has forgotten it. He has to be reminded what he is by somebody standing next to him, and then he grows until the cliff is small.',
    company: 'Hanuman, in the last quiet moment before the most famous jump in the language.',
    w: 6, d: 6, wallH: 0.5,
    build: (p, v) => {
      room(p, v, 6, 6, 0.5, 'navy', 'teal', 0.44, 0.38);
      ground(p, v, 'teal', 0, 2.6, 6, 3.4, 0.44, true);
      hill(p, v, 3.0, 1.2, 3.4, 2.6);
      person(p, v, { x: 3.0, z: 1.9, h: 2.2, hat: 'knot', ink: 'brick' });
      person(p, v, { x: 1.7, z: 2.2, h: 1.4, ink: 'teal' });
      person(p, v, { x: 4.4, z: 2.3, h: 1.4, ink: 'teal' });
      claude(p, v, 5.2, 1.0, 0.5);
    },
  },
  {
    n: 21, kanda: 'Sundara', title: 'The Ashoka Grove', where: 'Lanka, where she is kept',
    line: 'Ten months under a tree, guarded, asked once a month to reconsider, refusing every time. A monkey drops a ring into her lap and she has to decide whether to believe it.',
    company: 'Sita. The loneliest room in the poem, and the one the poem spends the least time inside.',
    w: 7, d: 7, wallH: 1.4,
    build: (p, v) => {
      room(p, v, 7, 7, 1.4, 'teal', 'rose', 0.32, 0.4);
      trees(p, v, [[2.6, 2.6, 3.2], [1.0, 1.2, 2.4], [5.8, 1.4, 2.6], [1.2, 5.8, 2.4], [5.9, 5.6, 2.8]]);
      person(p, v, { x: 2.9, z: 3.9, pose: 'sit', hat: 'veil', ink: 'brick' });
      for (const [x, z] of [[0.8, 3.4], [5.6, 3.6], [3.2, 6.2]] as const) {
        person(p, v, { x, z, h: 1.5, ink: 'navy' });
      }
      box(p, 'mustard', v, 3.3, 0.06, 4.1, 0.14, 0.06, 0.14, { top: 0.3, left: 0.4, right: 0.5 });
      claude(p, v, 2.1, 4.7, 0.52);
    },
  },
  {
    n: 22, kanda: 'Sundara', title: 'The Burning', where: 'Lanka, the tail',
    line: 'Caught and sentenced to have his tail set alight, he lets them do it, then walks the length of the city with it. The one part of the epic that is frankly having a wonderful time.',
    company: 'Nobody needs company here. The light sits on a rooftop and watches, like everyone else.',
    w: 7, d: 6, wallH: 2.6,
    build: (p, v) => {
      hall(p, v, 7, 6, 2.6, 'brick', 'navy');
      for (let i = 0; i < 5; i++) {
        box(p, 'rose', v, 0.6 + i * 1.3, 0, 0.7 + (i % 2) * 2.4, 0.9, 1.2 + (i % 3) * 0.5, 0.9,
          { top: 0.4, left: 0.62, right: 0.8 });
      }
      for (const [x, z] of [[1.4, 1.4], [3.6, 3.6], [5.4, 1.6], [2.6, 4.6]] as const) {
        glow(p, 'mustard', v, x, 0, z, 2.0, 0.44);
      }
      fire(p, v, 3.9, 2.4, 0.7);
      person(p, v, { x: 4.6, z: 3.4, h: 1.8, hat: 'knot', ink: 'brick' });
      for (let i = 0; i < 5; i++) person(p, v, { x: 1.0 + i * 0.5, z: 5.2, h: 1.4, ink: 'navy' });
      claude(p, v, 6.4, 5.4, 0.48);
    },
  },
  {
    n: 23, kanda: 'Yuddha', title: 'The Causeway', where: 'Stones on the water',
    line: 'An army of bears and monkeys builds a road across the sea. In the tellings people love best, the stones float because each one has a name written on it.',
    company: 'Nala, who is in charge of the impossible thing and will not be mentioned again once it works.',
    w: 8, d: 5, wallH: 0.4,
    build: (p, v) => {
      room(p, v, 8, 5, 0.4, 'teal', 'teal', 0.44, 0.44);
      ground(p, v, 'teal', 0, 0, 8, 5, 0.46, true);
      for (let i = 0; i < 11; i++) {
        box(p, 'navy', v, 0.4 + i * 0.66, 0.02, 2.0 + (i % 3) * 0.3, 0.55, 0.22, 0.55,
          { top: 0.5, left: 0.74, right: 0.88 });
      }
      for (let i = 0; i < 10; i++) {
        person(p, v, { x: 0.8 + i * 0.66, z: 1.2 + (i % 2) * 2.4, h: 1.4, ink: 'brick' });
      }
      claude(p, v, 7.3, 4.1, 0.5);
    },
  },
  {
    n: 24, kanda: 'Yuddha', title: 'The Field', where: 'Outside Lanka',
    line: 'It goes on for a very long time and almost everybody in it dies. Ravana is not a fool or a monster: he is a scholar and a king who could not be talked out of one thing.',
    company: 'Ravana, on the last morning, who has been told by his own brother, his own wife and his own advisors, and has heard all of it.',
    w: 8, d: 6, wallH: 2.2,
    build: (p, v) => {
      room(p, v, 8, 6, 2.2, 'brick', 'navy', 0.42, 0.44);
      for (let i = 0; i < 4; i++) {
        box(p, 'rose', v, 5.4 + (i % 2) * 1.4, 0, 0.5 + Math.floor(i / 2) * 1.6, 1.1, 1.8, 1.1,
          { top: 0.4, left: 0.64, right: 0.82 });
      }
      ground(p, v, 'navy', 0, 2.6, 5.2, 3.2, 0.28);
      for (let i = 0; i < 14; i++) {
        person(p, v, {
          x: 0.6 + (i % 7) * 0.62, z: 3.0 + Math.floor(i / 7) * 1.5, h: 1.4,
          pose: i % 4 === 0 ? 'lie' : 'stand', ink: i % 2 ? 'teal' : 'brick',
        });
      }
      person(p, v, { x: 6.4, z: 3.6, h: 2.1, hat: 'crown', ink: 'navy' });
      claude(p, v, 7.4, 5.2, 0.5);
    },
  },
  {
    n: 25, kanda: 'Yuddha', title: 'The Lamps', where: 'Ayodhya, the fourteenth year',
    line: 'They come home on the day they said they would. The city, which has counted every one of those days, puts a lamp in every window so that the road in is lit the whole way.',
    company: 'Everyone, briefly. The light is the smallest one on the sill and is not needed for illumination.',
    w: 8, d: 7, wallH: 2.6,
    build: (p, v) => {
      hall(p, v, 8, 7, 2.6, 'rose', 'navy');
      colonnade(p, v, 0.5, 1.0, 5, 1.4, 2.2);
      windows(p, v, 1.0, 4, 1.6, 1.3);
      for (let i = 0; i < 16; i++) {
        const x = 0.7 + (i % 8) * 0.95;
        const z = 1.3 + Math.floor(i / 8) * 4.4;
        glow(p, 'mustard', v, x, 0, z, 0.9, 0.44);
        box(p, 'mustard', v, x - 0.07, 0.02, z - 0.07, 0.14, 0.1, 0.14, { top: 0.3, left: 0.45, right: 0.55 });
      }
      person(p, v, { x: 3.6, z: 3.4, hat: 'crown', ink: 'navy' });
      person(p, v, { x: 4.3, z: 3.9, hat: 'veil', ink: 'brick' });
      person(p, v, { x: 3.0, z: 4.2, hat: 'knot', ink: 'teal' });
      for (let i = 0; i < 10; i++) person(p, v, { x: 1.2 + (i % 5) * 1.2, z: 5.8, h: 1.4, ink: 'teal' });
      claude(p, v, 6.9, 1.2, 0.46);
    },
  },
];

export const CLOSING =
  'The poem you have just walked through is the one two boys are taught to recite, in an ' +
  'ashram, by a poet who wrote it after watching a hunter shoot a bird. They sing it to their ' +
  'father without either side knowing who the other is. The Ramayana ends by telling you where ' +
  'the Ramayana came from, which is the oldest trick there is and still the best one.';
