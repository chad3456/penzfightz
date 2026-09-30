import { BLOCK, COLS, D, DISTRICTS, DISTRICT_BY_ID, ROAD, ROWS, W, blockCenter, blockOf, buildCity, districtOfPoint, isOpen, node, solidBlocks, type Building, type DistrictId } from './city';

/**
 * UPROAR — the rules.
 *
 * You are a voice with a megaphone. Walk the streets and chant, and the
 * people you pass fall in behind you; throw street parties, paint murals,
 * bounce giant beach balls over the crowd, blow clouds of colour, and jam
 * the traffic until the whole city is talking. Hold a district's plaza with
 * enough people and the district is yours. Take five, and march on City Hall.
 *
 * The police do not like it. The more noise, the more heat: patrols, vans,
 * and at the top a water cannon. They pick off stragglers, but a big enough
 * crowd simply outnumbers them — and they are very easily distracted by pizza.
 */

export type Role = 'citizen' | 'follower' | 'police' | 'detained';
export type Ability = 'chant' | 'party' | 'mural' | 'balls' | 'holi' | 'umbrella' | 'pizza';

export interface Agent {
  id: number;
  role: Role;
  x: number; z: number;
  tx: number; tz: number;
  face: number;
  walk: number;
  speed: number;
  hue: number;          // their own colour (citizens), 0..1
  sway: number;         // how close they are to joining
  home: DistrictId;
  dance: number;
  eat: number;
  retreat: number;
  grab: number;
  carry: number;        // police: the id of who they are taking away
  trail: number;        // followers: index into the leader's trail
  ox: number; oz: number;
  holi: number;         // coloured by a holi cloud
  soaked: number;
  word: string;
  wordT: number;
  gone: boolean;
}

export interface AbilityDef { id: Ability; key: string; name: string; cost: number; cool: number; blurb: string }
export const ABILITIES: AbilityDef[] = [
  { id: 'chant', key: 'SPACE', name: 'Chant', cost: 0, cool: 1.8, blurb: 'Your megaphone. Everyone nearby hears it; some of them join.' },
  { id: 'party', key: 'Q', name: 'Sound System', cost: 40, cool: 12, blurb: 'A street party: people dance over, traffic stops, and dancers join.' },
  { id: 'mural', key: 'E', name: 'Mural', cost: 20, cool: 4, blurb: 'Paint the nearest wall. Needs 8 of you. The district warms to you.' },
  { id: 'balls', key: 'R', name: 'Beach Balls', cost: 30, cool: 8, blurb: 'Giant beach balls over the crowd. Pure joy; police chase them.' },
  { id: 'holi', key: 'F', name: 'Colour Cloud', cost: 20, cool: 8, blurb: 'A cloud of colour: the police lose sight of you, and bystanders get swept up.' },
  { id: 'umbrella', key: 'G', name: 'Umbrellas', cost: 20, cool: 10, blurb: 'A thousand umbrellas. The water cannon becomes a parade.' },
  { id: 'pizza', key: 'C', name: 'Pizza', cost: 15, cool: 6, blurb: 'Drop pizza. Officers nearby stop for a slice.' },
];
export const ABILITY_BY_ID = Object.fromEntries(ABILITIES.map((a) => [a.id, a])) as Record<Ability, AbilityDef>;

export interface Car { id: number; axis: 'x' | 'z'; line: number; dir: 1 | -1; pos: number; speed: number; stuck: number; color: number; honk: number }
export interface Spot { id: number; x: number; z: number; t: number; life: number }
export interface Mural { id: number; b: number; x: number; z: number; nx: number; nz: number; y: number; style: number; t: number }
export interface Wave { id: number; x: number; z: number; r: number; t: number }
export interface Pop { id: number; x: number; z: number; text: string; kind: 'good' | 'bad' | 'info' | 'big'; t: number }
export interface Cannon { x: number; z: number; face: number; spray: number; cool: number; alive: boolean; leaving: boolean }
export interface DistrictState { id: DistrictId; loyalty: number; occupy: number; captured: boolean }

export interface Sim {
  t: number;
  hour: number;
  agents: Agent[];
  leader: { x: number; z: number; tx: number | null; tz: number | null; face: number; walk: number; lives: number; caught: number; safe: number; home: [number, number] };
  trail: { x: number; z: number }[];
  buzz: number;
  heat: number;
  chaos: number;
  chaosRate: number;
  trending: number;
  cool: Record<Ability, number>;
  districts: Record<DistrictId, DistrictState>;
  parties: Spot[];
  holis: Spot[];
  pizzas: Spot[];
  murals: Mural[];
  waves: Wave[];
  pops: Pop[];
  fireworks: { x: number; z: number; t: number }[];
  ballRequests: number;
  balls: { x: number; y: number; z: number }[];
  umbrellas: number;
  cannon: Cannon;
  cars: Car[];
  buildings: Building[];
  nextId: number;
  over: null | 'won' | 'lost';
  stats: { maxCrowd: number; detained: number; murals: number; parties: number; balls: number; captured: number; honks: number; overwhelmed: number };
  quiet: number;          // seconds since you last did anything; a bored crowd drifts home
  step: number;           // the tutorial's objective index
  moved: number;
  spawnT: number;
  chopper: number;        // news helicopter, 0..1 presence
  lastEvent: string;
}

const RNG = (() => { let s = 777; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); })();
const R = RNG;
const pick = <T,>(a: T[]) => a[Math.floor(R() * a.length)]!;

export const SLOGANS = ['LOUDER!', 'WHOSE STREETS? OUR STREETS!', 'PARKS NOT PARKING!', 'FREE BUSES!', 'LET US DANCE!', 'LONGER LUNCH!', 'MORE BENCHES!', 'FIX THE CLOCK!', 'BIKES! BIKES!', 'HEY HEY! HO HO!', 'RENT TOO HIGH!', 'TREES PLEASE!'];
const CURIOUS = ['what\'s going on?', 'is that a party?', 'ooh', 'hm?', 'wait for me!', 'I\'m in', 'fair point, actually'];
const COPS = ['move along', 'disperse!', 'nothing to see', 'oi!', 'this is a road'];
const SOAKED = ['I\'m soaked', 'going home', 'brrr'];
const BORED = ['bit quiet now', 'I\'ve got work', 'is that it?', 'going for a sandwich', 'yawn'];

/* ───────────── the street graph ───────────── */
const NX = COLS + 1, NZ = ROWS + 1;
const nodeId = (i: number, j: number) => j * NX + i;
function nearestNode(x: number, z: number): [number, number] {
  const i = Math.max(0, Math.min(COLS, Math.round((x + W / 2 - ROAD / 2) / (BLOCK + ROAD))));
  const j = Math.max(0, Math.min(ROWS, Math.round((z + D / 2 - ROAD / 2) / (BLOCK + ROAD))));
  return [i, j];
}
function neighbours(i: number, j: number) {
  const out: [number, number][] = [];
  if (i > 0) out.push([i - 1, j]); if (i < COLS) out.push([i + 1, j]);
  if (j > 0) out.push([i, j - 1]); if (j < ROWS) out.push([i, j + 1]);
  return out;
}
/** The next street corner on the way from a to b (breadth first over the grid). */
function nextNodeToward(a: [number, number], b: [number, number]): [number, number] {
  if (a[0] === b[0] && a[1] === b[1]) return a;
  const prev = new Int16Array(NX * NZ).fill(-1);
  const q = [nodeId(...b)];
  prev[q[0]!] = q[0]!;
  while (q.length) {
    const n = q.shift()!;
    const i = n % NX, j = Math.floor(n / NX);
    for (const [a2, b2] of neighbours(i, j)) {
      const m = nodeId(a2, b2);
      if (prev[m] !== -1) continue;
      prev[m] = n;
      if (a2 === a[0] && b2 === a[1]) return [i, j];
      q.push(m);
    }
  }
  return b;
}

/* ───────────── walls ───────────── */
const SOLIDS = solidBlocks();
function solidAt(x: number, z: number) {
  for (const s of SOLIDS) if (x > s.x0 && x < s.x1 && z > s.z0 && z < s.z1) return s;
  return null;
}
function pushOut(a: { x: number; z: number }) {
  const s = solidAt(a.x, a.z);
  if (s) {
    const dl = a.x - s.x0, dr = s.x1 - a.x, dt = a.z - s.z0, db = s.z1 - a.z;
    const m = Math.min(dl, dr, dt, db);
    if (m === dl) a.x = s.x0 - 0.01; else if (m === dr) a.x = s.x1 + 0.01; else if (m === dt) a.z = s.z0 - 0.01; else a.z = s.z1 + 0.01;
  }
  a.x = Math.max(-W / 2 + 1, Math.min(W / 2 - 1, a.x));
  a.z = Math.max(-D / 2 + 1, Math.min(D / 2 - 1, a.z));
}
function clearLine(x0: number, z0: number, x1: number, z1: number) {
  const n = Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 2);
  for (let k = 1; k < n; k++) { const t = k / n; if (solidAt(x0 + (x1 - x0) * t, z0 + (z1 - z0) * t)) return false; }
  return true;
}

/* ───────────── a grid for neighbours ───────────── */
const CS = 4;
class Hash {
  cells = new Map<number, Agent[]>();
  key(x: number, z: number) { return (Math.floor(x / CS) + 500) * 1000 + (Math.floor(z / CS) + 500); }
  build(as: Agent[]) { this.cells.clear(); for (const a of as) { if (a.gone) continue; const k = this.key(a.x, a.z); let c = this.cells.get(k); if (!c) { c = []; this.cells.set(k, c); } c.push(a); } }
  near(x: number, z: number, r: number, f: (a: Agent, d: number) => void) {
    const c0 = Math.floor((x - r) / CS), c1 = Math.floor((x + r) / CS), r0 = Math.floor((z - r) / CS), r1 = Math.floor((z + r) / CS);
    for (let i = c0; i <= c1; i++) for (let j = r0; j <= r1; j++) {
      const cell = this.cells.get((i + 500) * 1000 + (j + 500));
      if (!cell) continue;
      for (const a of cell) { const d = Math.hypot(a.x - x, a.z - z); if (d <= r) f(a, d); }
    }
  }
}
export const hash = new Hash();

/* ───────────── making the world ───────────── */

function newAgent(s: Sim, role: Role, x: number, z: number): Agent {
  const a: Agent = {
    id: s.nextId++, role, x, z, tx: x, tz: z, face: R() * 6, walk: R() * 6, speed: role === 'police' ? 4.2 : 2.2 + R() * 1.2, hue: R(), sway: R() * 0.25,
    home: districtOfPoint(x, z), dance: 0, eat: 0, retreat: 0, grab: 0, carry: -1, trail: 0, ox: (R() - 0.5) * 4, oz: (R() - 0.5) * 4, holi: 0, soaked: 0, word: '', wordT: 0, gone: false,
  };
  s.agents.push(a);
  return a;
}

function wander(a: Agent) {
  // at a corner: along a street, or into an open plaza now and then
  const [i, j] = nearestNode(a.x, a.z);
  const bl = blockOf(a.x, a.z);
  if (bl && isOpen(bl[0], bl[1])) { const [nx, nz] = node(i, j); a.tx = nx + (R() - 0.5) * 3; a.tz = nz + (R() - 0.5) * 3; return; }
  const opens: [number, number][] = [];
  for (const [dc, dr] of [[0, 0], [-1, 0], [0, -1], [-1, -1]]) { const c = i + dc!, r = j + dr!; if (c >= 0 && r >= 0 && c < COLS && r < ROWS && isOpen(c, r)) opens.push([c, r]); }
  if (opens.length && R() < 0.35) { const [c, r] = pick(opens); const [cx, cz] = blockCenter(c, r); a.tx = cx + (R() - 0.5) * (BLOCK - 4); a.tz = cz + (R() - 0.5) * (BLOCK - 4); return; }
  const [ni, nj] = pick(neighbours(i, j));
  const [nx, nz] = node(ni, nj);
  const lateral = (R() < 0.5 ? -1 : 1) * (ROAD / 2 - 0.6 - R() * 0.8);
  if (ni !== i) { a.tx = nx; a.tz = nz + lateral; } else { a.tx = nx + lateral; a.tz = nz; }
}

export function createSim(): Sim {
  const { buildings } = buildCity();
  const s: Sim = {
    t: 0, hour: 10, agents: [], leader: { x: 0, z: 0, tx: null, tz: null, face: 0, walk: 0, lives: 3, caught: 0, safe: 0, home: [0, 0] }, trail: [],
    buzz: 40, heat: 0, chaos: 0, chaosRate: 0, trending: 0,
    cool: { chant: 0, party: 0, mural: 0, balls: 0, holi: 0, umbrella: 0, pizza: 0 },
    districts: Object.fromEntries(DISTRICTS.map((d) => [d.id, { id: d.id, loyalty: 0, occupy: 0, captured: false }])) as Record<DistrictId, DistrictState>,
    parties: [], holis: [], pizzas: [], murals: [], waves: [], pops: [], fireworks: [], ballRequests: 0, balls: [], umbrellas: 0,
    cannon: { x: 0, z: 0, face: 0, spray: 0, cool: 0, alive: false, leaving: false },
    cars: [], buildings, nextId: 1, over: null,
    stats: { maxCrowd: 0, detained: 0, murals: 0, parties: 0, balls: 0, captured: 0, honks: 0, overwhelmed: 0 },
    quiet: 0, step: 0, moved: 0, spawnT: 0, chopper: 0, lastEvent: '',
  };
  // the leader starts on the edge of Old Town
  const [sx, sz] = node(1, 2);
  s.leader.x = sx; s.leader.z = sz; s.leader.home = [sx, sz];
  s.trail.push({ x: sx, z: sz });
  // citizens: more of them in busier districts
  for (let k = 0; k < 720; k++) {
    const i = Math.floor(R() * NX), j = Math.floor(R() * NZ);
    const [nx, nz] = node(i, j);
    const a = newAgent(s, 'citizen', nx + (R() - 0.5) * 6, nz + (R() - 0.5) * 6);
    pushOut(a);
    wander(a);
  }
  // traffic
  for (let k = 0; k < 44; k++) {
    const axis = R() < 0.55 ? 'x' : 'z';
    const line = Math.floor(R() * (axis === 'x' ? NZ : NX));
    const len = axis === 'x' ? W : D;
    s.cars.push({ id: s.nextId++, axis, line, dir: R() < 0.5 ? 1 : -1, pos: (R() - 0.5) * len, speed: 7 + R() * 4, stuck: 0, color: Math.floor(R() * 6), honk: 0 });
  }
  return s;
}

export function pop(s: Sim, x: number, z: number, text: string, kind: Pop['kind'] = 'info') {
  s.pops.push({ id: s.nextId++, x, z, text, kind, t: 0 });
  if (s.pops.length > 24) s.pops.shift();
}
const say = (a: Agent, w: string, t = 2.5) => { a.word = w; a.wordT = t; };

export const followers = (s: Sim) => s.agents.filter((a) => a.role === 'follower' && !a.gone);
export const crowdSize = (s: Sim) => { let n = 0; for (const a of s.agents) if (a.role === 'follower' && !a.gone) n++; return n; };
export const stars = (s: Sim) => Math.min(5, Math.ceil(s.heat - 0.05));

function join(s: Sim, a: Agent) {
  if (a.role !== 'citizen') return;
  a.role = 'follower';
  a.sway = 1; a.dance = 0;
  // join the trail near where they are
  let best = 0, bd = 1e9;
  for (let k = Math.max(0, s.trail.length - 40); k < s.trail.length; k++) { const p = s.trail[k]!; const d = Math.hypot(p.x - a.x, p.z - a.z); if (d < bd) { bd = d; best = k; } }
  a.trail = best;
  if (R() < 0.3) say(a, pick(CURIOUS), 2);
}

function leave(s: Sim, a: Agent, why: 'soaked' | 'scatter') {
  a.role = 'citizen'; a.sway = 0.2; a.soaked = why === 'soaked' ? 6 : 0;
  if (why === 'soaked') say(a, pick(SOAKED), 2);
  wander(a);
  void s;
}

/* ───────────── what you can do ───────────── */

export function act(s: Sim, id: Ability): string | null {
  const def = ABILITY_BY_ID[id];
  if (s.cool[id] > 0) return null;
  if (s.buzz < def.cost) return 'Not enough buzz. Make some noise first.';
  const L = s.leader;
  const n = crowdSize(s);
  if (id === 'mural') {
    let near = 0; hash.near(L.x, L.z, 9, (a) => { if (a.role === 'follower') near++; });
    if (near < 8) return 'You need 8 people with you to paint a mural.';
    const b = nearestWall(s, L.x, L.z);
    if (!b) return 'Stand next to a wall.';
    s.murals.push({ id: s.nextId++, b: b.b.id, x: b.x, z: b.z, nx: b.nx, nz: b.nz, y: Math.min(b.b.h * 0.45, 5), style: s.murals.length, t: 0 });
    s.districts[b.b.district].loyalty = Math.min(1, s.districts[b.b.district].loyalty + 0.08);
    s.stats.murals++;
    addChaos(s, 20); s.heat += 0.25;
    pop(s, b.x, b.z, 'MURAL!', 'good');
  }
  s.buzz -= def.cost;
  s.cool[id] = def.cool;
  s.quiet = 0;
  switch (id) {
    case 'chant': {
      const r = 6 + Math.sqrt(n) * 0.45;
      s.waves.push({ id: s.nextId++, x: L.x, z: L.z, r, t: 0 });
      let joined = 0;
      const loyal = s.districts[districtOfPoint(L.x, L.z)].loyalty;
      hash.near(L.x, L.z, r, (a) => {
        if (a.role !== 'citizen' || a.soaked > 0) return;
        a.sway += 0.08 + loyal * 0.12 + s.trending * 0.06 + a.holi * 0.25;
        if (a.sway >= 1 || R() < 0.015 * (1 + s.trending * 0.5)) { join(s, a); joined++; }
        else if (R() < 0.2) say(a, pick(CURIOUS), 1.6);
      });
      for (const f of followers(s)) if (R() < 0.08) say(f, pick(SLOGANS), 1.8);
      s.heat += 0.02 + n * 0.0006;
      if (joined) pop(s, L.x, L.z, `+${joined}`, 'good');
      addChaos(s, 1 + joined);
      break;
    }
    case 'party': s.parties.push({ id: s.nextId++, x: L.x, z: L.z, t: 0, life: 18 }); s.stats.parties++; s.heat += 0.5; addChaos(s, 15); pop(s, L.x, L.z, 'STREET PARTY!', 'big'); break;
    case 'balls': s.ballRequests += 3; s.stats.balls += 3; addChaos(s, 12); s.heat += 0.15; pop(s, L.x, L.z, 'BEACH BALLS!', 'big'); break;
    case 'holi': s.holis.push({ id: s.nextId++, x: L.x, z: L.z, t: 0, life: 9 }); addChaos(s, 14); hash.near(L.x, L.z, 11, (a) => { if (a.role === 'citizen') { a.holi = 1; a.sway += 0.45; } else if (a.role === 'follower') a.holi = 1; }); pop(s, L.x, L.z, 'COLOUR!', 'big'); break;
    case 'umbrella': s.umbrellas = 12; pop(s, L.x, L.z, 'UMBRELLAS UP!', 'big'); addChaos(s, 6); break;
    case 'pizza': s.pizzas.push({ id: s.nextId++, x: L.x, z: L.z, t: 0, life: 14 }); pop(s, L.x, L.z, 'PIZZA!', 'big'); break;
    default: break;
  }
  return null;
}

function addChaos(s: Sim, k: number) { s.chaos += k; s.chaosRate += k; }

/** The wall nearest the leader: which building, where, and which way it faces. */
export function nearestWall(s: Sim, x: number, z: number) {
  let best: { b: Building; x: number; z: number; nx: number; nz: number } | null = null, bd = 7;
  for (const b of s.buildings) {
    if (s.murals.some((m) => m.b === b.id)) continue;
    const faces: [number, number, number, number][] = [[b.x, b.z - b.d / 2, 0, -1], [b.x, b.z + b.d / 2, 0, 1], [b.x - b.w / 2, b.z, -1, 0], [b.x + b.w / 2, b.z, 1, 0]];
    for (const [fx, fz, nx, nz] of faces) {
      const d = Math.hypot(fx - x, fz - z);
      if (d < bd && (x - fx) * nx + (z - fz) * nz > 0) { bd = d; best = { b, x: fx + nx * 0.06, z: fz + nz * 0.06, nx, nz }; }
    }
  }
  return best;
}

/* ───────────── the world, one step ───────────── */

export interface Input { mx: number; mz: number }

export function step(s: Sim, dt: number, input: Input) {
  if (s.over) return;
  s.t += dt;
  s.hour = Math.min(26, s.hour + dt / 50);
  for (const k of Object.keys(s.cool) as Ability[]) s.cool[k] = Math.max(0, s.cool[k] - dt);
  hash.build(s.agents);
  const L = s.leader;
  const n = crowdSize(s);
  s.stats.maxCrowd = Math.max(s.stats.maxCrowd, n);
  s.quiet += dt;
  const bored = s.parties.length ? 0 : Math.min(3, Math.max(0, (s.quiet - 10) / 8));

  // the leader
  let mx = input.mx, mz = input.mz;
  if (Math.hypot(mx, mz) > 0.05) { L.tx = null; L.tz = null; }
  else if (L.tx !== null && L.tz !== null) {
    const dx = L.tx - L.x, dz = L.tz - L.z, d = Math.hypot(dx, dz);
    if (d < 0.5) { L.tx = null; L.tz = null; } else { mx = dx / d; mz = dz / d; }
  }
  const ml = Math.hypot(mx, mz);
  if (ml > 0.05) {
    const sp = 5.4 * dt;
    const px = L.x, pz = L.z;
    L.x += (mx / Math.max(1, ml)) * sp; L.z += (mz / Math.max(1, ml)) * sp;
    pushOut(L);
    // stuck on a corner while walking to a target: step round it
    if (L.tx !== null && Math.hypot(L.x - px, L.z - pz) < sp * 0.2) { const [i, j] = nearestNode(L.x, L.z); const [nx, nz] = node(...nextNodeToward([i, j], nearestNode(L.tx, L.tz!))); L.x += Math.sign(nx - L.x) * sp * 0.7; L.z += Math.sign(nz - L.z) * sp * 0.7; pushOut(L); }
    L.face = Math.atan2(mx, mz); L.walk += dt * 11;
    s.moved += sp;
    const last = s.trail[s.trail.length - 1]!;
    if (Math.hypot(last.x - L.x, last.z - L.z) > 1.6) { s.trail.push({ x: L.x, z: L.z }); if (s.trail.length > 400) { s.trail.splice(0, 100); for (const a of s.agents) a.trail = Math.max(0, a.trail - 100); } }
  }
  L.safe = Math.max(0, L.safe - dt);

  // buzz comes back with the size of the crowd and the noise it makes
  s.buzz = Math.min(100, s.buzz + dt * (1.4 + Math.sqrt(n) * 0.12 + s.trending * 1.5));
  s.chaosRate *= Math.pow(0.5, dt);
  s.trending = Math.max(0, Math.min(1, s.trending + (s.chaosRate * 0.0022 + n * 0.00005) * dt - s.trending * 0.03 * dt));
  s.chopper += ((s.trending > 0.3 || n > 60 ? 1 : 0) - s.chopper) * dt * 0.3;
  s.umbrellas = Math.max(0, s.umbrellas - dt);
  for (const arr of [s.parties, s.holis, s.pizzas]) for (const p of arr) p.t += dt;
  s.parties = s.parties.filter((p) => p.t < p.life);
  s.holis = s.holis.filter((p) => p.t < p.life);
  s.pizzas = s.pizzas.filter((p) => p.t < p.life);
  for (const w of s.waves) w.t += dt;
  s.waves = s.waves.filter((w) => w.t < 1.2);
  for (const p of s.pops) p.t += dt;
  s.pops = s.pops.filter((p) => p.t < 2.2);
  for (const f of s.fireworks) f.t += dt;
  s.fireworks = s.fireworks.filter((f) => f.t < 4);
  for (const m of s.murals) m.t += dt;

  const hidden = (x: number, z: number) => s.holis.some((h) => Math.hypot(h.x - x, h.z - z) < 11);

  // everyone
  let dancing = 0;
  let seen = 0;
  for (const a of s.agents) {
    if (a.gone) continue;
    a.wordT -= dt;
    a.holi = Math.max(0, a.holi - dt * 0.05);
    a.soaked = Math.max(0, a.soaked - dt);
    if (a.role === 'citizen') {
      // a party pulls people in, and they dance
      let party = null as Spot | null;
      for (const p of s.parties) if (Math.hypot(p.x - a.x, p.z - a.z) < 17) { party = p; break; }
      if (party) {
        const d = Math.hypot(party.x - a.x, party.z - a.z);
        if (d > 4 + (a.id % 5)) { a.tx = party.x + a.ox; a.tz = party.z + a.oz; } else { a.dance = 1; dancing++; a.sway += dt * 0.03; }
      } else { a.dance = Math.max(0, a.dance - dt); a.sway = Math.max(0, a.sway - dt * 0.02); }
      // peer pressure: a crowd going past is hard to ignore
      let pull = 0;
      hash.near(a.x, a.z, 2.8, (o) => { if (o.role === 'follower') pull++; });
      if (pull >= 3) a.sway += dt * 0.005 * Math.min(4, pull / 3) * (1 + s.districts[a.home].loyalty + s.trending);
      if (s.districts[districtOfPoint(a.x, a.z)].captured) a.sway += dt * 0.006;
      if (a.sway >= 1 && Math.hypot(a.x - L.x, a.z - L.z) < 30) join(s, a);
      move(a, dt, a.dance > 0 ? 0 : 1);
      if (Math.hypot(a.tx - a.x, a.tz - a.z) < 0.4 && a.dance <= 0) wander(a);
    } else if (a.role === 'follower') {
      // follow the leader's trail, spread out a little, stop and dance at a party
      const tip = s.trail.length - 1;
      const target = s.trail[Math.min(tip, a.trail)]!;
      const d = Math.hypot(target.x + a.ox * 0.4 - a.x, target.z + a.oz * 0.4 - a.z);
      if (d < 2.4 && a.trail < tip) a.trail++;
      const atTip = a.trail >= tip;
      const lead = Math.hypot(L.x - a.x, L.z - a.z);
      if (atTip) { a.tx = L.x + a.ox * (1 + Math.sqrt(n) * 0.18); a.tz = L.z + a.oz * (1 + Math.sqrt(n) * 0.18); }
      else { a.tx = target.x + a.ox * 0.4; a.tz = target.z + a.oz * 0.4; }
      // lost the trail entirely (after a capture, say): walk straight back
      if (lead > 60 && a.trail < tip - 30) a.trail = tip - 10;
      // keep a little space
      let sx = 0, sz = 0;
      hash.near(a.x, a.z, 0.9, (o) => { if (o !== a) { sx += a.x - o.x; sz += a.z - o.z; } });
      a.x += sx * dt * 1.5; a.z += sz * dt * 1.5;
      const fast = Math.min(1.9, 1 + Math.max(0, lead - 8) * 0.05);
      move(a, dt, a.tx === L.x ? 1 : fast, 0.7);
      if (!hidden(a.x, a.z)) seen++;
      if (bored > 0 && R() < dt * 0.012 * bored) { say(a, pick(BORED), 1.8); leave(s, a, 'scatter'); continue; }
      if (lead > 50 && R() < dt * 0.05) { leave(s, a, 'scatter'); continue; }
      if (R() < dt * 0.001 * (1 + n / 150)) { leave(s, a, 'scatter'); continue; }
    } else if (a.role === 'police') policeStep(s, a, dt, hidden);
    else if (a.role === 'detained') {
      const cop = s.agents.find((o) => o.id === a.carry && !o.gone);
      if (!cop) { a.gone = true; continue; }
      a.x = cop.x + 0.6; a.z = cop.z + 0.3;
    }
  }
  addChaos(s, dancing * 0.05 * dt);

  // traffic
  for (const c of s.cars) {
    const [cx, cz] = carPos(c);
    const ax = c.axis === 'x' ? c.dir : 0, az = c.axis === 'z' ? c.dir : 0;
    let blocked = false;
    hash.near(cx + ax * 3.5, cz + az * 3.5, 2.6, () => { blocked = true; });
    if (!blocked) for (const o of s.cars) if (o !== c && o.axis === c.axis && o.line === c.line && o.dir === c.dir) { const gap = (o.pos - c.pos) * c.dir; if (gap > 0 && gap < 6) { blocked = true; break; } }
    if (s.parties.some((p) => Math.hypot(p.x - cx, p.z - cz) < 20)) blocked = true;
    if (blocked) {
      c.stuck += dt;
      if (c.stuck > 2.5 && c.honk <= 0 && R() < dt * 0.6) { c.honk = 1.2; s.stats.honks++; addChaos(s, 1.5); }
    } else { c.stuck = 0; c.pos += c.dir * c.speed * dt; }
    c.honk = Math.max(0, c.honk - dt);
    const len = (c.axis === 'x' ? W : D) / 2 + 12;
    if (c.pos > len) c.pos = -len; if (c.pos < -len) c.pos = len;
  }

  // heat: noise seen by the police
  let copsNear = 0;
  for (const a of s.agents) if (a.role === 'police' && !a.gone && Math.hypot(a.x - L.x, a.z - L.z) < 30) copsNear++;
  s.heat += (copsNear > 0 ? seen * 0.00025 : 0) * dt + n * 0.0001 * dt;
  s.heat -= dt * (0.035 + (seen < n * 0.4 ? 0.12 : 0) + (n < 10 ? 0.06 : 0));
  s.heat = Math.max(0, Math.min(5.2, s.heat));
  spawnPolice(s, dt);
  cannonStep(s, dt);

  // plazas
  for (const dd of DISTRICTS) {
    const st = s.districts[dd.id];
    if (st.captured) continue;
    if (dd.id === 'hall' && DISTRICTS.filter((x) => x.id !== 'hall' && s.districts[x.id].captured).length < 5) continue;
    const [cx, cz] = blockCenter(dd.plaza[0], dd.plaza[1]);
    const inPlaza = (x: number, z: number) => Math.abs(x - cx) < BLOCK / 2 + 1 && Math.abs(z - cz) < BLOCK / 2 + 1;
    let fin = 0, pin = 0;
    for (const a of s.agents) { if (a.gone) continue; if (a.role === 'follower' && inPlaza(a.x, a.z)) fin++; else if (a.role === 'police' && inPlaza(a.x, a.z) && a.eat <= 0) pin++; }
    const leaderIn = inPlaza(L.x, L.z);
    if (leaderIn && fin >= dd.need * 0.5 && pin <= fin / 4) {
      st.occupy += dt * Math.min(1.5, fin / dd.need) * (0.035 + st.loyalty * 0.04) * (dd.id === 'hall' ? 0.6 : 1);
      // somebody has called it in: the police come to clear the square
      s.heat += dt * (dd.id === 'hall' ? 0.14 : 0.07);
    }
    else st.occupy = Math.max(0, st.occupy - dt * (pin > fin / 4 ? 0.06 : 0.015));
    if (st.occupy >= 1) capture(s, dd.id, cx, cz);
  }

  // being caught
  let grabbing = 0;
  for (const a of s.agents) if (a.role === 'police' && !a.gone && a.eat <= 0 && a.retreat <= 0 && Math.hypot(a.x - L.x, a.z - L.z) < 1.4) grabbing++;
  let guard = 0; hash.near(L.x, L.z, 5, (a) => { if (a.role === 'follower') guard++; });
  if (grabbing > 0 && guard < 5 && L.safe <= 0) { L.caught += dt; if (L.caught > 1.1) caught(s); } else L.caught = Math.max(0, L.caught - dt);
  tutorial(s);
}

function move(a: Agent, dt: number, k: number, stop = 0.3) {
  const dx = a.tx - a.x, dz = a.tz - a.z, l = Math.hypot(dx, dz);
  if (l < stop || k <= 0) return;
  const sp = Math.min(l, a.speed * k * dt);
  a.x += (dx / l) * sp; a.z += (dz / l) * sp;
  a.face = Math.atan2(dx, dz); a.walk += dt * 9 * a.speed * k * 0.5;
  if (a.role !== 'citizen') pushOut(a);
}

export function carPos(c: Car): [number, number] {
  if (c.axis === 'x') { const [, z] = node(0, c.line); return [c.pos, z + c.dir * 1.8]; }
  const [x] = node(c.line, 0); return [x - c.dir * 1.8, c.pos];
}

/* ───────────── the police ───────────── */

function spawnPolice(s: Sim, dt: number) {
  const want = Math.min(48, Math.floor(s.heat * 8.5));
  const cops = s.agents.filter((a) => a.role === 'police' && !a.gone);
  s.spawnT -= dt;
  if (cops.length < want && s.spawnT <= 0) {
    s.spawnT = 1.1;
    // from the edge of the city, on the side nearest the crowd
    const L = s.leader;
    const [i, j] = nearestNode(L.x, L.z);
    const edges: [number, number][] = [[0, j], [COLS, j], [i, 0], [i, ROWS]];
    const [ei, ej] = edges.reduce((a, b) => (Math.hypot(node(...a)[0] - L.x, node(...a)[1] - L.z) < Math.hypot(node(...b)[0] - L.x, node(...b)[1] - L.z) ? a : b));
    const [x, z] = node(ei, ej);
    for (let k = 0; k < 2; k++) { const c = newAgent(s, 'police', x + (R() - 0.5) * 2, z + (R() - 0.5) * 2); c.tx = x; c.tz = z; }
    if (cops.length === 0) { pop(s, x, z, 'POLICE!', 'bad'); s.lastEvent = 'police'; }
  }
  // too many for the heat: some go home
  if (cops.length > want + 4) { const c = cops[cops.length - 1]!; c.retreat = 99; }
}

function policeStep(s: Sim, a: Agent, dt: number, hidden: (x: number, z: number) => boolean) {
  const L = s.leader;
  // pizza
  if (a.eat > 0) { a.eat -= dt; if (a.eat <= 0 && R() < 0.5) say(a, 'right, where was I', 1.5); return; }
  for (const p of s.pizzas) if (Math.hypot(p.x - a.x, p.z - a.z) < 12 && a.carry < 0) {
    a.tx = p.x + a.ox * 0.4; a.tz = p.z + a.oz * 0.4; move(a, dt, 1.1);
    if (Math.hypot(p.x - a.x, p.z - a.z) < 2.5) { a.eat = 10; say(a, pick(['ooh, pizza', 'is that pepperoni?', 'five minutes']), 2); }
    return;
  }
  // outnumbered: back off to the van
  if (a.retreat > 0) {
    a.retreat -= dt;
    const [ex, ez] = node(...nearestEdge(a.x, a.z));
    a.tx = ex; a.tz = ez; move(a, dt, 1.2);
    if (Math.hypot(ex - a.x, ez - a.z) < 2) { a.gone = true; if (a.carry >= 0) { const d = s.agents.find((o) => o.id === a.carry); if (d) { d.gone = true; s.stats.detained++; } } }
    return;
  }
  // carrying someone off
  if (a.carry >= 0) { a.retreat = 30; return; }
  // the crowd pushes back
  let around = 0; hash.near(a.x, a.z, 3, (o) => { if (o.role === 'follower') around++; });
  if (around >= 9 + stars(s)) { a.retreat = 6; say(a, pick(['too many!', 'fall back!', 'not paid enough']), 2); s.stats.overwhelmed++; addChaos(s, 4); pop(s, a.x, a.z, 'OUTNUMBERED', 'good'); return; }
  // chase: a beach ball first (they cannot help it), else the nearest visible marcher
  let tx = L.x, tz = L.z, best = 1e9, target: Agent | null = null;
  for (const b of s.balls) { const d = Math.hypot(b.x - a.x, b.z - a.z); if (d < 10 && d < best) { best = d; tx = b.x; tz = b.z; } }
  if (best > 1e8) {
    hash.near(a.x, a.z, 26, (o, d) => { if (o.role === 'follower' && !hidden(o.x, o.z) && d < best) { best = d; target = o; } });
    if (target) { tx = (target as Agent).x; tz = (target as Agent).z; }
    else if (hidden(L.x, L.z)) { tx = a.x + (R() - 0.5) * 6; tz = a.z + (R() - 0.5) * 6; }
  }
  if (clearLine(a.x, a.z, tx, tz) || Math.hypot(tx - a.x, tz - a.z) < 6) { a.tx = tx; a.tz = tz; }
  else { const nn = nextNodeToward(nearestNode(a.x, a.z), nearestNode(tx, tz)); const [nx, nz] = node(...nn); a.tx = nx + a.ox * 0.3; a.tz = nz + a.oz * 0.3; }
  move(a, dt, 1, 0.8);
  if (a.wordT < -8 && R() < dt * 0.2) say(a, pick(COPS), 1.6);
  // an arrest: a straggler, alone
  const t = target as Agent | null;
  if (t && best < 1.1) {
    let friends = 0; hash.near(t.x, t.z, 2.5, (o) => { if (o.role === 'follower') friends++; });
    if (friends < 5) { a.grab += dt; if (a.grab > 0.9) { t.role = 'detained'; t.carry = a.id; a.carry = t.id; a.grab = 0; pop(s, t.x, t.z, 'DETAINED', 'bad'); } }
  } else a.grab = 0;
}

function nearestEdge(x: number, z: number): [number, number] {
  const [i, j] = nearestNode(x, z);
  const opts: [number, number][] = [[0, j], [COLS, j], [i, 0], [i, ROWS]];
  return opts.reduce((a, b) => (Math.hypot(node(...a)[0] - x, node(...a)[1] - z) < Math.hypot(node(...b)[0] - x, node(...b)[1] - z) ? a : b));
}

function cannonStep(s: Sim, dt: number) {
  const c = s.cannon;
  const L = s.leader;
  if (!c.alive && s.heat >= 3.6) {
    const [x, z] = node(...nearestEdge(L.x, L.z));
    Object.assign(c, { x, z, alive: true, leaving: false, spray: 0, cool: 3 });
    pop(s, x, z, 'WATER CANNON!', 'bad'); s.lastEvent = 'cannon';
  }
  if (!c.alive) return;
  if (s.heat < 2.6) c.leaving = true;
  const target = c.leaving ? node(...nearestEdge(c.x, c.z)) : [L.x, L.z] as [number, number];
  const d = Math.hypot(target[0] - c.x, target[1] - c.z);
  if (c.leaving && d < 2) { c.alive = false; return; }
  if (d > 13 || c.leaving) {
    const nn = clearLine(c.x, c.z, target[0], target[1]) ? target : node(...nextNodeToward(nearestNode(c.x, c.z), nearestNode(target[0], target[1])));
    const dx = nn[0] - c.x, dz = nn[1] - c.z, l = Math.hypot(dx, dz) || 1;
    c.x += (dx / l) * 5 * dt; c.z += (dz / l) * 5 * dt; c.face = Math.atan2(dx, dz);
  } else c.face = Math.atan2(L.x - c.x, L.z - c.z);
  c.cool -= dt;
  if (c.cool <= 0 && d < 16 && !c.leaving) { c.spray = 3.5; c.cool = 8; }
  if (c.spray > 0) {
    c.spray -= dt;
    const fx = Math.sin(c.face), fz = Math.cos(c.face);
    for (const a of s.agents) {
      if (a.role !== 'follower' || a.gone) continue;
      const dx = a.x - c.x, dz = a.z - c.z, dd = Math.hypot(dx, dz);
      if (dd > 16 || (dx * fx + dz * fz) / (dd || 1) < 0.86) continue;
      if (s.umbrellas > 0) { if (R() < dt * 0.4) say(a, pick(['la la la', 'nice try', '☂']), 1.2); addChaos(s, dt * 0.3); continue; }
      a.x += fx * dt * 5; a.z += fz * dt * 5; pushOut(a);
      if (R() < dt * 0.35) leave(s, a, 'soaked');
    }
  }
}

/* ───────────── winning, losing ───────────── */

function capture(s: Sim, id: DistrictId, x: number, z: number) {
  const st = s.districts[id];
  st.captured = true; st.occupy = 1; st.loyalty = 1;
  s.stats.captured++;
  s.fireworks.push({ x, z, t: 0 }, { x: x + 6, z: z - 4, t: -0.4 }, { x: x - 6, z: z + 3, t: -0.8 });
  s.buzz = Math.min(100, s.buzz + 40);
  s.trending = Math.min(1, s.trending + 0.25);
  s.hour += 1.5;
  s.heat = Math.max(0, s.heat - 1);
  s.leader.home = [x, z];
  pop(s, x, z, `${DISTRICT_BY_ID[id].name.toUpperCase()} IS OURS!`, 'big');
  s.lastEvent = `captured:${id}`;
  for (const a of s.agents) if (a.role === 'citizen' && a.home === id) { a.sway = Math.max(a.sway, 0.6); if (Math.hypot(a.x - x, a.z - z) < 24 && R() < 0.5) join(s, a); }
  if (id === 'hall') s.over = 'won';
}

function caught(s: Sim) {
  const L = s.leader;
  L.lives--; L.caught = 0; L.safe = 4;
  pop(s, L.x, L.z, 'YOU WERE ARRESTED', 'bad');
  s.lastEvent = 'caught';
  const fs = followers(s);
  fs.forEach((a, i) => { if (i % 2 === 0) leave(s, a, 'scatter'); });
  s.heat = 1;
  for (const a of s.agents) if (a.role === 'police') a.retreat = 20;
  if (L.lives <= 0) { s.over = 'lost'; return; }
  // bailed out: back at the last place that was yours
  L.x = L.home[0]; L.z = L.home[1]; L.tx = null; L.tz = null;
  s.trail.push({ x: L.x, z: L.z });
  for (const a of followers(s)) a.trail = s.trail.length - 1;
  pop(s, L.x, L.z, 'BAILED OUT. AGAIN.', 'info');
}

/* ───────────── the first few minutes, as objectives ───────────── */

export const OBJECTIVES = [
  { title: 'Walk', text: 'Click a street to walk there (or WASD / arrows). On a phone, tap.' },
  { title: 'Make some noise', text: 'Press SPACE (or the Chant button) near people to rally them. Get 10 followers.' },
  { title: 'Throw a party', text: 'Press Q for the Sound System. Dancers join, and traffic stops.' },
  { title: 'Paint the town', text: 'With 8 people beside you, stand by a wall and press E for a mural.' },
  { title: 'Occupy Old Town', text: 'Walk into the Old Town plaza (the clock) with 15 people and hold it.' },
  { title: 'Heat', text: 'Noise brings police. Big crowds outnumber them. Pizza (C) distracts them. Colour (F) hides you.' },
  { title: 'Rule the city', text: 'Take five districts, then march on City Hall with 160 people.' },
];

function tutorial(s: Sim) {
  const n = crowdSize(s);
  const done = [
    s.moved > 14,
    n >= 10,
    s.stats.parties > 0,
    s.stats.murals > 0,
    s.districts.oldtown.captured,
    s.t > 5 && s.agents.some((a) => a.role === 'police'),
    false,
  ];
  while (s.step < OBJECTIVES.length - 1 && done[s.step]) s.step++;
  // skipping ahead in the real world also moves the list on
  if (s.step < 5 && s.stats.captured > 0) s.step = 5;
}

export const hallOpen = (s: Sim) => DISTRICTS.filter((x) => x.id !== 'hall' && s.districts[x.id].captured).length >= 5;
