# Surface Tension: two experiments in water

The other effects in this repository each make a thousand of something. This one
makes two things and puts the controls next to them, because a shader is not a
picture — it is an argument about how light behaves, and the only way to see the
argument is to move the numbers and watch what they do. Every control on the
bench is a **term in an equation** rather than a style preset. Film thickness is
in nanometres. Wave speed has a stability limit. Nothing is labelled *intensity*.

The two experiments are the two halves of the same subject: water at a scale
where surface tension wins and it pulls itself into beads, and water at a scale
where gravity wins and it lies flat and carries waves.

---

# One · Goopy iridescent droplets

Two ideas stacked on each other, and both are older than shaders.

## The field, not the ball

Nothing draws a droplet. Every bead contributes a **scalar field** falling off as
one over distance squared, the whole lot is summed, and the droplet is wherever
that sum crosses a threshold. That is Blinn's metaball from 1982, and the reason
it is right here is not that it is cheap — it is that **merging is free**. Two
fields near each other add; the level set bulges towards its neighbour, necks,
and joins, and at no point does any code know a merge happened. Try to write
that with circles and you are modelling a meniscus by hand for the rest of your
life.

The gradient is analytic, not sampled. `f = r²/q` with `q = |d|²` gives
`∇f = −2r²d/q²` for a couple of extra multiplies per droplet, where finite
differences would need four more passes over the whole set — the difference
between one loop and five, per pixel.

## The colour is a wave, not a palette

The iridescence is **thin-film interference**, which is the actual reason a soap
bubble and a petrol slick are coloured. Light reflecting off the top of the film
and light reflecting off the bottom travel different distances, and for each
wavelength that difference is either a whole number of waves or it is not:

```
Δ = 2 · n · d · cos θ
reflected(λ) ∝ cos(2πΔ / λ)
```

Evaluate that at 650, 545 and 470 nanometres and you have a colour — and it
arrives with the *right* palette without anyone choosing one. Soap-film magenta,
gold and cyan rather than the even spread of a hue wheel, because the three
curves fall out of phase with each other at a rate set by the ratio of the
wavelengths, not by taste.

Everything else follows. Thickness varies with the height of the bulge, so a
bead is banded from rim to crown. `cos θ` comes off the surface normal, so the
bands crowd where the edge turns away. Where two droplets have run together the
film is thicker and the bands tighten, which you can watch happen and which is
not drawn anywhere.

## Three things that were wrong

**The height profile was a ramp, and a ramp clamps.** Interpolating between the
threshold and some ceiling makes the crown of every bead dead flat — and a flat
crown takes the entire specular lobe at once and reads as a white sticker with a
rainbow ring round it. The profile is `sqrt(1 − threshold/f)` now, which is what
a one-over-r² field actually implies: zero at the level set, approaching one
only as the field runs away at the centre. Curved everywhere, so the highlight
is a point.

**Attraction summed over pairs grows with the count.** A cohesion setting that
gives five droplets a pleasant drift crushes thirty into a single blob in about
three seconds — and the shader dutifully draws that blob, beautifully. Cohesion
is short range now, which is both what surface tension is and the only version
that survives being scaled up. Beyond the reach they do not know about each
other at all.

**All repulsion is worse than all attraction.** The pass that fixed the blob
went too far and produced thirty beads that never touched, which loses the whole
reason for using a field. The look lives in the gap between the two terms: pull
outside contact, push inside it, so beads cluster at a preferred spacing and
merge only when something shoves them together.

**A unit quad drawn in clip space covers a quarter of the screen.** The vertex
shader writes `gl_Position` straight from the geometry, so no matrix is
involved — and scaling the mesh, which is the obvious fix, does exactly nothing.
The geometry has to be two by two.

---

# Two · A swimming pool

Every part of this is three.js: a box of tiled geometry, a surface mesh over it,
a height field on a pair of render targets, and two draw passes a frame. No
video, no normal map, no scrolling noise loop.

## The wave equation, and the two numbers that bite

The height field is the discretised wave equation, which is three lines:

```
lap  = (left + right + up + down) − 4·h
next = 2·h − h_previous + c²·lap
next = next · damping
```

**Two states are kept, not one** — `h` now and `h` a step ago — because the
equation is second order in time. That is the entire difference between water
and jelly: with a single state you get diffusion, and the surface sags back to
flat without ever overshooting. Waves exist because the surface carries
*momentum* through the flat position and out the other side.

`c²` is **not a look control, it is a stability limit**. Explicit integration of
this stencil diverges above 0.5, and diverging means the whole pool is NaN in
about four frames and the screen goes black. It sits at 0.28.

Damping is applied to the whole term rather than to the velocity. That loses a
little physical honesty and buys the thing that matters: energy only ever
decreases, so a pool left alone returns to glass instead of ringing forever at
the grid frequency. It is exposed as a knob, and at 1.000 you can watch it fail
— the surface fills with standing waves and never clears.

**The edges are free.** A clamped texture returns the edge texel for any lookup
past the edge, so at the boundary the Laplacian sees itself as its own neighbour
and the wave reflects. That is a hard wall, which is exactly what the side of a
swimming pool is, and it costs nothing.

**The grid may be rectangular but its texels must be square in world terms.**
The five-point Laplacian assumes even spacing on both axes; feed it a stretched
grid and ripples travel faster along the lanes than across them. Which is a nice
effect, and is not water.

## You cannot refract what you have not drawn

Each frame the water is hidden, the pool interior is rendered into an offscreen
target, the water is shown again, and the scene is drawn to the screen — where
the water shader reads that target back, displaced by its own surface normal.
That is real refraction of the real floor: the tiles bend because the surface
above them bends, and the lane lines break exactly where the ripple is steepest.

It also means this component takes over the render loop. r3f hands that over the
moment any `useFrame` asks for a priority, and from then on nothing is drawn
unless you draw it.

**The bend has to die at the rim.** Screen-space refraction samples whatever is
behind the offset pixel, and a few pixels outside the pool that is the paving —
so an unmasked surface hems itself with a bright white fringe of deck. That
fringe is the giveaway artifact of the whole technique, and the fix is one
`smoothstep` on the distance to the pool edge.

## Caustics are a Jacobian

The bright net on the floor of a pool is not a texture and not a light. It is
what happens when a curved surface focuses parallel sunlight: rays that entered
the water evenly leave it *unevenly*, and the brightness at any point on the
floor is the reciprocal of how much the beam spread out on the way down. To
first order that spread is the **Laplacian of the surface height**.

So a floor fragment samples the height field directly above itself, takes ∇²h,
and brightens where the surface is locally convex. Four texture taps, and the
caustics are then correct without being drawn: they move with the ripples, they
pool where two rings interfere, and they go flat and even when the water
settles. Turn the knob to zero and the floor is just tiles.

## The cheap half of looking wet

Two things sell water more than the surface does, and both are one line.

**Colour that deepens with the distance light travelled through it**, so the
bottom of the deep end goes green before the shallow end does — water absorbs
red first, and it does it over distance.

**A Fresnel term**, so the surface is glass at your feet and a mirror at the far
wall. That transition is most of what makes a flat plane read as a body of water
rather than as a sheet of blue.

## Two things that were wrong

**A `uniforms` object passed as a JSX prop is not yours.** three clones it, so
every write from the frame loop lands in an object nothing is rendering. The
symptom is the worst kind — it compiles, it runs, it draws, and every sampler is
simply null, which here meant a pool with a sheet of black glass over it. The
component owns its materials now.

**A pool with a lip is a pool with a bright band along its near edge.** Any wall
above the waterline is seen from *outside* by a camera that is above the water,
and comes out as a hard stripe that reads as a fault in the render. The walls
stop exactly at the waterline: brim full.

And one that is not a bug but a decision. Rain is punctuation, not weather. At
the first setting the pool never got a chance to settle and the whole surface
was permanent chop — which hides the two things worth looking at, the caustics
on the floor and a single ring reflecting cleanly off a wall.

## Numbers

| | |
|---|---|
| droplet field | up to 40 beads, one loop, analytic gradient |
| interference | 3 wavelengths, film 120–1200 nm |
| height field | 320 × 192, two states, 2 steps a frame |
| wave speed | c² = 0.28 (limit 0.5) |
| passes a frame | 2 sim, 1 refraction, 1 screen |
| caustics | ∇²h, four taps on the floor |
