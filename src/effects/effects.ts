/**
 * What is in the effects case.
 *
 * The games are the point of this site; this is the workshop shelf next to
 * them. One entry per effect, same shape as `games.ts` so the gallery can
 * render both from a list.
 */

export type EffectId = 'dotfield' | 'rollcall';

export interface EffectDef {
  id: EffectId;
  name: string;
  tagline: string;
  /** What it is actually doing, for the card. */
  blurb: string;
  /** The two or three numbers that define it, shown on the card. */
  spec: string[];
  ink: string;
  wash: string;
}

export const EFFECTS: EffectDef[] = [
  {
    id: 'dotfield',
    name: 'Dot Field',
    tagline: 'Type on a lattice that gets out of your way.',
    blurb:
      'Text is sampled onto a six-pixel grid and drawn back as three-pixel squares. The pointer pushes any square within a hundred and sixty-six pixels of it straight outwards, hardest at the centre and not at all at the edge. Nothing rotates, fades or blurs — the squares simply stand somewhere else, and a straight row of them bends into an arc on the way.',
    spec: [
      '6px lattice · 3px dot',
      'radius 166px · push 55px',
      'pointer eased 12%/frame',
    ],
    ink: '#8d8d8d',
    wash: 'rgba(140, 140, 140, 0.08)',
  },
  {
    id: 'rollcall',
    name: 'Roll Call',
    tagline: 'Two thousand things, none of them drawn.',
    blurb:
      'Nineteen hundred and thirty-one things across seventeen sets — a back bench, a staffroom, a night bus, a menagerie, a tank of crocodiles and fish, a press full of flattened flowers and the entire contents of a geometry box — standing on a globe you can turn, fly inside and pick things off. Hover one and it is re-inked at full size beside the pointer. Every one of them is sixty-four numbers found by novelty search and drawn by one pure p5 function; no picture exists anywhere in the repository. The note under a name is read off the same genes, so it always describes the thing above it.',
    spec: ['1,931 things · 17 sets', 'novelty search, not sampling', 'p5 into atlases, three.js instancing'],
    ink: '#7a6a55',
    wash: 'rgba(122, 106, 85, 0.09)',
  },
];

export const EFFECT_BY_ID = Object.fromEntries(EFFECTS.map((e) => [e.id, e])) as Record<
  EffectId,
  EffectDef
>;

export function isEffectId(v: string | null | undefined): v is EffectId {
  return !!v && v in EFFECT_BY_ID;
}
