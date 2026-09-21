# Hallowdene

A school for the magically inclined, built in bricks. Twenty-three thousand of
them, in real time, with seven terms you travel through.

## What it is, and what it is not

A castle on a lake, with towers, a great hall, a staircase that moves, a
bridge, a clock, a boathouse and a dark wood at the edge of the grounds. Those
are the furniture of a genre, and nobody owns a genre.

It is **not** a reproduction of any particular school from any particular
series. None of that series' names, houses, crests, characters or licensed
brick parts appear anywhere in it, and that was a decision rather than an
oversight: a castle is a castle, but a specific castle with a specific name on
it is somebody's work, and so is the brick system it would have been built
from. The building here is generic, its four house colours are unnamed, the
brickwork is a stud on a cylinder, and the name on the door is its own.

## The brick

Everything above the water is one of nine brick sizes — 8×2, 6×1, 4×2, 4×1,
3×1, 2×2, 2×1, 1×2, 1×1 — and each size is one `InstancedMesh`, so the whole
castle is about ten draw calls.

**A brick can only be moved, turned and coloured.** It cannot be stretched,
which is the constraint that does all the work. A 1×1 scaled to 4×1 is a 1×1
with four oval studs on it, and the eye knows. So a long wall is a run of the
longest brick that fits, a round tower is a ring of 2×1s each rotated to the
angle it sits at, and a cone is the same ring shrinking.

The box of each brick is inset by 0.045 so that two side by side have a visible
seam. Without it a wall is one flat surface and all of the brickwork is wasted.

**Walls are laid in a running bond**: every course is offset half a brick from
the one below, and the run is filled with the longest brick that fits, so the
joints never line up. A tower's ring is twisted a little further every course
for the same reason — that is what a real round tower does, and it is also what
stops a moiré running up the side of it.

## The seven terms

Each one is a place, a weather and a camera, and the time track carries you
between them: the crossing, the hall, the stairs, the courtyard, the bridge,
the wood, the clock. The weather crossfades over a second and a half — sky
gradient, fog colour and density, sun colour, angle and power, ambient, water
tint, star opacity, what is falling out of the sky and how fast. The camera is
carried on a spherical rig around whatever it is looking at, so a drag swings
round the subject rather than turning on the spot.

Drag to look, wheel to move in, ← and → for terms. The track walks itself
until you take hold of it.

## Light, with no post pass

Three lights and no bloom pass. Key, fill, and a bounce up off the lake: with
only the first two there is a wedge of north-east faces that nothing reaches,
and at night that wedge is not dark, it is a hole.

The glow around every window, candle, lamp and the clock face is an additive
billboard with a radial-gradient texture on it, placed by hand off the plan
rather than found by scanning the geometry — so a hall window can be wide and
warm, a tower window small, and the clock gold and steady while the twenty-six
candles over the hall floor each breathe at their own rate.

## Six things that were wrong, and how they were found

None of these were visible in the code. All six were found by driving the page
and looking at what came back.

**The ground was five-sixths missing.** `slab()` stepped its tile size in both
directions and then laid whichever brick happened to fit inside that step — so
a tile of six laid a 6×1 brick every six studs *both ways*, covering a sixth of
the floor. On the lawns that read as loose bricks scattered on a plain. It was
the single worst thing in the model and it looked like a styling problem.

**The camera never arrived.** The frame delta was clamped to 50ms against
background-tab stalls, and the same clamped figure was driving the crossfade.
On a machine rendering at one frame a second, a four-second flight between two
terms took eighty, so every screenshot was of the camera creeping away from the
last landmark. The frame counter was reading the same clamped number back and
confidently reporting twenty. Transitions now run on real elapsed time; the
counter does too, and says one when it is one.

**The sky was a stop and a half dark.** A raw `ShaderMaterial` writes whatever
it is handed straight to the framebuffer. Every colour going into a uniform has
already been converted to linear, so without `<tonemapping_fragment>` and
`<colorspace_fragment>` the sunset was being displayed as though its linear
values were sRGB ones. Measured: the horizon was coming out at (3, 6, 20) where
`#26355c` is (38, 53, 92) — which is exactly that colour's linear form.

**The hall had no elevation.** The glass was flush in the wall plane and the
banners were at z−1.2, which is *inside* the buttresses; a buttress two deep at
z−2 occupies everything from z−2.5 to z−0.5. So fifty-four studs of the
building's best face was blank grey with some pale columns on it. The windows
now stand a stud proud and the banners hang clear of the buttresses.

**The stair hall was a grain silo.** Built as one closed cylinder forty-six
courses high, the four flights turning inside it — the entire reason the room
exists — were not visible from any angle. The top four fifths is now eight
piers with open bays between them and a ring course every eleven.

**The bridge crossed a lawn.** One rock meant the gorge was notional; the
fourth term is *about* a drop. There are two rocks now, the far one eleven
courses higher than the castle's, and the deck runs out at the height of the
stair hall's first landing with fifteen courses of air under it.

## Performance

In this container, with no GPU, Chromium software-rasterises it at one frame a
second at 1440×900. That figure is not a claim about anybody's machine: it is
about 23,000 instances in ten draw calls with shadows off, which is not a lot
of geometry, and the cost is entirely fragment shading in software. The HUD
reports what it actually measures, so whatever the number says is the number.
