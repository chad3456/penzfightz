# Ground Plan: a city that is a consequence of its roads

A city builder in three.js. One height field, one road graph, and everything
else derived from the two of them.

The reference was an aerial photograph, not a game screenshot, and that decided
most of what follows: the picture has to survive being looked at from eight
hundred metres *and* from the middle of a street, and almost nothing survives
both if it was modelled rather than shaded.

---

## One · The road graph is the only authored state

Roads are the sole structure a player edits directly. Everything else is
recomputed from them:

| derived thing | how |
| --- | --- |
| blocks | the faces of the planar graph |
| lots | subdivisions of a face along its frontages |
| buildings | one massing per lot, facing the edge it was cut from |
| traffic | agents whose position is (segment, metres along) |
| yards and parks | whatever is left inside a block |

That is a real trade. It costs a rebuild on every edit; it buys the property
that bulldozing a street through the middle of a block re-cuts every lot around
it for free, and that there is exactly one place where the shape of the city is
decided.

Two rules keep the graph planar, and both exist because the failure they prevent
is silent:

**Nodes are shared, always.** A new road that ends within fourteen metres of an
existing node uses that node. Two coincident nodes look identical on screen and
break face-finding without any visible symptom — the city simply refuses to grow
in one block and there is nothing to say why.

**Crossing segments are split.** Laying a road across another inserts a node in
both. Without it the faces are wrong and you get a "block" that wraps around the
outside of the whole city.

### Finding the faces

Walk every half-edge. At each node, sort the incident segments by bearing once;
arriving along one of them, step *backwards* one place in that sorted list. That
is the next edge clockwise, and following it traces a face.

Interior faces come out with positive signed area under this rule and the outer
boundary of each connected component comes out negative. That sign is not
obvious and both possibilities look plausible on paper, so it was worked out on
a triangle by hand before anything was written — the wrong choice builds a ring
of lots around the outside of the city and nothing inside it.

The same question comes back one step later. "Inwards" is the opposite direction
depending on the winding, and getting it wrong does not fail loudly either: it
offsets every lot outwards into the road, and the city merely looks *wrong*. So
the lot cutter takes the sign from the ring it was handed rather than assuming
one.

---

## Two · Facades are shaded in metres

The fidelity in an aerial shot of a city does not come from the massing. Boxes
are boxes. It comes from **facades** — floor lines, mullions, glass darker than
the wall, a ground floor unlike the floors above it, and at night a grid of
windows where some are on and some are not. Modelled as geometry that is tens of
millions of triangles. Drawn in a fragment shader it is free and it is the same
picture.

So every building is a small stack of boxes, all merged into one geometry with
one material, and everything you actually look at comes from four per-vertex
attributes: the size of the box the fragment is on, its position within that box
**in metres**, whether the face is wall or roof, and a seed.

In metres, not in normalised UVs. A floor is 3.4 m everywhere and a window bay
2.7 m everywhere, so a forty-storey tower and a corner shop have windows of the
same size. Normalised UVs give every building in the city the same number of
floors, which is the single most obvious tell in a generated skyline and is
visible from any distance at all.

The palette works the same way. What makes a street of generated buildings look
generated is not that the colours are wrong, it is that they are all the same
colour at different brightnesses. So each use has three materials — brick,
render and painted stone for houses; render, stone and dark cladding for shops;
profiled steel in the colours steel comes in for works; curtain wall, spandrel
and pale stone for offices — and those are different hues, not different
exposures of one hue.

### Density is what makes a skyline

Height falls off from the centre. It is the one rule every real city obeys and
the one most generated cities forget, and without it you get a slab of uniform
buildings instead of a downtown. Shops and offices build to both lot boundaries,
because that is what a high street is — an unbroken wall of frontage — while
houses leave a gap between them.

---

## Three · Roads have a cross-section

Kerbs are 17 cm of vertical face, not a painted line. It costs two triangles per
span and it is most of the reason the ground reads as built: a low sun puts a
shadow along every street, and the pavement sits at its own height rather than
being a stripe on the road.

Junctions were the interesting part. A quad per segment gives a pile of
overlapping rectangles fighting for the same depth at every crossing, and the
eye reads the fight before it reads the city. Instead every segment is trimmed
back from its node, and the junction is the **convex hull of the trimmed
corners**.

How far back? Two roads of half-width `h` meeting at angle θ have their outer
edges cross at `h / tan(θ/2)` from the node. Four equal roads at right angles
therefore give exactly `h`, and the hull of those eight corner points is exactly
the square you would draw by hand — corners included, which a disc of the same
radius would have missed. Two collinear roads give zero, which is also right. A
narrow fork gives a long taper, so it is capped before it runs away.

Lane markings, crossings, paving joints, wheel-polish and the pools of light
under the lamps are all shaded from a coordinate in metres along and across the
road. In metres for the same reason as the facades: a dashed line normalised to
its segment gets longer on longer roads, and nothing says *generated* quite so
loudly.

---

## Four · Light a building makes is not light that falls on it

The first night looked like this: the city vanished. Terrain visible, a handful
of street lamps, and where two thousand people lived, nothing.

The window light was being added to the albedo. Albedo is multiplied by incident
light, and at half past nine there is no incident light, so every lit window in
the city was multiplied by roughly zero. A lit window added to the albedo is a
window that goes out when the sun does — which is the one time of day it is
supposed to be on.

The fix is to route it through `totalEmissiveRadiance` instead. That chunk runs
later in `main()` than the one where the wall is shaded, so the glow is computed
with the wall and handed forward in a file-scope variable:

```glsl
vec3 gGlow;                       // declared in the common injection
// ... in <map_fragment>:
gGlow = lamp * win * lit * uNight * 0.6;
gGlow += col * uNight * 0.075;    // a trace of the wall, so it has a shape
// ... in <emissivemap_fragment>:
totalEmissiveRadiance += gGlow;
```

The same trick, for the same reason, lights the road under the lamps.

---

## Five · The economy has to be able to reach equilibrium

Small enough to hold in your head, and every term a ratio of two things the
player can see: workers to jobs, shops to shoppers, money in to money out. A
builder's simulation is not interesting because it is accurate — nobody can
check — it is interesting because when the demand bar moves you can say *why*.

Two things had to be fixed before it behaved.

**The job shares have to sum to the workforce.** They did not at first: shops
wanted 10% of the population, works 11%, offices 13%, and the workforce is 52%.
So even with every use perfectly satisfied, two thirds of the workers had no job,
residential demand was permanently negative, and the city deadlocked at about
four thousand people and sat there forever with every bar reading "enough". Now
the three working uses split exactly `WORKFORCE` between them, and the office
share — which only opens up once the place is big enough to want offices — is
taken *out of* the other two rather than added on top.

**Demand has to be damped.** Undamped it oscillates: a use goes short,
everything available is built at once, the overshoot makes demand strongly
negative, half of it is abandoned, and the bar flips between the rails every
tick. Easing a quarter of the way towards the target each day removes that
entirely, and has the side effect of making the bars readable, which is the only
thing they are for.

There is one piece of deliberate scaffolding. Every ratio here is undefined at a
population of zero, and a purely ratio-driven model sits at the origin forever:
no houses because no jobs, no jobs because no workers. So each demand carries a
term that starts high and decays with size — the founding of a town — and it is
gone by the time the ratios mean anything.

---

## Six · The camera, and three notes on looking

**Panning is not orbiting.** The camera is a point on the ground with a distance
and two angles, and dragging intersects both rays with a plane at the *target's*
height rather than at zero — so grabbing a hilltop does not slide the world out
from under the cursor. Get this wrong and the whole thing feels like a diorama on
a lazy Susan.

**The shadow cascade follows the zoom.** A fixed 1,800 m map at 2048² is 0.9 m
per texel: fine from the air, unusable at street level. Sized to the view it is a
tenth of that when you are close and identical when you are not.

**Tilt-shift belongs at one zoom.** Pulled all the way out, a city is an aerial
photograph and wants to be sharp; down among the streets there is no miniature to
suggest. So the blur amount is scaled by camera distance and peaks in the middle,
where a city does look like a model of one.

The pointer gets a ring, a column of light and a cone dropping into it — three
parts because a flat cursor at eight hundred metres is a few pixels of outline
against a busy picture and you lose it the moment you look away. The column is
the part you actually track while panning, because it is vertical and nothing
else is.

---

## Seven · Getting into it

A builder is a thing you look at. Three of these were added so it is also a
thing you are inside.

### The fleet is silhouettes, not boxes

No model files. The container this was built in cannot reach a model CDN, and
shipping third-party GLTF assets drags licensing into a repository that has
none — so every vehicle is generated, and generated properly rather than as a
stack of cuboids.

The trick is that **a vehicle is its profile**. You know an auto rickshaw at two
hundred metres because of the nose that drops to a single front wheel and the
long fall of the hood to a flat back; you know a double-decker because it is a
tall slab with two rows of windows. So the bodies are two-dimensional side
profiles extruded across the vehicle with a bevel — you draw the silhouette once
and get a solid — and the round parts are solids of revolution.

Everything merges into one indexed geometry with a **role** per vertex, and one
material resolves roles to colours in the shader: body from the instance colour,
canopy from a second instanced attribute, and glass, tyre, chrome, lamps and
seats from constants. That is why a rickshaw can be a black body with a yellow
hood and a taxi a black body with a yellow roof without either needing a
material of its own, and why a hundred of them is one draw call.

One thing had to be learned the hard way: a canopy written as a single closed
outline triangulates into a **solid dome** the moment corner-rounding pushes an
inner point past an outer one. Offsetting a curve by its own normal cannot do
that, because the two sides never meet. Hence `shell()`.

### Driving is a bicycle model with a grip limit

One steering angle, one speed, and a heading that changes at
`speed / wheelbase × tan(steer)`. That formula alone is why a rickshaw turns
tightly at walking pace and barely at all at speed, and it is most of what makes
driving feel like driving.

On its own it is also wrong, and measurably so. The first version cornered a
nine-metre circle at sixty-four kilometres an hour, because nothing in the model
knows about tyres. The missing term is a cap on **lateral acceleration** — at
most about 8 m/s² on dry tarmac, less on a slope, much less in water — which
turns into a cap on turn rate of `8.2 / speed`. Going in too fast now feels like
going in too fast.

Drag is derived from the top speed rather than guessed, so full throttle settles
at exactly the number in the spec. An auto does 45 km/h and a car does 95,
because that is what they do.

### Flying is not driving with a height

The helicopter has no "forward" control at all. It has an orientation, a lift
force **along its own up vector**, gravity and drag. You tilt, and the tilt takes
you somewhere.

Two numbers matter and both were found by instrumenting the model rather than by
feel:

- Neutral collective has to hold altitude, or letting go of the stick is a
  crash. Rotor speed settles at 0.87 in the cruise because 0.87² × the thrust
  constant is one gravity, which is the entire reason that number is 0.87.
- Thrust is split into what the disc makes at a given rpm and what pulling more
  pitch into it adds, so spooling up gets you light on the skids and the
  collective is what actually takes you off. That is the order it happens in,
  and it is the only part of flying a helicopter a keyboard can convey.

### Operations

Three of them, and they exist to make you use all three ways of moving. Every
objective is placed from the real city: rooftops from standing buildings, sweep
points from junctions in the road graph, and the convoy's route from a
double breadth-first search across that graph — the standard trick for the
diameter of a tree, approximate on a graph with cycles, and approximate is
exactly right because the convoy wants a long drive, not the longest one.

Nothing counts while you are looking at the plan. The point of an operation is
that somebody has to physically be there.

---

## Eight · Scalability

Three changes, each of which fixes something that was fine at a hundred
buildings and would not be at five thousand.

**Buildings are chunked, at 260 m.** One merged mesh for a whole city is the
wrong shape twice over: a single geometry spanning two kilometres is always
partly on screen, so it can never be frustum-culled and every triangle in the
city is submitted every frame even when you are looking at one street; and every
addition rebuilds all of it, so placing one more building costs more the more
there already are. Chunked, the renderer culls whole districts behind you and
adding a building rebuilds one quarter-kilometre square. Chunks whose contents
did not change are not touched at all, which is what the content signature is
for.

**Traffic is compacted, not culled by the GPU.** Each frame the visible members
of each kind are packed into the front of their instanced pool, nearest first,
up to a budget. Drawing every vehicle in the city and letting the GPU sort it out
means a full-detail rickshaw's worth of vertex work for every one of a thousand
vehicles including those behind the camera. Compaction costs a matrix and two
colours per drawn instance and puts a hard ceiling on the frame.

**Rooftop clutter has a range.** Tanks, dishes, hoardings and plant are per-chunk
instanced meshes that switch off past a distance that follows the zoom.

There is a readout in the corner — frames, draw calls, triangles, live chunks,
vehicles drawn — because a claim about performance that you cannot see is a
claim you should not make. One caveat on every number this document could
quote: it was measured on a software rasteriser in a container, and says
nothing about real hardware.


---

## What is not there

- **No pathfinding, and no queueing.** Vehicles pick the straightest available
  turn at each node and do not see each other. At these distances what reads as
  traffic is density and direction; a car-following model would be invisible and
  would cost the frame.
- **No collision between vehicles.** The one you drive collides with buildings,
  through a three-metre occupancy grid rebuilt with the mesh, and with nothing
  else.
- **No model files.** Every vehicle is generated. See section seven for why.
- **No services.** No power, water, police or fire. Upkeep charges for them in
  aggregate; nothing is placed.
- **No terrain editing.** The ground is generated once and roads follow it.
- **Lots are not stable across a rebuild**, so buildings are keyed on their
  position rounded to four metres. That survives a re-cut of the same block and
  correctly loses the buildings whose ground has been rearranged underneath
  them.

## Files

| file | what |
| --- | --- |
| `terrain.ts` | the height field, and every query that reads it |
| `sky.ts` | single-scattering dome, sun, and the hour |
| `water.ts` | depth absorption, fresnel, foam |
| `roads.ts` | the planar graph: snapping, splitting, crossings |
| `blocks.ts` | face traversal, and lots cut along frontages |
| `ribbon.ts` | road surfaces, kerbs, markings, junction hulls, lamps |
| `buildings.ts` | massing, and the facade shader |
| `yards.ts` | block interiors, parks, trees |
| `traffic.ts` | agents on the graph, one instanced pool per kind |
| `build.ts` | the parts kit: profiles, shells, lathes, tubes, wheels |
| `vehicles.ts` | the fleet, and the one material that colours all of it |
| `ride.ts` | the bicycle model, and the helicopter |
| `ops.ts` | objectives, markers and the convoy |
| `city.ts` | assembly, zoning, growth and demolition |
| `sim.ts` | population, jobs, demand, money |
| `cursor.ts` | ring, beam, cone, drag preview |
| `post.ts` | tilt-shift and the grade |
| `world.ts` | scene, camera, composer, tools |
