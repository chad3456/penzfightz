/**
 * The parts bin. Every component a satellite in this lab can carry, with
 * representative mass, power, cost and performance. Figures are typical of
 * flight hardware in each class (catalogue ranges from CubeSat suppliers,
 * SMAD and public mission data), rounded; they are for learning trade-offs,
 * not for buying hardware.
 */

export type Slot = 'bus' | 'solar' | 'battery' | 'sensor' | 'actuator' | 'propulsion' | 'comms' | 'obc' | 'thermal' | 'payload';
export type BusClass = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type MissionKind = 'eo' | 'cube' | 'broadband' | 'geo' | 'nav' | 'telescope';

export type Comp = {
  id: string;
  slot: Slot;
  name: string;
  /** one line for the card */
  short: string;
  mass: number; // kg
  power: number; // W average while on
  cost: number; // $M
  /** probability it is still working after 5 years */
  rel: number;
  /** smallest bus class it fits */
  minBus: BusClass;
  maxBus?: BusClass;
  /** CubeSat volume, in U (1 U = 10 × 10 × 10 cm) */
  u?: number;
  /** how it works, in a few sentences */
  how: string;
  /** what it depends on and what depends on it */
  links: string;

  // bus
  busClass?: BusClass; maxMass?: number; bodyArea?: number; volU?: number; size?: [number, number, number];
  // solar
  area?: number; eff?: number; mount?: 'body' | 'fixed' | 'track'; degr?: number;
  // battery
  wh?: number;
  // sensors
  acc?: number; senses?: string;
  // actuators
  momentum?: number; torque?: number; act?: 'mtq' | 'rw' | 'cmg';
  // propulsion
  isp?: number; thrust?: number; prop?: 'cold' | 'mono' | 'biprop' | 'hall' | 'ion' | 'none'; maxProp?: number;
  // comms
  mbps?: number; band?: string; ghz?: number; payloadLink?: boolean;
  // obc
  krad?: number; gb?: number;
  // thermal
  reject?: number; mli?: boolean; heater?: number;
  // payload
  kind?: MissionKind[]; gbPerDay?: number; pointReq?: number; gsd?: number; serves?: string;
};

const BUS: Comp[] = [
  {
    id: 'cs3', slot: 'bus', name: '3U CubeSat', short: '10 × 10 × 34 cm, up to 6 kg', busClass: 0, maxMass: 6, bodyArea: 0.034, volU: 3, size: [0.1, 0.1, 0.34],
    mass: 0.45, power: 0, cost: 0.04, rel: 0.99, minBus: 0, maxBus: 0,
    how: 'An aluminium rail frame built to the CubeSat standard, so it slides into a spring-loaded dispenser on almost any rocket. Everything inside is stacked on PC/104-sized boards.',
    links: 'Sets the volume (3 U), the area for body-mounted cells and how much mass rides on a rideshare.',
  },
  {
    id: 'cs6', slot: 'bus', name: '6U CubeSat', short: '10 × 23 × 34 cm, up to 12 kg', busClass: 1, maxMass: 12, bodyArea: 0.078, volU: 6, size: [0.1, 0.23, 0.34],
    mass: 1.0, power: 0, cost: 0.08, rel: 0.99, minBus: 1, maxBus: 1,
    how: 'Two 3U columns side by side. The extra width takes a real camera or a small propulsion module, and the larger faces give room for deployable panels.',
    links: 'More volume and area than a 3U; still dispenser-launched.',
  },
  {
    id: 'cs12', slot: 'bus', name: '12U CubeSat', short: '23 × 23 × 34 cm, up to 24 kg', busClass: 2, maxMass: 24, bodyArea: 0.16, volU: 12, size: [0.23, 0.23, 0.34],
    mass: 2.0, power: 0, cost: 0.15, rel: 0.985, minBus: 2, maxBus: 2,
    how: 'A four-column frame: big enough for an X-band transmitter, star tracker, reaction wheels and an electric thruster all at once.',
    links: 'The largest common CubeSat size; beyond this you move to a conventional microsatellite.',
  },
  {
    id: 'micro', slot: 'bus', name: 'Microsatellite (ESPA class)', short: '~60 × 70 × 90 cm, up to 180 kg', busClass: 3, maxMass: 180, bodyArea: 1.5, size: [0.6, 0.7, 0.9],
    mass: 22, power: 0, cost: 2.5, rel: 0.98, minBus: 3, maxBus: 3,
    how: 'An aluminium honeycomb box sized to bolt onto the ring adapter between a rocket and its main payload (ESPA), the standard ride for 100–200 kg satellites.',
    links: 'Opens up larger optics, proper propulsion and 100+ W of power.',
  },
  {
    id: 'small', slot: 'bus', name: 'Smallsat bus', short: '~1 × 1 × 1.3 m, up to 850 kg', busClass: 4, maxMass: 850, bodyArea: 5.6, size: [1.0, 1.0, 1.3],
    mass: 85, power: 0, cost: 12, rel: 0.98, minBus: 4, maxBus: 4,
    how: 'A central cylinder or honeycomb shear panels carrying launch loads, with equipment on the inside faces of the panels so their outsides can be radiators.',
    links: 'Typical of constellation and Earth-observation satellites.',
  },
  {
    id: 'medium', slot: 'bus', name: 'Medium bus', short: '~1.8 × 1.8 × 2.5 m, up to 2,500 kg', busClass: 5, maxMass: 2500, bodyArea: 18, size: [1.8, 1.8, 2.5],
    mass: 260, power: 0, cost: 45, rel: 0.975, minBus: 5, maxBus: 5,
    how: 'A carbon-fibre central tube that holds the propellant tanks, with the equipment panels around it. Built for 10–15-year missions with redundancy in every subsystem.',
    links: 'Navigation, science and weather satellites live here.',
  },
  {
    id: 'large', slot: 'bus', name: 'Large GEO bus', short: '~2.5 × 2.5 × 4 m, up to 6,500 kg', busClass: 6, maxMass: 6500, bodyArea: 40, size: [2.4, 2.4, 3.8],
    mass: 600, power: 0, cost: 90, rel: 0.97, minBus: 6, maxBus: 6,
    how: 'The classic geostationary platform: a big tank-carrying central cylinder, north and south radiator panels (which never see the Sun at GEO) and two long solar wings.',
    links: 'Sized for 15+ years of station-keeping and 10–20 kW of transponders.',
  },
];

const SOLAR: Comp[] = [
  {
    id: 'sol-body', slot: 'solar', name: 'Body-mounted cells', short: 'Triple-junction GaAs on the outer faces', area: 0, eff: 0.295, mount: 'body', degr: 0.025,
    mass: 0.2, power: 0, cost: 0.06, rel: 0.995, minBus: 0, maxBus: 3,
    how: 'Gallium-arsenide triple-junction cells (about 29.5% efficient) glued straight onto the sides. Nothing to deploy and nothing to fail, but only one or two faces see the Sun at a time, so the average output is low.',
    links: 'Charges the battery through the power unit. Output scales with the bus face area and falls about 2–3% a year from radiation.',
  },
  {
    id: 'sol-cdep', slot: 'solar', name: 'Deployable CubeSat panels', short: 'Two to four hinged panels, ~0.12–0.3 m²', area: 0.12, eff: 0.295, mount: 'fixed', degr: 0.025,
    mass: 0.6, power: 0, cost: 0.12, rel: 0.97, minBus: 0, maxBus: 2,
    how: 'Panels folded against the body for launch, held by a nylon wire that a small resistor burns through after separation; springs swing them out. They roughly triple the power of a CubeSat.',
    links: 'Needs a working burn-wire circuit (power and OBC) to deploy, and attitude control to keep them facing the Sun.',
  },
  {
    id: 'sol-wing', slot: 'solar', name: 'Deployable wings, fixed', short: '2 wings, 4 m² total', area: 4, eff: 0.295, mount: 'fixed', degr: 0.02,
    mass: 18, power: 0, cost: 2.2, rel: 0.97, minBus: 3, maxBus: 5,
    how: 'Rigid honeycomb panels on hinges. Fixed to the body, so the satellite has to yaw or roll to keep them pointed at the Sun, which competes with pointing the payload.',
    links: 'ADCS has to share the attitude between the Sun and the target.',
  },
  {
    id: 'sol-track', slot: 'solar', name: 'Sun-tracking wings', short: '2 wings on drive motors, 12 m²', area: 12, eff: 0.3, mount: 'track', degr: 0.02,
    mass: 75, power: 15, cost: 8, rel: 0.96, minBus: 4,
    how: 'Each wing turns once per orbit on a solar array drive assembly (SADA): a motor and slip rings carry the power across a rotating joint. The body can point anywhere while the wings follow the Sun.',
    links: 'The drive takes a little power and adds a failure point; the slip rings carry all of the satellite\'s power.',
  },
  {
    id: 'sol-track-l', slot: 'solar', name: 'Large sun-tracking wing', short: 'One long wing on a drive, 28 m²', area: 28, eff: 0.3, mount: 'track', degr: 0.02,
    mass: 120, power: 18, cost: 10, rel: 0.96, minBus: 4,
    how: 'A single long wing of many hinged panels, like the arrays on constellation satellites, rotating to follow the Sun.',
    links: 'Powers kilowatt payloads and electric propulsion on a smallsat.',
  },
  {
    id: 'sol-roll', slot: 'solar', name: 'Large roll-out arrays', short: '2 × flexible blankets, 70 m²', area: 70, eff: 0.3, mount: 'track', degr: 0.015,
    mass: 260, power: 30, cost: 30, rel: 0.95, minBus: 5,
    how: 'Thin-film blankets that unroll from a drum on carbon booms (like the ISS\'s new ROSA arrays). Huge area for little mass, for 15–25 kW GEO satellites and electric propulsion.',
    links: 'Feeds high-power transponders and Hall thrusters; deployment is a one-shot event.',
  },
];

const BATTERY: Comp[] = [
  { id: 'bat-40', slot: 'battery', name: 'Li-ion pack 40 Wh', short: '18650 cells, CubeSat board', wh: 40, mass: 0.3, power: 0.2, cost: 0.03, rel: 0.97, minBus: 0, maxBus: 2, u: 0.3, how: 'Four to eight 18650 lithium-ion cells with a protection board. Lithium-ion stores about 150 Wh/kg, three times what nickel batteries did.', links: 'Carries every load through eclipse; must be kept between about 0 and 40 °C, which is why it needs heaters.' },
  { id: 'bat-120', slot: 'battery', name: 'Li-ion pack 120 Wh', short: 'Larger CubeSat pack', wh: 120, mass: 0.85, power: 0.3, cost: 0.06, rel: 0.97, minBus: 1, maxBus: 3, u: 0.6, how: 'A bigger cell string for power-hungry CubeSats.', links: 'Deeper reserve for eclipse and for transmitting.' },
  { id: 'bat-600', slot: 'battery', name: 'Li-ion battery 600 Wh', short: 'Microsatellite battery', wh: 600, mass: 4.5, power: 1, cost: 0.4, rel: 0.97, minBus: 3, how: 'Space-qualified cells in a module with cell balancing and temperature sensors.', links: 'Sized so that the eclipse uses only a fraction of its charge: shallow cycles last longer.' },
  { id: 'bat-3k', slot: 'battery', name: 'Li-ion battery 3 kWh', short: 'Smallsat battery', wh: 3000, mass: 22, power: 3, cost: 1.5, rel: 0.97, minBus: 4, how: 'Several modules of cells in series and parallel. LEO satellites cycle the battery ~5,500 times a year, so they keep depth of discharge near 20–30%.', links: 'Depth of discharge drives battery life.' },
  { id: 'bat-6k', slot: 'battery', name: 'Li-ion battery 7 kWh', short: 'High-power smallsat battery', wh: 7000, mass: 48, power: 4, cost: 2.6, rel: 0.97, minBus: 4, how: 'A larger module stack for satellites that run kilowatt payloads through eclipse.', links: 'Keeps depth of discharge low enough for thousands of LEO cycles.' },
  { id: 'bat-12k', slot: 'battery', name: 'Li-ion battery 24 kWh', short: 'Large-satellite battery', wh: 24000, mass: 170, power: 6, cost: 8, rel: 0.97, minBus: 5, how: 'A GEO satellite only sees about 90 eclipses a year (two seasons of ~45 days), so it can discharge deeply (60–70%).', links: 'Carries the full transponder load through 70-minute equinox eclipses.' },
];

const SENSORS: Comp[] = [
  { id: 'sen-sun', slot: 'sensor', name: 'Coarse sun sensors', short: 'Photodiodes on each face', acc: 5, senses: 'Sun direction', mass: 0.05, power: 0.05, cost: 0.01, rel: 0.995, minBus: 0, u: 0.05, how: 'A photodiode\'s current follows the cosine of the angle to the Sun; comparing faces gives the Sun direction to a few degrees.', links: 'Lets the OBC find the Sun after separation and point the solar arrays. Blind in eclipse.' },
  { id: 'sen-mag', slot: 'sensor', name: 'Magnetometer', short: '3-axis, measures Earth\'s field', acc: 3, senses: 'Magnetic field', mass: 0.05, power: 0.1, cost: 0.02, rel: 0.99, minBus: 0, u: 0.05, how: 'Measures the local geomagnetic field vector, which the OBC compares with a field model (IGRF) at the current position.', links: 'Needed for magnetorquer detumbling (B-dot) and for momentum dumping; works in eclipse.' },
  { id: 'sen-gyro', slot: 'sensor', name: 'MEMS gyro / IMU', short: 'Measures rotation rates', acc: 1, senses: 'Body rates', mass: 0.05, power: 0.3, cost: 0.03, rel: 0.98, minBus: 0, u: 0.1, how: 'Vibrating-structure gyros measure rotation rate; integrating rates carries the attitude between star-tracker updates.', links: 'Smooths the control loop and covers moments when the star tracker is blinded by the Sun or Moon.' },
  { id: 'sen-gnss', slot: 'sensor', name: 'GNSS receiver', short: 'GPS/Galileo/NavIC position fix', acc: 0, senses: 'Position and time', mass: 0.1, power: 1, cost: 0.03, rel: 0.98, minBus: 0, u: 0.2, how: 'A navigation receiver modified for orbital speeds gives position to ~10 m and time to nanoseconds, so the satellite knows where it is without the ground.', links: 'Feeds the OBC orbit model, timestamps images and plans ground passes. Does not work well above the GNSS constellations (for GEO it is weak).' },
  { id: 'sen-st-nano', slot: 'sensor', name: 'Nano star tracker', short: 'Camera that recognises star patterns', acc: 0.01, senses: 'Full attitude', mass: 0.3, power: 1, cost: 0.15, rel: 0.97, minBus: 0, u: 0.5, how: 'A small camera photographs the sky, finds triangles of stars and matches them against a catalogue to give the full orientation to about 30 arcseconds.', links: 'The sensor that makes fine pointing possible; needs a clear view away from the Sun and Earth limb.' },
  { id: 'sen-st', slot: 'sensor', name: 'Star tracker (2 heads)', short: 'Redundant optical heads, ~5″', acc: 0.0015, senses: 'Full attitude', mass: 3.5, power: 9, cost: 1.2, rel: 0.985, minBus: 3, how: 'Two camera heads looking in different directions so one is always clear of the Sun. Accuracy is a few arcseconds.', links: 'Needed for sub-0.01° pointing: high-resolution imaging, laser links, telescopes.' },
  { id: 'sen-fgs', slot: 'sensor', name: 'Fine guidance sensor', short: 'Locks on guide stars through the telescope', acc: 0.000002, senses: 'Milliarcsecond pointing', mass: 25, power: 30, cost: 25, rel: 0.95, minBus: 5, how: 'Interferometric sensors that look through the telescope itself and lock on to guide stars, measuring pointing to milliarcseconds (Hubble\'s hold the telescope steady to 0.007″).', links: 'Only useful with a telescope payload and very quiet actuators (large wheels or CMGs).' },
  { id: 'sen-earth', slot: 'sensor', name: 'Earth horizon sensor', short: 'Infrared sensor that sees the Earth\'s rim', acc: 0.1, senses: 'Earth direction', mass: 2, power: 3, cost: 0.4, rel: 0.98, minBus: 3, how: 'Infrared detectors find the edge of the warm Earth against cold space, giving roll and pitch relative to nadir. The traditional GEO attitude sensor.', links: 'Keeps antennas pointed at the Earth.' },
];

const ACTUATORS: Comp[] = [
  { id: 'act-mtq', slot: 'actuator', name: 'Magnetorquers', short: '3 coils that push on Earth\'s field', act: 'mtq', torque: 1e-5, momentum: 0, mass: 0.2, power: 0.6, cost: 0.03, rel: 0.995, minBus: 0, maxBus: 4, u: 0.2, how: 'Coils of wire become electromagnets that twist against the geomagnetic field. Weak and only able to torque at right angles to the field, but with no moving parts and no propellant. Used to stop the tumble after separation (the B-dot law) and to dump momentum from reaction wheels.', links: 'Needs a magnetometer. Too weak above LEO, where the field is faint.' },
  { id: 'act-rw-nano', slot: 'actuator', name: 'Reaction wheels (nano, ×3)', short: '3-axis, 10 mNms each', act: 'rw', torque: 1e-3, momentum: 0.01, mass: 0.5, power: 2, cost: 0.12, rel: 0.94, minBus: 0, maxBus: 3, u: 0.5, how: 'Small flywheels spun by motors: speed a wheel up and the satellite turns the other way (conservation of angular momentum). Three wheels give smooth, precise control about all axes.', links: 'Store up disturbance momentum until they saturate, then need magnetorquers or thrusters to dump it. Bearings are the classic failure point.' },
  { id: 'act-rw', slot: 'actuator', name: 'Reaction wheels (4, pyramid)', short: '4 × 12 Nms, one spare', act: 'rw', torque: 0.2, momentum: 12, mass: 32, power: 40, cost: 2.5, rel: 0.97, minBus: 3, how: 'Four wheels in a pyramid: any three can do the job, so one can fail. Each stores 12 Nms and gives 0.2 Nm, enough to slew a smallsat to a new target in tens of seconds.', links: 'Pair with a star tracker for fine pointing; dump momentum with magnetorquers or thrusters.' },
  { id: 'act-rw-big', slot: 'actuator', name: 'Large reaction wheels (4)', short: '4 × 50 Nms, very quiet', act: 'rw', torque: 0.3, momentum: 50, mass: 60, power: 80, cost: 6, rel: 0.96, minBus: 5, how: 'Big, slow, carefully balanced wheels whose small vibrations still matter for a telescope.', links: 'Hubble steers with four 45 Nms wheels, using no propellant at all.' },
  { id: 'act-cmg', slot: 'actuator', name: 'Control moment gyros', short: 'Gimballed flywheels, very agile', act: 'cmg', torque: 30, momentum: 60, mass: 120, power: 120, cost: 15, rel: 0.94, minBus: 5, how: 'A wheel spinning at constant speed is tilted on a gimbal; tipping its momentum vector produces a torque hundreds of times larger than a reaction wheel\'s. Used by agile imaging satellites and the ISS.', links: 'Lets an imager slew between targets in seconds; complex steering logic.' },
  { id: 'act-mtq-big', slot: 'actuator', name: 'Large magnetorquer rods', short: '3 × 100 Am² torque rods', act: 'mtq', torque: 3e-3, momentum: 0, mass: 6, power: 8, cost: 0.3, rel: 0.995, minBus: 3, how: 'Long iron-cored rods: far stronger magnetic dipoles for bigger satellites in LEO.', links: 'Momentum dumping without propellant in LEO.' },
];

const PROPULSION: Comp[] = [
  { id: 'prop-none', slot: 'propulsion', name: 'No propulsion', short: 'Goes where the rocket put it', prop: 'none', isp: 0, thrust: 0, maxProp: 0, mass: 0, power: 0, cost: 0, rel: 1, minBus: 0, how: 'Many CubeSats fly without propulsion: they cannot avoid debris, hold their orbit or deorbit themselves, so they must be launched low enough that drag removes them within 5 years.', links: 'Then drag alone sets the lifetime.' },
  { id: 'prop-cold', slot: 'propulsion', name: 'Cold-gas thrusters', short: 'Isp 60 s, 10 mN', prop: 'cold', isp: 60, thrust: 0.01, maxProp: 0.5, mass: 0.8, power: 2, cost: 0.15, rel: 0.97, minBus: 0, maxBus: 3, u: 1, how: 'Pressurised gas (butane, nitrogen) let out through a nozzle. Simple and safe, but each kilogram of gas buys very little Δv.', links: 'Small corrections, momentum dumping, formation flying.' },
  { id: 'prop-epcs', slot: 'propulsion', name: 'CubeSat electric thruster', short: 'Isp 1,500 s, 0.5 mN, 20 W', prop: 'ion', isp: 1500, thrust: 0.0005, maxProp: 0.4, mass: 1.0, power: 20, cost: 0.4, rel: 0.93, minBus: 1, maxBus: 3, u: 1.5, how: 'An electric field accelerates ions (iodine or an ionic liquid) to tens of km/s. Tiny thrust but huge efficiency: a few hundred grams of propellant can raise an orbit by hundreds of kilometres over months.', links: 'Draws a lot of a CubeSat\'s power while firing.' },
  { id: 'prop-mono', slot: 'propulsion', name: 'Hydrazine monopropellant', short: 'Isp 220 s, 4 × 1 N', prop: 'mono', isp: 220, thrust: 4, maxProp: 300, mass: 9, power: 12, cost: 2, rel: 0.98, minBus: 3, how: 'Hydrazine passed over a hot catalyst bed decomposes into hot gas. The workhorse for orbit maintenance, collision avoidance and deorbiting. Toxic, so fuelling is done in protective suits.', links: 'Catalyst-bed and tank-line heaters draw power; the tanks set how much Δv you carry.' },
  { id: 'prop-hall', slot: 'propulsion', name: 'Hall-effect thrusters', short: 'Isp 1,600 s, 80 mN, 1.4 kW', prop: 'hall', isp: 1600, thrust: 0.08, maxProp: 600, mass: 35, power: 1400, cost: 6, rel: 0.95, minBus: 4, how: 'A radial magnetic field traps electrons that ionise xenon or krypton; the axial electric field shoots the ions out at ~16 km/s. Starlink-type satellites raise their orbits with them, and all-electric GEO satellites take months to climb from GTO.', links: 'Needs kilowatts from big arrays. Orbit raising becomes slow (weeks to months) but propellant-cheap.' },
  { id: 'prop-biprop', slot: 'propulsion', name: 'Bipropellant apogee engine', short: 'Isp 320 s, 450 N + RCS', prop: 'biprop', isp: 320, thrust: 450, maxProp: 3500, mass: 70, power: 40, cost: 12, rel: 0.97, minBus: 5, how: 'Fuel (MMH) and oxidiser (MON) ignite on contact in a 450 N engine. A few long burns at apogee lift a GEO satellite from its transfer orbit in about a week; small thrusters keep it on station for 15 years.', links: 'The propellant is often half the satellite\'s launch mass.' },
];

const COMMS: Comp[] = [
  { id: 'com-uhf', slot: 'comms', name: 'UHF transceiver', short: '9.6 kbps, whip antennas', mbps: 0.0096, band: 'UHF 437 MHz', ghz: 0.437, mass: 0.1, power: 1.5, cost: 0.02, rel: 0.98, minBus: 0, maxBus: 3, u: 0.3, how: 'Amateur-band radio with tape-spring dipole antennas. Hears commands from any direction and sends housekeeping telemetry (TT&C); far too slow for images.', links: 'The first link to wake up after separation: how you first hear from the satellite.' },
  { id: 'com-s', slot: 'comms', name: 'S-band radio', short: '2 Mbps, patch antennas', mbps: 2, band: 'S 2.2 GHz', ghz: 2.2, mass: 0.25, power: 6, cost: 0.08, rel: 0.98, minBus: 0, u: 0.4, how: 'The standard telemetry, tracking and command (TT&C) band. Wide-beam antennas work at any attitude, which is what you want when something is wrong.', links: 'Safe-mode link: still works with the satellite tumbling slowly.' },
  { id: 'com-x-cs', slot: 'comms', name: 'X-band transmitter (CubeSat)', short: '100 Mbps, patch array', mbps: 100, band: 'X 8.2 GHz', ghz: 8.2, payloadLink: true, mass: 0.4, power: 15, cost: 0.25, rel: 0.96, minBus: 1, maxBus: 3, u: 0.6, how: 'A downlink-only transmitter in the 8 GHz Earth-exploration band. Its narrow antenna has to be pointed at the station, so the satellite rolls towards the ground during a pass.', links: 'Needs attitude control and power; the main way image data reaches Earth.' },
  { id: 'com-x', slot: 'comms', name: 'X-band downlink', short: '800 Mbps, steerable antenna', mbps: 800, band: 'X 8.2 GHz', ghz: 8.2, payloadLink: true, mass: 12, power: 90, cost: 3, rel: 0.97, minBus: 3, how: 'A higher-order modulation (e.g., 32APSK) transmitter and a gimballed horn that tracks the ground station while the body keeps imaging.', links: 'Landsat-class satellites downlink hundreds of gigabytes a day this way.' },
  { id: 'com-ka', slot: 'comms', name: 'Ka-band downlink', short: '3 Gbps, 26 GHz', mbps: 3000, band: 'Ka 26 GHz', ghz: 26, payloadLink: true, mass: 18, power: 160, cost: 5, rel: 0.96, minBus: 4, how: 'Higher frequency means more bandwidth and a tighter beam, but rain absorbs it, so ground stations need diversity or margin.', links: 'For very high data volumes (radar, hyperspectral).' },
  { id: 'com-opt', slot: 'comms', name: 'Optical (laser) terminal', short: '10 Gbps, needs 0.001° pointing', mbps: 10000, band: 'Optical 1550 nm', ghz: 193000, payloadLink: true, mass: 15, power: 120, cost: 8, rel: 0.92, minBus: 4, how: 'A laser beam a few microradians wide carries data to an optical ground station or another satellite. No spectrum licence needed, but clouds block it and pointing must be extraordinarily fine.', links: 'Starlink satellites use laser links between satellites; needs a star tracker.' },
  { id: 'com-dsn', slot: 'comms', name: 'Ku/Ka TT&C for GEO', short: 'Station-keeping telemetry and command', mbps: 0.064, band: 'Ku 14/12 GHz', ghz: 12, mass: 8, power: 40, cost: 2, rel: 0.98, minBus: 5, how: 'Redundant telemetry and command transponders with omni and earth-coverage antennas for the satellite operator\'s control centre.', links: 'At GEO the satellite is always in view, so it is talking to the ground all the time.' },
];

const OBC: Comp[] = [
  { id: 'obc-cs', slot: 'obc', name: 'CubeSat OBC', short: 'ARM microcontroller, COTS, 10 krad', krad: 10, gb: 8, mass: 0.1, power: 0.5, cost: 0.03, rel: 0.95, minBus: 0, maxBus: 3, u: 0.2, how: 'A commercial microcontroller on a PC/104 card running the flight software: the command scheduler, telemetry, ADCS loop and fault protection. Cheap and capable, but not built for radiation.', links: 'Everything is wired to it. A radiation upset can reboot it; a watchdog brings it back.' },
  { id: 'obc-rt', slot: 'obc', name: 'Rad-tolerant OBC + 256 GB', short: 'Screened parts, EDAC memory, 50 krad', krad: 50, gb: 256, mass: 1.5, power: 8, cost: 0.6, rel: 0.97, minBus: 2, how: 'Parts chosen and tested for radiation, with error-detecting-and-correcting memory and latch-up protection. Solid-state recorder for a day of images.', links: 'Survives a 5-year LEO mission; storage buffers data between ground passes.' },
  { id: 'obc-rh', slot: 'obc', name: 'Rad-hard redundant OBC + 2 TB', short: 'Dual LEON/RAD750-class, 300 krad', krad: 300, gb: 2000, mass: 9, power: 30, cost: 6, rel: 0.985, minBus: 4, how: 'Two radiation-hardened processors (the class flown on Mars rovers and GEO satellites), cross-strapped so either can run everything, plus a large mass memory.', links: 'Needed for 10–15-year missions and for the radiation belts of MEO.' },
];

const THERMAL: Comp[] = [
  { id: 'th-mli', slot: 'thermal', name: 'Multi-layer insulation', short: 'Gold/silver foil blankets', mli: true, mass: 0, power: 0, cost: 0.02, rel: 1, minBus: 0, how: 'Twenty or so layers of aluminised Kapton separated by mesh: each layer reflects heat back, so the body neither bakes in sunlight nor freezes in shadow. This is the gold foil you see on satellites.', links: 'Leaves only the radiators to dump heat, so the temperature is set by design rather than by where the Sun is.' },
  { id: 'th-heat', slot: 'thermal', name: 'Heaters + thermostats', short: 'Keep the battery and tanks warm', heater: 1, mass: 0.2, power: 0, cost: 0.02, rel: 0.99, minBus: 0, how: 'Kapton film heaters switched by thermostats or the OBC. The battery must stay above about 0 °C, and hydrazine freezes at 2 °C.', links: 'Their power comes out of the battery during eclipse, exactly when it is scarce.' },
];

const PAYLOADS: Comp[] = [
  { id: 'pl-cam-cs', slot: 'payload', name: 'CubeSat camera (5 m)', short: '5 m ground resolution, RGB+NIR', kind: ['eo', 'cube'], gsd: 5, gbPerDay: 6, pointReq: 0.1, mass: 1.1, power: 6, cost: 0.4, rel: 0.95, minBus: 1, maxBus: 3, u: 2, how: 'A compact folded telescope and a push-broom sensor: the line of detectors sweeps the ground as the satellite flies, building up a strip image.', links: 'Generates data that fills the recorder until the next downlink; must be pointed within ~0.1°.' },
  { id: 'pl-cam', slot: 'payload', name: 'Multispectral imager (15–30 m)', short: '9 bands, 185 km swath', kind: ['eo'], gsd: 15, gbPerDay: 120, pointReq: 0.05, mass: 140, power: 180, cost: 40, rel: 0.95, minBus: 4, how: 'A Landsat-style instrument: separate detector arrays for visible, near-infrared and short-wave infrared bands, which tell crops, water, minerals and burn scars apart.', links: 'Images every land scene in sunlight; makes ~100+ GB a day to downlink.' },
  { id: 'pl-hires', slot: 'payload', name: 'High-resolution telescope (0.5 m)', short: '50 cm resolution, 1.1 m mirror', kind: ['eo'], gsd: 0.5, gbPerDay: 400, pointReq: 0.005, mass: 300, power: 400, cost: 120, rel: 0.94, minBus: 5, how: 'A large mirror with a long focal length. The satellite slews to each target (agility matters) and may hold it while it passes, so steering is as much of the design as the optics.', links: 'Needs CMGs or big wheels, a star tracker and X/Ka downlinks.' },
  { id: 'pl-iot', slot: 'payload', name: 'IoT/AIS receiver', short: 'Collects messages from ships and sensors', kind: ['cube'], gbPerDay: 0.05, pointReq: 20, mass: 0.15, power: 1.5, cost: 0.05, rel: 0.97, minBus: 0, u: 0.5, how: 'A software-defined radio listening to ship transponders (AIS) or low-power ground sensors, storing their short messages.', links: 'Barely needs pointing; data is small.' },
  { id: 'pl-sci-cs', slot: 'payload', name: 'Student science experiment', short: 'Radiation/particle counter', kind: ['cube'], gbPerDay: 0.0008, pointReq: 30, mass: 0.3, power: 1, cost: 0.03, rel: 0.95, minBus: 0, u: 1, how: 'A small particle detector that maps the radiation environment along the orbit, the kind of first experiment many university satellites carry.', links: 'Low power and data; a good fit for a 3U.' },
  { id: 'pl-bb', slot: 'payload', name: 'Phased-array broadband payload', short: 'Ku/Ka user beams, ~20 Gbps', kind: ['broadband'], gbPerDay: 0, serves: '20 Gbps', pointReq: 0.1, mass: 120, power: 2400, cost: 6, rel: 0.95, minBus: 4, how: 'Flat electronically steered antennas form dozens of beams to user terminals on the ground and gateways, switching between them thousands of times a second.', links: 'The biggest power load on the satellite; heat must be radiated away.' },
  { id: 'pl-isl', slot: 'payload', name: 'Inter-satellite laser links', short: '3 lasers to neighbours', kind: ['broadband'], gbPerDay: 0, serves: 'mesh routing', pointReq: 0.01, mass: 30, power: 300, cost: 3, rel: 0.93, minBus: 4, how: 'Lasers connect each satellite to its neighbours so traffic can cross oceans without a ground station underneath.', links: 'Needs a star tracker and very stable pointing.' },
  { id: 'pl-geo', slot: 'payload', name: 'C/Ku transponders (36 × 36 MHz)', short: 'TV and data relay, 12 kW', kind: ['geo'], gbPerDay: 0, serves: '36 transponders', pointReq: 0.05, mass: 900, power: 12000, cost: 120, rel: 0.95, minBus: 6, how: 'Each transponder receives a channel on the uplink, shifts its frequency, amplifies it with a travelling-wave tube to ~150 W and sends it back down through large reflector antennas shaped to cover a country.', links: 'Most of the power and heat of a GEO satellite; antennas must stay on the Earth to 0.05°.' },
  { id: 'pl-nav', slot: 'payload', name: 'Navigation payload + atomic clocks', short: 'Rubidium/hydrogen clocks, L-band signals', kind: ['nav'], gbPerDay: 0, serves: 'L1/L5 signals', pointReq: 0.5, mass: 250, power: 900, cost: 70, rel: 0.94, minBus: 5, how: 'Atomic clocks stable to about a nanosecond a day drive L-band signals that carry the exact time and the satellite\'s position. A receiver timing signals from four satellites solves for its position.', links: 'Needs Earth pointing and a very stable thermal environment for the clocks.' },
  { id: 'pl-tel', slot: 'payload', name: 'Space telescope (2.4 m class)', short: 'UV–optical–near-IR observatory', kind: ['telescope'], gbPerDay: 15, pointReq: 0.000002, mass: 6000, power: 1500, cost: 900, rel: 0.94, minBus: 6, how: 'A 2.4 m primary mirror (Hubble\'s size) feeding cameras and spectrographs above the blurring atmosphere. Pointing has to hold steady to milliarcseconds for long exposures.', links: 'Needs fine guidance sensors, quiet wheels and a thermal design that keeps the mirror shape stable.' },
  { id: 'pl-tel-s', slot: 'payload', name: 'Small survey telescope (0.5 m)', short: 'Wide-field optical survey', kind: ['telescope'], gbPerDay: 25, pointReq: 0.002, mass: 180, power: 220, cost: 60, rel: 0.95, minBus: 4, how: 'A smaller wide-field telescope that maps the sky (or watches stars for planets crossing them, like TESS) rather than staring deep.', links: 'A star tracker and good wheels can hold it steady enough.' },
];

export const CATALOG: Comp[] = [...BUS, ...SOLAR, ...BATTERY, ...SENSORS, ...ACTUATORS, ...PROPULSION, ...COMMS, ...OBC, ...THERMAL, ...PAYLOADS];
export const BY_ID = Object.fromEntries(CATALOG.map((c) => [c.id, c])) as Record<string, Comp>;

export const SLOTS: { id: Slot; name: string; multi: boolean; what: string }[] = [
  { id: 'bus', name: 'Structure (bus)', multi: false, what: 'The frame that carries everything through launch, and sets your size and mass limits.' },
  { id: 'payload', name: 'Payload', multi: true, what: 'The reason the satellite exists: the camera, transponder, clock or telescope.' },
  { id: 'solar', name: 'Solar arrays', multi: false, what: 'Turn sunlight into electricity.' },
  { id: 'battery', name: 'Battery', multi: false, what: 'Carries the satellite through eclipses and power peaks.' },
  { id: 'sensor', name: 'Attitude sensors', multi: true, what: 'Tell the satellite which way it is pointing.' },
  { id: 'actuator', name: 'Attitude actuators', multi: true, what: 'Turn the satellite to point where it should.' },
  { id: 'propulsion', name: 'Propulsion', multi: false, what: 'Changes the orbit: raising, station-keeping, dodging debris, deorbiting.' },
  { id: 'comms', name: 'Communications', multi: true, what: 'Commands up, telemetry and data down.' },
  { id: 'obc', name: 'On-board computer', multi: false, what: 'The brain: runs the software, stores the data, handles faults.' },
  { id: 'thermal', name: 'Thermal control', multi: true, what: 'Keeps every part inside its temperature limits.' },
];

/** Bus face area for body cells: roughly the area facing the Sun on average. */
export function bodySolarArea(bus: Comp) {
  const [a, b, c] = bus.size ?? [0.1, 0.1, 0.1];
  return (a * b + b * c + a * c) * 0.5;
}
