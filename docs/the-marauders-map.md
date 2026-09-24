# The Marauder's Map

Blank parchment until you swear the oath. Then the school, then the whole
world, with everybody on it walking.

`public/marauder/index.html`, `public/marauder/marauder.js` and
`public/marauder/world.js`. Plain JavaScript: no libraries, no build step, no
image or audio files. It opens from a bare `file://` as well as from the shelf.

## What this is

**A fan work.** The school, its people and the map are J. K. Rowling's. What
is here is original: the drawing, every word written on the parchment, and
every sound. Nothing is quoted from the books — the cartouche is in the spirit
of the famous one and in none of its words — and nothing is traced from the
films. It is non-commercial and says whose world it is on the page.

It sits next to **The Nightwalkers' Map**, which is the same idea applied to a
castle of our own. That one stays as it is; this one is the thing it was
standing in for.

## Using it

1. **The packet.** A folded square of old parchment on a desk, blank. Type
   anything into the oath and it will answer — in the hand of whichever of the
   four makers is in the mood, signed. Swear that you are up to no good (any
   sentence with *swear* in it and *no good*, *mischief* or *up to* will do)
   and ink blooms out from the middle, running ahead of itself in fine
   tendrils, while the leaves unfold one after another on their creases.
2. **The school.** Eight panels: the towers with their spiral stairs, the hall
   and its four tables, the grand staircase, the dungeons, the kitchens, the
   forest, Hagrid's hut and pumpkins, the willow, the pitch, the lake and what
   lives in it, Hogsmeade and the Shack — and, dotted, the passages nobody
   else has on their map, lettered along their length. A room on the seventh
   floor comes and goes.
3. **The people.** Twenty-two of them, each a pair of inky feet and a ribbon
   with their name, walking the corridors by the shortest way. Friends walk in
   file behind whoever is leading; the cat walks *ahead* of the caretaker; the
   twins, and Harry with whoever is behind him, take the secret passages, and
   nobody else does. Click a name — on the map or in the list — to follow them.
4. **The world.** The second sheet, in the same hand: real coastlines and
   borders, water-lined in rings the way old charts are, a graticule, the
   tropics, a sea serpent, a ship, a dragon over Romania. The schools, the
   prison, the bank and the dragon reserve are marked with small red shields.
   A dozen travellers go from place to place: over land they walk, and over
   sea they Disapparate — a puff of ink, *crack!*, and a puff at the other end.
5. **Mischief managed.** The ink drains back to the middle and the leaves
   fold up in reverse order.

Drag to move, wheel or pinch to lean in, double-click to zoom, `+`/`−`, Esc to
close. `?sheet=world` opens straight onto the world.

## How it is made

**Two layers, cached.** Each sheet is drawn once into two offscreen canvases —
the paper and the ink — covering the viewport and a margin around it. Panning
inside the margin is a blit; the plates are redrawn only when the view leaves
them or the scale moves more than a couple of percent, and not while a finger
is still moving. Keeping paper and ink apart is what lets the ink be revealed
through a ragged, growing clip while the paper underneath is already there.

**A hand, not a font.** Every word on both sheets is written with the same
stroke-order letterforms as the rest of the Back Bench, through a broad nib:
each segment is as wide as a nib at a fixed angle looks from the direction it
travels. Every line is resampled and wobbled from a seed taken from its own
coordinates, so nothing crawls when the view moves.

**Water lines.** Stroke the coast wide, erase a narrower stroke out of it,
erase the land; repeat once per ring. What is left is a set of concentric
contours offshore and none on land, which is the whole look of an old chart.

**The world** is Natural Earth's 1:50m land and country borders (public
domain), simplified to a few tenths of a degree and stored as integers in
`world.js`. The projection is Kavrayskiy VII — a compromise projection with
round-shouldered edges, which suits a hand-drawn sheet much better than a
rectangle. Whether a traveller walks or Disapparates is decided by sampling
their leg against the land polygons: mostly sea, and they vanish.

**Routing.** The school's corridors are polylines; they are joined into a
graph wherever they meet and walked with Dijkstra. The secret passages are
edges only some walkers are allowed to use. Followers do not route at all:
they walk along their leader's own trail, a set distance behind.

**Sound, synthesised on the spot**: a paper rustle per leaf, a low chime and
shimmer as the ink blooms, a draining sigh when it closes, a quill scratch
under each rebuke, and a pop for each *crack*.

## What only showed up on screen

- **The world came out empty.** Douglas–Peucker was run on closed rings,
  whose first and last points are the same, so every point's distance to the
  "line" between them was a distance to a point, and simplification kept
  nothing. The rings are now split at their farthest point first.
- **Corridors ran straight through the rooms,** since they were lines between
  doorways drawn under the rooms. The ink of every corridor is now lifted
  back out of each room and tower before the room is drawn, so a corridor
  stops at the door.
- **People walked on the backs of leaves still unfolding** — drawn after the
  panels, so a leaf swinging over them could not cover them. They are now
  drawn panel by panel, only on panels that have finished opening, and before
  anything still moving over them.
- **The list of names sat on Hogsmeade.** The open view now fits the sheet
  into whatever the list leaves free.
- **The world's title covered Europe and the Arctic.** It is in the South
  Pacific now, where there is nothing to cover, and the ink under it is
  cleared first so no graticule runs through the lettering.
- **Footprints left trails like a caterpillar.** Sixteen prints that fade in
  about three seconds read as someone walking; forty that last seven read as
  a dotted line.
