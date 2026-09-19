/**
 * THE SMOKING AREA — one issue.
 *
 * A man who sells extended warranties has one good ten minutes a day, in the
 * gap between the bottle bank and the wall, with a woman he does not recognise.
 * She served him twenty minutes earlier. She has never told him.
 *
 * ── What the story is actually about ─────────────────────────────────────
 *
 * The mix-up is the engine, not the point. The point is that he is invisible at
 * work and cannot see that he does the same thing to her — the alley is the one
 * place either of them is a person, and he thinks he is the only one who needed
 * it. So the reader is told early, in a panel he is not in, and spends the rest
 * of the issue knowing something he does not. Nothing is ever revealed to him.
 * Revealing it would turn this into a story about a misunderstanding, and it is
 * not one.
 *
 * Her badge is on the page in issue order before the alley ever happens. A
 * reader who catches it on page two reads the rest differently, which is the
 * whole design.
 */
import type { Face } from '../pencil/expressions';
import { FACES } from '../pencil/expressions';
import type { Character } from '../pencil/characters';
import { GARETH, ROSA } from './cast';

const look = (name: string): Face => {
  const f = FACES.find((x) => x.name === name);
  // A typo in an expression name would otherwise silently draw the first face
  // in the list — a hundred panels of mild surprise, and no error anywhere.
  if (!f) throw new Error(`script: no expression called "${name}"`);
  return f;
};

export type Who = 'him' | 'her';

export type Shot =
  | { kind: 'floor' }
  | { kind: 'desk' }
  | { kind: 'phone' }
  | { kind: 'clock'; time: string }
  | { kind: 'shopfront' }
  | { kind: 'aisle' }
  | { kind: 'till'; serving: boolean }
  | { kind: 'badge' }
  | { kind: 'alley'; who: 'none' | 'him' | 'both'; lit: boolean; rain?: boolean }
  | { kind: 'corridor' }
  | { kind: 'close'; who: Who; expr: Face; smoke?: boolean }
  | { kind: 'hands' }
  | { kind: 'black' };

export interface Balloon {
  who: Who | 'off';
  text: string;
  /** Fractional position inside the panel. */
  at: [number, number];
  /** Where the tail points, fractional. Omitted for an off-panel voice. */
  tail?: [number, number];
  /** A thought, or a whisper. */
  style?: 'speak' | 'think' | 'small';
}

export interface Panel {
  /** Fractional bounds on the page: x, y, width, height. */
  at: [number, number, number, number];
  shot: Shot;
  caption?: string;
  /** A second caption, pinned to the bottom of the panel. */
  footer?: string;
  balloons?: Balloon[];
  sfx?: string;
}

export interface Page {
  n: number;
  title?: string;
  panels: Panel[];
}

export const CAST: Record<Who, Character> = { him: GARETH, her: ROSA };

// A four-row page, in fractions, so panels can be written by row.
const R1 = 0.0, R2 = 0.26, R3 = 0.52, R4 = 0.78;
const H = 0.235;

export const ISSUE: Page[] = [
  // ─────────────────────────────────────────────────── one: the script
  {
    n: 1,
    title: 'THE SCRIPT',
    panels: [
      {
        at: [0, R1, 1, H],
        shot: { kind: 'floor' },
        caption: 'GARETH IS THIRTY-TWO. HE SELLS EXTENDED WARRANTIES ON KITCHEN APPLIANCES.',
      },
      {
        at: [0, R2, 0.48, H],
        shot: { kind: 'close', who: 'him', expr: look('Concentrating') },
        balloons: [{
          who: 'him',
          text: '—AND THAT’S PARTS *AND* LABOUR, SO IF THE DRUM GOES YOU’RE NOT—',
          at: [0.58, 0.16], tail: [0.36, 0.6],
        }],
      },
      {
        at: [0.52, R2, 0.48, H],
        shot: { kind: 'phone' },
        caption: 'THEY RING OFF AT ABOUT ELEVEN SECONDS.',
        footer: 'HE HAS COUNTED.',
      },
      {
        at: [0, R3, 0.62, H],
        shot: { kind: 'desk' },
        balloons: [
          // Kept left, away from him: the voice comes from somewhere else in
          // the room, and a balloon over his head would also hide it.
          { who: 'off', text: 'GAZZA! NUMBERS!', at: [0.3, 0.14] },
          { who: 'him', text: 'YEP.', at: [0.55, 0.72], tail: [0.74, 0.56], style: 'small' },
        ],
      },
      {
        at: [0.66, R3, 0.34, H],
        shot: { kind: 'close', who: 'him', expr: look('Deadpan') },
      },
      {
        at: [0, R4, 1, H],
        shot: { kind: 'clock', time: '17:59' },
        caption: 'NOTHING HAPPENS UNTIL SIX.',
      },
    ],
  },

  // ─────────────────────────────────────────────────── two: the shop
  {
    n: 2,
    title: 'FOUR THINGS',
    panels: [
      { at: [0, R1, 0.55, H], shot: { kind: 'shopfront' }, caption: 'THE BIG ONE ON THE RING ROAD.' },
      {
        at: [0.59, R1, 0.41, H],
        shot: { kind: 'aisle' },
        caption: 'BREAD. MILK. SOUP.',
        footer: 'AND THE YELLOW-STICKER THING NOBODY ELSE WANTED.',
      },
      {
        at: [0, R2, 1, H],
        shot: { kind: 'till', serving: true },
        balloons: [{ who: 'her', text: 'HIYA. D’YOU NEED A BAG?', at: [0.62, 0.2], tail: [0.72, 0.52] }],
      },
      {
        at: [0, R3, 0.5, H],
        shot: { kind: 'close', who: 'him', expr: look('Distracted') },
        balloons: [{ who: 'him', text: 'NO, TA.', at: [0.6, 0.18], tail: [0.44, 0.5] }],
      },
      {
        at: [0.54, R3, 0.46, H],
        // The reader is given her name here, in the third panel of page two,
        // and he is not in this shot at all.
        shot: { kind: 'badge' },
        caption: 'ROSA.',
      },
      {
        at: [0, R4, 1, H],
        shot: { kind: 'till', serving: false },
        balloons: [{ who: 'her', text: 'HAVE A NICE EVENING!', at: [0.58, 0.18], tail: [0.7, 0.5] }],
        footer: 'HE IS ALREADY TURNING. HE HAS NEVER ONCE LOOKED UP.',
      },
    ],
  },

  // ─────────────────────────────────────────────────── three: the alley
  {
    n: 3,
    title: 'THE GAP',
    panels: [
      {
        at: [0, R1, 1, H],
        shot: { kind: 'alley', who: 'none', lit: false },
        caption: 'THERE IS A GAP BETWEEN THE BOTTLE BANK AND THE WALL.',
      },
      {
        at: [0, R2, 0.44, H],
        shot: { kind: 'close', who: 'him', expr: look('Tired'), smoke: true },
        sfx: 'ssk',
      },
      {
        at: [0.48, R2, 0.52, H],
        shot: { kind: 'alley', who: 'him', lit: true },
        balloons: [{ who: 'off', text: 'ANY CHANCE OF A LIGHT?', at: [0.62, 0.16] }],
      },
      {
        at: [0, R3, 0.52, H],
        // Coat, hair down, no badge. Same woman, twenty minutes later.
        shot: { kind: 'close', who: 'her', expr: look('Mischievous') },
        // Up top with the rest of them: a close-up head fills the middle of its
        // panel, so the only free paper is the upper right, and a balloon put
        // anywhere else lands on the face it is coming out of.
        balloons: [{ who: 'her', text: 'MINE’S BEEN DEAD SINCE TUESDAY.', at: [0.58, 0.18], tail: [0.46, 0.56] }],
      },
      {
        at: [0.56, R3, 0.44, H],
        shot: { kind: 'hands' },
        sfx: 'clk',
      },
      {
        at: [0, R4, 1, H],
        shot: { kind: 'alley', who: 'both', lit: true },
        caption: 'THIS IS THE GOOD PART OF THE DAY.',
        footer: 'IT IS ALSO, IF HE IS HONEST, ALL OF IT.',
      },
    ],
  },

  // ─────────────────────────────────────────────────── four: the weeks
  {
    n: 4,
    title: 'AND AGAIN',
    panels: [
      { at: [0, R1, 0.32, H], shot: { kind: 'floor' }, caption: 'MONDAY.' },
      { at: [0.34, R1, 0.32, H], shot: { kind: 'till', serving: true }, caption: 'MONDAY.' },
      { at: [0.68, R1, 0.32, H], shot: { kind: 'alley', who: 'both', lit: true }, caption: 'MONDAY.' },
      {
        at: [0, R2, 1, H],
        shot: { kind: 'corridor' },
        caption: 'SHE TAKES IT OFF IN THE CORRIDOR, EVERY NIGHT, BEFORE SHE GOES OUT THE FIRE DOOR.',
      },
      {
        at: [0, R3, 0.46, H],
        shot: { kind: 'badge' },
        caption: 'AT FIRST SHE DIDN’T TELL HIM BECAUSE IT WAS FUNNY.',
      },
      {
        at: [0.5, R3, 0.5, H],
        shot: { kind: 'close', who: 'her', expr: look('Giggling') },
        balloons: [{ who: 'her', text: 'YOU’RE JOKING. *EXTENDED WARRANTIES?*', at: [0.5, 0.16], tail: [0.4, 0.5] }],
      },
      {
        at: [0, R4, 1, H],
        shot: { kind: 'alley', who: 'both', lit: true },
        footer: 'AND THEN, FAIRLY QUICKLY, BECAUSE IT WASN’T.',
      },
    ],
  },

  // ─────────────────────────────────────────────────── five: the good part
  {
    n: 5,
    title: 'LIKE A PERSON',
    panels: [
      {
        at: [0, R1, 1, H],
        shot: { kind: 'alley', who: 'both', lit: true, rain: true },
        sfx: 'tk  tk    tk',
      },
      {
        at: [0, R2, 0.46, H],
        shot: { kind: 'close', who: 'him', expr: look('Wistful'), smoke: true },
        balloons: [{ who: 'him', text: 'CAN I SAY SOMETHING A BIT SAD?', at: [0.56, 0.16], tail: [0.42, 0.52] }],
      },
      {
        at: [0.5, R2, 0.5, H],
        shot: { kind: 'close', who: 'her', expr: look('Fond') },
        balloons: [{ who: 'her', text: 'GO ON THEN.', at: [0.56, 0.16], tail: [0.46, 0.5] }],
      },
      {
        at: [0, R3, 1, H],
        shot: { kind: 'close', who: 'him', expr: look('Lonely'), smoke: true },
        balloons: [{
          who: 'him',
          text: 'YOU’RE THE ONLY PERSON ALL DAY WHO TALKS TO ME LIKE I’M A PERSON.',
          at: [0.68, 0.2], tail: [0.44, 0.56],
        }],
      },
      {
        at: [0, R4, 0.48, H],
        // Everything the issue has is in this panel. She could say it here.
        shot: { kind: 'close', who: 'her', expr: look('Trying not to cry') },
        balloons: [{ who: 'her', text: 'YEAH.', at: [0.62, 0.16], tail: [0.48, 0.48], style: 'small' }],
      },
      {
        at: [0.52, R4, 0.48, H],
        shot: { kind: 'close', who: 'her', expr: look('Grateful') },
        balloons: [{ who: 'her', text: 'SAME.', at: [0.6, 0.18], tail: [0.46, 0.5] }],
      },
    ],
  },

  // ─────────────────────────────────────────────────── six: the badge
  {
    n: 6,
    title: 'SIX O’CLOCK TOMORROW',
    panels: [
      {
        at: [0, R1, 1, H * 1.1],
        shot: { kind: 'alley', who: 'none', lit: false, rain: true },
        caption: 'HE GOES HOME AND HEATS THE SOUP.',
      },
      {
        at: [0, 0.29, 0.5, H * 1.1],
        shot: { kind: 'corridor' },
        caption: 'SHE GOES BACK IN FOR THE LAST HOUR.',
      },
      {
        at: [0.54, 0.29, 0.46, H * 1.1],
        shot: { kind: 'badge' },
        sfx: 'clip',
      },
      {
        at: [0, 0.58, 1, H * 1.25],
        shot: { kind: 'close', who: 'her', expr: look('Small smile') },
        footer:
          'HER NAME IS ROSA. IT IS PINNED FOUR INCHES BELOW THE PLACE HIS EYES STOP.',
      },
      {
        at: [0, 0.885, 1, 0.11],
        shot: { kind: 'black' },
        caption: 'END OF ISSUE ONE.',
      },
    ],
  },
];

export const PANEL_COUNT = ISSUE.reduce((n, p) => n + p.panels.length, 0);
