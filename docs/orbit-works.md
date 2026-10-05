# Orbit Works

A satellite lab in the browser (effect `orbitworks`). You choose a mission, build a satellite from real kinds of parts, put it through the checks an engineering review board makes, launch it, and fly it through its first weeks in orbit as mission control.

## The five steps

1. **Mission.** Six archetypes, each modelled on real programmes:

   | Mission | Orbit | Real counterparts |
   |---|---|---|
   | Student CubeSat | 500 km sun-synchronous | University CubeSats on rideshares and from the ISS; India's student satellites on PSLV |
   | Earth observation | 705 km SSO | NASA/USGS Landsat 8 and 9, ESA Sentinel-2, ISRO Cartosat and Resourcesat |
   | Broadband constellation | 550 km, 53° | SpaceX Starlink, Eutelsat OneWeb |
   | Navigation | MEO 20,200 km, 55° | GPS, Galileo, ISRO NavIC |
   | Geostationary comsat | GEO, from GTO | Commercial GEO comsats, ISRO GSAT and INSAT |
   | Space telescope | 540 km, 28.5° | Hubble, TESS, ISRO AstroSat |

   You also set the altitude (where the mission allows), the launch site (Sriharikota, Cape Canaveral, Vandenberg, Kourou, Mahia, Baikonur) and the ground stations (Svalbard, Bengaluru ISTRAC, Fairbanks, Kiruna, Hartebeesthoek, Canberra, Wallops, Troll).
2. **Build.** About 60 parts across ten subsystems:
   - structure;
   - payload;
   - solar arrays;
   - battery;
   - attitude sensors;
   - attitude actuators;
   - propulsion;
   - radios;
   - computer;
   - thermal.

   Each part has a mass, power, cost and reliability, and explains how it works and what it depends on. There are sliders for propellant and radiator area. A 3D model of the satellite is built from your choices.
3. **Review.** More than 20 checks, each with the requirement, why it matters and how to fix it:

   | Area | Checks |
   |---|---|
   | Structure | mass and volume |
   | Power | end-of-life array power (eclipse and degradation), battery depth of discharge |
   | Thermal | hot case and cold case, including heater power |
   | Attitude | pointing, detumbling, momentum dumping |
   | Communications | command link, data downlink, link margin, storage |
   | Propulsion | Δv by the rocket equation, tank size, electric orbit-raising time |
   | Lifetime | drag decay and the 5-year disposal rule, radiation dose, reliability |
   | Launch | launcher capacity, launch site |
   | Programme | cost |

   You then choose a rocket class (rideshare, Electron, PSLV, LVM3, Falcon 9 or Falcon Heavy class).
4. **Launch.** You run the final go/no-go poll as launch director. One console holds on a real kind of issue: upper-level winds, triggered-lightning clouds, a boat in the range, or a bad sensor. You decide whether to hold, waive or scrub, and waiving raises the chance of failure. Then you ride the ascent on a 3D Earth with real coastlines, through liftoff, Max-Q, staging, fairing separation, booster landing, cut-off and separation.
5. **Operate.** Mission control for the satellite you built:
   - detumbling;
   - deployment, sometimes with a stuck panel to recover;
   - Sun acquisition and first contact;
   - a five-step commissioning checklist;
   - orbit transfer: apogee burns from GTO to GEO, or electric spiral raising;
   - 30 days of operations, with time warp up to 3,600×.

   Telemetry covers battery, power, temperature, recorder, propellant, wheel momentum, ground contacts and eclipses. Anomalies need your decision:
   - debris conjunctions;
   - failing wheels;
   - radiation upsets;
   - geomagnetic storms;
   - ground-station outages;
   - GEO eclipse seasons;
   - safe-mode recovery.

   Each comes with the real-world context. The run ends with a score for availability, data delivered and health.

**How it works** is a handbook: orbits, power, attitude, communications, the computer, thermal, propulsion, structure and launch, and a mission's life cycle. It includes a map of how subsystems pass power, data, commands, heat and force to each other. During operations the same map runs live: flows light up when the satellite is in sunlight, in eclipse, imaging or in contact.

## The physics (`src/sat/physics.ts`)

These are the first-cut formulas used in early mission design (Vallado; Wertz & Larson, *Space Mission Analysis and Design*):

| Topic | Model |
|---|---|
| Orbits | Circular two-body orbits with J2 nodal regression |
| Sun-synchronous inclination | Computed from altitude: 98.2° at 705 km |
| Eclipses | Cylindrical-shadow eclipse fraction: 35 min at 705 km, ~70 min at GEO equinox |
| Ground contact | Visibility circle above 10° elevation; average daily contact |
| Atmosphere and decay | Density table for moderate solar activity, and integrated decay time |
| Drag | Make-up Δv per year |
| Manoeuvres | Hohmann transfers, deorbit burn, and GTO-to-GEO with plane change (1.49 km/s from Kourou, 1.83 km/s from the Cape) |
| Propellant | The rocket equation |
| Solar array sizing | SMAD eq. 11-5 |
| Thermal | Lumped hot and cold cases |
| Radiation | Rough dose per year by altitude |
| Link budget | Free-space path loss, EIRP and G/T |

The live simulation (`ops.ts`) propagates the orbit, the Earth's rotation and the Sun. It works out eclipses and ground-station elevations, and integrates battery charge, temperature, recorder fill, wheel momentum, drag and propellant from the same numbers the review uses.

## Accuracy

The figures are approximate and meant for learning trade-offs:
- **Part figures** (mass, power, cost and reliability) are representative of each hardware class, rounded.
- **Launcher capacities and costs** are approximate public figures for each class.
- **Radiation, thermal and reliability models** are deliberately simple.

The six recommended builds pass every check, and each fails in the expected way if you change it. Examples:
- remove the radiators and it overheats;
- drop the magnetorquers and it cannot detumble;
- fly a CubeSat at 650 km with no propulsion and it breaks the 5-year disposal rule;
- launch a GEO satellite from Baikonur and it needs more Δv.

Real programmes are named because the missions are modelled on them; no logos or branding are used.

## Files

- `catalog.ts`: parts.
- `missions.ts`: missions, sites, launchers and stations.
- `analysis.ts`: the review.
- `physics.ts`: orbital mechanics and budgets.
- `ops.ts`: operations, commissioning and anomalies.
- `launch.ts`: the poll and the ascent.
- `earth.ts` and `landmask.ts`: the globe texture, from Natural Earth via world-atlas, and the land mask.
- `model.ts`: the satellite's 3D model.
- `scene.ts`: the three.js scene.
- `learn.ts`: the handbook and the interaction map.
- `SatLab.tsx`: the UI.

## Testing hooks

`window.__sat = { scene, ops(), launch(), stop() }`.
