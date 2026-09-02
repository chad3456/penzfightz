# Picture Book: a hundred neighbours, none of them anybody

Every other gallery in this case makes a thousand of something, and the number
is part of the argument: how far one method can be pushed before it starts
repeating itself. This one makes a hundred, deliberately, because the claim is
a different one.

The others are about **range**. This one is about **style** — whether a
generator can hold a single illustrator's hand steady across a whole cast, so
that a hundred faces read as a hundred spreads from one book rather than a
hundred outputs from one program.

That is the whole design, and it settles every decision below: **the mark never
changes, only the person under it does.**

---

## One · The mark

Six Colours argued that a brush in a drawing app is a stamped round nib and
that adding grain to it is a lie. That argument was about *that* medium. This
one is gouache and coloured pencil on uncoated paper, and it wants the
opposite: nothing is a flat area of colour, and every shape has been gone over
by a hand that pressed harder in some places than others.

So `crayon.ts` sits on top of the same `Pad` — the same paths, the same
smoothing through midpoints, the same unit coordinates — and adds four things.

**Nothing is flat.** Every fill is *scuffed*: a couple of hundred short strokes
of the same colour lighter and darker, all at one angle, clipped inside the
shape. One angle per shape, because a hand does not change its wrist per
stroke. The strokes go both ways from the fill colour, because a pencil laid
over gouache does both — it darkens where it deposits and the paint shows
through pale where the tooth of the paper missed it. This is the single change
that stops the drawings looking like vector art.

**Fibre is drawn as fibre.** Straw, hair and beards are hundreds of thin
tapering strokes along a spine, not a filled shape with a texture laid over it.
Each strand is three points rather than two, because a hair that is straight is
a bristle and a hair that bends once is hair. The width falls off as
$(1-t)^{0.7}$ along its length.

A beard drawn as a shape has a silhouette. A beard drawn as fibre has an edge
made of several hundred *ends*, which is what a beard is. So the full beard here
is a mass, and then two hundred and sixty strands round the whole of its
boundary, crossing it — the outline is never actually seen.

**The edge of the card is torn.** The ground is a rounded rectangle whose
outline wanders by a couple of percent, filled with a cool wash at the top and a
warm one at the bottom. Every reference does the second part, and it is not
decoration: the warm band is what the figure is standing in front of, and it is
the only reason the head reads as being *in* somewhere rather than floating on a
swatch.

**There is grain over the lot.** Last, always, at low alpha, in a warm dark and
a warm white.

---

## Two · The palette is chosen, not derived

Every palette in this repository so far has been *found* — six inks by a hue
spacing test, two pigments and water, a paper and a stick. This one is picked by
hand, and it should be, because the style is not a physical process at all. It
is a printing convention: gouache reproduced on uncoated paper, in the narrow
gamut that survives it. Nothing is saturated, nothing is pure black, the ground
is always warm.

One rule in it is worth stating because it is the commonest way to make a warm
illustration look ill: **the shadow on skin is never the base darkened.** It is
the base turned towards red, because skin is translucent and what you are
looking at in a shadow on a face is the blood underneath it. Grey shadows on a
warm face read as illness every time.

---

## Three · The proportions are the joke

These faces are funny for one structural reason and it is not the beard. The
cranium is small, the features are crowded into the bottom third of it, the ears
are enormous and the eyes are about twice the size they should be.

Every one of those is a **fixed** ratio here rather than a random one. The
moment you let them vary, the drawings stop being one artist's and start being a
generator's — which is precisely the failure this effect exists to avoid. What
varies is the person: the head is a few percent wider or longer, the gaze goes
one way or the other, the brow is heavier or lighter. Nothing that would change
the hand.

Three details in the face that had to be got right rather than guessed:

- **The pupil sits high in the white and is small.** A pupil in the middle of a
  large eye looks dead.
- **The nose is a volume, not an outline** — a warm wedge with one short line
  under it for the nostril.
- **The blush goes on before the line work**, so the line stays on top of it. A
  blush over a drawn cheek reads as a sticker.

---

## Four · Things the screenshots caught

- **The neck was a column.** A long thin neck under a large head is a lightbulb.
  It is now short and thick, and the jaw shadow is a third of the width it was —
  at full width it read as a goatee on every face that did not have one.
- **The shoulders were too narrow.** A picture-book figure is a head on a hill
  of shoulder that runs off both sides of the card; a narrow pair reads as a
  passport photograph of somebody unwell.
- **The cap peak was a plank.** Four points in a straight band nailed to the
  side of the head. It needed the droop at the far end and the tuck back under
  the crown.
- **Hats were stuck on.** A hat drawn straight onto a scalp always is. Every
  reference solves it the same way — a few strands escaping under the brim on
  each side, so the hat is sitting on hair rather than on a head.
- **Long hair came out as two sausages**, one over each ear, because it was
  drawn as a shape per side. It is now a single silhouette behind the whole
  head that widens past the jaw, with a lock brought forward over each shoulder.
- **The first cast was a hundred variations on one man.** Two full beards in
  every eight. Half of them are now clean-shaven, and because the cut is chosen
  *after* the beard, the faces with no beard are the ones that get the long hair
  and the bun.

---

## Five · The caption comes from the face

The trade is drawn from the same seed as the hat, from a list indexed *by* the
hat, so a straw hat gets an outdoor trade and a headscarf never gets "keeps the
lighthouse" by accident. Same rule Roll Call uses for its personas, and worth
restating: a caption generated independently of the picture is one the reader
catches out immediately.

Nobody here is anybody. A first name from a wide pool and a job is exactly as
much as any of these faces could honestly claim to be, and it is also how a
picture book introduces someone on the first page.

---

## Six · What it costs

A hundred portraits bake in about **1.3 seconds** into one 10×10 sheet at 168
pixels a cell. A portrait is roughly fifteen hundred canvas strokes — the fibre
is not free — and the bake yields to the event loop every eight of them, because
a hundred back to back holds the main thread long enough to be felt.

Opening a card draws it again at 520 pixels rather than scaling the cell up.
Every width in the medium is a fraction of the short side, so the four hundred
strands in a beard that were a smudge on the globe are four hundred strands on
the card.

(That timing is SwiftShader software rasterisation in a container, and the bake
is pure canvas 2D, so it is a fair number for the drawing and says nothing about
the globe it hangs on.)
