# Ink and Water: a dragon that is made of the water it swims in

A Chinese dragon and its phoenixes, swimming through an incompressible fluid,
in p5. Everything on the screen is either the fluid or something drawn into it;
there is no sprite, no texture, and no image file anywhere in the effect.

The idea it is built on is one decision, and everything else follows from it:
**the dragon is drawn into the dye the solver advects, not on top of it.** So
the moment a fold of its own wake crosses its tail, the tail comes apart into
that fold. Draw the creature as a separate layer over the fluid instead and you
get a cartoon on a lava lamp — nothing the animal does affects the water, and
nothing the water does affects the animal.

---

## One · The solver

`fluid.ts` is Stam's *Stable Fluids*, in p5 framebuffers, in the order everybody
runs it:

1. **advect** the velocity field by itself — semi-Lagrangian, which is
   unconditionally stable at any timestep and is the whole reason this method
   won;
2. **splat** in whatever is pushing this frame;
3. **curl**, then **vorticity confinement**;
4. **divergence**, then a run of Jacobi iterations for **pressure**;
5. **subtract the pressure gradient**;
6. **advect the dye** by the field that came out.

### Why step 5 is the piece that matters

It is the one that is tempting to skip and the one that produces the entire
look. Without pressure projection, dye pushed into the field simply *spreads*,
and spreading is what smoke does. Real ink in water does something else: it is
shoved sideways by water that has nowhere to go, so it sheets, folds back on
itself, and draws out into filaments. Every one of those is
$\nabla \cdot \mathbf{u} = 0$ being enforced, and none of them can be faked with
a blur.

### Why vorticity confinement is not cheating

Semi-Lagrangian advection buys its stability with numerical viscosity: every
step quietly smooths the field, and the first thing to go is the smallest eddy.
Left alone the water turns to syrup in about ten seconds. Vorticity confinement
finds where the curl is strongest and pushes energy back *towards* it, which
puts back roughly what the solver just took. At zero the wake goes soft; at
sixty it boils.

### Two resolutions

Velocity and pressure run at half the dye's resolution in each axis — a quarter
of the pixels. That is not a compromise. The velocity field is smooth and low
frequency and it carries the twenty-odd passes a frame; the dye is a single
advection and is where every visible filament lives.

---

## Two · The creatures

Neither animal is rigged, and neither is animated. Both are **chains that follow
their own heads**, so the undulation is a consequence of steering rather than a
loop played over the top — and the tail whips because a chain whips.

What makes each one readable is a very short list, and it is not the body.

**A Chinese dragon is whiskers, horns and a serrated back.** Take those three
away and a long ribbon with legs is a caterpillar. The whiskers do the most work
of anything in the effect: two long curves trailing from the snout, and the eye
finds the head instantly.

**A phoenix is a tail.** The bird at the front is small and nearly generic; the
four plumes streaming behind it, each three times the body's length, are the
whole animal — and they happen to be the perfect thing to hand to a fluid
solver.

### Things that had to be measured rather than assumed

- **A chain only carries an S-wave if its head puts one in.** The first build
  steered on a ten-second wander and swam dead straight. It needs a second, fast
  oscillation at about half a hertz, against a body two and a half seconds long,
  which leaves roughly one and a half waves in the dragon at any moment.
- **A dragon cannot turn inside its own body.** With the turn rate uncapped, the
  head could come round faster than the tail could follow and the animal tied
  itself in a knot. Capped at 1.7 rad/s against 240 px/s, the turning circle is
  about 140 pixels — a curve it can wear.
- **Both legs must bend away from the body.** Subtracting a fixed angle put both
  through the same crook, and a dragon with two left knees reads as an insect.
- **A feather tapers.** Drawn as one polyline at one width, four plumes behind a
  bird are four lengths of hosepipe. Drawn a segment at a time with the width
  falling off as $(1-t)^{0.7}$, with barbs off every third node, they are
  feathers.
- **The mane goes behind the head.** At its first size it was a navy cushion
  sitting exactly where the face is.

---

## Three · Sharp animal, dissolving wake

The first build had only the dye buffer, and it was wrong in a way that took a
screenshot to see. The creatures print into a buffer that *accumulates*, so
within two seconds their own wake was denser than they were and the dragon was
somewhere inside a cloud.

What you actually want is the composition every ink painting of this subject
uses: **a sharp animal in front of a dissolving one.** So the same shapes go
down twice.

- Lightly into the dye, where they smear, fold and are gone in about a second.
- At full strength into a buffer that is wiped every frame and holds nothing.

The composite reads both through one function, so the creature gets the same
dispersion, bloom, absorption and wet edge as its own wake and does not sit on
the picture like a decal.

---

## Four · What ink on wet silk looks like

The composite pass in `sketch.ts` is where the physics becomes a painting.

**Absorption, not colour.** Beer–Lambert takes the ground away first — a blue
ink eats red hardest, so what is left under a heavy stroke is a near-black
indigo. Then the ink throws its own light back, and *that* term peaks at a thin
film and dies as the film thickens:

```glsl
col *= exp(-t * 3.0 * sigma * mott);
col += ink * 3.2 * exp(-t * 2.4);
```

A wash of ink glows and a fold of it does not. This is the entire reason the
dragon reads: it is the one dark shape in a frame of luminous water, and the
wake it is dissolving into is bright for exactly the reason the animal is not.
The separation only works because the two layers are at genuinely different
thicknesses — the sharp pass goes down about forty times heavier than the dye.

**Dispersion along the slope of the ink.** Water bends short wavelengths
hardest, so a fold fringes blue on one side and warm on the other. The offset
has to be clamped: unclamped, the slope at the hard edge of a drawn shape is
enormous and the three channels sample five texels apart, which is not
dispersion, it is a registration error, and it looked like badly printed comics
along every leg.

**Gold on the wet edge only.** A real ink line pools as it dries, so the gold is
gated on high slope *and* low thickness. Gated on slope alone it fires on every
internal seam of the geometry and the animal looks like a wireframe.

**A mottle over the absorption.** Ink does not lie down evenly on silk. Without
it a thick stroke is a flat plastic shape.

---

## Four and a half · Making it a liquid, and making it answer

The first build was correct and read as smoke on a dark card. Three additions
turned it into water, and none of them touched the solver.

**The ground is seen *through* the ink, not behind it.** A film of ink lying on
water is a lens: it is thicker in some places than others, so the silk weave
underneath shifts where the film is steep. Refracting the ground by the slope of
the ink costs one extra sample and is most of the difference between a picture
of ink and a picture of a liquid.

**The thickness field is a height field, so it has a normal.** A normal is all a
specular term needs. The highlight lands on the *shoulders* of a stroke, where
the film is steep, and is absent from the flats — which is exactly where the
light sits on real spilled liquid. It is gated off the bare water, where there
is no surface to catch it.

**The pointer carries a light.** This one is interaction, not optics. Without it
there is no evidence on screen that the water knows where your finger is until
the ink arrives, and the ink arrives about half a second later — long enough to
conclude that nothing happened.

The interaction beyond that is four things: drag to draw (the stroke lays down a
third ink, neither the dragon's blue nor the phoenix's orange, so what you drew
stays yours as it comes apart); tap for a drop; double-tap for a heavy one; hold
and the animals steer to your hand. Space drops one in the middle and C clears
the water.

A burst is a **ring** of twelve outward shoves rather than one vector, because a
single splat at a point is a jet — it picks a direction and throws the water
that way. Twelve of them round a small circle, all pointing out, is what a drop
landing actually does, and the pressure solve turns the ring into a vortex a
moment later.

The chrome is glass laid over the water rather than a bar above it. Everything
else in this case is a gallery of finished things; this is a body of water you
are standing at the edge of, so the canvas is the page and the panels are
dismissible and never cover the middle. Three things make a panel read as glass
and all three are needed: the blur, which on its own is a smear; the hairline
along the top edge, which is the light catching the lip of a real pane and is
what gives the panel a thickness; and a ground you can still see the water
through, because a panel you cannot see through is a card, and a card on a
picture is just a card.

---

## Five · Frame-rate independence, which is not a detail here

Two quantities in this effect are quoted per sixtieth of a second and must be
scaled by how much of one the frame actually was:

- **dissipation**, raised to the power `dt · 60`. Applied once per frame
  instead, a machine at ten frames a second keeps `0.975¹⁰` of its ink each
  second where a fast one keeps `0.975⁶⁰` — and the slow machine silts up solid
  white in about eight seconds. It did.
- **the ink laid into the dye**, and **the forces pushed into the velocity**,
  both multiplied by `dt · 60`.

The sharp pass is deliberately *not* scaled: it is a snapshot of this frame and
the buffer it goes into is wiped every frame.

The solver's units are worth stating, because they are the thing that is easy to
get silently wrong. Advection is `uv - v · dt · texel`, so a velocity of 1 moves
the ink one texel per second, which is nothing. The creatures think in "one unit
is a firm shove" and `FORCE = 340` is the conversion: at that scale a body wave
moves the water about one part in a hundred of the field per frame, which is the
difference between ink that curls and ink that sits there.

---

## The desk

| control | what it is |
| --- | --- |
| vorticity | how much of the curl the grid eats is put back |
| ink life | dye surviving each sixtieth of a second |
| bloom | weight of the twelve-tap spiral halo |
| phoenixes | how many |
| sheen | the specular on the film: zero is a stain, 1.5 is spilled oil |
| ink load | pigment on the brush, both passes |

At **ink life 0.970** the creatures leave no trail at all and you are watching a
line drawing. At **1.000** nothing ever leaves and the frame silts up. At
**vorticity 0** the wake goes syrupy; at 60 it boils. Those are the two knobs
worth moving first.
