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

## What you can do

- **Fly.**
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
