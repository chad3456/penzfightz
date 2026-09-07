# Set in Jelly

*A full chess set turned out of jelly — lemon against blackcurrant — and the whole of the rules underneath it.*

---

## One · Prove the rules before drawing anything

A chess program that looks right is not the same as one that is right. The
failure modes are all in the corners: castling out of check, castling *through*
check, en passant that was legal one move ago and is not now, a pin that is only
a pin because of where the king is, a rook capture that removes the castling
right of the side being captured.

So the move generator was tested first, by counting. **Perft** walks the tree to
a given depth and counts leaves, and the counts for the standard test positions
are published to the node. All six match exactly:

| position | 1 | 2 | 3 | 4 |
| --- | --- | --- | --- | --- |
| initial | 20 | 400 | 8,902 | 197,281 |
| Kiwipete | 48 | 2,039 | 97,862 | |
| position 3 | 14 | 191 | 2,812 | 43,238 |
| position 4 | 6 | 264 | 9,467 | |
| position 5 | 44 | 1,486 | 62,379 | |
| position 6 | 46 | 2,079 | 89,890 | |

If any of those numbers is off by one, something is wrong somewhere, and the
count tells you at which depth to start looking. Nothing else about a chess
program gives you that.

The generator itself is deliberately the slow, correct kind: pseudo-legal moves,
then play each one and ask whether the mover is now in check. That cannot be
wrong about pins or discovered checks, because it does not reason about them.

Two details worth stating because they are easy to get wrong:

- **The board is a flat 64 and the edge is watched by file, not by masking.** A
  rook on h4 stepping +1 lands on a5, and a generator that only checks
  `0 ≤ i < 64` will happily let it carry on down the next rank.
- **The repetition key is placement, side, castling rights and the en-passant
  square** — the four things the rule actually names. Put the move counters in
  it and no position ever repeats.

## Two · The men

A turned chess piece is a profile spun about its axis, so five of the six are a
`LatheGeometry` and nothing else: the shape lives entirely in a list of radii.
The profile has to start and finish *on* the axis, or the solid is a tube with
an open top and bottom — which in a transmissive material is not a subtle
mistake, because you see straight down the inside of it.

Everything that is not a surface of revolution — the rook's crenellations, the
queen's coronet, the king's cross, the whole of the knight — is built separately
and **merged into one geometry**. Left as separate meshes, each part would be
refracted on its own and the joins would show as seams inside the jelly.
`mergeGeometries` refuses a set where some parts carry an index attribute and
some do not, and three.js is not consistent about that: lathes, spheres and
boxes come out indexed and extrusions do not. Flattening them all first is the
one line that makes the whole assembly work.

**The knight is an explicit outline, not a run of beziers.** Beziers are how you
would draw a horse's head by hand and they are also how you get a shard: one
control point out of place and the curve loops back through the shape, and
`ExtrudeGeometry` will build the self-intersecting result without complaint. A
dense list of points can be checked by reading it, and the bevel does the
smoothing.

And it is left facing **across** the board rather than up it. Turned to face the
opponent, a knight is edge-on to both players and reads as a slab; in profile it
is the one piece nobody has to think about. White's face one way and Black's the
other, which is the mirroring a real set has anyway.

## Three · The jelly

Same material as the dice, with one thing that could not be shared: **thickness
is per piece.** A die is a solid inch of jelly in every direction and a pawn's
neck is a few millimetres, so a thickness chosen for the die makes the small
pieces read as black glass. Each piece passes its own height in.

The room is the dice's room, unchanged — broad dim sources so a flat surface
does not mirror a light panel and clip, plus two small hot ones so a refracting
body has something to refract — and the floor still does not receive the shadow.
A catcher above it does, because an image-based light is not shadowed by
anything and a directional strong enough to print a real shadow would blow the
jelly out.

## Four · Playing it

**A king is one and a half squares tall, and a piece hides the square behind it
by its height over the tangent of the camera pitch.** At the fifty degrees a
photograph of a chess set is taken from, White's own back rank covers the whole
of the pawn rank in front of it and you cannot click your own e-pawn. The camera
sits at fifty-eight degrees, and sixty-four on a phone — steeper than looks
natural, on purpose.

The board is fitted to the space the *panels* leave rather than to the window,
and on a phone the whole rig drops so the board sits in the middle of what is
actually free. Dropping the camera and its target by the same amount slides the
board up the frame without tilting it; tilting instead would foreshorten the far
rank to fix a layout problem.

Pieces are tracked as **men with identities** separately from the position,
because a piece needs something that survives a move — without it there is
nothing to animate, only a board that looks different from one frame to the
next. A man glides in an arc, and lands with the same squash the dice use.

The opponent is negamax with alpha-beta, ordered captures first, material plus
piece-square tables, at one, two and three ply. Root moves are searched with a
**full window** rather than a narrowing one: it is faster to narrow, but then a
move that fails low comes back with a bound rather than a value, and ranking
bounds against each other — jittered, to keep two games from being the same
game — picks moves for reasons that are not in the position.

## Five · Two bugs the tests caught

**Promotion put four discs on one square.** A pawn reaching the last rank has
four moves to the same destination, so the list of squares you may move to had
that square in it four times: four stacked highlight discs, and four React
children with the same key.

**The camera pitch, above.** That one was only found by trying to play a move
through the interface rather than by looking at a screenshot — the board looked
completely fine and half the moves were unplayable.

## Files

| file | what |
| --- | --- |
| `rules.ts` | the whole of chess, and `perft` for proving it |
| `pieces.ts` | the six men, as profiles and one outline |
| `look.ts` | the jelly, the board, the room |
| `ai.ts` | the opponent, at three strengths |
| `Board.tsx` | the scene, the camera fit, the click-to-square plane |
| `Chess.tsx` | turns, selection, promotion, take-back, the panels |
