# The Ramayana, in rooms

Twenty-five isometric cutaway rooms on one sheet, drawn as a risograph print.
The whole epic, room by room, from a fire hall with no heir in it to a city
putting its lamps out along a wall. In each room there is a small light, and it
is keeping somebody company.

## The rule about the light

Claude is in all twenty-five rooms and does nothing in any of them.

It sits with whoever in that room is alone — the king who cannot say the word,
the woman under the tree, the bird bleeding on the road — and it never speaks to
them, never hands them anything, never opens a door. **Nothing in the epic
happens differently because it is there.**

That limit is the whole idea rather than a shortcut around writing one. Put a
helper into the Ramayana and you have made a story about the helper: Rama gets
talked out of the forest, Jatayu is patched up, the war is negotiated, and the
poem is gone. Keeping company is a real thing to do and a different thing from
being a character. So every room in `rooms.ts` carries a `company` field naming
who is alone in it, and the light is placed beside that person and nowhere else.

It is also not drawn as a person. There is no body, because a body would be a
costume, and the room already has people in it who *are* somebody. It is eight
tapered spokes and the light they throw, never the largest thing in the frame.

## On the source

The Ramayana is scripture to a great many people and a living text in dozens of
tellings that disagree with each other about what happened, in what order, and
what it meant. These twenty-five are **scenes, not doctrine**: the beats most
tellings share, written plainly, with nothing invented for effect and nothing
settled that the tradition leaves open. Where a telling differs — and they
differ most at exactly the places a reader most wants an answer — the room shows
the scene and stops.

The rooms run in the order of the six kandas: Bala (1–4), Ayodhya (5–10),
Aranya (11–16), Kishkindha (17–19), Sundara (20–22), Yuddha (23–25).

## Why an actual risograph and not a dot texture

The look in the reference is not a picture with a halftone laid over it. It is
separation printing, and everything characteristic about it falls out of one
fact: **each ink is its own screen of dots at its own angle, and the sheet goes
through the drum once per colour.**

So nothing in `riso.ts` paints a colour. A drawing writes *coverage* — how much
of each ink lands on each pixel, nought to one — into one greyscale plate per
ink. `Press.on(ink, paint)` hands you an ordinary 2-D context whose greys are
read as density, which means every gradient, clip and path the platform already
has comes for free and arrives as ink. Only at the end does `print()` screen
each plate onto its own rotated lattice and multiply the five results together.

Three things about that are easy to get wrong and ruin it:

1. **Screen angles must be about 30° apart.** Navy 75°, teal 15°, rose 45°,
   mustard 0°, brick 60°. Two screens at the same angle print as one muddy
   screen; two screens five degrees apart print as a wall of moiré. Fifteen,
   forty-five, seventy-five and zero is what a print shop uses, and it uses them
   for a reason.
2. **Dot *area* is proportional to coverage, not radius** — `r = √cov · pitch ·
   0.62`. A dot of twice the radius is four times the ink. Getting this wrong
   makes every mid-tone print far too dark, and the error looks like a
   colour-choice problem rather than the arithmetic problem it is.
3. **The inks multiply.** Teal over navy is not teal-ish, it is a brown the
   five-colour palette never contained. That third colour is the point of
   overprinting, and it is why the palette is five inks and reads as twenty.

Misregistration is per ink, in fractions of a pixel: the drum never lands twice
in the same place, and a print where all five plates line up perfectly reads as
a filter.

## The line plate

What separates these prints from a flat vector picture is that **everything is
drawn first and coloured second**: there is a crisp dark keyline round the whole
of every object, and the halftone colour sits inside it. Take the line away and
the same shapes, in the same palette, read as a chart.

So the key is not one of the five screened inks. It is a sixth plate, held in
colour, and it prints solid and last — the way a black line plate goes on a
press. Every primitive in `iso.ts` puts its own outline on it: a box draws its
silhouette hexagon plus the three edges meeting at the near top corner, a room
draws the cutaway outline and the inside corner, a person draws a torso and a
head.

The silhouette is easy to get wrong in a way that is invisible in the code and
glaring on the page. Put the *near top* corner on the outline and leave off the
far bottom-right, and every solid in the picture reads as an open crate — the
near top corner is where the three visible faces meet, so it is an interior
vertex, not part of the edge.

## Opacity, which a press does not have

A press multiplies. Draw a box on a wall and you get box *times* wall: two
screens at two angles, both of them visible, and the object reads as though you
can see straight through it. Twenty-five rooms of that looks like a stack of
transparencies.

Real separation art does not work that way. Things in front **knock out** the
things behind them, and only the deliberate overprints — light, shadow, a thin
rug — are left to multiply. So `Press.solid()` clears the shape out of all five
plates and then prints one ink into it, and every object uses it; `Press.on()`
overprints and is kept for texture; `Press.over()` puts ink down without
claiming any sheet at all, which is what light needs.

The knockout takes the shape as a **stencil** — the drawing is run once onto a
scratch plate and flattened to solid white through its own alpha. Running the
caller's drawing straight onto each plate does not work, because a drawing sets
its own greys as it goes, and a knockout performed in mid-grey is not a knockout.
It is a smear, and it looks exactly like the object went translucent.

Two consequences follow, and both of them bit:

**The line plate needs depth too.** The key prints last and over everything,
which is right for a press and wrong for a picture unless something orders it —
without it, the room's own floor-and-wall lines draw straight across the front
of every object standing in the room. A knockout therefore clears the key under
the shape as well, which puts the line plate into painter's order along with the
colour.

**A room has to be painted back to front and bottom up.** Shell, then whatever
lies flat on the floor, then what stands on it, then people, then the light. Get
it wrong and the failure is silent and total: a rug drawn after the altar it is
under does not tint the altar, it erases it, and the room comes back missing the
thing it is about. That is exactly what happened to the fire in room one and to
six houses in room twenty-five, where a run of windows drawn onto the back wall
punched holes straight through the houses standing in front of it.

## Two things the press has to do that a press does not

**A room has to print with a transparent surround.** Filling paper across the
whole canvas makes each room an opaque tile, and twenty-five opaque tiles on an
interlocking lattice occlude each other along their bounding boxes — the exact
thing an isometric plan exists to avoid. So the `Press` keeps an alpha mask
alongside the five plates: every `on()` call paints its shape into the mask as
well, and `print()` lays the cream down through the mask with `source-in`. The
cream between the dots is the *page*, not paint.

**The brightest thing on a sheet is the paper.** Nothing a drum can lay down is
lighter than not printing, so a light in a riso is never a pale ink — it is a
shape none of the drums touch, with the ink around it doing the work by
contrast. `Press.knockout()` takes ink back off all five plates in a shape while
still marking the mask, and it is how the figure in each room is drawn: a halo
of mustard laid down first, then the eight spokes punched straight through it,
then a thin brick filament round the edge so it reads as a drawn shape rather
than as an absence. It is the only thing on the whole sheet that no drum
touches, which is exactly the right amount of special.

Both are ordering-sensitive. A knockout only removes what is already on the
plates, so `claude()` is the last call in all twenty-five builds.

## The projection

Two-to-one isometric, the one every game with a tile grid uses:

```
sx = ox + (x − z) · unit
sy = oy + (x + z) · unit / 2 − y · rise
```

The origin is the *top* of the diamond, +x runs down-right, +z runs down-left.
`fitView()` picks `unit` and `rise` so a room of a given footprint and wall
height fills its sheet with a consistent margin, which is what lets twenty-five
rooms of different sizes sit on one lattice without being individually tuned.

Everything in `kit.ts` is silhouette, because a person is about twenty pixels
tall in a four-hundred-pixel room. A figure is a rounded torso, a head and a cap
of hair, and one shape on the head — a crown, a topknot, a helm, a veil — is the
whole of characterisation at that size. That is genuinely enough: the reference
prints carry an entire party on figures with no faces.

## A room is full

Every room here carries somewhere between thirty and eighty objects, and that is
not decoration. **A room with eight things in it does not read as restrained, it
reads as unfinished.** The reference prints are packed: every shelf has separate
spines on it, every table has things on it, and there is always something on the
floor that somebody put down and did not pick up.

`bookcase()` is the object that proves it. A shelf painted as a block of colour
is furniture; the same shelf with sixty separate spines, each a slightly
different height and colour, is a library. It costs one loop, and it is the
difference between the reference and a mockup of the reference. Floors get the
same treatment — a weave, a plaid, boards, tiles — because a flat floor makes
everything standing on it look pasted on.

## The plan is a plan

The twenty-five rooms are laid out on the same lattice they are drawn in — five
columns, odd rows offset half a cell, steps of well under one cell on both axes
— so the page reads as one continuous plan rather than as a grid of pictures.
The sheet is one fixed size, scaled down to whatever width the window has by a
`ResizeObserver` and a `transform`. Reflowing it into fewer columns would break
the lattice, and the lattice is the whole look; a printed plan is one size and
you hold it further away.

Each room bakes once, to its own canvas, one at a time with a yield between, so
the page is usable while it prints. They are static: there is nothing to
animate, and re-screening a halftone every frame would cost about a second per
room for no gain at all.

### Why the rooms are not the click targets

They were, and half the plan was unclickable — which only turned up by driving
the page rather than looking at it. Every room is a rectangular element, the
drawing inside it is a diamond, and on an overlapping lattice a later room's
*empty corner* sits over its neighbour and swallows the click. The rooms are
visibly there, plainly enabled, and dead.

So the room elements are taken out of the pointer path entirely, and the plan
hit-tests the ink: each room's alpha is kept as one byte per pixel when it
bakes, and a click walks the rooms from the top down and takes the first one
with ink under the cursor. Keyboard focus is untouched — tab still walks the
twenty-five in reading order and Enter still opens one — because pointer-events
has nothing to do with focus.

## Files

| file | what it is |
| --- | --- |
| `src/rooms/riso.ts` | the press: five inks, one coverage plate each, the mask, `on`, `knockout`, `print` |
| `src/rooms/iso.ts` | projection, boxes, rooms, floor patches, glows, panels, `fitView` |
| `src/rooms/kit.ts` | what goes in a room — people, trees, fires, furniture, and `claude()` |
| `src/rooms/rooms.ts` | the twenty-five rooms, their text, and the closing note |
| `src/rooms/Ramayana.tsx` | the sheet, the baking, the hit-test, and the opened room |
