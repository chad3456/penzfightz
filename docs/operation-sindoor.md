# Operation Sindoor, explained

A three-minute animated explainer on the Pahalgam attack, India's strikes of
7 May 2025, the four days of fighting that followed, and the ceasefire.

`public/sindoor/index.html`, `public/sindoor/sindoor.js` and
`public/sindoor/region.js`. Plain JavaScript: no libraries, no footage, no audio
files. `scripts/render-sindoor.mjs` writes it to a video.

## How it treats a real conflict

This is about something that happened to real people, recently, between two
nuclear-armed countries whose governments tell different stories about it. The
rules it keeps:

- **Fact is the public record.** Dates, times, places and what each government
  announced, from April and May 2025.
- **Disputed things are attributed.** Casualties, what was hit, aircraft lost:
  "India says", "Pakistan said". A split screen puts the two governments' first
  statements side by side. It does not adjudicate.
- **Nobody is shown being hurt.** The dead at Pahalgam are a number and
  twenty-six candles; the strikes are dots and arcs on a map.
- **The map is schematic and says so.** Coastlines and Pakistan's boundary are
  Natural Earth's. Kashmir is shown as most international maps show it: the Line
  of Control dashed, each side labelled by who administers it. On the Kashmir
  map a note says India calls that side Pakistan-occupied Kashmir; the sources
  card says the boundaries are not authoritative.

## The cut

1. **Cold open.** 1:05 am, 7 May 2025; nine dots on a map; the name.
2. **The attack.** Baisaran, above Pahalgam, 22 April. Twenty-six killed —
   twenty-five tourists and Syed Adil Hussain Shah, the pony handler who tried
   to take a gun from one of the attackers. The Resistance Front's claim and
   retraction; India's view that TRF is a front for Lashkar-e-Taiba; Pakistan's
   denial and offer of a neutral investigation.
3. **The squeeze.** India, 23 April: the Indus Waters Treaty in abeyance, the
   Attari–Wagah crossing closed, visas cancelled, advisers expelled. Pakistan,
   24 April: airspace closed, trade suspended, the Simla Agreement put in
   question, and water called a matter of war. Nightly fire on the Line of
   Control.
4. **The strikes.** Nine sites in twenty-five minutes, each with the group
   India said used it; Bahawalpur about 100 km inside Pakistan; Muridke near
   Lahore. How each answer — 2016, 2019, 2025 — has gone further. Why the name.
   What each government said the next morning, and who gave India's briefing.
5. **Four days.** Shelling on the Line of Control and Poonch; the drones and
   missiles India says it stopped at fifteen military sites; the radar at
   Lahore; the drone swarms and the blackouts; Pakistan's Operation
   Bunyan-um-Marsoos and India's strikes on its air bases. Then the thing both
   countries have that nobody used.
6. **The ceasefire.** The DGMOs' call at 3:35 pm on 10 May; 5 pm; and the two
   accounts of how it came about.
7. **What changed.** India's figure for militants killed and Pakistan's
   dispute of it; the Indian defence chief's acknowledgement of lost aircraft;
   two lines from the Prime Minister's address of 12 May; and a new threshold.

## How it is made

**The look** is an explainer's: paper with fibre in it, cards with shadows and
tape, a yellow highlighter swiped under the words that matter, numbers that
count up, chapter slabs that wipe across. Text arrives a word at a time; words
marked `*like this*` in the script get the marker.

**The map** is drawn every frame from `region.js`, at whatever the camera is
doing: sea with engraved lines, land cut out of paper with a shadow under it,
Pakistan tinted from its boundary line closed along the coast and clipped to
land, India tinted with a wash from the middle so it has no hard northern
edge to draw. The international border is solid; the Line of Control is
dashed.

**The score is original**: a quiet electronic bed of the sort explainers run
under their narration — plucked arpeggios, a pad, a lo-fi beat that comes and
goes — and a few sounds for the graphics. It drops to a piano for the attack
and to a drone for the nuclear card.

## What only showed up on measurement

- **The attack was as loud as the strikes.** A sub-bass under every chord kept
  the somber chapter at the same level as the busiest one. It is gone from that
  chapter, and the piano carries it.
- **Two lines of the cold open sat on top of each other**, and the label for
  Pakistan-administered Kashmir fell off the top of the Kashmir map.
- **The candles were tick marks.** Twenty-six icons small enough to fit on one
  row are too small to be candles.
