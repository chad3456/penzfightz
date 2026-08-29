import { Sheet, hexToRgb, mulberry, PAPERS } from './sheet';
import { POSE_BY_ID } from './pose';
import { extent, makeFigure, paintFigure, BUILDS, type FigureRecipe } from './figure';
import { piece, type Frame, type Piece } from './stage';

/**
 * Fifty-five scenes.
 *
 * A figure doing something is a figure. A figure *somewhere*, with a bench and a
 * horizon and three quarters of the page left empty, is a picture — and the
 * whole difference is **staging**. Not detail: staging. The reference this
 * project is drawn from has one chef at the bottom right and one pan flying off
 * the top left, and the thing that makes it work is the distance between them.
 *
 * So a scene is written as a cast and a set, both placed in frame coordinates,
 * and the composition is the thing being authored. There are three rules it
 * keeps to:
 *
 * **The set is thin on purpose.** A bench is a slab, four legs and three slats.
 * The moment a piece of set is detailed enough to look at, it stops giving the
 * figure somewhere to be and starts competing with them.
 *
 * **Two people are a relationship, not two figures.** Where they are put decides
 * everything: a metre apart on a bench is company, and three metres apart on the
 * same bench is the opposite, drawn with exactly the same two poses.
 *
 * **Loneliness is a composition, not an expression.** You cannot draw it on a
 * face this size. You draw it by putting one small figure low in a large empty
 * frame, or by putting a crowd behind them — the crowd is what turns "the only
 * one drawn" into "alone".
 */

export interface Cast {
  /** A pose id from `pose.ts`. */
  pose: string;
  /** Centre of the figure, 0..1 across the frame. */
  x: number;
  /** Where the feet land, 0..1 down the frame. */
  y: number;
  /** Height of the figure as a fraction of the frame. */
  s: number;
  flip?: boolean;
  /** Reuse another cast member's colour, for two people dressed as a pair. */
  echo?: boolean;
}

export interface Set {
  kind: Piece;
  x: number;
  y: number;
  s: number;
  /** Drawn after the figures rather than before. */
  front?: boolean;
}

export interface Scene {
  id: string;
  name: string;
  /** The line under the name. */
  note: string;
  tag: 'alone' | 'together' | 'quiet' | 'doing';
  set: Set[];
  cast: Cast[];
}

const H = (x = 0.5, y = 0.86, s = 1): Set => ({ kind: 'horizon', x, y, s });

export const SCENES: Scene[] = [
  // ------------------------------------------------------------------- alone
  { id: 'bench1', name: 'On the bench', note: 'One end of it, most of an afternoon.', tag: 'alone',
    set: [ H(), { kind: 'bench', x: 0.36, y: 0.86, s: 1 }, { kind: 'tree', x: 0.82, y: 0.86, s: 0.8 }, ],
    cast: [{ pose: 'benchsit', x: 0.3, y: 0.78, s: 0.36 }] },
  { id: 'bench2', name: 'The far end of the bench', note: 'There is room. Nobody takes it.',
    tag: 'alone', set: [H(), { kind: 'bench', x: 0.5, y: 0.86, s: 1.2 }],
    cast: [{ pose: 'benchsit', x: 0.72, y: 0.78, s: 0.34, flip: true }] },
  { id: 'benchread', name: 'Reading in the park', note: 'Four pages in an hour and a half.',
    tag: 'quiet',
    set: [H(), { kind: 'bench', x: 0.42, y: 0.86, s: 1 }, { kind: 'birds', x: 0.78, y: 0.8, s: 1 }],
    cast: [{ pose: 'benchread', x: 0.38, y: 0.78, s: 0.36 }] },
  { id: 'feed', name: 'Feeding the birds', note: 'They come for the bread and not for him.',
    tag: 'quiet',
    set: [ H(), { kind: 'birds', x: 0.66, y: 0.84, s: 1.1 }, { kind: 'tree', x: 0.14, y: 0.86, s: 0.7 }, ],
    cast: [{ pose: 'feed', x: 0.42, y: 0.86, s: 0.3 }] },
  { id: 'lamp', name: 'Under the lamp', note: 'Waiting, or has decided not to go in yet.',
    tag: 'alone', set: [H(0.5, 0.88), { kind: 'lamp', x: 0.66, y: 0.88, s: 1 }],
    cast: [{ pose: 'pockets', x: 0.62, y: 0.88, s: 0.4 }] },
  { id: 'stop', name: 'At the stop',
    note: 'The board says four minutes. It has said four minutes for a while.', tag: 'alone',
    set: [H(), { kind: 'sign', x: 0.72, y: 0.86, s: 1 }],
    cast: [{ pose: 'pockets', x: 0.4, y: 0.86, s: 0.42 }] },
  { id: 'rainwait', name: 'Waiting for it to stop', note: 'Under the awning with somewhere to be.',
    tag: 'alone',
    set: [{ kind: 'rain', x: 0.5, y: 0.5, s: 1 }, H(), { kind: 'door', x: 0.3, y: 0.86, s: 1 }],
    cast: [{ pose: 'folded', x: 0.62, y: 0.86, s: 0.42 }] },
  { id: 'window1', name: 'At the window', note: 'Nothing out there. Looking anyway.', tag: 'quiet',
    set: [{ kind: 'window', x: 0.66, y: 0.9, s: 1 }, H(0.5, 0.9)],
    cast: [{ pose: 'lookout', x: 0.38, y: 0.9, s: 0.46, flip: true }] },
  { id: 'window2', name: 'At the window, late', note: 'The light is off. That is deliberate.',
    tag: 'alone',
    set: [ { kind: 'moon', x: 0.2, y: 0.16, s: 1 }, { kind: 'window', x: 0.7, y: 0.9, s: 1 }, H(0.5, 0.9), ],
    cast: [{ pose: 'lookout', x: 0.42, y: 0.9, s: 0.44, flip: true }] },
  { id: 'stairs1', name: 'On the stairs', note: 'Halfway up, and stopped there.', tag: 'alone',
    set: [H(0.5, 0.9), { kind: 'stairs', x: 0.5, y: 0.9, s: 1.2 }],
    cast: [{ pose: 'slump', x: 0.46, y: 0.68, s: 0.34 }] },
  { id: 'terrace', name: 'On the terrace', note: 'One cup, and the whole street to look at.',
    tag: 'quiet', set: [{ kind: 'parapet', x: 0.5, y: 0.82, s: 1 }, H(0.5, 0.94)],
    cast: [{ pose: 'lean', x: 0.36, y: 0.94, s: 0.44 }] },
  { id: 'rail1', name: 'At the railing',
    note: 'Leaning on it long enough to have decided something.', tag: 'quiet',
    set: [{ kind: 'railing', x: 0.5, y: 0.9, s: 1.1 }, H(0.5, 0.9)],
    cast: [{ pose: 'lean', x: 0.66, y: 0.9, s: 0.42, flip: true }] },
  { id: 'crowd', name: 'Alone in it', note: 'Everybody is going somewhere.', tag: 'alone',
    set: [H(0.5, 0.88), { kind: 'crowd', x: 0.6, y: 0.8, s: 1.1 }],
    cast: [{ pose: 'pockets', x: 0.3, y: 0.9, s: 0.46 }] },
  { id: 'phone', name: 'Waiting for it to ring', note: 'It is going to ring.', tag: 'alone',
    set: [H(0.5, 0.9), { kind: 'chair', x: 0.68, y: 0.9, s: 1 }],
    cast: [{ pose: 'phone', x: 0.36, y: 0.9, s: 0.46 }] },
  { id: 'bedread', name: 'Reading in bed', note: 'One more chapter, twice.', tag: 'quiet',
    set: [{ kind: 'bed', x: 0.46, y: 0.88, s: 1.1 }, H(0.5, 0.88)],
    cast: [{ pose: 'benchread', x: 0.5, y: 0.76, s: 0.32 }] },
  { id: 'awake', name: 'Not sleeping', note: 'Three in the morning and completely awake.',
    tag: 'alone',
    set: [ { kind: 'moon', x: 0.8, y: 0.18, s: 0.9 }, { kind: 'bed', x: 0.44, y: 0.88, s: 1.1 }, H(0.5, 0.88), ],
    cast: [{ pose: 'slump', x: 0.44, y: 0.76, s: 0.3 }] },
  { id: 'lockup', name: 'Locking up', note: 'Last one out, as usual.', tag: 'alone',
    set: [H(), { kind: 'door', x: 0.62, y: 0.86, s: 1 }],
    cast: [{ pose: 'point', x: 0.42, y: 0.86, s: 0.44 }] },
  { id: 'longway', name: 'The long way home', note: 'Twenty minutes further and worth it.',
    tag: 'alone',
    set: [ H(), { kind: 'lamp', x: 0.84, y: 0.86, s: 0.8 }, { kind: 'tree', x: 0.14, y: 0.86, s: 0.6 }, ],
    cast: [{ pose: 'walk', x: 0.46, y: 0.86, s: 0.4 }] },

  // ---------------------------------------------------------------- library
  { id: 'lib1', name: 'In the library', note: 'Third floor, where nobody goes.', tag: 'quiet',
    set: [{ kind: 'shelves', x: 0.66, y: 0.9, s: 1 }, H(0.5, 0.9)],
    cast: [{ pose: 'shelf', x: 0.42, y: 0.9, s: 0.46 }] },
  { id: 'lib2', name: 'Reading standing up', note: 'Has no intention of borrowing it.',
    tag: 'quiet', set: [{ kind: 'shelves', x: 0.32, y: 0.9, s: 0.9 }, H(0.5, 0.9)],
    cast: [{ pose: 'browse', x: 0.66, y: 0.9, s: 0.46, flip: true }] },
  { id: 'lib3', name: 'Asleep over the book', note: 'Page forty-one, for an hour.', tag: 'quiet',
    set: [ { kind: 'table', x: 0.5, y: 0.9, s: 1.1 }, { kind: 'shelves', x: 0.82, y: 0.9, s: 0.7 }, H(0.5, 0.9), ],
    cast: [{ pose: 'sleep', x: 0.44, y: 0.9, s: 0.42 }] },
  { id: 'lib4', name: 'Across the table', note: 'Two people who have not spoken in two hours.',
    tag: 'together', set: [{ kind: 'table', x: 0.5, y: 0.9, s: 1.3 }, H(0.5, 0.9)],
    cast: [ { pose: 'read', x: 0.32, y: 0.9, s: 0.4 }, { pose: 'read', x: 0.68, y: 0.9, s: 0.4, flip: true }, ] },
  { id: 'lib5', name: 'Looking up', note: 'And she has looked up too, which is the trouble.',
    tag: 'together', set: [{ kind: 'shelves', x: 0.5, y: 0.9, s: 1.3 }, H(0.5, 0.9)],
    cast: [ { pose: 'browse', x: 0.28, y: 0.9, s: 0.44 }, { pose: 'shelf', x: 0.74, y: 0.9, s: 0.44, flip: true }, ] },
  { id: 'lib6', name: 'The whole stack to himself', note: 'Which is what he came for.',
    tag: 'alone', set: [{ kind: 'shelves', x: 0.5, y: 0.9, s: 1.5 }, H(0.5, 0.9)],
    cast: [{ pose: 'browse', x: 0.62, y: 0.9, s: 0.34 }] },
  { id: 'study', name: 'Studying, the three of them', note: 'One is working.', tag: 'together',
    set: [{ kind: 'table', x: 0.5, y: 0.9, s: 1.4 }, H(0.5, 0.9)],
    cast: [ { pose: 'read', x: 0.24, y: 0.9, s: 0.36 }, { pose: 'sleep', x: 0.5, y: 0.9, s: 0.36 }, { pose: 'phone', x: 0.76, y: 0.9, s: 0.36, flip: true }, ] },

  // -------------------------------------------------------------- together
  { id: 'meet1', name: 'Meeting her at the gate', note: 'Both of them early, neither admitting it.',
    tag: 'together', set: [H(), { kind: 'door', x: 0.5, y: 0.86, s: 1.1 }],
    cast: [ { pose: 'wave', x: 0.24, y: 0.86, s: 0.44 }, { pose: 'wave', x: 0.76, y: 0.86, s: 0.44, flip: true }, ] },
  { id: 'meet2', name: 'She saw him first', note: 'He is still looking the other way.',
    tag: 'together', set: [H(), { kind: 'lamp', x: 0.5, y: 0.86, s: 0.9 }],
    cast: [ { pose: 'pockets', x: 0.26, y: 0.86, s: 0.44 }, { pose: 'wave', x: 0.78, y: 0.86, s: 0.42, flip: true }, ] },
  { id: 'meet3', name: 'Two on a bench, talking',
    note: 'Nearer the middle than either of them started.', tag: 'together',
    set: [H(), { kind: 'bench', x: 0.5, y: 0.86, s: 1.3 }],
    cast: [ { pose: 'benchsit', x: 0.42, y: 0.78, s: 0.34 }, { pose: 'benchsit', x: 0.6, y: 0.78, s: 0.34, flip: true }, ] },
  { id: 'meet4', name: 'Two on a bench, not talking', note: 'Same bench. All the difference.',
    tag: 'alone', set: [H(), { kind: 'bench', x: 0.5, y: 0.86, s: 1.5 }],
    cast: [ { pose: 'benchsit', x: 0.22, y: 0.78, s: 0.32 }, { pose: 'slump', x: 0.8, y: 0.78, s: 0.32, flip: true }, ] },
  { id: 'goodbye', name: 'Saying goodbye at the door', note: 'The last four minutes take twenty.',
    tag: 'together',
    set: [ H(), { kind: 'door', x: 0.24, y: 0.86, s: 1 }, { kind: 'lamp', x: 0.88, y: 0.86, s: 0.7 }, ],
    cast: [ { pose: 'wave', x: 0.42, y: 0.86, s: 0.44 }, { pose: 'walk', x: 0.72, y: 0.86, s: 0.42, flip: true }, ] },
  { id: 'stairs2', name: 'Passing on the stairs', note: 'Both of them turn round afterwards.',
    tag: 'together', set: [H(0.5, 0.92), { kind: 'stairs', x: 0.5, y: 0.92, s: 1.3 }],
    cast: [ { pose: 'walk', x: 0.34, y: 0.82, s: 0.36 }, { pose: 'walk', x: 0.66, y: 0.7, s: 0.34, flip: true }, ] },
  { id: 'rail2', name: 'Two at the railing',
    note: 'Looking at the same thing, saying nothing about it.', tag: 'together',
    set: [{ kind: 'railing', x: 0.5, y: 0.9, s: 1.2 }, H(0.5, 0.9)],
    cast: [ { pose: 'lean', x: 0.4, y: 0.9, s: 0.42 }, { pose: 'lean', x: 0.62, y: 0.9, s: 0.42 }, ] },
  { id: 'tree2', name: 'Under the tree', note: 'It rained for ten minutes and neither minded.',
    tag: 'together', set: [H(), { kind: 'tree', x: 0.5, y: 0.86, s: 1.3 }],
    cast: [ { pose: 'benchsit', x: 0.4, y: 0.86, s: 0.32 }, { pose: 'benchsit', x: 0.6, y: 0.86, s: 0.32, flip: true }, ] },
  { id: 'listen', name: 'One playing, one listening',
    note: 'He has played it four times. She has not said.', tag: 'together',
    set: [H(), { kind: 'rug', x: 0.5, y: 0.87, s: 1.2 }],
    cast: [ { pose: 'guitar', x: 0.34, y: 0.86, s: 0.46 }, { pose: 'benchsit', x: 0.72, y: 0.86, s: 0.34, flip: true }, ] },
  { id: 'party', name: 'The end of the party', note: 'Two left, and the chairs already stacked.',
    tag: 'together',
    set: [ H(), { kind: 'chair', x: 0.2, y: 0.86, s: 1 }, { kind: 'lamp', x: 0.86, y: 0.86, s: 0.6 }, ],
    cast: [ { pose: 'slump', x: 0.44, y: 0.86, s: 0.36 }, { pose: 'pockets', x: 0.66, y: 0.86, s: 0.4, flip: true }, ] },
  { id: 'queue', name: 'The queue', note: 'Nobody knows what it is for.', tag: 'together',
    set: [H(), { kind: 'counter', x: 0.74, y: 0.86, s: 0.8 }],
    cast: [ { pose: 'folded', x: 0.16, y: 0.86, s: 0.4 }, { pose: 'phone', x: 0.34, y: 0.86, s: 0.4 }, { pose: 'pockets', x: 0.52, y: 0.86, s: 0.4 }, ] },
  { id: 'served', name: 'Waiting to be served', note: 'He is here. He is just not coming over.',
    tag: 'together', set: [H(0.5, 0.9), { kind: 'counter', x: 0.5, y: 0.9, s: 1.2 }],
    cast: [ { pose: 'lean', x: 0.3, y: 0.9, s: 0.44 }, { pose: 'folded', x: 0.74, y: 0.9, s: 0.44, flip: true }, ] },
  { id: 'match', name: 'Watching the match', note: 'Three of them, one radio.', tag: 'together',
    set: [H(), { kind: 'parapet', x: 0.5, y: 0.8, s: 0.9 }],
    cast: [ { pose: 'folded', x: 0.3, y: 0.88, s: 0.38 }, { pose: 'hips', x: 0.5, y: 0.88, s: 0.38 }, { pose: 'shrug', x: 0.7, y: 0.88, s: 0.38, flip: true }, ] },
  { id: 'firstday', name: 'First day', note: 'Standing about, waiting to be told where to go.',
    tag: 'together',
    set: [ H(), { kind: 'pillar', x: 0.16, y: 0.86, s: 1 }, { kind: 'crowd', x: 0.7, y: 0.82, s: 0.9 }, ],
    cast: [{ pose: 'folded', x: 0.36, y: 0.88, s: 0.42 }] },

  // ------------------------------------------------------------------ doing
  { id: 'guitar1', name: 'Practising', note: 'The same four bars, on a Tuesday.', tag: 'doing',
    set: [ H(0.5, 0.9), { kind: 'chair', x: 0.72, y: 0.9, s: 1 }, { kind: 'rug', x: 0.44, y: 0.91, s: 1 }, ],
    cast: [{ pose: 'guitar', x: 0.42, y: 0.9, s: 0.5 }] },
  { id: 'guitar2', name: 'Playing to nobody', note: 'Which is most of what playing is.',
    tag: 'alone', set: [{ kind: 'window', x: 0.78, y: 0.9, s: 0.9 }, H(0.5, 0.9)],
    cast: [{ pose: 'guitar', x: 0.34, y: 0.9, s: 0.46 }] },
  { id: 'easel', name: 'At the easel', note: 'It is going badly and he knows it.', tag: 'doing',
    set: [H(0.5, 0.9), { kind: 'easel', x: 0.62, y: 0.9, s: 1 }],
    cast: [{ pose: 'paint', x: 0.36, y: 0.9, s: 0.48 }] },
  { id: 'desk', name: 'Working late', note: 'One lamp on in the whole floor.', tag: 'alone',
    set: [ { kind: 'table', x: 0.5, y: 0.9, s: 1.2 }, { kind: 'lamp', x: 0.76, y: 0.72, s: 0.55 }, H(0.5, 0.9), ],
    cast: [{ pose: 'read', x: 0.4, y: 0.9, s: 0.42 }] },
  { id: 'photo', name: 'Photographing the street', note: 'Nothing has happened yet.', tag: 'doing',
    set: [H(), { kind: 'crowd', x: 0.72, y: 0.82, s: 0.8 }],
    cast: [{ pose: 'photo', x: 0.3, y: 0.88, s: 0.46 }] },
  { id: 'sweepyard', name: 'Sweeping the yard', note: 'Before anyone else is up.', tag: 'doing',
    set: [ H(), { kind: 'door', x: 0.16, y: 0.86, s: 0.9 }, { kind: 'tree', x: 0.86, y: 0.86, s: 0.6 }, ],
    cast: [{ pose: 'sweep2', x: 0.46, y: 0.86, s: 0.44 }] },
  { id: 'chai', name: 'Tea on the terrace', note: 'It has gone cold and he will drink it anyway.',
    tag: 'quiet', set: [{ kind: 'parapet', x: 0.5, y: 0.84, s: 1 }, H(0.5, 0.94)],
    cast: [{ pose: 'chai', x: 0.62, y: 0.94, s: 0.42, flip: true }] },
  { id: 'carryup', name: 'Carrying it upstairs', note: 'Third trip. Two more.', tag: 'doing',
    set: [H(0.5, 0.92), { kind: 'stairs', x: 0.5, y: 0.92, s: 1.2 }],
    cast: [{ pose: 'bag', x: 0.42, y: 0.78, s: 0.4 }] },
  { id: 'corridor', name: 'On the phone in the corridor',
    note: 'Where it is quiet and everyone can hear.', tag: 'alone',
    set: [ H(0.5, 0.9), { kind: 'pillar', x: 0.78, y: 0.9, s: 1 }, { kind: 'pillar', x: 0.2, y: 0.9, s: 1 }, ],
    cast: [{ pose: 'phone', x: 0.48, y: 0.9, s: 0.44 }] },
  { id: 'kite', name: 'Flying it off the roof', note: 'Somebody else’s is up there too.',
    tag: 'doing',
    set: [ { kind: 'parapet', x: 0.5, y: 0.86, s: 1.1 }, { kind: 'birds', x: 0.72, y: 0.4, s: 1.4 }, ],
    cast: [{ pose: 'kite', x: 0.36, y: 0.94, s: 0.42 }] },
  { id: 'skiprope', name: 'Skipping in the lane', note: 'Fifty-one. Fifty-two.', tag: 'doing',
    set: [H(), { kind: 'door', x: 0.82, y: 0.86, s: 0.8 }],
    cast: [{ pose: 'skip', x: 0.42, y: 0.86, s: 0.44 }] },
  { id: 'marbles2', name: 'Down at the marbles', note: 'The whole street is watching this shot.',
    tag: 'doing', set: [H(), { kind: 'crowd', x: 0.76, y: 0.8, s: 0.7 }],
    cast: [{ pose: 'marbles', x: 0.34, y: 0.88, s: 0.36 }] },
];

export const SCENE_TAGS = [
  { id: 'alone', name: 'Alone' },
  { id: 'together', name: 'Together' },
  { id: 'quiet', name: 'Quiet' },
  { id: 'doing', name: 'Doing' },
] as const;

// ------------------------------------------------------------------ recipes

export interface SceneRecipe {
  seed: number;
  scene: Scene;
  /** One figure recipe per cast member. */
  cast: FigureRecipe[];
  accent: string;
  paper: number;
  /** Everybody shifted together, so no two prints are composed identically. */
  driftX: number;
  driftY: number;
  key: string;
}

export function makeScene(seed: number, only?: string): SceneRecipe {
  const r = mulberry(seed);
  const pool = only ? SCENES.filter((s) => s.tag === only) : SCENES;
  const scene = pool[Math.floor(r() * pool.length)];
  // One accent for the whole picture. Two colours in a two-colour drawing is
  // three colours.
  const lead = makeFigure(seed ^ 0x2b17);
  const cast = scene.cast.map((c, i) => {
    const f = makeFigure(seed ^ (0x9e37 * (i + 1)));
    const pose = POSE_BY_ID[c.pose] ?? f.pose;
    return { ...f, pose, accent: lead.accent, flip: c.flip ?? false };
  });
  return {
    seed,
    scene,
    cast,
    accent: lead.accent,
    paper: Math.floor(r() * PAPERS),
    driftX: (r() - 0.5) * 0.06,
    driftY: (r() - 0.5) * 0.03,
    key: `${scene.id}-${lead.accent}-${cast.map((c) => `${c.build}${c.dress}${c.face.pick.crown}`).join('')}`,
  };
}

/** A distinct set of scenes, by the same rejection sampler the rest uses. */
export function scenes(count: number, seed = 1, only?: string): SceneRecipe[] {
  const out: SceneRecipe[] = [];
  const seen = new Set<string>();
  let s = seed >>> 0;
  let tries = 0;
  while (out.length < count && tries < count * 300) {
    tries++;
    s = (Math.imul(s, 1103515245) + 12345) >>> 0;
    const rec = makeScene(s, only);
    if (seen.has(rec.key)) continue;
    seen.add(rec.key);
    out.push(rec);
  }
  return out;
}

// ------------------------------------------------------------------ drawing

/**
 * Draw one scene.
 *
 * Set behind, then the cast back to front by size — a figure drawn smaller is
 * further away, so it goes down first — then any set piece marked `front`, which
 * is how somebody sits *behind* a bench rather than on top of it.
 */
export function drawScene(rec: SceneRecipe, w: number, h: number): Sheet {
  const sheet = new Sheet(w, h, rec.seed, rec.paper);
  const r = mulberry(rec.seed ^ 0x6d1f);
  const f: Frame = {
    sheet,
    w,
    h,
    ink: hexToRgb('#141414'),
    col: hexToRgb(rec.accent),
    r,
    n: rec.seed & 0xffff,
  };

  const dx = rec.driftX;
  const dy = rec.driftY;
  for (const s of rec.scene.set) {
    if (s.front) continue;
    piece(f, s.kind, { x: s.x + dx, y: s.y + dy, s: s.s });
  }

  const order = rec.scene.cast.map((c, i) => ({ c, i })).sort((a, b) => a.c.s - b.c.s);
  for (const { c, i } of order) {
    const fig = rec.cast[i];
    const e = extent(fig.pose, fig.build / (BUILDS - 1));
    // `s` is the figure's height as a fraction of the frame, so a scene can be
    // composed once and the same numbers work at any print size.
    const u = (c.s * h) / e.h;
    paintFigure(sheet, fig, {
      cx: (c.x + dx) * w - e.midX * u * (c.flip ? -1 : 1),
      baseY: (c.y + dy) * h - e.bottom * u,
      u,
      flip: c.flip,
      // The set supplies the floor; a dash under every figure would be three
      // shadows in a room with one light.
      ground: false,
    });
  }

  for (const s of rec.scene.set) {
    if (!s.front) continue;
    piece(f, s.kind, { x: s.x + dx, y: s.y + dy, s: s.s });
  }

  return sheet;
}
