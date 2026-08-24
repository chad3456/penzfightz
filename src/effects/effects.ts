/**
 * What is in the effects case.
 *
 * The games are the point of this site; this is the workshop shelf next to
 * them. One entry per effect, same shape as `games.ts` so the gallery can
 * render both from a list.
 */

export type EffectId = 'dotfield';

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
];

export const EFFECT_BY_ID = Object.fromEntries(EFFECTS.map((e) => [e.id, e])) as Record<
  EffectId,
  EffectDef
>;

export function isEffectId(v: string | null | undefined): v is EffectId {
  return !!v && v in EFFECT_BY_ID;
}
