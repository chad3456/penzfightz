/**
 * The physics everything else leans on: two-body orbits with the J2
 * oblateness term, eclipses, ground-station visibility, atmospheric drag,
 * the rocket equation and the usual first-order spacecraft budgets.
 *
 * These are the textbook first-cut formulas mission designers use before
 * any detailed simulation (Vallado; Wertz & Larson, "Space Mission Analysis
 * and Design"). Good to a few percent for circular orbits; the numbers on
 * screen say "approx." where that matters.
 */

export const MU = 398600.4418; // km³/s², Earth's gravitational parameter
export const RE = 6378.137; // km, equatorial radius
export const J2 = 1.08262668e-3;
export const G0 = 9.80665; // m/s²
export const SOLAR = 1361; // W/m², solar constant at 1 AU
export const SIGMA = 5.670374e-8; // Stefan–Boltzmann
export const DAY = 86400;
export const SIDEREAL = 86164.0905;
const OMEGA_SUN = (2 * Math.PI) / (365.2422 * DAY); // rad/s, the Sun's apparent motion

export const deg = Math.PI / 180;

/** Orbital period (s) of a circular orbit at altitude h (km). */
export const period = (h: number) => 2 * Math.PI * Math.sqrt((RE + h) ** 3 / MU);
/** Circular speed (km/s). */
export const vCirc = (h: number) => Math.sqrt(MU / (RE + h));

/**
 * Sun-synchronous inclination (deg): the tilt at which J2 turns the orbit
 * plane exactly once a year, so the satellite crosses each latitude at the
 * same local time every day.
 */
export function ssoInclination(h: number) {
  const a = RE + h;
  const c = -(2 * OMEGA_SUN * Math.pow(a, 3.5)) / (3 * J2 * RE * RE * Math.sqrt(MU));
  return Math.acos(Math.max(-1, Math.min(1, c))) / deg;
}

/** Nodal regression (deg/day) from J2 for a circular orbit. */
export function raanRate(h: number, incDeg: number) {
  const a = RE + h;
  const n = Math.sqrt(MU / a ** 3);
  return (-1.5 * n * J2 * (RE / a) ** 2 * Math.cos(incDeg * deg)) / deg * DAY;
}

/**
 * Longest eclipse as a fraction of the orbit, for the worst case (Sun in
 * the orbit plane, beta angle 0), cylindrical shadow.
 */
export function eclipseFraction(h: number, betaDeg = 0) {
  const a = RE + h;
  const x = Math.sqrt(h * h + 2 * RE * h) / (a * Math.cos(betaDeg * deg));
  if (x >= 1) return 0;
  return Math.acos(x) / Math.PI;
}

/** Longest eclipse duration (s). For GEO this is ~70 min at the equinoxes and zero for most of the year. */
export const eclipseSeconds = (h: number) => eclipseFraction(h) * period(h);

/**
 * Ground visibility: the Earth-central half-angle (deg) of the circle a
 * station can see the satellite in, above a minimum elevation.
 */
export function coverageHalfAngle(h: number, minElDeg = 10) {
  const e = minElDeg * deg;
  const eta = Math.asin((RE * Math.cos(e)) / (RE + h));
  return (Math.PI / 2 - e - eta) / deg;
}

/** Longest single pass (s), straight overhead. */
export function maxPassSeconds(h: number, minEl = 10) {
  const lam = coverageHalfAngle(h, minEl) * deg;
  // ground speed relative to a rotating Earth is ignored: fine for LEO, generous for MEO
  return (period(h) * 2 * lam) / (2 * Math.PI);
}

/**
 * Average contact time per day (s) with one ground station.
 * For a geostationary satellite in view it is the whole day. Otherwise it is
 * the fraction of the sphere a station's visibility cap covers, which is the
 * long-run average for an orbit whose ground track wanders over the globe,
 * boosted at high latitude for polar orbits.
 */
export function contactPerDay(h: number, incDeg: number, stationLat: number, minEl = 10) {
  if (h > 35000 && incDeg < 1) return Math.abs(stationLat) < 70 ? DAY : 0;
  const lam = coverageHalfAngle(h, minEl) * deg;
  const cap = (1 - Math.cos(lam)) / 2;
  // stations above the orbit's reach see nothing
  if (Math.abs(stationLat) > incDeg + lam / deg + 2 && incDeg < 90) return 0;
  // a ground track spends more time near its turning latitude, which favours polar stations for polar orbits
  const latFactor = incDeg > 80 ? 1 + 1.6 * Math.pow(Math.abs(stationLat) / 90, 3) * 3 : 1 + 0.6 * Math.max(0, 1 - Math.abs(Math.abs(stationLat) - incDeg) / 20);
  return Math.min(DAY, DAY * cap * latFactor);
}

/**
 * Atmospheric density (kg/m³) for moderate solar activity, log-interpolated.
 * Values are typical of the standard tables (e.g., SMAD Table 8-4, mean
 * solar activity). Real density swings 10× with the solar cycle.
 */
const RHO: [number, number][] = [
  [100, 5.6e-7], [150, 2.0e-9], [200, 2.5e-10], [250, 6.2e-11], [300, 1.9e-11], [350, 6.9e-12],
  [400, 2.8e-12], [450, 1.2e-12], [500, 5.2e-13], [550, 2.5e-13], [600, 1.1e-13], [700, 2.4e-14],
  [800, 6.5e-15], [900, 2.0e-15], [1000, 7.5e-16], [1500, 2e-17], [2000, 1e-18],
];
export function density(h: number) {
  if (h >= 2000) return 0;
  if (h <= RHO[0][0]) return RHO[0][1];
  let i = 0;
  while (i < RHO.length - 2 && RHO[i + 1][0] < h) i++;
  const [h0, r0] = RHO[i], [h1, r1] = RHO[i + 1];
  const t = (h - h0) / (h1 - h0);
  return Math.exp(Math.log(r0) + (Math.log(r1) - Math.log(r0)) * t);
}

/**
 * Orbit decay: years until a circular orbit at h (km) falls to 150 km,
 * for ballistic coefficient m/(Cd·A) in kg/m². da/dt = −(Cd·A/m)·ρ·√(μa).
 */
export function decayYears(h: number, massKg: number, areaM2: number, cd = 2.2, solar = 1) {
  if (h > 1800) return Infinity;
  let a = (RE + h) * 1000; // m
  const mu = MU * 1e9;
  const B = (cd * areaM2) / massKg;
  let t = 0;
  const end = (RE + 150) * 1000;
  let guard = 0;
  while (a > end && guard++ < 200000) {
    const hh = a / 1000 - RE;
    const rho = density(hh) * solar;
    const dadt = -B * rho * Math.sqrt(mu * a); // m/s
    // step so the orbit drops at most 2 km, capped at 30 days
    const dt = Math.min(30 * DAY, 2000 / Math.max(1e-12, -dadt));
    a += dadt * dt;
    t += dt;
    if (t > 500 * 365.25 * DAY) return Infinity;
  }
  return t / (365.25 * DAY);
}

/** Δv per year (m/s) needed to hold altitude against drag. */
export function dragMakeupPerYear(h: number, massKg: number, areaM2: number, cd = 2.2, solar = 1) {
  const v = vCirc(h) * 1000;
  const rho = density(h) * solar;
  const accel = (0.5 * rho * v * v * cd * areaM2) / massKg; // m/s²
  return accel * 365.25 * DAY;
}

/** Hohmann transfer Δv (m/s) between circular orbits at altitudes h1 → h2 (km). */
export function hohmann(h1: number, h2: number) {
  const r1 = RE + h1, r2 = RE + h2;
  const at = (r1 + r2) / 2;
  const v1 = Math.sqrt(MU / r1), v2 = Math.sqrt(MU / r2);
  const vp = Math.sqrt(MU * (2 / r1 - 1 / at)), va = Math.sqrt(MU * (2 / r2 - 1 / at));
  return { dv1: Math.abs(vp - v1) * 1000, dv2: Math.abs(v2 - va) * 1000, total: (Math.abs(vp - v1) + Math.abs(v2 - va)) * 1000, timeS: Math.PI * Math.sqrt(at ** 3 / MU) };
}

/** Δv (m/s) to lower perigee from a circular orbit to a disposal perigee (default 50 km): a controlled re-entry burn. */
export function deorbitDv(h: number, perigee = 50) {
  const r = RE + h, rp = RE + perigee;
  const at = (r + rp) / 2;
  return (Math.sqrt(MU / r) - Math.sqrt(MU * (2 / r - 1 / at))) * 1000;
}

/**
 * GTO → GEO: circularise at apogee and take out the inclination left over
 * from the launch site, in one combined burn (m/s).
 */
export function gtoToGeo(incDeg: number, perigeeKm = 250) {
  const ra = RE + 35786, rp = RE + perigeeKm;
  const at = (ra + rp) / 2;
  const va = Math.sqrt(MU * (2 / ra - 1 / at));
  const vg = Math.sqrt(MU / ra);
  return Math.sqrt(va * va + vg * vg - 2 * va * vg * Math.cos(incDeg * deg)) * 1000;
}

/** Tsiolkovsky: Δv (m/s) from Isp (s) and wet/dry mass. */
export const rocketDv = (isp: number, wet: number, dry: number) => (dry > 0 && wet > dry ? isp * G0 * Math.log(wet / dry) : 0);
/** Propellant (kg) needed for Δv (m/s). */
export const propFor = (dv: number, isp: number, dry: number) => (isp > 0 ? dry * (Math.exp(dv / (isp * G0)) - 1) : Infinity);

/**
 * Solar array sizing in the classic form (SMAD eq. 11-5): the power the
 * array must make in sunlight to run the loads all orbit and recharge the
 * battery for the eclipse, through charge (0.6) and direct (0.8) path
 * efficiencies.
 */
export function arrayPowerNeeded(loadW: number, h: number) {
  const P = period(h);
  const Te = eclipseSeconds(h), Td = P - Te;
  if (Td <= 0) return Infinity;
  return (loadW * Te / 0.6 + loadW * Td / 0.8) / Td;
}

/** Thermal equilibrium (°C) of a lumped spacecraft. */
export function equilibriumC(absorbedW: number, internalW: number, radiatingArea: number, emissivity: number) {
  const q = absorbedW + internalW;
  if (radiatingArea * emissivity <= 0) return 400;
  return Math.pow(q / (SIGMA * radiatingArea * emissivity), 0.25) - 273.15;
}

/**
 * Total ionising dose (krad(Si) per year) behind ~3 mm of aluminium, very
 * roughly, by altitude: low LEO is gentle, the inner belt peaks near
 * 1,000–5,000 km, the outer belt and slot dominate MEO, and GEO sits at the
 * outer edge of the outer belt.
 */
export function dosePerYear(h: number, incDeg: number) {
  if (h < 1000) return 0.3 + (h / 1000) ** 2 * 4 + (incDeg > 60 ? 0.3 : 0);
  if (h < 6000) return 50;
  if (h < 15000) return 30;
  if (h < 25000) return 10; // MEO navigation orbits, behind typical spacecraft shielding
  return 5; // GEO
}

/** Free-space path loss (dB) at distance km and frequency GHz. */
export const fspl = (km: number, ghz: number) => 20 * Math.log10(km) + 20 * Math.log10(ghz) + 92.45;

/** Slant range (km) to a satellite at altitude h seen at elevation el (deg). */
export function slantRange(h: number, elDeg: number) {
  const e = elDeg * deg, r = RE + h;
  return Math.sqrt(r * r - (RE * Math.cos(e)) ** 2) - RE * Math.sin(e);
}

/* ---------- vectors and frames for the live simulation ---------- */

export type V3 = [number, number, number];

/**
 * Position (km, Earth-centred inertial) on a circular orbit.
 * u = argument of latitude (rad), raan and inc in rad.
 */
export function eci(h: number, inc: number, raan: number, u: number): V3 {
  const r = RE + h;
  const cu = Math.cos(u), su = Math.sin(u), cO = Math.cos(raan), sO = Math.sin(raan), ci = Math.cos(inc), si = Math.sin(inc);
  return [r * (cO * cu - sO * su * ci), r * (sO * cu + cO * su * ci), r * (su * si)];
}

/** Sub-satellite latitude/longitude (deg) given the Earth's rotation angle gmst (rad). */
export function subPoint(p: V3, gmst: number) {
  const [x, y, z] = p;
  const r = Math.hypot(x, y, z);
  const lat = Math.asin(z / r) / deg;
  let lon = (Math.atan2(y, x) - gmst) / deg;
  lon = ((lon + 540) % 360) - 180;
  return { lat, lon };
}

/** ECI position (km) of a ground site at lat/lon (deg). */
export function siteEci(lat: number, lon: number, gmst: number): V3 {
  const la = lat * deg, lo = lon * deg + gmst;
  return [RE * Math.cos(la) * Math.cos(lo), RE * Math.cos(la) * Math.sin(lo), RE * Math.sin(la)];
}

/** Elevation (deg) of the satellite seen from a ground site. */
export function elevation(sat: V3, site: V3) {
  const d: V3 = [sat[0] - site[0], sat[1] - site[1], sat[2] - site[2]];
  const n = Math.hypot(site[0], site[1], site[2]);
  const up: V3 = [site[0] / n, site[1] / n, site[2] / n];
  const dn = Math.hypot(d[0], d[1], d[2]);
  return Math.asin((d[0] * up[0] + d[1] * up[1] + d[2] * up[2]) / dn) / deg;
}

/** Is the satellite in Earth's (cylindrical) shadow, for a Sun along unit vector s? */
export function inShadow(p: V3, s: V3) {
  const dot = p[0] * s[0] + p[1] * s[1] + p[2] * s[2];
  if (dot > 0) return false;
  const perp = Math.hypot(p[0] - dot * s[0], p[1] - dot * s[1], p[2] - dot * s[2]);
  return perp < RE;
}
