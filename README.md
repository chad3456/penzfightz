# The Back Bench

Five games from the last row of an Indian classroom, the bus home, and the
pavement outside. Play the computer, or send someone a link and play them.

| Game | What it is | Seats |
| --- | --- | --- |
| **Pen Fight** | Flick your pen, knock theirs off the desk, keep the pen. Full 3D with real physics. | 2 |
| **Raja Rani Chor Police** | Four chits, four roles. The Police gets one guess at the Chor. | 2–4 |
| **Rang** | The UNO game. Skips, reverses, draw-twos, wilds, stacked draws. | 2–6 |
| **Mafia** | The village sleeps, somebody dies, everybody argues. | 4–12 |
| **The Book Stall** | Press the button, the till prints you a line of Dostoevsky. | 1 |

Every game except The Book Stall has a practice mode against computer players
and a room you can share by link. Rooms use a five-letter code, because that is
what you can shout across a classroom. The Book Stall is for one person and a
quiet minute.

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

## Rang, and why it is not called UNO

It is the UNO game — the same ruleset, including wild draw-fours, stacked draw
cards, and the penalty for not calling your last card. The name is different
because UNO is Mattel's trademark; the rules themselves are old and unowned.
The shelf says so on the card, so nobody has to guess.

The deck is shuffled fresh every round, seven cards each, and the first turn is
picked at random rather than always starting with whoever dealt.

`npm run test:rang` plays a few thousand games of it against itself and checks
the rules hold — that all 108 cards are always accounted for, that no legal play
is ever refused, that a stacked draw always resolves, that the pile reshuffles
when it runs dry, and that every game finishes with a winner holding no cards.
A browser run proves the screen works; this proves the deck does.

## The Book Stall

Cheap Soviet-printed Russian classics were sold off pavement tables outside
every Indian bus stand in the eighties and nineties, next to the exam guides.
This is that table, reduced to its last act: press the button and the till
prints you one line.

The receipt is the whole interface — thermal paper with a torn edge, a till
font, a barcode nobody will ever scan, and forty lines of stock. Draws come from
a bag rather than a die roll: every line comes out once before any line comes
out twice, and the line you just read is held back across the reset, so you can
never be handed the same one twice running. Four hundred thousand simulated
draws found zero repeats and a perfectly even spread.

What you have collected is kept in `localStorage`, so the bag survives a
refresh. There is no account and nothing goes to the server; this one is between
you and the man behind the table.

## Effects

There is a second tab on the shelf. It is not games — it is the moving parts,
one idea each, with the numbers on the card.

**Dot Field** renders text onto a six-pixel lattice as three-pixel squares and
lets the pointer push them out of the way: straight outwards, hardest at the
centre, nothing beyond a hundred and sixty-six pixels. Nothing rotates, fades
or blurs; a straight row of squares simply bends into an arc as it gets out of
the way. Scrolling leans the whole field and then moves to the next line, dots
travelling to their nearest new home rather than cutting.

Every constant in it was measured off a reference recording rather than
guessed, and [`docs/dot-field.md`](docs/dot-field.md) is the record of how —
including the two things the fitting turned up that were not obvious from
watching it, and the verification that renders the engine back at the
reference's viewport and re-derives the force law from its own output.

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
    bookstall/ the quote stock, and the receipt it prints
  effects/  the effects tab: the dot field and its measured constants
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
all. The lines in **The Book Stall** are Dostoevsky's, each printed with the
book it came from; the English wording depends on the translator, which is why
the receipt says so in its small print rather than pretending otherwise. The pen brands are named because they were real pens, the way you would
name a real football.
