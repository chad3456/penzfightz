/**
 * Airstrip One — the rules.
 *
 * You are the Party. A square of citizens walks about below the telescreens
 * and works; their work pays for everything. Push the quota and they work
 * harder, until they begin to think. A citizen who is thinking looks up,
 * stops working, and — worse — sets the people near them thinking too.
 *
 * Keep their heads down until the year is out. Half of them thinking at once,
 * for long enough, and you have lost them.
 */

export type Kind = 'party' | 'prole' | 'child';
export type Special = 'winston' | 'julia' | null;

export interface Citizen {
  id: number;
  x: number; z: number;
  tx: number; tz: number;
  speed: number;
  kind: Kind;
  special: Special;
  doubt: number;
  thinking: boolean;
  distracted: number;
  distraction: ToolId | null;
  fear: number;
  alive: boolean;
  vanish: number;       // > 0 while being taken away
  walk: number;
  face: number;
  word: string;
  wordT: number;
  /** A child spy: who they are shadowing. */
  shadow: number;
  /** How easily this one starts to think. */
  sus: number;
}

export type ToolId = 'hate' | 'gin' | 'lottery' | 'rally' | 'telescreen' | 'spies' | 'minitrue' | 'newspeak' | 'police';

export interface ToolDef {
  id: ToolId;
  key: string;
  name: string;
  cost: number;
  kind: 'distract' | 'build' | 'police';
  radius: number;
  blurb: string;
}

export const TOOLS: ToolDef[] = [
  { id: 'hate', key: '1', name: 'Two Minutes Hate', cost: 20, kind: 'distract', radius: 5.5, blurb: 'A face on the screen to scream at. Works on Party members.' },
  { id: 'gin', key: '2', name: 'Victory Gin', cost: 12, kind: 'distract', radius: 4.5, blurb: 'Oily, burning, cheap. Works on anyone, briefly.' },
  { id: 'lottery', key: '3', name: 'The Lottery', cost: 15, kind: 'distract', radius: 6, blurb: 'Nobody ever wins. The proles love it.' },
  { id: 'rally', key: '4', name: 'Hate Week Rally', cost: 45, kind: 'distract', radius: 9, blurb: 'Banners, drums, a whole square roaring.' },
  { id: 'telescreen', key: '5', name: 'Telescreen', cost: 80, kind: 'build', radius: 7, blurb: 'It watches, and cannot be switched off. Thinking slows near it.' },
  { id: 'spies', key: '6', name: 'Junior Spies', cost: 60, kind: 'build', radius: 0, blurb: 'Two children who follow thinkers and report them. Free arrests.' },
  { id: 'minitrue', key: '7', name: 'Records Desk', cost: 100, kind: 'build', radius: 0, blurb: 'The Ministry of Truth. Arrests leave no rumours, and history can be fixed for free.' },
  { id: 'newspeak', key: '8', name: 'Newspeak Dictionary', cost: 120, kind: 'build', radius: 0, blurb: 'Fewer words, fewer thoughts. Thinking spreads more slowly everywhere.' },
  { id: 'police', key: '9', name: 'Thought Police', cost: 50, kind: 'police', radius: 6, blurb: 'Take a thinker away. The ones nearby will be afraid, and afraid people work badly.' },
];
export const TOOL_BY_ID = Object.fromEntries(TOOLS.map((t) => [t.id, t])) as Record<ToolId, ToolDef>;

export interface Building { id: number; tool: ToolId; x: number; z: number; t: number }
export interface Effect { id: number; tool: ToolId; x: number; z: number; r: number; t: number; life: number }

export interface GameEvent {
  month: number;
  id: string;
  title: string;
  body: string;
  kind: 'info' | 'rewrite' | 'special' | 'ration' | 'room101';
}

/** The year, as it happens to you. */
export const EVENTS: GameEvent[] = [
  { month: 1.2, id: 'diary', title: 'A MAN HAS BOUGHT A DIARY', kind: 'special', body: 'Winston Smith, Records Department, has bought a blank book from a junk shop in a prole district. He writes in it where the telescreen cannot see. He thinks all the time now, and the thinking is catching. Distractions do not work on him.' },
  { month: 3.2, id: 'ration', title: 'THE CHOCOLATE RATION', kind: 'ration', body: 'The ration is being cut from thirty grammes to twenty. Announce it as a cut, and they will grumble. Or announce that it has been raised to twenty, and thank Big Brother for it. They will believe you, if nobody can find last month\'s figure.' },
  { month: 4.4, id: 'julia', title: 'A NOTE: I LOVE YOU', kind: 'special', body: 'A girl from the Fiction Department has slipped Winston a note. Julia does not think about the Party at all, which is its own kind of thinking. When the two of them are together, it spreads twice as fast.' },
  { month: 6.1, id: 'war', title: 'OCEANIA IS AT WAR WITH EASTASIA', kind: 'rewrite', body: 'Halfway through a speech, the enemy has changed. It was Eurasia this morning. By tonight it must always have been Eastasia: every newspaper, every poster, every record. Rewrite them now, or everyone who remembers will start to wonder.' },
  { month: 8.6, id: 'hateweek', title: 'HATE WEEK', kind: 'info', body: 'Processions, banners, films and speeches. For a while, every distraction costs half as much, and the crowd will bear a higher quota.' },
  { month: 11.2, id: 'room101', title: 'ROOM 101', kind: 'room101', body: 'O\'Brien has him now. There is no hurry; there is never any hurry. But it has to end before the year does.' },
];

export const YEAR_SECONDS = 240;           // a month is twenty seconds
export const LOSE_FRACTION = 0.5;
export const LOSE_HOLD = 7;

export const WORLD = { w: 56, d: 34 };
/** How strongly one thinker sets a neighbour thinking, per second. */
export const SPREAD = 0.0065;

const THINK_WORDS = ['wait, what?', 'hm.', 'why?', '2 + 2 = 4?', 'I remember…', 'was it always?', 'who decided?', 'huh', 'the ration?', 'lemons…', 'is anyone else—', 'what if', 'no, really?', 'the old days', 'we were at war with…', 'I wrote it down'];
const CALM_WORDS = ['ok', 'fine', 'whatever', 'doubleplusgood', 'ok ok', 'yes', 'good', 'right'];
const DISTRACT_WORDS: Record<string, string[]> = {
  hate: ['HATE!', 'traitor!', 'swine!', 'B-B! B-B!'],
  gin: ['*cough*', 'ahh', 'one more'],
  lottery: ['this week!', 'my numbers!', 'I nearly won'],
  rally: ['HATE WEEK!', 'B-B!', 'death to Eastasia!'],
};

export interface Sim {
  t: number;
  month: number;
  credits: number;
  produced: number;
  target: number;
  quota: number;
  tolerance: number;
  citizens: Citizen[];
  buildings: Building[];
  effects: Effect[];
  vanished: number;
  thinkingFrac: number;
  loseT: number;
  over: null | 'lost' | 'won';
  eventIdx: number;
  pendingEvent: GameEvent | null;
  rewriteT: number;       // counting down while history is out of date
  hateWeekT: number;
  rationBoost: number;
  rationLie: boolean;
  winston: number;
  julia: number;
  spies: number[];
  nextId: number;
  log: { t: number; text: string }[];
  income: number;
  /** For the pop of coins towards the Ministries. */
  paid: { x: number; z: number; t: number }[];
}

function rnd(seed: number) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
const R = rnd(1984);
const pick = <T,>(a: T[]) => a[Math.floor(R() * a.length)]!;

function wander(c: Citizen) {
  c.tx = (R() - 0.5) * (WORLD.w - 8);
  c.tz = (R() - 0.5) * (WORLD.d - 8);
}

export function newCitizen(s: Sim, kind: Kind, x?: number, z?: number): Citizen {
  const c: Citizen = {
    id: s.nextId++, x: x ?? (R() - 0.5) * (WORLD.w - 8), z: z ?? (R() - 0.5) * (WORLD.d - 8), tx: 0, tz: 0,
    speed: kind === 'child' ? 2.6 : 1 + R() * 0.8, kind, special: null, doubt: R() * 0.2, thinking: false,
    distracted: 0, distraction: null, fear: 0, alive: true, vanish: 0, walk: R() * 6, face: R() * 6, word: '', wordT: 0, shadow: -1, sus: 0.5 + R(),
  };
  wander(c);
  s.citizens.push(c);
  return c;
}

export function createSim(n = 150): Sim {
  const s: Sim = {
    t: 0, month: 0, credits: 120, produced: 0, target: 0, quota: 0.3, tolerance: 0.5, citizens: [], buildings: [], effects: [],
    vanished: 0, thinkingFrac: 0, loseT: 0, over: null, eventIdx: 0, pendingEvent: null, rewriteT: 0, hateWeekT: 0,
    rationBoost: 0, rationLie: false, winston: -1, julia: -1, spies: [], nextId: 1, log: [], income: 0, paid: [],
  };
  for (let i = 0; i < n; i++) newCitizen(s, R() < 0.3 ? 'prole' : 'party');
  return s;
}

export const cost = (s: Sim, t: ToolDef) => (t.kind === 'distract' && s.hateWeekT > 0 ? Math.ceil(t.cost / 2) : t.cost);
const hasBuilding = (s: Sim, id: ToolId) => s.buildings.some((b) => b.tool === id);
const count = (s: Sim, id: ToolId) => s.buildings.filter((b) => b.tool === id).length;

/** Use a tool at a point (or on a citizen, for the police). Returns a reason if it could not be used. */
export function applyTool(s: Sim, id: ToolId, x: number, z: number, target?: Citizen): string | null {
  const t = TOOL_BY_ID[id];
  const price = cost(s, t);
  if (s.credits < price) return 'Not enough in the treasury.';
  if (t.kind === 'police') {
    if (!target || !target.alive) return 'Click a citizen.';
    s.credits -= price;
    arrest(s, target, false);
    return null;
  }
  if (Math.abs(x) > WORLD.w / 2 - 1 || Math.abs(z) > WORLD.d / 2 - 1) return 'Out of bounds.';
  s.credits -= price;
  if (t.kind === 'distract') {
    s.effects.push({ id: s.nextId++, tool: id, x, z, r: t.radius, t: 0, life: id === 'rally' ? 16 : 12 });
    for (const c of s.citizens) {
      if (!c.alive || c.special === 'winston') continue;
      if (Math.hypot(c.x - x, c.z - z) > t.radius) continue;
      const works = id === 'lottery' ? (c.kind === 'prole' ? 1 : 0.35) : id === 'hate' ? (c.kind === 'party' ? 1 : 0.5) : 1;
      c.distracted = (id === 'rally' ? 16 : 11) * works;
      c.distraction = id;
      c.doubt = Math.max(0, c.doubt - 0.5 * works);
      c.thinking = c.doubt > 0.6;
      c.tx = x + (c.x - x) * 0.4; c.tz = z + (c.z - z) * 0.4;
      if (R() < 0.3) say(c, pick(DISTRACT_WORDS[id] ?? CALM_WORDS), 2.5);
    }
    return null;
  }
  s.buildings.push({ id: s.nextId++, tool: id, x, z, t: 0 });
  if (id === 'spies') {
    for (let k = 0; k < 2; k++) { const c = newCitizen(s, 'child', x + (k ? 0.8 : -0.8), z); c.doubt = 0; s.spies.push(c.id); }
  }
  return null;
}

export function arrest(s: Sim, c: Citizen, bySpy: boolean) {
  if (!c.alive || c.vanish > 0) return;
  c.vanish = 2.4;
  c.word = '';
  const quiet = hasBuilding(s, 'minitrue');
  for (const o of s.citizens) {
    if (o === c || !o.alive) continue;
    const d = Math.hypot(o.x - c.x, o.z - c.z);
    if (d < TOOL_BY_ID.police.radius) { o.fear = 12; o.doubt = Math.max(0, o.doubt - 0.3); o.thinking = o.doubt > 0.6; say(o, pick(['…', 'I saw nothing', 'ok', 'fine']), 2); }
    else if (!quiet) o.doubt = Math.min(1, o.doubt + (bySpy ? 0.01 : 0.03)); // rumours
  }
}

function say(c: Citizen, w: string, t = 3) { c.word = w; c.wordT = t; }

/** Apply the answer to an event card. */
export function resolveEvent(s: Sim, choice: 'ok' | 'rewrite' | 'lie' | 'truth') {
  const e = s.pendingEvent;
  if (!e) return;
  s.pendingEvent = null;
  if (e.id === 'diary') {
    const c = s.citizens.find((x) => x.alive && x.kind === 'party' && !x.special)!;
    c.special = 'winston'; c.doubt = 1; c.thinking = true; s.winston = c.id;
  } else if (e.id === 'julia') {
    const c = s.citizens.find((x) => x.alive && x.kind === 'party' && !x.special)!;
    c.special = 'julia'; c.doubt = 0.7; s.julia = c.id;
  } else if (e.id === 'war') {
    if (choice === 'rewrite') {
      const price = hasBuilding(s, 'minitrue') ? 0 : 60;
      if (s.credits >= price) { s.credits -= price; s.log.push({ t: s.t, text: 'The records were corrected. Oceania has always been at war with Eastasia.' }); }
      else s.rewriteT = 20;
    } else s.rewriteT = 20;
  } else if (e.id === 'room101') {
    for (const id of [s.winston, s.julia]) {
      const c = s.citizens.find((x) => x.id === id && x.alive && x.vanish <= 0);
      if (c) { c.vanish = 2.4; c.word = ''; }
    }
  } else if (e.id === 'hateweek') {
    s.hateWeekT = 40;
  } else if (e.id === 'ration') {
    if (choice === 'lie') { s.rationLie = true; s.rationBoost = 25; if (!hasBuilding(s, 'minitrue')) s.rewriteT = 12; }
    else for (const c of s.citizens) if (c.alive) c.doubt = Math.min(1, c.doubt + 0.12);
  }
}

/** One step of the world. `dt` in seconds. */
export function step(s: Sim, dt: number, demo = false) {
  if (demo) {
    // the square before the game starts: people walking, nobody thinking
    for (const c of s.citizens) {
      if (!c.alive || c.kind === 'child') continue;
      const dx = c.tx - c.x, dz = c.tz - c.z, l = Math.hypot(dx, dz);
      if (l < 0.3) wander(c); else { const sp = c.speed * dt; c.x += (dx / l) * sp; c.z += (dz / l) * sp; c.face = Math.atan2(dx, dz); c.walk += dt * 9 * c.speed; }
      c.wordT -= dt;
    }
    return;
  }
  if (s.over || s.pendingEvent) return;
  s.t += dt;
  s.month = (s.t / YEAR_SECONDS) * 12;
  if (s.month >= 12) { s.month = 12; s.over = 'won'; return; }
  // the calendar
  const next = EVENTS[s.eventIdx];
  if (next && s.month >= next.month) { s.pendingEvent = next; s.eventIdx++; return; }
  if (s.hateWeekT > 0) s.hateWeekT -= dt;
  if (s.rationBoost > 0) s.rationBoost -= dt;
  // history that has not been corrected curdles into doubt
  if (s.rewriteT > 0) {
    s.rewriteT -= dt;
    if (s.rewriteT <= 0) {
      for (const c of s.citizens) if (c.alive) c.doubt = Math.min(1, c.doubt + 0.28);
      s.log.push({ t: s.t, text: 'Somebody remembered what the posters said last week.' });
    }
  }
  // how much the crowd will bear
  const fearful = s.citizens.filter((c) => c.alive && c.fear > 0).length / Math.max(1, s.citizens.length);
  s.tolerance = Math.min(0.85, 0.42 + (s.hateWeekT > 0 ? 0.15 : 0) + (s.rationBoost > 0 ? 0.1 : 0) + fearful * 0.15);
  const overload = Math.max(0, s.quota - s.tolerance);
  const spreadK = Math.max(0.35, 1 - 0.14 * count(s, 'newspeak'));
  const screens = s.buildings.filter((b) => b.tool === 'telescreen');
  const living = s.citizens.filter((c) => c.alive && c.vanish <= 0);
  const thinkers = living.filter((c) => c.thinking);
  const winston = living.find((c) => c.id === s.winston);
  const julia = living.find((c) => c.id === s.julia);
  const lovers = winston && julia && Math.hypot(winston.x - julia.x, winston.z - julia.z) < 4;
  let income = 0;
  for (const c of s.citizens) {
    if (!c.alive) continue;
    if (c.vanish > 0) { c.vanish -= dt; if (c.vanish <= 0) { c.alive = false; s.vanished++; } continue; }
    c.distracted = Math.max(0, c.distracted - dt);
    if (c.distracted <= 0) c.distraction = null;
    c.fear = Math.max(0, c.fear - dt);
    c.wordT -= dt;
    if (c.kind === 'child') { spyStep(s, c, dt, thinkers); continue; }
    // doubt
    const watched = screens.some((b) => Math.hypot(b.x - c.x, b.z - c.z) < TOOL_BY_ID.telescreen.radius) && c.special !== 'winston';
    // above the line doubt builds; below it, it fades
    const under = Math.max(0, s.tolerance - s.quota);
    let d = (overload * 0.06 - under * 0.03 + 0.0012) * c.sus * (c.kind === 'prole' ? 0.6 : 1);
    // now and then, somebody simply has a thought
    if (overload > 0 && R() < overload * 0.05 * dt * c.sus) d += 0.3 / dt;
    if (c.distracted > 0) d = -0.12;
    else {
      for (const o of thinkers) {
        if (o === c) continue;
        const r = o.special === 'winston' ? 5 : 3.2;
        const dd = Math.hypot(o.x - c.x, o.z - c.z);
        if (dd < r) d += (o.special === 'winston' ? 0.016 : SPREAD) * (lovers ? 2 : 1) * spreadK * (1 - dd / r) * c.sus;
      }
      if (watched) d = d * 0.35 - 0.02;
      if (c.fear > 0) d -= 0.03;
      // a thinker left alone below the line slowly talks themselves out of it
      if (c.thinking && overload <= 0) d -= 0.006;
    }
    if (c.special === 'winston') d = Math.max(d, 0.02);
    if (c.special === 'julia') d = Math.max(d, 0.004);
    c.doubt = Math.max(0, Math.min(1, c.doubt + d * dt));
    const was = c.thinking;
    c.thinking = c.thinking ? c.doubt > 0.42 : c.doubt > 0.62;
    if (c.thinking && !was) say(c, pick(THINK_WORDS), 3.2);
    if (!c.thinking && was) say(c, pick(CALM_WORDS), 1.8);
    if (c.thinking && c.wordT < -4 - R() * 6) say(c, pick(THINK_WORDS), 3);
    if (c.fear <= 0 && c.distracted <= 0 && !c.thinking && c.wordT < -30 && R() < 0.002) say(c, pick(CALM_WORDS), 1.5);
    // move: thinkers stop and look up; the rest go about their business
    if (!c.thinking) {
      const dx = c.tx - c.x, dz = c.tz - c.z, l = Math.hypot(dx, dz);
      if (l < 0.3) { if (c.distracted <= 0) wander(c); }
      else { const sp = c.speed * (c.fear > 0 ? 0.6 : 1) * dt; c.x += (dx / l) * sp; c.z += (dz / l) * sp; c.face = Math.atan2(dx, dz); c.walk += dt * 9 * c.speed; }
    }
    // work
    if (!c.thinking) {
      const w = (c.kind === 'prole' ? 0.55 : 1) * (c.fear > 0 ? 0.5 : 1) * (c.distraction === 'gin' ? 0.6 : 1) * (c.distracted > 0 && c.distraction !== 'gin' ? 0.4 : 1);
      const pay = w * s.quota * 0.06 * dt;
      income += pay;
      if (R() < pay * 1.5) s.paid.push({ x: c.x, z: c.z, t: 0 });
    }
  }
  s.income = income / Math.max(dt, 1e-6);
  s.credits += income;
  s.produced += income;
  s.target += 0.4 * 0.06 * 150 * 0.8 * dt; // what the Plan expects: a steady, moderate quota
  for (const e of s.effects) e.t += dt;
  s.effects = s.effects.filter((e) => e.t < e.life);
  for (const b of s.buildings) b.t += dt;
  for (const p of s.paid) p.t += dt;
  s.paid = s.paid.filter((p) => p.t < 1.4);
  // losing them
  const alive = s.citizens.filter((c) => c.alive && c.kind !== 'child');
  s.thinkingFrac = alive.length ? alive.filter((c) => c.thinking).length / alive.length : 0;
  if (s.thinkingFrac >= LOSE_FRACTION) { s.loseT += dt; if (s.loseT > LOSE_HOLD) s.over = 'lost'; }
  else s.loseT = Math.max(0, s.loseT - dt * 2);
}

function spyStep(s: Sim, c: Citizen, dt: number, thinkers: Citizen[]) {
  let target = s.citizens.find((o) => o.id === c.shadow && o.alive && o.vanish <= 0 && o.thinking);
  if (!target) {
    let best = 1e9;
    for (const o of thinkers) { const d = Math.hypot(o.x - c.x, o.z - c.z); if (d < best && o.special !== 'winston') { best = d; target = o; } }
    c.shadow = target?.id ?? -1;
  }
  if (target) { c.tx = target.x; c.tz = target.z; }
  else if (Math.hypot(c.tx - c.x, c.tz - c.z) < 0.3) wander(c);
  const dx = c.tx - c.x, dz = c.tz - c.z, l = Math.hypot(dx, dz);
  if (l > 0.05) { const sp = Math.min(l, c.speed * dt); c.x += (dx / l) * sp; c.z += (dz / l) * sp; c.face = Math.atan2(dx, dz); c.walk += dt * 14; }
  if (target && l < 0.7) { arrest(s, target, true); say(c, pick(['Daddy said it!', 'I heard him!', 'Thoughtcriminal!', 'Traitor!']), 2.5); c.shadow = -1; }
}

