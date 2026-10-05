/**
 * Design review: turns a parts list, an orbit and a launch choice into the
 * budgets engineers check at every design review: mass, volume, power,
 * energy, thermal, pointing, momentum, link, Δv, lifetime and debris,
 * radiation, launch and cost. Every check says why it matters and how to fix it.
 */

import { BY_ID, bodySolarArea, type Comp } from './catalog';
import { LAUNCHERS, MISSIONS, SITES, STATIONS, capacity, type Mission } from './missions';
import {
  DAY, RE, SIGMA, SOLAR, arrayPowerNeeded, contactPerDay, decayYears, deorbitDv, dosePerYear, dragMakeupPerYear, eclipseFraction, eclipseSeconds,
  fspl, gtoToGeo, hohmann, period, raanRate, rocketDv, slantRange, ssoInclination, vCirc,
} from './physics';
import type { MissionKind } from './catalog';

export type Design = {
  mission: MissionKind;
  parts: string[];
  prop: number; // kg of propellant
  radiator: number; // m² of radiator
  alt: number; // km
  launcher: string;
  site: string;
  stations: string[];
};

export type Status = 'ok' | 'warn' | 'fail';
export type Check = { id: string; group: string; title: string; status: Status; value: string; need: string; why: string; fix?: string; pct?: number };

export const ALT_RANGE: Record<MissionKind, [number, number]> = {
  cube: [350, 650], eo: [450, 850], broadband: [340, 1200], nav: [19000, 23500], geo: [35786, 35786], telescope: [450, 700],
};

export function defaultDesign(m: Mission): Design {
  const site = m.orbit.kind === 'GEO' ? 'kourou' : m.id === 'cube' || m.id === 'eo' ? 'shar' : 'cape';
  const launcher = m.id === 'cube' ? 'ride' : m.id === 'eo' ? 'pslv' : m.id === 'broadband' ? 'f9' : m.id === 'geo' ? 'fh' : m.id === 'nav' ? 'f9' : 'f9';
  const stations = m.orbit.kind === 'SSO' ? (m.id === 'cube' ? ['bengaluru'] : ['svalbard', 'bengaluru', 'fairbanks']) : m.orbit.kind === 'GEO' ? ['bengaluru'] : m.id === 'nav' ? ['bengaluru', 'hartrao', 'wallops'] : ['bengaluru', 'canberra'];
  return { mission: m.id, parts: [...m.preset], prop: m.presetProp, radiator: m.presetRad, alt: m.orbit.alt, launcher, site, stations };
}

export const missionOf = (d: Design) => MISSIONS.find((m) => m.id === d.mission)!;
export const partsOf = (d: Design) => d.parts.map((id) => BY_ID[id]).filter(Boolean) as Comp[];
export const busOf = (d: Design) => partsOf(d).find((c) => c.slot === 'bus');

export function inclination(d: Design) {
  const m = missionOf(d);
  return m.orbit.inc === 'sso' ? ssoInclination(d.alt) : m.orbit.inc;
}

/** Fraction of the time a payload is working. */
function payloadDuty(c: Comp, m: Mission) {
  if (c.kind?.includes('eo') && m.id === 'eo') return 0.32; // land in daylight, roughly a third of each orbit
  if (c.kind?.includes('cube')) return 0.8;
  if (c.kind?.includes('telescope')) return 0.8;
  return 1;
}

export type Analysis = ReturnType<typeof analyse>;

export function analyse(d: Design) {
  const m = missionOf(d);
  const parts = partsOf(d);
  const bus = busOf(d);
  const busClass = bus?.busClass ?? 0;
  const by = (slot: Comp['slot']) => parts.filter((c) => c.slot === slot);
  const inc = inclination(d);
  const h = d.alt;
  const P = period(h);
  const eclF = m.orbit.kind === 'GEO' ? eclipseSeconds(h) / DAY : eclipseFraction(h);
  const eclS = eclipseSeconds(h);
  const life = m.lifeYears;
  const checks: Check[] = [];
  const add = (c: Check) => checks.push(c);

  // ---------- mass ----------
  const radMass = d.radiator * ((busOf(d)?.busClass ?? 0) <= 2 ? 1.5 : 4.5); // panel, paint/mirrors and heat pipes
  const compMass = parts.reduce((s, c) => s + c.mass, 0) + radMass;
  const harness = compMass * 0.06;
  const dryNoMargin = compMass + harness;
  const dry = dryNoMargin * 1.1; // 10% system margin, standard at concept stage
  const wet = dry + d.prop;
  // ---------- power ----------
  const solar = by('solar')[0];
  const stations = STATIONS.filter((s) => d.stations.includes(s.id));
  const contact = stations.reduce((s, st) => s + contactPerDay(h, inc, st.lat), 0);
  const contactFrac = Math.min(1, contact / DAY);
  let load = 0;
  const loads: { name: string; w: number; slot: string }[] = [];
  for (const c of parts) {
    let w = c.power;
    if (c.slot === 'payload') w *= payloadDuty(c, m);
    if (c.slot === 'comms') w *= c.payloadLink ? Math.min(1, contactFrac * 1.15) : c.id === 'com-dsn' ? 1 : 0.3 + 0.7 * contactFrac;
    if (c.slot === 'propulsion') w *= c.prop === 'hall' || c.prop === 'ion' ? 0.03 : 0.2; // only while firing
    if (w > 0) { loads.push({ name: c.name, w, slot: c.slot }); load += w; }
  }
  // thermal: work out the heater power needed in the cold case, and add it
  const size = bus?.size ?? [0.1, 0.1, 0.34];
  const areaTot = 2 * (size[0] * size[1] + size[1] * size[2] + size[0] * size[2]);
  const aProj = bodySolarArea(bus ?? BY_ID.cs3) * 0.9;
  const mli = parts.some((c) => c.mli);
  const radArea = d.radiator; // m² of white-paint / mirror radiator, ε≈0.85
  // without MLI the outside is bare: covered in solar cells (α≈0.9, ε≈0.85) or anodised panels
  const cellsOnBody = solarIsBody(parts);
  const alphaB = mli ? 0.04 : cellsOnBody ? 0.85 : 0.55, epsB = mli ? 0.03 : cellsOnBody ? 0.85 : 0.8;
  const earthIR = h < 3000 ? 237 * (RE / (RE + h)) ** 2 : 0;
  const albedo = h < 3000 ? 0.3 * SOLAR * (RE / (RE + h)) ** 2 * 0.5 : 0;
  const emit = SIGMA * (epsB * areaTot + 0.85 * radArea);
  // most electrical power ends up as heat; transmitters send a share away as radio waves
  const internal = loads.reduce((s, l) => s + l.w * (l.slot === 'payload' && parts.some((c) => c.slot === 'payload' && c.serves) ? 0.75 : 0.95), 0);
  const qHot = alphaB * aProj * (SOLAR + albedo) + epsB * areaTot * 0.25 * earthIR + 0.2 * radArea * SOLAR * 0.1 + internal;
  const tHot = Math.pow(qHot / emit, 0.25) - 273.15;
  // cold case, orbit-averaged (the thermal mass carries a LEO satellite through each eclipse):
  // least sunlight, end-of-life optical properties, low power
  const sunFrac = 1 - eclF;
  const alwaysOn = parts.some((c) => c.slot === 'payload' && c.serves);
  const qCold = alphaB * aProj * (SOLAR + albedo * 0.6) * sunFrac * 0.85 + epsB * areaTot * 0.25 * earthIR + internal * (alwaysOn ? 0.9 : 0.6);
  const tColdRaw = Math.pow(qCold / emit, 0.25) - 273.15;
  // heaters hold the electronics at −10 °C or above, and the battery and propellant lines at +5 °C
  const batW = (by('battery')[0]?.wh ?? 0) * 0.002 + (parts.some((c) => c.prop === 'mono' || c.prop === 'biprop') ? 15 : 0);
  const heaterNeed = Math.max(0, emit * Math.pow(273.15 - 10, 4) - qCold) + batW;
  const hasHeaters = parts.some((c) => c.heater);
  const heaterW = hasHeaters ? heaterNeed : 0;
  if (heaterW > 0) { loads.push({ name: 'Heaters (eclipse average)', w: heaterW, slot: 'thermal' }); load += heaterW; }
  const tCold = hasHeaters ? Math.max(-10, tColdRaw) : tColdRaw;

  let gen = 0, area = 0;
  const degr = solar?.degr ?? 0.025;
  if (solar && bus) {
    area = solar.mount === 'body' ? bodySolarArea(bus) : solar.id === 'sol-cdep' ? [0.12, 0.27, 0.45][Math.min(2, busClass)] + bodySolarArea(bus) * 0.5 : solar.area!;
    const cos = solar.mount === 'body' ? 0.55 : solar.mount === 'fixed' ? 0.75 : 0.95;
    const bol = area * (solar.eff ?? 0.29) * SOLAR * 0.85 * cos;
    gen = bol * Math.pow(1 - degr, life);
  }
  const genBOL = gen / Math.pow(1 - degr, life);
  const needSun = m.orbit.kind === 'GEO' ? load / 0.8 : arrayPowerNeeded(load, h);
  const battery = by('battery')[0];
  const eclipseWh = (load * eclS) / 3600 / 0.9;
  const dod = battery ? eclipseWh / battery.wh! : Infinity;
  const dodLimit = m.orbit.kind === 'GEO' ? 0.7 : m.orbit.kind === 'MEO' ? 0.5 : 0.3;
  const cyclesPerYear = m.orbit.kind === 'GEO' ? 90 : (365.25 * DAY) / P;

  // ---------- pointing and momentum ----------
  const sensors = by('sensor'), acts = by('actuator');
  const hasMtq = acts.some((a) => a.act === 'mtq');
  const hasWheels = acts.some((a) => a.act === 'rw' || a.act === 'cmg');
  const bestSensor = sensors.reduce((b, s) => (s.acc && s.acc > 0 ? Math.min(b, s.acc) : b), 90);
  const fgs = sensors.some((s) => s.id === 'sen-fgs');
  const quietBig = acts.some((a) => a.id === 'act-rw-big' || a.id === 'act-cmg');
  let pointing = 180;
  if (hasWheels) pointing = Math.max(bestSensor, fgs && !quietBig ? 0.0005 : 0);
  else if (hasMtq) pointing = Math.max(5, bestSensor);
  const prop = by('propulsion')[0];
  const thrusters = prop && (prop.prop === 'cold' || prop.prop === 'mono' || prop.prop === 'biprop');
  if (!hasWheels && !hasMtq && thrusters) pointing = Math.max(1, bestSensor);
  const payloadPoint = Math.min(m.pointing, ...by('payload').map((p) => p.pointReq ?? 90));
  // disturbance momentum per orbit: gravity gradient + drag + solar pressure, rough
  const L = Math.max(...size);
  const ggT = 1.5 * (398600.4418e9 / ((RE + h) * 1000) ** 3) * (wet * L * L / 12) * 0.02;
  const dragT = h < 1000 ? 0.5 * 2.2 * aProj * 1 * (vCirc(h) * 1000) ** 2 * 2.5e-13 * 0.1 * L : 0;
  const srpT = 4.6e-6 * aProj * 1.5 * 0.1 * L + (solar?.area ?? 0) * 4.6e-6 * 0.05 * L;
  const hPerOrbit = (ggT + dragT + srpT) * P * 0.3;
  const wheelH = acts.reduce((s, a) => s + (a.act !== 'mtq' ? a.momentum ?? 0 : 0), 0);
  const canDump = (hasMtq && h < 2000) || !!thrusters;

  // ---------- comms ----------
  const comms = by('comms');
  const tt = comms.filter((c) => !c.payloadLink);
  const down = comms.filter((c) => c.payloadLink);
  const best = down.length ? down.reduce((a, b) => (b.mbps! > a.mbps! ? b : a)) : tt.length ? tt.reduce((a, b) => (b.mbps! > a.mbps! ? b : a)) : null;
  const downGB = best ? (best.mbps! * 1e6 * contact * 0.8) / 8 / 1e9 : 0;
  const genGB = Math.max(m.dataGBday, by('payload').reduce((s, p) => s + (p.gbPerDay ?? 0), 0));
  const storage = by('obc')[0]?.gb ?? 0;
  // a downlink budget at 10° elevation for the main link
  const link = best ? linkBudget(best, h, !best.payloadLink && h > 2000 ? 0.064 : best.mbps!) : null;

  // ---------- Δv ----------
  const site = SITES.find((s) => s.id === d.site)!;
  const dvNeed: { what: string; dv: number }[] = [];
  if (m.insertion.kind === 'low') dvNeed.push({ what: `Orbit raising ${m.insertion.alt} → ${h} km`, dv: hohmann(m.insertion.alt!, h).total });
  if (m.insertion.kind === 'gto') dvNeed.push({ what: `GTO → GEO, removing ${Math.abs(site.lat).toFixed(1)}° of inclination`, dv: gtoToGeo(Math.abs(site.lat)) });
  if (m.insertion.kind === 'meo') dvNeed.push({ what: 'Final orbit insertion trim', dv: 60 });
  if (m.insertion.kind === 'direct') dvNeed.push({ what: 'Injection error correction', dv: 10 });
  const cdA = solar?.mount === 'track' || solar?.mount === 'fixed' ? aProj + (area || 0) * 0.3 : aProj;
  if (h < 2000) dvNeed.push({ what: `Drag make-up for ${life} years`, dv: dragMakeupPerYear(h, wet, cdA) * life });
  if (m.orbit.kind === 'GEO') dvNeed.push({ what: `North–south and east–west station-keeping, ${life} years`, dv: 52 * life });
  if (m.orbit.kind === 'MEO') dvNeed.push({ what: `Station-keeping, ${life} years`, dv: 3 * life });
  if (h < 2000) dvNeed.push({ what: 'Collision avoidance', dv: 1.5 * life });
  const natural = h < 2000 ? decayYears(h, dry, cdA) : Infinity;
  const needDeorbit = h < 2000 && natural - 0 > life + 5;
  if (needDeorbit) dvNeed.push({ what: 'Deorbit burn at end of life (5-year rule)', dv: deorbitDv(h, h > 900 ? 300 : 50) * (h > 900 ? 1 : 1) });
  if (m.orbit.kind === 'GEO') dvNeed.push({ what: 'Move to graveyard orbit (+300 km)', dv: 11 });
  if (m.orbit.kind === 'MEO') dvNeed.push({ what: 'Disposal orbit', dv: 50 });
  const dvRequired = dvNeed.reduce((s, x) => s + x.dv, 0) * 1.05;
  const isp = prop?.isp ?? 0;
  const dvAvail = rocketDv(isp, wet, dry);
  const electric = prop?.prop === 'hall' || prop?.prop === 'ion';
  const raiseDays = electric && prop?.thrust ? (wet * (dvNeed[0]?.dv ?? 0)) / prop.thrust / DAY : 0;

  // ---------- radiation ----------
  const dose = dosePerYear(h, inc) * life;
  const obc = by('obc')[0];

  // ---------- launch ----------
  const launcher = LAUNCHERS.find((l) => l.id === d.launcher)!;
  const cap = capacity(launcher, m);
  const isCube = busClass <= 2;
  const ssoNeed = m.orbit.inc === 'sso';

  // ---------- cost and reliability ----------
  const hw = parts.reduce((s, c) => s + c.cost, 0) + d.radiator * 0.25;
  const ait = hw * 0.35 + (isCube ? 0.05 : 1.5);
  const ops = stations.reduce((s, st) => s + st.cost, 0) * life + (isCube ? 0.02 : 0.8) * life;
  const launchCost = launcher.cubesatOnly ? 0.08 + 0.025 * wet : launcher.cost / (m.batch ?? 1);
  const cost = hw + ait + ops + launchCost;
  // bigger buses carry redundant units (cross-strapped spares), which cuts the chance a failure ends the mission
  const redundancy = busClass >= 5 ? 0.25 : busClass === 4 ? 0.35 : busClass === 3 ? 0.6 : 1;
  const rel = parts.reduce((r, c) => r * (1 - Math.min(0.9, (1 - c.rel) * (life / 5) * redundancy)), 1) * launcher.rel;

  /* ---------------- the checks ---------------- */
  const G = { struct: 'Structure & mass', power: 'Power', thermal: 'Thermal', adcs: 'Attitude control', comms: 'Communications', prop: 'Propulsion & orbit', life: 'Lifetime & environment', launch: 'Launch', prog: 'Programme' };
  const slots = new Set(parts.map((c) => c.slot));
  const missing = (['bus', 'payload', 'solar', 'battery', 'obc', 'comms'] as const).filter((s) => !slots.has(s));
  if (missing.length) add({ id: 'missing', group: G.struct, title: 'Essential subsystems', status: 'fail', value: `Missing: ${missing.join(', ')}`, need: 'A bus, payload, power, battery, computer and radio', why: 'Every satellite needs these to do anything at all.', fix: 'Add a part from each of the missing slots.' });
  const wrongBus = parts.filter((c) => c.slot !== 'bus' && (c.minBus > busClass || (c.maxBus !== undefined && c.maxBus < busClass)));
  if (wrongBus.length) add({ id: 'fit', group: G.struct, title: 'Parts fit this bus', status: 'fail', value: wrongBus.map((c) => c.name).join(', '), need: 'Parts sized for the chosen bus', why: 'Big-satellite hardware will not fit a CubeSat, and CubeSat boards are not built for big buses.', fix: 'Swap them for parts made for this bus size, or change the bus.' });
  const wrongPayload = by('payload').filter((p) => !p.kind?.some((k) => m.payloadKinds.includes(k)));
  if (wrongPayload.length) add({ id: 'payload-kind', group: G.struct, title: 'Payload matches the mission', status: 'warn', value: wrongPayload.map((c) => c.name).join(', '), need: `A payload for: ${m.name}`, why: 'The payload is the reason the satellite exists.', fix: 'Choose a payload made for this mission.' });
  const maxMass = bus?.maxMass ?? 0;
  add({ id: 'mass', group: G.struct, title: 'Launch mass', status: wet <= maxMass ? (wet <= maxMass * 0.9 ? 'ok' : 'warn') : 'fail', value: `${fmt(wet)} kg wet (${fmt(dry)} kg dry incl. 6% harness + 10% margin)`, need: `≤ ${fmt(maxMass)} kg for this bus`, pct: wet / Math.max(1, maxMass), why: 'Every kilogram must be carried by the structure and paid for at launch. Engineers hold a margin because mass always grows as a design matures.', fix: 'Choose lighter parts or a bigger bus.' });
  if (isCube) {
    const usedU = parts.reduce((s, c) => s + (c.slot === 'bus' || c.slot === 'solar' || c.slot === 'thermal' ? 0 : c.u ?? 0.2), 0) + Math.min(3, d.prop * 2);
    const volU = bus?.volU ?? 3;
    add({ id: 'volume', group: G.struct, title: 'Volume inside the CubeSat', status: usedU <= volU * 0.85 ? 'ok' : usedU <= volU ? 'warn' : 'fail', value: `${usedU.toFixed(1)} U used`, need: `≤ ${(volU * 0.85).toFixed(1)} U (85% of ${volU} U, leaving room for cabling)`, pct: usedU / volU, why: 'CubeSats are packed like a suitcase; cables, brackets and connectors always take more space than planned.', fix: 'Remove a part or move to a larger CubeSat.' });
  }
  if (solar) add({ id: 'power', group: G.power, title: 'Solar power (end of life)', status: gen >= needSun * 1.1 ? 'ok' : gen >= needSun ? 'warn' : 'fail', value: `${fmt(gen)} W in sunlight after ${life} yr (${fmt(genBOL)} W at launch)`, need: `≥ ${fmt(needSun)} W to run ${fmt(load)} W of loads and recharge for eclipse`, pct: needSun / Math.max(1, gen), why: `The arrays must cover the loads in sunlight and refill the battery for ${(eclS / 60).toFixed(0)} min of eclipse${m.orbit.kind === 'GEO' ? ' (equinox seasons)' : ' every orbit'}. Cells lose ~${(degr * 100).toFixed(1)}% a year to radiation, so size for the end of the mission.`, fix: 'Bigger or sun-tracking arrays, or fewer/lower-power loads.' });
  if (battery) add({ id: 'battery', group: G.power, title: 'Battery depth of discharge', status: dod <= dodLimit ? 'ok' : dod <= dodLimit * 1.4 ? 'warn' : 'fail', value: `${(dod * 100).toFixed(0)}% each eclipse (${fmt(eclipseWh)} Wh of ${fmt(battery.wh!)} Wh)`, need: `≤ ${(dodLimit * 100).toFixed(0)}% for ~${fmt(cyclesPerYear)} cycles a year`, pct: dod / dodLimit, why: 'The deeper a lithium-ion battery is drained each cycle, the fewer cycles it survives. LEO satellites cycle thousands of times a year, so they barely dip into their batteries.', fix: 'A bigger battery or lower eclipse loads.' });
  add({ id: 'thermal-hot', group: G.thermal, title: 'Hot case temperature', status: tHot <= 40 ? (tHot >= -20 ? 'ok' : 'warn') : tHot <= 55 ? 'warn' : 'fail', value: `${tHot.toFixed(0)} °C in full sun at peak load (${radArea.toFixed(radArea < 1 ? 2 : 1)} m² radiator)`, need: '≤ 40 °C for batteries and electronics', why: `${fmt(internal)} W of electronics heat plus sunlight must be radiated away. ${mli ? 'MLI blocks the Sun, so the radiators do the work.' : 'Without MLI the bare body both absorbs sunlight and radiates.'}`, fix: tHot > 40 ? `Add radiator area (about ${(internal / 330).toFixed(internal / 330 < 1 ? 2 : 1)} m² for this load).` : undefined });
  const heatHog = hasHeaters && heaterNeed > Math.max(5, load * 0.3);
  const coldOk = tCold >= -20 && (hasHeaters || tCold >= 2) && !heatHog;
  add({ id: 'thermal-cold', group: G.thermal, title: 'Cold case temperature', status: coldOk ? 'ok' : tCold >= -30 ? 'warn' : 'fail', value: `${tColdRaw.toFixed(0)} °C unheated, orbit-averaged at low load${hasHeaters ? `; heaters use ~${fmt(heaterNeed)} W to hold it` : '; no heaters'}`, need: 'Electronics ≥ −20 °C; battery (and hydrazine) ≥ +5 °C', why: 'In Earth\'s shadow there is no sunlight, and the radiators keep pulling heat out. Electronics tolerate cold, but lithium-ion batteries are damaged by charging below freezing and hydrazine freezes at +2 °C, so they get their own heaters.', fix: coldOk ? undefined : heatHog ? 'The radiators are oversized: shrink them (or add MLI) so heaters don\'t waste power.' : hasHeaters ? 'Add MLI or reduce radiator area.' : 'Add heaters, or MLI to keep the heat in.' });
  add({ id: 'pointing', group: G.adcs, title: 'Pointing accuracy', status: pointing <= payloadPoint ? 'ok' : pointing <= payloadPoint * 3 ? 'warn' : 'fail', value: pointing >= 180 ? 'No attitude control: it tumbles' : `~${pointFmt(pointing)}`, need: `≤ ${pointFmt(payloadPoint)} for the payload`, pct: pointing / payloadPoint, why: 'Pointing is set by the best sensor that can see, and needs actuators fine enough to act on it: magnetorquers alone manage a few degrees; wheels with a star tracker reach arcseconds.', fix: hasWheels ? 'A better sensor (star tracker, fine guidance).' : 'Add reaction wheels and a star tracker.' });
  add({ id: 'detumble', group: G.adcs, title: 'Detumbling after separation', status: hasMtq || thrusters || hasWheels ? (hasMtq || thrusters ? 'ok' : 'warn') : 'fail', value: hasMtq ? 'Magnetorquers (B-dot)' : thrusters ? 'Thrusters' : hasWheels ? 'Wheels only: may saturate' : 'Nothing to stop the spin', need: 'A way to stop the tip-off spin from separation', why: 'Springs and clamps leave a new satellite spinning at a few degrees per second. Until it stops, the arrays cannot face the Sun.', fix: 'Add magnetorquers (with a magnetometer) or thrusters.' });
  if (hasWheels) add({ id: 'momentum', group: G.adcs, title: 'Momentum management', status: canDump ? (wheelH > hPerOrbit * 3 ? 'ok' : 'warn') : 'fail', value: `${hPerOrbit < 0.01 ? hPerOrbit.toExponential(1) : hPerOrbit.toFixed(2)} Nms disturbance per orbit, wheels hold ${fmt(wheelH)} Nms`, need: canDump ? 'Wheels hold several orbits, and a way to dump' : 'Magnetorquers (LEO) or thrusters to dump momentum', why: 'Gravity gradient, drag and sunlight pressure keep pushing; the wheels absorb it by spinning faster until they reach their limit (saturation). Then something must take the momentum out.', fix: canDump ? undefined : h > 2000 ? 'Above LEO the magnetic field is too weak: add thrusters.' : 'Add magnetorquers.' });
  const hasTT = tt.length > 0 || comms.some((c) => c.id === 'com-s');
  add({ id: 'ttc', group: G.comms, title: 'Command link (TT&C)', status: hasTT ? 'ok' : 'fail', value: tt.map((c) => c.name).join(', ') || 'none', need: 'A wide-beam radio that works at any attitude', why: 'When something goes wrong and the satellite is spinning, a low-rate omnidirectional link is how you reach it.', fix: 'Add UHF or S-band.' });
  if (genGB > 0) add({ id: 'downlink', group: G.comms, title: 'Data downlink', status: downGB >= genGB * 1.2 ? 'ok' : downGB >= genGB ? 'warn' : 'fail', value: `${gbFmt(downGB)} per day (${(contact / 60).toFixed(0)} min of passes over ${stations.length} station${stations.length === 1 ? '' : 's'})`, need: `≥ ${gbFmt(genGB)} per day produced`, pct: genGB / Math.max(1e-9, downGB), why: 'The payload fills the recorder all day; the only way to empty it is during short passes over ground stations. Polar stations see polar orbiters most often.', fix: 'A faster radio (X, Ka, laser) or more/polar ground stations.' });
  if (link) add({ id: 'linkmargin', group: G.comms, title: `Link margin (${best!.band})`, status: link.margin >= 3 ? 'ok' : link.margin >= 0 ? 'warn' : 'fail', value: `${link.margin.toFixed(1)} dB at 10° elevation, ${fmt(link.range)} km`, need: '≥ 3 dB above what the decoder needs', why: `Free-space loss over ${fmt(link.range)} km is ${link.fspl.toFixed(0)} dB. The signal arrives with ${link.ebno.toFixed(1)} dB Eb/N0; ~4.5 dB is needed with good coding, plus margin for rain and pointing.`, fix: 'More transmit power, a higher-gain antenna, or a lower data rate.' });
  if (genGB > 0 && storage > 0) add({ id: 'storage', group: G.comms, title: 'On-board storage', status: storage >= genGB * 0.5 ? 'ok' : storage >= genGB * 0.2 ? 'warn' : 'fail', value: `${gbFmt(storage)}`, need: `≥ ${gbFmt(genGB * 0.5)} (half a day of data between passes)`, why: 'Data waits in memory between ground passes; if it fills up, new data is lost.', fix: 'A computer with a bigger recorder.' });
  // propulsion and lifetime
  const noProp = !prop || prop.prop === 'none';
  const mustManoeuvre = m.insertion.kind !== 'direct' || m.orbit.kind === 'GEO';
  if (dvRequired > 1 && (!noProp || mustManoeuvre)) {
    add({ id: 'dv', group: G.prop, title: 'Δv budget', status: dvAvail >= dvRequired ? 'ok' : dvAvail >= dvRequired * 0.8 ? 'warn' : 'fail', value: `${fmt(dvAvail)} m/s available (Isp ${isp} s, ${fmt(d.prop)} kg propellant)`, need: `${fmt(dvRequired)} m/s incl. 5% margin`, pct: dvRequired / Math.max(1, dvAvail), why: `Rocket equation: Δv = Isp·g₀·ln(wet/dry). Needed: ${dvNeed.map((x) => `${x.what} ${fmt(x.dv)} m/s`).join('; ')}.`, fix: !prop || prop.prop === 'none' ? 'Add propulsion.' : `Carry more propellant (~${fmt(Math.max(0, dry * (Math.exp(dvRequired / (Math.max(1, isp) * 9.80665)) - 1)))} kg) or use a higher-Isp engine.` });
  }
  if (prop && d.prop > (prop.maxProp ?? 0)) add({ id: 'tank', group: G.prop, title: 'Propellant tank size', status: 'fail', value: `${fmt(d.prop)} kg`, need: `≤ ${fmt(prop.maxProp ?? 0)} kg for this system`, why: 'Tanks are sized for the system.', fix: 'Less propellant or a bigger propulsion system.' });
  if (electric && raiseDays > 0) add({ id: 'raise', group: G.prop, title: 'Electric orbit raising time', status: raiseDays < 120 ? 'ok' : raiseDays < 250 ? 'warn' : 'fail', value: `${fmt(raiseDays)} days of thrusting`, need: '< ~4 months', why: `${(prop!.thrust! * 1000).toFixed(1)} mN is tiny: it takes weeks of continuous thrust to change speed by hundreds of m/s.`, fix: 'More thrusters, more power, or accept the wait.' });
  if (h < 2000) {
    const withoutProp = !prop || prop.prop === 'none';
    add({ id: 'decay', group: G.life, title: 'Orbit lifetime (drag)', status: natural >= life || !withoutProp ? (withoutProp && natural > life + 5 ? 'fail' : 'ok') : 'fail', value: `${natural === Infinity ? '> 500' : natural < 1 ? `${fmt(natural * 365)} days` : `${natural.toFixed(1)} years`} to re-entry without thrust`, need: withoutProp ? `≥ ${life} yr mission, ≤ ${life + 5} yr total (5-year disposal rule)` : 'Propulsion holds the orbit, then deorbits', why: 'Even at 500 km there is a trace of atmosphere. It slowly brings low satellites down, which is good for clearing debris but bad if it happens before the mission ends. The FCC now requires LEO satellites to leave orbit within 5 years of mission end.', fix: withoutProp ? (natural < life ? 'Fly higher.' : 'Fly lower, or add propulsion to deorbit.') : undefined });
  }
  if (obc) add({ id: 'radiation', group: G.life, title: 'Radiation dose', status: obc.krad! >= dose * 2 ? 'ok' : obc.krad! >= dose ? 'warn' : 'fail', value: `~${dose < 10 ? dose.toFixed(1) : fmt(dose)} krad over ${life} yr`, need: `Computer rated ≥ ${fmt(dose * 2)} krad (2× margin); this one: ${obc.krad} krad`, why: 'Trapped protons and electrons slowly damage transistors (total dose), and single heavy ions can flip bits or latch up chips. MEO sits right in the belts.', fix: 'A radiation-tolerant or radiation-hardened computer.' });
  add({ id: 'reliability', group: G.life, title: 'Probability of surviving the mission', status: rel >= 0.75 ? 'ok' : rel >= 0.55 ? 'warn' : 'fail', value: `${(rel * 100).toFixed(0)}% (launch included)`, need: '≥ 75% is typical for operational missions', why: 'Every part has a small chance of failing; the chances multiply. Redundancy (spare wheels, two computers) and simpler designs raise the total.', fix: 'Fewer single points of failure, better-rated parts, shorter life.' });
  // launch
  if (launcher.cubesatOnly && !isCube) add({ id: 'ride', group: G.launch, title: 'Launcher', status: 'fail', value: 'CubeSat rideshare', need: 'A launcher for this size', why: 'A dispenser only takes CubeSats.', fix: 'Choose a small or medium launcher.' });
  add({ id: 'launchmass', group: G.launch, title: 'Launcher capacity', status: wet <= cap ? (wet <= cap * 0.9 ? 'ok' : 'warn') : 'fail', value: `${fmt(wet)} kg`, need: `≤ ${fmt(cap)} kg to ${m.insertion.kind === 'gto' ? 'GTO' : m.insertion.kind === 'meo' ? 'MEO transfer' : `${fmt(m.insertion.alt ?? h)} km${ssoNeed ? ' SSO' : ''}`} on a ${launcher.example}`, pct: wet / Math.max(1, cap), why: 'How much a rocket lifts falls steeply the higher (and more polar) the orbit.', fix: 'A bigger launcher, or a lighter satellite.' });
  const siteOk = ssoNeed ? site.sso : (m.orbit.inc as number) + 0.5 >= Math.abs(site.lat) || m.orbit.kind === 'GEO';
  add({ id: 'site', group: G.launch, title: 'Launch site', status: siteOk ? 'ok' : 'warn', value: `${site.name} (${Math.abs(site.lat).toFixed(1)}°${site.lat >= 0 ? 'N' : 'S'})`, need: ssoNeed ? 'A site that can launch south or north into polar orbit' : m.orbit.kind === 'GEO' ? 'Closest to the equator saves satellite fuel' : `Latitude ≤ inclination (${fmt(inc)}°)`, why: 'A rocket launched due east reaches an inclination equal to the site\'s latitude; lower inclinations need costly plane changes. Polar launches need a clear path over the sea to the north or south.', fix: siteOk ? undefined : 'Pick a site that suits this orbit.' });
  add({ id: 'cost', group: G.prog, title: 'Total cost', status: cost <= m.budget ? (cost <= m.budget * 0.9 ? 'ok' : 'warn') : cost <= m.budget * 1.2 ? 'warn' : 'fail', value: `$${money(cost)}M (hardware ${money(hw)}, integration & test ${money(ait)}, launch ${money(launchCost)}, ops ${money(ops)})`, need: `≤ $${money(m.budget)}M budget`, pct: cost / m.budget, why: 'Hardware is only part of it: integration and testing typically adds a third, then launch and years of operations.', fix: 'Cheaper parts, a smaller launcher, fewer stations.' });

  const fails = checks.filter((c) => c.status === 'fail').length;
  const warns = checks.filter((c) => c.status === 'warn').length;
  return {
    mission: m, parts, bus, inc, h, P, eclF, eclS, life, dry, wet, compMass, harness, load, loads, gen, genBOL, needSun, area, dod, eclipseWh,
    tHot, tCold, heaterNeed, pointing, payloadPoint, contact, downGB, genGB, link, dvNeed, dvRequired, dvAvail, natural, dose, cap, cost, rel,
    raan: raanRate(h, inc), checks, fails, warns, raiseDays, wheelH, hPerOrbit, hasMtq, hasWheels, thrusters: !!thrusters, electric, launcher, site,
    hw, launchCost, ops, ait,
  };
}

function solarIsBody(parts: Comp[]) {
  const s = parts.find((c) => c.slot === 'solar');
  return !!s && (s.mount === 'body' || s.id === 'sol-cdep');
}

/** The main downlink at 10° elevation, as an engineer would write it out. */
export function linkBudget(c: Comp, h: number, mbps = c.mbps!) {
  const gainT: Record<string, number> = { 'com-uhf': 0, 'com-s': 5, 'com-x-cs': 14, 'com-x': 19, 'com-ka': 28, 'com-opt': 100, 'com-dsn': 18 };
  const gT: Record<string, number> = { 'com-uhf': -14, 'com-s': 17, 'com-x-cs': 30, 'com-x': 33, 'com-ka': 38, 'com-opt': 60, 'com-dsn': 32 };
  const range = h > 30000 ? 38000 : slantRange(h, 10);
  const ptx = 10 * Math.log10(Math.max(0.1, c.power * 0.3));
  const eirp = ptx + (gainT[c.id] ?? 0) - 1;
  const L = c.id === 'com-opt' ? 0 : fspl(range, c.ghz!);
  const losses = c.ghz! > 20 ? 6 : 3;
  const ebno = c.id === 'com-opt' ? 9 : eirp - L - losses + (gT[c.id] ?? 0) + 228.6 - 10 * Math.log10(mbps * 1e6);
  return { range, fspl: L, eirp, ebno, margin: ebno - 4.5 };
}

export const fmt = (v: number) => (!isFinite(v) ? '∞' : Math.abs(v) >= 100 ? Math.round(v).toLocaleString('en-US') : Math.abs(v) >= 10 ? v.toFixed(1) : v.toFixed(2));
export const money = (v: number) => (v >= 100 ? Math.round(v).toLocaleString('en-US') : v >= 10 ? v.toFixed(1) : v.toFixed(2));
export const gbFmt = (gb: number) => (gb >= 1000 ? `${(gb / 1000).toFixed(1)} TB` : gb >= 1 ? `${gb.toFixed(gb >= 100 ? 0 : 1)} GB` : `${(gb * 1000).toFixed(gb * 1000 >= 10 ? 0 : 1)} MB`);
export function pointFmt(degV: number) {
  if (degV >= 1) return `${degV.toFixed(0)}°`;
  if (degV >= 0.01) return `${degV.toFixed(2)}°`;
  const as = degV * 3600;
  return as >= 1 ? `${as.toFixed(1)}″` : `${(as * 1000).toFixed(as * 1000 >= 10 ? 0 : 1)} mas`;
}
