# Wind and a Bicycle

風と自転車 — a girl on a bicycle, riding an endless Japanese town through a
whole day. `src/ride/`: `path.ts` (the road), `build.ts` (the town, a chunk at a
time), `girl.ts` (her and the bicycle), `world.ts` (sky, time, camera, the look),
`sound.ts` (music and the country), `Ride.tsx` (the page). `?q=high` or
`?q=low` overrides the guess at what the machine can carry.

## The road

An endless ribbon defined by distance along it: the heading is a sum of a few
slow sines, the height another, and the centre line is integrated a metre at a
time into a table that grows as she rides. Every 380 m it changes district, in
a fixed order — the slope above the sea, the shopping street, the city, the rice
fields — and round again, different each time because everything in it is
seeded from where it is.

## The town

Built forty metres at a time as it comes into view and dropped when it is
behind; one chunk a frame, nearest first, so no frame does much work. A chunk
is a handful of unit shapes — box, cylinder, gable, hip roof, blob, plane —
each scaled, placed and coloured, then merged into one mesh per material:

- **toon** for everything solid, shaded in four flat steps;
- **glass**, dark by day and lit by night — windows, shop fronts, vending
  machines, lamps;
- **paper**, its own colour by day and glowing by night — lanterns, shop
  signboards, the konbini's stripes;
- **signs**, drawn once into an atlas of sixteen: ラーメン, 喫茶, 本屋, 居酒屋,
  花屋, 銭湯 and the rest;
- **towers**, whose windows are worked out in the shader from world position:
  darker glass by day, a hashed half of them lit by night;
- and the **wires**, a line mesh, because a Japanese street is not a Japanese
  street without utility poles and sagging cables.

## Her

A mamachari — step-through frame, basket, mudguards, a rear carrier, a
headlamp that comes on at dusk — and a black cat in the basket, looking about.
She rides in a white sailor blouse and a navy skirt, her hair in a long
ponytail with a red ribbon. Each leg is two bones solved every frame from the
hip to wherever that side's pedal has got to; the ponytail is a chain of
springs that trails behind and swings out on the bends; she leans into the
curves and rises on the climbs. At the railway crossing she stops until the
train has gone and the gates are up — and a train is always started as she
approaches, so she always meets one.

## The look

Toon shading, a sky dome that carries the sun, the moon and the stars, painted
cumulus sprites tinted by the hour, a ring of painted hills with one snowy
mountain on it, a sea below the slope town, then a composer: bloom (strong only
at night), neutral tone mapping, and a final pass that runs a Kuwahara filter —
for each pixel, the mean of whichever of four surrounding squares varies least,
which flattens regions and keeps their edges, so the frame looks painted — and
then lifts the saturation and pushes the shadows faintly violet.

The day is ten keys round the clock — midnight, before dawn, sunrise, morning,
noon, afternoon, golden hour, sunset, blue hour, night — each a sky, a light, a
fog and a cloud colour, and how far the night lights are on.

## What only showed up on screen

- **The morning was grey.** Filmic tone mapping rolls off saturated colour on
  purpose. For a picture that is about saturated colour, neutral tone mapping.
- **Night was fog.** Every shop front was a white panel metres wide at twice
  white, the bloom was tuned for the old tone mapping, and the headlamp lit the
  road like a stage. Dimmer, warmer glass; a bloom that only really wakes at
  night, and only for what is truly bright.
- **Windows by day were cardboard**, and lanterns by day were brown: one glow
  material cannot be dark glass and red paper at once. Two materials.
- **The torii spanned the road lengthways**, and the sleepers lay along the
  rails rather than across them: both were built in a frame whose x runs along
  the road.
- **The train ran through the office blocks** either side of the crossing. The
  city now leaves the railway's corridor clear.
- **A jump along the road left the camera behind**, gliding for a minute
  through the underside of the ground. `jump()` puts the camera where it
  should be and builds the town round her at once.
