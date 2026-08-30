# Wet on Wet: a thousand watercolours nobody painted

## The mark is not where the paint ends up

The crayon study in this repo is a *deposition* model. For every pixel of every
stroke it asks one question — does the pressure of the stick beat the tooth of
the paper — and the answer is final. That is exactly right for a dry medium,
because in a dry medium the mark is where you put it.

Water is the opposite, and it is the whole reason this is a separate study
rather than a palette swap of that one. In watercolour you put pigment down and
then **the sheet decides**. It runs downhill. It piles up against the edge of the
wet patch. It drops into the pits of the paper if the particles are heavy
enough. It goes on doing all of that for several seconds after your hand has
left the paper, and the picture you get is not the picture you painted.

So this is a simulation and not a renderer. There is no code anywhere in it that
draws a soft edge, a bleed, a dark rim or a bloom. Every one of those is a
consequence.

## Paint is a filter, not a colour

Nothing here stores an RGB value for a pigment. A pigment is three **absorption
coefficients** — how hungrily it eats red, green and blue per unit of thickness
— and the sheet is tinted with Beer–Lambert:

```
colour = paperWhite · exp(−k · thickness)
```

That single choice buys most of the credibility. Two washes over each other
multiply rather than average, which is why a second wash in a real painting
always darkens and never brightens. A blue laid over an orange goes to a
grey-brown, the way it does on paper, instead of to the mid-tone you get from
mixing two screen colours. And a thin wash and a thick one of the same pigment
are different *colours*, not the same colour at different opacities — which is
the thing that makes watercolour look like watercolour rather than like a
brush-shaped eraser on a coloured layer.

Two other numbers belong to the pigment and not to the brush:

**Granulation** is whether the particles are heavy enough to fall into the pits
of the sheet and sit there. French ultramarine does it so hard the texture of
the paper becomes the subject; a phthalo does not do it at all. It is the single
biggest reason a real wash does not look airbrushed.

**Staining** is whether it lets go once it is down. Alizarin bites into the
fibre and no amount of clean water lifts it; ultramarine sits on top and washes
almost back to white. In the solver this decides whether pigment already
deposited can be picked back up by later flow, which is what lets a second
stroke through a first *move* the first one instead of covering it.

Sixteen pigments, and a palette is exactly two of them — one cool, one warm,
mixed on the paper rather than in a well. Two pigments give you four colours:
each alone, the mix, and the paper. The mix is *earned* — it only exists where
two strokes actually met while both were still wet. A third tube and the picture
stops being about that meeting.

## The solver

Two textures carry the entire state:

| texture | r | g | b | a |
|---|---|---|---|---|
| **flow** | water depth | the wet mask | velocity x | velocity y |
| **pigment** | cool in suspension | warm in suspension | cool on the fibre | warm on the fibre |

and one step is two fragment shaders over them, ping-ponged. Forty-six steps is
a painting.

### Edge darkening is emergent, and it is the whole thing

If you take one detail from this document, this is it. Velocity is driven by the
gradient of the water surface, so **inside a puddle the flow points outwards** —
from the deep water in the middle to the thin film at the rim. Pigment rides
that flow to the boundary of the wet region and cannot cross it, and as the film
thins there it drops out of suspension.

The result is that every wash paints its own dark rim, and nothing in the code
draws an outline. It falls out of two lines: velocity from `−grad h`, and a
deposition rate that rises as `h` falls. That single behaviour is most of the
difference between a watercolour and a gradient.

### The rest of it

**Granulation** scales deposition by the paper height, so heavy pigments settle
into the tooth and staining ones do not.

**Backruns.** Drop clean water into a wash that has begun to set and it shoves
the pigment outwards into a hard-edged cauliflower. One extra pass, run at a
chosen step, and it is the accident every watercolourist knows by name. Rather
than being suppressed it is in the recipe: about half the paintings get one or
two, at a position and a strength the sampler picks.

**Lifting.** Deposited pigment goes back into suspension in proportion to
`(1 − stain)` and to how fast the water over it is moving.

**Drying is blotchy on purpose.** The rate is scaled by the paper's sizing
channel, which varies over centimetres rather than millimetres, so a wash dries
unevenly the way a real one does.

### The incompressibility is missing, deliberately

A proper shallow-water solver projects the velocity field to be divergence free.
This one does not. A film of water on paper is not a closed system — it soaks
in, it evaporates, and it genuinely does spread outward from where it is deep.
Adding the projection made the washes calmer and less like paint, and cost three
more passes a step.

### Resolution invariance, which is easy to get wrong

A print is *the same painting on a bigger sheet*, not a different one. The
bleeding has to cover the same fraction of the picture whether the water is
solved on a 120-pixel card or a 300-pixel print, and none of the constants
survive a resolution change on their own:

- diffusion length in cells goes as `sqrt(spread · steps)`, and we need it
  proportional to the grid — so `spread ∝ k` and `steps ∝ k`, where `k` is the
  sheet size relative to the card the constants were tuned on;
- total drying over a run has to be invariant, so the per-step rate goes as
  `1 / k`;
- velocity comes from a per-texel difference, which is smaller at higher
  resolution for the same physical gradient, so the push carries a factor of `k`
  too.

Every one of those is off by a power if you guess. They are all derived from one
number in `Wash.run`, and it is the reason a print looks like the card it came
from rather than like a photograph of it taken through glass.

Solving the print at print resolution would cost nine times as much and look
*softer*, not sharper — fluid is low frequency. The sharpness comes from
somewhere else.

### Where the sharpness comes from

The paper is sampled at full output resolution, and the pigment lookup in the
final pass is nudged along the tooth's own gradient. That stamps the sheet's
high-frequency detail onto every wash edge, so the wash is ragged at *paper*
scale even though nothing at paper scale was ever simulated. It is a domain
warp, it costs two texture fetches, and it does more for the result than
doubling the grid would.

## The sheet

Cold-press rag paper is a height field, and every interesting thing water does
on it is downstream of that. One texture carries three channels: **height** (the
tooth, driving granulation and the ragged edge of a wash), **absorbency** (low
frequency, because sizing varies over centimetres, and it is what makes a wash
dry in blotches), and **fibre** (faint long streaks from the mould, almost
invisible alone and immediately missed when absent).

One sheet is generated per session and tiled. Every painting in the gallery is
on paper from the same block, which is what a real study would be.

## The brush only wets the paper

The brush is the only part that is *drawn*, and it deliberately does very
little: it lays down how much of each pigment is on the sheet and how much water
came with it, and hands the whole thing to the solver. It is not painting the
picture. It is wetting the paper in the shape of one.

That split is what makes the style possible. A brush that drew the finished mark
would have to fake bleeding, blooming, granulation and edge darkening, and the
fakes would be the same fakes on every stroke.

Two things the brush does have to get right, because the solver cannot invent
them. **The load runs out** — a real brush is fullest where it lands and driest
where it leaves, and a stroke of even weight end to end is the most obvious tell
of a painting made by a computer. And **the whites are reserved, not added** —
you cannot paint white back on, so every light in the picture has to be paper
that was never touched, which means the brush has to skip.

## Three stages, because the order *is* the technique

The brush buffer is filled, uploaded and cleared three times per painting, with
the solver run in between:

1. **The wet stage.** The largest shape in the picture — cloth, and the loose
   field of colour around the body — onto a soaked sheet, with forty per cent of
   the run still to come. Nothing in this stage keeps the shape it was given.
2. **The body.** Torso, limbs, head, hair, laid while the sheet is damp. Edges
   soften but survive, which is why the figure reads as a figure and the cloth
   reads as weather.
3. **The darks.** A handful of small, nearly dry marks at the very end, when
   there is not enough water left to move them. These stay sharp, and they are
   the only sharp things in the picture.

A watercolour with no stage three looks like a stain. A watercolour that is all
stage three looks like a drawing that has been coloured in.

## The figure

### It is mass, not line

Look at what a loose figurative watercolour actually consists of and it is three
or four **masses**, one of them enormous, with the figure implied where they
meet. A dancer is a skirt with a person at the top of it. So the body here is
authored as mass, and the proportions are its own rather than the crayon
study's: that figure runs at seven heads with a deliberately large skull because
it has to carry a face made of six marks, and here the head is a single dab with
nothing inside it, so the drawing runs at a proper eight and the extra length is
worth having.

### A body is one shape, not eleven

The mistake that cost the most. Painted as eleven overlapping ribbons that *add*
together, every joint comes out darker than the limbs either side of it — which
is exactly backwards, because a shoulder is where a silhouette is thickest, not
where it is darkest. The first figures read as insects for precisely that
reason.

So the brush has a coverage mode. Under `max` a group of marks covers the paper
once however many times it is painted over, and the arm that passes in front of
the body disappears into it the way it should. Marks that are genuinely separate
events — a dark laid over a wash that has set — stay additive, because those
really do build.

### Cloth

Three passes were spent here and all three fixes are about cloth being a *sheet*
rather than a set of rays.

**It hangs off a line, not a point.** Fanning equal spokes out of one pixel
makes a starburst, and the shape reads as a splash or a hand and never as a
skirt.

**It does not go up, and the clamp is much tighter than it looks like it should
be.** Ninety degrees is straight down. The poses were authored with sweep
directions up around a hundred and fifty, which is nearly horizontal, and every
seated figure came out with a slab of colour lying on the floor beside her. Only
a pose actually in motion earns more than forty-odd degrees off the vertical.
A skirt on someone sitting down pools; it does not sweep.

**The field is light and broken; the folds inside it carry the weight.** Painted
the other way up — a solid mass with pale folds drawn on it — a skirt comes out
as a flat coloured shape with some lines on it.

And under a long dress the legs stop where the cloth starts. Painting a whole
leg *and* a whole skirt over the same paper gives a figure with her legs outside
her clothes, which is the quickest way to make a picture look assembled rather
than painted.

### Two bugs worth keeping a note of

**Everything was upside down.** The brush buffer is uploaded as a texture and
read in UV space, where v = 0 is the *bottom* of the picture, while every
coordinate in the figure code has y increasing downwards the way a page does.
What makes this one nasty is that it is not obvious: a watercolour of a woman
standing on her head is a perfectly plausible watercolour until you go looking
for the feet.

**Fitting on height alone.** A woman lying flat is four times as wide as she is
tall, so a fit computed from the vertical extent scaled her up until the head
filled the sheet and the legs were off the side of it. That one also does not
look like a bug — it looks like a very confident close-up.

And one that repeated a lesson from next door: hair drawn as five long thin
strands gave every figure in the gallery a pair of antennae. At this size a
single dark tube reads as *wire* whatever it is meant to be, which is exactly
what the crayon limbs taught, arriving from the other direction. Hair is a shape
with a few edges now.

## Every painting is a different pose

Seventy poses are written by hand and then every painting jitters them — six
degrees a bone, a little on the spine. That is not padding. A pose written down
is a *position*, and a position repeated a hundred times reads as a hundred
copies of one drawing however much the colour changes: the eye locks onto the
silhouette and nothing else registers. Six degrees, and two paintings from the
same entry are two people doing the same thing rather than the same person
twice. The jitter is deliberately small — enough to break the repeat, never
enough to break the gesture the pose was written for.

The accidents are in the recipe too. Wetness, the tilt of the board and where
the backruns land are chosen per painting and then handed to the solver, which
is free to do what it likes with them. Two paintings with identical recipes bar
the seed diverge the way two attempts at the same watercolour diverge: same
intention, and the water went elsewhere.

## The gallery

Nothing comes back to the CPU per painting. Each one is composed straight into
its own cell of a large canvas by setting the GL viewport, so a plate of a
hundred and sixty-nine is built on the GPU and copied off in a single
`drawImage`. The pixels cross back once per plate rather than once per painting,
and the globe gets six textures for a thousand pictures.

They hang on the same Fibonacci sphere the scenes next door use, at a tighter
spacing because a portrait card has a shorter diagonal than a landscape one.

And the sphere **assembles itself**. A watercolour takes real work to solve, and
a thousand is long enough that a progress bar is the wrong answer — the globe
hangs the hundred and sixty-nine that are finished while the next plate is still
being painted. It is a better wait and it is also the honest picture of what is
happening.

Clicking one paints it again rather than scaling the card up. There is nothing
in 120 pixels of solved water to enlarge, so the print runs the whole thing
again on a bigger sheet with proportionally more steps — the same intention and
a different accident, which is what a second attempt at a watercolour is.

## Numbers

| | |
|---|---|
| paintings on the globe | 1,000 |
| poses, hand-authored | 70, jittered per painting |
| pigments | 16, in 12 two-tube palettes |
| solver | 2 shaders × 46 steps at 120 × 160 |
| a card | ~185 ms; the whole thousand in 185 s |
| a print | 186 × 248 solved, shown at 560 × 747, ~600 ms |

Those timings are from this container, which has **no GPU and is running
SwiftShader**. It is a fragment-bound workload of about 1.8 million invocations
a painting, which is the case software rasterisation is worst at, and on real
hardware it is not the same measurement at all. Treat them as an upper bound and
nothing else — and note that they are the reason the sphere fills a plate at a
time rather than waiting.

## What this is not

It is not a filter over a drawing, and it is not a texture. There are no images
in the repository. It is also not a physically accurate simulation of anything —
the pigment model is two coefficients where Kubelka–Munk wants four, the flow is
not incompressible, and the paper is noise rather than fibre. It is a set of
rules chosen because each one buys a specific thing the eye reads as paint, and
the test applied to every one of them was whether taking it out was visible.
