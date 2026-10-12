# Mind Maps

Ten psychological and mental models drawn as scenes, in the same clean-ink, flat-colour manner as *Walks of Life* (and with the same people, props and pen). Each plate has a title panel with a one-line definition and its source, numbered badges on the drawing, and a key. In the gallery, hover over or tap a number (or a person) to read the fuller explanation; zoom, pan, list every note and fly to it, and download any plate at full size.

Open it from the Effects shelf (**Mind Maps**).

| # | Model | Drawn as | Source |
| --- | --- | --- | --- |
| 1 | **The Iceberg**: behaviour, coping stances, feelings, feelings about feelings, perceptions, expectations, yearnings, self | an iceberg cut through the waterline, divers going down with torches | Virginia Satir, *The Satir Model* (1991) |
| 2 | **Circles of Control**: what I control, what I can influence, what I can only watch | an isometric garden, a walled ring of neighbours and friends, and a ring road of weather, news and the economy | Epictetus, *Enchiridion*; Stephen Covey (1989) |
| 3 | **The Hierarchy of Needs**: physiological, safety, belonging, esteem, self-actualization, and a note that it is not a strict ladder | a stepped house of five floors | Abraham Maslow, "A Theory of Human Motivation" (1943) |
| 4 | **The Spotlight Effect** | a lecture hall seen from the lectern as a latecomer walks in | Gilovich, Medvec & Savitsky (2000) |
| 5 | **Survivorship Bias** | Abraham Wald's hangar: a plane full of holes, the chalkboard, and the planes that never came back | Statistical Research Group, Columbia (1943) |
| 6 | **Chesterton's Fence** | a reformer with a sledgehammer at a gate; the reason, over the rise | G. K. Chesterton, *The Thing* (1929) |
| 7 | **The Map Is Not the Territory** | a hiker's 2009 trail map beside the land as it is now | Alfred Korzybski (1931, 1933) |
| 8 | **Comfort, Learning, Panic** | an island, its shallows and the storm beyond | Tom Senninger (2000); Karl Rohnke; Lev Vygotsky |
| 9 | **The Eisenhower Matrix** | four rooms of one house on a Tuesday evening | Eisenhower (1954); Stephen Covey (1989) |
| 10 | **The Sunk Cost Fallacy** | a cinema, an hour into a terrible film | Arkes & Blumer (1985); Arkes & Ayton (1999) |

The explanations summarise each model as its authors framed it, and say where the evidence is mixed (Maslow's strict ordering, for example, is weaker than the idea of universal needs). People in the scenes are invented.

## How it is made

- `src/models/note.ts`: the title panel (it shrinks long titles to fit), numbered badges that double as hotspots, the key, speech and thought bubbles, and text wrapping.
- `src/models/rooms.ts`: putting people into one-point cutaway rooms.
- One file per model in `src/models/`; `plates.ts` lists them; `MindMaps.tsx` is the gallery, which shares its viewer with *Walks of Life* (`Gallery` in `src/walks/WalksOfLife.tsx`).
