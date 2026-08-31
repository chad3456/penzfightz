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
Roll Call, Two Crayons, Wet on Wet, Six Colours and Surface Tension live. It is not games; it is the moving parts, one
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

**Goopy iridescent droplets.** Nothing draws a bead — each one adds a field
falling off as one over distance squared and the droplet is wherever the sum
crosses a threshold, so they merge and neck with no code aware it happened. The
colour is real thin-film interference: the path difference through the film is
worked out and evaluated at 650, 545 and 470 nanometres, which is why it comes
out soap-bubble magenta and gold rather than an even spectrum. The gradient is
analytic, so it is one loop per pixel rather than five.

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
