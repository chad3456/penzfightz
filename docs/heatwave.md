# Heatwave

A police-chase arcade game, prototyped in the browser from a design document
written for Unity and the TopDown Engine. The Unity project is not here, so this
is the same game built directly in three.js, to find out whether the feel is
right before any of it is ported. Every number that matters is in one file,
laid out so it can be copied straight into ScriptableObjects.

`src/heatwave/`:

| file | what it is |
| --- | --- |
| `config.ts` | every tunable: vehicles, AI, wanted levels, damage, score |
| `physics.ts` | arcade car physics on the ground plane; circles and boxes; impacts |
| `arena.ts` | the desert: mesas, rocks, a ghost town, wrecks, fences, cacti, barrels, ramps, the skid layer |
| `cars.ts` | the hot rod and its driver, the police car, the interceptor, sirens |
| `ai.ts` | the police |
| `fx.ts` | particles, debris, screen shake, the score pop-ups |
| `audio.ts` | everything you hear, synthesised |
| `game.ts` | the loop and the rules |
| `Heatwave.tsx` | the page: stick, HUD, start and end screens, tuning panel |

## Controls

One thumb. Put it down anywhere and a stick appears under it; push the way you
want the car to go *on screen*, and it turns to go that way. Lift off and it
keeps going the way it was pointing. The car never stops and has no brake: the
throttle is always on, which is what the design asks for and what keeps it one
thumb. Arrows or WASD do the same on a keyboard, as screen directions rather
than tank controls. T (or `?tune` in the address) opens the tuning panel.

## The car

Not a rigid body. Each step the velocity is split into the part along the
car's nose and the part across it. The forward part is pushed towards top
speed, with drag. The sideways part decays, and **grip** is how fast: at low
speed or with the wheel straight it goes quickly and the car tracks, at speed
with the wheel over it goes slowly and the back steps out. That one line is
the drift, and `lateralGrip` and `driftFactor` are the two knobs on it. Turn
rate grows with speed along `turnCurve`, so parking-speed turns are not
twitchy. A hard hit knocks `control` down and adds spin, and `recoverySpeed`
is how fast the car is yours again.

Collisions are circles for cars and circles or rotated boxes for everything
else. Car against wall reflects the closing velocity with `collisionForce` as
the bounce; car against car is a mass-weighted impulse plus a twist from where
it landed. The closing speed of every contact is returned, and that one number
drives damage, sparks, shake, hit-stop and the sound.

## The police

They are meant to be beaten, and the design is in how.

- They **aim ahead** — where the player will be a fraction of a second from
  now, a fraction that grows with wanted level. So they cut corners and commit
  to lines, and a late swerve leaves them pointing at whatever was behind you.
- They **look ahead** with three feelers, but only for the big obvious
  things: mesas, rocks, buildings, the canyon wall. Not for fences, cacti,
  barrels — or each other.
- A quarter of the time they **don't look at all** for that decision.
- They **decide a few times a second**, not every frame, so they overshoot.
- Wedged against something, they back out for most of a second.

A cop dies when its hull runs out, and only the world does that: walls, rocks,
barrels and other cops hurt them a lot, the player's car barely. A dying cop's
explosion hurts and throws the cars round it, which is how a pileup starts. At
three stars the navy **interceptors** start turning up: faster, sharper, better
at predicting, and made of less.

## The heat

Heat is time plus score. Five levels:

| stars | heat | police | their speed | interceptors |
| --- | --- | --- | --- | --- |
| ★ | 0 | 2 | 80% | — |
| ★★ | 1,800 | 4 | 90% | — |
| ★★★ | 5,500 | 6 | 100% | 8% |
| ★★★★ | 12,500 | 9 | 107% | 30% |
| ★★★★★ | 24,000 | 12 | 114% | 50% |

New cars come in from the edges of the arena, never within 48 m of the player,
one every 0.9 s until the count is made up. Wrecks burn for 2.6 s and are
cleared away; broken fences and cacti grow back when nobody is looking.

## Score

- survival, 10 a second;
- a cop destroyed, 250; another within 1.6 s is a **double** (350), then a
  **triple** (400), then a **pileup** (1,000 each);
- a **close call** — a cop through the space beside you, fast, without
  touching — 100;
- a drift held longer than 0.8 s, 120 a second of it when it ends;
- off a ramp, 150.

The best score is kept on the device.

## Feel

Screen shake is trauma, squared, decaying, so small knocks barely register and
big ones rattle. A destroyed cop freezes the game for 75 ms, which is most of
why it feels like it hit something. A chain of three pulls the camera in for a
moment. When the player dies the world goes to 30% speed for a second and a
half before BUSTED.

The camera is fixed in direction — up the screen is always the same way, so
the stick always means the same thing — tilted 62° from flat, leading the car
by where it is going, pulling back with speed. In portrait it backs off until
the road across the screen is wide enough to read.

Effects: dust at speed, skid marks painted into a canvas laid over the sand
that fade slowly, drift smoke, sparks, damage smoke, explosions, scorch marks,
and pooled debris. Sounds: an engine that climbs with speed, tyre squeal with
the slide, a siren per car — wail or yelp, panned where it is, faster and more
of them as the heat rises — and knocks, crunches, explosions, the whoosh of a
close call, score blips, the wanted sting and the end.

## Performance

Aimed at sixty on a mid-range phone. Everything in the arena that never moves
is merged into one mesh per material after it is built — the arena goes from
four hundred-odd meshes to a handful plus the breakable props, and a busy
frame draws in well under a hundred calls; the cars are pooled — twelve
police and five interceptors built once and reused — and so are the particles
(two point clouds), the debris (one instanced mesh), the pop-ups and the
off-screen arrows. No allocation in the hot loop to speak of, no textures but
the sand and the skid layer, no shadows but blobs. Physics runs in fixed small
steps so a slow frame does not tunnel a car through a wall.

## The driver

The design document asks for the player to look like a specific real
politician. The prototype has a caricature driver — white hair and beard,
glasses, saffron kurta and sleeveless jacket — as "The Boss", and a desert
"Outlaw" in a hat and bandana, switched
on the start screen; the driver is one function in `cars.ts`. A recognisable
real person as the hero of a game about fleeing the police is the sort of thing
app stores and lawyers have opinions about, so it is kept swappable.

## Porting

The Unity side maps directly: `VehicleTuning` → a ScriptableObject per vehicle;
`AI`, `WANTED`, `DAMAGE`, `SCORE` → one config asset each. `Vehicle.step` is
the body of a `FixedUpdate`. The police logic is one function of the cop, the
player and the obstacle list, and has no state the TopDown Engine's AI brain
could not hold.
