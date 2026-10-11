# Walks of Life

Eight large illustrations of American life, drawn entirely in code in the manner of editorial *ligne claire*: one even ink line round every shape, flat colour inside it, a little print grain over the top. Every person in every plate has a short story; in the gallery you can zoom and pan, hover over or tap anyone to meet them, list everyone in a plate and fly to them, and download any plate at full size.

Open it from the Effects shelf (**Walks of Life**).

## The plates

| # | Plate | Manner | People |
| --- | --- | --- | --- |
| 1 | **The Reading Room** — a Carnegie-era public library on a Tuesday afternoon: long tables under green lamps, the computers, story time on the round rug, the chess table, the circulation desk | isometric cutaway | 39 |
| 2 | **The Brownstone** — a Brooklyn rowhouse cut open like a dollhouse on a Sunday evening, from the pigeons on the roof to the band in the basement and the 2 train underneath | perspective section, eleven rooms | 36 |
| 3 | **Night Shift** — 3 a.m., a trench cut through a solid block: a 24-hour diner, an ER, a parcel hub, a bakery | isometric, printed in one ink on orange | 20 |
| 4 | **The Quad** — a state university in September: the brick hall, the library steps, the oak, the fountain, a campus tour walking backwards, a taco truck, a graduate and her mother | isometric | 33 |
| 5 | **Field Trip** — a second-grade class seen from inside the aquarium's big tank | close-up, through water | 8 |
| 6 | **Wash & Fold** — a laundromat on a Sunday evening, and its cat | one-point interior, pastel | 8 |
| 7 | **The Pier** — a California pier on a Saturday morning: the fishermen, a busker, a proposal, the surfers, Tower 7 | isometric | 22 |
| 8 | **Friday Night Lights** — a small town's high-school football game, fourth quarter, under the lights | isometric, night | 19 |

The people and their stories are invented; none is a real person. The places are kinds of places, not particular ones.

## How it is drawn

- `src/walks/kit.ts` — the pen: flat fills with an even outline; **groups** that stroke every part's outline first and fill on top, so seams vanish inside one silhouette (arm into hand, thigh into shin) while the near arm keeps its line across the chest; hatching, stipple, grain; a 2:1 isometric camera with depth-sorted scenes and **plane mapping**, so anything drawn in a wall's or floor's own coordinates (books on a shelf, a notice board, lettering) lands on that plane in true isometric.
- `src/walks/pers.ts` — one-point perspective rooms for the cutaways (the brownstone, the laundromat).
- `src/walks/people.ts` — people built from a pose by forward kinematics: about thirty poses (sitting at a desk, reading, on the phone, cooking, kneeling, running, cross-legged on the floor, asleep in a chair…), turned anywhere from full face to profile, from behind; looks with seven skin tones, fourteen hair styles (including a hijab, locs, braids, balding), tops, skirts, aprons, lanyards, scarves, backpacks, glasses, beards, and hats from a baseball cap to a football helmet, a mortarboard and a band shako; faces with eyes, brows, a nose and a mouth that can smile, open, frown or sleep.
- `src/walks/props.ts` and `src/walks/sea.ts` — tables, chairs, bookcases full of books, lamps, monitors, plants, rugs, trees, benches, a dog; and a shark, a sea turtle, a manta, tangs, a grouper and schooling fish.
- One file per plate; `src/walks/plates.ts` lists them; `src/walks/WalksOfLife.tsx` is the gallery.

Each plate paints in well under half a second; the gallery paints at twice the plate's size so it stays sharp when you zoom.
