# Roll Call: a hundred faces, none of them drawn

Every face on the register is thirty-nine numbers. There is no sprite sheet, no
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

## Three bugs worth keeping a note of

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

**Clicking a toolbar button opened a card.** p5 hangs `mousePressed` off the
window, not off its canvas, so any click anywhere counted as a click on
whichever cell the pointer happened to be over. Selection is a DOM listener on
the canvas now, going through the bounding box because the canvas is laid out at
100% width and screen pixels are not sketch pixels.

## Verification

Rendered in headless Chromium and measured off the canvas, not by eye:

- **100 of 100 cells visually distinct** by pixel hash
- **1 cell** more than 55% ink, **0** effectively blank
- new seed redraws, ink-only toggles, exactly one canvas throughout — p5 v2
  attaches its canvas asynchronously, so each sketch gets its own mount node
  that is detached on teardown, or React's double mount leaves two stacked
- no horizontal overflow at 390px, no console errors
