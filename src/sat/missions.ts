/**
 * Missions, launch sites, launch vehicles and ground stations.
 *
 * Each mission is an archetype modelled on real programmes, with orbits and
 * requirements in the range those programmes use. Launch-vehicle capacities
 * are approximate public figures for each vehicle class.
 */

import type { MissionKind } from './catalog';

export type Mission = {
  id: MissionKind;
  name: string;
  tagline: string;
  inspired: string;
  orbit: { kind: 'LEO' | 'SSO' | 'MEO' | 'GEO'; alt: number; inc: number | 'sso' };
  /** where the launcher leaves the satellite */
  insertion: { kind: 'direct' | 'low' | 'gto' | 'meo'; alt?: number };
  lifeYears: number;
  dataGBday: number;
  pointing: number;
  budget: number; // $M including launch
  payloadKinds: MissionKind[];
  stations: number;
  /** what the mission must achieve in operations */
  opsGoal: string;
  story: string[];
  preset: string[];
  presetProp: number;
  /** radiator area, m² */
  presetRad: number;
  /** satellites sharing one launch (constellations) */
  batch?: number;
};

export const MISSIONS: Mission[] = [
  {
    id: 'cube',
    name: 'Student CubeSat',
    tagline: 'Your first satellite: a 3U that measures radiation and talks to radio amateurs.',
    inspired: 'Hundreds of university CubeSats since 2003, launched on rideshares or deployed from the ISS, India\'s student satellites on PSLV among them.',
    orbit: { kind: 'SSO', alt: 500, inc: 'sso' },
    insertion: { kind: 'direct' },
    lifeYears: 1,
    dataGBday: 0.0008,
    pointing: 10,
    budget: 1.2,
    payloadKinds: ['cube'],
    stations: 1,
    opsGoal: 'Survive separation, detumble, make first contact, and return a year of science.',
    story: [
      'Most CubeSats fail in the first weeks, often because the batteries flatten before anyone hears from them, or the antennas never deploy.',
      'Keep it simple: body or deployable cells, a magnetorquer detumble, a UHF radio. At 500 km drag will bring it down in a few years, inside the 5-year rule for debris.',
    ],
    preset: ['cs3', 'pl-sci-cs', 'sol-cdep', 'bat-40', 'sen-sun', 'sen-mag', 'sen-gyro', 'act-mtq', 'prop-none', 'com-uhf', 'obc-cs', 'th-heat'],
    presetProp: 0,
    presetRad: 0,
  },
  {
    id: 'eo',
    name: 'Earth-observation satellite',
    tagline: 'Image every landmass every 16 days from a sun-synchronous orbit.',
    inspired: 'NASA/USGS Landsat 8 and 9 (705 km SSO, 185 km swath), ESA Sentinel-2 and ISRO\'s Cartosat and Resourcesat series.',
    orbit: { kind: 'SSO', alt: 705, inc: 'sso' },
    insertion: { kind: 'direct' },
    lifeYears: 5,
    dataGBday: 100,
    pointing: 0.05,
    budget: 260,
    payloadKinds: ['eo'],
    stations: 3,
    opsGoal: 'Keep images flowing: downlink at least a day\'s data each day and hold the orbit for 5 years.',
    story: [
      'A sun-synchronous orbit tilts slightly past the pole (about 98°) so that Earth\'s bulge swings the orbit plane round once a year, keeping pace with the Sun. Every pass crosses the equator at the same local time (Landsat\'s is about 10 am), so shadows and lighting match from year to year.',
      'The bottleneck is usually not the camera but getting the data down: polar ground stations (Svalbard, Alaska) see a polar orbiter on almost every orbit.',
    ],
    preset: ['small', 'pl-cam', 'sol-track', 'bat-3k', 'sen-sun', 'sen-mag', 'sen-gyro', 'sen-st', 'sen-gnss', 'act-rw', 'act-mtq-big', 'prop-mono', 'com-s', 'com-x', 'obc-rt', 'th-mli', 'th-heat'],
    presetProp: 55,
    presetRad: 0.6,
  },
  {
    id: 'broadband',
    name: 'Broadband constellation satellite',
    tagline: 'One satellite of thousands, bringing internet to anywhere on Earth.',
    inspired: 'SpaceX Starlink (~550 km, 53°), Eutelsat OneWeb (~1,200 km). Starlink satellites are launched low and raise themselves with krypton/argon Hall thrusters.',
    orbit: { kind: 'LEO', alt: 550, inc: 53 },
    insertion: { kind: 'low', alt: 300 },
    lifeYears: 5,
    dataGBday: 0,
    pointing: 0.1,
    budget: 90,
    batch: 22,
    payloadKinds: ['broadband'],
    stations: 2,
    opsGoal: 'Raise the orbit from 300 km to 550 km with electric propulsion, then serve users and dodge debris.',
    story: [
      'Low orbit means short delays (~25 ms) but each satellite sees only a small patch of Earth for a few minutes, so you need thousands of them to cover the globe continuously.',
      'Releasing them at ~300 km is a safety feature: a dead satellite there re-enters within weeks instead of becoming debris.',
    ],
    preset: ['small', 'pl-bb', 'pl-isl', 'sol-track-l', 'bat-6k', 'sen-sun', 'sen-mag', 'sen-st', 'sen-gnss', 'act-rw', 'act-mtq-big', 'prop-hall', 'com-s', 'com-ka', 'obc-rt', 'th-mli', 'th-heat'],
    presetProp: 60,
    presetRad: 7,
  },
  {
    id: 'nav',
    name: 'Navigation satellite',
    tagline: 'Broadcast time from atomic clocks so receivers can find themselves.',
    inspired: 'GPS (US Space Force, MEO 20,180 km, 55°, 12-hour orbits), Galileo (EU), and ISRO\'s NavIC (geostationary and inclined geosynchronous).',
    orbit: { kind: 'MEO', alt: 20200, inc: 55 },
    insertion: { kind: 'meo' },
    lifeYears: 12,
    dataGBday: 0,
    pointing: 0.5,
    budget: 400,
    payloadKinds: ['nav'],
    stations: 3,
    opsGoal: 'Survive the radiation belts for 12 years and keep the clocks and signals stable.',
    story: [
      'At 20,200 km a GPS satellite circles twice a day and sees almost half the Earth; with 24 or more in six planes, any receiver can see at least four at once, which is the minimum to solve for latitude, longitude, height and its own clock error.',
      'MEO sits in the radiation belts, so electronics must be radiation-hardened.',
    ],
    preset: ['medium', 'pl-nav', 'sol-track', 'bat-3k', 'sen-sun', 'sen-earth', 'sen-gyro', 'sen-st', 'act-rw', 'prop-mono', 'com-s', 'obc-rh', 'th-mli', 'th-heat'],
    presetProp: 120,
    presetRad: 2.8,
  },
  {
    id: 'geo',
    name: 'Geostationary comsat',
    tagline: 'Hang over one spot of the equator and relay TV and data for 15 years.',
    inspired: 'Commercial geostationary satellites (e.g., Intelsat, SES), ISRO\'s GSAT and INSAT series, launched to GTO by Ariane, Falcon 9 or LVM3.',
    orbit: { kind: 'GEO', alt: 35786, inc: 0 },
    insertion: { kind: 'gto' },
    lifeYears: 15,
    dataGBday: 0,
    pointing: 0.05,
    budget: 560,
    payloadKinds: ['geo'],
    stations: 1,
    opsGoal: 'Climb from GTO to GEO, survive eclipse seasons, and hold the slot with station-keeping for 15 years.',
    story: [
      'At 35,786 km an orbit takes exactly one sidereal day, so the satellite seems to stand still in the sky: dishes on the ground never need to move.',
      'The launcher only reaches a geostationary transfer orbit (GTO). The satellite\'s own engine circularises it and removes the tilt left by the launch site\'s latitude, which is why equatorial launch sites like Kourou save fuel.',
    ],
    preset: ['large', 'pl-geo', 'sol-roll', 'bat-12k', 'sen-sun', 'sen-earth', 'sen-gyro', 'sen-st', 'act-rw', 'prop-biprop', 'com-dsn', 'obc-rh', 'th-mli', 'th-heat'],
    presetProp: 3000,
    presetRad: 32,
  },
  {
    id: 'telescope',
    name: 'Space telescope',
    tagline: 'Above the atmosphere, hold perfectly still and look deep.',
    inspired: 'NASA/ESA\'s Hubble Space Telescope (~540 km, 28.5°, 2.4 m mirror) and NASA\'s TESS survey telescope; ISRO\'s AstroSat (650 km, 6°).',
    orbit: { kind: 'LEO', alt: 540, inc: 28.5 },
    insertion: { kind: 'direct' },
    lifeYears: 10,
    dataGBday: 15,
    pointing: 0.002,
    budget: 1800,
    payloadKinds: ['telescope'],
    stations: 2,
    opsGoal: 'Point with extraordinary stability, avoid the Sun, and return observations for 10 years.',
    story: [
      'Telescopes go to space to escape the air\'s blurring and its absorption of ultraviolet and infrared. The hard part is stillness: a long exposure needs the pointing held to a few thousandths of an arcsecond.',
      'Hubble steers with reaction wheels only, using no propellant, and dumps momentum with magnetorquers.',
    ],
    preset: ['medium', 'pl-tel-s', 'sol-track', 'bat-3k', 'sen-sun', 'sen-mag', 'sen-gyro', 'sen-st', 'act-rw', 'act-mtq-big', 'prop-mono', 'com-s', 'com-x', 'obc-rh', 'th-mli', 'th-heat'],
    presetProp: 60,
    presetRad: 0.85,
  },
];

export type Site = { id: string; name: string; lat: number; lon: number; note: string; sso: boolean };
export const SITES: Site[] = [
  { id: 'shar', name: 'Sriharikota, India', lat: 13.72, lon: 80.23, note: 'ISRO\'s Satish Dhawan Space Centre: PSLV, GSLV and LVM3. Launches east over the Bay of Bengal, or south to polar orbits.', sso: true },
  { id: 'cape', name: 'Cape Canaveral, USA', lat: 28.49, lon: -80.58, note: 'Kennedy and Cape Canaveral: Falcon 9, Atlas V, Vulcan. East over the Atlantic for GTO and the ISS.', sso: false },
  { id: 'vsfb', name: 'Vandenberg, USA', lat: 34.74, lon: -120.57, note: 'California: launches south over the Pacific into polar and sun-synchronous orbits.', sso: true },
  { id: 'kourou', name: 'Kourou, French Guiana', lat: 5.24, lon: -52.77, note: 'Europe\'s spaceport, 5° from the equator: Ariane 6 and Vega. The best place to start a GEO mission.', sso: true },
  { id: 'mahia', name: 'Mahia, New Zealand', lat: -39.26, lon: 177.86, note: 'Rocket Lab\'s Launch Complex 1, for small launches to a wide range of inclinations.', sso: true },
  { id: 'baikonur', name: 'Baikonur, Kazakhstan', lat: 45.92, lon: 63.34, note: 'Where Sputnik and Gagarin flew from; Soyuz and Proton.', sso: false },
];

export type Launcher = {
  id: string; name: string; example: string; leo: number; sso: number; gto: number; meo: number; cost: number; rel: number; fairing: string; cubesatOnly?: boolean; reusable?: boolean; note: string;
};
export const LAUNCHERS: Launcher[] = [
  { id: 'ride', name: 'CubeSat rideshare', example: 'dispenser slot on a larger launch (e.g., PSLV, Falcon 9 Transporter)', leo: 24, sso: 24, gto: 0, meo: 0, cost: 0.1, rel: 0.97, fairing: 'deployer box', cubesatOnly: true, note: 'Cheap, but you go where the main payload goes, when it goes.' },
  { id: 'small', name: 'Small launcher', example: 'Rocket Lab Electron class', leo: 300, sso: 200, gto: 0, meo: 0, cost: 8, rel: 0.94, fairing: '1.2 m', note: 'Your own schedule and orbit for satellites up to ~200 kg.' },
  { id: 'pslv', name: 'Medium launcher', example: 'ISRO PSLV-XL class', leo: 3800, sso: 1750, gto: 1425, meo: 0, cost: 30, rel: 0.95, fairing: '3.2 m', note: 'Famous for SSO missions; launched Chandrayaan-1, Mangalyaan and 104 satellites in one flight.' },
  { id: 'lvm3', name: 'Heavy launcher', example: 'ISRO LVM3 class', leo: 8000, sso: 4000, gto: 4000, meo: 2500, cost: 55, rel: 0.95, fairing: '5 m', note: 'Cryogenic upper stage for 4-tonne GTO payloads; launched Chandrayaan-3.' },
  { id: 'f9', name: 'Reusable medium-heavy launcher', example: 'SpaceX Falcon 9 class (booster landing)', leo: 17500, sso: 12000, gto: 5500, meo: 4300, cost: 70, rel: 0.99, fairing: '5.2 m', reusable: true, note: 'First stage lands for reuse; the most-flown rocket today.' },
  { id: 'fh', name: 'Super-heavy launcher', example: 'SpaceX Falcon Heavy class', leo: 50000, sso: 35000, gto: 8000, meo: 6000, cost: 97, rel: 0.98, fairing: '5.2 m', reusable: true, note: 'Three cores; for the heaviest GEO and deep-space payloads.' },
];

/** Payload capacity (kg) of a launcher to a mission's insertion orbit. */
export function capacity(l: Launcher, m: Mission) {
  if (m.insertion.kind === 'gto') return l.gto;
  if (m.insertion.kind === 'meo') return l.meo;
  const alt = m.insertion.alt ?? m.orbit.alt;
  const base = m.orbit.inc === 'sso' || (typeof m.orbit.inc === 'number' && m.orbit.inc > 80) ? l.sso : l.leo;
  // capacity falls with altitude: roughly 15% per 300 km above 300 km
  return Math.max(0, base * (1 - Math.max(0, alt - 300) * 0.0005));
}

export type Station = { id: string; name: string; lat: number; lon: number; cost: number };
export const STATIONS: Station[] = [
  { id: 'svalbard', name: 'Svalbard (SvalSat)', lat: 78.23, lon: 15.39, cost: 0.6 },
  { id: 'bengaluru', name: 'Bengaluru (ISTRAC)', lat: 13.03, lon: 77.51, cost: 0.3 },
  { id: 'fairbanks', name: 'Fairbanks, Alaska', lat: 64.86, lon: -147.85, cost: 0.4 },
  { id: 'kiruna', name: 'Kiruna, Sweden', lat: 67.86, lon: 20.96, cost: 0.4 },
  { id: 'hartrao', name: 'Hartebeesthoek, South Africa', lat: -25.89, lon: 27.69, cost: 0.3 },
  { id: 'canberra', name: 'Canberra, Australia', lat: -35.4, lon: 148.98, cost: 0.3 },
  { id: 'wallops', name: 'Wallops, USA', lat: 37.94, lon: -75.46, cost: 0.3 },
  { id: 'troll', name: 'Troll, Antarctica', lat: -72.01, lon: 2.53, cost: 0.6 },
];
