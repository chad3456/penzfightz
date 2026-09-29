/**
 * Airstrip One — the rules.
 *
 * You are the Party. A square of citizens walks about below the telescreens
 * and works; their work pays for everything. Push the quota and they work
 * harder, until they begin to think. A citizen who is thinking looks up,
 * stops working, and — worse — sets the people near them thinking too.
 *
 * On top of that: the Inner Party sends Directives that pay in medals; the
 * Brotherhood slips agents into the crowd who whisper doubt as they walk and
 * can only be seen under a telescreen or by a child; and the calendar brings
 * the year's events. Keep their heads down until December.
 */

export type Kind = 'party' | 'prole' | 'child';
export type Special = 'winston' | 'julia' | null;
export type Mode = 'demo' | 'induction' | 'year';

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
  /** A Brotherhood agent: whispers doubt, hidden until seen. */
  agent: boolean;
  revealed: number;
  /** Marked by the Induction as the one to take. */
  suspect: boolean;
  /** Held in place (the Induction's knot of thinkers). */
  pinned: boolean;
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
  { id: 'hate', key: '1', name: 'Two Minutes Hate', cost: 20, kind: 'distract', radius: 5.5, blurb: 'A face on the screen to scream at. Works best on Party members.' },
  { id: 'gin', key: '2', name: 'Victory Gin', cost: 12, kind: 'distract', radius: 4.5, blurb: 'Oily, burning, cheap. Works on anyone, briefly, and they work worse drunk.' },
  { id: 'lottery', key: '3', name: 'The Lottery', cost: 15, kind: 'distract', radius: 6, blurb: 'Nobody ever wins. The proles love it.' },
  { id: 'rally', key: '4', name: 'Hate Week Rally', cost: 45, kind: 'distract', radius: 9, blurb: 'Banners, drums, a whole square roaring.' },
  { id: 'telescreen', key: '5', name: 'Telescreen', cost: 80, kind: 'build', radius: 7, blurb: 'Thinking slows under it, and Brotherhood agents show up red.' },
  { id: 'spies', key: '6', name: 'Junior Spies', cost: 60, kind: 'build', radius: 0, blurb: 'Two children who follow thinkers (and agents) and report them. Free arrests.' },
  { id: 'minitrue', key: '7', name: 'Records Desk', cost: 100, kind: 'build', radius: 0, blurb: 'The Ministry of Truth. Arrests start no rumours, and history is rewritten free.' },
  { id: 'newspeak', key: '8', name: 'Newspeak Dictionary', cost: 120, kind: 'build', radius: 0, blurb: 'Fewer words, fewer thoughts. Thinking spreads more slowly everywhere.' },
  { id: 'police', key: '9', name: 'Thought Police', cost: 50, kind: 'police', radius: 6, blurb: 'Take someone away. Bystanders freeze with fear. Take an innocent and they talk.' },
];
export const TOOL_BY_ID = Object.fromEntries(TOOLS.map((t) => [t.id, t])) as Record<ToolId, ToolDef>;

export interface Building { id: number; tool: ToolId; x: number; z: number; t: number }
export interface Effect { id: number; tool: ToolId; x: number; z: number; r: number; t: number; life: number }
export interface Pop { id: number; x: number; z: number; text: string; kind: 'money' | 'good' | 'bad' | 'info'; t: number }

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

export type DirectiveKind = 'plan' | 'calm' | 'build' | 'mercy' | 'unity' | 'agent' | 'push';
export interface Directive {
  id: number;
  kind: DirectiveKind;
  title: string;
  text: string;
  t: number;
  limit: number;
  reward: number;
  need: number;
  prog: number;
  base: number;
  state: 'active' | 'done' | 'failed';
}

export const YEAR_SECONDS = 240;           // a month is twenty seconds
export const LOSE_FRACTION = 0.5;
export const LOSE_HOLD = 7;
export const WORLD = { w: 56, d: 34 };
/** How strongly one thinker sets a neighbour thinking, per second. */
export const SPREAD = 0.0065;

const THINK_WORDS = ['wait, what?', 'hm.', 'why?', '2 + 2 = 4?', 'I remember…', 'was it always?', 'who decided?', 'huh', 'the ration?', 'lemons…', 'is anyone else—', 'what if', 'no, really?', 'the old days', 'we were at war with…', 'I wrote it down'];
const CALM_WORDS = ['ok', 'fine', 'whatever', 'doubleplusgood', 'ok ok', 'yes', 'good', 'right'];
const WHISPERS = ['have you heard of the Book?', 'psst', 'they lie', 'the Brotherhood…', 'meet me', 'it was Eurasia'];
const DISTRACT_WORDS: Record<string, string[]> = {
  hate: ['HATE!', 'traitor!', 'swine!', 'B-B! B-B!'],
  gin: ['*cough*', 'ahh', 'one more'],
  lottery: ['this week!', 'my numbers!', 'I nearly won'],
  rally: ['HATE WEEK!', 'B-B!', 'death to Eastasia!'],
};

export interface Stats { calmed: number; bestCombo: number; arrests: number; agents: number; innocents: number; medals: number; failed: number; thinkSum: number; thinkN: number }
export interface Report { month: number; plan: number; thinking: number; arrests: number; medals: number }

export interface Sim {
  mode: Mode;
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
  rewriteT: number;
  hateWeekT: number;
  rationBoost: number;
  displeasureT: number;
  winston: number;
  julia: number;
  nextId: number;
  income: number;
  paid: { x: number; z: number; t: number }[];
  pops: Pop[];
  directive: Directive | null;
  nextDirectiveT: number;
  directiveN: number;
  agentT: number;
  stats: Stats;
  reports: Report[];
  lastMonth: number;
  monthArrests: number;
  monthMedals: number;
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
    agent: false, revealed: 0, suspect: false, pinned: false,
  };
  wander(c);
  s.citizens.push(c);
  return c;
}

export function createSim(mode: Mode = 'demo', n = 150): Sim {
  const s: Sim = {
    mode, t: 0, month: 0, credits: 140, produced: 0, target: 0, quota: 0.3, tolerance: 0.42, citizens: [], buildings: [], effects: [],
    vanished: 0, thinkingFrac: 0, loseT: 0, over: null, eventIdx: 0, pendingEvent: null, rewriteT: 0, hateWeekT: 0,
    rationBoost: 0, displeasureT: 0, winston: -1, julia: -1, nextId: 1, income: 0, paid: [], pops: [],
    directive: null, nextDirectiveT: 18, directiveN: 0, agentT: 55,
    stats: { calmed: 0, bestCombo: 0, arrests: 0, agents: 0, innocents: 0, medals: 0, failed: 0, thinkSum: 0, thinkN: 0 },
    reports: [], lastMonth: 0, monthArrests: 0, monthMedals: 0,
  };
  for (let i = 0; i < n; i++) newCitizen(s, R() < 0.3 ? 'prole' : 'party');
  return s;
}

export const cost = (s: Sim, t: ToolDef) => (t.kind === 'distract' && s.hateWeekT > 0 ? Math.ceil(t.cost / 2) : t.cost);
export const hasBuilding = (s: Sim, id: ToolId) => s.buildings.some((b) => b.tool === id);
const count = (s: Sim, id: ToolId) => s.buildings.filter((b) => b.tool === id).length;
export const planPct = (s: Sim) => (s.target > 1 ? s.produced / s.target : 1);

export function pop(s: Sim, x: number, z: number, text: string, kind: Pop['kind'] = 'info') {
  s.pops.push({ id: s.nextId++, x, z, text, kind, t: 0 });
  if (s.pops.length > 30) s.pops.shift();
}

function say(c: Citizen, w: string, t = 3) { c.word = w; c.wordT = t; }

/** Use a tool at a point (or on a citizen, for the police). Returns a reason if it could not be used. */
export function applyTool(s: Sim, id: ToolId, x: number, z: number, target?: Citizen): string | null {
  const t = TOOL_BY_ID[id];
  const price = cost(s, t);
  if (s.credits < price) return 'Not enough in the treasury.';
  if (t.kind === 'police') {
    if (!target || !target.alive || target.vanish > 0) return 'Click a citizen.';
    s.credits -= price;
    arrest(s, target, false);
    return null;
  }
  if (Math.abs(x) > WORLD.w / 2 - 1 || Math.abs(z) > WORLD.d / 2 - 1) return 'Out of bounds.';
  s.credits -= price;
  if (t.kind === 'distract') {
    s.effects.push({ id: s.nextId++, tool: id, x, z, r: t.radius, t: 0, life: id === 'rally' ? 16 : 12 });
    let reached = 0, calmed = 0;
    for (const c of s.citizens) {
      if (!c.alive || c.vanish > 0 || c.kind === 'child' || c.special === 'winston' || c.suspect) continue;
      if (Math.hypot(c.x - x, c.z - z) > t.radius) continue;
      const works = id === 'lottery' ? (c.kind === 'prole' ? 1 : 0.35) : id === 'hate' ? (c.kind === 'party' ? 1 : 0.5) : 1;
      const was = c.thinking;
      c.distracted = (id === 'rally' ? 16 : 11) * works;
      c.distraction = id;
      c.doubt = Math.max(0, c.doubt - 0.55 * works);
      c.thinking = c.doubt > 0.6;
      c.pinned = false;
      if (was && !c.thinking) calmed++;
      reached++;
      c.tx = x + (c.x - x) * 0.4; c.tz = z + (c.z - z) * 0.4;
      if (R() < 0.3) say(c, pick(DISTRACT_WORDS[id] ?? CALM_WORDS), 2.5);
    }
    s.stats.calmed += calmed;
    s.stats.bestCombo = Math.max(s.stats.bestCombo, calmed);
    // a crowd turned in one go pays a bonus
    if (calmed >= 3) {
      const bonus = calmed * 5;
      s.credits += bonus;
      pop(s, x, z, `DOUBLEPLUSGOOD ×${calmed}  +$${bonus}`, 'good');
    } else if (calmed > 0) pop(s, x, z, `−${calmed} thinking`, 'good');
    else pop(s, x, z, `${reached} distracted`, 'info');
    const d = s.directive;
    if (d && d.state === 'active' && d.kind === 'unity') d.prog = Math.max(d.prog, reached / d.need);
    return null;
  }
  s.buildings.push({ id: s.nextId++, tool: id, x, z, t: 0 });
  pop(s, x, z, TOOL_BY_ID[id].name.toUpperCase(), 'info');
  if (id === 'spies') for (let k = 0; k < 2; k++) { const c = newCitizen(s, 'child', x + (k ? 0.8 : -0.8), z); c.doubt = 0; }
  const d = s.directive;
  if (d && d.state === 'active' && d.kind === 'build' && id === 'telescreen') d.prog = Math.min(1, d.prog + 1 / d.need);
  return null;
}

export function arrest(s: Sim, c: Citizen, bySpy: boolean) {
  if (!c.alive || c.vanish > 0) return;
  c.vanish = 2.4;
  c.word = '';
  s.stats.arrests++;
  s.monthArrests++;
  const quiet = hasBuilding(s, 'minitrue');
  const guilty = c.thinking || c.agent || c.suspect || c.special !== null;
  if (c.agent) {
    s.stats.agents++;
    s.credits += 80;
    pop(s, c.x, c.z, 'BROTHERHOOD AGENT  +$80', 'good');
    for (const o of s.citizens) if (o.alive && Math.hypot(o.x - c.x, o.z - c.z) < 8) o.doubt = Math.max(0, o.doubt - 0.3);
    const d = s.directive;
    if (d && d.state === 'active' && d.kind === 'agent') d.prog = 1;
  } else if (!guilty) {
    s.stats.innocents++;
    pop(s, c.x, c.z, 'AN INNOCENT. THEY ALL SAW.', 'bad');
  } else pop(s, c.x, c.z, bySpy ? 'REPORTED BY A CHILD' : 'UNPERSON', 'info');
  for (const o of s.citizens) {
    if (o === c || !o.alive) continue;
    const d = Math.hypot(o.x - c.x, o.z - c.z);
    if (d < TOOL_BY_ID.police.radius) { o.fear = 12; if (guilty) o.doubt = Math.max(0, o.doubt - 0.3); else o.doubt = Math.min(1, o.doubt + 0.35); o.thinking = o.doubt > 0.6; say(o, pick(guilty ? ['…', 'I saw nothing', 'ok', 'fine'] : ['but he did nothing', 'why him?', '…him?']), 2.2); }
    else if (!quiet || !guilty) o.doubt = Math.min(1, o.doubt + (bySpy ? 0.01 : guilty ? 0.025 : 0.06)); // rumours
  }
  const d = s.directive;
  if (d && d.state === 'active' && d.kind === 'mercy') { d.state = 'failed'; d.t = d.limit; s.stats.failed++; s.displeasureT = 25; pop(s, 0, -WORLD.d / 2 + 2, 'THE PRESS SAW THE VAN', 'bad'); }
}

/* ───────────── the Induction's props ───────────── */

/** Set a knot of citizens thinking, standing still, around a point. */
export function spawnKnot(s: Sim, x: number, z: number, n: number) {
  const near = s.citizens.filter((c) => c.alive && c.kind !== 'child' && !c.special && !c.agent).sort((a, b) => Math.hypot(a.x - x, a.z - z) - Math.hypot(b.x - x, b.z - z)).slice(0, n);
  near.forEach((c, i) => { const a = (i / n) * Math.PI * 2; c.x = x + Math.cos(a) * 1.4; c.z = z + Math.sin(a) * 1.1; c.doubt = 0.9; c.thinking = true; c.pinned = true; c.kind = 'party'; say(c, pick(THINK_WORDS), 4); });
  return near.map((c) => c.id);
}
export function markSuspect(s: Sim, x: number, z: number) {
  const c = s.citizens.find((o) => o.alive && o.kind === 'party' && !o.special && !o.pinned && !o.agent)!;
  c.x = x; c.z = z; c.suspect = true; c.doubt = 1; c.thinking = true; c.pinned = true; say(c, 'down with…', 5);
  return c.id;
}
export function plantAgent(s: Sim, x?: number, z?: number) {
  const pool = s.citizens.filter((o) => o.alive && o.kind === 'party' && !o.special && !o.pinned && !o.agent && !o.thinking);
  const c = pool[Math.floor(R() * pool.length)]!;
  if (x !== undefined && z !== undefined) { c.x = x; c.z = z; }
  c.agent = true; c.speed = 1.9; c.doubt = 0;
  return c.id;
}

/* ───────────── directives ───────────── */

function newDirective(s: Sim): Directive | null {
  const agentAlive = s.citizens.some((c) => c.alive && c.agent && c.vanish <= 0);
  const kinds: DirectiveKind[] = ['plan', 'calm', 'build', 'mercy', 'unity', 'push'];
  if (agentAlive) kinds.push('agent', 'agent');
  const kind = kinds[(s.directiveN * 5 + Math.floor(R() * kinds.length)) % kinds.length]!;
  s.directiveN++;
  const base = { id: s.nextId++, t: 0, prog: 0, state: 'active' as const, base: 0 };
  switch (kind) {
    case 'plan': return { ...base, kind, title: 'EXCEED THE PLAN', text: 'Boot production is to rise. Push the Plan eight points higher.', limit: 45, reward: 90, need: 0.08, base: planPct(s) };
    case 'calm': return { ...base, kind, title: 'A QUIET SQUARE', text: 'A newsreel crew is filming. Keep thinking under 6% for twenty seconds.', limit: 55, reward: 80, need: 20 };
    case 'build': return { ...base, kind, title: 'MORE EYES', text: 'Put up two more telescreens.', limit: 50, reward: 70, need: 2 };
    case 'mercy': return { ...base, kind, title: 'THE FOREIGN PRESS', text: 'Visitors from the Party press. No arrests for thirty seconds.', limit: 30, reward: 70, need: 30 };
    case 'unity': return { ...base, kind, title: 'UNITY', text: 'Reach 25 citizens with a single distraction.', limit: 45, reward: 80, need: 25 };
    case 'agent': return { ...base, kind, title: 'FIND THE TRAITOR', text: 'A Brotherhood agent is loose. Catch one before the trail goes cold.', limit: 50, reward: 120, need: 1 };
    case 'push': return { ...base, kind, title: 'OVERTIME', text: 'Hold the quota above the red line for fifteen seconds, and keep thinking under 25%.', limit: 45, reward: 100, need: 15 };
  }
  return null;
}

function directiveStep(s: Sim, dt: number) {
  const d = s.directive;
  if (!d) {
    s.nextDirectiveT -= dt;
    if (s.nextDirectiveT <= 0) s.directive = newDirective(s);
    return;
  }
  if (d.state !== 'active') {
    d.t += dt;
    if (d.t > d.limit + 3) { s.directive = null; s.nextDirectiveT = 12; }
    return;
  }
  d.t += dt;
  switch (d.kind) {
    case 'plan': d.prog = Math.max(0, (planPct(s) - d.base) / d.need); break;
    case 'calm': if (s.thinkingFrac < 0.06) d.prog += dt / d.need; break;
    case 'mercy': d.prog = d.t / d.need; break;
    case 'push': if (s.quota > s.tolerance && s.thinkingFrac < 0.25) d.prog += dt / d.need; break;
    default: break;
  }
  if (d.prog >= 1) {
    d.state = 'done'; d.t = d.limit; s.credits += d.reward; s.stats.medals++; s.monthMedals++;
    pop(s, 0, -WORLD.d / 2 + 2, `DIRECTIVE MET: ${d.title}  +$${d.reward}`, 'good');
  } else if (d.t >= d.limit) {
    d.state = 'failed'; s.stats.failed++; s.displeasureT = 25;
    pop(s, 0, -WORLD.d / 2 + 2, 'THE INNER PARTY IS DISPLEASED', 'bad');
  }
}

/* ───────────── events ───────────── */

/** Apply the answer to an event card. */
export function resolveEvent(s: Sim, choice: 'ok' | 'rewrite' | 'lie' | 'truth') {
  const e = s.pendingEvent;
  if (!e) return;
  s.pendingEvent = null;
  if (e.id === 'diary') {
    const c = s.citizens.find((x) => x.alive && x.kind === 'party' && !x.special && !x.agent)!;
    c.special = 'winston'; c.doubt = 1; c.thinking = true; s.winston = c.id;
  } else if (e.id === 'julia') {
    const c = s.citizens.find((x) => x.alive && x.kind === 'party' && !x.special && !x.agent)!;
    c.special = 'julia'; c.doubt = 0.7; s.julia = c.id;
  } else if (e.id === 'war') {
    const price = hasBuilding(s, 'minitrue') ? 0 : 60;
    if (choice === 'rewrite' && s.credits >= price) s.credits -= price;
    else s.rewriteT = 20;
  } else if (e.id === 'room101') {
    for (const id of [s.winston, s.julia]) {
      const c = s.citizens.find((x) => x.id === id && x.alive && x.vanish <= 0);
      if (c) { c.vanish = 2.4; c.word = ''; }
    }
  } else if (e.id === 'hateweek') {
    s.hateWeekT = 40;
  } else if (e.id === 'ration') {
    if (choice === 'lie') { s.rationBoost = 25; if (!hasBuilding(s, 'minitrue')) s.rewriteT = 12; }
    else for (const c of s.citizens) if (c.alive) c.doubt = Math.min(1, c.doubt + 0.12);
  }
}

/* ───────────── the world, one step ───────────── */

function walk(c: Citizen, dt: number, k = 1) {
  const dx = c.tx - c.x, dz = c.tz - c.z, l = Math.hypot(dx, dz);
  if (l < 0.3) { if (c.distracted <= 0) wander(c); return; }
  const sp = c.speed * k * dt;
  c.x += (dx / l) * sp; c.z += (dz / l) * sp; c.face = Math.atan2(dx, dz); c.walk += dt * 9 * c.speed;
}

export function step(s: Sim, dt: number) {
  if (s.mode === 'demo') {
    for (const c of s.citizens) { if (c.alive && c.kind !== 'child') walk(c, dt); c.wordT -= dt; }
    return;
  }
  if (s.over || s.pendingEvent) return;
  const year = s.mode === 'year';
  if (year) {
    s.t += dt;
    s.month = (s.t / YEAR_SECONDS) * 12;
    if (s.month >= 12) { s.month = 12; s.over = 'won'; return; }
    const next = EVENTS[s.eventIdx];
    if (next && s.month >= next.month) { s.pendingEvent = next; s.eventIdx++; return; }
    // the end of a month: a report
    const m = Math.floor(s.month);
    if (m > s.lastMonth) {
      s.reports.push({ month: s.lastMonth, plan: planPct(s), thinking: s.thinkingFrac, arrests: s.monthArrests, medals: s.monthMedals });
      s.lastMonth = m; s.monthArrests = 0; s.monthMedals = 0;
    }
    directiveStep(s, dt);
    // the Brotherhood sends someone, now and then
    if (s.month > 2) { s.agentT -= dt; if (s.agentT <= 0 && s.citizens.filter((c) => c.alive && c.agent).length < 2) { plantAgent(s); s.agentT = 38 + R() * 20; } }
  }
  if (s.hateWeekT > 0) s.hateWeekT -= dt;
  if (s.rationBoost > 0) s.rationBoost -= dt;
  if (s.displeasureT > 0) s.displeasureT -= dt;
  if (s.rewriteT > 0) {
    s.rewriteT -= dt;
    if (s.rewriteT <= 0) { for (const c of s.citizens) if (c.alive) c.doubt = Math.min(1, c.doubt + 0.28); pop(s, 0, 0, 'SOMEONE REMEMBERED LAST WEEK\'S POSTERS', 'bad'); }
  }
  // how much the crowd will bear
  const fearful = s.citizens.filter((c) => c.alive && c.fear > 0).length / Math.max(1, s.citizens.length);
  s.tolerance = Math.min(0.85, (year ? 0.42 : 0.5) + (s.hateWeekT > 0 ? 0.15 : 0) + (s.rationBoost > 0 ? 0.1 : 0) - (s.displeasureT > 0 ? 0.06 : 0) + fearful * 0.15);
  const overload = year ? Math.max(0, s.quota - s.tolerance) : 0;
  const spreadK = Math.max(0.35, 1 - 0.14 * count(s, 'newspeak'));
  const screens = s.buildings.filter((b) => b.tool === 'telescreen');
  const living = s.citizens.filter((c) => c.alive && c.vanish <= 0);
  const thinkers = living.filter((c) => c.thinking);
  const agents = living.filter((c) => c.agent);
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
    c.revealed = Math.max(0, c.revealed - dt);
    c.wordT -= dt;
    if (c.kind === 'child') { spyStep(s, c, dt, thinkers, agents); continue; }
    const watched = screens.some((b) => Math.hypot(b.x - c.x, b.z - c.z) < TOOL_BY_ID.telescreen.radius);
    if (c.agent) {
      // an agent: never thinks openly, whispers to whoever is near, keeps out of sight
      if (watched) { c.revealed = 3; }
      if (R() < dt * 0.25) say(c, pick(WHISPERS), 2);
      c.doubt = 0; c.thinking = false;
      if (!c.pinned) walk(c, dt);
      if (watched && R() < dt) wander(c);
      income += 0.3 * s.quota * 0.06 * dt;
      continue;
    }
    // doubt: above the line it builds; below it, it fades
    const under = Math.max(0, s.tolerance - s.quota);
    let d = (overload * 0.06 - under * 0.03 + (year ? 0.0012 : 0)) * c.sus * (c.kind === 'prole' ? 0.6 : 1);
    if (overload > 0 && R() < overload * 0.05 * dt * c.sus) d += 0.3 / dt;
    if (c.distracted > 0) d = -0.12;
    else {
      for (const o of thinkers) {
        if (o === c) continue;
        const r = o.special === 'winston' ? 5 : 3.2;
        const dd = Math.hypot(o.x - c.x, o.z - c.z);
        if (dd < r) d += (o.special === 'winston' ? 0.016 : SPREAD) * (lovers ? 2 : 1) * spreadK * (1 - dd / r) * c.sus * (year ? 1 : 0.3);
      }
      for (const a of agents) { const dd = Math.hypot(a.x - c.x, a.z - c.z); if (dd < 2.6) d += 0.05 * spreadK * c.sus; }
      if (watched && c.special !== 'winston') d = d * 0.35 - 0.02;
      if (c.fear > 0) d -= 0.03;
      if (c.thinking && overload <= 0) d -= 0.006;
    }
    if (c.special === 'winston') d = Math.max(d, 0.02);
    if (c.special === 'julia') d = Math.max(d, 0.004);
    if (c.suspect || (c.pinned && c.distracted <= 0)) d = Math.max(d, 0);
    c.doubt = Math.max(0, Math.min(1, c.doubt + d * dt));
    const was = c.thinking;
    c.thinking = c.thinking ? c.doubt > 0.42 : c.doubt > 0.62;
    if (c.thinking && !was) say(c, pick(THINK_WORDS), 3.2);
    if (!c.thinking && was) { say(c, pick(CALM_WORDS), 1.8); c.pinned = false; }
    if (c.thinking && c.wordT < -4 - R() * 6) say(c, pick(THINK_WORDS), 3);
    if (!c.thinking && !c.pinned) walk(c, dt, c.fear > 0 ? 0.6 : 1);
    if (!c.thinking) {
      const w = (c.kind === 'prole' ? 0.55 : 1) * (c.fear > 0 ? 0.5 : 1) * (c.distraction === 'gin' ? 0.6 : 1) * (c.distracted > 0 && c.distraction !== 'gin' ? 0.4 : 1);
      const pay = w * s.quota * 0.06 * dt;
      income += pay;
      if (R() < pay * 1.5) s.paid.push({ x: c.x, z: c.z, t: 0 });
    }
  }
  s.income = income / Math.max(dt, 1e-6);
  s.credits += income;
  if (year) { s.produced += income; s.target += 0.4 * 0.06 * 150 * 0.8 * dt; }
  for (const e of s.effects) e.t += dt;
  s.effects = s.effects.filter((e) => e.t < e.life);
  for (const b of s.buildings) b.t += dt;
  for (const p of s.paid) p.t += dt;
  s.paid = s.paid.filter((p) => p.t < 1.4);
  for (const p of s.pops) p.t += dt;
  s.pops = s.pops.filter((p) => p.t < 2.2);
  const alive = s.citizens.filter((c) => c.alive && c.kind !== 'child');
  s.thinkingFrac = alive.length ? alive.filter((c) => c.thinking).length / alive.length : 0;
  if (year) {
    s.stats.thinkSum += s.thinkingFrac * dt; s.stats.thinkN += dt;
    if (s.thinkingFrac >= LOSE_FRACTION) { s.loseT += dt; if (s.loseT > LOSE_HOLD) s.over = 'lost'; }
    else s.loseT = Math.max(0, s.loseT - dt * 2);
  }
}

function spyStep(s: Sim, c: Citizen, dt: number, thinkers: Citizen[], agents: Citizen[]) {
  // children notice agents first, then thinkers
  let target = s.citizens.find((o) => o.id === c.shadow && o.alive && o.vanish <= 0 && (o.thinking || o.agent));
  if (!target) {
    let best = 1e9;
    for (const o of [...agents, ...thinkers]) { const d = Math.hypot(o.x - c.x, o.z - c.z) * (o.agent ? 0.5 : 1); if (d < best && o.special !== 'winston') { best = d; target = o; } }
    c.shadow = target?.id ?? -1;
  }
  if (target) { c.tx = target.x; c.tz = target.z; if (target.agent && Math.hypot(target.x - c.x, target.z - c.z) < 5) target.revealed = 2; }
  else if (Math.hypot(c.tx - c.x, c.tz - c.z) < 0.3) wander(c);
  const dx = c.tx - c.x, dz = c.tz - c.z, l = Math.hypot(dx, dz);
  if (l > 0.05) { const sp = Math.min(l, c.speed * dt); c.x += (dx / l) * sp; c.z += (dz / l) * sp; c.face = Math.atan2(dx, dz); c.walk += dt * 14; }
  if (target && l < 0.7) { arrest(s, target, true); say(c, pick(['Daddy said it!', 'I heard him!', 'Thoughtcriminal!', 'Traitor!']), 2.5); c.shadow = -1; }
}

/** How the year went, as a rank. */
export function rank(s: Sim) {
  const avgThink = s.stats.thinkN ? s.stats.thinkSum / s.stats.thinkN : 0;
  const score = Math.round(planPct(s) * 100 + s.stats.medals * 15 + s.stats.agents * 10 + s.stats.bestCombo * 2 - avgThink * 120 - s.stats.innocents * 5);
  const ranks: [number, string, string][] = [
    [200, 'BIG BROTHER\'S OWN', 'There is no higher praise, because there is no one else to give it.'],
    [160, 'INNER PARTY', 'A car, a flat with a lift, real coffee, and a telescreen you are allowed to switch off.'],
    [120, 'OUTER PARTY, COMMENDED', 'Your name was read out in the canteen. Everyone clapped, and watched who clapped longest.'],
    [80, 'OUTER PARTY', 'Adequate. Adequacy is noted.'],
    [-1e9, 'UNDER REVIEW', 'Someone from the Ministry of Love would like a word. There is no hurry.'],
  ];
  const r = ranks.find(([m]) => score >= m)!;
  return { score, title: r[1], line: r[2], avgThink };
}
