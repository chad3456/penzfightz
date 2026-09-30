# UPROAR

A game of people power. You have a megaphone, the city has seven districts,
and the goal is to take every one of them, then walk into City Hall.

It is a cartoon. Nobody gets hurt: the worst the police do is take you home,
and the worst you do is throw a party. There are no weapons, fires or broken
windows, and no real city, party or cause. The slogans on the placards are
about benches, buses, trees and the town clock.

## How it plays

- **Walk.** Click or tap a street, or use WASD / arrows. The crowd follows the
  path you walked: each follower has a place on a breadcrumb trail, so a big
  march snakes round corners behind you instead of cutting through buildings.
- **Chant** (Space). Everyone near you hears it. Each chant nudges their
  "sway" up. It nudges harder in districts that like you, when you are
  trending, and on people who have been caught in a colour cloud. When sway
  reaches 1 they join. Interest fades if you walk away. A crowd going past
  also pulls people in.
- **Sound System** (Q). A street party: citizens within 17 m dance over,
  dancers join, and traffic stops. The cars honk.
- **Mural** (E). With eight of you beside a wall, paint it. The district warms
  to you (its loyalty rises), so chanting works better there for good.
- **Beach Balls** (R). Three giant beach balls drop on the crowd. They are
  Rapier rigid bodies. Every frame, the people under a ball knock it back up,
  so a big crowd keeps them in the air. Police can't resist chasing them.
- **Colour Cloud** (F). A cloud of colour. The police lose sight of anyone
  inside it, and bystanders get swept up.
- **Umbrellas** (G). A thousand umbrellas for twelve seconds. The water cannon
  does nothing to a crowd under umbrellas.
- **Pizza** (C). Every officer within 12 m stops for a slice, for ten seconds.

**Buzz.** Every move but chanting costs buzz. It comes back faster with a
bigger crowd and while you are trending. If you go quiet for more than ten
seconds with no party on, the crowd gets bored and people start going home.

**Occupying.** Walk into a district's plaza with enough followers and hold
it. You need at least half the district's number with you, and no more than
one officer for every four of you. The ring round the plaza fills, and when
it closes the district is yours: fireworks, a flag, a buzz bonus, and half
the district's citizens nearby join. Holding a plaza brings the police
running. Take five of the six districts and City Hall opens. It needs 160
people, and it fills slowest of all.

**Heat** (the five sirens). Noise brings police: chanting, parties and
murals, a big crowd seen by officers, and above all an occupation in
progress. Heat cools when you are out of sight or small.
- Officers come in pairs from the edge of the city nearest you. Up to
  forty-eight of them.
- They pick off stragglers: any marcher with fewer than five friends around.
- Nine or more of you round one officer and they back off.
- At heat 3.6 a water cannon truck drives in and soaks the crowd. Soaked
  people go home.
- If officers reach you while fewer than five of you are close by, you are
  arrested: half the crowd goes home, and you are bailed out at the last
  place that was yours. Three arrests and it is over.

**The day.** The game starts at half past nine in the morning. A news
helicopter arrives once you are trending, and brings a searchlight after dark.
By evening the windows light up and the street lamps come on.

## Balance

The rules in `sim.ts` import nothing but `city.ts`, so a
headless bot can play them in Node. The bot:
- walks to the nearest citizens and chants whenever it can;
- throws parties and murals when it has the buzz;
- heads for the easiest plaza once it has 1.25× the numbers.

Tuned so that:
- the first district falls in about a minute;
- the crowd grows to about 150–250;
- a perfect bot wins in five to seven minutes, and sometimes loses a chance
  at City Hall or stalls there under the water cannon.

A person, reading the map as they go, takes longer.

## How it is drawn

Everything is in one React Three Fiber scene (`World.tsx`), with the game
rules in plain TypeScript (`sim.ts`), stepped from a single `useFrame`.

- **react-three-fiber.** The whole scene. The city is a few hundred
  instanced boxes. The 720 people are six instanced meshes: body, head,
  placard, stick, police helmet and umbrella. Their matrices and colours are
  rewritten every frame from the rules.
- **drei.**
  - `Sky` has its sun moved through the day.
  - `Stars` come out at night.
  - `Environment` with `Lightformer`s gives image-based light that dims at
    dusk.
- **Rapier** (`@react-three/rapier`). Beach balls are rigid bodies kept aloft
  by the crowd. Traffic cones at every other junction are
  `InstancedRigidBodies` with convex-hull colliders, and the marchers knock
  them over. Every built block is a fixed cuboid collider.
- **postprocessing** (`@react-three/postprocessing`):
  - N8AO ambient occlusion;
  - bloom on the neon, lamps, windows and fireworks, stronger at night;
  - a tilt-shift lens that turns the city into a model;
  - a vignette;
  - ACES tone mapping.

  In Light mode, AO and tilt-shift are off.
- **Shaders.** Building materials are patched with `onBeforeCompile`:
  - Windows are computed on the wall from world position: dark by day, and a
    random half of them lit at night.
  - Anything between the camera and you is screen-doored away, so a tower
    never hides the crowd.
  - The harbour is a small wave shader.
- **Effects.**
  - Chant rings.
  - Colour-cloud sprites.
  - Speaker stacks with rotating light beams.
  - 700 pieces of instanced confetti.
  - Water spray.
  - Murals painted on canvas and unrolled across the wall.
  - Fireworks: 3,000 points.
  - The helicopter's searchlight cone.
- **The overlay.** Speech bubbles, pops, honks and district labels are plain
  DOM elements from a fixed pool. Each is positioned every frame by
  projecting its point through the camera. An arrow at the edge of the screen
  points to the next objective.
- **Sound.** All of it is synthesised in WebAudio (`audio.ts`):
  - a drum line that speeds up and fills out as the crowd grows;
  - crowd murmur that rises with numbers;
  - a two-tone siren that rises with heat;
  - a bass line while a sound system is up;
  - a megaphone "hey! hey!" answered by the crowd.

## Files

- `src/uproar/city.ts`: the grid, districts, plazas, parks and the buildings
  on each lot (seeded).
- `src/uproar/sim.ts`: the rules. People, police, traffic, moves, heat,
  occupation, the tutorial objectives.
- `src/uproar/World.tsx`: the 3D scene.
- `src/uproar/Uproar.tsx`: the title, input, HUD, minimap, overlay and end
  screens.
- `src/uproar/audio.ts`: the sound.
- `public/fonts-uproar/`: Bungee and Rubik, self-hosted.

## Credits

- Bungee, by David Jonathan Ross.
- Rubik, by Hubert and Fischer.

Both are under the SIL Open Font License (licences alongside the fonts). The
game, its code, words and pictures are original.
