# Notes from Under the Stairs: one joke, a thousand times

A thousand single-panel cartoons, generated. Every caption and every picture is
made at request time; nothing is written out and nothing is a file.

---

## One · What the joke is

Dostoevsky's comedy is not about death and it is not about cruelty. It is about
a particular failure of the self: a man does something, and then immediately
begins performing his own reaction to it for an audience of one.

The confession that wants applause. The generosity that follows the beggar for
six streets to see what he does with the money. The two-year campaign of revenge
for a slight the other man never noticed and would not remember. The man who
refuses help kindly offered, because being helped is the intolerable part.

That is the joke, and it is the same joke every time, which is exactly why a
thousand of them works. What varies is the angle.

## Two · Why a grammar and not a list

A thousand written jokes would be a thousand jokes. A thousand *generated* jokes
are only funny if the generator knows what a joke is — so nothing here fills
blanks in a sentence.

Each of the fifty templates is a **mechanism**: a reversal, an escalation, a
category error, a confession that is really a request. The vocabularies supply
the specifics that the mechanism then does something to. Swap a noun and the
joke survives; swap the mechanism and it is a different joke. That is the test a
joke grammar has to pass, and it is the one most of them fail.

```ts
{ kind: 'charity', make: (r) => [
  `He gave away ${pick(SUM, r)}, ${pick(PLACE, r)}, this morning, which is more than he had.`,
  'He followed the man for six streets to see what he would spend it on.',
] },
```

Two formal rules, and neither is negotiable:

- **The turn lands on the last clause.** A punchline in the middle of a sentence
  is a fact.
- **Every template takes at least one slot.** A template with none can only ever
  be one joke, and forty of those is forty jokes and nine hundred and sixty
  repeats. That was the first version, and counting the unique outputs is what
  found it.

### The frames have to hold every word you put in them

The vocabularies are the part that goes wrong quietly. The first `SPAN` list
mixed lengths of time with points in time — `'two years'` next to ``'since the
business with the coat'`` — and the frame `` `describing it takes ${SPAN}` ``
happily produced *"describing it takes since the business with the coat"*. A
joke with a broken sentence in it is not a joke, it is a fault, and it will not
show up in a screenshot of a hundred thumbnails.

So the lists are shaped by the frames that use them, and the frames by the
lists:

- **`SPAN` is durations only**, because every frame it appears in reads
  `for ___`, `takes ___`, `overdue by ___`. Points in time went to a separate
  `SINCE`, which is only ever preceded by "as of" or "ever since".
- **A phrase with a comma in it needs the sentence to close it.** `'a mirror he
  has turned to the wall, twice'` dropped into `` `pawned ${OBJECT} for ${SUM}` ``
  gives "pawned a mirror he has turned to the wall, twice for four roubles". The
  frames now punctuate for it: `` `pawned ${OBJECT}, for ${SUM}.` ``
- **A genitive needs a name short enough to own something.** "A man who was kind
  to him in 1846's" is not a phrase, so the two templates that need one draw
  from `HOST` instead of `OTHER`.

The way to find these is to print sixty finished captions and read them. There
is no substitute and no shortcut.

Asked for four thousand, the grammar returns four thousand distinct captions.
The thousand it ships are deduplicated on the finished text, because a grammar
with fifty templates and ten vocabularies will collide long before it reaches
a thousand and the only honest way to find out is to check.

## Three · The picture is never the punchline

A single-panel cartoon is two things in a fixed relationship: a picture that is
*not* the joke, and a caption that is. Draw the turn and the caption becomes a
label and the whole thing dies.

So the picture is always the **situation** — a man in a room, a man at a desk, a
man on a staircase in a building he is about to leave with dignity. The turn
happens in the italic line underneath and nowhere else.

The setup is roman and the turn is italic, which is the oldest way there is of
telling a reader where to slow down. The caption is *set*, not drawn: everything
else on the panel is pen work, and faking type with pen strokes would be a worse
lie than using the type. The rule above it is drawn, though, and it wobbles,
because the rule is part of the plate.

## Four · Spot black, and one warm light

The cards next door are pure outline on cream, so this deliberately is not.
These are filled black silhouettes on grey paper, with exactly one accent
colour — ochre — which is only ever *light*: a lamp, a candle, somebody else's
evening through a window. Nothing else on the panel is warm, which is why the
warmth reads.

A man drawn as an outline is a character in a story. A man drawn as a filled
silhouette with a lamp behind him is a man in a city at four in the afternoon in
December, and half the joke is done before the caption arrives.

### The figure

The first version was a filled bell with a hat on it and it read as a mushroom.
What was missing was everything that makes a silhouette a *person*: boots under
the hem, a neck, a head with a face-side, and a coat that flares by about half
again from the shoulder rather than by double. At double it is a cone.

The collar was the other one. Turned up and splayed at the shoulder it reads as
a pair of horns — which, once seen, is difficult to unsee. It now rises beside
the neck towards the ear, close in, which is what a collar does.

Two more of the same kind, both found by looking at a contact sheet rather than
at the code. The boots stopped at a fixed height while the hem was set from the
coat length, so every long coat left a strip of paper between hem and boot and a
man standing an inch above his own feet. They are now drawn up past the hem and
the coat goes over them. And the hat sat at 1.0 of the figure's height while the
crown of the skull is at 0.972 — a top hat hovering, very slightly, over a man's
head. Every band is now set from the brow.

Everything else about him comes from the seed: coat length, hat (top, cap, fur
or none), how far he is stooped, collar up or not, scarf or not, and how tall he
is.

### The camera

Nine settings — room, table, desk, street, door, stairs, bridge, corridor,
garret — and each mechanism can be set in two or three of them. Twelve
mechanisms with one room each is twelve pictures repeated eighty-three times,
and no amount of jitter fixes that.

Then four numbers decided per panel: how high the horizon sits, how big the
figure is against it, where in the frame he stands, and which way he faces. Those
do more for the variety of a thousand panels than any amount of extra furniture.
A man small in a big room is a different joke from the same man filling the
frame, and both are the right joke sometimes.

A table is the one thing in this set the man is *behind*, and painting the room
in one pass before him put him on top of the tabletop with his legs cut off at
the knee by a black slab. The wall goes down, then the man, then the table over
him — which is also the order you would see them in. Where he stands is worked
back from where his coat has to *end*, a little below the surface, because a
seated figure's hem is a fraction of his own height and that height varies: a
fixed offset leaves the tall ones hovering over the desk.

The staging has a veto for the same reason. A seated man is drawn from the waist
up with nothing under him, which is only right if there is a table in front of
him; the mechanism proposes a stance and the room overrules it, or you get a man
sitting in mid-air over the Neva, thinking.

The corridor was worth getting right and worth getting wrong first. Drawn as two
independent converging wall pairs — which is the obvious way — it produces a
large X and no corridor. Drawn the way a one-point corridor is actually drawn —
a small rectangle at the far end and four lines to the corners of the frame — it
is a corridor immediately, and the door at the end can have somebody else's
light behind it.

## Five · What it costs

The panels are baked into ten atlases of a hundred each, yielding every five
panels so the loader stays a thing you can watch rather than a frozen picture of
one.

The paper was most of the bake. Nine hundred fibre flecks per sheet is
reasonable on a print and absurd on a hundred-and-sixty-pixel thumbnail — nine
hundred marks nobody will ever see, times a thousand. The count now follows the
size of the sheet.

Every timing this document could quote was measured on a software rasteriser in
a container and says nothing about real hardware.

## Files

| file | what |
| --- | --- |
| `joke.ts` | fifty mechanisms, ten vocabularies, and the deduplicating generator |
| `scene.ts` | the figure, nine settings, and the props and weather in them |
| `panel.ts` | which room a mechanism gets, the camera, and the typeset caption |
| `plates.ts` | the atlas bake and the print-size redraw |
