# Meter Down

*An arcade taxi game. Four minutes on the clock, four cities, and a passenger
in the back with an opinion about how you are driving.*

---

## One · The loop

Pick up a fare, get across town before the clock runs out, and flatten whatever
is in the way. Every finished fare puts time back on the shift, so a clean run
never ends and a bad one goes home early — the shift timer is not a limit, it
is the score.

There are two currencies and they buy different things. **Money** buys the car.
**Stars** — the rolling average of what your passengers thought of the journey
— are what the next city is priced in. You can grind money by driving badly and
you will not get to Shimla.

## Two · The physics is arcade and says so

There are no tyre slip curves here. There is a forward speed, a sideways speed,
and a grip budget that the sideways speed is bled off against:

```ts
vr += car.yaw * vf * dt;                       // turning throws the tail out
const bleed = Math.min(Math.abs(vr), budget * dt);
vr -= Math.sign(vr) * bleed;                   // the tyres take it back
```

Ask for more turn than the budget covers and the surplus stays as slide, which
is the entire feel of the genre. The handbrake does not add a special case: it
spends the budget a third as fast.

### Drag written backwards from the top speed

The first version tapered the engine's power with speed *and* applied a linear
drag on top, and the two met at forty-five km/h — a taxi that could not reach
half the number on its own tin. Drag is now written so that it balances the
engine exactly at the speed the car is specified to do:

```ts
const ratio = vf / s.top;
vf += (s.accel * c.throttle - s.accel * ratio * Math.abs(ratio)) * dt;
```

Terminal speed *is* the top speed, by construction, and the upgrade that raises
one raises the other.

### Collisions

Buildings are axis-aligned boxes and the car is a circle. That is wrong and
completely adequate: at these speeds the player reads a collision as "I clipped
the corner of that", and a circle against a box gets the corner right. What has
to be right is the *response* — the speed into the wall is lost and the speed
along it is kept — so scraping down a street is fast and hitting the end of one
is not.

Street furniture was originally a *speed* threshold: go faster than this and it
falls over. That sounds right and is a trap. A car at rest is going nought, so
every crate within two metres of where you started was a wall, and the first
thing the game did when you held the throttle was nothing. Either a thing can
be knocked over or it cannot. Lamp posts cannot.

## Three · The four cities

A location is not a palette swap. Each changes the pitch of the grid, the width
of the carriageway, how much is built on a block, what is standing in the road,
and how the ground behaves under the car.

| | grid | lane | what it is |
| --- | --- | --- | --- |
| Marine Drive | 78 m | 17 m | six lanes of nothing in the way and the sea on your right |
| Chandni Chowk | 46 m | 9.5 m | lanes the width of a handcart, and there is always a handcart |
| The Coast Road | 92 m | 13 m | wide, empty, and the corners come with no warning |
| The Hill Road | 70 m | 11 m | forty metres of drop, and every junction on a slope |

The grid is deliberately a grid. An arcade taxi game needs the player to see a
route across the map at a glance and commit to it at fifty, and a naturalistic
road graph — which the city builder next door does properly — is the enemy of
that.

### The hill, which is where the geometry had to get honest

Three of the four maps are flat and the fourth is not, and everything that was
fine on the flat ones broke on the hill.

- **The ground was a slab per block.** With forty metres of drop across eight
  blocks each slab sat five metres above its neighbour, and the map became a
  staircase of floating plates with their black undersides showing. The ground
  is now one grid sampled from the terrain function.
- **Roads were axis-aligned boxes.** A box cannot tilt. Each span is now a quad
  whose four corners each take their own height, so a road on a hillside is a
  ramp rather than a plank on stilts.
- **Half the roads were invisible.** The quads running one way round the block
  came out wound clockwise and were back-face culled; the ground was wound the
  same way and the map had no floor at all. The helper now works out the winding
  itself from the corners it was given, because "remember to wind this one the
  other way" is a rule that gets forgotten and this one cannot be.

## Four · Nine million triangles

The first playable build ran at about one frame every three seconds, and the
reason was one line: the parts kit's `box` is a **rounded** box. That is right
for a car and for a crate and catastrophic for a window pane — two hundred
triangles apiece, and a city's worth of windows came to 9.2 million of them.

Anything small enough that nobody will ever see its corners now gets twelve
triangles instead. The same city is 810,000, and the corners it lost were on
window panes, kerbs, road markings and the flat faces of nine-metre walls,
which have corners in life anyway.

Lit windows go through **emission**, not albedo. A window painted bright yellow
is bright yellow *multiplied by the light falling on it*, so it goes out when
the sun does — which on a night map is always. A per-vertex `aGlow` attribute
is injected into the standard material and added to `totalEmissiveRadiance`,
which is three lines of GLSL against a second material and a second draw call.

## Five · The rating

Comfort starts full and is spent. A wall costs a lot, a flattened stall costs a
little, sustained cornering costs while it lasts, and being airborne is the
worst of the four because it is the only one the passenger cannot pretend not
to have noticed. The springs decide how much of any of it reaches the back
seat, and the bull bar decides how much a flattened stall counts as an event.

Each passenger has a nerve and a hurry, and they pull in opposite directions:
the boy going to an exam will forgive anything except being late, and the woman
with the cake box will forgive being late and nothing else. Stars are comfort
minus lateness, weighted by which of the two that particular person is.

## Files

| file | what |
| --- | --- |
| `places.ts` | the four cities, as numbers |
| `world.ts` | the generator, the surfaces, and the roles-to-colours pass |
| `taxi.ts` | the model, the grip budget, and the collisions |
| `debris.ts` | two hundred recycled pieces of whatever you just hit |
| `fares.ts` | passengers, the clock, and what the back seat notices |
| `garage.ts` | upgrades, unlocks and the books |
| `stage.ts` | the scene, the camera and the shift |
| `Meter.tsx` | the garage, the heads-up display, and the keys |
