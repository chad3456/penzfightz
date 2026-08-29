# Two Crayons: eighteen hundred drawings, one black stick and one coloured one

## The constraint is the idea

Two hundred heads and sixteen hundred whole figures — cricket, football, games,
work, everyday gestures and people moving. Two sticks, rough paper, and not many
marks. Everything interesting about the
style comes out of what that forbids: you cannot render, you cannot shade, you
cannot correct. Every mark has to be the right one first time, and the drawing
is carried by *gesture* rather than by accuracy.

So the study splits cleanly in two. First the **medium** — what a wax stick
dragged across rough paper actually does — and only then the faces, which are a
small grammar sitting on top of it.

## The medium

### Pigment sticks where the pressure beats the tooth

Nothing here asks the canvas for a line. Every mark is pigment deposited one
pixel at a time, and whether a pixel gets any comes down to a single comparison:

```
stick  ⇔  pressure · falloff · bite  >  tooth(x, y)
```

That is the whole engine. A crayon does not lay down a stroke; it lays down
pigment **only where the raised tooth of the paper catches it**. The white flecks
inside every mark are not distressing added afterwards — they are the paper
showing through, and they are the reason the mark reads as a physical object
rather than as a shape.

From that one line you get, for free: marks that break up where the hand goes
light, that go solid where it leans in, and that are ragged at the edges because
the falloff is weakest there.

### The tooth belongs to the page, not to the stroke

The consequence that matters most. Two marks crossing each other **skip in the
same places**, because they are skipping over the same bump. Give every stroke
its own private noise and you get a page of independently distressed shapes,
which reads as a filter. Sample one field in page coordinates and you get a page.

Two octaves: a coarse weave at about 7px and a fine one at 2px, plus a speckle.
The coarse octave is what makes a mark break up in long ragged patches rather
than in even stipple — the difference between crayon and spray.

### The hand does not push evenly

A stroke at constant pressure reads as a machine however good the grain is. So
every mark has an envelope: a quick attack, a long release, a swell through the
middle, and a slow wobble along the way. Attack is quicker than release because
a crayon is put down decisively and lifted gradually, which is why these marks
taper at the end and not at the start. The two edges of the nib also wander
independently, so a stroke is never a ribbon of constant width — one side skids
while the other holds.

### Scrubbing a mass

The black pan and the orange blush in the reference are not filled polygons;
they are the same crayon gone over the same patch a dozen times. Two things had
to be right:

- **The scan spacing has to be tighter than the nib.** The first version spaced
  passes at 0.85 of the nib width and produced engraving hatch — a printed look,
  not a scrubbed one.
- **The weight has to vary on a two-dimensional field.** Vary it only along the
  scan direction and the patch comes out striped, which is the same failure
  wearing a different hat.

And the edge is a *depth* rather than a yes-or-no, with the boundary itself
pushed about by noise. A mathematically perfect rim is the last thing standing
between a scrubbed patch and a filled shape.

## The faces

Eight families — head, crown, eyes, nose, mouth, collar, colour mark, and marks
in the air — and three rules taken straight off the reference.

**The contour is open.** A head drawn as a closed loop reads as a balloon with a
face in it. The reference head is one stroke down a side, round the jaw and
part-way up the other, and it simply stops; the hat and the eye do the rest of
the work of saying "head". Closing that gap is the fastest way to lose the whole
style. The skull is a **superellipse**, not a circle: one exponent takes it from
an egg through to a rounded block with near-vertical sides and a flat jaw, which
is what that head actually is.

**The colour is off-register.** The orange is laid *first* — before the ink, so
everything else sits on top of it — and it does not line up. It sits half off the
cheek, crosses an eye, runs past the jaw. Align them and it turns into a
colouring book.

**The two eyes disagree.** One is a blot, the other a dot; one has colour across
it and the other does not. The two eyes are always drawn from *different*
families, because a matched pair is the other thing that turns this into a
cartoon.

One accent per face and only one. Vermilion is weighted to about half the wall so
the set reads as that drawing rather than as a paint chart.

## Whole figures

The heads are a grammar of parts. **A figure is not**, and treating it as one is
exactly the mistake that produces a mannequin.

### The line of action

What makes a drawn figure read as *doing something* is the single arc that runs
from the head, through the body, to whichever foot is carrying the weight. Every
pose is built around that curve first and hung with limbs afterwards — which is
why a figure with its arms in precisely the right places can still look like a
shop dummy if the spine is straight. The `bend` number in each pose is that
curve, and it is the most important number in the file.

### Poses are absolute, not composed

A pose is written as absolute bone directions in degrees. Ninety is straight
down, zero is off to the right, minus ninety is straight up.

That is entirely about being able to author fifty-six of these by hand. With
composed joint rotations you have to hold the parent's angle in your head to
know where a forearm ends up, and fifty-six poses written that way is fifty-six
poses full of arithmetic mistakes. Absolute directions read off the page:
`[-70, -85]` is an arm up and slightly back, and you can *see* that it is.

### The figure is dropped, not placed

Every joint is worked out first, then the whole thing is translated so its lowest
point lands on the ground line. A crouch, a dive and a stand therefore all sit
correctly without a word of inverse kinematics, and adjusting a knee can never
put a foot through the floor.

The same pass fits the figure to the page — and wide poses get more of it. A
keeper at full stretch is three times as wide as it is tall; at a standing
figure's margins it came out half the size and read as an insect.

### The ground mark is not decoration

Without a dash of shadow under the feet a figure **floats**, however good the
pose is. It is the cheapest mark on the page and it does more than any of the
others.

### The heads are the same heads

A figure's head is drawn by the heads grammar, at a twelfth of the height
instead of a third, with the collar left off because the body has shoulders of
its own. `drawHead` was split out of `drawFace` for it; nothing is duplicated.

### A limb is a wedge, not a stroke

The thing that turned these from armatures into people, and the one that took
longest to see. A limb drawn at **constant width** reads as wire, and no amount
of grain, pressure variation or boldness rescues it — because the problem is the
*silhouette*, not the surface. Two rounds were spent thickening strokes and
retuning pressure before it became obvious that thicker wire is still wire.

A crayon held at an angle makes a wedge, and an arm *is* a wedge: thick at the
shoulder, thin at the wrist. So the nib grew a width profile, interpolated along
the stroke, and one call now draws a limb that narrows properly. The pressure
envelope is turned right down on limbs at the same time — leave both on and a
limb fades out before it reaches the hand.

Two knock-on details. The scan across the nib has to step by the *widest* the
stroke ever gets, or the fat end goes gappy. And the hips had to widen: at the
old spacing a standing pose put the two legs near enough vertical and near
enough together that the taper closed the gap, and the figure came out wearing a
tube.

### What each pass fixed

| pass | what was wrong |
|---|---|
| 1 | stick figures — hairline limbs, a balloon head, a torso of two straight lines |
| 2 | limbs roughly doubled in weight, the trunk rebuilt from a real outline with a waist in it (a shoulder-to-hip trapezium comes out as a sliver with nothing in it) |
| 3 | the bat was a *stroked quad*, and every path goes through Chaikin smoothing on its way to the paper, so it came out as a rounded loop floating next to the batsman. It is a scrubbed mass now. |
| 4 | **still armatures.** The nib got a width profile; head down from a fifth of the height to a seventh; hips widened so two legs read as two; hand blobs dropped, because a tapering limb already ends itself and a blob on each of four is four marks on a page whose whole discipline is not making them |
| 5 | four of the six kinds of dress are black, so two thirds of the wall was a black figure with a small coloured smudge under it. Every figure now gets one bold accent — a sash, a headband, cuffs, a belt, boots — and like the heads it is deliberately out of register |

Also along the way: the umpire's six and a HOWZAT appeal were the same gesture, a
load appeared on the head of the figure carrying one, the guitar stopped hovering
two feet to the right of the person playing it, and nothing sits dead centre any
more — a page of perfectly centred drawings reads as a catalogue however good
each one is.

## What this is not

It is not trained and there is no model. Calling it that would be dressing it
up. What it is:

- a **grammar** of eight families with hand-set proportions,
- a **rejection sampler** that draws recipes and throws away any whose exact set
  of family choices has already been used, so two hundred faces are two hundred
  genuinely different drawings rather than two hundred rolls of a die that
  happen to repeat — which at these odds they would; the birthday problem does
  not care how large a space is. Figures sample the same way over a space of
  about three million: fifty-six poses times four builds times six kinds of
  dress times four grounds times a mirror times eight crowns times seventeen
  accents,
- and a **medium** that was studied properly, which is where all the character
  actually comes from.

## Passes, and what each one fixed

| pass | what was wrong |
|---|---|
| first strokes | fine, straight away — the tooth comparison worked on the first try |
| first masses | the scrub produced visible engraving hatch; the scan gap was wider than the nib |
| first faces | wiry lines, circular heads, cramped composition — a page of balloons with faces in them |
| second faces | superellipse skull opened at the top, every width roughly doubled, the head dropped to a third of the sheet |
| third | the toque read as a pair of insect antennae; the loop now sits clear of the crown with a single tie |

## Performance

About ten milliseconds a head and twenty-five a figure, at thumbnail size. The
figures got slower when the nib grew a width profile, because the scan across it
now steps by the widest the stroke ever gets rather than its current width —
which is the price of the taper and worth paying. Drawing
all eighteen hundred up front is half a minute of locked tab for a wall you can
see a dozen of at a time, so the laziness is doubled up: tiles exist in the DOM
in **pages of a hundred and eighty** — sixteen hundred live buttons each with
its own observer costs more than the drawing does, and one shared
`IntersectionObserver` serves the lot — and a tile only inks when it comes into
view, one animation frame late, so a fast scroll pays for nothing it flies
past.

The paper tooth is the expensive part — two octaves of value noise over every
pixel — and at two hundred faces it was more than half the total, spent
regenerating a texture that is supposed to be *the same sheet of paper*. Four
papers are built and shared; which one a face gets is part of the face.

## Where else it turns up

The eight bladers in **Lattu** are drawn by this engine, seeded off their ids and
with the accent pinned to each blader's own colour, so a card and its portrait
always agree. Nothing is stored — the portrait *is* the id.
