/**
 * What is on the shelf.
 *
 * One entry per game. The hub renders from this, the room layer keys its
 * channels off `id`, and the database records results against it, so adding a
 * game means adding a row here and a screen — nothing else.
 */

export type GameId = 'penfight' | 'rajarani' | 'rang' | 'mafia' | 'bookstall' | 'maze';

export interface GameDef {
  id: GameId;
  name: string;
  /** The one line that tells you whether you remember this game. */
  tagline: string;
  /** What people actually call it, when that is not the name on the card. */
  alsoKnownAs?: string;
  /** Where and when it was played. */
  era: string;
  blurb: string;
  seats: { min: number; max: number };
  /** Can you play it alone against the computer? */
  practice: boolean;
  /** Can you send someone a link? */
  online: boolean;
  /** No opponent at all — it is just you and the machine. */
  solo?: boolean;
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
    alsoKnownAs: 'the UNO game',
    era: 'rainy day · the back of the bus',
    blurb:
      'This is the UNO game — same rules, different name, because UNO belongs to Mattel. Skips, reverses, draw-twos, wilds and wild draw-fours, stacked draws, and the bit where you shout when you are down to one card or the table makes you take two. The deal is shuffled fresh every round and the first turn is random.',
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
  {
    id: 'bookstall',
    name: 'The Book Stall',
    tagline: 'Press the button. It prints you a line of Dostoevsky.',
    era: 'sunday pavement · sold by weight',
    blurb:
      'Cheap Soviet-printed Russian classics were everywhere in Indian bookshops in the eighties and nineties — Progress and Raduga editions on a pavement table beside the exam guides. This is that table, reduced to its last act: hand over a coin and the till prints you one line on a thermal receipt. Two hundred and thirty-nine lines in stock, from fourteen works, and you get every one of them before you get any of them twice.',
    seats: { min: 1, max: 1 },
    practice: false,
    online: false,
    solo: true,
    ink: '#4a4a52',
    wash: 'rgba(74, 74, 82, 0.08)',
    ready: true,
  },
  {
    id: 'maze',
    name: 'The Back of the Bill',
    tagline: 'Walk the only road through and pick up the missing word.',
    era: 'reverse of a handbill · pencil provided',
    blurb:
      'Job presses printed a maze on the back of a handbill to keep a child quiet while the adults talked. This one has a word cut out of a line of Dostoevsky and its letters dropped along the single true route, so the only way to collect them in order is to walk it. Reach the end and the stall prints the line with the word put back, and tells you which chapter it came from.',
    seats: { min: 1, max: 1 },
    practice: false,
    online: false,
    solo: true,
    ink: '#4a4a52',
    wash: 'rgba(74, 74, 82, 0.08)',
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
