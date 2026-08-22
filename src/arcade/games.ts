/**
 * What is on the shelf.
 *
 * One entry per game. The hub renders from this, the room layer keys its
 * channels off `id`, and the database records results against it, so adding a
 * game means adding a row here and a screen — nothing else.
 */

export type GameId = 'penfight' | 'rajarani' | 'rang' | 'mafia';

export interface GameDef {
  id: GameId;
  name: string;
  /** The one line that tells you whether you remember this game. */
  tagline: string;
  /** Where and when it was played. */
  era: string;
  blurb: string;
  seats: { min: number; max: number };
  /** Can you play it alone against the computer? */
  practice: boolean;
  /** Can you send someone a link? */
  online: boolean;
  /** Two accent colours for the shelf card. */
  ink: string;
  wash: string;
  ready: boolean;
}

export const GAMES: GameDef[] = [
  {
    id: 'penfight',
    name: 'Pen Fight',
    tagline: 'Knock their pen off the desk. Keep the pen.',
    era: 'back bench · any period',
    blurb:
      'The one that got pens confiscated. Flick yours across the desk and put theirs on the floor. In a two-player match the loser hands over the pen they were holding, and it goes into your Camlin box.',
    seats: { min: 2, max: 2 },
    practice: true,
    online: true,
    ink: '#1b3a8f',
    wash: 'rgba(27, 58, 143, 0.1)',
    ready: true,
  },
  {
    id: 'rajarani',
    name: 'Raja Rani Chor Police',
    tagline: 'Four chits, four roles. The Police has one guess.',
    era: 'lunch break · four to a bench',
    blurb:
      'Fold four chits, throw them in the middle, take one each. Raja is safe, Rani is safe, and the Police has to point at the Chor from nothing but a face. Guess right and you take the Chor’s points. Guess wrong and they take yours.',
    seats: { min: 2, max: 4 },
    practice: true,
    online: true,
    ink: '#8a2b2b',
    wash: 'rgba(138, 43, 43, 0.1)',
    ready: true,
  },
  {
    id: 'rang',
    name: 'Rang',
    tagline: 'Match the colour, match the number, go out first.',
    era: 'rainy day · the back of the bus',
    blurb:
      'The colour-and-number card game everybody has played under some name or other. Skips, reverses, draw-twos and wilds. Shout when you are down to one card, or the table makes you take two.',
    seats: { min: 2, max: 6 },
    practice: true,
    online: true,
    ink: '#1d6f4a',
    wash: 'rgba(29, 111, 74, 0.1)',
    ready: true,
  },
  {
    id: 'mafia',
    name: 'Mafia',
    tagline: 'One of you is lying. Work out which one.',
    era: 'school trip · lights out',
    blurb:
      'The village sleeps and the mafia picks somebody off. The village wakes, argues, and hangs whoever sounds guiltiest. There is a doctor who can save one person a night and an inspector who can check one. Roles stay secret, properly — they are encrypted to your seat, so nobody can read yours off the wire. Best with people; the computer will at least teach you the shape of it.',
    seats: { min: 4, max: 12 },
    practice: true,
    online: true,
    ink: '#3d2b6b',
    wash: 'rgba(61, 43, 107, 0.1)',
    ready: true,
  },
];

export const GAME_BY_ID = Object.fromEntries(GAMES.map((g) => [g.id, g])) as Record<
  GameId,
  GameDef
>;

export function isGameId(v: string | null | undefined): v is GameId {
  return !!v && v in GAME_BY_ID;
}
