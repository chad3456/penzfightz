import {
  arch, armchair, books, bookcase, candle, claude, clutter, colonnade, counter,
  dais, doorway, fire, flame, globe, hill, ladder, lamp, onWall, openBook,
  papers, person, plant, pot, rug, seat, table, tree, walker,
} from './kit';
import {
  blob, box, cone, floorPattern, panel, room, rule, slab, spark,
  type FloorPattern, type View,
} from './iso';
import type { Ink, Press } from './riso';

/**
 * Twenty-five rooms of the Ramayana, and one rule about the light in them.
 *
 * ── The rule ──────────────────────────────────────────────────────
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
 * ── On filling a room ────────────────────────────────────────────
 *
 * Every room here carries somewhere between thirty and eighty objects, and that
 * is not decoration. A room with eight things in it does not read as restrained,
 * it reads as unfinished — and the reference prints these are built against
 * are packed: every shelf has separate spines on it, every table has things on
 * it, and there is always something on the floor that somebody put down and did
 * not pick up. The clutter is what makes it somewhere people live rather than a
 * diagram of somewhere people live.
 *
 * ── On the source ────────────────────────────────────────────────
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
  /**
   * Everything that does not move: shell, furniture, shelves, trees, and the
   * people who are standing still. Drawn once and kept.
   */
  still: (p: Press, v: View) => void;
  /**
   * Everything that does: the light, every flame, and whoever is crossing the
   * floor. Redrawn from `v.t` on every frame, over the kept sheet, and holding
   * no state of its own — so a room can be drawn at any moment, and two rooms
   * never drift apart.
   */
  moving: (p: Press, v: View) => void;
}

/**
 * Floor, walls and what the floor is made of, in one call.
 *
 * Every room opens with this, and the floor pattern is not optional: a flat
 * floor makes everything standing on it look pasted on, and the texture is the
 * cheapest detail in the picture for the amount of work it does.
 */
function shell(
  p: Press, v: View, w: number, d: number, wallH: number,
  floorInk: Ink, wallInk: Ink,
  pattern: FloorPattern, patternInk: Ink, patternTone = 0.26, floorTone = 0.5,
) {
  /*
    Both of these were a third too strong. A floor at half coverage under a
    pattern at a third is two dot screens crossing at close density, and what it
    prints is not a floor, it is a texture — the room stops being legible before
    anything has even been put in it. Quieter floor, quieter pattern, and the
    furniture has somewhere to sit.
  */
  room(p, v, w, d, wallH, floorInk, wallInk, floorTone * 0.86, floorTone * 1.1);
  floorPattern(p, patternInk, v, w, d, pattern, patternTone * 0.72, pattern === 'tile' ? 0.9 : 0.42);
}

/*
   A note on the order things are drawn in.

   Solids knock out what is under them, so a room is painted back to front and
   bottom up: shell, then anything lying flat on the floor, then what stands on
   it, then people, then the light. Get it wrong and the failure is silent and
   total — a rug drawn after the altar it is under does not tint the altar, it
   erases it, and the picture simply comes back missing the thing the room is
   about.
*/
export const ROOMS: Room[] = [
  {
    n: 1, kanda: 'Bala', title: 'The Fire Hall', where: 'Ayodhya, before any of it',
    line:
      'A king with three queens, four palaces and no son pays for a sacrifice, and out of the fire comes a bowl of payasam to divide among them.',
    company:
      'Dasharatha, who has been given everything in the correct order and is still standing in a hall at night asking for one more thing.',
    w: 7, d: 6, wallH: 3.2,
    still: (p, v) => {

      // A hall at night, all fire and gold, and one man who has everything.
      shell(p, v, 7, 6, 3.2, 'navy', 'brick', 'tile', 'mustard', 0.34, 0.58);
      rug(p, v, 1.9, 1.7, 4.0, 3.8, 'teal', 0.3);
      // Hangings the height of the wall, because a palace wall is never bare
      // and a flat expanse of one ink is the fastest way to make a room look
      // like a diagram of a room.
      for (let i = 0; i < 5; i++) onWall(p, v, 0.45 + i * 1.32, 0.9, 0.9, 2.0, 'mustard', 'x', 0.5);
      for (let i = 0; i < 4; i++) onWall(p, v, 0.7 + i * 1.4, 0.9, 1.0, 2.0, 'rose', 'z', 0.5);
      colonnade(p, v, 1.3, 1.5, 3, 2.0, 3.0, 'rose');
      // A long offering table down the left, loaded.
      counter(p, v, 0.1, 1.0, 4.4, 'z', 'brick', 0.75);
      for (let i = 0; i < 7; i++) pot(p, v, 0.34, 1.3 + i * 0.6, 0.36, (['mustard','teal','rose'][i % 3]) as Ink);
      for (let i = 0; i < 5; i++) candle(p, v, 0.2, 0.75, 1.5 + i * 0.85, 'mustard');
      // The altar: a stepped square with the fire on top of it, big enough to
      // be the thing the room is about.
      dais(p, v, 2.6, 2.4, 2.6, 2.4, 3, 'rose');
      // Priests round three sides of it, all facing in.
      for (let i = 0; i < 8; i++) {
        const ring = [[2.0, 2.2], [2.0, 3.3], [2.1, 4.4], [3.2, 5.0], [4.4, 5.0], [5.4, 4.3], [5.5, 3.1], [5.4, 2.1]][i]!;
        person(p, v, {
          x: ring[0]!, z: ring[1]!, h: 1.35, hat: 'knot',
          ink: i % 2 ? 'teal' : 'mustard', hair: 'navy',
          pose: 'kneel', face: ring[0]! > 3.7 ? -1 : 1,
        });
      }
      // Him, standing outside the ring, and the three of them behind him.
      person(p, v, { x: 3.7, z: 5.6, hat: 'crown', ink: 'brick', hair: 'navy', h: 1.75, pose: 'bow', face: -1 });
      person(p, v, { x: 6.0, z: 5.5, hat: 'veil', ink: 'teal', hair: 'navy', h: 1.55, face: -1 });
      person(p, v, { x: 6.4, z: 4.6, hat: 'veil', ink: 'rose', hair: 'navy', h: 1.55, face: -1 });
      person(p, v, { x: 6.5, z: 3.5, hat: 'veil', ink: 'mustard', hair: 'navy', h: 1.55, face: -1 });
      // The bowl that comes out of the fire, waiting on its own stand.
      table(p, v, 5.9, 1.2, 0.8, 0.8, 'brick', 0.5);
      pot(p, v, 6.3, 1.6, 0.44, 'mustard');
      papers(p, v, 4.6, 1.3, 3, 21);
      books(p, v, 1.3, 0, 5.4, 4, 22);
      clutter(p, v, 7, 6, 8, 101);
    },
    moving: (p, v) => {
      fire(p, v, 3.4, 3.2, 1.6);
      claude(p, v, 2.2, 5.5, 0.5);
      walker(p, v, [1.2, 2.0], [1.3, 5.2], 9, { ink: 'teal', hair: 'navy', h: 1.5, robe: true });
      person(p, v, { x: 5.9, z: 1.9, h: 1.5, ink: 'mustard', hair: 'navy', pose: 'work', phase: (v.t / 1.4) % 1, face: -1 });
    },
  },
  {
    n: 2, kanda: 'Bala', title: 'The Nursery', where: 'Four boys, one of them everybody’s',
    line:
      'Rama, Bharata, Lakshmana and Shatrughna. Lakshmana will not sleep unless he can see Rama, and this is never once explained.',
    company:
      'Kaikeyi, watching from the doorway, loving the wrong boy the right amount and not yet knowing what it will cost.',
    w: 6, d: 6, wallH: 2.8,
    still: (p, v) => {

      // Four boys, too many toys, one door.
      shell(p, v, 6, 6, 2.8, 'rose', 'teal', 'check', 'navy', 0.22, 0.5);
      rug(p, v, 1.6, 1.8, 3.0, 2.8, 'teal', 0.34);
      bookcase(p, v, 0.4, 0.05, 2.6, 'x', 1.5, 'mustard', 22);
      onWall(p, v, 3.4, 1.4, 1.5, 1.0, 'mustard', 'x', 0.4);
      onWall(p, v, 3.6, 1.5, 1.2, 0.9, 'teal', 'z', 0.4);
      counter(p, v, 0.05, 0.6, 2.4, 'z', 'brick', 0.6);
      doorway(p, v, 5.0, 0.8, 1.6, true);
      for (let i = 0; i < 4; i++) {
        box(p, i % 2 ? 'brick' : 'rose', v, 1.0 + i * 1.1, 0, 4.7, 0.9, 0.3, 1.0);
      }
      person(p, v, { x: 1.3, z: 4.5, h: 1.0, ink: 'teal', hair: 'navy', pose: 'sit' });
      person(p, v, { x: 2.4, z: 4.5, h: 1.0, ink: 'mustard', hair: 'navy', pose: 'sit', face: -1 });
      person(p, v, { x: 3.5, z: 4.5, h: 1.0, ink: 'rose', hair: 'navy', pose: 'sit' });
      person(p, v, { x: 4.6, z: 4.5, h: 1.0, ink: 'brick', hair: 'navy', pose: 'sit', face: -1 });
      person(p, v, { x: 5.2, z: 1.0, hat: 'veil', ink: 'navy', h: 1.55, face: -1 });
      plant(p, v, 0.5, 5.2, 1.1, 'teal');
      books(p, v, 2.2, 0, 2.6, 4, 23);
      openBook(p, v, 3.6, 2.4);
      for (let i = 0; i < 5; i++) blob(p, i % 2 ? 'mustard' : 'brick', v, 1.2 + i * 0.8, 0.1, 3.3, 0.12, 0.12, 0.7);
      clutter(p, v, 6, 6, 9, 202);
    },
    moving: (p, v) => {
      claude(p, v, 4.9, 2.6, 0.48);
      walker(p, v, [1.2, 2.2], [4.8, 2.2], 8, { ink: 'rose', hair: 'navy', h: 1.0 });
      walker(p, v, [4.6, 5.2], [1.4, 5.2], 11, { ink: 'teal', hair: 'navy', h: 1.0 });
    },
  },
  {
    n: 3, kanda: 'Bala', title: 'The Bow', where: 'Mithila, the armoury',
    line:
      'Janaka keeps a bow no one can lift. One afternoon his small daughter moves it aside to get at a ball, and he decides on the spot who she will marry.',
    company:
      'Janaka, who has just understood something about his own child and has nobody in the room to say it to.',
    w: 6, d: 5, wallH: 3,
    still: (p, v) => {

      // An armoury, and a bow nobody is meant to be able to move.
      shell(p, v, 6, 5, 3.0, 'teal', 'navy', 'plank', 'mustard', 0.2, 0.55);
      bookcase(p, v, 0.4, 0.05, 2.2, 'x', 2.4, 'brick', 31);
      ladder(p, v, 1.9, 0.5, 2.1, 'brick');
      counter(p, v, 3.0, 0.06, 2.6, 'x', 'brick', 0.95);
      for (let i = 0; i < 7; i++) onWall(p, v, 3.1 + i * 0.36, 1.3, 0.16, 1.2, 'mustard', 'x', 0.6);
      counter(p, v, 0.06, 1.0, 3.2, 'z', 'teal', 0.8);
      // The bow itself, on a long low stand in the middle of the floor.
      box(p, 'brick', v, 1.6, 0, 2.6, 3.2, 0.34, 0.5);
      for (let i = 0; i < 9; i++) blob(p, 'mustard', v, 1.8 + i * 0.36, 0.5, 2.85, 0.09, 0.13, 0.85);
      rule(p, v, [1.7, 0.46, 2.85], [4.7, 0.46, 2.85], 1.1);
      person(p, v, { x: 1.2, z: 4.0, h: 0.85, ink: 'rose', hair: 'navy', pose: 'reach' });
      blob(p, 'mustard', v, 2.2, 0.12, 4.3, 0.13, 0.13, 0.8);
      person(p, v, { x: 5.0, z: 3.8, hat: 'crown', ink: 'navy', hair: 'brick', face: -1 });
      person(p, v, { x: 5.4, z: 1.4, hat: 'helm', ink: 'teal', pose: 'stand', face: -1 });
      globe(p, v, 0.7, 4.3, 0.55);
      plant(p, v, 5.5, 4.4, 1.0, 'teal');
      papers(p, v, 3.2, 4.4, 4, 33);
      clutter(p, v, 6, 5, 7, 303);
    },
    moving: (p, v) => {
      claude(p, v, 4.4, 4.5, 0.5);
      walker(p, v, [2.0, 4.4], [5.0, 4.4], 10, { ink: 'teal', hair: 'navy', h: 1.55, hat: 'knot' });
      person(p, v, { x: 1.2, z: 4.0, h: 0.9, ink: 'rose', hair: 'navy', pose: 'reach', phase: (v.t / 1.1) % 1 });
    },
  },
  {
    n: 4, kanda: 'Bala', title: 'The Pavilion', where: 'The wedding, and four of them at once',
    line:
      'The bow is strung and broken. Four brothers marry four sisters on one afternoon and the whole thing is, for a while, simply happy.',
    company:
      'Nobody, for once. The light sits at the edge of the mandapa and is not needed.',
    w: 7, d: 7, wallH: 2.4,
    still: (p, v) => {

      // A wedding pavilion: four couples, garlands, and nobody needing anything.
      shell(p, v, 7, 7, 2.4, 'rose', 'mustard', 'tile', 'brick', 0.24, 0.42);
      rug(p, v, 1.6, 2.2, 4.0, 3.4, 'teal', 0.34);
      colonnade(p, v, 0.8, 0.5, 5, 1.4, 2.2, 'teal');
      for (let i = 0; i < 6; i++) onWall(p, v, 0.5 + i * 1.1, 1.5, 0.7, 0.6, 'teal', 'x', 0.5);
      for (let i = 0; i < 5; i++) onWall(p, v, 0.8 + i * 1.2, 1.5, 0.7, 0.6, 'rose', 'z', 0.5);
      for (let i = 0; i < 4; i++) {
        const x = 1.5 + (i % 2) * 3.4;
        const z = 2.6 + Math.floor(i / 2) * 2.4;
        person(p, v, { x, z, hat: 'crown', ink: ['navy','teal','brick','rose'][i] as Ink, hair: 'navy', face: 1 });
        person(p, v, { x: x + 0.5, z: z + 0.25, hat: 'veil', ink: ['mustard','rose','teal','navy'][i] as Ink, h: 1.5, face: -1 });
      }
      for (let i = 0; i < 6; i++) candle(p, v, 0.7 + i * 1.1, 0, 6.3, 'mustard');
      for (let i = 0; i < 4; i++) pot(p, v, 6.3, 1.0 + i * 1.5, 0.45, i % 2 ? 'mustard' : 'brick');
      plant(p, v, 6.2, 6.2, 1.2, 'teal');
      plant(p, v, 0.5, 6.3, 1.0, 'teal');
      clutter(p, v, 7, 7, 10, 404);
    },
    moving: (p, v) => {
      fire(p, v, 3.2, 3.4, 1.2);
      claude(p, v, 6.3, 5.2, 0.44);
      walker(p, v, [1.0, 6.2], [6.0, 6.2], 13, { ink: 'mustard', hair: 'navy', h: 1.5, robe: true });
      walker(p, v, [6.3, 1.2], [6.3, 5.6], 10, { ink: 'teal', hair: 'navy', h: 1.45 });
    },
  },
  {
    n: 5, kanda: 'Ayodhya', title: 'The Small Room', where: 'Kaikeyi’s chamber, the night before',
    line:
      'Manthara does not invent anything. She only says the true things in an order that makes a good woman afraid, and then waits.',
    company:
      'Kaikeyi, being slowly talked out of herself, which is a thing that happens to people in rooms this size.',
    w: 5, d: 5, wallH: 2.8,
    still: (p, v) => {

      // A small room, two women, and a conversation that costs fourteen years.
      shell(p, v, 5, 5, 2.8, 'navy', 'brick', 'weave', 'teal', 0.26, 0.5);
      rug(p, v, 0.8, 2.8, 1.5, 1.6, 'teal', 0.3);
      bookcase(p, v, 0.35, 0.05, 1.8, 'x', 1.8, 'mustard', 51);
      onWall(p, v, 2.6, 1.5, 1.8, 1.0, 'mustard', 'x', 0.38);
      onWall(p, v, 0.8, 1.4, 1.4, 1.1, 'rose', 'z', 0.4);
      counter(p, v, 0.06, 2.8, 1.8, 'z', 'brick', 0.7);
      // A bed, which is the only furniture that matters here.
      box(p, 'rose', v, 2.6, 0, 2.6, 2.1, 0.42, 1.6);
      box(p, 'mustard', v, 2.7, 0.42, 2.7, 1.9, 0.14, 1.4);
      box(p, 'teal', v, 2.6, 0.42, 2.7, 0.5, 0.3, 0.6);
      lamp(p, v, 0.55, 1.2, 1.3, 'mustard');
      armchair(p, v, 1.0, 1.1, 'brick');
      person(p, v, { x: 3.1, z: 3.3, hat: 'veil', ink: 'rose', h: 1.5, pose: 'sit', face: -1 });
      person(p, v, { x: 1.9, z: 3.7, ink: 'navy', hair: 'navy', h: 1.35, pose: 'bow' });
      pot(p, v, 0.45, 4.3, 0.4, 'mustard');
      books(p, v, 1.5, 0, 1.6, 3, 52);
      papers(p, v, 3.9, 1.4, 4, 53);
      plant(p, v, 4.4, 4.4, 0.9, 'teal');
      clutter(p, v, 5, 5, 6, 505);
    },
    moving: (p, v) => {
      claude(p, v, 4.3, 2.4, 0.48);
      person(p, v, { x: 1.9, z: 3.7, ink: 'navy', hair: 'navy', h: 1.35, pose: 'work', phase: (v.t / 1.7) % 1 });
    },
  },
  {
    n: 6, kanda: 'Ayodhya', title: 'The Throne Room', where: 'Two boons, called in',
    line:
      'She asks for the coronation to go to Bharata and for Rama to go to the forest for fourteen years. The king has promised. The king says nothing at all.',
    company:
      'Dasharatha, who is the most powerful person in the room and cannot make a sound.',
    w: 8, d: 6, wallH: 3.6,
    still: (p, v) => {

      // The throne room. The most powerful person in it cannot make a sound.
      shell(p, v, 8, 6, 3.6, 'rose', 'navy', 'tile', 'mustard', 0.26, 0.62);
      rug(p, v, 2.2, 3.4, 3.6, 2.2, 'teal', 0.32);
      colonnade(p, v, 1.2, 0.55, 5, 1.4, 3.4, 'brick');
      for (let i = 0; i < 6; i++) onWall(p, v, 0.6 + i * 1.2, 2.0, 0.6, 1.2, 'mustard', 'x', 0.45);
      for (let i = 0; i < 4; i++) onWall(p, v, 0.9 + i * 1.3, 2.0, 0.8, 1.2, 'teal', 'z', 0.45);
      dais(p, v, 2.8, 1.0, 2.6, 2.0, 3, 'brick');
      box(p, 'mustard', v, 3.4, 0.54, 1.6, 1.0, 0.9, 0.9);
      person(p, v, { x: 3.7, z: 1.9, hat: 'crown', ink: 'brick', hair: 'navy', pose: 'sit', face: 1 });
      person(p, v, { x: 2.5, z: 3.9, hat: 'veil', ink: 'rose', h: 1.55 });
      for (let i = 0; i < 6; i++) {
        person(p, v, { x: 0.8 + i * 1.2, z: 5.3, hat: 'knot', ink: i % 2 ? 'navy' : 'teal', h: 1.45, face: -1 });
      }
      for (let i = 0; i < 4; i++) candle(p, v, 1.2 + i * 1.8, 0.54, 1.2, 'mustard');
      for (let i = 0; i < 3; i++) pot(p, v, 7.4, 1.4 + i * 1.6, 0.5, 'brick');
      papers(p, v, 5.6, 3.4, 5, 61);
      plant(p, v, 7.3, 5.2, 1.1, 'teal');
      clutter(p, v, 8, 6, 8, 606);
    },
    moving: (p, v) => {
      claude(p, v, 5.6, 1.6, 0.5);
      walker(p, v, [0.9, 4.6], [7.1, 4.6], 16, { ink: 'teal', hair: 'navy', h: 1.45, hat: 'knot' });
      person(p, v, { x: 2.5, z: 3.9, hat: 'veil', ink: 'rose', hair: 'navy', h: 1.55, pose: 'work', phase: (v.t / 2.2) % 1, robe: true });
    },
  },
  {
    n: 7, kanda: 'Ayodhya', title: 'The Ornaments', where: 'Rama’s rooms, the same hour',
    line:
      'He takes off the things a prince wears, puts on bark, and does not argue once. Sita refuses to be left. Lakshmana was never going to be asked.',
    company:
      'Rama, in the ten minutes between being one thing and being another.',
    w: 5, d: 5, wallH: 2.9,
    still: (p, v) => {

      // A prince's rooms in the ten minutes between being one thing and another.
      shell(p, v, 5, 5, 2.9, 'teal', 'rose', 'plank', 'navy', 0.2, 0.46);
      rug(p, v, 1.0, 3.4, 2.8, 1.4, 'teal', 0.3);
      bookcase(p, v, 0.4, 0.05, 2.0, 'x', 2.0, 'brick', 71);
      counter(p, v, 0.06, 0.6, 2.6, 'z', 'mustard', 0.8);
      onWall(p, v, 3.0, 1.6, 1.6, 1.0, 'mustard', 'x', 0.4);
      // Everything he is taking off, laid out on a low table.
      table(p, v, 1.4, 2.2, 2.0, 1.2, 'brick', 0.55);
      for (let i = 0; i < 7; i++) {
        blob(p, i % 2 ? 'mustard' : 'teal', v, 1.6 + (i % 4) * 0.45, 0.72, 2.4 + Math.floor(i / 4) * 0.5, 0.11, 0.11, 0.85);
      }
      books(p, v, 3.4, 0, 2.2, 5, 72);
      person(p, v, { x: 2.2, z: 3.9, ink: 'brick', hair: 'navy', h: 1.6, pose: 'work' });
      person(p, v, { x: 3.2, z: 4.1, hat: 'veil', ink: 'rose', h: 1.5, face: -1 });
      person(p, v, { x: 0.9, z: 4.2, hat: 'knot', ink: 'navy', h: 1.55 });
      lamp(p, v, 4.3, 1.0, 1.4, 'teal');
      pot(p, v, 4.4, 4.3, 0.42, 'mustard');
      papers(p, v, 3.9, 3.1, 3, 73);
      clutter(p, v, 5, 5, 7, 707);
    },
    moving: (p, v) => {
      claude(p, v, 0.7, 2.2, 0.48);
      walker(p, v, [0.9, 4.2], [4.2, 4.2], 9, { ink: 'navy', hair: 'navy', h: 1.55, hat: 'knot' });
      person(p, v, { x: 2.2, z: 3.9, ink: 'brick', hair: 'navy', h: 1.6, pose: 'work', phase: (v.t / 1.6) % 1 });
    },
  },
  {
    n: 8, kanda: 'Ayodhya', title: 'The Gate', where: 'The road out, and the city on it',
    line:
      'Ayodhya follows them to the river and will not turn back, so the three of them get up in the dark and go on without waking anybody.',
    company:
      'The city, which has come this far in its night clothes and will have to walk home.',
    w: 8, d: 5, wallH: 1.2,
    still: (p, v) => {

      // The gate, at night, with the whole city standing in it.
      shell(p, v, 8, 5, 1.2, 'mustard', 'brick', 'tile', 'navy', 0.22, 0.5);
      arch(p, v, 0.5, 0.3, 2.4, 2.4, 'brick');
      slab(p, 'navy', v, 3.0, 0.4, 4.6, 4.2, 0.28, 0.02);
      for (let i = 0; i < 5; i++) onWall(p, v, 3.4 + i * 0.9, 0.4, 0.5, 0.7, 'mustard', 'x', 0.45);
      for (let i = 0; i < 16; i++) {
        person(p, v, {
          x: 0.9 + (i % 5) * 0.52, z: 1.1 + Math.floor(i / 5) * 0.85,
          h: 1.25 + (i % 3) * 0.12, ink: (['teal','navy','rose','brick'][i % 4]) as Ink,
          hair: 'navy', face: i % 2 ? 1 : -1,
        });
      }
      person(p, v, { x: 6.5, z: 3.2, ink: 'navy', hair: 'brick', h: 1.6, face: -1 });
      person(p, v, { x: 7.0, z: 3.9, hat: 'veil', ink: 'brick', h: 1.5, face: -1 });
      person(p, v, { x: 7.3, z: 2.5, hat: 'knot', ink: 'teal', h: 1.55, face: -1 });
      for (let i = 0; i < 4; i++) candle(p, v, 3.4 + i * 1.1, 0, 0.5, 'mustard');
      pot(p, v, 2.6, 4.4, 0.5, 'brick');
      tree(p, v, 0.5, 4.2, 1.6, 'teal', 81);
      clutter(p, v, 8, 5, 8, 808);
    },
    moving: (p, v) => {
      claude(p, v, 4.9, 1.1, 0.5);
      walker(p, v, [6.6, 3.2], [3.6, 2.2], 12, { ink: 'navy', hair: 'brick', h: 1.6 });
      walker(p, v, [7.0, 3.9], [4.0, 2.9], 12, { ink: 'brick', hair: 'navy', h: 1.5, hat: 'veil', robe: true });
    },
  },
  {
    n: 9, kanda: 'Ayodhya', title: 'The Ferry', where: 'Guha’s hut on the Ganga',
    line:
      'A boatman of no standing gives the heir to Ayodhya the only things he owns: a crossing, a fire, and somewhere to put his head.',
    company:
      'Guha, who lies awake all night guarding three people who do not need guarding, because it is the one thing left he can give.',
    w: 6, d: 6, wallH: 1.6,
    still: (p, v) => {

      // A boatman's hut: a fire, a boat, and somebody staying awake.
      shell(p, v, 6, 6, 1.6, 'teal', 'brick', 'weave', 'navy', 0.24, 0.5);
      slab(p, 'navy', v, 0, 4.4, 6, 1.6, 0.3, 0.02);
      for (let i = 0; i < 9; i++) blob(p, 'navy', v, 0.4 + i * 0.62, 0.05, 5.3, 0.2, 0.06, 0.34);
      // The boat, pulled up on the bank.
      box(p, 'brick', v, 3.4, 0, 4.5, 2.2, 0.3, 0.7);
      box(p, 'mustard', v, 3.6, 0.3, 4.6, 1.8, 0.1, 0.5);
      counter(p, v, 0.06, 0.8, 2.4, 'z', 'brick', 0.6);
      for (let i = 0; i < 5; i++) pot(p, v, 0.3, 1.0 + i * 0.5, 0.3, i % 2 ? 'mustard' : 'teal');
      bookcase(p, v, 2.6, 0.05, 1.8, 'x', 1.2, 'mustard', 91);
      person(p, v, { x: 1.4, z: 2.9, ink: 'brick', hair: 'navy', h: 1.5, pose: 'kneel' });
      person(p, v, { x: 3.4, z: 2.3, ink: 'navy', hair: 'brick', h: 1.55, pose: 'lie' });
      person(p, v, { x: 3.4, z: 3.0, hat: 'veil', ink: 'rose', h: 1.45, pose: 'lie' });
      person(p, v, { x: 4.3, z: 2.6, hat: 'knot', ink: 'teal', h: 1.5, pose: 'sit', face: -1 });
      tree(p, v, 5.3, 1.0, 1.8, 'teal', 92);
      tree(p, v, 5.4, 3.2, 1.5, 'teal', 93);
      pot(p, v, 1.2, 4.0, 0.45, 'brick');
      clutter(p, v, 6, 4, 7, 909);
    },
    moving: (p, v) => {
      fire(p, v, 2.2, 2.4, 1.3);
      claude(p, v, 1.0, 3.9, 0.48);
      walker(p, v, [1.4, 2.9], [4.6, 3.4], 11, { ink: 'brick', hair: 'navy', h: 1.5 });
    },
  },
  {
    n: 10, kanda: 'Ayodhya', title: 'The Sandals', where: 'Chitrakuta',
    line:
      'Bharata walks into the forest with an army to bring his brother home and is refused. He takes a pair of wooden sandals instead and puts them on the throne.',
    company:
      'Bharata, going back to rule a kingdom he never wanted on behalf of a man who will not come.',
    w: 7, d: 6, wallH: 1,
    still: (p, v) => {

      // An army in the forest, and a pair of sandals on a throne.
      shell(p, v, 7, 6, 1.0, 'teal', 'mustard', 'weave', 'navy', 0.2, 0.4);
      for (let i = 0; i < 5; i++) tree(p, v, 0.4 + i * 1.5, 0.3, 1.9, 'teal', 100 + i);
      tree(p, v, 6.2, 2.4, 1.7, 'teal', 105);
      hill(p, v, 5.6, 4.8, 2.4, 0.9, 'teal');
      // The hut, and the seat outside it with the sandals on it.
      box(p, 'brick', v, 0.6, 0, 2.0, 1.8, 1.1, 1.6);
      box(p, 'mustard', v, 0.45, 1.1, 1.85, 2.1, 0.3, 1.9);
      dais(p, v, 3.0, 2.4, 1.2, 1.1, 2, 'brick');
      slab(p, 'mustard', v, 3.35, 2.75, 0.24, 0.42, 0.8, 0.38);
      slab(p, 'mustard', v, 3.68, 2.75, 0.24, 0.42, 0.8, 0.38);
      person(p, v, { x: 2.7, z: 3.9, hat: 'crown', ink: 'rose', hair: 'navy', pose: 'bow' });
      person(p, v, { x: 4.3, z: 3.6, ink: 'brick', hair: 'navy', h: 1.6, face: -1 });
      person(p, v, { x: 4.9, z: 4.2, hat: 'veil', ink: 'navy', h: 1.45, face: -1 });
      for (let i = 0; i < 10; i++) {
        person(p, v, {
          x: 0.6 + (i % 5) * 0.55, z: 4.4 + Math.floor(i / 5) * 0.7,
          h: 1.3, hat: 'helm', ink: i % 2 ? 'navy' : 'teal', face: 1,
        });
      }
      pot(p, v, 2.3, 2.1, 0.42, 'mustard');
      clutter(p, v, 7, 6, 8, 1010);
    },
    moving: (p, v) => {
      claude(p, v, 5.9, 2.8, 0.5);
      walker(p, v, [2.7, 3.9], [5.2, 3.9], 9, { ink: 'rose', hair: 'navy', h: 1.55, hat: 'crown', robe: true });
      person(p, v, { x: 4.3, z: 3.6, ink: 'brick', hair: 'navy', h: 1.6, pose: 'reach', phase: (v.t / 2.4) % 1, face: -1 });
    },
  },
  {
    n: 11, kanda: 'Aranya', title: 'Panchavati', where: 'The hut Lakshmana builds',
    line:
      'Ten years pass here and almost nothing is recorded of them, which in a story this long is how you say that people were happy.',
    company:
      'Nobody. The light waits outside by the water pot, because this is the last room in the poem where all three of them are fine.',
    w: 7, d: 7, wallH: 1,
    still: (p, v) => {

      // Ten happy years, which the poem records by not recording them.
      shell(p, v, 7, 7, 1.0, 'teal', 'mustard', 'weave', 'navy', 0.18, 0.42);
      rug(p, v, 3.8, 3.4, 2.4, 2.2, 'rose', 0.3);
      for (let i = 0; i < 6; i++) tree(p, v, 0.3 + i * 1.2, 0.25, 2.1, 'teal', 110 + i);
      tree(p, v, 6.3, 1.8, 1.9, 'teal', 117);
      tree(p, v, 6.4, 4.0, 1.7, 'teal', 118);
      // The hut Lakshmana builds, with a porch and a swept yard.
      box(p, 'brick', v, 1.0, 0, 1.4, 2.4, 1.2, 2.0);
      box(p, 'mustard', v, 0.8, 1.2, 1.2, 2.8, 0.34, 2.4);
      arch(p, v, 1.2, 3.5, 2.0, 1.2, 'brick');
      table(p, v, 4.1, 3.8, 1.5, 1.1, 'brick', 0.5);
      for (let i = 0; i < 5; i++) pot(p, v, 4.3 + (i % 3) * 0.45, 4.0 + Math.floor(i / 3) * 0.45, 0.3, i % 2 ? 'mustard' : 'teal');
      person(p, v, { x: 4.5, z: 5.2, ink: 'navy', hair: 'brick', h: 1.6, pose: 'sit' });
      person(p, v, { x: 5.3, z: 5.0, hat: 'veil', ink: 'rose', h: 1.5, pose: 'sit', face: -1 });
      person(p, v, { x: 2.5, z: 5.6, hat: 'knot', ink: 'teal', h: 1.55, pose: 'reach' });
      pot(p, v, 2.2, 4.4, 0.55, 'brick');
      for (let i = 0; i < 6; i++) blob(p, 'mustard', v, 0.6 + i * 0.4, 0.06, 6.4, 0.12, 0.06, 0.6);
      clutter(p, v, 7, 7, 9, 1111);
    },
    moving: (p, v) => {
      claude(p, v, 2.2, 5.0, 0.46);
      walker(p, v, [2.5, 5.6], [5.6, 5.6], 12, { ink: 'teal', hair: 'navy', h: 1.55, hat: 'knot' });
      person(p, v, { x: 4.5, z: 5.2, ink: 'navy', hair: 'brick', h: 1.6, pose: 'work', phase: (v.t / 1.9) % 1 });
    },
  },
  {
    n: 12, kanda: 'Aranya', title: 'The Doorway', where: 'Shurpanakha asks',
    line:
      'Ravana’s sister asks Rama to marry her, is sent to Lakshmana, is sent back, and is finally disfigured for the asking. Everything after this is the consequence.',
    company:
      'Shurpanakha, afterwards, on the path — the only person in the poem whose humiliation nobody records the feeling of.',
    w: 6, d: 6, wallH: 1,
    still: (p, v) => {

      // A doorway, an asking, and a path somebody walks away down.
      shell(p, v, 6, 6, 1.0, 'rose', 'teal', 'weave', 'navy', 0.2, 0.44);
      for (let i = 0; i < 5; i++) tree(p, v, 0.3 + i * 1.3, 0.3, 2.0, 'teal', 120 + i);
      box(p, 'brick', v, 0.8, 0, 1.6, 2.2, 1.2, 1.8);
      box(p, 'mustard', v, 0.6, 1.2, 1.4, 2.6, 0.3, 2.2);
      arch(p, v, 1.1, 3.5, 1.8, 1.3, 'brick');
      // The path, running out of the room at the near corner.
      slab(p, 'mustard', v, 3.4, 3.4, 2.4, 2.4, 0.3, 0.02);
      person(p, v, { x: 2.0, z: 3.9, ink: 'navy', hair: 'brick', h: 1.6, face: 1 });
      person(p, v, { x: 2.9, z: 3.7, hat: 'knot', ink: 'teal', h: 1.55, face: -1 });
      person(p, v, { x: 4.6, z: 4.8, hat: 'veil', ink: 'brick', h: 1.55, pose: 'bow', face: -1 });
      pot(p, v, 0.6, 4.4, 0.45, 'mustard');
      plant(p, v, 5.4, 1.2, 1.1, 'teal');
      plant(p, v, 5.5, 2.6, 0.9, 'teal');
      for (let i = 0; i < 5; i++) blob(p, 'rose', v, 3.6 + i * 0.45, 0.05, 5.4, 0.1, 0.05, 0.55);
      clutter(p, v, 6, 6, 7, 1212);
    },
    moving: (p, v) => {
      claude(p, v, 5.2, 4.6, 0.48);
      walker(p, v, [4.6, 4.8], [5.8, 5.8], 8, { ink: 'brick', hair: 'navy', h: 1.55, hat: 'veil', robe: true });
    },
  },
  {
    n: 13, kanda: 'Aranya', title: 'The Treeline', where: 'A deer made of gold',
    line:
      'It is the wrong colour for a deer and it is too beautiful and she asks for it anyway, because she has lived in a hut for ten years and wanted one lovely thing.',
    company:
      'Sita, in the moment of asking — which the poem will make her pay for longer than anybody else pays for anything.',
    w: 7, d: 6, wallH: 1,
    still: (p, v) => {

      // A treeline, and one lovely thing the wrong colour.
      shell(p, v, 7, 6, 1.0, 'teal', 'rose', 'weave', 'navy', 0.18, 0.42);
      rug(p, v, 2.6, 5.0, 1.4, 0.9, 'mustard', 0.28);
      for (let i = 0; i < 7; i++) tree(p, v, 0.2 + i * 1.0, 0.3, 2.2 - (i % 3) * 0.3, 'teal', 130 + i);
      tree(p, v, 6.4, 2.0, 1.8, 'teal', 138);
      box(p, 'brick', v, 0.7, 0, 3.6, 2.0, 1.1, 1.6);
      box(p, 'mustard', v, 0.5, 1.1, 3.4, 2.4, 0.3, 2.0);
      // The deer, gold and standing exactly where it should not be.
      blob(p, 'mustard', v, 4.9, 0.62, 2.0, 0.34, 0.24, 0.9);
      blob(p, 'mustard', v, 5.25, 0.92, 2.0, 0.14, 0.16, 0.9);
      for (const dx of [-0.2, -0.05, 0.18, 0.3]) rule(p, v, [4.9 + dx, 0.42, 2.0], [4.9 + dx, 0, 2.0], 0.7);
      spark(p, 'mustard', v, 4.9, 1.3, 2.0, 0.3);
      person(p, v, { x: 3.0, z: 4.2, hat: 'veil', ink: 'rose', h: 1.5, pose: 'reach' });
      person(p, v, { x: 2.1, z: 4.6, ink: 'navy', hair: 'brick', h: 1.6, face: -1 });
      person(p, v, { x: 1.3, z: 5.0, hat: 'knot', ink: 'teal', h: 1.55, face: -1 });
      pot(p, v, 0.6, 5.3, 0.45, 'brick');
      clutter(p, v, 7, 6, 8, 1313);
    },
    moving: (p, v) => {
      claude(p, v, 4.0, 5.3, 0.48);
      walker(p, v, [4.9, 2.0], [3.4, 3.0], 5, { ink: 'mustard', hair: 'mustard', h: 1.0 });
      person(p, v, { x: 3.0, z: 4.2, hat: 'veil', ink: 'rose', hair: 'navy', h: 1.5, pose: 'reach', phase: (v.t / 1.3) % 1, robe: true });
    },
  },
  {
    n: 14, kanda: 'Aranya', title: 'The Line', where: 'Drawn across the doorway',
    line:
      'A cry for help in Rama’s voice. Lakshmana knows it is a trick and is accused of wanting his brother dead, so he draws a line, says do not cross it, and goes.',
    company:
      'Lakshmana, made to choose between two ways of failing her, walking away from the one he picked.',
    w: 6, d: 6, wallH: 1,
    still: (p, v) => {

      // A line drawn on the ground and a man walking away from it.
      shell(p, v, 6, 6, 1.0, 'mustard', 'teal', 'weave', 'brick', 0.2, 0.44);
      for (let i = 0; i < 5; i++) tree(p, v, 0.3 + i * 1.3, 0.3, 2.0, 'teal', 140 + i);
      box(p, 'brick', v, 1.0, 0, 1.6, 2.4, 1.2, 2.0);
      box(p, 'mustard', v, 0.8, 1.2, 1.4, 2.8, 0.32, 2.4);
      arch(p, v, 1.3, 3.7, 2.0, 1.3, 'brick');
      // The line. Three inks on top of each other so it burns.
      slab(p, 'brick', v, 1.1, 3.95, 2.4, 0.16, 0.9, 0.03);
      slab(p, 'mustard', v, 1.1, 3.9, 2.4, 0.26, 0.5, 0.025);
      for (let i = 0; i < 6; i++) spark(p, 'mustard', v, 1.3 + i * 0.4, 0.12, 4.0, 0.14);
      person(p, v, { x: 1.9, z: 3.2, hat: 'veil', ink: 'rose', h: 1.5, face: 1 });
      person(p, v, { x: 4.2, z: 4.6, hat: 'knot', ink: 'teal', h: 1.55, pose: 'bow', face: -1 });
      pot(p, v, 0.6, 4.6, 0.45, 'brick');
      pot(p, v, 1.2, 5.2, 0.35, 'mustard');
      plant(p, v, 5.3, 2.0, 1.0, 'teal');
      papers(p, v, 3.2, 5.2, 3, 141);
      clutter(p, v, 6, 6, 6, 1414);
    },
    moving: (p, v) => {
      claude(p, v, 1.5, 2.9, 0.46);
      walker(p, v, [4.2, 4.6], [5.6, 5.6], 7, { ink: 'teal', hair: 'navy', h: 1.55, hat: 'knot' });
    },
  },
  {
    n: 15, kanda: 'Aranya', title: 'The Road', where: 'Where Jatayu came down',
    line:
      'An old vulture, too old for this, goes up against Ravana’s chariot for a woman he has no duty to, and is still alive when Rama finds him, and waits to say which way they went.',
    company:
      'Jatayu, holding on for a message — the most useful anyone manages to be in this whole kanda.',
    w: 7, d: 5, wallH: 0.8,
    still: (p, v) => {

      // A road, a wrecked chariot, and an old bird holding on for a message.
      shell(p, v, 7, 5, 0.8, 'rose', 'mustard', 'weave', 'navy', 0.2, 0.4);
      slab(p, 'mustard', v, 0, 1.6, 7, 1.8, 0.26, 0.02);
      for (let i = 0; i < 6; i++) tree(p, v, 0.3 + i * 1.2, 0.2, 1.7, 'teal', 150 + i);
      // The chariot, on its side.
      box(p, 'brick', v, 4.6, 0, 1.0, 1.4, 0.5, 0.9);
      blob(p, 'navy', v, 4.6, 0.36, 1.9, 0.34, 0.34, 0.75);
      blob(p, 'navy', v, 5.9, 0.36, 1.9, 0.34, 0.34, 0.75);
      // Jatayu, down, with feathers all round.
      blob(p, 'brick', v, 2.6, 0.3, 2.5, 0.62, 0.36, 0.8);
      blob(p, 'brick', v, 3.3, 0.42, 2.4, 0.2, 0.2, 0.85);
      for (let i = 0; i < 9; i++) {
        blob(p, i % 2 ? 'navy' : 'brick', v, 1.6 + i * 0.5, 0.05, 3.4 + (i % 3) * 0.3, 0.12, 0.05, 0.6);
      }
      person(p, v, { x: 2.1, z: 3.6, ink: 'navy', hair: 'brick', h: 1.6, pose: 'kneel' });
      person(p, v, { x: 1.3, z: 3.9, hat: 'knot', ink: 'teal', h: 1.55, pose: 'bow' });
      hill(p, v, 6.3, 4.2, 2.0, 0.8, 'teal');
      pot(p, v, 6.4, 0.6, 0.4, 'brick');
      clutter(p, v, 7, 5, 7, 1515);
    },
    moving: (p, v) => {
      claude(p, v, 3.6, 3.2, 0.5);
      walker(p, v, [1.3, 3.9], [5.2, 3.9], 12, { ink: 'teal', hair: 'navy', h: 1.55, hat: 'knot' });
    },
  },
  {
    n: 16, kanda: 'Aranya', title: 'The Empty Hut', where: 'Panchavati, after',
    line:
      'He comes back and there is nobody in it. For a long stretch of the poem the most powerful man alive goes from tree to tree asking them where she went.',
    company:
      'Rama, who is about to be unbearable for several chapters and has earned it.',
    w: 6, d: 6, wallH: 1,
    still: (p, v) => {

      // The same hut, with nobody in it.
      shell(p, v, 6, 6, 1.0, 'navy', 'teal', 'weave', 'mustard', 0.22, 0.46);
      rug(p, v, 3.0, 3.6, 1.8, 1.4, 'rose', 0.28);
      for (let i = 0; i < 5; i++) tree(p, v, 0.3 + i * 1.3, 0.3, 2.0, 'teal', 160 + i);
      box(p, 'brick', v, 1.0, 0, 1.6, 2.4, 1.2, 2.0);
      box(p, 'mustard', v, 0.8, 1.2, 1.4, 2.8, 0.32, 2.4);
      arch(p, v, 1.3, 3.7, 2.0, 1.3, 'brick');
      // Everything still where it was put down.
      pot(p, v, 1.5, 4.3, 0.45, 'brick');
      pot(p, v, 2.2, 4.6, 0.35, 'mustard');
      openBook(p, v, 3.4, 4.0);
      books(p, v, 4.2, 0, 3.9, 3, 161);
      papers(p, v, 3.6, 5.0, 5, 162);
      // A basket knocked over, and what came out of it.
      blob(p, 'mustard', v, 4.8, 0.16, 2.4, 0.3, 0.18, 0.7);
      for (let i = 0; i < 7; i++) blob(p, 'rose', v, 4.4 + i * 0.22, 0.05, 2.9 + (i % 3) * 0.24, 0.09, 0.05, 0.6);
      person(p, v, { x: 5.0, z: 5.2, ink: 'navy', hair: 'brick', h: 1.6, pose: 'bow', face: -1 });
      clutter(p, v, 6, 6, 9, 1616);
    },
    moving: (p, v) => {
      claude(p, v, 2.9, 2.3, 0.5);
      walker(p, v, [5.0, 5.2], [1.6, 5.2], 10, { ink: 'navy', hair: 'brick', h: 1.6 });
    },
  },
  {
    n: 17, kanda: 'Kishkindha', title: 'The Cave Mouth', where: 'Rishyamukha, where Sugriva is hiding',
    line:
      'A king thrown out by his own brother, living on a hill his brother is cursed not to climb, keeping a bundle of jewels a woman dropped out of the sky.',
    company:
      'Sugriva, who has been frightened for so long that being offered help does not immediately register as help.',
    w: 6, d: 6, wallH: 1.2,
    still: (p, v) => {

      // A cave on a hill, and a king who has been frightened too long.
      shell(p, v, 6, 6, 1.2, 'brick', 'navy', 'weave', 'teal', 0.24, 0.5);
      hill(p, v, 1.6, 1.4, 3.4, 1.8, 'navy');
      hill(p, v, 4.6, 1.0, 2.4, 1.3, 'navy');
      // The mouth of it, and the dark inside.
      blob(p, 'navy', v, 2.0, 0.6, 2.4, 0.66, 0.7, 0.95);
      cone(p, 'mustard', v, 2.0, 0.5, 2.6, 2.0, 0.45, Math.PI / 2, 0.3);
      for (let i = 0; i < 6; i++) blob(p, 'brick', v, 0.8 + i * 0.5, 0.1, 3.5, 0.18, 0.1, 0.62);
      // The bundle of jewels she dropped, knotted in a cloth.
      blob(p, 'mustard', v, 4.4, 0.18, 3.0, 0.3, 0.2, 0.8);
      for (let i = 0; i < 5; i++) blob(p, 'rose', v, 4.2 + i * 0.16, 0.34, 2.95, 0.06, 0.06, 0.9);
      person(p, v, { x: 2.5, z: 4.2, hat: 'crown', ink: 'brick', hair: 'navy', h: 1.5, pose: 'sit' });
      person(p, v, { x: 4.6, z: 4.4, ink: 'navy', hair: 'brick', h: 1.6, face: -1 });
      person(p, v, { x: 5.2, z: 5.0, hat: 'knot', ink: 'teal', h: 1.55, face: -1 });
      person(p, v, { x: 1.2, z: 5.0, hat: 'cap', ink: 'mustard', h: 1.4 });
      tree(p, v, 5.4, 1.4, 1.6, 'teal', 171);
      clutter(p, v, 6, 6, 7, 1717);
    },
    moving: (p, v) => {
      fire(p, v, 3.4, 3.4, 1.1);
      claude(p, v, 1.5, 3.6, 0.48);
      walker(p, v, [4.6, 4.4], [1.6, 4.4], 11, { ink: 'navy', hair: 'brick', h: 1.6 });
      person(p, v, { x: 1.2, z: 5.0, h: 1.4, ink: 'mustard', hair: 'navy', hat: 'cap', pose: 'work', phase: (v.t / 1.2) % 1 });
    },
  },
  {
    n: 18, kanda: 'Kishkindha', title: 'The Hall After', where: 'Kishkindha, Vali down',
    line:
      'Rama shoots Vali from cover, which every telling has had to argue about since. Tara, widowed in one afternoon, says the sharpest things anybody says to Rama in the whole poem.',
    company:
      'Tara, who is right, and whom the story then requires to be reasonable about it.',
    w: 7, d: 6, wallH: 3,
    still: (p, v) => {

      // A hall the morning after, and the person who is right about it.
      shell(p, v, 7, 6, 3.0, 'navy', 'brick', 'tile', 'mustard', 0.28, 0.58);
      colonnade(p, v, 1.0, 0.5, 4, 1.6, 2.8, 'rose');
      for (let i = 0; i < 5; i++) onWall(p, v, 0.7 + i * 1.3, 1.7, 0.7, 1.0, 'mustard', 'x', 0.42);
      counter(p, v, 0.06, 1.0, 3.4, 'z', 'brick', 0.75);
      dais(p, v, 2.6, 1.2, 2.2, 1.8, 2, 'brick');
      // The bier, low, in the middle, with the room arranged round it.
      box(p, 'rose', v, 2.6, 0.36, 3.0, 2.2, 0.3, 1.0);
      blob(p, 'mustard', v, 3.7, 0.74, 3.5, 0.9, 0.24, 0.6);
      for (let i = 0; i < 4; i++) candle(p, v, 2.4 + i * 0.8, 0.36, 4.3, 'mustard');
      person(p, v, { x: 3.4, z: 4.6, hat: 'veil', ink: 'teal', h: 1.55, pose: 'kneel', face: 1 });
      person(p, v, { x: 5.2, z: 4.4, ink: 'navy', hair: 'brick', h: 1.6, pose: 'bow', face: -1 });
      person(p, v, { x: 5.9, z: 3.6, hat: 'knot', ink: 'teal', h: 1.55, face: -1 });
      seat(p, v, 1.2, 4.4, 'rose', 'z');
      person(p, v, { x: 1.4, z: 4.6, hat: 'crown', ink: 'brick', h: 1.5 });
      for (let i = 0; i < 5; i++) {
        person(p, v, { x: 1.0 + i * 1.2, z: 5.5, h: 1.35, hat: 'helm', ink: i % 2 ? 'navy' : 'rose', face: -1 });
      }
      papers(p, v, 6.2, 1.6, 3, 181);
      plant(p, v, 6.4, 5.0, 1.0, 'teal');
      clutter(p, v, 7, 6, 7, 1818);
    },
    moving: (p, v) => {
      claude(p, v, 2.2, 5.3, 0.5);
      walker(p, v, [1.0, 5.5], [6.0, 5.5], 14, { ink: 'rose', hair: 'navy', h: 1.35, hat: 'helm' });
      person(p, v, { x: 3.4, z: 4.6, hat: 'veil', ink: 'teal', hair: 'navy', h: 1.55, pose: 'work', phase: (v.t / 2.6) % 1, robe: true });
    },
  },
  {
    n: 19, kanda: 'Kishkindha', title: 'The Southern Cliff', where: 'The search runs out of land',
    line:
      'The party sent south reaches the end of the world, finds no Sita, and sits down to starve rather than go back having failed. Then somebody mentions what Hanuman can do.',
    company:
      'Angada, who has led them to the edge and cannot think of the next thing, which is its own kind of alone.',
    w: 7, d: 6, wallH: 0.6,
    still: (p, v) => {

      // The end of the land, and a party that has decided to sit down.
      shell(p, v, 7, 6, 0.6, 'mustard', 'teal', 'weave', 'brick', 0.2, 0.36);
      // The sea, taking the far half of the floor.
      slab(p, 'navy', v, 0, 0, 7, 2.6, 0.4, 0.018);
      for (let i = 0; i < 12; i++) blob(p, 'navy', v, 0.3 + i * 0.55, 0.04, 0.5 + (i % 4) * 0.55, 0.2, 0.05, 0.3);
      hill(p, v, 1.2, 3.4, 2.6, 1.1, 'brick');
      hill(p, v, 5.6, 3.0, 2.2, 0.9, 'brick');
      for (let i = 0; i < 11; i++) {
        person(p, v, {
          x: 0.8 + (i % 6) * 1.0, z: 4.2 + Math.floor(i / 6) * 0.9,
          h: 1.3, ink: (['teal','brick','navy','rose'][i % 4]) as Ink,
          hat: i % 3 ? 'none' : 'cap', pose: i % 2 ? 'sit' : 'kneel', face: i % 2 ? 1 : -1,
        });
      }
      person(p, v, { x: 3.4, z: 3.1, hat: 'crown', ink: 'mustard', hair: 'navy', h: 1.55, pose: 'bow' });
      person(p, v, { x: 4.6, z: 3.3, hat: 'cap', ink: 'rose', h: 1.5, face: -1 });
      tree(p, v, 6.4, 5.0, 1.4, 'teal', 191);
      clutter(p, v, 7, 3, 6, 1919);
    },
    moving: (p, v) => {
      claude(p, v, 2.4, 2.9, 0.5);
      walker(p, v, [0.8, 4.2], [6.2, 4.2], 15, { ink: 'brick', hair: 'navy', h: 1.3, hat: 'cap' });
    },
  },
  {
    n: 20, kanda: 'Sundara', title: 'The Headland', where: 'Before the leap',
    line:
      'Hanuman can cross a hundred leagues of sea and has forgotten it. He has to be reminded what he is by somebody standing next to him, and then he grows until the cliff is small.',
    company:
      'Hanuman, in the last quiet moment before the most famous jump in the language.',
    w: 6, d: 6, wallH: 0.5,
    still: (p, v) => {

      // A headland, and somebody being reminded what he is.
      shell(p, v, 6, 6, 0.5, 'brick', 'teal', 'weave', 'mustard', 0.2, 0.34);
      slab(p, 'navy', v, 0, 0, 6, 2.4, 0.42, 0.018);
      for (let i = 0; i < 10; i++) blob(p, 'navy', v, 0.3 + i * 0.58, 0.04, 0.4 + (i % 4) * 0.5, 0.22, 0.05, 0.3);
      hill(p, v, 4.4, 3.2, 3.0, 1.4, 'brick');
      hill(p, v, 1.0, 3.0, 1.8, 0.8, 'brick');
      // Him, bigger than everything else on the cliff, mid-grow.
      person(p, v, { x: 3.0, z: 3.4, h: 2.4, ink: 'mustard', hair: 'brick', hat: 'cap', pose: 'reach' });
      for (let i = 0; i < 8; i++) spark(p, 'mustard', v, 2.4 + (i % 4) * 0.42, 1.4 + Math.floor(i / 4) * 0.5, 3.4, 0.16);
      for (let i = 0; i < 6; i++) {
        person(p, v, {
          x: 0.7 + i * 0.75, z: 5.0, h: 1.2,
          ink: (['teal','brick','navy','rose'][i % 4]) as Ink, hat: 'cap', face: 1,
        });
      }
      person(p, v, { x: 4.9, z: 4.6, hat: 'crown', ink: 'rose', h: 1.4, face: -1 });
      tree(p, v, 5.5, 5.2, 1.2, 'teal', 201);
      clutter(p, v, 6, 3, 5, 2020);
    },
    moving: (p, v) => {
      claude(p, v, 1.5, 4.2, 0.48);
      person(p, v, { x: 3.0, z: 3.4, h: 2.4, ink: 'mustard', hair: 'brick', hat: 'cap', pose: 'reach', phase: (v.t / 1.8) % 1 });
      walker(p, v, [0.9, 5.0], [5.2, 5.0], 11, { ink: 'teal', hair: 'navy', h: 1.2, hat: 'cap' });
    },
  },
  {
    n: 21, kanda: 'Sundara', title: 'The Ashoka Grove', where: 'Lanka, where she is kept',
    line:
      'Ten months under a tree, guarded, asked once a month to reconsider, refusing every time. A monkey drops a ring into her lap and she has to decide whether to believe it.',
    company:
      'Sita. The loneliest room in the poem, and the one the poem spends the least time inside.',
    w: 7, d: 7, wallH: 1.4,
    still: (p, v) => {

      // The loneliest room in the poem, and the one it spends least time in.
      shell(p, v, 7, 7, 1.4, 'teal', 'navy', 'weave', 'brick', 0.22, 0.5);
      rug(p, v, 3.8, 4.4, 1.8, 1.4, 'mustard', 0.26);
      // A wall of the grove: trees packed round three sides.
      for (let i = 0; i < 6; i++) tree(p, v, 0.8 + i * 1.0, 0.45, 2.0, 'teal', 210 + i);
      for (let i = 0; i < 4; i++) tree(p, v, 0.5, 1.7 + i * 1.1, 1.9, 'teal', 220 + i);
      // The one she sits under, bigger, alone on the open side.
      tree(p, v, 4.4, 3.6, 3.0, 'teal', 226);
      person(p, v, { x: 4.4, z: 5.0, hat: 'veil', ink: 'rose', hair: 'navy', h: 1.8, pose: 'sit', face: -1 });
      // The ring, in her lap, the size it actually is.
      blob(p, 'mustard', v, 4.75, 0.6, 5.1, 0.07, 0.07, 0.95);
      spark(p, 'mustard', v, 4.75, 0.72, 5.1, 0.16);
      // Guards, spaced so that nobody is near her.
      for (let i = 0; i < 6; i++) {
        person(p, v, {
          x: 1.0 + (i % 3) * 0.9, z: 4.0 + Math.floor(i / 3) * 1.6,
          h: 1.45, hat: 'helm', ink: 'navy', face: i % 2 ? 1 : -1,
        });
      }
      pot(p, v, 6.3, 5.4, 0.45, 'brick');
      for (let i = 0; i < 9; i++) blob(p, 'mustard', v, 3.4 + (i % 3) * 0.7, 0.05, 6.0 + Math.floor(i / 3) * 0.3, 0.1, 0.05, 0.55);
      clutter(p, v, 7, 7, 7, 2121);
    },
    moving: (p, v) => {
      claude(p, v, 5.6, 4.6, 0.5);
      walker(p, v, [1.2, 3.4], [1.2, 6.0], 13, { ink: 'navy', hair: 'navy', h: 1.45, hat: 'helm' });
      walker(p, v, [2.9, 6.2], [6.0, 6.2], 15, { ink: 'navy', hair: 'navy', h: 1.45, hat: 'helm' });
    },
  },
  {
    n: 22, kanda: 'Sundara', title: 'The Burning', where: 'Lanka, the tail',
    line:
      'Caught and sentenced to have his tail set alight, he lets them do it, then walks the length of the city with it. The one part of the epic that is frankly having a wonderful time.',
    company:
      'Nobody needs company here. The light sits on a rooftop and watches, like everyone else.',
    w: 7, d: 6, wallH: 2.6,
    still: (p, v) => {

      // A city on fire, from a rooftop, and one of the few pages having fun.
      shell(p, v, 7, 6, 2.6, 'brick', 'navy', 'tile', 'mustard', 0.3, 0.6);
      // Roofs, stepped back, each one a box with a parapet.
      for (let i = 0; i < 6; i++) {
        const x = 0.4 + (i % 3) * 2.2;
        const z = 0.4 + Math.floor(i / 3) * 2.4;
        box(p, i % 2 ? 'rose' : 'mustard', v, x, 0, z, 1.8, 0.9 + (i % 3) * 0.3, 1.9);
        box(p, 'brick', v, x - 0.06, 0.9 + (i % 3) * 0.3, z - 0.06, 1.92, 0.16, 2.02, { top: 0.4 });
      }
      for (let i = 0; i < 14; i++) {
        spark(p, i % 2 ? 'mustard' : 'brick', v, 0.5 + (i % 7) * 0.95, 1.9 + (i % 5) * 0.4, 2.4, 0.2);
      }
      // Him, on the near roof, with the tail going off the edge of it.
      person(p, v, { x: 5.4, z: 4.6, h: 1.7, ink: 'mustard', hair: 'brick', hat: 'cap', pose: 'reach', face: -1 });
      for (let i = 0; i < 8; i++) {
        blob(p, 'brick', v, 5.7 + i * 0.16, 1.1 - i * 0.09, 4.9 + i * 0.12, 0.1, 0.07, 0.85);
      }
      for (let i = 0; i < 5; i++) {
        person(p, v, { x: 1.0 + i * 0.9, z: 5.4, h: 1.2, ink: 'navy', hat: 'helm', pose: 'reach', face: 1 });
      }
    },
    moving: (p, v) => {
      for (let i = 0; i < 5; i++) {
        fire(p, v, 0.7 + (i % 3) * 2.2, 1.2 + Math.floor(i / 3) * 2.6, 0.9 + (i % 3) * 0.3);
      }
      fire(p, v, 6.5, 5.6, 0.8);
      claude(p, v, 4.4, 2.6, 0.48);
      person(p, v, { x: 5.4, z: 4.6, h: 1.7, ink: 'mustard', hair: 'brick', hat: 'cap', pose: 'reach', phase: (v.t / 0.9) % 1, face: -1 });
      walker(p, v, [1.0, 5.4], [4.6, 5.4], 9, { ink: 'navy', hair: 'navy', h: 1.2, hat: 'helm' });
    },
  },
  {
    n: 23, kanda: 'Yuddha', title: 'The Causeway', where: 'Stones on the water',
    line:
      'An army of bears and monkeys builds a road across the sea. In the tellings people love best, the stones float because each one has a name written on it.',
    company:
      'Nala, who is in charge of the impossible thing and will not be mentioned again once it works.',
    w: 8, d: 5, wallH: 0.4,
    still: (p, v) => {

      // An army building a road across the sea, stone by named stone.
      shell(p, v, 8, 5, 0.4, 'mustard', 'teal', 'weave', 'brick', 0.18, 0.32);
      slab(p, 'navy', v, 0, 0, 8, 3.4, 0.44, 0.018);
      for (let i = 0; i < 16; i++) blob(p, 'navy', v, 0.25 + i * 0.48, 0.04, 0.4 + (i % 5) * 0.55, 0.2, 0.05, 0.28);
      // The causeway, running away from the near corner into the water.
      for (let i = 0; i < 9; i++) {
        const t = i / 9;
        box(p, i % 2 ? 'brick' : 'rose', v, 0.5 + i * 0.82, 0, 3.0 - t * 2.6, 0.78, 0.22 + (i % 2) * 0.06, 0.7);
      }
      for (let i = 0; i < 14; i++) {
        person(p, v, {
          x: 0.4 + (i % 7) * 1.05, z: 3.6 + Math.floor(i / 7) * 0.8,
          h: 1.2, ink: (['teal','brick','navy','rose'][i % 4]) as Ink,
          hat: 'cap', pose: i % 2 ? 'reach' : 'bow', face: i % 2 ? 1 : -1,
        });
      }
      for (let i = 0; i < 8; i++) {
        blob(p, 'mustard', v, 1.0 + i * 0.85, 0.52, 3.3, 0.16, 0.12, 0.8);
      }
      person(p, v, { x: 7.2, z: 4.2, hat: 'crown', ink: 'mustard', h: 1.5, pose: 'reach', face: -1 });
      hill(p, v, 7.4, 3.2, 1.4, 0.6, 'brick');
      clutter(p, v, 8, 2, 5, 2323);
    },
    moving: (p, v) => {
      claude(p, v, 6.2, 4.6, 0.46);
      person(p, v, { x: 2.4, z: 3.9, h: 1.25, ink: 'teal', hair: 'navy', hat: 'cap', pose: 'work', phase: (v.t / 0.8) % 1 });
      person(p, v, { x: 4.5, z: 3.9, h: 1.25, ink: 'brick', hair: 'navy', hat: 'cap', pose: 'work', phase: (v.t / 0.8 + 0.5) % 1, face: -1 });
      walker(p, v, [0.6, 4.4], [6.4, 4.4], 16, { ink: 'navy', hair: 'navy', h: 1.2, hat: 'cap' });
    },
  },
  {
    n: 24, kanda: 'Yuddha', title: 'The Field', where: 'Outside Lanka',
    line:
      'It goes on for a very long time and almost everybody in it dies. Ravana is not a fool or a monster: he is a scholar and a king who could not be talked out of one thing.',
    company:
      'Ravana, on the last morning, who has been told by his own brother, his own wife and his own advisors, and has heard all of it.',
    w: 8, d: 6, wallH: 2.2,
    still: (p, v) => {

      // The last morning, and a scholar who could not be talked out of one thing.
      shell(p, v, 8, 6, 2.2, 'rose', 'navy', 'tile', 'mustard', 0.28, 0.56);
      // The walls of Lanka along the back, and the field in front of them.
      for (let i = 0; i < 6; i++) {
        box(p, 'brick', v, 0.3 + i * 1.3, 0, 0.15, 1.1, 1.5 + (i % 2) * 0.3, 0.55);
      }
      for (let i = 0; i < 5; i++) onWall(p, v, 0.6 + i * 1.5, 1.7, 0.4, 0.5, 'mustard', 'x', 0.5);
      // Him, on a chariot platform, above everybody.
      dais(p, v, 5.6, 1.6, 2.0, 1.6, 2, 'brick');
      person(p, v, { x: 6.3, z: 2.2, hat: 'crown', ink: 'navy', hair: 'brick', h: 1.8, face: -1 });
      for (let i = 0; i < 4; i++) {
        blob(p, 'navy', v, 6.05 + (i % 2) * 0.55, 1.5, 2.1 + Math.floor(i / 2) * 0.35, 0.13, 0.15, 0.85);
      }
      // The field: two lines of figures, and things dropped between them.
      for (let i = 0; i < 9; i++) {
        person(p, v, { x: 0.5 + i * 0.8, z: 3.3, h: 1.25, hat: 'helm', ink: 'teal', pose: 'reach', face: 1 });
      }
      for (let i = 0; i < 8; i++) {
        person(p, v, { x: 0.9 + i * 0.85, z: 4.6, h: 1.25, hat: 'helm', ink: 'brick', pose: 'reach', face: -1 });
      }
      for (let i = 0; i < 9; i++) {
        blob(p, i % 2 ? 'mustard' : 'navy', v, 0.6 + i * 0.8, 0.06, 5.4 + (i % 3) * 0.25, 0.16, 0.06, 0.6);
      }
      for (let i = 0; i < 5; i++) spark(p, 'brick', v, 1.2 + i * 1.5, 0.9, 4.0, 0.2);
      clutter(p, v, 8, 6, 7, 2424);
    },
    moving: (p, v) => {
      claude(p, v, 7.4, 4.4, 0.5);
      person(p, v, { x: 2.6, z: 3.3, h: 1.25, hat: 'helm', ink: 'teal', hair: 'navy', pose: 'reach', phase: (v.t / 0.7) % 1 });
      person(p, v, { x: 4.9, z: 4.6, h: 1.25, hat: 'helm', ink: 'brick', hair: 'navy', pose: 'reach', phase: (v.t / 0.7 + 0.4) % 1, face: -1 });
      walker(p, v, [1.0, 5.6], [6.6, 5.6], 15, { ink: 'navy', hair: 'navy', h: 1.2, hat: 'helm' });
    },
  },
  {
    n: 25, kanda: 'Yuddha', title: 'The Lamps', where: 'Ayodhya, the fourteenth year',
    line:
      'They come home on the day they said they would. The city, which has counted every one of those days, puts a lamp in every window so that the road in is lit the whole way.',
    company:
      'Everyone, briefly. The light is the smallest one on the sill and is not needed for illumination.',
    w: 8, d: 7, wallH: 2.6,
    still: (p, v) => {

      // A city that has counted every one of five thousand days.
      shell(p, v, 8, 7, 2.6, 'navy', 'brick', 'tile', 'mustard', 0.3, 0.52);
      // Houses down both walls, each one with a lamp in its window.
      /*
        Houses down both walls, each with a lit window. The window goes on the
        house's *front* face, not on the wall behind it: now that solids knock
        out what is under them, anything drawn after something it stands behind
        punches a hole straight through it, and a run of windows drawn onto the
        back wall turned every house on this page into a wireframe box.
      */
      for (let i = 0; i < 6; i++) {
        const h = 1.3 + (i % 3) * 0.25;
        box(p, i % 2 ? 'rose' : 'mustard', v, 0.3 + i * 1.3, 0, 0.12, 1.1, h, 0.7);
        panel(p, 'mustard', v, 0.55 + i * 1.3, h * 0.42, 0.825, 0.5, 0.48, 0.66, 'x');
      }
      // The window lights and the road's row of diyas are all in the moving
      // layer, so their loops are repeated there rather than split across both.
      for (let i = 0; i < 5; i++) {
        const h = 1.2 + (i % 2) * 0.3;
        box(p, i % 2 ? 'teal' : 'rose', v, 0.12, 0, 0.9 + i * 1.2, 0.7, h, 1.0);
        panel(p, 'mustard', v, 0.825, h * 0.42, 1.15 + i * 1.2, 0.5, 0.48, 0.66, 'z');
      }
      // The road in, lit the whole way.
      slab(p, 'mustard', v, 2.2, 2.4, 4.6, 2.2, 0.26, 0.02);
      person(p, v, { x: 4.0, z: 3.4, hat: 'crown', ink: 'brick', hair: 'navy', h: 1.65 });
      person(p, v, { x: 4.7, z: 3.7, hat: 'veil', ink: 'rose', h: 1.5, face: -1 });
      person(p, v, { x: 3.4, z: 4.0, hat: 'knot', ink: 'teal', h: 1.6 });
      for (let i = 0; i < 12; i++) {
        person(p, v, {
          x: 1.4 + (i % 6) * 1.05, z: 5.6 + Math.floor(i / 6) * 0.8,
          h: 1.2 + (i % 3) * 0.1, ink: (['teal','navy','rose','mustard'][i % 4]) as Ink,
          hair: 'navy', pose: i % 3 ? 'stand' : 'reach', face: i % 2 ? 1 : -1,
        });
      }
      for (let i = 0; i < 8; i++) blob(p, 'mustard', v, 1.6 + i * 0.75, 0.05, 1.5, 0.12, 0.06, 0.62);
      plant(p, v, 7.5, 6.4, 1.1, 'teal');
      clutter(p, v, 8, 7, 8, 2525);
    },
    moving: (p, v) => {
      for (let i = 0; i < 6; i++) candle(p, v, 0.78 + i * 1.3, 1.3 + (i % 3) * 0.25, 0.42, 'mustard');
      for (let i = 0; i < 5; i++) candle(p, v, 0.45, 1.2 + (i % 2) * 0.3, 1.3 + i * 1.2, 'mustard');
      // Seven, not twelve. Every flame in the room is redrawn on every frame,
      // and this room already has eleven in its windows: past about a dozen
      // the sheet stops being a room with lamps in it and starts being a
      // frame-rate problem, and nobody counts diyas.
      for (let i = 0; i < 7; i++) {
        flame(p, v, 2.5 + (i % 4) * 1.15, 0.02, 2.6 + Math.floor(i / 4) * 1.8, 0.17);
      }
      claude(p, v, 7.3, 2.2, 0.44);
      walker(p, v, [2.6, 3.4], [6.4, 3.4], 14, { ink: 'brick', hair: 'navy', h: 1.65, hat: 'crown', robe: true });
      walker(p, v, [2.6, 4.0], [6.4, 4.0], 14, { ink: 'rose', hair: 'navy', h: 1.5, hat: 'veil', robe: true });
      person(p, v, { x: 3.4, z: 5.8, h: 1.3, ink: 'teal', hair: 'navy', pose: 'reach', phase: (v.t / 1.5) % 1 });
    },
  },
];

export const CLOSING =
  'The poem you have just walked through is the one two boys are taught to recite, in an ' +
  'ashram, by a poet who wrote it after watching a hunter shoot a bird. They sing it to their ' +
  'father without either side knowing who the other is. The Ramayana ends by telling you where ' +
  'the Ramayana came from, which is the oldest trick there is and still the best one.';
