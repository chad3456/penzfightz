/**
 * Launch day. You sit in the launch director's chair for the final poll,
 * where the weather, the range, the rocket and your own payload each have to
 * call "go", then ride the ascent from liftoff to separation.
 */
import type { Analysis } from './analysis';
import { RE, deg, vCirc } from './physics';

export type PollItem = { who: string; status: 'go' | 'hold'; text: string; issue?: Issue };
export type Issue = {
  title: string; body: string; teach: string;
  options: { label: string; detail: string; risk: number; delayH: number; result: string }[];
};

const ISSUES: Issue[] = [
  {
    title: 'Upper-level winds above limits',
    body: 'Balloon data shows wind shear at 12 km of 85 knots; the vehicle\'s limit is 80. Gusts are expected to ease after midnight.',
    teach: 'At around 12 km the rocket passes Max-Q, the moment of greatest aerodynamic pressure. Strong shear there bends the vehicle beyond its structural margins. Launch teams fly weather balloons up to the last hour.',
    options: [
      { label: 'Hold for 45 minutes', detail: 'Use the launch window; wait for the next balloon.', risk: 0.01, delayH: 0.75, result: 'The next balloon shows 74 knots. Back within limits: GO.' },
      { label: 'Waive and launch', detail: 'It\'s only 5 knots over.', risk: 0.12, delayH: 0, result: 'You overrode a flight rule.' },
      { label: 'Scrub 24 hours', detail: 'Stand down and try tomorrow.', risk: 0, delayH: 24, result: 'Scrubbed. Tomorrow\'s winds are calm.' },
    ],
  },
  {
    title: 'Cumulus clouds within 10 nautical miles',
    body: 'Towering cumulus near the flight path. The rocket\'s ionised exhaust plume can trigger lightning through clouds like these.',
    teach: 'Apollo 12 was struck by lightning twice, triggered by the Saturn V, seconds after liftoff. Today\'s lightning launch-commit criteria forbid flying through or near certain cloud types.',
    options: [
      { label: 'Hold until it drifts', detail: 'Watch the radar for the cloud to move off.', risk: 0.01, delayH: 0.5, result: 'The cell drifted east. Weather is GO.' },
      { label: 'Launch now', detail: 'The window is short.', risk: 0.1, delayH: 0, result: 'You flew close to a triggered-lightning hazard.' },
      { label: 'Scrub', detail: 'Try again tomorrow.', risk: 0, delayH: 24, result: 'Scrubbed for weather.' },
    ],
  },
  {
    title: 'Boat in the range hazard area',
    body: 'A fishing vessel has strayed into the zone where the first stage or fairing could fall.',
    teach: 'Range safety keeps ships and aircraft out of the areas where debris could land if something goes wrong, and where stages and fairings land on every flight.',
    options: [
      { label: 'Hold until it clears', detail: 'The coast guard is asking it to leave.', risk: 0, delayH: 0.4, result: 'The boat has left the hazard area. Range is GO.' },
      { label: 'Launch anyway', detail: 'The odds of hitting it are tiny.', risk: 0.02, delayH: 0, result: 'You launched with a vessel in the hazard area: a serious safety violation.' },
    ],
  },
  {
    title: 'Upper-stage sensor reading off-nominal',
    body: 'A pressure transducer on the second-stage oxygen tank reads 3% low. Engineers think the sensor, not the tank, is wrong.',
    teach: 'Telemetry glitches stop countdowns all the time. Teams compare redundant sensors and past flights before deciding whether to waive or scrub.',
    options: [
      { label: 'Ask engineering to clear it', detail: 'Compare with the redundant sensor (costs time).', risk: 0.01, delayH: 1, result: 'The redundant sensor agrees with nominal: a bad transducer. Vehicle GO.' },
      { label: 'Waive it now', detail: 'It\'s probably the sensor.', risk: 0.05, delayH: 0, result: 'Waived without checking.' },
      { label: 'Scrub and replace it', detail: 'Lose a day, remove the doubt.', risk: 0, delayH: 30, result: 'Sensor replaced. Clean countdown next day.' },
    ],
  },
];

export function makePoll(a: Analysis): PollItem[] {
  const issue = ISSUES[Math.floor(Math.random() * ISSUES.length)];
  const whoIssue = issue.title.includes('wind') || issue.title.includes('cloud') ? 'Weather' : issue.title.includes('Boat') ? 'Range' : 'Vehicle';
  const items: PollItem[] = [
    { who: 'Weather', status: 'go', text: '80% chance of acceptable conditions.' },
    { who: 'Range', status: 'go', text: 'Airspace and sea lanes clear; tracking radars ready.' },
    { who: 'Vehicle', status: 'go', text: `${a.launcher.example}: fuelled, pressurised, flight computer in terminal count.` },
    { who: 'Payload', status: 'go', text: `${a.mission.name}: on internal power, battery ${a.parts.find((c) => c.slot === 'battery')?.wh ?? 0} Wh charged, ready for separation.` },
    { who: 'Flight director', status: 'go', text: 'All stations report ready.' },
  ];
  const i = items.findIndex((x) => x.who === whoIssue);
  items[i] = { who: whoIssue, status: 'hold', text: issue.title, issue };
  return items;
}

export type AscentEvent = { t: number; name: string; detail: string };

export function ascentTimeline(a: Analysis): AscentEvent[] {
  const L = a.launcher;
  const small = L.id === 'small' || L.id === 'ride' && false;
  const gto = a.mission.insertion.kind === 'gto';
  const meo = a.mission.insertion.kind === 'meo';
  const e: AscentEvent[] = [
    { t: 0, name: 'Liftoff', detail: 'Engines at full thrust, hold-down clamps release. The rocket clears the tower in seconds.' },
    { t: 12, name: 'Pitch-over', detail: 'The rocket begins its gravity turn, tipping downrange so gravity helps bend the path towards horizontal.' },
    { t: small ? 60 : 72, name: 'Max-Q', detail: 'Maximum dynamic pressure: the air pushes hardest on the vehicle. Engines are often throttled down through it.' },
    { t: small ? 150 : 155, name: 'Main engine cut-off', detail: 'The first stage has burned its propellant; it is about 70 km up and travelling ~2 km/s.' },
    { t: small ? 153 : 158, name: 'Stage separation', detail: 'Pneumatic pushers or springs separate the stages.' },
    { t: small ? 156 : 166, name: 'Second-stage ignition', detail: 'The upper stage\'s vacuum-optimised engine lights.' },
    { t: small ? 185 : 200, name: 'Fairing separation', detail: 'Above most of the air, the nose fairing splits and falls away; your satellite is exposed to space for the first time.' },
  ];
  if (L.reusable) e.push({ t: 480, name: 'Booster landing', detail: 'The first stage flips, relights and lands on a droneship or back at the launch site, ready to fly again.' });
  e.push({ t: gto ? 520 : small ? 520 : 530, name: 'Second-stage cut-off', detail: gto ? 'Parking orbit reached. The stage coasts to the equator crossing.' : 'Orbital velocity reached.' });
  if (gto) e.push({ t: 1580, name: 'Second burn to GTO', detail: 'A second burn over the equator raises apogee to 35,786 km.' });
  if (meo) e.push({ t: 2400, name: 'Second burn to MEO', detail: 'The upper stage climbs towards 20,000 km.' });
  e.push({ t: gto ? 1960 : meo ? 3600 : small ? 3300 : a.mission.orbit.inc === 'sso' ? 3500 : 900, name: 'Payload separation', detail: 'Pyrotechnic bolts or a clamp band release, and springs push your satellite away at ~0.5 m/s.' });
  return e;
}

/** Altitude (km), speed (km/s) and downrange (km) at time t of a generic ascent. */
export function ascentState(a: Analysis, t: number, tl: AscentEvent[]) {
  const seco = tl.find((x) => x.name === 'Second-stage cut-off')!.t;
  const target = a.mission.insertion.kind === 'gto' || a.mission.insertion.kind === 'meo' ? 200 : Math.min(a.mission.insertion.alt ?? a.h, a.h);
  const x = Math.min(1, t / seco);
  const alt = target * (1 - Math.pow(1 - x, 2.2)) * (x < 0.3 ? x / 0.3 * 0.6 + 0.4 : 1);
  const v = 0.4 + (vCirc(target) - 0.4 + 0.46) * Math.pow(x, 1.6); // includes the ~0.46 km/s Earth rotation at the start
  const down = 1900 * Math.pow(x, 1.7) + (t > seco ? (t - seco) * vCirc(target) : 0);
  return { alt: Math.max(0, alt), v: Math.min(v, vCirc(target) + 0.5), down, x };
}

/** Launch azimuth (deg from north) to reach an inclination from a latitude. */
export function launchAzimuth(incDeg: number, latDeg: number) {
  const c = Math.cos(incDeg * deg) / Math.cos(latDeg * deg);
  if (Math.abs(c) > 1) return 90;
  return Math.asin(c) / deg;
}

/** Lat/lon along a great circle from (lat, lon) at azimuth az after distance km. */
export function travel(lat: number, lon: number, az: number, km: number) {
  const d = km / RE, la = lat * deg, lo = lon * deg, th = az * deg;
  const la2 = Math.asin(Math.sin(la) * Math.cos(d) + Math.cos(la) * Math.sin(d) * Math.cos(th));
  const lo2 = lo + Math.atan2(Math.sin(th) * Math.sin(d) * Math.cos(la), Math.cos(d) - Math.sin(la) * Math.sin(la2));
  return { lat: la2 / deg, lon: lo2 / deg };
}
