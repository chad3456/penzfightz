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
  | 'banter'
  | 'gitareel'
  | 'gitaepic'
  | 'sahasranama'
  | 'shivaloka'
  | 'hiddengirl'
  | 'airstrip'
  | 'uproar'
  | 'guitaratlas'
  | 'greatbuild'
  | 'salon'
  | 'heirloom'
  | 'tesserae'
  | 'leap'
  | 'flight'
  | 'koi'
  | 'fournights'
  | 'orbitworks'
  | 'pune411'
  | 'witchworld'
  | 'ashtavakra'
  | 'chalisa'
  | 'ghar624'
  | 'almari'
  | 'outrage'
  | 'jelly'
  | 'vishnu1000'
  | 'gita'
  | 'navadurga';

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
  {
    id: 'gitareel',
    name: 'Gita, the reel',
    tagline: 'Krishna talks Arjuna back onto his feet in eighty seconds — a vertical reel in stippled ink, watercolour and kinetic type.',
    blurb:
      'The Bhagavad Gita as a reel on the feed: 1080 × 1920, eighty seconds, cut to a 96-bpm lo-fi beat. The greatest archer alive has just dropped his bow, the Pandava group chat has three dots in it, and on a live feed from Kurukshetra the charioteer is smiling. Then four lessons, each announced by a stamp: the self that no weapon cuts and no fire burns (2.23); the work, not its fruits (2.47); win or lose, the same energy (2.48); the mind as best friend or worst enemy (6.5) — and the universal form, a wheel of arms and heads and light, saying I am Time (11.32). Arjuna picks up the bow. The look is the look of a certain kind of explainer: off-white paper, figures drawn in ink and then stippled, pastel washes, one mustard word to a line, heavy condensed type against an italic serif, captions a word at a time with the rest waiting in grey, and a meter in the corner reading AURA. Every picture and every note is made in code on the page — a bansuri in Yaman, a tanpura, keys, a conch, a choir — and the verses are shown in Sanskrit.',
    spec: ['canvas 2D · 1080 × 1920 · 80 s', 'stippled ink, washes, kinetic type', 'an original score, synthesised'],
    ink: '#d4951a',
    wash: 'rgba(212, 149, 26, 0.12)',
  },
  {
    id: 'gitaepic',
    name: 'Gita, the epic cut',
    tagline: 'Kurukshetra in a hundred seconds: sculpted busts of Krishna and Arjuna, the verses in gold over their faces, a voice like thunder, and the Universal Form.',
    blurb:
      'The reel again, rebuilt. Krishna and Arjuna are 3D busts from a real head scan — Krishna deep blue with the mukut, peacock feather, tilak, Kaustubha and vaijayanti; Arjuna in bronze with his kirita and armour — lit like a film and cut through ink-wash transitions. Every lesson arrives as a verse, Devanagari in gold with Purohit Swami\'s English beneath it, laid over the face that speaks it; the voices are neural, pitched and treated: a narrator, a trembling Arjuna, and a Krishna who fills the room. It climbs through Arjuna\'s fall, the undying Self, karma and the promise to return, to SHOW ME — and then the Vishvarupa: a galaxy, a ring of heads, a wheel of arms and weapons, कालोऽस्मि, a thousand suns, and surrender.',
    spec: ['canvas 2D · 1080 × 1920 · 102 s', '3D head-scan busts, ink-wash cuts', 'neural voices · verses in gold'],
    ink: '#e0b050',
    wash: 'rgba(224, 176, 80, 0.12)',
  },
  {
    id: 'sahasranama',
    name: 'Vishnu Sahasranama',
    tagline: 'A deep dive into the thousand names of Vishnu, told through devotional paintings in moving brush strokes — and every stroke is a name you can tap.',
    blurb:
      'Four devotional paintings — the many-faced blue Vishvarupa with Krishna within, the Lord of fire and lotus over Brahma and Vishnu, the Universal Form towering over Arjuna, the three faces of the Trimurti — plus the bed of arrows at sundown, each turned into a hundred thousand living brush strokes that breathe, ripple, swirl round your finger and pour from one picture into the next as you scroll the story: Bhishma\'s answer, the cosmic body of the Dhyana shloka, the Vishvarupa of Gita 11. Tap any stroke and it tells you which of the thousand names it is and what that name means, and lights every other stroke that carries it. Then a galaxy of the thousand names to search, and the whole stotram. Dawn, dusk or night colours.',
    spec: ['three.js · 140k brush-stroke particles', 'four chosen paintings, alive', '1000 names, each with its meaning'],
    ink: '#d9b566',
    wash: 'rgba(217, 181, 102, 0.12)',
  },
  {
    id: 'shivaloka',
    name: 'Shiva Loka',
    tagline: 'A pilgrim\'s map of India in ink and wash: walk to the Jyotirlingas, the great Shivalingas, the Shakti Peethas and Krishna\'s places, and earn each darshan.',
    blurb:
      'A 3D map of India drawn as an ink-wash painting — torn paper, dry-brush outlines, washes that thin into the distance — with a hundred and eleven shrines on it: the twelve Jyotirlingas, Kailash, Amarnath, the five element lingas, the Panch Kedar and Pancharama, the rock-cut temples; the fifty-one Shakti Peethas where Sati\'s body fell, from Hinglaj to Kamakhya; and Mathura, Vrindavan, Govardhan, Dwarka, Kurukshetra, Shrinathji at Nathdwara, Jagannath, Udupi, Guruvayur and Pandharpur. Walk the pilgrim there (a boat takes over at sea), step in, and every shrine is a level on its own ground, with a difficulty from one to five and a task out of its story: fifteen lamps for the waning Moon at Somnath, jasmine for Mallika at Srisailam, Dushana at the gate of Mahakala, Ganga water carried up to Kashi Vishwanath, the climb to Kedarnath with the air running thin, the linga Ravana could not set down at Deoghar, the priest\'s questions at Udupi. Win and the diary gets the story — retold from the Shiva Purana and the other Puranas, with the chapter — and the temple rises again in a time-lapse of its history, from legend to the last rebuilding.',
    spec: ['three.js · ink-wash post-process', '111 shrines · 8 kinds of task', 'stories retold, with sources'],
    ink: '#c8901c',
    wash: 'rgba(200, 144, 28, 0.12)',
  },
  {
    id: 'hiddengirl',
    name: 'The Hidden Girl',
    tagline: 'Ken Liu\'s stories told as games you scroll through. First, "Ghost Days": a story built like a recursive function, played down the call stack from 2313 to 1905 and back.',
    blurb:
      'The stories of The Hidden Girl and Other Stories, retold one at a time in the look of a landscape architect\'s presentation board: pale greens, stipple, meadows of lavender and yarrow, faceless white figures. The camera zooms through painted dioramas as you scroll, and a narrator tells you the story. The first is "Ghost Days", three stories nested like the Fibonacci function on a colony classroom\'s board, joined by one bronze spade coin. Ona, a girl engineered for a poisonous planet, finds it in the steam of an alien ruin in 2313. Fred Ho, an undocumented boy in a Reagan mask, carries it to a Halloween dinner in Connecticut in 1989. William, home from English school for the Hungry Ghost Festival in Hong Kong in 1905, finds his father forging it. You rub the patina off the coin, hold down to lift the masks people wear, and trace the stroke that turns 宇 (the universe) into 字 (writing). Two choices come back at the end, when the coin shows every mark three centuries have cut into it.',
    spec: ['three.js dioramas · GSAP · Lenis', 'rub, hold, trace · two choices', 'a retelling in our own words'],
    ink: '#7fae63',
    wash: 'rgba(127, 174, 99, 0.12)',
  },
  {
    id: 'airstrip',
    name: 'Airstrip One',
    tagline: 'A game after Nineteen Eighty-Four: you are the Party. Keep them working, keep their heads down, and survive the year.',
    blurb:
      'Victory Square from above: a hundred and fifty little round-headed citizens walking to work under a hoarding of Big Brother whose eyes follow your hand, the four Ministries rising at the corners in pencil-hatched terraces, and every coin they earn flying up to the Party. Push the quota past the red line and they begin to think — the thinkers turn yellow, stop, look up and say so, and thinking is catching. Give them someone to hate (the Two Minutes Hate, Victory Gin, the Lottery, a Hate Week rally), put up telescreens and Junior Spies, Records Desks and Newspeak Dictionaries, and send the van. Through the year: a man buys a diary, the chocolate ration is cut (or "raised"), a girl slips him a note, Oceania changes enemies mid-speech and the records must be rewritten, Hate Week, and Room 101. Lose them, and it turns out there was hope after all.',
    spec: ['three.js · 150 citizens, inked', 'nine tools, six events, one year', 'after Orwell · the words are ours'],
    ink: '#c8312a',
    wash: 'rgba(200, 49, 42, 0.10)',
  },
  {
    id: 'uproar',
    name: 'UPROAR',
    tagline: 'One megaphone, one city: gather a crowd, throw street parties, occupy the plazas and march on City Hall.',
    blurb:
      'A toy city in a tilt-shift lens, seven districts round a domed City Hall, seven hundred people going about their day and forty-four cars going round the block. You have a megaphone. Chant and the people you pass fall in behind you and follow the path you walk; roll up a sound system and the street stops to dance; paint a mural on a wall, blow a cloud of colour, and bounce giant beach balls over the heads of the crowd (real rigid bodies, kept in the air by the people underneath). Fill a district\'s plaza and hold it, and the fireworks go up. The noise brings heat: patrols that pick off stragglers, vans, a news helicopter with a searchlight after dark, and at the top a water cannon that meets a thousand umbrellas. Big crowds simply outnumber the police, and every officer in the city will stop for pizza. Take five districts and City Hall opens its doors. A cartoon: nobody gets hurt.',
    spec: ['R3F · drei · Rapier · postprocessing', '720 people · 7 districts · 7 moves', 'ambient occlusion, bloom, tilt-shift'],
    ink: '#ff2e88',
    wash: 'rgba(255, 46, 136, 0.10)',
  },
  {
    id: 'guitaratlas',
    name: 'Guitar Atlas',
    tagline: 'An illustrated, interactive atlas of where the world\'s guitars are made: the factories, the money and the wood.',
    blurb:
      'A hand-drawn world map with a guitar pick on every place that builds guitars, sized by how many it says it makes each year: Zheng\'an County in Guizhou (about six million, one in seven of the world\'s), Changle and Huizhou, Cort\'s plant in Surabaya, Fender in Ensenada, Taylor in Tecate, Martin in Nazareth since 1839. Switch the map to exports (China ships 38% of the world\'s guitar-type exports by value), to tonewood (Sitka spruce from Alaska, ebony from Cameroon, rosewood from India, flowing to the factories that use them), or to history, as the factory moves from America to Japan, Korea, Mexico, China and Indonesia. Look up your own guitar\'s brand to see which country each line comes from. Every figure is sourced.',
    spec: ['d3-geo · d3-zoom · Natural Earth', '31 places · 11 tonewoods · 14 brands', 'every figure sourced'],
    ink: '#b0662a',
    wash: 'rgba(176, 102, 42, 0.10)',
  },
  {
    id: 'greatbuild',
    name: 'The Great Build',
    tagline: 'A scrolling visual story of twenty years of ports, subways and expressways: who built them, and how fast.',
    blurb:
      'Three chapters that redraw themselves as you scroll. Ports: container bubbles on a world map swell from 2004 to 2024 (Shanghai 14.6 to 51.5 million boxes, Ningbo 4 to 39) while Hong Kong, the busiest port on Earth in 2004, shrinks to a 28-year low; then the World Bank\'s most efficient ports, which are not the biggest. Metros: Beijing\'s subway grows from 114 km to 909 km beside New York\'s five new kilometres, Delhi, Dubai and Riyadh get whole new systems, and China\'s 10,946 km of urban rail is laid out 50 km to a square. Expressways: China\'s network overtakes the US Interstate in 2011 and reaches 190,700 km, and the 156,400 km it added wraps round the equator 3.9 times. Every figure is in a sourced ledger at the end.',
    spec: ['scrollytelling · d3-geo', '15 ports · 6 metros · 3 road networks', 'sourced, with checked figures marked'],
    ink: '#eb6834',
    wash: 'rgba(235, 104, 52, 0.10)',
  },
  {
    id: 'salon',
    name: 'Glass Houses: The Salon',
    tagline: 'A group chat with the dead: philosophers argue about questions they never faced, and you throw the stones.',
    blurb:
      'Fourteen thinkers are added to group chats about today\'s questions. Vivekananda, Wollstonecraft, Rousseau, Aristotle and Mill on equal rights for women; Camus, Plato, Kant, Bentham and Oscar Wilde on same-sex marriage; Descartes, Lovelace, Leibniz, Turing and Bentham on whether an AI can suffer. You moderate: ask, press, or throw a stone, a documented fact from their own life set against what they wrote. Rousseau wrote the book on raising children and left his five at the foundling hospital; Mill championed liberty and spent 35 years at the East India Company; Bentham argued for decriminalisation in 1785 and never published it. Cracks and fog spread across each thinker\'s glass house, then you judge them, and finally yourself. Every message is badged: their own words (sourced), attributed, paraphrase, or imagined.',
    spec: ['3 salons · 14 thinkers', 'every line badged and sourced', 'a familiar chat app, with portraits'],
    ink: '#c76a2f',
    wash: 'rgba(199, 106, 47, 0.10)',
  },
  {
    id: 'heirloom',
    name: 'Heirloom Wall',
    tagline: 'Twenty-eight buildable ways to hang three ancestral Nathdwara paintings, each drawn to scale on a living-room wall.',
    blurb:
      'Three Nathdwara paintings from an old family house (Shrinathji, a Pushtimarg acharya, and Krishna with a lotus garland) get a new wall. Every idea is drawn to scale, with a sofa and a person for size, and switches between day and evening light: haveli jharokhas, a pichwai backdrop, darshan shutters that open like the temple doors, a torana in the pink sandstone of the new Ram Mandir, thikri mirror-work, Molela terracotta, a turning three-sided pillar, a museum vitrine. Each comes with a point-by-point brief: materials, the craftspeople who make it, fixing, lighting, how the raised gold and kundan stones stay safe, and a ballpark cost. Load your own photos and every mockup uses them; a planner works out exactly where to drill.',
    spec: ['28 ideas · scale SVG elevations', 'day / evening lighting · your own photos', 'planner with drill points'],
    ink: '#a77a1f',
    wash: 'rgba(167, 122, 31, 0.10)',
  },
  {
    id: 'tesserae',
    name: 'Tesserae',
    tagline: 'A mosaic of Ayodhya and Kurukshetra laid one tile at a time, starting with an eye: 7,446 tiles, all cut by code in the browser.',
    blurb:
      'It starts with an eye: nine tiles for the pupil (eight of black glass, one white marble catchlight), then a ring of gold. The eye turns out to be the sun, Surya, "the eye of Mitra, Varuna and Agni" in the Rigveda and the ancestor of Ayodhya\'s kings. Then the camera pulls back as the rest go down: lapis sky in courses that curve around it, the Pushpaka vimana coming home, the Himalaya, Ayodhya\'s walls, gate and temples on the Sarayu, and below a gold line, Krishna and Arjuna\'s chariot at Kurukshetra under the monkey banner. 7,446 tiles later the frame closes. The cartoon is drawn with canvas paths and cut by a weighted centroidal Voronoi tessellation. Every tile is turned to follow the drawing, roughened like hand-cut stone, and pressed into mortar over a red-ochre underdrawing. The gold catches a lamp that follows your pointer.',
    spec: ['7,446 tiles · canvas 2D', 'weighted Voronoi + andamento', 'no images, no models'],
    ink: '#d6a43a',
    wash: 'rgba(214, 164, 58, 0.12)',
  },
  {
    id: 'leap',
    name: 'The Leap to Lanka',
    tagline: 'Fly across the ocean as Hanuman, from Mount Mahendra to the Ashoka grove, in an interactive 3D world drawn in two-tone print shading.',
    blurb:
      'An original, fully rigged Hanuman (crown, kundala, streaming hair, dhoti and sash, a long tail and his gada) crosses a hundred yojanas of animated ocean, after the Sundara Kanda. Mainaka rises from the sea to offer rest. Surasa, mother of serpents, opens her mouth wider each time he grows, so he shrinks to a thumb\'s size and darts through. Simhika grips his shadow from a dark pool, and he tears free. Morning turns to dusk and moonlight over the golden city on Trikuta, until he settles in a shimshapa tree in the Ashoka grove above Sita, and gives her Rama\'s ring. Watch it as a film with cinematic cameras, or take the controls: steer, boost, grow and shrink. The model downloads as a rigged, animated .glb for Unity or Blender.',
    spec: ['three.js · R3F · custom toon shaders', 'story film or free flight', 'rigged .glb export for Unity'],
    ink: '#c35b24',
    wash: 'rgba(195, 91, 36, 0.10)',
  },
  {
    id: 'flight',
    name: 'Hanuman in Flight',
    tagline: 'A realistic cinematic of Hanuman crossing the ocean at dawn, rendered live in the browser.',
    blurb:
      'Thirty-eight seconds of flight over open sea toward Lanka, in six shots: low over the swell as he comes in from the horizon and passes overhead, a chase above the racing water, a tracking shot into the low sun, face to face with his hair and sash whipping, a rising crane over the empty ocean, and a coastline with a glint of gold. The body is one sculpted, skinned surface (a signed-distance figure turned into a mesh and bound to the same skeleton as The Leap to Lanka), with physically based skin, silk and gold. The sea is a Gerstner-wave surface that reflects a physically scattered dawn sky, with glitter, foam and light through the crests, under clouds, bloom and haze. Scrub it, jump between shots, or break the camera free and orbit him mid-flight.',
    spec: ['three.js · PBR · Gerstner ocean · Preetham sky', 'sculpted skinned body', 'six-shot film · free camera'],
    ink: '#f2c46d',
    wash: 'rgba(242, 196, 109, 0.12)',
  },
  {
    id: 'koi',
    name: 'The Koi Pond',
    tagline: 'A realistic garden koi pond you can put your hand in: ripple it, feed the koi, float leaves, lilies and paper boats, and bring on rain or night.',
    blurb:
      'A garden pond rendered live in the browser. The water is a running wave simulation: drag a finger through it and rings spread, bounce off the banks and sweep bright caustics across the pebble floor. Under it, the floor bends with refraction and fades into green depth, and above it the cherry, the maple and the sky reflect by Fresnel. Thirteen koi in ten real varieties (kohaku, sanke, showa, tancho, ogon, asagi, shusui, chagoi and more) are sculpted and painted by code, scale by scale. They swim with a wave that runs down their bodies, school loosely, come over to see your hand, rise to gulp food and scatter when a stone goes in. Toss stones, scatter food, drop leaves, float lily pads, paper boats and lanterns, add your own koi, and switch on rain, a breeze, dusk or night with lanterns and fireflies. All of it is procedural, with no images or models.',
    spec: ['three.js · ripple sim + refraction', 'ten koi varieties with schooling AI', 'rain · breeze · day, dusk, night'],
    ink: '#e0613a',
    wash: 'rgba(224, 97, 58, 0.10)',
  },
  {
    id: 'fournights',
    name: 'Four Nights and a Morning',
    tagline: 'Dostoevsky’s White Nights as a painted film you scroll through, in the words of the book.',
    blurb:
      'The whole of White Nights in sixty passages from Constance Garnett’s translation, each with its own painted scene on one long, living view of Petersburg along the water. The dreamer wanders the emptied city while waggons heaped with furniture leave for the summer villas, hears a little pink house complain that it is being painted yellow, walks out past the city gate into the fields, and comes back at ten along the canal, where a girl in a yellow hat is crying at the railing. Then four pale white nights on the embankment and the seat: his confession, with his dreams drawn in light over the canal; her history, cut as 1840s silhouettes in gilt ovals, from the grandmother’s pin to the bundle on the stairs; the letter sealed “Rosina”; the rain of the third day and the bell striking eleven; the fourth night, the moon and the yellow cloud, and the young man who stops and looks. It ends in his room, with rain on the glass and her letter written out in her hand. Every scene is painted by code, with no images: the sky, the façades, the cut-paper people, and the water that mirrors them.',
    spec: ['60 passages · Garnett translation', 'one painted panorama, four nights and a morning', 'silhouettes · handwritten letters · sound'],
    ink: '#8a4a52',
    wash: 'rgba(138, 74, 82, 0.10)',
  },
  {
    id: 'orbitworks',
    name: 'Orbit Works',
    tagline: 'Design a satellite for a real kind of mission, check it like an engineer, launch it, and fly it through its first weeks in orbit.',
    blurb:
      'A satellite lab in six missions modelled on real programmes: a student CubeSat, a Landsat-style imager in sun-synchronous orbit, a Starlink-style broadband satellite that raises itself with Hall thrusters, a GPS/NavIC-style navigation satellite, a geostationary comsat that climbs from GTO, and a Hubble-style telescope. Pick from about sixty parts across ten subsystems, each explaining how it works and what it depends on. The design review computes the real first-cut budgets (mass, power with eclipse and degradation, battery depth of discharge, hot and cold thermal cases, pointing and momentum, link budget, Δv by the rocket equation, drag decay and the 5-year debris rule, radiation dose, launcher capacity, cost and reliability) and tells you how to fix what fails. Then sit in the launch director\'s chair for the go/no-go poll, ride the ascent on a 3D Earth with real coastlines, and run mission control: detumble, deploy, first contact, commissioning, ground passes, eclipses and the anomalies operators actually face.',
    spec: ['6 missions · ~60 parts · 20+ checks', 'orbital mechanics, budgets, link and Δv', 'launch poll · live operations · anomalies'],
    ink: '#7fd4ff',
    wash: 'rgba(127, 212, 255, 0.10)',
  },
  {
    id: 'pune411',
    name: 'Pune 411',
    tagline: 'An open-world driving game in the real Pune: the peths, Deccan, Camp, Koregaon Park, built street by street from map data.',
    blurb:
      'Ten by eight kilometres of central Pune, baked from OpenStreetMap (via Overture Maps) and real elevation: 91,000 building footprints, 30,000 road pieces with their one-way rules, flyovers and bridges, the Mula and the Mutha, Parvati and Vetal hills, the metro viaduct. Shaniwar Wada with its Delhi Darwaza, Dagdusheth, the station, Aga Khan Palace and Parvati temple stand where they stand. Walk, ride a scooter, drive an auto rickshaw, a car, a tempo or a bus; traffic keeps left, mostly two-wheelers, and honks. Nine missions across real places, a wanted level and the Pune police, traffic mamas fining helmetless riders, vada pav carts, garages, twenty Puneri patya to find, shops that shut from one to four, a day and night cycle, monsoon rain, three radio stations and a GPS that routes on the real road graph.',
    spec: ['91k real buildings · 30k road pieces', 'traffic, police, 9 missions, 20 patya', 'day/night · monsoon · 3 radio stations'],
    ink: '#ffb347',
    wash: 'rgba(255, 179, 71, 0.10)',
  },
  {
    id: 'witchworld',
    name: 'Witchworld Weekly',
    tagline: 'A witch from Witchworld goes undercover in a watched city full of protest and riots, and has to save it, in a hand-drawn magazine.',
    blurb:
      'The Earth Issue of Witchworld Weekly, and the portfolio of its correspondent, Hazel Mothwick (347). The cover opens The Agreeable City: a city run by the Bureau of Agreement, with cameras on every corner and the Kindly Uncle smiling from every screen. Hazel must fit in, with her cap on, her hat hidden and a nod when the screens say NOD, while she knits socks over cameras, unmutes taped-up protest signs, rescues true pages from the Forgetting Chute, turns a riot’s stones into birds and its fires into marigolds, and turns the Uncle into a mirror so the city looks up. Everything is drawn live with one wobbly felt-tip pen whose lines boil, and every word is hand-lettered by a single-stroke alphabet drawn in code. Fly her broom over a scribbled Earth with Parsnip the cat on the back, land at ten signs (the glowing mirrors, the self-checkout, the listening cylinder, a familiar that writes poems, wellness, the autumn in a cup, e-scooters, everyone dressed in black, delivery drones, monstera plants) and open each as a magazine spread whose picture you can poke. Collect the ten stamps, flip through the whole issue with horoscopes and classifieds, browse the portfolio, and write a postcard home that appears in her handwriting as you type, then send it by owl.',
    spec: ['10 spreads · 10 stamps · 1 pen', 'fly · read · poke · post by owl', 'hand-lettered single-stroke alphabet'],
    ink: '#1a1a1a',
    wash: 'rgba(255, 255, 255, 0.10)',
  },
  {
    id: 'ashtavakra',
    name: 'अष्टावक्र गीता',
    tagline: 'The Ashtavakra Gita as Claude reads it: all 298 verses in Sanskrit, Hindi and English, twenty living pictures, and a recitation that breathes in the metre.',
    blurb:
      'The dialogue of King Janaka and the boy-sage Ashtavakra, in full. Each of the 298 verses appears in Sanskrit (Tiro Devanagari), with its IAST, the shape of its metre (every syllable marked light or heavy by the rules of Sanskrit prosody; almost all are anuṣṭubh), a fresh Hindi rendering and John Richards\'s public-domain English. Claude writes an opening reading for every chapter and close readings of fifty-two key verses, in Hindi and English: what the words do, where they are radical, where they belong to their age, and what it is like for an AI to read a text about the witness without claiming to be one. Each chapter opens on a living picture of its image: the still point among five elements, one ocean, the shell that looks like silver, smoke that never touches the sky, pots breaking in unbroken space, a rope that is a snake until your light reaches it, the questions of "kva?" rising and dissolving. Recitation mode plays a tanpura and unfolds each verse syllable by syllable at the pace of its metre, then the meaning, then silence. Interface in Hindi, English or both.',
    spec: ['298 verses · 20 chapters · 52 close readings', 'Sanskrit · IAST · metre · Hindi · English', 'tanpura recitation in the metre'],
    ink: '#e8b04a',
    wash: 'rgba(232, 176, 74, 0.10)',
  },
  {
    id: 'chalisa',
    name: 'श्री हनुमान चालीसा',
    tagline: 'The whole Hanuman Chalisa, animated verse by verse like a pichwai come to life, with every word shown as it is sung and its meaning beneath it.',
    blurb:
      'All forty-three verses of Goswami Tulsidas\'s Hanuman Chalisa, the two opening dohas, the forty chaupais and the closing doha, each as its own animated painting in the manner of a Nathdwara pichwai and an Indian picture book: navy nights full of swirls, marigold and magenta, lotus ponds, cusped arches, white curling clouds. Each verse is staged foot by foot. The guru\'s pollen cleans a clouded mirror until Rama appears in it. A tiny Hanuman drops the ring to Sita, then grows huge with his tail aflame over Lanka. The baby takes the red sun for a fruit and swallows it, and the sky goes dark. He leaps the ocean with the ring in his mouth. Spirits flee at the name "Mahavir". A prisoner\'s beads count to a hundred until the chains fall away. Tulsidas writes on the ghats of Varanasi until the Lord\'s light settles in his heart. Every word is on screen as it is sung, with its romanisation and an English gloss beneath it, and the meaning of each verse is given in English or Hindi. Words are timed to their syllables, a light one one mātrā and a heavy one two, so each chaupai foot fills its sixteen mātrās. An original score plays under it: a tanpura drone, dholak and manjira in keherwa, and a bansuri that gives each syllable a note. There is also a reading view that sets out the whole text word by word. Every figure and scene is drawn in code.',
    spec: ['43 verses · 43 animated scenes', 'every word: Devanagari · roman · gloss', 'tanpura · dholak · manjira · bansuri, timed to the metre'],
    ink: '#f4b51c',
    wash: 'rgba(244, 181, 28, 0.12)',
  },
  {
    id: 'ghar624',
    name: 'Ghar 624',
    tagline: 'A room-by-room 3D interior designer for a 624 sq ft 2BHK: kitchen, living room and two bedrooms, with a rough cost for each.',
    blurb:
      'Design a small flat room by room in 3D. The entrance opens into a kitchen with two black granite ottas, then a small living room, then two master bedrooms of about 12 by 13 feet. Each room can be resized in feet and seen at eye level, from the ceiling, as a dollhouse or from the top, by day or in the evening with the cove lights on. Choose POP false ceilings and their LED colour, fans, paint and a feature wall of wallpaper, texture or panelling, floors, TV units, bookshelves, sofa, rug and curtains, portraits (or your own photo), wardrobes, headboards, a mandir, and the kitchen\'s layout, granite, cabinets and backsplash. Designs are kept on the device, pictures save as PNG, and every room and the whole home get a rough rupee range. Everything is drawn with three.js; every texture is painted in code.',
    spec: ['5 rooms · 624 sq ft', 'ceilings · walls · floors · furniture · mandir', 'rough ₹ estimate per room'],
    ink: '#b07a3a',
    wash: 'rgba(176, 122, 58, 0.12)',
  },
  {
    id: 'almari',
    name: 'Almari Studio',
    tagline: 'A master-bedroom wardrobe designer: size it to your wall, fit out the inside, pick from 2,028 finishes, and get a cut list and estimate.',
    blurb:
      'Size the wardrobe to the wall in mm, cm or feet, with a loft and skirting, and it checks the ceiling, the wall, wide shutters, sheet height, hanging depth and the swing past the bed. Fit each bay from the floor up from fifteen fittings: long and short hanging, shelves, inner and outer drawers, a jewellery drawer, tie, trouser, shoe and saree pull-outs, a locker, a display and more. Choose hinged or sliding shutters in eleven profiles (shaker, fluted, glass, mirror, cane, arched…) and seven two-finish layouts, then handles. The 2,028 finishes are all painted in code, in twelve collections, each with its own code, hex colour, colour family and surface, plus 24 colour combinations and suggestions that go with your choice; photographs of real samples can be added. See it as a 3D bedroom with the doors opening, or as front and inside drawings with dimensions, and download a cut list and estimate.',
    spec: ['2,028 finishes · 12 collections', '15 fittings · 11 shutter profiles', '3D · elevations · cut list · ₹ estimate'],
    ink: '#86652a',
    wash: 'rgba(134, 101, 42, 0.12)',
  },
  {
    id: 'outrage',
    name: 'The Outrage Dividend',
    tagline: 'A visual data essay on the protest, riot and grift economies in India and the world, with a live unrest tracker.',
    blurb:
      'How the street became a screen. A night crowd of a thousand heads turns into a phone as you scroll, then ten chapters follow the money and the anger. An interactive post shows how out-group and moral-emotional words multiply sharing, using the published effect sizes from two large studies. The protest economy: the farm agitation\u2019s ₹2,731 crore in lost tolls and a Supreme Court that said public roads cannot be held indefinitely. The riot paradox: NCRB rioting cases fell 39% from 2016 to 2022 while the flashpoints got bigger, and India led the world in internet shutdowns. The neighbourhood: Sri Lanka, Bangladesh, Nepal. The grift economy: ₹22,846 crore lost to cyber fraud in 2024, political ad money and FCRA. Hoffer, Nietzsche, Dostoevsky, Le Bon, Gandhi and Ambedkar on the men of words and the grammar of anarchy. A tracker with KPI tiles, charts, a flashpoint timeline and a sortable ledger, then a chapter on what the data does not say. Every number has a linked source.',
    spec: ['10 chapters · 12 charts · tracker dashboard', 'NCRB · Access Now · I4C · ACLED · OHCHR', 'every figure sourced, with table views'],
    ink: '#eb6834',
    wash: 'rgba(235, 104, 52, 0.12)',
  },
  {
    id: 'jelly',
    name: 'Jellynoor',
    tagline: 'A 3D hill station where everything is made of jelly, and everybody spends the day at the tea estate\u2019s chores.',
    blurb:
      'A small tea estate up in the hills, set in jelly. The terraced slopes, the bushes, the cow, the tin roofs and every person on the hill are made of the same soft stuff, and all of it wobbles: hop, and the rows shake; brush past a bush and it leans away from you; ring the temple bell and the whole yard rocks. There is a day\u2019s work to get through. Carry saplings out to the empty plots and plant them, water the bushes that have gone pale, pull the weeds, prune the ones grown above the plucking table, and pluck two leaves and a bud wherever a flush is standing proud \u2014 the morning leaf is worth the most. Take the full basket down to the scale at the muster shed, then follow the leaf through the factory: spread it on the withering troughs, roll it, fire it in the drier, and pack it into chests at twelve kilos a chest. In between there is a cow to milk and feed, hens to scatter grain for, chai to brew and pour, firewood to split and stack, washing to hang, the yard to sweep, the bell to ring at dawn and the lamps to light at dusk. Nine villagers work the same round beside you all day and go home when it gets dark. The mist sits in the valley until the sun burns it off, the rain comes over the ridge most afternoons, and the whole estate is drawn in code, lit by one shader that makes opaque jelly look lit from inside.',
    spec: ['18 chores \u00b7 a tea garden that grows', 'terraced hills \u00b7 mist \u00b7 rain \u00b7 a day and night', 'everything wobbles, including the ground'],
    ink: '#ff7fa8',
    wash: 'rgba(255, 127, 168, 0.13)',
  },
  {
    id: 'vishnu1000',
    name: 'श्रीविष्णुसहस्रनाम',
    tagline: 'The Vishnu Sahasranama chanted whole and painted as a moving pichwai: every one of the thousand names lights up as it is sung, with its meaning.',
    blurb:
      'The Vishnu Sahasranama from the Mahabharata\u2019s Anushasana Parva, chanted from the first invocation to the last verse of the phalashruti, about thirty-five minutes, and painted as it goes in the manner of a Nathdwara pichwai. It opens at Kurukshetra at dusk: Bhishma lies on his bed of arrows, Yudhishthira and his brothers come with Krishna to ask him who the one god is and what the highest dharma is, and Bhishma begins. The eight meditation verses follow, each its own painting: the Lord on a pearl throne by the ocean of milk under clouds raining nectar; the cosmic body with the earth for feet and the sun and moon for eyes; the Lord asleep on Shesha with Brahma rising on a lotus from his navel; Krishna under the parijata tree. Then the thousand names. The Lord stands at the centre in whatever form the shloka calls up \u2014 reclining on the serpent, Krishna among the cows, Narasimha, Vamana, Rama, the cosmic form \u2014 and round him a sunflower spiral of a thousand lights fills from the centre outward, one for each name, lit at the moment it is chanted. Each name is painted in a cartouche with its number and an emblem, and its meaning shows under the verse. Over the 108 shlokas the night sky turns slowly to dawn. The closing verses are painted too: the sick healed and the bound set free, everything held within Vasudeva, Parvati asking Shiva on Kailasa and Shiva answering \u201cRama, Rama, Rama\u201d, the ten avatars age after age. Every syllable is lit as it is chanted, in Devanagari and roman, with an English translation of every verse written for this page. A chant score plays under it: a tanpura drone, a choir that sings each syllable on its own vowel, bells and the conch. There is a reading view with all thousand names and their meanings.',
    spec: ['1000 names, each lit as it is chanted', '183 verses · Devanagari · roman · English', 'tanpura · choir on the vowels · conch'],
    ink: '#5b8cff',
    wash: 'rgba(91, 140, 255, 0.13)',
  },

  {
    id: 'gita',
    name: 'श्रीमद्भगवद्गीता',
    tagline: 'The whole Bhagavad Gita, all 701 verses, chanted in Sanskrit with a new English translation and painted as a moving pichwai.',
    blurb:
      'All eighteen chapters of the Bhagavad Gita, chanted syllable by syllable from Dhritarashtra\u2019s first question to Sanjaya\u2019s last word, about two hours and fifteen minutes, with every verse painted in the manner of a Nathdwara pichwai. Each chapter opens on a card that chants its name (\u0905\u0925 \u092a\u094d\u0930\u0925\u092e\u094b\u093d\u0927\u094d\u092f\u093e\u092f\u0903) and closes on its colophon. The story is told in full: the blind king asking in his palace while Sanjaya sees the field with divine sight, the armies drawn up, the roll call of the conches, Krishna driving the chariot between the armies, Arjuna\u2019s bow slipping from his hand. When Krishna teaches, the chariot stands at the side and a great roundel paints what he is saying: worn clothes cast off for new ones, the self that weapons cannot cut or fire burn, the tortoise drawing in its limbs, the ocean that the rivers fill without moving it, the lamp in a windless place, the boat blown off course by the wind. The set pieces have their own paintings: the wheel of sacrifice, the avatars age after age, all things strung on him like pearls on a thread, the bright path and the dark path, a leaf, a flower, a fruit and a little water offered to Shrinathji, the gallery of his glories, the light of a thousand suns, the mouths of Time swallowing the warriors, the tree with its roots in the sky, the three qualities, and at the end Arjuna rising with his bow. Every syllable lights as it is chanted, in Devanagari and roman, with the speaker named, and an English translation of all 701 verses written for this page sits beneath. A chant score plays under it: a tanpura drone, a choir that sings each syllable on its own vowel, a bansuri, bells and the conch. Your place is kept, and there is a reading view of the whole text, chapter by chapter.',
    spec: ['18 chapters · 701 verses · ~2¼ hours', 'Devanagari · roman · a new English translation', 'about 100 painted tableaux · chant, flute, conch'],
    ink: '#ec7322',
    wash: 'rgba(236, 115, 34, 0.12)',
  },

  {
    id: 'navadurga',
    name: 'नवदुर्गा · Nine Nights',
    tagline: 'A small gallery for Navaratri: the nine forms of Durga in pen, ballpoint, crayon and chalk, six of her battles to play your way through, and a music room of garba, dandiya and dhaak.',
    blurb:
      'One goddess, nine nights, nine forms, hung on a gallery wall with brass labels: Shailaputri in hatched pen on ochre under a sunrise of patterned rays, with a quilt of nine moons beneath; Brahmacharini in blue and red ballpoint under rings of fans; Chandraghanta in crayon on taped scraps of paper, her bell ringing; Kushmanda smiling the cosmic egg into being in gold on night paper; Skandamata on a lotus with her son in her lap; Katyayani in cream on rust with the buffalo fleeing; Kalaratri in chalk on indigo, breathing fire; Mahagauri in grey pencil and gold; and Siddhidatri in every manner at once. Step up to a painting and its label tells her story, what she holds, what she rides and her mantra. Then go into her battles from the Devi Mahatmya and take part in each: tap Brahma to sing so the goddess of sleep leaves Vishnu, and drag her out of him; send out each god\u2019s light until it becomes a woman, put their weapons in her hands, and meet every shape Mahisha takes — noose for the buffalo, sword for the lion, arrows for the man, sword again for the elephant; hold the syllable \u0939\u0941\u0902 and burn Smoke-eyes to ash; frown her brow until Kali springs out of it; catch every drop of Raktabija\u2019s blood in Chamunda\u2019s mouth before it can stand up as another demon; and draw the seven Mothers back into the One. Last, the music room: a garba circle turning round the lit pot and quickening as it goes, dandiya pairs striking sticks, and for the Bengali Pujo the dhaki with his plumed drum, the kansar gong, conch, ulu and dhunuchi dancers swinging smoking pots before the goddess — all synthesised as you listen, and you can clap or strike along — with a listening list for each night of Gujarati garba and Bengali Pujo songs, from the Mahalaya dawn broadcast to the immersion.',
    spec: ['9 portraits in 9 hand-drawn manners', '6 playable battles from the Devi Mahatmya', 'garba · dandiya · dhaak · dhunuchi, synthesised'],
    ink: '#b8402a',
    wash: 'rgba(184, 64, 42, 0.12)',
  },

];

export const EFFECT_BY_ID = Object.fromEntries(EFFECTS.map((e) => [e.id, e])) as Record<
  EffectId,
  EffectDef
>;

export function isEffectId(v: string | null | undefined): v is EffectId {
  return !!v && v in EFFECT_BY_ID;
}