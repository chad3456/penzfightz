# The Smoking Area

One issue, six pages, thirty-four panels, drawn in pencil.

Gareth is thirty-two and sells extended warranties on kitchen appliances. The
one good part of his day is ten minutes in the gap between the bottle bank and
the wall, with a woman who is easy to talk to. She served him at the till twenty
minutes earlier. He has never once recognised her.

## What the story is about

The mix-up is the engine, not the point.

The point is that he is invisible at work and cannot see that he does exactly
the same thing to her. The alley is the one place either of them is a person,
and he thinks he is the only one who needed it — which is why the last thing she
says to him is "same", and why it does not land on him at all.

So **the reader is told on page two**, in a panel he is not in: her badge, with
her name on it, three panels before the alley ever happens. From there the
reader knows something he does not, for four pages. **Nothing is ever revealed
to him.** A reveal would turn this into a story about a misunderstanding, and it
is not one; the last caption says where the badge is pinned and how far below
that his eyes stop, and then the issue ends.

## Why nothing is stroked

Same rule as the sketchbook, and for the same reason. `ctx.stroke()` lays down a
band of uniform darkness with two clean edges, and graphite does neither of
those things, so every mark on every page is a run of small deposits along a
path: tooth that flickers at a finer scale than the line, pressure that sets
width and darkness together and ramps in and out, two to four passes that nearly
agree, and overshoot at the corners. The panel borders are drawn the same way,
which is most of why the page reads as a page rather than as a layout.

## What had to be fixed once it was on screen

Four things, none of which were visible in the code.

**The backgrounds looked missing rather than faint.** The far and mid pencil
grades were pitched about a third too light — the brick courses in the alley,
the hatching on the bottle bank and the wash on the office walls were all
present, all drawn, and all invisible at panel size. Pencil that reads fine at
full size disappears in a two-inch panel, so the far grade has to be a grade you
can actually see rather than one that is technically there.

**Figures at a distance were headless torsos.** Below about twenty-five pixels
the full face machinery draws brows, lashes and a mouth inside three or four
pixels each, and they average out to a pale smudge. Small figures now get a
silhouette head instead — skull, jaw, hair mass, two marks for eyes — built off
the same character record the close-ups use, so the man at a desk across the
room is the same man as the close-up in the next panel.

**Figures hung in the air.** Every one now gets a hatched patch under the feet.
The problem never looks like a missing shadow; it looks like a bad drawing.

**Brick read as graph paper.** Courses and perpends were drawn at the same
weight and the same spacing. Real brick reads because the courses dominate; the
perpends are now lighter, sparser and inset from the course lines.

And one that is a layout problem rather than a drawing one: a balloon placed at
the bottom of a close-up panel lands on the mouth it is coming out of. A
close-up head fills the middle of its panel, so the only free paper is the upper
right, and that is where the balloons go.

## The reader

One page at a time, because that is how a comic is read. Each page is a few
thousand graphite deposits and takes the better part of a second, so pages are
baked once to their own canvas and kept, with the baking running ahead of the
reader in page order so page one is on screen while the rest are still printing.

The page is sized off the stage element rather than off the window minus a guess
at the height of the chrome. The guess was out by about forty pixels, the page
hung over the page strip below it, and the strip was then visible, enabled and
unclickable — the canvas was eating the clicks. The stage is a flex child with
`min-height: 0` and `overflow: hidden`, so its height is the space left over and
does not depend on what goes in it.

## On the two of them

Both are original. They are built on the same set of knobs as the sketchbook
cast, pushed to read as adults rather than students — a longer face and smaller
eyes set lower, which is the strongest age cue in this idiom.

The difference between them is loaded onto the silhouette, because they have to
be told apart at the size of a thumb: his hair is flat and receding at the
temples, hers is up for work and down afterwards. That is the whole plot, and it
is also why `ROSA_AT_WORK` is not a different character — it is her with the
hair up, and it is the only thing that changes. If it were a different design
the story would be a cheat: the reader has to be able to see that it is
obviously her, and to believe that he does not.

## Files

| file | what it is |
| --- | --- |
| `src/effects/comic/cast.ts` | Gareth and Rosa, and Rosa with her hair up |
| `src/effects/comic/script.ts` | the issue: six pages, their panels, captions and balloons |
| `src/effects/comic/stage.ts` | the places and the figures — one function per kind of shot |
| `src/effects/comic/page.ts` | panels, borders, balloons, tails, hand lettering, captions |
| `src/effects/comic/Comic.tsx` | the reader |
