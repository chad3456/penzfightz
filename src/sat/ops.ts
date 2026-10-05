/**
 * Mission operations: a live simulation of the satellite you built, from
 * the moment it leaves the rocket. Each tick propagates the orbit (with J2
 * and drag), the Earth's rotation and the Sun, then integrates the battery,
 * temperature, recorder, wheel momentum and propellant, from the same
 * numbers the design review used. On top of that runs the real early-
 * operations sequence (detumble, deploy, Sun acquisition, first contact,
 * commissioning) and, later, the anomalies operators actually face, each
 * with choices and consequences.
 */

import type { Analysis, Design } from './analysis';
import { STATIONS } from './missions';
import { DAY, MU, RE, SIDEREAL, density, deg, eci, elevation, inShadow, propFor, siteEci, subPoint, type V3 } from './physics';
import { isLand, type EarthMaps } from './landmask';

export type Phase = 'separation' | 'detumble' | 'deploy' | 'acquire' | 'contact' | 'commission' | 'transfer' | 'ops' | 'safe' | 'lost' | 'complete';

export type Choice = { label: string; detail: string; apply: (s: Ops) => string };
export type Decision = { id: string; title: string; body: string; teach: string; choices: Choice[] };
export type LogLine = { t: number; text: string; kind: 'info' | 'good' | 'warn' | 'bad' | 'you' };

export type Ops = {
  t: number;
  phase: Phase;
  alt: number; inc: number; raan: number; u: number; gmst: number;
  /** for GEO transfer: perigee and apogee while climbing */
  perigee: number; apogee: number;
  sunLon: number;
  rate: number; // tumble rate, deg/s
  pointErr: number; // deg
  mode: 'tumbling' | 'sun' | 'nadir' | 'downlink' | 'safe';
  deploy: number; // 0..1 solar arrays / antennas
  deployStuck: boolean;
  soc: number; gen: number; load: number; temp: number; inSun: boolean;
  data: number; delivered: number; generated: number; lost: number;
  prop: number; dvUsed: number;
  wheel: number; // fraction of wheel momentum capacity used
  contact: string | null; elev: number;
  health: Record<'power' | 'adcs' | 'comms' | 'obc' | 'payload' | 'prop' | 'battery', number>;
  payloadOn: boolean;
  firing: number; // 0..1 thruster glow
  commission: string[];
  log: LogLine[];
  decision: Decision | null;
  nextEvent: number;
  eventsSeen: string[];
  score: { availability: number; upTime: number; opsTime: number };
  lat: number; lon: number;
  stationsInView: string[];
  missionDays: number;
  safeReason: string;
  safeFrom: Phase;
};

export const COMMISSION = [
  { id: 'power', title: 'Check power and battery', body: 'Read back array current, battery voltage and temperature; confirm the battery charges in sunlight and the power budget matches the analysis.', time: 2 * 3600 },
  { id: 'adcs', title: 'Calibrate attitude control', body: 'Calibrate the magnetometer and gyros, switch the star tracker on, spin up the wheels and move from Sun-pointing to the operational attitude.', time: 8 * 3600 },
  { id: 'comms', title: 'Test the payload downlink', body: 'Point at a ground station and switch on the high-rate transmitter; check the received signal strength and bit error rate against the link budget.', time: 4 * 3600 },
  { id: 'thermal', title: 'Verify thermal control', body: 'Watch temperatures through several eclipses and confirm the heaters switch where expected.', time: 6 * 3600 },
  { id: 'payload', title: 'Payload first light', body: 'Open covers, switch the instrument on and take a first image, signal or observation, the moment every team waits for.', time: 6 * 3600 },
];

export function newOps(d: Design, a: Analysis): Ops {
  const m = a.mission;
  const gto = m.insertion.kind === 'gto';
  const low = m.insertion.kind === 'low';
  return {
    t: 0, phase: 'separation',
    alt: gto ? 250 : low ? m.insertion.alt! : a.h, inc: gto ? Math.abs(a.site.lat) : a.inc, raan: 0.4, u: 0.3, gmst: 0,
    perigee: gto ? 250 : 0, apogee: gto ? 35786 : 0,
    sunLon: 0,
    rate: 3 + Math.random() * 3, pointErr: 180, mode: 'tumbling',
    deploy: 0, deployStuck: false,
    soc: 0.8, gen: 0, load: 0, temp: 18, inSun: true,
    data: 0, delivered: 0, generated: 0, lost: 0,
    prop: d.prop, dvUsed: 0,
    wheel: 0,
    contact: null, elev: -90,
    health: { power: 1, adcs: 1, comms: 1, obc: 1, payload: 1, prop: 1, battery: 1 },
    payloadOn: false, firing: 0,
    commission: [],
    log: [{ t: 0, text: 'Separation confirmed. The satellite is on its own.', kind: 'good' }],
    decision: null,
    nextEvent: 3 * DAY,
    eventsSeen: [],
    score: { availability: 0, upTime: 0, opsTime: 0 },
    lat: 0, lon: 0, stationsInView: [],
    missionDays: 30,
    safeReason: '',
    safeFrom: 'ops',
  };
}

const say = (s: Ops, text: string, kind: LogLine['kind'] = 'info') => { s.log.unshift({ t: s.t, text, kind }); if (s.log.length > 80) s.log.pop(); };

/** Position in km (ECI) of the satellite now. */
export function satPos(s: Ops): V3 {
  if (s.apogee > s.perigee + 50) {
    // on the transfer ellipse, with perigee at u = 0
    const rp = RE + s.perigee, ra = RE + s.apogee;
    const a = (rp + ra) / 2, e = (ra - rp) / (ra + rp);
    const r = (a * (1 - e * e)) / (1 + e * Math.cos(s.u));
    const p = eci(r - RE, s.inc * deg, s.raan, s.u);
    return p;
  }
  return eci(s.alt, s.inc * deg, s.raan, s.u);
}

export function sunDir(s: Ops): V3 {
  // start near the March equinox so GEO satellites meet an eclipse season straight away
  const L = s.sunLon;
  const eps = 23.44 * deg;
  return [Math.cos(L), Math.sin(L) * Math.cos(eps), Math.sin(L) * Math.sin(eps)];
}

type Ctx = { d: Design; a: Analysis; earth: EarthMaps | null };

/** Advance the simulation by dt seconds (internally sub-stepped). */
export function step(s: Ops, dtTotal: number, ctx: Ctx) {
  if (s.decision || s.phase === 'lost' || s.phase === 'complete') return;
  let left = dtTotal;
  const maxStep = Math.max(5, Math.min(60, dtTotal / 20));
  const done = () => (s.phase as Phase) === 'lost' || (s.phase as Phase) === 'complete';
  while (left > 0 && !s.decision && !done()) {
    const dt = Math.min(maxStep, left);
    left -= dt;
    tick(s, dt, ctx);
  }
}

function tick(s: Ops, dt: number, { d, a, earth }: Ctx) {
  const m = a.mission;
  s.t += dt;
  // ---------- orbit ----------
  let r: number;
  if (s.apogee > s.perigee + 50) {
    const rp = RE + s.perigee, ra = RE + s.apogee, sma = (rp + ra) / 2, e = (ra - rp) / (ra + rp);
    r = (sma * (1 - e * e)) / (1 + e * Math.cos(s.u));
    // angular rate from angular momentum: h = √(μ a (1−e²)), dθ/dt = h/r²
    s.u += (Math.sqrt(MU * sma * (1 - e * e)) / (r * r)) * dt;
  } else {
    r = RE + s.alt;
    s.u += Math.sqrt(MU / r ** 3) * dt;
  }
  s.u %= Math.PI * 2;
  s.raan += ((-1.5 * Math.sqrt(MU / r ** 3) * 1.08262668e-3 * (RE / r) ** 2 * Math.cos(s.inc * deg)) * dt);
  s.gmst = (s.gmst + (2 * Math.PI / SIDEREAL) * dt) % (Math.PI * 2);
  s.sunLon += ((2 * Math.PI) / (365.2422 * DAY)) * dt;
  const p = satPos(s);
  const sun = sunDir(s);
  s.inSun = !inShadow(p, sun);
  const sp = subPoint(p, s.gmst);
  s.lat = sp.lat; s.lon = sp.lon;
  // drag
  if (!(s.apogee > s.perigee + 50) && s.alt < 1500) {
    const rho = density(s.alt);
    const B = (2.2 * Math.max(0.02, a.parts.find((c) => c.slot === 'bus')?.bodyArea ?? 0.03) * 0.5) / Math.max(1, a.dry);
    s.alt -= (B * rho * Math.sqrt(MU * 1e9 * r * 1000) * dt) / 1000;
    if (s.alt < 150) { s.phase = 'lost'; say(s, 'The orbit has decayed into the dense atmosphere. The satellite re-enters and burns up.', 'bad'); return; }
  }
  // ---------- ground stations ----------
  const stations = STATIONS.filter((st) => d.stations.includes(st.id));
  let best = -90, bestName: string | null = null;
  s.stationsInView = [];
  for (const st of stations) {
    const el = elevation(p, siteEci(st.lat, st.lon, s.gmst));
    if (el > 10) s.stationsInView.push(st.id);
    if (el > best) { best = el; bestName = st.name; }
  }
  const was = s.contact;
  s.elev = best;
  s.contact = best > 10 ? bestName : null;
  if (s.contact && !was) {
    if (s.phase === 'contact') {
      say(s, `Acquisition of signal over ${s.contact}! First telemetry: battery ${(s.soc * 100).toFixed(0)}%, ${s.temp.toFixed(0)} °C, ${s.mode === 'tumbling' ? 'still tumbling' : 'attitude stable'}.`, 'good');
      s.phase = 'commission';
    } else if (s.phase === 'ops' || s.phase === 'commission' || s.phase === 'transfer' || s.phase === 'safe') say(s, `AOS ${s.contact}`, 'info');
  }
  if (!s.contact && was && (s.phase === 'ops' || s.phase === 'commission')) say(s, `LOS ${was}`, 'info');

  // ---------- attitude ----------
  const acts = a.parts.filter((c) => c.slot === 'actuator');
  const mtq = acts.some((c) => c.act === 'mtq') && s.alt < 2000;
  const wheels = acts.some((c) => c.act === 'rw' || c.act === 'cmg') && s.health.adcs > 0.3;
  if (s.phase === 'separation') {
    s.phase = 'detumble';
    say(s, `Tip-off rate ${s.rate.toFixed(1)}°/s. ${mtq ? 'Magnetorquers begin B-dot detumbling.' : a.thrusters ? 'Thrusters begin damping the spin.' : wheels ? 'Wheels try to absorb the spin.' : 'Nothing on board can stop the spin.'}`, mtq || a.thrusters ? 'info' : 'warn');
  }
  if (s.phase === 'detumble') {
    const tau = mtq ? 2600 * (a.wet > 50 ? 3 : 1) : a.thrusters ? 300 : wheels ? 5000 : Infinity;
    if (a.thrusters && !mtq) { const used = 0.0005 * a.wet * dt / 300; s.prop = Math.max(0, s.prop - used); }
    s.rate *= Math.exp(-dt / tau);
    if (wheels && !mtq && !a.thrusters) s.wheel = Math.min(1, s.wheel + dt / 6000);
    if (s.rate < 0.2) {
      s.rate = 0.05; s.phase = 'deploy';
      say(s, `Detumbled: rates below 0.2°/s after ${(s.t / 3600).toFixed(1)} h.`, 'good');
    } else if (tau === Infinity && s.t > 3 * 3600) {
      ask(s, {
        id: 'tumble', title: 'Satellite still tumbling',
        body: 'Three hours after separation the satellite is still spinning at several degrees per second. Without magnetorquers, thrusters or wheels it cannot stop itself.',
        teach: 'Every satellite needs a detumbling method. Tip-off rates from the separation springs are a few °/s; the B-dot law (fire magnetorquers against the rate of change of the measured field) slows a CubeSat in a few orbits.',
        choices: [{ label: 'Keep listening', detail: 'Hope the solar cells catch enough light while spinning.', apply: (st) => { st.phase = 'deploy'; st.rate = 2; return 'The panels deploy while spinning; power will be poor.'; } }],
      });
    }
  }
  if (s.phase === 'deploy') {
    const solar = a.parts.find((c) => c.slot === 'solar');
    const deployable = solar && solar.mount !== 'body';
    if (!deployable) { s.deploy = 1; s.phase = 'acquire'; say(s, 'No deployables: body-mounted cells already working.', 'info'); }
    else {
      if (s.deploy === 0 && !s.eventsSeen.includes('stuck') && Math.random() < 0.18) {
        s.eventsSeen.push('stuck');
        s.deployStuck = true;
        ask(s, {
          id: 'stuck', title: 'Solar array deployment: one panel did not latch',
          body: 'The burn wire fired, but the hinge switch on one panel never closed. Power is 40% below expectation.',
          teach: 'Deployment is one of the riskiest moments of any mission: hinges cold-weld, cables snag, burn wires don\'t burn. Operators have a playbook: warm the hinge with sunlight, fire the release again, or shake the spacecraft with its wheels or thrusters.',
          choices: [
            { label: 'Warm it in sunlight, retry', detail: 'Point the stuck hinge at the Sun for an orbit, then fire the backup release.', apply: (st) => { if (Math.random() < 0.65) { st.deployStuck = false; return 'The warmed hinge freed itself and latched. Full power.'; } st.health.power *= 0.75; st.deployStuck = false; return 'No luck: the panel stays half-open. You lose about a quarter of the power.'; } },
            { label: 'Shake it with the wheels', detail: wheels ? 'Spin the wheels hard back and forth to jolt it.' : 'No wheels on board: you could only use thrusters.', apply: (st) => { if (wheels && Math.random() < 0.5) { st.deployStuck = false; st.wheel = Math.min(1, st.wheel + 0.3); return 'A sharp jolt and the latch closes. Full power.'; } st.health.power *= 0.7; st.deployStuck = false; return 'It moved but did not latch. Power is about 30% down for the mission.'; } },
            { label: 'Accept reduced power', detail: 'Plan operations around the lower power.', apply: (st) => { st.health.power *= 0.6; st.deployStuck = false; return 'You budget around 60% power: the payload will run less often.'; } },
          ],
        });
      }
      s.deploy = Math.min(1, s.deploy + dt / 120);
      if (s.deploy >= 1 && !s.deployStuck) { s.phase = 'acquire'; say(s, 'Arrays and antennas deployed and latched.', 'good'); }
    }
  }
  if (s.phase === 'acquire') {
    s.mode = 'sun';
    s.pointErr = Math.max(5, a.pointing);
    if (s.t > 600 + (s.log[0]?.t ?? 0) || s.deploy >= 1) {
      s.phase = 'contact';
      say(s, 'Sun acquired: the arrays face the Sun and the battery is charging. Waiting for the first ground pass…', 'info');
    }
  }
  if (s.mode === 'tumbling' || s.phase === 'detumble') s.pointErr = 180;
  // wheel momentum builds up; magnetorquers or thrusters dump it
  if (wheels && (s.phase === 'ops' || s.phase === 'commission' || s.phase === 'transfer')) {
    const cap = Math.max(1e-6, a.wheelH);
    s.wheel += (a.hPerOrbit / a.P) * dt / cap * (s.health.adcs < 1 ? 1.6 : 1);
    if (mtq) s.wheel = Math.max(0, s.wheel - dt / (a.P * 0.8) * 0.3);
    else if (a.thrusters && s.wheel > 0.7) { s.wheel = 0.2; const dp = 0.0002 * a.dry; s.prop = Math.max(0, s.prop - dp); say(s, 'Momentum dump with thrusters.', 'info'); s.firing = 1; }
    if (s.wheel >= 1) { s.wheel = 1; enterSafe(s, 'Reaction wheels saturated: attitude control lost'); }
  }
  s.firing = Math.max(0, s.firing - dt / 30);

  // ---------- transfer to the operational orbit ----------
  if (s.phase === 'transfer') {
    if (m.insertion.kind === 'low' && a.electric) {
      const prop = a.parts.find((c) => c.slot === 'propulsion')!;
      const mass = a.dry + s.prop;
      const acc = (prop.thrust! * 0.75) / mass; // m/s², thrusting most of the orbit
      const dv = acc * dt;
      const rr = (RE + s.alt) * 1000;
      s.alt += ((2 * rr ** 1.5 * acc) / Math.sqrt(MU * 1e9)) * dt / 1000;
      s.dvUsed += dv;
      s.prop = Math.max(0, s.prop - (mass * dv) / (prop.isp! * 9.80665));
      s.firing = 1;
      if (s.prop <= 0) { say(s, 'Out of propellant before reaching the target orbit!', 'bad'); s.phase = 'ops'; }
      if (s.alt >= a.h) { s.alt = a.h; s.phase = 'ops'; say(s, `Orbit raising complete: ${a.h} km after ${(s.t / DAY).toFixed(0)} days of electric thrust.`, 'good'); }
    }
    // GTO: apogee burns are commanded by the operator (see apogeeBurn)
  }

  // ---------- power ----------
  const solar = a.parts.find((c) => c.slot === 'solar');
  const point = s.mode === 'tumbling' ? 0.35 : solar?.mount === 'track' ? 1 : solar?.mount === 'body' ? 0.75 : s.mode === 'sun' || s.mode === 'safe' ? 1 : 0.8;
  s.gen = s.inSun ? a.genBOL * s.health.power * point * Math.min(1, s.deploy * 1.2 + (solar?.mount === 'body' ? 1 : 0.15)) * (1 - 0.02 * (s.t / (365 * DAY))) : 0;
  // loads
  const base = a.loads.filter((l) => l.slot !== 'payload' && l.slot !== 'comms' && l.slot !== 'propulsion' && !l.name.startsWith('Heaters')).reduce((x, l) => x + l.w, 0);
  const isEO = m.id === 'eo' || m.id === 'cube';
  const overLand = isLand(earth, s.lat, s.lon);
  const opsish = s.phase === 'ops' && s.mode !== 'safe';
  const wantPayload = opsish && (m.id === 'eo' ? s.inSun && overLand : true) && s.soc > 0.35 && s.health.payload > 0.2;
  s.payloadOn = wantPayload;
  const payloadW = a.parts.filter((c) => c.slot === 'payload').reduce((x, c) => x + c.power, 0);
  const commsW = a.parts.filter((c) => c.slot === 'comms').reduce((x, c) => x + (c.payloadLink ? (s.contact && opsish ? c.power : 0) : c.power * (s.contact ? 1 : 0.3)), 0);
  const heater = a.parts.some((c) => c.heater) && s.temp < -5 ? a.heaterNeed * 1.5 : a.parts.some((c) => c.heater) && s.temp < 5 ? a.heaterNeed * 0.4 : 0;
  const propW = s.phase === 'transfer' && a.electric ? a.parts.find((c) => c.slot === 'propulsion')!.power : 0;
  s.load = base + (s.payloadOn ? payloadW : 0) + commsW + heater + propW;
  const capWh = (a.parts.find((c) => c.slot === 'battery')?.wh ?? 1) * s.health.battery;
  const net = s.gen * 0.88 - s.load;
  s.soc = Math.max(0, Math.min(1, s.soc + (net * dt) / 3600 / capWh));
  if (s.soc < 0.2 && s.mode !== 'safe' && s.phase !== 'detumble') enterSafe(s, `Battery low (${(s.soc * 100).toFixed(0)}%): loads shed`);
  if (s.soc <= 0.001) {
    s.health.battery *= 0.995;
    if (s.health.battery < 0.6) { s.phase = 'lost'; say(s, 'The battery has been completely flat too long and is damaged. Contact lost.', 'bad'); return; }
  }

  // ---------- thermal ----------
  const sunIn = s.inSun ? 1 : 0;
  const teq = thermalEq(a, s.load, sunIn, s.mode === 'tumbling');
  const tau = a.wet < 30 ? 1500 : a.wet < 1000 ? 4000 : 9000;
  s.temp += (teq - s.temp) * Math.min(1, dt / tau);
  if (s.temp > 55 && s.phase === 'ops') enterSafe(s, `Overheating (${s.temp.toFixed(0)} °C)`);
  if (s.temp < -25 && s.phase === 'ops') { s.health.battery = Math.max(0.3, s.health.battery - dt / (DAY * 20)); }

  // ---------- data ----------
  if (s.payloadOn && a.genGB > 0) {
    const duty = m.id === 'eo' ? 0.32 : 0.8;
    const g = (a.genGB / (DAY * duty)) * dt * s.health.payload;
    s.data += g; s.generated += g;
    const cap = a.parts.find((c) => c.slot === 'obc')?.gb ?? 1;
    if (s.data > cap) { s.lost += s.data - cap; s.data = cap; }
  }
  if (s.contact && s.data > 0 && (s.phase === 'ops' || s.phase === 'commission')) {
    const link = a.parts.filter((c) => c.slot === 'comms').reduce((b, c) => Math.max(b, c.mbps ?? 0), 0);
    const pointsOk = wheels || link < 1;
    const rateGBs = (link * 1e6 * 0.8 * (pointsOk ? 1 : 0.1) * s.health.comms) / 8 / 1e9;
    const sent = Math.min(s.data, rateGBs * dt);
    s.data -= sent; s.delivered += sent;
  }
  // ---------- station keeping ----------
  if (s.phase === 'ops' && s.alt < a.h - 3 && a.h < 2000) {
    const prop = a.parts.find((c) => c.slot === 'propulsion');
    if (prop && prop.prop !== 'none' && s.prop > 0) {
      const dvRaise = 2 * (Math.sqrt(MU / (RE + s.alt)) - Math.sqrt(MU / (RE + a.h))) * -1000;
      const need = propFor(Math.abs(dvRaise), prop.isp!, a.dry);
      s.prop = Math.max(0, s.prop - need); s.dvUsed += Math.abs(dvRaise); s.alt = a.h; s.firing = 1;
      say(s, `Orbit-maintenance burn: +${(a.h - s.alt + 3).toFixed(0)} km, ${Math.abs(dvRaise).toFixed(1)} m/s.`, 'info');
    }
  }
  // ---------- operations score and events ----------
  if (s.phase === 'ops') {
    s.score.opsTime += dt;
    if (s.mode !== 'safe' && (s.payloadOn || !isEO)) s.score.upTime += dt;
    if (s.t > s.nextEvent) { s.nextEvent = s.t + (1.5 + Math.random() * 3) * DAY; anomaly(s, a); }
    if (s.score.opsTime > s.missionDays * DAY) { s.phase = 'complete'; say(s, `${s.missionDays} days of operations complete.`, 'good'); }
  }
  if (s.phase === 'safe' && s.mode === 'safe' && s.contact) {
    ask(s, {
      id: 'recover', title: `In safe mode: ${s.safeReason}`,
      body: `The satellite has pointed its arrays at the Sun, switched off the payload and is waiting for orders. Battery ${(s.soc * 100).toFixed(0)}%, ${s.temp.toFixed(0)} °C.`,
      teach: 'Safe mode is the spacecraft protecting itself: minimum loads, Sun-pointing, a wide-beam radio listening. Operators diagnose from telemetry before resuming, because recovering too fast can repeat the fault.',
      choices: [
        { label: 'Diagnose, then resume', detail: 'Spend a few orbits reviewing telemetry first.', apply: (st) => { st.t += 3 * 3600; st.mode = 'nadir'; st.phase = st.safeFrom; st.wheel = Math.min(st.wheel, 0.3); st.soc = Math.max(st.soc, 0.35); return 'Root cause understood; operations resume carefully.'; } },
        { label: 'Resume immediately', detail: 'Back to work now.', apply: (st) => { st.mode = 'nadir'; st.phase = st.safeFrom; st.wheel = Math.min(st.wheel, 0.5); if (Math.random() < 0.35) { enterSafe(st, 'The same fault recurred'); return 'Back in safe mode within an hour: the cause was not fixed.'; } return 'Operations resume.'; } },
      ],
    });
  }
}

function thermalEq(a: Analysis, load: number, sun: number, tumbling: boolean) {
  // interpolate between the review's hot and cold cases using sunlight and load
  const hot = a.tHot, cold = a.tCold;
  const loadK = Math.min(1.3, load / Math.max(1, a.load));
  return cold + (hot - cold) * (0.15 + 0.6 * sun * (tumbling ? 0.7 : 1) + 0.25 * loadK);
}

function enterSafe(s: Ops, why: string) {
  if (s.mode === 'safe') return;
  s.safeFrom = s.phase === 'safe' ? s.safeFrom : s.phase;
  s.mode = 'safe'; s.phase = 'safe'; s.safeReason = why; s.payloadOn = false;
  say(s, `SAFE MODE: ${why}. Payload off, Sun-pointing.`, 'bad');
}

function ask(s: Ops, d: Decision) {
  if (s.decision) return;
  s.decision = d;
}

/** Apply the operator's choice. */
export function decide(s: Ops, i: number) {
  const d = s.decision;
  if (!d) return;
  s.decision = null;
  const out = d.choices[i].apply(s);
  say(s, `You chose "${d.choices[i].label}": ${out}`, 'you');
}

/** Commissioning steps, run one at a time from the operator's checklist. */
export function commissionStep(s: Ops, id: string, a: Analysis) {
  const st = COMMISSION.find((c) => c.id === id);
  if (!st || s.commission.includes(id)) return;
  s.t += st.time;
  s.commission.push(id);
  const msg: Record<string, string> = {
    power: `Power checks out: ${a.genBOL.toFixed(0)} W from the arrays, battery ${(s.soc * 100).toFixed(0)}%.`,
    adcs: a.hasWheels ? `Wheels running, star tracker locked; pointing ${a.pointing < 0.01 ? (a.pointing * 3600).toFixed(1) + '″' : a.pointing.toFixed(2) + '°'}.` : `Magnetic control holding Sun-pointing to ~${a.pointing.toFixed(0)}°.`,
    comms: a.link ? `Downlink locked at ${a.parts.filter((c) => c.slot === 'comms').reduce((b, c) => Math.max(b, c.mbps ?? 0), 0)} Mbps, margin ${a.link.margin.toFixed(1)} dB.` : 'Telemetry link nominal.',
    thermal: `Temperatures ${s.temp.toFixed(0)} °C, heaters cycling as designed.`,
    payload: 'First light! The payload works.',
  };
  say(s, msg[id], 'good');
  if (id === 'adcs') s.mode = 'nadir';
  if (s.commission.length === COMMISSION.length) {
    const m = a.mission;
    if (m.insertion.kind === 'low' || m.insertion.kind === 'gto') {
      s.phase = 'transfer';
      say(s, m.insertion.kind === 'gto' ? 'Commissioned. Now climb from GTO to GEO: fire the apogee engine at each apogee.' : 'Commissioned. Starting electric orbit raising.', 'info');
    } else { s.phase = 'ops'; say(s, 'Commissioning complete. The satellite is operational!', 'good'); }
  }
}

/** One of the apogee burns that turn GTO into GEO. */
export function apogeeBurn(s: Ops, a: Analysis) {
  if (s.phase !== 'transfer') return;
  const prop = a.parts.find((c) => c.slot === 'propulsion');
  const needTotal = a.dvNeed[0]?.dv ?? 1500;
  const burn = needTotal / 3;
  if (!prop || prop.prop === 'none') { say(s, 'No engine to burn with!', 'bad'); return; }
  const mass = a.dry + s.prop;
  const used = mass * (1 - Math.exp(-burn / (prop.isp! * 9.80665)));
  if (used > s.prop) { say(s, 'Not enough propellant for this burn: stuck in a transfer orbit.', 'bad'); s.phase = 'ops'; return; }
  s.prop -= used; s.dvUsed += burn; s.firing = 1;
  s.perigee = Math.min(35786, s.perigee + (35786 - 250) / 3);
  s.inc = Math.max(0, s.inc - Math.abs(a.site.lat) / 3);
  s.u = Math.PI; // burn at apogee
  const n = s.eventsSeen.filter((e) => e === 'burn').length + 1;
  s.eventsSeen.push('burn');
  say(s, `Apogee burn ${n}: ${burn.toFixed(0)} m/s, ${used.toFixed(0)} kg of propellant. Perigee now ${s.perigee.toFixed(0)} km.`, 'good');
  if (n >= 3) { s.alt = 35786; s.perigee = s.apogee = 0; s.inc = 0.05; s.phase = 'ops'; say(s, 'Circular geostationary orbit reached. Drifting to the assigned slot; operations begin.', 'good'); }
}

/* ---------- anomalies ---------- */

function anomaly(s: Ops, a: Analysis) {
  const leo = a.h < 2000;
  const pool: (() => Decision | null)[] = [];
  if (leo) pool.push(() => ({
    id: 'conjunction', title: 'Conjunction alert: debris close approach',
    body: `Space-surveillance data says a fragment of an old rocket body will pass within 180 m in 26 hours. Probability of collision: 1 in ${Math.random() < 0.5 ? '4,000' : '9,000'}.`,
    teach: 'Operators manoeuvre when the probability of collision is above about 1 in 10,000. Each avoidance burn costs a little Δv and interrupts the mission; the ISS does this a few times a year, and constellations like Starlink do thousands of automated manoeuvres a year.',
    choices: [
      { label: 'Manoeuvre (0.5 m/s)', detail: a.thrusters || a.electric ? 'Raise the orbit slightly a few hours before closest approach.' : 'No propulsion on board!', apply: (st) => { if (!(a.thrusters || a.electric)) return 'You have no thrusters: you can only watch and hope.'; const prop = a.parts.find((c) => c.slot === 'propulsion')!; st.prop = Math.max(0, st.prop - propFor(0.5, prop.isp!, a.dry)); st.dvUsed += 0.5; st.firing = 1; return 'The burn opened the miss distance to 2 km. Safe.'; } },
      { label: 'Accept the risk', detail: 'The odds are small; keep working.', apply: (st) => { if (Math.random() < 0.02) { st.phase = 'lost'; return 'A one-in-thousands chance came true. Telemetry stops at the predicted time of closest approach.'; } return 'The fragment passes harmlessly. This time.'; } },
    ],
  }));
  if (a.hasWheels) pool.push(() => ({
    id: 'wheel', title: 'Reaction wheel friction rising',
    body: 'Wheel 2\'s motor current has doubled over three days: its bearing lubricant is breaking down.',
    teach: 'Wheel bearings are one of the most common satellite failures (Kepler and Hawaii\'s Hisaki lost wheels; Hubble has replaced several). With four wheels in a pyramid any three still give full control.',
    choices: [
      { label: 'Switch it off, fly on three', detail: 'Use the spare in the pyramid.', apply: (st) => { st.health.adcs *= a.parts.some((c) => c.id === 'act-rw' || c.id === 'act-rw-big') ? 0.95 : 0.5; return a.parts.some((c) => c.id === 'act-rw' || c.id === 'act-rw-big') ? 'Three wheels carry on with full control.' : 'With only three wheels, losing one leaves control degraded.'; } },
      { label: 'Keep it running, monitor', detail: 'It may last months yet.', apply: (st) => { if (Math.random() < 0.5) { st.health.adcs *= 0.6; enterSafe(st, 'Wheel 2 seized'); return 'The bearing seized and the satellite went to safe mode.'; } return 'The current stabilised. For now.'; } },
    ],
  }));
  pool.push(() => ({
    id: 'seu', title: 'Computer reset by a cosmic ray',
    body: `A single-event upset flipped bits in the ${a.parts.find((c) => c.slot === 'obc')?.name ?? 'computer'} and the watchdog rebooted it over ${a.h > 2000 ? 'the radiation belts' : 'the South Atlantic Anomaly'}.`,
    teach: 'High-energy particles can flip memory bits or trigger latch-ups. The South Atlantic Anomaly, where the inner belt dips closest to Earth, is where most LEO upsets happen. Rad-hard parts and error-correcting memory make this rare.',
    choices: [
      { label: 'Reload software, resume', detail: 'Upload a fresh image and restart the schedule.', apply: (st) => { st.t += 2 * 3600; return 'Software reloaded; two hours of data lost.'; } },
      { label: 'Patch the scrubber', detail: 'Add a memory-scrubbing routine to catch future flips.', apply: (st) => { st.t += 6 * 3600; st.health.obc = Math.min(1, st.health.obc + 0.1); return 'Scrubbing every 30 s now; resets should be rarer.'; } },
    ],
  }));
  pool.push(() => ({
    id: 'storm', title: 'Geomagnetic storm warning (Kp 8)',
    body: 'A coronal mass ejection will hit Earth\'s magnetosphere in 20 hours. Expect heated, expanded upper atmosphere and a surge of energetic particles.',
    teach: 'In February 2022 a modest storm raised drag so much that 38 of 49 freshly launched Starlink satellites re-entered. Operators put satellites edge-on to the airflow and safe their electronics.',
    choices: [
      { label: 'Go edge-on, safe the payload', detail: 'Minimise drag area and protect electronics for a day.', apply: (st) => { st.t += DAY * 0.5; if (st.alt < 400) st.alt -= 3; return 'You rode out the storm with a small altitude loss.'; } },
      { label: 'Keep operating', detail: 'Don\'t lose a day of data.', apply: (st) => { if (st.alt < 2000) st.alt -= st.alt < 400 ? 25 : 8; if (Math.random() < 0.3) { st.health.payload *= 0.85; return 'Drag spiked and a detector took radiation damage.'; } st.alt -= 0; return 'You kept working; the orbit dropped noticeably.'; } },
    ],
  }));
  pool.push(() => ({
    id: 'station', title: 'Ground station outage',
    body: 'A storm has taken one of your ground stations offline for two days; the recorder is filling.',
    teach: 'The ground segment is half of the mission. Operators buy extra passes from commercial networks or reschedule data priorities.',
    choices: [
      { label: 'Buy commercial passes ($)', detail: 'Rent passes from a ground-station network.', apply: () => 'Extra passes booked; nothing lost.' },
      { label: 'Prioritise and wait', detail: 'Downlink only the most important data.', apply: (st) => { const lost = st.data * 0.2; st.lost += lost; st.data -= lost; return `Some low-priority data was overwritten (${lost.toFixed(2)} GB).`; } },
    ],
  }));
  if (a.mission.orbit.kind === 'GEO') pool.push(() => ({
    id: 'eclipse', title: 'Eclipse season begins',
    body: 'For the next 45 days the satellite passes through Earth\'s shadow for up to 70 minutes each night.',
    teach: 'GEO satellites see eclipses only around the equinoxes. The battery must carry the full payload through 72 minutes; operators check battery temperatures and may reduce load at the longest eclipses.',
    choices: [
      { label: 'Full service through eclipses', detail: 'Rely on the battery sizing.', apply: (st) => (a.dod > 0.8 ? (st.health.battery *= 0.9, 'Deep discharges are ageing the battery.') : 'The battery carries the full load comfortably.') },
      { label: 'Shed a few transponders', detail: 'Reduce load during the longest eclipses.', apply: () => 'Battery stress reduced; customers notice brief outages.' },
    ],
  }));
  const fresh = pool.map((f) => f()).filter(Boolean) as Decision[];
  const unseen = fresh.filter((d) => !s.eventsSeen.includes(d.id));
  const pick = (unseen.length ? unseen : fresh)[Math.floor(Math.random() * (unseen.length || fresh.length))];
  if (pick) { s.eventsSeen.push(pick.id); ask(s, pick); }
}

export const fmtT = (t: number) => {
  const d = Math.floor(t / DAY), h = Math.floor((t % DAY) / 3600), m = Math.floor((t % 3600) / 60);
  return `T+${d}d ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};
