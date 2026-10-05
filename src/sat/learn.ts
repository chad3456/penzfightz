/**
 * The handbook: how a satellite works, subsystem by subsystem, and how they
 * depend on one another. Written to be read alongside the builder.
 */

export type Lesson = { id: string; title: string; kicker: string; paras: string[]; numbers?: [string, string][]; fails?: string[]; real?: string };

export const LESSONS: Lesson[] = [
  {
    id: 'orbits', title: 'Orbits: falling and missing', kicker: 'Why satellites stay up',
    paras: [
      'A satellite is falling towards the Earth all the time; it is just moving sideways so fast that the ground curves away beneath it as quickly as it falls. At 400 km that takes about 7.7 km/s, once round the planet every 92 minutes.',
      'Higher orbits are slower: the period grows with the orbit size to the power 3/2 (Kepler\'s third law). At 20,200 km, GPS satellites take 12 hours; at 35,786 km an orbit takes one sidereal day, so a satellite above the equator appears fixed in the sky (geostationary).',
      'The Earth is not a perfect sphere. Its equatorial bulge (the J2 term) slowly swings an orbit\'s plane around. Tilt the orbit to about 98° and the swing is exactly one turn a year, matching the Sun: a sun-synchronous orbit, which passes over every place at the same local time.',
      'The common families: LEO (160–2,000 km: imaging, constellations, space stations), SSO (a polar LEO for Earth observation), MEO (navigation), GEO (communications, weather), and HEO/Molniya (long dwell over high latitudes). Rockets often drop satellites in a transfer orbit, such as GTO, from which they finish the climb themselves.',
    ],
    numbers: [['LEO speed', '~7.5–7.8 km/s'], ['ISS period', '~92 min'], ['SSO inclination at 700 km', '~98.2°'], ['GEO altitude', '35,786 km'], ['Worst LEO eclipse', '~35 min of ~95']],
  },
  {
    id: 'power', title: 'Power: sunlight, batteries and the eclipse', kicker: 'Electrical power subsystem (EPS)',
    paras: [
      'Solar cells turn sunlight (1,361 W/m² above the atmosphere) into electricity; modern triple-junction gallium-arsenide cells manage about 30%. A power-conditioning unit regulates the bus voltage (often 28 V, or 100 V on big GEO satellites), charges the battery and switches power to every other subsystem.',
      'In LEO a satellite spends up to a third of each orbit in Earth\'s shadow. The battery carries everything through the dark, and the arrays must make enough in sunlight to run the loads and refill it, after losing a little efficiency each year to radiation.',
      'Battery life depends on how deeply it is drained each cycle. A LEO satellite cycles about 5,500 times a year, so it is designed to use only 20–30% of its charge per eclipse. A GEO satellite sees only ~90 eclipses a year and can go much deeper.',
    ],
    numbers: [['Solar constant', '1,361 W/m²'], ['Cell efficiency', '~30%'], ['Li-ion energy density', '~150 Wh/kg'], ['Array degradation', '~2–3% per year']],
    fails: ['Arrays that never deploy', 'Battery flat before first contact', 'Slip-ring or drive failures on tracking wings'],
    real: 'The ISS\'s arrays make about 240 kW at their peak; a 3U CubeSat makes 5–20 W.',
  },
  {
    id: 'adcs', title: 'Attitude: knowing and controlling which way you point', kicker: 'Attitude determination and control (ADCS)',
    paras: [
      'Sensors work out the orientation: sun sensors and magnetometers for a few degrees; Earth-horizon sensors for nadir pointing; star trackers, which photograph the sky and match star patterns, for arcseconds; and gyros to carry the solution between updates.',
      'Actuators turn the spacecraft. Magnetorquers (electromagnets) push against Earth\'s field: weak but free. Reaction wheels are flywheels: speed one up and the satellite turns the other way. Control moment gyros tilt a spinning wheel for big, fast torques. Thrusters work anywhere but use propellant.',
      'Small torques never stop: gravity pulls harder on the near end of a long satellite, the thin air drags, and sunlight pushes. Wheels soak up this momentum by spinning faster until they saturate, and then it must be dumped with magnetorquers (in LEO) or thrusters.',
      'The very first job after separation is to stop the tumble from the separation springs. A simple law called B-dot (drive the magnetorquers against the rate of change of the measured magnetic field) does it with nothing but a magnetometer and coils.',
    ],
    numbers: [['Sun sensor', '~1–5°'], ['Star tracker', '~2–30″'], ['Hubble pointing stability', '0.007″'], ['Tip-off rate', 'a few °/s']],
    fails: ['Wheel bearing wear (Kepler lost two wheels)', 'Star tracker blinded by the Sun', 'Saturation without a way to dump momentum'],
  },
  {
    id: 'comms', title: 'Communications: the only way in or out', kicker: 'TT&C and payload data',
    paras: [
      'Every satellite needs a telemetry, tracking and command (TT&C) link: commands up, housekeeping data down, plus ranging so the ground knows where it is. Low-rate, wide-beam radios (UHF, S-band) work whatever the attitude, which matters when something has gone wrong.',
      'Payload data needs speed: X-band and Ka-band transmitters with pointed antennas reach hundreds of megabits to several gigabits per second, and lasers more. But a LEO satellite is over a ground station for only ~10 minutes at a time, a few times a day, so data waits in an on-board recorder between passes. Polar ground stations see polar orbiters on almost every orbit.',
      'A link budget adds it up in decibels: transmitter power and antenna gain, minus the free-space loss (which grows with the square of distance and of frequency), plus the receiving station\'s sensitivity (G/T), compared with what the decoder needs per bit. The difference is the margin, kept at a few dB for rain, pointing and ageing.',
    ],
    numbers: [['Typical LEO pass', '5–12 min'], ['Landsat 8 downlink', '~384 Mbps X-band'], ['Free-space loss, 8 GHz at 2,500 km', '~179 dB']],
    fails: ['Antennas not deploying', 'Interference and licensing problems', 'A recorder that fills faster than it empties'],
  },
  {
    id: 'cdh', title: 'The on-board computer', kicker: 'Command and data handling (C&DH)',
    paras: [
      'The computer runs the flight software: it executes time-tagged command schedules uploaded from the ground, runs the attitude-control loop many times a second, gathers telemetry from every subsystem, stores payload data and watches for faults.',
      'Fault protection is the computer\'s most important job. If the battery runs low, a wheel misbehaves or the temperature climbs, it drops to safe mode: payload off, arrays to the Sun, radio listening, and it waits for the operators.',
      'Space radiation damages electronics in two ways: total dose slowly degrades transistors, and single particles can flip a memory bit (a single-event upset) or short a chip (latch-up). Radiation-hardened processors and error-correcting memory are slower and costlier than consumer parts but survive years in the belts.',
    ],
    numbers: [['CubeSat MCU', '~10 krad tolerance'], ['RAD750-class', '~100 krad–1 Mrad'], ['Upsets', 'clustered over the South Atlantic Anomaly']],
    fails: ['Software bugs (the most common cause of CubeSat failure)', 'Radiation upsets and latch-ups', 'Watchdog reset loops'],
  },
  {
    id: 'thermal', title: 'Thermal control: between +120 °C and −150 °C', kicker: 'Keeping every part in its range',
    paras: [
      'In sunlight an exposed surface can reach well above 100 °C; in shadow it falls towards −150 °C. Batteries want 0–30 °C, electronics −20 to +50 °C, hydrazine must not freeze (+2 °C), and a telescope\'s optics may need to be held to a fraction of a degree.',
      'The tools are mostly passive: multi-layer insulation (the gold foil) isolates the inside from the Sun and the cold; radiators (white paint or mirrored glass that absorbs little sunlight but radiates infrared well) dump the electronics\' heat, which is nearly all the power the satellite uses; and heat pipes carry heat from hot boxes to the radiators. Heaters fill the gaps, which costs power exactly when it is scarce.',
      'Engineers analyse a hot case (maximum sunlight, maximum power, end-of-life coatings) and a cold case (eclipse, low power) and size radiators and heaters so both stay inside every unit\'s limits.',
    ],
    numbers: [['Sunlit surface', 'up to +120 °C'], ['Shadow surface', 'down to −150 °C'], ['Battery range', '~0 to +30 °C']],
  },
  {
    id: 'prop', title: 'Propulsion: changing the orbit', kicker: 'Δv, Isp and the rocket equation',
    paras: [
      'Every manoeuvre is measured in Δv, the change of velocity it needs: raising an orbit, holding it against drag, avoiding debris, keeping a GEO slot, or deorbiting at the end. The rocket equation links Δv to propellant: Δv = Isp × g₀ × ln(wet mass ÷ dry mass), so each extra m/s costs exponentially more.',
      'Specific impulse (Isp) measures fuel efficiency. Cold gas manages ~60 s, hydrazine ~220 s, bipropellant engines ~320 s, and electric thrusters 1,500–3,000 s. Electric propulsion is ten times more efficient but its thrust is tiny, so manoeuvres take weeks instead of minutes.',
      'Going from GTO to GEO takes about 1.5–1.8 km/s depending on how much inclination the launch left behind, which is why equatorial launch sites (Kourou) are valuable. Holding a GEO slot costs about 50 m/s a year, mostly north–south against the Sun\'s and Moon\'s pull.',
    ],
    numbers: [['GTO → GEO from Kourou', '~1.5 km/s'], ['GEO station-keeping', '~50 m/s/yr'], ['Deorbit from 550 km', '~145 m/s to a 50 km perigee']],
  },
  {
    id: 'structure', title: 'Structure and launch', kicker: 'Surviving the ride up',
    paras: [
      'The structure carries everything through launch: several g of steady acceleration, violent vibration and acoustic noise, and the shock of stage and fairing separation, a few minutes that are harsher than the next fifteen years in orbit.',
      'Satellites are shaken on vibration tables, blasted with sound in acoustic chambers and cooked and frozen in thermal-vacuum chambers before launch: "test like you fly". Mass grows as designs mature, so engineers carry margins from the start.',
      'CubeSats are built to a standard (10 cm units) so that any of them fits the same spring-loaded dispensers. That standard is why thousands of student and commercial satellites have flown.',
    ],
  },
  {
    id: 'life', title: 'A mission\'s life', kicker: 'From idea to disposal',
    paras: [
      'Concept and design: requirements, trade studies and the budgets you see in this lab. Build and test: units, then the integrated satellite through vibration, thermal-vacuum and EMC testing. Launch campaign: shipping, fuelling, mating to the rocket, the final countdown.',
      'Launch and early orbit phase (LEOP): separation, detumbling, deploying arrays and antennas, acquiring the Sun, first contact with a ground station. Then commissioning: weeks of checking every subsystem before the payload\'s first light.',
      'Routine operations: planning passes and payload tasks, uploading command schedules, downlinking data, watching trends and handling anomalies. Finally disposal: deorbit to burn up in the atmosphere (LEO, within 5 years under the FCC\'s 2022 rule), or move 300 km above GEO to a graveyard orbit, and passivate (empty the tanks and discharge the batteries so nothing explodes later).',
    ],
  },
];

/** How subsystems depend on each other, for the interaction map. */
export type Node = { id: string; label: string; x: number; y: number };
export type Edge = { from: string; to: string; kind: 'power' | 'data' | 'command' | 'heat' | 'force'; label: string };

export const NODES: Node[] = [
  { id: 'sun', label: 'Sun', x: 60, y: 60 },
  { id: 'solar', label: 'Solar arrays', x: 190, y: 60 },
  { id: 'pcdu', label: 'Power unit', x: 330, y: 60 },
  { id: 'battery', label: 'Battery', x: 330, y: 170 },
  { id: 'obc', label: 'Computer', x: 500, y: 170 },
  { id: 'sensors', label: 'Attitude sensors', x: 500, y: 60 },
  { id: 'actuators', label: 'Wheels / torquers', x: 650, y: 60 },
  { id: 'payload', label: 'Payload', x: 650, y: 170 },
  { id: 'comms', label: 'Radios', x: 650, y: 280 },
  { id: 'ground', label: 'Ground station', x: 800, y: 280 },
  { id: 'prop', label: 'Thrusters', x: 500, y: 280 },
  { id: 'thermal', label: 'Radiators / heaters', x: 330, y: 280 },
  { id: 'space', label: 'Deep space (3 K)', x: 190, y: 280 },
];

export const EDGES: Edge[] = [
  { from: 'sun', to: 'solar', kind: 'power', label: 'sunlight' },
  { from: 'solar', to: 'pcdu', kind: 'power', label: 'array current' },
  { from: 'pcdu', to: 'battery', kind: 'power', label: 'charge' },
  { from: 'battery', to: 'pcdu', kind: 'power', label: 'eclipse power' },
  { from: 'pcdu', to: 'obc', kind: 'power', label: 'regulated bus' },
  { from: 'pcdu', to: 'payload', kind: 'power', label: 'payload power' },
  { from: 'pcdu', to: 'comms', kind: 'power', label: 'transmitter power' },
  { from: 'sensors', to: 'obc', kind: 'data', label: 'attitude measurements' },
  { from: 'obc', to: 'actuators', kind: 'command', label: 'torque commands' },
  { from: 'actuators', to: 'solar', kind: 'force', label: 'points the arrays' },
  { from: 'payload', to: 'obc', kind: 'data', label: 'images / science' },
  { from: 'obc', to: 'comms', kind: 'data', label: 'telemetry + stored data' },
  { from: 'comms', to: 'ground', kind: 'data', label: 'downlink' },
  { from: 'ground', to: 'comms', kind: 'command', label: 'uplink commands' },
  { from: 'obc', to: 'prop', kind: 'command', label: 'burn commands' },
  { from: 'prop', to: 'actuators', kind: 'force', label: 'dumps wheel momentum' },
  { from: 'obc', to: 'thermal', kind: 'command', label: 'heater switching' },
  { from: 'payload', to: 'thermal', kind: 'heat', label: 'waste heat' },
  { from: 'thermal', to: 'space', kind: 'heat', label: 'infrared radiation' },
];

export const EDGE_TEACH: Record<string, string> = {
  'sun-solar': 'All the energy the satellite has comes from here; in eclipse it stops.',
  'solar-pcdu': 'The power unit tracks the arrays\' best operating point and regulates the bus.',
  'pcdu-battery': 'Any surplus in sunlight charges the battery.',
  'battery-pcdu': 'In shadow, the battery supplies everything.',
  'pcdu-obc': 'The computer is the last load ever switched off.',
  'pcdu-payload': 'Usually the biggest load; the first switched off when power runs short.',
  'pcdu-comms': 'Transmitters draw heavily during passes.',
  'sensors-obc': 'Sun, Earth, magnetic field and stars, fused into one attitude estimate.',
  'obc-actuators': 'The control loop runs several times a second.',
  'actuators-solar': 'If the attitude is lost, the arrays turn from the Sun and the power fails: ADCS and power are tied together.',
  'payload-obc': 'Data fills the recorder until the next pass.',
  'obc-comms': 'Recorded data is played back over the ground station.',
  'comms-ground': 'The only way data gets home.',
  'ground-comms': 'The only way to change what the satellite does.',
  'obc-prop': 'Orbit manoeuvres and collision-avoidance burns.',
  'prop-actuators': 'Thrusters can take momentum out of saturated wheels.',
  'obc-thermal': 'Heaters switch on in the cold and cost power in eclipse.',
  'payload-thermal': 'Nearly every watt used becomes heat to get rid of.',
  'thermal-space': 'Radiation is the only way to shed heat in a vacuum.',
};
