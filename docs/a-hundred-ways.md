# A Hundred Ways

*One picture, a hundred techniques, and none of them knows what it is drawing.*

---

## One · The architecture is the idea

Every one of the hundred styles is a **resampling** of the same picture. The
picture is drawn once, tonally, into an offscreen buffer, and read back as three
parallel fields — luminance, region, and colour. After that, a technique never
touches the subject: it asks the field what the tone is at a point and decides
what mark to make.

That is why they all depict the same thing. An engraving, a stipple and a
Voronoi diagram of this portrait are not three drawings; they are three ways of
asking the same array what it looks like. A technique is a **rule for turning
tone into marks**, and the rule is the only thing that changes between them.

```ts
export interface Ctx {
  t: (x, y) => number;              // ink density: the inverse of luminance
  region: (x, y) => Region;         // hair, skin, feature, neon, ground
  slope: (x, y) => { angle, mag };  // which way the tone is going, and how fast
  col: (x, y) => string;
}
```

Half the techniques need `slope` rather than `t`. Hatching that runs *along* the
form, a flow field, a contour map, a single continuous line that follows an
edge — all of them are riding the gradient, and it is the difference between
shading that describes the head and shading that lies on top of it.

## Two · What the source has to be

The source is not a nice picture. It is a picture built to be **resampled**, and
that changes what makes it good.

- **A mid-grey background is the worst possible ground.** It prints as a flat
  mass in every threshold technique and tells you nothing. The first source had
  the room at about 55% tone and the woodcut, the notan and the cross-hatch all
  came out as a grey field with a face floating in it.
- **A tight key light collapses.** A small hot key models beautifully in colour
  and then, the moment anything thresholds it, becomes a narrow white wedge with
  two eyes in it. The light had to be widened until most of the face clears any
  reasonable threshold, and the modelling moved into a handful of soft shadows —
  brow shelf, sockets, the side of the nose, under the lower lip.
- **The hairline decides everything.** The hair curtains originally converged at
  the parting, which pinched the face into a spearhead — and a spearhead is
  exactly what a hundred techniques then printed. The inner edge now runs *out
  along the hairline* instead of back up to the crown.
- **A uniformly black ground carries no information either.** A broad soft lift
  behind the head gives the background structure without putting an edge
  anywhere for a threshold to catch.

The regions are stamped into a parallel buffer as the picture is drawn, rather
than inferred afterwards from colour — because hair and background are both
nearly black, and no amount of cleverness recovers the difference from a pixel
value.

## Three · The five families

They are grouped by what the mark is made **with**, because that is what
actually separates them.

| | what the mark is | examples |
| --- | --- | --- |
| **Line** | a pen or a point leaves a track | contour, blind contour, hatching, form hatching, stipple, engraving, etching, scratchboard, ballpoint, brush pen, charcoal, silverpoint, one continuous line |
| **Press** | a plate leaves a flat area | woodcut, linocut, notan, posterised, duotone, riso, screen print, halftone, line screen, low poly, paper cut, mezzotint, cyanotype, lithograph |
| **Paint** | a brush leaves a load | watercolour, gouache, impasto, palette knife, pointillism, wet-on-wet, sumi-e, airbrush, spray, pastel, conté, fresco, encaustic, tempera, suminagashi |
| **System** | a machine leaves a grid | voronoi, delaunay, circle packing, flow field, contour map, scan lines, CRT, glitch, error diffusion, ordered dither, ASCII, pixel, wireframe, slit scan, moiré, string art, maze, Truchet, differential growth, anaglyph, op art |
| **Craft** | a needle or a tool leaves a stitch | embroidery, cross stitch, weaving, knitting, beadwork, batik, mosaic, stained glass, terrazzo, quilt, inlay, rangoli, mehndi, kolam, tattoo flash, blueprint, radiograph, thermogram, sonar |

## Four · The failure mode they all share

Printed as a contact sheet with the names under them, nineteen of the hundred
turned out to be blank, uniform, or a shape that was not a face, and eight more
were only just there. That is a quarter of the set, and they failed in five
ways.

**One property is not enough.** The characteristic bug of the whole approach:
*the marks were not keyed hard enough to the tone.* A scatter with a weak bias
over a dark ground puts most of its marks in the background, and the picture is
there but so is everything else. The fix is always to raise the exponent on the
bias **and** let a second property of the mark ride the tone too — the length of
the stroke, the number of loops, the size of the ring, the weight of the line.
One property tracking tone gives you a picture you can just about see; two gives
you one you cannot miss.

**Sub-pixel marks are not thin, they are faint.** A line specified as
`c.w * 0.0012` is a nice hairline on a plate and a fifth of a pixel on a
thumbnail, where the renderer turns it into a wash. Silverpoint, ballpoint,
lithograph, pointillism, chalk and string art were all this, and they were all
fixed at once by flooring the width in `stroke` at two thirds of a pixel and the
radius in `dab` at four tenths. A technique that survives on a thumbnail is a
technique.

**A binary threshold makes a silhouette, not a portrait.** Hatching printed
where `t > 0.42` and nowhere else: lit side blank, dark side solid, nothing in
between. Real hatching carries tone in the *spacing*, so line *k* now prints
only where the tone has reached that line's level, eight interleaved levels in
the standard ordered sequence. A pale cheek takes one line in eight; a black
coat takes all eight.

**Dark ink on a dark ground.** Spray paint and chalk both scattered by darkness
onto a near-black surface and then painted it its own colour. Anything that
marks pale on a dark ground has to be told to go where the *light* is — hence
`scatterLight` in the kit. Chalk was the pure case: it scattered by darkness and
then discarded everything dark, which is a great deal of arithmetic to arrive at
an empty board.

**Parametrisations that do not cover the card.** Hatching and cross-hatching
walked their lines by arc length for a fixed distance that stopped a third of
the way up, so the head was never hatched at all. Moiré stepped along a
near-vertical line the same way and covered the top three per cent. These look
like tonal bugs and are not: the ink is correct and it is simply somewhere else.

Two needed the algorithm rewritten rather than retuned. **String art** scored
every chord against the unchanged picture, so the winder kept re-crossing the
same darks — fifteen hundred threads and a ball of wool. It now scores against a
residual field it spends as it lays thread down. **Differential growth** pushed
each point *away* from its neighbours, which amplifies curvature every step and
reaches infinity in about forty of them; a blank card is what an exploded ring
looks like. Corrected to pull towards the neighbours and repel everything else,
one ring for the whole picture then spent its entire point budget in the first
dark thing it touched. It is now one ring per cell, each handed more points than
its circle can hold, so it has to buckle — and how many times it buckles, and
how much of its cell it fills, are both the tone.

One diagnosis was about speed rather than looks. The repulsion loop used
`Math.hypot`, which is correct, careful about overflow, and about fifty times
slower than the thing it replaces. At half a million pairs a card that is the
difference between a frame and ninety-nine seconds. Reject on the squared
distance; take the root only for the few pairs actually touching.

The general lesson is that **you cannot tell which of these it is from the code.**
Every one of the twenty-seven looked plausible on the page. They were found by
rendering the hundred as a labelled contact sheet and looking at it, and only
then reading the six lines that produced each failure.

## Five · The subject

A composition rather than a likeness: the framing, the low key and the
red-and-blue neon of a face in a bar, with the hair centre-parted and falling
past bare shoulders, a level gaze, a pressed-down mouth and a fine chain. It is
built from landmarks and gradients, and it is not anybody.

## Files

| file | what |
| --- | --- |
| `source.ts` | the picture, drawn once, and the three fields read back off it |
| `kit.ts` | what every technique shares: scatter, grid, ride the gradient, floors on mark size |
| `styles.ts` | the hundred rules |
| `plates.ts` | one source, a hundred reads, baked to atlases |
