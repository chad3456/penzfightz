# The stall's flower

Every bill printed by The Book Stall carries a rosette — a ring of leaves, each
curling into a spiral at its outer end. It is the kind of woodblock ornament
Indian job presses kept on a stick of type and stamped into anything that
needed filling: a printer's flower, never quite cleanly inked.

There is no image file. Each one is built from the quote's own id, so a line
always prints the same flower and no two lines print the same one.

## The shape

One leaf, repeated around a circle:

- a **spine** from the eye of the flower out to the rim, leaning off true
  radial by a fixed sweep — that lean is what makes the whole thing read as a
  pinwheel rather than a daisy
- two **edges** offset either side of the spine, widest around two-thirds out
  and meeting at both ends. The inner edge stops a little short, leaving the
  leaf open at the top the way the reference is
- a **volute** continuing from the outer edge: a logarithmic spiral of about
  1.5 turns, its eye set square to the leaf so it sits beside the tip rather
  than beyond it. How fast it tightens is the difference between an ornament
  and a mess — a gentle taper winds a doughnut, too steep a one collapses into
  a blunt scoop after a quarter turn, and only a narrow band between them
  closes on a visible eye. It was settled by rendering the candidates side by
  side rather than by argument
- a **knot** of short overlapping strokes in the middle, where the block was
  cut deepest and held the most ink

Leaves also carry a small per-leaf wobble in angle, length, width and coil, so
the ring is not perfectly regular. Without it the thing reads as a machined
daisy rather than something somebody cut.

Leaf width and spiral diameter are both fractions of the **gap between one leaf
and the next at the rim**, not of the flower. That is the one decision that
makes the rest work: petal count can vary from nine to thirteen and the spirals
still sit shoulder to shoulder instead of colliding or rattling around. The
finished flower is then scaled to what it actually spans, so a wide-spiralled
one and a tight one print the same size.

## The ink

The outline is never stroked. It is walked in half-pixel steps and stamped as
several thousand small discs, each jittered off the line, with the odd speck
thrown clear of it. Whether a step prints at all is decided by three scales of
smooth noise multiplied together:

| scale | wavelength | what it does |
| --- | --- | --- |
| 0.09 | ~11px | a dry patch a few millimetres across |
| 0.5 | ~2px | flicker along the stroke |
| 1.8 | sub-pixel | grain between one dot and the next |

**Keeping the longest of those well under the length of a stroke matters.** The
first version used a wavelength of about 650 dots, longer than a leaf edge, and
whole leaves would land in a single dry trough and vanish — one flower in twelve
came out as a bare centre with hooks floating around it. It looked like a
geometry bug and was not one.

## Checks

`specFor` is deterministic, so the whole set can be rendered and measured. Over all forty
quote ids, at the size the bill prints them and again half as large again:

| | at 104px | at 160px |
| --- | --- | --- |
| ink coverage | 2,833–4,718 px | 6,444–10,534 px |
| bounding box | 178–192 × 170–189 | 275–296 × 261–291 |
| blank or washed out | 0 | 0 |
| clipped by the canvas | 0 | 0 |
| distinct signatures | 40/40 | 40/40 |

Petal counts spread across 10, 11, 12 and 13. Normalising each flower to what
it actually spans, rather than to the unit circle, holds the printed size to
about ±4% across the set instead of ±7%.

About 12ms to stamp one at 130px, drawn once when the bill prints.
