# Witchworld Weekly: The Earth Issue

A magazine site and a small game. Hazel Mothwick, field correspondent and
illustrator for *Witchworld Weekly*, visits Earth in 2026 for the first time
since 1974 and files ten dispatches. The site is also her portfolio. Open it
from **Effects → Witchworld Weekly**.

## The style

Loose single-weight ink on white paper, hand-lettered capitals, lots of empty
space. The style is borrowed, not the content: every drawing, character and
line of text here is original.

- **The pen** (`src/witch/pen.ts`).
  - Every line is resampled every 6 px and nudged by two octaves of 1D value
    noise.
  - The line width varies a little from stroke to stroke.
  - Every 140 ms the noise seed moves to the next of three, so the drawing
    "boils" like hand-animated line work.
  - The **Still** button holds it steady.
- **The lettering.** A single-stroke capital alphabet with digits,
  punctuation and arrows, drawn as polylines on a unit box.
  - Each letter wanders a little in size, baseline and angle.
  - Each line drifts slightly uphill or downhill, the way people write in
    capitals.
  - Text wraps and is fitted to the page, and buttons and labels use the same
    hand.
  - A full description of each view goes into the canvas's `aria-label` for
    screen readers.
- **The drawings** (`src/witch/art.ts`).
  - Hazel has a cone hat that has given up near the top, a plate brim,
    stringy hair, bell sleeves and pointy boots. Her poses are arms-up, wave,
    shrug, point, hold, write and fly.
  - Parsnip the cat sits, loafs or looks cross.
  - Humans of 2026 are drawn simply.
  - There are phones, a self-checkout, the listening cylinder, a laptop, a
    paper cup, an e-scooter, a delivery drone, Reginald the owl, a monstera,
    candles, clouds, birds, the moon, the portal and the stamps.

## The Agreeable City (the game)

Hazel's second assignment, and what the cover now opens into. Earth, 2026: a
city run by the Bureau of Agreement. Cameras watch every corner, the Kindly
Uncle smiles from every screen, and the streets are full of people who have
stopped agreeing. Hazel has to fit in, with a grey cap on and the hat in her
bag, and nod when the screens say NOD, while she quietly saves the place.

It is an original allegory about surveillance, protest and rewritten
history. It names no real country, party or person, and it borrows none of
Orwell's names or text. The Bureau owns the only red in the drawing, and
Hazel's spells are the only gold.

**Five districts** (`src/witch/orwell.ts`), each closed by a gate until its
goals are done:

1. **The Square of Consensus.** Nod twice when the screens call for it, and
   knit a woolly sock over a camera.
2. **Bread Street.** A march for affordable bread, its signs taped shut, with
   shields in front. Unmute six signs and calm the march until its anger is
   low.
3. **The Records Office.** Clerks retype last week, and the originals blow
   toward the Forgetting Chute. Catch eight true pages before they go in.
4. **The Bridge.** A riot, with stones from one side and canisters from the
   other, and a child, an old man and a dog in the middle. Turn ten missiles
   into birds, put out every fire with marigolds, and calm both sides.
5. **The Tower of the Kindly Uncle.** Fly up past the drones and turn the
   Uncle's screen into a mirror. Every screen in the city then shows its own
   street, and the city looks up.

Each cleared district files a **dispatch** to the magazine.

**Fitting in.**
- **Suspicion** rises while a camera cone or a drone sees you:
  - fast on the broom (38/s);
  - slower in the witch hat (14/s);
  - barely in the cap (2/s);
  - at a quarter of the rate while you walk inside the march.
- It falls when nobody is looking. At 100 Hazel is taken to Agreement Class,
  then released at the start of the district.
- Every 16–26 s the screens say **NOD** for 2.8 s. Missing it costs 26
  suspicion.
- Casting a spell while you are watched costs 26 suspicion too.

**Ink.** It refills at 7 per second. To cast, click or tap a target within
reach. The spells and their costs are:
- the sock, 20;
- unmute a sign, 14;
- calm, 24;
- bird, 9;
- marigolds, 14;
- turn a screen to the truth, 28.

**Controls.**
- Arrows or WASD walk; Space or ↑ goes up on the broom.
- **B** or **F** for the broom, **H** for the hat or cap, **N** to nod.
- Click to cast, and **Enter** or a tap to close a dispatch.
- On phones there is an on-screen pad: ← ↑ ↓ →, Nod, Hat/Cap and
  Broom/Land.

## What you can do

- **Earth notes (fly).** The original issue's world.
  - Use the arrows or WASD, or hold and drag on a phone.
  - The world is 9,200 units wide, with a parallax skyline. The sky turns to
    night toward the end.
  - Ten signposted stops. Fly close and press Space or tap to open the
    spread, which collects its stamp.
  - The post office is at the far end.
- **Spreads.**
  - The picture is on the left and the words are on the right: a kicker, a
    headline, the caption and the story.
  - Poke the picture and something happens. The phones all light up, the
    checkout shouts, the cylinder mishears, the familiar writes a terrible
    poem, autumn leaks from the cup, Reginald takes on the drone, the plant
    has notes.
  - On phones, the words go under the picture.
- **The issue.** Fifteen pages:
  - the cover;
  - contents, where you can tap a line to jump to it;
  - the ten spreads;
  - horoscopes;
  - classifieds;
  - the back page about the correspondent.
- **Portfolio.** All ten dispatches as a grid of thumbnails, plus her bio.
- **Post an owl.**
  - Type a card and it is lettered on the postcard as you type.
  - Send it and Reginald carries it off.
  - Save it to download the card as a PNG.
  - Nothing is sent anywhere.

Stamps are remembered in `localStorage` (`witchworld-stamps`).
