# The Nightwalkers' Map

A survey of Hallowdene in pen and ink, on parchment, that knows who is
standing on it.

## What it is, and what it is not

The artefact is an old idea and a good one: a plan of a building that is blank
until you say the right thing to it, and that then shows you not only the
rooms but everybody in them, moving, by name.

**Hogwarts, the Marauder's Map and the four names on it are J.K. Rowling's
work.** The castle's layout, its room names, the map's own two incantations
and the students who made it are hers, and none of them is here. This is a map
of **Hallowdene** — the castle the `castle/` effect builds in bricks — with
rooms named for what they are, two incantations of our own, and four invented
students in the cartouche.

## The same building, twice

`nightwalkers/plan.ts` is written in the same coordinates as
`castle/plan.ts`: x east, z north, one unit is one stud. The great hall is at
x −34…20 on the map because it is at x −34…20 in the model.

That is not tidiness, it is the feature. Standing anywhere on the sheet, *look
at it from here* opens the brick castle at whichever of its seven vantages is
nearest the point you are standing on — and because the two files agree, that
is three lines of arithmetic rather than a lookup table somebody has to keep
in step.

## Two layers, drawn and walked

**`PIECES`** is what gets drawn: walls, towers, the two rocks, the water, the
wood, the bridge. **`WAYS`** is what gets walked: centrelines down corridors
and across rooms, from which the graph is generated — sampled every three
studs, consecutive samples linked, and samples from *different* ways linked
when they land within three and a half studs of each other.

Keeping them apart is what stops the building from being wrong. A corridor
drawn as a pair of walls and a corridor walked as a line down the middle want
completely different data, and hand-listing the junctions — which was the
first version — meant that every time a corridor moved two studs the castle
quietly acquired a room nobody could reach.

## Ink

Every line on the sheet is drawn with a nib rather than stroked. The path is
resampled, every sample is pushed sideways along its own normal by a slow
wave, and the result is drawn in short segments whose width breathes. A pen
wanders, varies, and pools a little where it turns; of the three the wander
matters most, because one perfectly straight line on a piece of parchment
reads as printing and takes the whole sheet down with it.

The **poché** — the forty-five-degree hatching that fills the thickness of a
wall — is the exception. It is ruled, not drawn, because there are about a
hundred lines per wall and a wobbling nib through every one of them costs a
third of a second a plate for a difference nobody can see.

The **lettering** is the hand from `claudddy/hand.ts`: letterforms stored as
the strokes a hand makes, in the order a hand makes them, seeded from the
letter's position in the line so no two 'e's on the sheet are the same 'e'.
Here they are drawn with the ink nib instead of with graphite, which is the
same relationship a pencil note has to a fair copy.

## The split that makes it run

Walls, water, the wood, the lettering, the compass, the scale bar and the
cartouche are drawn **once** into a pair of offscreen canvases covering rather
more than the window, and then blitted. Only the people are redrawn each
frame. Sixty frames a second, with two dozen walkers and their trails.

There are two offscreen canvases rather than one because the sheet starts
blank: the parchment and what is written on it have to be separable, so the
reveal is a clip on the second blit and nothing else. No mask buffer, no
per-pixel work, and the paper underneath is the same paper before and after —
which it would not be if the blank sheet were drawn by a different code path.

The ink arrives as a **ragged expanding disc** clipped around the second blit.
Ink spreading into parchment has a hard ragged edge and not a soft one, so
that is a clip and not a gradient.

## The people

Two dozen invented names walk the graph: pick somewhere at least eighteen
studs away, route to it, stand about for a few seconds, pick again. That is
the whole behaviour, and it is enough — what makes the sheet feel inhabited is
not clever routing, it is two names you were not watching ending up in the
same corridor while you were looking somewhere else.

Each one is a standing pair of footprints and a name on a hairline leader, and
leaves prints behind that fade over eight and a half seconds.

## Four things that were wrong

**Every room was filled in solid.** The poché band is described as the outer
figure followed by the inner one, both wound the same way, so under the
default non-zero fill rule the hole is not a hole and the clip is just the
outer figure. It needed `clip('evenodd')`, and what the missing argument
looked like was not a missing argument — it looked like a drawing mistake.

**All three secret passages were found before the ink finished spreading.**
Ordinary walkers were excluded from *standing* on a passage but not from
*routing through* one, and the shortest way across the castle is very often
the passage. A corridor everybody uses is not a secret. `route()` now takes a
blocked set, and only you are allowed down them.

**The names were a word search.** Four people standing together in the
cloister came out as WinifredLoomBarnabyMilne. Each name now takes a box and a
box that lands on one already taken is lifted a line and tried again, three
times, and then the name is left off — because a name that cannot be read is
worse than a pair of feet with no name at all. You always get yours.

**The lettering grew without limit.** Lean all the way in on the hall and 'The
Great Hall' was four hundred pixels tall and the room it named had gone. A
label on a real sheet is a fixed size in ink, so past a certain zoom these
stop growing and the building grows past them.
