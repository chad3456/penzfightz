import type { Character } from '../pencil/characters';

/**
 * Two people, built on the same knobs as the sketchbook cast.
 *
 * They have to read as adults rather than as the students the anime proportions
 * default to, so both get a longer face and smaller eyes set lower — the single
 * strongest age cue in this idiom is how much of the head the eyes take up.
 *
 * And they have to be told apart at the size of a thumb, in a panel, in the
 * dark. So the difference is loaded onto the silhouette: his hair is flat and
 * receding at the temples, hers is up for work and down afterwards, which is
 * the whole plot.
 */

/** Sells extended warranties on kitchen appliances. Thirty-two. */
export const GARETH: Character = {
  id: 'gareth',
  name: 'Gareth',
  note: 'Thirty-two. Sells cover for parts and labour. Talks to nobody who wants to be talked to.',
  jaw: 0.74,
  faceLen: 1.16,
  cheek: 0.88,
  eyeW: 0.6,
  eyeH: 0.28,
  eyeDx: 0.5,
  eyeY: 0.56,
  lash: 0.72,
  sharp: 0.55,
  browWeight: 1.15,
  browY: 1.5,
  fringe: 'parted',
  parting: -0.55,
  puff: 1.04,
  locks: 0.42,
  mouthW: 1.05,
};

/**
 * Works the tills. The same person in both halves of his day.
 *
 * `atWork` is not a different character — it is her with the hair up, and it is
 * the only thing that changes. If it were a different design the story would be
 * a cheat: the reader has to be able to see that it is obviously her, and to
 * believe that he does not.
 */
export const ROSA: Character = {
  id: 'rosa',
  name: 'Rosa',
  note: 'Works the tills at the big one on the ring road. Has never told him, and by now cannot.',
  jaw: 0.48,
  faceLen: 1.04,
  cheek: 0.95,
  eyeW: 0.66,
  eyeH: 0.4,
  eyeDx: 0.49,
  eyeY: 0.5,
  lash: 0.95,
  sharp: 0.3,
  browWeight: 0.86,
  browY: 1.6,
  fringe: 'straight',
  parting: 0.2,
  puff: 1.12,
  locks: 1.25,
  mouthW: 0.94,
};

/** The same woman, hair up, on shift. */
export const ROSA_AT_WORK: Character = {
  ...ROSA,
  id: 'rosa-work',
  puff: 0.99,
  locks: 0.16,
  fringe: 'straight',
};
