# The Hidden Girl

Ken Liu's *The Hidden Girl and Other Stories* (2020), told one story at a time
as games you scroll through. The look is a landscape architect's presentation
board:
- pale greens and warm off-white paper;
- fine stipple in every flat fill;
- round clustered trees;
- meadows of lavender, yarrow and daisies;
- pink timber;
- faceless white figures.

The camera zooms down into the picture as you scroll, the way the reference
film goes from a whole valley to one person on a boardwalk.

Only the first story, "Ghost Days", is built so far. The contents page lists
the other eighteen as *in the making*.

**Our own words.** The narration retells and reads the story in our own words.
It never uses the story's sentences. The only quotation is from *The Cloud of
Unknowing*, a fourteenth-century English text in the public domain, which
William is reading in 1905. The end card credits the story and tells the
reader to go and read it.

## Ghost Days

The story is built like the function on the colony classroom's board:

```lisp
(define (fib n)
  (if (< n 2) 1
      (+ (fib (- n 1)) (fib (- n 2)))))
```

To finish, it has to call its own past and then return. So it goes 2313 →
1989 → 1905 → 1989 → 2313, and one bronze spade coin (a Zhou-dynasty *bubi*)
passes down all three centuries. The page follows that shape:
- the call stack sits in the corner, pushing and popping `(fib 3)`,
  `(fib 2)` and `(fib 1)`;
- the camera falls into the coin, through a gold flash, to go down a level,
  and fades through paper to come back up.

| scene | call | where | what the camera does |
| --- | --- | --- | --- |
| A1 | `(fib 3)` | Nova Pacifica, 2313 | glides from the Dome and the whitewood forest down to the spade in the steam of an alien ruin |
| B1 | `(fib 2)` | East Norbury, Connecticut, 1989 | pans from the Halloween dance to the Wynnes' white house and flies in through the front window |
| C1 | `(fib 1)` | Hong Kong, 1905 | Yu Lan night: through the lantern-strung street, into Ho's antiques shop, to the workbench, then the hall laid for the ghosts |
| B2 | return | the beach, 1989 | over the dark water after Fred, through the jellyfish, towards the red mansion |
| A2 | return | the first people's city | down a street of hexagonal towers as the sun swells to white |
| A3 | return | the meadow | from Ona in the flowers, pulling right back out to the whole valley |

### The three hands

The player touches the story in three ways. Each one is a gate: the scroll
stops until you have done it, or pressed *skip*.

- **Rub.** Drag across a canvas coin to scrape its patina away. In 2313 it
  shows gold underneath, and two marks Ona cannot read yet: a character and
  two initials. In 1905 there are two coins, and one turns out bright yellow:
  new bronze, a forgery.
- **Hold.** Press and hold (or hold Space) to lift a mask and read what went
  unsaid. At the Wynnes' table: "Your English is so good!", the
  dissident story learned for the asylum interview, and a friendly face that
  slips. In Hong Kong, Mr. Dixon's "Your English is very good."
- **Trace.** Follow a dotted stroke with a finger. In 1905 you draw the
  sharp turn that makes 宇 (the universe) into 字 (writing): "between the
  World and the Word, an extra curve". On the beach you scratch F and C into
  the coin. In the meadow you weave Ona's crown of twelve branches.

After the base case there are two **choices**: which is more authentic, the
World or the Word, and what you would hand on, the true object or the better
story. The ending repeats both back to you.

### The coin as inventory

The spade sits in the corner of the screen and collects its marks as you
play:
- 字, a father's reading;
- F · C, two teenagers;
- the angular hooks of a dead people's script;
- a bright place rubbed clean, shaped like a little person.

At the end it is drawn large with all of them, like layers of patina: every
generation's reading cut into the same bronze.

## How it is made

`src/hiddengirl/` holds all of it:

| file | what it is |
| --- | --- |
| `HiddenGirl.tsx` | the contents page, and the switch into a story |
| `paint.ts` | the painter's kit, all Canvas 2D: stipple fills, blob and conifer trees, whitewood (hexagonal) trees, meadows, striped fields, water, axonometric buildings, pale figures with helmets, masks, queues and crowns |
| `stage.ts` | three.js: each scene is a diorama of painted cards at different depths, with particle systems between them and a post pass for grain, vignette, fades and the whiteout |
| `audio.ts` | a generative ambient bed for each era, plus scrape, breath and chime sounds, and an optional narrator using the browser's own voice |
| `ghostdays/scenes.ts` | the six scenes: their cards, camera keys and particles |
| `ghostdays/art.ts` | the spade coin, the six-legged people, a sheet ghost, lanterns, a paper car, braziers, alien signs and towers |
| `ghostdays/story.ts` | the beats: narration, gates and choices, and how far each one moves the camera |
| `ghostdays/Gates.tsx` | rub, hold, trace and choose |
| `ghostdays/coin.ts` | the coin drawn large: metal, marks and patina |
| `ghostdays/GhostDays.tsx` | Lenis smooth scroll, gates that stop it, the camera per beat, GSAP word-by-word narration, the call-stack HUD and the ending |

The particle kinds, each moved in one vertex shader:
- steam;
- six-winged flutter-bys;
- stars;
- embers;
- jellyfish;
- lanterns;
- motes;
- falling petals.

Only the current scene and its two neighbours stay painted on the GPU. The
next one is painted while the browser is idle.

Libraries: three.js, GSAP, Lenis and simplex-noise. The type is Cormorant
Garamond and Cinzel (SIL OFL), from `public/fonts-sacred/`.
