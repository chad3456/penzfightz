/**
 * Bladers and beasts.
 *
 * On the name. The duel itself — two tops in a dish, last one spinning wins —
 * is *beigoma*, and *lattu*, and a hundred other things; it is older than
 * anybody's trademark and free to anyone. The bladers and spirit beasts of the
 * anime everyone actually means are not: those are somebody's characters. So
 * this follows the same line the UNO game on this shelf does — the game is the
 * game, and the roster is ours.
 *
 * A blader is who you are: a portrait, a temperament and one small quirk in how
 * they launch. A beast is what you fight with: four stats and a spin direction.
 * They are deliberately separable, because the whole collection loop is winning
 * somebody else's beast and finding out what your blader does with it.
 */

/** Which way the top turns. Left-spin tops exist, and it matters enormously. */
export type Spin = 1 | -1;

export interface Beast {
  id: string;
  name: string;
  /** What it is, in three or four words. */
  form: string;
  /** 0..1. How hard it hits. */
  attack: number;
  /** 0..1. How little it minds being hit. */
  defence: number;
  /** 0..1. How long it keeps turning. */
  stamina: number;
  /** 0..1. Mass. Heavy tops shrug off hits and are slow to get moving. */
  weight: number;
  spin: Spin;
  /** Ring colour on the top, and the beast's own colour when it shows. */
  ink: string;
  /** Second colour, for the face of the disc. */
  wash: string;
  /** One line for the card. */
  note: string;
  /**
   * Rare beasts are not carried by any blader. They turn up only once you have
   * taken all eight, which is the point at which the ladder needs somewhere
   * left to go.
   */
  rare?: boolean;
}

export const BEASTS: Beast[] = [
  {
    id: 'vaayu',
    name: 'Vaayu',
    form: 'the storm serpent',
    attack: 0.72, defence: 0.48, stamina: 0.55, weight: 0.5, spin: 1,
    ink: '#2f6fc4', wash: '#c8dcf2',
    note: 'Coils once round the rim and comes in off the wall. Good at everything and best at nothing.',
  },
  {
    id: 'angaar',
    name: 'Angaar',
    form: 'the ember phoenix',
    attack: 0.88, defence: 0.32, stamina: 0.52, weight: 0.45, spin: 1,
    ink: '#c23a2b', wash: '#f4d4c4',
    note: 'Everything up front. Wins in nine seconds or loses in twenty.',
  },
  {
    id: 'shilaa',
    name: 'Shilaa',
    form: 'the stone tortoise',
    attack: 0.3, defence: 0.92, stamina: 0.66, weight: 0.82, spin: 1,
    ink: '#4a7a3a', wash: '#d4e2c4',
    note: 'Sits in the middle and lets you break yourself on it.',
  },
  {
    id: 'chandra',
    name: 'Chandra',
    form: 'the moon wolf',
    attack: 0.38, defence: 0.5, stamina: 0.8, weight: 0.4, spin: 1,
    ink: '#6a5ac2', wash: '#dcd4f0',
    note: 'Runs the outer rim for a minute and a half and waits you out.',
  },
  {
    id: 'bijli',
    name: 'Bijli',
    form: 'the lightning hawk',
    attack: 0.82, defence: 0.36, stamina: 0.54, weight: 0.42, spin: -1,
    ink: '#d8a12c', wash: '#f6e6bd',
    note: 'Turns the wrong way on purpose. Meeting it head on costs you half your spin.',
  },
  {
    id: 'parvat',
    name: 'Parvat',
    form: 'the mountain bull',
    attack: 0.46, defence: 0.84, stamina: 0.5, weight: 0.95, spin: 1,
    ink: '#7a5a2f', wash: '#e6d8bd',
    note: 'Too heavy to move and too slow to chase. Pick one.',
  },
  {
    id: 'jaal',
    name: 'Jaal',
    form: 'the deep ray',
    attack: 0.32, defence: 0.62, stamina: 0.76, weight: 0.55, spin: -1,
    ink: '#2f8f8a', wash: '#c8e6e2',
    note: 'Left-spin and patient. Takes what it needs from every graze and gives nothing back.',
  },
  {
    id: 'rakt',
    name: 'Rakt',
    form: 'the crimson tiger',
    attack: 0.62, defence: 0.62, stamina: 0.62, weight: 0.6, spin: 1,
    ink: '#a8324f', wash: '#f0cdd6',
    note: 'No weakness and no answer either. Whoever launches better wins.',
  },

  // ------------------------------------------------------------------ rare
  {
    id: 'naag',
    name: 'Naag',
    form: 'the black cobra',
    attack: 0.98, defence: 0.24, stamina: 0.44, weight: 0.52, spin: -1,
    ink: '#2a2a32', wash: '#c9c6cf',
    note: 'One strike, and whichever of you is still in the dish afterwards was right.',
    rare: true,
  },
  {
    id: 'himraaj',
    name: 'Himraaj',
    form: 'the glacier',
    attack: 0.24, defence: 0.99, stamina: 0.76, weight: 1, spin: 1,
    ink: '#4a86b8', wash: '#d6e8f4',
    note: 'Has never been moved off the centre by anything. Also has never moved.',
    rare: true,
  },
  {
    id: 'deep',
    name: 'Deep',
    form: 'the lamp that is not put out',
    attack: 0.28, defence: 0.42, stamina: 0.92, weight: 0.34, spin: 1,
    ink: '#d8862c', wash: '#f8e2c4',
    note: 'Outlasts the round, the match and most of the people watching.',
    rare: true,
  },
  {
    id: 'kaal',
    name: 'Kaal',
    form: 'the hour',
    attack: 0.75, defence: 0.75, stamina: 0.75, weight: 0.7, spin: -1,
    ink: '#5a3a6b', wash: '#ddcfe6',
    note: 'Left-spin, heavy, and good at all three. There is no trick to it; it is simply better.',
    rare: true,
  },
];

export const BEAST_BY_ID = Object.fromEntries(BEASTS.map((b) => [b.id, b])) as Record<string, Beast>;

/**
 * A blader's quirk.
 *
 * Small on purpose. The beast decides how the fight goes; the blader decides
 * how the *launch* goes, which is the only part you actually control.
 */
export type Quirk = 'power' | 'aim' | 'guard' | 'bite' | 'endure' | 'wild' | 'dive' | 'rally';

export const QUIRK_TEXT: Record<Quirk, string> = {
  power: 'Rips harder. Every launch starts with more spin in it.',
  aim: 'Steady hands. The aim marker barely wanders.',
  guard: 'Braced. Takes a fifth less out of every hit.',
  bite: 'Puts a fifth more into every hit.',
  endure: 'Slow burn. Loses spin more slowly than anyone.',
  wild: 'Launches wide, along the rim, and takes the long way round.',
  dive: 'Launches straight down the middle and starts the argument early.',
  rally: 'Calls the beast sooner, and it stays out longer.',
};

export interface Blader {
  id: string;
  name: string;
  /** What the ring calls them. */
  handle: string;
  /** Where they turned up from. */
  home: string;
  /** The beast they carry, and the one you take off them. */
  beast: string;
  quirk: Quirk;
  ink: string;
  /**
   * How hard they are to beat, 0..1. The ladder is sorted by this, and it is
   * also the computer's skill dial.
   *
   * Set from the measured win rate of the beast they carry rather than from the
   * order they happened to get written in. Over 864 simulated rounds the eight
   * blader beasts land between 38% and 55% — close enough that the *player* on
   * the other side is what actually makes the sixth fight harder than the first.
   */
  grade: number;
  line: string;
  /**
   * Turns up only once all eight of the regulars have been beaten. The ladder
   * has to have somewhere left to go, and the four rare beasts have to be
   * carried by somebody.
   */
  wild?: boolean;
}

export const BLADERS: Blader[] = [
  {
    id: 'tejas',
    name: 'Tejas Rao',
    handle: 'Tej',
    home: 'the lane behind the water tank',
    beast: 'vaayu',
    quirk: 'aim',
    ink: '#2f6fc4',
    grade: 0.12,
    line: 'Learned on a wooden lattu and a length of jute string, and it shows in the launch.',
  },
  {
    id: 'kabir',
    name: 'Kabir Sen',
    handle: 'Baaz',
    home: 'two streets over, allegedly',
    beast: 'angaar',
    quirk: 'bite',
    ink: '#c23a2b',
    grade: 0.26,
    line: 'Has never once played for a draw and does not intend to start.',
  },
  {
    id: 'meera',
    name: 'Meera Iyer',
    handle: 'Deewar',
    home: 'the girls’ section, third floor',
    beast: 'shilaa',
    quirk: 'guard',
    ink: '#4a7a3a',
    grade: 0.4,
    line: 'Does nothing for forty seconds and then collects the round.',
  },
  {
    id: 'arnav',
    name: 'Arnav Bhatt',
    handle: 'Chakkar',
    home: 'the top of the stairs',
    beast: 'chandra',
    quirk: 'endure',
    ink: '#6a5ac2',
    grade: 0.76,
    line: 'Counts your spin down under his breath. He is usually right.',
  },
  {
    id: 'zoya',
    name: 'Zoya Qureshi',
    handle: 'Ulta',
    home: 'nobody is sure',
    beast: 'bijli',
    quirk: 'wild',
    ink: '#d8a12c',
    grade: 0.64,
    line: 'Spins the wrong way and lets your own launch do the damage.',
  },
  {
    id: 'dev',
    name: 'Dev Menon',
    handle: 'Patthar',
    home: 'the cycle stand',
    beast: 'parvat',
    quirk: 'power',
    ink: '#7a5a2f',
    grade: 0.52,
    line: 'Weighs the tin every morning and adds washers until it is right.',
  },
  {
    id: 'nila',
    name: 'Nila Fernandes',
    handle: 'Gehra',
    home: 'the fishing quarter',
    beast: 'jaal',
    quirk: 'rally',
    ink: '#2f8f8a',
    grade: 0.87,
    line: 'Takes a little of your spin every time you touch her and never seems to attack.',
  },
  {
    id: 'vikram',
    name: 'Vikram Ahluwalia',
    handle: 'Ustad',
    home: 'wherever the match is',
    beast: 'rakt',
    quirk: 'dive',
    ink: '#a8324f',
    grade: 0.97,
    line: 'Beat everyone on this list before you arrived and is waiting to see if it took.',
  },
];

export const WILD: Blader[] = [
  {
    id: 'stranger',
    name: 'the one at the back',
    handle: 'nobody asked',
    home: 'the last bench, every time',
    beast: 'naag',
    quirk: 'bite',
    ink: '#2a2a32',
    grade: 1,
    line: 'Has been watching all of these matches and has not once put a top in the dish.',
    wild: true,
  },
  {
    id: 'watchman',
    name: 'the night watchman',
    handle: 'Chowkidar',
    home: 'the gate, from six',
    beast: 'himraaj',
    quirk: 'guard',
    ink: '#4a86b8',
    grade: 1,
    line: 'Plays one match a night, at the gate, and has not lost one since anybody can remember.',
    wild: true,
  },
  {
    id: 'lampman',
    name: 'the man at the stall',
    handle: 'Deep-wala',
    home: 'the pavement outside',
    beast: 'deep',
    quirk: 'endure',
    ink: '#d8862c',
    grade: 1,
    line: 'Sells the tops. Has never sold the one he plays with.',
    wild: true,
  },
  {
    id: 'ustad',
    name: 'the one who taught them',
    handle: 'Guruji',
    home: 'nowhere in particular',
    beast: 'kaal',
    quirk: 'rally',
    ink: '#5a3a6b',
    grade: 1,
    line: 'Everybody on this ladder learned it off him, and none of them has taken a round.',
    wild: true,
  },
];

export const ALL_BLADERS = [...BLADERS, ...WILD];

export const BLADER_BY_ID = Object.fromEntries(
  ALL_BLADERS.map((b) => [b.id, b]),
) as Record<string, Blader>;

/** The ladder, easiest first. */
export const LADDER = [...BLADERS].sort((a, b) => a.grade - b.grade);
