import type { City } from './city';
import type { Zone } from './buildings';

/**
 * The economy.
 *
 * Small enough to hold in your head, and every term is a ratio of two things
 * the player can see: workers to jobs, shops to shoppers, money in to money
 * out. That is the whole design. A city builder's simulation is not interesting
 * because it is accurate — nobody can check — it is interesting because when
 * the demand bar moves you can say *why*, and then do something about it.
 *
 * The one piece of deliberate scaffolding is the bootstrap term. Every ratio
 * here is undefined at a population of zero, and a purely ratio-driven model
 * sits at the origin forever: no houses because no jobs, no jobs because no
 * workers. So each demand carries a term that starts high and decays with
 * size, which is the founding of a town, and is gone by the time the ratios
 * mean anything.
 */

export interface Stats {
  day: number;
  population: number;
  jobs: number;
  residentCap: number;
  unemployment: number;
  vacancy: number;
  funds: number;
  income: number;
  upkeep: number;
  demand: Record<Zone, number>;
  buildings: number;
  roadKm: number;
  mood: number;
}

/** Seconds of wall clock per simulated day, by speed setting. */
export const SPEEDS = [0, 2.0, 0.9, 0.35];

const ZONES: Zone[] = ['res', 'com', 'ind', 'off', 'park'];
const WORKFORCE = 0.52;
const TAX = 0.09;
/** Money a resident turns over in a day, before tax. */
const TURNOVER = 74;

export class Sim {
  day = 0;
  funds = 55000;
  population = 0;
  speed = 2;

  private acc = 0;
  private income = 0;
  private upkeep = 0;
  private mood = 0.5;
  private demand: Record<Zone, number> = { res: 0.7, com: 0.4, ind: 0.35, off: 0, park: 0 };

  constructor(private city: City) {}

  /** Advance wall-clock time; returns true when a day was simulated. */
  update(dt: number): boolean {
    const per = SPEEDS[this.speed];
    if (!per) return false;
    this.acc += dt;
    if (this.acc < per) return false;
    this.acc = 0;
    this.tick();
    return true;
  }

  private tick() {
    this.day++;
    const b = [...this.city.built.values()];
    let cap = 0;
    let jobs = 0;
    let com = 0;
    let ind = 0;
    let off = 0;
    for (const x of b) {
      cap += x.people;
      jobs += x.jobs;
      if (x.zone === 'com') com += x.jobs;
      else if (x.zone === 'ind') ind += x.jobs;
      else if (x.zone === 'off') off += x.jobs;
    }

    // People arrive to fill housing, at a rate limited by how much of it there
    // is — a city does not double overnight even when it could.
    const room = cap - this.population;
    this.population = Math.max(0, Math.round(this.population + room * 0.11 + Math.sign(room) * Math.min(3, Math.abs(room))));

    const workers = this.population * WORKFORCE;
    const jw = workers > 40 ? jobs / workers : 1;
    const vacancy = cap > 0 ? Math.max(0, 1 - this.population / cap) : 0;
    const young = (n: number) => Math.exp(-this.population / n);

    // The job shares have to add up to the workforce, or the city deadlocks:
    // every use says it has enough, and residential says there is no work, and
    // nothing can move. So the three working uses split exactly WORKFORCE
    // between them, and the office share — which only opens up once the place
    // is big enough to want offices — is taken out of the other two rather
    // than added on top.
    const officeShare = 0.22 * smooth(this.population, 700, 3200);
    const rest = WORKFORCE - officeShare;
    const need = (have: number, want: number, floor: number) => (want - have) / Math.max(floor, want);
    const want: Record<Zone, number> = {
      res: clamp(0.72 * young(1500) + (jw - 0.96) * 0.9 - vacancy * 1.1),
      com: clamp(0.34 * young(1900) + need(com, this.population * rest * 0.42, 55) * 0.9),
      ind: clamp(0.30 * young(1300) + need(ind, this.population * rest * 0.58, 65) * 0.8),
      off: clamp(need(off, this.population * officeShare, 90) * 0.9 * smooth(this.population, 700, 3200)),
      park: 0,
    };
    // Ease towards the target rather than jumping to it. Undamped, the model
    // oscillates: a use goes short, everything built at once overshoots, the
    // whole lot is abandoned, and the bar flips between the rails every tick.
    // A quarter of the way each day also makes the bars readable, which is the
    // only thing they are for.
    for (const z of ZONES) this.demand[z] += (want[z] - this.demand[z]) * 0.25;

    let km = 0;
    for (const s of this.city.roads.segments.values()) {
      const a = this.city.roads.nodes.get(s.a);
      const c = this.city.roads.nodes.get(s.b);
      if (a && c) km += Math.hypot(c.x - a.x, c.z - a.z) / 1000;
    }

    // Income is a flat cut of what the residents turn over. Upkeep is the
    // road network, the buildings connected to it, and the services the people
    // themselves need — which is the term that grows fastest, and is why a
    // city that only ever zones houses eventually goes broke.
    this.income = this.population * TURNOVER * TAX;
    this.upkeep = km * 240 + b.length * 8 + this.population * 4.6;
    this.funds += this.income - this.upkeep;

    // Broke cities stop building and start losing people.
    const solvent = this.funds > 0;
    const best = Math.max(this.demand.res, this.demand.com, this.demand.ind, this.demand.off);
    if (solvent) this.city.grow(this.demand, Math.min(9, Math.round(2 + best * 9)));
    for (const z of ZONES) {
      if (z !== 'park' && this.demand[z] < -0.45) this.city.abandon(z, 1);
    }

    const unemployment = workers > 40 ? Math.max(0, 1 - jobs / workers) : 0;
    const target = clamp01(0.72 - unemployment * 1.1 - (solvent ? 0 : 0.4) - vacancy * 0.3);
    this.mood += (target - this.mood) * 0.2;

    this.cache = {
      day: this.day,
      population: this.population,
      jobs,
      residentCap: cap,
      unemployment,
      vacancy,
      funds: Math.round(this.funds),
      income: Math.round(this.income),
      upkeep: Math.round(this.upkeep),
      demand: this.demand,
      buildings: b.length,
      roadKm: km,
      mood: this.mood,
    };
  }

  private cache: Stats = {
    day: 0, population: 0, jobs: 0, residentCap: 0, unemployment: 0, vacancy: 0,
    funds: 55000, income: 0, upkeep: 0,
    demand: { res: 0.7, com: 0.4, ind: 0.35, off: 0, park: 0 },
    buildings: 0, roadKm: 0, mood: 0.5,
  };

  get stats(): Stats {
    return this.cache;
  }

  /** What a road costs to lay, per metre, by kind. */
  static price(kind: 'street' | 'avenue') {
    return kind === 'avenue' ? 22 : 12;
  }

  spend(amount: number): boolean {
    if (amount > this.funds) return false;
    this.funds -= amount;
    this.cache = { ...this.cache, funds: Math.round(this.funds) };
    return true;
  }
}

const clamp = (v: number) => Math.max(-1, Math.min(1, v));
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (v: number, a: number, b: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
