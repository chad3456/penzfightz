/**
 * What is in the effects case.
 *
 * The games are the point of this site; this is the workshop shelf next to
 * them. One entry per effect, same shape as `games.ts` so the gallery can
 * render both from a list.
 */

export type EffectId =
  | 'dotfield'
  | 'rollcall'
  | 'crayon'
  | 'wash'
  | 'flat'
  | 'water'
  | 'dragon'
  | 'book'
  | 'epic';

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
    spec: ['1,000 paintings · 70 poses', 'shallow water on the GPU', 'the wash bleeds, she does not'],
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
      'A bench rather than a gallery: two shaders and the controls to take them apart, where every knob is a term in an equation rather than a style preset. First, gluey iridescent droplets, drawn rather than rendered — nothing puts down a bead, each one adds a field falling off as one over distance squared and the droplet is wherever the sum crosses a threshold, so they merge and neck with no code aware of it. The colour is real thin-film interference, the path difference through the film evaluated at 650, 545 and 470 nanometres, but the answer indexes a painted palette instead of being emitted as a spectrum; the light is posterised into four steps, the highlight is a dot with an edge, the shadow is flat and offset, there is grain over the lot, and the big ones have eyes. Second, a swimming pool built entirely in three.js — a height field running the wave equation, a tiled box, and two draw passes a frame, because you cannot refract what you have not drawn yet. The caustics on the floor are not a texture: they are the Laplacian of the surface above them, which is what a caustic actually is.',
    spec: ['metaballs · thin-film interference', 'posterised, grained, drawn', 'caustics from the Laplacian'],
    ink: '#17a5b8',
    wash: 'rgba(23, 165, 184, 0.09)',
  },
  {
    id: 'dragon',
    name: 'Ink and Water',
    tagline: 'A dragon that is made of the water it swims in.',
    blurb:
      'A Chinese dragon and its phoenixes, swimming through a real fluid. Nothing here is a sprite and nothing is drawn on top: every frame the creatures print themselves into the same dye texture the solver advects, and shove the velocity field sideways as they go — so a fold of the dragon’s own wake catches its tail a moment later and pulls it apart into filaments. Underneath is Stam’s solver in p5 framebuffers: advect, put back the curl the grid ate, measure divergence, and eighteen Jacobi passes to find the pressure that cancels it. That last step is the whole piece; without it the ink only spreads, and spreading is what smoke does. The composite pass decides what all this looks like — wet silk, dispersion along the slope of the ink so a fold fringes blue on one side and warm on the other, absorption so the thick folds go dark and only the thin edges glow, and gold pooled along the wet edge where a real line dries last. Draw through it.',
    spec: ['Navier–Stokes in p5', 'the creature is the dye', 'dispersion, absorption, gold edge'],
    ink: '#c8952f',
    wash: 'rgba(200, 149, 47, 0.09)',
  },
  {
    id: 'book',
    name: 'Picture Book',
    tagline: 'A hundred neighbours, none of them anybody.',
    blurb:
      'The other galleries here make a thousand of something and the number is the argument — how far one method goes before it repeats. This one is deliberately small, because the claim is different: whether a generator can hold a single illustrator’s hand steady across a whole cast, so a hundred faces read as a hundred spreads from one book rather than a hundred outputs from one program. So the mark never changes. Every card gets the same torn ground, the same warm charcoal line, the same pencil scuff over every fill and the same grain on top; what changes underneath is the head, the hair, the hat, the glasses and the shirt. Nothing is a photograph or a trace of one. A beard is nine hundred drawn strands with the width falling off towards the tip, so its silhouette is made of ends rather than of a curve; straw is two passes of short strokes crossing at a shallow angle; and the caption is read off the same seed as the picture, so the trade always matches the hat.',
    spec: ['100 people · one hand', 'fibre drawn as fibre', 'the caption comes from the face'],
    ink: '#d8a63c',
    wash: 'rgba(216, 166, 60, 0.1)',
  },
  {
    id: 'epic',
    name: 'Name and Form',
    tagline: 'Two thousand out of the epics, in one hand.',
    blurb:
      'Nāma-rūpa — name and form. Two thousand figures out of the Mahābhārata, the Rāmāyaṇa and the asura literature, drawn by the same hand as Picture Book: the same head, the same torn ground, the same crayon scuff and grain. That is the point of doing it this way — the picture book claims that a generator can hold one illustrator’s hand steady across a cast, and the honest test of the claim is to hand that hand a completely different subject. Two hundred and sixty-eight of these are figures the texts name, each carrying only the attributes the texts give them: that this one is dark as a rain cloud, that one wears matted locks, that one has fangs, that one bound her own eyes for a lifetime. Everything else about the face comes from the seed. The rest are the host — the epics count thousands they never name, eighteen akshauhinis at Kurukshetra and a vanara army at the bridge, and every one of those cards says so on its face. Nothing here is a likeness and nothing here could be.',
    spec: ['2,000 figures · 268 named', 'crowns, marks and fangs from the texts', 'the host is counted, not named'],
    ink: '#d0762c',
    wash: 'rgba(208, 118, 44, 0.1)',
  },
];

export const EFFECT_BY_ID = Object.fromEntries(EFFECTS.map((e) => [e.id, e])) as Record<
  EffectId,
  EffectDef
>;

export function isEffectId(v: string | null | undefined): v is EffectId {
  return !!v && v in EFFECT_BY_ID;
}
