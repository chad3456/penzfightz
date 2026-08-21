# Pen Fight

The back-bench classic, in 3D. Two pens on a school desk, one flick each, and
whoever's pen goes over the edge loses it — for real, into the winner's tin.

Set in an Indian government-school classroom circa 2003: green distemper to
shoulder height, a mosaic floor, a ceiling fan, and a blackboard that keeps the
score in chalk while you play.

## Playing

Press your pen, drag backwards, let go. The further you pull, the harder the
flick. **Where** you press matters as much as how hard — press the middle of the
barrel for a clean push, press near the nib or the cap and the pen pivots as it
goes, which is how you get around a pen that is hiding behind yours.

Then it is their turn. One flick each, back and forth, until a pen goes off the
desk. Knock your own pen off and the point is theirs.

Three ways to play:

| Mode | What it is |
| --- | --- |
| **Practice** | Against one of seven classmates the computer plays. No pen at stake. |
| **Play with a friend** | Two players, one shareable link or a five-letter desk code. The loser hands over the pen they were holding. |
| **Challenge** | You may only challenge the player one rank above you on the class ranking. That is the whole ladder. |

## The pens

Twelve real pens from the era, each with its own mass, length, friction and
balance — the numbers are the physics, not decoration. A Hero 616 has a brass
barrel and ploughs through anything but needs a real flick to move; a Montex
Hi-Tecpoint weighs six grams and skids off the edge as easily as it reaches it.

`src/game/pens.ts` is the single source of truth. The 3D models, the SVG icons
in the tin, the physics colliders and the SQL seed for the `pens` table are all
generated from it:

```sh
npm run gen:pens   # rewrites supabase/migrations/0002_seed_pens.sql
```

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

With no backend configured the game still runs: practice matches work, and your
pen and name persist in `localStorage`. Rankings and two-player matches are
disabled.

## How it is built

- **Vite + React + TypeScript**, no router — the 3D desk mounts once and menus
  float above it on torn notebook paper, so you never leave the classroom.
- **three.js + @react-three/fiber** for the scene. Every texture is painted onto
  a canvas at runtime: the wood grain, the mosaic floor, the desk graffiti, the
  wall distemper and the blackboard. There are no image downloads and no fonts
  to fetch — the whole game is one JS bundle.
- **Rapier** for physics. Each pen is a compound rigid body — a barrel box plus
  a heavier cap box at the tail — so the centre of mass sits where the pen's
  balance says it should. A flick is an impulse applied *at a point* on the
  barrel, which is what turns a bad grip into spin instead of travel.
- **Web Audio** for everything you hear. The corridor noise, the shouting when a
  pen goes over, the bell and the clack of two barrels are all synthesised from
  oscillators and filtered noise; the class gets loud when you win a rally and
  ducks while a shot is in the air.
- **Supabase** for players, matches, rooms, the ranking and the platform
  counters on the home page. Two-player matches run over Realtime broadcast with
  the host authoritative: the host simulates and streams pen transforms, the
  guest sends only intent.

### Tuning the feel

Slide distance is cleanly quadratic in draw strength, so the entire skill curve
is set by one measured constant in `src/game/table.ts`:

```ts
export const FULL_POWER_TRAVEL = 1.25;  // metres, at full draw
```

Pens rack 0.44m apart, so below roughly 60% draw you cannot reach your opponent
at all, a knockout wants 75–85%, and at the top of the range you have enough
left over to follow their pen straight off the far edge. That risk is the game.

### Layout

```
src/
  game/     pens, desk constants, match state machine, AI, netcode
  three/    classroom, pen model, physics arena, canvas + camera
  ui/       paper sheets, pen tin, chalkboard ranking, HUD
  lib/      supabase client, identity, api, synthesised audio
supabase/
  migrations/   schema, generated pen seed, and the RPC layer
```

Add `?debug` to the URL to expose `window.__penfight` — the match store, the pen
positions, and a `flick(power, angleDeg, strike)` helper used to drive the
physics from a test run.
