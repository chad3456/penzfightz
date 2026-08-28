# Lattu: two tops, one dish

## On the name

The duel is *beigoma*, and *lattu*, and a hundred other things. Two spinning
tops in a bowl, last one turning wins, throw theirs out and win faster — that
game is older than anybody's trademark and belongs to no one.

The bladers and spirit beasts everybody actually pictures when they hear the
word are a different matter: those are somebody's characters, and a fictional
character is copyright in a way a folk game is not. So this takes the same line
the UNO game on this shelf already takes — *"same rules, different name, because
UNO belongs to Mattel."* The game is the game. The eight bladers, the twelve
beasts and the marks on the tops are ours.

## The simulation

Hand a rigid-body engine two cylinders and a bowl and you get two cylinders
rolling into a bowl. The entire character of this game is gyroscopic, so the
physics is written by hand — about two hundred lines, fixed-step, no engine.

### The one idea that makes it read

A dish pulls a top toward the middle. A *spinning* top does not fall in; it
**precesses**, so the pull comes out ninety degrees from where you expect and
the top circles instead of dropping.

That is modelled in polar terms. The spin drives a **tangential** speed, and
Cartesian integration of that tangential motion throws the top outward exactly
as fast as the bowl pulls it in. The two balance at

```
r = want · sqrt(R / BOWL)
```

so a top turning hard rides the outer wall, and as the spin runs down the widest
orbit it can hold shrinks, and it spirals into the middle to die. Nothing is
scripted. The spiral is the equilibrium moving.

Two attempts came before that one.

- **Rotating the velocity at a fixed rate** curls the path into loops far
  tighter than the dish. Measured: both tops sank to the centre inside a second
  and ground there for the rest of the round — 80–90% of every round spent
  inside the middle fifth of the dish, and **zero** ring-outs in 864 rounds.
- **A sideways force proportional to spin** accelerates the top forever.

### Why the tops find each other

Two tops orbiting the same way at the same radius never meet. They launch from
opposite sides, so they stay opposite.

The first fix — driving the tangential speed off the beast's own "lane" — did
not work, and the reason is worth writing down: the angular rate comes out

```
ω = want / r = ORBIT · spin · lane / (lane · sqrt(R/BOWL))
```

and **the lane cancels exactly**. Every top in the game circled at the same
rate. A defence type and a stamina type went thirty seconds without touching
each other once.

So *radius* and *pace* are separate numbers now. Radius is the lane — attack
beasts ride a tight inner circle, stamina beasts ride the wall, and the player's
launch shifts theirs either way. Pace is set by weight: light tops lap heavy
ones, the paths cross, and there is a fight. It also means two rim-riders grind
out a long stamina round while two attackers hammer each other in the middle,
which is the right fight in both cases and is not special-cased anywhere.

The orbit is capped at 95% of the dish, so **nobody rings themselves out**.
Somebody has to hit you.

### Spin against spin

Every collision resolves twice. Once along the contact normal — the shove — and
once along the tangent, which is the *grind*.

The tangent term compares the two rims' surface speeds. Two same-spin tops have
rims travelling the same way where they touch, so they slip past and lose very
little. Two **opposite-spin** tops have rims tearing against each other at the
sum of both speeds, which is why a left-spin top costs you half your spin to
touch. That is not a special case in the code; it falls out of subtracting two
signed numbers.

The shove is deliberately not momentum-conserving. What you take is the other's
attack over your own defence — an attack top putting a defence top into the wall
while barely moving itself is the entire fantasy of the genre.

### Determinism

Nothing calls `Math.random`. The step is fixed at 1/120 s and sub-stepped from
the frame delta, so the result is the same on a 60 Hz laptop and a 144 Hz
monitor. A round is entirely determined by two launches and a seed — which is
also why a networked match would need to send two launches and a seed, not sixty
positions a second.

## Tuning, measured

Every number below came out of running the whole beast roster against itself,
864 rounds a pass, and reading the result rather than the feel.

| pass | median round | ring-outs | rounds under 3s | beast win rates |
|---|---|---|---|---|
| velocity-rotation precession | 20.7 s | 13% | — | 24–81% |
| polar drive, lane only | 22.5 s | 13% | — | 28–81% |
| pace split out from lane | 20.5 s | 21% | — | 28–72% |
| harder shove, orbit capped | 17.3 s | 44% | 21% | 35–78% |
| softer entry, bigger tops | **20.9 s** | **41%** | **10%** | **44–53%** |

Four things that measurement caught and no amount of playing would have:

1. **The launch was a head-on collision.** Both tops entering dead at the centre
   at full speed met at better than three metres a second and ejected somebody
   outright — a fifth of all rounds were over inside three seconds, before you
   had finished reading the names. Every launch is leaned at least a little now.
2. **The wide track was strictly worse than the tight one.** Riding the wall
   cost spin every second through a speed-proportional friction term, so in
   every matchup that never came to contact the tight track won 100–0. That term
   is now almost nothing: what a wide track costs you is that you cannot reach
   anybody, and what a tight track costs you is living where the attacker lives.
3. **Calling the beast was worse than not calling it.** 37% against 50% over
   every pairing. The homing steer was layered *on top of* the orbit drive, so
   it was fighting a system busy steering the top back round its own track — the
   beast reached its target in 21 matchups out of 144. It replaces the drive
   now, and the caller is braced for the duration. 66% against 47%.
4. **The tops were half the size they should be.** At a twelfth of the dish they
   read as buttons on a dinner plate and, more to the point, hardly ever touched.
   At a sixth — which is roughly a real top in a real dish — the win rates across
   the eight blader beasts collapsed from a 35–78 spread to **44–53**.

## The game around it

A round has exactly two decisions in it and both are made *before* anything
moves: which track to launch onto, and how hard to rip. Then one during, which
is when to call the beast.

That is not a simplification — it is what the game is. Once the string is out of
your hand you are a spectator, and the whole tension of a real match is watching
a decision you already made turn out to have been right or wrong.

Scoring follows the real thing: **two points for throwing them out of the dish,
one for simply outlasting them**, first to five. First-to-four measured out at
two-round matches, twice running.

Beat somebody and you take the beast off their back — the same trade Pen Fight
makes with the pen. Eight to collect from the ladder, four more that only turn
up once you have cleared it.

The blader and the beast are deliberately separable: the beast decides how the
fight goes, the blader decides how the *launch* goes, which is the only part you
control. Whose quirk is on which beast is most of the replay value.

## Playing it on a phone

Everything the game asks for is one press, and it was already a button — but
every prompt named a key, which is exactly the wrong thing to tell somebody
holding a phone. The labels now check for a coarse pointer and drop the key
hints when there is no keyboard to press. Both players in a two-player match get
their own button on their own side of the screen, so a hot-seat match works on
one handset.

The camera frames the dish from the **shape of the window** rather than from a
fixed field of view. A phone held upright is about 0.45 aspect; at a fixed
vertical field that leaves a horizontal field a third as wide and the dish is
cropped at both sides. So the horizontal half-angle is solved for the dish's own
radius and converted back through the aspect — and the camera also rises toward
overhead as the window gets taller, because the dish projects almost round from
up there and fills a tall frame, where the low three-quarter view that suits a
laptop leaves a shallow band with nothing above or below it.

The rest is small: `touch-action: manipulation` to kill the tap delay and
double-tap zoom, 44px minimum on every control that gets thumbed, and a smaller
masthead under 620px so the height goes to the dish.

## How to play, in the game

Six numbered steps and a controls panel, reachable from the home screen. It says
what the two pre-launch decisions actually do — inside is where the hitting
happens, outside is out of reach — what the call costs, how the two point values
work, and that the painted rings on the floor of the dish are how you read a
top's spin running down. That last one is the thing nobody would work out on
their own.

## The computer

The same two decisions, made the same way. It reads the matchup — more stamina
than you means it goes wide and waits; more attack means it comes down the
middle — and the blader's grade is how much of that read reaches its hands. A
weak blader picks a track more or less at random and rips at whatever comes.

It does not cheat. It is simply right more often, which is what losing should
feel like.

Grades are set from the measured win rate of the beast each blader carries, not
from the order they got written in — the eight land between 44% and 53%, close
enough that the player on the other side is what actually makes the sixth fight
harder than the first.

## The bladers' faces

Each of the eight is drawn by the **Two Crayons** engine — see
[`docs/two-crayons.md`](two-crayons.md) — seeded off the blader's id with the
accent pinned to their own colour, so a card and its portrait always agree.
Nothing is stored: the portrait is the id, and it comes out the same every time
because the seed does. A text card told you a blader's name and nothing about
them; this is the cheapest possible way to have eight people in the room instead
of eight rows of a table.

## The marks

Twelve emblems, none drawn by hand. Each is a radial figure whose blade count,
sweep, curl and core all come off the beast's own four stats: a heavy defensive
beast gets a few broad overlapping plates, a fast attacker gets a lot of thin
swept ones, and a left-spin beast's mark is mirrored. You can read the stats off
the sticker, which is what a good sticker does. It is printed once and used in
three places — the face of the top, the card in the case, and the thing that
rises out of the dish when the beast is called.

## Bugs worth keeping a note of

- **Every round scored twice.** The "already reported this finish" flag was
  reset from an effect keyed on `running`, which is set to false *by* the
  report — so the effect re-ran, cleared the flag, and the next frame reported
  the same finish again. A two-point ring-out ended a first-to-four match 4–0 in
  a single round. A new round is a new `Bout` object, so that is what the flag is
  keyed on now, checked in the same place it is used.
- **A yellow blob the size of the dish.** An `InstancedMesh` starts with every
  instance on the identity matrix, which for the 64-sphere spark puff is 64
  full-size spheres stacked at the origin, sitting there through the whole launch
  screen. They are parked at zero scale on mount.
- **The call button said "called" before it was ever available.** It reads the
  armed state now, not just the ready state.
- **A top drawn at the origin with no bout.** Hidden when there is nothing to
  show, rather than parked in the middle of an empty dish.

## Verification

Driven in headless Chromium against the running app, not checked by eye:

- home, roster, case, ladder, second-player pick, launch, battle and result all
  reachable and populated
- a full ladder match played to a finish: `2—0, 2—2, 4—2, 4—4, 6—4`, five rounds,
  correct two points per ring-out
- the prize path: **Angaar taken off Kabir Sen and added to the case**
- the case, the equipped beast and the beaten list survive a reload
- the wild challenger appears only once all eight regulars are beaten
- two players on one keyboard: space cannot steal the second player's rip, both
  call buttons present, each bound to its own key
- no horizontal overflow at 390px, no console errors anywhere in the above
- a full round played **by tapping only**, on a 390x780 touch viewport with a
  mobile user agent: track set, ripped, beast called, round won — and the key
  hints correctly absent from every label
