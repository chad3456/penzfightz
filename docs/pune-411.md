# Pune 411

An open-world driving game set in the real Pune. Open it from
**Effects → Pune 411**. Add `?pq=low` or `?pq=high` to the URL to override the
quality guess.

## What is real

- **Streets.** 30,522 road pieces taken from OpenStreetMap through Overture
  Maps (transportation theme, release 2026-09-23.1). They keep the road
  classes, the street names and the one-way rules.
  - The traffic, the police, the GPS and the mission drivers all route on this
    graph with A*, so a one-way peth lane really is one-way.
  - Flyovers and bridges come from the data's `level` and `is_bridge` flags.
  - Ramps are interpolated over 90 m where a ground road meets a raised one.
- **Buildings.** 90,938 footprints from the Overture buildings theme. The 4,826
  smallest, under 14 m², are dropped.
  - Almost none carry a height, so heights are estimated from footprint size
    and neighbourhood:
    - two-to-four-storey wadas in the peths;
    - two- and three-storey colonial blocks in Camp;
    - bungalows in Koregaon Park lanes;
    - 7 to 14 storeys toward Kalyani Nagar;
    - one-storey tin roofs for the tiniest footprints.
  - Treat the heights as plausible, not surveyed.
- **Rivers and ground.**
  - The Mula, the Mutha and the Mula-Mutha come from the river polygons in the
    base theme.
  - The terrain is AWS Terrarium elevation, which is mostly SRTM. It is
    smoothed by about 40 m, because the source is partly a surface model that
    includes rooftops.
  - The riverbed is carved down to a water level taken from the lowest nearby
    ground.
  - Parvati and Vetal Tekdi appear as the hills they are.
- **Land use.** Parks, campuses, the race course, military land and the
  railway yard are painted from the land-use theme into a 4 m-per-pixel
  ground texture.
- **Neighbourhood names.**
  - Most come from the divisions theme.
  - The rest were added by hand from known coordinates: Koregaon Park, Camp,
    Budhwar Peth, Raviwar Peth, Bhavani Peth, Rasta Peth, Bund Garden,
    Sangamwadi, Parvati, Gokhalenagar, Laxmi Road, FC Road, Tadiwala Road and
    a few others.
- **Landmarks.** Positions come from the map data. Where a footprint exists
  (Shaniwar Wada, Dagdusheth, the station, Aga Khan Palace), the model is
  sized and turned to match it.
  - **Shaniwar Wada.** A fortification wall with nine bastions. The Delhi
    Darwaza faces north, with spiked doors and a passage you can walk
    through. Inside are lawns and plinths.
  - **Temples.** Dagdusheth with its strings of lights, Kasba Ganpati,
    Omkareshwar on the riverbank, Tulshibaug, Chaturshringi, and the Saras
    Baug temple on its island.
  - **Parvati.** The temple complex on top of the hill, with steps up from the
    paytha.
  - **Pune station and Aga Khan Palace.** The station has its clock tower; the
    palace has two storeys of arcades.

  All of these are simplified, original models.

## How it runs

- **Bake.** `scripts/pune/fetch.py` reads only the parquet row groups that
  overlap the bounding box straight from Overture's public S3 bucket.
  `scripts/pune/bake.py` writes compact binaries to `public/pune/` (7 MB):
  - terrain;
  - roads, as int16 half-metres with heights;
  - buildings;
  - trees;
  - water;
  - the ground texture;
  - `meta.json`.
- **Streaming.**
  - The world is cut into 256 m tiles.
  - Tiles are built around the player, one or two per frame, and dropped
    behind.
  - Each tile holds its roads, buildings, shop boards, rooftop water tanks,
    trees, street lamps, flyover girders and piers, and the metro viaduct.
- **Shaders.**
  - Windows, monsoon grime streaks, rolling shutters and lit shop counters
    are worked out in the building shader from wall coordinates.
  - Lane markings, potholes, paver footpaths and railway sleepers are worked
    out in the road shader.
  - Shops shut from 1 to 4 pm.
- **People.** The crowd is one instanced mesh per body shape (shirt and
  trousers, or saree), animated in the vertex shader: walking, running,
  riding, waving and knocked flat.
- **Traffic.**
  - Traffic follows lanes on the left of the real graph and slows for
    junctions.
  - It brakes for whatever is ahead, and honks when blocked.
  - Two-wheelers weave.
  - About 60% of vehicles are two-wheelers, with autos, cars, tempos, buses
    and the odd bicycle making up the rest.
- **Your vehicle.** Arcade physics: grip, a handbrake that lets the tail go,
  a pitch and roll that follow the ground, riding up onto decks, falling off
  them, and sinking in the river.

## Playing

- **Controls:**
  - WASD to move and steer.
  - Shift to sprint, Space to jump or use the handbrake.
  - F to get in or out, E to interact, H for the horn, R for the radio.
  - M for the map, where a tap sets a waypoint.
  - C for camera distance, T for rain, Esc to pause.
  - Drag to look around.
  - On phones: a joystick plus buttons.
- **Missions.** Ride from the station to Aaji's wada in Kasba Peth, then:
  - deliver pedhe from Laxmi Road to Koregaon Park before the 1 pm shutter;
  - chase a chain snatcher from FC Road;
  - drive the Ganpati idol from Dattawadi to Budhwar Peth without a scratch;
  - drive four auto fares from Swargate on the meter (₹26 minimum, about ₹17
    a km);
  - run up Parvati's steps in two minutes;
  - light five diyas inside Shaniwar Wada after dark, while something calls
    "Kaka, mala vachva";
  - lose three wanted stars in Sunny's SUV;
  - drive Aaji gently to Aga Khan Palace, where Kasturba Gandhi's samadhi is.
- **Side jobs:**
  - Twenty Puneri patya: original signboards written in that famously dry
    style, each with a translation.
  - Vada pav carts heal you for ₹20.
  - Garages repair, repaint and clear your wanted level for ₹300.
  - A helmet stall on Laxmi Road sells helmets.
  - Traffic police at seven big chowks fine riders without a helmet ₹500.
- **Wanted level.**
  - Taking an occupied vehicle, knocking people down and ramming police all
    add stars.
  - Police jeeps chase you along the road graph.
  - Stay out of sight long enough and the stars drop one at a time.
  - If you are busted, you are released from Faraskhana police station.
  - If you are wasted, you are discharged from Sassoon General Hospital.

## Limits

- Building heights are estimated, and footprints with holes or very complex
  outlines are simplified.
- Underground roads are drawn at street level, and foot overbridges are left
  out.
- Elevation is roughly 30 m data, smoothed.
- Traffic does not obey signals and drivers can still overlap at busy
  junctions.
- It was tested only in headless Chromium with software WebGL. That gave
  about 3 ms of simulation per frame, and 750k triangles on the low quality
  setting with a 750 m view. It has not been tested on a real GPU or phone.

## Credits

- **Map data:** © OpenStreetMap contributors (ODbL), via the Overture Maps
  Foundation.
- **Elevation:** Terrarium tiles (SRTM and other sources), from the AWS Open
  Data registry.
- **Research on transport, landmarks, the metro and city culture:**
  - [Transport in Pune](https://en.wikipedia.org/wiki/Transport_in_Pune)
  - [PMPML](https://en.wikipedia.org/wiki/Pune_Mahanagar_Parivahan_Mahamandal_Limited)
  - [Down To Earth on Pune's two-wheelers](https://www.downtoearth.org.in/air/how-india-moves-punes-roads-buckle-under-an-explosion-of-two-wheeler-traffic)
  - [Shaniwar Wada](https://en.wikipedia.org/wiki/Shaniwar_Wada)
  - [Pune Metro](https://en.wikipedia.org/wiki/Pune_Metro)
  - [Mula-Mutha River](https://en.wikipedia.org/wiki/Mula-Mutha_River)
  - [Sahapedia on Sangam Bridge](https://map.sahapedia.org/search/article/Sangam%20Bridge/3420)
  - [Caravan on Puneri patya](https://caravanmagazine.in/lede/curt-and-dry)

The people, shops and stories are made up. No real business names are used
on signs.
