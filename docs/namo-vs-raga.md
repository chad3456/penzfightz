# NaMo vs RaGa

A hundred rounds of banter between two vinyl-toy mascots, in the chunky,
flat-shaded, sun-baked style of Heatwave. Each round is a collectible diorama —
a round stand in the colours of where it happens, the two of them in front, the
round's props around them, a plaque with the number — and each one plays: they
move, the lines pop up over their heads, and a stamp says who took it.

`src/banter/`:

| file | what it is |
| --- | --- |
| `kit.ts` | cached materials and geometry, text on boards, a seeded random |
| `mascot.ts` | the two mascots: one rig, two heads, outfits, hats, faces |
| `poses.ts` | fifty poses, each a function of time, so each is also a loop |
| `props.ts` | about a hundred toys: things held and things that stand |
| `stage.ts` | a round as a diorama; the shared scene, lights and camera |
| `bouts.ts` | the hundred rounds, as data |
| `Banter.tsx` | the shelf, the viewer, the poster |

## The mascots

Vinyl-toy proportions: a head nearly as big as the body, stubby limbs, big
shoes. **NaMo** has white hair swept back, a trimmed white beard, rimless gold
glasses, a half-sleeved kurta and the sleeveless jacket over it, in six
combinations (and a suit, and a saffron robe). **RaGa** has dark hair greying
at the sides, a short salt-and-pepper beard, and the white T-shirt — or a
kurta, the porter's red shirt from the railway station, an aikido gi, a
bomber. They are cartoons, the silhouettes a newspaper cartoonist would draw,
not likenesses.

Both are the same rig: legs planted at the hips; an upper body that leans,
turns and sways over them; a head that nods, turns and tilts; arms with a
shoulder, a twist about the arm's own axis, and an elbow — the twist is what
lets a flexed forearm point up rather than forward. A pose sets a couple
of dozen numbers. Faces are swapped rather than sculpted: eyes that squash from wide to
shut, brows that tilt, one of eight mouths drawn on the beard, and extras —
sweat, tears, blush, an anger mark, a floating Zzz. They blink.

## The rounds

Each round is a few lines of data: a title, a setting, a pose and a face and
maybe a hat and something in each hand, props on the stand, sometimes
something in flight (balloons, snowballs, a cricket ball, paper planes — thrown
at the top of the throw and landing on the other one's head) or something
between them (the tug-of-war rope, the kite strings), two to four lines, and a
winner. Twenty-one settings, from a chai stall to the Moon.

## The rules of the banter

It is satire, and every line is invented for the toys; neither man said any of
it. Both are teased about what they are famous for — the chai, the selfies,
the yoga, the long speeches, the jackets, the monthly radio show; the Yatra,
the winter T-shirt, the Mohabbat ki Dukaan, the jalebi factory, the wink —
and both land their jabs. Nobody gets a nickname. Nothing about religion,
caste, or anybody's family, and nothing more violent than a pillow, a water
balloon or a snowball. The wins are split evenly: twenty-five each, with the
other fifty going to draws and to whoever else deserved it — the chai, the
rain, the voter, ISRO, the Constitution, the neighbours, Delhi's air.

## How it runs

The shelf renders all hundred thumbnails as the page loads, with one offscreen
renderer, a few dioramas per frame, each built into the same scene from cached
geometry and swapped out — about ten seconds even on a software renderer.
Opening a round builds it again in a live renderer; the lines are timed by
their length, the bubbles are HTML positioned over the projected heads and
stacked if they would overlap, and there is a little synthesised blip per line
and a thump for the stamp. Drag to turn the stand. Arrows step through the
rounds, space runs them all, R replays. **Save poster** draws the hundred
thumbnails onto one sheet and downloads it.
