# The Reading Room

Four short stories, each one built as a set you are standing in rather than a
page you are shown. You choose what happens; the endings are not the same
twice.

## What is on the shelf, and whose it is

| Book | Author | What it is |
| --- | --- | --- |
| The Dream of a Ridiculous Man | Fyodor Dostoevsky | Adapted from the 1877 story. Public domain. |
| Before the Law | Franz Kafka | Adapted from the 1915 parable. Public domain. |
| The Tell-Tale Heart | Edgar Allan Poe | Adapted from the 1843 story. Public domain. |
| The Salt Index | — | Written for this shelf. Not an adaptation of anybody. |

The fourth one needs saying plainly. The brief asked for Ken Liu alongside the
other three, and the other three are different in kind: they have been out of
copyright for the better part of a century, and adapting them is what anybody
may do with them. Ken Liu is alive and his work is in copyright. So nothing of
his is adapted here and nothing here is his. What is here instead is an
original story written in the territory he works in — a dying language, a
machine that makes a dead woman's sentences portable, and a daughter deciding
what that is worth — and the card on the shelf says *An original story* where
the others say *Adapted from*, so that no reader is misled about whose
sentences they are reading.

## The promise: a reading cannot get stuck

This is the part that is checked rather than hoped for. `story.ts` holds four
rules and two reachability proofs:

1. Every choice points at a node that exists.
2. Every node either offers choices or is an ending. Never neither.
3. Every node is reachable from the start.
4. **Every node offers at least one choice with nothing gating it.**

Rule four is the one that matters. Choices can be gated on what a reader is
carrying — you cannot ask the doorkeeper a second question if you never asked
a first — and a node whose every exit is gated can be arrived at holding the
wrong marks, with nothing to click and no way back. One door in every room is
always open.

Then, separately: from every node some ending is reachable, so rule four keeps
you moving and this keeps you from moving for ever.

And then it is measured. `wander()` walks each story at random until it ends,
hundreds of times. Over eight thousand readings of each of the four:

- every node was visited,
- every choice was offered at least once,
- every ending was reached,
- and no reading was stranded or ran long.

That last point is worth stating precisely, because "structurally reachable"
and "reachable in practice" are different claims: a choice can satisfy every
rule above and still be gated on a combination of marks a reader can never
actually assemble. Counting which choices are *offered* over thousands of
readings is what catches that, and nothing else does.

## How a scene is made

A scene is **data**, not code:

```ts
{
  palette: 'petersburg',
  ground: { radius: 9, thickness: 2, slot: 'ground' },
  props: [
    { prop: 'bed', at: [1.4, -0.6], turn: 0.3, look: 'I have not slept in it for a week.' },
    { prop: 'candle', at: [-0.6, 0.4], look: 'Down to the last inch.' },
  ],
  camera: { from: [4.2, 3.2, 5.4], look: [-0.3, 1, -0.8], fov: 38 },
}
```

Because it is data, it can be checked without a renderer, a canvas or a browser
anywhere near it — every prop a story names exists in the catalogue, nothing is
placed nowhere, no camera is standing inside the thing it is pointed at — and
that check runs as part of validating the story.

### The kit

- **`forms.ts`** — the shapes. Rocks, outcrops, ground, planks, tufts, blooms.
  One rule runs through all of it: `computeVertexNormals()` on a *non-indexed*
  geometry can only produce per-face normals, which is flat shading. `weld()`
  merges vertices first and computes after, and that single ordering is the
  whole difference between a painterly boulder and a low-poly one.
- **`paint.ts`** — the material. Standard physical shading with a patch injected
  at `#include <opaque_fragment>`: shadows lifted towards the palette's cool,
  highlights rolled towards its warm, a sky term on upward faces and a rim on
  the silhouette. Patching the include rather than writing a `ShaderMaterial`
  keeps shadows, fog and tone-mapping working, and `normal` and `vViewPosition`
  are already in scope there, so nothing in the vertex shader has to change.
- **`props.ts`** — the catalogue. Twenty-five builders, from a wall to a
  figure in six poses. Every one of them puts its origin **on the floor**,
  centred, facing −z, so nothing anywhere has to remember an offset.
- **`stage.ts`** — the picture. Haze, a warm key with a cool sky bounce, depth
  of field, and a split-tone grade with a vignette.
- **`scene.ts`** — turns a spec into a scene, maps every mesh to a palette
  colour by slot, and disposes the lot on the way out. A reading of fifteen
  nodes builds fifteen sets; without that it would end as a slideshow.

### The window

`diorama.ts` owns the frame directly rather than going through the React
renderer, because the look lives in a post chain and a composer wants to own
the render. Three things it has to get right:

1. **Changing scene must not leak** — geometry and materials both, every node.
2. **The camera must move, and must arrive** — it eases between viewpoints
   instead of cutting, and drifts slowly while you read, so a still frame is
   never actually still.
3. **Focus follows the subject** — the bokeh is focused on the distance from
   the camera to whatever it is looking at, re-measured every frame, so the
   soft parts stay soft and do not swim during a move.

Props marked `look` can be pointed at and will say one line. Only those are
raycast — testing the whole set every frame would check nine hundred grass
tufts to find a lamp.

## Notes

- Timing figures from this container are software rasterisation and mean
  nothing about real hardware.
