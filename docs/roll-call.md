# Roll Call: sixteen hundred faces, none of them drawn

Every face on the register is forty-six numbers. There is no sprite sheet, no
set of presets and no picture anywhere in the repository — the drawing code is
a pure function from a genome to ink on paper, and so is the persona, which is
why the note under a name always describes the face above it.

## What makes a doodle look drawn

Four things, and the generator is mostly about those four rather than about
features. Anyone can put two dots and a line on a circle.

**The head is not a circle.** It is a superellipse. One exponent takes it from
a diamond through an ellipse to a rounded square; an aspect ratio makes it tall
or wide; a pear term widens the jaw or the crown; a few slow lumps stop any of
it being exact. Seven families sample that space at different settings, which
is where the eggs, the diamonds and the tall bricks come from.

**The line wobbles slowly.** Per-point noise reads as a bad printer. A hand
wanders, so the tremor is smooth noise along the path, and every stroke is drawn
twice with a slight offset — that doubling is what gives a stroke the quality of
a pen going round a shape a second time.

**The colour is off the line.** The flat wash is its own blob with its own
shape, deliberately printed a few millimetres from where the ink is. That
misregistration does most of the work. Align them and the whole thing turns into
clip art. A third of the class gets no wash at all, because a page where every
face is tinted loses the contrast.

**Nothing is symmetrical.** The two eyes are drawn from separate parameters
rather than mirrored, ears may be one or none, and features sit off centre.

## Why the faces are found rather than sampled

Draw a hundred faces at random and several of them are near enough to each other
that a person reading the page would call them the same face twice. So each new
face is *found*: a batch of candidates is proposed, each is scored on how far it
sits from everyone already on the register, the most distant one is kept, and
that one is hill-climbed — mutated repeatedly, keeping any mutation that pushes
it further from its nearest neighbour — until it stops improving.

This is plain novelty search. There is no reward model and nothing is learned
between runs; calling it anything grander would be dressing it up. What it does
do is measurable:

| nearest-neighbour distance | novelty search | random sampling |
| --- | --- | --- |
| mean | 4.19 | 3.67 |
| **worst pair** | **4.06** | **2.51** |

The mean matters less than the worst pair. Random sampling's closest two faces
sit at 2.51; on the register nothing is closer than 4.06, so **the most similar
pair is 62% further apart than the most similar pair you would get by chance**.
About 6,700 candidates are proposed and rejected to seat a hundred, which takes
around 100ms.

Categorical genes become one-hot blocks in the feature vector so that changing
the sort of eye moves a fixed distance rather than one that depends on which two
sorts they were, and the weights are not uniform: silhouette, hair, spectacles
and beard count for more than the exact gap between the eyes, because that is
the order in which a person notices them.

## Bugs worth keeping a note of

**Four faces came out as solid black blobs.** `mutate` clamps genes with
`Math.min(1, ...)`, so a gene can be exactly 1.0, and `palette[Math.floor(1.0 *
palette.length)]` is one past the end. p5 fills `undefined` as black, and the
features were drawn invisibly on top of it. Every palette index now goes through
a clamp.

**The crown was filtered and sorted rather than taken as a run.** Selecting the
outline points above the eyeline and sorting them by x looks equivalent to
walking the top of the head and is not: on a tall or square head that band
includes points from both sides, and sorting interleaves left and right into a
zigzag. Filling it painted over the whole face. The crown is now the longest
contiguous run of the outline, which keeps the winding intact.

**The search was making the census worse.** At a thousand faces, scoring a
candidate against every seated face is quadratic, so novelty was estimated from
a bounded sample — capped at the ninety most recent of the same set. That left
the earliest faces in each set invisible to every later candidate, and
hill-climbing promptly found the blind spot and drove into it. Measured
exhaustively the search produced a *worse* spread than no search at all: a
closest pair of 0.26 against 2.11 for faces drawn straight from the prior. The
same-set comparison is complete now, and the report is computed over every pair
rather than with the shortcut the optimiser used — a figure produced by the same
approximation would be marking its own homework.

**The entire wall was unclickable.** `InstancedMesh` raycasting culls against a
bounding sphere, and the first one is built while every instance is still at the
origin. It is recomputed every frame now, which is also what keeps it honest
once cards have been dragged somewhere else.

**One block unmounting wiped the picker.** The block registry was a list that
was pushed to on mount and emptied on unmount, so React's double mount had one
of the four blocks clear the registry for all of them. Keyed by offset now.

**Every click was a one-pixel drag.** Click-versus-drag was decided on world
distance, which depends on how far the camera is and on floating-point noise in
the plane intersection. It is measured in screen pixels now.

**Clicking a toolbar button opened a card.** p5 hangs `mousePressed` off the
window, not off its canvas, so any click anywhere counted as a click on
whichever cell the pointer happened to be over. Selection is a DOM listener on
the canvas now, going through the bounding box because the canvas is laid out at
100% width and screen pixels are not sketch pixels.

## Fifteen sets from one generator

A set is not a second generator. It is a *prior*: a list of which families may
appear and which range each dial is held to. The corporate floor gets neat hair
and lanyards, the group chat gets caps and dyed fringes, and neither is
special-cased anywhere in the drawing code.

That distinction is the whole point. Fifteen hard-coded sets would be fifteen
things to maintain and fifteen chances for one to look bolted on; fifteen
narrowings of one distribution means anything added to the drawing shows up in
all of them at once.
Repeats in an allow-list act as weights, so `hair: [bald, bald, hatch]` gives
twice as many bald heads as hatched ones.

**On the Cameo set.** It contains archetypes — the rockstar, the anchor, the
founder — and no real people. Generating recognisable likenesses of actual
public figures is somebody's right of publicity and not something to put on a
public site; and a system whose whole vocabulary is forty-six doodle genes could
not resolve to a specific person if it tried. What it can do is a type, which is
what is here.

## Skin, and what a set is allowed to encode

The tone ramp is a real range, twelve steps from very fair to very deep, spaced
roughly evenly rather than crowded at the light end — which is the failure mode
of most generators and was the failure mode of the first version here, which
stopped at medium brown. Hair gained tight coils, locs, a gathered bun and long
hair falling past the jaw. Every set draws from all of it.

**Place is context, not physiognomy.** There is a Departure Lounge set, and what
makes it a departure lounge is neck pillows, lanyards and hoods — not face
shape. Nationality is not a facial measurement, encoding it as one is caricature,
and it would also simply be wrong. The same reasoning governs the Discourse set,
which satirises how people present themselves — the beret, the podcast mic, the
flag pin — and is even-handed across the spectrum rather than aimed at one part
of it.

**Cameo and Must-See TV hold archetypes and no real people.** A likeness of an
actual public figure is their right of publicity, and forty-four doodle genes
could not resolve to a specific person anyway. A type is what this can do.

## The menagerie

Animals are not a second generator either. `kingdom` is one gene; when it is set
the face draws a muzzle instead of a nose, ears from the animal half of the ear
family, and whiskers. Every human set pins `kingdom` to 0.

That pinning is load-bearing and was learned the hard way: widening the ear
family from four to eight without gating it put cat ears on the committee, the
staffroom and everybody else, because the human sets were still sampling the
whole family. `kingdom` is the single switch now, and the ear family is read
modulo four when it is off.

## The Deep End

The tank is the menagerie's argument run a second time. Nothing about a
crocodile needed a second generator either: three more entries in the `muzzle`
family — a snout, a pursed ring, a gape — one new family for fins, gills and
crests, and a set prior that pins the ears off and the eyes high and wide.

`fin` is gated on `kingdom` at the call site, and the menagerie pins it to
*none* on top of that, because a retriever with a dorsal crest is exactly the
leak the switch exists to stop. It draws under the silhouette, so the head line
lands on every fin base and a fin reads as attached rather than stuck on.

Three things had to be redrawn before the tank read:

- **The crocodile's teeth were in the wrong place.** The first version ran one
  zigzag straight across the snout — which is where the jaw line goes on a face
  seen from the *side*. Head on, it read as the bottom seam of a paper bag.
  Front-on you are looking at the top plate of the snout with both jaw lines
  running away from you down its edges, so that is where the teeth belong now.
- **The snout was drawn through the eyes.** It started at the brow, and the
  drawing order puts the muzzle over the eyes, so every long-headed croc came
  out blind. It starts below the eye line, and the set holds `eyeHeight` in the
  top third.
- **A beak among the fish read as a duck.** The bird's orange wedge is
  unmistakably a bird's. It is out of the tank's allow-list.

The cold jaws also report `ownMouth`, because a tooth line, a pursed ring and a
gape *are* mouths, and letting the generic mouth draw on top of one put a human
smile inside a shark.

The persona had to learn the same lesson. `hair: bald` is a true reading of a
fish's genes and a completely useless thing to say about one; without a
creature branch in front of the human rules, the entire tank came back described
as recently shaved.

## The Waxworks, and the law around it

Eleven public figures, hand-authored rather than searched for. Everything else
here is found by an optimiser; these are set by hand, because a caricature is an
argument about which two or three things a face is carried around by, and no
distance metric knows that. Rimless circles and a black roll-neck. A side
parting and large square frames. A full white beard.

What is encoded is a **visual signature**, not a likeness — the medium cannot do
likeness, and anything claiming otherwise from forty-six doodle genes would be
lying. If one reads, it reads for the same reason a four-stroke newspaper
cartoon reads.

On the legal shape of it, because it is a fair question and the usual framing is
slightly wrong. A fictional *character* is copyright. A real person's face is
not copyrightable — but real people are protected by **personality rights**,
which is a separate body of law and one that is actively enforced, in India
especially, where the courts have granted protection to several film
personalities in recent years. Those rights are aimed at unauthorised commercial
use and false endorsement. They are not aimed at caricature, which is why
editorial cartoonists draw heads of government every morning.

So: non-commercial, plainly stylised, labelled as caricature on the card itself,
no suggestion that anybody endorses anything, and notes that stay on visual
signature rather than on commentary — particularly for the sitting head of
government, where the line between caricature and editorialising is worth not
crossing by accident.

The set is marked `fixed`, which makes the search skip it entirely and keeps it
out of the spread figures. Comparing a hand-made thing to a found one would make
both numbers meaningless.

## From a photograph

Pick a picture, drag three markers onto both eyes and the chin, and the studio
measures what a photograph can honestly tell it: tone from both cheeks, hair
from how much darker the crown is, beard from how much darker the jaw is, and
proportion from the marker geometry. Nine genes come from the picture; the other
thirty-seven come from the seed, and the card lists which is which.

It is not a likeness and does not claim to be. It is also entirely local — the
file is read with FileReader, drawn to a canvas, sampled and dropped. A test
asserts zero off-origin requests while a photograph is loaded.

Two things it got wrong first. The crown was probed once, at a fixed height
above the eye line, which on a short face lands above the head — so a person
with black hair read as 9% cover because the probe was sampling the wall behind
them. It takes three probes up the forehead now and rejects any that match the
background, sampled from the four corners. And every unmeasured gene was left to
the seed, which produced a portrait wearing a cap — covering the hair it had
just measured — and a monocle. Anything that would hide or contradict a
measurement is pinned off.

## The globe

The census stands on the surface of a sphere, laid out by the **Fibonacci
sphere**: walk down the y axis in equal steps and turn by the golden angle each
time. Equal steps in y give equal steps in *area* on a sphere — Archimedes'
theorem — so every card gets the same patch of surface, and the golden angle is
the one rotation that never lets those patches settle into visible spokes.
Latitude-longitude, the obvious alternative, crowds the poles until the cards
are stacked on each other there and stranded at the equator.

Nearest-neighbour spacing on that layout is about `sqrt(4π/N)·R`, so the radius
is solved from the count rather than fixed. A census of two hundred and a census
of two thousand are equally dense, and the camera framing is derived from the
same number.

It also does something the flat wall could not. Seat indices run through the
sets in order and y falls monotonically with the index, so **each set comes out
as a latitude band** — the back bench is the north cap, the waxworks are the
south pole, and the census reads as a globe with visible strata before you have
clicked anything.

Cards face outward along the radius, so a lift is a step further out rather than
a step towards a camera that has since orbited elsewhere. There is no minimum
orbit distance worth speaking of: flying inside the shell and looking back out
is the best thing this view does.

## Focusing a set

Picking a set keeps it at the **full** radius and contracts everybody else into
a dense core at a quarter of it. A set of eleven becomes eleven cards alone on
a globe, and the camera never has to move.

Dimming the rest in place made the tabs decorative: a set of eleven scattered
through fifteen hundred is not findable, however faded its neighbours are. An
earlier version brought the focused set forward into a flat grid at a fixed
depth, which worked on a flat wall and stopped working the moment the camera
could orbit behind it.

## Hovering a face

The atlas cell is 128px, which is enough to recognise a face on a globe and not
enough to read one. Hovering re-inks the hovered genome at 264px in a panel
beside the pointer, with its set, roll number, name, nickname, traits and note —
the same drawing function, called again at a size where the tremor in the line
is visible.

Two details that matter. The p5 instance is created **once** and kept: the
hovered face changes every time the pointer crosses a card, and standing up a
fresh sketch each time — p5 v2 attaches its canvas asynchronously — flickered
and leaked canvases. The genome lives in a ref that `draw` reads, and an update
is a `redraw()`. And hover fires only on a *change* of card, not on every
pointer move, or the whole page would re-render sixty times a second while the
pointer sat still on one face.

## Three thousand cards, four draw calls

A thousand canvas textures is a thousand GPU uploads and about sixty megabytes
of mostly-cream paper. Faces are baked in blocks into 2048px atlases of 16×16
cells, and the globe is one `InstancedMesh` per atlas with a per-instance cell
attribute and three lines of injected GLSL — so the material keeps its own
lighting and fog and the whole census costs four draw calls.

Cells are baked with **transparent** backgrounds. Filling them with paper turns
the globe into a ball of tiles; with alpha the faces stand on the room's own
background. `alphaTest` rather than blending, so overlapping cards need no depth
sorting when they are dragged about.

Baking yields to the browser every 32 faces. A progress bar that never paints is
worse than a slow one.

## Verification

Rendered in headless Chromium and measured off the canvas, not by eye:

- **100 of 100 cells visually distinct** by pixel hash
- **1 cell** more than 55% ink, **0** effectively blank
- new seed redraws, ink-only toggles, exactly one canvas throughout — p5 v2
  attaches its canvas asynchronously, so each sketch gets its own mount node
  that is detached on teardown, or React's double mount leaves two stacked
- no horizontal overflow at 390px, no console errors
