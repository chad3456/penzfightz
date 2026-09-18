/**
 * Two people, and what actually makes two anime faces read as different people.
 *
 * Not the expression — that is the other axis entirely, and a character who is
 * only distinguishable when smiling is not distinguishable. What separates them
 * is the constant stuff: the length of the jaw, how wide and how round the eye
 * is, where the brow sits at rest, and above all the hair, which is the thing a
 * viewer actually uses to tell one character from another at a glance.
 *
 * So these are the knobs, and they are deliberately few. A design system with
 * thirty parameters produces thirty ways to make the same face; the handful
 * here are the ones that change the silhouette.
 *
 * ── On whose faces these are ─────────────────────────────────────────────
 *
 * There is no reference art for either of them in this repository and none
 * reachable from it, so nothing here is a reproduction of an existing design —
 * these are two original characters built to be told apart, wearing the names
 * they were asked for. If the intention was a specific published pair, this
 * will not look like them, and that is worth knowing before rather than after.
 */

export type Fringe = 'straight' | 'parted' | 'spiky';

export interface Character {
  id: string;
  name: string;
  /** One line, for the card. */
  note: string;

  // ── head
  /** 0 is a round jaw, 1 a long angular one. */
  jaw: number;
  /** Multiplies the distance from the cranium centre to the chin. */
  faceLen: number;
  /** Width at the cheekbone, as a multiple of the cranium radius. */
  cheek: number;

  // ── eyes
  eyeW: number;
  eyeH: number;
  eyeDx: number;
  /** Distance below the cranium centre. */
  eyeY: number;
  /** Weight of the upper lash line — the heaviest mark on the face. */
  lash: number;
  /** 0 keeps the eye round, 1 narrows and sharpens the outer corner. */
  sharp: number;

  // ── brows
  browWeight: number;
  /** Height above the eye, in eye-heights. Low brows read as intent. */
  browY: number;

  // ── hair
  fringe: Fringe;
  /** Where the parting sits, -1 to 1. */
  parting: number;
  /** How far the hair mass stands off the skull. */
  puff: number;
  /** How far the side locks hang past the cheek. */
  locks: number;

  // ── mouth
  mouthW: number;
}

export const SASAKI: Character = {
  id: 'sasaki',
  name: 'Sasaki',
  note: 'Long jaw, low heavy brows, narrow eyes with a hard outer corner, and hair that has never been combed on purpose.',
  jaw: 0.82,
  faceLen: 1.1,
  cheek: 0.9,
  eyeW: 0.72,
  eyeH: 0.36,
  eyeDx: 0.52,
  eyeY: 0.5,
  lash: 1.15,
  sharp: 0.85,
  browWeight: 1.3,
  browY: 1.25,
  fringe: 'spiky',
  parting: -0.4,
  puff: 1.18,
  locks: 1.15,
  mouthW: 1.12,
};

export const TAYAMA: Character = {
  id: 'tayama',
  name: 'Tayama',
  note: 'A shorter, rounder face, eyes a size larger and kept round, fine brows set high, and a fringe that is looked after.',
  jaw: 0.42,
  faceLen: 0.94,
  cheek: 0.98,
  eyeW: 0.7,
  eyeH: 0.52,
  eyeDx: 0.49,
  eyeY: 0.44,
  lash: 0.9,
  sharp: 0.15,
  browWeight: 0.82,
  browY: 1.75,
  fringe: 'straight',
  parting: 0.12,
  puff: 1.1,
  locks: 0.85,
  mouthW: 0.9,
};

export const CAST: Character[] = [SASAKI, TAYAMA];
