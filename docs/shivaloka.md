# Shiva Loka

A pilgrim's map of India in ink and wash, with a game on it. The subcontinent is
a paper relief on a wash of sea, with 111 shrines on it. Walk to one, step in,
and each is a level on its own ground, with a task taken from its story. Win and
the diary records the darshan and the story, retold with its source, and the
temple rises again in a time-lapse of its history.

`src/shivaloka/` is the whole thing:

| file | what it is |
| --- | --- |
| `ShivaLoka.tsx` | the page: title, map chrome, level HUD and cards, the diary, the thumb stick |
| `ink.ts` | the ink-wash renderer and the shared toon materials |
| `world.ts` | the map: land, relief, rivers, forest, markers, the pilgrim and the boat |
| `level.ts` | a level: its land, temple, pilgrim and task, the HUD state, and the time-lapse |
| `temples.ts` | a temple for each architectural style, plus the deity and Nandi |
| `input.ts` | keys, the on-screen stick and the action button, as one input |
| `geo.ts`, `land.json` | the projection, the coastline, the rivers and the ranges |
| `sites-*.ts`, `sites.ts`, `types.ts` | the catalogue |

## The look

The reference was an ink-wash action game: paper ground, brush outlines, flat
washes, a palette for each area, the frame torn out of a sheet and a HUD in
brush strokes. Everything is drawn with `MeshToonMaterial` on one shared
four-step ramp, so light falls in flat bands. It is rendered to a linear
texture with its depth. Then a single full-screen pass (`ink.ts`) turns that
into a painting:

- **Lines.** Ink goes where the depth or the colour breaks. For depth this is
  a second difference, not a Sobel gradient, so a floor seen at a grazing angle
  stays clean while silhouettes and creases ink up. The lines are broken by
  noise so they read as a dry brush.
- **Washes.** The colour is flattened a little and thinned towards the paper
  with distance.
- **Paper.** Grain and pigment pooling.
- **The torn sheet.** A ragged frame with a darker rim where the wash dried.
- **Wobble.** A slight wobble in every lookup.

The shader writes sRGB itself.

Each biome has its own ground, paper, trees, water and distance:

| biome | ground and water | trees | distance |
| --- | --- | --- | --- |
| coast | sand, sea | palms | |
| river | a ghat on a river | round trees | |
| snow | a snow slope, boulders and moraine | pines | snow peaks |
| hills | a temple tank | round trees | green hills |
| forest | a temple tank | thick round trees | green hills |
| city | a tank, a ring of houses | round trees | |
| island | a round island in the sea | palms | |
| plains | fields | round trees | |
| desert | dunes | none | hills |

## The map

The coastline is Natural Earth's 1:50m land, from the `world-atlas` package.
It is clipped to 60–100°E and 4–38°N, simplified, and stored as
`land.json`. The land beyond the clip box is continued, so the edge never
shows. The projection is equirectangular about 80°E, with x scaled by
cos 22°. On it are:

- **Ranges.** Instanced ink peaks along hand-traced lines: the Himalaya, the
  Karakoram and Tibet, the Hindu Kush, the Western and Eastern Ghats,
  Vindhya–Satpura, the Aravalli and the north-eastern hills. The high ones have
  snow caps.
- **Rivers.** Nine, drawn as flattened tubes.
- **Forest.** Thickest in the south and east.

The markers:

- **Jyotirlingas:** a linga under a pulsing pillar of light.
- **Other Shivalingas:** a smaller, paler linga.
- **Shakti Peethas:** a red pennant and shrine.
- **Krishna's places:** a peacock feather.

A gold ring marks a darshan earned. The markers grow as you zoom out, so they
stay readable.

Walk with WASD or the arrows, or the thumb stick on a phone, or click or tap
anywhere to walk there. At sea a boat takes over. Zoom with the wheel, pinch,
or the + and − buttons, and filter by kind with the chips. Near a shrine a card
opens; press **Enter** (Space or ✦) to play it.

## The levels

Every shrine is a level, with a difficulty from one to five dots. There are
eight kinds of task, each chosen to fit its story:

| task | what you do | e.g. |
| --- | --- | --- |
| lamps | light the lamps in order before time runs out; the next one glows | Somnath: fifteen nights of the waxing Moon |
| offer | gather offerings on the paths and bring them to the shrine | Mallikarjuna: jasmine for Mallika · Shrinathji: sweets |
| water | fill a pot at the river, sea or tank, carry it to the linga, one at a time | Kashi Vishwanath: Ganga jal through the lanes |
| trek | climb a heightfield; climbing drains your breath, and stopping or a shelter restores it | Kedarnath: the climb to Kedar (difficulty 5) |
| demon | the demon of the story winds up (he glows red), then strikes; strike back with the trishul when he is close | Mahakaleshwar: Dushana · Bhimashankar: Bhima · Nageshvara: Daruka |
| bells | stand by the bell and ring it as the mark passes through the gold | Pashupatinath: the evening aarti · Chidambaram: Nataraja's drum |
| carry | walk it to the shrine while steering to keep it level; if it tips, it stays | Vaidyanath: the linga Ravana could not set down · Jagannath |
| quiz | walk to the priest and answer three questions on the story | Udupi, Kurukshetra, Lepakshi, Ellora |

The temple is built in the site's style:

- nagara (Somnath)
- dravida, with a gopuram and enclosure (Brihadeeswarar)
- himalayan stone (Kedarnath)
- kalinga (Lingaraj)
- cave and ice cave (Amarnath)
- rock-cut (Ellora)
- the Nepali pagoda (Pashupatinath)
- Bengal's curved roof, Kerala's sloping roofs, the Rajasthani haveli (Shrinathji)
- modern
- natural, for places with no temple: Kailash with Manasarovar, and the banyan
  at Jyotisar

Every mesh carries an `order`, and the time-lapse uses it. The temple is taken
down and rebuilt piece by piece from the plinth up while the camera circles it.
A pillar of light stands first at the Shiva sites. The captions come from the
site's timeline: *by tradition — the Moon raises the first shrine, of gold;
1026 — Mahmud of Ghazni sacks the temple; … 1951 — the present temple is
consecrated*.

## The diary

The diary is the museum. Its tabs are the Jyotirlingas, the Shivalingas, the
Shakti Peethas and Krishna. Each tab opens with its common story: the pillar of
fire for the Jyotirlingas, Daksha's sacrifice for the Peethas.

Each place has a page:

- Its name in Devanagari, the place and its coordinates.
- For a Peetha: what fell, the goddess and her Bhairava.
- The story, retold, with its source.
- The timeline.
- The level.
- Buttons to **Play**, **Go there on the map**, or watch the **Time-lapse**.

Progress (darshans earned, and where you last stood) is kept in
`localStorage`.

## The catalogue, and the sources

The stories are retold in our own words, never quoted.

- **The twelve Jyotirlingas.** From the Koti Rudra Samhita of the Shiva
  Purana (chapters 14–33 in the common recension), with the chapter on each.
  Where a well-loved telling comes from elsewhere, the source line names it,
  as with the Pandavas at Kedarnath from the Kedarkhand of the Skanda Purana.
- **The other Shiva shrines.** Thirty-two, from the Shiva, Skanda and Linga
  Puranas, the Tevaram and sthala puranas. Temple histories are given as most
  historians date them, and traditional dates are marked *by tradition*.
- **The fifty-one Shakti Peethas.** Generated from the MIT-licensed
  `hindu-devotional-texts` package: the peethas it marks as among the 51, with
  the part, the Shakti and the Bhairava. Coordinates, biome, temple style,
  difficulty and task are ours.
- **Krishna's sixteen places.** From the Bhagavata and Vishnu Puranas, the
  Harivamsha and the Mahabharata, and temple tradition for the images:
  Shrinathji, Jagannath, Udupi, Guruvayur, Vithoba and Dakor.

## Credits

- Coastline: Natural Earth (public domain), via `world-atlas` (ISC).
- Shakti Peetha list: `hindu-devotional-texts` (MIT).
- Type: Cinzel, Cormorant Garamond, Tiro Devanagari Sanskrit and Noto Serif
  Devanagari (SIL OFL), shared with the other sacred pages in
  `public/fonts-sacred/`.
- Every model, texture and sound is made in code; the chimes are WebAudio.
