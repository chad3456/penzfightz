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
  | 'epic'
  | 'cards'
  | 'underground'
  | 'whitenights'
  | 'darshan'
  | 'hundred'
  | 'breath'
  | 'wobble'
  | 'pencil'
  | 'ramayana'
  | 'comic'
  | 'film'
  | 'frieze'
  | 'castle'
  | 'nightwalkers'
  | 'fermi'
  | 'diary'
  | 'marauder'
  | 'ramanime'
  | 'sindoor'
  | 'ahmedabad'
  | 'ride'
  | 'heatwave'
  | 'banter';

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
  {
    id: 'cards',
    name: 'Fifty-Two Cats',
    tagline: 'A full deck where the pips are objects and a cat is interfering.',
    blurb:
      'Fifty-two cards and both jokers, drawn at request time in canvas 2d — cream stock with fibre and foxing, one printing ink, a hand-cut pen line with a taper on it, hatch and stipple for anything manufactured, and three impressions through a press so the ink spreads and the register is a hair out. The rule every card obeys is the one the reference invented: the pips are things. Five diamonds are five things somebody has pegged out to dry; ten clubs are what was on the shelf before the shelf was investigated. The pip count is audited rather than assumed — the deck will draw all fifty-four and count what actually reached the paper.',
    spec: ['54 cards · 52 jokes', 'pip count audited, not assumed', 'six engraving techniques, one ink'],
    ink: '#c8352c',
    wash: 'rgba(200, 53, 44, 0.09)',
  },
  {
    id: 'underground',
    name: 'Notes from Under the Stairs',
    tagline: 'One joke, a thousand times, in a city where it is always four in the afternoon.',
    blurb:
      'A thousand single-panel cartoons in one register — the confession that wants applause, the generosity that follows the beggar for six streets to see what he does with the money, the two-year campaign of revenge for a slight the other man never noticed. Nothing is written out: fifty mechanisms, each a shape of joke rather than a sentence with holes in it, and ten vocabularies supplying the specifics. The picture is never the punchline; it is the situation, drawn in spot black on grey paper with one warm light in it, and the turn is the italic line underneath.',
    spec: ['1,000 panels · 50 mechanisms', 'nine settings, chosen by the joke', 'spot black, one ochre light'],
    ink: '#c8842a',
    wash: 'rgba(200, 132, 42, 0.09)',
  },
  {
    id: 'whitenights',
    name: 'White Nights',
    tagline: 'A thousand faces, and every word written by hand.',
    blurb:
      'A thousand story cards for Dostoevsky’s four nights on the Petersburg embankment — a portrait and a line of dialogue apiece. The dialogue is handwritten rather than set: a cursive alphabet kept as skeletons, joined letter to letter, and inked with a pointed nib whose width comes from the direction it is travelling, so downstrokes are heavy and upstrokes are hairlines. The faces are built rather than drawn — a head is a set of landmarks in three dimensions, and a three-quarter view is those landmarks turned about a vertical axis, so the far eye foreshortens and the far cheek goes behind the nose without being told to. A dozen of the lines are Dostoevsky’s own and say so.',
    spec: ['1,000 cards · 5,000 in the grammar', 'a written hand, not a font', 'faces projected, not warped'],
    ink: '#b58b4a',
    wash: 'rgba(181, 139, 74, 0.09)',
  },
  {
    id: 'darshan',
    name: 'Darshan',
    tagline: 'Thirteen gods, thirty-two postures each, none of them drawn.',
    blurb:
      'Four hundred and sixteen flat-vector portraits of Hindu deities, and not one of them exists as a drawing anywhere. A jointed figure is posed — tribhanga, the triple bend every Krishna in stone stands in; alidha, the archer’s lunge; padmasana, seated — and then lit by a single terminator that crosses the entire body, so thirty separate shapes turn away from the light at the same moment and read as one person rather than as thirty correctly-lit objects. The iconography is the received one and not invented: skin the colour of a rain cloud and a flute in the hand is Krishna, and a discus in that same hand would make it Vishnu.',
    spec: ['416 portraits · 28 poses · one light', 'a rig, not a silhouette', 'attributes name the god'],
    ink: '#c08a3a',
    wash: 'rgba(192, 138, 58, 0.1)',
  },
  {
    id: 'hundred',
    name: 'A Hundred Ways',
    tagline: 'One picture, a hundred techniques, and none of them knows what it is drawing.',
    blurb:
      'A portrait is drawn once, tonally, into an offscreen buffer — and then a hundred illustration techniques each resample the same luminance and region fields. Engraving, stipple, woodcut, mezzotint, riso, voronoi, flow field, error diffusion, ASCII, embroidery, kolam, thermogram, anaglyph. None of them is told what the subject is, which is precisely why all hundred draw the same subject: a technique is a rule for turning tone into marks, and the rule is the only thing that changes between them. The picture itself is a composition rather than a likeness — the framing, the low key and the bar neon.',
    spec: ['100 techniques · one source field', 'resampling, not redrawing', 'tone in, marks out'],
    ink: '#b08a3c',
    wash: 'rgba(176, 138, 60, 0.1)',
  },
  {
    id: 'breath',
    name: 'One Breath',
    tagline: 'Four or five marks each, and a great deal of paper.',
    blurb:
      'A hundred brush drawings of one woman in six attitudes — lying down, in profile, turned away, head back, resting on her arms, head and shoulders. Nothing is stroked and nothing is outlined and filled: a stroked path has one width along its whole length and a brush is nothing but its change of width, so every mark is a ribbon offset to both sides by however hard the hand was pressing. Thin is also pale, because a brush carrying less pigment lays down less of it. The economy is the subject: the silhouette is almost never the face.',
    spec: ['100 drawings · one loaded brush', 'width is pressure, and so is colour', 'six attitudes, one gesture each'],
    ink: '#e2551f',
    wash: 'rgba(226, 85, 31, 0.1)',
  },
  {
    id: 'wobble',
    name: 'Wobble',
    tagline: 'Six jelly dice on a dished table, and none of them lands like a bone one.',
    blurb:
      'Dice made of jelly. The body is transmissive and deep enough to carry its colour by absorption rather than by paint, the pips are lentils sunk just under the surface so the far ones show through the near ones, and there is a piece of fruit set in the middle like a sweet. Every landing flattens a die along the direction it was travelling and a soft damped spring lets it back out over about a second. Poke one and it jumps; take hold of one and it stretches towards your hand. Real rigid-body physics underneath, so the number that comes up is the number it actually landed on — and a die propped on an edge is flicked rather than read.',
    spec: ['6 flavours · 1 to 6 dice', 'squash along the direction of travel', 'cocked dice get flicked, not read'],
    ink: '#e0378f',
    wash: 'rgba(224, 55, 143, 0.1)',
  },
  {
    id: 'pencil',
    name: 'Sasaki & Tayama',
    tagline: 'Two characters, fifty expressions each, one pencil.',
    blurb:
      'A hundred pencil sketches: fifty named expressions — grief, scepticism, cold fury, the moment somebody realises — each one drawn twice, once for each of two characters, so every card has a twin one place along. Nothing is stroked: a stroked path has one darkness and two clean edges, and graphite has neither, so every mark is a run of small deposits whose spacing flickers with the tooth of the paper, laid two or three times over because a sketched line is several passes that nearly agree. The construction circle is left showing under the face, because rubbing it out would stop the drawing reading as a sketch. What separates the two of them is never the expression — it is the jaw, the eye shape, where the brow sits at rest, and above all the hair.',
    spec: ['50 expressions × 2 characters', 'deposits, never strokes', 'black and white, on paper'],
    ink: '#6d665c',
    wash: 'rgba(109, 102, 92, 0.12)',
  },
  {
    id: 'ramayana',
    name: 'The Ramayana, in rooms',
    tagline: 'Twenty-five isometric rooms, printed one ink at a time.',
    blurb:
      'The whole epic as twenty-five cutaway rooms — a fire hall with no heir in it, a chamber where somebody is talked out of herself, a grove where a woman waits ten months under a tree. Nothing is painted directly: every surface writes coverage onto one plate per ink, and the plates are screened into dots at their own angles and overprinted, which is what a risograph does and why the greens go brown where they cross the navy. In each room there is a small light keeping somebody company. It never speaks, never hands anybody anything, and nothing in the epic happens differently because it is there.',
    spec: ['25 rooms · 5 inks · 5 screen angles', 'coverage, then dots, then overprint', 'the light never acts in the story'],
    ink: '#3d4f78',
    wash: 'rgba(61, 79, 120, 0.12)',
  },
  {
    id: 'comic',
    name: 'The Smoking Area',
    tagline: 'One issue. He has ten good minutes a day and no idea who she is.',
    blurb:
      'A man in his early thirties sells extended warranties on kitchen appliances and is invisible at work. The one good part of his day is a cigarette in the gap between the bottle bank and the wall, with a woman who is easy to talk to. She served him at the till twenty minutes earlier and he has never once recognised her. The mix-up is the engine, not the point: the reader is told on page two, in a panel he is not in, and nothing is ever revealed to him — because revealing it would make this a story about a misunderstanding, and it is not one. Six pages, drawn in pencil, where nothing at all is stroked.',
    spec: ['6 pages · 34 panels', 'graphite deposits, never ctx.stroke()', 'the reader knows, he does not'],
    ink: '#4a4640',
    wash: 'rgba(74, 70, 64, 0.12)',
  },
  {
    id: 'film',
    name: 'A Small Light, Carried',
    tagline: 'Twenty-seven seconds of Rāma, with Rāma left out of it.',
    blurb:
      'A lantern film. One eyepiece is pointed at a dozen unrelated subjects — a bow measured in cubits, a natural-history plate of a deer that never existed, a branch of ashoka mounted like a herbarium sheet, a chart of the road south, a flame, an arrow’s arc, the moon over Lanka, two wooden sandals, a city of lit windows — and what they have in common is the whole of the film. He is never drawn: a drawing of him would be somebody’s idea of him, and a drawing of his bow is only ever a bow. Every frame is a pure function of one number, so it renders identically at any rate and can be written out to a file.',
    spec: ['12 plates · 27 seconds · one lens', 'every frame a function of t', 'the subject is never shown'],
    ink: '#e8b24a',
    wash: 'rgba(232, 178, 74, 0.12)',
  },
  {
    id: 'frieze',
    name: 'The Ramayana, along one page',
    tagline: 'His whole life, left to right, on ruled exercise paper.',
    blurb:
      'Twenty scenes drawn end to end along one very long page, and a camera that travels it: a fire in a hall with no heir in it, four boys, a bow that breaks, two boons called in years late, a road south, ten quiet years, a deer the wrong colour, a line across a doorway, a sea, a bridge, a war, and a city that counted the days and lit every window on the way in. There is one cut in the whole film and it is at the very end — the middle of this story is a journey, so the page simply is the journey. Felt tip and crayon on ruled paper: every line wanders, the colour overshoots the outline, and everything casts a small shadow because everything is a cut-out lying on the page.',
    spec: ['20 scenes · one continuous move · 2:44', 'seeded from place, never from time', 'scenes, not doctrine'],
    ink: '#c98a3c',
    wash: 'rgba(201, 138, 60, 0.12)',
  },
  {
    id: 'castle',
    name: 'Hallowdene',
    tagline: 'A school for the magically inclined, built out of bricks, in real time.',
    blurb:
      'A castle on a lake with four towers, a great hall, a shaft of staircases that move, a bridge over a gorge and a dark wood at the edge of the grounds — forty thousand studded bricks, laid in a running bond, in nine draw calls. A time track runs along the bottom: moving through the seven terms moves you through the building as well as the year, because each term is a place as much as a moment. Every glow is an additive billboard sitting exactly where the light is, which is what bloom looks like and costs one quad instead of three full-screen passes. It is not a reproduction of any particular school from any particular series, and no names, houses, crests or licensed brick parts of one appear in it.',
    spec: ['23k bricks · ~10 draw calls', 'seven terms, each one a place', 'no post pass: the bloom is billboards'],
    ink: '#e3b45c',
    wash: 'rgba(227, 180, 92, 0.12)',
  },
  {
    id: 'nightwalkers',
    name: "The Nightwalkers' Map",
    tagline: 'A sheet of parchment that knows who is standing on it.',
    blurb:
      'A survey of Hallowdene in pen and ink, on parchment, drawn in the same coordinates as the castle itself — stand on the bridge in one and the other agrees with you. The sheet is blank until you say the words; then the ink spreads out into the paper and the whole building is there, walls hatched, water lined, the wood drawn tree by tree. Two dozen people are walking about in it, each one a pair of footprints and a name on a hairline leader, and they leave prints behind them that fade over about eight seconds. Click anywhere and you walk there along the corridors; there are three passages on this map that are on no other plan of the building, and they only appear once somebody has actually been down one. Say the other words and it goes blank again. It is not a reproduction of anybody else’s map of anybody else’s school: the castle is ours, the rooms are named for what they are, and so are the words.',
    spec: ['ink, not a font · no two es alike', 'static plate cached, people redrawn', 'three ways that are on no other plan'],
    ink: '#c07a4a',
    wash: 'rgba(192, 122, 74, 0.12)',
  },
  {
    id: 'fermi',
    name: 'Where is everybody?',
    tagline: 'The Fermi Paradox in a minute, explained by a cat who may or may not be in this box.',
    blurb:
      'A fifty-eight second film in cut paper and boiling ink. Over lunch in 1950 Enrico Fermi asked where everybody was; this is the question, the arithmetic behind it — a few hundred billion stars, most with planets, and a galaxy old enough to have been crossed a thousand times over — the silence, and five guesses pulled out of a cardboard box. The anchor is Schrödinger’s cat, alive and dead until somebody looks, because the galaxy is the same sort of box. Pure JavaScript: no libraries, no images, no audio files. Every frame is drawn on a canvas and every sound, from the music box to the cat, is synthesised in the same script.',
    spec: ['58 s · 1920 × 1080 · canvas 2D', 'score synthesised sample by sample', 'no libraries, no assets'],
    ink: '#ee9444',
    wash: 'rgba(238, 148, 68, 0.12)',
  },  {
    id: 'diary',
    name: 'The Diary',
    tagline: 'Two minutes inside a schoolboy’s diary. It writes, and then it drinks the ink.',
    blurb:
      'A fan work: a black leather diary on a desk by one candle, and the thoughts of the boy whose name is stamped on it — an orphanage in 1938, a page of potions with his notes in the margin, a door that only opens for one language, a name taken apart and put back together as another, and the thing he did because death was the only thing he was ever afraid of. Every line is written stroke by stroke with a broad nib and then sinks into the paper and is gone, because that is what this book does. When the film is over you can write in it yourself, and it writes back. The character and his world are J. K. Rowling’s; every word written in the diary and every note of the score is original, and nothing is quoted from the books or the films. Pure JavaScript: no libraries, no images, no audio files.',
    spec: ['2 min · 1920 × 1080 · canvas 2D', 'an original waltz, synthesised', 'a fan work · original words'],
    ink: '#3fdc86',
    wash: 'rgba(63, 220, 134, 0.1)',
  },
  {
    id: 'marauder',
    name: 'The Marauder’s Map',
    tagline: 'Blank parchment until you swear the oath, then the school, then the whole world, with everybody on it walking.',
    blurb:
      'A fan work in the look of the films: a folded packet of blank parchment that insults you in four different hands if you say the wrong thing to it, and if you say the right thing, blooms ink out from where your wand touched and unfolds leaf by leaf into a map of the school and its grounds — towers, the hall and its four tables, staircases, the forest, the lake, Hogsmeade, and the passages nobody else has on their map. Twenty-two people walk about on it as pairs of inky footprints under ribboned name-scrolls, by the corridors, with the twins and Harry taking the shortcuts nobody else knows. The second sheet is the whole world in the same hand, drawn from real coastlines, with the schools, the prison and the dragons marked, and a dozen travellers who walk over land and Disapparate over sea. Drag, pinch and follow anyone. Say mischief managed and it wipes itself clean. The school, its people and the map are J. K. Rowling’s; the drawing, every word on it and every sound are original. Pure JavaScript: no libraries, no images, no audio files.',
    spec: ['two sheets · canvas 2D · real time', 'Natural Earth coastlines, hand-inked', 'a fan work · original words'],
    ink: '#c9a46a',
    wash: 'rgba(201, 164, 106, 0.12)',
  },
  {
    id: 'ramanime',
    name: 'Ramayana, in motion',
    tagline: 'The Ramayana in under two minutes, as an anime short: painted skies, impact frames, and a bow that breaks.',
    blurb:
      'Valmiki’s story in twenty-two shots, in the look of Japanese feature animation: skies painted in gradients with lit cloud-bellies and god rays, figures as cel silhouettes with a hard rim of light on the side facing the sun, focus lines, impact frames, extreme close-ups of eyes, petals and embers in the air, and a soft bloom over all of it. A lamp in the dark; Ayodhya at sunrise; the bow of Shiva lifted and snapped; Sita’s garland; the forest and the golden deer; Ravana’s flying palace in a storm and Jatayu’s dive; the jewels let fall; Hanuman’s leap across the sea and Lanka burning; the bridge of stones carved with Rama’s name; ten heads, twenty arms, one arrow; and every lamp in Ayodhya lit to bring them home. The score is original: a tanpura under nearly all of it, a bansuri for the tunes, dhol and taiko for the fights. Pure JavaScript: no libraries, no images, no audio files.',
    spec: ['1 min 54 s · 1920 × 1080 · canvas 2D', 'tanpura, bansuri, dhol, all synthesised', 'after Valmiki'],
    ink: '#f5a53a',
    wash: 'rgba(245, 165, 58, 0.12)',
  },
  {
    id: 'sindoor',
    name: 'Operation Sindoor, explained',
    tagline: 'A three-minute explainer: the Pahalgam attack, the strikes of 7 May 2025, four days of fighting, and the ceasefire.',
    blurb:
      'An animated explainer in cut paper, highlighter and moving maps. In April 2025 gunmen killed twenty-six people at a meadow above Pahalgam; on 7 May India struck nine sites in Pakistan and Pakistan-administered Kashmir and called it Operation Sindoor. This is how that happened: the diplomatic squeeze first, then the strikes and where they fell, why the name, how each Indian answer since 2016 has gone further than the last, the four days of drones, missiles and air bases that followed, the phone call that stopped it, and what it changed. Everything is from the public record; where the two governments disagree — on who was killed, on what was hit, on aircraft lost — it says who claimed what rather than picking. The map is Natural Earth’s and schematic, with Kashmir shown by who administers each side of the Line of Control. Pure JavaScript: no libraries, no footage, no audio files.',
    spec: ['3 min 10 s · 1920 × 1080 · canvas 2D', 'from the public record, both sides’ claims', 'original score, synthesised'],
    ink: '#d3241c',
    wash: 'rgba(211, 36, 28, 0.1)',
  },
  {
    id: 'ahmedabad',
    name: 'Ahmedabad, on a Navratri night',
    tagline: 'The whole city on one of the nine nights: a thousand dancers in rings on the riverfront, and the pols lit end to end.',
    blurb:
      'A real-time city you can fly round. The Sabarmati through the middle with the Atal Bridge lit across it; on the west bank the newer city and a riverfront garba ground the size of a stadium, dancers in rings round a lamp-lit shrine to Amba — each ring turning the other way to the one inside it, three steps, a clap and a turn to every phrase of the dhol — under radial strings of lights, with fireworks going up. On the east bank the walled city: Bhadra fort with the Bhadrakali temple inside, the Maidan-e-Shahi and its stalls, Teen Darwaza, the Jama Masjid, Sidi Saiyyed’s tree-of-life window lit from within, and the pols, carved houses in every colour with lights zigzagged across the lanes and a garba of the neighbours in the chowk. Rickshaws run the roads. The music is an original garba — dhol, claps, manjira, harmonium and shehnai — synthesised, and as loud as it would be from wherever you are standing.',
    spec: ['three.js · real time · bloom', 'thousands of bulbs, one mesh', 'an original garba, synthesised'],
    ink: '#ff8a1f',
    wash: 'rgba(255, 138, 31, 0.12)',
  },
  {
    id: 'ride',
    name: 'Wind and a Bicycle',
    tagline: 'A girl on a bicycle, riding an endless road through a Japanese town, from morning round to morning.',
    blurb:
      '風と自転車. A real-time world, painted: a girl on a mamachari with a black cat in the basket, riding forever through four kinds of Japan in turn — a slope town above the sea with hydrangeas along the wall, a shopping street strung with paper lanterns, the city with its neon and a railway crossing where she stops for the train, and the rice fields, with a tunnel of torii gates and cherry trees along the road. A whole day goes by in five minutes: painted cumulus at noon, a sunset in orange and lilac, the windows and lanterns and vending machines coming on, stars, fireflies, dawn. Toon shading, a Kuwahara filter that makes everything look laid down with a brush, and bloom for the lights. The music is an original piano waltz, with cicadas by day, higurashi at dusk, crickets at night, the sea, the city, the crossing bell — and her bell, if you press B.',
    spec: ['three.js · real time · endless', 'a painted look: toon, Kuwahara, bloom', 'an original waltz, synthesised'],
    ink: '#5aa8e8',
    wash: 'rgba(90, 168, 232, 0.12)',
  },
  {
    id: 'heatwave',
    name: 'Heatwave',
    tagline: 'A police-chase arcade game: no guns, no brakes, just a hot rod and the desert — make the cops crash into everything, including each other.',
    blurb:
      'A playable prototype of a top-down chase game, built to a design document written for Unity and made here in the browser instead. You drive an orange hot rod round a desert arena of mesas, a ghost town, wrecks, cacti, fences, ramps and red barrels; the police come for you, and you have nothing to fight them with except where you lead them. They aim at where you are going to be, look ahead for the big obvious things but not for each other, and every so often do not look at all — so they wrap themselves round rocks, T-bone one another and follow you over barrels. Kills close together chain: COP SMASHED, DOUBLE, TRIPLE, PILEUP. Five stars of wanted level, from two cars to twelve with navy interceptors among them; near misses, drifts and jumps score too. Arcade physics with a slide you can hold, a camera that leads and pulls back with speed, shake and hit-stop, dust, skids, smoke, sparks, explosions and flying debris, and every sound synthesised — the engine, the tyres, a siren per car getting more chaotic with the heat. One thumb anywhere on a phone; arrows or WASD on a desk. T opens a tuning panel.',
    spec: ['three.js · 60 fps on a phone', 'arcade physics, interception AI', 'synthesised engine, sirens and bangs'],
    ink: '#ff5a1f',
    wash: 'rgba(255, 90, 31, 0.12)',
  },
  {
    id: 'banter',
    name: 'NaMo vs RaGa',
    tagline: 'A hundred rounds of banter between two vinyl-toy mascots: kurta versus T-shirt, over chai, cricket, kites, yatras and yoga.',
    blurb:
      'A shelf of a hundred collectible dioramas in the Heatwave toy style, each a little round stand with two chunky mascots on it — NaMo in a half-sleeved kurta and a jacket, white hair and beard and rimless glasses; RaGa in a white T-shirt, greying at the sides, with a salt-and-pepper beard — going at it about the things each is famous for. A chai stall face-off, a selfie-off, the yatra against the yoga mat, the winter T-shirt, kite fights on the rooftops, a yorker of development, arm-wrestling, tug of war, a Holi water-balloon fight, garba, the jalebi factory, the Mohabbat ki Dukaan, the Moon, bullet trains and one umbrella in the rain. Open one and it plays: they move, the lines pop up over their heads, and a stamp says who took the round. It is satire and every line is invented; both get teased, both land jabs, and the wins come out twenty-five each, with the other fifty going to the chai, the voter, ISRO and the rain.',
    spec: ['three.js · 100 dioramas, built live', 'two rigged mascots, 50 poses, 13 faces', 'all lines invented · wins split evenly'],
    ink: '#f08a2a',
    wash: 'rgba(240, 138, 42, 0.12)',
  },
];

export const EFFECT_BY_ID = Object.fromEntries(EFFECTS.map((e) => [e.id, e])) as Record<
  EffectId,
  EffectDef
>;

export function isEffectId(v: string | null | undefined): v is EffectId {
  return !!v && v in EFFECT_BY_ID;
}