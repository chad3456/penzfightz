# Jellynoor

A hill station set in jelly: a small tea estate where the terraced slopes, the
bushes, the cow, the tin roofs and everyone who lives there are made of the
same soft stuff, and where there is a full day's work to get through.

Everything is drawn in code. There are no models, no textures and no sound
files.

## Files

| File | What it holds |
|---|---|
| `src/jelly/jelly.ts` | The jelly shader, the wobble springs, blob shadows and the sky |
| `src/jelly/make.ts` | The art kit: four primitives and every prop built from them |
| `src/jelly/land.ts` | The height field, the terraces, and where the bushes go |
| `src/jelly/chores.ts` | The estate's ledger: bushes, tools, the leaf, the clock, every job |
| `src/jelly/scene.ts` | Building the ground, the water, the garden, the village and the woods |
| `src/jelly/folk.ts` | The player, the villagers and their rounds, the cow, hens and dog |
| `src/jelly/audio.ts` | Synthesised sound: the wobble note, birds, crickets, stream, rain |
| `src/jelly/world.ts` | The running game: camera, walking, interaction, weather, the day |
| `src/jelly/Jellynoor.tsx` | The React shell, HUD and touch controls |
| `src/styles/global.css` | Styles under the `jl-` prefix |

## How the jelly works

One `ShaderMaterial` does all of it, and nothing is actually transparent.

- **Light wraps** past the terminator instead of stopping at it, so nothing
  has a hard shadow edge.
- **A backlight term** lets some sun through from behind, strongest on thin
  parts seen against the light.
- **A fresnel rim** glows where the eye grazes an edge, which is most of what
  makes an opaque object read as translucent.
- **A tight specular** sits on top, like the shine on a set pudding.

Keeping it opaque means no sorting problems and no transparency overdraw, so
a garden of two thousand bushes still draws in one call.

### The wobble

Each thing carries a spring. A footfall, a pluck, a landing or a swung axe
kicks it; the spring rings and decays, and the vertex shader leans the mesh
about, strongest at the top and zero at the foot, squashing and stretching as
it goes. Instanced objects get a `JigBank`, which is the same spring per
instance written into an attribute, and only the ringing ones cost anything.

`thump(x, z, radius, force)` is what makes the world feel soft: it kicks every
bush, prop and animal within reach. Hopping is the loudest thing you can do.

## The land

One height function describes the hill. Over the tea slopes it is quantised
into benches with a short riser between them, and because it is quantised, the
bushes are planted by keeping the sample points that land on the lower part of
a bench and dropping the rest. The rows then follow the contours by themselves,
the way they do on a real estate — nobody draws a row.

The village sits on a levelled bench, the stream cuts its own smooth channel
so the terraces stop at it, and the pond is scooped out below.

## The day's work

Eighteen jobs, all through one interaction: stand near something, and hold the
work key (or the Work button) until the ring fills.

**The garden** — plant a sapling in an empty plot, water a bush that has gone
pale, pull weeds, prune one grown above the plucking table, pluck two leaves
and a bud where a flush stands proud, and look over one that is not ready.

**The leaf** — weigh the basket in at the muster shed, spread the green leaf
on the withering troughs, roll it, fire it in the drier, pack twelve kilos
into a chest.

**Everything else** — milk the cow, feed the cow, feed the hens, fill the can
at the tank or the stream, take tools off the rack, take a sapling from the
nursery, brew chai and serve it, chop firewood and stack it, hang the washing,
sweep the yard, ring the temple bell, light the lamps at dusk, and turn in for
the night.

Each job states its own reason when it cannot be done, which is how the game
teaches itself: "The can is empty. Fill it at the tank."

### The bushes

Every bush carries `age`, `water`, `weeds`, `flush` and `bushy`. They grow in
game hours: water falls faster in the sun and rises in the rain, weeds creep
in, and the next flush comes at a rate set by how well the bush is being kept.
Colour shows it — a dry bush goes yellow, a weedy one goes grey — and a pale
sprig appears when a flush is ready. Plucking before noon is worth a quarter
more, because the morning leaf is.

### The villagers

Nine of them, each with a round of chores picked by the hour: plucking the
rows, carrying baskets to the scale, working the factory, sweeping, chopping,
minding the cow, brewing chai, planting out. After dark they go home and the
estate empties.

## Performance

| | Triangles | Garden | Terrain grid |
|---|---|---|---|
| high | ~810,000 | 2,000 bushes | 232 × 232 |
| low | ~430,000 | 760 bushes | 148 × 148 |

Both draw in about 155 calls. The quality is chosen from the screen size and
pointer type, and can be forced with `?jq=high` or `?jq=low`.

Buds and weeds are packed into the front of their instance buffers and the
mesh's `count` is set to however many are actually live, so a garden with four
flushes ready draws four sprigs, not two thousand invisible ones.

## Testing

The world is on `window.__jelly` while it runs, which is what the Playwright
checks drive: teleport with `w.px`/`w.pz`, aim with `w.yaw`/`w.pitch`/`w.dist`,
hold the work key and watch `estate.stats.choresTotal`.

Note that `dt` is clamped to 50 ms a frame, so under software rendering the
world runs in slow motion. Wait on an outcome, never on the clock.
