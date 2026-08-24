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
  1.3 turns, its eye set square to the leaf so it sits beside the tip rather
  than beyond it
- a **knot** of short overlapping strokes in the middle, where the block was
  cut deepest and held the most ink

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

`specFor` is deterministic, so the whole set can be rendered and measured. Over
all forty quote ids at 120px, drawn at device ratio 2:

- ink coverage 4,482–9,542 px, no blanks and nothing washed out
- bounding box 204–222px inside a 240px canvas — nothing clipped, and after
  normalising the size the spread is about ±2% rather than ±7%
- 40 distinct signatures from 40 ids
- petal counts spread across 9, 10, 11, 12, 13

About 12ms to stamp one at 130px, drawn once when the bill prints.
