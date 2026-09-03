# The Back Bench

Six games from the last row of an Indian classroom, the bus home, and the
pavement outside. Play the computer, or send someone a link and play them.

| Game | What it is | Seats |
| --- | --- | --- |
| **Pen Fight** | Flick your pen, knock theirs off the desk, keep the pen. Full 3D with real physics. | 2 |
| **Lattu** | The spinning-top duel. Throw theirs out of the dish, take the beast off their back. | 1–2 |
| **Raja Rani Chor Police** | Four chits, four roles. The Police gets one guess at the Chor. | 2–4 |
| **Rang** | The UNO game. Skips, reverses, draw-twos, wilds, stacked draws. | 2–6 |
| **Mafia** | The village sleeps, somebody dies, everybody argues. | 4–12 |
| **The Book Stall** | Press the button, the till prints you a line of Dostoevsky. | 1 |
| **The Back of the Bill** | Walk the maze, pick up the word cut out of the line. | 1 |

Every game except The Book Stall and Lattu has a practice mode against computer
players and a room you can share by link — Lattu has the computer and a second
player on the same keyboard, but no link yet. Rooms use a five-letter code, because that is
what you can shout across a classroom. The Book Stall is for one person and a
quiet minute.

## Pen Fight

Press your pen, drag backwards, let go. The further you pull the harder the
flick, and **where** you press matters as much as how hard — press the middle of
the barrel for a clean push, press near the nib or the cap and the pen pivots as
it goes, which is how you get around a pen hiding behind yours.

Then it is their turn. One flick each until a pen goes off the desk. Knock your
own pen off and the point is theirs. In a two-player match the loser hands over
the pen they were holding, and it goes into your Camlin box.

### The pens

Twelve real pens of the era, each with its own mass, length, friction and
balance — the numbers *are* the physics, not decoration. A Hero 616 has a brass
barrel and ploughs through anything but needs a real flick to move; a Montex
Hi-Tecpoint weighs six grams and skids off the edge as easily as it reaches it.

`src/game/pens.ts` is the single source of truth. The 3D models, the SVG icons,
the physics colliders and the SQL seed are all generated from it:

```sh
npm run gen:pens   # rewrites supabase/migrations/0002_seed_pens.sql
```

The good ones — Flair Carbonix, Hero 616, the Trimax — do not lie in the tray
with the rest. They go in the rack in the lid of the Camlin box, on display,
which is exactly where they went.

### Tuning the feel

Slide distance is cleanly quadratic in draw strength, so the whole skill curve
is one measured constant in `src/game/table.ts`:

```ts
export const FULL_POWER_TRAVEL = 1.25;  // metres, at full draw
```

Pens rack 0.44m apart, so below about 60% draw you cannot reach your opponent, a
knockout wants 75–85%, and at the top of the range you have enough left over to
follow their pen off the far edge.

Draw **power** is measured in screen pixels, not metres of desk. The desk
recedes under a pitched camera, so measuring in world space made an upward flick
read full strength almost immediately; pixels are what the hand actually
controls. Aim *direction* is still solved in table space, so pointing is exact.

## Lattu

Two tops in a dish. Throw theirs over the rim for two points, outlast it for
one, first to five, and the beast off the back of whoever you beat goes in your
case. Eight to collect, and four more that only turn up once you have cleared
the ladder.

The physics is written by hand rather than handed to an engine, because the
whole character of the game is gyroscopic: the spin drives a tangential speed,
Cartesian integration of that throws the top outward as fast as the bowl pulls
it in, and the two balance at a radius that shrinks as the spin runs down. That
one equilibrium gives you the racing, the spiral and the collapse at the end for
free. Collisions resolve twice — a shove along the normal and a *grind* along
the tangent — which is why meeting a left-spin top head on costs you half your
spin, without that being a special case anywhere.

Every constant in it was set by running the whole roster against itself, 864
rounds a pass. [`docs/lattu.md`](docs/lattu.md) has the passes, the three models
that did not work and why, and the four things measurement caught that playing
it never would have.

## Rang, and why it is not called UNO

It is the UNO game — the same ruleset, including wild draw-fours, stacked draw
cards, and the penalty for not calling your last card. The name is different
because UNO is Mattel's trademark; the rules themselves are old and unowned.
The shelf says so on the card, so nobody has to guess.

The deck is shuffled fresh every round, seven cards each, and the first turn is
picked at random rather than always starting with whoever dealt.

`npm run test:rang` plays a few thousand games of it against itself and checks
the rules hold — that all 108 cards are always accounted for, that no legal play
is ever refused, that a stacked draw always resolves, that the pile reshuffles
when it runs dry, and that every game finishes with a winner holding no cards.
A browser run proves the screen works; this proves the deck does.

## The Book Stall

Cheap Soviet-printed Russian classics were sold off pavement tables outside
every Indian bus stand in the eighties and nineties, next to the exam guides.
This is that table, reduced to its last act: press the button and the till
prints you one line.

The receipt is the whole interface — thermal paper with a torn edge, a till
font, a barcode nobody will ever scan, and forty lines of stock. Draws come from
a bag rather than a die roll: every line comes out once before any line comes
out twice, and the line you just read is held back across the reset, so you can
never be handed the same one twice running. Four hundred thousand simulated
draws found zero repeats and a perfectly even spread.

**239 lines from fourteen works.** 194 of them carry the part and chapter they
sit in, because they were located in a source text rather than recalled.
`scripts/epub-text.mjs` flattens an ebook in spine order, `scripts/harvest.mjs`
scores half a million words down to something a person can read, and
`scripts/cite-quotes.mjs` refuses to emit any line it cannot find. The reading
and the choosing are still done by hand — the scorer narrows, it does not
select.

The remaining lines are in common circulation and have no reference, which is
how you can tell them apart: a reference means somebody checked.

**On translators.** Dostoevsky's Russian is public domain; an English
translation is its own copyrighted work. Four of the five source ebooks are
modern translations still in copyright — McDuff, Pevear & Volokhonsky,
Magarshack, and an unnamed *Double*. Every line records whose English it is, so
provenance travels with the line and swapping to a public-domain rendering is a
data change rather than an excavation. Where the same passage existed in two
translations, the public-domain one was kept. The ebooks themselves are
gitignored and never shipped.

Checking the earlier set against the real text was worth doing: of eleven lines
this file had attributed to *Crime and Punishment*, four were verbatim, two
were other translators' wordings of real passages, and five could not be placed
at all. The five are gone and the two are now what the book actually says.

Every bill carries a rosette at its foot — the sort of woodblock printer's
flower a job press kept on a stick of type and stamped into anything that
needed filling. There is no image file: the shape is built from the quote's own
id, so a line always prints the same flower and no two lines print the same
one, and the broken-ink look comes from stamping the outline as several
thousand small dots rather than drawing it as a line.
[`docs/rosette.md`](docs/rosette.md) has the construction, and the one mistake
in it that looked like a geometry bug and was not.

What you have collected is kept in `localStorage`, so the bag survives a
refresh. There is no account and nothing goes to the server; this one is between
you and the man behind the table.

## Effects

There is a **second tab on the shelf**, next to Games — that is where Dot Field,
Roll Call, Two Crayons, Wet on Wet, Six Colours, Surface Tension, Ink and Water, Picture Book and Name and Form
live. It is not games; it is the moving parts, one
idea each, with the numbers on the card.

**Dot Field** renders text onto a six-pixel lattice as three-pixel squares and
lets the pointer push them out of the way: straight outwards, hardest at the
centre, nothing beyond a hundred and sixty-six pixels. Nothing rotates, fades
or blurs; a straight row of squares simply bends into an arc as it gets out of
the way. Scrolling leans the whole field and then moves to the next line, dots
travelling to their nearest new home rather than cutting.

Every constant in it was measured off a reference recording rather than
guessed, and [`docs/dot-field.md`](docs/dot-field.md) is the record of how —
including the two things the fitting turned up that were not obvious from
watching it, and the verification that renders the engine back at the
reference's viewport and re-derives the force law from its own output.

## The back of the bill

Job presses printed a maze on the reverse of a handbill to keep a child quiet
while the adults talked. This one has a word cut out of a line of Dostoevsky
and the letters of that word dropped along the single true route through, so
the only way to collect them in order is to walk it. Reach the end and the
stall prints the line with the word put back, and the chapter it came from.

The maze is carved by recursive backtracking from a seed, which gives a perfect
maze — exactly one route between any two cells — so the route is found rather
than chosen, and the letters can only sit on it. Over 200 generated mazes every
letter lands on the true route, in order, with the exit always reachable and
routes running 17 to 65 cells.

Walls are stamped, not stroked: the same ink routine that prints the flower,
exported from `rosette.ts` so there is one hand on the site rather than two.

## Roll Call

Fifteen hundred and forty-seven faces on the effects shelf, none of them drawn. Each is thirty-nine
numbers, and the drawing code is a pure function of them — a superellipse
silhouette, a hand that wanders rather than jitters, a colour wash deliberately
printed off the line, and no symmetry anywhere. The persona is read off the same
genes, so the note under a name always describes the face above it.

Twelve sets — a back bench, a staffroom, a corporate floor, a group chat, a
night bus, a committee, a field trip, a nineties sitcom, a comment section, a
departure lounge, a menagerie of animals, and a set of archetypes — all from one
generator narrowed twelve ways rather than twelve generators. Animals are one
gene, not a separate pipeline. Skin runs a full twelve-step ramp and hair
includes coils, locs, buns and long hair; place is context and dress rather than
face shape, because nationality is not a facial measurement.

**The Waxworks** is eleven public figures, hand-authored rather than searched
for, and labelled on the card as caricature rather than likeness — the medium
cannot do likeness. A fictional character is copyright; a real face is not, but
real people are protected by personality rights, which target commercial use and
false endorsement rather than caricature. Non-commercial, plainly stylised, no
endorsement implied, notes on visual signature rather than commentary.

**From a photograph:** pick a picture, drag three markers onto the eyes and
chin, and it measures tone, proportion, hair and beard and sets those nine
genes. The other thirty-five stay random, and the card tells you which were
which. It is not a likeness. The file never leaves the browser — a test asserts
zero off-origin requests while one is loaded. They stand in a wall you can
orbit, pick up and leave where you drop them: p5 draws them into texture
atlases, three.js puts them on instanced cards, and the whole census is four
draw calls.

The faces are found rather than sampled: each new one is proposed in a batch,
scored on how far it sits from everyone already seated, and hill-climbed away
from its nearest neighbour. The closest pair inside a set ends up **70% further
apart** than the closest pair you would get by drawing the same census straight
from its prior. [`docs/roll-call.md`](docs/roll-call.md) has the method, the
numbers, and the bugs — including the one where the search was quietly making
the census *worse* than no search at all.

No image is stored, loaded or copied anywhere in this project: there are no
raster or vector assets in the repository, no data URIs in the source, and the
face code never calls an image API. Open any face's card and it will show you
the forty-one numbers it is.


## Two Crayons

Two hundred heads, sixteen hundred whole figures and a thousand staged scenes in
black and one colour, on paper — cricket, football, games, work, everyday
gestures, people running and falling over, and people sitting alone on park
benches. Nothing here asks the
canvas for a line: every mark is pigment deposited a pixel at a time, and
whether a pixel gets any comes down to one comparison — does the pressure of the
stroke beat the tooth of the paper underneath it. That single line gives you
marks that break up where the hand goes light, taper at the end rather than the
start, and — because the tooth belongs to the *page* and not to the stroke — skip
over the same bumps where two strokes cross.

The heads on top of it are a grammar of eight families with three rules taken off
the reference: the contour is open, the colour is laid first and deliberately out
of register, and the two eyes are always drawn from different families. The
figures are not a grammar of parts — that is what produces a mannequin. Each one
is built on a **line of action** first, the single arc from the head through the
body to the weight-bearing foot, and hung with limbs afterwards; then the whole
thing is dropped so its lowest point lands on the ground, which is why a crouch,
a dive and a stand all sit correctly with no inverse kinematics anywhere.

The scenes go one further and author the *composition*: a cast and a set placed
in frame coordinates, across fifty-five stagings and twenty-two set pieces — a
bench, a library, a doorway, a window, a park at night. The set is deliberately
thin, because a piece of scenery detailed enough to look at stops giving the
figure somewhere to be; two people are a relationship rather than two figures,
decided entirely by the gap between them; and loneliness is drawn as one small
figure low in a large empty frame, never as a face. They hang on a globe you can
turn, hover for the title and click for the full print.
[`docs/two-crayons.md`](docs/two-crayons.md) has the method and the passes it
took — including the day every door came out as an archway because the smoothing
that makes a hand-drawn line also rounds off anything a carpenter built. The same
engine draws the eight bladers in Lattu.

## Wet on Wet

A thousand watercolours of women at leisure — reading, listening, stretching,
waiting — in two tubes of paint and a lot of water. Where Two Crayons is a
deposition model, this one is a **simulation**, and that is the whole point:
in a dry medium the mark is where you put it, and in watercolour you put pigment
down and then the sheet decides. So there is no code anywhere in here that draws
a soft edge, a bleed, a dark rim or a bloom. Water depth, a wet mask, velocity
and two pigments — in suspension and on the fibre — live in a pair of float
textures, and a painting is forty-six ping-ponged steps of two fragment shaders
over them.

The detail worth knowing is that **edge darkening is emergent**. Velocity is
driven by the gradient of the water surface, so inside a puddle the flow points
outwards; pigment rides it to the boundary, cannot cross, and drops out of
suspension as the film thins. Every wash paints its own dark rim and nothing
draws an outline. Granulation is a pigment property — heavy particles settle
into the tooth of the paper — and so is staining, which decides whether a second
stroke through a first *moves* it or covers it. Nothing stores a colour: a
pigment is three absorption coefficients and the sheet is tinted with
Beer–Lambert, which is why two washes multiply and a blue over an orange goes to
grey-brown rather than to something halfway.

The figures are mass rather than line, painted in three stages because in
watercolour the order *is* the technique: the biggest shape onto a soaked sheet
with most of the drying still to come, the body while it is damp, and a handful
of nearly dry darks at the end that stay sharp because there is no longer enough
water to move them. Seventy poses are written by hand and every painting jitters
them, because a position repeated is a hundred copies of one drawing however
much the colour changes.

They hang on a sphere that assembles itself a plate at a time as it paints, and
clicking one paints it again at size rather than scaling the card up — the same
intention and a different accident, which is what a second attempt at a
watercolour is. [`docs/wet-on-wet.md`](docs/wet-on-wet.md) has the physics, the
resolution-invariance arithmetic, and the two bugs that did not look like bugs.

## Six Colours

Two and a half thousand drawings of things you could pick up — bottles,
teapots, jars, glasses, a vase of flowers — of the people who would pick them
up, and of movie stars. Every one is made under the rule printed in its own
corner: **six inks, and not one line in the picture may be anything else.** With six colours and no mixing you cannot
render, blend or correct; you can only choose, over and over, and the choosing
is what the picture is made of.

The colour of the marks has nothing to do with the colour of the object. Local
colour goes down first, translucent and loose, and then the six go round the form
two or three times — broken into arcs with gaps, each arc sitting a few pixels
off the true edge, each one a different ink. A bottle outlined in lime and blue
is a bottle you have to look at.

Every object is a **profile turned about a vertical axis** plus four possible
attachments, because that is what the subject actually is: a bottle and a jug
and a vase are all things made on a wheel or in a two-part mould, and both of
those are lathes. The attachments carry more identity than the profile — a
handle makes a jug, a spout and a lid make a teapot, a crown cap and a waist
make a Coke bottle and nothing else in the world.

This is the one medium in the repository that is honestly a *screen* medium.
There is no paper, no tooth, no water and nothing is simulated: a mark is a path
with a round cap, which is what a brush in a drawing app really is. Pretending
otherwise is what makes digital drawings look like bad photographs of paintings.
The stars are the same face grammar plus the apparatus of publicity, because
that is what stardom turns out to be made of: a plain portrait and a star
portrait can be the same head, and what separates them is a backdrop, a light
and a name in lettering underneath. Two idioms — black tie and a spotlight, or
the hand-painted Bombay cinema hoarding, which is a close relative of this flat
brush style and sits here without adaptation. They are **not portraits of real
people and are not labelled as if they were**: a name and a face together are
the thing publicity rights cover, and more to the point this engine draws from
twenty haircuts and a flat fill, so a real name under an arbitrary output would
be a false attribution of a face that does not resemble them. The titles are
built from two halves and the caption is a billing — top billing, second lead,
the villain's sister — never a name.

[`docs/six-colours.md`](docs/six-colours.md) has the method — including the day
every label came out as a circle, which is the second time this repository has
learned that you smooth what grew and keep the corners on what was made.

## Surface Tension

A bench rather than a gallery: two shaders and the controls to take them apart,
where every knob is a term in an equation rather than a style preset. Film
thickness is in nanometres; wave speed has a stability limit; nothing is called
*intensity*.

**Gluey iridescent droplets, drawn rather than rendered.** Nothing puts down a
bead — each one adds a field falling off as one over distance squared and the
droplet is wherever the sum crosses a threshold, so they merge and neck with no
code aware it happened. The gradient is analytic, so it is one loop per pixel
rather than five.

The colour is real thin-film interference — the path difference through the film
evaluated at 650, 545 and 470 nanometres — but the answer *indexes a painted
palette* rather than being emitted as a spectrum, so the physics still decides
which colour a bead is and the answer is always a colour somebody chose.
Everything on top of that is illustration, and it is about six specific moves:
the light is posterised into a handful of steps, the body is one flat colour
with the iridescence mixed in only at the rim where you would actually see it,
the highlight is a dot with an edge, the shadow is flat and offset like a
sticker on a page, there is grain at two scales over the lot, and the largest
beads have eyes — because a thing with eyes is a character, and a character is
something you watch rather than look at.

**A swimming pool, entirely in three.js.** A height field running the wave
equation — two states kept, not one, because waves need momentum through the
flat position and a single state only gives you diffusion. Two draw passes a
frame, because you cannot refract what you have not drawn yet: the pool is
rendered without its water and the surface reads that back, bent by its own
normal. The caustics on the floor are not a texture; a caustic is the
reciprocal of how much a beam spread out on the way down, which to first order
is the Laplacian of the surface, so the floor takes ∇²h from the height field
above it and brightens where the water is convex.

[`docs/surface-tension.md`](docs/surface-tension.md) has the physics and the
failures — including a pool with a sheet of black glass over it, caused by
three quietly cloning a `uniforms` object that was passed as a prop.

## Ink and Water

A Chinese dragon and its phoenixes, swimming through an incompressible fluid,
in p5. There is no sprite, no texture and no image file: everything on the
screen is either the water or something drawn into it.

The whole effect rests on one decision. **The dragon is drawn into the dye the
solver advects, not on top of it** — so the instant a fold of its own wake
crosses its tail, the tail comes apart into that fold. Draw the animal as a
layer over the fluid instead and you have a cartoon on a lava lamp: nothing it
does affects the water and nothing the water does affects it.

Underneath is Stam's solver — advect, put back the curl the grid ate, measure
divergence, and eighteen Jacobi passes for the pressure that cancels it. That
last step is the piece that is tempting to skip and the piece that produces the
entire look: without pressure the ink only *spreads*, and spreading is what
smoke does. With it, water that has nowhere to go shoves the ink sideways, and
it sheets, folds and draws out into filaments.

Neither creature is rigged. Both are chains that follow their own heads, so the
undulation is a consequence of steering rather than a loop played over the top,
and the tail whips because a chain whips. What makes each one readable is a very
short list and it is not the body: a Chinese dragon is whiskers, horns and a
serrated back, and a phoenix is a tail.

The composite decides what ink on wet silk looks like. Absorption rather than
colour — Beer–Lambert takes the ground away, and the ink's own light peaks at a
thin film and dies as the film thickens, so a wash of it glows and a fold of it
does not. That is why the dragon reads at all: it is the one dark shape in a
frame of luminous water, and the wake it is dissolving into is bright for
exactly the reason the animal is not.

[`docs/ink-and-water.md`](docs/ink-and-water.md) has the derivations and the
failures — including the two seconds it took for the creatures to be buried
inside their own wake, and the slow machine that silted up solid white because
dissipation was applied per frame instead of per second.

The chrome is glass laid over the water rather than a bar above it: the canvas
is the page, and the panels are dismissible and never cover the middle. Drag to
draw through it, tap for a drop, hold and the animals come to your hand.

## Picture Book

A hundred neighbours, none of them anybody, in canvas 2D.

Every other gallery here makes a thousand of something and the number is the
argument — how far one method goes before it repeats. This one is deliberately
small, because the claim is different: whether a generator can hold a **single
illustrator's hand** steady across a whole cast, so that a hundred faces read as
a hundred spreads from one book rather than a hundred outputs from one program.

So the mark never changes. Every card gets the same torn ground, the same warm
charcoal line, the same pencil scuff over every fill and the same grain on top.
What changes underneath is the head, the hair, the hat, the glasses and the
shirt.

Nothing is a photograph or a trace of one. A beard is nine hundred drawn strands
with the width falling off towards the tip, so its silhouette is made of *ends*
rather than of a curve; straw is two passes of short strokes crossing at a
shallow angle; skin shadow is the base turned towards red rather than darkened,
because what you see in a shadow on a face is the blood under it. And the
caption is read off the same seed as the picture, from a list indexed by the
hat, so the trade always matches what the person is wearing.

[`docs/picture-book.md`](docs/picture-book.md) has the method and the
screenshots that caught it — the neck that was a lightbulb, the cap peak that
was a plank nailed to the side of the head, and the first cast that turned out
to be a hundred variations on one man.

## Name and Form

*Nāma-rūpa.* Two thousand figures out of the Mahābhārata, the Rāmāyaṇa and the
asura literature, drawn by **the same hand as Picture Book** — the head, the
ground, the scuff and the grain are imported from it rather than copied.

That is the point of building it this way. The picture book claims a generator
can hold one illustrator's hand steady across a cast; a hundred neighbours is a
weak test, because they are all the same kind of subject. The honest test is to
hand that hand crowns, matted locks, fangs and serpent hoods and see whether it
still looks like one book. Everything new here is iconography, not style.

**Nothing is a likeness and nothing could be.** These are not people who were
photographed; they are people who were described. So the roster records only
what the texts record — that this one is dark as a rain cloud, that one wears
matted locks, that one has fangs, that one bound her own eyes on her wedding day
and never unbound them — and the generator draws a face under it. Anything the
texts do not specify comes from the seed.

**268 of the two thousand are named.** The rest are the host, because the epics
are full of thousands who are counted and never named: eighteen akshauhinis at
Kurukshetra, the vanara army at the bridge, the night-rangers of Lanka, the
gaṇas on the mountain. Those are generated, from the same compound morphemes the
real names are built from, and every one of those cards says on its face which
host it belongs to and that the verse does not name it.

The iconographic grammar is not invented and not a matter of taste: a tall
tapering crown is sovereignty, matted hair piled and tied is renunciation, three
horizontal lines are Shiva and a vertical U is Vishnu, a fan of hoods is a nāga,
tusks are a rākṣasa. Complexion is in the same category — in this material skin
colour is information rather than a variable, so it is set by tag and never by
seed for anyone the texts describe.

[`docs/name-and-form.md`](docs/name-and-form.md) has the grammar and the
failures — the armour that made everyone a yellow poncho, the nāga hood that
came out as a jester's hat, and the day Jatayu was drawn as a man.

## How the galleries open

**Grid first, sphere on a switch.** The globe is the better *object* — it has a
far side, it turns, and a thousand cards on it read as one thing. It is the
worse *catalogue*: half the set is always behind the other half. The first
question anybody asks a gallery is what is in it, so the sheet is the default
and the sphere is a button. Both are the same instanced mesh and the same
picker; placement, orientation and the controls are all that differ.

The column count is solved rather than guessed — `cols = √(1.7·count / aspect)`,
so portrait cards get more columns — the pitch follows the card in each axis, and
the last row is centred on itself, because it is nearly always short and looks
lopsided otherwise.

**The loading screen is a workshop.** A flatbed plotter whose pen speed is the
real cells-per-second; an output tray that fills with specimens *blitted out of
the atlas being baked*, which costs nothing because the pixels already exist;
every number the bake knows; and if you hold the pointer down, you have the pen.
It is a doodle pad with a progress bar attached. The panel sits over the gallery
rather than covering it, so the sheet fills in behind the glass while the tray
fills in front of it.

[`docs/loading.md`](docs/loading.md) has both, including the camera that React
Three Fiber reads exactly once and the marble that came of it.

## Once More

A game about morality with no morality meter, because the meter is the thing
being argued about. Ten situations out of Dostoevsky and Nietzsche — not the
plots, the positions — and what you get instead of a bar is a **deck**.

You start with twelve cards and no character. Every choice spends one and puts
back what the doing of it teaches, so after ten scenes the deck is a record of
what you repeatedly did; and because a choice is only offered if the card it
costs is in your hand, it is simultaneously the list of what you are still able
to do. That is the *Genealogy of Morals* as a rule rather than a summary: a
morality is the residue of a history, and it closes doors as it opens them.

**Guilt is the one card that cannot be played.** It occupies a slot and does
nothing, so a guilty person is a person with fewer options — as a mechanic, not
as an image. Confession clears it and costs every bit of standing those acts
bought, plus one, so it is never merely a good trade. That single rule is *Crime
and Punishment* compressed and, at the same time, Nietzsche's second essay, where
guilt (*Schuld*) descends from debt (*Schulden*). The two men are describing the
same machine and disagreeing about whether to be grateful for it.

Both of them comment on every choice. Neither is ever simply pleased with you,
and where they both object to the same one — usually the free option, which is
nearly always the passive one — that is the choice worth thinking about.

Nothing either says is a quotation. Both voices are the game's own rendering of
the argument, written from the passage cited under each scene, because a
paraphrase is something you can argue with and a quotation is something you can
only admire. At the end nothing is scored: the game lays your life out as a list
and asks the question from *The Gay Science* — this, in the same order,
innumerable times more. Do you want it again?

[`docs/once-more.md`](docs/once-more.md) has the design and the first playtest,
including the opening hand that locked two of the three answers in scene one.

## Ground Plan

A city builder in three.js, built against an aerial photograph rather than a
game screenshot — which decided most of it, because the picture has to survive
being looked at from eight hundred metres *and* from the middle of a street, and
almost nothing survives both if it was modelled rather than shaded.

**The road graph is the only thing you author.** Blocks are its faces, found by
walking every half-edge and turning to the next edge clockwise. Lots are
subdivisions of those faces along their frontages. Buildings stand on the lots
and face the edge they were cut from. Traffic runs on the edges. Bulldozing a
street through the middle of a block re-cuts every lot around it for free,
because there is exactly one place where the shape of the city is decided.

**Facades are shaded in metres, not in normalised UVs.** A floor is 3.4 m and a
window bay 2.7 m everywhere, so a forty-storey tower and a corner shop have
windows the same size. Normalised UVs give every building in the city the same
number of floors, which is the most obvious tell in a generated skyline and is
visible from any distance at all. Each use gets three materials rather than one
tinted one — brick next to render next to painted stone — because what makes a
generated street look generated is that everything is the same colour at
different brightnesses.

**Roads have a real cross-section.** Seventeen centimetres of vertical kerb, so a
low sun puts a shadow along every street. Segments stop short of their nodes and
the junction is the convex hull of the trimmed corners: two roads of half-width
`h` meeting at angle θ cross their outer edges at `h / tan(θ/2)`, so four equal
roads at right angles produce exactly the square you would draw by hand, corners
included.

**Light a building makes goes through `totalEmissiveRadiance`, never the
albedo.** The first night was empty — two thousand people and nothing on screen —
because every lit window was being multiplied by the incident light, and at half
past nine there is none. A lit window in the albedo is a window that goes out
when the sun does.

The economy is small enough to hold in your head: workers to jobs, shops to
shoppers, money in to money out. Its two real bugs were structural rather than
numeric — job shares that could not add up to the workforce, so the city
deadlocked at four thousand with every bar reading *enough*; and undamped demand,
which oscillated between the rails and abandoned half the city every other day.

[`docs/ground-plan.md`](docs/ground-plan.md) has the face-traversal sign that was
worked out on a triangle, the junction geometry, and the rest.

## Running it

```sh
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production bundle
npm run preview
```

The Supabase URL and publishable key in `.env` are public by design — every
table is behind RLS with select-only access, and every write goes through a
`SECURITY DEFINER` function. Point `.env` at your own project and apply
`supabase/migrations/*.sql` in order if you fork it.

With no backend configured every game still runs against the computer, and your
name and pens persist in `localStorage`. Rankings and friend rooms are off.

## How it is built

- **Vite + React + TypeScript**, no router. Pen Fight mounts a 3D classroom;
  the other three float on torn notebook paper over a still version of the same
  room, so you never feel like you left it.
- **three.js + Rapier** for Pen Fight. Each pen is a compound rigid body — a
  barrel box plus a heavier cap box at the tail — so the centre of mass sits
  where the pen's balance says. A flick is an impulse applied *at a point*.
- **Every texture is painted onto a canvas at runtime**: wood grain, mosaic
  floor, desk graffiti, wall distemper, and a blackboard that keeps the live
  score in chalk. No image downloads, no web fonts.
- **All audio is synthesised** in Web Audio — corridor ambience, kids shouting,
  the bell, pen-on-pen clacks that scale with impact, cards, chits and a
  nightfall drone. Nothing is sampled.
- **Supabase** for players, rooms, per-game rankings and the counters on the
  shelf.

### Multiplayer, and keeping secrets

Every game that seats more than one person runs the same way: one browser hosts
and owns the truth, everybody else sends intent and renders what comes back.

That is fine for Pen Fight — both pens are on the table in plain sight. It is
not fine for a hand of cards or a Mafia role, because every browser in the room
receives every broadcast message. So each player generates an ECDH keypair on
join, and the host encrypts each seat's private slice to that seat alone
(`src/arcade/crypto.ts`). Everyone receives the ciphertext; only the intended
seat can read it.

This protects players from each other, which is the threat that matters at a
school desk. It does not protect anyone from a dishonest host, who is running
the game and necessarily knows everything — the same trust you gave whoever was
dealing.

### Layout

```
src/
  arcade/   the shelf, the shared room layer, per-seat encryption
  games/
    penfight/  the 3D desk game
    rajarani/  chits and one guess
    rang/      the card game
    mafia/     roles, nights, votes
    bookstall/ the quote stock, the receipt, and the flower it stamps
    maze/      the handbill maze and the word cut out of the line
  effects/  the effects tab
    globe/     the Fibonacci sphere both galleries hang on
    rollcall/  two thousand things, found by novelty search
    crayon/    heads, figures and staged scenes in two crayons
    wash/      watercolour: a paper model, a pigment model, a GPU wash solver
    flat/      six inks, a lathe, and a broken contour that is the wrong colour
    water/     metaballs with thin-film colour, and a pool that solves its waves
  game/     pen specs, desk constants, Pen Fight's match engine and AI
  three/    classroom, pen model, physics arena, camera
  ui/       paper sheets, the Camlin box, chalkboard ranking, HUD
  lib/      supabase client, identity, api, synthesised audio
supabase/
  migrations/   schema, generated pen seed, RPCs, and the multi-game arcade
```

Add `?debug` to the URL to expose `window.__penfight` — the match store, pen
positions, and `flick(power, angleDeg, strike)` for driving the physics from a
test run.

## A note on names

**Rang** is the colour-and-number card game everyone has played under some name
or other; the rules are old and unowned, and this is not anybody's branded deck.
**Lattu** is the same trade one step further. The duel — two spinning tops in a
bowl, last one turning wins — is beigoma, and lattu, and older than anybody's
trademark. The bladers and spirit beasts everybody pictures when they hear the
word are a different matter, because a fictional character is copyright in a way
a folk game is not; so the eight bladers, the twelve beasts and the marks on the
tops here are ours, and the shelf card says as much.
**Mafia** and **Raja Rani Chor Police** are traditional games with no owner at
all. The lines in **The Book Stall** are Dostoevsky's, each printed with the
book it came from; the English wording depends on the translator, which is why
the receipt says so in its small print rather than pretending otherwise. The pen brands are named because they were real pens, the way you would
name a real football.
