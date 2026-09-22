# The landing page

A personal site, with a month of work drawn on it as what it actually is.

## Why it is not a grid of cards

Thirty-six cards in a grid says these things are a list. They are not a list.
Half of them are ink and half are polygons, a third are games and the rest are
pictures, and no two look remotely alike. What actually connects them is that
the same dozen or so engines keep turning up underneath — a risograph press, a
graphite deposit, a hand that writes rather than sets, one castle's plan used
twice, once in bricks and once in ink.

That is a graph, so the page draws one. Filled discs are pieces, in their own
colour, and open when clicked. Hollow rings are machinery: not things you can
open, but things several of the things you can open are made out of. Every
line is a real import.

**The edges were read off the source, not off memory.** One of them was wrong
when I did it from memory.

## Why it settles and then stops

The layout runs to convergence once, synchronously, from a seeded start, while
the page is still fading in. Fifty nodes is twelve hundred pairs; six hundred
iterations of that is about a million distance calculations and a handful of
milliseconds. There is no case for a quadtree at this size and every case
against the extra code.

Settling once and stopping matters more than the speed. A force graph left
running is a lava lamp: it never holds still long enough to be read, and every
visit gives you a different drawing of the same fact. This one is the same
picture every time, so it can be designed against.

## Three things the layout had to learn

**Clearance is an ellipse, not a circle.** A node is eleven pixels across and
its title is a hundred and forty, so the thing two of them collide with is
almost never the other disc — it is the other disc's *name*. Repelling on the
radius alone left the middle of the picture, where the press and the pad and
the ink all sit, as five overlapping captions.

**A hub needs a ring big enough to hang its children's names round.** With
every spring the same length, the press put eleven titles on a circle with
room for four. The rest length of an edge is now set by how busy the busier
end of it is, which is the same arithmetic as asking how long a circumference
has to be to take eleven labels.

**Fourteen engine labels on top of thirty-six titles is more lettering than
the box holds.** The seven engines that carry only two pieces each were
exactly the ones sitting on somebody's name. The busy ones stay labelled,
because they are the argument the picture is making; the quiet ones give their
name up when you point at them.

## A piece that shares nothing is still part of the work

Six or seven import nothing anybody else imports — the water, the dragon, the
frieze. Left unattached they drift to the edge of the canvas and sit there
looking like errors. They are chained to their neighbours in time instead,
which is a true relation: made the same week, out of the same argument.

## What is redrawn, and what is not

The picture costs about forty milliseconds — sixty wandering ink edges and
thirty-six hand-lettered titles, none of them stroked. So it is cached, and
redrawn only when the window changes size or the thing under the pointer
changes. Over the top goes a soft light that follows the cursor and a ring
round whatever it is over, which is enough to keep the page alive without
touching the expensive part.

## The masthead

My name is a canvas, not a heading, because there is no typeface in here that
would be honest — everything else on the site is drawn at run time, and a
masthead in a web font would be the one thing on the page that came out of a
box. It uses the same letterforms as every other hand on the site: stored as
the strokes a hand makes, in the order a hand makes them, seeded from each
letter's position so no two es match. It wipes on left to right, the way a
name gets written.

The `<h1>` is still there underneath, for anything that reads rather than
looks.

## The index

Everything again, in the order it was made, because a constellation is for
seeing the shape and a list is for finding a particular thing. The dates come
from `git log --diff-filter=A` on each folder, so they are the day the piece
started rather than the day it was any good. Hovering a row lights its node
in the drawing above.

## The plain shelf is still there

The older two-tab shelf of cards is one click away in the footer, and is
genuinely the faster way in when you already know what you came for.
