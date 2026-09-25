# Ahmedabad, on a Navratri night

A real-time city: `src/ahmedabad/city.ts` (the world), `garba.ts` (the music)
and `Ahmedabad.tsx` (the page). three.js with an unreal-bloom pass; everything
else is generated when it loads. `?q=high` or `?q=low` overrides the guess at
how much the machine can carry.

## The map

Metres, x east, −z north. The Sabarmati runs north–south through the middle,
120 m wide, with a promenade a step down on each bank and a wall above it.

- **West bank.** The newer city — about fifteen hundred towers on a jittered
  grid, taller further out — and on the riverfront the garba ground: a swept
  circle 72 m across, the shrine at its centre, forty strings of lights running
  down from a central mast to a ring of poles, coloured floods from four masts,
  a stage on the river side and the entrance arch towards the city.
- **The river.** The Atal Bridge, a footbridge under a canopy of coloured
  panels on arched steel tubes; a road bridge nearer the fort.
- **East bank, the walled city.** Bhadra fort with its bastions and, inside,
  the temple of Bhadrakali, the city's guardian goddess; the Maidan-e-Shahi
  running east to Teen Darwaza, lined with stalls; the Jama Masjid just
  beyond; Sidi Saiyyed's mosque north of the fort with its window; and the
  pols, lane after lane of narrow houses with carved balconies and lights
  strung across, round a chowk with its own garba.

The layout follows the real one in order and direction; the distances are
squeezed so it fits in one flight.

## How it is made

**Lights that are not lights.** A real night city would need thousands of
lights and no renderer can afford that. Here there are seven. Every bulb —
twenty-odd thousand of them on the high path — is an instance of one small
icosahedron whose colour is set brighter than white; the bloom pass turns
anything that bright into a glow. Each string chases: a wave of brightness
runs along it, set per bulb every frame.

**Windows from arithmetic.** The building material is a standard material with
a few lines added to its shader: from the world position and the face's
normal it works out which window cell and storey a fragment is in, whether it
is inside the window or the wall, and — by hashing the cell — whether anybody
is home. So a tower is one scaled box, and the old city's houses use the same
trick with smaller, warmer, more often lit windows.

**Garba, as geometry.** Each dancer is two instanced meshes — the cloth,
coloured per dancer, and the skin — sharing one transform. Every phrase of six
steps they travel for the first half and turn once on the spot for the second,
the skirt flaring as they turn; each ring goes the opposite way to the one
inside it. With the music on, the clock they keep is the music's own.

**The jali** at Sidi Saiyyed is drawn once into a canvas: a trunk that splits
into branches that split again, curling at the tips, inside the arch, lit
from behind.

**The garba** is sixteen bars of 6/8, rendered once into a buffer and looped:
dhol, claps that are never quite together, manjira, harmonium on Sa and Pa, and
a shehnai — a sawtooth pushed through a resonance, with glides between notes —
playing an original tune in Khamaj. A crowd underneath. Its volume follows the
camera's distance from the nearest garba.

## What only showed up on screen

- **The west bank read as snow.** Windows at full strength, forty per cent lit,
  under bloom, turned every tower into a block of light. Fewer, narrower, dimmer.
- **The dupatta stood up like a plank** off every dancer's back. It hangs now.
- **The pol camera was inside a house**, and the Teen Darwaza camera behind a
  row of rooftops. Both were placed from the lane plan rather than by guessing.
- **No pol lane had lights on the low-quality path.** The test for every other
  lane was `z % 52 === 0`, and the lanes are at −380 + 26k, which is never a
  multiple of 52.
- **The nearest bulbs blew out** into white hexagons in the pol lanes. Smaller
  and less bright; a bulb a metre away should still look like a bulb.
