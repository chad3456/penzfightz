# The Koi Pond

A realistic garden koi pond you can play in, rendered live in the browser (effect `koi`). Touch the water, toss stones, feed the koi, float leaves, lily pads, paper boats and lanterns, add your own koi, and switch on rain, a breeze, dusk or night. Everything is procedural: there are no image files and no models.

## What you can do

| Tool | What happens |
|---|---|
| Touch | Drag through the water to make ripples. Floating things get carried along, and the koi drift over to see your hand, as pond koi learn to. Tap a koi to see its name, variety and length, and to release it. |
| Stone | Lobs a pebble in from in front of you. It splashes, throws up a crown of droplets, sinks with a trail of bubbles and stays on the floor. Koi nearby bolt. |
| Feed | Scatters a handful of floating pellets. Koi within a few metres turn, rise and gulp them at the surface with a little ring and a sound. Uneaten pellets sink after about half a minute. |
| Leaves | Maple, ginkgo, cherry leaves and petals flutter down onto the water. |
| Lily pad | A pad (sometimes flowering: white, pink or yellow). Pads stay loosely tethered to their stems. |
| Boat | A folded paper boat. It turns to sail downwind. |
| Lantern | A floating paper lantern that glows after dark. |
| Add koi | Choose one of ten varieties (or "Surprise me"), optionally with butterfly fins, then tap the water. Up to 36 koi. |

Toggles: **Rain** (overcast light, drops, rings, hiss), **Breeze** (gusts, cat's-paws on the water, falling blossom, drifting boats), **Day / Dusk / Night** (night lights the stone lanterns and brings out fireflies and stars), **Sound**, **Photo** (downloads a PNG), **Tidy** (clears added things and stones, keeping the koi and lilies) and **View** (resets the camera).

Camera: right-drag to turn and scroll to zoom. On touch screens, use two fingers. One finger is always the tool. On a portrait phone the camera turns so the pond runs lengthways.

Your koi and the time of day are saved in this browser (`localStorage`, key `koi-pond-v1`).

## How it is made

### The water (`src/koi/pond.ts`, `src/koi/water.ts`)

- **Outline:** an ellipse with a few low harmonics, as a signed-distance function (`pondSDF`) with a GLSL copy. The floor slopes from a short lip to a wall, then to a rolling bottom about 1.15 m deep.
- **Ripples:** a damped wave equation on a 180 × 126 height grid (8 cm cells), stepped at a fixed 60 Hz: `next = (2h − prev + c²∇²h) · damping`. Cells outside the waterline stay at zero, so waves reflect off the banks. The shallow margin damps a little more. Each frame the grid is uploaded as a half-float texture.
- **Three passes per frame:**
  1. **Reflection** (high quality only): the garden and sky from a mirrored camera, clipped to above the water, at half resolution.
  2. **Refraction:** everything below the waterline (floor, koi, sunken stones, the underside of floating things) into a colour + depth target.
  3. **The frame:** the garden, with the water surface on top. It is displaced by the height grid and does the following:
     - bends the refraction lookup by the surface slope;
     - absorbs light per channel by how much water each ray passes through, and adds a little green-teal scattering;
     - mixes in the reflection by Fresnel;
     - adds sun glitter from a finer layer of facets, hidden where the canopy shades the water.
- **Caustics** (`src/koi/caustics.ts`): two drifting, warped cell networks for constant shimmer, plus the ripple grid's own curvature, so every ring you make sweeps a bright ring across the floor. They brighten only direct sunlight, so shadows stay shadows. The floor, rocks, sunken stones and the koi all receive them.

### The koi (`src/koi/koi.ts`)

- **Body:** a lofted mesh from width and height profiles: full shoulders, a narrow peduncle and a rounded snout cap.
- **Fins:** a forked tail, a long dorsal, pectoral fins on hinges (they scull when slow and fold back when fast), and pelvic and anal fins. All are translucent with fin rays painted in.
- **Swimming:** a travelling wave runs from head to tail in the vertex shader, with amplitude and beat tied to speed, plus a curve when turning. The shadow depth material bends the same way.
- **Patterns:** each fish's texture is painted from a seed, so every kohaku is different. The ten varieties:
  - kohaku: red patches on white, stepping along the back;
  - Taisho sanke: kohaku plus small black spots;
  - showa: black with red and white;
  - tancho: one red circle on the head;
  - yamabuki, platinum and orenji ogon: solid metallic;
  - asagi: blue net-scaled back with red cheeks and sides;
  - shusui: scaleless blue, with one row of big scales;
  - chagoi: tea-brown and net-scaled.

  A scale normal map and painted scale rims (fukurin) go over the top.
- **Behaviour:**
  - wander, and keep clear of the walls by looking ahead along the outline;
  - avoid the boulders, keep a little room from one another and loosely school;
  - come to a hand in the water;
  - rise to food;
  - bolt from splashes;
  - leave a faint wake when near the top.

### Floating things (`src/koi/floaters.ts`)

Everything floating rides the simulation:
- **Forces:** each piece is pushed downhill by the surface slope and bobs with its height. Wind (by how much each kind catches it), a slow pump current and drag also act on it.
- **Collisions:** pieces bump into each other, the banks and the boulders.
- **Lily pads** stay tethered to where they were placed.
- **Falling things:** leaves and petals tumble down first and land with a small ring. Petals keep falling from the cherry, faster in a breeze.
- **Rendering:** each kind is one instanced mesh.

### The garden (`src/koi/garden.ts`, `src/koi/textures.ts`)

- **Ground:** a lawn, moss and soil shader. Pebble, grass and soil textures are painted on canvases at load, and a far lawn runs on into the fog.
- **Rocks and stones:**
  - granite boulders (noise-displaced, with ridged detail);
  - moss on upward faces;
  - a wet, darkened band and algae at the waterline.
- **Plants:**
  - instanced grass tufts and irises with violet flowers;
  - ferns, azaleas and evergreen mounds;
  - all swaying in the wind.
- **Trees:** a cherry in blossom and a Japanese maple, grown by recursive branching with clumps of foliage cards.
- **Features:**
  - two yukimi stone lanterns, lit at night;
  - stepping stones;
  - a bamboo spout that keeps pouring into the pond (continuous ripples and bubbles).

### Sound (`src/koi/audio.ts`)

All synthesised with Web Audio:
- the spout's trickle and the low tone of the water;
- plips, splashes and gulps;
- rain and wind;
- birds by day and crickets at night.

Sound is off until you turn it on.

## Performance

- **CPU:** the simulation and AI take about 1.4 ms per frame with rain and breeze on (measured headless).
- **GPU:** the main cost is the three render passes plus shadows. Phones and narrow windows start in low quality: no planar reflection, a coarser surface mesh, fewer grass tufts and leaf cards, and a smaller shadow map.
- **URL override:** `?kq=low` or `?kq=high`.

## Testing hooks

`window.__koi = { world, stop(), step(n, dt) }`:
- `world` is the `PondWorld`;
- `stop()` halts the render loop;
- `step(n)` advances and renders deterministically.

The headless screenshots for this page were made that way, with SwiftShader.

## Credits and originality

The scene, art and code are original. It was inspired by the general idea of an interactive koi pond, but no names, art or assets were taken from any existing pond app or game. Koi variety names and descriptions are standard terms in koi keeping.
