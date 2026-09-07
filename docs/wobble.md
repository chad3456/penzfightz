# Wobble

*Six jelly dice on a dished table, and none of them lands like a bone one.*

---

## One · The material is the subject

A jelly die is not a coloured die. It is a **volume**, and everything that
makes it read as one comes from light going *through* it rather than off it.

- **Transmission**, so the tray and the far side of the die show through the
  near side, bent.
- **Absorption** rather than paint. The colour comes from `attenuationColor`
  over `attenuationDistance`, which is why the corners — where light has
  travelled furthest through the jelly — are deeper than the flat of a face.
  The base `color` stays pale; a saturated base on top of a saturated
  attenuation is an opaque sweet.
- **Pips as lentils sunk under the surface**, not decals on it. That is what
  makes the far pips visible through the near ones as pale bent shapes.
- **A piece of fruit set in the middle**, like a sweet, because a volume you
  can see into ought to have something in it.

Three things had to be measured rather than guessed.

**A transmissive material with no environment renders as flat grey.** There is
nothing to refract. It looks exactly like a bug in the geometry and is not one.

**Three.js's own `RoomEnvironment` is the wrong room for this.** Against it a
flat die face pointing at one of its light panels mirrors the whole panel and
prints as a white square with the pips lost inside it. Jelly wants light
sources that are large in solid angle and not far off the brightness of the
walls, so the highlight is broad and never clips — but *also* a couple of small
bright ones, because a refracting body with nothing to refract comes out as a
flat coloured cube. The room here is a dim ceiling the size of the wall with
two small hot panels on top of it.

**ACES desaturates as it rolls off**, which turns a vivid pink jelly into a
salmon one. Khronos PBR Neutral is built for this exact case — a lit object
against a pale ground where the colour is meant to survive.

## Two · Shadows, and why they were invisible

The first version had no shadows worth the name, and the cause was not the
material: an opaque die and a transmissive one side by side cast identically
faint ones. **An image-based light is not shadowed by anything.** With the room
lighting the table from every direction, a directional light strong enough to
print a real shadow would also blow the jelly out.

So the floor does not receive the shadow. A catcher just above it does, with a
`ShadowMaterial` whose opacity is set to whatever looks right. That decouples
how dark the shadow is from the lighting balance the material depends on, which
is the only way to have both.

## Three · Squash is a matrix, not a scale

Every impact flattens a die along the direction it was travelling, and a soft
damped spring lets it back out over about a second — three visible wobbles,
which is what a gummy sweet dropped on a table actually does.

The flattening cannot be an object's `scale`. Scale on an `Object3D` is applied
in the object's *own* frame, so a die that has rolled onto its corner would
squash along its own corner axis rather than towards the table. It has to
happen in world space, after the rotation, which means composing the matrix:

```
S = s·I + (k − s)·(a ⊗ a)
```

The outer product picks out the component along the impact axis and scales it
by `k`; everything perpendicular stays at `s = 1/√k`, so the jelly keeps its
volume. The rigid body owns position and rotation, and a child group with
`matrixAutoUpdate = false` carries `S` — with the axis brought back into the
body's frame first, since a child's matrix is a local one.

This is the one property that cannot be checked by watching the scene move, so
it was checked in isolation: seven dice at seven different rotations, all given
the same world-Y squash. They all flatten towards the floor. The same code at a
negative amplitude stretches them all vertically, which is what a drag uses.

A note on the spring: at a stiffness of 165 a single 60 Hz step overshoots into
a *growing* oscillation, so it is sub-stepped four times per frame.

## Four · Knowing what it landed on

The value is read from the geometry, not chosen in advance: the face whose
normal, once turned by the die's rotation, points most nearly at the ceiling.
The same dot product says how flat the die is lying, and that is the only
reliable way to catch a **cocked die** — one propped on an edge or leaning on
its neighbour has no face above about 0.86, and reading it would invent a
number. Those get flicked, and the wait starts again.

The face layout was audited rather than eyeballed: each of the six faces turned
up in turn, at four different spins each, checking the reported value. Through
a transmissive body you cannot count pips in a render anyway — the far ones
show as well — so the pip patterns were confirmed against an opaque copy.

Three things guarantee the panel never sits on *A little suspense…* forever:

1. The drag target is clamped inside the wall. Flying a body to the pointer by
   setting its velocity will push it straight through a thin static collider,
   and a die that gets out never comes back.
2. Anything that ends up off the table is put back.
3. After six seconds the roll resolves regardless — and anything still cocked
   is **laid flat onto its nearest face** first, so the number reported is the
   number showing. That is what a hand would do with it.

## Five · Two bugs worth keeping a note of

**Changing flavour turned every die into a white sphere.** The pip material is
part of the `InstancedMesh`'s `args`, a change of `args` makes R3F build a
whole new mesh, and the new one has an identity instance matrix. The effect
that placed the pips was keyed on the transforms, which had not changed, so it
never re-ran — and every pip sat at the origin at its geometry's own radius of
one, swallowing the die. Placing them from a **callback ref** fixes it, because
a callback ref runs on every mount.

**The camera cropped the tray in portrait.** Fitting a circle to the frame from
its *centre* is not enough when you are looking down at it: the near edge is
closer to the camera by the radius foreshortened, and being closer it is
magnified. The fit adds that back.

## Files

| file | what |
| --- | --- |
| `flavours.ts` | six jellies: surface tint, absorption, pip, fruit, tray ring |
| `die.ts` | geometry, materials, the pip layout, reading the top face, the squash matrix |
| `table.ts` | the room the jelly is lit by, the floor texture, the wall |
| `Table.tsx` | bodies, throwing, poke and drag, settle detection |
| `Wobble.tsx` | the canvas and the panels |

## On the reference

Built after a video of a published site with the same idea, and built from the
mechanism rather than the markup: the transmissive body, the sunk pips, the
squash on impact, the dished tray, and the roll/count/flavour/result layout,
which is roughly where those four things have to go. It carries this site's own
name and none of that one's wording, wordmark or credits.
