# Sasaki & Tayama

Two anime characters, fifty named expressions each, drawn in pencil. Black and
white, on paper. A hundred cards, arranged so every expression appears twice —
once on each of them, one place apart.

## On whose faces these are

There is no reference art for either of them in this repository and none
reachable from it, so nothing here reproduces an existing design. These are two
original characters built to be told apart, wearing the names they were asked
for. If a specific published pair was meant, this will not look like them, and
that is better known before than after.

## What makes two anime faces read as two people

Not the expression — that is the other axis entirely, and a character who is
only recognisable when smiling is not recognisable. It is the constant part:
the length of the jaw, how wide and how round the eye is, where the brow sits at
rest, and above all the hair, which is what a viewer actually uses at a glance.

- **Sasaki** — long jaw, low heavy brows, narrow eyes with a hard outer corner,
  and a spiky fringe parted well off centre.
- **Tayama** — a shorter, rounder face, eyes a size larger and kept round, fine
  brows set high, and a neat dense fringe.

The pairing is the point. A hundred expressions split fifty-fifty would pack in
more variety and would be the wrong choice: you cannot compare two faces that
are never pulling the same face, and the constant part of a design is only
visible when the variable part is held still.

## Why nothing is stroked

`ctx.stroke()` lays down a band of uniform darkness with two clean edges, and
graphite does neither of those things. No amount of styling a stroked path
fixes that, because the primitive is wrong. So every mark here is a run of
small round deposits along a path, and six properties of that run are what make
it read as a pencil:

1. **Tooth.** Paper is not flat. Graphite catches the raised grain and skips the
   pits, so darkness along a line flickers at a much finer scale than the line
   itself. This is the single biggest tell — without it the mark reads as ink
   however soft its edges are.
2. **Pressure sets darkness and width together.** Change one without the other
   and you have drawn a brush.
3. **The hand arrives and leaves.** Pressure ramps in and out, so a stroke is
   palest at both ends. Constant weight end to end is the signature of a machine.
4. **Nothing is drawn once.** A sketched contour is two to four passes that
   nearly coincide and disagree by a fraction of a millimetre. The disagreement
   is the drawing.
5. **Lines overshoot.** A hand travelling fast does not stop dead at a corner.
6. **The construction stays.** The circle the head was built on is still there
   under the face. Erasing it would be tidier and would stop the picture reading
   as a sketch at all.

Shading is hatching, never a fill, for the same reason: real pencil tone is
directional, and the direction is a decision the hand made. Even the highlight
in the eye is bare paper rather than white paint, because that is the only way
a pencil can make one.

## Why the expressions are named

The lazy way to get a hundred faces is to jitter a few numbers, and it fails for
a reason worth stating. A face is not a random point in parameter space.
Expressions are a small structured set of muscle actions and a viewer reads them
*categorically*: a brow raised at the inner end is grief, the same brow raised
at the outer end is scepticism, and halfway between them is not half as sad — it
is nothing at all.

So each of the hundred is a named expression first and a set of numbers second,
and the numbers were chosen to produce that name. That is also what makes them
tell apart at thumbnail size: they differ along the axes a face actually uses
rather than along all of them at once.

Ten families, five expressions from each: joy, sorrow, anger, fear, surprise,
disdain, tender, thought, exhaustion, unhinged.

## What the renders caught

Every one of these was invisible in the code and obvious in a picture.

- **The jaw drew a V across the face.** Canvas runs +y downward, so `sin` is
  positive *below* centre: the arc that is "over the top of the head" in
  ordinary maths is the one under the chin. The cranium was being traced along
  the bottom of the skull and a jaw hung off it.
- **The mouth and nose were drawn on the bridge of the nose.** `chin` was a
  length below centre and three of the five places that read it treated it as a
  position, so `eyeY + (chin - eyeY) * 0.56` evaluated to a point *above* the
  eyes. The small hatched disc between the eyes was the mouth.
- **The fringe was a palm frond.** Its strands fanned out from a narrow band at
  the crown, and travelled about a fifth of a radius before stopping — a row of
  ticks on top of the head above an enormous bare forehead. Hair hangs, and only
  leans on the way down.
- **The grief brow was behind the hair.** A raised inner brow lifts above the
  fringe line, so the single most informative feature on a crying face was drawn
  underneath the hair and hidden. Anime draws brows over the fringe, and this is
  why.
- **Forty faces looked like the same blank stare.** The mouth carries half the
  reading and was being drawn at a fraction of the weight of the eyes.
- **The despair shadow fell as rain.** Sixteen vertical lines across a face is a
  picket fence, and the gaps grew with the drawing; it also ran down through the
  eyes instead of stopping above them, so it hung in front of the face rather
  than lying on it.
- **Tears left the face.** At full length the streak ran a whole radius below the
  eye, which is past the chin, leaving two small circles hanging in the air.

## What the second pass caught

Parameterising one face into two found three more, all of them the same kind of
mistake — a number that was fine as a constant and wrong as a ratio.

- **The jaw became a box.** The new taper scaled the jaw's width *up* from the
  cheekbone instead of down, so the first control point below the cheek was
  wider than the cheek itself and the chin came out flat-bottomed.
- **The fringe was cut against the brow**, so it inherited each character's brow
  height: Tayama's high brows dragged the fringe up to a travel of about a third
  of a radius and left a bare band of forehead under a row of ticks.
- **Then it was cut against a multiple of eye height**, which is backwards —
  the larger the eyes, the higher the fringe. It is cut to clear the eyes, so
  the eye's top edge is what it has to be measured from.

And one that no render could have shown: the character bar and the family bar
were positioned independently, and the family row — which wraps to two lines at
most widths — grew upward through the character row and swallowed its clicks.
The buttons were visible, enabled, and completely unusable. Only driving them
found it.

## Reading the page

Three character buttons and ten family buttons, which combine. **Draw them again** re-runs the same
hundred expressions with a different hand — the expression is the same, the
sketch of it is not. Clicking a face opens it drawn again at size rather than an
atlas cell scaled up, with arrow keys to walk the set.
