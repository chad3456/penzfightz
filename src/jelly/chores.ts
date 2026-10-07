/**
 * The work of the day.
 *
 * Everything a person does in Jellynoor goes through here: the bushes and how
 * they grow, the tools, the leaf as it moves from the slope to the trough to
 * the roller to the chest, the cow, the chai, the firewood, the washing and
 * the lamps. Nothing in this file knows about three.js; it is the estate's
 * ledger, and the world draws whatever it says.
 */

export type Tool = 'hand' | 'basket' | 'can' | 'shears' | 'broom' | 'sapling' | 'pot' | 'axe';

export const TOOL_NAME: Record<Tool, string> = {
  hand: 'bare hands', basket: 'plucking basket', can: 'watering can', shears: 'shears',
  broom: 'broom', sapling: 'sapling', pot: 'milk pot', axe: 'axe',
};

/* ───────── the bushes ───────── */

export interface Bush {
  x: number; z: number; y: number; row: number;
  /** false means an empty plot waiting for a sapling. */
  planted: boolean;
  age: number;      // 0 just planted → 1 in full bearing
  water: number;    // 0 parched → 1 well watered
  weeds: number;    // 0 clean → 1 smothered
  flush: number;    // 0 → 1, a flush ready to pluck
  bushy: number;    // 0 → 1, grown above the plucking table and due a prune
}

export function makeBush(x: number, z: number, y: number, row: number, planted: boolean, age = 1): Bush {
  return { x, z, y, row, planted, age: planted ? age : 0, water: planted ? 0.55 + Math.random() * 0.3 : 0, weeds: planted ? Math.random() * 0.25 : 0, flush: planted ? Math.random() * 0.8 : 0, bushy: planted ? Math.random() * 0.3 : 0 };
}

/** How well a bush is doing, which is what decides how fast the next flush comes. */
export function health(b: Bush): number {
  if (!b.planted) return 0;
  return Math.max(0, Math.min(1, (0.25 + b.water * 0.75) * (1 - b.weeds * 0.55) * (1 - b.bushy * 0.3) * (0.3 + b.age * 0.7)));
}

/* ───────── what the player is carrying ───────── */

export interface Inventory {
  owned: Set<Tool>;
  hand: Tool;
  saplings: number;
  can: number;      // 0..1 of a canful
  milk: number;     // 0..1 of a potful
  leaf: number;     // kg of green leaf in the basket
  basketMax: number;
  firewood: number;
  coins: number;
}

/** The leaf as it moves through the factory, in kilos. */
export interface Factory { green: number; withered: number; rolled: number; dried: number; chests: number }

export interface Upgrade { id: string; name: string; note: string; cost: number; bought: boolean }

export interface Stats {
  pluckedToday: number; pluckedTotal: number; weighedToday: number;
  chestsTotal: number; chaiServed: number; choresToday: number; choresTotal: number;
  planted: number; bestDay: number;
}

/* ───────── spots: the fixed places where work happens ───────── */

export type SpotKind =
  | 'nursery' | 'tap' | 'toolrack' | 'weigh' | 'wither' | 'roll' | 'dry' | 'pack'
  | 'cow' | 'coop' | 'chai' | 'serve' | 'chop' | 'woodpile' | 'line' | 'sweep'
  | 'spring' | 'lantern' | 'bell' | 'bed' | 'shop';

export interface Spot {
  id: string;
  kind: SpotKind;
  x: number; z: number; y: number;
  r: number;
  /** Set by the world so a completed job can make the right thing wobble. */
  onDo?: () => void;
  /** Lanterns and the like carry a little state of their own. */
  lit?: boolean;
  swept?: boolean;
  hung?: boolean;
}

export interface Action {
  /** What the button says. */
  label: string;
  /** The longer line under it. */
  hint: string;
  /** Seconds of holding to finish. */
  secs: number;
  /** The tool that gets put in the hand for it. */
  tool: Tool;
  /** If set, the job cannot start and this says why. */
  blocked?: string;
  kind: string;
  bush?: Bush;
  spot?: Spot;
}

export const UPGRADES: Upgrade[] = [
  { id: 'basket', name: 'A deeper basket', note: 'Carry 18 kg of green leaf instead of 10.', cost: 60, bought: false },
  { id: 'shears', name: 'Sharp shears', note: 'Pruning and plucking take half as long.', cost: 110, bought: false },
  { id: 'hose', name: 'A pipe from the tank', note: 'The can fills itself as you walk the rows.', cost: 180, bought: false },
];

const HOUR = 24;

/* ───────── the estate ───────── */

export class Estate {
  bushes: Bush[] = [];
  spots: Spot[] = [];
  inv: Inventory = {
    owned: new Set<Tool>(['hand', 'basket']),
    hand: 'hand', saplings: 0, can: 0, milk: 0, leaf: 0, basketMax: 10, firewood: 0, coins: 12,
  };
  factory: Factory = { green: 0, withered: 0, rolled: 0, dried: 0, chests: 0 };
  upgrades = UPGRADES.map((u) => ({ ...u }));
  stats: Stats = { pluckedToday: 0, pluckedTotal: 0, weighedToday: 0, chestsTotal: 0, chaiServed: 0, choresToday: 0, choresTotal: 0, planted: 0, bestDay: 0 };

  /** The clock, in hours. The day starts at six. */
  clock = 7;
  day = 1;
  /** Real seconds per game hour. */
  hourSecs = 26;
  raining = false;
  rainT = 0;

  /** A queue of things to tell the player. */
  toasts: { text: string; t: number }[] = [];

  has(id: string) { return this.upgrades.find((u) => u.id === id)?.bought ?? false; }

  say(text: string) {
    this.toasts.push({ text, t: 0 });
    if (this.toasts.length > 3) this.toasts.shift();
  }

  /* ── time and growth ── */

  step(dt: number) {
    const prev = this.clock;
    this.clock = (this.clock + dt / this.hourSecs) % HOUR;
    if (this.clock < prev) this.newDay();

    for (const t of this.toasts) t.t += dt;
    while (this.toasts.length && this.toasts[0].t > 4.5) this.toasts.shift();

    // weather: a hill station gets a shower most afternoons
    this.rainT -= dt;
    if (this.rainT <= 0) {
      this.rainT = 50 + Math.random() * 120;
      const wet = this.clock > 13 && this.clock < 18;
      this.raining = Math.random() < (wet ? 0.45 : 0.1);
    }

    // the garden, stepped in game hours
    const gh = dt / this.hourSecs;
    const sun = Math.max(0, Math.sin(((this.clock - 6) / 12) * Math.PI));
    for (const b of this.bushes) {
      if (!b.planted) { b.weeds = Math.min(1, b.weeds + gh * 0.012); continue; }
      if (this.raining) b.water = Math.min(1, b.water + gh * 0.5);
      else b.water = Math.max(0, b.water - gh * (0.018 + sun * 0.03));
      if (this.has('hose')) b.water = Math.min(1, b.water + gh * 0.02);
      b.weeds = Math.min(1, b.weeds + gh * 0.009);
      b.age = Math.min(1, b.age + gh * 0.006);
      const h = health(b);
      b.flush = Math.min(1, b.flush + gh * 0.028 * h);
      b.bushy = Math.min(1, b.bushy + gh * 0.0065);
    }

    // leaf wilts in the troughs on its own; the rest needs hands
    if (this.factory.green > 0) {
      const w = Math.min(this.factory.green, gh * 1.6);
      this.factory.green -= w; this.factory.withered += w;
    }
  }

  private newDay() {
    const made = this.stats.weighedToday;
    this.stats.bestDay = Math.max(this.stats.bestDay, made);
    this.day++;
    this.stats.pluckedToday = 0; this.stats.weighedToday = 0; this.stats.choresToday = 0;
    for (const s of this.spots) { if (s.kind === 'lantern') s.lit = false; if (s.kind === 'sweep') s.swept = false; if (s.kind === 'line') s.hung = false; }
  }

  /** Jump to six the next morning. */
  sleep() {
    const hoursLeft = (HOUR - this.clock) + 6;
    for (let i = 0; i < hoursLeft; i++) this.step(this.hourSecs);
    this.clock = 6;
    this.say(`Day ${this.day}. The mist is in the valley again.`);
  }

  get clockText() {
    const h = Math.floor(this.clock), m = Math.floor((this.clock - h) * 60);
    const ap = h < 12 ? 'am' : 'pm';
    const hh = h % 12 === 0 ? 12 : h % 12;
    return `${hh}:${String(m).padStart(2, '0')} ${ap}`;
  }
  get partOfDay(): 'dawn' | 'morning' | 'afternoon' | 'dusk' | 'night' {
    const c = this.clock;
    if (c < 6.5) return 'dawn';
    if (c < 12) return 'morning';
    if (c < 17) return 'afternoon';
    if (c < 19.2) return 'dusk';
    return 'night';
  }

  /* ── finding the job under the player's nose ── */

  nearestBush(x: number, z: number, r = 2.2): Bush | null {
    let best: Bush | null = null, bd = r * r;
    for (const b of this.bushes) {
      const d = (b.x - x) ** 2 + (b.z - z) ** 2;
      if (d < bd) { bd = d; best = b; }
    }
    return best;
  }

  nearestSpot(x: number, z: number): Spot | null {
    let best: Spot | null = null, bd = 1e9;
    for (const s of this.spots) {
      const d = Math.hypot(s.x - x, s.z - z);
      if (d < s.r && d < bd) { bd = d; best = s; }
    }
    return best;
  }

  /**
   * What this patch of ground offers. A spot in the village wins over a bush,
   * since you have to be standing almost on top of a spot to reach it.
   */
  actionAt(x: number, z: number): Action | null {
    const spot = this.nearestSpot(x, z);
    if (spot) { const a = this.spotAction(spot); if (a) return a; }
    const b = this.nearestBush(x, z);
    if (b) return this.bushAction(b);
    return null;
  }

  private fast(secs: number, toolled = true) {
    return toolled && this.has('shears') ? secs * 0.5 : secs;
  }

  private bushAction(b: Bush): Action {
    if (!b.planted) {
      return {
        kind: 'plant', bush: b, tool: 'sapling', secs: 2.2,
        label: 'Plant a sapling', hint: 'An empty plot. Something should be growing here.',
        blocked: this.inv.saplings > 0 ? undefined : 'Fetch a sapling from the nursery first',
      };
    }
    if (b.weeds > 0.55) return { kind: 'weed', bush: b, tool: 'hand', secs: 1.6, label: 'Pull the weeds', hint: 'Smothered. The bush is losing the light.' };
    if (b.water < 0.3) {
      return {
        kind: 'water', bush: b, tool: 'can', secs: 1.4, label: 'Water the bush', hint: 'Dry at the root.',
        blocked: this.inv.can > 0.05 ? undefined : 'The can is empty. Fill it at the tank',
      };
    }
    if (b.bushy > 0.7) return { kind: 'prune', bush: b, tool: 'shears', secs: this.fast(2.0), label: 'Prune it back', hint: 'Grown above the table. Cut it level and it will flush better.' };
    if (b.age < 0.45) return { kind: 'tend', bush: b, tool: 'hand', secs: 1.2, label: 'Firm the soil', hint: 'Too young to pluck. Give it a week.' };
    if (b.flush >= 1) {
      return {
        kind: 'pluck', bush: b, tool: 'basket', secs: this.fast(1.5), label: 'Pluck two leaves and a bud',
        hint: 'A flush is standing proud of the table.',
        blocked: this.inv.leaf < this.inv.basketMax ? undefined : 'The basket is full. Take it to the weighing shed',
      };
    }
    return { kind: 'look', bush: b, tool: 'hand', secs: 0.8, label: 'Look it over', hint: `Flush ${Math.round(b.flush * 100)}% grown. Not yet.` };
  }

  private spotAction(s: Spot): Action | null {
    const inv = this.inv, f = this.factory;
    const A = (o: Partial<Action> & { label: string; kind: string }): Action =>
      ({ secs: 1.5, tool: 'hand', hint: '', spot: s, ...o } as Action);

    switch (s.kind) {
      case 'nursery':
        return A({ kind: 'take-sapling', label: 'Take a sapling', hint: 'Nursery bags, ready to go out to the empty plots.', secs: 1.2, tool: 'sapling', blocked: inv.saplings < 3 ? undefined : 'Your hands are full of saplings' });
      case 'tap':
        return A({ kind: 'fill-can', label: 'Fill the can', hint: 'The tap under the tank.', secs: 1.6, tool: 'can', blocked: inv.can < 0.95 ? undefined : 'The can is already full' });
      case 'spring':
        return A({ kind: 'fill-can', label: 'Fill the can at the stream', hint: 'Cold water straight off the hill, and nearer than the tank.', secs: 1.8, tool: 'can', blocked: inv.can < 0.95 ? undefined : 'The can is already full' });
      case 'toolrack':
        return A({ kind: 'tools', label: 'Take what you need', hint: 'Shears, a can, a broom, an axe and a pot, all on their hooks.', secs: 1.0, tool: 'hand', blocked: inv.owned.size >= 7 ? 'You already have everything on this rack' : undefined });
      case 'weigh':
        return A({ kind: 'weigh', label: 'Weigh in the leaf', hint: 'The scale at the muster shed settles the day.', secs: 2.0, tool: 'basket', blocked: inv.leaf > 0.1 ? undefined : 'Nothing in the basket yet' });
      case 'wither':
        return A({ kind: 'spread', label: 'Spread the leaf to wither', hint: 'Thin and even, or it heats in the middle.', secs: 2.2, tool: 'hand', blocked: f.green > 0.5 ? undefined : 'No green leaf waiting. Weigh some in first' });
      case 'roll':
        return A({ kind: 'roll', label: 'Roll the withered leaf', hint: 'Bruise it so it takes the twist and starts to turn.', secs: 2.6, tool: 'hand', blocked: f.withered > 0.5 ? undefined : 'Nothing withered yet' });
      case 'dry':
        return A({ kind: 'dry', label: 'Fire the drier', hint: 'Stop the leaf before it goes too far.', secs: 2.4, tool: 'hand', blocked: f.rolled > 0.5 ? undefined : 'Nothing rolled and waiting' });
      case 'pack':
        return A({ kind: 'pack', label: 'Pack a chest', hint: 'Twelve kilos of made tea to a chest.', secs: 2.6, tool: 'hand', blocked: f.dried >= 12 ? undefined : `${Math.floor(f.dried)}/12 kg of made tea. Keep going` });
      case 'cow':
        if (inv.milk > 0.9) return A({ kind: 'feed-cow', label: 'Feed the cow', hint: 'She leans into it and the whole shed wobbles.', secs: 1.8 });
        return A({ kind: 'milk', label: 'Milk the cow', hint: 'Steady hands. She is mostly made of wobble.', secs: 3.0, tool: 'pot' });
      case 'coop':
        return A({ kind: 'feed-hens', label: 'Feed the hens', hint: 'They come at a run, all at once.', secs: 1.6 });
      case 'chai':
        return A({ kind: 'brew', label: 'Put the chai on', hint: 'Milk, water, leaf, ginger, and a long boil.', secs: 3.0, blocked: inv.milk > 0.3 ? undefined : 'You need a pot of milk from the cow' });
      case 'serve':
        return A({ kind: 'serve', label: 'Serve the chai', hint: 'Half the village is waiting with a glass.', secs: 1.4, blocked: this.brewed > 0 ? undefined : 'Nothing brewed. Put the pot on first' });
      case 'chop':
        return A({ kind: 'chop', label: 'Chop firewood', hint: 'The log gives like a sweet and springs back.', secs: 2.4, tool: 'axe', blocked: inv.firewood < 6 ? undefined : 'You are carrying all the wood you can' });
      case 'woodpile':
        return A({ kind: 'stack', label: 'Stack the wood', hint: 'Bark out, so the rain runs off.', secs: 1.8, tool: 'axe', blocked: inv.firewood > 0 ? undefined : 'Chop some wood at the block first' });
      case 'line':
        return A({ kind: 'hang', label: 'Hang out the washing', hint: 'It will be dry by the time the mist comes back.', secs: 2.2, blocked: s.hung ? 'Already out on the line' : undefined });
      case 'sweep':
        return A({ kind: 'sweep', label: 'Sweep the yard', hint: 'Leaves, dust and a good deal of fallen jelly.', secs: 2.2, tool: 'broom', blocked: s.swept ? 'This corner is clean' : undefined });
      case 'lantern':
        return A({ kind: 'light', label: 'Light the lamp', hint: 'The valley goes dark very quickly up here.', secs: 1.2, blocked: s.lit ? 'Already burning' : (this.clock > 17.6 || this.clock < 6.4 ? undefined : 'Too early. Wait for dusk') });
      case 'bell':
        return A({ kind: 'bell', label: 'Ring the bell', hint: 'Once at dawn, and the hill wakes up.', secs: 1.0 });
      case 'bed':
        return A({ kind: 'sleep', label: 'Turn in for the night', hint: 'Everything settles overnight, including you.', secs: 1.6, blocked: this.clock > 18.5 || this.clock < 4 ? undefined : 'Not tired yet. There is light left' });
      case 'shop':
        return A({ kind: 'shop', label: 'Look at the estate store', hint: 'A deeper basket, sharper shears, a pipe to the rows.', secs: 0.6 });
    }
    return null;
  }

  /** Chai that has been brewed and not yet poured, in glasses. */
  brewed = 0;

  /* ── doing it ── */

  /** Carry out a finished action. Returns a short line for the toast, if any. */
  complete(a: Action): { text?: string; kick?: number; sound?: string } {
    const inv = this.inv, f = this.factory, b = a.bush, s = a.spot;
    this.stats.choresToday++; this.stats.choresTotal++;
    const morning = this.clock >= 6 && this.clock < 12;

    switch (a.kind) {
      case 'plant': {
        if (!b) break;
        inv.saplings--;
        b.planted = true; b.age = 0.02; b.water = 0.7; b.weeds = 0; b.flush = 0; b.bushy = 0;
        this.stats.planted++;
        return { text: 'Planted. Water it in and leave it alone.', kick: 0.5, sound: 'plant' };
      }
      case 'weed': if (b) { b.weeds = 0; return { text: 'Weeded clean.', kick: 0.35, sound: 'pull' }; } break;
      case 'water': {
        if (!b) break;
        const use = Math.min(inv.can, 0.22);
        inv.can -= use; b.water = Math.min(1, b.water + use * 4);
        return { text: inv.can < 0.05 ? 'That is the last of the can.' : 'Watered.', kick: 0.3, sound: 'water' };
      }
      case 'prune': if (b) { b.bushy = 0; b.flush = Math.max(0, b.flush - 0.2); return { text: 'Cut level with the table.', kick: 0.8, sound: 'snip' }; } break;
      case 'tend': if (b) { b.water = Math.min(1, b.water + 0.1); b.weeds = Math.max(0, b.weeds - 0.3); return { text: 'Firmed in.', kick: 0.3 }; } break;
      case 'look': return { text: b ? `${Math.round(b.flush * 100)}% of a flush. ${b.water < 0.5 ? 'And thirsty.' : 'Coming on well.'}` : '' };
      case 'pluck': {
        if (!b) break;
        const kg = (0.5 + b.age * 0.9) * (morning ? 1.25 : 1) * (0.8 + health(b) * 0.4);
        const take = Math.min(kg, inv.basketMax - inv.leaf);
        inv.leaf += take; b.flush = 0; b.bushy = Math.min(1, b.bushy + 0.05);
        this.stats.pluckedToday += take; this.stats.pluckedTotal += take;
        return { text: `+${take.toFixed(1)} kg${morning ? ' · the morning leaf is the best' : ''}`, kick: 0.9, sound: 'pluck' };
      }
      case 'take-sapling': inv.saplings++; return { text: `Sapling in hand (${inv.saplings}).`, kick: 0.4, sound: 'pick' };
      case 'fill-can': inv.can = 1; return { text: 'Can full.', kick: 0.3, sound: 'water' };
      case 'tools': {
        const all: Tool[] = ['can', 'shears', 'broom', 'axe', 'pot'];
        const got = all.find((t) => !inv.owned.has(t));
        if (got) { inv.owned.add(got); return { text: `Took the ${TOOL_NAME[got]}.`, kick: 0.5, sound: 'pick' }; }
        break;
      }
      case 'weigh': {
        const kg = inv.leaf;
        inv.leaf = 0; f.green += kg;
        const coins = Math.round(kg * 3);
        inv.coins += coins;
        this.stats.weighedToday += kg;
        return { text: `${kg.toFixed(1)} kg weighed in. ${coins} coins.`, kick: 0.9, sound: 'weigh' };
      }
      case 'spread': { const n = Math.min(f.green, 8); f.green -= n; f.withered += n * 0.55; return { text: `${n.toFixed(1)} kg spread out to wither.`, kick: 0.5, sound: 'spread' }; }
      case 'roll': { const n = Math.min(f.withered, 6); f.withered -= n; f.rolled += n; return { text: `${n.toFixed(1)} kg rolled. It smells of the hill now.`, kick: 0.7, sound: 'roll' }; }
      case 'dry': { const n = Math.min(f.rolled, 6); f.rolled -= n; f.dried += n * 0.72; return { text: `${(n * 0.72).toFixed(1)} kg of made tea.`, kick: 0.6, sound: 'fire' }; }
      case 'pack': {
        f.dried -= 12; f.chests++; this.stats.chestsTotal++;
        inv.coins += 55;
        return { text: `Chest ${this.stats.chestsTotal} packed and nailed. 55 coins.`, kick: 1.1, sound: 'pack' };
      }
      case 'milk': inv.milk = 1; return { text: 'A full pot, still warm.', kick: 0.8, sound: 'milk' };
      case 'feed-cow': return { text: 'She leans in and the shed wobbles.', kick: 1.2, sound: 'moo' };
      case 'feed-hens': return { text: 'The hens arrive all at once.', kick: 0.7, sound: 'cluck' };
      case 'brew': {
        inv.milk = 0; this.brewed = 6;
        return { text: 'Six glasses on the boil.', kick: 0.6, sound: 'boil' };
      }
      case 'serve': {
        const n = Math.min(this.brewed, 2);
        this.brewed -= n; this.stats.chaiServed += n; inv.coins += n * 5;
        return { text: `${n} glasses poured. ${n * 5} coins.`, kick: 0.5, sound: 'pour' };
      }
      case 'chop': inv.firewood++; return { text: 'The log gives, then springs back.', kick: 1.3, sound: 'chop' };
      case 'stack': { const n = inv.firewood; inv.firewood = 0; inv.coins += n * 2; return { text: `${n} logs stacked.`, kick: 0.6, sound: 'wood' }; }
      case 'hang': if (s) { s.hung = true; return { text: 'Out on the line.', kick: 0.4, sound: 'cloth' }; } break;
      case 'sweep': if (s) { s.swept = true; inv.coins += 2; return { text: 'Swept.', kick: 0.4, sound: 'sweep' }; } break;
      case 'light': if (s) { s.lit = true; return { text: 'Lit.', kick: 0.3, sound: 'light' }; } break;
      case 'bell': return { text: 'The note rolls down the whole valley.', kick: 1.4, sound: 'bell' };
      case 'sleep': this.sleep(); return { text: '', kick: 0, sound: 'sleep' };
      case 'shop': return {};
    }
    return {};
  }

  buy(id: string): string {
    const u = this.upgrades.find((x) => x.id === id);
    if (!u || u.bought) return 'Already yours';
    if (this.inv.coins < u.cost) return 'Not enough coins';
    this.inv.coins -= u.cost; u.bought = true;
    if (id === 'basket') this.inv.basketMax = 18;
    this.say(`${u.name}. ${u.note}`);
    return '';
  }

  /** A short list of what is worth doing right now, for the day's board. */
  todo(): string[] {
    const out: string[] = [];
    const ready = this.bushes.filter((b) => b.planted && b.flush >= 1).length;
    const dry = this.bushes.filter((b) => b.planted && b.water < 0.3).length;
    const weedy = this.bushes.filter((b) => b.planted && b.weeds > 0.55).length;
    const empty = this.bushes.filter((b) => !b.planted).length;
    const shaggy = this.bushes.filter((b) => b.planted && b.bushy > 0.7).length;
    if (ready) out.push(`${ready} bushes in flush`);
    if (this.inv.leaf > this.inv.basketMax * 0.8) out.push('basket nearly full');
    if (dry) out.push(`${dry} bushes want water`);
    if (weedy) out.push(`${weedy} under weeds`);
    if (shaggy) out.push(`${shaggy} need pruning`);
    if (empty) out.push(`${empty} empty plots`);
    if (this.factory.withered > 0.5) out.push(`${this.factory.withered.toFixed(0)} kg to roll`);
    if (this.factory.rolled > 0.5) out.push(`${this.factory.rolled.toFixed(0)} kg to dry`);
    if (this.factory.dried >= 12) out.push('a chest can be packed');
    const dusk = this.clock > 17.6 || this.clock < 6.4;
    const unlit = this.spots.filter((s) => s.kind === 'lantern' && !s.lit).length;
    if (dusk && unlit) out.push(`${unlit} lamps unlit`);
    return out.slice(0, 5);
  }
}
