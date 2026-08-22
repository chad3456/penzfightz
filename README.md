# The Back Bench

Four games from the last row of an Indian classroom, and the bus home. Play the
computer, or send someone a link and play them.

| Game | What it is | Seats |
| --- | --- | --- |
| **Pen Fight** | Flick your pen, knock theirs off the desk, keep the pen. Full 3D with real physics. | 2 |
| **Raja Rani Chor Police** | Four chits, four roles. The Police gets one guess at the Chor. | 2–4 |
| **Rang** | The colour-and-number card game. Skips, reverses, draw-twos, wilds. | 2–6 |
| **Mafia** | The village sleeps, somebody dies, everybody argues. | 4–12 |

Every game has a practice mode against computer players and a room you can share
by link. Rooms use a five-letter code, because that is what you can shout across
a classroom.

## Pen Fight

Press your pen, drag backwards, let go. The further you pull the harder the
flick, and **where** you press matters as much as how hard — press the middle of
the barrel for a clean push, press near the nib or the cap and the pen pivots as
it goes, which is how you get around a pen hiding behind yours.

Then it is their turn. One flick each until a pen goes off the desk. Knock your
own pen off and the point is theirs. In a two-player match the loser hands over
the pen they were holding, and it goes into your Camlin box.

### The pens

Twelve real pens of the era, each with its own mass, length, friction and
balance — the numbers *are* the physics, not decoration. A Hero 616 has a brass
barrel and ploughs through anything but needs a real flick to move; a Montex
Hi-Tecpoint weighs six grams and skids off the edge as easily as it reaches it.

`src/game/pens.ts` is the single source of truth. The 3D models, the SVG icons,
the physics colliders and the SQL seed are all generated from it:

```sh
npm run gen:pens   # rewrites supabase/migrations/0002_seed_pens.sql
```

The good ones — Flair Carbonix, Hero 616, the Trimax — do not lie in the tray
with the rest. They go in the rack in the lid of the Camlin box, on display,
which is exactly where they went.

### Tuning the feel

Slide distance is cleanly quadratic in draw strength, so the whole skill curve
is one measured constant in `src/game/table.ts`:

```ts
export const FULL_POWER_TRAVEL = 1.25;  // metres, at full draw
```

Pens rack 0.44m apart, so below about 60% draw you cannot reach your opponent, a
knockout wants 75–85%, and at the top of the range you have enough left over to
follow their pen off the far edge.

Draw **power** is measured in screen pixels, not metres of desk. The desk
recedes under a pitched camera, so measuring in world space made an upward flick
read full strength almost immediately; pixels are what the hand actually
controls. Aim *direction* is still solved in table space, so pointing is exact.

## Running it

```sh
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production bundle
npm run preview
```

The Supabase URL and publishable key in `.env` are public by design — every
table is behind RLS with select-only access, and every write goes through a
`SECURITY DEFINER` function. Point `.env` at your own project and apply
`supabase/migrations/*.sql` in order if you fork it.

With no backend configured every game still runs against the computer, and your
name and pens persist in `localStorage`. Rankings and friend rooms are off.

## How it is built

- **Vite + React + TypeScript**, no router. Pen Fight mounts a 3D classroom;
  the other three float on torn notebook paper over a still version of the same
  room, so you never feel like you left it.
- **three.js + Rapier** for Pen Fight. Each pen is a compound rigid body — a
  barrel box plus a heavier cap box at the tail — so the centre of mass sits
  where the pen's balance says. A flick is an impulse applied *at a point*.
- **Every texture is painted onto a canvas at runtime**: wood grain, mosaic
  floor, desk graffiti, wall distemper, and a blackboard that keeps the live
  score in chalk. No image downloads, no web fonts.
- **All audio is synthesised** in Web Audio — corridor ambience, kids shouting,
  the bell, pen-on-pen clacks that scale with impact, cards, chits and a
  nightfall drone. Nothing is sampled.
- **Supabase** for players, rooms, per-game rankings and the counters on the
  shelf.

### Multiplayer, and keeping secrets

Every game that seats more than one person runs the same way: one browser hosts
and owns the truth, everybody else sends intent and renders what comes back.

That is fine for Pen Fight — both pens are on the table in plain sight. It is
not fine for a hand of cards or a Mafia role, because every browser in the room
receives every broadcast message. So each player generates an ECDH keypair on
join, and the host encrypts each seat's private slice to that seat alone
(`src/arcade/crypto.ts`). Everyone receives the ciphertext; only the intended
seat can read it.

This protects players from each other, which is the threat that matters at a
school desk. It does not protect anyone from a dishonest host, who is running
the game and necessarily knows everything — the same trust you gave whoever was
dealing.

### Layout

```
src/
  arcade/   the shelf, the shared room layer, per-seat encryption
  games/
    penfight/  the 3D desk game
    rajarani/  chits and one guess
    rang/      the card game
    mafia/     roles, nights, votes
  game/     pen specs, desk constants, Pen Fight's match engine and AI
  three/    classroom, pen model, physics arena, camera
  ui/       paper sheets, the Camlin box, chalkboard ranking, HUD
  lib/      supabase client, identity, api, synthesised audio
supabase/
  migrations/   schema, generated pen seed, RPCs, and the multi-game arcade
```

Add `?debug` to the URL to expose `window.__penfight` — the match store, pen
positions, and `flick(power, angleDeg, strike)` for driving the physics from a
test run.

## A note on names

**Rang** is the colour-and-number card game everyone has played under some name
or other; the rules are old and unowned, and this is not anybody's branded deck.
**Mafia** and **Raja Rani Chor Police** are traditional games with no owner at
all. The pen brands are named because they were real pens, the way you would
name a real football.
