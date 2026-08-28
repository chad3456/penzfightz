# Two Crayons: two hundred faces, one black stick and one coloured one

## The constraint is the idea

Two sticks, rough paper, and not many marks. Everything interesting about the
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

## What this is not

It is not trained and there is no model. Calling it that would be dressing it
up. What it is:

- a **grammar** of eight families with hand-set proportions,
- a **rejection sampler** that draws recipes and throws away any whose exact set
  of family choices has already been used, so two hundred faces are two hundred
  genuinely different drawings rather than two hundred rolls of a die that
  happen to repeat — which at these odds they would; the birthday problem does
  not care how large a space is,
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

About ten milliseconds a face at thumbnail size. Drawing all two hundred up
front is two seconds of locked tab for a wall you can see a dozen of at a time,
so tiles render as they scroll into view, one animation frame apart, and a fast
scroll pays for nothing it flies past.

The paper tooth is the expensive part — two octaves of value noise over every
pixel — and at two hundred faces it was more than half the total, spent
regenerating a texture that is supposed to be *the same sheet of paper*. Four
papers are built and shared; which one a face gets is part of the face.

## Where else it turns up

The eight bladers in **Lattu** are drawn by this engine, seeded off their ids and
with the accent pinned to each blader's own colour, so a card and its portrait
always agree. Nothing is stored — the portrait *is* the id.
