/**
 * What is in the effects case.
 *
 * The games are the point of this site; this is the workshop shelf next to
 * them. One entry per effect, same shape as `games.ts` so the gallery can
 * render both from a list.
 */

export type EffectId = 'dotfield' | 'rollcall' | 'crayon' | 'wash' | 'flat' | 'water';

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
  {
    id: 'crayon',
    name: 'Two Crayons',
    tagline: 'Two thousand eight hundred drawings in black and one colour.',
    blurb:
      'One black stick, one coloured one, and a sheet of rough paper. Every mark is pigment deposited a pixel at a time wherever the pressure of the stroke beats the tooth of the page — so the marks break up where the hand goes light, taper at the end, and two strokes crossing skip over the same bumps, because they are reading the same paper. Two hundred heads built from a grammar of eight families; sixteen hundred whole figures — cricket, football, games, work, gestures, people running and falling over — each one built on a line of action before a single limb goes on it; and a thousand staged scenes on a globe you can turn, where a bench, a horizon and three quarters of an empty page do the work no face this size could.',
    spec: ['200 heads · 1,600 figures · 1,000 scenes', '55 stagings, 72 poses', 'grain from paper tooth, not a filter'],
    ink: '#c2392b',
    wash: 'rgba(194, 57, 43, 0.09)',
  },
  {
    id: 'wash',
    name: 'Wet on Wet',
    tagline: 'A thousand watercolours, none of them painted.',
    blurb:
      'A thousand women at leisure — reading, listening, stretching, waiting — in two tubes of paint and a lot of water. Nothing in here paints a soft edge. Pigment and water are laid on the sheet in the shape of a pose and then a fluid solver runs on it in a pair of fragment shaders: the colour runs downhill, piles against the rim of the wet patch where the film thins, drops into the pits of the paper if it is heavy enough to, and blooms into a cauliflower wherever clean water lands on a wash that has started to set. Every edge, every dark rim, every grain of granulation is a consequence rather than a mark. Turn the globe and click one and it is painted again, larger — the same intention and a different accident.',
    spec: ['1,000 paintings · 70 poses', 'shallow water on the GPU', 'absorption, not colour'],
    ink: '#2f4f9b',
    wash: 'rgba(47, 79, 155, 0.09)',
  },
  {
    id: 'flat',
    name: 'Six Colours',
    tagline: 'Two and a half thousand drawings, six inks each.',
    blurb:
      'Bottles, teapots, jars, glasses, a vase of flowers, the people who would pick them up, and a globe of movie stars — every one made under the rule printed in its own corner: six inks, and not one line in the picture may be anything else. The colour of the marks has nothing to do with the colour of the thing. Local colour goes down first, translucent and loose, and then the six go round the form two or three times — broken, off-register, and disagreeing with it. The stars are that same face grammar plus the apparatus of publicity, because a plain portrait and a star portrait are the same head: what separates them is a backdrop, a light and a title in lettering underneath. Nothing here is simulated — this is the one medium in the study that really is a stamped round nib dragged along a path.',
    spec: ['2,400 drawings · 32 forms', '18 inks, six at a time', 'stars: staging, not likeness'],
    ink: '#1668f0',
    wash: 'rgba(22, 104, 240, 0.09)',
  },
  {
    id: 'water',
    name: 'Surface Tension',
    tagline: 'Two experiments in water, with the numbers exposed.',
    blurb:
      'A bench rather than a gallery: two shaders and the controls to take them apart, where every knob is a term in an equation rather than a style preset. First, goopy iridescent droplets — nothing draws a bead, each one adds a field falling off as one over distance squared and the droplet is wherever the sum crosses a threshold, so they merge and neck with no code aware of it; the colour is real thin-film interference, the path difference through the film evaluated at 650, 545 and 470 nanometres, which is why it comes out soap-bubble magenta and gold rather than an even spectrum. Second, a swimming pool built entirely in three.js — a height field running the wave equation, a tiled box, and two draw passes a frame, because you cannot refract what you have not drawn yet. The caustics on the floor are not a texture: they are the Laplacian of the surface above them, which is what a caustic actually is.',
    spec: ['metaballs · thin-film interference', 'wave equation on a height field', 'caustics from the Laplacian'],
    ink: '#17a5b8',
    wash: 'rgba(23, 165, 184, 0.09)',
  },
];

export const EFFECT_BY_ID = Object.fromEntries(EFFECTS.map((e) => [e.id, e])) as Record<
  EffectId,
  EffectDef
>;

export function isEffectId(v: string | null | undefined): v is EffectId {
  return !!v && v in EFFECT_BY_ID;
}
